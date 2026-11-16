import { describe, it, expect, afterEach } from 'vitest';
import { createActions } from '../src/actions.js';
import * as Gen from '../src/puzzles/generator.js';
import * as Rx from '../src/puzzles/receiver.js';
import * as Cipher from '../src/puzzles/cipher.js';
import * as Pump from '../src/puzzles/pump.js';
import * as Junction from '../src/puzzles/junction.js';
import * as Reply from '../src/puzzles/reply.js';
import * as Darkroom from '../src/puzzles/darkroom.js';
import * as Tally from '../src/puzzles/tally.js';
import * as Telegraph from '../src/puzzles/telegraph.js';
import { NODES } from '../src/data/nodes.js';
import { DOCS, ITEMS, LOOK, SAY } from '../src/data/documents.js';
import { newState, chapterTwoState, chapterThreeState } from '../src/engine/state.js';

// ---------------------------------------------------------------- a game that only takes notes

/** Anything handed to say() that was not a line of text, in whichever test is running. */
const notText = [];

// no test here may put an undefined caption on the screen, whatever else it is about
afterEach(() => {
  expect(notText.splice(0)).toEqual([]);
});

/**
 * What createActions needs of the game in main.js, with nothing drawn and nothing heard:
 * it keeps the state and writes down everything it is asked to do.
 */
function play(state = newState()) {
  const game = {
    state,
    said: [],
    sounds: [],
    given: [],
    timers: [],
    papers: [],
    walked: [],
    faded: [],
    redraws: [],
    say(text) {
      if (typeof text !== 'string') notText.push(text);
      game.said.push(text);
    },
    sfx: (name) => game.sounds.push(name),
    has: (item) => game.state.inv.includes(item),
    give(item) {
      game.given.push(item);
      if (!game.has(item)) game.state.inv.push(item);
    },
    after: (ms, fn) => game.timers.push({ ms, fn }),
    read: (id, onClose) => game.papers.push({ id, onClose }),
    go(node, facing) {
      game.walked.push([node, facing]);
      game.state.node = node;
    },
    fadeTo(node, facing) {
      game.faded.push([node, facing]);
      game.state.node = node;
    },
    changed: (ms) => game.redraws.push(ms),
  };
  return { game, ...createActions(game) };
}

/** Let every waiting timer run out. */
const elapse = (game) => game.timers.splice(0).forEach((t) => t.fn());

/** Put down a paper that is being read. */
const putDown = (paper) => paper.onClose && paper.onClose();

const last = (list) => list[list.length - 1];
const count = (list, x) => list.filter((y) => y === x).length;

/** Every count of what the game has been asked to do, to tell whether a click did anything at all. */
const asked = (game) => [game.said, game.sounds, game.given, game.timers, game.papers, game.walked, game.faded, game.redraws].map((l) => l.length);

// ---------------------------------------------------------------- solving, by clicking

// Each of these works a puzzle the way a player does, through the handlers, and takes the answer
// from the puzzle's own module.

/** Turn thumbwheels up until they show the given figures. */
const dial = (spin, wheels, figures) =>
  [...figures].forEach((d, i) => {
    while (wheels()[i] !== Number(d)) spin(i, 1);
  });

const startEngine = ({ A }) => ['valve', ...Array(Gen.PRIME_COUNT).fill('prime'), 'choke', 'starter', 'choke'].forEach((what) => A.gen(what));

const closeBreakers = ({ A }) => Gen.solutions()[0].forEach((id) => A.gen('breaker:' + id));

const powerUp = (k) => {
  startEngine(k);
  closeBreakers(k);
};

const aimMast = ({ A, game }) => {
  while (game.state.rx.bearing !== Rx.TARGET_BEARING) A.mast(1);
};

/** The three tuning knobs on the receiver, coarse to fine, as src/world/ops.js fits them. */
const KNOBS = [1000, 100, 10];

const tuneTo = ({ A, game }, khz) => {
  for (const step of KNOBS) while (Math.abs(khz - game.state.rx.khz) >= step) A.tune(step, Math.sign(khz - game.state.rx.khz));
};

const tuneIn = (k) => tuneTo(k, Rx.TARGET_KHZ);

const takeKeyAndOpenDrawer = ({ A }) => {
  A.key();
  A.drawer();
};

const openVault = ({ A, game }) => {
  dial(A.wheel, () => game.state.vault.wheels, Cipher.COMBINATION);
  A.vaulthandle();
};

const readLastWord = ({ A, game }) => {
  A.final();
  putDown(last(game.papers));
};

const drainTunnel = ({ A }) => {
  for (const [valve, dir] of Pump.solve()) A.valve(valve, dir);
  A.prime();
};

const landCores = ({ A, game }, wiring = Junction.WIRING) => {
  for (const c of Junction.CORES) while (game.state.junction.sel[c] !== wiring[c]) A.core(c, 1);
};

const connectLine = (k) => {
  landCores(k);
  k.A.isolator();
};

const setReply = ({ A, game }) => dial(A.rwheel, () => game.state.reply.wheels, Reply.EXPECTED);

const answerDoor = (k) => {
  setReply(k);
  k.A.send();
};

const setTimers = ({ A, game }, minutes = Darkroom.target()) =>
  dial(
    A.timer,
    () => game.state.darkroom.wheels,
    minutes.flatMap((m) => [Math.floor(m / 10), m % 10]),
  );

const developFilm = (k) => {
  k.A.film();
  setTimers(k);
  k.A.safelight();
  k.A.develop();
};

const setTallies = ({ A, game }, owner = Tally.OWNER) => {
  for (const n of Tally.NAMES) while (game.state.tally.set[n] !== owner[n]) A.tally(n, 1);
};

const drawBar = (k) => {
  setTallies(k);
  k.A.cagebar();
};

const setDocket = ({ A, game }, docket = Telegraph.DOCKET) => dial(A.twheel, () => game.state.telegraph.wheels, docket);

const callPaper = (k) => {
  setDocket(k);
  k.A.call();
};

