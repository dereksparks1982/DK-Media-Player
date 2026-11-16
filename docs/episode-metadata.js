/* DK Media Player: browser-side episode & movie artwork metadata.
 * TVmaze (CC BY-SA, https://www.tvmaze.com/api) is keyless and CORS-enabled.
 * Optional TMDb Read Access Token enables a second source (not embedded).
 * No file bytes or full local paths leave the browser: only parsed titles,
 * seasons and episode numbers are sent to the selected provider.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.DKMediaMetadata=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const TV="https://api.tvmaze.com";
 const TM="https://api.themoviedb.org/3";
 const MAX_BODY=3*1024*1024;
 function normalize(value){
   return String(value||"").normalize("NFKD")
     .replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ")
     .replace(/['’]/g,"").replace(/[^a-zA-Z0-9\u0400-\u04ff]+/g," ")
     .toLowerCase().replace(/\s+/g," ").trim();
 }
 function cleanTitle(name){
   return String(name||"").replace(/[\\/]/g," ").replace(/\.[a-z0-9]{2,5}$/i,"")
     .replace(/[\[\]()]/g," ").replace(/[._]+/g," ")
     .replace(/\s+/g," ").trim().slice(0,170);
 }
 function parseFilename(name){
   const text=cleanTitle(name);
   const tv=/(?:^|[\s-])(?:s(\d{1,2})[\s-]*e(\d{1,3})|(\d{1,2})[\s-]*x[\s-]*(\d{1,3}))(?=$|[\s-])/i.exec(text);
   if(tv){
     let series=text.slice(0,tv.index).replace(/[\s:-]+$/,"").trim();
     const yearMatch=/\s+((?:19|20)\d{2})$/.exec(series);
     const year=yearMatch?Number(yearMatch[1]):null;
     series=series.replace(/\s+(?:19|20)\d{2}$/,"").trim();
     const season=Number(tv[1]||tv[3]),episode=Number(tv[2]||tv[4]);
     if(series.length>=2&&season<=99&&episode>=1&&episode<=999)
       return {type:"episode",series,season,episode,year};
     return null;
   }
   const movie=/^(.+?)\s+((?:19|20)\d{2})(?:\s|$)/.exec(text);
   let title=movie?movie[1].trim():text.replace(/\s+(?:1080p|720p|2160p|bluray|brrip|webrip|web-dl|h264|h265|x264|x265).*$/i,"").trim();
   if(title.length<2)return null;
   return {type:"movie",title:title.slice(0,120),year:movie?Number(movie[2]):null};
 }
 function findExact(query,values,getName){
   const norm=normalize(query);
   const matches=(Array.isArray(values)?values:[]).filter(x=>normalize(getName(x))===norm);
   return matches.length===1?matches[0]:null;
 }
 function findShow(info,values){
   const norm=normalize(info.series);
   const compact=value=>normalize(value).replace(/\s+/g,"");
   const entries=(Array.isArray(values)?values:[]).filter(x=>x?.show&&
     typeof x.show.name==="string"&&Number.isSafeInteger(x.show.id));
   const exact=entries.filter(x=>normalize(x.show.name)===norm);
   // Jellyfin-style robust normalization: "Butt-Head", "Butthead" and
   // "Butt.Head" should be one candidate, not three unrelated TV shows.
   const collapsed=entries.filter(x=>compact(x.show.name)===compact(norm));
   const tail=entries.filter(x=>{
     const name=normalize(x.show.name);
     return norm.length>=11 && (name.endsWith(" "+norm)||norm.endsWith(" "+name));
   });
   const candidate=exact.length?exact:collapsed.length?collapsed:tail;
   if(info.year){
     const dated=candidate.filter(x=>String(x.show.premiered||"").slice(0,4)===String(info.year));
     if(dated.length===1)return dated[0].show;
   }
   return candidate.length===1?candidate[0].show:null;
 }
 function allowedImage(url,provider){
   if(typeof url!=="string")return null;
   try{
     const parsed=new URL(url);
     const hosts=provider==="TVmaze"?["static.tvmaze.com","images.tvmaze.com"]:
       provider==="TMDb"?["image.tmdb.org"]:[];
     return parsed.protocol==="https:"&&hosts.includes(parsed.hostname)?parsed.href:null;
   }catch(_){return null;}
 }
 function allowedCredit(url,provider){
   if(typeof url!=="string")return null;
   try{
     const parsed=new URL(url);
     const hosts=provider==="TVmaze"?["www.tvmaze.com","tvmaze.com"]:
       provider==="TMDb"?["www.themoviedb.org","themoviedb.org"]:[];
     return parsed.protocol==="https:"&&hosts.includes(parsed.hostname)?parsed.href:null;
   }catch(_){return null;}
 }
 function create({fetchJSON=typeof fetch==="function"?fetch.bind(globalThis):null,
                  selectImage=null,token=()=>"",enabled=()=>true,
                  sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
   const searchTV=new Map(),episodesTV=new Map();
   const searchTM=new Map();
   let gate=Promise.resolve(),lastRequest=0;
   // One request at a time and at least 650ms apart: well below TVmaze's
   // documented rate limit. Requests for a series share in-flight promises.
   function request(url,headers={}){
     const task=gate.catch(()=>{}).then(async()=>{
       if(!fetchJSON)return null;
       // Retry temporary network errors and rate limits. Never retry
       // permanent 404 responses or a provider's rejected credentials.
       for(let attempt=0;attempt<3;attempt++){
         const wait=Math.max(0,650-(Date.now()-lastRequest));
         if(wait)await sleep(wait);
         lastRequest=Date.now();
         const opts={method:"GET",mode:"cors",credentials:"omit",headers};
         const controller=typeof AbortController!=="undefined"?new AbortController():null;
         let timer;
         if(controller){
           opts.signal=controller.signal;
           timer=setTimeout(()=>controller.abort(),10000);
         }
         try{
           const response=await fetchJSON(url,opts);
           const status=Number(response?.status)||0;
           if(response?.ok){
             if(typeof response.text==="function"){
               const raw=await response.text();
               return raw.length<=MAX_BODY?JSON.parse(raw):null;
             }
             return typeof response.json==="function"?await response.json():null;
           }
           if(status!==429&&(status<500||status>=600))return null;
         }catch(_){/* Network outage or timeout; try again below. */}
         finally{clearTimeout(timer);}
         if(attempt<2)await sleep(1000*(attempt+1));
       }
       return null;
     });
     gate=task.then(()=>undefined,()=>undefined);
     return task;
   }
   async function tvEpisode(info){
     const key=normalize(info.series);
     if(!searchTV.has(key)){
       searchTV.set(key,request(TV+"/search/shows?q="+encodeURIComponent(info.series))
         .then(list=>findShow(info,list)));
     }
     let show=await searchTV.get(key);
     // A compact alternate query helps with dot-separated and unhyphenated
     // filenames, without accepting an ambiguous result.
     if(!show){
       const compact=info.series
         .replace(/\bbutt[\s-]*head\b/ig,"Butt-Head")
         .replace(/\bjudges\b/ig,"Judge's");
       if(compact!==info.series){
         const alt=await request(TV+"/search/shows?q="+encodeURIComponent(compact));
         show=findShow(info,alt);
       }
     }
     if(!show||!Number.isSafeInteger(show.id)||show.id<=0)return null;
     if(!episodesTV.has(show.id))
       episodesTV.set(show.id,request(TV+"/shows/"+show.id+"/episodes"));
     const episodes=await episodesTV.get(show.id);
     const episode=(Array.isArray(episodes)?episodes:[]).find(x=>
       x&&x.season===info.season&&x.number===info.episode);
     // The show's own art is a safe fallback if an episode still is absent
     // or an episode list cannot be retrieved. Never fabricate an image.
     const series=allowedImage(show.image?.medium||show.image?.original,"TVmaze");
     if(!episode&&!series)return null;
     const still=allowedImage(episode?.image?.medium||episode?.image?.original,"TVmaze");
     return {still,series,title:episode?.name||"",show:show.name||"",
       provider:"TVmaze",credit:allowedCredit(episode?.url||show.url,"TVmaze")||
         "https://www.tvmaze.com"};
   }
   function tmdbImage(path,size){
     if(typeof path!=="string"||!/^\/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp)$/i.test(path))
       return null;
     return allowedImage("https://image.tmdb.org/t/p/"+size+path,"TMDb");
   }
   async function tmdbSearch(kind,title,year){
     const secret=String(token()||"").trim();
     if(!secret||secret.length<20||secret.length>1500)return null;
     const searchKey=kind+":"+normalize(title)+":"+(year||"")+":"+secret;
     if(!searchTM.has(searchKey)){
       const url=new URL(TM+"/search/"+kind);
       url.searchParams.set("query",title);
       url.searchParams.set("include_adult","false");
       if(year)url.searchParams.set(kind==="movie"?"year":"first_air_date_year",year);
       searchTM.set(searchKey,request(url.href,{Authorization:"Bearer "+secret})
         .then(data=>findExact(title,data?.results,x=>x?.name||x?.title)));
     }
     return searchTM.get(searchKey);
   }
   async function tmdbEpisode(info){
     const found=await tmdbSearch("tv",info.series,null);
     if(!found||!Number.isSafeInteger(found.id)||found.id<=0)return null;
     const secret=String(token()||"").trim();
     const ep=await request(TM+"/tv/"+found.id+"/season/"+info.season+
       "/episode/"+info.episode,{Authorization:"Bearer "+secret});
     if(!ep)return null;
     return {still:tmdbImage(ep.still_path,"w300"),
       series:tmdbImage(found.backdrop_path,"w300")||tmdbImage(found.poster_path,"w185"),
       title:ep.name||"",show:found.name||"",provider:"TMDb",
       credit:"https://www.themoviedb.org/tv/"+found.id+
         "/season/"+info.season+"/episode/"+info.episode};
   }
   async function tmdbMovie(info){
     const found=await tmdbSearch("movie",info.title,info.year);
     if(!found)return null;
     if(info.year&&typeof found.release_date==="string"&&
        !found.release_date.startsWith(String(info.year)))return null;
     const art=tmdbImage(found.backdrop_path,"w300")||tmdbImage(found.poster_path,"w185");
     if(!art)return null;
     return {still:art,series:null,title:found.title||info.title,
       provider:"TMDb",credit:"https://www.themoviedb.org/movie/"+found.id};
   }
   function choose(data){
     if(!data)return null;
     // Jellyfin-style image priority is implemented by the source adaptation.
     // Thumb = episode still, SeriesThumb = show fallback artwork.
     const item=data.type==="movie"?
       {Type:"Movie",ImageTags:{Primary:data.still}}:
       {Type:"Episode",ImageTags:{Thumb:data.still},
         SeriesThumbImageTag:data.series};
     const picked=selectImage?selectImage(item,{preferThumb:true}):
       data.still?{url:data.still,kind:"Thumb"}:
       data.series?{url:data.series,kind:"Thumb"}:null;
     return picked?{url:picked.url,kind:picked.kind,provider:data.provider,
       credit:data.credit,title:data.title,
       fallbackUrl:data.series&&data.series!==picked.url?data.series:null}:null;
   }
   async function find(filename){
     if(!enabled())return null;
     const info=parseFilename(filename);
     if(!info)return null;
     if(info.type==="movie"){
       if(!token())return null;
       return choose(await tmdbMovie(info));
     }
     const tv=await tvEpisode(info);
     if(tv?.still)return choose({...tv,type:"episode"});
     if(token()){
       const tm=await tmdbEpisode(info);
       if(tm?.still)return choose({...tm,type:"episode"});
       if(tv?.series)return choose({...tv,type:"episode"});
       return choose(tm?{...tm,type:"episode"}:null);
     }
     return choose(tv?{...tv,type:"episode"}:null);
   }
   function clear(){
     searchTV.clear();episodesTV.clear();searchTM.clear();
   }
   return {find,clear};
 }
 return {normalize,parseFilename,findExact,findShow,allowedImage,allowedCredit,create};
});