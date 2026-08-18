/**
 * roofStyle.js — BẢNG MÁI 15 KỶ: cái NHÔ LÊN khỏi mặt mái, và cái ĐƯỜNG chạy trên mái.
 *
 * ⚠️ VÌ SAO PHASE NÀY LÀ MÁI, VÀ VÌ SAO NÓ ĐÁNG GIÁ HƠN MỌI THỨ CÒN LẠI.
 * Camera của thành phố NHÌN TỪ TRÊN XUỐNG. Nghĩa là với mỗi công trình, **mái là mặt lớn nhất
 * trong khung hình** — lớn hơn cả bốn mặt tường cộng lại ở góc nhìn mặc định. Bước 2 của Phase 10
 * đã đo được điều ngược lại của cùng một sự thật: tầng trệt (thứ nằm sát đất, bị chính công trình
 * che) gần như **không nhìn thấy** trên bản quét 15 kỷ, dù nó đúng và dù test xanh. Mái là mặt đối
 * diện của tấm gương ấy.
 *
 * ⚠️ BẢNG NÀY LÀ BẢNG THỨ NĂM THEO KHUÔN "BẢNG ↔ HÌNH" (ADR-029, và trước đó `floraStyle.js` ·
 * `streetStyle.js` · `horizon.js` · `groundFloorStyle.js`). Bảng khai ở đây; hình học ở
 * `rooftop.js`; `buildingSpec.js` chỉ ĐỌC. Mỗi dòng buộc vào `country` mà `eraStyle.js` khai —
 * **bằng một BÀI TEST, không bằng khoảng cách vật lý trên màn hình**.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * HAI TRỤC, VÀ VÌ SAO ĐÚNG HAI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm xếp hạng thứ đáng làm theo đúng thứ tự mắt đọc ra được:
 *   (1) thứ **PHÁ MẶT PHẲNG** — ống khói · bể nước · cục nóng · lồng thang máy · cột ăng-ten ·
 *       giàn phơi · chậu cây sân thượng. Đây là `stack`.
 *   (2) thứ **TẠO ĐƯỜNG NÉT trên mái** — sống mái nổi · ngói bò · đầu đao · lan can mái. Đây là
 *       `crown`.
 *   (3) cửa sổ mái (dormer) — nằm ở `stack`, vì nó cũng phá mặt phẳng của mái dốc.
 * Mỗi kỷ khai **một hoặc hai** đặc trưng, không rắc đều mọi thứ cho mọi kỷ: rắc đều thì 15 kỷ lại
 * về giống nhau, chỉ là giống nhau ở mức rườm rà hơn (bài học `GROUND_FEATURES`).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO TÁCH KỲ QUAN KHỎI NHÀ DÂN — LẦN THỨ SÁU CỦA CÙNG MỘT CÂU HỎI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Câu hỏi đã cứu dự án năm lần (`storyHeight` 5B · `roofColor` 7A · `roof`→`vernacularRoof` 7C ·
 * bảng cây 8D · `feature`→`vernacularFeature` Phase 10): *"ngoài đời hai thứ này có luôn đi cùng
 * nhau không?"*
 * Áp vào mái, câu trả lời **rõ hơn mọi lần trước**, và đây là bốn ca đo được:
 *   - **Paris**: điện Panthéon đội một vành lan can đá và tuyệt đối trống trơn phía trên; chung cư
 *     Haussmann cùng thành phố, cùng thế kỷ, thì mái kẽm dốc đứng **cắm đầy lucarne** (cửa sổ mái).
 *   - **Manchester**: nhà máy có mái răng cưa lấy sáng bắc; dãy nhà thợ ngay bên cạnh là **rừng
 *     ống khói**.
 *   - **New York**: toà nhà lớn giấu buồng máy thang trong khối giật cấp; nhà thuê thấp tầng thì
 *     đội **bồn nước gỗ** — chính hình ảnh ấy mới là New York.
 *   - **Ur**: đỉnh ziggurat là sân lễ có tường chắn; nhà dân mái bằng có **cửa sập lên mái**.
 * ⇒ `crown`/`stack` cho công trình chính, `vernacularCrown`/`vernacularStack` cho nhà dân, và cả
 * bốn đều **BẮT BUỘC**. Trường tuỳ chọn sẽ lặng lẽ rơi về giá trị của kỳ quan và 30 căn nhà dân
 * lại đội đúng bộ mặt của kỳ quan — đúng lỗi "25 căn nhà nhỏ đội mái vòm Duomo" mà Phase 7C đã
 * trả giá.
 *
 * ⚠️ NHƯNG `stackCount` THÌ **KHÔNG** TÁCH, và đây là lý do — không phải để tiết kiệm một trường.
 * Số lượng là một sự thật VĂN HOÁ về nghề xây ở nước ấy: một lâu đài Đức có MỘT ống khói đá to,
 * một dãy nhà Manchester có BA ống trên mỗi đầu hồi, một mái Singapore có BỐN cục nóng xếp hàng.
 * Con số ấy không đổi khi công trình đổi hạng; thứ đổi là **chỗ đứng**, mà chỗ đứng thì suy được
 * từ bề ngang khối (mọi kích thước ở `rooftop.js` là TỈ LỆ có TRẦN). Khai thêm một trường nữa để
 * nói lại điều mã đã biết là tự tạo chỗ để hai bên trôi khỏi nhau.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ HAI LOẠI RÀNG BUỘC, VÀ CẢ HAI ĐỀU LÀ **ĐIỀU KIỆN CẤU TRÚC**, KHÔNG PHẢI TRÍ NHỚ
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Bài học Phase 10 Bước 2: *"một mốc lịch sử đặt theo thứ mình NHỚ, không phải thứ mình đang
 * DỰNG"* — luật cấm cửa chớp trước kỷ 7 đã quay ra cấm chính nhà Fachwerk Đức thời trung cổ. Nên ở
 * đây, mọi ràng buộc hỏi thẳng một cái BẢNG chứ không hỏi trí nhớ:
 *
 *   (a) `CROWN_NEEDS_ROOF` / `STACK_NEEDS_ROOF` — **hình dạng mái phải đỡ được thứ đặt lên nó.**
 *       Không đứng được trên mái dốc 45° để hong lúa; không khoét cửa sổ mái vào một mặt phẳng;
 *       không có sống mái trên một cái chóp nón. Đây là hình học, không phải lịch sử, nên nó không
 *       già đi.
 *   (b) `EARLIEST_ERA` — **thứ chưa được phát minh thì không được có mặt.** Ống khói xây có ống
 *       thoát là chuyện châu Âu thế kỷ 12; bồn nước mái cần nước máy có áp; cục nóng cần máy nén.
 *       Mốc nào cũng kèm một câu giải thích, và có test khoá **CẢ HAI CHIỀU** — kỷ cổ không được
 *       có, kỷ hiện đại không được thiếu. Không có vế thứ hai thì cách dễ nhất để "15 kỷ khác
 *       nhau" là rắc cục nóng khắp nơi, tức mua điểm bản sắc bằng cách nói dối lịch sử (đúng luật
 *       đã đặt cho bó vỉa và vạch kẻ ở `streetStyle.js`).
 *
 * ⚠️ VÀ RÀNG BUỘC (a) PHẢI KIỂM RIÊNG CHO TỪNG VẾ: `crown` đối chiếu với `style.roof`, còn
 * `vernacularCrown` đối chiếu với `style.vernacularRoof`. Kiểm gộp là bỏ lọt đúng ca hay sai nhất
 * — kỷ 6 khai `upturn` cho đình (mái `tiered`, đỡ được) và `barrel` cho nhà ba gian (mái `gable`),
 * hai vế hai mái khác nhau.
 *
 * Xem ADR-030.
 */

