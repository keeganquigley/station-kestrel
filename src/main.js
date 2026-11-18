import * as THREE from 'three';
import './style.css';
import { createRenderer, W, H } from './engine/renderer.js';
import { pick, pointFor } from './engine/hotspots.js';
import * as Store from './engine/state.js';
import { Sound } from './engine/audio.js';
import { UI } from './engine/ui.js';
import { createLook } from './engine/look.js';
import { NODES, START, realmOf } from './data/nodes.js';
import { YAW, rad, norm, clamp, smooth, nearestFace, composedPitch, linksFrom, nearestLink, nextStop } from './engine/compass.js';
import { ITEMS, SAY } from './data/documents.js';
import { EYE } from './world/layout.js';
import { terrainH } from './world/terrain.js';
import { buildWorld } from './world/index.js';
import { createActions } from './actions.js';
import * as Gen from './puzzles/generator.js';
import * as Rx from './puzzles/receiver.js';

const VFOV = 56;
const HFOV = (2 * Math.atan(Math.tan((VFOV * Math.PI) / 360) * (W / H)) * 180) / Math.PI;
const EDGE = 0.08; // width of the click-to-turn strips at the sides of the picture
const PITCH_LIMIT = 42;

const canvas = document.getElementById('view');
const renderer = createRenderer(canvas);
const scene = new THREE.Scene();
// Nothing in the game comes closer than about 0.9 m to the eye, so a generous near limit is free
// and buys depth precision, which free look needs (see MAX_FACE in world/kit.js).
const camera = new THREE.PerspectiveCamera(VFOV, W / H, 0.25, 2500);
const world = buildWorld(scene);
const sound = new Sound();

const cursorSvg = (body) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><g fill='#f2ecd8' stroke='#111' stroke-width='1.6' stroke-linejoin='round'>${body}</g></svg>`,
  )}") 16 16, pointer`;
const ARROW = "<path d='M16 3 27 16h-6v12H11V16H5z'/>";
const rot = (deg, body) => `<g transform='rotate(${deg} 16 16)'>${body}</g>`;
const CURVE = "<path d='M7 20a9 9 0 0 1 16-6l3-3 1 10-10-1 3-3a5 5 0 0 0-9 4z'/>";
const CURSORS = {
  fwd: cursorSvg(ARROW),
  right: cursorSvg(rot(90, ARROW)),
  back: cursorSvg(rot(180, ARROW)),
  left: cursorSvg(rot(270, ARROW)),
  hand: cursorSvg(
    "<circle cx='16' cy='16' r='10' fill='none' stroke='#111' stroke-width='5'/><circle cx='16' cy='16' r='10' fill='none' stroke='#f2ecd8' stroke-width='2.4'/><circle cx='16' cy='16' r='3'/>",
  ),
  look: cursorSvg(
    "<circle cx='13' cy='13' r='8' fill='none' stroke='#111' stroke-width='5'/><path d='M19 19l9 9' stroke='#111' stroke-width='6' stroke-linecap='round'/><circle cx='13' cy='13' r='8' fill='none' stroke='#f2ecd8' stroke-width='2.4'/><path d='M19 19l9 9' stroke='#f2ecd8' stroke-width='3' stroke-linecap='round'/>",
  ),
  cw: cursorSvg(CURVE),
  ccw: cursorSvg(`<g transform='translate(32 0) scale(-1 1)'>${CURVE}</g>`),
  up: cursorSvg("<path d='M16 5 26 17H6z'/><rect x='8' y='21' width='16' height='5'/>"),
  down: cursorSvg("<path d='M16 27 26 15H6z'/><rect x='8' y='6' width='16' height='5'/>"),
};
CURSORS.zoom = CURSORS.look;
const DOT = cursorSvg("<circle cx='16' cy='16' r='2.6'/>");

// ---------------------------------------------------------------- the camera
// The arithmetic of bearings and turns is in engine/compass.js.
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const aim = new THREE.PerspectiveCamera();

