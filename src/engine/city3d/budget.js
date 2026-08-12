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
export const MAX_TRIANGLES_PER_BUILDING = 8000;

/**
 * Trần tam giác cho toàn bộ công trình của MỘT thành phố (5 bản vẽ, tất cả cấp 3).
 * Đây là con số quyết định máy có nóng không, vì nó còn bị vẽ LẦN THỨ HAI khi dựng bản đồ bóng đổ.
 */
export const MAX_TRIANGLES_PER_CITY = 24000;

/**
 * Trần cho toàn cảnh: công trình + nền + đường + cảnh vật + cư dân.
 * ⚠️ Nền (144 ô) và cư dân đi qua `InstancedMesh` nên chúng rẻ hơn nhiều so với con số tam giác
 * gợi ý — một lệnh vẽ cho cả trăm thực thể. Ngưỡng này vẫn tính đủ chúng để phòng trường hợp
 * sau này có ai đó bỏ instancing đi.
 */
export const MAX_TRIANGLES_PER_SCENE = 60000;

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
