/**
 * todayHero.js — LUẬT của khối "Hôm nay" mở đầu màn Tập trung (2026-09-05, ADR-068).
 *
 * VÌ SAO CÓ. Thứ giữ người ta quay lại một app thói quen không phải con số EP — là CHUỖI, và là
 * hình ảnh tuần này đã có mấy ngày được tô. Trước ADR-068 chuỗi trên iPhone chỉ là một ô 68px
 * ghi "7 / 14" ở thanh tiêu đề; tấm "Chuỗi" đầy đủ nằm ở cột phải `hidden … lg:flex`, tức Đàm
 * chưa từng thấy nó trên thiết bị anh dùng hằng ngày. Khối này đưa ba thứ lên đúng chỗ mắt đọc
 * đầu tiên: số ngày liên tiếp · dải bảy ngày của tuần · mốc kế tiếp.
 *
 * ⚠️ THUẦN — không đọc store, không đọc đồng hồ. `todayKey`/`mondayKey` do nơi gọi truyền vào,
 * đúng khuôn `countSessionsOnDay` ở `gameMath.js`, nên `todayHero.test.js` chấm được bằng
 * `node --test` không cần DOM.
 *
 * ⚠️ HÔM NAY ĐỌC TỪ `dailyTracking`, KHÔNG ĐỌC TỪ `history`. `gameMath.js` đã ghi lý do: hai
 * đường ấy có thể lệch nhau (phiên huỷ, phiên nhập từ máy khác) và `dailyTracking` mới là con số
 * mọi cơ chế thưởng đang dùng. Các ngày TRƯỚC thì chỉ còn `history` để hỏi.
 */
import { localDateStr } from '../engine/time';
import { calculateStreakMilestoneProgress, isCancelledHistoryEntry } from '../engine/gameMath';
import { streakBonusCapDays } from '../engine/wonderEffects.js';
import { STREAK_BONUS_PER_DAY } from '../engine/constants';

/** Thứ Hai → Chủ Nhật, đúng thứ tự tuần Việt Nam (tuần bắt đầu Thứ Hai, như `localWeekMondayStr`). */
export const WEEK_DAY_LABELS = Object.freeze(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);

/** Cộng N ngày vào một khoá 'YYYY-MM-DD' mà không đi qua múi giờ máy (tính bằng UTC thuần). */
export function addDaysToKey(key, days) {
  const [y, m, d] = String(key ?? '').split('-').map(Number);
  if (![y, m, d].every(Number.isFinite)) return key;
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/**
 * Bảy ô của tuần hiện tại.
 * @returns {{key: string, label: string, done: boolean, isToday: boolean, isFuture: boolean}[]}
 */
export function buildWeekStrip({
  history = [], todayKey, mondayKey, sessionsCompletedToday = 0,
} = {}) {
  const done = new Set();
  for (const entry of history ?? []) {
    if (isCancelledHistoryEntry(entry) || entry?.completed === false) continue;
    const ts = Number.isFinite(entry?.timestamp) ? entry.timestamp : entry?.finishedAt;
    if (!Number.isFinite(ts)) continue;
    const key = localDateStr(ts);
    if (key === todayKey) continue; // hôm nay: hỏi dailyTracking, xem chú thích đầu file
    done.add(key);
  }
  if (sessionsCompletedToday > 0) done.add(todayKey);

  return WEEK_DAY_LABELS.map((label, i) => {
    const key = addDaysToKey(mondayKey, i);
    return {
      key,
      label,
      done: done.has(key),
      isToday: key === todayKey,
      isFuture: key > todayKey,
    };
  });
}

/**
 * Mốc chuỗi kế tiếp, viết thành MỘT câu ngắn cho khối Hôm nay. Dùng CHUNG
 * `calculateStreakMilestoneProgress` với thanh tiêu đề và dòng "khoảnh khắc" — ba chỗ không thể
 * nói ba mốc khác nhau.
 */
export function describeStreakTarget(currentStreak = 0) {
  const { nextMilestone, daysRemaining, hasUnlockedAll } = calculateStreakMilestoneProgress(currentStreak);
  if (hasUnlockedAll || !nextMilestone) {
    return { text: 'Đã mở mọi mốc chuỗi', remaining: 0, permanent: false, hasUnlockedAll: true };
  }
  const ten = nextMilestone.permanent ? `${nextMilestone.label} (vĩnh viễn)` : `mốc ${nextMilestone.days}`;
  return {
    text: `Còn ${daysRemaining} ngày → ${ten}`,
    remaining: daysRemaining,
    permanent: nextMilestone.permanent === true,
    hasUnlockedAll: false,
  };
}

/** +N% XP mỗi phiên nhờ chuỗi — cùng công thức `DailyMissions` từng in, nay in ở khối Hôm nay. */
export function streakBonusPercent(currentStreak = 0, buildings = []) {
  const streak = Math.max(0, Math.floor(Number(currentStreak) || 0));
  return Math.min(streak, streakBonusCapDays(buildings)) * (STREAK_BONUS_PER_DAY * 100);
}
