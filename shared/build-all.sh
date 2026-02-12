#!/bin/bash
#
# Build all example projects for a given platform.
#
# Usage: ./shared/build-all.sh ios
#        ./shared/build-all.sh android
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

PLATFORM="${1:-ios}"

if [ "$PLATFORM" != "ios" ] && [ "$PLATFORM" != "android" ] && [ "$PLATFORM" != "browser" ]; then
  echo "Usage: $0 <platform>"
  echo "  platform: ios, android, or browser"
  exit 1
fi

EXAMPLES=(subscriptions consumables braintree stripe)

echo "Building all examples for platform: $PLATFORM"
echo "=============================================="

PASS=0
FAIL=0
SKIP=0

for example in "${EXAMPLES[@]}"; do
  DIR="$ROOT_DIR/$example"

  if [ ! -f "$DIR/package.json" ]; then
    echo ""
    echo "[$example] SKIP — no package.json"
    SKIP=$((SKIP + 1))
    continue
  fi

  echo ""
  echo "[$example] Building..."

  cd "$DIR"

  # Install dependencies if needed
  if [ ! -d "node_modules" ]; then
    echo "[$example] Installing dependencies..."
    npm install --silent 2>&1 | tail -1
  fi

  # Add platform if not present
  if [ ! -d "platforms/$PLATFORM" ]; then
    echo "[$example] Adding platform $PLATFORM..."
    npx cordova platform add "$PLATFORM" 2>&1 | tail -1
  fi

  # Compile TypeScript (uses tsconfig.json)
  if [ -f "tsconfig.json" ]; then
    echo "[$example] Compiling TypeScript..."
    npx tsc 2>&1 || true
  fi

  # Build
  if npx cordova build "$PLATFORM" 2>&1 | tail -5; then
    echo "[$example] PASS"
    PASS=$((PASS + 1))
  else
    echo "[$example] FAIL"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "=============================================="
echo "Results: $PASS passed, $FAIL failed, $SKIP skipped"
[ $FAIL -eq 0 ] || exit 1
