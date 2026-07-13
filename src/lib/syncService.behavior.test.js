/**
 * syncService.behavior.test.js — BEHAVIOR TESTS cho lớp đồng bộ đám mây
 * ─────────────────────────────────────────────────────────────────────────────
 * Mục đích: KHÓA hành vi thật của luồng push/pull compare-and-swap ("First Action
 * Wins") — chính đoạn code từng làm MẤT 1 phiên focus thật (2026-07-11) nhưng tới
 * nay chỉ có test cho predicate thuần shouldImportVersion. Đây là "lưới an toàn"
 * TRƯỚC khi refactor/sửa lớp sync.
 *
 * Cách cô lập (KHÔNG refactor, KHÔNG đổi API syncService):
 *  - Mock singleton `supabase` (thay .from/.channel/.removeChannel bằng fake ghi
 *    lại thao tác + trả kết quả theo hàng đợi). syncService giữ CÙNG tham chiếu
 *    object nên thấy mock.
 *  - Spy `_importGameData` của store để quan sát "máy thua nhận lại bản thắng"
 *    mà không phụ thuộc logic import thật (đó là việc của test gameStore).
 *  - Re-import syncService "tươi" mỗi test (query-string) để reset state module
 *    (initialized/cachedKnownVersion/debounceTimer).
 *
 * Test KHÓA CẢ hành vi rủi ro đã biết (nhánh else initSync đẩy local vô điều kiện
 * khi cloud không mới hơn — nợ kỹ thuật C1) như một ĐẶC TẢ HIỆN TRẠNG, không phải
 * chứng thực nó đúng. Xem NOTE cuối file.
 */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';

// ── Môi trường trình duyệt tối thiểu ─────────────────────────────────────────
function memStore() {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
  };
}
globalThis.window = {
  localStorage: memStore(),
  sessionStorage: memStore(),
  addEventListener: () => {},
};
// Trong trình duyệt `localStorage` === `window.localStorage` (cùng object). syncService
// đọc qua window.localStorage nhưng ghi qua `localStorage` trần ⇒ mock phải trỏ chung 1
// store để phản ánh đúng ngữ nghĩa trình duyệt.
globalThis.localStorage = globalThis.window.localStorage;
globalThis.document = { addEventListener: () => {}, visibilityState: 'visible' };
// Chặn setInterval(30s) của initSync giữ tiến trình test sống mãi.
const realSetInterval = globalThis.setInterval;
globalThis.setInterval = () => 0;

const { supabase } = await import('./supabase.js');
const { LAST_CLOUD_VERSION_KEY } = await import('./appIdentity.js');
const { default: useGameStore } = await import('../store/gameStore.js');

// ── Mock supabase client ─────────────────────────────────────────────────────
let queryLog = [];       // mỗi phần tử = mảng thao tác của 1 truy vấn
let resultQueue = [];     // {data, error} trả theo thứ tự await
let channelSubscribed = 0;

function makeBuilder() {
  const ops = [];
  const builder = {
    ops,
    upsert(payload) { ops.push(['upsert', payload]); return builder; },
    update(payload) { ops.push(['update', payload]); return builder; },
    select(cols) { ops.push(['select', cols]); return builder; },
    eq(col, val) { ops.push(['eq', col, val]); return builder; },
    single() { ops.push(['single']); return builder; },
    then(resolve, reject) {
      queryLog.push(ops);
      const res = resultQueue.length ? resultQueue.shift() : { data: null, error: null };
      return Promise.resolve(res).then(resolve, reject);
    },
  };
  return builder;
}
supabase.from = () => makeBuilder();
supabase.channel = () => ({ on() { return this; }, subscribe() { channelSubscribed += 1; return {}; } });
supabase.removeChannel = () => {};

// ── Spy _importGameData (quan sát "nhận lại bản thắng") ───────────────────────
let importCalls = [];
useGameStore.setState({
  _importGameData: (data) => { importCalls.push(data); return { ok: true }; },
});

