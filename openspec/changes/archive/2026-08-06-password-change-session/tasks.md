## 1. Server test

- [x] 1.1 Add a test to `apps/server/src/routes/auth.test.ts`: after `PUT /auth/password` succeeds with a valid session cookie, `GET /auth/me` with the same cookie still returns the user.

## 2. Spec / docs

- [x] 2.1 Add `openspec/changes/password-change-session/` artifacts (proposal, design, spec, tasks).

## 3. Verification

- [x] 3.1 Run `npx turbo run lint typecheck test build --force` — all green.
