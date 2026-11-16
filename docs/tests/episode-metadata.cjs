"use strict";
const assert=require("node:assert/strict");
const meta=require("../episode-metadata.js");
const jelly=require("../jellyfin-artwork.js");
assert.deepEqual(meta.parseFilename("Mike.Judges.Beavis.and.Butt.Head.S01E04.mkv"),
  {type:"episode",series:"Mike Judges Beavis and Butt Head",season:1,episode:4,year:null});
assert.deepEqual(meta.parseFilename("Some_Show_2022_S02E13.mp4"),
  {type:"episode",series:"Some Show",season:2,episode:13,year:2022});
assert.deepEqual(meta.parseFilename("Episode 1x04.avi"),
  {type:"episode",series:"Episode",season:1,episode:4,year:null});
assert.deepEqual(meta.parseFilename("The.Matrix.1999.1080p.mkv"),
  {type:"movie",title:"The Matrix",year:1999});
assert.equal(meta.parseFilename("S01E04.mkv"),null);
assert.equal(meta.allowedImage("http://static.tvmaze.com/uploads/abc.jpg","TVmaze"),null);
assert.equal(meta.allowedImage("https://evil.test/remote.jpg","TVmaze"),null);
assert.equal(meta.allowedImage("https://image.tmdb.org/t/p/w300/still.jpg","TMDb"),
  "https://image.tmdb.org/t/p/w300/still.jpg");
assert.equal(jelly.choose({Type:"Episode",ImageTags:{Thumb:"https://static.tvmaze.com/ep.jpg"},
  SeriesThumbImageTag:"https://static.tvmaze.com/series.jpg"}).url,
  "https://static.tvmaze.com/ep.jpg");
assert.equal(jelly.choose({Type:"Episode",SeriesThumbImageTag:"https://static.tvmaze.com/series.jpg"}).url,
  "https://static.tvmaze.com/series.jpg");
const tvShows=[
 {show:{id:301,name:"Example Show",premiered:"2017-01-01"}},
 {show:{id:302,name:"Example Show",premiered:"2022-01-01"}}
];
assert.equal(meta.findShow({series:"Example Show",year:2022},tvShows).id,302);
assert.equal(meta.findShow({series:"Example Show",year:null},tvShows),null);
// Regression: TVmaze uses "Butt-Head"; filename may use "Butthead".
assert.deepEqual(meta.parseFilename("Mike.Judges.Beavis.and.Butthead.S01E04.1080p.mkv"),
 {type:"episode",series:"Mike Judges Beavis and Butthead",season:1,episode:4,year:null});
assert.deepEqual(meta.parseFilename("Mike.Judges.Beavis.and.Butt.Head.S01.E04.mkv"),
 {type:"episode",series:"Mike Judges Beavis and Butt Head",season:1,episode:4,year:null});
const beavisShow={show:{id:49022,name:"Mike Judge's Beavis and Butt-Head",
 premiered:"2022-08-04",image:{medium:"https://static.tvmaze.com/poster.jpg"}}};
assert.equal(meta.findShow({series:"Mike Judges Beavis and Butthead"},[beavisShow])?.id,49022);
assert.equal(meta.findShow({series:"Mike Judges Beavis and Butt Head"},[beavisShow])?.id,49022);
assert.equal(meta.findShow({series:"Mike Judges Beavis and Butthead"},
 [beavisShow,{show:{...beavisShow.show,id:489}}]),null);
