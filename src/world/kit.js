// Small building blocks shared by every area of the island.
import * as THREE from 'three';

export function M(geo, mat, cast = true, recv = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = recv;
  return m;
}

/** Stretch a box's UVs so a texture covers `s` metres regardless of the box size. */
function boxUV(g, w, h, d, s) {
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, (uv.getX(k) * dims[f][0]) / s, (uv.getY(k) * dims[f][1]) / s);
    }
  }
}

export function box(w, h, d, mat, uv = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (uv) boxUV(g, w, h, d, uv);
  return M(g, mat);
}

/** Upright cylinder; r2 is the top radius if it tapers. */
export function cyl(r, h, mat, seg = 14, r2 = r) {
  return M(new THREE.CylinderGeometry(r2, r, h, seg), mat);
}

export function put(parent, obj, x = 0, y = 0, z = 0) {
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}

export function grp(parent, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

/** A thin round bar between two points. */
export function strut(parent, a, b, r, mat, seg = 6) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const m = cyl(r, len, mat, seg);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  parent.add(m);
  return m;
}

export function line(parent, pts, color = 0x1a1a1a) {
  const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p)));
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color }));
  l.userData.nopick = true;
  parent.add(l);
  return l;
}

/**
 * Axis-aligned wall from (x0,z0) to (x1,z1), standing on y with height h.
 * openings: [{a, b, y0, y1}] measured along the wall in world coordinates.
 */
export function wall(parent, mat, x0, z0, x1, z1, y, h, t, openings = [], uv = 2) {
  const alongX = Math.abs(z1 - z0) < 1e-6;
  const s0 = alongX ? Math.min(x0, x1) : Math.min(z0, z1);
  const s1 = alongX ? Math.max(x0, x1) : Math.max(z0, z1);
  const piece = (a, b, ya, yb) => {
    if (b - a < 1e-3 || yb - ya < 1e-3) return;
    const len = b - a, hh = yb - ya;
    const m = alongX ? box(len, hh, t, mat, uv) : box(t, hh, len, mat, uv);
    m.position.set(alongX ? (a + b) / 2 : x0, y + (ya + yb) / 2, alongX ? z0 : (a + b) / 2);
    parent.add(m);
  };
  let cur = s0;
  for (const o of [...openings].sort((p, q) => p.a - q.a)) {
    piece(cur, o.a, 0, h);
    piece(o.a, o.b, 0, o.y0 || 0);
    piece(o.a, o.b, o.y1, h);
    cur = o.b;
  }
  piece(cur, s1, 0, h);
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function canvasTexture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * A flat plane carrying something drawn on a canvas: labels, dials, papers, screens.
 * px is pixels per metre. glow > 0 makes it self-lit.
 */
export function decal(w, h, px, draw, { glow = 0, rough = 0.85 } = {}) {
  const c = makeCanvas(Math.max(8, Math.round(w * px)), Math.max(8, Math.round(h * px)));
  const g = c.getContext('2d');
  draw(g, c.width, c.height);
  const tex = canvasTexture(c);
  const mat = glow
    ? new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(glow, glow, glow) })
    : new THREE.MeshStandardMaterial({ map: tex, roughness: rough });
  const m = M(new THREE.PlaneGeometry(w, h), mat, false, true);
  m.userData.redraw = (fn) => {
    fn(g, c.width, c.height);
    tex.needsUpdate = true;
  };
  return m;
}

export function text(g, str, x, y, { size = 20, color = '#111', align = 'center', font = '"Arial Narrow", Arial, sans-serif', weight = 'bold', base = 'middle' } = {}) {
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = base;
  g.fillText(str, x, y);
}

