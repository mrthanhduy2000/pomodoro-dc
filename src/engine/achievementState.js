/**
 * achievementState.js — Achievement state: defaults, hydration/normalisation of the unlock timeline, the snapshot `checkAchievements` reads, and appending unlocks. Moved verbatim out of gameStore.js (ADR-078).
 *
 * Comments inside are the originals (Vietnamese where they were written so); the rules they
 * explain have not changed by moving. Pure: no store, no DOM.
 */
import { inferAchievementUnlockTimes } from './achievementTimeline';
import { ACHIEVEMENTS } from './constants';
import { isCancelledHistoryEntry } from './gameMath';
import { getVietnamDateParts, getVietnamDayOfWeek, getVietnamHour, getVietnamMonthIndex, getVietnamYear, localDateStr } from './time';

export const makeDefaultAchievements = () => ({
  unlocked: [],
  timeline: {},
});

export const achievementHydrationState = {
  shouldPersistBackfilledTimeline: false,
};

export function normalizeAchievementTimelineEntry(entry, fallbackOrder = 0) {
  if (typeof entry === 'string') {
    return { unlockedAt: entry, order: fallbackOrder, source: 'stored' };
  }

  const unlockedAt = typeof entry?.unlockedAt === 'string' ? entry.unlockedAt : null;
  const order = Number.isFinite(entry?.order) ? entry.order : fallbackOrder;
  const source = unlockedAt && entry?.source === 'inferred' ? 'inferred' : 'stored';
  return { unlockedAt, order, source: unlockedAt ? source : null };
}

export function normalizeAchievementsState(achievements) {
  const unlocked = Array.isArray(achievements?.unlocked)
    ? [...new Set(achievements.unlocked.filter((id) => typeof id === 'string' && id.trim().length > 0))]
    : [];
  const rawTimeline = achievements?.timeline && typeof achievements.timeline === 'object'
    ? achievements.timeline
    : {};

  const timeline = {};
  unlocked.forEach((id, index) => {
    timeline[id] = normalizeAchievementTimelineEntry(rawTimeline[id], index + 1);
  });

  return {
    ...makeDefaultAchievements(),
    ...achievements,
    unlocked,
    timeline,
  };
}

export function mergeInferredAchievementTimeline(achievements, inferredTimeline = {}) {
  const inferredIds = Object.keys(inferredTimeline);
  if (inferredIds.length === 0) {
    return { achievements, didBackfill: false };
  }

  const unlockedOrder = new Map(achievements.unlocked.map((id, index) => [id, index + 1]));
  const nextTimeline = { ...achievements.timeline };
  let didBackfill = false;

  inferredIds.forEach((id) => {
    if (!unlockedOrder.has(id)) return;

    const currentEntry = normalizeAchievementTimelineEntry(nextTimeline[id], unlockedOrder.get(id));
    if (currentEntry.unlockedAt) return;

    nextTimeline[id] = {
      ...currentEntry,
      unlockedAt: inferredTimeline[id],
      source: 'inferred',
    };
    didBackfill = true;
  });

  return {
    achievements: didBackfill
      ? {
        ...achievements,
        timeline: nextTimeline,
      }
      : achievements,
    didBackfill,
  };
}

export function normalizeAchievementsStateWithTimeline(achievements, history = []) {
  const normalized = normalizeAchievementsState(achievements);
  const inferredTimeline = inferAchievementUnlockTimes(
    history,
    normalized.unlocked,
    normalized.timeline,
  );
  return mergeInferredAchievementTimeline(normalized, inferredTimeline);
}

