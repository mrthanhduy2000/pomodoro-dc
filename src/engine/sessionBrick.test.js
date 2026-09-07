import test from 'node:test';
import assert from 'node:assert/strict';
import { autoQueueSessionProject, describeSessionBrick, pickSessionProject } from './sessionBrick.js';
import { eraBlueprints, listNextProjects } from './buildChoices.js';
import { BUILDING_EFFECTS } from './constants.js';

const ERA1 = eraBlueprints(1);
const first = () => listNextProjects({ activeBook: 1, buildings: [], craftingQueue: [] })[0];

test('pickSessionProject: queue head first; empty queue ⇒ the auto-pick is the FIRST choice of listNextProjects', () => {
  const head = { bpId: ERA1[1].id, sessionsRemaining: 2, startedAt: 1 };
  const picked = pickSessionProject({ craftingQueue: [head], activeBook: 1, buildings: [] });
  assert.equal(picked.source, 'queue');
  assert.equal(picked.project.bpId, ERA1[1].id);
  const auto = pickSessionProject({ craftingQueue: [], activeBook: 1, buildings: [] });
  assert.equal(auto.source, 'auto');
  assert.equal(auto.project.bpId, first().bpId);
  assert.equal(auto.project.done, 0);
  const none = pickSessionProject({ craftingQueue: [], activeBook: 1, buildings: ERA1.map((b) => b.id) });
  assert.equal(none.source, 'none');
  assert.equal(none.eraComplete, true);
});

test('autoQueueSessionProject: queues the same pick the strip showed, keeps the array reference otherwise', () => {
  const queued = autoQueueSessionProject({ craftingQueue: [], activeBook: 1, buildings: [], now: 123 });
  assert.equal(queued.autoQueuedId, first().bpId);
  assert.deepEqual(queued.craftingQueue, [{ bpId: first().bpId, sessionsRemaining: first().sessions, startedAt: 123 }]);
  const already = [{ bpId: ERA1[0].id, sessionsRemaining: 1, startedAt: 1 }];
  const untouched = autoQueueSessionProject({ craftingQueue: already, activeBook: 1, buildings: [] });
  assert.equal(untouched.craftingQueue, already, 'same reference when a current-era project is queued');
  assert.equal(untouched.autoQueuedId, null);
  const eraDone = autoQueueSessionProject({ craftingQueue: [], activeBook: 1, buildings: ERA1.map((b) => b.id) });
  assert.equal(eraDone.autoQueuedId, null);
});

test('idle / running: brick states and copy follow the queue — laid · laying · empty', () => {
  const bp = ERA1.find((b) => BUILDING_EFFECTS[b.id].sessionsToComplete >= 3).id;
  const total = BUILDING_EFFECTS[bp].sessionsToComplete;
  const queue = [{ bpId: bp, sessionsRemaining: total - 1, startedAt: 1 }];
  const idle = describeSessionBrick({ craftingQueue: queue, activeBook: 1, buildings: [], phase: 'idle' });
  assert.equal(idle.status, 'building');
  assert.equal(idle.done, 1);
  assert.deepEqual(idle.bricks.slice(0, 2), ['laid', 'laying']);
  assert.equal(idle.bricks.length, total);
  assert.match(idle.headline, new RegExp(`viên gạch 2/${total}`));
  const running = describeSessionBrick({ craftingQueue: queue, activeBook: 1, buildings: [], phase: 'running', progressRatio: 0.5 });
  assert.match(running.headline, /^Đang xây /); // ADR-079: no number in the running headline
  assert.doesNotMatch(running.headline, /\d/, 'the running headline must carry no number — the ring is the only progress');
  assert.match(running.sub, /Viên gạch 2\//);
  assert.equal(running.progressRatio, 0.5);
  const last = describeSessionBrick({ craftingQueue: [{ bpId: bp, sessionsRemaining: 1, startedAt: 1 }], activeBook: 1, buildings: [], phase: 'idle' });
  assert.equal(last.isFinal, true);
  assert.match(last.headline, /viên gạch cuối/);
});

test('idle with an empty queue still answers (auto pick) and says so; a finished era says so too', () => {
  const auto = describeSessionBrick({ craftingQueue: [], activeBook: 1, buildings: [], phase: 'idle' });
  assert.equal(auto.status, 'building');
  assert.equal(auto.auto, true);
  assert.match(auto.headline, /viên gạch đầu/);
  assert.match(auto.sub, /Tự chọn/);
  const done = describeSessionBrick({ craftingQueue: [], activeBook: 1, buildings: ERA1.map((b) => b.id), phase: 'idle' });
  assert.equal(done.status, 'era-complete');
  assert.ok(done.headline.length > 0);
});

test('landed: the brick just laid is "new"; a haste perk marks two; a finished building wins the card', () => {
  const bp = ERA1.find((b) => BUILDING_EFFECTS[b.id].sessionsToComplete >= 3).id;
  const total = BUILDING_EFFECTS[bp].sessionsToComplete;
  const after = [{ bpId: bp, sessionsRemaining: total - 1, startedAt: 1 }];
  const landed = describeSessionBrick({ craftingQueue: after, activeBook: 1, buildings: [], phase: 'landed' });
  assert.equal(landed.done, 1);
  assert.equal(landed.bricks[0], 'new');
  assert.equal(landed.remaining, total - 1);
  assert.match(landed.headline, new RegExp(`Viên gạch 1/${total} đã đặt`));
  const hasted = describeSessionBrick({ craftingQueue: [{ bpId: bp, sessionsRemaining: total - 2, startedAt: 1 }], activeBook: 1, buildings: [], phase: 'landed', acceleratedIds: [bp] });
  assert.deepEqual(hasted.bricks.slice(0, 2), ['new', 'new']);
  assert.match(hasted.headline, /Hai viên/);
  const built = describeSessionBrick({ craftingQueue: [], activeBook: 1, buildings: [bp], phase: 'landed', newlyBuiltIds: [bp] });
  assert.equal(built.status, 'built');
  assert.equal(built.done, built.total);
  assert.equal(built.bricks.at(-1), 'new');
  assert.match(built.headline, /hoàn thành/);
  const autoLanded = describeSessionBrick({ craftingQueue: after, activeBook: 1, buildings: [], phase: 'landed', autoQueuedId: bp });
  assert.equal(autoLanded.auto, true);
  assert.match(autoLanded.sub, /Tự chọn/);
});
