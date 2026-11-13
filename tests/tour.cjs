// Visits every view and saves a screenshot of each. Usage: node tests/tour.cjs [outDir] [node,node...]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const out = process.argv[2] || path.join(__dirname, 'shots');
  const only = process.argv[3] ? process.argv[3].split(',') : null;
  const url = process.env.KESTREL_URL || 'http://localhost:4173/';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 928 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForFunction(() => window.kestrel, null, { timeout: 30000 });
  await page.waitForTimeout(500);
  if (!only) await page.screenshot({ path: path.join(out, '00-title.png') });
  await page.click('#btn-new');
  await page.click('#doc-close');
  // power everything so interiors are lit
  await page.evaluate(() => {
    const g = window.kestrel.game, s = g.state;
    s.gen.valve = true; s.gen.running = true; s.gen.choke = false;
    for (const id of ['lighting', 'ops', 'door', 'vault']) s.gen.breakers[id] = true;
    if (location.hash.includes('open')) s.vault.open = true;
  });
  const diag = process.env.KESTREL_DIAGONALS === '1';
  const views = await page.evaluate((d) => Object.entries(window.kestrel.nodes).flatMap(([id, n]) => (n.cam ? (d ? [] : [[id, null]]) : (d ? ['NE', 'SE', 'SW', 'NW', 'UP', 'DN'] : n.faces.split('')).map((f) => [id, f]))), diag);
  let i = 1;
  for (const [node, face] of views) {
    if (only && !only.includes(node)) continue;
    await page.evaluate(([n, f]) => {
      if (n === 'vault' || n === 'corridor') window.kestrel.game.state.vault.open = n === 'vault';
      const odd = { NE: [45, 0], SE: [135, 0], SW: [225, 0], NW: [315, 0], UP: [20, 40], DN: [200, -40] }[f];
      if (odd) window.kestrel.jump(n, 'N', odd[0], odd[1]);
      else window.kestrel.jump(n, f);
    }, [node, face]);
    await page.waitForTimeout(250);
    const el = await page.$('#viewwrap');
    await el.screenshot({ path: path.join(out, `${String(i++).padStart(2, '0')}-${node}${face ? '-' + face : ''}.png`) });
  }
  console.log(`saved ${i - 1} views to ${out}`);
  if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