/** Where the camera belongs for a given state: { pos, quat }. */
function poseOf(s) {
  const n = NODES[s.node];
  if (n.cam) {
    aim.position.set(...n.cam);
    aim.lookAt(...n.look);
    return { pos: aim.position.clone(), quat: aim.quaternion.clone() };
  }
  euler.set(rad(s.pitch), -rad(s.yaw), 0, 'YXZ');
  return { pos: new THREE.Vector3(...n.pos), quat: new THREE.Quaternion().setFromEuler(euler) };
}

function placeCamera() {
  const p = poseOf(game.state);
  camera.position.copy(p.pos);
  camera.quaternion.copy(p.quat);
  camera.updateMatrixWorld();
}

// ---------------------------------------------------------------- camera moves
let move = null; // a glide or a turn in progress
let fading = false; // walking the stairs between the realms
/** Multiplies the length of every glide and turn. The tests set it low, through the hook at the foot of this file. */
let timeScale = 1;
const busy = () => !!move || fading;
let lookDirty = false;
const timers = new Set();

function startMove(from, to, ms, followGround) {
  move = { from, to, t0: performance.now(), dur: Math.max(1, ms * timeScale), followGround };
}

function stepMove(now) {
  const k = clamp((now - move.t0) / move.dur, 0, 1);
  camera.position.lerpVectors(move.from.pos, move.to.pos, smooth(k));
  if (move.followGround) {
    // never dip below standing height on the way up the slope
    camera.position.y = Math.max(camera.position.y, terrainH(camera.position.x, camera.position.z) + EYE);
  }
  // finish turning before arriving, so you see where you are going
  camera.quaternion.slerpQuaternions(move.from.quat, move.to.quat, smooth(clamp(k / 0.7, 0, 1)));
  camera.updateMatrixWorld();
  if (k >= 1) {
    move = null;
    placeCamera();
  }
}

const here = () => ({ pos: camera.position.clone(), quat: camera.quaternion.clone() });

// ---------------------------------------------------------------- game
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

  /** Walk to a node and arrive facing the given compass direction. instant skips the glide. */
  go(node, facing, instant = false) {
    const s = game.state,
      from = here(),
      prev = NODES[s.node],
      n = NODES[node];
    s.node = node;
    if (!n.cam && facing) {
      s.yaw = YAW[facing];
      s.pitch = composedPitch(n, facing);
      s.facing = facing;
    }
    sound.sfx('step');
    arrive(node, instant);
    syncAll();
    if (instant || !game.playing) {
      move = null;
      placeCamera();
      renderer.show(scene, camera, 0);
      return;
    }
    const to = poseOf(s);
    const dist = from.pos.distanceTo(to.pos);
    const outdoors = realmOf(node) === 'surface' && !prev.realm;
    startMove(from, to, clamp(380 + dist * 90, 480, 1700), outdoors && !prev.cam && !n.cam);
  },

  /** Call after any change to state: redraws, re-mixes the sound and saves. */
  changed(ms = 140) {
    syncAll();
    if (move) return; // the glide in progress will show the change
    placeCamera();
    renderer.show(scene, camera, ms);
  },

  toggleLook: () => freeLook.toggle(),
  /** A paper was picked up or put down, or the title came or went. */
  uiChanged: () => freeLook.sync(),

  toggleSound() {
    sound.start();
    sound.setMuted(!sound.muted);
    ui.sound(!sound.muted);
  },

  /** Take the stairs: fade out, change realm, fade in. */
  fadeTo(node, facing, sfx = 'stairs') {
    if (fading) return;
    fading = true;
    sound.sfx(sfx);
    renderer.fade(0, Math.max(40, 900 * timeScale), () => {
      game.go(node, facing, true);
      renderer.fade(1, Math.max(40, 1100 * timeScale), () => (fading = false));
    });
  },

  /** The end of chapter three, and of the story so far. */
  finish() {
    game.state.flags.finished3 = true;
    Store.save(game.state);
    game.playing = false;
    renderer.fade(0, 2600, () => ui.ending(showTitle));
  },
};

