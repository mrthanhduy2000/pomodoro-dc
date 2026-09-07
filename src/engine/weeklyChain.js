/**
 * weeklyChain.js — the weekly step chain as a PURE module (ADR-077, 2026-09-06).
 *
 * Moved out of `store/gameStore.js` (~250 lines). No store, no DOM. The clock enters only through
 * a `now` argument (default `Date.now()`), so tests can pin the week and the store passes the same
 * `now` it already uses for streak/day rebuilds.
 *
 * Shape of `weeklyChain` in the save is unchanged: { weekKey, chainIndex, currentStep, stepProgress,
 * bonusClaimed, recentHistory } — the picker is seeded by `weekly:<weekKey>`, so a save re-rolled on
 * a different machine lands on the same chain.
 */
import {
  PERFECT_PLAN_WEEKLY_MULTIPLIER,
  WEEKLY_CHAIN_XP_SCALE,
  WEEKLY_CHAINS,
} from './constants';
import { isCancelledHistoryEntry } from './gameMath';
import { localDateStr, localWeekMondayStr } from './time';
import { createSeededRng } from './seededRng';
import { qualifiesAsMissionNote } from './missions';

export const WEEKLY_CHAIN_HISTORY_LIMIT = 10;

/** Week key = the Monday (Vietnam time) of the week containing `ts`. */
export function getWeekMonday(ts = Date.now()) {
  return localWeekMondayStr(ts);
}

export const makeDefaultWeeklyChain = () => ({
  weekKey: null,
  chainIndex: 0,
  currentStep: 0,
  stepProgress: 0,
  bonusClaimed: false,
  recentHistory: [],
});

function normalizeWeeklyChainHistoryEntry(entry) {
  if (!entry?.weekKey || !entry?.chainId) return null;
  return {
    weekKey: entry.weekKey,
    chainId: entry.chainId,
    stepTypes: Array.isArray(entry.stepTypes) ? entry.stepTypes : [],
  };
}

function createWeeklyChainHistoryEntry(weekKey, chainIndex) {
  if (!weekKey || !Number.isFinite(chainIndex) || !WEEKLY_CHAINS[chainIndex]) return null;
  return {
    weekKey,
    chainId: WEEKLY_CHAINS[chainIndex].id,
    stepTypes: [...new Set(WEEKLY_CHAINS[chainIndex].steps.map((step) => step.type))],
  };
}

export function rollWeeklyChainHistory(wc, nextWeekKey) {
  let recentHistory = Array.isArray(wc?.recentHistory)
    ? wc.recentHistory.map(normalizeWeeklyChainHistoryEntry).filter((entry) => entry?.weekKey && entry.weekKey !== nextWeekKey)
    : [];
  if (wc?.weekKey && wc.weekKey !== nextWeekKey) {
    const currentEntry = createWeeklyChainHistoryEntry(wc.weekKey, wc.chainIndex);
    if (currentEntry && !recentHistory.some((entry) => entry.weekKey === currentEntry.weekKey)) {
      recentHistory = [currentEntry, ...recentHistory];
    }
  }
  return recentHistory.slice(0, WEEKLY_CHAIN_HISTORY_LIMIT);
}

export function scoreWeeklyChainCandidate(chainIndex, recentHistory = []) {
  const chain = WEEKLY_CHAINS[chainIndex];
  if (!chain) return Number.NEGATIVE_INFINITY;
  const chainId = chain.id;
  const stepTypes = [...new Set(chain.steps.map((step) => step.type))];
  const stepTypeSet = new Set(stepTypes);
  const recentUses = recentHistory.filter((entry) => entry.chainId === chainId).length;
  let score = 0;
  stepTypes.forEach((type) => {
    if (type === 'perfectBreaks' || type === 'balancedDays' || type === 'deepSessions') score += 0.45;
    if (type === 'sessions' || type === 'focusMinutes') score -= 0.1;
  });
  score -= recentUses * 2.4;
  recentHistory.forEach((entry, index) => {
    const recencyWeight = Math.max(0.4, 1 - index * 0.18);
    const priorTypes = new Set(entry.stepTypes ?? []);
    if (entry.chainId === chainId) score -= 10 * recencyWeight;
    stepTypeSet.forEach((type) => {
      score += priorTypes.has(type) ? -0.45 * recencyWeight : 0.12 * recencyWeight;
    });
  });
  return score;
}

