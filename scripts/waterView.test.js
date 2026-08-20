/**
 * waterView.test.js — KHOÁ CON SỐ CỦA `TECH_DEBT #57` VÀO MỘT BÀI TEST, KHÔNG ĐỂ NÓ NẰM YÊN TRONG
 * TÀI LIỆU.
 *
 * VIỆC 2 Bước B trượt cổng không-đo-được-bằng-test của Đàm (*"kỷ có biển phải đọc ra là thành phố
 * cảng"*): ở khung hình mặc định, mặt biển kỷ 14 chiếm **0,09%** khung hình, trong khi trần — xoay
 * camera sang phía đối diện bờ — là **31,43%**.
 *
 * ✅ **ĐÃ SỬA 2026-08-20 bằng trường `worldYaw`** (ADR-041): xoay TỜ GIẤY chứ không xoay thế giới —
 * `side` giữ nguyên sự thật lịch sử, `DEFAULT_YAW` giữ nguyên hằng số mỹ thuật, và chỗ chịu trách
 * nhiệm cho QUAN HỆ giữa hai thứ ấy nay có tên. Kỷ 14 đi từ **0,09% lên 23,75%**, kỷ 12 từ **2,30%
 * lên 9,32%**. Cái chuông ở bài cuối đã reo đúng lúc và đã được thay bằng bài khoá TRẠNG THÁI ĐÃ
 * SỬA — xem chú thích của nó.
 *
 * ⚠️ VÌ SAO PHẢI LÀ MỘT BÀI TEST CHỨ KHÔNG PHẢI MỘT MỤC `TECH_DEBT`. Luật đã trả giá nhiều lần
 * trong dự án này: *"một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn được"*,
 * và cụ thể hơn — *"một con số trong bài test là cái hẹn giờ duy nhất chạy được"* (Phase 10 Bước 1,
 * `door: 'legacy'`). Một mục nợ chỉ được đọc khi có người đi tìm; một con số trong bài test thì TỰ
 * ĐÒI được đọc.
 *
 * ⚠️ BÀI `KHUYẾT TẬT VẪN CÒN NGUYÊN` TỪNG CỐ Ý ĐỎ KHI AI ĐÓ SỬA XONG, và nó **đã reo đúng như thiết
 * kế**: phiên 2026-08-20 chạy `npm test`, thấy đúng một bài đỏ, kèm câu *"nếu đúng thì hãy ĐÓNG
 * TECH_DEBT #57 và sửa bài test này — đừng nới ngưỡng"*. Đó là bằng chứng thực nghiệm cho luật
 * *"một con số trong bài test là cái hẹn giờ duy nhất chạy được"* — mục nợ đã được đóng tử tế thay
 * vì nằm mãi ở trạng thái Open trong khi mã đã hết bệnh.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { gocDoiDien, tiLeNuocTrongKhung } from './water-view.mjs';
import { getSetting } from '../src/engine/city3d/settingStyle.js';
import { ERAS_WITH_WATER_GEOMETRY } from '../src/engine/city3d/setting.js';

/**
 * Lưới tia THƯA cho bài test — 88 cột thay vì 220, tức 1/6 số tia và 1/6 thời gian. Đủ mịn cho mọi
 * ngưỡng dưới đây (ngưỡng gần nhất là 1% ≈ 49 tia, còn giá trị thật là 0,09% ≈ 4 tia), và **giữ
 * nguyên tỉ lệ khung** nên nó vẫn đo cùng một đại lượng, chỉ thô hơn. Bảng số trong `TECH_DEBT #57`
 * đo ở độ mịn ĐẦY ĐỦ — đừng chép con số của bài test này vào tài liệu.
 */
const TIA = 88;

test('KỶ KHÔ RA ĐÚNG 0 Ở MỌI GÓC — và có ĐỐI CHỨNG chứng minh phép đo không mù', () => {
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    assert.equal(tiLeNuocTrongKhung({ era: 1, yaw, tia: TIA }).nuoc, 0,
      `kỷ 1 khai water:'none' mà phép đo lại thấy nước ở yaw ${yaw}`);
  }
  // ⚠️ Không có vế này thì bài trên vẫn XANH kể cả khi phép đo hỏng hẳn và không bao giờ đếm nổi
  // một tia nước nào — đúng cái phễu "assert có ít nhất một chỗ" đã cắn ở Phase 7A.
  const thay = tiLeNuocTrongKhung({ era: 14, yaw: gocDoiDien(14), tia: TIA }).nuoc;
  assert.ok(thay > 0.05, `đối chứng: đứng đối diện biển kỷ 14 phải THẤY nước, đo được ${thay}`);
});

