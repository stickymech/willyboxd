#!/usr/bin/env bash
# Regenerates the PNG brand assets from the "slate box" mark geometry.
#
# Uses Pillow via scripts/make-icons.py for all PNGs (qlmanage proved
# unreliable for these — wrong scale + misapplied clip-path). The SVG
# masters in public/ remain as the browser-served favicon and as vector
# references. Run from a Mac whenever the mark geometry changes. The
# generated PNGs are committed; this script is not run in CI.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

python3 "$SCRIPT_DIR/make-icons.py"

echo "---"
sips -g pixelWidth -g pixelHeight \
  "$SCRIPT_DIR/../public/icon-192.png" \
  "$SCRIPT_DIR/../public/icon-512.png" \
  "$SCRIPT_DIR/../public/apple-touch-icon.png" \
  "$SCRIPT_DIR/../public/favicon-16x16.png" \
  "$SCRIPT_DIR/../public/favicon-32x32.png" \
  "$SCRIPT_DIR/../public/og.png"
