// Hard-coded disposable local target. No hosted URL, CLI link, push or reset.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {migrationTransaction} from './hosted-migration-sql.mjs';
import {createClient} from '@supabase/supabase-js';
const dir='local/beta-final',container='supabase_db_fc-beta-final1',out='output/hosted-beta/final';
assert(!existsSync(`${dir}/supabase/.temp/project-ref`));
assert(readFileSync(`${dir}/supabase/config.toml`,'utf8').includes('project_id = "fc-beta-final1"'));
const cli=spawnSync('supabase',['status','--workdir',dir,'-o','json'],{encoding:'utf8',shell:process.platform==='win32'});
assert.equal(cli.status,0,'Local stack must be running');const cfg=JSON.parse(cli.stdout);assert.equal(cfg.API_URL,'http://127.0.0.1:60321');
function sql(text,db='postgres',ok=true){const r=spawnSync('docker',['exec','-i',container,'psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-At'],{input:text,encoding:'utf8',maxBuffer:30e6});if(ok&&r.status!==0)throw Error(r.stderr.slice(0,1500));return r;}
const scalar=q=>sql(q).stdout.trim();
const checks=[];async function check(name,fn){await fn();checks.push({name,passed:true});console.log('PASS '+name);}
const hash=x=>createHash('sha256').update(x).digest('hex');
assert.equal(scalar('select count(*) from auth.users'),'0','Only a fresh disposable rehearsal is supported');
assert.equal(scalar("select count(*) from pg_namespace where nspname='familyconnect'"),'0');
const admin=createClient(cfg.API_URL,cfg.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const accounts=[],password=randomUUID()+'aA!9';
for(let i=0;i<2;i++){const r=await admin.auth.admin.createUser({email:`preserve-${i}@example.test`,password,email_confirm:true});assert.ifError(r.error);accounts.push(r.data.user.id);}
const login=async i=>{const c=createClient(cfg.API_URL,cfg.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const r=await c.auth.signInWithPassword({email:`preserve-${i}@example.test`,password});assert.ifError(r.error);return c;};
await check('Two synthetic pre-existing accounts authenticate through real local Auth',async()=>{await login(0);await login(1)});
sql(readFileSync(`${out}/observed-legacy-baseline.sql`,'utf8'));
const family=randomUUID();sql(`insert into public.families(id,name,created_by) values('${family}','Synthetic legacy preservation sentinel','${accounts[0]}');insert into public.family_memberships(family_id,user_id,role) values('${family}','${accounts[0]}','viewer');insert into public.invites(family_id,token,type,created_by) values('${family}','synthetic-not-deliverable','join','${accounts[0]}')`);
const fingerprint=()=>scalar("select md5((select jsonb_agg(to_jsonb(u) order by id)::text from auth.users u)|| (select jsonb_agg(to_jsonb(i) order by id)::text from auth.identities i))");
const legacy=()=>scalar("select md5((select jsonb_agg(to_jsonb(t) order by id)::text from public.families t)||(select jsonb_agg(to_jsonb(t) order by id)::text from public.family_memberships t)||(select jsonb_agg(to_jsonb(t) order by id)::text from public.invites t))");
const beforeAuth=fingerprint(),beforeLegacy=legacy();
const dump=spawnSync('docker',['exec',container,'pg_dump','-U','postgres','-d','postgres','--format=custom'],{maxBuffer:50e6});assert.equal(dump.status,0);writeFileSync(`${out}/private/synthetic-before.dump`,dump.stdout);
const manifest=JSON.parse(readFileSync(`${out}/candidate-manifest.json`,'utf8'));
const quarantine='migration-review/hosted-beta/20261021000000_quarantine_legacy.sql';
const candidates=[{file:quarantine,sha256:hash(readFileSync(quarantine))},...manifest];
for(const m of candidates)assert.equal(hash(readFileSync(m.file)),m.sha256);
const prepared=candidates.map(m=>({...m,sql:readFileSync(m.file,'utf8')}));
const transaction=migrationTransaction(prepared);
writeFileSync(`${out}/reviewed-transaction.sql`,transaction);
const ddl=candidates.map(m=>readFileSync(m.file,'utf8')).join('\n');
await check('Injected migration failure rolls back additive objects without account or legacy loss',async()=>{const r=sql(migrationTransaction(prepared,{failAfter:true}),'postgres',false);assert.notEqual(r.status,0);assert(r.stderr.includes('division by zero'),r.stderr);assert.equal(scalar("select count(*) from pg_namespace where nspname='familyconnect'"),'0');assert.equal(fingerprint(),beforeAuth);assert.equal(legacy(),beforeLegacy)});
await check('20 candidate SQL files apply atomically on observed legacy structure',async()=>{sql(transaction)});
await check('Migration preserves complete synthetic Auth rows, identities and legacy sentinel data',async()=>{assert.equal(fingerprint(),beforeAuth);assert.equal(legacy(),beforeLegacy);assert.equal(scalar('select count(*) from familyconnect.person_accounts'),'0');assert.equal(scalar('select count(*) from familyconnect.memberships'),'0')});
await check('Raw duplicate migration fails safely; no false idempotency claim',async()=>{const r=sql('begin;'+ddl+'\ncommit;','postgres',false);assert.notEqual(r.status,0);assert.equal(fingerprint(),beforeAuth);assert.equal(legacy(),beforeLegacy)});
await check('Durable checksum ledger resumes without replay and refuses changed hashes',async()=>{
 assert.equal(scalar('select count(*) from familyconnect_migrations.ledger'),'20');
 sql(transaction);
 assert.equal(fingerprint(),beforeAuth);assert.equal(legacy(),beforeLegacy);
 const changed=prepared.map((m,i)=>i?m:{...m,sql:m.sql+'\n-- changed',sha256:hash(m.sql+'\n-- changed')});
 const r=sql(migrationTransaction(changed),'postgres',false);assert.notEqual(r.status,0);assert(r.stderr.includes('Migration checksum mismatch'));
 assert.equal(scalar('select count(*) from familyconnect_migrations.ledger'),'20');
});
await check('All normalized tables enable RLS and no initial person/profile assignment is made',async()=>{assert.equal(scalar("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='familyconnect' and c.relkind='r' and not c.relrowsecurity"),'0');assert.equal(scalar('select count(*) from familyconnect.people'),'0')});
await check('Existing synthetic accounts still authenticate after migration',async()=>{await login(0);await login(1)});
await check('Legacy invitation access is denied by grants after quarantine',async()=>{const c=await login(1);const r=await c.from('invites').select('*');assert(r.error);});
await check('Ordinary authenticated user cannot self-promote through SQL grants',async()=>{const r=sql(`begin;set local role authenticated;select set_config('request.jwt.claim.sub','${accounts[1]}',true);insert into familyconnect.memberships values('${family}','${accounts[1]}','admin');rollback;`,'postgres',false);assert.notEqual(r.status,0);assert(r.stderr.includes('permission denied'))});
await check('Private WebP bucket, exact-path policies and notification publication installed',async()=>{
 const b=JSON.parse(scalar("select row_to_json(b) from storage.buckets b where id='family-private'"));
 assert.equal(b.public,false);assert.equal(b.file_size_limit,1500000);assert.deepEqual(b.allowed_mime_types,['image/webp']);
 assert.equal(scalar("select count(*) from pg_publication_tables where pubname='supabase_realtime' and schemaname='familyconnect' and tablename='notifications'"),'1');
 assert.equal(scalar("select count(*) from pg_policies where schemaname='storage' and policyname in ('social_private_images','business_private_images')"),'2');
 const c=await login(1);const upload=await c.storage.from('family-private').upload('unauthorized.webp',Buffer.from('invalid'),{contentType:'image/webp'});assert(upload.error);
 const worker=await c.rpc('fc_social_maintenance');assert(worker.error);
});
await check('Security-definer search paths pinned and anonymous RPC grants narrowly scoped',async()=>{
 assert.equal(scalar("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='familyconnect' or (n.nspname='public' and p.proname like 'fc_%')) and p.prosecdef and not exists(select 1 from unnest(p.proconfig) c where c like 'search_path=%')"),'0');
 assert.equal(scalar("select string_agg(proname,',' order by proname) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'fc_%' and has_function_privilege('anon',p.oid,'EXECUTE')"),'fc_invitation_preview');
});
const catalog=scalar("select json_build_object('tables',(select json_agg(json_build_object('name',c.relname,'rls',c.relrowsecurity,'acl',c.relacl::text)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='familyconnect' and c.relkind='r'),'functions',(select json_agg(json_build_object('schema',n.nspname,'name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'definer',p.prosecdef,'config',p.proconfig,'acl',p.proacl::text)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='familyconnect' or (n.nspname='public' and p.proname like 'fc_%')),'storage_policies',(select json_agg(to_jsonb(p)) from pg_policies p where schemaname='storage'))");writeFileSync(`${out}/rehearsal-catalog.json`,JSON.stringify(JSON.parse(catalog),null,2));
// Restore this synthetic-only dump into another database in the disposable stack.
const restoreDb='fc_synthetic_restore';const created=spawnSync('docker',['exec',container,'createdb','-U','postgres',restoreDb],{encoding:'utf8'});assert.equal(created.status,0);
const restore=spawnSync('docker',['exec','-i',container,'pg_restore','-U','postgres','-d',restoreDb,'--exit-on-error'],{input:dump.stdout,maxBuffer:50e6});
const restoration={exitCode:restore.status,scope:'Synthetic local backup into a separate database on the same local PostgreSQL cluster; NOT hosted disaster recovery.'};
if(restore.status===0){await check('Synthetic backup restores Auth counts and legacy sentinels in separate database',async()=>{assert.equal(sql('select count(*) from auth.users',restoreDb).stdout.trim(),'2');assert.equal(sql('select count(*) from public.invites',restoreDb).stdout.trim(),'1');const query="select md5((select jsonb_agg(to_jsonb(u) order by id)::text from auth.users u)|| (select jsonb_agg(to_jsonb(i) order by id)::text from auth.identities i))";assert.equal(sql(query,restoreDb).stdout.trim(),beforeAuth)});}else restoration.error=restore.stderr.toString().slice(0,1200);
writeFileSync(`${out}/rehearsal-results.json`,JSON.stringify({at:new Date().toISOString(),checks,restoration,candidates,limitations:['No hosted backup available; hosted restoration not tested','Raw SQL replay is not idempotent; transaction ledger tested locally, hosted target/transport and drift checks remain required','Full cross-user API security matrix remains required on release candidate','Local account preservation uses synthetic accounts, not hosted credentials']},null,2));
console.log(`${checks.length} rehearsal checks passed; restoration exit ${restore.status}.`);
