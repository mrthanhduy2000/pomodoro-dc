/**
 * streetStyle.js — 15 kỷ, 15 NGÔN NGỮ ĐƯỜNG PHỐ. Bảng này là nguồn DUY NHẤT trả lời "ở thời đại
 * này thì con đường rộng bao nhiêu, lát bằng gì, viên to cỡ nào, có bó vỉa không, có vỉa hè không,
 * có vạch kẻ không, và nó gặp mặt đất theo kiểu gì".
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY — LỖI THIẾT KẾ, KHÔNG PHẢI LỖI MÃ
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Trước Phase 9D, toàn bộ bản sắc đường của một kỷ nằm gọn trong **một mã màu** (`roadColor`).
 * Không có bó vỉa, không vỉa hè, không viên lát, không vạch kẻ, không mép chuyển — con đường đúng
 * nghĩa là *một dải màu phẳng đặt lên mặt đất*, và hai ô đường kề nhau chỉ khác nhau ở bề rộng.
 *
 * Hậu quả không phải "hơi đơn điệu" mà là một **lỗi kỹ thuật đo được**: khi màu là trục DUY NHẤT
 * mang bản sắc, mọi sức ép "15 kỷ phải phân biệt được" dồn hết vào ĐỘ ĐẬM. Và độ đậm thì có đáy —
 * nhựa đường kỷ 11 bị đẩy xuống độ sáng **0,113** trong khi mặt đất 0,406, tức DƯỚI ngưỡng 0,12 mà
 * mắt còn đọc ra chi tiết (`TECH_DEBT #30`, đo với `sun.castShadow` TẮT HẲN nên không đổ lỗi được
 * cho bóng). Con đường biến thành cái rãnh. Cùng lúc đó, ba cặp kỷ vẫn trùng nhau vào ban đêm
 * (`TECH_DEBT #27`) — vì một trục thì không đủ chỗ cho 15 giá trị cách nhau.
 *
 * ⇒ Hai mục nợ ấy là MỘT bài toán: **một trục đang phải gánh việc của mười trục.** Chữa bằng cách
 * chỉnh lại con số trên trục cũ chỉ đổi chỗ vấn đề (đã chứng minh: nới trần tới mức gần như không
 * bão hoà thì cặp 3↔10 cũng chỉ lên 9,8/10). File này mở thêm chín trục nữa.
 *
 * ⚠️ MỖI DÒNG PHẢI TRẢ LỜI ĐƯỢC "ĐI BỘ Ở NƯỚC ẤY THÌ GIẪM LÊN CÁI GÌ?" — đúng luật mà `eraStyle.js`
 * đặt ra cho kiến trúc và `floraStyle.js` đã theo cho cây cối. Không có ràng buộc ấy thì 15 dòng
 * dưới đây là 15 lần chọn bừa, mà chọn bừa chính là thứ đã sinh ra 15 kỷ đường giống hệt nhau.
 * Bài test `streetStyle.test.js` khoá `country` của bảng này vào `country` của `eraStyle.js` để hai
 * bảng không bao giờ trôi khỏi nhau.
 *
 * ⚠️ VÀ ĐỪNG NHÉT ĐẶC ĐIỂM HIỆN ĐẠI VÀO KỶ CỔ CHO ĐẸP. Bó vỉa (đá chắn mép) là phát minh La Mã —
 * kỷ 1–6 không có. Vạch kẻ tim đường là thế kỷ 20 — kỷ 1–10 không có. Vỉa hè tách cao khỏi lòng
 * đường phổ biến từ thế kỷ 18–19. Một kỷ đồ đá có vạch kẻ thì đẹp hơn thật, nhưng nó phá đúng thứ
 * mà cả 15 kỷ sinh ra để kể.
 */

