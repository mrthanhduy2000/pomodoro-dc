/**
 * humanShape.js — BỘ HÌNH KHỐI CỦA CƠ THỂ. Tám cái khuôn, và chỉ một cái là viên gạch.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`. File này chỉ sinh ra TOẠ ĐỘ;
 * việc biến toạ độ thành `BufferGeometry` là của `components/city/render3d/humanGeometry.js`.
 * Đúng khuôn ba lớp đã dùng chín lần (BẢNG thuần → HÌNH → nơi tiêu thụ).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY — MỘT NGÂN SÁCH LẠC HẬU 5,4 LẦN ĐÃ GIỮ CƠ THỂ Ở MỨC "CHỒNG GẠCH"
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Trước bản này, MỌI bộ phận của cư dân đều là một `BoxGeometry(1,1,1)` co giãn — chân hộp, tay
 * hộp, thân hộp, đầu hộp, nón hộp. Nhìn dải 15 kỷ ở `scripts/human-strip.mjs` (phóng 5 lần) thì
 * điều đó không đọc ra là "người", nó đọc ra là **một chồng gạch**; và ở ba kỷ đội mũ vành rộng
 * (6 · 7 · 8) cái mũ là một TẤM DẸT nhìn từ camera chếch 34° thành đúng **một hình thoi trắng che
 * kín cả người**.
 *
 * Vì sao nó ở mãi như thế? Vì `human.js` mang một trần tam giác **tự tính và chưa bao giờ được đặt
 * cạnh sự thật** — đúng cái bẫy Performance Gate 2026-08-17 đã ghi ra:
 *
 *     chú thích cũ: "kỷ 1 có 19.434 tam giác thành phố + 44.126 nền = 63.560 ⇒ 6% = 3.814
 *                    ⇒ 136 tam giác mỗi người ⇒ 11 hộp"
 *     đo lại 2026-08-23 (`node --import ./scripts/register-esm-loader.mjs scripts/scene-tri.mjs`):
 *                   kỷ 1 có **104.958** tam giác thành phố + 44.126 nền = **149.084**
 *
 * Thành phố đã phình 5,4 lần ở Phase 14 §1(3) ("một ô là một KHU PHỐ", ×4,88 số khối) mà con số
 * trong chú thích thì đứng yên. Trần thật với CÙNG tỉ lệ 6% và CÙNG `MAX_RESIDENTS = 28` là
 * **319 tam giác mỗi người**, không phải 136 — và cơ thể đang tiêu 108. Nói cách khác: cái ngân
 * sách ấy không hề chặn vì lý do hiệu năng, nó chặn vì **một phép chia bằng một con số đã chết**.
 *
 * ⚠️ VÀ ĐÂY LÀ LÝ DO NÓ PHẢI ĐƯỢC GHI RA THAY VÌ LẶNG LẼ SỬA: một trần lạc hậu theo hướng SIẾT thì
 * không ai phát hiện, vì nó không làm gì hỏng cả — nó chỉ làm cho một hướng đi tốt trông như đã bị
 * cấm. Trần lạc hậu theo hướng NỚI thì sớm muộn có người kêu máy giật; trần lạc hậu theo hướng
 * siết thì im lặng vĩnh viễn.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * QUY ƯỚC HÌNH HỌC — đọc kỹ, ba câu này quyết định mọi con số bên dưới
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * 1. Mọi khuôn nằm gọn trong hộp đơn vị theo trục **x và z**: bề rộng ĐO NGANG MẶT PHẲNG đúng
 *    bằng 1,0. Chỉ các GÓC của đa giác thò ra tới `0,5 / cos(π/sides)` (bát giác: 0,541) theo
 *    hướng chéo 45°.
 *
 *    ⚠️ CHỌN QUY ƯỚC NÀY CHỨ KHÔNG PHẢI "NỘI TIẾP" LÀ CÓ LÝ DO ĐO ĐƯỢC, không phải cho đẹp:
 *    `humanPose.partCornersAt` và `silhouetteSpanX` tính hình bóng từ TÁM ĐỈNH CỦA HỘP (±0,5), và
 *    cả `humanIdentity.test.js` lẫn `human-scale.mjs` đều dựa vào đó. Với quy ước "mặt phẳng = 1,0"
 *    thì độ trải theo x của khuôn ĐÚNG BẰNG độ trải của hộp (`R·cos(π/sides) = 0,5`) ⇒ **mọi phép
 *    đo cũ vẫn đúng từng chữ số**. Chọn "nội tiếp" (R = 0,5) thì bề rộng thật tụt 7,6% so với con
 *    số bảng khai, và mọi bài test hình bóng lặng lẽ đo một cơ thể khác cơ thể trên màn hình —
 *    đúng họ `TECH_DEBT #42` ("assert con số đã KHAI thay vì con số đã DỰNG").
 *
 * 2. `twist = 0,5` (nửa một cung) ⇒ các MẶT quay thẳng ra ±x và ±z. Nhờ đúng điều này mà `sides: 4`
 *    cho ra **hộp đơn vị chính xác**: R = 0,5/cos(π/4) = 0,7071, đỉnh rơi đúng (±0,5, ±0,5). Tức
 *    cái hộp cũ KHÔNG phải một ngoại lệ phải giữ riêng — nó là một trường hợp của cùng một công
 *    thức, và đó là cách duy nhất để "một luật một công thức" còn đúng sau khi thêm năm khuôn mới.
 *
 * 3. Vành khai từ ĐÁY (y = −0,5) lên ĐỈNH (y = +0,5); `r` là **phần của bề rộng đầy đủ**, nên
 *    `r = 1` là chạm mép hộp và `r = 0` là một mũi nhọn. Không có `r` nào được vượt 1: vượt là
 *    khối phình ra ngoài hộp và mọi phép đo hình bóng nói dối theo hướng TRẤN AN.
 */

import { smoothCrease } from './creaseNormals';

/**
 * Tám khuôn. Thứ tự không quan trọng, nhưng danh sách thì phải đủ — `human.js` kiểm theo nó.
 *
 * ⚠️ `chest` LÀ KHUÔN THỨ TÁM, VÀ NÓ SINH RA VÌ MỘT RÀNG BUỘC CHỨ KHÔNG VÌ MUỐN THÊM.
 * Trước bản này cái THÂN dùng chung khuôn `limb` với chân và tay. Điều đó chấp nhận được khi
 * `limb` còn là một cái ống thẳng thon nhẹ. Nhưng một cái chân THẬT thắt lại ở đầu gối và nhỏ hẳn
 * ở cổ chân, mà một cái thân thì thắt ở EO rồi nở lại ở hông — hai đường cong ngược nhau ở nửa
 * dưới. Dùng chung một hồ sơ nghĩa là một trong hai phải sai. ⇒ Đây là lần thứ BẢY của họ bài học
 * *"một trường gánh hai việc"*, chỉ khác là thứ gánh hai việc lần này là một HỒ SƠ HÌNH HỌC.
 * Giá phải trả: đúng **một lệnh vẽ mỗi kỷ** (số lệnh vẽ cư dân = số khuôn kỷ ấy dùng).
 */
/**
 * SỐ CẠNH CỦA MỌI KHUÔN TIỆN TRÒN — ROUND 54 (ADR-094), Việc 2.
 *
 * ⚠️ 12 → 20, VÀ ĐÂY LÀ NỬA THỨ HAI CỦA CÙNG MỘT CƠ CHẾ VỚI PHÁP TUYẾN MỀM, KHÔNG PHẢI MỘT MÓN
 * RIÊNG. Pháp tuyến mềm (`smoothNormals.js`) chữa cách TÔ SÁNG: thân trụ thôi hiện ra thành 12 tấm
 * phẳng. Nhưng nó KHÔNG chạm được vào **ĐƯỜNG VIỀN NGOÀI** — hình bóng của một khối 12 cạnh vẫn
 * gãy đúng 12 nhịp, và đường viền mới là thứ mắt dùng để đọc ra hình dạng. Hai việc, hai chỗ chữa.
 *
 * ⚠️ VÀ NÓ AN TOÀN VỚI HÌNH BAO THEO ĐÚNG HƯỚNG NGƯỢC VỚI TRỰC GIÁC — điều phải nói ra, vì luật số
 * một của vòng 54 là *"cẩn thận `specSpan`, đây là lần thứ tư cùng một hình dạng"*. Quy ước của
 * file này là **bề rộng đo NGANG MẶT PHẲNG = 1,0**, nên bán kính ngoại tiếp là `0,5 / cos(π/n)`:
 *     12 cạnh → 0,51764     20 cạnh → 0,50623     24 cạnh → 0,50431
 * Thêm cạnh làm khối **NHỎ ĐI** một chút, không to ra. Hình bao chỉ có thể co lại.
 *
 * ⚠️ 20 CHỨ KHÔNG PHẢI 24: ở 20 cạnh, hai mặt kề lệch 18° — đã dưới ngưỡng gãy 40° nên mềm hoàn
 * toàn, và viền ngoài của một cái đầu ở cỡ 40 điểm ảnh thì 20 nhịp đã dưới một điểm ảnh mỗi nhịp.
 * 24 chỉ thêm tam giác mà không thêm gì mắt đọc được.
 */