/** An engraved label plate. */
export function plate(w, h, str, { bg = '#1b1b1b', fg = '#e8e4d4', px = 700, lines } = {}) {
  return decal(w, h, px, (g, W, H) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = fg;
    g.globalAlpha = 0.35;
    g.strokeRect(2.5, 2.5, W - 5, H - 5);
    g.globalAlpha = 1;
    const ls = lines || [str];
    ls.forEach((l, i) => {
      let size = (H * 0.74) / ls.length;
      g.font = `bold ${size}px "Arial Narrow", Arial, sans-serif`;
      const w = g.measureText(l).width;
      if (w > W * 0.9) size *= (W * 0.9) / w;
      text(g, l, W / 2, (H * (i + 0.5)) / ls.length + 1, { size, color: fg });
    });
  });
}

/** A meter: drawn face plus a needle. userData.set(angle) turns the needle clockwise from upright. */
export function gauge(w, h, px, drawFace, needleMat, { pivotY = -0.32 * h, len = 0.66 * h } = {}) {
  const g = new THREE.Group();
  g.add(decal(w, h, px, drawFace, { rough: 0.5 }));
  const needle = M(new THREE.BoxGeometry(Math.max(0.004, w * 0.015), len, 0.003), needleMat, false, false);
  needle.geometry.translate(0, len / 2, 0);
  needle.position.set(0, pivotY, 0.004);
  g.add(needle);
  g.userData.set = (a) => {
    needle.rotation.z = -a;
  };
  return g;
}

/** Standard face for a swing meter: arc scale with tick labels. */
export function meterFace(title, labels, { redFrom = null, redAt = null } = {}) {
  return (g, W, H) => {
    g.fillStyle = '#e9e4cf';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#222';
    g.lineWidth = Math.max(2, W * 0.012);
    g.strokeRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.82, r = H * 0.6;
    const A = (f) => -Math.PI / 2 + (f - 0.5) * 1.6;
    g.beginPath();
    g.arc(cx, cy, r, A(0), A(1));
    g.stroke();
    if (redFrom !== null) {
      g.strokeStyle = '#b3261e';
      g.lineWidth = W * 0.03;
      g.beginPath();
      g.arc(cx, cy, r * 0.93, A(redFrom), A(1));
      g.stroke();
    }
    g.strokeStyle = '#222';
    g.lineWidth = Math.max(1.5, W * 0.01);
    labels.forEach((l, i) => {
      const f = i / (labels.length - 1), a = A(f);
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      g.lineTo(cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * 1.1);
      g.stroke();
      text(g, String(l), cx + Math.cos(a) * r * 1.27, cy + Math.sin(a) * r * 1.27, { size: H * 0.13, color: '#222' });
    });
    if (redAt !== null) {
      const a = A(redAt);
      g.strokeStyle = '#b3261e';
      g.lineWidth = W * 0.02;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75);
      g.lineTo(cx + Math.cos(a) * r * 1.12, cy + Math.sin(a) * r * 1.12);
      g.stroke();
    }
    text(g, title, cx, H * 0.7, { size: H * 0.13, color: '#333' });
  };
}

/** Needle angle (radians from upright) for a 0..1 reading on a meterFace. */
export const meterAngle = (f) => (Math.max(0, Math.min(1, f)) - 0.5) * 1.6;

/** Mark an object as something the player can click. See engine/hotspots.js. */
export function hot(obj, spec) {
  obj.userData.hot = spec;
  return obj;
}

/** An invisible box that widens the clickable area of a small prop. */
export function proxy(w, h, d) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
  m.visible = false;
  return m;
}

/** Tells a control which half was clicked: -1 left/down, +1 right/up, in the panel's own frame. */
export function sideOf(frame, cx, cy, axis = 'x') {
  const v = new THREE.Vector3();
  return (hit) => {
    frame.worldToLocal(v.copy(hit.point));
    return axis === 'x' ? (v.x >= cx ? 1 : -1) : v.y >= cy ? 1 : -1;
  };
}

export function chair(mat, legMat) {
  const g = new THREE.Group();
  put(g, box(0.44, 0.05, 0.44, mat), 0, 0.46, 0);
  put(g, box(0.44, 0.5, 0.05, mat), 0, 0.78, -0.2);
  for (const [x, z] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) put(g, box(0.035, 0.46, 0.035, legMat), x, 0.23, z);
  return g;
}

/** Seeded random numbers so the island is the same every time. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
