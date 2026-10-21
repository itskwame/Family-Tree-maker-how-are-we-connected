export function edgePoints(edge) {
  return edge.sections.flatMap(section => [section.startPoint, ...(section.bendPoints || []), section.endPoint]);
}
export function edgePath(edge) {
  return edge.sections.map(section => [section.startPoint, ...(section.bendPoints || []), section.endPoint]
    .map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')).join(' ');
}

// Crossovers are derived from routed geometry, never stored per person/edge.
// Edges belonging to the same junction intentionally share a family bus.
export function lineCrossovers(layout) {
  const result = new Map();
  for (let i = 0; i < layout.edges.length; i++) for (let j = i + 1; j < layout.edges.length; j++) {
    const a = layout.edges[i], b = layout.edges[j];
    if (a.id.split(/:from:|:to:/)[0] === b.id.split(/:from:|:to:/)[0]) continue;
    const ap = edgePoints(a), bp = edgePoints(b);
    for (let ai = 1; ai < ap.length; ai++) for (let bi = 1; bi < bp.length; bi++) {
      for (const [h1, h2, v1, v2, horizontal, vertical] of [
        [ap[ai - 1], ap[ai], bp[bi - 1], bp[bi], a, b],
        [bp[bi - 1], bp[bi], ap[ai - 1], ap[ai], b, a],
      ]) {
        if (h1.y !== h2.y || v1.x !== v2.x) continue;
        if (v1.x > Math.min(h1.x, h2.x) && v1.x < Math.max(h1.x, h2.x) &&
            h1.y > Math.min(v1.y, v2.y) && h1.y < Math.max(v1.y, v2.y)) {
          result.set(`${v1.x},${h1.y}`, { x: v1.x, y: h1.y, horizontal, vertical });
        }
      }
    }
  }
  return [...result.values()];
}

export function inspectGeometry(layout) {
  const cards = layout.nodes.filter(n => n.person), overlaps = [], detached = [], crossings = [];
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
    const a = cards[i], b = cards[j];
    if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) overlaps.push([a.id, b.id]);
  }
  const ports = new Map(layout.nodes.flatMap(n => (n.ports || []).map(p => [p.id, { x: n.x + p.x, y: n.y + p.y }])));
  for (const edge of layout.edges) {
    const points = edgePoints(edge);
    for (const [actual, expected] of [[points[0], ports.get(edge.sources[0])], [points.at(-1), ports.get(edge.targets[0])]]) {
      if (!actual || !expected || Math.hypot(actual.x - expected.x, actual.y - expected.y) > 0.01) detached.push(edge.id);
    }
    for (let i = 1; i < points.length; i++) for (const card of cards) {
      const a = points[i - 1], b = points[i], inset = 0.1;
      const vertical = a.x === b.x && a.x > card.x + inset && a.x < card.x + card.width - inset &&
        Math.max(a.y, b.y) > card.y + inset && Math.min(a.y, b.y) < card.y + card.height - inset;
      const horizontal = a.y === b.y && a.y > card.y + inset && a.y < card.y + card.height - inset &&
        Math.max(a.x, b.x) > card.x + inset && Math.min(a.x, b.x) < card.x + card.width - inset;
      if (vertical || horizontal) crossings.push([edge.id, card.id]);
    }
  }
  return { overlaps, detached, crossings };
}
