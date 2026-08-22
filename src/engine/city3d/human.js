/**
 * human.js — bộ chữ cái của CƠ THỂ. Một cư dân là một danh sách hộp gắn vào một bộ khớp.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`. Chỉ MÔ TẢ hình học bằng dữ
 * liệu; việc biến mô tả thành đối tượng GPU là của `components/city/render3d/sceneGraph.js`.
 * Đúng khuôn `flora.js` (ADR-020) và `streetStyle.js` (ADR-025): bảng theo kỷ tách khỏi thư viện
 * hình khối, và thư viện hình khối không biết gì về three.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * HỆ TOẠ ĐỘ CỤC BỘ — đọc kỹ, mọi con số dưới đây nằm trong hệ này
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *   +x = HƯỚNG ĐI (trước mặt)   ·   +y = LÊN, gốc ở MẶT ĐẤT   ·   +z = bên TRÁI người
 *
 * ⚠️ Vì sao +x là hướng đi chứ không phải một trục tuỳ ý: `sceneGraph.js` xoay cư dân bằng
 * `setFromAxisAngle(UP, -spot.angle)`, mà `cellToWorld` ánh xạ ô (x, y) sang thế giới (x, z).
 * Phép xoay quanh trục Y một góc `-a` đưa vector cục bộ (1, 0, 0) tới (cos a, sin a) trong mặt
 * phẳng (x, z) — đúng bằng vector hướng đi `Math.atan2` sinh ra. Nên +x cục bộ LÀ hướng đi, không
 * phải một quy ước chọn cho tiện. Đặt sai chỗ này thì cả thành phố đi ngang như cua, mà **không có
 * gì đỏ lên** vì hình học vẫn hợp lệ.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ NGÂN SÁCH: 319 TAM GIÁC MỖI NGƯỜI — VÀ CON SỐ CŨ Ở ĐÂY ĐÃ LẠC HẬU 5,4 LẦN
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Trần đã thoả thuận: tam giác cư dân không vượt **6% tổng cảnh**. Tỉ lệ ấy KHÔNG đổi; cái đổi là
 * mẫu số, và nó đổi mà chú thích này đứng yên suốt hai phase:
 *
 *     ghi ở đây trước 2026-08-23:  kỷ 1 = 19.434 tam giác thành phố + 44.126 nền = 63.560
 *     đo lại 2026-08-23:           kỷ 1 = **104.958** + 44.126 = **149.084**
 *     lệnh đo: node --import ./scripts/register-esm-loader.mjs scripts/scene-tri.mjs
 *
 * Thành phố phình 5,4 lần ở Phase 14 §1(3) ("một ô là một KHU PHỐ"). Với cùng 6% và cùng
 * `MAX_RESIDENTS = 28`, trần thật ở kỷ 1 là **8.945 / 28 = 319 tam giác mỗi người**, không phải
 * 136. Cơ thể trước bản này tiêu 108 (9 hộp × 12).
 *
 * ⚠️ MỘT TRẦN LẠC HẬU THEO HƯỚNG **SIẾT** THÌ KHÔNG AI PHÁT HIỆN — nó không làm gì hỏng, nó chỉ
 * làm một hướng đi tốt trông như đã bị cấm. Trần lạc hậu theo hướng nới thì sớm muộn có người kêu
 * máy giật; trần lạc hậu theo hướng siết thì im lặng vĩnh viễn. Đây là mặt còn lại của bài học
 * Performance Gate 2026-08-17 (*"một ngân sách tự tính mà chưa bao giờ được đặt cạnh sự thật thì
 * không phải ngân sách"*), và nó đã giữ cơ thể ở dạng chồng-gạch lâu hơn cần thiết.
 *
 * ⚠️ VÀ "CHẤM Ở KỶ 1 VÌ NÓ XẤU NHẤT" NAY LÀ MỘT KẾT LUẬN CHỨ KHÔNG CÒN LÀ MỘT LẬP LUẬN. Lý lẽ cũ
 * (*"cư dân tốn một lượng CỐ ĐỊNH nên tỉ lệ cao nhất ở kỷ có mẫu số nhỏ nhất"*) đứng trên tiền đề
 * "tử số cố định" — mà từ bản này mỗi kỷ dựng một cơ thể khác nhau (220…324 tam giác, chênh 1,47
 * lần). Ca xấu nhất nay là `max` của một tỉ số hai đại lượng cùng biến thiên, nên phải TÍNH ĐỦ 15
 * DÒNG mới biết nó ở đâu (`sceneGraphWiring.test.js` làm việc đó). Kết quả vẫn là kỷ 1 — 5,40% —
 * nhưng nay ta BIẾT thế chứ không SUY thế.
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG `parts.js`. Nhà máy hình khối của công trình chỉ xoay quanh TRỤC ĐỨNG
 * (`ry`) — nó không nghiêng được, và một cái chân thì bắt buộc phải nghiêng. Thêm trục nghiêng vào
 * `parts.js` là chạm vào nền móng của cả 75 công trình cộng phép đếm tam giác cộng phép tính cạnh
 * vát, để đổi lấy một thứ chỉ cư dân cần. Ở đây đi đường khác: file này chỉ khai HỘP + KHỚP, còn
 * phép xoay nghiêng nằm ở tầng ma trận của three trong `sceneGraph.js`, nơi nó vốn đã miễn phí.
 */

import { HUMAN_BASE_HEIGHT, getHumanStyle } from './humanStyle';
import { isValidHumanShape, shapeTriangles } from './humanShape';

