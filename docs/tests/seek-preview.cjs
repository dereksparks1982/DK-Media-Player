"use strict";
const assert=require("node:assert/strict");
const {position,attach}=require("../seek-preview.js");
assert.equal(position(10,0,100),.1);
assert.equal(position(-10,0,100),0);
assert.equal(position(110,0,100),1);
assert.equal(position(40,10,0),0);
function fake(){
 const listeners={};
 return {listeners,hidden:true,style:{},classList:{add(){},remove(){}},
  readyState:0,src:"",disabled:false,value:"500",
  getBoundingClientRect(){return {left:20,width:200}},
  addEventListener(type,fn){listeners[type]=fn;},
  pause(){},load(){},removeAttribute(name){if(name==="src")this.src="";},
 };
}
const seek=fake(),bubble=fake(),frame=fake(),label=fake();
let time=60,media={kind:"file",src:"blob:test",audio:false};
const preview=attach({seek,bubble,frame,label,current:()=>media,
 duration:()=>time,formatTime:n=>Math.round(n)+"s"});
seek.listeners.pointermove({clientX:120,pointerType:"mouse"});
assert.equal(bubble.hidden,false);
assert.equal(label.textContent,"30s");
assert.equal(frame.src,"blob:test");
frame.readyState=2;
frame.listeners.seeked();
assert.equal(frame.hidden,false);
seek.listeners.pointerleave();
assert.equal(bubble.hidden,true);
preview.reset();
assert.equal(frame.hidden,true);
media={kind:"url",src:"https://example.com/movie.mp4",audio:false};
seek.listeners.pointermove({clientX:100,pointerType:"mouse"});
assert.equal(bubble.hidden,false);
assert.equal(frame.src,"");
seek.disabled=true;
seek.listeners.pointermove({clientX:100,pointerType:"mouse"});
assert.equal(bubble.hidden,true);
preview.reset();
console.log("PASS: seek hover preview isolates playback and avoids remote double-fetch");