// ⚠️ ROUND 55, VIỆC 2: 20 → 48. Đây là thứ Đàm soi gần nhất, và tiêu chí anh tự chấm nói thẳng:
// *"phóng to một cư dân … không được thấy một khúc gãy nào ở đường viền"*. Ở 20 cạnh, viền ngoài
// một cái đầu gãy đúng 20 nhịp — pháp tuyến mềm của vòng 54 chữa được TÔ SÁNG nhưng không chữa
// được HÌNH BÓNG, và hình bóng mới là thứ mắt đọc trước.
// ⚠️ 60 chứ không phải 24: ở cỡ tầm mắt (đầu ~40–80 điểm ảnh) thì 24 nhịp vẫn còn đọc ra được ở
// viền; 60 đưa mỗi nhịp xuống 6°, dưới một điểm ảnh ở mọi cỡ cư dân từng xuất hiện.
//
// ⚠️ VÀ CON SỐ NÀY BỊ RÀNG BUỘC HAI PHÍA — PHẢI CHIA HẾT CHO **20**, KHÔNG ĐƯỢC CHỌN TUỲ Ý.
// Tôi đặt 48 trước (đúng con số Đàm gợi ý) và `humanShapeMesh` NÉM NGAY: *"48 cạnh không chia hết
// cho chu kỳ nếp 5"*. Hai ràng buộc độc lập, mỗi cái do một vòng trước đặt ra:
//   · **chia hết cho 4** — vòng 47: điều kiện để hộp bao trải đúng [−0,5; 0,5] theo cả x và z
//     (`humanShape.test.js` «NẰM GỌN TRONG HỘP ĐƠN VỊ»), thứ mà mọi phép đo hình bóng dựa vào.
//   · **chia hết cho 5** — vòng 54: chu kỳ của bảng nếp vải (`FOLD_PERIOD`), đặt sống nếp đúng vào
//     tám đỉnh mép để hình bao không xê dịch một chữ số nào.
//   ⇒ bội chung nhỏ nhất là 20, nên dãy hợp lệ là 20 · 40 · **60** · 80. 48 không nằm trong đó.
// ⚠️ VÀ ĐÂY LÀ LÝ DO CÁI GUARD ẤY ĐÁNG GIÁ: không có nó, 48 cạnh sẽ cho ra nếp vải LỆCH MỐI — sống
// nếp rơi vào giữa mặt thay vì vào đỉnh mép — và hình bao co lại vài phần nghìn một cách IM LẶNG.
// Nó ném thay vì trôi, nên mất ba mươi giây thay vì ba vòng.
const ROUND_SIDES = 60;

export const HUMAN_SHAPES = ['box', 'prism', 'limb', 'calf', 'chest', 'flare', 'cone', 'dome', 'hat', 'scalp', 'skull'];

/**
 * Hồ sơ từng khuôn. `sides` = số cạnh đa giác; `rings` = [y, r] từ đáy lên đỉnh.
 *
 * ⚠️ TÁM CẠNH LÀ NGƯỠNG "ĐỌC RA HÌNH TRỤ", KHÔNG PHẢI MỘT SỐ CHỌN BỪA. Sáu cạnh vẫn còn thấy rõ
 * góc ở cỡ phóng 5 lần mà Đàm dùng để chấm; mười hai cạnh thì tốn gấp rưỡi tam giác để đổi lấy một
 * khác biệt nằm dưới ngưỡng mắt. Tám là chỗ mà đường bao thôi có góc mà chi phí chưa nhảy.
 *
 * ⚠️ SỐ VÀNH MỚI LÀ THỨ QUYẾT ĐỊNH "CÓ CÒN TRÔNG PHẲNG KHÔNG", KHÔNG PHẢI SỐ CẠNH — và đây là
 * điều dễ hiểu ngược nhất trong cả file. Vì pháp tuyến là PHẲNG THEO TỪNG MẶT (xem `humanShapeMesh`),
 * một khuôn hai vành cho ra đúng **một dải sáng** theo chiều dọc: tám mặt bên đều là hình thang
 * phẳng, sáng đều từ chân lên đỉnh, và mắt đọc ra một cái ống nhựa. Thêm một vành ở giữa với bán
 * kính LỆCH khỏi đường thẳng nối hai đầu là thêm một dải sáng nữa — và chính chỗ GÃY giữa hai dải
 * ấy mới là thứ mắt gọi là "có khối". Nói cách khác: **chỗ phình và chỗ thắt không phải trang trí
 * giải phẫu, chúng là nguồn sáng của mô hình này.** Đó là lý do mọi hồ sơ dưới đây đều có ít nhất
 * một điểm đổi chiều, và là lý do bản trước (mỗi khuôn hai vành) vẫn bị đọc ra là "ảnh phẳng" dù
 * đã bỏ hộp.
 *
 * ⚠️ VÀ KHÔNG ĐƯỢC LÀM MƯỢT ĐI **BẰNG CÁCH THÊM VÀNH**. Cám dỗ tiếp theo luôn là "thêm mười vành
 * cho nó tròn hẳn" — tức trả tam giác để mua độ cong, và đổi lại là những chỗ đổi chiều bị san
 * phẳng: khối tròn nhũn, mất đúng thứ vừa mua.
 * ⚠️ NHƯNG TỪ VÒNG 54, CÂU TRÊN KHÔNG CÒN NÓI VỀ PHÁP TUYẾN NỮA — đọc kỹ chỗ này trước khi
 * sửa gì. `humanShapeMesh` nay gọi `smoothCrease`: pháp tuyến được gộp **theo góc gãy 40°**, không
 * đổi một toạ độ nào và không thêm một vành nào. Hai chuyện khác hẳn nhau: thêm vành là trả
 * TAM GIÁC, làm mềm là sửa CÁCH TÔ SÁNG của đúng số tam giác đang có. Các chỗ đổi chiều bên dưới
 * vì thế **quan trọng hơn trước**, không phải ít hơn: chúng vẫn là thứ sinh ra các dải sáng, chỉ là
 * ranh giới giữa hai dải nay chuyển mềm thay vì gãy thành một cạnh.
 */
/**
 * ĐƯỜNG SINH CỦA HỘP SỌ — dùng chung bởi `skull` (cái đầu) và `scalp` (mũ tóc). Round 58, Việc 3.
 *
 * ⚠️ MỘT HẰNG SỐ, HAI KHUÔN, VÀ ĐÓ LÀ TOÀN BỘ LÝ DO NÓ NẰM Ở ĐÂY. Mũ tóc phải là *chính cái sọ
 * phóng to đều* — nếu hai bảng số được gõ ra hai lần thì ngày nào một bên đổi, bên kia im lặng
 * trôi, và chân tóc rời khỏi da đầu. Chuyện ấy đã xảy ra ngay trong vòng 58 (xem chú thích `scalp`).
 *
 * Đọc từ CẰM (−0,50) lên CHỎM (+0,50). Năm trong bảy đặc điểm sọ mà Đàm đặt hàng nằm gọn ở đây:
 * cằm · hàm thu · gò má · **chỗ thót ở thái dương** · trán dốc. Hai cái còn lại là bất đối xứng
 * trước–sau nên phải là khối riêng (`occiput`, `browRidge` ở `human.js`).
 *
 * ⚠️ VÀNH `[−0,04, 0,84]` LÀ VÀNH ĐẮT NHẤT BẢNG: nó THÓT LẠI, kẹp giữa gò má 0,88 và xương đỉnh
 * 1,00. Bỏ nó đi thì bán kính tăng đơn điệu từ cằm lên đỉnh — tức một QUẢ TRỨNG. Chỗ thót ấy là
 * thứ mắt dùng để đọc ra *"có hộp sọ ở trên, có khuôn mặt ở dưới"*.
 * ⚠️ ĐÁY 0,26 (quả cầu `dome` cũ: 0,60) LÀ CÁI CẰM. Một cái đầu thu về 0,60 ở đáy thì nó không kết
 * thúc, nó bị CẮT NGANG — và chỗ cắt ấy chính là chỗ vòng 54 phải nhét một cái cổ rộng 0,46 vào để
 * che, rồi nhận lại một cái "vành cổ áo trắng".
 */
const SKULL_RINGS = Object.freeze([
  [-0.50, 0.26],   // cằm
  [-0.38, 0.54],   // hàm dưới
  [-0.26, 0.72],   // góc hàm
  [-0.14, 0.88],   // gò má — chỗ rộng nhất của KHUÔN MẶT
  [-0.04, 0.84],   // ⚠️ THÁI DƯƠNG: thót lại. Bỏ vành này là được một quả trứng.
  [0.08, 0.96],
  [0.20, 1.00],    // xương đỉnh — chỗ rộng nhất của CẢ CÁI ĐẦU
  [0.34, 0.90],
  [0.50, 0.44],    // chỏm
]);

