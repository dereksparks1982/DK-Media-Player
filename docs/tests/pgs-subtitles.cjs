/* Source-only PGS regression fixtures. Not run automatically. */
"use strict";
const assert = require("node:assert/strict");
const pgs = require("../pgs-subtitles.js");
const u16 = n => [(n>>>8)&255,n&255];
const segment = (type, bytes) => Uint8Array.from([type,...u16(bytes.length),...bytes]);
const compose = (objects, state=0x80) => [
  0,2,0,1,0x10,0,1,state,0,0,objects?1:0,
  ...(objects ? [0,1,0,0,0,0,0,0] : [])
];
const palette = [0,0,1,235,128,128,255];
const object = [0,1,0,0xc0,0,0,8,0,2,0,1,1,1,0,0];
assert.equal(pgs.canRender("S_HDMV/PGS"),true);
assert.equal(pgs.canRender("S_VOBSUB"),false);
const decoder=pgs.makeDecoder();
decoder.feed(segment(0x16,compose(true)),1);
decoder.feed(segment(0x14,palette),1);
decoder.feed(segment(0x15,object),1);
decoder.feed(segment(0x80,[]),1);
decoder.feed(segment(0x16,compose(false,0)),2.5);
decoder.feed(segment(0x80,[]),2.5);
const frames=decoder.complete();
assert.equal(frames.length,2);
assert.equal(pgs.frameAt(frames,0.5),null);
assert.equal(pgs.frameAt(frames,1.2).regions.length,1);
assert.equal(pgs.frameAt(frames,2.8).regions.length,0);
assert.deepEqual([...pgs.decodeIndices(Uint8Array.of(1,1,0,0),2,1)],[1,1]);
assert.throws(()=>pgs.unpackSegments(Uint8Array.of(0x16,0,12),()=>{}));
const fullSup=Uint8Array.from([0x50,0x47,0,0,0,0,0,0,0,0,0x80,0,0]);
assert.equal(pgs.unpackSegments(fullSup,(type,bytes)=>{
  assert.equal(type,0x80);assert.equal(bytes.length,0);
}),1);
console.log("PASS: PGS packet/palette/RLE/display-state fixtures");
