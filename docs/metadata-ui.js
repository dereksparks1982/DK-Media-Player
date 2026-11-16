/* DK Media Player: real artwork in Up Next.
 * Public TVmaze for episode art; optionally TMDb with a user token.
 * Does not upload local media, alter playback, or add a background service.
 */
(function(){
 "use strict";
 if(typeof document==="undefined"||!window.DKMediaMetadata)return;
 const queue=document.getElementById("queue");
 const enabledBox=document.getElementById("autoArtwork");
 const tokenBox=document.getElementById("tmdbToken");
 const apply=document.getElementById("applyTmdbToken");
 const clear=document.getElementById("clearTmdbToken");
 if(!queue||!enabledBox||!tokenBox||!apply||!clear)return;
 const pref="dkmedia.web.artwork.enabled.v1";
 const tokenKey="dkmedia.web.tmdb.token.tab";
 let enabled=true, token="",generation=0;
 try{enabled=localStorage.getItem(pref)!=="false"}catch(_){}
 try{token=sessionStorage.getItem(tokenKey)||""}catch(_){}
 enabledBox.checked=enabled;
 let seen=new WeakSet(), cache=new Map();
 const chooser=(item,opts)=>window.DKJellyfinArtwork ?
   window.DKJellyfinArtwork.choose(item,opts):null;
 const finder=window.DKMediaMetadata.create({
   enabled:()=>enabled,token:()=>token,selectImage:chooser
 });
 const showPlaceholder=box=>{
   box.replaceChildren();
   const fallback=document.createElement("span");
   fallback.className="queue-artwork-fallback";
   fallback.textContent="▶";
   box.append(fallback);
   box.classList.remove("has-art");
 };
 const showImage=(box,url,generationAtStart)=>{
   if(!box.isConnected||generationAtStart!==generation||!enabled)return;
   const image=document.createElement("img");
   image.className="queue-artwork-image";
   image.alt="";
   image.decoding="async";
   image.loading="lazy";
   image.hidden=true;
   image.onload=()=>{
     if(!box.isConnected||generationAtStart!==generation)return;
     image.hidden=false;
     box.classList.add("has-art");
     const placeholder=box.querySelector(".queue-artwork-fallback");
     if(placeholder)placeholder.hidden=true;
   };
   image.onerror=()=>{
     if(!box.isConnected||generationAtStart!==generation)return;
     image.remove();
     box.classList.remove("has-art");
     const placeholder=box.querySelector(".queue-artwork-fallback");
     if(placeholder)placeholder.hidden=false;
   };
   box.append(image);
   image.src=url;
 };
 const scan=()=>{
   for(const li of queue.children){
     if(seen.has(li)||!li.matches("li")||li.classList.contains("queue-empty"))continue;
     seen.add(li);
     const box=li.querySelector(".queue-artwork");
     if(!box)continue;
     // Do not transmit remote URLs, audio filenames, or local file contents.
     if(li.dataset.queueKind!=="file"||li.dataset.queueAudio==="1")continue;
     showPlaceholder(box);
     if(!enabled)continue;
     const name=li.querySelector(".item-title")?.textContent?.trim();
     if(!name||name.length>220)continue;
     const currentGeneration=generation;
     if(!cache.has(name))cache.set(name,
       finder.find(name).catch(()=>null));
     cache.get(name).then(art=>{
       if(art?.url)showImage(box,art.url,currentGeneration);
     }).catch(()=>{});
   }
 };
 const reset=()=>{
   generation++;
   seen=new WeakSet();
   cache.clear();
   finder.clear();
   scan();
 };
 enabledBox.addEventListener("change",()=>{
   enabled=enabledBox.checked;
   try{localStorage.setItem(pref,enabled?"true":"false")}catch(_){}
   reset();
 });
 const saveToken=value=>{
   token=value.trim();
   try{
     if(token)sessionStorage.setItem(tokenKey,token);
     else sessionStorage.removeItem(tokenKey);
   }catch(_){}
   tokenBox.value="";
   reset();
 };
 apply.addEventListener("click",()=>{
   const value=tokenBox.value.trim();
   if(value && (value.length<20||value.length>1500)){
     tokenBox.setCustomValidity("Use your TMDb Read Access Token.");
     tokenBox.reportValidity();return;
   }
   tokenBox.setCustomValidity("");
   saveToken(value);
 });
 clear.addEventListener("click",()=>saveToken(""));
 const observer=new MutationObserver(scan);
 observer.observe(queue,{childList:true});
 scan();
})();