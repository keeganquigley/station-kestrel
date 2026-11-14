// The direction-finding chart on the office wall. Drawn from the real layout,
// so the pencilled line genuinely runs from the mast through the vault.
import { MAST, SHED, STN, ROOMS } from '../world/layout.js';
import { terrainH } from '../world/terrain.js';
import { TARGET_BEARING } from '../puzzles/receiver.js';

export function drawChart(g, W, H) {
  const scale = W / 96; // pixels per metre
  const ox = W * 0.47, oy = H * 0.5;
  const X = (x) => ox + x * scale;
  const Y = (z) => oy + (z + 4) * scale;

  g.fillStyle = '#ddd6bb';
  g.fillRect(0, 0, W, H);
  // sea tint and coastline, sampled from the height field
  const step = 3;
  for (let py = 0; py < H; py += step) {
    for (let px = 0; px < W; px += step) {
      const h = terrainH((px - ox) / scale, (py - oy) / scale - 4);
      if (h < 0) g.fillStyle = '#b9c7c4';
      else if (h < 0.35) g.fillStyle = '#5d6660';
      else if (h > 6) g.fillStyle = '#cbbf9c';
      else continue;
      g.fillRect(px, py, step, step);
    }
  }
  // graticule
  g.strokeStyle = 'rgba(60,70,90,0.25)';
  g.lineWidth = 1;
  for (let x = 0; x < W; x += W / 8) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.stroke();
  }
  for (let y = 0; y < H; y += W / 8) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  const ink = '#1f2430';
  const label = (s, x, y, size = 0.021, color = ink, align = 'left') => {
    g.font = `bold ${Math.round(W * size)}px "Arial Narrow", Arial, sans-serif`;
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = 'middle';
    g.fillText(s, x, y);
  };
  // buildings
  g.fillStyle = ink;
  g.fillRect(X(STN.x0), Y(STN.z0), (STN.x1 - STN.x0) * scale, (STN.z1 - STN.z0) * scale);
  g.fillRect(X(SHED.x0), Y(SHED.z0), (SHED.x1 - SHED.x0) * scale, (SHED.z1 - SHED.z0) * scale);
  g.fillRect(X(-1.3), Y(25), 2.6 * scale, 17 * scale);
  label('STATION', X(STN.x0), Y(STN.z0) - W * 0.016);
  label('PLANT', X(SHED.x1) + 6, Y(6));
  label('JETTY', X(2.5), Y(38));
  // the mast and its bearing ring
  const mx = X(MAST.x), my = Y(MAST.z), r = W * 0.15;
  g.strokeStyle = ink;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(mx, my, r, 0, 7);
  g.stroke();
  for (let deg = 0; deg < 360; deg += 10) {
    const a = ((deg - 90) * Math.PI) / 180, major = deg % 30 === 0;
    g.lineWidth = major ? 2.5 : 1.2;
    g.beginPath();
    g.moveTo(mx + Math.cos(a) * r, my + Math.sin(a) * r);
    g.lineTo(mx + Math.cos(a) * r * (major ? 1.12 : 1.06), my + Math.sin(a) * r * (major ? 1.12 : 1.06));
    g.stroke();
    if (major) label(String(deg).padStart(3, '0'), mx + Math.cos(a) * r * 1.27, my + Math.sin(a) * r * 1.27, 0.02, ink, 'center');
  }
  g.fillStyle = ink;
  g.beginPath();
  g.arc(mx, my, 4, 0, 7);
  g.fill();
  label('MAST', mx - 8, my + W * 0.022, 0.02, ink, 'right');
  // the fix: one red pencil line, drawn three times over
  const b = ((TARGET_BEARING - 90) * Math.PI) / 180;
  const vx = (ROOMS.vault.x0 + ROOMS.vault.x1) / 2, vz = (ROOMS.vault.z0 + ROOMS.vault.z1) / 2;
  const reach = Math.hypot(vx - MAST.x, vz - MAST.z) * scale;
  g.strokeStyle = 'rgba(168,30,22,0.8)';
  g.lineWidth = 2;
  for (const j of [-0.006, 0, 0.007]) {
    g.beginPath();
    g.moveTo(mx, my);
    g.lineTo(mx + Math.cos(b + j) * reach * 1.25, my + Math.sin(b + j) * reach * 1.25);
    g.stroke();
  }
  g.beginPath();
  g.arc(X(vx), Y(vz), W * 0.016, 0, 7);
  g.stroke();
  label('K-7 ?', X(vx) + W * 0.024, Y(vz) - W * 0.012, 0.024, '#a81e16');
  // title block and north arrow
  g.fillStyle = '#ddd6bb';
  g.fillRect(W * 0.03, H * 0.05, W * 0.3, H * 0.13);
  g.strokeStyle = ink;
  g.lineWidth = 2;
  g.strokeRect(W * 0.03, H * 0.05, W * 0.3, H * 0.13);
  label('HOLLAND ISLAND', W * 0.045, H * 0.095, 0.03);
  label('D/F PLOT - TARGET K-7', W * 0.045, H * 0.145, 0.02);
  g.beginPath();
  g.moveTo(W * 0.93, H * 0.2);
  g.lineTo(W * 0.93, H * 0.07);
  g.lineTo(W * 0.915, H * 0.11);
  g.moveTo(W * 0.93, H * 0.07);
  g.lineTo(W * 0.945, H * 0.11);
  g.stroke();
  label('N', W * 0.93, H * 0.04, 0.026, ink, 'center');
}
