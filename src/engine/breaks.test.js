import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_QUICK_FOCUS_PRESET,
  QUICK_FOCUS_PRESETS,
  getBreakPlan,
  getFlowtimeBreakMinutes,
} from './breaks.js';
import { TIMER_MODES } from './timerSession.js';

test('quick focus presets include starter option without changing default profile', () => {
  const starterPreset = QUICK_FOCUS_PRESETS.find((preset) => preset.id === 'starter-15');

  assert.equal(QUICK_FOCUS_PRESETS[0].id, 'starter-15');
  assert.deepEqual(starterPreset, {
    id: 'starter-15',
    label: 'Khởi động',
    description: 'Vào việc nhanh',
    focusMinutes: 15,
    shortBreakDuration: 3,
    longBreakDuration: 12,
    longBreakAfterN: 4,
  });
  assert.equal(DEFAULT_QUICK_FOCUS_PRESET.id, 'classic-25');
});

test('Flowtime break boundaries match Rhythm rules', () => {
  assert.equal(getFlowtimeBreakMinutes(0), 5);
  assert.equal(getFlowtimeBreakMinutes(24.99), 5);
  assert.equal(getFlowtimeBreakMinutes(25), 8);
  assert.equal(getFlowtimeBreakMinutes(50), 8);
  assert.equal(getFlowtimeBreakMinutes(50.01), 17);
  assert.equal(getFlowtimeBreakMinutes(90), 17);
  assert.equal(getFlowtimeBreakMinutes(90.01), 20);
});

test('continued Pomodoro uses total stopwatch work for break plan', () => {
  const breakAfterTwentySix = getBreakPlan({
    mode: TIMER_MODES.STOPWATCH,
    workedMinutes: 26,
  });
  const breakAfterFiftyOne = getBreakPlan({
    mode: TIMER_MODES.STOPWATCH,
    workedMinutes: 51,
  });

  assert.deepEqual(breakAfterTwentySix, { durationMinutes: 8, isLong: false });
  assert.deepEqual(breakAfterFiftyOne, { durationMinutes: 17, isLong: false });
});
