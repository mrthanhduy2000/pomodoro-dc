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
  const nowMs = Date.parse('2026-05-10T10:25:01.000Z');

  assert.equal(isSessionEndEvent({
    type: 'UPDATE',
    old_record: {
      is_running: true,
      is_break: false,
      started_at: '2026-05-10T10:00:00.000Z',
      total_seconds: 25 * 60,
    },
    record: {
      is_running: false,
      is_break: false,
      paused_seconds_remaining: null,
    },
  }, nowMs), true);
});

test('push dispatch ignores legacy cancel events before the scheduled end', () => {
  const nowMs = Date.parse('2026-05-10T10:10:00.000Z');

  assert.equal(isSessionEndEvent({
    type: 'UPDATE',
    old_record: {
      is_running: true,
      is_break: false,
      started_at: '2026-05-10T10:00:00.000Z',
      total_seconds: 25 * 60,
    },
    record: {
      is_running: false,
      is_break: false,
      paused_seconds_remaining: null,
    },
  }, nowMs), false);
});
