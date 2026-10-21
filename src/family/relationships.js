import { shortestConnection, validateGraph, adjacency } from './graph.js';

const ordinal = n => ({ 1: 'first', 2: 'second', 3: 'third' }[n] || `${n}th`);
const gendered = (p, male, female, neutral) => p.gender === 'male' ? male : p.gender === 'female' ? female : neutral;
function ancestorLabel(distance, person, down = false) {
  const base = down ? gendered(person, 'son', 'daughter', 'child') : gendered(person, 'father', 'mother', 'parent');
  if (distance === 1) return base;
  const grand = down ? gendered(person, 'grandson', 'granddaughter', 'grandchild') : gendered(person, 'grandfather', 'grandmother', 'grandparent');
  return `${'great-'.repeat(distance - 2)}${grand}`;
}

function ancestry(graph, start, index) {
  if (index?.ancestors.has(start)) return index.ancestors.get(start);
  const result = new Map();
  function walk(id, path, edges) {
    const entries = result.get(id) || [];
    entries.push({ path, edges });
    result.set(id, entries);
    for (const edge of index ? index.parents.get(id) : graph.parentages.filter(e => e.child === id && e.kind === 'biological')) {
      walk(edge.parent, [...path, edge.parent], [...edges, edge.id]);
    }
  }
  walk(start, [start], []);
  index?.ancestors.set(start, result);
  return result;
}

// The finder owns an immutable snapshot: callers may safely edit their source graph.
export function createRelationshipFinder(source) {
  const graph = structuredClone(source);
  validateGraph(graph);
  const index = { ancestors: new Map(), parents: new Map(graph.people.map(p => [p.id, []])), adj: adjacency(graph) };
  for (const edge of graph.parentages) if (edge.kind === 'biological') index.parents.get(edge.child).push(edge);
  return (start, end) => relationshipsBetween(graph, start, end, index);
}
export function relationshipsBetween(graph, start, end, index) {
  if (!index) validateGraph(graph);
  const a = graph.people.find(p => p.id === start), b = graph.people.find(p => p.id === end);
  if (!a || !b) return { options: [], message: 'Select two people in this family.' };
  if (start === end) return { options: [{ label: 'Same person', kind: 'identity', path: [start], edges: [] }] };
  const aa = ancestry(graph, start, index), ba = ancestry(graph, end, index), options = [];
  for (const [ancestor, aPaths] of aa) {
    for (const ap of aPaths) for (const bp of ba.get(ancestor) || []) {
      // Exclude walks sharing an ancestor below this junction.
      if (ap.path.slice(0, -1).some(id => bp.path.slice(0, -1).includes(id))) continue;
      const da = ap.edges.length, db = bp.edges.length;
      let label;
      if (da === 0) label = `${a.first} is ${b.first}'s ${ancestorLabel(db, a)}`;
      else if (db === 0) label = `${a.first} is ${b.first}'s ${ancestorLabel(da, a, true)}`;
      else if (da === 1 && db === 1) {
        const pa = graph.parentages.filter(e => e.child === start && e.kind === 'biological').map(e => e.parent);
        const pb = graph.parentages.filter(e => e.child === end && e.kind === 'biological').map(e => e.parent);
        const shared = pa.filter(id => pb.includes(id)).length;
        label = shared >= 2 ? 'Full siblings' : a.biologicalParentsComplete && b.biologicalParentsComplete
          ? 'Half-siblings' : 'Siblings; full or half is not established';
      } else if (da === 1) label = `${a.first} is ${b.first}'s ${'great-'.repeat(db - 2)}${gendered(a, 'uncle', 'aunt', 'parent’s sibling')}`;
      else if (db === 1) label = `${a.first} is ${b.first}'s ${'great-'.repeat(da - 2)}${gendered(a, 'nephew', 'niece', 'sibling’s child')}`;
      else {
        const removed = Math.abs(da - db);
        label = `${ordinal(Math.min(da, db) - 1)} cousins${removed ? `, ${removed === 1 ? 'once' : removed === 2 ? 'twice' : `${removed} times`} removed` : ''}`;
        label = label[0].toUpperCase() + label.slice(1);
      }
      options.push({ label, kind: 'biological', ancestor, path: [...ap.path, ...bp.path.slice(0, -1).reverse()], edges: [...ap.edges, ...bp.edges.slice().reverse()] });
    }
  }
  const partnership = graph.partnerships.find(u => u.partners.includes(start) && u.partners.includes(end));
  if (partnership) options.push({
    label: partnership.status === 'former' ? (partnership.kind === 'marriage' ? 'Former spouses' : 'Former partners') : (partnership.kind === 'marriage' ? 'Spouses' : 'Partners'),
    kind: 'partnership', path: [start, end], edges: [partnership.id],
  });
  const connection = shortestConnection(graph, start, end, undefined, index?.adj);
  if (connection && !options.some(o => o.edges.length === connection.edges.length && o.edges.every(e => connection.edges.includes(e)))) {
    const containsPartner = connection.edges.some(id => graph.partnerships.some(u => u.id === id));
    const containsAdoption = connection.edges.some(id => graph.parentages.some(e => e.id === id && e.kind === 'adoptive'));
    if (containsPartner || containsAdoption) options.push({
      ...connection, kind: containsAdoption ? 'adoptive' : 'affinity',
      label: containsAdoption ? 'Connection through adoptive parentage' : 'Connection through partnership',
    });
  }
  options.sort((x, y) => (x.kind === 'biological' ? 0 : 1) - (y.kind === 'biological' ? 0 : 1) || x.edges.length - y.edges.length || (x.ancestor || '').localeCompare(y.ancestor || ''));
  return { options, message: options.length ? '' : 'No connection is established in the available data.' };
}
