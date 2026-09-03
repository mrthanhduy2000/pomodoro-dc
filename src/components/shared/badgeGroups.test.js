/**
 * badgeGroups.test.js — canh phép chia nhóm huy hiệu chưa đạt.
 * Chạy: node --import ./scripts/register-esm-loader.mjs --test src/components/shared/badgeGroups.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { splitLockedBadges } from './badgeGroups.js';

test('PHÂN HOẠCH ĐÚNG NGHĨA — không mục nào rơi mất, không mục nào vào hai nhóm', () => {
  const vao = [
    { id: 'a', tienDo: { tiLe: 0.5 } },
    { id: 'b', tienDo: { tiLe: 0 } },
    { id: 'c' },                          // không đo được tiến độ
    { id: 'd', tienDo: {} },              // có ô tiến độ nhưng rỗng
    { id: 'e', tienDo: { tiLe: 0.01 } },
  ];
  const { dangTien, chuaCham } = splitLockedBadges(vao);
  assert.equal(dangTien.length + chuaCham.length, vao.length);
  const ids = [...dangTien, ...chuaCham].map((e) => e.id).sort();
  assert.deepEqual(ids, ['a', 'b', 'c', 'd', 'e']);
});

test('KHÔNG ĐO ĐƯỢC TIẾN ĐỘ ⇒ "CHƯA CHẠM", không phải "đang tiến tới"', () => {
  // Nói "đang tiến tới" về một thứ ta không biết đã tiến tới đâu là một lời hứa không kiểm được.
  const { dangTien, chuaCham } = splitLockedBadges([
    { id: 'khong', tienDo: undefined },
    { id: 'NaN', tienDo: { tiLe: Number.NaN } },
    { id: 'am', tienDo: { tiLe: -0.2 } },
    { id: 'that', tienDo: { tiLe: 0.3 } },
  ]);
  assert.deepEqual(dangTien.map((e) => e.id), ['that']);
  assert.deepEqual(chuaCham.map((e) => e.id), ['khong', 'NaN', 'am']);
});

test('GIỮ NGUYÊN THỨ TỰ ĐẦU VÀO trong mỗi nhóm — danh sách vào đã sắp theo % giảm dần', () => {
  const { dangTien } = splitLockedBadges([
    { id: 'cao', tienDo: { tiLe: 0.9 } },
    { id: 'giua', tienDo: { tiLe: 0.5 } },
    { id: 'thap', tienDo: { tiLe: 0.1 } },
  ]);
  assert.deepEqual(dangTien.map((e) => e.id), ['cao', 'giua', 'thap']);
});

test('DANH SÁCH RỖNG / KHÔNG TRUYỀN GÌ ⇒ hai nhóm rỗng, không ném', () => {
  assert.deepEqual(splitLockedBadges([]), { dangTien: [], chuaCham: [] });
  assert.deepEqual(splitLockedBadges(), { dangTien: [], chuaCham: [] });
});
