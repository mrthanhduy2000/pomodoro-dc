import test from 'node:test';
import assert from 'node:assert/strict';
import {
  autoClaimWeeklySteps, buildWeeklyProgressSnapshot, getHistoryWeekEntries, getWeekMonday, makeDefaultWeeklyChain,
  pickChainForWeek, rebuildWeeklyChainFromHistory, refreshWeeklyChain, weeklySnapshotWithSession,
} from './weeklyChain.js';
import { WEEKLY_CHAINS, WEEKLY_CHAIN_XP_SCALE } from './constants.js';

// Wednesday 2026-09-09 10:00 Vietnam time → the week key is Monday 2026-09-07.
const NOW = new Date('2026-09-09T10:00:00+07:00').getTime();
const WEEK = '2026-09-07';
const at = (iso, minutes, extra = {}) => ({ id: iso, timestamp: iso, minutes, completed: true, ...extra });

test('refreshWeeklyChain: same week returns the SAME object; a new week rolls a deterministic chain', () => {
  const fresh = refreshWeeklyChain(makeDefaultWeeklyChain(), { now: NOW });
  assert.equal(fresh.weekKey, WEEK);
  assert.equal(getWeekMonday(NOW), WEEK);
  assert.equal(refreshWeeklyChain(fresh, { now: NOW }), fresh, 'reference-stable inside the week');
  assert.equal(fresh.chainIndex, pickChainForWeek(WEEK, []));
  const nextWeek = refreshWeeklyChain(fresh, { now: NOW + 7 * 86_400_000 });
  assert.equal(nextWeek.weekKey, '2026-09-14');
  assert.equal(nextWeek.recentHistory[0].weekKey, WEEK);
  assert.notEqual(nextWeek.recentHistory[0].chainId, WEEKLY_CHAINS[nextWeek.chainIndex].id, 'last week\'s chain is not repeated');
});

test('week snapshot counts sessions, minutes, categories, days and deep sessions inside the week only', () => {
  const history = [
    at('2026-09-07T09:00:00+07:00', 50, { categoryId: 'a' }),
    at('2026-09-08T09:00:00+07:00', 20, { categoryId: 'b' }),
    at('2026-09-01T09:00:00+07:00', 90, { categoryId: 'c' }), // last week — excluded
    { ...at('2026-09-08T12:00:00+07:00', 30), cancelled: true }, // cancelled — excluded
  ];
  const snap = buildWeeklyProgressSnapshot(getHistoryWeekEntries(history, WEEK), WEEK);
  assert.deepEqual(
    { sessions: snap.sessions, focusMinutes: snap.focusMinutes, uniqueCategories: snap.uniqueCategories, daysActive: snap.daysActive, deepSessions: snap.deepSessions, maxSessionMinutes: snap.maxSessionMinutes },
    { sessions: 2, focusMinutes: 70, uniqueCategories: 2, daysActive: 2, deepSessions: 1, maxSessionMinutes: 50 },
  );
  const withSession = weeklySnapshotWithSession(history, WEEK, at('2026-09-09T10:00:00+07:00', 25, { categoryId: 'c' }));
  assert.equal(withSession.sessions, 3);
  assert.equal(withSession.uniqueCategories, 3);
});

test('autoClaimWeeklySteps closes every step the snapshot already satisfies, stops at the first open one', () => {
  const chain = { ...makeDefaultWeeklyChain(), weekKey: WEEK, chainIndex: 0 }; // chain_genesis: 1 session · 2 categories · 90′ · 3 days
  const steps = WEEKLY_CHAINS[0].steps;
  const partial = autoClaimWeeklySteps({ weeklyChain: chain, weeklySnapshot: { sessions: 3, uniqueCategories: 2, focusMinutes: 100, daysActive: 2 }, now: NOW });
  assert.deepEqual(partial.steps.map((s) => s.index), [0, 1, 2]);
  assert.equal(partial.xp, Math.round(steps[0].rewardXP * WEEKLY_CHAIN_XP_SCALE) + Math.round(steps[1].rewardXP * WEEKLY_CHAIN_XP_SCALE) + Math.round(steps[2].rewardXP * WEEKLY_CHAIN_XP_SCALE));
  assert.equal(partial.finished, false);
  assert.equal(partial.weeklyChain.currentStep, 3);
  assert.equal(partial.weeklyChain.stepProgress, 2, 'the open step carries its live progress');
  const done = autoClaimWeeklySteps({ weeklyChain: partial.weeklyChain, weeklySnapshot: { sessions: 3, uniqueCategories: 2, focusMinutes: 100, daysActive: 3 }, now: NOW });
  assert.equal(done.finished, true);
  assert.equal(done.bonusSP, WEEKLY_CHAINS[0].bonusSP);
  assert.equal(done.xp, Math.round((steps[3].rewardXP + WEEKLY_CHAINS[0].bonusXP) * WEEKLY_CHAIN_XP_SCALE));
  assert.equal(done.weeklyChain.bonusClaimed, true);
  const idle = autoClaimWeeklySteps({ weeklyChain: done.weeklyChain, weeklySnapshot: { sessions: 9, uniqueCategories: 9, focusMinutes: 900, daysActive: 7 }, now: NOW });
  assert.equal(idle.xp, 0, 'a finished chain pays nothing more');
});

test('rebuildWeeklyChainFromHistory never keeps a step that this week\'s history does not support', () => {
  const claimedTooFar = { ...makeDefaultWeeklyChain(), weekKey: WEEK, chainIndex: 0, currentStep: 3, stepProgress: 0 };
  const history = [at('2026-09-08T09:00:00+07:00', 30, { categoryId: 'a' })];
  const rebuilt = rebuildWeeklyChainFromHistory(claimedTooFar, history, { now: NOW });
  assert.equal(rebuilt.currentStep, 1, 'only "1 session" holds; "2 categories" does not');
  assert.equal(rebuilt.stepProgress, 1);
  assert.equal(rebuilt.bonusClaimed, false);
});
