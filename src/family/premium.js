import { fixture } from './fixture.js';
import { fixture100 } from './fixture100.js';
import { fixture300 } from './fixture300.js';
import { personalBranch } from './graph.js';

const first40 = new Set(fixture100.people.slice(0, 40).map(p => p.id));
export const premiumSamples = {
  11: personalBranch(fixture300, 'emma', 2, 1),
  15: personalBranch(fixture300, 'emma', 3, 1),
  25: fixture,
  40: {
    people: fixture100.people.filter(p => first40.has(p.id)),
    partnerships: fixture100.partnerships.filter(p => p.partners.every(id => first40.has(id))),
    parentages: fixture100.parentages.filter(p => first40.has(p.parent) && first40.has(p.child)),
  },
};

// A single design with automatic portrait/landscape composition. Only the page
// orientation and global graph transform vary: people and ports remain ELK's.
export function premiumComposition(layout, format = 'poster18') {
  const inches = format === 'poster24' ? [24, 36] : [18, 24];
  const candidates = [false, true].map(landscape => {
    const paper = { width: inches[landscape ? 1 : 0] * 25.4, height: inches[landscape ? 0 : 1] * 25.4 };
    const width = 1200, height = width * paper.height / paper.width;
    const margin = 76, top = landscape ? 184 : 220, bottom = landscape ? 82 : 100;
    const scale = Math.min((width - 2 * margin) / layout.width, (height - top - bottom) / layout.height);
    const firstNamePt = 20 * scale * paper.width / width * 72 / 25.4;
    return { width, height, paper, scale, landscape, top, bottom, firstNamePt,
      surnamePt: firstNamePt * .7, datePt: firstNamePt * .55,
      x: (width - layout.width * scale) / 2,
      y: top + (height - top - bottom - layout.height * scale) / 2,
    };
  });
  const result = candidates.sort((a,b) => b.firstNamePt - a.firstNamePt)[0];
  result.readable = result.firstNamePt >= 12 && result.datePt >= 7;
  result.recommendation = result.readable ? `${result.landscape ? 'Landscape' : 'Portrait'} composition selected automatically.` :
    format === 'poster18' ? 'Choose 24 × 36 inches for this family, or select a smaller branch. Export is paused to preserve readable type.' :
    'This branch exceeds the comfortable capacity of this design. Select fewer generations or use the minimalist roll template.';
  return result;
}
