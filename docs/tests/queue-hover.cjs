"use strict";
const assert=require("node:assert/strict");
const hover=require("../queue-hover.js");
assert.equal(hover.eligible({kind:"file",src:"blob:movie",audio:false}),true);
assert.equal(hover.eligible({kind:"url",src:"https://example.org/film.mkv",audio:false}),false);
assert.equal(hover.eligible({kind:"file",src:"blob:music",audio:true}),false);
let timerFn=null, video=null, played=0, removed=0;
function makeVideo(){
 const listeners={};
 video={listeners,duration:60,currentTime:0,
  setAttribute(){},addEventListener(k,fn){listeners[k]=fn;},
  load(){},pause(){},removeAttribute(){},remove(){removed++;},
  play(){played++;return Promise.resolve()}};
 return video;
}
const btn={listeners:{},addEventListener(n,fn){this.listeners[n]=fn}};
const box={isConnected:true,append(){}};
const originalSetTimeout=global.setTimeout;
const originalClearTimeout=global.clearTimeout;
global.setTimeout=fn=>{timerFn=fn;return 1};
global.clearTimeout=()=>{};
try{
 const ctrl=hover.create({makeVideo,delay:400});
 ctrl.bind(btn,{kind:"file",src:"blob:movie",audio:false},box);
 btn.listeners.pointerenter({pointerType:"mouse"});
 assert.equal(typeof timerFn,"function");
 timerFn();
 assert.equal(video.src,"blob:movie");
 video.listeners.loadedmetadata();
 assert.equal(video.currentTime,5);
 video.listeners.seeked();
 assert.equal(played,1);
 btn.listeners.pointerleave();
 assert.equal(removed,1);
 timerFn=null;
 btn.listeners.pointerenter({pointerType:"touch"});
 assert.equal(timerFn,null);
 ctrl.stop();
}finally{
 global.setTimeout=originalSetTimeout;
 global.clearTimeout=originalClearTimeout;
}
console.log("PASS: local up-next hover preview and teardown");
