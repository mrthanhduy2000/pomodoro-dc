import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WEEK_DAY_LABELS,
  addDaysToKey,
  buildWeekStrip,
  describeStreakTarget,
  streakBonusPercent,
} from './todayHero.js';
import { STREAK_MILESTONES, STREAK_BONUS_PER_DAY, STREAK_MAX_BONUS_DAYS } from '../engine/constants.js';
import { vietnamDateTimeToTs } from '../engine/time.js';

// Một ngày giữa tuần, giờ VN — thứ Tư 2026-09-02 (Thứ Hai của tuần = 2026-08-31).
const MONDAY = '2026-08-31';
const TODAY = '2026-09-02';
const ts = (day, hour = 9) => vietnamDateTimeToTs({ year: 2026, month: 9, day, hour, minute: 0 });

test('cộng ngày vào khoá không đi qua múi giờ máy — qua tháng, qua năm đều đúng', () => {
  assert.equal(addDaysToKey('2026-08-31', 0), '2026-08-31');
  assert.equal(addDaysToKey('2026-08-31', 1), '2026-09-01');
  assert.equal(addDaysToKey('2026-12-30', 3), '2027-01-02');
  assert.equal(addDaysToKey('rác', 1), 'rác', 'khoá hỏng thì trả lại nguyên, không ném');
});

test('dải bảy ngày: đúng bảy ô T2→CN, hôm nay và tương lai được đánh dấu', () => {
  const days = buildWeekStrip({ history: [], todayKey: TODAY, mondayKey: MONDAY });
  assert.equal(days.length, 7);
  assert.deepEqual(days.map((d) => d.label), [...WEEK_DAY_LABELS]);
  assert.deepEqual(days.map((d) => d.key), [
    '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06',
  ]);
  assert.deepEqual(days.map((d) => d.isToday), [false, false, true, false, false, false, false]);
  assert.deepEqual(days.map((d) => d.isFuture), [false, false, false, true, true, true, true]);
  assert.ok(days.every((d) => d.done === false));
});

test('ngày TRƯỚC đọc từ lịch sử (bỏ phiên huỷ), HÔM NAY đọc từ dailyTracking chứ không từ lịch sử', () => {
  const history = [
    { timestamp: ts(1), minutes: 25 },                        // T3 — có phiên
    { timestamp: ts(31 - 31 + 1, 22), minutes: 25 },          // cùng T3, phiên khuya
    { timestamp: vietnamDateTimeToTs({ year: 2026, month: 8, day: 31, hour: 8, minute: 0 }), status: 'cancelled' }, // T2 huỷ
    { timestamp: ts(2), minutes: 25 },                        // hôm nay — PHẢI bị bỏ qua
  ];
  const chuaXongHomNay = buildWeekStrip({ history, todayKey: TODAY, mondayKey: MONDAY, sessionsCompletedToday: 0 });
  assert.deepEqual(chuaXongHomNay.map((d) => d.done), [false, true, false, false, false, false, false]);

  const xongHomNay = buildWeekStrip({ history, todayKey: TODAY, mondayKey: MONDAY, sessionsCompletedToday: 1 });
  assert.equal(xongHomNay[2].done, true, 'dailyTracking nói hôm nay có phiên thì ô hôm nay tô');
});

test('mốc chuỗi kế tiếp: dùng CHUNG bảng STREAK_MILESTONES với thanh tiêu đề', () => {
  const dau = STREAK_MILESTONES[0];
  const a = describeStreakTarget(dau.days - 3);
  assert.equal(a.remaining, 3);
  assert.match(a.text, new RegExp(`Còn 3 ngày → mốc ${dau.days}`));
  assert.equal(a.permanent, false);

  const cuoi = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const b = describeStreakTarget(cuoi.days - 1);
  assert.equal(b.permanent, true);
  assert.match(b.text, /vĩnh viễn/);

  const c = describeStreakTarget(cuoi.days + 10);
  assert.equal(c.hasUnlockedAll, true);
  assert.equal(c.remaining, 0);
});

test('phần trăm thưởng chuỗi: tăng theo ngày và có TRẦN, đúng công thức cũ của DailyMissions', () => {
  assert.equal(streakBonusPercent(0), 0);
  assert.equal(streakBonusPercent(4), 4 * STREAK_BONUS_PER_DAY * 100);
  assert.equal(streakBonusPercent(999), STREAK_MAX_BONUS_DAYS * STREAK_BONUS_PER_DAY * 100, 'phải chạm trần');
  assert.equal(streakBonusPercent(-5), 0, 'số âm không được thành thưởng âm');
});
