#!/usr/bin/env bash
set -euo pipefail
rm -f "$HOME/.local/bin/dkmedia" "$HOME/.local/share/applications/dkmedia.desktop"
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
printf 'Removed the user-local DK Media launcher. Project files and media were not touched.\n'
