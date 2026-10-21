import { lineCrossovers } from './geometry.js';
export { edgePoints, edgePath, lineCrossovers, inspectGeometry } from './geometry.js';
import { validateGraph } from './graph.js';

export const CARD = { width: 162, height: 164 };
let nodeEngine;
async function defaultEngine() {
  if (!nodeEngine) { const { default: ELK } = await import('elkjs/lib/elk.bundled.js'); nodeEngine = new ELK(); }
  return nodeEngine;
}

function generations(graph) {
  // Partnership components share a generation unless that contradicts ancestry.
  const owner = new Map(graph.people.map(p => [p.id, p.id]));
  const find = id => owner.get(id) === id ? id : find(owner.get(id));
  for (const union of graph.partnerships) owner.set(find(union.partners[1]), find(union.partners[0]));
  const ranks = new Map(graph.people.map(p => [find(p.id), 0]));
  for (const edge of graph.parentages) {
    if (find(edge.parent) === find(edge.child)) throw new Error('This family requires cross-generation partnership layout; it is not supported by this prototype.');
  }
  for (let i = 0; i <= graph.people.length; i++) {
    let changed = false;
    for (const edge of graph.parentages) {
      const parent = find(edge.parent), child = find(edge.child);
      if (ranks.get(child) <= ranks.get(parent)) {
        ranks.set(child, ranks.get(parent) + 1);
        changed = true;
      }
    }
    if (!changed) return new Map(graph.people.map(p => [p.id, ranks.get(find(p.id))]));
  }
  throw new Error('Conflicting generation constraints');
}

export function familyJunctions(graph) {
  const groups = new Map();
  for (const union of graph.partnerships) {
    const key = union.partners.slice().sort().join('|');
    groups.set(key, { id: `junction:union:${union.id}`, parents: union.partners, children: [], partnership: union.id, status: union.status });
  }
  for (const child of graph.people) {
    const edges = graph.parentages.filter(e => e.child === child.id);
    if (!edges.length) continue;
    const parents = [...new Set(edges.map(e => e.parent))].sort(), key = parents.join('|');
    if (!groups.has(key)) groups.set(key, { id: `junction:parents:${key}`, parents, children: [] });
    groups.get(key).children.push({ id: child.id, edges });
  }
  return [...groups.values()];
}

export async function layoutFamily(graph, engine, options = {}) {
  const started = performance.now();
  validateGraph(graph);
  const elk = engine || await defaultEngine();
  const ranks = generations(graph), junctions = familyJunctions(graph);
  const card = options.profile === 'premium' ? { width: 176, height: 208 } : CARD;
  const children = graph.people.map(person => ({
    id: person.id, width: card.width, height: card.height,
    layoutOptions: { 'elk.partitioning.partition': String(ranks.get(person.id) * 2), 'elk.portConstraints': 'FIXED_SIDE' },
    ports: [
      { id: `${person.id}:in`, width: 0, height: 0, layoutOptions: { 'elk.port.side': 'NORTH' } },
      ...junctions.filter(j => j.parents.includes(person.id)).map(j => ({
        id: `${person.id}:${j.id}`, width: 0, height: 0, layoutOptions: { 'elk.port.side': 'SOUTH' },
      })),
    ],
  }));
  const edges = [];
  for (const junction of junctions) {
    children.push({
      id: junction.id, width: 8, height: 8,
      layoutOptions: { 'elk.partitioning.partition': String(Math.max(...junction.parents.map(id => ranks.get(id))) * 2 + 1), 'elk.portConstraints': 'FIXED_POS' },
      ports: [
        { id: `${junction.id}:in`, x: 4, y: 0, width: 0, height: 0 },
        { id: `${junction.id}:out`, x: 4, y: 8, width: 0, height: 0 },
      ],
    });
    for (const parent of junction.parents) edges.push({
      id: `${junction.id}:from:${parent}`,
      sources: [`${parent}:${junction.id}`], targets: [`${junction.id}:in`],
      semantic: [...junction.children.flatMap(c => c.edges.filter(e => e.parent === parent).map(e => e.id)), ...(junction.partnership ? [junction.partnership] : [])],
      role: 'parent', former: junction.status === 'former',
    });
    for (const child of junction.children) edges.push({
      id: `${junction.id}:to:${child.id}`, sources: [`${junction.id}:out`], targets: [`${child.id}:in`],
      semantic: child.edges.map(e => e.id), role: 'child', adoptive: child.edges.some(e => e.kind === 'adoptive'),
    });
  }
  const result = await elk.layout({
    id: 'family', children, edges,
    layoutOptions: {
      'elk.algorithm': 'layered', 'elk.direction': 'DOWN',
      'elk.partitioning.activate': 'true', 'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': '32', 'elk.layered.spacing.nodeNodeBetweenLayers': options.profile === 'premium' ? '22' : '32',
      'elk.layered.spacing.edgeNodeBetweenLayers': '20', 'elk.spacing.edgeNode': '16',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.randomSeed': '17', 'elk.padding': '[top=24,left=24,bottom=24,right=24]',
      ...(options.profile === 'premium' ? { 'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED' } : {}),
    },
  });
  const nodes = result.children.map(node => ({
    ...node, person: graph.people.find(p => p.id === node.id),
    generation: ranks.get(node.id),
  }));
  const layout = {
    nodes, edges: result.edges.map(e => ({ ...e, ...edges.find(original => original.id === e.id) })),
    width: result.width, height: result.height, graph, layoutMs: performance.now() - started,
  };
  layout.crossovers = lineCrossovers(layout);
  layout.layoutMs = performance.now() - started;
  return layout;
}
