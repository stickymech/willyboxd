import { Hono } from "hono";

export const statsRoutes = (app: Hono) => {
  app.get("/stats", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });
};
