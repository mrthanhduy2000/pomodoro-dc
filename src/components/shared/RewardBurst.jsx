/**
 * RewardBurst.jsx — the burst behind a reward, in THREE sizes = the three tiers of the ending (ADR-080).
 *
 *   brick     every session          — a puff of dust where the brick lands
 *   building  every few sessions     — a light ring + a fan of confetti
 *   rare      streak · level · era … — the whole screen: a wave, more confetti, a flash
 *
 * Đàm: "the three moments read the same; what is rare must FEEL rare." The difference is size and
 * count, not a new vocabulary — same three colours (ink · accent · accent2), same easing.
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
  brick: { count: 6, radius: 26, dot: 6, duration: 0.7, wave: false, flash: false },
  building: { count: 12, radius: 78, dot: 7, duration: 1.1, wave: true, flash: false },
  rare: { count: 24, radius: 190, dot: 8, duration: 1.4, wave: true, flash: true },
};

const COLORS = ['var(--ink)', 'var(--accent)', 'var(--accent2)'];
const EASE = [0.22, 1, 0.36, 1];

function Particle({ index, count, radius, dot, duration, delay }) {
  const angle = (index / count) * Math.PI * 2 + (index % 2) * 0.35;
  const dist = radius * (0.7 + ((index * 7) % 5) / 10);
  const x = Math.cos(angle) * dist;
  const y = Math.sin(angle) * dist - radius * 0.15;
  const fly = useCustomMotion({
    initial: { x: 0, y: 0, scale: 0.4, opacity: 0.95 },
    animate: { x, y, scale: [0.4, 1.1, 0.6], opacity: [0.95, 1, 0] },
    transition: { duration, ease: EASE, delay },
  });
  return (
    <motion.span
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 rounded-full"
      style={{ width: dot, height: dot, marginLeft: -dot / 2, marginTop: -dot / 2, background: COLORS[index % COLORS.length], opacity: 0 }}
      {...fly}
    />
  );
}

function Wave({ radius, duration, delay, color }) {
  const grow = useCustomMotion({
    initial: { scale: 0.2, opacity: 0.55 },
    animate: { scale: 1, opacity: 0 },
    transition: { duration: duration * 1.1, ease: 'easeOut', delay },
  });
  return (
    <motion.span
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 rounded-full"
      style={{ width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius, border: `2px solid ${color}`, opacity: 0 }}
      {...grow}
    />
  );
}

function Flash({ delay }) {
  const blink = useCustomMotion({
    initial: { opacity: 0 },
    animate: { opacity: [0, 0.14, 0] },
    transition: { duration: 0.5, ease: 'easeOut', delay },
  });
  return <motion.span aria-hidden="true" className="absolute inset-0" style={{ background: 'var(--accent)', opacity: 0 }} {...blink} />;
}

/**
 * @param {{ size?: 'brick'|'building'|'rare', delay?: number, className?: string }} props
 * Place it inside a `relative` box: the burst is centred on that box. `className` positions it
 * (e.g. `absolute inset-0` to cover the overlay).
 */
export default function RewardBurst({ size = 'brick', delay = 0.15, className = '' }) {
  const cfg = BURST_SIZES[size] ?? BURST_SIZES.brick;
  return (
    <span aria-hidden="true" className={`pointer-events-none block overflow-visible ${className}`}>
      {cfg.flash && <Flash delay={delay} />}
      {cfg.wave && <Wave radius={cfg.radius} duration={cfg.duration} delay={delay} color="var(--accent)" />}
      {Array.from({ length: cfg.count }, (_, i) => (
        <Particle key={i} index={i} count={cfg.count} radius={cfg.radius} dot={cfg.dot} duration={cfg.duration} delay={delay + (i % 4) * 0.03} />
      ))}
    </span>
  );
}
