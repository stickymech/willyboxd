## 1. Shared helper

- [ ] 1.1 Add `toHundredStarRating(value: number): number` (÷20) to `packages/shared/src/constants.ts`
- [ ] 1.2 Add unit tests in `packages/shared/src/constants.test.ts` (e.g. 79 → 3.95, 66 → 3.3, 100 → 5, 0 → 0)

## 2. Server: OMDB parsing

- [ ] 2.1 Replace `omdbService.getRating` with `getRatings` returning `{ imdb, rt, metacritic }`, parsing the `Ratings` array (RT `%`, Metacritic `/100`)
- [ ] 2.2 Update `apps/server/src/services/omdb.test.ts` for the object return, source-absent, and failure/key-unset fallbacks
- [ ] 2.3 Update `apps/server/src/services/tmdb.ts` `getDetail` to map `imdb`/`rt`/`metacritic` into `FilmDetail`
- [ ] 2.4 Update `apps/server/src/services/tmdb.test.ts` for the new fields

## 3. Shared types + fixtures

- [ ] 3.1 Add `rt_rating: number | null` and `metacritic_rating: number | null` to `FilmDetail` in `packages/shared/src/types.ts`
- [ ] 3.2 Add the two fields to `FilmDetail` test fixtures in `apps/server/src/routes/{tmdb,diary,watchlist}.test.ts`

## 4. Client scorecards

- [ ] 4.1 Render conditional "Rotten Tomatoes" and "Metacritic" labeled scorecard lines in the `FilmDetail` hero using `Stars` + `toHundredStarRating`
- [ ] 4.2 Add tests in `apps/client/src/routes/FilmDetail.test.tsx`: present → star labels, absent → no line

## 5. Quality gate

- [ ] 5.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` green
