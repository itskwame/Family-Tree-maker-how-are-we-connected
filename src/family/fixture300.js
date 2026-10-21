import { fixture100 } from './fixture100.js';

// Deterministic stress fixture, not imported family records. No positions.
export const fixture300 = structuredClone(fixture100);
const g = fixture300;
function person(id, first, last, born, photo = null) {
  g.people.push({ id, first, last, born, died: born < 1940 ? born + 84 : undefined,
    gender: 'unspecified', biologicalParentsComplete: false,
    photo: photo ? `/family-portraits/${photo}.jpg` : null });
}
function parent(parent, child, kind = 'biological', union) {
  g.parentages.push({ id: `${parent}>${child}`, parent, child, kind, union });
}
function family(id, partners, children, status = 'partnered', kind = 'biological') {
  g.partnerships.push({ id, partners, status, kind: 'marriage' });
  children.forEach(child => partners.forEach(p => parent(p, child, kind, id)));
}
person('edmund', 'Edmund', 'Bennett', 1905);
person('agnes', 'Agnes', 'Bennett', 1907);
person('walter', 'Walter', 'Stone', 1908);
person('beatrice', 'Beatrice', 'Stone', 1910);
family('early-bennett', ['edmund', 'agnes'], ['arthur']);
family('early-stone', ['walter', 'beatrice'], ['eleanor']);
const surnames = ['Foster', 'Palmer', 'Sutton', 'Porter', 'Walsh', 'Spencer', 'Abbott'];
const names = ['Adrian', 'Marion', 'Sylvia', 'Daniel', 'Claire', 'Julian', 'Martha', 'Simon', 'Leah', 'Rowan', 'Quinn', 'Blair', 'Ellis', 'Sage', 'Robin', 'Casey', 'Avery', 'Jamie', 'Taylor', 'Reese', 'Jordan', 'Riley', 'Morgan', 'Cameron', 'Skyler', 'Parker', 'Logan', 'Bailey'];
for (let i = 0; i < 7; i++) {
  const id = n => `c${i + 1}-${n}`, year = 1927 + i * 3;
  const years = [year, year + 1, year + 4, ...[23,24,26,27,29,29].map(n => year+n), ...[45,48,50,48,51,53,51,54,56].map(n => year+n), ...[45,48,51,54].map(n => year+n), ...[68,71,71,74,74,77].map(n => year+n)];
  for (let n = 0; n < 28; n++) {
    // Deliberate reuse of licensed stock models tests 36 photo instances; identities remain unique.
    const model = n === 0 ? 'arthur' : n === 3 ? 'david' : n === 9 ? 'emma' : n === 22 ? 'ava' : null;
    person(id(n), names[(n + i * 3) % names.length], surnames[i], years[n], model);
  }
  parent('edmund', id(0)); parent('agnes', id(0));
  family(`c${i}-first`, [id(0), id(1)], [id(3), id(5)], 'former');
  family(`c${i}-second`, [id(0), id(2)], [id(7)]);
  for (let j = 0; j < 3; j++) {
    const children = [id(9+j*3), id(10+j*3), id(11+j*3)];
    family(`c${i}-child-${j}`, [id(3+j*2), id(4+j*2)], children.slice(0,2));
    if (i === 2 && j === 1) parent(id(3+j*2), children[2]); // Other biological parent unknown.
    else for (const p of [id(3+j*2), id(4+j*2)]) parent(p, children[2], i === 4 && j === 2 ? 'adoptive' : 'biological');
  }
  family(`c${i}-grand-0`, [id(9), id(18)], [id(22), id(23)]);
  family(`c${i}-grand-1`, [id(12), id(19)], [id(24)]);
  family(`c${i}-grand-2`, [id(15), id(20)], [id(25), id(26)]);
  family(`c${i}-grand-3`, [id(16), id(21)], [id(27)]);
}
// Connect two new branches through an in-law's ancestry (no duplicate records).
parent('c1-0', 'c2-4'); parent('c1-1', 'c2-4');
for (const p of g.people) p.biologicalParentsComplete = g.parentages.filter(e => e.child === p.id && e.kind === 'biological').length === 2;
