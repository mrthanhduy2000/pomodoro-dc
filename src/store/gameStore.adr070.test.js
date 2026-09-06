/**
 * gameStore.adr070.test.js — "MỘT CÁI KẾT DUY NHẤT, KHÔNG NÚT NHẬN" chạy THẬT qua store (2026-09-06, ADR-070).
 * ─────────────────────────────────────────────────────────────────────────────
 * Tầng thuần đã khoá ở `engine/relicGrowth.test.js` và `engine/wonderEffects.test.js`. File này khoá
 * bốn thứ chỉ lộ ra khi có store thật — tức khi `completeFocusSession` PHẢI gọi tới chúng:
 *   1. Bước tuần đủ điều kiện được CHỐT NGAY trong phiên (không còn `claimWeeklyStep`), XP vào cùng phiên.
 *   2. Thưởng trọn ngày TỰ VÀO ở phiên khép nốt nhiệm vụ cuối (không còn `claimMissionAllBonus`).
 *   3. Di vật LÊN BẬC theo số phiên ≥25′ kể từ lúc nhận (không còn `evolveRelic`, không còn giá).
 *   4. Đặc quyền kỳ quan là buff trên trục sống — kỳ quan +8% EP thì EP phiên ĐÚNG là ×1,08.
 *   5. Save cũ không có `earnedAt` được đóng dấu lúc nạp — đồng hồ đếm bắt đầu từ hôm nay, không nhảy.
 *
 * ⚠️ Bài học Phase 4H: một hàm engine viết xong, có test, mà không ai gọi thì vẫn xanh. Bài quan trọng
 * nhất ở đây là bài chứng minh `completeFocusSession` THẬT SỰ đi qua ba cơ chế tự-vào ấy.
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
  { default: useGameStore, GAME_STORE_STORAGE_KEY, GAME_STORE_SCHEMA_VERSION },
  { RELIC_EVOLUTION, RELIC_EVOLVE_MIN_MINUTES, RELIC_EVOLVE_SESSIONS, WEEKLY_CHAINS, WEEKLY_CHAIN_XP_SCALE },
  { localDateStr, localWeekMondayStr },
  { eraEpRange },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/constants.js'),
  import('../engine/time.js'),
  import('../engine/rankLadder.js'),
]);

const initialState = useGameStore.getInitialState();
const DAY = 86_400_000;

function reset(patch = {}) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(initialState, true);
  useGameStore.setState(patch);
}

const realRandom = Math.random;
/** Chạy fn với Math.random cố định (0,99 ⇒ không sự kiện ngẫu nhiên nào nổ). */
function withRandom(value, fn) {
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = realRandom;
  }
}

function completedEntry(ts, minutes, extra = {}) {
  const iso = new Date(ts).toISOString();
  return {
    id: ts, book: 1, timestamp: iso, startedAt: iso, finishedAt: iso, minutes,
    xpEarned: 0, epEarned: 0, status: 'completed', completed: true, categoryId: null, ...extra,
  };
}

// ─── 1. Bước tuần tự chốt ───────────────────────────────────────────────────

test('BƯỚC TUẦN TỰ CHỐT: phiên đầu tiên của tuần đủ bước 1 ⇒ chốt ngay, XP vào cùng phiên, kể ở pendingReward', () => {
  reset({
    weeklyChain: { weekKey: localWeekMondayStr(), chainIndex: 0, currentStep: 0, stepProgress: 0, bonusClaimed: false, recentHistory: [] },
    history: [],
  });
  const chain = WEEKLY_CHAINS[0];
  assert.equal(chain.steps[0].type, 'sessions');
  assert.equal(chain.steps[0].goal, 1, 'tiền đề: bước 1 của chuỗi 0 chỉ cần 1 phiên');

  withRandom(0.99, () => useGameStore.getState().completeFocusSession(25));
  const st = useGameStore.getState();
  const reward = st.ui.pendingReward;

  assert.equal(st.weeklyChain.currentStep, 1, 'bước 1 đủ mà chưa chốt ⇒ nút "Chốt bước" cũ vẫn đang được chờ');
  assert.equal(reward.weeklyChainTitle, chain.title);
  assert.equal(reward.weeklySteps.length, 1, 'pendingReward phải kể ĐÚNG bước vừa chốt');
  const stepXP = Math.round(chain.steps[0].rewardXP * WEEKLY_CHAIN_XP_SCALE);
  assert.equal(reward.weeklySteps[0].xp, stepXP, 'XP bước phải theo CÙNG công thức nút cũ (rewardXP × WEEKLY_CHAIN_XP_SCALE)');
  assert.equal(reward.weeklySteps[0].label, chain.steps[0].label);
  assert.equal(reward.weeklySteps[0].isLast, false);
  assert.equal(reward.weeklyBonusSP, 0, 'chưa tới bước cuối thì chưa có SP chuỗi');
  assert.ok(reward.totalSessionXP >= stepXP, 'XP bước phải nằm TRONG XP phiên (lên cấp tính một lần)');
  assert.equal(st.player.totalEXP, reward.totalSessionXP, 'XP đã ghi vào người chơi đúng bằng XP phiên kể ra');
  assert.equal(typeof useGameStore.getState().claimWeeklyStep, 'undefined', 'action `claimWeeklyStep` phải biến mất — không còn nút nhận');
});

