// Finds what is under the pointer by casting a ray into the 3D scene itself.
import * as THREE from 'three';

const ray = new THREE.Raycaster();
ray.params.Line.threshold = 0.001;
const ndc = new THREE.Vector2();

function hotOf(obj) {
  for (let o = obj; o; o = o.parent) if (o.userData.hot) return o.userData.hot;
  return null;
}

function shown(obj) {
  for (let o = obj; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/**
 * x, y in 0..1 from the top-left of the view.
 * Returns { hot, dir, hit } for a usable hotspot, or null.
 * Solid scenery blocks the ray; invisible helper boxes that do not apply here are passed through.
 */
export function pick(scene, camera, x, y, nodeId) {
  ndc.set(x * 2 - 1, -(y * 2 - 1));
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(scene.children, true);
  for (const hit of hits) {
    const obj = hit.object;
    if (obj.userData.nopick || obj.isLine) continue;
    const visible = shown(obj);
    const hot = hotOf(obj);
    const usable = hot && !hot.disabled && (!hot.nodes || hot.nodes.includes(nodeId));
    if (usable) {
      // a helper box only counts if the thing it stands for is actually on show
      return { hot, hit, dir: hot.dir ? hot.dir(hit) : 0 };
    }
    if (!visible) continue;
    if (obj.material && obj.material.transparent && obj.material.opacity < 0.5) continue;
    return null;
  }
  return null;
}

/** Find the object carrying a given hotspot id. */
export function findHot(scene, id) {
  let found = null;
  scene.traverse((o) => {
    if (o.userData.hot && o.userData.hot.id === id) found = o;
  });
  return found;
}

/**
 * For tests: a screen point (0..1) where clicking would trigger the given hotspot
 * (and, for two-way controls, the given direction). Null if it cannot be clicked from here.
 */
export function pointFor(scene, camera, id, nodeId, dir = 0, edges = true) {
  const obj = findHot(scene, id);
  if (!obj) return null;
  const b = new THREE.Box3().setFromObject(obj);
  if (b.isEmpty() && obj.geometry) {
    obj.geometry.computeBoundingBox();
    b.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
  }
  let x0 = 1,
    y0 = 1,
    x1 = 0,
    y1 = 0;
  const v = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camera);
    if (v.z > 1) continue;
    const sx = (v.x + 1) / 2,
      sy = (1 - v.y) / 2;
    x0 = Math.min(x0, sx);
    y0 = Math.min(y0, sy);
    x1 = Math.max(x1, sx);
    y1 = Math.max(y1, sy);
  }
  // keep clear of the turn zones (standing views) or the step-back zone (close-ups)
  x0 = Math.max(x0, edges ? 0.13 : 0.01);
  x1 = Math.min(x1, edges ? 0.87 : 0.99);
  y0 = Math.max(y0, 0.02);
  y1 = Math.min(y1, edges ? 0.98 : 0.87);
  const N = 9;
  const good = [];
  for (let iy = 0; iy < N; iy++) {
    for (let ix = 0; ix < N; ix++) {
      const x = x0 + ((ix + 0.5) / N) * (x1 - x0),
        y = y0 + ((iy + 0.5) / N) * (y1 - y0);
      const p = pick(scene, camera, x, y, nodeId);
      if (p && p.hot.id === id && (!dir || p.dir === dir)) good.push([x, y]);
    }
  }
  if (!good.length) return null;
  // prefer the candidate nearest the middle of the candidates
  const mx = good.reduce((a, p) => a + p[0], 0) / good.length,
    my = good.reduce((a, p) => a + p[1], 0) / good.length;
  good.sort((p, q) => Math.hypot(p[0] - mx, p[1] - my) - Math.hypot(q[0] - mx, q[1] - my));
  return { x: good[0][0], y: good[0][1] };
}
