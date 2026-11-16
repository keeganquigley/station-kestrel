// What four people put on the walls after five years with nobody to tell them not to.
// None of it is a clue. It is all in the plant shed and the station on top of the island.
import * as THREE from 'three';
import { FLOOR, SHED_FLOOR, SHED, ROOMS, RY } from './layout.js';
import { mat } from './materials.js';
import { M, box, cyl, put, grp, decal, text, plate, hot, proxy } from './kit.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '"Arial Narrow", Arial, sans-serif';

/** Text shrunk to fit a width. */
function fit(g, str, x, y, maxW, opts) {
  let size = opts.size;
  g.font = `${opts.weight || 'bold'} ${size}px ${opts.font || SANS}`;
  const w = g.measureText(str).width;
  if (w > maxW) size *= maxW / w;
  text(g, str, x, y, { ...opts, size });
}

/** The office-wall kind: a picture in a black border, one big word, one small line. */
const motivational = (word, line, picture) => (g, W, H) => {
  g.fillStyle = '#0d0d0d';
  g.fillRect(0, 0, W, H);
  const m = W * 0.08,
    ph = H * 0.6;
  g.save();
  g.beginPath();
  g.rect(m, m, W - 2 * m, ph);
  g.clip();
  g.translate(m, m);
  picture(g, W - 2 * m, ph);
  g.restore();
  g.strokeStyle = '#d8d2bc';
  g.lineWidth = 1.5;
  g.strokeRect(m - 3, m - 3, W - 2 * m + 6, ph + 6);
  fit(g, word.split('').join(' '), W / 2, m + ph + H * 0.12, W * 0.86, { size: H * 0.1, color: '#e8e2cc', font: SERIF, weight: 'normal' });
  fit(g, line, W / 2, m + ph + H * 0.22, W * 0.86, { size: H * 0.038, color: '#b9b29a', font: SERIF, weight: 'italic' });
};

const sky = (g, w, h, top, bottom) => {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
};
const person = (g, x, y, h, colour) => {
  g.fillStyle = colour;
  g.fillRect(x - h * 0.13, y - h * 0.72, h * 0.26, h * 0.72);
  g.beginPath();
  g.arc(x, y - h * 0.84, h * 0.13, 0, 7);
  g.fill();
};

// ---------------------------------------------------------------- the pictures

const teamwork = motivational('TEAMWORK', 'Because none of us can lift the generator alone.', (g, w, h) => {
  sky(g, w, h, '#f0b56a', '#f6e3b0');
  g.fillStyle = '#3d3a30'; // the slope
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(0, h * 0.82);
  g.lineTo(w, h * 0.5);
  g.lineTo(w, h);
  g.fill();
  g.save();
  g.translate(w * 0.66, h * 0.6);
  g.rotate(-0.3);
  g.fillStyle = '#3d5743';
  g.fillRect(-w * 0.16, -h * 0.3, w * 0.32, h * 0.3);
  g.fillStyle = '#a3261c';
  g.fillRect(-w * 0.12, -h * 0.36, w * 0.24, h * 0.07);
  g.restore();
  [0.12, 0.22, 0.32, 0.42].forEach((x, i) => person(g, w * x, h * (0.82 - x * 0.3), h * 0.3, i % 2 ? '#25324a' : '#c8611f'));
});

