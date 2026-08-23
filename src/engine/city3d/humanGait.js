/**
 * humanGait.js — DÁNG ĐI. Chín kiểu đi, và không kiểu nào là "cùng một dáng chỉnh nhanh chậm".
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`. Đúng khuôn ba lớp đã dùng
 * mười lần trong dự án (BẢNG thuần → HÌNH/CHUYỂN ĐỘNG → nơi tiêu thụ): bảng ở đây, chuyển động ở
 * `humanPose.js`, nơi tiêu thụ là `sceneGraph.js`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY — CẢ MƯỜI LĂM KỶ TRƯỚC NAY ĐI ĐÚNG MỘT DÁNG
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `humanStyle.js` đã có `stride`, `walkSpeed`, `armSwing` — nhưng cả ba chỉ chỉnh **ĐỘ LỚN** của
 * cùng một chuyển động: hai cái que xoay quanh hông trong đúng MỘT mặt phẳng đứng, cộng một cái
 * nhún suy ra từ hình học chân trụ. Đổi ba con số ấy cho ra người bước dài hơn hoặc gấp hơn; nó
 * KHÔNG cho ra một CÁCH ĐI khác. Người gánh nước, người đội thúng, người lê chân trong tuyết và
 * người tất bật trên vỉa hè Tokyo khác nhau ở chỗ hoàn toàn khác: **bàn chân có nhấc lên không,
 * thân có lắc ngang không, vai có xoay ngược hông không, cái đầu có đứng yên không.**
 *
 * Bốn câu hỏi ấy là bốn trường dưới đây, và bốn chiều chuyển động ấy trước file này **bằng 0
 * tuyệt đối** — không phải "nhỏ", mà là không tồn tại.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ CHI TIẾT NÀY DÀNH CHO KHUNG NÀO — TRẢ LỜI TRƯỚC KHI VIẾT MÃ (luật Đàm, HỆ QUẢ 2b)
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *   `knee`      → **TOÀN CẢNH.** Nó đổi ĐƯỜNG BAO: có khe hở giữa bàn chân và mặt đất hay không.
 *                 Đường bao là thứ duy nhất sống sót ở 18 điểm ảnh (đo được, xem `humanStyle.js`).
 *   `sway`      → **TOÀN CẢNH.** Nó dịch cái THÂN, khối lớn nhất cơ thể, 2 tới 4 điểm ảnh.
 *   `headTrack` → **TOÀN CẢNH.** Cái đầu là khối sáng nhất và nó nằm ở mép TRÊN của hình bóng.
 *   `twist`     → **CẬN CẢNH.** Đo được: vai dịch nhiều nhất ≈ 0,5 điểm ảnh mỗi bên ở khung mặc
 *                 định — DƯỚI ngưỡng mắt. Nó tồn tại cho camera bay tới (ADR-034), và nói thẳng ra
 *                 điều đó là bắt buộc: Phase 11 đã tiêu 110.076 tam giác lên mái rồi mới biết bản
 *                 quét không phân biệt nổi.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ BA RÀNG BUỘC KHÔNG ĐƯỢC PHÁ, VÀ CHÚNG QUYẾT ĐỊNH HÌNH DẠNG CỦA CẢ FILE NÀY
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * 1. **BÀN CHÂN KHÔNG ĐƯỢC TRƯỢT.** Suốt pha tiếp đất, bàn chân phải đứng yên trong toạ độ THẾ
 *    GIỚI. Đó là lý do `knee` chỉ tác động trong pha ĐƯA CHÂN (chân đang ở trên không), và là lý
 *    do `sway` **KHÔNG** dịch cái hông — xem chú thích `sway` bên dưới.
 * 2. **CÁI NHÚN VẪN LÀ HỆ QUẢ CỦA CHÂN TRỤ, KHÔNG PHẢI MỘT HÀM SIN RIÊNG.** Bảng này KHÔNG có
 *    trường "biên độ nhún". Đã thử và đã BỎ: một trường `rise` (chân duỗi thêm giữa pha tiếp đất,
 *    để kỷ 6 nảy theo đòn gánh) đẩy hông LÊN TRÊN chiều cao đứng yên, tức phá thẳng bất biến
 *    *"cái nhún luôn kéo xuống"* mà `humanPose.test.js` canh — và nó phá vì một lý do vật lý thật:
 *    mô hình này **không có cổ chân**, nên "nhón chân" là điều nó không được phép giả vờ.
 *    ⇒ Cái nảy của đòn gánh diễn đạt bằng `headTrack` ÂM (thân trên nảy MẠNH HƠN hông) — cùng một
 *    hiện tượng, nhưng nói bằng một đại lượng mà mô hình này có thật.
 * 3. **KHÔNG KHAI THÊM MỘT ĐẠI LƯỢNG NÀO ĐÃ CÓ Ở `humanStyle.js`.** Tốc độ, sải chân, biên độ vung
 *    tay, độ khom đều đã có chỗ của chúng. Khai lại ở đây là "một luật hai công thức" — cái bẫy đã
 *    cắn ở `daylight.test.js` (hai định nghĩa "chân trời ấm") và ở `cadenceOf` (sai đơn vị suốt
 *    thời kỳ chỉ có một kỷ được thiết kế).
 */

