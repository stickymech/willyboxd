## Context

`PUT /auth/password` (apps/server/src/routes/auth.ts) verifies the current
password via `bcrypt.compare`, rehashes the new one, and updates only the
`users.password_hash` row. Sessions live in the `sessions` table keyed by
cookie id and are independent of the password hash, so an existing session
remains valid after a password change.

## Decisions

### D1. Keep sessions valid across a password change
Do not invalidate `sessions` on password change. There is no 2FA or
session-revocation system; forcing a re-login adds friction for no security
gain at this stage. This is the current server behaviour — we are locking it in
with a test, not changing it.

### D2. Lock it in with a regression test
Add a server test that performs `PUT /auth/password` with an existing session
cookie, then reuses the SAME cookie for `GET /auth/me` and asserts it still
returns the user. This protects the behaviour from a future refactor that might
invalidate sessions on password change.
