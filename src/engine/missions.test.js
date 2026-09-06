import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDailyMissionXPBonus, buildDailyProgressSnapshotFromHistory, getDailyMissionAllBonusXP,
  getDailyMissionProgressFromSnapshot, pickDailyMissions, rebuildMissionsFromHistory, refreshMissionsIfStale,
  rollMissionHistory, streakMissionXPBase, tickDailyMissions,
} from './missions.js';
import { MISSIONS_PER_DAY, STREAK_MISSION_MIN_STREAK, STREAK_MISSION_BASE_XP, STREAK_MISSION_MAX_XP } from './constants.js';

const TODAY = '2026-09-09';
const at = (iso, minutes, extra = {}) => ({ id: iso, timestamp: iso, minutes, completed: true, ...extra });
const single30 = () => ({
  date: TODAY, recentHistory: [], bonusClaimedToday: false, bonusClaimedXP: 0, streakMissionClaimedToday: false,
  list: [{ id: 'session_30min', progress: 0, claimed: false }],
});

test('daily roll is deterministic for (day, recent history) and yields MISSIONS_PER_DAY missions', () => {
  const a = pickDailyMissions(TODAY, []);
  const b = pickDailyMissions(TODAY, []);
  assert.deepEqual(a.map((m) => m.id), b.map((m) => m.id));
  assert.equal(a.length, MISSIONS_PER_DAY);
  assert.ok(a.every((m) => m.progress === 0 && m.claimed === false));
});

test('refreshMissionsIfStale: same day keeps the list, a new day rolls it and files the old one in recentHistory', () => {
  const rolled = refreshMissionsIfStale({ date: null, list: [] }, { today: TODAY });
  assert.equal(rolled.date, TODAY);
  const same = refreshMissionsIfStale(rolled, { today: TODAY });
  assert.deepEqual(same.list.map((m) => m.id), rolled.list.map((m) => m.id));
  const next = refreshMissionsIfStale(rolled, { today: '2026-09-10' });
  assert.equal(next.date, '2026-09-10');
  assert.equal(next.recentHistory[0].date, TODAY);
  assert.deepEqual(rollMissionHistory(rolled, '2026-09-10')[0].ids, rolled.list.map((m) => m.id));
});

test('progress is one formula: the day snapshot — singleSession is the LONGEST session, clamped, never a sum', () => {
  const history = [at('2026-09-09T09:00:00+07:00', 25), at('2026-09-09T11:00:00+07:00', 25), at('2026-09-09T14:00:00+07:00', 25)];
  const snap = buildDailyProgressSnapshotFromHistory(history, TODAY);
  assert.equal(snap.sessions, 3);
  assert.equal(snap.focusMinutes, 75);
  assert.equal(snap.maxSessionMinutes, 25);
  assert.equal(getDailyMissionProgressFromSnapshot({ type: 'singleSession', goal: 30 }, snap), 25);
  assert.equal(getDailyMissionProgressFromSnapshot({ type: 'focusMinutes', goal: 60 }, snap), 60);
});

test('tickDailyMissions: the live path IS the reload path with the finished session prepended (ADR-077)', () => {
  const s22 = at('2026-09-09T10:00:00+07:00', 22);
  const live = tickDailyMissions({ missions: single30(), history: [], streak: { currentStreak: 0 }, sessionEntry: s22, today: TODAY });
  const reload = rebuildMissionsFromHistory(single30(), [s22], { currentStreak: 0 }, { today: TODAY });
  assert.equal(live.missions.list[0].progress, 22, 'a 22-minute session shows 22/30, not 0/30');
  assert.equal(live.missions.list[0].claimed, false);
  assert.deepEqual(live.missions.list, reload.list, 'live and reload must print the same number');
  assert.deepEqual(live.newlyCompletedMissionIds, []);
  assert.equal(live.missionBonusXP, 0);
  assert.equal(live.dailyBonusXP, 0);
});

test('tickDailyMissions: completing the last mission pays mission XP + the all-done bonus exactly once', () => {
  const s30 = at('2026-09-09T10:00:00+07:00', 30);
  const first = tickDailyMissions({ missions: single30(), history: [], streak: { currentStreak: 0 }, sessionEntry: s30, today: TODAY });
  assert.deepEqual(first.newlyCompletedMissionIds, ['session_30min']);
  assert.equal(first.missionBonusXP, applyDailyMissionXPBonus([], 35));
  assert.equal(first.dailyBonusXP, getDailyMissionAllBonusXP({ list: first.missions.list }, [], {}));
  assert.ok(first.dailyBonusXP > 0);
  assert.equal(first.missions.bonusClaimedToday, true);
  const again = tickDailyMissions({
    missions: first.missions, history: [s30], streak: { currentStreak: 0 },
    sessionEntry: at('2026-09-09T12:00:00+07:00', 30), today: TODAY,
  });
  assert.deepEqual(again.newlyCompletedMissionIds, []);
  assert.equal(again.dailyBonusXP, 0, 'the all-done bonus must not pay twice in one day');
  assert.equal(again.missions.bonusClaimedXP, first.dailyBonusXP);
});

test('streak mission XP: 0 below the floor, grows per day, capped, and only once per day', () => {
  assert.equal(streakMissionXPBase(STREAK_MISSION_MIN_STREAK - 1, false), 0);
  assert.equal(streakMissionXPBase(STREAK_MISSION_MIN_STREAK, false), STREAK_MISSION_BASE_XP);
  assert.equal(streakMissionXPBase(400, false), STREAK_MISSION_MAX_XP);
  assert.equal(streakMissionXPBase(400, true), 0);
  const tick = tickDailyMissions({
    missions: single30(), history: [], streak: { currentStreak: STREAK_MISSION_MIN_STREAK },
    sessionEntry: at('2026-09-09T10:00:00+07:00', 10), today: TODAY,
  });
  assert.equal(tick.streakMissionXP, applyDailyMissionXPBonus([], STREAK_MISSION_BASE_XP));
  assert.equal(tick.missions.streakMissionClaimedToday, true);
});
