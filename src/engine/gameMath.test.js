import test from 'node:test';
import assert from 'node:assert/strict';

import {
  suggestSessionLength,
  getTimeOfDayBucket,
  SESSION_SUGGESTION_MIN_SAMPLE,
  calculateStreakMilestoneProgress,
  getGoldenHourBucket,
  getWeekdayHighlight,
  getWeeklyTrend,
  getMultiWeekTrend,
  getAbandonHotspot,
  getTodayPaceInsight,
  getNeglectedCategory,
  getDailyGoalCalibration,
  getLateNightQualityDrop,
  getWeekendVsWeekdayContrast,
  getComebackRate,
  // Bản Cập Nhật Cộng Hưởng
  calculateRewards,
  softcapBranchXP,
  getEffectiveSkillCost,
  clampRelicDisasterReduction,
  getComboDecayMs,
} from './gameMath.js';
import {
  SIEU_TAP_TRUNG_MULT,
  SO_DO_MULTIPLIER,
} from './constants.js';

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

// ── Đợt 2: tín hiệu nâng cao ─────────────────────────────────────────────────

const getEntryDayKey = (e) => e.dk;
const getEntryDayNumber = (e) => e.dn;

test('today-pace: sắp đạt mục tiêu (near) khi còn 1 phiên', () => {
  const r = getTodayPaceInsight([], { metric: 'sessions', goal: 5, sessionsToday: 4 });
  assert.ok(r);
  assert.equal(r.status, 'near');
  assert.equal(r.remaining, 1);
});

test('today-pace: đã đạt mục tiêu (met)', () => {
  const r = getTodayPaceInsight([], { metric: 'sessions', goal: 5, sessionsToday: 5 });
  assert.equal(r.status, 'met');
});

test('today-pace: chậm hơn nhịp thường ngày (behind) so với baseline tới giờ này', () => {
  const history = [];
  for (const dk of ['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13']) {
    for (let i = 0; i < 3; i += 1) history.push({ dk, hour: 9, minutes: 25, completed: true });
  }
  const r = getTodayPaceInsight(history, {
    metric: 'sessions', goal: 5, sessionsToday: 1, nowHour: 12,
    getEntryHour, getEntryDayKey, todayKey: '2026-06-15',
  });
  assert.ok(r);
  assert.equal(r.status, 'behind');
  assert.equal(r.typical, 3);
});

test('today-pace: đúng nhịp & còn xa đích → null (không chém gió)', () => {
  const history = [];
  for (const dk of ['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13']) {
    for (let i = 0; i < 3; i += 1) history.push({ dk, hour: 9, minutes: 25, completed: true });
  }
  const r = getTodayPaceInsight(history, {
    metric: 'sessions', goal: 5, sessionsToday: 3, nowHour: 12,
    getEntryHour, getEntryDayKey, todayKey: '2026-06-15',
  });
  assert.equal(r, null);
});

test('neglected category: tìm nhóm từng làm đều nhưng đã im lặng', () => {
  const cat = (dn, label) => ({ dn, minutes: 30, completed: true, categoryId: 'A', categorySnapshot: { label } });
  const history = [
    cat(80, 'Đọc Sách'), cat(82, 'Đọc Sách'), cat(84, 'Đọc Sách'),
    { dn: 98, minutes: 20, completed: true, categoryId: 'B', categorySnapshot: { label: 'Việc' } },
    { dn: 99, minutes: 20, completed: true, categoryId: 'B', categorySnapshot: { label: 'Việc' } },
    { dn: 100, minutes: 20, completed: true, categoryId: 'B', categorySnapshot: { label: 'Việc' } },
  ];
  const r = getNeglectedCategory(history, { nowDayNumber: 100, getEntryDayNumber });
  assert.ok(r);
  assert.equal(r.categoryId, 'A');
  assert.equal(r.label, 'Đọc Sách');
  assert.equal(r.daysSince, 16);
});

