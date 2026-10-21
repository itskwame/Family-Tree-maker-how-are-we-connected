import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { premiumSamples, premiumComposition } from '../../src/family/premium.js';
import { layoutFamily } from '../../src/family/layout.js';
import { validateGraph } from '../../src/family/graph.js';
import { relationshipsBetween } from '../../src/family/relationships.js';
import { audit } from './geometry-audit.mjs';

for (const [count, graph] of Object.entries(premiumSamples)) test(`premium ${count}: unique people, unchanged relationships, automatic geometry and page limits`, async () => {
  validateGraph(graph); assert.equal(graph.people.length, Number(count));
  const before = JSON.stringify(graph);
  const layout = await layoutFamily(graph, undefined, { profile: 'premium' });
  audit(layout);
  assert.equal(new Set(layout.nodes.filter(n=>n.person).map(n=>n.id)).size, Number(count));
  assert.equal(JSON.stringify(graph), before);
  assert.equal(relationshipsBetween(graph, 'emma', 'ava').options[0].label, "Emma is Ava's mother");
  const formats = Object.fromEntries(['poster18','poster24'].map(format => {
    const c = premiumComposition(layout, format);
    assert.ok(c.x >= 76 && c.y >= c.top);
    assert.ok(c.x + layout.width*c.scale <= c.width-76+.001);
    assert.ok(c.y + layout.height*c.scale <= c.height-c.bottom+.001);
    return [format, c];
  }));
  assert.ok(formats.poster24.readable, `${count} requires larger than 24 x 36`);
  await fs.mkdir('output/phase5', { recursive: true });
  await fs.writeFile(`output/phase5/layout-${count}.json`, JSON.stringify({ graph, layout, formats }, null, 2));
});
