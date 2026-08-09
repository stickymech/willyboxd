# external-links Specification

## Purpose
The film/TV detail page shows outbound "View on IMDb" and "View on TMDB" links derived from existing film detail data (`imdb_id` and the TMDB title id/type). Links open in a new tab and are hidden when the target id is absent. No new upstream calls are made.

## ADDED Requirements

### Requirement: Detail page shows a View on IMDb link
The film/TV detail page SHALL render a "View on IMDb" link pointing to `https://www.imdb.com/title/<imdb_id>` whenever the film detail response includes a non-null `imdb_id`. The link SHALL open in a new tab with `rel="noreferrer"`. When `imdb_id` is null the link SHALL NOT be rendered.

#### Scenario: IMDb id present
- **WHEN** the film detail response has `imdb_id: "tt0137523"`
- **THEN** the detail page renders a "View on IMDb" link with href `https://www.imdb.com/title/tt0137523`, `target="_blank"` and `rel="noreferrer"`

#### Scenario: IMDb id absent
- **WHEN** the film detail response has `imdb_id: null`
- **THEN** the detail page renders no "View on IMDb" link

### Requirement: Detail page shows a View on TMDB link
The film/TV detail page SHALL render a "View on TMDB" link pointing to `https://www.themoviedb.org/<type>/<id>` where `<type>` is `movie` or `tv` and `<id>` is the TMDB title id. The link SHALL open in a new tab with `rel="noreferrer"`. The link SHALL always be rendered since the title id is always present in the detail payload.

#### Scenario: Movie detail
- **WHEN** the film detail response has `type: "movie"` and `id: 550`
- **THEN** the detail page renders a "View on TMDB" link with href `https://www.themoviedb.org/movie/550`, `target="_blank"` and `rel="noreferrer"`

#### Scenario: TV detail
- **WHEN** the film detail response has `type: "tv"` and `id: 123`
- **THEN** the detail page renders a "View on TMDB" link with href `https://www.themoviedb.org/tv/123`
