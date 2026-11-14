// The Subterranean Station: the stairs down, the long tunnel, the flooded lower stretch,
// the junction box, and the door at the end of the works.
import * as THREE from 'three';
import { UF, LF, TUNNEL, QUARTERS, RY } from './layout.js';
import { mat, lampMat, setLamp } from './materials.js';
import { M, box, cyl, put, grp, wall, decal, text, plate, hot, proxy, sideOf, wheelFace, cuts, rng } from './kit.js';
import { CORES, WIRING, TAGGED, TERMINALS } from '../puzzles/junction.js';
import { WHEELS, challengeLabel } from '../puzzles/reply.js';

/** Height of each cable above the upper floor where the five run along the west wall. */
const CABLE_Y = { red: 2.48, blue: 2.39, yellow: 2.3, green: 2.21, white: 2.12 };
const TAG_AT = { red: -2, yellow: -19 }; // where along the tunnel each tagged core carries its tag

export function buildTunnel(parent) {
  const root = grp(parent);
  const R = rng(1958);
  const { hw, h, z0, steps } = TUNNEL;
  const cableMat = { red: mat.red, blue: mat.blue, yellow: mat.yellow, green: mat.green, white: mat.white };

  root.add(new THREE.HemisphereLight(0x3c4850, 0x111315, 0.9));

  // ---------------------------------------------------------------- shell
  const WB = LF - 0.1; // walls start just under the lower floor
  const WH = UF + h - WB;
  const sill = UF - WB;
  const doorway = (zc) => ({ a: zc - 0.7, b: zc + 0.7, y0: sill, y1: sill + 2.05 });
  const wx = hw + 0.1;
  wall(root, mat.damp, -wx, z0 - 0.4, -wx, 6.2, WB, WH, 0.2, [doorway(QUARTERS.mess.door)]);
  wall(root, mat.damp, wx, z0 - 0.4, wx, 6.2, WB, WH, 0.2, [doorway(QUARTERS.kitchen.door), doorway(QUARTERS.bunks.door)]);
  for (const [x, zc] of [[-hw, QUARTERS.mess.door], [hw, QUARTERS.kitchen.door], [hw, QUARTERS.bunks.door]]) {
    const sx = Math.sign(x);
    for (const dz of [-0.74, 0.74]) put(root, box(0.26, 2.09, 0.08, mat.darkMetal), x + sx * 0.1, UF + 1.045, zc + dz);
    put(root, box(0.26, 0.08, 1.56, mat.darkMetal), x + sx * 0.1, UF + 2.09, zc);
  }
  // floors: the upper level, four steps down, and the lower level
  put(root, box(2 * hw + 0.4, 0.4, 6.2 - steps, mat.dampFloor, 2), 0, UF - 0.2, (6.2 + steps) / 2);
  for (let i = 1; i <= 3; i++) put(root, box(2 * hw, 0.8 - 0.2 * i, 0.3, mat.dampFloor, 2), 0, LF + (0.8 - 0.2 * i) / 2, steps - 0.3 * (i - 0.5));
  put(root, box(2 * hw + 0.4, 0.4, steps - z0 + 0.6, mat.wetFloor, 2), 0, LF - 0.2, (steps + z0 - 0.6) / 2);
  // ceilings: the lower level's is lower too
  const drop = steps - 1.5;
  put(root, box(2 * hw + 0.4, 0.3, -drop, mat.damp, 2), 0, UF + h + 0.15, drop / 2);
  put(root, box(2 * hw + 0.4, 0.3, drop - z0 + 0.6, mat.damp, 2), 0, LF + h + 0.15, (drop + z0 - 0.6) / 2);
  put(root, box(2 * hw + 0.4, UF - LF + 0.3, 0.3, mat.damp, 2), 0, LF + h + (UF - LF + 0.3) / 2, drop - 0.15);
  // concrete ribs
  for (const [z, base, hh] of [[-5, UF, h], [-14, UF, h], [-23.5, UF, h], [-32, LF, h], [-38, LF, h]]) {
    for (const s of [-1, 1]) put(root, box(0.16, hh, 0.3, mat.concreteDark, 2), s * (hw - 0.08), base + hh / 2, z);
    put(root, box(2 * hw, 0.18, 0.3, mat.concreteDark, 2), 0, base + hh - 0.09, z);
  }

  // ---------------------------------------------------------------- the stairs up
  const topY = UF + 14 * 0.19;
  for (let i = 1; i <= 14; i++) put(root, box(2 * hw, 0.19 * i, 0.28, mat.dampFloor, 2), 0, UF + (0.19 * i) / 2, 0.4 + 0.28 * (i - 0.5));
  put(root, box(2 * hw, topY - UF, 1.9, mat.dampFloor, 2), 0, UF + (topY - UF) / 2, 5.25);
  wall(root, mat.damp, -wx, 0, -wx, 6.2, UF + h, 3.0, 0.2);
  wall(root, mat.damp, wx, 0, wx, 6.2, UF + h, 3.0, 0.2);
  wall(root, mat.damp, -wx - 0.1, 6.3, wx + 0.1, 6.3, WB, UF + h + 3.0 - WB, 0.2);
  put(root, box(2 * hw + 0.4, 0.3, 6.5, mat.damp, 2), 0, UF + h + 3.15, 3.15);
  put(root, box(2 * hw + 0.4, 3.0, 0.3, mat.damp, 2), 0, UF + h + 1.5, -0.15);
  put(root, box(1.1, 2.14, 0.05, mat.darkMetal), 0, topY + 1.07, 6.17);
  put(root, box(0.96, 2.04, 0.06, mat.vaultSteel, 1.2), 0, topY + 1.02, 6.15);
  for (const s of [-1, 1]) put(root, box(0.04, 0.04, 4.6, mat.darkMetal), s * (hw - 0.06), UF + 1.75, 2.4).rotation.x = -Math.atan2(topY - UF, 3.92);
  const plaque = decal(1.0, 0.62, 260, (g, W, H) => {
    g.fillStyle = '#5b4a2c';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#a58a4c';
    g.lineWidth = 5;
    g.strokeRect(8, 8, W - 16, H - 16);
    text(g, 'SUBTERRANEAN', W / 2, H * 0.24, { size: 30, color: '#d8bd76' });
    text(g, 'STATION', W / 2, H * 0.44, { size: 30, color: '#d8bd76' });
    text(g, 'HOLLAND ISLAND', W / 2, H * 0.64, { size: 17, color: '#c4a865' });
    text(g, 'COMPLETED 1958', W / 2, H * 0.8, { size: 17, color: '#c4a865' });
  }, { rough: 0.45 });
  plaque.rotation.y = RY.W;
  put(root, plaque, hw - 0.01, UF + 1.6, -2);
  hot(plaque, { id: 'plaque', nodes: ['stairfoot'], cursor: 'look', action: ['look', 'plaque'] });
  hot(put(root, proxy(2 * hw, 2.2, 0.4), 0, UF + 1.6, 2.6), { id: 'stairs', nodes: ['stairfoot'], cursor: 'look', action: ['look', 'stairs'] });

  // ---------------------------------------------------------------- lamps
  const lamps = [];
  const lamp = (z, y, lit, hex = 0xffe2b0, power = 8, reach = 12) => {
    put(root, box(0.34, 0.08, 0.2, mat.darkMetal), 0, y - 0.04, z);
    const m = lampMat(0x55524a);
    put(root, box(0.26, 0.07, 0.14, m), 0, y - 0.11, z);
    const l = new THREE.PointLight(hex, lit ? power : 0, reach, 1.5);
    l.position.set(0, y - 0.32, z);
    root.add(l);
    setLamp(m, hex, lit, 2.4);
    lamps.push(l);
    return l;
  };
  lamp(-2, UF + h, true);
  lamp(-9, UF + h, true, 0xffe2b0, 9);
  lamp(-14, UF + h, false);
  lamp(-19, UF + h, true);
  lamp(-25.4, UF + h, true, 0xffe2b0, 7);
  lamp(-34, LF + h, true, 0xffd9a0, 6, 10);
  const doorLamp = lamp(-42.4, LF + h, true, 0xff4030, 4, 8);

  // ---------------------------------------------------------------- the cables
  const tags = {};
  for (const c of CORES) {
    const y = UF + CABLE_Y[c], x = -hw + 0.035;
    put(root, box(0.03, 0.03, 0.9 - (drop + 0.1), cableMat[c]), x, y, (0.9 + drop + 0.1) / 2); // along the upper wall
    put(root, box(0.03, UF + h + 2.6 - y, 0.03, cableMat[c]), x, (y + UF + h + 2.6) / 2, 0.9 + 0.06 * CORES.indexOf(c)); // up the stairwell
    const ly = LF + 1.92 + 0.07 * (4 - CORES.indexOf(c));
    put(root, box(0.03, 0.03, drop - 0.3 + 33.1, cableMat[c]), x, ly, (drop - 0.3 - 33.1) / 2); // along the lower wall to the junction
    if (TAGGED.includes(c)) {
      const tag = decal(0.085, 0.055, 1400, (g, W, H) => {
        g.fillStyle = '#b8923a';
        g.fillRect(0, 0, W, H);
        g.strokeStyle = '#5a4514';
        g.lineWidth = 4;
        g.strokeRect(3, 3, W - 6, H - 6);
        text(g, 'T' + WIRING[c], W / 2, H / 2 + 2, { size: H * 0.66, color: '#2a2008' });
      }, { rough: 0.4 });
      tag.rotation.y = RY.E;
      put(root, tag, x + 0.022, y, TAG_AT[c]);
      tags[c] = tag;
    }
  }
  const lead = put(root, box(0.022, 0.022, 0.9 - (drop + 0.1), mat.black), -hw + 0.03, UF + 2.55, (0.9 + drop + 0.1) / 2); // the bare aerial lead
  lead.userData.nopick = true;
  for (let z = 0.4; z > drop; z -= 2.6) put(root, box(0.05, 0.52, 0.05, mat.darkMetal), -hw + 0.03, UF + 2.31, z);
  hot(put(root, proxy(0.2, 0.3, 0.5), -hw + 0.1, UF + CABLE_Y.red, TAG_AT.red), { id: 'tag-red', nodes: ['stairfoot'], cursor: 'look', action: ['look', 'tagRed'] });
  hot(put(root, proxy(0.12, 0.6, 3.2), -hw + 0.06, UF + 2.31, TAG_AT.yellow), { id: 'rackzoom', nodes: ['tunnelB'], cursor: 'zoom', action: ['go', 'rack'] });
  hot(put(root, proxy(0.1, 0.14, 0.2), -hw + 0.08, UF + CABLE_Y.yellow, TAG_AT.yellow), { id: 'tag-yellow', nodes: ['rack'], cursor: 'look', action: ['look', 'tagYellow'] });
  hot(put(root, proxy(0.1, 0.6, 1.4), -hw + 0.07, UF + 2.31, TAG_AT.yellow - 0.9), { id: 'cables', nodes: ['rack'], cursor: 'look', action: ['look', 'cables'] });

  // ---------------------------------------------------------------- the water
  const water = M(new THREE.PlaneGeometry(2 * hw, steps - z0, cuts(2 * hw), cuts(steps - z0)), mat.deepWater, false, false);
  water.rotation.x = -Math.PI / 2;
  put(root, water, 0, UF - 0.09, (steps + z0) / 2);
  const waterHit = put(root, proxy(2 * hw, 0.06, 8), 0, UF - 0.07, steps - 4);
  hot(waterHit, { id: 'water', nodes: ['brink'], cursor: 'look', action: ['look', 'water'] });

  // ---------------------------------------------------------------- junction box
  const JZ = -33.5;
  const jb = grp(root, -hw + 0.01, LF + 1.36, JZ, RY.E);
  put(jb, box(1.56, 0.86, 0.14, mat.panelGrey, 1), 0, 0, 0.06);
  put(jb, plate(0.74, 0.085, 'JUNCTION K - SIGNAL LINE'), -0.26, 0.345, 0.132);
  const selectors = {};
  const drawSel = (n) => (g, W, H) => {
    const count = TERMINALS.length;
    g.fillStyle = '#d9d4c0';
    g.fillRect(0, 0, W, H);
    const f = '"Courier New", monospace';
    text(g, String((n % count) + 1), W / 2, H * 0.14, { size: H * 0.2, color: '#555', font: f });
    text(g, String(n), W / 2, H * 0.51, { size: H * 0.34, color: '#111', font: f });
    text(g, String(((n + count - 2) % count) + 1), W / 2, H * 0.88, { size: H * 0.2, color: '#555', font: f });
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.75)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.75)');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
  };
  CORES.forEach((c, i) => {
    const x = -0.6 + i * 0.2;
    put(jb, cyl(0.022, 0.2, cableMat[c], 10), x, 0.2, 0.15); // the core, coming down into its clamp
    put(jb, box(0.07, 0.04, 0.05, mat.brass), x, 0.09, 0.15);
    put(jb, plate(0.16, 0.045, c.toUpperCase(), { bg: '#e6dfc8', fg: '#151515' }), x, 0.03, 0.132);
    const w = decal(0.11, 0.26, 500, () => {}, { rough: 0.5 });
    put(jb, w, x, -0.15, 0.136);
    put(jb, box(0.125, 0.275, 0.01, mat.black), x, -0.15, 0.13);
    selectors[c] = w;
    hot(put(jb, proxy(0.125, 0.28, 0.06), x, -0.15, 0.15), { id: 'core-' + c, nodes: ['jbox'], cursor: 'spin', action: ['core', c], dir: sideOf(jb, x, -0.15, 'y') });
  });
  put(jb, plate(0.5, 0.05, 'TERMINAL'), -0.2, -0.33, 0.132);
  const lever = grp(jb, 0.58, -0.05, 0.14);
  put(lever, box(0.05, 0.05, 0.2, mat.red), 0, 0, 0.09);
  put(jb, box(0.14, 0.34, 0.02, mat.black), 0.58, -0.05, 0.134);
  put(jb, plate(0.2, 0.05, 'ISOLATOR'), 0.58, -0.29, 0.132);
  put(jb, plate(0.08, 0.035, 'ON', { bg: '#7b7f78', fg: '#111' }), 0.58, 0.15, 0.132);
  const lineLamp = lampMat(0x22281f);
  put(jb, cyl(0.03, 0.03, lineLamp, 12), 0.58, 0.27, 0.145).rotation.x = Math.PI / 2;
  put(jb, plate(0.2, 0.045, 'LINE LIVE'), 0.58, 0.345, 0.132);
  hot(put(jb, proxy(0.2, 0.36, 0.26), 0.58, -0.05, 0.2), { id: 'isolator', nodes: ['jbox'], cursor: 'hand', action: ['isolator'] });
  hot(put(root, proxy(0.3, 1.0, 1.7), -hw + 0.16, LF + 1.36, JZ), { id: 'jboxzoom', nodes: ['junction'], cursor: 'zoom', action: ['go', 'jbox'] });

  // ---------------------------------------------------------------- the sender by the door
  const SZ = -41.5;
  const sp = grp(root, hw - 0.01, LF + 1.36, SZ, RY.W);
  put(sp, box(1.4, 0.86, 0.14, mat.console, 1), 0, 0, 0.06);
  put(sp, box(0.56, 0.2, 0.2, mat.steel, 1), -0.36, -0.2, 0.2);
  const paper = decal(0.44, 0.4, 560, () => {}, { rough: 0.95 });
  paper.rotation.x = -0.2;
  put(sp, paper, -0.36, 0.1, 0.19);
  hot(paper, { id: 'doorprint', nodes: ['sender'], cursor: 'hand', action: ['doorprint'] });
  put(sp, plate(0.34, 0.06, 'REPLY'), 0.3, 0.3, 0.132);
  const rw = [];
  for (let i = 0; i < WHEELS; i++) {
    const x = 0.0 + i * 0.076 + (i >= WHEELS / 2 ? 0.045 : 0), y = 0.1;
    const w = decal(0.066, 0.2, 620, () => {}, { rough: 0.5 });
    put(sp, w, x, y, 0.136);
    put(sp, box(0.075, 0.212, 0.01, mat.black), x, y, 0.13);
    rw.push(w);
    hot(put(sp, proxy(0.075, 0.215, 0.06), x, y, 0.15), { id: 'rwheel-' + i, nodes: ['sender'], cursor: 'spin', action: ['rwheel', i], dir: sideOf(sp, x, y, 'y') });
  }
  put(sp, box(0.66, 0.01, 0.01, mat.red), 0.29, 0.135, 0.143);
  put(sp, box(0.66, 0.01, 0.01, mat.red), 0.29, 0.065, 0.143);
  const sendKey = put(sp, cyl(0.05, 0.04, mat.green, 14), 0.2, -0.2, 0.15);
  sendKey.rotation.x = Math.PI / 2;
  put(sp, plate(0.16, 0.05, 'SEND'), 0.2, -0.31, 0.132);
  hot(sendKey, { id: 'send', nodes: ['sender'], cursor: 'hand', action: ['send'] });
  const sendLamp = lampMat(0x22281f);
  put(sp, cyl(0.026, 0.03, sendLamp, 12), 0.45, -0.2, 0.145).rotation.x = Math.PI / 2;
  put(sp, plate(0.16, 0.045, 'LINE'), 0.45, -0.3, 0.132);
  hot(put(root, proxy(0.3, 1.0, 1.5), hw - 0.16, LF + 1.36, SZ), { id: 'senderzoom', nodes: ['blastdoor'], cursor: 'zoom', action: ['go', 'sender'] });

  // ---------------------------------------------------------------- the end of the works
  wall(root, mat.concreteDark, -2.5, z0 - 0.2, 2.5, z0 - 0.2, WB, WH + 0.6, 0.4, [{ a: -1.0, b: 1.0, y0: LF - WB, y1: LF - WB + 2.3 }]);
  for (const x of [-1.05, 1.05]) put(root, box(0.14, 2.4, 0.5, mat.darkMetal), x, LF + 1.2, z0 - 0.2);
  put(root, box(2.24, 0.14, 0.5, mat.darkMetal), 0, LF + 2.37, z0 - 0.2);
  const hinge = grp(root, -1.07, LF, z0 - 0.4);
  const slab = put(hinge, box(2.14, 2.34, 0.2, mat.vaultSteel, 1.2), 1.07, 1.17, -0.1);
  const stencil = decal(1.5, 0.24, 240, (g, W, H) => {
    g.fillStyle = '#737a7d';
    g.fillRect(0, 0, W, H);
    text(g, 'END OF WORKS 1958', W / 2, H / 2 + 2, { size: 40, color: '#d9c23c' });
  }, { rough: 0.5 });
  put(hinge, stencil, 1.07, 1.8, 0.004);
  const wheel = grp(hinge, 1.07, 1.1, 0.07);
  wheel.add(M(new THREE.TorusGeometry(0.28, 0.03, 8, 24), mat.chrome));
  for (let i = 0; i < 3; i++) {
    const s = box(0.56, 0.03, 0.02, mat.chrome);
    s.rotation.z = (i * Math.PI) / 3;
    wheel.add(s);
  }
  for (const [x, y] of [[0.2, 0.25], [1.94, 0.25], [0.2, 2.1], [1.94, 2.1]]) put(hinge, cyl(0.035, 0.03, mat.darkMetal, 8), x, y, 0.01).rotation.x = Math.PI / 2;
  hot(slab, { id: 'enddoor', nodes: ['blastdoor'], cursor: 'look', action: ['look', 'enddoor'] });

  // beyond it: older ground, sloping down under the sea
  const cave = grp(root, 0, LF, z0 - 0.4);
  cave.rotation.x = -0.085;
  put(cave, box(4.8, 0.5, 20.4, mat.rockDark), 0, -0.25, -10);
  put(cave, box(4.8, 0.5, 20.4, mat.rockDark), 0, 2.85, -10);
  for (const s of [-1, 1]) put(cave, box(0.6, 3.4, 20.4, mat.rockDark), s * 2.1, 1.3, -10);
  put(cave, box(4.8, 3.6, 0.5, mat.rockDark), 0, 1.3, -20);
  for (let i = 0; i < 46; i++) {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const f = 0.7 + 0.6 * R();
      p.setXYZ(k, p.getX(k) * f, p.getY(k) * f, p.getZ(k) * f);
    }
    g.computeVertexNormals();
    const rock = M(g, mat.rockDark, false, false);
    const side = i % 3, zz = -1.2 - R() * 18;
    const sc = 0.45 + R() * 0.6;
    rock.scale.set(sc, sc * (0.7 + R() * 0.8), sc * (0.8 + R()));
    if (side === 0) put(cave, rock, -1.85 - R() * 0.2, R() * 2.6, zz);
    else if (side === 1) put(cave, rock, 1.85 + R() * 0.2, R() * 2.6, zz);
    else put(cave, rock, (R() - 0.5) * 3.2, 2.65 + R() * 0.2, zz);
  }
  CORES.forEach((c, i) => put(cave, box(0.03, 0.03, 19.4, cableMat[c]), -1.25 + i * 0.05, 0.02, -9.9));
  put(cave, box(0.03, 0.03, 19.4, mat.black), -1.32, 0.02, -9.9);
  const mugs = grp(cave, 0.35, 0, -0.75);
  [-0.42, -0.14, 0.14, 0.42].forEach((x, i) => {
    put(mugs, cyl(0.045, 0.1, mat.enamel, 12), x, 0.05, (i % 2) * 0.03);
    const handle = M(new THREE.TorusGeometry(0.03, 0.008, 6, 10), mat.enamel);
    handle.rotation.y = 0.4 * i;
    put(mugs, handle, x + 0.05, 0.05, (i % 2) * 0.03);
  });
  put(mugs, box(0.006, 0.13, 0.006, mat.chrome), 0.15, 0.09, 0).rotation.z = 0.35;
  hot(put(mugs, proxy(1.1, 0.24, 0.3), 0, 0.1, 0.02), { id: 'mugs', nodes: ['blastdoor', 'beyond'], cursor: 'look', action: ['look', 'mugs'] });
  const glow = new THREE.PointLight(0x7fffd8, 0, 18, 1.3);
  glow.position.set(0, 1.0, -17);
  cave.add(glow);
  const orbMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
  const orb = put(cave, M(new THREE.SphereGeometry(0.16, 12, 8), orbMat, false, false), 0, 0.85, -19.4);
  hot(put(cave, proxy(3.4, 2.4, 0.4), 0, 1.2, -6), { id: 'deep', nodes: ['beyond'], cursor: 'look', action: ['look', 'deep'] });

  // ---------------------------------------------------------------- things that change
  const drawPaper = (mode) => (g, W, H) => {
    g.fillStyle = '#e9e3cf';
    g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,0.05)';
    for (let y = 0; y < H; y += 14) g.fillRect(0, y, W, 1);
    const opts = { size: 30, color: '#262a3c', font: '"Courier New", monospace' };
    const lines = mode === 'ask' ? ['= K7 =', `SHEET ${challengeLabel()}`, 'REPLY', '= K7 ='] : mode === 'open' ? ['= K7 =', 'RECEIVED', 'COME DOWN', '= K7 ='] : [];
    lines.forEach((l, i) => text(g, l, W / 2, 40 + i * 46, opts));
  };

  let phase = 0, open = false, lastPaper = null;
  return {
    sync(state) {
      const drained = state.pump.drained, live = state.junction.live;
      open = state.reply.open;
      water.visible = !drained;
      waterHit.userData.hot.disabled = drained;
      for (const c of CORES) selectors[c].userData.redraw(drawSel(state.junction.sel[c]));
      lever.rotation.x = live ? -0.6 : 0.6;
      setLamp(lineLamp, 0x35ff55, live, 2.5);
      state.reply.wheels.forEach((n, i) => rw[i].userData.redraw(wheelFace(n)));
      const mode = open ? 'open' : live ? 'ask' : 'dead';
      if (mode !== lastPaper) paper.userData.redraw(drawPaper((lastPaper = mode)));
      setLamp(sendLamp, open ? 0x35ff55 : 0xffa020, live, 2.4);
      hinge.rotation.y = open ? 1.45 : 0;
      slab.userData.hot.disabled = open;
      doorLamp.intensity = open ? 1.5 : 4;
      if (!open) {
        glow.intensity = 0;
        orbMat.color.setHex(0x000000);
      }
    },
    /** The light far down the old tunnel, rising and falling. */
    tick() {
      if (!open) return false;
      phase += 0.09;
      const k = 0.5 + 0.5 * Math.sin(phase);
      glow.intensity = 1.2 + 5 * k * k;
      orbMat.color.setRGB(0.25 + 0.75 * k, 0.6 + 0.9 * k, 0.5 + 0.8 * k);
      return true;
    },
  };
}
