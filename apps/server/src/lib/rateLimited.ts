export interface RateLimitedCacheOptions {
  /** Minimum gap between upstream requests, in milliseconds. */
  delay: number;
  /** How long a successful response is served from memory, in milliseconds. */
  ttlMs: number;
}

/**
 * Serializes upstream requests through a delay queue and caches successful
 * responses in memory, keyed by caller. Used by the TMDB and OMDB
 * integrations to stay under their respective rate limits.
 *
 * Failed loads propagate to the caller and are NOT cached, so a transient
 * upstream error is retried on the next call.
 */
export function createRateLimitedCache<T>({ delay, ttlMs }: RateLimitedCacheOptions) {
  const cache = new Map<string, { data: T; timestamp: number }>();
  const queue: Array<() => void> = [];
  let lastRequestTime = 0;
  let processing = false;

  function waitForRateLimit(): Promise<void> {
    return new Promise((resolve) => {
      const processQueue = () => {
        const now = Date.now();
        const wait = Math.max(0, delay - (now - lastRequestTime));

        setTimeout(() => {
          lastRequestTime = Date.now();
          const next = queue.shift();
          if (next) {
            next();
          } else {
            processing = false;
          }
          resolve();
        }, wait);
      };

      if (processing) {
        queue.push(processQueue);
      } else {
        processing = true;
        processQueue();
      }
    });
  }

  return async function fetchCached(key: string, load: () => Promise<T>): Promise<T> {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.data;
    }

    await waitForRateLimit();
    const data = await load();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  };
}
