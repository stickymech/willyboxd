#!/usr/bin/env bash
# QA script for the review-source-label change (PR #23).
#
# Runs automated (source/unit) checks and then prints the manual browser steps
# you must verify by eye. Designed for macOS.
#
#   Usage: ./scripts/qa-review-source-label.sh
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

# Shared: getReviewSourceLabel exists with the known-site mapping.
CONSTANTS="$ROOT/packages/shared/src/constants.ts"
grep -q "export function getReviewSourceLabel" "$CONSTANTS" && check ok "getReviewSourceLabel exported from shared" || check no "getReviewSourceLabel exported from shared"
grep -q '"themoviedb.org": "TMDB"' "$CONSTANTS" && check ok "maps themoviedb.org -> TMDB" || check no "maps themoviedb.org -> TMDB"
grep -q '"imdb.com": "IMDb"' "$CONSTANTS" && check ok "maps imdb.com -> IMDb" || check no "maps imdb.com -> IMDb"
grep -q '"rottentomatoes.com": "Rotten Tomatoes"' "$CONSTANTS" && check ok "maps rottentomatoes.com -> Rotten Tomatoes" || check no "maps rottentomatoes.com -> Rotten Tomatoes"
grep -q 'hostname.replace(/^www\\./, "")' "$CONSTANTS" && check ok "falls back to stripped hostname for unknown hosts" || check no "falls back to stripped hostname for unknown hosts"

# Client: ReviewCard renders 'via <source>' only when a label is derivable.
FILM_DETAIL="$ROOT/apps/client/src/routes/FilmDetail.tsx"
grep -q "via {sourceLabel}" "$FILM_DETAIL" && check ok "ReviewCard renders 'via <source>'" || check no "ReviewCard renders 'via <source>'"
grep -q "sourceLabel && <p" "$FILM_DETAIL" && check ok "label hidden when URL is missing/malformed" || check no "label hidden when URL is missing/malformed"

# Unit tests cover mapped, unknown, and missing URL cases.
if grep -q "getReviewSourceLabel" "$ROOT/packages/shared/src/constants.test.ts"; then
  check ok "shared unit tests cover getReviewSourceLabel"
else
  check no "shared unit tests cover getReviewSourceLabel"
fi

# Run the relevant test suites.
if (cd "$ROOT/packages/shared" && npx vitest run src/constants.test.ts --silent >/dev/null 2>&1); then
  check ok "constants.test.ts passes (vitest)"
else
  check no "constants.test.ts passes (vitest)"
fi
if (cd "$ROOT/apps/client" && npx vitest run src/routes/FilmDetail.test.tsx --silent >/dev/null 2>&1); then
  check ok "FilmDetail.test.tsx passes (vitest)"
else
  check no "FilmDetail.test.tsx passes (vitest)"
fi

echo
echo "=== 2. Manual browser QA (run while watching the browser) ==="
echo "  Prerequisites: TMDB key + JWT secret configured (see apps/server/.env)."
echo "  Start:  npm run dev   (client http://localhost:5173, server /api)."
echo
echo "  NOTE: Reviews come from TMDB, NOT OMDB. OMDB only feeds rating scorecards."
echo "  A title with no TMDB community reviews shows NO Reviews section at all"
echo "  (by design, non-fatal). Use a title known to have reviews, e.g. Fight Club."
echo
echo "  [A] Title with TMDB reviews (e.g. Fight Club)"
echo "      - Open the film detail page and scroll to the Reviews section."
echo "      - Each review card shows 'via TMDB' (muted, small) near the"
echo "        'Read review ↗' link."
echo
echo "  [B] Unknown-host review"
echo "      - A review whose URL host is not in the known map falls back to the"
echo "        readable hostname, e.g. 'via example.co.uk' (no 'www.' prefix)."
echo
echo "  [C] Review with a missing URL"
echo "      - A review with an empty/missing url renders NO 'via' label."
echo
echo "  [D] Anime title (regression / expected empty state)"
echo "      - Open an anime title with no TMDB community reviews."
echo "      - The page loads fine and shows no Reviews section (non-fatal),"
echo "        with no console errors."
echo "      - If it does have reviews, each card shows its source label."

echo
echo "=== Result ==="
echo "  automated: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ] && echo "  -> re-run the automated section if you edit code; manual section is eyeball-only." && exit 0
exit 1
