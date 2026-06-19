import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCoachBundle, answerQuestion, assertNoCausal, classifySmalltalk, isOutOfDomain } from './coachQA.js';
import { buildIntentIndex } from './intentRouter.js';

const getEntryHour = (e) => e.hour;
const opts = {
  nowHour: 9,
  getEntryHour,
  getEntryWeekday: (e) => e.weekday,
  getEntryWeekKey: (e) => e.wk,
  nowWeekKey: 'W2', prevWeekKey: 'W1',
  getEntryDayKey: (e) => e.dk,
  todayKey: '2026-06-30', minDayKey: '2026-06-01',
  getEntryDayNumber: (e) => e.dn, nowDayNumber: 200,
  todayWeekday: 4, hasSessionToday: false,
  activeCategoryIds: new Set(['study', 'work']),
  categoryLabelOf: (id) => ({ study: 'Học', work: 'Việc' }[id] ?? null),
  dailyGoalMetric: 'sessions', dailyGoal: 5, sessionsToday: 2, minutesToday: 80,
  currentStreak: 3,
};
const store = { streak: { currentStreak: 3, longestStreak: 9 }, dailyGoalMetric: 'sessions', dailyGoal: 5, sessionsToday: 2, minutesToday: 80 };

function fixture() {
  const h = [];
  let dn = 150;
  for (let i = 0; i < 6; i += 1) h.push({ hour: 9, minutes: 40, completed: true, goalAchieved: i < 5, categoryId: 'study', categorySnapshot: { label: 'Học' }, nextNote: 'ôn thi toán', dk: `2026-06-1${i}`, dn: dn + i, weekday: (i % 6) + 1, wk: 'W2' });
  for (let i = 0; i < 5; i += 1) h.push({ hour: 23, minutes: 30, completed: true, goalAchieved: i === 0, categoryId: 'work', categorySnapshot: { label: 'Việc' }, nextNote: 'làm báo cáo', dk: `2026-06-2${i}`, dn: dn + 10 + i, weekday: i, wk: 'W2' });
  for (let i = 0; i < 4; i += 1) h.push({ hour: 9, minutes: 35, completed: true, goalAchieved: true, categoryId: 'study', categorySnapshot: { label: 'Học' }, nextNote: 'đọc sách lịch sử', dk: `2026-05-2${i}`, dn: dn - 20 + i, weekday: i, wk: 'W1' });
  for (let i = 0; i < 2; i += 1) h.push({ hour: 23, minutes: 5, completed: false, cancelled: true, status: 'cancelled', dk: `2026-06-2${5 + i}`, dn: dn + 16 + i, weekday: i, wk: 'W2' });
  return h;
}

const idx = buildIntentIndex();
const bundle = buildCoachBundle(fixture(), opts, store, null);

test('mọi ý định trả lời + KHÔNG dùng từ nhân-quả', () => {
  const questions = [
    'hôm nay thế nào', 'tuần này so tuần trước', 'tôi đang tiến bộ không', 'giờ vàng của mình',
    'nên làm phiên bao nhiêu phút', 'chuỗi của tôi mấy ngày', 'mục tiêu ngày có hợp không',
    'loại việc nào tôi nhiều nhất', 'sao tôi hay bỏ phiên', 'làm khuya có ổn không',
    'giờ này nên làm gì', 'dạo này tôi hay làm gì', 'tôi có đều đặn không',
    'tóm tắt giúp tôi', 'kỷ lục của tôi', 'bạn làm được gì',
  ];
  for (const q of questions) {
    const r = answerQuestion(q, bundle, idx);
    assert.ok(r.answer && r.answer.length > 0, `"${q}" không có đáp`);
    assert.doesNotThrow(() => assertNoCausal(r.answer), `"${q}" → đáp chứa từ nhân-quả: ${r.answer}`);
  }
});

test('streak đọc từ store, có số ngày', () => {
  const r = answerQuestion('chuỗi của tôi mấy ngày rồi', bundle, idx);
  assert.equal(r.intent, 'streak');
  assert.match(r.answer, /3 ngày/);
  assert.match(r.answer, /9 ngày/); // longest
});

test('có % thì phải kèm cỡ mẫu (trên N phiên/ngày/lần)', () => {
  for (const q of ['giờ vàng của mình', 'sao tôi hay bỏ phiên']) {
    const r = answerQuestion(q, bundle, idx);
    if (/%/.test(r.answer)) assert.match(r.answer, /trên\s+\d+\s+(phiên|ngày|lần)/, `"${q}" có % nhưng thiếu cỡ mẫu: ${r.answer}`);
  }
});

test('chào hỏi → smalltalk; lạc đề → mời Claude', () => {
  assert.ok(classifySmalltalk('chào bạn'));
  assert.equal(answerQuestion('chào bạn', bundle, idx).status, 'smalltalk');
  assert.equal(isOutOfDomain('thời tiết hôm nay thế nào'), true);
  const r = answerQuestion('dịch câu này sang tiếng anh', bundle, idx);
  assert.equal(r.action?.type, 'suggest_claude');
});

test('thiếu dữ liệu → "chưa đủ", không bịa số', () => {
  const empty = buildCoachBundle([], opts, { streak: { currentStreak: 0, longestStreak: 0 } }, null);
  const r = answerQuestion('giờ vàng của mình', empty, idx);
  assert.equal(r.status, 'insufficient');
  assert.match(r.answer, /chưa đủ/i);
});

test('tất định: hỏi 2 lần cùng câu → đáp y hệt', () => {
  assert.equal(answerQuestion('tuần này so tuần trước', bundle, idx).answer, answerQuestion('tuần này so tuần trước', bundle, idx).answer);
});
