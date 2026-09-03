/**
 * wonderEffects.js — MỘT nguồn duy nhất cho hai câu hỏi về KỲ QUAN:
 *   1. công trình đang có bật những đặc quyền kỳ quan nào?
 *   2. bản vẽ này tốn bao nhiêu RP để nghiên cứu, SAU giảm giá kỳ quan?
 *
 * ⚠️ VÌ SAO TÁCH (2026-09-02). Cùng một luật từng có **BA** bản chép tay:
 *   · `gameStore.js` — bản CAI TRỊ, nó là bên TRỪ tiền thật.
 *   · `engine/opportunities.js` — dựng cái chuông và cái chấm.
 *   · `components/BlueprintInventory.jsx` — con số IN RA cho người chơi đọc.
 * Và bản thứ ba **đã lệch**: `getActiveWonderEffects` của nó gom `wonderEffect` từ **MỌI** công
 * trình, KHÔNG kiểm `type === 'wonder'`. Hôm nay nó vô hại chỉ vì trong 75 bản vẽ **không có** cái
 * nào vừa khai `wonderEffect` vừa không phải kỳ quan (đã đếm: 0). Tức nó **đúng nhờ một thứ chẳng
 * liên quan gì tới nó** — đúng hình dạng quả mìn mà dự án đã bị cắn nhiều lần: ngày nào có ai thêm
 * một dòng dữ liệu như thế, màn hình sẽ in ra một mức giá ĐÃ GIẢM mà cửa hàng không chấp nhận.
 * Nó cũng thiếu `Math.max(1, …)`/`Math.round` ⇒ giá 0 hoặc giá lẻ hiện khác giá bị trừ.
 */

import { BLUEPRINT_META, BUILDING_EFFECTS } from './constants.js';

/** Tập đặc quyền kỳ quan đang bật. ⚠️ CHỈ tính công trình khai `type === 'wonder'`. */
export function aggregateWonderEffects(buildings = []) {
  const effects = new Set();
  for (const bpId of buildings ?? []) {
    const eff = BUILDING_EFFECTS[bpId];
    if (eff?.type === 'wonder' && eff.wonderEffect) effects.add(eff.wonderEffect);
  }
  return effects;
}

/**
 * Giá RP THỰC của một bản vẽ. Đây là con số store TRỪ, nên nó cũng phải là con số màn hình IN và
 * là con số cái chuông SO SÁNH — cả ba đọc chung hàm này.
 * ⚠️ `Math.max(1, …)` ở cuối: một bản vẽ không bao giờ miễn phí, kể cả sau giảm giá.
 */
export function researchCostOf(buildings, bpId, baseCost) {
  const wonders = aggregateWonderEffects(buildings);
  const meta = BLUEPRINT_META[bpId];
  let cost = Math.max(0, Math.round(baseCost ?? 0));
  if (meta && wonders.has('t2_research_25off') && meta.era >= 6 && meta.era <= 10) {
    cost = Math.round(cost * 0.75);
  }
  return Math.max(1, cost);
}