/** Read whatever is on the telegraph drum, to the end. */
const readWire = ({ A, game }) => {
  A.wirepaper();
  putDown(last(game.papers));
};

const CHAPTER_ONE = [startEngine, closeBreakers, aimMast, tuneIn, ({ A }) => A.print(), takeKeyAndOpenDrawer, openVault, readLastWord, ({ A }) => A.descend()];
const CHAPTER_TWO = [drainTunnel, connectLine, ({ A }) => A.doorprint(), answerDoor, ({ A }) => A.doorprint()];
const CHAPTER_THREE = [developFilm, drawBar, ({ A }) => A.cage('casualty'), callPaper, readWire, readWire, ({ A }) => A.viewport()];

const STARTS = [
  { from: 'a new game', start: newState, chapters: [CHAPTER_ONE, CHAPTER_TWO, CHAPTER_THREE] },
  { from: 'the start of chapter two', start: chapterTwoState, chapters: [CHAPTER_TWO, CHAPTER_THREE] },
  { from: 'the start of chapter three', start: chapterThreeState, chapters: [CHAPTER_THREE] },
];

// ---------------------------------------------------------------- gates

describe('gated ways', () => {
  const SILENT = ['vault', 'hatch', 'water', 'blast'];

  /** How each one is opened, from a new game. */
  const OPEN = {
    vault: (k) => {
      powerUp(k);
      openVault(k);
    },
    hatch: readLastWord,
    water: drainTunnel,
    blast: (k) => {
      connectLine(k);
      answerDoor(k);
    },
  };

  it('the station door passes you only while the bus is live, and buzzes when it will not', () => {
    const k = play();
    const sets = Gen.solutions().map((ids) => [...ids].sort().join());
    let opened = 0;
    for (let mask = 0; mask < 1 << Gen.BREAKERS.length; mask++) {
      for (const running of [false, true]) {
        for (const choke of [false, true]) {
          const breakers = Object.fromEntries(Gen.BREAKERS.map((b, i) => [b.id, !!(mask & (1 << i))]));
          const on = Gen.BREAKERS.filter((b) => breakers[b.id]).map((b) => b.id);
          const live = running && !choke && sets.includes(on.sort().join());
          const where = `${on.join('+') || 'nothing'} on, ${running ? 'running' : 'stopped'}, choke ${choke ? 'out' : 'home'}`;
          k.game.state.gen = { valve: true, primes: 0, choke, running, breakers };
          k.game.sounds.length = 0;
          expect(k.gates.door(), where).toBe(live ? null : SAY.doorDead);
          expect(k.game.sounds, where).toEqual(live ? [] : ['buzz']);
          if (live) opened++;
        }
      }
    }
    expect(opened).toBe(Gen.solutions().length);
    expect(k.game.said).toEqual([]); // the refusal is handed back for main.js to say
  });

  it('clicking the door does what walking at it does', () => {
    const k = play();
    k.A.door();
    expect(k.game.walked).toEqual([]);
    expect(k.game.said).toEqual([SAY.doorDead]);
    expect(k.game.sounds).toEqual(['buzz']);
    powerUp(k);
    k.A.door();
    expect(k.game.walked).toEqual([[NODES.door.fwd.N.to, 'N']]);
    expect(count(k.game.said, SAY.doorDead)).toBe(1);
  });

  it('the vault, the hatch, the water and the blast door are all shut in a new game, and say nothing about it', () => {
    const k = play();
    for (const name of SILENT) {
      expect(k.gates[name](), name).toBe(false);
      expect(k.shut[name](), name).toBe(true);
    }
    expect(asked(k.game)).toEqual(asked(play().game));
  });

  it('each opens on its own puzzle and on no other', () => {
    for (const name of SILENT) {
      const k = play();
      OPEN[name](k);
      for (const other of SILENT) {
        expect(k.gates[other](), `${other} after opening ${name}`).toBe(other === name ? null : false);
        expect(k.shut[other](), `${other} after opening ${name}`).toBe(other !== name);
      }
    }
  });

  it('a wrong try leaves each one shut', () => {
    const tries = {
      vault: [
        (k) => openVault(k), // the right figures on a dead lock
        (k) => {
          powerUp(k);
          k.A.wheel(0, 1);
          k.A.vaulthandle();
        },
        (k) => {
          powerUp(k);
          dial(k.A.wheel, () => k.game.state.vault.wheels, Cipher.COMBINATION);
          k.A.wheel(3, -1);
          k.A.vaulthandle();
        },
      ],
      hatch: [({ A }) => A.final()], // printed, and still in your hand
      water: [({ A }) => A.prime(), ({ A }) => [A.valve(0, 1), A.prime()]],
      blast: [
        (k) => answerDoor(k), // the right figures on a dead line
        (k) => [connectLine(k), k.A.send()],
        (k) => [connectLine(k), setReply(k), k.A.rwheel(Reply.WHEELS - 1, 1), k.A.send()],
      ],
    };
    for (const name of SILENT) {
      tries[name].forEach((attempt, i) => {
        const k = play();
        attempt(k);
        expect(k.gates[name](), `${name}, try ${i}`).toBe(false);
        expect(k.shut[name](), `${name}, try ${i}`).toBe(true);
      });
    }
  });

  it('once open they stay open, whatever is turned afterwards', () => {
    const k = play();
    CHAPTER_ONE.concat(CHAPTER_TWO).forEach((step) => step(k));
    k.A.wheel(0, 1);
    k.A.vaulthandle();
    k.A.valve(0, 1);
    k.A.prime();
    k.A.rwheel(0, 1);
    k.A.send();
    readLastWord(k);
    for (const name of SILENT) {
      expect(k.gates[name](), name).toBeNull();
      expect(k.shut[name](), name).toBe(false);
    }
  });

  it('shut agrees with gates in every state', () => {
    const solved = chapterThreeState();
    const states = [newState(), chapterTwoState(), chapterThreeState()];
    // every combination of the four being open or shut
    for (let mask = 0; mask < 1 << SILENT.length; mask++) {
      const s = newState();
      if (mask & 1) s.vault = { ...solved.vault };
      if (mask & 2) s.flags.hatchOpen = true;
      if (mask & 4) s.pump = { ...solved.pump };
      if (mask & 8) s.reply = { ...solved.reply };
      states.push(s);
    }
    for (const state of states) {
      const { gates, shut } = play(state);
      for (const name of Object.keys(gates)) {
        const answer = gates[name]();
        // null lets you through, false stops you without a word, anything else is the line to say
        if (answer !== null && answer !== false) expect(typeof answer, name).toBe('string');
        // a way that stops you without a word must not offer the walk-forward arrow
        if (answer === false) expect(Object.keys(shut), name).toContain(name);
      }
      for (const name of Object.keys(shut)) expect(shut[name](), name).toBe(gates[name]() !== null);
    }
  });

  it('every gate named on the map is one of these, and each of these is on the map', () => {
    const { gates, shut } = play();
    const named = new Set();
    for (const n of Object.values(NODES)) for (const link of Object.values(n.fwd || {})) if (link.gate) named.add(link.gate);
    expect([...named].sort()).toEqual(Object.keys(gates).sort());
    for (const name of Object.keys(shut)) expect(Object.keys(gates)).toContain(name);
  });

  it('the stairs down are taken only once the rack has swung out', () => {
    const k = play();
    k.A.descend();
    expect(k.game.faded).toEqual([]);
    readLastWord(k);
    k.A.descend();
    expect(k.game.faded).toEqual([[NODES.vault.fwd.N.to, 'N']]);
  });
});

