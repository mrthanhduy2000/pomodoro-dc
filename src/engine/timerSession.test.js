import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONTINUED_POMODORO_CONFIRM_SECONDS,
  TIMER_MODES,
  getContinuedPomodoroConfirmUntilSeconds,
  getContinuedPomodoroOvertimeSeconds,
  getCreditedFocusMinutes,
  getNextContinuedPomodoroConfirmUntilSeconds,
  getWorkedMinutesForBreak,
  resolveContinueAfterPomodoro,
  shouldContinuePomodoroAsStopwatch,
  shouldHoldContinuedPomodoroForConfirmation,
  shouldInferContinuedPomodoroSession,
  shouldStartBreakAfterCompletion,
} from './timerSession.js';

test('continue-after-Pomodoro is resolved from the running session before settings fallback', () => {
  assert.equal(resolveContinueAfterPomodoro({ continueAfterPomodoro: true }, false), true);
  assert.equal(resolveContinueAfterPomodoro({ continueAfterPomodoro: false }, true), false);
  assert.equal(resolveContinueAfterPomodoro({}, true), true);
});

test('Pomodoro only switches to stopwatch when the session flag is on and countdown ended', () => {
  assert.equal(shouldContinuePomodoroAsStopwatch({
    mode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: true,
    displaySeconds: 0,
  }), true);

  assert.equal(shouldContinuePomodoroAsStopwatch({
    mode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: true,
    displaySeconds: 1,
  }), false);

  assert.equal(shouldContinuePomodoroAsStopwatch({
    mode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: true,
    displaySeconds: 0,
    isPaused: true,
  }), false);
});

test('continued Pomodoro credits the full elapsed session length', () => {
  const elapsedMs = 51 * 60_000;
  const creditedMinutes = getCreditedFocusMinutes({
    mode: TIMER_MODES.STOPWATCH,
    elapsedMs,
    targetSeconds: 25 * 60,
  });

  assert.equal(creditedMinutes, 51);
  assert.equal(getWorkedMinutesForBreak({
    mode: TIMER_MODES.STOPWATCH,
    elapsedMs,
    creditedMinutes,
  }), 51);
});

test('regular Pomodoro never credits beyond its target', () => {
  assert.equal(getCreditedFocusMinutes({
    mode: TIMER_MODES.POMODORO,
    elapsedMs: 51 * 60_000,
    targetSeconds: 25 * 60,
  }), 25);
});

test('Pomodoro completion respects auto-start break and disable-break settings', () => {
  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.POMODORO,
    autoStartBreak: true,
    disableBreak: false,
  }), true);

  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.POMODORO,
    autoStartBreak: false,
    disableBreak: false,
  }), false);

  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.POMODORO,
    autoStartBreak: true,
    disableBreak: true,
  }), false);
});

test('Stopwatch-style completion starts break after manual completion unless breaks are disabled', () => {
  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.STOPWATCH,
    autoStartBreak: false,
    disableBreak: false,
  }), true);

  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.STOPWATCH,
    autoStartBreak: false,
    disableBreak: true,
  }), false);

  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.STOPWATCH,
    autoStartBreak: true,
    disableBreak: false,
  }), true);

  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.STOPWATCH,
    autoStartBreak: true,
    disableBreak: true,
  }), false);
});

test('continued Pomodoro uses Stopwatch-style break completion policy', () => {
  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.STOPWATCH,
    autoStartBreak: false,
    disableBreak: false,
  }), true);
});

test('continued Pomodoro asks for confirmation after each 15 minute overtime window', () => {
  const targetSeconds = 25 * 60;
  const firstConfirmUntil = getContinuedPomodoroConfirmUntilSeconds({}, targetSeconds);

  assert.equal(firstConfirmUntil, targetSeconds + CONTINUED_POMODORO_CONFIRM_SECONDS);
  assert.equal(getContinuedPomodoroOvertimeSeconds(firstConfirmUntil, targetSeconds), 15 * 60);
  assert.equal(shouldHoldContinuedPomodoroForConfirmation({
    mode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: true,
    displaySeconds: firstConfirmUntil - 1,
    confirmUntilSeconds: firstConfirmUntil,
  }), false);
  assert.equal(shouldHoldContinuedPomodoroForConfirmation({
    mode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: true,
    displaySeconds: firstConfirmUntil,
    confirmUntilSeconds: firstConfirmUntil,
  }), true);

  assert.equal(
    getNextContinuedPomodoroConfirmUntilSeconds(firstConfirmUntil, targetSeconds),
    targetSeconds + (CONTINUED_POMODORO_CONFIRM_SECONDS * 2),
  );
});

test('continued Pomodoro confirmation state only applies to continued stopwatch sessions', () => {
  assert.equal(shouldHoldContinuedPomodoroForConfirmation({
    mode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: false,
    displaySeconds: 60 * 60,
    confirmUntilSeconds: 30 * 60,
  }), false);

  assert.equal(shouldHoldContinuedPomodoroForConfirmation({
    mode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: true,
    displaySeconds: 60 * 60,
    confirmUntilSeconds: 30 * 60,
  }), false);

  assert.equal(shouldHoldContinuedPomodoroForConfirmation({
    mode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: true,
    displaySeconds: 60 * 60,
    confirmUntilSeconds: null,
  }), false);
});

test('legacy stopwatch restore can be inferred as continued Pomodoro from configured mode', () => {
  assert.equal(shouldInferContinuedPomodoroSession({
    mode: TIMER_MODES.STOPWATCH,
    configuredMode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: false,
    displaySeconds: 41 * 60,
    targetSeconds: 25 * 60,
  }), true);

  assert.equal(shouldInferContinuedPomodoroSession({
    mode: TIMER_MODES.STOPWATCH,
    configuredMode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: false,
    displaySeconds: 41 * 60,
    targetSeconds: 25 * 60,
  }), false);

  assert.equal(shouldInferContinuedPomodoroSession({
    mode: TIMER_MODES.STOPWATCH,
    configuredMode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: true,
    displaySeconds: 41 * 60,
    targetSeconds: 25 * 60,
  }), false);
});
