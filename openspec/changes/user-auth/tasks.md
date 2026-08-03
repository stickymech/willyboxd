## 1. Schema & contract

- [x] 1.1 Update `LoginSchema` in `packages/shared/src/schemas.ts`: replace `email` (email-format) with `identifier` (non-empty string, "Email or username is required")
- [x] 1.2 Update shared schema tests to accept email and username identifiers and reject empty

## 2. Server

- [x] 2.1 Change login lookup in `apps/server/src/routes/auth.ts` to `WHERE email = ? OR username = ?` using the identifier
- [x] 2.2 Update `apps/server/src/routes/auth.test.ts`: login bodies use `identifier`; add username-login, unknown-identifier, and a fixed login→logout flow test

## 3. Client

- [x] 3.1 Update `apps/client/src/lib/auth.tsx` `login` signature/body to `{ identifier, password }`
- [x] 3.2 Update `apps/client/src/routes/Login.tsx`: field name `identifier`, text input, label "Email or username", placeholder, payload

## 4. Verification

- [x] 4.1 Run `npm run lint && npm run typecheck && npm run test` — all green
- [ ] 4.2 Manual check: sign in with the saved username (stickymech) and with the email
