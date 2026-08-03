import { Hono } from "hono";
import { tmdbService } from "../services/tmdb";

export const tmdbRoutes = (app: Hono) => {
  app.get("/films/search", async (c) => {
    const query = c.req.query("q");
    const page = parseInt(c.req.query("page") || "1");

    if (!query) {
      return c.json({ error: "Query parameter 'q' is required" }, 400);
    }

    try {
      const results = await tmdbService.searchMulti(query, page);
      return c.json({ results, page });
    } catch {
      return c.json({ error: "Failed to search films" }, 500);
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

  app.get("/films/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const type = (c.req.query("type") as "movie" | "tv") || "movie";

    if (isNaN(id)) {
      return c.json({ error: "Invalid film ID" }, 400);
    }

    try {
      const film = await tmdbService.getDetail(id, type);
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
