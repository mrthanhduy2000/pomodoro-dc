/** Short synthesised sounds, so v2 ships no audio files. Silent if audio is blocked. */
let ctx = null;

/** Two rising notes: the session is done. */

export function chime() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    [523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, t + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + i * 0.18);
      osc.stop(t + i * 0.18 + 1);
    });
  } catch {
    // audio unavailable (autoplay policy, old browser) — the visual panel still shows
  }
}

/** A soft wooden knock: the brick lands on its storey (plan: "the camera flies… with a sound"). */
export function thud() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.16);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  } catch {
    // audio unavailable — the storey still drops
  }
}
