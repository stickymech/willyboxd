## 1. Shared

- [x] 1.1 Add `total_films: number` to `StatsOverview` in `packages/shared/src/types.ts`

## 2. Server

- [x] 2.1 Implement `GET /stats` in `apps/server/src/routes/stats.ts` (totals, minutes, average rating, genres, years, decades), replacing the 501 stub
- [x] 2.2 Route tests: aggregate values, zeroed empty state, per-user isolation, 401 without auth

## 3. Client

- [x] 3.1 New `apps/client/src/routes/Stats.tsx`: summary cards + genre/year/decade bar charts; empty and error states
- [x] 3.2 Register `/stats` in `App.tsx`; add Header nav link
- [x] 3.3 Client tests: renders from endpoint data, empty state, error + retry

## 4. Verification

- [x] 4.1 Quality gate green: `npm run lint && npm run typecheck && npm run test && npm run build`
- [x] 4.2 Manual QA: log films in dev, open /stats, confirm cards + charts; new user sees empty state (scripts/qa-stats.sh)
- [x] 4.3 PR `Fixes #31`; CI green; archive the OpenSpec change and sync specs
