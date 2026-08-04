# theming Specification

## Purpose
TBD - created by archiving change theme-system. Update Purpose after archive.
## Requirements
### Requirement: Semantic design tokens
The client SHALL define a set of semantic design tokens, each with a stable name, and SHALL map Tailwind color utilities to those tokens so that components reference tokens rather than concrete palette values. The token set SHALL include `bg`, `surface`, `surface-2`, `border`, `text`, `text-muted`, `text-subtle`, `accent`, `accent-hover`, `accent-contrast`, `error`, `radius-*`, and `shadow-card`.

#### Scenario: Tailwind utilities resolve tokens
- **WHEN** a component uses a token-based utility such as `bg-bg`, `bg-surface`, `text-text-muted`, or `bg-accent`
- **THEN** the rendered color is determined by the active theme's token value

#### Scenario: Opacity modifiers still work
- **WHEN** a component uses a token utility with an opacity modifier such as `bg-surface/50`
- **THEN** the rendered color applies the modifier against the token value

### Requirement: Four switchable themes
The client SHALL ship four themes, each defining values for every semantic token: Classic Amber (default), Spotify, Runway, and Linear. Each theme SHALL be selectable via a `data-theme` attribute on the root element.

#### Scenario: Classic Amber is the default palette
- **WHEN** no theme selection has been made
- **THEN** the active palette is Classic Amber and the app matches the pre-theme visual identity (dark slate background, amber accent)

#### Scenario: Each theme overrides all tokens
- **WHEN** `data-theme` is set to `spotify`, `runway`, or `linear`
- **THEN** every token-backed utility renders with that theme's defined values

### Requirement: Accent restraint for Spotify and Runway
The Spotify and Runway themes SHALL use the accent token for functional elements only (calls-to-action, links, and active states), keeping visual emphasis restrained.

#### Scenario: Accent used functionally
- **WHEN** the Spotify or Runway theme is active
- **THEN** accent-colored elements are limited to functional UI (CTAs, links, active states) rather than decorative surfaces

