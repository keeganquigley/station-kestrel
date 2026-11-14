// Every surface on the island is painted here, on canvases, at start-up.
import * as THREE from 'three';
import { makeCanvas, rng } from './kit.js';

const R = rng(1996);

function tex(size, draw) {
  const c = makeCanvas(size, size);
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function speckle(g, s, n, maxSize, strength) {
  for (let i = 0; i < n; i++) {
    const v = R() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${R() * strength})`;
    const z = 1 + R() * maxSize;
    g.fillRect(R() * s, R() * s, z, z);
  }
}

function blotches(g, s, n, color, maxR, alpha) {
  for (let i = 0; i < n; i++) {
    const x = R() * s,
      y = R() * s,
      r = 4 + R() * maxR;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color.replace('A', String(alpha * (0.4 + R() * 0.6))));
    grad.addColorStop(1, color.replace('A', '0'));
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function streaks(g, s, n, color, alpha) {
  for (let i = 0; i < n; i++) {
    const x = R() * s,
      y = R() * s * 0.6,
      w = 2 + R() * 10,
      h = s * (0.2 + R() * 0.5);
    const grad = g.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, color.replace('A', String(alpha * R())));
    grad.addColorStop(1, color.replace('A', '0'));
    g.fillStyle = grad;
    g.fillRect(x, y, w, h);
  }
}

const std = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...opts });

export const mat = {};

export function buildMaterials() {
  const concrete = tex(256, (g, s) => {
    g.fillStyle = '#8f8d86';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 5000, 2, 0.1);
    blotches(g, s, 30, 'rgba(60,58,52,A)', 40, 0.25);
    streaks(g, s, 14, 'rgba(40,36,30,A)', 0.35);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(0, s / 2, s, 2);
    g.fillRect(0, 0, s, 2);
  });
  const corrugated = tex(256, (g, s) => {
    for (let x = 0; x < s; x += 16) {
      const grad = g.createLinearGradient(x, 0, x + 16, 0);
      grad.addColorStop(0, '#59645f');
      grad.addColorStop(0.45, '#8c9a94');
      grad.addColorStop(1, '#4d5753');
      g.fillStyle = grad;
      g.fillRect(x, 0, 16, s);
    }
    speckle(g, s, 2500, 2, 0.08);
    blotches(g, s, 26, 'rgba(120,62,28,A)', 26, 0.55);
    streaks(g, s, 10, 'rgba(96,48,22,A)', 0.5);
  });
  const rust = tex(128, (g, s) => {
    g.fillStyle = '#5c4233';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 2500, 3, 0.16);
    blotches(g, s, 30, 'rgba(128,80,44,A)', 20, 0.5);
    blotches(g, s, 20, 'rgba(40,24,16,A)', 20, 0.6);
  });
  const wood = tex(256, (g, s) => {
    g.fillStyle = '#6b5843';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = `rgba(${R() < 0.5 ? 30 : 190},${R() < 0.5 ? 22 : 160},${R() < 0.5 ? 14 : 120},${R() * 0.12})`;
      g.fillRect(R() * s, R() * s, 20 + R() * 90, 1 + R() * 2);
    }
    g.fillStyle = 'rgba(20,14,8,0.55)';
    for (let y = 0; y < s; y += 32) g.fillRect(0, y, s, 2);
    speckle(g, s, 1200, 2, 0.08);
  });
  const lino = tex(256, (g, s) => {
    g.fillStyle = '#59635a';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#4f5951';
    g.fillRect(0, 0, s / 2, s / 2);
    g.fillRect(s / 2, s / 2, s / 2, s / 2);
    speckle(g, s, 5000, 2, 0.09);
    blotches(g, s, 16, 'rgba(30,30,26,A)', 40, 0.25);
  });
  const paint = tex(256, (g, s) => {
    g.fillStyle = '#b5b19b';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 3000, 2, 0.05);
    blotches(g, s, 14, 'rgba(90,84,60,A)', 50, 0.16);
    streaks(g, s, 8, 'rgba(70,64,44,A)', 0.16);
  });
  const ceiling = tex(128, (g, s) => {
    g.fillStyle = '#a3a299';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 1800, 2, 0.1);
    g.fillStyle = 'rgba(40,40,36,0.5)';
    g.fillRect(0, 0, s, 2);
    g.fillRect(0, 0, 2, s);
  });
  const hammer = (base) =>
    tex(128, (g, s) => {
      g.fillStyle = base;
      g.fillRect(0, 0, s, s);
      speckle(g, s, 3000, 2, 0.07);
    });
  const brushed = tex(256, (g, s) => {
    g.fillStyle = '#737a7d';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const v = R() < 0.5 ? 0 : 255;
      g.fillStyle = `rgba(${v},${v},${v},${R() * 0.07})`;
      g.fillRect(R() * s, R() * s, 30 + R() * 120, 1);
    }
    blotches(g, s, 10, 'rgba(30,30,34,A)', 50, 0.25);
  });
  const ground = tex(256, (g, s) => {
    g.fillStyle = '#d2d2d2';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 9000, 3, 0.2);
    blotches(g, s, 40, 'rgba(60,60,60,A)', 30, 0.3);
    blotches(g, s, 40, 'rgba(240,240,240,A)', 24, 0.25);
  });
  ground.repeat.set(70, 70);
  const water = tex(256, (g, s) => {
    g.fillStyle = '#c4ced2';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 700; i++) {
      const v = R() < 0.5 ? 60 : 255;
      g.fillStyle = `rgba(${v},${v},${v},${R() * 0.16})`;
      g.fillRect(R() * s, R() * s, 14 + R() * 60, 1 + R() * 2);
    }
  });
  water.repeat.set(140, 220);

  Object.assign(mat, {
    concrete: std({ map: concrete }),
    concreteDark: std({ map: concrete, color: 0x6f6f6f }),
    corrugated: std({ map: corrugated, roughness: 0.7, metalness: 0.15 }),
    rust: std({ map: rust }),
    wood: std({ map: wood }),
    woodDark: std({ map: wood, color: 0x8a7460 }),
    deskWood: std({ map: wood, color: 0xb08a66, roughness: 0.6 }),
    lino: std({ map: lino, roughness: 0.65 }),
    paint: std({ map: paint }),
    ceiling: std({ map: ceiling }),
    steel: std({ map: hammer('#7d8580'), roughness: 0.6, metalness: 0.2 }),
    console: std({ map: hammer('#55695d'), roughness: 0.6, metalness: 0.15 }),
    genGreen: std({ map: hammer('#3d5743'), roughness: 0.65, metalness: 0.15 }),
    panelGrey: std({ map: hammer('#8b8f88'), roughness: 0.6, metalness: 0.15 }),
    vaultSteel: std({ map: brushed, roughness: 0.45, metalness: 0.35 }),
    darkMetal: std({ color: 0x2b2e2f, roughness: 0.55, metalness: 0.3 }),
    black: std({ color: 0x121212, roughness: 0.6 }),
    chrome: std({ color: 0xb9bcbc, roughness: 0.3, metalness: 0.6 }),
    brass: std({ color: 0xb8923a, roughness: 0.4, metalness: 0.45 }),
    red: std({ color: 0xa3261c, roughness: 0.6 }),
    green: std({ color: 0x2f7d3a, roughness: 0.5 }),
    orange: std({ color: 0xc8611f, roughness: 0.85 }),
    navy: std({ color: 0x25324a, roughness: 0.9 }),
    white: std({ color: 0xd9d6cc, roughness: 0.7 }),
    paper: std({ color: 0xe6dfc8, roughness: 0.95 }),
    glass: std({ color: 0x0a0f13, roughness: 0.08, metalness: 0.2 }),
    rubber: std({ color: 0x1c1c1c, roughness: 0.95 }),
    rock: std({ color: 0x6b6862, roughness: 1, flatShading: true }),
    crag: std({ color: 0x4a4947, roughness: 1, flatShading: true }),
    ground: std({ map: ground, vertexColors: true, roughness: 1 }),
    water: std({ map: water, color: 0x3b6470, roughness: 0.42, metalness: 0.1 }),
    blueDrum: std({ color: 0x2c4a63, roughness: 0.6, metalness: 0.2 }),
  });

  // --- the Subterranean Station
  const tile = tex(128, (g, s) => {
    g.fillStyle = '#c9cbc2';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 900, 2, 0.05);
    g.fillStyle = 'rgba(70,74,70,0.7)';
    for (let i = 0; i < s; i += 32) {
      g.fillRect(i, 0, 2, s);
      g.fillRect(0, i, s, 2);
    }
    blotches(g, s, 8, 'rgba(90,80,50,A)', 30, 0.2);
  });
  const ticking = tex(64, (g, s) => {
    g.fillStyle = '#c8c2ae';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#56607a';
    for (let x = 4; x < s; x += 16) g.fillRect(x, 0, 3, s);
  });
  const wool = tex(64, (g, s) => {
    g.fillStyle = '#5d665c';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 1500, 2, 0.12);
  });
  const dampWall = tex(256, (g, s) => {
    g.fillStyle = '#7f8684';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 5000, 2, 0.1);
    blotches(g, s, 26, 'rgba(40,48,46,A)', 46, 0.32);
    streaks(g, s, 22, 'rgba(24,30,28,A)', 0.5);
    streaks(g, s, 6, 'rgba(120,80,40,A)', 0.3);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.fillRect(0, s / 2, s, 2);
    g.fillRect(0, 0, s, 2);
    g.fillRect(0, 0, 2, s);
  });
  Object.assign(mat, {
    damp: std({ map: dampWall }),
    dampFloor: std({ map: dampWall, color: 0x767a78, roughness: 0.75 }),
    wetFloor: std({ map: dampWall, color: 0x3c4443, roughness: 0.3 }),
    tile: std({ map: tile, roughness: 0.4 }),
    enamel: std({ color: 0xdcd9cc, roughness: 0.3 }),
    ticking: std({ map: ticking }),
    wool: std({ map: wool, roughness: 1 }),
    felt: std({ color: 0x2f5a3c, roughness: 1 }),
    cream: std({ map: paint, color: 0xe8dfc4 }),
    blue: std({ color: 0x2a56a8, roughness: 0.6 }),
    yellow: std({ color: 0xd1b12a, roughness: 0.6 }),
    copper: std({ color: 0xb06a3a, roughness: 0.4, metalness: 0.5 }),
    rockDark: std({ color: 0x34383a, roughness: 1, flatShading: true }),
    deepWater: new THREE.MeshStandardMaterial({ color: 0x0b1719, roughness: 0.06, metalness: 0.5, transparent: true, opacity: 0.94 }),
  });

  // --- Berth K7
  const hull = tex(256, (g, s) => {
    g.fillStyle = '#4b352b';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 6000, 3, 0.16);
    blotches(g, s, 60, 'rgba(150,84,40,A)', 26, 0.55);
    blotches(g, s, 40, 'rgba(28,18,14,A)', 30, 0.6);
    blotches(g, s, 26, 'rgba(60,84,62,A)', 22, 0.4);
    streaks(g, s, 30, 'rgba(22,14,10,A)', 0.55);
    streaks(g, s, 14, 'rgba(170,110,60,A)', 0.4);
    g.fillStyle = 'rgba(0,0,0,0.3)'; // plate seams
    for (let y = 0; y < s; y += 64) g.fillRect(0, y, s, 2);
    for (let x = 0; x < s; x += 128) g.fillRect(x, 0, 2, s);
  });
  hull.repeat.set(3, 2);
  const stone = tex(256, (g, s) => {
    g.fillStyle = '#5c625f';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 6000, 2, 0.12);
    blotches(g, s, 30, 'rgba(20,26,24,A)', 44, 0.4);
    blotches(g, s, 12, 'rgba(120,124,120,A)', 30, 0.2);
    g.fillStyle = 'rgba(0,0,0,0.35)'; // laid in courses
    for (let y = 0; y < s; y += 64) g.fillRect(0, y, s, 3);
    for (let y = 0, k = 0; y < s; y += 64, k++) for (let x = (k % 2) * 64; x < s; x += 128) g.fillRect(x, y, 3, 64);
  });
  const canvas = tex(64, (g, s) => {
    g.fillStyle = '#8a8266';
    g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(40,36,24,0.25)';
    for (let i = 0; i < s; i += 4) {
      g.fillRect(i, 0, 1, s);
      g.fillRect(0, i, s, 1);
    }
    speckle(g, s, 500, 2, 0.1);
  });
  Object.assign(mat, {
    hull: std({ map: hull, roughness: 0.85, metalness: 0.1 }),
    hullDark: std({ map: hull, color: 0x6a6a6a, roughness: 0.9 }),
    weed: std({ color: 0x1a2a1f, roughness: 1 }),
    quay: std({ map: stone, roughness: 0.7 }),
    quayWall: std({ map: stone, color: 0x9a9a9a, roughness: 0.85 }),
    cavern: std({ color: 0x2a2f31, roughness: 1, flatShading: true }),
    gate: std({ map: corrugated, color: 0x777777, roughness: 0.8, metalness: 0.2 }),
    canvas: std({ map: canvas, roughness: 1 }),
    sack: std({ color: 0x8a8266, roughness: 1 }),
    penWater: new THREE.MeshStandardMaterial({ color: 0x07110f, roughness: 0.05, metalness: 0.55, transparent: true, opacity: 0.96 }),
  });
  return mat;
}

/** A lamp or lens that can be switched between dark and lit. */
export function lampMat(offHex) {
  return new THREE.MeshStandardMaterial({ color: offHex, roughness: 0.35, emissive: 0x000000 });
}

export function setLamp(m, onHex, on, strength = 2.2) {
  m.emissive.setHex(on ? onHex : 0x000000);
  m.emissiveIntensity = on ? strength : 0;
}
