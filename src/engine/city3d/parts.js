/**
 * parts.js — bộ chữ cái của ngôn ngữ hình khối. Mọi công trình trong thành phố đều viết bằng đúng
 * HAI hình nguyên thuỷ ở file này, không có hình thứ ba.
 *
 * THUẦN: không import three, không DOM, không `Date`, không `Math.random`. Đây chỉ là MÔ TẢ hình
 * học ở dạng dữ liệu; việc biến mô tả thành đối tượng GPU là của `components/city/render3d/`.
 * Nhờ ranh giới này, toàn bộ "kiến trúc" của 75 công trình test được bằng `node --test` mà không
 * cần trình duyệt — đúng kỷ luật đã áp cho tầng engine của AI Coach (ARCHITECTURE.md §7).
 *
 * ⚠️ VÌ SAO CHỈ HAI HÌNH:
 * Mỗi kiểu hình mới là một nhánh mã mới ở nhà máy hình học, một cách đếm tam giác mới, một chỗ có
 * thể sai lệch giữa "ngân sách dự tính" và "thứ thật sự vẽ ra". `prism` có tham số đã phủ được
 * hộp / kim tự tháp / trụ tròn / nón / tháp thóp dần / mái vòm chỉ bằng cách đổi `sides` và
 * `taper`; `gable` lo phần mái dốc hai bên — thứ duy nhất `prism` không diễn tả nổi mà lại là
 * đường nét làm cho một khối hộp TRÔNG RA căn nhà.
 */

/**
 * Các "vai màu". Phần mô tả KHÔNG bao giờ nói màu cụ thể — nó chỉ nói vai trò, còn màu thật do
 * bảng màu theo kỷ + theo theme quyết định (`engine/city3d/palette3d.js`). Đây là cách giữ đúng
 * tinh thần luật "chỉ dùng CSS variable, cấm hardcode hex" ở một nơi mà CSS variable không với tới.
 */
export const PART_ROLES = [
  'wall',    // thân nhà
  'wall2',   // mảng tường phụ, sáng/tối hơn thân một chút cho đỡ phẳng
  'roof',    // mái
  'trim',    // gờ, diềm, bậc
  'wood',    // gỗ, giàn giáo, cột kèo
  'stone',   // đá, móng, tường thành
  'gold',    // điểm nhấn quý: chóp, tượng, biển hiệu
  'glass',   // cửa sổ, kính
  'leaf',    // cây cối
  'dark',    // bóng sâu, cửa ra vào, khe hở
];

const ROLE_SET = new Set(PART_ROLES);

/** Số cạnh cho phép của lăng trụ. Dưới 3 thì không thành khối; trên 12 thì tốn tam giác vô ích. */
export const MIN_SIDES = 3;
export const MAX_SIDES = 12;

function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeRole(role) {
  return ROLE_SET.has(role) ? role : 'wall';
}

/**
 * Lăng trụ đều có thể thóp dần — hình nguyên thuỷ chủ lực.
 *
 * `sides` + `taper` phủ gần hết nhu cầu:
 *   - `sides: 4, taper: 1`    → hộp vuông (thân nhà)
 *   - `sides: 4, taper: 0`    → kim tự tháp (chóp tháp)
 *   - `sides: 4, taper: 0.6`  → tháp thóp dần (kiểu tháp canh)
 *   - `sides: 8, taper: 1`    → trụ tròn (cột, ống khói)
 *   - `sides: 8, taper: 0`    → nón (mái rơm, mái chóp)
 *   - `sides: 8, taper: 0.55` → nửa vòm (chồng 2 tầng thành mái vòm Phục Hưng)
 *
 * ⚠️ `y` là ĐÁY của khối, không phải tâm. Xếp chồng nhà theo tầng bằng cách cộng dồn chiều cao là
 * thao tác diễn ra hàng trăm lần trong file mô tả; lấy tâm làm gốc thì lần nào cũng phải chia đôi
 * và đó đúng là chỗ sinh lỗi lệch nửa tầng.
 */
