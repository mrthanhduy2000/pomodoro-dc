/**
 * themeBridge.js — đọc token màu của app từ DOM để cảnh 3D dùng.
 *
 * ⚠️ CÁI BẪY LỚN NHẤT Ở ĐÂY: `data-theme`/`data-skin` KHÔNG nằm trên `document.documentElement`
 * mà trên một div BÊN TRONG (`src/App.jsx`, div gốc của khung app). Đọc từ `documentElement` sẽ
 * luôn ra token mặc định của theme sáng — tức là **sai màu ở 7 trong 8 tổ hợp** theme × skin, mà
 * lại sai một cách âm thầm (vẫn ra màu, chỉ là màu của giao diện khác).
 * Vì vậy hàm dưới đây leo NGƯỢC từ chính canvas lên tới phần tử gần nhất có `data-theme`.
 *
 * ⚠️ Skin `inkgold` ép `data-theme="dark"` bất kể `uiTheme` — thêm một lý do nữa phải đọc từ DOM
 * thật thay vì suy ra từ giá trị trong settingsStore.
 *
 * Phần dịch màu sang số (thuần, có test) nằm ở `src/engine/city3d/palette3d.js`.
 */

import { FALLBACK_TOKENS } from '../../../engine/city3d/palette3d';

/** Tên biến CSS ↔ khoá trong bảng token. Đổi ở đây thì phải đổi kèm `FALLBACK_TOKENS`. */
const TOKEN_VARS = {
  canvas2: '--canvas-2',
  ink:     '--ink',
  line:    '--line',
  accent:  '--accent',
};

/**
 * Tìm phần tử thật sự mang theme. Leo từ `el` lên cho tới khi gặp `[data-theme]`.
 * Không tìm thấy (canvas chưa gắn vào cây, hoặc cấu trúc app đổi) → dùng `documentElement` như
 * lưới cuối, vì thà lấy màu mặc định còn hơn ném lỗi giữa lúc dựng cảnh.
 */
export function findThemeRoot(el) {
  const start = el?.closest?.('[data-theme]');
  if (start) return start;
  if (typeof document === 'undefined') return null;
  return document.querySelector('[data-theme]') ?? document.documentElement;
}

/**
 * Đọc bộ token màu hiện hành.
 * @param {Element} el phần tử bất kỳ NẰM TRONG cây app (thường là chính canvas)
 * @returns {{canvas2:string, ink:string, line:string, accent:string}}
 */
export function readThemeTokens(el) {
  const root = findThemeRoot(el);
  if (!root || typeof getComputedStyle !== 'function') return { ...FALLBACK_TOKENS };

  const style = getComputedStyle(root);
  const tokens = { ...FALLBACK_TOKENS };
  for (const [key, cssVar] of Object.entries(TOKEN_VARS)) {
    const value = style.getPropertyValue(cssVar)?.trim();
    if (value) tokens[key] = value;
  }
  return tokens;
}

/**
 * Chữ ký của theme hiện tại — để biết CÓ CẦN đọc lại token hay không mà khỏi gọi
 * `getComputedStyle` (khá đắt) mỗi khung hình.
 */
export function readThemeSignature(el) {
  const root = findThemeRoot(el);
  if (!root?.getAttribute) return 'none';
  return `${root.getAttribute('data-theme') ?? '?'}/${root.getAttribute('data-skin') ?? '?'}`;
}
