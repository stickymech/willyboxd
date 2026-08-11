# critic-scorecards Specification

## Purpose
The film/TV detail page shows Rotten Tomatoes and Metacritic aggregate scorecards alongside the existing TMDB and IMDb ratings, each normalized onto the app's canonical 0.5–5 star scale. Scores come from the same OMDB call already used for IMDb; missing key, upstream outage, or an absent source never breaks the detail page and simply renders no scorecard.

## Requirements
### Requirement: Film detail API returns RT and Metacritic ratings
The `GET /api/films/:id?type=movie|tv` endpoint SHALL return `rt_rating` (nullable number, raw 0–100) and `metacritic_rating` (nullable number, raw 0–100) alongside the existing `imdb_rating`, parsed from the title's OMDB `Ratings` array (Rotten Tomatoes `"79%"`, Metacritic `"66/100"`). Each SHALL be `null` when the source is absent, OMDB is unreachable, or the API key is unset.

#### Scenario: Title with all three sources
- **WHEN** a client requests `/api/films/550?type=movie` and OMDB reports `imdbRating`, Rotten Tomatoes `79%`, and Metacritic `66/100`
- **THEN** the response includes `imdb_rating: 8.8`, `rt_rating: 79`, and `metacritic_rating: 66`

#### Scenario: A source is missing
- **WHEN** OMDB reports no Rotten Tomatoes or Metacritic value for the title
- **THEN** the response includes `rt_rating: null` and/or `metacritic_rating: null`

#### Scenario: OMDB lookup fails or key is unset
- **WHEN** `OMDB_API_KEY` is not configured or the OMDB request fails
- **THEN** the detail request still succeeds with `imdb_rating`, `rt_rating`, and `metacritic_rating` all `null`

### Requirement: Detail page renders critic scorecards on the app's scale
The film/TV detail page SHALL render a labeled Rotten Tomatoes scorecard and a labeled Metacritic scorecard using the `Stars` component, each normalized onto the app's canonical 0.5–5 star scale (raw 0–100 divided by 20), with no raw numeric score shown. A scorecard SHALL be rendered only when its corresponding rating is present.

#### Scenario: RT and Metacritic ratings present
- **WHEN** the film detail response has `rt_rating: 79` and `metacritic_rating: 66`
- **THEN** the hero renders a labeled RT line with `Stars` showing 3.95 and a labeled Metacritic line with `Stars` showing 3.3

#### Scenario: A critic source is absent
- **WHEN** the film detail response has `rt_rating: null`
- **THEN** the hero renders no Rotten Tomatoes scorecard
