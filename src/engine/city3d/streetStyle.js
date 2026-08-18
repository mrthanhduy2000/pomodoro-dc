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

/** Bốn phía, một thứ tự duy nhất. Viết ra một chỗ để không có hai cách liệt kê. */
export const SIDES = ['west', 'east', 'north', 'south'];

/**
 * Phía nào ứng với bước đi nào trên lưới. Ba nơi cần biết điều này — hàm dựng hình
 * (`terrainMesh.js`), bài test hình học, và công cụ đo (`scripts/road-fit.mjs`) — nên nó phải nằm
 * ở ĐÚNG MỘT chỗ. Chép tay bốn dòng `west: [-1,0] …` ở mỗi nơi là ba cơ hội để một dấu trừ lạc,
 * và một dấu trừ lạc ở đây thì hàng xóm phía tây bị hỏi thành hàng xóm phía đông: hình vẫn dựng
 * ra, vẫn liền lạc, chỉ là bề rộng chỗ nối lấy từ nhầm con đường.
 */
export const SIDE_STEPS = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };

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
    avenue: 0.96, lane: 0.58, paving: 'slab', stone: 0.46, wear: 0.14,
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
    avenue: 0.96, lane: 0.62, paving: 'slab', stone: 0.30, wear: 0.08,
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
 * Bề rộng lớn nhất một con đường được khai, tính theo phần của một ô.
 *
 * ⚠️ ĐÂY LÀ MỘT RÀNG BUỘC HÌNH HỌC, KHÔNG PHẢI MỘT LỰA CHỌN MỸ THUẬT — và nó nhốt HAI khuyết tật
 * đã đo được, cả hai đều do đúng một dòng `avenue: 1.00` sinh ra (kỷ 12 và 15 trước Phase 12).
 *
 *   (1) **Con đường rộng TRỌN Ô thì không còn chỗ cho cánh tay loe.** `carriagewayShape` cho cánh
 *       tay chạy từ mép lõi ra tới ranh giới ô; lõi rộng đúng 0,5 nghĩa là cánh tay dài BẰNG KHÔNG,
 *       nên một cái ngõ hẹp rẽ vào sẽ gặp mép đường ở một bậc vuông góc mà không phép loe nào cứu
 *       được. Tức lời hứa "không còn bậc ở mép đường" **không thể đúng** ở một kỷ khai 1,00.
 *   (2) **Nó nuốt sạch vỉa hè của chính kỷ ấy, trong im lặng.** `streetCrossSection` kẹp
 *       `walk ≤ 0,5 − half`; với `avenue = 1,00` thì `half = 0,5` ⇒ chỗ trống bằng 0 ⇒ vỉa hè bằng
 *       0. Kỷ 12 khai `walk: 0,19` và `note` của nó viết nguyên chữ *"vỉa hè mênh mông"* — con số
 *       và lời giải thích cùng bị vứt đi mà không có gì đỏ lên. Đúng cái bẫy `MIN_STONE` ở ngay
 *       trên đây, lần này ở một trường khác.
 *
 * Vì sao **0,96** chứ không phải một số tròn hơn: nó vẫn để kỷ 12 và 15 là hai kỷ đường RỘNG NHẤT
 * trong 15 (kế tiếp là 0,94), tức trục bản sắc "đại lộ Xô Viết / đại lộ sa mạc rộng nhất" giữ
 * nguyên, mà vẫn chừa lại 0,02 ô cho cánh tay loe. Đây là mức thấp nhất sửa được lỗi — cố ý không
 * hạ sâu hơn, vì hạ sâu là mua một con số đẹp bằng cách bóp một trục bản sắc đã được đo.
 *
 * ⚠️ VÀ `isValidStreetStyle` **TỪ CHỐI THẲNG**, không tự kẹp. Tự kẹp là cách một bảng 15 dòng lặng
 * lẽ thoái hoá — đúng bài học `MIN_STONE` (bốn kỷ khai bốn số, dựng ra một kết quả).
 */
