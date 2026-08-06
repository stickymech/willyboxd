import { vi, test, expect, describe, beforeAll, beforeEach } from "vitest";

vi.mock("../services/tmdb", () => ({
  tmdbService: {
    getDetail: vi.fn(),
  },
}));

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_PATH = "./data/test-watchlist.db";
  process.env.TMDB_API_KEY = "test-key";
  process.env.JWT_SECRET = "test-secret";
  process.env.CLIENT_URL = "http://localhost:5173";
});

import { Hono } from "hono";
import { registerAuthRoutes } from "./auth";
import { watchlistRoutes } from "./watchlist";
import { authMiddleware } from "../middleware/auth";
import { tmdbService } from "../services/tmdb";
import { db } from "../db";
import type { FilmDetail } from "@willyboxd/shared";

const mockedTmdb = vi.mocked(tmdbService);

const filmDetail: FilmDetail = {
  id: 550,
  title: "Fight Club",
  type: "movie",
  poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  backdrop_path: null,
  overview: "A ticking-time-bomb insomniac.",
  release_date: "1999-10-15",
  first_air_date: null,
  original_language: "en",
  vote_average: 8.4,
  genre_ids: [18, 53],
  runtime: 139,
  budget: 0,
  revenue: 0,
  status: "Released",
  number_of_seasons: null,
  number_of_episodes: null,
  last_air_date: null,
  genres: [{ id: 18, name: "Drama" }],
  credits: { cast: [], crew: [] },
  images: { backdrops: [], posters: [] },
  reviews: [],
};

function createTestApp() {
  const app = new Hono();
  app.use("*", authMiddleware);
  registerAuthRoutes(app);
  watchlistRoutes(app);
  return app;
}

async function registerAndLogin(app: Hono): Promise<string> {
  await app.request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "wl@test.com", username: "wluser", password: "password123" }),
    headers: { "Content-Type": "application/json" },
  });
  const res = await app.request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: "wl@test.com", password: "password123" }),
    headers: { "Content-Type": "application/json" },
  });
  return res.headers.get("Set-Cookie")?.split(";")[0] || "";
}

describe("Watchlist Routes", () => {
  let app: Hono;
  let cookie: string;

  beforeAll(() => {
    db.exec("DELETE FROM films");
    db.exec("DELETE FROM users");
    db.exec("DELETE FROM sessions");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    db.exec("DELETE FROM watchlist");
    db.exec("DELETE FROM films");
    db.exec("DELETE FROM users");
    db.exec("DELETE FROM sessions");
    app = createTestApp();
  });

  test("requires authentication", async () => {
    const res = await app.request("/watchlist");
    expect(res.status).toBe(401);
  });

  test("adds a film to the watchlist and lists it", async () => {
    mockedTmdb.getDetail.mockResolvedValue(filmDetail);
    cookie = await registerAndLogin(app);

    const addRes = await app.request("/watchlist/550?type=movie", {
      method: "POST",
      headers: { cookie },
    });
    expect(addRes.status).toBe(201);
    const addData = (await addRes.json()) as { entry: { film_id: number; film: { title: string } } };
    expect(addData.entry.film_id).toBe(550);
    expect(addData.entry.film.title).toBe("Fight Club");

    const listRes = await app.request("/watchlist", { headers: { cookie } });
    expect(listRes.status).toBe(200);
    const listData = (await listRes.json()) as { entries: { film_id: number }[] };
    expect(listData.entries).toHaveLength(1);
    expect(listData.entries[0].film_id).toBe(550);
  });

  test("rejects a duplicate watchlist entry", async () => {
    mockedTmdb.getDetail.mockResolvedValue(filmDetail);
    cookie = await registerAndLogin(app);

    await app.request("/watchlist/550?type=movie", { method: "POST", headers: { cookie } });
    const res = await app.request("/watchlist/550?type=movie", { method: "POST", headers: { cookie } });
    expect(res.status).toBe(409);
  });

  test("removes a film from the watchlist", async () => {
    mockedTmdb.getDetail.mockResolvedValue(filmDetail);
    cookie = await registerAndLogin(app);

    await app.request("/watchlist/550?type=movie", { method: "POST", headers: { cookie } });
    const delRes = await app.request("/watchlist/550", { method: "DELETE", headers: { cookie } });
    expect(delRes.status).toBe(200);

    const listRes = await app.request("/watchlist", { headers: { cookie } });
    const listData = (await listRes.json()) as { entries: unknown[] };
    expect(listData.entries).toHaveLength(0);
  });

  test("delete of a missing entry returns 404", async () => {
    cookie = await registerAndLogin(app);
    const res = await app.request("/watchlist/999", { method: "DELETE", headers: { cookie } });
    expect(res.status).toBe(404);
  });

  test("rejects an invalid film id", async () => {
    cookie = await registerAndLogin(app);
    const res = await app.request("/watchlist/notanumber", { method: "POST", headers: { cookie } });
    expect(res.status).toBe(400);
  });
});
