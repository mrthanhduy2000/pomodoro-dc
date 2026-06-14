import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractImportSummary,
  formatFocusMinutes,
  looksLikeGameExport,
  countUnlocked,
} from './importSummary.js';

test('formatFocusMinutes formats minutes and hours', () => {
  assert.equal(formatFocusMinutes(0), '0 phút');
  assert.equal(formatFocusMinutes(45), '45 phút');
  assert.equal(formatFocusMinutes(60), '1h');
  assert.equal(formatFocusMinutes(90), '1h 30m');
  assert.equal(formatFocusMinutes(125), '2h 5m');
});

test('countUnlocked handles arrays and {id:true} maps', () => {
  assert.equal(countUnlocked(['a', 'b', 'c']), 3);
  assert.equal(countUnlocked({ a: true, b: false, c: true }), 2);
  assert.equal(countUnlocked(null), 0);
  assert.equal(countUnlocked(undefined), 0);
});

test('looksLikeGameExport accepts real exports and rejects junk', () => {
  assert.equal(looksLikeGameExport({ player: { level: 3 } }), true);
  assert.equal(looksLikeGameExport({ progress: {} }), true);
  assert.equal(looksLikeGameExport({ history: [] }), true);
  assert.equal(looksLikeGameExport({ foo: 'bar' }), false);
  assert.equal(looksLikeGameExport('not an object'), false);
  assert.equal(looksLikeGameExport(null), false);
});

test('extractImportSummary reads the key fields defensively', () => {
  const data = {
    _version: 5,
    _exportedAt: '2026-05-01T10:00:00+07:00',
    player: { level: 7 },
    progress: { sessionsCompleted: 123, totalFocusMinutes: 4560 },
    history: [{ id: 1 }, { id: 2 }],
    prestige: { count: 2 },
    relics: { r1: true, r2: true, r3: false },
    achievements: { unlocked: { a1: true, a2: true } },
  };
  const s = extractImportSummary(data);
  assert.equal(s.version, 5);
  assert.equal(s.exportedAt, '2026-05-01T10:00:00+07:00'); // raw ISO, UI formats it
  assert.equal(s.level, 7);
  assert.equal(s.sessions, 123);
  assert.equal(s.historyCount, 2);
  assert.equal(s.focusMinutes, 4560);
  assert.equal(s.prestige, 2);
  assert.equal(s.relics, 2);
  assert.equal(s.achievements, 2);
});

test('extractImportSummary falls back gracefully on a sparse file', () => {
  const s = extractImportSummary({ history: [{ id: 1 }, { id: 2 }, { id: 3 }] });
  assert.equal(s.level, 0);
  assert.equal(s.sessions, 3); // falls back to history length
  assert.equal(s.focusMinutes, 0);
  assert.equal(s.prestige, 0);
  assert.equal(s.relics, 0);
});