const perseverance = motivational('PERSEVERANCE', 'The supply boat always comes. Eventually.', (g, w, h) => {
  sky(g, w, h, '#5d6b78', '#b9c2c4');
  g.fillStyle = '#34424c'; // sea
  g.fillRect(0, h * 0.62, w, h * 0.38);
  g.fillStyle = 'rgba(230,236,236,0.5)';
  for (let i = 0; i < 14; i++) g.fillRect((i * 53) % w, h * (0.66 + ((i * 7) % 30) / 100), 14 + ((i * 11) % 18), 1.5);
  g.fillStyle = '#1d2124'; // the island
  g.beginPath();
  g.moveTo(w * 0.2, h * 0.64);
  g.quadraticCurveTo(w * 0.42, h * 0.3, w * 0.62, h * 0.52);
  g.lineTo(w * 0.72, h * 0.64);
  g.fill();
  g.fillRect(w * 0.44, h * 0.38, w * 0.07, h * 0.05);
  g.fillRect(w * 0.3, h * 0.22, 1.5, h * 0.24);
  g.fillStyle = '#e9e4cf'; // a boat, a long way off
  g.fillRect(w * 0.86, h * 0.615, w * 0.05, 2);
  g.fillRect(w * 0.88, h * 0.595, 2, 5);
});

const patience = motivational('PATIENCE', 'Good things come to those who wait. So does everything else.', (g, w, h) => {
  sky(g, w, h, '#2a2c33', '#4a3f38');
  g.fillStyle = '#16161a'; // the range
  g.fillRect(0, h * 0.74, w, h * 0.26);
  g.strokeStyle = '#c84a1c';
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(w / 2, h * 0.76, w * 0.2, h * 0.03, 0, 0, 7);
  g.stroke();
  g.fillStyle = '#b9bcbc'; // the kettle
  g.beginPath();
  g.moveTo(w * 0.34, h * 0.74);
  g.quadraticCurveTo(w * 0.32, h * 0.4, w * 0.5, h * 0.4);
  g.quadraticCurveTo(w * 0.68, h * 0.4, w * 0.66, h * 0.74);
  g.fill();
  g.beginPath();
  g.moveTo(w * 0.66, h * 0.58);
  g.lineTo(w * 0.8, h * 0.46);
  g.lineTo(w * 0.79, h * 0.52);
  g.lineTo(w * 0.67, h * 0.66);
  g.fill();
  g.strokeStyle = '#1b1b1b';
  g.lineWidth = 4;
  g.beginPath();
  g.arc(w * 0.5, h * 0.4, w * 0.11, Math.PI, 0);
  g.stroke();
});

function football(g, W, H) {
  g.fillStyle = '#1f3d2a';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#e8e2cc';
  g.lineWidth = 3;
  g.strokeRect(6, 6, W - 12, H - 12);
  fit(g, 'HOLLAND ISLAND', W / 2, H * 0.1, W * 0.84, { size: H * 0.085, color: '#e8e2cc' });
  fit(g, 'ATHLETIC F.C.', W / 2, H * 0.19, W * 0.84, { size: H * 0.085, color: '#e8e2cc' });
  // the team photograph: all four of them
  const px = W * 0.1,
    py = H * 0.27,
    pw = W * 0.8,
    ph = H * 0.46;
  g.save();
  g.beginPath();
  g.rect(px, py, pw, ph);
  g.clip();
  g.translate(px, py);
  sky(g, pw, ph, '#9fb0b8', '#d5d2c0');
  g.fillStyle = '#4f6a3c';
  g.fillRect(0, ph * 0.7, pw, ph * 0.3);
  [0.2, 0.4, 0.6, 0.8].forEach((x, i) => {
    const cx = pw * x,
      top = ph * 0.3;
    for (let s = 0; s < 4; s++) {
      g.fillStyle = s % 2 ? '#25324a' : '#c8611f'; // hoops, in parka colours
      g.fillRect(cx - pw * 0.065, top + (s * ph * 0.3) / 4, pw * 0.13, (ph * 0.3) / 4 + 0.5);
    }
    g.fillStyle = '#e8e2cc';
    g.fillRect(cx - pw * 0.06, top + ph * 0.3, pw * 0.12, ph * 0.1);
    g.fillStyle = '#d9b99a';
    g.fillRect(cx - pw * 0.05, top + ph * 0.4, pw * 0.035, ph * 0.14);
    g.fillRect(cx + pw * 0.015, top + ph * 0.4, pw * 0.035, ph * 0.14);
    g.beginPath();
    g.arc(cx, top - ph * 0.07 + (i % 2) * 2, pw * 0.045, 0, 7);
    g.fill();
  });
  g.fillStyle = '#f2efe4';
  g.beginPath();
  g.arc(pw / 2, ph * 0.9, pw * 0.04, 0, 7);
  g.fill();
  g.restore();
  g.strokeRect(px, py, pw, ph);
  fit(g, 'UNBEATEN AT HOME', W / 2, H * 0.83, W * 0.8, { size: H * 0.07, color: '#d9c23c' });
  fit(g, 'Fixtures: to be arranged', W / 2, H * 0.91, W * 0.8, { size: H * 0.04, color: '#e8e2cc', weight: 'normal' });
}

