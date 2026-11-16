import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
export const dir='local/beta-final',container='supabase_db_fc-beta-final1';
assert(!existsSync(`${dir}/supabase/.temp/project-ref`));
assert(readFileSync(`${dir}/supabase/config.toml`,'utf8').includes('project_id = "fc-beta-final1"'));
const result=spawnSync('supabase',['status','--workdir',dir,'-o','json'],{encoding:'utf8',shell:process.platform==='win32'});
assert.equal(result.status,0);export const cfg=JSON.parse(result.stdout);
assert.equal(cfg.API_URL,'http://127.0.0.1:60321');
export function sql(query,ok=true){const r=spawnSync('docker',['exec','-i',container,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-qAt'],{input:query,encoding:'utf8',maxBuffer:30e6});if(ok)assert.equal(r.status,0,r.stderr);return ok?r.stdout.trim():r;}
export const client=()=>createClient(cfg.API_URL,cfg.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
export const admin=createClient(cfg.API_URL,cfg.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
export async function rpc(c,name,args={}){const r=await c.rpc(name,args);assert.ifError(r.error);return r.data;}
