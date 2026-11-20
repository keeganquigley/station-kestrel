// Chapter three, puzzle 3: the picture telegraph in the dock office.
// Papers are filed against a vessel's hull number and the tally of whoever signed them.
// Pure logic, no rendering.
import { OWNER, TALLIES } from './tally.js';
import { turned, read } from './wheels.js';

/** Painted on the boat's conning tower. Gone from the boat itself; plain in the photograph. */
export const HULL = '306';

/** Who signed for the party, as the berth log has it. */
export const SIGNED_BY = 'voss';

const two = (n) => String(n).padStart(2, '0');

/** The five figures that call the paper down the wire. */
export const DOCKET = HULL + two(OWNER[SIGNED_BY]);

export const WHEELS = DOCKET.length;

export function initial() {
  return { wheels: Array(WHEELS).fill(0), drawn: false };
}

export function spin(s, index, dir) {
  if (s.drawn) return s;
  return { ...s, wheels: turned(s.wheels, index, dir) };
}

export const reading = (s) => read(s.wheels);

/**
 * Press CALL.
 * result: 'drawn' | 'nil' (right boat, a tally nobody signed under) | 'unknown' | 'dead' | 'already'
 */
export function call(s, lineLive) {
  if (s.drawn) return { state: s, result: 'already' };
  if (!lineLive) return { state: s, result: 'dead' };
  const r = reading(s);
  if (r === DOCKET) return { state: { ...s, drawn: true }, result: 'drawn' };
  const tally = Number(r.slice(HULL.length));
  if (r.startsWith(HULL) && TALLIES.includes(tally)) return { state: s, result: 'nil' };
  return { state: s, result: 'unknown' };
}
