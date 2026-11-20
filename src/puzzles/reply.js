// Chapter two, puzzle 3: answer the door. The same pad as chapter one, run the other way.
// Pure logic, no rendering.
import { PAD, PLAIN, add, sheetLabel } from './cipher.js';
import { turned, read } from './wheels.js';

/** The sheet the door names. Not the one the broadcast used. */
export const CHALLENGE_SHEET = 4;

/** What it wants to hear: its own date back. Day, then year. */
export const MESSAGE = PLAIN.slice(0, 2);

/** The eight figures to set on the sender. */
export const EXPECTED = MESSAGE.map((g, i) => add(g, PAD[CHALLENGE_SHEET][i])).join('');

export const WHEELS = EXPECTED.length;

export const challengeLabel = () => sheetLabel(CHALLENGE_SHEET);

export function initial() {
  return { wheels: Array(WHEELS).fill(0), open: false };
}

export function spin(s, index, dir) {
  if (s.open) return s;
  return { ...s, wheels: turned(s.wheels, index, dir) };
}

export const reading = (s) => read(s.wheels);

/** Press SEND. result: 'open' | 'dead' (line not connected) | 'wrong' | 'already' */
export function send(s, lineLive) {
  if (s.open) return { state: s, result: 'already' };
  if (!lineLive) return { state: s, result: 'dead' };
  if (reading(s) === EXPECTED) return { state: { ...s, open: true }, result: 'open' };
  return { state: s, result: 'wrong' };
}
