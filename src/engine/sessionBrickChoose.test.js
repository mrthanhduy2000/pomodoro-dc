/**
 * sessionBrickChoose.test.js — the in-place project switch (ADR-078, Việc 2), pure.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseSessionProject, listSessionProjectChoices, pickSessionProject } from './sessionBrick.js';
import { listNextProjects, describeProject } from './buildChoices.js';
import { CRAFT_QUEUE_SLOTS } from './constants.js';

const era1 = listNextProjects({ activeBook: 1, buildings: [], craftingQueue: [] });
const [A, B, C] = era1;
assert.ok(A && B && C, 'era 1 must offer at least three blueprints for these tests');
const item = (p, laid = 0, startedAt = 1) => ({ bpId: p.bpId, sessionsRemaining: p.sessions - laid, startedAt });

test('empty queue: the chosen project becomes the head with a fresh scaffold', () => {
  const r = chooseSessionProject({ craftingQueue: [], activeBook: 1, buildings: [], bpId: B.bpId, now: 42 });
  assert.equal(r.ok, true);
  assert.equal(r.changed, true);
  assert.deepEqual(r.craftingQueue, [{ bpId: B.bpId, sessionsRemaining: B.sessions, startedAt: 42 }]);
  assert.equal(pickSessionProject({ craftingQueue: r.craftingQueue, activeBook: 1, buildings: [] }).project.bpId, B.bpId,
    'the strip must now name the chosen project');
});

test('already queued: moved to the head, bricks kept, nothing dropped', () => {
  const queue = [item(A, 1), item(B, 2)];
  const r = chooseSessionProject({ craftingQueue: queue, activeBook: 1, buildings: [], bpId: B.bpId });
  assert.equal(r.ok, true);
  assert.deepEqual(r.craftingQueue.map((q) => q.bpId), [B.bpId, A.bpId]);
  assert.equal(r.craftingQueue[0].sessionsRemaining, B.sessions - 2, 'the two bricks already laid on B survive');
  assert.equal(r.dropped, null);

  const same = chooseSessionProject({ craftingQueue: queue, activeBook: 1, buildings: [], bpId: A.bpId });
  assert.equal(same.changed, false, 'choosing the head is a no-op');
  assert.equal(same.craftingQueue, queue, 'and returns the same array');
});

test('full queue: the LAST untouched item makes room; all touched ⇒ refused, never a brick thrown away', () => {
  assert.ok(CRAFT_QUEUE_SLOTS >= 2);
  const full = Array.from({ length: CRAFT_QUEUE_SLOTS }, (_, i) => item(era1[i], i === 0 ? 1 : 0));
  const r = chooseSessionProject({ craftingQueue: full, activeBook: 1, buildings: [], bpId: era1[CRAFT_QUEUE_SLOTS].bpId, now: 7 });
  assert.equal(r.ok, true);
  assert.equal(r.dropped, era1[CRAFT_QUEUE_SLOTS - 1].bpId, 'the untouched tail item is the one that leaves');
  assert.equal(r.craftingQueue.length, CRAFT_QUEUE_SLOTS);
  assert.equal(r.craftingQueue[0].bpId, era1[CRAFT_QUEUE_SLOTS].bpId);
  assert.ok(r.craftingQueue.some((q) => q.bpId === era1[0].bpId), 'the item with a brick laid stays');

  const allTouched = Array.from({ length: CRAFT_QUEUE_SLOTS }, (_, i) => item(era1[i], 1));
  const refused = chooseSessionProject({ craftingQueue: allTouched, activeBook: 1, buildings: [], bpId: era1[CRAFT_QUEUE_SLOTS].bpId });
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, 'full');
  assert.equal(refused.craftingQueue, allTouched, 'a refusal leaves the queue untouched');
});

test('refusals: unknown id · already built · blueprint of another era', () => {
  assert.equal(chooseSessionProject({ craftingQueue: [], activeBook: 1, buildings: [], bpId: 'nope' }).reason, 'unknown');
  assert.equal(chooseSessionProject({ craftingQueue: [], activeBook: 1, buildings: [A.bpId], bpId: A.bpId }).reason, 'built');
  const era2 = listNextProjects({ activeBook: 2, buildings: [], craftingQueue: [] })[0];
  assert.ok(era2 && describeProject(era2.bpId).era === 2);
  assert.equal(chooseSessionProject({ craftingQueue: [], activeBook: 1, buildings: [], bpId: era2.bpId }).reason, 'era');
});

test('choices: queued (bricks kept) first, then fresh blueprints cheapest first, never the head, capped', () => {
  const queue = [item(A, 1), item(C, 0)];
  const choices = listSessionProjectChoices({ craftingQueue: queue, activeBook: 1, buildings: [], limit: 4 });
  assert.ok(choices.length <= 4);
  assert.equal(choices[0].bpId, C.bpId, 'the queued non-head project comes first');
  assert.equal(choices[0].queued, true);
  assert.ok(!choices.some((c) => c.bpId === A.bpId), 'the head is not offered to itself');
  const fresh = choices.filter((c) => !c.queued);
  assert.ok(fresh.length >= 1 && fresh.every((c) => c.done === 0 && c.total === c.sessions));
  assert.deepEqual(listSessionProjectChoices({ craftingQueue: [], activeBook: 1, buildings: [], limit: 0 }), []);
});
