## 1. Shared types

- [ ] 1.1 Add `trailer: { key: string; name: string | null } | null` to `FilmDetail` in `packages/shared/src/types.ts`

## 2. Server: TMDB videos fetch

- [ ] 2.1 Add `TmdbVideo` and `TmdbVideos` interfaces in `apps/server/src/services/tmdb.ts`
- [ ] 2.2 Add a non-fatal `videosPromise` (`.catch` → empty results) in `getDetail`
- [ ] 2.3 Include videos in the `Promise.all` and map first YouTube trailer to `trailer` (else `null`)
- [ ] 2.4 Service tests in `apps/server/src/services/tmdb.test.ts`: trailer present, no YouTube trailer, videos fetch fails
- [ ] 2.5 Route test fixture in `apps/server/src/routes/tmdb.test.ts` includes `trailer`; assert detail response exposes it

## 3. Client: trailer embed

- [ ] 3.1 Render `https://www.youtube.com/embed/<key>` iframe in the `FilmDetail` hero when `film.trailer` is non-null
- [ ] 3.2 Client tests in `apps/client/src/routes/FilmDetail.test.tsx`: renders iframe when present, no player when null

## 4. Verification

- [ ] 4.1 Quality gate green: `npm run lint && npm run typecheck && npm run test && npm run build`
- [ ] 4.2 Add `scripts/qa-embedded-trailers.sh` (static checks + targeted vitest + manual browser steps)
- [ ] 4.3 Manual QA: title with trailer shows embed; trailer-less title shows no player; both pages load
- [ ] 4.4 Open PR with `Fixes #17`, push branch, verify CI after merge
- [ ] 4.5 Archive the OpenSpec change (`openspec-archive-change`) and confirm main specs synced