const PROFILES = {
  /**
   * HỘP — giữ nguyên vẹn, và nó vẫn là câu trả lời ĐÚNG cho những thứ do bàn tay đóng ra: cái cặp,
   * bàn chân đi giày, một tấm ván. Bỏ hộp đi để "cho tròn hết" là đổi một sự đơn điệu này lấy một
   * sự đơn điệu khác.
   */
  box: { sides: 4, rings: [[-0.5, 1], [0.5, 1]] },

  /**
   * TRỤ — thứ tròn đều và gần như thẳng: cán giáo, bó củi, búi tóc.
   * ⚠️ Vẫn có một chỗ phình rất nhẹ ở giữa (0,94 → 1,00 → 0,94). Một cái ống HAI vành cho đúng một
   * dải sáng dọc dù có bao nhiêu cạnh đi nữa (xem chú thích "số vành" ở trên); ba vành với một chỗ
   * phình cho ba dải. Cái phình 6% ấy không đọc ra là "cái thùng", nó chỉ làm mất vẻ ống nhựa.
   */
  prism: { sides: ROUND_SIDES, rings: [[-0.5, 0.94], [0, 1.00], [0.5, 0.94]] },

  /**
   * ĐOẠN CHI TRÊN — **ĐÙI** hoặc **CÁNH TAY TRÊN**. Đầu to ở khớp gốc (hông / vai), thon xuống
   * khớp giữa (gối / khuỷu).
   *
   * ⚠️ TỪ ADR-057 KHUÔN NÀY CHỈ CÒN LÀ MỘT NỬA CHI, KHÔNG PHẢI CẢ CHI. Trước đó `limb` phải gánh
   * trọn hông → cổ chân trong MỘT khối, nên nó buộc phải nhét cả bắp chân lẫn đùi vào một đường
   * sinh, và cái "đầu gối" của nó chỉ là một chỗ thắt trang trí giữa đường. Nay đầu gối là một
   * KHỚP THẬT nằm giữa hai khối, nên mỗi khuôn chỉ còn phải kể một đoạn xương — và đường sinh vì
   * thế đọc đúng hơn hẳn.
   *
   * ⚠️ CHIỀU THON PHẢI KHỚP CÁCH `human.js` TREO KHỐI: đùi/cánh tay trên có `rest.y` ÂM (tâm nằm
   * DƯỚI khớp), nên +y của khuôn là đầu gắn vào khớp gốc = đầu TO. Đảo chiều là được một cái chân
   * hình củ cải.
   */
  limb: {
    sides: ROUND_SIDES,
    rings: [[-0.5, 0.70], [-0.18, 0.62], [0.12, 0.92], [0.34, 1.00], [0.50, 0.88]],
  },

  /**
   * ĐOẠN CHI DƯỚI — **CẲNG CHÂN** hoặc **CẲNG TAY**. Khuôn MỚI của ADR-057, và nó tồn tại vì một
   * lý do giải phẫu chứ không vì muốn thêm: bắp chân **phình ra ở khoảng một phần ba trên** rồi
   * thắt lại rất gắt ở cổ chân — chỗ NHỎ NHẤT cơ thể. Đùi thì ngược hẳn: to ở trên, thon đều
   * xuống. Hai đường cong ấy không thể là một hồ sơ, và dùng chung nghĩa là một trong hai phải
   * sai. Đây là lần thứ TÁM của họ bài học *"một trường gánh hai việc"*.
   *
   * Cổ chân (0,44) → bắp chân phình (1,00) → dưới gối thắt (0,74) → mặt gối (0,90).
   * ⚠️ BỐN ĐIỂM MỐC ẤY CHO BA CHỖ ĐỔI CHIỀU, tức bốn dải sáng khác nhau trên một khối cao chưa tới
   * một phần tư cơ thể. Đó là chỗ mà "trông 3D" thật sự được mua.
   */
  calf: {
    sides: ROUND_SIDES,
    rings: [[-0.5, 0.44], [-0.22, 0.63], [0.02, 1.00], [0.28, 0.74], [0.50, 0.90]],
  },

  /**
   * THÂN — và cả **XƯƠNG CHẬU**, áo khoác, âu phục, vì một tấm vải CẮT MAY thì bám theo đúng cái
   * thân bên dưới. Hông (0,80) → **EO thắt** (0,72) → lồng ngực nở (0,96) → vai rộng nhất (1,00)
   * → bo vai (0,78).
   *
   * ⚠️ CÁI BO Ở ĐỈNH LÀ PHẦN ĐÁNG TIỀN NHẤT CỦA KHUÔN NÀY. Camera của app chếch 34°, nên MẶT TRÊN
   * của thân là một trong những mảng lớn nhất mà mắt nhìn thẳng vào. Một cái đĩa phẳng ở đó là
   * đúng thứ "ô vuông" đập vào mắt trước tiên, và nó không biến mất chỉ vì thành phẳng bên đã tròn.
   */
  chest: {
    sides: ROUND_SIDES,
    rings: [[-0.5, 0.80], [-0.20, 0.72], [0.10, 0.96], [0.32, 1.00], [0.50, 0.78]],
  },

  /**
   * VÁY XOÈ — vải BUÔNG TỰ DO: gấu áo chùng, khăn nemes phủ vai, cái vò bụng phình.
   * ⚠️ BỐN ĐOẠN VỚI ĐỘ DỐC KHÁC NHAU cho ra một đường CHUÔNG chứ không phải một hình nón cụt. Nếu
   * các đoạn cùng độ dốc thì các dải sáng gộp lại thành một — tức tốn thêm vành để đổi lấy đúng
   * thứ đã có, một trục chết mang dáng một cải tiến.
   */
  flare: {
    sides: ROUND_SIDES,
    rings: [[-0.5, 1.00], [-0.24, 0.88], [0.02, 0.74], [0.28, 0.64], [0.50, 0.55]],
    folds: true,
  },

  /**
   * NÓN — thu về một mũi nhọn. Khuôn RẺ NHẤT bộ trong nhóm 12 cạnh, và cũng là khuôn sửa được
   * khuyết tật nặng nhất: nón lá kỷ 6 trước nay là một tấm dẹt cao bằng 0,34 lần cái đầu, nhìn từ
   * camera chếch thành một hình thoi trắng che kín người.
   * ⚠️ SƯỜN HƠI LÕM (các bước thu nhỏ dần trên những đoạn cao dần) — đúng dáng một cái nón lá thật,
   * vì nan tre cong chứ không thẳng. Một hình nón toán học có các mặt bên PHẲNG và trông y hệt một
   * cái phễu.
   */
  cone: {
    sides: ROUND_SIDES,
    rings: [[-0.5, 1.00], [-0.20, 0.68], [0.06, 0.44], [0.30, 0.24], [0.50, 0]],
  },

  /**
   * VÒM — cái đầu, nắm tay, và vài thứ đội lên đầu.
   * Hàm/cằm thu lại (0,60) → gò má (0,84) → chỗ rộng nhất hộp sọ (1,00, hơi trên tâm) → đỉnh sọ bo
   * dần (0,92 → 0,74 → 0,40).
   * ⚠️ ĐỈNH KHÔNG NHỌN: một cái sọ nhọn đọc ra là cái nón. ⚠️ VÀ ĐÁY PHẢI THU LẠI: để đáy rộng thì
   * cái đầu là một cái ống có nắp vòm, nhìn gần thì phần dưới tai thẳng đứng như một cái cốc.
   * Đây là khuôn ĐẮT NHẤT bộ và nó xứng: ở góc camera 34° thì mặt trên cái đầu chiếm phần lớn số
   * điểm ảnh của cả cơ thể.
   */
  dome: {
    sides: ROUND_SIDES,
    rings: [[-0.5, 0.60], [-0.28, 0.84], [-0.02, 1.00], [0.20, 0.92], [0.38, 0.74], [0.50, 0.40]],
  },

  /**
   * SỌ NGƯỜI — ROUND 58, VIỆC 3. Cái đầu, và CHỈ cái đầu, dùng khuôn này.
   *
   * ══════════════════════════════════════════════════════════════════════════════════════════
   * VÌ SAO MỘT ĐƯỜNG SINH, CHỨ KHÔNG PHẢI SÁU KHỐI DÁN THÊM — MỘT TẤM ẢNH ĐÃ BÁC BẢN KIA
   * ══════════════════════════════════════════════════════════════════════════════════════════
   * Bản đầu của Việc 3 dựng bảy đặc điểm sọ bằng **tám khối lồi dán lên quả cầu**: gờ mày, hai gò
   * má, hàm, cằm, gáy, hai tai. Mọi con số đo được đều đúng — gò má nhô hơn mặt sọ, cằm là điểm
   * nhô nhất của nửa dưới, tỉ lệ z/x về 0,80. Rồi chụp ảnh chính diện ở 1170×726:
   *   · gờ mày chạy hết bề ngang đầu ⇒ một **THANH NGANG** sáng giữa tóc và mắt, đọc ra là cái
   *     băng-đô hoặc cặp kính bảo hộ
   *   · hai gò má ⇒ hai **QUẢ BÓNG** dưới mắt, đọc ra là má chuột túi
   *   · cằm ⇒ một **QUẢ BÓNG** nữa dán dưới miệng
   *   · hàm ⇒ một **TẤM BẸT** có góc cạnh ở hai bên
   * Cộng lại: một cái MẶT NẠ GHÉP, tệ hơn hẳn khuôn mặt nhẵn của vòng 56.
   *
   * ⚠️ VÌ SAO NÓ HỎNG, NÓI CHO ĐÚNG BẢN CHẤT: mỗi khối là một vật LỒI riêng, nên nó mang theo
   * đường bao riêng và một chỗ GÃY PHÁP TUYẾN riêng ở chỗ giáp mặt sọ. Cộng nhiều vật lồi không
   * ra một mặt cong liền — nó ra nhiều cái bướu. Đây đúng cùng một bài học dự án đã trả tiền ở
   * cái mũ vành (2026-08-23): dựng bằng HAI khối (đĩa + chỏm) thì hỏng, hỏi lại *"ngoài đời đây
   * là MẤY vật?"* — một — rồi gộp thành một mặt tròn xoay thì vừa đẹp hơn vừa rẻ hơn.
   * ⇒ Cái sọ ngoài đời cũng là MỘT vật. Năm trong bảy đặc điểm Đàm đặt hàng là chuyện của MẶT CẮT
   * NGANG theo chiều cao — thứ mà một đường sinh diễn đạt được trọn vẹn và không có chỗ gãy nào:
   *     trán dốc · gò má · hàm thu · cằm · và chỗ THÓT Ở THÁI DƯƠNG
   * Hai đặc điểm còn lại là bất đối xứng TRƯỚC–SAU, mà một mặt tròn xoay quanh trục đứng thì không
   * làm được: **gáy** (`occiput`) và **gờ mày** (`browRidge`) vẫn phải là khối riêng — nhưng nay
   * chỉ còn hai, và cả hai đều nằm ở chỗ đường bao vốn đã phải gãy.
   *
   * ⚠️ CHỖ THÓT Ở THÁI DƯƠNG (vành 0,84 kẹp giữa gò má 0,88 và đỉnh 1,00) LÀ ĐẶC ĐIỂM ĐẮT NHẤT
   * Ở ĐÂY, và nó chỉ tồn tại được vì đây là một đường sinh. Không có nó thì mặt cắt ngang tăng đều
   * từ cằm lên đỉnh — tức một quả trứng. Cái thót ấy là thứ mắt dùng để đọc ra "có hộp sọ ở trên,
   * có khuôn mặt ở dưới".
   * ⚠️ ĐÁY 0,26 (quả cầu cũ: 0,60): đó là cái CẰM. Một cái đầu thu về 0,60 ở đáy thì nó không kết
   * thúc — nó bị cắt ngang, và chỗ cắt ấy chính là chỗ vòng 54 phải nhét một cái cổ rộng 0,46 vào
   * để che, rồi nhận lại một cái "vành cổ áo trắng".
   *
   * ⚠️ GIÁ: +1 KHUÔN ⇒ **+1 LỆNH VẼ cho cả 15 kỷ**, và `drawCallBudget.test.js` phải được nâng
   * từng kỷ một, có ngày tháng. Đó là một cái giá thật và nó được trả một cách tường minh: thành
   * phố đang tiêu 18 lệnh vẽ, nên đây là +5,5% để đổi lấy hình dạng của thứ Đàm đang nhìn ở cự ly
   * gần gấp năm. Không tránh được bằng cách sửa `dome`: `dome` còn dùng cho hai con mắt, con ngươi
   * và sáu khớp cầu — một cái đầu gối hình đầu lâu thì tệ hơn nhiều.
   */
  skull: { sides: ROUND_SIDES, rings: SKULL_RINGS },

  /**
   * DA ĐẦU CÓ CHÂN TÓC — round 56, Phần A, và khuôn duy nhất trong bộ có **đường viền dưới không
   * nằm trên một mặt phẳng**. Nó tồn tại vì một phép đo, không vì một ý thích.
   *
   * ⚠️ ĐO TRƯỚC KHI SỬA (`scripts/` không giữ, số in lại được bằng bài test cuối file). Tóc `crop`
   * của vòng 52 là một `dome` rộng hơn sọ 6% nhưng CHỈ CAO 0,52 `headH` và ngồi ở 0,74 `headH`, nên
   * vành đáy của chính nó nằm **sâu 36% bên trong** cái sọ — tức thứ mắt nhìn thấy KHÔNG PHẢI cái
   * vành ta vẽ, mà là **giao tuyến** của hai mặt tròn xoay cùng trục. Và đó là mấu chốt:
   *
   *     HAI MẶT TRÒN XOAY CÙNG TRỤC CẮT NHAU LUÔN CHO MỘT ĐƯỜNG TRÒN NẰM NGANG.
   *
   * Đo được: giao tuyến ấy nằm đúng ở `y/headH = 0,6364` ở **mọi** phương vị — một cái vạch ngang
   * tuyệt đối chạy quanh sọ, và tóc chỉ phủ 36,4% trên cùng của cái đầu. Vẽ lại cái vành cho đẹp
   * hơn KHÔNG đổi được gì, vì cái vành ấy không phải thứ đang hiện ra.
   * ⇒ Muốn chân tóc là chân tóc thì cái mũ tóc phải nằm **hoàn toàn bên ngoài** cái sọ, để vành
   * của chính nó trở thành đường viền. `scalpFit` bên dưới làm đúng điều đó và bài test
   * «MŨ TÓC PHẢI NẰM NGOÀI CÁI SỌ» giữ nó — không có bài test ấy thì lỗi này quay lại im lặng.
   *
   * ⚠️ VÀ ĐÂY LÀ MỘT LUẬT CHUNG, KHÔNG PHẢI MỘT CHI TIẾT VỀ TÓC. Đàm, vòng 56: *"có đường viền màu
   * nào đang nằm ở chỗ đời thật không có đường viền không?"* Cái vạch ngang này là **lần thứ ba**
   * cùng một hình dạng lỗi: khớp cầu `skin` trên tay áo sẫm (vòng 54), cổ 0,46 thành vòng cổ áo
   * trắng (vòng 54), nay là chân tóc. Cả ba đều là một RANH GIỚI MÀU đặt sai chỗ, và cả ba đều chỉ
   * bị bắt bởi một tấm ảnh soi gần — không bài test nào trong 1.779 bài thấy được.
   *
   * `rings` đúng bằng **CÁI SỌ**: mũ tóc là *chính cái sọ phóng to đều*, nên nó bám sát hộp sọ ở
   * mọi chỗ thay vì là một cái bát úp lên. Thứ duy nhất khác là `hairline`.
   *
   * ⚠️ VÀ TỪ ROUND 58 ĐÓ LÀ MỘT HẰNG SỐ DÙNG CHUNG (`SKULL_RINGS`), KHÔNG PHẢI MỘT BẢN CHÉP.
   * Trước vòng 58 hai bảng `rings` được gõ ra hai lần, giống hệt nhau, kèm một câu chú thích hứa
   * rằng chúng bằng nhau. Vòng 58 đổi cái đầu từ `dome` sang `skull` — và lời hứa ấy im lặng gãy:
   * ở tầm xương đỉnh sọ nở ra 1,00 còn mũ tóc (vẫn theo `dome`) chỉ 0,92 × 1,07 = 0,984 ⇒ **tóc
   * chui vào trong sọ**, và cái vạch ngang của vòng 56 quay lại y nguyên. Một lời hứa viết bằng
   * văn xuôi thì không có răng; dùng chung một hằng số thì có. Đúng `TECH_DEBT #42`.
   */
  scalp: { sides: ROUND_SIDES, rings: SKULL_RINGS, hairline: true },

  /**
   * MŨ VÀNH CỨNG — VÀNH và CHỎM trong MỘT khối, và đây là khuôn duy nhất trong bộ sinh ra vì một
   * lý do KHÔNG phải thẩm mỹ.
   *
   * ⚠️ NÓ TỒN TẠI VÌ MỘT CÁI CỔNG, VÀ CÁI CỔNG ẤY ĐÚNG. Bản đầu dựng mũ vành bằng HAI khối (một
   * đĩa + một chỏm) — nghe hợp lý, và nó đẩy một kỷ lên quá trần khối mà Đàm khi ấy chốt. Cách
   * đúng là hỏi lại *"ngoài đời đây là MẤY vật?"* — và câu trả lời là **một**.
   * ⇒ Bài học: khi một cái cổng chặn bạn lại, **hãy để nó chỉ ra một thiết kế đúng hơn** thay vì
   * đi vòng qua nó.
   *
   * ⚠️ CẤU TRÚC VÀNH PHẢI LÀ HAI MỨC y THẤP NHẤT (đáy vành và mặt trên vành), vì
   * `humanShape.test.js` ĐỌC CẤU TRÚC ẤY để tìm ra chỏm — nó không cắm một ngưỡng y chọn tay.
   * Đổi thứ tự vành mà quên điều này thì bài test đo nhầm chỗ và vẫn xanh.
   * ⚠️ CHỎM PHẢI RỘNG HƠN CÁI ĐẦU (0,62 × bề rộng vành = 1,18 × `headW` với vành 1,9 `headW`).
   */
  hat: {
    sides: ROUND_SIDES,
    rings: [[-0.5, 1.00], [-0.40, 1.00], [-0.36, 0.62], [0.04, 0.60], [0.28, 0.54], [0.50, 0.44]],
  },
};

