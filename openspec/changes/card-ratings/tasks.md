## 1. Shared types & constants

- [x] 1.1 Add `imdb_id: string | null`, `imdb_rating: number | null`, `rt_rating: number | null`, `metacritic_rating: number | null` to `MediaItem` in `packages/shared/src/types.ts`
- [x] 1.2 Add `toHalfStar(value: number): number` (`Math.round(value * 2) / 2`) in `packages/shared/src/constants.ts`
- [x] 1.3 Fix `ratingLabel` `1.5` glyph bug (`"½½"` → `"★½"`) in `packages/shared/src/constants.ts`
- [x] 1.4 Shared tests: `toHalfStar` rounding; `ratingLabel` at `1.5`

## 2. Server: schema & films service

- [x] 2.1 `apps/server/src/db.ts`: add four `films` columns to `init_films` CREATE TABLE
- [x] 2.2 `apps/server/src/db.ts`: create `film_ratings` cache table (PK `tmdb_id, type`)
- [x] 2.3 `apps/server/src/db.ts`: idempotent JS `ALTER TABLE films ADD COLUMN ...` guard after migration loop (existing DBs)
- [x] 2.4 `apps/server/src/services/films.ts`: add four fields to `FilmRow`
- [x] 2.5 `apps/server/src/services/films.ts`: `upsertFilm` persists the four fields from `FilmDetail`
- [x] 2.6 `apps/server/src/services/films.ts`: `rowToMediaItem` maps the four fields (default `null`)
- [x] 2.7 `apps/server/src/services/films.ts`: `syncFilm` short-circuits cached row only when omdb data present
- [x] 2.8 `apps/server/src/services/films.ts`: new `enrichRatings(tmdbId, type)` (films row → film_ratings cache → TMDB external_ids + omdb, store in cache)
- [x] 2.9 `apps/server/src/services/films.ts`: export `persistFilmDetail(detail)` wrapping `upsertFilm`

## 3. Server: tmdb service & routes

- [x] 3.1 `apps/server/src/services/tmdb.ts`: `normalizeMediaItem` sets the four new `MediaItem` fields to `null`
- [x] 3.2 `apps/server/src/services/tmdb.ts`: add `getExternalIds(id, type)` wrapping `fetchFromApi('external_ids')`
- [x] 3.3 `apps/server/src/routes/tmdb.ts`: register `GET /films/ratings` BEFORE `GET /films/:id` (ids capped at 10; null fields omitted; non-fatal)
- [x] 3.4 `apps/server/src/routes/tmdb.ts`: `GET /films/:id` calls `persistFilmDetail(detail)` after `getDetail`
- [x] 3.5 `apps/server/src/routes/diary.ts` `DIARY_SELECT`: add the four `f.` rating columns
- [x] 3.6 `apps/server/src/routes/watchlist.ts` `WATCHLIST_SELECT`: add the four `f.` rating columns

## 4. Server tests

- [x] 4.1 Route test: `/films/ratings` enriches from cache (mock `getExternalIds` + omdb), caps bulk ids, route not shadowed by `/films/:id`
- [x] 4.2 Route test: detail route persists ratings via `persistFilmDetail`
- [x] 4.3 Update `watchlist`/`diary` fixtures for new columns and rows (existing `filmDetail` already has nullable fields)
- [x] 4.4 Service tests for `enrichRatings` fallback order and `syncFilm` legacy-NULL refresh

## 5. Client

- [x] 5.1 `apps/client/src/lib/api.ts`: add ratings endpoint helper (`API_ENDPOINTS.films.ratings`)
- [x] 5.2 `apps/client/src/components/FilmCard.tsx`: compute normalized score (vote_average → imdb → rt → metacritic, `toHalfStar`) and render one corner badge; none when no score
- [x] 5.3 `apps/client/src/routes/Home.tsx`: after results load, collect scoreless ids, fire non-blocking ratings query, merge into display items
- [x] 5.4 `apps/client/src/routes/Search.tsx`: same enrichment wiring as Home
- [x] 5.5 Client tests: new `FilmCard.test.tsx` (TMDB-only, IMDb fallback, RT/metacritic fallback, half-star rounding, no score)
- [x] 5.6 Update `Home.test.tsx` / `Search.test.tsx` mocks for ratings path and an unrated case
- [x] 5.7 `apps/client/src/components/Stars.tsx`: add `xs` size (`text-xs`) to `SIZE_CLASSES` and the `size` union
- [x] 5.8 `apps/client/src/components/FilmCard.tsx`: render `<Stars value={rating} size="xs" />` inside the badge pill in place of `ratingLabel` glyphs; drop the unused `ratingLabel` import
- [x] 5.9 `apps/client/src/components/FilmCard.test.tsx`: assert the `Stars` control (aria-label e.g. `4.5 out of 5 stars` / half-filled 5th star) in place of glyph strings; keep the no-badge case (no `role="img"`)

## 6. Verification

- [x] 6.1 Quality gate green: `npm run lint && npm run typecheck && npm run test && npm run build`
- [ ] 6.2 Manual QA: scoreless title (e.g. We Are Aliens) shows badge on Home after enrich; rated titles unchanged; no regressions
- [ ] 6.3 Create GitHub issue, push `card-ratings` branch, open PR with `Fixes #…`, verify CI after merge
- [ ] 6.4 Archive the OpenSpec change (`openspec-archive-change`) and confirm main specs synced
- [ ] 6.5 Add `scripts/qa-card-ratings.sh` (repo convention, modeled on `scripts/qa-embedded-trailers.sh`): static greps + targeted vitest + manual steps