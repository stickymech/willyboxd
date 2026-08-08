## 1. Shared types

- [x] 1.1 Add `Review` type and `reviews: Review[]` to `FilmDetail` in `packages/shared/src/types.ts`

## 2. Server

- [x] 2.1 Add `TmdbReview` / `TmdbReviews` interfaces and fetch reviews alongside detail/credits/images in `tmdbService.getDetail`
- [x] 2.2 Map TMDB review shape to public `Review` (avatar path, 0–10 rating, content, url, created_at), cap at 5
- [x] 2.3 Add server test mocking the reviews endpoint (movie + tv + empty) in `apps/server/src/services/tmdb.test.ts`

## 3. Client

- [x] 3.1 Render a "Reviews" section in `FilmDetail.tsx`: avatar (with initial-letter fallback), author, stars, expandable content, "Read review" outbound link
- [x] 3.2 Hide the section when `reviews` is empty
- [x] 3.3 Add component test covering render + empty state

## 4. Quality gate

- [x] 4.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` and fix any failures

## 5. Follow-up fixes

- [x] 5.1 Make the reviews fetch non-fatal in `tmdbService.getDetail` (reviews failure resolves with `reviews: []` instead of failing the whole detail request)
- [x] 5.2 Add server test: `getDetail` resolves with empty reviews when the reviews call rejects
- [x] 5.3 Render an error state with "Try again" (`refetch`) in `FilmDetail.tsx` instead of infinite "Loading…" on query error, and set `retry: false` so errors surface immediately
- [x] 5.4 Add client test: film query error renders the error state, not infinite loading
- [x] 5.5 Render the hero aggregate score with `Stars` (vote_average / 2) on the canonical 0.5–5 scale, with no raw /10 number
- [x] 5.6 Re-run the quality gate after the follow-up fixes
