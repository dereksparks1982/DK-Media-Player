"use strict";
/* Minimal browser-like regression test for artwork replacement and auto-retry.
 * No browser install or network calls required.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../metadata-ui.js"),"utf8");
const observers=[],timers=[];
class Element{
  constructor(){this.children=[];this.handlers={};this.dataset={};this.style={};
    this.hidden=false;this.isConnected=true;this.classList={values:new Set(),
      add:v=>this.classList.values.add(v),remove:v=>this.classList.values.delete(v),
      contains:v=>this.classList.values.has(v)};}
  addEventListener(type,fn){this.handlers[type]=fn;}
  append(node){this.children.push(node);node.parent=this;}
  replaceChildren(...nodes){this.children=[...nodes];nodes.forEach(n=>n.parent=this);}
  setAttribute(k,v){this[k]=v;}
  matches(s){return s==="li";}
  querySelector(q){
    if(q===".queue-artwork-fallback")return this.children.find(x=>x.className===q.slice(1))||null;
    return null;
  }
}
const box=new Element(),listItem=new Element(),queue=new Element(),enabledBox=new Element();
const tokenBox=new Element(),apply=new Element(),clear=new Element();
listItem.dataset={queueKind:"file",queueAudio:"0"};
listItem.classList.contains=()=>false;
listItem.querySelector=q=>q===".queue-artwork"?box:q===".item-title"?
 {textContent:"Mike.Judges.Beavis.and.Butthead.S01E04.mkv"}:null;
box.closest=()=>listItem;queue.children=[listItem];
let attempts=0,cacheClears=0;
const imageURL="https://static.tvmaze.com/episode.jpg";
const fallbackURL="https://static.tvmaze.com/poster.jpg";
const ctx={
 window:{DKMediaMetadata:{
    parseFilename:()=>({type:"episode",season:1,episode:4}),
    create:()=>({
      find:async()=>++attempts===1?null:{
        url:imageURL,fallbackUrl:fallbackURL,provider:"TVmaze",title:"Beekeepers"},
      clear:()=>{cacheClears++}
    })},
  DKJellyfinArtwork:{choose:()=>null}},
 document:{documentElement:{lang:"en"},getElementById:id=>({
  queue,autoArtwork:enabledBox,tmdbToken:tokenBox,applyTmdbToken:apply,clearTmdbToken:clear
 })[id],createElement(tag){
   const el=new Element();
   el.className="";
   if(tag==="img")Object.defineProperty(el,"src",{
      set(value){this.currentSrc=value;
        Promise.resolve().then(()=>{if(value===imageURL){this.onerror?.()}else{this.onload?.()}})},
      get(){return this.currentSrc}
   });
   return el;
 }},
 MutationObserver:class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}},
 localStorage:{getItem:()=>null,setItem(){}},
 sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 setTimeout:fn=>{timers.push(fn);return timers.length},
 clearTimeout:()=>{},
 console};
vm.runInNewContext(source,ctx,{filename:"metadata-ui.js"});
(async()=>{
  for(let i=0;i<6;i++)await Promise.resolve();
  assert.equal(attempts,1);
  assert.equal(box.dataset.artworkStatus,"retrying");
  assert.equal(timers.length,1);
  timers[0]();
  for(let i=0;i<12;i++)await Promise.resolve();
  assert.equal(attempts,2);
  assert.equal(box.dataset.artworkStatus,"loaded");
  assert.equal(box.classList.contains("has-art"),true);
  const image=box.children.find(x=>x.className==="queue-artwork-image");
  assert.equal(image.src,fallbackURL,"Broken episode still uses series image");
  assert.ok(cacheClears>0,"Retry invalidates failed metadata search");
  assert.equal(enabledBox.checked,true);
  console.log("PASS: playlist metadata auto-retry, series image fallback, visibility");
})().catch(e=>{console.error(e);process.exitCode=1});