const ui = new UI(game);
const { A, gates, shut } = createActions(game);

/** Things that happen the first time you reach a place. */
function arrive(node, cut = false) {
  const s = game.state,
    once = (flag) => (s.flags[flag] ? false : (s.flags[flag] = true));
  if (node === 'vault' && once('vaultSeen')) game.say(SAY.vaultEnter);
  if (node === 'stairfoot' && once('belowSeen')) game.say(SAY.belowEnter);
  if (node === 'junction' && once('lowSeen')) game.say(SAY.lowEnter);
  if (node === 'beyond' && once('beyondSeen')) {
    game.say(SAY.beyond1);
    const still = (line) => () => game.state.node === 'beyond' && game.say(line);
    game.after(4200, still(SAY.beyond2));
    game.after(8400, still(SAY.beyondDown));
  }
  if (node === 'gallery' && once('penSeen')) game.say(SAY.penEnter);
  if (node === 'quayMid' && !s.flags.lampOn && once('quaySeen')) game.say(SAY.quayFirst);
  // the ending belongs to walking out onto the quay, not to a test or a tour cutting straight there
  if (node === 'quayMid' && s.flags.lampOn && !s.flags.finished3 && !cut) {
    game.say(SAY.end1);
    game.after(4600, () => game.say(SAY.end2));
    game.after(9600, () => game.finish());
  }
}

function syncAll() {
  world.sync(game.state);
  ui.inventory(game.state);
  mixSound();
  if (game.playing) Store.save(game.state);
  freeLook.sync();
}

function mixSound() {
  const s = game.state;
  sound.ambience(game.playing ? NODES[s.node].amb : { wind: 0.5, sea: 0.8 }, Gen.status(s.gen), {
    on: Gen.powered(s.gen, 'ops'),
    strength: Rx.signal(s.rx),
    offset: s.rx.khz - Rx.TARGET_KHZ,
  });
}

// ---------------------------------------------------------------- pointing
const probe = new THREE.Vector3();

/** Compass bearing and pitch of the line of sight through a point of the picture. */
function sightThrough(x, y) {
  probe
    .set(x * 2 - 1, -(y * 2 - 1), 0.5)
    .unproject(camera)
    .sub(camera.position)
    .normalize();
  return { bearing: norm((Math.atan2(probe.x, -probe.z) * 180) / Math.PI), pitch: (Math.asin(probe.y) * 180) / Math.PI };
}

/** A way that is shut does not even show the walk-forward arrow. */
const passable = (link) => !(link.gate && shut[link.gate] && shut[link.gate]());

const linkToward = (bearing, within) => nearestLink(linksFrom(game.state.node), bearing, within, passable);

/** What a click at this point of the view would do. */
function targetAt(x, y) {
  const s = game.state,
    n = NODES[s.node];
  if (n.cam) {
    if (y > 0.88) return { kind: 'back' };
  } else {
    if (x < EDGE) return { kind: 'left' };
    if (x > 1 - EDGE) return { kind: 'right' };
  }
  const p = pick(scene, camera, x, y, s.node);
  if (p) return { kind: 'hot', ...p };
  if (!n.cam) {
    const sight = sightThrough(x, y);
    if (sight.pitch > -55 && sight.pitch < 30) {
      const link = linkToward(sight.bearing, 26);
      if (link) return { kind: 'fwd', link };
    }
  }
  return null;
}

function cursorFor(t) {
  if (!t) return NODES[game.state.node].cam ? 'default' : 'grab';
  if (t.kind !== 'hot') return CURSORS[t.kind];
  const c = t.hot.cursor;
  if (c === 'turn') return t.dir > 0 ? CURSORS.cw : CURSORS.ccw;
  if (c === 'spin') return t.dir > 0 ? CURSORS.up : CURSORS.down;
  if (c === 'shift') return t.dir > 0 ? CURSORS.right : CURSORS.left;
  return CURSORS[c] || CURSORS.hand;
}

