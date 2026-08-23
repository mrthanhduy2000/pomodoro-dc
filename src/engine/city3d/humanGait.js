/**
 * humanGait.js — DÁNG ĐI. Mười bốn kiểu đi, và không kiểu nào là "cùng một dáng chỉnh nhanh chậm".
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`. Đúng khuôn ba lớp đã dùng
 * mười lần trong dự án (BẢNG thuần → HÌNH/CHUYỂN ĐỘNG → nơi tiêu thụ): bảng ở đây, chuyển động ở
 * `humanPose.js`, nơi tiêu thụ là `sceneGraph.js`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY — CẢ MƯỜI LĂM KỶ TRƯỚC NAY ĐI ĐÚNG MỘT DÁNG
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `humanStyle.js` đã có `stride`, `walkSpeed`, `armSwing` — nhưng cả ba chỉ chỉnh **ĐỘ LỚN** của
 * cùng một chuyển động. Đổi ba con số ấy cho ra người bước dài hơn hoặc gấp hơn; nó KHÔNG cho ra
 * một CÁCH ĐI khác. Người gánh nước, người đội thúng, người lê dép trong nắng và người tất bật
 * trên vỉa hè Tokyo khác nhau ở chỗ hoàn toàn khác: **bàn chân nhấc cao bao nhiêu, gối có chùng
 * không, thân có lắc ngang không, đai hông và đai vai có xoay ngược nhau không, hai bàn chân đặt
 * rộng hay hẹp, cái đầu có đứng yên không.**
 *
 * Sáu câu hỏi ấy là sáu trường dưới đây.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ BẢNG NÀY ĐÃ ĐỔI RUỘT (2026-08-25, ADR-057) — ĐỌC KỸ NẾU BẠN NHỚ BẢN CŨ
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Bản trước (ADR-056) có trường `knee` = **ĐẦU GỐI GIẢ**: chân là MỘT khối cứng, không gập được,
 * nên lúc đưa chân nó bị **rút ngắn lại**. Kèm theo đó là cả một định lý về việc hệ số rút phải là
 * `sin²` chứ không `sin`, vì phép rút nằm dưới dấu chia của công thức góc hông và có thể làm bàn
 * chân trượt.
 *
 * ⇒ **TOÀN BỘ chuyện đó nay là LỊCH SỬ, không phải vì nó sai mà vì TIỀN ĐỀ của nó đã bị gỡ.**
 * Chân nay có **đầu gối THẬT** (`thigh` + `shin`, hai khối, một khớp gối ở giữa), nên `humanPose.js`
 * không còn suy góc từ chiều dài chân nữa: nó **khai chỗ đặt bàn chân trước, rồi giải ngược ra góc
 * đùi và góc gối** (động học ngược, hai đoạn). Bàn chân đứng đúng chỗ được khai **theo cấu tạo**,
 * không còn là một bất đẳng thức phải canh. Đây đúng hình dạng bài học Phase 8C: *một kết luận
 * đúng vẫn có thể hết đúng khi tiền đề của nó bị gỡ ở một phase khác* — nên ADR-056 được GIỮ
 * NGUYÊN trong sổ, và ADR-057 nói rõ nó đảo phần nào.
 *
 * ⚠️ HAI THỨ TRƯỚC NAY BỊ CẤM NAY ĐƯỢC PHÉP, VÀ ĐÓ LÀ PHẦN LỜI LỚN NHẤT CỦA VIỆC ĐỔI SANG ĐỘNG
 * HỌC NGƯỢC. Chú thích cũ ở chính file này ghi *"`sway` KHÔNG dịch cái hông, vì bộ khớp chỉ xoay
 * quanh MỘT trục nên cái chân không dạng ra bù được"* và *"đai hông xoay thì phải TRỪ tay đúng
 * đoạn ấy đi"*. Cả hai câu ấy nói về một mô hình **thuận** (khai góc → suy ra bàn chân rơi đâu).
 * Với động học **ngược** (khai bàn chân → suy ra góc), mọi phép bù trở nên **tự động**: hông dịch
 * đi đâu, xoay bao nhiêu, cái chân tự tìm lại đúng bàn chân đã khai. ⇒ `TECH_DEBT #82` ĐÓNG.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ CHI TIẾT NÀY DÀNH CHO KHUNG NÀO — TRẢ LỜI TRƯỚC KHI VIẾT MÃ (luật Đàm, HỆ QUẢ 2b)
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *   `lift`      → **TOÀN CẢNH.** Nó đổi ĐƯỜNG BAO: có khe hở giữa bàn chân và mặt đất hay không.
 *                 Đường bao là thứ duy nhất sống sót ở 18 điểm ảnh.
 *   `flex`      → **TOÀN CẢNH.** Gối chùng thì cả người thấp xuống và hai chân thành hình chữ V
 *                 gãy khúc thay vì hai que thẳng — đổi đường bao ở khối lớn thứ hai cơ thể.
 *   `sway`      → **TOÀN CẢNH.** Nó dịch cái THÂN, khối lớn nhất cơ thể.
 *   `headTrack` → **TOÀN CẢNH.** Cái đầu là khối sáng nhất và nằm ở mép TRÊN của hình bóng.
 *   `splay`     → **TOÀN CẢNH (yếu).** Hai bàn chân xa nhau ra thì hình bóng rộng hơn ở đáy.
 *   `twist`     → **CẬN CẢNH.** Vai dịch nhiều nhất ≈ 0,5 điểm ảnh mỗi bên ở khung mặc định, DƯỚI
 *                 ngưỡng mắt. Nó tồn tại cho camera bay tới (ADR-034), và nói thẳng ra điều đó là
 *                 bắt buộc: Phase 11 đã tiêu 110.076 tam giác lên mái rồi mới biết bản quét không
 *                 phân biệt nổi.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ HAI RÀNG BUỘC KHÔNG ĐƯỢC PHÁ
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * 1. **BÀN CHÂN KHÔNG ĐƯỢC TRƯỢT.** Suốt pha tiếp đất, bàn chân phải đứng yên trong toạ độ THẾ
 *    GIỚI — cả ba trục, kể cả trục ngang (trước ADR-057 chỉ giữ được hai trục).
 * 2. **KHÔNG KHAI THÊM MỘT ĐẠI LƯỢNG NÀO ĐÃ CÓ Ở `humanStyle.js`.** Tốc độ, sải chân, biên độ vung
 *    tay, độ khom đều đã có chỗ của chúng. Khai lại ở đây là "một luật hai công thức" — cái bẫy đã
 *    cắn ở `daylight.test.js` (hai định nghĩa "chân trời ấm") và ở `cadenceOf`.
 */