// ── Tiện ích ─────────────────────────────────────────────────────────────────
let freshCounter = 0;
async function loadFreshSync() {
  return import(`./syncService.js?fresh=${freshCounter++}`);
}
function resetMocks(knownVersion) {
  queryLog = [];
  resultQueue = [];
  importCalls = [];
  channelSubscribed = 0;
  window.localStorage.clear();
  if (knownVersion != null) window.localStorage.setItem(LAST_CLOUD_VERSION_KEY, String(knownVersion));
}
function opsInclude(ops, name) { return ops.some((o) => o[0] === name); }
function findQuery(name) { return queryLog.find((ops) => opsInclude(ops, name)); }
function eqOf(ops, col) { const e = ops.find((o) => o[0] === 'eq' && o[1] === col); return e ? e[2] : undefined; }
function storedKnownVersion() { return window.localStorage.getItem(LAST_CLOUD_VERSION_KEY); }

// ═══════════════════════════════════════════════════════════════════════════════
// 1) PUSH lần đầu (chưa từng sync, known < 0) ⇒ UPSERT khởi tạo, nhận version 1
// ═══════════════════════════════════════════════════════════════════════════════
test('sync: push lần đầu (chưa có known-version) dùng UPSERT và lưu version trả về', async () => {
  resetMocks(null); // không có known-version ⇒ getKnownVersion() = -1
  resultQueue = [{ data: [{ version: 1 }], error: null }];
  const { pushNow } = await loadFreshSync();

  await pushNow();

  const q = findQuery('upsert');
  assert.ok(q, 'phải gọi UPSERT khi chưa từng sync');
  assert.equal(opsInclude(q, 'update'), false, 'không dùng UPDATE ở lần khởi tạo');
  assert.equal(storedKnownVersion(), '1');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2) PUSH thắng (known=5, UPDATE khớp version) ⇒ CAS đúng, cập nhật version mới
// ═══════════════════════════════════════════════════════════════════════════════
test('sync: push khi đã có version dùng UPDATE compare-and-swap .eq(version, known)', async () => {
  resetMocks(5);
  resultQueue = [{ data: [{ version: 6 }], error: null }];
  const { pushNow } = await loadFreshSync();

  await pushNow();

  const q = findQuery('update');
  assert.ok(q, 'phải dùng UPDATE khi đã có known-version');
  assert.equal(eqOf(q, 'id'), 'singleton');
  assert.equal(eqOf(q, 'version'), 5, 'CAS phải khóa đúng version đang giữ');
  assert.equal(storedKnownVersion(), '6', 'thắng ⇒ nhận version mới do server cấp');
  assert.equal(importCalls.length, 0, 'thắng thì không import');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3) PUSH thua (UPDATE trả 0 dòng) ⇒ KHÔNG ép ghi đè, tự PULL nhận lại bản thắng
// ═══════════════════════════════════════════════════════════════════════════════
test('sync: push bị từ chối (0 dòng) ⇒ máy THUA re-pull và import bản thắng, không ép ghi đè', async () => {
  resetMocks(5);
  const WINNER = { player: { level: 99 }, _version: 'dc-pomodoro-v1' };
  resultQueue = [
    { data: [], error: null },                          // UPDATE: 0 dòng khớp ⇒ thua
    { data: { data: WINNER, version: 9 }, error: null }, // PULL: bản thắng version 9
  ];
  const { pushNow } = await loadFreshSync();

  await pushNow();

  assert.ok(findQuery('update'), 'có thử UPDATE trước');
  assert.equal(importCalls.length, 1, 'thua ⇒ phải import lại đúng 1 lần');
  assert.deepEqual(importCalls[0], WINNER, 'import CHÍNH bản của máy thắng');
  assert.equal(storedKnownVersion(), '9', 'known-version nhảy tới version thắng');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4) Lỗi Supabase khi push ⇒ nuốt lỗi (không throw), không đổi known-version
// ═══════════════════════════════════════════════════════════════════════════════
test('sync: lỗi Supabase khi push được nuốt (không throw), giữ nguyên known-version', async () => {
  resetMocks(5);
  resultQueue = [{ data: null, error: { message: 'boom' } }];
  const { pushNow } = await loadFreshSync();

  await assert.doesNotReject(pushNow());
  assert.equal(storedKnownVersion(), '5', 'lỗi ⇒ không cập nhật version');
  assert.equal(importCalls.length, 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5) initSync: cloud MỚI hơn ⇒ import bản cloud + đăng ký realtime
// ═══════════════════════════════════════════════════════════════════════════════
test('sync: initSync khi cloud mới hơn ⇒ import bản cloud và subscribe realtime', async () => {
  resetMocks(5);
  const CLOUD = { player: { level: 42 }, _version: 'dc-pomodoro-v1' };
  resultQueue = [{ data: { data: CLOUD, version: 9 }, error: null }];
  const { initSync } = await loadFreshSync();

  await initSync();

  assert.equal(importCalls.length, 1);
  assert.deepEqual(importCalls[0], CLOUD);
  assert.equal(storedKnownVersion(), '9');
  assert.equal(channelSubscribed, 1, 'phải đăng ký realtime sau khi init');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6) initSync: cloud RỖNG ⇒ đẩy local lên khởi tạo
// ═══════════════════════════════════════════════════════════════════════════════
test('sync: initSync khi cloud rỗng ⇒ đẩy local lên (không import)', async () => {
  resetMocks(null);
  resultQueue = [
    { data: { data: {}, version: 0 }, error: null }, // cloud rỗng (data = {})
    { data: [{ version: 1 }], error: null },          // upsert khởi tạo
  ];
  const { initSync } = await loadFreshSync();

  await initSync();

  assert.equal(importCalls.length, 0, 'cloud rỗng ⇒ không import');
  assert.ok(findQuery('upsert'), 'phải đẩy local lên (upsert vì chưa có known-version)');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7) initSync: cloud KHÔNG mới hơn ⇒ đẩy local vô điều kiện (KHÓA hành vi C1 hiện tại)
// ═══════════════════════════════════════════════════════════════════════════════
test('sync: initSync khi cloud KHÔNG mới hơn ⇒ đẩy local (đặc tả hiện trạng, nợ C1)', async () => {
  resetMocks(5);
  resultQueue = [
    { data: { data: { player: {} }, version: 3 }, error: null }, // cloud CŨ hơn known=5
    { data: [{ version: 6 }], error: null },                      // update đẩy local
  ];
  const { initSync } = await loadFreshSync();

  await initSync();

  assert.equal(importCalls.length, 0, 'không import bản cũ hơn');
  const q = findQuery('update');
  assert.ok(q, 'nhánh else đẩy local lên bằng UPDATE');
  assert.equal(eqOf(q, 'version'), 5);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8) shouldImportVersion — bổ sung biên (predicate thuần quyết định thắng/thua)
// ═══════════════════════════════════════════════════════════════════════════════
test('sync: shouldImportVersion chỉ import khi version đến LỚN HƠN version đang giữ', async () => {
  const { shouldImportVersion } = await loadFreshSync();
  assert.equal(shouldImportVersion(9, 5), true);   // mới hơn ⇒ import
  assert.equal(shouldImportVersion(5, 5), false);  // bằng ⇒ không
  assert.equal(shouldImportVersion(3, 5), false);  // cũ hơn ⇒ không
  assert.equal(shouldImportVersion(1, -1), true);  // máy mới (known=-1) ⇒ nhận
  assert.equal(shouldImportVersion(undefined, 5), false); // không phải số ⇒ không
  assert.equal(shouldImportVersion(NaN, 5), false);
});

// Dọn dẹp sau toàn bộ test: khôi phục setInterval và unref handle nền do client
// Supabase thật tạo (một MessagePort) — nếu không, tiến trình test file này không
// thoát sạch và làm treo `npm test`. Mỗi file test chạy tiến trình riêng nên việc
// unref ở đây không ảnh hưởng file khác.
after(() => {
  globalThis.setInterval = realSetInterval;
  for (const h of (globalThis.process?._getActiveHandles?.() ?? [])) {
    if (typeof h.unref === 'function') h.unref();
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTE (đặc tả hiện trạng, KHÔNG sửa trong phiên này):
 * • Test #7 khóa hành vi RỦI RO đã biết (nợ C1): khi cloud không mới hơn,
 *   initSync đẩy local lên VÔ ĐIỀU KIỆN (syncService.js:216-218). Nếu 2 key
 *   localStorage (dữ liệu game vs last-cloud-version) lệch, đây là đường để state
 *   rỗng/cũ ghi đè cloud thật. Ta CHỦ ĐÍCH khóa hiện trạng để mọi thay đổi tương
 *   lai (bản vá C1) phải cập nhật test này một cách có ý thức — không phải để
 *   khẳng định hành vi này đúng.
 * • Không phát hiện bug mới ngoài các nợ đã ghi trong TECH_DEBT/audit. Không sửa gì.
 * ─────────────────────────────────────────────────────────────────────────────
 */
