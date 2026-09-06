/**
 * gameStore.restore.test.js — "TRÙNG TU DI SẢN" chạy THẬT qua `startProject` (ADR-012 → ADR-069).
 * ─────────────────────────────────────────────────────────────────────────────
 * `engine/eraLegacyRestore.test.js` khoá tầng THUẦN (bản vẽ nào còn trùng tu được, ba cái chặn).
 * File này khoá thứ chỉ lộ ra khi có store thật: **khởi công được hay không, và KHÔNG trả bằng
 * nguyên liệu.**
 *
 * ⚠️ ADR-069 (2026-09-06) đổi đồng tiền: cái giá của một công trình — kể cả trùng tu — chỉ còn là
 * PHIÊN và Ô HÀNG CHỜ. Hai bài cũ "TIÊU ĐÚNG TÚI KỶ 5" và "THIẾU NGUYÊN LIỆU thì không trùng tu
 * được" vì thế đã ĐẢO CHIỀU (túi rỗng vẫn trùng tu được, túi đầy không mất một hạt), và cổng
 * "đã nghiên cứu" của kỷ hiện tại cũng không còn. Bài học Phase 9B: khi một bản vá đúng làm đỏ một
 * bài test cũ, hỏi bài ấy xưa nay xanh nhờ cái gì — ở đây nó xanh nhờ chính cái cổng đã bị gỡ.
 *
 * ⚠️ Bài học Phase 4H nằm ngay sau lưng file này: một hàm engine viết xong, có test, mà không ai
 * gọi thì vẫn "xanh". Cho nên bài test quan trọng nhất ở đây không phải bài kiểm luật — mà là bài
 * chứng minh `startProject` THẬT SỰ nhận một bản vẽ kỷ cũ.
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

  const ok = useGameStore.getState().startProject(era5[0]);
  assert.equal(ok, true, 'startProject từ chối bản vẽ kỷ cũ ⇒ tính năng chưa hề được nối vào.');
  assert.ok(useGameStore.getState().craftingQueue.some((q) => q.bpId === era5[0]));
});

test('KHÔNG trừ một hạt nguyên liệu nào — ADR-069: cái giá là PHIÊN, không phải túi', () => {
  setup();
  const before = useGameStore.getState();
  const before7 = { ...before.resources.book7 };
  const before5 = { ...before.resources.book5 };
  const beforeRefined5 = { ...before.resourcesRefined[5] };

  assert.equal(useGameStore.getState().startProject(era5[0]), true);
  const after = useGameStore.getState();

  assert.deepEqual(after.resources.book5, before5, 'Trùng tu vẫn trừ nguyên liệu kỷ 5 ⇒ đồng tiền cũ chưa gỡ hết.');
  assert.deepEqual(after.resources.book7, before7, 'Trùng tu kỷ 5 mà lại trừ nguyên liệu kỷ 7.');
  assert.deepEqual(after.resourcesRefined[5], beforeRefined5, 'Trùng tu vẫn trừ tinh luyện ⇒ đồng tiền cũ chưa gỡ hết.');
  const item = after.craftingQueue.find((q) => q.bpId === era5[0]);
  assert.ok(item && item.sessionsRemaining > 0, 'Cái giá còn lại phải là PHIÊN — hàng chờ phải ghi số phiên > 0.');
});

test('KHÔNG chiếm ô của kỷ hiện tại: đủ 2 công trình kỷ 7 rồi vẫn trùng tu được', () => {
  setup();
  assert.equal(useGameStore.getState().startProject(era7[0]), true);
  assert.equal(useGameStore.getState().startProject(era7[1]), true);
  // Ô của kỷ hiện tại đã đầy…
  assert.equal(useGameStore.getState().startProject(era7[2]), false);
  // …nhưng bảo tàng vẫn mở.
  assert.equal(useGameStore.getState().startProject(era5[0]), true,
    'Trùng tu bị chặn bởi ô của kỷ hiện tại ⇒ đúng cái bẫy Phase 4D đã gỡ.');
});

test('CHỈ MỘT công trường trong bảo tàng cùng lúc', () => {
  setup();
  assert.equal(useGameStore.getState().startProject(era5[0]), true);
  assert.equal(useGameStore.getState().startProject(era5[1]), false,
    'Không có trần riêng thì cả 70 bản vẽ kỷ cũ vào hàng đợi một lượt.');
});

test('KHÔNG trùng tu lại thứ đã đứng trong bảo tàng', () => {
  setup({ archive5: { built: [era5[0]], levels: { [era5[0]]: 2 }, sealedAt: '2026-05-01', epAtSeal: 1, sessionCount: 1 } });
  assert.equal(useGameStore.getState().startProject(era5[0]), false);
});

test('KHÔNG cần đã-nghiên-cứu — RP kỷ cũ không kiếm lại được, đòi nó là khoá ★ vĩnh viễn', () => {
  setup();
  const s = useGameStore.getState();
  assert.ok(!(s.research?.researched ?? []).includes(era5[0]),
    'Tiền đề của bài test: bản vẽ này CHƯA nghiên cứu (kỷ cũ đã bị cắt khỏi danh sách).');
  assert.equal(s.startProject(era5[0]), true);
});

test('TÚI RỖNG · 0 RP · chưa nghiên cứu VẪN trùng tu được — ADR-069 đảo chiều hai bài cũ', () => {
  setup();
  useGameStore.setState({
    resources: { ...useGameStore.getState().resources, book5: {} },
    resourcesRefined: { ...useGameStore.getState().resourcesRefined, 5: { t2: 0, t3: 0 } },
    research: { rp: 0, researched: [] },
    blueprints: [],
  });
  // Kỷ cũ: túi rỗng hoàn toàn.
  assert.equal(useGameStore.getState().startProject(era5[0]), true,
    'Túi rỗng mà bị từ chối ⇒ cổng nguyên liệu cũ vẫn còn, trái ADR-069.');
  // Kỷ hiện tại: chưa nghiên cứu cũng khởi công được — cổng RP đã gỡ cùng lượt.
  assert.equal(useGameStore.getState().startProject(era7[0]), true,
    'Bản vẽ kỷ hiện tại chưa nghiên cứu mà bị chặn ⇒ cổng RP cũ vẫn còn, trái ADR-069.');
  assert.ok(useGameStore.getState().research.researched.includes(era7[0]),
    'startProject phải tự ghi "đã mở" để thành tích/bảo tàng thấy.');
});
