## ADDED Requirements

### Requirement: Brand mark is the three-rocket trio
The Willyboxd brand mark SHALL be the approved three-rocket design: three rockets (rounded capsule body with side fins, a bottom nozzle, and a white nose window) arranged in a row on a 240×120 viewBox, with the left rocket rotated −18°, the centre rocket vertical, and the right rocket rotated +18°.

#### Scenario: Three rockets rendered
- **WHEN** the brand mark is rendered
- **THEN** the SVG contains three rocket instances in the approved arrangement (outer two rotated ±18°)

### Requirement: Fixed orange/green/blue palette, theme-agnostic
The mark SHALL render its three rockets in orange `#F57C00`, green `#44C553`, and blue `#29B6F6`. The mark SHALL be theme-agnostic: it MUST NOT depend on the runtime theme's accent token, and SHALL remain legible on all four dark runtime themes.

#### Scenario: Fixed colours regardless of theme
- **WHEN** the mark is shown on any of the four runtime themes
- **THEN** the three rockets are orange, green, and blue, unchanged across themes

### Requirement: Transparent on dark in-app; dark tile for static assets
The in-app brand mark SHALL be transparent, with the coloured rockets placed directly on the dark surface. Static brand assets (favicon, launcher tiles, OG image) SHALL place the rockets on a dark ink `#0F172A` background.

#### Scenario: Header mark is transparent
- **WHEN** the header renders the brand mark
- **THEN** the mark has no background; the rockets show directly on the dark header surface

#### Scenario: Favicon uses a dark tile
- **WHEN** the favicon is served
- **THEN** it shows the three rockets on a dark ink rounded-square tile

### Requirement: Title-bar mark is 40px
The header brand mark SHALL be sized at 40px width (`w-10`), larger than the previous 28px mark.

#### Scenario: Header displays the enlarged mark
- **WHEN** the app header renders
- **THEN** the brand mark has the `w-10` size class

### Requirement: Static brand assets match the new mark
All static brand assets SHALL use the three-rocket geometry: `favicon.svg`, `mark-tile.svg`, `apple-touch-icon.svg`, `og.svg`, and the generated PNGs `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, and `og.png`.

#### Scenario: PNG assets regenerated from the rocket geometry
- **WHEN** the icon generation script runs
- **THEN** it produces the PNGs with the three-rocket mark at the correct sizes

### Requirement: Mark is decorative and accessible
The mark SHALL be marked decorative (`aria-hidden="true"`, `focusable="false"`) — the "Willyboxd" wordmark carries the name.

#### Scenario: Assistive technology ignores the mark
- **WHEN** the brand mark is rendered
- **THEN** it is hidden from assistive technology and not focusable
