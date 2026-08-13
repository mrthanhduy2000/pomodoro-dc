/**
 * gameStore.restore.test.js — "TRÙNG TU DI SẢN" chạy THẬT qua `startCrafting` (ADR-012).
 * ─────────────────────────────────────────────────────────────────────────────
 * `engine/eraLegacyRestore.test.js` khoá tầng THUẦN (bản vẽ nào còn trùng tu được, ba cái chặn).
 * File này khoá thứ chỉ lộ ra khi có store thật: **khởi công được hay không, và tiêu đúng túi
 * nguyên liệu nào.**
 *
 * ⚠️ Bài học Phase 4H nằm ngay sau lưng file này: một hàm engine viết xong, có test, mà không ai
 * gọi thì vẫn "xanh". Cho nên bài test quan trọng nhất ở đây không phải bài kiểm luật — mà là bài
 * chứng minh `startCrafting` THẬT SỰ nhận một bản vẽ kỷ cũ.
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
  { BLUEPRINT_CATALOG, BUILDING_SPECS },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/constants.js'),
]);

const initialState = useGameStore.getInitialState();
const era5 = BLUEPRINT_CATALOG[5].map((bp) => bp.id);
const era7 = BLUEPRINT_CATALOG[7].map((bp) => bp.id);

/** Túi nguyên liệu kỷ 5 dư dả — mô phỏng "người-Đàm-ngày-xưa để lại". */
function bagFor(bpId) {
  const cost = BUILDING_SPECS[bpId]?.cost ?? {};
  return Object.fromEntries(Object.keys(cost).map((resId) => [resId, 9999]));
}

function setup({ archive5 = { built: [], levels: {}, sealedAt: '2026-05-01', epAtSeal: 1, sessionCount: 1 } } = {}) {
  window.localStorage.clear();
  useGameStore.setState(initialState, true);
  const s = useGameStore.getState();
  useGameStore.setState({
    progress: { ...s.progress, activeBook: 7 },
    craftingQueue: [],
    cityArchive: { 5: archive5 },
    resources: { ...s.resources, book5: bagFor(era5[0]), book7: bagFor(era7[0]) },
    resourcesRefined: { ...s.resourcesRefined, 5: { t2: 9999, t3: 9999 }, 7: { t2: 9999, t3: 9999 } },
    // ⚠️ CHỈ nghiên cứu bản vẽ KỶ HIỆN TẠI. Kỷ 5 cố ý để trống — đó chính là trạng thái thật sau
    // khi `pruneEraScopedBlueprintState` cắt danh sách đã-nghiên-cứu của kỷ cũ, và là tiền đề của
    // bài "KHÔNG cần đã-nghiên-cứu" bên dưới.
    research: { rp: 0, researched: [...era7] },
  });
}

test('KHỞI CÔNG ĐƯỢC một bản vẽ kỷ 5 khi đang ở kỷ 7 — đây là cả tính năng', () => {
  setup();

  const ok = useGameStore.getState().startCrafting(era5[0]);
  assert.equal(ok, true, 'startCrafting từ chối bản vẽ kỷ cũ ⇒ tính năng chưa hề được nối vào.');
  assert.ok(useGameStore.getState().craftingQueue.some((q) => q.bpId === era5[0]));
});

test('TIÊU ĐÚNG TÚI KỶ 5, không đụng một hạt nào của kỷ 7', () => {
  setup();
  const before7 = { ...useGameStore.getState().resources.book7 };
  const before5 = { ...useGameStore.getState().resources.book5 };

  useGameStore.getState().startCrafting(era5[0]);
  const after = useGameStore.getState().resources;

  assert.deepEqual(after.book7, before7, 'Trùng tu kỷ 5 mà lại trừ nguyên liệu kỷ 7.');
  const spent = Object.keys(BUILDING_SPECS[era5[0]].cost ?? {})
    .some((resId) => after.book5[resId] < before5[resId]);
  assert.ok(spent, 'Trùng tu phải TRẢ GIÁ — đây là thứ giữ cho nó hữu hạn.');
});

test('KHÔNG chiếm ô của kỷ hiện tại: đủ 2 công trình kỷ 7 rồi vẫn trùng tu được', () => {
  setup();
  assert.equal(useGameStore.getState().startCrafting(era7[0]), true);
  assert.equal(useGameStore.getState().startCrafting(era7[1]), true);
  // Ô của kỷ hiện tại đã đầy…
  assert.equal(useGameStore.getState().startCrafting(era7[2]), false);
  // …nhưng bảo tàng vẫn mở.
  assert.equal(useGameStore.getState().startCrafting(era5[0]), true,
    'Trùng tu bị chặn bởi ô của kỷ hiện tại ⇒ đúng cái bẫy Phase 4D đã gỡ.');
});

test('CHỈ MỘT công trường trong bảo tàng cùng lúc', () => {
  setup();
  assert.equal(useGameStore.getState().startCrafting(era5[0]), true);
  assert.equal(useGameStore.getState().startCrafting(era5[1]), false,
    'Không có trần riêng thì cả 70 bản vẽ kỷ cũ vào hàng đợi một lượt.');
});

test('KHÔNG trùng tu lại thứ đã đứng trong bảo tàng', () => {
  setup({ archive5: { built: [era5[0]], levels: { [era5[0]]: 2 }, sealedAt: '2026-05-01', epAtSeal: 1, sessionCount: 1 } });
  assert.equal(useGameStore.getState().startCrafting(era5[0]), false);
});

test('KHÔNG cần đã-nghiên-cứu — RP kỷ cũ không kiếm lại được, đòi nó là khoá ★ vĩnh viễn', () => {
  setup();
  const s = useGameStore.getState();
  assert.ok(!(s.research?.researched ?? []).includes(era5[0]),
    'Tiền đề của bài test: bản vẽ này CHƯA nghiên cứu (kỷ cũ đã bị cắt khỏi danh sách).');
  assert.equal(s.startCrafting(era5[0]), true);
});

test('CỔNG NGHIÊN CỨU CỦA KỶ HIỆN TẠI VẪN NGUYÊN — không bị nới lây', () => {
  setup();
  useGameStore.setState({ research: { rp: 0, researched: [] }, blueprints: [] });
  assert.equal(useGameStore.getState().startCrafting(era7[0]), false,
    'Bản vẽ kỷ hiện tại chưa nghiên cứu mà vẫn xây được ⇒ đã nới nhầm cả kỷ đang chơi.');
});

test('THIẾU NGUYÊN LIỆU KỶ CŨ thì không trùng tu được — cái giá là thật', () => {
  setup();
  useGameStore.setState({ resources: { ...useGameStore.getState().resources, book5: {} } });
  assert.equal(useGameStore.getState().startCrafting(era5[0]), false);
});
