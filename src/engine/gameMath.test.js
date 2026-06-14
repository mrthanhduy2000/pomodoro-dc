import test from 'node:test';
import assert from 'node:assert/strict';

import {
  suggestSessionLength,
  getTimeOfDayBucket,
  SESSION_SUGGESTION_MIN_SAMPLE,
  calculateStreakMilestoneProgress,
  generateCoachInsight,
  getGoldenHourBucket,
  getWeekdayHighlight,
  getWeeklyTrend,
  getAbandonHotspot,
} from './gameMath.js';

// Giờ của mỗi phiên được lấy trực tiếp từ trường `hour` trong fixture, để test
// không phụ thuộc múi giờ máy chạy.
const getEntryHour = (entry) => entry.hour;

function session(id, { hour, minutes, goalAchieved = undefined, categoryId = null, cancelled = false }) {
  return {
    id,
    hour,
    minutes,
    completed: !cancelled,
    cancelled,
    status: cancelled ? 'cancelled' : 'completed',
    ...(goalAchieved !== undefined ? { goalAchieved } : {}),
    ...(categoryId !== null ? { categoryId } : {}),
  };
}

test('getTimeOfDayBucket maps hours to the right part of day, including past midnight', () => {
  assert.equal(getTimeOfDayBucket(7).id, 'sang');
  assert.equal(getTimeOfDayBucket(12).id, 'trua');
  assert.equal(getTimeOfDayBucket(15).id, 'chieu');
  assert.equal(getTimeOfDayBucket(20).id, 'toi');
  assert.equal(getTimeOfDayBucket(23).id, 'khuya');
  assert.equal(getTimeOfDayBucket(2).id, 'khuya');
});

test('returns null when there is not enough data in the current bucket', () => {
  const history = [
    session(1, { hour: 9, minutes: 25 }),
    session(2, { hour: 9, minutes: 25 }),
  ];
  assert.equal(
    suggestSessionLength(history, { nowHour: 9, getEntryHour }),
    null,
  );
});

test('suggests the median length of successful sessions in this bucket (goal-based)', () => {
  const history = [
    session(1, { hour: 8, minutes: 25, goalAchieved: true }),
    session(2, { hour: 9, minutes: 45, goalAchieved: true }),
    session(3, { hour: 10, minutes: 50, goalAchieved: true }),
    session(4, { hour: 9, minutes: 90, goalAchieved: false }), // miss → ignored
    session(5, { hour: 15, minutes: 25, goalAchieved: true }), // wrong bucket
  ];
  const result = suggestSessionLength(history, { nowHour: 9, getEntryHour });
  assert.ok(result);
  assert.equal(result.bucketId, 'sang');
  assert.equal(result.basis, 'goal');
  assert.equal(result.sampleSize, 3);
  assert.equal(result.minutes, 45); // median(25,45,50) = 45, snapped to 5
});

test('falls back to completed sessions when the bucket has no goal data', () => {
  const history = [
    session(1, { hour: 20, minutes: 30 }),
    session(2, { hour: 21, minutes: 40 }),
    session(3, { hour: 22, minutes: 50 }),
  ];
  const result = suggestSessionLength(history, { nowHour: 20, getEntryHour });
  assert.ok(result);
  assert.equal(result.basis, 'completed');
  assert.equal(result.minutes, 40); // median(30,40,50)
});

test('scopes to the selected category when it has enough successful samples', () => {
  const history = [
    session(1, { hour: 9, minutes: 60, goalAchieved: true, categoryId: 'study' }),
    session(2, { hour: 9, minutes: 60, goalAchieved: true, categoryId: 'study' }),
    session(3, { hour: 9, minutes: 60, goalAchieved: true, categoryId: 'study' }),
    session(4, { hour: 9, minutes: 20, goalAchieved: true, categoryId: 'work' }),
    session(5, { hour: 9, minutes: 20, goalAchieved: true, categoryId: 'work' }),
  ];
  const result = suggestSessionLength(history, { nowHour: 9, categoryId: 'study', getEntryHour });
  assert.ok(result);
  assert.equal(result.categoryScoped, true);
  assert.equal(result.minutes, 60);
  assert.equal(result.sampleSize, 3);
});

test('streak milestone: at 0 the next milestone is 7 days away', () => {
  const r = calculateStreakMilestoneProgress(0);
  assert.equal(r.nextMilestone.days, 7);
  assert.equal(r.daysRemaining, 7);
  assert.equal(r.allMilestones.length, 3);
  assert.equal(r.hasUnlockedAll, false);
});

