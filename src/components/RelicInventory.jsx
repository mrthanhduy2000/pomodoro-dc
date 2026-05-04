/**
 * RelicInventory.jsx — Kho Di Vật
 */

import React from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import {
  ERA_CRISES,
  ERA_REFINED,
  RELIC_EVOLUTION,
  BUILDING_EFFECTS,
  normalizeRefinedBag,
  getRelicEvolutionRefinedCost,
} from '../engine/constants';

const ALL_RELIC_DEFS = Object.entries(ERA_CRISES)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([, crisis]) => ({
    ...crisis.challengeOption.successRelic,
    crisisName: crisis.name,
    crisisIcon: crisis.icon,
  }));

const STAGE_TOKENS = [
  {
    label: 'Cơ Bản',
    accent: '#9a5a48',
    accentSoft: 'rgba(201, 100, 66, 0.08)',
    accentBorder: 'rgba(201, 100, 66, 0.18)',
    darkCard: 'border-white/8 bg-white/[0.04]',
    darkBadge: 'bg-white/[0.05] border border-white/8 text-[var(--accent-light)]',
  },
  {
    label: 'Tiến Hóa',
    accent: '#7a6877',
    accentSoft: 'rgba(122, 104, 119, 0.10)',
    accentBorder: 'rgba(122, 104, 119, 0.18)',
    darkCard: 'border-white/8 bg-white/[0.04]',
    darkBadge: 'bg-white/[0.05] border border-white/8 text-[var(--accent-light)]',
  },
  {
    label: 'Huyền Thoại',
    accent: '#9c7645',
    accentSoft: 'rgba(156, 118, 69, 0.10)',
    accentBorder: 'rgba(156, 118, 69, 0.20)',
    darkCard: 'border-white/8 bg-white/[0.04]',
    darkBadge: 'bg-white/[0.05] border border-white/8 text-[var(--accent-light)]',
  },
];

function getDisplayedRelicEvolutionCost(buildings = [], nextStageDef) {
  const baseCost = getRelicEvolutionRefinedCost(nextStageDef);
  const hasDiscount = buildings.some(
    (bpId) => BUILDING_EFFECTS[bpId]?.wonderEffect === 'relic_evo_30off',
  );
  if (!hasDiscount) return baseCost;
  return Math.max(1, Math.round(baseCost * 0.7));
}

function paperCardStyle(lightTheme, accentBorder = 'rgba(31, 30, 29, 0.08)', accentShadow = 'rgba(31, 30, 29, 0.05)') {
  if (!lightTheme) return null;
  return {
    background: 'rgba(255, 255, 255, 0.84)',
    border: `1px solid ${accentBorder}`,
    boxShadow: `0 12px 26px ${accentShadow}`,
  };
}

function getRelicMark(label, fallback = 'RL') {
  return String(label ?? fallback)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || fallback;
}

