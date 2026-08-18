import { Hono } from "hono";
import { tmdbService } from "../services/tmdb";
import { enrichRatings, persistFilmDetail } from "../services/films";

const MAX_RATINGS_IDS = 10;

export const tmdbRoutes = (app: Hono) => {
  app.get("/films/search", async (c) => {
    const query = c.req.query("q");
    const page = parseInt(c.req.query("page") || "1");
    const anime = c.req.query("anime") === "1";

    if (!query) {
      return c.json({ error: "Query parameter 'q' is required" }, 400);
    }

    try {
      let results = await tmdbService.searchMulti(query, page);
      if (anime) {
        results = results.filter((item) => item.original_language === "ja");
      }
      return c.json({ results, page });
    } catch {
      return c.json({ error: "Failed to search films" }, 500);
    }
  });

  app.get("/films/anime", async (c) => {
    const time = c.req.query("time") as "day" | "week" | undefined;
    const page = parseInt(c.req.query("page") || "1");

    try {
      const results = await tmdbService.getAnime(time, page);
      return c.json({ results, page });
    } catch {
      return c.json({ error: "Failed to fetch anime" }, 500);
    }
  });

  app.get("/films/popular", async (c) => {
    const type = (c.req.query("type") as "movie" | "tv") || "movie";
    const page = parseInt(c.req.query("page") || "1");

    try {
      const results = await tmdbService.getPopular(type, page);
      return c.json({ results: results.results, page });
    } catch {
      return c.json({ error: "Failed to fetch popular films" }, 500);
    }
  });

  app.get("/films/trending", async (c) => {
    const timeWindow = (c.req.query("time") as "day" | "week") || "week";

    try {
      const results = await tmdbService.getTrending(timeWindow);
      return c.json({ results: results.results });
    } catch {
      return c.json({ error: "Failed to fetch trending films" }, 500);
    }
  });

  app.get("/films/ratings", async (c) => {
    const ids = c.req.query("ids") || "";
    const entries = ids
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, MAX_RATINGS_IDS);

    const ratings: Record<string, Record<string, string | number>> = {};

    for (const entry of entries) {
      const [rawId, type] = entry.split(":");
      const id = parseInt(rawId, 10);
      if (isNaN(id) || (type !== "movie" && type !== "tv")) continue;

      const result = await enrichRatings(id, type);
      if (result.imdb_id === null && result.imdb_rating === null && result.rt_rating === null && result.metacritic_rating === null) {
        continue;
      }

      const omitted: Record<string, string | number> = {};
      if (result.imdb_id !== null) omitted.imdb_id = result.imdb_id;
      if (result.imdb_rating !== null) omitted.imdb_rating = result.imdb_rating;
      if (result.rt_rating !== null) omitted.rt_rating = result.rt_rating;
      if (result.metacritic_rating !== null) omitted.metacritic_rating = result.metacritic_rating;
      ratings[rawId] = omitted;
    }

    return c.json({ ratings });
  });

  app.get("/films/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const type = (c.req.query("type") as "movie" | "tv") || "movie";

    if (isNaN(id)) {
      return c.json({ error: "Invalid film ID" }, 400);
    }

    try {
      const film = await tmdbService.getDetail(id, type);
      try {
        persistFilmDetail(film);
      } catch (e) {
        console.warn(`Failed to persist film ${type}/${id}`, e);
      }
      return c.json({ film });
    } catch {
      return c.json({ error: "Failed to fetch film details" }, 500);
    }
  });

  app.get("/films/:id/recommendations", async (c) => {
    const id = parseInt(c.req.param("id"));
    const type = (c.req.query("type") as "movie" | "tv") || "movie";

    if (isNaN(id)) {
      return c.json({ error: "Invalid film ID" }, 400);
    }

    try {
      const results = await tmdbService.getRecommendations(id, type);
      return c.json({ results: results.results });
    } catch {
      return c.json({ error: "Failed to fetch recommendations" }, 500);
    }
  });
};
