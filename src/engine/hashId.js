/**
 * hashId.js — băm tất định, nền móng của MỌI thứ "trông ngẫu nhiên nhưng không bao giờ đổi"
 * trong dự án này.
 *
 * THUẦN tuyệt đối: không phụ thuộc gì, không import gì. Đó là điểm quan trọng nhất của file.
 *
 * ⚠️ VÌ SAO NÓ ĐƯỢC TÁCH RA THÀNH MỘT FILE RIÊNG (2026-08-14, Phase 7C).
 * Hàm này vốn nằm trong `cityLayout.js`, và sáu module dưới `city3d/` đều `import { hashId } from
 * '../cityLayout'`. Điều đó ổn suốt một thời gian dài vì mũi tên chỉ đi MỘT chiều: `city3d/*` phụ
 * thuộc `cityLayout`, không có chiều ngược lại. Phase 7C phá thế đó — `cityLayout` cần
 * `deriveDwellings` từ `city3d/dwellings.js`, mà file ấy lại cần `hashId`, tức một VÒNG TRÒN.
 *
 * Vòng import trong ES module không nổ ngay; nó "hoạt động" cho tới khi một module cố đọc giá trị
 * của module kia lúc đang khởi tạo, rồi nhận `undefined`. Nghĩa là nó hỏng **theo thứ tự nạp**, tức
 * hỏng khác nhau giữa `node --test`, bản gói Vite, và trang xem thử — đúng loại lỗi tệ nhất: im
 * lặng, không tái lập được, và đổi mặt tuỳ chỗ chạy. Tách hàm không-phụ-thuộc-gì này ra một file
 * lá là cách chặn TẬN GỐC chứ không phải né: giờ mọi module cùng trỏ xuống dưới, và **không có
 * đường nào để một vòng tròn mới xuất hiện quanh nó**.
 *
 * ⚠️ `cityLayout.js` vẫn `export { hashId }` để mọi lời import cũ chạy nguyên như trước — đây là
 * TÁI XUẤT, không phải bản sao. Một bản sao thứ hai của hàm băm sẽ là thảm hoạ: hai bản trôi khỏi
 * nhau nghĩa là cùng một `bpId` cho ra hai hình dáng khác nhau ở hai chỗ, và cả lời hứa "công
 * trình không bao giờ đổi hình" (ADR-007) sụp theo — âm thầm.
 */

/**
 * Băm tất định chuỗi → số nguyên KHÔNG ÂM 32-bit (FNV-1a). Không dùng `Math.random`.
 * Mọi giá trị đầu vào (kể cả `null`/`undefined`/số) đều cho ra một số hợp lệ, không bao giờ `NaN`.
 */
export function hashId(str) {
  const text = typeof str === 'string' ? str : String(str ?? '');
  let hash = 0x811c9dc5;                    // FNV offset basis
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);     // FNV prime
  }
  return hash >>> 0;                        // ép về không dấu
}

/**
 * ⚠️ BA HÀM DƯỚI ĐÂY VỀ ĐÂY VÌ CHÚNG ĐÃ CÓ **BỐN BẢN SAO** (Phase 8D).
 * `unit` được chép nguyên văn trong `propSpec.js`, `signature.js`, `residents.js` và
 * `buildingSpec.js`; `signed` có hai bản. Bốn bản sao của một công thức là đúng thứ mà luật
 * **Composition over Duplication** cấm, và ở đây nó nguy hiểm hơn vẻ ngoài: chúng là những hàm
 * quyết định HÌNH DÁNG tất định của thành phố, nên một bản trôi khỏi ba bản kia (đổi `10000` thành
 * `1000` cho "mịn hơn" chẳng hạn) sẽ làm một phần thành phố đổi hình vĩnh viễn trong khi phần còn
 * lại đứng yên — và không có gì đỏ lên, vì mỗi bản vẫn tự nhất quán với chính nó.
 *
 * Đặt ở đây là đúng chỗ: chúng chỉ phụ thuộc `hashId`, không phụ thuộc gì khác, nên file lá này
 * vẫn không có đường nào sinh ra vòng import (xem ghi chú dài phía trên).
 */

/** Băm → số thực trong [0, 1). Dùng cho mọi biến thể "trông ngẫu nhiên nhưng vĩnh viễn không đổi". */
export function unit(key) {
  return (hashId(key) % 10000) / 10000;
}

/** Băm → số thực trong [−1, 1). Dùng cho độ lệch hai chiều (lệch trái/phải, cao/thấp). */
export function signed(key) {
  return unit(key) * 2 - 1;
}

/**
 * Băm → một chỉ số nguyên trong `[0, count)`. Dùng để CHỌN trong một danh sách.
 *
 * ⚠️ Không viết `Math.floor(unit(key) * count)`: `unit` đã cắt về 4 chữ số nên phép nhân rồi làm
 * tròn ấy lệch tần suất ở những `count` không chia hết cho 10000. Chia dư thẳng trên số băm gốc
 * mới cho phân bố đều.
 */
export function pickIndex(key, count) {
  const n = Math.max(1, Math.floor(count) || 1);
  return hashId(key) % n;
}
