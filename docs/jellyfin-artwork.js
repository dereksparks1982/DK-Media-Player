/* DK Media Player artwork selector adapted from Jellyfin Web
 * src/components/cardbuilder/utils/url.ts, getCardImageUrl() (GPL-2.0-or-later).
 *
 * Upstream: https://github.com/jellyfin/jellyfin-web
 * Unlike Jellyfin, DK Media Player is not connected to a Jellyfin server:
 * ImageTags hold fully resolved public image URLs instead of image tag IDs.
 * Attribution and the unmodified source are in docs/vendor/jellyfin/.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.DKJellyfinArtwork=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 function choose(item,options={}){
   if(!item||typeof item!=="object")return null;
   item=item.ProgramInfo||item;
   const preferThumb=options.preferThumb!==false;
   const inheritThumb=options.inheritThumb!==false;
   const uiAspect=options.aspect||16/9;
   // The source branches mirror Jellyfin Web's getCardImageUrl:
   // own episode Thumb, series Thumb, backdrops, then series poster/Primary.
   const skipEpisodeParentPoster=
     item.Type==="Episode"&&uiAspect!=null&&uiAspect>1;
   let url=null,kind=null;
   if(preferThumb&&item.ImageTags?.Thumb){
     url=item.ImageTags.Thumb;kind="Thumb";
   }else if(preferThumb&&item.SeriesThumbImageTag&&inheritThumb){
     url=item.SeriesThumbImageTag;kind="Thumb";
   }else if(preferThumb&&item.ParentThumbImageTag&&inheritThumb){
     url=item.ParentThumbImageTag;kind="Thumb";
   }else if(preferThumb&&item.BackdropImageTags?.length){
     url=item.BackdropImageTags[0];kind="Backdrop";
   }else if(preferThumb&&item.ParentBackdropImageTags?.length&&
            inheritThumb&&item.Type==="Episode"){
     url=item.ParentBackdropImageTags[0];kind="Backdrop";
   }else if(item.ImageTags?.Primary&&
            (item.Type!=="Episode"||item.ChildCount!==0)){
     url=item.ImageTags.Primary;kind="Primary";
   }else if(item.SeriesPrimaryImageTag&&!skipEpisodeParentPoster){
     url=item.SeriesPrimaryImageTag;kind="Primary";
   }else if(item.PrimaryImageTag){
     url=item.PrimaryImageTag;kind="Primary";
   }else if(item.ParentPrimaryImageTag&&!skipEpisodeParentPoster){
     url=item.ParentPrimaryImageTag;kind="Primary";
   }else if(item.BackdropImageTags?.length){
     url=item.BackdropImageTags[0];kind="Backdrop";
   }else if(item.ImageTags?.Thumb){
     url=item.ImageTags.Thumb;kind="Thumb";
   }else if(item.SeriesThumbImageTag&&inheritThumb){
     url=item.SeriesThumbImageTag;kind="Thumb";
   }else if(item.ParentThumbImageTag&&inheritThumb){
     url=item.ParentThumbImageTag;kind="Thumb";
   }else if(item.ParentBackdropImageTags?.length&&inheritThumb){
     url=item.ParentBackdropImageTags[0];kind="Backdrop";
   }
   return typeof url==="string"&&/^https:\/\//i.test(url)?
     {url,kind}:null;
 }
 return {choose};
});