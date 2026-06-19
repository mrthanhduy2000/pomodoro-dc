import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCoachContext } from './coachContext.js';

const getEntryHour = (e) => e.hour;

test('coach context: empty history asks to start', () => {
  const s = buildCoachContext([], { currentStreak: 0 });
  assert.match(s, /chưa có phiên/);
});

test('coach context: summarizes real data, daily goal, categories and notes', () => {
  const h = [];
  for (let i = 0; i < 6; i += 1) {
    h.push({
      hour: 9, minutes: 40, completed: true, goalAchieved: true,
      categoryId: 'study', categorySnapshot: { label: 'Học' },
      nextNote: i === 5 ? 'viết chương 2 luận văn' : '',
      dk: `2026-06-${String(10 + i).padStart(2, '0')}`, dn: 100 - (5 - i),
    });
  }
  const s = buildCoachContext(h, {
    nowHour: 9, getEntryHour, currentStreak: 3,
    dailyGoalMetric: 'sessions', dailyGoal: 5, sessionsToday: 2,
    activeCategoryIds: new Set(['study']),
    categoryLabelOf: (id) => (id === 'study' ? 'Học' : null),
  });
  assert.match(s, /Tổng quan:/);
  assert.match(s, /Chuỗi hiện tại: 3 ngày/);
  assert.match(s, /Hôm nay: 2\/5 phiên/);
  assert.match(s, /Học/);
  assert.match(s, /luận văn/);
});

test('coach context: strips HTML from rich-text notes', () => {
  const h = [{ hour: 9, minutes: 30, completed: true, note: '<p>ôn <b>thi</b> toán</p>' }];
  const s = buildCoachContext(h, { nowHour: 9, getEntryHour, currentStreak: 1 });
  assert.match(s, /ôn thi toán/);
  assert.doesNotMatch(s, /<p>|<b>/);
});