export function appendAchievementUnlocks(achievements, newlyUnlocked = [], unlockedAt = new Date().toISOString()) {
  const normalized = normalizeAchievementsState(achievements);
  if (!Array.isArray(newlyUnlocked) || newlyUnlocked.length === 0) {
    return normalized;
  }

  const nextUnlocked = [...normalized.unlocked];
  const nextTimeline = { ...normalized.timeline };
  const existingIds = new Set(nextUnlocked);
  let nextOrder = Object.values(nextTimeline).reduce(
    (maxOrder, entry) => Math.max(maxOrder, entry?.order ?? 0),
    0,
  );
  const resolvedUnlockedAt = typeof unlockedAt === 'string'
    ? unlockedAt
    : new Date(unlockedAt).toISOString();

  newlyUnlocked.forEach((id) => {
    if (!id || existingIds.has(id)) return;
    nextOrder += 1;
    nextUnlocked.push(id);
    nextTimeline[id] = { unlockedAt: resolvedUnlockedAt, order: nextOrder, source: 'stored' };
    existingIds.add(id);
  });

  return {
    ...normalized,
    unlocked: nextUnlocked,
    timeline: nextTimeline,
  };
}

// ─── FACTORY: STREAK ──────────────────────────────────────────────────────────

export function countCollectedBlueprints(research, blueprints = [], buildings = []) {
  return new Set([
    ...((research?.researched ?? []).filter(Boolean)),
    ...(blueprints.map((blueprint) => blueprint?.id).filter(Boolean)),
    ...((buildings ?? []).filter(Boolean)),
  ]).size;
}

// ─── HELPER: Tạo snapshot cho kiểm tra thành tích ────────────────────────────

