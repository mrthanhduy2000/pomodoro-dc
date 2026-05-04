/**
 * StakePanel.jsx — Bùng Nổ Năng Lượng (Overclock)
 * ─────────────────────────────────────────────────────────────────────────────
 * Panel nhỏ hiển thị khi timer IDLE và focusMinutes đạt ngưỡng Overclock.
 * Cho phép người chơi kích hoạt Overclock để tăng phần thưởng phiên
 * đổi lại 5% EP hiện tại.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import {
  OVERCLOCK_REWARD_MULTIPLIER,
  OVERCLOCK_BONUS_REDUCED,
  OVERCLOCK_EP_COST_RATE,
  OVERCLOCK_MIN_FULL_SESSION,
} from '../engine/constants';

export default function StakePanel() {
  const staking             = useGameStore((s) => s.staking);
  const totalEP             = useGameStore((s) => s.progress.totalEP);
  const focusMinutes        = useGameStore((s) => s.timerConfig.focusMinutes);
  const activateOverclock   = useGameStore((s) => s.activateOverclock);
  const deactivateOverclock = useGameStore((s) => s.deactivateOverclock);
  const uiTheme             = useSettingsStore((s) => s.uiTheme);
  const lightTheme          = uiTheme === 'light';

  const stakedAmount = Math.floor(totalEP * OVERCLOCK_EP_COST_RATE);

  // When active: use stored multiplier. When idle: show projected bonus based on current session length.
  const effectiveMultiplier = staking.active
    ? (staking.rewardMultiplier ?? OVERCLOCK_REWARD_MULTIPLIER)
    : focusMinutes >= OVERCLOCK_MIN_FULL_SESSION
      ? OVERCLOCK_REWARD_MULTIPLIER
      : OVERCLOCK_BONUS_REDUCED;
  const bonusMultiple = ((effectiveMultiplier - 1) * 100).toFixed(0);

  const isActive = staking.active;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`mt-3 md:mt-4 w-full rounded-2xl border p-4 ${
          lightTheme
            ? isActive
              ? 'bg-[rgba(255,255,255,0.96)] border-[var(--line-2)] shadow-[0_18px_34px_rgba(31,30,29,0.06)]'
              : 'bg-[rgba(255,255,255,0.88)] border-[var(--line)] shadow-[0_14px_30px_rgba(31,30,29,0.05)]'
            : isActive
              ? 'bg-white/[0.06] border-[rgba(var(--accent-rgb),0.18)] shadow-[0_14px_28px_rgba(0,0,0,0.16)]'
              : 'bg-white/[0.04] border-white/8'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <motion.span
              className="mono flex h-9 w-9 items-center justify-center rounded-full border text-[9px] font-semibold uppercase tracking-[0.14em] flex-shrink-0"
              animate={isActive ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
              style={lightTheme
                ? { borderColor: 'rgba(var(--accent-rgb),0.16)', background: 'rgba(var(--accent-rgb),0.08)', color: 'var(--accent2)' }
                : { borderColor: 'rgba(var(--accent-rgb),0.18)', background: 'rgba(var(--accent-rgb),0.10)', color: 'var(--accent-light)' }}
            >
              OC
            </motion.span>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${
                lightTheme
                  ? 'text-[var(--ink)]'
                  : isActive ? 'text-[var(--accent-light)]' : 'text-[var(--ink)]'
              }`}>
                {isActive ? 'Tăng lực đang bật' : 'Tăng lực phiên'}
              </p>
              {isActive ? (
                <p className={`mt-0.5 text-xs ${lightTheme ? 'text-[var(--muted)]' : 'text-[var(--muted)]'}`}>
                  Đặt cược {staking.stakedEP.toLocaleString()} EP · Hoàn thành để nhận lại stake và +{bonusMultiple}%
                </p>
              ) : (
                <div className="mt-0.5 space-y-0.5">
                  <p className={`text-xs ${lightTheme ? 'text-[var(--ink-2)]' : 'text-[var(--ink-2)]'}`}>
                    Thắng: +{bonusMultiple}% phần thưởng toàn phiên
                    {focusMinutes < OVERCLOCK_MIN_FULL_SESSION && (
                      <span className={`ml-1 ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'}`}> (+50% từ {OVERCLOCK_MIN_FULL_SESSION}p)</span>
                    )}
                  </p>
                  <p className={`text-xs ${lightTheme ? 'text-[var(--muted)]' : 'text-[var(--muted)]'}`}>
                    Thua (hủy): mất {(OVERCLOCK_EP_COST_RATE * 100).toFixed(0)}% EP
                    <span className={`ml-1 ${lightTheme ? 'text-[var(--ink-2)]' : ''}`}>({stakedAmount.toLocaleString()} EP)</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Toggle button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isActive ? deactivateOverclock : activateOverclock}
            disabled={!isActive && stakedAmount <= 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-colors ${
              lightTheme
                ? isActive
                  ? 'border border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]'
                  : stakedAmount > 0
                    ? 'bg-[var(--ink)] text-[var(--canvas)] shadow-[0_12px_24px_rgba(31,30,29,0.12)] hover:bg-[var(--ink-2)]'
                    : 'bg-[rgba(217,214,204,0.9)] text-[var(--muted-2)] cursor-not-allowed'
                : isActive
                  ? 'bg-white/[0.05] hover:bg-white/[0.08] text-[var(--ink)] border border-white/10'
                  : stakedAmount > 0
                    ? 'bg-[rgba(var(--accent-rgb),0.9)] hover:bg-[rgba(var(--accent-rgb),0.82)] text-white shadow-[0_12px_24px_rgba(var(--accent-rgb),0.16)]'
                    : 'bg-white/[0.03] text-slate-500 cursor-not-allowed border border-white/8'
            }`}
          >
            {isActive ? 'Tắt' : 'Bật'}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
