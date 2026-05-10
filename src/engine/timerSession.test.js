import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TIMER_MODES,
  getCreditedFocusMinutes,
  getWorkedMinutesForBreak,
  resolveContinueAfterPomodoro,
  shouldContinuePomodoroAsStopwatch,
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
