import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { fixture100 as graph } from '../../src/family/fixture100.js';
import { validateGraph, branchView, shortestConnection } from '../../src/family/graph.js';
import { relationshipsBetween } from '../../src/family/relationships.js';
import { layoutFamily, inspectGeometry, lineCrossovers, edgePoints } from '../../src/family/layout.js';

const output = 'output/phase3';
fs.mkdirSync(output, { recursive: true });
test('100 unique fictional identities, plausible chronology and full connected coverage', () => {
  validateGraph(graph);
  assert.equal(graph.people.length, 100);
  assert.equal(new Set(graph.people.map(p => p.id)).size, 100);
  assert.equal(new Set(graph.people.map(p => `${p.first} ${p.last}`)).size, 100);
  for (const person of graph.people) assert.ok(shortestConnection(graph, 'arthur', person.id));
  for (const edge of graph.parentages) {
    const parent = graph.people.find(p => p.id === edge.parent), child = graph.people.find(p => p.id === edge.child);
    assert.ok(child.born - parent.born >= 16, `${edge.id}: plausible parent age`);
  }
  assert.equal(graph.people.filter(p => p.photo).length, 8);
  assert.equal(graph.people.filter(p => !p.photo).length, 92);
  assert.ok(graph.parentages.some(e => e.kind === 'adoptive'));
  assert.ok(graph.partnerships.some(p => p.status === 'former'));
});
for (const [a, b, expected] of [
  ['emma', 'b1-aaa', 'First cousins, twice removed'],
  ['ava', 'b1-aaa', 'Second cousins, once removed'],
  ['b1-aaa', 'b5-baa', 'Third cousins'],
  ['b1-a', 'b1-b', 'Half-siblings'],
  ['b3-ba', 'b3-bb', 'Siblings; full or half is not established'],
  ['b2-b', 'b2-bb', 'Connection through adoptive parentage'],
  ['b2-bb', 'b5-aaa', 'Connection through adoptive parentage'],
  ['b1-root', 'b1-spouse', 'Former spouses'],
  ['b1-root', 'b1-second', 'Spouses'],
]) test(`${a} to ${b}: ${expected}`, () => {
  assert.ok(relationshipsBetween(graph, a, b).options.some(o => o.label === expected));
});
test('four independent common-ancestor paths survive double cousin ancestry', () => {
  const options = relationshipsBetween(graph, 'emma', 'b1-a').options;
  assert.equal(options.length, 4);
  assert.deepEqual(new Set(options.map(o => o.ancestor)), new Set(['arthur', 'eleanor', 'samuel', 'iris']));
  assert.ok(options.every(o => o.label === 'First cousins'));
  const repeatedAncestors = relationshipsBetween(graph, 'ethan', 'b1-aaa').options;
  assert.equal(repeatedAncestors.length, 4);
  assert.equal(repeatedAncestors.filter(o => o.ancestor === 'arthur').length, 2);
  assert.equal(new Set(repeatedAncestors.map(o => o.path.join('|'))).size, 4);
  assert.ok(repeatedAncestors.every(o => o.label === 'Second cousins, once removed'));
  assert.equal(relationshipsBetween(graph, 'b2-b', 'b2-bb').options.some(o => o.kind === 'biological'), false);
});
test('all 10,000 ordered pairs: connected evidence, correct endpoints, acyclic real edges', () => {
  const edges = new Map([...graph.parentages, ...graph.partnerships].map(e => [e.id, e]));
  for (const a of graph.people) for (const b of graph.people) {
    const options = relationshipsBetween(graph, a.id, b.id).options;
    assert.ok(options.length, `${a.id}/${b.id}`);
    for (const option of options) {
      assert.equal(option.path[0], a.id); assert.equal(option.path.at(-1), b.id);
      assert.equal(option.path.length, option.edges.length + 1);
      assert.equal(new Set(option.path).size, option.path.length);
      option.edges.forEach((id, i) => {
        const edge = edges.get(id), endpoints = edge.partners || [edge.parent, edge.child];
        assert.ok(endpoints.includes(option.path[i]) && endpoints.includes(option.path[i + 1]));
        if (option.kind === 'biological') assert.equal(edge.kind, 'biological');
      });
    }
  }
});
test('automatic layout, repeatability, every edge represented, five generations and intersection audit', async () => {
  const measurements = [];
  let layout;
  for (let i = 0; i < 3; i++) {
    const before = process.memoryUsage(), start = performance.now();
    const current = await layoutFamily(graph);
    measurements.push({ wallMs: performance.now() - start, layoutMs: current.layoutMs, before, after: process.memoryUsage() });
    if (layout) assert.deepEqual(current.nodes.map(n => [n.id, n.x, n.y]), layout.nodes.map(n => [n.id, n.x, n.y]));
    layout = current;
  }
  assert.equal(layout.nodes.filter(n => n.person).length, 100);
  assert.equal(new Set(layout.nodes.map(n => n.id)).size, layout.nodes.length);
  assert.equal(new Set(layout.edges.map(e => e.id)).size, layout.edges.length);
  assert.equal(new Set(layout.nodes.filter(n => n.person).map(n => n.generation)).size, 5);
  assert.deepEqual(inspectGeometry(layout), { overlaps: [], detached: [], crossings: [] });
  for (const edge of [...graph.parentages, ...graph.partnerships]) assert.ok(layout.edges.some(e => e.semantic.includes(edge.id)), edge.id);
  const unrelatedOverlaps = [], unrelatedTouches = [];
  for (let i = 0; i < layout.edges.length; i++) for (let j = i + 1; j < layout.edges.length; j++) {
    const a = layout.edges[i], b = layout.edges[j];
    if (a.id.split(/:from:|:to:/)[0] === b.id.split(/:from:|:to:/)[0]) continue;
    const ap = edgePoints(a), bp = edgePoints(b);
    for (let x = 1; x < ap.length; x++) for (let y = 1; y < bp.length; y++) {
      const [p, q, r, s] = [ap[x - 1], ap[x], bp[y - 1], bp[y]];
      const sharedEndpoint = a.targets[0] === b.targets[0] || a.sources[0] === b.sources[0];
      const horizontal = p.y === q.y && r.y === s.y && p.y === r.y && Math.min(Math.max(p.x,q.x),Math.max(r.x,s.x)) > Math.max(Math.min(p.x,q.x),Math.min(r.x,s.x));
      const vertical = p.x === q.x && r.x === s.x && p.x === r.x && Math.min(Math.max(p.y,q.y),Math.max(r.y,s.y)) > Math.max(Math.min(p.y,q.y),Math.min(r.y,s.y));
      if ((horizontal || vertical) && !sharedEndpoint) unrelatedOverlaps.push([a.id, b.id]);
      for (const [h1,h2,v1,v2] of [[p,q,r,s],[r,s,p,q]]) {
        if (h1.y !== h2.y || v1.x !== v2.x) continue;
        const inclusive = v1.x >= Math.min(h1.x,h2.x) && v1.x <= Math.max(h1.x,h2.x) && h1.y >= Math.min(v1.y,v2.y) && h1.y <= Math.max(v1.y,v2.y);
        const strict = v1.x > Math.min(h1.x,h2.x) && v1.x < Math.max(h1.x,h2.x) && h1.y > Math.min(v1.y,v2.y) && h1.y < Math.max(v1.y,v2.y);
        if (inclusive && !strict && !sharedEndpoint) unrelatedTouches.push([a.id,b.id]);
      }
    }
  }
  assert.deepEqual(unrelatedOverlaps, []);
  assert.deepEqual(unrelatedTouches, []);
  fs.writeFileSync(`${output}/layout-metrics.json`, JSON.stringify({
    node: process.version, platform: os.platform(), cpu: os.cpus()[0].model,
    people:100, partnerships: graph.partnerships.length, parentages: graph.parentages.length,
    width: layout.width, height: layout.height, geometry: inspectGeometry(layout),
    explicitlyGappedCrossovers: lineCrossovers(layout).length, unrelatedCollinearOverlaps: unrelatedOverlaps, unrelatedTouches,
    measurements, memoryNote: 'Node process snapshots include ELK and retained prior runs; not peak or browser total memory.',
  }, null, 2));
});
test('representative branches retain geometry and canonical data', async () => {
  for (const root of ['emma', 'b1-a', 'b2-b', 'b3-bb', 'b5-aaa']) for (const direction of ['descendants', 'ancestors']) {
    const view = branchView(graph, root, direction);
    assert.deepEqual(inspectGeometry(await layoutFamily(view)), { overlaps: [], detached: [], crossings: [] });
  }
  assert.equal(graph.people.length, 100);
});
