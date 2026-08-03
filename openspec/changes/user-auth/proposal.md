## Why

Login only accepts an email address, but password managers (and habit) save the username. A user who registered with a username + password cannot sign in with those saved credentials — the username fails schema validation ("Invalid email address") and the server lookup is `WHERE email = ?`.

## What Changes

- Extend the login identifier to accept **email or username** in a single field.
- Rename the login body field from `email` to `identifier` (a non-empty string, no email-format constraint).
- Server login lookup becomes `WHERE email = ? OR username = ?` against the same `identifier` value.
- Client login UI: field becomes "Email or username" (text input, not `type=email`), submits `identifier`.
- No change to registration (still email + username + password) or session behavior.

## Capabilities

### New Capabilities
- `user-auth`: credential-based sign-in — the login request contract (`identifier` + password), email-or-username lookup on the server, and the client login form.

### Modified Capabilities
<!-- None yet - no main specs exist -->

## Impact

- `packages/shared/src/schemas.ts` — `LoginSchema`: `email` → `identifier`
- `apps/server/src/routes/auth.ts` — login query matches email OR username
- `apps/client/src/lib/auth.tsx` — `login(identifier, password)` posts `{ identifier, password }`
- `apps/client/src/routes/Login.tsx` — field name, label, placeholder, and payload
- Tests: `packages/shared/src/schemas.test.ts`, `apps/server/src/routes/auth.test.ts` (username login, unknown identifier, fixed logout flow)
- No DB, session, or registration changes