function filmLongWave(g, W, H) {
  sky(g, W, H, '#14301f', '#5d7a22');
  // the mast, and what is coming off it
  g.strokeStyle = 'rgba(232,240,150,0.75)';
  g.lineWidth = 2.5;
  for (let r = 1; r <= 6; r++) {
    g.beginPath();
    g.arc(W * 0.5, H * 0.42, r * W * 0.1, -Math.PI * 0.95, -Math.PI * 0.05);
    g.stroke();
  }
  g.fillStyle = '#0c120c';
  g.beginPath();
  g.moveTo(W * 0.5, H * 0.4);
  g.lineTo(W * 0.42, H * 0.86);
  g.lineTo(W * 0.58, H * 0.86);
  g.fill();
  g.fillRect(0, H * 0.84, W, H * 0.16);
  for (const [x, lean] of [
    [0.16, 0.25],
    [0.27, 0.2],
    [0.76, -0.2],
    [0.86, -0.3],
  ]) {
    g.save(); // people, running
    g.translate(W * x, H * 0.86);
    g.rotate(lean);
    person(g, 0, 0, H * 0.09, '#0c120c');
    g.restore();
  }
  g.save();
  g.translate(W / 2, H * 0.15);
  g.rotate(-0.07);
  fit(g, 'THEY CAME FROM', 0, 0, W * 0.86, { size: H * 0.085, color: '#f0e24a' });
  fit(g, 'LONG WAVE', 0, H * 0.1, W * 0.9, { size: H * 0.14, color: '#e23a1c' });
  g.restore();
  fit(g, 'They only wanted to be heard.', W / 2, H * 0.93, W * 0.86, { size: H * 0.045, color: '#e8e2cc', font: SERIF, weight: 'italic' });
}

function filmColdFront(g, W, H) {
  sky(g, W, H, '#0e2440', '#7fa4c4');
  g.fillStyle = 'rgba(240,246,250,0.8)';
  for (let i = 0; i < 70; i++) g.fillRect((i * 97) % W, (i * 61) % H, 2, 2);
  g.fillStyle = '#e9eef0'; // drift
  g.beginPath();
  g.moveTo(0, H);
  g.lineTo(0, H * 0.8);
  g.quadraticCurveTo(W * 0.5, H * 0.7, W, H * 0.82);
  g.lineTo(W, H);
  g.fill();
  // a weatherman in a parka, with a flare gun
  g.fillStyle = '#c8611f';
  g.beginPath();
  g.moveTo(W * 0.36, H * 0.8);
  g.lineTo(W * 0.4, H * 0.46);
  g.lineTo(W * 0.6, H * 0.46);
  g.lineTo(W * 0.64, H * 0.8);
  g.fill();
  g.beginPath();
  g.arc(W * 0.5, H * 0.4, W * 0.1, 0, 7);
  g.fill();
  g.fillStyle = '#d9b99a';
  g.beginPath();
  g.arc(W * 0.5, H * 0.41, W * 0.055, 0, 7);
  g.fill();
  g.strokeStyle = '#c8611f';
  g.lineWidth = W * 0.055;
  g.beginPath();
  g.moveTo(W * 0.6, H * 0.5);
  g.lineTo(W * 0.8, H * 0.36);
  g.stroke();
  g.fillStyle = '#1b1b1b';
  g.fillRect(W * 0.78, H * 0.3, W * 0.1, H * 0.035);
  const flare = g.createRadialGradient(W * 0.9, H * 0.3, 0, W * 0.9, H * 0.3, W * 0.22);
  flare.addColorStop(0, 'rgba(255,240,200,1)');
  flare.addColorStop(0.2, 'rgba(255,90,50,0.8)');
  flare.addColorStop(1, 'rgba(255,90,50,0)');
  g.fillStyle = flare;
  g.fillRect(W * 0.6, H * 0.08, W * 0.4, H * 0.44);
  fit(g, 'COLD FRONT II', W / 2, H * 0.12, W * 0.9, { size: H * 0.13, color: '#f4f6f8' });
  fit(g, 'COLDER FRONT', W / 2, H * 0.22, W * 0.7, { size: H * 0.07, color: '#ffd24a' });
  fit(g, 'This time, it is slightly worse.', W / 2, H * 0.93, W * 0.86, { size: H * 0.045, color: '#1d2a3a', font: SERIF, weight: 'italic' });
}

