import { useQuery } from "@tanstack/react-query";
import { apiFetch, API_ENDPOINTS } from "../lib/api";
import type { MediaItem } from "@willyboxd/shared";
import { FilmCard } from "../components/FilmCard";
import { Header } from "../components/Header";

export function Home() {
  const { data: trending } = useQuery({
    queryKey: ["films", "trending"],
    queryFn: () => apiFetch<{ results: MediaItem[] }>(API_ENDPOINTS.films.trending),
    staleTime: 10 * 60 * 1000,
  });

  const { data: popular } = useQuery({
    queryKey: ["films", "popular"],
    queryFn: () => apiFetch<{ results: MediaItem[] }>(API_ENDPOINTS.films.popular),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Willyboxd</h1>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Trending This Week</h2>
          {trending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {trending.results.slice(0, 10).map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500">Loading...</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Popular</h2>
          {popular ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {popular.results.slice(0, 10).map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500">Loading...</p>
          )}
        </section>
      </main>
    </>
  );
}
