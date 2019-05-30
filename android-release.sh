#!/bin/bash

cd "$(dirname "$0")"

ROOT_DIR="$(pwd)"
FINAL_APK="${FINAL_APK:-$ROOT_DIR/android-release-$(date +%Y%m%d-%H%M).apk}"
KEYSTORE="${KEYSTORE:-$ROOT_DIR/android-release.keystore}"

if test ! -e "$KEYSTORE"; then
  echo "ERROR: Keystore file $KEYSTORE not found."
  echo "Set the \$KEYSTORE environment variable or copy a file called 'android-release.keystore' in this directory."
  exit 1
fi

if test -z "$KEYSTORE_ALIAS"; then
  echo "$ERROR: \$KEYSTORE_ALIAS not set"
  echo
  echo "You can figure out the correct value by using the following command:"
  echo "keytool -v -list -keystore \"$KEYSTORE\""
  exit 1
fi

echo "Running from $ROOT_DIR"

# Exits on failure
set -e

cd "$ROOT_DIR"

# Generates a release build
echo cordova build android --release -- --keystore=\"$KEYSTORE\" --alias=\"$KEYSTORE_ALIAS\"
if test -z "$KEYSTORE_PASSWORD"; then
  read -p "Please enter keystore password:" KEYSTORE_PASSWORD
fi
cordova build android --release -- --keystore="$KEYSTORE" --alias="$KEYSTORE_ALIAS" --storePassword="$KEYSTORE_PASSWORD" --password="$KEYSTORE_PASSWORD"

                   
APK_PATH="$ROOT_DIR/platforms/android/app/build/outputs/apk/release/app-release.apk"
if test ! -e "$APK_PATH"; then
  APK_PATH="$ROOT_DIR/platforms/android/build/outputs/apk/app-release.apk"
fi                   
if test ! -e "$APK_PATH"; then
  APK_PATH="$ROOT_DIR/platforms/android/build/outputs/apk/release/android-release.apk"
fi                   

rm -f "$FINAL_APK"
mv "$APK_PATH" "$FINAL_APK"

echo
echo Build is ready:
echo
echo "$FINAL_APK"
echo
echo

if [ "_$1" = _run ]; then
    adb install -r "$FINAL_APK"
    adb logcat -c
    adb logcat | grep chromium
fi
