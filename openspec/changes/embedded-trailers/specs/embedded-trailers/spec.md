## ADDED Requirements

### Requirement: Film detail API returns an optional trailer

The `GET /api/films/:id?type=movie|tv` endpoint SHALL return a `trailer` field on the film detail response. The field SHALL be `{ key: string, name: string | null }` when TMDB reports a YouTube video of type `Trailer` for the title, and SHALL be `null` when no such video exists or when the videos fetch fails. The trailer SHALL be derived from the TMDB `/movie|tv/{id}/videos` endpoint filtered to `site=YouTube` and `type=Trailer`, taking the first match.

#### Scenario: Movie with a YouTube trailer

- **WHEN** a client requests `/api/films/550?type=movie` and TMDB videos for the title include a YouTube video with `type: "Trailer"` and `key: "abc123"`
- **THEN** the response includes `trailer: { key: "abc123", name: <video name> }`

#### Scenario: Title with videos but no YouTube trailer

- **WHEN** a client requests `/api/films/:id` and TMDB videos for the title contain only teasers or non-YouTube videos
- **THEN** the response includes `trailer: null`

#### Scenario: Videos fetch fails

- **WHEN** the TMDB `/videos` request for a title fails
- **THEN** the detail request still succeeds and includes `trailer: null`

### Requirement: Detail page embeds the trailer when present

The film/TV detail page SHALL render an embedded YouTube player for the trailer when the film detail response includes a non-null `trailer`. The player SHALL load `https://www.youtube-nocookie.com/embed/<key>` and SHALL NOT be rendered when `trailer` is `null`. The player SHALL be positioned between the watchlist/diary section and the genres section so the hero backdrop remains unobscured.

#### Scenario: Trailer present

- **WHEN** the film detail response has `trailer: { key: "abc123", ... }`
- **THEN** the detail page renders an iframe whose `src` is `https://www.youtube-nocookie.com/embed/abc123`

#### Scenario: Trailer absent

- **WHEN** the film detail response has `trailer: null`
- **THEN** the detail page renders no video player
