// Chapter three, puzzle 1: develop the film from the camera on the quay.
// Three baths, three timers and a safelight. Pure logic, no rendering.

/** What the thermometer standing in the developer reads, in degrees C. */
export const TEMPERATURE = 16;

/** The chart on the darkroom wall: developing time in minutes at each temperature. */
export const CHART = [
  [14, 11],
  [16, 9],
  [18, 7],
  [20, 6],
  [22, 5],
];

/** The routine card in the dock office: the stop bath is fixed, and the fixer goes by the developer. */
export const STOP_MINUTES = 1;
export const FIX_FACTOR = 2;

export const BATHS = ['developer', 'stop', 'fixer'];

/** The times that give a clean negative. */
export function target() {
  const dev = CHART.find(([t]) => t === TEMPERATURE)[1];
  return [dev, STOP_MINUTES, dev * FIX_FACTOR];
}

export function initial() {
  // two thumbwheels a timer: tens and units of minutes
  return { wheels: [0, 0, 0, 0, 0, 0], safe: false, printed: false };
}

export function spin(s, index, dir) {
  if (s.printed) return s;
  const wheels = s.wheels.slice();
  wheels[index] = (wheels[index] + dir + 10) % 10;
  return { ...s, wheels };
}

/** Minutes set on each of the three timers. */
export const minutes = (s) => [0, 1, 2].map((i) => s.wheels[2 * i] * 10 + s.wheels[2 * i + 1]);

/** White light or safelight. Once the print is made the lamp no longer matters. */
export function toggleLight(s) {
  return { ...s, safe: !s.safe };
}

/**
 * Run a strip of film through the three baths.
 * result: 'nofilm' | 'fogged' | 'thin' | 'dense' | 'streaked' | 'unfixed' | 'bleached' | 'good' | 'already'
 * A spoiled strip costs nothing but the time: there is plenty more on the roll.
 */
export function run(s, hasFilm) {
  if (s.printed) return { state: s, result: 'already' };
  if (!hasFilm) return { state: s, result: 'nofilm' };
  if (!s.safe) return { state: s, result: 'fogged' };
  const [dev, stop, fix] = minutes(s),
    [wantDev, wantStop, wantFix] = target();
  if (dev < wantDev) return { state: s, result: 'thin' };
  if (dev > wantDev) return { state: s, result: 'dense' };
  if (stop !== wantStop) return { state: s, result: 'streaked' };
  if (fix < wantFix) return { state: s, result: 'unfixed' };
  if (fix > wantFix) return { state: s, result: 'bleached' };
  return { state: { ...s, printed: true }, result: 'good' };
}