test('BƯỚC TUẦN: bước chưa đủ thì KHÔNG chốt — chỉ ghi tiến độ', () => {
  reset({
    weeklyChain: { weekKey: localWeekMondayStr(), chainIndex: 4, currentStep: 0, stepProgress: 0, bonusClaimed: false, recentHistory: [] },
    history: [],
  });
  // Chuỗi 4 mở bằng "4 ngày có phiên" — một phiên không thể đủ.
  assert.equal(WEEKLY_CHAINS[4].steps[0].type, 'daysActive');
  withRandom(0.99, () => useGameStore.getState().completeFocusSession(25));
  const st = useGameStore.getState();
  assert.equal(st.weeklyChain.currentStep, 0);
  assert.equal(st.weeklyChain.stepProgress, 1, 'tiến độ phải ghi 1/4 ngày');
  assert.deepEqual(st.ui.pendingReward.weeklySteps, []);
});

// ─── 2. Thưởng trọn ngày tự vào ──────────────────────────────────────────────

test('THƯỞNG TRỌN NGÀY TỰ VÀO: phiên khép nốt nhiệm vụ cuối ⇒ bonusClaimedToday, XP kể ở pendingReward.dailyBonusXP', () => {
  reset({
    missions: {
      date: localDateStr(),
      list: [
        { id: 'complete_1_session', type: 'sessions', goal: 1, progress: 0, claimed: false, rewardXP: 20 },
        { id: 'focus_25min', type: 'focusMinutes', goal: 25, progress: 25, claimed: true, rewardXP: 25 },
      ],
      bonusClaimedToday: false,
      bonusClaimedXP: 0,
      streakMissionClaimedToday: false,
      recentHistory: [],
    },
    history: [],
  });
  withRandom(0.99, () => useGameStore.getState().completeFocusSession(25));
  const st = useGameStore.getState();
  const reward = st.ui.pendingReward;

  assert.ok(st.missions.list.every((m) => m.claimed), 'nhiệm vụ cuối phải tự "claimed" ngay trong phiên');
  assert.equal(st.missions.bonusClaimedToday, true, 'thưởng trọn ngày chưa tự vào ⇒ nút "Nhận" cũ vẫn đang được chờ');
  assert.ok(reward.dailyBonusXP > 0, 'pendingReward phải kể số XP trọn ngày');
  assert.equal(st.missions.bonusClaimedXP, reward.dailyBonusXP, 'số ghi ở missions và số kể ở thẻ phải là MỘT');
  assert.ok(reward.totalSessionXP >= reward.dailyBonusXP + reward.missionBonusXP, 'XP trọn ngày phải nằm TRONG XP phiên');
  assert.equal(typeof st.claimMissionAllBonus, 'undefined', 'action `claimMissionAllBonus` phải biến mất');
});

