import { ACHIEVEMENTS } from './constants';
import {
  localDateStr,
  getVietnamDateParts,
  getVietnamDayOfWeek,
  getVietnamHour,
  getVietnamMonthIndex,
  getVietnamYear,
} from './time';
import { computeLevelUps, getActiveBook } from './gameMath';

const INFERABLE_COLLECTION_IDS = new Set([
  'jackpot_win',
  'jackpot_3',
  'jackpot_10',
  'jackpot_25',
  'jackpot_50',
  'jackpot_100',
]);

function isInferableAchievement(achievement) {
  if (!achievement?.id) return false;
  if (achievement.category === 'meta') return false;

  if (achievement.category === 'collection') {
    return INFERABLE_COLLECTION_IDS.has(achievement.id);
  }

  if (achievement.category === 'era_rank') {
    return achievement.id.startsWith('era_');
  }

  return !achievement.id.startsWith('prestige_');
}

function getSessionTs(entry) {
  const raw = entry?.timestamp ?? entry?.finishedAt ?? entry?.startedAt;
  const ts = typeof raw === 'string' ? new Date(raw).getTime() : Number(raw);
  return Number.isFinite(ts) ? ts : null;
}

function advanceReplayStreak(streak, sessionTs) {
  const today = localDateStr(sessionTs);
  const yesterday = localDateStr(sessionTs - 86_400_000);

  if (streak.lastActiveDate === today) return streak;

  const currentStreak = streak.lastActiveDate === yesterday
    ? streak.currentStreak + 1
    : 1;

  return {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    lastActiveDate: today,
  };
}

function createReplayYearStats() {
  return {
    sessions: 0,
    minutes: 0,
    activeMonthCount: 0,
    bestMonthSessions: 0,
    hadComeback: false,
    lastSessionTs: null,
    monthCounts: Array(12).fill(0),
    q1Sessions: 0,
    q2Sessions: 0,
    q3Sessions: 0,
    q4Sessions: 0,
  };
}

function getOrCreateReplayYearStats(yearStats, year) {
  if (yearStats.has(year)) return yearStats.get(year);
  const nextStats = createReplayYearStats();
  yearStats.set(year, nextStats);
  return nextStats;
}

function createReplayAccumulator() {
  return {
    bestMonthMinutes: 0,
    bestMonthSessions: 0,
    calendarSet: new Set(),
    categorySet: new Set(),
    dayCounts: new Map(),
    dayParts: new Map(),
    dow: [0, 0, 0, 0, 0, 0, 0],
    firstSessionTs: null,
    fiveAmCount: 0,
    fullDaySet: new Set(),
    afternoonCount: 0,
    dawnCount: 0,
    deepFocusCount: 0,
    earlyBirdCount: 0,
    eveningCount: 0,
    legendFocusCount: 0,
    longNoteCount: 0,
    lunchCount: 0,
    maxSessionMinutes: 0,
    maxSessionsInDay: 0,
    midnightCount: 0,
    mon: Array(12).fill(0),
    monthMinutesByKey: new Map(),
    monthSessionsByKey: new Map(),
    nightOwlCount: 0,
    sunriseCount: 0,
    teatimeCount: 0,
    titanFocusCount: 0,
    totalJackpots: 0,
    totalNoteCount: 0,
    ultraFocusCount: 0,
    yearStats: new Map(),
  };
}

