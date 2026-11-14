// The whole game in one plain object, saved to the browser after every change.
import * as Gen from '../puzzles/generator.js';
import * as Rx from '../puzzles/receiver.js';
import * as Vault from '../puzzles/vault.js';
import * as Pump from '../puzzles/pump.js';
import * as Junction from '../puzzles/junction.js';
import * as Reply from '../puzzles/reply.js';
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
