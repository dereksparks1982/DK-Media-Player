#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
"$ROOT/install-linux-deps.sh"
"$ROOT/install-dk-media-desktop.sh"
printf '\nInstallation complete. Launch DK Media from the application menu or run:\n  %s/.local/bin/dkmedia\n' "$HOME"
