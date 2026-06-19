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
  { default: useGameStore, GAME_STORE_SCHEMA_VERSION },
  { localDateStr },
  { PRESTIGE_EP_REQUIREMENT, TINH_THE_HARD_CAP },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/time.js'),
  import('../engine/constants.js'),
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

test('marking a session achieved grants a one-time goal bonus (XP + EP)', () => {
  resetStore();

  useGameStore.setState({
    history: [makeSession(1, { minutes: 25, xpEarned: 100, epEarned: 50 })],
  });

  const baseXP = useGameStore.getState().player.totalEXP;
  const baseEP = useGameStore.getState().progress.totalEP;

  useGameStore.getState().reviewCompletedSession(1, { goal: 'viết báo cáo', goalAchieved: true });

  let state = useGameStore.getState();
  let entry = state.history.find((h) => h.id === 1);
  assert.equal(entry.goalAchieved, true);
  assert.equal(entry.goalBonusGranted, true);
  assert.equal(entry.goalBonusXP, 12); // round(100 * 0.12)
  assert.equal(entry.goalBonusEP, 6); // round(50 * 0.12)
  assert.equal(state.player.totalEXP, baseXP + 12);
  assert.equal(state.progress.totalEP, baseEP + 6);

  // Re-marking achieved must NOT grant the bonus again
  useGameStore.getState().reviewCompletedSession(1, { goalAchieved: true });
  state = useGameStore.getState();
  assert.equal(state.player.totalEXP, baseXP + 12);
  assert.equal(state.progress.totalEP, baseEP + 6);
  assert.equal(state.history.find((h) => h.id === 1).goalBonusXP, 12);

  // Toggling missed → achieved again still must NOT re-grant
  useGameStore.getState().reviewCompletedSession(1, { goalAchieved: false });
  useGameStore.getState().reviewCompletedSession(1, { goalAchieved: true });
  state = useGameStore.getState();
  assert.equal(state.player.totalEXP, baseXP + 12);
  assert.equal(state.progress.totalEP, baseEP + 6);
});

