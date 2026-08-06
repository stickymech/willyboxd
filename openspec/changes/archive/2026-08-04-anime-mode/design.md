## Context

The app's discovery surfaces (Home trending/popular, Search) all pull from TMDB with no way to isolate anime. TMDB has no "anime" genre — genre 16 is "Animation" and includes Pixar, Disney, and Western cartoons — so any genre-based anime filter would be wrong in both directions. This is a family hobby app (Letterboxd clone) whose main viewer is anime-focused; the change must stay TMDB-native, additive, and avoid a second ID namespace because diary/watchlist/lists are all keyed on `films.tmdb_id`.

Verified facts driving the design (tested against live APIs this session):
- `search/multi` returns `original_language`; anime titles reliably return `ja` (verified on One Piece, Demon Slayer, Naruto result sets).
- TMDB keyword id `210024` = "anime"; `discover/tv` + `discover/movie` support `with_keywords` and return real anime (verified).
- `search/multi` does NOT support `with_keywords`, so anime-filtered *search* cannot use the keyword filter and must filter post-query.

## Goals / Non-Goals

**Goals:**
- A first-class **Anime mode**: filter Search to anime, and surface **Trending Anime** + **Top Anime** rows on Home.
- Reuse the existing TMDB service, rate limiter, and in-memory cache.
- Zero schema/DB migration; no new API keys or dependencies.
- Keep the existing unified `MediaItem` shape for film cards, detail pages, and DB storage.

**Non-Goals:**
- No AniList/Jikan integration (see D1) — no second ID space, no title-matching.
- No anime-specific DB columns, no `is_anime` persistence.
- No per-title "is this anime?" enrichment on detail pages (phase 2).
- No changes to diary/watchlist/lists.

## Decisions

### D1. TMDB-native; AniList rejected as a search source

AniList is the best anime metadata source (GraphQL, keyless, studios/tags/rankings) but it is a **separate database with its own IDs and no TMDB linkage**. Merging it into search would either duplicate results or require a fragile cross-source mapping (community datasets or title matching) to keep the diary/watchlist (keyed on `tmdb_id`) intact. For *search/catalogue*, TMDB already returns accurate anime titles (verified), so AniList adds depth but not coverage. Verdict: keep TMDB-only now; AniList is a candidate for phase-2 detail-page enrichment only.

### D2. Anime classification — two mechanisms, one rule

- **Search filter:** `anime=1` post-filters search results to `original_language === "ja"`. Single condition for maximum recall (some anime, e.g. *Monster*, lack the Animation genre on TMDB; adding a genre-16 requirement would drop them).
- **Browse:** `discover/tv` + `discover/movie` with `with_keywords=210024` (the TMDB "anime" keyword), sorted by popularity — the keyword path is community-curated and anime-specific, unlike genre 16.
- `original_language` is surfaced on `MediaItem` so the client can label/filter too.

### D3. Server API surface

- `GET /films/search?q=...&anime=1` — existing route; when `anime=1`, filter normalized results to `original_language === "ja"`.
- `GET /films/anime?time=week|day&page=1` — new route returning `{ results: MediaItem[] }`; fetches `discover/tv` and `discover/movie` (both with `with_keywords=210024`, sorted by popularity), normalizes, merges, and dedupes by `id`.

### D4. Shared type change

Add `original_language: string | null` to `MediaItem` (additive, optional-compatible). `normalizeMediaItem` maps it from TMDB; the DB-backed `MediaItem`s used by diary/watchlist remain `null` — no migration required since the field is not persisted.

### D5. Client UI

- **Search.tsx:** an "Anime" toggle (checkbox/segmented control) that adds `anime=1` to the request and keeps the filter in the URL query string (`&anime=1`) so it survives reload.
- **Home.tsx:** two new sections above the existing rows — "Trending Anime" (time=week) and "Top Anime" (popularity) — rendered with the same `FilmCard` grid. Query keys `["films","anime",...]` so they cache independently.

## Risks / Trade-offs

- [`original_language === "ja"` also matches Japanese live-action] → Acceptable for a discovery filter in a hobby app; Japanese live-action is rare in general search. Can tighten later to `ja AND genre 16` if precision matters, at the cost of missing Animation-unlisted anime.
- [TMDB keyword `210024` is community-curated; some anime lack the keyword] → Browse rows may miss edge cases; recall for mainstream anime is high (verified). Mitigation: only browse relies on it, search does not.
- [New discover calls add load/rate-limit pressure] → Existing in-memory cache + 250ms rate limiter already serialize calls; browse results cached 7 days like everything else.
- [`MediaItem.original_language` null for DB-stored items] → Only used in the live search UI; nulls render as no label. No DB change.

## Migration Plan

Additive only: one new route, one query param, one shared type field, two client files touched. No DB/schema migration. Rollback is a single commit revert. Verification: `npm run lint && npm run typecheck && npm run test && npm run build`, then manual QA of Search toggle + Home rows.
