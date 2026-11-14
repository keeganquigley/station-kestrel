import { describe, it, expect } from 'vitest';
import * as Pump from '../src/puzzles/pump.js';
import * as Junction from '../src/puzzles/junction.js';
import * as Reply from '../src/puzzles/reply.js';
import * as Cipher from '../src/puzzles/cipher.js';
import { NODES } from '../src/data/nodes.js';
import { chapterTwoState } from '../src/engine/state.js';
import * as Gen from '../src/puzzles/generator.js';
import * as Rx from '../src/puzzles/receiver.js';
import * as Vault from '../src/puzzles/vault.js';
import { DOCS, ITEMS } from '../src/data/documents.js';

describe('pump', () => {
  it('can be solved, and not in fewer than six turns of a valve', () => {
    const path = Pump.solve();
    expect(path).not.toBeNull();
    expect(path.length).toBe(6);
    let s = Pump.initial();
    for (const [v, dir] of path) s = Pump.turnValve(s, v, dir).state;
    expect(s.levels[Pump.FEED]).toBe(Pump.CHARGE);
    expect(Pump.prime(s).result).toBe('drained');
  });

  it('never gains or loses water while pouring', () => {
    let s = Pump.initial();
    const total = () => s.levels.reduce((a, b) => a + b, 0);
    for (const [v, dir] of [[0, 1], [1, 1], [2, -1], [0, 1], [1, 1], [2, 1], [1, -1]]) {
      s = Pump.turnValve(s, v, dir).state;
      expect(total()).toBe(Pump.CAPACITY[0]);
      s.levels.forEach((l, i) => {
        expect(l).toBeGreaterThanOrEqual(0);
        expect(l).toBeLessThanOrEqual(Pump.CAPACITY[i]);
      });
    }
  });

  it('pours until the source is empty or the other tank is full', () => {
    const a = Pump.turnValve(Pump.initial(), 0, 1);
    expect(a.state.levels).toEqual([3, 5, 0]);
    expect(a.moved).toBe(5);
    expect(Pump.turnValve(a.state, 0, 1).moved).toBe(0);
    expect(Pump.turnValve(Pump.initial(), 0, -1).moved).toBe(0);
  });

  it('a wrong charge is lost and the tanks reset', () => {
    const s = Pump.turnValve(Pump.initial(), 0, 1).state;
    const r = Pump.prime(s);
    expect(r.result).toBe('lost');
    expect(r.state.levels).toEqual([8, 0, 0]);
    expect(r.state.drained).toBe(false);
    expect(Pump.prime(Pump.initial()).result).toBe('lost');
  });

  it('stays drained and ignores the valves afterwards', () => {
    let s = Pump.initial();
    for (const [v, dir] of Pump.solve()) s = Pump.turnValve(s, v, dir).state;
    s = Pump.prime(s).state;
    expect(Pump.prime(s).result).toBe('already');
    expect(Pump.turnValve(s, 0, 1).moved).toBe(0);
  });

  it('the charge cannot simply be read off a tank size', () => {
    expect(Pump.CAPACITY).not.toContain(Pump.CHARGE);
    expect(Pump.CHARGE).toBeLessThan(Pump.CAPACITY[Pump.FEED]);
  });
});

describe('junction', () => {
  const set = (wiring) => {
    let s = Junction.initial();
    for (const c of Junction.CORES) while (s.sel[c] !== wiring[c]) s = Junction.spin(s, c, 1);
    return s;
  };

  it('uses every terminal exactly once', () => {
    expect(Object.values(Junction.WIRING).sort()).toEqual(Junction.TERMINALS);
  });

  it('the surviving schedule and the tags settle every core', () => {
    expect(Junction.deduce()).toEqual(Junction.WIRING);
  });

  it('the schedule alone is not enough, and neither are the tags', () => {
    expect(Junction.SCHEDULE_LINES.length).toBe(3);
    const fromSchedule = new Set(Junction.SCHEDULE_LINES);
    expect(Junction.TAGGED.some((c) => !fromSchedule.has(c))).toBe(true);
    expect(Junction.TAGGED.some((c) => fromSchedule.has(c))).toBe(true); // one tag confirms the convention
  });

  it('goes live only on the true wiring', () => {
    expect(Junction.throwIsolator(Junction.initial()).result).toBe('fault');
    const swapped = { ...Junction.WIRING, yellow: Junction.WIRING.white, white: Junction.WIRING.yellow };
    expect(Junction.throwIsolator(set(swapped)).result).toBe('fault');
    const ok = Junction.throwIsolator(set(Junction.WIRING));
    expect(ok.result).toBe('live');
    expect(Junction.throwIsolator(ok.state).result).toBe('already');
    expect(Junction.spin(ok.state, 'red', 1).sel).toEqual(ok.state.sel);
  });

  it('selectors wrap both ways', () => {
    expect(Junction.spin(Junction.initial(), 'red', -1).sel.red).toBe(5);
    expect(Junction.spin(Junction.spin(Junction.initial(), 'red', -1), 'red', 1).sel.red).toBe(1);
  });
});

