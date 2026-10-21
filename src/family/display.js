// Production-safe presentation helpers must not import a demonstration graph.
export const nameOf=person=>`${person.first||''} ${person.last||''}`.trim();
