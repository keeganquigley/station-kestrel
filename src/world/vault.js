// The signals vault: its door and thumbwheel lock, and what is inside.
import * as THREE from 'three';
import { FLOOR as F, ROOMS, CEIL, RY } from './layout.js';
import { mat, lampMat, setLamp } from './materials.js';
import { M, box, cyl, put, grp, wall, line, decal, text, plate, hot, proxy, sideOf, chair, rng } from './kit.js';
import { powered } from '../puzzles/generator.js';
import { CIPHER } from '../puzzles/cipher.js';

export const LOCK_PANEL = { x: ROOMS.corr.x1 - 0.01, y: F + 1.32, z: -18.86 };

export function buildVault(scene) {
  const root = grp(scene);
  const v = ROOMS.vault, c = ROOMS.corr;
  const R = rng(909);

  // --- the wall between corridor and vault, and the door
  wall(root, mat.concreteDark, 10.4, v.z0 - 0.2, 10.4, v.z1 + 0.2, F, CEIL, 0.4, [{ a: -20.7, b: -19.3, y0: 0, y1: 2.2 }]);
  for (const z of [-20.75, -19.25]) put(root, box(0.5, 2.3, 0.14, mat.darkMetal), 10.4, F + 1.15, z);
  put(root, box(0.5, 0.14, 1.64, mat.darkMetal), 10.4, F + 2.27, -20);
  const hinge = grp(root, c.x1 - 0.1, F, -20.76);
  const slab = put(hinge, box(0.2, 2.24, 1.52, mat.vaultSteel, 1.2), 0, 1.12, 0.76);
  for (const y of [0.4, 1.12, 1.84]) put(hinge, cyl(0.045, 0.24, mat.darkMetal, 8), -0.1, y, 0.0);
  const wheel = grp(hinge, -0.16, 1.15, 0.76, RY.W);
  wheel.add(M(new THREE.TorusGeometry(0.26, 0.028, 8, 24), mat.chrome));
  for (let i = 0; i < 3; i++) {
    const s = box(0.52, 0.03, 0.02, mat.chrome);
    s.rotation.z = (i * Math.PI) / 3;
    wheel.add(s);
  }
  put(wheel, cyl(0.06, 0.1, mat.darkMetal, 12), 0, 0, -0.03).rotation.x = Math.PI / 2;
  const stencil = decal(1.1, 0.22, 300, (g, W, H) => {
    g.fillStyle = '#737a7d';
    g.fillRect(0, 0, W, H);
    text(g, 'SIGNALS VAULT', W / 2, H / 2 + 2, { size: 44, color: '#d9c23c' });
  }, { rough: 0.5 });
  stencil.rotation.y = RY.W;
  put(hinge, stencil, -0.102, 1.78, 0.76);
  for (const [y, z] of [[0.25, 0.15], [0.25, 1.37], [2.0, 0.15], [2.0, 1.37]]) put(hinge, cyl(0.03, 0.03, mat.darkMetal, 8), -0.105, y, z).rotation.z = Math.PI / 2;
  const wheelHit = put(hinge, proxy(0.3, 0.7, 0.7), -0.2, 1.15, 0.76);
  hot(wheelHit, { id: 'vaulthandle', nodes: ['vaultlock'], cursor: 'hand', action: ['vaulthandle'] });
  const doorHit = put(root, proxy(0.3, 2.3, 2.9), c.x1 - 0.25, F + 1.15, -19.6);
  hot(doorHit, { id: 'vaultdoor', nodes: ['corridor'], cursor: 'zoom', action: ['go', 'vaultlock'] });

  // --- the lock
  const lp = grp(root, LOCK_PANEL.x, LOCK_PANEL.y, LOCK_PANEL.z, RY.W);
  put(lp, box(0.62, 0.66, 0.06, mat.panelGrey, 1), 0, 0, -0.03);
  put(lp, plate(0.4, 0.07, 'COMBINATION'), 0, 0.26, 0.002);
  const lockLamp = lampMat(0x22281f);
  put(lp, cyl(0.025, 0.02, lockLamp, 12), 0.22, -0.25, 0.01).rotation.x = Math.PI / 2;
  put(lp, plate(0.3, 0.05, 'SET, THEN TURN WHEEL'), -0.08, -0.25, 0.002);
  const wheels = [];
  for (let i = 0; i < 4; i++) {
    const x = -0.195 + i * 0.13, y = 0.0;
    const w = decal(0.11, 0.3, 500, () => {}, { rough: 0.5 });
    put(lp, w, x, y, 0.006);
    put(lp, box(0.125, 0.315, 0.008, mat.black), x, y, 0);
    wheels.push(w);
    hot(put(lp, proxy(0.125, 0.32, 0.06), x, y, 0.02), { id: 'wheel-' + i, nodes: ['vaultlock'], cursor: 'spin', action: ['wheel', i], dir: sideOf(lp, x, y, 'y') });
  }
  put(lp, box(0.56, 0.012, 0.01, mat.red), 0, 0.052, 0.012);
  put(lp, box(0.56, 0.012, 0.01, mat.red), 0, -0.052, 0.012);

  // --- inside
  const w = v.x1 - v.x0, d = v.z1 - v.z0, mx = (v.x0 + v.x1) / 2, mz = (v.z0 + v.z1) / 2;
  const fl = M(new THREE.PlaneGeometry(w, d), mat.concreteDark, false, true);
  fl.rotation.x = -Math.PI / 2;
  put(root, fl, mx, F + 0.005, mz);
  put(root, box(w + 0.4, 0.1, d + 0.4, mat.concreteDark, 2), mx, F + CEIL + 0.05, mz);
  wall(root, mat.concreteDark, v.x0, v.z0 - 0.05, v.x1, v.z0 - 0.05, F, CEIL, 0.1);
  wall(root, mat.concreteDark, v.x0, v.z1 + 0.05, v.x1, v.z1 + 0.05, F, CEIL, 0.1);
  wall(root, mat.concreteDark, v.x1 + 0.05, v.z0, v.x1 + 0.05, v.z1, F, CEIL, 0.1);
  const red = new THREE.PointLight(0xff4030, 0, 9, 1.4);
  red.position.set(mx - 0.5, F + CEIL - 0.4, mz);
  root.add(red);
  const redMat = lampMat(0x3a1410);
  put(root, cyl(0.09, 0.14, redMat, 10), mx - 0.5, F + CEIL - 0.08, mz);
  const work = new THREE.PointLight(0xfff0c8, 0, 5, 1.6);
  work.position.set(v.x1 - 1.1, F + 1.75, mz);
  root.add(work);
  // equipment racks along both side walls
  const leds = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = v.x0 + 1.0 + i * 1.15, z = side < 0 ? v.z0 + 0.35 : v.z1 - 0.35;
      put(root, box(1.05, 2.1, 0.6, mat.darkMetal), x, F + 1.05, z);
      for (let u = 0; u < 6; u++) {
        put(root, box(0.95, 0.26, 0.02, mat.steel, 1), x, F + 0.3 + u * 0.31, z - side * 0.31);
        const m = lampMat(0x1a1a1a);
        put(root, box(0.03, 0.03, 0.02, m), x - 0.38 + R() * 0.2, F + 0.3 + u * 0.31, z - side * 0.325);
        leds.push([m, R() < 0.5 ? 0xff5030 : 0x40ff70, R()]);
      }
    }
  }
  // bench at the far end
  const bx = v.x1 - 0.5, top = F + 0.8;
  put(root, box(0.9, 0.06, 3.2, mat.steel, 1), bx, top - 0.03, mz);
  for (const z of [mz - 1.5, mz + 1.5]) put(root, box(0.85, 0.76, 0.06, mat.steel, 1), bx, F + 0.38, z);
  const face = grp(root, bx - 0.3, top, mz, RY.W);
  // tape machine (left as you look at it)
  put(face, box(0.8, 0.75, 0.3, mat.console, 1), -1.05, 0.38, -0.1);
  const reels = [];
  for (const x of [-1.25, -0.85]) {
    const reel = grp(face, x, 0.52, 0.07);
    put(reel, cyl(0.16, 0.02, mat.chrome, 20), 0, 0, 0).rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const hole = cyl(0.04, 0.022, mat.black, 8);
      hole.rotation.x = Math.PI / 2;
      put(reel, hole, Math.cos((i * 2 * Math.PI) / 3) * 0.09, Math.sin((i * 2 * Math.PI) / 3) * 0.09, 0.002);
    }
    reels.push(reel);
  }
  put(face, box(0.5, 0.12, 0.02, mat.black), -1.05, 0.16, 0.06);
  hot(put(face, proxy(0.8, 0.75, 0.3), -1.05, 0.38, 0), { id: 'reels', nodes: ['vault'], cursor: 'look', action: ['look', 'reels'] });
  // second receiver, with nothing plugged into it
  put(face, box(0.8, 0.42, 0.4, mat.console, 1), -0.1, 0.21, -0.1);
  const dial2 = decal(0.36, 0.1, 300, (g, W, H) => {
    g.fillStyle = '#0a0d0a';
    g.fillRect(0, 0, W, H);
    text(g, '-.---', W / 2, H / 2 + 2, { size: H * 0.8, color: '#52ff86', font: '"Courier New", monospace' });
  }, { glow: 1.5 });
  put(face, dial2, -0.2, 0.3, 0.102);
  for (const x of [-0.35, -0.2, -0.05]) put(face, cyl(0.035, 0.03, mat.black, 12), x, 0.12, 0.11).rotation.x = Math.PI / 2;
  put(face, cyl(0.03, 0.02, mat.brass, 10), 0.2, 0.3, 0.105).rotation.x = Math.PI / 2;
  line(face, [[0.2, 0.3, 0.12], [0.26, 0.1, 0.2], [0.3, 0.0, 0.3], [0.34, 0.02, 0.36]], 0x101010);
  hot(put(face, proxy(0.8, 0.42, 0.3), -0.1, 0.21, 0.05), { id: 'rx2', nodes: ['vault'], cursor: 'look', action: ['look', 'rx2'] });
  // teleprinter, and forty-one days of paper
  put(face, box(0.7, 0.2, 0.5, mat.steel, 1), 0.95, 0.1, -0.05);
  put(face, box(0.7, 0.16, 0.24, mat.steel, 1), 0.95, 0.28, -0.18);
  const drawRoll = (g, W, H) => {
    g.fillStyle = '#e9e3cf';
    g.fillRect(0, 0, W, H);
    for (let y = 10; y < H; y += 13) text(g, CIPHER.join(' '), W / 2, y, { size: 11, color: '#3a3e52', font: '"Courier New", monospace' });
  };
  const sheet = (x, y, z, rx, rz, len) => {
    const p = decal(0.42, len, 150, drawRoll, { rough: 0.95 });
    p.material.side = THREE.DoubleSide;
    p.rotation.set(rx, 0, rz);
    put(face, p, x, y, z);
    return p;
  };
  sheet(0.95, 0.5, -0.12, -0.25, 0, 0.4);
  sheet(0.95, 0.3, 0.26, 1.2, 0, 0.6);
  sheet(0.95, -0.3, 0.42, 0.15, 0, 1.0);
  for (let i = 0; i < 9; i++) sheet(0.6 + R() * 0.8, -0.78 + i * 0.012, 0.5 + R() * 1.0, -Math.PI / 2 + (R() - 0.5) * 0.3, R() * 3, 0.5 + R() * 0.6);
  hot(put(face, proxy(1.0, 1.7, 1.4), 0.95, 0, 0.5), { id: 'final', nodes: ['vault'], cursor: 'look', action: ['final'] });
  // four chairs, drawn up close
  [-0.9, -0.3, 0.3, 0.9].forEach((dz, i) => {
    const ch = chair(mat.navy, mat.darkMetal);
    ch.rotation.y = RY.W + (i - 1.5) * 0.12 + Math.PI;
    put(root, ch, v.x1 - 2.3 - Math.abs(dz) * 0.25, F, mz + dz);
  });
  hot(put(root, proxy(0.8, 1.1, 2.6), v.x1 - 2.45, F + 0.55, mz), { id: 'chairs', nodes: ['vault'], cursor: 'look', action: ['look', 'chairs'] });

  const drawWheel = (n) => (g, W, H) => {
    g.fillStyle = '#d9d4c0';
    g.fillRect(0, 0, W, H);
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.75)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.75)');
    const f = '"Courier New", monospace';
    text(g, String((n + 1) % 10), W / 2, H * 0.14, { size: H * 0.2, color: '#555', font: f });
    text(g, String(n), W / 2, H * 0.51, { size: H * 0.34, color: '#111', font: f });
    text(g, String((n + 9) % 10), W / 2, H * 0.88, { size: H * 0.2, color: '#555', font: f });
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
  };

  let spin = 0, open = false, on = false;
  return {
    sync(state) {
      on = powered(state.gen, 'vault');
      open = state.vault.open;
      state.vault.wheels.forEach((n, i) => wheels[i].userData.redraw(drawWheel(n)));
      hinge.rotation.y = open ? -1.72 : 0;
      doorHit.userData.hot.disabled = open;
      setLamp(lockLamp, open ? 0x35ff55 : 0xffa020, on, 2.4);
      red.intensity = on && open ? 8 : 0;
      setLamp(redMat, 0xff3020, on, 3);
      work.intensity = on && open ? 3.5 : 0;
      leds.forEach(([m, hex, p]) => setLamp(m, hex, on && p > 0.25, 3));
    },
    tick() {
      if (!on) return false;
      spin += 0.35;
      reels[0].rotation.z = spin;
      reels[1].rotation.z = spin * 0.8;
      leds.forEach(([m, hex, p], i) => setLamp(m, hex, Math.sin(spin * (0.3 + p) + i) > -0.3, 3));
      return true;
    },
  };
}
