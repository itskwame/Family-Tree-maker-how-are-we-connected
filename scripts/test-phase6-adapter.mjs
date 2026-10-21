import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {login,uuid,ids} from './phase6-local.mjs';
import {fixture} from '../src/family/fixture.js';
import {validateGraph} from '../src/family/graph.js';
import {relationshipsBetween} from '../src/family/relationships.js';
import {graphFrom} from '../src/phase6/graph-adapter.mjs';
const c=await login('david');const {data:s,error}=await c.rpc('fc_snapshot');assert.ifError(error);
for(const p of fixture.partnerships){const stored=s.partnerships.find(e=>e.id===uuid(p.id));assert(stored);assert.equal(stored.kind,p.kind);assert.equal(stored.status,p.status)}
const g=graphFrom(s,ids.network);
for(const network of s.networks)validateGraph(graphFrom(s,network.id));
validateGraph(g);assert.equal(relationshipsBetween(g,uuid('emma'),uuid('david')).options[0].label,"Emma is David's daughter");
writeFileSync('output/phase6/adapter-tests.json',JSON.stringify({passed:true,checks:['All fixture partnership types and statuses preserved','Authorized snapshot graph validates','Confirmed parent-child description matches existing engine']},null,2));console.log('PASS 3 local graph-adapter checks');
