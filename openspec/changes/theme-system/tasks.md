## 1. Design tokens & theme CSS

- [x] 1.1 Map semantic color names to CSS variables in `apps/client/tailwind.config.cjs` using `rgb(var(--color-x) / <alpha-value>)`
- [x] 1.2 Add `:root` + four `[data-theme="..."]` blocks (amber, spotify, runway, linear) in `apps/client/src/index.css` defining all tokens (bg, surface, surface-2, border, text, text-muted, text-subtle, accent, accent-hover, accent-contrast, error, radius-*, shadow-card)
- [x] 1.3 Update `.btn-primary`, `.btn-secondary`, `.rating-star` in `index.css` to use semantic token colors
- [x] 1.4 Remove hardcoded `bg-slate-900 text-slate-100` from `<body>` in `apps/client/index.html`

## 2. Theme provider & wiring

- [x] 2.1 Create `apps/client/src/lib/theme.tsx` with `ThemeProvider`, `useTheme()`, `ThemeId` type, localStorage persistence, and `data-theme` applied to `document.documentElement`
- [x] 2.2 Wrap `<App />` in `ThemeProvider` in `apps/client/src/main.tsx`

## 3. Theme switcher UI

- [x] 3.1 Create `apps/client/src/components/ThemeSwitcher.tsx` (icon button + dropdown with 4 preview dots + labels, current selection indicated)
- [x] 3.2 Add `ThemeSwitcher` to `apps/client/src/components/Header.tsx`

## 4. Component & route migration

- [x] 4.1 Replace hardcoded `slate-*`/`amber-*` classes with semantic tokens in `Home.tsx` and remove the duplicate `<h1>Willyboxd</h1>`
- [x] 4.2 Migrate `Search.tsx`
- [x] 4.3 Migrate `Login.tsx`
- [x] 4.4 Migrate `Register.tsx`
- [x] 4.5 Migrate `FilmDetail.tsx`
- [x] 4.6 Migrate `Diary.tsx`
- [x] 4.7 Migrate `Watchlist.tsx`
- [x] 4.8 Migrate `Header.tsx`, `FilmCard.tsx`, `RatingSelect.tsx`
- [x] 4.9 Grep for remaining `slate-`/`amber-` and audit stragglers

## 5. QA & verification

- [x] 5.1 Add a theme-switching QA section to `QA-PHASE1.md`
- [x] 5.2 Run `npm run lint && npm run typecheck && npm run test && npm run build` — all green
- [ ] 5.3 Manual browser check: all 4 themes render correctly, switcher persists selection on reload

## 6. Release & GitHub sync

- [ ] 6.1 Commit work on `phase-1-release` and push
- [ ] 6.2 Update PR #2 with before/after + theme QA steps; keep issue #1 linked
- [ ] 6.3 Merge PR #2 to `main` and close issue #1 (with user go-ahead)
