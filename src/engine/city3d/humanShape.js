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
const ROUND_SIDES = 20;

export const HUMAN_SHAPES = ['box', 'prism', 'limb', 'calf', 'chest', 'flare', 'cone', 'dome', 'hat'];

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

  const { sides, rings, folds = false } = profile;
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

  const out = { positions: pos, normals: nor, triangles: pos.length / 9 };
  CACHE.set(name, out);
  return out;
}

/** Số tam giác của một khuôn. Đọc từ chính mảng đã dựng — xem chú thích `humanShapeMesh`. */
export function shapeTriangles(name) {
  return humanShapeMesh(name).triangles;
}

/** Khuôn có tồn tại không. `human.js` gọi để một `shape` khai sai bị bắt ngay ở tầng thuần. */
export function isValidHumanShape(name) {
  return Object.hasOwn(PROFILES, name);
}
