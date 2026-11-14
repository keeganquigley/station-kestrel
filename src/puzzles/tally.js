// Chapter three, puzzle 2: the tally board in the diving store.
// Four numbered brass tallies were issued to the four of them. The property cage stays barred
// until each number is set against its owner. Pure logic, no rendering.

export const NAMES = ['harlan', 'voss', 'lund', 'okafor'];

/** The numbers stamped on the four tallies, lowest first. */
export const TALLIES = [14, 23, 31, 46];

/** Who was issued which. */
export const OWNER = { harlan: 46, voss: 23, lund: 14, okafor: 31 };

/**
 * Four remarks, one from each of them, left in four different places.
 * `holds` says whether an arrangement {name: tally} agrees with the remark.
 */
export const REMARKS = [
  { by: 'lund', holds: (o) => o.voss > o.lund },
  { by: 'harlan', holds: (o) => o.harlan > o.voss },
  { by: 'okafor', holds: (o) => o.okafor > o.voss },
  { by: 'voss', holds: (o) => o.harlan % 2 === 0 },
];

/** Every way of handing four tallies to four people. */
export function arrangements() {
  const out = [];
  const go = (left, acc) => {
    if (!left.length) return out.push(Object.fromEntries(NAMES.map((n, i) => [n, acc[i]])));
    left.forEach((t, i) => go([...left.slice(0, i), ...left.slice(i + 1)], [...acc, t]));
  };
  go(TALLIES, []);
  return out;
}

/** The arrangements that agree with a set of remarks. */
export const consistent = (remarks = REMARKS) => arrangements().filter((o) => remarks.every((r) => r.holds(o)));

export function initial() {
  const set = {};
  for (const n of NAMES) set[n] = TALLIES[0];
  return { set, open: false };
}

/** Turn the drum under a name to the next or the previous tally number. */
export function spin(s, name, dir) {
  if (s.open) return s;
  const i = TALLIES.indexOf(s.set[name]), n = TALLIES.length;
  return { ...s, set: { ...s.set, [name]: TALLIES[(i + dir + n) % n] } };
}

export const correct = (s) => NAMES.every((n) => s.set[n] === OWNER[n]);

/** Pull the release bar. result: 'open' | 'held' | 'already' */
export function pullBar(s) {
  if (s.open) return { state: s, result: 'already' };
  if (correct(s)) return { state: { ...s, open: true }, result: 'open' };
  return { state: s, result: 'held' };
}
