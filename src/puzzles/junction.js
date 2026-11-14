// Chapter two, puzzle 2: land the signal cable's five cores on the right terminals.
// Pure logic, no rendering.

export const CORES = ['red', 'blue', 'green', 'yellow', 'white'];
export const TERMINALS = [1, 2, 3, 4, 5];

/** The true wiring: which terminal each core belongs on. */
export const WIRING = { red: 3, blue: 1, green: 5, yellow: 4, white: 2 };

/** The lines of Voss's cable schedule that survive. The bottom of the page is torn off. */
export const SCHEDULE_LINES = ['red', 'blue', 'green'];

/** Cores that carry a stamped terminal tag where they run along the tunnel wall. */
export const TAGGED = ['red', 'yellow'];

export function initial() {
  const sel = {};
  for (const c of CORES) sel[c] = 1;
  return { sel, live: false };
}

export function spin(s, core, dir) {
  if (s.live) return s;
  const n = TERMINALS.length;
  const sel = { ...s.sel, [core]: ((s.sel[core] - 1 + dir + n) % n) + 1 };
  return { ...s, sel };
}

export const correct = (s) => CORES.every((c) => s.sel[c] === WIRING[c]);

/** Throw the isolator. result: 'live' | 'fault' | 'already' */
export function throwIsolator(s) {
  if (s.live) return { state: s, result: 'already' };
  if (correct(s)) return { state: { ...s, live: true }, result: 'live' };
  return { state: s, result: 'fault' };
}

/**
 * What a careful player can know: the schedule lines and the tags give some cores outright,
 * and a core is also settled if only one terminal is left for it. Returns the deduced wiring.
 */
export function deduce() {
  const known = {};
  for (const c of SCHEDULE_LINES) known[c] = WIRING[c];
  for (const c of TAGGED) known[c] = WIRING[c];
  const rest = CORES.filter((c) => !(c in known));
  const free = TERMINALS.filter((t) => !Object.values(known).includes(t));
  if (rest.length === 1 && free.length === 1) known[rest[0]] = free[0];
  return known;
}
