import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MIN_COUNTED_MS,
  canFinishEarly,
  cmdCancel,
  cmdEndBreak,
  cmdFinishEarly,
  cmdPause,
  cmdResume,
  cmdSkipBreak,
  cmdStartBreak,
  cmdStartFocus,
  completeId,
  dueEvents,
  justFinished,
  reduce,
  timeline,
} from './timer.js';

const MIN = 60_000;
const T0 = Date.parse('2026-10-03T02:00:00.000Z'); // 09:00 in Hanoi

function start(log, at, sid = 's1', targetMin = 25, extra = {}) {
  const e = cmdStartFocus(reduce(log), at, { sid, targetMin, ...extra });
  assert.ok(e, 'start must be allowed');
  return [...log, e];
}

test('a focus run to its target is completed at its THEORETICAL end, even if nobody looked for hours', () => {
  const log = start([], T0);
  // The tab was frozen by iOS; the next time anything runs is 6 hours later.
  const later = T0 + 6 * 60 * MIN;
  const state = reduce(log, later);
  assert.equal(state.active, null);
  const s = state.sessions.get('s1');
  assert.equal(s.status, 'completed');
  assert.equal(s.endedAt, T0 + 25 * MIN, 'ended at start + target, not when a device woke up');
  assert.equal(s.minutes, 25);
});

test('dueEvents emits the completion with a deterministic id and the theoretical end time', () => {
  const log = start([], T0);
  assert.deepEqual(dueEvents(reduce(log), T0 + 24 * MIN), [], 'nothing is due before the end');
  const due = dueEvents(reduce(log), T0 + 90 * MIN);
  assert.equal(due.length, 1);
  assert.equal(due[0].id, completeId('s1'));
  assert.equal(due[0].at, T0 + 25 * MIN);
});

test('two devices emitting the same completion keep ONE session (union by id)', () => {
  const log = start([], T0);
  const phone = dueEvents(reduce(log), T0 + 26 * MIN);
  const mac = dueEvents(reduce(log), T0 + 40 * MIN);
  const merged = new Map([...log, ...phone, ...mac].map((e) => [e.id, e]));
  assert.equal(merged.size, log.length + 1);
  const state = reduce([...merged.values()], T0 + 60 * MIN);
  assert.equal([...state.sessions.values()].filter((s) => s.status === 'completed').length, 1);
});

test('the result never depends on the order events arrive in', () => {
  let log = start([], T0);
  log = [...log, cmdPause(reduce(log), T0 + 5 * MIN, 'p1')];
  log = [...log, cmdResume(reduce(log), T0 + 9 * MIN, 'r1')];
  log = [...log, ...dueEvents(reduce(log), T0 + 60 * MIN)];
  log = [...log, cmdStartBreak(reduce(log, T0 + 60 * MIN), T0 + 60 * MIN, { sid: 'b1', targetMin: 5 })];
  const want = JSON.stringify([...reduce(log, T0 + 2 * 60 * MIN).sessions.values()]);
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 50; i += 1) {
    const shuffled = [...log];
    for (let j = shuffled.length - 1; j > 0; j -= 1) {
      const k = Math.floor(rand() * (j + 1));
      [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
    }
    assert.equal(JSON.stringify([...reduce(shuffled, T0 + 2 * 60 * MIN).sessions.values()]), want);
  }
});

test('pausing stops the clock; the session ends later by exactly the paused time', () => {
  let log = start([], T0);
  log = [...log, cmdPause(reduce(log), T0 + 10 * MIN, 'p1')];
  // Paused for an hour: a paused timer never completes on its own.
  assert.deepEqual(dueEvents(reduce(log), T0 + 70 * MIN), []);
  assert.equal(reduce(log, T0 + 70 * MIN).active?.sid, 's1');
  log = [...log, cmdResume(reduce(log), T0 + 70 * MIN, 'r1')];
  const tl = timeline(reduce(log), T0 + 75 * MIN);
  assert.equal(tl.elapsedMs, 15 * MIN);
  assert.equal(tl.endsAt, T0 + 85 * MIN);
  assert.equal(reduce(log, T0 + 86 * MIN).sessions.get('s1').endedAt, T0 + 85 * MIN);
});

test('pause and resume are idempotent when two devices both press them', () => {
  let log = start([], T0);
  log = [
    ...log,
    { id: 'p-phone', at: T0 + 10 * MIN, kind: 'focus.pause', data: { sid: 's1' } },
    { id: 'p-mac', at: T0 + 11 * MIN, kind: 'focus.pause', data: { sid: 's1' } },
    { id: 'r-phone', at: T0 + 20 * MIN, kind: 'focus.resume', data: { sid: 's1' } },
    { id: 'r-mac', at: T0 + 21 * MIN, kind: 'focus.resume', data: { sid: 's1' } },
  ];
  assert.equal(timeline(reduce(log), T0 + 30 * MIN).elapsedMs, 20 * MIN, 'paused from 10 to 20 only');
});

test('cancel records the session as cancelled, with NO penalty field of any kind', () => {
  let log = start([], T0);
  log = [...log, cmdCancel(reduce(log), T0 + 3 * MIN)];
  const s = reduce(log, T0 + 60 * MIN).sessions.get('s1');
  assert.equal(s.status, 'cancelled');
  assert.deepEqual(Object.keys(s).filter((k) => /penal|lost|cost/i.test(k)), []);
});

