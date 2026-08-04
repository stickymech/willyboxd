# brand-mark Specification

## Purpose
TBD - created by archiving change brand-identity. Update Purpose after archive.
## Requirements
### Requirement: Slate-box product mark
The client SHALL provide a product mark whose SVG geometry is the "slate box" design: a single bold, tall rounded box (the "box" in willyboxd) with two thick diagonal stripes across its top, clipped to the box shape. The mark SHALL read as a film clapperboard at a glance (diagonal-stripe band on a chunky slate) and SHALL NOT include a standing stick or straw-like element. The reference geometry SHALL be authored in a `64` viewBox centered horizontally: a rounded box (`rx` 7) at `x="18" y="10" width="28" height="44"` with two diagonal stripes (≈45°) clipped to it.

#### Scenario: Silhouette reads at tiny sizes
- **WHEN** the mark is rendered at 16px (favicon size)
- **THEN** the rounded box silhouette remains legible as a chunky slate with a visible stripe band, with no straw-like protrusion above the box

#### Scenario: Stripes are clipped to the box
- **WHEN** the mark is rendered at any size
- **THEN** the two diagonal stripes never extend outside the box shape

### Requirement: Fixed brand palette
The mark SHALL define a theme-agnostic brand palette for static assets: brand amber `#EAB308` and brand ink `#0F172A`. Static brand assets (favicon tile, launcher icons, apple-touch-icon, social image) SHALL use these fixed colors rather than runtime theme tokens, so they render identically regardless of the active theme.

#### Scenario: Static assets ignore runtime theme
- **WHEN** any theme (amber, spotify, runway, linear) is active
- **THEN** the favicon, launcher icons, and social image render with the same fixed amber/ink palette

### Requirement: Monochrome currentColor in-app variant
The client SHALL render the in-app mark using `currentColor` so it inherits the active theme's accent token, with the box's stripes knocked out using the `--color-bg` token. The in-app mark SHALL be intended for placement on `bg` surfaces only.

#### Scenario: Header mark follows active theme accent
- **WHEN** the theme changes from amber to spotify, runway, or linear
- **THEN** the in-app mark's box renders in the new theme's accent color

#### Scenario: Stripes knocked out on bg surfaces
- **WHEN** the in-app mark is placed on a `bg` surface
- **THEN** the box's stripes render as the surrounding background color

### Requirement: Mark accessibility
The in-app mark SHALL be decorative: the SVG SHALL set `aria-hidden="true"` and `focusable="false"`, and the mark SHALL NOT contain text or require an accessible name of its own (the adjacent wordmark provides the product name).

#### Scenario: Screen readers ignore the mark
- **WHEN** a screen reader encounters the header brand
- **THEN** it reads the "Willyboxd" wordmark and does not announce the decorative icon

