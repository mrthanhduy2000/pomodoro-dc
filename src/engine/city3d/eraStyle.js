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
 * Cách đọc một dòng: mỗi kỷ trả lời 8 câu — thân nhà hình gì, **to cỡ nào**, mái kiểu gì và dốc bao
 * nhiêu, diềm thò ra bao xa, cửa sổ kiểu gì, có những chi tiết đặc trưng nào, và nét vẽ gọn hay thô.
 *
 * ⚠️ HAI TRƯỜNG `massScale`/`spread` THÊM NGÀY 2026-08-14, VÀ ĐÂY LÀ LÝ DO:
 * Đàm nhìn thành phố rồi nói *"không thể nào nhà hiện đại lại giống nhà thời đồ đồng được"*. Đo ra
 * thì anh đúng đến mức khó tin: chiều cao trung bình của kỷ 1 (lều da thú) là **1,81**, của kỷ 14
 * (tháp kính) là **2,05** — chênh 13%. Cả bảng 15 kỷ chỉ trải 1,88 lần, và còn SAI CHIỀU: lâu đài
 * kỷ 5 (2,28) cao hơn cả cao ốc kính.
 * Nguyên nhân: `storyHeight` đang gánh HAI việc mâu thuẫn nhau — vừa là "một tầng cao bao nhiêu"
 * (dùng chia ra số hàng cửa sổ), vừa là hệ số chiều cao tổng. Một túp lều và một toà nhà chọc trời
 * có chiều cao TẦNG gần bằng nhau ngoài đời thật (2,5m so với 3,5m), nên trường ấy **không bao giờ**
 * tách nổi hai thứ đó ra. Thứ khác nhau giữa chúng là **SỐ TẦNG**, và trước đây không ai ghi nó.
 * ⇒ Nay tách đôi: `storyHeight` giữ đúng nghĩa hẹp "một tầng cao bao nhiêu", `massScale` mới là
 * "nền văn minh này xây cao tới đâu". Cộng `spread` (bề ngang) thì lều vừa thấp vừa nhỏ, còn tháp
 * kính vừa cao vừa mảnh — hai hình bóng không thể nhầm nhau ở bất kỳ cỡ hiển thị nào.
 *
 * ⚠️ `country`/`landmark`: Đàm yêu cầu *"mỗi kỷ có thể lấy một đất nước làm biểu tượng — ví dụ thời
 * phục hưng có thể lấy nhà của Ý hoặc Pháp"*. Hai trường này KHÔNG phải nhãn dán cho đẹp: chúng là
 * **lời giải thích cho những con số nằm cùng dòng**. Muốn đổi `roof`/`massScale`/`motifs` của một
 * kỷ thì phải trả lời được "công trình có thật nào ở nước ấy trông như vậy?" — nếu không trả lời
 * được thì con số ấy là tuỳ hứng, và tuỳ hứng chính là thứ đã sinh ra 15 kỷ cao bằng nhau ở trên.
 * 15 nước KHÔNG trùng nhau, để thanh chuyển kỷ đọc ra một hành trình vòng quanh thế giới.
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
 *
 * `massScale` (chiều cao tổng) và `spread` (bề ngang) là hai số quyết định HÌNH BÓNG — thứ mắt bắt
 * được từ xa trước cả màu và chi tiết. Đọc chúng theo cặp:
 *   thấp + nhỏ  = túp lều (kỷ 1)      ·  thấp + bè  = ziggurat, xưởng máy, lô cốt (kỷ 3/10/12)
 *   cao  + bè   = cung điện (kỷ 11)   ·  cao  + mảnh = tháp kính (kỷ 14/15)
 * ⚠️ Tỉ lệ cao/rộng bị khoá trần ở `buildingSpec.test.js` (2,4 — ba kỷ cao được nới 3,2). Nâng
 * `massScale` mà quên nâng `spread` theo là cách nhanh nhất làm đỏ bài test đó.
 */
