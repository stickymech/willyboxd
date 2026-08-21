import type { RatingInput } from "./schemas.js";
import type { FilmDetail } from "./types.js";

export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
export const POSTER_SIZES = {
  small: "w185",
  medium: "w342",
  large: "w500",
  original: "original",
} as const;

export const BACKDROP_SIZES = {
  small: "w300",
  medium: "w780",
  large: "w1280",
  original: "original",
} as const;

export const PROFILE_SIZES = {
  small: "w45",
  medium: "w185",
  large: "h632",
  original: "original",
} as const;

export const RATING_OPTIONS: RatingInput[] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export const SESSION_COOKIE_NAME = "willyboxd_session";
export const SESSION_EXPIRY_DAYS = 30;
export const MAX_SESSIONS_PER_USER = 5;

export const TMDB_RATE_LIMIT_DELAY = 250;
export const TMDB_CACHE_TTL_DAYS = 7;
export const TMDB_IMAGE_CACHE_TTL_DAYS = 30;

export function getPosterUrl(path: string | null, size: keyof typeof POSTER_SIZES = "medium"): string | null {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${POSTER_SIZES[size]}${path}`;
}

export function getBackdropUrl(path: string | null, size: keyof typeof BACKDROP_SIZES = "medium"): string | null {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${BACKDROP_SIZES[size]}${path}`;
}

export function getProfileUrl(path: string | null, size: keyof typeof PROFILE_SIZES = "medium"): string | null {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${PROFILE_SIZES[size]}${path}`;
}

export function getImdbUrl(imdbId: string): string {
  return `https://www.imdb.com/title/${imdbId}`;
}

export function getTmdbUrl(id: number, type: "movie" | "tv"): string {
  return `https://www.themoviedb.org/${type}/${id}`;
}

export function toStarRating(value: number): number {
  return value / 2;
}

export function toHundredStarRating(value: number): number {
  return value / 20;
}

export function toHalfStar(value: number): number {
  return Math.round(value * 2) / 2;
}

const REVIEW_SOURCE_NAMES: Record<string, string> = {
  "themoviedb.org": "TMDB",
  "imdb.com": "IMDb",
  "rottentomatoes.com": "Rotten Tomatoes",
  "metacritic.com": "Metacritic",
  "letterboxd.com": "Letterboxd",
};

export function getReviewSourceLabel(url: string | null | undefined): string | null {
  if (!url) return null;
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return null;
  }
  const host = hostname.replace(/^www\./, "");
  return REVIEW_SOURCE_NAMES[host] ?? host;
}

export function formatMinutes(minutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  };
}

export function calculateWatchedMinutes(film: FilmDetail): number {
  if (film.type === "movie" && film.runtime) {
    return film.runtime;
  }
  if (film.type === "tv" && film.number_of_episodes) {
    return 0;
  }
  return 0;
}

export function ratingLabel(rating: number): string {
  if (rating < 0.5) return "No rating";
  const labels: Record<number, string> = {
    0.5: "½",
    1: "★",
    1.5: "★½",
    2: "★★",
    2.5: "★★½",
    3: "★★★",
    3.5: "★★★½",
    4: "★★★★",
    4.5: "★★★★½",
    5: "★★★★★",
  };
  return labels[rating] ?? "";
}
