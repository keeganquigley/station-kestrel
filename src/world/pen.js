// Berth K7: the cavern, the basin, the quay, the sea gate, and the boat that lies alongside.
import * as THREE from 'three';
import { PF, WATER, PEN, BOAT, DOCK, RY } from './layout.js';
import { mat, lampMat, setLamp } from './materials.js';
import { M, box, cyl, put, grp, strut, wall, decal, text, plate, hot, proxy, cuts, rng } from './kit.js';
import { VESSEL } from '../data/names.js';

export function buildPen(parent) {
  const root = grp(parent);
  const R = rng(7007);
  const { x0, edge, x1, z0, z1, south } = PEN;
  const ROOF = PF + PEN.roof,
    BED = PF + PEN.bed,
    SHELF = PF + PEN.shelf;
  const midZ = (z0 + z1) / 2,
    len = z1 - z0;

  root.add(new THREE.HemisphereLight(0x566870, 0x101416, 1.15));

  // ---------------------------------------------------------------- the cavern
  put(root, box(edge - x0 + 2, 0.5, len + 2, mat.cavern), (x0 + edge) / 2, BED - 0.25, midZ); // basin bed
  put(root, box(x1 + 0.3 - edge, PF - BED, len + 1, mat.quay, 2), (edge + x1 + 0.3) / 2, (PF + BED) / 2, midZ - 0.5); // the quay
  put(root, box(1, ROOF - BED + 1, south - z0 + 8, mat.cavern), x0 - 0.5, (ROOF + BED) / 2, (z0 + south) / 2); // west face
  put(root, box(x1 - x0 + 3, ROOF - BED + 1, 1, mat.cavern), (x0 + x1) / 2, (ROOF + BED) / 2, z0 - 0.5); // north face
  put(root, box(x1 - x0 + 3, 1, south - z0 + 4, mat.cavern), (x0 + x1) / 2, ROOF + 0.5, (z0 + south) / 2); // roof
  // the built wall down the east side, with the three doors
  const doorway = (zc) => ({ a: zc - 0.7, b: zc + 0.7, y0: 0, y1: 2.05 });
  wall(
    root,
    mat.quayWall,
    x1 + 0.15,
    z0 - 1,
    x1 + 0.15,
    south + 0.4,
    PF,
    ROOF - PF + 0.5,
    0.3,
    Object.values(DOCK).map((r) => doorway(r.door)),
  );
  for (const [key, label] of [
    ['office', 'DOCK OFFICE'],
    ['store', 'DIVING STORE'],
    ['darkroom', 'DARK ROOM'],
  ]) {
    const zc = DOCK[key].door;
    for (const dz of [-0.74, 0.74]) put(root, box(0.36, 2.09, 0.08, mat.darkMetal), x1 + 0.15, PF + 1.045, zc + dz);
    put(root, box(0.36, 0.08, 1.56, mat.darkMetal), x1 + 0.15, PF + 2.09, zc);
    const sign = plate(1.1, 0.16, label, { bg: '#1f2a2c', fg: '#d8d2ba', px: 360 });
    sign.rotation.y = RY.W;
    put(root, sign, x1 - 0.012, PF + 2.34, zc);
  }
  // the shelf across the south end, and the wall behind it with the mouth of the rock passage
  put(root, box(x1 - x0 + 2, SHELF - BED, z1 - south + 1.2, mat.quay, 2), (x0 + x1) / 2, (SHELF + BED) / 2, (z1 + south) / 2 + 0.6);
  wall(root, mat.cavern, x0 - 1, south, x1 + 0.4, south, SHELF, ROOF - SHELF + 0.5, 0.4, [{ a: 6.0, b: 7.9, y0: 0, y1: 2.4 }]);
  put(root, box(2.7, 0.4, 6.4, mat.cavern), 6.95, SHELF - 0.2, south + 3.2);
  put(root, box(2.7, 0.4, 6.4, mat.cavern), 6.95, SHELF + 2.6, south + 3.2);
  for (const x of [5.8, 8.1]) put(root, box(0.4, 3.2, 6.4, mat.cavern), x, SHELF + 1.2, south + 3.2);
  put(root, box(2.7, 3.2, 0.4, mat.black), 6.95, SHELF + 1.2, south + 6.2);

  // rock, heaped against every face so nothing reads as a box
  const lump = (x, y, z, s) => {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const f = 0.72 + 0.56 * R();
      p.setXYZ(k, p.getX(k) * f, p.getY(k) * f, p.getZ(k) * f);
    }
    g.computeVertexNormals();
    const rock = M(g, mat.cavern, false, false);
    rock.scale.set(s * (0.8 + R() * 0.6), s * (0.5 + R() * 0.45), s * (0.8 + R() * 0.7));
    return put(root, rock, x, y, z);
  };
  const overGallery = (z) => z > z1 - 2.5; // keep the roof clear of your head up on the shelf
  for (let i = 0; i < 46; i++) lump(x0 + 0.1 + R() * 0.5, WATER - 0.6 + R() * (PEN.roof + 1.4), z0 + R() * (south - z0), 1.2 + R() * 1.3); // west
  for (let i = 0; i < 70; i++) {
    const z = z0 + R() * (south - z0);
    lump(x0 + R() * (x1 - x0), ROOF + (overGallery(z) ? 0.5 : -0.1) + R() * 0.5, z, overGallery(z) ? 1.2 : 1.3 + R() * 1.4); // roof
  }
  for (let i = 0; i < 16; i++) lump(x0 + R() * (x1 - x0), PF + 5.6 + R() * 3.2, z0 + 0.2 + R() * 0.4, 1.1 + R() * 1.2); // over the gate
  for (let i = 0; i < 9; i++) lump(1.6 + R() * 6.4, PF + 0.2 + R() * 8.5, z0 + 0.05 + R() * 0.2, 0.9 + R() * 0.9); // north, beside the gate
  for (let i = 0; i < 26; i++) lump(x1 + 0.1 + R() * 0.3, PF + 5.6 + R() * 3.3, z0 + R() * (z1 - 3 - z0), 0.8 + R() * 0.7); // high on the east wall
  for (let i = 0; i < 14; i++) lump(x0 + R() * (edge - x0 - 1.5), WATER - 0.4 + R() * 3.6, z1 - 0.1 - R() * 0.3, 1.0 + R() * 1.0); // under the shelf, over the water
  for (let i = 0; i < 12; i++) lump(x0 + R() * (4.4 - x0), SHELF + 3.2 + R() * 2.2, south + 0.1 - R() * 0.2, 0.8 + R() * 0.6); // above the gallery

  // ---------------------------------------------------------------- the water
  const water = M(new THREE.PlaneGeometry(edge - x0, len, cuts(edge - x0), cuts(len)), mat.penWater, false, false);
  water.rotation.x = -Math.PI / 2;
  put(root, water, (x0 + edge) / 2, WATER, midZ);
  water.userData.nopick = true;
  put(root, box(0.3, 0.14, len, mat.darkMetal), edge + 0.15, PF + 0.01, midZ); // iron coping along the quay edge
  for (let z = z1 - 3; z > z0; z -= 5.5) put(root, box(0.16, 1.5, 0.3, mat.hullDark), edge - 0.08, PF - 0.75, z); // fender timbers

  // ---------------------------------------------------------------- gallery, rail and the iron stair
  const SX0 = 6.4,
    SX1 = x1,
    steps = 17,
    rise = PEN.shelf / (steps + 1),
    run = 0.28;
  for (let k = 1; k <= steps; k++) {
    const h = PEN.shelf - rise * k;
    put(root, box(SX1 - SX0, h, run, mat.quay, 2), (SX0 + SX1) / 2, PF + h / 2, z1 - run * (k - 0.5));
    put(root, box(SX1 - SX0, 0.03, run + 0.02, mat.darkMetal), (SX0 + SX1) / 2, PF + h + 0.012, z1 - run * (k - 0.5));
  }
  const foot = z1 - run * steps;
  strut(root, [SX0 + 0.04, SHELF + 1.0, z1], [SX0 + 0.04, PF + 1.0, foot], 0.025, mat.darkMetal);
  for (const k of [0, 6, 12, 17]) put(root, box(0.04, 1.0 + rise * 0.5, 0.04, mat.darkMetal), SX0 + 0.04, PF + PEN.shelf - rise * k + 0.5, z1 - run * k);
  for (let x = x0 + 0.6; x < SX0; x += 1.45) put(root, box(0.05, 1.05, 0.05, mat.darkMetal), x, SHELF + 0.525, z1 + 0.1);
  put(root, box(0.05, 1.05, 0.05, mat.darkMetal), SX0 - 0.03, SHELF + 0.525, z1 + 0.1);
  for (const y of [0.55, 1.03]) put(root, box(SX0 - x0, 0.04, 0.04, mat.darkMetal), (x0 + SX0) / 2, SHELF + y, z1 + 0.1);
  // a page wedged in the rail at the stair head
  const note = decal(0.2, 0.26, 420, (g, W, H) => {
    g.fillStyle = '#e4dcc2';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#1c2a5a';
    for (let i = 0; i < 7; i++) g.fillRect(8, 12 + i * 13, W - 16 - ((i * 23) % 30), 2);
  });
  note.rotation.z = -0.12;
  put(root, note, SX0 - 0.2, SHELF + 0.86, z1 + 0.135);
  hot(put(root, proxy(0.34, 0.4, 0.12), SX0 - 0.2, SHELF + 0.86, z1 + 0.14), { id: 'note-rush', nodes: ['gallery'], cursor: 'look', action: ['doc', 'note-rush'] });
  hot(put(root, proxy(1.9, 2.3, 0.3), 6.95, SHELF + 1.2, south + 0.6), { id: 'passage', nodes: ['gallery'], cursor: 'fwd', action: ['passage', 'beyond', 'S'] });

  // ---------------------------------------------------------------- lamps along the quay
  const pendant = (z, lit, power = 26) => {
    const y = PF + 4.4,
      x = 4.6;
    put(root, cyl(0.012, ROOF - y, mat.black, 5), x, (ROOF + y) / 2, z);
    put(root, cyl(0.26, 0.16, mat.darkMetal, 14, 0.06), x, y + 0.02, z);
    const m = lampMat(0x55524a);
    put(root, M(new THREE.SphereGeometry(0.075, 10, 8), m, false, false), x, y - 0.08, z);
    setLamp(m, 0xfff0d8, lit, 2.6);
    const l = new THREE.PointLight(0xf2e6cc, lit ? power : 0, 19, 1.5);
    l.position.set(x, y - 0.3, z);
    root.add(l);
  };
  pendant(-112, true, 24);
  pendant(-124, true);
  pendant(-136, false);
  pendant(-147, true, 22);
  // cold light off the roof, enough to see her by from one end to the other
  for (const [dz, power] of [
    [0.6, 62],
    [-6.5, 42],
    [6.5, 42],
  ]) {
    const l = new THREE.PointLight(0xb9c6c8, power, 24, 1.4);
    l.position.set(BOAT.x + 2.6, PF + 5.4, BOAT.z + dz);
    root.add(l);
  }
  const galleryLamp = new THREE.PointLight(0xf2e6cc, 9, 11, 1.5);
  galleryLamp.position.set(6.6, SHELF + 2.5, z1 + 1.6);
  root.add(galleryLamp);
  put(root, box(0.3, 0.08, 0.2, mat.darkMetal), 6.6, SHELF + 2.84, z1 + 1.6);

  // ---------------------------------------------------------------- berth marks
  const k7 = (w, h, px, wallMounted) =>
    decal(w, h, px, (g, W, H) => {
      g.fillStyle = wallMounted ? '#5b615e' : '#5c625f';
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 0.8;
      text(g, 'K7', W / 2, H / 2 + H * 0.04, { size: H * 0.86, color: '#d9d2b4', font: 'Arial, sans-serif' });
      g.globalAlpha = 1;
      for (let i = 0; i < 260; i++) {
        g.fillStyle = `rgba(92,98,95,${0.4 + R() * 0.6})`;
        g.fillRect(R() * W, R() * H, 2 + R() * 9, 1 + R() * 4);
      }
    });
  const flat = k7(2.8, 1.3, 90, false);
  flat.rotation.x = -Math.PI / 2;
  put(root, flat, 3.6, PF + 0.006, -123.4);
  const onWall = k7(1.7, 0.9, 150, true);
  onWall.rotation.y = RY.W;
  put(root, onWall, x1 - 0.012, PF + 3.05, -124);
  hot(put(root, proxy(2.8, 0.1, 1.3), 3.6, PF + 0.03, -123.4), { id: 'berth', nodes: ['quayS'], cursor: 'look', action: ['look', 'berth'] });

  // bollards and chains
  for (const z of [-122, -138]) {
    put(root, cyl(0.16, 0.5, mat.darkMetal, 12, 0.12), 2.1, PF + 0.25, z);
    put(root, cyl(0.2, 0.08, mat.darkMetal, 12), 2.1, PF + 0.52, z);
    strut(root, [2.1, PF + 0.36, z], [BOAT.x + 1.0, BOAT.y + BOAT.r * 0.82, z + (z > BOAT.z ? -0.8 : 0.8)], 0.03, mat.hullDark);
  }
  // stores landed at the south end and never moved
  for (const [x, z, s, m] of [
    [3.2, -110.4, 0.9, mat.wood],
    [4.25, -110.2, 0.7, mat.woodDark],
    [3.3, -111.5, 0.6, mat.wood],
  ])
    put(root, box(s, s * 0.8, s, m, 1), x, PF + s * 0.4, z).rotation.y = R() * 0.5;
  for (const [x, z] of [
    [2.4, -112.4],
    [2.95, -113.1],
  ])
    put(root, cyl(0.29, 0.88, mat.blueDrum, 16), x, PF + 0.44, z);

  // the cable out of the tunnel: down the wall, along the quay and into her side
  const CZ = -134.2;
  const DROP = z1 - 5.4; // it comes out of the passage at head height and drops to the quay past the stair foot
  put(root, box(0.06, 0.06, south - DROP, mat.black), x1 - 0.06, SHELF + 1.9, (south + DROP) / 2);
  put(root, box(0.06, PEN.shelf + 1.9, 0.06, mat.black), x1 - 0.06, PF + (PEN.shelf + 1.9) / 2, DROP);
  put(root, box(0.06, 0.06, DROP - CZ, mat.black), x1 - 0.06, PF + 0.04, (DROP + CZ) / 2);
  put(root, box(x1 - 0.06 - edge, 0.06, 0.06, mat.black), (x1 - 0.06 + edge) / 2, PF + 0.04, CZ);
  strut(root, [edge + 0.1, PF + 0.05, CZ], [BOAT.x + BOAT.r * 0.93, BOAT.y + 0.55, CZ], 0.035, mat.black);
  hot(put(root, proxy(1.6, 0.16, 0.5), 3.0, PF + 0.06, CZ), { id: 'cable', nodes: ['quayMid'], cursor: 'look', action: ['look', 'cable'] });

  // the camera on its tripod, facing her
  const cam = grp(root, 2.75, PF, -128.7);
  for (const a of [0.4, 2.5, 4.6]) strut(cam, [Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42], [0, 1.28, 0], 0.014, mat.woodDark);
  put(cam, box(0.3, 0.2, 0.22, mat.black), 0, 1.4, 0);
  put(cam, cyl(0.055, 0.14, mat.chrome, 12), -0.2, 1.4, 0).rotation.z = Math.PI / 2;
  put(cam, box(0.1, 0.05, 0.1, mat.darkMetal), 0.04, 1.52, 0);
  hot(put(cam, proxy(0.6, 1.7, 0.6), 0, 0.85, 0), { id: 'camera', nodes: ['quayMid'], cursor: 'hand', action: ['film'] });

  // ---------------------------------------------------------------- the sea gate and the beacon
  const GW = edge - x0 - 1.2,
    gateY = (WATER - 1.5 + PF + 5.6) / 2,
    gateH = PF + 5.6 - (WATER - 1.5);
  for (const s of [-1, 1]) {
    const leaf = put(root, box(GW / 2 - 0.05, gateH, 0.4, mat.gate, 2), (x0 + edge) / 2 + s * (GW / 4), gateY, z0 + 0.5);
    leaf.userData.gate = true;
    for (let y = WATER + 0.6; y < PF + 5.4; y += 1.3) put(root, box(GW / 2 - 0.05, 0.16, 0.12, mat.hullDark), (x0 + edge) / 2 + s * (GW / 4), y, z0 + 0.76);
  }
  put(root, box(0.3, gateH, 0.5, mat.darkMetal), (x0 + edge) / 2, gateY, z0 + 0.6);
  for (const x of [x0 + 0.45, edge - 0.45]) put(root, box(0.5, gateH + 0.6, 0.7, mat.quay, 2), x, gateY + 0.3, z0 + 0.5);
  put(root, box(GW + 1.4, 0.6, 0.8, mat.quay, 2), (x0 + edge) / 2, PF + 5.9, z0 + 0.5);
  for (let i = 0; i < 26; i++) {
    const h = 0.5 + R() * 1.6;
    put(root, box(0.1 + R() * 0.16, h, 0.03, mat.weed), x0 + 1 + R() * (GW - 0.6), WATER + 0.1 + h / 2 + R() * 0.3, z0 + 0.72 + R() * 0.1);
  }
  hot(put(root, proxy(GW, 5.5, 0.4), (x0 + edge) / 2, PF + 2.2, z0 + 0.95), { id: 'seagate', nodes: ['quayN'], cursor: 'look', action: ['look', 'seagate'] });

  const BX = 2.3,
    BZ = z0 + 2.2;
  put(root, cyl(0.07, 2.3, mat.darkMetal, 10), BX, PF + 1.15, BZ);
  put(root, cyl(0.2, 0.06, mat.darkMetal, 12), BX, PF + 2.3, BZ);
  put(root, cyl(0.2, 0.06, mat.darkMetal, 12), BX, PF + 2.68, BZ);
  for (const a of [0, 1.57, 3.14, 4.71]) put(root, box(0.02, 0.36, 0.02, mat.darkMetal), BX + Math.cos(a) * 0.17, PF + 2.49, BZ + Math.sin(a) * 0.17);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
  put(root, M(new THREE.SphereGeometry(0.13, 12, 8), beaconMat, false, false), BX, PF + 2.49, BZ);
  const beacon = new THREE.PointLight(0x9fe8cf, 0, 20, 1.4);
  beacon.position.set(BX, PF + 2.49, BZ);
  root.add(beacon);
  hot(put(root, proxy(0.6, 2.9, 0.6), BX, PF + 1.45, BZ), { id: 'beacon', nodes: ['quayN'], cursor: 'look', action: ['look', 'beacon'] });

  // ---------------------------------------------------------------- the boat
  const boat = grp(root, BOAT.x, BOAT.y, BOAT.z);
  const r = BOAT.r,
    MID = 11;
  const mid = M(new THREE.CylinderGeometry(r, r, MID, 24, cuts(MID)), mat.hull);
  mid.rotation.x = Math.PI / 2;
  boat.add(mid);
  const bow = M(new THREE.SphereGeometry(r, 24, 14), mat.hull);
  bow.scale.z = 2.2;
  put(boat, bow, 0, 0, -MID / 2);
  const stern = cyl(r, 3.6, mat.hull, 24, 0.28);
  stern.rotation.x = Math.PI / 2;
  put(boat, stern, 0, 0, MID / 2 + 1.8);
  put(boat, box(0.07, 2.0, 0.9, mat.hullDark), 0, 0, MID / 2 + 2.9);
  put(boat, box(2.0, 0.07, 0.9, mat.hullDark), 0, 0, MID / 2 + 2.9);
  for (let i = 0; i < 3; i++) {
    const blade = put(boat, box(0.16, 0.62, 0.05, mat.brass), 0, 0, MID / 2 + 3.66);
    blade.geometry.translate(0, 0.31, 0);
    blade.rotation.z = (i * 2 * Math.PI) / 3 + 0.4;
  }
  // casing and its row of drain holes
  put(boat, box(1.34, 0.2, 12.4, mat.hullDark, 2), 0, r + 0.02, -0.4);
  for (const s of [-1, 1]) {
    put(boat, box(0.06, 0.34, 12.4, mat.hullDark, 2), s * 0.66, r - 0.16, -0.4);
    for (let z = -6.2; z < 5.6; z += 0.62) put(boat, box(0.02, 0.09, 0.3, mat.black), s * 0.695, r - 0.12, z);
  }
  // conning tower
  const ST = r + 0.12,
    SH = 2.0;
  put(boat, box(0.92, SH, 2.6, mat.hull, 1.6), 0, ST + SH / 2, 0.9);
  put(boat, cyl(0.46, SH, mat.hull, 16), 0, ST + SH / 2, -0.4);
  put(boat, box(0.98, 0.06, 2.7, mat.hullDark), 0, ST + SH + 0.03, 0.88);
  put(boat, cyl(0.05, 1.7, mat.hullDark, 8), 0, ST + SH + 0.85, 0.3);
  put(boat, cyl(0.1, 1.0, mat.hullDark, 10), 0, ST + SH + 0.5, 1.5);
  for (const z of [-0.2, 0.9, 2.1]) for (const s of [-1, 1]) put(boat, box(0.03, 0.4, 0.03, mat.hullDark), s * 0.44, ST + SH + 0.2, z);
  for (const s of [-1, 1]) put(boat, box(0.03, 0.03, 2.4, mat.hullDark), s * 0.44, ST + SH + 0.4, 0.95);
  // her name, and under it what is left of a number
  const name = decal(2.0, 0.52, 240, (g, W, H) => {
    g.fillStyle = '#4d372c';
    g.fillRect(0, 0, W, H);
    text(g, VESSEL, W / 2, H * 0.52, { size: H * 0.74, color: '#d6cfb6', font: '"Arial Narrow", Arial, sans-serif' });
    // rust has had most of the paint, but not the shapes of the letters
    for (let i = 0; i < 340; i++) {
      const v = R();
      g.fillStyle = v < 0.5 ? `rgba(77,55,44,${0.4 + R() * 0.5})` : v < 0.8 ? `rgba(128,74,38,${0.3 + R() * 0.5})` : `rgba(34,22,16,${0.4 + R() * 0.5})`;
      g.fillRect(R() * W, R() * H, 1 + R() * 4, 1 + R() * 3);
    }
    for (let i = 0; i < 9; i++) {
      const x = R() * W,
        grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(120,70,36,0)');
      grad.addColorStop(1, `rgba(120,70,36,${0.5 + R() * 0.4})`);
      g.fillStyle = grad;
      g.fillRect(x, H * R() * 0.5, 2 + R() * 5, H);
    }
  });
  name.rotation.y = RY.E;
  put(boat, name, 0.464, ST + 1.36, 1.2);
  const number = decal(0.9, 0.34, 200, (g, W, H) => {
    g.fillStyle = '#4d372c';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 420; i++) {
      const v = R();
      g.fillStyle = v < 0.25 ? `rgba(214,207,182,${R() * 0.5})` : v < 0.7 ? `rgba(128,74,38,${0.4 + R() * 0.5})` : `rgba(34,22,16,${0.5 + R() * 0.5})`;
      g.fillRect(R() * W, R() * H, 2 + R() * 9, 1 + R() * 5);
    }
  });
  number.rotation.y = RY.E;
  put(boat, number, 0.464, ST + 0.78, 1.2);
  hot(put(boat, proxy(0.2, 0.6, 2.1), 0.52, ST + 1.36, 1.2), { id: 'name', nodes: ['sail'], cursor: 'look', action: ['look', 'name'] });
  hot(put(boat, proxy(0.2, 0.4, 1.0), 0.52, ST + 0.78, 1.2), { id: 'number', nodes: ['sail'], cursor: 'look', action: ['look', 'number'] });
  // the viewport in the tower
  const PY = ST + 1.16,
    PZ = -0.12;
  const rim = M(new THREE.TorusGeometry(0.2, 0.04, 8, 22), mat.brass);
  rim.rotation.y = Math.PI / 2;
  put(boat, rim, 0.47, PY, PZ);
  const glass = lampMat(0x070b0d);
  const pane = M(new THREE.CircleGeometry(0.19, 22), glass, false, false);
  pane.rotation.y = Math.PI / 2;
  put(boat, pane, 0.468, PY, PZ);
  const within = new THREE.PointLight(0xffd9a0, 0, 9, 1.5);
  within.position.set(1.1, PY, PZ);
  boat.add(within);
  hot(put(boat, proxy(0.2, 0.5, 0.5), 0.52, PY, PZ), { id: 'viewport', nodes: ['sail'], cursor: 'look', action: ['viewport'] });
  // the hatch, aft of the tower
  put(boat, cyl(0.36, 0.2, mat.hullDark, 16), 0, r + 0.22, 3.5);
  const hw = M(new THREE.TorusGeometry(0.2, 0.025, 6, 18), mat.hull);
  hw.rotation.x = Math.PI / 2;
  put(boat, hw, 0, r + 0.37, 3.5);
  put(boat, box(0.4, 0.03, 0.03, mat.hull), 0, r + 0.37, 3.5);
  hot(put(boat, proxy(1.0, 0.6, 1.0), 0, r + 0.4, 3.5), { id: 'hatch', nodes: ['quayMid'], cursor: 'look', action: ['look', 'hatch'] });
  // weed along the waterline and hanging off the tower
  const wl = WATER - BOAT.y,
    wx = Math.sqrt(r * r - wl * wl);
  for (let i = 0; i < 60; i++) {
    const h = 0.25 + R() * 0.7,
      z = -MID / 2 + R() * MID;
    for (const s of [-1, 1]) put(boat, box(0.03, h, 0.12 + R() * 0.2, mat.weed), s * (wx + 0.02 + (h > 0.6 ? 0.03 : 0)), wl + h / 2 - 0.05, z + s * 0.3);
  }
  for (let i = 0; i < 9; i++) {
    const h = 0.1 + R() * 0.2; // short, so it never hangs across her name
    put(boat, box(0.02, h, 0.08 + R() * 0.12, mat.weed), 0.475, ST + SH - h / 2, -0.3 + R() * 2.4);
  }
  hot(put(root, proxy(0.6, 2.6, 9), BOAT.x + r + 0.2, PF + 0.4, BOAT.z - 4.6), { id: 'boat', nodes: ['quayMid', 'quayN'], cursor: 'look', action: ['look', 'boat'] });
  hot(put(root, proxy(0.4, 2.3, 3.2), BOAT.x + 0.9, PF + 1.7, BOAT.z + 0.9), { id: 'sailzoom', nodes: ['quayMid'], cursor: 'zoom', action: ['go', 'sail'] });

  // ---------------------------------------------------------------- things that change
  let phase = 0;
  return {
    sync(state) {
      const lit = !!state.flags.lampOn;
      setLamp(glass, 0xffd9a0, lit, 3.2);
      within.intensity = lit ? 7 : 0;
    },
    /** The berth beacon, rising and falling in time with the hum. */
    tick() {
      phase += 0.09;
      const k = 0.5 + 0.5 * Math.sin(phase);
      beacon.intensity = 0.8 + 3.6 * k * k;
      beaconMat.color.setRGB(0.2 + 0.7 * k, 0.5 + 0.9 * k, 0.42 + 0.8 * k);
      return true;
    },
  };
}
