import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import { ERA_THRESHOLDS, RANK_SYSTEM, RANK_XP_RATIOS } from '../engine/constants';
import { formatDeadlineRemaining } from '../engine/challengeEngine';

function getEraXPRange(bookNumber) {
  const start = ERA_THRESHOLDS[`ERA_${bookNumber - 1}_END`] ?? 0;
  const end = ERA_THRESHOLDS[`ERA_${bookNumber}_END`] ?? ERA_THRESHOLDS.ERA_15_END;
  return {
    start,
    end,
    gap: Math.max(1, end - start),
  };
}

export default function RankDisplay() {
  const activeBook = useGameStore((s) => s.progress.activeBook);
  const rankSystem = useGameStore((s) => s.rankSystem);
  const rankChallenge = useGameStore((s) => s.rankChallenge);
  const totalEP = useGameStore((s) => s.progress.totalEP);
  const initiateChallenge = useGameStore((s) => s.initiateRankChallenge);
  const eraCrisis = useGameStore((s) => s.eraCrisis);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const reduceMotion = useReducedMotion();

  const lightTheme = uiTheme === 'light';
  const bookKey = `book${activeBook}`;
  const currentIdx = rankSystem[bookKey] ?? 0;
  const ranks = RANK_SYSTEM[activeBook]?.ranks ?? [];
  const currentRank = ranks[currentIdx];
  const nextRank = ranks[currentIdx + 1];

  if (!currentRank) return null;

  const isMaxRank = currentIdx >= ranks.length - 1;
  const { start: eraStart, gap: eraGap } = getEraXPRange(activeBook);
  const xpInEra = Math.max(0, totalEP - eraStart);
  const xpRequired = nextRank ? Math.floor(eraGap * (RANK_XP_RATIOS[currentIdx + 1] ?? 1)) : 0;
  const xpGateMet = xpInEra >= xpRequired;
  const xpGatePct = xpRequired > 0 ? Math.max(0, Math.min(100, (xpInEra / xpRequired) * 100)) : 100;
  const remainingXP = Math.max(0, xpRequired - xpInEra);
  const canChallenge = !isMaxRank && xpGateMet && !rankChallenge?.active && !eraCrisis.active;

  return (
    <section
      className="rounded-[18px] border px-4 py-4"
      style={{
        background: lightTheme ? 'rgba(255, 255, 255, 0.84)' : 'rgba(24, 21, 17, 0.9)',
        borderColor: lightTheme ? 'var(--line)' : 'rgba(148, 163, 184, 0.14)',
        boxShadow: lightTheme ? '0 10px 22px rgba(31, 30, 29, 0.04)' : '0 12px 28px rgba(0, 0, 0, 0.14)',
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Rank
        </div>
        <span className="mono text-[11px] text-[var(--muted)]">
          Bậc {currentIdx + 1}/{ranks.length}
        </span>
      </div>

      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Bậc hiện tại
            </div>
            <div className="serif mt-1 text-[24px] font-medium leading-tight tracking-[-0.02em] text-[var(--ink)]">
              {currentRank.label}
            </div>
            <div className="mt-1 text-[12px] leading-snug text-[var(--muted)]">
              {currentRank.buffLabel}
            </div>
          </div>
          <div className="text-right">
            <div className="mono text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
              {isMaxRank ? 'MAX' : `+${xpInEra.toLocaleString()}`}
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              EP trong kỷ
            </div>
          </div>
        </div>

        <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-[var(--line)]">
          <motion.div
            className="h-full rounded-full"
            initial={reduceMotion ? false : { width: 0 }}
            animate={reduceMotion ? undefined : { width: `${Math.max(0, Math.min(100, (xpInEra / eraGap) * 100))}%` }}
            transition={reduceMotion ? undefined : { duration: 0.45, ease: 'easeOut' }}
            style={{
              width: reduceMotion ? `${Math.max(0, Math.min(100, (xpInEra / eraGap) * 100))}%` : undefined,
              background: 'var(--ink)',
            }}
          />
        </div>
      </div>

      {!isMaxRank && nextRank && (
        <div className="mt-4 space-y-4 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Bậc kế tiếp
                </div>
                <div className="serif mt-1 text-[20px] font-medium leading-tight tracking-[-0.02em]" style={{ color: canChallenge ? 'var(--accent2)' : 'var(--ink)' }}>
                  {nextRank.label}
                </div>
                <div className="mt-1 text-[12px] leading-snug text-[var(--muted)]">
                  {nextRank.buffLabel}
                </div>
              </div>
              <div className="text-right">
                <div className="mono text-[12px] font-semibold" style={{ color: canChallenge ? 'var(--accent)' : 'var(--muted)' }}>
                  {canChallenge ? 'Sẵn sàng' : `${remainingXP.toLocaleString()} XP`}
                </div>
                <div className="text-[11px] text-[var(--muted)]">mốc mở</div>
              </div>
            </div>

            <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-[var(--line)]">
              <motion.div
                className="h-full rounded-full"
                initial={reduceMotion ? false : { width: 0 }}
                animate={reduceMotion ? undefined : { width: `${xpGatePct}%` }}
                transition={reduceMotion ? undefined : { duration: 0.45, ease: 'easeOut' }}
                style={{
                  width: reduceMotion ? `${xpGatePct}%` : undefined,
                  background: 'var(--accent)',
                }}
              />
            </div>

            {nextRank.challengeRequirement && (
              <div className="mt-3 text-[12px] leading-snug text-[var(--muted)]">
                {`Yêu cầu: ${nextRank.challengeRequirement.sessions} phiên ≥${nextRank.challengeRequirement.minMinutes}' trong ${nextRank.challengeRequirement.windowHours}h.`}
              </div>
            )}
          </div>

          {!rankChallenge?.active && (
            <div className="flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
              <div className="min-w-0">
                <div className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                  Thử thách thăng bậc
                </div>
                <div className="mt-1 text-[13px] leading-snug text-[var(--muted)]">
                  {eraCrisis.active
                    ? 'Tạm khóa trong lúc khủng hoảng kỷ nguyên còn hiệu lực.'
                    : canChallenge
                      ? 'Bạn đã đủ điều kiện để bắt đầu.'
                      : `Còn ${remainingXP.toLocaleString()} XP trong kỷ này để mở thử thách.`}
                </div>
              </div>
              {canChallenge ? (
                <button
                  type="button"
                  onClick={() => initiateChallenge(activeBook)}
                  className="whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[12px] font-semibold"
                  style={lightTheme ? {
                    background: 'var(--ink)',
                    color: 'var(--canvas)',
                    border: '1px solid rgba(31, 30, 29, 0.06)',
                    boxShadow: '0 10px 20px rgba(31, 30, 29, 0.12)',
                  } : {
                    background: 'rgba(var(--accent-rgb), 0.9)',
                    color: 'var(--ink)',
                    border: '1px solid rgba(var(--accent-rgb), 0.22)',
                    boxShadow: '0 10px 20px rgba(var(--accent-rgb), 0.18)',
                  }}
                >
                  Bắt đầu
                </button>
              ) : (
                <div className="mono text-[11px] font-medium" style={{ color: eraCrisis.active ? 'var(--accent2)' : 'var(--muted)' }}>
                  {eraCrisis.active ? 'Đang khóa' : 'Chưa đủ'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {rankChallenge?.active && (
        <div className="mt-4 rounded-[12px] border px-3 py-3" style={challengeStyle(lightTheme)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mono text-[10px] uppercase tracking-[0.16em]" style={{ color: lightTheme ? 'var(--accent2)' : 'var(--muted)' }}>
                Đang thách đấu
              </div>
              <div className="mt-1 text-[14px] font-semibold" style={{ color: lightTheme ? 'var(--accent2)' : 'var(--ink)' }}>
                {rankChallenge.targetRankLabel}
              </div>
            </div>
            <div className="mono text-[11px] font-medium" style={{ color: lightTheme ? 'var(--accent2)' : 'var(--muted)' }}>
              {formatDeadlineRemaining(rankChallenge.deadline)}
            </div>
          </div>

          <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-[var(--line)]">
            <motion.div
              className="h-full rounded-full"
              initial={reduceMotion ? false : { width: 0 }}
              animate={reduceMotion ? undefined : { width: `${Math.max(0, Math.min(100, (rankChallenge.sessionsCompleted / Math.max(1, rankChallenge.sessionsRequired)) * 100))}%` }}
              transition={reduceMotion ? undefined : { duration: 0.45, ease: 'easeOut' }}
              style={{
                width: reduceMotion ? `${Math.max(0, Math.min(100, (rankChallenge.sessionsCompleted / Math.max(1, rankChallenge.sessionsRequired)) * 100))}%` : undefined,
                background: 'var(--accent)',
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-[var(--muted)]">
            <span>{`${rankChallenge.sessionsCompleted}/${rankChallenge.sessionsRequired} phiên`}</span>
            <span className="mono">{`≥${rankChallenge.minMinutes}'`}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function challengeStyle(lightTheme) {
  return {
    background: lightTheme ? 'rgba(255, 247, 237, 0.92)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${lightTheme ? 'rgba(201, 100, 66, 0.18)' : 'rgba(148, 163, 184, 0.14)'}`,
  };
}