/**
 * Chiều cao cư dân cỡ chuẩn, đơn vị ô. `stature` của mỗi kỷ nhân vào con số này.
 * ⚠️ ĐỊNH NGHĨA ĐÃ CHUYỂN SANG `humanStyle.js` (2026-08-23), ở đây chỉ `export` LẠI để mọi chỗ gọi
 * cũ không phải đổi. Lý do chuyển: `cadenceOf` cần chiều dài cẳng chân mới ra ĐÚNG ĐƠN VỊ, mà file
 * này thì `import` `humanStyle.js` nên không thể `import` ngược lại; chép số 0,2 sang bên ấy là
 * "một luật hai công thức". Xem chú thích tại chỗ định nghĩa.
 * ⚠️ Vẫn GIỮ NGUYÊN 0,2 — bằng đúng `RESIDENT_HEIGHT` cũ. Nhà cửa, camera và bản quét 15 kỷ đều đã
 * hiệu chuẩn quanh nó; đổi nó là đổi cân đối của cả cảnh.
 */
export { HUMAN_BASE_HEIGHT };

/**
 * Vai màu. Năm vai, không hơn — mỗi vai là một màu phải tính ra rồi nhồi vào `instanceColor`, và
 * ở cỡ 14 điểm ảnh thì vai thứ sáu không đọc ra được nữa.
 */
// ⚠️ `straw` LÀ VAI THỨ SÁU, THÊM 2026-08-23, VÀ NÓ TỐN ĐÚNG 0 LỆNH VẼ + 0 TAM GIÁC — cả cộng
// đồng đi qua MỘT `InstancedMesh` và màu vào qua `setColorAt`, nên số vai màu không phải một
// ngân sách. Xem `humanStyle.js` mục `HEAD_MATERIALS` để biết vì sao nó phải tách khỏi `cloth2`.
export const HUMAN_ROLES = ['skin', 'cloth', 'cloth2', 'straw', 'hair', 'gear'];

/** Tên các khớp. `sceneGraph.js` và `humanPose.js` cùng đọc danh sách này — một chỗ khai duy nhất. */
export const HUMAN_JOINTS = ['torso', 'head', 'shoulderL', 'shoulderR', 'hipL', 'hipR'];

/**
 * Kích thước cơ thể suy từ một dòng bảng kỷ. Tách riêng khỏi `parts` vì `humanPose.js` cần đúng
 * bộ số này để đặt các khớp, và nếu hai bên tự tính riêng thì khớp sẽ trôi khỏi hộp — kinh điển
 * "một luật hai công thức".
 */
export function humanDims(style) {
  const H = HUMAN_BASE_HEIGHT * style.stature;
  const legLen = H * style.legShare;
  // ⚠️ ĐẦU TO CÓ CHỦ Ý (22% chiều cao, người thật ~13%). Ở 14 điểm ảnh thì đầu tỉ lệ thật ra
  // 1,8 điểm ảnh và biến mất; mà cái đầu chính là thứ DUY NHẤT làm mắt đọc ra "người" thay vì
  // "viên gạch" — đó là toàn bộ ngôn ngữ của quân cờ và của hình nhân Lego, và mô hình 2 hộp cũ
  // đã chọn đúng như vậy (28%). Đây là một quyết định về KHẢ ĐỌC, không phải về giải phẫu.
  const headH = H * 0.20;
  const torsoH = H - legLen - headH;
  const b = style.build;
  return {
    height: H,
    legLen,
    headH,
    torsoH,
    /**
     * Bề ngang (trục z) và bề dày (trục x) của thân. Người dày trước-sau ít hơn rộng ngang.
     *
     * ⚠️ THÂN PHẢI CAO HƠN RỘNG, và bản đầu KHÔNG như vậy — chỉ ảnh chụp gần mới lộ ra. Với
     * `torsoW = 0,30 × H` cộng chân 0,52 và đầu 0,22, phần còn lại cho thân chỉ là 0,26 × H, tức
     * thân rộng 0,079 mà cao 0,061: một **tấm phản nằm ngang**, không phải một cái người. Ba con
     * số ấy chia nhau một cái bánh có tổng bằng 1, nên nâng chân và nâng đầu là ngầm bóp thân —
     * một quan hệ không ai viết ra và không có gì đỏ lên. Nay 0,25 và đầu 0,20, và kỷ 1 hạ chân
     * về 0,50 ⇒ thân cao 0,071 rộng 0,066: cao hơn rộng, đúng như một cái người.
     */
    torsoW: H * 0.25 * b,
    torsoD: H * 0.155 * b,
    headW: H * 0.20,
    limbW: H * 0.085 * b,
    /**
     * Khoảng cách từ trục giữa ra tâm mỗi hông / mỗi vai.
     * ⚠️ `shoulderZ` PHẢI BÁM MÉP THÂN, KHÔNG ĐƯỢC LÀ MỘT SỐ RỜI. Nó là một QUAN HỆ với `torsoW`
     * (nửa bề ngang thân), nên khi thân bị bóp lại thì vai phải theo — bản đầu để 0,145 rời rạc,
     * và lúc thân hạ từ 0,30 xuống 0,25 thì vai nằm HẲN ngoài thân, hai cánh tay lơ lửng cách
     * người 0,005 ô. Đúng bài học mặt đường Phase 7D: câu mô tả có chữ "ở mép thân" là một quan
     * hệ, mà một con số tuyệt đối thì không nhìn thấy cái thân.
     * Đặt đúng bằng nửa bề ngang thân ⇒ cánh tay nằm nửa trong nửa ngoài đường bao: đủ dính vào
     * người, mà vẫn nhô ra đủ để đọc được lúc vung.
     */
    hipZ: H * 0.075 * b,
    shoulderZ: H * 0.125 * b,
    /** Tay dài tới giữa đùi — mốc giải phẫu quen thuộc, và nó khiến bàn tay đu đúng tầm hông. */
    armLen: (H - legLen - headH) + legLen * 0.22,
  };
}

