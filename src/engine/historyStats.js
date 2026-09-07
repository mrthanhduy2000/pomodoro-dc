/**
 * historyStats.js — Denormalised history statistics (best session, jackpots, goal review counts): default, incremental delta and full rebuild. Moved verbatim out of gameStore.js (ADR-078).
 *
 * Comments inside are the originals (Vietnamese where they were written so); the rules they
 * explain have not changed by moving. Pure: no store, no DOM.
 */
import { isCancelledHistoryEntry } from './gameMath';

export const makeDefaultHistoryStats = () => ({
  bestSessionMinutes: 0,
  bestSessionXP: 0,
  bestSessionId: null,
  totalJackpots: 0,
  totalBlueprints: 0,
  cancelledSessions: 0,
  cancelledMinutes: 0,
  sessionsWithGoal: 0,
  reviewedCount: 0,
  achievedCount: 0,
  missedCount: 0,
  pendingCount: 0,
});

export function getHistoryReviewStatsContribution(entry = null) {
  const goal = typeof entry?.goal === 'string' ? entry.goal.trim() : '';
  if (!goal) {
    return {
      sessionsWithGoal: 0,
      reviewedCount: 0,
      achievedCount: 0,
      missedCount: 0,
      pendingCount: 0,
    };
  }

  if (entry?.goalAchieved === true) {
    return {
      sessionsWithGoal: 1,
      reviewedCount: 1,
      achievedCount: 1,
      missedCount: 0,
      pendingCount: 0,
    };
  }

  if (entry?.goalAchieved === false) {
    return {
      sessionsWithGoal: 1,
      reviewedCount: 1,
      achievedCount: 0,
      missedCount: 1,
      pendingCount: 0,
    };
  }

  return {
    sessionsWithGoal: 1,
    reviewedCount: 0,
    achievedCount: 0,
    missedCount: 0,
    pendingCount: 1,
  };
}

export function applyHistoryReviewStatsDelta(historyStats, previousEntry = null, nextEntry = null) {
  const previousSummary = getHistoryReviewStatsContribution(previousEntry);
  const nextSummary = getHistoryReviewStatsContribution(nextEntry);

  return {
    ...historyStats,
    sessionsWithGoal: Math.max(0, historyStats.sessionsWithGoal - previousSummary.sessionsWithGoal + nextSummary.sessionsWithGoal),
    reviewedCount: Math.max(0, historyStats.reviewedCount - previousSummary.reviewedCount + nextSummary.reviewedCount),
    achievedCount: Math.max(0, historyStats.achievedCount - previousSummary.achievedCount + nextSummary.achievedCount),
    missedCount: Math.max(0, historyStats.missedCount - previousSummary.missedCount + nextSummary.missedCount),
    pendingCount: Math.max(0, historyStats.pendingCount - previousSummary.pendingCount + nextSummary.pendingCount),
  };
}

export function buildHistoryStatsFromHistory(history = []) {
  let bestSessionMinutes = 0;
  let bestSessionXP = 0;
  let bestSessionId = null;
  let totalJackpots = 0;
  let totalBlueprints = 0;
  let cancelledSessions = 0;
  let cancelledMinutes = 0;
  let sessionsWithGoal = 0;
  let reviewedCount = 0;
  let achievedCount = 0;
  let missedCount = 0;
  let pendingCount = 0;

  for (const entry of history) {
    const minutes = Number.isFinite(entry?.minutes) ? entry.minutes : 0;
    const xpEarned = Number.isFinite(entry?.xpEarned ?? entry?.epEarned)
      ? (entry.xpEarned ?? entry.epEarned)
      : 0;
    const isCancelled = isCancelledHistoryEntry(entry);

    if (isCancelled) {
      cancelledSessions += 1;
      cancelledMinutes += minutes;
    }

    if (!isCancelled && minutes > bestSessionMinutes) {
      bestSessionMinutes = minutes;
      bestSessionXP = xpEarned;
      bestSessionId = entry?.id ?? null;
    }

    if (!isCancelled && entry?.jackpot) totalJackpots += 1;
    if (!isCancelled && ((entry?.refinedEarned ?? 0) > 0 || minutes >= 45)) totalBlueprints += 1;

    const reviewStats = getHistoryReviewStatsContribution(entry);
    sessionsWithGoal += reviewStats.sessionsWithGoal;
    reviewedCount += reviewStats.reviewedCount;
    achievedCount += reviewStats.achievedCount;
    missedCount += reviewStats.missedCount;
    pendingCount += reviewStats.pendingCount;
  }

  return {
    bestSessionMinutes,
    bestSessionXP,
    bestSessionId,
    totalJackpots,
    totalBlueprints,
    cancelledSessions,
    cancelledMinutes,
    sessionsWithGoal,
    reviewedCount,
    achievedCount,
    missedCount,
    pendingCount,
  };
}

export function normalizeStoredHistoryStats(historyStats = {}, history = []) {
  const fallback = buildHistoryStatsFromHistory(history);
  const hasStoredBest =
    Number.isFinite(historyStats?.bestSessionMinutes)
    && historyStats.bestSessionMinutes >= 0
    && Number.isFinite(historyStats?.bestSessionXP)
    && historyStats.bestSessionXP >= 0;

  return {
    bestSessionMinutes: hasStoredBest ? historyStats.bestSessionMinutes : fallback.bestSessionMinutes,
    bestSessionXP: hasStoredBest ? historyStats.bestSessionXP : fallback.bestSessionXP,
    bestSessionId: hasStoredBest ? (historyStats.bestSessionId ?? null) : fallback.bestSessionId,
    totalJackpots: Number.isFinite(historyStats?.totalJackpots)
      ? Math.max(0, historyStats.totalJackpots)
      : fallback.totalJackpots,
    totalBlueprints: Number.isFinite(historyStats?.totalBlueprints)
      ? Math.max(0, historyStats.totalBlueprints)
      : fallback.totalBlueprints,
    cancelledSessions: Number.isFinite(historyStats?.cancelledSessions)
      ? Math.max(0, historyStats.cancelledSessions)
      : fallback.cancelledSessions,
    cancelledMinutes: Number.isFinite(historyStats?.cancelledMinutes)
      ? Math.max(0, historyStats.cancelledMinutes)
      : fallback.cancelledMinutes,
    sessionsWithGoal: Number.isFinite(historyStats?.sessionsWithGoal)
      ? Math.max(0, historyStats.sessionsWithGoal)
      : fallback.sessionsWithGoal,
    reviewedCount: Number.isFinite(historyStats?.reviewedCount)
      ? Math.max(0, historyStats.reviewedCount)
      : fallback.reviewedCount,
    achievedCount: Number.isFinite(historyStats?.achievedCount)
      ? Math.max(0, historyStats.achievedCount)
      : fallback.achievedCount,
    missedCount: Number.isFinite(historyStats?.missedCount)
      ? Math.max(0, historyStats.missedCount)
      : fallback.missedCount,
    pendingCount: Number.isFinite(historyStats?.pendingCount)
      ? Math.max(0, historyStats.pendingCount)
      : fallback.pendingCount,
  };
}
