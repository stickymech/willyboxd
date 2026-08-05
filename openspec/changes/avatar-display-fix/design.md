## Context

Avatars live in the app header (`Header.tsx`) and are sourced from the user
account. `User.avatar` is a `string | null` column, currently always `null`;
the only populated avatar source today was a Gravatar image keyed off the user's
email. The header is a 8px (w-8) rounded-square image, sized for all four dark
runtime themes (ink `#0F172A`/`--color-bg` surfaces provide plenty contrast).

The brand mark is transparent/on-dark; avatars sit on the same dark header so a
32px avatar with ink + neutral placeholder needs no per-theme variant.

## Decisions

### D1. Avatar source order: uploaded → local placeholder
Resolve the avatar as `user.avatar ?? "/placeholder-avatar.svg"`. There is no
third-party avatar source: Gravatar was dropped because there is no OAuth
(Apple/Google) yet and its hashed-email lookup was YAGNI. Uploaded avatars win,
otherwise a committed SVG placeholder.

### D2. Honor the `User.avatar` column now (no-op today)
Check `user.avatar ?? "/placeholder-avatar.svg"` so the header needs no change
when avatar upload ships later. The column already exists in `db.ts` and is
surfaced on `User`; the client simply wasn't consuming it.

### D3. Local placeholder, not a third-party default image
A local `placeholder-avatar.svg` (ink tile + slate silhouette) is served
offline, has zero external latency, and exposes no email-derived data. The
defunct `via.placeholder.com` fallback and the Gravatar `d=` defaults both
disappear.

### D4. No shared hashing helper for avatars
`getProfileImageUrl` / `GRAVATAR_BASE_URL` / the `js-md5` dependency are deleted
from `packages/shared` — with Gravatar gone there is no MD5 hashing to keep
unit-tested.

### D5. Avatar click navigates to a /settings route (not a 404-style blank page)
The header avatar links to `/settings`, a new route that renders the full
`Header` + an account settings card. Previously the link went to
`/users/:username`, a path with no client route and a server stub returning
501, producing a blank page with no header. The settings page lets the user:
- view their current avatar/email/username,
- upload a PNG/JPEG avatar image (validated by magic bytes, capped at 2MB,
  stored under `data/avatars/` and served at `/api/avatars/<id>`; the resulting
  serve URL is stored in `users.avatar` and prioritized over the placeholder),
- remove an uploaded avatar (`PUT /auth/me` with `{ avatar: null }`) so the
  header falls back to the placeholder,
- change their password (current + new, server-side bcrypt verification).

### D6. Favicon matches the disc-trio at all sizes
The browser-tab favicon previously carried the full rocket detail, invisible
at 16×16. The `favicon.svg` now contains only the three discs; PNG/ICO
fallbacks (16×16, 32×32) are generated from the same geometry so the tab icon
looks like the header mark on every browser.