/**
 * Một khối gắn vào một khớp. `rest` là tâm khối SO VỚI gốc khớp, trước khi khớp xoay.
 *
 * ⚠️ `shape` LÀ THAM SỐ BẮT BUỘC, KHÔNG CÓ MẶC ĐỊNH — và đó là một quyết định, không phải sự khắt
 * khe thừa. Cho nó rơi ngầm về `'box'` thì mọi khối viết sau này sẽ lặng lẽ quay lại làm viên gạch,
 * đúng cái đã xảy ra với `vernacularRoof` khi nó còn là trường tuỳ chọn (Phase 7C): một trường có
 * mặc định là một trường sẽ bị quên. Khai sai tên khuôn thì ném ngay ở tầng thuần.
 *
 * ⚠️ `w`/`h`/`d` VẪN LÀ BỀ RỘNG NHÌN THẤY, y như thời mọi thứ là hộp. `humanShape.js` dựng khuôn
 * theo quy ước "mặt phẳng = 1,0" nên độ trải theo x và z của khối ĐÚNG BẰNG độ trải của hộp cũ ⇒
 * `partCornersAt` / `silhouetteSpanX` / `human-scale.mjs` không phải đổi một dòng nào.
 */
function piece(id, role, shape, joint, size, rest) {
  if (!isValidHumanShape(shape)) throw new Error(`human.js: khối "${id}" khai khuôn lạ "${shape}"`);
  return {
    id,
    role,
    shape,
    joint,
    w: size[0],
    h: size[1],
    d: size[2],
    rest: { x: rest[0], y: rest[1], z: rest[2] },
  };
}

/**
 * KHỐI TRANG PHỤC — chỗ mà `garment` biến thành hình học.
 *
 * ⚠️ MỖI KIỂU PHẢI ĐỔI ĐƯỜNG BAO Ở MỘT CHỖ KHÁC NHAU, nếu không nó chỉ là một khối vải đổi màu.
 * Ở 14 điểm ảnh, mắt không đọc được chất liệu, không đọc được nếp gấp, không đọc được đường may —
 * nó chỉ đọc được **người này phình ra ở đâu**. Vai thì khác hông, hông thì khác gấu áo.
 *
 * ⚠️ VÀ TỪ 2026-08-23, MỖI KIỂU CÒN PHẢI TRẢ LỜI "KHỐI VẢI NÀY LÀ HÌNH GÌ" — vì một tấm da thú
 * choàng quanh người và một cái áo choàng xoè gấu KHÔNG cùng một khối, dù cả hai đều là "vải".
 * Quy tắc chọn khuôn ở đây là VẬT LÝ chứ không phải mỹ thuật: vải QUẤN quanh thân thì tròn đều
 * (`prism`); vải BUÔNG tự do thì gấu xoè ra (`flare`); vải CẮT MAY theo người thì rộng ở vai và
 * thu xuống eo (`limb`). Ba câu ấy phân loại đủ bảy kiểu mà không cần một lựa chọn tuỳ hứng nào.
 */
function garmentPiece(kind, d) {
  switch (kind) {
    case 'none':
      return null;
    // Tấm da thú vắt qua MỘT vai: lệch hẳn sang một bên, phủ chéo xuống hông đối diện. Đây là
    // khối DUY NHẤT trong bộ phá thế đối xứng trái-phải, và chính sự bất đối xứng ấy là thứ đọc
    // ra được ở cỡ nhỏ — mắt bắt bất đối xứng nhạy hơn bắt chi tiết. Da thú QUẤN quanh thân.
    case 'pelt':
      return piece('garment', 'cloth', 'prism', 'torso',
        [d.torsoD * 1.16, d.torsoH * 0.86, d.torsoW * 0.72],
        [d.torsoD * 0.06, d.torsoH * 0.52, d.torsoW * 0.30]);
    // Vải quấn ngang hông: phình ở GIỮA thân, vai để trần. Quấn ⇒ `prism`.
    case 'wrap':
      return piece('garment', 'cloth', 'prism', 'torso',
        [d.torsoD * 1.18, d.torsoH * 0.46, d.torsoW * 1.14],
        [0, d.torsoH * 0.24, 0]);
    // Áo chùng thẳng: gấu buông xuống quá hông và XOÈ ra — `flare`. Trước đây là một khối hộp
    // thẳng đứng, tức một cái ống, và một cái ống thì không đọc ra là vải đang buông.
    case 'tunic':
      return piece('garment', 'cloth', 'flare', 'torso',
        [d.torsoD * 1.12, d.torsoH * 1.02, d.torsoW * 1.10],
        [0, d.torsoH * 0.40, 0]);
    // Áo choàng chấm đất: gấu buông XUỐNG DƯỚI gốc khớp thân, nuốt luôn phần trên hai chân. Chú
    // thích cũ đã tự nói ra hình đúng của nó — *"đường bao thành hình chuông"* — mà khối dựng ra
    // thì vẫn là hộp. Nay `flare` làm đúng câu ấy.
    case 'robe':
      return piece('garment', 'cloth', 'flare', 'torso',
        [d.torsoD * 1.20, d.torsoH + d.legLen * 0.72, d.torsoW * 1.22],
        [0, (d.torsoH - d.legLen * 0.72) * 0.5, 0]);
    // Áo khoác có vai: phình ở TRÊN, thóp ở dưới — đúng định nghĩa `limb` (rộng trên, thon dưới).
    case 'coat':
      return piece('garment', 'cloth', 'limb', 'torso',
        [d.torsoD * 1.22, d.torsoH * 0.82, d.torsoW * 1.26],
        [0, d.torsoH * 0.62, 0]);
    // Âu phục may đo: bó sát nhất bộ — cùng khuôn với áo khoác nhưng đường bao gần bằng thân.
    case 'suit':
      return piece('garment', 'cloth', 'limb', 'torso',
        [d.torsoD * 1.06, d.torsoH * 1.00, d.torsoW * 1.04],
        [0, d.torsoH * 0.48, 0]);
    default:
      return null;
  }
}

