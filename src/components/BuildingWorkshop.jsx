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
import { useCustomMotion, useEnterMotion, usePressMotion, useSnapMotion } from '../lib/motionPresets';
import useGameStore from '../store/gameStore';
import {
  blueprintEraOf, countActiveCrafting, countLegacyCrafting, listRestorableBlueprints,
} from '../engine/eraLegacy';
import { describeCraftProgress } from '../engine/craftProgress';
import useSettingsStore from '../store/settingsStore';
import {
  BUILDING_SPECS,
  BUILDING_EFFECTS,
  BLUEPRINT_CATALOG,
  BLUEPRINT_META,
  CRAFT_QUEUE_SLOTS,
  LEGACY_QUEUE_SLOTS,
  ERA_REFINED,
  ERA_METADATA,
  normalizeRawCost,
  normalizeRefinedBag,
  getUnifiedRefinedCost,
  getUpgradeRefinedCost,
  getBuildingLevelMultiplier,
} from '../engine/constants';
import { getGlyph, hasGlyphIcon } from '../utils/labelMark';
import { TypeBadge, RarityBadge, PerkSummary } from './shared/BadgeKit';

const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

// ─── helpers ──────────────────────────────────────────────────────────────────
const ALL_BLUEPRINTS = Object.values(BLUEPRINT_CATALOG).flat();
function getBpDef(id) {
  return ALL_BLUEPRINTS.find((b) => b.id === id) ?? { id, label: id, icon: '', description: '' };
}

const TYPE_STYLE = {
  infrastructure: { label: 'Hạ Tầng',  color: 'text-sky-300',    bg: 'bg-sky-900/40',    border: 'border-sky-700/60'  },
  economy:        { label: 'Kinh Tế',   color: 'text-amber-300',  bg: 'bg-amber-900/40',  border: 'border-amber-700/60'},
  defense:        { label: 'Ổn Định',   color: 'text-rose-300',   bg: 'bg-rose-900/40',   border: 'border-rose-700/60' },
  wonder:         { label: 'Kỳ Quan',   color: 'text-purple-300', bg: 'bg-purple-900/40', border: 'border-purple-700/60'},
};

function formatPercent(value = 0) {
  return `${Math.round(value * 100)}%`;
}

