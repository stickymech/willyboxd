## Why

The app ships four switchable themes (Classic Amber, Spotify, Runway, Linear)
via a `ThemeProvider` + header switcher. For a hobby app this is over-built:
the switcher adds UI surface area, the per-theme token blocks complicate the
CSS, and every archived spec has to reference "all four dark themes". The
Linear theme is the one we like — drop the other three and the switcher, and
make Linear the single, fixed palette.

## What Changes

- `apps/client/src/index.css`: delete the `[data-theme="amber"|"spotify"|"runway"|"linear"]`
  blocks and the `[data-theme-preview]` blocks; make `:root` the Linear token
  values. One palette, no `data-theme` attribute.
- Delete `apps/client/src/lib/theme.tsx` (`THEMES`, `ThemeProvider`, `useTheme`)
  and `apps/client/src/components/ThemeSwitcher.tsx`.
- `apps/client/src/main.tsx`: remove the `<ThemeProvider>` wrapper.
- `apps/client/src/components/Header.tsx`: remove the `<ThemeSwitcher />`.
- Remove the `../lib/theme` mocks and `<ThemeProvider>` wrappers from
  `Home.test.tsx`, `Search.test.tsx`, `Watchlist.test.tsx`.

## Capabilities

### Modified Capabilities
- `theme-application`: the app now has exactly one palette (Linear) applied to
  `:root`; there is no runtime theme switching.
- `theme-switching`: removed — no `ThemeProvider`/`useTheme`/switcher.
- `brand-surfaces` (header): the theme switcher button is gone from the header.

## Impact

- `apps/client/src/index.css`, `main.tsx`, `components/Header.tsx`
- Deleted: `lib/theme.tsx`, `components/ThemeSwitcher.tsx`
- Tests: `routes/{Home,Search,Watchlist}.test.tsx`

## Risks / Trade-offs

- Any stored `localStorage["willyboxd-theme"]` value becomes inert (harmless).
- Removing themes loses the option for users to pick a palette; acceptable —
  YAGNI for a hobby app, and Linear is the chosen identity.
