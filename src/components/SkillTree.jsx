/**
 * SkillTree.jsx — Cây Kỹ Năng (36 kỹ năng · 6 nhánh · 4 bậc)
 * ─────────────────────────────────────────────────────────────────────────────
 * Trạng thái hiển thị mỗi nút:
 *   LOCKED          – chưa đủ điều kiện tiên quyết → mờ, biểu tượng khóa
 *   AVAILABLE       – đủ điều kiện, đủ SP           → viền sáng, nút mua
 *   INSUFFICIENT_SP – đủ điều kiện, thiếu SP        → hiển thị nhưng không mua được
 *   UNLOCKED        – đã mua                        → sáng hoàn toàn, dấu tích
 *
 * 4 bậc độ:
 *   basic (🟩 3 ĐKN) · intermediate (🟦 7 ĐKN) · advanced (🟪 14 ĐKN) · elite (🔴 22 ĐKN)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import useGameStore       from '../store/gameStore';
import useSettingsStore   from '../store/settingsStore';
import soundEngine        from '../engine/soundEngine';
import {
  SKILL_TREE,
  SKILL_SYNERGIES,
  SIEU_TAP_TRUNG_CHARGES,
  SO_DO_CHARGES,
  EXP_PER_LEVEL,
  SP_PER_LEVEL,
} from '../engine/constants';
import { getLevelProgress } from '../engine/gameMath';

const NODE_STATE = {
  LOCKED:          'LOCKED',
  AVAILABLE:       'AVAILABLE',
  INSUFFICIENT_SP: 'INSUFFICIENT_SP',
  UNLOCKED:        'UNLOCKED',
};

const TIER_STYLE = {
  basic: {
    label: 'Cơ Bản',
    bg: 'bg-emerald-900/70',
    text: 'text-emerald-300',
    border: 'border-emerald-700',
    light: { background: 'rgba(201, 100, 66, 0.08)', color: '#8f4d3a', border: 'rgba(201, 100, 66, 0.16)' },
  },
  intermediate: {
    label: 'Trung Cấp',
    bg: 'bg-blue-900/70',
    text: 'text-blue-300',
    border: 'border-blue-700',
    light: { background: 'rgba(143, 122, 138, 0.10)', color: '#6f5c69', border: 'rgba(143, 122, 138, 0.18)' },
  },
  advanced: {
    label: 'Cao Cấp',
    bg: 'bg-purple-900/70',
    text: 'text-purple-300',
    border: 'border-purple-700',
    light: { background: 'rgba(124, 139, 116, 0.10)', color: '#5f6e58', border: 'rgba(124, 139, 116, 0.18)' },
  },
  elite: {
    label: 'Tinh Hoa',
    bg: 'bg-red-900/70',
    text: 'text-red-300',
    border: 'border-red-700',
    light: { background: 'rgba(31, 30, 29, 0.08)', color: '#433630', border: 'rgba(31, 30, 29, 0.14)' },
  },
};

const makeLightBranchPalette = (title, rgb) => ({
  title,
  border: `rgba(${rgb}, 0.42)`,
  divider: `rgba(${rgb}, 0.18)`,
  glow: `rgba(${rgb}, 0.08)`,
  chipBg: `rgba(${rgb}, 0.08)`,
  chipBorder: `rgba(${rgb}, 0.16)`,
  availableBg: `linear-gradient(135deg, rgba(${rgb}, 0.08), rgba(255, 255, 255, 0.92))`,
  unlockedBg: `linear-gradient(135deg, rgba(${rgb}, 0.14), rgba(250, 249, 246, 0.96))`,
  lineActive: `rgba(${rgb}, 0.30)`,
  lineInactive: 'rgba(31, 30, 29, 0.08)',
  shadow: `rgba(${rgb}, 0.08)`,
});

const BRANCH_LIGHT_PALETTES = {
  THIEN_DINH: makeLightBranchPalette('#9a5a48', '201, 100, 66'),
  Y_CHI: makeLightBranchPalette('#8d5c54', '141, 92, 84'),
  NGHI_NGOI: makeLightBranchPalette('#68796a', '104, 121, 106'),
  VAN_MAY: makeLightBranchPalette('#7a6877', '122, 104, 119'),
  CHIEN_LUOC: makeLightBranchPalette('#9c7645', '156, 118, 69'),
  THANG_HOA: makeLightBranchPalette('#667487', '102, 116, 135'),
};

const SKILL_LABELS = Object.fromEntries(
  Object.values(SKILL_TREE).flatMap((branch) => branch.nodes.map((node) => [node.id, node.label]))
);

function getTierBadgeProps(tierStyle, lightTheme) {
  if (!lightTheme) {
    return {
      className: `text-xs px-1.5 py-0.5 rounded-full border font-semibold ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`,
    };
  }

  return {
    className: 'text-xs px-1.5 py-0.5 rounded-full border font-semibold',
    style: {
      background: tierStyle.light.background,
      color: tierStyle.light.color,
      borderColor: tierStyle.light.border,
    },
  };
}

function getLabelMark(label, fallback = 'NA') {
  return String(label ?? fallback)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || fallback;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SkillTree() {
  const uiTheme            = useSettingsStore((s) => s.uiTheme);
  const sp                 = useGameStore((s) => s.player.sp);
  const totalEXP           = useGameStore((s) => s.player.totalEXP);
  const level              = useGameStore((s) => s.player.level);
  const unlockedSkills     = useGameStore((s) => s.player.unlockedSkills);
  const unlockSkill        = useGameStore((s) => s.unlockSkill);
  const skillActivations   = useGameStore((s) => s.skillActivations);
  const activateSuperFocus = useGameStore((s) => s.activateSuperFocus);
  const activateLuckyMode  = useGameStore((s) => s.activateLuckyMode);

  const { progressPct, currentLevelEXP, nextLevelEXP } = getLevelProgress(totalEXP);

  const [confirmNode, setConfirmNode] = useState(null);
  const prefersReducedMotion = useReducedMotion();
  const lightTheme = uiTheme === 'light';

  const getNodeState = useCallback((node) => {
    if (unlockedSkills[node.id]) return NODE_STATE.UNLOCKED;
    const prereqsMet = node.requires.every((req) => unlockedSkills[req]);
    if (!prereqsMet) return NODE_STATE.LOCKED;
    if (sp < node.spCost) return NODE_STATE.INSUFFICIENT_SP;
    return NODE_STATE.AVAILABLE;
  }, [unlockedSkills, sp]);

  const handleBuy = (node) => {
    if (getNodeState(node) !== NODE_STATE.AVAILABLE) return;
    setConfirmNode(node);
  };

  const handleConfirmBuy = () => {
    if (!confirmNode) return;
    const success = unlockSkill(confirmNode.id, confirmNode.spCost, confirmNode.requires);
    if (success) soundEngine.playSkillUnlock();
    setConfirmNode(null);
  };

  // Đếm kỹ năng đã mở khóa
  const totalNodes    = Object.values(SKILL_TREE).reduce((s, b) => s + b.nodes.length, 0);
  const unlockedCount = Object.values(SKILL_TREE).reduce(
    (s, b) => s + b.nodes.filter((n) => unlockedSkills[n.id]).length, 0,
  );

  // Tính synergy đang active
  const { activeSynergies, branchCounts } = useMemo(() => {
    const counts = {};
    for (const [branchKey, branch] of Object.entries(SKILL_TREE)) {
      counts[branchKey] = branch.nodes.filter((n) => !!unlockedSkills[n.id]).length;
    }
    const active = SKILL_SYNERGIES.filter((syn) => {
      // V2: synergy có 2 dạng — requires {branch:N} hoặc requiresBranchCount {branchCount, branchMinSkills}
      if (syn.requiresBranchCount) {
        const { branchCount, branchMinSkills } = syn.requiresBranchCount;
        const qualified = Object.values(counts).filter((c) => c >= branchMinSkills).length;
        return qualified >= branchCount;
      }
      if (syn.requires) {
        return Object.entries(syn.requires).every(([branch, minCount]) => (counts[branch] ?? 0) >= minCount);
      }
      return false;
    });
    return { activeSynergies: active, branchCounts: counts };
  }, [unlockedSkills]);

  return (
    <div className="w-full max-w-5xl mx-auto">

      {/* ── Header: cấp + SP ──────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl p-3.5 sm:p-4 mb-4 sm:mb-5 ${lightTheme ? '' : 'bg-white/[0.04] border border-white/8'}`}
        style={lightTheme ? {
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(250, 249, 246, 0.92))',
          border: '1px solid rgba(31, 30, 29, 0.08)',
          boxShadow: '0 20px 44px rgba(31, 30, 29, 0.06)',
        } : undefined}
      >
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            {lightTheme && (
              <p className="mono text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: '#9a5a48' }}>
                Kỹ năng
              </p>
            )}
            <div className="flex flex-wrap items-baseline gap-2">
              <span className={lightTheme ? 'serif text-[1.85rem] leading-none sm:text-3xl' : 'serif text-[1.85rem] leading-none sm:text-3xl'} style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink)' }}>
                Cấp {level}
              </span>
              <span className="text-sm" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}>
                {currentLevelEXP.toLocaleString()} / {nextLevelEXP.toLocaleString()} XP
              </span>
            </div>
            {lightTheme && (
              <p className="mt-1 max-w-xl text-xs leading-relaxed" style={{ color: '#6a6862' }}>
                Mỗi nhánh nên tạo ra một thay đổi rõ trong cách làm việc.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.16em]" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}>{unlockedCount}/{totalNodes} kỹ năng</span>
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-1.5 ${lightTheme ? '' : 'bg-white/[0.05] border border-white/8'}`}
              style={lightTheme ? {
                background: 'rgba(201, 100, 66, 0.08)',
                border: '1px solid rgba(201, 100, 66, 0.18)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              } : undefined}
            >
              <span className="mono text-[10px] uppercase tracking-[0.18em]" style={lightTheme ? { color: '#9a5a48' } : { color: 'var(--accent-light)' }}>SP</span>
              <span className="font-bold text-xl" style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink)' }}>{sp}</span>
            </div>
          </div>
        </div>
        <div
          className={`w-full rounded-full h-2 overflow-hidden ${lightTheme ? '' : ''}`}
          style={lightTheme ? { background: 'rgba(203, 213, 225, 0.82)' } : { background: 'var(--timer-track)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={lightTheme ? { background: 'linear-gradient(90deg, #c96442, #d98d73)' } : { background: 'var(--accent)' }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-1 text-xs" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}>
          {EXP_PER_LEVEL.toLocaleString()} XP/cấp · {SP_PER_LEVEL} ĐKN mỗi cấp · Tổng 336 ĐKN để mở toàn bộ
        </p>
      </div>

      <BranchFocusStrip lightTheme={lightTheme} />

      {/* ── Kỹ năng chủ động ─────────────────────────────────────────────── */}
      {(unlockedSkills.sieu_tap_trung || unlockedSkills.so_do) && (
        <ActiveAbilityBar
          lightTheme={lightTheme}
          unlockedSkills={unlockedSkills}
          skillActivations={skillActivations}
          onActivateSuperFocus={activateSuperFocus}
          onActivateLuckyMode={activateLuckyMode}
        />
      )}

      {/* ── Bảng Tổ Hợp Synergy ──────────────────────────────────────────── */}
      <SynergyPanel
        lightTheme={lightTheme}
        reducedMotion={prefersReducedMotion}
        synergies={SKILL_SYNERGIES}
        activeSynergies={activeSynergies}
        branchCounts={branchCounts}
      />

      {/* ── Lưới 6 nhánh kỹ năng (3 cột × 2 hàng) ───────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Object.entries(SKILL_TREE).map(([branchKey, branch]) => (
          <SkillBranch
            key={branchKey}
            branch={branch}
            palette={BRANCH_LIGHT_PALETTES[branchKey]}
            lightTheme={lightTheme}
            reducedMotion={prefersReducedMotion}
            getNodeState={getNodeState}
            onBuy={handleBuy}
          />
        ))}
      </div>

      {/* ── Chú thích bậc độ ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 justify-center mt-5 pb-2">
        {Object.entries(TIER_STYLE).map(([, style]) => {
          const badgeProps = getTierBadgeProps(style, lightTheme);
          return (
            <span key={style.label} {...badgeProps} className={`${badgeProps.className} px-3 py-1`}>
              {style.label}
            </span>
          );
        })}
      </div>

      {/* ── Hộp xác nhận mua ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmNode && (
          <PurchaseConfirmDialog
            node={confirmNode}
            sp={sp}
            lightTheme={lightTheme}
            onConfirm={handleConfirmBuy}
            onCancel={() => setConfirmNode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ActiveAbilityBar ─────────────────────────────────────────────────────────

function ActiveAbilityBar({ lightTheme, unlockedSkills, skillActivations, onActivateSuperFocus, onActivateLuckyMode }) {
  const sa      = skillActivations ?? {};
  const sfActive = sa.superFocusActive;
  // V2: nghi_ngoi_hoan_hao đã loại bỏ → chỉ còn base charge
  const superFocusCap = SIEU_TAP_TRUNG_CHARGES;
  const sfUsedCount = sa.superFocusChargesUsed ?? 0;
  const sfUsed   = sfUsedCount >= superFocusCap;
  const lmActive = sa.luckyModeActive;
  const luckyModeCap = SO_DO_CHARGES;
  const lmUsedCount = sa.luckyModeChargesUsed ?? 0;
  const lmUsed   = lmUsedCount >= luckyModeCap;

  const getButtonStyles = (tone) => {
    if (!lightTheme) return null;

    if (tone === 'active') {
      return {
        background: 'rgba(201, 100, 66, 0.12)',
        border: '1px solid rgba(201, 100, 66, 0.24)',
        color: '#9a5a48',
      };
    }

    if (tone === 'disabled') {
      return {
        background: 'rgba(255, 255, 255, 0.74)',
        border: '1px solid rgba(31, 30, 29, 0.08)',
        color: '#9ca3af',
      };
    }

    return tone === 'purple'
      ? {
          background: 'rgba(201, 100, 66, 0.08)',
          border: '1px solid rgba(201, 100, 66, 0.18)',
          color: '#8f4d3a',
        }
      : {
          background: 'rgba(31, 30, 29, 0.04)',
          border: '1px solid rgba(31, 30, 29, 0.10)',
          color: '#433630',
        };
  };

  return (
      <div className="mb-5 flex gap-3 flex-wrap">
      {unlockedSkills.sieu_tap_trung && (
        <button
          onClick={onActivateSuperFocus}
          disabled={sfActive || sfUsed}
          className={`flex w-full justify-between gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-[background-color,border-color,color,opacity] sm:w-auto sm:justify-start ${
            lightTheme
              ? sfActive
                ? 'cursor-default'
                : sfUsed
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
              : sfActive
                ? 'bg-white/[0.06] border-white/10 text-[var(--accent-light)] cursor-default'
                : sfUsed
                  ? 'bg-white/[0.03] border-white/8 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-white/[0.04] border-[rgba(var(--accent-rgb),0.20)] text-[var(--accent-light)] hover:bg-white/[0.06] cursor-pointer'
          }`}
          style={getButtonStyles(sfActive ? 'active' : sfUsed ? 'disabled' : 'purple') ?? undefined}
        >
          <span className="mono text-[10px] font-semibold uppercase tracking-[0.16em]">SF</span>
          <span>Siêu Tập Trung</span>
          {sfActive  && <span className="text-xs ml-1" style={lightTheme ? { color: '#9a5a48' } : undefined}>(Đang chờ phiên · {sfUsedCount}/{superFocusCap})</span>}
          {sfUsed && !sfActive && <span className="text-xs ml-1" style={lightTheme ? { color: '#6a6862' } : undefined}>(Đã dùng {sfUsedCount}/{superFocusCap})</span>}
          {!sfActive && !sfUsed && <span className="text-xs ml-1" style={lightTheme ? { color: '#6a6862' } : undefined}>(Còn {superFocusCap - sfUsedCount}/{superFocusCap})</span>}
        </button>
      )}

      {unlockedSkills.so_do && (
        <button
          onClick={onActivateLuckyMode}
          disabled={lmActive || lmUsed}
          className={`flex w-full justify-between gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-[background-color,border-color,color,opacity] sm:w-auto sm:justify-start ${
            lightTheme
              ? lmActive
                ? 'cursor-default'
                : lmUsed
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
              : lmActive
                ? 'bg-white/[0.06] border-white/10 text-[var(--accent-light)] cursor-default'
                : lmUsed
                  ? 'bg-white/[0.03] border-white/8 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-white/[0.04] border-[rgba(var(--accent-rgb),0.20)] text-[var(--accent-light)] hover:bg-white/[0.06] cursor-pointer'
          }`}
          style={getButtonStyles(lmActive ? 'active' : lmUsed ? 'disabled' : 'amber') ?? undefined}
        >
          <span className="mono text-[10px] font-semibold uppercase tracking-[0.16em]">SD</span>
          <span>Số Đỏ</span>
          {lmActive  && <span className="text-xs ml-1" style={lightTheme ? { color: '#9a5a48' } : undefined}>(Đang chờ phiên · {lmUsedCount}/{luckyModeCap})</span>}
          {lmUsed && !lmActive && <span className="text-xs ml-1" style={lightTheme ? { color: '#6a6862' } : undefined}>(Đã dùng {lmUsedCount}/{luckyModeCap})</span>}
          {!lmActive && !lmUsed && <span className="text-xs ml-1" style={lightTheme ? { color: '#6a6862' } : undefined}>(Còn {luckyModeCap - lmUsedCount}/{luckyModeCap})</span>}
        </button>
      )}
    </div>
  );
}

function BranchFocusStrip({ lightTheme }) {
  return (
    <div
      className={`mb-5 rounded-2xl p-4 ${lightTheme ? '' : 'bg-white/[0.04] border border-white/8'}`}
      style={lightTheme ? {
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(250, 249, 246, 0.90))',
        border: '1px solid rgba(31, 30, 29, 0.08)',
        boxShadow: '0 18px 38px rgba(31, 30, 29, 0.05)',
      } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="mb-3">
        {lightTheme && (
          <p className="mono text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: '#9a5a48' }}>
            Vai trò
          </p>
        )}
        <p className="text-sm font-bold text-white" style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink)' }}>Vai trò từng nhánh</p>
        <p className="text-xs text-slate-500" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}>Đọc nhanh từng nhánh trước khi rót SP.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(SKILL_TREE).map(([branchKey, branch]) => {
          const palette = BRANCH_LIGHT_PALETTES[branchKey];
          return (
            <div
              key={branchKey}
              className={`rounded-2xl px-3.5 py-3 ${lightTheme ? '' : 'bg-white/[0.04] border border-white/8'}`}
              style={lightTheme ? {
                background: 'rgba(255, 255, 255, 0.66)',
                border: `1px solid ${palette.divider}`,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.78)',
              } : undefined}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className="mono inline-flex h-7 w-7 items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-[0.14em]" style={lightTheme ? { borderColor: palette.divider, background: 'rgba(255,255,255,0.78)', color: palette.title } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)' }}>{getLabelMark(branch.label)}</span>
                <span className="text-sm font-semibold text-white" style={lightTheme ? { color: '#0f172a' } : { color: 'var(--ink)' }}>{branch.label}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400" style={lightTheme ? { color: '#475569' } : { color: 'var(--muted)' }}>
                {branch.focus}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SkillBranch ──────────────────────────────────────────────────────────────

function SkillBranch({ branch, palette, lightTheme, reducedMotion, getNodeState, onBuy }) {
  return (
    <div
      className={`rounded-2xl p-3.5 sm:p-4 ${lightTheme ? '' : 'bg-white/[0.04] border border-white/8'}`}
      style={lightTheme ? {
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(250, 249, 246, 0.90))',
        border: `1px solid ${palette.divider}`,
        boxShadow: '0 18px 38px rgba(31, 30, 29, 0.05)',
      } : undefined}
    >
      <div
        className={`flex items-center gap-2 mb-4 pb-3 ${lightTheme ? '' : 'border-b border-white/8'}`}
        style={lightTheme ? { borderBottom: `1px solid ${palette.divider}` } : undefined}
      >
        <span className="mono inline-flex h-8 w-8 items-center justify-center rounded-full border text-[9px] font-semibold uppercase tracking-[0.14em]" style={lightTheme ? { borderColor: palette.divider, background: 'rgba(255,255,255,0.78)', color: palette.title } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)' }}>{getLabelMark(branch.label)}</span>
        <h3 className={`font-bold text-lg ${lightTheme ? '' : ''}`} style={lightTheme ? { color: palette.title } : { color: 'var(--ink)' }}>{branch.label}</h3>
      </div>
      <div className="flex flex-col gap-3">
        {branch.nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            {index > 0 && (
              <div className="flex justify-center">
                <div
                  className={`w-0.5 h-4 ${lightTheme ? '' : getNodeState(node) !== NODE_STATE.LOCKED ? 'bg-slate-500' : 'bg-slate-700'}`}
                  style={lightTheme ? {
                    background: getNodeState(node) !== NODE_STATE.LOCKED ? palette.lineActive : palette.lineInactive,
                  } : undefined}
                />
              </div>
            )}
            <SkillNode
              node={node}
              nodeState={getNodeState(node)}
              lightTheme={lightTheme}
              reducedMotion={reducedMotion}
              palette={palette}
              branchColor={branch.color}
              branchBorderColor={branch.borderColor}
              onBuy={() => onBuy(node)}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── SkillNode ────────────────────────────────────────────────────────────────

function SkillNode({ node, nodeState, lightTheme, reducedMotion, palette, branchColor, branchBorderColor, onBuy }) {
  const isUnlocked     = nodeState === NODE_STATE.UNLOCKED;
  const isAvailable    = nodeState === NODE_STATE.AVAILABLE;
  const isLocked       = nodeState === NODE_STATE.LOCKED;
  const isInsufficient = nodeState === NODE_STATE.INSUFFICIENT_SP;
  const tierStyle      = TIER_STYLE[node.tier] ?? TIER_STYLE.basic;
  const tierBadgeProps = getTierBadgeProps(tierStyle, lightTheme);

  const cardClass = [
    'relative rounded-xl p-3 border cursor-default select-none',
    isUnlocked     ? 'border-white/10 bg-white/[0.06]' : '',
    isAvailable    ? 'border-[rgba(var(--accent-rgb),0.22)] bg-white/[0.05] cursor-pointer hover:bg-white/[0.07]' : '',
    isInsufficient ? 'border-white/8 bg-white/[0.03] opacity-70' : '',
    isLocked       ? 'border-white/8 bg-white/[0.02] opacity-40' : '',
  ].join(' ');

  const lightCardStyle = lightTheme
    ? (isUnlocked
        ? {
            background: palette.unlockedBg,
            borderColor: palette.border,
            boxShadow: `0 12px 24px ${palette.shadow}`,
          }
        : isAvailable
          ? {
              background: palette.availableBg,
              borderColor: palette.border,
              boxShadow: `0 14px 28px ${palette.shadow}`,
            }
          : isInsufficient
        ? {
            background: 'linear-gradient(135deg, rgba(245, 245, 244, 0.94), rgba(255, 255, 255, 0.92))',
                borderColor: 'rgba(31, 30, 29, 0.10)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.68)',
              }
            : {
                background: 'linear-gradient(135deg, rgba(250, 249, 246, 0.94), rgba(255, 255, 255, 0.86))',
                borderColor: 'rgba(31, 30, 29, 0.08)',
              })
    : undefined;

  const nameStyle = lightTheme
    ? {
        color: isUnlocked
          ? palette.title
          : isLocked
            ? '#94a3b8'
            : isInsufficient
              ? '#475569'
              : '#0f172a',
      }
    : undefined;

  const bodyStyle = lightTheme
    ? { color: isLocked ? '#94a3b8' : '#64748b' }
    : undefined;

  const costStyle = lightTheme
    ? (isAvailable
        ? { borderColor: palette.border, color: palette.title, background: palette.chipBg }
        : isInsufficient
          ? { borderColor: 'rgba(31, 30, 29, 0.10)', color: '#6a6862', background: 'rgba(255, 255, 255, 0.88)' }
          : { borderColor: 'rgba(31, 30, 29, 0.08)', color: '#8a8a86', background: 'rgba(250, 249, 246, 0.94)' })
    : undefined;

  return (
    <motion.div
      className={lightTheme
        ? `relative rounded-xl p-3 border select-none transition-[transform,background-color,border-color,box-shadow] ${isAvailable ? 'cursor-pointer' : 'cursor-default'}`
        : cardClass}
      style={lightCardStyle}
      whileHover={isAvailable && !reducedMotion ? { scale: 1.02, y: -2 } : undefined}
      onClick={isAvailable ? onBuy : undefined}
      layout
    >
      {isAvailable && (
        <motion.div
          animate={reducedMotion ? undefined : { opacity: [0.28, 0.52, 0.28] }}
          transition={reducedMotion ? undefined : { duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-xl pointer-events-none ${
            lightTheme ? '' : branchBorderColor.replace('border-', 'bg-').replace('500', '500/10')
          }`}
          style={lightTheme ? { background: palette.glow } : undefined}
        />
      )}

      <div className="relative z-10">
        {/* Hàng trên: icon + tên + badge bậc */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`mono inline-flex h-7 w-7 items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-[0.14em] flex-shrink-0 ${isLocked ? 'opacity-60' : ''}`}
                style={lightTheme
                  ? { borderColor: isUnlocked || isAvailable ? palette.divider : 'rgba(31,30,29,0.08)', background: 'rgba(255,255,255,0.74)', color: isLocked ? '#94a3b8' : palette.title }
                  : { borderColor: isUnlocked || isAvailable ? 'rgba(var(--accent-rgb),0.18)' : 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: isLocked ? '#64748b' : 'var(--accent-light)' }}>
            {isLocked ? 'KH' : getLabelMark(node.label)}
          </span>
          <span
            className={`font-semibold text-sm ${
              lightTheme ? '' : isUnlocked ? 'text-[var(--ink)]' : isLocked ? 'text-slate-600' : 'text-[var(--ink)]'
            }`}
            style={nameStyle}
          >
            {node.label}
          </span>
          <span {...tierBadgeProps}>
            {tierStyle.label}
          </span>
        </div>

        {/* Mô tả */}
        <p
          className={`text-xs leading-relaxed ${lightTheme ? '' : isLocked ? 'text-slate-700' : 'text-slate-400'}`}
          style={bodyStyle}
        >
          {node.description}
        </p>

        {/* Footer: yêu cầu / SP / check */}
        <div className="flex items-center justify-between mt-2">
          <div>
            {isLocked && node.requires.length > 0 && (
              <p className={`text-xs ${lightTheme ? '' : 'text-slate-600'}`} style={lightTheme ? { color: '#94a3b8' } : undefined}>
                Cần: {node.requires.map((r) => SKILL_LABELS[r] ?? r.replace(/_/g, ' ')).join(', ')}
              </p>
            )}
            {isInsufficient && (
              <p className="text-xs text-amber-600">
                Thiếu ĐKN — cần {node.spCost}
              </p>
            )}
          </div>

          {isUnlocked ? (
            <span className={`text-sm font-bold ml-auto ${lightTheme ? '' : branchColor}`} style={lightTheme ? { color: palette.title } : undefined}>✓</span>
          ) : (
            <span className={`text-xs font-bold ml-auto px-2 py-0.5 rounded-full border ${
              isAvailable
                ? 'border-[rgba(var(--accent-rgb),0.18)] text-[var(--accent-light)] bg-white/[0.04]'
                : isInsufficient
                  ? 'border-slate-600 text-slate-500 bg-slate-800'
                  : 'border-slate-700 text-slate-600'
            }`} style={costStyle}>
              {node.spCost} ĐKN
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── PurchaseConfirmDialog ────────────────────────────────────────────────────

function PurchaseConfirmDialog({ node, sp, lightTheme, onConfirm, onCancel }) {
  const tierStyle = TIER_STYLE[node.tier] ?? TIER_STYLE.basic;
  const tierBadgeProps = getTierBadgeProps(tierStyle, lightTheme);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${lightTheme ? '' : 'bg-white/[0.04] border border-white/8'}`}
        style={lightTheme ? {
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid rgba(31, 30, 29, 0.08)',
          boxShadow: '0 26px 60px rgba(31, 30, 29, 0.12)',
        } : undefined}
      >
        <div className="text-center mb-4">
          <span className="mono inline-flex h-14 w-14 items-center justify-center rounded-full border text-[12px] font-semibold uppercase tracking-[0.18em]"
                style={lightTheme ? { borderColor: 'rgba(31,30,29,0.08)', background: 'rgba(244,242,236,0.94)', color: '#9a5a48' } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)' }}>
            {getLabelMark(node.label)}
          </span>
          <h3 className="font-bold text-xl mt-2" style={lightTheme ? { color: '#1f1e1d' } : { color: '#ffffff' }}>{node.label}</h3>
          <span className={`inline-block mt-1.5 ${tierBadgeProps.className}`} style={tierBadgeProps.style}>
            {tierStyle.label}
          </span>
          <p className="text-sm mt-2" style={lightTheme ? { color: '#6a6862' } : { color: '#94a3b8' }}>{node.description}</p>
        </div>

        <div
          className={`flex items-center justify-center gap-2 mb-5 py-2.5 rounded-xl ${lightTheme ? '' : 'bg-slate-800'}`}
          style={lightTheme ? {
            background: 'rgba(201, 100, 66, 0.08)',
            border: '1px solid rgba(201, 100, 66, 0.16)',
          } : undefined}
        >
          <span className="mono text-[10px] uppercase tracking-[0.18em]" style={lightTheme ? { color: '#9a5a48' } : { color: 'var(--accent-light)' }}>SP</span>
          <span className="font-bold" style={lightTheme ? { color: '#1f1e1d' } : undefined}>{node.spCost} ĐKN</span>
          <span className="text-sm" style={lightTheme ? { color: '#6a6862' } : undefined}>· còn {sp} ĐKN</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${lightTheme ? '' : 'bg-white/[0.05] hover:bg-white/[0.08] text-[var(--ink)]'}`}
            style={lightTheme ? {
              background: 'rgba(241, 245, 249, 0.96)',
              color: '#6a6862',
              border: '1px solid rgba(31, 30, 29, 0.08)',
            } : undefined}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${lightTheme ? '' : 'bg-[rgba(var(--accent-rgb),0.9)] hover:bg-[rgba(var(--accent-rgb),0.82)] text-white'}`}
            style={lightTheme ? {
              background: '#c96442',
              color: '#ffffff',
            } : undefined}
          >
            Mở Khóa
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Synergy Panel ────────────────────────────────────────────────────────────
function SynergyPanel({ synergies, activeSynergies, branchCounts, lightTheme, reducedMotion }) {
  const activeIds  = new Set(activeSynergies.map((s) => s.id));
  const totalBonus = activeSynergies.reduce((s, syn) => s + syn.bonus, 0);

  return (
    <div
      className={`mb-5 rounded-2xl overflow-hidden ${lightTheme ? '' : 'border border-white/8'}`}
      style={lightTheme ? {
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(250, 249, 246, 0.90))',
        border: '1px solid rgba(31, 30, 29, 0.08)',
        boxShadow: '0 18px 38px rgba(31, 30, 29, 0.05)',
      } : { background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${lightTheme ? '' : 'border-b border-white/8'}`}
        style={lightTheme ? { borderBottom: '1px solid rgba(31, 30, 29, 0.08)' } : undefined}
      >
        <div className="flex items-center gap-2">
          <span className="mono inline-flex h-7 w-7 items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-[0.14em]" style={lightTheme ? { borderColor: 'rgba(31,30,29,0.08)', background: 'rgba(255,255,255,0.74)', color: '#9a5a48' } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)' }}>SG</span>
          <span className="font-bold text-sm" style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink)' }}>Tổ hợp kỹ năng</span>
          <span className="text-xs text-slate-500" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}>({activeSynergies.length}/{synergies.length} kích hoạt)</span>
        </div>
        {totalBonus > 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
            style={lightTheme
              ? { background: 'rgba(201, 100, 66, 0.08)', border: '1px solid rgba(201, 100, 66, 0.16)', color: '#9a5a48' }
              : { background: 'rgba(var(--accent-rgb),0.12)', border: '1px solid rgba(var(--accent-rgb),0.20)', color: 'var(--accent-light)' }}
          >
            +{(totalBonus * 100).toFixed(0)}% XP tổng
          </motion.div>
        )}
      </div>

      {/* Grid synergies */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
        {synergies.map((syn) => {
          const active   = activeIds.has(syn.id);
          // V2: support 2 dạng synergy
          let metCount, totalReq;
          if (syn.requiresBranchCount) {
            const { branchCount, branchMinSkills } = syn.requiresBranchCount;
            const qualified = Object.values(branchCounts).filter((c) => c >= branchMinSkills).length;
            metCount = Math.min(qualified, branchCount);
            totalReq = branchCount;
          } else if (syn.requires) {
            metCount = Object.entries(syn.requires).filter(([b, n]) => (branchCounts[b] ?? 0) >= n).length;
            totalReq = Object.keys(syn.requires).length;
          } else {
            metCount = 0; totalReq = 1;
          }
          const progress = metCount / Math.max(totalReq, 1);

          return (
            <motion.div
              key={syn.id}
              animate={!reducedMotion && active ? { boxShadow: ['0 0 0px rgba(201,100,66,0)', '0 0 12px rgba(201,100,66,0.18)', '0 0 0px rgba(201,100,66,0)'] } : undefined}
              transition={!reducedMotion && active ? { duration: 2.5, repeat: Infinity } : undefined}
              className="rounded-xl p-3 flex flex-col gap-1.5 relative overflow-hidden"
              style={{
                background: active
                  ? (lightTheme
                      ? 'linear-gradient(135deg, rgba(201,100,66,0.08), rgba(255,255,255,0.96))'
                      : 'rgba(255,255,255,0.06)')
                  : (lightTheme
                      ? 'linear-gradient(135deg, rgba(250,249,246,0.94), rgba(255,255,255,0.92))'
                      : 'rgba(255,255,255,0.03)'),
                border: active
                  ? (lightTheme ? '1px solid rgba(201,100,66,0.18)' : '1px solid rgba(var(--accent-rgb),0.20)')
                  : (lightTheme ? '1px solid rgba(31,30,29,0.08)' : '1px solid rgba(255,255,255,0.06)'),
              }}
            >
              {active && (
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: lightTheme
                       ? 'radial-gradient(ellipse at 50% 0%, rgba(201,100,66,0.08) 0%, transparent 72%)'
                       : 'radial-gradient(ellipse at 50% 0%, rgba(var(--accent-rgb),0.10) 0%, transparent 70%)' }} />
              )}

              <div className="flex items-center gap-2 relative z-10">
                <span className="mono inline-flex h-6 w-6 items-center justify-center rounded-full border text-[7px] font-semibold uppercase tracking-[0.12em]" style={lightTheme ? { borderColor: 'rgba(31,30,29,0.08)', background: 'rgba(255,255,255,0.74)', color: active ? '#9a5a48' : '#6a6862' } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: active ? 'var(--accent-light)' : '#94a3b8' }}>{getLabelMark(syn.label)}</span>
                <p
                  className={`text-xs font-semibold flex-1 truncate ${lightTheme ? '' : active ? 'text-[var(--accent-light)]' : 'text-slate-300'}`}
                  style={lightTheme ? { color: active ? '#9a5a48' : '#433630' } : undefined}
                >
                  {syn.label}
                </p>
                {active
                  ? <span className="text-[var(--accent-light)] text-xs flex-shrink-0 font-bold">✓</span>
                  : <span className={`text-[10px] flex-shrink-0 ${lightTheme ? '' : 'text-slate-600'}`} style={lightTheme ? { color: '#94a3b8' } : undefined}>{metCount}/{totalReq}</span>
                }
              </div>

              <p className={`text-[10px] relative z-10 leading-tight line-clamp-2 ${lightTheme ? '' : 'text-slate-500'}`} style={lightTheme ? { color: '#64748b' } : undefined}>{syn.desc}</p>

              <div className="flex items-center gap-2 relative z-10">
                <span
                  className={`text-xs font-bold ${lightTheme ? '' : active ? 'text-[var(--accent-light)]' : 'text-slate-400'}`}
                  style={lightTheme ? { color: active ? '#9a5a48' : '#6a6862' } : undefined}
                >
                  +{(syn.bonus * 100).toFixed(0)}% XP
                </span>
                {!active && progress > 0 && (
                  <div
                    className="flex-1 h-1 rounded-full overflow-hidden"
                    style={{ background: lightTheme ? 'rgba(203, 213, 225, 0.82)' : 'var(--timer-track, #1e293b)' }}
                  >
                    <div className="h-full rounded-full transition-[width] duration-500"
                         style={{ width: `${progress * 100}%`, background: lightTheme ? 'linear-gradient(90deg, #c96442, #d98d73)' : 'var(--accent)' }} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
