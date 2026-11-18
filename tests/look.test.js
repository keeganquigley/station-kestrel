import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLook, SENSITIVITY, MAX_TRAVEL, SETTLE_MS, FOCUS_MS } from '../src/engine/look.js';

/** A browser that only takes notes: it grants the mouse when asked and lets go when told. */
function fakeBrowser({ stored = null, storageWorks = true } = {}) {
  const handlers = {};
  const items = new Map(stored === null ? [] : [['station-kestrel-look', stored]]);
  const canvas = {
    asked: 0,
    requestPointerLock() {
      canvas.asked++;
    },
  };
  const doc = {
    pointerLockElement: null,
    focused: true,
    body: {},
    activeElement: null,
    addEventListener: (name, fn) => (handlers[name] = fn),
    exitPointerLock() {
      doc.exited++;
    },
    exited: 0,
    hasFocus: () => doc.focused,
  };
  const storage = storageWorks
    ? { getItem: (k) => (items.has(k) ? items.get(k) : null), setItem: (k, v) => items.set(k, v) }
    : {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      };
  return {
    canvas,
    doc,
    storage,
    items,
    /** The browser hands the mouse over, or takes it back, and says so. */
    hold(on) {
      doc.pointerLockElement = on ? canvas : null;
      handlers.pointerlockchange();
    },
    move: (x, y) => handlers.mousemove({ movementX: x, movementY: y }),
  };
}

