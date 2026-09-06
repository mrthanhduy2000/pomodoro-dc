/**
 * gameStore.adr071.test.js — ADR-071 (2026-09-06) chạy THẬT qua store: đóng `TECH_DEBT #99` và luật
 * "save lưu id + số, CHỮ đọc từ bảng lúc nạp" mở rộng cho khủng hoảng kỷ.
 * ─────────────────────────────────────────────────
 *   1. Save cũ mang chữ khủng hoảng cũ ⇒ lúc nạp đọc lại chữ từ `ERA_CRISES` (cùng luật với di vật ADR-070).
 *   2. Bộ nhiệm vụ không còn loại `researchPoints` — RP đã thôi được cộng nên một nhiệm vụ "kiếm N RP"
 *      là một nhiệm vụ KHÔNG BAO GIỜ xong (save cũ còn giữ nó thì tiến độ rơi về 0 theo nhánh `default`).
 *   3. `calculateRewards` không còn trả ba đồng tiền ngủ lẫn «Rương Lớn» — không có gì cho ai cộng lại.
 * Phép "ba đồng tiền đứng yên từng byte sau một phiên" nằm ở `gameStore.completeFocusSession.test.js`;
 * "huỷ phiên không trừ tài nguyên, không tiêu lượt tha thứ" ở `gameStore.cancelFocusSession.test.js`.
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
  { MISSION_CATALOG, ERA_CRISES },
  { calculateRewards },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/constants.js'),
  import('../engine/gameMath.js'),
]);

const initialState = useGameStore.getInitialState();

function reset() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(initialState, true);
}

test('SAVE CŨ mang chữ khủng hoảng cũ ⇒ lúc nạp đọc lại từ ERA_CRISES; số tiến độ giữ nguyên', async () => {
  reset();
  const canon = ERA_CRISES[1];
  window.localStorage.setItem(GAME_STORE_STORAGE_KEY, JSON.stringify({
    version: GAME_STORE_SCHEMA_VERSION,
    state: {
      ...initialState,
      ui: undefined,
      eraCrisis: {
        ...initialState.eraCrisis,
        active: true, crisisId: canon.id, name: 'Tên chép cũ', icon: '❄', description: 'Mô tả chép cũ — tài nguyên',
        sacrificeOption: { ...canon.sacrificeOption, label: 'cũ', description: 'Hy sinh 40% tài nguyên (cũ)' },
        challengeOption: { ...canon.challengeOption, label: 'cũ', sessions: 7 },
        challengeSessionsRequired: 7, challengeSessionsDone: 3,
      },
    },
  }));
  await useGameStore.persist.rehydrate();
  const c = useGameStore.getState().eraCrisis;
  assert.equal(c.name, canon.name, 'tên vẫn là bản chép cũ');
  assert.equal(c.description, canon.description);
  assert.equal(c.challengeOption.label, canon.challengeOption.label);
  assert.equal(c.sacrificeOption.description, canon.sacrificeOption.description);
  assert.equal(c.challengeOption.sessions, 7, 'luật của thử thách ĐANG chạy không được đổi lúc nạp');
  assert.equal(c.challengeSessionsDone, 3);
  assert.equal(c.active, true);
});

test('bộ nhiệm vụ không còn loại researchPoints — RP thôi được cộng thì "kiếm N RP" là nhiệm vụ không bao giờ xong', () => {
  const rp = MISSION_CATALOG.filter((m) => m.type === 'researchPoints' || m.family === 'researchPoints' || /\bRP\b/.test(m.label ?? ''));
  assert.deepEqual(rp.map((m) => m.id), []);
  assert.ok(MISSION_CATALOG.length >= 10, `bộ nhiệm vụ còn ${MISSION_CATALOG.length} — phép đo chạy rỗng?`);
});

test('calculateRewards không còn trả tài nguyên · RP · tinh luyện · Rương Lớn — không có gì để cộng lại', () => {
  const r = calculateRewards(60, {}, 0, {}, {});
  for (const k of ['resources', 'rpEarned', 't2Drop', 'largeChest']) {
    assert.ok(!(k in r), `calculateRewards vẫn trả «${k}» — ba đồng tiền ngủ mọc lại`);
  }
  assert.ok(r.finalXP > 0 && r.finalEP > 0 && Number.isFinite(r.activeBook), 'trục sống XP/EP vẫn phải còn nguyên');
});
