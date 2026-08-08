import {
  TMDB_RATE_LIMIT_DELAY,
  TMDB_CACHE_TTL_DAYS,
  type FilmDetail,
  type MediaItem,
} from "@willyboxd/shared";
import { omdbService } from "./omdb";

interface TmdbCacheEntry {
  data: unknown;
  timestamp: number;
}

const API_KEY = process.env.TMDB_API_KEY || "";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

if (!API_KEY && process.env.NODE_ENV !== "test") {
  console.warn("⚠️  TMDB_API_KEY not set. Film search and details will not work.");
  console.warn("   Get a free key at https://developer.themoviedb.org/docs");
}

const cache = new Map<string, TmdbCacheEntry>();
const requestQueue: Array<() => void> = [];
let lastRequestTime = 0;
let processing = false;

function waitForRateLimit(): Promise<void> {
  return new Promise((resolve) => {
    const processQueue = () => {
      const now = Date.now();
      const wait = Math.max(0, TMDB_RATE_LIMIT_DELAY - (now - lastRequestTime));

      setTimeout(() => {
        lastRequestTime = Date.now();
        const next = requestQueue.shift();
        if (next) {
          next();
        } else {
          processing = false;
        }
        resolve();
      }, wait);
    };

    if (processing) {
      requestQueue.push(processQueue);
    } else {
      processing = true;
      processQueue();
    }
  });
}

async function fetchFromApi<T>(path: string, query: Record<string, string | number> = {}): Promise<T> {
  const cacheKey = `${path}?${new URLSearchParams(query as Record<string, string>).toString()}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < TMDB_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
    return cached.data as T;
  }

  await waitForRateLimit();

  const params = new URLSearchParams({
    api_key: API_KEY,
    language: "en-US",
    ...Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)])),
  });

  const url = `${BASE_URL}/${path}?${params.toString()}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(url);

    if (response.ok) {
      const data = (await response.json()) as T;
      cache.set(cacheKey, { data, timestamp: now });
      return data;
    }

    const retriable = response.status === 429 || response.status >= 500;
    if (attempt === 0 && retriable) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      continue;
    }

    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  throw new Error("TMDB API error");
}

