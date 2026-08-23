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
 * ⚠️ VÀ KHÔNG ĐƯỢC LÀM MƯỢT ĐI. Cám dỗ tiếp theo luôn là "thêm mười vành cho nó tròn hẳn". Làm thế
 * là mất hết cạnh bắt sáng và khối trở nên tròn nhũn, đúng thất bại đã ghi ở `geometryFactory.js`:
 * "giống 3D hơn" ở đây đến từ SỐ MẶT BẮT SÁNG KHÁC NHAU, không đến từ độ mượt.
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
  prism: { sides: 12, rings: [[-0.5, 0.94], [0, 1.00], [0.5, 0.94]] },

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
    sides: 12,
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
    sides: 12,
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
    sides: 12,
    rings: [[-0.5, 0.80], [-0.20, 0.72], [0.10, 0.96], [0.32, 1.00], [0.50, 0.78]],
  },

  /**
   * VÁY XOÈ — vải BUÔNG TỰ DO: gấu áo chùng, khăn nemes phủ vai, cái vò bụng phình.
   * ⚠️ BỐN ĐOẠN VỚI ĐỘ DỐC KHÁC NHAU cho ra một đường CHUÔNG chứ không phải một hình nón cụt. Nếu
   * các đoạn cùng độ dốc thì các dải sáng gộp lại thành một — tức tốn thêm vành để đổi lấy đúng
   * thứ đã có, một trục chết mang dáng một cải tiến.
   */
  flare: {
    sides: 12,
    rings: [[-0.5, 1.00], [-0.24, 0.88], [0.02, 0.74], [0.28, 0.64], [0.50, 0.55]],
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
    sides: 12,
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
    sides: 12,
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
    sides: 12,
    rings: [[-0.5, 1.00], [-0.40, 1.00], [-0.36, 0.62], [0.04, 0.60], [0.28, 0.54], [0.50, 0.44]],
  },
};

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
 * ⚠️ KHÔNG ĐÁNH CHỈ MỤC LÀ CỐ Ý, cùng đúng lý do đã ghi ở `geometryFactory.js`: mỗi mặt có bộ đỉnh
 * riêng nên pháp tuyến PHẲNG theo từng mặt. Dùng chung đỉnh sẽ bình quân hoá pháp tuyến, khối trở
 * nên tròn nhũn và mất hết cạnh bắt sáng — mà chính những cạnh bắt sáng ấy mới là thứ làm một khối
 * tám cạnh đọc ra là KHỐI chứ không phải một vệt màu. "Giống 3D hơn" ở đây đến từ số lượng mặt bắt
 * sáng khác nhau, không đến từ độ mượt.
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

  const { sides, rings } = profile;
  const R = circumradius(sides);
  const pos = [];
  const nor = [];

  /** Đỉnh thứ `j` của vành thứ `i`. `r = 0` ⇒ mũi nhọn trên trục. */
  const vert = (i, j) => {
    const [y, r] = rings[i];
    if (r === 0) return [0, y, 0];
    const ang = ((j % sides) + 0.5) * ((Math.PI * 2) / sides);
    return [R * r * Math.cos(ang), y, R * r * Math.sin(ang)];
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