export function pickChainForWeek(weekKey, recentHistory = []) {
  const rng = createSeededRng(`weekly:${weekKey}`);
  const allChainIndexes = WEEKLY_CHAINS.map((_, chainIndex) => chainIndex);
  const recentWindow = Math.min(WEEKLY_CHAINS.length - 2, recentHistory.length);
  const blockedIds = new Set(recentHistory.slice(0, recentWindow).map((entry) => entry.chainId));
  const candidateIndexes = allChainIndexes.filter((chainIndex) => !blockedIds.has(WEEKLY_CHAINS[chainIndex].id));
  const pool = candidateIndexes.length > 0 ? candidateIndexes : allChainIndexes;
  const candidates = pool.map((chainIndex) => ({
    chainIndex,
    score: scoreWeeklyChainCandidate(chainIndex, recentHistory) + rng() * 0.35,
  }));
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.chainIndex ?? 0;
}

/** New week ⇒ new chain; same week ⇒ the object is returned untouched (reference-stable). */
export function refreshWeeklyChain(wc, { now = Date.now() } = {}) {
  const monday = getWeekMonday(now);
  if (wc.weekKey === monday) return wc;
  const recentHistory = rollWeeklyChainHistory(wc, monday);
  return {
    weekKey: monday,
    chainIndex: pickChainForWeek(monday, recentHistory),
    currentStep: 0,
    stepProgress: 0,
    bonusClaimed: false,
    recentHistory,
  };
}

/** Entries whose session OR whose on-time break falls inside `weekKey`. */
export function getHistoryWeekEntries(history, weekKey) {
  return (history ?? []).filter((entry) => {
    if (isCancelledHistoryEntry(entry)) return false;
    const sessionTs = new Date(entry.timestamp).getTime();
    const breakTs = entry.breakCompletedAt ? new Date(entry.breakCompletedAt).getTime() : NaN;
    const sessionMatches = Number.isFinite(sessionTs) && getWeekMonday(sessionTs) === weekKey;
    const breakMatches = Number.isFinite(breakTs) && getWeekMonday(breakTs) === weekKey;
    return sessionMatches || breakMatches;
  });
}

export function buildWeeklyProgressSnapshot(weekEntries = [], weekKey = null) {
  const categorySet = new Set();
  const activeDays = new Set();
  const balancedDayMap = {};
  let sessions = 0; let focusMinutes = 0; let notes = 0; let deepSessions = 0; let perfectBreaks = 0; let maxSessionMinutes = 0;
  weekEntries.forEach((entry) => {
    if (!entry || isCancelledHistoryEntry(entry)) return;
    const sessionTs = new Date(entry.timestamp).getTime();
    const sessionInWeek = Number.isFinite(sessionTs) && (!weekKey || getWeekMonday(sessionTs) === weekKey);
    const breakTs = entry.breakCompletedAt
      ? new Date(entry.breakCompletedAt).getTime()
      : (entry.breakCompletedOnTime ? sessionTs : NaN);
    const breakInWeek = Number.isFinite(breakTs) && (!weekKey || getWeekMonday(breakTs) === weekKey);
    const minutes = Number(entry.minutes) || 0;
    if (sessionInWeek) {
      sessions += 1;
      focusMinutes += minutes;
      maxSessionMinutes = Math.max(maxSessionMinutes, minutes);
      if (entry.categoryId) categorySet.add(entry.categoryId);
      if (qualifiesAsMissionNote(entry.note)) notes += 1;
      if (minutes >= 45) deepSessions += 1;
      const dayKey = localDateStr(new Date(sessionTs));
      activeDays.add(dayKey);
      const day = balancedDayMap[dayKey] ?? { hasShort: false, hasLong: false };
      day.hasShort = day.hasShort || minutes <= 25;
      day.hasLong = day.hasLong || minutes >= 60;
      balancedDayMap[dayKey] = day;
    }
    if (entry.breakCompletedOnTime && breakInWeek) perfectBreaks += 1;
  });
  const balancedDays = Object.values(balancedDayMap).filter((day) => day.hasShort && day.hasLong).length;
  return {
    sessions, focusMinutes, uniqueCategories: categorySet.size, notes, daysActive: activeDays.size,
    deepSessions, balancedDays, perfectBreaks, maxSessionMinutes,
  };
}

export function getWeeklyStepProgress(step, snapshot) {
  if (!step) return 0;
  switch (step.type) {
    case 'sessions': return Math.min(step.goal, snapshot.sessions);
    case 'focusMinutes': return Math.min(step.goal, snapshot.focusMinutes);
    case 'singleSession': return Math.min(step.goal, snapshot.maxSessionMinutes);
    case 'uniqueCategories': return Math.min(step.goal, snapshot.uniqueCategories);
    case 'notes': return Math.min(step.goal, snapshot.notes);
    case 'daysActive': return Math.min(step.goal, snapshot.daysActive);
    case 'deepSessions': return Math.min(step.goal, snapshot.deepSessions);
    case 'balancedDays': return Math.min(step.goal, snapshot.balancedDays);
    case 'perfectBreaks': return Math.min(step.goal, snapshot.perfectBreaks);
    default: return 0;
  }
}

