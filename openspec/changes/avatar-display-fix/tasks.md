## 1. Shared helper

- [x] 1.1 Generalize `getProfileImageUrl(email, size?, defaultImg?)` in `packages/shared/src/constants.ts` (defaults 200 / "404").
- [x] 1.2 Add/extend `constants.test.ts`: assert URL is hashed (no raw-email leakage), contains the MD5 of the lowercased email, and honors `size=32`.

## 2. Client header avatar

- [x] 2.1 `Header.tsx`: `src = user.avatar ?? getProfileImageUrl(user.email, 32) ?? "/placeholder-avatar.svg"`; `onError` → `/placeholder-avatar.svg`.
- [x] 2.2 Add `apps/client/public/placeholder-avatar.svg` (ink tile + neutral silhouette, 32x32 viewBox).

## 3. Verification

- [x] 3.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` — all green.
- [ ] 3.2 Manual QA: logged-in header avatar renders a Gravatar (or placeholder) for a known email; verify no broken-image icon.
