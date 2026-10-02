import test from 'node:test';
import assert from 'node:assert/strict';

import { reduce } from './timer.js';
import { currentStreak, dayKey, lastDays, retention, todaySummary } from './stats.js';
import { legacyEvents } from './legacyImport.js';

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

function legacySession(id, iso, minutes = 25, status = 'completed') {
  return { id, finishedAt: iso, startedAt: iso, minutes, status, categoryId: 'cat_tu_hoc' };
}

test('dayKey follows the Vietnam calendar: 23:50 in Hanoi is still that day', () => {
  assert.equal(dayKey(Date.parse('2026-10-03T16:50:00Z')), '2026-10-03'); // 23:50 +07
  assert.equal(dayKey(Date.parse('2026-10-03T17:10:00Z')), '2026-10-04'); // 00:10 +07
});

test('legacy import is idempotent and keeps statuses', () => {
  const raw = [{ data: { state: {
    sessionCategories: [{ id: 'cat_tu_hoc', label: 'Tự Học', color: '#6366f1', icon: '📚' }],
    history: [
      legacySession(1, '2026-09-06T10:09:34Z'),
      legacySession(2, '2026-09-17T12:12:21Z', 2, 'cancelled'),
      { id: 3 }, // no time at all → dropped
    ],
  } } }][0];
  const once = legacyEvents(raw);
  const twice = new Map([...once, ...legacyEvents(raw)].map((e) => [e.id, e]));
  assert.equal(once.length, 3);
  assert.equal(twice.size, 3);
  const st = reduce(once);
  assert.equal(st.sessions.get('legacy:1').status, 'completed');
  assert.equal(st.sessions.get('legacy:1').legacy, true);
  assert.equal(st.sessions.get('legacy:2').status, 'cancelled');
  assert.equal(st.categories.get('cat_tu_hoc').label, 'Tự Học');
});

test('streak survives an unfinished today, breaks on an empty yesterday', () => {
  const now = Date.parse('2026-10-03T05:00:00Z');
  const st = reduce(legacyEvents({ history: [
    legacySession(1, new Date(now - 2 * DAY).toISOString()),
    legacySession(2, new Date(now - DAY).toISOString()),
  ] }));
  assert.equal(currentStreak(st, now), 2, 'nothing yet today, the streak still stands');
  assert.equal(currentStreak(st, now + 2 * DAY), 0);
});

test('retention numbers on a real-shaped log (3 active days, then two silent weeks)', () => {
  const st = reduce(legacyEvents({ history: [
    legacySession(1, '2026-09-06T10:00:00Z'), legacySession(2, '2026-09-06T11:00:00Z'),
    legacySession(3, '2026-09-07T12:00:00Z'), legacySession(4, '2026-09-08T09:00:00Z'),
  ] }));
  const r = retention(st, Date.parse('2026-10-03T05:00:00Z'), 4);
  assert.equal(r.activeDaysPerWeek, 3 / 4);
  assert.equal(r.sessionsPerActiveDay, 4 / 3);
  assert.equal(r.daysSinceLast, 25);
  assert.equal(r.longestGapDays, 25);
  assert.equal(r.streak, 0);
});

test('today summary and the 7-day strip only count completed sessions', () => {
  const now = Date.parse('2026-10-03T08:00:00Z');
  const st = reduce(legacyEvents({ history: [
    legacySession(1, '2026-10-03T02:00:00Z', 25),
    legacySession(2, '2026-10-03T03:00:00Z', 50),
    legacySession(3, '2026-10-03T04:00:00Z', 4, 'cancelled'),
  ] }));
  assert.deepEqual(todaySummary(st, now), { count: 2, minutes: 75 });
  const strip = lastDays(st, now, 7);
  assert.equal(strip.length, 7);
  assert.equal(strip.at(-1).key, '2026-10-03');
  assert.equal(strip.at(-1).count, 2);
});
