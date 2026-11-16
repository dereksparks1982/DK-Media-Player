/* Local Matroska cover-art attachment inspection.
   Reads at most 8 MiB of a user-selected file and accepts only small,
   signature-checked JPEG/PNG/WebP images. It does not demux video. */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 else root.DKMatroskaCover=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const MAX_SCAN=8*1024*1024,MAX_IMAGE=512*1024;
 const ATTACHMENTS=[0x19,0x41,0xa4,0x69], ATTACHED=0x61a7;
 const FILE_NAME=0x466e,FILE_MIME=0x4660,FILE_DATA=0x465c;
 function vint(bytes,at,strip){
   if(at>=bytes.length||!bytes[at])return null;
   let marker=0x80, width=1;
   while(width<=8 && !(bytes[at]&marker)){marker>>=1;width++;}
   if(width>8||(!strip&&width>4)||at+width>bytes.length)return null;
   let value=strip?bytes[at]&(marker-1):bytes[at];
   for(let i=1;i<width;i++)value=value*256+bytes[at+i];
   if(!Number.isSafeInteger(value))return null;
   return {width,value,unknown:strip&&value===Math.pow(2,7*width)-1};
 }
 function walk(bytes,from,to,visit){
   let at=from,count=0;
   while(at<to && count++<5000){
     const id=vint(bytes,at,false);if(!id)return;
     const size=vint(bytes,at+id.width,true);if(!size||size.unknown)return;
     const start=at+id.width+size.width;
     const end=start+size.value;
     if(end>to||end<start)return;
     if(visit(id.value,start,end)===true)return true;
     at=end;
   }
   return false;
 }
 function text(bytes,from,to){
   if(to-from>256)return "";
   return typeof TextDecoder!=="undefined"?
     new TextDecoder("utf-8").decode(bytes.subarray(from,to)):
     Array.from(bytes.subarray(from,to),ch=>String.fromCharCode(ch)).join("");
 }
 function validImage(bytes,mime){
   if(mime==="image/jpeg")return bytes.length>=3 &&
     bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff;
   if(mime==="image/png")return bytes.length>=8 &&
     bytes[0]===0x89 && bytes[1]===0x50 && bytes[2]===0x4e &&
     bytes[3]===0x47 && bytes[4]===0x0d && bytes[5]===0x0a &&
     bytes[6]===0x1a && bytes[7]===0x0a;
   if(mime==="image/webp")return bytes.length>=12 &&
     text(bytes,0,4)==="RIFF" && text(bytes,8,12)==="WEBP";
   return false;
 }
 function extractBytes(data){
   const bytes=data instanceof Uint8Array?data:new Uint8Array(data);
   // Matroska attachments have their own EBML container. Only inspect
   // complete attachment sections present in the bounded header sample.
   for(let at=0;at+8<bytes.length;at++){
     if(ATTACHMENTS.some((byte,j)=>bytes[at+j]!==byte))continue;
     const size=vint(bytes,at+4,true);
     if(!size||size.unknown)continue;
     const start=at+4+size.width,end=start+size.value;
     if(end>bytes.length||end<start)continue;
     let matched=null;
     walk(bytes,start,end,(id,fileFrom,fileTo)=>{
       if(id!==ATTACHED)return false;
       let name="",mime="",payload=null;
       walk(bytes,fileFrom,fileTo,(child,a,b)=>{
         if(child===FILE_NAME)name=text(bytes,a,b);
         if(child===FILE_MIME)mime=text(bytes,a,b).toLowerCase();
         if(child===FILE_DATA&&b-a>0&&b-a<=MAX_IMAGE)
           payload=bytes.subarray(a,b);
         return false;
       });
       if(!payload||!validImage(payload,mime))return false;
       // Require a conventional cover filename, avoiding unrelated art
       // attachments and oversized/unsafe vector image formats.
       if(!/^(cover|folder|poster|front)(?:[._-].*)?\.(?:jpe?g|png|webp)$/i.test(name))
         return false;
       matched={mime,bytes:payload.slice()};
       return true;
     });
     if(matched)return matched;
   }
   return null;
 }
 async function extract(file){
   if(!file||!/\.mkv$/i.test(file.name||"")||typeof file.slice!=="function")
     return null;
   const bytes=new Uint8Array(await file.slice(0,MAX_SCAN).arrayBuffer());
   const result=extractBytes(bytes);
   if(!result)return null;
   return URL.createObjectURL(new Blob([result.bytes],{type:result.mime}));
 }
 return {extractBytes,extract};
});