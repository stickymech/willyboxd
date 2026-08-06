# theme-application Specification

## Purpose
Semantic token utilities render every screen; the app uses a single fixed Linear palette, so "theme-aware" means resolving against the Linear tokens.

## Requirements
### Requirement: Screens use semantic tokens
All client routes and shared components SHALL render using semantic token utilities instead of hardcoded palette classes. The routes are `Home`, `Search`, `Login`, `Register`, `FilmDetail`, `Diary`, and `Watchlist`; the components are `Header`, `FilmCard`, and `RatingSelect`.

#### Scenario: No hardcoded palette classes remain
- **WHEN** the client source is searched for `slate-` and `amber-` utility classes
- **THEN** no decorative hardcoded palette utilities remain in routes and shared components (only token-based utilities)

#### Scenario: Styling resolves the single palette
- **WHEN** a screen or component renders
- **THEN** its colors resolve against the Linear tokens on `:root`

### Requirement: Shared button and rating styles are theme-aware
The `.btn-primary`, `.btn-secondary`, and `.rating-star` component styles SHALL derive their colors from semantic tokens.

#### Scenario: Buttons use tokens
- **WHEN** a `.btn-primary` or `.btn-secondary` renders
- **THEN** its colors come from the semantic tokens (accent, accent-hover, accent-contrast, surface)

#### Scenario: Rating stars use tokens
- **WHEN** a `.rating-star` renders
- **THEN** its color comes from the accent token

### Requirement: Brand rendered once
The "Willyboxd" brand SHALL render in the Header only. The Home route SHALL NOT duplicate the brand heading.

#### Scenario: Home shows no duplicate brand
- **WHEN** the Home route renders
- **THEN** it does not contain a standalone `Willyboxd` `<h1>` heading

#### Scenario: Header shows the brand
- **WHEN** any route renders the Header
- **THEN** the Header displays the `Willyboxd` brand

