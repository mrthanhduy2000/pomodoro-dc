/**
 * handmade.js — MÉO THỦ CÔNG, TẤT ĐỊNH (round 56, Việc 0).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO GIẢM SỐ CẠNH THÔI THÌ CHƯA ĐỦ
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Vòng 55 cho vách đất và lều 48 cạnh, và chúng thành khối tiện máy hoàn hảo. Cách chữa hiển
 * nhiên là hạ số cạnh xuống — nhưng một hình mười cạnh ĐỀU vẫn là máy tiện, chỉ thô hơn. Thứ mắt
 * đọc ra "đắp bằng tay" không phải ÍT MẶT, mà là **MẶT KHÔNG ĐỀU NHAU**: chỗ dày chỗ mỏng, vành
 * dưới phình hơn vành trên, hai căn cạnh nhau không căn nào giống căn nào.
 *
 * ⚠️ TẤT ĐỊNH LÀ RÀNG BUỘC, KHÔNG PHẢI LỰA CHỌN (luật số 2 của mọi vòng, và Đàm nhắc lại đúng cái
 * méo này ở vòng 56: *"kể cả cái méo thủ công ở Việc 0, nó phải là hàm của vị trí"*). Một kỷ đã
 * niêm phong phải mở ra y hệt sau năm năm, nên `Math.random` bị cấm tuyệt đối. Cái méo ở đây là
 * một HÀM BĂM của (vị trí thế giới · cao độ vành · chỉ số đỉnh): cùng một căn lều ở cùng một chỗ
 * thì méo y hệt, vĩnh viễn; hai căn cách nhau nửa ô lưới thì méo khác hẳn.
 *
 * ⚠️ CHỈ ĐƯỢC MÉO **VÀO TRONG**, KHÔNG BAO GIỜ RA NGOÀI — và đây là điều kiện sống còn của ADR-007.
 * Hệ số trả về luôn nằm trong `[1 − biên, 1]`, nên khối chỉ CO LẠI. Hình bao vì thế an toàn theo
 * CẤU TRÚC, không nhờ một cái kẹp ở xa — đúng luật số một của vòng 54 ("kẹp mọi thứ nở ra trong
 * hình bao cũ ngay từ đầu, đừng chờ test bắt"). Nếu ngày nào đó ai muốn méo ra ngoài, phải đọc
 * `specSpan`/`specFootprint` và `block.js` trước, vì `block.js` co từng đơn vị theo HÌNH BAO.
 */

/**
 * Băm ba số nguyên thành một số thực trong `[0, 1)`. Thuần, tất định, không phụ thuộc nền tảng.
 *
 * ⚠️ TOÁN TỬ `>>> 0` Ở MỖI BƯỚC LÀ BẮT BUỘC: thiếu nó thì phép nhân vượt 2^53 và JavaScript bắt
 * đầu làm tròn, tức hàm "tất định" này sẽ trả số khác nhau cho cùng đầu vào tuỳ ngữ cảnh tối ưu
 * của máy ảo. Đây là cùng họ lỗi với `hashId.js`, và nó im lặng hoàn toàn.
 */
function bam(a, b, c) {
  let h = 2166136261 >>> 0;
  for (const v of [a | 0, b | 0, c | 0]) {
    h = (h ^ (v & 0xffff)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
    h = (h ^ (v >>> 16)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 8) / 16777216;
}

/** Lưới lượng tử hoá vị trí thế giới. Nhỏ hơn thì hai khối sát nhau vẫn méo khác nhau. */
const LUOI = 512;

/**
 * Hệ số bán kính của MỘT đỉnh trên MỘT vành của một khối "làm thủ công".
 *
 * @param {number} ox,oz  vị trí thế giới của khối (tâm) — để hai căn khác chỗ thì méo khác nhau
 * @param {number} y      cao độ của vành — để một căn méo khác nhau theo chiều cao
 * @param {number} i      chỉ số đỉnh quanh vành
 * @param {number} bien   biên độ méo (phần của bán kính), ví dụ 0,14
 * @returns {number} hệ số trong `[1 − bien, 1]` — LUÔN ≤ 1, xem cảnh báo ở đầu file
 */
export function handmadeFactor(ox, oz, y, i, bien) {
  if (!(bien > 0)) return 1;
  const gx = Math.round(ox * LUOI);
  const gz = Math.round(oz * LUOI);
  const gy = Math.round(y * LUOI);
  // Hai tần số: một cái đổi theo đỉnh (méo quanh vành), một cái đổi chậm theo cao độ (phình/thót
  // theo chiều cao). Cộng lại cho một bề mặt lồi lõm chứ không phải một ngôi sao đều cánh.
  const quanhVanh = bam(gx ^ (i * 374761393), gz, gy);
  const theoCao = bam(gx, gz ^ 0x5bf03635, Math.round(y * 6));
  const tron = quanhVanh * 0.68 + theoCao * 0.32;
  return 1 - bien * tron;
}

/** Biên độ mặc định cho vách đất, lều, mái tranh. Đủ để thấy, chưa tới mức méo thành hình sao. */
export const HANDMADE_WOBBLE = 0.14;
