import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  phânVị, tómTắt, dưĐịa, hệSốNặngThêm, danhSáchCảnh, NGƯỠNG_MẪU_P95, NHỊP_MÀN_HÌNH,
} from './benchCore.mjs';

test('phân vị nearest-rank luôn trả về một giá trị THẬT đã đo được', () => {
  const xs = [10, 20, 30, 40];
  // Với nearest-rank, mọi kết quả phải nằm trong chính mảng đầu vào — đây là lời hứa cốt lõi:
  // frame time là đại lượng rời rạc theo nhịp màn hình, nội suy sẽ đẻ ra số không khung nào đạt.
  for (const p of [0, 0.1, 0.25, 0.5, 0.75, 0.95, 1]) {
    assert.ok(xs.includes(phânVị(xs, p)), `phân vị ${p} ra ${phânVị(xs, p)} — không phải giá trị thật`);
  }
  assert.equal(phânVị(xs, 0), 10);
  assert.equal(phânVị(xs, 1), 40);
  assert.equal(phânVị(xs, 0.5), 20);   // ceil(0,5 × 4) = 2 ⇒ phần tử thứ 2
});

test('phân vị KHÔNG phụ thuộc thứ tự đầu vào, và không làm hỏng mảng gốc', () => {
  const gốc = [30, 10, 40, 20];
  const bảnSao = [...gốc];
  assert.equal(phânVị(gốc, 0.5), phânVị([10, 20, 30, 40], 0.5));
  assert.deepEqual(gốc, bảnSao, 'hàm đã sắp xếp tại chỗ mảng của người gọi');
});

test('mảng rỗng ra NaN, không ra 0 — 0 sẽ bị đọc thành "nhanh vô hạn"', () => {
  assert.ok(Number.isNaN(phânVị([], 0.5)));
  const t = tómTắt([]);
  assert.equal(t.n, 0);
  assert.ok(Number.isNaN(t.p50));
  assert.ok(Number.isNaN(t.fps));
  assert.equal(t.p95ĐángTin, false);
});

test('FPS suy từ P50, FPS xấu suy từ P95 — không phải từ trung bình', () => {
  // 99 khung ở 10 ms + 1 khung ở 500 ms. Trung bình = 14,9 ms (nói dối: "67 FPS").
  // P50 vẫn 10 ms ⇒ 100 FPS, đúng nhịp Đàm cảm nhận; còn cú khựng nằm ở P95/max.
  const mẫu = [...Array(99).fill(10), 500];
  const t = tómTắt(mẫu);
  assert.equal(t.p50, 10);
  assert.ok(Math.abs(t.fps - 100) < 0.001, `fps=${t.fps}`);
  assert.equal(t.max, 500);
  const trungBình = mẫu.reduce((a, b) => a + b, 0) / mẫu.length;
  assert.ok(Math.abs(t.p50 - trungBình) > 4, 'bài test này vô nghĩa nếu trung bình ≈ P50');
});

test('P95 tự khai là KHÔNG đáng tin khi cỡ mẫu nhỏ', () => {
  const ít = tómTắt(Array.from({ length: NGƯỠNG_MẪU_P95 - 1 }, (_, i) => i + 1));
  const đủ = tómTắt(Array.from({ length: NGƯỠNG_MẪU_P95 }, (_, i) => i + 1));
  assert.equal(ít.p95ĐángTin, false, 'cỡ mẫu nhỏ mà vẫn tự nhận P95 đáng tin');
  assert.equal(đủ.p95ĐángTin, true);

  // ⚠️ ĐỐI CHỨNG nhốt đúng lý do sinh ra cái cờ này: ở cỡ mẫu rất nhỏ, P95 CHÍNH LÀ max — một con
  // số nghe như thống kê nhưng thật ra là giá trị đơn lẻ nhiễu nhất trong loạt.
  const nhỏXíu = tómTắt([1, 2, 3, 4, 5]);
  assert.equal(nhỏXíu.p95, nhỏXíu.max, 'ở N=5 mà P95 khác max thì phép đo đã nội suy');
  assert.equal(nhỏXíu.p95ĐángTin, false);
});

test('dư địa và hệ số nặng thêm nói cùng một sự thật, theo hai cách đọc', () => {
  const budget60 = NHỊP_MÀN_HÌNH[60];
  // Đúng bằng ngân sách ⇒ dư địa 0, nặng thêm được 1× (tức không thêm được gì).
  assert.ok(Math.abs(dưĐịa(budget60, 60) - 0) < 1e-9);
  assert.ok(Math.abs(hệSốNặngThêm(budget60, 60) - 1) < 1e-9);

  // Nhanh gấp đôi ngân sách ⇒ còn dư 50%, nặng thêm được 2×.
  assert.ok(Math.abs(dưĐịa(budget60 / 2, 60) - 0.5) < 1e-9);
  assert.ok(Math.abs(hệSốNặngThêm(budget60 / 2, 60) - 2) < 1e-9);

  // Vượt ngân sách ⇒ dư địa ÂM và nặng thêm < 1. Dấu âm là thứ phân biệt "còn dư" với "đã tràn";
  // kẹp về 0 sẽ giấu mất mức độ nghiêm trọng.
  assert.ok(dưĐịa(budget60 * 2, 60) < 0, 'vượt ngân sách mà dư địa không âm');
  assert.ok(hệSốNặngThêm(budget60 * 2, 60) < 1);

  assert.ok(Number.isNaN(dưĐịa(0)), 'p50 = 0 phải ra NaN, không ra dư địa vô hạn');
  assert.ok(Number.isNaN(hệSốNặngThêm(-5)));
});

test('120 Hz khắt khe hơn 60 Hz trên cùng một frame time', () => {
  const ms = 8;
  assert.ok(dưĐịa(ms, 120) < dưĐịa(ms, 60), 'màn hình nhanh hơn mà lại dễ tính hơn');
  assert.ok(hệSốNặngThêm(ms, 120) < hệSốNặngThêm(ms, 60));
});

test('danh sách cảnh đủ 24 và có CẢ wide lẫn close ở mọi kỷ/giờ', () => {
  const cảnh = danhSáchCảnh();
  assert.equal(cảnh.length, 24, '4 kỷ × 3 giờ × 2 khung hình');
  assert.equal(new Set(cảnh.map((c) => c.id)).size, 24, 'có id trùng nhau');

  // Close shot phải THẬT SỰ gần hơn wide — nếu hai zoom bằng nhau thì cả nửa bảng là bản sao, và
  // bộ đo sẽ mù hoàn toàn với loại chi phí "nặng vì điểm ảnh" mà close shot sinh ra để bắt.
  const wide = cảnh.filter((c) => c.shot === 'wide');
  const close = cảnh.filter((c) => c.shot === 'close');
  assert.equal(wide.length, 12);
  assert.equal(close.length, 12);
  assert.ok(close.every((c) => c.zoom < wide[0].zoom), 'close shot không hề gần hơn wide');

  // Mỗi kỷ phải có đủ 3 giờ, mỗi giờ đủ 2 khung hình.
  for (const era of new Set(cảnh.map((c) => c.era))) {
    const củaKỷ = cảnh.filter((c) => c.era === era);
    assert.equal(củaKỷ.length, 6, `kỷ ${era} không đủ 6 cảnh`);
    assert.equal(new Set(củaKỷ.map((c) => c.hour)).size, 3, `kỷ ${era} không đủ 3 giờ`);
  }
});
