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

const [{ default: useGameStore }, { localDateStr }] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/time.js'),
]);

const initialState = useGameStore.getInitialState();

function resetStore() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(initialState, true);
}

function todayTimestamp(minutesAgo = 0) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

function makeSession(id, {
  minutes = 15,
  timestamp = todayTimestamp(id),
  xpEarned = minutes,
  epEarned = 0,
  rpEarned = 0,
  breakCompletedOnTime = false,
  breakCompletedAt = null,
} = {}) {
  return {
    id,
    timestamp,
    finishedAt: timestamp,
    startedAt: timestamp,
    minutes,
    xpEarned,
    epEarned,
    rpEarned,
    completed: true,
    status: 'completed',
    book: 1,
    breakCompletedOnTime,
    breakCompletedAt,
  };
}

function setDailyMissionState({ history = [], missions, player = {}, progress = {} }) {
  useGameStore.setState((state) => ({
    history,
    missions: {
      ...state.missions,
      date: localDateStr(),
      ...missions,
    },
    player: {
      ...state.player,
      ...player,
    },
    progress: {
      ...state.progress,
      ...progress,
    },
  }));
}

test('refreshDailyMissions rebuilds stale session and minute progress from history', () => {
  resetStore();

  setDailyMissionState({
    history: [],
    missions: {
      list: [
        { id: 'complete_3_sessions', progress: 3, claimed: true },
        { id: 'focus_60min', progress: 45, claimed: false },
      ],
      bonusClaimedToday: false,
    },
  });

  useGameStore.getState().refreshDailyMissions();

  const missions = useGameStore.getState().missions.list;
  assert.equal(missions.find((mission) => mission.id === 'complete_3_sessions')?.progress, 0);
  assert.equal(missions.find((mission) => mission.id === 'complete_3_sessions')?.claimed, false);
  assert.equal(missions.find((mission) => mission.id === 'focus_60min')?.progress, 0);
});

test('refreshDailyMissions rebuilds perfect break progress from session history', () => {
  resetStore();

  const breakCompletedAt = todayTimestamp();
  setDailyMissionState({
    history: [
      makeSession(1, {
        breakCompletedOnTime: true,
        breakCompletedAt,
      }),
    ],
    missions: {
      list: [
        { id: 'perfect_break_1', progress: 0, claimed: false },
      ],
      bonusClaimedToday: false,
    },
  });

  useGameStore.getState().refreshDailyMissions();

  const mission = useGameStore.getState().missions.list.find((entry) => entry.id === 'perfect_break_1');
  assert.equal(mission?.progress, 1);
  assert.equal(mission?.claimed, true);
});

test('claimMissionAllBonus reconciles stale completed missions before awarding XP', () => {
  resetStore();

  setDailyMissionState({
    history: [],
    missions: {
      list: [
        { id: 'complete_3_sessions', progress: 3, claimed: true },
      ],
      bonusClaimedToday: false,
    },
    player: {
      totalEXP: 0,
      level: 0,
      sp: 0,
    },
  });

  useGameStore.getState().claimMissionAllBonus();

  const state = useGameStore.getState();
  const mission = state.missions.list.find((entry) => entry.id === 'complete_3_sessions');
  assert.equal(mission?.progress, 0);
  assert.equal(mission?.claimed, false);
  assert.equal(state.missions.bonusClaimedToday, false);
  assert.equal(state.player.totalEXP, 0);
});

test('deleting sessions revokes daily all-mission bonus XP when goals no longer qualify', () => {
  resetStore();

  const sessions = [
    makeSession(1, { minutes: 20 }),
    makeSession(2, { minutes: 20 }),
    makeSession(3, { minutes: 20 }),
  ];

  setDailyMissionState({
    history: sessions,
    missions: {
      list: [
        { id: 'complete_3_sessions', progress: 3, claimed: true },
      ],
      bonusClaimedToday: true,
      bonusClaimedXP: 100,
    },
    player: {
      totalEXP: 160,
      level: 0,
      sp: 0,
    },
    progress: {
      sessionsCompleted: 3,
      totalFocusMinutes: 60,
    },
  });

  for (const session of sessions) {
    useGameStore.getState().deleteSession(session.id);
  }

  const state = useGameStore.getState();
  const mission = state.missions.list.find((entry) => entry.id === 'complete_3_sessions');
  assert.equal(mission?.progress, 0);
  assert.equal(mission?.claimed, false);
  assert.equal(state.missions.bonusClaimedToday, false);
  assert.equal(state.missions.bonusClaimedXP, 0);
  assert.equal(state.player.totalEXP, 0);
  assert.equal(state.progress.sessionsCompleted, 0);
  assert.equal(state.progress.totalFocusMinutes, 0);
});
