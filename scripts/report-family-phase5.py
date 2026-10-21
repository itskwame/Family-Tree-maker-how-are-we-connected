"""Create an offline, linked visual review of the first premium template."""
import json, shutil
from pathlib import Path
from html import escape

root=Path(__file__).resolve().parents[1]
out=root/'output/phase5'
def read(name): return json.loads((out/name).read_text(encoding='utf-8'))
for source,target in [('browser-results.json','regression-results.json'),('production-results.json','production-results.json')]:
    shutil.copyfile(root/'output/phase4'/source,out/target)
for name,count in [('browser-results.json',5),('regression-results.json',11),('production-results.json',2)]:
    result=read(name)['stats'];assert result['expected']==count and result['unexpected']==0 and result['flaky']==0
assert '# pass 53' in (out/'unit-results.txt').read_text()
exports=read('export-results.json')
def link(path,label):
    assert (root/path).is_file(),path
    return f'<a href="{path}">{escape(label)}</a>'
def image(path,label):
    return f'<figure><figcaption>{escape(label)}</figcaption><a href="{path}"><img loading="lazy" src="{path}" alt="{escape(label)}"></a></figure>'
table='';gallery=''
for count in [11,15,25,40]:
    meta=read(f'browser-{count}.json');result=exports[str(count)]
    stem=meta['stem'];portrait=result['paper_mm'][0]<result['paper_mm'][1]
    size='18 × 24' if meta['format']=='poster18' else '24 × 36'
    label=f'{count} people · {size} inches · {"portrait" if portrait else "landscape"}'
    files=' · '.join(link(f'output/{"pdf" if ext=="pdf" else "phase5"}/{stem}.{ext}',ext.upper()) for ext in ['pdf','svg','png'])
    table+=f'<tr><th>{count}</th><td>{size} in, {"portrait" if portrait else "landscape"}</td><td>{result["first_names_pt"]:.1f} / {result["first_names_pt"]*.7:.1f} / {result["dates_pt"]:.1f} pt</td><td>{files}</td></tr>'
    gallery+=f'<section><h2>{label}</h2><p>{files} · '+link(f'output/phase5/{count}-studio.png','Full application screenshot')+' · '+link(f'output/phase5/{count}-pdf-portrait-detail.png','Independent PDF portrait detail')+'</p><div class="comparison">'
    gallery+=image(f'output/phase5/{count}-preview.png','Actual browser preview')+image(f'output/phase5/{count}-pdf-render.png','Independent PDFium rendering')+'</div></section>'
