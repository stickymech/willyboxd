import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, API_ENDPOINTS } from "../lib/api";
import type { MediaItem } from "@willyboxd/shared";

type RatingsMap = Record<string, Partial<Pick<MediaItem, "imdb_id" | "imdb_rating" | "rt_rating" | "metacritic_rating">>>;

function scorelessIds(items: MediaItem[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const film of items) {
    if (film.vote_average > 0) continue;
    const key = `${film.id}:${film.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ids.push(key);
  }
  return ids;
}

export function useCardRatings(items: MediaItem[] | undefined): RatingsMap {
  const ids = useMemo(() => (items ? scorelessIds(items) : []), [items]);

  const { data } = useQuery({
    queryKey: ["films", "ratings", ids],
    queryFn: () => apiFetch<{ ratings: RatingsMap }>(API_ENDPOINTS.films.ratings(ids)),
    enabled: ids.length > 0,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  return data?.ratings ?? {};
}