function follow(link) {
  if (!link) return;
  if (link.gate) {
    const refusal = gates[link.gate]();
    if (refusal === false) return;
    if (refusal) return game.say(refusal);
  }
  if (link.fade) return game.fadeTo(link.to, link.face);
  game.go(link.to, link.face);
}

/** Swing round to the next compass stop in the given direction (dir -1 left, +1 right). */
function turnBy(dir, stepDeg) {
  const s = game.state,
    n = NODES[s.node];
  if (n.cam) return;
  const from = here();
  s.yaw = nextStop(s.yaw, dir, stepDeg);
  s.facing = nearestFace(s.yaw);
  if (s.yaw % 90 === 0) s.pitch = composedPitch(n, s.facing);
  startMove(from, poseOf(s), stepDeg >= 90 ? 340 : 220, false);
  if (game.playing) Store.save(s);
}

function step(dir) {
  const s = game.state,
    n = NODES[s.node];
  if (dir === 'back') {
    if (n.cam) game.go(n.back[0], n.back[1]);
    return;
  }
  if (n.cam) return;
  if (dir === 'left' || dir === 'right') return turnBy(dir === 'left' ? -1 : 1, 45);
  follow(linkToward(s.yaw, 60));
}

function act(t) {
  if (!t) return;
  if (t.kind === 'hot') {
    const [name, ...args] = t.hot.action;
    if (t.hot.dir) args.push(t.dir);
    A[name](...args);
  } else if (t.kind === 'fwd') {
    follow(t.link);
  } else if (t.kind === 'left' || t.kind === 'right') {
    turnBy(t.kind === 'left' ? -1 : 1, 90);
  } else {
    step(t.kind);
  }
}

// ---------------------------------------------------------------- input
const viewXY = (e) => {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
};
const usable = () => game.playing && !ui.blocked;
let drag = null;

// ---------------------------------------------------------------- two ways to look
// The rules for taking and letting go of the mouse are in engine/look.js. Here is what they act on.
const LOOK_SAVE_MS = 400; // a turn of the head is saved once the mouse has been still this long
let markerDirty = true,
  lastMarker = 0,
  lookSave = 0;
const marker = document.getElementById('marker');
const freeLook = createLook({
  canvas,
  doc: document,
  // reaching for localStorage at all throws where storage is blocked, so it is only touched inside look.js's guards
  storage: { getItem: (k) => localStorage.getItem(k), setItem: (k, v) => localStorage.setItem(k, v) },
  canLock: 'requestPointerLock' in canvas && !window.matchMedia('(pointer: coarse)').matches,
  standing: () => usable() && !NODES[game.state.node].cam,
  steady: () => usable() && !busy(),
  onTurn(right, down) {
    const s = game.state;
    s.yaw = norm(s.yaw + right);
    s.pitch = clamp(s.pitch - down, -PITCH_LIMIT, PITCH_LIMIT);
    s.facing = nearestFace(s.yaw);
    lookDirty = true;
    clearTimeout(lookSave);
    lookSave = setTimeout(() => game.playing && Store.save(game.state), LOOK_SAVE_MS);
  },
  onMode: (mode, canLock) => ui.look(mode, canLock),
  onChange: () => (markerDirty = true),
  onHeld: (held) => (marker.hidden = !held),
});
const locked = freeLook.locked;

/** Show, in the middle of the picture, what a click would do right now. */
function drawMarker(now) {
  if (!locked() || !markerDirty || now - lastMarker < 70) return;
  lastMarker = now;
  markerDirty = false;
  const icon = usable() && !busy() ? cursorFor(targetAt(0.5, 0.5)) : null;
  marker.style.backgroundImage = (icon && icon.startsWith('url(') ? icon : DOT).split(' 16 16')[0];
}

