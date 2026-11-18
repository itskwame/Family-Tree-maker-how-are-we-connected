import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
const vault=join(process.env.LOCALAPPDATA,'FamilyConnect','Recovery','jmsntxwkaneluqgnzzim');
const {runDir}=JSON.parse(readFileSync(join(vault,'latest-capture.json')));
const {name}=JSON.parse(readFileSync(join(runDir,'local-destination.json')));
function query(sql){const r=spawnSync('docker',['exec','-i',name,'psql','-X','-qAt','-h','/tmp','-U','supabase_admin','-d','hosted_recovery','-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',maxBuffer:30e6});if(r.status!==0)throw Error('Local verification query failed');return r.stdout;}
const inv=query(readFileSync('scripts/hosted-recovery-inventory.sql','utf8'));
writeFileSync(join(runDir,'local-inventory.json'),inv);
const rows=query(readFileSync(join(runDir,'source-fingerprints.sql'),'utf8'));
writeFileSync(join(runDir,'local-fingerprints.jsonl'),rows);
function normalize(x){if(Array.isArray(x))return x.map(normalize).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).filter(k=>k!=='oid').sort().map(k=>[k,k==='acl'&&typeof x[k]==='string'?x[k].slice(1,-1).split(',').sort():normalize(x[k])]));return x;}
const source=JSON.parse(readFileSync(join(runDir,'inventory-after.json'))),local=JSON.parse(inv);
// Logical dumps omit dropped-column physical slots; compare live column order.
for(const inv of [source,local]){const ranks=new Map();for(const c of inv.columns){const key=c.schema+'.'+c.table;const rank=(ranks.get(key)||0)+1;ranks.set(key,rank);c.ordinal=rank;}}
const checks=Object.keys(source).map(k=>({check:k,passed:isDeepStrictEqual(normalize(source[k]),normalize(local[k]))}));
const parseRows=s=>s.trim().split(/\r?\n/).map(JSON.parse);
checks.push({check:'all_table_counts_and_row_fingerprints',passed:isDeepStrictEqual(normalize(parseRows(readFileSync(join(runDir,'source-fingerprints.jsonl'),'utf8'))),normalize(parseRows(rows)))});
const report={passed:checks.every(c=>c.passed),tables:parseRows(rows).length,authUsers:local.auth_users,authIdentities:local.auth_identities,checks};
writeFileSync(join(runDir,'recovery-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(!report.passed)process.exitCode=1;
