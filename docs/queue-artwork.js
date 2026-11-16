/* Local-only queue artwork: derive small frame thumbnails from user-selected
   blob URLs. No network access, no uploads, no persistent thumbnail cache. */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 else root.DKQueueArtwork=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const MAX_WIDTH=160,MAX_HEIGHT=90;
 function eligible(item){
   return !!(item&&item.kind==="file"&&!item.audio&&
     typeof item.src==="string"&&item.src.startsWith("blob:"));
 }
 function create({makeVideo,makeCanvas,onReady,isActive}){
   const requested=new WeakSet(),work=[];
   let active=false;
   const next=async()=>{
     if(active)return;
     active=true;
     while(work.length){
       const item=work.shift();
       if(!isActive(item))continue;
       try{
         const picture=await capture(item.src,{makeVideo,makeCanvas});
         if(picture&&isActive(item)){
           item.thumbnail=picture;
           onReady(item);
         }
       }catch(_){/* Unsupported codecs retain the placeholder. */}
     }
     active=false;
   };
   return {request(item){
     if(!eligible(item)||requested.has(item))return false;
     requested.add(item);work.push(item);void next();return true;
   }};
 }
 function capture(src,{makeVideo,makeCanvas}){
   return new Promise(resolve=>{
     const video=makeVideo();
     let complete=false,timer=null;
     const finish=picture=>{
       if(complete)return;
       complete=true;
       clearTimeout(timer);
       try{video.pause();video.removeAttribute("src");video.load();}catch(_){}
       resolve(picture);
     };
     const draw=()=>{
       if(complete||!video.videoWidth||!video.videoHeight||video.readyState<2)return;
       try{
         const canvas=makeCanvas();
         const ratio=Math.min(MAX_WIDTH/video.videoWidth,MAX_HEIGHT/video.videoHeight);
         canvas.width=Math.max(1,Math.round(video.videoWidth*ratio));
         canvas.height=Math.max(1,Math.round(video.videoHeight*ratio));
         const context=canvas.getContext("2d");
         if(!context){finish(null);return;}
         context.drawImage(video,0,0,canvas.width,canvas.height);
         finish(canvas.toDataURL("image/jpeg",.72));
       }catch(_){finish(null);}
     };
     video.muted=true;video.preload="auto";video.playsInline=true;
     video.addEventListener("error",()=>finish(null),{once:true});
     video.addEventListener("seeked",draw);
     video.addEventListener("loadeddata",draw);
     video.addEventListener("loadedmetadata",()=>{
       try{
         const duration=video.duration;
         if(Number.isFinite(duration)&&duration>4)
           video.currentTime=Math.min(5,Math.max(1,duration*.1));
         else if(video.readyState>=2)draw();
       }catch(_){finish(null);}
     },{once:true});
     timer=setTimeout(()=>finish(null),4500);
     try{video.src=src;video.load();}catch(_){finish(null);}
   });
 }
 return {eligible,create,capture};
});