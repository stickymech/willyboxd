## Context

The detail page (`apps/client/src/routes/FilmDetail.tsx`) already consumes a rich `FilmDetail` payload assembled by `tmdbService.getDetail` (`apps/server/src/services/tmdb.ts`), which fans out three TMDB calls (`detail`, `credits`, `images`) via a rate-limited, in-memory-cached `fetchFromApi` helper. Reviews can join that fan-out with the same caching/rate-limit guarantees and zero new configuration.

## Goals / Non-Goals

**Goals:**
- Add `reviews` to the `FilmDetail` payload for both `movie` and `tv`.
- Render a tasteful Reviews section (author, avatar, star rating, expandable content, outbound "Read review" link) that disappears when empty.
- Keep the change small and dependency-free.

**Non-Goals:**
- No critic scorecards (Rotten Tomatoes / Metacritic / IMDb) — tracked as a separate slice (OMDB key).
- No user-authored reviews from within the app.
- No pagination of reviews; TMDB returns ~20 per page and we show a capped subset.

## Decisions

**1. Fetch reviews inside `getDetail` rather than a new endpoint.**
Extends the existing fan-out `Promise.all` so the client gets everything in one request. `getDetail` returns a partial `TmdbReviews` shape (the endpoint's `results`), then `FilmDetail` maps it to the public `Review` type. _Alternative considered:_ a separate `/films/:id/reviews` endpoint — rejected as extra round-trips and client complexity for no benefit at this scale.

**2. Model the public type as a flat `Review`, not a pass-through of TMDB's response.**
`packages/shared/src/types.ts` gains a `Review` type (`id`, `author`, `author_avatar_path`, `rating` (TMDB 0–10, nullable), `content`, `url`, `created_at`) and `FilmDetail.reviews: Review[]`. The raw TMDB shape (nested `author_details`, gravatar-prefixed avatar paths) stays server-side.

**3. Cap reviews at a reasonable number.**
Show the first 5 reviews (or fewer), matching the existing pattern of limiting cast to 10. Prevents a long page and keeps payloads lean.

**4. Ratings converted to the app's star system.**
TMDB ratings are 0–10 (or null). Convert to the app's 0.5–5 scale (`rating / 2`) for display with `ratingLabel`/`Stars`-style rendering; `null` shows no stars.

**5. Avatar handling reuses the TMDB profile image helper.**
`author_avatar_path` is an optional TMDB path; `getProfileUrl` already exists in `packages/shared/src/constants.ts`. Some values are full gravatar URLs — only render a TMDB-hosted image when the path starts with `/` (consistent with existing image handling), else show an initial-letter placeholder.

## Risks / Trade-offs

- **[Popular titles can have many/long reviews]** → Cap at 5 and default to collapsed (line-clamp) content with a "Show more" toggle.
- **[Reviews are TMDB community content, not guaranteed critics]** → Label the section "Reviews" (not "Critics") and link each review to its source via `url`. Critic scorecards arrive in a later slice.
- **[Gravatar/odd avatar URLs in the payload]** → Only render avatar when the path is TMDB-relative; otherwise fall back to an initial-letter block, mirroring the existing cast rendering.
- **[Extra upstream calls increase TMDB quota use]** → The single extra request per title is amortised by the existing TTL cache; acceptable for a hobby app.

## Migration Plan

No database or schema migration. Deploys with the normal monorepo build; rollback is reverting the branch (API just stops returning `reviews`; client falls back by not rendering the section).