/**
 * MƯỜI BỐN KIỂU ĐI. Mỗi kiểu phải trả lời được *"ai đi như thế, và vì sao"* — không có kiểu nào
 * tồn tại chỉ để bảng dài ra. `humanGait.test.js` đòi mỗi kiểu có ÍT NHẤT một kỷ dùng: một kiểu
 * không ai dùng là một trục CHẾT, nó không làm gì hỏng nên không có gì đỏ lên (bài học Phase 11).
 */
export const GAIT_KINDS = [
  'stride',   // sải dài thong dong — đi đường dài trên địa hình hoang
  'glide',    // lướt — đội vật trên đầu hoặc áo chùng phủ chân, cái đầu gần như bất động
  'march',    // đi đều — nhấc chân cao, thân thẳng, ít lắc
  'mince',    // bước nhỏ — quy chế lễ nghi ghì chân lại, hai bàn chân đặt sát nhau
  'trudge',   // lê — kiệt sức: gối chùng nặng, chân không nhấc, thân lắc mạnh
  'bounce',   // nảy — đòn gánh tre bật theo nhịp, thân trên nảy mạnh hơn hông
  'roll',     // lắc — dáng thuỷ thủ quen giữ thăng bằng trên boong, chân dạng rộng
  'bustle',   // tất bật — vỉa hè đông, chân nhấc gọn, thân xoay mạnh
  'saunter',  // thong thả — không vội, mọi thứ vừa phải
  'prowl',    // rình — thợ săn hạ thấp trọng tâm, gối chùng sâu nhất bảng
  'shuffle',  // lê dép — bàn chân gần như trượt trên mặt đường, không nhấc
  'swagger',  // nghênh ngang — vai đảo rộng, chân dạng, ngực ưỡn
  'plod',     // nện — phu khuân vác, đều đặn và nặng, không phí một cử động nào
  'scurry',   // rảo — bước ngắn mà tần suất cao, thân gần như không lắc
];

