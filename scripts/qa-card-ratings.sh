#!/usr/bin/env bash
# QA script for the card-ratings change (IMDb/RT/Metacritic badges on film cards).
#
# Runs automated (source/unit) checks and then prints the manual browser steps
# you must verify by eye. Designed for macOS.
#
#   Usage: ./scripts/qa-card-ratings.sh
#
# Prerequisites: npm install done, dev server running (see MANUAL section).
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

check() {
  if [ "$1" = "ok" ]; then
    echo "  ✓ PASS: $2"
    PASS=$((PASS + 1))
  else
    echo "  ✗ FAIL: $2"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== 1. Automated checks ==="

# Shared types carry the nullable rating fields on MediaItem.
SHARED_TYPES="$ROOT/packages/shared/src/types.ts"
if grep -q "imdb_rating: number | null" "$SHARED_TYPES" &&
   grep -q "rt_rating: number | null" "$SHARED_TYPES" &&
   grep -q "metacritic_rating: number | null" "$SHARED_TYPES" &&
   grep -q "imdb_id: string | null" "$SHARED_TYPES"; then
  check ok "MediaItem carries nullable imdb_id/imdb_rating/rt_rating/metacritic_rating"
else
  check no "MediaItem carries nullable imdb_id/imdb_rating/rt_rating/metacritic_rating"
fi

# Shared constants add toHalfStar rounding.
SHARED_CONSTANTS="$ROOT/packages/shared/src/constants.ts"
grep -q "Math.round(value \\* 2) / 2" "$SHARED_CONSTANTS" && check ok "toHalfStar rounds to nearest half star" || check no "toHalfStar rounds to nearest half star"

# Server persists rating fields (films columns + film_ratings cache).
DB_FILE="$ROOT/apps/server/src/db.ts"
if grep -q "film_ratings" "$DB_FILE" && grep -q "ALTER TABLE films ADD COLUMN" "$DB_FILE"; then
  check ok "db.ts creates film_ratings cache table and idempotent films column adds"
else
  check no "db.ts creates film_ratings cache table and idempotent films column adds"
fi

# enrichRatings resolves films row -> film_ratings -> live lookup.
FILMS_SERVICE="$ROOT/apps/server/src/services/films.ts"
grep -q "export async function enrichRatings" "$FILMS_SERVICE" && check ok "enrichRatings exported from films service" || check no "enrichRatings exported from films service"
grep -q "SELECT \* FROM film_ratings WHERE tmdb_id" "$FILMS_SERVICE" && check ok "enrichRatings consults film_ratings cache" || check no "enrichRatings consults film_ratings cache"
grep -q "getExternalIds" "$FILMS_SERVICE" && check ok "enrichRatings falls back to live external_ids lookup" || check no "enrichRatings falls back to live external_ids lookup"

# Bulk ratings route registered BEFORE /films/:id and capped.
TMDB_ROUTES="$ROOT/apps/server/src/routes/tmdb.ts"
if grep -q '"/films/ratings"' "$TMDB_ROUTES"; then
  RATINGS_LINE=$(grep -n '"/films/ratings"' "$TMDB_ROUTES" | head -1 | cut -d: -f1)
  DETAIL_LINE=$(grep -n '"/films/:id"' "$TMDB_ROUTES" | head -1 | cut -d: -f1)
  if [ -n "$RATINGS_LINE" ] && [ -n "$DETAIL_LINE" ] && [ "$RATINGS_LINE" -lt "$DETAIL_LINE" ]; then
    check ok "/films/ratings registered before /films/:id (not shadowed)"
  else
    check no "/films/ratings registered before /films/:id (not shadowed)"
  fi
  grep -q "slice(0" "$TMDB_ROUTES" && check ok "ratings ids capped at 10" || check no "ratings ids capped at 10"
else
  check no "/films/ratings registered before /films/:id (not shadowed)"
fi

# Client enrichment hook collects scoreless ids, fires one non-blocking query.
CARD_HOOK="$ROOT/apps/client/src/hooks/useCardRatings.ts"
grep -q "vote_average > 0" "$CARD_HOOK" && check ok "hook collects only scoreless (vote_average 0) ids" || check no "hook collects only scoreless (vote_average 0) ids"
grep -q "retry: false" "$CARD_HOOK" && check ok "ratings query is non-blocking (retry: false)" || check no "ratings query is non-blocking (retry: false)"

# Card badge uses the shared Stars control at xs size with TMDB->IMDb->RT->Metacritic priority.
FILM_CARD="$ROOT/apps/client/src/components/FilmCard.tsx"
grep -q "<Stars value={rating} size=\"xs\" />" "$FILM_CARD" && check ok "FilmCard renders Stars at xs size" || check no "FilmCard renders Stars at xs size"
grep -q "toHundredStarRating(film.rt_rating)" "$FILM_CARD" && check ok "RT/metacritic normalized via toHundredStarRating" || check no "RT/metacritic normalized via toHundredStarRating"
if ! grep -q "ratingLabel" "$FILM_CARD"; then
  check ok "FilmCard no longer uses ratingLabel glyphs"
else
  check no "FilmCard no longer uses ratingLabel glyphs"
fi
FILM_CARD_TEST="$ROOT/apps/client/src/components/FilmCard.test.tsx"
grep -q "out of 5 stars" "$FILM_CARD_TEST" && check ok "FilmCard.test asserts Stars aria-label (4.5 out of 5 stars)" || check no "FilmCard.test asserts Stars aria-label (4.5 out of 5 stars)"
grep -q "queryByRole(\"img\"" "$FILM_CARD_TEST" && check ok "FilmCard.test asserts no Stars control when no score" || check no "FilmCard.test asserts no Stars control when no score"

# Unit tests for server enrichment, route, and client rendering exist.
grep -q "enrichRatings" "$ROOT/apps/server/src/services/films.test.ts" && check ok "server service tests cover enrichRatings" || check no "server service tests cover enrichRatings"
grep -q "films/ratings?id" "$ROOT/apps/server/src/routes/tmdb.test.ts" && check ok "route tests cover the bulk ratings endpoint" || check no "route tests cover the bulk ratings endpoint"

# Run the relevant test suites.
if (cd "$ROOT/apps/server" && npx vitest run src/services/films.test.ts src/services/tmdb.test.ts src/routes/tmdb.test.ts --silent >/dev/null 2>&1); then
  check ok "server films/tmdb service + route tests pass (vitest)"
else
  check no "server films/tmdb service + route tests pass (vitest)"
fi
if (cd "$ROOT/apps/client" && npx vitest run src/components/FilmCard.test.tsx --silent >/dev/null 2>&1); then
  check ok "FilmCard.test.tsx passes (vitest)"
else
  check no "FilmCard.test.tsx passes (vitest)"
fi

echo
echo "=== 2. Manual browser QA (run while watching the browser) ==="
echo "  Prerequisites: TMDB key + JWT secret configured (see apps/server/.env)."
echo "  Start:  npm run dev   (client http://localhost:5173, server /api)."
echo
echo "  [A] Scoreless title enriched (e.g. 'We Are Aliens')"
echo "      - Browse/Search a title with vote_average 0 and watch the card grid."
echo "      - A small 5-star badge (partial-fill Stars at xs size) appears in the top-right corner"
echo "        of the card once the ratings query returns (cache warm)."
echo "      - Half-step scores render as a half-filled 5th star (e.g. 4.5 = four full + half star)."
echo "      - NOTE: We Are Aliens is a 2026 title with no OMDB ratings yet, so it is EXPECTED to"
echo "        show no badge. Use a title whose IMDb/RT scores exist for a positive check."
echo
echo "  [B] Rated titles (TMDB vote_average > 0)"
echo "      - Trending/Home cards with TMDB scores show a badge built from the TMDB score."
echo "      - Badge matches the FilmDetail hero rendering for the same value (same Stars control)."
echo
echo "  [C] No score at all"
echo "      - A title with vote_average 0 and null enriched ratings shows NO badge."
echo "      - The poster/layout is unchanged; no empty pill is rendered."
echo
echo "  [D] Regression"
echo "      - Search, Home, Watchlist and Diary pages render normally; no console errors."
echo "      - FilmDetail hero scorecards, comments/reviews and View on TMDB/IMDb links unchanged."
echo "      - Pagination/search switches refresh badges (new results query again) without layout jank."

echo
echo "=== Result ==="
echo "  automated: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ] && echo "  -> re-run the automated section if you edit code; manual section is eyeball-only." && exit 0
exit 1