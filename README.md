# DK Kinehall

## DK Softworks · House of Culture

**DK Softworks** is the studio and project identity. **DK** draws on the Russian abbreviation **ДК** for **Дом культуры** (*Dom kultury*), meaning **“House of Culture.”** Traditionally, a *dom kultury* is a community center for the arts, creativity, performance, and learning.

This identifies the present project or its stewardship; it does not change existing licenses, copyright holders, original creators, or historical credits.


**Current development: DK Kinehall is web-only.** Its web interface displays
**DK Kinehall** in English and **ДК Кинехолл** in Russian. The repository is
[`dkkinehall`](https://github.com/dereksparks1982/dkkinehall). Legacy
source identifiers, saved-media settings, historical DK Media releases,
licensing and original attribution remain unchanged. The active player runs
independently from `docs/` through GitHub Pages. DK NetNav is a separate
browser project; integration is not part of this name update. The existing
approved red-and-gold app icon is retained.

The repository also contains preserved legacy **DK Media v0.1.11** desktop-era source and documentation, which are historical artifacts, not today's product direction.

The old Python/Tkinter/libVLC code and its former yt-dlp/P2P modules remain untouched for preservation. Current web-player development targets local files only: no downloading, media server, saved streaming links or direct URL entry. yt-dlp belongs to the separate DK Browser project.

## Web player

The Russian interface displays **Cyrillic-only text**, including provider names
(«ТВмейз», «ТМДБ»), attribution, help copy, tooltips, controls and notifications.
Unknown display text is transliterated rather than left in English; underlying
media names, links and external API identifiers are not modified.


**[Open DK Kinehall in your browser](https://dereksparks1982.github.io/dkkinehall/)**

The web player is published from `docs/` through GitHub Pages and works on desktop browsers and phones. Open video/audio files stored on your device, manage a session playlist, adjust playback and load SRT/VTT subtitles. In DK Browser and browsers supporting the File System Access API, the last selected local file can be remembered through IndexedDB and reloaded at its saved position without picking it again when browser permission remains granted. If permission expires, use **Restore last file**. Firefox and other browsers using session-only file inputs can also click **Restore last file** and select the same movie again to recover the previously saved position. The media player supports normal **0–100% volume** with no Web Audio gain processing, and **mouse-wheel/Up-Down volume changes** (5% steps), plus **double-click the video to enter/exit fullscreen**. Fullscreen and normal playback both use the full video frame without the obsolete 64vh height cap. The picture is fitted without cropping or stretching, with black bars only when the aspect ratios differ. Playback continues uninterrupted. Single-click still plays/pauses (after a short delay to distinguish a double-click), the existing fullscreen button and **F** shortcut work, and **Esc** exits fullscreen.

Web player development is currently independent of both the earlier desktop edition and DK Browser development. GitHub Pages does not stream movies stored on your home computer by itself: playback depends on the browser's supported codecs. Local files remain on your device. Firefox and browsers without the required file APIs continue using the standard session-only file input. The former above-100% boost has been removed following reports of audio skipping; saved boosted volumes are clamped to 100% on load. DK Browser development remains separate. No codec or DRM support is added by the player webpage itself.

### Web player interface

The web player uses the approved **Soviet poster** in `docs/images/soviet-poster.png` and transparent **golden hammer-and-sickle wreath with red star** in `docs/images/golden-emblem.png`, using the original image blobs in `assets/images/`. The red-and-gold ДК header icon is preserved, and the earlier SVG background is inactive. The emblem is shown only when the player is empty. Empty-screen instructions now have distinct spacing, and long restore filenames are truncated rather than overflowing. Its functional video area stays black and unfiltered. **YouTube-style seek and playback controls** now overlay the bottom of the movie and fade while playing, returning on pointer movement, pause or focus. The right-click menu and media information panel are outside the overlay controls so they cannot expand or move the picture. The Play button is red and local-file playback stays the focus. The cursor disappears after **three seconds** of inactivity over a loaded video in normal or fullscreen view, reappears on movement, and stays visible when using controls or menus. Right-clicking the video opens a custom keyboard-accessible context menu for play/pause, queue navigation, speed, SRT/VTT loading and browser-exposed subtitle/audio tracks, chapters when tracks are available, aspect-ratio fitting, picture-in-picture, fullscreen and basic media information (name, duration, resolution, file size when known). Unavailable audio-track selection is visibly disabled rather than claimed to work.

This UI is intentionally reversible: its controls are fully contained in one dedicated source commit, and its background is an independent SVG asset. Local video is never uploaded or duplicated. Expanded title/poster/series metadata discovery requires a separate implementation and provider selection.

### English and Russian interface

The upper-right corner contains only the language selector, offering **English** and **Русский**. Media files are opened using the player or playlist's existing file buttons. The selection is
saved locally in the browser and changes the navigation, player labels, help,
notifications, title, and right-click controls without reloading or
stopping playback. Local filenames and media audio are not translated. In Russian mode, the illustrative media URL placeholder is localized (`https://пример.рф/фильм.mp4`); real URLs and user-entered addresses are always kept as-is.

The video right-click menu is grouped into compact, expandable **Playback**,
**Subtitles**, **Audio tracks**, **Speed**, and **Picture** sections, with a direct
**Media information** action. Subtitles is visible immediately on opening the
menu rather than being buried beneath the speed options. Unavailable embedded
MKV subtitle tracks remain clearly labeled as unavailable; an interface
translation does not add codecs to Firefox.

The picture-in-picture and fullscreen controls use matching SVG icons with
the same 36-pixel hit area and vertically centered alignment.

### Single-screen local player

DK Kinehall now opens directly to the original player screen without Player, Library
or Help navigation. The header has only DK Kinehall and its language selector.
The welcome text reads “Choose a video or music file from this device.” The
existing emblem, Open files, Restore last file, drag-and-drop, Up Next playlist,
subtitles and media controls remain. The direct URL entry and saved-links
library are removed. There is no TMDb token prompt. The footer keeps only
“DK Kinehall · DK Softworks”.

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

### Episode-artwork matching and recovery refinements

Automatic artwork now recognizes more real-world season/episode filename
patterns, including `S01.E04`, `S01E04`, and `1x04`. The TVmaze title
matcher tolerates spacing and punctuation differences such as
`Mike.Judges.Beavis.and.Butthead` versus `Mike Judge's Beavis and Butt-Head`
without accepting ambiguous series matches. Queries continue sending
**only a parsed show title and episode numbers**, never media bytes.

Temporary TVmaze request failures (rate limiting, 5xx and network problems)
are retried up to two additional times with a bounded delay. If a specific
episode image is not present, the matching TV series poster may be displayed;
if an episode image fails to load, the card tries the series image. The
playlist makes one additional automatic retry for an unmatched image after
a short delay, grouping retry work across queued episodes. Artwork tiles
now expose a tooltip reporting the lookup state and reason an image is
missing. A failed lookup no longer permanently blocks new attempts.

Images may still be unavailable if a provider has no artwork, the browser
cannot reach its API or CDN, or the file lacks an identifiable episode code.
The player keeps the plain play icon in those cases instead of inventing
title-card artwork. No video content is uploaded, and playback remains
unaffected. Tests cover the actual Beavis and Butt-Head title discrepancy,
request failure/retry, series fallback, and simulated image-load recovery.
Artwork code is source-tested but still requires real browser verification.

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
**TMDb API Read Access Token** in the older Help interface to fetch film artwork.
This field and the Help page are removed from the current player. TVmaze
episode images load automatically with no user token, and TMDb lookups are
inactive. Requests contain
derived title/season/episode identifiers, never the local video bytes,
file handles or full paths. There is no automatic metadata sharing when
automatic lookup is disabled. API responses and images are loaded directly
in the browser over HTTPS. Artwork availability depends on provider data
and the accuracy of video filenames. Credits are provided in the playlist
and Help page. TVmaze data and provider imagery remain subject to provider
terms; TMDb does not endorse this player.

**Ten-second controls:** The main video overlay has rewind and forward
buttons with dedicated SVG curved-arrow icons and centered “10” labels.
The vector icons no longer rely on font glyph alignment and retain clear
spacing at smaller widths and in fullscreen. Each skips exactly ten seconds,
clamped to the start/end of the current finite-duration media. Seeking does not
alter playback rate. Controls remain disabled for non-seekable streams; the
right-click commands use the same seeking behavior. English/Russian
accessibility labels are preserved.

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
git clone git@github.com:dereksparks1982/dkkinehall.git
cd dkkinehall
./install.sh
```

Then launch **DK Kinehall** from the application menu, or run:

```bash
dkmedia
```

You can also run it directly from the repository without installing the desktop launcher:

```bash
./run-dkmedia.sh
```

## Application icon

The approved red-and-gold Cyrillic ДК cinema emblem is stored in `assets/images/`, including the untouched original `APPROVED_ORIGINAL_1254.png`. The GitHub Pages player publishes copies of only the required icons from `docs/icons/` because Pages cannot serve files outside its publishing folder. The browser tab, web player header, and phone home-screen shortcut use this approved artwork.

The Linux desktop installer places the 256-pixel icon into the user's icon theme. If you installed the legacy DK Media edition before the icon was added, re-run `./install-dk-media-desktop.sh` to refresh the installed icon. The Debian package builder also includes it.

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
