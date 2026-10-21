# Phase 2B: portrait and print validation

Status: implemented and visually inspected; ready for user review. No 100-person or 300-person work has begun.

## What changed

- Eight licensed stock portraits represent fictional characters across all four generations: Arthur and Iris; David and Helen; Emma and Lucas; Ava and Theo. The other 17 people retain initials.
- Photographs are local project assets under `public/family-portraits/`, not hotlinked images. They use one consistent 64-unit circular frame, aspect-preserving scaling, top-centered cropping, and an SVG clipping path. Each component instance has a unique clip identifier.
- Portrait cards are 162 × 164 layout units. ELK receives those dimensions before calculating positions and connectors. No person-specific layout coordinates or connector fixes were added.
- The same SVG renderer supplies the interactive cards and print artwork.
- SVG and PDF exports embed every photograph as image data. They do not rely on the application, external image hosts, or relative file paths.
- Exports wait for images to decode and report embedding errors rather than silently writing incomplete image references.
- The print composition uses larger portrait cards, a more compact header/footer, and comfortable common margins. A2 first names print at approximately 12.6 pt.
- On narrow screens, the complete network opens centered on the selected relative at a readable scale. **Focus on a relative** jumps to another person; **View branch** selects their descendants/partners. Small branches still fit all their cards. **Fit tree** explicitly requests the full-network overview.

## Portrait provenance

These are photographs of stock models portraying invented characters, not generated people and not family records. The UI and exported artwork explicitly say that names, dates and relationships are fictional.

The built-in image-generation service rejected the initial elderly-man portrait request and returned no image. No CLI/API fallback was used. Licensed stock images were selected under the user-authorized alternative.

The attempted prompt was:

> Use case: photorealistic-natural. Generate one square photographic head-and-shoulders portrait for a fictional family-tree demo: Arthur Bennett, a completely invented elderly man around 78, light skin, silver hair, gentle smile, warm brown eyes, wearing a muted sage collared shirt. Soft natural window light, plain warm gray studio background, realistic skin texture, professional family portrait photography. Face centered, entire head and hair visible, shoulders visible, ample margin around head for circular cropping. No other people. No text, logos, borders or watermarks. Not based on any real person.

