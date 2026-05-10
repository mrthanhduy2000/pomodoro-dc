/**
 * BlueprintInventory.jsx — Kho Bản Vẽ & Nghiên Cứu (v2)
 * ─────────────────────────────────────────────────────────────────────────────
 * 2 tab:
 *   1. Bản Vẽ Của Tôi — những gì đã nghiên cứu / đã sở hữu
 *   2. Nghiên Cứu    — tech tree bản vẽ kỷ hiện tại, tiến độ RP
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import {
  BLUEPRINT_CATALOG,
  BLUEPRINT_META,
  BLUEPRINT_RARITY_LABEL,
  BUILDING_EFFECTS,
  WONDER_EFFECT_REGISTRY,
  BUILDING_SPECS,
  ERA_METADATA,
  ERA_REFINED,
  RP_CATEGORY_MULT,
  RP_PER_MINUTE_BASE,
  normalizeRawCost,
  getUnifiedRefinedCost,
  getUpgradeRefinedCost,
  getBuildingLevelMultiplier,
} from '../engine/constants';

const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATALOG_FLAT = {};
for (const [era, items] of Object.entries(BLUEPRINT_CATALOG)) {
  for (const item of items) {
    CATALOG_FLAT[item.id] = { ...item, era: Number(era) };
  }
}

const TYPE_STYLE = {
  infrastructure: { label: 'Hạ Tầng',  color: 'text-sky-300',    bg: 'bg-sky-900/30',    border: 'border-sky-700/50' },
  economy:        { label: 'Kinh Tế',   color: 'text-amber-300',  bg: 'bg-amber-900/30',  border: 'border-amber-700/50' },
  defense:        { label: 'Ổn Định',   color: 'text-rose-300',   bg: 'bg-rose-900/30',   border: 'border-rose-700/50' },
  wonder:         { label: 'Kỳ Quan',   color: 'text-purple-300', bg: 'bg-purple-900/30', border: 'border-purple-700/50' },
};

const RARITY_STYLE = {
  common: { label: BLUEPRINT_RARITY_LABEL.common, color: 'text-slate-200', bg: 'bg-slate-700/60', border: 'border-slate-500/50' },
  rare:   { label: BLUEPRINT_RARITY_LABEL.rare,   color: 'text-cyan-200',  bg: 'bg-cyan-900/30',  border: 'border-cyan-700/50' },
  epic:   { label: BLUEPRINT_RARITY_LABEL.epic,   color: 'text-fuchsia-200', bg: 'bg-fuchsia-900/30', border: 'border-fuchsia-700/50' },
};

const RESEARCH_TRACK = {
  common: 'Mở sớm',
  rare: 'Đầu tư chính',
  epic: 'Mục tiêu lớn',
};

function formatPercent(value = 0) {
  return `${Math.round(value * 100)}%`;
}

function getActiveWonderEffects(buildings = []) {
  return new Set(
    buildings
      .map((bpId) => BUILDING_EFFECTS[bpId]?.wonderEffect)
      .filter(Boolean),
  );
}

function getDisplayedResearchCost(buildings, bpId) {
  const baseCost = BLUEPRINT_META[bpId]?.rpCost ?? 0;
  const meta = BLUEPRINT_META[bpId];
  const wonderEffects = getActiveWonderEffects(buildings);
  if (meta && wonderEffects.has('t2_research_25off') && meta.era >= 6 && meta.era <= 10) {
    return Math.max(1, Math.round(baseCost * 0.75));
  }
  return baseCost;
}

function paperPanel(lightTheme) {
  if (!lightTheme) return {};
  return {
    background: 'rgba(255, 255, 255, 0.84)',
    border: '1px solid rgba(31, 30, 29, 0.08)',
    boxShadow: '0 12px 26px rgba(31, 30, 29, 0.05)',
  };
}

function getBlueprintMark(def) {
  const label = def?.label ?? def?.id ?? 'BP';
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
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
    const accent = accentMap[type] ?? '#68796a';
    return (
      <span
        className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          border: '1px solid rgba(31, 30, 29, 0.08)',
          color: accent,
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

// ─── RP progress bar ─────────────────────────────────────────────────────────
function RPBar({ currentRP, cost, lightTheme = false }) {
  const pct = Math.min(100, Math.round((currentRP / cost) * 100));
  const ok  = currentRP >= cost;
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={lightTheme ? { background: 'rgba(31, 30, 29, 0.08)' } : { background: '#334155' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: lightTheme ? (ok ? '#6f7b62' : '#c96442') : undefined,
          }}
        />
      </div>
      <span
        className="text-xs tabular-nums"
        style={lightTheme ? { color: ok ? '#6f7b62' : '#9a5a48' } : undefined}
      >
        {currentRP.toLocaleString()}/{cost.toLocaleString()} RP
      </span>
    </div>
  );
}

// ─── Tab 1: Bản Vẽ Của Tôi ────────────────────────────────────────────────────
function MyBlueprintsTab({ blueprints, research, buildings, onSelectBp, lightTheme }) {
  const [filterEra, setFilterEra] = useState(0);

  const unlockedIds = new Set([
    ...(research?.researched ?? []),
    ...blueprints.map((b) => b.id),
  ]);

  const eraOptions = [...new Set([...unlockedIds].map((id) => CATALOG_FLAT[id]?.era).filter(Boolean))].sort();

  const displayed = [...unlockedIds].filter((id) => {
    const def = CATALOG_FLAT[id];
    return def && (filterEra === 0 || def.era === filterEra);
  });

  if (unlockedIds.size === 0) {
    return (
      <div
        className={`text-center py-12 rounded-[24px] ${lightTheme ? '' : 'bg-slate-800/30 border border-slate-700/50'}`}
        style={lightTheme ? paperPanel(lightTheme) : undefined}
      >
        <div className="mono mb-3 text-[12px] font-semibold uppercase tracking-[0.22em]" style={lightTheme ? { color: '#9a5a48', fontFamily: MONO_FONT } : { color: '#cbd5e1', fontFamily: MONO_FONT }}>BP</div>
        <p className="font-medium" style={lightTheme ? { color: '#1f1e1d' } : { color: '#cbd5e1' }}>Chưa có bản vẽ nào</p>
        <p className="text-sm mt-1" style={lightTheme ? { color: '#6a6862' } : { color: '#64748b' }}>
          Tập trung mỗi ngày để kiếm RP và nghiên cứu bản vẽ.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Era filter */}
      {eraOptions.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterEra(0)}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={filterEra === 0
              ? (lightTheme
                  ? { background: 'rgba(201, 100, 66, 0.10)', borderColor: 'rgba(201, 100, 66, 0.22)', color: '#9a5a48' }
                  : { background: '#4f46e5', borderColor: '#6366f1', color: '#ffffff' })
              : (lightTheme
                  ? { borderColor: 'rgba(31, 30, 29, 0.08)', color: '#6a6862', background: 'rgba(255,255,255,0.74)' }
                  : { borderColor: '#475569', color: '#94a3b8' })}
          >
            Tất cả ({unlockedIds.size})
          </button>
          {eraOptions.map((era) => (
            <button
              key={era}
              onClick={() => setFilterEra(era)}
              className="text-xs px-3 py-1 rounded-full border transition-colors"
              style={filterEra === era
                ? (lightTheme
                    ? { background: 'rgba(201, 100, 66, 0.10)', borderColor: 'rgba(201, 100, 66, 0.22)', color: '#9a5a48' }
                    : { background: '#4f46e5', borderColor: '#6366f1', color: '#ffffff' })
                : (lightTheme
                    ? { borderColor: 'rgba(31, 30, 29, 0.08)', color: '#6a6862', background: 'rgba(255,255,255,0.74)' }
                    : { borderColor: '#475569', color: '#94a3b8' })}
            >
              Kỷ {era}
            </button>
          ))}
        </div>
      )}

      {/* Blueprint grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayed.map((id) => {
          const def   = CATALOG_FLAT[id];
          const eff   = BUILDING_EFFECTS[id];
          const built = buildings.includes(id);

          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => onSelectBp?.(id)}
              className="rounded-[24px] p-4 border cursor-pointer transition-colors"
              style={lightTheme
                ? {
                    background: 'rgba(255, 255, 255, 0.82)',
                    borderColor: built ? 'rgba(111, 123, 98, 0.22)' : 'rgba(31, 30, 29, 0.08)',
                    boxShadow: '0 10px 24px rgba(31, 30, 29, 0.05)',
                  }
                : undefined}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mono flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] border text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={lightTheme
                    ? { borderColor: 'rgba(31, 30, 29, 0.08)', background: 'rgba(244,242,236,0.94)', color: '#9a5a48', fontFamily: MONO_FONT }
                    : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', fontFamily: MONO_FONT }}
                >
                  {getBlueprintMark(def)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm" style={lightTheme ? { color: '#1f1e1d' } : { color: '#ffffff' }}>{def?.label ?? id}</p>
                    {def?.rarity && <RarityBadge rarity={def.rarity} lightTheme={lightTheme} />}
                    {eff?.type && <TypeBadge type={eff.type} lightTheme={lightTheme} />}
                    {built && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={lightTheme
                          ? { color: '#6f7b62', background: 'rgba(111, 123, 98, 0.10)', border: '1px solid rgba(111, 123, 98, 0.18)' }
                          : undefined}
                      >
                        ✓ Đã xây
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 line-clamp-2" style={lightTheme ? { color: '#6a6862' } : { color: '#94a3b8' }}>{def?.description}</p>
                  <PerkSummary perk={eff?.perk} lightTheme={lightTheme} />
                  {def?.rarity && (
                    <p className="text-xs mt-0.5" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>{RESEARCH_TRACK[def.rarity] ?? 'Đầu tư'}</p>
                  )}
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-xs" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>
                <div className="flex items-center gap-2">
                  <span>Kỷ {def?.era}</span>
                  {eff?.sessionsToComplete && <span>· {eff.sessionsToComplete} phiên xây</span>}
                </div>
                <span className="italic" style={lightTheme ? { color: '#9a5a48' } : undefined}>Nhấn để xem chi tiết →</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 2: Nghiên Cứu ────────────────────────────────────────────────────────
function ResearchTab({ research, blueprints, buildings, activeBook, researchBlueprint, onSelectBp }) {
  const [selectedEra, setSelectedEra] = useState(activeBook);
  const [toast, setToast] = useState(null);
  const uiTheme = useSettingsStore((s) => s.uiTheme);

  const currentRP    = research?.rp ?? 0;
  const researched   = new Set(research?.researched ?? []);
  const alreadyOwned = new Set(blueprints.map((b) => b.id));
  const lightTheme   = uiTheme === 'light';
  const rpTips = [
    `+${RP_PER_MINUTE_BASE} RP / phút tập trung`,
    `x${RP_CATEGORY_MULT} cho danh mục đầu tiên trong ngày`,
    'Kỳ Quan có thể tăng RP hoặc giảm chi phí',
    'Kỹ năng có thể tăng RP thêm trong phiên',
    'Sự kiện có thể làm RP tăng hoặc giảm',
  ];

  const maxEra = activeBook;
  const eraList = Array.from({ length: maxEra }, (_, i) => i + 1);

  const eraBps = (BLUEPRINT_CATALOG[selectedEra] ?? []).map((def) => ({
    ...def,
    meta: BLUEPRINT_META[def.id],
    eff:  BUILDING_EFFECTS[def.id],
  }));

  const showToast = (msg, ok) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleResearch = (bpId, cost) => {
    if (currentRP < cost) { showToast('Không đủ RP để nghiên cứu bản vẽ này.', false); return; }
    const ok = researchBlueprint(bpId);
    showToast(ok ? 'Nghiên cứu đã được ghi nhận.' : 'Không thể nghiên cứu bản vẽ này lúc này.', ok);
  };

  return (
    <div className="space-y-4">
      {/* RP balance */}
      <div
        className={`flex flex-col gap-3 rounded-[22px] border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
          lightTheme
            ? 'shadow-[0_16px_36px_rgba(31,30,29,0.05)]'
            : 'border-white/8 bg-white/[0.04]'
        }`}
        style={lightTheme ? {
          background: 'rgba(255, 255, 255, 0.84)',
          borderColor: 'rgba(31, 30, 29, 0.08)',
        } : undefined}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border text-xl ${
              lightTheme
                ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]'
                : 'border-white/8 bg-white/[0.04] text-slate-200'
            }`}
            style={lightTheme ? { borderColor: 'rgba(201, 100, 66, 0.16)', background: 'rgba(201, 100, 66, 0.08)', color: '#9a5a48' } : undefined}
          >
            <span className="mono text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ fontFamily: MONO_FONT }}>RP</span>
          </div>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${lightTheme ? '' : 'text-slate-300'}`} style={lightTheme ? { color: '#9a5a48' } : undefined}>
              Điểm Nghiên Cứu
            </p>
            <div className="mt-1 flex items-end gap-2">
              <p className={`text-3xl font-black tabular-nums leading-none ${lightTheme ? '' : 'text-slate-100'}`} style={lightTheme ? { color: '#1f1e1d' } : undefined}>
                {currentRP.toLocaleString()}
              </p>
              <span className={`pb-0.5 text-xs font-semibold uppercase tracking-[0.18em] ${lightTheme ? '' : 'text-slate-400'}`} style={lightTheme ? { color: '#9a5a48' } : undefined}>
                RP
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:max-w-[30rem] sm:justify-end">
          {rpTips.map((tip) => (
            <span
              key={tip}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium leading-4 ${
                lightTheme
                  ? 'border-[rgba(31,30,29,0.08)] bg-white/80 text-[#6a6862]'
                  : 'border-white/10 bg-white/5 text-slate-300'
              }`}
            >
              {tip}
            </span>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="rounded-[18px] p-3 text-sm font-medium text-center"
          style={lightTheme
            ? toast.ok
              ? { background: 'rgba(255,255,255,0.84)', border: '1px solid rgba(217,214,204,0.96)', color: '#5b7a52', boxShadow: '0 14px 28px rgba(31,30,29,0.05)' }
              : { background: 'rgba(248,235,228,0.84)', border: '1px solid rgba(201,100,66,0.16)', color: '#8a3f24', boxShadow: '0 14px 28px rgba(31,30,29,0.05)' }
            : undefined}
        >
          {toast.msg}
        </div>
      )}

      {/* Era selector */}
      <div className="flex flex-wrap gap-1.5">
        {eraList.map((era) => (
          <button
            key={era}
            onClick={() => setSelectedEra(era)}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={selectedEra === era
              ? (lightTheme
                  ? { background: 'rgba(201, 100, 66, 0.10)', borderColor: 'rgba(201, 100, 66, 0.22)', color: '#9a5a48' }
                  : { background: 'rgba(var(--accent-rgb),0.18)', borderColor: 'rgba(var(--accent-rgb),0.28)', color: '#f4efe7' })
              : (lightTheme
                  ? { borderColor: 'rgba(31, 30, 29, 0.08)', color: '#6a6862', background: 'rgba(255,255,255,0.74)' }
                  : { borderColor: '#475569', color: '#94a3b8' })}
          >
            Kỷ {era}
          </button>
        ))}
      </div>

      {/* Blueprint research cards */}
      <div className="space-y-3">
        {eraBps.map(({ id, label, icon, description, meta, eff }) => {
          if (!meta) return null;
          const researchCost = getDisplayedResearchCost(buildings, id);
          const isResearched  = researched.has(id) || alreadyOwned.has(id);
          const canAffordRP   = currentRP >= researchCost;

          return (
            <div
              key={id}
              onClick={() => onSelectBp?.(id)}
              className="rounded-[24px] p-4 border transition-colors cursor-pointer"
              style={lightTheme
                ? {
                    background: 'rgba(255, 255, 255, 0.82)',
                    borderColor: isResearched ? 'rgba(111, 123, 98, 0.22)' : 'rgba(31, 30, 29, 0.08)',
                    boxShadow: '0 10px 24px rgba(31, 30, 29, 0.05)',
                  }
                : undefined}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mono flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] border text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={lightTheme
                    ? { borderColor: 'rgba(31, 30, 29, 0.08)', background: 'rgba(244,242,236,0.94)', color: '#9a5a48', fontFamily: MONO_FONT }
                    : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', fontFamily: MONO_FONT }}
                >
                  {getBlueprintMark({ id, label })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm" style={lightTheme ? { color: '#1f1e1d' } : { color: '#ffffff' }}>{label}</p>
                    {meta?.rarity && <RarityBadge rarity={meta.rarity} lightTheme={lightTheme} />}
                    {eff?.type && <TypeBadge type={eff.type} lightTheme={lightTheme} />}
                    {isResearched && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={lightTheme
                          ? { color: '#6f7b62', background: 'rgba(111, 123, 98, 0.10)', border: '1px solid rgba(111, 123, 98, 0.18)' }
                          : undefined}
                      >
                        ✓ Đã mở
                      </span>
                    )}
                  </div>
                  <p className="text-xs line-clamp-2" style={lightTheme ? { color: '#6a6862' } : { color: '#94a3b8' }}>{description}</p>

                  {/* Hiệu ứng tóm tắt */}
                  <div className="mt-1.5 space-y-0.5">
                    {meta?.rarity && (
                      <p className="text-xs" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>{RESEARCH_TRACK[meta.rarity] ?? 'Đầu tư'}</p>
                    )}
                    <PerkSummary perk={eff?.perk} lightTheme={lightTheme} />
                    <p className="text-xs" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>{meta.sessionsToComplete} phiên xây</p>
                  </div>

                  {!isResearched && (
                    <div className="mt-2 space-y-1.5">
                      <div>
                        <p className="text-xs mb-0.5" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>Nghiên cứu bằng RP:</p>
                        <RPBar currentRP={currentRP} cost={researchCost} lightTheme={lightTheme} />
                      </div>
                    </div>
                  )}
                </div>

                {!isResearched && (
                  <motion.button
                    whileHover={canAffordRP ? { scale: 1.05 } : {}}
                    whileTap={canAffordRP ? { scale: 0.95 } : {}}
                    onClick={(e) => { e.stopPropagation(); canAffordRP && handleResearch(id, researchCost); }}
                    disabled={!canAffordRP}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-colors"
                    style={canAffordRP
                      ? (lightTheme
                          ? {
                              background: 'rgba(31,30,29,0.98)',
                              color: '#faf9f6',
                              border: '1px solid rgba(31,30,29,0.12)',
                              boxShadow: '0 10px 22px rgba(31,30,29,0.10)',
                            }
                          : { background: 'rgba(var(--accent-rgb),0.9)', color: '#ffffff' })
                      : (lightTheme
                          ? { background: 'rgba(31, 30, 29, 0.06)', color: '#8a8a86', border: '1px solid rgba(31, 30, 29, 0.08)' }
                          : { background: '#334155', color: '#64748b' })}
                  >
                    {canAffordRP ? 'Nghiên cứu' : `${researchCost.toLocaleString()} RP`}
                  </motion.button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Blueprint Detail Panel ────────────────────────────────────────────────────
function BlueprintDetailPanel({ bpId, onClose, buildings, research, lightTheme }) {
  const def          = CATALOG_FLAT[bpId];
  const meta         = BLUEPRINT_META[bpId];
  const eff          = BUILDING_EFFECTS[bpId];
  const spec         = BUILDING_SPECS[bpId];
  const wKey         = eff?.wonderEffect;
  const wEff         = wKey ? WONDER_EFFECT_REGISTRY[wKey] : null;
  const perk         = eff?.perk;
  const era          = def?.era ?? 1;
  const eraRef       = ERA_REFINED[era] ?? {};
  const eraMeta      = ERA_METADATA[era] ?? {};
  const normalizedRawCost = normalizeRawCost(spec?.cost ?? {});
  const refinedCost = getUnifiedRefinedCost(spec?.refinedCost);
  const researchCost = getDisplayedResearchCost(buildings, bpId);
  const typeStyle    = TYPE_STYLE[eff?.type] ?? TYPE_STYLE.infrastructure;

  const isBuilt      = buildings?.includes(bpId);
  const isResearched = research?.researched?.includes(bpId);
  const isUnlocked   = isBuilt || isResearched;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        backgroundColor: lightTheme ? 'rgba(31,30,29,0.34)' : 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col ${lightTheme ? '' : 'bg-slate-900'}`}
        style={lightTheme
          ? {
              background: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid rgba(31, 30, 29, 0.08)',
              boxShadow: '0 24px 62px rgba(31, 30, 29, 0.14)',
            }
          : { border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(24,21,17,0.98)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4" style={{ borderBottom: lightTheme ? '1px solid rgba(31, 30, 29, 0.08)' : '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="mono flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[18px] border text-[12px] font-semibold uppercase tracking-[0.18em]"
            style={lightTheme
              ? { border: '1px solid rgba(31, 30, 29, 0.08)', background: 'rgba(244,242,236,0.94)', color: '#9a5a48', fontFamily: MONO_FONT }
              : { border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', fontFamily: MONO_FONT }}
          >
            {getBlueprintMark(def)}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="truncate text-[30px] font-medium leading-tight tracking-[-0.03em]"
              style={lightTheme ? { color: '#1f1e1d', fontFamily: DISPLAY_FONT } : { color: '#ffffff', fontFamily: DISPLAY_FONT }}
            >
              {def?.label ?? bpId}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {meta?.rarity && <RarityBadge rarity={meta.rarity} lightTheme={lightTheme} />}
              {eff?.type && (
                <TypeBadge type={eff.type} lightTheme={lightTheme} />
              )}
              <span className="text-xs" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>Kỷ {era} — {eraMeta.label}</span>
              {isBuilt && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={lightTheme ? { color: '#6f7b62', background: 'rgba(111, 123, 98, 0.10)', border: '1px solid rgba(111, 123, 98, 0.18)' } : undefined}>
                  ✓ Đã xây
                </span>
              )}
              {!isBuilt && isUnlocked && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={lightTheme ? { color: '#9a5a48', background: 'rgba(201, 100, 66, 0.10)', border: '1px solid rgba(201, 100, 66, 0.18)' } : undefined}>
                  Đã nghiên cứu
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xl w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
            style={lightTheme
              ? { color: '#8a8a86', border: '1px solid rgba(31, 30, 29, 0.08)', background: 'rgba(255,255,255,0.78)' }
              : { color: '#64748b' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>

          {/* Description */}
          {def?.description && (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed" style={lightTheme ? { color: '#6a6862' } : { color: '#cbd5e1' }}>{def.description}</p>
              {meta?.rarity && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full px-2 py-1" style={lightTheme ? { color: '#6a6862', background: 'rgba(31, 30, 29, 0.04)', border: '1px solid rgba(31, 30, 29, 0.08)' } : {}}>
                    Hướng {RESEARCH_TRACK[meta.rarity] ?? 'Đầu tư'}
                  </span>
                  <span className="rounded-full px-2 py-1" style={lightTheme ? { color: '#8a8a86', background: 'rgba(31, 30, 29, 0.04)', border: '1px solid rgba(31, 30, 29, 0.08)' } : {}}>
                    Nhịp xây {meta.sessionsToComplete} phiên
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Effects */}
          <div className="rounded-[22px] p-4 space-y-2" style={lightTheme ? { background: 'rgba(250, 249, 246, 0.94)', border: '1px solid rgba(31, 30, 29, 0.08)' } : { background: 'rgba(30,41,59,0.5)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>Đặc quyền công trình</p>
            <PerkSummary perk={perk} lightTheme={lightTheme} />

            <details className="pt-1">
              <summary className="cursor-pointer text-xs font-semibold" style={lightTheme ? { color: '#8a8a86' } : { color: '#94a3b8' }}>
                Thông số cân bằng
              </summary>
              <div className="mt-2 space-y-2">
            {eff?.type === 'infrastructure' && (
              <div className="space-y-1.5">
                <p className="text-sm" style={lightTheme ? { color: '#68796a' } : { color: '#7dd3fc' }}>
                  <span className="font-semibold">Lv.1:</span> +{eff.passiveT1PerBreakMin ?? 0} nguyên liệu thô/phút nghỉ
                  {eff.passiveT2PerBreakMin
                    ? ` · +${(eff.passiveT2PerBreakMin ?? 0).toFixed(2)} ${eraRef.t2Icon ?? ''} ${eraRef.t2Label ?? ''}`
                    : ''}
                </p>
                <p className="text-sm" style={lightTheme ? { color: '#7a6877' } : { color: '#c4b5fd' }}>
                  <span className="font-semibold">Lv.2 (×1.75):</span> +{Math.floor((eff.passiveT1PerBreakMin ?? 0) * 1.75)} nguyên liệu thô/phút nghỉ
                  {eff.passiveT2PerBreakMin
                    ? ` · +${((eff.passiveT2PerBreakMin ?? 0) * getBuildingLevelMultiplier(2)).toFixed(2)} ${eraRef.t2Icon ?? ''} ${eraRef.t2Label ?? ''}`
                    : ''}
                </p>
                <p className="text-sm" style={lightTheme ? { color: '#9c7645' } : { color: '#f0abfc' }}>
                  <span className="font-semibold">Lv.3 (×2.5):</span> +{Math.floor((eff.passiveT1PerBreakMin ?? 0) * 2.5)} nguyên liệu thô/phút nghỉ
                  {eff.passiveT2PerBreakMin
                    ? ` · +${((eff.passiveT2PerBreakMin ?? 0) * getBuildingLevelMultiplier(3)).toFixed(2)} ${eraRef.t2Icon ?? ''} ${eraRef.t2Label ?? ''}`
                    : ''}
                </p>
              </div>
            )}
            {eff?.type === 'economy' && (
              <div className="space-y-1">
                <p className="text-sm" style={lightTheme ? { color: '#9c7645' } : { color: '#fcd34d' }}>+{formatPercent(eff.t1DropBonus ?? 0)} nguyên liệu thô mỗi phiên</p>
                {(eff.t2DropBonus ?? 0) > 0 && (
                  <p className="text-sm" style={lightTheme ? { color: '#9c7645' } : { color: '#fcd34d' }}>
                    +{formatPercent(eff.t2DropBonus ?? 0)} {eraRef.t2Icon ?? ''} {eraRef.t2Label ?? 'tinh luyện'}
                  </p>
                )}
                <p className="text-sm" style={lightTheme ? { color: '#7a6877' } : { color: '#c4b5fd' }}>
                  <span className="font-semibold">Lv.2 (×1.75):</span> +{formatPercent((eff.t1DropBonus ?? 0) * getBuildingLevelMultiplier(2))} nguyên liệu thô
                  {(eff.t2DropBonus ?? 0) > 0
                    ? ` · +${formatPercent((eff.t2DropBonus ?? 0) * getBuildingLevelMultiplier(2))} ${eraRef.t2Icon ?? ''} ${eraRef.t2Label ?? 'tinh luyện'}`
                    : ''}
                </p>
                <p className="text-sm" style={lightTheme ? { color: '#9c7645' } : { color: '#f0abfc' }}>
                  <span className="font-semibold">Lv.3 (×2.5):</span> +{formatPercent((eff.t1DropBonus ?? 0) * getBuildingLevelMultiplier(3))} nguyên liệu thô
                  {(eff.t2DropBonus ?? 0) > 0
                    ? ` · +${formatPercent((eff.t2DropBonus ?? 0) * getBuildingLevelMultiplier(3))} ${eraRef.t2Icon ?? ''} ${eraRef.t2Label ?? 'tinh luyện'}`
                    : ''}
                  </p>
              </div>
            )}
            {eff?.type === 'defense' && (
              <div className="space-y-1">
                <p className="text-sm" style={lightTheme ? { color: '#8d5c54' } : { color: '#fda4af' }}><span className="font-semibold">Lv.1:</span> giảm {formatPercent(eff.cancelLossReductionPct ?? 0)} thất thoát khi hủy phiên</p>
                <p className="text-sm" style={lightTheme ? { color: '#7a6877' } : { color: '#c4b5fd' }}><span className="font-semibold">Lv.2 (×1.75):</span> giảm {formatPercent((eff.cancelLossReductionPct ?? 0) * getBuildingLevelMultiplier(2))}</p>
                <p className="text-sm" style={lightTheme ? { color: '#9c7645' } : { color: '#f0abfc' }}><span className="font-semibold">Lv.3 (×2.5):</span> giảm {formatPercent((eff.cancelLossReductionPct ?? 0) * getBuildingLevelMultiplier(3))}</p>
              </div>
            )}
            {wEff && (
              <div className="rounded-[18px] p-3 mt-1" style={lightTheme ? { background: 'rgba(243,236,239,0.82)', border: '1px solid rgba(166,137,149,0.18)' } : { background: 'rgba(88,28,135,0.2)', border: '1px solid rgba(126,34,206,0.2)' }}>
                <p className="text-xs font-semibold mb-0.5" style={lightTheme ? { color: '#7a6877' } : { color: '#d8b4fe' }}>Kỳ quan: {wEff.label}</p>
                <p className="text-xs leading-5" style={lightTheme ? { color: '#6a6862' } : { color: '#e9d5ff' }}>{wEff.description}</p>
              </div>
            )}
              </div>
            </details>
          </div>

          {/* Build info */}
          <div className="rounded-[22px] p-4 space-y-2" style={lightTheme ? { background: 'rgba(250, 249, 246, 0.94)', border: '1px solid rgba(31, 30, 29, 0.08)' } : { background: 'rgba(30,41,59,0.5)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>Thông tin xây dựng</p>
            <div className="flex items-center gap-4 text-sm">
              <span style={lightTheme ? { color: '#6a6862' } : { color: '#cbd5e1' }}>{meta?.sessionsToComplete ?? 1} phiên</span>
            </div>

            {/* Raw costs */}
            {Object.keys(normalizedRawCost).length > 0 && (
              <div>
                <p className="text-xs mb-1" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>Nguyên liệu thô:</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(normalizedRawCost).map(([res, amount]) => {
                    const resInfo = eraMeta.resources?.find((r) => r.id === res);
                    return (
                    <span
                      key={res}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={lightTheme
                          ? { background: 'rgba(255,255,255,0.86)', border: '1px solid rgba(31,30,29,0.08)', color: '#6a6862' }
                          : { background: 'rgba(51,65,85,0.6)', border: '1px solid rgba(71,85,105,0.5)', color: '#cbd5e1' }}
                    >
                        {amount.toLocaleString()} {resInfo?.label ?? res}
                    </span>
                  );
                })}
              </div>
              </div>
            )}

            {/* Refined costs */}
            {refinedCost > 0 && (
              <div>
                <p className="text-xs mb-1" style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>Nguyên liệu tinh luyện:</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={lightTheme ? { background: 'rgba(243,236,239,0.82)', border: '1px solid rgba(166,137,149,0.18)', color: '#7a6877' } : { background: 'rgba(76,29,149,0.3)', border: '1px solid rgba(109,40,217,0.3)', color: '#c4b5fd' }}>
                    {refinedCost} {eraRef.t2Label ?? 'Tinh luyện'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Upgrade path */}
          <div className="rounded-[22px] p-4" style={lightTheme ? { background: 'rgba(250, 249, 246, 0.94)', border: '1px solid rgba(31, 30, 29, 0.08)' } : { background: 'rgba(30,41,59,0.5)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-2" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>Con đường nâng cấp</p>
            <div className="space-y-2">
              {[
                { from: 'Lv.1', to: 'Lv.2', color: lightTheme ? '#7a6877' : '#c4b5fd', costLabel: eraRef.t2Label ?? 'Tinh luyện', costAmount: getUpgradeRefinedCost(era, 1) },
                { from: 'Lv.2', to: 'Lv.3', color: lightTheme ? '#9c7645' : '#f0abfc', costLabel: eraRef.t2Label ?? 'Tinh luyện', costAmount: getUpgradeRefinedCost(era, 2) },
              ].map((step) => (
                <div key={step.from} className="flex items-center gap-2 text-xs">
                  <span style={lightTheme ? { color: '#8a8a86' } : { color: '#64748b' }}>{step.from} →</span>
                  <span className="font-semibold" style={{ color: step.color }}>{step.to}</span>
                  <span className="flex-1" style={lightTheme ? { color: '#d9d6cc' } : { color: '#475569' }}>|</span>
                  <span style={lightTheme ? { color: '#6a6862' } : { color: '#94a3b8' }}>Chi phí: {step.costAmount} {step.costLabel}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Research info */}
          {meta && (
            <div className="rounded-[22px] p-4" style={lightTheme ? { background: 'rgba(250, 249, 246, 0.94)', border: '1px solid rgba(31, 30, 29, 0.08)' } : { background: 'rgba(30,41,59,0.5)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-2" style={lightTheme ? { color: '#8a8a86', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>Mở khóa bằng nghiên cứu</p>
              <div className="flex items-center gap-3 text-sm">
                <span style={lightTheme ? { color: '#9a5a48' } : { color: '#a5b4fc' }}>{researchCost.toLocaleString()} RP</span>
                {researchCost < (meta.rpCost ?? researchCost) && (
                  <span className="text-[11px]" style={lightTheme ? { color: '#6f7b62' } : { color: '#86efac' }}>Đã áp dụng giảm 25%</span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BlueprintInventory() {
  const blueprints        = useGameStore((s) => s.blueprints);
  const buildings         = useGameStore((s) => s.buildings);
  const research          = useGameStore((s) => s.research ?? { rp: 0, researched: [] });
  const activeBook        = useGameStore((s) => s.progress.activeBook);
  const researchBlueprint = useGameStore((s) => s.researchBlueprint);

  const [tab, setTab]           = useState('research');
  const [selectedBpId, setSelectedBpId] = useState(null);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';

  const unlockedCount = new Set([
    ...(research?.researched ?? []),
    ...blueprints.map((b) => b.id),
  ]).size;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          {lightTheme && (
            <p className="mono text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: '#9a5a48' }}>
              Blueprints
            </p>
          )}
          <h2 className={lightTheme ? 'serif text-[2rem] leading-none' : 'text-white font-bold text-lg'} style={lightTheme ? { color: '#1f1e1d' } : undefined}>
            Bản vẽ & nghiên cứu
          </h2>
        </div>
        <span className="text-xs rounded-full px-3 py-1" style={lightTheme ? { color: '#9a5a48', background: 'rgba(201, 100, 66, 0.08)', border: '1px solid rgba(201, 100, 66, 0.18)' } : {}}>
          {unlockedCount}/{Object.keys(CATALOG_FLAT).length} đã mở
        </span>
      </div>

      {/* Tab switcher */}
      <div className={`flex gap-2 rounded-[18px] p-1.5 ${lightTheme ? '' : 'bg-slate-800'}`} style={lightTheme ? { background: 'rgba(255,255,255,0.74)', border: '1px solid rgba(31, 30, 29, 0.08)' } : undefined}>
        {[
          { key: 'research', label: 'Nghiên cứu' },
          { key: 'collection', label: `Đã mở (${unlockedCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 rounded-[14px] py-2 text-sm font-medium transition-colors"
            style={tab === key
              ? (lightTheme
                  ? {
                      background: 'rgba(244,242,236,0.98)',
                      color: '#1f1e1d',
                      border: '1px solid rgba(31,30,29,0.10)',
                      boxShadow: '0 10px 18px rgba(31,30,29,0.05)',
                    }
                  : { background: '#4f46e5', color: '#ffffff' })
              : (lightTheme
                  ? { color: '#6a6862' }
                  : { color: '#94a3b8' })}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'research' && (
        <ResearchTab
          research={research}
          blueprints={blueprints}
          buildings={buildings}
          activeBook={activeBook}
          researchBlueprint={researchBlueprint}
          onSelectBp={setSelectedBpId}
          lightTheme={lightTheme}
        />
      )}
      {tab === 'collection' && (
        <MyBlueprintsTab
          blueprints={blueprints}
          research={research}
          buildings={buildings}
          onSelectBp={setSelectedBpId}
          lightTheme={lightTheme}
        />
      )}

      {/* Blueprint Detail Panel */}
      <AnimatePresence>
        {selectedBpId && (
          <BlueprintDetailPanel
            bpId={selectedBpId}
            onClose={() => setSelectedBpId(null)}
            buildings={buildings}
            research={research}
            lightTheme={lightTheme}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
