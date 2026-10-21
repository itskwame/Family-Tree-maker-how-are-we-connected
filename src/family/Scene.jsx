import { useEffect, useId, useState } from 'react';
import { edgePath, lineCrossovers } from './geometry.js';
import { nameOf } from './display.js';

export const INK = '#223d38', ACCENT = '#a06031';
const palette = ['#e5eee7', '#ede8df', '#e4ebee', '#f0e5de'];
export function Portrait({ person }) {
  const [failed, setFailed] = useState(false);
  const clipId = `portrait-${useId().replace(/:/g, '')}`;
  useEffect(() => setFailed(false), [person.photo]);
  const initials = (person.first?.[0]||'') + (person.last?.[0]||'');
  return <g aria-label={`${nameOf(person)} portrait`} data-portrait={person.id}>
    <circle cx="81" cy="45" r="32" fill={palette[person.id.length % palette.length]} />
    <text x="81" y="50" textAnchor="middle" fill={INK} fontFamily="Helvetica, Arial, sans-serif" fontSize="17" fontWeight="bold" data-initials={person.id}>{initials}</text>
    {person.photo && !failed && <>
      <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse"><circle cx="81" cy="45" r="32" /></clipPath></defs>
      <image data-photo={person.id} href={person.photo} x="49" y="13" width="64" height="64" preserveAspectRatio="xMidYMin slice" clipPath={`url(#${clipId})`} onError={() => setFailed(true)} />
    </>}
    <circle cx="81" cy="45" r="32" fill="none" stroke="#d2dbd2" strokeWidth="0.7" />
  </g>;
}

export function FamilyScene({ layout, selected = [], pathEdges = [], onPerson, background = '#ffffff' }) {
  const highlighted = new Set(selected), edges = new Set(pathEdges);
  return <g fontFamily="Helvetica, Arial, sans-serif">
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {layout.edges.slice().sort((a, b) => Number(a.semantic.some(id => edges.has(id))) - Number(b.semantic.some(id => edges.has(id)))).map(edge => {
        const active = edge.semantic.some(id => edges.has(id));
        return <path key={edge.id} data-edge={edge.id} data-highlighted={active || undefined} d={edgePath(edge)}
          stroke={active ? ACCENT : edge.adoptive ? '#527a99' : '#94a69f'} strokeWidth={active ? 3 : 1.5}
          data-adoptive={edge.adoptive || undefined} strokeDasharray={edge.adoptive ? '2 4' : edge.former ? '5 4' : undefined} />;
      })}
      {(layout.crossovers || lineCrossovers(layout)).map(crossing => {
        const horizontalActive = crossing.horizontal.semantic.some(id => edges.has(id));
        const front = horizontalActive ? crossing.horizontal : crossing.vertical;
        const active = front.semantic.some(id => edges.has(id));
        return <g key={`${crossing.x},${crossing.y}`} data-crossover="true">
          <circle cx={crossing.x} cy={crossing.y} r="4" fill={background} stroke="none" />
          <path d={horizontalActive ? `M${crossing.x - 4} ${crossing.y}h8` : `M${crossing.x} ${crossing.y - 4}v8`}
            stroke={active ? ACCENT : '#94a69f'} strokeWidth={active ? 3 : 1.5} />
        </g>;
      })}
    </g>
    {layout.nodes.map(node => node.person ? <g key={node.id} data-person={node.id}
      transform={`translate(${node.x} ${node.y})`}
      role={onPerson ? 'button' : undefined} tabIndex={onPerson ? 0 : undefined}
      aria-label={`${nameOf(node.person)}${node.person.born ? `, born ${node.person.born}` : ''}${node.person.died ? `, died ${node.person.died}` : ''}`}
      onClick={() => onPerson?.(node.id)}
      onKeyDown={event => { if (onPerson && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onPerson(node.id); } }}
      style={{ cursor: onPerson ? 'pointer' : 'default' }}>
      <title>{nameOf(node.person)} · {node.person.born}{node.person.died ? ` - ${node.person.died}` : ''}</title>
      <rect width={node.width} height={node.height} rx="9" fill={highlighted.has(node.id) ? '#fff5e9' : '#ffffff'}
        stroke={highlighted.has(node.id) ? ACCENT : '#ccd7d0'} strokeWidth={highlighted.has(node.id) ? 2.5 : 1} />
      <Portrait person={node.person} />
      <text x="81" y="97" textAnchor="middle" fontSize="14" fontWeight="bold" fill={INK}>{node.person.first}</text>
      <text x="81" y="113" textAnchor="middle" fontSize="12" fill="#53675f">{node.person.last}</text>
      <path d="M28 124 H134" stroke="#e4eae6" />
      <text x="81" y="140" textAnchor="middle" fontSize="11" fill="#53675f">{node.person.dateLabel ?? `${node.person.born}${node.person.died ? ` - ${node.person.died}` : ' - present'}`}</text>
      <text x="81" y="154" textAnchor="middle" fontSize="7" fill="#65786f">{node.person.familyLabel ?? (node.person.died ? 'IN MEMORY' : 'BENNETT & REED FAMILY')}</text>
    </g> : <circle key={node.id} data-junction={node.id} cx={node.x + node.width / 2} cy={node.y + node.height / 2} r="4" fill="#ffffff" stroke="#94a69f" strokeWidth="1.5" />)}
  </g>;
}

