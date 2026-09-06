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
  { PRESTIGE_EP_REQUIREMENT, TINH_THE_HARD_CAP, SKILL_TREE },
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

test('ADR-070: completeFocusSession đối chiếu nhiệm vụ "đã xong" với LỊCH SỬ trước khi tự thưởng trọn ngày', () => {
  resetStore();

  setDailyMissionState({
    history: [],
    missions: {
      list: [
        { id: 'complete_3_sessions', progress: 3, claimed: true },
      ],
      bonusClaimedToday: false,
    },
  });

  // Không còn nút "Nhận" (`claimMissionAllBonus` đã gỡ) — phép đối chiếu mà nút cũ làm nay phải nằm
  // NGAY TRONG PHIÊN, vì thưởng trọn ngày tự vào ở đó. Gỡ nút mà đánh rơi phép đối chiếu thì một
  // "3/3" giả (sync lệch máy, phiên đã xoá) sẽ kéo theo một khoản thưởng thật.
  useGameStore.getState().completeFocusSession(25);

  const state = useGameStore.getState();
  const mission = state.missions.list.find((entry) => entry.id === 'complete_3_sessions');
  assert.equal(mission?.progress, 1, 'lịch sử trống ⇒ 3/3 giả phải về 0, rồi phiên này tick lên 1');
  assert.equal(mission?.claimed, false);
  assert.equal(state.missions.bonusClaimedToday, false, 'nhiệm vụ "xong" không có lịch sử đỡ KHÔNG được kéo theo thưởng trọn ngày');
  assert.equal(state.ui.pendingReward.dailyBonusXP, 0);
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
// ADR-070 (2026-09-06): hai bài `evolveRelic` (không TTCH / có TTCH / từ chối khi thiếu refined)
// đã gỡ CÙNG action — di vật nay tiến hoá theo PHIÊN đã hoàn thành kể từ lúc nhận, không còn một
// đồng nào để trả. Luật thuần khoá ở `engine/relicGrowth.test.js`; đường store khoá ở
// `gameStore.adr070.test.js` (bài "DI VẬT LÊN BẬC NGAY TRONG completeFocusSession").

// ⚠️ GIÁ HỎI CHÍNH BẢNG, KHÔNG CHÉP TAY (sửa 2026-08-30). Ba bài dưới đây từng viết cứng 22/14/11
// SP. Khi giá cây kỹ năng hạ 3/7/14/22 → 2/3/5/8 (cây 336 → 138 SP, tức 15,9 năm → 1,7 năm — xem
// `skillTreeCost.test.js`), cả ba ĐỎ trên mã hoàn toàn đúng: **phép đo già đi, không phải mã hỏng**.
// Nay chúng đọc `SKILL_TREE` nên chúng canh đúng thứ chúng định canh — *"trừ ĐÚNG chi phí"*,
// *"thiếu SP thì không mất oan"*, *"cộng hưởng giảm nửa giá và server tính lại"* — mà không phụ
// thuộc vào việc bảng giá hôm nay là bao nhiêu.
const GIA_ELITE = Object.values(SKILL_TREE)
  .flatMap((b) => b.nodes)
  .find((n) => n.id === 'sieu_tap_trung').spCost;
const GIA_ELITE_CONG_HUONG = Math.ceil(GIA_ELITE / 2);

test('Cộng Hưởng: unlockSkill elite cộng hưởng chỉ tốn NỬA giá (server tính lại, chống tamper)', () => {
  resetStore();
  useGameStore.setState((s) => ({
    player: { ...s.player, sp: GIA_ELITE_CONG_HUONG, unlockedSkills: { ...s.player.unlockedSkills, tap_trung_sieu_viet: true } },
    relics: [{ id: 'mam_song_bat_diet' }],
    relicEvolutions: { mam_song_bat_diet: 1 },
  }));
  // Dù UI truyền giá đầy đủ, giá thực chỉ còn một nửa nhờ cộng hưởng.
  assert.equal(useGameStore.getState().unlockSkill('sieu_tap_trung', GIA_ELITE, ['tap_trung_sieu_viet']), true);
  const st = useGameStore.getState();
  assert.equal(st.player.unlockedSkills.sieu_tap_trung, true);
  assert.equal(st.player.sp, 0);

  // Không cổ vật → cần đủ giá đầy đủ; tamper-down truyền nửa giá vẫn bị chặn.
  resetStore();
  useGameStore.setState((s) => ({
    player: { ...s.player, sp: GIA_ELITE_CONG_HUONG, unlockedSkills: { ...s.player.unlockedSkills, tap_trung_sieu_viet: true } },
    relics: [],
    relicEvolutions: {},
  }));
  assert.equal(useGameStore.getState().unlockSkill('sieu_tap_trung', GIA_ELITE_CONG_HUONG, ['tap_trung_sieu_viet']), false);
  assert.equal(useGameStore.getState().player.unlockedSkills.sieu_tap_trung ?? false, false);
});

test('Cộng Hưởng: tinhThe khởi tạo 0, schema đã bump có chủ ý, sống sót qua prestige', () => {
  assert.equal(useGameStore.getInitialState().tinhThe, 0);
  // Tripwire: mỗi lần bump schema PHẢI là hành động có chủ ý + ghi vào MIGRATION.md.
  // 3 → 4 (2026-08-12): thêm `cityArchive` — bảo tàng Thành Phố Pixel.
  assert.equal(GAME_STORE_SCHEMA_VERSION, 4);

  resetStore();
  useGameStore.setState((s) => ({
    tinhThe: 5,
    progress: { ...s.progress, totalEP: PRESTIGE_EP_REQUIREMENT },
  }));
  assert.equal(useGameStore.getState().triggerPrestige(), true);
  assert.equal(useGameStore.getState().tinhThe, 5);  // persist qua prestige
  assert.ok(useGameStore.getState().tinhThe <= TINH_THE_HARD_CAP);
});

// ═══════════════════════════════════════════════════════════════════════════════
// unlockSkill — cơ bản (lưới an toàn Giai đoạn A: SP là tài sản, không mất oan)
// (Chi phí thật của `sieu_tap_trung` = `GIA_ELITE`, đọc thẳng từ `SKILL_TREE` — đã xác lập
//  ở test "unlockSkill elite cộng hưởng" phía trên.)
// ═══════════════════════════════════════════════════════════════════════════════

test('unlockSkill: đủ SP + đủ điều kiện ⇒ mở khoá và trừ ĐÚNG chi phí', () => {
  resetStore();
  useGameStore.setState((s) => ({
    player: { ...s.player, sp: GIA_ELITE, unlockedSkills: { ...s.player.unlockedSkills, tap_trung_sieu_viet: true } },
    relics: [],
    relicEvolutions: {},
  }));
  assert.equal(useGameStore.getState().unlockSkill('sieu_tap_trung', GIA_ELITE, ['tap_trung_sieu_viet']), true);
  const s = useGameStore.getState();
  assert.equal(s.player.unlockedSkills.sieu_tap_trung, true);
  assert.equal(s.player.sp, 0); // trừ ĐÚNG giá, không hơn không kém
});

test('unlockSkill: thiếu SP ⇒ từ chối, SP và cây kỹ năng KHÔNG đổi', () => {
  resetStore();
  useGameStore.setState((s) => ({
    player: { ...s.player, sp: GIA_ELITE - 1, unlockedSkills: { ...s.player.unlockedSkills, tap_trung_sieu_viet: true } },
    relics: [],
    relicEvolutions: {},
  }));
  assert.equal(useGameStore.getState().unlockSkill('sieu_tap_trung', GIA_ELITE, ['tap_trung_sieu_viet']), false);
  const s = useGameStore.getState();
  assert.equal(s.player.unlockedSkills.sieu_tap_trung ?? false, false);
  assert.equal(s.player.sp, GIA_ELITE - 1); // tài sản không bị trừ oan khi giao dịch thất bại
});
