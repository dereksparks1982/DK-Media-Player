/* Lightweight read-only inspection of embedded subtitle track descriptors
 * in a local Matroska file header. Does not demux/play tracks, copy the movie,
 * send bytes to a server, or require third-party downloads.
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
  const stringOf = (bytes, start, end) => {
    const content = bytes.subarray(start, Math.min(end, start + 512));
    if (typeof TextDecoder !== "undefined")
      return new TextDecoder("utf-8").decode(content).replace(/\u0000+$/, "");
    return Array.from(content, c => String.fromCharCode(c)).join("").replace(/\u0000+$/, "");
  };
  const parseHeader = data => {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const tracks = [];
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
        const track = {number:0, type:0, codec:"", name:"", language:""};
        children(bytes, start, end, (key, a, b) => {
          if (key === TYPE) track.type = valueOf(bytes,a,b);
          else if (key === NUMBER) track.number = valueOf(bytes,a,b);
          else if (key === CODEC) track.codec = stringOf(bytes,a,b);
          else if (key === NAME) track.name = stringOf(bytes,a,b);
          else if (key === LANGUAGE || key === LANGUAGE_IETF)
            track.language = stringOf(bytes,a,b);
        });
        if (track.type !== 17 || !track.codec) return;
        const fingerprint = [track.number,track.codec,track.name,track.language].join("|");
        if (seen.has(fingerprint)) return;
        seen.add(fingerprint);
        tracks.push({number:track.number,codec:track.codec,name:track.name,
          language:track.language || "und"});
      });
      if (tracks.length) break;
    }
    return tracks;
  };
  const inspectFile = async file => {
    if (!file || !/\.mkv$/i.test(file.name || "") || typeof file.slice !== "function")
      return {tracks:[],truncated:false};
    const bytes = new Uint8Array(await file.slice(0, MAX_SCAN).arrayBuffer());
    return {tracks:parseHeader(bytes),truncated:file.size > bytes.length};
  };
  return {parseHeader,inspectFile};
});
