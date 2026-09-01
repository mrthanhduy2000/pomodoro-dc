// ─────────────────────────────────────────────────────────────────────────────
// TÓM TẮT NHỊP TẬP TRUNG — phép tính lái toàn bộ tab "Tập Trung"
//
// ⚠️ VÌ SAO NẰM Ở ENGINE (chuyển 2026-08-30). 206 dòng này trước đó nằm trong
// `components/StatsDashboard.jsx`, tức trong một file 4.901 dòng KHÔNG CÓ MỘT BÀI TEST HÀNH VI
// NÀO. Chúng sinh ra ~25 con số mà Đàm đọc mỗi lần mở tab Tập Trung (khung giờ rõ nhất, tỉ lệ
// phiên sâu, nhịp gần đây, chuỗi ngày có phiên…), và không con số nào từng được kiểm.
//
// ⚠️ MÀU KHÔNG NẰM Ở ĐÂY. `FOCUS_BUCKETS` từng mang thêm trường `accent` (mã màu hex) — một
// quyết định MỸ THUẬT lẫn vào một bảng LOGIC. Màu nay ở `FOCUS_BUCKET_ACCENTS` phía giao diện,
// khớp theo THỨ TỰ với bảng này. Đổi số dải ở đây thì phải đổi cả mảng màu bên kia; có test canh.
//
// ⚠️ Đây là phép chuyển NGUYÊN VĂN, không sửa hành vi — trừ đúng một việc: bỏ `accent`. Mọi con
// số phải giữ y hệt, và bài test đối chứng ở `statsFocus.test.js` tồn tại để canh điều đó.
// ─────────────────────────────────────────────────────────────────────────────

import { getVietnamHour, formatVietnamDate, startOfVietnamDayTs } from './time';
import { isCancelledHistoryEntry } from './gameMath';
import { getPeriodStartTs, toTimestampMs } from './statsPeriod';

export const FOCUS_BUCKETS = [
  { label: '< 15p', tone: 'Mở đầu' },
  { label: '15–25p', tone: 'Giữ nhịp' },
  { label: '25–45p', tone: 'Nhịp chuẩn' },
  { label: '45–60p', tone: 'Đi sâu dần' },
  { label: '60p +', tone: 'Đi sâu' },
];

export const FOCUS_TIME_BLOCKS = [
  { key: 'late-night', label: 'Đêm Khuya', icon: '🌙' },
  { key: 'morning', label: 'Buổi Sáng', icon: '🌤️' },
  { key: 'afternoon', label: 'Buổi Chiều', icon: '☀️' },
  { key: 'evening', label: 'Buổi Tối', icon: '🌆' },
];
export const FOCUS_SPARSE_SESSION_THRESHOLD = 18;
export const FOCUS_SPARSE_ACTIVE_DAY_THRESHOLD = 12;
export const FOCUS_SPARSE_HOUR_THRESHOLD = 6;
export const FOCUS_COMPACT_TIMELINE_DAYS = {
  all: 56,
  month: 35,
  week: 21,
  today: 14,
};

export function getFocusBucketIndex(minutes) {
  if (minutes < 15) return 0;
  if (minutes < 25) return 1;
  if (minutes < 45) return 2;
  if (minutes < 60) return 3;
  return 4;
}

export function getFocusTimeBlockIndex(hour) {
  if (hour < 6) return 0;
  if (hour < 12) return 1;
  if (hour < 18) return 2;
  return 3;
}

export function getHeatIntensity(minutes, maxMinutes) {
  if (!minutes || minutes <= 0 || !Number.isFinite(maxMinutes) || maxMinutes <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((minutes / maxMinutes) * 4)));
}

