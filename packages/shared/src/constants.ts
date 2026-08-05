import { md5 } from "js-md5";
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

export const GRAVATAR_BASE_URL = "https://www.gravatar.com/avatar";

export function getProfileImageUrl(
  email: string | undefined | null,
  size = 200,
  defaultImg = "404",
): string | null {
  if (!email) return null;
  const hash = md5(email.trim().toLowerCase());
  return `${GRAVATAR_BASE_URL}/${hash}?s=${size}&d=${defaultImg}`;
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
    1.5: "½½",
    2: "★★",
    2.5: "★½",
    3: "★★★",
    3.5: "★★½",
    4: "★★★★",
    4.5: "★★★★½",
    5: "★★★★★",
  };
  return labels[rating] ?? "";
}
