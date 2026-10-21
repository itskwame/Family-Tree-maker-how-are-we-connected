import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { fixture as fixture25, nameOf } from './fixture.js';
import { fixture100 } from './fixture100.js';
import { fixture300 } from './fixture300.js';
import { branchView, personalBranch } from './graph.js';
import { startLayout } from './layout-client.js';
import { createRelationshipFinder } from './relationships.js';
import { FamilyScene, Poster, FORMATS, printNameSize } from './Scene.jsx';
import { exportPDF, exportSVG, exportPNG } from './export.js';
import { PremiumPoster } from './PremiumPoster.jsx';
import { premiumComposition } from './premium.js';
import { premiumSamples } from './premium-samples.js';
import './prototype.css';

const InteractiveTree = memo(function InteractiveTree({ layout, path, onPerson, focus, activePerson }) {
  const svg = useRef(), group = useRef(), controller = useRef();
  const focusOn = id => {
    const node = layout.nodes.find(n => n.id === id && n.person);
    if (!node || !svg.current || !controller.current) return;
    const { width, height } = svg.current.getBoundingClientRect();
    const scale = Math.min(1.2, (width - 64) / node.width);
    select(svg.current).call(controller.current.transform, zoomIdentity.translate(width / 2 - (node.x + node.width / 2) * scale, height / 2 - (node.y + node.height / 2) * scale).scale(scale));
  };
  const fit = (overview = false) => {
    if (!svg.current || !controller.current) return;
    const { width, height } = svg.current.getBoundingClientRect();
    const scale = Math.min((width - 44) / layout.width, (height - 44) / layout.height, 1.2);
    if (!overview && width < 650 && scale < 0.8 && layout.graph.people.length > 6) {
      focusOn(focus?.id || activePerson || layout.graph.people[0]?.id);
      return;
    }
    select(svg.current).call(controller.current.transform, zoomIdentity.translate((width - layout.width * scale) / 2, (height - layout.height * scale) / 2).scale(scale));
  };
  const fitConnection = () => {
    const nodes = layout.nodes.filter(n => path?.path.includes(n.id));
    if (!nodes.length) return;
    const left = Math.min(...nodes.map(n => n.x)), top = Math.min(...nodes.map(n => n.y));
    const right = Math.max(...nodes.map(n => n.x + n.width)), bottom = Math.max(...nodes.map(n => n.y + n.height));
    const { width, height } = svg.current.getBoundingClientRect();
    const scale = Math.min((width - 60) / (right - left), (height - 100) / (bottom - top), 1.2);
    select(svg.current).call(controller.current.transform, zoomIdentity.translate(width / 2 - (left + right) * scale / 2, height / 2 - (top + bottom) * scale / 2).scale(scale));
  };
  useEffect(() => {
    controller.current = zoom().scaleExtent([0.03, 2.5]).on('zoom', event => {
      select(group.current).attr('transform', event.transform);
    });
    select(svg.current).call(controller.current).on('dblclick.zoom', null);
    const element = svg.current;
    let disposed = false;
    let previous = element.getBoundingClientRect();
    const observer = new ResizeObserver(() => {
      if (disposed || !element.isConnected) return;
      const next = element.getBoundingClientRect();
      if (next.width === previous.width && next.height === previous.height) return;
      // Preserve the user's zoom and world-space center during resize, including
      // browser screenshot/scrollbar changes. Only a new layout gets an auto-fit.
      const t = zoomTransform(svg.current);
      const cx = (previous.width / 2 - t.x) / t.k, cy = (previous.height / 2 - t.y) / t.k;
      select(svg.current).call(controller.current.transform, zoomIdentity.translate(next.width / 2 - cx * t.k, next.height / 2 - cy * t.k).scale(t.k));
      previous = next;
    });
    observer.observe(svg.current);
    fit();
    return () => { disposed = true; observer.disconnect(); select(element).on('.zoom', null); };
  }, [layout]);
  useEffect(() => {
    if (focus?.id) focusOn(focus.id);
  }, [focus, layout]);
  return <div className="fc-canvas">
    <div className="fc-canvas-label">BENNETT & REED <span> / </span> FAMILY NETWORK<span className="fc-mobile-hint">Drag to explore · Pinch to zoom · Fit tree for overview</span></div>
    <svg ref={svg} data-testid="interactive-tree" aria-label="Interactive family tree. Drag to pan, scroll to zoom." role="group">
      <g ref={group}><FamilyScene layout={layout} selected={path?.path || []} pathEdges={path?.edges || []} onPerson={onPerson} /></g>
    </svg>
    <div className="fc-zoom" aria-label="Tree navigation">
      <button aria-label="Zoom out" onClick={() => select(svg.current).call(controller.current.scaleBy, 0.8)}>−</button>
      <button onClick={() => fit(true)}>Fit tree</button>
      {path && <button onClick={fitConnection}>Fit connection</button>}
      <button aria-label="Zoom in" onClick={() => select(svg.current).call(controller.current.scaleBy, 1.25)}>+</button>
    </div>
    <span className="fc-drag-hint">Drag to explore · Scroll to zoom</span>
  </div>;
});

