import { describe, test, expect, vi, afterEach } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.TMDB_API_KEY = "test-key";
});

const fetchMock = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", fetchMock);

import { tmdbService } from "./tmdb";

describe("TMDB Service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("handles concurrent requests without hanging (rate limiter queue)", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ results: [{ id: 1, name: `res-${url}` }] }),
      };
    });

    const results = await Promise.all([
      tmdbService.getPopular("movie", 1),
      tmdbService.getPopular("movie", 2),
      tmdbService.getPopular("movie", 3),
    ]);

    expect(results).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test("returns error from upstream API", async () => {
    fetchMock.mockImplementation(async () => {
      return { ok: false, status: 500, statusText: "Internal Server Error", json: async () => ({}) };
    });

    await expect(tmdbService.getPopular("tv", 99)).rejects.toThrow("TMDB API error");
  });

  test("maps original_language from search results", async () => {
    fetchMock.mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          results: [
            {
              id: 1,
              name: "Naruto",
              media_type: "tv",
              original_language: "ja",
              poster_path: null,
              backdrop_path: null,
              overview: "",
              vote_average: 8,
              genre_ids: [16],
            },
            {
              id: 2,
              title: "Coco",
              media_type: "movie",
              original_language: "es",
              poster_path: null,
              backdrop_path: null,
              overview: "",
              vote_average: 8,
              genre_ids: [16],
            },
          ],
        }),
      };
    });

    const results = await tmdbService.searchMulti("test", 1);
    expect(results[0].original_language).toBe("ja");
    expect(results[1].original_language).toBe("es");
  });

  test("getAnime merges and dedupes movie/tv results by id", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const isMovie = url.includes("discover/movie");
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          results: isMovie
            ? [
                {
                  id: 100,
                  title: "Anime Movie A",
                  media_type: "movie",
                  original_language: "ja",
                  poster_path: null,
                  backdrop_path: null,
                  overview: "",
                  vote_average: 8,
                  genre_ids: [16],
                },
                {
                  id: 200,
                  title: "Anime Movie B",
                  media_type: "movie",
                  original_language: "ja",
                  poster_path: null,
                  backdrop_path: null,
                  overview: "",
                  vote_average: 7,
                  genre_ids: [16],
                },
              ]
            : [
                {
                  id: 100,
                  name: "Anime Movie A",
                  media_type: "tv",
                  original_language: "ja",
                  poster_path: null,
                  backdrop_path: null,
                  overview: "",
                  vote_average: 8,
                  genre_ids: [16],
                },
                {
                  id: 300,
                  name: "Anime TV C",
                  media_type: "tv",
                  original_language: "ja",
                  poster_path: null,
                  backdrop_path: null,
                  overview: "",
                  vote_average: 9,
                  genre_ids: [16],
                },
              ],
        }),
      };
    });

    const results = await tmdbService.getAnime(undefined, 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.id).sort()).toEqual([100, 200, 300]);
  });
});
