import { TMDB_CACHE_TTL_DAYS } from "@willyboxd/shared";

interface OmdbCacheEntry {
  data: unknown;
  timestamp: number;
}

const BASE_URL = "https://www.omdbapi.com";
const RATE_LIMIT_DELAY = 300;

function getApiKey(): string {
  return process.env.OMDB_API_KEY || "";
}

if (!getApiKey() && process.env.NODE_ENV !== "test") {
  console.warn("⚠️  OMDB_API_KEY not set. IMDb ratings will be unavailable.");
  console.warn("   Get a free key at https://www.omdbapi.com/apikey.aspx");
}

const cache = new Map<string, OmdbCacheEntry>();
const requestQueue: Array<() => void> = [];
let lastRequestTime = 0;
let processing = false;

function waitForRateLimit(): Promise<void> {
  return new Promise((resolve) => {
    const processQueue = () => {
      const now = Date.now();
      const wait = Math.max(0, RATE_LIMIT_DELAY - (now - lastRequestTime));

      setTimeout(() => {
        lastRequestTime = Date.now();
        const next = requestQueue.shift();
        if (next) {
          next();
        } else {
          processing = false;
        }
        resolve();
      }, wait);
    };

    if (processing) {
      requestQueue.push(processQueue);
    } else {
      processing = true;
      processQueue();
    }
  });
}

interface OmdbResponse {
  imdbRating: string;
  Response?: string;
}

export const omdbService = {
  async getRating(imdbId: string): Promise<number | null> {
    const apiKey = getApiKey();
    if (!imdbId || !apiKey) {
      return null;
    }

    const cacheKey = `i=${imdbId}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < TMDB_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
      return cached.data as number | null;
    }

    await waitForRateLimit();

    try {
      const params = new URLSearchParams({ i: imdbId, apikey: apiKey });
      const response = await fetch(`${BASE_URL}/?${params.toString()}`);

      if (!response.ok) {
        console.warn(`OMDB API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = (await response.json()) as OmdbResponse;
      const rating = parseFloat(data.imdbRating);
      const result = Number.isFinite(rating) ? rating : null;

      cache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } catch (e) {
      console.warn(`OMDB lookup failed for ${imdbId}`, e);
      return null;
    }
  },
};
