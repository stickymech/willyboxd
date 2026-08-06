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

In the follow-up pass we decided the Gravatar dependency itself is YAGNI: there
is no OAuth (Apple/Google) yet, so a hashed-email avatar from a third party
buys nothing and adds a network + privacy dependency. The avatar is now
**uploaded image, else a local placeholder** — no third-party avatar service at
all.

## What Changes

- `Header.tsx`: resolve the avatar `src` as
  `resolveAvatarUrl(user.avatar) ?? "/placeholder-avatar.svg"` and set `onError`
  to the local `/placeholder-avatar.svg`. Uploaded `User.avatar` wins; otherwise
  a committed placeholder — never an email-derived URL.
- `packages/shared/src/constants.ts`: delete `getProfileImageUrl`,
  `GRAVATAR_BASE_URL`, and the `js-md5` import; drop the `js-md5` dependency.
- `apps/client/public/placeholder-avatar.svg` (ink tile + neutral silhouette) is
  the durable, offline-first fallback.
- `Settings.tsx`: the avatar controls are real buttons (`btn-secondary`) —
  "Upload image"/"Change avatar" opens the OS file picker via a hidden file
  input and uploads automatically on selection; "Remove avatar" is shown only
  when an avatar is set. This replaces the label-on-`display:none`-input pattern,
  which was unreliable for opening the picker.
- `BrandMark` / themes: no change (the avatar lives on `bg`/`card` surfaces; a
  32px image is fine on all four dark themes).

## Relevant user settings

The avatar is derived from a user-account field:

- **`avatar: string | null`** (the `users.avatar` column, currently always
  `null`) is the reserved slot for an uploaded avatar URL. The client honors it
  (`resolveAvatarUrl(user.avatar) ?? placeholder`) so that when avatar upload is
  implemented, no header change is needed — uploaded wins, then placeholder.

## Capabilities

### New Capabilities
- `user-avatar`: a resilient, privacy-safe user avatar display — uploaded
  `User.avatar`, else a local placeholder. No third-party avatar service, no
  email-derived URL.

### Modified Capabilities
- `brand-surfaces` (header): the header avatar now resolves through the local
  avatar URL + placeholder fallback instead of a Gravatar URL.

## Impact

- `apps/client/src/components/Header.tsx`: use `resolveAvatarUrl(user.avatar) ?? "/placeholder-avatar.svg"`, local fallback.
- `apps/client/src/routes/Settings.tsx`: real avatar buttons (upload via hidden input ref, remove), placeholder-only fallback.
- `packages/shared/src/constants.ts`: remove `getProfileImageUrl` / `GRAVATAR_BASE_URL` / `js-md5`; `package.json` drops the `js-md5` dependency.
- `apps/client/public/placeholder-avatar.svg`: new.

## Risks / Trade-offs

- Removing Gravatar means no email-keyed avatar appears without an explicit
  upload. Given there is no OAuth and no profile pictures exist in production,
  the placeholder is the honest default and the external dependency is gone.
- Honoring `user.avatar` is a no-op today (column always `null`) but keeps the
  wiring ready for the planned upload feature without a separate header change.
