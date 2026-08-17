# score-display-labels Tasks

## 1. Shared utilities

- [x] 1.1 Round `toStarRating` to the nearest half-star (`Math.round(x) / 2`)
- [x] 1.2 Round `toHundredStarRating` to the nearest half-star (`Math.round(x / 10) / 2`)
- [x] 1.3 Add `formatScore` rendering a 0–5 value as an `N/5` label (e.g. `4/5`, `4.5/5`)
- [x] 1.4 Unit tests in `packages/shared/src/constants.test.ts` for both converters and `formatScore`

## 2. Client display

- [x] 2.1 Hero renders the numeric `N/5` label beside each star row (TMDB, IMDb, RT, Metacritic)
- [x] 2.2 Hero shows a "No ratings available yet." note when no score data exists (`vote_count` 0 and all ratings null); no empty star row
- [x] 2.3 `FilmCard` badge uses `formatScore(toStarRating(vote_average))` instead of `toFixed(1)`
- [x] 2.4 Client tests: labels render, note present/absent, no empty 0-star hero row

## 3. Docs & QA

- [x] 3.1 Update `scripts/qa-critic-scorecards.sh` expectations for half-star labels
- [x] 3.2 Add `scripts/qa-score-display-labels.sh` (static checks + targeted vitest + manual browser steps)

## 4. Verification & wrap-up

- [ ] 4.1 Quality gate green: `npm run lint && npm run typecheck && npm run test && npm run build`
- [ ] 4.2 Push branch; open PR with base `embedded-trailers`, `Fixes #26`, and OpenSpec change link
- [ ] 4.3 Manual browser QA verified by user
- [ ] 4.4 Archive the OpenSpec change (`openspec-archive-change`) and confirm main specs synced