/** Kiểu mặt lát mà `terrainMesh.js` dựng được. Khai ở đây để một kỷ khai sai thì test bắt ngay. */
export const PAVING_KINDS = [
  'dirt',       // đất nện — không viên, mép tan vào cỏ
  'gravel',     // sỏi/đá dăm — hạt rất nhỏ, lấm tấm dày
  'cobble',     // đá cuội tròn không đều — viên nhỏ, đậm nhạt loạn
  'flagstone',  // phiến đá lớn cắt vuông — viên to, joint rõ
  'brick',      // gạch nung xếp hàng — viên nhỏ dài, đều
  'slab',       // tấm bê tông đúc — viên rất to, gần phẳng
  'asphalt',    // nhựa đường — liền khối, gần như không viên
];

/** Kiểu vạch kẻ. `terrainMesh.js` chỉ dựng vạch khi kỷ khai khác `'none'`. */
export const MARKING_KINDS = ['none', 'center', 'dashed', 'crossing'];

const PAVING_SET = new Set(PAVING_KINDS);
const MARKING_SET = new Set(MARKING_KINDS);

/**
 * MƯỜI TRỤC BẢN SẮC. Đọc kỹ ý nghĩa trước khi chỉnh — vài trục trông giống nhau nhưng trả lời hai
 * câu hỏi khác hẳn, và trộn chúng lại chính là cái bẫy "một trường gánh hai việc" đã cắn dự án này
 * bốn lần (xem `CLAUDE.md`).
 *
 * `avenue`   — bề rộng ĐẠI LỘ, tính theo phần của một ô (1 = rộng trọn ô). Đây là trục mạnh nhất:
 *              mắt đọc bề rộng trước cả màu. Đường mòn 0,52 và đại lộ Dubai 1,0 là hai thế giới.
 * `lane`     — bề rộng NGÕ PHỐ. KHÔNG suy ra từ `avenue` bằng một tỉ lệ chung, vì thứ bậc đường là
 *              một lựa chọn quy hoạch: Paris Haussmann có đại lộ rất rộng mà ngõ vẫn hẹp (tương
 *              phản mạnh); lưới Manhattan thì mọi phố gần bằng nhau (tương phản yếu).
 * `paving`   — VẬT LIỆU LÁT (danh sách trên). Quyết định "trông như cái gì".
 * `stone`    — CỠ VIÊN lát, theo phần của một ô. Quyết định "viên to hay nhỏ". Tách khỏi `paving`
 *              vì cùng một vật liệu có nhiều cỡ: pavé Paris là đá vuông ~10cm, còn phiến đá La Mã
 *              rộng cả mét. 0 = liền khối (đất, nhựa).
 * `wear`     — biên độ ĐẬM NHẠT giữa các viên (0..1). Đá cuội trung cổ loạn xạ (cao); tấm bê tông
 *              đúc khuôn thì đều (thấp). Đây là thứ cho mặt đường "có tuổi" mà không cần ảnh kết cấu.
 * `curb`     — CHIỀU CAO BÓ VỈA (đơn vị thế giới, 0 = không có). Bó vỉa là thứ tạo BÓNG ĐỔ dọc mép
 *              đường — tức nó cho con đường chiều sâu ngay cả khi màu đường và màu đất gần nhau.
 * `walk`     — bề rộng VỈA HÈ mỗi bên (phần của ô, 0 = không có). Nằm NGOÀI lòng đường.
 * `markings` — vạch kẻ (danh sách trên).
 * `edge`     — cách con đường GẶP mặt đất: `'blend'` = tan dần vào cỏ (đường đất không có mép);
 *              `'hard'` = mép sắc (đã lát, đã bó vỉa). Đây là thứ chữa "đường kết thúc bằng một mép
 *              chữ nhật giữa đồng".
 */
