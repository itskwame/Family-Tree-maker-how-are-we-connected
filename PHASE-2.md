# FamilyConnect Phase 2: 25-person feasibility prototype

Status: ready for visual review. Phase 3 and Phase 4 have not been started.

## Run locally

From the repository directory:

```powershell
npm install
npm run dev:family
```

Open http://127.0.0.1:5174/#/tree-prototype.

No sign-in is required. The prototype imports only fictional fixture records; it does not read or write family data in Supabase. The existing app's environment configuration remains in place.

The separate Vite configuration uses its own cache and build directory. This avoids the existing locked `.vite` cache on this machine. The existing home, login, and signup route implementations are unchanged.

## What to review

1. The complete tree contains 25 unique fictional people, four generations, and nine partnerships (including marriages, a former marriage, and a partnership between cousins).
2. Choose Emma Bennett and Sophie Ellis, then **Show connection**. They are first cousins. Switch the evidence path between Arthur and Eleanor.
3. Choose Emma Bennett and Leo Bennett to see half-siblings.
4. Choose Sophie Ellis and Noah Bennett to see both first-cousin evidence paths and their partnership.
5. Search a person to center their card. Scroll/pinch to zoom, drag to pan, or use the zoom buttons. Clicking a card selects the first person in the relationship finder.
6. Choose Emma's branch to see descendants and partners; switch to ancestors or expand the complete family.
7. Open **Print studio**. The minimalist design uses the same card and connector renderer. Download the SVG or PDF.

The export is the unhighlighted artwork shown in Print studio. It does not export surrounding controls or the interactive path highlight.

## Evidence

All screenshots were captured from the rendered application with Playwright, not drawn as mockups.

| Artifact | Location |
| --- | --- |
| Complete interactive tree | `output/phase2/01-interactive-desktop.png` |
| First-cousin highlighted path | `output/phase2/02-cousin-connection.png` |
| Print studio | `output/phase2/03-print-studio.png` |
| Printable preview | `output/phase2/04-minimalist-preview.png` |
| Mobile overview and half-sibling result | `output/phase2/05-mobile.png` |
| PDF rasterized for visual inspection | `output/phase2/06-exported-pdf.png` |
| Readable mobile branch | `output/phase2/07-mobile-branch.png` |
| Standalone exported SVG rendered in Chrome | `output/phase2/08-standalone-svg.png` |
| Standalone SVG | `output/phase2/familyconnect-25-minimalist.svg` |
| A2 landscape vector PDF | `output/pdf/familyconnect-25-minimalist.pdf` |
| Engine test output | `output/phase2/unit-results.txt` |
| Browser test results | `output/phase2/browser-results.json` |
| Export verification | `output/phase2/export-results.json` |

The final desktop, highlighted path, print preview, mobile branch, standalone SVG, and rasterized PDF were visually inspected. The PDF contains all 25 names as text on one A2 landscape page. First names print at approximately 12.3 pt on A2.

## Verification results

- 29 engine tests passed.
- Four Playwright scenarios passed in Chrome at desktop and mobile viewport sizes.
- All 625 ordered person pairs were checked for evidence-path integrity. This validates every returned path's actual edges; it is not a claim of 625 independently hand-labelled kinship answers.
- Known-answer tests cover parents, children, grandparents, great-grandchildren, aunts/nieces, full and half-siblings, first through third cousins, removals, former/current spouses, partnership connections, and missing data.
- The complete layout has zero card overlaps, zero detached edge endpoints, and zero connector segments through unrelated card interiors.
- Four generation rows and the layout's repeatability are asserted.
- One unrelated line crossover is explicitly marked by a gap, computed from geometry. Family junctions use circles. Shared family buses are intentional.
- Browser checks cover text/card clipping, placeholders, a failed photo's fallback, pan/zoom, branch visibility, mobile document overflow, path selection, and export downloads.
- SVG/PDF verification checks page size, all names, self-contained placeholder imagery, and rendered similarity. Mean RGB-channel difference is approximately 1.11 on a 0–255 scale; different browser/PDF rasterizers explain small text antialiasing differences.

Commands:

```powershell
npm run test:family
npm run test:family:browser
python scripts/verify-family-exports.py
npm run build:family
```

