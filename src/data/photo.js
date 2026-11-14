// The photograph from the camera on the quay, as it comes up in the developer.
// Drawn from the same names and numbers the puzzles use.
import { VESSEL } from './names.js';
import { HULL } from '../puzzles/telegraph.js';

/** A small seeded generator, so the grain is the same every time it is drawn. */
function grain(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawPhoto(g, W, H) {
  const R = grain(1411);
  const u = W / 560; // drawn for a 560 px wide print
  g.save();
  g.fillStyle = '#efe9d6'; // the border of the print
  g.fillRect(0, 0, W, H);
  const m = 16 * u, w = W - 2 * m, h = H - 2 * m;
  g.translate(m, m);
  g.beginPath();
  g.rect(0, 0, w, h);
  g.clip();

  // the cavern
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0e0d0b');
  sky.addColorStop(0.55, '#23211c');
  sky.addColorStop(1, '#0b0b0a');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(${40 + R() * 30},${38 + R() * 28},${32 + R() * 24},0.7)`;
    g.beginPath();
    g.ellipse(R() * w, R() * h * 0.3, (30 + R() * 60) * u, (12 + R() * 26) * u, 0, 0, 7);
    g.fill();
  }
  // a lamp, flaring
  const lamp = g.createRadialGradient(w * 0.2, h * 0.16, 0, w * 0.2, h * 0.16, w * 0.5);
  lamp.addColorStop(0, 'rgba(255,248,224,0.95)');
  lamp.addColorStop(0.06, 'rgba(240,230,200,0.55)');
  lamp.addColorStop(1, 'rgba(240,230,200,0)');
  g.fillStyle = lamp;
  g.fillRect(0, 0, w, h);

  // water
  const wy = h * 0.74;
  const sea = g.createLinearGradient(0, wy, 0, h);
  sea.addColorStop(0, '#2b2924');
  sea.addColorStop(1, '#070706');
  g.fillStyle = sea;
  g.fillRect(0, wy, w, h - wy);

  // the boat, new paint, broadside on, bow to the right
  const cx = w * 0.5, hy = wy - 4 * u, L = w * 0.92, hh = 34 * u;
  const paint = g.createLinearGradient(0, hy - hh, 0, hy + hh * 0.4);
  paint.addColorStop(0, '#d9d4c2');
  paint.addColorStop(0.55, '#a7a393');
  paint.addColorStop(1, '#55534a');
  g.fillStyle = paint;
  g.beginPath();
  g.moveTo(cx - L / 2, hy - hh * 0.2);
  g.quadraticCurveTo(cx - L * 0.36, hy - hh, cx - L * 0.2, hy - hh);
  g.lineTo(cx + L * 0.3, hy - hh);
  g.quadraticCurveTo(cx + L * 0.5, hy - hh * 0.9, cx + L / 2, hy - hh * 0.1);
  g.lineTo(cx + L / 2, hy + hh * 0.3);
  g.lineTo(cx - L / 2, hy + hh * 0.3);
  g.fill();
  g.fillStyle = sea;
  g.fillRect(0, wy, w, h - wy);
  g.fillStyle = 'rgba(210,205,188,0.16)'; // her reflection
  g.fillRect(cx - L * 0.44, wy, L * 0.86, 20 * u);
  // casing
  g.fillStyle = '#8f8b7c';
  g.fillRect(cx - L * 0.36, hy - hh - 6 * u, L * 0.68, 7 * u);
  // conning tower, with her name and number
  const tx = cx - 20 * u, tw = 190 * u, th = 96 * u, ty = hy - hh - 6 * u - th;
  const tower = g.createLinearGradient(0, ty, 0, ty + th);
  tower.addColorStop(0, '#e2ddca');
  tower.addColorStop(1, '#a9a595');
  g.fillStyle = tower;
  g.beginPath();
  g.moveTo(tx - tw / 2, ty + th);
  g.lineTo(tx - tw / 2, ty);
  g.lineTo(tx + tw / 2 - 18 * u, ty);
  g.quadraticCurveTo(tx + tw / 2 + 6 * u, ty + th * 0.4, tx + tw / 2 + 6 * u, ty + th);
  g.fill();
  g.fillStyle = '#1b1a17';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `bold ${30 * u}px "Arial Narrow", Arial, sans-serif`;
  g.fillText(VESSEL, tx - 12 * u, ty + th * 0.34);
  g.font = `bold ${26 * u}px "Arial Narrow", Arial, sans-serif`;
  g.fillText(HULL, tx - 12 * u, ty + th * 0.72);
  g.beginPath(); // the viewport
  g.arc(tx + tw / 2 - 22 * u, ty + th * 0.52, 9 * u, 0, 7);
  g.fill();
  g.fillStyle = '#8f8b7c'; // masts
  g.fillRect(tx - 30 * u, ty - 40 * u, 4 * u, 40 * u);
  g.fillRect(tx + 20 * u, ty - 24 * u, 7 * u, 24 * u);

  // four people on the casing
  const person = (x, tall, coat, board) => {
    const top = hy - hh - 6 * u - tall * u;
    g.fillStyle = coat;
    g.fillRect(x - 7 * u, top + 11 * u, 14 * u, tall * u - 11 * u);
    g.fillStyle = '#cfc8b2';
    g.beginPath();
    g.arc(x, top + 6 * u, 5.5 * u, 0, 7);
    g.fill();
    if (board) {
      g.fillStyle = '#ece6d2';
      g.fillRect(x + 6 * u, top + 22 * u, 11 * u, 14 * u);
    }
  };
  person(cx - 196 * u, 50, '#262420');
  person(cx - 168 * u, 46, '#3a3832');
  person(cx - 140 * u, 52, '#1c1b18');
  person(cx + 104 * u, 48, '#2e2c27', true); // one stands apart by the tower, holding a paper

  // the quay in the foreground
  g.fillStyle = '#12110f';
  g.fillRect(0, h * 0.9, w, h * 0.1);
  g.fillStyle = '#2a2823';
  g.fillRect(0, h * 0.9, w, 3 * u);

  // grain and falling-off at the corners
  for (let i = 0; i < 2600; i++) {
    const v = R() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${R() * 0.09})`;
    g.fillRect(R() * w, R() * h, 2 * u, 2 * u);
  }
  const vig = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = vig;
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(112,84,40,0.14)'; // warm tone of the paper
  g.fillRect(0, 0, w, h);
  g.restore();
}
