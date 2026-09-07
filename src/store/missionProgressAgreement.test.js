import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripComments } from '../utils/sourceScan.js';

const STORE = stripComments(readFileSync(new URL('./gameStore.js', import.meta.url), 'utf8'));
// ADR-078: the live path moved out of the store into `engine/sessionRewards.js` (pure) — the
// store must now hold NO tick at all.
const LIVE = stripComments(readFileSync(new URL('../engine/sessionRewards.js', import.meta.url), 'utf8'));
const ENGINE = stripComments(readFileSync(new URL('../engine/missions.js', import.meta.url), 'utf8'));

/**
 * WHY THIS FILE EXISTS. Daily-mission progress used to be computed on TWO paths ~1,300 lines apart in
 * `gameStore.js`: the LIVE path right after a session and the REBUILD path on reload. They disagreed
 * on `singleSession` (all-or-nothing vs. continuous): a 22-minute session printed 0/30, then 22/30
 * after a reload. Build green, lint clean, tests green — the only symptom was a number that changed
 * by itself. Round 37 (ADR-077) removed the second copy instead of keeping it in sync: the live path
 * now calls `tickDailyMissions`, which rebuilds from history WITH the finished session. These tests
 * guard that structure so nobody re-inlines a hand-written tick "just for this one field".
 */

// BREAK-TEST: paste back `if (m.type === 'sessions') progress = Math.min(m.goal, progress + 1);` ⇒ red.
test('the store has exactly ONE live tick, and it is the engine function', () => {
  const calls = LIVE.split('tickDailyMissions(').length - 1;
  assert.equal(calls, 1, `tickDailyMissions( must be called exactly once in engine/sessionRewards.js (found ${calls})`);
  assert.equal(STORE.split('tickDailyMissions(').length - 1, 0, 'the store grew a second mission tick — the engine owns the only one');
  assert.doesNotMatch(STORE, /m\.type === 'singleSession'/, 'a hand-written singleSession branch is back in the store');
  assert.doesNotMatch(STORE, /m\.type === 'sessions'\) progress =/, 'a hand-written sessions branch is back in the store');
  assert.doesNotMatch(STORE, /function getDailyMissionProgressFromSnapshot/, 'the snapshot formula must live in engine/missions.js only');
});

test('the live tick feeds the SAME draft entry to the week snapshot and the mission tick', () => {
  assert.match(LIVE, /weeklySnapshotWithSession\(state\.history, refreshedChain\.weekKey, sessionEntryDraft\)/);
  assert.match(LIVE, /sessionEntry: sessionEntryDraft/);
});

// The rebuild path must stay continuous — it is the one the live path was pulled towards.
test('the engine snapshot formula for singleSession is continuous (max of session lengths, clamped)', () => {
  assert.match(ENGINE, /case 'singleSession': return Math\.min\(mission\.goal, snapshot\.maxSessionMinutes\);/);
  assert.match(ENGINE, /const after = rebuildMissionsFromHistory\(before, \[sessionEntry, \.\.\.\(history \?\? \[\]\)\]/,
    'tickDailyMissions must derive the live result by prepending the session to history');
});

// Pure simulation of the completion law — survives any renaming.
test('completion law: a "one session ≥ N" mission is done only by ONE long-enough session', () => {
  const goal = 30;
  const progress = (sessions) => Math.min(goal, Math.max(0, ...sessions, 0));
  assert.ok(progress([25, 25, 25]) < goal, 'three 25-minute sessions must not complete a 30-minute single-session mission');
  assert.equal(progress([30]), goal);
  assert.equal(progress([22]), 22);
});