/**
 * ⚠️ SÁU TRƯỜNG, VÀ MỖI TRƯỜNG PHẢI ĐỔI ĐƯỢC MỘT THỨ MẮT ĐỌC RA. Đọc kỹ trước khi chỉnh.
 *
 * `lift`      — **BÀN CHÂN NHẤC CAO BAO NHIÊU Ở GIỮA PHA ĐƯA CHÂN**, tính bằng phần của chiều dài
 *               chân. Đây là trường thay thế `knee` cũ, và phép thay thế ấy có lý do: cái mắt thật
 *               sự đọc ở 18 điểm ảnh chưa bao giờ là góc đầu gối — nó là **QUỸ ĐẠO BÀN CHÂN**.
 *               Bản cũ khai một hệ số rút chân rồi để quỹ đạo bàn chân rơi ra như một hệ quả; nay
 *               khai thẳng quỹ đạo, và để góc gối rơi ra như một hệ quả. Đúng chiều nhân quả.
 *
 * `flex`      — **GỐI CHÙNG BAO NHIÊU LÚC ĐỨNG TRỤ**, tính bằng phần chiều cao hông bị hạ xuống
 *               so với chân duỗi thẳng. 0 = chân trụ thẳng đơ (mô hình cũ, và cũng đúng cho lính
 *               đi đều); 0,14 = ngồi xổm nửa chừng (dáng rình).
 *               ⚠️ **NÓ CŨNG LÀ THỨ BẢO ĐẢM CHÂN KHÔNG BAO GIỜ PHẢI DUỖI QUÁ THẲNG.** Khoảng cách
 *               hông↔bàn chân là `√(off² + hipY²)`; với `hipY = √(L² − off²)·(1 − flex)` thì nó
 *               bằng `L·√(sin²α + (1−flex)²cos²α) ≤ L` với MỌI `flex ≥ 0`. Tức tính giải được của
 *               bài động học ngược là một hệ quả đại số của chính công thức này, không phải một
 *               phép kẹp thêm vào.
 *
 * `sway`      — **BIÊN ĐỘ LẮC NGANG**, tính bằng phần của bề ngang thân. Chu kỳ bằng đúng một chu
 *               kỳ chân: người dồn trọng tâm về phía chân đang trụ.
 *               ⚠️ TỪ ADR-057 NÓ DỊCH CẢ ĐAI HÔNG, KHÔNG CHỈ THÂN TRÊN. Bản cũ chỉ dám dịch thân
 *               trên vì bộ khớp một trục làm bàn chân trượt ngang 3 tới 4 điểm ảnh. Nay bàn chân
 *               là ĐẦU VÀO của bài toán chứ không phải đầu ra, nên hông dịch bao nhiêu cũng được:
 *               cái chân tự dạng ra để giữ bàn chân tại chỗ, đúng như người thật.
 *
 * `twist`     — **HỆ SỐ XOAY NGƯỢC CỦA ĐAI VAI VÀ ĐAI HÔNG.** 0 = thân trên là một cột cứng; 1,3 =
 *               xoay mạnh. Người thật đi bộ thì đai hông xoay theo chân đang bước tới còn lồng
 *               ngực xoay ngược lại để triệt mô men — bỏ nó đi chính là thứ làm một hình nhân
 *               trông như robot dù chân tay đã đúng pha.
 *               ⚠️ TỪ ADR-057 ĐAI HÔNG XOAY THẬT. Chú thích cũ ở đây ghi rằng làm thế thì *"phải
 *               TRỪ đúng đoạn ấy khỏi độ dịch bàn chân"* — câu đó đúng cho mô hình THUẬN và vô
 *               nghĩa với mô hình NGƯỢC. Không có một số hạng bù nào trong `humanPose.js` cả, và
 *               việc không cần nó chính là bằng chứng rằng phép đổi mô hình đã đi đúng hướng.
 *
 * `headTrack` — **THÂN TRÊN BÁM CÁI NHÚN CỦA HÔNG TỚI ĐÂU.** 1 = đầu đứng yên tuyệt đối trong khi
 *               hông nhún (người đội vật trên đầu); 0 = đầu nhún y hệt hông; **ÂM = đầu nhún MẠNH
 *               HƠN hông** (đòn gánh tre bật, tải trọng nảy ngược pha).
 *
 * `splay`     — **HAI BÀN CHÂN ĐẶT RỘNG HAY HẸP**, tính bằng phần của nửa bề ngang hông, cộng vào
 *               vị trí ngang của bàn chân. Dương = dạng ra (thuỷ thủ, phu khuân vác, người đi ủng
 *               nặng); ÂM = đặt chân sát trục giữa (bước lễ nghi, người mặc váy hẹp).
 *               ⚠️ TRƯỜNG NÀY KHÔNG THỂ TỒN TẠI TRƯỚC ADR-057: nó là một đại lượng thuần ngang, mà
 *               bộ khớp cũ không có trục ngang nào.
 */
