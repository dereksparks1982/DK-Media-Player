/* Source regression fixtures for embedded Matroska text subtitles.
 * Intentionally not run automatically; keep for the next approved test phase.
 */
"use strict";
const assert = require("node:assert/strict");
const {extractTextTrack, canExtract, subtitleText, makeWebVTT} =
  require("../mkv-subtitles.js");
const utf8 = s => [...Buffer.from(s, "utf8")];
const size = n => {
  if (n < 127) return [0x80 | n];
  if (n < 16383) return [0x40 | (n >>> 8), n & 0xff];
  throw new Error("Fixture too large");
};
const elem = (id, data) => [...id, ...size(data.length), ...data];
const u16 = n => [(n >>> 8) & 0xff, n & 0xff];
const subtitle = (track, tick, text) =>
  elem([0xA1], [0x80 | track, ...u16(tick & 0xffff), 0, ...utf8(text)]);
const grouped = (track, tick, duration, text) =>
  elem([0xA0], [...subtitle(track, tick, text),
    ...elem([0x9B], u16(duration))]);
const simple = (track, tick, text) =>
  elem([0xA3], [0x80 | track, ...u16(tick & 0xffff), 0, ...utf8(text)]);
const mkv = data => {
  const bytes = Uint8Array.from([
    ...elem([0x1A,0x45,0xDF,0xA3], []),
    ...elem([0x18,0x53,0x80,0x67], [
      ...elem([0x15,0x49,0xA9,0x66], [
        ...elem([0x2A,0xD7,0xB1], [0x0f,0x42,0x40]) // 1,000,000 ns/tick
      ]),
      ...elem([0x1F,0x43,0xB6,0x75], data)
    ])
  ]);
  const blob = new Blob([bytes]);
  blob.name = "example.mkv";
  return blob;
};
assert.equal(canExtract("S_TEXT/UTF8"), true);
assert.equal(canExtract("S_TEXT/ASS"), true);
assert.equal(canExtract("S_HDMV/PGS"), false);
assert.equal(subtitleText("1,,Default,,0,0,0,,Hi\\Nthere!", "S_TEXT/ASS"),
  "Hi\nthere!");
assert.match(makeWebVTT([{start:1,end:2,text:"Hello"}]), /00:00:01\.000 --> 00:00:02\.000/);
(async () => {
  const file = mkv([
    ...elem([0xE7], [10]),
    ...grouped(2, -5, 3000, "First subtitle"),
    ...grouped(3, 5, 1200, "1,,Default,,0,0,0,,Привет\\Nмир"),
    ...simple(2, 3500, "Second subtitle")
  ]);
  const one = await extractTextTrack(file, {number:2,codec:"S_TEXT/UTF8"});
  assert.equal(one.count, 2);
  assert.match(one.vtt, /00:00:00\.005 --> 00:00:03\.005\nFirst subtitle/);
  assert.match(one.vtt, /00:00:03\.510 --> 00:00:07\.510\nSecond subtitle/);
  const two = await extractTextTrack(file, {number:3,codec:"S_TEXT/ASS"});
  assert.equal(two.count, 1);
  assert.match(two.vtt, /Привет\nмир/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    extractTextTrack(file,{number:2,codec:"S_TEXT/UTF8"},{signal:controller.signal}),
    {name:"AbortError"});
  await assert.rejects(extractTextTrack(file,{number:2,codec:"S_HDMV/PGS"}));
  console.log("PASS: embedded Matroska subtitle text fixtures");
})().catch(error => {console.error(error);process.exitCode=1;});
