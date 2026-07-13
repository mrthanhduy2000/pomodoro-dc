/**
 * gameStore.completeFocusSession.test.js — CHARACTERIZATION TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 * Mục đích: KHÓA hành vi hiện tại của completeFocusSession() (đường-tiền, ~760
 * dòng, điểm nóng số 1 của dự án) làm "lưới an toàn" TRƯỚC khi refactor God File.
 * Đây là test ĐẶC TẢ HÀNH VI THẬT (golden master), KHÔNG phải test đúng/sai thiết
 * kế — mọi giá trị dưới đây được quan sát từ code đang chạy rồi chốt lại, không
 * suy đoán. Nếu một thay đổi tương lai làm rớt test này = hành vi runtime đã đổi,
 * phải rà soát có chủ ý.
 *
 * Chiến lược chống-lệch-theo-ngày (QUAN TRỌNG khi bảo trì):
 *   Tổng XP một phiên = base + missionBonusXP + streakMissionXP + buildingPerkXP.
 *   missionBonusXP phụ thuộc bộ nhiệm vụ hằng ngày (seed theo NGÀY) nên KHÔNG ổn
 *   định giữa các ngày chạy test. Vì vậy ta khóa phần "base" (toán thưởng lõi —
 *   độc-lập-ngày) bằng đẳng thức baseXP() = tổng − các bonus phụ thuộc-ngày; các
 *   bonus phụ thuộc-ngày được ĐỌC ĐỘNG từ pendingReward, không hardcode.
 *   Các giá trị khác (EP, tier, hệ số, tài nguyên, RP, refined) độc-lập-ngày nên
 *   được chốt trực tiếp.
 *
 * RNG: chỉ có 1 nguồn Math.random trong hàm (roll sự kiện tích cực). Stub bằng
 *   withRandom(): giá trị cao ⇒ không sự kiện; 0 ⇒ sự kiện đầu-đủ-điều-kiện kích
 *   hoạt (tất định). Mission được sinh bởi RNG-có-seed-riêng, KHÔNG bị stub này ảnh
 *   hưởng.
 *
 * KHÔNG sửa implementation. Bug phát hiện được ghi NOTE ở cuối file, không sửa.
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
  { EXP_PER_LEVEL, SP_PER_LEVEL },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/constants.js'),
]);

const initialState = useGameStore.getInitialState();

function resetStore() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(initialState, true);
}

const realRandom = Math.random;
/** Chạy fn với Math.random cố định (khôi phục kể cả khi throw). */
function withRandom(value, fn) {
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = realRandom;
  }
}
// random cao ⇒ Math.random() < chance luôn false ⇒ KHÔNG sự kiện tích cực nào kích hoạt
const NO_EVENT = 0.999999;

/** Phần XP lõi (độc-lập-ngày) = tổng − các bonus phụ thuộc-ngày. */
function baseXP(state, result) {
  const pr = state.ui.pendingReward;
  return result.xpEarned - pr.missionBonusXP - pr.streakMissionXP - pr.buildingPerkBonusXP;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1) Phần thưởng cơ bản một phiên 25 phút (không sự kiện) — khóa các trục chính
