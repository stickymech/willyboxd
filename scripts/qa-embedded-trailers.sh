#!/usr/bin/env bash
# QA script for the embedded-trailers change (PR #24).
#
# Runs automated (source/unit) checks and then prints the manual browser steps
# you must verify by eye. Designed for macOS.
#
#   Usage: ./scripts/qa-embedded-trailers.sh
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

# Shared FilmDetail type carries the nullable trailer field.
if grep -q "trailer: { key: string; name: string | null } | null" "$ROOT/packages/shared/src/types.ts"; then
  check ok "FilmDetail has nullable trailer field in shared types"
else
  check no "FilmDetail has nullable trailer field in shared types"
fi

# Server fetches videos with the non-fatal catch fallback and picks a YouTube trailer.
TMDB_SERVICE="$ROOT/apps/server/src/services/tmdb.ts"
grep -q "videosPromise" "$TMDB_SERVICE" && check ok "getDetail builds a videosPromise" || check no "getDetail builds a videosPromise"
grep -q '`${type}/${id}/videos`' "$TMDB_SERVICE" && check ok "videosPromise hits TMDB /videos endpoint" || check no "videosPromise hits TMDB /videos endpoint"
grep -q 'return { results: \[\] as TmdbVideo\[\] }' "$TMDB_SERVICE" && check ok "videos fetch failure falls back to empty results (non-fatal)" || check no "videos fetch failure falls back to empty results (non-fatal)"
grep -q 'v.site === "YouTube" && v.type === "Trailer"' "$TMDB_SERVICE" && check ok "trailer selection filters site=YouTube type=Trailer" || check no "trailer selection filters site=YouTube type=Trailer"

# Client renders an embed only when trailer is present.
FILM_DETAIL="$ROOT/apps/client/src/routes/FilmDetail.tsx"
grep -q "film.trailer && (" "$FILM_DETAIL" && check ok "trailer embed guarded by film.trailer (hidden when null)" || check no "trailer embed guarded by film.trailer (hidden when null)"
grep -q "youtube.com/embed/" "$FILM_DETAIL" && check ok "embed src is https://www.youtube.com/embed/<key>" || check no "embed src is https://www.youtube.com/embed/<key>"
grep -q "<iframe" "$FILM_DETAIL" && check ok "trailer rendered as an iframe" || check no "trailer rendered as an iframe"

# Unit tests for server service, route, and client rendering exist.
if grep -q "maps the first YouTube trailer" "$ROOT/apps/server/src/services/tmdb.test.ts" &&
   grep -q "resolves trailer as null when the videos call fails" "$ROOT/apps/server/src/services/tmdb.test.ts"; then
  check ok "server service tests cover trailer present / absent / failure"
else
  check no "server service tests cover trailer present / absent / failure"
fi
grep -q "returns trailer when present" "$ROOT/apps/server/src/routes/tmdb.test.ts" && check ok "route test covers trailer passthrough" || check no "route test covers trailer passthrough"
grep -q "renders a YouTube embed when a trailer is present" "$ROOT/apps/client/src/routes/FilmDetail.test.tsx" && check ok "client test covers trailer embed render" || check no "client test covers trailer embed render"

# Run the relevant test suites.
if (cd "$ROOT/apps/server" && npx vitest run src/services/tmdb.test.ts src/routes/tmdb.test.ts --silent >/dev/null 2>&1); then
  check ok "server tmdb service + route tests pass (vitest)"
else
  check no "server tmdb service + route tests pass (vitest)"
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
echo "  [A] Movie with a trailer (e.g. Fight Club)"
echo "      - Navigate to the movie detail page (search 'Fight Club', or use a known id)."
echo "      - The hero shows an embedded YouTube player below the overview."
echo "      - The player is click-to-play (no autoplay), has a title attribute, and fills the width (16:9)."
echo "      - Pressing play loads and plays the official trailer."
echo
echo "  [B] TV title with a trailer (e.g. Breaking Bad)"
echo "      - Open a TV series detail page; the trailer embeds the same way (type=tv)."
echo
echo "  [C] Title with no trailer"
echo "      - Find/QA a title with no YouTube trailer (many older or niche titles)."
echo "      - No video player is rendered anywhere on the page; layout is unchanged."
echo
echo "  [D] Regression"
echo "      - Detail page still loads when trailers are absent and shows no console errors."
echo "      - Existing hero elements (ratings, scorecards, View on IMDb/TMDB links) unchanged."
echo "      - If the videos fetch fails (network), the page still loads without the player."

echo
echo "=== Result ==="
echo "  automated: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ] && echo "  -> re-run the automated section if you edit code; manual section is eyeball-only." && exit 0
exit 1
