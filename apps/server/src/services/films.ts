import { db } from "../db";
import { tmdbService } from "./tmdb";
import { omdbService } from "./omdb";
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
  imdb_id: string | null;
  imdb_rating: number | null;
  rt_rating: number | null;
  metacritic_rating: number | null;
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
    imdb_id: row.imdb_id ?? null,
    imdb_rating: row.imdb_rating ?? null,
    rt_rating: row.rt_rating ?? null,
    metacritic_rating: row.metacritic_rating ?? null,
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
       release_date, first_air_date, runtime, vote_average, imdb_id,
       imdb_rating, rt_rating, metacritic_rating, genres_json,
       credits_json, images_json, last_updated
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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
       imdb_id = excluded.imdb_id,
       imdb_rating = excluded.imdb_rating,
       rt_rating = excluded.rt_rating,
       metacritic_rating = excluded.metacritic_rating,
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
    detail.imdb_id,
    detail.imdb_rating,
    detail.rt_rating,
    detail.metacritic_rating,
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
    if (Date.now() - lastUpdated < ttlMs && existing.imdb_rating !== null) {
      return rowToMediaItem(existing);
    }
  }

  const detail = await tmdbService.getDetail(tmdbId, type);
  upsertFilm(detail);
  return rowToMediaItem(detail);
}

export function persistFilmDetail(detail: FilmDetail): void {
  upsertFilm(detail);
}

export interface RatingsResult {
  imdb_id: string | null;
  imdb_rating: number | null;
  rt_rating: number | null;
  metacritic_rating: number | null;
}

export async function enrichRatings(tmdbId: number, type: "movie" | "tv"): Promise<RatingsResult> {
  const filmRow = db.prepare("SELECT * FROM films WHERE tmdb_id = ?").get(tmdbId) as FilmRow | undefined;
  if (filmRow && filmRow.imdb_rating !== null) {
    return {
      imdb_id: filmRow.imdb_id,
      imdb_rating: filmRow.imdb_rating,
      rt_rating: filmRow.rt_rating,
      metacritic_rating: filmRow.metacritic_rating,
    };
  }

  const cached = db
    .prepare("SELECT * FROM film_ratings WHERE tmdb_id = ? AND type = ?")
    .get(tmdbId, type) as
    | { imdb_id: string | null; imdb_rating: number | null; rt_rating: number | null; metacritic_rating: number | null }
    | undefined;
  if (cached) {
    return {
      imdb_id: cached.imdb_id,
      imdb_rating: cached.imdb_rating,
      rt_rating: cached.rt_rating,
      metacritic_rating: cached.metacritic_rating,
    };
  }

  try {
    const externalIds = await tmdbService.getExternalIds(tmdbId, type);
    const ratings =
      externalIds.imdb_id !== null
        ? await omdbService.getRatings(externalIds.imdb_id)
        : { imdb: null, rt: null, metacritic: null };

    const result: RatingsResult = {
      imdb_id: externalIds.imdb_id,
      imdb_rating: ratings.imdb,
      rt_rating: ratings.rt,
      metacritic_rating: ratings.metacritic,
    };

    db.prepare(
      `INSERT INTO film_ratings (tmdb_id, type, imdb_id, imdb_rating, rt_rating, metacritic_rating)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(tmdb_id, type) DO UPDATE SET
         imdb_id = excluded.imdb_id,
         imdb_rating = excluded.imdb_rating,
         rt_rating = excluded.rt_rating,
         metacritic_rating = excluded.metacritic_rating,
         last_updated = datetime('now')`,
    ).run(tmdbId, type, result.imdb_id, result.imdb_rating, result.rt_rating, result.metacritic_rating);

    return result;
  } catch (e) {
    console.warn(`Ratings enrichment failed for ${type}/${tmdbId}`, e);
    return { imdb_id: null, imdb_rating: null, rt_rating: null, metacritic_rating: null };
  }
}

export function getFilmRow(tmdbId: number): FilmRow | undefined {
  return db.prepare("SELECT * FROM films WHERE tmdb_id = ?").get(tmdbId) as FilmRow | undefined;
}