import { normalizeEraKey } from './eraStyle.js';

/**
 * ĐƯỜNG NÉT TRÊN MÁI. Mỗi giá trị là một cách làm ra ĐƯỜNG khác nhau, không phải cùng một dải
 * đổi màu:
 *   `none`        không có — và đây là câu trả lời HỢP LỆ, không phải chỗ trống. Mặt tranh của một
 *                 túp lều là một mảng xù; kẻ một cái sống mái nổi lên đó là bịa.
 *   `beamEnds`    ĐẦU XÀ GỖ thò ra khỏi đỉnh tường — dầm mái xuyên qua tường rồi để nguyên. Đây là
 *                 cách xây nhà bùn của cả sông Nin lẫn Lưỡng Hà, và trên màn hình nó ra một HÀNG
 *                 CHẤM chạy suốt mặt tường, ngay dưới mái.
 *   `barrel`      NGÓI BÒ / ngói ống — những cuộn ngói nửa trụ chạy DỌC theo chiều dốc. Đây là kết
 *                 cấu bề mặt của mọi mái ngói Địa Trung Hải và Đông Á, và nó ra một chuỗi đường
 *                 song song rất mạnh khi nhìn từ trên xuống.
 *   `ridge`       SỐNG MÁI NỔI — một thanh nóc dày chạy suốt đỉnh mái hai dốc, cao hơn mặt lợp.
 *   `upturn`      ĐẦU ĐAO — bốn góc diềm mái vút cong lên. Nét Đông Á, và là thứ mắt nhận ra một
 *                 mái đình từ rất xa.
 *   `balustrade`  LAN CAN MÁI — hàng con tiện + tay vịn chạy quanh mép mái. Từ tường chắn mái của
 *                 ziggurat tới lan can đá Phục Hưng tới vành kính của tháp hiện đại.
 *
 * ⚠️ DANH SÁCH NÀY CHỈ CHỨA THỨ ĐÃ DỰNG ĐƯỢC, KHÔNG CHỨA THỨ ĐỊNH LÀM — cùng luật với `DOOR_KINDS`
 * (`groundFloor.js`) và `PAVING_KINDS` (`streetStyle.js`). Khai một kiểu chưa có mã dựng thì kỷ ấy
 * nhận về một chỗ trống trong im lặng.
 */
