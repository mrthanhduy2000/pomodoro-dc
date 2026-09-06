/**
 * missions.js — daily missions as a PURE module (ADR-076, 2026-09-06).
 *
 * Everything here used to live inline in `store/gameStore.js` (~250 lines) next to the Zustand
 * actions. Nothing reads the store, the DOM or the clock: the two functions that need "today" take a
 * `today` key (default `localDateStr()`), so a test can pin the day.
 *
 * ONE LAW, ONE FORMULA: progress is always derived from a DAY SNAPSHOT of history
 * (`buildDailyProgressSnapshotFromHistory` → `getDailyMissionProgressFromSnapshot`). The store's
 * "live" tick after a session no longer keeps a second, hand-written copy of that formula — it calls
 * `tickDailyMissions`, which rebuilds from history PLUS the just-finished session. Before this the
 * live path and the reload path disagreed on `singleSession` (0/30 vs 22/30 after a reload).
 */
import {
  DAILY_MISSION_XP_SCALE,
  DAILY_RARE_BUCKET_CHANCE_MAX,
  DAILY_RARE_BUCKET_CHANCE_MIN,
  MISSION_ALL_BONUS_XP,
  MISSION_CATALOG,
  MISSION_NOTE_MIN_WORDS,
  MISSIONS_PER_DAY,
  STREAK_MISSION_BASE_XP,
  STREAK_MISSION_MAX_XP,
  STREAK_MISSION_MIN_STREAK,
  STREAK_MISSION_XP_PER_DAY,
} from './constants';
import { getCompletedHistoryEntries } from './gameMath';
import { localDateStr } from './time';
import { missionXpMultiplier } from './wonderEffects.js';
import { createSeededRng } from './seededRng';
import { countRichTextWords } from '../utils/richText';

export const DAILY_MISSION_HISTORY_LIMIT = 8;
export const DAILY_MISSION_VARIANT_COUNT = 10;

export const makeDefaultMissions = () => ({
  date: null,
  list: [],
  bonusClaimedToday: false,
  bonusClaimedXP: 0,
  streakMissionClaimedToday: false,
  recentHistory: [],
});

/** A note counts for the "notes" mission only when it is a real sentence, not a tag. */
export function qualifiesAsMissionNote(text = '') {
  return countRichTextWords(text ?? '') >= MISSION_NOTE_MIN_WORDS;
}

/**
 * Mission XP after the scale and the building multiplier — the ONLY formula, used by the store to
 * GRANT and by `DailyMissions.jsx` / the reward story to SHOW (the display copy that used to live in
 * `components/missionXp.js` is gone; two copies of this drifted apart on days with a wonder bonus).
 */
export function scaleMissionXP(xp, multiplier = 1) {
  return Math.max(0, Math.round((xp ?? 0) * DAILY_MISSION_XP_SCALE * multiplier));
}

export function applyDailyMissionXPBonus(buildings, xpAmount) {
  return scaleMissionXP(xpAmount, missionXpMultiplier(buildings));
}

export function getMissionRewardTotalXP(list = []) {
  return list.reduce((sum, mission) => sum + (mission?.rewardXP ?? 0), 0);
}

/** "All done today" bonus: fixed part + (Bậc Thầy Chiến Lược) the XP of every mission again. */
export function dailyAllBonusXP({ list = [], multiplier = 1, strategist = false } = {}) {
  const base = scaleMissionXP(MISSION_ALL_BONUS_XP, multiplier);
  return strategist ? base + scaleMissionXP(getMissionRewardTotalXP(list), multiplier) : base;
}

export function getDailyMissionAllBonusXP(missions, buildings = [], unlockedSkills = {}) {
  return dailyAllBonusXP({
    list: missions?.list ?? [], multiplier: missionXpMultiplier(buildings), strategist: !!unlockedSkills.bac_thay_chien_luoc,
  });
}

/** Streak mission XP (before the building multiplier): from day 7 on, once per day. */
export function streakMissionXPBase(currentStreak, alreadyClaimedToday) {
  if (alreadyClaimedToday || (currentStreak ?? 0) < STREAK_MISSION_MIN_STREAK) return 0;
  return Math.min(
    STREAK_MISSION_BASE_XP + (currentStreak - STREAK_MISSION_MIN_STREAK) * STREAK_MISSION_XP_PER_DAY,
    STREAK_MISSION_MAX_XP,
  );
}

