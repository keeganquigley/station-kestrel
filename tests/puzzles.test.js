import { describe, it, expect } from 'vitest';
import * as Gen from '../src/puzzles/generator.js';
import * as Rx from '../src/puzzles/receiver.js';
import * as Cipher from '../src/puzzles/cipher.js';
import * as Vault from '../src/puzzles/vault.js';
import { NODES, START, turn } from '../src/data/nodes.js';
import { MAST, ROOMS } from '../src/world/layout.js';

const run = (state, ...actions) =>
  actions.reduce(
    (acc, a) => {
      const r = Gen.act(acc.state, a);
      return { state: r.state, events: acc.events.concat(r.events) };
    },
    { state, events: [] },
  );

describe('generator', () => {
  const started = () => run(Gen.initial(), 'valve', 'prime', 'prime', 'prime', 'choke', 'starter', 'choke').state;

  it('starts only when the card is followed', () => {
    expect(run(Gen.initial(), 'starter').events).toContain('cough');
    expect(run(Gen.initial(), 'valve', 'prime', 'prime', 'choke', 'starter').state.running).toBe(false);
    expect(run(Gen.initial(), 'prime', 'prime', 'prime', 'choke', 'starter').state.running).toBe(false);
    expect(run(Gen.initial(), 'valve', 'prime', 'prime', 'prime', 'starter').state.running).toBe(false);
    const ok = run(Gen.initial(), 'valve', 'prime', 'prime', 'prime', 'choke', 'starter');
    expect(ok.state.running).toBe(true);
    expect(Gen.status(ok.state)).toBe('rough');
  });

  it('loses the prime after a failed start', () => {
    const r = run(Gen.initial(), 'prime', 'prime', 'prime', 'starter', 'valve', 'choke', 'starter');
    expect(r.state.running).toBe(false);
  });

  it('stalls if the fuel is shut', () => {
    const r = run(started(), 'valve');
    expect(r.state.running).toBe(false);
    expect(r.events).toContain('stall');
  });

  it('has exactly one breaker setting that carries the rated load', () => {
    const sols = Gen.solutions();
    expect(sols).toHaveLength(1);
    expect(sols[0].sort()).toEqual(['door', 'lighting', 'ops', 'vault']);
  });

  it('brings the bus up on the rated load only', () => {
    let s = started();
    expect(Gen.status(s)).toBe('hunting');
    s = run(s, 'breaker:lighting', 'breaker:ops', 'breaker:door').state;
    expect(Gen.busLive(s)).toBe(false);
    const r = run(s, 'breaker:vault');
    expect(Gen.busLive(r.state)).toBe(true);
    expect(r.events).toContain('live');
    for (const id of ['door', 'ops', 'vault', 'lighting']) expect(Gen.powered(r.state, id)).toBe(true);
    expect(Gen.powered(r.state, 'heating')).toBe(false);
  });

  it('trips everything when overloaded', () => {
    const r = run(started(), 'breaker:heating', 'breaker:ops', 'breaker:door');
    expect(r.events).toContain('trip');
    expect(Gen.load(r.state)).toBe(0);
  });

  it('does not come live while the choke is out, or with the set stopped', () => {
    const rough = run(Gen.initial(), 'valve', 'prime', 'prime', 'prime', 'choke', 'starter', 'breaker:lighting', 'breaker:ops', 'breaker:door', 'breaker:vault').state;
    expect(Gen.busLive(rough)).toBe(false);
    const stopped = run(Gen.initial(), 'breaker:lighting', 'breaker:ops', 'breaker:door', 'breaker:vault').state;
    expect(Gen.busLive(stopped)).toBe(false);
  });
});

describe('receiver', () => {
  it('reads the frequency off the schedule at the time on the stopped clock', () => {
    expect(Rx.STOPPED_CLOCK).toBe('16:50');
    expect(Rx.TARGET_KHZ).toBe(6990);
    expect(Rx.slotFor('03:59')).toBe(4620);
    expect(Rx.slotFor('23:10')).toBe(3810);
  });

  it('the schedule is reachable with the three knobs and has no duplicate frequency', () => {
    const fs = Rx.SCHEDULE.map((r) => r[2]);
    expect(new Set(fs).size).toBe(fs.length);
    for (const f of fs) {
      expect(f % 10).toBe(0);
      expect(f).toBeGreaterThanOrEqual(Rx.MIN_KHZ);
      expect(f).toBeLessThanOrEqual(Rx.MAX_KHZ);
    }
  });

  it('locks only with both the frequency and the bearing right', () => {
    let s = Rx.initial();
    expect(Rx.reception(s)).toBe('none');
    s = Rx.tune(Rx.tune(Rx.tune(s, 1000), 1000), -10);
    expect(s.khz).toBe(6990);
    expect(Rx.reception(s)).toBe('faint');
    for (let i = 0; i < 11; i++) s = Rx.rotate(s, Rx.BEARING_STEP);
    expect(s.bearing).toBe(Rx.TARGET_BEARING);
    expect(Rx.reception(s)).toBe('locked');
    expect(Rx.signal(s)).toBe(1);
    expect(Rx.reception(Rx.tune(s, 10))).toBe('near');
  });

  it('signal falls away as the mast turns off the bearing', () => {
    const on = { khz: Rx.TARGET_KHZ, bearing: Rx.TARGET_BEARING, printed: false };
    expect(Rx.signal(Rx.rotate(on, 10))).toBeLessThan(Rx.signal(on));
    expect(Rx.signal(Rx.rotate(on, 90))).toBeLessThan(Rx.signal(Rx.rotate(on, 10)));
  });

  it('prints once, needs power, and stays printed', () => {
    const on = { khz: Rx.TARGET_KHZ, bearing: Rx.TARGET_BEARING, printed: false };
    expect(Rx.settle(on, false).printed).toBe(false);
    const p = Rx.settle(on, true);
    expect(p.printed).toBe(true);
    expect(Rx.settle(Rx.tune(p, 500), true).printed).toBe(true);
  });

  it('clamps the dial and wraps the bearing', () => {
    expect(Rx.tune(Rx.initial(), -99999).khz).toBe(Rx.MIN_KHZ);
    expect(Rx.tune(Rx.initial(), 99999).khz).toBe(Rx.MAX_KHZ);
    expect(Rx.rotate({ bearing: 350 }, 10).bearing).toBe(0);
    expect(Rx.rotate({ bearing: 0 }, -10).bearing).toBe(350);
    expect(Rx.formatKhz(6990)).toBe('6.990');
  });

  it('the charted bearing really does run from the mast through the vault', () => {
    const vx = (ROOMS.vault.x0 + ROOMS.vault.x1) / 2,
      vz = (ROOMS.vault.z0 + ROOMS.vault.z1) / 2;
    const bearing = (Math.atan2(vx - MAST.x, -(vz - MAST.z)) * 180) / Math.PI;
    expect(Math.abs(bearing - Rx.TARGET_BEARING)).toBeLessThan(2);
  });
});

