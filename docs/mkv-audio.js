/* MKV AAC/Opus audio selection for the Chromium DK Kinehall player.
 * Local File reads, Matroska demuxing, WebCodecs decoding and WebAudio output.
 * Unsupported codecs are not treated as playable. No uploads or DRM bypass.
 */
(function(root,factory) {
  const api=factory();
  if (typeof module==="object" && module.exports) module.exports=api;
  else root.DKMkvAudio=api;
})(typeof globalThis!=="undefined"?globalThis:window,function(){
  "use strict";
  const SEGMENT=0x18538067,INFO=0x1549A966,TRACKS=0x1654AE6B;
  const ENTRY=0xAE,NUMBER=0xD7,CODEC=0x86,PRIVATE=0x63A2,AUDIO=0xE1;
  const CHANNELS=0x9F,RATE=0xB5,DEFAULT_DURATION=0x23E383,SCALE=0x2AD7B1;
  const CLUSTER=0x1F43B675,CLUSTER_TIME=0xE7,SIMPLE=0xA3,GROUP=0xA0,BLOCK=0xA1;
  const MAX_PACKET=2*1024*1024;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const contextType=()=>globalThis.AudioContext||globalThis.webkitAudioContext;
  const canAttempt=track=>Boolean(track &&
    (track.codec==="A_OPUS"||String(track.codec||"").startsWith("A_AAC")) &&
    typeof globalThis.AudioDecoder==="function" &&
    typeof globalThis.EncodedAudioChunk==="function" && contextType());
  const vint=(bytes,at,strip=false)=>{
    if(at>=bytes.length||!bytes[at]) throw new Error("Invalid EBML integer");
    let mask=128,width=1;
    while(!(bytes[at]&mask)&&width<=8){width++;mask>>=1;}
    if(width>(strip?8:4)||at+width>bytes.length) throw new Error("Invalid EBML width");
    let value=strip?bytes[at]&(mask-1):bytes[at];
    let unknown=strip&&value===mask-1;
    for(let i=1;i<width;i++){
      value=value*256+bytes[at+i];
      unknown=unknown&&bytes[at+i]===255;
    }
    if(!Number.isSafeInteger(value)) throw new Error("EBML value too large");
    return {value,width,unknown};
  };
  const unsigned=bytes=>{
    if(bytes.length>8) throw new Error("Invalid MKV integer");
    let n=0;for(const b of bytes)n=n*256+b;
    if(!Number.isSafeInteger(n)) throw new Error("MKV integer too large");
    return n;
  };
  const readerFor=file=>{
    let cacheStart=-1,cache=new Uint8Array();
    const read=async(at,length)=>{
      if(!Number.isSafeInteger(at)||!Number.isSafeInteger(length)||
         at<0||length<0||at+length>file.size) throw new Error("Invalid MKV byte range");
      if(!length)return new Uint8Array();
      if(at<cacheStart||at+length>cacheStart+cache.length){
        cache=new Uint8Array(await file.slice(at,Math.min(file.size,
          at+Math.max(length,256*1024))).arrayBuffer());
        cacheStart=at;
      }
      return cache.subarray(at-cacheStart,at-cacheStart+length);
    };
    const element=async(at,limit)=>{
      if(at+2>limit)return null;
      const head=await read(at,Math.min(12,limit-at));
      const id=vint(head,0),size=vint(head,id.width,true);
      const start=at+id.width+size.width;
      const end=size.unknown?limit:start+size.value;
      if(end>limit||end<start||!Number.isSafeInteger(end))
        throw new Error("Invalid MKV element size");
      return {id:id.value,start,end,unknown:size.unknown};
    };
    const children=async function*(from,to){
      let at=from,visits=0;
      while(at+2<=to){
        const node=await element(at,to);
        if(!node)break;
        yield node;
        if(node.unknown||node.end<=at)break;
        at=node.end;
        if(++visits%1024===0)await sleep(0);
      }
    };
    return {read,children};
  };
  const parseTrack=async(reader,entry)=>{
    const result={number:0,codec:"",privateData:null,channels:2,rate:48000,defaultDuration:0};
    for await(const field of reader.children(entry.start,entry.end)){
      const size=field.end-field.start;
      if(field.id===NUMBER)result.number=unsigned(await reader.read(field.start,size));
      else if(field.id===CODEC&&size<256)
        result.codec=new TextDecoder().decode(await reader.read(field.start,size));
      else if(field.id===PRIVATE&&size<=65536)
        result.privateData=(await reader.read(field.start,size)).slice();
      else if(field.id===DEFAULT_DURATION)
        result.defaultDuration=unsigned(await reader.read(field.start,size));
      else if(field.id===AUDIO){
        for await(const detail of reader.children(field.start,field.end)){
          const bytes=await reader.read(detail.start,detail.end-detail.start);
          if(detail.id===CHANNELS)result.channels=unsigned(bytes);
          if(detail.id===RATE){
            const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
            if(bytes.length===4)result.rate=dv.getFloat32(0,false);
            if(bytes.length===8)result.rate=dv.getFloat64(0,false);
          }
        }
      }
    }
    return result;
  };
  const configFor=meta=>{
    if(!Number.isInteger(meta.channels)||meta.channels<1||meta.channels>8||
       !Number.isFinite(meta.rate)||meta.rate<8000||meta.rate>192000)
      throw new Error("Invalid MKV audio channel or sample rate");
    if(meta.codec==="A_OPUS")return {codec:"opus",sampleRate:48000,
      numberOfChannels:meta.channels,
      ...(meta.privateData?{description:meta.privateData}:{})};
    if(meta.codec.startsWith("A_AAC")&&meta.privateData&&meta.privateData.length>=2){
      let profile=(meta.privateData[0]>>3)&31;
      if(profile===31)profile=32+((meta.privateData[0]&7)<<3)+(meta.privateData[1]>>5);
      return {codec:"mp4a.40."+profile,sampleRate:Math.round(meta.rate),
        numberOfChannels:meta.channels,description:meta.privateData};
    }
    throw new Error("This MKV audio track has no supported WebCodecs configuration");
  };
  const discover=async(file,number)=>{
    const reader=readerFor(file);
    for await(const node of reader.children(0,file.size)){
      if(node.id!==SEGMENT)continue;
      let scale=1000000;
      for await(const part of reader.children(node.start,node.end)){
        if(part.id===INFO){
          for await(const info of reader.children(part.start,part.end)){
            if(info.id===SCALE)scale=unsigned(await reader.read(info.start,info.end-info.start));
          }
        }else if(part.id===TRACKS){
          for await(const entry of reader.children(part.start,part.end)){
            if(entry.id!==ENTRY)continue;
            const meta=await parseTrack(reader,entry);
            if(meta.number===number)return {reader,segment:node,meta,scale};
          }
        }
      }
      break;
    }
    throw new Error("Selected MKV audio stream was not found");
  };
  const opusDuration=bytes=>{
    if(!bytes.length)return 20000;
    const c=bytes[0]>>3;
    const frame=c<12?[10000,20000,40000,60000][c%4]:
      c<16?[10000,20000][c%2]:[2500,5000,10000,20000][c%4];
    const mode=bytes[0]&3;
    const count=mode===0?1:mode===3?(bytes[1]||0)&63:2;
    return Math.min(120000,frame*Math.max(1,count));
  };
  const frameDuration=(bytes,meta)=>meta.defaultDuration?meta.defaultDuration/1000:
    meta.codec==="A_OPUS"?opusDuration(bytes):1024*1000000/meta.rate;
  const splitBlock=async(reader,part,number)=>{
    const size=part.end-part.start;
    if(size<4)return [];
    const head=await reader.read(part.start,Math.min(20,size));
    const id=vint(head,0,true);
    if(id.value!==number)return [];
    if(size>MAX_PACKET)throw new Error("MKV audio block exceeds safe size");
    const bytes=await reader.read(part.start,size);
    const displacement=(bytes[id.width]<<8)|bytes[id.width+1];
    const relative=displacement&32768?displacement-65536:displacement;
    const flags=bytes[id.width+2],lace=flags&6;
    let p=id.width+3;
    let count=1,sizes=[];
    if(lace){
      count=bytes[p++]+1;
      if(count>256)throw new Error("Invalid MKV lacing");
      if(lace===4){
        const remain=size-p;
        if(remain%count)throw new Error("Invalid fixed-size MKV lacing");
        sizes=Array(count).fill(remain/count);
      }else{
        let total=0,previous=0;
        for(let i=0;i<count-1;i++){
          let length=0;
          if(lace===2){
            let digit;
            do{
              if(p>=size)throw new Error("Invalid Xiph lacing");
              digit=bytes[p++];length+=digit;
            }while(digit===255);
          }else{
            const value=vint(bytes,p,true);p+=value.width;
            length=i===0?value.value:previous+value.value-
              (Math.pow(2,7*value.width-1)-1);
          }
          if(!Number.isSafeInteger(length)||length<0)throw new Error("Invalid audio frame size");
          sizes.push(length);previous=length;total+=length;
        }
        sizes.push(size-p-total);
      }
    }else sizes=[size-p];
    if(sizes.some(n=>n<0)||sizes.reduce((a,b)=>a+b,0)!==size-p)
      throw new Error("Corrupt MKV audio frame boundaries");
    return sizes.map(length=>{const data=bytes.slice(p,p+length);p+=length;return {data,relative};});
  };
  const create=({media,onError=()=>{},isMuted=()=>false})=>{
    let epoch=0,ctx=null,gain=null,decoder=null,selection=null;
    let level=1,scheduled=new Set(),recovering=false;
    const selectedNumber=()=>selection?selection.track.number:null;
    const active=()=>Boolean(selection&&decoder);
    const setVolume=value=>{
      level=Math.max(0,Math.min(1,Number(value)||0));
      if(gain)gain.gain.value=level;
    };
    const stop=()=>{
      ++epoch;
      selection=null;
      const old=decoder;decoder=null;
      if(old){try{old.close();}catch(_){}}
      for(const node of scheduled){try{node.stop();}catch(_){}}
      scheduled.clear();
      const previous=ctx;ctx=null;gain=null;
      if(previous)void previous.close().catch(()=>{});
      media.muted=Boolean(isMuted());
    };
    const fail=(err,token)=>{
      if(token!==epoch||recovering)return;
      recovering=true;
      stop();
      recovering=false;
      onError(err);
    };
    const output=(frame,token)=>{
      try{
        if(token!==epoch||!ctx||!gain||media.seeking||media.paused)return;
        const seconds=frame.timestamp/1000000;
        const difference=seconds-media.currentTime;
        if(!Number.isFinite(difference)||difference<-.18||difference>2.4)return;
        const channels=frame.numberOfChannels;
        if(channels<1||channels>8||frame.numberOfFrames<1)return;
        const buffer=ctx.createBuffer(channels,frame.numberOfFrames,frame.sampleRate);
        for(let c=0;c<channels;c++){
          const plane=new Float32Array(frame.numberOfFrames);
          frame.copyTo(plane,{planeIndex:c,format:"f32-planar"});
          buffer.copyToChannel(plane,c);
        }
        const node=ctx.createBufferSource();
        node.buffer=buffer;
        node.playbackRate.value=media.playbackRate||1;
        node.connect(gain);
        scheduled.add(node);
        node.onended=()=>{scheduled.delete(node);node.disconnect();};
        node.start(Math.max(ctx.currentTime+.008,
          ctx.currentTime+difference/(media.playbackRate||1)+.04));
      }catch(err){fail(err,token);}
      finally{frame.close();}
    };
    const run=async(info,token)=>{
      const {reader,segment,meta,scale}=info;
      let localDecoder=decoder;
      for await(const part of reader.children(segment.start,segment.end)){
        if(token!==epoch)return;
        if(part.id!==CLUSTER)continue;
        let clusterTime=0;
        for await(const child of reader.children(part.start,part.end)){
          if(token!==epoch)return;
          if(child.id===CLUSTER_TIME){
            clusterTime=unsigned(await reader.read(child.start,child.end-child.start));
            continue;
          }
          const blocks=[];
          if(child.id===SIMPLE)blocks.push(child);
          else if(child.id===GROUP){
            for await(const groupChild of reader.children(child.start,child.end))
              if(groupChild.id===BLOCK)blocks.push(groupChild);
          }
          for(const block of blocks){
            const frames=await splitBlock(reader,block,meta.number);
            if(!frames.length)continue;
            let timestamp=null;
            for(const frame of frames){
              if(timestamp===null)timestamp=(clusterTime+frame.relative)*scale/1000;
              const seconds=timestamp/1000000;
              while(token===epoch&&(media.paused||media.seeking||
                    seconds>media.currentTime+1.6))await sleep(40);
              if(token!==epoch)return;
              if(seconds>=media.currentTime-.15){
                while(token===epoch&&localDecoder.decodeQueueSize>12)await sleep(12);
                if(token!==epoch)return;
                localDecoder.decode(new EncodedAudioChunk({type:"key",
                  timestamp:Math.round(timestamp),
                  duration:Math.max(1,Math.round(frameDuration(frame.data,meta))),
                  data:frame.data}));
              }
              timestamp+=frameDuration(frame.data,meta);
            }
          }
        }
      }
      if(token===epoch)await localDecoder.flush();
    };
    const start=async(file,track)=>{
      if(!canAttempt(track))throw new Error("Chromium WebCodecs cannot decode this audio codec");
      stop();
      const token=epoch;
      selection={file,track};
      const AudioContext=contextType();
      ctx=new AudioContext();
      gain=ctx.createGain();gain.gain.value=level;gain.connect(ctx.destination);
      try{
        const info=await discover(file,track.number);
        if(token!==epoch)return false;
        const config=configFor(info.meta);
        const support=await AudioDecoder.isConfigSupported(config);
        if(token!==epoch)return false;
        if(!support.supported)throw new Error("Chromium does not support this MKV audio codec");
        decoder=new AudioDecoder({
          output:frame=>output(frame,token),
          error:err=>fail(err,token)
        });
        decoder.configure(config);
        media.muted=true;
        if(!media.paused)await ctx.resume();
        if(token!==epoch)return false;
        void run(info,token).catch(err=>fail(err,token));
        return true;
      }catch(err){
        if(token===epoch)stop();
        throw err;
      }
    };
    const restart=()=>{
      if(!selection)return;
      const {file,track}=selection;
      void start(file,track).catch(err=>onError(err));
    };
    media.addEventListener("pause",()=>{if(ctx)void ctx.suspend().catch(()=>{});});
    media.addEventListener("play",()=>{if(ctx)void ctx.resume().catch(()=>{});});
    return {start,stop,restart,active,selectedNumber,setVolume,canAttempt};
  };
  return {create,canAttempt};
});
