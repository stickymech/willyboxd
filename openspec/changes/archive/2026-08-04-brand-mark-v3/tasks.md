## 1. Brand mark geometry

- [x] 1.1 Build the disc-trio inline SVG: three overlapping discs `r=42` — orange `#F57C00` (64,44), green `#44C553` (120,60), blue `#29B6F6` (176,76), drawn blue→green→orange — each containing an upright phallic rocket silhouette (domed-tip capsule `path("M-16 -40 C-16 -48 16 -48 16 -40 L16 26 C16 32 -16 32 -16 26 Z")` + flared nozzle + white window, NO splayed fins — the previous fins read as a fish tail) at `translate(cx cy) scale(0.8)` in ink `#0F172A`, on a 240×120 viewBox
- [x] 1.2 Rewrite `BrandMark.tsx` as the disc-trio mark (transparent, fixed colours, no tile/`clipPath`/`text-accent`)
- [x] 1.3 Update `BrandMark.test.tsx` to assert 3 coloured discs (orange/green/blue) + 3 rocket silhouettes and the decorative/accessibility attributes

## 2. In-app application

- [x] 2.1 Set header mark to `w-28 h-14` (`text-5xl` wordmark, `h-20` header) in `Header.tsx`; confirmed during QA — iterated `w-7` → `w-10` (too small) → `w-32 h-16`/`h-24` (too big) → `w-28 h-14`/`h-20`
- [x] 2.2 Confirm `Login.tsx`/`Register.tsx` keep `w-14` with no `text-accent` on the fixed-colour mark

## 3. Static assets

- [x] 3.1 Redraw `favicon.svg` (64 ink rounded tile + disc trio), `mark-tile.svg` and `apple-touch-icon.svg` (512 ink tile + disc trio)
- [x] 3.2 Redraw `og.svg` (1200×630 ink canvas + larger disc trio + amber wordmark)
- [x] 3.3 Update `make-icons.py` to draw three discs + three phallic rocket silhouettes and composite onto the ink tile/OG canvas
- [x] 3.4 Regenerate `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `og.png` via `generate-icons.sh`; verified with `sips` and PIL pixel checks

## 4. Verification

- [x] 4.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` — all green
- [ ] 4.2 Manual browser QA: header mark (all 4 themes), auth pages, favicon, and OG image — confirm the Letterboxd-style trio and the phallic read with plausible deniability
