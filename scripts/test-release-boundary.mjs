import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {releaseConfig} from './release-config.mjs';
import {graphFrom} from '../src/phase6/graph-adapter.mjs';
const keys=['FAMILYCONNECT_RELEASE_TARGET','VITE_FC_URL','VITE_FC_ANON_KEY','VITE_FC_MEDIA_URL','FAMILYCONNECT_DEMO','VITE_FC_ENABLE_DEMO'],saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
const checks=[],check=(name,fn)=>{fn();checks.push({name,passed:true});console.log('PASS',name)};
try{
 for(const key of keys)delete process.env[key];
 check('Unconfigured release cannot reuse development or legacy .env credentials',()=>assert.throws(()=>releaseConfig('production'),/Release build blocked/));
 for(const target of ['private-beta','production']){
  Object.assign(process.env,{FAMILYCONNECT_RELEASE_TARGET:target,VITE_FC_URL:'https://reviewed-placeholder.example.test',VITE_FC_ANON_KEY:'sb_publishable_boundary_test'});
  check(`${target}: demos disabled, no public copy, only current application entry`,()=>{const c=releaseConfig('production');assert.equal(c.define.__FAMILYCONNECT_DEMO__,'false');assert.equal(c.publicDir,false);assert.equal(c.build.outDir,'dist-release');assert.equal(c.build.rollupOptions.input,'phase6.html');assert(!c.envPrefix.includes('PHASE6'));});
  check(`${target}: localhost backend and demo opt-in overrides rejected`,()=>{process.env.VITE_FC_URL='http://127.0.0.1:55321';assert.throws(()=>releaseConfig('production'));process.env.VITE_FC_URL='https://reviewed-placeholder.example.test';process.env.FAMILYCONNECT_DEMO='true';assert.throws(()=>releaseConfig('production'));delete process.env.FAMILYCONNECT_DEMO;});
 }
 check('Service-role and secret API keys cannot enter release bundles',()=>{for(const key of ['sb_secret_test','header.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.signature']){process.env.VITE_FC_ANON_KEY=key;assert.throws(()=>releaseConfig('production'),/public anon\/publishable/);}});
 check('Graph adapter never fills empty data or uses known sample portrait references in release context',()=>{const empty={people:[],parentages:[],partnerships:[],networks:[]};assert.deepEqual(graphFrom(empty,'n'),{people:[],parentages:[],partnerships:[]});const graph=graphFrom({...empty,people:[{id:'p',network_id:'n',first_name:'A',last_name:'B',photo:'/family-portraits/emma.jpg'}]},'n');assert.equal(graph.people.length,1);assert.equal(graph.people[0].photo,null);});
 check('Automatic local SQL seeding disabled and deployment publishes only release artifact',()=>{const config=readFileSync('local/phase6/supabase/config.toml','utf8');assert.match(config,/\[db.seed\][\s\S]*?enabled = false/);assert.match(config,/sql_paths = \[\]/);const netlify=readFileSync('netlify.toml','utf8');assert.match(netlify,/publish = "dist-release"/);assert.match(netlify,/command = "npm run build:release"/);});
}finally{for(const [key,value] of Object.entries(saved))if(value===undefined)delete process.env[key];else process.env[key]=value;}
writeFileSync('output/demo-audit/release-boundary-tests.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));
