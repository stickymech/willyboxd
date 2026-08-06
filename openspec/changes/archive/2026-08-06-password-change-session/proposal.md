## Why

Changing your password in Settings currently works, but the behaviour around
sessions is untested and undocumented. The user wants it kept simple: there is
no 2FA or session-revocation system, so a password change should keep you
logged in — the existing session cookie stays valid, and only the password hash
changes.

The server already behaves this way (`PUT /auth/password` updates
`users.password_hash` only; `sessions` rows are untouched). This change locks
that in with a regression test and a spec scenario so it can't silently break.

## What Changes

- `apps/server/src/routes/auth.test.ts`: add a test that after a successful
  `PUT /auth/password`, a subsequent authenticated request using the SAME
  session cookie still succeeds (200, not 401) — i.e. the session survives the
  password change.
- No production code changes: the desired behaviour is already correct.

## Capabilities

### Modified Capabilities
- `user-auth` (password change): explicitly documented and tested that a
  password change keeps the current session valid (no forced re-login). Future
  2FA/session-revocation work can revisit this.

## Impact

- `apps/server/src/routes/auth.test.ts`: +1 regression test in the
  "PUT /auth/password changes the password on success" area.
- `openspec/changes/password-change-session/specs/auth-password-change/spec.md`: new spec scenario.

## Risks / Trade-offs

- Keeping sessions valid across a password change means a leaked cookie stays
  usable after the password rotates. Acceptable for now (hobby project, no 2FA);
  the spec notes that a future session-revocation feature would change this.
