/* Matroska subtitle metadata regression tests. Run with Node.js. */
"use strict";
const assert = require("node:assert/strict");
const {parseHeader,inspectFile} = require("../mkv-tracks.js");
const ascii = text => [...Buffer.from(text,"ascii")];
const element = (id, body) => {
  assert.ok(body.length < 127);
  return [...id, 0x80 | body.length, ...body];
};
const subtitles = element([0xAE], [
  ...element([0xD7], [2]),
  ...element([0x83], [17]),
  ...element([0x86], ascii("S_TEXT/ASS")),
  ...element([0x22,0xB5,0x9C], ascii("eng")),
  ...element([0x53,0x6E], ascii("English subtitles"))
]);
const audio = element([0xAE], [
  ...element([0xD7], [1]),
  ...element([0x83], [2]),
  ...element([0x86], ascii("A_AAC"))
]);
const header = Uint8Array.from([0x1A,0x45,0xDF,0xA3,0x80,
  ...element([0x16,0x54,0xAE,0x6B], [...audio,...subtitles])]);
const parsed = parseHeader(header);
assert.equal(parsed.length,1);
assert.deepEqual(parsed[0], {number:2,codec:"S_TEXT/ASS",
  name:"English subtitles",language:"eng"});
assert.deepEqual(parseHeader(new Uint8Array([0,1,2,3])),[]);
const fake = {name:"episode.mkv",size:header.length,
  slice:()=>({arrayBuffer: async () => header.buffer})};
inspectFile(fake).then(result=>{
  assert.equal(result.truncated,false);
  assert.deepEqual(result.tracks,parsed);
  console.log("PASS: MKV subtitle track header inspection");
}).catch(error=>{console.error(error);process.exitCode=1});
