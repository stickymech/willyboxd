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

  test("getDetail maps reviews and caps at 5", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const path = url.split("?")[0];
      if (path.endsWith("/reviews")) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            results: Array.from({ length: 7 }, (_, i) => ({
              id: `rev-${i}`,
              author: `Author ${i}`,
              author_details: { name: "", username: `user${i}`, avatar_path: i === 0 ? "/abc.jpg" : null, rating: 8.4 },
              content: `Review content ${i}`,
              created_at: "2021-01-01T00:00:00.000Z",
              url: `https://www.themoviedb.org/review/rev-${i}`,
            })),
          }),
        };
      }
      if (path.endsWith("/credits")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 1, cast: [], crew: [] }) };
      }
      if (path.endsWith("/images")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 1, backdrops: [], posters: [] }) };
      }
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ id: 1, name: "Test", overview: "", poster_path: null, backdrop_path: null, genres: [], vote_average: 8 }),
      };
    });

    const detail = await tmdbService.getDetail(1, "movie");

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/movie/1/reviews"));
    expect(detail.reviews).toHaveLength(5);
    expect(detail.reviews[0]).toMatchObject({
      id: "rev-0",
      author: "Author 0",
      author_avatar_path: "/abc.jpg",
      rating: 8.4,
      url: "https://www.themoviedb.org/review/rev-0",
    });
  });

  test("getDetail returns empty reviews when a title has none", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const path = url.split("?")[0];
      if (path.endsWith("/reviews")) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({ results: [] }),
        };
      }
      if (path.endsWith("/credits")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 2, cast: [], crew: [] }) };
      }
      if (path.endsWith("/images")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 2, backdrops: [], posters: [] }) };
      }
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ id: 2, title: "Film", overview: "", poster_path: null, backdrop_path: null, genres: [], vote_average: 8 }),
      };
    });

    const detail = await tmdbService.getDetail(2, "movie");

    expect(detail.reviews).toEqual([]);
  });
});
