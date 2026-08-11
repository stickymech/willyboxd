# review-source-label Specification

## Purpose
The film/TV detail page's review cards show a human-readable source label derived from the review URL, so users can see which site each review came from before clicking through. Known review sites map to friendly names; unknown hosts fall back to a readable hostname; a missing/unparseable URL renders no label.

## Requirements
### Requirement: Review cards render a human-readable source label
The film/TV detail page SHALL render a source label on each review card derived from the review's `url`, mapping known review-site hostnames to friendly names. When the URL is missing or its hostname cannot be derived, SHALL render no label.

#### Scenario: Review from a known site
- **WHEN** a review has `url: "https://www.themoviedb.org/review/abc123"`
- **THEN** the review card renders the label `TMDB`

#### Scenario: Review from another known site
- **WHEN** a review has `url: "https://www.imdb.com/review/abc123"`
- **THEN** the review card renders the label `IMDb`

#### Scenario: Review from an unknown host
- **WHEN** a review has `url: "https://www.example.co.uk/review/1"`
- **THEN** the review card renders the label `example.co.uk`

#### Scenario: Review URL is missing
- **WHEN** a review has an empty or unparseable `url`
- **THEN** the review card renders no source label
