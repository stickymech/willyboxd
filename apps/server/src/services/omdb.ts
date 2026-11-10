import { TMDB_CACHE_TTL_DAYS } from "@willyboxd/shared";
import { createRateLimitedCache } from "../lib/rateLimited";

const BASE_URL = "https://www.omdbapi.com";
const RATE_LIMIT_DELAY = 300;

function getApiKey(): string {
  return process.env.OMDB_API_KEY || "";
}

if (!getApiKey() && process.env.NODE_ENV !== "test") {
  console.warn("⚠️  OMDB_API_KEY not set. IMDb ratings will be unavailable.");
  console.warn("   Get a free key at https://www.omdbapi.com/apikey.aspx");
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

const fetchCached = createRateLimitedCache<OmdbRatings>({
  delay: RATE_LIMIT_DELAY,
  ttlMs: TMDB_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000,
});

export const omdbService = {
  async getRatings(imdbId: string): Promise<OmdbRatings> {
    const apiKey = getApiKey();
    if (!imdbId || !apiKey) {
      return { imdb: null, rt: null, metacritic: null };
    }

    try {
      return await fetchCached(`i=${imdbId}`, async () => {
        const params = new URLSearchParams({ i: imdbId, apikey: apiKey });
        const response = await fetch(`${BASE_URL}/?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`OMDB API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as OmdbResponse;
        const imdbRaw = parseFloat(data.imdbRating ?? "N/A");
        const imdb = Number.isFinite(imdbRaw) ? imdbRaw : null;

        const rt = data.Ratings?.find((entry) => entry.Source === "Rotten Tomatoes")?.Value;
        const metacritic = data.Ratings?.find((entry) => entry.Source === "Metacritic")?.Value;

        return {
          imdb,
          rt: rt ? parsePercent(rt) : null,
          metacritic: metacritic ? parseOutOfHundred(metacritic) : null,
        };
      });
    } catch (e) {
      console.warn(`OMDB lookup failed for ${imdbId}`, e);
      return { imdb: null, rt: null, metacritic: null };
    }
  },
};
