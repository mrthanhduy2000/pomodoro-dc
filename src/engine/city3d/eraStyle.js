/**
 * eraStyle.js — "ngữ pháp" kiến trúc của 15 kỷ. Đây là TRỤC THỨ NHẤT của ngôn ngữ hình khối.
 *
 * THUẦN: chỉ dữ liệu + tra cứu. Không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY (thay vì tô màu khác nhau cho cùng một cái hộp):
 * Phase 3A vẽ mọi công trình bằng một khối hộp trắng, và phản hồi đầu tiên của Đàm khi nhìn thấy
 * đúng là "quá đơn giản và không đẹp". Màu sắc KHÔNG cứu được chuyện đó: thứ làm mắt người phân
 * biệt được một túp lều tranh với một toà nhà kính là ĐƯỜNG NÉT — độ dốc mái, độ thò của diềm,
 * cửa sổ hình gì, có cột hay không. Bảng dưới đây mã hoá đúng những đường nét ấy.
 *
 * Cách đọc một dòng: mỗi kỷ trả lời 6 câu — thân nhà hình gì, mái kiểu gì và dốc bao nhiêu, diềm
 * thò ra bao xa, cửa sổ kiểu gì, có những chi tiết đặc trưng nào, và nét vẽ gọn hay thô.
 */

/**
 * Kiểu mái. Mỗi giá trị là một cách gấp mái khác hẳn nhau, không phải cùng một mái đổi độ dốc:
 *   `cone`     nón tròn — mái rơm, lều
 *   `gable`    dốc hai phía — nhà gỗ, nhà đá
 *   `flat`     bằng — nhà đất, bê tông, kính
 *   `stepped`  giật cấp — ziggurat, mái bằng có tum
 *   `tiered`   nhiều tầng mái chồng, diềm cong — kiến trúc Á Đông
 *   `dome`     vòm — Phục Hưng, Khai Sáng
 *   `pyramid`  chóp bốn mặt — tháp, đền
 *   `sawtooth` răng cưa — nhà xưởng lấy sáng trời
 *   `blade`    phiến mỏng lơ lửng — kiến trúc tương lai
 */
export const ROOF_KINDS = [
  'cone', 'gable', 'flat', 'stepped', 'tiered', 'dome', 'pyramid', 'sawtooth', 'blade',
];

/**
 * Kiểu cửa sổ — quyết định nhịp điệu mặt tiền, thứ mắt bắt được ngay cả khi nhà rất nhỏ trên màn.
 *   `none` không có · `slit` khe hẹp đứng · `square` ô vuông thưa · `arch` vòm cuốn
 *   `grid` lưới đều · `curtain` dải kính liền · `neon` dải phát sáng
 */
export const WINDOW_KINDS = ['none', 'slit', 'square', 'arch', 'grid', 'curtain', 'neon'];

/**
 * 15 kỷ. `motifs` là các chi tiết đặc trưng mà `buildingSpec.js` biết cách dựng; thứ tự trong mảng
 * là thứ tự ưu tiên khi công trình nhỏ không đủ chỗ cho tất cả.
 *
 * `rough` (0..1) là độ "tay làm" của nét vẽ: kỷ tiền sử để cao cho khối lệch lạc tự nhiên, kỷ hiện
 * đại để 0 cho cạnh thẳng băng. Độ lệch vẫn TẤT ĐỊNH (suy từ băm id), không phải ngẫu nhiên.
 */
