/**
 * uiSkins.js
 * ─────────────────────────────────────────────────────────────────────────────
 * NGUỒN SỰ THẬT DUY NHẤT về bộ giao diện (skin): có những skin nào, và cái nào là mặc định.
 *
 * ⚠️ VÌ SAO PHẢI TÁCH RA MỘT FILE RIÊNG — MỘT LUẬT MỘT CÔNG THỨC.
 * Trước 2026-08-27, danh sách này được chép NGUYÊN VĂN ở hai nơi trong `settingsStore.js` (bộ đặt
 * `setUiSkin` và bộ nạp lại từ localStorage). Thêm một skin mà chỉ sửa một chỗ thì skin ấy bị đá
 * về mặc định ở đúng MỘT trong hai đường đi — và không có gì đỏ lên, vì cả hai nhánh đều "chạy
 * đúng"; triệu chứng chỉ là "chọn xong, thoát ra vào lại thì mất". Nay chỉ còn một nơi để sửa.
 *
 * File này CỐ Ý không import gì cả (thuần, không phụ thuộc): `settingsStore.js` kéo theo engine âm
 * thanh + engine thông báo, nên một script Node (vd `scripts/shot.mjs`) không nạp nổi store chỉ để
 * hỏi "mặc định là skin nào". Chép tay con số ấy sang script là đúng quả mìn `BUILDING_SCALE = 0.86`
 * đã ghi ở `CLAUDE.md`: hôm nay đúng, và sai vĩnh viễn trong im lặng vào ngày ai đó đổi mặc định.
 */

/** Mọi skin hợp lệ. Thứ tự ở đây KHÔNG quyết định thứ tự hiện trên màn hình (đó là việc của
 *  `SKIN_OPTIONS` trong `Settings.jsx`) — nhưng mỗi giá trị ở đây PHẢI có một mục ở đó và một khối
 *  `[data-skin="…"]` trong `src/index.css`. Có test khoá cả ba chiều: `src/store/uiSkins.test.js`. */
export const UI_SKINS = ['arcade', 'editorial', 'aurora', 'inkgold', 'swiss'];

/** Skin của một máy chưa từng lưu lựa chọn nào.
 *  ⚠️ Đổi giá trị này KHÔNG đổi được giao diện của máy đã lưu lựa chọn cũ — dữ liệu đã lưu thắng
 *  mặc định (đúng như phải thế: đó là lựa chọn của người dùng). Nó chỉ áp cho máy mới / bản lưu cũ
 *  chưa có trường `uiSkin`. */
export const DEFAULT_UI_SKIN = 'arcade';

/** Giá trị rác (bản lưu cũ, sửa tay localStorage) không được lọt vào chỗ quyết định giao diện. */
export const normalizeUiSkin = (skin) => (UI_SKINS.includes(skin) ? skin : DEFAULT_UI_SKIN);
