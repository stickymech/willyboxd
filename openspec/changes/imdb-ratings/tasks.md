## 1. Shared

- [x] 1.1 Add `toStarRating(value: number): number` (`value / 2`) to `packages/shared/src/constants.ts`
- [x] 1.2 Extend `FilmDetail` in `packages/shared/src/types.ts` with `imdb_id: string | null` and `imdb_rating: number | null`
- [x] 1.3 Add shared test for `toStarRating` in `packages/shared/src/constants.test.ts`

## 2. Server

- [x] 2.1 Add `omdbService` to `apps/server/src/services/omdb.ts` (cached + rate-limited fetch of `https://www.omdbapi.com/?i=<imdb_id>`; returns raw 0–10 rating or `null`; warns + returns `null` when `OMDB_API_KEY` unset or fetch fails)
- [x] 2.2 Update `tmdbService.getDetail` to fetch `external_ids`, chain the OMDB rating lookup (non-fatal), and map `imdb_id` / `imdb_rating` onto the payload
- [x] 2.3 Add `OMDB_API_KEY` placeholder to `apps/server/.env.example`
- [x] 2.4 Add server tests: omdb service (rating, `N/A`, no key, outage) and `getDetail` imdb mapping (present, null, non-fatal failure)

## 3. Client

- [x] 3.1 Refactor hero TMDB stars to use shared `toStarRating`
- [x] 3.2 Render a labeled IMDb line under the hero stars with `Stars` (÷2), hidden when `imdb_rating` is null
- [x] 3.3 Add client tests: IMDb line renders with stars when present; no IMDb line when null

## 4. Quality gate

- [x] 4.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` and fix any failures
