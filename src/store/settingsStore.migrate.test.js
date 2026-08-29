/**
 * settingsStore.migrate.test.js — nâng cấp bản lưu cũ trong localStorage.
 *
 * ⚠️ VÌ SAO ĐÁNG CÓ RIÊNG MỘT FILE TEST: `migrate` là đoạn code chỉ chạy ĐÚNG MỘT LẦN trên máy của
 * Đàm, đúng lần đầu anh mở bản mới — và nếu nó sai thì không có gì báo lỗi cả, chỉ là một cài đặt
 * âm thầm nhảy về giá trị khác. Chạy thử ở máy dev cũng KHÔNG bắt được, vì máy dev thường có
 * localStorage trắng (đi thẳng vào giá trị mặc định, không đi qua `migrate`).
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
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
};

const { SETTINGS_STORAGE_KEY } = await import('../lib/appIdentity.js');
const { default: useSettingsStore } = await import('./settingsStore.js');

/** Nạp lại store từ một bản lưu giả rồi đọc state ra — đúng đường mà `persist` chạy thật. */
function rehydrateFrom(persisted) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(persisted));
  useSettingsStore.persist.rehydrate();
  return useSettingsStore.getState();
}

test('bản lưu CŨ (chưa từng biết tới lớp nền thành phố) ⇒ lớp nền BẬT', () => {
  // ⚠️ Đây là cái bẫy thật của bước 7 → 8: bản lưu cũ không có trường `cityHomeBackdrop`, nên nó
  // về là `undefined`. Viết `=== true` (phản xạ tự nhiên, và đúng cho `cityPerfHud` ngay bên cạnh
  // vì cái đó mặc định TẮT) sẽ làm tính năng mới TẮT SẴN với đúng những người đã dùng app từ
  // trước — tức là với Đàm. Người dùng mới thì thấy, còn chủ dự án thì không.
  const state = rehydrateFrom({ version: 7, state: { uiTheme: 'light' } });
  assert.equal(state.cityHomeBackdrop, true);
});

test('Đàm tự tắt lớp nền ⇒ nâng cấp phiên bản KHÔNG được bật lại', () => {
  const state = rehydrateFrom({ version: 7, state: { cityHomeBackdrop: false } });
  assert.equal(state.cityHomeBackdrop, false, 'lựa chọn tắt của người dùng bị nâng cấp ghi đè');
});

test('giá trị rác trong bản lưu không lọt được vào quyết định dựng WebGL', () => {
  // `cityRenderMode` quyết định có tạo WebGL context hay không. Một chuỗi lạ (bản cũ, hoặc ai đó
  // sửa tay localStorage) phải bị chuẩn hoá NGAY TẠI CỬA, không được đi tiếp vào trong.
  const state = rehydrateFrom({ version: 7, state: { cityRenderMode: 'siêu-3d', cityPerfHud: 'có' } });
  assert.ok(['auto', '2d', '3d'].includes(state.cityRenderMode), `ra chế độ lạ: ${state.cityRenderMode}`);
  assert.equal(state.cityPerfHud, false, 'chuỗi bất kỳ không được coi là bật');
});

/**
 * ─── ÉP CHUYỂN SKIN MỘT LẦN (8 → 9) ──────────────────────────────────────────
 * Ba bài ở `uiSkins.test.js` canh HÀM THUẦN. Ba bài dưới đây canh DÂY NỐI: hàm ấy có thật sự
 * được `migrate` gọi không, và bản lưu đi ra có mang cờ không. Hàm đúng mà dây đứt thì triệu
 * chứng y hệt lúc chưa làm gì cả — đúng bài học "một bài test xanh chỉ chứng minh thứ nó chạm tới".
 */

test('bản lưu mang mặc định CŨ ⇒ lần mở đầu tiên nhảy sang mặc định MỚI', async () => {
  const { DEFAULT_UI_SKIN, SKIN_MIGRATION_FLAG } = await import('./uiSkins.js');
  // Bản lưu thật của Đàm: `editorial` nằm đó vì hồi ấy nó là mặc định, không phải vì anh chọn.
  const state = rehydrateFrom({ version: 8, state: { uiSkin: 'editorial' } });
  assert.equal(state.uiSkin, DEFAULT_UI_SKIN,
    'bảy bước làm lại giao diện vẫn không tới được máy đã dùng app từ trước');
  assert.equal(state[SKIN_MIGRATION_FLAG], true, 'không bật cờ ⇒ lần nâng cấp sau sẽ ép lại');
});

test('đã ép rồi ⇒ nâng cấp phiên bản KHÔNG được ghi đè lựa chọn', async () => {
  const { SKIN_MIGRATION_FLAG } = await import('./uiSkins.js');
  // Cùng khuôn với bài `cityHomeBackdrop` ở trên: nâng cấp không bao giờ được đè lên một lựa chọn
  // mà người dùng đã cố ý đưa ra.
  const state = rehydrateFrom({ version: 8, state: { uiSkin: 'swiss', [SKIN_MIGRATION_FLAG]: true } });
  assert.equal(state.uiSkin, 'swiss', 'lựa chọn có ý của Đàm bị phép ép chuyển nuốt mất');
});

test('máy MỚI (chưa có bản lưu nào) đã mang sẵn cờ', async () => {
  const { SKIN_MIGRATION_FLAG, DEFAULT_UI_SKIN } = await import('./uiSkins.js');
  // Máy mới đi thẳng vào state mặc định, KHÔNG qua `migrate`. Thiếu cờ ở đó thì lần bump version
  // kế tiếp sẽ chạy phép ép trên một máy chưa từng cần ép — và nếu lúc ấy Đàm đã đổi skin trên
  // máy mới đó, lựa chọn của anh bay mất.
  //
  // ⚠️ HỎI `getInitialState()`, KHÔNG hỏi `getState()` sau khi xoá localStorage. Bản đầu của bài
  // này làm cách sau và ĐỎ trên mã hoàn toàn đúng: `persist.rehydrate()` không có gì để đọc thì
  // nó KHÔNG đặt lại gì cả, nên state vẫn mang `uiSkin: 'swiss'` mà bài ngay trên vừa nạp vào.
  // Phép đo hỏng, không phải mã hỏng — và cách "sửa" sai là nới assert cho hết đỏ.
  const state = useSettingsStore.getInitialState();
  assert.equal(state[SKIN_MIGRATION_FLAG], true, 'state mặc định thiếu cờ ⇒ máy mới sẽ bị ép oan sau này');
  assert.equal(state.uiSkin, DEFAULT_UI_SKIN);
});