/**
 * ĐỘI ĐẦU. Gắn vào khớp `head` nên nó nghiêng theo đầu. Trả về MỘT MẢNG, có thể rỗng.
 *
 * ⚠️ VAI MÀU CỦA NÓ KHÔNG SUY TỪ `kind` MÀ TỪ `material` — hai cái mũ CÙNG HÌNH có thể khác
 * VẬT LIỆU (mũ rơm Firenze và mũ phớt New York đều là `brim`), và vật liệu mới là thứ quyết
 * định nhạt hay sẫm. Suy từ `kind` là dựng lại đúng cái bẫy đã gỡ ở ADR-054.
 */
/**
 * ⚠️ CỠ MŨ ĐO TRONG **HAI HỆ QUY CHIẾU** VÀ HAI HỆ ẤY CÃI NHAU — đây là cái bẫy riêng của bảng này.
 *
 * Cái đầu trong dự án này **cố ý to gấp 1,54 lần đời thật** (0,20 chiều cao thay vì ~0,13), vì ở 14
 * điểm ảnh một cái đầu đúng tỉ lệ chỉ còn 1,8 điểm ảnh và biến mất. Hệ quả không ai viết ra: **mọi
 * thứ đo theo cái đầu cũng bị phóng 1,54 lần theo**.
 *
 * Nón lá thật rộng 40 cm trên một cái đầu 15 cm ⇒ **2,67 lần bề ngang đầu**. Chép đúng con số ấy
 * (bản đầu để 2,2, đã là dè dặt) thì trên màn hình nó rộng 0,44 chiều cao người, tức **1,76 lần bề
 * ngang vai** — và ảnh dựng ra đúng như thế: một **cái nấm trắng nuốt trọn người**, chỉ còn hai
 * chân thò ra. Đo trên hình bóng: cái mũ chiếm 65% chiều cao khung của cư dân.
 *
 * Nhưng đo theo VAI thì cũng sai ngược lại: nón lá 40 cm trên vai 45 cm = 0,89 lần bề ngang vai =
 * 0,22 chiều cao người — **hẹp hơn cả cái đầu đã phóng to**, tức không còn ra cái nón nữa.
 *
 * ⇒ Với NÓN LÁ, lấy **TRUNG BÌNH NHÂN của hai hệ**: √(0,534 × 0,22) = 0,343 chiều cao =
 * **1,71 headW**, chiều cao giữ nguyên tỉ số 0,42 với đường kính (con số của vật thật) nên phép
 * thu nhỏ không làm nó bẹt ra. Sau bản này cái mũ chiếm 50% chiều cao khung thay vì 65%.
 *
 * ⚠️ **NHƯNG PHÉP ẤY KHÔNG ÁP ĐƯỢC CHO MŨ CÓ CHỎM, và một bài test đã bắt được lúc tôi thử.** Nón
 * lá chỉ bị cái đầu ràng buộc một chiều (vành phải RỘNG HƠN đầu — một cận dưới rất lỏng), nên nó
 * được phép trôi về phía hệ quy chiếu vai. Mũ vành thì **CHỎM phải lồng vừa cái sọ**, tức bề rộng
 * của nó BỊ CỘT CHẶT vào `headW`; thu nhỏ nó là dựng ra một cái mũ nhỏ hơn cái đầu. Xem `case
 * 'brim'` bên dưới.
 *
 * Bài học chung: khi một bảng có một đại lượng đã bị phóng đại **có chủ ý**, mọi thứ neo vào nó
 * thừa kế luôn phép phóng đại ấy — và không có gì đỏ lên, vì từng con số riêng lẻ đều "đúng theo
 * vật thật". Hỏi *"tôi đang đo theo cái gì, và cái đó có đúng tỉ lệ không?"*; rồi hỏi tiếp *"cái
 * neo ấy là một TỈ LỆ hay chỉ là một CẬN?"* — hai câu ấy cho hai câu trả lời khác nhau, và chính
 * chỗ khác nhau đó là chỗ tôi đã sai.
 */
