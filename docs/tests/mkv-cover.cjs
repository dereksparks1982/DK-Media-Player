"use strict";
const assert=require("node:assert/strict");
const {extractBytes}=require("../mkv-cover.js");
const encoder=new TextEncoder();
const join=(...groups)=>{
 const size=groups.reduce((n,x)=>n+x.length,0),out=new Uint8Array(size);
 let at=0;for(const item of groups){out.set(item,at);at+=item.length;}return out;
};
const element=(id,payload)=>{
 const size=payload.length;
 if(size>=16383)throw Error("Fixture too large");
 const length=size<127?Uint8Array.of(0x80|size):Uint8Array.of(0x40|(size>>8),size&255);
 return join(Uint8Array.from(id),length,payload);
};
const cover=(name,mime,body)=>element([0x19,0x41,0xa4,0x69],
 element([0x61,0xa7],join(
  element([0x46,0x6e],encoder.encode(name)),
  element([0x46,0x60],encoder.encode(mime)),
  element([0x46,0x5c],Uint8Array.from(body))
 )));
const jpeg=cover("cover.jpg","image/jpeg",[0xff,0xd8,0xff,0x11,0x22,0x33]);
const result=extractBytes(join(new Uint8Array([0x1a,0x45,0xdf,0xa3]),jpeg));
assert.equal(result.mime,"image/jpeg");
assert.deepEqual(Array.from(result.bytes),[0xff,0xd8,0xff,0x11,0x22,0x33]);
assert.equal(extractBytes(cover("cover.jpg","image/svg+xml",[0x3c,0x73,0x76,0x67])),null);
assert.equal(extractBytes(cover("poster.jpg","image/jpeg",[0x00,0x11,0x22])),null);
assert.equal(extractBytes(cover("random.jpg","image/jpeg",[0xff,0xd8,0xff,0x44])),null);
assert.equal(extractBytes(new Uint8Array(45)),null);
console.log("PASS: Matroska attached cover artwork parsing and MIME validation");
