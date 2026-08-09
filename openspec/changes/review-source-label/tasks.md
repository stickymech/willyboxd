## 1. Shared helper

- [ ] 1.1 Add `getReviewSourceLabel(url: string | null | undefined): string | null` to `packages/shared/src/constants.ts` with known-site mapping + hostname fallback
- [ ] 1.2 Add unit tests in `packages/shared/src/constants.test.ts`: known site, unknown host, www stripping, missing/null/malformed URL

## 2. Client review cards

- [ ] 2.1 Render the source label in `ReviewCard` (`apps/client/src/routes/FilmDetail.tsx`) next to the "Read review" link
- [ ] 2.2 Add tests in `apps/client/src/routes/FilmDetail.test.tsx`: label present for a known site, absent when URL is missing

## 3. Quality gate

- [ ] 3.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` green
