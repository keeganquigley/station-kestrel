// Outdoors: sky, sea, the island itself, the jetty, the path and the aerial mast.
import * as THREE from 'three';
import { P, DECK, MAST, RY } from './layout.js';
import { terrainH, plateau, pathDist, fbm } from './terrain.js';
import { mat, lampMat } from './materials.js';
import { M, box, cyl, put, grp, strut, line, decal, text, plate, hot, proxy, sideOf, rng } from './kit.js';

const SKY_FRAG = /* glsl */ `
  varying vec3 vDir;
  uniform vec3 uSun;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
  void main(){
    vec3 d = normalize(vDir);
    float h = max(d.y, 0.0);
    float az = max(dot(normalize(d.xz), normalize(uSun.xz)), 0.0);
    vec3 warm = vec3(1.25, 0.62, 0.26);
    vec3 cool = vec3(0.34, 0.36, 0.46);
    vec3 horizon = mix(cool, warm, pow(az, 2.5));
    vec3 mid = mix(vec3(0.22, 0.25, 0.38), vec3(0.5, 0.36, 0.4), pow(az, 2.0));
    vec3 top = vec3(0.045, 0.07, 0.16);
    vec3 col = mix(horizon, mid, smoothstep(0.0, 0.22, h));
    col = mix(col, top, smoothstep(0.15, 0.85, h));
    vec2 p = d.xz / (d.y + 0.18);
    float c = fbm(p * vec2(0.9, 2.6) + vec2(3.1, 7.7));
    float cover = smoothstep(0.46, 0.72, c) * smoothstep(0.015, 0.16, d.y);
    vec3 cloudLit = mix(vec3(0.2, 0.2, 0.28), vec3(1.5, 0.66, 0.34), pow(az, 1.6) * (1.0 - smoothstep(0.0, 0.55, d.y)));
    vec3 cloudDark = vec3(0.1, 0.1, 0.15);
    col = mix(col, mix(cloudDark, cloudLit, smoothstep(0.5, 0.9, c)), cover * 0.85);
    float sd = max(dot(d, normalize(uSun)), 0.0);
    col += vec3(1.0, 0.72, 0.4) * (pow(sd, 1600.0) * 12.0 + pow(sd, 140.0) * 0.55 + pow(sd, 12.0) * 0.14);
    gl_FragColor = vec4(col, 1.0);
  }`;

export const SUN_DIR = new THREE.Vector3(-0.83, 0.15, 0.47).normalize();

