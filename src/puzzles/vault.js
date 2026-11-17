// Puzzle 4: the vault's four thumbwheels. Pure logic, no rendering.
import { COMBINATION } from './cipher.js';
import { turned, read } from './wheels.js';

export function initial() {
  return { wheels: [0, 0, 0, 0], open: false };
}

export function spin(s, index, dir) {
  if (s.open) return s;
  return { ...s, wheels: turned(s.wheels, index, dir) };
}

export const reading = (s) => read(s.wheels);

/** Returns { state, result } where result is 'open' | 'dead' (no power) | 'wrong' | 'already'. */
export function tryHandle(s, hasPower) {
  if (s.open) return { state: s, result: 'already' };
  if (!hasPower) return { state: s, result: 'dead' };
  if (reading(s) === COMBINATION) return { state: { ...s, open: true }, result: 'open' };
  return { state: s, result: 'wrong' };
}