export function prism({
  x = 0, y = 0, z = 0,
  w = 1, h = 1, d = null,
  sides = 4,
  taper = 1,
  ry = 0,
  role = 'wall',
} = {}) {
  const width = Math.max(0, finite(w, 1));
  return {
    shape: 'prism',
    x: finite(x, 0),
    y: finite(y, 0),
    z: finite(z, 0),
    w: width,
    h: Math.max(0, finite(h, 1)),
    // Thiếu chiều sâu thì lấy bằng chiều rộng — phần lớn khối trong thành phố là vuông, viết
    // `d` mỗi lần chỉ làm file mô tả dài ra mà không thêm thông tin gì.
    d: Math.max(0, finite(d, width)),
    sides: Math.round(clamp(finite(sides, 4), MIN_SIDES, MAX_SIDES)),
    taper: clamp(finite(taper, 1), 0, 1),
    ry: finite(ry, 0),
    role: safeRole(role),
  };
}

/**
 * Mái dốc hai phía. Nóc chạy dọc trục X khi `ry = 0`.
 *
 * ⚠️ `w` là bề ngang CHÂN mái (bằng bề ngang thân nhà), `h` là chiều cao từ chân lên nóc. Mái
 * thò ra khỏi tường (`overhang`) là chi tiết nhỏ nhưng chính nó tạo ra vệt bóng dưới diềm mái —
 * thứ khiến khối trông có bề dày thay vì như dán giấy.
 */
export function gable({
  x = 0, y = 0, z = 0,
  w = 1, h = 0.5, d = null,
  ry = 0,
  role = 'roof',
} = {}) {
  const width = Math.max(0, finite(w, 1));
  return {
    shape: 'gable',
    x: finite(x, 0),
    y: finite(y, 0),
    z: finite(z, 0),
    w: width,
    h: Math.max(0, finite(h, 0.5)),
    d: Math.max(0, finite(d, width)),
    ry: finite(ry, 0),
    role: safeRole(role),
  };
}

/**
 * Số tam giác của MỘT khối. Đây là con số dùng cho cả ngân sách hiệu năng lẫn bảng HUD, nên nó
 * phải khớp CHÍNH XÁC với số tam giác nhà máy hình học thật sự sinh ra — có test đối chiếu hai
 * bên, vì một ngân sách tự tính riêng mà lệch với thực tế thì còn tệ hơn không có ngân sách.
 */
export function countTriangles(part) {
  if (!part) return 0;
  if (part.shape === 'gable') {
    // 2 mặt dốc (2 tam giác mỗi mặt) + 2 đầu hồi tam giác + đáy (2 tam giác)
    return 8;
  }
  const n = part.sides ?? 4;
  if (part.taper === 0) {
    // thóp về một điểm: mặt bên thành tam giác, không còn mặt trên
    return n + (n - 2);
  }
  return 2 * n + 2 * (n - 2);
}

/** Tổng tam giác của một danh sách khối. */
export function countSpecTriangles(parts) {
  if (!Array.isArray(parts)) return 0;
  let total = 0;
  for (const part of parts) total += countTriangles(part);
  return total;
}

/**
 * Chiều cao đỉnh của một danh sách khối — dùng để đặt khung bóng đổ và ngắm camera cho vừa.
 * Lấy `y + h` chứ không phải chỉ `h`, vì khối xếp chồng có `y` khác nhau.
 */
export function specHeight(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return 0;
  let top = 0;
  for (const part of parts) top = Math.max(top, (part?.y ?? 0) + (part?.h ?? 0));
  return top;
}

/**
 * Bề ngang lớn nhất mà danh sách khối chiếm — để công trình không lấn sang ô bên cạnh.
 * Tính theo hình bao vuông (không xoay), hơi rộng hơn thực tế một chút khi khối có `ry` — cố ý:
 * ước lượng THỪA thì cùng lắm là hai nhà cách nhau hơi xa, ước lượng THIẾU thì chúng cắm vào nhau.
 */
export function specSpan(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return 0;
  let span = 0;
  for (const part of parts) {
    if (!part) continue;
    const halfW = (part.w ?? 0) / 2;
    const halfD = (part.d ?? 0) / 2;
    // khối xoay thì hình bao của nó nở ra tới đường chéo
    const reach = part.ry ? Math.hypot(halfW, halfD) : Math.max(halfW, halfD);
    span = Math.max(
      span,
      Math.abs(part.x ?? 0) + reach,
      Math.abs(part.z ?? 0) + reach,
    );
  }
  return span * 2;
}