test('BA LỚP PHẢI CỘNG ĐÚNG 100% — mọi phép chia-một-toàn-thể đều phải in ra TỔNG', () => {
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const r = tiLeNuocTrongKhung({ era, tia: TIA });
    assert.ok(Math.abs(r.nuoc + r.dat + r.khong - 1) < 1e-9,
      `kỷ ${era}: nước ${r.nuoc} + đất ${r.dat} + không ${r.khong} ≠ 1`);
  }
});

test('TECH_DEBT #57 ĐÃ ĐÓNG — biển kỷ 14 và sông kỷ 12 phải THẬT SỰ nằm trong khung mặc định', () => {
  // ⚠️ BÀI NÀY THAY CHO BÀI "KHUYẾT TẬT VẪN CÒN NGUYÊN". Cái chuông đã reo (2026-08-20) và nay nó
  // đổi việc: từ *canh cho khuyết tật đừng bị quên* sang *canh cho bản vá đừng bị mất*.
  //
  // Ngưỡng 5% là cổng Đàm ra ở §3. Nó KHÔNG áp cho mọi kỷ có nước, và đó là một sự thật đã đo chứ
  // không phải một chỗ nới tay: kênh Amsterdam kỷ 10 rộng 0,9 ô, và **không góc nhìn nào** đưa nó
  // lên 5% khung hình (trần đo được 7,37% ở một góc phá hỏng mọi kỷ khác; ở góc chung tốt nhất nó
  // chỉ được 1,9%). Kỷ 6 thì trần TOÀN CỤC chỉ 4,44% — dưới 5% ở MỌI góc. Bảng đầy đủ 14 kỷ × 24
  // góc nằm ở `PERFORMANCE.md`. Vì vậy bài này khoá đúng hai kỷ ĐÃ DỰNG HÌNH, và Bước C sẽ phải
  // đối mặt với ba kỷ hẹp ấy bằng một câu trả lời khác (`TECH_DEBT #59`).
  //
  // THỬ-CHO-ĐỎ: cho `worldYaw` trả 0 ⇒ kỷ 14 tụt về 0,09% ⇒ đỏ ở `assert.ok(macDinh >= 0.05)`.
  assert.equal(getSetting(14).side, 'nam', 'sự thật lịch sử KHÔNG được đổi để lấy con số');
  assert.equal(getSetting(12).side, 'dong', 'sự thật lịch sử KHÔNG được đổi để lấy con số');

  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const macDinh = tiLeNuocTrongKhung({ era, tia: TIA }).nuoc;
    assert.ok(macDinh >= 0.05,
      `kỷ ${era}: mặt nước chỉ chiếm ${(macDinh * 100).toFixed(2)}% khung mặc định, dưới cổng 5% `
      + 'của §3. `worldYaw` có đang bị vô hiệu hoá không?');
  }

  // ⚠️ ĐỐI CHỨNG — TRẦN PHẢI CÒN CAO HƠN MẶC ĐỊNH Ở KỶ BIỂN. Không có vế này thì bài trên vẫn xanh
  // trong một thế giới mà mặt biển đã phình to bất thường (vd `reach` tụt về 0 và nước liếm vào sát
  // thành phố) — lúc ấy 23% là triệu chứng của một lỗi khác, không phải bằng chứng đã sửa đúng.
  const tran14 = tiLeNuocTrongKhung({ era: 14, yaw: gocDoiDien(14), tia: TIA }).nuoc;
  const macDinh14 = tiLeNuocTrongKhung({ era: 14, tia: TIA }).nuoc;
  assert.ok(tran14 > macDinh14,
    `kỷ 14: trần ${(tran14 * 100).toFixed(2)}% không cao hơn mặc định ${(macDinh14 * 100).toFixed(2)}%`);
  assert.ok(macDinh14 / tran14 > 0.5,
    `kỷ 14: khung mặc định mới chỉ lấy được ${(macDinh14 / tran14 * 100).toFixed(0)}% của trần — `
    + 'bản vá chưa đưa được biển vào tầm nhìn như đã hứa.');
});
