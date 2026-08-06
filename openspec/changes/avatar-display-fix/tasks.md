## 1. Shared package

- [x] 1.1 Remove `getProfileImageUrl`, `GRAVATAR_BASE_URL`, and the `js-md5` import from `packages/shared/src/constants.ts`; drop `js-md5` from `package.json` + lockfile.
- [x] 1.2 Delete the 4 `getProfileImageUrl` tests from `constants.test.ts`.
- [x] 1.3 Add `ChangePasswordSchema` + `AvatarSchema` to `packages/shared/src/schemas.ts`.

## 2. Client header avatar

- [x] 2.1 `Header.tsx`: `src = resolveAvatarUrl(user.avatar) ?? "/placeholder-avatar.svg"`; `onError` → `/placeholder-avatar.svg`.
- [x] 2.2 Add `apps/client/public/placeholder-avatar.svg` (ink tile + neutral silhouette, 32x32 viewBox).
- [x] 2.3 Point the header avatar link at `/settings` (was `/users/:username` with no route → blank page).

## 3. Settings page

- [x] 3.1 Create `apps/client/src/routes/Settings.tsx`: account info, avatar file upload (POST /auth/avatar, PNG/JPEG, max 2MB), remove avatar (PUT /auth/me with `{ avatar: null }`), password change form (PUT /auth/password).
- [x] 3.2 Register `/settings` route in `App.tsx`.
- [x] 3.3 Use a real primary button for upload/change (hidden file input opened via `useRef`), secondary button for remove, auto-upload on file select; avatar resolves to `/placeholder-avatar.svg` when none uploaded; remove falls back to placeholder and resets to "Upload image".
- [ ] 3.4 Manual QA: click header avatar -> /settings loads with header intact; avatar upload persists (auto-upload on select via real button); remove reverts to placeholder; password change works with wrong/correct current password.

## 4. Server endpoints

- [x] 4.1 `PUT /auth/me` — clear avatar (`{ avatar: null }`, validated by `AvatarSchema`) for the sessioned user.
- [x] 4.2 `PUT /auth/password` — verify current password (bcrypt.compare), then rehash + update (validated by `ChangePasswordSchema`).
- [x] 4.3 `POST /auth/avatar` — accept multipart file, validate PNG/JPEG magic bytes + 2MB cap, store under `data/avatars/`, persist `/api/avatars/<id>` in `users.avatar`. `GET /avatars/:filename` serves stored avatars.

## 5. Favicon

- [x] 5.1 Simplify `favicon.svg` to disc-trio (no rocket details, which are invisible at 16x16).
- [x] 5.2 Generate `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico` via `make-icons.py`.
- [x] 5.3 Add multi-size `<link>` references in `index.html`.

## 6. Verification

- [x] 6.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` — all green. shared 18 / client 21 / server 44.
- [ ] 6.2 Run `scripts/qa-brand-avatar.sh` automated checks (all pass) + manual browser sections [A]–[F].
