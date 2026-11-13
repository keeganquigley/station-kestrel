import * as THREE from 'three';
import './style.css';
import { createRenderer, W, H } from './engine/renderer.js';
import { pick, pointFor } from './engine/hotspots.js';
import * as Store from './engine/state.js';
import { Sound } from './engine/audio.js';
import { UI } from './engine/ui.js';
import { NODES, START, turn } from './data/nodes.js';
import { ITEMS, SAY } from './data/documents.js';
import { DIRS } from './world/layout.js';
import { buildWorld } from './world/index.js';
import { createActions } from './actions.js';
import * as Gen from './puzzles/generator.js';
import * as Rx from './puzzles/receiver.js';

const canvas = document.getElementById('view');
const renderer = createRenderer(canvas);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(56, W / H, 0.05, 2500);
const world = buildWorld(scene);
const sound = new Sound();

const cursorSvg = (body) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><g fill='#f2ecd8' stroke='#111' stroke-width='1.6' stroke-linejoin='round'>${body}</g></svg>`
  )}") 16 16, pointer`;
const ARROW = "<path d='M16 3 27 16h-6v12H11V16H5z'/>";
const rot = (deg, body) => `<g transform='rotate(${deg} 16 16)'>${body}</g>`;
const CURVE = "<path d='M7 20a9 9 0 0 1 16-6l3-3 1 10-10-1 3-3a5 5 0 0 0-9 4z'/>";
const CURSORS = {
  fwd: cursorSvg(ARROW),
  right: cursorSvg(rot(90, ARROW)),
  back: cursorSvg(rot(180, ARROW)),
  left: cursorSvg(rot(270, ARROW)),
  hand: cursorSvg("<circle cx='16' cy='16' r='10' fill='none' stroke='#111' stroke-width='5'/><circle cx='16' cy='16' r='10' fill='none' stroke='#f2ecd8' stroke-width='2.4'/><circle cx='16' cy='16' r='3'/>"),
  look: cursorSvg("<circle cx='13' cy='13' r='8' fill='none' stroke='#111' stroke-width='5'/><path d='M19 19l9 9' stroke='#111' stroke-width='6' stroke-linecap='round'/><circle cx='13' cy='13' r='8' fill='none' stroke='#f2ecd8' stroke-width='2.4'/><path d='M19 19l9 9' stroke='#f2ecd8' stroke-width='3' stroke-linecap='round'/>"),
  cw: cursorSvg(CURVE),
  ccw: cursorSvg(`<g transform='translate(32 0) scale(-1 1)'>${CURVE}</g>`),
  up: cursorSvg("<path d='M16 5 26 17H6z'/><rect x='8' y='21' width='16' height='5'/>"),
  down: cursorSvg("<path d='M16 27 26 15H6z'/><rect x='8' y='6' width='16' height='5'/>"),
};
CURSORS.zoom = CURSORS.look;

const timers = new Set();

const game = {
  state: Store.newState(),
  playing: false,

  say: (text) => ui.say(text),
  sfx: (name) => sound.sfx(name),
  has: (item) => game.state.inv.includes(item),
  give(item) {
    if (!game.has(item)) game.state.inv.push(item);
  },
  after(ms, fn) {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  },

  read(id, onClose) {
    if (!game.state.docs.includes(id)) game.state.docs.push(id);
    sound.sfx('paper');
    ui.showDoc(id, onClose);
    Store.save(game.state);
  },

  useItem(id) {
    if (!game.playing) return;
    const item = ITEMS[id];
    if (item.doc) game.read(item.doc);
    else game.say(item.say);
  },

  /** Move to a node. Keeps your facing where the new place allows it. */
  go(node, facing, ms = 480) {
    const s = game.state, n = NODES[node];
    s.node = node;
    if (!n.cam) s.facing = facing && n.faces.includes(facing) ? facing : n.faces.includes(s.facing) ? s.facing : n.faces[0];
    sound.sfx('step');
    if (node === 'vault' && !s.flags.vaultSeen) {
      s.flags.vaultSeen = true;
      game.say(SAY.vaultEnter);
    }
    game.changed(ms);
  },

  /** Call after any change to state: redraws, re-mixes the sound and saves. */
  changed(ms = 140) {
    world.sync(game.state);
    placeCamera();
    renderer.show(scene, camera, ms);
    ui.inventory(game.state);
    mixSound();
    if (game.playing) Store.save(game.state);
  },

  toggleSound() {
    sound.start();
    sound.setMuted(!sound.muted);
    ui.sound(!sound.muted);
  },

  finish() {
    game.state.flags.finished = true;
    Store.save(game.state);
    game.playing = false;
    renderer.fade(0, 2600, () => ui.ending(showTitle));
  },
};

const ui = new UI(game);
const { A, gates } = createActions(game);

function placeCamera() {
  const s = game.state, n = NODES[s.node];
  if (n.cam) {
    camera.position.set(...n.cam);
    camera.lookAt(...n.look);
  } else {
    const [dx, dz] = DIRS[s.facing];
    const tilt = (n.tilt && n.tilt[s.facing]) || 0;
    camera.position.set(...n.pos);
    camera.lookAt(n.pos[0] + dx, n.pos[1] + tilt - 0.05, n.pos[2] + dz);
  }
  camera.updateMatrixWorld();
}

