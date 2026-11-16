/* DK Media Player: bounded local queue artwork extraction.
   Try an optional embedded Matroska cover, then a muted video frame.
   No uploads, remote requests, thumbnail services or persistent caches. */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.DKQueueArtwork=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const MAX_WIDTH=160, MAX_HEIGHT=90, MAX_WORKERS=3;
 const eligible=item=>!!(item&&item.kind==="file"&&!item.audio&&
   typeof item.src==="string"&&item.src.startsWith("blob:"));
 function capture(src,{makeVideo,makeCanvas}){
   return new Promise(resolve=>{
     const video=makeVideo();
     let complete=false, timer=null, seekPending=false;
     const finish=picture=>{
       if(complete)return;
       complete=true;
       clearTimeout(timer);
       try{video.pause();video.removeAttribute("src");video.load();}catch(_){}
       resolve(picture);
     };
     const draw=()=>{
       if(complete||seekPending||!video.videoWidth||!video.videoHeight||
          video.readyState<2)return;
       try{
         const canvas=makeCanvas();
         const scale=Math.min(MAX_WIDTH/video.videoWidth,MAX_HEIGHT/video.videoHeight);
         canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
         canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
         const context=canvas.getContext("2d");
         if(!context){finish(null);return;}
         context.drawImage(video,0,0,canvas.width,canvas.height);
         finish(canvas.toDataURL("image/jpeg",.72));
       }catch(_){finish(null);}
     };
     video.muted=true;video.defaultMuted=true;
     video.preload="auto";video.playsInline=true;
     video.addEventListener("error",()=>finish(null),{once:true});
     video.addEventListener("seeked",()=>{seekPending=false;draw();});
     video.addEventListener("loadeddata",draw);
     video.addEventListener("loadedmetadata",()=>{
       if(complete)return;
       const duration=video.duration;
       if(Number.isFinite(duration)&&duration>4){
         seekPending=true;
         try{video.currentTime=Math.min(15,Math.max(2,duration*.1));}
         catch(_){seekPending=false;draw();}
       }else draw();
     },{once:true});
     timer=setTimeout(()=>finish(null),5500);
     try{video.src=src;video.load();}catch(_){finish(null);}
   });
 }
 function create({makeVideo,makeCanvas,onReady,isActive,metadataCover,workers=MAX_WORKERS}){
   const pending=new WeakSet(), jobs=[];
   let busy=0;
   const pump=()=>{
     while(busy<Math.max(1,Math.min(3,workers)) && jobs.length){
       const item=jobs.shift();
       if(!isActive(item))continue;
       busy++;
       void (async()=>{
         let cover=null;
         try{
           if(metadataCover&&item.file&&/\.mkv$/i.test(item.file.name))
             cover=await metadataCover(item.file);
           if(cover && !isActive(item)){
             if(typeof URL!=="undefined")URL.revokeObjectURL(cover);
             cover=null;
           }
           const picture=cover || await capture(item.src,{makeVideo,makeCanvas});
           if(isActive(item)&&picture){
             item.thumbnail=picture;
             item.thumbnailBlob=!!cover;
             onReady(item);
           }else if(cover && typeof URL!=="undefined"){
             URL.revokeObjectURL(cover);
           }
         }catch(_){
           if(cover&&typeof URL!=="undefined")URL.revokeObjectURL(cover);
         }finally{busy--;pump();}
       })();
     }
   };
   return {request(item){
     if(!eligible(item)||pending.has(item))return false;
     pending.add(item);jobs.push(item);pump();return true;
   }};
 }
 return {eligible,capture,create};
});