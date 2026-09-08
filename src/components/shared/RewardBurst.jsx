/**
 * RewardBurst.jsx — the burst behind a reward, in THREE sizes = the three tiers of the ending
 * (ADR-080; redrawn in ADR-081 after the first photographs of it).
 *
 *   brick     every session          — a puff of dust where the brick lands
 *   building  every few sessions     — a light ring + a fan of confetti
 *   rare      streak · level · era … — the whole screen: a wave, more confetti, a flash
 *
 * ⚠️ REDRAWN ONCE IT COULD BE SEEN (ADR-081). Round 40 shipped this blind — the sandbox could not
 * photograph anything under 1.5 s, so "the DOM has 20 particles" stood in for "it looks good". With
 * `--dilate` the first real frames showed two faults no test could have caught:
 *   1. A THIRD OF THE CONFETTI WAS INVISIBLE. The palette was ink · accent · accent2, and on the
 *      dark canvas `--accent2` (#8a3f24) reads as a smudge, not a spark. Two colours now, both of
 *      which carry on either theme.
 *   2. THE PARTICLES FLEW THROUGH THE TEXT. A full circle around a glyph that sits directly above
 *      a headline means half the confetti lands on the words. They now leave in an UPWARD FAN
 *      (−165°…−15°) and fall back a little, so the copy underneath stays clean.
 * Sizes vary per particle and every one is a small rounded shard rather than a uniform dot — dust
 * and confetti, not a ring of identical circles.
 *
 * It happens and it is gone: every particle ends at opacity 0 and nothing stays on screen. It never
 * blocks (pointer-events none, no button, no timer of its own). Under "Reduce motion" the presets
 * return no motion and every particle keeps its resting opacity of 0 — the burst simply does not
 * exist, which is the right amount of confetti for someone who asked for none.
 *
 * Positions are a fixed pattern per index, not random: the burst looks the same on every run and in
 * every screenshot, so a change is a change.
 */
import { motion } from 'framer-motion';
import { useCustomMotion } from '../../lib/motionPresets';

const BURST_SIZES = {
  brick: { count: 7, radius: 34, dot: 5, duration: 0.7, wave: false, flash: false },
  building: { count: 13, radius: 86, dot: 6, duration: 1.1, wave: true, flash: false },
  rare: { count: 25, radius: 200, dot: 7, duration: 1.4, wave: true, flash: true },
};

/** Two colours only — both stay legible on either canvas (see the header). */
const COLORS = ['var(--accent)', 'var(--ink)'];
const EASE = [0.22, 1, 0.36, 1];

function Particle({ index, count, radius, dot, duration, delay }) {
  // An upward fan: −165°…−15°, so nothing flies down into the headline under the glyph.
  const angle = (-165 + (150 * index) / Math.max(1, count - 1) + (index % 3) * 4) * (Math.PI / 180);
  const dist = radius * (0.62 + ((index * 7) % 6) / 12);
  const x = Math.cos(angle) * dist;
  const y = Math.sin(angle) * dist;
  // Gravity: out and up, then a little back down — a spark, not a laser.
  const size = dot + ((index * 5) % 3) - 1;
  const fly = useCustomMotion({
    initial: { x: 0, y: 0, scale: 0.5, opacity: 0 },
    animate: {
      x: [0, x, x * 1.12],
      y: [0, y, y * 0.72],
      scale: [0.5, 1, 0.7],
      opacity: [0, 1, 0],
      rotate: [0, (index % 2 ? 1 : -1) * 70],
    },
    transition: { duration, ease: EASE, delay, times: [0, 0.45, 1] },
  });
  return (
    <motion.span
      aria-hidden="true"
      className="absolute left-1/2 top-1/2"
      style={{
        width: size * (index % 4 === 0 ? 1.7 : 1),
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: Math.max(1, Math.round(size / 2.5)),
        background: COLORS[index % COLORS.length],
        opacity: 0,
      }}
      {...fly}
    />
  );
}

function Wave({ radius, duration, delay, color }) {
  const grow = useCustomMotion({
    initial: { scale: 0.25, opacity: 0.7 },
    animate: { scale: 1, opacity: 0 },
    transition: { duration: duration * 1.1, ease: 'easeOut', delay },
  });
  return (
    <motion.span
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 rounded-full"
      style={{ width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius, border: `2.5px solid ${color}`, opacity: 0 }}
      {...grow}
    />
  );
}

function Flash({ delay }) {
  const blink = useCustomMotion({
    initial: { opacity: 0 },
    animate: { opacity: [0, 0.16, 0] },
    transition: { duration: 0.55, ease: 'easeOut', delay },
  });
  return <motion.span aria-hidden="true" className="absolute inset-0" style={{ background: 'var(--accent)', opacity: 0 }} {...blink} />;
}

/**
 * @param {{ size?: 'brick'|'building'|'rare', delay?: number, className?: string }} props
 * Place it inside a `relative` box: the burst is centred on that box. `className` positions it
 * (e.g. `absolute inset-0` to cover the overlay).
 */
export default function RewardBurst({ size = 'brick', delay = 0.12, className = '' }) {
  const cfg = BURST_SIZES[size] ?? BURST_SIZES.brick;
  return (
    <span aria-hidden="true" className={`pointer-events-none block overflow-visible ${className}`}>
      {cfg.flash && <Flash delay={delay} />}
      {cfg.wave && <Wave radius={cfg.radius} duration={cfg.duration} delay={delay} color="var(--accent)" />}
      {Array.from({ length: cfg.count }, (_, i) => (
        <Particle key={i} index={i} count={cfg.count} radius={cfg.radius} dot={cfg.dot} duration={cfg.duration} delay={delay + (i % 5) * 0.035} />
      ))}
    </span>
  );
}
