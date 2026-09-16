/**
 * finite.test.js — round 60, Việc 0(b). THE REGRESSION TEST FOR THE INVERTED CLOSE-UP GATE.
 *
 * ⚠️ WHAT MAKES THIS FILE WORTH ITS LINES IS THE FIRST TEST, AND IT IS NOT A TEST OF `finite.js`.
 * It feeds the planner the EXACT EXPRESSION that shipped in round 57 —
 * `boxDistance(stand, nearestBlocker(stand, blockers))` — and demands it THROW. Before round 60
 * that expression was a quiet NaN; the gate it fed accepted a camera position only when the camera
 * stood inside a building, and three rounds of photographs were taken through it without one test
 * going red. A guard that only tests its own helpers would not have caught it — the helpers were
 * all individually correct. The bug lived in the JOIN between two of them.
 *
 * ⚠️ Each test below is written so that it goes red when the guard is REMOVED, not merely when the
 * code changes. Ask of every one: red when you take WHAT out? — answered in the test's own name.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  demandBoolean, demandBox, demandCoord, demandDistance, demandNumber, demandPoint,
} from './finite.js';
import {
  boxDistance, lineOfSight, nearestBlocker, segmentHitsBox,
} from './cityFocus.js';
import { planResidentFocus, residentBox } from './residentFocus.js';
import { rayBoxDistance } from './pick.js';

const BOX = { minX: -1, maxX: 1, minY: 0, maxY: 2, minZ: -1, maxZ: 1 };
const P = (x, y, z) => ({ x, y, z });

test('the round-57 typo throws instead of returning a silent NaN or Infinity', () => {
  // Both branches of the shipped bug, verbatim. `stand` outside the box ⇒ nearestBlocker is a
  // positive number; `stand` inside it ⇒ nearestBlocker is 0, and `!0` used to answer Infinity.
  for (const stand of [P(5, 1, 0), P(0, 1, 0)]) {
    const wrong = nearestBlocker(stand, [BOX]);   // a NUMBER, handed to the box parameter below
    assert.throws(
      () => boxDistance(stand, wrong),
      /expected a box/,
      `boxDistance(point, ${wrong}) must throw, not answer NaN or Infinity`,
    );
  }
  // …while the CORRECT call still answers plain numbers, so the guard has not simply broken it.
  assert.equal(nearestBlocker(P(5, 1, 0), [BOX]), 4);
  assert.equal(nearestBlocker(P(0, 1, 0), [BOX]), 0, 'inside a building ⇒ 0, never Infinity');
  assert.equal(nearestBlocker(P(0, 1, 0), []), Infinity, 'an empty city IS infinitely clear');
});

test('a gate fed NaN would have accepted the inside-a-wall position — so NaN must never reach it', () => {
  // This is the SHAPE of the round-57 gate, kept here as the reason the guard exists. Both
  // comparisons are false for NaN, so whichever way the gate is written it silently picks a side.
  const nan = Number('không phải số');
  assert.ok(Number.isNaN(nan));
  assert.equal(nan >= 0.35, false, 'NaN loses `>=` …');
  assert.equal(nan < 0.35, false, '… and NaN loses `<` too — there is no safe way to write it');
});

test('demandNumber / demandDistance / demandCoord separate the three different "a number" rules', () => {
  assert.equal(demandNumber(0, 'n'), 0);
  assert.equal(demandNumber(Infinity, 'n'), Infinity, 'Infinity is a number');
  assert.throws(() => demandNumber(NaN, 'n'), /got NaN/);
  assert.throws(() => demandNumber('3', 'n'), /got string 3/);
  assert.throws(() => demandNumber(undefined, 'n'), /got undefined/);

  assert.equal(demandDistance(Infinity, 'd'), Infinity, 'an empty city is infinitely clear');
  assert.equal(demandDistance(0, 'd'), 0, 'zero clearance is a real answer, not an error');
  assert.throws(() => demandDistance(NaN, 'd'), /got NaN/);
  assert.throws(() => demandDistance(-0.5, 'd'), /cannot be negative/);

  assert.throws(() => demandCoord(Infinity, 'c'), /finite coordinate/,
    'a point at infinity is not a place a camera can stand');
  assert.equal(demandCoord(-3.5, 'c'), -3.5);
});

test('demandPoint and demandBox reject the wrong TYPE, not just the wrong number', () => {
  assert.throws(() => demandPoint(1, 'p'), /expected a point/);
  assert.throws(() => demandPoint(null, 'p'), /got null/);
  assert.throws(() => demandPoint(P(1, NaN, 0), 'p'), /p\.y/, 'the message must name the axis');

  assert.throws(() => demandBox(0, 'b'), /expected a box/, '0 is the argument that broke round 57');
  assert.throws(() => demandBox(4.2, 'b'), /number 4\.2/);
  assert.throws(() => demandBox({ min: { x: 0 } }, 'b'), /b\.minX/, 'the NESTED box shape');
  assert.throws(() => demandBox({ ...BOX, minY: 9 }, 'b'), /inverted box/);
  assert.equal(demandBox(BOX, 'b'), BOX);

  assert.equal(demandBoolean(false, 'q'), false);
  assert.throws(() => demandBoolean(undefined, 'q'), /expected true or false/,
    'a predicate that answers undefined must not be read as "no"');
});

test('segmentHitsBox and lineOfSight throw on NaN instead of answering "blocked"', () => {
  // ⚠️ THE DANGEROUS DIRECTION IS DIFFERENT HERE. A NaN inside the slab test used to leave
  // `t0`/`t1` NaN, `t0 > t1` false on every axis, and the function returned TRUE — "hit". So a
  // broken input read as "every direction is blocked", and `planResidentFocus` would have walked
  // its whole search and reported `blocked: true` for a resident standing in an empty field.
  assert.throws(() => segmentHitsBox(P(0, 1, -5), P(NaN, 1, 5), BOX), /expected a finite coordinate/);
  assert.throws(() => segmentHitsBox(P(0, 1, -5), P(0, 1, 5), 3), /expected a box/);
  assert.throws(() => lineOfSight(null, P(0, 1, 0), [BOX]), /expected a point/);
  // ⚠️ HỘP HỎNG PHẢI ĐỨNG TRƯỚC HỘP CHẮN. `lineOfSight` thoát ngay ở hộp ĐẦU TIÊN đâm trúng, nên
  // một phần tử hỏng nằm sau nó thì không bao giờ được nhìn tới — bản đầu của bài test này viết
  // `[BOX, 7]` và xanh vì lý do sai. Đây là đúng cái bẫy "phép đo nhắm nhầm chỗ" của dự án.
  const XA = { minX: 20, maxX: 21, minY: 0, maxY: 1, minZ: 20, maxZ: 21 };
  assert.throws(() => lineOfSight(P(0, 1, -5), P(0, 1, 5), [XA, 7]), /expected a box/);

  // The honest answers are untouched.
  assert.equal(segmentHitsBox(P(0, 1, -5), P(0, 1, 5), BOX), true);
  assert.equal(lineOfSight(P(0, 1, -5), P(0, 1, -4), [BOX]), true, 'the box is past the far end');
});

test('planResidentFocus throws when its own measuring functions answer NaN', () => {
  const resident = { eye: P(0, 1, 0), height: 0.9, angle: 0 };
  assert.throws(
    () => planResidentFocus({ resident, clearanceOf: () => NaN }),
    /clearanceOf/,
    'NaN clearance must kill the plan, not lose `gap < minClearance` and be accepted',
  );
  assert.throws(
    () => planResidentFocus({ resident, clearanceOf: () => 9, seesOf: () => undefined }),
    /seesOf/,
    'a sight test that answers undefined must not be read as "cannot see"',
  );
  // A working pair still plans.
  const plan = planResidentFocus({ resident, clearanceOf: () => 9, seesOf: () => true });
  assert.equal(plan.blocked, undefined);
  assert.equal(plan.sees, true);
});

test('residentBox and rayBoxDistance die on a broken resident instead of vanishing', () => {
  assert.throws(() => residentBox(P(NaN, 0, 0), 1), /expected a finite coordinate/,
    'a resident at NaN used to answer null — the tap then did nothing, silently');
  assert.throws(() => residentBox(P(0, 0, 0), NaN), /height/);
  assert.equal(residentBox(P(0, 0, 0), 0), null, 'height 0 is a real answer: nothing to touch');

  assert.throws(() => rayBoxDistance(P(0, 0.5, 5), P(0, 0, -1), 2), /expected a box/);
  assert.throws(() => rayBoxDistance(P(NaN, 0.5, 5), P(0, 0, -1), BOX), /finite coordinate/);
  // ⚠️ VẮNG MẶT ≠ HỎNG. No box, no ray ⇒ "nothing was hit", which is a real answer a tap on empty
  // sky deserves. A present-but-malformed argument is a programming error and throws (above).
  assert.equal(rayBoxDistance(P(0, 1, 5), P(0, 0, -1), null), null, 'no box ⇒ no hit, no error');
  assert.equal(rayBoxDistance(null, null, BOX), null, 'no ray ⇒ no hit, no error');
});
