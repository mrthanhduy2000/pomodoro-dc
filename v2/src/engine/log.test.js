import test from 'node:test';
import assert from 'node:assert/strict';

import { eventToRow, isMissingTableError, mergeEvents, rowToEvent } from './log.js';

test('merge is a union by id: the first copy wins and nothing is duplicated', () => {
  const a = [{ id: 'x', at: 1, kind: 'k', data: { v: 'local' } }];
  const { events, added } = mergeEvents(a, [
    { id: 'x', at: 1, kind: 'k', data: { v: 'remote' } },
    { id: 'y', at: 2, kind: 'k', data: {} },
    { id: 'y', at: 2, kind: 'k', data: {} },
    { nope: true },
  ]);
  assert.deepEqual(events.map((e) => e.id), ['x', 'y']);
  assert.equal(events[0].data.v, 'local');
  assert.equal(added.length, 1);
  assert.equal(mergeEvents(a, []).events, a, 'no change keeps the same array (cheap re-render check)');
});

test('row round-trip keeps id, time to the millisecond, kind and data', () => {
  const e = { id: 'focus.start:abc', at: Date.parse('2026-10-03T02:00:00.123Z'), kind: 'focus.start', data: { sid: 'abc' } };
  const row = eventToRow(e, 'dev1');
  assert.equal(row.device, 'dev1');
  assert.deepEqual(rowToEvent({ ...row, seq: 9 }), e);
  assert.equal(rowToEvent({ id: 'x', at: 'garbage', kind: 'k' }), null);
});

test('a missing events_v2 table is recognised in both Postgres and PostgREST shapes', () => {
  assert.equal(isMissingTableError({ code: '42P01' }), true);
  assert.equal(isMissingTableError({ code: 'PGRST205', message: "Could not find the table 'public.events_v2'" }), true);
  assert.equal(isMissingTableError({ code: '23505' }), false);
});
