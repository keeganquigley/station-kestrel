import { describe, it, expect } from 'vitest';
import * as Darkroom from '../src/puzzles/darkroom.js';
import * as Tally from '../src/puzzles/tally.js';
import * as Telegraph from '../src/puzzles/telegraph.js';
import * as Pump from '../src/puzzles/pump.js';
import * as Junction from '../src/puzzles/junction.js';
import * as Reply from '../src/puzzles/reply.js';
import { NODES } from '../src/data/nodes.js';
import { chapterThreeState, newState } from '../src/engine/state.js';
import { DOCS, ITEMS, LOOK } from '../src/data/documents.js';
import { clockWords } from '../src/data/documents-pen.js';
import { LETTERHEAD, VESSEL } from '../src/data/names.js';
import { STOPPED_CLOCK } from '../src/puzzles/receiver.js';

const strip = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ');

describe('darkroom', () => {
  const set = (mins, safe = true) => {
    let s = Darkroom.initial();
    mins.forEach((m, i) => {
      for (let k = 0; k < Math.floor(m / 10); k++) s = Darkroom.spin(s, 2 * i, 1);
      for (let k = 0; k < m % 10; k++) s = Darkroom.spin(s, 2 * i + 1, 1);
    });
    return safe ? Darkroom.toggleLight(s) : s;
  };
  const [dev, stop, fix] = Darkroom.target();

  it('reads its times off the chart and the routine card', () => {
    expect(Darkroom.CHART.map(([t]) => t)).toContain(Darkroom.TEMPERATURE);
    expect(dev).toBe(9);
    expect(stop).toBe(1);
    expect(fix).toBe(18);
    expect(Darkroom.minutes(set([dev, stop, fix]))).toEqual([dev, stop, fix]);
  });

  it('gives a clean print only at exactly those times, under the safelight, with film', () => {
    expect(Darkroom.run(set([dev, stop, fix]), false).result).toBe('nofilm');
    expect(Darkroom.run(set([dev, stop, fix], false), true).result).toBe('fogged');
    const ok = Darkroom.run(set([dev, stop, fix]), true);
    expect(ok.result).toBe('good');
    expect(ok.state.printed).toBe(true);
    expect(Darkroom.run(ok.state, true).result).toBe('already');
    expect(Darkroom.spin(ok.state, 0, 1).wheels).toEqual(ok.state.wheels);
  });

  it('says what went wrong with any other setting', () => {
    const r = (mins) => Darkroom.run(set(mins), true).result;
    expect(r([dev - 1, stop, fix])).toBe('thin');
    expect(r([dev + 1, stop, fix])).toBe('dense');
    expect(r([dev, 0, fix])).toBe('streaked');
    expect(r([dev, stop + 1, fix])).toBe('streaked');
    expect(r([dev, stop, fix - 1])).toBe('unfixed');
    expect(r([dev, stop, fix + 1])).toBe('bleached');
    expect(r([0, 0, 0])).toBe('thin');
  });

  it('accepts exactly one of every possible setting near the answer', () => {
    let good = 0;
    for (let d = 0; d < 30; d++) for (let s = 0; s < 6; s++) for (let f = 0; f < 40; f++) if (Darkroom.run(set([d, s, f]), true).result === 'good') good++;
    expect(good).toBe(1);
  });

  it('cannot be read off a neighbouring line of the chart', () => {
    const times = Darkroom.CHART.map(([, m]) => m);
    expect(new Set(times).size).toBe(times.length);
  });

  it('wheels wrap both ways', () => {
    expect(Darkroom.spin(Darkroom.initial(), 3, -1).wheels[3]).toBe(9);
    expect(Darkroom.spin(Darkroom.spin(Darkroom.initial(), 3, -1), 3, 1).wheels[3]).toBe(0);
  });
});

describe('tally board', () => {
  const set = (owner) => {
    let s = Tally.initial();
    for (const n of Tally.NAMES) while (s.set[n] !== owner[n]) s = Tally.spin(s, n, 1);
    return s;
  };

  it('hands out each tally exactly once', () => {
    expect(Object.values(Tally.OWNER).sort((a, b) => a - b)).toEqual(Tally.TALLIES);
    expect(Tally.arrangements()).toHaveLength(24);
  });

  it('the four remarks allow exactly one arrangement, and it is the true one', () => {
    expect(Tally.consistent()).toEqual([Tally.OWNER]);
  });

  it('every remark is needed: drop any one and more than one arrangement fits', () => {
    Tally.REMARKS.forEach((_, i) => {
      expect(Tally.consistent(Tally.REMARKS.filter((__, k) => k !== i)).length, 'without remark ' + i).toBeGreaterThan(1);
    });
  });

  it('has one remark from each of the four', () => {
    expect(Tally.REMARKS.map((r) => r.by).sort()).toEqual([...Tally.NAMES].sort());
  });

  it('draws the bar only on the true arrangement', () => {
    expect(Tally.pullBar(Tally.initial()).result).toBe('held');
    const swapped = { ...Tally.OWNER, harlan: Tally.OWNER.okafor, okafor: Tally.OWNER.harlan };
    expect(Tally.pullBar(set(swapped)).result).toBe('held');
    const ok = Tally.pullBar(set(Tally.OWNER));
    expect(ok.result).toBe('open');
    expect(Tally.pullBar(ok.state).result).toBe('already');
    expect(Tally.spin(ok.state, 'voss', 1).set).toEqual(ok.state.set);
  });

  it('drums wrap both ways through the four numbers', () => {
    const down = Tally.spin(Tally.initial(), 'lund', -1);
    expect(down.set.lund).toBe(Tally.TALLIES[Tally.TALLIES.length - 1]);
    expect(Tally.spin(down, 'lund', 1).set.lund).toBe(Tally.TALLIES[0]);
  });
});

