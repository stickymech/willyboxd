import { vi, test, expect, describe, beforeAll, beforeEach } from "vitest";

vi.mock("../services/tmdb", () => ({
  tmdbService: {
    getDetail: vi.fn(),
  },
}));

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_PATH = "./data/test-diary.db";
  process.env.TMDB_API_KEY = "test-key";
  process.env.JWT_SECRET = "test-secret";
  process.env.CLIENT_URL = "http://localhost:5173";
});

import { Hono } from "hono";
import { registerAuthRoutes } from "./auth";
import { diaryRoutes } from "./diary";
import { authMiddleware } from "../middleware/auth";
import { tmdbService } from "../services/tmdb";
import { db } from "../db";
import type { FilmDetail, DiaryEntry } from "@willyboxd/shared";

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
};

function createTestApp() {
  const app = new Hono();
  app.use("*", authMiddleware);
  registerAuthRoutes(app);
  diaryRoutes(app);
  return app;
}

async function registerAndLogin(app: Hono): Promise<string> {
  await app.request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "diary@test.com", username: "diaryuser", password: "password123" }),
    headers: { "Content-Type": "application/json" },
  });
  const res = await app.request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: "diary@test.com", password: "password123" }),
    headers: { "Content-Type": "application/json" },
  });
  return res.headers.get("Set-Cookie")?.split(";")[0] || "";
}

const entryBody = {
  film_id: 550,
  type: "movie",
  watched_date: "2024-01-15",
  rating: 4.5,
  review: "A masterpiece",
  rewatch: false,
  tags: ["favourite"],
};

describe("Diary Routes", () => {
  let app: Hono;
  let cookie: string;

  beforeAll(() => {
    db.exec("DELETE FROM diary_entries");
    db.exec("DELETE FROM watchlist");
    db.exec("DELETE FROM films");
    db.exec("DELETE FROM users");
    db.exec("DELETE FROM sessions");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    db.exec("DELETE FROM diary_entries");
    db.exec("DELETE FROM watchlist");
    db.exec("DELETE FROM films");
    db.exec("DELETE FROM users");
    db.exec("DELETE FROM sessions");
    app = createTestApp();
  });

  test("requires authentication", async () => {
    const res = await app.request("/diary");
    expect(res.status).toBe(401);
  });

  test("creates a diary entry and lists it", async () => {
    mockedTmdb.getDetail.mockResolvedValue(filmDetail);
    cookie = await registerAndLogin(app);

    const createRes = await app.request("/diary", {
      method: "POST",
      body: JSON.stringify(entryBody),
      headers: { cookie, "Content-Type": "application/json" },
    });
    expect(createRes.status).toBe(201);
    const createData = (await createRes.json()) as { entry: DiaryEntry };
    expect(createData.entry.film_id).toBe(550);
    expect(createData.entry.rating).toBe(4.5);
    expect(createData.entry.review).toBe("A masterpiece");
    expect(createData.entry.film?.title).toBe("Fight Club");

    const listRes = await app.request("/diary", { headers: { cookie } });
    const listData = (await listRes.json()) as { entries: DiaryEntry[] };
    expect(listData.entries).toHaveLength(1);
    expect(listData.entries[0].watched_date).toBe("2024-01-15");
  });

  test("validates the diary payload", async () => {
    cookie = await registerAndLogin(app);
    const res = await app.request("/diary", {
      method: "POST",
      body: JSON.stringify({ film_id: 550, watched_date: "not-a-date" }),
      headers: { cookie, "Content-Type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  test("updates an existing entry", async () => {
    mockedTmdb.getDetail.mockResolvedValue(filmDetail);
    cookie = await registerAndLogin(app);

    const createRes = await app.request("/diary", {
      method: "POST",
      body: JSON.stringify(entryBody),
      headers: { cookie, "Content-Type": "application/json" },
    });
    const { entry } = (await createRes.json()) as { entry: DiaryEntry };

    const updateRes = await app.request(`/diary/${entry.id}`, {
      method: "PUT",
      body: JSON.stringify({ rating: 5, review: "Even better" }),
      headers: { cookie, "Content-Type": "application/json" },
    });
    expect(updateRes.status).toBe(200);
    const updateData = (await updateRes.json()) as { entry: DiaryEntry };
    expect(updateData.entry.rating).toBe(5);
    expect(updateData.entry.review).toBe("Even better");
    expect(updateData.entry.watched_date).toBe("2024-01-15");
  });

  test("deletes an entry", async () => {
    mockedTmdb.getDetail.mockResolvedValue(filmDetail);
    cookie = await registerAndLogin(app);

    const createRes = await app.request("/diary", {
      method: "POST",
      body: JSON.stringify(entryBody),
      headers: { cookie, "Content-Type": "application/json" },
    });
    const { entry } = (await createRes.json()) as { entry: DiaryEntry };

    const delRes = await app.request(`/diary/${entry.id}`, { method: "DELETE", headers: { cookie } });
    expect(delRes.status).toBe(200);

    const listRes = await app.request("/diary", { headers: { cookie } });
    const listData = (await listRes.json()) as { entries: DiaryEntry[] };
    expect(listData.entries).toHaveLength(0);
  });

  test("cannot access another user's entry", async () => {
    mockedTmdb.getDetail.mockResolvedValue(filmDetail);
    cookie = await registerAndLogin(app);

    const createRes = await app.request("/diary", {
      method: "POST",
      body: JSON.stringify(entryBody),
      headers: { cookie, "Content-Type": "application/json" },
    });
    const { entry } = (await createRes.json()) as { entry: DiaryEntry };

    await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "other@test.com", username: "otheruser", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const otherRes = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: "other@test.com", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const otherCookie = otherRes.headers.get("Set-Cookie")?.split(";")[0] || "";

    const res = await app.request(`/diary/${entry.id}`, { method: "GET", headers: { cookie: otherCookie } });
    expect(res.status).toBe(404);
  });
});
