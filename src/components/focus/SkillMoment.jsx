import React, { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import useGameStore from '../../store/gameStore';
import RewardBurst from '../shared/RewardBurst';
import { useEnterMotion, useRewardMotion } from '../../lib/motionPresets';

/**
 * SkillMoment.jsx — OPENING A SKILL IS A MOMENT (round 45, ADR-085).
 *
 * ⚠️ WHAT IT REPLACES. Unlocking a skill was a tap and a cell changing colour. Đàm's test for the
 * round is *"tôi mở một kỹ năng, và tôi biết ngay app vừa khác đi ở chỗ nào"* — and a colour change
 * cannot answer it, because nothing else on any screen moved. Round 44 handed him 40 points and
 * twelve unlockable skills; without this, that is twelve taps and no twelve moments.
 *
 * ⚠️ IT SAYS A NUMBER HE OWNS, NOT A PERCENTAGE. The line comes from `engine/skillPreview.js`,
 * which runs the REAL reward formula with the skill off and on and subtracts — so it is measured
 * against his own median session, and it cannot drift from the game because it is the game.
 *
 * ⚠️ IT HAPPENS AND IT IS GONE (ADR-080, static budget zero). Four seconds, no button to dismiss
 * beyond tapping it, nothing blocked underneath, and it never returns for the same unlock. A skill
 * unlock is rare — roughly one per finished building now — so it is exactly the kind of event that
 * earns a moment rather than a permanent badge.
 *
 * ⚠️ MOUNTED OUTSIDE `GlobalOverlays`, like `DayMoment`. That component early-returns null when
 * nothing is blocking, so anything inside it never renders on an ordinary screen — the bug that
 * kept round 41's day banner invisible until it was found by photograph.
 */

/** How long the moment stands before it leaves on its own. */
export const VISIBLE_MS = 4200;

export default function SkillMoment() {
  const moment = useGameStore((s) => s.ui.skillUnlocked);
  const dismissSkillUnlocked = useGameStore((s) => s.dismissSkillUnlocked);
  const enterMotion = useEnterMotion();
  const rewardMotion = useRewardMotion();
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    window.clearTimeout(timerRef.current);
    dismissSkillUnlocked();
  }, [dismissSkillUnlocked]);

  useEffect(() => {
    if (!moment) return undefined;
    timerRef.current = window.setTimeout(() => dismissSkillUnlocked(), VISIBLE_MS);
    return () => window.clearTimeout(timerRef.current);
    // ⚠️ Keyed on the skill id, not on the object: the store hands back a new object on every
    // unrelated render, and re-arming the timer each time would keep the banner alive forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment?.id, dismissSkillUnlocked]);

  return (
    <AnimatePresence>
      {moment && (
        <motion.div
          key={moment.id}
          {...enterMotion}
          className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
          /* Same 96px as `DayMoment`: clears the top rail at 390px and at 1280px, so the
             notification bell never paints over the title. */
          style={{ top: 'calc(env(safe-area-inset-top) + 96px)' }}
        >
          <motion.button
            type="button"
            {...rewardMotion}
            onClick={dismiss}
            aria-label={`Đã mở ${moment.label}. ${moment.line} Chạm để đóng.`}
            className="pointer-events-auto relative w-full max-w-[420px] overflow-visible px-5 py-3.5 text-left"
            style={{
              borderRadius: 'var(--skin-radius-card, 18px)',
              background: 'var(--card-bg-solid)',
              border: '1px solid color-mix(in srgb, var(--accent) 40%, var(--line))',
              boxShadow: 'var(--skin-card-shadow)',
            }}
          >
            <RewardBurst size="building" className="absolute inset-0" />
            <span className="mono relative block text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
              Kỹ năng mới
            </span>
            <span className="relative mt-1 block text-[16px] font-semibold leading-snug" style={{ color: 'var(--ink)' }}>
              {moment.label}
            </span>
            <span className="relative mt-0.5 block text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>
              {moment.line}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
