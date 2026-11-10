# critic-scorecards Delta Spec

## MODIFIED Requirements

### Requirement: Detail page renders critic scorecards on the app's scale
The film/TV detail page SHALL render a labeled Rotten Tomatoes scorecard and a labeled Metacritic scorecard using the `Stars` component, each normalized onto the app's canonical 0.5–5 star scale (raw 0–100 divided by 20 and rounded to the nearest half-star), with the normalized value labeled beside the stars (e.g. `4/5`). A scorecard SHALL be rendered only when its corresponding rating is present.

#### Scenario: RT and Metacritic ratings present
- **WHEN** the film detail response has `rt_rating: 79` and `metacritic_rating: 66`
- **THEN** the hero renders a labeled RT line with `Stars` showing 4 (label `4/5`) and a labeled Metacritic line with `Stars` showing 3.5 (label `3.5/5`)

#### Scenario: A critic source is absent
- **WHEN** the film detail response has `rt_rating: null`
- **THEN** the hero renders no Rotten Tomatoes scorecard
