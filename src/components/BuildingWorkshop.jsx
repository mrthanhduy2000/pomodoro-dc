/**
 * BuildingWorkshop.jsx — Xưởng Xây Dựng (v2)
 * ─────────────────────────────────────────────────────────────────────────────
 * Gồm 3 phần:
 *   1. Hàng Đợi Xây Dựng (Crafting Queue) — tiến độ mỗi phiên
 *   2. Bản Vẽ Sẵn Sàng Xây — đã nghiên cứu, chưa xây
 *   3. Công Trình Đã Xây — hiển thị type badge + cấp nâng cấp
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import {
  BUILDING_SPECS,
  BUILDING_EFFECTS,
  BLUEPRINT_CATALOG,
  BLUEPRINT_META,
  BLUEPRINT_RARITY_LABEL,
  CRAFT_QUEUE_SLOTS,
  ERA_REFINED,
  ERA_METADATA,
  normalizeRawCost,
  normalizeRefinedBag,
  getUnifiedRefinedCost,
  getUpgradeRefinedCost,
  getBuildingLevelMultiplier,
} from '../engine/constants';

const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

// ─── helpers ──────────────────────────────────────────────────────────────────
const ALL_BLUEPRINTS = Object.values(BLUEPRINT_CATALOG).flat();
function getBpDef(id) {
  return ALL_BLUEPRINTS.find((b) => b.id === id) ?? { id, label: id, icon: '', description: '' };
}

function getBpMark(label, fallback = 'BP') {
  return String(label ?? fallback)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || fallback;
}

const TYPE_STYLE = {
  infrastructure: { label: 'Hạ Tầng',  color: 'text-sky-300',    bg: 'bg-sky-900/40',    border: 'border-sky-700/60'  },
  economy:        { label: 'Kinh Tế',   color: 'text-amber-300',  bg: 'bg-amber-900/40',  border: 'border-amber-700/60'},
  defense:        { label: 'Ổn Định',   color: 'text-rose-300',   bg: 'bg-rose-900/40',   border: 'border-rose-700/60' },
  wonder:         { label: 'Kỳ Quan',   color: 'text-purple-300', bg: 'bg-purple-900/40', border: 'border-purple-700/60'},
};

const RARITY_STYLE = {
  common: { label: BLUEPRINT_RARITY_LABEL.common, color: 'text-slate-200', bg: 'bg-slate-700/60', border: 'border-slate-500/50' },
  rare:   { label: BLUEPRINT_RARITY_LABEL.rare,   color: 'text-cyan-200',  bg: 'bg-cyan-900/30',  border: 'border-cyan-700/50' },
  epic:   { label: BLUEPRINT_RARITY_LABEL.epic,   color: 'text-fuchsia-200', bg: 'bg-fuchsia-900/30', border: 'border-fuchsia-700/50' },
};

function formatPercent(value = 0) {
  return `${Math.round(value * 100)}%`;
}

function paperPanel(lightTheme) {
  if (!lightTheme) return {};
  return {
    background: 'rgba(255, 255, 255, 0.84)',
    border: '1px solid rgba(31, 30, 29, 0.08)',
    boxShadow: '0 12px 26px rgba(31, 30, 29, 0.05)',
  };
}

function TypeBadge({ type, lightTheme = false }) {
  const s = TYPE_STYLE[type] ?? TYPE_STYLE.infrastructure;
  if (lightTheme) {
    const accentMap = {
      infrastructure: '#68796a',
      economy: '#9c7645',
      defense: '#8d5c54',
      wonder: '#7a6877',
    };
    return (
      <span
        className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{
          background: 'rgba(255, 255, 255, 0.74)',
          border: '1px solid rgba(31, 30, 29, 0.08)',
          color: accentMap[type] ?? '#68796a',
        }}
      >
        {s.label}
      </span>
    );
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-semibold ${s.color} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  );
}

function RarityBadge({ rarity, lightTheme = false }) {
  const s = RARITY_STYLE[rarity] ?? RARITY_STYLE.common;
  if (lightTheme) {
    const accentMap = {
      common: '#6a6862',
      rare: '#667487',
      epic: '#7a6877',
    };
    return (
      <span
        className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{
          background: 'rgba(31, 30, 29, 0.04)',
          border: '1px solid rgba(31, 30, 29, 0.08)',
          color: accentMap[rarity] ?? '#6a6862',
        }}
      >
        {s.label}
      </span>
    );
  }
  return (
    <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-semibold ${s.color} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  );
}

function PerkSummary({ perk, lightTheme = false }) {
  if (!perk) return null;
  return (
    <div
      className="mt-1.5 rounded-[14px] px-3 py-2"
      style={lightTheme
        ? { background: 'rgba(31, 30, 29, 0.04)', border: '1px solid rgba(31, 30, 29, 0.08)' }
        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={lightTheme ? { color: '#9a5a48' } : { color: '#f8d6a2' }}>
        {perk.family}
      </p>
      <p className="mt-0.5 text-xs font-semibold" style={lightTheme ? { color: '#1f1e1d' } : { color: '#f8fafc' }}>
        {perk.label}
      </p>
      <p className="mt-0.5 text-xs leading-5" style={lightTheme ? { color: '#6a6862' } : { color: '#cbd5e1' }}>
        {perk.summary}
      </p>
    </div>
  );
}

function ResourceCost({ era, cost, bookResources, lightTheme = false }) {
  const normalizedCost = normalizeRawCost(cost ?? {});
  const rawDefs = ERA_METADATA[era]?.resources ?? [];
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {Object.entries(normalizedCost).map(([res, amount]) => {
        const have = bookResources[res] ?? 0;
        const ok   = have >= amount;
        const def  = rawDefs.find((resource) => resource.id === res);
        return (
          <span
            key={res}
            className="text-xs px-1.5 py-0.5 rounded-full border"
            style={lightTheme
              ? ok
                ? { borderColor: 'rgba(111, 123, 98, 0.18)', color: '#6f7b62', background: 'rgba(111, 123, 98, 0.10)', fontFamily: MONO_FONT }
                : { borderColor: 'rgba(201, 100, 66, 0.16)', color: '#8a3f24', background: 'rgba(248,235,228,0.10)', fontFamily: MONO_FONT }
              : undefined}
          >
            {amount.toLocaleString()} {(def?.label ?? res)}
            {!ok && <span className="opacity-70"> (có {have})</span>}
          </span>
        );
      })}
    </div>
  );
}

// ─── Hàng đợi xây dựng ────────────────────────────────────────────────────────
function QueueSection({ queue, cancelCrafting, lightTheme }) {
  if (queue.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>
          Hàng chờ xây dựng
        </p>
        <span className="text-[11px]" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#64748b', fontFamily: MONO_FONT }}>
          {queue.length}/{CRAFT_QUEUE_SLOTS}
        </span>
      </div>
      {queue.map((item) => {
        const bpDef = getBpDef(item.bpId);
        const meta  = BLUEPRINT_META[item.bpId] ?? {};
        const eff   = BUILDING_EFFECTS[item.bpId] ?? {};
        const total = meta.sessionsToComplete ?? 1;
        const done  = total - item.sessionsRemaining;
        const pct   = Math.round((done / total) * 100);
        return (
          <div
            key={item.bpId}
            className="rounded-[24px] p-4 border"
            style={lightTheme
              ? {
                  background: 'rgba(255, 255, 255, 0.82)',
                  borderColor: 'rgba(201, 100, 66, 0.18)',
                }
              : undefined}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{bpDef.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm truncate" style={lightTheme ? { color: '#1f1e1d' } : { color: '#fcd34d' }}>{bpDef.label}</p>
                  {meta.rarity && <RarityBadge rarity={meta.rarity} lightTheme={lightTheme} />}
                  <TypeBadge type={eff.type} lightTheme={lightTheme} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={lightTheme ? { background: 'rgba(31, 30, 29, 0.08)' } : { background: '#334155' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={lightTheme ? { background: '#c96442' } : undefined}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums flex-shrink-0" style={lightTheme ? { color: '#6a6862' } : { color: '#94a3b8' }}>
                    {done}/{total} phiên
                  </span>
                </div>
              </div>
              <button
                onClick={() => cancelCrafting(item.bpId)}
                className="text-xs px-2.5 py-1 rounded-full transition-colors flex-shrink-0"
                style={lightTheme
                  ? {
                      color: '#8a3f24',
                      background: 'rgba(248,235,228,0.86)',
                      border: '1px solid rgba(201,100,66,0.16)',
                    }
                  : undefined}
                title="Hủy (hoàn 50% nguyên liệu)"
              >
                huỷ
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Card bản vẽ sẵn sàng xây ─────────────────────────────────────────────────
function ReadyCard({ bpId, bookResources, resourcesRefined, craftingQueue, onStart, lightTheme }) {
  const bpDef = getBpDef(bpId);
  const spec  = BUILDING_SPECS[bpId] ?? {};
  const meta  = BLUEPRINT_META[bpId] ?? {};
  const eff   = BUILDING_EFFECTS[bpId] ?? {};

  const inQueue  = (craftingQueue ?? []).some((q) => q.bpId === bpId);
  const refined  = normalizeRefinedBag(resourcesRefined);
  const rawCost  = normalizeRawCost(spec.cost ?? {});
  const refinedCost = getUnifiedRefinedCost(spec.refinedCost);
  const t1Ok     = Object.entries(rawCost).every(([res, amt]) => (bookResources[res] ?? 0) >= amt);
  const refinedOk = refinedCost === 0 || refined.t2 >= refinedCost;
  const canAfford = !inQueue && t1Ok && refinedOk;
  const reason = inQueue ? 'Đang xây...' : !canAfford ? 'Thiếu nguyên liệu' : null;
  const eraRefMeta = ERA_REFINED[meta.era] ?? {};

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] p-4 border"
      style={lightTheme ? paperPanel(lightTheme) : undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <span
          className="mono inline-flex h-9 w-9 items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-[0.14em] flex-shrink-0"
          style={lightTheme
            ? { borderColor: 'rgba(31,30,29,0.08)', background: 'rgba(244,242,236,0.94)', color: '#9a5a48', fontFamily: MONO_FONT }
            : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)', fontFamily: MONO_FONT }}
        >
          {getBpMark(bpDef.label)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-sm" style={lightTheme ? { color: '#1f1e1d' } : { color: '#ffffff' }}>{bpDef.label}</p>
            {meta.rarity && <RarityBadge rarity={meta.rarity} lightTheme={lightTheme} />}
            {eff.type && <TypeBadge type={eff.type} lightTheme={lightTheme} />}
          </div>
          <p className="text-xs" style={lightTheme ? { color: '#6a6862' } : { color: '#94a3b8' }}>{bpDef.description}</p>

          {/* Hiệu ứng */}
          <div className="mt-1.5 space-y-0.5">
            <PerkSummary perk={eff.perk} lightTheme={lightTheme} />
            <p className="text-xs" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>{meta.sessionsToComplete ?? 1} phiên để hoàn thành</p>
          </div>
          {spec.cost && <ResourceCost era={meta.era} cost={spec.cost} bookResources={bookResources} lightTheme={lightTheme} />}
          {refinedCost > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded-full border font-mono ${
                refinedOk ? 'border-violet-700 text-violet-300 bg-violet-900/30'
                          : 'border-red-700 text-red-300 bg-red-900/30'
              }`} style={lightTheme
                ? refinedOk
                  ? { borderColor: 'rgba(166,137,149,0.18)', color: '#7a6877', background: 'rgba(243,236,239,0.82)', fontFamily: MONO_FONT }
                  : { borderColor: 'rgba(201,100,66,0.16)', color: '#8a3f24', background: 'rgba(248,235,228,0.82)', fontFamily: MONO_FONT }
                : { fontFamily: MONO_FONT }}>
                {refinedCost} {eraRefMeta.t2Label ?? 'Tinh luyện'}
                {!refinedOk && <span className="opacity-70"> (có {Math.floor(refined.t2)})</span>}
              </span>
            </div>
          )}
        </div>
        <motion.button
          whileHover={canAfford ? { scale: 1.05 } : {}}
          whileTap={canAfford ? { scale: 0.95 } : {}}
          onClick={() => canAfford && onStart(bpId)}
          disabled={!canAfford}
          title={reason ?? ''}
          className="w-full rounded-[16px] px-3 py-1.5 text-xs font-semibold transition-colors sm:w-auto sm:flex-shrink-0"
          style={lightTheme
              ? inQueue
                ? { background: 'rgba(242,230,209,0.92)', color: '#8b6733', border: '1px solid rgba(176,125,59,0.2)', cursor: 'not-allowed' }
              : canAfford
                ? { background: 'rgba(31,30,29,0.98)', color: '#faf9f6', border: '1px solid rgba(31,30,29,0.12)', boxShadow: '0 12px 24px rgba(31,30,29,0.1)' }
                : { background: 'rgba(244,242,236,0.92)', color: '#9b9892', border: '1px solid rgba(217,214,204,0.9)', cursor: 'not-allowed' }
            : undefined}
        >
          {inQueue ? 'Đang xây' : canAfford ? 'Bắt đầu xây' : 'Chưa đủ'}
        </motion.button>
      </div>
    </motion.div>
  );
}

const LEVEL_LABEL = ['', 'Lv.1', 'Lv.2', 'Lv.3'];
const LEVEL_COLOR = ['', 'text-slate-400', 'text-violet-300', 'text-fuchsia-300'];
const LEVEL_MULT  = [1, 1.0, 1.75, 2.5];

// ─── Card công trình đã xây ────────────────────────────────────────────────────
function BuiltCard({ bpId, level, resourcesRefined, onUpgrade, lightTheme }) {
  const bpDef = getBpDef(bpId);
  const eff   = BUILDING_EFFECTS[bpId] ?? {};
  const era   = eff.era ?? 1;
  const lv    = level ?? 1;
  const refined = normalizeRefinedBag(resourcesRefined);
  const eraRef  = ERA_REFINED[era] ?? {};
  const upgradeCost = getUpgradeRefinedCost(era, lv);
  const canUpgrade = lv < 3 && refined.t2 >= upgradeCost;
  const upgradeCostLabel = `${upgradeCost} ${eraRef.t2Label ?? 'Tinh luyện'}`;

  return (
    <div
      className="rounded-[24px] p-4 flex flex-col gap-3 border sm:flex-row sm:items-center"
      style={lightTheme
        ? {
            background: 'rgba(255, 255, 255, 0.82)',
            borderColor: 'rgba(111, 123, 98, 0.18)',
          }
        : undefined}
    >
      <span
        className="mono inline-flex h-9 w-9 items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-[0.14em] flex-shrink-0"
        style={lightTheme
          ? { borderColor: 'rgba(31,30,29,0.08)', background: 'rgba(244,242,236,0.94)', color: '#9a5a48', fontFamily: MONO_FONT }
          : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)', fontFamily: MONO_FONT }}
      >
        {getBpMark(bpDef.label)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p
            className={lightTheme ? 'text-[1.06rem] font-medium leading-none tracking-[-0.02em]' : 'font-semibold text-sm'}
            style={lightTheme ? { color: '#1f1e1d', fontFamily: DISPLAY_FONT } : { color: '#86efac' }}
          >
            {bpDef.label}
          </p>
          {BLUEPRINT_META[bpId]?.rarity && <RarityBadge rarity={BLUEPRINT_META[bpId].rarity} lightTheme={lightTheme} />}
          {eff.type && <TypeBadge type={eff.type} lightTheme={lightTheme} />}
          <span className={`text-xs font-bold ${LEVEL_COLOR[lv]}`} style={lightTheme ? { color: lv === 1 ? '#6a6862' : lv === 2 ? '#7a6877' : '#9c7645', fontFamily: MONO_FONT } : { fontFamily: MONO_FONT }}>{LEVEL_LABEL[lv]}</span>
          {lv > 1 && (
            <span className="text-xs" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#64748b', fontFamily: MONO_FONT }}>×{LEVEL_MULT[lv]} hiệu ứng</span>
          )}
        </div>
        <PerkSummary perk={eff.perk} lightTheme={lightTheme} />
        {lv > 1 && (
          <p className="mt-1 text-xs" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>
            Cấp công trình vẫn tăng thông số nền phía sau đặc quyền.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        {lv < 3 && onUpgrade && (
          <button
            onClick={() => canUpgrade && onUpgrade(bpId)}
            disabled={!canUpgrade}
            className="w-full rounded-[14px] px-2.5 py-1 text-xs border transition-colors sm:w-auto"
            style={lightTheme
              ? canUpgrade
                ? { background: 'rgba(243,236,239,0.88)', borderColor: 'rgba(166,137,149,0.2)', color: '#7a6877', boxShadow: '0 10px 22px rgba(31,30,29,0.05)' }
                : { background: 'rgba(244,242,236,0.92)', borderColor: 'rgba(217,214,204,0.9)', color: '#9b9892', cursor: 'not-allowed' }
              : undefined}
            title={`Nâng cấp → Lv.${lv + 1} (${upgradeCostLabel})`}
          >
            Nâng cấp · {upgradeCostLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BuildingWorkshop() {
  const blueprints       = useGameStore((s) => s.blueprints);
  const buildings        = useGameStore((s) => s.buildings);
  const resources        = useGameStore((s) => s.resources);
  const research         = useGameStore((s) => s.research ?? { rp: 0, researched: [] });
  const craftingQueue    = useGameStore((s) => s.craftingQueue ?? []);
  const buildingLevels   = useGameStore((s) => s.buildingLevels ?? {});
  const resourcesRefined = useGameStore((s) => s.resourcesRefined ?? {});
  const activeBook       = useGameStore((s) => s.progress.activeBook);
  const uiTheme          = useSettingsStore((s) => s.uiTheme);
  const lightTheme       = uiTheme === 'light';

  const startCrafting    = useGameStore((s) => s.startCrafting);
  const cancelCrafting   = useGameStore((s) => s.cancelCrafting);
  const upgradeBuilding  = useGameStore((s) => s.upgradeBuilding);

  const [toast, setToast] = React.useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const currentEraBuildings = buildings.filter((bpId) => (
    (BLUEPRINT_META[bpId]?.era ?? BUILDING_EFFECTS[bpId]?.era) === activeBook
  ));

  // Bản vẽ có thể xây: đã unlock qua RP, chưa xây
  const unlockedBpIds = new Set([
    ...research.researched,
    ...blueprints.map((b) => b.id),
  ]);
  const readyIds = [...unlockedBpIds].filter(
    (id) => BUILDING_SPECS[id]
      && BLUEPRINT_META[id]?.era === activeBook
      && !currentEraBuildings.includes(id)
  );

  const handleStart = (bpId) => {
    const ok = startCrafting(bpId);
    showToast(ok ? 'Đã đưa công trình vào hàng đợi xây dựng.' : 'Không đủ nguyên liệu hoặc hàng đợi đã đầy.', ok);
  };

  const handleUpgrade = (bpId) => {
    const ok = upgradeBuilding(bpId);
    showToast(ok ? 'Nâng cấp công trình đã hoàn tất.' : 'Không đủ nguyên liệu tinh luyện để nâng cấp.', ok);
  };

  const getBookResources = (bpId) => {
    const bookNum  = BLUEPRINT_META[bpId]?.era ?? activeBook;
    return resources[`book${bookNum}`] ?? {};
  };

  const getEraRefined = (bpId) => {
    const era = BUILDING_EFFECTS[bpId]?.era ?? BLUEPRINT_META[bpId]?.era ?? 1;
    return normalizeRefinedBag(resourcesRefined[era]);
  };

  const builtEntries = currentEraBuildings.map((bpId) => {
    const eff = BUILDING_EFFECTS[bpId] ?? {};
    const level = buildingLevels[bpId] ?? 1;
    const mult = getBuildingLevelMultiplier(level);
    return { bpId, eff, level, mult };
  });

  const totalT1Passive = builtEntries.reduce(
    (sum, { eff, mult }) => sum + (eff.type === 'infrastructure' ? Math.floor((eff.passiveT1PerBreakMin ?? 0) * mult) : 0),
    0,
  );
  const totalT2Passive = builtEntries.reduce(
    (sum, { eff, mult }) => sum + (eff.type === 'infrastructure' ? (eff.passiveT2PerBreakMin ?? 0) * mult : 0),
    0,
  );
  const totalRawSessionBonus = builtEntries.reduce(
    (sum, { eff, mult }) => sum + (eff.type === 'economy' ? (eff.t1DropBonus ?? 0) * mult : 0),
    0,
  );
  const totalRefinedSessionBonus = builtEntries.reduce(
    (sum, { eff, mult }) => sum + (eff.type === 'economy' ? (eff.t2DropBonus ?? 0) * mult : 0),
    0,
  );
  const totalCancelLossReduction = Math.min(
    builtEntries.reduce(
      (sum, { eff, mult }) => sum + (eff.type === 'defense' ? (eff.cancelLossReductionPct ?? 0) * mult : 0),
      0,
    ),
    0.6,
  );
  const activePerkLabels = [...new Set(builtEntries.map(({ eff }) => eff.perk?.label).filter(Boolean))].slice(0, 3);
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          {lightTheme && (
            <p className="mono text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: '#9a5a48' }}>
              Xưởng
            </p>
          )}
          <h2 className={lightTheme ? 'serif text-[1.8rem] leading-none sm:text-[2rem]' : 'text-white font-bold text-[1.1rem] sm:text-lg'} style={lightTheme ? { color: '#1f1e1d' } : undefined}>Xưởng xây dựng</h2>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {activePerkLabels.map((label) => (
            <span
              key={label}
              className="rounded-full px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-xs"
              style={lightTheme
                ? { color: '#9a5a48', background: 'rgba(201, 100, 66, 0.08)', border: '1px solid rgba(201, 100, 66, 0.18)' }
                : undefined}
            >
              {label}
            </span>
          ))}
          {totalT1Passive > 0 && (
            <span
              className="rounded-full px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-xs"
              style={lightTheme
                ? { color: '#5f7386', background: 'rgba(236,241,245,0.9)', border: '1px solid rgba(131,155,176,0.22)' }
                : undefined}
            >
              +{totalT1Passive} thô/phút nghỉ
            </span>
          )}
          {totalT2Passive > 0 && (
            <span
              className="rounded-full px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-xs"
              style={lightTheme
                ? { color: '#7b5c68', background: 'rgba(243,236,239,0.9)', border: '1px solid rgba(166,137,149,0.22)' }
                : undefined}
            >
              +{totalT2Passive.toFixed(2)} tinh luyện/phút nghỉ
            </span>
          )}
          {totalRawSessionBonus > 0 && (
            <span
              className="rounded-full px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-xs"
              style={lightTheme
                ? { color: '#8b6733', background: 'rgba(242,230,209,0.9)', border: '1px solid rgba(176,125,59,0.2)' }
                : undefined}
            >
              +{formatPercent(totalRawSessionBonus)} thô mỗi phiên
            </span>
          )}
          {totalRefinedSessionBonus > 0 && (
            <span
              className="rounded-full px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-xs"
              style={lightTheme
                ? { color: '#8b6733', background: 'rgba(242,230,209,0.9)', border: '1px solid rgba(176,125,59,0.2)' }
                : undefined}
            >
              +{formatPercent(totalRefinedSessionBonus)} tinh luyện mỗi phiên dài
            </span>
          )}
          {totalCancelLossReduction > 0 && (
            <span
              className="rounded-full px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-xs"
              style={lightTheme
                ? { color: '#8a3f24', background: 'rgba(248,235,228,0.9)', border: '1px solid rgba(201,100,66,0.16)' }
                : undefined}
            >
              -{formatPercent(totalCancelLossReduction)} thất thoát khi hủy
            </span>
          )}
          <span className="rounded-full px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-xs" style={lightTheme ? { color: '#9a5a48', background: 'rgba(201, 100, 66, 0.08)', border: '1px solid rgba(201, 100, 66, 0.18)' } : {}}>
            {currentEraBuildings.length} đã xây
          </span>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 rounded-[18px] text-sm font-medium text-center"
            style={lightTheme
              ? toast.ok
                ? { background: 'rgba(255,255,255,0.84)', border: '1px solid rgba(217,214,204,0.96)', color: '#5b7a52', boxShadow: '0 14px 28px rgba(31,30,29,0.05)' }
                : { background: 'rgba(248,235,228,0.84)', border: '1px solid rgba(201,100,66,0.16)', color: '#8a3f24', boxShadow: '0 14px 28px rgba(31,30,29,0.05)' }
              : undefined}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hàng đợi xây dựng */}
      <QueueSection queue={craftingQueue} cancelCrafting={cancelCrafting} lightTheme={lightTheme} />

      {/* Bản vẽ sẵn sàng xây */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>
            Sẵn sàng xây
          </p>
          <span className="text-[11px]" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#64748b', fontFamily: MONO_FONT }}>
            {readyIds.length}
          </span>
        </div>
        {readyIds.length === 0 ? (
          <div
            className={`text-center py-8 rounded-[24px] ${lightTheme ? '' : 'bg-slate-800/30 border border-slate-700/50'}`}
            style={lightTheme ? paperPanel(lightTheme) : undefined}
          >
            <div className="mono mb-2 text-[12px] font-semibold uppercase tracking-[0.22em]" style={lightTheme ? { color: '#9a5a48', fontFamily: MONO_FONT } : { color: 'var(--accent-light)', fontFamily: MONO_FONT }}>BP</div>
            <p className="text-sm" style={lightTheme ? { color: '#1f1e1d' } : { color: '#64748b' }}>Chưa có bản vẽ nào chờ được dựng lên.</p>
            <p className="text-xs mt-1" style={lightTheme ? { color: '#6a6862' } : { color: '#475569' }}>
              Đi sang mục Bản vẽ để mở thêm công trình bằng RP.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {readyIds.map((id) => (
              <ReadyCard
                key={id}
                bpId={id}
                bookResources={getBookResources(id)}
                resourcesRefined={getEraRefined(id)}
                craftingQueue={craftingQueue}
                onStart={handleStart}
                lightTheme={lightTheme}
              />
            ))}
          </div>
        )}
      </div>

      {/* Công trình đã xây */}
      {currentEraBuildings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>
              Đã xây dựng
            </p>
            <span className="text-[11px]" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#64748b', fontFamily: MONO_FONT }}>
              {currentEraBuildings.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {currentEraBuildings.map((id) => (
              <BuiltCard
                key={id}
                bpId={id}
                level={buildingLevels[id] ?? 1}
                resourcesRefined={getEraRefined(id)}
                onUpgrade={handleUpgrade}
                lightTheme={lightTheme}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
