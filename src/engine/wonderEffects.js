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

import {
  BLUEPRINT_META, BUILDING_EFFECTS, STREAK_MAX_BONUS_DAYS, getRelicEvolutionRefinedCost,
} from './constants.js';

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

/**
 * Giá TINH LUYỆN thực để tiến hoá một bậc di vật — kỳ quan kỷ 15 giảm 30%.
 *
 * ⚠️ LẦN THỨ HAI CỦA CÙNG MỘT LỖI, Ở MỘT LOẠI TIỀN KHÁC (bắt 2026-09-05). Sau khi gom giá RP về
 * đây, đi soi tiếp thì `RelicInventory.jsx` cũng giữ một bản chép tay
 * (`getDisplayedRelicEvolutionCost`), và nó thiếu ĐÚNG cùng một phép kiểm: nó hỏi
 * `BUILDING_EFFECTS[bpId]?.wonderEffect === 'relic_evo_30off'` mà **không kiểm `type === 'wonder'`**.
 * Hôm nay vô hại chỉ vì 0/75 bản vẽ vừa khai `wonderEffect` vừa không phải kỳ quan — tức nó đúng
 * nhờ một thứ chẳng liên quan gì tới nó, y hệt bản chép của giá RP.
 * ⚠️ Và `Math.max(1, …)` phải nằm SAU phép làm tròn ở CẢ HAI bên: một bậc tiến hoá không bao giờ
 * miễn phí.
 */
export function relicEvolutionCostOf(buildings, stageDef) {
  const wonders = aggregateWonderEffects(buildings);
  let cost = getRelicEvolutionRefinedCost(stageDef);
  if (wonders.has('relic_evo_30off')) cost = Math.round(cost * 0.7);
  return Math.max(1, cost);
}

/*
 * ─── BA ĐẶC QUYỀN CÒN LẠI, GOM NỐT (2026-09-05) ───────────────────────────────────────────────
 * Đi soi hết `wonderEffect` mà tầng giao diện đọc thì thấy thêm **BA** bản chép tay nữa, và cả ba
 * thiếu ĐÚNG cùng một phép kiểm `type === 'wonder'`:
 *   · `PomodoroEngine.jsx`  — phạt huỷ phiên (`building_hp_boost` · `disaster_hp_50off`)
 *   · `DailyMissions.jsx`   — trần chuỗi (`streak_cap_plus`)
 *   · `DailyMissions.jsx`   — thưởng nhiệm vụ (`mission_bonus_20`)
 * Cộng với giá RP và giá tiến hoá di vật là **NĂM** bản chép của cùng một hình dạng lỗi. Chúng
 * không cắn hôm nay chỉ vì 0/75 bản vẽ vừa khai `wonderEffect` vừa không phải kỳ quan — một sự
 * thật về DỮ LIỆU, không phải một tính chất của mã. Ngày nào có ai thêm một dòng như thế, năm màn
 * hình sẽ cùng lúc hứa những con số mà store không chấp nhận.
 *
 * ⚠️ Cả ba hàm dưới đây trả về con số ĐÃ ÁP đặc quyền, không trả về boolean — trả boolean là để
 * hai bên tự nhân lấy, tức vẫn còn hai công thức, chỉ là chúng ngắn hơn.
 */

/** Hệ số phạt khi huỷ phiên giữa chừng — kỳ quan làm nhẹ đòn. */
export function cancelPenaltyWonderMultiplier(buildings) {
  const wonders = aggregateWonderEffects(buildings);
  let multiplier = 1;
  if (wonders.has('building_hp_boost')) multiplier *= 0.85;
  if (wonders.has('disaster_hp_50off')) multiplier *= 0.5;
  return multiplier;
}

/** Trần số ngày chuỗi còn được tính thưởng. */
export function streakBonusCapDays(buildings) {
  return STREAK_MAX_BONUS_DAYS + (aggregateWonderEffects(buildings).has('streak_cap_plus') ? 10 : 0);
}

/** Hệ số nhân XP thưởng nhiệm vụ ngày. */
export function missionXpMultiplier(buildings) {
  return aggregateWonderEffects(buildings).has('mission_bonus_20') ? 1.2 : 1;
}
