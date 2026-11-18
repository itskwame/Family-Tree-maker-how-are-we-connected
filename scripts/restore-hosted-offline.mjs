// Restore only the protected hosted archive into a fresh, offline local cluster.
// No hosted connection, no Auth/Storage web service and no published ports.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const vault=join(process.env.LOCALAPPDATA,'FamilyConnect','Recovery','jmsntxwkaneluqgnzzim');
const {runDir,stage}=JSON.parse(readFileSync(join(vault,'latest-capture.json')));
assert.equal(stage,'backup');assert(resolve(runDir).startsWith(resolve(vault)+ '\\'));
const manifest=JSON.parse(readFileSync(join(runDir,'manifest.json')));
for(const file of manifest.files)assert.equal(createHash('sha256').update(readFileSync(join(runDir,file.file))).digest('hex'),file.sha256);
const resume=process.argv.includes('--resume-empty');
const prior=resume?JSON.parse(readFileSync(join(runDir,'local-destination.json'))):null;
const name=prior?.name||'fc-hosted-recovery-'+Date.now(),volume=prior?.volume||name+'-data',image='public.ecr.aws/supabase/postgres:17.6.1.075';
const commands=[];
const originalRoles=readFileSync(join(runDir,'roles.sql'),'utf8');
assert.equal((originalRoles.match(/^CREATE ROLE supabase_admin;$/gm)||[]).length,1);
writeFileSync(join(runDir,'roles-restore.sql'),originalRoles.replace(/^CREATE ROLE supabase_admin;$/m,'-- supabase_admin is already the fresh cluster bootstrap role; attributes follow unchanged.'));
function run(args,{input,allowFailure=false}={}){
 commands.push(args);
 const r=spawnSync('docker',args,{input,encoding:'utf8',maxBuffer:30e6,timeout:180000});
 if(r.status!==0&&!allowFailure){writeFileSync(join(runDir,'restore-error.log'),r.stderr||'');throw Error('Local restore command failed; diagnostics retained privately');}
 return r;
}
const setup="set -e; mkdir -p /recovery/data; chown postgres:postgres /recovery/data; chmod 700 /recovery/data; exec gosu postgres bash -c 'set -e; initdb -D /recovery/data -U supabase_admin --auth-local=trust --auth-host=reject >/tmp/fc-init.log; exec postgres -D /recovery/data -c listen_addresses= -c unix_socket_directories=/tmp'";
try{
 if(!resume){
 run(['run','-d','--name',name,'--network','none','--mount',`type=volume,source=${volume},target=/recovery`,'--mount',`type=bind,source=${runDir},target=/backup,readonly`,'--entrypoint','bash',image,'-c',setup]);
 writeFileSync(join(runDir,'local-destination.json'),JSON.stringify({name,volume,network:'none',ports:[],operator:'supabase_admin'}));
 for(let i=0;i<60;i++){if(run(['exec',name,'pg_isready','-h','/tmp','-U','supabase_admin'],{allowFailure:true}).status===0)break;await new Promise(r=>setTimeout(r,500));}
 run(['exec',name,'psql','-h','/tmp','-U','supabase_admin','-d','postgres','-v','ON_ERROR_STOP=1','-f','/backup/roles-restore.sql']);
 run(['exec',name,'createdb','-h','/tmp','-U','supabase_admin','-O','postgres','-T','template0','hosted_recovery']);
 }
 const container=JSON.parse(run(['inspect',name]).stdout)[0];assert.equal(container.HostConfig.NetworkMode,'none');assert.equal(Object.keys(container.HostConfig.PortBindings||{}).length,0);
 const empty=run(['exec',name,'psql','-h','/tmp','-U','supabase_admin','-d','hosted_recovery','-qAt','-c',"select count(*) from pg_namespace where nspname in ('auth','storage','graphql');"]).stdout.trim();assert.equal(empty,'0','Refuse nonempty destination');
 const sections={};
 for(const section of ['pre-data','data','post-data']){
  sections[section]=run(['exec',name,'pg_restore',`--section=${section}`,'--file=-','/backup/database.dump']).stdout;
  writeFileSync(join(runDir,`restore-${section}.sql`),sections[section]);
 }
 const wrapper=JSON.parse(readFileSync(join(runDir,'graphql-wrapper.json')));
 assert(['supabase_admin','postgres'].includes(wrapper.owner));assert.equal(wrapper.extension,'pg_graphql');
 const supplement=wrapper.definition+';'+`\nalter function graphql_public.graphql(text,text,jsonb,jsonb) owner to "${wrapper.owner}";\ndo $$begin if not exists(select 1 from pg_depend where classid='pg_proc'::regclass and objid='graphql_public.graphql(text,text,jsonb,jsonb)'::regprocedure and deptype='e') then alter extension pg_graphql add function graphql_public.graphql(text,text,jsonb,jsonb);end if;end$$;\n`;
 writeFileSync(join(runDir,'managed-customizations.sql'),supplement);
 // Extension-owned function ACLs occur in pre-data; recreate the exact hosted
 // wrapper immediately before its first grant, retaining every original grant.
 const wrapperGrant=sections['pre-data'].indexOf('GRANT ALL ON FUNCTION graphql_public.graphql(');
 assert(wrapperGrant>0,'Expected hosted GraphQL ACL anchor');
 sections['pre-data']=sections['pre-data'].slice(0,wrapperGrant)+supplement+'\n'+sections['pre-data'].slice(wrapperGrant);
 const sourceInventory=JSON.parse(readFileSync(join(runDir,'inventory-after.json')));
 let extensionState='';
 for(const schema of ['graphql','graphql_public']){
  const captured=sourceInventory.schemas.find(s=>s.name===schema);
  assert.equal(captured.owner,'supabase_admin');
  assert.equal(captured.acl,'{supabase_admin=UC/supabase_admin,postgres=U*/supabase_admin,anon=U/supabase_admin,authenticated=U/supabase_admin,service_role=U/supabase_admin}');
  extensionState+=`GRANT USAGE ON SCHEMA ${schema} TO postgres WITH GRANT OPTION; GRANT USAGE ON SCHEMA ${schema} TO anon,authenticated,service_role;\n`;
 }
 const sequence=sourceInventory.sequences.find(s=>s.schemaname==='graphql'&&s.sequencename==='seq_schema_version');
 assert(Number.isSafeInteger(sequence.last_value));
 extensionState+=`SELECT pg_catalog.setval('graphql.seq_schema_version',${sequence.last_value},true);\n`;
 writeFileSync(join(runDir,'extension-state.sql'),extensionState);
 run(['exec','-i',name,'psql','-h','/tmp','-U','supabase_admin','-d','hosted_recovery','-X','-q','-v','ON_ERROR_STOP=1','--single-transaction','-f','-'],{input:sections['pre-data']+'\n'+sections.data+'\n'+sections['post-data']+'\n'+extensionState});
 console.log(JSON.stringify({stage:'offline-restore',passed:true,network:'none',ports:0}));
 writeFileSync(join(runDir,'local-restore-status.json'),JSON.stringify({passed:true,commands},null,2));
}catch(error){writeFileSync(join(runDir,'local-restore-status.json'),JSON.stringify({passed:false,error:error.message,commands},null,2));console.error(error.message);process.exitCode=1;}

