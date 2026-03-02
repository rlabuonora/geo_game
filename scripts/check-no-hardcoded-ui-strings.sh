#!/bin/sh

set -eu

cd "$(dirname "$0")/.."

jsx_text_matches="$(rg -n --glob '*.tsx' '>[[:space:]]*[[:alpha:][:digit:]][^<{]*<' app/web/src || true)"
attribute_matches="$(rg -n --glob '*.tsx' '(aria-label|title|alt|placeholder)=["'\''][^"{]' app/web/src || true)"

if [ -n "$jsx_text_matches" ] || [ -n "$attribute_matches" ]; then
  echo "Hardcoded UI strings detected in TSX files. Move user-facing text to i18n keys."

  if [ -n "$jsx_text_matches" ]; then
    echo
    echo "Raw JSX text nodes:"
    echo "$jsx_text_matches"
  fi

  if [ -n "$attribute_matches" ]; then
    echo
    echo "Raw user-facing attributes:"
    echo "$attribute_matches"
  fi

  exit 1
fi

echo "No obvious hardcoded UI strings found in TSX files."
