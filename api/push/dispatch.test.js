import test from 'node:test';
import assert from 'node:assert/strict';

import { isSessionEndEvent } from './dispatch.js';

test('push dispatch accepts completed timer_live end events', () => {
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

test('push dispatch ignores cancelled timer_live end events', () => {
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
});

test('push dispatch keeps legacy payload compatibility when ended_reason is absent', () => {
  assert.equal(isSessionEndEvent({
    type: 'UPDATE',
    old_record: { is_running: true, is_break: false },
    record: {
      is_running: false,
      is_break: false,
      paused_seconds_remaining: null,
    },
  }), true);
});
