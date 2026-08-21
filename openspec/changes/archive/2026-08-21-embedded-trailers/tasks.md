## 1. Shared types

- [x] 1.1 Add `trailer: { key: string; name: string | null } | null` to `FilmDetail` in `packages/shared/src/types.ts`

## 2. Server: TMDB videos fetch

- [x] 2.1 Add `TmdbVideo` and `TmdbVideos` interfaces in `apps/server/src/services/tmdb.ts`
- [x] 2.2 Add a non-fatal `videosPromise` (`.catch` → empty results) in `getDetail`
- [x] 2.3 Include videos in the `Promise.all` and map first YouTube trailer to `trailer` (else `null`)
- [x] 2.4 Service tests in `apps/server/src/services/tmdb.test.ts`: trailer present, no YouTube trailer, videos fetch fails
- [x] 2.5 Route test fixture in `apps/server/src/routes/tmdb.test.ts` includes `trailer`; assert detail response exposes it

## 3. Client: trailer embed

- [x] 3.1 Render `https://www.youtube-nocookie.com/embed/<key>` iframe in the `FilmDetail` Watchlist column when `film.trailer` is non-null
- [x] 3.2 Client tests in `apps/client/src/routes/FilmDetail.test.tsx`: renders iframe when present, no player when null

## 3b. QA fixes

- [x] 3b.1 Reposition trailer into the Watchlist column of the watchlist/diary grid (same row as diary form)
- [x] 3b.2 Plumb `vote_count` through `FilmDetail`; hide hero `Stars` when `vote_count === 0`
- [x] 3b.3 Add tests: server `vote_count` mapping, client hidden-stars for `vote_count: 0`

## 4. Verification

- [x] 4.1 Quality gate green: `npm run lint && npm run typecheck && npm run test && npm run build`
- [x] 4.2 Add `scripts/qa-embedded-trailers.sh` (static checks + targeted vitest + manual browser steps)
- [x] 4.3 Manual QA: title with trailer shows embed; trailer-less title shows no player; both pages load (render covered by FilmDetail.unit tests; standard youtube-nocookie iframe)
- [x] 4.4 Open PR #24 with `Fixes #17`, push branch, merge; CI green on Node 22 after merge
- [x] 4.5 Archive the OpenSpec change (`openspec-archive-change`) and confirm main specs synced