export const STREET_STYLES = {
  1: {
    country: 'Thổ Nhĩ Kỳ',
    // ⚠️ HẸP NHẤT TRONG CẢ 15 KỶ, VÀ ĐÓ LÀ SỰ THẬT LỊCH SỬ CHỨ KHÔNG PHẢI ĐỂ CHO KHÁC KỶ 2. Ở
    // Göbekli Tepe chưa có xe, chưa có súc vật kéo — thứ rộng nhất phải đi lọt là một người vác đồ.
    // Lối mòn người đi rộng ~1m; lối xe bò kỷ sau rộng ~3m. Chênh lệch ấy có thật và rất lớn.
    note: 'Göbekli Tepe — chưa có khái niệm "đường": chỉ là vệt cỏ bị giẫm mòn giữa các lều',
    // ⚠️ `wear` CAO gần nhất bộ, và đó KHÔNG phải để tách khỏi kỷ 2 — nó suy thẳng từ câu `note`.
    // Một vệt cỏ bị giẫm mòn thì lấm tấm theo đúng nghĩa đen: chỗ trơ đất, chỗ còn túm cỏ sống sót,
    // chỗ lòi sỏi. Đó là mặt đường KHÔNG ĐỀU NHẤT trong cả 15 kỷ, vì nó chưa hề được làm phẳng.
    avenue: 0.46, lane: 0.26, paving: 'dirt', stone: 0, wear: 0.36,
    curb: 0, walk: 0, markings: 'none', edge: 'blend',
  },
  2: {
    country: 'Ai Cập',
    note: 'làng ven sông Nin — lối cát pha, rộng vừa đủ cho lừa thồ, mép cát lẫn vào bãi bồi',
    // ⚠️ ĐỐI CỰC CỦA KỶ 1, VÀ CŨNG SUY TỪ `note`: phù sa mịn sông Nin bị gió và chân người san đều
    // liên tục. Cùng là `dirt` nhưng một bên lấm tấm cỏ-đất-sỏi, một bên phẳng lì như bột — hai kỷ
    // đầu KHÔNG có bó vỉa/vỉa hè/vạch kẻ để mà khác nhau, nên bề rộng và độ đều PHẢI làm hết việc.
    avenue: 0.60, lane: 0.38, paving: 'dirt', stone: 0, wear: 0.12,
    curb: 0, walk: 0, markings: 'none', edge: 'blend',
  },
  3: {
    country: 'Iraq',
    note: 'thành Ur — đường rước lát gạch bùn phơi nắng, viên lớn thô, hai bên vẫn là đất',
    // ⚠️ RỘNG HƠN CẢ PHỐ Ý (0,76) VÀ PHỐ ANH CÔNG NGHIỆP (0,78) — nghe ngược đời, nhưng đúng, và
    // chính bảng này đã tự đặt ra luật ấy ở kỷ 10: "hiện đại hơn KHÔNG đồng nghĩa đường rộng hơn".
    // Đường rước Lưỡng Hà rộng vì nó phục vụ NGHI LỄ (kiệu thần, đám rước) chứ không phục vụ giao
    // thông, nên nó không bị nhà cửa lấn vào như phố buôn bán thời sau. Con số cũ 0,68 mâu thuẫn
    // với chính chữ "đường rước" trong `note` ngay trên nó.
    avenue: 0.80, lane: 0.42, paving: 'brick', stone: 0.30, wear: 0.30,
    curb: 0, walk: 0, markings: 'none', edge: 'blend',
  },
  4: {
    country: 'Trung Quốc',
    note: 'đường ngự đạo — đất nện đầm chặt rất rộng cho xe ngựa, hai bên có lối đi lát đá thưa',
    // Đá dăm rải trên nền đất đầm: mắt đọc ra một mảng LỐM ĐỐM cỡ vừa, không phải từng viên rời.
    avenue: 0.82, lane: 0.44, paving: 'gravel', stone: 0.19, wear: 0.24,
    curb: 0, walk: 0.10, markings: 'none', edge: 'blend',
  },
  5: {
    country: 'Đức',
    note: 'phố cổ trung cổ — ngõ HẸP quanh co, đá cuội tròn không đều, nước chảy giữa lòng đường',
    // Đá cuội trung cổ nhặt ở suối: viên to nhỏ lẫn lộn — cỡ trung bình, nhưng `wear` CAO NHẤT bộ
    // (0,46) mới là thứ kể ra sự lộn xộn ấy, không phải cỡ viên.
    avenue: 0.66, lane: 0.30, paving: 'cobble', stone: 0.16, wear: 0.46,
    curb: 0, walk: 0, markings: 'none', edge: 'hard',
  },
  6: {
    country: 'Việt Nam',
    // ⚠️ NGÕ HẸP NHẤT TRONG CÁC KỶ CÓ ĐÔ THỊ. Phố cổ Hà Nội ("36 phố phường") là một trong những
    // kết cấu đô thị chật nhất bộ này — ngõ 2–3m, nhà ống sâu, mái hiên hai bên gần chạm nhau. Con
    // số 0,24 là để khớp chính câu `note` ngay dưới, không phải để tách khỏi kỷ 5.
    note: 'phố cổ — ngõ hẹp lát gạch nung mòn nhẵn, mái hiên nhô ra gần chạm nhau',
    // ⚠️ VÀ ĐẠI LỘ CŨNG PHẢI HẸP, KHÔNG CHỈ NGÕ. Con số cũ 0,70 rộng hơn cả đường rước thành Ur —
    // tức bảng đang nói ngược với câu `note` của chính nó. "36 phố phường" không có đại lộ nào:
    // thứ rộng nhất ở đó vẫn chỉ là một phố buôn bán vừa đủ hai chiều gánh hàng tránh nhau.
    avenue: 0.62, lane: 0.24, paving: 'brick', stone: 0.17, wear: 0.38,
    curb: 0, walk: 0, markings: 'none', edge: 'hard',
  },
  7: {
    country: 'Ý',
    note: 'Firenze — phiến đá lớn cắt vuông, bó vỉa đá thấp kiểu La Mã (phát minh của chính họ)',
    avenue: 0.76, lane: 0.36, paving: 'flagstone', stone: 0.34, wear: 0.26,
    curb: 0.035, walk: 0.09, markings: 'none', edge: 'hard',
  },
  8: {
    country: 'Bồ Đào Nha',
    note: 'calçada portuguesa — đá vôi viên rất nhỏ lát tay thành hoa văn, vỉa hè rõ',
    // VIÊN NHỎ NHẤT TRONG CẢ 15 KỶ — đúng bằng `MIN_STONE`, tức mịn hết mức màn hình còn dựng ra
    // được. Khai nhỏ hơn nữa thì không mịn thêm, chỉ thành nhiễu (xem `MIN_STONE`).
    avenue: 0.74, lane: 0.34, paving: 'cobble', stone: 0.145, wear: 0.34,
    curb: 0.04, walk: 0.13, markings: 'none', edge: 'hard',
  },
  9: {
    country: 'Pháp',
    note: 'đại lộ Haussmann — pavé đá vuông, đại lộ RẤT rộng mà ngõ vẫn hẹp: tương phản mạnh nhất',
    // Pavé Paris là khối vuông đục đều, TO HƠN đá mosaic Bồ Đào Nha — và đều hơn hẳn (wear 0,28 so
    // với 0,46 của đá cuội nhặt suối kỷ 5): đây là đá công nghiệp cắt máy, không phải đá nhặt.
    avenue: 0.94, lane: 0.30, paving: 'cobble', stone: 0.155, wear: 0.28,
    curb: 0.05, walk: 0.17, markings: 'none', edge: 'hard',
  },
  10: {
    country: 'Anh',
    // ⚠️ ĐẠI LỘ HẸP HƠN KỶ 9, DÙ CÔNG NGHIỆP HOÁ HƠN — và đây là điểm hay nhất của cặp này. Paris
    // Haussmann là quy hoạch từ trên xuống, phá cả khu phố để mở đại lộ; Manchester lớn lên hỗn
    // loạn quanh nhà máy, nhà "back-to-back" chen chúc, phố ám khói chật hẹp. "Hiện đại hơn" KHÔNG
    // đồng nghĩa "đường rộng hơn", và bảng này phải nói được điều đó.
    note: 'Manchester công nghiệp — gạch nung ám khói, phố chật, vỉa hè đá phiến, bó vỉa cao chắn bánh xe',
    avenue: 0.78, lane: 0.42, paving: 'brick', stone: 0.16, wear: 0.42,
    curb: 0.055, walk: 0.15, markings: 'none', edge: 'hard',
  },
  11: {
    country: 'Mỹ',
    note: 'lưới Manhattan — nhựa đường liền, vạch tim vàng, mọi phố gần bằng nhau (tương phản yếu)',
    avenue: 0.92, lane: 0.66, paving: 'asphalt', stone: 0, wear: 0.16,
    curb: 0.05, walk: 0.14, markings: 'center', edge: 'hard',
  },
  12: {
    country: 'Nga',
    note: 'đại lộ Xô Viết — tấm bê tông đúc rất lớn, mặt cắt khổng lồ, ít vạch, vỉa hè mênh mông',
    avenue: 1.00, lane: 0.58, paving: 'slab', stone: 0.46, wear: 0.14,
    curb: 0.045, walk: 0.19, markings: 'none', edge: 'hard',
  },
  13: {
    country: 'Nhật Bản',
    note: 'phố Nhật — lòng đường HẸP lại (đất đắt), nhựa mịn, vạch sang đường kẻ dày',
    avenue: 0.72, lane: 0.38, paving: 'asphalt', stone: 0, wear: 0.12,
    curb: 0.04, walk: 0.16, markings: 'crossing', edge: 'hard',
  },
  14: {
    country: 'Singapore',
    note: 'thành phố vườn — nhựa hai làn vạch đứt, vỉa hè rộng có hàng cây, bó vỉa bo tròn',
    avenue: 0.90, lane: 0.56, paving: 'asphalt', stone: 0, wear: 0.10,
    curb: 0.045, walk: 0.20, markings: 'dashed', edge: 'hard',
  },
  15: {
    country: 'UAE',
    note: 'đại lộ sa mạc — bê tông sáng phản nắng, mặt cắt rộng nhất, vạch đứt thưa',
    avenue: 1.00, lane: 0.62, paving: 'slab', stone: 0.30, wear: 0.08,
    curb: 0.05, walk: 0.18, markings: 'dashed', edge: 'hard',
  },
};

