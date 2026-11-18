# DK Kinehall: Chromium target

DK Kinehall is a **Chromium-only** local media player. The primary target is the Chromium engine used by **DK NetNav** (the separate browser project), along with Chromium itself. Other browser engines are outside the project scope. Do not spend DK Kinehall development time on compatibility shims, separate code paths, or test matrices for other engines.

## Local files and saved playback

- Use Chromium's `showOpenFilePicker` and File System Access permission model for user-selected media. Handle references may be stored in origin-scoped IndexedDB; file bytes are never uploaded.
- Maintain drag-and-drop and ordinary file inputs as **Chromium permission/context fallbacks**, not as support commitments to other browser engines. These temporary inputs cannot silently reopen a file.
- Respect permission prompts and allow the user to reselect a file if a previously approved handle expires.
- Never read arbitrary directories without explicit user permission.

## Playback, subtitles and audio

- Prefer native Chromium video/audio decoding whenever a format is supported; do not claim codecs are implemented merely because metadata is visible.
- MKV header inspection and text/PGS subtitle readers are local, with known limitations documented in README.
- A usable MKV audio-track selector must actually demux/decode/synchronize a selectable track. `audioTracks` support may vary even among Chromium builds, and a list of MKV track descriptors is not playback.
- Focus future codec, container and audio-track work **on Chromium and DK NetNav**. Codec licensing and DRM constraints continue to apply.

## Interface and project boundaries

- Preserve the approved DK Kinehall icon, English/Russian interface and player appearance.
- DK NetNav lives in its own repository. Work here does not automatically change that browser.
- README must describe actual implemented features, not promise unverified functionality. No compilation, browser testing or GitHub Actions until the project owner asks.