function centrefold(g, W, H) {
  sky(g, W, H, '#e8a6b4', '#f4d9c4');
  g.fillStyle = '#a3261c';
  g.fillRect(0, 0, W, H * 0.13);
  fit(g, 'DIESEL MONTHLY', W / 2, H * 0.07, W * 0.9, { size: H * 0.08, color: '#f8f0dc' });
  // her
  g.fillStyle = '#3d5743';
  g.fillRect(W * 0.2, H * 0.4, W * 0.6, H * 0.3);
  g.fillStyle = '#2b2e2f';
  g.fillRect(W * 0.14, H * 0.7, W * 0.72, H * 0.05);
  for (let i = 0; i < 6; i++) {
    g.fillStyle = '#4c6a53';
    g.fillRect(W * (0.23 + i * 0.094), H * 0.31, W * 0.07, H * 0.1);
    g.fillStyle = '#b8923a';
    g.fillRect(W * (0.25 + i * 0.094), H * 0.28, W * 0.03, H * 0.03);
  }
  g.fillStyle = '#b9bcbc';
  g.beginPath();
  g.arc(W * 0.8, H * 0.55, W * 0.11, 0, 7);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)'; // glamour lighting
  g.fillRect(W * 0.22, H * 0.42, W * 0.5, H * 0.03);
  g.strokeStyle = '#1c2a8a'; // and a biro heart
  g.lineWidth = 2.5;
  g.beginPath();
  const hx = W * 0.36,
    hy = H * 0.56,
    s = W * 0.09;
  g.moveTo(hx, hy + s);
  g.bezierCurveTo(hx - s * 1.6, hy - s * 0.2, hx - s * 0.5, hy - s * 1.2, hx, hy - s * 0.3);
  g.bezierCurveTo(hx + s * 0.5, hy - s * 1.2, hx + s * 1.6, hy - s * 0.2, hx, hy + s);
  g.stroke();
  fit(g, 'Six cylinders and nothing to prove', W / 2, H * 0.86, W * 0.86, { size: H * 0.05, color: '#5a1a22', font: SERIF, weight: 'italic' });
}

