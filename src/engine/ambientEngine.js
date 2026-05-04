/**
 * ambientEngine.js — Procedural ambient sounds via Web Audio API
 * Zero asset files — all sounds generated algorithmically.
 */

// ─── Sound configs ────────────────────────────────────────────────────────────
const CONFIGS = {
  rain: {
    noise: 'white',
    gain: 0.7,
    filters: [
      { type: 'bandpass', freq: 1200, Q: 0.6 },
      { type: 'lowpass',  freq: 3000 },
    ],
  },
  wind: {
    noise: 'pink',
    gain: 0.55,
    filters: [
      { type: 'lowpass',  freq: 500,  Q: 0.8 },
      { type: 'highpass', freq: 80 },
    ],
    lfo: { rate: 0.07, depth: 180, target: 'filter' },
  },
  forest: {
    noise: 'pink',
    gain: 0.45,
    filters: [
      { type: 'lowpass',  freq: 1000 },
      { type: 'bandpass', freq: 700,  Q: 0.4 },
    ],
    lfo: { rate: 0.15, depth: 120, target: 'filter' },
  },
  coffee: {
    noise: 'brown',
    gain: 0.4,
    filters: [
      { type: 'lowpass',  freq: 450 },
    ],
    lfo: { rate: 0.05, depth: 60, target: 'gain' },
  },
  waves: {
    noise: 'white',
    gain: 0.65,
    filters: [
      { type: 'lowpass',  freq: 600 },
    ],
    lfo: { rate: 0.09, depth: 0.25, target: 'gain' },
  },
  fireplace: {
    noise: 'brown',
    gain: 0.5,
    filters: [
      { type: 'lowpass',  freq: 320 },
    ],
  },
};

// ─── Noise buffer generators ──────────────────────────────────────────────────
function fillWhite(data) {
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

function fillPink(data) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
}

function fillBrown(data) {
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    data[i] = (last + 0.02 * w) / 1.02;
    last = data[i];
    data[i] *= 3.5;
  }
}

// ─── Engine ───────────────────────────────────────────────────────────────────
class AmbientEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx          = null;
    /** @type {GainNode|null} */
    this._masterGain   = null;
    this._activeNodes  = [];
    this._currentSound = 'none';
    this.volume        = 0.3;
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  _buildNoiseBuffer(type, seconds = 6) {
    const ctx  = this._getCtx();
    const len  = ctx.sampleRate * seconds;
    const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    if (type === 'pink')  fillPink(data);
    else if (type === 'brown') fillBrown(data);
    else fillWhite(data);
    return buf;
  }

  /** Start playing a named ambient sound. Stops any previous sound first. */
  play(soundType, volumeOverride) {
    this.stop();
    if (!soundType || soundType === 'none') return;

    const cfg = CONFIGS[soundType];
    if (!cfg) return;

    const ctx = this._getCtx();
    const vol = volumeOverride ?? this.volume;
    this._currentSound = soundType;
    this._activeNodes  = [];

    // Master gain
    const master = ctx.createGain();
    master.gain.value = vol * cfg.gain;
    master.connect(ctx.destination);
    this._masterGain = master;
    this._activeNodes.push(master);

    // Noise source (looping)
    const src = ctx.createBufferSource();
    src.buffer = this._buildNoiseBuffer(cfg.noise);
    src.loop   = true;
    this._activeNodes.push(src);

    // Filter chain
    let tail = src;
    const firstFilter = { node: null };
    for (const fDef of (cfg.filters ?? [])) {
      const f = ctx.createBiquadFilter();
      f.type            = fDef.type;
      f.frequency.value = fDef.freq  ?? 1000;
      if (fDef.Q !== undefined) f.Q.value = fDef.Q;
      tail.connect(f);
      tail = f;
      if (!firstFilter.node) firstFilter.node = f;
      this._activeNodes.push(f);
    }
    tail.connect(master);

    // LFO (optional)
    if (cfg.lfo) {
      const lfo     = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type            = 'sine';
      lfo.frequency.value = cfg.lfo.rate ?? 0.1;
      lfoGain.gain.value  = cfg.lfo.depth ?? 100;
      lfo.connect(lfoGain);

      if (cfg.lfo.target === 'gain') {
        // Modulate master gain (creates fade-in/out "breathing" effect)
        lfoGain.gain.value = cfg.lfo.depth;   // depth is absolute gain units here
        lfoGain.connect(master.gain);
      } else if (firstFilter.node) {
        lfoGain.connect(firstFilter.node.frequency);
      }

      lfo.start();
      this._activeNodes.push(lfo, lfoGain);
    }

    src.start();
  }

  /** Stop all active ambient nodes. */
  stop() {
    for (const node of this._activeNodes) {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch { /* already stopped / disconnected */ }
    }
    this._activeNodes  = [];
    this._masterGain   = null;
    this._currentSound = 'none';
  }

  /** Adjust volume without restarting sound. */
  setVolume(vol) {
    this.volume = vol;
    if (this._masterGain) {
      const cfg = CONFIGS[this._currentSound];
      this._masterGain.gain.value = vol * (cfg?.gain ?? 0.5);
    }
  }

  get isPlaying() {
    return this._currentSound !== 'none' && this._activeNodes.length > 0;
  }
}

const ambientEngine = new AmbientEngine();
export default ambientEngine;
