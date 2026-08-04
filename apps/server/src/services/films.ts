import { db } from "../db";
import { tmdbService } from "./tmdb";
import { TMDB_CACHE_TTL_DAYS, type FilmDetail, type MediaItem } from "@willyboxd/shared";

export interface FilmRow {
  tmdb_id: number;
  film_id: number;
  title: string;
  type: "movie" | "tv";
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  release_date: string | null;
  first_air_date: string | null;
  runtime: number | null;
  vote_average: number | null;
  genres_json: string | null;
  last_updated: string;
}

export function rowToMediaItem(row: Partial<FilmRow>): MediaItem {
  let genres: { id: number; name: string }[] = [];
  try {
    genres = row.genres_json ? (JSON.parse(row.genres_json) as { id: number; name: string }[]) : [];
  } catch {
    genres = [];
  }
  return {
    id: row.tmdb_id as number,
    title: row.title as string,
    type: (row.type as "movie" | "tv") || "movie",
    poster_path: row.poster_path ?? null,
    backdrop_path: row.backdrop_path ?? null,
    overview: row.overview ?? null,
    release_date: row.release_date ?? null,
    first_air_date: row.first_air_date ?? null,
    original_language: null,
    vote_average: row.vote_average ?? 0,
    genre_ids: genres.map((g) => g.id),
  };
}

function parseDbTimestamp(value: string): number {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`).getTime();
}

function upsertFilm(detail: FilmDetail): void {
  const genresJson = JSON.stringify(detail.genres);

  db.prepare(
    `INSERT INTO films (
       tmdb_id, title, type, poster_path, backdrop_path, overview,
       release_date, first_air_date, runtime, vote_average, genres_json,
       credits_json, images_json, last_updated
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(tmdb_id) DO UPDATE SET
       title = excluded.title,
       type = excluded.type,
       poster_path = excluded.poster_path,
       backdrop_path = excluded.backdrop_path,
       overview = excluded.overview,
       release_date = excluded.release_date,
       first_air_date = excluded.first_air_date,
       runtime = excluded.runtime,
       vote_average = excluded.vote_average,
       genres_json = excluded.genres_json,
       credits_json = excluded.credits_json,
       images_json = excluded.images_json,
       last_updated = datetime('now')`,
  ).run(
    detail.id,
    detail.title,
    detail.type,
    detail.poster_path,
    detail.backdrop_path,
    detail.overview,
    detail.release_date,
    detail.first_air_date,
    detail.runtime,
    detail.vote_average,
    genresJson,
    JSON.stringify(detail.credits),
    JSON.stringify(detail.images),
  );

  const insertGenre = db.prepare("INSERT OR IGNORE INTO genres (id, name) VALUES (?, ?)");
  const insertFilmGenre = db.prepare("INSERT OR IGNORE INTO film_genres (film_id, genre_id) VALUES (?, ?)");
  db.prepare("DELETE FROM film_genres WHERE film_id = ?").run(detail.id);

  for (const genre of detail.genres) {
    insertGenre.run(genre.id, genre.name);
    insertFilmGenre.run(detail.id, genre.id);
  }
}

export async function syncFilm(tmdbId: number, type: "movie" | "tv"): Promise<MediaItem> {
  const existing = db.prepare("SELECT * FROM films WHERE tmdb_id = ?").get(tmdbId) as FilmRow | undefined;
  if (existing) {
    const ttlMs = TMDB_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
    const lastUpdated = parseDbTimestamp(existing.last_updated);
    if (Date.now() - lastUpdated < ttlMs) {
      return rowToMediaItem(existing);
    }
  }

  const detail = await tmdbService.getDetail(tmdbId, type);
  upsertFilm(detail);
  return rowToMediaItem(detail);
}

export function getFilmRow(tmdbId: number): FilmRow | undefined {
  return db.prepare("SELECT * FROM films WHERE tmdb_id = ?").get(tmdbId) as FilmRow | undefined;
}
