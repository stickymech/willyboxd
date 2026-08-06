## 1. SearchBox component

- [ ] 1.1 Create `apps/client/src/components/SearchBox.tsx`: a search input that owns its value, debounces it (~250ms), and issues `GET /films/search?q=<debounced>` via TanStack Query (enabled when query length ≥ 1, capped client-side to 6 results).
- [ ] 1.2 Render the dropdown using the ARIA combobox pattern: `role="combobox"` input, `role="listbox"`/`role="option"` items, `aria-expanded` + `aria-activedescendant`; each row shows poster thumb, title, type badge, and year.
- [ ] 1.3 Add keyboard handling: ArrowUp/Down move the active index (wrapping), Enter opens the active match's detail page (or navigates to `/search?q=` when nothing is active), Escape closes.
- [ ] 1.4 Close the dropdown on outside click (document `mousedown`) and show no dropdown for an empty query; show a "No matches" row when the query returns nothing.
- [ ] 1.5 Add `SearchBox.test.tsx` covering: typing shows matches, empty query shows no dropdown, keyboard navigation opens the selected match, Enter without a selection navigates to results, Escape/outside-click closes.

## 2. Header integration

- [ ] 2.1 Render `<SearchBox />` in `apps/client/src/components/Header.tsx` so it appears on every page; keep it inside the existing `flex-wrap` header so it wraps gracefully on small screens.
- [ ] 2.2 Update `Home.test.tsx` (and any other route test that renders `Header`) so it still passes with the new search box present.

## 3. Results page

- [ ] 3.1 Update `apps/client/src/routes/Search.tsx`: remove the "Anime only" checkbox, the `anime` search param, and its URL handling; the page becomes the universal full-results view driven by `?q=` only.
- [ ] 3.2 Keep the inline search form on the results page (synced to the `?q=` URL) for refining a query; remove the anime toggle tests from `Search.test.tsx` and add a test that search no longer sends `anime=1`.

## 4. Watchlist filter

- [ ] 4.1 Add a filter box to `apps/client/src/routes/Watchlist.tsx` that filters entries client-side by film title (case-insensitive); empty filter shows all entries.
- [ ] 4.2 Add `Watchlist.test.tsx` cases: typing filters the grid by title, clearing restores all entries.

## 5. Diary filter

- [ ] 5.1 Add a filter box to `apps/client/src/routes/Diary.tsx` that filters entries client-side matching film title, any tag, or review text (case-insensitive); empty filter shows all entries.
- [ ] 5.2 Add Diary filter test cases (title match, tag match, review-text match, clearing restores all).

## 6. Verification

- [ ] 6.1 Run `npx turbo run lint typecheck test build --force` — all green.
- [ ] 6.2 Run `scripts/qa-brand-avatar.sh` — all pass (header layout unchanged by the search box).
- [ ] 6.3 Manual browser QA: search box present on Home/Diary/Watchlist/Settings/film detail; dropdown navigates to detail and results page; results page has no anime toggle; watchlist/diary filters work.