function headgearPieces(kind, d, material) {
  // Sợi mộc thì NHẠT hơn áo; vải nhuộm thì cùng lò với quần nên SẪM hơn áo.
  const vai = material === 'natural' ? 'straw' : 'cloth2';
  switch (kind) {
    case 'none':
      return [];
    // Búi tóc: một cái nút TRÒN, không phải một viên gạch nhỏ.
    case 'bun':
      return [piece('headgear', 'hair', 'prism', 'head',
        [d.headW * 0.48, d.headH * 0.44, d.headW * 0.48],
        [-d.headW * 0.12, d.headH * 1.06, 0])];
    // Khăn trùm (nemes Ai Cập · khăn lanh Đức · ghutra UAE): bó quanh trán rồi XOÈ xuống vai. Đó
    // đúng là `flare` — và nó là lý do khăn nemes không được là một cái hộp: hình bóng đặc trưng
    // của nó nằm ở chỗ nó loe ra hai bên má.
    case 'headcloth':
      return [piece('headgear', vai, 'flare', 'head',
        [d.headW * 1.30, d.headH * 1.10, d.headW * 1.34],
        [-d.headW * 0.05, d.headH * 0.60, 0])];
    // ⚠️ MŨ VÀNH CỨNG = MỘT KHỐI, và con đường tới đó đáng ghi lại. Bản đầu dựng nó bằng HAI khối
    // (đĩa + chỏm) vì "một cái mũ vành thì có hai phần" — nghe hợp lý, và nó đẩy kỷ 8 lên 12 khối,
    // vượt trần 11 mà Đàm chốt. Thay vì nới trần, hỏi lại *"ngoài đời đây là mấy vật?"*: một. Một
    // cái mũ là một mặt tròn xoay liền khối, và `humanShape.js` dựng mặt tròn xoay được. Kết quả
    // vừa giữ trần, vừa đúng hình học hơn, vừa rẻ hơn 12 tam giác. Xem khuôn `hat`.
    // Chiều cao 0,78 `headH` (vành ~9% chiều cao ấy) — tỉ lệ của một cái mũ thật; bản cũ để vành
    // cao đúng 0,16 `headH` và KHÔNG có chỏm, nên nhìn từ camera chếch 34° nó là một tấm ván, và
    // trên dải 15 kỷ ba ô đội mũ vành (7 · 8 · 11) hiện ra là ba hình thoi che kín cư dân.
    // ⚠️ BỀ RỘNG NÀY **BỊ CÁI ĐẦU RÀNG BUỘC**, KHÔNG ĐƯỢC THU NHỎ TỰ DO — và tôi đã thử thu nhỏ,
    // rồi bài test *"mũ vành phải đội vừa cái đầu"* bắt được: hồ sơ `hat` có chỏm rộng 0,62 lần
    // vành, nên vành 1,38 `headW` cho ra chỏm 0,86 `headW` — **hẹp hơn cái sọ nó đang đội lên**.
    // Một cái mũ không lồng vừa đầu thì đúng là "khối lơ lửng" mà cả bản này sinh ra để xoá.
    // ⇒ Với mũ CÓ CHỎM, hệ quy chiếu đúng là CÁI ĐẦU, không phải cái vai: chỏm 1,18 `headW` (thừa
    // 18% để lồng vào), vành gấp 1,61 lần chỏm (vật thật: 1,7–1,9). Nó thừa hưởng luôn phép phóng
    // đại của cái đầu, và đó là cái giá phải trả, không phải một khuyết tật sửa được bằng số.
    case 'brim':
      return [piece('headgear', vai, 'hat', 'head',
        [d.headW * 1.9, d.headH * 0.78, d.headW * 1.9],
        [0, d.headH * 1.19, 0])];
    // Mũ trụ: một cái VÒM kim loại. `dome` là hình học của chính vật ấy, không phải một cách điệu.
    case 'helm':
      return [piece('headgear', 'gear', 'dome', 'head',
        [d.headW * 1.10, d.headH * 0.82, d.headW * 1.10],
        [0, d.headH * 0.88, 0])];
    // Mũ vải mềm ôm sát sọ (futou · casquette · mũ nồi tweed) — ôm sọ thì phải cùng khuôn với sọ.
    case 'cap':
      return [piece('headgear', vai, 'dome', 'head',
        [d.headW * 1.16, d.headH * 0.42, d.headW * 1.10],
        [d.headW * 0.10, d.headH * 0.94, 0])];
    // ⚠️ NÓN LÁ — KHUYẾT TẬT NẶNG NHẤT CỦA CẢ BỘ, VÀ NÓ LÀ MỘT KHUYẾT TẬT VỀ CHIỀU CAO.
    // Bản cũ: một khối hộp rộng `2,2 × headW` mà chỉ cao `0,34 × headH`. Tỉ lệ ấy không phải một
    // cái nón, nó là một cái ĐĨA — và trên dải 15 kỷ, ô kỷ 6 hiện ra đúng là một hình thoi trắng,
    // không nhìn thấy người đâu cả.
    // Nón lá thật: đường kính ~40 cm trên một cái đầu ~15 cm, cao ~0,42 lần đường kính. Sửa hai
    // thứ, và chỉ một trong hai là chuyện chiều cao:
    //   • KHUÔN: hộp → `cone`, để nó có một cái CHÓP. Tám mặt nghiêng bắt nắng tám mức khác nhau
    //     ⇒ đọc ra là khối chứ không phải một tấm bìa.
    //   • BỀ RỘNG: 2,2 → **1,71 `headW`** (xem khối chú thích "hai hệ quy chiếu" ở đầu hàm). Bản
    //     đầu giữ 2,2 với lý lẽ *"đo theo đầu thì con số ấy đúng"* — và ảnh dựng ra bác bỏ ngay:
    //     cái mũ nuốt trọn người, chiếm 65% chiều cao khung, chỉ còn hai chân thò ra. Nay 50%.
    // Chiều cao giữ ĐÚNG tỉ số 0,42 với đường kính ⇒ 0,72 `headH`; thu nhỏ mà không làm nó bẹt.
    case 'conical':
      return [piece('headgear', vai, 'cone', 'head',
        [d.headW * 1.71, d.headH * 0.72, d.headW * 1.71],
        [0, d.headH * 1.06, 0])];
    default:
      return [];
  }
}

