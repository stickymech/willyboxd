## Context

Willyboxd currently has no product identity. `apps/client/index.html` is a bare Vite scaffold — no favicon, manifest, or social meta — and the header brand is a text-only link (`Header.tsx:14`). The app ships 4 runtime themes (amber default, spotify, runway, linear) with a dark `bg`/`surface` base and a per-theme `accent` token. The name is a Letterboxd play on English slang, so the identity should land the joke with plausible deniability: an obvious film symbol whose silhouette is the innuendo.

Assets are served by Vite's default `public/` dir; `nginx.conf` uses `try_files $uri ... /index.html` so anything in `dist/` (which Vite copies from `public/`) is served as-is.

## Goals / Non-Goals

**Goals:**
- A single recognizable mark — "clapperboard at attention" — that reads as a film slate first, the joke second.
- Full-surface application: tab favicon, header logo, auth pages, PWA manifest + launcher icons, OG/social meta.
- Theme-aware in-app mark (adapts to all 4 accents) plus a fixed brand palette for static assets.
- Zero new runtime/CI dependencies; PNGs regenerable from SVG masters.
- No behavior change to auth, film data, or any existing feature.

**Non-Goals:**
- No redesign of the app UI, no new pages, no changes to server/shared packages.
- No animated/branded loading screens, no icon-in-every-component sweep.
- No CI-based icon generation (hobby project; regeneration is a local dev task).
- No change to the runtime theme system or its palettes.

## Decisions

### D1. The mark: "slate box" (SVG geometry)

Master geometry in a `64` viewBox, centered on x=32:

- **Slate box** — `<rect x="18" y="10" width="28" height="44" rx="7">` — a single bold, tall rounded box (the "box" in willyboxd / a box-office pun) filling most of the canvas.
- **Stripes** — two thick diagonal stripes (≈45°, clipped to the box) = the classic clapperboard flap.

Silhouette = a chunky rounded box with a diagonal-stripe band across its top = reads as a clapperboard at any size, no straw/stick (v1 had a standing stick on a domed flap that read as a milkshake — removed). The tall box + rounded top keeps the cheeky capsule read with plausible deniability.

**Alternatives considered:** banana/reel, rosebud, cigar-capsule; v1 "stick on dome" (milkshake). Slate box won on legibility at 16px favicon size (verified via pixel-grid renders: a clean chunky box with visible stripes, no straw), the strongest plausible deniability, and the box pun.

### D1a. Icon v1 regression (fix record)
v1 (stick + rounded crown + board) read as a milkshake at favicon size — the standing stick is a straw on a domed cup, and the 3px flap band lost its stripes. Fixed by removing the stick and merging flap+board into one bold rounded box with two thick stripes.

### D2. Brand palette vs runtime themes

- **Brand palette (static assets):** amber `#EAB308` (matches default accent), ink `#0F172A` (matches default `bg`). Theme-agnostic; identical everywhere.
- **Monochrome in-app variant:** `BrandMark.tsx` draws stick + crown + board in `currentColor` (inherits `text-accent` in the header) and knocks stripes out with `fill: var(--color-bg)`. So the header mark automatically matches whichever of the 4 themes is active.

**Alternatives considered:** hard-coding amber everywhere. Rejected — would look broken on the spotify (green), runway (grey), and linear (indigo) themes. `currentColor` costs nothing and stays consistent.

### D3. `BrandMark.tsx` as an inline SVG component

One React component in `apps/client/src/components/`, `<svg>` with `aria-hidden="true"` (decorative — the wordmark provides the name) and `focusable="false"`. Size via `className`/`width`/`height` props. No image requests, no font dependency, inherits text color.

### D4. Static asset set + generation script

- **Favicon/mark** — `favicon.svg` (64 viewBox, amber rounded-square tile + ink mark + amber stripes) served directly by the browser.
- **Master references** — `mark-tile.svg` (512 tile), `apple-touch-icon.svg` (full-bleed 512, no rounding), `og.svg` (1200×630, ink canvas + amber mark + wordmark) kept as committed vector references.

`apps/client/scripts/make-icons.py` renders all four PNGs with Pillow (deterministic, pixel-exact): `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `og.png`. `apps/client/scripts/generate-icons.sh` invokes it and sanity-checks dimensions with `sips`.

**Verified deviation:** `qlmanage` proved unreliable for these assets — it renders viewBox-only SVGs at the wrong scale and misapplies `clip-path` when transforms are involved (the 64px favicon clips fine in browsers, but 512 masters did not). All PNGs are therefore generated with Pillow instead; square icons were pixel-verified (amber `234 179 8` tile, ink `15 23 42` mark, stripes clipped to the box).

**Alternatives considered:** `sharp` (needs a new dependency — rejected for a zero-dep goal), hand-authored PNGs (unmaintainable), `qlmanage` (unreliable — see deviation above).

### D5. index.html / manifest wiring

- `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`, `<link rel="manifest" href="/site.webmanifest">`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`, `<meta name="theme-color" content="#0F172A">`.
- `site.webmanifest`: name/short_name "Willyboxd", `start_url "/"`, `display standalone`, `background_color`/`theme_color` `#0F172A`, 192/512 icons.
- OG block: `og:type website`, `og:title Willyboxd`, short `og:description`, `og:image /og.png`, `og:url` left relative (local hobby app; canonical absolute URL noted as a deploy-time step).

### D6. Header + auth page application

- Header: `BrandMark` (≈28px) beside the existing wordmark link; link keeps `text-accent`.
- Login/Register: `BrandMark` (≈56px, `text-accent`) centered above the form — sizing/details finalized against the real files during implementation.

## Risks / Trade-offs

- [macOS-only PNG generation (Pillow for all PNGs)] → Script is a dev-time helper only; CI never runs it; assets are committed, so builds are unaffected.
- [SVG favicon unsupported in ancient browsers] → Negligible for a local hobby app; apple-touch-icon covers iOS.
- [OG `og:image` must be an absolute URL for real scrapers] → Relative `/og.png` works locally/in-browser; documented in the script header + change as a deploy step.
- [In-app stripe knockout uses `var(--color-bg)`] → Mark is only placed on `bg` surfaces (header, auth pages); documented constraint on `BrandMark`.
- [Static `theme-color` ignores runtime theme] → Browser chrome tint only; acceptable and standard.
- [No visual QA possible in this session (no image input)] → Geometry is 4 simple shapes; user eyeballs the generated PNGs before merge.

## Migration Plan

Additive only: new files under `public/`, one new component, edits to `index.html`, `Header.tsx`, `Login.tsx`, `Register.tsx`. No schema/API/data migration. Rollback is a single commit revert. Verification: `npm run lint && npm run typecheck && npm run test && npm run build`, then manual eyeball of favicon (all 4 themes), header, auth pages, and PWA install prompt (if any).
