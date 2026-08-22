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
 * ⚠️ NGÂN SÁCH: 11 HỘP MỖI NGƯỜI, VÀ CON SỐ ĐÓ ĐƯỢC ĐO CHỨ KHÔNG ĐOÁN
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Trần đã thoả thuận: tam giác cư dân không vượt 6% tổng cảnh. Đo bằng `stats.geometry` (ba con
 * số đã tách thành phố/nền/tổng, xem `measureSceneGeometry`): kỷ 1 có 19.434 tam giác thành phố +
 * 44.126 nền = **63.560**, nên 6% = **3.814**. Chia cho `MAX_RESIDENTS` = 28 người ra **136 tam
 * giác mỗi người**, tức **11 hộp** (mỗi hộp 12 tam giác). Kỷ 1 hiện dùng 9 hộp = 108 tam giác
 * mỗi người = 3.024 tổng = **4,8% cảnh**.
 * ⚠️ Kỷ 1 là ca XẤU NHẤT trong 15 kỷ (ít tam giác thành phố nhất ⇒ mẫu số nhỏ nhất ⇒ tỉ lệ cao
 * nhất). Chấm ngân sách ở kỷ 7 hay kỷ 13 sẽ ra một con số dễ chịu hơn và SAI — đúng cái bẫy
 * "một hằng số nằm trong cả tử lẫn mẫu" của Performance Gate vòng 2.
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG `parts.js`. Nhà máy hình khối của công trình chỉ xoay quanh TRỤC ĐỨNG
 * (`ry`) — nó không nghiêng được, và một cái chân thì bắt buộc phải nghiêng. Thêm trục nghiêng vào
 * `parts.js` là chạm vào nền móng của cả 75 công trình cộng phép đếm tam giác cộng phép tính cạnh
 * vát, để đổi lấy một thứ chỉ cư dân cần. Ở đây đi đường khác: file này chỉ khai HỘP + KHỚP, còn
 * phép xoay nghiêng nằm ở tầng ma trận của three trong `sceneGraph.js`, nơi nó vốn đã miễn phí.
 */

import { HUMAN_BASE_HEIGHT, getHumanStyle } from './humanStyle';

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

