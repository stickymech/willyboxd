## Context

Login is currently email-only end-to-end: `LoginSchema` validates `email` with `z.string().email()`, the server looks up `WHERE email = ?`, and the client form is a `type=email` field. Registration collects email, username, and password, and usernames are unique — so a username is always sufficient to identify a user. The reported bug: saved credentials (username + password) fail to sign in.

## Goals / Non-Goals

**Goals:**
- Let a user sign in with either their email or their username.
- Keep the change small, additive, and covered by tests.

**Non-Goals:**
- No change to registration, password rules, or session handling.
- No username-as-display-label changes elsewhere (profile URLs, headers, etc.).
- No case-insensitivity or normalization of identifiers (out of scope; usernames are `[a-zA-Z0-9_-]`).

## Decisions

### D1. One field, `identifier`
Login accepts a single `identifier` string that is checked against both `email` and `username`. Chosen over (a) keeping a field literally named `email` that silently accepts usernames — misnamed contract — and (b) separate `username`/`email` fields — requires UI to pick one, worse UX. Breaking the field name from `email` to `identifier` is acceptable at this stage (single consumer, tests updated).

### D2. Server: single query, both columns
`SELECT ... WHERE email = ? OR username = ?` with the same value bound twice. Both columns are unique-indexed (registration rejects duplicates), so OR is safe. Usernames can't look like emails (`[a-zA-Z0-9_-]`) and emails contain `@`, so an identifier can only ever match one row.

### D3. Client: text input + label
The login field becomes `type=text` labeled "Email or username" with a placeholder. `login(identifier, password)` posts `{ identifier, password }`.

## Risks / Trade-offs

- [Breaking API field rename `email` → `identifier`] → Single known consumer + tests updated; pre-1.0 hobby project.
- [A password manager that autofills the old `email` field name] → Field `name` is now `identifier`; managers match by label too, and the label now reads "Email or username".
- [`WHERE email = ? OR username = ?` with no index on username] → Usernames are unique; tiny local DB; non-issue.

## Migration Plan

Additive code change; no DB migration. Ship alongside the client change (both are in this repo). Rollback is a commit revert.
