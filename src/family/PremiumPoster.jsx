import { useEffect, useId, useState } from 'react';
import { edgePath } from './geometry.js';
import { premiumComposition } from './premium.js';

const PAPER = '#f8f5ed', INK = '#31463c', GOLD = '#a28c62', LINE = '#879486';
const arch = 'M28 142V70A60 60 0 0 1 148 70V142Z';
export function HeirloomPortrait({ person }) {
  const clipId = `arch-${useId().replace(/:/g, '')}`;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [person.photo]);
  return <g data-portrait={person.id} aria-label={`${person.first} ${person.last} portrait`}>
    <path d={arch} fill="#e5e8dd" />
    <text data-initials={person.id} x="88" y="91" textAnchor="middle" fontFamily="Times, Georgia, serif" fontSize="31" fill="#64755f">{person.first[0]}{person.last[0]}</text>
    {person.photo && !failed && <><defs><clipPath id={clipId}><path d={arch} /></clipPath></defs>
      <image data-photo={person.id} href={person.photo} x="28" y="10" width="120" height="132" preserveAspectRatio="xMidYMin slice" clipPath={`url(#${clipId})`} onError={() => setFailed(true)} />
    </>}
    <path d={arch} fill="none" stroke="#d1c6af" strokeWidth=".65" />
    <path d="M24 146V70A64 64 0 0 1 152 70V146Z" fill="none" stroke={GOLD} strokeWidth=".65" />
  </g>;
}

// Vector botanical engraving. Decoration is restricted to the page margins,
// outside the graph's measured region; it never encodes a family relationship.
function Botanical({ x, y, mirror = false, scale = 1 }) {
  return <g data-decoration="botanical" transform={`translate(${x} ${y}) scale(${mirror ? -scale : scale} ${scale})`} fill="none" stroke="#8d9a80" strokeWidth=".8" strokeLinecap="round">
    <path d="M0 128 C8 94 27 51 66 0 M9 100 Q-2 72 -13 64 M20 77 Q45 65 55 43 M34 52 Q26 29 30 17 M47 29 Q69 27 79 10" />
    {[[9,100,-35],[20,77,48],[34,52,-30],[47,29,52],[2,120,-40]].map(([a,b,r],i) => <g key={i} transform={`translate(${a} ${b}) rotate(${r})`}>
      <path d="M0 0 C-18 -12 -16 -32 -6 -40 C6 -28 8 -12 0 0 Z" fill="#dce1d2" />
      <path d="M0 0 Q-4 -18 -6 -35" />
    </g>)}
    <path d="M66 0 Q64 15 56 20 Q52 9 66 0Z" fill="#dce1d2" />
  </g>;
}

export function PremiumPoster({ layout, format, svgRef }) {
  const c = premiumComposition(layout, format);
  const connectedPorts = new Set(layout.edges.flatMap(edge => [...edge.sources, ...edge.targets]));
  const { width, height, scale, x, y } = c;
  return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`} width={width} height={height}
    data-testid="print-svg" data-template="botanical" data-format={format} data-count={layout.graph.people.length}
    data-paper-width={c.paper.width} data-paper-height={c.paper.height} data-name-pt={c.firstNamePt} data-readable={c.readable}
    role="img" aria-label="Botanical heirloom portrait family tree">
    <rect width={width} height={height} fill={PAPER} />
    <rect x="24" y="24" width={width-48} height={height-48} fill="none" stroke={GOLD} strokeWidth=".65" />
    <rect x="31" y="31" width={width-62} height={height-62} fill="none" stroke="#d1c6af" strokeWidth=".45" />
    <Botanical x={72} y={52} scale={c.landscape ? .7 : .9} /><Botanical x={width-72} y={52} mirror scale={c.landscape ? .7 : .9} />
    <g fontFamily="Times, Georgia, serif" textAnchor="middle" fill={INK}>
      <text x={width/2} y={c.landscape ? 60 : 69} fontFamily="Helvetica, Arial, sans-serif" fontSize="10">THE BOTANICAL HEIRLOOM</text>
      <text x={width/2} y={c.landscape ? 113 : 133} fontSize={c.landscape ? 52 : 60} fontStyle="italic">Our family</text>
      <text x={width/2} y={c.landscape ? 143 : 168} fontSize="19">The Bennett &amp; Reed family</text>
      <path d={`M${width/2-72} ${c.landscape ? 163 : 193}h56 m32 0h56`} stroke={GOLD} strokeWidth=".7" />
      <path d={`M${width/2} ${c.landscape ? 158 : 188}l5 5-5 5-5-5Z`} fill="none" stroke={GOLD} strokeWidth=".7" />
    </g>
    <g data-print-graph="true" transform={`translate(${x} ${y}) scale(${scale})`}>
      <g fill="none" stroke={LINE} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {layout.edges.map(edge => <path key={edge.id} data-edge={edge.id} d={edgePath(edge)} data-adoptive={edge.adoptive || undefined}
          stroke={edge.adoptive ? '#527a99' : LINE} strokeDasharray={edge.adoptive ? '2 4' : edge.former ? '5 4' : undefined} />)}
        {layout.crossovers.map(crossing => <g key={`${crossing.x},${crossing.y}`} data-crossover="true">
          <circle cx={crossing.x} cy={crossing.y} r="4" fill={PAPER} stroke="none" />
          <path d={`M${crossing.x} ${crossing.y-4}v8`} stroke={crossing.vertical.adoptive ? '#527a99' : LINE} />
        </g>)}
      </g>
      {layout.nodes.map(node => node.person ? <g key={node.id} data-person={node.id} transform={`translate(${node.x} ${node.y})`}>
        <rect data-card-bounds="true" width={node.width} height={node.height} fill={PAPER} />
        {node.ports.filter(port => connectedPorts.has(port.id)).map(port => <path key={port.id} d={`M${port.x} ${port.y}v${port.y === 0 ? 6 : -3}`} stroke={LINE} strokeWidth="1.25" />)}
        <HeirloomPortrait person={node.person} />
        <g textAnchor="middle" fill={INK} fontFamily="Times, Georgia, serif">
          <text data-name="first" x="88" y="166" fontSize="20">{node.person.first}</text>
          <text data-name="last" x="88" y="185" fontSize="14">{node.person.last}</text>
          <text x="88" y="200" fontFamily="Helvetica, Arial, sans-serif" fontSize="11" fill="#667264">{node.person.born}{node.person.died ? ` - ${node.person.died}` : ''}</text>
        </g>
      </g> : <circle key={node.id} data-junction={node.id} cx={node.x+node.width/2} cy={node.y+node.height/2} r="3.5" fill={PAPER} stroke={GOLD} strokeWidth="1" />)}
    </g>
    <g textAnchor="middle" fill="#667264" fontFamily="Helvetica, Arial, sans-serif">
      <text x={width/2} y={height-66} fontFamily="Times, Georgia, serif" fontSize="16" fontStyle="italic">Connected through generations</text>
      <text x={width/2} y={height-47} fontSize="8.5">Circles join a family · Dashed lines: former partnership · Blue dots: adoption · Gaps: unrelated crossings</text>
    </g>
  </svg>;
}
