/**
 * skillMatrix.test.js — canh LUẬT của bản đồ kỹ năng 6×6.
 * Chạy: node --import ./scripts/register-esm-loader.mjs --test src/components/shared/skillMatrix.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSkillMatrix, cheapestReachable, countReady, pickDefaultCell, MATRIX_STATE,
} from './skillMatrix.js';
import { SKILL_TREE } from '../../engine/constants.js';

const CAY = {
  A: { label: 'Nhánh A', nodes: [
    { id: 'a1', label: 'A1', spCost: 2, requires: [], tier: 'basic' },
    { id: 'a2', label: 'A2', spCost: 5, requires: ['a1'], tier: 'basic' },
  ] },
  B: { label: 'Nhánh B', nodes: [
    { id: 'b1', label: 'B1', spCost: 9, requires: [], tier: 'basic' },
  ] },
  // ⚠️ NHÁNH C TỒN TẠI ĐỂ PHÂN BIỆT "rẻ nhất" VỚI "rẻ nhất MÀ VỚI TỚI ĐƯỢC": c2 rẻ nhất bảng
  // (1 SP) nhưng nằm sau c1 (8 SP). Không có nó thì phép phá "tính cả ô khoá" ra ĐÚNG cùng con số
  // và bài test xanh oan — đúng bẫy "một bộ dữ liệu thử giống hình dạng thật có thể là bộ duy
  // nhất không phân biệt được đúng với sai".
  C: { label: 'Nhánh C', nodes: [
    { id: 'c1', label: 'C1', spCost: 8, requires: [], tier: 'basic' },
    { id: 'c2', label: 'C2', spCost: 1, requires: ['c1'], tier: 'basic' },
  ] },
};

test('BỐN TRẠNG THÁI TÁCH BẠCH — "đắt quá" khác "chưa đủ tiên quyết"', () => {
  // 3 SP: a1 (2 SP, không tiên quyết) mở được; a2 khoá vì thiếu a1; b1 đủ tiên quyết mà 9 > 3.
  const m = buildSkillMatrix({ skillTree: CAY, unlockedSkills: {}, sp: 3 });
  const [A, B] = m.columns;
  assert.equal(A.cells[0].state, MATRIX_STATE.READY);
  assert.equal(A.cells[1].state, MATRIX_STATE.LOCKED);
  assert.equal(B.cells[0].state, MATRIX_STATE.SHORT);
  // THỬ-CHO-ĐỎ: gộp SHORT vào LOCKED thì hai ca cần hai hành động ngược nhau trông y hệt nhau.
  assert.notEqual(B.cells[0].state, A.cells[1].state);
});

test('ĐÃ MỞ THẮNG MỌI TRẠNG THÁI KHÁC, kể cả khi hết sạch SP', () => {
  const m = buildSkillMatrix({ skillTree: CAY, unlockedSkills: { a1: true }, sp: 0 });
  assert.equal(m.columns[0].cells[0].state, MATRIX_STATE.OWNED);
  assert.equal(m.columns[0].cells[1].state, MATRIX_STATE.SHORT); // tiên quyết đã đủ, chỉ thiếu SP
  assert.equal(m.columns[0].owned, 1);
});

test('SỐ HÀNG = NHÁNH DÀI NHẤT, nhánh ngắn để lại ô trống chứ không dồn lên', () => {
  const m = buildSkillMatrix({ skillTree: CAY, unlockedSkills: {}, sp: 0 });
  assert.equal(m.rows, 2);
  assert.equal(m.columns[1].cells.length, 1); // nhánh B chỉ có 1 nút — hàng 2 của nó là ô trống
});

test('costOf QUYẾT ĐỊNH GIÁ (giảm giá di vật), không phải spCost thô', () => {
  // a1 giá gốc 2; di vật kéo về 1 ⇒ với 1 SP nó phải READY chứ không SHORT.
  const m = buildSkillMatrix({ skillTree: CAY, unlockedSkills: {}, sp: 1, costOf: (n) => (n.id === 'a1' ? 1 : n.spCost) });
  assert.equal(m.columns[0].cells[0].cost, 1);
  assert.equal(m.columns[0].cells[0].state, MATRIX_STATE.READY);
});

test('cheapestReachable CHỈ ĐẾM Ô ĐÃ ĐỦ TIÊN QUYẾT', () => {
  // a2 rẻ hơn b1? không — nhưng nếu tính cả ô KHOÁ thì a2 (5) sẽ chen vào. Ở đây a2 đang khoá.
  const m = buildSkillMatrix({ skillTree: CAY, unlockedSkills: {}, sp: 0 });
  assert.equal(cheapestReachable(m), 2);       // a1 (2) · b1 (9) · c1 (8) đủ tiên quyết — c2 (1) thì KHÔNG
  const m2 = buildSkillMatrix({ skillTree: CAY, unlockedSkills: { a1: true }, sp: 0 });
  assert.equal(cheapestReachable(m2), 5);      // a1 đã mở ⇒ a2 (5) mở khoá và rẻ hơn b1 (9) và c1 (8)
  // Không còn ô nào đủ tiên quyết mà chưa mở ⇒ 0, KHÔNG phải Infinity (Math.min của mảng rỗng).
  const m3 = buildSkillMatrix({ skillTree: CAY, unlockedSkills: { a1: true, a2: true, b1: true, c1: true, c2: true }, sp: 99 });
  assert.equal(cheapestReachable(m3), 0);
});

test('pickDefaultCell CHỌN Ô RẺ NHẤT TRONG SỐ MỞ ĐƯỢC — và TẤT ĐỊNH', () => {
  const m = buildSkillMatrix({ skillTree: CAY, unlockedSkills: {}, sp: 99 });
  assert.equal(pickDefaultCell(m).node.id, 'a1'); // a1=2 rẻ hơn b1=9
  assert.equal(countReady(m), 3);  // a1 · b1 · c1
  // Hết ô mở được ⇒ rơi về ô CHƯA MỞ đầu tiên, không rơi về ô đã mở.
  const m2 = buildSkillMatrix({ skillTree: CAY, unlockedSkills: { a1: true }, sp: 0 });
  assert.equal(countReady(m2), 0);
  assert.equal(pickDefaultCell(m2).node.id, 'a2');
  // Và ô mặc định phải là ô RẺ NHẤT chứ không phải ô đầu tiên: với 8 SP thì c1 (8) mở được nhưng
  // a1 (2) rẻ hơn ⇒ a1. Không có vế này thì "chọn ô đầu tiên" cũng xanh.
  assert.equal(pickDefaultCell(buildSkillMatrix({ skillTree: CAY, unlockedSkills: {}, sp: 8 })).node.id, 'a1');
});

test('DỮ LIỆU THẬT VẪN LÀ MA TRẬN CHỮ NHẬT — 6 cột × 6 hàng, không ô trống nào', () => {
  // Bản đồ chỉ đọc được theo HÀNG khi mọi nhánh cùng độ sâu. Ngày nào một nhánh dài/ngắn hơn,
  // bài này đỏ và người sửa phải quyết định lại cách vẽ chứ không để nó lặng lẽ lệch.
  const m = buildSkillMatrix({ skillTree: SKILL_TREE, unlockedSkills: {}, sp: 0 });
  assert.equal(m.columns.length, 6);
  assert.equal(m.rows, 6);
  for (const col of m.columns) assert.equal(col.cells.length, 6, `nhánh ${col.key} lệch độ sâu`);
  // …và cùng một BẬC ở cùng một hàng, nếu không thì hàng thôi mang nghĩa.
  for (let r = 0; r < 6; r += 1) {
    const bac = new Set(m.columns.map((c) => c.cells[r].tier));
    assert.equal(bac.size, 1, `hàng ${r} lẫn nhiều bậc: ${[...bac].join(', ')}`);
  }
});
