#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="0.1.11-1"
PKG="dkmedia-original"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
PKGROOT="$WORK/${PKG}_${VERSION}_all"
mkdir -p "$PKGROOT/DEBIAN" \
         "$PKGROOT/usr/bin" \
         "$PKGROOT/usr/lib/dkmedia-original/src" \
         "$PKGROOT/usr/share/applications" \
         "$PKGROOT/usr/share/doc/dkmedia-original"

cp -a "$ROOT/src/dkmedia" "$PKGROOT/usr/lib/dkmedia-original/src/"
find "$PKGROOT" -type d -name __pycache__ -prune -exec rm -rf {} +
find "$PKGROOT" -name '*.pyc' -delete
cp "$ROOT/README.md" "$ROOT/PUBLIC_RELEASE_NOTES.md" "$ROOT/THIRD_PARTY_NOTICES.md" "$PKGROOT/usr/share/doc/dkmedia-original/"
gzip -9 -c "$ROOT/docs/changelogs/CHANGELOG.md" > "$PKGROOT/usr/share/doc/dkmedia-original/changelog.gz"
cp "$ROOT/LICENSE" "$PKGROOT/usr/share/doc/dkmedia-original/copyright"

cat > "$PKGROOT/DEBIAN/control" <<CTRL
Package: $PKG
Version: $VERSION
Section: video
Priority: optional
Architecture: all
Depends: python3 (>= 3.10), python3-tk, python3-vlc, vlc, ffmpeg, yt-dlp, aria2, zenity
Maintainer: Elderred Softworks LLC / DKLab
Description: Original DK Media Linux player preservation package
 DK Media v0.1.11 is the original Python/Tkinter and VLC-based DK Media
 application with local playback, library, subtitle, yt-dlp and P2P tools.
CTRL

cat > "$PKGROOT/usr/bin/dkmedia" <<'LAUNCH'
#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH="/usr/lib/dkmedia-original/src${PYTHONPATH:+:$PYTHONPATH}"
exec python3 -m dkmedia "$@"
LAUNCH
chmod 0755 "$PKGROOT/usr/bin/dkmedia"

cat > "$PKGROOT/usr/share/applications/dkmedia.desktop" <<'DESK'
[Desktop Entry]
Type=Application
Name=DK Media
Comment=Original DK Media Linux player
Exec=dkmedia %F
Terminal=false
Categories=AudioVideo;Player;
Icon=video-x-generic
MimeType=audio/*;video/*;
StartupNotify=true
DESK

mkdir -p "$ROOT/dist"
dpkg-deb --root-owner-group --build "$PKGROOT" "$ROOT/dist/${PKG}_${VERSION}_all.deb"
printf 'Built: %s\n' "$ROOT/dist/${PKG}_${VERSION}_all.deb"
