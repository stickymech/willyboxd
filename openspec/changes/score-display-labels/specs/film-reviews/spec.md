# film-reviews Delta Spec

## MODIFIED Requirements

### Requirement: Hero shows the aggregate score on the app's scale
The detail page hero SHALL display the TMDB aggregate score on the app's canonical 0.5–5 star scale using the same `Stars` component used elsewhere, with the normalized value labeled beside the stars (e.g. `4/5`) and no raw 0–10 number shown.

#### Scenario: Hero score renders
- **WHEN** the film detail response loads
- **THEN** the hero renders the aggregate via `Stars` (score divided by 2 and rounded to the nearest half-star) with a numeric `N/5` label, showing no out-of-10 number

## ADDED Requirements

### Requirement: Hero shows a no-ratings note when no score data exists
The detail page hero SHALL render a "No ratings available yet." note in place of any star row when the title has no aggregate score data at all — `vote_count` of 0 and `imdb_rating`, `rt_rating`, and `metacritic_rating` all `null`.

#### Scenario: No score data at all
- **WHEN** the film detail response has `vote_count: 0` and `imdb_rating`, `rt_rating`, and `metacritic_rating` all `null`
- **THEN** the hero renders a "No ratings available yet." note and no empty star row

#### Scenario: Some score data exists
- **WHEN** the film detail response has a non-null rating or `vote_count > 0`
- **THEN** the hero renders the relevant star rows and no "No ratings available yet." note
