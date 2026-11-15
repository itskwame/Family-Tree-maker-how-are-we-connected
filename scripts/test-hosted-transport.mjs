import {chromium} from '@playwright/test';
import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
await sharp(randomBytes(1400*1400*3),{raw:{width:1400,height:1400,channels:3}}).png().toFile('tmp/hosted-transport-test.png');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5176/phase6.html');const result=await page.evaluate(async()=>{const {preparePhoto}=await import('/src/phase6/prepare-photo.mjs');const data=await fetch('/tmp/hosted-transport-test.png').then(r=>r.blob()),file=new File([data],'fictional-test.png',{type:'image/png'}),prepared=await preparePhoto(file);let rejected=false;try{await preparePhoto(new File([new Uint8Array(8*1024*1024+1)],'large.jpg',{type:'image/jpeg'}))}catch{rejected=true}return {sourceBytes:file.size,preparedBytes:prepared.size,type:prepared.type,rejectedOver8MiB:rejected}});assert(result.sourceBytes>4000000&&result.sourceBytes<8*1024*1024);assert(result.preparedBytes<=4000000);assert(result.rejectedOver8MiB);writeFileSync('output/cost-readiness/transport-test.json',JSON.stringify(result,null,2));console.log('PASS original 4-8 MB photo prepared below hosted transport limit; >8 MiB rejected');}finally{await browser.close()}
await build({entryPoints:['deployment/netlify/functions/upload.mjs'],outdir:'output/cost-readiness/bundle',bundle:true,platform:'node',format:'esm',packages:'external'});console.log('PASS hosted function bundles with server dependencies external');
