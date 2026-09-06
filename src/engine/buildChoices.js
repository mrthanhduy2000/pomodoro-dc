/**
 * buildChoices.js — LUẬT THUẦN của màn Công trình sau ADR-069: *"đồng tiền duy nhất là PHIÊN"*.
 *
 * VÌ SAO CÓ (2026-09-06). Trước vòng này, để một công trình mọc lên Đàm phải đi qua BA cổng và BỐN
 * loại tiền: đủ RP để "nghiên cứu" → đủ nguyên liệu thô + tinh luyện để "khởi công" → còn ô hàng
 * chờ → rồi mới tới thứ duy nhất có nghĩa: N phiên tập trung. Đo trên tài khoản thật: RP dư 8,5 lần
 * giá nghiên cứu, nguyên liệu dư 14 lần (`TECH_DEBT #95`) — tức ba cổng đầu **không bao giờ đóng**,
 * chúng chỉ tồn tại để được bấm qua. Một cổng luôn mở là một cái nút thừa, và ba cái nút thừa
 * cộng hai bảng giá là lý do tab Công trình dài 2.376px ở khung 390px.
 *
 * LUẬT MỚI, gói trong một câu: **chọn một công trình → làm N phiên → nó mọc lên.** Cái giá là THỜI
 * GIAN (N phiên) và CƠ HỘI (chỉ `CRAFT_QUEUE_SLOTS` ô cùng lúc — chọn cái này thì cái kia phải đợi).
 * Đó là hai thứ người chơi hiểu ngay mà không cần đọc bảng.
 *
 * ⚠️ KHÔNG ĐỤNG THÀNH PHỐ. File này chỉ trả lời *"chọn được gì, đang xây gì"*; thứ đi vào
 * `craftingQueue`/`buildings` vẫn đúng hình dạng cũ, nên tầng thành phố (giàn giáo, công trình đã
 * xây, bảo tàng) không biết có thay đổi nào.
 *
 * THUẦN: không đọc store, không đọc đồng hồ, không DOM — `buildChoices.test.js` chấm được.
 */
import {
  BLUEPRINT_CATALOG,
  BLUEPRINT_META,
  BUILDING_EFFECTS,
  CRAFT_QUEUE_SLOTS,
  LEGACY_QUEUE_SLOTS,
} from './constants.js';
import {
  blueprintEraOf,
  countActiveCrafting,
  countLegacyCrafting,
  listRestorableBlueprints,
} from './eraLegacy.js';
import { describeCraftProgress } from './craftProgress.js';

/** Thứ tự gợi ý: rẻ phiên trước — phổ thông (4 phiên) rồi hiếm rồi sử thi (kỳ quan). */
const RARITY_ORDER = { common: 0, rare: 1, epic: 2 };

const CATALOG_LOOKUP = Object.fromEntries(
  Object.entries(BLUEPRINT_CATALOG).flatMap(([era, items]) => items.map((bp) => [bp.id, { ...bp, era: Number(era) }])),
);

/** Bản vẽ của một kỷ, đúng thứ tự catalog. */
export function eraBlueprints(era) {
  return BLUEPRINT_CATALOG[era] ?? [];
}

/**
 * Mô tả MỘT công trình cho màn hình — tên, biểu tượng, số phiên, đặc quyền.
 * ⚠️ `sessions` đọc từ `BLUEPRINT_META` (nguồn của `startCrafting`/`startProject`), không từ
 * `BUILDING_EFFECTS` — hai bảng đang khớp nhau, nhưng thứ đi vào hàng chờ là bảng META.
 */
export function describeProject(bpId) {
  const def = CATALOG_LOOKUP[bpId] ?? null;
  const meta = BLUEPRINT_META[bpId] ?? null;
  const eff = BUILDING_EFFECTS[bpId] ?? null;
  if (!def && !meta) return null;
  const sessions = Number.isFinite(meta?.sessionsToComplete) && meta.sessionsToComplete > 0
    ? Math.floor(meta.sessionsToComplete)
    : Math.max(1, Math.floor(eff?.sessionsToComplete ?? 1));
  return {
    bpId,
    era: def?.era ?? meta?.era ?? null,
    label: def?.label ?? BLUEPRINT_META[bpId]?.label ?? bpId,
    icon: def?.icon ?? '',
    description: def?.description ?? '',
    rarity: def?.rarity ?? meta?.rarity ?? 'common',
    type: meta?.type ?? eff?.type ?? null,
    sessions,
    perk: eff?.perk ?? null,
  };
}