/** Saves store the mission id + progress; label/goal/reward are re-read from the catalog. */
export function normalizeMissionTemplate(mission) {
  if (!mission?.id) return mission ?? null;
  const template = MISSION_CATALOG.find((entry) => entry.id === mission.id);
  if (!template) return mission;
  return {
    ...mission,
    ...template,
    progress: Number.isFinite(mission.progress) ? mission.progress : 0,
    claimed: Boolean(mission.claimed),
    family: template.family ?? mission.family,
    bucket: template.bucket ?? mission.bucket,
    weight: template.weight ?? mission.weight ?? 1,
  };
}

export function normalizeStoredMissions(missions) {
  const list = Array.isArray(missions?.list)
    ? missions.list.map(normalizeMissionTemplate).filter((mission) => mission?.id)
    : [];
  const recentHistory = Array.isArray(missions?.recentHistory)
    ? missions.recentHistory.filter((entry) => entry?.date)
    : [];
  return {
    ...makeDefaultMissions(),
    ...missions,
    date: typeof missions?.date === 'string' ? missions.date : null,
    list,
    recentHistory,
    bonusClaimedToday: Boolean(missions?.bonusClaimedToday),
    bonusClaimedXP: Number.isFinite(missions?.bonusClaimedXP)
      ? Math.max(0, Math.round(missions.bonusClaimedXP))
      : 0,
    streakMissionClaimedToday: Boolean(missions?.streakMissionClaimedToday),
  };
}

function weightedPick(list, rng) {
  if (list.length === 0) return null;
  const totalWeight = list.reduce((sum, mission) => sum + Math.max(0.01, mission.weight ?? 1), 0);
  let roll = rng() * totalWeight;
  for (const mission of list) {
    roll -= Math.max(0.01, mission.weight ?? 1);
    if (roll <= 0) return mission;
  }
  return list[list.length - 1];
}

function createMissionHistoryEntry(date, list = []) {
  const normalized = list.map(normalizeMissionTemplate).filter(Boolean);
  if (!date || normalized.length === 0) return null;
  return {
    date,
    ids: normalized.map((mission) => mission.id),
    families: [...new Set(normalized.map((mission) => mission.family).filter(Boolean))],
  };
}

function historyEntryHasRareMission(entry) {
  const ids = Array.isArray(entry?.ids) ? entry.ids : [];
  return ids.some((missionId) => MISSION_CATALOG.some((mission) => mission.id === missionId && mission.bucket === 'rare'));
}

export function rollMissionHistory(missions, nextDate) {
  let recentHistory = Array.isArray(missions?.recentHistory)
    ? missions.recentHistory.filter((entry) => entry?.date && entry.date !== nextDate)
    : [];
  if (missions?.date && missions.date !== nextDate) {
    const todayEntry = createMissionHistoryEntry(missions.date, missions.list);
    if (todayEntry && !recentHistory.some((entry) => entry.date === todayEntry.date)) {
      recentHistory = [todayEntry, ...recentHistory];
    }
  }
  return recentHistory.slice(0, DAILY_MISSION_HISTORY_LIMIT);
}

export function scoreMissionCandidate(candidate, recentHistory = []) {
  const candidateIds = candidate.map((mission) => mission.id);
  const candidateIdSet = new Set(candidateIds);
  const candidateFamilies = candidate.map((mission) => mission.family).filter(Boolean);
  const candidateFamilySet = new Set(candidateFamilies);
  const candidateSignature = [...candidateIds].sort().join('|');

  let score = candidate.reduce((sum, mission) => {
    let nextScore = sum + (mission.weight ?? 1);
    if (mission.family === 'blueprints') nextScore -= 0.5;
    if (mission.family === 'deepSessions' || mission.family === 'balancedSessions') nextScore += 0.4;
    return nextScore;
  }, 0);

  recentHistory.forEach((entry, index) => {
    const recencyWeight = Math.max(0.35, 1 - index * 0.15);
    const entryIds = new Set(Array.isArray(entry?.ids) ? entry.ids : []);
    const entryFamilies = new Set(Array.isArray(entry?.families) ? entry.families : []);
    const entrySignature = [...entryIds].sort().join('|');
    if (entrySignature && entrySignature === candidateSignature) score -= 12 * recencyWeight;
    candidateIdSet.forEach((missionId) => {
      score += entryIds.has(missionId) ? -4.5 * recencyWeight : 1.1 * recencyWeight;
    });
    candidateFamilySet.forEach((family) => {
      score += entryFamilies.has(family) ? -0.4 * recencyWeight : 0.25 * recencyWeight;
    });
  });
  return score;
}