test('cancelled sessions do not grant the goal bonus', () => {
  resetStore();

  useGameStore.setState({
    history: [
      {
        ...makeSession(2, { xpEarned: 100, epEarned: 50 }),
        status: 'cancelled',
        cancelled: true,
        completed: false,
      },
    ],
  });

  const baseXP = useGameStore.getState().player.totalEXP;
  const baseEP = useGameStore.getState().progress.totalEP;

  useGameStore.getState().reviewCompletedSession(2, { goalAchieved: true });

  const state = useGameStore.getState();
  assert.equal(state.player.totalEXP, baseXP);
  assert.equal(state.progress.totalEP, baseEP);
  assert.equal(state.history.find((h) => h.id === 2).goalBonusGranted, undefined);
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

// ═══════════════════════════════════════════════════════════════════════════════
// BẢN CẬP NHẬT CỘNG HƯỞNG — store
// ═══════════════════════════════════════════════════════════════════════════════

test('Cộng Hưởng: evolveRelic — không TTCH = cũ; có TTCH thay tối đa 50%', () => {
  // Không TTCH: trừ toàn bộ refined, không đụng tinhThe
  resetStore();
  useGameStore.setState({
    relics: [{ id: 'mam_song_bat_diet' }],
    relicEvolutions: {},
    resourcesRefined: { 1: { t2: 100, t3: 0 } },
    tinhThe: 12,
    buildings: [],
  });
  assert.equal(useGameStore.getState().evolveRelic('mam_song_bat_diet'), true);
  const a = useGameStore.getState();
  assert.equal(a.relicEvolutions.mam_song_bat_diet, 1);
  const fullCost = 100 - a.resourcesRefined[1].t2;
  assert.ok(fullCost > 0);
  assert.equal(a.tinhThe, 12);

  // Có TTCH: trừ ít refined hơn + tiêu TTCH (2 TTCH / đơn vị refined)
  resetStore();
  useGameStore.setState({
    relics: [{ id: 'mam_song_bat_diet' }],
    relicEvolutions: {},
    resourcesRefined: { 1: { t2: 100, t3: 0 } },
    tinhThe: 12,
    buildings: [],
  });
  assert.equal(useGameStore.getState().evolveRelic('mam_song_bat_diet', { ttchToSpend: true }), true);
  const b = useGameStore.getState();
  assert.equal(b.relicEvolutions.mam_song_bat_diet, 1);
  const reducedCost = 100 - b.resourcesRefined[1].t2;
  assert.ok(reducedCost < fullCost);                  // trả ít refined hơn
  assert.ok(reducedCost >= Math.ceil(fullCost / 2));  // vẫn ≥50% bằng refined thật
  assert.ok(b.tinhThe < 12);
  assert.equal(12 - b.tinhThe, (fullCost - reducedCost) * 2);
});

test('Cộng Hưởng: evolveRelic từ chối nếu thiếu phần refined ≥50% dù đầy TTCH', () => {
  resetStore();
  useGameStore.setState({
    relics: [{ id: 'mam_song_bat_diet' }],
    relicEvolutions: {},
    resourcesRefined: { 1: { t2: 0, t3: 0 } },  // không có refined thật
    tinhThe: 12,
    buildings: [],
  });
  assert.equal(useGameStore.getState().evolveRelic('mam_song_bat_diet', { ttchToSpend: true }), false);
  assert.equal(useGameStore.getState().tinhThe, 12);  // không tiêu
  assert.equal(useGameStore.getState().relicEvolutions.mam_song_bat_diet ?? 0, 0);
});

test('Cộng Hưởng: unlockSkill elite cộng hưởng tốn 11 SP (server tính lại, chống tamper)', () => {
  resetStore();
  useGameStore.setState((s) => ({
    player: { ...s.player, sp: 11, unlockedSkills: { ...s.player.unlockedSkills, tap_trung_sieu_viet: true } },
    relics: [{ id: 'mam_song_bat_diet' }],
    relicEvolutions: { mam_song_bat_diet: 1 },
  }));
  // Dù UI truyền 22, giá thực = 11 nhờ cộng hưởng.
  assert.equal(useGameStore.getState().unlockSkill('sieu_tap_trung', 22, ['tap_trung_sieu_viet']), true);
  const st = useGameStore.getState();
  assert.equal(st.player.unlockedSkills.sieu_tap_trung, true);
  assert.equal(st.player.sp, 0);

  // Không cổ vật → cần đủ 22; tamper-down truyền 11 vẫn bị chặn.
  resetStore();
  useGameStore.setState((s) => ({
    player: { ...s.player, sp: 11, unlockedSkills: { ...s.player.unlockedSkills, tap_trung_sieu_viet: true } },
    relics: [],
    relicEvolutions: {},
  }));
  assert.equal(useGameStore.getState().unlockSkill('sieu_tap_trung', 11, ['tap_trung_sieu_viet']), false);
  assert.equal(useGameStore.getState().player.unlockedSkills.sieu_tap_trung ?? false, false);
});

test('Cộng Hưởng: tinhThe khởi tạo 0, schema = 3, sống sót qua prestige', () => {
  assert.equal(useGameStore.getInitialState().tinhThe, 0);
  assert.equal(GAME_STORE_SCHEMA_VERSION, 3);

  resetStore();
  useGameStore.setState((s) => ({
    tinhThe: 5,
    progress: { ...s.progress, totalEP: PRESTIGE_EP_REQUIREMENT },
  }));
  assert.equal(useGameStore.getState().triggerPrestige(), true);
  assert.equal(useGameStore.getState().tinhThe, 5);  // persist qua prestige
  assert.ok(useGameStore.getState().tinhThe <= TINH_THE_HARD_CAP);
});
