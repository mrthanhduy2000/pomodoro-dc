/** A short two-note chime, synthesised so v2 ships no audio files. Silent if audio is blocked. */
let ctx = null;

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
