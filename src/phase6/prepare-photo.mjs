// Transport optimization only. The server independently validates and re-encodes.
export async function preparePhoto(file){
 if(file.size>8*1024*1024)throw Error('Choose a photograph under 8 MB.');
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Use JPEG, PNG or WebP photographs.');
 if(file.size<=4_000_000)return file;
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width*bitmap.height>25_000_000)throw Error('Choose a photograph smaller than 25 megapixels.');
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.78));
  if(!blob||blob.size>4_000_000)throw Error('This image is too detailed. Try a smaller photograph.');
  return blob;
 }finally{bitmap.close()}
}
