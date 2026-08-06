# universal-search Specification

## Purpose
Search is a universal tool reachable from every page via a header search box with a live, keyboard-friendly dropdown of top matches. The results page shows any-language, any-genre matches with no anime filter (anime discovery stays curated on Home). Watchlist and Diary provide client-side filters over the user's own entries.

## Requirements
### Requirement: Header search box on every page
The header SHALL render a search box on every page. Submitting the box SHALL navigate to the search results page with the query in the URL (`/search?q=<query>`).

#### Scenario: searching from the header navigates to results
- **WHEN** a user types a query in the header search box and submits
- **THEN** the app navigates to `/search?q=<query>` and shows the full results page

#### Scenario: search box is always available
- **WHEN** a user is on any page (Home, Diary, Watchlist, Settings, a film detail)
- **THEN** the header contains the search box

### Requirement: Live dropdown of top matches
While typing in the header search box, the client SHALL request top matches from the existing film search endpoint (debounced) and SHALL display them in a dropdown listing title, type (movie/tv), and year. The dropdown SHALL support keyboard navigation (arrow keys move the selection, Enter opens the selected match or the results page, Escape closes), SHALL close on outside click, and clicking a match SHALL navigate to that film's detail page.

#### Scenario: typing shows top matches
- **WHEN** a user types at least one character and pauses (debounce elapses)
- **THEN** a dropdown appears with the top matches from the film search endpoint

#### Scenario: keyboard navigation opens a match
- **WHEN** a user focuses the search box, types a query, presses ArrowDown to select a match, and presses Enter
- **THEN** the app navigates to that film's detail page

#### Scenario: Enter without a selection opens results
- **WHEN** a user types a query and presses Enter with no match selected
- **THEN** the app navigates to `/search?q=<query>`

#### Scenario: Escape or outside click closes the dropdown
- **WHEN** a user presses Escape or clicks outside the search box while the dropdown is open
- **THEN** the dropdown closes and no navigation occurs

#### Scenario: empty query shows no dropdown
- **WHEN** the search box is empty
- **THEN** no dropdown is shown

### Requirement: Universal, anime-unfiltered search results
The search results page SHALL show matches across all media types and languages. The client SHALL NOT offer an anime filter on search results, and search results SHALL NOT be filtered by `original_language`. Anime discovery SHALL remain on the Home page.

#### Scenario: search returns any-language results
- **WHEN** a user searches for a non-Japanese film or TV show
- **THEN** the results page shows matching titles regardless of `original_language`

#### Scenario: no anime toggle on results page
- **WHEN** a user visits the search results page
- **THEN** no "Anime only" toggle is present and results are not anime-filtered

### Requirement: Watchlist page filter
The Watchlist page SHALL provide a filter box that filters the displayed entries by film title client-side. An empty filter SHALL show all entries.

#### Scenario: filtering the watchlist by title
- **WHEN** a user types into the watchlist filter box
- **THEN** only entries whose film title matches the text are displayed

#### Scenario: clearing the watchlist filter
- **WHEN** a user clears the watchlist filter box
- **THEN** all watchlist entries are displayed again

### Requirement: Diary page filter
The Diary page SHALL provide a filter box that filters displayed entries client-side, matching the film title, any tag, or the review text. An empty filter SHALL show all entries.

#### Scenario: filtering the diary by title or tag or review
- **WHEN** a user types into the diary filter box
- **THEN** only entries whose film title, a tag, or the review text contains the text are displayed

#### Scenario: clearing the diary filter
- **WHEN** a user clears the diary filter box
- **THEN** all diary entries are displayed again
