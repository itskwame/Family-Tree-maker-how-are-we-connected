// Local-only image boundary: authenticate first, decode/re-encode, strip metadata,
// reserve authorized destination, upload privately; never trust browser dimensions.
import http from 'node:http';
import sharp from 'sharp';
import {createClient} from '@supabase/supabase-js';
import {config,admin} from './phase6-local.mjs';
const origins=new Set(['http://127.0.0.1:5176','http://localhost:5176']);
let active=0;
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(!origins.has(req.headers.origin)){res.writeHead(403);res.end('Local application origin required');return;}
 res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');
 if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','authorization, content-type');res.setHeader('Access-Control-Allow-Methods','POST');res.writeHead(204);res.end();return;}
 if(req.method!=='POST'||active>=2){res.writeHead(429);res.end('Please retry');return;}
 active++;
 let asset,user,business;
 try{
  const token=req.headers.authorization?.replace(/^Bearer /,'');if(!token)throw Error('Sign in required');
  user=createClient(config.API_URL,config.ANON_KEY,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const auth=await user.auth.getUser(token);if(auth.error)throw Error('Sign in required');
  if(!['image/jpeg','image/png','image/webp'].includes(req.headers['content-type']))throw Error('Use JPEG, PNG or WebP photographs');
  const url=new URL(req.url,'http://127.0.0.1');business=url.searchParams.get('business');const payload=business?{id:business,kind:url.searchParams.get('kind')||'photo'}:url.searchParams.has('post')?{post:url.searchParams.get('post')}:{person:url.searchParams.get('person')};
  const r=await user.rpc(business?'fc_business':'fc_social',{action:'reserve_media',payload});if(r.error)throw r.error;asset=r.data.id;
  if(Number(req.headers['content-length'])>8*1024*1024)throw Error('Photos must be under 8 MB');
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024)throw Error('Photos must be under 8 MB');chunks.push(chunk)}
  const source=Buffer.concat(chunks),decoder=sharp(source,{limitInputPixels:25000000,animated:false,failOn:'warning'}),meta=await decoder.metadata();
  if(!['jpeg','png','webp'].includes(meta.format)||meta.pages>1)throw Error('Use a still photograph');
  const image=await decoder.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer({resolveWithObject:true});
  const thumb=await sharp(image.data).resize({width:400,height:400,fit:'inside',withoutEnlargement:true}).webp({quality:70}).toBuffer();
  if(image.data.length>1400000||thumb.length>100000)throw Error('This image cannot be compressed within the photo limit');
  for(const [name,data] of [['image',image.data],['thumbnail',thumb]]){const up=await admin.storage.from('family-private').upload(`${asset}/${name}.webp`,data,{contentType:'image/webp',cacheControl:'0'});if(up.error)throw up.error;}
  const complete=await admin.rpc(business?'fc_business_media_complete':'fc_media_complete',{asset,w:image.info.width,h:image.info.height,size_bytes:image.data.length+thumb.length});if(complete.error)throw complete.error;
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({id:asset,width:image.info.width,height:image.info.height,bytes:image.data.length+thumb.length}));
 }catch(e){
  if(asset){await admin.storage.from('family-private').remove([`${asset}/image.webp`,`${asset}/thumbnail.webp`]);await user.rpc(business?'fc_business':'fc_social',{action:'delete_media',payload:business?{id:business,asset}:{id:asset}})}
  res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:String(e.message||'Photo upload failed').slice(0,200)}));
 }finally{active--}
});
server.requestTimeout=20000;server.headersTimeout=10000;
server.listen(5177,'127.0.0.1',()=>console.log('Local private image worker ready on 127.0.0.1:5177. Fictional data only.'));

async function cleanup(){const r=await admin.rpc('fc_social_maintenance');if(r.error){console.error('Local media maintenance failed');return}if(r.data.length){const removed=await admin.storage.from('family-private').remove(r.data);if(removed.error)console.error('Local orphan cleanup failed');}}
setInterval(()=>cleanup().catch(()=>console.error('Local cleanup unavailable')),3600000).unref();
cleanup().catch(()=>console.error('Local cleanup unavailable'));