/**
 * Kỷ ngoài bảng (lỗi dữ liệu, hoặc kỷ tương lai chưa khai) rơi về một con đường TRUNG TÍNH đọc
 * được: đất nện, không bó vỉa, không vạch. Cố ý chọn kiểu CỔ nhất — thiếu dữ liệu mà dựng ra một
 * đại lộ có vạch kẻ là bịa ra lịch sử, còn dựng ra một lối đất thì chỉ là nói ít đi.
 */
const FALLBACK = {
  country: '', note: 'kỷ chưa khai — lối đất trung tính',
  avenue: 0.66, lane: 0.42, paving: 'dirt', stone: 0, wear: 0.20,
  curb: 0, walk: 0, markings: 'none', edge: 'blend',
};

/**
 * Ngữ pháp đường phố của một kỷ. LUÔN trả về một đối tượng dùng được — tầng vẽ không phải kiểm
 * `null`, đúng khuôn `getEraStyle`/`getFloraStyle`.
 *
 * @param {number} era 1..15
 */
export function getStreetStyle(era) {
  return STREET_STYLES[era] ?? FALLBACK;
}

/**
 * Cỡ viên NHỎ NHẤT màn hình còn dựng ra được, tính theo phần của một ô — và vì sao đúng con số này.
 *
 * ⚠️ ĐÂY LÀ MỘT SỰ THẬT ĐO ĐƯỢC VỀ MÀN HÌNH, KHÔNG PHẢI MỘT TRẦN TIẾT KIỆM PIN TỰ ĐẶT. Đo trên ảnh
 * dựng thật ở khoảng nhìn thật của app (kỷ 5, bề ngang 1100): một ô thành phố chiếm ~64 điểm ảnh,
 * nên chia 7 cho ra viên lát **8 điểm ảnh** (đo được, không suy đoán: `Δ` theo lag chững lại đúng ở
 * lag 8). Chia 3 cho ra viên 14 điểm ảnh. Cả hai đều đọc ra được. Chia mịn hơn 1/7 thì viên tụt
 * xuống dưới ~5 điểm ảnh và bắt đầu rơi vào vùng nhiễu/vân moiré — tiền tam giác đổi lấy NHIỄU chứ
 * không đổi lấy chi tiết, đúng cái bẫy "không noisy" trong yêu cầu.
 *
 * ⚠️ VÀ VÌ VẬY BẢNG **KHÔNG ĐƯỢC KHAI** `stone` NHỎ HƠN MỨC NÀY — `isValidStreetStyle` chặn thẳng.
 * Lý do là một cái bẫy dự án đã trả giá ở Phase 7B: bản đầu của hàm này kẹp `Math.min(7, …)` và bốn
 * kỷ khai 0,08 · 0,11 · 0,12 · 0,13 **cùng rơi về 7** — bốn con số khác nhau, một kết quả, và không
 * gì đỏ lên. Người sau chỉnh 0,08 thành 0,13 sẽ thấy ảnh không đổi rồi kết luận trường này đã chết.
 * Thà bắt bảng khai một giá trị màn hình dựng được, còn hơn để cái kẹp âm thầm nuốt cả một trục.
 *
 * ⚠️ HỆ QUẢ MỸ THUẬT, ĐỌC KỸ TRƯỚC KHI "SỬA": sỏi và đá cuội THẬT có hạt nhỏ hơn con số này rất
 * nhiều (viên pavé Paris ~10cm trên một ô rộng cỡ chục mét ≈ 1/120 ô, tức nửa điểm ảnh). Chúng
 * KHÔNG lấy đặc trưng từ hình học — chúng lấy từ `wear` (biên độ đậm nhạt) và `paving`. `stone` chỉ
 * trả lời "viên ĐỌC RA ĐƯỢC to cỡ nào trên màn hình", không phải "viên ngoài đời to cỡ nào".
 */
