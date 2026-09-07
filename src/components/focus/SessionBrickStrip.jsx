/**
 * SessionBrickStrip.jsx — "this session's brick", above the ring on the Focus screen (ADR-077).
 *
 * Replaces two things that used to share this column: the one-line city tease (often silent) and the
 * combo/multiplier badge row (numbers, not a story). Same height budget, one story: which building this
 * session pushes, and — while the timer runs — the brick being laid filling with the ring.
 * Reads the same store slices the city composition layer reads; never touches the 3D renderer.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../../store/gameStore';
import { describeSessionBrick } from '../../engine/sessionBrick';
import { useEnterMotion } from '../../lib/motionPresets';
import { getGlyph, hasGlyphIcon } from '../../utils/labelMark';
import BrickRow from './BrickRow';

export default function SessionBrickStrip({ phase = 'idle', progressRatio = 0 }) {
  const enterMotion = useEnterMotion();
  const craftingQueue = useGameStore((s) => s.craftingQueue);
  const buildings = useGameStore((s) => s.buildings);
  const activeBook = useGameStore((s) => s.progress.activeBook);
  const brick = useMemo(
    () => describeSessionBrick({ craftingQueue, buildings, activeBook, phase, progressRatio }),
    [craftingQueue, buildings, activeBook, phase, progressRatio],
  );
  const running = phase === 'running';
  return (
    <motion.div
      {...enterMotion}
      className="flex w-full max-w-[360px] flex-col items-center gap-1.5 px-2 text-center"
      data-brick-status={brick.status}
    >
      <p className="flex items-center justify-center gap-1.5 text-[12.5px] leading-snug" style={{ color: running ? 'var(--muted)' : 'var(--ink)' }}>
        {brick.icon && (
          <span aria-hidden="true" className={hasGlyphIcon(brick.icon) ? 'text-[15px] leading-none' : 'mono text-[10px] uppercase tracking-[0.16em]'}>
            {getGlyph(brick.icon, brick.label ?? '', 'BP')}
          </span>
        )}
        <span className="font-semibold">{brick.headline}</span>
      </p>
      {brick.bricks.length > 0 && (
        <BrickRow bricks={brick.bricks} progressRatio={brick.progressRatio ?? 0} size={running ? 20 : 22} label={`${brick.done}/${brick.total} viên gạch · ${brick.label}`} />
      )}
      <p className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>{brick.sub}</p>
    </motion.div>
  );
}