All final assets use the [Pexels License](https://www.pexels.com/license/). Preserve the context that these are fictional demo characters; no endorsement is implied. The license permits use and modification, but not offensive portrayals, implied endorsement, or resale of unaltered stock photographs.

| Fictional character | Photographer | Source |
| --- | --- | --- |
| Arthur | Kampus Production | [Photo 6667746](https://www.pexels.com/photo/portrait-of-an-elderly-man-smiling-6667746/) |
| Iris | RDNE Stock project | [Photo 8865426](https://www.pexels.com/photo/portrait-of-an-elderly-woman-s-face-8865426/) |
| David | Sandro Tavares | [Photo 17824398](https://www.pexels.com/photo/portrait-of-an-adult-man-smiling-17824398/) |
| Helen | Alimi Sandrine | [Photo 29405854](https://www.pexels.com/photo/professional-portrait-of-smiling-middle-aged-woman-29405854/) |
| Emma | Александр Лич | [Photo 20591769](https://www.pexels.com/photo/close-up-portrait-of-a-woman-20591769/) |
| Lucas | Finn Gruber | [Photo 31869535](https://www.pexels.com/photo/portrait-of-a-thoughtful-young-man-against-neutral-background-31869535/) |
| Ava | Jon Champaigne | [Photo 25849096](https://www.pexels.com/photo/portrait-of-smiling-girl-25849096/) |
| Theo | Kimy Moto | [Photo 20189738](https://www.pexels.com/photo/portrait-of-smiling-boy-20189738/) |

Machine-readable credits: `public/family-portraits/sources.json`. Files are named `{character}.jpg`. `scripts/download-family-portraits.mjs` reproduces the downloads; the app does not run this script.

## Visual evidence

Original Phase 2 artifacts are preserved. New artifacts are under `output/phase2b/`.

| Evidence | File |
| --- | --- |
| Updated interactive tree | `01-interactive-desktop.png` |
| Highlighted first-cousin path | `02-cousin-connection.png` |
| Print studio | `03-print-studio.png` |
| Printable preview | `04-minimalist-preview.png` |
| Default mobile experience, fresh load | `05-mobile-default.png` |
| Mobile half-sibling result | `05-mobile.png` |
| Exported PDF rendered by PDFium | `06-exported-pdf.png` |
| Mobile branch with all four cards visible | `07-mobile-branch.png` |
| Standalone SVG opened via file URL with networking disabled | `08-standalone-svg.png` |
| Self-contained SVG | `familyconnect-25-portraits.svg` |
| Sample PDF | `output/pdf/familyconnect-25-portraits.pdf` |

The desktop tree, printable preview, offline SVG, PDF render, and mobile screenshots were visually inspected. A mobile branch regression was found during review: the new focus behavior initially zoomed small branches unnecessarily. It was corrected so branches with at most six people retain automatic fit behavior.

## Results

- **29/29 engine tests pass.** Existing relationship and graph-integrity checks remain in place, including all 625 ordered person pairs' returned evidence paths.
- **4/4 Playwright scenarios pass.** Existing interaction checks now also verify photograph loading, clip references, frame dimensions, standalone offline SVGs, readable fresh-load mobile focus, and fully visible small mobile branches.
- **Geometry:** zero overlapping cards, zero detached connector endpoints, and zero connector segments through card interiors. One unrelated line crossing retains its automatically derived gap notation.
- **Portrait coverage:** eight photographs across all four generations; seventeen initials fallbacks.
- **Export:** all eight photos are embedded in both formats; no external image references remain. PDFium independently renders the one-page A2 PDF, and text extraction finds all 25 names.
- **Crop checks:** all eight PDF portraits are nonblank, their corners remain outside the circular clip, and each is compared against the standalone SVG render.
- **Visual comparison:** mean SVG/PDF RGB-channel difference is 1.1858 on a 0–255 scale. Per-portrait values range from 3.830 to 9.720, with a threshold of 15 to allow renderer sampling differences. These checks supplement visual review.
- **Page use:** the tree's bounding box spans 93.2% of page width and 69.6% of height, versus 90.8% and 53.7% in Phase 2. This measures tree extent, not ink coverage.
- **Build:** passes; the previously known large ELK bundle warning remains.
- **Regressions remaining in tested cases:** none detected.

Evidence files:

- `output/phase2b/unit-results.txt`
- `output/phase2b/browser-results.json`
- `output/phase2b/export-results.json`
- `output/phase2b/page-coverage.json`

## Local viewing and reproduction

```powershell
npm run dev:family
```

Open http://127.0.0.1:5174/#/tree-prototype.

```powershell
npm run test:family
npm run test:family:browser
python scripts/verify-family-exports.py
npm run build:family
```

The browser checks use installed Google Chrome. PDF inspection uses Pillow, pypdf and pypdfium2. `python scripts/verify-family-exports.py --phase phase2` still checks the preserved Phase 2 export.

## Limits and review boundary

- Stock portraits stand in for fictional people; they are not AI-generated identities. Apparent ages are illustrative rather than a simulation of portraits taken on one date.
- Mobile testing is Chrome viewport emulation, not a physical-device or Safari test. A focused network intentionally extends beyond the viewport; pan, search, branch selection, and explicit overview provide navigation.
- Full-family A4/Letter output remains below the readability threshold. Use A2, a wide poster, or a smaller branch.
- This phase validates local JPEG assets. Authenticated remote photo retrieval, HEIC input, photo upload/editing, arbitrary crop controls, and color-managed commercial printing are outside this prototype.
- Other Phase 2 limits remain, including cross-generation partnership conflicts, the incomplete extended in-law vocabulary, and the absence of live database integration.
- No unrelated application feature, database record, migration, or family relationship was changed in Phase 2B.

Stop here for visual approval. The next phase remains unstarted.