test('neglected category: KHÔNG nhắc loại đã bị xoá (activeCategoryIds)', () => {
  const cat = (dn) => ({ dn, minutes: 30, completed: true, categoryId: 'A', categorySnapshot: { label: 'Đọc Sách' } });
  const history = [
    cat(80), cat(82), cat(84),
    { dn: 100, minutes: 20, completed: true, categoryId: 'B', categorySnapshot: { label: 'Việc' } },
    { dn: 99, minutes: 20, completed: true, categoryId: 'B', categorySnapshot: { label: 'Việc' } },
    { dn: 98, minutes: 20, completed: true, categoryId: 'B', categorySnapshot: { label: 'Việc' } },
  ];
  // 'A' đã xoá khỏi danh sách loại → không được nhắc.
  const r = getNeglectedCategory(history, { nowDayNumber: 100, getEntryDayNumber, activeCategoryIds: new Set(['B']) });
  assert.equal(r, null);
});

test('goal calibration: quá khó → gợi ý hạ mục tiêu', () => {
  const history = [];
  for (let d = 1; d <= 10; d += 1) {
    history.push({ dk: `2026-06-${String(d).padStart(2, '0')}`, minutes: 60, completed: true });
  }
  const r = getDailyGoalCalibration(history, { goalType: 'minutes', goalValue: 125, getEntryDayKey, todayKey: '2026-06-20' });
  assert.ok(r);
  assert.equal(r.verdict, 'too-hard');
  assert.ok(r.suggested < 125);
});

test('goal calibration: quá dễ → gợi ý nâng mục tiêu', () => {
  const history = [];
  for (let d = 1; d <= 10; d += 1) {
    for (let i = 0; i < 5; i += 1) history.push({ dk: `2026-06-${String(d).padStart(2, '0')}`, minutes: 25, completed: true });
  }
  const r = getDailyGoalCalibration(history, { goalType: 'sessions', goalValue: 3, getEntryDayKey, todayKey: '2026-06-20' });
  assert.ok(r);
  assert.equal(r.verdict, 'too-easy');
  assert.ok(r.suggested > 3);
});

test('goal calibration: rào ngày-lịch (minDayKey) loại hết dữ liệu cũ → null', () => {
  const history = [];
  for (let d = 1; d <= 10; d += 1) {
    history.push({ dk: `2026-06-${String(d).padStart(2, '0')}`, minutes: 60, completed: true });
  }
  const r = getDailyGoalCalibration(history, {
    goalType: 'minutes', goalValue: 125, getEntryDayKey, todayKey: '2026-07-20', minDayKey: '2026-07-01',
  });
  assert.equal(r, null);
});

test('late-night quality: cảnh báo khi tỉ lệ đạt mục tiêu về khuya tụt rõ', () => {
  const history = [];
  for (let i = 0; i < 5; i += 1) history.push({ hour: 10, minutes: 30, completed: true, goalAchieved: true });
  history.push({ hour: 23, minutes: 30, completed: true, goalAchieved: true });
  for (let i = 0; i < 3; i += 1) history.push({ hour: 23, minutes: 30, completed: true, goalAchieved: false });
  const r = getLateNightQualityDrop(history, { getEntryHour });
  assert.ok(r);
  assert.equal(r.lateStartHour, 22);
  assert.equal(r.lateAttempts, 4);
  assert.ok(r.lateGoalRate <= 0.26);
});

test('late-night quality: làm khuya vẫn tốt → null', () => {
  const history = [];
  for (let i = 0; i < 5; i += 1) history.push({ hour: 10, minutes: 30, completed: true, goalAchieved: true });
  for (let i = 0; i < 4; i += 1) history.push({ hour: 23, minutes: 30, completed: true, goalAchieved: true });
  assert.equal(getLateNightQualityDrop(history, { getEntryHour }), null);
});

