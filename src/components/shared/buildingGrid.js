/**
 * buildingGrid.js — LUẬT của lưới công trình đã xây. File này KHÔNG vẽ gì (xem `BuildingGrid.jsx`).
 *
 * ⚠️ VÌ SAO ĐỔI TỪ THẺ DỌC SANG LƯỚI (2026-09-02). Tab "Công trình" đo được **4.757px ở khung
 * 390px — 5,6 màn hình điện thoại**, và mỗi công trình ĐÃ XÂY chiếm một thẻ ngang mang trọn phần
 * mô tả đặc quyền. Nhưng đúng phần mô tả ấy còn được in LẦN NỮA ở khung chi tiết bản vẽ ngay bên
 * dưới trong cùng một trang. Hai chỗ nói cùng một chuyện thì chỗ nói ít hơn phải nhường — và ở
 * đây chỗ nói ít hơn là cái thẻ, vì thứ người chơi hỏi khi lướt danh sách công trình là *"tôi đã
 * xây gì, cái nào nâng cấp được"*, không phải *"cái này cộng bao nhiêu phần trăm"*.
 *
 * ⚠️ BA TRẠNG THÁI, KHÔNG PHẢI HAI. `MAX` (hết cấp) khác `SHORT` (còn cấp nhưng thiếu tài nguyên):
 * gộp lại thì một công trình đã trọn vẹn và một công trình đang thiếu đồ trông y hệt nhau, mà hai
 * ca ấy cần hai hành động ngược nhau (mừng · đi kiếm tài nguyên). Chỉ `READY` mang màu nhấn.
 */

export const BUILDING_LEVEL_MAX = 3;

export const BUILDING_STATE = {
  READY: 'READY', // còn cấp + đủ tài nguyên ⇒ nâng được NGAY
  SHORT: 'SHORT', // còn cấp nhưng thiếu tài nguyên
  MAX: 'MAX',     // đã kịch cấp
};

/**
 * @param {object} p
 * @param {number} p.level      cấp hiện tại (1…3)
 * @param {number} p.refinedT2  số tài nguyên tinh luyện đang có
 * @param {number} p.upgradeCost giá nâng cấp kế tiếp
 */
export function buildingState({ level = 1, refinedT2 = 0, upgradeCost = 0 }) {
  if (level >= BUILDING_LEVEL_MAX) return BUILDING_STATE.MAX;
  return refinedT2 >= upgradeCost ? BUILDING_STATE.READY : BUILDING_STATE.SHORT;
}

/** Đếm theo trạng thái — con số dẫn dắt dòng phụ đề của cả khối. */
export function summarizeBuildings(tiles = []) {
  return {
    total: tiles.length,
    nangDuoc: tiles.filter((t) => t.state === BUILDING_STATE.READY).length,
    kichCap: tiles.filter((t) => t.state === BUILDING_STATE.MAX).length,
  };
}

/**
 * Ô nên chọn sẵn: công trình nâng được ngay (cấp THẤP nhất trước — nâng cái non nhất lợi hơn);
 * không có thì ô đầu tiên. Tất định để ảnh chụp không nhấp nháy.
 */
export function pickDefaultBuilding(tiles = []) {
  if (!tiles.length) return null;
  const san = tiles.filter((t) => t.state === BUILDING_STATE.READY);
  if (san.length) return san.reduce((a, b) => (b.level < a.level ? b : a));
  return tiles[0];
}