/**
 * Những công trình CHỌN ĐƯỢC ở kỷ đang chơi: chưa xây, chưa nằm trong hàng chờ.
 * Không hỏi RP, không hỏi nguyên liệu — ADR-069.
 */
export function listNextProjects({ activeBook = 1, buildings = [], craftingQueue = [] } = {}) {
  const built = new Set(Array.isArray(buildings) ? buildings : []);
  const queued = new Set((Array.isArray(craftingQueue) ? craftingQueue : []).map((q) => q?.bpId).filter(Boolean));
  return eraBlueprints(activeBook)
    .filter((bp) => !built.has(bp.id) && !queued.has(bp.id))
    .map((bp) => describeProject(bp.id))
    .filter(Boolean)
    .sort((a, b) => (
      (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9)
    ) || (a.sessions - b.sessions));
}

/** Ô hàng chờ của kỷ đang chơi (di sản có ô riêng, không tính vào đây). */
export function slotState({ craftingQueue = [], activeBook = 1 } = {}) {
  const used = countActiveCrafting(craftingQueue, activeBook);
  const total = CRAFT_QUEUE_SLOTS;
  return { used, total, free: Math.max(0, total - used) };
}

/** Ô trùng tu di sản (kỷ đã đóng). */
export function legacySlotState({ craftingQueue = [], activeBook = 1 } = {}) {
  const used = countLegacyCrafting(craftingQueue, activeBook);
  const total = LEGACY_QUEUE_SLOTS;
  return { used, total, free: Math.max(0, total - used) };
}

/**
 * Hàng chờ đang xây, kèm tiến độ — ĐỌC QUA `describeCraftProgress`, cùng công thức mà mọi thanh
 * tiến độ xây khác dùng (một luật một công thức).
 */
export function describeQueue({ craftingQueue = [], activeBook = 1 } = {}) {
  return (Array.isArray(craftingQueue) ? craftingQueue : [])
    .map((item) => {
      const project = describeProject(item?.bpId);
      if (!project) return null;
      const progress = describeCraftProgress(item.bpId, item.sessionsRemaining);
      const era = blueprintEraOf(item.bpId);
      return {
        ...project,
        ...progress,
        restoration: Number.isFinite(era) && era !== activeBook,
      };
    })
    .filter(Boolean);
}

/** Kỷ này đã xây mấy trên mấy — mẫu số đếm từ catalog, KHÔNG viết cứng số 5. */
export function eraBuildProgress({ activeBook = 1, buildings = [] } = {}) {
  const all = eraBlueprints(activeBook);
  const ids = new Set(all.map((bp) => bp.id));
  const built = (Array.isArray(buildings) ? buildings : []).filter((id) => ids.has(id)).length;
  return { built, total: all.length, complete: all.length > 0 && built >= all.length };
}

/**
 * Trùng tu di sản (ADR-012): công trình của kỷ ĐÃ ĐÓNG mà bảo tàng còn thiếu. Xếp kỷ gần trọn
 * vẹn nhất lên đầu, cắt còn `limit` — cùng luật đã có ở màn Xưởng cũ.
 */
export function listRestorationChoices({ activeBook = 1, cityArchive = {}, craftingQueue = [], limit = 6 } = {}) {
  const restorables = listRestorableBlueprints({ activeBook, cityArchive, queue: craftingQueue });
  const remainingByEra = restorables.reduce((acc, bp) => {
    acc[bp.era] = (acc[bp.era] ?? 0) + 1;
    return acc;
  }, {});
  const sorted = [...restorables]
    .sort((a, b) => (remainingByEra[a.era] - remainingByEra[b.era]) || (a.era - b.era))
    .map((bp) => describeProject(bp.bpId))
    .filter(Boolean);
  return { choices: sorted.slice(0, limit), total: sorted.length };
}

/**
 * Một dòng nói công trình này CHO GÌ — thứ đứng cạnh nút "Khởi công". Đặc quyền có tên riêng thì
 * dùng tên ấy; không có thì rơi về mô tả bản vẽ (chuyện kể), vì một thẻ trống còn tệ hơn một câu
 * chuyện.
 */
export function projectPerkLine(project) {
  const perk = project?.perk;
  if (perk?.label) return perk.summary ? `${perk.label} — ${perk.summary}` : perk.label;
  return project?.description ?? '';
}