/**
 * CHÍN KIỂU ĐI. Mỗi kiểu phải trả lời được *"ai đi như thế, và vì sao"* — không có kiểu nào tồn
 * tại chỉ để bảng dài ra. `humanGait.test.js` đòi mỗi kiểu có ÍT NHẤT một kỷ dùng: một kiểu không
 * ai dùng là một trục CHẾT, nó không làm gì hỏng nên không có gì đỏ lên (bài học Phase 11).
 */
export const GAIT_KINDS = [
  'stride',   // sải dài thong dong — đi đường dài trên địa hình hoang
  'glide',    // lướt — đội vật trên đầu, cái đầu gần như bất động
  'march',    // đi đều — nhấc chân cao, thân thẳng, ít lắc
  'mince',    // bước nhỏ — áo chấm đất ghì chân lại, gần như không nhấc chân
  'trudge',   // lê — kiệt sức hoặc tuyết sâu: chân không nhấc, thân lắc nặng
  'bounce',   // nảy — đòn gánh tre bật theo nhịp, thân trên nảy mạnh hơn hông
  'roll',     // lắc — dáng thuỷ thủ quen giữ thăng bằng trên boong
  'bustle',   // tất bật — vỉa hè đông, chân nhấc gọn, thân xoay mạnh
  'saunter',  // thong thả — không vội, mọi thứ vừa phải
];