/*
  ══════════════════════════════════════════════════════════════════════════════════════════════
  NẾP GẤP VÀ GẤU CONG — ROUND 54 (ADR-094), VIỆC 6: *"vải phải ra VẢI: xoè, có nếp mềm, gấu cong"*.
  ══════════════════════════════════════════════════════════════════════════════════════════════
  Trước vòng này mọi tấm vải buông — áo chùng, áo choàng, tay áo thụng — đều là một mặt tròn xoay
  HOÀN HẢO. Một hình nón cụt tròn tuyệt đối thì không phải vải; nó là kim loại dập. Vải thật có
  hai dấu hiệu mắt đọc được ở cỡ này, và chỉ hai: **nếp chạy dọc** và **gấu không phẳng**.

  ⚠️ VÌ SAO KHÔNG DÙNG `cos(k·θ)` — CÁI CỔNG ĐÃ CHỈ RA MỘT THIẾT KẾ ĐÚNG HƠN, LẦN THỨ BA.
  Cách hiển nhiên là nhân bán kính với `1 + biên·cos(k·θ)`. Nó **phá bất biến hộp đơn vị**:
  bài *"MỌI KHUÔN NẰM GỌN TRONG HỘP ĐƠN VỊ … và chạm ĐÚNG mép"* đòi trải đúng [−0,5, 0,5] trên cả
  ba trục, vì `humanPose.partCornersAt` và `silhouetteSpanX` đều tính từ TÁM ĐỈNH CỦA HỘP. Ở 20
  cạnh, đỉnh xa nhất theo x và z rơi đúng vào `j mod 5 ∈ {0, 4}` — một cái cô-sin liên tục không
  thể bằng đúng 1 ở cả tám đỉnh ấy, nên nó sẽ làm khối HẸP ĐI vài phần nghìn và mọi phép đo hình
  bóng bắt đầu nói dối — êm ả, không triệu chứng.
  ⇒ Nếp vì thế khai bằng MỘT BẢNG THEO `j`, với **sống nếp đặt đúng vào tám đỉnh mép** (hệ số 1,00
  ở `j mod 5 ∈ {0, 4}`) và rãnh nếp nằm giữa. Hình bao **không đổi một chữ số nào**, và ta được
  bốn nếp dọc miễn phí. Đây đúng bài học đã cứu cái mũ vành và tay áo vòng 52: **khi một cái cổng
  chặn lại, hãy để nó chỉ ra một thiết kế đúng hơn** thay vì đi vòng qua nó.

  ⚠️ GẤU CONG CŨNG PHẢI CHẠM ĐÚNG −0,5. Bảng `HEM_DROP` đo từ đáy lên, nên chỗ thấp nhất của gấu
  (hệ số 0) vẫn nằm đúng trên mặt đáy hộp, còn chỗ cao nhất thì vén lên — đúng chiều của một tấm
  vải đang buông. Gấu vén cao nhất ở SỐNG nếp (chỗ vải bị kéo căng) và xõa xuống ở RÃNH.

  ⚠️ VÀ NẾP CHỈ RÕ Ở GẤU, TAN DẦN LÊN TRÊN (`w` dưới đây). Vải được thắt ở trên (thắt lưng, khuỷu
  tay) và tự do ở dưới; nếp đều từ trên xuống dưới là một cái ống xếp ly, không phải một tấm vải.

  ⚠️ `flare` CÒN ĐƯỢC DÙNG CHO CÁI VÒ MANG TRÊN ĐẦU, VÀ ĐÓ LÀ CỐ Ý ĐỂ NGUYÊN: một cái vò gốm có
  bốn múi mềm là hình đúng của đồ gốm nặn tay, và Việc 11 của chính vòng này cũng đặt hàng
  *"cái vò tròn"*. Không tách thêm một khuôn nữa chỉ để cái vò khỏi có nếp — thêm khuôn là thêm
  đúng một lệnh vẽ cho mọi kỷ dùng cả hai (xem `humanShapesUsed`).
*/
/** Hệ số bán kính theo `j mod 5`. 1,00 = sống nếp (phải rơi đúng tám đỉnh mép), 0,93 = đáy rãnh. */
const FOLD_RADIUS = [1.00, 0.965, 0.93, 0.965, 1.00];
/** Gấu vén lên bao nhiêu phần chiều cao, theo `j mod 5`. 0 = chỗ thấp nhất, chạm đúng đáy hộp. */
const HEM_DROP = [0.055, 0.030, 0, 0.030, 0.055];
/** Chu kỳ của hai bảng trên. `ROUND_SIDES` phải chia hết cho nó, không thì nếp bị lệch mối. */
const FOLD_PERIOD = FOLD_RADIUS.length;

