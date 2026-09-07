/**
 * BuildScreen.jsx — màn CÔNG TRÌNH, một màn · một nút (2026-09-06, ADR-069).
 *
 * Thay cho `BuildingWorkshop.jsx` + `BlueprintInventory.jsx` (1.649 dòng, 2.376px ở khung 390px).
 * Luật nằm ở `engine/buildChoices.js`; file này CHỈ vẽ và gọi đúng MỘT action: `startProject`.
 *
 * BỐN KHỐI, theo thứ tự câu hỏi của người chơi:
 *   1. Đang xây gì, còn bao xa            → hero + hàng chờ (thanh tiến độ, nút huỷ nhỏ)
 *   2. Xây tiếp cái gì                    → tối đa 3 lựa chọn mở sẵn, còn lại GẤP (không giấu); mục
 *                                           này chỉ hiện khi còn gì để chọn
 *   3. Đã có gì                           → dãy ô nhỏ, chạm mới kể đặc quyền
 *   4. Trùng tu di sản (chỉ khi còn việc) → cùng thẻ, cùng nút, ô riêng (ADR-012)
 *
 * ⚠️ KHÔNG CÒN: RP, bảng giá nguyên liệu, tinh luyện, nút nâng cấp, tab "Nghiên cứu"/"Đã mở", huy
 * hiệu hiếm/loại trên từng thẻ. Mỗi thứ ấy là một cột số phải đọc trước khi được bấm, mà không cột
 * nào đổi được câu trả lời (xem chú thích đầu `buildChoices.js`).
 * ⚠️ KHÔNG ĐỤNG THÀNH PHỐ: thứ đi vào `craftingQueue`/`buildings` giữ nguyên hình dạng.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import InventoryHero from './shared/InventoryHero.jsx';
import { heroCongTrinh } from './shared/inventoryHero.js';
import { PerkSummary } from './shared/BadgeKit';
import { useEnterMotion, usePressMotion, useSnapMotion, withDelay } from '../lib/motionPresets';
import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import soundEngine from '../engine/soundEngine';
import { getGlyph, hasGlyphIcon } from '../utils/labelMark';
import {
  describeProject,
  describeQueue,
  eraBuildProgress,
  legacySlotState,
  listNextProjects,
  listRestorationChoices,
  projectPerkLine,
  slotState,
} from '../engine/buildChoices';
import { getBuildingLevelMultiplier } from '../engine/constants';

const CARD = {
  background: 'var(--card-bg-solid)',
  border: 'var(--skin-card-border-width,1px) solid var(--line)',
  borderRadius: 'var(--skin-radius-card,18px)',
  boxShadow: 'var(--skin-card-shadow)',
};
const eyebrowClass = 'mono text-[10px] font-semibold uppercase tracking-[0.2em]';
/** Bao nhiêu lựa chọn mở sẵn trước khi gấp phần còn lại — ba là đủ để chọn, không đủ để phải so bảng. */
const CHOICES_OPEN = 3;

function Glyph({ icon, label, size = 'md' }) {
  const isIcon = hasGlyphIcon(icon);
  const dim = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  return (
    <span
      className={`mono inline-flex ${dim} shrink-0 items-center justify-center rounded-full ${
        isIcon ? (size === 'lg' ? 'text-[24px]' : 'text-[20px]') + ' leading-none' : 'text-[9px] uppercase tracking-[0.14em]'
      }`}
      style={{ background: 'var(--card-bg-solid2, var(--card-bg-solid))', border: '1px solid var(--line)', color: 'var(--accent2)' }}
      aria-hidden="true"
    >
      {getGlyph(icon, label, 'BP')}
    </span>
  );
}

function SectionHead({ title, meta }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className={eyebrowClass} style={{ color: 'var(--muted-2)' }}>{title}</p>
      {meta != null && (
        <span className="mono text-[11px] tabular-nums" style={{ color: 'var(--muted-2)' }}>{meta}</span>
      )}
    </div>
  );
}

