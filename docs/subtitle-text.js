/* Subtitle file conversion for native browser text tracks.
   Does not decode subtitles embedded in Matroska containers. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DKSubtitleText = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const clean = input => String(input || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const cueTime = String.raw`(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{1,3})`;
  const pattern = new RegExp("^\\s*" + cueTime + "\\s*-->\\s*" + cueTime + "(.*)$");
  const format = (hours, minutes, seconds, ms) =>
    String(Number(hours || 0)).padStart(2, "0") + ":" + minutes + ":" +
      seconds + "." + ms.padEnd(3, "0");
  function toWebVTT(input, filename) {
    const text = clean(input);
    if (/\.vtt$/i.test(filename)) {
      if (!/^WEBVTT(?:[ \t].*)?(?:\n|$)/.test(text)) throw new Error("Invalid WebVTT header");
      return text;
    }
    if (!/\.srt$/i.test(filename)) throw new Error("Unsupported subtitle type");
    let cues = 0;
    const lines = text.split("\n").map(line => {
      const found = pattern.exec(line);
      if (!found) return line;
      const [all, h1, m1, s1, ms1, h2, m2, s2, ms2, extras] = found;
      if (Number(m1) > 59 || Number(s1) > 59 || Number(m2) > 59 || Number(s2) > 59)
        throw new Error("Invalid subtitle timestamp");
      cues++;
      return format(h1, m1, s1, ms1) + " --> " +
        format(h2, m2, s2, ms2) + extras;
    });
    if (!cues) throw new Error("No subtitle cues found");
    return "WEBVTT\n\n" + lines.join("\n");
  }
  return {toWebVTT};
});