const GAIT_PROFILES = {
  // Thợ săn đường dài: sải rộng, chân nhấc dứt khoát, vai đảo theo bước.
  stride:  { lift: 0.16, flex: 0.03, sway: 0.14, twist: 1.00, headTrack: 0.30, splay: 0.10 },
  // Đội vật trên đầu (hoặc áo chùng phủ kín chân): mọi thứ phải thật êm, cái đầu là mặt phẳng chuẩn.
  glide:   { lift: 0.06, flex: 0.02, sway: 0.04, twist: 0.30, headTrack: 0.95, splay: 0.02 },
  // Đi đều: nhấc chân CAO NHẤT bảng, gối duỗi thẳng nhất bảng, thân gần như không lắc.
  march:   { lift: 0.22, flex: 0.01, sway: 0.06, twist: 0.55, headTrack: 0.45, splay: 0.05 },
  // Bước lễ nghi: chân gần như không rời đất, hai bàn chân đặt SÁT trục giữa.
  mince:   { lift: 0.04, flex: 0.02, sway: 0.05, twist: 0.22, headTrack: 0.70, splay: -0.12 },
  // Lê vì kiệt sức: gối chùng nặng, thân lắc mạnh để lấy đà, chân không buồn nhấc.
  trudge:  { lift: 0.03, flex: 0.12, sway: 0.24, twist: 0.28, headTrack: 0.10, splay: 0.14 },
  // Đòn gánh tre: tải trọng nảy NGƯỢC PHA với hông ⇒ `headTrack` âm, kỷ duy nhất.
  bounce:  { lift: 0.10, flex: 0.05, sway: 0.10, twist: 0.45, headTrack: -0.85, splay: 0.06 },
  // Thuỷ thủ: lắc NHIỀU NHẤT bảng và chân dạng rộng — hai thứ ấy đi với nhau, đó là cách người ta
  // đứng vững trên một cái sàn đang nghiêng.
  roll:    { lift: 0.09, flex: 0.07, sway: 0.40, twist: 0.75, headTrack: 0.15, splay: 0.30 },
  // Vỉa hè đông: thân XOAY mạnh nhất bảng (lách người), chân nhấc gọn, không lắc ngang (không có chỗ).
  bustle:  { lift: 0.13, flex: 0.02, sway: 0.06, twist: 1.30, headTrack: 0.55, splay: 0.00 },
  // Thong thả: mọi trường ở khoảng giữa. Đây là mặc định khi bảng kỷ khai một kiểu lạ.
  saunter: { lift: 0.10, flex: 0.04, sway: 0.16, twist: 0.65, headTrack: 0.40, splay: 0.08 },
  // Rình: hạ trọng tâm SÂU NHẤT bảng, đầu giữ yên để mắt khỏi rung, chân đặt rộng cho vững.
  prowl:   { lift: 0.12, flex: 0.14, sway: 0.10, twist: 0.85, headTrack: 0.60, splay: 0.16 },
  // Lê dép: bàn chân NHẤC ÍT NHẤT bảng (0,02 — dép sẽ tuột nếu nhấc), gối hơi chùng, chân sát nhau.
  shuffle: { lift: 0.02, flex: 0.09, sway: 0.12, twist: 0.15, headTrack: 0.05, splay: -0.05 },
  // Nghênh ngang: vai đảo rộng, chân dạng, thân lắc — dáng của người đang muốn được nhìn.
  swagger: { lift: 0.11, flex: 0.06, sway: 0.30, twist: 1.10, headTrack: 0.25, splay: 0.22 },
  // Nện: phu khuân vác. Đều đặn, nặng, không phí một cử động nào — mọi trường đều ở mức trung bình
  // thấp trừ `flex` (gánh nặng thì gối phải chùng để giảm xóc).
  plod:    { lift: 0.07, flex: 0.10, sway: 0.20, twist: 0.35, headTrack: 0.20, splay: 0.12 },
  // Rảo: bước ngắn tần suất cao. Thân gần như KHÔNG lắc (0,03 — lắc thì mất thời gian), đầu rất yên.
  scurry:  { lift: 0.08, flex: 0.03, sway: 0.03, twist: 0.95, headTrack: 0.75, splay: -0.08 },
};

/**
 * Đai vai xoay tối đa bao nhiêu radian khi `twist = 1`. 0,20 rad ≈ 11,5°, nằm trong dải người thật
 * (lồng ngực xoay ±10 tới 15° khi đi bộ thường).
 */
