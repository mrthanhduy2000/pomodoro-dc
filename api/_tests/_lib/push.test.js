import test from 'node:test';
import assert from 'node:assert/strict';

import { isSessionEndEvent } from '../../_lib/push.js';

// Nguồn sự thật DUY NHẤT dùng chung bởi dispatch.js (route chính) và notify-now.js
// (route legacy, tắt mặc định) — trước 2026-07-11 mỗi route tự chép một luật khác
// nhau (dispatch.js khoan dung `old_record.is_running !== false`; notify-now.js
// khắt khe hơn `=== true`). Đã hợp nhất về luật của dispatch.js (route đang chạy
// thật trên production).
test('isSessionEndEvent: chấp nhận sự kiện timer_live hoàn thành', () => {
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

test('isSessionEndEvent: bỏ qua sự kiện timer_live bị huỷ', () => {
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

test('isSessionEndEvent: bỏ qua sự kiện timer_live thiếu lý do hoàn thành rõ ràng', () => {
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
  }, nowMs), false);
});

test('isSessionEndEvent: bỏ qua sự kiện huỷ kiểu cũ trước giờ kết thúc dự kiến', () => {
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
