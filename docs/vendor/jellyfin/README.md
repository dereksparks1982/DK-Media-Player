# Jellyfin Web artwork-priority source

The adjacent `cardImageUrl.ts` is the Jellyfin Web
`src/components/cardbuilder/utils/url.ts` source obtained from the
upstream `jellyfin/jellyfin-web` project (blob
`819b02323e7998e41d23003efb61c7968d377f1b`).

Upstream project: https://github.com/jellyfin/jellyfin-web

License: **GNU GPL version 2 or later**. See `LICENSE.GPL-2.0`.

`../../jellyfin-artwork.js` adapts the image priority/fallback branches
for the browser-only DK Media Player, where provider image URLs are already
resolved by TVmaze or optional TMDB rather than Jellyfin Server.

This vendored material retains its original applicable licensing and
attribution; DK Softworks' separate Original Work License does not relicense
the Jellyfin source.
