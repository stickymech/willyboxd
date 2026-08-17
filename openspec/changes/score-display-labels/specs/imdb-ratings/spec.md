# imdb-ratings Delta Spec

## MODIFIED Requirements

### Requirement: Detail page renders the IMDb rating on the app's scale
The film/TV detail page SHALL render the IMDb aggregate using the `Stars` component on the app's canonical 0.5–5 star scale (rating divided by 2 and rounded to the nearest half-star), with the normalized value labeled beside the stars (e.g. `4.5/5`), only when `imdb_rating` is present.

#### Scenario: IMDb rating present
- **WHEN** the film detail response has a non-null `imdb_rating`
- **THEN** the hero renders a labeled IMDb line with `Stars` showing the rating divided by 2 and rounded to the nearest half-star, plus a numeric label (e.g. `8.8` → `4.5/5`)

#### Scenario: IMDb rating absent
- **WHEN** the film detail response has `imdb_rating: null`
- **THEN** the hero renders no IMDb line
