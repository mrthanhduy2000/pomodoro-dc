import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldImportVersion } from './syncService.js';

test('shouldImportVersion: "first action wins" — chỉ nhận bản có version lớn hơn số đã biết', () => {
  assert.equal(shouldImportVersion(5, 4), true);
  assert.equal(shouldImportVersion(5, 5), false, 'version bằng nhau (echo của chính mình) không nhận lại');
  assert.equal(shouldImportVersion(4, 5), false, 'version cũ hơn (máy khác thua) không được ghi đè bản đang thắng');
  assert.equal(shouldImportVersion(0, -1), true, 'máy chưa từng đồng bộ (known=-1) phải nhận bản đầu tiên');
});

test('shouldImportVersion: version thiếu/không hợp lệ → không nhận liều', () => {
  assert.equal(shouldImportVersion(undefined, 3), false);
  assert.equal(shouldImportVersion(null, 3), false);
  assert.equal(shouldImportVersion('5', 3), false, 'version phải là number, không tự ép kiểu chuỗi');
});
