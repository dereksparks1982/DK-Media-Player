/* Source-only audio-track preference/selection fixtures; not run automatically. */
"use strict";
const assert = require("node:assert/strict");
const audio = require("../audio-tracks.js");
const tracks = [
  {id:"1",label:"English surround",language:"eng",enabled:true},
  {id:"2",label:"Russian stereo",language:"rus",enabled:false}
];
const media = {audioTracks:tracks};
assert.equal(audio.normalizeLanguage("eng"),"en");
assert.equal(audio.normalizeLanguage("rus-RU"),"ru");
assert.equal(audio.preferredIndex(tracks,{id:"2",label:"Russian stereo",language:"rus"}),1);
assert.equal(audio.preferredIndex(tracks,{language:"ru"}),1);
assert.equal(audio.preferredIndex(tracks,{language:"it"}),-1);
const choice = audio.selectNative(media,1);
assert.equal(choice.ok,true);
assert.equal(tracks[0].enabled,false);
assert.equal(tracks[1].enabled,true);
const saved = audio.preferenceFor(tracks[1],1);
assert.equal(saved.index,1);
assert.equal(audio.preferredIndex(tracks,saved),1);
assert.equal(audio.selectNative({audioTracks:null},0).ok,false);
assert.equal(audio.selectNative(media,99).ok,false);
assert.match(audio.labelEmbedded({number:2,name:"Russian stereo",language:"rus",
  codec:"A_AC3",channels:2,sampleRate:48000,bitDepth:16,default:false}),
  /A_AC3.*2 channels.*48000 Hz.*16-bit/);
const blocked = {
  id:"a",label:"Read-only audio",language:"en",
  get enabled(){return true;},
  set enabled(_) {throw new Error("unsupported");}
};
assert.equal(audio.selectNative({audioTracks:[blocked]},0).ok,false);
console.log("PASS: source-only audio track selection fixtures");
