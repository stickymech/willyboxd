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

  test("getTrending normalizes raw results into MediaItems (type + title)", async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        results: [
          { id: 1, title: "Movie A", media_type: "movie", original_language: "en", poster_path: null, backdrop_path: null, overview: "", vote_average: 8, genre_ids: [16] },
          { id: 2, name: "Show B", media_type: "tv", original_language: "ja", poster_path: null, backdrop_path: null, overview: "", vote_average: 9, genre_ids: [16] },
        ],
      }),
    }));

    const { results } = await tmdbService.getTrending("week");

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ id: 1, title: "Movie A", type: "movie" });
    expect(results[1]).toMatchObject({ id: 2, title: "Show B", type: "tv" });
  });

  test("retries once on a transient upstream 5xx before succeeding", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: "Server Error", json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          results: [
            {
              id: 1,
              title: "Retried",
              media_type: "movie",
              original_language: "en",
              poster_path: null,
              backdrop_path: null,
              overview: "",
              vote_average: 8,
              genre_ids: [],
            },
          ],
        }),
      });

    const results = await tmdbService.searchMulti("retry", 1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results[0].title).toBe("Retried");
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
      if (path.endsWith("/videos")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
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

  test("getDetail resolves with empty reviews when the reviews call fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockImplementation(async (url: string) => {
      const path = url.split("?")[0];
      if (path.endsWith("/reviews")) {
        return { ok: false, status: 500, statusText: "Server Error", json: async () => ({}) };
      }
      if (path.endsWith("/credits")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 3, cast: [], crew: [] }) };
      }
      if (path.endsWith("/images")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 3, backdrops: [], posters: [] }) };
      }
      if (path.endsWith("/videos")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
      }
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ id: 3, title: "Film", overview: "", poster_path: null, backdrop_path: null, genres: [], vote_average: 8 }),
      };
    });

    const detail = await tmdbService.getDetail(3, "movie");

    expect(detail.reviews).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
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
      if (path.endsWith("/videos")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
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

  test("getDetail maps imdb_id, imdb_rating, rt_rating, and metacritic_rating from external_ids + OMDB", async () => {
    const originalKey = process.env.OMDB_API_KEY;
    process.env.OMDB_API_KEY = "test-omdb-key";

    fetchMock.mockImplementation(async (url: string) => {
      const path = url.split("?")[0];
      if (url.startsWith("https://www.omdbapi.com/")) {
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
      }
      if (path.endsWith("/external_ids")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 4, imdb_id: "tt0137523" }) };
      }
      if (path.endsWith("/reviews")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
      }
      if (path.endsWith("/credits")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 4, cast: [], crew: [] }) };
      }
      if (path.endsWith("/images")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 4, backdrops: [], posters: [] }) };
      }
      if (path.endsWith("/videos")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
      }
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ id: 4, title: "Fight Club", overview: "", poster_path: null, backdrop_path: null, genres: [], vote_average: 8.4 }),
      };
    });

    const detail = await tmdbService.getDetail(4, "movie");

    process.env.OMDB_API_KEY = originalKey;

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/movie/4/external_ids"));
    expect(detail.imdb_id).toBe("tt0137523");
    expect(detail.imdb_rating).toBe(8.8);
    expect(detail.rt_rating).toBe(79);
    expect(detail.metacritic_rating).toBe(66);
  });

  test("getDetail resolves imdb fields as null when external_ids fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockImplementation(async (url: string) => {
      const path = url.split("?")[0];
      if (path.endsWith("/external_ids")) {
        return { ok: false, status: 500, statusText: "Server Error", json: async () => ({}) };
      }
      if (path.endsWith("/reviews")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
      }
      if (path.endsWith("/credits")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 5, cast: [], crew: [] }) };
      }
      if (path.endsWith("/images")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 5, backdrops: [], posters: [] }) };
      }
      if (path.endsWith("/videos")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
      }
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ id: 5, title: "Film", overview: "", poster_path: null, backdrop_path: null, genres: [], vote_average: 8 }),
      };
    });

    const detail = await tmdbService.getDetail(5, "movie");

    expect(detail.imdb_id).toBeNull();
    expect(detail.imdb_rating).toBeNull();
    expect(detail.rt_rating).toBeNull();
    expect(detail.metacritic_rating).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test("getDetail maps the first YouTube trailer from videos", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const path = url.split("?")[0];
      if (path.endsWith("/videos")) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            results: [
              { key: "teaser1", name: "Teaser", site: "YouTube", type: "Teaser" },
              { key: "trailer1", name: "Official Trailer", site: "YouTube", type: "Trailer" },
              { key: "clip1", name: "Clip", site: "YouTube", type: "Clip" },
            ],
          }),
        };
      }
      if (path.endsWith("/reviews")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
      }
      if (path.endsWith("/credits")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 6, cast: [], crew: [] }) };
      }
      if (path.endsWith("/images")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 6, backdrops: [], posters: [] }) };
      }
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ id: 6, title: "Film", overview: "", poster_path: null, backdrop_path: null, genres: [], vote_average: 8 }),
      };
    });

    const detail = await tmdbService.getDetail(6, "movie");

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/movie/6/videos"));
    expect(detail.trailer).toEqual({ key: "trailer1", name: "Official Trailer" });
  });

  test("getDetail resolves trailer as null when no YouTube trailer exists", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const path = url.split("?")[0];
      if (path.endsWith("/videos")) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            results: [
              { key: "x1", name: "Teaser", site: "YouTube", type: "Teaser" },
              { key: "x2", name: "Trailer", site: "Vimeo", type: "Trailer" },
            ],
          }),
        };
      }
      if (path.endsWith("/reviews")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
      }
      if (path.endsWith("/credits")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 7, cast: [], crew: [] }) };
      }
      if (path.endsWith("/images")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 7, backdrops: [], posters: [] }) };
      }
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ id: 7, title: "Film", overview: "", poster_path: null, backdrop_path: null, genres: [], vote_average: 8 }),
      };
    });

    const detail = await tmdbService.getDetail(7, "movie");

    expect(detail.trailer).toBeNull();
  });

  test("getDetail maps vote_count from the detail response", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const path = url.split("?")[0];
      if (path.endsWith("/reviews")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
      }
      if (path.endsWith("/credits")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 9, cast: [], crew: [] }) };
      }
      if (path.endsWith("/images")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 9, backdrops: [], posters: [] }) };
      }
      if (path.endsWith("/videos")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
      }
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ id: 9, title: "Film", overview: "", poster_path: null, backdrop_path: null, genres: [], vote_average: 7.5, vote_count: 42 }),
      };
    });

    const detail = await tmdbService.getDetail(9, "movie");

    expect(detail.vote_count).toBe(42);
  });

  test("getDetail resolves trailer as null when the videos call fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockImplementation(async (url: string) => {
      const path = url.split("?")[0];
      if (path.endsWith("/videos")) {
        return { ok: false, status: 500, statusText: "Server Error", json: async () => ({}) };
      }
      if (path.endsWith("/reviews")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ results: [] }) };
      }
      if (path.endsWith("/credits")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 8, cast: [], crew: [] }) };
      }
      if (path.endsWith("/images")) {
        return { ok: true, status: 200, statusText: "OK", json: async () => ({ id: 8, backdrops: [], posters: [] }) };
      }
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ id: 8, title: "Film", overview: "", poster_path: null, backdrop_path: null, genres: [], vote_average: 8 }),
      };
    });

    const detail = await tmdbService.getDetail(8, "movie");

    expect(detail.trailer).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
