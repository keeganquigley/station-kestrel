import { describe, it, expect } from 'vitest';
import { YAW, norm, turnBetween, clamp, smooth, nearestFace, composedPitch, bearingTo, linksFrom, nearestLink, nextStop } from '../src/engine/compass.js';
import { NODES } from '../src/data/nodes.js';

const standing = Object.entries(NODES).filter(([, n]) => !n.cam);

describe('bearings', () => {
  it('are kept from 0 up to 360', () => {
    expect(norm(0)).toBe(0);
    expect(norm(360)).toBe(0);
    expect(norm(-45)).toBe(315);
    expect(norm(725)).toBe(5);
    expect(norm(-720)).toBe(0);
  });

  it('turn by the shorter way, clockwise positive', () => {
    expect(turnBetween(90, 0)).toBe(90);
    expect(turnBetween(0, 90)).toBe(-90);
    expect(turnBetween(10, 350)).toBe(20);
    expect(turnBetween(350, 10)).toBe(-20);
    expect(turnBetween(180, 0)).toBe(180);
    expect(turnBetween(45, 45)).toBe(0);
  });

  it('are nearest one of the four compass points', () => {
    expect(nearestFace(0)).toBe('N');
    expect(nearestFace(44)).toBe('N');
    expect(nearestFace(46)).toBe('E');
    expect(nearestFace(180)).toBe('S');
    expect(nearestFace(269)).toBe('W');
    expect(nearestFace(316)).toBe('N');
    expect(nearestFace(-90)).toBe('W');
  });

  it('run from one point to another with north up the map', () => {
    // +x is east and +z is south
    expect(bearingTo([0, 0, 0], [0, 0, -5])).toBe(0);
    expect(bearingTo([0, 0, 0], [5, 0, 0])).toBe(90);
    expect(bearingTo([0, 0, 0], [0, 0, 5])).toBe(180);
    expect(bearingTo([0, 0, 0], [-5, 0, 0])).toBe(270);
    expect(bearingTo([2, 9, 2], [5, -3, -1])).toBeCloseTo(45);
  });
});

describe('easing and limits', () => {
  it('clamp holds a value between two limits', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('a glide starts and ends gently and never runs backwards', () => {
    expect(smooth(0)).toBe(0);
    expect(smooth(1)).toBe(1);
    expect(smooth(0.5)).toBe(0.5);
    let last = 0;
    for (let k = 0; k <= 1.0001; k += 0.05) {
      expect(smooth(k)).toBeGreaterThanOrEqual(last);
      last = smooth(k);
    }
    expect(smooth(0.1)).toBeLessThan(0.1);
    expect(smooth(0.9)).toBeGreaterThan(0.9);
  });
});

describe('turning in stops', () => {
  it('goes to the next stop round, either way', () => {
    expect(nextStop(0, 1, 45)).toBe(45);
    expect(nextStop(0, -1, 45)).toBe(315);
    expect(nextStop(315, 1, 45)).toBe(0);
    expect(nextStop(0, 1, 90)).toBe(90);
    expect(nextStop(270, 1, 90)).toBe(0);
  });

  it('from between two stops goes to the nearer one in that direction, not a whole step', () => {
    expect(nextStop(10, 1, 45)).toBe(45);
    expect(nextStop(10, -1, 45)).toBe(0);
    expect(nextStop(350, 1, 90)).toBe(0);
    expect(nextStop(350, -1, 90)).toBe(270);
    expect(nextStop(33, 1, 45)).toBe(45);
  });

  it('is not fooled by a bearing a hair off a stop', () => {
    expect(nextStop(45 + 1e-9, 1, 45)).toBe(90);
    expect(nextStop(45 - 1e-9, 1, 45)).toBe(90);
    expect(nextStop(45 + 1e-9, -1, 45)).toBe(0);
    expect(nextStop(45 - 1e-9, -1, 45)).toBe(0);
  });

  it('eight turns of 45 degrees bring you back where you started', () => {
    for (const dir of [1, -1]) {
      let yaw = 90;
      for (let i = 0; i < 8; i++) yaw = nextStop(yaw, dir, 45);
      expect(yaw).toBe(90);
    }
  });
});

describe('the view each place was composed for', () => {
  it('tips up or down by the place’s own tilt, and a touch down where none is given', () => {
    expect(composedPitch({}, 'N')).toBeCloseTo((Math.atan(-0.05) * 180) / Math.PI);
    expect(composedPitch({ tilt: { W: 0.3 } }, 'W')).toBeGreaterThan(0);
    expect(composedPitch({ tilt: { W: 0.3 } }, 'N')).toBeCloseTo(composedPitch({}, 'N'));
    expect(composedPitch({ tilt: { E: -0.27 } }, 'E')).toBeLessThan(composedPitch({}, 'E'));
  });

  it('is within what free look can reach, at every place and facing', () => {
    for (const [id, n] of standing) for (const f of n.faces) expect(Math.abs(composedPitch(n, f)), `${id} ${f}`).toBeLessThan(42);
  });
});

describe('the links from a place', () => {
  it('a close-up has none: you step back out of it', () => {
    expect(linksFrom('gen')).toEqual([]);
  });

  it('carry where they lead, the facing you arrive with, and any gate', () => {
    const door = linksFrom('door');
    expect(door.map((l) => l.to).sort()).toEqual(['vestibule', 'yard']);
    expect(door.find((l) => l.to === 'vestibule').gate).toBe('door');
    expect(door.find((l) => l.to === 'vestibule').face).toBe('N');
  });

  it('a fade to another realm points the way it is labelled, since the other realm is nowhere near', () => {
    const down = linksFrom('vault').find((l) => l.fade);
    expect(down.to).toBe('stairfoot');
    expect(down.bearing).toBe(YAW.N);
  });

  it('each lies close enough to the facing it is listed under that a click straight ahead finds it', () => {
    // main.js walks a link when you click within 26 degrees of it
    for (const [id, n] of standing) {
      const links = linksFrom(id);
      Object.keys(n.fwd).forEach((face, i) => expect(Math.abs(turnBetween(links[i].bearing, YAW[face])), `${id} ${face}`).toBeLessThan(26));
    }
  });

  it('facing a compass point and stepping forward takes the link listed for it, and no other', () => {
    // main.js steps forward along the link within 60 degrees of where you are looking
    for (const [id, n] of standing) {
      const links = linksFrom(id);
      Object.keys(n.fwd).forEach((face, i) => expect(nearestLink(links, YAW[face], 60).to, `${id} ${face}`).toBe(links[i].to));
    }
  });
});

describe('choosing a link by where you look', () => {
  const links = [
    { to: 'a', bearing: 0 },
    { to: 'b', bearing: 90 },
    { to: 'c', bearing: 200 },
  ];

  it('takes the nearest', () => {
    expect(nearestLink(links, 10, 60).to).toBe('a');
    expect(nearestLink(links, 50, 60).to).toBe('b');
    expect(nearestLink(links, 350, 60).to).toBe('a');
  });

  it('takes none when nothing lies within the limit', () => {
    expect(nearestLink(links, 140, 26)).toBe(null);
    expect(nearestLink([], 0, 60)).toBe(null);
  });

  it('passes over a way that is shut', () => {
    const open = (l) => l.to !== 'a';
    expect(nearestLink(links, 10, 60, open)).toBe(null);
    expect(nearestLink(links, 40, 60, open).to).toBe('b');
  });
});
