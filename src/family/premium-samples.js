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

