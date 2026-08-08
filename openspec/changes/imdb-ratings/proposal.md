## Why

The film/TV detail page shows the TMDB aggregate score, but viewers often weigh IMDb's rating too. Surfacing the IMDb aggregate alongside TMDB — on the app's single canonical 0.5–5 star scale — makes the page feel like a proper Letterboxd-style title page without introducing a second scoring system.

## What Changes

- **Server** (`apps/server/src/services/omdb.ts`): new OMDB client that queries `https://www.omdbapi.com/?i=<imdb_id>` for `imdbRating`, with the same in-memory cache + rate-limiting pattern as the TMDB service so OMDB's 1000 req/day free tier is respected.
- **Server** (`apps/server/src/services/tmdb.ts`): `tmdbService.getDetail` additionally fetches the title's `external_ids` to obtain `imdb_id`, then calls the OMDB client for the rating. The OMDB lookup is **non-fatal** — a missing `OMDB_API_KEY`, an OMDB outage, or no IMDb rating resolves to `null` and the detail request still succeeds.
- **Shared** (`packages/shared/src/types.ts`, `constants.ts`): `FilmDetail` gains `imdb_id: string | null` and `imdb_rating: number | null` (raw 0–10); a shared `toStarRating` helper wraps the `÷2` conversion so TMDB and IMDb normalize identically.
- **Client** (`apps/client/src/routes/FilmDetail.tsx`): the hero renders the IMDb aggregate via the existing `Stars` component (÷2), only when `imdb_rating` is present; no raw number shown.
- No new API keys beyond the optional `OMDB_API_KEY` in `apps/server/.env` (gitignored).

## Capabilities

### New Capabilities
- `imdb-ratings`: The film/TV detail page shows the IMDb aggregate rating sourced from OMDB, normalized onto the app's 0.5–5 star scale, hidden when unavailable.

### Modified Capabilities
<!-- None: the existing `film-reviews` requirements are unchanged (TMDB aggregate and reviews behavior stays as-is). -->

## Impact

- `apps/server/src/services/omdb.ts` (new) + `omdb.test.ts`.
- `apps/server/src/services/tmdb.ts`: `getDetail` maps `external_ids` + OMDB rating; `apps/server/src/services/tmdb.test.ts` updated mocks.
- `packages/shared/src/types.ts` (`FilmDetail.imdb_id`, `imdb_rating`), `constants.ts` (`toStarRating`).
- `apps/client/src/routes/FilmDetail.tsx` hero + `FilmDetail.test.tsx`.
- `apps/server/.env.example` documents the optional `OMDB_API_KEY`.
- `openspec/specs/imdb-ratings/spec.md` (new, synced on archive).
