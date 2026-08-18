## Why

Film cards on the Home/Trending feed render a rating badge only when TMDB reports `vote_average > 0`. Titles with no TMDB votes (e.g. We Are Aliens, `vote_average: 0`) have good IMDb (7.7) and Rotten Tomatoes (64%) scores that are never displayed because those ratings are only computed for the detail page, where they already appear via the `imdb-ratings` and `critic-scorecards` capabilities.

## What Changes

- Film cards render one corner badge using the app's existing partial-fill `Stars` control at a small size (e.g. `4.5 out of 5 stars`), normalized to the app's canonical 0.5–5 half-star scale for any available source: TMDB (`vote_average`, ÷2) → IMDb (`imdb_rating`, ÷2) → Rotten Tomatoes (`rt_rating`, ÷20) → Metacritic (`metacritic_rating`, ÷20), picking the first available source. No badge renders when no score exists.
- `MediaItem` gains nullable `imdb_id`, `imdb_rating`, `rt_rating`, `metacritic_rating` fields so enriched data can ride on cards.
- New server endpoint `GET /api/films/ratings?ids=550:movie,...` returns cached IMDb/RT/Metacritic ratings for tmdb ids (cap ~10) so the client can enrich cards whose TMDB rating is zero without a detail-page visit. Results are served from a new `film_ratings` cache table and a persisted columns on `films`, falling back to a live TMDB `external_ids` + OMDB lookup that is stored for next time.
- Enrichment is requested only for titles missing a TMDB rating (`vote_average === 0`), keeping OMDB lookups cheap; titles with a TMDB rating keep showing it.
- Card badges switch from the `★ 8.5` numeric style to the app-wide `Stars` control at `xs` size (half-step = half-filled 5th star).

## Capabilities

### New Capabilities
- `card-ratings`: Film cards display a single half-star badge for the best available score (TMDB → IMDb → RT → Metacritic), enriched from cached IMDb/RT/Metacritic ratings via a new bulk ratings endpoint when the TMDB score is absent.

### Modified Capabilities
<!-- None: imdb-ratings/critic-scorecards (detail page) requirements are unchanged; this is a new surface. -->

## Impact

- `packages/shared/src/types.ts` — add four nullable rating fields to `MediaItem`.
- `packages/shared/src/constants.ts` — add `toHalfStar(value)`; fix `ratingLabel` `1.5` glyph bug.
- `apps/server/src/db.ts` — new `film_ratings` cache table + idempotent ALTERs on `films`.
- `apps/server/src/services/films.ts` — persist/plumb the four fields; `enrichRatings`; `persistFilmDetail`.
- `apps/server/src/services/tmdb.ts` — `normalizeMediaItem` nulls; `getExternalIds`.
- `apps/server/src/routes/tmdb.ts` — new `GET /films/ratings` (registered before `/films/:id`); detail route persists ratings.
- `apps/server/src/routes/diary.ts`, `apps/server/src/routes/watchlist.ts` — add rating columns to selects.
- `apps/client/src/lib/api.ts` — ratings endpoint helper.
- `apps/client/src/components/FilmCard.tsx` — single badge rendering logic.
- `apps/client/src/routes/Home.tsx`, `apps/client/src/routes/Search.tsx` — non-blocking ratings enrich query.
- Tests: server tmdb/films routes, client `FilmCard`, `Home`, `Search`.