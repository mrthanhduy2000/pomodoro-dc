/**
 * labelMark.js — sinh "ký hiệu tắt" 1-2 chữ cái từ nhãn (label) để hiện trong badge/icon tròn
 * (thành tích, kỹ năng, công trình, bản vẽ, di vật...). Trước đây bị chép tay ~7 lần rải rác
 * khắp components — gộp về đây, giữ NGUYÊN hành vi từng nơi gọi (kể cả các trường hợp biên).
 */

export function initialsFromLabel(label) {
  return String(label ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function getLabelMark(label, fallback = 'NA') {
  return initialsFromLabel(label ?? fallback) || fallback;
}

/**
 * getGlyph — trả về BIỂU TƯỢNG thật nếu dữ liệu có, ngược lại mới rơi về ký hiệu 2 chữ cái.
 *
 * VÌ SAO CÓ HÀM NÀY (đo 2026-09-01): dự án đã vẽ tay 513 biểu tượng nằm sẵn trong dữ liệu
 * (360 thành tích · 75 bản vẽ · 36 nút kỹ năng · 15 di vật · 14 nhóm · 7 cộng hưởng · 6 loại
 * việc) — mỗi cái là một lựa chọn có chủ đích, hợp với đúng cái tên bên cạnh nó. Nhưng MỌI màn
 * sưu tập lại hiện ký hiệu tắt do `getLabelMark` sinh ra: "NH" · "KG" · "CB" · "VC" · "DS" ·
 * "C5" · "RL". Hai chữ cái viết hoa thì không nói được gì — 360 thành tích ra 360 cái nhãn
 * xam xám giống hệt nhau, và phần thưởng của việc đi hết một bộ sưu tập biến mất.
 *
 * VÌ SAO VẪN GIỮ ĐƯỜNG RƠI VỀ: hai chỗ thật sự KHÔNG có biểu tượng —
 *   (a) loại việc do Đàm tự tạo (`CategoryManager` ghi `icon: ''`),
 *   (b) bất kỳ dữ liệu cũ nào thiếu trường này.
 * Ở hai chỗ đó ký hiệu tắt vẫn tốt hơn một ô trống, nên đây là phép CỘNG THÊM thuần: chỗ nào
 * có biểu tượng thì đẹp lên, chỗ nào không có thì giữ nguyên như cũ. Không cần migration.
 *
 * ⚠️ Chuỗi rỗng phải bị coi là "không có" — `icon ?? mark` sẽ trả về chuỗi rỗng và vẽ ra một ô
 * trắng, đúng loại lỗi im lặng mà không cổng nào bắt được.
 */
export function getGlyph(icon, label, fallback = 'NA') {
  const glyph = String(icon ?? '').trim();
  return glyph || getLabelMark(label, fallback);
}

/**
 * hasGlyphIcon — dữ liệu CÓ cấp biểu tượng thật không? Dùng để chọn CỠ CHỮ cho ô biểu tượng:
 * một emoji cần to (~26px trong ô 56px), một ký hiệu 2 chữ cái cần nhỏ + giãn chữ.
 *
 * ⚠️ ĐỪNG đoán bằng cách soi chuỗi glyph (kiểu "không chứa chữ cái thì là emoji"). Đã thử và đo:
 * 517/518 biểu tượng đúng, nhưng kỷ có một biểu tượng là `π` — một CHỮ CÁI Hy Lạp — nên phép
 * đoán ấy sai ngay hôm nay, và nó sẽ sai thêm trong im lặng vào ngày ai đó thêm một biểu tượng
 * dạng chữ. Đây đúng là cái bẫy "một thứ đại diện là một giả định mỹ thuật đội lốt một phép đo".
 * Câu hỏi thật là *"dữ liệu có cấp biểu tượng không"* — và chỗ DUY NHẤT biết câu trả lời là
 * chính trường `icon`, nên hãy hỏi thẳng nó.
 */
export function hasGlyphIcon(icon) {
  return String(icon ?? '').trim().length > 0;
}