/**
 * ⚠️ BỐN TRƯỜNG, VÀ MỖI TRƯỜNG PHẢI ĐỔI ĐƯỢC MỘT THỨ MẮT ĐỌC RA. Đọc kỹ trước khi chỉnh.
 *
 * `knee`      — **CHIỀU DÀI CHÂN CÒN LẠI Ở GIỮA PHA ĐƯA CHÂN**, tính bằng phần của chiều dài
 *               chân đứng thẳng. 1 = chân cứng đơ (đúng mô hình cũ); 0,66 = co mạnh, bàn chân
 *               nhấc cao.
 *
 *               ⚠️ ĐÂY LÀ MỘT CÁI ĐẦU GỐI GIẢ, VÀ PHẢI GỌI ĐÚNG TÊN NÓ. Một khối cứng không bẻ
 *               gập được, nên thay vì gập gối, chân được **rút ngắn lại** giữa pha đưa chân. Thứ
 *               mắt thật sự đọc ở 18 điểm ảnh không phải cái đầu gối — nó là **QUỸ ĐẠO BÀN CHÂN**
 *               (bàn chân có rời mặt đất hay quét sát đất), và quỹ đạo ấy thì đúng. Muốn có đầu
 *               gối THẬT phải tách chân làm hai khối, tức 2 khối/người, mà trần Đàm đặt là 11.
 *
 *               ⚠️ **CHẶN DƯỚI 0,5 LÀ MỘT ĐỊNH LÝ, KHÔNG PHẢI MỘT SỐ CHỌN CHO CHẮC.** Góc hông
 *               phải nằm dưới trần `asin(stride/4)` (bài `BIÊN ĐỘ KHỚP CÓ TRẦN`). Với chân rút
 *               còn `f`, góc là `asin(off / (legLen·f))`, nên cần `|off|/f` không vượt biên độ
 *               gốc. Đặt `s = sin(πu)`, biên độ pha đưa chân là `(cycle/4)·√(1−s²)` và
 *               `f = 1 − (1−knee)·s²`. Điều kiện là `√(1−s²) ≤ 1 − (1−knee)·s²` với mọi
 *               `s ∈ [0,1]`. Xét `g(s) = 1 − c·s² − √(1−s²)` với `c = 1 − knee`: `g(0) = 0`,
 *               `g(1) = 1 − c > 0`, và `g′(s) = s·(1/√(1−s²) − 2c) > 0` với mọi `c ≤ 0,5`. ⇒ `g ≥ 0`
 *               khi và chỉ khi `knee ≥ 0,5`. Đó cũng chính là lý do dùng `sin²` chứ không `sin`:
 *               với `sin` thì `g′(0) < 0` và bất đẳng thức **vỡ ngay sát hai đầu pha**, ở mọi giá
 *               trị `knee` — một cái sai không có triệu chứng nào ngoài một bài test đỏ.
 *
 * `sway`      — **BIÊN ĐỘ LẮC NGANG CỦA THÂN TRÊN**, tính bằng phần của bề ngang thân. Chu kỳ
 *               bằng đúng một chu kỳ chân: người dồn trọng tâm về phía chân đang trụ.
 *
 *               ⚠️ NÓ DỊCH THÂN, VAI, ĐẦU — **KHÔNG DỊCH HÔNG**, và đó là hệ quả bắt buộc của ràng
 *               buộc số 1. Ngoài đời cái hông CÓ dịch ngang, và cái chân bù lại bằng cách dạng ra
 *               (khớp háng xoay trong mặt phẳng trước-sau lẫn trái-phải). Bộ khớp ở đây chỉ xoay
 *               quanh MỘT trục (trước-sau), nên nếu dịch hông thì bàn chân trượt ngang trên mặt
 *               đường — 3 tới 4 điểm ảnh với kiểu `roll`, tức đúng cái lỗi "trượt patin" mà cả
 *               `humanPose.js` sinh ra để tránh. ⇒ Chỉ thân trên lắc. Phần còn thiếu ghi ở
 *               `TECH_DEBT`, không giả vờ là đã có.
 *
 * `twist`     — **HỆ SỐ XOAY NGƯỢC CỦA ĐAI VAI VÀ ĐAI HÔNG.** 0 = thân trên là một cột cứng (mô
 *               hình cũ); 1,3 = xoay mạnh. Người thật đi bộ thì hông xoay theo chân đang bước tới
 *               còn lồng ngực xoay ngược lại để triệt mô men — bỏ nó đi chính là thứ làm một hình
 *               nhân trông như robot dù chân tay đã đúng pha.
 *
 *               ⚠️ HÔNG XOAY THÌ BÀN CHÂN PHẢI ĐƯỢC BÙ LẠI. Đai hông xoay đưa khớp háng ra trước
 *               một đoạn, và `humanPose.js` TRỪ đúng đoạn ấy khỏi độ dịch bàn chân trước khi tính
 *               góc hông ⇒ bàn chân đáp xuống đúng chỗ cũ. Không có phép bù đó thì mỗi bước chân
 *               trượt thêm một đoạn bằng chính phần hông xoay, mà bài test bàn chân sẽ đỏ với một
 *               thông báo trỏ vào chỗ hoàn toàn khác.
 *
 * `headTrack` — **THÂN TRÊN BÁM CÁI NHÚN CỦA HÔNG TỚI ĐÂU.** 1 = đầu đứng yên tuyệt đối trong khi
 *               hông nhún (người đội vật trên đầu); 0 = đầu nhún y hệt hông; **ÂM = đầu nhún MẠNH
 *               HƠN hông** (đòn gánh tre bật, tải trọng nảy ngược pha). Xem ràng buộc số 2 ở trên
 *               để biết vì sao cái nảy phải nói bằng trường này chứ không bằng một trường "biên độ
 *               nhún" riêng.
 */
const GAIT_PROFILES = {
  /** Đi săn, đường dài, không vội: sải rộng, chân nhấc thoải mái, thân xoay đầy đủ. */
  stride: { knee: 0.74, sway: 0.16, twist: 1.00, headTrack: 0.30 },

  /**
   * Đội vò/thúng trên đầu. ⚠️ `headTrack: 0,95` KHÔNG phải một lựa chọn mỹ thuật — nó là điều kiện
   * để cái vò không rơi. Người đội đầu học cách biến cột sống thành một bộ giảm xóc, và cái đầu
   * trôi ngang gần như trên một đường thẳng. Đó cũng là lý do `sway` thấp nhất bộ.
   */
  glide: { knee: 0.88, sway: 0.05, twist: 0.35, headTrack: 0.95 },

  /** Đi đều, có ý thức: nhấc chân cao nhất bộ, thân thẳng, lắc ít. */
  march: { knee: 0.66, sway: 0.09, twist: 0.65, headTrack: 0.45 },

  /**
   * Bước nhỏ trong áo chấm đất. Chân gần như không nhấc được (gấu áo cản), nên `knee` cao — cao ở
   * đây nghĩa là chân THẲNG, tức nhấc ÍT. Dễ đọc ngược, và đó là lý do trường này tên `knee` chứ
   * không tên `lift`.
   */
  mince: { knee: 0.92, sway: 0.04, twist: 0.25, headTrack: 0.70 },

  /** Lê: kiệt sức hoặc tuyết sâu. Chân quét sát đất, thân đổ nặng sang bên, đầu gật theo. */
  trudge: { knee: 0.95, sway: 0.26, twist: 0.30, headTrack: 0.10 },

  /**
   * Gánh đòn tre. `headTrack` ÂM là cả điểm của kiểu này: đòn tre là một cái lò xo, tải trọng nảy
   * NGƯỢC pha với hông, nên vai và đầu nhún mạnh hơn hông chứ không ít hơn. Không kiểu nào khác
   * trong bảng có giá trị âm.
   */
  bounce: { knee: 0.80, sway: 0.12, twist: 0.50, headTrack: -0.85 },

  /** Dáng thuỷ thủ: LẮC NGANG MẠNH NHẤT BỘ, quen giữ thăng bằng trên boong nghiêng. */
  roll: { knee: 0.82, sway: 0.40, twist: 0.80, headTrack: 0.15 },

  /** Vỉa hè đông, đi gấp: chân nhấc gọn, THÂN XOAY MẠNH NHẤT BỘ, đầu giữ hướng nhìn. */
  bustle: { knee: 0.70, sway: 0.07, twist: 1.30, headTrack: 0.55 },

  /** Thong thả, không vội, không mang vác: mọi thứ vừa phải. */
  saunter: { knee: 0.84, sway: 0.18, twist: 0.70, headTrack: 0.40 },
};

