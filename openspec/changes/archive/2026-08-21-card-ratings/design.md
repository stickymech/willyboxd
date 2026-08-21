## Context

`FilmCard` (`apps/client/src/components/FilmCard.tsx:27`) renders one rating badge only when `film.vote_average > 0`. Home/Search data comes from live TMDB endpoints (`getTrending`/`getPopular`/`getAnime`/`searchMulti`) via `normalizeMediaItem`, which carries no IMDb/RT/Metacritic scores. Those scores exist only on `FilmDetail` (computed in `tmdbService.getDetail` → `omdbService.getRatings`) and are never persisted beyond that one response. Titles with `vote_average: 0` (no TMDB votes, e.g. We Are Aliens) therefore show no badge despite having good IMDb/RT scores. The detail page already shows all four sources on the canonical 0.5–5 star scale via the `imdb-ratings` and `critic-scorecards` specs, but cards share none of that.

## Goals / Non-Goals

**Goals:**
- Film cards (Home/Search, and by extension watchlist/diary cards fed from `MediaItem`) show one corner badge with the best available score normalized to 0.5–5 half stars, rendered with the existing partial-fill `Stars` control at a small size.
- Enriched IMDb/RT/Metacritic ratings are cached server-side so repeat loads are instant and no live OMDB call hits the browser.
- Bulk enrichment endpoint (`GET /films/ratings`) supports the common card-grid case (~10-20 titles) rather than one request per card.
- Detail-page visits backfill cached ratings so watchlist/diary cards scope at a later sync.

**Non-Goals:**
- No multiple badges / per-source badges with source labels (one badge only; per confirmed decision).
- No enrichment of titles that already have a TMDB `vote_average` (they keep showing their TMDB score; the cache stores their ratings anyway if a detail page is visited).
- No changes to the detail-page hero scoring, comments/reviews, or scorecards.
- No background job / scheduled refresh of the ratings cache — refresh happens lazily on demand.

## Decisions

**D1 — `MediaItem` carries nullable rating fields; `FilmDetail extends MediaItem` keeps them.**
Add `imdb_id: string | null`, `imdb_rating: number | null`, `rt_rating: number | null`, `metacritic_rating: number | null` to `MediaItem` in `packages/shared/src/types.ts`. This lets cards carry enriched data through the existing item plumbing, sidebar and watchlist/diary `FilmCard` usages included. `FilmDetail` already declares the same fields — the overlap is harmless and needs no dedup.

**D2 — Server persists ratings in two places: columns on `films` and a new `film_ratings` cache table.**
- `film_ratings (tmdb_id, type, imdb_id, imdb_rating, rt_rating, metacritic_rating, last_updated)` with `PRIMARY KEY (tmdb_id, type)` — serves titles never added to `films` (pure Home/Search cards).
- Four new nullable columns on `films` — serves watchlist/diary rows that already live in the table; `upsertFilm` writes them from `FilmDetail`, and the diary/watchlist selects already join `films`.

**D3 — `enrichRatings(tmdbId, type)` resolves in order: films row → film_ratings cache → live lookup.**
If the `films` row has a non-null `imdb_rating` return it (no cache write). Else check `film_ratings`. Else fetch TMDB `external_ids` for `imdb_id` and call `omdbService.getRatings`, store the result in `film_ratings`, and return it. Any failure returns `null`/empty — enrichment is always non-fatal. The existing rate-limit queues already serialize TMDB/OMDB work, so bursts of missing entries self-throttle.

**D4 — New bulk endpoint `GET /films/ratings?ids=550:movie,157336:tv`.**
Cap ~10 ids; respond `{ ratings: { [tmdbId]: { imdb_id, imdb_rating, rt_rating, metacritic_rating } } }` omitting null fields for compactness. **Registered before `GET /films/:id`** in `apps/server/src/routes/tmdb.ts` — Fastify/Hono-style router matching means `/films/ratings` must not be shadowed by `/films/:id`. Ids beyond the cap are ignored.

**D5 — Client enriches only scoreless cards, non-blocking, merge into display items.**
In `Home.tsx` and `Search.tsx`, after results load, collect ids where `vote_average === 0` (deduped, `tmdbId:type`), fire one `useQuery` to `/films/ratings` with `retry: false` and `enabled: ids.length > 0`, ignore failure entirely (cards just stay scoreless), and merge returned ratings into the display items via `{ ...film, ...ratings[id] }`. No loading state, no spinner — the badge simply appears when the data lands.

**D6 — Card badge renders the shared `Stars` control at a small size.**
Priority: `vote_average` (÷2, `toStarRating`) → `imdb_rating` (÷2) → `rt_rating` (÷20, `toHundredStarRating`) → `metacritic_rating` (÷20). Pass through `toHalfStar` (`Math.round(v*2)/2`) and render the app's existing partial-fill `Stars` component (`apps/client/src/components/Stars.tsx`) at the new `xs` size (`text-xs`) inside the existing corner badge pill. A half step shows as a half-filled 5th star, matching FilmDetail/Diary. Render nothing when no score exists. The card's `ratingLabel` usage is removed; `ratingLabel` stays in `packages/shared/src/constants.ts` (still exported/tested there) for the pre-existing glyph bugs it declares fixed at `1.5`/`2.5`/`3.5`.

**D7 — Detail route persists ratings.**
`GET /films/:id` calls `persistFilmDetail(detail)` (wraps `upsertFilm`) after `getDetail`, so a visited title backfills the `films` columns and future watchlist/diary cards render its badge with no repeat OMDB cost.

## Risks / Trade-offs

- [Bulk endpoint is registered after `/films/:id` in the router] → Register `/films/ratings` before `/films/:id`; add a route test asserting `/films/ratings` is not swallowed by `:id`.
- [Live OMDB lookup burst on first unrated load] → Cap ids per request (10) and rate-limit queues serialize; cache table makes all repeat loads free.
- [Card badge previously used a compact glyph string (`ratingLabel`) in a corner pill] → Replaced with the app-wide partial-fill `Stars` control at `xs` size (half-step = half-filled 5th star), consistent with FilmDetail/Diary; `ratingLabel` remains shared-only.
- [Enriched titles in watchlist/diary depend on the join columns being backfilled] → Detail-page `persistFilmDetail` + next `syncFilm` backfills; legacy NULL rows are refreshed because `syncFilm` short-circuits only when omdb data is present.
- [`package.json` / migration on existing DBs] → Column adds are idempotent JS `ALTER TABLE ... ADD COLUMN` guards run after the migration loop, so existing installs upgrade silently.

## Migration Plan

Existing SQLite DBs: after the normal migration loop, run idempotent `ALTER TABLE films ADD COLUMN ...` for the four new columns (guarded by `PRAGMA table_info(films)`), and `CREATE TABLE IF NOT EXISTS film_ratings`. Fresh DBs get both from `init_films` and the cache table DDL. Rollback: drop the four columns is optional; leaving them is harmless.

## Open Questions

None — decisions above were confirmed with the user in prior conversation.