// ---------------------------------------------------------------- pickups

describe('things taken once', () => {
  const held = (game, item) => count(game.state.inv, item);

  it('the key', () => {
    const k = play();
    k.A.key();
    expect(k.game.state.flags.keyTaken).toBe(true);
    expect(k.game.given).toEqual(['key']);
    expect(held(k.game, 'key')).toBe(1);
    expect(k.game.said).toEqual([SAY.keyTake]);
    const before = asked(k.game);
    k.A.key();
    expect(asked(k.game)).toEqual(before); // the hook is bare: nothing at all happens
    expect(held(k.game, 'key')).toBe(1);
  });

  it('the drawer wants the key, opens once, and after that shows the booklet', () => {
    const k = play();
    k.A.drawer();
    expect(k.game.state.flags.drawerOpen).toBeUndefined();
    expect(k.game.said).toEqual([SAY.drawerLocked]);
    expect(k.game.papers).toEqual([]);

    k.A.key();
    k.A.drawer();
    expect(k.game.state.flags.drawerOpen).toBe(true);
    expect(last(k.game.said)).toBe(SAY.drawerOpen);
    expect(k.game.papers).toEqual([]);

    const said = k.game.said.length;
    k.A.drawer();
    k.A.drawer();
    expect(k.game.papers.map((p) => p.id)).toEqual(['pad', 'pad']);
    expect(k.game.said).toHaveLength(said);
    expect(count(k.game.sounds, 'drawer')).toBe(1);
    expect(k.game.given).toEqual(['key']);
  });

  it('the film, which the darkroom then uses up for good', () => {
    const k = play(chapterThreeState());
    k.A.film();
    expect(k.game.state.flags.filmTaken).toBe(true);
    expect(k.game.given).toEqual(['film']);
    expect(held(k.game, 'film')).toBe(1);
    expect(k.game.said).toEqual([SAY.filmTake]);

    k.A.film();
    expect(k.game.given).toEqual(['film']);
    expect(held(k.game, 'film')).toBe(1);
    expect(last(k.game.said)).toBe(LOOK.cameraEmpty);

    setTimers(k);
    k.A.safelight();
    k.A.develop();
    expect(held(k.game, 'film')).toBe(0);
    expect(held(k.game, 'photo')).toBe(1);
    k.A.film();
    expect(held(k.game, 'film')).toBe(0);
    expect(last(k.game.said)).toBe(LOOK.cameraEmpty);
    k.A.develop();
    expect(held(k.game, 'photo')).toBe(1);
    expect(k.game.given).toEqual(['film', 'photo']);
  });

  it('the printout, which is not there to take until the teleprinter has printed', () => {
    const k = play();
    k.A.print();
    expect(k.game.said).toEqual([SAY.paperBlank]);
    powerUp(k);
    tuneIn(k); // on frequency, the mast still off its bearing
    k.A.print();
    expect(last(k.game.said)).toBe(SAY.paperFaint);
    expect(k.game.given).toEqual([]);
    expect(k.game.papers).toEqual([]);

    aimMast(k);
    k.A.print();
    expect(k.game.given).toEqual(['printout']);
    expect(held(k.game, 'printout')).toBe(1);
    expect(last(k.game.said)).toBe(SAY.paperTake);
    expect(k.game.papers.map((p) => p.id)).toEqual(['printout']);

    const said = k.game.said.length;
    k.A.print();
    expect(k.game.given).toEqual(['printout']);
    expect(held(k.game, 'printout')).toBe(1);
    expect(k.game.said).toHaveLength(said);
    expect(k.game.papers.map((p) => p.id)).toEqual(['printout', 'printout']);
  });

  it('the printout is not handed over again to someone who starts at chapter two with it', () => {
    const k = play(chapterTwoState());
    k.A.print();
    expect(k.game.given).toEqual([]);
    expect(held(k.game, 'printout')).toBe(1);
    expect(k.game.papers.map((p) => p.id)).toEqual(['printout']);
  });

  it('everything handed over is a thing the inventory knows', () => {
    const k = play();
    CHAPTER_ONE.concat(CHAPTER_TWO, CHAPTER_THREE).forEach((step) => step(k));
    expect(k.game.given).toEqual(['printout', 'key', 'film', 'photo']);
    for (const item of k.game.given) expect(ITEMS[item], item).toBeTruthy();
    expect(new Set(k.game.state.inv).size).toBe(k.game.state.inv.length);
  });
});

// ---------------------------------------------------------------- solved puzzles

