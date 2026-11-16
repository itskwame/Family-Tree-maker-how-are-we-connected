import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {sql} from './beta-final-local.mjs';
const out='output/hosted-beta/final';
const destSQL=q=>{const r=spawnSync('docker',['exec','-i','supabase_db_fc-beta-restore2','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-qAt'],{input:q,encoding:'utf8',maxBuffer:30e6});assert.equal(r.status,0,r.stderr);return r.stdout.trim()};
 const tableACL=sql("select string_agg(format('revoke all on %s %I.%I from public,anon,authenticated,service_role;',case when c.relkind='S' then 'sequence' else 'table' end,n.nspname,c.relname)||coalesce((select string_agg(format('grant %s on %s %I.%I to %s%s;',a.privilege_type,case when c.relkind='S' then 'sequence' else 'table' end,n.nspname,c.relname,case when a.grantee=0 then 'public' else quote_ident(pg_get_userbyid(a.grantee)) end,case when a.is_grantable then ' with grant option' else '' end),E'\\n' order by a.grantee,a.privilege_type) from aclexplode(coalesce(c.relacl,acldefault(case when c.relkind='S' then 's'::\"char\" else 'r'::\"char\" end,c.relowner))) a),''),E'\\n' order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','S') and (n.nspname in ('familyconnect','familyconnect_migrations') or (n.nspname='public' and c.relname in ('families','family_memberships','invites')))");
 writeFileSync(`${out}/private/table-acls.sql`,tableACL);
 destSQL('begin;'+tableACL+'\ncommit;');
 const catalog=`select jsonb_agg(x order by x::text)::text from (select jsonb_build_object('schema',n.nspname,'name',c.relname,'rls',c.relrowsecurity,'owner',pg_get_userbyid(c.relowner),'acl',coalesce(c.relacl,acldefault(case when c.relkind='S' then 's'::\"char\" else 'r'::\"char\" end,c.relowner))::text) x from pg_class c join pg_namespace n on n.oid=c.relnamespace where (n.nspname in ('familyconnect','familyconnect_migrations') or (n.nspname='public' and c.relname in ('families','family_memberships','invites'))) and c.relkind in ('r','S')) t`;
 const normalizeTables=value=>JSON.parse(value).map(t=>({...t,acl:t.acl.slice(1,-1).split(',').sort()})).sort((a,b)=>(a.schema+'.'+a.name).localeCompare(b.schema+'.'+b.name));
 assert.deepEqual(normalizeTables(destSQL(catalog)),normalizeTables(sql(catalog)));
 for(const table of ['families','family_memberships','invites']){const q=`select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.${table} t`;assert.equal(destSQL(q),sql(q));}

writeFileSync(`${out}/restored-table-security-results.json`,JSON.stringify({passed:true,checks:['All application and legacy table/sequence effective ACLs, owners and RLS match source','All legacy record digests match; quarantine grants retained'],at:new Date().toISOString()},null,2));
console.log('PASS restored table/sequence permissions and legacy preservation');
