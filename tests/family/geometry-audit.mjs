import assert from 'node:assert/strict';
import { edgePoints, inspectGeometry } from '../../src/family/geometry.js';
export function audit(layout) {
  assert.deepEqual(inspectGeometry(layout), { overlaps: [], detached: [], crossings: [] });
  assert.equal(new Set(layout.nodes.map(n => n.id)).size, layout.nodes.length);
  assert.equal(new Set(layout.edges.map(e => e.id)).size, layout.edges.length);
  const ports = layout.nodes.flatMap(n => n.ports || []);
  assert.equal(new Set(ports.map(p => p.id)).size, ports.length);
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
  return { unrelatedOverlaps, unrelatedTouches };
}
