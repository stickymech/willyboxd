import { Hono } from "hono";

export const socialRoutes = (app: Hono) => {
  app.get("/users/:username", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.post("/users/:username/follow", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.delete("/users/:username/follow", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.get("/feed", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });
};