test('late-night: lateGoalTotal đếm phiên CÓ mục tiêu (≠ tổng phiên khuya) → cỡ mẫu % đúng', () => {
  const history = [];
  for (let i = 0; i < 6; i += 1) history.push({ hour: 10, minutes: 30, completed: true, goalAchieved: true });
  history.push({ hour: 23, minutes: 30, completed: true, goalAchieved: true });
  for (let i = 0; i < 4; i += 1) history.push({ hour: 23, minutes: 30, completed: true, goalAchieved: false });
  for (let i = 0; i < 3; i += 1) history.push({ hour: 23, minutes: 30, completed: true }); // khuya, KHÔNG đặt mục tiêu
  const r = getLateNightQualityDrop(history, { getEntryHour });
  assert.ok(r);
  assert.equal(r.lateAttempts, 8);   // tổng phiên khuya hoàn thành
  assert.equal(r.lateGoalTotal, 5);  // chỉ phiên CÓ mục tiêu — mẫu số đúng cho lateGoalRate
  assert.equal(r.dayGoalTotal, 6);
});

test('goal calibration: medianDisplay làm tròn (phút→bội 5; phiên→nguyên)', () => {
  const h1 = [];
  for (let d = 1; d <= 10; d += 1) h1.push({ dk: `2026-06-${String(d).padStart(2, '0')}`, minutes: 37, completed: true });
  const r1 = getDailyGoalCalibration(h1, { goalType: 'minutes', goalValue: 125, getEntryDayKey, todayKey: '2026-06-20' });
  assert.ok(r1);
  assert.equal(r1.medianDisplay % 5, 0);
  const h2 = [];
  for (let d = 1; d <= 10; d += 1) for (let i = 0; i < 5; i += 1) h2.push({ dk: `2026-06-${String(d).padStart(2, '0')}`, minutes: 25, completed: true });
  const r2 = getDailyGoalCalibration(h2, { goalType: 'sessions', goalValue: 3, getEntryDayKey, todayKey: '2026-06-20' });
  assert.ok(r2);
  assert.equal(r2.medianDisplay, Math.round(r2.median));
});

// ── getWeekendVsWeekdayContrast ───────────────────────────────────────────
const wdOf = (e) => e.weekday;
test('weekend vs weekday: cuối tuần đạt cao hơn ≥15đ% → basis goal', () => {
  const h = [];
  for (let i = 0; i < 5; i += 1) h.push({ weekday: 6, minutes: 30, completed: true, goalAchieved: i < 4 }); // T7: 80%
  for (let i = 0; i < 10; i += 1) h.push({ weekday: 3, minutes: 30, completed: true, goalAchieved: i < 5 }); // T4: 50%
  const r = getWeekendVsWeekdayContrast(h, { getEntryWeekday: wdOf });
  assert.ok(r); assert.equal(r.basis, 'goal'); assert.equal(r.stronger, 'weekend');
  assert.equal(r.weekendN, 5); assert.equal(r.weekdayN, 10);
});
test('weekend vs weekday: chênh tỉ-lệ nhỏ nhưng phút/phiên ≥20% → basis minutes', () => {
  const h = [];
  for (let i = 0; i < 5; i += 1) h.push({ weekday: 0, minutes: 60, completed: true, goalAchieved: i < 3 }); // CN 60'
  for (let i = 0; i < 5; i += 1) h.push({ weekday: 2, minutes: 30, completed: true, goalAchieved: i < 3 }); // T3 30', cùng 60%
  const r = getWeekendVsWeekdayContrast(h, { getEntryWeekday: wdOf });
  assert.ok(r); assert.equal(r.basis, 'minutes'); assert.equal(r.stronger, 'weekend');
});
test('weekend vs weekday: một nhóm <4 phiên → null; thiếu getter → null', () => {
  const tiny = [{ weekday: 6, minutes: 30, completed: true, goalAchieved: true }, { weekday: 3, minutes: 30, completed: true, goalAchieved: true }];
  assert.equal(getWeekendVsWeekdayContrast(tiny, { getEntryWeekday: wdOf }), null);
  assert.equal(getWeekendVsWeekdayContrast([], {}), null);
});

