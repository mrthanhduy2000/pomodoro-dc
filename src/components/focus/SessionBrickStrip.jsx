/**
 * SessionBrickStrip.jsx — "this session's brick", above the ring on the Focus screen (ADR-077).
 *
 * Replaces two things that used to share this column: the one-line city tease (often silent) and the
 * combo/multiplier badge row (numbers, not a story). Same height budget, one story: which building this
 * session pushes, and — while the timer runs — the brick being laid filling with the ring.
 * Reads the same store slices the city composition layer reads; never touches the 3D renderer.
 *
 * ADR-078 (Việc 2): the strip is also where Đàm CHANGES HIS MIND. Round 37 let the app pick a project
 * when the queue was empty and sent him to Hành trang › Công trình to disagree — a detour to undo a
 * decision the app made for him, i.e. the exact friction four rounds went to remove. Now «Đổi công
 * trình» opens, in place, the era's other projects (queued ones first — they keep their bricks — then
 * the cheapest fresh blueprints); one tap makes the choice the head of the queue
 * (`chooseSessionProject`, pure) and the strip, the postcard camera and the City tab all follow.
 * Idle only: a running session is laying a brick and does not swap walls under it.
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../../store/gameStore';
import { describeSessionBrick, listSessionProjectChoices } from '../../engine/sessionBrick';
import { useEnterMotion } from '../../lib/motionPresets';
import { getGlyph, hasGlyphIcon } from '../../utils/labelMark';
import ActionButton from '../shared/ActionButton';
import BrickRow from './BrickRow';

function ProjectGlyph({ icon, label }) {
  if (!icon) return null;
  return (
    <span aria-hidden="true" className={hasGlyphIcon(icon) ? 'text-[15px] leading-none' : 'mono text-[10px] uppercase tracking-[0.16em]'}>
      {getGlyph(icon, label ?? '', 'BP')}
    </span>
  );
}

export default function SessionBrickStrip({ phase = 'idle', progressRatio = 0 }) {
  const enterMotion = useEnterMotion();
  const craftingQueue = useGameStore((s) => s.craftingQueue);
  const buildings = useGameStore((s) => s.buildings);
  const activeBook = useGameStore((s) => s.progress.activeBook);
  const setSessionProject = useGameStore((s) => s.setSessionProject);
  const [switching, setSwitching] = useState(false);

  const brick = useMemo(
    () => describeSessionBrick({ craftingQueue, buildings, activeBook, phase, progressRatio }),
    [craftingQueue, buildings, activeBook, phase, progressRatio],
  );
  const canSwitch = phase === 'idle' && brick.status === 'building';
  const choices = useMemo(
    () => (canSwitch ? listSessionProjectChoices({ craftingQueue, activeBook, buildings }) : []),
    [canSwitch, craftingQueue, activeBook, buildings],
  );
  const running = phase === 'running';
  const open = canSwitch && switching && choices.length > 0;

  return (
    <motion.div
      {...enterMotion}
      className="flex w-full max-w-[360px] flex-col items-center gap-1.5 px-2 text-center"
      data-brick-status={brick.status}
      data-brick-switch={open ? 'open' : 'closed'}
    >
      <p className="flex items-center justify-center gap-1.5 text-[12.5px] leading-snug" style={{ color: running ? 'var(--muted)' : 'var(--ink)' }}>
        <ProjectGlyph icon={brick.icon} label={brick.label} />
        <span className="font-semibold">{brick.headline}</span>
      </p>
      {/* ADR-079: while the session runs the strip is ONE calm line — no brick row, no percent. The
          ring is the only progress indicator on the screen; the bricks land in the ending. */}
      {!running && brick.bricks.length > 0 && (
        <BrickRow bricks={brick.bricks} progressRatio={brick.progressRatio ?? 0} size={22} label={`${brick.done}/${brick.total} viên gạch · ${brick.label}`} />
      )}
      {!running && <p className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>{brick.sub}</p>}

      {canSwitch && choices.length > 0 && !open && (
        <ActionButton
          size="sm"
          variant="soft"
          className="mt-0.5"
          onClick={() => setSwitching(true)}
          title="Chọn công trình khác cho phiên này"
        >
          Đổi công trình
        </ActionButton>
      )}
      {open && (
        <motion.div {...enterMotion} className="mt-1 flex w-full flex-col gap-1.5">
          {choices.map((choice) => (
            <ActionButton
              key={choice.bpId}
              size="sm"
              variant="soft"
              className="w-full !justify-between gap-2 px-3"
              onClick={() => { setSessionProject(choice.bpId); setSwitching(false); }}
              title={`Đặt gạch cho ${choice.label} từ phiên này`}
            >
              <span className="flex min-w-0 items-center gap-1.5 text-left">
                <ProjectGlyph icon={choice.icon} label={choice.label} />
                <span className="whitespace-normal break-words">{choice.label}</span>
              </span>
              <span className="mono shrink-0 text-[10.5px]" style={{ color: 'var(--muted)' }}>
                {choice.queued ? `${choice.done}/${choice.total} viên` : `${choice.total} phiên`}
              </span>
            </ActionButton>
          ))}
          <ActionButton size="sm" variant="danger" onClick={() => setSwitching(false)}>
            Giữ {brick.label}
          </ActionButton>
        </motion.div>
      )}
    </motion.div>
  );
}
