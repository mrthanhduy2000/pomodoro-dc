/**
 * sessionRewards.test.js — behaviour of `assembleSessionReward` (ADR-078), the pure form of what
 * used to be the ~710-line body of `completeFocusSession`.
 *
 * The state comes from the real store's initial state (so the shape is never invented here), the
 * clocks and the dice are parameters, and the assertions are about BEHAVIOUR: what one session
 * changes, that it is deterministic, and that the store wrapper applies exactly this patch.
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
globalThis.window = { localStorage: createMemoryStorage(), sessionStorage: createMemoryStorage() };

const { default: useGameStore } = await import('../store/gameStore.js');
const { assembleSessionReward } = await import('./sessionRewards.js');
const { listNextProjects } = await import('./buildChoices.js');
const { localDateStr, localWeekMondayStr } = await import('./time.js');

const NOW = Date.UTC(2026, 8, 7, 3, 30); // 2026-09-07 10:30 Vietnam time, a Monday
const CLOCK = { now: NOW, today: localDateStr(NOW), weekKey: localWeekMondayStr(NOW) };
const GOAL = { type: 'sessions', sessions: 5, minutes: 120 };
const NO_EVENT = () => 0.999; // every positive event has chance < 0.999 ⇒ none fires

function freshState() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(useGameStore.getInitialState(), true);
  return useGameStore.getState();
}

test('one 25-minute session: history entry, progress, auto-queued first project, brick fields, no built building', () => {
  const state = freshState();
  const { patch, sessionResult } = assembleSessionReward({ state, minutesFocused: 25, ...CLOCK, dailyGoal: GOAL, random: NO_EVENT });
  const first = listNextProjects({ activeBook: 1, buildings: [], craftingQueue: [] })[0];

  assert.ok(sessionResult.xpEarned > 0 && sessionResult.epEarned > 0, 'a session earns XP and EP');
  assert.equal(sessionResult.celebrates, false, 'nothing was built and no era changed');
  assert.equal(patch.history.length, 1);
  assert.equal(patch.history[0].minutes, 25);
  assert.equal(patch.history[0].completed, true);
  assert.equal(patch.history[0].timestamp, new Date(NOW).toISOString(), 'finishedAt is the injected clock, not Date.now()');
  assert.equal(patch.progress.sessionsCompleted, 1);
  assert.equal(patch.progress.totalFocusMinutes, 25);
  assert.equal(patch.dailyTracking.date, CLOCK.today, 'the day comes from the injected calendar');
  assert.equal(patch.dailyTracking.sessionsCompleted, 1);
  assert.equal(patch.combo.lastSessionTs, NOW);

  // ADR-077 brick: the empty queue was auto-filled with the first project, then advanced by one.
  assert.equal(patch.ui.pendingReward.autoQueuedId, first.bpId);
  assert.equal(patch.craftingQueue[0]?.bpId, first.bpId);
  assert.equal(patch.craftingQueue[0]?.sessionsRemaining, first.sessions - 1, 'one brick laid');
  assert.deepEqual(patch.ui.pendingReward.newlyBuiltIds, []);
  assert.equal(patch.ui.postcardFocusBpId, null, 'nothing finished ⇒ the postcard keeps looking at the brick');
  assert.equal(patch.ui.lootModalOpen, true, 'the ending opens');
  assert.equal(patch.ui.pendingReward.positiveEvent, null, 'the dice said no');
});

test('deterministic: same state, same clock, same dice ⇒ identical patch', () => {
  const state = freshState();
  const a = assembleSessionReward({ state, minutesFocused: 40, categoryId: null, ...CLOCK, dailyGoal: GOAL, random: NO_EVENT });
  const b = assembleSessionReward({ state, minutesFocused: 40, categoryId: null, ...CLOCK, dailyGoal: GOAL, random: NO_EVENT });
  assert.deepEqual(a.patch, b.patch);
  assert.deepEqual(a.sessionResult, b.sessionResult);
});

test('the dice are a parameter: random → 0 fires a positive event and adds XP', () => {
  const state = freshState();
  const quiet = assembleSessionReward({ state, minutesFocused: 25, ...CLOCK, dailyGoal: GOAL, random: NO_EVENT });
  const lucky = assembleSessionReward({ state, minutesFocused: 25, ...CLOCK, dailyGoal: GOAL, random: () => 0 });
  assert.equal(quiet.patch.ui.pendingReward.positiveEvent, null);
  assert.ok(lucky.patch.ui.pendingReward.positiveEvent, 'a 0 roll must fire the first eligible event');
  assert.ok(lucky.sessionResult.xpEarned > quiet.sessionResult.xpEarned, 'the event pays XP');
});

test('finishing a building: it joins `buildings`, the postcard focus and the ending name it', () => {
  freshState();
  const first = listNextProjects({ activeBook: 1, buildings: [], craftingQueue: [] })[0];
  useGameStore.setState({ craftingQueue: [{ bpId: first.bpId, sessionsRemaining: 1, startedAt: NOW - 1000 }] });
  const { patch, sessionResult } = assembleSessionReward({ state: useGameStore.getState(), minutesFocused: 25, ...CLOCK, dailyGoal: GOAL, random: NO_EVENT });
  assert.ok(patch.buildings.includes(first.bpId), 'the last brick finishes the building');
  assert.deepEqual(patch.ui.pendingReward.newlyBuiltIds, [first.bpId]);
  assert.equal(patch.ui.postcardFocusBpId, first.bpId, 'ADR-078: the postcard keeps its camera on what was just built');
  assert.equal(sessionResult.celebrates, true);
  assert.ok(!patch.craftingQueue.some((q) => q.bpId === first.bpId), 'a finished building leaves the queue');
});

test('the store wrapper applies exactly the engine patch and returns its result', () => {
  freshState();
  const before = useGameStore.getState();
  const expected = assembleSessionReward({ state: before, minutesFocused: 25, ...CLOCK, dailyGoal: GOAL, random: NO_EVENT });
  const realNow = Date.now; const realRandom = Math.random;
  Date.now = () => NOW; Math.random = NO_EVENT;
  let result;
  try { result = useGameStore.getState().completeFocusSession(25); } finally { Date.now = realNow; Math.random = realRandom; }
  const after = useGameStore.getState();
  assert.deepEqual(result, expected.sessionResult);
  assert.deepEqual(after.history, expected.patch.history);
  assert.deepEqual(after.progress, expected.patch.progress);
  assert.deepEqual(after.craftingQueue, expected.patch.craftingQueue);
  assert.deepEqual(after.ui.pendingReward, expected.patch.ui.pendingReward);
  assert.equal(after.ui.postcardFocusBpId, expected.patch.ui.postcardFocusBpId);
});