function setup({ canLock = true, stored, storageWorks } = {}) {
  const b = fakeBrowser({ stored, storageWorks });
  const where = { standing: true, steady: true, clock: 0 };
  const seen = { turns: [], modes: [], held: [], changes: 0 };
  const look = createLook({
    canvas: b.canvas,
    doc: b.doc,
    storage: b.storage,
    canLock,
    standing: () => where.standing,
    steady: () => where.steady,
    onTurn: (right, down) => seen.turns.push([right, down]),
    onMode: (mode) => seen.modes.push(mode),
    onChange: () => seen.changes++,
    onHeld: (held) => seen.held.push(held),
    now: () => where.clock,
  });
  return { b, where, seen, look };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('choosing a way to look', () => {
  it('free look is the default where it can be had', () => {
    expect(setup().look.mode).toBe('free');
  });

  it('a device that cannot do free look always has the pointer, and cannot switch', () => {
    const { look, b } = setup({ canLock: false });
    expect(look.mode).toBe('cursor');
    look.toggle();
    expect(look.mode).toBe('cursor');
    look.set('free');
    expect(look.mode).toBe('cursor');
    expect(b.canvas.asked).toBe(0);
  });

  it('a deliberate choice is remembered for next time', () => {
    const { look, b } = setup();
    look.toggle();
    expect(look.mode).toBe('cursor');
    expect(b.items.get('station-kestrel-look')).toBe('cursor');
    expect(setup({ stored: 'cursor' }).look.mode).toBe('cursor');
    look.toggle();
    expect(b.items.get('station-kestrel-look')).toBe('free');
  });

  it('with no storage the game still starts in free look, and switching still works', () => {
    const { look } = setup({ storageWorks: false });
    expect(look.mode).toBe('free');
    look.toggle();
    expect(look.mode).toBe('cursor');
  });

  it('says which way is chosen each time one is', () => {
    const { look, seen } = setup();
    look.toggle();
    look.toggle();
    expect(seen.modes).toEqual(['cursor', 'free']);
  });

  it('switching takes the focus off whatever button was pressed last, so Space does not press it again', () => {
    const { look, b } = setup();
    let blurred = 0;
    b.doc.activeElement = { blur: () => blurred++ };
    look.toggle();
    expect(blurred).toBe(1);
  });
});

describe('taking and letting go of the mouse', () => {
  it('asks for the mouse only while free look is chosen and you are standing somewhere', () => {
    const { look, b, where } = setup();
    look.sync();
    expect(b.canvas.asked).toBe(1);
    where.standing = false;
    look.sync();
    expect(b.canvas.asked).toBe(1);
  });

  it('a browser that refuses the mouse is no trouble: the next click asks again', () => {
    const { look, b } = setup();
    b.canvas.requestPointerLock = () => {
      throw new Error('not now');
    };
    expect(() => look.sync()).not.toThrow();
    b.canvas.requestPointerLock = () => Promise.reject(new Error('not now'));
    expect(() => look.sync()).not.toThrow();
  });

  it('lets go when a paper or a close-up comes up, and that is not taken for Esc', () => {
    const { look, b, where } = setup();
    look.sync();
    b.hold(true);
    where.standing = false;
    look.sync();
    expect(b.doc.exited).toBe(1);
    b.hold(false);
    vi.advanceTimersByTime(FOCUS_MS * 2);
    expect(look.mode).toBe('free');
  });

  it('a paper picked up and put down before the browser has let go is still not taken for Esc', () => {
    const { look, b, where } = setup();
    look.sync();
    b.hold(true);
    where.standing = false;
    look.sync(); // we let go
    where.standing = true;
    look.sync(); // and want it again, before the browser has said it let go
    b.hold(false);
    vi.advanceTimersByTime(FOCUS_MS * 2);
    expect(look.mode).toBe('free');
  });

  it('a mouse granted after a paper has come up is handed straight back', () => {
    const { look, b, where } = setup();
    look.sync();
    where.standing = false;
    b.hold(true);
    expect(b.doc.exited).toBe(1);
    b.hold(false);
    vi.advanceTimersByTime(FOCUS_MS * 2);
    expect(look.mode).toBe('free');
  });

  it('Esc brings the pointer back for now, without changing what is remembered', () => {
    const { look, b } = setup({ stored: 'free' });
    look.sync();
    b.hold(true);
    b.hold(false);
    expect(look.mode).toBe('free'); // not yet: the focus may still be about to change
    vi.advanceTimersByTime(FOCUS_MS);
    expect(look.mode).toBe('cursor');
    expect(b.items.get('station-kestrel-look')).toBe('free');
  });

  it('losing the mouse to another window leaves free look chosen', () => {
    const { look, b } = setup();
    look.sync();
    b.hold(true);
    b.doc.focused = false;
    b.hold(false);
    vi.advanceTimersByTime(FOCUS_MS * 2);
    expect(look.mode).toBe('free');
    expect(look.wanted()).toBe(true);
  });

  it('tells the page when the mouse is taken and let go, so the marker can come and go', () => {
    const { b, seen } = setup();
    b.hold(true);
    b.hold(false);
    expect(seen.held).toEqual([true, false]);
  });
});

describe('the mouse turning your head', () => {
  const held = () => {
    const t = setup();
    t.look.sync();
    t.b.hold(true);
    return t;
  };

  it('ignores the first report after the mouse is taken, and any for a moment after', () => {
    const { b, seen, where } = held();
    b.move(500, 500);
    where.clock = SETTLE_MS - 1;
    b.move(10, 0);
    expect(seen.turns).toEqual([]);
    where.clock = SETTLE_MS;
    b.move(10, 0);
    expect(seen.turns).toEqual([[10 * SENSITIVITY, 0]]);
  });

  it('turns right and tips down by the travel, and never believes more than a hand could do', () => {
    const { b, seen, where } = held();
    b.move(0, 0);
    where.clock = SETTLE_MS;
    b.move(100, -40);
    b.move(5000, -5000);
    expect(seen.turns[0][0]).toBeCloseTo(100 * SENSITIVITY);
    expect(seen.turns[0][1]).toBeCloseTo(-40 * SENSITIVITY);
    expect(seen.turns[1][0]).toBeCloseTo(MAX_TRAVEL * SENSITIVITY);
    expect(seen.turns[1][1]).toBeCloseTo(-MAX_TRAVEL * SENSITIVITY);
  });

  it('does nothing while the camera is moving, or without the mouse', () => {
    const { b, seen, where } = held();
    b.move(0, 0);
    where.clock = SETTLE_MS;
    where.steady = false;
    b.move(10, 0);
    where.steady = true;
    b.hold(false);
    b.move(10, 0);
    expect(seen.turns).toEqual([]);
  });

  it('starts settling again each time the mouse is taken', () => {
    const { b, seen, where } = held();
    b.move(0, 0);
    where.clock = SETTLE_MS;
    b.hold(false);
    b.hold(true);
    b.move(300, 0);
    expect(seen.turns).toEqual([]);
  });
});
