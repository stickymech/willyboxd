## 1. Brand mark geometry

- [ ] 1.1 Build the three-rocket inline SVG: capsule (`rounded_rectangle([-17,-42,17,40], radius=17)`) + fins + nozzle + white window as a `<defs>` rocket; three instances — orange `#F57C00` `translate(78 60) rotate(-18)`, green `#44C553` `translate(120 60)`, blue `#29B6F6` `translate(162 60) rotate(18)` — on a 240×120 viewBox
- [ ] 1.2 Rewrite `BrandMark.tsx` as the three-rocket mark (transparent, fixed colours, no tile/`clipPath`/`text-accent`)
- [ ] 1.3 Update `BrandMark.test.tsx` to assert 3 coloured rocket instances (orange/green/blue) and the decorative/accessibility attributes

## 2. In-app application

- [ ] 2.1 Set header mark to `w-10 h-10` in `Header.tsx`; confirm the 2:1 aspect reads well in the `h-14` header
- [ ] 2.2 Confirm `Login.tsx`/`Register.tsx` keep `w-14` with no `text-accent` on the fixed-colour mark

## 3. Static assets

- [ ] 3.1 Redraw `favicon.svg` (64 ink rounded tile + rockets), `mark-tile.svg` and `apple-touch-icon.svg` (512 ink tile + rockets)
- [ ] 3.2 Redraw `og.svg` (1200×630 ink canvas + larger rockets + amber wordmark)
- [ ] 3.3 Update `make-icons.py` to draw three rotated rockets (capsule + fins + nozzle + window) and composite onto the ink tile/OG canvas
- [ ] 3.4 Regenerate `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `og.png` via `generate-icons.sh`; verify with `sips` and PIL pixel checks

## 4. Verification

- [ ] 4.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` — all green
- [ ] 4.2 Manual browser QA: header mark (40px, all 4 themes), auth pages, favicon, and OG image — confirm the phallic read and plausible deniability
