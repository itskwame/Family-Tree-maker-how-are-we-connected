import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {optimizePhoto} from './image-policy.mjs';
import {sql} from './phase6-local.mjs';
const samples=[];
for(const file of readdirSync('public/family-portraits').filter(n=>/\.jpg$/.test(n)).slice(0,12)){
 const t=performance.now(),r=await optimizePhoto(readFileSync('public/family-portraits/'+file));samples.push({bytes:r.bytes,thumbnailBytes:r.thumbnail.length,milliseconds:Math.round(performance.now()-t)});
}
const tables={};for(const name of ['people','posts','messages','comments','notifications'])tables[name]=JSON.parse(sql(`select jsonb_build_object('rows',count(*),'averageRowBytes',coalesce(round(avg(pg_column_size(t))),0),'physicalBytes',pg_total_relation_size('familyconnect.${name}')) from familyconnect.${name} t;`).trim());
writeFileSync('output/cost-readiness/measurements.json',JSON.stringify({at:new Date().toISOString(),scope:'Available local fixture portraits and local database; not representative production traffic or serverless CPU',samples,tables},null,2));console.log('Measured',samples.length,'portraits and 5 tables without exporting personal records.');
