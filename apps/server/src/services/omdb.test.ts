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

  test("returns a parsed 0–10 rating for a valid imdb_id", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toContain("https://www.omdbapi.com/?");
      expect(url).toContain("i=tt0137523");
      expect(url).toContain("apikey=test-omdb-key");
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ imdbRating: "8.8", Response: "True" }),
      };
    });

    await expect(omdbService.getRating("tt0137523")).resolves.toBe(8.8);
  });

  test("returns null when imdbRating is N/A", async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ imdbRating: "N/A", Response: "True" }),
    }));

    await expect(omdbService.getRating("tt0000001")).resolves.toBeNull();
  });

  test("returns null when the API key is unset", async () => {
    const original = process.env.OMDB_API_KEY;
    delete process.env.OMDB_API_KEY;

    try {
      await expect(omdbService.getRating("tt0137523")).resolves.toBeNull();
    } finally {
      process.env.OMDB_API_KEY = original;
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("returns null and warns when the request fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({}),
    }));

    await expect(omdbService.getRating("tt0999999")).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
