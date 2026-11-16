/* DK Media Player web-only source checks. Run: node docs/tests/web-player-smoke.cjs */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const js = fs.readFileSync(path.join(root, "player.js"), "utf8");
const css = fs.readFileSync(path.join(root, "player.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
new Function(js);
assert.match(js, /screen\.addEventListener\("dblclick"/);
assert.match(js, /const toggleFullscreen = async/);
assert.match(js, /await openLocalFiles\(false\)/);
assert.match(js, /state\.restorePickerPending/);
assert.match(js, /"temporary-file"/);
assert.doesNotMatch(js, /createMediaElementSource|createGain|AudioContext|enableAudioBoost|volumeGain/);
assert.match(js, /media\.volume = volumePercent \/ 100/);
assert.match(js, /Math\.min\(100,/);
assert.doesNotMatch(js, /Math\.min\(200,/);
assert.match(html, /id="volume" min="0" max="100"/);
assert.doesNotMatch(html, /id="volume" min="0" max="200"/);
assert.match(html, /class="speaker-icon"/);
assert.match(html, /id="volumeValue"/);
assert.doesNotMatch(html, /id="mute"[^>]*>🔊/);
assert.match(css, /\[hidden\]\s*\{\s*display:none\s*!important/);
assert.match(css, /\.screen video\s*\{[^}]*max-height:none/);
assert.match(css, /\.volume-icon-button\s*\{\s*color:var\(--accent\)/);
console.log("PASS: web player source checks");

assert.match(html, /id="screenControls"/);
assert.match(html, /id="playerContextMenu"/);
assert.match(html, /id="mediaInfo"/);
assert.ok(html.indexOf('id="screenControls"') < html.indexOf('class="now-playing"'),
  "seek and controls should be inside the video frame");
assert.match(css, /\.screen > \.controls\s*\{/);
assert.match(css, /\.screen\.ui-hidden > \.controls/);
assert.match(css, /\.player-context-menu\s*\{/);
assert.match(css, /images\/soviet-poster\.png/);
assert.match(js, /screen\.addEventListener\("contextmenu"/);
assert.match(js, /addMenuItem\("Subtitles off"/);
assert.match(js, /Track selection not exposed by this browser/);
assert.match(js, /addMenuItem\("Media information"/);

assert.match(html, /src="\.\/images\/golden-emblem\.png"/);
assert.match(html, /src="\.\/icons\/dk-media-player-128\.png"/);
assert.doesNotMatch(html, /id="saveCurrent"|Save URL to Library/);
assert.doesNotMatch(js, /byId\("saveCurrent"\)/);
assert.match(css, /\.screen \.controls #playPause\s*\{/);
assert.match(css, /background:#d82e3c/);
assert.match(css, /\.screen\.cursor-hidden/);
assert.match(js, /cursorIdleTimer = setTimeout/);
assert.match(js, /\}, 3000\)/);
assert.match(js, /screen\.addEventListener\("pointermove", showCursor\)/);
assert.match(html, /<\/div>\s*<\/div>\s*<div id="playerContextMenu"/);
assert.match(html, /id="mediaInfoDetails"><\/dl><\/div>\s*<\/div>\s*<div class="now-playing"/);

assert.match(html, /id="emptyTitle"/);
assert.match(html, /id="emptyDescription"/);
assert.doesNotMatch(html, /Original DK Media|Browser Edition|Your videos and music, on your device/);
assert.match(html, /src="\.\/mkv-tracks\.js\?/);
assert.match(js, /const stopCurrent = \(\) =>/);
assert.match(js, /screen\.classList\.add\("empty", "stopped"\)/);
assert.match(js, /screen\.classList\.remove\("empty", "stopped"\)/);
assert.match(js, /delete state\.resume\[item\.key\]/);
assert.match(css, /\.screen\.stopped > \.controls/);
assert.match(js, /subtitlePreference: "dkmedia\.web\.subtitle-preference\.v1"/);
assert.match(js, /const applySubtitlePreference = \(\) =>/);
assert.match(js, /media\.textTracks\.addEventListener\("addtrack"/);
assert.match(js, /track\.default = false/);
assert.match(js, /DKMatroska\.inspectFile\(file\)/);
assert.match(js, /MKV embedded tracks \(file header\)/);

/* English / Russian switch and compact context-menu regression checks. */
const locale = fs.readFileSync(path.join(root, "i18n.js"), "utf8");
new Function(locale);
assert.match(html, /id="languageSelect"[^>]*>/);
assert.match(html, /<option value="en">English<\/option>/);
assert.match(html, /<option value="ru">Русский<\/option>/);
assert.doesNotMatch(html, /id="openHeader"/);
assert.doesNotMatch(js, /byId\("openHeader"\)|"openHeader"/);
assert.match(html, /id="openEmpty"/);
assert.match(html, /id="addQueueFiles"/);
assert.ok(html.indexOf('src="./i18n.js?') < html.indexOf('src="./player.js?'));
assert.match(js, /const addMenuHeading = label =>/);
assert.match(js, /className = "context-section-toggle"/);
assert.match(js, /activeMenuSection = contextMenu/);
assert.ok(js.indexOf('addMenuHeading("Subtitles")') < js.indexOf('addMenuHeading("Speed")'));
assert.match(js, /contextMenu\.querySelectorAll\("\.context-section-items"\)/);
assert.match(js, /window\.DKLocale\.apply\(\)/);
assert.match(css, /\.player-context-menu \.context-section-toggle/);
assert.match(css, /\.screen \.controls \.player-tool-button/);
assert.match(html, /id="pip"[^>]*><svg class="player-tool-icon"/);
assert.match(html, /id="fullscreen"[^>]*><svg class="player-tool-icon"/);
assert.match(locale, /MutationObserver/);
assert.match(locale, /document\.documentElement\.lang = language/);

// Subtitle files use a separately testable parser; do not rewrite dialogue lines.
assert.match(html, /src="\.\/subtitle-text\.js\?/);
assert.match(js, /DKSubtitleText\.toWebVTT\(await file\.text\(\), file\.name\)/);
assert.match(css, /background-position:right 17px center/);
assert.match(css, /appearance:none;-webkit-appearance:none/);

/* YouTube-style hover preview is separate from the playing media. */
assert.match(html, /id="seekPreview"/);
assert.match(html, /id="previewFrame"/);
assert.match(html, /src="\.\/seek-preview\.js\?/);
assert.match(js, /DKSeekPreview\.attach/);
assert.match(js, /seekPreview\.reset\(\)/);
assert.match(css, /\.seek-preview\.has-frame/);

/* Full queue keeps watched entries; red marker advances with playback.
   Reuse the existing red X for manual removal. */
assert.match(js, /const pending = state\.queue/);
assert.match(js, /if \(index === state\.current\)/);
assert.match(js, /li\.classList\.add\("current"\)/);
assert.match(js, /li\.setAttribute\("aria-current", "true"\)/);
assert.match(js, /const remove = document\.createElement\("button"\)/);
assert.match(js, /remove\.textContent = "×"/);
assert.match(js, /media\.addEventListener\("ended"/);
assert.match(js, /load\(state\.current \+ 1\)/);
assert.match(css, /\.queue li\.current/);
assert.match(css, /\.queue \.icon-btn\.remove \{ color:#ff5a62/);
assert.match(html, /src="\.\/queue-hover\.js\?/);
assert.match(js, /DKQueueHover\.create/);
assert.match(css, /\.queue \.queue-artwork/);
assert.match(css, /\.queue \.queue-hover-video/);

/* Embedded cover extraction remains archived, not part of default title cards. */

/* All list items use filename title cards, no random extracted frame. */
assert.match(html, /src="\.\/title-card\.js\?/);
assert.doesNotMatch(html, /src="\.\/queue-artwork\.js\?/);
assert.match(js, /DKTitleCard\.parse\(item\.name\)/);
assert.match(js, /queue-title-card/);
assert.doesNotMatch(js, /DKQueueArtwork\.create/);
assert.match(css, /\.queue \.queue-title-card/);
assert.ok(html.indexOf('id="addQueueFiles"') < html.indexOf('id="queue"'));
assert.ok(html.indexOf('id="clearQueue"') < html.indexOf('id="queue"'));
assert.match(css, /\.sidebar-top #addQueueFiles\{background:#d83a42/);