document.getElementById('stage').addEventListener('contextmenu', (e) => game.playing && e.preventDefault());

canvas.addEventListener('pointerdown', (e) => {
  if (!usable()) return;
  if (locked()) {
    // free look: the left button acts on whatever the marker is on, the right one brings the pointer back
    sound.start();
    if (e.button === 2) freeLook.toggle();
    else if (e.button === 0 && !busy()) act(targetAt(0.5, 0.5));
    return;
  }
  if (e.button === 2) return freeLook.toggle();
  if (freeLook.wanted()) return freeLook.sync(); // free look lost the mouse without being asked: a click takes it again
  if (e.button > 0) return;
  sound.start();
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: game.state.yaw, pitch: game.state.pitch, moved: false };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (locked()) return;
  if (!usable()) return (canvas.style.cursor = 'default');
  if (drag && drag.id === e.pointerId) {
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    const s = game.state;
    if (NODES[s.node].cam || busy()) return;
    // the picture follows the pointer, as if you had taken hold of it
    const r = canvas.getBoundingClientRect();
    s.yaw = norm(drag.yaw - (dx / r.width) * HFOV);
    s.pitch = clamp(drag.pitch + (dy / r.height) * VFOV, -PITCH_LIMIT, PITCH_LIMIT);
    s.facing = nearestFace(s.yaw);
    lookDirty = true;
    canvas.style.cursor = 'grabbing';
    return;
  }
  if (!busy()) canvas.style.cursor = cursorFor(targetAt(...viewXY(e)));
});

function release(e, cancelled) {
  if (!drag || drag.id !== e.pointerId) return;
  const d = drag;
  drag = null;
  if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  if (!usable()) return;
  if (d.moved) {
    Store.save(game.state);
  } else if (!cancelled && !busy()) {
    act(targetAt(...viewXY(e)));
  }
  if (!busy()) canvas.style.cursor = cursorFor(targetAt(...viewXY(e)));
}
canvas.addEventListener('pointerup', (e) => release(e, false));
canvas.addEventListener('pointercancel', (e) => release(e, true));

// arrows or WASD: the same four moves
const MOVES = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'fwd', w: 'fwd', ArrowDown: 'back', s: 'back' };

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return ui.closeDoc();
  if (!usable() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === ' ') {
    e.preventDefault();
    if (!e.repeat) freeLook.toggle();
    return;
  }
  const dir = MOVES[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (!dir) return;
  e.preventDefault();
  if (!busy()) step(dir);
  freeLook.sync(); // a key press is also a chance to take the mouse back, if free look had lost it
});
// Space is the mode switch, so it must not also press whichever button was clicked last
window.addEventListener('keyup', (e) => e.key === ' ' && usable() && e.preventDefault());

// ---------------------------------------------------------------- start, title, loop
function clearTimers() {
  for (const t of timers) clearTimeout(t);
  timers.clear();
}

function begin(state, fresh) {
  clearTimers();
  const n = NODES[state.node];
  if (typeof state.yaw !== 'number' || typeof state.pitch !== 'number' || !isFinite(state.yaw + state.pitch)) {
    // a new game, or a save from before free look
    state.facing = YAW[state.facing] === undefined ? START.facing : state.facing;
    state.yaw = YAW[state.facing];
    state.pitch = composedPitch(n, state.facing);
  }
  state.pitch = clamp(state.pitch, -PITCH_LIMIT, PITCH_LIMIT);
  if (state.flags.finished && !state.flags.finished2) {
    // a save that reached the old end of the demo: the vault now has a way on
    delete state.flags.finished;
    state.flags.hatchOpen = true;
  }
  game.state = state;
  fading = false;
  game.playing = true;
  move = null;
  drag = null;
  sound.start();
  renderer.fade(1, 1200);
  ui.say('');
  game.changed(900);
  if (state.node === 'quayMid') arrive('quayMid'); // resumed on the quay with the lamp already lit
  if (fresh) game.read('orders', () => ui.say('Holland Island, an hour before dark. The boat has already put about.'));
}

