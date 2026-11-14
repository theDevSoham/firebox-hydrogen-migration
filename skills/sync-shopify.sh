#!/usr/bin/env bash
# Copies the Shopify AI Toolkit's `shopify` skill into skills/shopify at a pinned release, then
# applies this repo's privacy edits (skills/patch-shopify.mjs).
#
#   skills/sync-shopify.sh            # re-sync the version in skills/shopify/VERSION
#   skills/sync-shopify.sh v2.4.0     # move to another release tag
#
# Review the diff before committing: `git diff --stat skills/shopify`.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
repo="https://github.com/Shopify/shopify-ai-toolkit.git"
tag="${1:-$(sed -n 's/^tag: //p' "$here/shopify/VERSION" 2>/dev/null || true)}"
if [ -z "$tag" ]; then
  echo "usage: $0 <release tag, e.g. v2.3.0>" >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git -c advice.detachedHead=false clone --quiet --depth 1 --branch "$tag" "$repo" "$tmp/src"
commit="$(git -C "$tmp/src" rev-parse HEAD)"

rm -rf "$here/shopify"
cp -R "$tmp/src/skills/shopify" "$here/shopify"
cp "$tmp/src/LICENSE" "$here/shopify/LICENSE"
printf 'source: %s\ntag: %s\ncommit: %s\n' "$repo" "$tag" "$commit" > "$here/shopify/VERSION"

node "$here/patch-shopify.mjs"
echo "skills/shopify is now $tag ($commit)."
