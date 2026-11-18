// Fixed hosted source, read-only PostgreSQL sessions. Credentials arrive only on
// stdin, never argv, logs, files, Docker config or repository output.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const input=JSON.parse(Buffer.from(readFileSync(0,'utf8'),'base64').toString('utf8'));
const {connection:c,vault,password,stage}=input;
const ref='jmsntxwkaneluqgnzzim',image='public.ecr.aws/supabase/postgres:17.6.1.075';
assert.equal(c.project,ref);assert.equal(c.port,5432);assert.equal(c.database,'postgres');
assert(c.host===`db.${ref}.supabase.co`||/^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(c.host));
assert.equal(c.user,c.host.startsWith('db.')?'postgres':`postgres.${ref}`);
assert.equal(resolve(vault),resolve(process.env.LOCALAPPDATA,'FamilyConnect','Recovery',ref));
const runDir=stage==='verify'?JSON.parse(readFileSync(join(vault,'latest-capture.json'))).runDir:join(vault,'capture-'+new Date().toISOString().replaceAll(/[:.]/g,'-'));
assert(resolve(runDir).startsWith(resolve(vault)+'\\'));
if(stage!=='verify'){mkdirSync(runDir);writeFileSync(join(vault,'latest-capture.json'),JSON.stringify({runDir,stage}));}
copyFileSync(join(vault,'supabase-ca.crt'),join(runDir,'supabase-ca.crt'));
const commands=[];
function source(script,label){
 const setup='set -euo pipefail\nIFS= read -r encoded\nexport PGPASSWORD="$(printf %s "$encoded" | base64 -d)"\nunset encoded\n';
 const args=['run','--rm','-i','--entrypoint','bash','--mount',`type=bind,source=${runDir},target=/backup`,
 '-e',`PGHOST=${c.host}`,'-e',`PGUSER=${c.user}`,'-e','PGPORT=5432','-e','PGDATABASE=postgres',
 '-e','PGSSLMODE=verify-full','-e','PGSSLROOTCERT=/backup/supabase-ca.crt','-e','PGCONNECT_TIMEOUT=20',
 '-e','PGOPTIONS=-c default_transaction_read_only=on -c statement_timeout=180000',image,'-c',setup+script];
 commands.push({label,command:script,readOnly:true,tls:'verify-full'});
 const r=spawnSync('docker',args,{input:Buffer.from(password).toString('base64')+'\n',encoding:'utf8',maxBuffer:20e6,timeout:240000});
 writeFileSync(join(runDir,label+'.stderr'),r.stderr||'');
 if(r.status!==0){
  const message=r.stderr||'';
  const category=/password authentication failed/i.test(message)?'database authentication failed':/certificate|SSL error/i.test(message)?'TLS certificate validation failed':/permission denied/i.test(message)?'database permission denied':/could not translate|timeout|connect/i.test(message)?'connection unavailable':'backup tool failed';
  writeFileSync(join(runDir,'status.json'),JSON.stringify({stage,passed:false,category,commands},null,2));
  throw Error(category);
 }
 return r.stdout;
}
try{
 const probe=JSON.parse(source(`psql -X -qAt -v ON_ERROR_STOP=1 -c "begin read only; select json_build_object('version',current_setting('server_version'),'read_only',current_setting('transaction_read_only'),'users',(select count(*) from auth.users),'identities',(select count(*) from auth.identities),'objects',(select count(*) from storage.objects)); commit;"`,'connection'));
 assert.equal(probe.read_only,'on');assert(probe.version.startsWith('17.'));
 writeFileSync(join(runDir,'connection.json'),JSON.stringify(probe,null,2));
 console.log(JSON.stringify({stage:'preflight',passed:true,...probe}));
 if(stage==='backup'){
  source('pg_dump --no-password --format=custom --file=/backup/database.dump','database-dump');
  source('pg_dumpall --no-password --roles-only --no-role-passwords --file=/backup/roles.sql','roles-dump');
  source('pg_restore --list /backup/database.dump > /backup/archive-list.txt\npg_restore --schema-only --file=/backup/full-schema.sql /backup/database.dump','archive-review');
  const query=readFileSync('scripts/hosted-recovery-inventory.sql','utf8');
  writeFileSync(join(runDir,'inventory-query.sql'),query);
  source('psql -X -qAt -v ON_ERROR_STOP=1 -f /backup/inventory-query.sql > /backup/inventory.json','inventory');
  const files=['database.dump','roles.sql','archive-list.txt','full-schema.sql','inventory.json','supabase-ca.crt'].map(file=>({file,sha256:createHash('sha256').update(readFileSync(join(runDir,file))).digest('hex')}));
  writeFileSync(join(runDir,'manifest.json'),JSON.stringify({project:ref,at:new Date().toISOString(),files,commands,rolePasswords:'Not exported: managed database-role passwords are excluded; Auth credential records are inside database.dump',storageBytes:probe.objects===0?'Empty at preflight; recheck required':'Separate object export required'},null,2));
  console.log(JSON.stringify({stage:'database-backup',passed:true,files:files.length,authUsers:probe.users,identities:probe.identities}));
 }
 if(stage==='verify'){
  const inventory=JSON.parse(readFileSync(join(runDir,'inventory.json')));
  const qi=x=>'"'+x.replaceAll('"','""')+'"',qs=x=>"'"+x.replaceAll("'","''")+"'";
  const lines=["begin read only; set local timezone='UTC';"];
  for(const t of inventory.tables)lines.push(`select jsonb_build_object('schema',${qs(t.schema)},'table',${qs(t.name)},'rows',count(*),'digest',md5(coalesce(string_agg(to_jsonb(r)::text,E'\\n' order by to_jsonb(r)::text COLLATE "C"),''))) from ${qi(t.schema)}.${qi(t.name)} r;`);
  lines.push('commit;');writeFileSync(join(runDir,'source-fingerprints.sql'),lines.join('\n'));
  source('psql -X -qAt -v ON_ERROR_STOP=1 -f /backup/source-fingerprints.sql > /backup/source-fingerprints.jsonl','source-fingerprints');
  writeFileSync(join(runDir,'inventory-query.sql'),readFileSync('scripts/hosted-recovery-inventory.sql','utf8'));
  source('psql -X -qAt -v ON_ERROR_STOP=1 -f /backup/inventory-query.sql > /backup/inventory-after.json','inventory-after');
  const wrapperQuery="begin read only; select json_build_object('definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'extension',(select e.extname from pg_depend d join pg_extension e on e.oid=d.refobjid where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')) from pg_proc p where p.oid='graphql_public.graphql(text,text,jsonb,jsonb)'::regprocedure; commit;";
  writeFileSync(join(runDir,'graphql-wrapper-query.sql'),wrapperQuery);
  source('psql -X -qAt -v ON_ERROR_STOP=1 -f /backup/graphql-wrapper-query.sql > /backup/graphql-wrapper.json','graphql-wrapper');
  console.log(JSON.stringify({stage:'source-verification-capture',passed:true,tables:inventory.tables.length}));
 }
 writeFileSync(join(runDir,'status.json'),JSON.stringify({stage,passed:true,commands},null,2));
}catch(error){console.error('STOP: '+error.message);process.exitCode=1;}