function pickMissionForBucket(bucket, rng, usedIds, usedFamilies) {
  const basePool = MISSION_CATALOG.filter((mission) => mission.bucket === bucket && !usedIds.has(mission.id));
  const distinctFamilyPool = basePool.filter((mission) => !usedFamilies.has(mission.family));
  const fallbackPool = distinctFamilyPool.length > 0
    ? distinctFamilyPool
    : (basePool.length > 0 ? basePool : MISSION_CATALOG.filter((mission) => !usedIds.has(mission.id)));
  return weightedPick(fallbackPool, rng);
}

export function shouldIncludeRareMission(dateStr, recentHistory = []) {
  if (!MISSION_CATALOG.some((mission) => mission.bucket === 'rare')) return false;
  if (recentHistory.slice(0, 2).some(historyEntryHasRareMission)) return false;
  const rareChance = DAILY_RARE_BUCKET_CHANCE_MIN
    + createSeededRng(`daily-rare-chance:${dateStr}`)() * (DAILY_RARE_BUCKET_CHANCE_MAX - DAILY_RARE_BUCKET_CHANCE_MIN);
  const rareRoll = createSeededRng(`daily-rare-roll:${dateStr}`)();
  return rareRoll < rareChance;
}

export function buildDailyMissionVariant(dateStr, variant, { includeRare = false } = {}) {
  const rng = createSeededRng(`daily:${dateStr}:${includeRare ? 'rare' : 'normal'}:${variant}`);
  const buckets = ['core', includeRare ? 'rare' : 'stretch', 'variety'];
  const usedIds = new Set();
  const usedFamilies = new Set();
  const selected = [];
  for (const bucket of buckets.slice(0, MISSIONS_PER_DAY)) {
    const mission = pickMissionForBucket(bucket, rng, usedIds, usedFamilies)
      ?? (bucket === 'rare' ? pickMissionForBucket('stretch', rng, usedIds, usedFamilies) : null);
    if (!mission) continue;
    usedIds.add(mission.id);
    usedFamilies.add(mission.family);
    selected.push({ ...mission, progress: 0, claimed: false });
  }
  return selected;
}

/** Best-scoring variant for the day: deterministic for (date, recent history). */
export function pickDailyMissions(dateStr, previousList = []) {
  const includeRare = shouldIncludeRareMission(dateStr, previousList);
  const variants = Array.from({ length: DAILY_MISSION_VARIANT_COUNT }, (_, variant) => (
    buildDailyMissionVariant(dateStr, variant, { includeRare })
  )).filter((candidate) => candidate.length > 0);
  if (variants.length === 0) return [];
  let bestCandidate = variants[0];
  let bestScore = scoreMissionCandidate(bestCandidate, previousList);
  for (const candidate of variants.slice(1)) {
    const score = scoreMissionCandidate(candidate, previousList);
    if (score > bestScore) { bestCandidate = candidate; bestScore = score; }
  }
  return bestCandidate;
}

/** Re-roll when the stored day is not `today`; otherwise normalize in place. */
export function refreshMissionsIfStale(missions, { today = localDateStr() } = {}) {
  const normalizedMissions = normalizeStoredMissions(missions);
  if (normalizedMissions.date === today && normalizedMissions.list.length > 0) return normalizedMissions;
  const recentHistory = rollMissionHistory(normalizedMissions, today);
  return {
    ...normalizedMissions,
    date: today,
    list: pickDailyMissions(today, recentHistory),
    bonusClaimedToday: false,
    bonusClaimedXP: 0,
    streakMissionClaimedToday: false,
    recentHistory,
  };
}

/** What one day of history looks like to the mission table — the single denominator for progress. */
export function buildDailyProgressSnapshotFromHistory(history = [], dayKey = localDateStr()) {
  const completedEntries = getCompletedHistoryEntries(history);
  const dayEntries = completedEntries.filter((entry) => localDateStr(entry.timestamp) === dayKey);
  const categorySet = new Set(dayEntries.map((entry) => entry.categoryId).filter(Boolean));
  const minutes = dayEntries.reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0);
  const notes = dayEntries.filter((entry) => qualifiesAsMissionNote(entry.note)).length;
  const hasShortSession = dayEntries.some((entry) => (entry.minutes ?? 0) <= 25);
  const hasLongSession = dayEntries.some((entry) => (entry.minutes ?? 0) >= 60);
  const perfectBreaks = completedEntries.filter((entry) => {
    if (!entry?.breakCompletedOnTime) return false;
    return localDateStr(entry.breakCompletedAt ?? entry.timestamp) === dayKey;
  }).length;
  return {
    sessions: dayEntries.length,
    focusMinutes: minutes,
    maxSessionMinutes: dayEntries.reduce((max, entry) => Math.max(max, entry.minutes ?? 0), 0),
    uniqueCategories: categorySet.size,
    deepSessions: dayEntries.filter((entry) => (entry.minutes ?? 0) >= 45).length,
    notes,
    balancedSessions: hasShortSession && hasLongSession ? 1 : 0,
    perfectBreaks,
  };
}

