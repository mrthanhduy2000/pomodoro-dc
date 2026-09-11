/**
 * budget.js — ngân sách hiệu năng ở dạng MÁY TỰ KIỂM ĐƯỢC.
 *
 * THUẦN: chỉ đếm trên tầng mô tả, không dựng gì cả.
 *
 * ⚠️ VÌ SAO KHÔNG ĐỂ NGÂN SÁCH NẰM TRONG TÀI LIỆU:
 * "giữ dưới 50.000 tam giác" viết trong tài liệu là một lời hứa không ai kiểm. Chỉ cần một lần
 * thêm chi tiết trang trí cho đẹp là nó vỡ trong im lặng, và thứ Đàm nhận được là điện thoại nóng
 * lên chứ không phải một dòng test đỏ. Đặt ngưỡng ở đây rồi cho `budget.test.js` chạy qua CẢ 75
 * công trình mỗi lần `npm test` thì việc vượt ngân sách trở thành lỗi build, phát hiện trước khi
 * push chứ không phải sau khi deploy.
 *
 * Các con số dưới đây là ngưỡng TRẦN, không phải mục tiêu: thực đo hiện tại thấp hơn nhiều
 * (xem dòng in ra ở cuối `budget.test.js`). Khoảng dư đó là chỗ cho các phase hiệu ứng sau này.
 */

import { countSpecTriangles } from './parts';

/**
 * Trần tam giác cho MỘT công trình. Kỳ quan cấp 3 là ca nặng nhất.
 * Vượt ngưỡng = chi tiết đã vượt khỏi mức mắt phân biệt được ở cỡ hiển thị thật.
 */
/*
  ══════════════════════════════════════════════════════════════════════════════════════════════
  ⚠️ ROUND 53 (ADR-093) — BA CON SỐ DƯỚI ĐÂY THÔI LÀM CỔNG, CHÚNG THÀNH MÁY DÒ CHẠY LOẠN
  ══════════════════════════════════════════════════════════════════════════════════════════════
  Đàm gỡ trần tam giác bằng lời, ba vòng liên tiếp, và vòng 53 nói rõ nhất:

    *"HÌNH HỌC GẦN NHƯ MIỄN PHÍ — đã đo từ vòng 47 và chưa ai bác: 43% chênh lệch tam giác giữa
    hai kỷ chỉ đổi 2,4% thời gian. Đừng tiếc tam giác. Thành phố trông 'low' vì có người tiết kiệm
    nhầm chỗ, không phải vì máy yếu."*
    *"KHÔNG đo hiệu năng. KHÔNG trần tam giác. KHÔNG trần khối/người. KHÔNG trần lệnh vẽ."*

  ⚠️ NHƯNG KHÔNG XOÁ PHÉP ĐO, VÀ ĐÂY LÀ CHỖ DỄ LÀM SAI NHẤT. Một cái trần làm HAI việc khác nhau:
    (a) *"chi tiết đã vượt mức mắt phân biệt được"* — một quyết định THIẾT KẾ, và Đàm đã bác nó;
    (b) *"có ai đó vừa lồng nhầm một vòng lặp"* — một cái lưới bắt LỖI, và nó vẫn cần thiết.
  Xoá cả hai là vứt (b) đi cùng với (a). Nên các con số nay đặt ở mức **mười lần** mức thật: chúng
  không còn chặn một bản vá làm đẹp, mà vẫn đỏ ngay nếu một khối được dựng gấp trăm lần cần thiết.

  ⚠️ VÀ CÁI LƯỚI THẬT KHÔNG PHẢI CON SỐ NÀY. Nó là bài *"không công trình nào là ca đặc biệt"* ở
  `buildingSpec.test.js`: một QUAN HỆ (công trình nặng nhất so với trung vị của chính kỷ ấy), nên
  nó không bao giờ phải nâng, và nó bắt được chạy loạn kể cả khi cả thành phố cùng nặng lên.
*/
export const MAX_TRIANGLES_PER_BUILDING = 120000;

/**
 * Trần tam giác cho toàn bộ công trình của MỘT thành phố (5 bản vẽ, tất cả cấp 3).
 * Đây là con số quyết định máy có nóng không, vì nó còn bị vẽ LẦN THỨ HAI khi dựng bản đồ bóng đổ.
 */
export const MAX_TRIANGLES_PER_CITY = 240000;

/**
 * Trần cho toàn cảnh: công trình + nền + đường + cảnh vật + cư dân.
 * ⚠️ Nền (144 ô) và cư dân đi qua `InstancedMesh` nên chúng rẻ hơn nhiều so với con số tam giác
 * gợi ý — một lệnh vẽ cho cả trăm thực thể. Ngưỡng này vẫn tính đủ chúng để phòng trường hợp
 * sau này có ai đó bỏ instancing đi.
 */
export const MAX_TRIANGLES_PER_SCENE = 600000;

/** Tổng tam giác của một danh sách mô tả (mỗi phần tử có `.parts` hoặc chính là mảng khối). */
export function specTriangles(spec) {
  if (!spec) return 0;
  if (Array.isArray(spec)) return countSpecTriangles(spec);
  return countSpecTriangles(spec.parts);
}

/** Tổng tam giác của nhiều mô tả cộng lại. */
export function totalTriangles(specs) {
  if (!Array.isArray(specs)) return 0;
  let total = 0;
  for (const spec of specs) total += specTriangles(spec);
  return total;
}

/**
 * Chấm một con số so với ngưỡng.
 * @returns {{ok:boolean, used:number, limit:number, ratio:number}}
 */
export function checkBudget(used, limit) {
  const value = Number.isFinite(used) ? used : 0;
  const cap = Number.isFinite(limit) && limit > 0 ? limit : 1;
  return { ok: value <= cap, used: value, limit: cap, ratio: value / cap };
}

/** Câu mô tả ngắn cho HUD / thông báo test — "12.340 / 24.000 tam giác (51%)". */
export function describeBudget(used, limit) {
  const { used: u, limit: l, ratio } = checkBudget(used, limit);
  return `${u.toLocaleString('vi-VN')} / ${l.toLocaleString('vi-VN')} tam giác (${Math.round(ratio * 100)}%)`;
}
