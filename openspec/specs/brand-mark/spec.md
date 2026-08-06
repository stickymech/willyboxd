# brand-mark Specification

## Purpose
TBD - created by archiving change brand-mark-v3. Update Purpose after archive.
## Requirements
### Requirement: Brand mark is a Letterboxd-style trio of discs containing rockets
The Willyboxd brand mark SHALL be the approved design: three overlapping discs — orange `#F57C00`, green `#44C553`, blue `#29B6F6` — arranged diagonally on a 240×120 viewBox, each disc containing an upright phallic rocket silhouette (domed-tip capsule, no fins) in brand ink `#0F172A` with a white window.

#### Scenario: Three discs rendered
- **WHEN** the brand mark is rendered
- **THEN** the SVG contains three overlapping coloured discs in the approved arrangement, each containing a rocket silhouette

### Requirement: Fixed orange/green/blue palette, theme-agnostic
The mark SHALL render its three discs in orange `#F57C00`, green `#44C553`, and blue `#29B6F6` with ink `#0F172A` rocket silhouettes. The mark SHALL be theme-agnostic: it MUST NOT depend on the accent token, and SHALL remain legible on the app's dark surfaces.

#### Scenario: Fixed colours regardless of surface
- **WHEN** the mark is shown on a dark surface
- **THEN** the three discs are orange, green, and blue, unchanged

### Requirement: Transparent on dark in-app; dark tile for static assets
The in-app brand mark SHALL be transparent, with the coloured discs and rockets placed directly on the dark surface. Static brand assets (favicon, launcher tiles, OG image) SHALL place the discs on a dark ink `#0F172A` background.

#### Scenario: Header mark is transparent
- **WHEN** the header renders the brand mark
- **THEN** the mark has no background; the discs and rockets show directly on the dark header surface

#### Scenario: Favicon uses a dark tile
- **WHEN** the favicon is served
- **THEN** it shows the three discs on a dark ink rounded-square tile

### Requirement: Title-bar brand block is `w-28`
The header brand mark SHALL be sized at `w-28 h-14` (112×56) with a `text-5xl` wordmark in an `h-20` header.

#### Scenario: Header displays the brand block
- **WHEN** the app header renders
- **THEN** the brand mark has the `w-28 h-14` size class and the wordmark is `text-5xl`

### Requirement: Static brand assets match the new mark
All static brand assets SHALL use the disc-trio geometry: `favicon.svg`, `mark-tile.svg`, `apple-touch-icon.svg`, `og.svg`, and the generated PNGs `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, and `og.png`.

#### Scenario: PNG assets regenerated from the disc-trio geometry
- **WHEN** the icon generation script runs
- **THEN** it produces the PNGs with the three-disc mark at the correct sizes

### Requirement: Mark is decorative and accessible
The mark SHALL be marked decorative (`aria-hidden="true"`, `focusable="false"`) — the "Willyboxd" wordmark carries the name.

#### Scenario: Assistive technology ignores the mark
- **WHEN** the brand mark is rendered
- **THEN** it is hidden from assistive technology and not focusable
