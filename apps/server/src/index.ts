import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import { registerAuthRoutes } from "./routes/auth";
import { tmdbRoutes } from "./routes/tmdb";
import { diaryRoutes } from "./routes/diary";
import { watchlistRoutes } from "./routes/watchlist";
import { listRoutes } from "./routes/lists";
import { socialRoutes } from "./routes/social";
import { statsRoutes } from "./routes/stats";
import { imageProxy } from "./services/images";

const clientOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isLocalhost = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return undefined;
      if (clientOrigins.includes(origin)) return origin;
      if (process.env.NODE_ENV !== "production" && isLocalhost(origin)) {
        return origin;
      }
      return undefined;
    },
    credentials: true,
  }),
);
app.use("*", authMiddleware);

app.get("/api/health", (c) => c.json({ status: "ok", version: "0.1.0" }));

const api = app.basePath("/api");

registerAuthRoutes(api);
api.route("/images", imageProxy);
tmdbRoutes(api);
diaryRoutes(api);
watchlistRoutes(api);
listRoutes(api);
socialRoutes(api);
statsRoutes(api);

export type AppType = typeof app;

const port = parseInt(process.env.PORT || "3000");

if (process.env.NODE_ENV !== "test") {
  console.log(`Server starting on port ${port}`);
  serve({
    fetch: app.fetch,
    port: port,
    hostname: "0.0.0.0",
  });
}

export { app };