raw=' · '.join(link('output/phase5/'+name,name) for name in ['unit-results.txt','browser-results.json','regression-results.json','production-results.json','export-results.json'])
layouts=' · '.join(link(f'output/phase5/layout-{n}.json',f'{n}-person layout and print measurements') for n in [11,15,25,40])
html=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FamilyConnect — Phase 5 visual review</title>
<style>body{{max-width:1320px;margin:42px auto;padding:0 28px;background:#fbfaf6;color:#31463c;font:16px/1.65 system-ui,sans-serif}}h1,h2{{font-family:Georgia,serif;font-weight:400;line-height:1.2}}h1{{font-size:42px}}h2{{margin-top:48px}}a{{color:#37624f}}table{{width:100%;border-collapse:collapse}}td,th{{text-align:left;padding:12px;border-bottom:1px solid #d6cbb7}}.comparison{{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}}figure{{margin:0}}figcaption{{margin:12px 0;font-size:14px}}img{{width:100%;height:auto;border:1px solid #d6cbb7}}.note,pre{{padding:20px;background:#ecefe6}}pre{{overflow:auto}}section{{margin-bottom:50px}}@media(max-width:700px){{.comparison{{grid-template-columns:1fr}}body{{padding:0 12px}}td,th{{padding:7px;font-size:13px}}}}</style>
<p>FAMILYCONNECT · PHASE 5 · 20 OCTOBER 2026</p><h1>The Botanical Heirloom</h1>
<p class="note"><strong>One premium template, ready for visual review.</strong> Arched portraits, serif names, warm ivory, muted green and brass linework, with botanical engraving in the margins. The existing minimalist template and interactive family tree remain available. Development stops here for your review.</p>
<p>Reference image 1 was recovered read-only from Git history at <code>tree/images/family tree template example 1.png</code>. Its arched photographs and botanical linework informed the design. The artwork here is newly drawn SVG; it does not reuse the reference's photographs or background. Existing licensed stock photographs portray fictional people.</p>
<h2>Composition and print sizes</h2><table><tr><th>People</th><th>Delivered format</th><th>First names / surnames / dates</th><th>Exports</th></tr>{table}</table>
<p>Portraits are 120 × 132 layout units, compared with the minimalist template's 64 × 64 photographs. Images retain their aspect ratio and crop into an arched mask. Missing or failed images display serif initials in the same frame. There are seven photographs in the 11- and 15-person samples, and eight in the 25- and 40-person samples.</p>
<p>The same design automatically chooses portrait or landscape orientation by comparing the available graph scale. A shorter header in landscape preserves space for the family. It recommends 24 × 36 inches for 40 people; all export buttons are disabled at 18 × 24 because text would be too small. It refuses exports below 12 pt first names or 7 pt dates, rather than silently shrinking the family.</p>
<p>Both paper sizes are supported. The smaller samples also fit 24 × 36; a separate portrait 24 × 36 PDF was checked for dimensions and embedded photographs. The 40-person sample is delivered in landscape orientation at 36 × 24 inches. Print PDF/SVG at 100% actual size. PNGs include 300-ppi physical-resolution metadata: 5400 × 7200 for the portrait samples, 7200 × 5400 for 25 people, and 10800 × 7200 for 40 people.</p>
<h2>Automatic layout and relationship integrity</h2><p>The graph model, relationship finder, generation constraints, junction construction and orthogonal connector routing are preserved. The premium renderer requests larger node bounds and ELK's balanced node-placement option. Every person and connector uses the resulting engine coordinates. Page placement applies one global scale and translation, with no person-specific offsets or connector repairs.</p>
<p>The 11-person sample is Emma's branch with two ancestor generations and one descendant generation. The 15-person sample adds one ancestor generation. The 25-person sample is the existing Bennett &amp; Reed fixture; the 40-person sample adds its connected Morgan branch. All four retain unique people and their canonical relationships. “Use current family view” also lets the template render a selected branch from the existing controls.</p>
<h2>Test results</h2><ul><li><strong>53 / 53 engine tests passed:</strong> existing relationship tests, including distant and multiple ancestry paths, plus geometry and page-fit checks for all four premium fixtures.</li><li><strong>5 / 5 premium browser tests passed:</strong> actual renders, unique people, text bounds, image decoding, fallback initials, exact connector paths, independent SVG opening, PDF/PNG downloads, readability limits and switching back to the interactive relationship finder.</li><li><strong>11 / 11 existing browser scenarios passed:</strong> Phase 2B, 3 and 4 navigation, portraits, relationships, layout cancellation and exports.</li><li><strong>2 / 2 built-app smoke tests passed:</strong> existing 300-person behavior and the new premium renderer with its larger-format recommendation.</li><li><strong>Build passed.</strong> No new packages or network-dependent fonts were introduced.</li></ul>
<p>Geometry checks found no card overlaps, detached endpoints, connectors crossing unrelated cards, ambiguous touching lines or unrelated collinear overlaps. True line crossings retain an explicit gap; junctions retain their circle. Browser connector paths match the audited layout exactly.</p>
<p>All four final PDFs were independently rendered with PDFium and visually inspected. Checks verify physical page dimensions, every full name exactly once, embedded photograph counts, nonblank portraits, arch clipping and comparison with standalone SVG and PNG. Mean full-page RGB differences between SVG and PDF were below 2.5 on a 0–255 scale; local portrait comparisons passed separately. These numeric checks supplement the visual evidence below.</p>
<h2>Visual evidence</h2><p>Each comparison pairs an actual browser screenshot with an independent PDF rendering. Click an image for full resolution. Differences in antialiasing are expected between renderers.</p>{gallery}
<h2>Known limitations</h2><ul><li>The 40-person version is a denser extended-family poster. It needs the larger format and has fewer photographs relative to initials. Visual approval of that density remains yours.</li><li>The supplied demonstration portraits are licensed stock models, not actual family records. Their original resolution limits photographic sharpness; a 300-ppi export does not invent additional detail.</li><li>Font rendering uses standard Times and Helvetica-compatible families. Their appearance can vary slightly across SVG viewers; the independently verified PDF is the stable print reference. No custom font downloads or licenses are required.</li><li>Validation covers Chromium on this Windows machine and independent PDFium rendering. Physical paper, framing, color profiles and print-provider proofing were not tested.</li><li>Very long names and arbitrary pedigrees outside these fixtures are not proven by this phase. The existing engine's rank-conflicting cross-generation partnership limitation remains.</li><li>No automated tests are failing. Earlier visual issues—left-heavy placement, unused anchor stubs and SVG-only letter spacing—were corrected before the final captures.</li></ul>
<h2>View locally</h2><pre>npm run dev:family</pre><p>Open <a href="http://127.0.0.1:5174/?family=300&amp;template=botanical#/tree-prototype">the premium print studio</a>. It starts with Emma's 11-person sample. Use Family composition to compare 15, 25 and 40 people, and Paper size to compare the two formats. Select Minimalist to return to the original print template, or Explore family for the interactive network.</p>
<pre>npm run test:family
npm run test:family:premium
npm run test:family:browser
npm run build:family
npm run test:family:production
python scripts/verify-family-phase5.py
python scripts/report-family-phase5.py</pre>
<h2>Raw evidence</h2><p>{raw}</p><p>{layouts}</p><p>The next decision is visual approval of this single template. No additional premium styles, payment integration or other platform features were implemented.</p></html>'''
(root/'PHASE-5.html').write_text(html,encoding='utf-8')
print('Created PHASE-5.html. Test gates passed and linked files exist.')
