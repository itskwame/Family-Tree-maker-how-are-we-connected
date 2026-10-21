import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {setup,call,view} from './phase7-fixture.mjs';
import {admin,sql} from './phase6-local.mjs';
const f=await setup(),{network:n,people:p,users:u,clients:c}=f,checks=[];
async function check(name,fn){await fn();checks.push({name,passed:true});console.log('PASS',name)}
const post=(await call(c.emma,'create_post',{network:n,person:p.emma,body:'Media validation'})).id;
const {data:session}=await c.emma.auth.getSession();
async function upload(body,type='image/jpeg',extra={}){return fetch('http://127.0.0.1:5177/upload?post='+post,{method:'POST',headers:{Origin:'http://127.0.0.1:5176',Authorization:`Bearer ${session.session.access_token}`,'Content-Type':type,...extra},body})}
let asset;
await check('Worker re-encodes, resizes, strips metadata, creates thumbnail',async()=>{const source=await sharp(readFileSync('public/family-portraits/emma.jpg')).resize(2500,2000).withMetadata({exif:{IFD0:{Artist:'PRIVATE TEST METADATA'}}}).jpeg().toBuffer();const r=await upload(source);assert.equal(r.status,200);asset=(await r.json()).id;const original=await admin.storage.from('family-private').download(`${asset}/image.webp`),thumb=await admin.storage.from('family-private').download(`${asset}/thumbnail.webp`);assert.ifError(original.error);const meta=await sharp(Buffer.from(await original.data.arrayBuffer())).metadata(),small=await sharp(Buffer.from(await thumb.data.arrayBuffer())).metadata();assert(meta.width<=1600&&meta.height<=1600);assert(!meta.exif);assert(small.width<=400&&small.height<=400);assert.equal(meta.format,'webp');});
await check('Private photos denied across network and before publication',async()=>{for(const a of [c.david,c.outsider,c.minor])assert.ok((await a.storage.from('family-private').download(`${asset}/image.webp`)).error);await call(c.emma,'publish_post',{id:post});assert.ifError((await c.david.storage.from('family-private').download(`${asset}/image.webp`)).error);assert.ok((await c.outsider.storage.from('family-private').download(`${asset}/image.webp`)).error);});
await check('Owning a valid photograph never unlocks another network object',async()=>{const own=(await call(c.outsider,'create_post',{network:f.outside,person:p.outsider,body:'Other private family'})).id,{data:s}=await c.outsider.auth.getSession();const r=await fetch('http://127.0.0.1:5177/upload?post='+own,{method:'POST',headers:{Origin:'http://127.0.0.1:5176',Authorization:`Bearer ${s.session.access_token}`,'Content-Type':'image/jpeg'},body:readFileSync('public/family-portraits/david.jpg')});assert.equal(r.status,200);const other=(await r.json()).id;await call(c.outsider,'publish_post',{id:own});assert.ifError((await c.outsider.storage.from('family-private').download(`${other}/image.webp`)).error);for(const suffix of ['image.webp','thumbnail.webp']){assert.ok((await c.outsider.storage.from('family-private').download(`${asset}/${suffix}`)).error);assert.ok((await c.david.storage.from('family-private').download(`${other}/${suffix}`)).error);}assert.ok((await c.outsider.storage.from('family-private').createSignedUrl(`${asset}/image.webp`,60)).error);});
await check('Reject SVG, video, malformed bytes, oversized images and bad origin',async()=>{for(const [body,type,extra] of [['<svg/>','image/svg+xml',{}],['video','video/mp4',{}],['not a jpeg','image/jpeg',{}],[Buffer.alloc(8*1024*1024+1),'image/jpeg',{}],['bad','image/jpeg',{Origin:'https://untrusted.example'}]])assert((await upload(body,type,extra)).status>=400);});
await check('Direct storage writes bypassing image worker are denied',async()=>{assert.ok((await c.emma.storage.from('family-private').upload('arbitrary.webp',Buffer.from('fake'),{contentType:'image/webp'})).error)});
let dm=(await call(c.emma,'create_chat',{network:n,person:p.emma,target:p.david,kind:'direct',name:'Realtime test'})).id;await call(c.david,'accept_chat',{id:dm});
await check('Realtime delivers own notification and does not leak to outsider',async()=>{
 let own=0,foreign=0;const channels=[];
 for(const [who,user,inc] of [['david',u.david,()=>own++],['outsider',u.david,()=>foreign++]]){
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Realtime subscription timeout')),15000);const channel=c[who].channel(`test-${who}-${Date.now()}`).on('system',{},event=>{if(event.status==='ok'){clearTimeout(timer);resolve()}else{clearTimeout(timer);reject(Error('Postgres subscription failed'))}}).on('postgres_changes',{event:'INSERT',schema:'familyconnect',table:'notifications',filter:`user_id=eq.${user}`},inc).subscribe(status=>{if(status==='CHANNEL_ERROR'){clearTimeout(timer);reject(Error('Realtime authorization failure'))}});channels.push([c[who],channel])});
 }
 
 await call(c.emma,'send_message',{id:dm,body:'Realtime hello'});
 for(let i=0;i<30&&!own;i++)await new Promise(r=>setTimeout(r,200));
 assert.equal(own,1);
 const message=(await view(c.emma,n,{conversation:dm})).messages[0];await call(c.emma,'delete_message',{id:message.id});
 for(let i=0;i<30&&own<2;i++)await new Promise(r=>setTimeout(r,200));
 for(const [a,ch] of channels)await a.removeChannel(ch);
 assert.equal(own,2);assert.equal(foreign,0);assert.equal((await view(c.david,n,{conversation:dm})).messages[0].body,'Message deleted');
});
await check('Deleted photo authorization revoked immediately',async()=>{await call(c.emma,'delete_post',{id:post});assert.ok((await c.david.storage.from('family-private').download(`${asset}/image.webp`)).error)});
mkdirSync('output/phase7',{recursive:true});writeFileSync('output/phase7/media-realtime-tests.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));
