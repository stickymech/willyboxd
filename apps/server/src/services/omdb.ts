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

export interface OmdbRatings {
  imdb: number | null;
  rt: number | null;
  metacritic: number | null;
}

interface OmdbRatingEntry {
  Source?: string;
  Value?: string;
}

interface OmdbResponse {
  imdbRating?: string;
  Ratings?: OmdbRatingEntry[];
  Response?: string;
}

function parsePercent(value: string): number | null {
  const match = /^(\d+(?:\.\d+)?)%/.exec(value.trim());
  if (!match) return null;
  const parsed = parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOutOfHundred(value: string): number | null {
  const match = /^(\d+(?:\.\d+)?)\/100/.exec(value.trim());
  if (!match) return null;
  const parsed = parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export const omdbService = {
  async getRatings(imdbId: string): Promise<OmdbRatings> {
    const apiKey = getApiKey();
    if (!imdbId || !apiKey) {
      return { imdb: null, rt: null, metacritic: null };
    }

    const cacheKey = `i=${imdbId}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < TMDB_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
      return cached.data as OmdbRatings;
    }

    await waitForRateLimit();

    try {
      const params = new URLSearchParams({ i: imdbId, apikey: apiKey });
      const response = await fetch(`${BASE_URL}/?${params.toString()}`);

      if (!response.ok) {
        console.warn(`OMDB API error: ${response.status} ${response.statusText}`);
        return { imdb: null, rt: null, metacritic: null };
      }

      const data = (await response.json()) as OmdbResponse;
      const imdbRaw = parseFloat(data.imdbRating ?? "N/A");
      const imdb = Number.isFinite(imdbRaw) ? imdbRaw : null;

      const rt = data.Ratings?.find((entry) => entry.Source === "Rotten Tomatoes")?.Value;
      const metacritic = data.Ratings?.find((entry) => entry.Source === "Metacritic")?.Value;

      const result: OmdbRatings = {
        imdb,
        rt: rt ? parsePercent(rt) : null,
        metacritic: metacritic ? parseOutOfHundred(metacritic) : null,
      };

      cache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } catch (e) {
      console.warn(`OMDB lookup failed for ${imdbId}`, e);
      return { imdb: null, rt: null, metacritic: null };
    }
  },
};
