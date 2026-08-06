## ADDED Requirements

### Requirement: App ships a single fixed palette
The client SHALL apply exactly one palette — the Linear tokens — on `:root`.
The document SHALL NOT depend on any `data-theme` attribute or theme context.
No runtime theme switching SHALL be provided.

#### Scenario: page renders with the Linear palette
- **WHEN** the app loads with no `data-theme` attribute on the root element
- **THEN** every token-backed utility renders with the Linear token values
  (bg `1 1 2`, surface `15 16 17`, accent `94 106 210`)

### Requirement: No theme switcher or theme context
The client SHALL NOT include a theme switcher control or a `ThemeProvider` /
`useTheme` API. The header SHALL NOT render a theme toggle button.

## MODIFIED Requirements

### Requirement: Header contains no theme switcher
The header previously rendered a theme switcher button; it SHALL NOT anymore.
The header still shows nav links, the avatar, and logout.

### Requirement: Semantic tokens remain the single source of colors
The `--color-*` tokens defined on `:root` continue to drive all utility
classes (`bg-surface`, `text-text`, `border-border`, `bg-accent`, etc.); only
the number of palettes is reduced to one.
