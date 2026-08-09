## Why

The film/TV detail page already carries the data needed to link out to the source sites (`imdb_id`, TMDB id/type), but there is no way to jump from a title to its IMDb or TMDB page. It's a near-free win that improves trust and discoverability for the anime-loving audience.

## What Changes

- Add helper functions that build IMDb and TMDB external URLs from the existing `FilmDetail` fields.
- Render a "View on IMDb" link on the detail page when `imdb_id` is present.
- Render a "View on TMDB" link on the detail page.
- Both links open in a new tab (`target=_blank` + `rel=noreferrer`).
- No new upstream calls, no schema migration, no breaking changes.

## Capabilities

### New Capabilities
- `external-links`: Detail page renders outbound "View on IMDb" / "View on TMDB" links derived from existing film detail data, hidden when the target id is absent.

### Modified Capabilities
<!-- none -->

## Impact

- `packages/shared/src/constants.ts` (or equivalent): new URL builder helpers.
- `apps/client/src/routes/FilmDetail.tsx`: render the external link row in the hero.
- `apps/client/src/routes/FilmDetail.test.tsx`: tests for link presence/absence.