function updateReplayAccumulator(accumulator, entry) {
  const sessionTs = entry.__ts ?? getSessionTs(entry);
  if (!Number.isFinite(sessionTs)) return;

  const minutes = entry.minutes ?? 0;
  const hour = getVietnamHour(sessionTs);
  const dayOfWeek = getVietnamDayOfWeek(sessionTs);
  const monthIndex = getVietnamMonthIndex(sessionTs);
  const year = getVietnamYear(sessionTs);
  const dayKey = localDateStr(sessionTs);
  const monthKey = `${year}-${monthIndex}`;
  const yearStats = getOrCreateReplayYearStats(accumulator.yearStats, year);

  if (accumulator.firstSessionTs === null) {
    accumulator.firstSessionTs = sessionTs;
  }

  accumulator.maxSessionMinutes = Math.max(accumulator.maxSessionMinutes, minutes);
  accumulator.totalJackpots += entry.jackpot ? 1 : 0;
  accumulator.deepFocusCount += minutes >= 60 ? 1 : 0;
  accumulator.ultraFocusCount += minutes >= 90 ? 1 : 0;
  accumulator.titanFocusCount += minutes >= 120 ? 1 : 0;
  accumulator.legendFocusCount += minutes >= 180 ? 1 : 0;

  const nextDayCount = (accumulator.dayCounts.get(dayKey) ?? 0) + 1;
  accumulator.dayCounts.set(dayKey, nextDayCount);
  accumulator.maxSessionsInDay = Math.max(accumulator.maxSessionsInDay, nextDayCount);

  let dayMask = accumulator.dayParts.get(dayKey) ?? 0;
  if (hour >= 6 && hour < 12) dayMask |= 1;
  if (hour >= 12 && hour < 18) dayMask |= 2;
  if (hour >= 18 && hour < 23) dayMask |= 4;
  accumulator.dayParts.set(dayKey, dayMask);
  if (dayMask === 7) {
    accumulator.fullDaySet.add(dayKey);
  }

  accumulator.dow[dayOfWeek] += 1;
  accumulator.mon[monthIndex] += 1;

  const nextMonthSessionCount = (accumulator.monthSessionsByKey.get(monthKey) ?? 0) + 1;
  const nextMonthMinutes = (accumulator.monthMinutesByKey.get(monthKey) ?? 0) + minutes;
  accumulator.monthSessionsByKey.set(monthKey, nextMonthSessionCount);
  accumulator.monthMinutesByKey.set(monthKey, nextMonthMinutes);
  accumulator.bestMonthSessions = Math.max(accumulator.bestMonthSessions, nextMonthSessionCount);
  accumulator.bestMonthMinutes = Math.max(accumulator.bestMonthMinutes, nextMonthMinutes);

  yearStats.sessions += 1;
  yearStats.minutes += minutes;
  if (yearStats.monthCounts[monthIndex] === 0) {
    yearStats.activeMonthCount += 1;
  }
  yearStats.monthCounts[monthIndex] += 1;
  yearStats.bestMonthSessions = Math.max(yearStats.bestMonthSessions, yearStats.monthCounts[monthIndex]);
  if (monthIndex < 3) yearStats.q1Sessions += 1;
  else if (monthIndex < 6) yearStats.q2Sessions += 1;
  else if (monthIndex < 9) yearStats.q3Sessions += 1;
  else yearStats.q4Sessions += 1;

  if (
    yearStats.lastSessionTs !== null
    && (sessionTs - yearStats.lastSessionTs) / 86_400_000 >= 30
  ) {
    yearStats.hadComeback = true;
  }
  yearStats.lastSessionTs = sessionTs;

  const { month, day } = getVietnamDateParts(sessionTs);
  accumulator.calendarSet.add((month - 1) * 100 + day);

  accumulator.earlyBirdCount += hour < 7 ? 1 : 0;
  accumulator.nightOwlCount += hour >= 23 ? 1 : 0;
  accumulator.midnightCount += hour < 3 ? 1 : 0;
  accumulator.dawnCount += hour < 6 ? 1 : 0;
  accumulator.fiveAmCount += hour >= 5 && hour < 6 ? 1 : 0;
  accumulator.lunchCount += hour >= 12 && hour < 13 ? 1 : 0;
  accumulator.afternoonCount += hour >= 14 && hour < 17 ? 1 : 0;
  accumulator.eveningCount += hour >= 18 && hour < 22 ? 1 : 0;
  accumulator.teatimeCount += hour >= 15 && hour < 16 ? 1 : 0;
  accumulator.sunriseCount += hour >= 6 && hour < 7 ? 1 : 0;

  if (entry.note) {
    accumulator.totalNoteCount += 1;
    accumulator.longNoteCount += entry.note.length >= 150 ? 1 : 0;
  }
  if (entry.categoryId) {
    accumulator.categorySet.add(entry.categoryId);
  }
}

