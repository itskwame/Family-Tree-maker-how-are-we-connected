import {admin,sql,uuid,client,password} from './phase6-local.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
export async function setup(label=`${Date.now()}`){
 const network=uuid(`social-${label}`),outside=uuid(`social-other-${label}`),users={},people={},clients={};
 for(const name of ['emma','david','maya','reviewer','outsider','minor']){
  const email=`social-${name}-${label}@example.test`;
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;
  users[name]=data.user.id;people[name]=uuid(`social-person-${name}-${label}`);
  const c=client();const r=await c.auth.signInWithPassword({email,password});if(r.error)throw r.error;clients[name]=c;
 }
 sql(`begin;insert into familyconnect.networks(id,name) values('${network}','The Bennett family'),('${outside}','The Reed family');${Object.keys(users).map(name=>`insert into familyconnect.memberships values('${name==='outsider'?outside:network}','${users[name]}','${name==='reviewer'?'admin':'contributor'}');insert into familyconnect.people(id,network_id,first_name,last_name,age_class) values('${people[name]}','${name==='outsider'?outside:network}','${name[0].toUpperCase()+name.slice(1)}','Bennett','${name==='minor'?'minor':'adult'}');insert into familyconnect.person_accounts(person_id,user_id) values('${people[name]}','${users[name]}');`).join('')}commit;`);
 return {network,outside,users,people,clients,label};
}
export async function call(c,action,payload={}){const {data,error}=await c.rpc('fc_social',{action,payload});if(error)throw error;return data;}
export async function view(c,network,extra={}){const {data,error}=await c.rpc('fc_social_view',{network,...extra});if(error)throw error;return data;}
export function savePrivate(f){mkdirSync('output/phase7/private',{recursive:true});writeFileSync('output/phase7/private/demo.json',JSON.stringify({network:f.network,people:f.people,users:f.users,label:f.label,password,accounts:Object.fromEntries(Object.keys(f.users).map(name=>[name,{email:`social-${name}-${f.label}@example.test`,password}]))},null,2));}