export const FORMATS = {
  roll: { label: 'Readable roll poster - 12 pt names', width: null, height: null },
  poster18: { label: '18 x 24 in - personal poster', width: 457.2, height: 609.6 },
  poster24: { label: '24 x 36 in - personal poster', width: 609.6, height: 914.4 },
  poster: { label: '30 × 18 in · wide poster', width: 762, height: 457.2 },
  a2: { label: 'A2 landscape · recommended', width: 594, height: 420 },
  a3: { label: 'A3 landscape · compact', width: 420, height: 297 },
  a4: { label: 'A4 landscape · small branches', width: 297, height: 210 },
  letter: { label: 'Letter landscape · small branches', width: 279.4, height: 215.9 },
};
export function posterSize(layout, format) {
  const paper = FORMATS[format];
  const width = Math.max(layout.width + 80, 1000, format === 'roll' ? 0 : (layout.height + 200) * paper.width / paper.height);
  const height = format === 'roll' ? layout.height + 200 : width * paper.height / paper.width;
  return { width, height, graphX: (width - layout.width) / 2, graphY: 128 + (height - 200 - layout.height) / 2 };
}
export function printNameSize(layout, format) {
  if (format === 'roll') return 12;
  const size = posterSize(layout, format), paper = FORMATS[format];
  return 14 * Math.min(paper.width / size.width, paper.height / size.height) * 72 / 25.4;
}

export function Poster({ layout, format = 'a2', title = 'Our family', svgRef, subjectId }) {
  const { width, height, graphX, graphY } = posterSize(layout, format);
  return <svg ref={svgRef} data-testid="print-svg" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`}
    width={width} height={height} data-format={format} data-subject={subjectId} data-count={layout.graph.people.length} role="img" aria-label="Minimalist printable family tree">
    <rect width={width} height={height} fill="#faf9f5" />
    <text x="40" y="40" fill="#64776d" fontSize="11" fontFamily="Helvetica, Arial, sans-serif">FAMILYCONNECT / PORTRAIT COLLECTION</text>
    <text x="40" y="87" fill={INK} fontFamily="Times, Georgia, serif" fontSize="42">{title}</text>
    <text x="41" y="116" fill="#60736a" fontFamily="Helvetica, Arial, sans-serif" fontSize="13">{layout.graph.people.length === 300 ? 'Six generations, connected.' : layout.graph.people.length === 25 ? 'Four generations, connected.' : layout.graph.people.length === 100 ? 'Five generations, connected.' : 'A family branch, connected.'} A fictional family study.</text>
    <path d={`M${width - 206} 47 H${width - 40}`} stroke="#aabbb0" />
    <text x={width - 40} y="75" textAnchor="end" fontFamily="Helvetica, Arial, sans-serif" fontSize="13" fill="#53675f">{layout.graph.people.length} PEOPLE / {new Set(layout.nodes.filter(n => n.person).map(n => n.generation)).size} GENERATIONS</text>
    <g data-print-graph="true" transform={`translate(${graphX} ${graphY})`}><FamilyScene layout={layout} selected={subjectId ? [subjectId] : []} background="#faf9f5" /></g>
    <path d={`M40 ${height - 64} H${width - 40}`} stroke="#ced8ce" />
    <g fontFamily="Helvetica, Arial, sans-serif" fontSize="11" fill="#60736a">
      <text x="40" y={height - 42}>Circles join a family. Gaps mark unrelated crossings. Dashes: former partnership; blue dots: adoption.</text>
      <text x="40" y={height - 24}>Licensed stock models portray fictional characters. Names, dates and relationships are invented.</text>
      <text x={width - 40} y={height - 42} textAnchor="end">AUTOMATIC LAYOUT / FICTIONAL DATA</text>
      <text x={width - 40} y={height - 24} textAnchor="end">FamilyConnect · Minimalist collection</text>
    </g>
  </svg>;
}
