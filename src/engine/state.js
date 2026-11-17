// The whole game in one plain object, saved to the browser after every change.
import * as Gen from '../puzzles/generator.js';
import * as Rx from '../puzzles/receiver.js';
import * as Vault from '../puzzles/vault.js';
import * as Pump from '../puzzles/pump.js';
import * as Junction from '../puzzles/junction.js';
import * as Reply from '../puzzles/reply.js';
import * as Darkroom from '../puzzles/darkroom.js';
import * as Tally from '../puzzles/tally.js';
import * as Telegraph from '../puzzles/telegraph.js';
import { COMBINATION } from '../puzzles/cipher.js';
import { START, NODES, ORDER } from '../data/nodes.js';
import { DOCS, ITEMS } from '../data/documents.js';

const KEY = 'station-kestrel-save-v1';

export function newState() {
  return {
    v: 1,
    node: START.node,
    facing: START.facing,
    flags: {},
    inv: ['orders'],
    docs: ['orders'],
    gen: Gen.initial(),
    rx: Rx.initial(),
    vault: Vault.initial(),
    // chapter two
    pump: Pump.initial(),
    junction: Junction.initial(),
    reply: Reply.initial(),
    // chapter three
    darkroom: Darkroom.initial(),
    tally: Tally.initial(),
    telegraph: Telegraph.initial(),
  };
}

/**
 * A game with chapter one already played through, standing at the foot of the stairs.
 * Built from the puzzles' own answers, so it stays right if those ever change.
 */
export function chapterTwoState() {
  const s = newState();
  const breakers = { ...s.gen.breakers };
  for (const id of Gen.solutions()[0]) breakers[id] = true;
  s.gen = { valve: true, primes: 0, choke: false, running: true, breakers };
  s.rx = { khz: Rx.TARGET_KHZ, bearing: Rx.TARGET_BEARING, printed: true };
  s.vault = { wheels: COMBINATION.split('').map(Number), open: true };
  s.flags = { keyTaken: true, drawerOpen: true, doorOpened: true, vaultSeen: true, hatchOpen: true };
  s.inv = ['orders', 'key', 'printout'];
  // everything you would have read on the way, the code booklet above all: the far door wants it again
  s.docs = ['orders', 'card', 'govnote', 'noticeboard', 'logbook', 'chart', 'memo-tri', 'memo-vault', 'pad', 'printout', 'final'];
  s.node = 'stairfoot';
  s.facing = 'N';
  return s;
}

/**
 * A game with chapters one and two played through, standing on the gallery above the pen.
 * As above, built from the puzzles' own answers.
 */
export function chapterThreeState() {
  const s = chapterTwoState();
  s.pump = { levels: Pump.initial().levels.map(() => 0), drained: true };
  s.pump.levels[Pump.FEED] = Pump.CHARGE;
  s.pump.levels[0] = Pump.CAPACITY[0] - Pump.CHARGE;
  s.junction = { sel: { ...Junction.WIRING }, live: true };
  s.reply = { wheels: Reply.EXPECTED.split('').map(Number), open: true };
  Object.assign(s.flags, { belowSeen: true, lowSeen: true, beyondSeen: true });
  s.docs.push('rota', 'ledger', 'schedule', 'nb-lund', 'nb-okafor', 'nb-voss', 'nb-harlan', 'challenge', 'comedown');
  s.node = 'gallery';
  s.facing = 'N';
  return s;
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // private window or storage blocked: the game still plays, it just will not resume
  }
}

const PUZZLES = ['gen', 'rx', 'vault', 'pump', 'junction', 'reply', 'darkroom', 'tally', 'telegraph'];
// saves from before chapters two and three have no state for them yet; these three every save has
const REQUIRED = ['gen', 'rx', 'vault'];

const isObject = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
const isNumber = (x) => typeof x === 'number' && Number.isFinite(x);

/** A copy of value if it has the same shape and types as template, else undefined. */
function fit(template, value) {
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length !== template.length) return undefined;
    const out = template.map((t, i) => fit(t, value[i]));
    return out.includes(undefined) ? undefined : out;
  }
  if (isObject(template)) {
    if (!isObject(value)) return undefined;
    const out = {};
    for (const k of Object.keys(template)) {
      if (!Object.hasOwn(value, k)) return undefined;
      out[k] = fit(template[k], value[k]);
      if (out[k] === undefined) return undefined;
    }
    return out;
  }
  if (typeof template === 'number') return isNumber(value) ? value : undefined;
  return typeof value === typeof template ? value : undefined;
}

const between = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
const digits = (p) => p.wheels.every((n) => between(n, 0, 9));
const sum = (list) => list.reduce((a, b) => a + b, 0);

// what each puzzle's own moves can reach; a value outside it was not put there by playing
const IN_RANGE = {
  gen: (p) => between(p.primes, 0, Gen.PRIME_COUNT + 2),
  rx: (p) => between(p.khz, Rx.MIN_KHZ, Rx.MAX_KHZ) && between(p.bearing, 0, 359) && p.bearing % Rx.BEARING_STEP === 0,
  vault: digits,
  pump: (p) => p.levels.every((n, i) => between(n, 0, Pump.CAPACITY[i])) && sum(p.levels) === sum(Pump.initial().levels),
  junction: (p) => Object.values(p.sel).every((n) => Junction.TERMINALS.includes(n)),
  reply: digits,
  darkroom: digits,
  tally: (p) => Object.values(p.set).every((n) => Tally.TALLIES.includes(n)),
  telegraph: digits,
};

const known = (list, registry) => (Array.isArray(list) ? [...new Set(list.filter((id) => typeof id === 'string' && Object.hasOwn(registry, id)))] : undefined);

/**
 * Check a parsed save against the shape of a new game and the range of each puzzle's values.
 * Unknown documents and items are dropped; anything else that does not fit means there is no save to resume.
 * A save from an older version of the game is brought up to date on the way.
 */
export function repair(s) {
  if (!isObject(s) || s.v !== 1 || typeof s.node !== 'string' || !Object.hasOwn(NODES, s.node)) return null;
  const fresh = newState();
  const out = { ...fresh, node: s.node, facing: ORDER.includes(s.facing) ? s.facing : START.facing };
  for (const k of PUZZLES) {
    if (s[k] === undefined && !REQUIRED.includes(k)) continue;
    out[k] = fit(fresh[k], s[k]);
    if (out[k] === undefined || !IN_RANGE[k](out[k])) return null;
  }
  if (!isObject(s.flags)) return null;
  out.flags = {};
  for (const [k, f] of Object.entries(s.flags)) if (typeof f === 'boolean' || isNumber(f)) out.flags[k] = f;
  if (out.flags.finished && !out.flags.finished2) {
    // a save that reached the old end of the demo, when the vault was the last room: the vault now has a way on
    delete out.flags.finished;
    out.flags.hatchOpen = true;
  }
  out.inv = known(s.inv, ITEMS);
  out.docs = known(s.docs, DOCS);
  if (!out.inv || !out.docs) return null;
  if (isNumber(s.yaw) && isNumber(s.pitch)) Object.assign(out, { yaw: s.yaw, pitch: s.pitch });
  return out;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? repair(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function clear() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
