// Shared measurements for the island. Metres. +x east, +z south, +y up.

export const P = 2.5; // height of the plateau the station stands on
export const FLOOR = P + 0.12; // finished floor level inside the station
export const SHED_FLOOR = P + 0.1;
export const EYE = 1.62;
export const DECK = 0.8; // top of the jetty deck

export const MAST = { x: -22, z: 9, h: 11 };
export const SHED = { x0: 16, x1: 22, z0: 3.5, z1: 8.5, h: 2.6 };
/** The station's outer walls. wall is their thickness, door half the width of the way in. */
export const STN = { x0: -11, x1: 16, z0: -28, z1: -10, h: 3.4, wall: 0.3, door: 0.75 };
export const CEIL = 2.8;

export const ROOMS = {
  vest: { x0: -2.5, x1: 2.5, z0: -14.5, z1: -10.3 },
  ops: { x0: -4.5, x1: 4.5, z0: -24, z1: -14.5 },
  office: { x0: -10.5, x1: -4.5, z0: -23.5, z1: -16.5 },
  corr: { x0: 4.5, x1: 10.2, z0: -21.6, z1: -18.4 },
  vault: { x0: 10.6, x1: 15.5, z0: -23, z1: -17 },
};

/** rotation.y that makes an object built facing +z face the given compass direction. */
export const RY = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 };

// ---- The Subterranean Station ----
// Built far below and well clear of the island, so neither realm can ever show in the other.
// You only get between them by the fade on the stairs.

export const UF = -40; // floor of the upper tunnel and the three rooms
export const LF = UF - 0.8; // floor of the lower stretch, under water until the pump is primed
export const ROOM_H = 2.5;

/** The tunnel runs north from the stair foot (z1) to the blast door (z0). hw is half its width. */
export const TUNNEL = { hw: 1.5, h: 2.6, z0: -44, z1: 0, steps: -28, wall: 0.2 };

export const QUARTERS = {
  kitchen: { x0: 1.7, x1: 7.2, z0: -12, z1: -6.5, door: -9 },
  mess: { x0: -7.2, x1: -1.7, z0: -12, z1: -6.5, door: -9 },
  bunks: { x0: 1.7, x1: 7.2, z0: -22, z1: -16.5, door: -19 },
};

// ---- Berth K7 ----
// The pen under the island: a sea cave with a quay down one side. A third realm, further down
// again, reached only by the fade at the bottom of the rock passage.

export const PF = -90; // top of the quay
export const WATER = PF - 1.1;

/** The cavern. x0 is the west rock face, edge the quay's edge, x1 the built wall the rooms open off. */
export const PEN = { x0: -11, edge: 1.5, x1: 8, z0: -152, z1: -108, south: -103, roof: 9, bed: -4.5, shelf: 3.6 };

/** The boat lies bow north, toward the sea gate. y is the height of her axis. */
export const BOAT = { x: -3.2, z: -130, len: 18, r: 1.55, y: WATER + 0.35 };

export const DOCK = {
  office: { x0: 8.3, x1: 13.5, z0: -120.75, z1: -115.25, door: -118 },
  store: { x0: 8.3, x1: 13.5, z0: -132.75, z1: -127.25, door: -130 },
  darkroom: { x0: 8.3, x1: 13.5, z0: -144.75, z1: -139.25, door: -142 },
};
