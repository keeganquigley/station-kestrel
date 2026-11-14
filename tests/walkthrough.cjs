// Plays the whole demo in a real browser: keyboard to walk, real mouse clicks on every object.
// Needs the game served somewhere (npm run build && npm run preview) and Playwright available.
// Usage: node tests/walkthrough.cjs [screenshotDir]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = process.env.KESTREL_URL || 'http://localhost:4173/';
const shots = process.argv[2] || null;

(async () => {
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 928 } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  let step = 0;
  const log = (msg) => console.log(`  ${String(++step).padStart(2)}. ${msg}`);
  const fail = (msg) => {
    throw new Error(msg);
  };
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(window.kestrel.game.state)));
  const caption = () => page.textContent('#caption');
  // wait for any glide or turn to finish before the next input
  const settle = async () => {
    await page.waitForFunction(() => !window.kestrel.busy(), null, { timeout: 10000 });
    await page.waitForTimeout(40);
  };
  const ready = async () => {
    await page.waitForFunction(() => window.kestrel, null, { timeout: 30000 });
    await page.evaluate(() => (window.kestrel.timeScale = 0.3));
  };
  const shot = async (name) => shots && (await (await page.$('#stage')).screenshot({ path: path.join(shots, name + '.png') }));

  const expectAt = async (node, facing) => {
    const s = await state();
    if (s.node !== node || (facing && s.facing !== facing)) fail(`expected to be at ${node}${facing ? ' facing ' + facing : ''}, but at ${s.node} facing ${s.facing}`);
  };
  const key = async (k) => {
    await page.keyboard.press(k);
    await settle();
  };
  const fwd = () => key('ArrowUp');
  const left = () => key('ArrowLeft');
  const right = () => key('ArrowRight');
  const back = () => key('ArrowDown');
  const YAW = { N: 0, E: 90, S: 180, W: 270 };
  const face = async (f) => {
    for (let i = 0; i < 8 && (await state()).yaw !== YAW[f]; i++) await right();
    if ((await state()).yaw !== YAW[f]) fail(`cannot face ${f} at ${(await state()).node}`);
  };

  /** Real mouse click at a fraction of the 3D view. */
  const clickView = async (x, y) => {
    const box = await (await page.$('#view')).boundingBox();
    await page.mouse.click(box.x + x * box.width, box.y + y * box.height);
    await settle();
  };
  /** Real mouse click on a hotspot, found by projecting the object to the screen. */
  const use = async (id, dir = 0) => {
    const p = await page.evaluate(([i, d]) => window.kestrel.point(i, d), [id, dir]);
    if (!p) fail(`hotspot "${id}"${dir ? ' (dir ' + dir + ')' : ''} cannot be clicked from ${(await state()).node}/${(await state()).facing}`);
    await clickView(p.x, p.y);
  };
  const docOpen = () => page.evaluate(() => !document.getElementById('doc').hidden);
  const readAndClose = async (expectText) => {
    if (!(await docOpen())) fail('expected a paper to be open');
    const txt = await page.innerText('#doc-paper');
    if (expectText && !txt.includes(expectText)) fail(`paper does not contain "${expectText}"`);
    await page.click('#doc-close');
    await settle();
    return txt;
  };

  try {
    await page.goto(URL);
    await ready();
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await ready();

    // --- title
    if (await page.isVisible('#btn-continue')) fail('Continue offered with no save');
    if (!(await page.innerText('#title')).includes('Holland Island')) fail('title should say Holland Island');
    await shot('01-title');
    await page.click('#btn-new');
    if ((await readAndClose('FIELD INSTRUCTION 96/311')).includes('Hollund')) fail('old spelling in the orders');
    await expectAt('jetty', 'N');
    log('new game starts on the jetty with the orders in hand');
    await shot('02-jetty');

    // --- dragging looks around and is not mistaken for a click
    {
      const box = await (await page.$('#view')).boundingBox();
      const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 80, cy + 30, { steps: 4 });
      await page.mouse.move(cx + 160, cy + 60, { steps: 4 });
      await page.mouse.up();
      await settle();
      const s = await state();
      if (s.node !== 'jetty') fail('a drag should not walk anywhere');
      if (!(s.yaw > 340 && s.yaw < 356)) fail('drag right should swing the view left by about ten degrees, yaw is ' + s.yaw);
      if (!(s.pitch > 0)) fail('drag down should tip the view up, pitch is ' + s.pitch);
      await shot('02b-looking-around');
      await left();
      if ((await state()).yaw !== 315) fail('left arrow should stop at 315, got ' + (await state()).yaw);
      await right();
      await expectAt('jetty', 'N');
      if ((await state()).yaw !== 0) fail('arrow keys should snap back onto north');
      log('dragging looks around; arrow keys turn in 45 degree stops');
    }

    // --- mouse navigation: edges turn, middle walks
    await clickView(0.95, 0.5);
    await expectAt('jetty', 'E');
    await clickView(0.05, 0.5);
    await expectAt('jetty', 'N');
    await use('crates');
    if (!(await caption()).includes('September')) fail('crates caption missing');
    await clickView(0.5, 0.3);
    await expectAt('path', 'N');
    await use('sign');
    await clickView(0.5, 0.75);
    await expectAt('yard', 'N');
    log('edge clicks turn, centre clicks walk, look-hotspots caption');

    // --- the door is dead without power
    await fwd();
    await expectAt('door', 'N');
    await use('door');
    if (!(await caption()).includes('No power')) fail('dead door should say so');
    await fwd();
    await expectAt('door', 'N');
    log('station door refuses without power');
    await shot('03-door-dead');

    // --- plant shed: start the set
    await face('S');
    await fwd();
    await face('E');
    await fwd();
    await fwd();
    await expectAt('shed', 'E');
    await use('genset');
    await expectAt('gen');
    await use('starter');
    if ((await state()).gen.running) fail('started without following the card');
    await use('valve');
    for (let i = 0; i < 3; i++) await use('primer');
    await use('choke');
    await use('starter');
    if (!(await state()).gen.running) fail('generator should be running');
    if (!(await caption()).includes('rough')) fail('starting should say she runs rough');
    await shot('04a-generator-choke-out');
    // leave the choke out and try the breakers: the game should say why the bus stays dark
    await back();
    await face('N');
    await use('panel');
    await use('breaker-lighting');
    if (!(await caption()).includes('choke is still out')) fail('breaker panel should mention the choke: ' + (await caption()));
    await use('breaker-lighting');
    await back();
    await face('E');
    await use('genset');
    await use('choke');
    if ((await state()).gen.choke) fail('choke should be home');
    if (!(await caption()).startsWith('Choke home')) fail('pushing the choke in should say so: ' + (await caption()));
    await shot('04-generator');
    await use('choke');
    if (!(await state()).gen.choke || !(await caption()).startsWith('Choke out')) fail('pulling the choke out again should say so: ' + (await caption()));
    await use('choke');
    if ((await state()).gen.choke || !(await caption()).startsWith('Choke home')) fail('choke should go home again');
    log('generator starts only by the card; the choke says where it is');
    await clickView(0.5, 0.95); // bottom edge steps back
    await expectAt('shed', 'E');

    // --- breakers: overload trips, exact load brings the bus up
    await face('N');
    await use('govnote');
    await readAndClose('dead on 40 amps');
    await use('panel');
    await expectAt('breakers');
    for (const id of ['heating', 'ops', 'door']) await use('breaker-' + id);
    if (Object.values((await state()).gen.breakers).some(Boolean)) fail('overload should trip every breaker');
    for (const id of ['lighting', 'ops', 'door', 'vault']) await use('breaker-' + id);
    const live = await page.evaluate(() => window.kestrel.game.state.gen);
    if (!(live.breakers.lighting && live.breakers.ops && live.breakers.door && live.breakers.vault)) fail('breakers not set');
    if (!(await caption()).includes('green')) fail('bus should be live: ' + (await caption()));
    await shot('05-breakers');
    log('overload trips the board; exactly 40 A brings the bus up');
    await back();

    // --- card and key
    await face('S');
    await use('card');
    await readAndClose('COLD START');
    await use('key');
    if (!(await state()).inv.includes('key')) fail('key not taken');
    if (await page.evaluate(() => window.kestrel.point('key'))) fail('key hotspot should be gone');
    log('cold start card read, C.O. key taken');

    // --- mast
    await face('W');
    await fwd();
    await fwd();
    await fwd();
    await expectAt('field', 'W');
    await use('mastbase');
    await expectAt('mast');
    await use('crank', -1);
    if ((await state()).rx.bearing !== 290) fail('crank left should turn anticlockwise');
    for (let i = 0; i < 12; i++) await use('crank', 1);
    if ((await state()).rx.bearing !== 50) fail('bearing should be 050, is ' + (await state()).rx.bearing);
    await shot('06-mast');
    log('mast cranked both ways and set to 050');
    await back();
    await expectAt('field', 'W');

    // --- into the station
    await face('E');
    await fwd();
    await face('N');
    await fwd();
    await fwd();
    await expectAt('vestibule', 'N');
    await face('W');
    await use('noticeboard');
    await readAndClose('WATCH BILL');
    await face('E');
    await use('coats');
    await face('N');
    await fwd();
    await expectAt('ops', 'N');
    await use('clock');
    if (!(await caption()).includes('16:50')) fail('clock caption');
    await use('logbook');
    await readAndClose('6,990 kHz');
    log('door opens under power; notice board, clock and log read');
    await shot('07-ops');

    // --- receiver
    await use('console');
    await expectAt('console');
    await use('printout');
    if (!(await caption()).includes('Blank')) fail('paper should be blank before lock');
    await use('knob-1000', 1);
    await use('knob-1000', 1);
    await use('knob-100', 1);
    await use('knob-100', -1);
    if ((await state()).rx.khz !== 7000) fail('expected 7.000, got ' + (await state()).rx.khz);
    if ((await state()).rx.printed) fail('should not print off frequency');
    await use('knob-10', -1);
    const rx = (await state()).rx;
    if (rx.khz !== 6990 || !rx.printed) fail('receiver should lock and print at 6.990: ' + JSON.stringify(rx));
    await page.waitForTimeout(300);
    await shot('08-console-locked');
    await use('printout');
    const printed = await readAndClose('SHEET 09');
    if (!(await state()).inv.includes('printout')) fail('printout not taken');
    const groups = printed.match(/\b\d{4} \d{4} \d{4}\b/)[0].split(' ');
    log('receiver locks at 6.990 on bearing 050 and prints ' + groups.join(' '));
    await back();

    // --- save and resume
    // leave the view at an odd angle so the save has something particular to restore
    await page.evaluate(() => window.kestrel.jump('ops', 'N', 33, -7));
    await left();
    await right();
    if ((await state()).yaw !== 45) fail('expected yaw 45 before reload');
    await page.reload();
    await ready();
    if (!(await page.isVisible('#btn-continue'))) fail('Continue should be offered after a reload');
    await page.click('#btn-continue');
    await settle();
    const resumed = await state();
    if (resumed.node !== 'ops' || resumed.yaw !== 45) fail('save did not restore where you were looking: ' + resumed.node + ' ' + resumed.yaw);
    if (!resumed.rx.printed || !resumed.inv.includes('key') || !resumed.gen.running) fail('save did not restore progress');
    log('reload offers Continue and restores place, inventory and machines');

    // --- office
    await face('W');
    await fwd();
    await expectAt('office', 'W');
    await use('memo-vault');
    await readAndClose('third group');
    await use('photo');
    await use('drawer');
    if (!(await state()).flags.drawerOpen) fail('drawer should open with the key');
    await shot('09-office');
    await use('drawer');
    const padText = await readAndClose('ONE-TIME KEY');
    await face('N');
    await use('chart');
    await shot('10-chart');
    await readAndClose();
    await use('memo-tri');
    await readAndClose('Read the ring');
    await face('S');
    await use('binders');
    // decipher the way a player would: sheet 09 row from the pad, figure by figure
    const row = padText.match(/(?:^|\n)\s*09\s+(\d{4})\s+(\d{4})\s+(\d{4})/).slice(1);
    const plain = groups.map((g, i) => g.split('').map((d, k) => (Number(d) - Number(row[i][k]) + 10) % 10).join(''));
    if (plain[0] !== '1411' || plain[1] !== '1996') fail('deciphered message wrong: ' + plain.join(' '));
    log(`pad sheet 09 deciphers the printout to ${plain.join(' ')}`);

    // --- vault
    await face('E');
    await fwd();
    await fwd();
    await expectAt('corridor', 'E');
    await fwd();
    await expectAt('corridor', 'E');
    await use('vaultdoor');
    await expectAt('vaultlock');
    await use('vaulthandle');
    if ((await state()).vault.open) fail('vault opened on 0000');
    await use('wheel-0', -1);
    if ((await state()).vault.wheels[0] !== 9) fail('wheel down should give 9');
    await use('wheel-0', 1);
    for (let i = 0; i < 4; i++) for (let k = 0; k < Number(plain[2][i]); k++) await use('wheel-' + i, 1);
    if ((await state()).vault.wheels.join('') !== plain[2]) fail('wheels read ' + (await state()).vault.wheels.join(''));
    await shot('11-vaultlock');
    await use('vaulthandle');
    if (!(await state()).vault.open) fail('vault should open on ' + plain[2]);
    log('vault opens on the third group, ' + plain[2]);
    await page.waitForTimeout(3200);
    await settle();
    await expectAt('corridor', 'E');
    await shot('12-vault-open');
    await fwd();
    await expectAt('vault', 'E');
    await page.waitForTimeout(600);
    await shot('13-vault');
    await use('reels');
    await use('rx2');
    await use('final');
    await shot('14-final');
    await readAndClose('THANK YOU FOR OPENING THE DOOR');
    if (!(await state()).flags.hatchOpen) fail('reading the last printout should unlatch the rack');
    if (!(await caption()).includes('unlatches')) fail('rack caption missing: ' + (await caption()));
    if (await page.isVisible('#ending')) fail('chapter one should no longer end the game');
    log('chapter one hands over: the rack swings aside');

    // ================================================================ chapter two
    await face('N');
    await page.waitForTimeout(800);
    await shot('15-way-down');
    await use('waydown');
    await settle();
    await expectAt('stairfoot', 'N');
    if (!(await caption()).includes('humming')) fail('arrival caption below missing');
    if ((await page.evaluate(() => window.kestrel.scene.getObjectByName('surface').visible))) fail('the surface should not be drawn underground');
    await shot('16-stairfoot');
    // back up the stairs and down again, on the keyboard
    await face('S');
    await fwd();
    await expectAt('vault', 'S');
    if (!(await page.evaluate(() => window.kestrel.scene.getObjectByName('surface').visible))) fail('the surface should be drawn again upstairs');
    await face('N');
    await fwd();
    await expectAt('stairfoot', 'N');
    await face('E');
    await use('plaque');
    if (!(await caption()).includes('SUBTERRANEAN STATION')) fail('plaque caption');
    await face('W');
    await use('tag-red');
    const tagRed = (await caption()).match(/stamped T(\d)/)[1];
    log('the stairs fade both ways; plaque and the first cable tag read');

    // --- the water stops you
    await face('N');
    await fwd();
    await fwd();
    await fwd();
    await expectAt('brink', 'N');
    await fwd();
    await expectAt('brink', 'N');
    await use('water');
    if (!(await caption()).includes('Black water')) fail('water caption');
    await shot('17-brink-flooded');
    await face('S');
    await fwd();
    await expectAt('tunnelB', 'S');
    await face('W');
    await use('rackzoom');
    await expectAt('rack');
    await use('tag-yellow');
    const tagYellow = (await caption()).match(/stamped T(\d)/)[1];
    await use('cables');
    await shot('18-cable-tag');
    await back();
    log('flooded passage blocks the way; the yellow tag reads T' + tagYellow);

    // --- bunk room: four notebooks
    await face('E');
    await fwd();
    await expectAt('bunks', 'E');
    await use('lockers');
    await face('N');
    await use('nb-harlan');
    await readAndClose('not prisoners');
    await use('nb-voss');
    await readAndClose('on the air');
    await shot('19-bunks');
    await face('S');
    await use('nb-lund');
    const lund = await readAndClose('feed tank');
    const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
    const charge = WORDS.indexOf(lund.match(/wants (\w+) gallons/)[1]);
    const feedSize = Number(lund.match(/feed tank is the (\d)/)[1]);
    await use('nb-okafor');
    await readAndClose('no carrying');
    await face('W');
    await fwd();
    await face('S');
    await fwd();
    await expectAt('tunnelA', 'S');
    log(`notebooks read: the siphon wants ${charge} gallons in the ${feedSize}`);

    // --- break room: the cable schedule
    await face('W');
    await fwd();
    await expectAt('mess', 'W');
    await use('darts');
    await use('armchairs');
    await face('N');
    await use('records');
    await face('S');
    await use('calendar');
    await use('cards');
    await use('schedule');
    await shot('20-schedule');
    const sched = await readAndClose('CABLE SCHEDULE');
    const wiring = {};
    for (const m of sched.matchAll(/(RED|BLUE|GREEN|YELLOW|WHITE)[\s.]+T(\d)/g)) wiring[m[1].toLowerCase()] = Number(m[2]);
    if (Object.keys(wiring).length !== 3) fail('the schedule should give exactly three cores, gave ' + JSON.stringify(wiring));
    if (wiring.red !== Number(tagRed)) fail('the red tag should agree with the schedule');
    wiring.yellow = Number(tagYellow);
    wiring.white = [1, 2, 3, 4, 5].find((t) => !Object.values(wiring).includes(t));
    await face('E');
    await fwd();
    await fwd();
    await expectAt('kitchen', 'E');
    log('schedule gives three cores, the tag a fourth, leaving ' + JSON.stringify(wiring));

    // --- kitchen: prime the pump
    await face('S');
    await use('rota');
    await readAndClose('GALLEY ROTA');
    await use('ledger');
    await readAndClose('Four mugs');
    await use('table');
    await face('N');
    await use('hooks');
    await use('range');
    await face('E');
    await use('pumpzoom');
    await expectAt('pump');
    await shot('21-pump');
    await use('prime');
    if (!(await caption()).includes('charge is lost')) fail('priming with the wrong charge should fail');
    {
      // work it out as a player would: search the pours for the charge in the feed tank
      const cap = [8, 5, 3], valves = [[0, 1], [1, 2], [0, 2]], feed = cap.indexOf(feedSize);
      const start = (await state()).pump.levels;
      const seen = new Set([start.join()]);
      let frontier = [{ l: start, path: [] }], found = null;
      while (frontier.length && !found) {
        const next = [];
        for (const { l, path: p } of frontier) {
          if (l[feed] === charge) { found = p; break; }
          valves.forEach(([a, b], v) => {
            for (const dir of [-1, 1]) {
              const [from, to] = dir < 0 ? [b, a] : [a, b];
              const moved = Math.min(l[from], cap[to] - l[to]);
              if (!moved) continue;
              const n = l.slice();
              n[from] -= moved;
              n[to] += moved;
              if (!seen.has(n.join())) { seen.add(n.join()); next.push({ l: n, path: p.concat([[v, dir]]) }); }
            }
          });
        }
        frontier = next;
      }
      if (!found) fail('no way to measure the charge');
      for (const [v, dir] of found) await use('valve-' + v, dir);
      if ((await state()).pump.levels[feed] !== charge) fail('tanks read ' + (await state()).pump.levels);
      await shot('22-pump-measured');
      await use('prime');
      if (!(await state()).pump.drained) fail('the pump should be running');
      log(`pump primed in ${found.length} turns of a valve; the water falls`);
    }
    await back();

    // --- across the drained passage to the junction box
    await face('W');
    await fwd();
    await face('N');
    await fwd();
    await fwd();
    await fwd();
    await expectAt('junction', 'N');
    await shot('23-lower-level');
    await face('W');
    await use('jboxzoom');
    await expectAt('jbox');
    await use('isolator');
    if (!(await caption()).includes('wrong terminal')) fail('isolator should refuse the wrong wiring');
    await use('core-red', -1);
    if ((await state()).junction.sel.red !== 5) fail('selector down from 1 should give 5');
    await use('core-red', 1);
    for (const [core, terminal] of Object.entries(wiring)) for (let i = 1; i < terminal; i++) await use('core-' + core, 1);
    await shot('24-junction');
    await use('isolator');
    if (!(await state()).junction.live) fail('line should be live with ' + JSON.stringify((await state()).junction.sel));
    log('junction wired from the clues; the line is live');
    await back();

    // --- the door asks, and is answered
    await face('N');
    await fwd();
    await expectAt('blastdoor', 'N');
    await use('enddoor');
    if (!(await caption()).includes('END OF WORKS')) fail('door caption');
    await fwd();
    await expectAt('blastdoor', 'N');
    await face('E');
    await use('senderzoom');
    await expectAt('sender');
    await use('doorprint');
    const asked = await readAndClose('REPLY');
    const sheet = asked.match(/SHEET (\d\d)/)[1];
    await use('send');
    if (!(await caption()).includes('crosses')) fail('a wrong reply should be refused');
    const key = padText.match(new RegExp('(?:^|\\n)\\s*' + sheet + '\\s+(\\d{4})\\s+(\\d{4})')).slice(1);
    const reply = [plain[0], plain[1]].map((g, i) => g.split('').map((d, k) => (Number(d) + Number(key[i][k])) % 10).join('')).join('');
    await use('rwheel-0', -1);
    if ((await state()).reply.wheels[0] !== 9) fail('reply wheel down should give 9');
    await use('rwheel-0', 1);
    for (let i = 0; i < 8; i++) for (let k = 0; k < Number(reply[i]); k++) await use('rwheel-' + i, 1);
    await shot('25-sender');
    await use('send');
    if (!(await state()).reply.open) fail('the door should open on ' + reply);
    log(`door named sheet ${sheet}; ${plain[0]} ${plain[1]} enciphered to ${reply} opens it`);
    await page.waitForTimeout(3300);
    await settle();
    await expectAt('blastdoor', 'N');
    await page.waitForTimeout(400);
    await shot('26-door-open');

    // --- a reload down here resumes down here
    await page.reload();
    await ready();
    await page.click('#btn-continue');
    await settle();
    const below = await state();
    if (below.node !== 'blastdoor' || !below.reply.open || !below.pump.drained || !below.junction.live) fail('save did not restore chapter two');
    if (await page.evaluate(() => window.kestrel.scene.getObjectByName('surface').visible)) fail('resuming below should draw the lower realm');
    await use('mugs');
    if (!(await caption()).includes('Four enamel mugs')) fail('mugs caption');
    log('reload resumes underground with all three puzzles solved');

    // --- through the door
    await face('N');
    await fwd();
    await expectAt('beyond', 'N');
    await page.waitForTimeout(1500);
    await shot('27-beyond');
    await page.waitForSelector('#ending:not([hidden])', { timeout: 20000 });
    if (!(await page.innerText('#ending')).toLowerCase().includes('chapter two')) fail('ending card should say chapter two');
    await shot('28-ending');
    log('ending plays');
    await page.click('#btn-again');
    if (!(await page.isVisible('#btn-new'))) fail('title should return after the ending');
    if (await page.isVisible('#btn-continue')) fail('a finished game should not offer Continue');

    // --- a save from the old one-level demo, finished: it should reopen in the vault with the way down open
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('station-kestrel-save-v1'));
      for (const k of ['pump', 'junction', 'reply', 'yaw', 'pitch']) delete s[k];
      s.node = 'vault';
      s.facing = 'E';
      s.flags = { vaultSeen: true, keyTaken: true, drawerOpen: true, doorOpened: true, finished: true };
      localStorage.setItem('station-kestrel-save-v1', JSON.stringify(s));
    });
    await page.reload();
    await ready();
    if (!(await page.isVisible('#btn-continue'))) fail('an old finished save should offer Continue');
    await page.click('#btn-continue');
    await settle();
    const old = await state();
    if (old.node !== 'vault' || !old.flags.hatchOpen || !old.pump || old.pump.drained) fail('old save did not carry over: ' + JSON.stringify(old.flags));
    await face('N');
    if (!(await page.evaluate(() => window.kestrel.point('waydown')))) fail('the way down should be open in an old finished save');
    log('a finished save from the old demo reopens in the vault with the way down open');

    // --- notebook
    await page.reload();
    await ready();
    await page.click('#btn-new');
    await page.click('#doc-close');
    await page.click('#btn-notes');
    if (!(await page.textContent('#doc-paper')).includes('NOTEBOOK')) fail('notebook did not open');
    await page.click('#doc-paper button[data-open="orders"]');
    await readAndClose('FIELD INSTRUCTION');
    await page.click('#doc-close');
    log('notebook lists and reopens papers');

    // --- every hotspot in the scene must be clickable from somewhere it claims to be
    const audit = await page.evaluate(() => {
      const k = window.kestrel, g = k.game, missing = [], ids = [];
      g.state.gen = { valve: true, primes: 0, choke: false, running: true, breakers: { lighting: true, heating: false, ops: true, door: true, vault: true, deice: false } };
      g.state.flags.hatchOpen = true;
      g.state.pump.drained = true;
      const hots = [];
      const walk = (o) => {
        if (o.userData && o.userData.hot) hots.push(o.userData.hot);
        o.children.forEach(walk);
      };
      let scene = null;
      // find the scene by walking up from any hotspot the engine can find
      scene = k.scene;
      walk(scene);
      for (const h of hots) {
        if (['door', 'vaultdoor', 'water', 'enddoor'].includes(h.id)) continue; // these switch themselves off once passed; exercised above
        ids.push(h.id);
        let ok = false;
        for (const n of h.nodes) {
          const node = k.nodes[n];
          for (const f of node.cam ? [null] : node.faces.split('')) {
            g.state.vault.open = n === 'vault';
            g.state.reply.open = n === 'beyond' || h.id === 'mugs'; // the mugs are behind the door until it opens
            k.jump(n, f);
            if (k.point(h.id, h.dir ? 1 : 0) && (!h.dir || k.point(h.id, -1))) ok = true;
          }
        }
        if (!ok) missing.push(h.id);
      }
      return { count: ids.length, missing };
    });
    if (audit.missing.length) fail('hotspots that cannot be clicked: ' + audit.missing.join(', '));
    log(`all ${audit.count} other hotspots are clickable from the views they belong to`);

    if (errors.length) fail('browser console errors:\n' + errors.join('\n'));
    console.log('\nWALKTHROUGH PASSED');
    await browser.close();
  } catch (e) {
    console.error('\nWALKTHROUGH FAILED at step ' + (step + 1) + ': ' + e.message);
    if (errors.length) console.error('console errors:\n' + errors.join('\n'));
    if (shots) await page.screenshot({ path: path.join(shots, 'FAILED.png') });
    await browser.close();
    process.exit(1);
  }
})();