export function getDailyMissionProgressFromSnapshot(mission, snapshot) {
  if (!mission) return 0;
  switch (mission.type) {
    case 'sessions': return Math.min(mission.goal, snapshot.sessions);
    case 'focusMinutes': return Math.min(mission.goal, snapshot.focusMinutes);
    case 'singleSession': return Math.min(mission.goal, snapshot.maxSessionMinutes);
    case 'uniqueCategories': return Math.min(mission.goal, snapshot.uniqueCategories);
    case 'deepSessions': return Math.min(mission.goal, snapshot.deepSessions);
    case 'notes': return Math.min(mission.goal, snapshot.notes);
    case 'balancedSessions': return Math.min(mission.goal, snapshot.balancedSessions);
    case 'perfectBreaks': return Math.min(mission.goal, snapshot.perfectBreaks);
    default: return Number.isFinite(mission.progress) ? Math.max(0, mission.progress) : 0;
  }
}

/** Rebuild today's list from history — the reload path AND (via `tickDailyMissions`) the live path. */
export function rebuildMissionsFromHistory(missions, history, nextStreak, { today = localDateStr() } = {}) {
  const refreshed = refreshMissionsIfStale(missions, { today });
  const dayKey = refreshed.date ?? today;
  const snapshot = buildDailyProgressSnapshotFromHistory(history, dayKey);
  const list = (refreshed.list ?? []).map((mission) => {
    const progress = getDailyMissionProgressFromSnapshot(mission, snapshot);
    return { ...mission, progress, claimed: progress >= mission.goal };
  });
  const allClaimed = list.length > 0 && list.every((mission) => mission.claimed);
  const streakEligible = (nextStreak?.currentStreak ?? 0) >= STREAK_MISSION_MIN_STREAK;
  return {
    ...refreshed,
    list,
    bonusClaimedToday: allClaimed ? refreshed.bonusClaimedToday : false,
    bonusClaimedXP: allClaimed && refreshed.bonusClaimedToday ? refreshed.bonusClaimedXP : 0,
    streakMissionClaimedToday: streakEligible ? refreshed.streakMissionClaimedToday : false,
  };
}

/**
 * The live tick after a completed session (ADR-070 reconciliation + ADR-076 single formula).
 * `sessionEntry` is the just-finished session in history-entry shape; it is prepended to `history`
 * so progress is computed by the same snapshot the reload path uses. Returns the new `missions`
 * slice plus the XP that landed this session.
 */
export function tickDailyMissions({
  missions, history = [], streak, buildings = [], unlockedSkills = {}, sessionEntry, today = localDateStr(),
} = {}) {
  const before = rebuildMissionsFromHistory(missions, history, streak, { today });
  const after = rebuildMissionsFromHistory(before, [sessionEntry, ...(history ?? [])], streak, { today });
  const doneBefore = new Set(before.list.filter((m) => m.claimed).map((m) => m.id));
  const newlyCompletedMissionIds = after.list.filter((m) => m.claimed && !doneBefore.has(m.id)).map((m) => m.id);
  const missionBonusXP = applyDailyMissionXPBonus(buildings, newlyCompletedMissionIds.reduce((sum, id) => (
    sum + (after.list.find((m) => m.id === id)?.rewardXP ?? 0)
  ), 0));
  const streakMissionXP = applyDailyMissionXPBonus(
    buildings, streakMissionXPBase(streak?.currentStreak, before.streakMissionClaimedToday),
  );
  const allDailyDoneNow = after.list.length > 0 && after.list.every((m) => m.claimed);
  const dailyBonusXP = allDailyDoneNow && !before.bonusClaimedToday
    ? getDailyMissionAllBonusXP({ list: after.list }, buildings, unlockedSkills)
    : 0;
  return {
    missions: {
      ...after,
      streakMissionClaimedToday: streakMissionXP > 0 ? true : before.streakMissionClaimedToday,
      bonusClaimedToday: before.bonusClaimedToday || dailyBonusXP > 0,
      bonusClaimedXP: dailyBonusXP > 0 ? dailyBonusXP : before.bonusClaimedXP,
    },
    newlyCompletedMissionIds,
    missionBonusXP,
    streakMissionXP,
    dailyBonusXP,
  };
}
