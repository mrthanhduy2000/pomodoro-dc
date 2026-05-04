#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/com.civjourney.localhost.plist"
LOG_DIR="$PROJECT_DIR/.runtime"
ESCAPED_PROJECT_DIR="$(printf '%s' "$PROJECT_DIR" | sed "s/'/'\\\\''/g")"
START_COMMAND="export PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:\$PATH; cd '$ESCAPED_PROJECT_DIR'; NODE_BIN=\$(command -v node); if [ -z \"\$NODE_BIN\" ]; then echo 'Node not found'; exit 1; fi; exec \"\$NODE_BIN\" scripts/serve-dist.mjs"

mkdir -p "$LOG_DIR" "$HOME/Library/LaunchAgents"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.civjourney.localhost</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>${START_COMMAND}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>CIVJOURNEY_PORT</key>
    <string>31105</string>
    <key>CIVJOURNEY_HOST</key>
    <string>0.0.0.0</string>
  </dict>
  <key>KeepAlive</key>
  <true/>
  <key>RunAtLoad</key>
  <true/>
  <key>WorkingDirectory</key>
  <string>${PROJECT_DIR}</string>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/civjourney-server.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/civjourney-server.err.log</string>
</dict>
</plist>
PLIST

launchctl bootout "gui/$(id -u)" "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
launchctl kickstart -k "gui/$(id -u)/com.civjourney.localhost"

echo "Installed LaunchAgent at $PLIST_PATH"
echo "CivJourney will now keep localhost:31105 alive after login."
