## Why

The film/TV detail page has no video content — users can read synopses, reviews, and ratings but can't watch a trailer without leaving the app. TMDB already provides official trailers via its existing API key, so this is a cheap, high-value addition.

## What Changes

- `GET /api/films/:id?type=movie|tv` returns a new nullable `trailer` field (`{ key, name } | null`), sourced from TMDB `/movie|tv/{id}/videos` filtered to `type=Trailer`, `site=YouTube`.
- The film/TV detail page embeds the trailer as a YouTube iframe in the hero when one is available.
- No trailer or a videos-fetch failure is non-fatal: the page renders exactly as today with no trailer UI.
- Adds no new API keys or dependencies (reuses the existing TMDB key, rate-limiter, and cache).

## Capabilities

### New Capabilities
- `embedded-trailers`: Film detail API exposes an optional YouTube trailer key, and the detail page renders an embedded player when a trailer is present (hidden otherwise).

### Modified Capabilities
<!-- None: existing spec requirements are unchanged; this is a new surface. -->

## Impact

- `packages/shared/src/types.ts` — add `trailer` to `FilmDetail`.
- `apps/server/src/services/tmdb.ts` — add videos fetch in `getDetail` following the reviews/external_ids fallback pattern.
- `apps/server/src/routes/tmdb.ts` — response shape gains `film.trailer` automatically; no route logic change.
- `apps/client/src/routes/FilmDetail.tsx` — render trailer iframe in hero when present.
- Tests: `apps/server/src/services/tmdb.test.ts`, `apps/server/src/routes/tmdb.test.ts`, `apps/client/src/routes/FilmDetail.test.tsx`.
- No new dependencies. CI/tooling untouched.