/*
  ══════════════════════════════════════════════════════════════════════════════════════════════
  CHÂN TÓC — ROUND 56, PHẦN A. Bốn con số, và cả bốn đều đọc được từ giải phẫu chứ không chỉnh tay.
  ══════════════════════════════════════════════════════════════════════════════════════════════
  Vành dưới của mũ tóc chạy theo **tham số đường sinh** `p` (0 = vành đáy sọ, 5 = đỉnh sọ), chứ
  không theo một độ cao `y` cố định. Chọn `p` thay vì `y` là có lý do: bán kính đi kèm `p` luôn là
  bán kính ĐÚNG của sọ ở chỗ ấy, nên vành tóc **bám mặt sọ** ở mọi phương vị. Khai theo `y` thì
  phải tự tra lại bán kính, tức hai công thức cho một quan hệ — đúng cái bẫy `TECH_DEBT #42`.

  Ba mốc giải phẫu, quy ra `p` bằng chính bảng `rings` của `dome`:
    · gáy   `y/headH ≈ 0,16` → p = 0,727     (tóc phủ xuống tận chân tóc sau gáy)
    · thái dương `0,34`      → p = 1,462     (tóc xuống quá đuôi mắt, trước vành tai)
    · trán  `0,72`           → p = 3,111     (chân tóc trước)
  Một hàm BẬC HAI theo `cos(θ)` đi qua đúng cả ba — bậc nhất thì thái dương lệch 8,6 điểm phần
  trăm, tức tóc dừng ngang tầm mắt hai bên đầu. `θ = 0` là hướng mặt (`humanPose.js` để +x là
  hướng đi); đặt nhầm dấu thì được một người có chân tóc trước gáy, hình học vẫn hợp lệ.

  ⚠️ ĐỈNH NHỌN GIỮA TRÁN DÙNG `c^24`, KHÔNG PHẢI `c^6`. Số mũ 6 trải cái hõm ra tới ±40°, tức nó
  không tạo ra một cái hõm mà chỉ **bạt phẳng đỉnh đường cong** — đo được: giữa trán 0,716 so với
  ±30° là 0,686, vẫn cao hơn hai bên, tức ngược hẳn ý định. Mũ 24 thu cái hõm về trong ±20°, đúng
  bề ngang một cái đỉnh tóc thật. Đây là lần thứ hai trong dự án một hàm mượt được chọn vì tên gọi
  chứ không vì đồ thị của nó (lần đầu: `cos(k·θ)` cho nếp vải, xem khối trên).
*/
/*
  ⚠️ ROUND 58: BỐN HẰNG SỐ NÀY ĐỔI ĐƠN VỊ TỪ **CHỈ SỐ VÀNH** SANG **CHIỀU CAO**, VÀ ĐÓ LÀ MỘT LỖI
  THẬT ĐÃ NỔ RA CHỨ KHÔNG PHẢI MỘT LẦN DỌN DẸP.

  Bản vòng 56 khai chân tóc bằng `p` — tham số chạy 0 … `rings.length − 1`, tức **một chỉ số vành**.
  Ba con số (1,462 · 1,192 · 0,457) được giải ra cho `dome`, khuôn có ĐÚNG 6 vành. Vòng 58 cho cái
  đầu một khuôn riêng, `skull`, có **9 vành** — và cùng một `p` lập tức rơi vào một độ cao khác:
  chân tóc trước tụt từ 0,672 xuống **0,343** lần chiều cao đầu, tức xuống ngang tầm mắt. Bài gác
  chân tóc của vòng 56 bắt được ngay (*"trán − gáy = 0,250, dưới 0,40 thì nó vẫn đọc ra một cái
  vạch ngang"*), nên chuyện này tốn một lần chạy test chứ không tốn một vòng.

  ⚠️ BÀI HỌC, VÀ NÓ THUỘC HỌ ĐÃ CÓ TÊN TRONG DỰ ÁN: **một con số chỉ có nghĩa cùng với hệ quy chiếu
  nó được giải ra.** `p = 1,462` không nói "ở thái dương" — nó nói "ở 24% quãng đường giữa vành 1
  và vành 2 CỦA MỘT KHUÔN CÓ 6 VÀNH". Đổi số vành là đổi thước đo mà mọi con số vẫn nguyên và không
  có gì đỏ lên ở tầng dưới. Cùng họ với `cadenceOf` (`humanStyle.js`) — đúng số, sai NHÃN.
  ⇒ Nay ba mốc khai bằng **chiều cao, đơn vị `headH`, đo từ đáy cằm** — đúng đơn vị mà chính khối
  chú thích dưới đây vẫn dùng để MÔ TẢ chúng, và là đơn vị không đổi khi ai đó thêm một vành.
*/
const HAIRLINE_NAPE = 0.093;     // chân tóc ở GÁY (θ = 180°), lần chiều cao đầu
const HAIRLINE_TEMPLE = 0.340;   // chân tóc ở THÁI DƯƠNG (θ = 90°)
const HAIRLINE_BROW = 0.720;     // chân tóc giữa TRÁN (θ = 0°), trước khi trừ đỉnh nhọn
const HAIRLINE_PEAK = 0.045;     // hõm/đỉnh nhọn giữa trán, cũng tính bằng chiều cao

