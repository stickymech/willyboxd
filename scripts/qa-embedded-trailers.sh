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
grep -q "youtube-nocookie.com/embed/" "$FILM_DETAIL" && check ok "embed src is https://www.youtube-nocookie.com/embed/<key>" || check no "embed src is https://www.youtube-nocookie.com/embed/<key>"
grep -q "<iframe" "$FILM_DETAIL" && check ok "trailer rendered as an iframe" || check no "trailer rendered as an iframe"

# Trailer sits inside the Watchlist column of the watchlist/diary grid (same row as diary).
if grep -q "Watchlist" "$FILM_DETAIL" && grep -q "film.trailer && (" "$FILM_DETAIL"; then
  WATCHLIST_LINE=$(grep -n "Watchlist" "$FILM_DETAIL" | head -1 | cut -d: -f1)
  TRAILER_LINE=$(grep -n "film.trailer && (" "$FILM_DETAIL" | head -1 | cut -d: -f1)
  GENRES_LINE=$(grep -n "film.genres.length > 0 && (" "$FILM_DETAIL" | head -1 | cut -d: -f1)
  if [ -n "$WATCHLIST_LINE" ] && [ -n "$TRAILER_LINE" ] && [ -n "$GENRES_LINE" ] && [ "$TRAILER_LINE" -gt "$WATCHLIST_LINE" ] && [ "$TRAILER_LINE" -lt "$GENRES_LINE" ]; then
    check ok "trailer embed lives between the Watchlist heading and the Genres section (inside the grid)"
  else
    check no "trailer embed lives between the Watchlist heading and the Genres section (inside the grid)"
  fi
else
  check no "trailer embed lives between the Watchlist heading and the Genres section (inside the grid)"
fi

# FilmDetail carries vote_count and hides the 0-star hero row when no votes exist.
if grep -q "vote_count" "$ROOT/packages/shared/src/types.ts"; then
  check ok "FilmDetail has vote_count in shared types"
else
  check no "FilmDetail has vote_count in shared types"
fi
grep -q "vote_count > 0" "$FILM_DETAIL" && check ok "hero Stars hidden when vote_count is 0" || check no "hero Stars hidden when vote_count is 0"

# Unit tests for server service, route, and client rendering exist.
if grep -q "maps the first YouTube trailer" "$ROOT/apps/server/src/services/tmdb.test.ts" &&
   grep -q "resolves trailer as null when the videos call fails" "$ROOT/apps/server/src/services/tmdb.test.ts"; then
  check ok "server service tests cover trailer present / absent / failure"
else
  check no "server service tests cover trailer present / absent / failure"
fi
grep -q "returns trailer when present" "$ROOT/apps/server/src/routes/tmdb.test.ts" && check ok "route test covers trailer passthrough" || check no "route test covers trailer passthrough"
grep -q "renders a YouTube embed when a trailer is present" "$ROOT/apps/client/src/routes/FilmDetail.test.tsx" && check ok "client test covers trailer embed render" || check no "client test covers trailer embed render"
grep -q "maps vote_count from the detail response" "$ROOT/apps/server/src/services/tmdb.test.ts" && check ok "server test covers vote_count mapping" || check no "server test covers vote_count mapping"
grep -q "renders no hero Stars when the title has no votes" "$ROOT/apps/client/src/routes/FilmDetail.test.tsx" && check ok "client test covers hidden stars for vote_count 0" || check no "client test covers hidden stars for vote_count 0"

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
echo "      - A video player appears in the LEFT column of the Watchlist/Diary grid, BELOW the"
echo "        'Add to Watchlist' button — same row as the diary form, filling the dead space."
echo "      - The hero backdrop banner is NOT obscured by the player."
echo "      - The player is click-to-play (no autoplay), has a title attribute, and fills the width (16:9)."
echo "      - Pressing play loads and plays the official trailer."
echo "      - The browser console shows NO cross-origin ad/redirect errors from the embed (youtube-nocookie)."
echo
echo "  [B] TV title with a trailer (e.g. Breaking Bad)"
echo "      - Open a TV series detail page; the trailer embeds the same way (type=tv)."
echo
echo "  [C] Title with no trailer"
echo "      - Find/QA a title with no YouTube trailer (many older or niche titles)."
echo "      - No video player is rendered anywhere on the page; layout is unchanged."
echo
echo "  [D] Low-vote title (vote_count 0, e.g. 'cocoon - One Summer of Girlhood')"
echo "      - Open the detail page for a title with zero TMDB votes."
echo "      - NO empty 0-star row is shown in the hero (the old misleading '0 stars')."
echo "      - IMDb/RT/Metacritic scorecards still render when present; View on TMDB/IMDb links unchanged."
echo
echo "  [E] Regression"
echo "      - Detail page still loads when trailers are absent and shows no console errors."
echo "      - Existing hero elements (ratings, scorecards, View on IMDb/TMDB links) unchanged."
echo "      - The Watchlist/Diary grid still renders correctly around the player."
echo "      - If the videos fetch fails (network), the page still loads without the player."

echo
echo "=== Result ==="
echo "  automated: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ] && echo "  -> re-run the automated section if you edit code; manual section is eyeball-only." && exit 0
exit 1
