// The crew's quarters off the tunnel: kitchen (with the sump pump), break room and bunk room.
import * as THREE from 'three';
import { UF, ROOM_H, QUARTERS, RY } from './layout.js';
import { mat, lampMat, setLamp } from './materials.js';
import { M, box, cyl, put, grp, wall, decal, text, plate, hot, proxy, sideOf, cuts, rng } from './kit.js';
import { CAPACITY, VALVES, FEED } from '../puzzles/pump.js';
import { SCHEDULE_LINES, WIRING } from '../puzzles/junction.js';

const F = UF;

export function buildQuarters(parent) {
  const root = grp(parent);
  const R = rng(4343);

  /** Floor, ceiling, light and the three walls a room owns; the fourth is the tunnel wall with its door. */
  const room = (r, wallMat, walls = {}) => {
    const w = r.x1 - r.x0, d = r.z1 - r.z0, mx = (r.x0 + r.x1) / 2, mz = (r.z0 + r.z1) / 2;
    const fl = M(new THREE.PlaneGeometry(w, d, cuts(w), cuts(d)), mat.lino, false, true);
    fl.geometry.attributes.uv.array.forEach((v, i, a) => (a[i] = (v * (i % 2 ? d : w)) / 2));
    fl.rotation.x = -Math.PI / 2;
    put(root, fl, mx, F + 0.005, mz);
    put(root, box(w + 0.3, 0.1, d + 0.3, mat.ceiling, 1.2), mx, F + ROOM_H + 0.05, mz);
    const k = 0.1, far = r.x0 > 0 ? r.x1 + k / 2 : r.x0 - k / 2;
    wall(root, walls.N || wallMat, r.x0, r.z0 - k / 2, r.x1, r.z0 - k / 2, F, ROOM_H, k);
    wall(root, walls.S || wallMat, r.x0, r.z1 + k / 2, r.x1, r.z1 + k / 2, F, ROOM_H, k);
    wall(root, wallMat, far, r.z0 - k, far, r.z1 + k, F, ROOM_H, k);
    const m = lampMat(0x8a8d86);
    put(root, box(0.9, 0.06, 0.2, m), mx, F + ROOM_H - 0.03, mz);
    setLamp(m, 0xfff0d0, true, 2.2);
    const l = new THREE.PointLight(0xffe9c8, 9, 10, 1.5);
    l.position.set(mx, F + ROOM_H - 0.35, mz);
    root.add(l);
  };
  const sheet = (w, h, lines, { bg = '#e4dcc2', ink = '#333', head = null, torn = false } = {}) =>
    decal(w, h, 420, (g, W, H) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      if (head) text(g, head, W / 2, 20, { size: 20, color: ink });
      g.fillStyle = ink;
      for (let i = 0; i < lines; i++) g.fillRect(12, (head ? 44 : 18) + i * 13, W - 24 - ((i * 37) % 40), 2);
      if (torn) {
        g.fillStyle = '#7d6247';
        g.beginPath();
        g.moveTo(0, H);
        for (let x = 0; x <= W; x += 10) g.lineTo(x, H - 16 - ((x * 7) % 13));
        g.lineTo(W, H);
        g.fill();
      }
    });

  // ================================================================ kitchen
  const K = QUARTERS.kitchen;
  room(K, mat.cream, { N: mat.tile });
  // range and kettle
  put(root, box(1.1, 0.9, 0.6, mat.black), 2.75, F + 0.45, K.z0 + 0.32);
  put(root, box(1.14, 0.03, 0.64, mat.darkMetal), 2.75, F + 0.915, K.z0 + 0.32);
  for (const x of [2.5, 3.0]) put(root, M(new THREE.TorusGeometry(0.11, 0.015, 6, 18), mat.rust), x, F + 0.935, K.z0 + 0.3).rotation.x = Math.PI / 2;
  put(root, box(0.8, 0.5, 0.02, mat.darkMetal), 2.75, F + 0.4, K.z0 + 0.63);
  put(root, cyl(0.06, 1.55, mat.darkMetal, 10), 3.15, F + 1.7, K.z0 + 0.12);
  const kettle = grp(root, 2.5, F + 0.94, K.z0 + 0.3);
  put(kettle, cyl(0.1, 0.14, mat.chrome, 14, 0.07), 0, 0.07, 0);
  put(kettle, M(new THREE.TorusGeometry(0.07, 0.01, 6, 14, Math.PI), mat.black), 0, 0.14, 0);
  put(kettle, cyl(0.014, 0.1, mat.chrome, 6), 0.11, 0.1, 0).rotation.z = -0.8;
  hot(put(root, proxy(1.2, 1.3, 0.7), 2.75, F + 0.65, K.z0 + 0.35), { id: 'range', nodes: ['kitchen'], cursor: 'look', action: ['look', 'range'] });
  // sink, shelf, and four hooks with nothing on them
  put(root, box(1.8, 0.88, 0.6, mat.woodDark, 1), 4.6, F + 0.44, K.z0 + 0.32);
  put(root, box(1.84, 0.04, 0.64, mat.steel), 4.6, F + 0.9, K.z0 + 0.32);
  put(root, box(0.62, 0.02, 0.42, mat.darkMetal), 5.0, F + 0.925, K.z0 + 0.32);
  put(root, cyl(0.015, 0.24, mat.chrome, 6), 5.0, F + 1.04, K.z0 + 0.1);
  put(root, cyl(0.013, 0.16, mat.chrome, 6), 5.0, F + 1.15, K.z0 + 0.17).rotation.x = Math.PI / 2;
  put(root, box(1.8, 0.03, 0.22, mat.wood), 4.6, F + 1.68, K.z0 + 0.13);
  const tinMats = [mat.red, mat.navy, mat.green, mat.orange, mat.white, mat.yellow];
  for (let i = 0; i < 9; i++) put(root, cyl(0.05, 0.12 + (i % 3) * 0.02, tinMats[i % tinMats.length], 10), 3.85 + i * 0.185, F + 1.76 + (i % 3) * 0.01, K.z0 + 0.13);
  put(root, box(1.1, 0.03, 0.03, mat.woodDark), 4.3, F + 1.42, K.z0 + 0.04);
  for (let i = 0; i < 4; i++) put(root, cyl(0.008, 0.07, mat.brass, 6), 3.9 + i * 0.27, F + 1.4, K.z0 + 0.08).rotation.x = Math.PI / 2;
  hot(put(root, proxy(1.2, 0.26, 0.16), 4.3, F + 1.36, K.z0 + 0.1), { id: 'hooks', nodes: ['kitchen'], cursor: 'look', action: ['look', 'hooks'] });
  // table laid for four
  const table = grp(root, 4.25, F, -7.7);
  put(table, box(1.7, 0.05, 0.85, mat.wood, 1), 0, 0.74, 0);
  for (const [x, z] of [[-0.78, -0.36], [0.78, -0.36], [-0.78, 0.36], [0.78, 0.36]]) put(table, box(0.06, 0.72, 0.06, mat.woodDark), x, 0.36, z);
  for (const z of [-0.64, 0.64]) {
    put(table, box(1.5, 0.05, 0.26, mat.wood, 1), 0, 0.44, z);
    for (const x of [-0.65, 0.65]) put(table, box(0.05, 0.42, 0.22, mat.woodDark), x, 0.21, z);
  }
  for (const [x, z] of [[-0.45, -0.2], [0.45, -0.2], [-0.45, 0.2], [0.45, 0.2]]) {
    put(table, cyl(0.11, 0.012, mat.enamel, 16), x, 0.772, z);
    put(table, box(0.014, 0.004, 0.17, mat.chrome), x + 0.16, 0.768, z);
    put(table, box(0.014, 0.004, 0.17, mat.chrome), x - 0.16, 0.768, z);
  }
  const pot = put(table, M(new THREE.SphereGeometry(0.1, 12, 10), mat.rust), 0, 0.85, 0);
  pot.scale.y = 0.85;
  put(table, cyl(0.016, 0.12, mat.rust, 6), 0.13, 0.87, 0).rotation.z = -0.9;
  hot(put(table, proxy(1.75, 0.3, 0.9), 0, 0.82, 0), { id: 'table', nodes: ['kitchen'], cursor: 'look', action: ['look', 'table'] });
  // rota and stores ledger on the south wall
  const rota = decal(0.84, 0.64, 300, (g, W, H) => {
    g.fillStyle = '#e4dcc2';
    g.fillRect(0, 0, W, H);
    text(g, 'GALLEY ROTA', W / 2, 18, { size: 20, color: '#222' });
    g.strokeStyle = '#444';
    g.lineWidth = 1.5;
    for (let i = 0; i <= 6; i++) {
      g.beginPath();
      g.moveTo(10, 36 + i * 25);
      g.lineTo(W - 10, 36 + i * 25);
      g.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      g.beginPath();
      g.moveTo(10 + (i * (W - 20)) / 4, 36);
      g.lineTo(10 + (i * (W - 20)) / 4, 36 + 150);
      g.stroke();
    }
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
      const listening = r * 4 + c >= 24 - Math.floor((r + 1) * (r + 1) * 0.7);
      g.fillStyle = listening ? '#8c1f17' : '#1c2a5a';
      g.fillRect(18 + (c * (W - 20)) / 4, 46 + r * 25, listening ? 46 : 30 + ((r * 3 + c * 5) % 12), 3);
    }
  });
  rota.rotation.y = RY.N;
  put(root, rota, 3.0, F + 1.55, K.z1 - 0.01);
  hot(rota, { id: 'rota', nodes: ['kitchen'], cursor: 'look', action: ['doc', 'rota'] });
  const ledger = sheet(0.3, 0.42, 16, { head: 'STORES' });
  ledger.rotation.y = RY.N;
  put(root, ledger, 4.25, F + 1.5, K.z1 - 0.03);
  put(root, box(0.34, 0.46, 0.02, mat.navy), 4.25, F + 1.5, K.z1 - 0.012);
  hot(ledger, { id: 'ledger', nodes: ['kitchen'], cursor: 'look', action: ['doc', 'ledger'] });

  // ---- the sump pump, on the east wall
  const pp = grp(root, K.x1 - 0.01, F + 1.2, -9.25, RY.W);
  put(pp, box(2.8, 2.05, 0.06, mat.darkMetal), 0, 0, 0.03);
  put(pp, plate(0.9, 0.09, 'SUMP PUMP - SIPHON PRIMING'), -0.85, 0.92, 0.062);
  const TANK = [{ x: -0.85, r: 0.26, h: 1.25 }, { x: 0, r: 0.22, h: 0.95 }, { x: 0.78, r: 0.17, h: 0.66 }];
  const base = -0.62;
  const sights = TANK.map((t, i) => {
    put(pp, cyl(t.r, t.h, mat.genGreen, 20), t.x, base + t.h / 2, t.r + 0.07);
    put(pp, cyl(t.r + 0.02, 0.04, mat.darkMetal, 20), t.x, base + t.h, t.r + 0.07);
    put(pp, cyl(t.r + 0.02, 0.04, mat.darkMetal, 20), t.x, base + 0.02, t.r + 0.07);
    const s = decal(0.13, t.h * 0.86, 420, () => {}, { rough: 0.3 });
    put(pp, s, t.x, base + t.h / 2, 2 * t.r + 0.078);
    put(pp, box(0.15, t.h * 0.86 + 0.02, 0.01, mat.black), t.x, base + t.h / 2, 2 * t.r + 0.072);
    put(pp, plate(0.26, 0.07, `${CAPACITY[i]} GAL`, { bg: '#e6dfc8', fg: '#151515' }), t.x, base + t.h + 0.1, 0.062);
    return s;
  });
  // pipework and the three valves
  const pipe = (x0, y0, x1, y1) => put(pp, box(Math.abs(x1 - x0) + 0.05, Math.abs(y1 - y0) + 0.05, 0.05, mat.copper), (x0 + x1) / 2, (y0 + y1) / 2, 0.12);
  pipe(-0.6, -0.2, -0.2, -0.2);
  pipe(0.2, -0.2, 0.62, -0.2);
  pipe(-0.85, base, -0.85, -0.84);
  pipe(0.78, base, 0.78, -0.84);
  pipe(-0.85, -0.84, 0.78, -0.84);
  const VALVE_AT = [[-0.4, -0.2], [0.41, -0.2], [-0.04, -0.84]];
  VALVES.forEach(([a, b], i) => {
    const [x, y] = VALVE_AT[i];
    const v = grp(pp, x, y, 0.2);
    v.add(M(new THREE.TorusGeometry(0.085, 0.014, 8, 20), mat.red));
    for (let k = 0; k < 2; k++) {
      const s = box(0.17, 0.016, 0.012, mat.red);
      s.rotation.z = (k * Math.PI) / 2;
      v.add(s);
    }
    put(pp, cyl(0.03, 0.1, mat.brass, 10), x, y, 0.15).rotation.x = Math.PI / 2;
    put(pp, plate(0.32, 0.075, `${CAPACITY[a]}  <  >  ${CAPACITY[b]}`), x, y + (i === 2 ? 0.17 : -0.17), 0.062);
    hot(put(pp, proxy(0.26, 0.22, 0.16), x, y, 0.18), { id: 'valve-' + i, nodes: ['pump'], cursor: 'shift', action: ['valve', i], dir: sideOf(pp, x, y) });
  });
  // pump body, priming lever and lamp
  const body = put(pp, cyl(0.15, 0.36, mat.genGreen, 16), 1.14, -0.62, 0.22);
  body.rotation.z = Math.PI / 2;
  put(pp, box(0.3, 0.06, 0.3, mat.darkMetal), 1.14, -0.8, 0.2);
  pipe(0.22, -0.5, 1.0, -0.5);
  put(pp, box(0.14, 0.34, 0.02, mat.black), 1.14, -0.08, 0.07);
  const primeLever = grp(pp, 1.14, -0.08, 0.08);
  put(primeLever, box(0.05, 0.05, 0.22, mat.red), 0, 0, 0.1);
  put(pp, plate(0.2, 0.06, 'PRIME'), 1.14, -0.31, 0.062);
  put(pp, plate(0.36, 0.11, '', { lines: ['CHARGE DRAWN FROM', `${CAPACITY[FEED]} GAL TANK`] }), 1.12, 0.26, 0.062);
  const runLamp = lampMat(0x1c2a1c);
  put(pp, cyl(0.03, 0.03, runLamp, 12), 1.14, 0.5, 0.075).rotation.x = Math.PI / 2;
  put(pp, plate(0.22, 0.05, 'RUNNING'), 1.14, 0.42, 0.062);
  hot(put(pp, proxy(0.22, 0.36, 0.3), 1.14, -0.08, 0.2), { id: 'prime', nodes: ['pump'], cursor: 'hand', action: ['prime'] });
  hot(put(root, proxy(0.7, 2.0, 2.8), K.x1 - 0.36, F + 1.2, -9.25), { id: 'pumpzoom', nodes: ['kitchen'], cursor: 'zoom', action: ['go', 'pump'] });

  // ================================================================ break room
  const B = QUARTERS.mess;
  room(B, mat.cream);
  // dartboard and chalk scores
  const board = decal(0.5, 0.5, 300, (g, W) => {
    const c = W / 2;
    g.fillStyle = '#2a2018';
    g.fillRect(0, 0, W, W);
    for (let i = 0; i < 20; i++) {
      const a0 = (i * Math.PI) / 10 - Math.PI / 20, a1 = a0 + Math.PI / 10;
      g.fillStyle = i % 2 ? '#d8cfae' : '#1a1a1a';
      g.beginPath();
      g.moveTo(c, c);
      g.arc(c, c, c * 0.86, a0, a1);
      g.fill();
      g.fillStyle = i % 2 ? '#2f7d3a' : '#a3261c';
      g.beginPath();
      g.arc(c, c, c * 0.86, a0, a1);
      g.arc(c, c, c * 0.78, a1, a0, true);
      g.fill();
      g.beginPath();
      g.arc(c, c, c * 0.52, a0, a1);
      g.arc(c, c, c * 0.45, a1, a0, true);
      g.fill();
    }
    g.fillStyle = '#2f7d3a';
    g.beginPath();
    g.arc(c, c, c * 0.09, 0, 7);
    g.fill();
    g.fillStyle = '#a3261c';
    g.beginPath();
    g.arc(c, c, c * 0.04, 0, 7);
    g.fill();
  });
  board.rotation.y = RY.E;
  put(root, board, B.x0 + 0.036, F + 1.68, -9.95);
  put(root, box(0.03, 0.56, 0.56, mat.woodDark), B.x0 + 0.015, F + 1.68, -9.95);
  for (const [y, z] of [[1.78, -9.9], [1.6, -10.06], [1.71, -9.82]]) put(root, cyl(0.006, 0.14, mat.brass, 5), B.x0 + 0.09, F + y, z).rotation.z = Math.PI / 2 + 0.15;
  const chalk = decal(0.62, 0.8, 260, (g, W, H) => {
    g.fillStyle = '#20262a';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#8a6a48';
    g.lineWidth = 8;
    g.strokeRect(4, 4, W - 8, H - 8);
    const ink = 'rgba(232,232,220,0.9)';
    ['H', 'V', 'L', 'O'].forEach((n, i) => {
      const x = 28 + i * 36;
      text(g, n, x, 26, { size: 20, color: ink });
      [501, 441 - i * 23, 356 - i * 31, 255 - i * 12, 170 + i * 9].forEach((v, r) => {
        text(g, String(v), x, 52 + r * 24, { size: 13, color: ink, weight: 'normal' });
        if (r < 4) {
          g.strokeStyle = ink;
          g.lineWidth = 1.5;
          g.beginPath();
          g.moveTo(x - 14, 52 + r * 24);
          g.lineTo(x + 14, 52 + r * 24);
          g.stroke();
        }
      });
    });
  });
  chalk.rotation.y = RY.E;
  put(root, chalk, B.x0 + 0.02, F + 1.5, -8.75);
  hot(put(root, proxy(0.2, 1.0, 2.0), B.x0 + 0.12, F + 1.55, -9.4), { id: 'darts', nodes: ['mess'], cursor: 'look', action: ['look', 'darts'] });
  // sideboard with the record player and the wireless
  put(root, box(1.7, 0.8, 0.45, mat.woodDark, 1), -4.1, F + 0.4, B.z0 + 0.25);
  const player = grp(root, -4.5, F + 0.8, B.z0 + 0.26);
  put(player, box(0.46, 0.1, 0.36, mat.navy), 0, 0.05, 0);
  put(player, cyl(0.15, 0.012, mat.black, 22), -0.04, 0.108, 0);
  put(player, cyl(0.045, 0.014, mat.red, 12), -0.04, 0.11, 0);
  const arm = put(player, box(0.016, 0.016, 0.2, mat.chrome), 0.17, 0.16, 0.02);
  arm.rotation.set(0.5, 0.3, 0);
  for (let i = 0; i < 5; i++) put(root, box(0.32, 0.008, 0.32, [mat.red, mat.paper, mat.navy, mat.orange, mat.green][i]), -3.85 + (i % 2) * 0.01, F + 0.806 + i * 0.009, B.z0 + 0.27).rotation.y = i * 0.07;
  put(root, box(0.42, 0.28, 0.2, mat.wood, 0.8), -3.45, F + 0.94, B.z0 + 0.2);
  put(root, decal(0.3, 0.12, 300, (g, W, H) => {
    g.fillStyle = '#c9b98a';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#222';
    for (let x = 6; x < W; x += 9) g.fillRect(x, H * 0.55, 1.5, H * 0.3);
    g.fillStyle = '#a3261c';
    g.fillRect(W * 0.62, 4, 2, H - 8);
  }), -3.45, F + 0.98, B.z0 + 0.302);
  hot(put(root, proxy(1.7, 0.6, 0.5), -4.1, F + 0.95, B.z0 + 0.28), { id: 'records', nodes: ['mess'], cursor: 'look', action: ['look', 'records'] });
  // two armchairs
  const armchair = (x, z, ry, m) => {
    const a = grp(root, x, F, z, ry);
    put(a, box(0.62, 0.4, 0.62, m), 0, 0.2, 0);
    put(a, box(0.62, 0.55, 0.16, m), 0, 0.62, -0.26);
    for (const s of [-1, 1]) put(a, box(0.14, 0.24, 0.62, m), s * 0.3, 0.5, 0);
  };
  armchair(-6.5, -11.2, 0.5, mat.wool);
  armchair(-2.6, -11.3, -0.4, mat.navy);
  hot(put(root, proxy(0.8, 0.9, 0.8), -6.5, F + 0.5, -11.2), { id: 'armchairs', nodes: ['mess'], cursor: 'look', action: ['look', 'armchairs'] });
  put(root, cyl(0.2, 0.75, mat.black, 12), -6.75, F + 0.375, -7.0);
  put(root, cyl(0.05, 1.75, mat.darkMetal, 8), -6.75, F + 1.62, -7.0);
  // notice board: Voss's cable schedule, with the bottom torn off, and a calendar
  const cork = decal(1.3, 0.86, 240, (g, W, H) => {
    g.fillStyle = '#6d5237';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#8a6a48';
    g.fillRect(8, 8, W - 16, H - 16);
  });
  cork.rotation.y = RY.N;
  put(root, cork, -3.7, F + 1.55, B.z1 - 0.01);
  const sched = decal(0.44, 0.52, 460, (g, W, H) => {
    g.fillStyle = '#8a6a48';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#e4dcc2';
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(W, 0);
    g.lineTo(W, H * 0.78);
    for (let x = W; x >= 0; x -= 9) g.lineTo(x, H * 0.72 + ((x * 11) % 17));
    g.fill();
    text(g, 'SIGNAL LINE K', W / 2, 20, { size: 18, color: '#222' });
    text(g, 'CABLE SCHEDULE', W / 2, 40, { size: 15, color: '#222' });
    const colours = { red: '#a3261c', blue: '#2a56a8', green: '#2f7d3a', yellow: '#d1b12a', white: '#f4f1e6' };
    SCHEDULE_LINES.forEach((c, i) => {
      g.fillStyle = colours[c];
      g.fillRect(16, 62 + i * 30, 36, 14);
      g.strokeStyle = '#222';
      g.strokeRect(16, 62 + i * 30, 36, 14);
      g.fillStyle = '#444';
      for (let x = 60; x < W - 64; x += 8) g.fillRect(x, 70 + i * 30, 3, 2);
      text(g, 'T' + WIRING[c], W - 34, 70 + i * 30, { size: 20, color: '#222' });
    });
    g.fillStyle = '#a3261c';
    g.beginPath();
    g.arc(W / 2, 6, 4, 0, 7);
    g.fill();
  });
  sched.rotation.y = RY.N;
  put(root, sched, -3.45, F + 1.55, B.z1 - 0.016);
  hot(sched, { id: 'schedule', nodes: ['mess'], cursor: 'look', action: ['doc', 'schedule'] });
  const calendar = decal(0.34, 0.44, 420, (g, W, H) => {
    g.fillStyle = '#e9e3cf';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#8c1f17';
    g.fillRect(0, 0, W, 30);
    g.strokeStyle = '#1c2a5a';
    g.lineWidth = 2;
    for (let d = 0; d < 35; d++) {
      const x = 12 + (d % 7) * 18, y = 46 + Math.floor(d / 7) * 26;
      g.strokeStyle = 'rgba(0,0,0,0.35)';
      g.strokeRect(x, y, 14, 18);
      if (d < 26) {
        g.strokeStyle = '#1c2a5a';
        g.beginPath();
        g.moveTo(x + 1, y + 1);
        g.lineTo(x + 13, y + 17);
        g.moveTo(x + 13, y + 1);
        g.lineTo(x + 1, y + 17);
        g.stroke();
      }
    }
  });
  calendar.rotation.y = RY.N;
  put(root, calendar, -4.1, F + 1.58, B.z1 - 0.016);
  hot(calendar, { id: 'calendar', nodes: ['mess'], cursor: 'look', action: ['look', 'calendar'] });
  // card table: four hands dealt, no chairs
  const ct = grp(root, -4.9, F, -7.85);
  put(ct, box(0.92, 0.04, 0.92, mat.felt), 0, 0.72, 0);
  put(ct, box(0.96, 0.03, 0.96, mat.woodDark), 0, 0.695, 0);
  for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) put(ct, box(0.05, 0.7, 0.05, mat.woodDark), x, 0.35, z);
  for (let hnd = 0; hnd < 4; hnd++) {
    const hand = grp(ct, 0, 0.742, 0, (hnd * Math.PI) / 2);
    for (let c = 0; c < 5; c++) {
      const card = put(hand, box(0.06, 0.003, 0.09, mat.navy), -0.1 + c * 0.05, c * 0.001, 0.32);
      card.rotation.y = (c - 2) * 0.12;
    }
  }
  put(ct, box(0.065, 0.03, 0.095, mat.navy), 0.05, 0.756, 0.02).rotation.y = 0.3;
  hot(put(ct, proxy(0.96, 0.2, 0.96), 0, 0.8, 0), { id: 'cards', nodes: ['mess'], cursor: 'look', action: ['look', 'cards'] });

  // ================================================================ bunk room
  const U = QUARTERS.bunks;
  room(U, mat.cream);
  const covers = { harlan: mat.navy, voss: mat.red, lund: mat.green, okafor: mat.black };
  /** A double bunk along a wall. face is the compass direction it faces into the room. */
  const bunk = (z, face, lower, upper) => {
    const b = grp(root, 3.95, F, z, RY[face]);
    for (const [x, zz] of [[-1.0, -0.4], [1.0, -0.4], [-1.0, 0.4], [1.0, 0.4]]) put(b, box(0.06, 1.95, 0.06, mat.darkMetal), x, 0.975, zz);
    [[0.42, lower], [1.3, upper]].forEach(([y, who]) => {
      put(b, box(2.0, 0.06, 0.85, mat.darkMetal), 0, y, 0);
      put(b, box(1.94, 0.12, 0.8, mat.ticking, 0.5), 0, y + 0.09, 0);
      put(b, box(1.3, 0.035, 0.82, mat.wool, 0.6), 0.3, y + 0.165, 0);
      put(b, box(0.42, 0.09, 0.5, mat.white), -0.72, y + 0.19, -0.05);
      put(b, box(2.0, 0.1, 0.03, mat.darkMetal), 0, y + 0.06, 0.42);
      put(b, plate(0.36, 0.07, who.toUpperCase(), { bg: '#e6dfc8', fg: '#151515' }), -0.1, y + 0.06, 0.437);
      // their notebook, propped where it can be seen
      const nb = grp(b, 0.55, y + 0.19, 0.1);
      nb.rotation.x = -0.45;
      put(nb, box(0.2, 0.27, 0.03, covers[who]), 0, 0.135, 0);
      put(nb, plate(0.12, 0.05, who[0].toUpperCase() + '.', { bg: '#e6dfc8', fg: '#151515' }), 0, 0.17, 0.017);
      hot(put(nb, proxy(0.3, 0.34, 0.2), 0, 0.14, 0.02), { id: 'nb-' + who, nodes: ['bunks'], cursor: 'look', action: ['doc', 'nb-' + who] });
    });
    for (let i = 0; i < 5; i++) put(b, box(0.03, 0.03, 0.42, mat.darkMetal), 1.03, 0.3 + i * 0.3, 0.2);
  };
  bunk(U.z0 + 0.45, 'S', 'harlan', 'voss');
  bunk(U.z1 - 0.45, 'N', 'lund', 'okafor');
  // four lockers, nothing taken
  ['HARLAN', 'VOSS', 'LUND', 'OKAFOR'].forEach((name, i) => {
    const z = -20.1 + i * 0.56, x = U.x1 - 0.24;
    put(root, box(0.46, 1.8, 0.52, mat.steel, 1), x, F + 0.9, z);
    const door = grp(root, x - 0.235, F, z - 0.25);
    put(door, box(0.02, 1.74, 0.5, mat.steel, 1), 0, 0.9, 0.25);
    door.rotation.y = i % 2 ? 0 : -0.5 - R() * 0.4;
    const tag = plate(0.3, 0.06, name, { bg: '#e6dfc8', fg: '#151515' });
    tag.rotation.y = RY.W;
    put(door, tag, -0.012, 1.55, 0.25);
    if (i % 2 === 0) for (let k = 0; k < 3; k++) put(root, box(0.3, 0.07, 0.36, [mat.navy, mat.wool, mat.white][k]), x - 0.02, F + 0.5 + k * 0.08, z);
  });
  hot(put(root, proxy(0.6, 1.8, 2.3), U.x1 - 0.3, F + 0.9, -19.26), { id: 'lockers', nodes: ['bunks'], cursor: 'look', action: ['look', 'lockers'] });

  // ---------------------------------------------------------------- things that change
  const drawSight = (cap, level) => (g, W, H) => {
    g.fillStyle = '#c9d2c8';
    g.fillRect(0, 0, W, H);
    const bar = W * 0.46;
    g.fillStyle = '#2d6f84';
    g.fillRect(0, H * (1 - level / cap), bar, (H * level) / cap);
    g.fillStyle = '#1d1d1d';
    g.fillRect(bar, 0, 2, H);
    for (let i = 0; i <= cap; i++) {
      const y = Math.min(H - 1, Math.max(1, H * (1 - i / cap)));
      g.fillRect(bar, y - 1, W * 0.16, 2);
      if (i > 0) text(g, String(i), W * 0.82, Math.max(9, y + (i === cap ? 8 : 0)), { size: Math.min(15, (H / cap) * 0.8), color: '#1d1d1d' });
    }
  };

  return {
    sync(state) {
      const p = state.pump;
      sights.forEach((s, i) => s.userData.redraw(drawSight(CAPACITY[i], p.levels[i])));
      primeLever.rotation.x = p.drained ? -0.6 : 0.6;
      setLamp(runLamp, 0x35ff55, p.drained, 2.5);
    },
  };
}