let requested=[];
const response=data=>({ok:true,text:async()=>JSON.stringify(data)});
const api=meta.create({
 selectImage:jelly.choose,
 sleep:async()=>{},
 fetchJSON:async(url,options)=>{
   requested.push({url,options});
   if(url.includes("/search/shows"))return response([{show:{
     id:123,name:"Example Show",premiered:"2022-03-01",
     image:{medium:"https://static.tvmaze.com/uploads/images/medium_portrait/1/2.jpg"},
     url:"https://www.tvmaze.com/shows/123/example-show"
   }}]);
   if(url.includes("/shows/123/episodes"))return response([
     {season:1,number:1,name:"Pilot",
      image:{medium:"https://static.tvmaze.com/uploads/images/medium_landscape/1/3.jpg"},
      url:"https://www.tvmaze.com/episodes/123/pilot"},
     {season:1,number:2,name:"Second episode",
      image:{medium:"https://static.tvmaze.com/uploads/images/medium_landscape/1/4.jpg"},
      url:"https://www.tvmaze.com/episodes/124/second"}
   ]);
   throw Error("Unexpected network request "+url);
 }
});
async function run(){
 const [first,second]=await Promise.all([
   api.find("Example.Show.2022.S01E01.mkv"),
   api.find("Example.Show.2022.S01E02.mkv")
 ]);
 assert.equal(first.url,"https://static.tvmaze.com/uploads/images/medium_landscape/1/3.jpg");
 assert.equal(second.url,"https://static.tvmaze.com/uploads/images/medium_landscape/1/4.jpg");
 assert.equal(first.kind,"Thumb");
 assert.equal(first.provider,"TVmaze");
 assert.equal(requested.length,2,"One show search and one episode list fetch");
 assert.ok(requested.every(x=>x.options.credentials==="omit"));
 assert.ok(requested.every(x=>!x.url.includes(".mkv")));
 assert.equal(await api.find("An.Unmatched.Title.2021.mkv"),null,
   "Movies need an optional TMDb token");
 const noProvider=meta.create({enabled:()=>false,fetchJSON:()=>{throw Error("Should not fetch")}});
 assert.equal(await noProvider.find("Example.Show.S01E01.mkv"),null);
 // A missing episode still uses verified series artwork. Simulate TVmaze 429
 // before a successful response so the request retry path is covered.
 let calls=0,retried=0;
 const retryApi=meta.create({
   selectImage:jelly.choose,sleep:async()=>{},
   fetchJSON:async(url,opts)=>{
     calls++;
     if(url.includes("/search/shows")&&retried++===0)
       return {ok:false,status:429};
     if(url.includes("/search/shows"))return response([beavisShow]);
     if(url.includes("/shows/49022/episodes"))return response([
       {season:1,number:4,name:"Beekeepers",image:null}
     ]);
     throw Error("Unexpected URL "+url);
   }
 });
 const fallback=await retryApi.find("Mike.Judges.Beavis.and.Butthead.S01E04.mkv");
 assert.equal(fallback.url,"https://static.tvmaze.com/poster.jpg");
 assert.equal(fallback.provider,"TVmaze");
 assert.ok(calls>=3,"Search retry and episode fetch");
 // If the episode still exists but its image fails at display time,
 // the metadata result also carries the series poster URL as a fallback.
 const stillApi=meta.create({
   selectImage:jelly.choose,sleep:async()=>{},
   fetchJSON:async(url)=>{
     if(url.includes("/search/shows"))return response([beavisShow]);
     return response([{season:1,number:4,name:"Beekeepers",
       image:{medium:"https://static.tvmaze.com/episode.jpg"}}]);
   }
 });
 const still=await stillApi.find("Mike.Judges.Beavis.and.Butthead.S01E04.mkv");
 assert.equal(still.url,"https://static.tvmaze.com/episode.jpg");
 assert.equal(still.fallbackUrl,"https://static.tvmaze.com/poster.jpg");
 // Search results can omit the desired show for the unpunctuated filename.
 // The next query must preserve the canonical possessive/hyphenation.
 let queryCount=0;
 const alternativeApi=meta.create({
   selectImage:jelly.choose,sleep:async()=>{},
   fetchJSON:async url=>{
     if(url.includes("/search/shows")){
       queryCount++;
       const query=decodeURIComponent(url.split("?q=")[1]||"");
       return response(query.includes("Judge's")?[beavisShow]:[]);
     }
     if(url.includes("/shows/49022/episodes"))return response([
       {season:1,number:4,name:"Beekeepers",
         image:{medium:"https://static.tvmaze.com/episode.jpg"}}
     ]);
     throw Error("Unknown TVmaze endpoint "+url);
   }
 });
 const recovered=await alternativeApi.find("Mike.Judges.Beavis.and.Butthead.S01E04.mkv");
 assert.equal(recovered.url,"https://static.tvmaze.com/episode.jpg");
 assert.equal(queryCount,2);
 console.log("PASS: TVmaze title variants, bounded 429 retry and series fallback");
 console.log("PASS: TVmaze episode art, ambiguity handling, Jellyfin priority and privacy");
}
run().catch(error=>{console.error(error);process.exitCode=1});
