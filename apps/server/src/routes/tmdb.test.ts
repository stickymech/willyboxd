import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("../services/tmdb", () => ({
  tmdbService: {
    searchMulti: vi.fn(),
    getAnime: vi.fn(),
    getPopular: vi.fn(),
    getTrending: vi.fn(),
    getDetail: vi.fn(),
    getRecommendations: vi.fn(),
  },
}));

import { Hono } from "hono";
import { tmdbRoutes } from "./tmdb";
import { tmdbService } from "../services/tmdb";
import type { MediaItem } from "@willyboxd/shared";

const mocked = vi.mocked(tmdbService);

const animeItem: MediaItem = {
  id: 1,
  title: "Naruto",
  type: "tv",
  poster_path: null,
  backdrop_path: null,
  overview: "",
  release_date: null,
  first_air_date: "2002-10-03",
  original_language: "ja",
  vote_average: 8,
  genre_ids: [16],
};

const westernItem: MediaItem = {
  id: 2,
  title: "Coco",
  type: "movie",
  poster_path: null,
  backdrop_path: null,
  overview: "",
  release_date: "2017-11-22",
  first_air_date: null,
  original_language: "es",
  vote_average: 8,
  genre_ids: [16],
};

function createApp() {
  const app = new Hono();
  tmdbRoutes(app);
  return app;
}

describe("TMDB Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("search with anime=1 filters results to Japanese titles", async () => {
    mocked.searchMulti.mockResolvedValue([animeItem, westernItem]);
    const app = createApp();

    const res = await app.request("/films/search?q=test&anime=1");
    expect(res.status).toBe(200);
    expect(mocked.searchMulti).toHaveBeenCalledWith("test", 1);

    const data = (await res.json()) as { results: MediaItem[] };
    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe(1);
  });

  test("search without anime returns all results", async () => {
    mocked.searchMulti.mockResolvedValue([animeItem, westernItem]);
    const app = createApp();

    const res = await app.request("/films/search?q=test");
    const data = (await res.json()) as { results: MediaItem[] };
    expect(data.results).toHaveLength(2);
  });

  test("search requires q parameter", async () => {
    const app = createApp();
    const res = await app.request("/films/search");
    expect(res.status).toBe(400);
  });

  test("anime browse returns results for time=week", async () => {
    mocked.getAnime.mockResolvedValue([animeItem]);
    const app = createApp();

    const res = await app.request("/films/anime?time=week");
    expect(res.status).toBe(200);
    expect(mocked.getAnime).toHaveBeenCalledWith("week", 1);

    const data = (await res.json()) as { results: MediaItem[] };
    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe(1);
  });

  test("anime browse uses defaults when no query params", async () => {
    mocked.getAnime.mockResolvedValue([]);
    const app = createApp();

    const res = await app.request("/films/anime");
    expect(res.status).toBe(200);
    expect(mocked.getAnime).toHaveBeenCalledWith(undefined, 1);
  });

  test("anime browse returns 500 on upstream error", async () => {
    mocked.getAnime.mockRejectedValue(new Error("TMDB API error"));
    const app = createApp();

    const res = await app.request("/films/anime");
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("Failed to fetch anime");
  });
});
