// The whole game in one plain object, saved to the browser after every change.
import * as Gen from '../puzzles/generator.js';
import * as Rx from '../puzzles/receiver.js';
import * as Vault from '../puzzles/vault.js';
import * as Pump from '../puzzles/pump.js';
import * as Junction from '../puzzles/junction.js';
import * as Reply from '../puzzles/reply.js';
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

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // private window or storage blocked: the game still plays, it just will not resume
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1 || !NODES[s.node] || !s.gen || !s.rx || !s.vault) return null;
    return { ...newState(), ...s };
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
