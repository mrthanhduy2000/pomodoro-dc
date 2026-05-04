/**
 * soundEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 100% procedural audio via Web Audio API — zero asset files required.
 * Every sound is synthesised from oscillators and gain envelopes.
 *
 * Sound Packs:
 *   classic   — Musical, warm triangle/sine waves (default)
 *   nature    — Soft, organic sine waves, lower frequencies
 *   synthwave — Retro electronic, sawtooth/square, detuned chords
 *   minimal   — Ultra-quiet, barely-there, skips non-essential sounds
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Pack parameter tables ─────────────────────────────────────────────────────
const PACKS = {
  classic: {
    sessionStart: { type: 'triangle', freqs: [392, 523.25], step: 0.08, dur: 0.18, gain: 0.24 },
    tick:         { type: 'sine',     freq: 880,  dur: 0.04, gain: 0.08 },
    urgentTick:   { type: 'square',   freq: 1200, dur: 0.06, gain: 0.18 },
    finish:       { type: 'triangle', freqs: [523.25, 659.25, 783.99], step: 0.12, dur: 0.5, gain: 0.5 },
    levelUp:      { type: 'triangle', freqs: [392, 494, 587, 698, 784], step: 0.09, dur: 0.35, gain: 0.45 },
    milestone:    { type: 'sine',     pairs: [[660, 880], [880, 1047]], gain: 0.3 },
    breakStart:   { type: 'sine',     pairs: [[440, 330], [550, 440]], gain: 0.3, offset: 0.1 },
    skillUnlock:  { type: 'sine',     freqs: [1047, 1319, 1568], step: 0.06, dur: 0.25, gain: 0.35 },
    jackpot:      { type: 'triangle', freqs: [261, 329, 392, 523, 659, 784, 1047], step: 0.07, dur: 0.4, gain: 0.55 },
    disaster:     { rumbleFreq: 120, rumbleEnd: 55, tritone: [185, 131] },
    eraChange:    { type: 'sine',     chord: [261.63, 329.63, 392.00, 523.25] },
    chestOpen:    { freqs: [2093, 2637, 3136, 4186], gain: 0.25 },
  },
  nature: {
    sessionStart: { type: 'sine',     freqs: [329.63, 440], step: 0.10, dur: 0.20, gain: 0.18 },
    tick:         { type: 'sine',     freq: 528,  dur: 0.10, gain: 0.05 },
    urgentTick:   { type: 'sine',     freq: 660,  dur: 0.10, gain: 0.09 },
    finish:       { type: 'sine',     freqs: [261.63, 392.00, 523.25], step: 0.15, dur: 0.7, gain: 0.35 },
    levelUp:      { type: 'sine',     freqs: [329, 415, 523, 659, 783], step: 0.12, dur: 0.5, gain: 0.30 },
    milestone:    { type: 'sine',     pairs: [[440, 523], [523, 659]], gain: 0.22 },
    breakStart:   { type: 'sine',     pairs: [[330, 220], [440, 330]], gain: 0.22, offset: 0.15 },
    skillUnlock:  { type: 'sine',     freqs: [659, 784, 1047], step: 0.08, dur: 0.35, gain: 0.25 },
    jackpot:      { type: 'sine',     freqs: [261, 329, 392, 523, 659, 784, 1047], step: 0.10, dur: 0.5, gain: 0.35 },
    disaster:     { rumbleFreq: 80,  rumbleEnd: 40, tritone: [147, 110] },
    eraChange:    { type: 'sine',     chord: [130.81, 196.00, 261.63, 329.63] },
    chestOpen:    { freqs: [1047, 1319, 1568, 2093], gain: 0.18 },
  },
  synthwave: {
    sessionStart: { type: 'sawtooth', freqs: [440, 659.25], step: 0.07, dur: 0.14, gain: 0.20 },
    tick:         { type: 'square',   freq: 1760, dur: 0.025, gain: 0.05 },
    urgentTick:   { type: 'sawtooth', freq: 2200, dur: 0.04,  gain: 0.14 },
    finish:       { type: 'sawtooth', freqs: [440, 659.25, 880, 1047], step: 0.10, dur: 0.4, gain: 0.4 },
    levelUp:      { type: 'sawtooth', freqs: [220, 330, 440, 660, 880, 1047], step: 0.07, dur: 0.3, gain: 0.4 },
    milestone:    { type: 'square',   pairs: [[880, 1320], [1320, 1760]], gain: 0.22 },
    breakStart:   { type: 'sawtooth', pairs: [[880, 660], [660, 440]], gain: 0.18, offset: 0.08 },
    skillUnlock:  { type: 'square',   freqs: [1760, 2093, 2637], step: 0.05, dur: 0.20, gain: 0.28 },
    jackpot:      { type: 'sawtooth', freqs: [220, 330, 440, 660, 880, 1047, 1320], step: 0.055, dur: 0.35, gain: 0.5 },
    disaster:     { rumbleFreq: 140, rumbleEnd: 60, tritone: [220, 155] },
    eraChange:    { type: 'sawtooth', chord: [220, 277.18, 329.63, 440] },
    chestOpen:    { freqs: [1760, 2093, 2637, 3136], gain: 0.22 },
  },
  minimal: {
    sessionStart: { type: 'sine',     freqs: [392, 523.25], step: 0.10, dur: 0.14, gain: 0.14 },
    tick:         { type: 'sine',     freq: 1047, dur: 0.02, gain: 0.03 },
    urgentTick:   { type: 'sine',     freq: 1047, dur: 0.03, gain: 0.06 },
    finish:       { type: 'sine',     freqs: [523.25, 783.99], step: 0.15, dur: 0.4, gain: 0.25 },
    levelUp:      { type: 'sine',     freqs: [523, 783], step: 0.15, dur: 0.3, gain: 0.25 },
    milestone:    { type: 'sine',     pairs: [[660, 880]], gain: 0.15 },
    breakStart:   { type: 'sine',     pairs: [[440, 330]], gain: 0.15, offset: 0 },
    skillUnlock:  { type: 'sine',     freqs: [1047, 1319], step: 0.08, dur: 0.2, gain: 0.2 },
    jackpot:      { type: 'sine',     freqs: [523, 659, 784, 1047], step: 0.10, dur: 0.35, gain: 0.3 },
    disaster:     { rumbleFreq: 100,  rumbleEnd: 50, tritone: [165, 123] },
    eraChange:    { type: 'sine',     chord: [261.63, 392.00, 523.25] },
    chestOpen:    { freqs: [1047, 1568], gain: 0.18 },
  },
};

// ── SoundEngine class ─────────────────────────────────────────────────────────
class SoundEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx  = null;
    this.enabled = true;
    this.volume  = 0.6;
    this.pack    = 'classic';
  }

  // ── Pack selection ──────────────────────────────────────────────────────
  setPack(packName) {
    this.pack = PACKS[packName] ? packName : 'classic';
  }

  /** Shorthand to get current pack params */
  _p(key) {
    return PACKS[this.pack]?.[key] ?? PACKS.classic[key];
  }

  // ── Lazy AudioContext init ──────────────────────────────────────────────
  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  // ── Low-level helpers ───────────────────────────────────────────────────
  _osc({ type = 'sine', freq, freqEnd, startTime, duration,
          gainStart = 0.5, gainEnd = 0.0, destination }) {
    const ctx  = this._getCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);
    }
    gain.gain.setValueAtTime(gainStart * this.volume, startTime);
    gain.gain.linearRampToValueAtTime(gainEnd * this.volume, startTime + duration);

    osc.connect(gain);
    gain.connect(destination ?? ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // ── Arpeggio helper — plays an array of frequencies with a step delay ──
  _arpeggio({ type, freqs, step, duration, gainStart, t }) {
    freqs.forEach((freq, i) => {
      this._osc({ type, freq, freqEnd: freq * 1.005,
                  startTime: t + i * step,
                  duration, gainStart, gainEnd: 0 });
    });
  }

  // ── Public Sound API ────────────────────────────────────────────────────

  /** Short confirm cue when a Pomodoro session starts */
  playSessionStart() {
    if (!this.enabled) return;
    const p = this._p('sessionStart');
    if (!p?.freqs?.length) return;
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    this._arpeggio({ type: p.type, freqs: p.freqs, step: p.step, duration: p.dur, gainStart: p.gain, t });
  }

  /** Soft tick — played each second while the timer is running */
  playTick() {
    if (!this.enabled) return;
    const p   = this._p('tick');
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    this._osc({ type: p.type, freq: p.freq, freqEnd: p.freq,
                 startTime: t, duration: p.dur, gainStart: p.gain, gainEnd: 0 });
  }

  /** Loud urgent tick — last 10 seconds countdown */
  playUrgentTick() {
    if (!this.enabled) return;
    const p   = this._p('urgentTick');
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    this._osc({ type: p.type, freq: p.freq,
                 startTime: t, duration: p.dur, gainStart: p.gain, gainEnd: 0 });
  }

  /** Triumphant chord or fanfare when timer finishes */
  playTimerFinish() {
    if (!this.enabled) return;
    const p   = this._p('finish');
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    this._arpeggio({ type: p.type, freqs: p.freqs, step: p.step,
                     duration: p.dur, gainStart: p.gain, t });
    // Sub-bass thump on all packs except minimal
    if (this.pack !== 'minimal') {
      this._osc({ type: 'sine', freq: 80, freqEnd: 50, startTime: t,
                   duration: 0.25, gainStart: 0.5, gainEnd: 0 });
    }
  }

  /** Sparkly shimmer cascade when loot chest opens */
  playChestOpen() {
    if (!this.enabled) return;
    const p   = this._p('chestOpen');
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    p.freqs.forEach((freq, i) => {
      this._osc({ type: 'sine', freq, startTime: t + i * 0.08,
                   duration: 0.3, gainStart: p.gain, gainEnd: 0 });
    });
  }

  /** Bombastic fanfare for jackpot */
  playJackpot() {
    if (!this.enabled) return;
    const p   = this._p('jackpot');
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    this._arpeggio({ type: p.type, freqs: p.freqs, step: p.step,
                     duration: p.dur, gainStart: p.gain, t });
    this._osc({ type: 'sine', freq: 65, freqEnd: 40, startTime: t,
                 duration: 0.4, gainStart: 0.7, gainEnd: 0 });
  }

  /** Rising arpeggio on level up */
  playLevelUp() {
    if (!this.enabled) return;
    const p   = this._p('levelUp');
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    this._arpeggio({ type: p.type, freqs: p.freqs, step: p.step,
                     duration: p.dur, gainStart: p.gain, t });
  }

  /** Ominous descending rumble for disasters */
  playDisaster() {
    if (!this.enabled) return;
    const p   = this._p('disaster');
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    this._osc({ type: 'sawtooth', freq: p.rumbleFreq, freqEnd: p.rumbleEnd,
                 startTime: t, duration: 1.2, gainStart: 0.45, gainEnd: 0 });
    p.tritone.forEach((freq, i) => {
      this._osc({ type: 'square', freq,
                   startTime: t + 0.1 + i * 0.05, duration: 0.8,
                   gainStart: 0.18, gainEnd: 0 });
    });
  }

  /** Cinematic long tone for era change */
  playEraChange() {
    if (!this.enabled) return;
    const p   = this._p('eraChange');
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    p.chord.forEach((freq) => {
      this._osc({ type: p.type, freq, freqEnd: freq * 1.004,
                   startTime: t, duration: 2.0, gainStart: 0.30, gainEnd: 0 });
    });
    if (this.pack !== 'minimal') {
      this._osc({ type: 'triangle', freq: p.chord[0] * 0.5, freqEnd: p.chord[0] * 0.5 + 1,
                   startTime: t, duration: 1.5, gainStart: 0.35, gainEnd: 0 });
    }
  }

  /** Short magical tinkle on skill unlock */
  playSkillUnlock() {
    if (!this.enabled) return;
    const p   = this._p('skillUnlock');
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    this._arpeggio({ type: p.type, freqs: p.freqs, step: p.step,
                     duration: p.dur, gainStart: p.gain, t });
  }

  /** Soft two-tone chime at 25/50/75% session progress */
  playMilestone() {
    if (!this.enabled) return;
    const p   = this._p('milestone');
    if (!p?.pairs?.length) return;
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    p.pairs.forEach(([from, to], i) => {
      this._osc({ type: p.type, freq: from, freqEnd: to,
                   startTime: t + i * 0.18, duration: 0.25,
                   gainStart: p.gain * (i === 0 ? 1 : 0.75), gainEnd: 0 });
    });
  }

  /** Two-note "ting ting" chime when the final 5-minute window begins */
  playExtensionReady() {
    if (!this.enabled) return;
    const p   = this._p('milestone');
    if (!p?.pairs?.length) return;
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    const [from, to] = p.pairs[p.pairs.length - 1];
    [0, 1].forEach((_, i) => {
      this._osc({
        type: p.type,
        freq: from,
        freqEnd: to,
        startTime: t + i * 0.18,
        duration: 0.22,
        gainStart: p.gain * (i === 0 ? 0.78 : 1.02),
        gainEnd: 0,
      });
    });
  }

  /** Gentle descending two-note exhale for break start */
  playBreakStart() {
    if (!this.enabled) return;
    const p   = this._p('breakStart');
    if (!p?.pairs?.length) return;
    const ctx = this._getCtx();
    const t   = ctx.currentTime;
    p.pairs.forEach(([from, to], i) => {
      this._osc({ type: p.type, freq: from, freqEnd: to,
                   startTime: t + i * (p.offset ?? 0.1), duration: 0.5,
                   gainStart: p.gain, gainEnd: 0 });
    });
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────
const soundEngine = new SoundEngine();
export default soundEngine;
