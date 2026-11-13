// The station building: concrete shell, rooms, lighting, and the vestibule.
import * as THREE from 'three';
import { FLOOR as F, STN, ROOMS, CEIL, RY } from './layout.js';
import { mat, lampMat, setLamp } from './materials.js';
import { M, box, cyl, put, grp, wall, decal, text, plate, hot, proxy, rng, cuts } from './kit.js';
import { busLive } from '../puzzles/generator.js';

const DOOR_H = 2.25;

export function buildStation(scene) {
  const root = grp(scene);
  const { x0, x1, z0, z1, h } = STN;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const fixtures = [];
  const lights = [];

  // --- shell
  put(root, box(x1 - x0 + 0.8, 0.5, z1 - z0 + 0.8, mat.concreteDark, 2), cx, F - 0.25, cz);
  const t = 0.3;
  wall(root, mat.concrete, x0, z1 - t / 2, x1, z1 - t / 2, F, h, t, [{ a: -0.75, b: 0.75, y0: 0, y1: DOOR_H }]);
  wall(root, mat.concrete, x0, z0 + t / 2, x1, z0 + t / 2, F, h, t);
  wall(root, mat.concrete, x0 + t / 2, z0, x0 + t / 2, z1, F, h, t);
  wall(root, mat.concrete, x1 - t / 2, z0, x1 - t / 2, z1, F, h, t);
  put(root, box(x1 - x0 + 1, 0.3, z1 - z0 + 1, mat.concreteDark, 2), cx, F + h + 0.15, cz);
  put(root, box(x1 - x0 + 1.1, 0.12, z1 - z0 + 1.1, mat.darkMetal), cx, F + h + 0.36, cz);
  // slit windows
  for (const x of [-8.2, -5, 4.6, 8, 11.4, 14]) {
    put(root, box(1.3, 0.42, 0.06, mat.glass), x, F + 2.35, z1 + 0.02);
    put(root, box(1.42, 0.07, 0.12, mat.darkMetal), x, F + 2.1, z1 + 0.03);
  }
  // door surround, lamp, name
  for (const x of [-0.82, 0.82]) put(root, box(0.14, DOOR_H + 0.1, 0.4, mat.darkMetal), x, F + DOOR_H / 2, z1 - 0.15);
  put(root, box(3.6, 0.1, 0.1, mat.darkMetal), 0.95, F + DOOR_H + 0.12, z1 + 0.07);
  const leaf = put(root, box(1.56, DOOR_H, 0.08, mat.vaultSteel, 1.2), 0, F + DOOR_H / 2, z1 + 0.06);
  put(leaf, box(0.06, 0.5, 0.06, mat.darkMetal), -0.55, 0, 0.07);
  put(leaf, decal(0.9, 0.2, 300, (g, W, H) => {
    g.fillStyle = '#6f7477';
    g.fillRect(0, 0, W, H);
    text(g, 'AUTHORISED PERSONS', W / 2, H / 2, { size: 22, color: '#d9c23c' });
  }), 0, 0.55, 0.045);
  hot(leaf, { id: 'door', nodes: ['door'], cursor: 'hand', action: ['door'] });
  const doorLamp = lampMat(0x301010);
  put(root, box(0.16, 0.16, 0.1, doorLamp), -1.3, F + 1.9, z1 + 0.05);
  put(root, box(0.26, 0.26, 0.04, mat.darkMetal), -1.3, F + 1.9, z1 + 0.02);
  const name = decal(2.6, 0.5, 200, (g, W, H) => {
    g.fillStyle = '#8f8d86';
    g.fillRect(0, 0, W, H);
    const r = rng(3);
    text(g, 'K E S T R E L', W / 2, H / 2 + 2, { size: 70, color: '#22262a' });
    for (let i = 0; i < 700; i++) {
      g.fillStyle = `rgba(143,141,134,${r() * 0.8})`;
      g.fillRect(r() * W, r() * H, 1 + r() * 6, 1 + r() * 4);
    }
  });
  put(root, name, 0, F + 2.85, z1 + 0.006);
  // roof clutter
  const roofY = F + h + 0.42;
  put(root, M(new THREE.SphereGeometry(1.6, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), mat.white), 10.5, roofY + 0.5, -21);
  put(root, cyl(1.0, 0.5, mat.concrete, 16), 10.5, roofY + 0.2, -21);
  put(root, box(1.4, 0.7, 1.0, mat.steel), -6, roofY + 0.35, -15);
  put(root, box(0.9, 0.5, 0.9, mat.steel), 3, roofY + 0.25, -24);
  for (const [x, z, hh] of [[-9, -12, 5], [-3.5, -13, 3.6], [14, -12.5, 4.4]]) put(root, cyl(0.025, hh, mat.darkMetal, 5, 0.008), x, roofY + hh / 2, z);

  // --- rooms
  const room = (r, walls, opts = {}) => {
    const w = r.x1 - r.x0, d = r.z1 - r.z0, mx = (r.x0 + r.x1) / 2, mz = (r.z0 + r.z1) / 2;
    const wm = opts.wall || mat.paint;
    const fl = M(new THREE.PlaneGeometry(w, d, cuts(w), cuts(d)), opts.floor || mat.lino, false, true);
    fl.geometry.attributes.uv.array.forEach((v, i, a) => (a[i] = v * (i % 2 ? d : w) / 2));
    fl.rotation.x = -Math.PI / 2;
    put(root, fl, mx, F + 0.005, mz);
    put(root, box(w + 0.3, 0.1, d + 0.3, opts.ceil || mat.ceiling, 1.2), mx, F + CEIL + 0.05, mz);
    const k = 0.1;
    if (walls.N) wall(root, wm, r.x0, r.z0 - k / 2, r.x1, r.z0 - k / 2, F, CEIL, k, walls.N.open || []);
    if (walls.S) wall(root, wm, r.x0, r.z1 + k / 2, r.x1, r.z1 + k / 2, F, CEIL, k, walls.S.open || []);
    if (walls.W) wall(root, wm, r.x0 - k / 2, r.z0, r.x0 - k / 2, r.z1, F, CEIL, k, walls.W.open || []);
    if (walls.E) wall(root, wm, r.x1 + k / 2, r.z0, r.x1 + k / 2, r.z1, F, CEIL, k, walls.E.open || []);
  };
  const fixture = (x, z, intensity, len = 1.2, alongX = true, color = 0xdfe8ff) => {
    const m = lampMat(0x8a8d86);
    put(root, box(alongX ? len : 0.22, 0.06, alongX ? 0.22 : len, m), x, F + CEIL - 0.03, z);
    const l = new THREE.PointLight(color, 0, 14, 1.5);
    l.position.set(x, F + CEIL - 0.35, z);
    root.add(l);
    fixtures.push(m);
    lights.push([l, intensity]);
  };
  const doorway = (a, b) => [{ a, b, y0: 0, y1: 2.1 }];

  room(ROOMS.vest, { W: {}, E: {} });
  room(ROOMS.ops, { N: {}, S: { open: doorway(-0.7, 0.7) }, W: { open: doorway(-20.7, -19.3) }, E: { open: doorway(-20.7, -19.3) } });
  room({ ...ROOMS.office, x1: ROOMS.office.x1 - 0.1 }, { N: {}, S: {}, W: {} });
  room({ ...ROOMS.corr, x0: ROOMS.corr.x0 + 0.1 }, { N: {}, S: {} }, { wall: mat.concrete, floor: mat.concreteDark });
  fixture(0, -12.4, 7, 0.9);
  fixture(0, -17.2, 10, 1.6);
  fixture(0, -21.4, 10, 1.6);
  fixture(-7.5, -20, 14, 1.4, false);
  fixture(7.3, -20, 6, 1.0);
  // door frames
  for (const [x, z, alongX] of [[0, -14.55, true], [-4.55, -20, false], [4.55, -20, false]]) {
    for (const s of [-0.74, 0.74]) put(root, box(alongX ? 0.08 : 0.22, 2.14, alongX ? 0.22 : 0.08, mat.darkMetal), x + (alongX ? s : 0), F + 1.07, z + (alongX ? 0 : s));
    put(root, box(alongX ? 1.56 : 0.22, 0.08, alongX ? 0.22 : 1.56, mat.darkMetal), x, F + 2.14, z);
  }

  // --- vestibule
  const v = ROOMS.vest;
  const board = decal(1.3, 0.9, 260, (g, W, H) => {
    g.fillStyle = '#6d5237';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#8a6a48';
    g.fillRect(8, 8, W - 16, H - 16);
    const sheet = (x, y, w, h2, tilt, lines) => {
      g.save();
      g.translate(x, y);
      g.rotate(tilt);
      g.fillStyle = '#e4dcc2';
      g.fillRect(0, 0, w, h2);
      g.fillStyle = '#333';
      for (let i = 0; i < lines; i++) g.fillRect(8, 14 + i * 9, w - 16 - ((i * 29) % 30), 2);
      g.fillStyle = '#a3261c';
      g.fillRect(w / 2 - 3, 3, 6, 6);
      g.restore();
    };
    sheet(24, 22, 130, 170, -0.03, 15);
    sheet(175, 30, 140, 110, 0.04, 9);
    sheet(190, 150, 110, 70, -0.05, 5);
  });
  board.rotation.y = RY.E;
  put(root, board, v.x0 + 0.01, F + 1.55, -12.4);
  hot(board, { id: 'noticeboard', nodes: ['vestibule'], cursor: 'look', action: ['doc', 'noticeboard'] });
  // four parkas on four hooks
  const coats = grp(root, v.x1 - 0.02, F, -12.4, RY.W);
  put(coats, box(2.2, 0.08, 0.04, mat.woodDark), 0, 1.75, 0.02);
  [mat.orange, mat.navy, mat.orange, mat.navy].forEach((m, i) => {
    const x = -0.8 + i * 0.53;
    put(coats, cyl(0.21, 0.9, m, 10, 0.17), x, 1.2, 0.13).scale.z = 0.45;
    for (const s of [-1, 1]) put(coats, cyl(0.06, 0.7, m, 8, 0.07), x + s * 0.2, 1.27, 0.12).rotation.z = s * 0.1;
    put(coats, M(new THREE.SphereGeometry(0.14, 10, 8), m), x, 1.7, 0.12).scale.set(1, 1.1, 0.6);
    put(coats, M(new THREE.TorusGeometry(0.1, 0.03, 6, 12), mat.paper), x, 1.7, 0.2).scale.y = 1.2;
    put(coats, box(0.1, 0.24, 0.26, mat.rubber), x - 0.08, 0.12, 0.2);
    put(coats, box(0.1, 0.24, 0.26, mat.rubber), x + 0.08, 0.12, 0.2);
  });
  hot(put(coats, proxy(2.3, 1.9, 0.5), 0, 1, 0.2), { id: 'coats', nodes: ['vestibule'], cursor: 'look', action: ['look', 'coats'] });
  put(root, cyl(0.07, 0.5, mat.red, 10), v.x0 + 0.15, F + 0.6, -10.9);

  return {
    sync(state) {
      const live = busLive(state.gen);
      leaf.position.x = live ? 1.62 : 0;
      leaf.userData.hot.disabled = live;
      setLamp(doorLamp, live ? 0x35ff55 : 0xff2a1a, true, live ? 2.5 : 1.3);
      for (const m of fixtures) setLamp(m, 0xe8efff, live, 2.4);
      for (const [l, i] of lights) l.intensity = live ? i : 0;
    },
  };
}
