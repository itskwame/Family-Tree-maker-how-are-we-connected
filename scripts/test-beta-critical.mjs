import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {client,admin,sql,rpc} from './beta-final-local.mjs';
const checks=[],users={},people={},clients={},emails={},tag=Date.now(),password=randomUUID()+'aA!9';
async function check(name,fn){await fn();checks.push({name,passed:true});console.log('PASS',name);}
const admit=(name,approved=true,allow_found=false)=>rpc(admin,'fc_beta_authorize',{target:users[name],approved,allow_found,reason:'Isolated critical security rehearsal'});
const social=(name,action,payload)=>rpc(clients[name],'fc_social',{action,payload});
const view=(name,network,conversation)=>rpc(clients[name],'fc_social_view',{network,...(conversation?{conversation}:{})});
const denied=async promise=>assert.ok((await promise).error,'Expected authorization denial');
const roleQuery=(name,query)=>sql(`begin;set local role authenticated;set local request.jwt.claims='${JSON.stringify({sub:users[name],role:'authenticated'})}';${query};rollback;`,false);
for(const name of ['founder','member','peer','outsider','pending','unverified']){
 emails[name]=`critical-${name}-${tag}@example.test`;
 const r=await admin.auth.admin.createUser({email:emails[name],password,email_confirm:name!=='unverified'});assert.ifError(r.error);users[name]=r.data.user.id;
 if(name!=='unverified'){const c=client();assert.ifError((await c.auth.signInWithPassword({email:emails[name],password})).error);clients[name]=c;}
}
let network,group,direct,control;
await check('Migration approves no existing account; unapproved users cannot found, self-admit, self-promote or mutate',async()=>{
 assert.equal(sql('select count(*) from familyconnect.beta_admissions'),'0');
 assert.deepEqual(await rpc(clients.founder,'fc_beta_status'),{approved:false,can_found:false});
 await denied(clients.founder.rpc('fc_beta_start_network',{network_name:'Denied',first_name:'A',last_name:'',confirm_self:true}));
 await denied(clients.founder.rpc('fc_beta_authorize',{target:users.founder,approved:true,allow_found:true,reason:'self'}));
 await denied(clients.founder.rpc('fc_beta_assign_admin',{target:users.founder,network:randomUUID(),reason:'self'}));
 await denied(clients.founder.rpc('fc_action',{action:'save_progress',payload:{draft:{role:'admin'}}}));
 assert.notEqual(roleQuery('founder',"insert into familyconnect.networks(name) values('bypass')").status,0);
 assert.notEqual(roleQuery('founder',`insert into familyconnect.beta_admissions(user_id,active,can_found,reason) values('${users.founder}',true,true,'bypass')`).status,0);
});
await check('Approval does not verify email; confirmed approved founder must explicitly consent and can bootstrap only once',async()=>{
 await admit('unverified',true,true);
 assert.equal(sql(`select familyconnect.beta_active('${users.unverified}')`),'f');
 await admit('founder',true,true);
 assert.equal(sql('select count(*) from familyconnect.memberships'),'0');
 await denied(clients.founder.rpc('fc_beta_start_network',{network_name:'Denied',first_name:'A',last_name:'',confirm_self:false}));
 const args={network_name:'Critical local family',first_name:'Founder',last_name:'Test',confirm_self:true};
 const attempts=await Promise.all([clients.founder.rpc('fc_beta_start_network',args),clients.founder.rpc('fc_beta_start_network',args)]);
 assert.equal(attempts.filter(r=>!r.error).length,1);const result=attempts.find(r=>!r.error).data;
 network=result.network_id;people.founder=result.person_id;
 assert.equal(sql(`select count(*) from familyconnect.memberships where user_id='${users.founder}' and role='admin'`),'1');
 assert.equal(sql(`select count(*) from familyconnect.person_accounts where user_id='${users.founder}'`),'1');
 await admit('founder',true,true);await denied(clients.founder.rpc('fc_beta_start_network',args));
});
for(const name of ['member','peer','outsider'])await admit(name);
await check('Explicit independent reviewer appointment grants no person ownership',async()=>{
 await rpc(admin,'fc_beta_assign_admin',{target:users.peer,network,reason:'Independent local invitation reviewer'});
 assert.equal(sql(`select count(*) from familyconnect.person_accounts where user_id='${users.peer}'`),'0');
});
// Synthetic family participants, inserted only in this guarded local database.
for(const name of ['member','peer']){people[name]=randomUUID();sql(`insert into familyconnect.memberships values('${network}','${users[name]}','contributor') on conflict do nothing;insert into familyconnect.people(id,network_id,first_name,last_name,age_class) values('${people[name]}','${network}','${name}','Test','adult');insert into familyconnect.person_accounts(person_id,user_id) values('${people[name]}','${users[name]}');`);}
await check('Even a valid independently reviewed invitation cannot admit an unapproved account; approved acceptance is single-use',async()=>{
 const person=randomUUID();sql(`insert into familyconnect.people(id,network_id,first_name,age_class) values('${person}','${network}','Pending','adult');`);
 const invite=await rpc(clients.founder,'fc_action',{action:'create_invitation',payload:{target_id:person,inviter_id:people.founder,email:emails.pending}});
 await denied(clients.founder.rpc('fc_action',{action:'approve_invitation',payload:{id:invite.id}}));
 await rpc(clients.peer,'fc_action',{action:'approve_invitation',payload:{id:invite.id}});
 await denied(clients.pending.rpc('fc_action',{action:'accept_invitation',payload:{token:invite.token}}));
 assert.equal(sql(`select count(*) from familyconnect.memberships where user_id='${users.pending}'`),'0');
 await admit('pending');
 const result=await Promise.all([1,2].map(()=>clients.pending.rpc('fc_action',{action:'accept_invitation',payload:{token:invite.token}})));
 assert.equal(result.filter(r=>!r.error).length,1);
 assert.equal(sql(`select count(*) from familyconnect.person_accounts where person_id='${person}' and user_id='${users.pending}'`),'1');
});
direct=(await social('founder','create_chat',{network,person:people.founder,target:people.member,kind:'direct',name:'Direct'})).id;
await social('member','accept_chat',{id:direct});
group=(await social('founder','create_chat',{network,person:people.founder,kind:'group',name:'Group'})).id;
for(const name of ['member','peer']){await social('founder','invite_member',{id:group,target:people[name]});await social(name,'accept_chat',{id:group});}
control=(await social('peer','create_chat',{network,person:people.peer,target:people.member,kind:'direct',name:'Unaffected control'})).id;await social('member','accept_chat',{id:control});
await social('founder','send_message',{id:direct,body:'Private direct history'});await social('peer','send_message',{id:group,body:'Private group history'});
await check('Authorized history works; outsider RPC and raw database retrieval fail',async()=>{
 assert.equal((await view('member',network,direct)).messages.length,1);
 await denied(clients.outsider.rpc('fc_social_view',{network,conversation:direct}));
 assert.notEqual(roleQuery('member',`select * from familyconnect.messages where conversation_id='${direct}'`).status,0);
 assert.equal(sql("select count(*) from pg_publication_tables where pubname='supabase_realtime' and schemaname='familyconnect' and tablename<>'notifications'"),'0');
});
const events=[];let channel;
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Realtime setup timed out')),20000);channel=clients.member.channel('critical-live-'+tag).on('system',{},e=>{if(e.status==='ok'){clearTimeout(timer);resolve()}else{clearTimeout(timer);reject(Error(JSON.stringify(e)))}}).on('postgres_changes',{event:'INSERT',schema:'familyconnect',table:'notifications',filter:`user_id=eq.${users.member}`},e=>events.push(e.new)).subscribe(status=>{if(status==='CHANNEL_ERROR'){clearTimeout(timer);reject(Error('Realtime channel error'))}});});
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const notify=conversation=>sql(`insert into familyconnect.notifications(user_id,conversation_id,kind) values('${users.member}','${conversation}','message');`);
 await check('Realtime positive control delivers authorized notifications',async()=>{notify(control);for(let i=0;i<40&&!events.length;i++)await wait(100);assert.equal(events.length,1);});
 await social('founder','block',{target:people.member});
 await check('Block denies both sides direct/group history, pagination, chat list/counts, sends and database RLS; unrelated group member retains history',async()=>{
  for(const name of ['founder','member'])for(const conversation of [direct,group]){
   await denied(clients[name].rpc('fc_social_view',{network,conversation}));
   await denied(clients[name].rpc('fc_social_view',{network,conversation,before_at:new Date().toISOString(),before_id:randomUUID()}));
   await denied(clients[name].rpc('fc_social',{action:'send_message',payload:{id:conversation,body:'denied'}}));
   assert(!(await view(name,network)).chats.some(c=>c.id===conversation));
  }
  assert.equal((await view('peer',network,group)).messages.length,1);
  // Grant SELECT only inside a rolled-back local transaction to test the RLS
  // predicate separately from the production no-SELECT table privilege.
  const r=sql(`begin;grant select on familyconnect.messages to authenticated;set local role authenticated;set local request.jwt.claims='${JSON.stringify({sub:users.member,role:'authenticated'})}';select count(*) from familyconnect.messages where conversation_id in('${direct}','${group}');rollback;`);assert.equal(r,'0');
  const notifications=roleQuery('member',`select count(*) from familyconnect.notifications where conversation_id in('${direct}','${group}')`);assert.equal(notifications.status,0);assert.equal(notifications.stdout.trim(),'0');
 });
 await check('Existing Realtime subscription denies blocked conversations while unaffected control still delivers',async()=>{
  const before=events.length;notify(direct);notify(group);notify(control);await wait(1800);
  assert.equal(events.length,before+1);assert.equal(events.at(-1).conversation_id,control);
 });
 await social('founder','unblock',{target:people.member});
 await check('Unblock restores accepted access; removed conversation member loses old history and live notifications',async()=>{
  assert.equal((await view('member',network,direct)).messages.length,1);
  await social('founder','remove_member',{id:group,target:users.member});
  await denied(clients.member.rpc('fc_social_view',{network,conversation:group}));
  const before=events.length;notify(group);notify(control);await wait(1800);assert.equal(events.length,before+1);assert.equal(events.at(-1).conversation_id,control);
 });
 await check('Family membership removal denies old-token RPC, RLS notifications and Realtime without reconnecting',async()=>{
  sql(`delete from familyconnect.memberships where network_id='${network}' and user_id='${users.member}';`);
  await denied(clients.member.rpc('fc_social_view',{network,conversation:direct}));
  assert.equal(roleQuery('member',`select count(*) from familyconnect.notifications`).stdout.trim(),'0');
  const before=events.length;notify(direct);notify(control);await wait(1800);assert.equal(events.length,before);
 });
}finally{if(channel)await clients.member.removeChannel(channel);}
await check('Admission revocation denies existing sessions and rejoining without deleting accounts or family data',async()=>{
 const before=sql(`select count(*) from familyconnect.messages`);
 await admit('pending',false);await denied(clients.pending.rpc('fc_action',{action:'save_progress',payload:{draft:{}}}));
 assert.equal((await rpc(clients.pending,'fc_snapshot')).networks.length,0);
 assert.equal(sql(`select count(*) from auth.users where id='${users.pending}'`),'1');assert.equal(sql('select count(*) from familyconnect.messages'),before);
});
for(const c of Object.values(clients))await c.removeAllChannels();
writeFileSync('output/hosted-beta/final/critical-security-results.json',JSON.stringify({at:new Date().toISOString(),checks,scope:'Guarded local stack only; no hosted users or data'},null,2));
console.log(`${checks.length} critical checks passed`);
