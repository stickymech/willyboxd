## Why

Search is currently a destination page (`/search`) reachable only from a nav link. Users should be able to search films/TV from anywhere in the app. The app also expanded from an anime-only site to all genres, and search should reflect that: universal catalog search, with anime staying curated on the Home page.

## What Changes

- Add a search box to the `Header` so it is present on every page. Submitting navigates to the results page (`/search?q=...`).
- Typing in the header box opens a live dropdown of the top matches (poster, title, type badge, year) fetched from the existing `/films/search` endpoint. Results are keyboard-navigable (arrows + Enter, Escape to close) and clickable to the film detail page.
- The `/search` page becomes the full-results view: it keeps the results grid and `?q=` deep-linking but no longer hosts its own search entry point.
- Remove the "Anime only" toggle from search. Search is universal (any language, any genre). Anime discovery stays on the Home page ("Trending Anime" / "Top Anime" sections) which is unchanged.
- Add a client-side filter box to the Watchlist page (matches film title).
- Add a client-side filter box to the Diary page (matches film title, tag, or review text).
- No server or shared-package changes; existing endpoints are reused.

## Capabilities

### New Capabilities
- `universal-search`: Search is available everywhere via a header search box with a live dropdown of matches; the results page is a universal, anime-unfiltered catalog view; Watchlist and Diary pages provide client-side filters over the user's own data.

### Modified Capabilities
- `anime-mode`: Remove the "Anime toggle on the Search page" requirement — the search UI no longer offers anime filtering. The server `anime` query parameter and the `/films/anime` browse endpoint remain (API compatibility + Home page usage).

## Impact

- `apps/client/src/components/Header.tsx`: render the new search box.
- `apps/client/src/components/SearchBox.tsx` (new): input + live dropdown (debounced query, keyboard navigation, click-outside/Escape close).
- `apps/client/src/routes/Search.tsx`: drop the anime toggle; keep grid + `?q=`; read the query from the URL (already does).
- `apps/client/src/routes/Watchlist.tsx`: add client-side title filter.
- `apps/client/src/routes/Diary.tsx`: add client-side filter (title / tag / review text).
- Tests: `Home.test.tsx`, `Search.test.tsx`, `Watchlist.test.tsx` updated for the header search box; new `SearchBox` tests.
- No changes to `apps/server` or `packages/shared`.
