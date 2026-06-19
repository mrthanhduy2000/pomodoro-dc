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
import DailyMissions      from './DailyMissions';
import { SkillGlyph, BranchGlyph, BoltGlyph } from './icons/Glyph';
import {
  SKILL_TREE,
  SKILL_SYNERGIES,
  SIEU_TAP_TRUNG_CHARGES,
  SO_DO_CHARGES,
  EXP_PER_LEVEL,
  SP_PER_LEVEL,
  ACHIEVEMENTS,
  ACHIEVEMENT_TIERS,
} from '../engine/constants';
import { getLevelProgress, getEffectiveSkillCost } from '../engine/gameMath';
import { RELIC_ELITE_RESONANCE } from '../engine/constants';

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

const SKILL_LABELS = Object.fromEntries(
  Object.values(SKILL_TREE).flatMap((branch) => branch.nodes.map((node) => [node.id, node.label]))
);

const BRANCH_KEYS = Object.keys(SKILL_TREE);

// Cộng hưởng Di Vật — bản đồ tra cứu theo elite: nhãn di vật cùng kỷ để gợi ý giảm giá
const RELIC_LABELS_VI = {
  mam_song_bat_diet:  'Mầm Sống Bất Diệt',
  ngon_duoc_khai_sang: 'Ngọn Đuốc Khai Sáng',
  la_chan_phong_kien:  'Lá Chắn Phong Kiến',
  xuc_xac_ky_vong:     'Xúc Xắc Kỳ Vọng',
  la_ban_da_vinci:     'La Bàn Da Vinci',
  loi_tri_tue:         'Lõi Trí Tuệ',
};
const ELITE_RESONANCE_BY_SKILL = Object.fromEntries(
  Object.values(RELIC_ELITE_RESONANCE).map((m) => [m.elite, m]),
);

// Bản đồ tra cứu thành tựu theo id + tông màu bậc dịu mắt (hợp nền giấy ấm)
const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
const ACH_TIER_TINT = {
  bronze: '#b27c50',
  silver: '#a39e96',
  gold: '#c39a58',
  platinum: '#a68995',
  diamond: '#839bb0',
};

