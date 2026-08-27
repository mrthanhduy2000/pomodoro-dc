/**
 * cityTokens.js — token thiết kế DÙNG CHUNG cho màn hình Thành Phố (mọi bộ vẽ).
 *
 * ⚠️ QUY TẮC MÀU (app có 2 theme × 5 skin = 10 tổ hợp, sai là chữ/khối tàng hình):
 *   - Mọi màu "khung" (nền, viền, chữ) PHẢI dùng CSS variable: `var(--canvas)`, `var(--panel)`,
 *     `var(--ink)`, `var(--muted)`, `var(--line)`, `var(--accent)`…
 *   - Màu RIÊNG của mỗi kỷ lấy từ `ERA_METADATA[era].accentColor` **đã có sẵn** — KHÔNG bịa bảng
 *     màu mới. Sắc kỷ luôn được vẽ ở dạng RGBA trong suốt CHỒNG LÊN nền `var(--canvas-2)`, nên nó
 *     tự sáng lên ở theme sáng và tự chìm xuống ở theme tối mà không cần 2 bảng màu.
 *
 * `bgClass: 'era-book1'` trong `ERA_METADATA` vẫn không có dòng CSS nào dùng — ở đây ta dùng
 * `accentColor` chứ không dùng `bgClass`.
 *
 * Thứ RIÊNG của từng bộ vẽ (kích thước ô, bảng màu isometric, phép chiếu) nằm ở
 * `render2d/tokens2d.js` — không để lẫn vào đây.
 */

import { ERA_METADATA } from '../../engine/constants';

const FALLBACK_ACCENT = '#c96442';   // trùng `--accent` mặc định, chỉ dùng khi kỷ không hợp lệ

/** '#4ade80' → { r, g, b }. Chấp nhận cả dạng 3 ký tự. Sai định dạng → dùng màu dự phòng. */
function hexToRgb(hex) {
  const raw = typeof hex === 'string' ? hex.trim().replace('#', '') : '';
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hexToRgb(FALLBACK_ACCENT);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Màu kỷ ở dạng rgba() — luôn vẽ chồng lên nền theo theme nên hợp cả 10 tổ hợp giao diện. */
export function eraTint(era, alpha) {
  const { r, g, b } = hexToRgb(ERA_METADATA[era]?.accentColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Màu đặc của kỷ — chỉ dùng cho nét mảnh/nhãn nhỏ, không dùng làm nền lớn. */
export function eraSolid(era) {
  return ERA_METADATA[era]?.accentColor ?? FALLBACK_ACCENT;
}

/** Khuôn thẻ chuẩn của app — copy từ `FocusRail.jsx` để mọi thẻ trông như nhau ở cả 5 skin. */
export const cardStyle = {
  background: 'var(--card-bg-solid)',
  border: 'var(--skin-card-border-width,1px) solid var(--line)',
  borderRadius: 'var(--skin-radius-card,18px)',
  boxShadow: 'var(--skin-card-shadow)',
};
