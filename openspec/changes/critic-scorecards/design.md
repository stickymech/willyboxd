## Context

`omdbService.getRating` (`apps/server/src/services/omdb.ts`) already fetches a title's OMDB record by `imdb_id` and parses `imdbRating` from the top-level field, caching the single number. The same OMDB response contains a `Ratings` array with Rotten Tomatoes (`"79%"`) and Metacritic (`"66/100"`) values that are currently discarded. `tmdbService.getDetail` calls `getRating` and places the result into `FilmDetail.imdb_rating`. The client hero (`apps/client/src/routes/FilmDetail.tsx`) already renders labeled scorecard lines with `Stars`.

## Goals / Non-Goals

**Goals:**
- Parse all three critic sources from the single existing OMDB call — no additional upstream calls.
- Expose `rt_rating` and `metacritic_rating` (raw 0–100, nullable) in the film detail API and type.
- Normalize 0–100 scores onto the 0.5–5 star scale via a shared ÷20 helper.
- Render labeled scorecards only for present sources; keep the change non-fatal end to end.

**Non-Goals:**
- No raw numeric scores in the UI (matches the IMDb line's "no raw number" rule).
- No changes to the IMDb parsing/caching behavior already shipped.
- No new endpoints or schema changes beyond the two new `FilmDetail` fields.

## Decisions

**1. Replace `omdbService.getRating` with `getRatings` returning a ratings object.**
The method becomes `getRatings(imdbId): Promise<{ imdb: number | null; rt: number | null; metacritic: number | null }>`, parsing the `Ratings` array alongside `imdbRating`. Rationale: the cache is per-`imdb_id` and one OMDB call already returns all three values — caching a single object avoids three round-trips. Alternative considered: three separate methods/calls — rejected as wasteful of the OMDB rate limit. The rename makes the object return type explicit; only `tmdb.ts` and tests consume it.

**2. Parsing rules in the service.**
- IMDb: `imdbRating` top-level `"8.8"` → 8.8 (unchanged).
- RT: `Ratings` entry with `Source === "Rotten Tomatoes"`, `Value "79%"` → strip `%` → 79.
- Metacritic: entry with `Source === "Metacritic"`, `Value "66/100"` → parse integer before `/` → 66.
- Any missing/unparseable entry yields `null` for that source only.

**3. Shared normalization helper in `packages/shared`.**
Add `toHundredStarRating(value: number): number { return value / 20; }` next to `toStarRating`. Rationale: RT % and Metacritic /100 are 0–100 scales; ÷20 lands them on 0.5–5, matching the existing ÷2 rule for 0–10. The `Stars` component already renders fractional fills (e.g. IMDb 8.8 → 4.4), so `79 → 3.95` and `66 → 3.3` render correctly.

**4. Client scorecard row.**
Extend the existing labeled-line pattern (`IMDb` line at `FilmDetail.tsx:219`) with conditional "Rotten Tomatoes" and "Metacritic" lines using `Stars` + `toHundredStarRating`. Absent ratings render nothing.

## Risks / Trade-offs

- [RT/Metacritic values can be present for movies but rarely for TV titles] → Both fields are nullable; the UI simply renders fewer scorecards.
- [OMDB `Ratings` array sometimes omits a source even when the review site has a score] → Out of our control; null is the correct, non-fatal outcome.
- [Fractional star fills (3.95) are not true 0.5 increments] → Precedented by IMDb (4.4) and TMDB (4.2); the shared `Stars` component already renders fractional fills.
