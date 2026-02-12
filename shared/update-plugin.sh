#!/bin/bash
#
# Update cordova-plugin-purchase version in all example projects.
#
# Usage: ./shared/update-plugin.sh 13.2.0
#        ./shared/update-plugin.sh ../cordova-plugin-purchase   (local path)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -z "$1" ]; then
  echo "Usage: $0 <version-or-path>"
  echo ""
  echo "Examples:"
  echo "  $0 13.2.0                          # npm registry version"
  echo "  $0 ../cordova-plugin-purchase       # local path"
  exit 1
fi

VERSION="$1"
EXAMPLES=(subscriptions consumables braintree stripe)

# Determine the value to set in package.json
if [ -d "$VERSION" ]; then
  # Local path — resolve to absolute and use file: prefix
  ABS_PATH="$(cd "$VERSION" && pwd)"
  PKG_VALUE="file:$ABS_PATH"
  echo "Updating all examples to use local plugin: $ABS_PATH"
else
  PKG_VALUE="^$VERSION"
  echo "Updating all examples to cordova-plugin-purchase@$VERSION"
fi

PASS=0
FAIL=0

for example in "${EXAMPLES[@]}"; do
  DIR="$ROOT_DIR/$example"
  PKG="$DIR/package.json"

  if [ ! -f "$PKG" ]; then
    echo "  SKIP  $example (no package.json)"
    continue
  fi

  # Use node to update the version in package.json
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$PKG', 'utf8'));
    if (pkg.devDependencies && pkg.devDependencies['cordova-plugin-purchase'] !== undefined) {
      pkg.devDependencies['cordova-plugin-purchase'] = '$PKG_VALUE';
    }
    fs.writeFileSync('$PKG', JSON.stringify(pkg, null, 4) + '\n');
  " 2>/dev/null

  if [ $? -eq 0 ]; then
    echo "  OK    $example"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $example"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "Done: $PASS updated, $FAIL failed."
[ $FAIL -eq 0 ] || exit 1