describe('picture telegraph', () => {
  const set = (code) =>
    code.split('').reduce((s, d, i) => {
      for (let k = 0; k < Number(d); k++) s = Telegraph.spin(s, i, 1);
      return s;
    }, Telegraph.initial());

  it('files the paper against the hull number and the tally of whoever signed', () => {
    expect(Telegraph.HULL).toMatch(/^\d{3}$/);
    expect(Telegraph.DOCKET).toBe(Telegraph.HULL + String(Tally.OWNER[Telegraph.SIGNED_BY]));
    expect(Telegraph.SIGNED_BY).toBe('voss');
  });

  it('draws the paper only for that docket, and only with the line live', () => {
    expect(Telegraph.call(set(Telegraph.DOCKET), false).result).toBe('dead');
    expect(Telegraph.call(Telegraph.initial(), true).result).toBe('unknown');
    const ok = Telegraph.call(set(Telegraph.DOCKET), true);
    expect(ok.result).toBe('drawn');
    expect(Telegraph.call(ok.state, true).result).toBe('already');
    expect(Telegraph.spin(ok.state, 0, 1).wheels).toEqual(ok.state.wheels);
  });

  it('answers NIL for the other three tallies, and does not know any other number', () => {
    for (const [name, tally] of Object.entries(Tally.OWNER)) {
      const r = Telegraph.call(set(Telegraph.HULL + tally), true).result;
      expect(r, name).toBe(name === Telegraph.SIGNED_BY ? 'drawn' : 'nil');
    }
    expect(Telegraph.call(set(Telegraph.HULL + '99'), true).result).toBe('unknown');
    expect(Telegraph.call(set('000' + Tally.OWNER.voss), true).result).toBe('unknown');
  });
});

