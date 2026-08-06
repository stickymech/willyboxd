# brand-surfaces Specification

## Purpose
TBD - created by archiving change brand-identity. Update Purpose after archive.
## Requirements
### Requirement: Favicon
The client SHALL ship an SVG favicon (an ink `#0F172A` rounded-square tile with the disc-trio mark) and SHALL reference it from `index.html` via a `rel="icon"` link. The favicon SHALL resolve without a build step.

#### Scenario: Browser tab shows the mark
- **WHEN** the client is loaded in a browser
- **THEN** the tab renders the favicon (the disc-trio mark on a dark ink tile) at /favicon.svg

### Requirement: Header logo
The client SHALL render the in-app mark beside the "Willyboxd" wordmark in the site header, with the mark sized at `w-28 h-14`, rendered transparent and theme-agnostic (it MUST NOT inherit the accent token). The header brand link SHALL continue to navigate to the home route.

#### Scenario: Header brand includes the mark
- **WHEN** the header renders
- **THEN** the brand link shows the transparent disc-trio mark adjacent to the wordmark, regardless of active theme

#### Scenario: Header brand navigates home
- **WHEN** the header brand link is clicked
- **THEN** the app navigates to the home route

### Requirement: Auth page branding
The client SHALL render the in-app mark on the login and register pages, sized `w-14`, rendered transparent and theme-agnostic (no accent inheritance).

#### Scenario: Login page shows the mark
- **WHEN** the login page renders
- **THEN** the transparent mark appears above the sign-in form in a fixed size

#### Scenario: Register page shows the mark
- **WHEN** the register page renders
- **THEN** the transparent mark appears above the registration form in a fixed size

### Requirement: PWA manifest and launcher icons
The client SHALL ship a `site.webmanifest` declaring name `Willyboxd`, `start_url` `/`, `display` `standalone`, `background_color` and `theme_color` `#0F172A`, and icon entries for 192x192 and 512x512 PNGs. The client SHALL ship an `apple-touch-icon.png` (180x180, full-bleed, no baked-in corner rounding). `index.html` SHALL reference the manifest and apple-touch-icon.

#### Scenario: Manifest is linked
- **WHEN** a browser requests the manifest
- **THEN** /site.webmanifest resolves and references icon-192.png and icon-512.png

#### Scenario: Launcher icons exist
- **WHEN** a device installs the app or requests icons
- **THEN** icon-192.png, icon-512.png, and apple-touch-icon.png resolve at the declared dimensions

### Requirement: Social and browser chrome metadata
`index.html` SHALL include an Open Graph block (`og:type` website, `og:title` Willyboxd, `og:description` a short app description, `og:image` the social image) and a `theme-color` meta with the brand ink. The social image SHALL be a 1200x630 PNG showing the brand tile mark and the wordmark.

#### Scenario: OG metadata present
- **WHEN** a social scraper or crawler reads the page head
- **THEN** it finds og:title, og:description, og:type, and og:image pointing at the social image

#### Scenario: theme-color present
- **WHEN** the page head is rendered
- **THEN** a theme-color meta with brand ink is present for browser chrome tinting

### Requirement: Reproducible asset generation
The client SHALL include a committed generation script that regenerates the PNG assets (icon-192, icon-512, apple-touch-icon, social image) from the SVG masters. The script SHALL be a developer-only, macOS-only helper written in Pillow (`scripts/make-icons.py` invoked by `scripts/generate-icons.sh`), SHALL run without new dependencies, SHALL NOT use `qlmanage` (which mis-scales viewBox SVGs and mangles clip-path), and SHALL verify output dimensions with `sips` and pixel checks with PIL.

#### Scenario: Regenerating icons
- **WHEN** a developer runs the generation script on macOS
- **THEN** the PNG assets are regenerated from the SVG masters at the expected dimensions (icon-192.png 192×192, icon-512.png 512×512, apple-touch-icon.png 180×180, og.png 1200×630)

