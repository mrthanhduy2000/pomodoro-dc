/**
 * humanSeams.js — CÁI GÁC CHO MỘT HÌNH DẠNG LỖI ĐÃ XẢY RA NĂM LẦN. Round 58, Việc 1.
 *
 * THUẦN: không three, không DOM. Nó chỉ đọc danh sách khối của `buildHumanBody` và trả lời đúng
 * một câu: *"có đường viền màu nào đang nằm ở chỗ đời thật không có đường viền không?"* (Đàm, vòng 56).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * NĂM LẦN, CÙNG MỘT HÌNH DẠNG
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *   vòng 54  sáu khớp cầu vai `skin` trên tay áo sẫm → sáu cái **đinh tán trắng**
 *   vòng 54  cổ rộng 0,46 → một **vành cổ áo trắng** quanh chân đầu
 *   vòng 56  chân tóc là giao tuyến hai mặt tròn xoay → một **vạch ngang** quanh sọ
 *   49→56    vai màu `steel` không tới được chỗ vẽ → **mũ trụ mang màu vải**
 *   vòng 58  bàn tay viết cứng `skin` trên tay áo sẫm → hai **quả cầu trắng**
 * Cả năm đều lọt qua mọi bài test đang có và đều bị bắt bởi một tấm ảnh. Năm lần là quá đủ.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO KHÔNG LIỆT KÊ "MỌI CẶP KHỐI KỀ NHAU KHÁC MÀU" — ĐÃ THỬ, VÀ PHÉP ĐO ẤY VÔ DỤNG
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Cách hiển nhiên (và là cách Đàm gợi ý) là: liệt kê mọi cặp khối KỀ NHAU có màu khác nhau rồi đối
 * chiếu với một danh sách trắng. Tôi đã dựng đúng phép đo ấy trước khi viết file này. Kết quả:
 * **99 cặp** trên 15 kỷ — trong đó có `forearmR ↔ pelvis`, `carry ↔ head`, `head ↔ shoulderBall`.
 * Những cặp ấy "kề nhau" chỉ vì HỘP BAO của chúng chồng lên nhau, chứ hai bề mặt chẳng gặp nhau ở
 * đâu cả. Một danh sách trắng 99 dòng thì không ai đọc nổi, và một cái gác không ai đọc nổi là một
 * cái gác sắp bị nới cho qua chuyện. ⇒ Bỏ phép đo hình học, hỏi bằng CẤU TRÚC.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * LUẬT: MỘT KHỐI **NỐI DÀI** PHẢI MANG VAI MÀU CỦA ĐOẠN NÓ NỐI DÀI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Khối nối dài = thứ KHÔNG phải một vật riêng, chỉ là phần tiếp theo của một đoạn chi: quả cầu ở
 * khớp, bàn chân, ngón cái. Ngoài đời chúng không có đường viền nào — cái khuỷu tay không đổi màu
 * giữa cánh tay và cẳng tay. Ngược lại, `VIEN_CO_THAT` là những chỗ đời thật CÓ mép thật: cửa tay,
 * gấu áo, cổ áo, cạp quần, chân tóc, viền giày, và các nét trên mặt.
 * ⇒ Khai `continues: 'forearmL'` là khai *"khối này không phải một vật, nó là phần tiếp của cái kia"*.
 */

/**
 * Những chỗ ĐỜI THẬT CÓ một đường viền màu. Đây là danh sách để ĐỌC, không phải để nới:
 * thêm một dòng vào đây là tuyên bố *"ngoài đời chỗ này thật sự có một cái mép"*.
 */
export const VIEN_CO_THAT = Object.freeze([
  'cửa tay áo (tay áo ↔ bàn tay trần)',
  'gấu áo và cạp quần (áo ↔ chân)',
  'cổ áo (áo ↔ cổ)',
  'chân tóc (mũ tóc ↔ trán)',
  'vành mũ (mũ ↔ đầu)',
  'viền giày (ống quần ↔ giày)',
  'mắt · lông mày · miệng (nét trên mặt)',
]);

/**
 * Mọi khối nối dài đang mang vai màu KHÁC đoạn nó nối dài.
 * Rỗng = không có đường viền nào nằm sai chỗ.
 *
 * @returns {Array<{id, role, continues, expected}>}
 */
export function seamFaults(body) {
  const parts = body?.parts ?? [];
  const roleOf = new Map(parts.map((p) => [p.id, p.role]));
  const faults = [];
  for (const part of parts) {
    if (!part.continues) continue;
    const expected = roleOf.get(part.continues);
    if (expected === undefined) {
      faults.push({ id: part.id, role: part.role, continues: part.continues, expected: '(không có khối ấy)' });
      continue;
    }
    if (part.role !== expected) {
      faults.push({ id: part.id, role: part.role, continues: part.continues, expected });
    }
  }
  return faults;
}

/** Số khối đã khai `continues` — để một bài test biết cái gác có đang canh gì không. */
export function continuationCount(body) {
  return (body?.parts ?? []).filter((p) => p.continues).length;
}
