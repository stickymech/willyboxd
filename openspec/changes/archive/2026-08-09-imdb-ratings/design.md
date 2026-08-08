## Context

`tmdbService.getDetail` (`apps/server/src/services/tmdb.ts`) already fans out `detail`, `credits`, `images`, and `reviews` through a rate-limited, in-memory-cached `fetchFromApi` helper, returning a `FilmDetail` payload consumed by the client hero (`apps/client/src/routes/FilmDetail.tsx`). The hero currently renders the TMDB aggregate as `<Stars value={film.vote_average / 2} />`.

IMDb ratings are not available from TMDB directly, but TMDB's `external_ids` endpoint exposes each title's `imdb_id`. OMDB (`https://www.omdbapi.com/`) then resolves `imdb_id` to an `imdbRating` (a 0–10 string like "8.8"). This change adds that second hop server-side, keeping the client a single-request consumer.

## Goals / Non-Goals

**Goals:**
- Add `imdb_id` and `imdb_rating` (raw 0–10, nullable) to the `FilmDetail` payload for both `movie` and `tv`.
- Normalize the IMDb aggregate onto the app's 0.5–5 star scale with a **shared** `÷2` helper so TMDB and IMDb stay identical.
- Respect OMDB's 1000 requests/day free-tier limit via caching + rate limiting.
- Keep the feature non-fatal: no key, outage, or missing rating never breaks the detail page.

**Non-Goals:**
- No IMDb vote counts, posters, or other OMDB fields (only the aggregate rating).
- No client-side OMDB calls — a server key would leak; all upstream traffic stays server-side.
- No new UI beyond a small hero line; no database schema changes.
- No Rotten Tomatoes / Metacritic — those remain future slices.

## Decisions

**1. New `omdbService` in `apps/server/src/services/omdb.ts` mirroring the TMDB service pattern.**
A tiny fetch wrapper with the same in-memory cache (TTL reuse) and a per-request delay, keyed by `imdb_id`. The free tier is a hard quota, so the cache matters: the same `imdb_id` (e.g. every detail view of *Fight Club*) hits OMDB once per TTL window. The service returns `null` for a missing key, an unparseable/`N/A` rating, or any fetch failure, and logs a warning instead of throwing.

**2. `getDetail` extends the existing `Promise.all` fan-out with `external_ids`, then a conditional OMDB hop.**
`external_ids` joins the parallel fan-out (`/movie|tv/{id}/external_ids` → `imdb_id`). The OMDB rating call is chained **after** that result resolves (it depends on `imdb_id`) and is wrapped in a `.catch`/non-fatal path exactly like the reviews fetch. When `imdb_id` is absent or `imdb_rating` is null, the payload carries `null` and the page renders no IMDb line.

**3. Keep raw 0–10 in the payload; convert on the client with a shared helper.**
`imdb_rating` is stored raw (0–10), matching how `vote_average` is stored. A single `toStarRating(value: number): number` helper in `packages/shared/src/constants.ts` (`value / 2`) is used for both the TMDB hero stars and the IMDb stars, guaranteeing identical normalization. The existing hero line is refactored to use it too. _Alternative:_ convert server-side — rejected, since the shared helper is the cleaner single source of truth and keeps raw data available.

**4. Client hero renders IMDb as a labeled secondary line.**
A small "IMDb" label + `<Stars size="sm">` appears directly under the TMDB stars, rendered only when `imdb_rating !== null`. No raw number (consistent with the hero scale rule). Uses the same `Stars` component, so no new component or styling tokens.

**5. `.env.example` documents the optional key; runtime warns without it.**
`OMDB_API_KEY=` added to `apps/server/.env.example` (placeholder only). The service warns once when the key is unset and returns `null` — identical to how the TMDB service warns about `TMDB_API_KEY`.

## Risks / Trade-offs

- **[OMDB free-tier quota (1000/day)]** → in-memory cache keyed by `imdb_id` with the existing TTL; the OMDB hop only fires once per title per TTL window. A hobby app won't approach the quota.
- **[OMDB dependency on `external_ids` and a second upstream]** → both hops are non-fatal; any failure degrades to `null` with a `console.warn`, matching the established reviews-failure pattern.
- **[TV titles on OMDB]** → OMDB indexes series under the same `imdb_id` TMDB reports; the rating resolves the same way. If a title is missing on OMDB, `imdbRating` is `N/A` → `null`.
- **[Client test fixtures gain two fields]** → `FilmDetail` is a strict type; existing `FilmDetail` literals in tests add `imdb_id: null, imdb_rating: null`, keeping typecheck green.

## Migration Plan

No DB or schema migration — `FilmDetail` is a read payload. Deploys with the normal monorepo build; rollback is reverting the branch (API stops returning the fields; client hides the line). No stored data is affected.