function withAlpha(hex, alpha) {
  const m = String(hex || '').replace('#', '');
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Thẻ chuẩn dùng chung — tự đổi theo skin (bo góc, viền, bóng)
const CARD = {
  background: 'var(--card-bg-solid)',
  border: 'var(--skin-card-border-width,1px) solid var(--line)',
  borderRadius: 'var(--skin-radius-card,18px)',
  boxShadow: 'var(--skin-card-shadow)',
};

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

export default function SkillTree({ onOpenAchievements }) {
  const uiTheme            = useSettingsStore((s) => s.uiTheme);
  const sp                 = useGameStore((s) => s.player.sp);
  const totalEXP           = useGameStore((s) => s.player.totalEXP);
  const level              = useGameStore((s) => s.player.level);
  const unlockedSkills     = useGameStore((s) => s.player.unlockedSkills);
  const unlockSkill        = useGameStore((s) => s.unlockSkill);
  const skillActivations   = useGameStore((s) => s.skillActivations);
  const activateSuperFocus = useGameStore((s) => s.activateSuperFocus);
  const activateLuckyMode  = useGameStore((s) => s.activateLuckyMode);
  const relics             = useGameStore((s) => s.relics);
  const relicEvolutions    = useGameStore((s) => s.relicEvolutions);

  const { progressPct, currentLevelEXP, nextLevelEXP } = getLevelProgress(totalEXP);

  const [confirmNode, setConfirmNode] = useState(null);
  const [activeBranch, setActiveBranch] = useState(BRANCH_KEYS[0]);
  const prefersReducedMotion = useReducedMotion();
  const lightTheme = uiTheme === 'light';

  const getNodeState = useCallback((node) => {
    if (unlockedSkills[node.id]) return NODE_STATE.UNLOCKED;
    const prereqsMet = node.requires.every((req) => unlockedSkills[req]);
    if (!prereqsMet) return NODE_STATE.LOCKED;
    const effectiveCost = getEffectiveSkillCost(node.id, node.spCost, relics, relicEvolutions);
    if (sp < effectiveCost) return NODE_STATE.INSUFFICIENT_SP;
    return NODE_STATE.AVAILABLE;
  }, [unlockedSkills, sp, relics, relicEvolutions]);

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

  const selectedBranch = SKILL_TREE[activeBranch];

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4">

      {/* ── Tóm tắt tiến trình: cấp + XP ─────────────────────────────────── */}
      <div className="px-5 py-4" style={CARD}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mono text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted-2)' }}>Tiến trình</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-[1.7rem] font-semibold leading-none" style={{ fontFamily: 'var(--skin-font-display)', color: 'var(--ink)' }}>Cấp {level}</span>
              <span className="mono text-[12px] tabular-nums" style={{ color: 'var(--muted)' }}>{currentLevelEXP.toLocaleString()} / {nextLevelEXP.toLocaleString()} XP</span>
            </div>
          </div>
          <span className="mono text-[11px] uppercase tracking-[0.16em] tabular-nums" style={{ color: 'var(--muted)' }}>{unlockedCount}/{totalNodes} kỹ năng</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--timer-track)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent2))' }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
          {EXP_PER_LEVEL.toLocaleString()} XP/cấp · {SP_PER_LEVEL} SP mỗi cấp
        </p>
      </div>

      {/* ── Bố cục 2 cột: cây kỹ năng (trái) · ngữ cảnh (phải) ──────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">

        {/* TRÁI — Cây kỹ năng */}
        <div className="flex flex-col gap-4">
          <div className="px-5 py-5" style={CARD}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mono text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted-2)' }}>Cây kỹ năng</p>
                <h3 className="mt-1 flex items-center gap-2 text-[1.45rem] font-semibold leading-tight" style={{ fontFamily: 'var(--skin-font-display)', color: 'var(--ink)' }}>
                  <BranchGlyph branch={activeBranch} size={24} />{selectedBranch.label}
                </h3>
                <p className="mt-1 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>{selectedBranch.focus}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 px-3 py-1.5" style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.18)', borderRadius: 'var(--skin-radius-control,14px)' }}>
                <span style={{ color: 'var(--accent2)', display: 'inline-flex' }}><BoltGlyph size={14} /></span>
                <span className="mono text-[15px] font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{sp}</span>
                <span className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--accent2)' }}>SP</span>
              </div>
            </div>

            {/* Chọn nhánh */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {BRANCH_KEYS.map((key) => {
                const b = SKILL_TREE[key];
                const active = key === activeBranch;
                const owned = branchCounts[key] ?? 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveBranch(key)}
                    className="mono inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
                    style={active
                      ? { background: 'var(--ink)', color: 'var(--canvas)' }
                      : { background: 'rgba(var(--accent-rgb),0.06)', color: 'var(--muted)', border: '1px solid var(--line)' }}
                  >
                    <BranchGlyph branch={key} size={14} />
                    <span className="hidden sm:inline">{b.label}</span>
                    <span className="tabular-nums" style={{ opacity: 0.7 }}>{owned}/{b.nodes.length}</span>
                  </button>
                );
              })}
            </div>

            {/* Danh sách nút kỹ năng (nối nhau bằng đường mảnh) */}
            <div className="mt-5">
              {selectedBranch.nodes.map((node, i) => (
                <SkillNode
                  key={node.id}
                  node={node}
                  nodeState={getNodeState(node)}
                  effectiveCost={getEffectiveSkillCost(node.id, node.spCost, relics, relicEvolutions)}
                  isLast={i === selectedBranch.nodes.length - 1}
                  reducedMotion={prefersReducedMotion}
                  onBuy={() => handleBuy(node)}
                />
              ))}
            </div>
          </div>

          {/* Kỹ năng chủ động (chỉ hiện khi đã sở hữu) */}
          {(unlockedSkills.sieu_tap_trung || unlockedSkills.so_do) && (
            <ActiveAbilityBar
              lightTheme={lightTheme}
              unlockedSkills={unlockedSkills}
              skillActivations={skillActivations}
              onActivateSuperFocus={activateSuperFocus}
              onActivateLuckyMode={activateLuckyMode}
            />
          )}
        </div>

        {/* PHẢI — Ngữ cảnh: nhiệm vụ ngày + chuỗi tuần + thành tựu */}
        <div className="flex flex-col gap-4">
          <DailyMissions />
          <RecentAchievements onOpen={onOpenAchievements} />
        </div>
      </div>

      {/* ── Tổ hợp kỹ năng (toàn chiều rộng) ─────────────────────────────── */}
      <SynergyPanel
        lightTheme={lightTheme}
        reducedMotion={prefersReducedMotion}
        synergies={SKILL_SYNERGIES}
        activeSynergies={activeSynergies}
        branchCounts={branchCounts}
      />

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

    const controlRadius = 'var(--skin-radius-control,14px)';

    if (tone === 'active') {
      return {
        background: 'rgba(var(--accent-rgb), 0.12)',
        border: '1px solid rgba(var(--accent-rgb), 0.24)',
        color: 'var(--accent2)',
        borderRadius: controlRadius,
      };
    }

    if (tone === 'disabled') {
      return {
        background: 'rgba(255, 255, 255, 0.74)',
        border: '1px solid var(--line)',
        color: 'var(--muted-2)',
        borderRadius: controlRadius,
      };
    }

    return tone === 'purple'
      ? {
          background: 'rgba(var(--accent-rgb), 0.1)',
          border: '1px solid rgba(var(--accent-rgb), 0.18)',
          color: 'var(--accent2)',
          borderRadius: controlRadius,
        }
      : {
          background: 'rgba(31, 30, 29, 0.04)',
          border: '1px solid var(--line)',
          color: 'var(--ink)',
          borderRadius: controlRadius,
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
          {sfActive  && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--accent2)' } : undefined}>(Đang chờ phiên · {sfUsedCount}/{superFocusCap})</span>}
          {sfUsed && !sfActive && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--muted)' } : undefined}>(Đã dùng {sfUsedCount}/{superFocusCap})</span>}
          {!sfActive && !sfUsed && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--muted)' } : undefined}>(Còn {superFocusCap - sfUsedCount}/{superFocusCap})</span>}
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
          {lmActive  && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--accent2)' } : undefined}>(Đang chờ phiên · {lmUsedCount}/{luckyModeCap})</span>}
          {lmUsed && !lmActive && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--muted)' } : undefined}>(Đã dùng {lmUsedCount}/{luckyModeCap})</span>}
          {!lmActive && !lmUsed && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--muted)' } : undefined}>(Còn {luckyModeCap - lmUsedCount}/{luckyModeCap})</span>}
        </button>
      )}
    </div>
  );
}