export const MIN_STONE = 1 / 7;

/**
 * Số ô con chia trên MỘT ô đường, suy từ cỡ viên lát.
 *
 * ⚠️ ĐÂY LÀ CHỖ CỠ VIÊN TRỞ THÀNH HÌNH HỌC THẬT, không phải một con số trang trí. Hình học của
 * `terrainMesh.js` KHÔNG đánh chỉ mục (mỗi tam giác mang ba đỉnh riêng), nên bốn đỉnh của một ô con
 * cùng nhận MỘT màu sẽ cho ra một viên lát PHẲNG có mép rõ — đúng thứ mắt đọc thành "đá lát". Chia
 * càng nhỏ thì viên càng nhỏ. Nhựa đường khai `stone = 0` nên rơi về mức thấp nhất và ra mặt liền.
 */
export function pavingSubdivision(style) {
  const stone = Number.isFinite(style?.stone) ? style.stone : 0;
  if (stone <= 0) return 2;
  return Math.max(2, Math.min(Math.round(1 / MIN_STONE), Math.round(1 / stone)));
}

/**
 * Bộ ba số mô tả HÌNH DẠNG mặt cắt ngang của một ô đường, để tầng vẽ khỏi tự suy diễn.
 * Trả về theo NỬA bề rộng (đơn vị: phần của một ô, tính từ tim đường ra), vì mọi phép dựng bên
 * `terrainMesh.js` đều làm việc với nửa bề rộng.
 *
 * @param {object} style   kết quả `getStreetStyle`
 * @param {boolean} isLane true = ngõ phố (variant 1/2), false = đại lộ/ngã tư
 */
