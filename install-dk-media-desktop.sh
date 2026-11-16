#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.local/bin" "$HOME/.local/share/applications" "$HOME/.local/share/icons/hicolor/256x256/apps"
# Register the approved DK Media Player icon in the user's icon theme.
cp "$ROOT/assets/images/dk-media-player-256.png" "$HOME/.local/share/icons/hicolor/256x256/apps/dkmedia.png"
cat > "$HOME/.local/bin/dkmedia" <<LAUNCH
#!/usr/bin/env bash
set -euo pipefail
cd "$ROOT"
export PYTHONPATH="$ROOT/src\${PYTHONPATH:+:\$PYTHONPATH}"
exec python3 -m dkmedia "\$@"
LAUNCH
chmod +x "$HOME/.local/bin/dkmedia"
cat > "$HOME/.local/share/applications/dkmedia.desktop" <<DESK
[Desktop Entry]
Type=Application
Name=DK Media
Comment=Original DK Media Linux player
Exec=$HOME/.local/bin/dkmedia %F
Terminal=false
Categories=AudioVideo;Player;
Icon=dkmedia
MimeType=audio/*;video/*;
StartupNotify=true
DESK
chmod +x "$HOME/.local/share/applications/dkmedia.desktop"
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
printf '\nDK Media desktop launcher installed.\nRun: %s/.local/bin/dkmedia\n' "$HOME"