export default function FamilyPrototype() {
  const size = new URLSearchParams(window.location.search).get('family');
  const premiumStart = new URLSearchParams(window.location.search).get('template') === 'botanical';
  const [template, setTemplate] = useState(premiumStart ? 'botanical' : 'minimalist');
  const [sample, setSample] = useState('11');
  const [premiumLayout, setPremiumLayout] = useState(null);
  const [premiumError, setPremiumError] = useState('');
  const phase4 = size === '300', phase3 = size === '100' || phase4;
  const fixture = phase4 ? fixture300 : phase3 ? fixture100 : fixture25;
  const mobile = () => window.matchMedia('(max-width:650px)').matches;
  const initialBranch = phase3 && mobile() ? 'emma' : '';
  const [layout, setLayout] = useState(null), [error, setError] = useState('');
  const [mode, setMode] = useState(premiumStart ? 'print' : 'explore'), [format, setFormat] = useState(premiumStart ? 'poster18' : phase3 ? 'roll' : 'a2');
  const [a, setA] = useState('emma'), [b, setB] = useState('sophie'), [showPath, setShowPath] = useState(false);
  const [option, setOption] = useState(0), [query, setQuery] = useState(''), [focus, setFocus] = useState(null);
  const [branch, setBranch] = useState(initialBranch), [direction, setDirection] = useState(phase4 ? 'personal' : 'descendants');
  const [ancestorDepth, setAncestorDepth] = useState(0), [descendantDepth, setDescendantDepth] = useState(1);
  const [exporting, setExporting] = useState(false);
  const poster = useRef();
  const graph = useMemo(() => direction === 'personal' ? personalBranch(fixture, branch, ancestorDepth, descendantDepth) : branchView(fixture, branch, direction), [fixture, branch, direction, ancestorDepth, descendantDepth]);
  const premiumGraph = sample === 'current' ? graph : premiumSamples[sample];
  useEffect(() => {
    if (mode !== 'print' || template !== 'botanical') return;
    let active = true;
    setPremiumLayout(null); setPremiumError('');
    const operation = startLayout(premiumGraph, { profile: 'premium' });
    operation.promise.then(value => { if (active) setPremiumLayout(value); }).catch(e => { if (active && e.name !== 'AbortError') setPremiumError(e.message); });
    return () => { active = false; operation.cancel(); };
  }, [premiumGraph, mode, template]);
  const premium = template === 'botanical';
  const composition = premiumLayout ? premiumComposition(premiumLayout, format) : null;
  const exportAllowed = premium ? !!composition?.readable : layout && printNameSize(layout, format) >= 9;
  const selectPerson = useCallback(id => { setA(id); setShowPath(false); setOption(0); }, []);
  useEffect(() => {
    let active = true;
    setLayout(null); setError('');
    const operation = startLayout(graph);
    operation.promise.then(value => { if (active) {
      const layoutReadyAt = performance.now();
      setLayout(value);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (active) window.__familyMetrics = { people: graph.people.length, layoutMs: value.layoutMs, workerWallMs: value.workerWallMs, renderToPaintMs: performance.now() - layoutReadyAt, readyMs: performance.now(), heapBytes: performance.memory?.usedJSHeapSize ?? null };
      }));
    } }).catch(e => { if (active && e.name !== 'AbortError') setError(e.message); });
    return () => { active = false; operation.cancel(); };
  }, [graph]);
  const findRelationship = useMemo(() => createRelationshipFinder(fixture), [fixture]);
  const result = useMemo(() => findRelationship(a, b), [findRelationship, a, b]);
  const path = showPath ? result.options[option] : undefined;
  const people = fixture.people.slice().sort((x, y) => nameOf(x).localeCompare(nameOf(y)));
  const matches = query ? people.filter(p => nameOf(p).toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];
  const changePerson = (setter, value) => { setter(value); setOption(0); setShowPath(false); };
  const personSelect = (label, value, setter) => <label>{label}<select aria-label={label} value={value} onChange={e => changePerson(setter, e.target.value)}>{people.map(p => <option key={p.id} value={p.id}>{nameOf(p)}</option>)}</select></label>;
  async function saveExport(type) {
    setExporting(true); setError('');
    try {
      if (type === 'pdf') await exportPDF(poster.current, format);
      else if (type === 'png') await exportPNG(poster.current, format);
      else await exportSVG(poster.current);
    } catch (e) { setError(`${type.toUpperCase()} export failed: ${e.message}`); } finally { setExporting(false); }
  }
  return <div className="fc-app">
    <header className="fc-topbar">
      <a className="fc-brand" href="#/"><span className="fc-brand-mark">F</span>FamilyConnect</a>
      <span className="fc-prototype-badge">FICTIONAL FAMILY · {mode === 'print' && premium ? 'PHASE 5' : phase4 ? 'PHASE 4' : phase3 ? 'PHASE 3' : 'PHASE 2B'}</span>
      <a href="#/" className="fc-back">Back to home ↗</a>
    </header>
    <main>
      <div className="fc-heading">
        <div><p className="fc-kicker">EVERY CONNECTION HAS A STORY</p><h1>The Bennett & Reed family</h1><p className="fc-subtitle">{phase4 ? 'Six generations. Many branches. One connected family.' : phase3 ? 'Five generations. Many branches. One connected family.' : 'Four generations. Many branches. One connected family.'}</p></div>
        <div className="fc-stats"><strong>{fixture.people.length}<span>people</span></strong><strong>{phase4 ? 6 : phase3 ? 5 : 4}<span>generations</span></strong><strong>{fixture.partnerships.length}<span>partnerships</span></strong></div>
      </div>
      <div className="fc-workspace-bar">
        <div className="fc-tabs" aria-label="Tree view">
          <button className={mode === 'explore' ? 'active' : ''} onClick={() => setMode('explore')}>Explore family</button>
          <button className={mode === 'print' ? 'active' : ''} onClick={() => setMode('print')}>Print studio</button>
        </div>
        <div className="fc-search">
          <input aria-label="Search people" placeholder={`Search ${fixture.people.length} family members…`} value={query} onChange={e => setQuery(e.target.value)} />
          {query && <div className="fc-search-results">{matches.length ? matches.map(p => <button key={p.id} onClick={() => { setBranch(phase3 && mobile() ? p.id : ''); setA(p.id); setShowPath(false); setFocus(phase3 && mobile() ? null : { id: p.id }); setQuery(''); setMode('explore'); }}>{nameOf(p)} <span>{p.born}</span></button>) : <p>No people found</p>}</div>}
        </div>
      </div>
      <section className="fc-view-controls" aria-label="Family view controls">
        <label>Family view<select aria-label="Branch root" value={branch} onChange={e => { setBranch(e.target.value); if (e.target.value) setA(e.target.value); setFocus(null); setShowPath(false); }}><option value="">Complete family · {fixture.people.length} people</option>{people.map(p => <option key={p.id} value={p.id}>{nameOf(p)}'s branch</option>)}</select></label>
        {branch && <><label>Show<select aria-label="Branch direction" value={direction} onChange={e => setDirection(e.target.value)}><option value="personal">Personalized generations</option><option value="descendants">Descendants + partners</option><option value="ancestors">Ancestors + partners</option></select></label><button className="fc-text-button" onClick={() => setBranch('')}>Expand complete family</button></>}
        {branch && direction === 'personal' && <>
          <label>Ancestor generations<select aria-label="Ancestor generations" value={ancestorDepth} onChange={e => setAncestorDepth(Number(e.target.value))}>{[0,1,2,3,4,5,6].map(n => <option key={n}>{n}</option>)}</select></label>
          <label>Descendant generations<select aria-label="Descendant generations" value={descendantDepth} onChange={e => setDescendantDepth(Number(e.target.value))}>{[0,1,2,3,4,5,6].map(n => <option key={n}>{n}</option>)}</select></label>
        </>}
        <div className="fc-legend"><span><i /> Parentage / partnership</span><span><i className="dashed" /> Former partnership</span><span><i className="adoptive" /> Adoptive parentage</span><span>○ Family junction · Gap = crossing</span>{showPath && mode === 'explore' && <span><i className="highlight" /> Selected path</span>}</div>
      </section>
      {mode === 'explore' && <div className="fc-mobile-focus">
        <label>Focus on a relative<select aria-label="Focus relative" value={a} onChange={e => { setA(e.target.value); setBranch(phase3 ? e.target.value : ''); setShowPath(false); setFocus(phase3 ? null : { id: e.target.value }); }}>{people.map(p => <option key={p.id} value={p.id}>{nameOf(p)}</option>)}</select></label>
        <button className="fc-secondary" onClick={() => { setBranch(a); setDirection(phase4 ? 'personal' : 'descendants'); setFocus(null); setShowPath(false); }}>View branch</button>
      </div>}
      {error && <div role="alert" className="fc-error">{error}</div>}
      {!layout ? <div className="fc-loading" role="status">{error ? 'Unable to lay out this family.' : 'Arranging the family automatically…'}</div> : <>
        {mode === 'explore' ? <InteractiveTree layout={layout} path={path} focus={focus} activePerson={a} onPerson={selectPerson} /> :
          <section className="fc-print-studio">
            <div className="fc-print-settings"><div><p className="fc-kicker">{premium ? 'BOTANICAL HEIRLOOM / 01' : 'MINIMALIST COLLECTION / 01'}</p><h2>A family keepsake</h2><p>{premium ? 'Portraits, quiet botanical details and a story shared through generations.' : 'Measured cards and precise connections, composed automatically for your family.'}</p></div>
              <label>Template<select aria-label="Template" value={template} onChange={e => { setTemplate(e.target.value); if(e.target.value === 'botanical') setFormat('poster18'); }}><option value="minimalist">Minimalist</option><option value="botanical">Botanical heirloom</option></select></label>
              {premium && <label>Family composition<select aria-label="Premium family" value={sample} onChange={e => setSample(e.target.value)}><option value="11">Emma's family · 11 people</option><option value="15">Emma's ancestry · 15 people</option><option value="25">Bennett &amp; Reed · 25 people</option><option value="40">Extended family · 40 people</option><option value="current">Use current family view</option></select></label>}
              <label>Paper size<select aria-label="Paper size" value={format} onChange={e => setFormat(e.target.value)}>{Object.entries(FORMATS).filter(([key]) => !premium || ['poster18','poster24'].includes(key)).map(([key, paper]) => <option value={key} key={key}>{paper.label}</option>)}</select></label>
              <p className="fc-print-size">Names print at approximately {(premium ? composition?.firstNamePt || 0 : printNameSize(layout, format)).toFixed(1)} pt.</p>
              {premium && composition && <p className={composition.readable ? 'fc-print-size' : 'fc-warning'}>{composition.recommendation}</p>}
              {!premium && format === 'roll' && <p className="fc-print-size">Roll size: {Math.round(Math.max(layout.width + 80, 1000) * 12 / 14 * 25.4 / 72)} × {Math.round((layout.height + 200) * 12 / 14 * 25.4 / 72)} mm. Surnames: 10.3 pt. Print at 100% scale.</p>}
              {!premium && printNameSize(layout, format) < 9 && <p className="fc-warning">This family is too wide for readable names on this page. Choose the readable roll poster, or a smaller branch. PDF export requires names of at least 9 pt.</p>}
              <button className="fc-primary" disabled={exporting || !exportAllowed} onClick={() => saveExport('pdf')}>{exporting ? 'Preparing artwork…' : 'Download PDF'}</button>
              <button className="fc-secondary" disabled={exporting || (premium && !exportAllowed)} onClick={() => saveExport('svg')}>Download SVG</button>
              <button className="fc-secondary" disabled={exporting || (premium && !exportAllowed)} onClick={() => saveExport('png')}>Download PNG</button>
              <p className="fc-small">{premium ? 'PNG exports at 300 pixels per inch with embedded print resolution. PDF and SVG preserve vector type and decoration.' : 'PNG is a review raster capped at 16,384 pixels per side and 24 megapixels. Use PDF or SVG for printing.'}</p>
              <p className="fc-small">Embedded portraits, vector text and precise connectors. Exports open independently of this app.</p>
            </div>
            <div className="fc-paper-wrap"><div className="fc-paper">{premium ? premiumError ? <p role="alert">{premiumError}</p> : premiumLayout ? <PremiumPoster title="The Bennett & Reed family" layout={premiumLayout} format={format} svgRef={poster} /> : <p role="status">Composing your family portrait…</p> : <Poster layout={layout} format={format} svgRef={poster} subjectId={branch || undefined} title={branch ? `${nameOf(fixture.people.find(p => p.id === branch))}’s family` : "The Bennett & Reed family"} />}</div><p>{FORMATS[format].label} · {(premium ? premiumGraph : layout.graph).people.filter(p => p.photo).length} licensed portraits · Fictional family</p></div>
          </section>}
        {mode === 'explore' && <section className="fc-relationship" aria-label="Relationship finder">
          <div className="fc-relationship-title"><span className="fc-kicker">DISCOVER A CONNECTION</span><h2>How are we related?</h2></div>
          <div className="fc-pair">{personSelect('First person', a, setA)}<span className="fc-pair-symbol">↔</span>{personSelect('Second person', b, setB)}<button className="fc-primary" onClick={() => { setBranch(''); setShowPath(true); setOption(0); }}>Show connection</button></div>
          {showPath && <div className="fc-result" aria-live="polite">
            <div><span className="fc-kicker">{path?.kind === 'biological' ? 'BIOLOGICAL RELATIONSHIP' : 'FAMILY CONNECTION'}</span><h3>{path?.label || result.message}</h3>
              {result.options.length > 1 && <label>Evidence path<select aria-label="Evidence path" value={option} onChange={e => setOption(Number(e.target.value))}>{result.options.map((item, index) => <option key={index} value={index}>{item.label}{item.ancestor ? ` · via ${fixture.people.find(p => p.id === item.ancestor).first}` : ''}</option>)}</select></label>}
            </div>
            {path && <ol className="fc-path">{path.path.map((id, index) => <li key={`${id}-${index}`}><span>{fixture.people.find(p => p.id === id).first}</span>{index < path.path.length - 1 && <b>→</b>}</li>)}</ol>}
            <button className="fc-text-button" onClick={() => setShowPath(false)}>Clear highlight</button>
          </div>}
        </section>}
      </>}
      <footer className="fc-footer"><span>Stock models portray fictional characters; names, dates and relationships are invented. {phase4 && 'Some stock models are reused in this stress fixture.'} <a href="/family-portraits/sources.json" target="_blank" rel="noreferrer">Photo credits</a></span><span>Automatic graph layout · No manually placed people</span></footer>
    </main>
  </div>;
}
