/**
 * gameStore.sessionBrick.test.js — REAL store → brick engine, end to end (ADR-076).
 *
 * `engine/sessionBrick.test.js` proves the engine reads a hand-built queue correctly; this file proves
 * `completeFocusSession` actually produces what the engine needs (`newlyBuiltIds`, `autoQueuedId`,
 * an advanced queue) and that the strip BEFORE a session and the card AFTER it talk about the same
 * building. Store harness borrowed from `gameStore.completeFocusSession.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

globalThis.window = {
  localStorage: createMemoryStorage(),
  sessionStorage: createMemoryStorage(),
};

const [
  { default: useGameStore },
  { describeSessionBrick, pickSessionProject },
  { listNextProjects },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/sessionBrick.js'),
  import('../engine/buildChoices.js'),
]);

const initialState = useGameStore.getInitialState();
const realRandom = Math.random;
const NO_EVENT = 0.999999;

function resetWithQueue(queue = []) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(initialState, true);
  useGameStore.setState({ craftingQueue: queue });
}

function runSession(minutes = 25) {
  Math.random = () => NO_EVENT;
  try {
    useGameStore.getState().completeFocusSession(minutes);
  } finally {
    Math.random = realRandom;
  }
  return useGameStore.getState();
}

function landedFrom(state) {
  const reward = state.ui.pendingReward ?? {};
  return describeSessionBrick({
    craftingQueue: state.craftingQueue, buildings: state.buildings, activeBook: state.progress.activeBook,
    phase: 'landed', newlyBuiltIds: reward.newlyBuiltIds ?? [], acceleratedIds: reward.acceleratedCraftingIds ?? [],
    autoQueuedId: reward.autoQueuedId ?? null,
  });
}

test('a REAL session that finishes a building ⇒ store writes newlyBuiltIds, and the ending card says "hoàn thành"', () => {
  resetWithQueue([{ bpId: 'bp_hang_dong', sessionsRemaining: 1, startedAt: '2026-08-11T02:00:00.000Z' }]);
  const s = runSession(25);
  assert.ok(s.buildings.includes('bp_hang_dong'));
  assert.deepEqual(s.ui.pendingReward.newlyBuiltIds, ['bp_hang_dong']);
  const card = landedFrom(s);
  assert.equal(card.status, 'built');
  assert.equal(card.bpId, 'bp_hang_dong');
  assert.equal(card.done, card.total);
  assert.equal(card.bricks.at(-1), 'new');
});

test('a REAL session that does not finish ⇒ the card counts the queue\'s own remaining number, one brick "new"', () => {
  resetWithQueue([{ bpId: 'bp_cong_cu_da', sessionsRemaining: 3, startedAt: '2026-08-11T02:00:00.000Z' }]);
  const s = runSession(25);
  assert.equal(s.craftingQueue[0].sessionsRemaining, 2);
  const card = landedFrom(s);
  assert.equal(card.status, 'building');
  assert.equal(card.remaining, 2);
  assert.equal(card.bricks.filter((b) => b === 'new').length, 1);
  assert.match(card.sub, /Còn 2 phiên/);
});

test('EMPTY queue ⇒ the store queues the next project itself before advancing, and tells the card (ADR-076)', () => {
  resetWithQueue([]);
  const expected = listNextProjects({ activeBook: 1, buildings: [], craftingQueue: [] })[0];
  const before = pickSessionProject({ craftingQueue: [], activeBook: 1, buildings: [] });
  assert.equal(before.source, 'auto');
  const s = runSession(25);
  assert.equal(s.craftingQueue.length, 1, 'the session must have landed somewhere');
  assert.equal(s.craftingQueue[0].bpId, expected.bpId);
  assert.equal(s.craftingQueue[0].sessionsRemaining, expected.sessions - 1);
  assert.equal(s.ui.pendingReward.autoQueuedId, expected.bpId);
  const card = landedFrom(s);
  assert.equal(card.bpId, before.project.bpId, 'strip before and card after must name the same building');
  assert.equal(card.auto, true);
  assert.match(card.sub, /Tự chọn/);
});

test('the idle strip before a session and the landed card after it describe the same building and count', () => {
  const queue = [{ bpId: 'bp_cong_cu_da', sessionsRemaining: 3, startedAt: '2026-08-11T02:00:00.000Z' }];
  resetWithQueue(queue);
  const idle = describeSessionBrick({ craftingQueue: queue, buildings: [], activeBook: 1, phase: 'idle' });
  const s = runSession(25);
  const card = landedFrom(s);
  assert.equal(idle.bpId, card.bpId);
  assert.equal(idle.done + 1, card.done, 'exactly one brick was laid');
  assert.equal(idle.remaining, card.remaining);
});

test('`newlyBuiltIds` / `autoQueuedId` never reach Supabase — `ui` is not persisted', () => {
  resetWithQueue([]);
  runSession(25);
  const persisted = useGameStore.persist.getOptions().partialize(useGameStore.getState());
  assert.equal('ui' in persisted, false);
});
