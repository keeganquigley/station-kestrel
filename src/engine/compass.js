// Compass arithmetic for looking round and walking: bearings, turns, and which way each link lies.
// Yaw is a compass bearing in degrees: 0 north, 90 east. Pitch is degrees above the horizon.
// Pure arithmetic over the node graph. Nothing here draws or reads the browser.
import { NODES, ORDER } from '../data/nodes.js';

export const YAW = { N: 0, E: 90, S: 180, W: 270 };
export const rad = (d) => (d * Math.PI) / 180;
/** A bearing brought into 0 up to, but not including, 360. */
export const norm = (d) => ((d % 360) + 360) % 360;
/** The turn that takes you from bearing b to bearing a by the shorter way: clockwise positive, at most 180. */
export const turnBetween = (a, b) => {
  const d = norm(a - b);
  return d > 180 ? d - 360 : d;
};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Ease in and out: 0 to 1, slow at both ends. */
export const smooth = (k) => k * k * (3 - 2 * k);
/** The compass point a bearing is nearest. */
export const nearestFace = (yaw) => ORDER[Math.round(norm(yaw) / 90) % 4];
/** The pitch each standing place was composed for, per compass facing. */
export const composedPitch = (n, face) => (Math.atan(((n.tilt && n.tilt[face]) || 0) - 0.05) * 180) / Math.PI;
/** The bearing of one point from another. Points are [x, y, z] with +x east and +z south. */
export const bearingTo = (from, to) => norm((Math.atan2(to[0] - from[0], -(to[2] - from[2])) * 180) / Math.PI);

/** Places you can walk to from here, with the compass bearing each lies on. */
export function linksFrom(nodeId) {
  const n = NODES[nodeId];
  if (n.cam) return [];
  return Object.entries(n.fwd).map(([face, link]) => {
    const l = typeof link === 'string' ? { to: link } : link;
    const t = NODES[l.to];
    // a fade leads to the other realm, which is nowhere near: point it the way the link is labelled
    return { ...l, face: l.face || face, bearing: l.fade ? YAW[face] : bearingTo(n.pos, t.pos || t.look) };
  });
}

/** Of these links, the one lying nearest a bearing, if any lies within so many degrees and may be walked. */
export function nearestLink(links, bearing, within, passable = () => true) {
  let best = null,
    bestOff = within;
  for (const l of links) {
    const off = Math.abs(turnBetween(l.bearing, bearing));
    if (off <= bestOff && passable(l)) {
      best = l;
      bestOff = off;
    }
  }
  return best;
}

/** The next stop round from a bearing, in steps of stepDeg: dir +1 to the right, -1 to the left. On a stop already, it is the one after. */
export function nextStop(yaw, dir, stepDeg) {
  const steps = yaw / stepDeg;
  return norm((dir > 0 ? Math.floor(steps + 1e-6) + 1 : Math.ceil(steps - 1e-6) - 1) * stepDeg);
}
