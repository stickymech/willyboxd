## Why

The user rejected the current slate-box brand mark ("not big enough", wants the Letterboxd-style joke). A first v3 draft — three stacked black circles on an amber tile — was implemented this session but rejected by the user ("wants something a bit more phallic"), who supplied a reference design: three rockets (rounded capsules with fins, nozzle and a white window) in orange/green/blue, the outer two tilted outward. This is the approved design and becomes the canonical brand mark going forward.

## What Changes

- Replace the slate-box mark with the **three-rocket trio** (approved reference): each rocket is a rounded capsule with side fins, a bottom nozzle and a white window; three instances — orange `#F57C00` rotated −18°, green `#44C553` vertical, blue `#29B6F6` rotated +18° — arranged in a row on a 240×120 viewBox.
- In-app `BrandMark` is **transparent on dark** (Letterboxd-style): fixed orange/green/blue, no `text-accent` inheritance, theme-agnostic and contrast-safe on all 4 dark themes.
- Static assets (favicon, launcher tiles, OG) get a **dark ink `#0F172A`** background so the coloured rockets read: `favicon.svg` (64 ink rounded tile), `mark-tile.svg`/`apple-touch-icon.svg` (512 ink tile), `og.svg` (ink canvas + rockets + amber wordmark).
- Header mark stays `w-10` (40px); auth pages keep `w-14`.
- The amber tile from the rejected three-circle draft is dropped entirely.

Scope notes:
- No behaviour change to auth, film data, themes, or any existing feature.
- Reuses the existing PIL-based generation pipeline — no new dependencies, no `qlmanage`.
- The three-rocket design is the canonical mark: all future surfaces use this geometry/palette.

## Capabilities

### New Capabilities
- `brand-mark`: The Willyboxd brand mark — the three-rocket trio in orange/green/blue, applied consistently across the in-app header, auth pages, favicon, launcher icons, and OG/social assets.

### Modified Capabilities

## Impact

- `apps/client/src/components/BrandMark.tsx`: replace slate-box with the three-rocket inline SVG.
- `apps/client/src/components/BrandMark.test.tsx`: assert the 3 coloured rocket instances.
- `apps/client/src/components/Header.tsx`: `w-10 h-10` transparent mark.
- `apps/client/src/routes/Login.tsx` / `Register.tsx`: keep `w-14`; no `text-accent` on the fixed-colour mark.
- `apps/client/public/favicon.svg`, `mark-tile.svg`, `apple-touch-icon.svg`, `og.svg`: new geometry.
- `apps/client/scripts/make-icons.py`: draw three rotated rockets (capsule + fins + nozzle + window) onto the dark tile/OG canvas.
- `apps/client/public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `og.png`: regenerated.
- Tests: `npm run lint && npm run typecheck && npm run test && npm run build` all stay green.
