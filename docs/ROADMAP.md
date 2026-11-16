# DK Media Player web-only roadmap

**Status (November 2026):** DK Media Player is a GitHub Pages web application.
Legacy Python desktop sources in this repository are archival only; do not resume
standalone-desktop work. The web player's controls and playback remain independently
usable. It will eventually be integrated inside DK Browser, **not now**.

## Implemented in web source
- Episode artwork lookup now tolerates punctuation/spacing differences
  (including Butt-Head / Butthead), Sxx.Exx numbering, retries transient
  provider errors, and falls back to verified series posters. Each thumbnail
  exposes its lookup status and the playlist retries once automatically.
- Debugging priority: verify real browser/network image delivery against
  actual episode filenames and check CDN, API errors, and CORS restrictions.

- English/Russian interface, red Play control and original DK poster/emblem.
- Full Up Next playlist (including watched episodes); red rectangle marks the
  active video and advances as playback moves. Existing removal X is red.
- TVmaze episode metadata lookup by parsed local filename; verified episode
  still images prioritized with Jellyfin Web's GPL-licensed image algorithm.
  No video bytes or file paths are uploaded. Unmatched files retain an icon.
- Optional user-supplied TMDb token for movie artwork and TV fallback, kept
  only in the current browser-tab session; lookup can be disabled.
- Muted hover-to-preview remains available for supported local videos.
- Ten-second backward/forward buttons in normal/fullscreen playback with
  disabled state for live/non-seekable media and Russian labels.
- Add Files (red) and Clear Queue remain above the scrollable playlist.
- Muted hover-to-play previews for local queued videos without affecting current playback.
- Playlist, URL Library, last-position restore, optional file handle retention.
- External SRT/VTT loading, MKV metadata inspection without pretending to decode it.
- Seek hover timestamp and lazy local-file preview thumbnails; non-seekable or
  unsupported formats fall back to time-only preview.
- Stop resets to emblem and current movie; 3-second cursor hide.

## Metadata providers and attribution

- TVmaze is the default no-key TV episode image provider; check matching,
  provider coverage, rate limiting and CC BY-SA attribution.
- TMDb is optional and uses an API Read Access Token supplied by each user.
- Jellyfin's open-source image-priority source is vendored with its GPL license.
- The original DK Softworks license applies to independently owned code only.
- Future: optional metadata overrides, local artwork, artwork cache with
  expiry and storage controls; do not guess episode identities on ambiguity.

## DK Softworks code license

- New distributions of original DK Softworks-owned material carry the
  **DK Softworks Original Work License v1.0**: free use by everyone,
  including businesses, with no sale, paid access, or repackaging for
  redistribution without written permission.
- Keep authorship/copyright notices intact. Earlier grants remain valid
  for releases previously published under those terms.
- Changes of licensing and ownership must not be silently applied to material
  DK Softworks does not control.

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