export function summarizeFocusStats(history, period = 'all') {
  const startTs = getPeriodStartTs(period);
  const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({ hour, sessions: 0, minutes: 0 }));
  const buckets = FOCUS_BUCKETS.map((bucket) => ({ ...bucket, count: 0, minutes: 0 }));
  const timeBlocks = FOCUS_TIME_BLOCKS.map((block) => ({ ...block, sessions: 0, minutes: 0 }));
  const dayTotals = new Map();
  const filteredEntries = [];

  let totalMinutes = 0;
  let totalSessions = 0;
  let completedSessions = 0;
  let cancelledSessions = 0;
  let deepFocusCount = 0;
  let ultraFocusCount = 0;
  let maxSessionMinutes = 0;
  let latestSessionTs = null;

  for (const entry of history) {
    const timestampMs = toTimestampMs(entry?.timestamp);
    if (!Number.isFinite(timestampMs) || (startTs !== null && timestampMs < startTs)) continue;

    filteredEntries.push(entry);
    const minutes = Math.max(0, entry?.minutes ?? 0);
    const isCancelled = isCancelledHistoryEntry(entry);

    totalMinutes += minutes;
    totalSessions += 1;
    completedSessions += isCancelled ? 0 : 1;
    cancelledSessions += isCancelled ? 1 : 0;
    if (minutes >= 60) deepFocusCount += 1;
    if (minutes >= 90) ultraFocusCount += 1;
    if (minutes > maxSessionMinutes) maxSessionMinutes = minutes;
    if (latestSessionTs === null || timestampMs > latestSessionTs) latestSessionTs = timestampMs;

    const hour = getVietnamHour(timestampMs);
    hourlyStats[hour].sessions += 1;
    hourlyStats[hour].completed = (hourlyStats[hour].completed ?? 0) + (isCancelled ? 0 : 1);
    hourlyStats[hour].cancelled = (hourlyStats[hour].cancelled ?? 0) + (isCancelled ? 1 : 0);
    hourlyStats[hour].minutes += minutes;

    const bucketIndex = getFocusBucketIndex(minutes);
    buckets[bucketIndex].count += 1;
    buckets[bucketIndex].minutes += minutes;

    const timeBlockIndex = getFocusTimeBlockIndex(hour);
    timeBlocks[timeBlockIndex].sessions += 1;
    timeBlocks[timeBlockIndex].minutes += minutes;

    const dayKey = startOfVietnamDayTs(timestampMs);
    const currentDay = dayTotals.get(dayKey) ?? {
      key: dayKey,
      label: formatVietnamDate(dayKey, { weekday: 'short', day: 'numeric', month: 'numeric' }),
      minutes: 0,
      sessions: 0,
    };
    currentDay.minutes += minutes;
    currentDay.sessions += 1;
    currentDay.completed = (currentDay.completed ?? 0) + (isCancelled ? 0 : 1);
    currentDay.cancelled = (currentDay.cancelled ?? 0) + (isCancelled ? 1 : 0);
    dayTotals.set(dayKey, currentDay);
  }

  const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
  const maxHourMins = Math.max(...hourlyStats.map((item) => item.minutes), 1);
  const maxBucket = Math.max(...buckets.map((bucket) => bucket.count), 1);
  const activeDays = dayTotals.size;
  const avgMinutesPerActiveDay = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;
  const activeHours = hourlyStats
    .filter((item) => item.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes || b.sessions - a.sessions || a.hour - b.hour);
  const activeHourCount = activeHours.length;
  const recentActiveDays = Array.from(dayTotals.values())
    .sort((a, b) => b.key - a.key)
    .slice(0, 5);
  const compactWindowDays = FOCUS_COMPACT_TIMELINE_DAYS[period] ?? FOCUS_COMPACT_TIMELINE_DAYS.all;
  const compactEndTs = startOfVietnamDayTs();
  const compactTimeline = Array.from({ length: compactWindowDays }, (_, index) => {
    const dayTs = compactEndTs - ((compactWindowDays - 1 - index) * 86_400_000);
    const day = dayTotals.get(dayTs);
    return {
      key: dayTs,
      label: formatVietnamDate(dayTs, { weekday: 'short', day: 'numeric', month: 'numeric' }),
      shortLabel: formatVietnamDate(dayTs, { day: 'numeric', month: 'numeric' }),
      minutes: day?.minutes ?? 0,
      sessions: day?.sessions ?? 0,
    };
  });
  const compactTimelineMax = Math.max(...compactTimeline.map((day) => day.minutes), 1);
  const compactTimelineWeeks = Array.from(
    { length: Math.ceil(compactTimeline.length / 7) },
    (_, weekIndex) => compactTimeline
      .slice(weekIndex * 7, weekIndex * 7 + 7)
      .map((day) => ({ ...day, intensity: getHeatIntensity(day.minutes, compactTimelineMax) })),
  );
  const compactActiveDays = compactTimeline.filter((day) => day.minutes > 0).length;
  const compactConsistency = compactWindowDays > 0
    ? Math.round((compactActiveDays / compactWindowDays) * 100)
    : 0;

  const bestHour = hourlyStats.reduce(
    (best, item) => (item.minutes > best.minutes ? item : best),
    { hour: 0, sessions: 0, minutes: 0 },
  );
  const bestTimeBlock = timeBlocks.reduce(
    (best, block) => (block.minutes > best.minutes ? block : best),
    { key: 'none', label: 'Chưa có dữ liệu', icon: '🕳️', sessions: 0, minutes: 0 },
  );
  const bestDay = Array.from(dayTotals.values()).reduce(
    (best, day) => (day.minutes > best.minutes ? day : best),
    { key: 0, label: '—', minutes: 0, sessions: 0 },
  );

  const recent7 = filteredEntries.slice(0, 7);
  const prev7 = filteredEntries.slice(7, 14);
  const recent7Minutes = recent7.reduce((sum, entry) => sum + (entry?.minutes ?? 0), 0);
  const prev7Minutes = prev7.reduce((sum, entry) => sum + (entry?.minutes ?? 0), 0);
  const recent7Avg = recent7.length > 0 ? Math.round(recent7Minutes / recent7.length) : 0;
  const recent30 = filteredEntries.slice(0, 30).reverse().map((entry, index) => ({
    label: String(index + 1),
    minutes: entry?.minutes ?? 0,
    sessions: 1,
    xp: entry?.xpEarned ?? 0,
  }));
  const sparseMode = totalSessions < FOCUS_SPARSE_SESSION_THRESHOLD
    || activeDays < FOCUS_SPARSE_ACTIVE_DAY_THRESHOLD
    || activeHourCount < FOCUS_SPARSE_HOUR_THRESHOLD;

  return {
    totalSessions,
    completedSessions,
    cancelledSessions,
    totalMinutes,
    avgSessionMinutes,
    maxSessionMinutes,
    deepFocusCount,
    ultraFocusCount,
    activeDays,
    avgMinutesPerActiveDay,
    hourlyStats,
    maxHourMins,
    bestHour,
    buckets,
    maxBucket,
    timeBlocks,
    bestTimeBlock,
    bestDay,
    recent7Minutes,
    prev7Minutes,
    recent7Avg,
    recent30,
    activeHours,
    activeHourCount,
    recentActiveDays,
    compactTimeline,
    compactTimelineWeeks,
    compactWindowDays,
    compactActiveDays,
    compactConsistency,
    sparseMode,
    lastSessionLabel: latestSessionTs ? formatVietnamDate(latestSessionTs, { weekday: 'short', day: 'numeric', month: 'numeric' }) : 'Chưa có phiên nào',
  };
}
