## Context

The `Stars` component renders 0.5-star fill increments, but the shared converters currently produce raw decimal values: `toStarRating` (0–10) divides by 2 (`8.4 → 4.2`) and `toHundredStarRating` (0–100) divides by 20 (`79 → 3.95`). These decimals are invisible without hover (the numeric value is only in the `aria-label`/`title`), easy to misread, and inconsistent with the half-star visual granularity. A title with `vote_count: 0` and no critic/IMDb ratings still renders a misleading empty 0-star row.

## Goals / Non-Goals

**Goals:**
- Round every aggregate score to the nearest half-star on the canonical 0.5–5 scale.
- Show a human-readable `N/5` label beside each hero star row and on film-card badges.
- Replace the empty 0-star row with a "No ratings available yet." note when no score data exists.
- Keep the API shape unchanged; this is purely presentation/shared-utility work.

**Non-Goals:**
- No changes to raw values returned by the API (`vote_average`, `imdb_rating`, `rt_rating`, `metacritic_rating` stay raw).
- No changes to the `Stars` component itself.
- No rounding changes to the review-section stars (a review's own TMDB rating is a single person's rating, rounded by `Stars` fill anyway).

## Decisions

**Decision 1: Round in the shared converters, not at render.**
`toStarRating(value)` becomes `Math.round(value) / 2` and `toHundredStarRating(value)` becomes `Math.round(value / 10) / 2`. Rationale: every caller (`FilmDetail` hero, `FilmCard` badge, tests) then sees the same canonical value; rounding once in the shared layer keeps the app's star scale uniform. Alternative — round inside `Stars` — was rejected because `Stars` also renders review rows where per-review ratings are intentionally fine-grained, and `Stars` can't know the intended scale without extra props.

**Decision 2: A dedicated `formatScore` label formatter.**
`formatScore(value)` renders a 0–5 value as `N/5`, trimming the trailing `.0` (`4 → "4/5"`, `4.5 → "4.5/5"`, `5 → "5/5"`). It re-rounds defensively to the nearest half-star so callers can pass either a raw converted value or an already-rounded one. It's shared, so cards and hero labels can't drift apart.

**Decision 3: "No ratings available yet." derived from all score fields.**
`hasAnyScore = vote_count > 0 || imdb_rating !== null || rt_rating !== null || metacritic_rating !== null`. The hero shows the note only when `!hasAnyScore`. This preserves the trailer-branch behavior of hiding the 0-star row (already folded into `vote_count > 0` for the TMDB line) and generalizes it across all sources.

## Risks / Trade-offs

- Rounding loses precision (e.g. IMDb 8.6 and 8.7 both show `4.5/5`) → Acceptable: the half-star is the app's canonical visual unit, and the label makes the value explicit.
- `Math.round()` bankers-rounding edge at exactly `.5` (e.g. 8.5 → `Math.round(8.5) = 9` → `4.5`)? `Math.round` rounds `.5` up per ECMAScript, giving `4.5` for 8.5 — consistent with half-star intent. Verified in tests.
- The no-ratings note depends on `vote_count`, which landed in the `embedded-trailers` change → this branch is stacked on `embedded-trailers`; merge ordering must preserve that dependency.