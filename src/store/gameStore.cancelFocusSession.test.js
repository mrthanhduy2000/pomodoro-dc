/**
 * gameStore.cancelFocusSession.test.js — CHARACTERIZATION TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 * KHÓA hành vi thật của cancelFocusSession() (phạt/rollback khi hủy phiên). Đây là
 * "lưới an toàn" TRƯỚC khi refactor: cancel đụng tài sản thật (trừ tài nguyên,
 * tiêu than lượng tha thứ, mất EP giam khi overclock, reset streak-flag). Mọi giá
 * trị dưới đây quan sát từ code đang chạy rồi chốt, không suy đoán.
 *
 * Determinism: applyDisasterPenalty có thể dùng Math.random để chọn "thảm hoạ" →
 * stub bằng withRandom() cho tất định. Số liệu phạt độc-lập-ngày (không dính bộ
 * nhiệm vụ hằng ngày) nên chốt trực tiếp.
 *
 * KHÔNG sửa implementation.
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

const { default: useGameStore } = await import('./gameStore.js');
const initialState = useGameStore.getInitialState();

function resetStore() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(initialState, true);
}

const realRandom = Math.random;
function withRandom(value, fn) {
  Math.random = () => value;
  try { return fn(); } finally { Math.random = realRandom; }
}

/** Dựng state có tài nguyên để phạt + số than lượng tha thứ + timerSession. */
function setupCancellable(charges = 0) {
  resetStore();
  useGameStore.setState((s) => ({
    resources: { ...s.resources, book1: { da_silex: 1000, xuong: 1000 } },
    forgiveness: { chargesRemaining: charges, weekStartTimestamp: Date.now() },
    timerSession: { totalSeconds: 25 * 60, categoryId: null },
  }));
}
function history0() { return useGameStore.getState().history[0] ?? {}; }
const OPTS = { elapsedMinutes: 12, elapsedSeconds: 720, targetMinutes: 25 };

// ═══════════════════════════════════════════════════════════════════════════════
// 1) Hủy KHÔNG phạt (applyDisaster:false) — không mất tài nguyên, vẫn ghi phiên hủy
// ═══════════════════════════════════════════════════════════════════════════════
test('cancelFocusSession: non-strict (applyDisaster:false) không trừ tài nguyên, ghi phiên hủy', () => {
  setupCancellable(0);
  const before = { ...useGameStore.getState().resources.book1 };
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(0.5, { applyDisaster: false, ...OPTS }));
  const s = useGameStore.getState();
  const h = history0();

  // Tài nguyên KHÔNG đổi
  assert.deepEqual(s.resources.book1, before);
  // Bản ghi phiên hủy
  assert.equal(h.status, 'cancelled');
  assert.equal(h.tier, 'Phiên bị hủy');
  assert.equal(h.cancelled, true);
  assert.equal(h.completed, false);
  assert.equal(h.minutes, 12);
  assert.equal(h.xpEarned, 0);
  assert.equal(h.epEarned, 0);
  assert.equal(h.multiplier, 0);
  assert.equal(h.cancelProgressRatio, 0.5);
  assert.equal(h.cancelPenalty.waived, true);
  assert.equal(h.cancelPenalty.appliedPenaltyRate, 0);
  assert.deepEqual(h.cancelPenalty.deducted, {});
  // Thống kê + cờ
  assert.equal(s.historyStats.cancelledSessions, 1);
  assert.equal(s.historyStats.cancelledMinutes, 12);
  assert.equal(s.sessionMeta.lastSessionCancelled, true);
  assert.equal(s.ui.disasterModalOpen, false);
  assert.equal(s.staking.active, false);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2) Hủy CÓ phạt (strict, 0 than lượng) — trừ tài nguyên theo trần, mở modal thảm hoạ
