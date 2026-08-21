import { describe, test, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_PATH = "./data/test-films.db";
  process.env.TMDB_API_KEY = "test-key";
  process.env.OMDB_API_KEY = "test-omdb-key";
});

vi.mock("./tmdb", () => ({
  tmdbService: {
    getDetail: vi.fn(),
    getExternalIds: vi.fn(),
  },
}));
vi.mock("./omdb", () => ({
  omdbService: {
    getRatings: vi.fn(),
  },
}));

import { tmdbService } from "./tmdb";
import { omdbService } from "./omdb";
import { db } from "../db";
import { enrichRatings, syncFilm } from "./films";
import type { FilmDetail } from "@willyboxd/shared";

const mockedTmdb = vi.mocked(tmdbService);
const mockedOmdb = vi.mocked(omdbService);

const detailFixture: FilmDetail = {
  id: 550,
  title: "Fight Club",
  type: "movie",
  poster_path: null,
  backdrop_path: null,
  overview: "",
  release_date: "1999-10-15",
  first_air_date: null,
  original_language: "en",
  vote_average: 8.4,
  vote_count: 0,
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
  imdb_id: "tt0137523",
  imdb_rating: 8.8,
  rt_rating: 79,
  metacritic_rating: 66,
  trailer: null,
  reviews: [],
};

describe("films service", () => {
  beforeAll(() => {
    db.prepare("DELETE FROM film_ratings").run();
    db.prepare("DELETE FROM films").run();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("enrichRatings returns cached film row ratings without touching upstream", async () => {
    db.prepare(
      `INSERT INTO films (tmdb_id, title, type, vote_average, imdb_id, imdb_rating, rt_rating, metacritic_rating)
       VALUES (550, 'Fight Club', 'movie', 8.4, 'tt0137523', 8.8, 79, 66)`,
    ).run();

    const result = await enrichRatings(550, "movie");

    expect(mockedTmdb.getExternalIds).not.toHaveBeenCalled();
    expect(mockedOmdb.getRatings).not.toHaveBeenCalled();
    expect(result).toEqual({ imdb_id: "tt0137523", imdb_rating: 8.8, rt_rating: 79, metacritic_rating: 66 });
  });

  test("enrichRatings falls back to the film_ratings cache table", async () => {
    db.prepare("DELETE FROM films").run();
    db.prepare(
      `INSERT INTO film_ratings (tmdb_id, type, imdb_id, imdb_rating, rt_rating, metacritic_rating)
       VALUES (157336, 'tv', 'tt0816692', 8.4, 71, 61)`,
    ).run();

    const result = await enrichRatings(157336, "tv");

    expect(mockedTmdb.getExternalIds).not.toHaveBeenCalled();
    expect(result).toEqual({ imdb_id: "tt0816692", imdb_rating: 8.4, rt_rating: 71, metacritic_rating: 61 });
  });

  test("enrichRatings performs a live lookup and stores it in the cache table", async () => {
    db.prepare("DELETE FROM films").run();
    db.prepare("DELETE FROM film_ratings").run();
    mockedTmdb.getExternalIds.mockResolvedValue({ id: 999, imdb_id: "tt9999999" });
    mockedOmdb.getRatings.mockResolvedValue({ imdb: 7.7, rt: 64, metacritic: null });

    const result = await enrichRatings(999, "movie");

    expect(mockedTmdb.getExternalIds).toHaveBeenCalledWith(999, "movie");
    expect(mockedOmdb.getRatings).toHaveBeenCalledWith("tt9999999");
    expect(result).toEqual({ imdb_id: "tt9999999", imdb_rating: 7.7, rt_rating: 64, metacritic_rating: null });

    const cached = db.prepare("SELECT * FROM film_ratings WHERE tmdb_id = 999").get() as {
      imdb_id: string;
      imdb_rating: number;
    };
    expect(cached.imdb_id).toBe("tt9999999");
    expect(cached.imdb_rating).toBe(7.7);
  });

  test("syncFilm refreshes a legacy row with NULL ratings on next sync", async () => {
    db.prepare(
      "INSERT OR REPLACE INTO films (tmdb_id, title, type, vote_average, imdb_id, imdb_rating, last_updated) VALUES (42, 'Old', 'movie', 0, NULL, NULL, datetime('now'))",
    ).run();

    mockedTmdb.getDetail.mockResolvedValue({ ...detailFixture, id: 42, title: "Refreshed", imdb_rating: 8.8 });

    const item = await syncFilm(42, "movie");

    expect(mockedTmdb.getDetail).toHaveBeenCalledWith(42, "movie");
    expect(item.title).toBe("Refreshed");
    expect(item.imdb_rating).toBe(8.8);
  });

  afterAll(() => {
    db.close();
  });
});