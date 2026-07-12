import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fmtHours, fmtXPCompact, fmtCount, fmtVal, hexToRgba, fmtChartAxisValue,
  clampValue, formatPreciseDuration, resolveEntryCategory,
} from './statsFormatters.js';

test('fmtHours: dưới 60 phút hiện "Xp", trên 60 tách giờ+phút', () => {
  assert.equal(fmtHours(0), '0p');
  assert.equal(fmtHours(45), '45p');
  assert.equal(fmtHours(60), '1g');
  assert.equal(fmtHours(90), '1g 30p');
});

test('fmtXPCompact: dưới 1000 giữ nguyên, từ 1000 rút gọn "k"', () => {
  assert.equal(fmtXPCompact(0), '0');
  assert.equal(fmtXPCompact(950), '950');
  assert.equal(fmtXPCompact(1500), '1.5k');
});

test('fmtCount: định dạng số kiểu vi-VN', () => {
  assert.equal(fmtCount(1000), '1.000');
  assert.equal(fmtCount(undefined), '0');
});

test('fmtVal: chọn đơn vị theo key (minutes/xp/mặc định phiên)', () => {
  assert.equal(fmtVal(90, 'minutes'), '1g 30p');
  assert.equal(fmtVal(1500, 'xp'), '1.5k XP');
  assert.equal(fmtVal(3, 'sessions'), '3 phiên');
});

test('hexToRgba: đổi hex 3/6 ký tự sang rgba; hex hỏng → màu mặc định', () => {
  assert.equal(hexToRgba('#fff', 0.5), 'rgba(255, 255, 255, 0.5)');
  assert.equal(hexToRgba('#ff0000', 1), 'rgba(255, 0, 0, 1)');
  assert.equal(hexToRgba('không-hợp-lệ', 0.2), 'rgba(201, 100, 66, 0.2)');
  assert.equal(hexToRgba(null, 0.2), 'rgba(201, 100, 66, 0.2)');
});

test('fmtChartAxisValue: minutes đổi sang giờ khi ≥60, xp rút gọn "k"', () => {
  assert.equal(fmtChartAxisValue(45, 'minutes'), '45p');
  assert.equal(fmtChartAxisValue(90, 'minutes'), '1.5g');
  assert.equal(fmtChartAxisValue(120, 'minutes'), '2g');
  assert.equal(fmtChartAxisValue(1500, 'xp'), '1.5k');
  assert.equal(fmtChartAxisValue(42, 'sessions'), '42');
});

test('clampValue: kẹp trong khoảng min-max', () => {
  assert.equal(clampValue(5, 0, 10), 5);
  assert.equal(clampValue(-5, 0, 10), 0);
  assert.equal(clampValue(15, 0, 10), 10);
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