/** Chiều cao chân tóc (đơn vị `headH`, gốc ở đáy) tại phương vị có `cos(θ) = c`. */
function hairlineHeight(c) {
  // Bậc hai đi qua đúng ba mốc trên: gáy (c = −1) · thái dương (c = 0) · trán (c = +1).
  const a0 = HAIRLINE_TEMPLE;
  const a1 = (HAIRLINE_BROW - HAIRLINE_NAPE) / 2;
  const a2 = (HAIRLINE_BROW + HAIRLINE_NAPE) / 2 - HAIRLINE_TEMPLE;
  const peak = c > 0 ? HAIRLINE_PEAK * c ** 24 : 0;
  return a0 + a1 * c + a2 * c * c - peak;
}

/**
 * Tham số đường sinh `p` ứng với một CHIỀU CAO cho trước — phép đổi đơn vị mà vòng 58 thêm vào.
 * `rings` có `y` tăng đơn điệu (mọi hồ sơ trong `PROFILES` đều vậy), nên đây là một phép nội suy
 * tuyến tính ngược, không phải một phép dò.
 */
function paramAtHeight(rings, h) {
  const y = h - 0.5;                       // `rings` đo y từ −0,5 (đáy) tới +0,5 (đỉnh)
  const last = rings.length - 1;
  if (y <= rings[0][0]) return 0;
  for (let i = 0; i < last; i += 1) {
    const [y0] = rings[i];
    const [y1] = rings[i + 1];
    if (y <= y1) return i + (y - y0) / (y1 - y0);
  }
  return last;
}

/** Tham số đường sinh của chân tóc tại phương vị có `cos(θ) = c`. Tất định, không tra bảng. */
function hairlineParam(rings, c) {
  return paramAtHeight(rings, hairlineHeight(c));
}

/** Điểm `[y, r]` trên đường sinh tại tham số `p` liên tục (0 … rings.length − 1). */
function profileAt(rings, p) {
  const last = rings.length - 1;
  const q = Math.min(last, Math.max(0, p));
  const i = Math.min(last - 1, Math.floor(q));
  const t = q - i;
  return [
    rings[i][0] + (rings[i + 1][0] - rings[i][0]) * t,
    rings[i][1] + (rings[i + 1][1] - rings[i][1]) * t,
  ];
}

/** Bán kính ngoại tiếp cho quy ước "bề rộng đo ngang mặt phẳng = 1,0". Xem QUY ƯỚC mục 1. */
function circumradius(sides) {
  return 0.5 / Math.cos(Math.PI / sides);
}

function pushTri(pos, nor, a, b, c) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len; ny /= len; nz /= len;
  for (const p of [a, b, c]) {
    pos.push(p[0], p[1], p[2]);
    nor.push(nx, ny, nz);
  }
}

/*
  ══════════════════════════════════════════════════════════════════════════════════════════════
  DỰNG MỘT KHỐI TIỆN BỊ CẮT XÉO — mỗi cột một điểm xuất phát riêng trên cùng một đường sinh.
  ══════════════════════════════════════════════════════════════════════════════════════════════
  Cách hiển nhiên là giữ nguyên các vành rồi HẠ vành đáy xuống theo phương vị (đúng cách `HEM_DROP`
  làm cho gấu váy). Nó hỏng ở đây, và hỏng nặng: chân tóc phải đi từ p = 0,7 (gáy) tới p = 3,1
  (trán), tức nó VƯỢT QUA vành 1 và vành 2 ở phía trước. Vành nào nằm dưới chân tóc sẽ phải bẹp
  vào đúng chân tóc ⇒ tam giác diện tích 0 ⇒ `pushTri` chia cho một vectơ pháp tuyến dài 0. Cái
  `|| 1` trong `pushTri` sẽ nuốt chuyện đó và trả về pháp tuyến (0, 0, 0) — **một khuyết tật im
  lặng**, đúng họ lỗi mà cả file này được viết ra để tránh.
  ⇒ Thay vào đó, mỗi cột lấy ĐỦ `rings.length` mức, trải đều từ chân tóc của chính nó lên tới
  đỉnh. Không mức nào trùng mức nào, không tam giác nào bẹp, và số tam giác không phụ thuộc hình
  dạng chân tóc — nên đổi `HAIRLINE_*` không bao giờ làm trôi ngân sách tam giác.

  ⚠️ ĐÁY BỊT BẰNG MỘT MŨI NHỌN TRÊN TRỤC, KHÔNG PHẢI MỘT CÁI NẮP PHẲNG. Một cái nắp phẳng bắc qua
  đường chân tóc là một mặt VÊNH cắt xuyên qua hộp sọ, nên nó lòi ra thành những mảnh màu tóc lởm
  chởm quanh chân tóc. Mũi nhọn ở tâm vành đáy sọ thì nằm gọn bên trong sọ (đã kiểm bằng bài test
  «MŨ TÓC PHẢI NẰM NGOÀI CÁI SỌ»), chỉ để lộ một vệt rất mỏng ngay dưới chân tóc — mà vệt ấy chính
  là **bề dày của mái tóc ở chỗ cắt**, tức một thứ đúng chứ không phải một thứ phải chịu đựng.
  Nó cũng dùng lại đúng nhánh `r = 0` mà vòng lặp thường đã có, nên không thêm một luật dựng nào.

  ⚠️ VÀ PHẢI KÉO LẠI CHO ĐẦY HỘP ĐƠN VỊ. Cắt xéo thì không cột nào còn đi qua chỗ phình rộng nhất
  (p = 2, r = 1,00), nên khối HẸP HƠN hộp của nó — và bài «NẰM GỌN TRONG HỘP ĐƠN VỊ … chạm ĐÚNG
  mép» đỏ, đúng như nó phải đỏ: `humanPose.partCornersAt` và `silhouetteSpanX` đo hình bóng từ tám
  đỉnh hộp, một khối hẹp hơn hộp làm mọi con số ấy nói quá. Kéo x và z lại cho chạm đúng ±0,5 rồi
  TRẢ RA hệ số đã kéo (`boxFillX`), để `scalpFit` khử ngược nó đi và cái mũ tóc vẫn đúng bằng cái
  sọ phóng to đều. Trục y không cần kéo: mũi nhọn đã ở −0,5 và đỉnh sọ ở +0,5 sẵn.
*/
function buildHairline(pos, nor, rings, sides, R) {
  const last = rings.length - 1;
  const cols = [];
  for (let j = 0; j < sides; j += 1) {
    const ang = (j + 0.5) * ((Math.PI * 2) / sides);
    const cos = Math.cos(ang);
    cols.push({ cos, sin: Math.sin(ang), p0: hairlineParam(rings, cos) });
  }
  /** Đỉnh thứ `j` của mức thứ `i`, với mức 0 = chân tóc của chính cột ấy. */
  const vert = (i, j) => {
    const col = cols[j % sides];
    const [y, r] = profileAt(rings, col.p0 + (last - col.p0) * (i / last));
    return [R * r * col.cos, y, R * r * col.sin];
  };

  const from = pos.length;
  for (let i = 0; i < last; i += 1) {
    for (let j = 0; j < sides; j += 1) {
      const a = vert(i, j);
      const b = vert(i, j + 1);
      const c = vert(i + 1, j + 1);
      const d = vert(i + 1, j);
      pushTri(pos, nor, a, c, b);
      pushTri(pos, nor, a, d, c);
    }
  }
  // Nắp đỉnh — đỉnh sọ là một đĩa nhỏ (r = 0,40), y như `dome`. Bỏ nó đi thì nhìn từ trên xuống
  // thấy thủng một lỗ đúng chỗ camera 34° nhìn vào nhiều nhất.
  for (let j = 1; j < sides - 1; j += 1) {
    pushTri(pos, nor, vert(last, 0), vert(last, j + 1), vert(last, j));
  }
  /*
    Mũi nhọn bịt đáy.
    ⚠️ KHÔNG CHÉP CHIỀU QUAY TỪ NHÁNH `rLo === 0` CỦA VÒNG LẶP THƯỜNG — nhánh ấy **chưa bao giờ
    chạy**: không hồ sơ nào trong `PROFILES` có vành ĐÁY bằng 0 (`cone` có vành ĐỈNH bằng 0, rơi
    vào nhánh `rHi === 0`). Bản đầu của hàm này chép nó và lập tức bị bài «MỌI KHUÔN NGỬA MẶT RA
    NGOÀI» bắt: 60 cạnh có hướng bị dùng hai lần, tức mũi nhọn cãi nhau về chiều quay với dải mặt
    bên ngay trên nó. Quy ước của file là **vành DƯỚI của một dải đi theo chiều j+1 → j, vành TRÊN
    đi theo j → j+1**; chân tóc là vành DƯỚI của dải trên nó, nên mũi nhọn phải coi nó là vành
    TRÊN của chính mình ⇒ `(apex, j, j+1)`.
    ⇒ Và đây là một phát hiện đáng ghi riêng: một nhánh mã chưa từng chạy thì cũng chưa từng được
    kiểm — nó trông như một tiền lệ đáng tin nhưng không phải. `TECH_DEBT` nhận một mục.
  */
  const apex = [0, rings[0][0], 0];
  for (let j = 0; j < sides; j += 1) {
    pushTri(pos, nor, apex, vert(0, j), vert(0, j + 1));
  }

  /*
    ⚠️ TRỤC x KHÔNG ĐỐI XỨNG, VÀ ĐÓ CHÍNH LÀ ĐIỀU KHUÔN NÀY SINH RA ĐỂ LÀM. Chân tóc sau gáy nằm
    thấp (p = 0,73) nên cột phía sau vẫn đi qua chỗ phình rộng nhất của sọ (p = 2, r = 1,00); chân
    tóc trước trán nằm cao (p = 2,7) nên cột phía trước KHÔNG đi qua chỗ ấy. Đo được: trải x là
    [−0,500; 0,490] — lệch tâm 1%. Một phép NHÂN không đưa được một khoảng lệch tâm về [−0,5; 0,5],
    nên phải dời tâm rồi mới kéo, và `scalpFit` khử ngược cả hai. Trục z thì đối xứng thật (chân
    tóc chỉ phụ thuộc `cos θ`, mà `cos` đối xứng qua mặt phẳng x–y), nên nó chỉ cần kéo.
    ⚠️ Bản đầu chỉ kéo theo `max|x|` và bài «NẰM GỌN TRONG HỘP ĐƠN VỊ» đỏ ngay — đúng việc của nó.
  */
  let loX = Infinity;
  let hiX = -Infinity;
  let hiZ = 0;
  for (let i = from; i < pos.length; i += 3) {
    loX = Math.min(loX, pos[i]);
    hiX = Math.max(hiX, pos[i]);
    hiZ = Math.max(hiZ, Math.abs(pos[i + 2]));
  }
  const spanX = hiX - loX;
  const midX = (hiX + loX) / 2;
  const spanZ = hiZ * 2;
  for (let i = from; i < pos.length; i += 3) {
    pos[i] = (pos[i] - midX) / spanX;
    pos[i + 2] /= spanZ;
  }
  return { spanX, midX, spanZ };
}

