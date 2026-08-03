import { Hono } from "hono";

export const listRoutes = (app: Hono) => {
  app.get("/lists", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.post("/lists", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.get("/lists/:id", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.put("/lists/:id", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.delete("/lists/:id", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });
};