/**
 * ĐỒ MANG THEO. Gắn vào khớp `shoulderR` (trừ `pot` đội đầu) nên nó ĐU THEO TAY khi đi — thứ đó
 * mới đọc ra là "đang cầm", chứ một khối đứng yên cạnh người thì đọc ra là "một cái cột".
 *
 * ⚠️ KHUÔN Ở ĐÂY CHỌN THEO CÁCH VẬT ẤY ĐƯỢC LÀM RA: thứ tiện/vót/bó thì tròn (`prism`), thứ nặn
 * bằng đất thì bụng phình cổ thon (`flare`), thứ đóng bằng ván và bản lề thì vuông (`box`). Cái
 * cặp là chỗ DUY NHẤT trong cả cơ thể mà một viên gạch là câu trả lời đúng — bỏ `box` đi để "cho
 * tròn hết" là đổi một sự đơn điệu này lấy một sự đơn điệu khác.
 */
function carryPiece(kind, d) {
  switch (kind) {
    case 'none':
      return null;
    // Vệt DỌC cao quá đầu. Trục dễ đọc nhất ở cỡ nhỏ vì nó thò hẳn ra ngoài đường bao người, và
    // vì mắt bắt đường thẳng đứng đơn độc rất nhanh. Cán gỗ vót tròn ⇒ `prism`.
    case 'spear':
      return piece('carry', 'gear', 'prism', 'shoulderR',
        [d.limbW * 0.42, d.height * 1.24, d.limbW * 0.42],
        [d.limbW * 0.9, -d.armLen * 0.36, -d.limbW * 0.5]);
    // Bó củi / bó lúa buộc dây: mặt cắt tròn.
    case 'bundle':
      return piece('carry', 'gear', 'prism', 'shoulderR',
        [d.torsoD * 0.9, d.torsoH * 0.40, d.torsoW * 1.5],
        [-d.torsoD * 0.3, d.armLen * 0.16, -d.torsoW * 0.25]);
    // Vò gốm đội đầu: bụng phình, cổ thon — `flare` là đúng mặt cắt dọc của một cái vò.
    case 'pot':
      return piece('carry', 'gear', 'flare', 'head',
        [d.headW * 1.02, d.headH * 0.84, d.headW * 1.02],
        [0, d.headH * 1.36, 0]);
    // Cán cuốc / cán búa: gỗ vót tròn.
    case 'tool':
      return piece('carry', 'gear', 'prism', 'shoulderR',
        [d.limbW * 0.5, d.armLen * 0.62, d.limbW * 0.5],
        [d.limbW * 1.1, -d.armLen * 0.78, -d.limbW * 0.4]);
    // Cặp / vali: đóng bằng ván và bản lề — vuông, và vuông là ĐÚNG.
    case 'case':
      return piece('carry', 'gear', 'box', 'shoulderR',
        [d.torsoD * 0.34, d.torsoH * 0.42, d.torsoW * 0.62],
        [d.limbW * 0.6, -d.armLen * 1.02, -d.limbW * 0.8]);
    default:
      return null;
  }
}

/**
 * Dựng cơ thể của một kỷ: kích thước + danh sách hộp.
 *
 * ⚠️ THỨ TỰ HỘP LÀ MỘT HỢP ĐỒNG. `sceneGraph.js` nhồi hộp thứ `k` của người thứ `i` vào ô
 * `i * parts.length + k` của `InstancedMesh`, và màu cũng theo chỉ số ấy. Nên số hộp phải GIỐNG
 * NHAU cho mọi người trong cùng một kỷ (đúng: cả thành phố dùng chung một `era`), và thứ tự phải
 * ổn định giữa hai lần gọi.
 *
 * @param {number} era
 * @returns {{style:object, dims:object, parts:Array}}
 */
