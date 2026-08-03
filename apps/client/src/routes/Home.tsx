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

  const { data: trendingAnime } = useQuery({
    queryKey: ["films", "anime", "trending"],
    queryFn: () => apiFetch<{ results: MediaItem[] }>(`${API_ENDPOINTS.films.anime}?time=week`),
    staleTime: 10 * 60 * 1000,
  });

  const { data: topAnime } = useQuery({
    queryKey: ["films", "anime", "top"],
    queryFn: () => apiFetch<{ results: MediaItem[] }>(API_ENDPOINTS.films.anime),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Trending Anime</h2>
          {trendingAnime ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {trendingAnime.results.slice(0, 10).map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          ) : (
            <p className="text-text-subtle">Loading...</p>
          )}
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Top Anime</h2>
          {topAnime ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {topAnime.results.slice(0, 10).map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          ) : (
            <p className="text-text-subtle">Loading...</p>
          )}
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Trending This Week</h2>
          {trending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {trending.results.slice(0, 10).map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          ) : (
            <p className="text-text-subtle">Loading...</p>
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
            <p className="text-text-subtle">Loading...</p>
          )}
        </section>
      </main>
    </>
  );
}
