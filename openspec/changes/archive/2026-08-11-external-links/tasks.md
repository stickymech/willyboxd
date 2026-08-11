## 1. Shared URL helpers

- [ ] 1.1 Add `getImdbUrl(imdbId: string): string` and `getTmdbUrl(id: number, type: "movie" | "tv"): string` to `packages/shared/src/constants.ts`
- [ ] 1.2 Add unit tests for both helpers in `packages/shared/src/constants.test.ts` (movie/tv + id concatenation)

## 2. Client detail page links

- [ ] 2.1 Render a "View on IMDb" link (target=_blank, rel=noreferrer) in the FilmDetail hero when `imdb_id` is present
- [ ] 2.2 Render a "View on TMDB" link (target=_blank, rel=noreferrer) in the FilmDetail hero, always shown since id/type are always present
- [ ] 2.3 Add tests in `apps/client/src/routes/FilmDetail.test.tsx`: links present with correct hrefs, IMDb link hidden when `imdb_id` is null

## 3. Quality gate

- [ ] 3.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` green
