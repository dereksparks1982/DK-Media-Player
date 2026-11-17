/* DK Media Player: real artwork in Up Next.
 * TVmaze with optional TMDb fallback. Only parsed programme names are sent.
 * Video bytes, handles, playback state and local paths never leave the device.
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
 let enabled=true,token="",generation=0;
 try{enabled=localStorage.getItem(pref)!=="false"}catch(_){}
 try{token=sessionStorage.getItem(tokenKey)||""}catch(_){}
 enabledBox.checked=enabled;
 let seen=new WeakSet(),cache=new Map(),retryScheduled=null;
 const retried=new Set(),retryQueue=new Set();
 const choose=(item,opts)=>window.DKJellyfinArtwork?
   window.DKJellyfinArtwork.choose(item,opts):null;
 const finder=window.DKMediaMetadata.create({
   enabled:()=>enabled,token:()=>token,selectImage:choose
 });
 const locale=(en,ru)=>document.documentElement.lang==="ru"?ru:en;
 function status(box,message,state){
   if(!box)return;
   box.title=message;
   box.dataset.artworkStatus=state;
   box.setAttribute("aria-label",message);
 }
 function resetBox(box){
   // The empty state must never mimic episode metadata.
   box.replaceChildren();
   const fallback=document.createElement("span");
   fallback.className="queue-artwork-fallback";
   fallback.textContent="▶";
   box.append(fallback);
   box.classList.remove("has-art");
 }
 function showImage(box,art,requestedGeneration){
   if(!box.isConnected||requestedGeneration!==generation||!enabled)return;
   const urls=[art.url,art.fallbackUrl].filter((url,i,all)=>url&&all.indexOf(url)===i);
   const image=document.createElement("img");
   image.className="queue-artwork-image";
   image.alt="";
   image.decoding="async";
   image.loading="eager"; // a short 21-episode sidebar should not defer loaded artwork
   image.hidden=true;
   let index=0;
   image.onload=()=>{
     if(!box.isConnected||requestedGeneration!==generation)return;
     image.hidden=false;
     box.classList.add("has-art");
     const placeholder=box.querySelector(".queue-artwork-fallback");
     if(placeholder)placeholder.hidden=true;
     const provider=locale(art.provider==="TVmaze"?"TVmaze":art.provider,
       art.provider==="TVmaze"?"ТВмейз":art.provider==="TMDb"?"ТМДБ":"Источник");
     const displayTitle=locale(art.title||"Episode artwork","Изображение серии");
     status(box,provider+": "+displayTitle,"loaded");
   };
   image.onerror=()=>{
     if(!box.isConnected||requestedGeneration!==generation)return;
     if(++index<urls.length){image.src=urls[index];return;}
     image.remove();
     const fallback=box.querySelector(".queue-artwork-fallback");
     if(fallback)fallback.hidden=false;
     box.classList.remove("has-art");
     status(box,locale("Artwork image failed to load; retrying","Не удалось загрузить изображение, повторная попытка"),
       "image-error");
     scheduleRetry(box.closest("li")?.querySelector(".item-title")?.textContent?.trim());
   };
   box.append(image);
   image.src=urls[0];
 }
 function scheduleRetry(name){
   if(!enabled||!name||retried.has(name))return;
   retried.add(name);
   retryQueue.add(name);
   if(retryScheduled!==null)return;
   retryScheduled=setTimeout(()=>{
     retryScheduled=null;
     if(!enabled)return;
     // Do not invalidate unrelated in-flight images when retrying one title.
     finder.clear();
     for(const name of retryQueue)cache.delete(name);
     const names=new Set(retryQueue);
     retryQueue.clear();
     for(const li of queue.children){
       if(names.has(li.querySelector(".item-title")?.textContent?.trim()))
         seen.delete(li);
     }
     scan();
   },4800);
 }
 const scan=()=>{
   for(const li of queue.children){
     if(seen.has(li)||!li.matches("li")||li.classList.contains("queue-empty"))continue;
     seen.add(li);
     const box=li.querySelector(".queue-artwork");
     if(!box)continue;
     if(li.dataset.queueKind!=="file"||li.dataset.queueAudio==="1")continue;
     resetBox(box);
     const name=li.querySelector(".item-title")?.textContent?.trim();
     if(!enabled){
       status(box,locale("Automatic artwork lookup disabled","Поиск изображений отключён"),
         "disabled");
       continue;
     }
     if(!name||name.length>220)continue;
     const parsed=window.DKMediaMetadata.parseFilename(name);
     if(!parsed){
       status(box,locale("Cannot identify episode or movie from filename",
         "Не удалось определить серию или фильм по имени файла"),"filename");
       continue;
     }
     if(parsed.type==="movie"&&!token){
       status(box,locale("Movie posters require an optional TMDb token",
         "Для обложек фильмов необходим ключ ТМДБ"),"tmdb-required");
       continue;
     }
     const requestedGeneration=generation;
     status(box,locale("Finding episode artwork…","Поиск изображения серии…"),"loading");
     if(!cache.has(name))cache.set(name,finder.find(name).catch(()=>null));
     cache.get(name).then(art=>{
       if(!box.isConnected||requestedGeneration!==generation||!enabled)return;
       if(art?.url){
         showImage(box,art,requestedGeneration);
       }else{
         const retrying=!retried.has(name);
         status(box,retrying?
           locale("No matching artwork yet; retrying automatically",
             "Изображение пока не найдено; повторная попытка"):
           locale("No matching artwork found. Check filename and provider",
             "Изображение не найдено. Проверьте имя файла и источник"),
           retrying?"retrying":"unavailable");
         if(retrying)scheduleRetry(name);
       }
     }).catch(()=>{});
   }
 };
 const reset=()=>{
   generation++;
   seen=new WeakSet();cache.clear();retried.clear();retryQueue.clear();
   if(retryScheduled!==null)clearTimeout(retryScheduled);
   retryScheduled=null;finder.clear();scan();
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
   if(value&&(value.length<20||value.length>1500)){
     tokenBox.setCustomValidity(locale("Use your TMDb Read Access Token.",
       "Введите ключ доступа ТМДБ."));
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