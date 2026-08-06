## 1. CSS

- [x] 1.1 `apps/client/src/index.css`: set `:root` to Linear token values; delete the `[data-theme="amber"|"spotify"|"runway"|"linear"]` and `[data-theme-preview]` blocks.

## 2. Code

- [x] 2.1 Delete `apps/client/src/lib/theme.tsx`.
- [x] 2.2 Delete `apps/client/src/components/ThemeSwitcher.tsx`.
- [x] 2.3 `apps/client/src/main.tsx`: remove `ThemeProvider` import + wrapper.
- [x] 2.4 `apps/client/src/components/Header.tsx`: remove `ThemeSwitcher` import + usage.

## 3. Tests

- [x] 3.1 Remove the `../lib/theme` mock and `<ThemeProvider>` wrapper from `Home.test.tsx`, `Search.test.tsx`, `Watchlist.test.tsx`.

## 4. Docs

- [x] 4.1 Update `scripts/qa-brand-avatar.sh` (no "4 themes" / no theme switcher).
- [x] 4.2 Sync main specs (`theming`, `theme-switching`, `brand-mark`) via delta.

## 5. Verification

- [x] 5.1 Run `npx turbo run lint typecheck test build --force` — all green.
