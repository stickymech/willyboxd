import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "../db";
import type { StatsOverview } from "@willyboxd/shared";

/**
 * Per-user watching statistics: entries, films, minutes (movie runtimes),
 * average rating, and top genres / years / decades.
 */
export const statsRoutes = (app: Hono) => {
  app.get("/stats", requireAuth, (c) => {
    const user = c.get("user")!;

    const totals = db
      .prepare(
        `SELECT COUNT(*) as entries, COUNT(DISTINCT film_id) as films
         FROM diary_entries WHERE user_id = ?`,
      )
      .get(user.id) as { entries: number; films: number };

    const minutesRow = db
      .prepare(
        `SELECT COALESCE(SUM(f.runtime), 0) as minutes
         FROM diary_entries d
         JOIN films f ON f.tmdb_id = d.film_id
         WHERE d.user_id = ? AND f.type = 'movie' AND f.runtime IS NOT NULL`,
      )
      .get(user.id) as { minutes: number };

    const averageRow = db
      .prepare(
        `SELECT COALESCE(AVG(rating), 0) as average
         FROM diary_entries WHERE user_id = ? AND rating IS NOT NULL`,
      )
      .get(user.id) as { average: number };

    const genres = db
      .prepare(
        `SELECT g.name as name, COUNT(*) as count
         FROM diary_entries d
         JOIN film_genres fg ON fg.film_id = d.film_id
         JOIN genres g ON g.id = fg.genre_id
         WHERE d.user_id = ?
         GROUP BY g.name
         ORDER BY count DESC, g.name ASC
         LIMIT 8`,
      )
      .all(user.id) as { name: string; count: number }[];

    const years = db
      .prepare(
        `SELECT CAST(SUBSTR(COALESCE(NULLIF(f.release_date, ''), f.first_air_date), 1, 4) AS INTEGER) as year,
                COUNT(*) as count
         FROM diary_entries d
         JOIN films f ON f.tmdb_id = d.film_id
         WHERE d.user_id = ?
           AND (f.release_date IS NOT NULL AND f.release_date != ''
                OR f.first_air_date IS NOT NULL AND f.first_air_date != '')
         GROUP BY year
         ORDER BY year DESC`,
      )
      .all(user.id) as { year: number; count: number }[];

    const decadeCounts = new Map<number, number>();
    for (const { year, count } of years) {
      const decade = Math.floor(year / 10) * 10;
      decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + count);
    }
    const decades = [...decadeCounts.entries()]
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => b.decade - a.decade);

    const stats: StatsOverview = {
      total_watched: totals.entries,
      total_films: totals.films,
      total_minutes: minutesRow.minutes,
      average_rating: averageRow.average,
      genres,
      years,
      decades,
    };

    return c.json({ stats });
  });
};
