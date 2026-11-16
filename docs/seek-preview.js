/* DK Media Player seek preview. A second, muted, paused video is used only
   for local media. Hover never changes playback on the primary video. */
(function(root, factory){
  const api = factory();
  if(typeof module !== "undefined" && module.exports)module.exports=api;
  else root.DKSeekPreview=api;
})(typeof window !== "undefined" ? window : globalThis, function(){
 "use strict";
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function position(clientX,left,width){
   return width>0?clamp((clientX-left)/width,0,1):0;
 }
 function attach({seek,bubble,frame,label,current,duration,formatTime}){
   let frameSource="", pendingTime=null, timer=null, failed=false;
   const clear=()=>{clearTimeout(timer);timer=null;};
   const hide=()=>{clear();bubble.hidden=true;};
   const reset=()=>{
     hide();frameSource="";pendingTime=null;failed=false;
     frame.hidden=true;bubble.classList.remove("has-frame");
     try{frame.pause();frame.removeAttribute("src");frame.load();}catch(_){}
   };
   const seekFrame=()=>{
     if(failed||pendingTime===null||!frameSource)return;
     if(frame.readyState<1)return;
     try{frame.currentTime=pendingTime;}catch(_){frame.hidden=true;}
   };
   const show=(event=null)=>{
     const item=current(),length=duration();
     if(!item||seek.disabled||!Number.isFinite(length)||length<=0){hide();return;}
     const rect=seek.getBoundingClientRect();
     if(!rect.width){hide();return;}
     const fraction=event&&Number.isFinite(event.clientX)?
       position(event.clientX,rect.left,rect.width):
       clamp(Number(seek.value)/1000,0,1);
     pendingTime=clamp(fraction*length,0,Math.max(0,length-.05));
     const bubbleWidth=frame.hidden?70:160;
     const margin=Math.min(rect.width/2,bubbleWidth/2);
     bubble.style.left=clamp(fraction*rect.width,margin,rect.width-margin)+"px";
     label.textContent=formatTime(pendingTime);
     bubble.hidden=false;
     // Remote URLs could cause additional requests; only inspect local blobs.
     if(item.kind!=="file"||item.audio||!item.src){return;}
     if(item.src!==frameSource){
       frameSource=item.src;failed=false;frame.hidden=true;
       bubble.classList.remove("has-frame");
       try{frame.muted=true;frame.src=item.src;frame.load();}
       catch(_){failed=true;return;}
     }
     clear();
     timer=setTimeout(seekFrame,110);
   };
   seek.addEventListener("pointermove",event=>{
     if(event.pointerType!=="touch")show(event);
   });
   seek.addEventListener("pointerenter",event=>{
     if(event.pointerType!=="touch")show(event);
   });
   seek.addEventListener("pointerleave",hide);
   seek.addEventListener("pointerdown",event=>show(event));
   seek.addEventListener("pointerup",event=>{
     if(event.pointerType==="touch")setTimeout(hide,550);
   });
   seek.addEventListener("pointercancel",hide);
   seek.addEventListener("focus",()=>show());
   seek.addEventListener("blur",hide);
   seek.addEventListener("input",()=>show());
   frame.addEventListener("loadedmetadata",seekFrame);
   frame.addEventListener("seeked",()=>{
     const item=current();
     if(!bubble.hidden&&!failed&&item&&item.kind==="file"&&
        frameSource===item.src&&frame.readyState>=2){
       frame.hidden=false;bubble.classList.add("has-frame");
     }
   });
   frame.addEventListener("error",()=>{
     failed=true;frame.hidden=true;bubble.classList.remove("has-frame");
   });
   return {hide,reset};
 }
 return {attach,position};
});