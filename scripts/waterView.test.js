/**
 * waterView.test.js — KHOÁ CON SỐ CỦA `TECH_DEBT #57` VÀO MỘT BÀI TEST, KHÔNG ĐỂ NÓ NẰM YÊN TRONG
 * TÀI LIỆU.
 *
 * VIỆC 2 Bước B trượt cổng không-đo-được-bằng-test của Đàm (*"kỷ có biển phải đọc ra là thành phố
 * cảng"*): ở khung hình mặc định, mặt biển kỷ 14 chiếm **0,09%** khung hình, trong khi trần — xoay
 * camera sang phía đối diện bờ — là **31,43%**.
 *
 * ⚠️ VÌ SAO PHẢI LÀ MỘT BÀI TEST CHỨ KHÔNG PHẢI MỘT MỤC `TECH_DEBT`. Luật đã trả giá nhiều lần
 * trong dự án này: *"một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn được"*,
 * và cụ thể hơn — *"một con số trong bài test là cái hẹn giờ duy nhất chạy được"* (Phase 10 Bước 1,
 * `door: 'legacy'`). Một mục nợ chỉ được đọc khi có người đi tìm; một con số trong bài test thì TỰ
 * ĐÒI được đọc.
 *
 * ⚠️ BÀI `KHUYẾT TẬT VẪN CÒN NGUYÊN` DƯỚI ĐÂY CỐ Ý ĐỎ KHI AI ĐÓ SỬA XONG. Đó không phải một quả mìn
 * — nó là cái chuông buộc phiên sửa phải mở `TECH_DEBT #57` ra đóng lại tử tế thay vì để mục nợ
 * nằm mãi ở trạng thái Open trong khi mã đã hết bệnh.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { GOC_DOI_DIEN, tiLeNuocTrongKhung } from './water-view.mjs';
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
  const thay = tiLeNuocTrongKhung({ era: 14, yaw: GOC_DOI_DIEN.nam, tia: TIA }).nuoc;
  assert.ok(thay > 0.05, `đối chứng: đứng đối diện biển kỷ 14 phải THẤY nước, đo được ${thay}`);
});

test('BA LỚP PHẢI CỘNG ĐÚNG 100% — mọi phép chia-một-toàn-thể đều phải in ra TỔNG', () => {
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const r = tiLeNuocTrongKhung({ era, tia: TIA });
    assert.ok(Math.abs(r.nuoc + r.dat + r.khong - 1) < 1e-9,
      `kỷ ${era}: nước ${r.nuoc} + đất ${r.dat} + không ${r.khong} ≠ 1`);
  }
});

test('TECH_DEBT #57 — KHUYẾT TẬT VẪN CÒN NGUYÊN (bài này ĐỎ khi có ai sửa xong, và đó là CHỦ Ý)', () => {
  // Kỷ 14 khai `side: 'nam'`, camera mặc định đứng ở góc ĐÔNG-NAM rồi nhìn về tây-bắc ⇒ quay lưng
  // lại biển. Hai quyết định đều đúng một mình và chưa bao giờ được đặt cạnh nhau.
  assert.equal(getSetting(14).side, 'nam');

  const macDinh = tiLeNuocTrongKhung({ era: 14, tia: TIA }).nuoc;
  const tran = tiLeNuocTrongKhung({ era: 14, yaw: GOC_DOI_DIEN.nam, tia: TIA }).nuoc;

  assert.ok(macDinh < 0.01,
    `#57 có vẻ đã được sửa (biển kỷ 14 nay chiếm ${(macDinh * 100).toFixed(2)}% khung mặc định, `
    + 'trước là 0,09%). Nếu đúng thì hãy ĐÓNG `TECH_DEBT #57` và sửa bài test này — đừng nới ngưỡng.');
  assert.ok(tran > 0.20,
    `trần phải còn cao (đo được ${(tran * 100).toFixed(2)}%, mốc 31,43%) — nếu nó tụt thì vấn đề `
    + 'nay nằm ở HÌNH NƯỚC chứ không còn ở góc camera, và cách chữa hoàn toàn khác.');

  // Khoá chính cái QUAN HỆ, vì đó mới là điều mục nợ nói (bài học Phase 7D: một lời hứa nói về
  // quan hệ mà cài đặt bằng hằng số thì gãy trong im lặng).
  assert.ok(tran / macDinh > 50,
    `trần chỉ gấp ${(tran / macDinh).toFixed(1)}× mặc định (mốc 345,7×)`);
});
