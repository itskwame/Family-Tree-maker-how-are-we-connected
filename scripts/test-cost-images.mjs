import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import sharp from 'sharp';
import {optimizePhoto,imagePolicy} from './image-policy.mjs';
const samples=[await sharp({create:{width:2500,height:2000,channels:3,background:'#458960'}}).withMetadata({exif:{IFD0:{Artist:'PRIVATE'}}}).jpeg().toBuffer(),await sharp(randomBytes(1200*1200*3),{raw:{width:1200,height:1200,channels:3}}).png().toBuffer()];
for(const source of samples){const r=await optimizePhoto(source),m=await sharp(r.image).metadata();assert(r.bytes<=500000);assert(r.width<=1600&&r.height<=1600);assert(!m.exif);assert.equal(m.format,'webp');console.log('PASS compressed photograph',r.bytes,'bytes');}
await assert.rejects(optimizePhoto(Buffer.alloc(imagePolicy.inputBytes+1)),/under 8 MB/);
await assert.rejects(optimizePhoto(Buffer.from('<svg/>')));
await assert.rejects(optimizePhoto(Buffer.from('invalid')));
console.log('PASS oversized, SVG and malformed input rejected');
