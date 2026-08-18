import { Hono } from "hono";
import type { Context, Next } from "hono";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middleware/auth";
import { db } from "../db";
import { syncFilm, rowToMediaItem, getFilmRow, type FilmRow } from "../services/films";
import type { WatchlistEntry } from "@willyboxd/shared";

const auth = requireAuth as unknown as (c: Context, next: Next) => Promise<void> | Response;

const WATCHLIST_SELECT = `
  SELECT w.id, w.user_id, w.film_id, w.created_at,
         f.tmdb_id, f.title, f.type, f.poster_path, f.backdrop_path, f.overview,
         f.release_date, f.first_air_date, f.vote_average, f.genres_json,
         f.imdb_id, f.imdb_rating, f.rt_rating, f.metacritic_rating
  FROM watchlist w
  JOIN films f ON f.tmdb_id = w.film_id
`;

function entryFromRow(row: FilmRow & { id: string; user_id: string; created_at: string }): WatchlistEntry {
  return {
    id: row.id,
    user_id: row.user_id,
    film_id: row.film_id,
    film: rowToMediaItem(row),
    created_at: row.created_at,
  };
}

export const watchlistRoutes = (app: Hono) => {
  app.get("/watchlist", auth, (c) => {
    const user = c.get("user")!;
    const rows = db
      .prepare(`${WATCHLIST_SELECT} WHERE w.user_id = ? ORDER BY w.created_at DESC`)
      .all(user.id) as Array<FilmRow & { id: string; user_id: string; created_at: string }>;
    return c.json({ entries: rows.map(entryFromRow) });
  });

  app.post("/watchlist/:filmId", auth, async (c) => {
    const user = c.get("user")!;
    const filmId = parseInt(c.req.param("filmId") ?? "");
    const type = (c.req.query("type") as "movie" | "tv") || "movie";

    if (isNaN(filmId)) {
      return c.json({ error: "Invalid film ID" }, 400);
    }

    const existing = db.prepare("SELECT id FROM watchlist WHERE user_id = ? AND film_id = ?").get(user.id, filmId);
    if (existing) {
      return c.json({ error: "Film already in watchlist" }, 409);
    }

    await syncFilm(filmId, type);

    const id = uuidv4();
    db.prepare("INSERT INTO watchlist (id, user_id, film_id) VALUES (?, ?, ?)").run(id, user.id, filmId);

    const film = getFilmRow(filmId);
    return c.json(
      {
        entry: entryFromRow({ ...film!, id, user_id: user.id, film_id: filmId, created_at: new Date().toISOString().slice(0, 19).replace("T", " ") }),
      },
      201,
    );
  });

  app.delete("/watchlist/:filmId", auth, (c) => {
    const user = c.get("user")!;
    const filmId = parseInt(c.req.param("filmId") ?? "");

    if (isNaN(filmId)) {
      return c.json({ error: "Invalid film ID" }, 400);
    }

    const result = db.prepare("DELETE FROM watchlist WHERE user_id = ? AND film_id = ?").run(user.id, filmId);
    if (result.changes === 0) {
      return c.json({ error: "Film not in watchlist" }, 404);
    }
    return c.json({ success: true });
  });
};