test('streak milestone: at 7 the first is unlocked and next is 14', () => {
  const r = calculateStreakMilestoneProgress(7);
  assert.equal(r.allMilestones[0].isUnlocked, true);
  assert.equal(r.nextMilestone.days, 14);
  assert.equal(r.daysRemaining, 7);
});

test('streak milestone: at 20 the permanent milestone (30) is 10 days away', () => {
  const r = calculateStreakMilestoneProgress(20);
  assert.equal(r.nextMilestone.days, 30);
  assert.equal(r.nextMilestone.permanent, true);
  assert.equal(r.daysRemaining, 10);
});

test('streak milestone: at 30 everything is unlocked', () => {
  const r = calculateStreakMilestoneProgress(30);
  assert.equal(r.allMilestones.every((m) => m.isUnlocked), true);
  assert.equal(r.nextMilestone, null);
  assert.equal(r.hasUnlockedAll, true);
  assert.equal(r.daysRemaining, 0);
});

test('coach insight: thin history asks to complete more sessions', () => {
  const r = generateCoachInsight([session(1, { hour: 9, minutes: 25 })], { nowHour: 9, getEntryHour });
  assert.equal(r.kind, 'onboarding');
  assert.ok(r.text.length > 0);
});

test('coach insight: enough sessions in the current bucket suggests a length', () => {
  const history = [
    session(1, { hour: 8, minutes: 25, goalAchieved: true }),
    session(2, { hour: 9, minutes: 45, goalAchieved: true }),
    session(3, { hour: 10, minutes: 50, goalAchieved: true }),
    session(4, { hour: 9, minutes: 45, goalAchieved: true }),
    session(5, { hour: 8, minutes: 25, goalAchieved: true }),
  ];
  const r = generateCoachInsight(history, { nowHour: 9, getEntryHour, currentStreak: 3 });
  assert.equal(r.kind, 'length');
  assert.match(r.text, /phiên/);
});

test('cancelled sessions never count toward the suggestion', () => {
  const history = [
    session(1, { hour: 9, minutes: 25, goalAchieved: true }),
    session(2, { hour: 9, minutes: 25, goalAchieved: true }),
    session(3, { hour: 9, minutes: 200, cancelled: true }),
  ];
  // Only 2 successful → below the min sample, so no over-confident suggestion.
  assert.equal(SESSION_SUGGESTION_MIN_SAMPLE, 3);
  assert.equal(suggestSessionLength(history, { nowHour: 9, getEntryHour }), null);
});

// ── New coach signals ────────────────────────────────────────────────────────

test('golden hour: returns the bucket with the highest goal-achievement rate', () => {
  const history = [
    session(1, { hour: 9, minutes: 40, goalAchieved: true }),
    session(2, { hour: 9, minutes: 40, goalAchieved: true }),
    session(3, { hour: 9, minutes: 50, goalAchieved: true }),
    session(4, { hour: 9, minutes: 50, goalAchieved: true }),
    session(5, { hour: 9, minutes: 30, goalAchieved: false }), // sáng: 4/5 = 80%
    session(6, { hour: 20, minutes: 30, goalAchieved: true }),
    session(7, { hour: 20, minutes: 30, goalAchieved: false }),
    session(8, { hour: 20, minutes: 30, goalAchieved: false }),
    session(9, { hour: 20, minutes: 30, goalAchieved: false }), // tối: 1/4 = 25%
  ];
  const r = getGoldenHourBucket(history, { getEntryHour });
  assert.ok(r);
  assert.equal(r.bucketId, 'sang');
  assert.equal(r.sampleSize, 5);
  assert.ok(r.rate >= 0.79 && r.rate <= 0.81);
});

test('golden hour: null when only one bucket has enough data (nothing to compare)', () => {
  const history = [
    session(1, { hour: 9, minutes: 40, goalAchieved: true }),
    session(2, { hour: 9, minutes: 40, goalAchieved: true }),
    session(3, { hour: 9, minutes: 50, goalAchieved: true }),
    session(4, { hour: 9, minutes: 50, goalAchieved: true }),
  ];
  assert.equal(getGoldenHourBucket(history, { getEntryHour }), null);
});

test('weekday highlight: finds the most productive day of the week', () => {
  const getEntryWeekday = (e) => e.weekday;
  const history = [
    { id: 1, minutes: 30, completed: true, weekday: 1 },
    { id: 2, minutes: 30, completed: true, weekday: 1 },
    { id: 3, minutes: 30, completed: true, weekday: 1 },
    { id: 4, minutes: 30, completed: true, weekday: 1 },
    { id: 5, minutes: 30, completed: true, weekday: 3 },
    { id: 6, minutes: 30, completed: true, weekday: 3 },
    { id: 7, minutes: 30, completed: true, weekday: 5 },
    { id: 8, minutes: 30, completed: true, weekday: 5 },
  ];
  const r = getWeekdayHighlight(history, { getEntryWeekday });
  assert.ok(r);
  assert.equal(r.weekday, 1);
  assert.equal(r.label, 'Thứ Hai');
  assert.equal(r.count, 4);
});