export function buildIsland(scene) {
  const root = grp(scene);
  const R = rng(4107);

  // --- light
  const sun = new THREE.DirectionalLight(0xffc592, 3.6);
  sun.position.copy(SUN_DIR).multiplyScalar(140).add(new THREE.Vector3(0, 0, -4));
  sun.target.position.set(0, 0, -4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -62, right: 62, top: 40, bottom: -30, near: 20, far: 300 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.06;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0x93a4d0, 0x5a4c40, 2.3));
  scene.fog = new THREE.FogExp2(0x5d5f78, 0.0075);

  // --- sky
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(900, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: { uSun: { value: SUN_DIR } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  );
  sky.userData.nopick = true;
  root.add(sky);

  // --- sea
  const sea = M(new THREE.PlaneGeometry(1800, 1800), mat.water, false, true);
  sea.rotation.x = -Math.PI / 2;
  root.add(sea);

  // --- ground
  const geo = new THREE.PlaneGeometry(320, 320, 220, 220);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const col = new THREE.Color(), tmp = new THREE.Color();
  const C = (hex) => new THREE.Color(hex);
  const wet = C(0x2c2b29), shingle = C(0x77736a), ochre = C(0x7d6f44), moss = C(0x4e5a36), rock = C(0x5c5a56), gravel = C(0x8c8577), heath = C(0x6a4f3c);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = terrainH(x, z);
    pos.setY(i, h);
    const slope = Math.hypot(terrainH(x + 0.6, z) - h, terrainH(x, z + 0.6) - h) / 0.6;
    const n = fbm(x * 0.11 + 9, z * 0.11 + 4);
    const n2 = fbm(x * 0.45, z * 0.45, 2);
    col.copy(ochre).lerp(moss, THREE.MathUtils.smoothstep(n, 0.35, 0.62));
    col.lerp(heath, THREE.MathUtils.smoothstep(n2, 0.55, 0.75) * 0.6);
    col.lerp(rock, THREE.MathUtils.smoothstep(slope, 0.32, 0.6));
    if (h < 1.3) col.lerp(shingle, 1 - THREE.MathUtils.smoothstep(h, 0.7, 1.3));
    if (h < 0.5) col.lerp(wet, 1 - THREE.MathUtils.smoothstep(h, 0.05, 0.5));
    const pd = pathDist(x, z);
    if (pd < 2.2 && h > 0.6) col.lerp(tmp.copy(gravel), (1 - THREE.MathUtils.smoothstep(pd, 0.7, 2.2)) * 0.9);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  root.add(M(geo, mat.ground, false, true));

  // --- rocks
  const keepOut = (x, z) =>
    pathDist(x, z) < 2.6 ||
    (x > 13 && x < 25 && z > 1 && z < 11) ||
    (x > -13 && x < 18 && z > -30 && z < -7) ||
    Math.hypot(x - MAST.x, z - MAST.z) < 4 ||
    (Math.abs(x) < 4 && z > 22);
  for (let i = 0; i < 150; i++) {
    const a = R() * Math.PI * 2, d = 6 + R() * 62;
    const x = Math.cos(a) * d * 1.15, z = Math.sin(a) * d - 6;
    const h = terrainH(x, z);
    if (keepOut(x, z) || h < -1.2) continue;
    const onFlat = plateau(x, z) > 0.98;
    const s = onFlat ? 0.15 + R() * 0.45 : 0.4 + R() * 1.7;
    const g = new THREE.IcosahedronGeometry(1, 2);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const f = 0.62 + 0.75 * fbm(p.getX(k) * 1.1 + i * 3.7, p.getY(k) * 1.1 + p.getZ(k) * 0.9 + i, 3);
      p.setXYZ(k, p.getX(k) * f, p.getY(k) * f, p.getZ(k) * f);
    }
    g.computeVertexNormals();
    const m = M(g, mat.rock);
    m.scale.set(s * (0.8 + R() * 0.7), s * (0.45 + R() * 0.5), s * (0.8 + R() * 0.7));
    m.rotation.y = R() * 6;
    put(root, m, x, h + s * 0.12, z);
  }
  // sea stacks on the horizon
  for (const [x, z, s] of [[-95, 70, 13], [-128, 22, 9], [70, 96, 11], [118, 60, 7], [-60, 120, 6]]) {
    for (const [dy, w, dx] of [[0.25, 1, 0], [0.75, 0.72, 0.18], [1.25, 0.42, 0.3]]) {
      const g = new THREE.IcosahedronGeometry(1, 2);
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const f = 0.6 + 0.8 * fbm(p.getX(k) * 1.3 + x + dy * 9, p.getY(k) * 1.6 + p.getZ(k) * 1.1 + z, 3);
        p.setXYZ(k, p.getX(k) * f, p.getY(k) * (0.8 + f * 0.3), p.getZ(k) * f);
      }
      g.computeVertexNormals();
      const m = M(g, mat.crag, false, false);
      m.scale.set(s * 0.62 * w, s * 0.62, s * 0.5 * w);
      put(root, m, x + dx * s, s * dy, z);
    }
  }

  // --- jetty
  const jetty = grp(root);
  put(jetty, box(2.6, 0.16, 18, mat.wood, 1.6), 0, DECK - 0.08, 33);
  for (let z = 25; z <= 42; z += 4.25) {
    for (const x of [-1.38, 1.38]) put(jetty, cyl(0.13, 3.6, mat.woodDark, 8), x, -0.4, z);
    put(jetty, box(3, 0.14, 0.18, mat.woodDark), 0, DECK - 0.24, z);
  }
  put(jetty, cyl(0.11, 0.38, mat.darkMetal, 8), 1.05, DECK + 0.19, 40.6);
  put(jetty, cyl(0.11, 0.38, mat.darkMetal, 8), -1.05, DECK + 0.19, 31);
  // the last fuel order, never carried up
  const crates = grp(jetty, -0.75, DECK, 29.2, 0.2);
  put(crates, box(0.7, 0.55, 0.6, mat.woodDark, 0.6), 0, 0.275, 0);
  put(crates, box(0.6, 0.45, 0.55, mat.wood, 0.6), 0.05, 0.775, 0.02).rotation.y = 0.3;
  put(crates, cyl(0.29, 0.86, mat.blueDrum, 14), 0.75, 0.43, 0.1);
  hot(put(crates, proxy(1.9, 1.3, 1), 0.3, 0.6, 0), { id: 'crates', nodes: ['jetty', 'path'], cursor: 'look', action: ['look', 'crates'] });

  // the boat that brought you
  const boat = grp(root, 2.6, 0.12, 41.6, 0.12);
  const hullG = new THREE.BoxGeometry(1.7, 0.75, 4.8, 4, 2, 10);
  const hp = hullG.attributes.position;
  for (let k = 0; k < hp.count; k++) {
    const z = hp.getZ(k), y = hp.getY(k);
    const bow = THREE.MathUtils.smoothstep(z, 0.4, 2.4);
    const keel = y < 0 ? 0.62 : 1;
    hp.setX(k, hp.getX(k) * (1 - bow * 0.92) * keel);
    hp.setY(k, y + bow * 0.22 * (y > 0 ? 1 : 0.4));
  }
  hullG.computeVertexNormals();
  put(boat, M(hullG, mat.white), 0, 0.2, 0);
  put(boat, box(1.5, 0.08, 3.2, mat.orange), 0, 0.56, -0.6);
  put(boat, box(1.2, 0.55, 0.9, mat.navy), 0, 0.85, 0.3);
  put(boat, box(1.1, 0.3, 0.05, mat.glass), 0, 0.98, 0.76);
  put(boat, box(0.3, 0.7, 0.35, mat.darkMetal), 0, 0.55, -2.5);
  line(root, [[1.15, DECK + 0.3, 40.6], [1.95, 0.72, 41.2]], 0x8a7a5a);
  hot(put(boat, proxy(2, 1.6, 5), 0, 0.6, 0), { id: 'boat', nodes: ['jetty'], cursor: 'look', action: ['look', 'boat'] });

  // --- the sign above the landing
  const sx = 4.6, sz = 15.6, sy = terrainH(sx, sz);
  const sign = grp(root, sx, sy, sz, -0.5);
  put(sign, box(0.1, 2.5, 0.1, mat.woodDark), -1.0, 1.25, -0.06);
  put(sign, box(0.1, 2.5, 0.1, mat.woodDark), 1.0, 1.25, -0.06);
  const board = decal(2.4, 1.3, 190, (g, W, H) => {
    g.fillStyle = '#c9c4ad';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#7d1d16';
    g.lineWidth = 10;
    g.strokeRect(10, 10, W - 20, H - 20);
    text(g, 'STATION KESTREL', W / 2, H * 0.22, { size: 50, color: '#1a1a1a' });
    text(g, 'HOLLUND ISLAND', W / 2, H * 0.4, { size: 30, color: '#1a1a1a' });
    text(g, 'RESTRICTED', W / 2, H * 0.62, { size: 54, color: '#7d1d16' });
    text(g, 'NO LANDING WITHOUT AUTHORITY', W / 2, H * 0.82, { size: 24, color: '#1a1a1a' });
    const r = rng(11);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${90 + r() * 60},${70 + r() * 40},${50 + r() * 30},${r() * 0.35})`;
      g.fillRect(r() * W, r() * H, 1 + r() * 5, 1 + r() * 9);
    }
    for (let i = 0; i < 14; i++) {
      const x = r() * W, grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(96,50,24,0.5)');
      grad.addColorStop(1, 'rgba(96,50,24,0)');
      g.fillStyle = grad;
      g.fillRect(x, r() * H * 0.5, 3 + r() * 8, H);
    }
  });
  put(sign, board, 0, 1.75, 0.01);
  put(sign, box(2.46, 1.36, 0.05, mat.woodDark), 0, 1.75, -0.02);
  hot(board, { id: 'sign', nodes: ['jetty', 'path'], cursor: 'look', action: ['look', 'sign'] });

  // --- path furniture
  const lampPost = (x, z, ry) => {
    const g = grp(root, x, terrainH(x, z), z, ry);
    put(g, cyl(0.05, 3.6, mat.darkMetal, 8), 0, 1.8, 0);
    put(g, box(0.06, 0.06, 0.7, mat.darkMetal), 0, 3.56, 0.3);
    put(g, box(0.22, 0.12, 0.36, mat.steel), 0, 3.5, 0.62);
  };
  lampPost(-2.1, 12.5, RY.E);
  lampPost(2.1, -1.5, RY.W);
  const posts = [];
  for (let z = 25.5; z >= 13.5; z -= 3) {
    const x = -1.9 + Math.sin(z) * 0.08, y = terrainH(x, z);
    put(root, box(0.09, 1.0, 0.09, mat.woodDark), x, y + 0.45, z).rotation.z = (R() - 0.5) * 0.12;
    posts.push([x, y + 0.85, z]);
  }
  line(root, posts, 0x3a3228);
  // weather screen
  const wx = grp(root, 7.2, P, -1.5, 0.3);
  for (const [x, z] of [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]]) put(wx, box(0.05, 1.3, 0.05, mat.white), x, 0.65, z);
  put(wx, box(0.8, 0.6, 0.66, mat.white), 0, 1.55, 0);
  for (let i = 0; i < 5; i++) put(wx, box(0.82, 0.02, 0.68, mat.steel), 0, 1.32 + i * 0.11, 0);
  put(wx, box(0.95, 0.06, 0.8, mat.white), 0, 1.9, 0);
  // fuel drums by the plant shed
  for (const [x, z, m, lie] of [[15.2, 10.3, mat.rust, 0], [15.95, 10.5, mat.blueDrum, 0], [15.5, 11.1, mat.rust, 0], [14.2, 10.8, mat.blueDrum, 1]]) {
    const d = cyl(0.29, 0.88, m, 14);
    if (lie) d.rotation.z = Math.PI / 2;
    put(root, d, x, P + (lie ? 0.29 : 0.44), z);
  }

  // --- the aerial mast
  const mast = grp(root, MAST.x, P, MAST.z);
  put(mast, box(2.6, 0.3, 2.6, mat.concrete, 2), 0, 0.1, 0);
  const H = MAST.h, bays = 7;
  const corner = (i, y) => {
    const s = 0.62 - (0.44 * y) / H;
    return [[-s, s, s, -s][i], y + 0.25, [-s, -s, s, s][i]];
  };
  for (let i = 0; i < 4; i++) strut(mast, corner(i, 0), corner(i, H), 0.04, mat.steel);
  for (let b = 0; b <= bays; b++) {
    const y = (H * b) / bays;
    for (let i = 0; i < 4; i++) {
      strut(mast, corner(i, y), corner((i + 1) % 4, y), 0.02, mat.steel, 5);
      if (b < bays) {
        const y2 = (H * (b + 1)) / bays;
        strut(mast, corner(i, y), corner((i + 1) % 4, y2), 0.016, mat.steel, 5);
      }
    }
  }
  for (const [ax, az] of [[-9, -9], [9, -9], [-9, 9], [5, 10]]) {
    line(mast, [[Math.sign(ax) * 0.3, H * 0.72, Math.sign(az) * 0.3], [ax, terrainH(MAST.x + ax, MAST.z + az) - P + 0.1, az]], 0x24262a);
  }
  // the beam on top: points north when the bearing is zero
  const rotor = grp(mast, 0, H + 0.25, 0);
  put(rotor, cyl(0.045, 1.6, mat.darkMetal, 8), 0, 0.8, 0);
  const beam = grp(rotor, 0, 1.5, 0);
  strut(beam, [0, 0, -2.6], [0, 0, 1.5], 0.035, mat.darkMetal);
  [[-2.5, 1.0], [-1.9, 1.25], [-1.2, 1.5], [-0.4, 1.8], [0.5, 2.15], [1.4, 2.5]].forEach(([z, half]) => strut(beam, [-half, 0, z], [half, 0, z], 0.018, mat.chrome, 5));
  put(beam, box(0.12, 0.12, 0.2, mat.red), 0, 0, -2.6);

  // rotator cabinet with its bearing dial and hand crank
  put(mast, box(0.5, 1.5, 1.0, mat.panelGrey, 1), 0.9, 1.0, 0);
  put(mast, box(0.6, 0.05, 1.1, mat.darkMetal), 0.9, 1.78, 0);
  const panel = grp(mast, 1.155, 1.1, 0, RY.E);
  const dial = decal(0.56, 0.56, 520, (g, W) => {
    const c = W / 2;
    g.fillStyle = '#7c807a';
    g.fillRect(0, 0, W, W);
    g.fillStyle = '#ece7d2';
    g.beginPath();
    g.arc(c, c, c * 0.96, 0, 7);
    g.fill();
    g.strokeStyle = '#151515';
    g.lineWidth = 3;
    g.stroke();
    for (let deg = 0; deg < 360; deg += 10) {
      const a = ((deg - 90) * Math.PI) / 180, major = deg % 30 === 0;
      g.lineWidth = major ? 4 : 2;
      g.beginPath();
      g.moveTo(c + Math.cos(a) * c * 0.93, c + Math.sin(a) * c * 0.93);
      g.lineTo(c + Math.cos(a) * c * (major ? 0.8 : 0.86), c + Math.sin(a) * c * (major ? 0.8 : 0.86));
      g.stroke();
      if (major) text(g, String(deg).padStart(3, '0'), c + Math.cos(a) * c * 0.66, c + Math.sin(a) * c * 0.66, { size: 25, color: '#151515' });
    }
    text(g, 'N', c, c - c * 0.36, { size: 30, color: '#8c1f17' });
    text(g, 'TRUE BEARING', c, c + c * 0.36, { size: 15, color: '#333' });
  }, { rough: 0.5 });
  put(panel, dial, -0.18, 0.2, 0.004);
  const needle = M(new THREE.BoxGeometry(0.014, 0.25, 0.006), mat.red, false, false);
  needle.geometry.translate(0, 0.095, 0);
  put(panel, needle, -0.18, 0.2, 0.012);
  put(panel, cyl(0.022, 0.02, mat.darkMetal, 10), -0.18, 0.2, 0.014).rotation.x = Math.PI / 2;
  put(panel, plate(0.46, 0.085, 'AERIAL ROTATOR - HAND DRIVE'), -0.18, -0.2, 0.004);
  const crank = grp(panel, 0.3, 0.14, 0.06);
  crank.add(M(new THREE.TorusGeometry(0.13, 0.016, 8, 24), mat.darkMetal));
  for (let i = 0; i < 3; i++) {
    const s = box(0.26, 0.018, 0.014, mat.darkMetal);
    s.rotation.z = (i * Math.PI) / 3;
    crank.add(s);
  }
  put(crank, cyl(0.02, 0.09, mat.black, 8), 0.13, 0, 0.05).rotation.x = Math.PI / 2;
  put(panel, cyl(0.03, 0.06, mat.darkMetal, 10), 0.3, 0.14, 0.03).rotation.x = Math.PI / 2;
  put(panel, plate(0.26, 0.07, 'TURN'), 0.3, -0.07, 0.004);
  const crankHit = put(panel, proxy(0.36, 0.36, 0.14), 0.3, 0.14, 0.06);
  hot(crankHit, { id: 'crank', nodes: ['mast'], cursor: 'turn', action: ['mast'], dir: sideOf(panel, 0.3, 0.14) });
  hot(put(mast, proxy(1.9, 3.4, 1.9), 0.3, 1.7, 0), { id: 'mastbase', nodes: ['field'], cursor: 'zoom', action: ['go', 'mast'] });

  const lamp = lampMat(0x331111);
  put(mast, box(0.1, 0.1, 0.1, lamp), 0, H + 0.3, 0);

  return {
    sync(state) {
      const b = (state.rx.bearing * Math.PI) / 180;
      rotor.rotation.y = -b;
      needle.rotation.z = -b;
      crank.rotation.z = -b * 4;
    },
  };
}
