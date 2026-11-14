// What happens when the player clicks something. Rules live in src/puzzles; this file
// only connects them to sound, captions and the save.
import * as Gen from './puzzles/generator.js';
import * as Rx from './puzzles/receiver.js';
import * as Vault from './puzzles/vault.js';
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
        if (e === 'valve') { game.sfx('valve'); line = state.valve ? SAY.valveOpen : SAY.valveShut; }
        if (e === 'prime') { game.sfx('prime'); line = SAY.prime(state.primes); }
        if (e === 'choke') {
          game.sfx('click');
          if (state.running) line = state.choke ? SAY.roughAgain : SAY.smooth;
          else line = state.choke ? SAY.chokeOut : SAY.chokeIn;
        }
        if (e === 'cough') { game.sfx('cough'); line = SAY.cough; }
        if (e === 'start') { game.sfx('start'); line = SAY.start; }
        if (e === 'already') line = SAY.already;
        if (e === 'stall') { game.sfx('stall'); line = SAY.stall; }
        if (e === 'switch') {
          game.sfx('switch');
          const st = Gen.status(state);
          line = st === 'off' ? SAY.notRunning : st === 'rough' ? SAY.roughBus : st === 'hunting' ? SAY.hunting : line;
        }
        if (e === 'trip') { game.sfx('trip'); line = SAY.trip; }
        if (e === 'live') { game.sfx('live'); line = SAY.live; }
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

    final() {
      game.sfx('print');
      game.read('final', () => game.finish());
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
  };

  return { A, gates };
}
