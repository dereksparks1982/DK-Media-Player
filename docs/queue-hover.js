/* DK Media Player: one muted local-video hover preview for Up Next.
   Never seeks or pauses the main movie and never fetches remote sources. */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  else root.DKQueueHover=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const eligible=item=>!!(item&&item.kind==="file"&&!item.audio&&
   typeof item.src==="string"&&item.src.startsWith("blob:"));
 function create({makeVideo,delay=430}){
   let timer=null,active=null;
   const stop=()=>{
     clearTimeout(timer);timer=null;
     if(!active)return;
     const {video}=active;active=null;
     try{video.pause();video.removeAttribute("src");video.load();}catch(_){}
     video.remove();
   };
   const start=(item,box)=>{
     if(!eligible(item)||!box.isConnected)return;
     stop();
     const video=makeVideo();
     video.className="queue-hover-video";
     video.muted=true;video.defaultMuted=true;video.playsInline=true;
     video.loop=true;video.controls=false;video.preload="metadata";
     video.setAttribute("aria-hidden","true");
     video.setAttribute("tabindex","-1");
     active={video,item};
     const play=()=>{
       if(!active||active.video!==video)return;
       const promise=video.play();
       if(promise&&typeof promise.catch==="function")promise.catch(()=>{});
     };
     video.addEventListener("loadedmetadata",()=>{
       if(!active||active.video!==video)return;
       const duration=video.duration;
       const target=Number.isFinite(duration)&&duration>6?
         Math.min(5,duration*.12):0;
       if(target){try{video.currentTime=target;}catch(_){play();}}
       else play();
     });
     video.addEventListener("seeked",play);
     video.addEventListener("loadeddata",play);
     video.addEventListener("error",stop);
     box.append(video);
     try{video.src=item.src;video.load();}catch(_){stop();}
   };
   const bind=(button,item,box)=>{
     if(!eligible(item))return;
     button.addEventListener("pointerenter",event=>{
       if(event.pointerType==="touch")return;
       stop();
       timer=setTimeout(()=>start(item,box),delay);
     });
     button.addEventListener("pointerleave",stop);
     button.addEventListener("pointercancel",stop);
     button.addEventListener("click",stop);
     button.addEventListener("blur",stop);
   };
   return {bind,stop};
 }
 return {eligible,create};
});