// ── getComebackRate ───────────────────────────────────────────────────────
const dnOf = (e) => e.dn;
test('comeback: 5/7 lần quay lại sau 1 ngày nghỉ', () => {
  const days = [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 22];
  const h = days.map((d) => ({ dn: d, minutes: 30, completed: true }));
  const r = getComebackRate(h, { getEntryDayNumber: dnOf, nowDayNumber: 25, windowDays: 40 });
  assert.ok(r); assert.equal(r.gaps, 7); assert.equal(r.comebacks, 5);
});
test('comeback: <4 lần gián đoạn → null; thiếu getter → null', () => {
  const few = [1, 2, 4].map((d) => ({ dn: d, minutes: 30, completed: true }));
  assert.equal(getComebackRate(few, { getEntryDayNumber: dnOf, nowDayNumber: 10, windowDays: 40 }), null);
  assert.equal(getComebackRate([{ dn: 1 }], { nowDayNumber: 5 }), null);
});
test('comeback: nghỉ ≥2 ngày KHÔNG tính là quay-lại (comebacks=0)', () => {
  const days = [1, 4, 7, 10, 13].map((d) => ({ dn: d, minutes: 30, completed: true }));
  const r = getComebackRate(days, { getEntryDayNumber: dnOf, nowDayNumber: 20, windowDays: 40 });
  assert.ok(r); assert.equal(r.comebacks, 0);
});

// ── getMultiWeekTrend: xu hướng dài hạn nhiều tuần (getter tĩnh e.wk, không Date) ──
const wkOf = (e) => e.wk;
const weeks = ['W4', 'W3', 'W2', 'W1']; // GẦN→XA: W4 là tuần hiện tại, W1 xa nhất
function weekHist(perWeek) { // perWeek: {W1: minutes, ...} → mỗi tuần 1 phiên với số phút đó
  const h = [];
  for (const [wk, m] of Object.entries(perWeek)) if (m > 0) h.push({ wk, minutes: m, completed: true });
  return h;
}
test('multi-week trend: tăng dần qua 4 tuần → up, dãy cũ→mới đúng', () => {
  const r = getMultiWeekTrend(weekHist({ W1: 300, W2: 360, W3: 440, W4: 520 }), { getEntryWeekKey: wkOf, weekKeysDesc: weeks });
  assert.ok(r);
  assert.equal(r.direction, 'up');
  assert.deepEqual(r.weeklyMinutes, [300, 360, 440, 520]);
  assert.equal(r.weeksWithData, 4);
  assert.equal(r.weeksLookback, 4);
  assert.ok(r.avgPctPerWeek >= 10);
});
test('multi-week trend: giảm dần → down', () => {
  const r = getMultiWeekTrend(weekHist({ W1: 520, W2: 440, W3: 360, W4: 300 }), { getEntryWeekKey: wkOf, weekKeysDesc: weeks });
  assert.equal(r.direction, 'down');
});
test('multi-week trend: ~đi ngang (chênh <10%) → flat', () => {
  const r = getMultiWeekTrend(weekHist({ W1: 400, W2: 405, W3: 398, W4: 402 }), { getEntryWeekKey: wkOf, weekKeysDesc: weeks });
  assert.equal(r.direction, 'flat');
});
test('multi-week trend: chỉ 1 tuần có dữ liệu → null', () => {
  assert.equal(getMultiWeekTrend(weekHist({ W4: 400 }), { getEntryWeekKey: wkOf, weekKeysDesc: weeks }), null);
});
test('multi-week trend: thiếu getter/weekKeysDesc → null', () => {
  assert.equal(getMultiWeekTrend(weekHist({ W3: 400, W4: 420 }), { weekKeysDesc: weeks }), null);
  assert.equal(getMultiWeekTrend(weekHist({ W3: 400, W4: 420 }), { getEntryWeekKey: wkOf }), null);
});
test('multi-week trend: chỉ 2 tuần gần nhất có dữ liệu (tuần cũ TRỐNG) → null, KHÔNG báo "flat" sai', () => {
  // Người mới/quay lại: W1,W2 trống, chỉ W3,W4 có phiên. <3 tuần CÓ dữ liệu → null (không in dòng sai).
  assert.equal(getMultiWeekTrend(weekHist({ W3: 300, W4: 320 }), { getEntryWeekKey: wkOf, weekKeysDesc: weeks }), null);
});
test('multi-week trend: 3 tuần có dữ liệu (1 tuần cũ trống bị BỎ, không kéo lệch) → up đúng', () => {
  const r = getMultiWeekTrend(weekHist({ W2: 100, W3: 150, W4: 200 }), { getEntryWeekKey: wkOf, weekKeysDesc: weeks });
  assert.ok(r);
  assert.equal(r.direction, 'up'); // KHÔNG bị 0' của W1 ép thành flat
  assert.deepEqual(r.weeklyMinutes, [100, 150, 200]); // chỉ tuần CÓ dữ liệu, cũ→mới
  assert.equal(r.weeksWithData, 3);
});