function certificate(g, W, H) {
  g.fillStyle = '#efe7cc';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#8a6a2a';
  g.lineWidth = 5;
  g.strokeRect(8, 8, W - 16, H - 16);
  g.lineWidth = 1.5;
  g.strokeRect(15, 15, W - 30, H - 30);
  fit(g, 'BEST-KEPT OUTSTATION', W / 2, H * 0.24, W * 0.76, { size: H * 0.1, color: '#2a2418', font: SERIF });
  fit(g, 'Northern Area', W / 2, H * 0.38, W * 0.5, { size: H * 0.07, color: '#2a2418', font: SERIF, weight: 'italic' });
  fit(g, 'HIGHLY COMMENDED', W / 2, H * 0.58, W * 0.7, { size: H * 0.13, color: '#8c1f17', font: SERIF });
  g.fillStyle = '#2a2418';
  g.fillRect(W * 0.2, H * 0.78, W * 0.36, 1.5);
  g.fillStyle = '#a3261c'; // the seal
  g.beginPath();
  g.arc(W * 0.78, H * 0.76, H * 0.1, 0, 7);
  g.fill();
}

function sampler(g, W, H) {
  g.fillStyle = '#e6dcc0';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(120,100,60,0.18)'; // the weave
  for (let i = 0; i < W; i += 4) g.fillRect(i, 0, 1, H);
  for (let i = 0; i < H; i += 4) g.fillRect(0, i, W, 1);
  const cross = (x, y, c) => {
    g.strokeStyle = c;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 4, y - 4);
    g.lineTo(x + 4, y + 4);
    g.moveTo(x + 4, y - 4);
    g.lineTo(x - 4, y + 4);
    g.stroke();
  };
  for (let x = 14; x < W - 8; x += 12) {
    cross(x, 14, x % 24 < 12 ? '#a3261c' : '#2f7d3a');
    cross(x, H - 14, x % 24 < 12 ? '#2f7d3a' : '#a3261c');
  }
  for (let y = 26; y < H - 20; y += 12) {
    cross(14, y, '#25324a');
    cross(W - 14, y, '#25324a');
  }
  ['THE FLOGGINGS', 'WILL CONTINUE', 'UNTIL MORALE', 'IMPROVES'].forEach((l, i) =>
    fit(g, l, W / 2, H * (0.3 + i * 0.14), W * 0.7, { size: H * 0.1, color: i === 3 ? '#a3261c' : '#25324a', font: '"Courier New", monospace' }),
  );
}

// ---------------------------------------------------------------- hanging it all up

