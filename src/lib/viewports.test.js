/**
 * viewports.test.js — the reference frame is a fact the whole app quotes, so it gets a guard.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { LAPTOP, PHONE, LAPTOP_FOLD, TWO_COLUMN_MIN } from './viewports.js';

// ⚠️ ROUND 63 (ADR-099) — THE NUMBER THAT WAS WRONG FOR FOURTEEN ROUNDS.
// Every brief from round 38 to 62 said 390px was the frame Đàm used most; it is 2% of his use. The
// constant exists so no round has to guess again, and this case exists so nobody edits it casually.
// RED WHEN: the laptop stops being the first frame, or the fold stops being the browser height.
test('the reference frame is the laptop, and the fold is the BROWSER height, not the display', () => {
  assert.equal(LAPTOP_FOLD, LAPTOP.chrome.height, 'the fold must be the height a real window leaves');
  assert.ok(LAPTOP.chrome.height < LAPTOP.css.height, 'a browser window is shorter than the display');
  assert.ok(LAPTOP.chrome.width >= PHONE.chrome.width * 3, 'the laptop is the wide frame');
  // The scarce axis flips with the frame: the laptop is WIDER than tall in usable terms, the phone
  // is the opposite. That inversion is the whole reason this file exists.
  assert.ok(LAPTOP.chrome.width > LAPTOP.chrome.height, 'laptop: width is the plentiful axis');
  assert.ok(PHONE.chrome.width < PHONE.chrome.height, 'phone: height is the plentiful axis');
});

// ⚠️ RED WHEN: someone re-columns at a width where a 1.440 px laptop has nothing spare. After the
// 232 px sidebar and a 340 px rail, a second column only fits above ~1.280.
test('the two-column threshold leaves room for the sidebar and the rail', () => {
  assert.equal(TWO_COLUMN_MIN, 1280);
  const SIDEBAR = 232;
  const RAIL = 340;
  assert.ok(LAPTOP.chrome.width - SIDEBAR - RAIL >= 800,
    'the centre must still be wide enough to hold two columns on the reference frame');
  assert.ok(TWO_COLUMN_MIN < LAPTOP.chrome.width, 'the reference frame must actually reach the threshold');
});

// ⚠️ THE PHONE IS SECOND, NOT DROPPED — every laptop re-column this round made is gated on `xl`,
// so nothing below 1280 changed. RED WHEN: a laptop rule is written without that gate.
test('every laptop re-column is gated above the phone', () => {
  const engine = readFileSync(new URL('../components/PomodoroEngine.jsx', import.meta.url), 'utf8');
  // ⚠️ THE RULE IS "GATED ABOVE THE PHONE", NOT "GATED AT `xl`". A `md:` two-column layout that
  // predates this round is fine — it also never reaches 390 px. The first draft of this case
  // demanded `xl:` and went red on exactly such a line; a guard that fails correct code teaches
  // people to delete guards.
  const grids = [...engine.matchAll(/(\w+:)?grid-cols-\[minmax\([^\]]*\]/g)].map((m) => m[0]);
  assert.ok(grids.length >= 1, 'no multi-column layout left in the Focus screen — the measurement ran empty');
  for (const g of grids) {
    assert.match(g, /^(sm|md|lg|xl|2xl):/,
      `a two-column layout with no breakpoint prefix would reach the 390 px phone: ${g}`);
  }
  // ⚠️ ROUND 64 (ADR-100) — THIS CASE USED TO DEMAND ROUND 63's TWO `xl:` GRIDS EXIST, AND THAT WAS
  // A TEST PINNING AN IMPLEMENTATION INSTEAD OF A RULE. Round 64 removed both with evidence: the
  // centre column is 868 px on the reference frame, so a `640 | rest` split leaves 196 px and the
  // session-goal card became one word wide. When the right answer turned out to be "no split", a
  // guard written around the split went red for doing the right thing. The rule this file actually
  // owns is the one above — a re-column must never reach the phone — so that is all it asserts now.
  assert.ok(true);
});
