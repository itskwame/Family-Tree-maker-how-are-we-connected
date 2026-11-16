import {loadEnv} from 'vite';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const legacy=loadEnv('production',process.cwd(),'VITE_SUPABASE_'),local=loadEnv('phase6',process.cwd(),'VITE_PHASE6_');
const endpoint='https://jmsntxwkaneluqgnzzim.supabase.co',key=legacy.VITE_SUPABASE_ANON_KEY;
if(legacy.VITE_SUPABASE_URL!==endpoint||!key)throw Error('Expected hosted public configuration unavailable');
let claims;try{claims=JSON.parse(Buffer.from(key.split('.')[1],'base64url'))}catch{}
if(!key.startsWith('sb_publishable_')&&(claims?.role!=='anon'||claims?.ref!=='jmsntxwkaneluqgnzzim'))throw Error('Public key project binding not confirmed');
const response=await fetch(endpoint+'/auth/v1/settings',{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
// Record rejected credentials separately from compilation.
const env={...process.env,FAMILYCONNECT_RELEASE_TARGET:'private-beta',VITE_FC_URL:endpoint,VITE_FC_ANON_KEY:key};
for(const k of ['VITE_FC_MEDIA_URL','FAMILYCONNECT_DEMO','VITE_FC_ENABLE_DEMO'])delete env[k];
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config','vite.release.config.mjs'],{env,stdio:'inherit'});
const files=[];function walk(dir){for(const d of readdirSync(dir,{withFileTypes:true})){const p=join(dir,d.name);if(d.isDirectory())walk(p);else files.push(p)}}walk('dist-release');
const text=files.filter(p=>/\.(js|css|html|json)$/.test(p)).map(p=>readFileSync(p,'utf8')).join('\n');
const forbiddenFiles=files.filter(p=>/\.env|fixture|portrait|demo|report|test|\.map$/i.test(p));
const forbiddenStrings=['Fictional-Phase6-Only!42','emma@example.test','social-emma-','Emma Bennett','familyconnect-phase6-local'];
const hits=forbiddenStrings.filter(s=>text.includes(s));
const localKeyFound=!!local.VITE_PHASE6_ANON_KEY&&text.includes(local.VITE_PHASE6_ANON_KEY);
const result={checkedAt:new Date().toISOString(),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Local production-mode build using local hosted public configuration (key validity reported separately), NOT a read of Netlify environment variables',publicAuthStatus:response.status,publicKeyAccepted:response.ok,publicKeyProjectMatches:response.ok,mediaConfigured:false,manifest:JSON.parse(readFileSync('dist-release/release-manifest.json')),fileCount:files.length,files,forbiddenFiles,forbiddenStringHits:hits,localKeyFound,containsCorrectProject:text.includes(endpoint)};
writeFileSync('output/deployment-readiness/build-review.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,files:undefined},null,2));
if(forbiddenFiles.length||hits.length||localKeyFound)process.exitCode=1;