describe('reply', () => {
  const set = (code) => code.split('').reduce((s, d, i) => {
    for (let k = 0; k < Number(d); k++) s = Reply.spin(s, i, 1);
    return s;
  }, Reply.initial());

  it('wants the date from chapter one, enciphered on the sheet it names', () => {
    expect(Reply.MESSAGE).toEqual(['1411', '1996']);
    expect(Reply.EXPECTED).toMatch(/^\d{8}$/);
    const groups = [Reply.EXPECTED.slice(0, 4), Reply.EXPECTED.slice(4)];
    expect(groups.map((g, i) => Cipher.sub(g, Cipher.PAD[Reply.CHALLENGE_SHEET][i]))).toEqual(Reply.MESSAGE);
  });

  it('names a different sheet from the broadcast, so the old groups will not do', () => {
    expect(Reply.CHALLENGE_SHEET).not.toBe(Cipher.SHEET);
    expect(Reply.EXPECTED).not.toBe(Cipher.CIPHER.slice(0, 2).join(''));
    expect(Reply.EXPECTED).not.toBe(Reply.MESSAGE.join(''));
  });

  it('opens only with the line live and the right figures', () => {
    expect(Reply.send(set(Reply.EXPECTED), false).result).toBe('dead');
    expect(Reply.send(set(Reply.MESSAGE.join('')), true).result).toBe('wrong');
    const ok = Reply.send(set(Reply.EXPECTED), true);
    expect(ok.result).toBe('open');
    expect(Reply.send(ok.state, true).result).toBe('already');
    expect(Reply.spin(ok.state, 0, 1).wheels).toEqual(ok.state.wheels);
  });
});

describe('the Subterranean Station on the map', () => {
  const below = Object.entries(NODES).filter(([, n]) => n.realm === 'below');

  it('has its ten standing places and four close-ups', () => {
    expect(below.filter(([, n]) => !n.cam)).toHaveLength(10);
    expect(below.filter(([, n]) => n.cam)).toHaveLength(4);
  });

  it('is joined to the surface only by the two fades on the stairs', () => {
    const crossings = [];
    for (const [id, n] of Object.entries(NODES)) {
      for (const link of Object.values(n.fwd || {})) {
        const l = typeof link === 'string' ? { to: link } : link;
        if ((NODES[l.to].realm || 'surface') !== (n.realm || 'surface')) crossings.push([id, l.to, !!l.fade]);
      }
    }
    expect(crossings.sort()).toEqual([['stairfoot', 'vault', true], ['vault', 'stairfoot', true]]);
  });
});

describe('starting at chapter two', () => {
  const s = chapterTwoState();

  it('counts chapter one as properly solved', () => {
    expect(Gen.busLive(s.gen)).toBe(true);
    for (const id of ['door', 'ops', 'vault', 'lighting']) expect(Gen.powered(s.gen, id)).toBe(true);
    expect(Rx.reception(s.rx)).toBe('locked');
    expect(s.rx.printed).toBe(true);
    expect(Vault.reading(s.vault)).toBe(Cipher.COMBINATION);
    expect(s.vault.open).toBe(true);
    expect(s.flags.hatchOpen).toBe(true);
  });

  it('starts at the foot of the stairs with chapter two untouched', () => {
    expect(s.node).toBe('stairfoot');
    expect(NODES[s.node].realm).toBe('below');
    expect(s.pump).toEqual(Pump.initial());
    expect(s.junction).toEqual(Junction.initial());
    expect(s.reply).toEqual(Reply.initial());
  });

  it('carries the papers and things you would have, the code booklet included', () => {
    expect(s.docs).toContain('pad');
    for (const id of s.docs) expect(DOCS[id], id).toBeTruthy();
    for (const id of s.inv) expect(ITEMS[id], id).toBeTruthy();
  });
});