export function buildHumanBody(era) {
  const style = getHumanStyle(era);
  const d = humanDims(style);

  // ⚠️ CHÂN TRƯỚC, và không phải để cho gọn: chân là khối DUY NHẤT bắt buộc phải có ở mọi kỷ để
  // phép đo "hình bóng đổi theo pha bước" còn ý nghĩa. Đặt cụm chân ở đầu danh sách thì một bài
  // test muốn cắt riêng chân ra chỉ cần lấy bốn phần tử đầu, khỏi phải lọc theo `id` — mà lọc theo
  // tên vai/`role` chính là cái bẫy đã cắn ở Phase 8A ("hỏi theo `role` thì ba nguyên mẫu tàng
  // hình") và lại cắn lần nữa ở ADR-054 (mũ trụ `gear` nhận vơ chỗ của khẩu súng `gear`).
  // ⚠️ VAI MÀU PHẢI DỰNG RA BA TẦNG ĐẬM NHẠT, KHÔNG ĐƯỢC ĐỂ CẢ NGƯỜI MỘT MÀU — và bản đầu đã sai
  // đúng như vậy: mọi bộ phận đều mang vai `skin`, mà `skin` là màu SÁNG NHẤT bảng (độ đậm 0,78,
  // cố ý chói để một cái đầu tí xíu còn nổi lên giữa rừng tường và mái). Kết quả trên ảnh chụp gần
  // là **một con ma trắng**: 8 trong 9 khối cùng một màu, không đọc ra bộ phận nào.
  //
  // Cái mô hình 2 hộp cũ làm ĐÚNG mà tôi suýt đánh mất: nó có một khối lớn TỐI (màu vai `roof`) và
  // một chấm nhỏ SÁNG (màu `skin`) — và chính khoảng cách đậm nhạt ấy là thứ làm mắt đọc ra người
  // ở cỡ vài điểm ảnh, chứ không phải số lượng bộ phận. Nay giữ nguyên cấu trúc đó và chia ba tầng:
  //   • ĐẦU + TAY = `skin` (sáng nhất) — đầu là dấu hiệu "đây là người", tay là thứ đang vung.
  //   • THÂN = `cloth` (giữa) — khối lớn nhất, phải TỐI hơn đầu để đầu còn nổi.
  //   • CHÂN + BÀN CHÂN = `cloth2` (tối nhất) — nhờ vậy lúc hai chân tách ra, mắt đọc được một chữ
  //     V SẪM ở dưới thân, tức đúng cái tín hiệu "đang bước" mà cả phase này sinh ra để tạo.
  //
  // ══════════════════════════════════════════════════════════════════════════════════════════
  // ⚠️ VÌ SAO TỪ 2026-08-23 KHÔNG CÒN KHỐI NÀO LÀ HỘP (trừ bàn chân và cái cặp)
  // ══════════════════════════════════════════════════════════════════════════════════════════
  // Một khối hộp chỉ cho mắt **BA mảng sáng** (đỉnh, một mặt hướng nắng, một mặt khuất), và ba
  // mảng phẳng thì đọc ra là một tấm bìa gấp, không đọc ra là một cái khối. Một lăng trụ 8 mặt cho
  // **TÁM mảng** chuyển dần — đó chính là thứ mắt gọi là "tròn", và nó tốn 28 tam giác thay vì 12.
  // Với ngân sách 319 tam giác mỗi người thì đó là một món hời không có lý do gì để từ chối.
  //
  // Chọn khuôn nào cho khối nào KHÔNG phải chuyện thẩm mỹ tuỳ hứng, mà là câu hỏi *"ngoài đời bộ
  // phận này thon về phía nào?"*:
  //   • TAY và CHÂN thon xuống dưới (đùi to hơn bắp chân, bắp tay to hơn cổ tay) ⇒ `limb`.
  //   • THÂN cũng `limb` — vai rộng hơn eo. Đây là khối LỚN NHẤT trong bộ, nên nó là chỗ phép đổi
  //     khuôn ăn tiền nhất: một cái thân hình hộp là lý do chính khiến cả bộ đọc ra là "chồng gạch".
  //   • ĐẦU là `dome` — sọ tròn, hơi bẹt ở đỉnh, thon ở cằm. Ba vòng chứ không phải hai, vì đầu là
  //     thứ mắt soi kỹ nhất và cũng là thứ quyết định "người hay gạch".
  //   • BÀN CHÂN giữ `box`, CÓ CHỦ Ý: bàn chân thật thì phẳng ở đế, vuông ở gót, và ở cỡ 2 điểm
  //     ảnh thì 8 mặt không đọc ra được gì mà vẫn tính tiền. Bỏ hộp đi ở mọi chỗ "cho nhất quán"
  //     là đổi một sự đơn điệu này lấy một sự đơn điệu khác.
  //
  // ⚠️ VÀ BÀN CHÂN LÀ KHỐI MỚI, KHÔNG PHẢI MỘT CHI TIẾT TRANG TRÍ. Trước bản này cái chân kết thúc
  // đột ngột ở mặt đất bằng một mặt cắt vuông góc — đứng yên thì không sao, nhưng lúc chân nghiêng
  // theo pha bước thì mặt cắt ấy ngửa lên và bắt nắng, tạo một chấm sáng lơ lửng ngay chỗ đáng lẽ
  // là bàn chân. Một khối bẹt nằm ngang vừa che mặt cắt ấy, vừa cho hình bóng một cái mấu nhô về
  // phía trước, tức thêm một dấu hiệu "đang bước" mà không tốn thêm khuôn nào (nó dùng lại `box`).
  const parts = [
    piece('legL', 'cloth2', 'limb', 'hipL', [d.limbW, d.legLen, d.limbW], [0, -d.legLen * 0.5, 0]),
    piece('legR', 'cloth2', 'limb', 'hipR', [d.limbW, d.legLen, d.limbW], [0, -d.legLen * 0.5, 0]),
    piece('footL', 'cloth2', 'box', 'hipL',
      [d.limbW * 1.7, d.limbW * 0.62, d.limbW * 1.0],
      [d.limbW * 0.42, -d.legLen + d.limbW * 0.31, 0]),
    piece('footR', 'cloth2', 'box', 'hipR',
      [d.limbW * 1.7, d.limbW * 0.62, d.limbW * 1.0],
      [d.limbW * 0.42, -d.legLen + d.limbW * 0.31, 0]),
    piece('torso', 'cloth', 'limb', 'torso', [d.torsoD, d.torsoH, d.torsoW], [0, d.torsoH * 0.5, 0]),
    piece('head', 'skin', 'dome', 'head', [d.headW, d.headH, d.headW], [0, d.headH * 0.5, 0]),
    piece('armL', 'skin', 'limb', 'shoulderL',
      [d.limbW * 0.9, d.armLen, d.limbW * 0.9], [0, -d.armLen * 0.5, 0]),
    piece('armR', 'skin', 'limb', 'shoulderR',
      [d.limbW * 0.9, d.armLen, d.limbW * 0.9], [0, -d.armLen * 0.5, 0]),
  ];

  const garment = garmentPiece(style.garment, d);
  if (garment) parts.push(garment);
  // ⚠️ ĐỘI ĐẦU TRẢ VỀ MỘT MẢNG, không phải một khối — vì một cái mũ ngoài đời có thể là một vật
  // (nón lá, mũ trụ) mà cũng có thể là nhiều vật chồng lên nhau. Trả về mảng ngay từ đầu thì
  // ngày nào cần hai lớp sẽ không phải sửa chữ ký hàm — và quan trọng hơn, nó buộc chỗ gọi phải
  // viết vòng lặp, tức không âm thầm chỉ lấy khối đầu tiên.
  for (const hg of headgearPieces(style.headgear, d, style.headMaterial)) parts.push(hg);
  const carry = carryPiece(style.carry, d);
  if (carry) parts.push(carry);

  return {
    style,
    dims: d,
    parts,
    /**
     * Khớp vai nào đang BẬN cầm đồ (hoặc `null`). ⚠️ SUY TỪ CHÍNH DANH SÁCH HỘP, không khai thêm
     * một trường song song — nếu khai riêng thì ngày nào có người đổi `carryPiece` sang treo vào
     * vai kia, hai bên sẽ lệch và không có gì đỏ lên.
     */
    carryArm: carry && carry.joint.startsWith('shoulder') ? carry.joint : null,
  };
}

