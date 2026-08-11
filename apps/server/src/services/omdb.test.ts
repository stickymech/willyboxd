import { describe, test, expect, vi, afterEach } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.OMDB_API_KEY = "test-omdb-key";
});

const fetchMock = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", fetchMock);

import { omdbService } from "./omdb";

describe("OMDB Service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("returns parsed imdb, rt, and metacritic ratings for a valid imdb_id", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toContain("https://www.omdbapi.com/?");
      expect(url).toContain("i=tt0137523");
      expect(url).toContain("apikey=test-omdb-key");
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          imdbRating: "8.8",
          Ratings: [
            { Source: "Internet Movie Database", Value: "8.8/10" },
            { Source: "Rotten Tomatoes", Value: "79%" },
            { Source: "Metacritic", Value: "66/100" },
          ],
          Response: "True",
        }),
      };
    });

    await expect(omdbService.getRatings("tt0137523")).resolves.toEqual({
      imdb: 8.8,
      rt: 79,
      metacritic: 66,
    });
  });

  test("returns nulls when ratings are N/A or missing", async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ imdbRating: "N/A", Response: "True" }),
    }));

    await expect(omdbService.getRatings("tt0000001")).resolves.toEqual({
      imdb: null,
      rt: null,
      metacritic: null,
    });
  });

  test("returns nulls for a source with an unparseable value", async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        imdbRating: "8.8",
        Ratings: [{ Source: "Rotten Tomatoes", Value: "N/A" }],
        Response: "True",
      }),
    }));

    await expect(omdbService.getRatings("tt0137524")).resolves.toEqual({
      imdb: 8.8,
      rt: null,
      metacritic: null,
    });
  });

  test("returns nulls when the API key is unset", async () => {
    const original = process.env.OMDB_API_KEY;
    delete process.env.OMDB_API_KEY;

    try {
      await expect(omdbService.getRatings("tt0137523")).resolves.toEqual({
        imdb: null,
        rt: null,
        metacritic: null,
      });
    } finally {
      process.env.OMDB_API_KEY = original;
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("returns nulls and warns when the request fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({}),
    }));

    await expect(omdbService.getRatings("tt0999999")).resolves.toEqual({
      imdb: null,
      rt: null,
      metacritic: null,
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
