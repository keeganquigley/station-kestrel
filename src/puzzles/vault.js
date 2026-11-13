// Puzzle 4: the vault's four thumbwheels. Pure logic, no rendering.
import { COMBINATION } from './cipher.js';

export function initial() {
  return { wheels: [0, 0, 0, 0], open: false };
}

export function spin(s, index, dir) {
  if (s.open) return s;
  const wheels = s.wheels.slice();
  wheels[index] = (wheels[index] + dir + 10) % 10;
  return { ...s, wheels };
}

export const reading = (s) => s.wheels.join('');

/** Returns { state, result } where result is 'open' | 'dead' (no power) | 'wrong' | 'already'. */
export function tryHandle(s, hasPower) {
  if (s.open) return { state: s, result: 'already' };
  if (!hasPower) return { state: s, result: 'dead' };
  if (reading(s) === COMBINATION) return { state: { ...s, open: true }, result: 'open' };
  return { state: s, result: 'wrong' };
}
