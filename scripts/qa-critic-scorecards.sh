#!/usr/bin/env bash
# QA script for the critic-scorecards change (PR #21).
#
# Runs automated (source/unit) checks and then prints the manual browser steps
# you must verify by eye. Designed for macOS.
#
#   Usage: ./scripts/qa-critic-scorecards.sh
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

# Shared: toHundredStarRating normalizes 0-100 onto the 0.5-5 scale (÷20).
if grep -q "export function toHundredStarRating" "$ROOT/packages/shared/src/constants.ts"; then
  check ok "toHundredStarRating exported from shared"
else
  check no "toHundredStarRating exported from shared"
fi
if grep -q "value / 20" "$ROOT/packages/shared/src/constants.ts"; then
  check ok "toHundredStarRating divides by 20"
else
  check no "toHundredStarRating divides by 20"
fi

# Server: omdbService.getRatings returns { imdb, rt, metacritic }.
OMDB="$ROOT/apps/server/src/services/omdb.ts"
grep -q "getRatings" "$OMDB" && check ok "omdbService.getRatings exists (renamed from getRating)" || check no "omdbService.getRatings exists (renamed from getRating)"
grep -q 'imdb:\|rt:\|metacritic:' "$OMDB" && check ok "getRatings parses imdb/rt/metacritic from OMDB Ratings array" || check no "getRatings parses imdb/rt/metacritic from OMDB Ratings array"
if grep -q "getRating" "$OMDB" && ! grep -q "getRatings" "$OMDB"; then
  check no "old getRating name fully removed"
else
  check ok "no stale getRating references"
fi

# Server: FilmDetail payload carries rt_rating / metacritic_rating.
TMDB="$ROOT/apps/server/src/services/tmdb.ts"
grep -q "rt_rating" "$TMDB" && check ok "tmdb.ts maps rt_rating into FilmDetail" || check no "tmdb.ts maps rt_rating into FilmDetail"
grep -q "metacritic_rating" "$TMDB" && check ok "tmdb.ts maps metacritic_rating into FilmDetail" || check no "tmdb.ts maps metacritic_rating into FilmDetail"

# Types: rt_rating / metacritic_rating on FilmDetail (nullable).
TYPES="$ROOT/packages/shared/src/types.ts"
grep -q "rt_rating: number | null" "$TYPES" && check ok "FilmDetail type has nullable rt_rating" || check no "FilmDetail type has nullable rt_rating"
grep -q "metacritic_rating: number | null" "$TYPES" && check ok "FilmDetail type has nullable metacritic_rating" || check no "FilmDetail type has nullable metacritic_rating"

# Client: scorecard rows are guarded so absent sources render nothing.
FILM_DETAIL="$ROOT/apps/client/src/routes/FilmDetail.tsx"
grep -q "Rotten Tomatoes" "$FILM_DETAIL" && check ok "FilmDetail renders a 'Rotten Tomatoes' scorecard" || check no "FilmDetail renders a 'Rotten Tomatoes' scorecard"
grep -q "Metacritic" "$FILM_DETAIL" && check ok "FilmDetail renders a 'Metacritic' scorecard" || check no "FilmDetail renders a 'Metacritic' scorecard"
grep -q 'film.rt_rating !== null' "$FILM_DETAIL" && check ok "RT scorecard hidden when rt_rating is null" || check no "RT scorecard hidden when rt_rating is null"
grep -q 'film.metacritic_rating !== null' "$FILM_DETAIL" && check ok "Metacritic scorecard hidden when metacritic_rating is null" || check no "Metacritic scorecard hidden when metacritic_rating is null"

# Unit tests: server OMDB tests cover ratings parsing and null fallbacks.
if grep -q "getRatings" "$ROOT/apps/server/src/services/omdb.test.ts"; then
  check ok "omdb.test.ts covers getRatings"
else
  check no "omdb.test.ts covers getRatings"
fi

# Run the key test suites.
if (cd "$ROOT/apps/client" && npx vitest run src/routes/FilmDetail.test.tsx --silent >/dev/null 2>&1); then
  check ok "FilmDetail.test.tsx passes (vitest)"
else
  check no "FilmDetail.test.tsx passes (vitest)"
fi
if (cd "$ROOT/apps/server" && npx vitest run src/services/omdb.test.ts --silent >/dev/null 2>&1); then
  check ok "omdb.test.ts passes (vitest)"
else
  check no "omdb.test.ts passes (vitest)"
fi

echo
echo "=== 2. Manual browser QA (run while watching the browser) ==="
echo "  Prerequisites: TMDB key + OMDB key + JWT secret configured (see apps/server/.env)."
echo "  Start:  npm run dev   (client http://localhost:5173, server /api)."
echo
echo "  [A] Title with all three ratings (e.g. Fight Club, id 550)"
echo "      - Open the film detail page. The hero shows IMDb, Rotten Tomatoes,"
echo "        and Metacritic scorecards as star rows."
echo "      - Fight Club expected values: IMDb 8.8 -> 4.4 stars;"
echo "        RT 79% -> 3.95 stars; Metacritic 66/100 -> 3.3 stars."
echo "      - Star values are labeled (the <img> alt text reads '3.95 out of 5 stars')."
echo
echo "  [B] A title missing one source"
echo "      - Find a title where OMDB has no Metacritic rating (or no RT)."
echo "      - The missing source's row is absent; the present ones still render."
echo
echo "  [C] Non-fatal when OMDB is unavailable"
echo "      - Temporarily remove/blank OMDB_API_KEY from apps/server/.env, restart server."
echo "      - A film detail page still loads (no crash); IMDb + critic scorecards"
echo "        are simply absent. Restore the key afterwards."
echo
echo "  [D] Regression"
echo "      - Ratings and external links still show; no layout breakage in the hero."

echo
echo "=== Result ==="
echo "  automated: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ] && echo "  -> re-run the automated section if you edit code; manual section is eyeball-only." && exit 0
exit 1
