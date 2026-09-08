/**
 * CityMoment.jsx — THE CITY TAB REACTS WHEN A BUILDING HAS FINISHED (round 46, ADR-086).
 *
 * The sentence comes from `engine/cityArrival.js` (a difference of counts, stamped per device in
 * `CityView.jsx`); this file only draws it. It sits INSIDE the picture frame, bottom-left, in the
 * slot the building card normally uses — the camera is flying to the new building at the same
 * moment, so the words land where the eye already is.
 *
 * ⚠️ IT HAPPENS AND IT IS GONE (ADR-080). `ARRIVAL_VISIBLE_MS` and out; a tap closes it sooner;
 * nothing underneath is blocked (the wrapper is `pointer-events-none`, only the card itself is
 * tappable). Same burst as the ending card's building tier — one vocabulary, no new sound.
 */
import { motion } from 'framer-motion';

import RewardBurst from '../shared/RewardBurst';
import { useEnterMotion, useRewardMotion } from '../../lib/motionPresets';

export default function CityMoment({ moment, onDismiss }) {
  const enterMotion = useEnterMotion();
  const rewardMotion = useRewardMotion();
  if (!moment) return null;
  return (
    <motion.div key="city-moment" {...enterMotion} className="pointer-events-none w-full max-w-[320px]">
      <motion.button
        type="button"
        {...rewardMotion}
        onClick={onDismiss}
        aria-label={`${moment.eyebrow}: ${moment.title}. ${moment.line} Chạm để đóng.`}
        className="pointer-events-auto relative w-full overflow-visible px-3.5 py-2.5 text-left"
        style={{
          borderRadius: 'var(--skin-radius-card, 18px)',
          background: 'var(--card-bg-solid)',
          border: '1px solid color-mix(in srgb, var(--accent) 40%, var(--line))',
          boxShadow: 'var(--skin-card-shadow)',
        }}
      >
        <RewardBurst size="building" className="absolute inset-0" />
        <span className="mono relative block text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
          {moment.eyebrow}
        </span>
        <span className="relative mt-0.5 block text-[14px] font-semibold leading-snug" style={{ color: 'var(--ink)' }}>
          {moment.title}
        </span>
        <span className="relative mt-0.5 block text-[12px] leading-snug" style={{ color: 'var(--accent)' }}>
          {moment.line}
        </span>
      </motion.button>
    </motion.div>
  );
}