export const MAX_AVENUE = 0.96;

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
 * HÌNH DẠNG lòng đường trong một ô: MỘT LÕI Ở GIỮA + TỐI ĐA BỐN CÁNH TAY vươn ra bốn phía.
 *
 * ⚠️ VÌ SAO KHÔNG PHẢI MỘT HÌNH CHỮ NHẬT — VÀ ĐÂY LÀ HAI LỖI ĐÃ NHÌN THẤY TẬN MẮT, CÁCH NHAU MỘT
 * PHASE. Bản đầu Phase 9D thu ô đại lộ ở CẢ HAI chiều theo bề rộng kỷ khai, nên hai ô kề nhau chừa
 * một khe cỏ và con đường vỡ thành mấy cái sân đỗ xe rời rạc. Bản vá khi ấy — *mép nào giáp ô
 * đường khác thì vươn tới 0,5, mép nào giáp đất thì dừng ở nửa bề rộng* — chữa đúng cái khe cỏ, và
 * đẻ ra khuyết tật thứ hai mà mãi tới Phase 12 mới đo: **một ô vẫn chỉ là MỘT hình chữ nhật, nên
 * nó không có cách nào diễn đạt "đại lộ chạy thẳng qua, ngõ nhỏ rẽ vào"**. Ngã ba buộc phải phình
 * ra TRỌN Ô theo hướng có nhánh, dù cái nhánh ấy chỉ rộng bằng một phần ba. Đo ra:
 * **~50% số mép đường có một bậc vuông góc**, bậc to nhất 0,38 ô — tức con đường lởm chởm đúng như
 * Đàm nói, và nó lởm chởm ở gần một nửa số chỗ nối.
 *
 * ⚠️ Cái sai gốc là một **giả định về HÌNH**, không phải một con số sai: *"lòng đường của một ô là
 * một hình chữ nhật"*. Chỉnh khéo con số nào cũng không thoát, vì một hình chữ nhật chỉ có hai bề
 * rộng còn một ngã tư cần tới bốn. Cùng họ với "một trường gánh hai việc" (`CLAUDE.md`), chỉ khác
 * là ở đây thứ gánh hai việc là một HÌNH DẠNG.
 *
 * ── LUẬT MỚI, SUY THẲNG TỪ CÁCH ĐƯỜNG SÁ NGOÀI ĐỜI GẶP NHAU ───────────────────────────────────
 *   1. **Chỗ nối rộng bằng con đường HẸP HƠN trong hai bên** (`min`). Đây là thứ xoá bậc: hai ô kề
 *      nhau cùng suy ra một con số từ CÙNG một phép tính đối xứng, nên chúng không thể lệch nhau.
 *      Một cái bậc chỉ sinh ra khi hai bên tự tính bề rộng của mình một cách độc lập.
 *   2. **Lõi rộng bằng cánh tay RỘNG NHẤT** — tức con đường lớn nhất chạy qua ô này. Ngoài đời:
 *      ở ngã ba, đường LỚN chạy thẳng qua và giữ nguyên bề rộng, đường NHỎ loe ra để nhập vào.
 *   3. ⇒ **Một ô KHÔNG BAO GIỜ rộng hơn chính con đường của nó** (`coreU`/`coreV ≤ myHalf` luôn
 *      đúng, vì mọi cánh tay đều đã bị `min` với `myHalf`). Chính điều này giết cái phình 0,5 ô.
 *   4. **Cánh tay LOE**: rộng bằng lõi ở mép lõi, thu về `min` ở ranh giới ô. Ngõ nhỏ nhập vào đại
 *      lộ thì loe ra đúng như một cái phễu nhập làn, thay vì gãy một góc vuông.
 *   5. ⚠️ **CÁNH TAY CẦN CHỖ ĐỂ LOE, nên một con đường KHÔNG ĐƯỢC rộng trọn ô** — xem `MAX_AVENUE`.
 *
 * Kiểm nhanh vài ca thật (đại lộ nửa bề rộng 0,36 · ngõ 0,15):
 *   · đại lộ chạy thẳng dọc → lõi 0,36×0,36, hai cánh 0,36 ⇒ một dải thẳng, y như trước.
 *   · ngã tư đại-lộ×ngõ    → lõi 0,15(u)×0,36(v), cánh ngang 0,36, cánh dọc loe 0,15→0,15
 *                             ⇒ đại lộ đi thẳng qua, ngõ nhỏ nhập vào — KHÔNG phình trọn ô nữa.
 *   · ô ngõ cạnh ngã tư    → lõi 0,15, cánh 0,15 ⇒ khớp KHÍT cánh dọc của ô ngã tư.
 *   · góc vành đai (khai đại lộ nhưng chỉ chạm hai ngõ) → lõi 0,15 ⇒ khúc cua đều bề, hết phình.
 *   · đầu đường cụt        → lõi `myHalf`, một cánh ⇒ kết thúc bằng một cái mũ vuông đúng bề rộng.
 *
 * ⚠️ HÀM THUẦN VÀ ĐƯỢC DÙNG CHUNG với bài test hình học (`terrainMesh.test.js`) — bài test hỏi
 * chính hàm này rồi đối chiếu với đỉnh dựng ra, chứ KHÔNG diễn đạt lại luật bằng công thức riêng.
 * Hai công thức "tương đương" cho cùng một luật thì gần như luôn lệch nhau ở biên (Phase 3Y).
 *
 * @param {number} myHalf  nửa bề rộng lòng đường của CHÍNH ô này (`streetCrossSection().half`)
 * @param {{west:?number, east:?number, north:?number, south:?number}} nbHalf
 *        nửa bề rộng của ô đường HÀNG XÓM mỗi phía; `null`/`undefined` = phía ấy không có đường
 * @returns {{coreU:number, coreV:number, arms:object, reach:object}}
 *        `coreU`/`coreV` = nửa bề ngang của LÕI theo trục u / trục v (một ngã tư có hai bề rộng
 *        khác nhau, nên đây phải là HAI con số — gộp làm một là dựng lại đúng cái giả định hình
 *        chữ nhật vừa gỡ bỏ);
 *        `arms[phía]` = nửa bề rộng TẠI RANH GIỚI ô (null nếu không có cánh tay phía ấy);
 *        `reach[phía]` = hộp bao của cả lòng đường phía ấy (0,5 nếu có cánh tay, lõi nếu không)
 */