export interface TmdbSearchResult {
  page: number;
  results: TmdbMediaItem[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMediaItem {
  id: number;
  title?: string;
  name?: string;
  media_type: "movie" | "tv" | "person";
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  original_language?: string;
  vote_average: number;
  genre_ids: number[];
  origin_title?: string;
  original_name?: string;
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  genres: TmdbGenre[];
  budget: number;
  revenue: number;
  status: string;
  original_language?: string;
}

export interface TmdbTvDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genres: TmdbGenre[];
  number_of_seasons: number;
  number_of_episodes: number;
  last_air_date: string | null;
  status: string;
  original_language?: string;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCredits {
  id: number;
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TmdbImages {
  id: number;
  backdrops: { file_path: string }[];
  posters: { file_path: string }[];
}

export interface TmdbExternalIds {
  id: number;
  imdb_id: string | null;
}

export interface TmdbReview {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  url: string;
}

export interface TmdbReviews {
  results: TmdbReview[];
}

function normalizeMediaItem(item: TmdbMediaItem): MediaItem {
  const isMovie = item.media_type === "movie" || !!item.title;
  return {
    id: item.id,
    title: item.title || item.name || "",
    type: isMovie ? "movie" : "tv",
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview,
    release_date: item.release_date || null,
    first_air_date: item.first_air_date || null,
    original_language: item.original_language || null,
    vote_average: item.vote_average,
    genre_ids: item.genre_ids,
  };
}

export const tmdbService = {
  search(query: string, page: number = 1): Promise<TmdbSearchResult> {
    return fetchFromApi<TmdbSearchResult>("search/multi", { query, page, include_adult: "false" });
  },

  async getTrending(timeWindow: "day" | "week" = "week"): Promise<{ results: MediaItem[] }> {
    const data = await fetchFromApi<{ results: TmdbMediaItem[] }>(`trending/all/${timeWindow}`);
    return { results: data.results.map(normalizeMediaItem) };
  },

  async getPopular(type: "movie" | "tv", page: number = 1): Promise<{ results: MediaItem[] }> {
    const data = await fetchFromApi<{ results: TmdbMediaItem[] }>(`${type}/popular`, { page });
    return { results: data.results.map(normalizeMediaItem) };
  },

  async getAnime(timeWindow: "day" | "week" | undefined, page: number = 1): Promise<MediaItem[]> {
    const baseQuery: Record<string, string | number> = {
      with_keywords: "210024",
      sort_by: "popularity.desc",
      page,
    };

    const dateFilter: Record<string, string> = {};
    if (timeWindow) {
      const days = timeWindow === "week" ? 7 : 1;
      const gte = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      dateFilter[`first_air_date.gte`] = gte;
    }

    const [movies, tv] = await Promise.all([
      fetchFromApi<{ results: TmdbMediaItem[] }>("discover/movie", {
        ...baseQuery,
        ...(dateFilter["first_air_date.gte"] ? { "primary_release_date.gte": dateFilter["first_air_date.gte"] } : {}),
      }),
      fetchFromApi<{ results: TmdbMediaItem[] }>("discover/tv", { ...baseQuery, ...dateFilter }),
    ]);

    const seen = new Set<number>();
    return [...movies.results, ...tv.results]
      .filter((item) => item.media_type !== "person")
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .map(normalizeMediaItem);
  },

  async getDetail(id: number, type: "movie" | "tv"): Promise<FilmDetail> {
    const reviewsPromise = fetchFromApi<TmdbReviews>(`${type}/${id}/reviews`).catch((e: unknown) => {
      console.warn(`Reviews unavailable for ${type}/${id}`, e);
      return { results: [] as TmdbReview[] };
    });

    const externalIdsPromise = fetchFromApi<TmdbExternalIds>(`${type}/${id}/external_ids`).catch(
      (e: unknown) => {
        console.warn(`External IDs unavailable for ${type}/${id}`, e);
        return { id, imdb_id: null as string | null };
      },
    );

    const [detail, credits, images, reviews, externalIds] = await Promise.all([
      fetchFromApi<TmdbMovieDetail | TmdbTvDetail>(`${type}/${id}`),
      fetchFromApi<TmdbCredits>(`${type}/${id}/credits`),
      fetchFromApi<TmdbImages>(`${type}/${id}/images`),
      reviewsPromise,
      externalIdsPromise,
    ]);

    const imdbId = externalIds.imdb_id ?? null;
    const imdbRating = imdbId ? await omdbService.getRating(imdbId) : null;

    const isMovie = type === "movie";
    const movieDetail = detail as TmdbMovieDetail;
    const tvDetail = detail as TmdbTvDetail;

    return {
      id: detail.id,
      title: isMovie ? movieDetail.title : tvDetail.name,
      type: isMovie ? "movie" : "tv",
      poster_path: detail.poster_path,
      backdrop_path: detail.backdrop_path,
      overview: detail.overview,
      release_date: isMovie ? movieDetail.release_date : null,
      first_air_date: isMovie ? null : tvDetail.first_air_date,
      original_language: detail.original_language || null,
      vote_average: detail.vote_average,
      genre_ids: detail.genres.map((g) => g.id),
      runtime: isMovie ? movieDetail.runtime : null,
      budget: isMovie ? movieDetail.budget : null,
      revenue: isMovie ? movieDetail.revenue : null,
      status: detail.status,
      number_of_seasons: isMovie ? null : tvDetail.number_of_seasons,
      number_of_episodes: isMovie ? null : tvDetail.number_of_episodes,
      last_air_date: isMovie ? null : tvDetail.last_air_date,
      genres: detail.genres.map((g) => ({ id: g.id, name: g.name })),
      credits: {
        cast: credits.cast.slice(0, 10).map((c) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path,
          order: c.order,
        })),
        crew: credits.crew
          .filter((c) => ["Director", "Creator", "Producer"].includes(c.job))
          .slice(0, 5)
          .map((c) => ({
            id: c.id,
            name: c.name,
            job: c.job,
            department: c.department,
            profile_path: c.profile_path,
          })),
      },
      images: {
        backdrops: images.backdrops.slice(0, 10),
        posters: images.posters.slice(0, 10),
      },
      imdb_id: imdbId,
      imdb_rating: imdbRating,
      reviews: reviews.results.slice(0, 5).map((r) => ({
        id: r.id,
        author: r.author,
        author_avatar_path: r.author_details?.avatar_path ?? null,
        rating: r.author_details?.rating ?? null,
        content: r.content,
        url: r.url,
        created_at: r.created_at,
      })),
    };
  },

  async getRecommendations(id: number, type: "movie" | "tv"): Promise<{ results: MediaItem[] }> {
    const data = await fetchFromApi<{ results: TmdbMediaItem[] }>(`${type}/${id}/recommendations`);
    return { results: data.results.map(normalizeMediaItem) };
  },

  async searchMulti(query: string, page: number = 1): Promise<MediaItem[]> {
    const result = await this.search(query, page);
    return result.results.filter((item) => item.media_type === "movie" || item.media_type === "tv").map(normalizeMediaItem);
  },

  getImageProxyUrl(path: string): string {
    return `/api/images${path}`;
  },
};

export { IMAGE_BASE_URL };