test('THƯỞNG TRỌN NGÀY: đã nhận hôm nay thì phiên sau KHÔNG cộng lần hai', () => {
  reset({
    missions: {
      date: localDateStr(),
      list: [{ id: 'complete_1_session', type: 'sessions', goal: 1, progress: 1, claimed: true, rewardXP: 20 }],
      bonusClaimedToday: true,
      bonusClaimedXP: 77,
      streakMissionClaimedToday: false,
      recentHistory: [],
    },
    // ⚠️ Phải có MỘT phiên thật hôm nay đỡ cho "đã xong": ADR-070 đối chiếu nhiệm vụ với lịch sử ngay
    // trong phiên (cùng hàm với `refreshDailyMissions`), nên một "claimed" không có lịch sử sẽ bị reset.
    history: [completedEntry(Date.now() - 60_000, 25)],
  });
  withRandom(0.99, () => useGameStore.getState().completeFocusSession(25));
  const st = useGameStore.getState();
  assert.equal(st.ui.pendingReward.dailyBonusXP, 0);
  assert.equal(st.missions.bonusClaimedXP, 77, 'số đã ghi không được bị ghi đè');
});

// ─── 3. Di vật lên bậc theo phiên ────────────────────────────────────────────

test('DI VẬT LÊN BẬC NGAY TRONG completeFocusSession: phiên thứ 20 (≥25′) kể từ lúc nhận ⇒ bậc 1, kể ở pendingReward.relicsEvolved', () => {
  const now = Date.now();
  const earnedAt = new Date(now - 60 * DAY).toISOString();
  const need = RELIC_EVOLVE_SESSIONS[1];
  // need − 1 phiên đủ dài SAU lúc nhận, cộng một phiên QUÁ NGẮN (không tính) và một phiên TRƯỚC lúc nhận (không tính).
  const history = [
    ...Array.from({ length: need - 1 }, (_, i) => completedEntry(now - (59 - i) * DAY, 30)),
    completedEntry(now - 20 * DAY + 3_600_000, RELIC_EVOLVE_MIN_MINUTES - 1),
    completedEntry(now - 70 * DAY, 60),
  ].sort((a, b) => b.id - a.id);
  reset({
    relics: [{ id: 'mam_song_bat_diet', label: 'Mầm Sống Bất Diệt', icon: '🌱', description: 'x', buff: { epBonus: 0.08 }, earnedAt }],
    relicEvolutions: {},
    history,
  });
  assert.equal(useGameStore.getState().relicEvolutions.mam_song_bat_diet ?? 0, 0, 'tiền đề: chưa lên bậc');

  withRandom(0.99, () => useGameStore.getState().completeFocusSession(25));
  const st = useGameStore.getState();
  const reward = st.ui.pendingReward;

  assert.equal(st.relicEvolutions.mam_song_bat_diet, 1, 'đủ 20 phiên mà chưa lên bậc ⇒ relicGrowth chưa được nối vào store');
  assert.equal(reward.relicsEvolved.length, 1);
  assert.equal(reward.relicsEvolved[0].id, 'mam_song_bat_diet');
  assert.equal(reward.relicsEvolved[0].stage, 1);
  assert.equal(reward.relicsEvolved[0].stageLabel, RELIC_EVOLUTION.mam_song_bat_diet.stages[1].label);
  assert.deepEqual(reward.relicsEvolved[0].buff, RELIC_EVOLUTION.mam_song_bat_diet.stages[1].buff);
  assert.equal(typeof st.evolveRelic, 'undefined', 'action `evolveRelic` phải biến mất — không còn giá để trả');
});

test('DI VẬT: phiên thứ 19 thì CHƯA lên bậc — mốc là 20, không sớm hơn', () => {
  const now = Date.now();
  const earnedAt = new Date(now - 60 * DAY).toISOString();
  const need = RELIC_EVOLVE_SESSIONS[1];
  const history = Array.from({ length: need - 2 }, (_, i) => completedEntry(now - (59 - i) * DAY, 30)).sort((a, b) => b.id - a.id);
  reset({
    relics: [{ id: 'mam_song_bat_diet', label: 'Mầm Sống Bất Diệt', icon: '🌱', description: 'x', buff: { epBonus: 0.08 }, earnedAt }],
    relicEvolutions: {},
    history,
  });
  withRandom(0.99, () => useGameStore.getState().completeFocusSession(25));
  const st = useGameStore.getState();
  assert.equal(st.relicEvolutions.mam_song_bat_diet ?? 0, 0);
  assert.deepEqual(st.ui.pendingReward.relicsEvolved, []);
});

// ─── 4. Đặc quyền kỳ quan là buff trục sống ─────────────────────────────────

