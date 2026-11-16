/* DK Media Player: local filename-based programme title cards.
   No remote poster service and no extraction of random film frames. */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 else root.DKTitleCard=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 function parse(filename){
   const clean=String(filename||"")
     .replace(/\.(?:mkv|mp4|m4v|mov|avi|webm|ts|mp3|m4a|flac|ogg|opus)$/i,"")
     .replace(/[._]+/g," ").replace(/\s+/g," ").trim();
   const episode=/^(.*?)\s+[sS](\d{1,2})[eE](\d{1,3})(?:\s*[-:]?\s*(.*))?$/.exec(clean);
   if(episode){
     const title=episode[1].replace(/[\s-]+$/,"").trim()||clean;
     const code="S"+String(Number(episode[2])).padStart(2,"0")+
       " · E"+String(Number(episode[3])).padStart(2,"0");
     const subtitle=(episode[4]||"").trim();
     return {title,detail:code+(subtitle?" · "+subtitle:"")};
   }
   const year=/^(.*?)\s+((?:19|20)\d{2})(?:\s+.*)?$/.exec(clean);
   if(year&&year[1].trim())return {title:year[1].trim(),detail:year[2]};
   return {title:clean||"Untitled",detail:""};
 }
 return {parse};
});