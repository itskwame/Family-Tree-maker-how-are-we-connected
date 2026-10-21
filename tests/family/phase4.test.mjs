import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { fixture300 as graph } from '../../src/family/fixture300.js';
import { fixture100 } from '../../src/family/fixture100.js';
import { validateGraph, personalBranch } from '../../src/family/graph.js';
import { relationshipsBetween, createRelationshipFinder } from '../../src/family/relationships.js';
import { layoutFamily } from '../../src/family/layout.js';
import { audit } from './geometry-audit.mjs';
const out = 'output/phase4';
fs.mkdirSync(out, { recursive: true });
const find = createRelationshipFinder(graph);
test('300 unique fictional people, 36 portraits, valid chronology and six-generation ancestry', () => {
  validateGraph(graph);
  assert.equal(graph.people.length, 300);
  assert.equal(new Set(graph.people.map(p => p.id)).size, 300);
  assert.equal(new Set(graph.people.map(p => `${p.first} ${p.last}`)).size, 300);
  assert.equal(graph.people.filter(p => p.photo).length, 36);
  for (const p of graph.people.filter(p => p.photo)) assert.ok(fs.existsSync(`public${p.photo}`));
  for (const edge of graph.parentages) assert.ok(graph.people.find(p => p.id === edge.child).born - graph.people.find(p => p.id === edge.parent).born >= 16, edge.id);
  assert.equal(graph.parentages.filter(e => e.kind === 'adoptive').length, 4);
  assert.equal(fixture100.people.length, 100, 'Original fixture is unchanged');
  fs.writeFileSync(`${out}/fictional-family-300.json`, JSON.stringify(graph, null, 2));
});
test('distant, removed, half-sibling, unknown-parent and adoptive labels; multiple paths', () => {
  for (const [a,b,label] of [
    ['b1-aaa','c7-22','Third cousins, once removed'],
    ['emma','c7-22','Second cousins, once removed'],
    ['c1-3','c1-7','Half-siblings'],
    ['c5-7','c5-17','Connection through adoptive parentage'],
    ['c3-12','c3-14','Siblings; full or half is not established'],
    ['emma','b1-aaa','First cousins, twice removed'],
    ['c1-0','c1-1','Former spouses'], ['c1-0','c1-2','Spouses'],
  ]) assert.ok(find(a,b).options.some(o => o.label === label), `${a}/${b}: ${label}`);
  const options = find('ethan', 'b1-aaa').options.filter(o => o.kind === 'biological');
  assert.equal(options.length, 4);
  assert.ok(options.every(o => o.label === 'Second cousins, once removed'));
  assert.equal(options.filter(o => o.ancestor === 'arthur').length, 2);
  assert.equal(find('c5-7','c5-17').options.some(o => o.kind === 'biological'), false);
});
test('all 90,000 ordered pairs have real connected evidence and cached results match reference samples', () => {
  const started = performance.now(), edges = new Map([...graph.parentages,...graph.partnerships].map(e=>[e.id,e]));
  let count=0;
  for (const a of graph.people) for (const b of graph.people) {
    const result = find(a.id,b.id);
    assert.ok(result.options.length, `${a.id}/${b.id}`);
    if (count++ % 300 === 17) assert.deepEqual(result, relationshipsBetween(graph,a.id,b.id));
    for (const o of result.options) {
      assert.equal(o.path[0],a.id); assert.equal(o.path.at(-1),b.id);
      assert.equal(o.edges.length,o.path.length-1); assert.equal(new Set(o.path).size,o.path.length);
      o.edges.forEach((id,i)=> { const e=edges.get(id), endpoints=e.partners || [e.parent,e.child]; assert.ok(endpoints.includes(o.path[i]) && endpoints.includes(o.path[i+1])); if(o.kind==='biological') assert.equal(e.kind,'biological'); });
    }
  }
  fs.writeFileSync(`${out}/relationship-metrics.json`,JSON.stringify({orderedPairs:count,wallMs:performance.now()-started},null,2));
});
test('duplicates and cycles rejected; indexed relationship finder owns an immutable snapshot', () => {
  for (const mutate of [g=>g.people.push(g.people[0]),g=>g.parentages.push(g.parentages[0]),g=>g.partnerships.push({...g.partnerships[0],id:'duplicate-union'}),g=>g.parentages.push({id:'cycle',parent:'b1-aaa',child:'edmund',kind:'biological'})]) {
    const g=structuredClone(graph);mutate(g);assert.throws(()=>validateGraph(g));
  }
  const source=structuredClone(graph), snapshot=createRelationshipFinder(source), before=snapshot('emma','c7-22');
  source.parentages=[];assert.deepEqual(snapshot('emma','c7-22'),before);
});
test('300-person automatic geometry and all anchors repeat exactly; no unexplained intersections', async () => {
  const runs=[];let previous,layout;
  for(let i=0;i<2;i++) {
    const start=performance.now();layout=await layoutFamily(graph);
    runs.push({wallMs:performance.now()-start,layoutMs:layout.layoutMs,memory:process.memoryUsage()});
    const coordinates=layout.nodes.map(n=>[n.id,n.x,n.y]);if(previous)assert.deepEqual(coordinates,previous);previous=coordinates;
  }
  const intersections=audit(layout);
  assert.equal(layout.nodes.filter(n=>n.person).length,300);
  assert.equal(new Set(layout.nodes.filter(n=>n.person).map(n=>n.generation)).size,6);
  for(const e of [...graph.parentages,...graph.partnerships])assert.ok(layout.edges.some(route=>route.semantic.includes(e.id)),e.id);
  fs.writeFileSync(`${out}/layout-metrics.json`,JSON.stringify({cpu:os.cpus()[0].model,node:process.version,width:layout.width,height:layout.height,people:300,partnerships:graph.partnerships.length,parentages:graph.parentages.length,nodes:layout.nodes.length,edges:layout.edges.length,crossovers:layout.crossovers.length,intersections,runs},null,2));
});
test('personal branches honor independent ancestor/descendant limits and include each relative once', async () => {
  assert.deepEqual(personalBranch(graph,'emma',0,1).people.map(p=>p.id).sort(),['emma','lucas','ava','theo'].sort());
  assert.equal(personalBranch(graph,'emma',2,1).people.length,11);
  assert.ok(!personalBranch(graph,'emma',2,1).people.some(p=>p.id==='sophie'),'No cousin branches imported from included ancestors');
  assert.ok(personalBranch(graph,'c5-17',1,0).people.some(p=>p.id==='c5-7'),'Adoptive parent included');
  assert.throws(()=>personalBranch(graph,'emma',-1,1)); assert.throws(()=>personalBranch(graph,'missing',1,1));
  for(const [root,up,down] of [['emma',0,1],['emma',2,1],['david',1,2],['c5-17',1,0],['c3-14',1,0],['b1-aaa',3,0]]) {
    const branch=personalBranch(graph,root,up,down);
    assert.equal(new Set(branch.people.map(p=>p.id)).size,branch.people.length);audit(await layoutFamily(branch));
  }
});
