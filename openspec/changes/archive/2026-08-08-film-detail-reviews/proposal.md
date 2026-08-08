## Why

The film/TV detail page gives users the synopsis, watchlist/diary actions, genres, and cast, but no sense of what critics and other viewers thought. Adding a reviews section with links out to each review source gives the page the depth of a Letterboxd-style title page.

This is **Slice 1** of the reviews work: reviews surfaced from the TMDB reviews endpoint (free, existing key, movies + TV). Critic scorecards (Rotten Tomatoes / Metacritic / IMDb) and external links are tracked as separate follow-up issues.

## What Changes

- **Server** (`apps/server/src/services/tmdb.ts`): `tmdbService.getDetail` additionally fetches `/movie/{id}/reviews` (or `/tv/{id}/reviews`) and includes the result in the film detail payload, reusing the existing rate-limiter and in-memory cache.
- **Shared types** (`packages/shared/src/types.ts`): extend `FilmDetail` with a `reviews` array (author, avatar path, rating, content, url, created date). No new Zod schemas needed — this payload is not user-submitted.
- **Client** (`apps/client/src/routes/FilmDetail.tsx`): render a "Reviews" section below the cast — author avatar, name, star rating, expandable content snippet, relative date, and a "Read review" link to each review's TMDB `url`. Hidden entirely when a title has no reviews.
- No new API keys or dependencies.

## Capabilities

### New Capabilities
- `film-reviews`: The film/TV detail page shows external reviews (author, rating, expandable content, outbound source link) sourced from TMDB, hidden when none exist.

### Modified Capabilities
<!-- None: no existing spec-level requirements change. -->

## Impact

- `apps/server/src/services/tmdb.ts`: `getDetail` fetches and maps reviews.
- `apps/server/src/services/tmdb.test.ts`: mock the reviews endpoint.
- `packages/shared/src/types.ts`: `FilmDetail.reviews` (+ `Review` type).
- `apps/client/src/routes/FilmDetail.tsx`: Reviews section.
- Tests: server service test for reviews mapping; client component test for rendering + empty state.
- `openspec/specs/film-reviews/spec.md` (new, synced on archive).
