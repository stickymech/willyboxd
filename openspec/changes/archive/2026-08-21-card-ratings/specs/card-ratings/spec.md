## ADDED Requirements

### Requirement: Bulk ratings endpoint returns cached IMDb/RT/Metacritic ratings

The `GET /api/films/ratings?ids=550:movie,157336:tv` endpoint SHALL accept up to 10 comma-separated `tmdbId:type` pairs and SHALL return `{ ratings: { [tmdbId]: { imdb_id, imdb_rating, rt_rating, metacritic_rating } } }` for each requested title, omitting any null fields. Ratings SHALL resolve from the persisted `films` columns or the `film_ratings` cache table, SHALL fall back to a live TMDB `external_ids` + OMDB lookup that is stored in `film_ratings` for next time, and SHALL be non-fatal: upstream failure or missing data simply omits the entry. The endpoint SHALL be registered before `GET /films/:id` so `:id` cannot capture `ratings`.

#### Scenario: Ratings resolve from cache

- **WHEN** a client requests `/api/films/ratings?ids=550:movie` and the title's IMDb/RT/Metacritic ratings are already stored in `films` or `film_ratings`
- **THEN** the response includes `{ ratings: { "550": { imdb_id, imdb_rating, rt_rating, metacritic_rating } } }`

#### Scenario: Ratings require a live lookup

- **WHEN** a client requests `/api/films/ratings?ids=550:movie` and no cached ratings exist for the title
- **THEN** the server fetches TMDB `external_ids` and OMDB ratings, stores them in `film_ratings`, and returns them in the response

#### Scenario: No ratings available

- **WHEN** a client requests `/api/films/ratings?ids=550:movie` and OMDB reports no ratings or the lookup fails
- **THEN** the response omits the title's entry for the unavailable fields and the request still succeeds

#### Scenario: Bulk request capped

- **WHEN** a client requests `/api/films/ratings` with more than 10 ids
- **THEN** the server enriches only the first 10 and ignores the remainder

#### Scenario: Route not shadowed by id parameter

- **WHEN** a client requests `/api/films/ratings?ids=...`
- **THEN** the request is handled by the ratings route, not the `:id` detail route

### Requirement: Films table persists rating fields

The `films` table SHALL persist `imdb_id`, `imdb_rating`, `rt_rating`, and `metacritic_rating` columns. Rows refreshed via `upsertFilm`/`persistFilmDetail` SHALL write the values present on the incoming film detail, while rating values unavailable SHALL remain `null`. The columns SHALL exist on fresh databases via table creation and SHALL be added idempotently to existing databases via guarded `ALTER TABLE` statements during migration.

#### Scenario: Fresh database

- **WHEN** the server initializes a new SQLite database
- **THEN** the `films` table includes `imdb_id`, `imdb_rating`, `rt_rating`, and `metacritic_rating` columns

#### Scenario: Existing database upgrade

- **WHEN** the server starts against a database created before the columns existed
- **THEN** the four `films` columns are added once and the upgrade is safe to re-run

#### Scenario: Film detail persists ratings

- **WHEN** a film is upserted from a `FilmDetail` that has `imdb_rating: 8.8`, `rt_rating: 79`, and `metacritic_rating: 66`
- **THEN** the stored `films` row holds those values

### Requirement: Card rating badge

The film card SHALL render a single corner badge on the app's canonical 0.5–5 half-star scale showing the best available score, chosen in priority order: TMDB `vote_average` (÷2), `imdb_rating` (÷2), `rt_rating` (÷20), `metacritic_rating` (÷20). Each candidate SHALL be rounded to the nearest half star via `toHalfStar`. The badge SHALL render the shared `Stars` control at the `xs` size so a half step appears as a half-filled 5th star (partial-fill, matching FilmDetail/Diary). The card SHALL render no badge when no score exists.

#### Scenario: TMDB rating present

- **WHEN** a film card has `vote_average: 8.5`
- **THEN** the badge renders a `Stars` control labeled `4.5 out of 5 stars` (half-filled 5th star)

#### Scenario: No TMDB rating, IMDb rating present

- **WHEN** a film card has `vote_average: 0` and `imdb_rating: 7.7`
- **THEN** the badge renders a `Stars` control for the normalized IMDb score (e.g. labeled `4 out of 5 stars`)

#### Scenario: No IMDb, RT rating present

- **WHEN** a film card has `vote_average: 0`, `imdb_rating: null`, and `rt_rating: 64`
- **THEN** the badge renders a `Stars` control for the normalized RT score (e.g. labeled `3 out of 5 stars`)

#### Scenario: Metacritic used only when others absent

- **WHEN** a film card has only `metacritic_rating: 66`
- **THEN** the badge renders a `Stars` control for the normalized Metacritic score (e.g. labeled `3.5 out of 5 stars`)

#### Scenario: No score at all

- **WHEN** a film card has `vote_average: 0` and all enriched ratings are `null`
- **THEN** the card renders no rating badge (no `Stars` control)

### Requirement: Client enriches scoreless cards from the ratings endpoint

The Home and Search routes SHALL collect the `tmdbId:type` ids of display items whose `vote_average` equals 0, request their ratings in a single non-blocking query to `/api/films/ratings`, merge the returned ratings into each display item, and render the resulting enriched card. A failed or empty ratings response SHALL leave the cards unchanged (scoreless) and SHALL not break the page.

#### Scenario: Scoreless cards enriched

- **WHEN** Home results contain a titled with `vote_average: 0` and `/api/films/ratings` returns its ratings
- **THEN** the card for that title renders a badge built from the returned ratings

#### Scenario: Ratings request fails

- **WHEN** the `/api/films/ratings` request for scoreless cards fails
- **THEN** the cards render without badges and the page remains functional