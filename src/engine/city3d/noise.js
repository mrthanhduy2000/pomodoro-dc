/**
 * noise.js — TRƯỜNG NHIỄU DÙNG CHUNG cho mọi tầng địa hình.
 *
 * ⚠️ VÌ SAO NÓ TÁCH RA THÀNH MỘT FILE RIÊNG (2026-08-19, VIỆC 2 Bước B). Hàm này sinh ra trong
 * `terrain.js` ở Phase 7B, rồi Phase 9A cho `horizon.js` dùng chung, rồi ADR-038 cho `outskirts.js`
 * dùng chung — với đúng một lý do lặp lại ba lần trong chú thích của chính nó: *"hai bản nhiễu
 * tương đương trên giấy thì mặt đất gần và mặt đất xa sẽ có hai kiểu gợn khác nhau, và chỗ giáp
 * giữa chúng sẽ lộ ra một đường"*. Nó chưa bao giờ là một hàm của `terrain`; nó là một PHÉP DÙNG
 * CHUNG mà `terrain` tình cờ là người viết ra đầu tiên.
 *
 * ⚠️ Và Bước B biến chuyện ở nhờ ấy thành một VÒNG IMPORT thật: `setting.js` (dấu chân mặt nước)
 * cần nhiễu để làm mép bờ lượn, mà `terrain.js` thì phải hỏi `setting.js` xem chỗ nào là nước để
 * hạ mặt đất xuống. `setting → terrain → setting`. ES module chịu được vòng ấy, nhưng nó là loại
 * hỏng chỉ lộ ra khi thứ tự nạp đổi — tức lộ ra ở một phiên khác, do tay một người khác. Dời hàm
 * xuống một tầng KHÔNG phụ thuộc ai là cách gỡ theo CẤU TRÚC, không phải theo kỷ luật.
 *
 * Không thêm gì mới ở đây: chính xác cùng một công thức, cùng một `hashId`, nên mọi trường cao độ
 * đã dựng ra từ trước phải ra **y hệt từng con số** (có bài test khoá điều đó ở `terrain.test.js`
 * — bảng cao độ 15 kỷ không được xê dịch).
 */

import { hashId } from '../cityLayout';

function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { return t * t * (3 - 2 * t); }

/** Giá trị 0..1 tất định tại một nút lưới nhiễu. */
function latticeValue(seed, ix, iy) {
  return (hashId(`t|${seed}|${ix}|${iy}`) % 4096) / 4095;
}

/**
 * Nhiễu giá trị nội suy song tuyến, làm mượt bằng smoothstep. Trả 0..1.
 *
 * ⚠️ MỌI TẦNG ĐỊA HÌNH PHẢI GỌI ĐÚNG HÀM NÀY, không chép lại một bản "tương đương": `terrain.js`
 * (mặt đất thành phố) · `horizon.js` (rặng núi xa) · `outskirts.js` (lùm cây vùng quê) ·
 * `setting.js` (mép bờ nước). Bốn tầng ấy gặp nhau ở những chỗ giáp, và chỗ giáp là nơi duy nhất
 * mà một khác biệt nhỏ trở thành một ĐƯỜNG VIỀN mắt đọc ra được.
 */
export function valueNoise(seed, gx, gy) {
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const sx = smoothstep(gx - x0);
  const sy = smoothstep(gy - y0);
  const top = lerp(latticeValue(seed, x0, y0), latticeValue(seed, x0 + 1, y0), sx);
  const bottom = lerp(latticeValue(seed, x0, y0 + 1), latticeValue(seed, x0 + 1, y0 + 1), sx);
  return lerp(top, bottom, sy);
}
