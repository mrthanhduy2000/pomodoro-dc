/**
 * ResourceDisplay.jsx — thanh tài nguyên: BA con số cộng MỘT thanh tiến độ, hết.
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ VÌ SAO PHẢI RÚT GỌN (Đàm, 2026-08-27): bản cũ bày cùng lúc EP · chặng · tài nguyên thô
 * theo kỷ · tài nguyên tinh chế · RP · tinh thể, **tất cả cùng một trọng lượng thị giác**.
 * Khi mọi thứ đều được nhấn thì không thứ nào được nhấn — mắt không biết đọc cái gì trước,
 * nên thanh này thật ra không nói được điều gì. Đây là cùng một họ với bài học đã ghi ở
 * `CLAUDE.md`: *"một con số không có mẫu số thì không phải mục tiêu"* — ở đây là vế còn lại:
 * **một màn hình không có thứ tự đọc thì không phải một bảng điều khiển.**
 *
 * BA THỨ LUÔN HIỆN, theo đúng thứ tự này (và KHÔNG được thêm thứ tư vào đây):
 *   1. Thanh tiến độ kỷ — chiếm TRỌN chiều ngang, nhãn `Kỷ N · chặng i/n`.
 *   2. Chuỗi ngày.
 *   3. Tinh thể.
 * Mọi thứ còn lại (tài nguyên thô · tinh chế · RP · tên giai đoạn · khoảng EP của chặng)
 * nằm sau nút **Kho**. ⚠️ ĐỔI CHỖ, KHÔNG XOÁ: không một con số nào biến mất khỏi app —
 * bấm "Kho" là thấy đầy đủ y như trước.
 *
 * BA LUẬT TRÌNH BÀY nằm ở `resourceDisplayFormat.js` (file `.js` thuần, vì `node --test`
 * không biên dịch JSX ⇒ luật để trong file này thì không bài test nào chạm tới được):
 *   • `NUMBER_STYLE`  — mọi con số dùng `font-variant-numeric: tabular-nums`, để cột số
 *     không nhảy ngang mỗi lần chữ số đổi (`1` hẹp hơn `8` ở font tỉ lệ).
 *   • `labelSizeFor()` — nhãn/đơn vị nhỏ hơn con số **40%** và mang màu `var(--muted)`.
 *     Đây là thứ quyết định "con số được đọc trước": cùng một hàng, cái to và đậm thắng.
 *   • `shouldFlashOnIncrease()` — số TĂNG thì nháy `var(--good)` trong `FLASH_MS`.
 *
 * ⚠️ `useReducedMotion`: bật giảm chuyển động thì màu vẫn đổi (thông tin không được mất)
 * nhưng đổi **tức thì** — không có tween. Kỹ thuật: tắt `transition` ở nhánh reduceMotion.
 * Lúc BẮT ĐẦU nháy cũng luôn tắt `transition`, kể cả khi cho phép hoạt hoạ — nếu không thì
 * màu xanh *phai dần vào* thay vì *nháy*, tức mất đúng cái tín hiệu đang muốn gửi.
 */
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import { ERA_METADATA, ERA_REFINED, normalizeRefinedBag } from '../engine/constants';
import {
  FLASH_MS,
  NUMBER_STYLE,
  formatEraStageLabel,
  labelSizeFor,
  shouldFlashOnIncrease,
} from './resourceDisplayFormat';

function getCurrentStage(eraMeta, totalEP) {
  if (!eraMeta?.stages?.length) return null;

  for (let index = eraMeta.stages.length - 1; index >= 0; index -= 1) {
    if (totalEP >= eraMeta.stages[index].epStart) {
      return {
        ...eraMeta.stages[index],
        index,
        totalStages: eraMeta.stages.length,
      };
    }
  }

  return {
    ...eraMeta.stages[0],
    index: 0,
    totalStages: eraMeta.stages.length,
  };
}

/**
 * Trả về `true` trong `FLASH_MS` sau mỗi lần `value` TĂNG.
 *
 * ⚠️ Phép đối chiếu cũ↔mới làm NGAY TRONG LÚC DỰNG, không làm trong `useEffect` — đây là khuôn
 * "điều chỉnh state khi prop đổi" mà React khuyến nghị. Bản đầu của hàm này gọi `setFlashing`
 * thẳng trong thân effect và `react-hooks/set-state-in-effect` bắt được: nó đẻ ra một lượt dựng
 * THỪA, và cú nháy trễ đúng một khung hình so với lúc con số đổi — tức đúng thứ nó sinh ra để
 * chỉ ra lại là thứ nó chỉ trễ.
 *
 * ⚠️ Đếm bằng THẺ (`flashToken`) chứ không bằng cờ `true/false`: nếu con số tăng lần nữa khi
 * đang nháy dở thì `setFlashing(true)` là một phép gán TRÙNG GIÁ TRỊ ⇒ React bỏ qua ⇒ effect
 * không chạy lại ⇒ đồng hồ 400ms vẫn tính từ lần tăng ĐẦU. Mỗi lần tăng bump thẻ lên một nấc
 * thì effect chạy lại, dọn đồng hồ cũ và mở đồng hồ mới — 400ms luôn tính từ lần tăng MỚI NHẤT.
 */
