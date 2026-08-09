#!/usr/bin/env bash
# QA script for the external-links change (PR #20).
#
# Runs automated (source/unit) checks and then prints the manual browser steps
# you must verify by eye. Designed for macOS.
#
#   Usage: ./scripts/qa-external-links.sh
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

# Helpers exist in shared and build the expected URLs.
if grep -q "getImdbUrl" "$ROOT/packages/shared/src/constants.ts" &&
   grep -q "getTmdbUrl" "$ROOT/packages/shared/src/constants.ts"; then
  check ok "getImdbUrl / getTmdbUrl exported from shared"
else
  check no "getImdbUrl / getTmdbUrl exported from shared"
fi

if grep -q "https://www.imdb.com/title/\${imdbId}" "$ROOT/packages/shared/src/constants.ts"; then
  check ok "getImdbUrl builds https://www.imdb.com/title/<imdb_id>"
else
  check no "getImdbUrl builds https://www.imdb.com/title/<imdb_id>"
fi

if grep -q "https://www.themoviedb.org/\${type}/\${id}" "$ROOT/packages/shared/src/constants.ts"; then
  check ok "getTmdbUrl builds https://www.themoviedb.org/<type>/<id>"
else
  check no "getTmdbUrl builds https://www.themoviedb.org/<type>/<id>"
fi

# FilmDetail renders both links with the external-link conventions.
FILM_DETAIL="$ROOT/apps/client/src/routes/FilmDetail.tsx"
grep -q "View on IMDb" "$FILM_DETAIL" && check ok "FilmDetail renders 'View on IMDb'" || check no "FilmDetail renders 'View on IMDb'"
grep -q "View on TMDB" "$FILM_DETAIL" && check ok "FilmDetail renders 'View on TMDB'" || check no "FilmDetail renders 'View on TMDB'"
grep -q 'film.imdb_id && (' "$FILM_DETAIL" && check ok "IMDb link guarded by imdb_id (hidden when null)" || check no "IMDb link guarded by imdb_id (hidden when null)"
grep -q 'rel="noreferrer"' "$FILM_DETAIL" && check ok "links use rel=noreferrer" || check no "links use rel=noreferrer"
grep -q 'target="_blank"' "$FILM_DETAIL" && check ok "links use target=_blank" || check no "links use target=_blank"

# Unit tests for the helpers and client behavior exist.
if grep -q "getImdbUrl\|getTmdbUrl" "$ROOT/packages/shared/src/constants.test.ts"; then
  check ok "shared unit tests cover the URL helpers"
else
  check no "shared unit tests cover the URL helpers"
fi

# Run the client test suite for FilmDetail to confirm link tests pass.
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
echo "  [A] Movie title with an IMDb id (e.g. Fight Club)"
echo "      - Navigate to a movie detail page (search 'Fight Club', or use a known id)."
echo "      - The hero shows BOTH 'View on IMDb ↗' and 'View on TMDB ↗' links."
echo "      - IMDb link href is https://www.imdb.com/title/<imdb_id> (e.g. tt0137523)."
echo "      - TMDB link href is https://www.themoviedb.org/movie/<id> (e.g. /movie/550)."
echo "      - Both open in a NEW tab (target=_blank, rel=noreferrer)."
echo
echo "  [B] TV title"
echo "      - Open a TV series detail page (search a series, e.g. 'Breaking Bad')."
echo "      - TMDB link href is https://www.themoviedb.org/tv/<id> (type=tv)."
echo "      - IMDb link shows if imdb_id is present; otherwise it is absent (see [C])."
echo
echo "  [C] Title with no IMDb id"
echo "      - Find/QA a title where imdb_id is null (many newer or niche titles)."
echo "      - 'View on IMDb ↗' is NOT rendered; 'View on TMDB ↗' still is."
echo
echo "  [D] Regression"
echo "      - The external link row sits between the ratings and runtime; no layout breakage."
echo "      - Clicking 'View on TMDB ↗' on a movie lands on the correct TMDB page."

echo
echo "=== Result ==="
echo "  automated: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ] && echo "  -> re-run the automated section if you edit code; manual section is eyeball-only." && exit 0
exit 1
