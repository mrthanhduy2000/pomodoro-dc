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

/** Cờ đánh dấu "máy này đã đi qua phép ép chuyển skin một lần rồi".
 *  Tên có đuôi `V1` để lần sau muốn ép chuyển nữa thì dùng `V2` — không tái dùng cờ cũ, vì tái
 *  dùng nghĩa là ép lại cả những máy đã ép rồi. */
export const SKIN_MIGRATION_FLAG = 'skinMigratedV1';

/**
 * "Máy này nên hiện skin nào sau khi nâng cấp?" — hàm THUẦN, không đụng store/localStorage.
 *
 * ⚠️ VÌ SAO PHẢI CÓ HÀM NÀY. Đổi `DEFAULT_UI_SKIN` KHÔNG đổi được giao diện của máy đã lưu lựa
 * chọn cũ — dữ liệu đã lưu thắng mặc định, và điều đó ĐÚNG (đó là lựa chọn của người dùng). Nhưng
 * nó có một mặt trái đã cắn thật ngày 2026-08-28: skin `editorial` nằm trong bản lưu của Đàm
 * KHÔNG phải vì anh chọn nó, mà vì hồi ấy nó là mặc định. Bảy bước làm lại giao diện (skin
 * `arcade`, nút bóng đặc, HUD gọn, toast thưởng, 5 tab, ba nhịp chuyển động) do đó chạy trên
 * production nhiều ngày mà **chủ dự án không nhìn thấy một thứ nào** — đúng cái bẫy
 * `cityHomeBackdrop` ở `settingsStore.migrate.test.js`: người dùng mới thì thấy, còn Đàm thì không.
 *
 * ⚠️ VÌ SAO ĐÚNG MỘT LẦN, VÀ VÌ SAO PHẢI CÓ CỜ RIÊNG thay vì so `uiSkin === 'editorial'`. So với
 * một giá trị cụ thể thì mọi lần nâng cấp sau đó đều ép lại — Đàm chọn `editorial` một cách CÓ Ý
 * sẽ bị đá về `arcade` ở lần bump version kế tiếp, và anh sẽ không hiểu vì sao lựa chọn của mình
 * không giữ được. Cái cờ phân biệt được hai chuyện mà giá trị skin không phân biệt nổi:
 * *"đang mang mặc định cũ"* và *"đã chọn, tình cờ trùng mặc định cũ"*.
 *
 * @param {object|null} stored bản lưu đọc từ localStorage (có thể thiếu trường, có thể rác)
 * @returns {{uiSkin: string, [SKIN_MIGRATION_FLAG]: true}} skin để dùng + cờ đã ép (luôn bật)
 */
export function resolveSkinAfterMigration(stored) {
  const safeStored = stored ?? {};
  // Đã ép rồi ⇒ tôn trọng tuyệt đối thứ đang lưu (vẫn chuẩn hoá để giá trị rác không lọt).
  if (safeStored[SKIN_MIGRATION_FLAG] === true) {
    return { uiSkin: normalizeUiSkin(safeStored.uiSkin), [SKIN_MIGRATION_FLAG]: true };
  }
  // Chưa ép bao giờ ⇒ đưa về mặc định hiện hành, đúng một lần, rồi bật cờ.
  return { uiSkin: DEFAULT_UI_SKIN, [SKIN_MIGRATION_FLAG]: true };
}
