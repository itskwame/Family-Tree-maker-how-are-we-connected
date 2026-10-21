import { fixture } from './fixture.js';

// Deterministic fictional extension. Generation and position are NOT stored:
// the existing engine derives them exclusively from these relationships.
export const fixture100 = structuredClone(fixture);
const surnames = ['Morgan', 'Cole', 'Brooks', 'Turner', 'Hayes'];
const names = [
  ['Alice', 'Oscar', 'Ivy', 'Finn', 'Lily', 'Owen', 'Ruby', 'Max', 'Ella', 'Jude', 'Isla', 'Adam', 'Milo', 'Evie', 'Hazel'],
  ['George', 'Rose', 'Freya', 'Henry', 'Daisy', 'Isaac', 'Louis', 'Lucy', 'Nina', 'Alex', 'Eden', 'Felix', 'Otis', 'Esme', 'Mabel'],
  ['Edward', 'Vera', 'Hugo', 'Cora', 'Arlo', 'Maya', 'Eliza', 'Leon', 'Lara', 'Joel', 'Anya', 'Eric', 'Rory', 'Lena', 'Ada'],
  ['Frank', 'June', 'Oscar', 'Nell', 'Amelia', 'Aaron', 'Harvey', 'Millie', 'Elise', 'Sean', 'Tessa', 'Liam', 'Alfie', 'Poppy', 'Faye'],
  ['Victor', 'Pearl', 'Edith', 'Dylan', 'Willa', 'Ryan', 'Holly', 'Toby', 'Naomi', 'Evan', 'Celia', 'Miles', 'Luca', 'Elsie', 'Olive'],
];
const roles = ['root', 'spouse', 'a', 'ap', 'b', 'bp', 'aa', 'ab', 'ba', 'bb', 'aap', 'bap', 'aaa', 'baa', 'second'];
const births = [1954, 1955, 1975, 1975, 1982, 1981, 1997, 2000, 2003, 2006, 1997, 2002, 2020, 2024, 1959];
function parent(parent, child, kind = 'biological', union) {
  fixture100.parentages.push({ id: `${parent}>${child}`, parent, child, kind, union });
}
function family(id, partners, children, status = 'partnered', kind = 'biological') {
  fixture100.partnerships.push({ id, partners, status, kind: 'marriage' });
  for (const child of children) for (const p of partners) parent(p, child, kind, id);
}
for (let branch = 0; branch < 5; branch++) {
  const prefix = `b${branch + 1}`, id = role => `${prefix}-${role}`;
  roles.forEach((role, i) => fixture100.people.push({
    id: id(role), first: names[branch][i], last: surnames[branch],
    born: births[i] + (branch % 2), gender: 'unspecified', photo: null,
    biologicalParentsComplete: !['spouse', 'ap', 'bp', 'aap', 'bap', 'second'].includes(role),
  }));
  parent('arthur', id('root')); parent('eleanor', id('root'));
  family(`${prefix}-first`, [id('root'), id('spouse')], [id('a')], 'former');
  family(`${prefix}-remarriage`, [id('root'), id('second')], [id('b')]);
  family(`${prefix}-a`, [id('a'), id('ap')], [id('aa'), id('ab')]);
  family(`${prefix}-b`, [id('b'), id('bp')], [id('ba')]);
  if (branch === 1) {
    parent(id('b'), id('bb'), 'adoptive', `${prefix}-b`);
    parent(id('bp'), id('bb'), 'adoptive', `${prefix}-b`);
    fixture100.people.find(p => p.id === id('bb')).biologicalParentsComplete = false;
  } else if (branch === 2) {
    parent(id('b'), id('bb'));
    fixture100.people.find(p => p.id === id('bb')).biologicalParentsComplete = false;
  } else {
    parent(id('b'), id('bb'), 'biological', `${prefix}-b`);
    parent(id('bp'), id('bb'), 'biological', `${prefix}-b`);
  }
  family(`${prefix}-aa`, [id('aa'), id('aap')], [id('aaa')]);
  family(`${prefix}-ba`, [id('ba'), id('bap')], [id('baa')]);
}
// A second ancestry route connects Reed descendants to the new Morgan branch.
// This is pedigree collapse, not duplicate person records.
parent('samuel', 'b1-spouse'); parent('iris', 'b1-spouse');
fixture100.people.find(p => p.id === 'b1-spouse').born = 1956;
fixture100.people.find(p => p.id === 'b1-spouse').biologicalParentsComplete = true;
