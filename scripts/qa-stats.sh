#!/usr/bin/env bash
# QA script for the stats-dashboard change (issue #31).
#
# Runs targeted automated checks, then prints the manual browser steps.
# Prerequisites: npm install done; dev server running for MANUAL steps.
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

# Stats endpoint implemented (no 501 stub left).
grep -q "app.get(\"/stats\"" "$ROOT/apps/server/src/routes/stats.ts" \
  && check ok "stats route registered" || check no "stats route registered"
! grep -q "Not implemented" "$ROOT/apps/server/src/routes/stats.ts" \
  && check ok "501 stub removed" || check no "501 stub removed"

# Shared type carries total_films.
grep -q "total_films: number" "$ROOT/packages/shared/src/types.ts" \
  && check ok "StatsOverview.total_films present" || check no "StatsOverview.total_films present"

# Client route wired into the app + header.
grep -q "path=\"/stats\"" "$ROOT/apps/client/src/App.tsx" \
  && check ok "/stats route registered" || check no "/stats route registered"
grep -q "to=\"/stats\"" "$ROOT/apps/client/src/components/Header.tsx" \
  && check ok "header nav link present" || check no "header nav link present"

# Targeted tests.
echo ""
echo "--- server stats tests ---"
if npx --prefix "$ROOT" vitest run --root "$ROOT/apps/server" src/routes/stats.test.ts --passWithNoTests >/dev/null 2>&1; then
  check ok "server stats tests pass"
else
  check no "server stats tests pass"
fi

echo "--- client stats tests ---"
if npx --prefix "$ROOT" vitest run --root "$ROOT/apps/client" src/routes/Stats.test.tsx --passWithNoTests >/dev/null 2>&1; then
  check ok "client stats tests pass"
else
  check no "client stats tests pass"
fi

echo ""
echo "=== 2. Manual steps (dev server running) ==="
cat <<'EOF'
  1. Register a fresh user (or use an existing one with diary entries).
  2. Log 2-3 films with different dates, ratings, genres.
  3. Open http://localhost:5173/stats — header shows a Stats link.
  4. Verify: Films/Entries/Hours/Avg rating cards match your diary;
     genre/year/decade charts show sensible bars.
  5. New user with no entries sees "log your first film".
  6. Logged out: /stats prompts to sign in.
EOF

echo ""
echo "Result: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