export const THORAX_TWIST_RAD = 0.20;

/**
 * Đai HÔNG xoay tối đa bao nhiêu radian khi `twist = 1`. Nhỏ hơn đai vai và NGƯỢC CHIỀU — đó chính
 * là cơ chế triệt mô men xoắn. Người thật: hông ±4 tới 8°, tức khoảng một nửa lồng ngực.
 * ⚠️ Con số này chỉ dùng được từ ADR-057. Trước đó đai hông xoay là điều bị CẤM, vì mô hình thuận
 * không bù lại được chỗ bàn chân.
 */
export const PELVIS_TWIST_RAD = 0.10;

/** Hồ sơ của một kiểu đi. Kiểu lạ rơi về `saunter` — KHÔNG ném, vì đây là màn hình Thành Phố. */
export function gaitOf(kind) {
  // ⚠️ NHẬN CẢ MỘT HỒ SƠ ĐẦY ĐỦ, KHÔNG CHỈ MỘT CÁI TÊN — và đây là một quyết định, không phải một
  // sự tiện tay. Bài `humanGait.test.js` phải bơm được một hồ sơ KHÔNG có trong bảng để chứng minh
  // từng trục thật sự đi tới tư thế (bài học ADR-054: van an toàn `?? saunter` có đúng khả năng
  // nói dối như `?? BẢNG[1]` đã giấu lỗi màu lá suốt ba phase). Không có lối bơm này thì phép thử
  // chỉ so được các dòng bảng với nhau, tức nó đo cái BẢNG chứ không đo cái DÂY NỐI.
  // ⚠️ Và chính vì lối này tồn tại, bài test bảng ĐÒI `typeof style.gait === 'string'` ở cả 15 kỷ
  // lẫn mọi dòng mẫu — bảng tuyệt đối không được lợi dụng nó để khai một hồ sơ tại chỗ, vì làm vậy
  // là dựng lại 15 dòng số rời rạc không ai canh.
  if (typeof kind === 'object' && isValidGaitProfile(kind)) return kind;
  return GAIT_PROFILES[kind] ?? GAIT_PROFILES.saunter;
}

/** Tên kiểu đi có tồn tại không. `humanStyle.js` gọi để một dòng bảng khai sai bị bắt ngay. */
export function isValidGait(kind) {
  return Object.hasOwn(GAIT_PROFILES, kind);
}

/**
 * Một hồ sơ dáng đi có hợp lệ không. **TỪ CHỐI THẲNG, KHÔNG TỰ CHỮA** — tự chữa là cách một bảng
 * 14 dòng lặng lẽ thoái hoá về 1 dòng (bẫy `MIN_STONE` Phase 9D).
 *
 * ⚠️ CÁC BIÊN Ở ĐÂY LÀ BIÊN **GIẢI PHẪU**, KHÔNG PHẢI BIÊN AN TOÀN SỐ HỌC — và đó là một thay đổi
 * so với ADR-056. Ở bản cũ, chặn dưới `knee ≥ 0,5` là điều kiện để bàn chân khỏi trượt, tức một
 * ĐỊNH LÝ. Nay bàn chân là đầu vào của bài toán nên không còn ràng buộc số học nào cả; các biên
 * dưới đây chỉ nói *"quá mức này thì nó thôi là một người đang đi bộ"*. Nói rõ điều đó ra là bắt
 * buộc: một cái cổng bị đổi ruột mà giữ nguyên hình dạng thì phiên sau sẽ tưởng nó vẫn canh thứ cũ.
 */
export function isValidGaitProfile(p) {
  if (!p || typeof p !== 'object') return false;
  if (!(p.lift >= 0.02 && p.lift <= 0.24)) return false;
  if (!(p.flex >= 0 && p.flex <= 0.16)) return false;
  if (!(p.sway >= 0 && p.sway <= 0.5)) return false;
  if (!(p.twist >= 0 && p.twist <= 1.5)) return false;
  if (!(p.headTrack >= -1 && p.headTrack <= 1)) return false;
  if (!(p.splay >= -0.35 && p.splay <= 0.45)) return false;
  return true;
}

/** Toàn bộ bảng, dạng cặp [tên, hồ sơ]. Bài test duyệt nó thay vì gọi `gaitOf` từng cái. */
export function allGaitProfiles() {
  return GAIT_KINDS.map((k) => [k, GAIT_PROFILES[k]]);
}
