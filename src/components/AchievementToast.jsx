/**
 * AchievementToast.jsx — Toast thành tích mới mở khóa
 * ─────────────────────────────────────────────────────────────────────────────
 * Hiện một toast nhỏ ở đầu màn hình, tự động biến mất sau 3.5 giây.
 * Xử lý hàng đợi: hiện từng thành tích một, hết cái này đến cái tiếp theo.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { ACHIEVEMENTS } from '../engine/constants';

const ACH_LOOKUP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

function getAchievementMark(ach) {
  if (!ach?.label) return 'DG';
  return ach.label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AchievementToast() {
  const achievementQueue              = useGameStore((s) => s.ui.achievementQueue);
  const dismissAchievementNotification = useGameStore((s) => s.dismissAchievementNotification);

  const currentId = achievementQueue[0];
  const ach       = currentId ? ACH_LOOKUP[currentId] : null;

  useEffect(() => {
    if (!ach) return;
    const t = setTimeout(() => dismissAchievementNotification(), 3500);
    return () => clearTimeout(t);
  }, [ach?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {ach && (
        <motion.div
          key={ach.id}
          initial={{ opacity: 0, y: -56, x: '-50%' }}
          animate={{ opacity: 1, y: 0,   x: '-50%' }}
          exit={{    opacity: 0, y: -56, x: '-50%' }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed left-1/2 top-16 z-50 flex min-w-[260px] max-w-[360px] cursor-pointer items-center gap-3 rounded-[22px] px-4 py-3 select-none"
          style={{
            background: 'rgba(255,255,255,0.97)',
            border: '1px solid var(--line)',
            boxShadow: '0 18px 34px rgba(31,30,29,0.10)',
          }}
          onClick={() => dismissAchievementNotification()}
        >
          <div
            className="mono flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{
              borderColor: 'rgba(var(--accent-rgb),0.18)',
              background: 'rgba(var(--accent-rgb),0.08)',
              color: 'var(--accent2)',
            }}
          >
            {getAchievementMark(ach)}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
            >
              Thành tích mới
            </p>
            <p
              className="mt-1 text-[22px] font-medium leading-tight text-[var(--ink)]"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              {ach.label}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