// ═══════════════════════════════════════════════════════════════════════════════
test('completeFocusSession: phiên 25 phút khóa base-XP/EP/tier/tài nguyên/tiến trình', () => {
  resetStore();
  const result = withRandom(NO_EVENT, () =>
    useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();
  const h0 = s.history[0];

  // Giá trị trả về
  assert.equal(result.epEarned, 25);
  assert.equal(typeof result.sessionId, 'number');

  // XP lõi (độc-lập-ngày)
  assert.equal(baseXP(s, result), 26);

  // Tiến trình
  assert.equal(s.progress.totalEP, 25);
  assert.equal(s.progress.sessionsCompleted, 1);
  assert.equal(s.progress.totalFocusMinutes, 25);
  assert.equal(s.progress.activeBook, 1);
  assert.equal(s.player.totalEXP, result.xpEarned); // fresh store: totalEXP == XP phiên này

  // Bản ghi lịch sử
  assert.equal(s.history.length, 1);
  assert.equal(h0.minutes, 25);
  assert.equal(h0.tier, 'Tiêu Chuẩn ×1.0');
  assert.equal(h0.multiplier, 1);
  assert.equal(h0.jackpot, false);
  assert.equal(h0.rpEarned, 50);
  assert.equal(h0.refinedEarned, 0);
  assert.deepEqual(h0.resources, { da_silex: 100, xuong: 75 });
  assert.equal(h0.status, 'completed');
  assert.equal(h0.completed, true);
  assert.equal(h0.cancelled, false);

  // Combo/streak khởi đầu
  assert.equal(s.combo.count, 1);
  assert.equal(s.streak.currentStreak, 1);

  // UI mở loot
  assert.equal(s.ui.lootModalOpen, true);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2) Nhiều loại phiên (độ dài khác nhau) — khóa base-XP/EP/tier/hệ số/tài nguyên
// ═══════════════════════════════════════════════════════════════════════════════
const LENGTH_CASES = [
  { min: 0,  base: 0,   ep: 0,  tier: 'Tiêu Chuẩn ×1.0',      mult: 1,   rp: 0,   refined: 0, resources: { da_silex: 0,   xuong: 0 },   blueprint: false },
  { min: 15, base: 16,  ep: 15, tier: 'Tiêu Chuẩn ×1.0',      mult: 1,   rp: 30,  refined: 0, resources: { da_silex: 60,  xuong: 45 },  blueprint: false },
  { min: 25, base: 26,  ep: 25, tier: 'Tiêu Chuẩn ×1.0',      mult: 1,   rp: 50,  refined: 0, resources: { da_silex: 100, xuong: 75 },  blueprint: false },
  { min: 45, base: 61,  ep: 50, tier: 'Tập Trung Sâu ×1.3',   mult: 1.3, rp: 90,  refined: 1, resources: { da_silex: 234, xuong: 176 }, blueprint: true },
  { min: 60, base: 127, ep: 72, tier: 'Phiên Chuyên Sâu ×2.0', mult: 2,  rp: 120, refined: 1, resources: { da_silex: 480, xuong: 360 }, blueprint: true },
];

for (const c of LENGTH_CASES) {
  test(`completeFocusSession: phiên ${c.min} phút — base=${c.base}, ep=${c.ep}, tier "${c.tier}"`, () => {
    resetStore();
    const result = withRandom(NO_EVENT, () =>
      useGameStore.getState().completeFocusSession(c.min));
    const s = useGameStore.getState();
    const h0 = s.history[0];

    assert.equal(baseXP(s, result), c.base);
    assert.equal(result.epEarned, c.ep);
    assert.equal(h0.tier, c.tier);
    assert.equal(h0.multiplier, c.mult);
    assert.equal(h0.rpEarned, c.rp);
    assert.equal(h0.refinedEarned, c.refined);
    assert.deepEqual(h0.resources, c.resources);
    // "blueprint session" = rớt refined hoặc ≥45 phút ⇒ totalBlueprints tăng
    assert.equal(s.historyStats.totalBlueprints, c.blueprint ? 1 : 0);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3) Nhất quán XP giữa 3 nơi báo cáo (result / history / pendingReward)
// ═══════════════════════════════════════════════════════════════════════════════
test('completeFocusSession: XP nhất quán giữa result, history[0] và pendingReward', () => {
  resetStore();
  const result = withRandom(NO_EVENT, () =>
    useGameStore.getState().completeFocusSession(45));
  const s = useGameStore.getState();
  assert.equal(result.xpEarned, s.history[0].xpEarned);
  assert.equal(result.xpEarned, s.ui.pendingReward.totalSessionXP);
  assert.equal(result.epEarned, s.history[0].epEarned);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4) RNG tất định: cùng đầu vào + cùng seed ⇒ cùng XP/EP
// ═══════════════════════════════════════════════════════════════════════════════
test('completeFocusSession: tất định với RNG cố định (chạy 2 lần cho kết quả giống hệt)', () => {
  resetStore();
  const a = withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  resetStore();
  const b = withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  assert.equal(a.xpEarned, b.xpEarned);
  assert.equal(a.epEarned, b.epEarned);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5) RNG: seed thấp kích hoạt sự kiện tích cực (e1_flint) + cộng bonus
// ═══════════════════════════════════════════════════════════════════════════════
test('completeFocusSession: Math.random=0 kích hoạt sự kiện tích cực đầu-đủ-điều-kiện', () => {
  resetStore();
  const result = withRandom(0, () =>
    useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();
  assert.equal(s.history[0].positiveEvent?.id, 'e1_flint');
  assert.equal(s.ui.pendingReward.positiveEventBonus, 3);
  assert.equal(s.ui.pendingReward.positiveEvent?.id, 'e1_flint');
  // Có sự kiện ⇒ XP cao hơn base thuần (bonus được cộng vào)
  assert.ok(result.xpEarned > 26);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6) Level-up: totalEXP = EXP_PER_LEVEL-1 ⇒ lên đúng 1 cấp, +SP_PER_LEVEL
// ═══════════════════════════════════════════════════════════════════════════════
test('completeFocusSession: vượt ngưỡng cấp ⇒ lên đúng 1 cấp và cộng SP_PER_LEVEL', () => {
  resetStore();
  useGameStore.setState((st) => ({ player: { ...st.player, totalEXP: EXP_PER_LEVEL - 1, level: 0 } }));
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();
  assert.equal(s.player.level, 1);
  assert.equal(s.player.sp, SP_PER_LEVEL);
  assert.equal(s.ui.levelUpQueue.length, 1);
  assert.deepEqual(s.ui.levelUpQueue[0], { levelsGained: 1, newLevel: 1, spGained: SP_PER_LEVEL });
  assert.equal(s.ui.pendingReward.levelsGained, 1);
  assert.equal(s.ui.pendingReward.spGained, SP_PER_LEVEL);
  assert.equal(s.ui.pendingReward.newLevel, 1);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7) Loot: phiên 45 phút rớt refined + cập nhật kho + historyStats
// ═══════════════════════════════════════════════════════════════════════════════
test('completeFocusSession: phiên 45 phút rớt 1 refined, gộp tài nguyên thô, mở loot', () => {
  resetStore();
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(45));
  const s = useGameStore.getState();

  // Refined rớt vào kho của kỷ nguyên hiện tại (book 1)
  assert.equal(s.resourcesRefined[1].t2, 1);
  assert.equal(s.resourcesRefined[1].t3, 0);
  // Tài nguyên thô được gộp vào túi book1
  assert.equal(s.resources.book1.da_silex, 234);
  assert.equal(s.resources.book1.xuong, 176);
  // Thống kê
  assert.equal(s.historyStats.totalBlueprints, 1);
  assert.equal(s.historyStats.bestSessionMinutes, 45);
  assert.equal(s.historyStats.totalJackpots, 0);
  // pendingReward mang payload loot
  assert.equal(s.ui.lootModalOpen, true);
  assert.equal(s.ui.pendingReward.tierLabel !== undefined || s.ui.pendingReward.tier !== undefined, true);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8) EP + hoàn gốc Overclock (staking) — nguyên tử trong cùng phiên
// ═══════════════════════════════════════════════════════════════════════════════
test('completeFocusSession: overclock trả gốc EP đã giam + reset staking về mặc định', () => {
  resetStore();
  useGameStore.setState((st) => ({
    staking: { ...st.staking, active: true, stakedEP: 100, rewardMultiplier: 2 },
  }));
  const result = withRandom(NO_EVENT, () =>
    useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();

  // EP phiên nhân đôi theo overclock (25 → 50)
  assert.equal(result.epEarned, 50);
  // totalEP = 0 (trước) + 50 (phiên) + 100 (hoàn gốc staking) = 150
  assert.equal(s.progress.totalEP, 150);
  assert.equal(s.history[0].multiplier, 2);
  // Staking reset về mặc định trong cùng commit
  assert.equal(s.staking.active, false);
  assert.equal(s.staking.stakedEP, 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9) Combo dồn qua 2 phiên liên tiếp (trong cửa sổ decay)
// ═══════════════════════════════════════════════════════════════════════════════
test('completeFocusSession: 2 phiên liên tiếp ⇒ combo 1→2, tiến trình cộng dồn', () => {
  resetStore();
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  assert.equal(useGameStore.getState().combo.count, 1);
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();
  assert.equal(s.combo.count, 2);
  assert.equal(s.progress.sessionsCompleted, 2);
  assert.equal(s.progress.totalFocusMinutes, 50);
  assert.equal(s.history.length, 2);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10) Edge: phiên 0 phút vẫn ghi lịch sử + mở loot; base=0
// ═══════════════════════════════════════════════════════════════════════════════
test('completeFocusSession: edge 0 phút — base=0, ep=0, vẫn ghi lịch sử + mở loot', () => {
  resetStore();
  const result = withRandom(NO_EVENT, () =>
    useGameStore.getState().completeFocusSession(0));
  const s = useGameStore.getState();
  assert.equal(baseXP(s, result), 0);
  assert.equal(result.epEarned, 0);
  assert.equal(s.progress.totalFocusMinutes, 0);
  assert.equal(s.progress.sessionsCompleted, 1);
  assert.equal(s.history.length, 1);
  assert.equal(s.history[0].minutes, 0);
  assert.equal(s.ui.lootModalOpen, true);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11) Category tracking — khóa lastCategoryId + consecutiveCount
// ═══════════════════════════════════════════════════════════════════════════════
test('completeFocusSession: ghi nhận danh mục ⇒ categoryTracking cập nhật', () => {
  resetStore();
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25, 'work'));
  const s = useGameStore.getState();
  assert.equal(s.categoryTracking.lastCategoryId, 'work');
  assert.equal(s.categoryTracking.consecutiveCount, 1);
  assert.equal(s.history[0].categoryId, 'work');
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTE (chưa khóa trong phiên này — CÓ CHỦ ĐÍCH, không phải bỏ sót):
 *
 * • Đường early-return PHẠT khi Khủng Hoảng Kỷ Nguyên (chế độ Đương Đầu) THẤT BẠI
 *   (gameStore.js:3808-3815) và khi Thử Thách Thăng Cấp THẤT BẠI (3984-4002):
 *   cả hai return null + áp phạt. Để dựng ĐÚNG trạng thái hợp lệ cần một
 *   `eraCrisis.challengeOption` đầy đủ (successRelic/sessions/minMinutes/
 *   windowHours/failureLoss) hoặc `rankChallenge` hợp lệ với deadline. Dựng tay
 *   các object này có rủi ro test một trạng thái KHÔNG khớp production (đã thấy:
 *   set thiếu field ⇒ crash trong updateEraCrisisChallenge). Cách tối thiểu đúng
 *   đắn là dùng chính action khởi tạo (`initiateRankChallenge`,
 *   `startEraCrisisChallenge`) làm builder trạng thái hợp lệ rồi mới ép thất bại —
 *   để dành cho một phiên bổ sung, KHÔNG bịa state ở đây.
 *
 * • Không phát hiện bug hành vi trong phạm vi đã khóa: mọi giá trị quan sát nhất
 *   quán và tất định (đã xác nhận qua 2 lần chạy độc lập). Không sửa gì.
 * ─────────────────────────────────────────────────────────────────────────────
 */
