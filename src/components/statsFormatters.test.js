import test from 'node:test';
import assert from 'node:assert/strict';

import { fmtCount, formatPreciseDuration, resolveEntryCategory } from './statsFormatters.js';

test('fmtCount: định dạng số kiểu vi-VN', () => {
  assert.equal(fmtCount(1000), '1.000');
  assert.equal(fmtCount(undefined), '0');
});

test('formatPreciseDuration: 0/âm → "0 giây"; ghép giờ/phút/giây', () => {
  assert.equal(formatPreciseDuration(0), '0 giây');
  assert.equal(formatPreciseDuration(-100), '0 giây');
  assert.equal(formatPreciseDuration(65_000), '1p 5gi');
  assert.equal(formatPreciseDuration(3_665_000), '1g 1p 5gi');
});

test('resolveEntryCategory: ưu tiên catMap, rồi categorySnapshot, cuối cùng __none__', () => {
  const catMap = { hoc: { id: 'hoc', label: 'Học', color: '#111', icon: '📘' } };
  assert.deepEqual(resolveEntryCategory({ categoryId: 'hoc' }, catMap), catMap.hoc);
  assert.deepEqual(
    resolveEntryCategory({ categoryId: 'cu', categorySnapshot: { label: 'Cũ', color: '#222', icon: '🗂️' } }, catMap),
    { id: 'cu', label: 'Cũ', color: '#222', icon: '🗂️' },
  );
  assert.deepEqual(resolveEntryCategory({}, catMap), { id: '__none__', label: 'Chưa gắn loại', color: '#475569', icon: '❓' });
});
