export const TIMER_MODES = {
  POMODORO: 'pomodoro',
  STOPWATCH: 'stopwatch',
};

export const TIMER_END_REASONS = {
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESET: 'reset',
};

export const CONTINUED_POMODORO_CONFIRM_SECONDS = 15 * 60;

export function resolveContinueAfterPomodoro(timerSession = {}, fallback = false) {
  if (typeof timerSession?.continueAfterPomodoro === 'boolean') {
    return timerSession.continueAfterPomodoro;
  }

  return Boolean(fallback);
}

export function getContinuedPomodoroOvertimeSeconds(displaySeconds = 0, targetSeconds = 0) {
  return Math.max(0, Math.floor(displaySeconds) - Math.max(0, Math.floor(targetSeconds)));
}

export function getContinuedPomodoroConfirmUntilSeconds(
  timerSession = {},
  targetSeconds = 0,
  windowSeconds = CONTINUED_POMODORO_CONFIRM_SECONDS,
) {
  const safeTargetSeconds = Math.max(0, Math.floor(targetSeconds));
  const safeWindowSeconds = Math.max(1, Math.floor(windowSeconds));
  const fallbackUntilSeconds = safeTargetSeconds + safeWindowSeconds;
  const persistedUntilSeconds = Number(timerSession?.continuedPomodoroConfirmedUntilSeconds);

  return Number.isFinite(persistedUntilSeconds) && persistedUntilSeconds > safeTargetSeconds
    ? Math.floor(persistedUntilSeconds)
    : fallbackUntilSeconds;
}

export function getNextContinuedPomodoroConfirmUntilSeconds(
  currentUntilSeconds = 0,
  targetSeconds = 0,
  windowSeconds = CONTINUED_POMODORO_CONFIRM_SECONDS,
) {
  const safeCurrentUntilSeconds = Number.isFinite(Number(currentUntilSeconds))
    ? Math.max(0, Math.floor(Number(currentUntilSeconds)))
    : 0;
  const safeTargetSeconds = Math.max(0, Math.floor(targetSeconds));
  const safeWindowSeconds = Math.max(1, Math.floor(windowSeconds));

  return Math.max(safeCurrentUntilSeconds, safeTargetSeconds) + safeWindowSeconds;
}

export function shouldContinuePomodoroAsStopwatch({
  mode = TIMER_MODES.POMODORO,
  continueAfterPomodoro = false,
  displaySeconds = 0,
  isPaused = false,
} = {}) {
  return mode === TIMER_MODES.POMODORO
    && continueAfterPomodoro === true
    && !isPaused
    && displaySeconds <= 0;
}

export function shouldHoldContinuedPomodoroForConfirmation({
  mode = TIMER_MODES.STOPWATCH,
  continueAfterPomodoro = false,
  displaySeconds = 0,
  confirmUntilSeconds = Infinity,
} = {}) {
  const safeDisplaySeconds = Number(displaySeconds);
  const safeConfirmUntilSeconds = Number(confirmUntilSeconds);

  return mode === TIMER_MODES.STOPWATCH
    && continueAfterPomodoro === true
    && confirmUntilSeconds != null
    && Number.isFinite(safeDisplaySeconds)
    && Number.isFinite(safeConfirmUntilSeconds)
    && safeDisplaySeconds >= safeConfirmUntilSeconds;
}

export function getCreditedFocusMinutes({
  mode = TIMER_MODES.POMODORO,
  elapsedMs = 0,
  targetSeconds = 0,
} = {}) {
  const elapsedMinutes = Math.max(1, Math.round(Math.max(0, elapsedMs) / 60_000));
  const targetMinutes = Math.max(1, Math.round(Math.max(0, targetSeconds) / 60));

  return mode === TIMER_MODES.STOPWATCH
    ? elapsedMinutes
    : Math.min(targetMinutes, elapsedMinutes);
}

export function getWorkedMinutesForBreak({
  mode = TIMER_MODES.POMODORO,
  elapsedMs = 0,
  creditedMinutes = 0,
} = {}) {
  return mode === TIMER_MODES.STOPWATCH
    ? Math.max(0, elapsedMs / 60_000)
    : Math.max(0, creditedMinutes);
}