test('KỲ QUAN +8% EP (bp_cung_dien_ph, kỷ 7): EP phiên ĐÚNG là ×1,08 so với không có kỳ quan', () => {
  const base = {
    progress: { ...initialState.progress, activeBook: 7, totalEP: eraEpRange(7).start + 10 },
    history: [],
  };
  reset({ ...base, buildings: [] });
  withRandom(0.99, () => useGameStore.getState().completeFocusSession(45));
  const epWithout = useGameStore.getState().ui.pendingReward.finalEP;

  reset({ ...base, buildings: ['bp_cung_dien_ph'] });
  withRandom(0.99, () => useGameStore.getState().completeFocusSession(45));
  const epWith = useGameStore.getState().ui.pendingReward.finalEP;

  assert.ok(epWithout > 0, 'tiền đề: phiên phải sinh EP');
  assert.ok(epWith > epWithout, 'kỳ quan +8% EP mà EP không tăng ⇒ wonderPassiveBuffs chưa được cộng vào activeBuffs');
  const ratio = epWith / epWithout;
  assert.ok(Math.abs(ratio - 1.08) <= 0.03, `EP phải ×1,08 (đo được ×${ratio.toFixed(4)})`);
});

// ─── 5. Save cũ: đóng dấu earnedAt lúc nạp ──────────────────────────────────

test('SAVE CŨ không có earnedAt ⇒ đóng dấu lúc nạp (đồng hồ đếm bắt đầu từ hôm nay, không nhảy bậc từ lịch sử cũ)', async () => {
  reset();
  const before = Date.now();
  window.localStorage.setItem(GAME_STORE_STORAGE_KEY, JSON.stringify({
    version: GAME_STORE_SCHEMA_VERSION,
    state: {
      ...initialState,
      ui: undefined,
      relics: [{ id: 'mam_song_bat_diet', label: 'Mầm Sống Bất Diệt', icon: '🌱', description: 'x', buff: { epBonus: 0.08 } }],
      // 60 phiên dài trong lịch sử cũ — nếu KHÔNG đóng dấu thì di vật sẽ nhảy thẳng lên bậc 2 ở phiên kế.
      history: Array.from({ length: 60 }, (_, i) => completedEntry(before - (i + 1) * DAY, 45)),
    },
  }));
  await useGameStore.persist.rehydrate();
  const relic = useGameStore.getState().relics[0];
  assert.ok(relic?.earnedAt, 'di vật nạp từ save cũ phải có earnedAt');
  const t = Date.parse(relic.earnedAt);
  assert.ok(t >= before - 1000 && t <= Date.now() + 1000, 'earnedAt phải là LÚC NẠP, không phải một mốc cũ');

  withRandom(0.99, () => useGameStore.getState().completeFocusSession(25));
  assert.equal(useGameStore.getState().relicEvolutions.mam_song_bat_diet ?? 0, 0,
    '60 phiên cũ không được tính — đồng hồ chỉ đếm từ lúc nạp');
});

test('SAVE CŨ mang mô tả di vật cũ ("tăng tài nguyên rớt") ⇒ lúc nạp đọc lại chữ từ bảng — save không được kể một đồng tiền đã ngủ', async () => {
  reset();
  window.localStorage.setItem(GAME_STORE_STORAGE_KEY, JSON.stringify({
    version: GAME_STORE_SCHEMA_VERSION,
    state: {
      ...initialState,
      ui: undefined,
      relics: [{ id: 'mam_song_bat_diet', label: 'Mầm Sống Bất Diệt', icon: '🌱', description: 'Di vật Kỷ Băng Hà — tăng tài nguyên rớt.', buff: { resourceBonus: 0.2 }, earnedAt: '2026-05-01T00:00:00.000Z' }],
    },
  }));
  await useGameStore.persist.rehydrate();
  const relic = useGameStore.getState().relics[0];
  assert.ok(!/tài nguyên/.test(relic.description), `mô tả vẫn là bản chép cũ: «${relic.description}»`);
  assert.deepEqual(relic.buff, { epBonus: 0.08 });
  assert.equal(relic.earnedAt, '2026-05-01T00:00:00.000Z', 'earnedAt đã có thì GIỮ — không được đóng dấu lại');
});