const CACHE = new Map();

/**
 * Toạ độ của một khuôn: `{ positions, normals, triangles }`, KHÔNG đánh chỉ mục.
 *
 * ⚠️ KHÔNG ĐÁNH CHỈ MỤC LÀ CỐ Ý, và từ vòng 54 lý do đã ĐỔI — đừng đọc câu cũ ở đây nữa.
 * Lý do cũ: giữ pháp tuyến phẳng theo từng mặt. Lý do NAY: **`smoothCrease` cần mỗi mặt có bộ đỉnh
 * riêng để có thể cho hai mặt kề hai pháp tuyến KHÁC NHAU tại cùng một điểm** — đúng điều một
 * lưới đánh chỉ mục KHÔNG làm được. Đó là cách một cái nắp vẫn sắc cạnh trong khi thân trụ ngay
 * bên dưới đã tròn. Dùng chung đỉnh thì mọi cạnh đều bị bình quân hoá vô điều kiện, và cả hộp
 * lẫn nắp đều tròn nhũn.
 *
 * ⚠️ SỐ TAM GIÁC ĐẾM TỪ CHÍNH MẢNG VỪA DỰNG (`positions.length / 9`), tuyệt đối KHÔNG từ một công
 * thức song song. Dự án đã trả giá đúng chỗ này ở `countTriangles` (`parts.js`): một chú thích tự
 * nhận "có test đối chiếu hai bên" trong khi bài test chỉ so với hằng số viết tay, và hai bên có
 * thể lệch tuỳ ý suốt sáu tháng mà không gì đỏ lên.
 */
export function humanShapeMesh(name) {
  const cached = CACHE.get(name);
  if (cached) return cached;

  const profile = PROFILES[name];
  if (!profile) throw new Error(`humanShapeMesh: khuôn lạ "${name}"`);

  const { sides, rings, folds = false, hairline = false } = profile;
  const R = circumradius(sides);
  const pos = [];
  const nor = [];

  // ⚠️ NẾP TẤT ĐỊNH TẮP LỰ: cả hai bảng đều tra theo `j`, không có một `Math.random` nào. Cùng một
  // khuôn luôn ra cùng một bộ số, vĩnh viễn (bất biến bảo tàng — một kỷ đã niêm phong phải hiện
  // lại y nguyên sau năm năm).
  if (folds && sides % FOLD_PERIOD !== 0) {
    throw new Error(`humanShapeMesh: ${sides} cạnh không chia hết cho chu kỳ nếp ${FOLD_PERIOD}`);
  }
  const cao = rings[rings.length - 1][0] - rings[0][0];

  /** Đỉnh thứ `j` của vành thứ `i`. `r = 0` ⇒ mũi nhọn trên trục. */
  const vert = (i, j) => {
    const [y, r] = rings[i];
    if (r === 0) return [0, y, 0];
    const ang = ((j % sides) + 0.5) * ((Math.PI * 2) / sides);
    if (!folds) return [R * r * Math.cos(ang), y, R * r * Math.sin(ang)];
    // `w` = 1 ở gấu, 0 ở mép trên: nếp rõ dần theo chiều vải buông xuống.
    const w = cao > 0 ? (rings[rings.length - 1][0] - y) / cao : 0;
    const k = (j % sides) % FOLD_PERIOD;
    const rr = r * (1 - w * (1 - FOLD_RADIUS[k]));
    const yy = i === 0 ? y + cao * HEM_DROP[k] : y;
    return [R * rr * Math.cos(ang), yy, R * rr * Math.sin(ang)];
  };

  // ⚠️ HAI ĐƯỜNG DỰNG, MỘT CÁI ĐUÔI CHUNG. `hairline` không phải một biến thể của vòng lặp bên
  // dưới mà là một cách dựng KHÁC HẲN (mỗi cột một điểm xuất phát riêng), nên nó đứng thành một
  // nhánh thay vì rắc `if` vào giữa vòng lặp cũ — thứ đã làm `geometryFactory` khó đọc suốt hai
  // phase. Phần làm mềm và phần đóng gói thì DÙNG CHUNG, để không có khuôn nào lọt ra ngoài
  // `smoothCrease` một cách im lặng.
  let boxFit = null;
  if (hairline) {
    boxFit = buildHairline(pos, nor, rings, sides, R);
  } else {
    // ── Mặt bên ────────────────────────────────────────────────────────────────
    for (let i = 0; i < rings.length - 1; i += 1) {
      const rLo = rings[i][1];
      const rHi = rings[i + 1][1];
      for (let j = 0; j < sides; j += 1) {
        const a = vert(i, j);
        const b = vert(i, j + 1);
        const c = vert(i + 1, j + 1);
        const d = vert(i + 1, j);
        // Thứ tự đỉnh đã kiểm bằng tay tại góc 0 (pháp tuyến phải ra +x). Sai thứ tự thì mặt biến
        // mất khi nhìn từ ngoài mà lại hiện ra khi nhìn từ trong — đúng khuyết tật chiều quay tam
        // giác đã nuốt 19,2% mặt đường ở Phase 14 §1(1), và nó KHÔNG có triệu chứng nào khác.
        if (rHi === 0) pushTri(pos, nor, a, c, b);
        else if (rLo === 0) pushTri(pos, nor, d, a, c);
        else { pushTri(pos, nor, a, c, b); pushTri(pos, nor, a, d, c); }
      }
    }

    // ── Nắp đáy và nắp đỉnh ────────────────────────────────────────────────────
    if (rings[0][1] > 0) {
      for (let j = 1; j < sides - 1; j += 1) {
        pushTri(pos, nor, vert(0, 0), vert(0, j), vert(0, j + 1));
      }
    }
    const top = rings.length - 1;
    if (rings[top][1] > 0) {
      for (let j = 1; j < sides - 1; j += 1) {
        pushTri(pos, nor, vert(top, 0), vert(top, j + 1), vert(top, j));
      }
    }

  }

  /*
    ⚠️ LÀM MỀM PHÁP TUYẾN THEO GÓC GÃY — ROUND 54 (ADR-094), VIỆC 1, VÀ ĐÂY LÀ DÒNG QUAN
    TRỌNG NHẤT MÀ VÒNG NÀY THÊM VÀO CƠ THỂ NGƯỜI.
    Khối đã cong từ ADR-057 — mọi hồ sơ trên đều là một đường sinh nhiều vành. Thứ làm chúng
    hiện lên thành gỗ ghép là `pushTri`: nó ghi MỘT pháp tuyến phẳng cho cả tam giác, nên một
    thân người 20 cạnh hiện ra đúng 20 tấm phẳng dù đỉnh của nó nằm trên một đường tròn.
    ⇒ Không thêm một tam giác nào mà đổi toàn bộ cơ thể của cả 15 kỷ.

    ⚠️ CHÚ THÍCH CŨ Ở ĐẦU FILE NÓI NGƯỢC LẠI — *"KHÔNG ĐƯỢC LÀM MƯỢT ĐI … sẽ mất hết cạnh
    bắt sáng"* — và câu ấy ĐÚ NG Ở thời của nó, với một lý do phải giữ lại: nó nói về việc
    **thêm vành cho mượt đường sinh**, tức trả tam giác để mua độ cong — và lúc ấy làm mềm là
    đánh đổi thật. Phép này khác hẳn: nó không đổi một toạ độ nào, không thêm một vành nào, và
    chỉ gộp những mặt **dưới 40°** — cạnh thật (mặt bên gặp nắp: 90°; hai mặt của `box`: 90°;
    vành mũ gặp chỏm) vẫn sắc nguyên. `box` vì thế **không đổi một byte nào**.
  */
  smoothCrease(pos, nor);

  const out = { positions: pos, normals: nor, triangles: pos.length / 9, boxFit };
  CACHE.set(name, out);
  return out;
}

