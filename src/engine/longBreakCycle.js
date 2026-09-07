/**
 * longBreakCycle.js — The long-break cycle inside `progress` (grace deadline, preview session) and its sync points. Moved verbatim out of gameStore.js (ADR-078).
 *
 * Comments inside are the originals (Vietnamese where they were written so); the rules they
 * explain have not changed by moving. Pure: no store, no DOM.
 */

export const LONG_BREAK_CYCLE_GRACE_MS = 60 * 60 * 1000;

export const makeDefaultProgress = () => ({
  totalEP: 0,
  activeBook: 1,
  sessionsCompleted: 0,
  totalFocusMinutes: 0,
  longBreakCycleStart: 0,
  longBreakGraceDeadlineAt: null,
  longBreakPreviewSession: false,
});

export function normalizeLongBreakCycleProgress(progress = {}) {
  const sessionsCompleted = Number.isFinite(progress.sessionsCompleted)
    ? Math.max(0, progress.sessionsCompleted)
    : 0;
  const longBreakCycleStart = Number.isFinite(progress.longBreakCycleStart)
    ? Math.min(Math.max(0, progress.longBreakCycleStart), sessionsCompleted)
    : 0;

  return {
    ...progress,
    sessionsCompleted,
    longBreakCycleStart,
    longBreakGraceDeadlineAt: Number.isFinite(progress.longBreakGraceDeadlineAt)
      ? progress.longBreakGraceDeadlineAt
      : null,
    longBreakPreviewSession: Boolean(progress.longBreakPreviewSession),
  };
}

export function syncLongBreakCycleProgress(progress = {}, referenceTs = Date.now()) {
  const normalized = normalizeLongBreakCycleProgress(progress);
  const deadline = normalized.longBreakGraceDeadlineAt;
  if (!Number.isFinite(deadline) || referenceTs <= deadline) {
    return normalized;
  }

  return {
    ...normalized,
    longBreakCycleStart: normalized.sessionsCompleted,
    longBreakGraceDeadlineAt: null,
    longBreakPreviewSession: false,
  };
}

export function markLongBreakCycleBreakEnded(progress = {}, referenceTs = Date.now()) {
  const synced = syncLongBreakCycleProgress(progress, referenceTs);
  const activeCycleCount = Math.max(0, synced.sessionsCompleted - synced.longBreakCycleStart);

  return {
    ...synced,
    longBreakGraceDeadlineAt: activeCycleCount > 0 ? referenceTs + LONG_BREAK_CYCLE_GRACE_MS : null,
    longBreakPreviewSession: false,
  };
}

export function markLongBreakCycleSessionStarted(progress = {}, referenceTs = Date.now()) {
  const synced = syncLongBreakCycleProgress(progress, referenceTs);
  return {
    ...synced,
    longBreakGraceDeadlineAt: null,
    longBreakPreviewSession: true,
  };
}
