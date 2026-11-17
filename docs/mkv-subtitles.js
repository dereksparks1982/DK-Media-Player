/* Local, bounded-memory Matroska text-subtitle extraction.
 * Reads only user-selected File slices. No uploads, server, WASM or video decoding.
 * Handles BlockGroup/BlockDuration and SimpleBlock, with plain-text conversion
 * for SubRip (UTF8/ASCII) and ASS/SSA (advanced formatting is not preserved).
 * Container/timestamp rules: RFC 9559, Matroska codec/subtitle specifications.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DKMkvSubtitles = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";
  const SEGMENT = 0x18538067, INFO = 0x1549A966, CLUSTER = 0x1F43B675;
  const TIMESTAMP_SCALE = 0x2AD7B1, CLUSTER_TIME = 0xE7;
  const BLOCK_GROUP = 0xA0, BLOCK = 0xA1, SIMPLE_BLOCK = 0xA3;
  const BLOCK_DURATION = 0x9B;
  const READ_WINDOW = 512 * 1024, MAX_BLOCK = 256 * 1024;
  const MAX_CUES = 25000, MAX_TEXT = 12 * 1024 * 1024;
  const TEXT_CODECS = new Set([
    "S_TEXT/UTF8", "S_TEXT/ASCII", "S_TEXT/ASS", "S_TEXT/SSA",
    "S_ASS", "S_SSA"
  ]);
  const canExtract = codec => TEXT_CODECS.has(String(codec || "").toUpperCase());
  const cancelled = () => {
    const error = new Error("Subtitle extraction cancelled");
    error.name = "AbortError";
    return error;
  };
  const vint = (bytes, offset, sizeField) => {
    if (offset >= bytes.length || !bytes[offset]) return null;
    let mask = 0x80, width = 1;
    while (!(bytes[offset] & mask) && width <= 8) { mask >>= 1; width++; }
    if (width > (sizeField ? 8 : 4) || offset + width > bytes.length) return null;
    let value = sizeField ? bytes[offset] & (mask - 1) : bytes[offset];
    let unknown = sizeField && value === mask - 1;
    for (let i = 1; i < width; i++) {
      value = value * 256 + bytes[offset + i];
      unknown = unknown && bytes[offset + i] === 255;
    }
    return Number.isSafeInteger(value) ? {value, width, unknown} : null;
  };
  const unsigned = bytes => {
    if (bytes.length > 8) throw new Error("Invalid Matroska integer");
    let value = 0;
    for (const byte of bytes) value = value * 256 + byte;
    if (!Number.isSafeInteger(value)) throw new Error("Matroska integer exceeds supported range");
    return value;
  };
  const makeReader = (file, signal) => {
    let cachedFrom = -1, cache = new Uint8Array(0);
    const check = () => { if (signal && signal.aborted) throw cancelled(); };
    const read = async (from, length) => {
      check();
      if (!Number.isSafeInteger(from) || !Number.isSafeInteger(length) ||
          from < 0 || length < 0 || from + length > file.size)
        throw new Error("Invalid Matroska element range");
      if (!length) return new Uint8Array(0);
      if (from < cachedFrom || from + length > cachedFrom + cache.length) {
        const count = Math.max(length, READ_WINDOW);
        cache = new Uint8Array(await file.slice(from, Math.min(file.size, from + count)).arrayBuffer());
        cachedFrom = from;
        check();
      }
      return cache.subarray(from - cachedFrom, from - cachedFrom + length);
    };
    const element = async (at, limit) => {
      if (at + 2 > limit) return null;
      const probe = await read(at, Math.min(12, limit - at));
      const id = vint(probe, 0, false);
      if (!id) throw new Error("Invalid Matroska element ID");
      const size = vint(probe, id.width, true);
      if (!size) throw new Error("Invalid Matroska element size");
      const start = at + id.width + size.width;
      const end = size.unknown ? limit : start + size.value;
      if (end > limit || end < start || !Number.isSafeInteger(end))
        throw new Error("Matroska element exceeds its container");
      return {id:id.value, start, end, unknown:size.unknown};
    };
    const children = async function* (from, end) {
      let at = from, visits = 0;
      while (at < end) {
        check();
        const part = await element(at, end);
        if (!part) break;
        yield part;
        if (part.unknown) break;
        if (part.end <= at) throw new Error("Invalid Matroska element length");
        at = part.end;
        // Large movies have thousands of video blocks. Let the UI remain responsive.
        if (++visits % 2048 === 0)
          await new Promise(resolve => setTimeout(resolve, 0));
      }
    };
    return {read, children, check};
  };
  const subtitleText = (text, codec) => {
    let result = String(text || "").replace(/\r\n?/g, "\n").replace(/\u0000/g, "");
    if (/ASS|SSA/i.test(codec)) {
      // Matroska ASS payload: ReadOrder,Layer,Style,Name,MarginL,
      // MarginR,MarginV,Effect,Text. Text itself may contain commas.
      const parts = result.split(",");
      if (parts.length < 9) return "";
      result = parts.slice(8).join(",").replace(/\{[^}]*\}/g, "")
        .replace(/\\[Nn]/g, "\n").replace(/\\h/g, " ");
    }
    // A blank line or cue arrow could corrupt the generated WebVTT document.
    return result.replace(/\n\s*\n/g, "\n").replace(/-->/g, "→").trim();
  };
  const stamp = seconds => {
    const ms = Math.max(0, Math.round(seconds * 1000));
    const hh = Math.floor(ms / 3600000);
    const mm = Math.floor(ms / 60000) % 60;
    const ss = Math.floor(ms / 1000) % 60;
    return String(hh).padStart(2, "0") + ":" +
      String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0") +
      "." + String(ms % 1000).padStart(3, "0");
  };
  const makeWebVTT = cues => {
    const ordered = cues.slice().sort((a, b) => a.start - b.start);
    const lines = ["WEBVTT", ""];
    ordered.forEach((cue, index) => {
      const next = ordered[index + 1];
      // Blocks without an explicit duration ordinarily last until the next
      // block. Cap fallback duration to avoid leaving text up indefinitely.
      const fallback = next ? Math.min(next.start, cue.start + 4) : cue.start + 4;
      const end = cue.end === null ? Math.max(cue.start + 0.001, fallback) : cue.end;
      if (end <= cue.start) return;
      lines.push(stamp(cue.start) + " --> " + stamp(end), cue.text, "");
    });
    return lines.join("\n") + "\n";
  };
  async function extractTextTrack(file, track, options = {}) {
    if (!file || !/\.(mkv|mks)$/i.test(file.name || "") ||
        typeof file.slice !== "function" || !Number.isSafeInteger(file.size))
      throw new Error("Select a local Matroska file");
    if (!track || !Number.isSafeInteger(track.number) || track.number < 1 ||
        !canExtract(track.codec))
      throw new Error("This embedded subtitle codec needs a separate decoder");
    const reader = makeReader(file, options.signal);
    const decoder = new TextDecoder("utf-8");
    let nanosecondsPerTick = 1000000;
    const cues = [];
    let textBytes = 0, foundSegment = false;
    const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;
    let lastReport = 0;
    const progress = position => {
      if (!onProgress) return;
      const now = Date.now();
      if (now - lastReport > 500) {
        lastReport = now;
        onProgress(Math.min(100, Math.floor(100 * position / Math.max(1, file.size))));
      }
    };
    const appendBlock = async (part, clusterTick, durationTicks = null) => {
      if (part.end - part.start < 4) return null;
      const head = await reader.read(part.start, Math.min(12, part.end - part.start));
      const number = vint(head, 0, true);
      if (!number || number.value !== track.number) return null;
      if (part.end - part.start > MAX_BLOCK)
        throw new Error("Embedded subtitle cue is too large");
      const from = number.width + 3;
      if (head.length < from) throw new Error("Corrupt subtitle block");
      if (head[number.width + 2] & 0x06)
        throw new Error("Laced MKV text subtitles are not supported");
      const block = await reader.read(part.start, part.end - part.start);
      let offset = (block[number.width] << 8) | block[number.width + 1];
      if (offset & 0x8000) offset -= 0x10000;
      const text = subtitleText(decoder.decode(block.subarray(from)), track.codec);
      if (!text) return null;
      const start = Math.max(0, (clusterTick + offset) * nanosecondsPerTick / 1e9);
      if (!Number.isFinite(start)) throw new Error("Invalid subtitle timestamp");
      const end = durationTicks === null ? null :
        start + durationTicks * nanosecondsPerTick / 1e9;
      const cue = {start, end, text};
      textBytes += text.length;
      if (textBytes > MAX_TEXT || cues.length >= MAX_CUES)
        throw new Error("Too many embedded subtitle cues to load safely");
      cues.push(cue);
      return cue;
    };
    const blockGroup = async (part, clusterTick) => {
      let frame = null, duration = null;
      for await (const child of reader.children(part.start, part.end)) {
        if (child.id === BLOCK) frame = child;
        if (child.id === BLOCK_DURATION) {
          if (child.end - child.start > 8) throw new Error("Invalid subtitle duration");
          duration = unsigned(await reader.read(child.start, child.end - child.start));
        }
      }
      if (frame) await appendBlock(frame, clusterTick, duration);
    };
    const cluster = async part => {
      let clusterTick = 0;
      for await (const child of reader.children(part.start, part.end)) {
        if (child.id === CLUSTER_TIME)
          clusterTick = unsigned(await reader.read(child.start, child.end - child.start));
        else if (child.id === BLOCK_GROUP)
          await blockGroup(child, clusterTick);
        else if (child.id === SIMPLE_BLOCK)
          await appendBlock(child, clusterTick);
      }
    };
    for await (const top of reader.children(0, file.size)) {
      if (top.id !== SEGMENT) continue;
      foundSegment = true;
      for await (const part of reader.children(top.start, top.end)) {
        reader.check();
        if (part.id === INFO) {
          for await (const info of reader.children(part.start, part.end)) {
            if (info.id === TIMESTAMP_SCALE) {
              nanosecondsPerTick = unsigned(await reader.read(info.start, info.end - info.start));
              if (!nanosecondsPerTick) throw new Error("Invalid MKV timestamp scale");
            }
          }
        } else if (part.id === CLUSTER) {
          await cluster(part);
          progress(part.end);
        }
      }
      break;
    }
    reader.check();
    if (!foundSegment || !cues.length) throw new Error("No readable text subtitle cues found");
    return {vtt:makeWebVTT(cues), count:cues.length};
  }
  return {canExtract, subtitleText, makeWebVTT, extractTextTrack};
});