// ═══════════════════════════════════════════════════════════════════════════════
// BẢN CẬP NHẬT CỘNG HƯỞNG — test bộ máy
// ═══════════════════════════════════════════════════════════════════════════════

test('softcapBranchXP: identity dưới knee, fold trên knee', () => {
  // Knee = 0.40, DR rate = 0.5
  assert.equal(softcapBranchXP(0), 0);
  assert.equal(softcapBranchXP(0.36), 0.36);   // max thật của THIEN_DINH — no-op
  assert.equal(softcapBranchXP(0.40), 0.40);   // đúng knee
  assert.ok(Math.abs(softcapBranchXP(0.50) - 0.45) < 1e-9); // 0.40 + 0.10*0.5
  assert.ok(Math.abs(softcapBranchXP(0.80) - 0.60) < 1e-9); // 0.40 + 0.40*0.5
});

test('getEffectiveSkillCost: elite cộng hưởng giảm nửa, còn lại giữ nguyên', () => {
  const relics = [{ id: 'mam_song_bat_diet' }];
  // có cổ vật đúng kỷ ở bậc >=1 → 22 thành 11
  assert.equal(getEffectiveSkillCost('sieu_tap_trung', 22, relics, { mam_song_bat_diet: 1 }), 11);
  assert.equal(getEffectiveSkillCost('sieu_tap_trung', 22, relics, { mam_song_bat_diet: 2 }), 11);
  // bậc 0 (chưa tiến hóa) → không giảm
  assert.equal(getEffectiveSkillCost('sieu_tap_trung', 22, relics, { mam_song_bat_diet: 0 }), 22);
  // không sở hữu cổ vật → không giảm
  assert.equal(getEffectiveSkillCost('sieu_tap_trung', 22, [], {}), 22);
  // skill không phải elite cộng hưởng → giữ nguyên
  assert.equal(getEffectiveSkillCost('vao_guong', 3, relics, { mam_song_bat_diet: 2 }), 3);
});

test('clampRelicDisasterReduction: clamp tổng, no-op dưới trần', () => {
  assert.equal(clampRelicDisasterReduction(0.80), 0.55); // RELIC_DISASTER_REDUCTION_CAP
  assert.equal(clampRelicDisasterReduction(0.52), 0.52); // tổng relic thật — no-op
  assert.equal(clampRelicDisasterReduction(0), 0);
});