export function streetCrossSection(style, isLane) {
  const s = style ?? FALLBACK;
  const width = isLane ? s.lane : s.avenue;
  const half = Math.max(0.08, Math.min(1, width)) / 2;
  // Vỉa hè và bó vỉa nằm NGOÀI lòng đường, nhưng không được tràn ra khỏi ô: hai ô đường kề nhau mà
  // vỉa hè chồng lên nhau thì sinh ra một dải chọi mặt (z-fight) chạy dọc cả thành phố.
  const room = Math.max(0, 0.5 - half);
  const walk = Math.min(s.walk ?? 0, room);
  return { half, walk, curb: walk > 0.01 ? (s.curb ?? 0) : 0 };
}

/**
 * BỐN MÉP của lòng đường trong một ô, tính từ tâm ô ra — theo việc ô ĐÓ có NỐI sang ô đường bên
 * cạnh hay không.
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG MỘT HÌNH CHỮ NHẬT CÂN GIỮA, VÀ ĐÂY LÀ MỘT LỖI ĐÃ NHÌN THẤY TẬN MẮT: bản đầu
 * của Phase 9D thu hẹp ô đại lộ ở CẢ HAI chiều theo bề rộng kỷ khai. Kỷ 13 khai `avenue = 0,72`,
 * nên mỗi ô đường thành một hình vuông cạnh 0,72 nằm giữa ô — và hai ô kề nhau chừa lại một khe cỏ
 * rộng 0,28. Ảnh chụp gần cho thấy ngay: con đường vỡ thành những mảnh nhựa rời rạc, trông như mấy
 * cái sân đỗ xe rải rác chứ không phải một tuyến phố. Bề rộng là một đại lượng của MẶT CẮT NGANG;
 * áp nó lên chiều DỌC đường là hiểu sai chính đại lượng ấy.
 *
 * ⇒ Luật đúng, và nó xoá luôn việc phải phân biệt `variant`: mép nào giáp một ô đường khác thì
 * VƯƠN TỚI ranh giới ô (0,5) để hai mặt đường liền nhau; mép nào giáp đất thì dừng ở đúng nửa bề
 * rộng của chính nó. Đường dọc tự khắc dài trọn ô theo chiều đi và hẹp theo chiều ngang; ngã tư tự
 * khắc loang ra cả bốn phía; đầu đường cụt tự khắc kết thúc bằng đúng bề ngang của nó thay vì thò
 * ra một mẩu giữa đồng.
 *
 * ⚠️ HÀM THUẦN VÀ ĐƯỢC DÙNG CHUNG với bài test hình học (`terrainMesh.test.js`) — bài test hỏi
 * chính hàm này rồi đối chiếu với đỉnh dựng ra, chứ KHÔNG diễn đạt lại luật bằng công thức riêng.
 * Hai công thức "tương đương" cho cùng một luật thì gần như luôn lệch nhau ở biên (Phase 3Y).
 *
 * @param {{half:number}} cross  kết quả `streetCrossSection`
 * @param {{west:boolean, east:boolean, north:boolean, south:boolean}} nối  cạnh nào giáp ô đường
 */
