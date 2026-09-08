/**
 * dayArc.test.js — the long rhythms (ADR-081): every day closes, no day scolds, nothing repeats.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_CLOSE_HOUR, describeDayClose, describeDayOpen, describeWeekClose, describeWeekOpen, pickArcMoment,
} from './dayArc.js';

const DAY = '2026-09-08';
const WEEK = '2026-09-07';

test('a day that opens knows what yesterday was, and greets an empty yesterday without a reproach', () => {
  const worked = describeDayOpen({ yesterdaySessions: 3, yesterdayMinutes: 95, streakDays: 4 });
  assert.equal(worked.title, 'Ngày mới');
  assert.match(worked.line, /Hôm qua 3 phiên · 1 giờ 35 phút · chuỗi 4 ngày\./);
  const rested = describeDayOpen({ yesterdaySessions: 0 });
  assert.match(rested.line, /chờ viên gạch đầu tiên/);
  for (const word of ['bỏ', 'lỡ', 'tiếc', 'chưa làm', 'thất bại']) {
    assert.ok(!rested.line.toLowerCase().includes(word), `a rest day must not be scolded ("${word}")`);
  }
});

test('a night gift takes over the morning greeting and names the project', () => {
  const gift = describeDayOpen({ yesterdaySessions: 3, nightGiftLabel: 'Kho Gia Vị' });
  assert.equal(gift.tone, 'gift');
  assert.match(gift.title, /Đêm qua có người xây giúp/);
  assert.match(gift.line, /^Kho Gia Vị nhích thêm một viên gạch\.$/);
});

test('a small day closes as warmly as a big one — different words, same good news', () => {
  const big = describeDayClose({ sessions: 5, minutes: 130, goalMet: true });
  assert.equal(big.tone, 'met');
  assert.match(big.title, /Xong mục tiêu/);
  assert.match(big.line, /^5 phiên · 2 giờ 10 phút\.$/);
  const small = describeDayClose({ sessions: 1, minutes: 25, goalMet: false });
  assert.equal(small.tone, 'some');
  assert.match(small.title, /khép lại/);
  assert.match(small.line, /^1 phiên · 25 phút\.$/);
  // THE law of this file: no branch may read as a failure.
  for (const text of [small.title, small.line]) {
    assert.doesNotMatch(text, /chưa|thiếu|hụt|không đạt|tiếc/i, `"${text}" reads as a failure`);
  }
});

test('the week opens with last week and closes with what was built', () => {
  assert.match(describeWeekOpen({ lastWeekSessions: 12, lastWeekMinutes: 400 }).line, /Tuần trước 12 phiên · 6 giờ 40 phút\./);
  assert.match(describeWeekOpen({}).line, /Trang giấy trắng/);
  assert.match(describeWeekClose({ sessions: 12, minutes: 400 }).line, /^12 phiên · 6 giờ 40 phút\.$/);
});

test('pickArcMoment: a close outranks an open, the week outranks the day, and each fires ONCE', () => {
  const base = {
    dayKey: DAY, weekKey: WEEK, hour: 9, weekday: 2, yesterday: { sessions: 2, minutes: 50 },
    today: { sessions: 0, minutes: 0 }, lastWeek: { sessions: 9, minutes: 250 }, thisWeek: { sessions: 4, minutes: 110 },
  };
  // Nothing seen yet ⇒ the week's opening wins, and it stamps the day too (they never stack).
  const first = pickArcMoment(base);
  assert.equal(first.moment.id, 'week-open');
  assert.deepEqual(first.stamps, { weekOpen: WEEK, dayOpen: DAY });
  // With that stamped, the same morning is silent.
  assert.equal(pickArcMoment({ ...base, seen: first.stamps }), null);
  // A new day inside the same week ⇒ the day's opening.
  const nextDay = pickArcMoment({ ...base, dayKey: '2026-09-09', seen: first.stamps });
  assert.equal(nextDay.moment.id, 'day-open');
  assert.deepEqual(nextDay.stamps, { dayOpen: '2026-09-09' });
  // The goal falls ⇒ the day closes at once, ahead of everything.
  const met = pickArcMoment({ ...base, seen: first.stamps, today: { sessions: 5, minutes: 130 }, goalMet: true });
  assert.equal(met.moment.id, 'day-close');
  assert.equal(met.moment.tone, 'met');
  // No goal, but the evening came with work behind it ⇒ it still closes, kindly.
  const evening = pickArcMoment({ ...base, seen: first.stamps, hour: DAY_CLOSE_HOUR, today: { sessions: 1, minutes: 25 } });
  assert.equal(evening.moment.tone, 'some');
  // A day with NO session is never closed — there is nothing to say, so the app says nothing.
  assert.equal(pickArcMoment({ ...base, seen: first.stamps, hour: 23, today: { sessions: 0 } }), null);
  // Sunday evening closes the week.
  const sunday = pickArcMoment({ ...base, seen: { ...first.stamps, dayClose: DAY }, weekday: 0, hour: 20 });
  assert.equal(sunday.moment.id, 'week-close');
});
