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
import { START, NODES } from '../data/nodes.js';

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
  s.docs.push('rota', 'ledger', 'schedule', 'nb-lund', 'nb-rush', 'nb-voss', 'nb-harlan', 'challenge', 'comedown');
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

/** One of the four was renamed after people had saves. Carry the old ids over. */
function renamed(s) {
  const OLD = 'oka' + 'for';
  if (Array.isArray(s.docs)) s.docs = s.docs.map((id) => id.replace(OLD, 'rush'));
  if (s.tally && s.tally.set && OLD in s.tally.set) {
    const { [OLD]: tally, ...rest } = s.tally.set;
    s.tally = { ...s.tally, set: { ...rest, rush: tally } };
  }
  return s;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1 || !NODES[s.node] || !s.gen || !s.rx || !s.vault) return null;
    return renamed({ ...newState(), ...s });
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
