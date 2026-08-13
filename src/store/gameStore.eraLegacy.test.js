/**
 * gameStore.eraLegacy.test.js — "DI SẢN DANG DỞ" chạy THẬT qua `completeFocusSession` (ADR-011).
 * ─────────────────────────────────────────────────────────────────────────────
 * `eraLegacy.test.js` đã khoá tầng THUẦN (chia hàng đợi, chấm theo kỷ nào, đếm ô). File này khoá
 * thứ tầng thuần KHÔNG thể tự chứng minh: rằng khi lắp vào đường-tiền dài ~760 dòng của
 * `completeFocusSession`, ba cam kết của tính năng vẫn đúng —
 *
 *   1. công trình di sản xây xong **KHÔNG** vào `buildings` (⇒ không perk, 0 thay đổi cân bằng),
 *   2. nó **CÓ** vào `cityArchive` của kỷ sinh ra nó, mà không ghi đè mốc niêm phong gốc,
 *   3. hàng đợi của kỷ cũ **sống sót** qua đúng cái hàm sinh ra để cắt nó.
 *
 * ⚠️ Vì sao phải là test HÀNH VI chứ không phải test tầng thuần: cả ba cam kết trên nằm ở chỗ GHÉP
 * giữa `pruneEraScopedBlueprintState`, `advanceCraftingQueueWithPerks` và `mergeCityArchive` — ba
 * hàm đều đúng riêng lẻ mà vẫn có thể ghép sai thứ tự. Đúng cái bẫy "chấm theo kỷ TRƯỚC phiên" mà
 * `eraLegacy.test.js` mô tả chỉ lộ ra ở đây, vì chỉ ở đây mới có một phiên vừa xây xong vừa lên kỷ.
 *
 * Khuôn dựng store (memory storage + `getInitialState`) chép theo
 * `gameStore.completeFocusSession.test.js` — cùng một cách, để phiên sau chỉ phải học một lần.
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
  { BLUEPRINT_CATALOG, ERA_THRESHOLDS },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/constants.js'),
]);

const initialState = useGameStore.getInitialState();

const realRandom = Math.random;
function withRandom(value, fn) {
  Math.random = () => value;
  try { return fn(); } finally { Math.random = realRandom; }
}
const NO_EVENT = 0.999999;

const era5 = BLUEPRINT_CATALOG[5].map((bp) => bp.id);
const era7 = BLUEPRINT_CATALOG[7].map((bp) => bp.id);

/** Ảnh chụp bảo tàng của kỷ 5, giống hệt thứ `pruneEraScopedBlueprintState` ghi lúc niêm phong. */
const SEALED_ERA_5 = {
  built: [era5[0], era5[1]],
  levels: { [era5[0]]: 2, [era5[1]]: 1 },
  sealedAt: '2026-05-01',
  epAtSeal: 10_400,
  sessionCount: 88,
};

/**
 * Dựng một ván đang ở kỷ 7 với `totalEP` đặt sẵn, kèm hàng đợi tuỳ ý.
 * `craftingQueue` truyền vào nguyên shape thật của store: `{ bpId, sessionsRemaining, startedAt }`.
 */
function setup({ totalEP, craftingQueue }) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(initialState, true);
  useGameStore.setState({
    progress: { ...useGameStore.getState().progress, totalEP, activeBook: 7 },
    craftingQueue: craftingQueue.map((item) => ({ startedAt: 0, ...item })),
    cityArchive: { 5: { ...SEALED_ERA_5 } },
  });
}

test('DI SẢN xây xong: vào BẢO TÀNG của kỷ 5, KHÔNG vào `buildings` (0 thay đổi cân bằng)', () => {
  setup({
    totalEP: 15_000,                                    // giữa kỷ 7, phiên này không lên kỷ
    craftingQueue: [{ bpId: era5[2], sessionsRemaining: 1 }],
  });

  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();

  // 1) Cam kết cốt lõi: KHÔNG có hiệu lực chơi.
  assert.ok(!s.buildings.includes(era5[2]),
    'di sản kỷ 5 lọt vào `buildings` ⇒ nó nhận perk BUILDING_EFFECTS ⇒ cân bằng game đã đổi');
  assert.equal(s.buildingLevels?.[era5[2]], undefined,
    'di sản không được có cấp trong state đang chơi');

  // 2) Nhưng lịch sử thì có: bảo tàng kỷ 5 nay đủ 3 công trình.
  assert.deepEqual(s.cityArchive[5].built, [era5[0], era5[1], era5[2]]);
  assert.equal(s.cityArchive[5].levels[era5[2]], 1, 'công trình mới vào bảo tàng ở cấp 1');

  // 3) Ghi BỔ SUNG không được viết lại lịch sử niêm phong.
  assert.equal(s.cityArchive[5].sealedAt, SEALED_ERA_5.sealedAt);
  assert.equal(s.cityArchive[5].epAtSeal, SEALED_ERA_5.epAtSeal);
  assert.equal(s.cityArchive[5].sessionCount, SEALED_ERA_5.sessionCount);

  // 4) Xong thì rời hàng đợi như mọi công trình khác.
  assert.equal(s.craftingQueue.length, 0);
});

test('HÀNG ĐỢI KỶ CŨ SỐNG SÓT qua phiên — đúng cái hàm sinh ra để cắt nó', () => {
  setup({
    totalEP: 15_000,
    craftingQueue: [
      { bpId: era7[0], sessionsRemaining: 3 },
      { bpId: era5[2], sessionsRemaining: 4 },
    ],
  });

  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const q = useGameStore.getState().craftingQueue;

  assert.equal(q.length, 2, 'di sản kỷ 5 bị cắt mất — đây chính là lỗi Phase 4D sinh ra để chữa');
  assert.equal(q.find((i) => i.bpId === era5[2]).sessionsRemaining, 3,
    'di sản phải TIẾN theo phiên như mọi mục khác, không phải nằm đông cứng');
  assert.equal(q.find((i) => i.bpId === era7[0]).sessionsRemaining, 2);
});

