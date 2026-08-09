## Context

The `Review` type (`packages/shared/src/types.ts`) already carries `url` (e.g. `https://www.themoviedb.org/review/<id>`). `ReviewCard` in `apps/client/src/routes/FilmDetail.tsx` renders a "Read review ↗" anchor to that URL. There is no source label today. The URL is trusted upstream data from TMDB.

## Goals / Non-Goals

**Goals:**
- Derive a human-readable source label from `review.url` hostname.
- Map known review sites to friendly names; fall back to a readable hostname.
- Render the label inline in `ReviewCard`; render nothing when the URL is unusable.

**Non-Goals:**
- No new API fields or endpoints — the URL already exists on `Review`.
- No changes to where the "Read review" link points.
- No changes to review fetch/normalization on the server.

## Decisions

**1. Implement `getReviewSourceLabel` in `packages/shared/src/constants.ts`.**
A pure function: `getReviewSourceLabel(url: string | null | undefined): string | null`. It parses the URL, strips `www.`, and maps known hosts (`themoviedb.org` → `TMDB`, `imdb.com` → `IMDb`, `rottentomatoes.com` → `Rotten Tomatoes`, `metacritic.com` → `Metacritic`, `letterboxd.com` → `Letterboxd`) before returning a normalized hostname. Rationale: consistent with the existing URL helpers in that module (`getImdbUrl`, `getTmdbUrl`) and trivially unit-testable. Unknown hosts fall back to `hostname.replace(/^www\./, "")`.

**2. Use `new URL()` for parsing with a safe guard.**
`new URL` throws on malformed input, so wrap it in a try/catch and return `null`. Empty string, null, or unparseable values yield no label.

**3. Render label inline in `ReviewCard`.**
Place a muted text element next to the existing "Read review ↗" link (e.g. `Review by X · TMDB`). No layout redesign.

## Risks / Trade-offs

- [Review URL could point to a site not in the mapping] → Falls back to the stripped hostname, which is still informative.
- [Hostname parsing edge cases (ports, subdomains, internationalized hosts)] → `new URL().hostname` handles these; the fallback keeps behavior sane.
- [Future non-URL review sources] → Out of scope; the helper returns null and the card renders no label.
