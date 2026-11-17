// A row of thumbwheels, each showing one figure from 0 to 9. The vault lock, the sender at the
// blast door, the darkroom timers and the picture telegraph are all set on one. Pure logic, no rendering.

/** The row with one wheel turned a step, up (+1) or down (-1). A wheel runs round from 9 to 0 and back. */
export function turned(wheels, index, dir) {
  const out = wheels.slice();
  out[index] = (out[index] + dir + 10) % 10;
  return out;
}

/** The figures as they read across the row. */
export const read = (wheels) => wheels.join('');