function useIncreaseFlash(value) {
  const [previous, setPrevious] = useState(value);
  const [flashToken, setFlashToken] = useState(0);   // 0 = không nháy

  if (!Object.is(previous, value)) {
    setPrevious(value);
    if (shouldFlashOnIncrease(previous, value)) setFlashToken((token) => token + 1);
    else setFlashToken(0);
  }

  useEffect(() => {
    if (flashToken === 0) return undefined;
    const timer = setTimeout(() => setFlashToken(0), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flashToken]);

  return flashToken > 0;
}

/** Con số: tabular-nums + nháy `--good` khi tăng. Mọi con số của file này đi qua đây. */
function FlashNumber({ value, size, format }) {
  const reduceMotion = useReducedMotion();
  const flashing = useIncreaseFlash(value);

  return (
    <span
      className="font-semibold leading-none"
      style={{
        ...NUMBER_STYLE,
        fontSize: `${size}px`,
        fontFamily: 'var(--skin-font-display)',
        color: flashing ? 'var(--good)' : 'var(--ink)',
        // Nháy thì vào TỨC THÌ (fade-in sẽ nuốt mất cú nháy); chỉ đường VỀ mới được mượt,
        // và cũng chỉ khi Đàm không bật giảm chuyển động.
        transition: reduceMotion || flashing ? 'none' : 'color 260ms ease-out',
      }}
    >
      {format ? format(value) : value.toLocaleString()}
    </span>
  );
}

/** Ô số ở thanh trên cùng: SỐ trước (to, đậm), nhãn sau (nhỏ hơn 40%, `--muted`). */
function TopStat({ value, label, size, format, title }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5" title={title}>
      <FlashNumber value={value} size={size} format={format} />
      <span
        className="truncate leading-none"
        style={{ ...NUMBER_STYLE, fontSize: `${labelSizeFor(size)}px`, color: 'var(--muted)' }}
      >
        {label}
      </span>
    </div>
  );
}

const KHO_NUMBER_PX = 16;

/** Một dòng trong panel Kho: nhãn trái, số phải. Cùng luật cỡ chữ, cùng luật nháy. */
function KhoRow({ label, value, format }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div
        className="mono min-w-0 truncate uppercase tracking-[0.14em]"
        style={{ fontSize: `${labelSizeFor(KHO_NUMBER_PX)}px`, color: 'var(--muted)' }}
      >
        {label}
      </div>
      <FlashNumber value={value} size={KHO_NUMBER_PX} format={format} />
    </div>
  );
}

