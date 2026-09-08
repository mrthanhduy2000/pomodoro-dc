/**
 * BeatRipple.jsx — the visible half of a session beat (ADR-080): two rings that swell out of the
 * clock ring and fade, ~1.9 s, then nothing. It is mounted only while `resolveBeat` returns a beat
 * and keyed by the beat id, so it plays exactly once per beat.
 *
 * Peripheral on purpose: it emanates from the ring the eye already rests on, carries no text and no
 * number, and dies where it was born. Under "Reduce motion" the presets return no motion and both
 * rings keep their resting opacity of 0 — a beat then exists only as the whisper in the label.
 */
import { motion } from 'framer-motion';
import { useCustomMotion } from '../../lib/motionPresets';

export default function BeatRipple({ color = 'var(--accent)' }) {
  // Two waves, ~2 s in all. Measured in the sandbox at 2 px / 0.6: invisible in a screenshot 0.7 s in —
  // a signal at the edge of sight still has to exist; 3 px and a slower fade put it there. Reach is
  // capped at 1.42× so on a 340 px desktop ring the wave dies before the strip headline above it.
  const first = useCustomMotion({
    initial: { scale: 1, opacity: 0.85 },
    animate: { scale: 1.25, opacity: 0 },
    transition: { duration: 2, ease: 'easeOut' },
  });
  const second = useCustomMotion({
    initial: { scale: 1, opacity: 0.55 },
    animate: { scale: 1.42, opacity: 0 },
    transition: { duration: 2.4, ease: 'easeOut', delay: 0.3 },
  });
  const ring = { border: `3px solid ${color}`, opacity: 0 };
  return (
    <>
      <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full" style={ring} {...first} />
      <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full" style={ring} {...second} />
    </>
  );
}
