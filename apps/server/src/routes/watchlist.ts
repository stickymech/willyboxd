import { Hono } from "hono";

export const watchlistRoutes = (app: Hono) => {
  app.get("/watchlist", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.post("/watchlist/:filmId", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.delete("/watchlist/:filmId", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });
};
