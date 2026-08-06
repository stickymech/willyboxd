# theming Specification

## Purpose
Semantic design tokens drive all colors. The app ships a single fixed palette (Linear) applied on `:root` — there is no runtime theme selection.

## Requirements
### Requirement: Semantic design tokens
The client SHALL define a set of semantic design tokens, each with a stable name, and SHALL map Tailwind color utilities to those tokens so that components reference tokens rather than concrete palette values. The token set SHALL include `bg`, `surface`, `surface-2`, `border`, `text`, `text-muted`, `text-subtle`, `accent`, `accent-hover`, `accent-contrast`, `error`, `radius-*`, and `shadow-card`.

#### Scenario: Tailwind utilities resolve tokens
- **WHEN** a component uses a token-based utility such as `bg-bg`, `bg-surface`, `text-text-muted`, or `bg-accent`
- **THEN** the rendered color is determined by the token value

#### Scenario: Opacity modifiers still work
- **WHEN** a component uses a token utility with an opacity modifier such as `bg-surface/50`
- **THEN** the rendered color applies the modifier against the token value

### Requirement: Single fixed palette
The client SHALL apply exactly one palette — Linear — defined on `:root`. The document SHALL NOT depend on any `data-theme` attribute, and there SHALL be no runtime theme selection.

#### Scenario: Linear is always active
- **WHEN** the app loads with no `data-theme` attribute on the root element
- **THEN** every token-backed utility renders with the Linear token values (bg `1 1 2`, surface `15 16 17`, accent `94 106 210`)

