## Why

Willyboxd ships with zero branding: no favicon, no product mark, no PWA/social metadata. The browser tab is a blank Vite icon and the header is a bare text wordmark. The name is a cheeky Letterboxd play on English slang, so the identity should carry the same wink — unmistakably a film-app mark first, a not-so-subtle nod second, never crude.

## What Changes

- Introduce a **product mark** — a "clapperboard at attention" icon: a film slate whose striped flap forms a rounded crown with its stick standing upright, so the silhouette reads as the old innuendo at a glance while reading as a clapperboard at a second glance.
- Add a fixed **brand palette** (theme-agnostic, separate from the runtime themes): brand amber `#EAB308` and brand ink `#0F172A`, plus a **monochrome `currentColor` variant** for in-app surfaces so it adapts to all 4 themes automatically.
- Wire the mark into every public surface:
  - Browser tab **favicon** (SVG).
  - **Header logo** (mark + wordmark) in `Header.tsx`.
  - **Auth pages** (Login/Register) brand mark.
  - **PWA manifest** (`site.webmanifest`) + launcher icons (192/512 PNG) + apple-touch-icon (180 PNG).
  - **OG/social meta** + `theme-color` in `index.html`.
- Add a reproducible icon-generation script so PNGs can be regenerated from the SVG master (no new runtime dependencies).
- No server or shared-package changes; no behavior change to existing features.

## Capabilities

### New Capabilities
- `brand-mark`: The Willyboxd product mark — its SVG geometry (the clapperboard-at-attention silhouette), the fixed brand palette (amber/ink), the monochrome `currentColor` variant for in-app use, and accessibility rules (decorative alt handling, min rendered size).
- `brand-surfaces`: Where the mark is applied — favicon, header logo, auth pages, PWA manifest + icons, and OG/social metadata — and the static asset set backing them.

### Modified Capabilities
<!-- None yet - no main specs exist -->

## Impact

- NEW `apps/client/public/`: `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og.png`, `site.webmanifest`
- NEW `apps/client/src/components/BrandMark.tsx` — inline SVG React component (monochrome `currentColor`)
- NEW `apps/client/scripts/generate-icons.sh` — regenerates PNGs from SVG masters via macOS `qlmanage`
- `apps/client/index.html` — favicon, manifest, `theme-color`, OG meta
- `apps/client/src/components/Header.tsx` — brand mark beside the wordmark
- `apps/client/src/routes/Login.tsx`, `Register.tsx` — brand mark on auth pages
- No server, shared-package, or dependency changes