export const CROWN_KINDS = ['none', 'beamEnds', 'barrel', 'ridge', 'upturn', 'balustrade'];

/**
 * THỨ NHÔ LÊN KHỎI MÁI — ưu tiên số một của Đàm, vì nó phá HÌNH BÓNG chứ không chỉ thêm hoa văn.
 *   `none`        không có (câu trả lời hợp lệ, luôn kèm lý do ngay trên dòng khai)
 *   `crossPoles`  BÓ CỌC CHÉO buộc ở đỉnh nón tranh, giữ lớp tranh khỏi tốc. Hình chữ X trên nóc.
 *   `roofHatch`   CỬA SẬP LÊN MÁI — cổ áo xây quanh miệng lỗ + cái thang dựa vào. Mái bằng nhà bùn
 *                 là phòng ngủ mùa hè, nên lối lên mái là một bộ phận thật của căn nhà.
 *   `dryingRack`  GIÀN PHƠI — hai cọc + sào ngang + tấm vải rủ. Chỉ đặt được trên mái BẰNG.
 *   `chimney`     ỐNG KHÓI xây, có mũ chụp trên đỉnh.
 *   `dormer`      CỬA SỔ MÁI (lucarne / trapeira) — hộp nhỏ khoét vào mặt dốc, có mái riêng và một
 *                 ô kính. Chỉ đặt được trên mái DỐC.
 *   `tank`        BỒN NƯỚC MÁI — thùng gỗ đai sắt đứng trên bốn chân. Hình ảnh mái nhà New York.
 *   `liftHouse`   LỒNG THANG MÁY — buồng máy vuông vức nhô lên giữa mái bằng.
 *   `mast`        CỘT ĂNG-TEN — cột mảnh có hai thanh ngang.
 *   `condenser`   CỤC NÓNG điều hoà — hộp bẹt có mặt lưới, xếp thành hàng.
 *   `planter`     CHẬU CÂY SÂN THƯỢNG — bồn + tán lá.
 */
export const STACK_KINDS = [
  'none', 'crossPoles', 'roofHatch', 'dryingRack', 'chimney',
  'dormer', 'tank', 'liftHouse', 'mast', 'condenser', 'planter',
];

/**
 * ⚠️ RÀNG BUỘC HÌNH HỌC — mái phải ĐỠ ĐƯỢC thứ đặt lên nó.
 * `null` = hợp với mọi hình mái. Danh sách = chỉ hợp với những hình mái ấy.
 *
 * `beamEnds` và `balustrade` hợp với MỌI mái vì cả hai bám vào **đỉnh tường**, không bám vào mặt
 * mái — cái đầu xà thò ra ngay dưới diềm, cái lan can đứng TRƯỚC mái. Đây không phải một ngoại lệ
 * cho tiện: nó là mô tả đúng chỗ hai bộ phận ấy nằm ngoài đời.
 */
export const CROWN_NEEDS_ROOF = {
  none: null,
  beamEnds: null,
  balustrade: null,
  // Cuộn ngói nằm TRÊN MẶT DỐC ⇒ phải có mặt dốc.
  barrel: ['gable', 'tiered', 'pyramid', 'cone'],
  // Sống mái là giao tuyến của HAI mặt dốc ⇒ chỉ mái hai dốc mới có.
  ridge: ['gable', 'sawtooth'],
  // Đầu đao là góc của DIỀM MÁI CHỒNG TẦNG. Đây cũng là cách diễn đạt "chỉ Đông Á" bằng hình học
  // thay vì bằng một danh sách nước phải nhớ: chỉ kỷ 4 và 6 khai mái `tiered`.
  upturn: ['tiered'],
};

/** ⚠️ Cùng luật với `CROWN_NEEDS_ROOF`. Không đứng được trên mái dốc; không khoét cửa vào mặt phẳng. */
export const STACK_NEEDS_ROOF = {
  none: null,
  // Ống khói xuyên qua mái kiểu gì cũng được — đó là cả điểm của một cái ống.
  chimney: null,
  crossPoles: ['cone', 'pyramid', 'gable'],
  dormer: ['gable', 'tiered', 'pyramid', 'cone'],
  roofHatch: ['flat', 'stepped'],
  dryingRack: ['flat', 'stepped'],
  tank: ['flat', 'stepped', 'blade'],
  liftHouse: ['flat', 'stepped', 'blade'],
  mast: ['flat', 'stepped', 'blade'],
  condenser: ['flat', 'stepped', 'blade'],
  planter: ['flat', 'stepped', 'blade'],
};

/**
 * ⚠️ MỐC LỊCH SỬ — kỷ sớm nhất được phép dùng. Mỗi con số kèm lý do; không có lý do thì không có
 * mốc. Test khoá CẢ HAI CHIỀU (xem khối chú thích ở đầu file).
 */
