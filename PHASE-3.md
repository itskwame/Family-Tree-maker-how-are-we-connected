# FamilyConnect Phase 3 review

The existing engine now renders and exports a deterministic 100-person family network. All 43 relationship and geometry tests and seven browser scenarios pass. Actual screenshots, offline exports and independently rendered PDF details were inspected. Phase 3 is ready for visual review; the 300-person test has not begun.

The complete family is a wide five-generation network. Its overview fits on desktop, but individual names require zoom or branch selection. Mobile opens to a readable four-person branch. The full print uses a 2559.65 × 463.25 mm roll format to preserve 12-point first names and 10.3-point surnames. These width and navigation tradeoffs need your visual approval.

## Review evidence

| View | Actual rendered evidence |
| --- | --- |
| All 100 people on desktop | [Complete family](output/phase3/01-complete-desktop.png) |
| Distant relationship in full context | [Full highlighted network](output/phase3/02-distant-relationship.png) |
| First cousins twice removed | [Focused highlighted route](output/phase3/02-relationship-focused.png) |
| Six-person branch | [Ivy Morgan and descendants](output/phase3/03-selected-branch.png) |
| Print controls and complete preview | [Print studio](output/phase3/04-print-studio.png) |
| Mobile starting view | [Emma Bennett branch](output/phase3/05-mobile-default.png) |
| Mobile relative selection | [Ruby Morgan branch](output/phase3/05-mobile-navigation.png) |
| PDF rendered outside the application | [Complete PDF raster](output/phase3/06-exported-pdf.png) |
| PDF detail with photograph | [Emma portrait and text](output/phase3/06-pdf-detail-emma.png) |
| PDF detail with adoption | [Alex and dotted adoptive connector](output/phase3/06-pdf-detail-b2-bb.png) |
| PDF detail with initials | [Milo Morgan](output/phase3/06-pdf-detail-b1-aaa.png) |
| SVG opened offline from disk | [Standalone SVG screenshot](output/phase3/08-standalone-svg.png) |

The complete print images are intentionally very wide. Open at full resolution or zoom into the PDF to assess names and connectors; a thumbnail cannot demonstrate print readability.

## Export samples and printable formats

- [Vector PDF](output/pdf/familyconnect-100-portraits.pdf): one custom roll page, 2559.65 × 463.25 mm; 603,693 bytes.
- [Standalone SVG](output/phase3/familyconnect-100-portraits.svg): physical width and height in millimetres, vector text/connectors, eight embedded JPEG portraits; 904,805 bytes.
- [Standalone PNG](output/phase3/familyconnect-100-portraits.png): 10078 × 1824 pixels; 1,073,177 bytes.

Print the PDF at **100% / actual size**, using suitable roll media. First names are 12 pt, surnames 10.3 pt and dates 9.4 pt. The outer artwork margin is approximately 12 mm, with additional layout padding around cards. PDF and SVG are the print masters.

The PNG is a review raster sized for approximately 100 pixels per print inch at the roll dimensions. Its print resolution metadata is not set to 100 dpi; specify physical dimensions explicitly if printing it. It is not a 300 dpi production raster.

A2 and smaller sheets cannot hold the complete network with readable names. The interface blocks PDF export when calculated first-name size falls below 9 pt. Use existing A2/A3/A4/Letter options for selected branches, checking the displayed type size. Tiled multi-page output and a compact alternative full-family composition are not implemented.

## Dataset and architecture

[The complete fictional dataset](output/phase3/fictional-family-100.json) contains exactly 100 unique IDs and unique full names, five derived generations, 39 partnerships and 123 parentage edges. All people are connected to the same family network and appear exactly once in the complete scene and SVG. No duplicates or proxy relatives are needed.

The original 25 people remain unchanged. Five additional branches add 75 people, with deterministic names, dates and relationships. They include marriages, former marriages, remarriages, half-siblings, two adoptive parentage edges, and a child with only one known biological parent. No fictitious second parent is inferred for that child. A Reed-to-Morgan connection creates additional ancestry paths, alongside the original cousin partnership.