test('getComboDecayMs: clamp giờ combo từ cổ vật, KHÔNG thu nhỏ base skill', () => {
  const HOUR = 3_600_000;
  const decay30 = getComboDecayMs({}, [{ id: 'fake', buff: { comboWindowHours: 30 } }], {});
  const decay18 = getComboDecayMs({}, [{ id: 'fake', buff: { comboWindowHours: 18 } }], {});
  const decay16 = getComboDecayMs({}, [{ id: 'fake', buff: { comboWindowHours: 16 } }], {});
  assert.equal(decay30, decay18);          // 30 bị clamp về 18 (RELIC_COMBO_WINDOW_CAP_HOURS)
  assert.ok(decay16 < decay18);            // 16 dưới trần — không clamp
  // base skill bo_nho_co_bap được cộng TRÊN phần đã clamp (không bị thu nhỏ)
  const withSkill30  = getComboDecayMs({ bo_nho_co_bap: true }, [{ id: 'fake', buff: { comboWindowHours: 30 } }], {});
  const withSkillNo  = getComboDecayMs({ bo_nho_co_bap: true }, [], {});
  assert.equal(withSkill30 - withSkillNo, 18 * HOUR);
});

// — DỒN LỰC: tối đa 1 trump nhân-sau-trần mỗi phiên —
function withStubbedRandom(value, fn) {
  const orig = Math.random;
  Math.random = () => value;
  try { return fn(); } finally { Math.random = orig; }
}

test('Dồn Lực: 3 trump cùng kích hoạt → chỉ áp dụng 1 (ưu tiên Số Đỏ)', () => {
  // rand()=0.001 < 0.025 (jackpot) và < 0.40 (Số Đỏ) → cả ba đều là ứng viên.
  const skills = { dai_trung_thuong: true, sieu_tap_trung: true, so_do: true };
  const ctx = { superFocusActive: true, luckyModeActive: true };
  const r = withStubbedRandom(0.001, () => calculateRewards(60, skills, 0, {}, ctx));
  assert.equal(r.donLucChosen, 'so_do');
  assert.equal(r.jackpotApplied, false);
  assert.equal(r.luckyBurstApplied, true);
  assert.equal(r.sieuTapTrungApplied, false);
  // XP = base(60) × tier(2.0, jackpot bị trung hòa) × Số Đỏ(2.5) = 300
  assert.equal(r.finalXP, Math.round(60 * 2.0 * SO_DO_MULTIPLIER));
  // KHÔNG phải tích chồng ×jackpot×sieu×sodo
  assert.ok(r.finalXP < 60 * 2.0 * 2.5 * SIEU_TAP_TRUNG_MULT * SO_DO_MULTIPLIER);
});

test('Dồn Lực: override chọn Siêu Tập Trung khi đang active', () => {
  const skills = { dai_trung_thuong: true, sieu_tap_trung: true, so_do: true };
  const ctx = { superFocusActive: true, luckyModeActive: true, surgeOverride: 'sieu_tap_trung' };
  const r = withStubbedRandom(0.001, () => calculateRewards(60, skills, 0, {}, ctx));
  assert.equal(r.donLucChosen, 'sieu_tap_trung');
  assert.equal(r.sieuTapTrungApplied, true);
  assert.equal(r.jackpotApplied, false);
  assert.equal(r.luckyBurstApplied, false);
  // XP = base(60) × tier(2.0) × Siêu Tập Trung(1.7) = 204
  assert.equal(r.finalXP, Math.round(Math.round(60 * 2.0 * 1) * SIEU_TAP_TRUNG_MULT));
});

test('Dồn Lực: một trump duy nhất → hành vi y như cũ (no-op metering)', () => {
  // Chỉ Siêu Tập Trung active, không jackpot/Số Đỏ.
  const skills = { sieu_tap_trung: true };
  const ctx = { superFocusActive: true };
  const r = calculateRewards(60, skills, 0, {}, ctx);
  assert.equal(r.donLucChosen, 'sieu_tap_trung');
  assert.equal(r.finalXP, Math.round(Math.round(60 * 2.0) * SIEU_TAP_TRUNG_MULT));
});
