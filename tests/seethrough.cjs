// Free look means every angle is reachable. From the enclosed rooms the station's outer shell must
// never be visible, so this paints the shell magenta and looks for magenta.
// The dangerous angles are the ones where the end of a long wall sits just in front of the plane of
// the camera, so as well as a coarse sweep it aims precisely at those for every corner of the shell.
// Usage: node tests/seethrough.cjs   (game must be served, see README)
const { URL, launch, hook, facts } = require('./browser.cjs');

(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  await page.goto(URL);
  await hook(page);
  await page.evaluate(() => window.kestrel.setLook('cursor'));
  await page.click('#btn-new');
  await page.click('#doc-close');
  const game = await facts();
  const { bad, views } = await page.evaluate(({ powered, STN }) => {
    const k = window.kestrel,
      g = k.game;
    g.state.gen = powered;
    // the four outer walls of the station are the only pieces of wall of their thickness and height
    let shell = 0;
    k.scene.traverse((o) => {
      const p = o.isMesh && o.geometry.parameters;
      if (p && Math.abs(p.height - STN.h) < 1e-6 && (Math.abs(p.depth - STN.wall) < 1e-6 || Math.abs(p.width - STN.wall) < 1e-6)) {
        o.material = o.material.clone();
        o.material.map = null;
        o.material.color.setHex(0x000000);
        o.material.emissive.setHex(0xff00ff);
        o.material.emissiveIntensity = 4;
        shell++;
      }
    });
    if (shell < 4) return { bad: [`only ${shell} shell pieces found; the test needs updating`], views: 0 };
    const c2 = document.createElement('canvas');
    c2.width = 640;
    c2.height = 400;
    const ctx = c2.getContext('2d', { willReadFrequently: true });
    const out = [];
    // the four corners of the shell, and the two sides of the way in
    const corners = [
      [STN.x0, STN.z0],
      [STN.x1, STN.z0],
      [STN.x0, STN.z1],
      [STN.x1, STN.z1],
      [-STN.door, STN.z1 - STN.wall / 2],
      [STN.door, STN.z1 - STN.wall / 2],
    ];
    let views = 0;
    for (const node of ['corridor', 'office', 'vault']) {
      g.state.vault.open = node === 'vault';
      const [px, , pz] = k.nodes[node].pos;
      const yaws = [];
      for (let yaw = 0; yaw < 360; yaw += 15) yaws.push(yaw);
      for (const [cx, cz] of corners) {
        const bearing = (Math.atan2(cx - px, -(cz - pz)) * 180) / Math.PI,
          dist = Math.hypot(cx - px, cz - pz);
        // put the corner 0.1 to 1 m in front of the camera plane, off to either side
        for (const ahead of [0.1, 0.3, 0.6, 1]) for (const side of [-1, 1]) yaws.push(bearing + (side * (Math.acos(ahead / dist) * 180)) / Math.PI);
      }
      for (const pitch of [0])
        for (const yaw of yaws) {
          k.jump(node, 'E', yaw, pitch);
          ctx.drawImage(document.getElementById('view'), 0, 0);
          const d = ctx.getImageData(0, 0, 640, 400).data;
          let red = 0;
          for (let i = 0; i < d.length; i += 16) if (d[i] > 150 && d[i + 1] < 70 && d[i + 2] > 150) red++;
          if (red > 10) out.push(`${node} yaw ${yaw.toFixed(1)}: outer wall showing through (${red * 4} px)`);
          views++;
        }
    }
    return { bad: out, views };
  }, game);
  // Underground there is nothing outside the walls at all, so any gap shows the empty background.
  // Paint that background magenta and sweep every standing place through the whole range of view.
  const sweep = (realm) =>
    page.evaluate((realm) => {
      const k = window.kestrel,
        g = k.game,
        out = [];
      k.renderer.three.setClearColor(0xff00ff, 1);
      g.state.flags.hatchOpen = true;
      g.state.pump.drained = true;
      const c2 = document.createElement('canvas');
      c2.width = 640;
      c2.height = 400;
      const ctx = c2.getContext('2d', { willReadFrequently: true });
      let views = 0;
      for (const [node, n] of Object.entries(k.nodes)) {
        if (n.realm !== realm || n.cam) continue;
        g.state.reply.open = node === 'blastdoor' || node === 'beyond';
        for (const pitch of [-42, 0, 42]) {
          for (let yaw = 0; yaw < 360; yaw += 45) {
            k.jump(node, 'N', yaw, pitch);
            ctx.drawImage(document.getElementById('view'), 0, 0);
            const d = ctx.getImageData(0, 0, 640, 400).data;
            let hits = 0;
            for (let i = 0; i < d.length; i += 16) if (d[i] > 150 && d[i + 1] < 70 && d[i + 2] > 150) hits++;
            if (hits > 2) out.push(`${node} yaw ${yaw} pitch ${pitch}: a gap shows the void (${hits * 4} px)`);
            views++;
          }
        }
      }
      k.renderer.three.setClearColor(0x000000, 1);
      return { bad: out, views };
    }, realm);
  const voids = await sweep('below');
  const pen = await sweep('pen');
  bad.push(...voids.bad, ...pen.bad);

  await browser.close();
  if (bad.length) {
    console.log(`SEE-THROUGH FOUND in ${bad.length} views:\n` + bad.slice(0, 12).join('\n'));
    process.exit(1);
  }
  console.log(`no see-through: ${views} views checked from corridor, office and vault`);
  console.log(`no gaps underground: ${voids.views} views checked from every standing place below`);
  console.log(`no gaps in the pen: ${pen.views} views checked from every standing place there`);
})();