// ─── SkillNode (một hàng trong cây, kiểu mockup) ──────────────────────────────

function SkillNode({ node, nodeState, effectiveCost, isLast, reducedMotion, onBuy }) {
  const isUnlocked     = nodeState === NODE_STATE.UNLOCKED;
  const isAvailable    = nodeState === NODE_STATE.AVAILABLE;
  const isLocked       = nodeState === NODE_STATE.LOCKED;
  const isInsufficient = nodeState === NODE_STATE.INSUFFICIENT_SP;

  // Cộng hưởng Di Vật (B): giá hiển thị = effectiveCost; nếu rẻ hơn → có giảm giá
  const cost          = effectiveCost ?? node.spCost;
  const isDiscounted  = cost < node.spCost;
  const resonance     = ELITE_RESONANCE_BY_SKILL[node.id]; // chỉ có ở 6 elite
  const showHint      = !!resonance && !isDiscounted && !isUnlocked;
  const hintRelicLabel = resonance ? RELIC_LABELS_VI[resonance.relicId] : null;

  const circleStyle = isUnlocked
    ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
    : isAvailable
      ? { background: 'rgba(var(--accent-rgb),0.10)', color: 'var(--accent2)', border: '1.5px solid rgba(var(--accent-rgb),0.45)' }
      : { background: 'var(--card-bg-solid2)', color: 'var(--muted-2)', border: '1px solid var(--line)' };

  return (
    <div className="flex gap-3.5">
      {/* Cột trái: vòng tròn + đường nối */}
      <div className="flex flex-col items-center">
        <motion.span
          className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[17px] leading-none"
          style={{ ...circleStyle, opacity: isLocked ? 0.6 : 1 }}
          animate={isAvailable && !reducedMotion
            ? { boxShadow: ['0 0 0 0 rgba(var(--accent-rgb),0)', '0 0 0 4px rgba(var(--accent-rgb),0.12)', '0 0 0 0 rgba(var(--accent-rgb),0)'] }
            : undefined}
          transition={isAvailable && !reducedMotion ? { duration: 2.4, repeat: Infinity } : undefined}
        >
          <SkillGlyph id={node.id} locked={isLocked} size={20} />
        </motion.span>
        {!isLast && (
          <span
            className="mt-1 w-px flex-1"
            style={{ background: isUnlocked ? 'rgba(var(--accent-rgb),0.30)' : 'var(--line)', minHeight: '14px' }}
          />
        )}
      </div>

      {/* Cột phải: tên + mô tả + hành động */}
      <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-5'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold leading-tight" style={{ color: isLocked ? 'var(--muted-2)' : 'var(--ink)' }}>
              {node.label}
            </p>
            <p className="mt-1 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
              {isLocked
                ? (node.requires.length > 0
                    ? `Cần mở: ${node.requires.map((r) => SKILL_LABELS[r] ?? r.replace(/_/g, ' ')).join(', ')}`
                    : 'Cần mở nút trước')
                : node.description}
            </p>
            {showHint && (
              <p className="mt-1 text-[11px] leading-snug" style={{ color: 'var(--accent2)', opacity: 0.85 }}>
                {hintRelicLabel
                  ? `Tiến hóa "${hintRelicLabel}" để giảm nửa giá`
                  : 'Tiến hóa di vật cùng kỷ để giảm nửa giá'}
              </p>
            )}
          </div>

          <div className="shrink-0 pt-0.5">
            {isUnlocked ? (
              <span className="mono inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--good)' }}>
                ✓ Đã mở
              </span>
            ) : isAvailable ? (
              <motion.button
                type="button"
                onClick={onBuy}
                whileHover={reducedMotion ? undefined : { y: -1 }}
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                className="mono inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold tabular-nums transition-colors"
                style={{ background: 'rgba(var(--accent-rgb),0.10)', border: '1px solid rgba(var(--accent-rgb),0.30)', color: 'var(--accent2)' }}
              >
                Mở ·{' '}
                {isDiscounted && (
                  <span className="line-through opacity-60 mr-1" style={{ color: 'var(--muted)' }}>{node.spCost}</span>
                )}
                {cost} SP
              </motion.button>
            ) : (
              <span
                className="mono inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold tabular-nums"
                style={{ background: 'var(--card-bg-solid2)', border: '1px solid var(--line)', color: 'var(--muted-2)', opacity: isInsufficient ? 0.95 : 0.7 }}
              >
                {isDiscounted && (
                  <span className="line-through opacity-60 mr-1">{node.spCost}</span>
                )}
                {cost} SP
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RecentAchievements (thẻ "Thành tựu gần đây" cột phải) ─────────────────────

function RecentAchievements({ onOpen }) {
  const unlocked = useGameStore((s) => s.achievements?.unlocked ?? []);
  const recent = useMemo(
    () => unlocked.slice(-3).reverse().map((id) => ACHIEVEMENT_BY_ID[id]).filter(Boolean),
    [unlocked],
  );
  const total = unlocked.length;
  const more = Math.max(0, total - recent.length);

  return (
    <section className="px-5 py-5" style={CARD}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-2)' }}>Thành tựu gần đây</p>
        <span
          className="mono inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
          style={{ background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent2)' }}
        >
          {total} đã mở
        </span>
      </div>

      {total === 0 ? (
        <p className="text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
          Chưa mở thành tựu nào. Hoàn thành phiên để bắt đầu sưu tầm huy hiệu.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2.5">
          {recent.map((a) => {
            const tint = ACH_TIER_TINT[a.tier] ?? '#c96442';
            const tierLabel = ACHIEVEMENT_TIERS[a.tier]?.label;
            return (
              <button
                key={a.id}
                type="button"
                onClick={onOpen}
                title={tierLabel ? `${a.label} · ${tierLabel}` : a.label}
                className="flex aspect-square items-center justify-center transition-transform hover:-translate-y-0.5"
                style={{ background: withAlpha(tint, 0.12), border: `1px solid ${withAlpha(tint, 0.3)}`, borderRadius: 'var(--skin-radius-control,14px)' }}
              >
                <span className="mono text-[13px] font-semibold tracking-[0.06em]" style={{ color: tint }}>{getLabelMark(a.label, 'TT')}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onOpen}
            title="Xem tất cả thành tựu"
            className="mono flex aspect-square items-center justify-center text-[13px] font-semibold tabular-nums transition-transform hover:-translate-y-0.5"
            style={{ background: 'rgba(var(--accent-rgb),0.08)', border: '1px dashed rgba(var(--accent-rgb),0.30)', color: 'var(--accent2)', borderRadius: 'var(--skin-radius-control,14px)' }}
          >
            {more > 0 ? `+${more}` : 'Xem'}
          </button>
        </div>
      )}
    </section>
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
        className={`w-full max-w-sm p-6 ${lightTheme ? '' : 'bg-white/[0.04] border border-white/8 rounded-2xl shadow-2xl'}`}
        style={lightTheme ? {
          background: 'var(--card-bg-solid)',
          border: 'var(--skin-card-border-width,1px) solid var(--line)',
          borderRadius: 'var(--skin-radius-card,18px)',
          boxShadow: 'var(--skin-card-shadow)',
        } : undefined}
      >
        <div className="text-center mb-4">
          <span className="mono inline-flex h-14 w-14 items-center justify-center rounded-full border text-[12px] font-semibold uppercase tracking-[0.18em]"
                style={lightTheme ? { borderColor: 'var(--line)', background: 'var(--card-bg-solid2)', color: 'var(--accent2)' } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)' }}>
            {getLabelMark(node.label)}
          </span>
          <h3 className="font-bold text-xl mt-2" style={lightTheme ? { fontFamily: 'var(--skin-font-display)', fontWeight: 600, color: 'var(--ink)' } : { color: '#ffffff' }}>{node.label}</h3>
          <span className={`inline-block mt-1.5 ${tierBadgeProps.className}`} style={tierBadgeProps.style}>
            {tierStyle.label}
          </span>
          <p className="text-sm mt-2" style={lightTheme ? { color: 'var(--muted)' } : { color: '#94a3b8' }}>{node.description}</p>
        </div>

        <div
          className={`flex items-center justify-center gap-2 mb-5 py-2.5 ${lightTheme ? '' : 'bg-slate-800 rounded-xl'}`}
          style={lightTheme ? {
            background: 'rgba(var(--accent-rgb), 0.1)',
            border: '1px solid rgba(var(--accent-rgb), 0.16)',
            borderRadius: 'var(--skin-radius-control,14px)',
          } : undefined}
        >
          <span className="mono text-[10px] uppercase tracking-[0.18em]" style={lightTheme ? { color: 'var(--accent2)' } : { color: 'var(--accent-light)' }}>SP</span>
          <span className="mono font-bold tabular-nums" style={lightTheme ? { color: 'var(--ink)' } : undefined}>{node.spCost} SP</span>
          <span className="text-sm" style={lightTheme ? { color: 'var(--muted)' } : undefined}>· còn {sp} SP</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${lightTheme ? '' : 'bg-white/[0.05] hover:bg-white/[0.08] text-[var(--ink)] rounded-xl'}`}
            style={lightTheme ? {
              background: 'var(--card-bg-solid2)',
              color: 'var(--muted)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--skin-radius-control,14px)',
            } : undefined}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 text-sm font-bold transition-colors ${lightTheme ? '' : 'bg-[rgba(var(--accent-rgb),0.9)] hover:bg-[rgba(var(--accent-rgb),0.82)] text-white rounded-xl'}`}
            style={lightTheme ? {
              background: 'var(--accent)',
              color: '#ffffff',
              borderRadius: 'var(--skin-radius-control,14px)',
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
      className={`mb-5 overflow-hidden ${lightTheme ? '' : 'border border-white/8 rounded-2xl'}`}
      style={lightTheme ? {
        background: 'var(--card-bg-solid)',
        border: 'var(--skin-card-border-width,1px) solid var(--line)',
        borderRadius: 'var(--skin-radius-card,18px)',
        boxShadow: 'var(--skin-card-shadow)',
      } : { background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${lightTheme ? '' : 'border-b border-white/8'}`}
        style={lightTheme ? { borderBottom: '1px solid var(--line)' } : undefined}
      >
        <div className="flex items-center gap-2">
          <span className="mono inline-flex h-7 w-7 items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-[0.14em]" style={lightTheme ? { borderColor: 'var(--line)', background: 'rgba(255,255,255,0.74)', color: 'var(--accent2)' } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)' }}>SG</span>
          <span className="font-bold text-sm" style={lightTheme ? { fontFamily: 'var(--skin-font-display)', fontWeight: 600, color: 'var(--ink)' } : { color: 'var(--ink)' }}>Tổ hợp kỹ năng</span>
          <span className="text-xs text-slate-500" style={lightTheme ? { color: 'var(--muted)' } : { color: 'var(--muted)' }}>({activeSynergies.length}/{synergies.length} kích hoạt)</span>
        </div>
        {totalBonus > 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mono flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums"
            style={lightTheme
              ? { background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.16)', color: 'var(--accent2)' }
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
              animate={!reducedMotion && active ? { boxShadow: ['0 0 0px rgba(var(--accent-rgb),0)', '0 0 12px rgba(var(--accent-rgb),0.18)', '0 0 0px rgba(var(--accent-rgb),0)'] } : undefined}
              transition={!reducedMotion && active ? { duration: 2.5, repeat: Infinity } : undefined}
              className="p-3 flex flex-col gap-1.5 relative overflow-hidden"
              style={{
                borderRadius: 'var(--skin-radius-control,14px)',
                background: active
                  ? (lightTheme
                      ? 'rgba(var(--accent-rgb),0.1)'
                      : 'rgba(255,255,255,0.06)')
                  : (lightTheme
                      ? 'var(--card-bg-solid2)'
                      : 'rgba(255,255,255,0.03)'),
                border: active
                  ? (lightTheme ? '1px solid rgba(var(--accent-rgb),0.18)' : '1px solid rgba(var(--accent-rgb),0.20)')
                  : (lightTheme ? '1px solid var(--line)' : '1px solid rgba(255,255,255,0.06)'),
              }}
            >
              {active && (
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: lightTheme
                       ? 'radial-gradient(ellipse at 50% 0%, rgba(var(--accent-rgb),0.08) 0%, transparent 72%)'
                       : 'radial-gradient(ellipse at 50% 0%, rgba(var(--accent-rgb),0.10) 0%, transparent 70%)' }} />
              )}

              <div className="flex items-center gap-2 relative z-10">
                <span className="mono inline-flex h-6 w-6 items-center justify-center rounded-full border text-[7px] font-semibold uppercase tracking-[0.12em]" style={lightTheme ? { borderColor: 'var(--line)', background: 'rgba(255,255,255,0.74)', color: active ? 'var(--accent2)' : 'var(--muted)' } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: active ? 'var(--accent-light)' : '#94a3b8' }}>{getLabelMark(syn.label)}</span>
                <p
                  className={`text-xs font-semibold flex-1 truncate ${lightTheme ? '' : active ? 'text-[var(--accent-light)]' : 'text-slate-300'}`}
                  style={lightTheme ? { color: active ? 'var(--accent2)' : 'var(--ink)' } : undefined}
                >
                  {syn.label}
                </p>
                {active
                  ? <span className="text-[var(--accent-light)] text-xs flex-shrink-0 font-bold">✓</span>
                  : <span className={`mono text-[10px] flex-shrink-0 tabular-nums ${lightTheme ? '' : 'text-slate-600'}`} style={lightTheme ? { color: 'var(--muted-2)' } : undefined}>{metCount}/{totalReq}</span>
                }
              </div>

              <p className={`text-[10px] relative z-10 leading-tight line-clamp-2 ${lightTheme ? '' : 'text-slate-500'}`} style={lightTheme ? { color: 'var(--muted)' } : undefined}>{syn.desc}</p>

              <div className="flex items-center gap-2 relative z-10">
                <span
                  className={`mono text-xs font-bold tabular-nums ${lightTheme ? '' : active ? 'text-[var(--accent-light)]' : 'text-slate-400'}`}
                  style={lightTheme ? { color: active ? 'var(--accent2)' : 'var(--muted)' } : undefined}
                >
                  +{(syn.bonus * 100).toFixed(0)}% XP
                </span>
                {!active && progress > 0 && (
                  <div
                    className="flex-1 h-1 rounded-full overflow-hidden"
                    style={{ background: lightTheme ? 'var(--timer-track)' : 'var(--timer-track, #1e293b)' }}
                  >
                    <div className="h-full rounded-full transition-[width] duration-500"
                         style={{ width: `${progress * 100}%`, background: lightTheme ? 'linear-gradient(90deg, var(--accent), var(--accent2))' : 'var(--accent)' }} />
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
