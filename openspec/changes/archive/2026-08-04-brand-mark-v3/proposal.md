## Why

The user rejected the current slate-box brand mark ("not big enough", wants the Letterboxd-style joke). A first v3 draft — three stacked black circles on an amber tile — was rejected ("wants something a bit more phallic"), leading to a three-rocket reference, then refined during QA to a **Letterboxd-style disc-trio**: three overlapping coloured discs each containing an upright rocket silhouette. This is the approved design and becomes the canonical brand mark going forward.

## What Changes

- Replace the slate-box mark with a **Letterboxd-style trio**: three overlapping discs — orange `#F57C00`, green `#44C553`, blue `#29B6F6` — arranged diagonally, each containing an upright rocket silhouette in brand ink `#0F172A` with a white window (the phallic read). The user refined the mark during QA: first the three-rocket trio, then this disc-arrangement that "looks like the letterboxd logo".
- In-app `BrandMark` is **transparent on dark** (Letterboxd-style): fixed disc colours + ink rockets, no `text-accent` inheritance, theme-agnostic and contrast-safe on all 4 dark themes.
- Static assets (favicon, launcher tiles, OG) get a **dark ink `#0F172A`** background so the coloured discs read: `favicon.svg` (64 ink rounded tile), `mark-tile.svg`/`apple-touch-icon.svg` (512 ink tile), `og.svg` (ink canvas + discs + amber wordmark).
- Header brand block is `w-28 h-14` (112×56) with a `text-5xl` wordmark in an `h-20` header (iterated down from an oversized 3×); auth pages keep `w-14`.
- The amber tile from the rejected three-circle draft is dropped entirely.

Scope notes:
- No behaviour change to auth, film data, themes, or any existing feature.
- Reuses the existing PIL-based generation pipeline — no new dependencies, no `qlmanage`.
- The disc-trio design is the canonical mark: all future surfaces use this geometry/palette.

## Capabilities

### New Capabilities
- `brand-mark`: The Willyboxd brand mark — three Letterboxd-style discs containing rocket silhouettes (orange/green/blue), applied consistently across the in-app header, auth pages, favicon, launcher icons, and OG/social assets.

### Modified Capabilities

## Impact

- `apps/client/src/components/BrandMark.tsx`: replace slate-box with the disc-trio inline SVG.
- `apps/client/src/components/BrandMark.test.tsx`: assert the 3 coloured discs + rocket silhouettes.
- `apps/client/src/components/Header.tsx`: `w-10 h-10` transparent mark.
- `apps/client/src/routes/Login.tsx` / `Register.tsx`: keep `w-14`; no `text-accent` on the fixed-colour mark.
- `apps/client/public/favicon.svg`, `mark-tile.svg`, `apple-touch-icon.svg`, `og.svg`: new geometry.
- `apps/client/scripts/make-icons.py`: draw three discs (orange/green/blue) each containing a phallic rocket silhouette (domed capsule + nozzle + window) onto the dark tile/OG canvas.
- `apps/client/public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `og.png`: regenerated.
- Tests: `npm run lint && npm run typecheck && npm run test && npm run build` all stay green.
