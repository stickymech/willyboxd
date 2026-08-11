## Context

The film/TV detail page (`apps/client/src/routes/FilmDetail.tsx`) already receives `imdb_id` (nullable string) and the TMDB title `id` + `type` in the `FilmDetail` payload from `GET /api/films/:id?type=movie|tv`. The cast cards already link out to `https://www.themoviedb.org/person/<id>` using the `target="_blank" rel="noreferrer"` pattern, so the same link convention is established in the codebase.

## Goals / Non-Goals

**Goals:**
- Derive IMDb and TMDB external URLs from existing `FilmDetail` fields — no new upstream calls.
- Render a "View on IMDb" link when `imdb_id` is present and a "View on TMDB" link (always, since id/type are always present).
- Open both links in a new tab with `rel="noreferrer"`.
- Keep the change minimal and testable.

**Non-Goals:**
- No new upstream TMDB/OMDB API calls (external ids and imdb data already fetched).
- No changes to existing film detail API payload shape beyond what is already there.
- No link iconography redesign — plain text links matching the existing "Read review ↗" style.

## Decisions

**1. Build URLs in `packages/shared` helpers rather than hardcoding in the component.**
Add `getImdbUrl(imdbId)` and `getTmdbUrl(id, type)` next to the existing `getPosterUrl`/`getProfileUrl` helpers in `packages/shared/src/constants.ts`. Rationale: consistent with existing URL-builder helpers in that module, trivially unit-testable, and usable by any future surface (e.g. cast pages). Alternative considered: hardcoding template literals in `FilmDetail.tsx` — rejected because it duplicates string construction and skips a shared, tested helper.

**2. Client-only change.**
The server already returns `imdb_id`, `id`, and `type`. No new server fields or endpoints are needed. The links are derived entirely on the client from the existing payload.

**3. Reuse the existing external-link conventions.**
Follow the cast-card/`ReviewCard` pattern: `<a href target="_blank" rel="noreferrer">`. The TMDB link is derived as `https://www.themoviedb.org/<type>/<id>`.

## Risks / Trade-offs

- [The `imdb_id` could theoretically be a malformed string] → It comes from TMDB's `external_ids` endpoint, which is already validated/trusted; link construction is a plain string concatenation.
- [A titled could be shadow-banned or removed on a target site] → Links open in new tabs, so a 404 on the external site does not break the app.
- [Acceptance criteria says TMDB link should be hidden when "target id is absent"] → id/type are always present in the detail payload; the TMDB link is always rendered, matching the spec scenario.
