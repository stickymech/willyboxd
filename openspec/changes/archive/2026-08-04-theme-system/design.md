## Context

The client (Vite + React 18 + Tailwind CSS 3.4) currently uses a hardcoded dark-slate palette: `slate-900` backgrounds, `slate-800` cards, `amber-400` accents, spread as literal utility classes across ~9 route/component files (~70 occurrences). `tailwind.config.cjs` defines a few named colors (`primary`, `secondary`, `accent`, `accent-hover`) that are only partially used. The brand renders twice (Header logo + `<h1>` on Home). There is no theming concept.

The goal is a switchable, token-driven theme system shipping with 4 themes, while keeping the change scoped to the client (no server or shared-package changes).

## Goals / Non-Goals

**Goals:**
- Semantic design tokens mapped to Tailwind utilities so every component restyles automatically when the theme switches.
- 4 themes: Classic Amber (default = current palette, tokenized + polished), Spotify, Runway, Linear.
- Runtime theme switching via a switcher in the Header, persisted across reloads (localStorage).
- Remove the duplicate brand `<h1>` on Home.
- All lint/typecheck/test/build green; add a theme QA section to `QA-PHASE1.md`.

**Non-Goals:**
- No server-side changes (no theming API, no user-profile theme storage).
- No Phase 2 features (diary logging, watchlist CRUD, lists).
- No Playwright e2e, no Docker verification.
- No dark/light OS-auto-switching.

## Decisions

### 1. Design tokens as CSS variables on `[data-theme="..."]`, Tailwind maps to them

Each theme is a CSS block scoped to a `data-theme` attribute on `<html>`:

```css
:root,
[data-theme="amber"] {
  --color-bg: 15 23 42;         /* slate-900 */
  --color-surface: 30 41 59;    /* slate-800 */
  --color-accent: 234 179 8;    /* amber-400 */
  /* ... */
}
[data-theme="spotify"] { /* ... */ }
[data-theme="runway"] { /* ... */ }
[data-theme="linear"] { /* ... */ }
```

`tailwind.config.cjs` maps semantic names to the variables:

```js
colors: {
  bg: "rgb(var(--color-bg) / <alpha-value>)",
  surface: "rgb(var(--color-surface) / <alpha-value>)",
  "surface-2": "...",
  border: "...",
  text: "...",
  "text-muted": "...",
  "text-subtle": "...",
  accent: "...",
  "accent-hover": "...",
  "accent-contrast": "...",
  error: "...",
},
```

The `rgb(var(--x) / <alpha-value>)` pattern (Tailwind v3) keeps opacity modifiers (`bg-bg/50`) working. Token values are stored as space-separated RGB triplets (no commas) so the `/ <alpha-value>` interpolation works.

**Alternatives considered:** Tailwind `theme()` color arrays, CSS-in-JS, or 4 separate Tailwind configs — all rejected as more complex or less performant than the CSS-var approach.

### 2. `ThemeProvider` + `useTheme` with localStorage

- New `src/lib/theme.tsx` exports `ThemeProvider`, `useTheme`, and a `ThemeId` union type.
- `useTheme()` returns `{ theme, setTheme }`; `setTheme` persists to `localStorage["willyboxd-theme"]` and sets `document.documentElement.dataset.theme`.
- On mount, read localStorage (falling back to `amber`); validate against the known theme ids.
- `main.tsx` wraps `<App />` in `<ThemeProvider>`.
- Default theme is "Classic Amber" so the initial look is unchanged.

**Flash mitigation:** index.css gives `:root` the amber palette by default (the `:root, [data-theme="amber"]` selector), so even before React hydrates, the page shows the default palette. No inline script needed.

**Alternative considered:** inline script in `index.html` to set `data-theme` before paint — rejected as YAGNI; the default-amber `:root` rule covers the flash case for the default theme, and a persisted non-default theme flashes only for one frame.

### 3. ThemeSwitcher in the Header

- New `src/components/ThemeSwitcher.tsx`: a settings/theme icon button that toggles a dropdown listing the 4 themes, each shown with a preview dot (accent + surface color) and label.
- Add it to `src/components/Header.tsx` next to existing controls.
- Purely client-side; no server involvement.

### 4. Component migration to semantic tokens

- Replace hardcoded `slate-*` / `amber-*` classes with semantic equivalents across `Home`, `Search`, `Login`, `Register`, `FilmDetail`, `Diary`, `Watchlist`, `Header`, `FilmCard`, `RatingSelect`.
- `.btn-primary`, `.btn-secondary`, `.rating-star` in `index.css` switch to token colors (e.g. `bg-accent text-accent-contrast hover:bg-accent-hover`).
- Keep the existing visual identity for Classic Amber (the tokens replicate slate-900/slate-800/amber-400).
- For Spotify/Runway, accent stays functional-only (CTAs/links/active states), restrained per their DESIGN.md ethos (references fetched in prior session: `design-md/spotify`, `design-md/runwayml`, `design-md/linear.app` from VoltAgent/awesome-design-md).

### 5. Home brand dedupe

- Remove `<h1>Willyboxd</h1>` from `Home.tsx:24`; brand lives in the Header.

## Risks / Trade-offs

- **Opacity modifiers break if token format is wrong** → Use space-separated RGB triplets and the `rgb(var(--x) / <alpha-value>)` pattern; verify a `bg-bg/50`-style class renders after migration.
- **Missed hardcoded classes** leave stray slate/amber utilities → Grep for `slate-`/`amber-` after migration and audit remaining matches (legitimate ones like RatingSelect empty-state may stay if intentional).
- **Flash of unstyled/unthemed content on non-default themes** → Accepted (1-frame); default `:root` palette covers the common case.
- **Localized contrast issues per theme** → Each theme defines full `accent-contrast`; spot-check buttons/links in all 4 themes during manual QA.
