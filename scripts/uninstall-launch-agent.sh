#!/usr/bin/env bash
set -euo pipefail

PLIST_PATH="$HOME/Library/LaunchAgents/com.dcpomodoro.localhost.plist"
LEGACY_PLIST_PATH="$HOME/Library/LaunchAgents/com.civjourney.localhost.plist"

launchctl bootout "gui/$(id -u)" "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl bootout "gui/$(id -u)" "$LEGACY_PLIST_PATH" >/dev/null 2>&1 || true
rm -f "$PLIST_PATH"
rm -f "$LEGACY_PLIST_PATH"

echo "Removed LaunchAgent $PLIST_PATH"
