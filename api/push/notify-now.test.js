import test from 'node:test';
import assert from 'node:assert/strict';

import { isSessionEndEvent } from './notify-now.js';

test('legacy notify route accepts only explicit completed timer_live end events', () => {
  assert.equal(isSessionEndEvent({
    type: 'UPDATE',
    old_record: { is_running: true, is_break: false },
    record: {
      is_running: false,
      is_break: false,
      paused_seconds_remaining: null,
      ended_reason: 'completed',
    },
  }), true);
});

test('legacy notify route ignores cancelled or missing ended reasons', () => {
  assert.equal(isSessionEndEvent({
    type: 'UPDATE',
    old_record: { is_running: true, is_break: false },
    record: {
      is_running: false,
      is_break: false,
      paused_seconds_remaining: null,
      ended_reason: 'cancelled',
    },
  }), false);

  assert.equal(isSessionEndEvent({
    type: 'UPDATE',
    old_record: { is_running: true, is_break: false },
    record: {
      is_running: false,
      is_break: false,
      paused_seconds_remaining: null,
    },
  }), false);
});
