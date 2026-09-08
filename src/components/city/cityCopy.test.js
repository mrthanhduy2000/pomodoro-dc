/**
 * cityCopy.test.js — the City tab's sentences, and the shelf that must fit.
 *
 * RED WHEN: a slot in a sealed era goes back to «chưa xây» with no path and no price · a tile grows a
 * third word · the strip scrolls again · the rate is typed instead of read from the economy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripComments } from '../../utils/sourceScan.js';
import { SP_PER_BUILDING } from '../../engine/skillPointEconomy.js';
import { SP_TAG, eraStatusLine, eraTile, slotNote } from './cityCopy.js';

const SWITCHER = stripComments(readFileSync(new URL('./EraSwitcher.jsx', import.meta.url), 'utf8'));

test('SP_TAG reads the economy, never a typed rate', () => {
  assert.equal(SP_TAG, `+${SP_PER_BUILDING} SP`);
});

test('an unbuilt slot names its price; in a sealed era it names the path too (ADR-012), never "forever locked"', () => {
  assert.equal(slotNote('empty'), `chưa xây · +${SP_PER_BUILDING} SP`);
  assert.equal(slotNote('empty', { sealed: true }), `trùng tu được · +${SP_PER_BUILDING} SP`);
  assert.equal(slotNote('building', { sealed: true }), 'đang xây');
  assert.equal(slotNote('built'), null);
  assert.doesNotMatch(slotNote('empty', { sealed: true }), /vĩnh viễn|khoá/, 'restoration exists — do not promise a lock');
});

test('the era status line carries the plaque: status first, then the session count', () => {
  assert.equal(eraStatusLine({ isCurrent: true, sessionCount: 211 }), 'Đang xây · 211 phiên');
  assert.equal(eraStatusLine({ sealedAt: '2026-05-01', sessionCount: 143 }), 'Đã niêm phong 2026-05-01 · 143 phiên');
  assert.equal(eraStatusLine({ sealedAt: null, sessionCount: 0 }), 'Đã niêm phong');
  assert.equal(eraStatusLine({ isLost: true, sessionCount: 9 }), 'Thất truyền');
});

const done = (n, opts = {}) => ({
  era: 7, label: 'Kỷ Bảy', sealedAt: '2026-03-03',
  completion: { done: n, total: 5, isComplete: n === 5, slots: opts.slots ?? [] },
  ...opts,
});

test('a tile says one thing per line: the era, then ★ | fraction | — and never «đang xây»', () => {
  const complete = eraTile(done(5));
  assert.equal(complete.title, 'Kỷ 7');
  assert.equal(complete.mark, '★', 'a star MEANS five of five — no fraction beside it');
  assert.equal(complete.tone, 'complete');

  const partial = eraTile(done(4));
  assert.equal(partial.mark, '4/5');
  assert.equal(partial.tone, 'sealed');

  const restoring = eraTile(done(4, { slots: [{ state: 'building' }] }));
  assert.equal(restoring.mark, '4/5');
  assert.equal(restoring.tone, 'open', 'a sealed era with a restoration in flight keeps the accent tone');
  assert.match(restoring.aria, /đang trùng tu/);

  const current = eraTile(done(2, { isCurrent: true, sealedAt: null }));
  assert.equal(current.tone, 'current');
  assert.match(current.aria, /đang xây/);

  const lost = eraTile({ era: 1, label: 'Kỷ Một', isLost: true });
  assert.equal(lost.mark, '—');
  assert.equal(lost.tone, 'lost');

  for (const t of [complete, partial, restoring, current, lost]) {
    assert.doesNotMatch(`${t.title}${t.mark}`, /đang xây|xây/, 'the words went back on the tile — it will not fit three rows');
    assert.ok(`${t.title} ${t.mark}`.length <= 10, `tile text too long to fit 40 px: "${t.title} ${t.mark}"`);
  }
});

test('EraSwitcher wraps (auto-fill grid), never scrolls, and reads its words from cityCopy', () => {
  assert.match(SWITCHER, /import\s*\{\s*eraTile\s*\}\s*from\s*'\.\/cityCopy'/);
  assert.match(SWITCHER, /eraTile\(/, 'eraTile is imported but never called');
  assert.match(SWITCHER, /repeat\(auto-fill,\s*minmax\(40px,\s*1fr\)\)/, 'the wrapping grid is gone');
  assert.doesNotMatch(SWITCHER, /overflow-x-auto|overflow-x-scroll|overflowX/, 'a horizontal scroller is back (ADR-080 forbids it)');
  assert.doesNotMatch(SWITCHER, /ResizeObserver|scrollIntoView/, 'the scroll-to-active machinery is back');
  assert.doesNotMatch(SWITCHER, /đang xây/, 'the tile grew the words that broke the three-row promise');
});