describe('the generator and the receiver', () => {
  it('the door runs back the first time the bus comes up, and only then', () => {
    const k = play();
    startEngine(k);
    expect(k.game.state.flags.doorOpened).toBeUndefined();
    closeBreakers(k);
    expect(Gen.busLive(k.game.state.gen)).toBe(true);
    expect(k.game.state.flags.doorOpened).toBe(true);
    expect(last(k.game.said)).toBe(SAY.live);
    expect(count(k.game.sounds, 'door')).toBe(1);

    const id = Gen.solutions()[0][0];
    k.A.gen('breaker:' + id);
    expect(last(k.game.said)).toBe(SAY.drop);
    k.A.gen('breaker:' + id);
    expect(last(k.game.said)).toBe(SAY.live);
    expect(count(k.game.sounds, 'door')).toBe(1);
  });

  it('says what the engine did', () => {
    const k = play();
    const said = (what) => {
      k.A.gen(what);
      return last(k.game.said);
    };
    const spare = Gen.BREAKERS.find((b) => !Gen.solutions()[0].includes(b.id)).id;
    expect(said('starter')).toBe(SAY.cough);
    expect(said('breaker:' + spare)).toBe(SAY.notRunning);
    k.A.gen('breaker:' + spare);
    expect(said('valve')).toBe(SAY.valveOpen);
    for (let n = 1; n <= Gen.PRIME_COUNT; n++) expect(said('prime')).toBe(SAY.prime(n));
    expect(said('choke')).toBe(SAY.chokeOut);
    expect(said('starter')).toBe(SAY.start);
    expect(said('starter')).toBe(SAY.already);
    expect(said('breaker:' + spare)).toBe(SAY.roughBus);
    k.A.gen('breaker:' + spare);
    expect(said('choke')).toBe(SAY.smooth);
    expect(said('choke')).toBe(SAY.roughAgain);
    k.A.gen('choke');
    expect(said('breaker:' + spare)).toBe(SAY.hunting);
    k.A.gen('breaker:' + spare);
    closeBreakers(k);
    expect(said('breaker:' + spare)).toBe(SAY.trip);
    expect(Gen.load(k.game.state.gen)).toBe(0);
    expect(said('valve')).toBe(SAY.stall);
    expect(k.game.state.gen.running).toBe(false);
    expect(said('choke')).toBe(SAY.chokeOut);
    expect(said('choke')).toBe(SAY.chokeIn);
    expect(k.game.redraws.length).toBeGreaterThan(0);
  });

  it('the set is dead without power on the ops room, and the dial does not move', () => {
    const k = play();
    const khz = k.game.state.rx.khz;
    k.A.tune(KNOBS[0], 1);
    expect(k.game.said).toEqual([SAY.rxDead]);
    expect(k.game.state.rx.khz).toBe(khz);
  });

  it('the dial says how near you are', () => {
    const k = play();
    powerUp(k);
    const fine = last(KNOBS);
    tuneTo(k, Rx.TARGET_KHZ - 100 - fine);
    expect(last(k.game.said)).toBe(SAY.rxNone);
    k.A.tune(fine, 1);
    expect(last(k.game.said)).toBe(SAY.rxNear);
    tuneIn(k);
    expect(last(k.game.said)).toBe(SAY.rxFaint);
    expect(k.game.state.rx.printed).toBe(false);
  });

  it('prints as the dial comes right, if the mast was aimed first', () => {
    const k = play();
    powerUp(k);
    aimMast(k);
    expect(last(k.game.said)).toBe(SAY.mast(Rx.TARGET_BEARING));
    expect(k.game.state.rx.printed).toBe(false);
    tuneIn(k);
    expect(k.game.state.rx.printed).toBe(true);
    expect(last(k.game.said)).toBe(SAY.rxLocked);
    expect(count(k.game.sounds, 'print')).toBe(1);
  });

  it('prints as the mast comes round, if the dial was set first, and you hear it from out there', () => {
    const k = play();
    powerUp(k);
    tuneIn(k);
    aimMast(k);
    expect(k.game.state.rx.printed).toBe(true);
    expect(k.game.said.slice(-2)).toEqual([SAY.mast(Rx.TARGET_BEARING), SAY.printingNow]);
    expect(count(k.game.sounds, 'print')).toBe(1);
  });

  it('prints as the power comes back, if both were right while it was off', () => {
    const k = play();
    powerUp(k);
    tuneIn(k);
    const id = Gen.solutions()[0][0];
    k.A.gen('breaker:' + id);
    aimMast(k);
    expect(k.game.state.rx.printed).toBe(false);
    k.A.gen('breaker:' + id);
    expect(k.game.state.rx.printed).toBe(true);
    expect(k.game.said.slice(-2)).toEqual([SAY.live, SAY.printingNow]);
    expect(count(k.game.sounds, 'print')).toBe(1);
  });

  it('prints once only, and the picture clears while the station is held', () => {
    const k = play();
    powerUp(k);
    k.A.look('monitor');
    expect(last(k.game.said)).toBe(LOOK.monitor);
    aimMast(k);
    tuneIn(k);
    k.A.look('monitor');
    expect(last(k.game.said)).toBe(LOOK.monitorLocked);

    k.A.tune(last(KNOBS), 1);
    k.A.look('monitor');
    expect(last(k.game.said)).toBe(LOOK.monitor);
    k.A.tune(last(KNOBS), -1);
    k.A.mast(1);
    k.A.mast(-1);
    k.A.look('monitor');
    expect(last(k.game.said)).toBe(LOOK.monitorLocked);
    k.A.gen('breaker:' + Gen.solutions()[0][0]); // still on the station, but the set has lost its power
    k.A.look('monitor');
    expect(last(k.game.said)).toBe(LOOK.monitor);
    expect(count(k.game.sounds, 'print')).toBe(1);
    expect(count(k.game.said, SAY.rxLocked) + count(k.game.said, SAY.printingNow)).toBe(1);
    expect(k.game.state.rx.printed).toBe(true);
  });

  it('the gnome has a little more to say each time, and then repeats himself', () => {
    const k = play();
    for (let i = 0; i < SAY.gnome.length + 2; i++) k.A.gnome();
    expect(k.game.said).toEqual([...SAY.gnome, last(SAY.gnome), last(SAY.gnome)]);
  });
});

