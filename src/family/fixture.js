// All people and dates in this file are fictional. No network or Supabase data.
export const portraitIds = ['arthur', 'iris', 'david', 'helen', 'emma', 'lucas', 'ava', 'theo'];
const rows = [
  ['arthur', 'Arthur', 'Bennett', 1932, 'male', 2016],
  ['eleanor', 'Eleanor', 'Bennett', 1936, 'female', 2021],
  ['samuel', 'Samuel', 'Reed', 1934, 'male', 2019],
  ['iris', 'Iris', 'Reed', 1938, 'female'],
  ['david', 'David', 'Bennett', 1958, 'male'],
  ['helen', 'Helen', 'Bennett', 1961, 'female'],
  ['thomas', 'Thomas', 'Bennett', 1965, 'male'],
  ['clara', 'Clara', 'Reed', 1960, 'female'],
  ['peter', 'Peter', 'Ellis', 1960, 'male'],
  ['nora', 'Nora', 'Wells', 1967, 'female'],
  ['ruth', 'Ruth', 'Lane', 1969, 'female'],
  ['emma', 'Emma', 'Bennett', 1984, 'female'],
  ['jack', 'Jack', 'Bennett', 1987, 'male'],
  ['leo', 'Leo', 'Bennett', 1996, 'male'],
  ['sophie', 'Sophie', 'Ellis', 1988, 'female'],
  ['ben', 'Ben', 'Ellis', 1991, 'male'],
  ['olivia', 'Olivia', 'Bennett', 1990, 'female'],
  ['noah', 'Noah', 'Bennett', 1992, 'male'],
  ['lucas', 'Lucas', 'Hart', 1983, 'male'],
  ['grace', 'Grace', 'Shaw', 1988, 'female'],
  ['ava', 'Ava', 'Hart', 2010, 'female'],
  ['theo', 'Theo', 'Hart', 2013, 'male'],
  ['mia', 'Mia', 'Bennett', 2015, 'female'],
  ['ethan', 'Ethan', 'Ellis', 2017, 'male'],
  ['zoe', 'Zoe', 'Ellis', 2020, 'female'],
];
const families = [
  ['founders', ['arthur', 'eleanor'], ['david', 'helen', 'thomas']],
  ['reeds', ['samuel', 'iris'], ['clara']],
  ['david-clara', ['david', 'clara'], ['emma', 'jack'], 'former'],
  ['david-ruth', ['david', 'ruth'], ['leo']],
  ['helen-peter', ['helen', 'peter'], ['sophie', 'ben']],
  ['thomas-nora', ['thomas', 'nora'], ['olivia', 'noah']],
  ['emma-lucas', ['emma', 'lucas'], ['ava', 'theo']],
  ['jack-grace', ['jack', 'grace'], ['mia']],
  // Deliberate cousin partnership: tests a family network rather than a tree.
  ['sophie-noah', ['sophie', 'noah'], ['ethan', 'zoe']],
];
export const fixture = {
  people: rows.map(([id, first, last, born, gender, died]) => ({
    id, first, last, born, died, gender,
    photo: portraitIds.includes(id) ? `/family-portraits/${id}.jpg` : null,
    biologicalParentsComplete: families.some(([, , children]) => children.includes(id)),
  })),
  partnerships: families.map(([id, partners, , status]) => ({
    id, partners, status: status || 'partnered',
    kind: ['david-ruth', 'sophie-noah'].includes(id) ? 'partnership' : 'marriage',
  })),
  parentages: families.flatMap(([union, parents, children]) =>
    children.flatMap(child => parents.map(parent => ({
      id: `${parent}>${child}`, parent, child, kind: 'biological', union,
    })))),
};
export const nameOf = person => `${person.first} ${person.last}`;
