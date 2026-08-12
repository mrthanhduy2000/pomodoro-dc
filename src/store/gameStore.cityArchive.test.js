/**
 * gameStore.cityArchive.test.js — BẢO TÀNG THÀNH PHỐ (Phase 2 của SPEC "Thành Phố Pixel")
 * ─────────────────────────────────────────────────────────────────────────────
 * Hai nhóm mục tiêu, nhóm đầu QUAN TRỌNG HƠN:
 *
 *   (1) CHỐNG HỒI QUY CÂN BẰNG — chứng minh việc thêm bảo tàng KHÔNG đổi một chút nào hành vi
 *       cắt công trình khi lên kỷ, cũng không đổi XP/EP/tài nguyên. Bảo tàng chỉ để NGẮM.
 *   (2) Tính năng mới hoạt động: đúng dữ liệu được ghi lại, và **chỉ** đường lên kỷ thật mới ghi
 *       (hydrate / hoàn tác phiên tuyệt đối không được đụng vào bảo tàng).
 *
 * Đặt thành file riêng thay vì nhồi vào `gameStore.completeFocusSession.test.js` — file đó là
 * golden-master đặc tả hành vi CŨ, giữ nguyên mục đích của nó thì phiên sau đỡ nhầm. Cùng quy ước
 * tách file theo mối quan tâm như `gameStore.prestige.test.js` / `gameStore.cancelFocusSession.test.js`.
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
  { default: useGameStore, GAME_STORE_SCHEMA_VERSION },
  { BLUEPRINT_CATALOG, ERA_THRESHOLDS },
  { localDateStr },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/constants.js'),
  import('../engine/time.js'),
]);

const ERA_1 = BLUEPRINT_CATALOG[1].map((bp) => bp.id);
const ERA_2 = BLUEPRINT_CATALOG[2].map((bp) => bp.id);

const initialState = useGameStore.getInitialState();

function resetStore() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(initialState, true);
}

const realRandom = Math.random;
const NO_EVENT = 0.999999;
function withRandom(value, fn) {
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = realRandom;
  }
}

/**
 * Dựng state ngay sát mốc lên kỷ: đã xây đủ 5 công trình kỷ 1, còn 5 EP nữa là qua kỷ 2.
 * Một phiên 25 phút bất kỳ sẽ đẩy qua ngưỡng.
 */
