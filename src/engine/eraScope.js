/**
 * eraScope.js — Era-scoped blueprint state: which blueprint belongs to which era, and pruning/sealing that state when an era ends. Moved verbatim out of gameStore.js (ADR-078).
 *
 * Comments inside are the originals (Vietnamese where they were written so); the rules they
 * explain have not changed by moving. Pure: no store, no DOM.
 */
import { isRecord } from '../lib/isRecord';

import { mergeCityArchive } from './cityArchive';
import { BLUEPRINT_META, BUILDING_EFFECTS } from './constants';
import { splitCraftingQueue } from './eraLegacy';

/** research: Điểm Nghiên Cứu + danh sách bản vẽ đã nghiên cứu */
export const makeDefaultResearch = () => ({
  rp: 0,
  researched: [],
});

export function normalizeStoredResearch(research = {}) {
  return {
    rp: Number.isFinite(research?.rp) ? research.rp : 0,
    researched: Array.isArray(research?.researched) ? [...research.researched] : [],
  };
}

export function getEraScopedBlueprintId(value) {
  if (typeof value === 'string') return value;
  if (isRecord(value) && typeof value.id === 'string') return value.id;
  return null;
}

export function getEraScopedBlueprintEra(bpId) {
  const era = BLUEPRINT_META[bpId]?.era ?? BUILDING_EFFECTS[bpId]?.era;
  return Number.isFinite(era) ? era : null;
}

export function isCurrentEraBlueprint(bpId, activeBook) {
  return !!bpId && getEraScopedBlueprintEra(bpId) === activeBook;
}

export function filterRecordByAllowedIds(record = {}, allowedIds = new Set()) {
  if (!isRecord(record)) return {};
  return Object.fromEntries(
    Object.entries(record).filter(([bpId]) => allowedIds.has(bpId)),
  );
}

/**
 * Cắt bỏ mọi thứ thuộc kỷ CŨ khỏi state đang chơi (luật cân bằng game — KHÔNG được đổi).
 *
 * @param {object} state
 * @param {number} activeBook
 * @param {{epAtSeal:number, sealedAt:string, sessionCount:number}|null} [sealContext]
 *        Có giá trị → công trình vừa bị cắt được GHI LẠI vào bảo tàng `cityArchive` trước khi mất.
 *        ⚠️ Mặc định `null` là CÓ CHỦ Ý: trong 5 chỗ gọi hàm này, chỉ ĐÚNG MỘT chỗ là "đường lên
 *        kỷ thật" (`completeFocusSession`) mới được niêm phong. Bốn chỗ còn lại (hydrate lúc nạp
 *        app, hoàn tác phiên, 2 nhánh dev/cheat) chạy đi chạy lại nhiều lần — niêm phong ở đó thì
 *        một lần nạp app lỗi có thể ghi bẩn vào bảo tàng.
 */
export function pruneEraScopedBlueprintState(state, activeBook, sealContext = null) {
  const currentBook = Number.isFinite(activeBook) ? activeBook : 1;
  const blueprints = Array.isArray(state.blueprints)
    ? state.blueprints.filter((blueprint) => isCurrentEraBlueprint(getEraScopedBlueprintId(blueprint), currentBook))
    : [];
  const research = normalizeStoredResearch(state.research);
  const researched = research.researched.filter((bpId) => isCurrentEraBlueprint(bpId, currentBook));
  // ⚠️ HÀNG ĐỢI XÂY DỰNG **KHÔNG** BỊ CẮT THEO KỶ (đổi 2026-08-13, Phase 4D — "di sản dang dở").
  // Trước đây dòng này lọc `isCurrentEraBlueprint`, nghĩa là một công trình đang xây tới phiên thứ
  // 8/11 sẽ biến mất KHÔNG MỘT LỜI BÁO đúng lúc Đàm lên kỷ. Nay nó được giữ lại và xây tiếp; khi
  // xong, nó vào BẢO TÀNG của kỷ nó thuộc về chứ không vào `buildings` — xem `engine/eraLegacy.js`.
  // Cân bằng game KHÔNG đổi vì `buildings` vẫn bị cắt theo kỷ y như cũ ngay bên dưới.
  //
  // ⚠️ THỨ TỰ `active` TRƯỚC, `legacy` SAU LÀ CÓ TẢI TRỌNG, không phải cho gọn mắt: đặc quyền
  // `craft_haste_first` (`advanceCraftingQueueWithPerks`) tăng tốc đúng **`index === 0`**. Xếp di
  // sản lên đầu thì một đặc quyền của kỷ HIỆN TẠI bị chuyển sang thúc một công trình chỉ có giá
  // trị lịch sử — tức cân bằng game đổi thật, đúng thứ tính năng này cam kết không đụng tới.
  // (Khi hàng đợi kỷ hiện tại RỖNG thì index 0 rơi vào di sản — chấp nhận, vì lúc đó đặc quyền
  // vốn không có gì để thúc, không ai mất gì cả.)
  const { active: activeQueue, legacy: legacyQueue } = splitCraftingQueue(state.craftingQueue, currentBook);
  const craftingQueue = [...activeQueue, ...legacyQueue];
  const buildings = Array.isArray(state.buildings)
    ? state.buildings.filter((bpId) => isCurrentEraBlueprint(bpId, currentBook))
    : [];
  const allowedBuildingIds = new Set(buildings);

  // ── BẢO TÀNG: chỉ GHI LẠI thứ vừa bị cắt, KHÔNG đổi một chút nào hành vi cắt ở trên ──────
  const removedBuildings = Array.isArray(state.buildings)
    ? state.buildings.filter((bpId) => !isCurrentEraBlueprint(bpId, currentBook))
    : [];
  const cityArchive = sealContext
    ? mergeCityArchive(state.cityArchive, removedBuildings, state.buildingLevels, sealContext)
    : (state.cityArchive ?? {});

  return {
    ...state,
    blueprints,
    research: { ...research, researched },
    craftingQueue,
    buildings,
    buildingHP: filterRecordByAllowedIds(state.buildingHP, allowedBuildingIds),
    buildingLastUsed: filterRecordByAllowedIds(state.buildingLastUsed, allowedBuildingIds),
    buildingLevels: filterRecordByAllowedIds(state.buildingLevels, allowedBuildingIds),
    cityArchive,
  };
}

/**
 * ⚠️ WHITELIST 7 KHOÁ — CỐ Ý **KHÔNG** chuyển tiếp `cityArchive`, đừng thêm vào cho "nhất quán".
 * Ba đường dùng hàm này (hoàn tác phiên, 2 nhánh dev/cheat) không bao giờ được ghi vào bảo tàng;
 * chính việc whitelist chặn `cityArchive` ở đây là lớp bảo vệ cuối cùng nếu ai đó lỡ truyền
 * `sealContext` vào nhầm chỗ.
 */
export function pickEraScopedBlueprintPatch(state, activeBook) {
  const scoped = pruneEraScopedBlueprintState(state, activeBook);
  return {
    blueprints: scoped.blueprints,
    research: scoped.research,
    craftingQueue: scoped.craftingQueue,
    buildings: scoped.buildings,
    buildingHP: scoped.buildingHP,
    buildingLastUsed: scoped.buildingLastUsed,
    buildingLevels: scoped.buildingLevels,
  };
}
