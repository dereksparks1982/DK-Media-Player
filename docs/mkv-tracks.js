/* Lightweight read-only inspection of subtitle and audio descriptors
 * in a local Matroska header. This never demuxes or decodes an audio stream.
 * Audio switching requires tracks exposed by the browser's native player.
 * No media uploads or third-party downloads.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DKMatroska = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";
  const TRACKS = 0x1654AE6B, ENTRY = 0xAE;
  const TYPE = 0x83, NUMBER = 0xD7, CODEC = 0x86, NAME = 0x536E;
  const LANGUAGE = 0x22B59C, LANGUAGE_IETF = 0x22B59D;
  const DEFAULT = 0x88, FORCED = 0x55AA, AUDIO = 0xE1;
  const CHANNELS = 0x9F, FREQUENCY = 0xB5, BIT_DEPTH = 0x6264;
  const MAX_SCAN = 8 * 1024 * 1024;
  const vint = (bytes, start, stripMarker) => {
    if (start >= bytes.length || !bytes[start]) return null;
    const first = bytes[start];
    let mask = 0x80, width = 1;
    while (!(first & mask) && width < 9) { mask >>= 1; width++; }
    if (width > (stripMarker ? 8 : 4) || start + width > bytes.length) return null;
    let value = stripMarker ? (first & (mask - 1)) : first;
    let unknown = stripMarker && value === mask - 1;
    for (let i = 1; i < width; i++) {
      value = value * 256 + bytes[start + i];
      unknown = unknown && bytes[start + i] === 255;
    }
    if (!Number.isSafeInteger(value)) return null;
    return {value, width, unknown};
  };
  const children = (bytes, start, limit, callback) => {
    let offset = start, count = 0;
    while (offset < limit && count++ < 20000) {
      const id = vint(bytes, offset, false);
      if (!id) break;
      const size = vint(bytes, offset + id.width, true);
      if (!size) break;
      const from = offset + id.width + size.width;
      if (from > limit) break;
      const to = size.unknown ? limit : Math.min(limit, from + size.value);
      if (to < from) break;
      callback(id.value, from, to);
      if (size.unknown || to >= limit) break;
      if (to <= offset) break;
      offset = to;
    }
  };
  const valueOf = (bytes, start, end) => {
    if (end - start > 6) return 0;
    let total = 0;
    for (let i = start; i < end; i++) total = total * 256 + bytes[i];
    return total;
  };
  const sampleRateOf = (bytes, start, end) => {
    const len = end - start;
    if (len !== 4 && len !== 8) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset + start, len);
    const value = len === 4 ? view.getFloat32(0, false) : view.getFloat64(0, false);
    return Number.isFinite(value) && value > 0 && value <= 768000 ?
      Math.round(value * 100) / 100 : null;
  };
  const stringOf = (bytes, start, end) => {
    const content = bytes.subarray(start, Math.min(end, start + 512));
    if (typeof TextDecoder !== "undefined")
      return new TextDecoder("utf-8").decode(content).replace(/\u0000+$/, "");
    return Array.from(content, c => String.fromCharCode(c)).join("").replace(/\u0000+$/, "");
  };
  const parseTracksHeader = data => {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const subtitles = [], audioTracks = [];
    const seen = new Set();
    // Tracks may be enclosed in an unknown-sized Segment, so look for its
    // four-byte EBML ID inside this bounded header sample.
    for (let at = 0; at + 6 < bytes.length; at++) {
      if (bytes[at] !== 0x16 || bytes[at+1] !== 0x54 ||
          bytes[at+2] !== 0xAE || bytes[at+3] !== 0x6B) continue;
      const len = vint(bytes, at+4, true);
      if (!len || len.unknown || len.value < 3) continue;
      const from = at+4+len.width, to = Math.min(bytes.length, from+len.value);
      if (to <= from) continue;
      children(bytes, from, to, (id, start, end) => {
        if (id !== ENTRY) return;
        const track = {number:0, type:0, codec:"", name:"", language:"",
          channels:null, sampleRate:null, bitDepth:null, default:true, forced:false};
        children(bytes, start, end, (key, a, b) => {
          if (key === TYPE) track.type = valueOf(bytes,a,b);
          else if (key === NUMBER) track.number = valueOf(bytes,a,b);
          else if (key === CODEC) track.codec = stringOf(bytes,a,b);
          else if (key === NAME) track.name = stringOf(bytes,a,b);
          else if (key === LANGUAGE) {
            if (!track.language) track.language = stringOf(bytes,a,b);
          } else if (key === LANGUAGE_IETF) track.language = stringOf(bytes,a,b);
          else if (key === DEFAULT) track.default = valueOf(bytes,a,b) !== 0;
          else if (key === FORCED) track.forced = valueOf(bytes,a,b) !== 0;
          else if (key === AUDIO) {
            children(bytes,a,b,(detail,x,y) => {
              if (detail === CHANNELS) track.channels = valueOf(bytes,x,y) || null;
              if (detail === FREQUENCY) track.sampleRate = sampleRateOf(bytes,x,y);
              if (detail === BIT_DEPTH) track.bitDepth = valueOf(bytes,x,y) || null;
            });
          }
        });
        if (!track.number || !track.codec || (track.type !== 2 && track.type !== 17)) return;
        const fingerprint = track.type + "|" + track.number;
        if (seen.has(fingerprint)) return;
        seen.add(fingerprint);
        const common = {number:track.number,codec:track.codec,name:track.name,
          language:track.language || "und"};
        if (track.type === 17) subtitles.push(common);
        else audioTracks.push({...common,channels:track.channels,sampleRate:track.sampleRate,
          bitDepth:track.bitDepth,default:track.default,forced:track.forced});
      });
      if (subtitles.length || audioTracks.length) break;
    }
    return {subtitles,audioTracks};
  };
  const parseHeader = data => parseTracksHeader(data).subtitles;
  const inspectFile = async file => {
    if (!file || !/\.mkv$/i.test(file.name || "") || typeof file.slice !== "function")
      return {tracks:[],audioTracks:[],truncated:false};
    const bytes = new Uint8Array(await file.slice(0, MAX_SCAN).arrayBuffer());
    const parsed = parseTracksHeader(bytes);
    return {tracks:parsed.subtitles,audioTracks:parsed.audioTracks,
      truncated:file.size > bytes.length};
  };
  return {parseHeader,parseTracksHeader,inspectFile};
});