test('THỨ TỰ HÀNG ĐỢI: mục kỷ hiện tại luôn đứng TRƯỚC di sản (đặc quyền `craft_haste_first`)', () => {
  // ⚠️ Đây KHÔNG phải chuyện thẩm mỹ. `advanceCraftingQueueWithPerks` cho đặc quyền
  // `craft_haste_first` tăng tốc đúng `index === 0`. Xếp di sản lên đầu thì một đặc quyền của kỷ
  // HIỆN TẠI bị chuyển sang thúc một công trình chỉ có giá trị lịch sử — cân bằng đổi thật, đúng
  // thứ tính năng này cam kết không đụng tới. Và không có gì đỏ lên nếu ai đó "sắp lại cho gọn".
  setup({
    totalEP: 15_000,
    craftingQueue: [
      { bpId: era5[2], sessionsRemaining: 5 },   // cố ý đặt di sản LÊN TRƯỚC ở đầu vào
      { bpId: era7[0], sessionsRemaining: 5 },
    ],
  });

  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const q = useGameStore.getState().craftingQueue;

  assert.equal(q[0].bpId, era7[0], 'mục của kỷ đang chơi phải được đẩy lên đầu hàng đợi');
  assert.equal(q[1].bpId, era5[2]);
});

test('PHIÊN VỪA XÂY XONG VỪA LÊN KỶ — công trình vừa xong KHÔNG được bốc hơi', () => {
  // ⚠️ BÀI NÀY CÓ **HAI** LƯỚI CHE, VÀ TÔI CHỈ BIẾT ĐIỀU ĐÓ VÌ ĐÃ THỬ NGƯỢC (2026-08-13).
  //
  // Chú thích bản đầu ở đây khẳng định: chấm theo kỷ TRƯỚC phiên thì công trình mất trắng. Thử
  // ngược (sửa `finalBook` → kỷ trước phiên) thì bài này **vẫn xanh**. Lý do: ở ca lên kỷ,
  // `pruneEraScopedBlueprintState` được gọi KÈM `sealContext`, nên chính lần NIÊM PHONG đã ghi
  // công trình vừa xong vào `cityArchive[7]` — nó tới bảo tàng bằng đường khác. Gỡ riêng đường di
  // sản: vẫn xanh. Gỡ riêng niêm phong: vẫn xanh. **Gỡ CẢ HAI thì mới đỏ.**
  //
  // ⇒ Bài này khoá KẾT QUẢ ("không mất dữ liệu"), không khoá CƠ CHẾ. Đó vẫn là thứ đáng khoá — kết
  // quả mới là thứ Đàm nhìn thấy — nhưng đừng đọc nó thành bằng chứng rằng `finalBook` là thứ cứu
  // dữ liệu. Ca mà tầng di sản là lưới DUY NHẤT nằm ở bài đầu file (xây xong ở phiên KHÔNG lên kỷ),
  // và bài đó đã thử ngược ra đỏ.
  //
  // Bài học chung: **một bài test xanh không cho biết có bao nhiêu thứ đang giữ nó xanh.** Chỉ có
  // thử ngược mới đếm được, và ở đây câu trả lời là hai chứ không phải một.
  const justBelowEra8 = ERA_THRESHOLDS.ERA_7_END - 10;   // 1 phiên 25 phút (25 EP) là vượt
  setup({
    totalEP: justBelowEra8,
    craftingQueue: [{ bpId: era7[1], sessionsRemaining: 1 }],
  });

  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();

  assert.equal(s.progress.activeBook, 8, 'tiền đề của bài test: phiên này PHẢI đẩy sang kỷ 8');
  assert.ok(!s.buildings.includes(era7[1]), 'kỷ 8 không được hưởng công trình kỷ 7 (luật cân bằng)');
  assert.ok(s.cityArchive[7]?.built?.includes(era7[1]),
    'công trình kỷ 7 vừa xây xong đã BIẾN MẤT — cả hai lưới (di sản + niêm phong) đều thủng');
});

test('KHÔNG KHỞI CÔNG MỚI được bản vẽ của kỷ cũ — cửa vẫn đóng', () => {
  // Cam kết chặn-trên của ADR-011: chỉ thứ ĐÃ bắt đầu mới được đi hết. Mất luật này thì "trọn vẹn
  // kỷ" biến thành danh sách việc vặt 15 kỷ × 5 công trình — đúng thứ Đàm gọi là chán.
  // ⚠️ Luật này KHÔNG do Phase 4D tạo ra — `startCrafting` đã chặn `isCurrentEraBlueprint` từ trước.
  // Ghi lại ở đây vì ADR-011 nay ĐỰA VÀO nó: chính nó là thứ giữ cho số di sản bị chặn trên và
  // giảm dần một chiều. Ai gỡ dòng chặn đó sẽ mở ra phương án (4) mà ADR-011 đã cân nhắc rồi loại.
  setup({ totalEP: 15_000, craftingQueue: [] });
  useGameStore.setState({ research: { researched: [era5[2]], inProgress: null } });

  assert.equal(useGameStore.getState().startCrafting(era5[2]), false);
  assert.equal(useGameStore.getState().craftingQueue.length, 0);
});
