#!/usr/bin/env bash
# QA script for the brand-mark-v3 (static assets) + avatar-display-fix changes.
#
# It runs the automated, scriptable checks (asset sizes/geometry, no stale
# raw-email gravatar or dead placeholder references, hashing unit test) and then
# prints the manual browser steps you must verify by eye. Designed for macOS.
#
#   Usage: ./scripts/qa-brand-avatar.sh
#
# Prerequisites: npm install done, `sips` available (macOS), server built or
# `npm run dev` running (see MANUAL section).
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/apps/client/public"
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

echo "=== 1. Static brand assets (automated) ==="

# PNG dimensions via sips.
for pair in "icon-192.png 192" "icon-512.png 512" "apple-touch-icon.png 180" "favicon-16x16.png 16" "favicon-32x32.png 32" "og.png 1200x630"; do
  file="${pair%% *}"
  want="${pair##* }"
  if [ -f "$PUB/$file" ]; then
    if [ "$want" = "1200x630" ]; then
      actual="$(sips -g pixelWidth -g pixelHeight "$PUB/$file" 2>/dev/null | grep -oE '[0-9]+' | tr '\n' 'x' | sed 's/x$//')"
      [ "$actual" = "$want" ] && check ok "$file is ${want}px (got $actual)" || check no "$file is ${want}px (got $actual)"
    else
      w="$(sips -g pixelWidth "$PUB/$file" 2>/dev/null | grep -oE '[0-9]+' | tail -1)"
      [ "$w" = "$want" ] && check ok "$file is ${want}px wide (got $w)" || check no "$file is ${want}px wide (got $w)"
    fi
  else
    check no "$file exists in public/"
  fi
done

# Disc-trio colours present in the SVG masters (and NOT the old slate-box amber tile).
for svg in favicon.svg mark-tile.svg apple-touch-icon.svg og.svg; do
  if grep -q "#F57C00" "$PUB/$svg" && grep -q "#44C553" "$PUB/$svg" && grep -q "#29B6F6" "$PUB/$svg"; then
    check ok "$svg contains orange/green/blue disc-trios"
  else
    check no "$svg missing a disc-trio colour"
  fi
  if grep -q "url(#brand-stripes)" "$PUB/$svg"; then
    check no "$svg still references the old slate-box clip-path"
  else
    check ok "$svg has no stale slate-box clip-path"
  fi
done

# Placeholder avatar exists and SVG masters are ink-tiled.
[ -f "$PUB/placeholder-avatar.svg" ] && check ok "placeholder-avatar.svg present" || check no "placeholder-avatar.svg present"
grep -q "#0F172A" "$PUB/favicon.svg" && check ok "favicon.svg uses ink #0F172A tile" || check no "favicon.svg uses ink tile"

# Multi-size favicon files exist (browser tabs need PNG/ICO fallbacks for SVG).
[ -f "$PUB/favicon-16x16.png" ] && check ok "favicon-16x16.png present" || check no "favicon-16x16.png present"
[ -f "$PUB/favicon-32x32.png" ] && check ok "favicon-32x32.png present" || check no "favicon-32x32.png present"
[ -f "$PUB/favicon.ico" ] && check ok "favicon.ico present" || check no "favicon.ico present"
grep -q 'favicon-16x16.png' "$ROOT/apps/client/index.html" && check ok "index.html references multi-size favicon" || check no "index.html references multi-size favicon"

echo
echo "=== 2. Avatar code path (automated) ==="

# No raw-email gravatar URL left in the header.
if grep -q 'gravatar.com/avatar/${user.email}' "$ROOT/apps/client/src/components/Header.tsx"; then
  check no "Header still builds a raw-email gravatar URL"
else
  check ok "Header no longer embeds raw email in gravatar URL"
fi
# No dead via.placeholder.com reference anywhere.
if grep -rIl "via.placeholder.com" "$ROOT/apps/client/src" >/dev/null 2>&1; then
  check no "client src still references dead via.placeholder.com"
else
  check ok "no via.placeholder.com references remain in client src"
fi
# Shared hashing helper gets exercised.
if (cd "$ROOT/packages/shared" && npx vitest run src/constants.test.ts -t "hashes the email" >/dev/null 2>&1); then
  check ok "getProfileImageUrl hashing test passes"
else
  check no "getProfileImageUrl hashing test passes (run 'npm run test' for full output)"
fi

echo
echo "=== 3. Manual browser QA (run while watching the browser) ==="
echo "  Prerequisites: TMDB key + JWT secret configured (see apps/server/.env)."
echo "  Start:  npm run dev   (client http://localhost:5173, server /api)."
echo
echo "  [A] Favicon / static tiles"
echo "      - Reload the app; the browser tab favicon is the disc-trio on an ink tile"
echo "        (three orange/green/blue discs), not the old amber slate box."
echo "      - Open the favicon in a browser at native size (16x16): the three discs"
echo "        should be visible as distinct colored circles (no rocket details, which"
echo "        are invisible at that size)."
echo "      - Install/refresh the PWA; launcher icon is the 512-tile disc-trio with rockets."
echo
echo "  [B] Header brand mark"
echo "      - Header shows the disc-trio mark (w-28 h-14) + 'Willyboxd' wordmark."
echo "      - Switch all 4 themes (amber/spotify/runway/linear); the mark is"
echo "        theme-agnostic (never inherits accent) on every theme."
echo "      - Login + Register pages show a small transparent w-14 mark."
echo
echo "  [C] OG / social"
echo "      - Open Graph image (og.png) is 1200x630 ink canvas + larger disc-trio"
echo "        + amber 'Willyboxd' wordmark (no amber slab box)."
echo
echo "  [D] User avatar (the breakage under test)"
echo "      - Register/log in with an email that HAS a Gravatar (e.g. your GitHub"
echo "        email) -> header shows that Gravatar, no broken-image icon."
echo "      - Inspect the <img>: src is https://www.gravatar.com/avatar/<md5hash>?s=32&d=404"
echo "        and the RAW email must NOT appear anywhere in the src."
echo "      - Register/log in with an email that has NO Gravatar -> the image"
echo "        404s once and falls back to /placeholder-avatar.svg (ink tile + slate"
echo "        silhouette), still no broken-image icon."
echo "      - (Future) if a User ever has an uploaded avatar URL it wins over Gravatar."
echo
echo "  [F] Settings page (avatar click navigation)"
echo "      - Click the avatar in the header -> lands on /settings, NOT a blank page."
echo "      - The header (theme switcher, nav, avatar, logout) is still visible."
echo "      - Account card shows the current avatar image + email + username."
echo "      - Avatar upload: pick a PNG/JPEG (<2MB), click 'Upload Avatar', then refresh -> header"
echo "        avatar updates to the uploaded image."
echo "      - 'Remove (use Gravatar)' -> PUT /auth/me { avatar: null } -> avatar falls back to Gravatar or placeholder."
echo "      - Password form: enter a wrong current password -> see an error message."
echo "        Enter correct current + matching new password -> see 'Password changed'."
echo
echo "  [E] Anime (regression, since these changes share the header)"
echo "      - Home shows 'Trending Anime' + 'Top Anime' rows; Search anime toggle"
echo "        adds anime=1 to the URL + request and survives reload."
echo

echo "=== Result ==="
echo "  automated: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ] && echo "  -> re-run the automated section if you edit assets; manual section is eyeball-only." && exit 0
exit 1
