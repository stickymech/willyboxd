# theme-application Specification

## Purpose
TBD - created by archiving change theme-system. Update Purpose after archive.
## Requirements
### Requirement: Screens use semantic tokens
All client routes and shared components SHALL render using semantic token utilities instead of hardcoded palette classes. The routes are `Home`, `Search`, `Login`, `Register`, `FilmDetail`, `Diary`, and `Watchlist`; the components are `Header`, `FilmCard`, and `RatingSelect`.

#### Scenario: No hardcoded palette classes remain
- **WHEN** the client source is searched for `slate-` and `amber-` utility classes
- **THEN** no decorative hardcoded palette utilities remain in routes and shared components (only token-based utilities)

#### Scenario: Styling survives a theme switch
- **WHEN** the active theme changes
- **THEN** screens and components restyle consistently with the new theme's tokens

### Requirement: Shared button and rating styles are theme-aware
The `.btn-primary`, `.btn-secondary`, and `.rating-star` component styles SHALL derive their colors from semantic tokens.

#### Scenario: Buttons follow the theme
- **WHEN** a `.btn-primary` or `.btn-secondary` renders under a given theme
- **THEN** its colors come from that theme's tokens (accent, accent-hover, accent-contrast, surface)

#### Scenario: Rating stars follow the theme
- **WHEN** a `.rating-star` renders under a given theme
- **THEN** its color comes from the active theme's accent token

### Requirement: Brand rendered once
The "Willyboxd" brand SHALL render in the Header only. The Home route SHALL NOT duplicate the brand heading.

#### Scenario: Home shows no duplicate brand
- **WHEN** the Home route renders
- **THEN** it does not contain a standalone `Willyboxd` `<h1>` heading

#### Scenario: Header shows the brand
- **WHEN** any route renders the Header
- **THEN** the Header displays the `Willyboxd` brand

