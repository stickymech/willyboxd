## 1. Brand mark component

- [x] 1.1 Create `apps/client/src/components/BrandMark.tsx` — inline SVG (viewBox 64) with stick, rounded-crown flap with 3 clipped diagonal stripes, and board; `currentColor` fills with `--color-bg` stripe knockout; `aria-hidden="true"`, `focusable="false"`; accepts `className`/size props
- [x] 1.2 Add a unit test (`BrandMark.test.tsx`) asserting the SVG renders with `aria-hidden`, `focusable="false"`, and the expected viewBox

## 2. Static brand assets

- [x] 2.1 Author `apps/client/public/favicon.svg` (tile: amber rounded square + ink mark), `mark-tile.svg` (512), `apple-touch-icon.svg` (full-bleed 512, no rounding), `og.svg` (1200x630, ink canvas + amber mark + wordmark)
- [x] 2.2 Create `apps/client/scripts/generate-icons.sh` + `make-icons.py` — regenerates `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `og.png` via Pillow (qlmanage proved unreliable: wrong scale + clip misapplication) and verifies dimensions with `sips`
- [x] 2.3 Run the script and confirm the four PNGs exist at expected dimensions (192, 512, 180, 1200x630)

## 3. index.html + manifest wiring

- [x] 3.1 Add favicon, manifest, apple-touch-icon, `theme-color` meta, and the OG block to `apps/client/index.html`
- [x] 3.2 Create `apps/client/public/site.webmanifest` (name, short_name, start_url, display, theme_color/background_color, 192/512 icons)

## 4. Surface application

- [x] 4.1 Render `BrandMark` beside the wordmark in `apps/client/src/components/Header.tsx` (≈28px, accent color, still navigates home)
- [x] 4.2 Add `BrandMark` (≈56px, accent color) above the form in `apps/client/src/routes/Login.tsx`
- [x] 4.3 Add `BrandMark` (≈56px, accent color) above the form in `apps/client/src/routes/Register.tsx`

## 5. QA & verification

- [x] 5.1 Run `npm run lint && npm run typecheck && npm run test && npm run build` — all green
- [ ] 5.2 Manual browser check: favicon in tab, header mark on all 4 themes, login/register marks, and PNG dimensions/visuals
- [x] 5.3 Add a brief brand/icon note to `README.md` (feature list) if appropriate
