// All sound is synthesised here with Web Audio. Nothing is loaded from a file.

/**
 * The mix of the Subterranean Station's constant sound. Change these to taste:
 *   air    the hush of ventilation        (raise for more "white noise")
 *   hum    the low, slowly beating tone   (lower if it sounds buzzy or boomy)
 *   whirr  the fans, a narrow higher band (lower if it sounds whiny)
 *   drip   how loud each drip is
 *   deep   the note that rises past the last door
 * Each place then scales these by the numbers in its `amb` entry in src/data/nodes.js.
 */
export const TUNNEL_MIX = { air: 0.055, hum: 0.026, whirr: 0.01, drip: 0.12, deep: 0.05 };
/**
 * The pen adds two things to whatever of the tunnel's sound its places ask for:
 *   lap    water against the quay, slow and low
 *   creak  how loud the boat is when she shifts at her chains
 */
export const PEN_MIX = { lap: 0.085, creak: 0.07 };
/** Pitch of the hum, in Hz, and how far apart its two voices sit (which sets how slowly it beats). */
export const TUNNEL_HUM = { pitch: 82, beat: 0.35 };

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.amb = {};
    this.radioState = null;
    this.toneTimer = null;
  }

  /** Must be called from a click, or the browser will not let audio start. */
  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.85;
    this.master.connect(ctx.destination);

    const len = ctx.sampleRate * 3;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    const bed = (type, freq, q) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = 0;
      const swell = ctx.createGain(); // 1 +/- an LFO, so a silent bed stays silent
      src.connect(f).connect(g).connect(swell).connect(this.master);
      src.start(0, Math.random() * 2);
      return { f, g, swell };
    };
    const lfo = (rate, depth, param) => {
      const o = ctx.createOscillator();
      o.frequency.value = rate;
      const g = ctx.createGain();
      g.gain.value = depth;
      o.connect(g).connect(param);
      o.start();
      return g;
    };

    this.wind = bed('bandpass', 420, 0.7);
    lfo(0.11, 190, this.wind.f.frequency);
    lfo(0.07, 0.35, this.wind.swell.gain);
    this.sea = bed('lowpass', 300, 0.4);
    lfo(0.085, 0.45, this.sea.swell.gain);
    this.room = bed('lowpass', 130, 0.6);
    this.hiss = bed('bandpass', 2100, 0.5);
    this.vaultBed = bed('lowpass', 70, 2);

    // the Subterranean Station: air, hum and whirr
    this.air = bed('lowpass', 520, 0.2);
    lfo(0.05, 0.22, this.air.swell.gain);
    lfo(0.031, 90, this.air.f.frequency);
    this.whirr = bed('bandpass', 880, 9);
    lfo(0.07, 26, this.whirr.f.frequency);
    lfo(0.11, 0.25, this.whirr.swell.gain);
    // the pen: water moving against stone
    this.lap = bed('lowpass', 260, 0.5);
    lfo(0.19, 0.6, this.lap.swell.gain);
    lfo(0.043, 70, this.lap.f.frequency);
    this.hum = ctx.createGain();
    this.hum.gain.value = 0;
    const humLP = ctx.createBiquadFilter();
    humLP.type = 'lowpass';
    humLP.frequency.value = 420;
    humLP.connect(this.hum).connect(this.master);
    [[1, 0.5, 'sine'], [1, 0.5, 'sine'], [2, 0.28, 'sine'], [3, 0.09, 'triangle']].forEach(([mult, level, type], i) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = TUNNEL_HUM.pitch * mult + (i === 1 ? TUNNEL_HUM.beat : i === 2 ? 0.2 : 0);
      const g = ctx.createGain();
      g.gain.value = level;
      o.connect(g).connect(humLP);
      o.start();
    });
    this.deep = ctx.createGain();
    this.deep.gain.value = 0;
    this.deep.connect(this.master);
    const deepSwell = ctx.createGain(); // rises and falls like the light does
    deepSwell.gain.value = 0.5;
    deepSwell.connect(this.deep);
    [87, 130.5, 174.4].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = [0.6, 0.3, 0.2][i];
      o.connect(g).connect(deepSwell);
      o.start();
    });
    lfo(0.11, 0.45, deepSwell.gain);

    // diesel
    this.gen = ctx.createGain();
    this.gen.gain.value = 0;
    const genLP = ctx.createBiquadFilter();
    genLP.type = 'lowpass';
    genLP.frequency.value = 230;
    genLP.connect(this.gen).connect(this.master);
    this.genOsc = [47, 94.6, 23.4].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 1 ? 'square' : 'sawtooth';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = [0.5, 0.18, 0.35][i];
      o.connect(g).connect(genLP);
      o.start();
      return o;
    });
    this.genWobble = lfo(1.7, 0, this.genOsc[0].frequency);

    // radio whistle and signal tone
    this.whistle = ctx.createOscillator();
    this.whistle.type = 'sine';
    this.whistleGain = ctx.createGain();
    this.whistleGain.gain.value = 0;
    this.whistle.connect(this.whistleGain).connect(this.master);
    this.whistle.start();
    this.tone = ctx.createOscillator();
    this.tone.type = 'triangle';
    this.toneGain = ctx.createGain();
    this.toneGain.gain.value = 0;
    this.tone.connect(this.toneGain).connect(this.master);
    this.tone.start();

    this.apply();
  }

  setMuted(m) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.05);
  }

  /** levels: {wind, sea, room, gen, radio, vault} for the place you are standing; engine: generator status. */
  ambience(levels, engine, radio) {
    this.amb = levels || {};
    this.engine = engine;
    this.radioState = radio;
    this.apply();
  }

  apply() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, a = this.amb, set = (p, v, k = 0.4) => p.setTargetAtTime(v, t, k);
    set(this.wind.g.gain, 0.085 * (a.wind || 0));
    set(this.sea.g.gain, 0.11 * (a.sea || 0));
    set(this.room.g.gain, 0.05 * (a.room || 0));
    set(this.vaultBed.g.gain, 0.5 * (a.vault || 0));
    set(this.air.g.gain, TUNNEL_MIX.air * (a.air || 0), 0.6);
    set(this.whirr.g.gain, TUNNEL_MIX.whirr * 6 * (a.whirr || 0), 0.6);
    set(this.hum.gain, TUNNEL_MIX.hum * (a.hum || 0), 0.6);
    set(this.deep.gain, TUNNEL_MIX.deep * (a.deep || 0), 1.5);
    set(this.lap.g.gain, PEN_MIX.lap * (a.lap || 0), 0.8);
    this.creakLevel = a.creak || 0;
    if (this.creakLevel > 0 && !this.creakTimer) this.creakTimer = setInterval(() => this.creak(), 5200);
    if (this.creakLevel <= 0 && this.creakTimer) {
      clearInterval(this.creakTimer);
      this.creakTimer = null;
    }
    this.dripLevel = a.drip || 0;
    if (this.dripLevel > 0 && !this.dripTimer) this.dripTimer = setInterval(() => this.drip(), 1700);
    if (this.dripLevel <= 0 && this.dripTimer) {
      clearInterval(this.dripTimer);
      this.dripTimer = null;
    }
    const run = this.engine && this.engine !== 'off';
    set(this.gen.gain, run ? 0.2 * (a.gen || 0) : 0, 0.25);
    set(this.genWobble.gain, this.engine === 'rough' ? 5 : this.engine === 'hunting' ? 2.5 : 0.2);
    const r = this.radioState, vol = a.radio || 0;
    const on = r && r.on && vol > 0;
    set(this.hiss.g.gain, on ? 0.035 * vol * (1 - 0.7 * r.strength) : 0, 0.1);
    const whistling = on && r.offset !== 0 && Math.abs(r.offset) <= 100;
    this.whistle.frequency.setTargetAtTime(300 + Math.abs(r ? r.offset : 0) * 22, t, 0.03);
    set(this.whistleGain.gain, whistling ? 0.018 * vol : 0, 0.05);
    const tones = on && r.offset === 0;
    if (tones && !this.toneTimer) this.startTones();
    if (!tones && this.toneTimer) this.stopTones();
    this.toneVol = tones ? vol * (0.02 + 0.05 * r.strength) : 0;
  }

  /** Now and then, a drop falls somewhere along the tunnel. */
  drip() {
    if (!this.ctx || Math.random() > 0.3 + 0.5 * this.dripLevel) return;
    const f = 900 + Math.random() * 900, level = TUNNEL_MIX.drip * this.dripLevel * (0.4 + Math.random() * 0.6);
    this.blip({ tone: level, f0: f, f1: f * 1.9, dur: 0.07, delay: Math.random() * 0.8 });
    this.blip({ tone: level * 0.35, f0: f * 0.5, f1: f * 0.7, dur: 0.16, delay: 0.9 });
  }

  /** Now and then the boat shifts against her chains. */
  creak() {
    if (!this.ctx || Math.random() > 0.45) return;
    const level = PEN_MIX.creak * this.creakLevel * (0.5 + Math.random() * 0.5), f = 70 + Math.random() * 50, d = Math.random() * 2;
    this.blip({ tone: level, f0: f, f1: f * (0.8 + Math.random() * 0.5), dur: 1.1 + Math.random(), type: 'sawtooth', delay: d, attack: 0.35 });
    this.blip({ noise: level * 0.5, dur: 0.9, filter: 'bandpass', cutoff: 320, delay: d + 0.1, attack: 0.3 });
    if (Math.random() < 0.4) this.blip({ tone: level * 1.4, f0: 120, f1: 60, dur: 0.3, delay: d + 1.5 });
  }

  startTones() {
    const seq = [523, 0, 392, 440, 0, 523, 392, 0, 330, 330, 0, 0];
    let i = 0;
    this.toneTimer = setInterval(() => {
      if (!this.ctx) return;
      const f = seq[i++ % seq.length], t = this.ctx.currentTime;
      if (f) {
        this.tone.frequency.setValueAtTime(f, t);
        this.toneGain.gain.cancelScheduledValues(t);
        this.toneGain.gain.setValueAtTime(this.toneVol, t + 0.005);
        this.toneGain.gain.setTargetAtTime(0, t + 0.16, 0.03);
      }
    }, 260);
  }

  stopTones() {
    clearInterval(this.toneTimer);
    this.toneTimer = null;
    if (this.ctx) this.toneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
  }

  /** One short synthesised effect: filtered noise and/or a swept tone. */
  blip({ noise = 0, tone = 0, f0 = 200, f1 = f0, dur = 0.1, type = 'sine', filter = 'lowpass', cutoff = 2000, delay = 0, attack = 0.004 }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const env = (peak) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      g.connect(this.master);
      return g;
    };
    if (noise) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = filter;
      f.frequency.value = cutoff;
      src.connect(f).connect(env(noise));
      src.start(t, Math.random() * 2, dur + 0.05);
    }
    if (tone) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      o.connect(env(tone));
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  sfx(name) {
    const b = (o) => this.blip(o);
    // prettier-ignore
    switch (name) {
      case 'click': b({ noise: 0.25, dur: 0.03, filter: 'highpass', cutoff: 1800 }); break;
      case 'switch': b({ noise: 0.3, dur: 0.04, filter: 'highpass', cutoff: 1200 }); b({ tone: 0.3, f0: 140, f1: 70, dur: 0.09 }); break;
      case 'valve': b({ noise: 0.14, dur: 0.22, filter: 'bandpass', cutoff: 900 }); b({ tone: 0.2, f0: 110, f1: 80, dur: 0.12, delay: 0.16 }); break;
      case 'prime': b({ noise: 0.16, dur: 0.16, filter: 'lowpass', cutoff: 500 }); b({ tone: 0.12, f0: 180, f1: 90, dur: 0.14 }); break;
      case 'cough': for (let i = 0; i < 5; i++) b({ noise: 0.3 - i * 0.04, dur: 0.11, cutoff: 320, delay: i * 0.13 }); b({ tone: 0.25, f0: 60, f1: 28, dur: 0.9, type: 'sawtooth' }); break;
      case 'start': for (let i = 0; i < 6; i++) b({ noise: 0.28, dur: 0.1, cutoff: 340, delay: i * (0.13 - i * 0.012) }); b({ tone: 0.3, f0: 26, f1: 50, dur: 1.1, type: 'sawtooth' }); break;
      case 'stall': b({ tone: 0.3, f0: 48, f1: 14, dur: 1.4, type: 'sawtooth' }); break;
      case 'trip': b({ noise: 0.6, dur: 0.07, filter: 'highpass', cutoff: 800 }); b({ tone: 0.35, f0: 100, f1: 50, dur: 0.35, type: 'square' }); break;
      case 'live': b({ tone: 0.12, f0: 660, f1: 660, dur: 0.5 }); b({ tone: 0.1, f0: 990, f1: 990, dur: 0.6, delay: 0.12 }); break;
      case 'buzz': b({ tone: 0.16, f0: 96, f1: 96, dur: 0.24, type: 'square' }); break;
      case 'step': b({ noise: 0.16, dur: 0.11, cutoff: 260 }); b({ noise: 0.13, dur: 0.11, cutoff: 240, delay: 0.24 }); break;
      case 'paper': b({ noise: 0.14, dur: 0.24, filter: 'highpass', cutoff: 2600, attack: 0.05 }); break;
      case 'ratchet': for (let i = 0; i < 4; i++) b({ noise: 0.22, dur: 0.03, filter: 'highpass', cutoff: 1500, delay: i * 0.055 }); b({ tone: 0.08, f0: 70, f1: 60, dur: 0.3 }); break;
      case 'wheel': b({ noise: 0.2, dur: 0.025, filter: 'highpass', cutoff: 2400 }); b({ tone: 0.1, f0: 420, f1: 300, dur: 0.04 }); break;
      case 'print': for (let i = 0; i < 26; i++) b({ noise: 0.2, dur: 0.03, filter: 'bandpass', cutoff: 1400 + (i % 5) * 200, delay: i * 0.07 }); break;
      case 'door': b({ noise: 0.2, dur: 0.9, filter: 'bandpass', cutoff: 420, attack: 0.1 }); b({ tone: 0.35, f0: 80, f1: 44, dur: 0.3, delay: 0.85 }); break;
      case 'drawer': b({ noise: 0.14, dur: 0.3, filter: 'bandpass', cutoff: 600, attack: 0.05 }); b({ tone: 0.2, f0: 120, f1: 80, dur: 0.1, delay: 0.26 }); break;
      case 'key': b({ tone: 0.08, f0: 2400, f1: 2100, dur: 0.12 }); b({ tone: 0.06, f0: 3100, f1: 2900, dur: 0.1, delay: 0.05 }); break;
      case 'clunk': b({ tone: 0.4, f0: 90, f1: 40, dur: 0.25 }); b({ noise: 0.2, dur: 0.06, cutoff: 500 }); break;
      case 'vault':
        for (let i = 0; i < 4; i++) { b({ tone: 0.4, f0: 85, f1: 42, dur: 0.22, delay: i * 0.3 }); b({ noise: 0.2, dur: 0.05, cutoff: 600, delay: i * 0.3 }); }
        b({ tone: 0.22, f0: 62, f1: 44, dur: 2.2, type: 'sawtooth', delay: 1.3, attack: 0.4 });
        b({ noise: 0.07, dur: 2.0, filter: 'bandpass', cutoff: 300, delay: 1.3, attack: 0.5 });
        break;
      case 'stairs': for (let i = 0; i < 7; i++) b({ noise: 0.17 - i * 0.015, dur: 0.12, cutoff: 300 - i * 20, delay: i * 0.24 }); break;
      case 'rack': b({ tone: 0.4, f0: 95, f1: 45, dur: 0.3 }); b({ noise: 0.22, dur: 0.07, cutoff: 700 }); b({ tone: 0.12, f0: 210, f1: 150, dur: 1.2, type: 'sawtooth', delay: 0.35, attack: 0.2 }); b({ noise: 0.06, dur: 1.2, filter: 'bandpass', cutoff: 500, delay: 0.35, attack: 0.3 }); break;
      case 'pour': b({ noise: 0.16, dur: 0.9, filter: 'bandpass', cutoff: 1300, attack: 0.15 }); b({ noise: 0.1, dur: 0.9, filter: 'bandpass', cutoff: 420, attack: 0.2 }); b({ tone: 0.05, f0: 260, f1: 520, dur: 0.8, attack: 0.2 }); break;
      case 'gulp': for (let i = 0; i < 3; i++) b({ tone: 0.3, f0: 120 - i * 20, f1: 50, dur: 0.22, delay: i * 0.2 }); b({ noise: 0.2, dur: 1.1, filter: 'bandpass', cutoff: 700, delay: 0.55, attack: 0.1 }); break;
      case 'drain':
        for (let i = 0; i < 9; i++) b({ tone: 0.26, f0: 70, f1: 46, dur: 0.16, delay: 0.2 + i * 0.36 });
        b({ noise: 0.16, dur: 3.6, filter: 'bandpass', cutoff: 520, attack: 0.6 });
        b({ noise: 0.1, dur: 3.2, filter: 'bandpass', cutoff: 1500, delay: 0.5, attack: 0.8 });
        b({ tone: 0.06, f0: 300, f1: 110, dur: 3.4, delay: 0.3, attack: 0.5 });
        break;
      case 'isolator': b({ tone: 0.45, f0: 110, f1: 45, dur: 0.28 }); b({ noise: 0.3, dur: 0.06, filter: 'highpass', cutoff: 900 }); b({ tone: 0.07, f0: 100, f1: 100, dur: 0.9, type: 'square', delay: 0.1, attack: 0.1 }); break;
      case 'farprint': for (let i = 0; i < 20; i++) b({ noise: 0.05, dur: 0.03, filter: 'bandpass', cutoff: 1100 + (i % 4) * 150, delay: 0.9 + i * 0.075 }); break;
      case 'blast':
        for (let i = 0; i < 5; i++) { b({ tone: 0.42, f0: 80, f1: 38, dur: 0.24, delay: 0.5 + i * 0.34 }); b({ noise: 0.2, dur: 0.05, cutoff: 600, delay: 0.5 + i * 0.34 }); }
        b({ tone: 0.2, f0: 55, f1: 40, dur: 2.6, type: 'sawtooth', delay: 2.3, attack: 0.5 });
        b({ noise: 0.08, dur: 2.4, filter: 'bandpass', cutoff: 260, delay: 2.3, attack: 0.6 });
        break;
      case 'slosh': b({ noise: 0.16, dur: 0.7, filter: 'bandpass', cutoff: 900, attack: 0.12 }); b({ noise: 0.12, dur: 0.6, filter: 'bandpass', cutoff: 500, delay: 0.5, attack: 0.15 }); b({ noise: 0.1, dur: 0.6, filter: 'bandpass', cutoff: 1300, delay: 1.0, attack: 0.15 }); break;
      case 'tally': b({ tone: 0.09, f0: 1900, f1: 1700, dur: 0.16 }); b({ tone: 0.05, f0: 2800, f1: 2600, dur: 0.12, delay: 0.03 }); b({ noise: 0.14, dur: 0.02, filter: 'highpass', cutoff: 2600 }); break;
      case 'cage':
        b({ tone: 0.4, f0: 100, f1: 50, dur: 0.28 });
        b({ noise: 0.22, dur: 0.06, cutoff: 700 });
        b({ noise: 0.12, dur: 1.3, filter: 'bandpass', cutoff: 1500, delay: 0.5, attack: 0.2 });
        for (let i = 0; i < 9; i++) b({ noise: 0.1, dur: 0.03, filter: 'highpass', cutoff: 2000, delay: 0.55 + i * 0.13 });
        b({ tone: 0.3, f0: 85, f1: 45, dur: 0.22, delay: 1.8 });
        break;
      case 'telegraph':
        b({ tone: 0.05, f0: 150, f1: 150, dur: 2.4, type: 'sawtooth', attack: 0.3 });
        b({ noise: 0.07, dur: 2.4, filter: 'bandpass', cutoff: 2400, attack: 0.3 });
        for (let i = 0; i < 16; i++) b({ noise: 0.11, dur: 0.05, filter: 'highpass', cutoff: 3000, delay: 0.25 + i * 0.13 });
        break;
      case 'lamp': b({ tone: 0.2, f0: 70, f1: 60, dur: 1.6, attack: 0.5 }); b({ tone: 0.07, f0: 420, f1: 430, dur: 2.2, delay: 0.3, attack: 0.8 }); b({ noise: 0.2, dur: 0.04, filter: 'highpass', cutoff: 1500 }); break;
      default:
    }
  }
}