The browser configuration uses an installed Google Chrome (`channel: 'chrome'`). PDF verification requires Python packages `Pillow`, `pypdf`, and `pypdfium2`. PDFium was used because Poppler was unavailable on this machine. The app's PDF download itself runs entirely in the browser and requires no Python.

## Architecture

- `src/family/fixture.js`: deterministic fictional records; no stored layout coordinates.
- `graph.js`: graph integrity, typed adjacency, and branch views.
- `relationships.js`: biological ancestry evidence and separate partnership/adoption connections.
- `layout.js`: family junctions, generation constraints, ELK partitioned orthogonal layout, geometry checks, and crossing detection.
- `Scene.jsx`: the common SVG card/connector renderer and minimalist poster.
- `FamilyPrototype.jsx`: isolated route, search, navigation, relationship controls, and print studio.
- `export.js`: standalone SVG serialization and vector PDF conversion.

Positions, ports, and routed edges come from ELK. Constants describe common card size, spacing, and page margins. No individual person positions or individual connector corrections are stored.

## Defects found and corrected

- Browser tests exposed imprecise accessible selector names. Select controls now have explicit labels.
- Initial rendering did not distinguish an unrelated line crossing sufficiently. The shared SVG renderer now applies an automatic gap marker at proper intersections between unrelated family buses.
- A whole-family mobile overview was too small to read. Search, zoom, and automatically relaid-out branch views provide readable cards; mobile guidance and a branch screenshot demonstrate this.
- SVG letter-spacing was not reproduced consistently by the PDF converter. The exported scene uses typography supported consistently by both renderers.
- A browser test initially expected eight highlighted segments. The correct count is seven because the two branches share their common ancestor's inlet; the test now reflects the actual semantic path.

No final automated checks remain failing.

## Known limitations

- This proves the selected 25-person fixture, not arbitrary family graphs or production readiness.
- All portraits use professional initials. Failed-image fallback is tested, but real-photo embedding, CORS handling, and high-resolution photo exports are not demonstrated.
- All displayed parentage is biological. Adoption is distinguished in relationship tests, but adoptive/mixed-parentage visual styling is not yet implemented.
- Partnership links receive specific spouse/partner labels. Longer affinity paths use the conservative description "connection through partnership"; a complete in-law naming vocabulary is not implemented.
- Half-siblings are distinguished. A full vocabulary of half-aunts/uncles and half-cousins is not yet implemented.
- Generation layout assumes partners can share a row. Contradictory cross-generation partnership constraints fail explicitly rather than being patched.
- Cards are sized for this fixture. Long names, international scripts, uncertain dates, and arbitrary profile fields need further typography work.
- At phone width, the complete-family overview is intentionally small. Search, zoom, or branch selection is needed to read individuals.
- A2 and the wide poster are suitable for the complete family. A4/Letter and compact formats that would produce first names below 9 pt block PDF download and recommend a larger page or smaller branch. SVG remains scalable.
- No tiled output or PNG download is implemented in Phase 2. PNG files supplied here are review screenshots.
- The ELK bundle is relatively large and currently runs without a dedicated Web Worker. The production build reports a large-chunk warning. Worker isolation and larger-family performance remain future work.
- Browser testing used Chrome with mobile viewport emulation, not physical mobile devices or Safari/Firefox.
- No persistence, duplicate merging, live Supabase integration, or migrations are included.

## Dependencies and licensing

Versions are pinned by `package-lock.json`.

| Added dependency | Version | License |
| --- | --- | --- |
| elkjs | 0.12.0 | EPL-2.0 (package also offers GPL-3.0-or-later); use EPL option |
| d3-selection | 3.0.0 | ISC |
| d3-zoom | 3.0.0 | ISC |
| jspdf | 4.2.1 | MIT |
| svg2pdf.js | 2.8.1 | MIT |
| @playwright/test | 1.61.1 | Apache-2.0, development only |

No paid runtime service or commercial template is used. Keep dependency notices when distributing. ELK's EPL terms apply to its distribution and modifications; this prototype uses the unmodified npm package. Original license texts are included in the installed packages.

## Review boundary

The next decision is visual approval of this prototype and its printable output. No 100-person or 300-person fixtures, stress tests, or additional designer templates have been implemented.
