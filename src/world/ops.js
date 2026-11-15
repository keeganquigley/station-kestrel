// Operations room: receiver, teleprinter, monitor, the stopped clock and the intercept log.
import * as THREE from 'three';
import { FLOOR as F, ROOMS, RY } from './layout.js';
import { mat, lampMat, setLamp } from './materials.js';
import { M, box, cyl, put, grp, decal, text, plate, gauge, meterFace, meterAngle, hot, proxy, sideOf, chair, rng } from './kit.js';
import { powered } from '../puzzles/generator.js';
import { STOPPED_CLOCK, signal, reception, formatKhz } from '../puzzles/receiver.js';
import { CIPHER, SHEET, sheetLabel } from '../puzzles/cipher.js';

export const RX_PANEL = { x: 0, y: F + 1.03, z: -23.29 };

export function buildOps(scene) {
  const root = grp(scene);
  const r = ROOMS.ops;
  const R = rng(77);
  const top = F + 0.8;

  // bench along the north wall
  put(root, box(4.2, 0.06, 1.0, mat.deskWood, 1.2), 0, top - 0.03, r.z0 + 0.5);
  put(root, box(4.2, 0.7, 0.05, mat.console, 1), 0, F + 0.4, r.z0 + 0.95);
  for (const x of [-2.05, 2.05]) put(root, box(0.06, 0.76, 0.95, mat.console, 1), x, F + 0.38, r.z0 + 0.5);

  // --- receiver
  put(root, box(1.3, 0.5, 0.52, mat.console, 1), RX_PANEL.x, top + 0.25, r.z0 + 0.45);
  const rx = grp(root, RX_PANEL.x, RX_PANEL.y, RX_PANEL.z, RY.S);
  put(rx, box(1.26, 0.46, 0.012, mat.darkMetal), 0, 0, -0.004);
  const display = decal(0.5, 0.14, 420, () => {}, { glow: 1.6 });
  put(rx, display, -0.27, 0.11, 0.004);
  put(rx, plate(0.2, 0.04, 'FREQUENCY  MHz'), -0.27, 0.205, 0.004);
  const meter = gauge(0.26, 0.19, 600, meterFace('SIGNAL', [0, 1, 3, 5, 7, 9], { redFrom: 0.85 }), mat.red);
  put(rx, meter, 0.2, 0.1, 0.004);
  const pwr = lampMat(0x2a1a10);
  put(rx, cyl(0.018, 0.02, pwr, 10), 0.52, 0.16, 0.01).rotation.x = Math.PI / 2;
  put(rx, plate(0.1, 0.035, 'MAINS'), 0.52, 0.11, 0.004);
  const knobs = [];
  [
    ['MHz', 1000],
    ['100 kHz', 100],
    ['10 kHz', 10],
  ].forEach(([label, step], i) => {
    const x = -0.46 + i * 0.2,
      y = -0.065;
    const k = grp(rx, x, y, 0.004);
    put(k, cyl(0.058, 0.045, mat.black, 18), 0, 0, 0.022).rotation.x = Math.PI / 2;
    put(k, box(0.008, 0.045, 0.004, mat.white), 0, 0.03, 0.047);
    put(rx, plate(0.15, 0.04, label), x, -0.155, 0.004);
    knobs.push(k);
    hot(put(rx, proxy(0.17, 0.17, 0.1), x, y, 0.04), { id: 'knob-' + step, nodes: ['console'], cursor: 'turn', action: ['tune', step], dir: sideOf(rx, x, y) });
  });
  const grille = decal(0.34, 0.2, 400, (g, W, H) => {
    g.fillStyle = '#1b1d1d';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#3b4040';
    for (let y = 8; y < H - 4; y += 8) g.fillRect(8, y, W - 16, 3);
  });
  put(rx, grille, 0.36, -0.1, 0.004);

  hot(put(root, proxy(2.1, 0.9, 0.7), 0.5, top + 0.45, r.z0 + 0.5), { id: 'console', nodes: ['ops'], cursor: 'zoom', action: ['go', 'console'] });

  // --- monitor
  put(root, box(0.62, 0.52, 0.56, mat.steel, 1), -1.35, top + 0.26, r.z0 + 0.45);
  const screen = decal(0.46, 0.36, 180, () => {}, { glow: 1.3 });
  put(root, screen, -1.35, top + 0.28, r.z0 + 0.735);
  put(root, box(0.52, 0.42, 0.02, mat.black), -1.35, top + 0.28, r.z0 + 0.722);
  hot(screen, { id: 'monitor', nodes: ['ops', 'console'], cursor: 'look', action: ['look', 'monitor'] });

  // --- teleprinter
  const tp = grp(root, 1.02, top, r.z0 + 0.48);
  put(tp, box(0.72, 0.2, 0.56, mat.steel, 1), 0, 0.1, 0);
  put(tp, box(0.72, 0.16, 0.26, mat.steel, 1), 0, 0.28, -0.15);
  const keys = put(tp, box(0.6, 0.03, 0.22, mat.black), 0, 0.22, 0.14);
  keys.rotation.x = 0.25;
  put(tp, cyl(0.035, 0.6, mat.rubber, 10), 0, 0.37, -0.12).rotation.z = Math.PI / 2;
  const paper = decal(0.42, 0.5, 620, () => {}, { rough: 0.95 });
  paper.rotation.x = -0.3;
  put(tp, paper, 0, 0.6, -0.2);
  hot(paper, { id: 'printout', nodes: ['console'], cursor: 'hand', action: ['print'] });

  // --- log book, headphones, mug
  const log = grp(root, -0.44, top, r.z0 + 0.9, 0.1);
  put(log, box(0.5, 0.03, 0.34, mat.green), 0, 0.015, 0);
  const pages = decal(0.46, 0.3, 400, (g, W, H) => {
    g.fillStyle = '#e4dcc2';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#b9b199';
    g.fillRect(W / 2 - 1, 0, 2, H);
    g.fillStyle = '#28324e';
    for (let c = 0; c < 2; c++) for (let i = 0; i < 9; i++) g.fillRect(10 + c * (W / 2), 12 + i * 12, W / 2 - 22 - R() * 30, 2);
  });
  pages.rotation.x = -Math.PI / 2;
  put(log, pages, 0, 0.032, 0);
  hot(put(log, proxy(0.52, 0.1, 0.36), 0, 0.04, 0), { id: 'logbook', nodes: ['ops', 'console'], cursor: 'look', action: ['doc', 'logbook'] });
  const phones = grp(root, 0.36, top, r.z0 + 0.86, 0.5);
  const band = M(new THREE.TorusGeometry(0.085, 0.01, 6, 16, Math.PI), mat.black);
  put(phones, band, 0, 0.05, 0);
  put(phones, cyl(0.045, 0.035, mat.black, 12), -0.085, 0.04, 0).rotation.z = Math.PI / 2;
  put(phones, cyl(0.045, 0.035, mat.black, 12), 0.085, 0.04, 0).rotation.z = Math.PI / 2;
  put(root, cyl(0.04, 0.09, mat.white, 12), -1.85, top + 0.045, r.z0 + 0.8);

  // --- the clock
  const clock = grp(root, 0, F + 2.12, r.z0 + 0.07, RY.S);
  put(clock, box(1.0, 0.42, 0.12, mat.black), 0, 0, 0);
  const face = decal(
    0.9,
    0.32,
    300,
    (g, W, H) => {
      g.fillStyle = '#0c0c0c';
      g.fillRect(0, 0, W, H);
      const digits = STOPPED_CLOCK.replace(':', '');
      const cw = W * 0.19,
        gap = W * 0.02;
      [0, 1, 2, 3].forEach((i) => {
        const x = W * 0.07 + i * (cw + gap) + (i > 1 ? W * 0.06 : 0);
        g.fillStyle = '#232323';
        g.fillRect(x, H * 0.1, cw, H * 0.8);
        text(g, digits[i], x + cw / 2, H * 0.53, { size: H * 0.72, color: '#e9e4cf' });
        g.fillStyle = '#0c0c0c';
        g.fillRect(x, H * 0.5 - 1, cw, 2);
      });
      g.fillStyle = '#e9e4cf';
      g.fillRect(W * 0.5 - 2, H * 0.36, 5, 5);
      g.fillRect(W * 0.5 - 2, H * 0.62, 5, 5);
    },
    { rough: 0.6 },
  );
  put(clock, face, 0, 0, 0.062);
  hot(face, { id: 'clock', nodes: ['ops', 'console'], cursor: 'look', action: ['look', 'clock'] });

  // --- the rest of the room
  const seat = chair(mat.navy, mat.darkMetal);
  seat.rotation.y = 2.5;
  put(root, seat, 1.9, F, -21.9);
  const bill = decal(1.3, 0.85, 220, (g, W, H) => {
    g.fillStyle = '#e8e6dc';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#555';
    g.lineWidth = 6;
    g.strokeRect(3, 3, W - 6, H - 6);
    text(g, 'WATCH BILL', W / 2, 28, { size: 26, color: '#1d2a5a' });
    g.strokeStyle = '#1d2a5a';
    g.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(16, 52 + i * 28);
      g.lineTo(W - 16, 52 + i * 28);
      g.stroke();
    }
    ['HARLAN', 'VOSS', 'LUND', 'RUSH'].forEach((n, i) => text(g, n, 26, 67 + i * 28, { size: 18, color: '#1d2a5a', align: 'left' }));
    g.strokeStyle = '#a3261c';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(120, 60);
    g.lineTo(W - 24, 150);
    g.stroke();
  });
  bill.rotation.y = RY.N;
  put(root, bill, -2.7, F + 1.55, r.z1 - 0.01);
  hot(bill, { id: 'watchbill', nodes: ['ops'], cursor: 'look', action: ['look', 'watchbill'] });
  for (const x of [2.3, 2.85, 3.4]) {
    const cab = put(root, box(0.5, 1.32, 0.6, mat.steel, 1), x, F + 0.66, r.z1 - 0.32);
    for (let i = 0; i < 4; i++) put(cab, box(0.3, 0.02, 0.02, mat.chrome), 0, -0.5 + i * 0.32, -0.31);
  }
  const arrow = plate(1.0, 0.22, 'SIGNALS VAULT  >', { bg: '#8c1f17', fg: '#f0e8c8', px: 400 });
  arrow.rotation.y = RY.W;
  put(root, arrow, r.x1 - 0.01, F + 1.7, -18.5);
  const co = plate(1.1, 0.22, '<  COMMANDING OFFICER', { bg: '#1b1b1b', fg: '#e8e4d4', px: 400 });
  co.rotation.y = RY.E;
  put(root, co, r.x0 + 0.01, F + 1.7, -18.5);
  put(root, cyl(0.07, 0.5, mat.red, 10), r.x1 - 0.15, F + 0.6, -21.6);

  // --- things that change
  const drawDisplay = (on, khz) => (g, W, H) => {
    g.fillStyle = '#0a0d0a';
    g.fillRect(0, 0, W, H);
    if (!on) return;
    text(g, '8.888', W / 2, H / 2 + 2, { size: H * 0.82, color: 'rgba(70,255,120,0.08)', font: '"Courier New", monospace' });
    text(g, formatKhz(khz).padStart(6, ' '), W / 2, H / 2 + 2, { size: H * 0.82, color: '#52ff86', font: '"Courier New", monospace' });
  };
  const drawPaper = (mode) => (g, W, H) => {
    g.fillStyle = '#e9e3cf';
    g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,0.05)';
    for (let y = 0; y < H; y += 14) g.fillRect(0, y, W, 1);
    const opts = { size: 27, color: '#262a3c', font: '"Courier New", monospace' };
    if (mode === 'locked') {
      const lines = ['= K7 = K7 = K7 =', `SHEET ${sheetLabel(SHEET)}   GR 03`, CIPHER.join(' '), CIPHER.join(' '), '= ENDS ='];
      lines.forEach((l, i) => text(g, l, W / 2, 34 + i * 40, opts));
    } else if (mode === 'faint') {
      const rr = rng(5);
      const garble = (s) =>
        s
          .split('')
          .map((ch) => (ch === ' ' ? ' ' : rr() < 0.6 ? '.?:,'[Math.floor(rr() * 4)] : ch))
          .join('');
      ['= K7 = K7 = K7 =', `SHEET ${sheetLabel(SHEET)}   GR 03`, CIPHER.join(' ')].forEach((l, i) => text(g, garble(l), W / 2, 34 + i * 40, { ...opts, color: 'rgba(38,42,60,0.55)' }));
    }
  };
  let staticSeed = 1;
  const drawStatic = (on, lock) => (g, W, H) => {
    if (!on) {
      g.fillStyle = '#060807';
      g.fillRect(0, 0, W, H);
      return;
    }
    const img = g.getImageData(0, 0, W, H),
      d = img.data;
    let s = (staticSeed = (staticSeed * 1664525 + 1013904223) >>> 0);
    for (let i = 0; i < d.length; i += 4) {
      s = (s * 1664525 + 1013904223) >>> 0;
      let v = (s >>> 24) * 0.7;
      if (lock) {
        const p = i / 4,
          x = p % W,
          y = (p / W) | 0;
        const cxs = x - W / 2,
          cys = y - H * 0.45;
        if (cxs * cxs * 3 + cys * cys < 260 || (Math.abs(cxs) < 16 && cys > 10 && cys < 30)) v *= 0.35;
      }
      d[i] = v * 0.8;
      d[i + 1] = v;
      d[i + 2] = v * 0.85;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  };

  let last = {};
  return {
    sync(state) {
      const on = powered(state.gen, 'ops');
      const rec = on ? reception(state.rx) : 'none';
      display.userData.redraw(drawDisplay(on, state.rx.khz));
      meter.userData.set(meterAngle(on ? signal(state.rx) : 0));
      setLamp(pwr, 0xff8a2a, on, 2.5);
      knobs[0].rotation.z = -(state.rx.khz / 1000) * 0.6;
      knobs[1].rotation.z = -((state.rx.khz / 100) % 10) * 0.6;
      knobs[2].rotation.z = -((state.rx.khz / 10) % 10) * 0.6;
      const mode = state.rx.printed ? 'locked' : rec === 'faint' ? 'faint' : 'blank';
      if (mode !== last.mode) paper.userData.redraw(drawPaper(mode));
      last = { mode, on, lock: on && rec === 'locked' };
      screen.userData.redraw(drawStatic(last.on, last.lock));
    },
    /** Called a few times a second while the room is on screen. */
    tick() {
      if (!last.on) return false;
      screen.userData.redraw(drawStatic(true, last.lock));
      return true;
    },
  };
}
