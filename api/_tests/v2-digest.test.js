import test from 'node:test';
import assert from 'node:assert/strict';

import { pickV2Nudge } from '../_lib/v2Digest.js';

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const T0 = Date.parse('2026-10-05T02:00:00.000Z'); // Monday 09:00 Hanoi

const session = (sid, at) => [
  { id: `focus.start:${sid}`, at, kind: 'focus.start', data: { sid, targetMin: 25, categoryId: 'cat_hoc_dh' } },
  { id: `focus.complete:${sid}`, at: at + 25 * MIN, kind: 'focus.complete', data: { sid } },
];
const plan = (at, key = 'e1-1') => ({ id: 'build.plan:p1', at, kind: 'build.plan', data: { planId: 'p1', blueprint: key, plot: { x: 0, y: 0 } } });
const at17 = (day) => T0 + day * DAY + 8 * 60 * MIN; // 17:00 Hanoi, when the cron runs

test('never used the game → silence (no nagging a stranger)', () => {
  assert.equal(pickV2Nudge([], at17(0)), null);
});

test('absent ≥ 2 days → welcome back, naming the building and its missing storeys', () => {
  const log = [plan(T0 - MIN), ...session('a', T0)];
  const n = pickV2Nudge(log, at17(3));
  assert.equal(n.reason, 'welcome-back');
  assert.match(n.payload.body, /nhân đôi/);
  assert.match(n.payload.body, /«Nhà dài» còn 7 tầng/);
  assert.equal(n.payload.app, 'v2', 'routed to v2 subscriptions only');
  assert.equal(n.payload.url, '/v2/');
});

test('a building close to done and nothing today → name it', () => {
  const log = [plan(T0 - MIN, 'e1-0')];
  for (let i = 0; i < 2; i += 1) log.push(...session(`s${i}`, T0 + i * 30 * MIN));
  const n = pickV2Nudge(log, at17(1));
  assert.equal(n.reason, 'unfinished');
  assert.match(n.payload.title, /«Lều đá» còn 2 viên/);
});

test('one session short of a full day → the lantern; a full day → silence', () => {
  const log = [plan(T0 - MIN, 'e1-4')];
  for (let i = 0; i < 3; i += 1) log.push(...session(`s${i}`, T0 + i * 30 * MIN));
  assert.equal(pickV2Nudge(log, at17(0)).reason, 'full-day');
  log.push(...session('s3', T0 + 3 * 30 * MIN));
  assert.equal(pickV2Nudge(log, at17(0)), null, 'goal reached: never nag');
});

test('a streak breaking tonight', () => {
  const log = [plan(T0 - MIN, 'e1-4')];
  for (let d = 0; d < 3; d += 1) log.push(...session(`d${d}`, T0 + d * DAY));
  const n = pickV2Nudge(log, at17(3));
  assert.equal(n.reason, 'streak');
  assert.match(n.payload.title, /Chuỗi 3 ngày/);
});
