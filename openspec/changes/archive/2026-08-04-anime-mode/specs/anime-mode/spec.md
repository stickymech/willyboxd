## ADDED Requirements

### Requirement: Anime classification in search
The server SHALL support an `anime` query parameter on the film search endpoint. When `anime=1`, results SHALL be filtered to titles whose original language is Japanese (`ja`). When absent or `0`, behavior SHALL be unchanged.

#### Scenario: Anime-filtered search
- **WHEN** a client requests `/films/search?q=naruto&anime=1`
- **THEN** the response contains only results with `original_language` equal to `ja`

#### Scenario: Unfiltered search is unchanged
- **WHEN** a client requests `/films/search?q=naruto` without the anime parameter
- **THEN** the response is the same as before this change (all media types, any language)

### Requirement: Anime browse endpoint
The server SHALL provide a `/films/anime` endpoint that returns anime titles suitable for browsing, sourced from TMDB's anime keyword, with movie and TV results merged and de-duplicated by id.

#### Scenario: Trending anime
- **WHEN** a client requests `/films/anime?time=week`
- **THEN** the response contains a list of anime media items with no duplicate ids across movie and TV sources

#### Scenario: Defaults
- **WHEN** a client requests `/films/anime` with no query parameters
- **THEN** the response uses the default time window (week) and page 1

### Requirement: original_language on MediaItem
The shared `MediaItem` type SHALL expose `original_language` as a nullable string. Live search and browse results SHALL populate it from TMDB.

#### Scenario: Search results carry original language
- **WHEN** a client receives search results
- **THEN** each result includes an `original_language` field populated from TMDB (e.g. `ja` for anime)

#### Scenario: Persisted items tolerate null
- **WHEN** a DB-backed `MediaItem` (diary/watchlist/list) is rendered
- **THEN** it renders correctly with `original_language` null, since the field is not persisted

### Requirement: Anime toggle on the Search page
The Search page SHALL provide an Anime toggle that, when enabled, requests anime-filtered results and reflects the filter in the URL query string so it survives reload.

#### Scenario: Toggling anime on
- **WHEN** a user enables the Anime toggle and runs a search
- **THEN** the request includes `anime=1` and the URL contains `anime=1`

#### Scenario: Toggle persists across reload
- **WHEN** a user searches with the Anime toggle enabled and reloads the page
- **THEN** the toggle remains enabled and the search stays anime-filtered

### Requirement: Anime sections on the Home page
The Home page SHALL render a "Trending Anime" section and a "Top Anime" section, each populated from the anime browse endpoint and presented with the standard film card grid.

#### Scenario: Trending Anime section renders
- **WHEN** a user visits the Home page
- **THEN** a "Trending Anime" section appears populated with anime film cards

#### Scenario: Top Anime section renders
- **WHEN** a user visits the Home page
- **THEN** a "Top Anime" section appears populated with anime film cards
