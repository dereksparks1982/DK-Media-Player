# Browser compatibility notes for future DK Browser integration

The DK Media Player web app is currently developed independently of DK Browser.

- **Firefox and local file persistence:** ordinary file inputs cannot grant lasting
  file-handle access. Offer a user-driven reselect path and resume the same
  filename/size/modification-time entry. DK Browser can use the File System
  Access API when user permissions permit it. Never bypass a user's files
  consent.
- **Volume amplification removed:** DK Media Player's volume now stops at
  100%, using the media element's native volume only. The former Web Audio
  boost triggered audio skipping during Firefox testing, so the media player
  no longer creates an AudioContext or routes audio through a GainNode.
  Earlier saved settings greater than 100% are clamped on startup.
  Browser-specific audio investigations belong to the separate DK Browser
  roadmap and must not be mistaken for an implemented feature.
- **Aspect ratio:** fit the video in the entire display or player frame using
  `object-fit: contain`. Black bands are appropriate only for real aspect
  ratio differences or bars embedded in the media itself.
- **Playback formats:** codec support depends on the user's browser. HEVC,
  Matroska and protected playback require separate runtime validation.

No DK Browser repository changes were made for this web player update.