// ─── 1. Hàng chờ ─────────────────────────────────────────────────────────────

function QueueRow({ item, onCancel }) {
  const enterMotion = useEnterMotion();
  // NGOẠI LỆ (mang bố cục) — bề dài thanh CHÍNH LÀ tiến độ xây, đi qua `useSnapMotion`.
  const barMotion = useSnapMotion({
    animate: { width: `${item.total === null ? 0 : item.pct}%` },
    transition: { duration: 0.45, ease: 'easeOut' },
  });
  // Huỷ là mất tiến độ ⇒ hai chạm, không hộp thoại: chạm một hỏi lại ngay tại chỗ, 3 giây sau tự
  // quay về. Một hộp thoại cho một nút phụ là quá nặng; một chạm là quá nhẹ.
  const [arming, setArming] = useState(false);
  const arm = () => {
    if (arming) { onCancel(item.bpId); setArming(false); return; }
    setArming(true);
    window.setTimeout(() => setArming(false), 3000);
  };
  const progressText = item.total === null ? `còn ${item.remaining} phiên` : `${item.done}/${item.total} phiên`;
  return (
    <motion.div {...enterMotion} className="px-4 py-3" style={CARD}>
      <div className="flex items-center gap-3">
        <Glyph icon={item.icon} label={item.label} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[14px] font-semibold leading-tight" style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' }}>
              {item.label}
            </p>
            {item.restoration && (
              <span className="mono text-[9px] uppercase tracking-[0.16em]" style={{ color: 'var(--muted-2)' }}>di sản</span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--timer-track)' }}>
              <motion.div className="h-full rounded-full" style={{ background: 'var(--accent)' }} {...barMotion} />
            </div>
            <span className="mono shrink-0 text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>{progressText}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={arm}
          className="mono shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={arming
            ? { background: 'var(--accent)', color: 'var(--canvas)', border: '1px solid var(--accent)' }
            : { color: 'var(--muted-2)', border: '1px solid var(--line)' }}
        >
          {arming ? 'Huỷ thật?' : 'huỷ'}
        </button>
      </div>
    </motion.div>
  );
}

// ─── 2. Lựa chọn ─────────────────────────────────────────────────────────────

