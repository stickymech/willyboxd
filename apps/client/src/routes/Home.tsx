import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, API_ENDPOINTS } from "../lib/api";
import type { MediaItem } from "@willyboxd/shared";
import { FilmCard } from "../components/FilmCard";
import { Header } from "../components/Header";
import { InlineError } from "../components/InlineError";
import { useCardRatings } from "../hooks/useCardRatings";

interface QueryState {
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

interface SectionProps {
  title: string;
  data: { results: MediaItem[] } | undefined;
  isLoading: boolean;
  query: QueryState;
  ratings: Record<string, Partial<Pick<MediaItem, "imdb_id" | "imdb_rating" | "rt_rating" | "metacritic_rating">>>;
}

function FilmSection({ title, data, isLoading, query, ratings }: SectionProps) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {data.results.slice(0, 10).map((film) => (
            <FilmCard key={film.id} film={{ ...film, ...ratings[`${film.id}:${film.type}`] }} />
          ))}
        </div>
      ) : query.isError ? (
        <InlineError
          message={query.error instanceof Error ? query.error.message : "Failed to load."}
          onRetry={() => query.refetch()}
        />
      ) : isLoading ? (
        <p className="text-text-subtle">Loading...</p>
      ) : null}
    </section>
  );
}

export function Home() {
  const trendingQuery = useQuery({
    queryKey: ["films", "trending"],
    queryFn: () => apiFetch<{ results: MediaItem[] }>(API_ENDPOINTS.films.trending),
    staleTime: 10 * 60 * 1000,
  });

  const popularQuery = useQuery({
    queryKey: ["films", "popular"],
    queryFn: () => apiFetch<{ results: MediaItem[] }>(API_ENDPOINTS.films.popular),
    staleTime: 10 * 60 * 1000,
  });

  const trendingAnimeQuery = useQuery({
    queryKey: ["films", "anime", "trending"],
    queryFn: () => apiFetch<{ results: MediaItem[] }>(`${API_ENDPOINTS.films.anime}?time=week`),
    staleTime: 10 * 60 * 1000,
  });

  const topAnimeQuery = useQuery({
    queryKey: ["films", "anime", "top"],
    queryFn: () => apiFetch<{ results: MediaItem[] }>(API_ENDPOINTS.films.anime),
    staleTime: 10 * 60 * 1000,
  });

  const items = useMemo(() => {
    const results: MediaItem[] = [];
    for (const q of [trendingAnimeQuery.data, topAnimeQuery.data, trendingQuery.data, popularQuery.data]) {
      if (q?.results) results.push(...q.results);
    }
    return results;
  }, [trendingAnimeQuery.data, topAnimeQuery.data, trendingQuery.data, popularQuery.data]);

  const ratings = useCardRatings(items);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <FilmSection title="Trending Anime" data={trendingAnimeQuery.data} isLoading={trendingAnimeQuery.isLoading} query={trendingAnimeQuery} ratings={ratings} />
        <FilmSection title="Top Anime" data={topAnimeQuery.data} isLoading={topAnimeQuery.isLoading} query={topAnimeQuery} ratings={ratings} />
        <FilmSection title="Trending This Week" data={trendingQuery.data} isLoading={trendingQuery.isLoading} query={trendingQuery} ratings={ratings} />
        <FilmSection title="Popular" data={popularQuery.data} isLoading={popularQuery.isLoading} query={popularQuery} ratings={ratings} />
      </main>
    </>
  );
}
