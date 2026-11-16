// Independent local source/destination only. Never accepts a hosted URL.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import sharp from 'sharp';
import {cfg,admin,client,sql,rpc} from './beta-final-local.mjs';
const started=Date.now(),out='output/hosted-beta/final',dir='local/beta-restore',target='supabase_db_fc-beta-restore3',checks=[];
assert(!existsSync(`${dir}/supabase/.temp/project-ref`));assert(readFileSync(`${dir}/supabase/config.toml`,'utf8').includes('project_id = "fc-beta-restore3"'));
function command(exe,args,opts={}){const r=spawnSync(exe,args,{encoding:'utf8',maxBuffer:50e6,...opts});if(r.status!==0)throw Error(`${exe} failed: ${r.stderr?.slice(0,1000)}`);return r.stdout;}
const dest=JSON.parse(command('supabase',['status','--workdir',dir,'-o','json'],{shell:process.platform==='win32'}));assert.equal(dest.API_URL,'http://127.0.0.1:63321');assert.notEqual(cfg.API_URL,dest.API_URL);
const destSQL=q=>command('docker',['exec','-i',target,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-qAt'],{input:q}).trim();
const resume=process.argv.includes('--resume-validation');
if(!resume){assert.equal(destSQL('select count(*) from auth.users'),'0');assert.equal(destSQL("select count(*) from pg_namespace where nspname='familyconnect'"),'0');}
let email,password,user,owner,family,post,asset;
const bytes=await sharp({create:{width:2,height:2,channels:3,background:'red'}}).webp().toBuffer();
if(!resume){
email=`recovery-${Date.now()}@example.test`;password=randomUUID()+'aA!9';
const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.ifError(created.error);user=created.data.user.id;
await rpc(admin,'fc_beta_authorize',{target:user,approved:true,allow_found:true,reason:'Independent synthetic recovery rehearsal'});
owner=client();assert.ifError((await owner.auth.signInWithPassword({email,password})).error);
family=await rpc(owner,'fc_beta_start_network',{network_name:'Recovery sentinel',first_name:'Recovery',last_name:'Synthetic',confirm_self:true});
post=await rpc(owner,'fc_social',{action:'create_post',payload:{network:family.network_id,person:family.person_id,body:'Recovery private image'}});
asset=await rpc(owner,'fc_social',{action:'reserve_media',payload:{post:post.id}});

for(const name of ['image','thumbnail'])assert.ifError((await admin.storage.from('family-private').upload(`${asset.id}/${name}.webp`,bytes,{contentType:'image/webp',cacheControl:'0'})).error);
await rpc(admin,'fc_media_complete',{asset:asset.id,w:2,h:2,size_bytes:bytes.length*2});await rpc(owner,'fc_social',{action:'publish_post',payload:{id:post.id}});
}else{
 const saved=JSON.parse(sql("select json_build_object('id',id,'email',email) from auth.users where email like 'recovery-%@example.test' order by created_at desc limit 1"));user=saved.id;email=saved.email;
 family={network_id:sql(`select founded_network from familyconnect.beta_admissions where user_id='${user}'`)};
 asset={id:sql(`select id from familyconnect.post_media where owner_id='${user}' order by created_at desc limit 1`)};
}
const fingerprintQuery="select md5((select jsonb_agg(to_jsonb(u) order by id)::text from auth.users u)||(select jsonb_agg(to_jsonb(i) order by id)::text from auth.identities i))";
const authBefore=sql(fingerprintQuery);
// The documented CLI restore excludes these managed vector tables. Refuse
// that exclusion if this local source contains any vector data.
for(const table of ['buckets_vectors','vector_indexes'])assert.equal(sql(`select count(*) from storage.${table}`),'0');
// CLI split dumps preserve platform-installed managed schemas instead of
// trying to reassign auth ownership from a full raw pg_dump.
if(!resume)for(const [file,args] of [['roles.sql',['--role-only']],['schema.sql',[]],['data.sql',['--data-only','--use-copy','-x','storage.buckets_vectors,storage.vector_indexes']]]){
 command('supabase',['db','dump','--local','--workdir','local/beta-final','--file',`../../${out}/private/${file}`,...args],{shell:process.platform==='win32'});
}
const policySQL=sql("select string_agg(format('create policy %I on %I.%I as %s for %s to %s%s%s;',policyname,schemaname,tablename,permissive,cmd,array_to_string(roles,','),case when qual is null then '' else ' using ('||qual||')' end,case when with_check is null then '' else ' with check ('||with_check||')' end),E'\\n' order by policyname) from pg_policies where schemaname='storage' and policyname in ('social_private_images','business_private_images')");
writeFileSync(`${out}/private/storage-policies.sql`,policySQL);
const restore=readFileSync(`${out}/private/roles.sql`,'utf8')+'\n'+readFileSync(`${out}/private/schema.sql`,'utf8')+'\nset session_replication_role=replica;\n'+readFileSync(`${out}/private/data.sql`,'utf8')+'\nset session_replication_role=origin;\n'+policySQL+"\ndo $$begin if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='familyconnect' and tablename='notifications') then alter publication supabase_realtime add table familyconnect.notifications;end if;end$$;";
try{
 const aclSQL=sql("select string_agg(format('revoke all on function %I.%I(%s) from public,anon,authenticated,service_role;',n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) || coalesce((select string_agg(format('grant %s on function %I.%I(%s) to %s%s;',a.privilege_type,n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),case when a.grantee=0 then 'public' else quote_ident(pg_get_userbyid(a.grantee)) end,case when a.is_grantable then ' with grant option' else '' end),E'\\n' order by a.grantee,a.privilege_type) from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a),''),E'\\n' order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='familyconnect' or (n.nspname='public' and p.proname like 'fc_%')");
 writeFileSync(`${out}/private/function-acls.sql`,aclSQL);
 const tableACL=sql("select string_agg(format('revoke all on %s %I.%I from public,anon,authenticated,service_role;',case when c.relkind='S' then 'sequence' else 'table' end,n.nspname,c.relname)||coalesce((select string_agg(format('grant %s on %s %I.%I to %s%s;',a.privilege_type,case when c.relkind='S' then 'sequence' else 'table' end,n.nspname,c.relname,case when a.grantee=0 then 'public' else quote_ident(pg_get_userbyid(a.grantee)) end,case when a.is_grantable then ' with grant option' else '' end),E'\\n' order by a.grantee,a.privilege_type) from aclexplode(coalesce(c.relacl,acldefault(case when c.relkind='S' then 's'::\"char\" else 'r'::\"char\" end,c.relowner))) a),''),E'\\n' order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','S') and (n.nspname in ('familyconnect','familyconnect_migrations') or (n.nspname='public' and c.relname in ('families','family_memberships','invites')))");
 writeFileSync(`${out}/private/table-acls.sql`,tableACL);
 destSQL('begin;\n'+(resume?'':restore)+'\n'+aclSQL+'\n'+tableACL+"\nnotify pgrst,'reload schema';\ncommit;");
 checks.push({name:'Supported split logical restore into independent local cluster',passed:true});
 assert.equal(destSQL(fingerprintQuery),authBefore);checks.push({name:'All Auth users/identities and credential hashes preserved before destination sign-in',passed:true});
 const tables=JSON.parse(sql("select json_agg(tablename order by tablename) from pg_tables where schemaname='familyconnect'"));
 for(const table of tables){const q=`select md5(coalesce((select jsonb_agg(rowdata order by rowdata::text)::text from (select to_jsonb(t) rowdata from familyconnect."${table}" t) s),''))`;assert.equal(destSQL(q),sql(q),table);}
 const catalog=`select jsonb_agg(x order by x::text)::text from (select jsonb_build_object('schema',n.nspname,'name',c.relname,'rls',c.relrowsecurity,'owner',pg_get_userbyid(c.relowner),'acl',coalesce(c.relacl,acldefault(case when c.relkind='S' then 's'::\"char\" else 'r'::\"char\" end,c.relowner))::text) x from pg_class c join pg_namespace n on n.oid=c.relnamespace where (n.nspname in ('familyconnect','familyconnect_migrations') or (n.nspname='public' and c.relname in ('families','family_memberships','invites'))) and c.relkind in ('r','S')) t`;
 const normalizeTables=value=>JSON.parse(value).map(t=>({...t,acl:t.acl.slice(1,-1).split(',').sort()})).sort((a,b)=>(a.schema+'.'+a.name).localeCompare(b.schema+'.'+b.name));
 assert.deepEqual(normalizeTables(destSQL(catalog)),normalizeTables(sql(catalog)));
 for(const table of ['families','family_memberships','invites']){const q=`select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.${table} t`;assert.equal(destSQL(q),sql(q));}
 const policies="select jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname)::text from pg_policies p where schemaname='familyconnect' or (schemaname='storage' and policyname in ('social_private_images','business_private_images'))";
 assert.equal(destSQL(policies),sql(policies));
 const functions="select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',coalesce(p.proacl,acldefault('f',p.proowner))::text) order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid))::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='familyconnect' or (n.nspname='public' and p.proname like 'fc_%')";
 const normalizeFunctions=value=>JSON.parse(value).map(f=>({...f,acl:f.acl.slice(1,-1).split(',').sort()}));
 assert.deepEqual(normalizeFunctions(destSQL(functions)),normalizeFunctions(sql(functions)));
 const managedOwners="select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'owner',pg_get_userbyid(c.relowner)) order by n.nspname,c.relname)::text from pg_class c join pg_namespace n on n.oid=c.relnamespace where (n.nspname='auth' and c.relname in ('users','identities')) or (n.nspname='storage' and c.relname in ('objects','buckets'))";
 assert.equal(destSQL(managedOwners),sql(managedOwners));
 assert.equal(destSQL('select jsonb_agg(to_jsonb(l) order by version)::text from familyconnect_migrations.ledger l'),sql('select jsonb_agg(to_jsonb(l) order by version)::text from familyconnect_migrations.ledger l'));
 checks.push({name:'Every application table digest, application ownership/ACL/RLS and Storage policies match',passed:true});
 const destAdmin=createClient(dest.API_URL,dest.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 // Storage bytes are independent of SQL. Restore through Storage API, not raw
 // storage row deletion; upsert retains the restored object paths.
 const objects=JSON.parse(sql("select coalesce(json_agg(name order by name),'[]') from storage.objects where bucket_id='family-private'"));
 for(const path of objects){const source=await admin.storage.from('family-private').download(path);assert.ifError(source.error);
  const data=Buffer.from(await source.data.arrayBuffer());assert.ifError((await destAdmin.storage.from('family-private').upload(path,data,{contentType:'image/webp',upsert:true,cacheControl:'0'})).error);
  const restoredBytes=await destAdmin.storage.from('family-private').download(path);assert.ifError(restoredBytes.error);assert.deepEqual(Buffer.from(await restoredBytes.data.arrayBuffer()),data);
 }
 const restored=createClient(dest.API_URL,dest.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});if(password)assert.ifError((await restored.auth.signInWithPassword({email,password})).error);else{const link=await destAdmin.auth.admin.generateLink({type:'magiclink',email});assert.ifError(link.error);const session=await restored.auth.verifyOtp({type:'magiclink',token_hash:link.data.properties.hashed_token});assert.ifError(session.error);assert.equal(session.data.user.id,user);}
 assert.equal((await rpc(restored,'fc_social_view',{network:family.network_id})).posts[0].body,'Recovery private image');
 const photo=await restored.storage.from('family-private').download(`${asset.id}/image.webp`);assert.ifError(photo.error);assert.equal(createHash('sha256').update(Buffer.from(await photo.data.arrayBuffer())).digest('hex'),createHash('sha256').update(bytes).digest('hex'));
 const anonymous=createClient(dest.API_URL,dest.ANON_KEY,{auth:{persistSession:false}});assert.ok((await anonymous.storage.from('family-private').download(`${asset.id}/image.webp`)).error);
 await rpc(destAdmin,'fc_beta_authorize',{target:user,approved:false,allow_found:false,reason:'Restore revocation acceptance check'});
 assert.ok((await restored.rpc('fc_social_view',{network:family.network_id})).error);assert.ok((await restored.storage.from('family-private').download(`${asset.id}/image.webp`)).error);
 checks.push({name:'Restored account authenticates; private bytes match; anonymous access and revoked session denied',passed:true});
 writeFileSync(`${out}/independent-recovery-results.json`,JSON.stringify({at:new Date().toISOString(),passed:true,authentication:password?'Password login':'Local verified-link login; all credential hashes compared before authentication',seconds:(Date.now()-started)/1000,checks,scope:'Independent local Docker clusters only; NOT hosted recovery proof'},null,2));
 console.log('PASS independent local recovery',checks.length,'checks');
}catch(error){writeFileSync(`${out}/independent-recovery-results.json`,JSON.stringify({at:new Date().toISOString(),passed:false,checks,error:error.message,scope:'Local independent cluster; no permissions bypassed'},null,2));throw error;}
