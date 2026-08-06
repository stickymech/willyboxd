import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiFetch, API_ENDPOINTS } from "../lib/api";
import type { WatchlistEntry } from "@willyboxd/shared";
import { FilmCard } from "../components/FilmCard";
import { Header } from "../components/Header";
import { useAuth } from "../lib/auth";

export function Watchlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => apiFetch<{ entries: WatchlistEntry[] }>(API_ENDPOINTS.watchlist.list),
    enabled: !!user,
  });

  const remove = useMutation({
    mutationFn: (filmId: number) =>
      apiFetch(API_ENDPOINTS.watchlist.remove(filmId), { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const filteredEntries = useMemo(() => {
    if (!data) return [];
    const term = filter.trim().toLowerCase();
    if (!term) return data.entries;
    return data.entries.filter(
      (entry) => entry.film && entry.film.title.toLowerCase().includes(term),
    );
  }, [data, filter]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text mb-6">Your Watchlist</h1>

        {!user ? (
          <p className="text-text-subtle">
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>{" "}
            to view your watchlist.
          </p>
        ) : isLoading ? (
          <p className="text-text-subtle">Loading...</p>
        ) : !data || data.entries.length === 0 ? (
          <p className="text-text-subtle">
            Your watchlist is empty. Add films from their detail pages to save them here.
          </p>
        ) : (
          <>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by title..."
              aria-label="Filter watchlist by title"
              className="mb-6 w-full max-w-xs px-4 py-2 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
            />
            {filteredEntries.length === 0 ? (
              <p className="text-text-subtle">No watchlist entries match your filter.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {filteredEntries.map((entry) =>
                  entry.film ? (
                    <div key={entry.id} className="relative">
                      <FilmCard film={entry.film} />
                      <button
                        onClick={() => remove.mutate(entry.film_id)}
                        disabled={remove.isPending}
                        className="mt-1 text-xs text-text-subtle hover:text-error disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
