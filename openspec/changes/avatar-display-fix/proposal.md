## Why

User avatars render as broken images in the header. Investigation found two
root causes stacked on top of each other:

1. `Header.tsx` built the Gravatar URL with the **raw `user.email`**
   (`https://www.gravatar.com/avatar/${user.email}?s=32&d=404`). Gravatar
   expects an **MD5 hash** of the lowercased, trimmed email — the raw address
   produces a 404 (Gravatar's `d=404` turns "no account" into an actual HTTP
   404), so every avatar fails.
2. The `onError` fallback pointed at `https://via.placeholder.com/32`, a
   service **shut down in 2024** — so even the fallback is a dead image.

A correct helper already exists in the shared package
(`getProfileImageUrl` in `packages/shared/src/constants.ts`), so the header was
simply not using it. The fix is to use it and point the fallback at a local
asset.

## What Changes

- `Header.tsx`: resolve the avatar `src` as
  `user.avatar ?? getProfileImageUrl(user.email, 32) ?? "/placeholder-avatar.svg"`
  and set `onError` to the local `/placeholder-avatar.svg`.
  - This reuses the existing helper (which MD5-hashes correctly) and adds an
    honorable first preference: a user-uploaded `avatar` URL if the account
    ever carries one (see "Relevant user settings" above).
- `packages/shared/src/constants.ts`: generalize `getProfileImageUrl` to accept
  `size` and `defaultImg` options (defaults `200`/`"404"` keep the existing test
  green).
- Add `apps/client/public/placeholder-avatar.svg` (ink tile + neutral
  silhouette) as a durable, offline-first fallback.
- `BrandMark` / themes: no change (the avatar lives on `bg`/`card` surfaces; a
  32px image is fine on all four dark themes).

## Relevant user settings

The avatar is derived from a couple of user-account fields, which is what makes
this a settings concern rather than a pure UI bug:

- **`email`** (always present on `User`) drives the Gravatar lookup. This is the
  *de-facto* avatar today. Because the hash is deterministic, two accounts
  sharing a Gravatar email get the same avatar — worth knowing if a future
  "profile picture" upload feature is added.
- **`avatar: string | null`** (the `users.avatar` column, currently always
  `null`) is the reserved slot for an uploaded avatar URL. The fix makes the
  client honor it (`user.avatar ?? ...`) so that when avatar upload is later
  implemented, no header change is needed — uploaded wins, then Gravatar, then
  placeholder.

## Capabilities

### New Capabilities
- `user-avatar`: a resilient, privacy-safe user avatar display — uploaded
  `User.avatar`, else a hashed-email Gravatar, else a local placeholder, never
  a raw-email Gravatar URL or a dead external placeholder.

### Modified Capabilities
- `brand-surfaces` (header): the header avatar now resolves through the shared
  Gravatar helper + local fallback instead of an inline raw-email URL.

## Impact

- `apps/client/src/components/Header.tsx`: use `getProfileImageUrl`, honor
  `user.avatar`, local fallback.
- `packages/shared/src/constants.ts`: `getProfileImageUrl` gains `size`/`defaultImg`.
- `apps/client/public/placeholder-avatar.svg`: new.

## Risks / Trade-offs

- Gravatar requires network + exposes an MD5 of the email. The local
  `placeholder-avatar.svg` removes the external dependency for the fallback, and
  `s=32` requests the smallest useful size. No new privacy regression beyond the
  pre-existing Gravatar use.
- Honoring `user.avatar` is a no-op today (column always `null`) but keeps the
  wiring ready for the planned upload feature without a separate header change.
