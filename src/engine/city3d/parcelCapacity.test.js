import test from 'node:test';
import assert from 'node:assert/strict';

import { parcelCapacity, canSplitRegion } from './parcelCapacity.js';

/**
 * Công thức LƯỚI: giả định mọi nhát cắt chạy suốt cả bản đồ. Đây KHÔNG phải bản sao của mã sản
 * phẩm — nó là một cách tính KHÁC HẲN, viết ra để đối chiếu chéo. Hai đường độc lập cùng ra một số
 * thì con số ấy mới đáng tin (bài học `TECH_DEBT #43`).
 */
const traLuoi = (w, h, m) => (
  (w < m || h < m) ? 0 : Math.floor((w + 1) / (m + 1)) * Math.floor((h + 1) / (m + 1))
);

test('parcelCapacity: hình quá nhỏ thì không chứa nổi thửa nào', () => {
  assert.equal(parcelCapacity(1, 5, 2), 0);
  assert.equal(parcelCapacity(5, 1, 2), 0);
  assert.equal(parcelCapacity(2, 2, 3), 0);
  assert.equal(parcelCapacity(0, 0, 1), 0);
});

test('parcelCapacity: hình vừa đủ một thửa thì đúng bằng 1', () => {
  for (const m of [1, 2, 3]) {
    assert.equal(parcelCapacity(m, m, m), 1, `minSide ${m}`);
    // Chưa đủ chỗ cho thửa + đường + thửa ⇒ vẫn đúng 1.
    assert.equal(parcelCapacity(m * 2, m, m), 1, `minSide ${m}, rộng gấp đôi vẫn chưa cắt được`);
  }
});

test('parcelCapacity: nhát cắt đầu tiên xuất hiện đúng ở `minSide*2 + 1`', () => {
  for (const m of [1, 2, 3]) {
    assert.equal(canSplitRegion(m * 2, m, m), false, `minSide ${m}: chưa đủ`);
    assert.equal(canSplitRegion(m * 2 + 1, m, m), true, `minSide ${m}: vừa đủ`);
  }
});

/**
 * ⚠️ BÀI NÀY KHOÁ ĐÚNG CÂU TÔI ĐÃ VIẾT NGƯỢC TRONG CHÚ THÍCH ĐẦU `parcelCapacity.js`.
 * Bản đầu lập luận rằng cắt kiểu BSP chia được NHIỀU hơn lưới đều (vì nhát sau chỉ chạy trong phần
 * của nó). Đo ra thì hai cách BẰNG NHAU trên toàn miền dự án dùng. Câu ấy đã được sửa lại cho đúng,
 * và bài test này giữ cho nó là một sự thật được KIỂM chứ không phải một câu tự trấn an.
 * ⚠️ Nếu ngày nào đó bài này ĐỎ thì đừng vội sửa mã: rất có thể phép đệ quy đang đúng còn công thức
 * lưới mới là thứ hết đúng — lúc ấy phải in ra hình gây lệch rồi đọc nó, chứ không phải chỉnh số.
 */
test('parcelCapacity: khớp TỪNG ĐƠN VỊ với công thức lưới trên toàn miền đang dùng', () => {
  let soCa = 0;
  for (let m = 1; m <= 3; m += 1) {
    for (let w = 1; w <= 20; w += 1) {
      for (let h = 1; h <= 20; h += 1) {
        assert.equal(parcelCapacity(w, h, m), traLuoi(w, h, m), `minSide ${m}, ${w}×${h}`);
        soCa += 1;
      }
    }
  }
  // Gác chạy-rỗng: một vòng lặp không chạy thì mọi assert bên trong nó cũng không chạy.
  assert.equal(soCa, 1200, 'phải duyệt đủ 1.200 hình');
});

test('parcelCapacity: đối xứng theo hai chiều và không giảm khi hình to ra', () => {
  for (let w = 1; w <= 14; w += 1) {
    for (let h = 1; h <= 14; h += 1) {
      assert.equal(parcelCapacity(w, h, 2), parcelCapacity(h, w, 2), `${w}×${h} phải đối xứng`);
      assert.ok(
        parcelCapacity(w + 1, h, 2) >= parcelCapacity(w, h, 2),
        `${w}×${h}: rộng thêm một ô mà sức chứa lại giảm`,
      );
    }
  }
});

/**
 * Ba con số đang cai trị bảng `networkStyle`. Viết cứng ở đây là CỐ Ý: chúng là những cái trần thật
 * của lưới 12×12, và nếu một ngày nào đó chúng đổi thì mọi dòng bảng phải được đọc lại.
 */
test('parcelCapacity: trần thật của lưới 12×12 (và của lòng lưới 10×10 khi có vành đai)', () => {
  assert.equal(parcelCapacity(12, 12, 1), 36);
  assert.equal(parcelCapacity(12, 12, 2), 16);
  assert.equal(parcelCapacity(12, 12, 3), 9);
  assert.equal(parcelCapacity(10, 10, 1), 25);
  assert.equal(parcelCapacity(10, 10, 2), 9);
  // ⚠️ 4 < MIN_PARCELS (5) ⇒ "vành đai + minSide 3" là một tổ hợp KHÔNG TỒN TẠI. `isValidNetwork`
  // phải từ chối nó, và `networkStyle.test.js` có bài đối chứng đúng ca này.
  assert.equal(parcelCapacity(10, 10, 3), 4);
});
