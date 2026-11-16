"use strict";
const assert=require("node:assert/strict");
const artwork=require("../queue-artwork.js");
assert.equal(artwork.eligible({kind:"file",src:"blob:movie",audio:false}),true);
assert.equal(artwork.eligible({kind:"url",src:"https://example.com/video.mp4"}),false);
assert.equal(artwork.eligible({kind:"file",src:"blob:song",audio:true}),false);
let video=null;
function makeVideo(){
 const listeners={};
 video={listeners,videoWidth:320,videoHeight:180,duration:90,readyState:2,
  addEventListener(kind,fn){listeners[kind]=fn;},
  load(){},pause(){},removeAttribute(){},};
 return video;
}
const picture=artwork.capture("blob:movie",{makeVideo,makeCanvas:()=>{
 return {getContext:()=>({drawImage(){}}),toDataURL:()=> "data:image/jpeg;base64,test"};
}});
video.listeners.loadedmetadata();
video.listeners.seeked();
picture.then(x=>assert.equal(x,"data:image/jpeg;base64,test"));
const item={kind:"file",src:"blob:movie",audio:false};
let updates=0;
const queue=artwork.create({makeVideo,makeCanvas:()=>({
 getContext:()=>({drawImage(){}}),toDataURL:()=> "data:image/jpeg;base64,test"
}),onReady:()=>updates++,isActive:()=>true});
assert.equal(queue.request(item),true);
assert.equal(queue.request(item),false);
video.listeners.loadedmetadata();
video.listeners.seeked();
setTimeout(()=>{
 assert.equal(updates,1);
 assert.match(item.thumbnail,/^data:image\/jpeg/);
 console.log("PASS: local queue thumbnails, no remote fetching");
},0);
