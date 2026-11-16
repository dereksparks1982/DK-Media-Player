# DK Media Player

## DK Softworks · House of Culture

**DK Softworks** is the studio and project identity. **DK** draws on the Russian abbreviation **ДК** for **Дом культуры** (*Dom kultury*), meaning **“House of Culture.”** Traditionally, a *dom kultury* is a community center for the arts, creativity, performance, and learning.

This identifies the present project or its stewardship; it does not change existing licenses, copyright holders, original creators, or historical credits.


**Current development: DK Media Player is web-only.** The active player runs from `docs/` through GitHub Pages. It will later become part of DK Browser; no new standalone desktop player is being developed.

The repository also contains preserved legacy **DK Media v0.1.11** desktop-era source and documentation, which are historical artifacts, not today's product direction.

The old Python/Tkinter/libVLC code and its former yt-dlp/P2P modules remain untouched for preservation. Current feature development targets the web player only; video downloading will require an explicitly enabled browser/native or optional private service bridge because GitHub Pages cannot run yt-dlp.

## Web player

**[Open DK Media Player in your browser](https://dereksparks1982.github.io/DK-Media-Player/)**

The web player is published from `docs/` through GitHub Pages and works on desktop browsers and phones. Open video/audio files stored on your device, play direct media URLs, manage a session playlist, adjust playback, load SRT/VTT subtitles, and save media links locally in your browser. In DK Browser and browsers supporting the File System Access API, the last selected local file can be remembered through IndexedDB and reloaded at its saved position without picking it again when browser permission remains granted. If permission expires, use **Restore last file**. Firefox and other browsers using session-only file inputs can also click **Restore last file** and select the same movie again to recover the previously saved position. The media player supports normal **0–100% volume** with no Web Audio gain processing, and **mouse-wheel/Up-Down volume changes** (5% steps), plus **double-click the video to enter/exit fullscreen**. Fullscreen and normal playback both use the full video frame without the obsolete 64vh height cap. The picture is fitted without cropping or stretching, with black bars only when the aspect ratios differ. Playback continues uninterrupted. Single-click still plays/pauses (after a short delay to distinguish a double-click), the existing fullscreen button and **F** shortcut work, and **Esc** exits fullscreen.

Web player development is currently independent of both the earlier desktop edition and DK Browser development. GitHub Pages does not stream movies stored on your home computer by itself: remote playback requires a reachable media URL and a browser-supported codec. Local files remain on your device, and saved links do not automatically synchronize across browsers. Firefox and browsers without the required file APIs continue using the standard session-only file input. The former above-100% boost has been removed following reports of audio skipping; saved boosted volumes are clamped to 100% on load. DK Browser development remains separate. No codec or DRM support is added by the player webpage itself.

### Web player interface

The web player uses the approved **Soviet poster** in `docs/images/soviet-poster.png` and transparent **golden hammer-and-sickle wreath with red star** in `docs/images/golden-emblem.png`, using the original image blobs in `assets/images/`. The red-and-gold ДК header icon is preserved, and the earlier SVG background is inactive. The emblem is shown only when the player is empty. Empty-screen instructions now have distinct spacing, and long restore filenames are truncated rather than overflowing. Its functional video area stays black and unfiltered. **YouTube-style seek and playback controls** now overlay the bottom of the movie and fade while playing, returning on pointer movement, pause or focus. The right-click menu and media information panel are outside the overlay controls so they cannot expand or move the picture. The Play button is red and the unnecessary **Save URL to Library** button has been removed. The cursor disappears after **three seconds** of inactivity over a loaded video in normal or fullscreen view, reappears on movement, and stays visible when using controls or menus. Right-clicking the video opens a custom keyboard-accessible context menu for play/pause, queue navigation, speed, SRT/VTT loading and browser-exposed subtitle/audio tracks, chapters when tracks are available, aspect-ratio fitting, picture-in-picture, fullscreen and basic media information (name, duration, resolution, file size when known). Unavailable audio-track selection is visibly disabled rather than claimed to work.

This UI is intentionally reversible: its controls are fully contained in one dedicated source commit, and its background is an independent SVG asset. Local video is never uploaded or duplicated. Expanded title/poster/series metadata discovery requires a separate implementation and provider selection.

### English and Russian interface

The upper-right corner contains only the language selector, offering **English** and **Русский**. Media files are opened using the player or playlist's existing file buttons. The selection is
saved locally in the browser and changes the navigation, player labels, help,
library, notifications, title, and right-click controls without reloading or
stopping playback. Local filenames and media audio are not translated. In Russian mode, the illustrative media URL placeholder is localized (`https://пример.рф/фильм.mp4`); real URLs and user-entered addresses are always kept as-is.

The video right-click menu is grouped into compact, expandable **Playback**,
**Subtitles**, **Audio tracks**, **Speed**, and **Picture** sections, with a direct
**Media information** action. Subtitles is visible immediately on opening the
menu rather than being buried beneath the speed options. Unavailable embedded
MKV subtitle tracks remain clearly labeled as unavailable; an interface
translation does not add codecs to Firefox.

The picture-in-picture and fullscreen controls use matching SVG icons with
the same 36-pixel hit area and vertically centered alignment.

### Up Next playlist, thumbnails and motion previews

The **Up Next** panel keeps the complete loaded playlist, including already
watched items, rather than deleting or hiding each finished episode. A bright
**red rectangular outline** identifies the currently playing movie and moves
to the next video automatically when playback advances. The existing X on
each item is now **red** and manually removes exactly that item. Previously
watched episodes remain available to revisit.

For locally selected videos, the queue generates small, temporary frame
thumbnails in the browser when the format is decodable. Resting the pointer
on a local video item plays a muted, short looping motion preview inside its
thumbnail; moving away stops the preview immediately. The playing film is
never paused or scrubbed. Remote streams and unsupported video codecs retain
the normal icon instead of performing speculative background requests.
No thumbnails are uploaded, synchronized or persistently saved.

### Real TV episode images, Jellyfin image-selection code and ten-second seeking

**Up Next shows real artwork, not text-filled filename cards.** For a local file
named like `Show.Name.S01E04.mkv`, the web player extracts only the series
name, season and episode number and searches **TVmaze** for exact episode
metadata. When that episode has an image, it displays the episode still. A
show/series thumbnail is used when the episode image is absent. Entries with
no verified image retain a plain play icon. The **existing muted motion
preview on pointer hover** is preserved, as are the moving red currently
playing outline and red X removal action.

This implementation incorporates a GPL-licensed adaptation of Jellyfin Web's
`getCardImageUrl` image-priority algorithm from
`src/components/cardbuilder/utils/url.ts`. The original upstream source and
its GPL notice are included in `docs/vendor/jellyfin/`, separate from the
DK Softworks-owned source covered by the custom no-resale license. The
Jellyfin Web server API is not required.

**TVmaze** works without a user API key. Optionally, a user can enter a
**TMDb API Read Access Token** on the Help page to fetch film artwork and
fill missing TV episode pictures; no token is included with the player.
The token is stored only in this browser tab's session storage and can be
cleared. The user can disable automatic artwork lookups. Requests contain
derived title/season/episode identifiers, never the local video bytes,
file handles or full paths. There is no automatic metadata sharing when
automatic lookup is disabled. API responses and images are loaded directly
in the browser over HTTPS. Artwork availability depends on provider data
and the accuracy of video filenames. Credits are provided in the playlist
and Help page. TVmaze data and provider imagery remain subject to provider
terms; TMDb does not endorse this player.

**Ten-second controls:** The main video overlay has a **↶ 10** rewind and
**↷ 10** forward button. Each skips exactly ten seconds, clamped to the
start/end of the current finite-duration media. Seeking does not alter the
playback rate. These controls work in ordinary and fullscreen viewing and
are disabled for non-seekable streams. The right-click ten-second commands
use the same seek behavior. English/Russian labels are provided.

**Add Files** (red) and **Clear Queue** remain above the scrolling Up Next
playlist, directly below the section heading.

### Timeline hover preview

The web player's seek bar now displays a timestamp while hovering, focusing, or dragging. For **local video files**, a second muted, paused HTML video lazily seeks to show a thumbnail without changing the playing video's position. Browsers that cannot decode a separate frame and remote streams without a local blob show a time-only preview; no background remote URL fetch is initiated. Works within normal and fullscreen controls. Touch interaction gets a time hint when scrubbing; no video upload or persistent thumbnail storage.

### Subtitle loading refinements

External SRT files are converted to browser WebVTT with explicit timestamp-line
handling instead of a blanket text replacement. BOM/CRLF, one- to three-digit
milliseconds, cue identifiers and styled dialogue are preserved or normalized
appropriately. Invalid subtitle files are rejected rather than silently
presenting a success message. The top-right language selector keeps its design
and location; only the chevron is inset from the right edge.

### Stop and MKV subtitles

**Stop** now displays the golden emblem again and resets the selected movie's playback position, while keeping the same source ready to **Play** from the beginning without a file picker. Pause continues to retain the picture and resume position. Subtitles are off by default, and the selected browser-exposed subtitle track/language or "off" preference persists locally across viewing sessions. Loading an SRT/VTT file explicitly enables it.

The lightweight `docs/mkv-tracks.js` inspector reads only a bounded portion of a user-selected MKV's header, identifies embedded subtitle track name/language/codec information, and shows it in the right-click menu when available. This **does not mean** Firefox or another browser can actually decode those embedded MKV subtitles. Tracks that cannot be controlled through the browser remain disabled in the menu. Full embedded MKV subtitle decoding and persistent folder access are planned for DK Browser.

## DK Browser integration

[DK Browser](https://github.com/dereksparks1982/dkbrowser) is the separate full Chromium source fork. Its startup/home defaults open this web player. This page implements local file-handle persistence and volume controls without a browser plugin; local file handles stay within the browser's own IndexedDB origin storage. You can delete stored site data to remove those handles. Browser permission prompts are respected.

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

## Application icon

The approved red-and-gold Cyrillic ДК cinema emblem is stored in `assets/images/`, including the untouched original `APPROVED_ORIGINAL_1254.png`. The GitHub Pages player publishes copies of only the required icons from `docs/icons/` because Pages cannot serve files outside its publishing folder. The browser tab, web player header, and phone home-screen shortcut use this approved artwork.

The Linux desktop installer places the 256-pixel icon into the user's icon theme. If you installed DK Media before the icon was added, re-run `./install-dk-media-desktop.sh` to refresh the installed icon. The Debian package builder also includes it.

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

## License and free-use policy

**DK Softworks original code is free to use, including by businesses, but may
not be sold or repackaged for distribution without written permission.**
You may use it in business operations without paying a fee. Selling copies,
charging for access or putting the code into a paid software package is not
permitted under the new **DK Softworks Original Work License v1.0**.

Read the [LICENSE](LICENSE) file for the precise permissions and restrictions.
This is a custom source-available license, not a claim that this particular
no-resale condition is part of the GNU GPL. Previously granted licenses for
earlier releases are not retroactively withdrawn.
