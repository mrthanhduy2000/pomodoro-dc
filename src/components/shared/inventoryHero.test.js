/**
 * inventoryHero.test.js — luật của dải mở đầu Hành trang.
 *
 * ⚠️ Bài cuối canh một BUG ĐÃ CẮN HAI LẦN trong chính phiên viết ra nó: cả `BLUEPRINT_META` lẫn
 * Các bảng dữ liệu của dự án đặt tên hiển thị ở trường **`label`**, không phải `name` — mà tôi viết `.name`
 * cả hai lần. Không gì đỏ lên, vì `?? 'Công trình'` / `?? 'Huy hiệu'` nuốt gọn nó và câu hỏng
 * đọc lên vẫn hoàn toàn hợp lý ("Công trình sẽ mọc lên trong thành phố."). Cùng họ với bẫy
 * `entry.buildings` ↔ `entry.built` ở `make-fixture.mjs` (vòng 24, sai 9,5 lần).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { tiLe, heroKyNang, heroCongTrinh } from './inventoryHero.js';
import { BLUEPRINT_META } from '../../engine/constants.js';

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
    dangXay: { ten: 'Cảng Biển Lớn', con: 4, tong: 9 }, daXay: 4, tongBanVe: 20, chonDuoc: 3,
  });
  assert.equal(dangXay.so, 4);
  assert.match(dangXay.caption, /Cảng Biển Lớn/);
  assert.equal(dangXay.pct, tiLe(5, 9), 'thanh phải đo phần ĐÃ XONG, không phải phần còn lại');
  assert.match(dangXay.caption, /ô trống/, 'còn ô trống thì phải mời chọn thêm — hàng chờ hai ô mà chỉ dùng một là phí phiên');

  const dayO = heroCongTrinh({
    dangXay: { ten: 'Cảng Biển Lớn', con: 4, tong: 9 }, daXay: 4, tongBanVe: 20, chonDuoc: 3, hangChoDay: true,
  });
  assert.doesNotMatch(dayO.caption, /ô trống/, 'hàng chờ đầy thì đừng mời chọn thêm');

  const chuaXay = heroCongTrinh({ dangXay: null, daXay: 4, tongBanVe: 20, chonDuoc: 3 });
  assert.equal(chuaXay.so, 3, 'không xây gì mà có công trình chọn được ⇒ dẫn bằng việc làm được');
  assert.equal(chuaXay.gap, true);

  const trong = heroCongTrinh({ dangXay: null, daXay: 4, tongBanVe: 20, chonDuoc: 0 });
  assert.equal(trong.gap, false);
});

// THỬ-CHO-ĐỎ: đổi `.label` thành `.name` ở engine/buildChoices.js ⇒ bài này đỏ.
test('tên hiển thị nằm ở `label` — KHÔNG phải `name`, và mã phải hỏi đúng trường đó', () => {
  // Sự thật về dữ liệu, đọc thẳng từ nguồn.
  const bp = Object.values(BLUEPRINT_META)[0];
  assert.equal(bp.name, undefined, 'BLUEPRINT_META KHÔNG có `name`');

  // ⚠️ Vế THÀNH TÍCH của bài này đã đi cùng cả hệ huy hiệu (round 44, ADR-084). Vế còn lại vẫn
  // sống và vẫn là chỗ đã cắn thật: sau ADR-069 tên công trình đi qua `describeProject`
  // (engine/buildChoices.js) — nó phải hỏi `.label`, không phải `.name`.
  const bc = readFileSync(new URL('../../engine/buildChoices.js', import.meta.url), 'utf8');
  assert.doesNotMatch(bc, /def\?\.name|meta\?\.name/, 'describeProject lại hỏi `.name`');
  assert.match(bc, /def\?\.label/, 'describeProject phải đọc tên ở `.label`');
});

test('CÔNG TRÌNH (ADR-069): không còn cổng nguyên liệu — có ô trống là chọn được, xây trọn kỷ thì lặng', () => {
  // Trước 2026-09-06 dải này có nhánh "chờ nguyên liệu" vì bản vẽ đã nghiên cứu mà vẫn không
  // khởi công được. Nay bản vẽ khởi công ngay khi có ô trống, nên chỉ còn ba trạng thái.
  const chon = heroCongTrinh({ daXay: 2, tongBanVe: 5, chonDuoc: 3 });
  assert.equal(chon.gap, true, 'có ô trống + có bản vẽ ⇒ đây là việc LÀM ĐƯỢC ngay, phải rực');
  assert.equal(chon.so, 3);
  assert.doesNotMatch(chon.caption, /nguyên liệu|nghiên cứu/i, 'cổng cũ đã bỏ thì lời mời không được nhắc tới nó');

  const tron = heroCongTrinh({ daXay: 5, tongBanVe: 5, chonDuoc: 0 });
  assert.equal(tron.gap, false, 'xây trọn kỷ thì không còn việc ⇒ lặng xuống');
  assert.equal(tron.so, 5);
  assert.match(tron.caption, /★/, 'trọn kỷ là ngôi sao của bảo tàng — phải nói ra');

  const chua = heroCongTrinh({ daXay: 2, tongBanVe: 5, chonDuoc: 0 });
  assert.equal(chua.gap, false, 'hàng chờ đầy mà chưa trọn ⇒ không có việc mới, không rực');
  assert.equal(chua.so, 2);
});

