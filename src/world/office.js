// The commanding officer's room: desk, locked drawer, the D/F chart.
import * as THREE from 'three';
import { FLOOR as F, ROOMS, RY } from './layout.js';
import { mat, lampMat, setLamp } from './materials.js';
import { box, cyl, put, grp, decal, text, hot, proxy, chair, rng } from './kit.js';
import { busLive } from '../puzzles/generator.js';
import { drawChart } from '../data/chart.js';

export function buildOffice(scene) {
  const root = grp(scene);
  const r = ROOMS.office;

  // --- desk against the west wall; you see it from the sitter's side
  const desk = grp(root, r.x0 + 0.45, F, -20);
  put(desk, box(0.86, 0.05, 1.9, mat.deskWood, 1.2), 0, 0.735, 0);
  put(desk, box(0.04, 0.7, 1.9, mat.deskWood, 1.2), -0.4, 0.36, 0);
  const drawers = {};
  for (const side of [-1, 1]) {
    put(desk, box(0.8, 0.7, 0.5, mat.deskWood, 1.2), 0, 0.36, side * 0.68);
    for (let i = 0; i < 3; i++) {
      const d = grp(desk, 0.405, 0.6 - i * 0.215, side * 0.68);
      put(d, box(0.02, 0.19, 0.44, mat.woodDark, 0.8), 0, 0, 0);
      put(d, box(0.02, 0.02, 0.14, mat.brass), 0.015, 0.02, 0);
      drawers[`${side}:${i}`] = d;
    }
  }
  // the top right-hand drawer has a lock (right, as you face the desk, is north)
  const locked = drawers['-1:0'];
  put(locked, cyl(0.016, 0.012, mat.brass, 10), 0.014, -0.045, 0.14).rotation.z = Math.PI / 2;
  const tray = put(locked, box(0.36, 0.03, 0.4, mat.woodDark, 0.8), -0.19, -0.08, 0);
  const pad = put(locked, box(0.2, 0.025, 0.14, mat.red), -0.16, -0.05, 0);
  put(pad, decal(0.15, 0.06, 500, (g, W, H) => {
    g.fillStyle = '#e4dcc2';
    g.fillRect(0, 0, W, H);
    text(g, 'SERIES K', W / 2, H / 2, { size: 20, color: '#222' });
  }), 0, 0.014, 0).rotation.x = -Math.PI / 2;
  const drawerHit = put(desk, proxy(0.5, 0.26, 0.5), 0.55, 0.6, -0.68);
  hot(drawerHit, { id: 'drawer', nodes: ['office'], cursor: 'hand', action: ['drawer'] });

  // desk top
  const memo = decal(0.21, 0.29, 500, (g, W, H) => {
    g.fillStyle = '#e6dfc8';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#1c2a4a';
    for (let i = 0; i < 11; i++) g.fillRect(10, 16 + i * 11, W - 20 - ((i * 23) % 26), 2);
  });
  memo.rotation.set(-Math.PI / 2, 0, 0.25);
  put(desk, memo, 0.12, 0.765, 0.3);
  hot(put(desk, proxy(0.3, 0.06, 0.36), 0.12, 0.78, 0.3), { id: 'memo-vault', nodes: ['office'], cursor: 'look', action: ['doc', 'memo-vault'] });
  // lamp
  const shade = lampMat(0x35513a);
  put(desk, cyl(0.07, 0.02, mat.brass, 12), -0.2, 0.77, 0.75);
  put(desk, cyl(0.012, 0.34, mat.brass, 6), -0.2, 0.94, 0.75);
  put(desk, cyl(0.13, 0.11, shade, 12, 0.07), -0.2, 1.14, 0.75);
  const deskLight = new THREE.PointLight(0xffd9a0, 0, 4, 1.6);
  deskLight.position.set(r.x0 + 0.3, F + 1.05, -19.25);
  root.add(deskLight);
  // typewriter
  const tw = grp(desk, -0.08, 0.76, -0.2);
  put(tw, box(0.3, 0.09, 0.36, mat.darkMetal), 0, 0.045, 0);
  put(tw, box(0.12, 0.08, 0.4, mat.darkMetal), -0.12, 0.12, 0);
  put(tw, cyl(0.025, 0.42, mat.rubber, 8), -0.12, 0.18, 0).rotation.x = Math.PI / 2;
  // photograph
  const photo = decal(0.2, 0.15, 500, (g, W, H) => {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#b9c0c4');
    sky.addColorStop(0.55, '#dcd6c4');
    sky.addColorStop(0.56, '#6d7a80');
    sky.addColorStop(1, '#49555a');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#5a4a38';
    g.fillRect(0, H * 0.7, W, H * 0.08);
    g.fillStyle = '#1e1c1a';
    [0.28, 0.42, 0.56, 0.7].forEach((x, i) => {
      const hh = H * (0.34 + (i % 2) * 0.04);
      g.fillRect(W * x - 5, H * 0.72 - hh, 10, hh);
      g.beginPath();
      g.arc(W * x, H * 0.72 - hh - 5, 5, 0, 7);
      g.fill();
    });
    g.fillStyle = 'rgba(230,224,200,0.9)';
    g.fillRect(W * 0.62, H * 0.86, W * 0.3, 6);
  }, { rough: 0.4 });
  const frame = grp(desk, -0.25, 0.76, -0.62, RY.E);
  frame.rotation.y = RY.E - 0.35;
  put(frame, box(0.24, 0.19, 0.015, mat.black), 0, 0.1, 0).rotation.x = -0.18;
  put(frame, photo, 0, 0.1, 0.012).rotation.x = -0.18;
  hot(put(frame, proxy(0.26, 0.22, 0.06), 0, 0.1, 0.02), { id: 'photo', nodes: ['office'], cursor: 'look', action: ['look', 'photo'] });
  const seat = chair(mat.navy, mat.darkMetal);
  seat.rotation.y = -0.9;
  put(root, seat, r.x0 + 1.7, F, -18.4);
  // a slit window above the desk, already dark
  const win = decal(1.3, 0.4, 100, (g, W, H) => {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#2b3350');
    grad.addColorStop(1, '#b0623a');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
  }, { glow: 0.9 });
  win.rotation.y = RY.E;
  put(root, win, r.x0 + 0.01, F + 2.2, -20);
  for (const dy of [-0.23, 0.23]) put(root, box(0.06, 0.06, 1.42, mat.darkMetal), r.x0 + 0.03, F + 2.2 + dy, -20);

  // --- the chart on the north wall
  const chart = decal(2.0, 1.4, 300, (g, W, H) => drawChart(g, W, H), { rough: 0.9 });
  put(root, chart, -7.6, F + 1.55, r.z0 + 0.03);
  put(root, box(2.1, 1.5, 0.03, mat.woodDark), -7.6, F + 1.55, r.z0 + 0.012);
  hot(chart, { id: 'chart', nodes: ['office'], cursor: 'look', action: ['doc', 'chart'] });
  const tri = decal(0.24, 0.3, 500, (g, W, H) => {
    g.fillStyle = '#e9e1c4';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#1c2a4a';
    for (let i = 0; i < 7; i++) g.fillRect(10, 20 + i * 15, W - 20 - ((i * 31) % 30), 2);
    g.fillStyle = '#a3261c';
    g.beginPath();
    g.arc(W / 2, 8, 5, 0, 7);
    g.fill();
  });
  tri.rotation.z = -0.06;
  put(root, tri, -6.2, F + 1.3, r.z0 + 0.03);
  hot(tri, { id: 'memo-tri', nodes: ['office'], cursor: 'look', action: ['doc', 'memo-tri'] });

  // --- shelves on the south wall
  const sh = grp(root, -7.6, F, r.z1 - 0.2, RY.N);
  put(sh, box(2.6, 1.9, 0.04, mat.woodDark, 1), 0, 0.95, -0.17);
  for (const x of [-1.3, 1.3]) put(sh, box(0.04, 1.9, 0.36, mat.woodDark), x, 0.95, 0);
  const R = rng(31);
  const spines = [mat.navy, mat.red, mat.green, mat.black, mat.paper, mat.orange];
  for (let s = 0; s < 4; s++) {
    const y = 0.1 + s * 0.48;
    put(sh, box(2.6, 0.04, 0.36, mat.woodDark), 0, y, 0);
    let x = -1.22;
    while (x < 1.1) {
      const w = 0.05 + R() * 0.05, hh = 0.26 + R() * 0.1;
      if (R() < 0.85) {
        const b = put(sh, box(w, hh, 0.24, spines[Math.floor(R() * spines.length)]), x + w / 2, y + 0.02 + hh / 2, 0.02);
        if (R() < 0.12) b.rotation.z = 0.2;
      }
      x += w + 0.004 + (R() < 0.1 ? 0.2 : 0);
    }
  }
  put(sh, box(2.6, 0.04, 0.36, mat.woodDark), 0, 1.9, 0);
  hot(put(sh, proxy(2.6, 1.9, 0.4), 0, 0.95, 0.02), { id: 'binders', nodes: ['office'], cursor: 'look', action: ['look', 'binders'] });

  return {
    sync(state) {
      const open = !!state.flags.drawerOpen;
      locked.position.x = 0.405 + (open ? 0.34 : 0);
      tray.visible = pad.visible = open;
      drawerHit.position.x = open ? 0.7 : 0.55;
      const live = busLive(state.gen);
      setLamp(shade, 0x4dd070, live, 1.2);
      deskLight.intensity = live ? 2.2 : 0;
    },
  };
}