/**
 * BÁN KÍNH CỦA MỘT KHUÔN Ở ĐẦU TRÊN (`+1`) HOẶC ĐẦU DƯỚI (`-1`), tính theo HỘP ĐƠN VỊ.
 * Nhân với `size` của khối là ra bán kính thật trong cảnh.
 *
 * ⚠️ TỒN TẠI ĐỂ KHỚP CẦU THÔI PHÌNH — round 58, Việc 2. Trước vòng này, đường kính quả cầu ở khớp
 * là `bề ngang chi × 1,04`, tức một hằng số nhân **đoán** rằng mọi chi đều dày bằng bề ngang khai
 * báo của nó. Không đúng: `limb` thu về 0,70 ở đầu dưới còn `calf` nở tới 0,90 ở đầu trên, nên quả
 * cầu to hơn chỗ nó nối **15%** và đọc ra là một cục u. Hỏi thẳng hồ sơ khuôn thì con số không thể
 * lệch khỏi hình đang dựng.
 */
export function shapeEndRadius(name, which = 1) {
  const profile = PROFILES[name];
  if (!profile) throw new Error(`shapeEndRadius: khuôn lạ "${name}"`);
  const { rings, sides } = profile;
  const ring = which >= 0 ? rings[rings.length - 1] : rings[0];
  return circumradius(sides) * ring[1];
}

/**
 * BÁN KÍNH LỚN NHẤT của một khuôn, theo HỘP ĐƠN VỊ. Nhân với `size` là ra bán kính thật.
 * ⚠️ Khác `shapeEndRadius`: `dome` phình tới r = 1,00 ở GIỮA nhưng chỉ 0,60/0,40 ở hai đầu, nên
 * hỏi nhầm hàm sẽ cho một quả cầu nhỏ hơn ý định gần một nửa.
 */
/**
 * ĐƯỜNG SINH của một khuôn — mảng `[y, r]`, `y` chạy −0,5 … +0,5, `r` là hệ số bề rộng.
 *
 * ⚠️ TỒN TẠI ĐỂ XOÁ BẢN CHÉP THỨ BA. Bảng vành của cái sọ từng được gõ ra ba nơi: `dome`, `scalp`,
 * và một bản chép tay trong `humanShape.test.js` (hàm `matSo`). Hai bản đầu đã gộp thành
 * `SKULL_RINGS`; bản thứ ba thì không gộp được vì nó nằm ở file test — nên thay vì chép, bài test
 * HỎI. Vòng 58 đổi cái đầu sang `skull` và bản chép ấy lập tức báo *"872 đỉnh mũ tóc nằm trong
 * sọ"* cho một mũ tóc hoàn toàn nằm ngoài: một phép đo dựng trên một bản chép cũ thì nó đo cái
 * đầu CŨ, dù mã đã đổi. Đúng `TECH_DEBT #42`, và đúng luật 1 của `CLAUDE.md`.
 */
export function shapeRings(name) {
  const profile = PROFILES[name];
  if (!profile) throw new Error(`shapeRings: khuôn lạ "${name}"`);
  return profile.rings.map((r) => [r[0], r[1]]);
}

export function shapeMaxRadius(name) {
  const profile = PROFILES[name];
  if (!profile) throw new Error(`shapeMaxRadius: khuôn lạ "${name}"`);
  return circumradius(profile.sides) * Math.max(...profile.rings.map((r) => r[1]));
}

/** Số tam giác của một khuôn. Đọc từ chính mảng đã dựng — xem chú thích `humanShapeMesh`. */
export function shapeTriangles(name) {
  return humanShapeMesh(name).triangles;
}

/** Khuôn có tồn tại không. `human.js` gọi để một `shape` khai sai bị bắt ngay ở tầng thuần. */
export function isValidHumanShape(name) {
  return Object.hasOwn(PROFILES, name);
}

/**
 * KÍCH THƯỚC VÀ CHỖ TREO CỦA MŨ TÓC, tính từ chính cái đầu — không phải ba con số chép tay.
 *
 * ⚠️ VÌ SAO PHÉP NÀY PHẢI Ở ĐÂY CHỨ KHÔNG Ở `human.js`. Nó phải khử ngược `boxFillX`, thứ chỉ
 * `buildHairline` biết; chép con số ấy sang `human.js` là dựng một công thức thứ hai cho cùng một
 * quan hệ, và ngày nào ai đó đổi `HAIRLINE_*` thì hai bên lệch nhau **im lặng** — mũ tóc thụt vào
 * trong sọ vài phần trăm và cái vạch ngang quay lại y như cũ. Đây đúng `TECH_DEBT #42`.
 *
 * Kết quả: mũ tóc = **chính cái sọ phóng to đều `lift` lần quanh gốc khớp `head`**. Phóng to ĐỀU
 * (cả y) chứ không chỉ theo bán kính, vì ở đỉnh sọ mặt sọ gần như nằm ngang — giãn theo bán kính
 * thôi thì ở đúng đỉnh đầu hai mặt chồng khít lên nhau và ta được z-fighting. Gốc khớp `head` nằm
 * ở đáy cái đầu và đường sinh của `dome` nhìn từ điểm ấy là đơn điệu, nên phóng to đều quanh nó
 * chắc chắn nằm ngoài — không phải hy vọng, mà là thứ bài test cuối `humanShape.test.js` đo.
 */
/*
  ⚠️ ROUND 58: THÊM THAM SỐ `headZ`, VÀ NÓ KHÔNG PHẢI MỘT TIỆN NGHI — BỎ NÓ LÀ CHÂN TÓC HỎNG LẠI.
  Từ vòng 58 cái sọ hẹp hai bên (`headZ = 0,80 headW`, Việc 3). Mũ tóc phải là *"chính cái sọ phóng
  to đều"* — nếu bề z của nó vẫn tính theo `headW` thì nó rộng hơn sọ 1,25 lần ở hai bên: chân tóc
  rời khỏi da đầu ở thái dương và ta được đúng cái **vạch ngang** mà vòng 56 vừa xoá. Tham số có
  giá trị mặc định `headW` để mọi chỗ gọi cũ giữ nguyên nghĩa cũ.
*/
export function scalpFit(headW, headH, lift, headZ = headW) {
  const { spanX, midX, spanZ } = humanShapeMesh('scalp').boxFit;
  return {
    size: [lift * headW * spanX, lift * headH, lift * headZ * spanZ],
    rest: [lift * headW * midX, lift * headH * 0.5, 0],
  };
}
