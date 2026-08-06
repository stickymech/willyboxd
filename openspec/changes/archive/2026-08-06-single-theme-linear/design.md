## Context

The runtime theme system lives in `apps/client/src/lib/theme.tsx`
(`THEMES`, `ThemeProvider`, `useTheme`, localStorage persistence) and is applied
via `data-theme` on `<html>`, with per-theme token blocks in `index.css` and a
switcher in the header. This was built when the brand wanted variety; the brand
has since settled on Linear, and the extra machinery is dead weight.

## Decisions

### D1. Single Linear palette on `:root`
Move the Linear token values onto `:root` and delete every
`[data-theme="..."]` and `[data-theme-preview]` block. No `data-theme`
attribute is set or read; CSS always resolves to the Linear tokens.

### D2. Delete the theme machinery
Remove `lib/theme.tsx` and `components/ThemeSwitcher.tsx`. `main.tsx` loses the
`<ThemeProvider>` wrapper; `Header.tsx` loses the switcher. Nothing else needs a
theme context.

### D3. Don't force-migrate stored preferences
A previously stored `localStorage["willyboxd-theme"]` value is simply ignored
— there is no reader for it anymore. No migration code is worth the bytes.