export default function RelicInventory() {
  const relics = useGameStore((s) => s.relics);
  const relicEvolutions = useGameStore((s) => s.relicEvolutions ?? {});
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const collectedIds = new Set(relics.map((r) => r.id));

  return (
    <div className="space-y-5">
      <div>
        {lightTheme && (
          <p className="mono text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: '#9a5a48' }}>
            Di vật
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={lightTheme ? 'serif text-[2rem] leading-none' : 'text-white font-bold text-lg'} style={lightTheme ? { color: '#1f1e1d' } : undefined}>
              Di vật
            </h2>
            <p className="mt-1 text-sm" style={lightTheme ? { color: '#6a6862' } : { color: '#94a3b8' }}>
              {relics.length}/{ALL_RELIC_DEFS.length} — chinh phục Khủng Hoảng Kỷ Nguyên để nhận buff vĩnh viễn.
            </p>
          </div>
          <div
            className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={lightTheme ? {
              background: 'rgba(201, 100, 66, 0.08)',
              border: '1px solid rgba(201, 100, 66, 0.18)',
              color: '#9a5a48',
            } : {
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
            }}
          >
            kho lưu trữ · {relics.length}
          </div>
        </div>
      </div>

      {relics.length === 0 ? (
        <>
          <div
            className={`rounded-[28px] px-6 py-10 text-center ${lightTheme ? '' : 'border border-white/8 bg-white/[0.03]'}`}
            style={paperCardStyle(lightTheme)}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={lightTheme ? {
              background: 'rgba(201, 100, 66, 0.08)',
              border: '1px solid rgba(201, 100, 66, 0.18)',
              color: '#9a5a48',
            } : undefined}>
              <span className="mono text-[12px] font-semibold uppercase tracking-[0.22em]">AR</span>
            </div>
            <p className="text-base font-semibold" style={lightTheme ? { color: '#1f1e1d' } : { color: '#ffffff' }}>
              Chưa có di vật nào
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed" style={lightTheme ? { color: '#6a6862' } : { color: '#94a3b8' }}>
              Chọn chế độ Đương Đầu khi Khủng Hoảng xuất hiện để chinh phục và nhận di vật cho kho lưu trữ này.
            </p>
          </div>

          <LockedRelics collectedIds={collectedIds} lightTheme={lightTheme} />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {relics.map((relic) => (
              <RelicCard
                key={relic.id}
                relic={relic}
                stage={relicEvolutions[relic.id] ?? 0}
                lightTheme={lightTheme}
              />
            ))}
          </div>
          <LockedRelics collectedIds={collectedIds} lightTheme={lightTheme} />
        </>
      )}
    </div>
  );
}

function RelicCard({ relic, stage, lightTheme }) {
  const evolveRelic = useGameStore((s) => s.evolveRelic);
  const resourcesRefined = useGameStore((s) => s.resourcesRefined);
  const buildings = useGameStore((s) => s.buildings);

  const evoDef = RELIC_EVOLUTION[relic.id];
  const maxStage = evoDef ? evoDef.stages.length - 1 : 0;
  const isMaxStage = stage >= maxStage;
  const nextStageDef = evoDef?.stages[stage + 1];
  const era = evoDef?.era ?? 1;
  const refined = normalizeRefinedBag(resourcesRefined?.[era]);
  const refinedDef = ERA_REFINED[era] ?? ERA_REFINED[1];
  const refinedCost = getDisplayedRelicEvolutionCost(buildings, nextStageDef);
  const canEvolve = !isMaxStage && refined.t2 >= refinedCost;
  const currentBuff = evoDef?.stages[stage]?.buff ?? relic.buff;
  const token = STAGE_TOKENS[stage] ?? STAGE_TOKENS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[28px] p-5 ${lightTheme ? '' : `border ${token.darkCard}`}`}
      style={lightTheme ? paperCardStyle(lightTheme, token.accentBorder, 'rgba(31, 30, 29, 0.05)') : undefined}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className="mono flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[22px] text-[12px] font-semibold uppercase tracking-[0.18em]"
            style={lightTheme ? {
              background: token.accentSoft,
              border: `1px solid ${token.accentBorder}`,
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--accent-light)',
            }}
          >
            {getRelicMark(relic.label)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={lightTheme ? 'text-[1.3rem] font-medium leading-none tracking-[-0.02em]' : 'text-base font-semibold'}
                style={lightTheme ? { color: '#1f1e1d', fontFamily: '"Source Serif 4", Georgia, serif' } : { color: 'var(--ink)' }}
              >
                {relic.label}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${lightTheme ? '' : token.darkBadge}`}
                style={lightTheme ? {
                  background: token.accentSoft,
                  border: `1px solid ${token.accentBorder}`,
                  color: token.accent,
                } : undefined}
              >
                {token.label}
              </span>
            </div>

            <p className="mt-1 text-sm leading-relaxed" style={lightTheme ? { color: '#6a6862' } : { color: '#cbd5e1' }}>
              {relic.description}
            </p>

            <BuffTagRow buff={currentBuff} lightTheme={lightTheme} token={token} />
          </div>
        </div>

        <div className="w-full lg:max-w-[18rem]">
          <div className="flex items-center justify-between">
            <p className="mono text-[11px] font-semibold uppercase tracking-[0.22em]" style={lightTheme ? { color: '#9a5a48' } : { color: '#94a3b8' }}>
              Tiến hóa
            </p>
            <span className="text-xs" style={lightTheme ? { color: '#6a6862' } : { color: '#64748b' }}>
              {isMaxStage ? 'Tối đa' : `${token.label} → ${(STAGE_TOKENS[stage + 1] ?? token).label}`}
            </span>
          </div>

          {evoDef && (
            <div className="mt-2 flex items-center gap-2">
              {evoDef.stages.map((_, index) => {
                const done = index < stage;
                const current = index === stage;
                return (
                  <React.Fragment key={index}>
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
                      style={lightTheme ? {
                        background: done ? token.accent : current ? token.accentSoft : 'rgba(255,255,255,0.72)',
                        border: done
                          ? `1px solid ${token.accent}`
                          : current
                            ? `1px solid ${token.accentBorder}`
                            : '1px solid rgba(31, 30, 29, 0.08)',
                        color: done ? '#fffdf9' : current ? token.accent : '#8a8a86',
                      } : undefined}
                    >
                      {done ? '✓' : index + 1}
                    </div>
                    {index < evoDef.stages.length - 1 && (
                      <div
                        className="h-[2px] flex-1 rounded-full"
                        style={lightTheme ? {
                          background: done ? token.accent : 'rgba(31, 30, 29, 0.08)',
                        } : {
                          background: done ? '#f59e0b' : '#334155',
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {!isMaxStage && nextStageDef && (
            <div
              className="mt-4 rounded-2xl px-3 py-3"
              style={lightTheme ? {
                background: 'rgba(250, 249, 246, 0.94)',
                border: '1px solid rgba(31, 30, 29, 0.08)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs" style={lightTheme ? { color: '#6a6862' } : { color: '#94a3b8' }}>
                  Chi phí tiến hóa
                </span>
                <span className="text-xs" style={lightTheme ? { color: refined.t2 >= refinedCost ? token.accent : '#9f4a3e' } : { color: refined.t2 >= refinedCost ? 'var(--accent-light)' : '#f87171' }}>
                  {Math.floor(refined.t2)}/{refinedCost} {refinedDef.t2Label}
                </span>
              </div>
              {refinedCost < getRelicEvolutionRefinedCost(nextStageDef) && (
                <p className="mt-1 text-[11px]" style={lightTheme ? { color: '#6f7b62' } : { color: 'var(--muted)' }}>
                  Đã áp dụng giảm 30% từ kỳ quan hỗ trợ.
                </p>
              )}
              <motion.button
                whileHover={canEvolve ? { scale: 1.02 } : undefined}
                whileTap={canEvolve ? { scale: 0.98 } : undefined}
                onClick={() => canEvolve && evolveRelic(relic.id)}
                disabled={!canEvolve}
                className="mt-3 w-full rounded-2xl py-2.5 text-sm font-semibold transition-colors"
                style={canEvolve ? (
                  lightTheme ? {
                    background: 'rgba(31,30,29,0.98)',
                    color: '#faf9f6',
                    border: '1px solid rgba(31,30,29,0.12)',
                    boxShadow: '0 10px 22px rgba(31, 30, 29, 0.10)',
                  } : {
                    background: 'rgba(255,255,255,0.08)',
                    color: '#ffffff',
                  }
                ) : (
                  lightTheme ? {
                    background: 'rgba(31, 30, 29, 0.06)',
                    color: '#8a8a86',
                    border: '1px solid rgba(31, 30, 29, 0.08)',
                  } : {
                    background: 'rgba(255,255,255,0.03)',
                    color: '#64748b',
                  }
                )}
              >
                {canEvolve ? 'Tiến hóa di vật' : 'Chưa đủ tài nguyên'}
              </motion.button>
            </div>
          )}

          {isMaxStage && (
            <div
              className="mt-4 rounded-2xl px-3 py-3 text-sm font-semibold"
              style={lightTheme ? {
                background: token.accentSoft,
                border: `1px solid ${token.accentBorder}`,
                color: token.accent,
              } : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--accent-light)',
              }}
            >
              Đã đạt giai đoạn huyền thoại.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function BuffTagRow({ buff, lightTheme, token }) {
  if (!buff) return null;

  const parts = [];
  if (buff.allBonus) parts.push(`+${(buff.allBonus * 100).toFixed(0)}% tất cả`);
  if (buff.epBonus) parts.push(`+${(buff.epBonus * 100).toFixed(0)}% EP`);
  if (buff.expBonus) parts.push(`+${(buff.expBonus * 100).toFixed(0)}% XP`);
  if (buff.resourceBonus) parts.push(`+${(buff.resourceBonus * 100).toFixed(0)}% tài nguyên`);
  if (buff.gachaBonus) parts.push(`+${buff.gachaBonus}% RP`);
  if (buff.pitySeal) parts.push(`+${buff.pitySeal * 2}% RP`);
  if (buff.disasterReduction) parts.push(`-${(buff.disasterReduction * 100).toFixed(0)}% thất thoát`);
  if (buff.comboWindowHours) parts.push(`+${buff.comboWindowHours}h combo`);
  if (buff.xpSeal) parts.push(`+${(buff.xpSeal * 100).toFixed(0)}% XP ★★★`);

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {parts.map((part) => (
        <span
          key={part}
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={lightTheme ? {
            background: token.accentSoft,
            border: `1px solid ${token.accentBorder}`,
            color: token.accent,
          } : {
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--ink)',
          }}
        >
          {part}
        </span>
      ))}
    </div>
  );
}

function LockedRelics({ collectedIds, lightTheme }) {
  const locked = ALL_RELIC_DEFS.filter((relic) => !collectedIds.has(relic.id));
  if (!locked.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <p className="mono text-[11px] font-semibold uppercase tracking-[0.26em]" style={lightTheme ? { color: '#9a5a48' } : { color: '#64748b' }}>
          Những gì còn ẩn
        </p>
        <p className="mt-1 text-sm font-semibold" style={lightTheme ? { color: '#1f1e1d' } : { color: '#e2e8f0' }}>
          Chưa thu thập
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {locked.map((relic) => (
          <div
            key={relic.id}
            className={`rounded-2xl px-4 py-4 ${lightTheme ? '' : 'border border-white/8 bg-white/[0.03]'}`}
            style={lightTheme ? {
              background: 'rgba(255, 255, 255, 0.74)',
              border: '1px solid rgba(31, 30, 29, 0.08)',
            } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={lightTheme ? {
                  background: 'rgba(31, 30, 29, 0.04)',
                  border: '1px solid rgba(31, 30, 29, 0.06)',
                  opacity: 0.55,
                } : { opacity: 0.25 }}
              >
                <span className="mono text-[10px] font-semibold uppercase tracking-[0.16em]">Ẩn</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={lightTheme ? { color: '#6a6862' } : { color: '#94a3b8' }}>
                  ??? (từ {relic.crisisName})
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>
                  Chinh phục {relic.crisisName} ở chế độ Đương Đầu để mở khóa.
                </p>
              </div>
              <span className="mono text-[10px] font-semibold uppercase tracking-[0.16em]" style={lightTheme ? { color: '#9a5a48' } : { color: '#475569' }}>Khoá</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
