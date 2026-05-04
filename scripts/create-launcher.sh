#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# create-launcher.sh
# Builds "DC Pomodoro.app" — a double-clickable macOS app that:
#   1. Starts the stable localhost server on :31105 in the background
#   2. Waits for the server to be ready
#   3. Opens http://localhost:31105/ in a browser app window
#   4. Shows a native macOS notification
#
# Run once:  bash scripts/create-launcher.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="DC Pomodoro"
APP_PATH="$PROJECT_DIR/$APP_NAME.app"
ICON_SVG="$PROJECT_DIR/public/icon.svg"
ICONSET_DIR="/tmp/dc-pomodoro.iconset"
ICNS_PATH="/tmp/dc-pomodoro.icns"
QL_TMP="/tmp/dc-pomodoro_ql"
AGENT_LABEL="com.dcpomodoro.localhost"
LEGACY_AGENT_LABEL="com.civjourney.localhost"

echo "🏗  Building $APP_NAME.app …"

# ── Step 1: Render SVG → PNG at multiple sizes (qlmanage built-in) ───────────
echo "  🎨 Generating icon …"
rm -rf "$ICONSET_DIR" "$QL_TMP"
mkdir -p "$ICONSET_DIR" "$QL_TMP"

for SIZE in 16 32 64 128 256 512; do
  # qlmanage writes "<basename>.png" into the output directory
  qlmanage -t -s "$SIZE" -o "$QL_TMP" "$ICON_SVG" 2>/dev/null || true
  SRC="$QL_TMP/icon.svg.png"
  if [ -f "$SRC" ]; then
    cp "$SRC" "$ICONSET_DIR/icon_${SIZE}x${SIZE}.png"
    cp "$SRC" "$ICONSET_DIR/icon_${SIZE}x${SIZE}@2x.png"
    rm "$SRC"
  fi
done

# Fall back to a Python-generated indigo square if qlmanage produced nothing
if [ -z "$(ls -A "$ICONSET_DIR" 2>/dev/null)" ]; then
  echo "  ⚠️  qlmanage produced no output — using Python fallback icon"
  python3 - <<'PYEOF'
import struct, zlib, os

def make_png(size, r, g, b):
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    raw  = b''.join(b'\x00' + bytes([r, g, b] * size) for _ in range(size))
    idat = zlib.compress(raw)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')

d = '/tmp/dc-pomodoro.iconset'
os.makedirs(d, exist_ok=True)
for sz in [16, 32, 64, 128, 256, 512]:
    data = make_png(sz, 99, 102, 241)   # #6366f1 indigo-500
    for suffix in [f'icon_{sz}x{sz}.png', f'icon_{sz}x{sz}@2x.png']:
        open(os.path.join(d, suffix), 'wb').write(data)
PYEOF
fi

# ── Step 2: iconutil → .icns ─────────────────────────────────────────────────
iconutil -c icns "$ICONSET_DIR" -o "$ICNS_PATH" 2>/dev/null || {
  echo "  ⚠️  iconutil failed — app will use default icon"
  ICNS_PATH=""
}

# ── Step 3: Write AppleScript source ─────────────────────────────────────────
echo "  📝 Compiling AppleScript …"
ESC_DIR=$(printf '%s' "$PROJECT_DIR" | sed "s/'/'\\\\''/g")
SCRIPT_TMP="/tmp/dc-pomodoro_launcher.applescript"

# NOTE: "url" is a reserved word in AppleScript → use "launchUrl" instead
cat > "$SCRIPT_TMP" <<APPLESCRIPT
-- DC Pomodoro Launcher
-- Starts the stable localhost server and opens the app in the default browser.

set projectDir to "$ESC_DIR"
set devPort to "31105"
set launchUrl to "http://localhost:31105/"

-- Check if the stable server is already listening on the port
set serverRunning to false
try
    do shell script "curl -sf http://localhost:" & devPort & "/healthz > /dev/null 2>&1"
    set serverRunning to true
on error
    try
        set checkResult to do shell script "lsof -iTCP:" & devPort & " -sTCP:LISTEN 2>/dev/null || true"
        if checkResult is not "" then
            set serverRunning to true
        end if
    end try
end try

-- Start server if needed
if not serverRunning then
    try
        do shell script "launchctl kickstart -k gui/$(id -u)/${AGENT_LABEL} >/dev/null 2>&1 || launchctl kickstart -k gui/$(id -u)/${LEGACY_AGENT_LABEL} >/dev/null 2>&1"
        delay 1
        do shell script "curl -sf http://localhost:" & devPort & "/healthz > /dev/null 2>&1"
        set serverRunning to true
    end try

    if not serverRunning then
        do shell script "cd '" & projectDir & "' && mkdir -p .runtime && nohup /bin/bash -lc 'export PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:\$PATH; cd \"'" & projectDir & "'\"; NODE_BIN=\$(command -v node); if [ -z \"\$NODE_BIN\" ]; then exit 1; fi; exec \"\$NODE_BIN\" scripts/serve-dist.mjs' > .runtime/launcher-server.log 2>&1 &"
    end if

    -- Wait up to 20 s for the server to accept connections
    set waited to 0
    repeat while waited < 20
        delay 1
        set waited to waited + 1
        try
            do shell script "curl -sf http://localhost:" & devPort & "/healthz > /dev/null 2>&1"
            set serverRunning to true
            exit repeat
        end try
    end repeat
end if

-- Open in Google Chrome app mode when available.
set chromeLauncher to "if [ -d '/Applications/Google Chrome.app' ]; then " & ¬
  "open -na 'Google Chrome' --args --app='" & launchUrl & "'; " & ¬
  "elif [ -d '/Applications/Chromium.app' ]; then " & ¬
  "open -na 'Chromium' --args --app='" & launchUrl & "'; " & ¬
  "elif [ -d '/Applications/Brave Browser.app' ]; then " & ¬
  "open -na 'Brave Browser' --args --app='" & launchUrl & "'; " & ¬
  "else " & ¬
  "open '" & launchUrl & "'; " & ¬
  "fi"
do shell script chromeLauncher

-- macOS notification
display notification "Ready at localhost:31105" with title "DC Pomodoro 🎮" subtitle "Gamified Pomodoro Timer" sound name "Submarine"
APPLESCRIPT

# Compile into a real .app bundle
rm -rf "$APP_PATH"
osacompile -o "$APP_PATH" "$SCRIPT_TMP"
rm -f "$SCRIPT_TMP"

# ── Step 4: Inject custom .icns ──────────────────────────────────────────────
if [ -n "$ICNS_PATH" ] && [ -f "$ICNS_PATH" ]; then
  echo "  🖼  Injecting custom icon …"
  cp "$ICNS_PATH" "$APP_PATH/Contents/Resources/applet.icns"
  /usr/libexec/PlistBuddy -c "Set :CFBundleIconFile applet" \
    "$APP_PATH/Contents/Info.plist" 2>/dev/null || true
  touch "$APP_PATH"
  # Ask Finder to refresh icon cache
  osascript -e \
    "tell application \"Finder\" to update item (POSIX file \"$APP_PATH\" as alias)" \
    2>/dev/null || true
fi

# ── Clean up ──────────────────────────────────────────────────────────────────
rm -rf "$ICONSET_DIR" "$QL_TMP" 2>/dev/null || true
[ -f "$ICNS_PATH" ] && rm -f "$ICNS_PATH" || true

echo ""
echo "✅  DC Pomodoro.app created at:"
echo "    $APP_PATH"
echo ""
echo "👉 Double-click DC Pomodoro.app to start playing."
echo "   Drag it to your Dock or Desktop for quick access."