describe('a solved puzzle moves the game on', () => {
  /**
   * The five with something that follows a moment later.
   * at: the close-up you solve it from. ready: everything but the last press. press: the last press.
   * solved: whether the state has moved on. then: what has happened once the moment has passed.
   */
  const FOLLOWED = [
    {
      name: 'the vault handle',
      at: 'vaultlock',
      ready: (k) => {
        powerUp(k);
        dial(k.A.wheel, () => k.game.state.vault.wheels, Cipher.COMBINATION);
      },
      press: 'vaulthandle',
      solved: (s) => s.vault.open,
      line: SAY.vaultOpen,
      then: { walked: [['corridor', 'E']] },
    },
    {
      name: 'the reply to the door',
      at: 'sender',
      ready: (k) => {
        connectLine(k);
        setReply(k);
      },
      press: 'send',
      solved: (s) => s.reply.open,
      line: SAY.sendOpen,
      then: { walked: [['blastdoor', 'N']] },
    },
    {
      name: 'the film',
      at: 'bench',
      ready: (k) => {
        k.A.film();
        setTimers(k);
        k.A.safelight();
      },
      press: 'develop',
      solved: (s) => s.darkroom.printed && s.inv.includes('photo'),
      line: SAY.devGood,
      then: { papers: ['photo'] },
    },
    {
      name: 'the tally board',
      at: 'tallyboard',
      ready: (k) => setTallies(k),
      press: 'cagebar',
      solved: (s) => s.tally.open,
      line: SAY.barOpen,
      then: { walked: [['store', 'E']] },
    },
    {
      name: 'the telegraph',
      at: 'telegraph',
      ready: (k) => {
        k.game.state.junction = chapterThreeState().junction; // the line was made live in chapter two
        setDocket(k);
      },
      press: 'call',
      solved: (s) => s.telegraph.drawn,
      line: SAY.callDrawn,
      then: { papers: ['waiver'] },
    },
  ];

  /** Solved while standing at the close-up, with the follow-up still to come. */
  const solvedAt = (p) => {
    const k = play();
    p.ready(k);
    k.game.state.node = p.at;
    k.game.walked.length = k.game.papers.length = 0;
    k.A[p.press]();
    return k;
  };
  const outcome = (game) => ({ walked: game.walked, papers: game.papers.map((x) => x.id) });

  it('each is solved from a close-up that is on the map, and steps back to a place that is', () => {
    for (const p of FOLLOWED) {
      expect(NODES[p.at].cam, p.name).toBeTruthy();
      for (const [node, facing] of p.then.walked || []) {
        expect(node, p.name).toBe(NODES[p.at].back[0]);
        expect(NODES[node].faces, p.name).toContain(facing);
      }
      for (const id of p.then.papers || []) expect(DOCS[id], p.name).toBeTruthy();
    }
  });

  it('the state moves on at once and the rest is left to game.after', () => {
    for (const p of FOLLOWED) {
      const k = solvedAt(p);
      expect(p.solved(k.game.state), p.name).toBe(true);
      expect(last(k.game.said), p.name).toBe(p.line);
      expect(k.game.timers, p.name).toHaveLength(1);
      expect(k.game.timers[0].ms, p.name).toBeGreaterThan(0);
      expect(outcome(k.game), p.name).toEqual({ walked: [], papers: [] });
      expect(k.game.state.node, p.name).toBe(p.at);
    }
  });

  it('the follow-up acts if you are still at the close-up', () => {
    for (const p of FOLLOWED) {
      const k = solvedAt(p);
      elapse(k.game);
      expect(outcome(k.game), p.name).toEqual({ walked: [], papers: [], ...p.then });
      expect(k.game.timers, p.name).toHaveLength(0);
    }
  });

  it('and does nothing at all if you have stepped back by then', () => {
    for (const p of FOLLOWED) {
      const k = solvedAt(p);
      k.game.state.node = NODES[p.at].back[0];
      const waiting = k.game.timers.splice(0);
      const before = asked(k.game);
      waiting.forEach((t) => t.fn());
      expect(asked(k.game), p.name).toEqual(before);
      expect(k.game.state.node, p.name).toBe(NODES[p.at].back[0]);
    }
  });

  it('nothing is left waiting by a second press, or by a wrong one', () => {
    for (const p of FOLLOWED) {
      const k = solvedAt(p);
      elapse(k.game);
      const state = JSON.stringify({ ...k.game.state, node: p.at });
      k.game.state.node = p.at;
      k.A[p.press]();
      expect(k.game.timers, p.name).toHaveLength(0);
      expect(JSON.stringify(k.game.state), p.name).toBe(state);

      const fresh = play();
      fresh.game.state.node = p.at;
      fresh.A[p.press]();
      expect(fresh.game.timers, p.name).toHaveLength(0);
      expect(p.solved(fresh.game.state), p.name).toBeFalsy();
    }
  });

  it('the vault lock says why it will not turn', () => {
    const k = play();
    k.A.vaulthandle();
    expect(last(k.game.said)).toBe(SAY.vaultDead);
    powerUp(k);
    k.A.vaulthandle();
    expect(last(k.game.said)).toBe(SAY.vaultWrong);
    expect(k.game.state.vault.open).toBe(false);
    openVault(k);
    const before = asked(k.game);
    k.A.vaulthandle();
    expect(asked(k.game)).toEqual(before);
  });

  it('the last word from the vault teleprinter unlatches the way down, once it has been read', () => {
    const k = play();
    k.A.final();
    expect(k.game.papers.map((p) => p.id)).toEqual(['final']);
    expect(k.game.state.flags.hatchOpen).toBeUndefined();
    expect(k.game.said).toEqual([]);
    putDown(k.game.papers[0]);
    expect(k.game.state.flags.hatchOpen).toBe(true);
    expect(k.game.said).toEqual([SAY.hatch]);
    expect(count(k.game.sounds, 'rack')).toBe(1);

    putDown(k.game.papers[0]);
    readLastWord(k);
    expect(k.game.said).toEqual([SAY.hatch]);
    expect(count(k.game.sounds, 'rack')).toBe(1);
    expect(k.game.state.flags.hatchOpen).toBe(true);
  });

  it('the pump drains the tunnel on the right charge and loses any other', () => {
    const k = play();
    k.A.valve(0, 1);
    expect(last(k.game.said)).toBe(SAY.pour(Pump.CAPACITY[1]));
    k.A.valve(0, 1);
    expect(last(k.game.said)).toBe(SAY.pourNone);
    k.A.prime();
    expect(last(k.game.said)).toBe(SAY.primeLost);
    expect(k.game.state.pump).toEqual(Pump.initial());

    drainTunnel(k);
    expect(k.game.state.pump.drained).toBe(true);
    expect(k.game.state.pump.levels[Pump.FEED]).toBe(Pump.CHARGE);
    expect(last(k.game.said)).toBe(SAY.primeDone);
    expect(count(k.game.sounds, 'drain')).toBe(1);

    const levels = k.game.state.pump.levels.slice();
    k.A.prime();
    expect(last(k.game.said)).toBe(SAY.primeAlready);
    for (let v = 0; v < Pump.VALVES.length; v++) {
      for (const dir of [-1, 1]) {
        k.A.valve(v, dir);
        expect(last(k.game.said)).toBe(SAY.primeAlready);
      }
    }
    expect(k.game.state.pump.levels).toEqual(levels);
    expect(count(k.game.sounds, 'drain')).toBe(1);
    expect(count(k.game.sounds, 'pour')).toBe(Pump.solve().length + 1);
  });

  it('the isolator holds only on the true wiring, and the door teleprinter wakes with the line', () => {
    const k = play();
    k.A.doorprint();
    expect(last(k.game.said)).toBe(SAY.doorPaperDead);
    k.A.isolator();
    expect(last(k.game.said)).toBe(SAY.isolFault);
    landCores(k, { ...Junction.WIRING, yellow: Junction.WIRING.white, white: Junction.WIRING.yellow });
    k.A.isolator();
    expect(last(k.game.said)).toBe(SAY.isolFault);
    expect(k.game.state.junction.live).toBe(false);
    expect(k.game.papers).toEqual([]);

    connectLine(k);
    expect(k.game.state.junction.live).toBe(true);
    expect(last(k.game.said)).toBe(SAY.isolLive);
    expect(k.game.sounds.slice(-2)).toEqual(['isolator', 'farprint']);
    k.A.isolator();
    expect(last(k.game.said)).toBe(SAY.isolAlready);
    expect(count(k.game.sounds, 'farprint')).toBe(1);

    k.A.doorprint();
    expect(last(k.game.papers).id).toBe('challenge');
    answerDoor(k);
    k.A.doorprint();
    expect(last(k.game.papers).id).toBe('comedown');
    expect(count(k.game.said, SAY.doorPaperDead)).toBe(1);
  });

  it('the sender says why the door will not answer', () => {
    const k = play();
    setReply(k);
    k.A.send();
    expect(last(k.game.said)).toBe(SAY.sendDead);
    connectLine(k);
    k.A.rwheel(0, 1);
    k.A.send();
    expect(last(k.game.said)).toBe(SAY.sendWrong);
    expect(k.game.state.reply.open).toBe(false);
    expect(k.game.sounds).not.toContain('blast');
    k.A.rwheel(0, -1);
    k.A.send();
    expect(k.game.state.reply.open).toBe(true);
    expect(count(k.game.sounds, 'blast')).toBe(1);
    const before = asked(k.game);
    k.A.send();
    expect(asked(k.game)).toEqual(before);
  });

  it('the darkroom says what went wrong with a strip, and a spoiled one costs nothing', () => {
    const [dev, stop, fix] = Darkroom.target();
    const k = play(chapterThreeState());
    const develop = (minutes) => {
      if (minutes) setTimers(k, minutes);
      k.A.develop();
      return last(k.game.said);
    };
    expect(develop()).toBe(SAY.devNoFilm);
    expect(k.game.sounds).not.toContain('slosh');
    k.A.film();
    expect(develop([dev, stop, fix])).toBe(SAY.devFogged);
    k.A.safelight();
    expect(last(k.game.said)).toBe(SAY.safeOn);
    expect(develop([dev - 1, stop, fix])).toBe(SAY.devThin);
    expect(develop([dev + 1, stop, fix])).toBe(SAY.devDense);
    expect(develop([dev, stop + 1, fix])).toBe(SAY.devStreaked);
    expect(develop([dev, stop, fix - 1])).toBe(SAY.devUnfixed);
    expect(develop([dev, stop, fix + 1])).toBe(SAY.devBleached);
    expect(k.game.state.inv).toContain('film');
    expect(k.game.state.inv).not.toContain('photo');
    expect(k.game.timers).toEqual([]);

    expect(develop([dev, stop, fix])).toBe(SAY.devGood);
    expect(count(k.game.sounds, 'slosh')).toBe(7);
    expect(develop()).toBe(SAY.devAlready);
    expect(count(k.game.sounds, 'slosh')).toBe(7);
    k.A.safelight();
    expect(last(k.game.said)).toBe(SAY.safeOff);
    expect(k.game.state.darkroom.printed).toBe(true);
  });

  it('the cage is out of reach until the bar is drawn', () => {
    const k = play(chapterThreeState());
    for (const what of ['casualty', 'effects', 'watches']) {
      k.A.cage(what);
      expect(last(k.game.said), what).toBe(SAY.cageShut);
    }
    expect(k.game.papers).toEqual([]);
    k.A.cagebar();
    expect(last(k.game.said)).toBe(SAY.barHeld);
    setTallies(k, { ...Tally.OWNER, harlan: Tally.OWNER.okafor, okafor: Tally.OWNER.harlan });
    k.A.cagebar();
    expect(last(k.game.said)).toBe(SAY.barHeld);
    expect(k.game.state.tally.open).toBe(false);

    drawBar(k);
    expect(k.game.state.tally.open).toBe(true);
    k.A.cagebar();
    expect(last(k.game.said)).toBe(SAY.barAlready);
    expect(count(k.game.sounds, 'cage')).toBe(1);
    k.A.cage('effects');
    expect(last(k.game.said)).toBe(LOOK.effects);
    k.A.cage('watches');
    expect(last(k.game.said)).toBe(LOOK.watches);
    k.A.cage('casualty');
    expect(k.game.papers.map((p) => p.id)).toEqual(['casualty']);
    expect(count(k.game.said, SAY.cageShut)).toBe(3);
  });

  it('the telegraph answers a wrong number, a wrong tally and a dead line each in its own way', () => {
    const other = Tally.TALLIES.find((t) => t !== Tally.OWNER[Telegraph.SIGNED_BY]);
    const k = play();
    setDocket(k);
    k.A.call();
    expect(last(k.game.said)).toBe(SAY.callDead);

    k.game.state = chapterThreeState();
    k.A.call();
    expect(last(k.game.said)).toBe(SAY.callUnknown);
    setDocket(k, Telegraph.HULL + String(other).padStart(2, '0'));
    k.A.call();
    expect(last(k.game.said)).toBe(SAY.callNil);
    expect(k.game.state.telegraph.drawn).toBe(false);
    expect(k.game.timers).toEqual([]);

    callPaper(k);
    expect(k.game.state.telegraph.drawn).toBe(true);
    k.A.call();
    expect(last(k.game.said)).toBe(SAY.callAlready);
    expect(k.game.timers).toHaveLength(1);
  });

  it('wheels, cores and drums turn without a word', () => {
    const k = play();
    const turns = [
      ['wheel', 0, (s) => s.vault.wheels[0]],
      ['rwheel', 0, (s) => s.reply.wheels[0]],
      ['timer', 0, (s) => s.darkroom.wheels[0]],
      ['twheel', 0, (s) => s.telegraph.wheels[0]],
      ['core', Junction.CORES[0], (s) => s.junction.sel[Junction.CORES[0]]],
      ['tally', Tally.NAMES[0], (s) => s.tally.set[Tally.NAMES[0]]],
    ];
    for (const [name, which, value] of turns) {
      const before = value(k.game.state);
      k.A[name](which, 1);
      expect(value(k.game.state), name).not.toBe(before);
      k.A[name](which, -1);
      expect(value(k.game.state), name).toBe(before);
    }
    expect(k.game.said).toEqual([]);
    expect(k.game.redraws).toHaveLength(2 * turns.length);
  });
});