function showTitle() {
  clearTimers();
  game.playing = false;
  move = null;
  drag = null;
  const saved = Store.load();
  // the title sits over a view of the island from the water
  world.sync({ ...(saved || Store.newState()), node: START.node });
  camera.position.set(13, 3.2, 62);
  camera.lookAt(-2, 5.5, -10);
  camera.updateMatrixWorld();
  renderer.fade(1, 600);
  renderer.show(scene, camera, 0);
  ui.inventory({ inv: [] });
  ui.say('');
  ui.title(
    !!saved && !saved.flags.finished3,
    () => {
      Store.clear();
      begin(Store.newState(), true);
    },
    () => begin(saved, false),
    () => {
      // skip straight to the foot of the stairs, with chapter one counted as played
      Store.clear();
      begin(Store.chapterTwoState(), false);
      arrive('stairfoot', true);
      Store.save(game.state);
    },
    () => {
      // or to the gallery above the pen, with chapters one and two counted as played
      Store.clear();
      begin(Store.chapterThreeState(), false);
      arrive('gallery', true);
      Store.save(game.state);
    },
  );
}

let lastLive = 0;
function frame(now) {
  requestAnimationFrame(frame);
  renderer.tick(now);
  let redraw = false;
  if (move) {
    stepMove(now);
    redraw = true;
  } else if (lookDirty) {
    placeCamera();
    redraw = true;
  }
  lookDirty = false;
  if (game.playing && NODES[game.state.node].live && now - lastLive > 90) {
    lastLive = now;
    if (world.tick(game.state.node)) redraw = true;
  }
  if (redraw) {
    renderer.refresh(scene, camera);
    markerDirty = true;
  }
  drawMarker(now);
}

// The hook the automated tests drive the game through, also handy in the browser console while developing.
// The published game does not carry it: `npm run build` leaves this whole block out.
// `npm run dev` keeps it, and so does `npm run build:test`, which sets the flag (see .env.test).
if (import.meta.env.DEV || import.meta.env.VITE_KESTREL_HOOK) {
  window.kestrel = {
    game,
    renderer,
    scene,
    nodes: NODES,
    start: START,
    /** Multiplies the length of every glide and turn. Tests set it low. */
    get timeScale() {
      return timeScale;
    },
    set timeScale(v) {
      timeScale = v;
    },
    /** True while the camera is gliding or turning. */
    busy,
    /** Rough, quick drawing for the automated play-through (see renderer.smooth). */
    draft(on = true) {
      renderer.smooth(!on);
      renderer.refresh(scene, camera);
    },
    /** Screen point (0..1) that triggers a hotspot from the current view, or null. */
    point: (id, dir = 0) => pointFor(scene, camera, id, game.state.node, dir, !NODES[game.state.node].cam),
    /** 'free' or 'cursor', and a way to choose. Tests play in 'cursor'. */
    look: () => freeLook.mode,
    setLook: (mode, remember) => freeLook.set(mode, remember),
    /** What a click in free look would act on: null, or { kind, id }. */
    centre() {
      const t = targetAt(0.5, 0.5);
      return t && { kind: t.kind, id: t.kind === 'hot' ? t.hot.id : t.kind === 'fwd' ? t.link.to : null };
    },
    /** Cut straight to a node, optionally at an exact yaw and pitch in degrees. */
    jump(node, facing, yaw, pitch) {
      game.go(node, facing, true);
      if (typeof yaw === 'number' && !NODES[node].cam) {
        game.state.yaw = norm(yaw);
        game.state.pitch = pitch || 0;
        game.state.facing = nearestFace(yaw);
        placeCamera();
        renderer.show(scene, camera, 0);
      }
    },
  };
}

ui.sound(true);
ui.look(freeLook.mode, freeLook.canLock);
showTitle();
requestAnimationFrame(frame);
