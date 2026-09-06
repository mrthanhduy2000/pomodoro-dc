/**
 * wonderEffects.js — MỘT nguồn duy nhất cho câu hỏi «công trình đang có bật những đặc quyền kỳ quan
 * nào, và chúng làm gì cho phiên?»
 *
 * ⚠️ VÌ SAO TÁCH (2026-09-02). Cùng một luật từng có **BA** bản chép tay ở store / opportunities /
 * giao diện, và bản thứ ba **đã lệch** (gom `wonderEffect` từ MỌI công trình, không kiểm
 * `type === 'wonder'`). Nó vô hại chỉ vì trong 75 bản vẽ không có cái nào vừa khai `wonderEffect` vừa
 * không phải kỳ quan — đúng nhờ một thứ chẳng liên quan gì tới nó. Mọi bên đọc chung file này.
 *
 * ⚠️ ADR-070 (2026-09-06): giá RP nghiên cứu · giá tinh luyện tiến hoá · hệ số phạt huỷ ĐÃ GỠ cùng ba
 * đồng tiền ngủ. Đặc quyền kỳ quan nay là buff trên trục sống, khai ở `WONDER_EFFECT_REGISTRY[id].passive`
 * (constants) và đọc ở đây — bảng nói GÌ, hàm nói BAO NHIÊU, không chép lại con số ở nơi thứ hai.
 */

import { BUILDING_EFFECTS, STREAK_MAX_BONUS_DAYS, WONDER_EFFECT_REGISTRY } from './constants.js';

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
 * Buff thụ động của kỳ quan cho MỘT phiên: `expBonus` · `epBonus` cộng vào hệ số của
 * `calculateRewards`; `comboWindowHours` cộng vào cửa sổ combo; `flatXp` cộng thẳng vào XP phiên.
 * Đặc quyền khai `minMinutes` chỉ nổ khi phiên đủ dài — kiểm ở ĐÂY một lần, không ở từng nơi gọi.
 */
export function wonderPassiveBuffs(buildings = [], minutesFocused = 0) {
  const out = { expBonus: 0, epBonus: 0, comboWindowHours: 0, flatXp: 0 };
  for (const id of aggregateWonderEffects(buildings)) {
    const passive = WONDER_EFFECT_REGISTRY[id]?.passive;
    if (!passive) continue;
    if (passive.minMinutes && minutesFocused < passive.minMinutes) {
      // Cửa sổ combo không phụ thuộc độ dài phiên — nó là chuyện GIỮA hai phiên.
      out.comboWindowHours += passive.comboWindowHours ?? 0;
      continue;
    }
    out.expBonus += passive.expBonus ?? 0;
    out.epBonus += passive.epBonus ?? 0;
    out.comboWindowHours += passive.comboWindowHours ?? 0;
    out.flatXp += passive.flatXp ?? 0;
  }
  return out;
}

/** Giờ cộng thêm vào cửa sổ đếm phiên của thử thách kỷ nguyên (ADR-070 giữ id `longer_crisis_window`). */
export function wonderCrisisWindowBonusHours(buildings = []) {
  let hours = 0;
  for (const id of aggregateWonderEffects(buildings)) hours += WONDER_EFFECT_REGISTRY[id]?.crisisWindowHours ?? 0;
  return hours;
}

/** Hệ số nhân số phiên cần để di vật lên bậc (<1 = nhanh hơn). Nhiều kỳ quan thì nhân dồn, sàn 0,5. */
export function wonderRelicEvolveFactor(buildings = []) {
  let factor = 1;
  for (const id of aggregateWonderEffects(buildings)) factor *= WONDER_EFFECT_REGISTRY[id]?.relicEvolveFactor ?? 1;
  return Math.max(0.5, factor);
}

/** Trần số ngày chuỗi còn được tính thưởng. */
export function streakBonusCapDays(buildings) {
  return STREAK_MAX_BONUS_DAYS + (aggregateWonderEffects(buildings).has('streak_cap_plus') ? 10 : 0);
}

/** Hệ số nhân XP thưởng nhiệm vụ ngày. */
export function missionXpMultiplier(buildings) {
  return aggregateWonderEffects(buildings).has('mission_bonus_20') ? 1.2 : 1;
}
