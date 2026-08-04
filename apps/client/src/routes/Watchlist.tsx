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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {data.entries.map((entry) =>
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
      </main>
    </>
  );
}
