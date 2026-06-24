/**
 * _lib/coachDigest.js — phần THUẦN cho cron "cảnh báo chuỗi sắp đứt". KHÔNG chạm Supabase/push
 * → test được (api/coach-digest.test.js). Nhận getter ngày/giờ qua tham số để đúng múi giờ VN.
 * Nằm trong _lib (Vercel BỎ QUA — không thành endpoint riêng).
 */

// Mốc buổi-trong-ngày KHỚP với getTimeOfDayBucket (gameMath): sáng 5–11, trưa 11–13,
// chiều 13–18, tối 18–22, khuya 22–5 (vắt nửa đêm).
const TOD_BUCKETS = [
  { label: 'buổi sáng', test: (h) => h >= 5 && h < 11 },
  { label: 'buổi trưa', test: (h) => h >= 11 && h < 13 },
  { label: 'buổi chiều', test: (h) => h >= 13 && h < 18 },
  { label: 'buổi tối', test: (h) => h >= 18 && h < 22 },
  { label: 'khuya', test: (h) => h >= 22 || h < 5 },
];

function isUsableSession(e) {
  return e && e.completed !== false && !e.cancelled && Number(e.minutes) > 0;
}

/**
 * evaluateStreakRisk — chuỗi "đang treo": còn chuỗi (≥1) NHƯNG hôm nay (ngày VN) CHƯA có phiên
 * hoàn thành nào. Trả { atRisk, streak, hasToday }.
 */
export function evaluateStreakRisk({ history, currentStreak, nowDayNumber, getEntryDayNumber } = {}) {
  const streak = Math.max(0, Math.floor(Number(currentStreak) || 0));
  if (streak < 1 || typeof getEntryDayNumber !== 'function' || !Number.isFinite(nowDayNumber)) {
    return { atRisk: false, streak, hasToday: false };
  }
  let hasToday = false;
  for (const e of (Array.isArray(history) ? history : [])) {
    if (!isUsableSession(e)) continue;
    if (getEntryDayNumber(e) === nowDayNumber) { hasToday = true; break; }
  }
  return { atRisk: !hasToday, streak, hasToday };
}

/**
 * pickActiveBucketLabel — buổi-trong-ngày bạn HAY tập trung nhất (nhiều phiên nhất), chỉ trả khi
 * CHIẾM ƯU THẾ rõ (≥40% phiên) và đủ mẫu (≥minSessions). Đây là "buổi hay làm" (theo số lượng),
 * KHÔNG phải "giờ vàng" goal-based của gameMath — phát biểu trung thực ở payload. null nếu chưa rõ.
 */
export function pickActiveBucketLabel({ history, getEntryHour, minSessions = 5 } = {}) {
  if (typeof getEntryHour !== 'function') return null;
  const counts = new Map();
  let total = 0;
  for (const e of (Array.isArray(history) ? history : [])) {
    if (!isUsableSession(e)) continue;
    const h = getEntryHour(e);
    if (!Number.isFinite(h)) continue;
    const b = TOD_BUCKETS.find((x) => x.test(h));
    if (!b) continue;
    counts.set(b.label, (counts.get(b.label) || 0) + 1);
    total += 1;
  }
  if (total < minSessions) return null;
  let best = null; let bestN = 0;
  for (const [label, n] of counts) { if (n > bestN) { best = label; bestN = n; } }
  return best && bestN / total >= 0.4 ? best : null;
}

/**
 * buildStreakNudgePayload — nội dung push khi chuỗi sắp đứt (khớp định dạng push-worker:
 * title/body/icon/badge/tag/url). activeBucketLabel tuỳ chọn → thêm mẹo "buổi hay làm".
 */
export function buildStreakNudgePayload({ streak, activeBucketLabel = null } = {}) {
  const s = Math.max(1, Math.floor(Number(streak) || 1));
  const tip = activeBucketLabel
    ? `Bạn hay tập trung vào ${activeBucketLabel} — thử 1 phiên ngắn để giữ chuỗi.`
    : 'Làm 1 phiên ngắn hôm nay là giữ được chuỗi nhé.';
  return {
    title: `🔥 Chuỗi ${s} ngày đang treo`,
    body: `Hôm nay bạn chưa làm phiên nào. ${tip}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dc-coach-streak-risk',
    url: '/',
  };
}
