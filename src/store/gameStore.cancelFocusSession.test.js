/**
 * gameStore.cancelFocusSession.test.js — CHARACTERIZATION TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 * KHÓA hành vi thật của cancelFocusSession(). ADR-071 (đóng #99, 2026-09-06): huỷ phiên KHÔNG còn
 * trừ tài nguyên, KHÔNG còn khoá `forgiveness` trong save (ADR-076), KHÔNG còn ghi chi tiết phạt —
 * ba đồng tiền ngủ đã rời khỏi trò chơi (ADR-069). Còn lại: ghi phiên huỷ vào lịch sử, mất EP giam
 * khi overclock, reset cờ huỷ. `withRandom` giữ lại để chứng minh kết quả KHÔNG còn phụ thuộc RNG.
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

/** State with resources (to prove they are NOT deducted) + a timerSession. */
function setupCancellable() {
  resetStore();
  useGameStore.setState((s) => ({
    resources: { ...s.resources, book1: { da_silex: 1000, xuong: 1000 } },
    timerSession: { totalSeconds: 25 * 60, categoryId: null },
  }));
}
function history0() { return useGameStore.getState().history[0] ?? {}; }
const OPTS = { elapsedMinutes: 12, elapsedSeconds: 720, targetMinutes: 25 };

// ═════════════════════════════════════════════════
// 1) Huỷ phiên: KHÔNG trừ tài nguyên, KHÔNG chi tiết phạt, KHÔNG tiêu lượt tha thứ — vẫn ghi phiên huỷ
// ═════════════════════════════════════════════════
test('cancelFocusSession: no resource deduction, cancelPenalty = null, no forgiveness key at all (ADR-076), cancelled entry recorded', () => {
  setupCancellable();
  const before = { ...useGameStore.getState().resources.book1 };
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(0.5, { ...OPTS }));
  const s = useGameStore.getState();
  const h = history0();

  assert.deepEqual(s.resources.book1, before, 'huỷ phiên lại trừ tài nguyên');
  assert.equal('forgiveness' in s, false, 'the dead forgiveness counter must not come back into the save');
  assert.equal(h.status, 'cancelled');
  assert.equal(h.tier, 'Phiên bị hủy');
  assert.equal(h.cancelled, true);
  assert.equal(h.completed, false);
  assert.equal(h.minutes, 12);
  assert.equal(h.xpEarned, 0);
  assert.equal(h.epEarned, 0);
  assert.equal(h.multiplier, 0);
  assert.equal(h.cancelProgressRatio, 0.5);
  assert.equal(h.cancelPenalty, null, 'không còn gì để phạt thì không có chi tiết phạt');
  assert.equal(h.rpEarned, undefined);
  assert.equal(h.refinedEarned, undefined);
  assert.equal(h.resources, undefined);
  assert.equal(s.historyStats.cancelledSessions, 1);
  assert.equal(s.historyStats.cancelledMinutes, 12);
  assert.equal(s.sessionMeta.lastSessionCancelled, true);
  assert.equal(s.staking.active, false);
  assert.equal(s.ui.disasterModalOpen, undefined, 'ADR-069: cờ hộp thoại "mất N% tài nguyên" đã gỡ hẳn khỏi store');
});

// ═════════════════════════════════════════════════
// 2) Tuỳ chọn `applyDisaster` đời cũ bị BỎ QUA — truyền true hay false, RNG nào cũng cùng một kết quả
// ═════════════════════════════════════════════════
test('cancelFocusSession: applyDisaster (đời cũ) không còn tác dụng — kết quả y hệt', () => {
  setupCancellable();
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(0.5, { applyDisaster: true, ...OPTS }));
  const a = useGameStore.getState();
  const ha = { ...history0(), id: 0, timestamp: 0, cancelledAt: 0, finishedAt: 0 };
  setupCancellable();
  withRandom(0.1, () => useGameStore.getState().cancelFocusSession(0.5, { applyDisaster: false, ...OPTS }));
  const b = useGameStore.getState();
  const hb = { ...history0(), id: 0, timestamp: 0, cancelledAt: 0, finishedAt: 0 };
  assert.deepEqual(a.resources.book1, b.resources.book1);
  assert.deepEqual(ha, hb, 'hai đường huỷ phải cho cùng một bản ghi (trừ mốc thời gian)');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3) recordSession:false — KHÔNG ghi lịch sử nhưng vẫn reset staking + cờ hủy
// ═══════════════════════════════════════════════════════════════════════════════
test('cancelFocusSession: recordSession:false không thêm bản ghi lịch sử', () => {
  setupCancellable();
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
  setupCancellable();
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(5, { applyDisaster: false, ...OPTS }));
  assert.equal(history0().cancelProgressRatio, 1);

  setupCancellable();
  withRandom(0.5, () => useGameStore.getState().cancelFocusSession(-3, { applyDisaster: false, ...OPTS }));
  assert.equal(history0().cancelProgressRatio, 0);
});
