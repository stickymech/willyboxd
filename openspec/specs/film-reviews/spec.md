# film-reviews Specification

## Purpose
The film/TV detail page shows community reviews for a title sourced from TMDB, with author, avatar, star rating, expandable content, and an outbound link to the source. The aggregate score renders on the app's canonical 0.5–5 star scale. Reviews are non-fatal: when TMDB reviews are unavailable, the rest of the detail page still loads.

## Requirements
### Requirement: Film detail API returns reviews
The `GET /api/films/:id?type=movie|tv` endpoint SHALL return a `reviews` array alongside the existing film detail, where each entry includes the review author, optional avatar path, optional TMDB rating (0–10), content, source URL, and creation date. The array SHALL be empty when the title has no reviews, capped at the 5 most recent.

#### Scenario: Movie with reviews
- **WHEN** a client requests `/api/films/550?type=movie`
- **THEN** the response includes a `reviews` array with review objects containing `author`, `content`, `url`, and `created_at`

#### Scenario: TV series with reviews
- **WHEN** a client requests `/api/films/1399?type=tv`
- **THEN** the response includes a `reviews` array sourced from the TV reviews endpoint

#### Scenario: No reviews exist
- **WHEN** a title has no reviews on TMDB
- **THEN** the response includes an empty `reviews` array

#### Scenario: Reviews endpoint fails
- **WHEN** the TMDB reviews request fails or is unavailable
- **THEN** the detail response still succeeds with an empty `reviews` array

### Requirement: Detail page renders a Reviews section
The film/TV detail page SHALL render a "Reviews" section showing each review's author (with avatar when available), star rating converted from the TMDB 0–10 scale, a collapsed content snippet that expands on demand, and a "Read review" link opening the review source in a new tab.

#### Scenario: Reviews are present
- **WHEN** the film detail response contains reviews
- **THEN** the page renders a Reviews section with an entry per review showing author, stars, content, and an outbound "Read review" link

#### Scenario: Author avatar unavailable
- **WHEN** a review has no usable avatar path
- **THEN** the review renders an initial-letter placeholder instead of a broken image

#### Scenario: Review has no rating
- **WHEN** a review has a `null` TMDB rating
- **THEN** the review renders without a star rating

#### Scenario: No reviews to show
- **WHEN** the film detail response has an empty `reviews` array
- **THEN** the page renders no Reviews section

### Requirement: Detail page handles film query errors
The film/TV detail page SHALL render an error state with a retry action when the detail query fails, rather than an infinite loading state.

#### Scenario: Film query fails
- **WHEN** the film detail query errors
- **THEN** the page renders the error message and a "Try again" control that refetches

### Requirement: Hero shows the aggregate score on the app's scale
The detail page hero SHALL display the TMDB aggregate score on the app's canonical 0.5–5 star scale using the same `Stars` component used elsewhere, with no raw numeric score shown.

#### Scenario: Hero score renders
- **WHEN** the film detail response loads
- **THEN** the hero renders the aggregate via `Stars` (score divided by 2), with no out-of-10 number displayed
