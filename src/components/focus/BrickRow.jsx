/**
 * BrickRow.jsx — the brick strip shared by the Focus screen and the ending card (ADR-077).
 *
 * One cell per session the building needs. States come from `engine/sessionBrick.js`:
 *   laid   — a session already spent on it
 *   laying — the brick THIS session is laying; its fill follows the timer (`progressRatio`)
 *   new    — laid by the session that just ended (springs in on the ending card)
 *   empty  — still to come
 * Motion goes through the shared presets only: `useRewardMotion` for the new brick, `useSnapMotion`
 * for the fill because its width IS the progress (returning `{}` there would blank the bar).
 */
import { motion } from 'framer-motion';
import { useRewardMotion, useSnapMotion, withDelay } from '../../lib/motionPresets';

const EASE = [0.22, 1, 0.36, 1];

function Brick({ state, index, progressRatio, size }) {
  const rewardMotion = useRewardMotion();
  const fillMotion = useSnapMotion({
    initial: { width: '0%' },
    animate: { width: `${Math.round((state === 'laying' ? progressRatio : state === 'empty' ? 0 : 1) * 100)}%` },
    transition: { duration: 0.6, ease: EASE },
  });
  const isNew = state === 'new';
  const isLaying = state === 'laying';
  const base = {
    width: size,
    height: Math.round(size * 0.62),
    borderRadius: Math.max(3, Math.round(size * 0.18)),
    background: state === 'laid' || isNew ? 'var(--accent)' : 'var(--timer-track)',
    border: isLaying ? '1.5px solid rgba(var(--accent-rgb), 0.55)' : '1.5px solid transparent',
    boxShadow: isNew ? '0 4px 12px rgba(var(--accent-rgb), 0.35)' : 'none',
    overflow: 'hidden',
    position: 'relative',
    flex: '0 0 auto',
  };
  const Tag = isNew ? motion.span : 'span';
  const motionProps = isNew ? withDelay(rewardMotion, 0.25 + index * 0.05) : {};
  return (
    <Tag aria-hidden="true" style={base} {...motionProps}>
      {isLaying && (
        <motion.span
          {...fillMotion}
          className="absolute inset-y-0 left-0"
          style={{ background: 'var(--accent)', opacity: 0.85 }}
        />
      )}
    </Tag>
  );
}

/**
 * @param {{ bricks: string[], progressRatio?: number, size?: number, className?: string, label?: string }} props
 */
export default function BrickRow({ bricks = [], progressRatio = 0, size = 22, className = '', label }) {
  if (!bricks.length) return null;
  const laid = bricks.filter((b) => b === 'laid' || b === 'new').length;
  // 11-session wonders at 390px: shrink cells instead of wrapping — a wrapped brick row reads as two buildings.
  const cell = bricks.length > 8 ? Math.round(size * 0.78) : size;
  return (
    <div
      className={`flex items-center justify-center gap-1.5 ${className}`}
      role="progressbar"
      aria-valuenow={laid}
      aria-valuemin={0}
      aria-valuemax={bricks.length}
      aria-label={label ?? `${laid}/${bricks.length} viên gạch`}
    >
      {bricks.map((state, i) => (
        <Brick key={i} state={state} index={i} progressRatio={progressRatio} size={cell} />
      ))}
    </div>
  );
}
