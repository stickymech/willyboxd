import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiFetch, API_ENDPOINTS } from "../lib/api";
import type { DiaryEntry } from "@willyboxd/shared";
import { getPosterUrl } from "@willyboxd/shared";
import { Header } from "../components/Header";
import { Stars } from "../components/Stars";
import { useAuth } from "../lib/auth";

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function Diary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["diary"],
    queryFn: () => apiFetch<{ entries: DiaryEntry[] }>(API_ENDPOINTS.diary.list),
    enabled: !!user,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(API_ENDPOINTS.diary.delete(id), { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary"] });
    },
  });

  const filteredEntries = useMemo(() => {
    if (!data) return [];
    const term = filter.trim().toLowerCase();
    if (!term) return data.entries;
    return data.entries.filter((entry) => {
      const title = entry.film?.title?.toLowerCase() ?? "";
      const review = entry.review?.toLowerCase() ?? "";
      return (
        title.includes(term) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(term)) ||
        review.includes(term)
      );
    });
  }, [data, filter]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text mb-6">Your Diary</h1>

        {!user ? (
          <p className="text-text-subtle">
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>{" "}
            to view your diary.
          </p>
        ) : isLoading ? (
          <p className="text-text-subtle">Loading...</p>
        ) : !data || data.entries.length === 0 ? (
          <p className="text-text-subtle">
            Your diary is empty. Rate and review films from their detail pages to log them here.
          </p>
        ) : (
          <>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by title, tag, or review..."
              aria-label="Filter diary entries"
              className="mb-6 w-full max-w-xs px-4 py-2 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
            />
            {filteredEntries.length === 0 ? (
              <p className="text-text-subtle">No diary entries match your filter.</p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredEntries.map((entry) => (
              <li key={entry.id} className="py-4 flex items-start gap-4">
                {entry.film && (
                   <Link to={`/films/${entry.film.id}?type=${entry.film?.type || "movie"}`} className="shrink-0">
                    <img
                      src={getPosterUrl(entry.film.poster_path, "small") || "/placeholder-poster.jpg"}
                      alt={entry.film.title}
                      className="w-14 h-20 object-cover rounded"
                    />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-text-subtle">{formatDate(entry.watched_date)}</span>
                    {entry.rewatch && (
                      <span className="text-xs px-1.5 py-0.5 bg-surface-2 rounded text-text-subtle">
                        Rewatch
                      </span>
                    )}
                  </div>
                  {entry.film && (
                     <Link
                       to={`/films/${entry.film.id}?type=${entry.film?.type || "movie"}`}
                       className="text-lg font-semibold text-text hover:text-accent"
                     >
                      {entry.film.title}
                    </Link>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1 items-center">
                    {entry.rating != null && <Stars value={entry.rating} size="sm" />}
                    {entry.tags.map((tag) => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 bg-surface rounded text-text-subtle">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {entry.review && <p className="mt-2 text-sm text-text-muted">{entry.review}</p>}
                </div>
                <button
                  onClick={() => remove.mutate(entry.id)}
                  disabled={remove.isPending}
                  className="shrink-0 text-xs text-text-subtle hover:text-error disabled:opacity-50"
                >
                  Delete
                </button>
              </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}
