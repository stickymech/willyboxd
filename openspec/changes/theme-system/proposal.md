## Why

The willyboxd UI works functionally but looks "bland": a single flat dark-slate palette (slate-900 bg, slate-800 cards, amber-400 accent) with hardcoded Tailwind color classes sprinkled across every route and component. There is no way to switch the look of the app, and the "Willyboxd" brand is duplicated (header logo + an `<h1>` on Home).

## What Changes

- Introduce a **design-token theme system**: CSS-variable tokens defined per `[data-theme="..."]` block on `<html>`, with Tailwind semantic color names mapped to them so every component restyles automatically on switch.
- Ship **4 themes**: Classic Amber (default, current palette tokenized), Spotify, Runway, Linear.
- Add a **ThemeProvider + useTheme** hook with localStorage persistence; sets `data-theme` on `<html>` on boot to avoid flash.
- Add a **ThemeSwitcher** (settings icon + dropdown with 4 preview dots) in the Header.
- Replace ~70 hardcoded `slate-*`/`amber-*` classes across routes/components with semantic tokens.
- Remove the duplicate `<h1>Willyboxd</h1>` on Home (brand lives in the header).
- Add a theme-switching QA section to `QA-PHASE1.md`.

## Capabilities

### New Capabilities
- `theming`: design-token system — semantic token names, their Tailwind mapping, and the four `[data-theme]` palettes (`bg`, `surface`, `surface-2`, `border`, `text`, `text-muted`, `text-subtle`, `accent`, `accent-hover`, `accent-contrast`, `error`, `radius-*`, `shadow-card`).
- `theme-switching`: runtime theme selection — `ThemeProvider`/`useTheme`, localStorage persistence, `data-theme` applied to `<html>`, and the ThemeSwitcher UI in the Header.
- `theme-application`: all client screens and shared components render with semantic tokens instead of hardcoded palette classes; duplicate brand heading removed.

### Modified Capabilities
<!-- None yet - first capability set for this repo -->

## Impact

- `apps/client/tailwind.config.cjs` — map semantic names to CSS vars
- `apps/client/src/index.css` — 4 `[data-theme]` blocks + base layer + theme-aware `.btn`/`.rating-star`
- `apps/client/src/lib/theme.tsx` — NEW `ThemeProvider` + `useTheme`
- `apps/client/src/components/ThemeSwitcher.tsx` — NEW
- `apps/client/src/components/Header.tsx` — add ThemeSwitcher
- `apps/client/src/main.tsx` — wrap in `ThemeProvider`
- `apps/client/index.html` — remove hardcoded `bg-slate-900 text-slate-100` on `<body>`
- Route files: `Home`, `Search`, `Login`, `Register`, `FilmDetail`, `Diary`, `Watchlist`
- Components: `Header`, `FilmCard`, `RatingSelect`
- `QA-PHASE1.md` — theme-switching QA section
- No server or shared-package changes
