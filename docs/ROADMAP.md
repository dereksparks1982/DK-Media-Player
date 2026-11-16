# DK Media Player web-only roadmap

**Status (November 2026):** DK Media Player is a GitHub Pages web application.
Legacy Python desktop sources in this repository are archival only; do not resume
standalone-desktop work. The web player's controls and playback remain independently
usable. It will eventually be integrated inside DK Browser, **not now**.

## Implemented in web source
- English/Russian interface, red Play control and original DK poster/emblem.
- Full Up Next playlist (including watched episodes); red rectangle marks the
  active video and advances as playback moves. Existing removal X is red.
- Every playlist entry displays a deterministic local filename-based title
  card; video frame and embedded-cover extraction are no longer default.
  Muted hover-to-preview remains available for supported local videos.
- Add Files (red) and Clear Queue remain above the scrollable playlist.
- Local video thumbnails and muted hover-to-play previews for queued movies
  and television episodes, without affecting the current video.
- Playlist, URL Library, last-position restore, optional file handle retention.
- External SRT/VTT loading, MKV metadata inspection without pretending to decode it.
- Seek hover timestamp and lazy local-file preview thumbnails; non-seekable or
  unsupported formats fall back to time-only preview.
- Stop resets to emblem and current movie; 3-second cursor hide.

## Next: yt-dlp downloads for the *web player*, not standalone desktop
- GitHub Pages cannot invoke a local executable or run Python. **Do not present a
  fake working Download button.** Implement a stable opt-in bridge contract in the
  web app before exposing download controls.
- Prefer DK Browser's future privileged, user-approved download service when
  available. A separate **optional** user-hosted HTTPS/loopback backend is an
  alternative for ordinary browsers, but must require explicit configuration.
- Never hard-code developer servers, cookies, credentials or arbitrary shell
  commands. Strict input validation, CSRF/origin protections, isolated download
  folder, progress/cancel, rights notices and no autoplay downloads are mandatory.
- Support yt-dlp metadata lookup and user-selected output quality only after
  a secure backend is reachable. No automatic downloads or installation.
- Preserve independent direct file playback even with no download backend.

## Later: DK Browser integration
- DK Browser provides native Matroska codecs, internal subtitles, audio track
  switching and expanded folder access with explicit user consent.
- Embed or deeply integrate the player web UI into DK Browser when core native
  playback is verified. Do not build a separate desktop DK Media Player.
- Neither browser builds nor user test installations are requested at this phase.