// ⚠️ Có bản SONG SONG `buildAchievementSnapshotForReplay` ở src/engine/achievementTimeline.js
// (tính lại field TƯƠNG TỰ nhưng bằng thuật toán TÍCH LUỸ-GIA-TĂNG cho việc suy luận ngày mở
// khoá cũ, khác thuật toán "tính lại từ đầu mỗi lần gọi" ở đây). CỐ Ý KHÔNG gộp làm một (rủi ro
// cao hơn lợi ích — 2 thuật toán phục vụ 2 mục đích khác nhau: real-time check vs replay lịch
// sử). Thêm/đổi field thành tích ở ĐÂY thì kiểm tra luôn bên achievementTimeline.js kẻo lệch.
export function buildAchievementSnapshot(progress, relics, blueprints, research, history, rankSystem, streak, buildings, prestige, player) {
  const completedHistory = history.filter((h) => !isCancelledHistoryEntry(h));
  const getTs     = (h) => typeof h.timestamp === 'string' ? new Date(h.timestamp).getTime() : (h.timestamp ?? 0);
  const getH      = (h) => getVietnamHour(getTs(h));
  const getDow    = (h) => getVietnamDayOfWeek(getTs(h));
  const getMon    = (h) => getVietnamMonthIndex(getTs(h));
  const getYr     = (h) => getVietnamYear(getTs(h));
  const getDayKey = (h) => localDateStr(getTs(h));

  const thisYear  = getVietnamYear();
  const thisYearH = completedHistory.filter((h) => getYr(h) === thisYear);

  // sessions per day
  const dayMap = {};
  completedHistory.forEach((h) => { const d = getDayKey(h); dayMap[d] = (dayMap[d] || 0) + 1; });
  const maxSessionsInDay = Math.max(0, ...Object.values(dayMap));

  // day-of-week counts [0=Sun..6=Sat]
  const dow = [0, 0, 0, 0, 0, 0, 0];
  completedHistory.forEach((h) => dow[getDow(h)]++);

  // month counts [0=Jan..11=Dec]
  const mon = Array(12).fill(0);
  completedHistory.forEach((h) => mon[getMon(h)]++);

  // best month (any year)
  const monthMinMap = {};
  completedHistory.forEach((h) => {
    const k = `${getYr(h)}-${getMon(h)}`;
    monthMinMap[k] = (monthMinMap[k] || 0) + (h.minutes ?? 0);
  });
  const monthSessMap = {};
  completedHistory.forEach((h) => {
    const k = `${getYr(h)}-${getMon(h)}`;
    monthSessMap[k] = (monthSessMap[k] || 0) + 1;
  });
  const bestMonthSessions = Math.max(0, ...Object.values(monthSessMap));
  const bestMonthMinutes  = Math.max(0, ...Object.values(monthMinMap));

  // best month this year
  const mmYear = Array(12).fill(0);
  thisYearH.forEach((h) => mmYear[getMon(h)]++);
  const bestMonthSessionsThisYear = Math.max(...mmYear);

  // comeback: gap ≥30 days within this year's sessions
  let hadComebackThisYear = false;
  if (thisYearH.length >= 2) {
    const sorted = [...thisYearH].sort((a, b) => getTs(a) - getTs(b));
    for (let i = 1; i < sorted.length; i++) {
      if ((getTs(sorted[i]) - getTs(sorted[i - 1])) / 86400000 >= 30) { hadComebackThisYear = true; break; }
    }
  }

  // special calendar dates: encoded as month*100+day (0-indexed month)
  const calSet = new Set(completedHistory.map((h) => {
    const { month, day } = getVietnamDateParts(getTs(h));
    return (month - 1) * 100 + day;
  }));

  // total active days (unique days ever)
  const totalActiveDays = Object.keys(dayMap).length;

  // days since first session
  const daysSinceFirst = completedHistory.length > 0
    ? Math.floor((Date.now() - getTs(completedHistory[completedHistory.length - 1])) / 86400000)
    : 0;

  // full-day: a day with sessions in morning (6-12), afternoon (12-18), evening (18-23)
  const fullDaySet = new Set();
  const dayParts   = {};
  completedHistory.forEach((h) => {
    const d = getDayKey(h); const hr = getH(h);
    if (!dayParts[d]) dayParts[d] = new Set();
    if (hr >= 6  && hr < 12) dayParts[d].add('m');
    if (hr >= 12 && hr < 18) dayParts[d].add('a');
    if (hr >= 18 && hr < 23) dayParts[d].add('e');
    if (dayParts[d].size === 3) fullDaySet.add(d);
  });

  // sessions per day this year
  const dayMapYear = {};
  thisYearH.forEach((h) => { const d = getDayKey(h); dayMapYear[d] = (dayMapYear[d] || 0) + 1; });

  // unique categories used
  const uniqueCategoriesUsed = new Set(completedHistory.filter((h) => h.categoryId).map((h) => h.categoryId)).size;

  return {
    // ── core ──
    sessionsCompleted:  progress.sessionsCompleted,
    totalFocusMinutes:  progress.totalFocusMinutes,
    totalXP:            player?.totalEXP ?? 0,
    activeBook:         progress.activeBook ?? 1,
    playerLevel:        player?.level ?? 0,
    // ── relics / blueprints / buildings ──
    relicsCount:        relics.length,
    blueprintsCount:    countCollectedBlueprints(research, blueprints, buildings),
    buildingsBuilt:     (buildings ?? []).length,
    prestigeCount:      prestige?.count ?? 0,
    // ── session stats ──
    maxSessionMinutes:  completedHistory.reduce((m, h) => Math.max(m, h.minutes ?? 0), 0),
    totalJackpots:      completedHistory.filter((h) => h.jackpot).length,
    deepFocusCount:     completedHistory.filter((h) => (h.minutes ?? 0) >= 60).length,
    ultraFocusCount:    completedHistory.filter((h) => (h.minutes ?? 0) >= 90).length,
    titanFocusCount:    completedHistory.filter((h) => (h.minutes ?? 0) >= 120).length,
    legendFocusCount:   completedHistory.filter((h) => (h.minutes ?? 0) >= 180).length,
    maxSessionsInDay,
    fullDayCount:       fullDaySet.size,
    totalActiveDays,
    daysSinceFirst,
    // ── rank ──
    maxRankAchieved:    Math.max(0, ...[1,2,3,4,5,6,7,8,9,10].map((i) => rankSystem[`book${i}`] ?? 0)),
    // ── streak ──
    currentStreak:      streak?.currentStreak ?? 0,
    longestStreak:      streak?.longestStreak ?? 0,
    // ── time of day ──
    earlyBirdCount:     completedHistory.filter((h) => getH(h) < 7).length,
    nightOwlCount:      completedHistory.filter((h) => getH(h) >= 23).length,
    midnightCount:      completedHistory.filter((h) => getH(h) < 3).length,
    dawnCount:          completedHistory.filter((h) => getH(h) < 6).length,
    fiveAmCount:        completedHistory.filter((h) => getH(h) >= 5 && getH(h) < 6).length,
    lunchCount:         completedHistory.filter((h) => getH(h) >= 12 && getH(h) < 13).length,
    afternoonCount:     completedHistory.filter((h) => getH(h) >= 14 && getH(h) < 17).length,
    eveningCount:       completedHistory.filter((h) => getH(h) >= 18 && getH(h) < 22).length,
    teatimeCount:       completedHistory.filter((h) => getH(h) >= 15 && getH(h) < 16).length,
    sunriseCount:       completedHistory.filter((h) => getH(h) >= 6 && getH(h) < 7).length,
    // ── annual ──
    sessionsThisYear:        thisYearH.length,
    minutesThisYear:         thisYearH.reduce((s, h) => s + (h.minutes ?? 0), 0),
    monthsActiveThisYear:    new Set(thisYearH.map((h) => getMon(h))).size,
    hadComebackThisYear,
    bestMonthSessionsThisYear,
    q1Sessions:  thisYearH.filter((h) => getMon(h) < 3).length,
    q2Sessions:  thisYearH.filter((h) => getMon(h) >= 3 && getMon(h) < 6).length,
    q3Sessions:  thisYearH.filter((h) => getMon(h) >= 6 && getMon(h) < 9).length,
    q4Sessions:  thisYearH.filter((h) => getMon(h) >= 9).length,
    // ── calendar specials ──
    hasJan1Session:    calSet.has(1),     // Jan=0 → 0*100+1=1
    hasDec31Session:   calSet.has(1131),  // Dec=11 → 11*100+31=1131
    hasDec25Session:   calSet.has(1125),
    hasFeb14Session:   calSet.has(114),
    hasMar14Session:   calSet.has(214),   // Pi day
    hasMar8Session:    calSet.has(208),   // Women's Day
    hasNov20Session:   calSet.has(1020),  // Vietnam Teacher's Day
    hasJun21Session:   calSet.has(521),   // Summer solstice
    // ── day of week ──
    sunCount: dow[0], monCount: dow[1], tueCount: dow[2], wedCount: dow[3],
    thuCount: dow[4], friCount: dow[5], satCount: dow[6],
    weekendCount: dow[0] + dow[6],
    weekdayCount: dow[1] + dow[2] + dow[3] + dow[4] + dow[5],
    // ── month totals (all-time) ──
    janCount: mon[0],  febCount: mon[1],  marCount: mon[2],  aprCount: mon[3],
    mayCount: mon[4],  junCount: mon[5],  julCount: mon[6],  augCount: mon[7],
    sepCount: mon[8],  octCount: mon[9],  novCount: mon[10], decCount: mon[11],
    bestMonthSessions,
    bestMonthMinutes,
    // ── notes ──
    totalNoteCount: completedHistory.filter((h) => h.note).length,
    longNoteCount:  completedHistory.filter((h) => h.note && h.note.length >= 150).length,
    // ── categories ──
    uniqueCategoriesUsed,
  };
}

// ─── HELPER: Kiểm tra thành tích mới mở khóa ─────────────────────────────────

export function checkAchievements(currentUnlocked, snapshot) {
  return ACHIEVEMENTS
    .filter((a) => !currentUnlocked.includes(a.id) && a.check(snapshot, currentUnlocked))
    .map((a) => a.id);
}
