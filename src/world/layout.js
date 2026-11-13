// Shared measurements for the island. Metres. +x east, +z south, +y up.

export const P = 2.5; // height of the plateau the station stands on
export const FLOOR = P + 0.12; // finished floor level inside the station
export const SHED_FLOOR = P + 0.1;
export const EYE = 1.62;
export const DECK = 0.8; // top of the jetty deck

export const MAST = { x: -22, z: 9, h: 11 };
export const SHED = { x0: 16, x1: 22, z0: 3.5, z1: 8.5, h: 2.6 };
export const STN = { x0: -11, x1: 16, z0: -28, z1: -10, h: 3.4 };
export const CEIL = 2.8;

export const ROOMS = {
  vest: { x0: -2.5, x1: 2.5, z0: -14.5, z1: -10.3 },
  ops: { x0: -4.5, x1: 4.5, z0: -24, z1: -14.5 },
  office: { x0: -10.5, x1: -4.5, z0: -23.5, z1: -16.5 },
  corr: { x0: 4.5, x1: 10.2, z0: -21.6, z1: -18.4 },
  vault: { x0: 10.6, x1: 15.5, z0: -23, z1: -17 },
};

/** Compass facings as [dx, dz]. */
export const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

/** rotation.y that makes an object built facing +z face the given compass direction. */
export const RY = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 };
