## Context

The client currently exposes search only as a destination page (`/search`) linked in the header nav. It has its own input, an "Anime only" toggle, and a film-card results grid backed by `GET /films/search` (TMDB multi-search, movies + TV). Watchlist and Diary pages render the user's full list with no filtering. The app's identity shifted from anime-only to all-genre; the Home page already curates anime ("Trending Anime" / "Top Anime"), while search should become a universal tool.

All search data flows through existing server endpoints; this change is entirely client-side (Vite + React + TanStack Query + Tailwind, single Linear palette).

## Goals / Non-Goals

**Goals:**
- Search is reachable from every page via a header search box.
- Typing shows a fast, keyboard-friendly dropdown of top matches without navigating.
- The results page stays a deep-linkable full-results view and stops offering an anime filter.
- Watchlist and Diary pages get client-side filters over the user's own entries.

**Non-Goals:**
- Server-side search over diary/watchlist data (data is small and already fully loaded per user).
- Fuzzy/typo-tolerant search, search history, saved searches.
- Cmd+K / command palette (possible future enhancement).
- Pagination or infinite scroll beyond what the results page already has.
- Any change to `apps/server` or `packages/shared` — existing endpoints are reused as-is.

## Decisions

### D1. One reusable `SearchBox` component in the Header
A single `SearchBox` component (input + live dropdown) is rendered by `Header.tsx`, so it appears on every page automatically. It owns its input value, the debounced query, and the dropdown open/selection state. Rationale: one component, one place, reused everywhere without duplication. The header already wraps with `flex-wrap`, so the box degrades gracefully on small screens.

### D2. Dropdown reuses the existing `/films/search` endpoint, debounced, via TanStack Query
No new server endpoint. The dropdown issues the same request as the results page: `GET /films/search?q=<debounced>`. Debounce ~250ms on the input value; the query is `enabled` when the debounced query has length ≥ 1; display is capped client-side to the top 6 matches. TanStack Query provides caching and stale-time reuse. Alternative considered: a dedicated `/films/search/suggest` endpoint — rejected as YAGNI; the full search response is small enough.

### D3. Dropdown uses the ARIA combobox pattern with full keyboard support
Role `combobox` on the input, `listbox`/`option` on the dropdown, `aria-expanded` and `aria-activedescendant` wired to the active item. ArrowUp/Down move the active index (wrapping), Enter opens the active match (or navigates to `/search?q=` when none is active), Escape closes, and clicking outside (document `mousedown` listener) closes. Rationale: cheap, correct, testable; matches how the existing app handles interactive components.

### D4. The results page keeps an inline form but drops the anime toggle
`/search?q=` remains the deep-linkable full-results view. It keeps its own lightweight input synced to the URL for refining an existing query (the header box covers "search from anywhere"; the page input covers "tweak what I already searched"). The "Anime only" checkbox and its `anime=1` param usage are removed from the client. The server `anime` param and `/films/anime` endpoint stay untouched for API/Home compatibility.

### D5. Watchlist/Diary filters are client-side `useMemo` filters
Both pages already fetch the complete current-user entry set in one request. A filter box above the grid filters in memory: Watchlist matches film title; Diary matches film title, any tag, or review text (case-insensitive). Rationale: no server round-trip, no SQL change, trivially testable. Server-side search would only pay off when a user's library is huge — not now.

### D6. Reuse existing film-card and styling conventions
Dropdown rows are compact (poster thumb, title, type badge, year) using the existing semantic tokens; results reuse the existing `FilmCard` grid. No new dependencies, no new colors.

## Risks / Trade-offs

- [TMDB rate limiting under live typing] → Debounce (~250ms) plus TanStack Query caching; the server already serializes requests through its request queue.
- [Dropdown collides with page content (z-index/overflow)] → Absolute-positioned within the header with a high z-index; closes on outside click and Escape.
- [Two search inputs on the results page could feel redundant] → They are kept consistent through the `?q=` URL param; the header box is the primary entry, the page box is for refinement.
- [Mobile header space] → Header already uses `flex-wrap`; the search box wraps to its own row on narrow screens rather than overflowing.