export const ERA_STYLES = {
  1: {
    name: 'đá thô & lều da thú',
    bodySides: 6, bodyTaper: 0.74, storyHeight: 0.62,
    roof: 'cone', roofPitch: 0.62, eaves: 0.16,
    windows: 'none',
    motifs: ['boulder', 'firepit'],
    rough: 0.9,
  },
  2: {
    name: 'vách đất & mái tranh',
    bodySides: 4, bodyTaper: 0.94, storyHeight: 0.66,
    roof: 'cone', roofPitch: 0.72, eaves: 0.2,
    windows: 'none',
    motifs: ['fence', 'granary'],
    rough: 0.62,
  },
  3: {
    name: 'gạch bùn & giật cấp',
    bodySides: 4, bodyTaper: 0.86, storyHeight: 0.6,
    roof: 'stepped', roofPitch: 0.3, eaves: 0.06,
    windows: 'slit',
    motifs: ['pillar', 'ramp'],
    rough: 0.36,
  },
  4: {
    name: 'mái chồng diềm cong',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.68,
    roof: 'tiered', roofPitch: 0.34, eaves: 0.34,
    windows: 'square',
    motifs: ['columns', 'banner'],
    rough: 0.22,
  },
  5: {
    name: 'đá tảng & mái dốc đứng',
    bodySides: 4, bodyTaper: 0.97, storyHeight: 0.72,
    roof: 'gable', roofPitch: 0.92, eaves: 0.12,
    windows: 'slit',
    motifs: ['buttress', 'crenel'],
    rough: 0.44,
  },
  6: {
    // ⚠️ Kỷ 6 (phong kiến Việt) và kỷ 4 (Tam Quốc) cùng họ kiến trúc mái chồng Á Đông — đúng về
    // lịch sử, nhưng test "15 kỷ phải phân biệt được" đã bắt đúng lúc hai kỷ này ra hình y hệt.
    // Hai nét tách chúng ra, đều có thật trong kiến trúc: nhà Việt có TƯỜNG THÓP nhẹ vào trong
    // (bodyTaper < 1) và lấy SÂN TRONG làm trung tâm bố cục, còn kiến trúc Hán lấy HÀNG CỘT và
    // cờ xí làm mặt tiền. Đổi thứ tự `motifs` là đổi cả chi tiết được dựng ở hạng `rare`.
    name: 'ngói âm dương & sân trong',
    bodySides: 4, bodyTaper: 0.92, storyHeight: 0.66,
    roof: 'tiered', roofPitch: 0.4, eaves: 0.4,
    windows: 'square',
    motifs: ['courtyard', 'banner', 'columns'],
    rough: 0.2,
  },
  7: {
    // Kỷ Phục Hưng — đúng cái hình mẫu thẩm mỹ Đàm nhắc tới. Đối xứng, vòm, cột, tỉ lệ.
    name: 'vòm & cột & đối xứng',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.74,
    roof: 'dome', roofPitch: 0.56, eaves: 0.22,
    windows: 'arch',
    motifs: ['columns', 'arcade', 'statue'],
    rough: 0.06,
  },
  8: {
    name: 'kho cảng & cột buồm',
    bodySides: 4, bodyTaper: 0.98, storyHeight: 0.7,
    roof: 'gable', roofPitch: 0.52, eaves: 0.24,
    windows: 'square',
    motifs: ['mast', 'crate'],
    rough: 0.3,
  },
  9: {
    name: 'tân cổ điển & fronton',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.76,
    roof: 'pyramid', roofPitch: 0.28, eaves: 0.26,
    windows: 'arch',
    motifs: ['columns', 'pediment', 'statue'],
    rough: 0.04,
  },
  10: {
    name: 'gạch nung & ống khói',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.7,
    roof: 'sawtooth', roofPitch: 0.3, eaves: 0.1,
    windows: 'grid',
    motifs: ['chimney', 'truss'],
    rough: 0.18,
  },
  11: {
    name: 'mặt tiền đồ sộ mạ vàng',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.8,
    roof: 'stepped', roofPitch: 0.24, eaves: 0.2,
    windows: 'grid',
    motifs: ['columns', 'spire', 'statue'],
    rough: 0.03,
  },
  12: {
    name: 'bê tông & lô cốt',
    bodySides: 4, bodyTaper: 0.96, storyHeight: 0.6,
    roof: 'flat', roofPitch: 0.12, eaves: 0.14,
    windows: 'slit',
    motifs: ['bunker', 'crenel'],
    rough: 0.26,
  },
  13: {
    name: 'khối bê tông & ăng-ten',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.66,
    roof: 'flat', roofPitch: 0.1, eaves: 0.08,
    windows: 'grid',
    motifs: ['antenna', 'dish'],
    rough: 0.08,
  },
  14: {
    name: 'kính & cao tầng',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.84,
    roof: 'flat', roofPitch: 0.08, eaves: 0.05,
    windows: 'curtain',
    motifs: ['sign', 'solar'],
    rough: 0,
  },
  15: {
    name: 'khối lơ lửng & vòng sáng',
    bodySides: 8, bodyTaper: 0.9, storyHeight: 0.8,
    roof: 'blade', roofPitch: 0.16, eaves: 0.3,
    windows: 'neon',
    motifs: ['halo', 'float'],
    rough: 0,
  },
};

/** Kỷ mặc định khi gặp số kỷ lạ (dữ liệu hỏng từ cloud) — thà ra một căn nhà thường còn hơn nổ. */
const DEFAULT_ERA = 2;

/**
 * Tra ngữ pháp của một kỷ. Luôn trả về một bộ tham số dùng được, không bao giờ `undefined`:
 * màn hình Thành Phố phải dựng được kể cả khi state bị hỏng.
 */
export function getEraStyle(era) {
  const key = Number.isFinite(era) ? Math.round(era) : DEFAULT_ERA;
  return ERA_STYLES[key] ?? ERA_STYLES[DEFAULT_ERA];
}