/**
 * ⚠️ BIÊN ĐỘ XOAY, TÍNH BẰNG RADIAN, KHAI Ở ĐÂY CHỨ KHÔNG Ở BẢNG. Bảng khai HỆ SỐ (kỷ này xoay
 * mạnh hay nhẹ), hai hằng số này khai CỠ (xoay mạnh thì là bao nhiêu độ). Trộn hai chuyện đó vào
 * một con số là đúng cái bẫy `storyHeight` (Phase 5B): mỗi lần muốn chỉnh cỡ chung lại phải sửa
 * mười lăm dòng, và sớm muộn có dòng bị quên.
 *
 * Người thật: đai hông xoay khoảng ±4…8°, lồng ngực xoay ngược khoảng ±7…11°. Hai con số dưới đây
 * là đầu trên của dải ấy, vì hệ số bảng có kỷ khai dưới 1.
 */
export const PELVIS_TWIST_RAD = 0.14;
export const THORAX_TWIST_RAD = 0.20;

/**
 * Hồ sơ của một kiểu đi. Tên lạ → `saunter`, KHÔNG ném: dữ liệu cloud có thể hỏng và một ngoại lệ
 * ở đây làm sập cả màn hình Thành Phố (cùng luật với `getHumanStyle`).
 *
 * ⚠️ NHƯNG PHÉP RƠI VỀ MẶC ĐỊNH ẤY LÀ MỘT CÁI BỊT MIỆNG, và dự án vừa trả giá đúng chỗ này
 * (ADR-054: `getFloraStyle`/`getHumanStyle` rơi về kỷ 1 khiến 15 kỷ dùng chung một màu lá suốt ba
 * phase mà không gì đỏ lên). ⇒ `humanGait.test.js` hỏi ở ĐẦU BÊN KIA: mười lăm kỷ có ra mười lăm
 * bộ chuyển động phân biệt được không. Bản thân hàm này sẽ không bao giờ kêu.
 */
export function gaitOf(kind) {
  return GAIT_PROFILES[kind] ?? GAIT_PROFILES.saunter;
}

/** Kiểu đi có tồn tại không. `humanStyle.js` gọi để một dòng khai sai bị bắt ở tầng thuần. */
export function isValidGait(kind) {
  return Object.hasOwn(GAIT_PROFILES, kind);
}

/**
 * Bộ kiểm cho chính bảng hồ sơ. TỪ CHỐI THẲNG thay vì kẹp — bài học `MIN_STONE` của
 * `streetStyle.js`: cái kẹp nuốt mất phần chênh TRONG IM LẶNG.
 */
export function isValidGaitProfile(p) {
  if (!p || typeof p !== 'object') return false;
  // Chặn dưới 0,5 là ĐỊNH LÝ, xem chứng minh ở chú thích `knee`. Chặn trên 1 vì chân không dài ra.
  if (!(p.knee >= 0.5 && p.knee <= 1)) return false;
  if (!(p.sway >= 0 && p.sway <= 0.6)) return false;
  if (!(p.twist >= 0 && p.twist <= 1.5)) return false;
  // Âm được (đòn gánh nảy), nhưng không quá 1: đầu đứng yên là hết cỡ, không có "đứng yên hơn".
  if (!(p.headTrack >= -1 && p.headTrack <= 1)) return false;
  return true;
}

/** Hồ sơ thô, để bài test duyệt được cả bảng mà không phải chép lại. */
export function allGaitProfiles() {
  return GAIT_KINDS.map((k) => [k, GAIT_PROFILES[k]]);
}
