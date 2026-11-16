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
 console.log("PASS: TVmaze episode art, ambiguity handling, Jellyfin priority and privacy");
}
run().catch(error=>{console.error(error);process.exitCode=1});