export const ERA_STYLES = {
  1: {
    name: 'đá thô & lều da thú',
    country: 'Thổ Nhĩ Kỳ', landmark: 'cự thạch Göbekli Tepe',
    // ⚠️ `eaves` 0,04 và `roofPitch` 0,95 — KHÔNG phải 0,16 / 0,62. Ảnh quét ngày 2026-08-14 cho
    // thấy lều kỷ 1 đọc ra thành CÂY NẤM (hay cái ô che nắng): mái nón thò ra khỏi tường 0,16 tạo
    // đúng cái vành mũ nấm, còn thân thóp 0,74 thì thành cái cuống. Lều da thú thật là một khối
    // NÓN CAO liền mạch phủ gần sát đất, không có vành. Đây là lỗi HÌNH KHỐI, không phải lỗi màu:
    // đổi màu mái không cứu được một hình bóng đã sai.
    bodySides: 6, bodyTaper: 0.74, storyHeight: 0.62,
    massScale: 0.24, spread: 0.72,
    roof: 'cone', roofPitch: 0.95, eaves: 0.04,
    windows: 'none',
    motifs: ['boulder', 'firepit'],
    rough: 0.9,
  },
  2: {
    name: 'vách đất & mái tranh',
    country: 'Ai Cập', landmark: 'làng ven sông Nin',
    bodySides: 4, bodyTaper: 0.94, storyHeight: 0.66,
    massScale: 0.46, spread: 0.98,
    roof: 'cone', roofPitch: 0.72, eaves: 0.2,
    windows: 'none',
    motifs: ['fence', 'granary'],
    rough: 0.62,
  },
  3: {
    name: 'gạch bùn & giật cấp',
    country: 'Iraq', landmark: 'ziggurat thành Ur',
    bodySides: 4, bodyTaper: 0.86, storyHeight: 0.6,
    massScale: 0.78, spread: 1.18,
    roof: 'stepped', roofPitch: 0.3, eaves: 0.06,
    windows: 'slit',
    motifs: ['pillar', 'ramp'],
    rough: 0.36,
  },
  4: {
    name: 'mái chồng diềm cong',
    country: 'Trung Quốc', landmark: 'điện mái chồng, đấu củng',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.68,
    massScale: 0.72, spread: 1.1,
    roof: 'tiered', roofPitch: 0.34, eaves: 0.34,
    windows: 'square',
    motifs: ['columns', 'banner'],
    rough: 0.22,
  },
  5: {
    name: 'đá tảng & mái dốc đứng',
    country: 'Đức', landmark: 'lâu đài đá Burg Eltz',
    bodySides: 4, bodyTaper: 0.97, storyHeight: 0.72,
    massScale: 0.7, spread: 0.96,
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
    // Nay có thêm nét thứ ba tách hẳn: đình làng Việt BÈ NGANG hơn và THẤP hơn điện Hán.
    name: 'ngói âm dương & sân trong',
    country: 'Việt Nam', landmark: 'đình làng Bắc Bộ',
    bodySides: 4, bodyTaper: 0.92, storyHeight: 0.66,
    massScale: 0.68, spread: 1.16,
    roof: 'tiered', roofPitch: 0.4, eaves: 0.4,
    windows: 'square',
    motifs: ['courtyard', 'banner', 'columns'],
    rough: 0.2,
  },
  7: {
    // Kỷ Phục Hưng — đúng cái hình mẫu thẩm mỹ Đàm nhắc tới, và cũng đúng nước anh nêu làm ví dụ.
    name: 'vòm & cột & đối xứng',
    country: 'Ý', landmark: 'vòm Duomo Firenze',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.74,
    massScale: 0.74, spread: 1.02,
    roof: 'dome', roofPitch: 0.56, eaves: 0.22,
    windows: 'arch',
    motifs: ['columns', 'arcade', 'statue'],
    rough: 0.06,
  },
  8: {
    name: 'kho cảng & cột buồm',
    country: 'Bồ Đào Nha', landmark: 'bến cảng Lisboa',
    bodySides: 4, bodyTaper: 0.98, storyHeight: 0.7,
    massScale: 0.64, spread: 1.12,
    roof: 'gable', roofPitch: 0.52, eaves: 0.24,
    windows: 'square',
    motifs: ['mast', 'crate'],
    rough: 0.3,
  },
  9: {
    // Nước thứ hai Đàm nêu làm ví dụ. Tân cổ điển Pháp: fronton tam giác trên hàng cột.
    name: 'tân cổ điển & fronton',
    country: 'Pháp', landmark: 'điện Panthéon Paris',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.76,
    massScale: 0.92, spread: 1,
    roof: 'pyramid', roofPitch: 0.28, eaves: 0.26,
    windows: 'arch',
    motifs: ['columns', 'pediment', 'statue'],
    rough: 0.04,
  },
  10: {
    name: 'gạch nung & ống khói',
    country: 'Anh', landmark: 'nhà máy gạch đỏ Manchester',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.7,
    massScale: 0.9, spread: 1.16,
    roof: 'sawtooth', roofPitch: 0.3, eaves: 0.1,
    windows: 'grid',
    motifs: ['chimney', 'truss'],
    rough: 0.18,
  },
  11: {
    name: 'mặt tiền đồ sộ mạ vàng',
    country: 'Mỹ', landmark: 'New York thời Mạ Vàng',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.8,
    massScale: 0.86, spread: 0.94,
    roof: 'stepped', roofPitch: 0.24, eaves: 0.2,
    windows: 'grid',
    motifs: ['columns', 'spire', 'statue'],
    rough: 0.03,
  },
  12: {
    name: 'bê tông & lô cốt',
    country: 'Nga', landmark: 'lô cốt Stalingrad',
    bodySides: 4, bodyTaper: 0.96, storyHeight: 0.6,
    massScale: 1.02, spread: 1.1,
    roof: 'flat', roofPitch: 0.12, eaves: 0.14,
    windows: 'slit',
    motifs: ['bunker', 'crenel'],
    rough: 0.26,
  },
  13: {
    // Nhật Bản thời Metabolism (thập niên 1960-70) là câu trả lời chính xác cho "khối bê tông lắp
    // ghép + ăng-ten": tháp nang Nakagin đúng là những viên hộp bê tông cắm quanh một lõi.
    name: 'khối bê tông & ăng-ten',
    country: 'Nhật Bản', landmark: 'tháp nang Nakagin',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.66,
    massScale: 1.24, spread: 0.92,
    roof: 'flat', roofPitch: 0.1, eaves: 0.08,
    windows: 'grid',
    motifs: ['antenna', 'dish'],
    rough: 0.08,
  },
  14: {
    name: 'kính & cao tầng',
    country: 'Singapore', landmark: 'tháp kính Marina Bay',
    bodySides: 4, bodyTaper: 1, storyHeight: 0.84,
    massScale: 1.36, spread: 0.8,
    roof: 'flat', roofPitch: 0.08, eaves: 0.05,
    windows: 'curtain',
    motifs: ['sign', 'solar'],
    rough: 0,
  },
  15: {
    name: 'khối lơ lửng & vòng sáng',
    country: 'UAE', landmark: 'Bảo tàng Tương Lai Dubai',
    bodySides: 8, bodyTaper: 0.9, storyHeight: 0.8,
    massScale: 1.72, spread: 0.76,
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