/**
 * ADR-070 — steps close themselves. Called by `completeFocusSession` with the week snapshot that
 * already includes the finished session; several steps may close at once. XP joins the session's
 * XP (one level-up pass), bonus SP goes to `player.sp`, and skill buffs (Cử Tri · Kế Hoạch Hoàn Hảo)
 * are queued by the caller. Same XP formula as the old «Chốt bước» button, minus the dormant RP part.
 */
export function autoClaimWeeklySteps({ weeklyChain, weeklySnapshot, unlockedSkills = {}, now = Date.now() } = {}) {
  const chainMeta = WEEKLY_CHAINS[weeklyChain?.chainIndex];
  const idle = { weeklyChain, steps: [], xp: 0, bonusSP: 0, cuTriPushes: 0, keHoachNextWeekKey: null, finished: false, title: chainMeta?.title ?? null };
  if (!chainMeta) return idle;
  const perfectPlan = !!unlockedSkills.ke_hoach_hoan_hao;
  let chain = { ...weeklyChain };
  const steps = [];
  let xp = 0; let bonusSP = 0; let cuTriPushes = 0; let keHoachNextWeekKey = null;
  while (chain.currentStep < chainMeta.steps.length) {
    const step = chainMeta.steps[chain.currentStep];
    const progress = getWeeklyStepProgress(step, weeklySnapshot);
    if (progress < step.goal) { chain = { ...chain, stepProgress: progress }; break; }
    const isLast = chain.currentStep >= chainMeta.steps.length - 1;
    const bonusXP = isLast && !chain.bonusClaimed ? chainMeta.bonusXP : 0;
    const stepSP = isLast && !chain.bonusClaimed ? chainMeta.bonusSP : 0;
    const base = perfectPlan ? (step.rewardXP + bonusXP) * PERFECT_PLAN_WEEKLY_MULTIPLIER : step.rewardXP + bonusXP;
    const stepXP = Math.round(base * WEEKLY_CHAIN_XP_SCALE);
    xp += stepXP;
    bonusSP += stepSP;
    if (unlockedSkills.cu_tri) cuTriPushes += 1;
    if (isLast && perfectPlan) keHoachNextWeekKey = localWeekMondayStr(now + 7 * 86_400_000);
    steps.push({ index: chain.currentStep, total: chainMeta.steps.length, label: step.label, xp: stepXP, isLast, bonusSP: stepSP });
    const nextIndex = chain.currentStep + 1;
    chain = {
      ...chain,
      currentStep: nextIndex,
      bonusClaimed: isLast ? true : chain.bonusClaimed,
      stepProgress: nextIndex < chainMeta.steps.length ? getWeeklyStepProgress(chainMeta.steps[nextIndex], weeklySnapshot) : 0,
    };
  }
  return { weeklyChain: chain, steps, xp, bonusSP, cuTriPushes, keHoachNextWeekKey, finished: chain.currentStep >= chainMeta.steps.length, title: chainMeta.title };
}

/** Reload path: replay this week's history against the chain (never claims further than history supports). */
export function rebuildWeeklyChainFromHistory(weeklyChain, history, { now = Date.now() } = {}) {
  const activeChain = refreshWeeklyChain(weeklyChain, { now });
  const chain = WEEKLY_CHAINS[activeChain.chainIndex];
  if (!chain) return activeChain;
  const weekEntries = getHistoryWeekEntries(history, activeChain.weekKey);
  const snapshot = buildWeeklyProgressSnapshot(weekEntries, activeChain.weekKey);
  const previouslyClaimedSteps = Math.max(0, Math.min(activeChain.currentStep ?? 0, chain.steps.length));
  let currentStep = 0;
  while (currentStep < previouslyClaimedSteps && currentStep < chain.steps.length) {
    const step = chain.steps[currentStep];
    if (getWeeklyStepProgress(step, snapshot) < step.goal) break;
    currentStep += 1;
  }
  const activeStep = chain.steps[currentStep];
  return {
    ...activeChain,
    currentStep,
    stepProgress: activeStep ? getWeeklyStepProgress(activeStep, snapshot) : 0,
    bonusClaimed: currentStep >= chain.steps.length ? activeChain.bonusClaimed : false,
  };
}

/** Week snapshot for a session that has just finished: this week's history plus the session itself. */
export function weeklySnapshotWithSession(history, weekKey, sessionEntry) {
  return buildWeeklyProgressSnapshot([...getHistoryWeekEntries(history, weekKey), sessionEntry], weekKey);
}
