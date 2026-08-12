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
