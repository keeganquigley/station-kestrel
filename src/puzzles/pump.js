// Chapter two, puzzle 1: prime the siphon. Three tanks, three valves. Pure logic, no rendering.

/** Tank sizes in gallons, left to right on the wall: header, feed, measure. */
export const CAPACITY = [8, 5, 3];

/** The tank the pump draws its priming charge from. */
export const FEED = 1;

/** What the siphon wants in the feed tank, exactly. Written in Lund's notebook. */
export const CHARGE = 4;

/** The valves on the wall, each joining two tanks: [left tank, right tank]. */
export const VALVES = [
  [0, 1],
  [1, 2],
  [0, 2],
];

const FULL = () => [CAPACITY[0], 0, 0];

export function initial() {
  return { levels: FULL(), drained: false };
}

/** Open a valve one way: water runs until the source is empty or the other tank is full. */
export function pour(s, from, to) {
  if (s.drained || from === to) return { state: s, moved: 0 };
  const moved = Math.min(s.levels[from], CAPACITY[to] - s.levels[to]);
  if (moved <= 0) return { state: s, moved: 0 };
  const levels = s.levels.slice();
  levels[from] -= moved;
  levels[to] += moved;
  return { state: { ...s, levels }, moved };
}

/** dir -1 runs water toward the valve's left tank, +1 toward its right tank. */
export function turnValve(s, valve, dir) {
  const [left, right] = VALVES[valve];
  return dir < 0 ? pour(s, right, left) : pour(s, left, right);
}

/** Pull the priming lever. result: 'drained' | 'lost' (wrong charge, tanks reset) | 'already' */
export function prime(s) {
  if (s.drained) return { state: s, result: 'already' };
  if (s.levels[FEED] === CHARGE) return { state: { ...s, drained: true }, result: 'drained' };
  return { state: { ...s, levels: FULL() }, result: 'lost' };
}

/** Shortest list of [valve, dir] turns that puts the charge in the feed tank, or null. */
export function solve() {
  const key = (l) => l.join(',');
  const start = initial();
  const seen = new Set([key(start.levels)]);
  let frontier = [{ s: start, path: [] }];
  while (frontier.length) {
    const next = [];
    for (const { s, path } of frontier) {
      if (s.levels[FEED] === CHARGE) return path;
      for (let v = 0; v < VALVES.length; v++) {
        for (const dir of [-1, 1]) {
          const { state, moved } = turnValve(s, v, dir);
          if (!moved || seen.has(key(state.levels))) continue;
          seen.add(key(state.levels));
          next.push({ s: state, path: path.concat([[v, dir]]) });
        }
      }
    }
    frontier = next;
  }
  return null;
}
