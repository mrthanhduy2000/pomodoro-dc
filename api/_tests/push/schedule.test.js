import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePushKind } from '../../push/schedule.js';

test('schedule: known kinds pass through, anything else falls back to the v1 focus-complete', () => {
  for (const k of ['focus-complete', 'pomodoro-continue', 'v2-focus-complete', 'v2-break-over']) {
    assert.equal(resolvePushKind(k), k);
  }
  for (const k of [undefined, '', 'toString', '__proto__', 'v3-anything']) {
    assert.equal(resolvePushKind(k), 'focus-complete');
  }
});