function paperPanel(lightTheme) {
  if (!lightTheme) return {};
  return {
    background: 'var(--card-bg-solid)',
    border: 'var(--skin-card-border-width,1px) solid var(--line)',
    borderRadius: 'var(--skin-radius-card,18px)',
    boxShadow: 'var(--skin-card-shadow)',
  };
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
function QueueSection({ queue, activeBook, cancelCrafting, lightTheme }) {
  // NGOẠI LỆ (mang bố cục) — bề dài thanh CHÍNH LÀ tiến độ xây của công trình ấy.
  const barMotion = useSnapMotion({});
  if (queue.length === 0) return null;
  // ⚠️ SỐ Ô PHẢI ĐẾM BẰNG `countActiveCrafting`, KHÔNG dùng `queue.length` — từ Phase 4D hàng đợi
  // có thể chứa "di sản" của kỷ đã đóng, mà di sản KHÔNG chiếm ô. Dùng `.length` thì màn hình sẽ
  // báo "3/2" — một con số vô nghĩa khiến Đàm tưởng app hỏng.
  const usedSlots = countActiveCrafting(queue, activeBook);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--muted-2)', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>
          Hàng chờ xây dựng
        </p>
        <span className="mono text-[11px] tabular-nums" style={lightTheme ? { color: 'var(--muted-2)', fontFamily: MONO_FONT } : { color: '#64748b', fontFamily: MONO_FONT }}>
          {usedSlots}/{CRAFT_QUEUE_SLOTS}
        </span>
      </div>
      {queue.map((item) => {
        const itemEra = blueprintEraOf(item.bpId);
        // "Di sản": công trình của một kỷ ĐÃ ĐÓNG, vẫn xây tiếp được nhưng khi xong sẽ vào BẢO
        // TÀNG chứ không sinh đặc quyền. Phải nói rõ ngay trên thẻ — nếu không, Đàm sẽ chờ một
        // đặc quyền không bao giờ tới.
        const isLegacy = Number.isFinite(itemEra) && Number.isFinite(activeBook) && itemEra < activeBook;
        const bpDef = getBpDef(item.bpId);
        const meta  = BLUEPRINT_META[item.bpId] ?? {};
        const eff   = BUILDING_EFFECTS[item.bpId] ?? {};
        // ⚠️ DÙNG CHUNG công thức với giàn giáo trong thành phố 3D (`engine/craftProgress.js`,
        // Phase 4E). Bản tự tính tại chỗ trước đây — `total = meta.sessionsToComplete ?? 1` rồi
        // `done = total - remaining` — KHÔNG kẹp biên, nên một mục có `sessionsRemaining` lớn hơn
        // tổng (cloud lệch / file import cũ / bản cân bằng rút ngắn số phiên) hiện thẳng ra màn
        // hình là **"-4/2 phiên"** kèm thanh rỗng. Nó còn đọc `BLUEPRINT_META` trong khi engine đọc
        // `BUILDING_EFFECTS` — hai bảng, cùng một con số.
        const { total, done, pct, remaining } = describeCraftProgress(item.bpId, item.sessionsRemaining);
        // `total === null` = bản vẽ lạ (dữ liệu lệch). Mẫu số không có thật thì đừng in mẫu số —
        // "3/ phiên" là một dòng hỏng, còn "còn 3 phiên" vẫn là câu Đàm dùng được.
        const progressText = total === null ? `còn ${remaining} phiên` : `${done}/${total} phiên`;
        return (
          <div
            key={item.bpId}
            className="rounded-[24px] p-4 border"
            style={lightTheme
              ? {
                  background: 'var(--card-bg-solid)',
                  border: 'var(--skin-card-border-width,1px) solid rgba(var(--accent-rgb),0.22)',
                  borderRadius: 'var(--skin-radius-card,18px)',
                  boxShadow: 'var(--skin-card-shadow)',
                }
              : undefined}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{bpDef.icon}</span>
              <div className="flex-1 min-w-0">
                {/*
                  ⚠️ TÊN CÔNG TRÌNH ĐƯỢC MỘT HÀNG RIÊNG (2026-08-30). Bản cũ xếp tên chung hàng với
                  hai huy hiệu (độ hiếm + loại) và cả hai huy hiệu ấy đều `shrink-0`, nên **tên là
                  thứ DUY NHẤT trong hàng có thể bị bóp** — và nó bị bóp thật: ở khung 390px
                  "Cảng Biển Lớn" hiện ra thành **"Cảng Biể…"**. Thứ quan trọng nhất thẻ, thứ trả
                  lời câu *"tôi đang xây cái gì"*, lại là thứ nhường chỗ cho hai cái nhãn phân loại.
                  Không có gì đỏ lên: `truncate` là hành vi ĐÚNG của CSS, chỉ là nó cắt nhầm thứ.
                  Giá phải trả là ~18px chiều cao mỗi thẻ hàng chờ — đổi lấy việc đọc được tên.
                */}
                <p className="mb-1 truncate text-sm font-semibold" style={lightTheme ? { color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' } : { color: '#fcd34d' }}>{bpDef.label}</p>
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  {meta.rarity && <RarityBadge rarity={meta.rarity} lightTheme={lightTheme} variant="skin" />}
                  <TypeBadge type={eff.type} typeStyle={TYPE_STYLE} lightTheme={lightTheme} variant="skin" />
                  {isLegacy && (
                    <span
                      className="mono shrink-0 rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em]"
                      style={{
                        color: 'var(--muted)',
                        background: 'var(--canvas-2)',
                        border: '1px solid var(--line-2)',
                        fontFamily: MONO_FONT,
                      }}
                      title={`Công trình kỷ ${itemEra} — xây xong sẽ vào bảo tàng, không mang lại đặc quyền`}
                    >
                      di sản kỷ {itemEra}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={lightTheme ? { background: 'rgba(31, 30, 29, 0.08)' } : { background: '#334155' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={lightTheme ? { background: 'var(--accent)' } : undefined}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      {...barMotion}
                    />
                  </div>
                  <span className="mono text-xs tabular-nums flex-shrink-0" style={lightTheme ? { color: 'var(--muted)', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>
                    {progressText}
                  </span>
                </div>
              </div>
              <button
                onClick={() => cancelCrafting(item.bpId)}
                className="text-xs px-2.5 py-1 rounded-full transition-colors flex-shrink-0"
                style={lightTheme
                  ? {
                      color: 'var(--accent2)',
                      background: 'rgba(var(--accent-rgb),0.10)',
                      border: 'var(--skin-card-border-width,1px) solid rgba(var(--accent-rgb),0.18)',
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
function ReadyCard({ bpId, bookResources, resourcesRefined, craftingQueue, onStart, lightTheme, restoration = false }) {
  const enterMotion = useEnterMotion();
  const pressMotion = usePressMotion();
  // Phóng to khi DI CHUỘT không thuộc ba nhịp — đi qua cái gác ngoại lệ.
  const hoverGrow = useCustomMotion({ whileHover: { scale: 1.05 } });
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
    <motion.div layout {...enterMotion}
      className="rounded-[24px] p-4 border"
      style={lightTheme ? paperPanel(lightTheme) : undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <span
          className={`mono inline-flex h-9 w-9 items-center justify-center rounded-full border font-semibold flex-shrink-0 ${hasGlyphIcon(bpDef.icon) ? 'text-[18px] leading-none' : 'text-[8px] uppercase tracking-[0.14em]'}`}
          style={lightTheme
            ? { borderColor: 'var(--line)', background: 'var(--card-bg-solid2)', color: 'var(--accent2)', fontFamily: MONO_FONT }
            : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)', fontFamily: MONO_FONT }}
        >
          {getGlyph(bpDef.icon, bpDef.label, 'BP')}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-sm" style={lightTheme ? { color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' } : { color: '#ffffff' }}>{bpDef.label}</p>
            {meta.rarity && <RarityBadge rarity={meta.rarity} lightTheme={lightTheme} variant="skin" />}
            {eff.type && <TypeBadge type={eff.type} typeStyle={TYPE_STYLE} lightTheme={lightTheme} variant="skin" />}
          </div>
          <p className="text-xs" style={lightTheme ? { color: 'var(--muted)' } : { color: '#94a3b8' }}>{bpDef.description}</p>

          {/* Hiệu ứng */}
          <div className="mt-1.5 space-y-0.5">
            {/* ⚠️ THẺ TRÙNG TU KHÔNG ĐƯỢC KHOE ĐẶC QUYỀN — bắt được bằng cách SOI ẢNH CHỤP,
                không phải bằng test (2026-08-13, ADR-012). `ReadyCard` dùng chung cho cả hai
                diện, mà công trình kỷ cũ khi xong sẽ vào BẢO TÀNG chứ không vào `buildings`
                ⇒ `BUILDING_EFFECTS` KHÔNG bao giờ có hiệu lực. Để nguyên khối perk thì thẻ
                đang hứa "mỗi phiên thứ 3 tặng 90 XP" cho một thứ vĩnh viễn không tặng gì —
                một lời nói dối im lặng, và Đàm chỉ phát hiện ra sau khi đã trả nguyên liệu. */}
            {restoration
              ? (
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Xong sẽ đứng trong bảo tàng kỷ {meta.era} · không có đặc quyền
                </p>
                )
              : <PerkSummary perk={eff.perk} lightTheme={lightTheme} variant="skin" />}
            <p className="mono text-xs" style={lightTheme ? { color: 'var(--muted-2)', fontFamily: MONO_FONT } : { color: '#64748b' }}>{meta.sessionsToComplete ?? 1} phiên để hoàn thành</p>
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
          {...(canAfford ? hoverGrow : {})}
          {...(canAfford ? pressMotion : {})}
          onClick={() => canAfford && onStart(bpId)}
          disabled={!canAfford}
          title={reason ?? ''}
          className="mono w-full rounded-[16px] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors sm:w-auto sm:flex-shrink-0"
          style={lightTheme
              ? inQueue
                ? { background: 'rgba(242,230,209,0.92)', color: '#8b6733', border: '1px solid rgba(176,125,59,0.2)', borderRadius: 'var(--skin-radius-control,14px)', cursor: 'not-allowed', fontFamily: MONO_FONT }
              : canAfford
                ? { background: 'var(--ink)', color: 'var(--card-bg-solid)', border: 'var(--skin-card-border-width,1px) solid var(--ink)', borderRadius: 'var(--skin-radius-control,14px)', boxShadow: 'var(--skin-card-shadow)', fontFamily: MONO_FONT }
                : { background: 'var(--card-bg-solid2)', color: 'var(--muted-2)', border: 'var(--skin-card-border-width,1px) solid var(--line)', borderRadius: 'var(--skin-radius-control,14px)', cursor: 'not-allowed', fontFamily: MONO_FONT }
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
            background: 'var(--card-bg-solid)',
            border: 'var(--skin-card-border-width,1px) solid var(--line)',
            borderRadius: 'var(--skin-radius-card,18px)',
            boxShadow: 'var(--skin-card-shadow)',
          }
        : undefined}
    >
      <span
        className={`mono inline-flex h-9 w-9 items-center justify-center rounded-full border font-semibold flex-shrink-0 ${hasGlyphIcon(bpDef.icon) ? 'text-[18px] leading-none' : 'text-[8px] uppercase tracking-[0.14em]'}`}
        style={lightTheme
          ? { borderColor: 'var(--line)', background: 'var(--card-bg-solid2)', color: 'var(--accent2)', fontFamily: MONO_FONT }
          : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)', fontFamily: MONO_FONT }}
      >
        {getGlyph(bpDef.icon, bpDef.label, 'BP')}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p
            className={lightTheme ? 'text-[1.06rem] font-semibold leading-none tracking-[-0.02em]' : 'font-semibold text-sm'}
            style={lightTheme ? { color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' } : { color: '#86efac' }}
          >
            {bpDef.label}
          </p>
          {BLUEPRINT_META[bpId]?.rarity && <RarityBadge rarity={BLUEPRINT_META[bpId].rarity} lightTheme={lightTheme} variant="skin" />}
          {eff.type && <TypeBadge type={eff.type} typeStyle={TYPE_STYLE} lightTheme={lightTheme} variant="skin" />}
          <span className={`text-xs font-bold ${LEVEL_COLOR[lv]}`} style={lightTheme ? { color: lv === 1 ? '#6a6862' : lv === 2 ? '#7a6877' : '#9c7645', fontFamily: MONO_FONT } : { fontFamily: MONO_FONT }}>{LEVEL_LABEL[lv]}</span>
          {lv > 1 && (
            <span className="mono text-xs tabular-nums" style={lightTheme ? { color: 'var(--muted-2)', fontFamily: MONO_FONT } : { color: '#64748b', fontFamily: MONO_FONT }}>×{LEVEL_MULT[lv]} hiệu ứng</span>
          )}
        </div>
        <PerkSummary perk={eff.perk} lightTheme={lightTheme} variant="skin" />
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        {lv < 3 && onUpgrade && (
          <button
            onClick={() => canUpgrade && onUpgrade(bpId)}
            disabled={!canUpgrade}
            className="w-full rounded-[14px] px-2.5 py-1 text-xs border transition-colors sm:w-auto"
            style={lightTheme
              ? canUpgrade
                ? { background: 'rgba(243,236,239,0.88)', borderColor: 'rgba(166,137,149,0.2)', color: '#7a6877', borderRadius: 'var(--skin-radius-control,14px)', boxShadow: 'var(--skin-card-shadow)' }
                : { background: 'var(--card-bg-solid2)', borderColor: 'var(--line)', color: 'var(--muted-2)', borderRadius: 'var(--skin-radius-control,14px)', cursor: 'not-allowed' }
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
  const enterMotion = useEnterMotion();
  const blueprints       = useGameStore((s) => s.blueprints);
  const buildings        = useGameStore((s) => s.buildings);
  const resources        = useGameStore((s) => s.resources);
  const research         = useGameStore((s) => s.research ?? { rp: 0, researched: [] });
  const craftingQueue    = useGameStore((s) => s.craftingQueue ?? []);
  const buildingLevels   = useGameStore((s) => s.buildingLevels ?? {});
  const resourcesRefined = useGameStore((s) => s.resourcesRefined ?? {});
  const activeBook       = useGameStore((s) => s.progress.activeBook);
  const cityArchive      = useGameStore((s) => s.cityArchive);
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

  // ── TRÙNG TU DI SẢN (ADR-012) ────────────────────────────────────────────────────────────
  // Bản vẽ của kỷ ĐÃ ĐÓNG mà thành phố cũ còn thiếu. Xây xong nó vào BẢO TÀNG, không sinh đặc
  // quyền — nên đây thuần tuý là đường để chạm tới ngôi sao ★ của một kỷ đã qua.
  const restorables = listRestorableBlueprints({ activeBook, cityArchive, queue: craftingQueue });
  const legacyBusy = countLegacyCrafting(craftingQueue, activeBook) >= LEGACY_QUEUE_SLOTS;

  // ⚠️ XẾP KỶ GẦN TRỌN VẸN NHẤT LÊN ĐẦU, và CẮT còn 6 thẻ.
  // Không cắt thì màn hình ra tới ~70 thẻ, nhấn chìm mục "Sẵn sàng xây" (nhiều nhất 5 thẻ) của kỷ
  // đang chơi — tức việc phụ che mất việc chính. Còn xếp theo "kỷ cũ nhất trước" thì một kỷ đang ở
  // 4/5 (chỉ còn ĐÚNG MỘT công trình là được sao) có thể nằm tít dưới đáy. Sắp theo "còn thiếu ít
  // nhất" thì thứ Đàm thấy đầu tiên luôn là ngôi sao gần tầm tay nhất.
  const remainingByEra = restorables.reduce((acc, bp) => {
    acc[bp.era] = (acc[bp.era] ?? 0) + 1;
    return acc;
  }, {});
  const restoreList = [...restorables]
    .sort((a, b) => (remainingByEra[a.era] - remainingByEra[b.era]) || (a.era - b.era))
    .slice(0, 6);

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
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          {/* ⚠️ NHÃN "XƯỞNG" ĐÃ GỠ (2026-08-30) — chữ ấy xuất hiện BA lần trong một khung nhìn:
              nút tab đang sáng ("Xưởng"), nhãn này, rồi tiêu đề ngay dưới ("Xưởng xây dựng").
              Tiêu đề đã nói đủ và nói rõ hơn; nhãn chỉ gọi tên thứ mắt vừa đọc xong. */}
          <h2 className={lightTheme ? 'serif text-[1.8rem] leading-none sm:text-[2rem]' : 'text-white font-bold text-[1.1rem] sm:text-lg'} style={lightTheme ? { color: 'var(--ink)', fontFamily: 'var(--skin-font-display)', fontWeight: 600 } : undefined}>Xưởng xây dựng</h2>
        </div>
        {/*
          ⚠️ ĐÃ GỠ BA CHIP TÊN ĐẶC QUYỀN (2026-09-01). `activePerkLabels` lấy tên đặc quyền của
          những công trình ĐÃ XÂY — mà mỗi cái tên ấy được in LẠI nguyên văn trên chính thẻ công
          trình sinh ra nó, cách đó vài trăm px trên cùng một màn (`PerkSummary`). Đo bằng cách
          đếm chuỗi trong `document.body.innerText`: mỗi nhãn xuất hiện ĐÚNG HAI LẦN.
          Bản trên thẻ nói rõ hơn (có kèm cấp và mô tả), nên bản tóm tắt ở đây là chỗ nhường.
          Sáu chip còn lại toàn là SỐ (thô/phút nghỉ, tinh luyện…) — chúng không lặp ở đâu khác.
        */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
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
          <span className="mono rounded-full px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-xs tabular-nums" style={lightTheme ? { color: 'var(--accent2)', background: 'rgba(var(--accent-rgb),0.1)', border: 'var(--skin-card-border-width,1px) solid rgba(var(--accent-rgb),0.18)', fontFamily: MONO_FONT } : {}}>
            {currentEraBuildings.length} đã xây
          </span>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div {...enterMotion}
            className="p-3 rounded-[18px] text-sm font-medium text-center"
            style={lightTheme
              ? toast.ok
                ? { background: 'var(--card-bg-solid)', border: 'var(--skin-card-border-width,1px) solid var(--line)', borderRadius: 'var(--skin-radius-card,18px)', color: '#5b7a52', boxShadow: 'var(--skin-card-shadow)' }
                : { background: 'rgba(248,235,228,0.84)', border: 'var(--skin-card-border-width,1px) solid rgba(var(--accent-rgb),0.18)', borderRadius: 'var(--skin-radius-card,18px)', color: 'var(--accent2)', boxShadow: 'var(--skin-card-shadow)' }
              : undefined}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hàng đợi xây dựng */}
      <QueueSection queue={craftingQueue} activeBook={activeBook} cancelCrafting={cancelCrafting} lightTheme={lightTheme} />

      {/* Bản vẽ sẵn sàng xây */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--muted-2)', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>
            Sẵn sàng xây
          </p>
          <span className="mono text-[11px] tabular-nums" style={lightTheme ? { color: 'var(--muted-2)', fontFamily: MONO_FONT } : { color: '#64748b', fontFamily: MONO_FONT }}>
            {readyIds.length}
          </span>
        </div>
        {readyIds.length === 0 ? (
          <div
            className={`text-center py-8 rounded-[24px] ${lightTheme ? '' : 'bg-slate-800/30 border border-slate-700/50'}`}
            style={lightTheme ? paperPanel(lightTheme) : undefined}
          >
            <div className="mono mb-2 text-[12px] font-semibold uppercase tracking-[0.22em]" style={lightTheme ? { color: 'var(--accent2)', fontFamily: MONO_FONT } : { color: 'var(--accent-light)', fontFamily: MONO_FONT }}>BP</div>
            <p className="text-sm" style={lightTheme ? { color: 'var(--ink)' } : { color: '#64748b' }}>Chưa có bản vẽ nào chờ được dựng lên.</p>
            <p className="text-xs mt-1" style={lightTheme ? { color: 'var(--muted)' } : { color: '#475569' }}>
              Nghiên cứu một bản vẽ ở ngay bên dưới để mở thêm công trình.
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

      {/*
        TRÙNG TU DI SẢN (ADR-012) — đường DUY NHẤT để chạm tới ngôi sao ★ của một kỷ đã qua.
        Chỉ hiện khi thật sự có việc để làm: kỷ 1 thì mục này không tồn tại, và khi bảo tàng đã
        trọn vẹn hết thì nó tự biến mất thay vì đứng đó nói "không còn gì".
      */}
      {restorables.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--muted-2)', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>
              Trùng tu di sản
            </p>
            <span className="mono text-[11px] tabular-nums" style={lightTheme ? { color: 'var(--muted-2)', fontFamily: MONO_FONT } : { color: '#64748b', fontFamily: MONO_FONT }}>
              {restorables.length}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Công trình của kỷ đã qua. Xây xong nó đứng trong <strong>bảo tàng</strong> của kỷ đó —
            không thêm đặc quyền, nhưng đưa kỷ ấy tới gần dấu ★ trọn vẹn. Chỉ tiêu được nguyên liệu
            còn sót lại của chính kỷ đó, mà thứ ấy thì không kiếm thêm được nữa.
          </p>

          {legacyBusy ? (
            // Không vẽ nút chết: một hàng nút bấm-không-ăn-thua khó chịu hơn hẳn một dòng chữ nói
            // rõ vì sao. Thẻ đang trùng tu đã nằm ngay trong "Hàng chờ xây dựng" phía trên.
            <div
              className="rounded-[24px] px-4 py-3 text-[12px]"
              style={lightTheme ? paperPanel(lightTheme) : undefined}
            >
              <span style={{ color: 'var(--muted)' }}>
                Đang trùng tu một công trình rồi — xong cái đó thì mở tiếp cái nữa.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {restoreList.map((bp) => (
                <ReadyCard
                  key={bp.bpId}
                  bpId={bp.bpId}
                  bookResources={getBookResources(bp.bpId)}
                  resourcesRefined={getEraRefined(bp.bpId)}
                  craftingQueue={craftingQueue}
                  onStart={handleStart}
                  lightTheme={lightTheme}
                  restoration
                />
              ))}
              {restorables.length > restoreList.length && (
                <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                  Còn {restorables.length - restoreList.length} công trình nữa ở các kỷ khác — xếp
                  kỷ gần trọn vẹn nhất lên trước.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Công trình đã xây */}
      {currentEraBuildings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--muted-2)', fontFamily: MONO_FONT } : { color: '#94a3b8', fontFamily: MONO_FONT }}>
              Đã xây dựng
            </p>
            <span className="mono text-[11px] tabular-nums" style={lightTheme ? { color: 'var(--muted-2)', fontFamily: MONO_FONT } : { color: '#64748b', fontFamily: MONO_FONT }}>
              {currentEraBuildings.length}
            </span>
          </div>
          {/*
            ⚠️ CÂU NÀY TRƯỚC ĐÂY IN TRÊN TỪNG THẺ (2026-09-01) — đo trên màn thật ở 390px:
            **4 lần trên một màn**, và nó là một LUẬT CHUNG của mọi công trình từ cấp 2 trở lên,
            không phải một dữ kiện của riêng thẻ nào. Một luật nói lại ở mỗi thẻ thì nó thôi là
            hướng dẫn và thành nhiễu (cùng lý lẽ đã dùng cho 15 dòng di vật và 48 hộp thành tích).
          */}
          <p className="text-xs" style={lightTheme ? { color: 'var(--muted-2)' } : { color: '#64748b' }}>
            Cấp công trình vẫn tăng thông số nền phía sau đặc quyền.
          </p>
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
