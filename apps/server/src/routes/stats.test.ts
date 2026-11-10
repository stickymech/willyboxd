import { vi, test, expect, describe, beforeEach } from "vitest";

vi.mock("../services/tmdb", () => ({
  tmdbService: {
    getDetail: vi.fn(),
  },
}));

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_PATH = "./data/test-stats.db";
  process.env.TMDB_API_KEY = "test-key";
  process.env.CLIENT_URL = "http://localhost:5173";
});

import { Hono } from "hono";
import { registerAuthRoutes } from "./auth";
import { diaryRoutes } from "./diary";
import { statsRoutes } from "./stats";
import { authMiddleware } from "../middleware/auth";
import { tmdbService } from "../services/tmdb";
import { db } from "../db";
import type { FilmDetail, StatsOverview } from "@willyboxd/shared";

const mockedTmdb = vi.mocked(tmdbService);

const baseFilm: FilmDetail = {
  id: 550,
  title: "Fight Club",
  type: "movie",
  poster_path: null,
  backdrop_path: null,
  overview: "",
  release_date: "1999-10-15",
  first_air_date: null,
  original_language: "en",
  vote_average: 8,
  vote_count: 1000,
  genre_ids: [18],
  runtime: 120,
  budget: 0,
  revenue: 0,
  status: "Released",
  number_of_seasons: null,
  number_of_episodes: null,
  last_air_date: null,
  genres: [
    { id: 18, name: "Drama" },
    { id: 53, name: "Thriller" },
  ],
  credits: { cast: [], crew: [] },
  images: { backdrops: [], posters: [] },
  imdb_id: null,
  imdb_rating: null,
  rt_rating: null,
  metacritic_rating: null,
  trailer: null,
  reviews: [],
};

function createTestApp() {
  const app = new Hono();
  app.use("*", authMiddleware);
  registerAuthRoutes(app);
  diaryRoutes(app);
  statsRoutes(app);
  return app;
}

async function registerAndLogin(app: Hono): Promise<string> {
  await app.request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "stats@test.com", username: "statsuser", password: "password123" }),
    headers: { "Content-Type": "application/json" },
  });
  const res = await app.request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: "statsuser", password: "password123" }),
    headers: { "Content-Type": "application/json" },
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  return setCookie.split(";")[0];
}

async function logEntry(app: Hono, cookie: string, filmId: number, watchedDate: string, rating: number) {
  return app.request("/diary", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      film_id: filmId,
      type: "movie",
      watched_date: watchedDate,
      rating,
      rewatch: false,
      tags: [],
    }),
  });
}

describe("stats routes", () => {
  beforeEach(() => {
    db.exec("DELETE FROM diary_entries");
    db.exec("DELETE FROM watchlist");
    db.exec("DELETE FROM film_genres");
    db.exec("DELETE FROM genres");
    db.exec("DELETE FROM films");
    db.exec("DELETE FROM sessions");
    db.exec("DELETE FROM users");
  });

  test("requires auth", async () => {
    const app = createTestApp();
    const res = await app.request("/stats");
    expect(res.status).toBe(401);
  });

  test("returns aggregate stats for a user's diary", async () => {
    mockedTmdb.getDetail.mockImplementation(async (id: number) => {
      if (id === 550) return baseFilm;
      return {
        ...baseFilm,
        id: 95,
        title: "Mad Max",
        runtime: 100,
        release_date: "2015-05-14",
        genres: [{ id: 28, name: "Action" }],
      };
    });

    const app = createTestApp();
    const cookie = await registerAndLogin(app);
    expect((await logEntry(app, cookie, 550, "2026-01-01", 4)).status).toBe(201);
    expect((await logEntry(app, cookie, 95, "2026-01-02", 3)).status).toBe(201);

    const res = await app.request("/stats", { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const { stats } = (await res.json()) as { stats: StatsOverview };

    expect(stats.total_watched).toBe(2);
    expect(stats.total_films).toBe(2);
    expect(stats.total_minutes).toBe(220);
    expect(stats.average_rating).toBe(3.5);
    expect(stats.genres).toEqual([
      { name: "Action", count: 1 },
      { name: "Drama", count: 1 },
      { name: "Thriller", count: 1 },
    ]);
    expect(stats.years).toEqual([
      { year: 2015, count: 1 },
      { year: 1999, count: 1 },
    ]);
    expect(stats.decades).toEqual([
      { decade: 2010, count: 1 },
      { decade: 1990, count: 1 },
    ]);
  });

  test("returns a zeroed overview for a user with no entries", async () => {
    const app = createTestApp();
    const cookie = await registerAndLogin(app);

    const res = await app.request("/stats", { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const { stats } = (await res.json()) as { stats: StatsOverview };

    expect(stats).toEqual({
      total_watched: 0,
      total_films: 0,
      total_minutes: 0,
      average_rating: 0,
      genres: [],
      years: [],
      decades: [],
    });
  });

  test("stats are isolated per user", async () => {
    mockedTmdb.getDetail.mockImplementation(async (id: number) => {
      if (id === 550) return baseFilm;
      return { ...baseFilm, id: 95, title: "Mad Max", runtime: 100, release_date: "2015-05-14", genres: [{ id: 28, name: "Action" }] };
    });

    const app = createTestApp();
    const cookieA = await registerAndLogin(app);

    await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "other@test.com", username: "otheruser", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const loginB = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: "otheruser", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const cookieB = (loginB.headers.get("set-cookie") ?? "").split(";")[0];

    await logEntry(app, cookieA, 550, "2026-01-01", 4);

    const resA = await app.request("/stats", { headers: { Cookie: cookieA } });
    const resB = await app.request("/stats", { headers: { Cookie: cookieB } });
    const statsA = ((await resA.json()) as { stats: StatsOverview }).stats;
    const statsB = ((await resB.json()) as { stats: StatsOverview }).stats;

    expect(statsA.total_watched).toBe(1);
    expect(statsB.total_watched).toBe(0);
  });
});
