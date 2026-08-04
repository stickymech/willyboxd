import { Hono } from "hono";
import type { Context, Next } from "hono";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middleware/auth";
import { db } from "../db";
import { syncFilm, rowToMediaItem, type FilmRow } from "../services/films";
import { DiaryEntrySchema, DiaryUpdateSchema, type DiaryEntry } from "@willyboxd/shared";

const auth = requireAuth as unknown as (c: Context, next: Next) => Promise<void> | Response;

const DIARY_SELECT = `
  SELECT d.id, d.user_id, d.film_id, d.watched_date, d.rating, d.review, d.rewatch,
         d.tags_json, d.created_at, d.updated_at,
         f.tmdb_id, f.title, f.type, f.poster_path, f.backdrop_path, f.overview,
         f.release_date, f.first_air_date, f.vote_average, f.genres_json
  FROM diary_entries d
  JOIN films f ON f.tmdb_id = d.film_id
`;

type DiaryRow = FilmRow & {
  id: string;
  user_id: string;
  watched_date: string;
  rating: number | null;
  review: string | null;
  rewatch: number;
  tags_json: string;
  created_at: string;
  updated_at: string;
};

function entryFromRow(row: DiaryRow): DiaryEntry {
  let tags: string[] = [];
  try {
    tags = row.tags_json ? (JSON.parse(row.tags_json) as string[]) : [];
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    user_id: row.user_id,
    film_id: row.film_id,
    film: rowToMediaItem(row),
    watched_date: row.watched_date,
    rating: row.rating,
    review: row.review,
    rewatch: row.rewatch === 1,
    tags,
    created_at: row.created_at,
  };
}

function getEntry(id: string, userId: string): DiaryEntry | undefined {
  const row = db
    .prepare(`${DIARY_SELECT} WHERE d.id = ? AND d.user_id = ?`)
    .get(id, userId) as DiaryRow | undefined;
  return row ? entryFromRow(row) : undefined;
}

export const diaryRoutes = (app: Hono) => {
  app.get("/diary", auth, (c) => {
    const user = c.get("user")!;
    const rows = db
      .prepare(`${DIARY_SELECT} WHERE d.user_id = ? ORDER BY d.watched_date DESC, d.created_at DESC`)
      .all(user.id) as DiaryRow[];
    return c.json({ entries: rows.map(entryFromRow) });
  });

  app.post("/diary", auth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();
    const parsed = DiaryEntrySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.errors }, 400);
    }

    const { film_id, type, watched_date, rating, review, rewatch, tags } = parsed.data;

    await syncFilm(film_id, type);

    const id = uuidv4();
    db.prepare(
      `INSERT INTO diary_entries (id, user_id, film_id, watched_date, rating, review, rewatch, tags_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, user.id, film_id, watched_date, rating ?? null, review ?? null, rewatch ? 1 : 0, JSON.stringify(tags));

    return c.json({ entry: getEntry(id, user.id) }, 201);
  });

  app.get("/diary/:id", auth, (c) => {
    const user = c.get("user")!;
    const entryId = c.req.param("id") ?? "";
    const entry = getEntry(entryId, user.id);
    if (!entry) {
      return c.json({ error: "Diary entry not found" }, 404);
    }
    return c.json({ entry });
  });

  app.put("/diary/:id", auth, async (c) => {
    const user = c.get("user")!;
    const entryId = c.req.param("id") ?? "";

    const existing = db
      .prepare("SELECT id FROM diary_entries WHERE id = ? AND user_id = ?")
      .get(entryId, user.id);
    if (!existing) {
      return c.json({ error: "Diary entry not found" }, 404);
    }

    const body = await c.req.json();
    const parsed = DiaryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.errors }, 400);
    }

    const { watched_date, rating, review, rewatch, tags } = parsed.data;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (watched_date !== undefined) {
      updates.push("watched_date = ?");
      params.push(watched_date);
    }
    if (rating !== undefined) {
      updates.push("rating = ?");
      params.push(rating);
    }
    if (review !== undefined) {
      updates.push("review = ?");
      params.push(review);
    }
    if (rewatch !== undefined) {
      updates.push("rewatch = ?");
      params.push(rewatch ? 1 : 0);
    }
    if (tags !== undefined) {
      updates.push("tags_json = ?");
      params.push(JSON.stringify(tags));
    }

    updates.push("updated_at = datetime('now')");
    params.push(entryId);

    db.prepare(`UPDATE diary_entries SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    return c.json({ entry: getEntry(entryId, user.id) });
  });

  app.delete("/diary/:id", auth, (c) => {
    const user = c.get("user")!;
    const entryId = c.req.param("id") ?? "";
    const result = db
      .prepare("DELETE FROM diary_entries WHERE id = ? AND user_id = ?")
      .run(entryId, user.id);
    if (result.changes === 0) {
      return c.json({ error: "Diary entry not found" }, 404);
    }
    return c.json({ success: true });
  });
};
