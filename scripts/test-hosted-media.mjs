import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {createMediaHandler,hostedMediaConfig} from '../server/media-handler.mjs';
import disabledEndpoint from '../deployment/netlify/functions/upload.mjs';
import {setup,call} from './phase7-fixture.mjs';
import {config,admin,sql} from './phase6-local.mjs';
const f=await setup('hosted-media-'+Date.now()),checks=[],origin='http://127.0.0.1:5176';
const handler=createMediaHandler({url:config.API_URL,key:config.ANON_KEY,secret:config.SERVICE_ROLE_KEY,origin});
const {data:s}=await f.clients.emma.auth.getSession(),token=s.session.access_token;
const post=(await call(f.clients.emma,'create_post',{network:f.network,person:f.people.emma,body:'Hosted handler local validation'})).id;
const source=readFileSync('public/family-portraits/emma.jpg');
const request=(body=source,extra={})=>new Request('https://function.example.test/upload?post='+post,{method:'POST',headers:{origin,authorization:'Bearer '+token,'content-type':'image/jpeg',...extra},body});
async function check(name,fn){await fn();checks.push({name,passed:true});console.log('PASS',name)}
let saved;
await check('Hosted endpoint disabled by default; wrong project and invalid origin rejected',async()=>{assert.equal((await disabledEndpoint(request())).status,503);assert.throws(()=>hostedMediaConfig({FC_MEDIA_ENABLED:'true',FC_SUPABASE_URL:config.API_URL}));assert.equal((await handler(request(source,{origin:'https://evil.example'}))).status,403)});
await check('Bearer authentication required independently of CORS',async()=>{assert.equal((await handler(request(source,{authorization:'Bearer invalid'}))).status,401)});
await check('Hosted handler compresses and privately finalizes valid authenticated image',async()=>{const r=await handler(request());assert.equal(r.status,200);saved=await r.json();assert(saved.bytes<=500000);await call(f.clients.emma,'publish_post',{id:post});assert.ifError((await f.clients.david.storage.from('family-private').download(saved.id+'/image.webp')).error)});
await check('Cross-family download and direct raw uploads remain denied',async()=>{assert.ok((await f.clients.outsider.storage.from('family-private').download(saved.id+'/image.webp')).error);assert.ok((await f.clients.emma.storage.from('family-private').upload('bypass-hosted.webp',source)).error)});
await check('Forged MIME, malformed data, oversize streaming body and unauthorized destination rejected',async()=>{assert.equal((await handler(request(Buffer.from('<svg/>'),{'content-type':'image/svg+xml'}))).status,415);assert.equal((await handler(request(Buffer.from('invalid')))).status,400);assert.equal((await handler(request(Buffer.alloc(4000001)))).status,413);const r=new Request('https://function.example.test/upload?person='+f.people.outsider,{method:'POST',headers:{origin,authorization:'Bearer '+token,'content-type':'image/jpeg'},body:source});assert.equal((await handler(r)).status,403)});
await check('Deleting pending media cannot free in-flight quota',async()=>{const reserved=(await call(f.clients.emma,'reserve_media',{post})).id;await call(f.clients.emma,'delete_media',{id:reserved});assert.equal(sql(`select count(*) from familyconnect.media_cost_reservations where asset='${reserved}'`).trim(),'1')});
const fixtureOwner=randomUUID();
await check('800 MB exhaustion rejects new uploads while existing private photos stay readable',async()=>{try{sql(`insert into familyconnect.media_cost_reservations(asset,owner_id) select gen_random_uuid(),'${fixtureOwner}' from generate_series(1,1600);`);const before=sql("select count(*) from storage.objects").trim(),r=await handler(request());assert.equal(r.status,429);assert.match((await r.json()).error,/storage is nearly full/);assert.equal(sql("select count(*) from storage.objects").trim(),before);assert.ifError((await f.clients.david.storage.from('family-private').download(saved.id+'/image.webp')).error);}finally{sql(`delete from familyconnect.media_cost_reservations where owner_id='${fixtureOwner}'`)}});
await check('Uploads recover after capacity is freed',async()=>{const r=await handler(request());assert.equal(r.status,200)});

await check('Partial storage failure removes newly written objects',async()=>{
 const fault=createMediaHandler({url:config.API_URL,key:config.ANON_KEY,secret:config.SERVICE_ROLE_KEY,origin,fetch:async(input,init)=>{if(String(input).includes('/storage/v1/object/')&&String(input).endsWith('/thumbnail.webp')&&init?.method==='POST')return new Response(JSON.stringify({message:'injected failure'}),{status:400,headers:{'Content-Type':'application/json'}});return fetch(input,init)}});
 const before=sql('select count(*) from storage.objects').trim();assert.equal((await fault(request())).status,400);assert.equal(sql('select count(*) from storage.objects').trim(),before);
});
await check('Concurrent cross-account reservations cannot take the last slot twice',async()=>{
 const davidPost=(await call(f.clients.david,'create_post',{network:f.network,person:f.people.david,body:'Concurrent quota probe'})).id,owner=randomUUID();
 try{
 sql(`insert into familyconnect.media_cost_reservations(asset,owner_id) select gen_random_uuid(),'${owner}' from generate_series(1,greatest(0,floor((800000000-(select coalesce(sum((metadata->>'size')::bigint),0) from storage.objects)-(select coalesce(sum(reserved_bytes),0) from familyconnect.media_cost_reservations)-500000)/500000))::int);`);
 const result=await Promise.allSettled([call(f.clients.emma,'reserve_media',{post}),call(f.clients.david,'reserve_media',{post:davidPost})]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.match(result.find(r=>r.status==='rejected').reason.message,/storage is nearly full/);
 }finally{sql(`delete from familyconnect.media_cost_reservations where owner_id='${owner}'`)}
});

await check('Unknown object size fails closed',async()=>{const result=sql(`begin;insert into storage.objects(bucket_id,name,metadata) values('family-private','unknown-cost-size-${Date.now()}','{}');do $$begin begin insert into familyconnect.post_media(post_id,owner_id,path,thumbnail) values('${post}','${f.users.emma}','unknown-size/image.webp','unknown-size/thumbnail.webp');raise exception 'GUARD FAILED';exception when others then if sqlerrm not like 'Storage accounting unavailable%' then raise;end if;end;end$$;rollback;`);assert.match(result,/ROLLBACK/)});
writeFileSync('output/cost-readiness/hosted-handler-tests.json',JSON.stringify({at:new Date().toISOString(),environment:'Netlify handler executed locally against isolated Supabase; not deployed',checks},null,2));
