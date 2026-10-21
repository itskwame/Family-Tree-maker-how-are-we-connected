import {execFileSync} from 'node:child_process';
import {writeFileSync,mkdirSync,existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {fixture} from '../src/family/fixture.js';
if(process.env.NODE_ENV==='production'||process.env.FAMILYCONNECT_RELEASE_TARGET||['production','private-beta','clean-check'].includes(process.env.FAMILYCONNECT_ENV))throw Error('Development fixture helpers are forbidden in release environments');
if(!/project_id\s*=\s*"familyconnect-phase6-isolated"/.test(readFileSync('local/phase6/supabase/config.toml','utf8')))throw Error('Fixture helpers require the named isolated development project');
if(existsSync('local/phase6/supabase/.temp/project-ref'))throw Error('Local workspace must never be linked');
export const config=JSON.parse(execFileSync('supabase',['status','--workdir','local/phase6','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
if(config.API_URL!=='http://127.0.0.1:55321')throw Error('Refusing non-local Supabase');
export const admin=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
export const password='Fictional-Phase6-Only!42';
export const ids={network:'60000000-0000-4000-8000-000000000001',other:'60000000-0000-4000-8000-000000000002'};
export function uuid(name){const hex=createHash('sha256').update('phase6-fictional:'+name).digest('hex');return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-8${hex.slice(17,20)}-${hex.slice(20,32)}`}
export const sql=query=>execFileSync('docker',['exec','-i','supabase_db_familyconnect-phase6-isolated','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{input:query,encoding:'utf8',stdio:['pipe','pipe','pipe']});
export const client=()=>createClient(config.API_URL,config.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
export async function login(name){const c=client();const {error}=await c.auth.signInWithPassword({email:`${name}@example.test`,password});if(error)throw error;return c}
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
export async function seed(){
 const accounts={};const list=await admin.auth.admin.listUsers();if(list.error)throw list.error;
 for(const name of ['david','emma','maya','outsider','reviewer']){let user=list.data.users.find(u=>u.email===`${name}@example.test`);if(!user){const result=await admin.auth.admin.createUser({email:`${name}@example.test`,password,email_confirm:true});if(result.error)throw result.error;user=result.data.user}accounts[name]=user.id}
 let query=`begin; insert into familyconnect.networks values('${ids.network}','The Bennett family'),('${ids.other}','The Reed family') on conflict do nothing;`;
 for(const [name,network,role] of [['david',ids.network,'admin'],['reviewer',ids.network,'admin'],['reviewer',ids.other,'admin'],['maya',ids.other,'admin']])query+=`insert into familyconnect.memberships values('${network}','${accounts[name]}','${role}') on conflict do nothing;`;
 for(const p of fixture.people){query+=`insert into familyconnect.people(id,network_id,first_name,last_name,gender,age_class,photo) values('${uuid(p.id)}','${ids.network}',${q(p.first)},${q(p.last)},${q(p.gender)},${q(['ava','theo'].includes(p.id)?'minor':'adult')},${p.photo?q(p.photo):'null'}) on conflict do nothing;`}
 query+=`insert into familyconnect.people(id,network_id,first_name,last_name,age_class) values('${uuid('emma-reed')}','${ids.other}','Emma','Bennett','adult'),('${uuid('maya')}','${ids.other}','Maya','Reed','adult') on conflict do nothing;`;
 for(const p of fixture.parentages)query+=`insert into familyconnect.parentages(id,network_id,parent_id,child_id,kind) values('${uuid(p.id)}','${ids.network}','${uuid(p.parent)}','${uuid(p.child)}','${p.kind}') on conflict do nothing;`;
 for(const p of fixture.partnerships){const [a,b]=p.partners.map(uuid).sort();query+=`insert into familyconnect.partnerships(id,network_id,person_a,person_b,kind,status) values('${uuid(p.id)}','${ids.network}','${a}','${b}',${q(p.kind)},${q(p.status)}) on conflict(id) do update set kind=excluded.kind,status=excluded.status;`}
 query+=`insert into familyconnect.person_accounts(person_id,user_id) values('${uuid('david')}','${accounts.david}'),('${uuid('maya')}','${accounts.maya}') on conflict do nothing;`;
 // Reviewed fictional guardianship exists only in the seed, never inferred from parentage.
 query+=`insert into familyconnect.guardians values('${uuid('ava')}','${accounts.emma}','${accounts.reviewer}'),('${uuid('theo')}','${accounts.emma}','${accounts.reviewer}') on conflict do nothing; commit;`;
 sql(query);
 mkdirSync('output/phase6/private',{recursive:true});
 writeFileSync('.env.phase6.local',`VITE_PHASE6_URL=${config.API_URL}\nVITE_PHASE6_ANON_KEY=${config.ANON_KEY}\n`);
 // Deterministic links are restricted to fictional local fixtures; normal invitations use 256-bit randomness.
 for(const [suffix,net,target,inviter,creator] of [['bennett',ids.network,uuid('emma'),uuid('david'),accounts.david],['reed',ids.other,uuid('emma-reed'),uuid('maya'),accounts.maya]]){
  const token=createHash('sha256').update('fictional-local-demo-'+suffix).digest('hex');
  sql(`insert into familyconnect.invitations(token_hash,network_id,target_id,inviter_id,recipient_email,created_by,approved_by) values('${createHash('sha256').update(token).digest('hex')}','${net}','${target}','${inviter}','emma@example.test','${creator}','${accounts.reviewer}') on conflict(token_hash) do nothing;`);
  writeFileSync(`output/phase6/private/${suffix}-invitation.txt`,`http://127.0.0.1:5176/phase6.html#invite=${token}`);
 }
 writeFileSync('output/phase6/private/local-fixture-accounts.json',JSON.stringify(accounts,null,2));
 console.log('Fictional local seed prepared; hosted Supabase was not accessed.');
 return accounts;
}
if(process.argv.includes('--seed'))await seed();