describe('cipher', () => {
  it('the printed groups decipher to the date, the year and the combination on the named sheet', () => {
    expect(Cipher.decipher(Cipher.CIPHER, Cipher.SHEET)).toEqual(['1411', '1996', Cipher.COMBINATION]);
  });

  it('no other sheet gives the combination', () => {
    for (const n of Object.keys(Cipher.PAD).map(Number)) {
      if (n !== Cipher.SHEET) expect(Cipher.decipher(Cipher.CIPHER, n)[2]).not.toBe(Cipher.COMBINATION);
    }
  });

  it('works figure by figure without carrying, as the pad says', () => {
    expect(Cipher.sub('2', '8')).toBe('4');
    expect(Cipher.add('9', '9')).toBe('8');
    expect(Cipher.sub(Cipher.add('7302', '9360'), '9360')).toBe('7302');
  });

  it('every sheet has three four-figure groups', () => {
    expect(Object.keys(Cipher.PAD)).toHaveLength(12);
    for (const groups of Object.values(Cipher.PAD)) {
      expect(groups).toHaveLength(3);
      for (const g of groups) expect(g).toMatch(/^\d{4}$/);
    }
  });
});

describe('vault', () => {
  const set = (code) =>
    code.split('').reduce((s, d, i) => {
      for (let k = 0; k < Number(d); k++) s = Vault.spin(s, i, 1);
      return s;
    }, Vault.initial());

  it('opens on the combination with power', () => {
    expect(Vault.tryHandle(set(Cipher.COMBINATION), true).result).toBe('open');
  });
  it('stays shut without power or with the wrong number', () => {
    expect(Vault.tryHandle(set(Cipher.COMBINATION), false).result).toBe('dead');
    expect(Vault.tryHandle(set('7303'), true).result).toBe('wrong');
    expect(Vault.tryHandle(Vault.initial(), true).result).toBe('wrong');
  });
  it('wheels wrap both ways and freeze once open', () => {
    expect(Vault.spin(Vault.initial(), 0, -1).wheels[0]).toBe(9);
    const open = Vault.tryHandle(set(Cipher.COMBINATION), true).state;
    expect(Vault.spin(open, 0, 1).wheels).toEqual(open.wheels);
  });
});

describe('node graph', () => {
  const targets = (n) => {
    const out = [];
    for (const l of Object.values(n.fwd || {})) out.push(typeof l === 'string' ? l : l.to);
    if (n.back) out.push(n.back[0]);
    return out;
  };

  it('every link points at a real node and every close-up has a way back', () => {
    for (const [id, n] of Object.entries(NODES)) {
      for (const t of targets(n)) expect(NODES[t], `${id} -> ${t}`).toBeTruthy();
      if (n.cam) {
        expect(n.back, id).toBeTruthy();
        expect(NODES[n.back[0]].faces).toContain(n.back[1]);
      } else {
        for (const f of Object.keys(n.fwd)) expect(n.faces, `${id} faces ${f}`).toContain(f);
      }
    }
  });

  it('you can walk back out of every standing place', () => {
    // close-ups are entered through hotspots, so only check that walking nodes form one connected set
    const walk = Object.keys(NODES).filter((id) => !NODES[id].cam);
    const seen = new Set([START.node]);
    const queue = [START.node];
    while (queue.length) for (const t of targets(NODES[queue.pop()])) if (!seen.has(t)) (seen.add(t), queue.push(t));
    for (const id of walk) expect(seen.has(id), id).toBe(true);
    for (const id of walk) {
      const back = new Set([id]);
      const q = [id];
      while (q.length) for (const t of targets(NODES[q.pop()])) if (!back.has(t)) (back.add(t), q.push(t));
      expect(back.has(START.node), `${id} can reach the jetty`).toBe(true);
    }
  });

  it('turning cycles through the facings a node allows', () => {
    expect(turn('yard', 'N', 1)).toBe('E');
    expect(turn('yard', 'N', -1)).toBe('W');
    expect(turn('corridor', 'E', 1)).toBe('W');
    expect(turn('corridor', 'E', -1)).toBe('W');
  });
});
