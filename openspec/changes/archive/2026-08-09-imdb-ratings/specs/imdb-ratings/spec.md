# imdb-ratings Specification

## Purpose
The film/TV detail page shows the IMDb aggregate rating alongside the TMDB score, normalized onto the app's canonical 0.5–5 star scale via the same `÷2` conversion used for TMDB. The IMDb rating is non-fatal: missing key, upstream outage, or absent rating never breaks the detail page.

## ADDED Requirements

### Requirement: Film detail API returns IMDb rating
The `GET /api/films/:id?type=movie|tv` endpoint SHALL return `imdb_id` (nullable string) and `imdb_rating` (nullable number, raw 0–10) alongside the existing film detail, sourced from the title's IMDb rating via OMDB. The rating SHALL be `null` when unavailable.

#### Scenario: Movie with an IMDb rating
- **WHEN** a client requests `/api/films/550?type=movie` and the title has an IMDb rating
- **THEN** the response includes `imdb_id` (e.g. `"tt0137523"`) and `imdb_rating` (e.g. `8.8`)

#### Scenario: Title has no IMDb rating
- **WHEN** the title has no IMDb rating or OMDB reports `imdbRating` as `N/A`
- **THEN** the response includes `imdb_rating: null`

#### Scenario: OMDB API key is unset
- **WHEN** `OMDB_API_KEY` is not configured
- **THEN** the detail request still succeeds with `imdb_rating: null`

#### Scenario: OMDB lookup fails
- **WHEN** the OMDB request fails or is unreachable
- **THEN** the detail response still succeeds with `imdb_rating: null`

### Requirement: Detail page renders the IMDb rating on the app's scale
The film/TV detail page SHALL render the IMDb aggregate using the `Stars` component on the app's canonical 0.5–5 star scale (rating divided by 2) with no raw numeric score shown, only when `imdb_rating` is present.

#### Scenario: IMDb rating present
- **WHEN** the film detail response has a non-null `imdb_rating`
- **THEN** the hero renders a labeled IMDb line with `Stars` showing the rating divided by 2

#### Scenario: IMDb rating absent
- **WHEN** the film detail response has `imdb_rating: null`
- **THEN** the hero renders no IMDb line
