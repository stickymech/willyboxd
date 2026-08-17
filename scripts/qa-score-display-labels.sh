#!/usr/bin/env bash
# QA script for the score-display-labels change (issue #26).
#
# Runs automated (source/unit) checks and then prints the manual browser steps
# you must verify by eye. Designed for macOS.
#
#   Usage: ./scripts/qa-score-display-labels.sh
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

# Shared: converters round to the nearest half-star; formatScore exists.
CONSTANTS="$ROOT/packages/shared/src/constants.ts"
CONSTANTS_TEST="$ROOT/packages/shared/src/constants.test.ts"
if grep -q "return Math.round(value) / 2" "$CONSTANTS"; then
  check ok "toStarRating rounds to the nearest half-star"
else
  check no "toStarRating rounds to the nearest half-star"
fi
if grep -q "return Math.round(value / 10) / 2" "$CONSTANTS"; then
  check ok "toHundredStarRating rounds ÷20 to the nearest half-star"
else
  check no "toHundredStarRating rounds ÷20 to the nearest half-star"
fi
grep -q "export function formatScore" "$CONSTANTS" && check ok "formatScore exported from shared" || check no "formatScore exported from shared"
grep -q "formatScore renders a 0–5 score as a half-star increment label" "$CONSTANTS_TEST" && check ok "constants.test.ts covers formatScore" || check no "constants.test.ts covers formatScore"

# Client: hero rows show a numeric N/5 label beside the stars.
FILM_DETAIL="$ROOT/apps/client/src/routes/FilmDetail.tsx"
grep -q "formatScore" "$FILM_DETAIL" && check ok "FilmDetail imports formatScore" || check no "FilmDetail imports formatScore"
LABELS=$(grep -c "formatScore(toStarRating\|formatScore(toHundredStarRating" "$FILM_DETAIL" || true)
if [ "$LABELS" = "4" ]; then
  check ok "hero labels all four score rows (TMDB, IMDb, RT, Metacritic)"
else
  check no "hero labels all four score rows (TMDB, IMDb, RT, Metacritic)"
fi
grep -q "No ratings available yet" "$FILM_DETAIL" && check ok "hero shows a 'No ratings available yet.' note" || check no "hero shows a 'No ratings available yet.' note"

# Client: film cards use the normalized label for the badge.
FILM_CARD="$ROOT/apps/client/src/components/FilmCard.tsx"
grep -q "formatScore(toStarRating(film.vote_average))" "$FILM_CARD" && check ok "FilmCard badge uses the N/5 label" || check no "FilmCard badge uses the N/5 label"

# Client tests cover the label rows and the no-ratings note.
FILM_DETAIL_TEST="$ROOT/apps/client/src/routes/FilmDetail.test.tsx"
grep -q "renders a 'No ratings available yet' note when no score data exists" "$FILM_DETAIL_TEST" && check ok "FilmDetail.test.tsx covers the no-ratings note" || check no "FilmDetail.test.tsx covers the no-ratings note"

# Run the targeted test suites.
if (cd "$ROOT/apps/client" && npx vitest run src/routes/FilmDetail.test.tsx --silent >/dev/null 2>&1); then
  check ok "FilmDetail.test.tsx passes (vitest)"
else
  check no "FilmDetail.test.tsx passes (vitest)"
fi
if (cd "$ROOT/packages/shared" && npx vitest run src/constants.test.ts --silent >/dev/null 2>&1); then
  check ok "constants.test.ts passes (vitest)"
else
  check no "constants.test.ts passes (vitest)"
fi

echo
echo "=== 2. Manual browser QA (run while watching the browser) ==="
echo "  Prerequisites: TMDB key + OMDB key + JWT secret configured (see apps/server/.env)."
echo "  Start:  npm run dev   (client http://localhost:5173, server /api)."
echo
echo "  [A] Title with all ratings (e.g. Fight Club, id 550)"
echo "      - Open the film detail page. Each hero row shows stars plus a"
echo "        numeric label beside them (e.g. 4/5, 4.5/5)."
echo "      - Fight Club expected labels: TMDB ~8.4 -> 4/5; IMDb 8.8 -> 4.5/5;"
echo "        RT 81% -> 4/5; Metacritic 67/100 -> 3.5/5."
echo "      - No label shows a trailing decimal like 3.95 or 8.4."
echo
echo "  [B] Title with no ratings at all"
echo "      - Open a film detail page with vote_count 0 and no IMDb/RT/Meta"
echo "        ratings. The hero shows 'No ratings available yet.' and NOT an"
echo "        empty 0-star row."
echo
echo "  [C] Film cards"
echo "      - A film card in a grid shows the badge as an N/5 label"
echo "        (e.g. 4/5) instead of a raw decimal like 8.4."
echo
echo "  [D] Regression"
echo "      - Titles with ratings still round sensibly (no 0-star hero, labels"
echo "        consistent with the filled stars); the trailer embed, reviews,"
echo "        and external links still render."

echo
echo "=== Result ==="
echo "  automated: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ] && echo "  -> re-run the automated section if you edit code; manual section is eyeball-only." && exit 0
exit 1