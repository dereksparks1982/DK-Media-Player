/* Source-only Matroska subtitle/audio metadata fixtures (not run automatically). */
"use strict";
const assert = require("node:assert/strict");
const {parseHeader,parseTracksHeader,inspectFile} = require("../mkv-tracks.js");
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
  ...element([0x86], ascii("A_AC3")),
  ...element([0x53,0x6E], ascii("English surround")),
  ...element([0x22,0xB5,0x9C], ascii("eng")),
  ...element([0x88], [1]),
  ...element([0xE1], [
    ...element([0x9F], [6]),
    ...element([0xB5], [0x47,0x3B,0x80,0]), // 48000 Hz, big-endian float32
    ...element([0x62,0x64], [16])
  ])
]);
const header = Uint8Array.from([0x1A,0x45,0xDF,0xA3,0x80,
  ...element([0x16,0x54,0xAE,0x6B], [...audio,...subtitles])]);
const parsed = parseHeader(header);
assert.equal(parsed.length,1);
assert.deepEqual(parsed[0], {number:2,codec:"S_TEXT/ASS",
  name:"English subtitles",language:"eng"});
const found = parseTracksHeader(header);
assert.deepEqual(found.subtitles,parsed);
assert.deepEqual(found.audioTracks,[{number:1,codec:"A_AC3",
  name:"English surround",language:"eng",channels:6,sampleRate:48000,
  bitDepth:16,default:true,forced:false}]);
assert.deepEqual(parseTracksHeader(new Uint8Array([0,1,2,3])),
  {subtitles:[],audioTracks:[]});
assert.deepEqual(parseHeader(new Uint8Array([0,1,2,3])),[]);
const fake = {name:"episode.mkv",size:header.length,
  slice:()=>({arrayBuffer: async () => header.buffer})};
inspectFile(fake).then(result=>{
  assert.equal(result.truncated,false);
  assert.deepEqual(result.tracks,parsed);
  assert.deepEqual(result.audioTracks,found.audioTracks);
  console.log("PASS: MKV subtitle/audio descriptor fixtures");
}).catch(error=>{console.error(error);process.exitCode=1});