// ---------------------------------------------------------------- the telegraph's two sheets

describe('the paper on the telegraph', () => {
  /** Chapter three with the paper called down, and nothing yet read. */
  const drawn = () => {
    const k = play(chapterThreeState());
    callPaper(k);
    k.game.timers.length = 0;
    k.game.said.length = k.game.sounds.length = 0;
    return k;
  };
  const sheets = (game) => game.papers.map((p) => p.id);

  it('is a clean sheet until the right number has been called', () => {
    const k = play(chapterThreeState());
    k.A.wirepaper();
    expect(k.game.said).toEqual([SAY.wireBlank]);
    expect(k.game.papers).toEqual([]);
    expect(k.game.state.flags.secondSheet).toBeUndefined();
    expect(k.game.state.flags.lampOn).toBeUndefined();
  });

  it('is first the waiver, and the second sheet comes through when that is put down', () => {
    const k = drawn();
    k.A.wirepaper();
    expect(sheets(k.game)).toEqual(['waiver']);
    expect(k.game.state.flags.secondSheet).toBeUndefined();
    expect(k.game.said).toEqual([]);

    putDown(k.game.papers[0]);
    expect(k.game.state.flags.secondSheet).toBe(true);
    expect(k.game.state.flags.lampOn).toBeUndefined();
    expect(k.game.said).toEqual([SAY.second]);
    expect(k.game.sounds).toEqual(['telegraph']);
  });

  it('is then the second sheet, and the lamp comes on when that is put down', () => {
    const k = drawn();
    readWire(k);
    k.A.wirepaper();
    expect(sheets(k.game)).toEqual(['waiver', 'second']);
    expect(k.game.state.flags.lampOn).toBeUndefined();

    putDown(k.game.papers[1]);
    expect(k.game.state.flags.lampOn).toBe(true);
    expect(k.game.said).toEqual([SAY.second, SAY.lampHint]);
    expect(k.game.sounds).toEqual(['telegraph', 'lamp']);
  });

  it('sets each flag once, however often the sheets are picked up and put down', () => {
    const k = drawn();
    k.A.wirepaper();
    k.A.wirepaper(); // picked up twice before it is ever put down
    expect(sheets(k.game)).toEqual(['waiver', 'waiver']);
    k.game.papers.forEach(putDown);
    k.game.papers.forEach(putDown);
    expect(k.game.said).toEqual([SAY.second]);
    expect(k.game.state.flags.lampOn).toBeUndefined();

    k.A.wirepaper();
    k.A.wirepaper();
    expect(sheets(k.game)).toEqual(['waiver', 'waiver', 'second', 'second']);
    k.game.papers.forEach(putDown);
    k.game.papers.forEach(putDown);
    for (let i = 0; i < 3; i++) readWire(k);
    expect(last(k.game.papers).id).toBe('second');
    expect(k.game.said).toEqual([SAY.second, SAY.lampHint]);
    expect(k.game.sounds).toEqual(['telegraph', 'lamp']);
    expect(k.game.state.flags).toMatchObject({ secondSheet: true, lampOn: true });
  });

  it('never lights the lamp before the second sheet has come', () => {
    const k = drawn();
    const order = [];
    const note = () => {
      const f = k.game.state.flags;
      expect(!!f.lampOn && !f.secondSheet).toBe(false);
      const now = [!!f.secondSheet, !!f.lampOn].join();
      if (last(order) !== now) order.push(now);
    };
    note();
    for (let i = 0; i < 4; i++) {
      k.A.wirepaper();
      note();
      putDown(last(k.game.papers));
      note();
    }
    expect(order).toEqual(['false,false', 'true,false', 'true,true']);
  });

  it('is handed to you by the telegraph itself if you wait at it', () => {
    const k = play(chapterThreeState());
    k.game.state.node = 'telegraph';
    callPaper(k);
    elapse(k.game);
    expect(sheets(k.game)).toEqual(['waiver']);
    putDown(k.game.papers[0]);
    expect(k.game.state.flags.secondSheet).toBe(true);
  });

  it('the viewport is dark until the lamp is on', () => {
    const k = drawn();
    k.A.viewport();
    readWire(k);
    k.A.viewport();
    readWire(k);
    k.A.viewport();
    expect(k.game.said.filter((line) => line !== SAY.second && line !== SAY.lampHint)).toEqual([LOOK.viewport, LOOK.viewport, LOOK.viewportLit]);
  });
});