export const EARLIEST_ERA = {
  // Ngói nung ép khuôn: Hy Lạp và Trung Hoa khoảng 2000 TCN. Trước đó lợp tranh, lá, đất trộn rơm
  // — không có cái cuộn ngói nào để mà chạy thành đường.
  barrel: 4,
  // Sống mái nổi cần một bộ khung kèo có thanh nóc thật. Nhà tiền sử lợp tranh trên vì kèo bó.
  ridge: 4,
  upturn: 4,
  // Ống khói xây có ống thoát: châu Âu thế kỷ 12. Trước đó khói thoát qua lỗ trên mái, không qua
  // một cái ống — nên vẽ ống khói cho kỷ cổ là nói dối tới hàng nghìn năm.
  chimney: 5,
  // Cửa sổ mái (lucarne) xuất hiện cùng lúc với mái áp mái ở được, tức cũng thế kỷ 12–15.
  dormer: 5,
  // Bồn nước mái cần nước máy CÓ ÁP và nhà đủ cao để áp thành phố không với tới — cuối thế kỷ 19.
  tank: 11,
  // Thang máy chở người: Otis 1857; buồng máy trên nóc thành chuẩn từ thập niên 1880.
  liftHouse: 11,
  // Cột thu phát vô tuyến: thế kỷ 20.
  mast: 12,
  // Máy nén điều hoà dân dụng: giữa thế kỷ 20, và phổ biến ở nhà ở thì muộn hơn nữa.
  condenser: 13,
  // Vườn trên mái như một BỘ PHẬN KIẾN TRÚC (chứ không phải một cái chậu để quên) là chuyện của
  // kiến trúc xanh cuối thế kỷ 20.
  planter: 14,
};

/**
 * ⚠️ CHIỀU NGƯỢC LẠI: từ kỷ này trở đi, mái BẰNG là một sàn máy — bỏ trống nó là nói dối theo
 * hướng còn lại. Xem lý do ở khối chú thích đầu file.
 */
export const MODERN_STACK_FROM_ERA = 12;

const CROWN_SET = new Set(CROWN_KINDS);
const STACK_SET = new Set(STACK_KINDS);

/** `crownWeight` nhỏ nhất còn đọc ra được là một đường nét; nhỏ hơn nữa thì nó là nhiễu. */
export const CROWN_WEIGHT_MIN = 0.35;
/** Và lớn nhất — trên mức này thì đầu đao thành cái sừng, lan can thành bức tường. */
export const CROWN_WEIGHT_MAX = 1.6;
/** Nhiều nhất mấy cái trên một mảng nhà. Bốn cục nóng đã là một hàng; năm là một cái kho. */
export const STACK_COUNT_MAX = 4;

/**
 * Bảng có dùng được không. **TỪ CHỐI THẲNG** thay vì lặng lẽ rơi về mặc định — tự chữa là cách một
 * bảng 15 dòng thoái hoá về 1 dòng (bẫy `MIN_STONE` ở Phase 9D, và bẫy `doorWidth: 0.46` ở Phase
 * 10 Bước 2).
 *
 * ⚠️ Hàm này CHỈ kiểm từ vựng và số đo. Ràng buộc "mái có đỡ được không" và "mốc lịch sử" nằm ở
 * `roofStyle.test.js`, vì cả hai cần đọc `eraStyle.js` — cùng cách `streetStyle` giữ ràng buộc
 * `country` bằng một bài test chứ không bằng validator.
 */
export function isValidRoofStyle(rs) {
  if (!rs || typeof rs !== 'object') return false;
  if (!CROWN_SET.has(rs.crown)) return false;
  if (!CROWN_SET.has(rs.vernacularCrown)) return false;
  if (!STACK_SET.has(rs.stack)) return false;
  if (!STACK_SET.has(rs.vernacularStack)) return false;
  if (typeof rs.note !== 'string' || rs.note.length < 8) return false;
  if (!Number.isInteger(rs.stackCount) || rs.stackCount < 1 || rs.stackCount > STACK_COUNT_MAX) return false;
  // ⚠️ `crownWeight` = 0 CHỈ hợp lệ khi kỷ ấy không có đường nét nào ở CẢ HAI vế. Nếu không thì một
  // kỷ có thể khai `crown: 'upturn'` kèm trọng số 0 và nhận về một cái đầu đao dài 0 — tức một
  // trường bị vô hiệu hoá trong im lặng bởi một trường khác, đúng bẫy đã cắn ở `emitWindows`.
  const coDuongNet = rs.crown !== 'none' || rs.vernacularCrown !== 'none';
  if (!Number.isFinite(rs.crownWeight)) return false;
  if (coDuongNet) {
    if (rs.crownWeight < CROWN_WEIGHT_MIN || rs.crownWeight > CROWN_WEIGHT_MAX) return false;
  } else if (rs.crownWeight !== 0) {
    return false;
  }
  return true;
}