function buildAchievementSnapshotForReplay(progress, accumulator, streak, player, referenceTs) {
  const referenceYear = getVietnamYear(referenceTs);
  const thisYearStats = accumulator.yearStats.get(referenceYear) ?? createReplayYearStats();
  const daysSinceFirst = accumulator.firstSessionTs === null
    ? 0
    : Math.floor((referenceTs - accumulator.firstSessionTs) / 86_400_000);

  return {
    sessionsCompleted: progress.sessionsCompleted,
    totalFocusMinutes: progress.totalFocusMinutes,
    totalXP: player.totalEXP,
    activeBook: progress.activeBook,
    playerLevel: player.level,
    relicsCount: 0,
    blueprintsCount: 0,
    buildingsBuilt: 0,
    prestigeCount: 0,
    maxSessionMinutes: accumulator.maxSessionMinutes,
    totalJackpots: accumulator.totalJackpots,
    deepFocusCount: accumulator.deepFocusCount,
    ultraFocusCount: accumulator.ultraFocusCount,
    titanFocusCount: accumulator.titanFocusCount,
    legendFocusCount: accumulator.legendFocusCount,
    maxSessionsInDay: accumulator.maxSessionsInDay,
    fullDayCount: accumulator.fullDaySet.size,
    totalActiveDays: accumulator.dayCounts.size,
    daysSinceFirst,
    maxRankAchieved: 0,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    earlyBirdCount: accumulator.earlyBirdCount,
    nightOwlCount: accumulator.nightOwlCount,
    midnightCount: accumulator.midnightCount,
    dawnCount: accumulator.dawnCount,
    fiveAmCount: accumulator.fiveAmCount,
    lunchCount: accumulator.lunchCount,
    afternoonCount: accumulator.afternoonCount,
    eveningCount: accumulator.eveningCount,
    teatimeCount: accumulator.teatimeCount,
    sunriseCount: accumulator.sunriseCount,
    sessionsThisYear: thisYearStats.sessions,
    minutesThisYear: thisYearStats.minutes,
    monthsActiveThisYear: thisYearStats.activeMonthCount,
    hadComebackThisYear: thisYearStats.hadComeback,
    bestMonthSessionsThisYear: thisYearStats.bestMonthSessions,
    q1Sessions: thisYearStats.q1Sessions,
    q2Sessions: thisYearStats.q2Sessions,
    q3Sessions: thisYearStats.q3Sessions,
    q4Sessions: thisYearStats.q4Sessions,
    hasJan1Session: accumulator.calendarSet.has(1),
    hasDec31Session: accumulator.calendarSet.has(1131),
    hasDec25Session: accumulator.calendarSet.has(1125),
    hasFeb14Session: accumulator.calendarSet.has(114),
    hasMar14Session: accumulator.calendarSet.has(214),
    hasMar8Session: accumulator.calendarSet.has(208),
    hasNov20Session: accumulator.calendarSet.has(1020),
    hasJun21Session: accumulator.calendarSet.has(521),
    sunCount: accumulator.dow[0],
    monCount: accumulator.dow[1],
    tueCount: accumulator.dow[2],
    wedCount: accumulator.dow[3],
    thuCount: accumulator.dow[4],
    friCount: accumulator.dow[5],
    satCount: accumulator.dow[6],
    weekendCount: accumulator.dow[0] + accumulator.dow[6],
    weekdayCount: accumulator.dow[1] + accumulator.dow[2] + accumulator.dow[3] + accumulator.dow[4] + accumulator.dow[5],
    janCount: accumulator.mon[0],
    febCount: accumulator.mon[1],
    marCount: accumulator.mon[2],
    aprCount: accumulator.mon[3],
    mayCount: accumulator.mon[4],
    junCount: accumulator.mon[5],
    julCount: accumulator.mon[6],
    augCount: accumulator.mon[7],
    sepCount: accumulator.mon[8],
    octCount: accumulator.mon[9],
    novCount: accumulator.mon[10],
    decCount: accumulator.mon[11],
    bestMonthSessions: accumulator.bestMonthSessions,
    bestMonthMinutes: accumulator.bestMonthMinutes,
    totalNoteCount: accumulator.totalNoteCount,
    longNoteCount: accumulator.longNoteCount,
    uniqueCategoriesUsed: accumulator.categorySet.size,
  };
}

export function inferAchievementUnlockTimes(history = [], unlockedIds = [], existingTimeline = {}) {
  const missingIds = unlockedIds.filter((id) => !existingTimeline?.[id]?.unlockedAt);
  if (missingIds.length === 0 || history.length === 0) return {};

  const inferableTargets = ACHIEVEMENTS.filter(
    (achievement) => missingIds.includes(achievement.id) && isInferableAchievement(achievement),
  );
  if (inferableTargets.length === 0) return {};

  const replayHistory = history
    .map((entry) => {
      const ts = getSessionTs(entry);
      return ts ? { ...entry, __ts: ts } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.__ts - right.__ts);

  if (replayHistory.length === 0) return {};

  const inferred = {};
  const accumulator = createReplayAccumulator();
  const pendingTargets = [...inferableTargets];
  let progress = {
    sessionsCompleted: 0,
    totalFocusMinutes: 0,
    totalEP: 0,
    activeBook: 1,
  };
  let player = {
    level: 0,
    totalEXP: 0,
  };
  let streak = {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
  };

  for (const entry of replayHistory) {
    progress = {
      sessionsCompleted: progress.sessionsCompleted + 1,
      totalFocusMinutes: progress.totalFocusMinutes + (entry.minutes ?? 0),
      totalEP: progress.totalEP + (entry.epEarned ?? 0),
      activeBook: getActiveBook(progress.totalEP + (entry.epEarned ?? 0)),
    };

    const xpResult = computeLevelUps(player.totalEXP, entry.xpEarned ?? 0);
    player = {
      level: xpResult.newLevel,
      totalEXP: xpResult.newTotalEXP,
    };
    streak = advanceReplayStreak(streak, entry.__ts);
    updateReplayAccumulator(accumulator, entry);

    const snapshot = buildAchievementSnapshotForReplay(progress, accumulator, streak, player, entry.__ts);
    for (let index = pendingTargets.length - 1; index >= 0; index -= 1) {
      const achievement = pendingTargets[index];
      if (achievement.check(snapshot, unlockedIds)) {
        inferred[achievement.id] = new Date(entry.__ts).toISOString();
        pendingTargets.splice(index, 1);
      }
    }

    if (pendingTargets.length === 0) break;
  }

  return inferred;
}
