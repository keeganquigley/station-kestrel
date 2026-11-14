// The plant shed: diesel set, breaker panel, workbench.
import * as THREE from 'three';
import { SHED, SHED_FLOOR as F, RY } from './layout.js';
import { mat, lampMat, setLamp } from './materials.js';
import { M, box, cyl, put, grp, wall, decal, text, plate, gauge, meterFace, meterAngle, hot, proxy } from './kit.js';
import { BREAKERS, RATING, PRIME_COUNT, load, status } from '../puzzles/generator.js';

export const GEN_PANEL = { x: 20.36, y: F + 1.05, z: 6 };
export const BRK_PANEL = { x: 18.5, y: F + 1.45, z: SHED.z0 + 0.1 };

export function buildShed(scene) {
  const root = grp(scene);
  const { x0, x1, z0, z1, h } = SHED;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;

  // shell
  put(root, box(x1 - x0 + 0.4, 0.4, z1 - z0 + 0.4, mat.concrete, 2), cx, F - 0.2, cz);
  const t = 0.08;
  wall(root, mat.corrugated, x0, z0, x1, z0, F, h, t, [], 1.6);
  wall(root, mat.corrugated, x0, z1, x1, z1, F, h, t, [{ a: 16.5, b: 17.5, y0: 1.3, y1: 1.95 }], 1.6);
  wall(root, mat.corrugated, x1, z0, x1, z1, F, h, t, [], 1.6);
  wall(root, mat.corrugated, x0, z0, x0, z1, F, h, t, [{ a: 5.3, b: 6.7, y0: 0, y1: 2.1 }], 1.6);
  put(root, box(x1 - x0 + 0.7, 0.1, z1 - z0 + 0.7, mat.corrugated, 1.6), cx, F + h + 0.05, cz);
  put(root, box(0.05, 2.1, 1.38, mat.rust, 1), x0 - 0.08, F + 1.05, 4.56); // door, hooked back
  put(root, box(1.0, 0.65, 0.02, mat.glass), 17.0, F + 1.625, z1 + 0.02).material = new THREE.MeshStandardMaterial({ color: 0x8aa0b0, transparent: true, opacity: 0.18, roughness: 0.1 });
  put(root, cyl(0.07, 1.9, mat.rust, 8), 21.25, F + h + 0.9, 6.9); // exhaust stack
  put(root, cyl(0.12, 0.08, mat.rust, 8), 21.25, F + h + 1.88, 6.9);

  // light: a little daylight from the door, and one bulb that runs off the set itself
  const fill = new THREE.PointLight(0x9fb0d8, 3.2, 9, 1.6);
  fill.position.set(17.3, F + 1.9, 6);
  root.add(fill);
  const bulbMat = lampMat(0x5a5546);
  put(root, cyl(0.004, 0.5, mat.black, 4), 18.9, F + h - 0.25, 6);
  put(root, M(new THREE.SphereGeometry(0.06, 10, 8), bulbMat, false, false), 18.9, F + h - 0.55, 6);
  const bulb = new THREE.PointLight(0xffd9a0, 0, 12, 1.5);
  bulb.position.set(18.9, F + h - 0.62, 6);
  root.add(bulb);

  // --- the diesel set, against the east wall
  const gen = grp(root, 20.95, F, 6);
  put(gen, box(1.0, 0.14, 2.4, mat.darkMetal), 0, 0.07, 0);
  put(gen, box(0.72, 0.85, 1.15, mat.genGreen, 1), 0.02, 0.57, 0.35);
  for (let i = 0; i < 5; i++) put(gen, box(0.6, 0.035, 1.0, mat.genGreen), 0.02, 1.03 + i * 0.05, 0.35);
  const alt = put(gen, cyl(0.34, 0.85, mat.steel, 16), 0.02, 0.5, -0.7);
  alt.rotation.x = Math.PI / 2;
  put(gen, box(0.78, 0.9, 0.1, mat.darkMetal), 0.02, 0.6, 1.0); // radiator
  const tank = put(gen, cyl(0.2, 1.2, mat.red, 14), 0.1, 1.55, 0.2);
  tank.rotation.x = Math.PI / 2;
  put(gen, box(0.04, 0.3, 0.04, mat.darkMetal), 0.1, 1.33, -0.25);
  put(gen, box(0.04, 0.3, 0.04, mat.darkMetal), 0.1, 1.33, 0.65);
  put(gen, cyl(0.045, 1.7, mat.rust, 8), 0.3, 1.85, 0.9);
  put(gen, box(0.06, 1.3, 0.06, mat.darkMetal), -0.5, 0.65, -0.72);
  put(gen, box(0.06, 1.3, 0.06, mat.darkMetal), -0.5, 0.65, 0.72);
  hot(put(gen, proxy(1.3, 1.9, 2.5), -0.1, 0.95, 0), { id: 'genset', nodes: ['shed'], cursor: 'zoom', action: ['go', 'gen'] });

  const gp = grp(root, GEN_PANEL.x, GEN_PANEL.y, GEN_PANEL.z, RY.W);
  put(gp, box(1.5, 0.66, 0.06, mat.panelGrey, 1), 0, 0, -0.03);
  put(gp, plate(0.5, 0.1, 'DIESEL SET No. 2'), -0.42, 0.24, 0.002);
  const label = (str, x) => put(gp, plate(0.22, 0.06, str), x, -0.26, 0.002);
  // fuel valve
  const valve = grp(gp, -0.56, -0.07, 0.03);
  put(valve, box(0.045, 0.2, 0.03, mat.red), 0, 0.06, 0);
  put(gp, cyl(0.04, 0.05, mat.brass, 10), -0.56, -0.07, 0.02).rotation.x = Math.PI / 2;
  put(gp, plate(0.1, 0.04, 'OPEN'), -0.56, 0.1, 0.002);
  put(gp, plate(0.1, 0.04, 'SHUT'), -0.42, -0.07, 0.002);
  label('FUEL VALVE', -0.56);
  hot(put(gp, proxy(0.26, 0.3, 0.1), -0.56, -0.05, 0.04), { id: 'valve', nodes: ['gen'], cursor: 'hand', action: ['gen', 'valve'] });
  // sight glass
  const sight = decal(0.05, 0.2, 500, () => {}, { rough: 0.3 });
  put(gp, sight, -0.3, -0.06, 0.004);
  put(gp, box(0.07, 0.22, 0.01, mat.darkMetal), -0.3, -0.06, -0.002);
  // primer
  const primer = M(new THREE.SphereGeometry(0.055, 12, 8), mat.red);
  put(gp, primer, -0.14, -0.07, 0.03);
  put(gp, cyl(0.065, 0.02, mat.darkMetal, 12), -0.14, -0.07, 0.01).rotation.x = Math.PI / 2;
  label('PRIMER', -0.14);
  hot(primer, { id: 'primer', nodes: ['gen'], cursor: 'hand', action: ['gen', 'prime'] });
  // choke
  const choke = grp(gp, 0.14, -0.07, 0);
  put(choke, cyl(0.012, 0.16, mat.chrome, 8), 0, 0, 0).rotation.x = Math.PI / 2;
  put(choke, cyl(0.045, 0.03, mat.black, 12), 0, 0, 0.085).rotation.x = Math.PI / 2;
  // a red flange on the shaft: inside the panel when the knob is home, standing proud when it is out
  put(choke, cyl(0.07, 0.012, mat.red, 18), 0, 0, -0.03).rotation.x = Math.PI / 2;
  label('CHOKE', 0.14);
  hot(put(gp, proxy(0.2, 0.2, 0.3), 0.14, -0.07, 0.1), { id: 'choke', nodes: ['gen'], cursor: 'hand', action: ['gen', 'choke'] });
  // starter
  const starter = put(gp, cyl(0.05, 0.04, mat.green, 14), 0.42, -0.07, 0.02);
  starter.rotation.x = Math.PI / 2;
  put(gp, cyl(0.065, 0.015, mat.chrome, 14), 0.42, -0.07, 0.008).rotation.x = Math.PI / 2;
  label('START', 0.42);
  hot(starter, { id: 'starter', nodes: ['gen'], cursor: 'hand', action: ['gen', 'starter'] });
  // voltmeter and run lamp
  const volts = gauge(0.3, 0.22, 600, meterFace('VOLTS', [0, 100, 200, 300]), mat.black);
  put(gp, volts, 0.2, 0.18, 0.004);
  const runMat = lampMat(0x1c2a1c);
  put(gp, cyl(0.03, 0.03, runMat, 12), 0.56, 0.2, 0.015).rotation.x = Math.PI / 2;
  put(gp, plate(0.14, 0.045, 'RUN'), 0.56, 0.12, 0.002);

  // --- breaker panel, north wall
  const bp = grp(root, BRK_PANEL.x, BRK_PANEL.y, BRK_PANEL.z, RY.S);
  put(bp, box(1.56, 1.04, 0.1, mat.panelGrey, 1), 0, 0, -0.05);
  put(bp, plate(0.52, 0.16, '', { lines: ['GENERATOR SET No. 2', `PLATE RATING ${RATING} A`] }), -0.46, 0.36, 0.002);
  const amps = gauge(0.34, 0.25, 600, meterFace('AMPS', [0, 10, 20, 30, 40, 50, 60], { redFrom: 0.72, redAt: RATING / 60 }), mat.black);
  put(bp, amps, 0.06, 0.34, 0.004);
  const busMat = lampMat(0x2a2a22);
  put(bp, cyl(0.04, 0.03, busMat, 14), 0.5, 0.38, 0.015).rotation.x = Math.PI / 2;
  put(bp, plate(0.2, 0.055, 'BUS LIVE'), 0.5, 0.28, 0.002);
  const levers = {};
  BREAKERS.forEach((b, i) => {
    const x = -0.6 + i * 0.24;
    put(bp, box(0.11, 0.24, 0.02, mat.black), x, 0, 0.01);
    const lever = grp(bp, x, 0, 0.02);
    put(lever, box(0.05, 0.05, 0.12, mat.white), 0, 0, 0.05);
    levers[b.id] = lever;
    put(bp, plate(0.215, 0.13, '', { lines: [b.label, `${b.amps} A`], bg: '#e6dfc8', fg: '#151515' }), x, -0.3, 0.002);
    put(bp, plate(0.06, 0.035, 'ON', { bg: '#7b7f78', fg: '#111' }), x, 0.15, 0.002);
    hot(put(bp, proxy(0.2, 0.32, 0.2), x, 0, 0.08), { id: 'breaker-' + b.id, nodes: ['breakers'], cursor: 'hand', action: ['gen', 'breaker:' + b.id] });
  });
  hot(put(bp, proxy(1.56, 1.04, 0.3), 0, 0, 0.05), { id: 'panel', nodes: ['shed'], cursor: 'zoom', action: ['go', 'breakers'] });
  // Lund's note, taped beside the panel
  const note = decal(0.26, 0.34, 500, (g, W, H) => {
    g.fillStyle = '#ddd5b4';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#28324e';
    for (let i = 0; i < 9; i++) g.fillRect(12, 22 + i * 15, W - 24 - ((i * 37) % 40), 2);
    g.fillStyle = 'rgba(190,180,140,0.9)';
    g.fillRect(W / 2 - 20, 0, 40, 12);
  });
  put(root, note, 19.46, F + 1.45, z0 + 0.06);
  hot(note, { id: 'govnote', nodes: ['shed', 'breakers'], cursor: 'look', action: ['doc', 'govnote'] });

  // --- workbench, south wall
  const bz = z1 - 0.4;
  put(root, box(2.6, 0.06, 0.7, mat.wood, 1), 18.6, F + 0.9, bz);
  for (const x of [17.4, 19.8]) put(root, box(0.08, 0.88, 0.6, mat.woodDark), x, F + 0.44, bz);
  put(root, box(2.4, 0.04, 0.6, mat.woodDark, 1), 18.6, F + 0.3, bz);
  put(root, box(0.45, 0.22, 0.25, mat.red), 17.8, F + 1.04, bz + 0.05).rotation.y = 0.2;
  put(root, box(0.16, 0.14, 0.2, mat.darkMetal), 19.55, F + 1.0, bz - 0.2);
  put(root, cyl(0.05, 0.16, mat.brass, 10, 0.02), 18.9, F + 1.01, bz + 0.1);
  put(root, box(0.34, 0.42, 0.22, mat.green), 17.9, F + 0.53, bz); // jerry can
  put(root, cyl(0.29, 0.88, mat.rust, 14), 21.5, F + 0.44, 4.2);
  put(root, cyl(0.29, 0.88, mat.blueDrum, 14), 16.5, F + 0.44, 8.0);
  // cold-start card
  const card = decal(0.44, 0.58, 420, (g, W, H) => {
    g.fillStyle = '#d8c98f';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#8c1f17';
    g.fillRect(0, 0, W, 34);
    text(g, 'COLD START', W / 2, 18, { size: 22, color: '#f0e8c8' });
    g.fillStyle = '#2a2418';
    for (let i = 0; i < 6; i++) {
      text(g, String(i + 1), 18, 62 + i * 30, { size: 18, color: '#2a2418' });
      g.fillRect(36, 60 + i * 30, W - 60 - ((i * 53) % 50), 3);
    }
  });
  card.rotation.y = RY.N;
  put(root, card, 18.25, F + 1.6, z1 - 0.05);
  hot(card, { id: 'card', nodes: ['shed'], cursor: 'look', action: ['doc', 'card'] });
  // key board
  const kb = grp(root, 19.1, F + 1.62, z1 - 0.05, RY.N);
  put(kb, box(0.6, 0.26, 0.02, mat.woodDark), 0, 0, 0.01);
  for (const x of [-0.2, 0, 0.2]) put(kb, cyl(0.008, 0.05, mat.brass, 6), x, 0.06, 0.04).rotation.x = Math.PI / 2;
  put(kb, plate(0.09, 0.04, 'PLANT'), -0.2, 0.105, 0.021);
  put(kb, plate(0.09, 0.04, 'STORE'), 0, 0.105, 0.021);
  put(kb, plate(0.09, 0.04, 'C.O.'), 0.2, 0.105, 0.021);
  const key = grp(kb, 0.2, 0.0, 0.045);
  key.add(M(new THREE.TorusGeometry(0.03, 0.009, 6, 14), mat.brass));
  put(key, box(0.014, 0.11, 0.008, mat.brass), 0, -0.085, 0);
  put(key, box(0.035, 0.014, 0.008, mat.brass), 0.02, -0.125, 0);
  put(key, box(0.028, 0.014, 0.008, mat.brass), 0.016, -0.1, 0);
  const keyHit = put(kb, proxy(0.2, 0.3, 0.12), 0.2, -0.03, 0.05);
  hot(keyHit, { id: 'key', nodes: ['shed'], cursor: 'hand', action: ['key'] });
  const plantKey = key.clone();
  plantKey.position.x = -0.2;
  kb.add(plantKey);

  const drawSight = (primes) => (g, W, H) => {
    g.fillStyle = '#c9d2c8';
    g.fillRect(0, 0, W, H);
    const f = Math.min(primes, PRIME_COUNT) / PRIME_COUNT;
    g.fillStyle = '#b07a1c';
    g.fillRect(0, H * (1 - f), W, H * f);
    g.fillStyle = '#222';
    for (let i = 1; i <= PRIME_COUNT; i++) g.fillRect(0, H * (1 - i / PRIME_COUNT), W * 0.45, 2);
  };

  return {
    sync(state) {
      const s = state.gen,
        st = status(s);
      valve.rotation.z = s.valve ? 0 : -Math.PI / 2;
      choke.position.z = s.choke ? 0.1 : 0;
      sight.userData.redraw(drawSight(s.running ? PRIME_COUNT : s.primes));
      volts.userData.set(meterAngle(st === 'off' ? 0 : st === 'rough' ? 0.42 : 230 / 300));
      setLamp(runMat, st === 'rough' ? 0xffa020 : 0x35ff55, s.running);
      for (const b of BREAKERS) levers[b.id].rotation.x = s.breakers[b.id] ? -0.55 : 0.55;
      amps.userData.set(meterAngle(load(s) / 60));
      setLamp(busMat, st === 'live' ? 0x35ff55 : 0xffa020, st === 'live' || st === 'hunting', st === 'live' ? 2.5 : 1.2);
      bulb.intensity = s.running ? (st === 'rough' ? 5 : 9) : 0;
      setLamp(bulbMat, 0xffd9a0, s.running, 3);
      key.visible = !state.flags.keyTaken;
      keyHit.userData.hot.disabled = !!state.flags.keyTaken;
    },
  };
}
