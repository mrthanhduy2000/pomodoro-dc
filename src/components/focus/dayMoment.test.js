/**
 * dayMoment.test.js — the long-rhythm banner keeps the two promises it makes (ADR-081):
 * it never shows while a timer runs, and it always removes itself.
 * Plus the night crew: a gift that can never finish a building and can never take anything away.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./DayMoment.jsx', import.meta.url), 'utf8');
const APP = readFileSync(new URL('../../App.jsx', import.meta.url), 'utf8');

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, String(v)),
    removeItem: (k) => values.delete(k),
    clear: () => values.clear(),
  };
}
globalThis.window = { localStorage: createMemoryStorage(), sessionStorage: createMemoryStorage() };
const { default: useGameStore } = await import('../../store/gameStore.js');
const { listNextProjects } = await import('../../engine/buildChoices.js');

test('it happens and it is gone: a visible window, a dismiss timer, and no state left behind', () => {
  assert.match(SRC, /const VISIBLE_MS = (\d+);/);
  const ms = Number(/const VISIBLE_MS = (\d+);/.exec(SRC)[1]);
  assert.ok(ms >= 4000 && ms <= 12000, `${ms} ms on screen — long enough to read, short enough to be a moment`);
  assert.match(SRC, /setTimeout\(\(\) => setMoment\(null\), VISIBLE_MS\)/, 'the banner must remove ITSELF');
  assert.match(SRC, /onClick=\{dismiss\}/, 'and a tap must remove it sooner');
  assert.match(SRC, /clearTimeout\(dismissRef\.current\)/, 'the timer is cleared on unmount — no setState after teardown');
});

test('silent while any timer runs — the round-39 screen outranks every long rhythm', () => {
  assert.match(SRC, /if \(quiet \|\| moment\) return undefined;/, 'a running timer must stop it before it decides anything');
  assert.match(SRC, /\{moment && !quiet &&/, 'and stop it rendering even if the state survived a transition');
  assert.match(APP, /<DayMoment quiet=\{timerSessionRunning \|\| isOnBreak \|\| lootModalOpen\} \/>/,
    'App must pass a focus session, a break AND the reward chain as quiet');
  // ⚠️ And it must NOT live inside `GlobalOverlays`: that component early-returns null whenever
  // nothing is blocking and no toast is queued — i.e. on exactly the quiet morning this banner is for.
  const mount = APP.indexOf('<DayMoment');
  assert.ok(mount > 0 && mount < APP.indexOf('<GlobalOverlays'), 'the banner must be mounted outside the overlay stack');
});

test('the stamps live in localStorage, never in the synced save — a greeting must not fight a session for the write', () => {
  assert.match(SRC, /const STAMP_KEY = 'dc-day-arc-v1'/);
  assert.match(SRC, /try \{[\s\S]{0,200}localStorage\.setItem/, 'private mode must not crash the app');
  assert.doesNotMatch(SRC, /setState\(\{ *dayArc/, 'the stamp is not game state');
});

test('the night crew gives one brick, never the last one, and never takes anything', () => {
  const era1 = listNextProjects({ activeBook: 1, buildings: [], craftingQueue: [] });
  const project = era1.find((p) => p.sessions >= 3);
  const realRandom = Math.random;

  // A head with room ⇒ exactly one brick, the queue's shape untouched.
  useGameStore.setState({ craftingQueue: [{ bpId: project.bpId, sessionsRemaining: 3, startedAt: 1 }] });
  Math.random = () => 0;
  try {
    const gift = useGameStore.getState().rollNightBuilder();
    assert.equal(gift, project.bpId);
    assert.deepEqual(useGameStore.getState().craftingQueue, [{ bpId: project.bpId, sessionsRemaining: 2, startedAt: 1 }]);
  } finally { Math.random = realRandom; }

  // One session left ⇒ NEVER: finishing a building is a session's reward, not a gift at breakfast.
  useGameStore.setState({ craftingQueue: [{ bpId: project.bpId, sessionsRemaining: 1, startedAt: 1 }] });
  Math.random = () => 0;
  try {
    assert.equal(useGameStore.getState().rollNightBuilder(), null);
    assert.equal(useGameStore.getState().craftingQueue[0].sessionsRemaining, 1, 'and nothing moved');
  } finally { Math.random = realRandom; }

  // A miss is an ordinary morning — never a loss.
  useGameStore.setState({ craftingQueue: [{ bpId: project.bpId, sessionsRemaining: 3, startedAt: 1 }] });
  Math.random = () => 0.999;
  try {
    assert.equal(useGameStore.getState().rollNightBuilder(), null);
    assert.equal(useGameStore.getState().craftingQueue[0].sessionsRemaining, 3);
  } finally { Math.random = realRandom; }

  // An empty queue is not an error.
  useGameStore.setState({ craftingQueue: [] });
  Math.random = () => 0;
  try { assert.equal(useGameStore.getState().rollNightBuilder(), null); } finally { Math.random = realRandom; }
});