// ---------------------------------------------------------------- captions

describe('captions', () => {
  const both = (list) => list.flatMap((call) => [-1, 1].map((dir) => [...call, dir]));

  /** Every click the world can make: each handler, with each thing it can be handed. */
  const CLICKS = [
    ...Object.keys(LOOK).map((key) => ['look', key]),
    ...Object.keys(DOCS).map((id) => ['doc', id]),
    ...Object.keys(NODES)
      .filter((id) => NODES[id].cam)
      .map((id) => ['go', id]),
    ...['valve', 'prime', 'choke', 'starter', ...Gen.BREAKERS.map((b) => 'breaker:' + b.id)].map((what) => ['gen', what]),
    ...both([['mast'], ...KNOBS.map((step) => ['tune', step])]),
    ...both([...Cipher.COMBINATION].map((_, i) => ['wheel', i])),
    ...both(Pump.VALVES.map((_, i) => ['valve', i])),
    ...both(Junction.CORES.map((c) => ['core', c])),
    ...both(Reply.initial().wheels.map((_, i) => ['rwheel', i])),
    ...both(Darkroom.initial().wheels.map((_, i) => ['timer', i])),
    ...both(Tally.NAMES.map((n) => ['tally', n])),
    ...both(Telegraph.initial().wheels.map((_, i) => ['twheel', i])),
    ...['casualty', 'effects', 'watches'].map((what) => ['cage', what]),
    ['passage', 'beyond', 'S'],
    ['passage', 'gallery', 'N'],
    ...['door', 'print', 'key', 'drawer', 'vaulthandle', 'final', 'gnome', 'descend', 'prime', 'isolator', 'send', 'doorprint'].map((name) => [name]),
    ...['film', 'safelight', 'develop', 'cagebar', 'call', 'wirepaper', 'viewport'].map((name) => [name]),
  ];

  /**
   * Make one click on a copy of the state and see it through to the end.
   * Returns what was said, and a note of anything said, shown, handed over or walked to that does not exist.
   */
  const tryClick = (state, [name, ...args]) => {
    const k = play(structuredClone(state));
    k.A[name](...args);
    // whatever follows: timers run out, papers are put down, and what those start in turn
    for (let round = 0; round < 4; round++) {
      elapse(k.game);
      k.game.papers.forEach(putDown);
    }
    const faults = [];
    const fault = (what) => faults.push(`${name}(${args.join(', ')}) ${what}`);
    for (const line of k.game.said) if (typeof line !== 'string') fault('said ' + line);
    for (const paper of k.game.papers) if (!DOCS[paper.id]) fault('showed the paper ' + paper.id);
    for (const item of k.game.given) if (!ITEMS[item]) fault('handed over ' + item);
    for (const [node] of k.game.walked.concat(k.game.faded)) if (!NODES[node]) fault('went to ' + node);
    return { said: k.game.said, faults };
  };

  it('the list of clicks leaves no handler out', () => {
    expect([...new Set(CLICKS.map(([name]) => name))].sort()).toEqual(Object.keys(play().A).sort());
  });

  it('every caption in the tables is a line of text', () => {
    for (const [key, line] of Object.entries(LOOK)) expect(typeof line, key).toBe('string');
    for (const [key, line] of Object.entries(SAY)) {
      if (Array.isArray(line)) line.forEach((l) => expect(typeof l, key).toBe('string'));
      else expect(typeof (typeof line === 'function' ? line(1) : line), key).toBe('string');
    }
  });

  for (const { from, start, chapters } of STARTS) {
    it(`every click says only defined lines, from ${from}`, () => {
      for (const click of CLICKS) expect(tryClick(start(), click).faults).toEqual([]);
    });

    it(`and so does every click at every point on the way through, from ${from}`, () => {
      const k = play(start());
      const faults = [];
      const heard = new Set();
      let clicks = 0;
      // after each click of the play-through, try every click there is on a copy of the state as it then stands
      const everywhere = () => {
        clicks++;
        for (const click of CLICKS) {
          const tried = tryClick(k.game.state, click);
          for (const line of tried.said) heard.add(line);
          for (const f of tried.faults) faults.push(`${f}, ${clicks} clicks in`);
        }
      };
      const watched = Object.fromEntries(
        Object.entries(k.A).map(([name, handler]) => [
          name,
          (...args) => {
            handler(...args);
            everywhere();
          },
        ]),
      );
      for (const step of chapters.flat()) step({ ...k, A: watched });
      expect(faults).toEqual([]);

      // the play-through itself got to the end, and said nothing undefined on the way
      expect(k.game.state.flags).toMatchObject({ hatchOpen: true, secondSheet: true, lampOn: true });
      for (const name of Object.keys(k.shut)) expect(k.shut[name](), name).toBe(false);
      for (const line of k.game.said) expect(typeof line).toBe('string');
      // and on the way the clicks reached every look there is (the monitor's first one only in a whole game)
      for (const [key, line] of Object.entries(LOOK)) if (key !== 'monitor' || start === newState) expect(heard.has(line), key).toBe(true);
    });
  }
});
