#!/usr/bin/env bash
set -euo pipefail
if ! command -v apt-get >/dev/null 2>&1; then
  echo "This installer currently supports Debian/Ubuntu-family systems with apt." >&2
  echo "Required runtime: Python 3 + Tk, VLC/libVLC + python-vlc, FFmpeg, yt-dlp, aria2, zenity." >&2
  exit 1
fi
sudo apt-get update
sudo apt-get install -y python3 python3-tk python3-vlc vlc ffmpeg yt-dlp aria2 zenity
printf '\nDK Media Linux dependencies installed.\n'