export function buildDecor(parent) {
  const root = grp(parent);

  /** A flat picture on a wall, with a backing so it stands a hair proud of it. face: which way it looks. */
  const hang = (id, node, w, h, px, draw, x, y, z, face, { frame = mat.black, look = id } = {}) => {
    const g = grp(root, x, y, z, RY[face]);
    put(g, box(w + 0.03, h + 0.03, 0.012, frame), 0, 0, 0.006);
    const d = decal(w, h, px, draw);
    put(g, d, 0, 0, 0.014);
    hot(d, { id, nodes: [node], cursor: 'look', action: ['look', look] });
    return g;
  };

  // ================================================================ the plant shed
  const SF = SHED_FLOOR;
  // (nothing on the east wall: the generator stands in front of it)
  hang('teamwork', 'shed', 0.5, 0.72, 440, teamwork, 17.1, SF + 1.55, SHED.z0 + 0.045, 'S');
  hang('centrefold', 'shed', 0.4, 0.54, 520, centrefold, 17.77, SF + 1.62, SHED.z1 - 0.045, 'N', { frame: mat.paper });
  // the swear box, on the bench
  const tin = grp(root, 18.48, SF + 0.93, SHED.z1 - 0.5);
  put(tin, cyl(0.055, 0.13, mat.rust, 14), 0, 0.065, 0);
  put(tin, cyl(0.058, 0.012, mat.brass, 14), 0, 0.136, 0);
  put(tin, box(0.05, 0.004, 0.008, mat.black), 0, 0.143, 0);
  const tinLabel = plate(0.09, 0.05, '', { lines: ['SWEAR', 'BOX'], bg: '#e6dfc8', fg: '#151515', px: 1200 });
  tinLabel.rotation.y = RY.N;
  put(tin, tinLabel, 0, 0.07, -0.057);
  hot(put(tin, proxy(0.2, 0.24, 0.2), 0, 0.09, 0), { id: 'swearbox', nodes: ['shed'], cursor: 'look', action: ['look', 'swearbox'] });
  // two roof ties, and what somebody put on one of them
  for (const z of [4.9, 7.1]) put(root, box(SHED.x1 - SHED.x0, 0.12, 0.1, mat.woodDark, 1), (SHED.x0 + SHED.x1) / 2, SF + 2.2, z);
  const gnome = grp(root, 18.2, SF + 2.26, 7.1, RY.N);
  put(gnome, cyl(0.055, 0.12, mat.blue, 12, 0.045), 0, 0.06, 0); // coat
  put(gnome, M(new THREE.SphereGeometry(0.042, 12, 10), mat.paper), 0, 0.15, 0); // face
  put(gnome, cyl(0.04, 0.07, mat.white, 10, 0.004), 0, 0.105, 0.03).rotation.x = Math.PI; // beard
  put(gnome, cyl(0.046, 0.13, mat.red, 12, 0.002), 0, 0.245, 0); // hat
  const band = M(new THREE.TorusGeometry(0.05, 0.006, 6, 14, Math.PI), mat.black);
  put(gnome, band, 0, 0.16, 0);
  for (const s of [-1, 1]) put(gnome, cyl(0.02, 0.016, mat.black, 10), s * 0.05, 0.155, 0).rotation.z = Math.PI / 2;
  const tag = plate(0.07, 0.03, 'RELIEF', { bg: '#e6dfc8', fg: '#151515', px: 1400 });
  put(gnome, tag, 0, 0.045, 0.056);
  hot(put(gnome, proxy(0.16, 0.34, 0.14), 0, 0.16, 0), { id: 'gnome', nodes: ['shed'], cursor: 'look', action: ['gnome'] });

  // ================================================================ vestibule
  const F = FLOOR,
    north = ROOMS.vest.z0 + 0.1; // the vestibule side of the wall it shares with the ops room
  hang('perseverance', 'vestibule', 0.5, 0.72, 440, perseverance, -1.16, F + 1.55, north, 'S');
  hang('football', 'vestibule', 0.5, 0.72, 440, football, 1.16, F + 1.55, north, 'S', { frame: mat.paper });
  const sb = grp(root, ROOMS.vest.x0 + 0.01, F + 1.25, -11.3, RY.E); // by the notice board
  put(sb, box(0.26, 0.3, 0.12, mat.wood, 0.6), 0, 0, 0.06);
  put(sb, box(0.16, 0.012, 0.004, mat.black), 0, 0.09, 0.122);
  put(sb, plate(0.22, 0.05, 'SUGGESTIONS', { bg: '#e6dfc8', fg: '#151515' }), 0, -0.03, 0.122);
  hot(put(sb, proxy(0.3, 0.34, 0.16), 0, 0, 0.08), { id: 'suggestions', nodes: ['vestibule'], cursor: 'look', action: ['look', 'suggestions'] });

  // ================================================================ ops room
  const south = ROOMS.ops.z1;
  hang('film-longwave', 'ops', 0.9, 1.27, 280, filmLongWave, -1.43, F + 1.5, south, 'N', { look: 'filmLongWave' });
  hang('film-coldfront', 'ops', 0.9, 1.27, 280, filmColdFront, 1.43, F + 1.5, south, 'N', { look: 'filmColdFront' });
  hang('patience', 'ops', 0.56, 0.8, 380, patience, 2.85, F + 2.0, south, 'N');

  // ================================================================ the C.O.'s office
  const o = ROOMS.office;
  hang('certificate', 'office', 0.46, 0.34, 520, certificate, -5.35, F + 1.62, o.z0, 'S', { frame: mat.brass });
  hang('sampler', 'office', 0.44, 0.44, 420, sampler, -5.35, F + 1.6, o.z1, 'N', { frame: mat.woodDark });

  return { sync() {} };
}