/** Một hộp gắn vào một khớp. `rest` là tâm hộp SO VỚI gốc khớp, trước khi khớp xoay. */
function box(id, role, joint, size, rest) {
  return {
    id,
    role,
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
 */
function garmentBox(kind, d) {
  switch (kind) {
    case 'none':
      return null;
    // Tấm da thú vắt qua MỘT vai: lệch hẳn sang một bên, phủ chéo xuống hông đối diện. Đây là
    // khối DUY NHẤT trong bộ phá thế đối xứng trái-phải, và chính sự bất đối xứng ấy là thứ đọc
    // ra được ở cỡ nhỏ — mắt bắt bất đối xứng nhạy hơn bắt chi tiết.
    case 'pelt':
      return box('garment', 'cloth', 'torso',
        [d.torsoD * 1.16, d.torsoH * 0.86, d.torsoW * 0.72],
        [d.torsoD * 0.06, d.torsoH * 0.52, d.torsoW * 0.30]);
    // Vải quấn ngang hông: phình ở GIỮA thân, vai để trần.
    case 'wrap':
      return box('garment', 'cloth', 'torso',
        [d.torsoD * 1.18, d.torsoH * 0.46, d.torsoW * 1.14],
        [0, d.torsoH * 0.24, 0]);
    // Áo chùng thẳng: cả thân thành một khối, gấu buông xuống quá hông.
    case 'tunic':
      return box('garment', 'cloth', 'torso',
        [d.torsoD * 1.12, d.torsoH * 1.02, d.torsoW * 1.10],
        [0, d.torsoH * 0.40, 0]);
    // Áo choàng chấm đất: gấu buông XUỐNG DƯỚI gốc khớp thân, nuốt luôn phần trên hai chân.
    case 'robe':
      return box('garment', 'cloth', 'torso',
        [d.torsoD * 1.20, d.torsoH + d.legLen * 0.72, d.torsoW * 1.22],
        [0, (d.torsoH - d.legLen * 0.72) * 0.5, 0]);
    // Áo khoác có vai: phình ở TRÊN, thóp ở dưới.
    case 'coat':
      return box('garment', 'cloth', 'torso',
        [d.torsoD * 1.22, d.torsoH * 0.82, d.torsoW * 1.26],
        [0, d.torsoH * 0.62, 0]);
    // Âu phục may đo: bó sát nhất bộ — đường bao gần như bằng thân.
    case 'suit':
      return box('garment', 'cloth', 'torso',
        [d.torsoD * 1.06, d.torsoH * 1.00, d.torsoW * 1.04],
        [0, d.torsoH * 0.48, 0]);
    default:
      return null;
  }
}

/**
 * ĐỘI ĐẦU. Gắn vào khớp `head` nên nó nghiêng theo đầu.
 *
 * ⚠️ VAI MÀU CỦA NÓ KHÔNG SUY TỪ `kind` MÀ TỪ `material` — hai cái mũ CÙNG HÌNH có thể khác
 * VẬT LIỆU (mũ rơm Firenze và mũ phớt New York đều là `brim`), và vật liệu mới là thứ quyết
 * định nhạt hay sẫm. Suy từ `kind` là dựng lại đúng cái bẫy vừa gỡ.
 */
function headgearBox(kind, d, material) {
  // Sợi mộc thì NHẠT hơn áo; vải nhuộm thì cùng lò với quần nên SẪM hơn áo.
  const vaiVai = material === 'natural' ? 'straw' : 'cloth2';
  switch (kind) {
    case 'none':
      return null;
    case 'bun':
      return box('headgear', 'hair', 'head',
        [d.headW * 0.46, d.headH * 0.44, d.headW * 0.46],
        [-d.headW * 0.10, d.headH * 1.08, 0]);
    case 'headcloth':
      return box('headgear', vaiVai, 'head',
        [d.headW * 1.16, d.headH * 0.92, d.headW * 1.20],
        [-d.headW * 0.06, d.headH * 0.66, 0]);
    case 'brim':
      return box('headgear', vaiVai, 'head',
        [d.headW * 1.9, d.headH * 0.16, d.headW * 1.9],
        [0, d.headH * 1.02, 0]);
    case 'helm':
      return box('headgear', 'gear', 'head',
        [d.headW * 1.06, d.headH * 0.78, d.headW * 1.06],
        [0, d.headH * 0.86, 0]);
    case 'cap':
      return box('headgear', vaiVai, 'head',
        [d.headW * 1.22, d.headH * 0.34, d.headW * 1.08],
        [d.headW * 0.14, d.headH * 0.92, 0]);
    case 'conical':
      return box('headgear', vaiVai, 'head',
        [d.headW * 2.2, d.headH * 0.34, d.headW * 2.2],
        [0, d.headH * 1.04, 0]);
    default:
      return null;
  }
}

/**
 * ĐỒ MANG THEO. Gắn vào khớp `shoulderR` (trừ `pot` đội đầu) nên nó ĐU THEO TAY khi đi — thứ đó
 * mới đọc ra là "đang cầm", chứ một khối đứng yên cạnh người thì đọc ra là "một cái cột".
 */
function carryBox(kind, d) {
  switch (kind) {
    case 'none':
      return null;
    // Vệt DỌC cao quá đầu. Trục dễ đọc nhất ở cỡ nhỏ vì nó thò hẳn ra ngoài đường bao người, và
    // vì mắt bắt đường thẳng đứng đơn độc rất nhanh.
    case 'spear':
      return box('carry', 'gear', 'shoulderR',
        [d.limbW * 0.42, d.height * 1.24, d.limbW * 0.42],
        [d.limbW * 0.9, -d.armLen * 0.36, -d.limbW * 0.5]);
    case 'bundle':
      return box('carry', 'gear', 'shoulderR',
        [d.torsoD * 0.9, d.torsoH * 0.40, d.torsoW * 1.5],
        [-d.torsoD * 0.3, d.armLen * 0.16, -d.torsoW * 0.25]);
    case 'pot':
      return box('carry', 'gear', 'head',
        [d.headW * 1.0, d.headH * 0.8, d.headW * 1.0],
        [0, d.headH * 1.35, 0]);
    case 'tool':
      return box('carry', 'gear', 'shoulderR',
        [d.limbW * 0.5, d.armLen * 0.62, d.limbW * 0.5],
        [d.limbW * 1.1, -d.armLen * 0.78, -d.limbW * 0.4]);
    case 'case':
      return box('carry', 'gear', 'shoulderR',
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

  // ⚠️ CHÂN TRƯỚC, và không phải để cho gọn: chân là hộp DUY NHẤT bắt buộc phải có ở mọi kỷ để
  // phép đo "hình bóng đổi theo pha bước" còn ý nghĩa. Đặt chúng ở đầu danh sách thì một bài test
  // muốn cắt riêng chân ra chỉ cần lấy hai phần tử đầu, khỏi phải lọc theo `id` — mà lọc theo tên
  // vai/`role` chính là cái bẫy đã cắn ở Phase 8A ("hỏi theo `role` thì ba nguyên mẫu tàng hình").
  // ⚠️ VAI MÀU PHẢI DỰNG RA BA TẦNG ĐẬM NHẠT, KHÔNG ĐƯỢC ĐỂ CẢ NGƯỜI MỘT MÀU — và bản đầu đã sai
  // đúng như vậy: mọi bộ phận đều mang vai `skin`, mà `skin` là màu SÁNG NHẤT bảng (độ đậm 0,78,
  // cố ý chói để một cái đầu tí xíu còn nổi lên giữa rừng tường và mái). Kết quả trên ảnh chụp gần
  // là **một con ma trắng**: 8 trong 9 hộp cùng một màu, không đọc ra bộ phận nào.
  //
  // Cái mô hình 2 hộp cũ làm ĐÚNG mà tôi suýt đánh mất: nó có một khối lớn TỐI (màu vai `roof`) và
  // một chấm nhỏ SÁNG (màu `skin`) — và chính khoảng cách đậm nhạt ấy là thứ làm mắt đọc ra người
  // ở cỡ vài điểm ảnh, chứ không phải số lượng bộ phận. Nay giữ nguyên cấu trúc đó và chia ba tầng:
  //   • ĐẦU + TAY = `skin` (sáng nhất) — đầu là dấu hiệu "đây là người", tay là thứ đang vung.
  //   • THÂN = `cloth` (giữa) — khối lớn nhất, phải TỐI hơn đầu để đầu còn nổi.
  //   • CHÂN = `cloth2` (tối nhất) — nhờ vậy lúc hai chân tách ra, mắt đọc được một chữ V SẪM ở
  //     dưới thân, tức đúng cái tín hiệu "đang bước" mà cả phase này sinh ra để tạo.
  const parts = [
    box('legL', 'cloth2', 'hipL', [d.limbW, d.legLen, d.limbW], [0, -d.legLen * 0.5, 0]),
    box('legR', 'cloth2', 'hipR', [d.limbW, d.legLen, d.limbW], [0, -d.legLen * 0.5, 0]),
    box('torso', 'cloth', 'torso', [d.torsoD, d.torsoH, d.torsoW], [0, d.torsoH * 0.5, 0]),
    box('head', 'skin', 'head', [d.headW, d.headH, d.headW], [0, d.headH * 0.5, 0]),
    box('armL', 'skin', 'shoulderL', [d.limbW * 0.9, d.armLen, d.limbW * 0.9], [0, -d.armLen * 0.5, 0]),
    box('armR', 'skin', 'shoulderR', [d.limbW * 0.9, d.armLen, d.limbW * 0.9], [0, -d.armLen * 0.5, 0]),
  ];

  const garment = garmentBox(style.garment, d);
  if (garment) parts.push(garment);
  const headgear = headgearBox(style.headgear, d, style.headMaterial);
  if (headgear) parts.push(headgear);
  const carry = carryBox(style.carry, d);
  if (carry) parts.push(carry);

  return {
    style,
    dims: d,
    parts,
    /**
     * Khớp vai nào đang BẬN cầm đồ (hoặc `null`). ⚠️ SUY TỪ CHÍNH DANH SÁCH HỘP, không khai thêm
     * một trường song song — nếu khai riêng thì ngày nào có người đổi `carryBox` sang treo vào
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
      box('body', 'cloth', 'torso', [0.085, bodyH, 0.085], [0, bodyH * 0.5 - d.legLen, 0]),
      box('head', 'skin', 'torso', [0.062, d.headH, 0.062], [0, bodyH + d.headH * 0.5 - d.legLen, 0]),
    ],
  };
}