test('an early finish counts only after the minimum focused time', () => {
  let log = start([], T0, 's1', 50);
  assert.equal(canFinishEarly(reduce(log), T0 + 5 * MIN), false);
  assert.equal(cmdFinishEarly(reduce(log), T0 + 5 * MIN), null);
  const at = T0 + MIN_COUNTED_MS + MIN;
  log = [...log, cmdFinishEarly(reduce(log), at)];
  const s = reduce(log, at + MIN).sessions.get('s1');
  assert.equal(s.status, 'completed');
  assert.equal(s.early, true);
  assert.equal(s.minutes, 11);
});

test('a hand-written early completion below the minimum is stored as cancelled, not as a brick', () => {
  let log = start([], T0);
  log = [...log, { id: completeId('s1'), at: T0 + 2 * MIN, kind: 'focus.complete', data: { sid: 's1' } }];
  assert.equal(reduce(log, T0 + 60 * MIN).sessions.get('s1').status, 'cancelled');
});

test('a second start while one is running supersedes it (two devices both pressed start)', () => {
  let log = start([], T0, 'phone');
  log = [...log, { id: 'focus.start:mac', at: T0 + 2 * MIN, kind: 'focus.start', data: { sid: 'mac', targetMin: 25 } }];
  const state = reduce(log, T0 + 10 * MIN);
  assert.equal(state.sessions.get('phone').status, 'superseded');
  assert.equal(state.active.sid, 'mac');
  assert.equal(cmdStartFocus(state, T0 + 10 * MIN, { sid: 'x', targetMin: 25 }), null, 'UI cannot start a third');
});

test('break: starts only when idle, ends at its theoretical end, and can be skipped', () => {
  let log = start([], T0);
  assert.equal(cmdStartBreak(reduce(log), T0 + MIN, { sid: 'b1', targetMin: 5 }), null, 'no break during focus');
  const afterFocus = T0 + 25 * MIN;
  log = [...log, ...dueEvents(reduce(log), afterFocus)];
  log = [...log, cmdStartBreak(reduce(log, afterFocus), afterFocus, { sid: 'b1', targetMin: 5 })];
  assert.equal(reduce(log, afterFocus + MIN).active.mode, 'break');
  assert.deepEqual(dueEvents(reduce(log), afterFocus + 6 * MIN).map((e) => e.kind), ['break.end']);
  assert.equal(reduce(log, afterFocus + 6 * MIN).active, null);
  const skipped = [...log, cmdEndBreak(reduce(log), afterFocus + MIN)];
  const st = reduce(skipped, afterFocus + 2 * MIN);
  assert.equal(st.active, null);
  assert.equal(st.breaksTaken, 1);
});

test('unknown event kinds and malformed rows are ignored, never fatal', () => {
  const log = [
    ...start([], T0),
    { id: 'x', at: T0 + 1, kind: 'city.something-from-the-future', data: {} },
    { id: 'bad', at: 'nope', kind: 'focus.pause' },
    null,
  ];
  assert.equal(reduce(log, T0 + MIN).active.sid, 's1');
});

test('prefs and categories: last write by time wins, per field', () => {
  const log = [
    { id: 'a', at: 10, kind: 'prefs.set', data: { focusMin: 50 } },
    { id: 'b', at: 5, kind: 'prefs.set', data: { focusMin: 30, breakMin: 10 } },
    { id: 'c', at: 1, kind: 'category.upsert', data: { id: 'k', label: 'Old' } },
    { id: 'd', at: 2, kind: 'category.upsert', data: { id: 'k', label: 'New' } },
  ];
  const st = reduce(log);
  assert.equal(st.prefs.focusMin, 50);
  assert.equal(st.prefs.breakMin, 10);
  assert.equal(st.categories.get('k').label, 'New');
});

test('a finished session can never be restarted by a late start carrying the same sid', () => {
  let log = start([], T0);
  log = [...log, ...dueEvents(reduce(log), T0 + 30 * MIN)];
  // e.g. an old client replaying its start under a different event id, dated after the end
  log = [...log, { id: 'replay', at: T0 + 40 * MIN, kind: 'focus.start', data: { sid: 's1', targetMin: 25 } }];
  const state = reduce(log, T0 + 50 * MIN);
  assert.equal(state.active, null);
  assert.equal(state.sessions.get('s1').status, 'completed');
  assert.equal(state.sessions.get('s1').endedAt, T0 + 25 * MIN);
});

test('the "just finished" panel is derived from the log: it survives a reload and closes for good', () => {
  let log = start([], T0);
  log = [...log, ...dueEvents(reduce(log), T0 + 26 * MIN)];
  const end = T0 + 25 * MIN;
  assert.equal(justFinished(reduce(log, end + MIN), end + MIN)?.sid, 's1');
  assert.equal(justFinished(reduce(log, end + 31 * MIN), end + 31 * MIN), null, 'stale after 30 minutes');

  const skipped = [...log, cmdSkipBreak(reduce(log, end + MIN), end + MIN)];
  assert.equal(justFinished(reduce(skipped, end + 2 * MIN), end + 2 * MIN), null, 'skip is remembered (a reload replays it)');
  assert.equal(cmdSkipBreak(reduce(skipped, end + 2 * MIN), end + 2 * MIN), null);

  const rested = [...log, cmdStartBreak(reduce(log, end + MIN), end + MIN, { sid: 'b1', targetMin: 5, after: 's1' })];
  assert.equal(justFinished(reduce(rested, end + 10 * MIN), end + 10 * MIN), null, 'not back after the break ends');

  let next = [...log, cmdStartFocus(reduce(log, end + 2 * MIN), end + 2 * MIN, { sid: 's2', targetMin: 25 })];
  next = [...next, cmdCancel(reduce(next), end + 3 * MIN)];
  assert.equal(justFinished(reduce(next, end + 4 * MIN), end + 4 * MIN), null, 'an old panel never returns after a newer start');
});
