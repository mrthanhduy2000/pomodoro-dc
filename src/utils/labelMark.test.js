import test from 'node:test';
import assert from 'node:assert/strict';

import { initialsFromLabel, getLabelMark } from './labelMark.js';

test('initialsFromLabel: lấy chữ cái đầu của tối đa 2 từ, viết hoa', () => {
  assert.equal(initialsFromLabel('Deep Focus'), 'DF');
  assert.equal(initialsFromLabel('Titan'), 'T');
  assert.equal(initialsFromLabel('  Chuỗi   Vàng  '), 'CV');
  assert.equal(initialsFromLabel(null), '');
  assert.equal(initialsFromLabel(undefined), '');
  assert.equal(initialsFromLabel(''), '');
});

test('getLabelMark: giữ đúng hành vi gốc — thiếu label thì XỬ LÝ CHUỖI fallback qua cùng thuật toán (không trả nguyên fallback)', () => {
  // Đây là hành vi gốc đã có ở 6/7 bản chép tay trước khi gộp — label=null với
  // fallback='NA' (2 ký tự, không khoảng trắng) trả về 'N' (chỉ ký tự đầu của fallback),
  // KHÔNG phải 'NA'. Giữ nguyên để không đổi hành vi hiện tại.
  assert.equal(getLabelMark(null, 'NA'), 'N');
  assert.equal(getLabelMark(undefined, 'TC'), 'T');
  assert.equal(getLabelMark(null, 'DG'), 'D');
});

test('getLabelMark: có label thật thì lấy initials của label, bỏ qua fallback', () => {
  assert.equal(getLabelMark('Deep Focus', 'NA'), 'DF');
  assert.equal(getLabelMark('Titan', 'NA'), 'T');
});

test('getLabelMark: label là chuỗi rỗng/toàn khoảng trắng (khác null/undefined) → initials rỗng → trả nguyên fallback (không qua lại thuật toán)', () => {
  assert.equal(getLabelMark('   ', 'NA'), 'NA');
  assert.equal(getLabelMark('', 'TC'), 'TC');
});
