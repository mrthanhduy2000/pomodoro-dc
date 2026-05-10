export const TIMER_MODES = {
  POMODORO: 'pomodoro',
  STOPWATCH: 'stopwatch',
};

export const TIMER_END_REASONS = {
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESET: 'reset',
};

export function resolveContinueAfterPomodoro(timerSession = {}, fallback = false) {
  if (typeof timerSession?.continueAfterPomodoro === 'boolean') {
    return timerSession.continueAfterPomodoro;
  }

  return Boolean(fallback);
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