describe('the papers of chapter three', () => {
  it('the waiver carries the letterhead, the boat, today, and the signature', () => {
    const t = strip(DOCS.waiver.html);
    expect(DOCS.waiver.html).toContain(`<p class="letterhead">${LETTERHEAD}</p>`);
    expect(LETTERHEAD).toBe('OceanGate');
    expect(VESSEL).toBe('TITAN 2');
    for (const want of [VESSEL, Telegraph.HULL, '14 November 1996', 'I. Voss', 'four (4)', String(Tally.OWNER.voss)]) expect(t).toContain(want);
  });

  it('the second sheet is the same form, unsigned, for the bearer of the field instruction', () => {
    const t = strip(DOCS.second.html);
    expect(t).toContain('FIELD INSTRUCTION 96/311');
    expect(t).toContain('15 November 1996');
    expect(t).not.toContain('Voss');
  });

  it('the casualty return lists all four as deceased today and gives no cause', () => {
    const t = strip(DOCS.casualty.html);
    for (const n of ['HARLAN', 'VOSS', 'LUND', 'OKAFOR']) expect(t).toContain(n);
    expect(t.match(/DECEASED/g)).toHaveLength(4);
    expect(t).toContain('14 November 1996');
    expect(t).toContain(STOPPED_CLOCK);
    expect(DOCS.casualty.html).toMatch(/<td>Cause<\/td><td class="blank">/);
  });

  it('the watches stopped when the clock upstairs did', () => {
    expect(clockWords('16:50')).toBe('ten to five');
    expect(clockWords('09:15')).toBe('a quarter past nine');
    expect(clockWords('12:30')).toBe('half past twelve');
    expect(LOOK.watches).toContain(clockWords(STOPPED_CLOCK));
  });

  it('each clue is where the puzzles say it is', () => {
    expect(strip(DOCS.photo.html)).toContain(Telegraph.HULL);
    expect(strip(DOCS.berthlog.html)).toMatch(/signed for the party by V\./);
    expect(strip(DOCS.berthlog.html)).toContain(VESSEL);
    expect(LOOK.thermo).toContain(String(Darkroom.TEMPERATURE));
    for (const [t, m] of Darkroom.CHART) expect(strip(DOCS.devchart.html)).toContain(`${t} ° ${m} min`.replace(' ° ', ' '));
    expect(strip(DOCS.routine.html)).toMatch(/STOP: one minute/);
    expect(strip(DOCS.routine.html)).toMatch(/FIX: twice the developing time/);
    // the hull number is nowhere but the photograph
    for (const [id, d] of Object.entries(DOCS)) if (!['photo', 'waiver', 'second'].includes(id)) expect(strip(d.html), id).not.toContain(Telegraph.HULL);
    for (const line of Object.values(LOOK)) expect(line).not.toContain(Telegraph.HULL);
  });

  it('the four remarks are written down in four different papers', () => {
    const where = { lund: 'note-lund', harlan: 'berthlog', okafor: 'note-okafor', voss: 'note-voss' };
    expect(strip(DOCS[where.lund].html)).toMatch(/Voss drew a higher tally than me/);
    expect(strip(DOCS[where.harlan].html)).toMatch(/Mine is a higher number than Voss's/);
    expect(strip(DOCS[where.okafor].html)).toMatch(/Mine beats Voss's/);
    expect(strip(DOCS[where.voss].html)).toMatch(/Harlan's tally is an even number/);
    // and no paper gives a tally number away outright, except the waiver you get at the end
    for (const [id, d] of Object.entries(DOCS)) {
      if (id === 'waiver' || id === 'pad' || id === 'printout' || id === 'final') continue;
      expect(strip(d.html), id).not.toMatch(/[Tt]ally\s+(14|23|31|46)\b/);
    }
  });
});

describe('the pen on the map', () => {
  const pen = Object.entries(NODES).filter(([, n]) => n.realm === 'pen');

  it('has its seven standing places and five close-ups', () => {
    expect(pen.filter(([, n]) => !n.cam)).toHaveLength(7);
    expect(pen.filter(([, n]) => n.cam)).toHaveLength(5);
  });

  it('is joined to the Subterranean Station only by the two fades in the rock passage', () => {
    const crossings = [];
    for (const [id, n] of Object.entries(NODES)) {
      for (const link of Object.values(n.fwd || {})) {
        const l = typeof link === 'string' ? { to: link } : link;
        const a = n.realm || 'surface',
          b = NODES[l.to].realm || 'surface';
        if (a !== b && (a === 'pen' || b === 'pen')) crossings.push([id, l.to, !!l.fade]);
      }
    }
    expect(crossings.sort()).toEqual([
      ['beyond', 'gallery', true],
      ['gallery', 'beyond', true],
    ]);
  });

  it('every link leads somewhere, and every close-up steps back to a standing place', () => {
    for (const [id, n] of pen) {
      for (const link of Object.values(n.fwd || {})) expect(NODES[typeof link === 'string' ? link : link.to], id).toBeTruthy();
      if (n.cam) expect(NODES[n.back[0]].pos, id).toBeTruthy();
    }
  });
});

describe('starting at chapter three', () => {
  const s = chapterThreeState();

  it('counts chapter two as properly solved', () => {
    expect(s.pump.drained).toBe(true);
    expect(s.pump.levels[Pump.FEED]).toBe(Pump.CHARGE);
    expect(s.pump.levels.reduce((a, b) => a + b, 0)).toBe(Pump.CAPACITY[0]);
    expect(Junction.correct(s.junction)).toBe(true);
    expect(s.junction.live).toBe(true);
    expect(Reply.reading(s.reply)).toBe(Reply.EXPECTED);
    expect(s.reply.open).toBe(true);
    expect(s.flags.hatchOpen).toBe(true);
  });

  it('starts on the gallery with chapter three untouched', () => {
    expect(s.node).toBe('gallery');
    expect(NODES[s.node].realm).toBe('pen');
    expect(s.darkroom).toEqual(Darkroom.initial());
    expect(s.tally).toEqual(Tally.initial());
    expect(s.telegraph).toEqual(Telegraph.initial());
    expect(s.flags.finished3).toBeUndefined();
  });

  it('carries every paper from the first two chapters, and each one exists', () => {
    for (const id of ['pad', 'nb-okafor', 'nb-voss', 'comedown']) expect(s.docs).toContain(id);
    expect(new Set(s.docs).size).toBe(s.docs.length);
    for (const id of s.docs) expect(DOCS[id], id).toBeTruthy();
    for (const id of s.inv) expect(ITEMS[id], id).toBeTruthy();
    for (const id of ['film', 'photo']) expect(ITEMS[id], id).toBeTruthy();
  });

  it('a new game has the three new puzzles in their starting state', () => {
    const n = newState();
    expect(n.darkroom).toEqual(Darkroom.initial());
    expect(n.tally).toEqual(Tally.initial());
    expect(n.telegraph).toEqual(Telegraph.initial());
  });
});
