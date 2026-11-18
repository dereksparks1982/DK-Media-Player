# DK Kinehall roadmap

**Direction (November 2026):** DK Kinehall is a **Chromium-only** local media player, developed for Chromium and the separate DK NetNav Chromium browser project. Do not spend development time on other browser engines or compatibility shims. Do not add yt-dlp, download managers, media servers, direct-URL streaming forms, or saved-link libraries to DK Kinehall.

## Implemented in web source
- Single-screen layout with DK Kinehall / ДК Кинехолл branding and English/Russian language selector, without Player/Library/Help navigation.
- Original golden emblem, Open files, Restore last file and drag-and-drop, with a local-file-only welcome sentence.
- Up Next playlist, watched items retained, red current-item border, red X removal and automatic next item.
- Browser-native video/audio playback, stop/reset, seeking, 10-second rewind/forward, volume, speed, fullscreen and picture-in-picture.
- Local-file resume through permissions-based file handles when possible, or user-driven file re-selection.
- External SRT/VTT loading, MKV subtitle track metadata inspection and local MKV text subtitle extraction (UTF-8/SubRip, ASCII, ASS/SSA) into browser WebVTT tracks. Users can select/off/switch tracks in the right-click menu. ASS styling is simplified to text.
- Initial source support for local MKV PGS bitmap subtitles (S_HDMV/PGS): Matroska packet reading, palette and RLE decoding, multiple composition objects, timestamps, clear frames, canvas overlay, responsive geometry and off/switch controls. Source-only fixtures added; not validated in a browser. VobSub and unhandled encodings remain unavailable.
- MKV audio descriptor scanning (track number, language, codec, name, channel count, sample rate and bit depth); distinguish informational MKV tracks from browser-switchable tracks in the video context menu. Select and remember real native audio tracks per local file when Chromium exposes a working track API. No claim of complete MKV demuxer audio switching or extra codecs.
- Corrected playlist media-file retention so on-demand MKV subtitle extraction receives the actual local `File` object rather than an undefined value.
- Hover seek frames, muted video previews, TVmaze episode artwork and image fallback/retries, no user token required.
- Cyrillic-only Russian interface.
- Outward-facing Kinehall name in both languages, browser tabs, GitHub Pages, home-screen manifests and desktop launchers; original icon and legacy internal file/state identifiers are unchanged.

## Next major feature: format compatibility
- Research and implement an optional client-side decoder/demuxer fallback for media that the host browser cannot play, potentially using a licensed WebAssembly-based codec engine.
- Preserve Chromium's native playback for supported files, and make decoding limitations and resource costs clear.
- Next: implement properly synchronized, tested MKV audio-track switching within the Chromium-targeted player, even when native `audioTracks` is unavailable. Evaluate Chromium-compatible demuxing and supported decoders; account for seeking, playback speed, codec support, licensing and performance. Metadata-only listings do not count as switching.
- Investigate VobSub/remaining bitmap subtitle formats. Avoid presenting metadata-only track listing as playback capability.
- Then add more codec/container compatibility, retaining Chromium-native playback whenever supported.
- Complete quality and accessibility improvements while preserving the approved layout. Keep the approved icon, visuals and existing file/queue workflows; avoid compatibility-only development for other browser engines.
- Matroska, PGS and audio-track source-only fixtures are in `docs/tests/mkv-subtitles.cjs`, `docs/tests/mkv-tracks.cjs`, `docs/tests/pgs-subtitles.cjs` and `docs/tests/audio-tracks.cjs`. They have **not** been run. No compilation or test runs until the project owner requests them.

## Rights and history
- Retain TVmaze attribution and notices for all vendored third-party code.
- The DK Softworks Original Work License v1.0 applies to original DK Softworks-owned material only.
- Original Python/Tkinter/libVLC desktop sources and their historical yt-dlp/P2P features are archived, not active web development.
