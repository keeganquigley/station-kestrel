// The three rooms off the quay: the dock office (with the picture telegraph), the diving store
// (with the tally board and the property cage) and the darkroom.
import * as THREE from 'three';
import { PF, DOCK, RY } from './layout.js';
import { mat, lampMat, setLamp } from './materials.js';
import { M, box, cyl, put, grp, wall, decal, text, plate, hot, proxy, sideOf, wheelFace, cuts, chair } from './kit.js';
import { NAMES, TALLIES } from '../puzzles/tally.js';
import { WHEELS, HULL } from '../puzzles/telegraph.js';
import { TEMPERATURE, CHART, BATHS } from '../puzzles/darkroom.js';
import { drawPhoto } from '../data/photo.js';
import { STOPPED_CLOCK } from '../puzzles/receiver.js';

const F = PF, H = 2.5;
const PAPER = '#e4dcc2';

export function buildDockRooms(parent) {
  const root = grp(parent);

  /** Floor, ceiling and the three walls a room owns; the fourth is the quay wall with its door. */
  const room = (r, wallMat, lit = true) => {
    const w = r.x1 - r.x0, d = r.z1 - r.z0, mx = (r.x0 + r.x1) / 2, mz = (r.z0 + r.z1) / 2;
    const lap = 0.25, fw = w + lap; // the floor runs on under the door frame
    const fl = M(new THREE.PlaneGeometry(fw, d + 0.2, cuts(fw), cuts(d)), mat.lino, false, true);
    fl.geometry.attributes.uv.array.forEach((v, i, a) => (a[i] = (v * (i % 2 ? d : fw)) / 2));
    fl.rotation.x = -Math.PI / 2;
    put(root, fl, mx - lap / 2, F + 0.005, mz);
    put(root, box(w + 0.3, 0.1, d + 0.3, mat.ceiling, 1.2), mx, F + H + 0.05, mz);
    const k = 0.1;
    wall(root, wallMat, r.x0, r.z0 - k / 2, r.x1, r.z0 - k / 2, F, H, k);
    wall(root, wallMat, r.x0, r.z1 + k / 2, r.x1, r.z1 + k / 2, F, H, k);
    wall(root, wallMat, r.x1 + k / 2, r.z0 - k, r.x1 + k / 2, r.z1 + k, F, H, k);
    const m = lampMat(0x8a8d86);
    put(root, box(0.9, 0.06, 0.2, m), mx, F + H - 0.03, mz);
    const l = new THREE.PointLight(0xffe9c8, lit ? 9 : 0, 10, 1.5);
    l.position.set(mx, F + H - 0.35, mz);
    root.add(l);
    if (lit) setLamp(m, 0xfff0d0, true, 2.2);
    return { light: l, tube: m };
  };
  /** A sheet of paper with ruled lines standing for writing. */
  const sheet = (w, h, lines, { bg = PAPER, ink = '#333', head = null, px = 420 } = {}) =>
    decal(w, h, px, (g, W, HH) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, W, HH);
      if (head) text(g, head, W / 2, 18, { size: 16, color: ink });
      g.fillStyle = ink;
      for (let i = 0; i < lines; i++) g.fillRect(10, (head ? 38 : 16) + i * 12, W - 20 - ((i * 37) % 36), 2);
    });
  const wheelDecal = (frame, x, y, w = 0.07, h = 0.2) => {
    const d = decal(w, h, 620, () => {}, { rough: 0.5 });
    put(frame, d, x, y, 0.066);
    put(frame, box(w + 0.012, h + 0.014, 0.01, mat.black), x, y, 0.06);
    return d;
  };

  // ================================================================ dock office
  const O = DOCK.office;
  room(O, mat.cream);
  // bench and the picture telegraph on the north wall
  const TX = 11.2;
  put(root, box(2.1, 0.86, 0.62, mat.woodDark, 1), TX, F + 0.43, O.z0 + 0.33);
  put(root, box(2.14, 0.04, 0.66, mat.deskWood, 1), TX, F + 0.88, O.z0 + 0.33);
  const tg = grp(root, TX, F + 0.9, O.z0 + 0.36);
  put(tg, box(0.84, 0.1, 0.4, mat.console, 1), 0.1, 0.05, 0);
  for (const s of [-1, 1]) put(tg, box(0.05, 0.22, 0.2, mat.darkMetal), 0.1 + s * 0.36, 0.2, -0.05);
  const drum = cyl(0.085, 0.62, mat.chrome, 18);
  drum.rotation.z = Math.PI / 2;
  put(tg, drum, 0.1, 0.24, -0.05);
  put(tg, box(0.66, 0.012, 0.012, mat.chrome), 0.1, 0.36, 0.02); // the stylus rail
  put(tg, box(0.05, 0.06, 0.07, mat.black), 0.0, 0.34, 0.03);
  const wirePaper = decal(0.34, 0.42, 520, () => {}, { rough: 0.95 });
  wirePaper.rotation.x = -1.05;
  put(tg, wirePaper, 0.1, 0.14, 0.26);
  put(tg, box(0.38, 0.012, 0.46, mat.steel), 0.1, 0.128, 0.262).rotation.x = -1.05 + Math.PI / 2;
  hot(put(tg, proxy(0.4, 0.3, 0.44), 0.1, 0.2, 0.26), { id: 'wirepaper', nodes: ['telegraph'], cursor: 'hand', action: ['wirepaper'] });
  // its panel on the wall above
  const tp = grp(root, TX, F + 1.42, O.z0 + 0.005);
  put(tp, box(1.24, 0.5, 0.06, mat.console, 1), 0, 0, 0.03);
  put(tp, plate(0.62, 0.07, 'PICTURE TELEGRAPH - RECORDS'), -0.27, 0.19, 0.062);
  const tw = [];
  for (let i = 0; i < WHEELS; i++) {
    const x = -0.5 + i * 0.086 + (i >= HULL.length ? 0.07 : 0), y = -0.02;
    tw.push(wheelDecal(tp, x, y));
    hot(put(tp, proxy(0.082, 0.214, 0.06), x, y, 0.08), { id: 'twheel-' + i, nodes: ['telegraph'], cursor: 'spin', action: ['twheel', i], dir: sideOf(tp, x, y, 'y') });
  }
  put(tp, plate(0.25, 0.05, 'HULL No.'), -0.414, -0.18, 0.062);
  put(tp, plate(0.165, 0.05, 'TALLY'), -0.129, -0.18, 0.062);
  const callKey = put(tp, cyl(0.05, 0.04, mat.green, 14), 0.18, -0.02, 0.08);
  callKey.rotation.x = Math.PI / 2;
  put(tp, plate(0.16, 0.05, 'CALL'), 0.18, -0.13, 0.062);
  hot(callKey, { id: 'call', nodes: ['telegraph'], cursor: 'hand', action: ['call'] });
  const wireLamp = lampMat(0x22281f);
  put(tp, cyl(0.026, 0.03, wireLamp, 12), 0.42, -0.02, 0.075).rotation.x = Math.PI / 2;
  put(tp, plate(0.16, 0.045, 'LINE'), 0.42, -0.12, 0.062);
  hot(put(root, proxy(1.3, 1.1, 0.7), TX, F + 1.2, O.z0 + 0.36), { id: 'telegraphzoom', nodes: ['dockoffice'], cursor: 'zoom', action: ['go', 'telegraph'] });
  // the request slip pinned beside it
  const slip = sheet(0.3, 0.36, 12, { head: 'RECORDS BY WIRE' });
  put(root, slip, 10.28, F + 1.46, O.z0 + 0.012);
  hot(slip, { id: 'slip', nodes: ['dockoffice', 'telegraph'], cursor: 'look', action: ['doc', 'slip'] });
  // desk on the east wall with the berth log
  const desk = grp(root, O.x1 - 0.45, F, -118.3);
  put(desk, box(0.8, 0.05, 1.6, mat.deskWood, 1), 0, 0.76, 0);
  for (const z of [-0.6, 0.6]) put(desk, box(0.7, 0.74, 0.36, mat.woodDark, 1), 0, 0.37, z);
  const log = grp(desk, -0.06, 0.79, 0.1);
  put(log, box(0.42, 0.03, 0.58, mat.navy), 0, 0.015, 0);
  const pages = decal(0.38, 0.54, 360, (g, W, HH) => {
    g.fillStyle = PAPER;
    g.fillRect(0, 0, W, HH);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(W / 2 - 1, 0, 2, HH);
    g.fillStyle = '#2b2b2b';
    for (let i = 0; i < 12; i++) {
      g.fillRect(8, 16 + i * 14, W / 2 - 18 - ((i * 13) % 20), 2);
      if (i < 8) g.fillRect(W / 2 + 8, 16 + i * 14, W / 2 - 18 - ((i * 29) % 26), 2);
    }
    g.fillStyle = '#1c2a5a';
    g.fillRect(W / 2 + 8, 16 + 8 * 14, W / 2 - 30, 2);
  });
  pages.rotation.x = -Math.PI / 2;
  pages.rotation.z = Math.PI / 2;
  put(log, pages, 0, 0.034, 0);
  hot(put(log, proxy(0.46, 0.1, 0.62), 0, 0.05, 0), { id: 'berthlog', nodes: ['dockoffice'], cursor: 'look', action: ['doc', 'berthlog'] });
  put(desk, cyl(0.07, 0.02, mat.darkMetal, 12), 0.2, 0.795, -0.55);
  put(desk, cyl(0.012, 0.36, mat.brass, 6), 0.2, 0.97, -0.55);
  put(desk, cyl(0.11, 0.12, mat.green, 12, 0.05), 0.14, 1.16, -0.55).rotation.z = 0.5;
  const dchair = chair(mat.wood, mat.woodDark);
  dchair.rotation.y = RY.E + 0.9;
  put(root, dchair, O.x1 - 1.3, F, -119.5);
  // a wall clock over the desk, and the routine card and a cabinet on the south wall
  const clock = decal(0.36, 0.36, 300, (g, W) => {
    const c = W / 2, [hh, mm] = STOPPED_CLOCK.split(':').map(Number);
    g.fillStyle = '#20242a';
    g.fillRect(0, 0, W, W);
    g.fillStyle = '#e7e1cc';
    g.beginPath();
    g.arc(c, c, c * 0.9, 0, 7);
    g.fill();
    g.strokeStyle = '#1a1a1a';
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      g.lineWidth = i % 3 ? 2 : 4;
      g.beginPath();
      g.moveTo(c + Math.sin(a) * c * 0.72, c - Math.cos(a) * c * 0.72);
      g.lineTo(c + Math.sin(a) * c * 0.82, c - Math.cos(a) * c * 0.82);
      g.stroke();
    }
    const hand = (a, l, w) => {
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(c, c);
      g.lineTo(c + Math.sin(a) * l, c - Math.cos(a) * l);
      g.stroke();
    };
    hand((((hh % 12) + mm / 60) * Math.PI) / 6, c * 0.45, 5);
    hand((mm * Math.PI) / 30, c * 0.68, 3);
  });
  clock.rotation.y = RY.W;
  put(root, clock, O.x1 - 0.012, F + 1.85, -118.3);
  hot(clock, { id: 'dockclock', nodes: ['dockoffice'], cursor: 'look', action: ['look', 'dockclock'] });
  const routine = decal(0.4, 0.5, 400, (g, W, HH) => {
    g.fillStyle = '#d8c98f';
    g.fillRect(0, 0, W, HH);
    g.fillStyle = '#8c1f17';
    g.fillRect(0, 0, W, 24);
    g.fillStyle = '#2b2b2b';
    for (let i = 0; i < 11; i++) g.fillRect(12, 42 + i * 14, W - 24 - ((i * 31) % 40), 2);
  });
  routine.rotation.y = RY.N;
  put(root, routine, 10.9, F + 1.5, O.z1 - 0.012);
  hot(routine, { id: 'routine', nodes: ['dockoffice'], cursor: 'look', action: ['doc', 'routine'] });
  put(root, box(0.5, 1.35, 0.6, mat.steel, 1), 11.75, F + 0.675, O.z1 - 0.33);
  for (let i = 0; i < 4; i++) {
    put(root, box(0.44, 0.28, 0.02, mat.panelGrey), 11.75, F + 0.2 + i * 0.32, O.z1 - 0.64);
    put(root, box(0.12, 0.02, 0.02, mat.chrome), 11.75, F + 0.26 + i * 0.32, O.z1 - 0.655);
  }
  hot(put(root, proxy(0.5, 1.35, 0.1), 11.75, F + 0.675, O.z1 - 0.66), { id: 'cabinet', nodes: ['dockoffice'], cursor: 'look', action: ['look', 'cabinet'] });

  // ================================================================ diving store
  const S = DOCK.store;
  room(S, mat.cream);
  // tally board on the north wall
  const BX = 10.4;
  const tb = grp(root, BX, F + 1.4, S.z0 + 0.005);
  put(tb, box(1.5, 0.96, 0.05, mat.woodDark, 1), 0, 0, 0.025);
  put(tb, plate(0.9, 0.075, 'DIVING STORE - TALLY BOARD'), -0.24, 0.39, 0.052);
  put(tb, plate(1.1, 0.055, 'EACH TALLY TO HANG AGAINST ITS HOLDER'), -0.14, -0.4, 0.052);
  const drums = {};
  NAMES.forEach((n, i) => {
    const x = -0.56 + i * 0.3;
    put(tb, plate(0.26, 0.07, n.toUpperCase(), { bg: '#e6dfc8', fg: '#151515' }), x, 0.22, 0.052);
    put(tb, cyl(0.012, 0.05, mat.brass, 6), x, 0.14, 0.07).rotation.x = Math.PI / 2;
    const d = decal(0.17, 0.3, 420, () => {}, { rough: 0.5 });
    put(tb, d, x, -0.1, 0.056);
    put(tb, box(0.185, 0.315, 0.01, mat.black), x, -0.1, 0.05);
    drums[n] = d;
    hot(put(tb, proxy(0.185, 0.32, 0.06), x, -0.1, 0.07), { id: 'tally-' + n, nodes: ['tallyboard'], cursor: 'spin', action: ['tally', n], dir: sideOf(tb, x, -0.1, 'y') });
  });
  put(tb, box(0.1, 0.44, 0.02, mat.black), 0.63, -0.02, 0.052);
  const barLever = grp(tb, 0.63, -0.02, 0.06);
  put(barLever, box(0.05, 0.05, 0.22, mat.red), 0, 0, 0.1);
  put(tb, plate(0.2, 0.055, 'CAGE BAR'), 0.63, 0.28, 0.052);
  hot(put(tb, proxy(0.2, 0.46, 0.28), 0.63, -0.02, 0.2), { id: 'cagebar', nodes: ['tallyboard'], cursor: 'hand', action: ['cagebar'] });
  hot(put(root, proxy(1.5, 1.0, 0.3), BX, F + 1.4, S.z0 + 0.2), { id: 'tallyzoom', nodes: ['store'], cursor: 'zoom', action: ['go', 'tallyboard'] });
  // four lockers on the south wall, numbered like the tallies
  TALLIES.forEach((t, i) => {
    const x = 9.9 + i * 0.62, z = S.z1 - 0.28;
    put(root, box(0.56, 1.9, 0.5, mat.steel, 1), x, F + 0.95, z);
    const door = grp(root, x - 0.28, F, z - 0.255);
    put(door, box(0.56, 1.84, 0.02, mat.panelGrey), 0.28, 0.95, 0);
    const num = plate(0.2, 0.12, String(t), { bg: '#7b7f78', fg: '#161616' });
    num.rotation.y = RY.N;
    put(door, num, 0.28, 1.5, -0.012);
    if (i === 0) {
      // Lund's is open, with something chalked inside the door
      door.rotation.y = 1.75;
      const chalk = decal(0.4, 0.5, 300, (g, W, HH) => {
        g.fillStyle = '#6f746e';
        g.fillRect(0, 0, W, HH);
        g.fillStyle = 'rgba(236,236,224,0.85)';
        for (let k = 0; k < 6; k++) g.fillRect(10, 20 + k * 20, W - 26 - ((k * 37) % 44), 3);
      });
      put(door, chalk, 0.28, 1.1, 0.012);
      hot(chalk, { id: 'note-lund', nodes: ['store'], cursor: 'look', action: ['doc', 'note-lund'] });
      // and what is hanging in it
      put(root, box(0.36, 1.2, 0.1, mat.rubber), x, F + 1.05, z + 0.05);
      put(root, cyl(0.1, 0.16, mat.rubber, 10), x, F + 1.72, z + 0.05);
    }
  });
  hot(put(root, proxy(1.8, 1.9, 0.1), 11.15, F + 0.95, S.z1 - 0.56), { id: 'divelockers', nodes: ['store'], cursor: 'look', action: ['look', 'divelockers'] });
  put(root, box(1.7, 0.42, 0.34, mat.wood, 1), 10.9, F + 0.21, S.z1 - 1.05); // changing bench
  // the property cage across the east end
  const CX = 12.2, G0 = -130.6, G1 = -129.4;
  const mesh = (parentGrp, za, zb) => {
    // you can see through it, so you can point through it
    const bar = (m) => ((m.userData.nopick = true), m);
    for (let z = za; z <= zb + 1e-6; z += 0.1) put(parentGrp, bar(box(0.012, 2.3, 0.012, mat.darkMetal)), 0, 1.15, z);
    for (const y of [0.04, 0.78, 1.52, 2.28]) put(parentGrp, bar(box(0.03, 0.04, zb - za + 0.03, mat.darkMetal)), 0, y, (za + zb) / 2);
  };
  const fixed = grp(root, CX, F, 0);
  mesh(fixed, S.z0 + 0.03, G0);
  mesh(fixed, G1, S.z1 - 0.03);
  put(fixed, box(0.04, 0.2, G1 - G0 + 0.1, mat.darkMetal), 0, 2.4, (G0 + G1) / 2);
  const gate = grp(root, CX - 0.03, F, 0);
  mesh(gate, G0 + 0.02, G1 - 0.02);
  const cageBar = put(root, box(0.04, 0.05, G1 - S.z0, mat.chrome), CX - 0.07, F + 1.12, (S.z0 + G1) / 2);
  put(root, plate(0.5, 0.09, 'PROPERTY'), CX - 0.02, F + 2.4, (G0 + G1) / 2).rotation.y = RY.W;
  // inside it: a shelf, four bags, a tray and a clipboard
  put(root, box(0.5, 0.04, 1.5, mat.wood, 1), S.x1 - 0.27, F + 0.92, -130);
  for (const z of [-130.7, -129.3]) put(root, box(0.46, 0.92, 0.04, mat.woodDark), S.x1 - 0.27, F + 0.46, z);
  NAMES.forEach((n, i) => {
    const z = -130.45 + i * 0.3;
    const bag = M(new THREE.SphereGeometry(0.13, 10, 8), mat.sack);
    bag.scale.set(1.15, 1.25, 1);
    put(root, bag, S.x1 - 0.24, F + 1.11, z);
    put(root, cyl(0.045, 0.07, mat.sack, 8, 0.02), S.x1 - 0.24, F + 1.29, z);
    put(root, cyl(0.024, 0.014, mat.woodDark, 8), S.x1 - 0.24, F + 1.262, z);
    const tag = plate(0.2, 0.07, n.toUpperCase(), { bg: '#e6dfc8', fg: '#151515', px: 900 });
    tag.rotation.y = RY.W;
    put(root, tag, S.x1 - 0.4, F + 1.07, z);
  });
  put(root, box(0.3, 0.78, 0.8, mat.woodDark, 1), 12.72, F + 0.39, -130);
  put(root, box(0.34, 0.03, 0.86, mat.felt), 12.72, F + 0.795, -130);
  for (let i = 0; i < 4; i++) {
    put(root, cyl(0.035, 0.012, mat.chrome, 12), 12.72, F + 0.82, -130.3 + i * 0.2);
    put(root, cyl(0.029, 0.014, mat.paper, 12), 12.72, F + 0.821, -130.3 + i * 0.2);
    put(root, box(0.02, 0.006, 0.17, mat.woodDark), 12.72, F + 0.814, -130.3 + i * 0.2).rotation.y = Math.PI / 2;
  }
  const clip = sheet(0.26, 0.36, 12, { head: 'CASUALTY RETURN' });
  clip.rotation.y = RY.W;
  put(root, clip, S.x1 - 0.026, F + 1.72, -130);
  put(root, box(0.02, 0.4, 0.3, mat.woodDark), S.x1 - 0.011, F + 1.72, -130);
  hot(put(root, proxy(0.4, 0.5, 1.3), S.x1 - 0.3, F + 1.14, -130), { id: 'effects', nodes: ['cage'], cursor: 'look', action: ['cage', 'effects'] });
  hot(put(root, proxy(0.36, 0.14, 0.9), 12.72, F + 0.86, -130), { id: 'watches', nodes: ['cage'], cursor: 'look', action: ['cage', 'watches'] });
  hot(put(root, proxy(0.1, 0.44, 0.34), S.x1 - 0.06, F + 1.72, -130), { id: 'casualty', nodes: ['cage'], cursor: 'look', action: ['cage', 'casualty'] });
  hot(put(root, proxy(0.1, 2.3, 1.4), CX - 0.16, F + 1.15, -130), { id: 'cagezoom', nodes: ['store'], cursor: 'zoom', action: ['go', 'cage'] });
  const cageLight = new THREE.PointLight(0xffe9c8, 3.5, 3.2, 1.5);
  cageLight.position.set(12.75, F + 2.1, -130);
  root.add(cageLight);

  // ================================================================ darkroom
  const D = DOCK.darkroom;
  const dark = room(D, mat.navy, false);
  const safeTube = lampMat(0x3a0f0c);
  put(root, box(0.3, 0.14, 0.2, safeTube), 12.3, F + H - 0.07, -142);
  const safeLight = new THREE.PointLight(0xff2a14, 0, 10, 1.4);
  safeLight.position.set(12.0, F + H - 0.4, -142);
  root.add(safeLight);
  // the wet bench on the north wall
  const WX = 10.9;
  put(root, box(2.5, 0.84, 0.62, mat.woodDark, 1), WX, F + 0.42, D.z0 + 0.33);
  put(root, box(2.54, 0.04, 0.66, mat.steel), WX, F + 0.86, D.z0 + 0.33);
  BATHS.forEach((b, i) => {
    const x = WX + (i - 1) * 0.62;
    put(root, box(0.48, 0.07, 0.38, mat.enamel), x, F + 0.915, D.z0 + 0.34);
    put(root, box(0.42, 0.02, 0.32, [mat.black, mat.glass, mat.black][i]), x, F + 0.945, D.z0 + 0.34);
    const lab = plate(0.3, 0.06, b.toUpperCase(), { bg: '#e6dfc8', fg: '#151515' });
    lab.rotation.x = -0.9;
    put(root, lab, x, F + 0.93, D.z0 + 0.6);
  });
  put(root, box(0.014, 0.3, 0.014, mat.white), WX - 0.78, F + 1.03, D.z0 + 0.22).rotation.z = 0.2; // thermometer in the developer
  hot(put(root, proxy(1.8, 0.14, 0.4), WX, F + 0.97, D.z0 + 0.34), { id: 'develop', nodes: ['bench'], cursor: 'hand', action: ['develop'] });
  // timers, thermometer and the light switch on the wall above
  const dp = grp(root, WX, F + 1.42, D.z0 + 0.005);
  put(dp, box(2.1, 0.46, 0.06, mat.panelGrey, 1), 0, 0, 0.03);
  const dw = [];
  BATHS.forEach((b, i) => {
    const cx = (i - 1) * 0.5;
    put(dp, plate(0.3, 0.055, b.toUpperCase()), cx, 0.16, 0.062);
    put(dp, plate(0.16, 0.04, 'MINUTES'), cx, -0.165, 0.062);
    for (const k of [0, 1]) {
      const x = cx + (k ? 0.045 : -0.045), y = -0.01;
      dw.push(wheelDecal(dp, x, y));
      hot(put(dp, proxy(0.082, 0.214, 0.06), x, y, 0.08), { id: `timer-${i * 2 + k}`, nodes: ['bench'], cursor: 'spin', action: ['timer', i * 2 + k], dir: sideOf(dp, x, y, 'y') });
    }
  });
  const thermo = decal(0.12, 0.4, 500, (g, W, HH) => {
    g.fillStyle = '#e9e4cf';
    g.fillRect(0, 0, W, HH);
    g.strokeStyle = '#222';
    g.strokeRect(1, 1, W - 2, HH - 2);
    const lo = 10, hi = 26, Y = (t) => HH * 0.9 - ((t - lo) / (hi - lo)) * HH * 0.8;
    g.fillStyle = '#c9c4b0';
    g.fillRect(W * 0.28, HH * 0.08, 5, HH * 0.84);
    g.fillStyle = '#b3261e';
    g.fillRect(W * 0.28, Y(TEMPERATURE), 5, HH * 0.92 - Y(TEMPERATURE));
    for (let t = lo; t <= hi; t += 2) {
      g.fillStyle = '#222';
      g.fillRect(W * 0.42, Y(t) - 1, t % 4 ? 5 : 9, 2);
      text(g, String(t), W * 0.76, Y(t) + 1, { size: 12, color: '#222' });
    }
  }, { rough: 0.5 });
  put(dp, thermo, -0.9, 0, 0.062);
  hot(thermo, { id: 'thermo', nodes: ['bench'], cursor: 'look', action: ['look', 'thermo'] });
  put(dp, box(0.1, 0.16, 0.02, mat.black), 0.9, -0.03, 0.062);
  const lightSwitch = grp(dp, 0.9, -0.03, 0.07);
  put(lightSwitch, box(0.035, 0.035, 0.1, mat.chrome), 0, 0, 0.04);
  put(dp, plate(0.24, 0.05, 'SAFELIGHT'), 0.9, 0.16, 0.062);
  put(dp, plate(0.1, 0.035, 'ON', { bg: '#7b7f78', fg: '#111' }), 0.9, 0.085, 0.062);
  hot(put(dp, proxy(0.2, 0.22, 0.16), 0.9, -0.03, 0.12), { id: 'safelight', nodes: ['bench'], cursor: 'hand', action: ['safelight'] });
  hot(put(root, proxy(2.4, 1.3, 0.7), WX, F + 1.15, D.z0 + 0.36), { id: 'benchzoom', nodes: ['darkroom'], cursor: 'zoom', action: ['go', 'bench'] });
  // the drying line, and the print once there is one
  put(root, box(2.4, 0.008, 0.008, mat.white), WX, F + 1.98, D.z0 + 0.2);
  const print = decal(0.3, 0.21, 620, (g, W, HH) => drawPhoto(g, W, HH), { rough: 0.6 });
  put(root, print, WX + 0.2, F + 1.86, D.z0 + 0.2);
  const peg = put(root, box(0.02, 0.05, 0.02, mat.wood), WX + 0.2, F + 1.975, D.z0 + 0.205);
  hot(print, { id: 'print', nodes: ['bench', 'darkroom'], cursor: 'look', action: ['doc', 'photo'] });
  // the chart and Voss's pencil on the east wall, a shelf of bottles, the enlarger
  const chart = decal(0.46, 0.56, 400, (g, W, HH) => {
    g.fillStyle = PAPER;
    g.fillRect(0, 0, W, HH);
    text(g, 'DEVELOPING TIMES', W / 2, 20, { size: 17, color: '#222' });
    g.strokeStyle = '#444';
    CHART.forEach(([t, m], i) => {
      const y = 52 + i * 32;
      g.strokeRect(22, y - 14, W - 44, 30);
      text(g, t + '°', W * 0.3, y + 2, { size: 20, color: '#222' });
      text(g, String(m), W * 0.7, y + 2, { size: 20, color: '#222' });
    });
  });
  chart.rotation.y = RY.W;
  put(root, chart, D.x1 - 0.012, F + 1.55, -142.5);
  hot(chart, { id: 'devchart', nodes: ['darkroom'], cursor: 'look', action: ['doc', 'devchart'] });
  const pencil = decal(0.5, 0.3, 300, (g, W, HH) => {
    g.fillStyle = '#25324a';
    g.fillRect(0, 0, W, HH);
    g.fillStyle = 'rgba(200,204,214,0.75)';
    for (let i = 0; i < 5; i++) g.fillRect(8, 14 + i * 15, W - 20 - ((i * 41) % 46), 2);
  });
  pencil.rotation.y = RY.W;
  put(root, pencil, D.x1 - 0.012, F + 1.5, -141.75);
  hot(pencil, { id: 'note-voss', nodes: ['darkroom'], cursor: 'look', action: ['doc', 'note-voss'] });
  put(root, box(1.6, 0.03, 0.2, mat.wood), 12.4, F + 1.6, D.z1 - 0.12);
  [mat.glass, mat.rust, mat.glass, mat.rust, mat.glass].forEach((m, i) => {
    put(root, cyl(0.055, 0.2, m, 10), 11.8 + i * 0.3, F + 1.715, D.z1 - 0.13);
    put(root, cyl(0.02, 0.06, m, 8), 11.8 + i * 0.3, F + 1.84, D.z1 - 0.13);
  });
  hot(put(root, proxy(1.6, 0.34, 0.1), 12.4, F + 1.76, D.z1 - 0.26), { id: 'bottles', nodes: ['darkroom'], cursor: 'look', action: ['look', 'bottles'] });
  put(root, box(0.8, 0.8, 0.6, mat.woodDark, 1), 9.6, F + 0.4, D.z1 - 0.34);
  put(root, box(0.56, 0.9, 0.5, mat.white), 9.6, F + 1.25, D.z1 - 0.34); // the enlarger under its sheet
  hot(put(root, proxy(0.8, 1.7, 0.1), 9.6, F + 0.85, D.z1 - 0.68), { id: 'enlarger', nodes: ['darkroom'], cursor: 'look', action: ['look', 'enlarger'] });

  // ---------------------------------------------------------------- things that change
  /** A drum showing one of the tally numbers, with its neighbours above and below. */
  const tallyFace = (n) => (g, W, HH) => {
    const i = TALLIES.indexOf(n), k = TALLIES.length, f = '"Courier New", monospace';
    g.fillStyle = '#c7a54a';
    g.fillRect(0, 0, W, HH);
    text(g, String(TALLIES[(i + 1) % k]), W / 2, HH * 0.14, { size: HH * 0.17, color: '#5a4514', font: f });
    text(g, String(n), W / 2, HH * 0.51, { size: HH * 0.3, color: '#1c1404', font: f });
    text(g, String(TALLIES[(i + k - 1) % k]), W / 2, HH * 0.88, { size: HH * 0.17, color: '#5a4514', font: f });
    const grad = g.createLinearGradient(0, 0, 0, HH);
    grad.addColorStop(0, 'rgba(0,0,0,0.7)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.7)');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, HH);
  };
  const drawWire = (mode) => (g, W, HH) => {
    g.fillStyle = '#e9e3cf';
    g.fillRect(0, 0, W, HH);
    if (mode === 'blank') return;
    g.fillStyle = '#23211c';
    g.fillRect(14, 14, W * 0.5, 9);
    g.fillRect(14, 30, W - 28, 2);
    for (let i = 0; i < 10; i++) g.fillRect(14, 46 + i * 13, W - 28 - ((i * 37) % 50), 2);
    if (mode === 'signed') {
      g.strokeStyle = '#1c2a5a';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(20, HH - 26);
      g.bezierCurveTo(40, HH - 50, 52, HH - 6, 72, HH - 30);
      g.bezierCurveTo(84, HH - 44, 96, HH - 14, 118, HH - 28);
      g.stroke();
    }
    g.fillStyle = '#23211c';
    g.fillRect(14, HH - 16, W * 0.55, 1.5);
  };

  let lastWire = null;
  return {
    sync(state) {
      const t = state.telegraph, ty = state.tally, dr = state.darkroom;
      t.wheels.forEach((n, i) => tw[i].userData.redraw(wheelFace(n)));
      setLamp(wireLamp, 0x35ff55, state.junction.live, 2.4);
      const wire = !t.drawn ? 'blank' : state.flags.secondSheet ? 'unsigned' : 'signed';
      if (wire !== lastWire) wirePaper.userData.redraw(drawWire((lastWire = wire)));
      for (const n of NAMES) drums[n].userData.redraw(tallyFace(ty.set[n]));
      barLever.rotation.x = ty.open ? -0.6 : 0.6;
      gate.position.z = ty.open ? -1.16 : 0;
      cageBar.visible = !ty.open;
      dr.wheels.forEach((n, i) => dw[i].userData.redraw(wheelFace(n)));
      lightSwitch.rotation.x = dr.safe ? -0.5 : 0.5;
      dark.light.intensity = dr.safe ? 0 : 9;
      setLamp(dark.tube, 0xfff0d0, !dr.safe, 2.2);
      safeLight.intensity = dr.safe ? 7 : 0;
      setLamp(safeTube, 0xff2a14, dr.safe, 3);
      print.visible = peg.visible = dr.printed;
      print.userData.hot.disabled = !dr.printed;
    },
  };
}
