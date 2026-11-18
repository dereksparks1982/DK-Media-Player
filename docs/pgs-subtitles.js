/* Local HDMV PGS bitmap subtitle decoder for selected MKV files.
 * Processes Blu-ray PCS/PDS/ODS/END segments from Matroska blocks, renders
 * indexed-color RLE graphics on a transparent canvas over playable video.
 * No video decoding, downloads, servers, or third-party runtime packages.
 * Spec: Matroska technical/subtitles.html (S_HDMV/PGS).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DKPGS = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";
  const PDS = 0x14, ODS = 0x15, PCS = 0x16, END = 0x80;
  const TYPES = new Set([PDS, ODS, PCS, 0x17, END]);
  const MAX_WIDTH = 3840, MAX_HEIGHT = 2160;
  const MAX_PIXELS = 4194304, MAX_COMPRESSED = 48 * 1024 * 1024;
  const MAX_EVENTS = 12000;
  const canRender = codec => String(codec || "").toUpperCase() === "S_HDMV/PGS";
  const word = (b, i) => b[i] * 256 + b[i + 1];
  const triple = (b, i) => b[i] * 65536 + b[i + 1] * 256 + b[i + 2];
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  function unpackSegments(data, emit) {
    let at = 0, found = 0;
    while (at < data.length) {
      // Some SUP-compatible muxers retain the full 13-byte "PG" header.
      const sup = data.length - at >= 13 && data[at] === 0x50 && data[at+1] === 0x47;
      const head = sup ? 13 : 3, typeAt = at + (sup ? 10 : 0);
      if (at + head > data.length) throw new Error("Truncated PGS segment header");
      const type = data[typeAt], length = word(data, typeAt + 1);
      if (!TYPES.has(type) || at + head + length > data.length)
        throw new Error("Invalid embedded PGS segment");
      emit(type, data.subarray(at + head, at + head + length));
      found++;
      at += head + length;
    }
    return found;
  }
  function parseComposition(bytes) {
    if (bytes.length < 11) throw new Error("Invalid PGS composition");
    const width = word(bytes, 0), height = word(bytes, 2);
    if (!width || !height || width > MAX_WIDTH || height > MAX_HEIGHT)
      throw new Error("PGS graphics dimensions exceed supported range");
    const refs = [];
    let at = 11, count = bytes[10];
    if (count > 16) throw new Error("Too many PGS composition objects");
    while (count--) {
      if (at + 8 > bytes.length) throw new Error("Incomplete PGS composition object");
      const ref = {id:word(bytes,at), x:word(bytes,at+4),y:word(bytes,at+6),
        crop:null};
      const flags = bytes[at+3];
      at += 8;
      if (flags & 0x80) {
        if (at + 8 > bytes.length) throw new Error("Incomplete PGS crop");
        ref.crop = {x:word(bytes,at),y:word(bytes,at+2),
          width:word(bytes,at+4),height:word(bytes,at+6)};
        at += 8;
      }
      refs.push(ref);
    }
    return {width,height,epoch:!!(bytes[7] & 0x80),
      palette:bytes[9],refs};
  }
  function decodeIndices(data, width, height) {
    if (!width || !height || width * height > MAX_PIXELS)
      throw new Error("PGS bitmap exceeds pixel limit");
    const pixels = new Uint8Array(width * height);
    let pos = 0, x = 0, y = 0;
    const lineBreak = () => { x = 0; y++; pos = y * width; };
    for (let at = 0; at < data.length && y < height;) {
      const first = data[at++];
      if (first !== 0) {
        if (x >= width) lineBreak();
        if (y < height) { pixels[pos++] = first; x++; }
        continue;
      }
      if (at >= data.length) throw new Error("Incomplete PGS RLE sequence");
      const control = data[at++];
      if (control === 0) { lineBreak(); continue; }
      let count = control & 0x3f;
      if (control & 0x40) {
        if (at >= data.length) throw new Error("Incomplete PGS extended run");
        count = count * 256 + data[at++];
      }
      let color = 0;
      if (control & 0x80) {
        if (at >= data.length) throw new Error("Incomplete PGS palette index");
        color = data[at++];
      }
      while (count > 0 && y < height) {
        if (x >= width) { lineBreak(); continue; }
        const n = Math.min(count, width - x);
        pixels.fill(color, pos, pos + n);
        pos += n; x += n; count -= n;
      }
    }
    return pixels;
  }
  function decodePalette(palette) {
    const rgba = new Uint8ClampedArray(1024);
    if (!palette) return rgba;
    for (const [index, color] of palette) {
      const [y, cr, cb, alpha] = color;
      const luma = 1.164383 * (y - 16);
      rgba[index*4] = clamp(luma + 1.792741 * (cr - 128));
      rgba[index*4+1] = clamp(luma - 0.213249 * (cb - 128) - 0.532909 * (cr - 128));
      rgba[index*4+2] = clamp(luma + 2.112402 * (cb - 128));
      rgba[index*4+3] = alpha;
    }
    return rgba;
  }
  function makeDecoder() {
    const palettes = new Map(), objects = new Map(), events = [];
    let pending = null, compressed = 0, lastTime = 0;
    const finish = () => {
      if (!pending) return;
      const composition = pending.composition;
      const palette = palettes.get(composition.palette) || palettes.values().next().value;
      const regions = [];
      for (const ref of composition.refs) {
        const object = objects.get(ref.id);
        if (!object || !object.done || !palette) continue;
        regions.push({object,ref,palette:decodePalette(palette)});
      }
      if (composition.refs.length === 0 || regions.length) {
        if (events.length >= MAX_EVENTS)
          throw new Error("Too many PGS display events");
        events.push({start:pending.time, end:pending.end,
          width:composition.width,height:composition.height,regions});
      }
      pending = null;
    };
    const feed = (packet, time, duration = null) => {
      lastTime = time;
      unpackSegments(packet, (type, bytes) => {
        if (type === PCS) {
          finish();
          const composition = parseComposition(bytes);
          if (composition.epoch) { objects.clear(); palettes.clear(); }
          pending = {composition,time,
            end:duration === null ? null : time + duration};
        } else if (type === PDS) {
          if (bytes.length < 2 || (bytes.length - 2) % 5)
            throw new Error("Invalid PGS palette");
          const id = bytes[0], entries = new Map(palettes.get(id) || []);
          for (let i = 2; i < bytes.length; i += 5)
            entries.set(bytes[i], [bytes[i+1], bytes[i+2], bytes[i+3], bytes[i+4]]);
          palettes.set(id, entries);
        } else if (type === ODS) {
          if (bytes.length < 4) throw new Error("Invalid PGS object header");
          const id = word(bytes,0), flags = bytes[3];
          if (flags & 0x80) {
            if (bytes.length < 11) throw new Error("Incomplete PGS object dimensions");
            const size = triple(bytes,4) - 4, width = word(bytes,7), height = word(bytes,9);
            if (size < 1 || size > MAX_PIXELS || !width || !height ||
                width * height > MAX_PIXELS)
              throw new Error("Invalid PGS bitmap size");
            objects.set(id, {width,height,size,parts:[],bytes:0,done:false});
          }
          const obj = objects.get(id);
          if (!obj) throw new Error("PGS object continuation without start");
          const from = flags & 0x80 ? 11 : 4;
          const bytesLeft = bytes.length - from;
          if (obj.bytes + bytesLeft > obj.size)
            throw new Error("PGS object exceeds advertised size");
          const piece = bytes.subarray(from).slice();
          obj.parts.push(piece);
          obj.bytes += piece.length;
          compressed += piece.length;
          if (compressed > MAX_COMPRESSED)
            throw new Error("PGS stream exceeds memory safety cap");
          if (flags & 0x40) {
            if (obj.bytes !== obj.size)
              throw new Error("Incomplete PGS object bitmap");
            obj.data = new Uint8Array(obj.size);
            let at = 0;
            for (const chunk of obj.parts) { obj.data.set(chunk,at);at+=chunk.length; }
            obj.parts = null;
            obj.done = true;
          }
        } else if (type === END) {
          finish();
        }
      });
    };
    const complete = () => {
      finish();
      events.sort((a,b) => a.start - b.start);
      for (let i = 0; i < events.length - 1; i++) {
        const next = events[i+1].start;
        if (events[i].end === null || events[i].end > next)
          events[i].end = next;
      }
      return events;
    };
    return {feed,complete};
  }
  function frameAt(events, second) {
    if (!Array.isArray(events) || !events.length || !Number.isFinite(second)) return null;
    let lo=0, hi=events.length-1, found=-1;
    while (lo<=hi) {
      const mid=(lo+hi) >>> 1;
      if (events[mid].start<=second) {found=mid;lo=mid+1;}
      else hi=mid-1;
    }
    const frame=events[found];
    return frame && (frame.end===null || second<frame.end) ? frame : null;
  }
  function render(canvas, frame) {
    if (!canvas || !frame) return;
    if (canvas.width!==frame.width) canvas.width=frame.width;
    if (canvas.height!==frame.height) canvas.height=frame.height;
    const ctx=canvas.getContext("2d");
    if (!ctx) throw new Error("PGS canvas unavailable");
    ctx.clearRect(0,0,frame.width,frame.height);
    for (const layer of frame.regions) {
      const obj=layer.object, {x,y,crop}=layer.ref;
      // Decode only the visible frame; caching every movie bitmap here could
      // otherwise retain gigabytes during a long subtitle-heavy film.
      const indices=decodeIndices(obj.data,obj.width,obj.height);
      const image=ctx.createImageData(obj.width,obj.height);
      const dest=image.data, palette=layer.palette;
      for (let i=0; i<indices.length; i++) {
        const src=indices[i]*4, at=i*4;
        dest[at]=palette[src];dest[at+1]=palette[src+1];
        dest[at+2]=palette[src+2];dest[at+3]=palette[src+3];
      }
      if (crop) {
        const w=Math.min(crop.width,obj.width-crop.x);
        const h=Math.min(crop.height,obj.height-crop.y);
        if (w>0 && h>0)
          ctx.putImageData(image,x-crop.x,y-crop.y,crop.x,crop.y,w,h);
      } else ctx.putImageData(image,x,y);
    }
  }
  async function extract(file, track, options={}) {
    if (!canRender(track && track.codec) || !globalThis.DKMkvSubtitles ||
        typeof globalThis.DKMkvSubtitles.scanTrackPackets !== "function")
      throw new Error("PGS reader is unavailable");
    const decoder=makeDecoder();
    const count=await globalThis.DKMkvSubtitles.scanTrackPackets(
      file,track,packet => decoder.feed(packet.data,packet.time,packet.duration),options);
    const events=decoder.complete();
    if (!events.length) throw new Error("No readable PGS display events found");
    return {events,packets:count};
  }
  return {canRender,unpackSegments,parseComposition,decodeIndices,
    decodePalette,makeDecoder,frameAt,render,extract};
});
