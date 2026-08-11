## Why

Review cards on the detail page link out to the source site but never say which site that is. A small human-readable source label makes reviews feel trustworthy and helps users judge credibility before clicking.

## What Changes

- Add a shared helper that turns a review URL's hostname into a prettified, human-readable label (e.g. `www.themoviedb.org` → `TMDB`, `www.imdb.com` → `IMDb`, `rottentomatoes.com` → `Rotten Tomatoes`).
- Unknown hosts fall back to a readable hostname (e.g. `metacritic.com` → `metacritic.com`, `www.example.co.uk` → `example.co.uk`).
- Review cards render the label near the existing "Read review ↗" link; missing/unparseable URLs render no label.
- No API changes, no breaking changes.

## Capabilities

### New Capabilities
- `review-source-label`: Detail page review cards render a human-readable source label derived from the review URL.

### Modified Capabilities
<!-- none -->

## Impact

- `packages/shared/src/constants.ts` (or equivalent): new `getReviewSourceLabel` helper.
- `packages/shared/src/constants.test.ts`: tests for mapped, unknown, and missing URL cases.
- `apps/client/src/routes/FilmDetail.tsx` + `FilmDetail.test.tsx`: render the label in `ReviewCard`.