/**
 * 15 dòng. Mỗi dòng buộc vào `country` mà `eraStyle.js` khai — **CÓ TEST BẮT**.
 *
 * ⚠️ MỖI DÒNG PHẢI TRẢ LỜI ĐƯỢC *"mái nhà có thật nào ở nước ấy trông như vậy?"* — nếu không thì
 * con số/giá trị ấy là tuỳ hứng, và tuỳ hứng chính là thứ đã sinh ra 15 kỷ đội chung một cái mái
 * trơn. Trường `note` là chỗ ghi câu trả lời đó, và validator đòi nó dài ít nhất 8 ký tự.
 */
export const ROOF_STYLES = {
  // KỶ 1 — THỔ NHĨ KỲ, cự thạch Göbekli Tepe. Lều tranh hình nón.
  // ⚠️ `crown: 'none'` là một CÂU TRẢ LỜI, không phải chỗ trống: mặt tranh bó là một mảng xù, không
  // có sống, không có cuộn, không có mép để mà kẻ. Thứ duy nhất nhô lên khỏi nó là **bó cọc chéo**
  // buộc ở đỉnh — chi tiết có mặt trong mọi bản tái dựng lều tranh thời đồ đá, vì không có nó thì
  // trận gió đầu tiên lột sạch lớp tranh. Lều lớn hay lều nhỏ đều buộc như nhau: cùng thợ, cùng
  // vật liệu, cùng trận gió. Đây là ca "hai thứ ĐI CÙNG NHAU" thật, nên khai giống nhau là đúng.
  1: {
    crown: 'none', crownWeight: 0, stack: 'crossPoles', stackCount: 1,
    vernacularCrown: 'none', vernacularStack: 'crossPoles',
    note: 'lều tranh hình nón Anatolia: bó cọc chéo buộc ở đỉnh giữ lớp tranh khỏi tốc',
  },

  // KỶ 2 — AI CẬP, làng ven sông Nin. Nhà gạch bùn, mái bằng lợp dầm cọ.
  // Dầm gỗ cọ **xuyên qua tường rồi để nguyên đầu thò ra** — cách xây nhà bùn khắp Bắc Phi và Cận
  // Đông, vì cưa cụt đầu dầm là phí gỗ ở một xứ gần như không có rừng. Nhìn từ trên xuống nó ra
  // một hàng chấm chạy suốt mặt tường. Mái bằng là chỗ phơi chà là, phơi cá và ngủ đêm hè ⇒ nhà
  // dân có giàn phơi; còn kho thóc và nhà kho (`granary` đã có trong `motifs`) thì trống trơn.
  2: {
    crown: 'beamEnds', crownWeight: 0.9, stack: 'none', stackCount: 1,
    vernacularCrown: 'beamEnds', vernacularStack: 'dryingRack',
    note: 'nhà bùn sông Nin: đầu dầm cọ thò ra khỏi tường, mái bằng dùng để phơi và ngủ',
  },

  // KỶ 3 — IRAQ, ziggurat thành Ur.
  // Các thềm ziggurat có **tường chắn thấp** để người hành lễ không rơi xuống — nó vẽ ra một đường
  // ngang ở mỗi bậc, và đó chính là thứ làm khối bậc thang đọc ra là công trình chứ không phải một
  // đống đất. Nhà dân Ur quay hết vào SÂN TRONG (cùng lý do đã khiến `groundFloorStyle` khai
  // `feature: 'none'` cho kỷ này), nên mặt phố trống — nhưng mái thì không: nó là phòng ngủ mùa hè,
  // và lối lên là một **cửa sập có cổ áo xây quanh** kèm cái thang.
  3: {
    crown: 'balustrade', crownWeight: 0.7, stack: 'none', stackCount: 1,
    vernacularCrown: 'beamEnds', vernacularStack: 'roofHatch',
    note: 'ziggurat Ur có tường chắn ở mỗi thềm; nhà dân mái bằng có cửa sập lên mái ngủ đêm',
  },

  // KỶ 4 — TRUNG QUỐC, điện mái chồng, đấu củng.
  // **Ngói ống** (筒瓦): những cuộn ngói nửa trụ úp lên khe giữa hai hàng ngói bản, chạy dọc suốt
  // chiều dốc. Đây là kết cấu bề mặt đặc trưng nhất của mái cung điện Trung Hoa, và ở góc nhìn từ
  // trên xuống nó là một chuỗi đường song song rất mạnh. Nhà dân sân trong (四合院) lợp ngói bản
  // đơn giản hơn, thứ nổi lên là **thanh nóc dày** ở đỉnh mái hai dốc.
  4: {
    crown: 'barrel', crownWeight: 0.9, stack: 'none', stackCount: 1,
    vernacularCrown: 'ridge', vernacularStack: 'none',
    note: 'ngói ống cung điện Trung Hoa chạy dọc chiều dốc; nhà tứ hợp viện chỉ có thanh nóc',
  },

  // KỶ 5 — ĐỨC, lâu đài đá Burg Eltz.
  // Mái đá phiến dốc đứng của lâu đài Rhein cắm đầy **cửa sổ mái** (Gaube) — đó là cách duy nhất
  // lấy sáng cho tầng áp mái cao bằng cả một ngôi nhà. Nhà phố Fachwerk cùng vùng thì thứ nhô lên
  // là **ống khói đá xây to, mỗi nóc một cái**: bếp lò là trung tâm căn nhà, và ống khói xây có ống
  // thoát vừa mới thành chuyện bình thường ở châu Âu thế kỷ 12.
  5: {
    crown: 'ridge', crownWeight: 1.2, stack: 'dormer', stackCount: 1,
    vernacularCrown: 'ridge', vernacularStack: 'chimney',
    note: 'mái đá phiến Burg Eltz cắm cửa sổ mái; nhà Fachwerk mỗi nóc một ống khói đá',
  },

  // KỶ 6 — VIỆT NAM, đình làng Bắc Bộ.
  // **Đầu đao** — bốn góc mái vút cong lên, và ở đình Bắc Bộ nó vút mạnh hơn hẳn mái Trung Hoa
  // (`crownWeight` 1,4 so với 0,9). Đây là thứ mắt nhận ra một mái đình từ xa nhất. Nhà ba gian
  // lợp ngói mũi hài, bề mặt là những hàng ngói cong ⇒ `barrel`.
  // ⚠️ `vernacularStack: 'none'` là câu trả lời ĐÚNG chứ không phải chỗ trống: mái ngói dốc không
  // phải chỗ đứng được, nên mọi việc phơi phóng diễn ra ở SÂN. Đặt một giàn phơi lên đó là bịa.
  6: {
    crown: 'upturn', crownWeight: 1.4, stack: 'none', stackCount: 2,
    vernacularCrown: 'barrel', vernacularStack: 'none',
    note: 'đầu đao đình làng Bắc Bộ vút cong mạnh nhất bảng; nhà ba gian lợp ngói mũi hài',
  },

  // KỶ 7 — Ý, vòm Duomo Firenze.
  // Dinh thự Phục Hưng đội **lan can đá** chạy quanh mép mái bằng phía sau diềm — vành ngang ấy là
  // thứ giữ cho khối vuông không đọc ra như bị cắt cụt. Nhà phố Toscana lợp **coppi** (ngói bò
  // cong) và có ống khói vuông đội mũ chụp.
  7: {
    crown: 'balustrade', crownWeight: 1.0, stack: 'none', stackCount: 2,
    vernacularCrown: 'barrel', vernacularStack: 'chimney',
    note: 'lan can đá quanh mái dinh thự Phục Hưng; nhà phố Toscana lợp ngói coppi',
  },

  // ⚠️ PHASE 11-B (2026-08-18): `vernacularCrown` đổi `barrel` → `balustrade`. Kỷ 8 là kỷ ĐỔI ÍT
  // NHẤT cả bảng khi đo bằng ảnh (**1,2%** điểm ảnh ở khung app, trong khi kỷ 7 ra 8,4%) — dù nó
  // tốn NHIỀU hình học nhất (+48,5% tam giác). Lý do đo được: cả hai vế đều là ngói bò, tức thuần
  // BỀ MẶT, mà bề mặt thì tan biến khi lùi xa. **Platibanda** — bức tường lùn xây cao hơn mái, che
  // hẳn dốc ngói — là nét nhà Algarve và Alentejo có thật, và nó phá được ĐƯỜNG VIỀN cắt lên trời.
  // ⚠️ Bản vá ĐẦU TIÊN đổi vế KỲ QUAN sang `balustrade` (lan can đá đục lỗ Jerónimos, cũng đúng
  // lịch sử) và bài `15 KỶ RA 15 MÁI` **ĐỎ NGAY**: kỷ 7 đã khai `crown: 'balustrade'`, nên hai kỷ
  // tụt xuống chỉ còn khác nhau 1/6 trục — Ý và Bồ Đào Nha đọc ra gần như một cái mái. Đúng lịch sử
  // là ĐIỀU KIỆN CẦN, không phải điều kiện đủ: một giá trị còn phải không giẫm lên hàng xóm.
  // KỶ 8 — BỒ ĐÀO NHA, bến cảng Lisboa.
  // **Telha canudo** — ngói ống Bồ, đúng nghĩa đen là "ngói cái ống". Nhà Pombaline dựng lại sau
  // động đất 1755 có **trapeira**: cửa sổ mái nhô lên khỏi mặt dốc, thành hàng đều tăm tắp suốt
  // dãy phố. Chính cái hàng ấy phân biệt mái Lisboa với mái Toscana, dù cả hai cùng lợp ngói cong.
  8: {
    crown: 'barrel', crownWeight: 1.1, stack: 'none', stackCount: 2,
    vernacularCrown: 'balustrade', vernacularStack: 'dormer',
    note: 'ngói ống telha canudo; nhà Pombaline Lisboa có hàng cửa sổ mái trapeira',
  },

  // KỶ 9 — PHÁP, điện Panthéon Paris.
  // Panthéon: **lan can đá** vòng quanh, và bên trên tuyệt đối trống — mái kẽm phẳng giấu hẳn sau
  // vành lan can, đó là cả ý đồ của kiến trúc tân cổ điển. `stack: 'none'` ở đây là một quyết định
  // mỹ thuật có thật, không phải chỗ chưa làm.
  // Chung cư Haussmann cùng thành phố thì ngược hẳn: mái kẽm dốc đứng **cắm đầy lucarne**, ba cái
  // trên mỗi mặt. Mái kẽm Paris cố ý KHÔNG có đường nét nào (`vernacularCrown: 'none'`) — cả điểm
  // của tấm kẽm hàn liền là một mặt trơn không mối nối, và đó là lý do nó thay được ngói.
  9: {
    crown: 'balustrade', crownWeight: 1.2, stack: 'none', stackCount: 3,
    vernacularCrown: 'none', vernacularStack: 'dormer',
    note: 'Panthéon giấu mái sau lan can đá; mái kẽm Haussmann trơn nhẵn nhưng cắm đầy lucarne',
  },

  // KỶ 10 — ANH, nhà máy gạch đỏ Manchester.
  // Mái răng cưa lấy sáng bắc: mỗi răng có một **thanh nóc** dày ở đỉnh, nơi mặt kính gặp mặt lợp.
  // `stack: 'none'` vì `signature: 'stack'` đã dựng sẵn cái ống khói nhà máy — thêm một cái nữa là
  // nói lại điều vừa nói. Dãy nhà thợ ngay bên cạnh mới là hình ảnh Manchester thật: **ba ống khói
  // trên mỗi đầu hồi**, vì mỗi phòng một lò sưởi.
  10: {
    crown: 'ridge', crownWeight: 0.8, stack: 'none', stackCount: 3,
    vernacularCrown: 'ridge', vernacularStack: 'chimney',
    note: 'mái răng cưa lấy sáng bắc nhà máy Manchester; dãy nhà thợ ba ống khói mỗi đầu hồi',
  },

  // KỶ 11 — MỸ, New York thời Mạ Vàng.
  // Toà nhà giật cấp giấu **buồng máy thang** trong khối trên cùng — thang máy Otis là thứ làm cho
  // nhà cao tầng tồn tại được, nên cái buồng ấy là dấu vết của chính phát minh đã đẻ ra thành phố
  // này. Vành **lan can đá** ở mỗi bậc giật cấp là ngôn ngữ Beaux-Arts.
  // Nhà thuê thấp tầng thì đội **bồn nước gỗ đai sắt** trên bốn chân — và chính hình ảnh ấy, không
  // phải toà cao ốc, mới là mái nhà New York trong trí nhớ mọi người.
  // ⚠️ PHASE 11-B: `vernacularCrown` `none` → `balustrade`. **Tường lan can chính là thứ mà cái bể
  // nước đứng nấp sau** — mái nhà New York không phải một tấm phẳng trần trụi, nó là một cái khay
  // có thành, và cái thành ấy (parapet + gờ mái đúc) là đường viền mà cả Manhattan cắt lên trời.
  // Bỏ trống nó là bỏ mất chính nét đã làm nên bóng dáng khu phố gạch nâu.
  11: {
    crown: 'balustrade', crownWeight: 0.9, stack: 'liftHouse', stackCount: 1,
    vernacularCrown: 'balustrade', vernacularStack: 'tank',
    note: 'buồng máy thang trên khối giật cấp Beaux-Arts; nhà thuê New York đội bồn nước gỗ',
  },

  // KỶ 12 — NGA, lô cốt Stalingrad.
  // Bê tông, mái bằng, không một đường nét trang trí nào — `crown: 'none'` ở đây là kỷ luật của
  // công trình quân sự, cùng lý do đã khiến `groundFloorStyle` khai `feature: 'none'`: mọi thứ nhô
  // ra là chỗ bám cho đối phương. Thứ duy nhất được phép nhô lên là **cột ăng-ten** — liên lạc thì
  // không có cách nào giấu xuống dưới. Nhà tập thể mái bằng thì căng dây phơi, vì căn hộ không có
  // ban công đủ rộng.
  // ⚠️ PHASE 11-B: `vernacularCrown` `none` → `balustrade`, `crownWeight` 0 → 0,45. Lô cốt thì
  // **vẫn trơn tuyệt đối** — kỷ luật quân sự ở trên không đổi một chữ. Nhưng nhà tập thể Xô Viết là
  // một thứ khác hẳn: mái bằng lợp bitum bắt buộc có **parapet bê tông** viền quanh (vừa chắn người
  // ngã vừa neo lớp chống thấm), và dây phơi thì căng phía sau nó. 0,45 là một vành mỏng, đúng tinh
  // thần tấm panel đúc sẵn — không phải một vành lan can trang trí.
  12: {
    crown: 'none', crownWeight: 0.45, stack: 'mast', stackCount: 2,
    vernacularCrown: 'balustrade', vernacularStack: 'dryingRack',
    note: 'lô cốt Stalingrad trơn tuyệt đối; nhà tập thể Xô Viết viền parapet bê tông mỏng, dây phơi căng sau nó',
  },

  // KỶ 13 — NHẬT BẢN, tháp nang Nakagin.
  // Mái bằng của nhà Nhật hậu chiến là một **sàn thiết bị**: bồn nước inox trên giá thép (áp lực
  // nước thành phố không với tới tầng trên), và trên nhà dân là **cột ăng-ten** cùng giá đỡ. Không
  // có đường nét trang trí nào — chủ nghĩa Chuyển Hoá coi cái nang và cái ống là toàn bộ hình thức.
  // ⚠️ PHASE 11-B: `vernacularCrown` `none` → `balustrade`, `crownWeight` 0 → 0,5. Tháp nang
  // Nakagin **vẫn trơn** — chủ nghĩa Chuyển Hoá không có chỗ cho trang trí. Nhà dân thì viền
  // **parapet bê tông mỏng**, thứ mà mọi chung cư mái bằng đều bắt buộc có.
  // ⚠️ Bản vá đầu khai `ridge` với lý lẽ nghe rất xuôi (ngói kawara Nhật có sống mái munagawara rất
  // dày). Bài `MÁI PHẢI ĐỠ ĐƯỢC THỨ ĐẶT LÊN NÓ` **ĐỎ NGAY**: `vernacularRoof` của kỷ này là
  // **`flat`**, mà sống mái thì cần một cái nóc để mà chạy dọc. Tôi đã kể một câu chuyện lịch sử
  // đúng về một loại nhà mà kỷ này KHÔNG dựng — Nhật hậu chiến ở đây là bê tông mái bằng, không
  // phải nhà gỗ lợp ngói. **Đi đọc hình mình đang dựng trước khi viết một luật lịch sử** (đúng bài
  // học `shutters` ở Phase 10 Bước 2), và cái bắt được nó là một bài test cấu trúc, không phải trí nhớ.
  13: {
    crown: 'none', crownWeight: 0.5, stack: 'tank', stackCount: 2,
    vernacularCrown: 'balustrade', vernacularStack: 'mast',
    note: 'tháp nang Nakagin trơn đội bồn nước trên giá; chung cư Nhật viền parapet bê tông mỏng, cắm cột ăng-ten',
  },

  // KỶ 14 — SINGAPORE, tháp kính Marina Bay.
  // Nhiệt đới quanh năm ⇒ **dàn cục nóng xếp hàng** là bộ mặt thật của mọi mái Singapore, và bốn
  // cái là một hàng chứ chưa phải một cái kho. Vành **lan can kính mảnh** (`crownWeight` 0,5 — thấp
  // nhất bảng) quanh sân thượng. Nhà ở thì theo đúng khẩu hiệu "thành phố trong vườn": **bồn cây
  // trên mái**, một chính sách quy hoạch chứ không phải sở thích của chủ nhà.
  14: {
    crown: 'balustrade', crownWeight: 0.5, stack: 'condenser', stackCount: 4,
    vernacularCrown: 'balustrade', vernacularStack: 'planter',
    note: 'dàn cục nóng và lan can kính mảnh Marina Bay; khối HDB viền parapet, sân thượng phủ bồn cây theo quy hoạch vườn',
  },

  // KỶ 15 — UAE, Bảo tàng Tương Lai Dubai.
  // Phiến mái mỏng lơ lửng, không có mép nào để mà kẻ (`crown: 'none'`) — cùng lý do đã khiến
  // `groundFloorStyle` khai `vernacularFeature: 'none'`: nhà Dubai quay vào trong. Thứ nhô lên là
  // **bồn cây** trên sân thượng công trình chính (vườn treo là ngôn ngữ marketing của kiến trúc
  // vùng Vịnh) và **dàn cục nóng** trên nhà ở — 45 độ ngoài trời thì điều hoà là hạ tầng sống còn.
  // ⚠️ PHASE 11-B: `vernacularCrown` `none` → `balustrade`, `crownWeight` 0 → 0,6. Phiến mái Bảo
  // tàng Tương Lai **vẫn không có mép** — hình xuyến thì không có chỗ nào để kẻ. Nhưng villa và
  // tháp ở Dubai thì viền **lan can kính** quanh sân thượng gần như không có ngoại lệ, vì sân
  // thượng là không gian sống thật ở xứ nóng (dùng vào buổi tối) và luật xây dựng đòi lan can.
  15: {
    crown: 'none', crownWeight: 0.6, stack: 'planter', stackCount: 2,
    vernacularCrown: 'balustrade', vernacularStack: 'condenser',
    note: 'phiến mái bảo tàng Dubai trơn không mép; villa viền lan can kính quanh sân thượng, đội dàn cục nóng',
  },
};

/**
 * Tra bảng theo số kỷ. Dùng CHUNG phép chuẩn hoá với `getEraStyle`/`getGroundFloor`
 * (`normalizeEraKey`) — một luật, một công thức: kỷ lạ phải rơi về cùng một chỗ ở cả ba bảng.
 */
export function getRoofStyle(era) {
  return ROOF_STYLES[normalizeEraKey(era)];
}
