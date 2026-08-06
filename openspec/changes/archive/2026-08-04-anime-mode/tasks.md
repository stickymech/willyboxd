## 1. Shared types

- [x] 1.1 Add `original_language: string | null` to `MediaItem` in `packages/shared/src/types.ts`

## 2. Server TMDB service

- [x] 2.1 Map `original_language` in `normalizeMediaItem` in `apps/server/src/services/tmdb.ts`
- [x] 2.2 Add `getAnime` (or `getAnimeBrowse`) to `tmdbService`: fetch `discover/tv` + `discover/movie` with `with_keywords=210024` and `sort_by=popularity.desc`, normalize, merge, dedupe by id

## 3. Server routes

- [x] 3.1 Add `anime` query param to `/films/search`; filter results to `original_language === "ja"` when `anime=1`
- [x] 3.2 Add `GET /films/anime?time=week|day&page=1` route returning `{ results: MediaItem[] }` from `tmdbService.getAnime`
- [x] 3.3 Register any new API endpoint in `apps/client/src/lib/api.ts`

## 4. Server tests

- [x] 4.1 `tmdb.test.ts`: add tests for `original_language` normalization and `getAnime` merge/dedupe
- [x] 4.2 `routes/tmdb` tests: `anime=1` filters to `ja`; `anime` omitted returns all; `/films/anime` returns results and handles missing query

## 5. Client — Search anime toggle

- [x] 5.1 Add Anime toggle control to `Search.tsx`; wire it to `anime=1` in the URL query string and the API request
- [x] 5.2 Ensure toggle state restores from URL on load (survives reload)

## 6. Client — Home anime sections

- [x] 6.1 Add "Trending Anime" section to `Home.tsx` (uses `/films/anime?time=week`)
- [x] 6.2 Add "Top Anime" section to `Home.tsx` (uses `/films/anime` popularity sort)

## 7. Client tests

- [x] 7.1 Add/extend Search page tests covering the anime toggle behavior
- [x] 7.2 Add Home page tests covering the anime sections rendering

## 8. Verification

- [x] 8.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` — all green
- [ ] 8.2 Manual QA: search with anime toggle, Home anime rows, both in the browser
