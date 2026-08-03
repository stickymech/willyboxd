import { Hono } from "hono";

export const diaryRoutes = (app: Hono) => {
  app.get("/diary", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.post("/diary", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.get("/diary/:id", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.put("/diary/:id", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });

  app.delete("/diary/:id", (c) => {
    return c.json({ error: "Not implemented" }, 501);
  });
};
