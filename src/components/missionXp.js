/**
 * missionXp.js — hai phép tính XP nhiệm vụ ngày dùng CHUNG cho màn Tập trung, cột phải desktop và
 * chuỗi thẻ thưởng sau phiên (2026-09-05, ADR-068).
 *
 * ⚠️ VÌ SAO TÁCH: trước đây `scaleMissionXP` và công thức "thưởng trọn ngày" sống bên trong
 * `DailyMissions.jsx` — một file component, mà luật `react-refresh/only-export-components` cấm
 * export hàm thuần từ đó. Chuỗi thẻ thưởng cần in đúng con số "+43 XP" mà thẻ nhiệm vụ đang in;
 * chép công thức sang là "một luật hai công thức", và hai con số ấy sẽ lệch nhau ở đúng ngày có
 * công trình nhân thưởng.
 */
import { DAILY_MISSION_XP_SCALE, MISSION_ALL_BONUS_XP } from '../engine/constants';

/** XP thật của một nhiệm vụ sau khi nhân hệ số công trình. */
export function scaleMissionXP(xp, multiplier = 1) {
  return Math.max(0, Math.round((xp ?? 0) * DAILY_MISSION_XP_SCALE * multiplier));
}

/**
 * "Thưởng trọn ngày" = thưởng cố định + (nếu có Bậc Thầy Chiến Lược) tổng XP của cả ba nhiệm vụ.
 * Cùng công thức mà `getDailyMissionAllBonusXP` trong store dùng để CẤP; ở đây chỉ để HIỆN.
 */
export function dailyAllBonusXP({ list = [], multiplier = 1, strategist = false } = {}) {
  const base = scaleMissionXP(MISSION_ALL_BONUS_XP, multiplier);
  if (!strategist) return base;
  const tong = list.reduce((sum, mission) => sum + (mission?.rewardXP ?? 0), 0);
  return base + scaleMissionXP(tong, multiplier);
}
