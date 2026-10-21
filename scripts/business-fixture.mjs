import {setup} from './phase7-fixture.mjs';
import {password,sql} from './phase6-local.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';
export {setup};
export async function call(c,action,payload={}){const {data,error}=await c.rpc('fc_business',{action,payload});if(error)throw error;return data;}
export async function view(c,network,extra={}){const {data,error}=await c.rpc('fc_business_view',{network,...extra});if(error)throw error;return data;}
export async function save(c,n,id,fields={}){const d=(await view(c,n,{listing:id})).detail;return call(c,'save',{...d,...fields,id});}
export async function approve(f,id,owner='emma'){await call(f.clients.reviewer,'review',{id,decision:'approve',attested:true,note:'Fictional test: independent ownership and listing review completed.'});await call(f.clients[owner],'publish',{id});}
export async function upload(c,id,kind,bytes,type='image/png'){const {data}=await c.auth.getSession();const r=await fetch(`http://127.0.0.1:5177/upload?business=${id}&kind=${kind}`,{method:'POST',headers:{Authorization:`Bearer ${data.session.access_token}`,'Content-Type':type,Origin:'http://127.0.0.1:5176'},body:bytes});const result=await r.json();if(!r.ok)throw Error(result.error);return result;}
export async function logo(mark,color='#315b49',bg='#e7eddf'){return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" rx="90" fill="${bg}"/><circle cx="300" cy="300" r="220" fill="none" stroke="${color}" stroke-width="3"/><text x="300" y="340" font-family="Georgia" font-size="140" text-anchor="middle" fill="${color}">${mark}</text><path d="M210 400 Q300 450 390 400" stroke="${color}" stroke-width="3" fill="none"/></svg>`)).png().toBuffer();}
export function privateDemo(f,businesses){mkdirSync('output/business/private',{recursive:true});writeFileSync('output/business/private/demo.json',JSON.stringify({network:f.network,people:f.people,label:f.label,password,businesses,accounts:Object.fromEntries(Object.keys(f.users).map(name=>[name,{email:`social-${name}-${f.label}@example.test`,password}]))},null,2));}
