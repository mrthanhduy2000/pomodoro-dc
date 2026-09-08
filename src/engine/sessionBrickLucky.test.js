/**
 * sessionBrickLucky.test.js — the lucky brick (ADR-080): unpredictable, never negative, session-axis only.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { describeSessionBrick, rollLuckyBrick } from './sessionBrick.js';
import { listNextProjects } from './buildChoices.js';
import { LUCKY_BRICK_CHANCE, LUCKY_BRICK_MIN_MINUTES } from './constants.js';

const era1 = listNextProjects({ activeBook: 1, buildings: [], craftingQueue: [] });
// A needs at least four sessions so "one extra brick" and "finished" are two different cases.
const A = era1.find((p) => p.sessions >= 4);
const B = era1.find((p) => p !== A);
assert.ok(A && B, 'era 1 must offer a 4-session blueprint and another one');
const item = (p, laid = 0) => ({ bpId: p.bpId, sessionsRemaining: p.sessions - laid, startedAt: 1 });

test('a hit lays one extra brick on the queue head and names it; a miss changes nothing', () => {
  const queue = [item(A, 1), item(B)];
  const hit = rollLuckyBrick({ craftingQueue: queue, minutesFocused: 25, random: () => 0 });
  assert.equal(hit.luckyBrickId, A.bpId);
  assert.equal(hit.builtId, null);
  assert.equal(hit.craftingQueue[0].sessionsRemaining, A.sessions - 2, 'one more brick on the head');
  assert.deepEqual(hit.craftingQueue[1], queue[1], 'the rest of the queue is untouched');

  const miss = rollLuckyBrick({ craftingQueue: queue, minutesFocused: 25, random: () => 0.999 });
  assert.equal(miss.luckyBrickId, null);
  assert.equal(miss.craftingQueue, queue, 'a miss is "bình thường" — the same array, nothing lost');
});

test('never negative, never gambling: no roll on short sessions, on an empty queue, or on a head with nothing left', () => {
  const queue = [item(A)];
  assert.equal(rollLuckyBrick({ craftingQueue: queue, minutesFocused: LUCKY_BRICK_MIN_MINUTES - 1, random: () => 0 }).luckyBrickId, null);
  assert.equal(rollLuckyBrick({ craftingQueue: [], minutesFocused: 25, random: () => 0 }).luckyBrickId, null);
  assert.equal(rollLuckyBrick({ craftingQueue: [{ bpId: A.bpId, sessionsRemaining: 0 }], minutesFocused: 25, random: () => 0 }).luckyBrickId, null);
  assert.ok(LUCKY_BRICK_CHANCE > 0 && LUCKY_BRICK_CHANCE < 0.25, 'rare enough to be a surprise, common enough to happen in a week');
});

test('the lucky brick can finish a building: the head leaves the queue and is reported built', () => {
  const r = rollLuckyBrick({ craftingQueue: [{ bpId: A.bpId, sessionsRemaining: 1 }, item(B)], minutesFocused: 25, random: () => 0.01 });
  assert.equal(r.builtId, A.bpId);
  assert.equal(r.luckyBrickId, A.bpId);
  assert.deepEqual(r.craftingQueue.map((q) => q.bpId), [B.bpId]);
});

test('the ending card names the luck first and lands two bricks', () => {
  const queue = [{ bpId: A.bpId, sessionsRemaining: A.sessions - 2, startedAt: 1 }];
  const card = describeSessionBrick({ craftingQueue: queue, activeBook: 1, buildings: [], phase: 'landed', luckyBrickId: A.bpId });
  assert.equal(card.lucky, true);
  assert.match(card.headline, /^Gạch đôi — hôm nay may!/);
  assert.equal(card.bricks.filter((b) => b === 'new').length, 2, 'two fresh bricks on the row');
  const plain = describeSessionBrick({ craftingQueue: queue, activeBook: 1, buildings: [], phase: 'landed', luckyBrickId: null });
  assert.equal(plain.lucky, false);
  assert.equal(plain.bricks.filter((b) => b === 'new').length, 1);

  const finished = describeSessionBrick({ craftingQueue: [], activeBook: 1, buildings: [A.bpId], phase: 'landed', newlyBuiltIds: [A.bpId], luckyBrickId: A.bpId });
  assert.equal(finished.status, 'built');
  assert.equal(finished.lucky, true);
  assert.match(finished.sub, /Gạch đôi may mắn/);
});