function seedOnEdgeOfEraUp(overrides = {}) {
  resetStore();
  useGameStore.setState((prev) => ({
    progress: { ...prev.progress, totalEP: ERA_THRESHOLDS.ERA_1_END - 5, activeBook: 1 },
    buildings: [...ERA_1],
    buildingLevels: { [ERA_1[0]]: 2, [ERA_1[4]]: 3 },
    buildingHP: { [ERA_1[0]]: 3 },
    buildingLastUsed: { [ERA_1[0]]: '2026-08-01' },
    eraTracking: { sessionsInCurrentEra: 41, currentEraBook: 1, erasCompleted: 0 },
    ...overrides,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1) CHỐNG HỒI QUY CÂN BẰNG — bài quan trọng nhất cả file
// ═══════════════════════════════════════════════════════════════════════════════

test('lên kỷ: buildings/buildingHP/buildingLastUsed/buildingLevels bị cắt Y HỆT hành vi cũ', () => {
  seedOnEdgeOfEraUp();
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();

  assert.equal(s.progress.activeBook, 2, 'phải đã lên kỷ 2');
  assert.deepEqual(s.buildings, [], 'công trình kỷ cũ vẫn phải bị cắt sạch khỏi state đang chơi');
  assert.deepEqual(s.buildingLevels, {}, 'cấp công trình kỷ cũ vẫn phải bị cắt');
  assert.deepEqual(s.buildingHP, {}, 'HP công trình kỷ cũ vẫn phải bị cắt');
  assert.deepEqual(s.buildingLastUsed, {}, 'ngày dùng cuối của kỷ cũ vẫn phải bị cắt');
  assert.deepEqual(s.blueprints, [], 'bản vẽ kỷ cũ vẫn phải bị cắt');
});

test('lên kỷ: XP/EP/tiến trình KHÔNG đổi so với khi chưa có bảo tàng', () => {
  // Chạy 2 lần trên cùng đầu vào: một lần state có sẵn bảo tàng cũ, một lần không.
  // Mọi con số đường-tiền phải giống hệt nhau ⇒ bảo tàng không hề chạm vào cân bằng.
  seedOnEdgeOfEraUp();
  const plain = withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const plainState = useGameStore.getState();

  seedOnEdgeOfEraUp({
    cityArchive: { 9: { built: ['bp_gi_do'], levels: {}, sealedAt: '2020-01-01', epAtSeal: 1, sessionCount: 1 } },
  });
  const withArchive = withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const archiveState = useGameStore.getState();

  assert.equal(withArchive.xpEarned, plain.xpEarned);
  assert.equal(withArchive.epEarned, plain.epEarned);
  assert.equal(archiveState.progress.totalEP, plainState.progress.totalEP);
  assert.equal(archiveState.progress.activeBook, plainState.progress.activeBook);
  assert.equal(archiveState.player.level, plainState.player.level);
  assert.equal(archiveState.player.totalEXP, plainState.player.totalEXP);
  assert.deepEqual(archiveState.resources, plainState.resources);
  assert.equal(archiveState.forgiveness.chargesRemaining, plainState.forgiveness.chargesRemaining);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2) Tính năng chính — niêm phong đúng dữ liệu
// ═══════════════════════════════════════════════════════════════════════════════

test('lên kỷ: cityArchive[kỷ cũ] chứa đúng công trình vừa bị cắt, kèm cấp và số liệu niêm phong', () => {
  seedOnEdgeOfEraUp();
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();

  assert.deepEqual(Object.keys(s.cityArchive), ['1']);
  assert.deepEqual(s.cityArchive[1].built, ERA_1);
  assert.equal(s.cityArchive[1].levels[ERA_1[0]], 2, 'giữ đúng cấp công trình lúc niêm phong');
  assert.equal(s.cityArchive[1].levels[ERA_1[4]], 3);
  assert.equal(s.cityArchive[1].levels[ERA_1[1]], 1, 'công trình chưa nâng cấp → cấp 1');
  assert.equal(s.cityArchive[1].sealedAt, localDateStr());
  assert.equal(s.cityArchive[1].epAtSeal, s.progress.totalEP);
});

test('sessionCount được chụp TRƯỚC khi eraTracking bị reset (nếu không là mất vĩnh viễn)', () => {
  seedOnEdgeOfEraUp();
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();

  assert.equal(s.cityArchive[1].sessionCount, 41, 'phải là số phiên của kỷ VỪA ĐÓNG');
  assert.equal(s.eraTracking.sessionsInCurrentEra, 1, 'eraTracking đã reset — không còn nguồn nào khác');
  assert.equal(s.eraTracking.currentEraBook, 2);
});

test('nhảy 2 kỷ trong 1 phiên → cả 2 kỷ đều vào bảo tàng, đúng khoá', () => {
  resetStore();
  useGameStore.setState((prev) => ({
    progress: { ...prev.progress, totalEP: ERA_THRESHOLDS.ERA_2_END - 5, activeBook: 2 },
    buildings: [...ERA_1, ...ERA_2],          // còn sót công trình kỷ 1 lẫn kỷ 2
    buildingLevels: { [ERA_1[0]]: 3, [ERA_2[0]]: 2 },
    eraTracking: { sessionsInCurrentEra: 12, currentEraBook: 2, erasCompleted: 1 },
  }));
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();

  assert.equal(s.progress.activeBook, 3);
  assert.deepEqual(s.buildings, [], 'cả 2 kỷ đều bị cắt khỏi state đang chơi');
  assert.deepEqual(Object.keys(s.cityArchive).sort(), ['1', '2']);
  assert.deepEqual(s.cityArchive[1].built, ERA_1);
  assert.deepEqual(s.cityArchive[2].built, ERA_2);
  assert.equal(s.cityArchive[1].levels[ERA_1[0]], 3);
  assert.equal(s.cityArchive[2].levels[ERA_2[0]], 2);
});

test('hoàn thành phiên KHÔNG lên kỷ → cityArchive giữ nguyên tham chiếu (không ghi thừa)', () => {
  resetStore();
  useGameStore.setState((prev) => ({
    progress: { ...prev.progress, totalEP: 100, activeBook: 1 },
    buildings: [...ERA_1],
  }));
  const before = useGameStore.getState().cityArchive;
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const s = useGameStore.getState();

  assert.equal(s.progress.activeBook, 1, 'chưa lên kỷ');
  assert.equal(s.cityArchive, before, 'không lên kỷ mà bảo tàng vẫn bị tạo object mới');
  assert.deepEqual(s.buildings, ERA_1, 'công trình đang dùng không được đụng vào');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3) Chống ghi nhầm — 4 đường gọi prune còn lại TUYỆT ĐỐI không được niêm phong
// ═══════════════════════════════════════════════════════════════════════════════

test('hydrate (import dữ liệu) cắt công trình lạc kỷ nhưng KHÔNG niêm phong', () => {
  resetStore();
  const result = useGameStore.getState()._importGameData({
    progress: { ...initialState.progress, totalEP: 4000, activeBook: 3 },
    buildings: [...ERA_1],                     // công trình kỷ 1 trong khi đang ở kỷ 3
    buildingLevels: { [ERA_1[0]]: 2 },
  });
  const s = useGameStore.getState();

  assert.equal(result.ok, true);
  assert.deepEqual(s.buildings, [], 'hydrate vẫn phải cắt như cũ');
  assert.deepEqual(s.cityArchive, {}, 'hydrate TUYỆT ĐỐI không được ghi vào bảo tàng');
});

test('hoàn tác phiên (deleteSession) KHÔNG niêm phong gì', () => {
  seedOnEdgeOfEraUp();
  const result = withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const archiveAfterEraUp = useGameStore.getState().cityArchive;
  assert.deepEqual(Object.keys(archiveAfterEraUp), ['1'], 'tiền đề: đã niêm phong kỷ 1');

  useGameStore.getState().deleteSession(result.sessionId);
  const s = useGameStore.getState();

  assert.deepEqual(Object.keys(s.cityArchive), ['1'], 'hoàn tác không được thêm bản ghi mới');
  assert.deepEqual(s.cityArchive[1].built, ERA_1, 'hoàn tác không được làm hỏng bản ghi đã có');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4) Tương thích ngược + đường lưu trữ
// ═══════════════════════════════════════════════════════════════════════════════

test('save cũ không có cityArchive → hydrate ra {} , app chạy bình thường', () => {
  resetStore();
  const result = useGameStore.getState()._importGameData({
    progress: { ...initialState.progress, totalEP: 500, activeBook: 1 },
    buildings: [ERA_1[0]],
    // cố tình KHÔNG có khoá cityArchive — đúng hình dạng save trước 2026-08-12
  });
  const s = useGameStore.getState();

  assert.equal(result.ok, true);
  assert.deepEqual(s.cityArchive, {});
  assert.deepEqual(s.buildings, [ERA_1[0]], 'công trình hợp lệ vẫn còn nguyên');

  // và vẫn hoàn thành phiên bình thường sau đó
  assert.doesNotThrow(() => withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25)));
});

test('cityArchive hỏng từ cloud → được chuẩn hoá, không làm chết app', () => {
  resetStore();
  const result = useGameStore.getState()._importGameData({
    progress: { ...initialState.progress, totalEP: 4000, activeBook: 3 },
    cityArchive: {
      1: { built: ERA_1, levels: { [ERA_1[0]]: 2 }, sealedAt: '2026-01-01', epAtSeal: 900, sessionCount: 30 },
      2: 'rác',
      77: { built: ERA_2 },
    },
  });
  const s = useGameStore.getState();

  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(s.cityArchive), ['1'], 'entry hỏng và kỷ ngoài [1,15] bị loại');
  assert.deepEqual(s.cityArchive[1].built, ERA_1);
  assert.equal(s.cityArchive[1].sessionCount, 30);
});

test('cityArchive nằm trong cả 3 đường lưu: localStorage, file backup, và đồng bộ cloud', async () => {
  seedOnEdgeOfEraUp();
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));

  // (1) localStorage — qua partialize của zustand persist
  const stored = JSON.parse(window.localStorage.getItem('dc-pomodoro-v1'));
  assert.ok(stored.state.cityArchive, 'partialize quên cityArchive ⇒ bảo tàng không bao giờ được lưu');
  assert.deepEqual(stored.state.cityArchive[1].built, ERA_1);
  assert.equal(stored.version, GAME_STORE_SCHEMA_VERSION);
  assert.equal(GAME_STORE_SCHEMA_VERSION, 4);

  // (2)+(3) file backup và gói đồng bộ cloud dùng 2 danh sách trường VIẾT TAY RIÊNG, rất dễ quên.
  // Đọc thẳng mã nguồn để bắt lỗi "quên thêm 1 dòng" — đây đúng là loại lỗi đã xảy ra thật.
  const { readFile } = await import('node:fs/promises');
  const exportSource = await readFile(new URL('../components/ExportImport.jsx', import.meta.url), 'utf8');
  assert.match(exportSource, /cityArchive:\s*state\.cityArchive/, 'file backup JSON quên cityArchive');
  const syncSource = await readFile(new URL('../lib/syncService.js', import.meta.url), 'utf8');
  assert.match(syncSource, /cityArchive:\s*s\.cityArchive/, 'gói đồng bộ cloud quên cityArchive');
});

test('đi vòng export → import: bảo tàng còn nguyên', () => {
  seedOnEdgeOfEraUp();
  withRandom(NO_EVENT, () => useGameStore.getState().completeFocusSession(25));
  const sealed = useGameStore.getState().cityArchive;

  // mô phỏng đúng đường ExportImport.jsx: chụp state → JSON → nạp lại
  const backup = JSON.parse(JSON.stringify({
    progress: useGameStore.getState().progress,
    buildings: useGameStore.getState().buildings,
    cityArchive: sealed,
  }));
  resetStore();
  const result = useGameStore.getState()._importGameData(backup);

  assert.equal(result.ok, true);
  assert.deepEqual(useGameStore.getState().cityArchive, sealed);
});