Eight existing licensed stock portraits remain attached to their original fictional characters; the other 92 people use initials. Those photographs cover four generations; the fifth generation uses initials. Sources and licensing are recorded in [the existing portrait manifest](public/family-portraits/sources.json). No new stock models, actual family records or Supabase records were introduced.

React, ELK layered layout, d3 navigation and the shared SVG scene remain in use. Parentage and partnership records determine generation, spacing, ports and routing. No per-person positions, individual connector coordinates or fixture-specific routing overrides were added.

## Defects found and corrected

Visual inspection caught a stray family junction that the initial card-only geometry checks did not detect. A single-parent group could share an internal junction ID with a partnership. Junction IDs now use separate partnership and parent-group namespaces. Tests require uniqueness of all layout nodes and connectors, not just people.

Visual inspection also found that unselected connectors could paint over selected segments of a shared family bus. Highlighted paths now render after unselected paths. Browser tests verify this ordering, and the final focused screenshot shows the continuous selected route.

Adoptive child connectors use a blue dotted stroke with an explicit legend. Relationship results retain adoptive paths separately from biological ancestry. Mobile in the 100-person mode opens directly to Emma's branch; searching or choosing a relative opens that relative's branch. Complete-family overview, ancestor/descendant selection, pan and zoom remain available. A Fit connection control frames the selected evidence path.

## Automated validation

| Check | Result |
| --- | --- |
| Existing Phase 2B engine suite | 29 passed |
| Phase 3 engine suite | 14 passed |
| Total engine tests | **43 passed, 0 failed** |
| Existing Phase 2B browser scenarios | 4 passed |
| Phase 3 browser scenarios | 3 passed |
| Total Playwright scenarios | **7 passed, 0 failed** |
| Complete family coverage | 100 people, each exactly once |
| Internal layout identity coverage | 140 unique nodes; no duplicate connector IDs |
| Card overlaps | 0 |
| Detached connector endpoints | 0 |
| Connectors entering profile-card interiors | 0 |
| Unrelated collinear overlaps or ambiguous endpoint touches | 0 |
| Unrelated perpendicular crossings | 26, each explicitly marked by a gap |
| Repeated automatic layout | Same coordinates over three runs |
| Representative branch layouts | 10 ancestor/descendant views passed geometry checks |
| Production build | Passed in 20.31 seconds |

Lines within a family group intentionally share buses. The 26 gapped crossings are not relationships or unexplained intersections; the junction/gap legend distinguishes them. The geometry audit checks every routed endpoint against its actual port and confirms every canonical relationship is represented by routed segments.

Relationship tests verify expected first/second/third cousin labels, once- and twice-removed cousins, full/half siblings, incomplete parentage, adoption and former/current spouses. Emma and Ivy have four valid common-ancestor paths. Ethan and Milo have four distinct paths, including two through Arthur and two through Eleanor; every label remains “Second cousins, once removed.” All 10,000 ordered person pairs are checked for established connections, real consecutive edges, correct endpoints and acyclic evidence paths. This exhaustive path-integrity check is supplemented by expected-label examples; it is not an independent genealogical oracle for every possible label.

Playwright checks search, zoom, actual mouse panning, branch expansion/collapse, ancestor selection, all four evidence choices, highlighted adoptive connectors, readable fresh mobile load, fallback initials and broken-image fallback. Eight photographs decode successfully. All cards and text fit the full desktop scene; mobile branch cards remain fully inside the canvas at readable size.

The SVG is opened from disk in an offline browser context. PDFium independently renders the downloaded PDF, and pypdf confirms one correctly sized page, eight embedded photographs and the names in its text. Pillow reads the exported PNG. Mean RGB raster differences on a 0–255 scale are **0.8035 for PDF versus SVG** and **0.6029 for PNG versus SVG**, below the threshold of 5. Portrait-specific checks verify nonblank images and circular clipping. The Phase 2B A2 export verification also passes.

Raw evidence: [unit results](output/phase3/unit-results.txt), [browser results](output/phase3/browser-results.json), [geometry and layout metrics](output/phase3/layout-metrics.json), [browser performance](output/phase3/browser-metrics.json), [export verification](output/phase3/export-results.json).

