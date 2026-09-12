# DK Media Player

Preservation release of **DK Media v0.1.11**, the original Linux DK Media application before the project expanded into the later media-suite/console line.

DK Media is a Python/Tkinter desktop media player built around VLC/libVLC. This repository keeps the original Player, Library, yt-dlp and P2P functions while adding portable Linux launch/install packaging so the historical build can actually be run on a modern Ubuntu/Debian system.

## Install on Ubuntu / Debian

```bash
git clone git@github.com:dereksparks1982/DK-Media-Player.git
cd DK-Media-Player
./install.sh
```

Then launch **DK Media** from the application menu, or run:

```bash
dkmedia
```

You can also run it directly from the repository without installing the desktop launcher:

```bash
./run-dkmedia.sh
```

## Runtime dependencies

`install.sh` installs the required system packages with APT:

- Python 3 and Tkinter
- VLC / libVLC and python-vlc
- FFmpeg / FFprobe
- yt-dlp
- aria2
- zenity

Manual dependency installation:

```bash
sudo apt update
sudo apt install python3 python3-tk python3-vlc vlc ffmpeg yt-dlp aria2 zenity
```

## Build an installable Debian package

```bash
./packaging/build-deb.sh
```

The package is written to `dist/` as:

```text
dkmedia-original_0.1.11-1_all.deb
```

Install it with:

```bash
sudo apt install ./dist/dkmedia-original_0.1.11-1_all.deb
```

## Original DK Media features

- VLC-backed local video/audio playback
- remembered Open File directory
- original `3T EXT` external-drive behavior with Linux mount discovery fallback
- play/pause, fullscreen, volume and seeking controls
- frame stepping and playback-rate control
- playback position and volume persistence
- local, embedded and manually loaded subtitles
- optional SubDL online subtitle search using the user's own API key
- recent-media Library
- yt-dlp download tab
- aria2 magnet/P2P tab

## External media drive

The original machine used a drive labeled `3T EXT`. DK Media checks the historical path first and then standard Linux removable-media locations. To use another location:

```bash
export DKMEDIA_EXT_PATH="/path/to/media/drive"
./run-dkmedia.sh
```

## SubDL API key

The historical private build contained a personal SubDL API credential. **That credential is not present in this public repository.**

Open a video and choose:

```text
Subtitles → Find Subtitles Online…
```

Enter your own SubDL API key. DK Media stores it in the application's local state for future searches.

## Source layout

```text
src/dkmedia/             DK Media application source
src/dkmedia/addons/      yt-dlp and aria2/P2P integration
packaging/               Debian package builder
DK Media                  portable executable launcher
run-dkmedia.sh            terminal launcher
install.sh                dependency + desktop launcher installer
uninstall-user.sh         remove the user-local launcher
```

The large original Python modules are stored in small ordered source fragments because the GitHub connector used for this preservation upload has per-write size limits. Their public module files concatenate those fragments and execute the original source at import time. This layout was launch-tested after reconstruction.

The complete preservation bundle produced from the supplied archive also retains the historical documentation, regression tests, and original compiled ELF launcher. Those materials are separate from the lean runnable repository and do not affect normal DK Media operation.

## Public-release changes

- removed the private SubDL credential;
- replaced machine-specific launch paths with portable launchers;
- added Ubuntu/Debian dependency installation;
- added desktop-menu installation and removal;
- added Debian package generation;
- retained the original v0.1.11 application behavior rather than redesigning it.

## License

DK Media source is released under **GPL-3.0-or-later**. Third-party dependencies retain their own licenses.
