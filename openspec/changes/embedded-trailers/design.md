## Context

`tmdbService.getDetail` (`apps/server/src/services/tmdb.ts`) already fetches detail, credits, images, reviews, and external_ids in parallel — each auxiliary fetch is `.catch()`-wrapped so a failure never breaks the page (the "reviews/external_ids pattern"). `FilmDetail` in `packages/shared/src/types.ts` is the single source of truth consumed by both server mapping and the client `FilmDetail` route. The client fetches via `apiFetch` and renders the hero inline. TMDB already has a `/videos` endpoint and the repo already uses the TMDB key, rate-limiter, and in-memory cache — no new dependency.

## Goals / Non-Goals

**Goals:**
- Expose a single optional YouTube trailer (`{ key, name } | null`) through `GET /api/films/:id`.
- Render an inline embedded YouTube player on the detail page when a trailer exists.
- Keep the non-fatal pattern: absent trailer or videos failure → no trailer UI, page still loads.
- Mirror existing test structure for service, route, and client rendering.

**Non-Goals:**
- No trailer gallery / "view all videos" surface (TMDB returns many video types; only the first YouTube trailer is surfaced).
- No click-to-open modal or lazy loading (inline iframe only).
- No new upstream source (YouTube/TMDB only).
- No changes to outbound links, reviews, or scorecards.

## Decisions

**D1 — Fetch `/videos` as a parallel non-fatal promise in `getDetail`.**
Add `videosPromise = fetchFromApi<TmdbVideos>(\`${type}/${id}/videos\`)` with the same `.catch(() => ({ results: [] }))` fallback used for reviews/external_ids, then destructure `videos` in the `Promise.all`. Rationale: reuses the established, tested pattern; the fetch is cheap (cached 7 days) and never blocks detail when TMDB errors. Alternative (separate endpoint + client refetch) rejected — more surface, worse UX.

**D2 — Pick the first `type === "Trailer" && site === "YouTube"` video; else `null`.**
Filter strictly so teasers/featurettes/openings don't surface. If none match (or fetch fails) → `trailer: null`. Rationale: predictable single value matches the `{ key, name } | null` type; keeps the detail payload small.

**D3 — Shared type owns the trailer shape.**
`trailer: { key: string; name: string | null } | null` on `FilmDetail`. The client builds the embed URL `https://www.youtube.com/embed/${key}` inline; no new shared URL helper or constant is needed (YAGNI until a second consumer exists).

**D4 — Inline responsive iframe in the hero.**
Render `aspect-video` wrapper + `<iframe src={...} allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title={...}>` only when `film.trailer` is non-null. Placed below the hero meta (overview) so it doesn't disturb the existing scorecards/links. Alternative (thumbnail → modal) rejected: more JS/state for a hobby app; the chosen option is the simplest reliable embed.

## Risks / Trade-offs

- [Some titles have no YouTube trailer (or only teasers/foreign-language videos)] → Trailer is hidden entirely; page unchanged. Videos fetch still cost +1 cached TMDB call per detail load.
- [Iframe autoplay/click behavior is browser-restricted] → Use user-initiated play (click the native YouTube play button); no autoplay attribute.
- [Third-party embed network (youtube-nocookie vs youtube)] → Use standard `youtube.com/embed` for simplicity; privacy variant can be swapped later without schema change.
- [FilmDetail.tsx is a high-conflict file] → Branch off clean `main`; merge fast; expect to resolve conflicts against other in-flight detail-page PRs.
