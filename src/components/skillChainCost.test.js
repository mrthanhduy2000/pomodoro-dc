import test from 'node:test';
import assert from 'node:assert/strict';
import { SKILL_TREE } from '../engine/constants.js';
import { giaCaChuoi } from './skillChainCost.js';

const BANG = new Map();
for (const nhanh of Object.values(SKILL_TREE)) for (const n of nhanh.nodes ?? []) BANG.set(n.id, n);
const GIA = (n) => n.spCost;

test('nút không có tiên quyết: giá chuỗi = giá lẻ', () => {
  const goc = [...BANG.values()].find((n) => (n.requires ?? []).length === 0);
  assert.equal(giaCaChuoi(goc.id, BANG, () => false, GIA), goc.spCost);
});

test('nút đã MỞ không tính tiền — cả chính nó lẫn khi nó là tiên quyết', () => {
  const con = [...BANG.values()].find((n) => (n.requires ?? []).length === 1);
  const cha = con.requires[0];
  assert.equal(giaCaChuoi(con.id, BANG, (id) => id === con.id, GIA), 0, 'chính nó đã mở ⇒ 0');
  assert.equal(giaCaChuoi(con.id, BANG, (id) => id === cha, GIA), con.spCost, 'cha đã mở ⇒ chỉ còn giá con');
});

test('trên dữ liệu THẬT: 21/32 nút có giá chuỗi CAO HƠN giá lẻ, tệ nhất 2,3 lần', () => {
  // ⚠️ Đây là con số đã đo trên một ván thật (4 kỹ năng đã mở). Nó là lý do file này tồn tại;
  // không có nó thì "giá hiện đang nói dối" chỉ là một câu nói.
  const daMoIds = new Set(['vao_guong', 'chuyen_can', 'da_tap_trung', 'phuc_hoi']);
  const daMo = (id) => daMoIds.has(id);
  let lech = 0, teNhat = 1, chuaMo = 0;
  for (const [id, n] of BANG) {
    if (daMo(id)) continue;
    chuaMo += 1;
    const that = giaCaChuoi(id, BANG, daMo, GIA);
    if (that > n.spCost) { lech += 1; teNhat = Math.max(teNhat, that / n.spCost); }
  }
  assert.equal(chuaMo, 32);
  assert.equal(lech, 21, 'số nút hiện giá thiếu đã đổi — đo lại rồi cập nhật con số này');
  assert.equal(Math.round(teNhat * 10) / 10, 2.3);
});

test('KHÔNG đếm một nút hai lần khi hai tiên quyết chia chung tổ tiên', () => {
  // Đối chứng dựng tay: D cần B và C, cả hai cùng cần A. Cộng thẳng sẽ tính A hai lần (11), đúng
  // phải là 10. Không có ca này thì phép cộng ngây thơ vẫn xanh trên cây thật (nó hình xương cá).
  const bang = {
    A: { id: 'A', spCost: 1, requires: [] },
    B: { id: 'B', spCost: 2, requires: ['A'] },
    C: { id: 'C', spCost: 3, requires: ['A'] },
    D: { id: 'D', spCost: 4, requires: ['B', 'C'] },
  };
  assert.equal(giaCaChuoi('D', bang, () => false, GIA), 10);
});

test('id lạ và bảng rỗng không làm nổ', () => {
  assert.equal(giaCaChuoi('khong_ton_tai', BANG, () => false, GIA), 0);
  assert.equal(giaCaChuoi('A', {}, () => false, GIA), 0);
});

test('giá HIỆU DỤNG được tôn trọng — giảm giá di vật phải chảy vào cả chuỗi', () => {
  const bang = { A: { id: 'A', spCost: 4, requires: [] }, B: { id: 'B', spCost: 8, requires: ['A'] } };
  assert.equal(giaCaChuoi('B', bang, () => false, (n) => n.spCost / 2), 6, 'nửa giá ⇒ (4+8)/2');
});