function ChoiceCard({ project, canStart, blockedText, actionLabel, onStart, delay = 0, restoration = false }) {
  const enterMotion = useEnterMotion();
  const pressMotion = usePressMotion();
  return (
    <motion.div {...withDelay(enterMotion, delay)} className="px-4 py-3.5" style={CARD}>
      <div className="flex items-start gap-3">
        <Glyph icon={project.icon} label={project.label} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-[15px] font-semibold leading-tight" style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' }}>
              {project.label}
            </p>
            <span className="mono text-[11px] tabular-nums" style={{ color: 'var(--accent2)' }}>{project.sessions} phiên</span>
          </div>
          <p className="mt-1 text-[12.5px] leading-snug" style={{ color: 'var(--muted)' }}>
            {restoration
              ? `Xong sẽ đứng trong bảo tàng kỷ ${project.era} — không có đặc quyền, nhưng đưa kỷ ấy tới gần dấu ★.`
              : projectPerkLine(project)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        {canStart ? (
          <motion.button
            type="button"
            {...pressMotion}
            onClick={() => onStart(project.bpId)}
            className="mono whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: 'var(--ink)', color: 'var(--canvas)', border: '1px solid var(--ink)', boxShadow: 'var(--skin-card-shadow)' }}
          >
            {actionLabel}
          </motion.button>
        ) : (
          <span className="mono text-[11px]" style={{ color: 'var(--muted-2)' }}>{blockedText}</span>
        )}
      </div>
    </motion.div>
  );
}

// ─── 3. Đã xây ───────────────────────────────────────────────────────────────

function BuiltStrip({ tiles, pickedId, onPick }) {
  if (!tiles.length) return null;
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {tiles.map((t) => {
        const chon = t.bpId === pickedId;
        return (
          <button
            key={t.bpId}
            type="button"
            onClick={() => onPick(chon ? null : t.bpId)}
            aria-pressed={chon}
            className="flex min-w-0 flex-col items-center gap-1 px-1.5 py-2.5 transition-transform active:scale-95"
            style={{
              background: 'var(--card-bg-solid)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--skin-radius-card,18px)',
              outline: chon ? '2px solid var(--ink)' : 'none',
              outlineOffset: 2,
            }}
          >
            <span className={hasGlyphIcon(t.icon) ? 'text-[20px] leading-none' : 'mono text-[9px] uppercase tracking-[0.14em]'} aria-hidden="true">
              {getGlyph(t.icon, t.label, 'BP')}
            </span>
            <span className="text-center text-[10.5px] font-semibold leading-[1.15]" style={{ color: 'var(--ink)' }}>{t.label}</span>
            {/* Dòng phụ là ĐẶC QUYỀN (thứ công trình làm cho phiên), không phải "Lv.2 · ×1.75": cấp công
                trình không còn đường nâng sau ADR-069, nên một nhãn cấp chỉ mời một câu hỏi không có
                câu trả lời ("lên cấp ở đâu?"). */}
            {t.perk?.label && (
              <span className="max-w-full text-center text-[9.5px] leading-tight" style={{ color: 'var(--muted)' }}>{t.perk.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Màn ─────────────────────────────────────────────────────────────────────

export default function BuildScreen() {
  const activeBook = useGameStore((s) => s.progress.activeBook);
  const buildings = useGameStore((s) => s.buildings);
  const craftingQueue = useGameStore((s) => s.craftingQueue ?? []);
  const buildingLevels = useGameStore((s) => s.buildingLevels ?? {});
  const cityArchive = useGameStore((s) => s.cityArchive);
  const startProject = useGameStore((s) => s.startProject);
  const cancelCrafting = useGameStore((s) => s.cancelCrafting);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';

  const [showAll, setShowAll] = useState(false);
  const [pickedBuilt, setPickedBuilt] = useState(null);

  const queue = describeQueue({ craftingQueue, activeBook });
  const activeQueue = queue.filter((q) => !q.restoration);
  const slots = slotState({ craftingQueue, activeBook });
  const legacySlots = legacySlotState({ craftingQueue, activeBook });
  const choices = listNextProjects({ activeBook, buildings, craftingQueue });
  const progress = eraBuildProgress({ activeBook, buildings });
  const restoration = listRestorationChoices({ activeBook, cityArchive, craftingQueue });

  const first = activeQueue[0] ?? null;
  const hero = heroCongTrinh({
    dangXay: first && first.remaining > 0 ? { ten: first.label, con: first.remaining, tong: first.total ?? first.remaining } : null,
    daXay: progress.built,
    tongBanVe: progress.total,
    chonDuoc: slots.free > 0 ? choices.length : 0,
    hangChoDay: slots.free <= 0,
  });

  const handleStart = (bpId) => {
    if (startProject(bpId)) soundEngine.playSkillUnlock();
  };

  const builtTiles = buildings
    .filter((bpId) => describeProject(bpId)?.era === activeBook)
    .map((bpId) => {
      const level = buildingLevels[bpId] ?? 1;
      return { ...describeProject(bpId), level, mult: getBuildingLevelMultiplier(level) };
    });
  const pickedTile = builtTiles.find((t) => t.bpId === pickedBuilt) ?? null;

  const openChoices = showAll ? choices : choices.slice(0, CHOICES_OPEN);
  const hidden = choices.length - openChoices.length;
  const canStartMore = slots.free > 0;
  const blockedText = first ? `chờ «${first.label}» xong` : 'hàng chờ đầy';

  return (
    <div className="space-y-5">
      <InventoryHero hero={hero} icon="🏗" />

      {queue.length > 0 && (
        <div className="space-y-2">
          {/* "Hàng chờ", không lặp lại nhãn "Đang xây" mà dải mở đầu vừa nói cách đó vài dòng — cùng luật
              "hai chỗ nói cùng một chuyện thì chỗ nói ít hơn phải nhường". Cái hàng này nói được thứ dải
              mở đầu không nói: SỐ Ô (mẫu số của cái giá duy nhất còn lại) và nút huỷ. */}
          <SectionHead title="Hàng chờ" meta={`${slots.used}/${slots.total} ô`} />
          {queue.map((item) => <QueueRow key={item.bpId} item={item} onCancel={cancelCrafting} />)}
        </div>
      )}

      {/*
        ⚠️ MỤC NÀY CHỈ HIỆN KHI CÒN GÌ ĐỂ CHỌN. Bản đầu vẫn dựng nó khi `choices` rỗng, kèm một thẻ
        giải thích ("mọi bản vẽ đều đang trong hàng chờ" / "kỷ này đã xây trọn") — nhưng cả hai câu
        ấy dải mở đầu đã nói rồi (số phiên còn lại của công trình kế, hoặc ★ trọn vẹn). Một mục
        rỗng đứng đó chỉ để giải thích vì sao nó rỗng là thứ tồn tại vì đã được code.
      */}
      {choices.length > 0 && (
      <div className="space-y-2">
        <SectionHead title="Xây tiếp" meta={`${slots.free} ô trống`} />
          <>
            {!canStartMore && (
              <p className="text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
                Hàng chờ đã dùng hết {slots.total} ô — xong một công trình là chọn được cái tiếp theo.
              </p>
            )}
            {openChoices.map((project, i) => (
              <ChoiceCard
                key={project.bpId}
                project={project}
                delay={i * 0.05}
                canStart={canStartMore}
                blockedText={blockedText}
                actionLabel="Khởi công"
                onStart={handleStart}
              />
            ))}
            {(hidden > 0 || showAll) && choices.length > CHOICES_OPEN && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mono w-full py-2 text-[11px] uppercase tracking-[0.16em]"
                style={{ color: 'var(--muted-2)' }}
              >
                {showAll ? 'Thu gọn ▴' : `Còn ${hidden} công trình khác ▾`}
              </button>
            )}
          </>
      </div>
      )}

      {builtTiles.length > 0 && (
        <div className="space-y-2">
          <SectionHead title="Đã xây" meta={`${progress.built}/${progress.total}`} />
          <BuiltStrip tiles={builtTiles} pickedId={pickedBuilt} onPick={setPickedBuilt} />
          {pickedTile && (
            <div className="px-4 py-3.5" style={{ ...CARD, boxShadow: 'none', background: 'var(--card-bg-solid2, var(--card-bg-solid))' }}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-[15px] font-semibold leading-tight" style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' }}>
                  {pickedTile.label}
                </p>
              </div>
              <PerkSummary perk={pickedTile.perk} lightTheme={lightTheme} variant="skin" />
              {!pickedTile.perk && (
                <p className="mt-1 text-[12.5px]" style={{ color: 'var(--muted)' }}>{pickedTile.description}</p>
              )}
            </div>
          )}
        </div>
      )}

      {restoration.total > 0 && (
        <div className="space-y-2">
          <SectionHead title="Trùng tu di sản" meta={restoration.total} />
          <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Công trình của kỷ đã qua. Xong thì đứng trong <strong>bảo tàng</strong> của kỷ đó — không thêm
            đặc quyền, nhưng đưa kỷ ấy tới gần dấu ★ trọn vẹn. Có một ô riêng, không lấn ô xây của kỷ này.
          </p>
          {restoration.choices.map((project, i) => (
            <ChoiceCard
              key={project.bpId}
              project={project}
              delay={i * 0.05}
              restoration
              canStart={legacySlots.free > 0}
              blockedText="đang trùng tu một cái rồi"
              actionLabel="Trùng tu"
              onStart={handleStart}
            />
          ))}
          {restoration.total > restoration.choices.length && (
            <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
              Còn {restoration.total - restoration.choices.length} công trình nữa ở các kỷ khác — xếp kỷ gần trọn vẹn nhất lên trước.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