function mixSound() {
  const s = game.state;
  sound.ambience(game.playing ? NODES[s.node].amb : { wind: 0.5, sea: 0.8 }, Gen.status(s.gen), {
    on: Gen.powered(s.gen, 'ops'),
    strength: Rx.signal(s.rx),
    offset: s.rx.khz - Rx.TARGET_KHZ,
  });
}

/** What a click at this point of the view would do. */
function targetAt(x, y) {
  const s = game.state, n = NODES[s.node];
  if (n.cam) {
    if (y > 0.88) return { kind: 'back' };
  } else if (n.faces.length > 1) {
    if (x < 0.12) return { kind: 'left' };
    if (x > 0.88) return { kind: 'right' };
  }
  const p = pick(scene, camera, x, y, s.node);
  if (p) return { kind: 'hot', ...p };
  if (!n.cam) {
    const link = n.fwd[s.facing];
    if (link && !(link.gate === 'vault' && !s.vault.open)) return { kind: 'fwd', link };
  }
  return null;
}

function cursorFor(t) {
  if (!t) return 'default';
  if (t.kind !== 'hot') return CURSORS[t.kind];
  const c = t.hot.cursor;
  if (c === 'turn') return t.dir > 0 ? CURSORS.cw : CURSORS.ccw;
  if (c === 'spin') return t.dir > 0 ? CURSORS.up : CURSORS.down;
  return CURSORS[c] || CURSORS.hand;
}

function step(dir) {
  const s = game.state, n = NODES[s.node];
  if (dir === 'back') {
    if (n.cam) game.go(n.back[0], n.back[1]);
    return;
  }
  if (n.cam) return;
  if (dir === 'left' || dir === 'right') {
    if (n.faces.length < 2) return;
    s.facing = turn(s.node, s.facing, dir === 'left' ? -1 : 1);
    game.changed(320);
    return;
  }
  const link = n.fwd[s.facing];
  if (!link) return;
  if (typeof link === 'string') return game.go(link);
  if (link.gate) {
    const refusal = gates[link.gate]();
    if (refusal === false) return;
    if (refusal) return game.say(refusal);
  }
  game.go(link.to, link.face);
}

function act(t) {
  if (!t) return;
  if (t.kind === 'hot') {
    const [name, ...args] = t.hot.action;
    if (t.hot.dir) args.push(t.dir);
    A[name](...args);
  } else {
    step(t.kind);
  }
}

const viewXY = (e) => {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
};

canvas.addEventListener('mousemove', (e) => {
  if (!game.playing || ui.blocked) return (canvas.style.cursor = 'default');
  canvas.style.cursor = cursorFor(targetAt(...viewXY(e)));
});
canvas.addEventListener('click', (e) => {
  if (!game.playing || ui.blocked) return;
  sound.start();
  act(targetAt(...viewXY(e)));
  canvas.style.cursor = cursorFor(targetAt(...viewXY(e)));
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return ui.closeDoc();
  if (!game.playing || ui.blocked) return;
  const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'fwd', ArrowDown: 'back' }[e.key];
  if (dir) {
    e.preventDefault();
    step(dir);
  }
});

function clearTimers() {
  for (const t of timers) clearTimeout(t);
  timers.clear();
}

function begin(state, fresh) {
  clearTimers();
  game.state = state;
  game.playing = true;
  sound.start();
  renderer.fade(1, 1200);
  ui.say('');
  game.changed(900);
  if (fresh) game.read('orders', () => ui.say('Hollund Island, an hour before dark. The boat has already put about.'));
}

function showTitle() {
  clearTimers();
  game.playing = false;
  const saved = Store.load();
  // the title sits over a view of the island from the water
  world.sync(saved || Store.newState());
  camera.position.set(13, 3.2, 62);
  camera.lookAt(-2, 5.5, -10);
  camera.updateMatrixWorld();
  renderer.fade(1, 600);
  renderer.show(scene, camera, 0);
  ui.inventory({ inv: [] });
  ui.say('');
  ui.title(
    !!saved && !saved.flags.finished,
    () => {
      Store.clear();
      begin(Store.newState(), true);
    },
    () => begin(saved, false)
  );
}

let lastLive = 0;
function frame(now) {
  requestAnimationFrame(frame);
  renderer.tick(now);
  if (game.playing && NODES[game.state.node].live && now - lastLive > 90) {
    lastLive = now;
    if (world.tick(game.state.node)) renderer.refresh(scene, camera);
  }
}

ui.sound(true);
showTitle();
requestAnimationFrame(frame);

// For the automated walkthrough and for poking around in the browser console.
window.kestrel = {
  game,
  renderer,
  scene,
  nodes: NODES,
  start: START,
  /** Screen point (0..1) that triggers a hotspot from the current view, or null. */
  point: (id, dir = 0) => pointFor(scene, camera, id, game.state.node, dir, !NODES[game.state.node].cam),
  jump(node, facing) {
    game.go(node, facing, 0);
  },
};
