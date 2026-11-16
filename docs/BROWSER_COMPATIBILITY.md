# Browser compatibility notes for future DK Browser integration

The DK Media Player web app is currently developed independently of DK Browser.

- **Firefox and local file persistence:** ordinary file inputs cannot grant lasting
  file-handle access. Offer a user-driven reselect path and resume the same
  filename/size/modification-time entry. DK Browser can use the File System
  Access API when user permissions permit it. Never bypass a user's files
  consent.
- **Web Audio 200% boost:** native HTML media volume stops at 100%; a Web Audio
  GainNode allows actual gain to 200% when the audio graph is allowed.
  Cross-origin streaming audio can be silent when connected to Web Audio
  without a suitable permission response. Investigate a safe, integrated
  solution when DK Browser and DK Media Player are brought together. This
  does not justify disabling browser origin-security protections.
- **Aspect ratio:** fit the video in the entire display or player frame using
  `object-fit: contain`. Black bands are appropriate only for real aspect
  ratio differences or bars embedded in the media itself.
- **Playback formats:** codec support depends on the user's browser. HEVC,
  Matroska and protected playback require separate runtime validation.

No DK Browser repository changes were made for this web player update.
