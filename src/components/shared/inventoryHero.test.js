/**
 * inventoryHero.test.js — luật của dải mở đầu Hành trang.
 *
 * ⚠️ Bài cuối canh một BUG ĐÃ CẮN HAI LẦN trong chính phiên viết ra nó: cả `BLUEPRINT_META` lẫn
 * `ACHIEVEMENTS` đặt tên hiển thị ở trường **`label`**, không phải `name` — mà tôi viết `.name`
 * cả hai lần. Không gì đỏ lên, vì `?? 'Công trình'` / `?? 'Huy hiệu'` nuốt gọn nó và câu hỏng
 * đọc lên vẫn hoàn toàn hợp lý ("Công trình sẽ mọc lên trong thành phố."). Cùng họ với bẫy
 * `entry.buildings` ↔ `entry.built` ở `make-fixture.mjs` (vòng 24, sai 9,5 lần).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { tiLe, heroKyNang, heroCongTrinh, heroHuyHieu } from './inventoryHero.js';
import { ACHIEVEMENTS, BLUEPRINT_META } from '../../engine/constants.js';

test('tiLe kẹp 0..1 và không chia cho 0', () => {
  assert.equal(tiLe(5, 10), 0.5);
  assert.equal(tiLe(99, 10), 1, 'vượt mục tiêu thì thanh đầy, không vẽ quá một vòng');
  assert.equal(tiLe(-5, 10), 0);
  assert.equal(tiLe(1, 0), 0);
  assert.equal(tiLe(NaN, 10), 0);
});

test('hero KỸ NĂNG dẫn bằng thứ HÀNH ĐỘNG ĐƯỢC, không phải thành tích quá khứ', () => {
  const moDuoc = heroKyNang({ spChuaTieu: 2, daMo: 4, tongKyNang: 30, moDuoc: 1, reNhat: 2 });
  assert.equal(moDuoc.so, 2, 'có điểm tiêu được thì con số dẫn đầu phải là NÓ');
  assert.equal(moDuoc.gap, true, 'có việc làm được ⇒ dải phải mang màu nhấn');

  const hetDiem = heroKyNang({ spChuaTieu: 0, daMo: 4, tongKyNang: 30 });
  assert.equal(hetDiem.so, 4);
  assert.equal(hetDiem.gap, false, 'không có việc mà vẫn rực thì "rực" thôi mang tin');
});

test('CÓ ĐIỂM MÀ KHÔNG MỞ ĐƯỢC GÌ THÌ KHÔNG ĐƯỢC RỰC — và phải nói ra còn thiếu bao nhiêu', () => {
  // Ca thật đã đo được trên một ván: 1 SP trong tay, ô rẻ nhất mở được giá 3 SP. Bản cũ bật màu
  // nhấn và viết "mở thêm một kỹ năng ngay bên dưới" — một lời hứa KHÔNG làm được.
  const ket = heroKyNang({ spChuaTieu: 1, daMo: 4, tongKyNang: 36, moDuoc: 0, reNhat: 3 });
  assert.equal(ket.gap, false, 'không mở được ô nào mà vẫn rực = hứa sai');
  assert.equal(ket.so, 1, 'vẫn dẫn bằng số điểm đang có — người chơi cần biết mình có gì');
  assert.match(ket.caption, /3 SP/, 'phải nói ô rẻ nhất cần bao nhiêu, không chỉ nói "chưa đủ"');
  assert.ok(ket.pct > 0 && ket.pct < 1, 'thanh chạy phải cho thấy còn bao xa (1/3), không phải đầy');

  // …và ca ngược lại: đủ tiền nhưng vướng tiên quyết ⇒ lời khuyên phải KHÁC (đi mở nút cha).
  const vuong = heroKyNang({ spChuaTieu: 9, daMo: 4, tongKyNang: 36, moDuoc: 0, reNhat: 2 });
  assert.equal(vuong.gap, false);
  assert.doesNotMatch(vuong.caption, /Chưa đủ/, 'đủ tiền thì đừng bảo người ta là chưa đủ tiền');
});
test('hero CÔNG TRÌNH ưu tiên thứ đang xây (có "còn bao xa") hơn thứ đã xong', () => {
  const dangXay = heroCongTrinh({
    dangXay: { ten: 'Cảng Biển Lớn', con: 4, tong: 9 }, daXay: 4, tongBanVe: 20, sanSangXay: 3,
  });
  assert.equal(dangXay.so, 4);
  assert.match(dangXay.caption, /Cảng Biển Lớn/);
  assert.equal(dangXay.pct, tiLe(5, 9), 'thanh phải đo phần ĐÃ XONG, không phải phần còn lại');

  const chuaXay = heroCongTrinh({ dangXay: null, daXay: 4, tongBanVe: 20, sanSangXay: 3 });
  assert.equal(chuaXay.so, 3, 'không xây gì mà có bản vẽ sẵn ⇒ dẫn bằng việc làm được');

  const trong = heroCongTrinh({ dangXay: null, daXay: 4, tongBanVe: 20, sanSangXay: 0 });
  assert.equal(trong.gap, false);
});

test('hero HUY HIỆU dẫn bằng cái SẮP đạt khi có', () => {
  const sap = heroHuyHieu({ daMo: 157, tong: 360, ganDat: { ten: 'Biên Niên Sử Nhỏ', pct: 0.99 } });
  assert.equal(sap.so, 99);
  assert.match(sap.caption, /Biên Niên Sử Nhỏ/);
  assert.equal(heroHuyHieu({ daMo: 157, tong: 360, ganDat: null }).so, 157);
});

// THỬ-CHO-ĐỎ: đổi `.label` thành `.name` ở Achievements.jsx hoặc BuildingWorkshop.jsx ⇒ bài này đỏ.
test('tên hiển thị nằm ở `label` — KHÔNG phải `name`, và mã phải hỏi đúng trường đó', () => {
  // Sự thật về dữ liệu, đọc thẳng từ nguồn.
  assert.ok(ACHIEVEMENTS[0].label, 'ACHIEVEMENTS dùng `label`');
  assert.equal(ACHIEVEMENTS[0].name, undefined, 'ACHIEVEMENTS KHÔNG có `name`');
  const bp = Object.values(BLUEPRINT_META)[0];
  assert.equal(bp.name, undefined, 'BLUEPRINT_META KHÔNG có `name`');

  // Và mã phải hỏi đúng trường ấy — nếu không, `?? 'Huy hiệu'` nuốt lỗi và câu hỏng vẫn xuôi tai.
  const ach = readFileSync(new URL('../Achievements.jsx', import.meta.url), 'utf8');
  assert.match(ach, /sapDat\[0\]\.achievement\?\.label/, 'hero Huy hiệu lại hỏi `.name`');
  const ws = readFileSync(new URL('../BuildingWorkshop.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(ws, /BUILDING_EFFECTS\[item\.bpId\]\?\.name/, 'hero Công trình lại hỏi `.name`');
});