An intermediate test invocation was blocked by the Windows sandbox with `spawn EPERM`. The authorized rerun completed with all 43 tests passing. No unresolved test failures or detected Phase 2B regressions remain.

## Performance measurements

Measurements come from this Windows workstation, an Intel Core Ultra 5 125U, using Chrome 155.0.8059.80 headlessly against the local Vite development server. Browser timing is the final captured run; the three Node layout runs show first/warm behavior. They are not production service-level guarantees or low-end mobile measurements.

| Measurement | Observed |
| --- | --- |
| Browser automatic layout | 1492 ms |
| Layout completion through React commit and two animation frames | 171 ms |
| Browser navigation time through layout/render readiness marker | 2989 ms |
| Playwright navigation through readiness assertion | 3371 ms |
| Show connection through visible result, including automation | 202 ms |
| Node layout, three sequential runs | 1067 / 656 / 504 ms |
| SVG export through saved download | 564 ms |
| PDF export through saved download | 679 ms |
| PNG export through saved download | 922 ms |
| Pan/zoom frame interval, 65 samples | Median 16.7 ms; p95 16.8 ms; maximum 17.0 ms |
| JS heap at initial render readiness | 32.6 MiB |
| CDP JS heap before interactions/exports | 17.7 MiB |
| CDP JS heap after interactions/exports | 21.9 MiB |
| Node resident memory after sequential layout runs | 100.1 / 112.2 / 126.7 MiB |
| Longest observed browser main-thread task | 848 ms |

Garbage collection explains why later heap snapshots can be lower than the initial snapshot. These are process/heap snapshots, not peak memory or a memory-leak test. Browser image decoding, GPU allocations and canvas buffers are not fully represented by JS heap; the PNG canvas alone requires approximately 70 MiB of raw pixel storage.

The frame samples cover scripted wheel zoom and mouse pan after layout. They do not measure gesture latency on a physical phone. Layout and exports still do work on the main thread: the observed 848 ms long task is a responsiveness limitation, even though navigation after layout was smooth. Worker-based layout is a possible later improvement, not implemented in this phase.

## Remaining limitations and review decision

- The complete layout is a wide banner. Its desktop overview and print thumbnail are too small for reading names; zoom and branches provide detail. A more compact professional print composition would require additional layout work if the roll format is unsuitable.
- The fixture exercises one deterministic topology with 100 people, eight photographs and 92 initials. It does not establish performance for 100 full-resolution photographs, every family topology or larger datasets.
- Adoption is accurately distinguished, but the label remains “Connection through adoptive parentage”; detailed adoptive cousin/aunt vocabulary is not implemented. Affinity paths likewise use the existing generic partnership wording.
- Existing cross-generation partnership constraints remain unsupported when they conflict with shared generation ranks. No such case is present in this fixture.
- All browser checks use desktop Chromium and a 390 × 844 mobile viewport. Safari, Firefox, physical touch devices and physical printing have not been verified.
- PDF text remains vector text using standard fonts. SVG appearance can vary slightly with substitute fonts in other viewers. Offline Chrome and PDFium are the independently tested renderers.
- The existing ELK-heavy bundle warning remains: the family chunk is about 1.52 MB minified, 469 KB gzip. Layout/export long tasks and total peak memory require further production hardening.
- No payment features, additional decorative templates, live-data changes, deployment or 300-person testing were performed.

Review the full-family composition, focused relationship, mobile branch and PDF details before authorizing another scale step.

## Run locally

From the repository root:

```powershell
npm run dev:family
```

Open **http://127.0.0.1:5174/?family=100#/tree-prototype** for Phase 3.

The Phase 2B regression fixture remains available at **http://127.0.0.1:5174/#/tree-prototype**.

To reproduce validation:

```powershell
npm run test:family
npm run test:family:browser
python scripts/verify-family-exports.py --phase phase3
python scripts/verify-family-exports.py --phase phase2b
npm run build:family
```

Browser tests generate the screenshots and export samples. The verifier requires Pillow, pypdf and pypdfium2, available in the tested environment. The browser configuration uses installed Chrome. No Supabase connection or real family data is required.
