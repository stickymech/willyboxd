## Why

The detail page already surfaces TMDB stars and the IMDb aggregate, but Rotten Tomatoes and Metacritic critic scores are fetched from OMDB in the same call and currently thrown away. Surfacing them completes the scorecard row with data that's already in hand.

## What Changes

- Extend the OMDB mapping to parse the `Ratings` array into IMDb (already done), Rotten Tomatoes (`"79%"`), and Metacritic (`"66/100"`).
- Return `rt_rating` and `metacritic_rating` (nullable numbers, raw 0–100) from `GET /api/films/:id?type=movie|tv` alongside `imdb_rating`.
- Add a shared normalization helper so 0–100 scores land on the app's canonical 0.5–5 star scale (÷20 rule).
- Extend the hero scorecard row group on the detail page: each available source renders its labeled Stars; absent sources render nothing.
- Non-fatal: missing key, outage, or a missing source → those scorecards are null and the page still loads.
- No breaking changes; `FilmDetail` gains two nullable fields.

## Capabilities

### New Capabilities
- `critic-scorecards`: Detail page surfaces Rotten Tomatoes and Metacritic aggregate scorecards alongside the existing TMDB/IMDb ratings, normalized onto the 0.5–5 star scale, hidden when a source is absent.

### Modified Capabilities
<!-- none -->

## Impact

- `apps/server/src/services/omdb.ts` + `omdb.test.ts`: parse `Ratings` array, return a ratings object.
- `apps/server/src/services/tmdb.ts` + `tmdb.test.ts`: fan the three ratings into `FilmDetail`.
- `packages/shared/src/types.ts`: add `rt_rating`/`metacritic_rating`.
- `packages/shared/src/constants.ts` + `constants.test.ts`: new 0–100 → star helper.
- `apps/client/src/routes/FilmDetail.tsx` + `FilmDetail.test.tsx`: scorecard row extension.
- Route/diary/watchlist test fixtures: add the two new fields.
