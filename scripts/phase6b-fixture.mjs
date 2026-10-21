import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sql} from './phase6-local.mjs';
import {fixture} from '../src/family/fixture.js';
const accounts=JSON.parse(readFileSync('output/phase6/private/local-fixture-accounts.json'));
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
export async function setup(label){
 const network=randomUUID(),map=new Map(fixture.people.map(p=>[p.id,randomUUID()])),token=randomBytes(32).toString('hex'),email=`emma-6b-${label}-${Date.now()}@example.test`;
 const selected=new Set(['emma','david','clara','arthur','eleanor','helen','sophie','jack','leo','lucas','ava']);
 let query=`begin; insert into familyconnect.networks values('${network}','The Bennett family'); insert into familyconnect.memberships values('${network}','${accounts.david}','admin'),('${network}','${accounts.reviewer}','admin');`;
 for(const p of fixture.people.filter(p=>selected.has(p.id)))query+=`insert into familyconnect.people(id,network_id,first_name,last_name,gender,age_class,photo) values('${map.get(p.id)}','${network}',${q(p.first)},${q(p.last)},${q(p.gender)},'${p.id==='ava'?'minor':'adult'}',${p.photo?q(p.photo):'null'});`;
 for(const p of fixture.parentages.filter(p=>selected.has(p.parent)&&selected.has(p.child)))query+=`insert into familyconnect.parentages(network_id,parent_id,child_id,kind) values('${network}','${map.get(p.parent)}','${map.get(p.child)}','${p.kind}');`;
 for(const p of fixture.partnerships.filter(p=>p.partners.every(id=>selected.has(id)))){const[a,b]=p.partners.map(id=>map.get(id)).sort();query+=`insert into familyconnect.partnerships(network_id,person_a,person_b,kind,status) values('${network}','${a}','${b}','${p.kind}','${p.status}');`}
 query+=`insert into familyconnect.person_accounts(person_id,user_id) values('${map.get('david')}','${accounts.david}'); insert into familyconnect.invitations(token_hash,network_id,target_id,inviter_id,recipient_email,created_by,approved_by,share_inviter_photo) values('${createHash('sha256').update(token).digest('hex')}','${network}','${map.get('emma')}','${map.get('david')}','${email}','${accounts.david}','${accounts.reviewer}',true); commit;`;
 sql(query);return {network,map,token,email};
}