/**
 * MÔ HÌNH 2 HỘP CŨ — giữ lại NGUYÊN VẸN, và đây không phải hoài niệm.
 * Hai người dùng, cả hai đều thật:
 *   1. `lowDetail` (máy yếu) quay về đúng mô hình này.
 *   2. **ĐỐI CHỨNG của bài test hình bóng.** Một phép đo nói "pha bước làm đổi bề ngang hình
 *      bóng" thì phải chứng minh được nó ra 0 trên một mô hình KHÔNG có chân. Không có đối chứng
 *      ấy thì con số đo được có thể chỉ là nhiễu, và dự án này đã bị chính chuyện đó cắn ở
 *      Phase 8D (cơ chế lùm cây "hoạt động" trên ảnh, đo ra là chưa bao giờ làm gì cả).
 */
export function buildHumanBodyLowDetail(era) {
  const style = getHumanStyle(era);
  const d = humanDims(style);
  const bodyH = d.height - d.headH;
  return {
    style,
    dims: d,
    parts: [
      // ⚠️ HAI KHỐI NÀY PHẢI GIỮ NGUYÊN KHUÔN `box`, KHÔNG ĐƯỢC "NÂNG CẤP" CHO ĐẸP. Vai trò thứ
      // hai của mô hình này là ĐỐI CHỨNG: nó phải là một vật KHÔNG có khớp nào và KHÔNG có chi
      // tiết nào, để mọi phép đo về dáng đi hay về độ "tròn" chứng minh được rằng nó ra 0 ở đây.
      piece('body', 'cloth', 'box', 'torso', [0.085, bodyH, 0.085], [0, bodyH * 0.5 - d.legLen, 0]),
      piece('head', 'skin', 'box', 'torso',
        [0.062, d.headH, 0.062], [0, bodyH + d.headH * 0.5 - d.legLen, 0]),
    ],
  };
}

/**
 * Tổng tam giác của MỘT cư dân ở kỷ này.
 *
 * ⚠️ ĐẾM TỪ CHÍNH DANH SÁCH KHỐI ĐÃ DỰNG, TUYỆT ĐỐI KHÔNG DỰ ĐOÁN BẰNG MỘT CÔNG THỨC RIÊNG. Đây
 * là bài học Performance Gate 2026-08-17 viết lại lần thứ hai: `sceneGraph.js` từng dự đoán số
 * tam giác bằng `residents × 24` và lệch **56%** so với thứ máy thật sự vẽ, vì công thức ấy chỉ
 * được so với chính nó. Ở đây mỗi kỷ dùng một bộ khuôn khác nhau (220…324 tam giác, chênh 1,47
 * lần) nên một hằng số nhân sẽ sai ngay từ ngày đầu chứ không cần đợi phase sau.
 */
export function humanBodyTriangles(era) {
  const { parts } = buildHumanBody(era);
  let tong = 0;
  for (const part of parts) tong += shapeTriangles(part.shape);
  return tong;
}

/**
 * Những khuôn mà cơ thể kỷ này dùng tới, theo THỨ TỰ XUẤT HIỆN.
 *
 * ⚠️ ĐÂY LÀ MỘT ĐẠI LƯỢNG NGÂN SÁCH, KHÔNG PHẢI MỘT TIỆN ÍCH. `sceneGraph.js` dựng MỘT
 * `InstancedMesh` cho MỖI khuôn (một `InstancedMesh` chỉ mang được một hình học), nên **số khuôn
 * chính là số lệnh vẽ mà cộng đồng cư dân tiêu**. Trước bản này cả cơ thể là một khuôn duy nhất
 * nên chi phí ấy vô hình và không ai phải nghĩ tới; nay nó là 3…6 tuỳ kỷ, và `drawCallBudget.test.js`
 * đọc thẳng hàm này thay vì chép lại một con số — chép là cách một bảng ngân sách trôi khỏi sự thật
 * trong im lặng (`TECH_DEBT #43`).
 *
 * ⚠️ THỨ TỰ PHẢI ỔN ĐỊNH giữa hai lần gọi, vì `sceneGraph.js` dùng nó để chia ô trong từng lưới.
 * Nó ổn định theo cấu tạo: `buildHumanBody` trả về danh sách khối theo một thứ tự cố định.
 */
export function humanShapesUsed(era) {
  const { parts } = buildHumanBody(era);
  const dung = [];
  for (const part of parts) if (!dung.includes(part.shape)) dung.push(part.shape);
  return dung;
}