// ═══════════════════════════════════════════════════════════════════════════════
test('cancelFocusSession: strict (0 than lượng) trừ tài nguyên theo trần và mở disaster modal', () => {
  setupCancellable(0);
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(0.5, { applyDisaster: true, ...OPTS }));
  const s = useGameStore.getState();
  const h = history0();

  // Bị trừ 12 mỗi loại (trần theo elapsedMinutes=12), 1000 → 988
  assert.equal(s.resources.book1.da_silex, 988);
  assert.equal(s.resources.book1.xuong, 988);
  assert.equal(h.cancelPenalty.waived, false);
  assert.equal(h.cancelPenalty.appliedPenaltyRate, 0.015);
  assert.deepEqual(h.cancelPenalty.deducted.book1, { da_silex: 12, xuong: 12 });
  // Phiên hủy vẫn xp/ep = 0 và mở modal thảm hoạ
  assert.equal(h.xpEarned, 0);
  assert.equal(h.epEarned, 0);
  assert.equal(s.ui.disasterModalOpen, true);
  assert.equal(s.historyStats.cancelledSessions, 1);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3) recordSession:false — KHÔNG ghi lịch sử nhưng vẫn reset staking + cờ hủy
// ═══════════════════════════════════════════════════════════════════════════════
test('cancelFocusSession: recordSession:false không thêm bản ghi lịch sử', () => {
  setupCancellable(0);
  const lenBefore = useGameStore.getState().history.length;
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(0.5, { applyDisaster: false, recordSession: false, ...OPTS }));
  const s = useGameStore.getState();
  assert.equal(s.history.length, lenBefore);
  assert.equal(s.staking.active, false);
  assert.equal(s.sessionMeta.lastSessionCancelled, true);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4) Rollback overclock: EP đã giam bị mất, staking reset về mặc định
// ═══════════════════════════════════════════════════════════════════════════════
test('cancelFocusSession: hủy khi overclock đang chạy ⇒ mất EP giam, staking reset', () => {
  resetStore();
  useGameStore.setState((st) => ({
    staking: { ...st.staking, active: true, stakedEP: 200 },
    timerSession: { totalSeconds: 1500 },
  }));
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(0.3, { applyDisaster: false, elapsedMinutes: 5, targetMinutes: 25 }));
  const s = useGameStore.getState();
  assert.equal(s.staking.active, false);
  assert.equal(s.staking.stakedEP, 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5) Kẹp progressRatio về [0,1] (cancelProgressRatio)
// ═══════════════════════════════════════════════════════════════════════════════
test('cancelFocusSession: progressRatio ngoài [0,1] bị kẹp lại', () => {
  setupCancellable(0);
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(5, { applyDisaster: false, ...OPTS }));
  assert.equal(history0().cancelProgressRatio, 1);

  setupCancellable(0);
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(-3, { applyDisaster: false, ...OPTS }));
  assert.equal(history0().cancelProgressRatio, 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6) Tất định: cùng đầu vào + cùng seed ⇒ cùng mức phạt
// ═══════════════════════════════════════════════════════════════════════════════
test('cancelFocusSession: phạt tất định với RNG cố định (2 lần giống hệt)', () => {
  setupCancellable(0);
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(0.5, { applyDisaster: true, ...OPTS }));
  const a = { ...useGameStore.getState().resources.book1 };
  setupCancellable(0);
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(0.5, { applyDisaster: true, ...OPTS }));
  const b = { ...useGameStore.getState().resources.book1 };
  assert.deepEqual(a, b);
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTE (chưa khóa trong phiên này — CÓ CHỦ ĐÍCH):
 * • Nhánh safeCancelPerk (getSafeCancelPerk, gameStore.js:4754): miễn phạt nếu có
 *   công trình đặc quyền phù hợp + lịch sử phù hợp trong ngày. Dựng đúng trạng thái
 *   cần building cụ thể → để dành, không bịa.
 * • Đường "than lượng tha thứ tự động miễn phạt" (chargeConsumed): quan sát cho
 *   thấy với progressRatio=0.5 + elapsed=12, penalty KHÔNG bị waive dù còn than
 *   lượng (đây là hành vi thật đã khóa gián tiếp ở test #2 qua waived=false); điều
 *   kiện kích hoạt waive-bằng-charge nằm trong applyDisasterPenalty và cần một
 *   phiên phân tích riêng để khóa đầy đủ ma trận rate×charge.
 * • Không phát hiện bug mới. Không sửa gì.
 * ─────────────────────────────────────────────────────────────────────────────
 */
