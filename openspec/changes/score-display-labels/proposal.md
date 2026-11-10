## Why

Aggregate scores are currently shown as raw decimal star fills (e.g. `4.2`, `4.4`, `3.95`), which look fussy and are inconsistent with the half-star increments the app's `Stars` component supports. Users can't read the numeric value without hovering, and a title with no ratings at all shows a misleading empty star row.

## What Changes

- `toStarRating` (0–10 → 0.5–5) rounds to the nearest half-star (`Math.round(x) / 2`).
- `toHundredStarRating` (0–100 → 0.5–5) rounds to the nearest half-star (`Math.round(x / 10) / 2`).
- New `formatScore` renders a 0–5 value as an `N/5` label (`4`, `4.5`, `5` → `4/5`, `4.5/5`, `5/5`).
- The film/TV detail hero renders the numeric label beside each `Stars` row (TMDB aggregate, IMDb, Rotten Tomatoes, Metacritic) instead of a raw decimal.
- Film cards render the badge with the normalized `N/5` label instead of `vote_average.toFixed(1)`.
- The detail hero shows a "No ratings available yet." note when there is no score data at all (`vote_count` 0 and all rating fields null); the misleading empty star row is not shown.

## Capabilities

### New Capabilities
<!-- None: this is behavior change across existing rating displays, not a new surface. -->

### Modified Capabilities
- `film-reviews`: TMDB aggregate score rounds to the nearest half-star and is labeled with a numeric `N/5` value; a "No ratings available yet." note renders when no score data exists.
- `imdb-ratings`: IMDb rating rounds to the nearest half-star and is labeled with a numeric `N/5` value.
- `critic-scorecards`: RT/Metacritic ratings round to the nearest half-star and are labeled with numeric `N/5` values.

## Impact

- `packages/shared/src/constants.ts` — `toStarRating`, `toHundredStarRating` rounding; new `formatScore`; tests in `packages/shared/src/constants.test.ts`.
- `apps/client/src/routes/FilmDetail.tsx` — numeric label beside each hero star row; no-ratings note when no score data.
- `apps/client/src/components/FilmCard.tsx` — badge uses the normalized label.
- Tests: `apps/client/src/routes/FilmDetail.test.tsx`.
- QA: `scripts/qa-critic-scorecards.sh` expectations updated; new `scripts/qa-score-display-labels.sh`.
- No new dependencies; no API/CI changes.
