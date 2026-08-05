## Context

Avatars live in the app header (`Header.tsx`) and are sourced from the user
account. `User.avatar` is a `string | null` column, currently always `null`;
the only populated avatar source today is a Gravatar image keyed off the user's
email. The header is a 8px (w-8) rounded-square image, sized for all four dark
runtime themes (ink `#0F172A`/`--color-bg` surfaces provide plenty contrast).

The brand mark is transparent/on-dark; avatars sit on the same dark header so a
32px avatar with ink + neutral placeholder needs no per-theme variant.

## Decisions

### D1. Avatar source order: uploaded → hashed-email Gravatar → local placeholder
Use the existing shared helper `getProfileImageUrl` (which MD5-hashes the
email) as the Gravatar source, with `user.avatar` checked first so an uploaded
avatar wins when available. Fall back to a committed SVG placeholder — never a
third-party URL, because `via.placeholder.com` is defunct.

### D2. Honor the `User.avatar` column now (no-op today)
Check `user.avatar ?? getProfileImageUrl(...)` so the header needs no change
when avatar upload ships later. The column already exists in `db.ts` and is
surfaced on `User`; the client simply wasn't consuming it.

### D3. Local placeholder, not a Gravatar default image
A local `placeholder-avatar.svg` (ink tile + slate silhouette) is served
offline, has zero external latency, and avoids leaking that a user has "no
Gravatar". Gravatar's own `d=` defaults would still hit the network and 404.

### D4. Generalize the shared helper, don't re-implement in the header
`getProfileImageUrl(email, size, defaultImg)` gains options; header passes
`size=32`. Keeps the single hashed-email source of truth unit-tested.