test('weekday highlight: null when sessions span fewer than 3 distinct days', () => {
  const getEntryWeekday = (e) => e.weekday;
  const history = [
    { id: 1, minutes: 30, completed: true, weekday: 1 },
    { id: 2, minutes: 30, completed: true, weekday: 1 },
    { id: 3, minutes: 30, completed: true, weekday: 2 },
    { id: 4, minutes: 30, completed: true, weekday: 2 },
    { id: 5, minutes: 30, completed: true, weekday: 2 },
  ];
  assert.equal(getWeekdayHighlight(history, { getEntryWeekday }), null);
});

test('weekly trend: compares this week vs last week minutes', () => {
  const getEntryWeekKey = (e) => e.wk;
  const history = [
    { id: 1, minutes: 30, completed: true, wk: 'W2' },
    { id: 2, minutes: 30, completed: true, wk: 'W2' },
    { id: 3, minutes: 30, completed: true, wk: 'W2' }, // 90′ this week
    { id: 4, minutes: 20, completed: true, wk: 'W1' },
    { id: 5, minutes: 20, completed: true, wk: 'W1' },
    { id: 6, minutes: 20, completed: true, wk: 'W1' }, // 60′ last week
  ];
  const r = getWeeklyTrend(history, { getEntryWeekKey, nowWeekKey: 'W2', prevWeekKey: 'W1' });
  assert.ok(r);
  assert.equal(r.direction, 'up');
  assert.equal(r.thisMinutes, 90);
  assert.equal(r.prevMinutes, 60);
  assert.equal(r.pct, 50);
});

test('weekly trend: null when last week has no data', () => {
  const getEntryWeekKey = (e) => e.wk;
  const history = [
    { id: 1, minutes: 30, completed: true, wk: 'W2' },
    { id: 2, minutes: 30, completed: true, wk: 'W2' },
  ];
  assert.equal(getWeeklyTrend(history, { getEntryWeekKey, nowWeekKey: 'W2', prevWeekKey: 'W1' }), null);
});

test('abandon hotspot: flags the bucket with a high cancel rate', () => {
  const history = [
    session(1, { hour: 20, minutes: 25 }),
    session(2, { hour: 20, minutes: 25 }),
    session(3, { hour: 20, minutes: 25 }),
    session(4, { hour: 20, minutes: 5, cancelled: true }),
    session(5, { hour: 20, minutes: 5, cancelled: true }), // tối: 2/5 huỷ = 40%
  ];
  const r = getAbandonHotspot(history, { getEntryHour });
  assert.ok(r);
  assert.equal(r.bucketId, 'toi');
  assert.equal(r.attempts, 5);
  assert.ok(r.rate >= 0.39 && r.rate <= 0.41);
});

test('coach insight: rotationSeed cycles through the top suggestions and carries a reason', () => {
  // Sáng đạt cao (4/5), tối trượt cả 5 → tổng = 40% (bật "tip"), có cả "length" + "golden".
  const history = [
    session(1, { hour: 9, minutes: 40, goalAchieved: true }),
    session(2, { hour: 9, minutes: 40, goalAchieved: true }),
    session(3, { hour: 9, minutes: 50, goalAchieved: true }),
    session(4, { hour: 9, minutes: 50, goalAchieved: true }),
    session(5, { hour: 9, minutes: 30, goalAchieved: false }),
    session(6, { hour: 20, minutes: 30, goalAchieved: false }),
    session(7, { hour: 20, minutes: 30, goalAchieved: false }),
    session(8, { hour: 20, minutes: 30, goalAchieved: false }),
    session(9, { hour: 20, minutes: 30, goalAchieved: false }),
    session(10, { hour: 20, minutes: 30, goalAchieved: false }),
  ];
  const base = { nowHour: 9, getEntryHour };
  const k0 = generateCoachInsight(history, { ...base, rotationSeed: 0 });
  const k1 = generateCoachInsight(history, { ...base, rotationSeed: 1 });
  const k2 = generateCoachInsight(history, { ...base, rotationSeed: 2 });
  assert.equal(k0.kind, 'length');
  assert.equal(k1.kind, 'tip');
  assert.equal(k2.kind, 'golden');
  assert.ok(k0.reason && k0.reason.length > 0);
  // Cùng seed → ổn định (không random).
  assert.equal(generateCoachInsight(history, { ...base, rotationSeed: 3 }).kind, 'length');
});
