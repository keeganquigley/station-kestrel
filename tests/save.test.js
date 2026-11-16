import { describe, it, expect, afterEach } from 'vitest';
import { newState, chapterTwoState, chapterThreeState, save, load, repair } from '../src/engine/state.js';
import { START } from '../src/data/nodes.js';

const KEY = 'station-kestrel-save-v1';
const store = (raw) => {
  const items = new Map(raw === undefined ? [] : [[KEY, raw]]);
  globalThis.localStorage = {
    getItem: (k) => (items.has(k) ? items.get(k) : null),
    setItem: (k, v) => items.set(k, String(v)),
    removeItem: (k) => items.delete(k),
  };
};
const copy = (s) => JSON.parse(JSON.stringify(s));

afterEach(() => {
  delete globalThis.localStorage;
});

describe('a good save', () => {
  it('comes back unchanged', () => {
    for (const s of [newState(), chapterTwoState(), { ...chapterThreeState(), yaw: 45, pitch: -0.1 }]) {
      expect(repair(copy(s))).toEqual(s);
    }
  });

  it('round-trips through storage', () => {
    store();
    const s = chapterThreeState();
    save(s);
    expect(load()).toEqual(s);
  });

  it('from before chapters two and three gets fresh state for them', () => {
    const s = copy(chapterTwoState());
    for (const k of ['pump', 'junction', 'reply', 'darkroom', 'tally', 'telegraph']) delete s[k];
    const fresh = newState();
    const out = repair(s);
    expect(out.pump).toEqual(fresh.pump);
    expect(out.telegraph).toEqual(fresh.telegraph);
    expect(out.vault).toEqual(chapterTwoState().vault);
  });
});

describe('a corrupt save', () => {
  it('is no save at all', () => {
    for (const raw of ['{', 'not json', 'null', '42', '"text"', '[]', '{}']) {
      store(raw);
      expect(load(), raw).toBeNull();
    }
  });

  it('is no save when storage cannot be read', () => {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
    };
    expect(load()).toBeNull();
  });

  it('is no save when a puzzle holds a value its own moves cannot reach', () => {
    const outOfRange = [
      (s) => (s.gen.primes = -1),
      (s) => (s.gen.primes = 99),
      (s) => (s.rx.khz = 2999),
      (s) => (s.rx.khz = 10001),
      (s) => (s.rx.khz = 6990.5),
      (s) => (s.rx.bearing = 360),
      (s) => (s.rx.bearing = 55),
      (s) => (s.vault.wheels[0] = 12),
      (s) => (s.vault.wheels[3] = -1),
      (s) => (s.pump.levels = [9, 0, 0]),
      (s) => (s.pump.levels = [8, 5, 3]),
      (s) => (s.junction.sel.red = 6),
      (s) => (s.reply.wheels[0] = 1.5),
      (s) => (s.darkroom.wheels[5] = 10),
      (s) => (s.tally.set[Object.keys(s.tally.set)[0]] = 15),
      (s) => (s.telegraph.wheels[0] = 10),
    ];
    for (const mangle of outOfRange) {
      const s = copy(chapterThreeState());
      mangle(s);
      expect(repair(s), mangle.toString()).toBeNull();
    }
  });

  it('is no save when a part it cannot do without is missing or the wrong shape', () => {
    const broken = [
      (s) => (s.v = 2),
      (s) => (s.node = 'nowhere'),
      (s) => (s.node = 'toString'),
      (s) => (s.node = 7),
      (s) => delete s.gen,
      (s) => delete s.vault,
      (s) => (s.rx = 'tuned'),
      (s) => delete s.gen.breakers[Object.keys(s.gen.breakers)[0]],
      (s) => (s.gen.running = 'yes'),
      (s) => (s.rx.khz = null),
      (s) => (s.vault.wheels = [7, 3, 0]),
      (s) => (s.vault.wheels = '7302'),
      (s) => (s.junction.sel = []),
      (s) => (s.tally = null),
      (s) => (s.darkroom.wheels[0] = '9'),
      (s) => (s.flags = []),
      (s) => (s.inv = 'orders'),
      (s) => delete s.docs,
    ];
    for (const mangle of broken) {
      const s = copy(chapterThreeState());
      mangle(s);
      expect(repair(s), mangle.toString()).toBeNull();
    }
  });
});

describe('a tampered save', () => {
  it('loses the documents and items that do not exist, and keeps the rest', () => {
    const s = copy(chapterTwoState());
    s.inv = ['orders', 'key', 'master-key', 'key', 7, 'toString', '__proto__', null];
    s.docs = ['orders', 'answers', 'pad', 'constructor', { id: 'pad' }, 'pad'];
    const out = repair(s);
    expect(out.inv).toEqual(['orders', 'key']);
    expect(out.docs).toEqual(['orders', 'pad']);
  });

  it('loses flags that are not true, false or a number, and keys a game never has', () => {
    const s = copy(chapterTwoState());
    s.flags = { ...s.flags, gnome: 2, finished3: 'yes', odd: { a: 1 }, none: null };
    s.cheat = true;
    s.gen.extra = 1;
    const out = repair(s);
    expect(out.flags).toEqual({ ...chapterTwoState().flags, gnome: 2 });
    expect(out).not.toHaveProperty('cheat');
    expect(out.gen).toEqual(chapterTwoState().gen);
  });

  it('faces a known way and forgets a look it cannot use', () => {
    const s = copy(newState());
    Object.assign(s, { facing: 'up', yaw: 'left', pitch: 0 });
    const out = repair(s);
    expect(out.facing).toBe(START.facing);
    expect(out).not.toHaveProperty('yaw');
    expect(out).not.toHaveProperty('pitch');
  });

  it('cannot reach the prototype through a __proto__ key', () => {
    store(
      '{"v":1,"node":"jetty","facing":"N","flags":{"__proto__":{"polluted":true}},"inv":[],"docs":[],"gen":' +
        JSON.stringify(newState().gen) +
        ',"rx":' +
        JSON.stringify(newState().rx) +
        ',"vault":' +
        JSON.stringify(newState().vault) +
        '}',
    );
    const out = load();
    expect(out.node).toBe('jetty');
    expect({}.polluted).toBeUndefined();
    expect(out.flags.polluted).toBeUndefined();
  });
});