export function carriagewayExtents(cross, nối) {
  const half = Math.max(0, Math.min(0.5, cross?.half ?? 0.25));
  const mép = (có_nối) => (có_nối ? 0.5 : half);
  return {
    west: mép(!!nối?.west),
    east: mép(!!nối?.east),
    north: mép(!!nối?.north),
    south: mép(!!nối?.south),
  };
}

/** Bảng tra để test kiểm nhanh: kỷ nào khai gì. Không dùng trong lúc chạy. */
export function isValidStreetStyle(style) {
  return !!style
    && PAVING_SET.has(style.paving)
    && MARKING_SET.has(style.markings)
    && Number.isFinite(style.avenue) && style.avenue > 0 && style.avenue <= 1
    && Number.isFinite(style.lane) && style.lane > 0 && style.lane <= 1
    // ⚠️ `stone` chỉ được là 0 (liền khối) hoặc một cỡ MÀN HÌNH DỰNG RA ĐƯỢC. Xem `MIN_STONE`: khai
    // nhỏ hơn thì cái kẹp trong `pavingSubdivision` sẽ nuốt mất phần chênh lệch trong im lặng.
    && Number.isFinite(style.stone) && style.stone >= 0 && style.stone < 1
    && (style.stone === 0 || style.stone >= MIN_STONE - 1e-9)
    && Number.isFinite(style.wear) && style.wear >= 0 && style.wear <= 1
    && Number.isFinite(style.curb) && style.curb >= 0
    && Number.isFinite(style.walk) && style.walk >= 0
    && (style.edge === 'blend' || style.edge === 'hard');
}
