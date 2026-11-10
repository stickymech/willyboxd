## Why

The diary already holds everything needed to show a user their watching history in numbers (entries, films, minutes, ratings, genres, years), but the `/stats` endpoint is a 501 stub and there is no client page. A stats dashboard is the highest-value missing feature for a 2–3 user household.

## What Changes

- Server: `GET /stats` (replacing the stub) computes, for the authenticated user only: total diary entries, distinct films, total minutes from movie runtimes, average rating, top genres (up to 8, via `film_genres`), entries per year, and entries per decade (derived from years).
- Shared: `StatsOverview` gains `total_films`.
- Client: new `/stats` route — four summary cards (films, entries, hours, average rating with Stars) plus bar charts for genres, years, and decades. Empty state for a user with no entries. Header nav link.
- Zeroed overview for a new user; no changes to schema (tables already exist).

## Capabilities

### New Capabilities
- `stats-dashboard`: authenticated users can view aggregate stats for their diary (totals, averages, genre/year/decade breakdowns).

## Impact

- `packages/shared/src/types.ts` — add `total_films` to `StatsOverview`
- `apps/server/src/routes/stats.ts` — implement the endpoint (was a 501 stub)
- `apps/server/src/routes/stats.test.ts` — new route tests (totals, empty state, per-user isolation, auth required)
- `apps/client/src/routes/Stats.tsx` — new page
- `apps/client/src/routes/Stats.test.tsx` — new client tests
- `apps/client/src/App.tsx` — register `/stats` route
- `apps/client/src/components/Header.tsx` — nav link
- `README.md` — move stats from roadmap to features
