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

## November 17, 2026: queue and playback control sizing

The Up Next queue uses taller items and taller artwork with **no increase in sidebar or thumbnail width**. Previous/Next are visually enlarged, while Play/Pause, Stop and 10-second skip buttons share the same-sized transport-button boxes (Play/Pause remains red). These changes are in web source; no browser/automated validation has been performed yet.

## Web player

The Russian interface displays **Cyrillic-only text**, including provider names
(«ТВмейз», «ТМДБ»), attribution, help copy, tooltips, controls and notifications.
Unknown display text is transliterated rather than left in English; underlying
media names, links and external API identifiers are not modified.


**[Open DK Kinehall in your browser](https://dereksparks1982.github.io/dkkinehall/)**

DK Kinehall targets **Chromium exclusively**, including the Chromium engine used by DK NetNav. The GitHub Pages web player is published from `docs/` and is developed against Chromium APIs, not against other browser engines. Open video/audio files stored on your device, manage the playlist, and load subtitles. Chromium's File System Access API can retain user-approved file handles in IndexedDB and restore the last media file and playback position. If access expires, **Restore last file** requests permission or lets you reselect the file. A standard file-input path remains as a Chromium fallback when the picker API is unavailable; it does not provide persistent file access. The player offers **0–100% volume**, mouse-wheel/Up-Down volume changes, double-click fullscreen, picture fitting without distortion, and seek/playback controls. It uses native Chromium decoding when available; codecs requiring additional decoding remain separate roadmap work.

DK Kinehall is a Chromium-targeted player and is developed separately from the historical desktop edition and DK NetNav browser. GitHub Pages does not stream movies stored on your home computer by itself. Selected local files stay on your device, and playback is limited to formats supported by Chromium or by codecs explicitly implemented in Kinehall. Previously saved volume values above 100% are clamped on load. The web player does not bypass DRM. See [Chromium target notes](docs/CHROMIUM_TARGET.md) for platform boundaries.

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
menu rather than being buried beneath the speed options. Text subtitles
embedded in local MKV files can now be extracted and switched on from this
menu when the codec is supported. Supported **PGS bitmap subtitles** can now
be selected in the same menu and drawn on a transparent overlay. DVD VobSub
and unknown subtitle codecs remain visibly unavailable. When the browser
exposes audio-track controls, the **Audio tracks** menu also switches between
those tracks and remembers the chosen track for that local file. For MKV files,
it shows codec, language, channels, and sample rate from the file header,
but metadata-only tracks are disabled so they cannot be mistaken for switchable
audio. Full MKV audio-track switching remains future work where Chromium does
not provide a usable native track-selection API.

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

The lightweight `docs/mkv-tracks.js` inspector reads a bounded part of each
selected MKV header to identify embedded subtitle tracks (language, name,
codec, and track number). When you right-click the video, open **Subtitles**
and select one of the embedded text tracks. The new
`docs/mkv-subtitles.js` reader scans the local file using bounded
`File.slice()` windows, extracts timed subtitle blocks, and converts them into
a browser-native WebVTT track. **SubRip / UTF-8, ASCII, and ASS/SSA text
subtitles** are supported, including ASS/SSA dialogue with basic line breaks;
complex ASS positioning, fonts, animations and styling are not reproduced.
Selected subtitles can be turned **off** or switched to another available
track; an in-progress scan is cancelled when the video or subtitle choice
changes. External SRT/VTT loading still works.

The extraction runs entirely on the device, without uploading the movie or
loading third-party code. Large MKV files may take time to scan on first
selection. A safety cap limits oversized subtitle payloads or cue collections.
### Bitmap MKV subtitle support (PGS)

`docs/pgs-subtitles.js` now provides a **local PGS bitmap decoder** for
Matroska `S_HDMV/PGS` subtitle tracks. Its source handles presentation
compositions, per-track timestamps, palette updates, fragmented image objects,
run-length encoded indexed pixels, subtitle clearing and seek-time frame
selection. Graphics are drawn over the movie on a transparent canvas aligned
to the visible video picture (including letterboxing, resize, normal view and
fullscreen). Select an embedded PGS subtitle under the video right-click
**Subtitles** menu. **Subtitles off** or selecting another track removes the
PGS image; switching files stops any ongoing scan. All movie and subtitle
data stay on the user's device. Both the text and PGS readers use bounded
file slices, and image size / collection caps prevent excessive allocations.

**Limitations:** This is initial source-only PGS support. Some unusual,
complex, unsupported or malformed PGS encodings may not render correctly.
**DVD VobSub, other bitmap subtitle codecs, and video/audio codecs unsupported
by the host browser remain unsupported.** Decoding subtitle graphics does
not make an otherwise unplayable MKV playable. PGS and Matroska source fixtures
are included but have not been run at the owner's request. No FFmpeg/WASM
video decoder or third-party runtime package was introduced. Full format
compatibility, Chromium MKV audio-track switching and persistent folder
access remain separate future work.

### MKV audio tracks

The local `docs/mkv-tracks.js` inspector now reads MKV audio descriptions
alongside subtitle descriptions. `docs/audio-tracks.js` provides track
selection **only when the browser exposes working native audio-track controls**.
Right-click the video and open **Audio tracks** to select a browser track.
Selections are remembered per local file without uploading the file or
changing codec settings. When Chromium does not expose that API, MKV audio
descriptions are marked **information only** and are not clickable. This does
**not** demux MKV audio or add AAC/AC3/DTS/other decoders.

The media player now retains the selected local `File` object for the current
playlist item so the existing MKV text and PGS subtitle readers can access
its bytes when you select an embedded subtitle track. All extraction stays
local to your browser. Source-only fixtures have been added for MKV audio
descriptors and browser audio selection; they have not been executed.

## DK NetNav and Chromium

[DK NetNav](https://github.com/dereksparks1982/dknetnav) is the separate Chromium-based browser project. DK Kinehall targets that engine and other Chromium builds, without maintaining compatibility branches for unrelated engines. Its local file handles live within the page origin's IndexedDB storage. Chromium's file permissions are always respected. Kinehall and DK NetNav remain separate repositories; this branding and platform decision does not itself claim any new integration.

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
