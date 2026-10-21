export function validateGraph(graph) {
  const ids = new Set(graph.people.map(p => p.id));
  if (ids.size !== graph.people.length) throw new Error('Duplicate person ID');
  const seen = new Set();
  for (const edge of graph.parentages) {
    if (!ids.has(edge.parent) || !ids.has(edge.child)) throw new Error('Missing parentage endpoint');
    if (edge.parent === edge.child) throw new Error('Self parentage');
    if (!['biological', 'adoptive'].includes(edge.kind)) throw new Error('Unknown parentage type');
    const key = `${edge.parent}>${edge.child}:${edge.kind}`;
    if (seen.has(key)) throw new Error('Duplicate parentage');
    seen.add(key);
  }
  const allEdgeIds = [...graph.parentages.map(e => e.id), ...graph.partnerships.map(e => e.id)];
  if (new Set(allEdgeIds).size !== allEdgeIds.length) throw new Error('Duplicate relationship ID');
  const partnerPairs = new Set();
  for (const union of graph.partnerships) {
    if (union.partners.length !== 2 || new Set(union.partners).size !== 2 ||
      union.partners.some(id => !ids.has(id))) throw new Error('Invalid partnership');
    const pair = JSON.stringify(union.partners.slice().sort());
    if (partnerPairs.has(pair)) throw new Error('Duplicate partnership pair; merge events into one relationship before layout');
    partnerPairs.add(pair);
  }
  const active = new Set(), done = new Set();
  function visit(id) {
    if (active.has(id)) throw new Error('Ancestry cycle');
    if (done.has(id)) return;
    active.add(id);
    graph.parentages.filter(e => e.parent === id).forEach(e => visit(e.child));
    active.delete(id);
    done.add(id);
  }
  ids.forEach(visit);
  return graph;
}

export function adjacency(graph, predicate = () => true) {
  const result = new Map(graph.people.map(p => [p.id, []]));
  const edges = [
    ...graph.parentages.map(e => ({ ...e, from: e.parent, to: e.child })),
    ...graph.partnerships.map(e => ({ ...e, from: e.partners[0], to: e.partners[1], kind: 'partnership' })),
  ];
  for (const edge of edges.filter(predicate)) {
    result.get(edge.from).push({ to: edge.to, edge });
    result.get(edge.to).push({ to: edge.from, edge });
  }
  return result;
}

export function shortestConnection(graph, start, end, predicate, cachedAdjacency) {
  const adj = cachedAdjacency || adjacency(graph, predicate);
  const queue = [{ path: [start], edges: [] }], seen = new Set([start]);
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i], at = item.path.at(-1);
    if (at === end) return item;
    for (const { to, edge } of adj.get(at) || []) {
      if (!seen.has(to)) {
        seen.add(to);
        queue.push({ path: [...item.path, to], edges: [...item.edges, edge.id] });
      }
    }
  }
  return null;
}

// A selected branch is a view, never a mutation of the canonical graph.
export function branchView(graph, root, direction = 'descendants') {
  if (!root) return graph;
  const selected = new Set([root]), queue = [root];
  for (let i = 0; i < queue.length; i++) {
    for (const edge of graph.parentages) {
      const from = direction === 'ancestors' ? edge.child : edge.parent;
      const to = direction === 'ancestors' ? edge.parent : edge.child;
      if (from === queue[i] && !selected.has(to)) { selected.add(to); queue.push(to); }
    }
  }
  // Include partners for context, without recursively importing their branches.
  for (const union of graph.partnerships) {
    if (union.partners.some(id => queue.includes(id))) union.partners.forEach(id => selected.add(id));
  }
  return {
    people: graph.people.filter(p => selected.has(p.id)),
    parentages: graph.parentages.filter(e => selected.has(e.parent) && selected.has(e.child)),
    partnerships: graph.partnerships.filter(u => u.partners.every(id => selected.has(id))),
  };
}

// Ancestor and descendant walks are independent. Do not pull in every cousin
// descending from an included ancestor. Partners are context, not new walk roots.
export function personalBranch(graph, root, ancestorDepth = 1, descendantDepth = 1) {
  if (!root) return graph;
  if (!graph.people.some(p => p.id === root)) throw new Error('Unknown branch root');
  for (const depth of [ancestorDepth, descendantDepth]) if (!Number.isInteger(depth) || depth < 0 || depth > 8) throw new Error('Generation depth must be between 0 and 8');
  const selected = new Set([root]);
  for (const [up, depth] of [[true, ancestorDepth], [false, descendantDepth]]) {
    let level = new Set([root]);
    for (let n = 0; n < depth; n++) {
      const next = new Set();
      for (const edge of graph.parentages) if (level.has(up ? edge.child : edge.parent)) next.add(up ? edge.parent : edge.child);
      next.forEach(id => selected.add(id)); level = next;
    }
  }
  const roots = new Set(selected);
  for (const union of graph.partnerships) if (union.partners.some(id => roots.has(id))) union.partners.forEach(id => selected.add(id));
  return { people: graph.people.filter(p => selected.has(p.id)), parentages: graph.parentages.filter(e => selected.has(e.parent) && selected.has(e.child)), partnerships: graph.partnerships.filter(u => u.partners.every(id => selected.has(id))) };
}
