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
});