export function carriagewayShape(myHalf, nbHalf) {
  const mine = Math.max(0, Math.min(0.5, Number.isFinite(myHalf) ? myHalf : 0.25));
  const arms = { west: null, east: null, north: null, south: null };
  for (const phía of SIDES) {
    const nb = nbHalf?.[phía];
    if (!Number.isFinite(nb) || nb <= 0) continue;
    // Luật 1 — chỗ nối rộng bằng con đường hẹp hơn. Đối xứng ⇒ hai ô kề nhau không thể lệch.
    arms[phía] = Math.max(0, Math.min(mine, Math.min(0.5, nb)));
  }
  const coNgang = arms.west !== null || arms.east !== null;
  const coDoc = arms.north !== null || arms.south !== null;
  // Nửa bề rộng của con đường chạy theo mỗi TRỤC. Hai cánh cùng trục có thể khác nhau (một đầu
  // là đại lộ, đầu kia là ngõ) — lấy `max` vì lòng đường ở giữa ô phải đủ rộng cho cả hai.
  const nuaNgang = coNgang ? Math.max(arms.west ?? 0, arms.east ?? 0) : null;
  const nuaDoc = coDoc ? Math.max(arms.north ?? 0, arms.south ?? 0) : null;
  // Lõi = chỗ hai con đường CHỒNG LÊN NHAU. Bề ngang của nó theo trục u chính là bề rộng của con
  // đường chạy DỌC, và ngược lại — đó là định nghĩa của một ngã tư, không phải một hằng số chọn tay.
  const coreU = nuaDoc ?? nuaNgang ?? mine;
  const coreV = nuaNgang ?? nuaDoc ?? mine;
  const reach = {
    west: arms.west === null ? coreU : 0.5,
    east: arms.east === null ? coreU : 0.5,
    north: arms.north === null ? coreV : 0.5,
    south: arms.south === null ? coreV : 0.5,
  };
  return { coreU, coreV, arms, reach };
}

/** Bảng tra để test kiểm nhanh: kỷ nào khai gì. Không dùng trong lúc chạy. */
export function isValidStreetStyle(style) {
  return !!style
    && PAVING_SET.has(style.paving)
    && MARKING_SET.has(style.markings)
    && Number.isFinite(style.avenue) && style.avenue > 0 && style.avenue <= MAX_AVENUE
    && Number.isFinite(style.lane) && style.lane > 0 && style.lane <= MAX_AVENUE
    // ⚠️ `stone` chỉ được là 0 (liền khối) hoặc một cỡ MÀN HÌNH DỰNG RA ĐƯỢC. Xem `MIN_STONE`: khai
    // nhỏ hơn thì cái kẹp trong `pavingSubdivision` sẽ nuốt mất phần chênh lệch trong im lặng.
    && Number.isFinite(style.stone) && style.stone >= 0 && style.stone < 1
    && (style.stone === 0 || style.stone >= MIN_STONE - 1e-9)
    && Number.isFinite(style.wear) && style.wear >= 0 && style.wear <= 1
    && Number.isFinite(style.curb) && style.curb >= 0
    && Number.isFinite(style.walk) && style.walk >= 0
    && (style.edge === 'blend' || style.edge === 'hard');
}
