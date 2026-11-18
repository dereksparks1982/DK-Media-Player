/* Browser-controlled audio-track selection and local MKV audio descriptors.
 * MKV metadata does not imply audio decoding or track switching is available.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DKAudioTracks = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";
  const normalizeLanguage = value => {
    const lang = String(value || "").toLowerCase().trim().replace(/_/g,"-").split("-")[0];
    return {eng:"en",spa:"es",fre:"fr",fra:"fr",ger:"de",deu:"de",
      rus:"ru",ita:"it",por:"pt",jpn:"ja",kor:"ko",chi:"zh",zho:"zh",
      dut:"nl",nld:"nl",pol:"pl",ukr:"uk",und:""}[lang] || lang;
  };
  const nativeTracks = media => {
    try { return media && media.audioTracks ? Array.from(media.audioTracks) : []; }
    catch (_) { return []; }
  };
  const labelNative = (track, index) => {
    const label = String(track.label || "").trim();
    const language = String(track.language || "").trim();
    if (label) return label + (language && !label.toLowerCase().includes(language.toLowerCase()) ?
      " · " + language : "");
    return (language || "Audio track") + " " + (index + 1);
  };
  const labelEmbedded = track => {
    const lang = String(track.language || "").trim();
    const name = String(track.name || "").trim();
    const title = name || (lang && lang !== "und" ? lang : "Audio track " + track.number);
    const details = [track.codec];
    if (track.channels) details.push(track.channels + (track.channels === 1 ? " channel" : " channels"));
    if (track.sampleRate) details.push(track.sampleRate + " Hz");
    if (track.bitDepth) details.push(track.bitDepth + "-bit");
    if (track.default) details.push("default");
    return title + " · " + details.filter(Boolean).join(" · ");
  };
  const preferenceFor = (track, index) => ({
    index, id:String(track.id || "").slice(0,120),
    label:String(track.label || "").slice(0,160),
    language:String(track.language || "").slice(0,32)
  });
  const preferredIndex = (tracks, preference) => {
    if (!tracks.length || !preference || typeof preference !== "object") return -1;
    if (preference.id) {
      const match = tracks.findIndex(t => String(t.id || "") === preference.id);
      if (match >= 0) return match;
    }
    if (preference.label) {
      const match = tracks.findIndex(t => t.label === preference.label &&
        (!preference.language ||
          normalizeLanguage(t.language) === normalizeLanguage(preference.language)));
      if (match >= 0) return match;
    }
    if (preference.language) {
      const matches = tracks.map((t,i) => ({
        index:i, language:normalizeLanguage(t.language)})).filter(
        m => m.language && m.language === normalizeLanguage(preference.language));
      if (matches.length === 1) return matches[0].index;
    }
    // Positional fallback only when a preference was actually made for this file.
    return Number.isInteger(preference.index) &&
      preference.index >= 0 && preference.index < tracks.length ?
      preference.index : -1;
  };
  const selectNative = (media, index) => {
    const tracks = nativeTracks(media);
    if (!tracks.length || !Number.isInteger(index) || index < 0 || index >= tracks.length)
      return {ok:false,reason:"Browser audio-track selection is unavailable."};
    try {
      tracks.forEach((track,i) => { track.enabled = i === index; });
      const actual = nativeTracks(media);
      if (!actual[index] || actual[index].enabled !== true ||
          actual.some((t,i) => i !== index && t.enabled))
        return {ok:false,reason:"The browser did not activate that audio track."};
      return {ok:true,index,label:labelNative(actual[index],index)};
    } catch (_) {
      return {ok:false,reason:"The browser rejected audio-track switching."};
    }
  };
  return {normalizeLanguage,nativeTracks,labelNative,labelEmbedded,
    preferenceFor,preferredIndex,selectNative};
});
