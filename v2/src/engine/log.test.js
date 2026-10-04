import test from 'node:test';
import assert from 'node:assert/strict';

import { eventToRow, isMissingTableError, mergeEvents, pullAll, rowToEvent } from './log.js';

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

/** A fake events_v2: rows become visible when committed, in any order, with server times. */
function fakeTable() {
  const rows = [];
  return {
    commit(seq, createdAt) { rows.push({ id: `e${seq}`, seq, at: new Date(createdAt).toISOString(), kind: 'k', data: {}, created_at: new Date(createdAt).toISOString() }); },
    fetchPage: async (after, limit) => rows.filter((r) => r.seq > after).sort((a, b) => a.seq - b.seq).slice(0, limit),
  };
}

test('a row that commits AFTER a higher seq is still pulled (the cursor never jumps a fresh row)', async () => {
  const T = Date.parse('2026-10-05T03:00:00Z');
  const db = fakeTable();
  db.commit(9, T - 5 * 60_000);
  db.commit(11, T); // 10 started first but has not committed yet
  const first = await pullAll(db.fetchPage, 0, T + 1000);
  assert.deepEqual(first.events.map((e) => e.id), ['e9', 'e11']);
  assert.equal(first.cursor, 9, 'stops before the fresh row, not at 11');
  db.commit(10, T - 50);
  const second = await pullAll(db.fetchPage, first.cursor, T + 2000);
  assert.ok(second.events.some((e) => e.id === 'e10'), 'the late row arrives');
  const later = await pullAll(db.fetchPage, second.cursor, T + 5 * 60_000);
  assert.equal(later.cursor, 11, 'once everything has settled the cursor catches up');
  assert.equal((await pullAll(db.fetchPage, later.cursor, T + 6 * 60_000)).events.length, 0, 'and a quiet table costs nothing');
});

test('pullAll pages through everything, and a device clock running behind still settles old rows', async () => {
  const T = Date.parse('2026-10-05T03:00:00Z');
  const db = fakeTable();
  for (let s = 1; s <= 7; s += 1) db.commit(s, T + s * 60_000);
  const r = await pullAll(db.fetchPage, 0, T - 24 * 3_600_000, 2);
  assert.equal(r.events.length, 7);
  assert.equal(r.cursor, 6, 'rows ≥ 60 s older than the newest one count as settled');
});
