import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, portraitIds } from '../../src/family/fixture.js';
import fs from 'node:fs';
import { validateGraph, branchView } from '../../src/family/graph.js';
import { relationshipsBetween } from '../../src/family/relationships.js';
import { layoutFamily, inspectGeometry, lineCrossovers } from '../../src/family/layout.js';

const labels = (a, b, graph = fixture) => relationshipsBetween(graph, a, b).options.map(o => o.label);
const copy = () => structuredClone(fixture);
test('fictional fixture contains exactly 25 unique people, 9 partnerships, and valid parentage', () => {
  assert.equal(fixture.people.length, 25);
  assert.equal(fixture.partnerships.length, 9);
  assert.equal(validateGraph(fixture), fixture);
  assert.equal(fixture.people.filter(p => p.photo).length, 8);
  for (const id of portraitIds) assert.ok(fs.existsSync(`public/family-portraits/${id}.jpg`));
});
for (const [a, b, expected] of [
  ['david', 'emma', "David is Emma's father"],
  ['emma', 'david', "Emma is David's daughter"],
  ['arthur', 'emma', "Arthur is Emma's grandfather"],
  ['ava', 'eleanor', "Ava is Eleanor's great-granddaughter"],
  ['helen', 'emma', "Helen is Emma's aunt"],
  ['emma', 'helen', "Emma is Helen's niece"],
  ['emma', 'jack', 'Full siblings'],
  ['emma', 'leo', 'Half-siblings'],
  ['emma', 'sophie', 'First cousins'],
  ['ava', 'sophie', 'First cousins, once removed'],
  ['ava', 'ethan', 'Second cousins'],
  ['clara', 'david', 'Former spouses'],
  ['emma', 'lucas', 'Spouses'],
  ['sophie', 'noah', 'Partners'],
  ['arthur', 'samuel', 'Connection through partnership'],
]) test(`${a} / ${b}: ${expected}`, () => assert.ok(labels(a, b).includes(expected), labels(a, b).join('; ')));

test('cousin partnership retains biological and partnership evidence separately', () => {
  const result = relationshipsBetween(fixture, 'sophie', 'noah');
  assert.ok(result.options.some(o => o.label === 'First cousins'));
  assert.ok(result.options.some(o => o.label === 'Partners'));
  assert.equal(result.options.filter(o => o.kind === 'biological').length, 2);
});
test('every returned evidence path consists of the named, consecutive real edges', () => {
  for (const a of fixture.people) for (const b of fixture.people) {
    for (const option of relationshipsBetween(fixture, a.id, b.id).options) {
      assert.equal(option.path[0], a.id);
      assert.equal(option.path.at(-1), b.id);
      assert.equal(option.edges.length, option.path.length - 1);
      assert.equal(new Set(option.path).size, option.path.length);
      option.edges.forEach((id, i) => {
        const edge = fixture.parentages.find(e => e.id === id) || fixture.partnerships.find(e => e.id === id);
        const endpoints = edge.partners || [edge.parent, edge.child];
        assert.ok(endpoints.includes(option.path[i]) && endpoints.includes(option.path[i + 1]));
      });
    }
  }
});
test('missing second parents do not establish half-sibling status', () => {
  const g = copy();
  g.parentages = g.parentages.filter(e => !(e.parent === 'clara' && e.child === 'emma'));
  g.people.find(p => p.id === 'emma').biologicalParentsComplete = false;
  assert.ok(labels('emma', 'leo', g).includes('Siblings; full or half is not established'));
});
test('adoptive parentage is not classified as biological kinship', () => {
  const g = copy();
  g.parentages.find(e => e.id === 'grace>mia').kind = 'adoptive';
  const options = relationshipsBetween(g, 'grace', 'mia').options;
  assert.ok(options.some(o => o.kind === 'adoptive'));
  assert.ok(!options.some(o => o.label === "Grace is Mia's mother" && o.kind === 'biological'));
});
test('unconnected people return insufficient-data message', () => {
  const g = copy();
  g.parentages = [];
  g.partnerships = [];
  assert.match(relationshipsBetween(g, 'emma', 'noah').message, /No connection/);
});
test('third cousins and twice-removed cousins follow ancestry depths', () => {
  const g = { people: [{ id: 'root', first: 'Root' }], parentages: [], partnerships: [] };
  for (const branch of ['a', 'b']) for (let i = 1; i <= 5; i++) {
    const id = `${branch}${i}`;
    g.people.push({ id, first: id });
    g.parentages.push({ id, parent: i === 1 ? 'root' : `${branch}${i - 1}`, child: id, kind: 'biological' });
  }
  assert.ok(labels('a4', 'b4', g).includes('Third cousins'));
  assert.ok(labels('a2', 'b4', g).includes('First cousins, twice removed'));
});
for (const [name, mutate, error] of [
  ['duplicate person', g => g.people.push(g.people[0]), /Duplicate person/],
  ['missing endpoint', g => { g.parentages[0].parent = 'missing'; }, /Missing/],
  ['self parent', g => { g.parentages[0].parent = g.parentages[0].child; }, /Self/],
  ['cycle', g => g.parentages.push({ id: 'cycle', parent: 'ava', child: 'arthur', kind: 'biological' }), /cycle/],
  ['duplicate edge', g => g.parentages.push(g.parentages[0]), /Duplicate parentage/],
]) test(`graph rejects ${name}`, () => { const g = copy(); mutate(g); assert.throws(() => validateGraph(g), error); });

test('automatic layout: 25 cards, four generations, no overlaps, no detached endpoints, no card-crossing lines', async () => {
  const layout = await layoutFamily(fixture);
  assert.equal(layout.nodes.filter(n => n.person).length, 25);
  assert.equal(new Set(layout.nodes.filter(n => n.person?.photo).map(n => n.generation)).size, 4);
  assert.equal(new Set(layout.nodes.filter(n => n.person).map(n => n.y)).size, 4);
  assert.deepEqual(inspectGeometry(layout), { overlaps: [], detached: [], crossings: [] });
  assert.equal(lineCrossovers(layout).length, 1, 'one unrelated crossing is explicitly marked with a gap');
  for (const edge of fixture.parentages) {
    assert.ok(layout.nodes.find(n => n.id === edge.parent).y < layout.nodes.find(n => n.id === edge.child).y);
  }
  for (const edge of fixture.partnerships) {
    assert.equal(layout.nodes.find(n => n.id === edge.partners[0]).y, layout.nodes.find(n => n.id === edge.partners[1]).y);
  }
  const second = await layoutFamily(fixture);
  assert.deepEqual(layout.nodes.map(n => [n.id, n.x, n.y]), second.nodes.map(n => [n.id, n.x, n.y]));
});
test('ancestor and descendant views relayout automatically without changing original records', async () => {
  for (const direction of ['ancestors', 'descendants']) {
    const view = branchView(fixture, 'emma', direction);
    assert.ok(view.people.length < 25);
    assert.deepEqual(inspectGeometry(await layoutFamily(view)), { overlaps: [], detached: [], crossings: [] });
  }
  assert.equal(fixture.people.length, 25);
});
