import sharp from 'sharp';

export const imagePolicy=Object.freeze({inputBytes:8*1024*1024,inputPixels:25000000,edge:1600,thumbnailEdge:400,imageBytes:450000,thumbnailBytes:50000});

// Decode untrusted bytes on the server. Never keep EXIF or trust client dimensions.
export async function optimizePhoto(source){
 if(source.length>imagePolicy.inputBytes)throw Error('Photos must be under 8 MB');
 const decoder=sharp(source,{limitInputPixels:imagePolicy.inputPixels,animated:false,failOn:'warning'});
 const meta=await decoder.metadata();
 if(!['jpeg','png','webp'].includes(meta.format)||meta.pages>1)throw Error('Use a still JPEG, PNG or WebP photograph');
 let image;
 for(const [edge,quality] of [[1600,78],[1600,68],[1280,68],[1024,58],[768,55]]){
  image=await decoder.clone().rotate().resize({width:edge,height:edge,fit:'inside',withoutEnlargement:true}).webp({quality}).toBuffer({resolveWithObject:true});
  if(image.data.length<=imagePolicy.imageBytes)break;
 }
 let thumbnail;
 for(const quality of [70,55,40]){
  thumbnail=await sharp(image.data).resize({width:imagePolicy.thumbnailEdge,height:imagePolicy.thumbnailEdge,fit:'inside',withoutEnlargement:true}).webp({quality}).toBuffer();
  if(thumbnail.length<=imagePolicy.thumbnailBytes)break;
 }
 if(image.data.length>imagePolicy.imageBytes||thumbnail.length>imagePolicy.thumbnailBytes)throw Error('This photograph is too detailed to fit the image limit. Try a smaller image.');
 return {image:image.data,thumbnail,width:image.info.width,height:image.info.height,bytes:image.data.length+thumbnail.length};
}
