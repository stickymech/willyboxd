import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("../services/tmdb", () => ({
  tmdbService: {
    searchMulti: vi.fn(),
    getAnime: vi.fn(),
    getPopular: vi.fn(),
    getTrending: vi.fn(),
    getDetail: vi.fn(),
    getRecommendations: vi.fn(),
    getExternalIds: vi.fn(),
  },
}));

vi.mock("../services/films", () => ({
  enrichRatings: vi.fn(),
  persistFilmDetail: vi.fn(),
}));

import { Hono } from "hono";
import { tmdbRoutes } from "./tmdb";
import { tmdbService } from "../services/tmdb";
import { enrichRatings, persistFilmDetail } from "../services/films";
import type { FilmDetail, MediaItem } from "@willyboxd/shared";

const mocked = vi.mocked(tmdbService);
const mockedEnrich = vi.mocked(enrichRatings);
const mockedPersist = vi.mocked(persistFilmDetail);

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
  imdb_id: null,
  imdb_rating: null,
  rt_rating: null,
  metacritic_rating: null,
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
  imdb_id: null,
  imdb_rating: null,
  rt_rating: null,
  metacritic_rating: null,
};

const baseDetail: FilmDetail = {
  id: 1,
  title: "Fight Club",
  type: "movie",
  poster_path: null,
  backdrop_path: null,
  overview: "",
  release_date: "1999-10-15",
  first_air_date: null,
  original_language: "en",
  vote_average: 8.4,
  vote_count: 1000,
  genre_ids: [],
  runtime: 139,
  budget: null,
  revenue: null,
  status: "Released",
  number_of_seasons: null,
  number_of_episodes: null,
  last_air_date: null,
  genres: [],
  credits: { cast: [], crew: [] },
  images: { backdrops: [], posters: [] },
  imdb_id: null,
  imdb_rating: null,
  rt_rating: null,
  metacritic_rating: null,
  trailer: null,
  reviews: [],
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

  test("films/:id returns film details with reviews", async () => {
    mocked.getDetail.mockResolvedValue({
      ...baseDetail,
      reviews: [{ id: "r1", author: "A", author_avatar_path: null, rating: 8, content: "Great", url: "https://example.com", created_at: "2020-01-01T00:00:00Z" }],
    });
    const app = createApp();

    const res = await app.request("/films/1?type=movie");
    expect(res.status).toBe(200);
    expect(mocked.getDetail).toHaveBeenCalledWith(1, "movie");
    const data = (await res.json()) as { film: FilmDetail };
    expect(data.film.reviews).toHaveLength(1);
    expect(data.film.reviews[0].author).toBe("A");
    expect(data.film.trailer).toBeNull();
  });

  test("films/:id returns trailer when present", async () => {
    mocked.getDetail.mockResolvedValue({
      ...baseDetail,
      trailer: { key: "abc123", name: "Official Trailer" },
    });
    const app = createApp();

    const res = await app.request("/films/1?type=movie");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { film: FilmDetail };
    expect(data.film.trailer).toEqual({ key: "abc123", name: "Official Trailer" });
  });

  test("films/ratings returns null-free ratings map for cached ids", async () => {
    mockedEnrich.mockResolvedValue({
      imdb_id: "tt0137523",
      imdb_rating: 8.8,
      rt_rating: 79,
      metacritic_rating: 66,
    });
    const app = createApp();

    const res = await app.request("/films/ratings?ids=550:movie");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ratings: Record<string, Record<string, string | number>> };
    expect(data.ratings["550"]).toEqual({ imdb_id: "tt0137523", imdb_rating: 8.8, rt_rating: 79, metacritic_rating: 66 });
    expect(mockedEnrich).toHaveBeenCalledWith(550, "movie");
  });

  test("films/ratings omits entries with no ratings and ignores invalid ids", async () => {
    mockedEnrich.mockImplementation(async (id) => {
      if (id === 1) return { imdb_id: null, imdb_rating: null, rt_rating: null, metacritic_rating: null };
      return { imdb_id: "tt0137523", imdb_rating: 8.8, rt_rating: null, metacritic_rating: null };
    });
    const app = createApp();

    const res = await app.request("/films/ratings?ids=1:movie,2:movie,bad:wat");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ratings: Record<string, Record<string, string | number>> };
    expect(data.ratings["1"]).toBeUndefined();
    expect(data.ratings["2"]).toEqual({ imdb_id: "tt0137523", imdb_rating: 8.8 });
    expect(mockedEnrich).toHaveBeenCalledTimes(2);
  });

  test("films/ratings caps bulk requests at 10 ids and is not shadowed by /films/:id", async () => {
    mockedEnrich.mockResolvedValue({
      imdb_id: "tt0137523",
      imdb_rating: 8.8,
      rt_rating: null,
      metacritic_rating: null,
    });
    const app = createApp();

    const ids = Array.from({ length: 15 }, (_, i) => `${i}:movie`).join(",");
    const res = await app.request(`/films/ratings?ids=${ids}`);
    expect(res.status).toBe(200);

    const data = (await res.json()) as { ratings: Record<string, Record<string, string | number>> };
    expect(Object.keys(data.ratings)).toHaveLength(10);
    expect(mockedEnrich).toHaveBeenCalledTimes(10);
    expect(mockedEnrich).not.toHaveBeenCalledWith(10, "movie");
  });

  test("films/:id persists detail ratings after fetch", async () => {
    mocked.getDetail.mockResolvedValue({
      ...baseDetail,
      imdb_id: "tt0137523",
      imdb_rating: 8.8,
      rt_rating: 79,
      metacritic_rating: 66,
    });
    const app = createApp();

    const res = await app.request("/films/1?type=movie");
    expect(res.status).toBe(200);
    expect(mockedPersist).toHaveBeenCalledWith({ ...baseDetail, imdb_id: "tt0137523", imdb_rating: 8.8, rt_rating: 79, metacritic_rating: 66 });
  });

  test("films/:id returns 500 when getDetail fails", async () => {
    mocked.getDetail.mockRejectedValue(new Error("TMDB API error"));
    const app = createApp();

    const res = await app.request("/films/1?type=movie");
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("Failed to fetch film details");
  });
});
