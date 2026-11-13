// Puzzle 2: aim the mast and tune the receiver. Pure logic, no rendering.

/** K-7's daily schedule as written in the intercept log: [from, to, kHz]. */
export const SCHEDULE = [
  ['0000', '0400', 4620],
  ['0400', '0800', 5870],
  ['0800', '1200', 7340],
  ['1200', '1600', 9130],
  ['1600', '2000', 6990],
  ['2000', '2400', 3810],
];

/** The time shown on the stopped flip clock in the operations room. */
export const STOPPED_CLOCK = '16:50';

/** Bearing (degrees true) from the mast to the source, as plotted on the office chart. */
export const TARGET_BEARING = 50;

export const MIN_KHZ = 3000;
export const MAX_KHZ = 10000;
export const BEARING_STEP = 10;

export function slotFor(clock) {
  const t = clock.replace(':', '');
  const row = SCHEDULE.find(([from, to]) => t >= from && t < to);
  return row ? row[2] : null;
}

export const TARGET_KHZ = slotFor(STOPPED_CLOCK);

export function initial() {
  return { khz: 5000, bearing: 300, printed: false };
}

export function tune(s, deltaKhz) {
  const khz = Math.max(MIN_KHZ, Math.min(MAX_KHZ, s.khz + deltaKhz));
  return { ...s, khz };
}

export function rotate(s, deltaDeg) {
  const bearing = (((s.bearing + deltaDeg) % 360) + 360) % 360;
  return { ...s, bearing };
}

export function bearingError(s) {
  const d = Math.abs(s.bearing - TARGET_BEARING) % 360;
  return d > 180 ? 360 - d : d;
}

/** 0..1 reading for the signal meter. */
export function signal(s) {
  const df = Math.abs(s.khz - TARGET_KHZ);
  const f = df === 0 ? 1 : df <= 100 ? 0.45 * (1 - df / 120) : 0;
  const e = bearingError(s);
  const b = e === 0 ? 1 : Math.max(0.12, 0.7 * (1 - e / 120));
  return f * b;
}

/** 'none' | 'near' (close on the dial) | 'faint' (on frequency, mast off) | 'locked' */
export function reception(s) {
  const df = Math.abs(s.khz - TARGET_KHZ);
  if (df > 100) return 'none';
  if (df > 0) return 'near';
  return bearingError(s) === 0 ? 'locked' : 'faint';
}

/** Once the set is powered and locked, the teleprinter prints and the paper stays printed. */
export function settle(s, hasPower) {
  if (hasPower && !s.printed && reception(s) === 'locked') return { ...s, printed: true };
  return s;
}

export function formatKhz(khz) {
  const mhz = Math.floor(khz / 1000);
  const rest = String(khz % 1000).padStart(3, '0');
  return `${mhz}.${rest}`;
}
