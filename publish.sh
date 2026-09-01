#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

MANIFEST="$ROOT/manifest.json"
MAIN_JS="$ROOT/main.js"
STYLES_CSS="$ROOT/styles.css"

if [[ ! -f "$MANIFEST" ]]; then
  echo "error: manifest.json not found" >&2
  exit 1
fi

if [[ ! -f "$MAIN_JS" ]]; then
  echo "error: main.js not found — build the plugin before publishing" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: GitHub CLI (gh) is not installed" >&2
  echo "install: brew install gh && gh auth login" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: not logged in to GitHub — run: gh auth login" >&2
  exit 1
fi

VERSION="$(python3 -c "import json; print(json.load(open('$MANIFEST'))['version'])")"
NOTES="${1:-Release $VERSION}"

ASSETS=( "$MANIFEST" "$MAIN_JS" )
if [[ -f "$STYLES_CSS" ]]; then
  ASSETS+=( "$STYLES_CSS" )
fi

if gh release view "$VERSION" >/dev/null 2>&1; then
  echo "error: release $VERSION already exists" >&2
  echo "bump version in manifest.json, commit, push, then run this script again" >&2
  exit 1
fi

echo "Publishing release $VERSION"
echo "Assets: ${ASSETS[*]}"

gh release create "$VERSION" "${ASSETS[@]}" \
  --title "$VERSION" \
  --notes "$NOTES"

echo "Done: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/releases/tag/$VERSION"
