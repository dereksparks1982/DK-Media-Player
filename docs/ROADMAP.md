# DK Kinehall roadmap

**Direction (November 2026):** DK Kinehall is an independent browser-based media player for local files. DK Browser is a separate project. Do not add yt-dlp, download managers, media servers, direct-URL streaming forms, or saved-link libraries to DK Kinehall.

## Implemented in web source
- Single-screen layout with DK Kinehall / ДК Кинехолл branding and English/Russian language selector, without Player/Library/Help navigation.
- Original golden emblem, Open files, Restore last file and drag-and-drop, with a local-file-only welcome sentence.
- Up Next playlist, watched items retained, red current-item border, red X removal and automatic next item.
- Browser-native video/audio playback, stop/reset, seeking, 10-second rewind/forward, volume, speed, fullscreen and picture-in-picture.
- Local-file resume through permissions-based file handles when possible, or user-driven file re-selection.
- External SRT/VTT loading and MKV embedded track metadata inspection without claiming unavailable browser decoding.
- Hover seek frames, muted video previews, TVmaze episode artwork and image fallback/retries, no user token required.
- Cyrillic-only Russian interface.
- Outward-facing Kinehall name in both languages, browser tabs, GitHub Pages, home-screen manifests and desktop launchers; original icon and legacy internal file/state identifiers are unchanged.

## Next major feature: format compatibility
- Research and implement an optional client-side decoder/demuxer fallback for media that the host browser cannot play, potentially using a licensed WebAssembly-based codec engine.
- Preserve native browser playback for supported files, and make decoding limitations and resource costs clear.
- Prioritize MKV, embedded subtitle control, multiple audio tracks, then additional codecs and containers.
- Complete quality and accessibility improvements while preserving the approved layout.
- No compilation or test runs until the project owner requests them.

## Rights and history
- Retain TVmaze attribution and notices for all vendored third-party code.
- The DK Softworks Original Work License v1.0 applies to original DK Softworks-owned material only.
- Original Python/Tkinter/libVLC desktop sources and their historical yt-dlp/P2P features are archived, not active web development.
