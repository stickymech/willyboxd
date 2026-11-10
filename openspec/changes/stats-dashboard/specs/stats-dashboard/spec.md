## ADDED Requirements

### Requirement: Stats endpoint returns aggregate per-user statistics

The `GET /api/stats` endpoint SHALL require authentication and SHALL return `{ stats: StatsOverview }` computed only from the authenticated user's diary entries: total entries, distinct films, total minutes from movie runtimes, average rating across rated entries, top genres (up to 8, ordered by count descending then name), entries per year (from release or first-air date), and entries per decade (derived from years). A user with no entries SHALL receive a zeroed overview with empty collections.

#### Scenario: Stats computed for a user with entries

- **WHEN** an authenticated user with two movie entries (120 + 100 minutes, rated 4 and 3, released 1999 and 2015) requests `/api/stats`
- **THEN** the response contains `total_watched: 2`, `total_films: 2`, `total_minutes: 220`, `average_rating: 3.5`, genres aggregated across both films, `years` ordered newest first, and `decades` derived from those years

#### Scenario: Stats zeroed for a new user

- **WHEN** an authenticated user with no diary entries requests `/api/stats`
- **THEN** the response contains all-zero totals and empty `genres`, `years`, and `decades` arrays

#### Scenario: Stats isolated per user

- **WHEN** user B requests `/api/stats`
- **THEN** entries logged by user A do not appear in B's stats

#### Scenario: Unauthenticated request

- **WHEN** a request without a valid session hits `/api/stats`
- **THEN** the server responds `401`

### Requirement: Stats page renders the overview

The client `/stats` route SHALL fetch `/api/stats` for the signed-in user and render: films, entries, hours (from `formatMinutes`), and average rating (Stars + `N/5` label) as summary cards, plus bar charts for top genres, years, and decades. The page SHALL show a "log your first film" empty state when `total_watched` is 0, an inline error with retry on failure, and a sign-in prompt when logged out.

#### Scenario: Page renders for a user with data

- **WHEN** a signed-in user with stats visits `/stats`
- **THEN** the summary cards show the totals and the genre/year/decade charts render with the returned data

#### Scenario: Empty state

- **WHEN** a signed-in user with no entries visits `/stats`
- **THEN** the page shows the "log your first film" prompt instead of charts

#### Scenario: Fetch failure

- **WHEN** the stats request fails
- **THEN** the page shows an inline error with a retry button
