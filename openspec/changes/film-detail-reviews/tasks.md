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
