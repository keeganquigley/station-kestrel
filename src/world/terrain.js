// Height field for Holland Island. No DOM or Three.js here so the node graph can use it too.
import { P } from './layout.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);

function hash(ix, iz) {
  let h = (ix * 374761393 + iz * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = smooth(x - ix), fz = smooth(z - iz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

export function fbm(x, z, octaves = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) {
    v += amp * noise(x * f, z * f);
    amp *= 0.5;
    f *= 2.03;
  }
  return v;
}

/** 1 on the levelled plateau, falling to 0 sixteen metres beyond its edge. */
export function plateau(x, z) {
  const qx = Math.abs(x) - 24, qz = Math.abs(z + 9) - 21;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qz, 0));
  const d = outside + Math.min(Math.max(qx, qz), 0) - 6;
  return smooth(1 - clamp(d / 16, 0, 1));
}

export function terrainH(x, z) {
  const t = plateau(x, z);
  let h = -2.2 + (P + 2.2) * t;
  // the ridge behind the station
  h += 10 * Math.exp(-(((z + 52) / 10) ** 2)) * Math.exp(-((x / 48) ** 2));
  // a low headland to the east
  h += 5 * Math.exp(-(((x - 52) / 12) ** 2)) * Math.exp(-(((z - 2) / 22) ** 2));
  // rough ground away from the levelled area
  h += (fbm(x * 0.07, z * 0.07) - 0.5) * 3.2 * (1 - t);
  h += (fbm(x * 0.4, z * 0.4, 2) - 0.5) * 0.35 * (1 - t);
  return h;
}

function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz), 0, 1);
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}

const PATHS = [
  [0, 27, 0, -9.5],
  [0, 6, 16, 6],
  [0, 7, -20.5, 9],
];

/** Distance to the nearest trodden path. */
export function pathDist(x, z) {
  let d = Infinity;
  for (const [ax, az, bx, bz] of PATHS) d = Math.min(d, segDist(x, z, ax, az, bx, bz));
  return d;
}
