#!/usr/bin/env bash
#
# Update bundle IDs in example config.xml files.
#
# Usage:
#   ./set-bundle-id.sh                              # show current bundle IDs
#   ./set-bundle-id.sh subscriptions cc.fovea.sub   # set one example
#   ./set-bundle-id.sh --all cc.fovea               # set all: cc.fovea.subscriptions, cc.fovea.consumables, ...
#

set -euo pipefail
cd "$(dirname "$0")"

EXAMPLES=(subscriptions consumables braintree stripe)

show_current() {
  for ex in "${EXAMPLES[@]}"; do
    local xml="$ex/config.xml"
    if [[ -f "$xml" ]]; then
      local id
      id=$(sed -n 's/.*<widget id="\([^"]*\)".*/\1/p' "$xml")
      printf "  %-15s %s\n" "$ex" "$id"
    fi
  done
}

set_bundle_id() {
  local ex="$1" id="$2"
  local xml="$ex/config.xml"
  if [[ ! -f "$xml" ]]; then
    echo "error: $xml not found" >&2
    return 1
  fi
  local old_id
  old_id=$(sed -n 's/.*<widget id="\([^"]*\)".*/\1/p' "$xml")
  sed -i '' "s|<widget id=\"${old_id}\"|<widget id=\"${id}\"|" "$xml"
  printf "  %-15s %s -> %s\n" "$ex" "$old_id" "$id"
}

if [[ $# -eq 0 ]]; then
  echo "Current bundle IDs:"
  show_current
  echo
  echo "Usage:"
  echo "  $0 <example> <bundle-id>    set one example"
  echo "  $0 --all <base-id>          set all: <base-id>.subscriptions, ..."
  exit 0
fi

if [[ "$1" == "--all" ]]; then
  if [[ $# -lt 2 ]]; then
    echo "error: --all requires a base bundle ID" >&2
    exit 1
  fi
  base="$2"
  echo "Setting bundle IDs (base: $base):"
  for ex in "${EXAMPLES[@]}"; do
    set_bundle_id "$ex" "${base}.${ex}"
  done
else
  if [[ $# -lt 2 ]]; then
    echo "error: usage: $0 <example> <bundle-id>" >&2
    exit 1
  fi
  ex="$1"
  id="$2"
  # Validate example name
  valid=false
  for e in "${EXAMPLES[@]}"; do
    [[ "$e" == "$ex" ]] && valid=true
  done
  if ! $valid; then
    echo "error: unknown example '$ex'. Valid: ${EXAMPLES[*]}" >&2
    exit 1
  fi
  echo "Setting bundle ID:"
  set_bundle_id "$ex" "$id"
fi
