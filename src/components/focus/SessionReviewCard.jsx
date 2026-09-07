/**
 * SessionReviewCard.jsx — extracted from PomodoroEngine.jsx (ADR-077, round 37): the Focus screen keeps only what answers
 * "what session, how long, how long left"; leaf controls live here so the main file can be read.
 */
import { motion } from 'framer-motion';
import { useEnterMotion, useRewardMotion } from '../../lib/motionPresets';
import useSettingsStore from '../../store/settingsStore';

export default function SessionReviewCard({ completedGoalAchieved, goalText, goalBonusXP = 0, goalBonusEP = 0, onPick }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const showGoalBonus = completedGoalAchieved === true && (goalBonusXP > 0 || goalBonusEP > 0);
  const bonusParts = [
    goalBonusXP > 0 ? `+${goalBonusXP} EXP` : null,
    goalBonusEP > 0 ? `+${goalBonusEP} EP` : null,
  ].filter(Boolean);
  const enterMotion = useEnterMotion();
  const rewardMotion = useRewardMotion();
  return (
    <motion.div
      {...enterMotion}
      className={`mx-auto w-full max-w-[520px] rounded-[28px] border p-4 ${
        lightTheme
          ? 'border-[var(--line)] bg-[var(--card-bg-solid)] shadow-[0_22px_56px_rgba(31,30,29,0.08)]'
          : 'border-[var(--line)] bg-[var(--panel-soft)] shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl'
      }`}
    >
      <p className={`mono text-[11px] uppercase tracking-[0.22em] ${lightTheme ? 'text-[var(--muted)]' : 'text-[var(--accent2)]/90'}`}>Đánh giá phiên vừa xong</p>
      <p className={`mt-2 text-sm leading-relaxed ${lightTheme ? 'text-[var(--ink-2)]' : 'text-[var(--ink)]'}`}>
        {goalText
          ? <>Mục tiêu: <span className={`font-semibold text-[var(--ink)]`}>{goalText}</span></>
          : 'Phiên này chưa có mục tiêu ghi sẵn. Bạn vẫn có thể tự đánh giá nhanh.'}
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => onPick(true)}
          className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            completedGoalAchieved === true
              ? lightTheme
                ? 'border-[var(--good)] bg-[rgba(229,236,223,0.96)] text-[var(--good)] shadow-[0_10px_24px_rgba(91,122,82,0.12)]'
                : 'border-[rgba(var(--accent-rgb),0.18)] bg-[var(--panel-soft)] text-[var(--ink)]'
              : lightTheme
                ? 'border-[var(--line)] bg-[rgba(244,242,236,0.82)] text-[var(--muted)] hover:border-[var(--good)] hover:text-[var(--good)]'
                : 'border-[var(--line)] bg-[var(--panel-soft)] text-[var(--ink)] hover:border-[var(--good)] hover:text-[var(--good)]'
          }`}
        >
          Đạt
        </button>
        <button
          type="button"
          onClick={() => onPick(false)}
          className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            completedGoalAchieved === false
              ? lightTheme
                ? 'border-[rgba(var(--accent-rgb),0.22)] bg-[rgba(255,247,237,0.96)] text-[var(--accent2)] shadow-[0_10px_24px_rgba(var(--accent-rgb),0.12)]'
                : 'border-[rgba(var(--accent-rgb),0.18)] bg-[var(--panel-soft)] text-[var(--accent-light)]'
              : lightTheme
                ? 'border-[var(--line)] bg-[rgba(244,242,236,0.82)] text-[var(--muted)] hover:border-[rgba(var(--accent-rgb),0.22)] hover:text-[var(--accent2)]'
                : 'border-[var(--line)] bg-[var(--panel-soft)] text-[var(--ink)] hover:border-[var(--accent2)] hover:bg-[rgba(var(--accent-rgb),0.12)] hover:text-[var(--accent2)]'
          }`}
        >
          Chưa đạt
        </button>
      </div>
      {showGoalBonus && (
        <motion.p
          {...rewardMotion}
          className={`mt-3 text-center text-[13px] font-semibold text-[var(--good)]`}
        >
          🎯 Hoàn thành mục tiêu — thưởng {bonusParts.join(' · ')}
        </motion.p>
      )}
    </motion.div>
  );
}
