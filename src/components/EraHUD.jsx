/**
 * EraHUD.jsx — Era status bar, 48px height, optimized for 13"
 */
import React from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import { ERA_METADATA, ERA_THRESHOLDS } from '../engine/constants';
import { getLevelProgress } from '../engine/gameMath';

function getCurrentStage(eraMeta, totalEP) {
  for (let i = eraMeta.stages.length - 1; i >= 0; i--) {
    if (totalEP >= eraMeta.stages[i].epStart) return eraMeta.stages[i];
  }
  return eraMeta.stages[0];
}

export default function EraHUD() {
  const totalEP       = useGameStore((s) => s.progress.totalEP);
  const activeBook    = useGameStore((s) => s.progress.activeBook);
  const totalEXP      = useGameStore((s) => s.player.totalEXP);
  const level         = useGameStore((s) => s.player.level);
  const sessions      = useGameStore((s) => s.progress.sessionsCompleted);
  const focusMins     = useGameStore((s) => s.progress.totalFocusMinutes);
  const currentStreak = useGameStore((s) => s.streak.currentStreak);
  const prestige      = useGameStore((s) => s.prestige);
  const uiTheme       = useSettingsStore((s) => s.uiTheme);
  const lightTheme    = uiTheme === 'light';

  const eraMeta   = ERA_METADATA[activeBook];
  const stage     = getCurrentStage(eraMeta, totalEP);
  const { progressPct: expPct, currentLevelEXP, nextLevelEXP } = getLevelProgress(totalEXP);

  const eraStart = ERA_THRESHOLDS[`ERA_${activeBook - 1}_END`] ?? 0;
  const eraEnd   = ERA_THRESHOLDS[`ERA_${activeBook}_END`] ?? ERA_THRESHOLDS.ERA_15_END;
  const eraRange = eraEnd - eraStart;
  const xpInEra  = Math.max(0, totalEP - eraStart);
  const eraPct   = eraRange > 0 ? Math.min(100, ((totalEP - eraStart) / eraRange) * 100) : 100;
  const needed    = Math.max(0, eraEnd - totalEP);

  const focusHours = (focusMins / 60).toFixed(1);
  const accent     = lightTheme ? 'var(--accent)' : 'var(--accent-light)';

  return (
    <div
      className="flex-shrink-0 flex items-center px-4 gap-3"
      style={{
        height: '48px',
        background: 'var(--panel-strong, var(--panel))',
        borderBottom: '1px solid var(--line)',
      }}
    >
      {/* Current stage */}
      <div className="flex items-center flex-shrink-0">
        <span className="font-semibold text-sm leading-none whitespace-nowrap" style={{ color: 'var(--ink)' }}>
          {stage.label}
        </span>
      </div>

      {/* XP bar */}
      <div className="flex-1 flex items-center gap-2.5 min-w-0">
        <div className="flex-1 relative h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--timer-track)' }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: accent }}
            animate={{ width: `${eraPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex-shrink-0 flex items-baseline gap-1.5">
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--ink)' }}>
            {xpInEra.toLocaleString()}
          </span>
          {activeBook < 15 && needed > 0 && (
            <span className="text-[10px]" style={{ color: 'var(--muted-2)' }}>
              −{needed.toLocaleString()} → {activeBook + 1}
            </span>
          )}
        </div>
      </div>

      {/* Level ring */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5"
        title={`${currentLevelEXP.toLocaleString()} / ${nextLevelEXP.toLocaleString()} EXP đến cấp tiếp theo`}
      >
        <LevelRing level={level} expPct={expPct} />
        {prestige.count > 0 && (
          <span
            className="mono inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
            style={{
              borderColor: 'rgba(var(--accent-rgb),0.16)',
              background: 'rgba(var(--accent-rgb),0.08)',
              color: 'var(--accent2)',
            }}
          >
            P{prestige.count}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 flex items-center gap-3 border-l pl-3"
           style={{ borderColor: 'var(--line)' }}>
        <MiniStat value={sessions.toLocaleString()} label="phiên" mark="PH" />
        <MiniStat value={focusHours} label="giờ" mark="HR" />
        {currentStreak >= 2 && (
          <MiniStat value={currentStreak} label="chuỗi" mark="CH" highlight />
        )}
      </div>
    </div>
  );
}

const R  = 13;
const C  = 2 * Math.PI * R;
const SZ = (R + 3) * 2;

function LevelRing({ level, expPct }) {
  const offset = C - (expPct / 100) * C;
  return (
    <div className="relative flex items-center justify-center">
      <svg width={SZ} height={SZ} className="-rotate-90">
        <circle cx={SZ/2} cy={SZ/2} r={R} fill="none" style={{ stroke: 'var(--timer-track)' }} strokeWidth={2.5} />
        <motion.circle
          cx={SZ/2} cy={SZ/2} r={R} fill="none"
          stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--ink)' }}>
        {level}
      </span>
    </div>
  );
}

function MiniStat({ mark, value, label, highlight }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="mono inline-flex h-6 w-6 items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-[0.14em]"
        style={{
          borderColor: highlight ? 'rgba(var(--accent-rgb),0.16)' : 'var(--line)',
          background: highlight ? 'rgba(var(--accent-rgb),0.08)' : 'rgba(255,255,255,0.58)',
          color: highlight ? 'var(--accent2)' : 'var(--muted)',
        }}
      >
        {mark}
      </span>
      <div className="leading-tight">
        <div className="text-xs font-bold font-mono leading-none" style={{ color: highlight ? 'var(--accent2)' : 'var(--ink)' }}>
          {value}
        </div>
        <div className="text-[9px] uppercase tracking-wide leading-none" style={{ color: 'var(--muted-2)' }}>{label}</div>
      </div>
    </div>
  );
}
