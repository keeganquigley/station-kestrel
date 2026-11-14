// What happens when the player clicks something. Rules live in src/puzzles; this file
// only connects them to sound, captions and the save.
import * as Gen from './puzzles/generator.js';
import * as Rx from './puzzles/receiver.js';
import * as Vault from './puzzles/vault.js';
import * as Pump from './puzzles/pump.js';
import * as Junction from './puzzles/junction.js';
import * as Reply from './puzzles/reply.js';
import * as Darkroom from './puzzles/darkroom.js';
import * as Tally from './puzzles/tally.js';
import * as Telegraph from './puzzles/telegraph.js';
import { LOOK, SAY } from './data/documents.js';

export function createActions(game) {
  const S = () => game.state;
  const rxPower = () => Gen.powered(S().gen, 'ops');

  /** Receiver side-effects after anything that could change what it hears. */
  const settleRx = (announce) => {
    const before = S().rx.printed;
    S().rx = Rx.settle(S().rx, rxPower());
    if (!before && S().rx.printed) {
      game.sfx('print');
      game.say(announce ? SAY.rxLocked : SAY.printingNow);
      return true;
    }
    return false;
  };

  const A = {
    look(key) {
      if (key === 'monitor' && rxPower() && Rx.reception(S().rx) === 'locked') key = 'monitorLocked';
      game.say(LOOK[key]);
    },

    doc(id) {
      game.read(id);
    },

    go(node, facing) {
      game.go(node, facing);
    },

    door() {
      if (Gen.busLive(S().gen)) return game.go('vestibule', 'N');
      game.sfx('buzz');
      game.say(SAY.doorDead);
    },

    gen(what) {
      const before = S().gen;
      const { state, events } = Gen.act(before, what);
      S().gen = state;
      let line = null;
      for (const e of events) {
        if (e === 'valve') {
          game.sfx('valve');
          line = state.valve ? SAY.valveOpen : SAY.valveShut;
        }
        if (e === 'prime') {
          game.sfx('prime');
          line = SAY.prime(state.primes);
        }
        if (e === 'choke') {
          game.sfx('click');
          if (state.running) line = state.choke ? SAY.roughAgain : SAY.smooth;
          else line = state.choke ? SAY.chokeOut : SAY.chokeIn;
        }
        if (e === 'cough') {
          game.sfx('cough');
          line = SAY.cough;
        }
        if (e === 'start') {
          game.sfx('start');
          line = SAY.start;
        }
        if (e === 'already') line = SAY.already;
        if (e === 'stall') {
          game.sfx('stall');
          line = SAY.stall;
        }
        if (e === 'switch') {
          game.sfx('switch');
          const st = Gen.status(state);
          line = st === 'off' ? SAY.notRunning : st === 'rough' ? SAY.roughBus : st === 'hunting' ? SAY.hunting : line;
        }
        if (e === 'trip') {
          game.sfx('trip');
          line = SAY.trip;
        }
        if (e === 'live') {
          game.sfx('live');
          line = SAY.live;
        }
        if (e === 'drop' && !events.includes('trip') && !events.includes('stall')) line = SAY.drop;
      }
      if (line) game.say(line);
      if (events.includes('live')) {
        if (!S().flags.doorOpened) game.sfx('door');
        S().flags.doorOpened = true;
        settleRx(false);
      }
      game.changed();
    },

    mast(dir) {
      S().rx = Rx.rotate(S().rx, dir * Rx.BEARING_STEP);
      game.sfx('ratchet');
      game.say(SAY.mast(S().rx.bearing));
      settleRx(false);
      game.changed();
    },

    tune(step, dir) {
      if (!rxPower()) {
        game.sfx('click');
        return game.say(SAY.rxDead);
      }
      S().rx = Rx.tune(S().rx, step * dir);
      game.sfx('click');
      if (!settleRx(true)) {
        const rec = Rx.reception(S().rx);
        game.say(rec === 'none' ? SAY.rxNone : rec === 'near' ? SAY.rxNear : rec === 'faint' ? SAY.rxFaint : '');
      }
      game.changed();
    },

    print() {
      if (S().rx.printed) {
        if (!game.has('printout')) {
          game.give('printout');
          game.sfx('paper');
          game.say(SAY.paperTake);
          game.changed();
        }
        return game.read('printout');
      }
      game.say(rxPower() && Rx.reception(S().rx) === 'faint' ? SAY.paperFaint : SAY.paperBlank);
    },

    key() {
      if (S().flags.keyTaken) return;
      S().flags.keyTaken = true;
      game.give('key');
      game.sfx('key');
      game.say(SAY.keyTake);
      game.changed();
    },

    drawer() {
      if (S().flags.drawerOpen) return game.read('pad');
      if (!game.has('key')) {
        game.sfx('clunk');
        return game.say(SAY.drawerLocked);
      }
      S().flags.drawerOpen = true;
      game.sfx('drawer');
      game.say(SAY.drawerOpen);
      game.changed();
    },

    wheel(index, dir) {
      S().vault = Vault.spin(S().vault, index, dir);
      game.sfx('wheel');
      game.changed(60);
    },

    vaulthandle() {
      const { state, result } = Vault.tryHandle(S().vault, Gen.powered(S().gen, 'vault'));
      S().vault = state;
      if (result === 'open') {
        game.sfx('vault');
        game.say(SAY.vaultOpen);
        game.changed(900);
        game.after(2600, () => {
          if (S().node === 'vaultlock') game.go('corridor', 'E');
        });
      } else if (result === 'dead') {
        game.sfx('clunk');
        game.say(SAY.vaultDead);
      } else if (result === 'wrong') {
        game.sfx('clunk');
        game.say(SAY.vaultWrong);
      }
    },

    /** The vault teleprinter's last word. Reading it is what unlatches the way down. */
    final() {
      game.sfx('print');
      game.read('final', () => {
        if (S().flags.hatchOpen) return;
        S().flags.hatchOpen = true;
        game.sfx('rack');
        game.say(SAY.hatch);
        game.changed(700);
      });
    },

    // ---------------------------------------------------------------- chapter two

    descend() {
      if (S().flags.hatchOpen) game.fadeTo('stairfoot', 'N');
    },

    valve(index, dir) {
      const { state, moved } = Pump.turnValve(S().pump, index, dir);
      S().pump = state;
      game.sfx(moved ? 'pour' : 'click');
      game.say(S().pump.drained ? SAY.primeAlready : moved ? SAY.pour(moved) : SAY.pourNone);
      game.changed();
    },

    prime() {
      const { state, result } = Pump.prime(S().pump);
      S().pump = state;
      if (result === 'drained') {
        game.sfx('drain');
        game.say(SAY.primeDone);
      } else if (result === 'lost') {
        game.sfx('gulp');
        game.say(SAY.primeLost);
      } else {
        game.say(SAY.primeAlready);
      }
      game.changed(400);
    },

    core(name, dir) {
      S().junction = Junction.spin(S().junction, name, dir);
      game.sfx('wheel');
      game.changed(60);
    },

    isolator() {
      const { state, result } = Junction.throwIsolator(S().junction);
      S().junction = state;
      if (result === 'live') {
        game.sfx('isolator');
        game.sfx('farprint');
        game.say(SAY.isolLive);
      } else if (result === 'fault') {
        game.sfx('trip');
        game.say(SAY.isolFault);
      } else {
        game.say(SAY.isolAlready);
      }
      game.changed();
    },

    rwheel(index, dir) {
      S().reply = Reply.spin(S().reply, index, dir);
      game.sfx('wheel');
      game.changed(60);
    },

    send() {
      const { state, result } = Reply.send(S().reply, S().junction.live);
      S().reply = state;
      if (result === 'open') {
        game.sfx('print');
        game.sfx('blast');
        game.say(SAY.sendOpen);
        game.changed(900);
        game.after(3000, () => {
          if (S().node === 'sender') game.go('blastdoor', 'N');
        });
      } else if (result === 'dead') {
        game.sfx('click');
        game.say(SAY.sendDead);
      } else if (result === 'wrong') {
        game.sfx('print');
        game.say(SAY.sendWrong);
      }
    },

    doorprint() {
      if (S().reply.open) return game.read('comedown');
      if (S().junction.live) return game.read('challenge');
      game.say(SAY.doorPaperDead);
    },

    // ---------------------------------------------------------------- chapter three

    /** The rock passage between the blast door and the pen, either way. */
    passage(node, facing) {
      game.fadeTo(node, facing);
    },

    film() {
      if (S().flags.filmTaken) return game.say(LOOK.cameraEmpty);
      S().flags.filmTaken = true;
      game.give('film');
      game.sfx('drawer');
      game.say(SAY.filmTake);
      game.changed();
    },

    timer(index, dir) {
      S().darkroom = Darkroom.spin(S().darkroom, index, dir);
      game.sfx('wheel');
      game.changed(60);
    },

    safelight() {
      S().darkroom = Darkroom.toggleLight(S().darkroom);
      game.sfx('switch');
      game.say(S().darkroom.safe ? SAY.safeOn : SAY.safeOff);
      game.changed(260);
    },

    develop() {
      const { state, result } = Darkroom.run(S().darkroom, game.has('film'));
      S().darkroom = state;
      const line = {
        nofilm: 'devNoFilm',
        fogged: 'devFogged',
        thin: 'devThin',
        dense: 'devDense',
        streaked: 'devStreaked',
        unfixed: 'devUnfixed',
        bleached: 'devBleached',
        good: 'devGood',
        already: 'devAlready',
      }[result];
      if (result !== 'nofilm' && result !== 'already') game.sfx('slosh');
      game.say(SAY[line]);
      if (result !== 'good') return;
      S().inv = S().inv.filter((i) => i !== 'film');
      game.give('photo');
      game.changed(500);
      game.after(1600, () => {
        if (S().node === 'bench') game.read('photo');
      });
    },

    tally(name, dir) {
      S().tally = Tally.spin(S().tally, name, dir);
      game.sfx('tally');
      game.changed(60);
    },

    cagebar() {
      const { state, result } = Tally.pullBar(S().tally);
      S().tally = state;
      if (result === 'open') {
        game.sfx('cage');
        game.say(SAY.barOpen);
        game.changed(500);
        game.after(2600, () => {
          if (S().node === 'tallyboard') game.go('store', 'E');
        });
      } else if (result === 'held') {
        game.sfx('clunk');
        game.say(SAY.barHeld);
      } else {
        game.say(SAY.barAlready);
      }
    },

    /** Things inside the property cage: out of reach until the bar is drawn. */
    cage(what) {
      if (!S().tally.open) return game.say(SAY.cageShut);
      if (what === 'casualty') return game.read('casualty');
      game.say(LOOK[what]);
    },

    twheel(index, dir) {
      S().telegraph = Telegraph.spin(S().telegraph, index, dir);
      game.sfx('wheel');
      game.changed(60);
    },

    call() {
      const { state, result } = Telegraph.call(S().telegraph, S().junction.live);
      S().telegraph = state;
      if (result === 'drawn') {
        game.sfx('telegraph');
        game.say(SAY.callDrawn);
        game.changed(900);
        game.after(2600, () => {
          if (S().node === 'telegraph') A.wirepaper();
        });
      } else if (result === 'nil') {
        game.sfx('telegraph');
        game.say(SAY.callNil);
      } else if (result === 'unknown') {
        game.sfx('clunk');
        game.say(SAY.callUnknown);
      } else {
        game.say(result === 'dead' ? SAY.callDead : SAY.callAlready);
      }
    },

    /** The sheet on the telegraph drum: first the waiver, then the one that follows it. */
    wirepaper() {
      const f = S().flags;
      if (!S().telegraph.drawn) return game.say(SAY.wireBlank);
      if (!f.secondSheet) {
        return game.read('waiver', () => {
          if (f.secondSheet) return;
          f.secondSheet = true;
          game.sfx('telegraph');
          game.say(SAY.second);
          game.changed(700);
        });
      }
      game.read('second', () => {
        if (f.lampOn) return;
        f.lampOn = true;
        game.sfx('lamp');
        game.say(SAY.lampHint);
        game.changed(400);
      });
    },

    viewport() {
      game.say(S().flags.lampOn ? LOOK.viewportLit : LOOK.viewport);
    },
  };

  /** Checked before walking through a gated link. Return a line to refuse, or null to pass. */
  const gates = {
    door: () => {
      if (Gen.busLive(S().gen)) return null;
      game.sfx('buzz');
      return SAY.doorDead;
    },
    vault: () => (S().vault.open ? null : false), // false: not passable, and say nothing
    hatch: () => (S().flags.hatchOpen ? null : false),
    water: () => (S().pump.drained ? null : false),
    blast: () => (S().reply.open ? null : false),
  };

  /** Ways that are shut for now. While one is shut, pointing along it shows no walk-forward arrow. */
  const shut = {
    vault: () => !S().vault.open,
    hatch: () => !S().flags.hatchOpen,
    water: () => !S().pump.drained,
    blast: () => !S().reply.open,
  };

  return { A, gates, shut };
}
