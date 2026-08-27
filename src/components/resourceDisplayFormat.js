/**
 * resourceDisplayFormat.js — ba luật trình bày số của thanh tài nguyên, tách ra để TEST được.
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ VÌ SAO KHÔNG ĐỂ TRONG `ResourceDisplay.jsx`: bộ chạy test của dự án là `node --test`
 * thuần, KHÔNG biên dịch JSX — mọi thứ nằm trong file `.jsx` là thứ không bài test nào chạm
 * tới được. Mà `CLAUDE.md` đã ghi rõ: *"một bài học được ghi ra KHÔNG chặn được gì; chỉ một
 * bài TEST mới chặn được"*. Cùng quy ước với `statsFormatters.js` ↔ `StatsDashboard.jsx`.
 *
 * Ba luật, mỗi luật MỘT công thức duy nhất — đừng chép giá trị sang chỗ khác, vì một luật
 * hai công thức thì sớm muộn một bên trôi mà không có gì đỏ lên (bài học đã trả giá nhiều lần).
 */

/** Giữ màu `--good` bao lâu sau khi một con số tăng (mili-giây). */
export const FLASH_MS = 400;

/**
 * Nhãn/đơn vị nhỏ hơn con số 40% ⇒ hệ số 0,6.
 * Đây chính là thứ quyết định "con số là thứ đọc trước": trong cùng một hàng, mắt bám cái to.
 */
export const LABEL_SCALE = 0.6;

/** Cỡ chữ nhãn suy từ cỡ chữ số. Dùng cho MỌI cặp số↔nhãn trong thanh tài nguyên. */
export function labelSizeFor(numberPx) {
  return Math.round(numberPx * LABEL_SCALE);
}

/**
 * Mọi con số của thanh tài nguyên đi qua kiểu này.
 * `tabular-nums` = mọi chữ số rộng bằng nhau ⇒ cột số không giật ngang khi giá trị đổi
 * (ở font tỉ lệ thì `1` hẹp hơn `8`, nên `11` và `88` lệch nhau vài điểm ảnh).
 */
export const NUMBER_STYLE = Object.freeze({ fontVariantNumeric: 'tabular-nums' });

/**
 * Chỉ nháy khi con số THẬT SỰ TĂNG.
 * ⚠️ Lần dựng đầu tiên (`prev` chưa có) KHÔNG nháy — mở app mà cả thanh nháy xanh thì cú
 * nháy ấy mất sạch ý nghĩa. Số GIẢM cũng không nháy: `--good` mang nghĩa "vừa được thêm".
 */
export function shouldFlashOnIncrease(prev, next) {
  if (!Number.isFinite(prev) || !Number.isFinite(next)) return false;
  return next > prev;
}

/** `Kỷ 7 · chặng 2/4`. Không có chặng thì chỉ còn `Kỷ 7` (đừng bịa `chặng 1/1`). */
export function formatEraStageLabel(era, stage) {
  if (!stage || !Number.isFinite(stage.index) || !Number.isFinite(stage.totalStages)) {
    return `Kỷ ${era}`;
  }
  return `Kỷ ${era} · chặng ${stage.index + 1}/${stage.totalStages}`;
}