export default function ResourceDisplay() {
  const activeBook = useGameStore((s) => s.progress.activeBook);
  const allResources = useGameStore((s) => s.resources);
  const totalEP = useGameStore((s) => s.progress.totalEP);
  const researchRP = useGameStore((s) => s.research?.rp ?? 0);
  const tinhThe = useGameStore((s) => s.tinhThe);
  const resourcesRefined = useGameStore((s) => s.resourcesRefined);
  const currentStreak = useGameStore((s) => s.streak?.currentStreak ?? 0);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const reduceMotion = useReducedMotion();
  const [khoOpen, setKhoOpen] = useState(false);

  const lightTheme = uiTheme === 'light';
  const bookKey = `book${activeBook}`;
  const eraMeta = ERA_METADATA[activeBook] ?? ERA_METADATA[1];
  const stage = getCurrentStage(eraMeta, totalEP);
  const stageStart = stage?.epStart ?? 0;
  const stageEnd = stage?.epEnd ?? stageStart;
  const stageRange = Math.max(1, stageEnd - stageStart);
  const stageXP = Math.max(0, totalEP - stageStart);
  const stagePct = Math.max(0, Math.min(100, (stageXP / stageRange) * 100));
  const refined = ERA_REFINED[activeBook] ?? ERA_REFINED[1];
  const refinedBag = normalizeRefinedBag(resourcesRefined?.[activeBook]);
  const resourceEntries = (eraMeta.resources ?? []).map((def) => ({
    id: def.id,
    label: def.label,
    value: allResources[bookKey]?.[def.id] ?? 0,
  }));

  return (
    <section
      className="px-5 py-5"
      style={{
        background: 'var(--card-bg-solid)',
        border: 'var(--skin-card-border-width, 1px) solid var(--line)',
        borderRadius: 'var(--skin-radius-card, 18px)',
        boxShadow: lightTheme
          ? 'var(--skin-card-shadow, 0 10px 22px rgba(31, 30, 29, 0.04))'
          : 'var(--skin-card-shadow, 0 12px 28px rgba(0, 0, 0, 0.14))',
      }}
    >
      {/* ── 1. THANH TIẾN ĐỘ KỶ — chiếm trọn chiều ngang, là thứ đọc trước tiên ───────── */}
      <div className="flex items-baseline justify-between gap-3">
        <div
          className="mono min-w-0 truncate uppercase tracking-[0.16em]"
          style={{ fontSize: `${labelSizeFor(18)}px`, color: 'var(--muted)', ...NUMBER_STYLE }}
        >
          {formatEraStageLabel(activeBook, stage)}
        </div>
        <button
          type="button"
          onClick={() => setKhoOpen((open) => !open)}
          aria-expanded={khoOpen}
          aria-controls="kho-panel"
          className="mono shrink-0 px-2.5 py-1 uppercase tracking-[0.16em]"
          style={{
            fontSize: `${labelSizeFor(18)}px`,
            color: 'var(--accent2)',
            background: 'rgba(var(--accent-rgb), 0.1)',
            borderRadius: 'var(--skin-radius-control, 14px)',
          }}
        >
          Kho {khoOpen ? '▴' : '▾'}
        </button>
      </div>

      <div className="mt-1.5">
        <TopStat
          value={stageXP}
          size={18}
          label={`/ ${stageRange.toLocaleString()} EP`}
          title={`Chặng hiện tại: ${stage?.label ?? eraMeta.label}`}
        />
      </div>

      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--line)' }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={reduceMotion ? false : { width: 0 }}
          animate={reduceMotion ? undefined : { width: `${stagePct}%` }}
          transition={reduceMotion ? undefined : { duration: 0.45, ease: 'easeOut' }}
          style={{
            width: reduceMotion ? `${stagePct}%` : undefined,
            background: 'var(--accent)',
          }}
        />
      </div>

      {/* ── 2 & 3. CHUỖI · TINH THỂ — hai con số còn lại, hết. ───────────────────────── */}
      <div className="mt-4 flex items-baseline gap-6">
        <TopStat value={currentStreak} size={24} label="chuỗi" title="Số ngày liên tiếp có phiên hoàn thành" />
        <TopStat value={tinhThe ?? 0} size={24} label="tinh thể" title={`Tinh thể: ${tinhThe ?? 0} / 12 (tồn kho tối đa)`} />
      </div>

      {/* ── KHO — mọi thứ còn lại, đầy đủ y như trước, chỉ là không tranh chỗ nữa. ───── */}
      {khoOpen && (
        <div id="kho-panel" className="mt-4 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <div
            className="mono uppercase tracking-[0.2em]"
            style={{ fontSize: `${labelSizeFor(KHO_NUMBER_PX)}px`, color: 'var(--muted-2)' }}
          >
            Giai đoạn hiện tại
          </div>
          <div className="mt-1 text-[13px] leading-snug" style={{ color: 'var(--ink)' }}>
            {stage?.label ?? eraMeta.label}
            <span style={{ color: 'var(--muted)' }}> · {eraMeta.label}</span>
          </div>
          {/* ⚠️ Khoảng EP là một RANH GIỚI CỐ ĐỊNH của chặng, KHÔNG phải một số dư đếm được — nên
              nó KHÔNG đi qua <KhoRow>/<FlashNumber>. Bản đầu cho nó vào KhoRow và hỏng hai đường:
              nó chiếm cỡ chữ của một con số đầu bảng (át cả panel, còn xén mất nhãn của chính nó),
              và nó sẽ nháy `--good` mỗi lần Đàm sang kỷ khác — một lời khen cho việc chẳng ai làm. */}
          <div
            className="mt-1"
            style={{ ...NUMBER_STYLE, fontSize: `${labelSizeFor(KHO_NUMBER_PX)}px`, color: 'var(--muted)' }}
          >
            Khoảng EP của chặng: {stageStart.toLocaleString()} → {stageEnd.toLocaleString()}
          </div>

          <div
            className="mono mt-2 border-t pt-3 uppercase tracking-[0.2em]"
            style={{
              fontSize: `${labelSizeFor(KHO_NUMBER_PX)}px`,
              color: 'var(--muted-2)',
              borderColor: 'var(--line)',
            }}
          >
            Tài nguyên trong kỷ
          </div>
          <div className="mt-0.5 divide-y" style={{ borderColor: 'var(--line)' }}>
            {resourceEntries.map((entry) => (
              <KhoRow key={entry.id} label={entry.label} value={entry.value} />
            ))}
            <KhoRow label={refined.t2Label} value={refinedBag.t2} />
            <KhoRow label="RP nghiên cứu" value={researchRP} />
          </div>
        </div>
      )}
    </section>
  );
}
