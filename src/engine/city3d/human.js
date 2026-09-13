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
import { isValidHumanShape, scalpFit, shapeEndRadius, shapeMaxRadius, shapeTriangles } from './humanShape';

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
 * Vai màu — **SÁU vai**, và con số ấy là một quyết định về KHẢ ĐỌC chứ không phải về hiệu năng.
 *
 * ⚠️ Câu cũ ở đây ghi *"năm vai, không hơn … vai thứ sáu không đọc ra được nữa"*, rồi ADR-054 thêm
 * `straw` ngay bên dưới mà không sửa câu ấy — một chú thích tự mâu thuẫn với chính dòng mã cách nó
 * ba dòng. Sự thật đo được: vai thứ sáu ĐỌC RA ĐƯỢC (nón lá kỷ 6 đi từ độ đậm 0,170 lên 0,879,
 * cách vai `cloth2` xa gấp nhiều lần ngưỡng mắt); thứ giới hạn số vai là *"mắt còn phân biệt được
 * bao nhiêu sắc trên một hình 14 điểm ảnh"*, và ngưỡng ấy phải được ĐO chứ không được đoán.
 *
 * ⚠️ SỐ VAI MÀU KHÔNG PHẢI MỘT NGÂN SÁCH: màu vào qua `setColorAt` của từng `InstancedMesh`, nên
 * thêm một vai tốn **0 lệnh vẽ và 0 tam giác**. (Thứ TỐN lệnh vẽ là số KHUÔN — xem
 * `humanShapesUsed`.) Đừng tiết kiệm ở chỗ không tính tiền.
 */
// Round 49 (ADR-089, debt #79): `steel` split out of `gear` — a helmet and a tool head are metal,
// a spear shaft, a bundle and a leather case are not. One role per material the eye can name.
// Round 56 (Phần A, Việc 2): `eyeWhite` — lòng trắng mắt. Vai thứ tám, và nó KHÔNG tốn lệnh vẽ
// nào: cư dân đi qua một `InstancedMesh` mỗi KHUÔN, còn vai màu là `setColorAt` theo từng thể
// hiện. Chú thích round 52 nói ngược (*"thêm một vai là thêm một họ vật liệu cho cả 15 kỷ"*) —
// câu ấy đúng với vật liệu CÔNG TRÌNH, không đúng với cư dân. Xem `sceneGraph.js` chỗ `roleColor`.
export const HUMAN_ROLES = ['skin', 'cloth', 'cloth2', 'straw', 'hair', 'gear', 'steel', 'eyeWhite'];

/**
 * VAI MÀU → MÀU THẬT. Một bảng, ở tầng thuần, và đây là chỗ sửa gốc của một lỗi ba tuần tuổi.
 *
 * ⚠️ VÌ SAO BẢNG NÀY PHẢI Ở ĐÂY CHỨ KHÔNG Ở `sceneGraph.js`. Round 49 (ADR-089, debt #79) tách vai
 * `steel` ra khỏi `gear` — mũ trụ và đầu rìu là KIM LOẠI, cán giáo và bao da thì không — và làm
 * đủ cả: `HUMAN_ROLES` nhận thêm một tên, `palette3d.js` nhận `steel: paint(212, 0.08, 0.36, 0.27)`
 * (lam-xám, tách khỏi nâu của `gear` bằng SẮC chứ không bằng độ sáng), `palette3d.test.js` nhận cả
 * một danh sách ngoại lệ [12, 15] cho nó.
 * **Chỉ có bảng `roleColor` trong `sceneGraph.js` là không ai sửa.** Nó khai sáu vai, không có
 * `steel`, và dòng dùng nó kết thúc bằng `?? roleColor.cloth`. ⇒ Từ round 49 tới nay, **mọi cái mũ
 * trụ và mọi đầu công cụ kim loại đều tô đúng màu VẢI của kỷ ấy** — mũ SSh-40 của kỷ 12 xanh y hệt
 * bộ quân phục. Không gì đỏ lên: bảng màu có test riêng và nó xanh, vì nó kiểm BẢNG MÀU chứ không
 * kiểm chỗ TIÊU THỤ bảng màu. Đúng họ `TECH_DEBT #42` — *kiểm con số đã KHAI thay vì con số đã DÙNG*.
 *
 * ⇒ Cái vá gốc không phải thêm một dòng `steel:` vào `sceneGraph.js` (thế thì vai thứ tám lại rơi
 * đúng cái hố ấy), mà là **đưa bảng về một chỗ và bắt nó khai đủ `HUMAN_ROLES`**, có bài test đo.
 * Không còn `??` nào ở chỗ tiêu thụ, nên một vai chưa khai màu là một lỗi NÉM chứ không phải một
 * lỗi tô nhầm.
 */
export function humanRoleColors(palette) {
  const r = palette?.roles ?? {};
  const nen = palette?.wall ?? 0x888888;
  const vai = palette?.roof ?? nen;
  return {
    skin: r.skin ?? nen,
    cloth: r.cloth ?? vai,
    cloth2: r.cloth2 ?? r.trim ?? vai,
    // Sợi mộc (nón lá, mũ rơm, khăn lanh) — xem `humanStyle.js` mục `HEAD_MATERIALS`.
    straw: r.straw ?? r.cloth2 ?? vai,
    hair: r.hair ?? r.dark ?? nen,
    gear: r.gear ?? r.wood ?? nen,
    // ⚠️ Lùi về `gear` chứ không về `cloth`: kim loại và gỗ đều là ĐỒ NGHỀ, còn vải thì không.
    // Rơi nhầm về `cloth` chính là khuyết tật đã mô tả ở trên.
    steel: r.steel ?? r.gear ?? nen,
    // Lòng trắng mắt — lùi về `skin` chứ không về tường: hỏng màu thì được một khuôn mặt không
    // có mắt, chứ không được hai đốm màu tường giữa mặt.
    eyeWhite: r.eyeWhite ?? r.skin ?? nen,
  };
}

/**
 * Tên các khớp. `sceneGraph.js` và `humanPose.js` cùng đọc danh sách này — một chỗ khai duy nhất.
 *
 * ⚠️ TỪ ADR-057 CÓ **KHỚP GỐI VÀ KHỚP KHUỶU THẬT**, cộng một khớp `pelvis` làm gốc cho cả nửa dưới.
 * Trước đó chân là MỘT khối cứng treo vào hông và "đầu gối" chỉ là một phép rút ngắn khối ấy.
 * Vị trí của `kneeL/R` và `elbowL/R` KHÔNG khai trong bảng nào — chúng được `humanPose.js` TÍNH RA
 * từ chỗ đặt bàn chân / bàn tay, đúng tinh thần động học ngược. Khai cứng chúng ở đây là dựng lại
 * một luật thứ hai cho cùng một chuyện.
 */
export const HUMAN_JOINTS = [
  'pelvis', 'torso', 'head',
  'shoulderL', 'shoulderR', 'elbowL', 'elbowR',
  'hipL', 'hipR', 'kneeL', 'kneeR',
];

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
  // ⚠️ ROUND 50 (ADR-090) — `TECH_DEBT_3D #81` FIXED AT THE ROOT, ON ĐÀM'S EXPLICIT ORDER: *"sửa gốc
  // của #81, không sửa triệu chứng: cái ĐẦU to gấp 1,54 lần đời thật, nên mọi thứ đội lên nó đều sai
  // theo. Sửa cái đầu thì cái mũ tự đúng."* Round 49 had shrunk the HAT (1,9 → 1,7 `headW`) and hit a
  // floor at 1,62, because the crown must still fit the skull — which is the symptom talking.
  // 0,20 → 0,16 of body height (real ≈ 0,13, so 1,23× instead of 1,54×). Every hat, every helmet and
  // the conical nón lá are expressed in `headW`, so they all come right without touching one of them:
  // the brim goes from 1,36× the shoulders to ≈ 1,09×, against 0,67× in life.
  // Why the enlargement existed at all: at 14 px a true-scale head is 1,8 px. That reason weakened
  // twice — round 47 doubled the resident's on-screen size, and round 50 lets Đàm WALK UP to them.
  /*
    ══════════════════════════════════════════════════════════════════════════════════════════
    ⚠️ ROUND 54 (ADR-094), VIỆC 4 — ĐẢO NGƯỢC QUYẾT ĐỊNH CỦA VÒNG 50, CÓ CHỦ Ý VÀ CÓ LỆNH
    ══════════════════════════════════════════════════════════════════════════════════════════
    Vòng 50 hạ cái đầu 0,20 → 0,16 để **đúng như đời thật** (~0,13), và lý lẽ ấy đúng với mục tiêu
    LÚC ĐÓ. Vòng 54 đổi mục tiêu: Đàm chốt phong cách **Pixar**, nguyên văn:

      *"nhân vật hoạt hình không đi theo đời thật — chúng đi theo SỨC HẤP DẪN: đầu to hơn tỉ lệ
      thật, thân ngắn lại, tay chân mập và thuôn, bàn tay bàn chân to. Tôi muốn Pixar ⇒ chọn hấp
      dẫn, bỏ chính xác. Khoảng 4–6 đầu chiều cao thay vì 7,5. Ghi rõ vào ADR rằng đây là đảo
      quyết định vòng 50 CÓ LÝ DO, không phải quên."*

    ⇒ 0,16 → **0,22**, tức **4,5 đầu chiều cao** thay vì 6,25. Nằm giữa dải Đàm đặt (4–6), nghiêng
    về phía người lớn hoạt hình chứ không phải trẻ con (3 đầu).

    ⚠️ VÀ ĐÂY KHÔNG PHẢI "QUAY VỀ SỐ CŨ": 0,22 chưa từng tồn tại. Vòng 50 hạ từ 0,20; nay lên 0,22,
    tức CAO HƠN cả mốc trước vòng 50 — vì mục tiêu lần này không phải khả đọc ở 14 điểm ảnh mà là
    một tỉ lệ hoạt hình ở tầm mắt. Hai lần chỉnh, hai lý do khác nhau, và cả hai đều được ghi lại.
    ⚠️ Hệ quả dây chuyền đã trả tiền rồi chứ không phải chờ vỡ: mọi thứ đội lên đầu khai theo
    `headW` (ADR-090 sửa gốc `#81` đúng để chuyện này thành tự động), nên nón lá, mũ trụ, mũ vành
    tự lớn theo mà không phải đụng tới một dòng nào trong `headgearPieces`.
  */
  const headH = H * 0.22;
  const torsoH = H - legLen - headH;
  const b = style.build;
  const armLen = (H - legLen - headH) + legLen * 0.22;
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
    // ⚠️ BỀ NGANG ĐẦU ĐI THEO CHIỀU CAO ĐẦU, LUÔN LUÔN — đây là gốc mà ADR-090 sửa cho `#81`,
    // và nó là lý do vòng 54 nâng được cái đầu mà không phải đụng một cái mũ nào.
    // `headW` là bề DÀI trước–sau (trục x). Xem `headZ` ngay dưới.
    headW: H * 0.22,
    /**
     * BỀ RỘNG HAI BÊN (trục z) CỦA CÁI ĐẦU — round 58, Việc 3, đặc điểm 1: *"dẹt hai bên"*.
     *
     * ⚠️ TRƯỚC VÒNG NÀY CÁI ĐẦU LÀ MỘT QUẢ CẦU, VÀ ĐÓ LÀ MỘT SỐ ĐO ĐƯỢC, KHÔNG PHẢI MỘT CẢM GIÁC:
     * tỉ lệ z/x đo được đúng **1,000**, còn sọ người thật là **0,78** (bề rộng hai bên chia bề dài
     * trước–sau; đây là số nhân trắc học phổ thông, cephalic index ~78). Một quả cầu thì nhìn từ
     * hướng nào cũng hệt nhau, nên nó KHÔNG CÓ HƯỚNG — và một cái đầu không có hướng là một phần
     * lớn của chuyện *"nó đọc ra một con ma-nơ-canh"* (Đàm, vòng 58).
     * ⇒ 0,80: sát số người thật, và là một PHÉP NHÂN với `headW` chứ không phải một con số rời, nên
     * mọi lần chỉnh `headW` về sau vẫn giữ đúng tỉ lệ (cùng lý lẽ với `shoulderZ` ở dưới).
     * ⚠️ MŨ THÌ VẪN TRÒN (khai theo `headW`): mũ thật đúng là tròn hơn sọ, và một cái vành mũ hơi
     * dư ra hai bên là cách người ta nhận ra đó là cái mũ. Chỉ `scalp` — mũ TÓC, dính vào da đầu —
     * mới buộc phải bóp theo `headZ`, nếu không chân tóc sẽ nằm ngoài sọ ở hai bên.
     */
    headZ: H * 0.22 * 0.80,
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
    armLen,
    /**
     * ⚠️ CHIỀU DÀI TỪNG ĐOẠN CHI — MỚI TỪ ADR-057, và chúng phải cộng lại ĐÚNG BẰNG chi trọn vẹn.
     * `humanPose.js` giải bài động học ngược bằng đúng hai con số này (luật cô-sin trên tam giác
     * đùi–cẳng–đường-nối-hông-tới-bàn-chân), nên nếu tổng của chúng lệch khỏi `legLen` thì chiều
     * cao hông tính ở một chỗ sẽ không khớp tầm với của chân tính ở chỗ kia, và bàn chân sẽ hoặc
     * lún xuống đất hoặc không chạm tới — im lặng, vì hình học vẫn hợp lệ.
     *
     * Tỉ lệ 0,52 / 0,48: người thật có xương đùi hơi dài hơn xương chày, và ở đây `legLen` đo từ
     * hông xuống MẶT ĐẤT (đã gộp cả bàn chân) nên phần dưới lại càng không được dài hơn.
     */
    thighLen: legLen * 0.52,
    shinLen: legLen * 0.48,
    /**
     * Cánh tay trên / cẳng tay / bàn tay. Người thật: cánh tay trên ≈ cẳng tay + bàn tay, và bàn
     * tay chiếm khoảng một phần bảy cả cánh tay. Ba số này cộng lại đúng bằng `armLen`.
     */
    upperArmLen: armLen * 0.47,
    forearmLen: armLen * 0.39,
    handLen: armLen * 0.14,
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
/**
 * @param {string} [continues] id của khối mà khối này **nối dài** — xem `humanSeams.js`.
 *   Khai nó là tuyên bố *"đây không phải một vật riêng, nó là phần tiếp theo của cái kia"*, và cái
 *   gác sẽ đòi hai bên CÙNG một vai màu. Bỏ trống nghĩa là "một vật riêng, được phép có mép".
 */
function piece(id, role, shape, joint, size, rest, continues = null) {
  if (!isValidHumanShape(shape)) throw new Error(`human.js: khối "${id}" khai khuôn lạ "${shape}"`);
  const out = {
    id,
    role,
    shape,
    joint,
    w: size[0],
    h: size[1],
    d: size[2],
    rest: { x: rest[0], y: rest[1], z: rest[2] },
  };
  if (continues) out.continues = continues;
  return out;
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
    /*
      Vải quấn ngang hông: khố Ai Cập, xà rông Lưỡng Hà, váy quấn Ấn.
      ⚠️ ROUND 54 (ADR-094), VIỆC 6: `prism` → `flare`. Chú thích cũ viết *"quấn ⇒ `prism`"*, và
      câu ấy đúng về CÁCH MẶC mà sai về HÌNH. Một tấm vải quấn quanh hông rồi buông xuống thì
      **rộng ở gấu hơn ở thắt lưng** — không có ngoại lệ, đó là hình học của một tấm vải phẳng
      quấn quanh một cái nón cụt. `prism` (phình nhẹ ở giữa, thu lại ở hai đầu) đọc ra là một cái
      thùng đai, không phải một cái váy. `flare` vừa đúng chiều ấy, vừa mang theo nếp gấp và gấu
      cong của Việc 6 — và nó **không thêm một khuôn nào**: kỷ nào mặc `wrap` cũng đã vẽ `flare`
      cho tóc xoã hoặc cho tay áo. Không tốn thêm một lệnh vẽ.
    */
    case 'wrap':
      return piece('garment', 'cloth', 'flare', 'torso',
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
    // ⚠️ ÁO CẮT MAY DÙNG KHUÔN `chest`, KHÔNG DÙNG `limb` (đổi 2026-08-23). Vải cắt may thì bám
    // theo đúng cái thân bên dưới: nở ở vai, thắt ở eo, nở lại ở hông. `limb` nay là hồ sơ của một
    // cái CHÂN thật (thắt ở đầu gối, nhỏ hẳn ở cổ chân) nên mặc nó lên người sẽ ra một cái áo bó
    // chặt quanh bụng rồi loe ra ở ngực — ngược hẳn hình cái áo khoác.
    case 'coat':
      return piece('garment', 'cloth', 'chest', 'torso',
        [d.torsoD * 1.22, d.torsoH * 0.82, d.torsoW * 1.26],
        [0, d.torsoH * 0.62, 0]);
    // Âu phục may đo: bó sát nhất bộ — cùng khuôn với áo khoác nhưng đường bao gần bằng thân.
    case 'suit':
      return piece('garment', 'cloth', 'chest', 'torso',
        [d.torsoD * 1.06, d.torsoH * 1.00, d.torsoW * 1.04],
        [0, d.torsoH * 0.48, 0]);
    default:
      return null;
  }
}

/**
 * TAY ÁO VÀ ỐNG QUẦN — ROUND 52 (ADR-092), Việc 8: *"quần áo có KHỐI, không vẽ bằng cách tô màu lên chi"*.
 *
 * ⚠️ BẢN ĐẦU DỰNG THÊM KHỐI, VÀ CÁI CỔNG ĐÃ CHẶN LẠI ĐÚNG — ghi lại để phiên sau đừng dựng lại.
 * Bản ấy đắp MỘT ỐNG VẢI TRÙM RA NGOÀI mỗi cánh tay và mỗi cái chân: 4 khối tay + 4 khối chân.
 * Kỷ 12 lên **26 khối/người** (trần là 18) và **2.856 tam giác** (trước là 1.808) — tức trả 58% hình
 * học để CHE đi những khối mình vừa dựng. Mắt không bao giờ nhìn thấy cái tay bên trong ống vải.
 *
 * ⇒ Hỏi lại đúng câu đã gỡ được cái mũ vành (khuôn `hat`): ***"ngoài đời đây là MẤY vật?"***
 * Một cái tay áo không phải một vật nằm cạnh cánh tay — nó **LÀ cái mà mắt thấy ở chỗ cánh tay**.
 * Nên không thêm khối: **đổi VAI MÀU, ĐỔI BỀ NGANG và ĐỔI KHUÔN của chính khối chi đó**.
 * Kết quả: **0 khối thêm, 0 lệnh vẽ thêm** (`flare` và `limb` kỷ nào cũng đã dùng), mà hai cái que
 * trắng ở tay — đúng lời Đàm tả — biến mất thật.
 *
 * ⚠️ VÌ SAO BỀ NGANG PHẢI ĐỔI CHỨ KHÔNG CHỈ ĐỔI MÀU: vải có BỀ DÀY. Một cánh tay mặc áo dày
 * hơn một cánh tay trần, và đó là thứ duy nhất đường bao đọc được ở cỡ nhỏ. Chỉ đổi vai màu thì
 * đúng là "tô màu lên chi" — cái Đàm cấm thẳng.
 */
const SLEEVE_LOOK = Object.freeze({
  // trần: da, thon như củ — đây là vạch xuất phát, mọi dòng dưới đều so với nó
  bare:  { upRole: 'skin',  upShape: 'limb', upW: 0.90, loRole: 'skin',  loShape: 'calf',  loW: 0.78 },
  // tay ngắn: vải ôm bắp tay, cẳng tay để trần ⇒ có một ĐƯỜNG CẮT giữa vải và da ở khủyu
  short: { upRole: 'cloth', upShape: 'limb', upW: 1.06, loRole: 'skin',  loShape: 'calf',  loW: 0.78 },
  long:  { upRole: 'cloth', upShape: 'limb', upW: 1.06, loRole: 'cloth', loShape: 'calf',  loW: 0.90 },
  // ⚠️ TAY THỤNG DÙNG KHUÔN `flare` CHO CẰNG TAY, VÀ CHIỀU CỦA KHUÔN ẤY ĐÚNG SẴN: `flare` rộng
  // nhất ở ĐÁY (1,00) và hẹp ở ĐỈNH (0,55), mà cẳng tay thì treo vào khớp khuỷu ở ĐỈNH ⇒ hẹp ở
  // khuỷu, xoè xuống cổ tay. Đó chính là cái tay áo giao l什nh Trường An, và bàn tay vẫn thò ra đáy.
  wide:  { upRole: 'cloth', upShape: 'limb', upW: 1.18, loRole: 'cloth', loShape: 'flare', loW: 1.58 },
});

/**
 * ỐNG QUẦN. Cùng lý lẽ với tay áo, và ở nửa dưới còn có một sự thật nữa đáng nói.
 *
 * ⚠️ `wrap` KHÔNG DỰNG THÊM CÁI VÁY NÀO — và đây là chỗ dễ làm sai nhất bảng. Khố Ai Cập,
 * xà rông Lưỡng Hà, tấm da Göbekli Tepe — cả ba ĐÃ LÀ cái khối `garment` treo ở hông rồi
 * (`pelt` / `wrap` / `robe`). Đắp thêm một cái váy nữa là dựng hai lần cùng một vật, và ở chỗ giao
 * nhau thì hai mặt tranh nhau một điểm ảnh. `wrap` ở đây chỉ trả lời *"dưới cái ấy thì hai chân
 * trông như thế nào"* — và câu trả lời là: **da trần, thon hơn**, chứ không phải vải sẫm.
 *
 * ⚠️ `boot` LẬT NGƯỢC MỘT QUAN HỆ GIẢI PHẪU, VÀ ĐÓ CHÍNH LÀ CÁCH MẮT ĐỌC RA "ỦNG". Chân người
 * luôn thon dần xuống cổ chân — không có ngoại lệ. Cho cẳng chân đeo khuôn `limb` (đáy 0,70) thay
 * vì `calf` (đáy 0,44) và rộng hơn cả đùi thì hình ấy không thể là một cái chân được nữa ⇒ mắt
 * buộc phải đọc nó là một cái ống đi ngoài cái chân. **Một cái ủng, không tốn khối nào.**
 */
const LEG_LOOK = Object.freeze({
  // áo chùng chấm đất đã nuốt hết: giữ nguyên vạch xuất phát, không ai nhìn thấy
  none:    { upRole: 'cloth2', upShape: 'limb', upW: 1.00, loRole: 'cloth2', loShape: 'calf', loW: 0.86 },
  wrap:    { upRole: 'skin',   upShape: 'limb', upW: 0.94, loRole: 'skin',   loShape: 'calf', loW: 0.80 },
  trouser: { upRole: 'cloth2', upShape: 'limb', upW: 1.10, loRole: 'cloth2', loShape: 'calf', loW: 0.94 },
  boot:    { upRole: 'cloth2', upShape: 'limb', upW: 1.10, loRole: 'cloth2', loShape: 'limb', loW: 1.16 },
});

/** Tra bảng, rơi về vạch xuất phát nếu tủ đồ khai một kiểu lạ — không bao giờ ném ở tầng thuần. */
export function sleeveLook(kind) { return SLEEVE_LOOK[kind] ?? SLEEVE_LOOK.bare; }
export function legLook(kind) { return LEG_LOOK[kind] ?? LEG_LOOK.none; }

/**
 * TÓC — round 52 (ADR-092) dựng khối đầu tiên; **round 56 (Phần A) cho nó một CHÂN TÓC.**
 * Gắn vào khớp `head` nên cả mái tóc quay theo đầu.
 *
 * ⚠️ TRẢ VỀ MỘT MẢNG, KHÔNG PHẢI MỘT KHỐI — và đây là chỗ sửa gốc của round 56. Trước vòng này
 * hàm trả về ĐÚNG MỘT khối, nên `bun` (búi) và `braid` (bím) dựng ra một cái búi lơ lửng trên một
 * cái **sọ trọc**: mắt đọc ra một người hói đội cái nơ, không đọc ra một búi tóc. Kiểu `crop` thì
 * có mũ tóc nhưng nó chỉ là một `dome` nằm LỌT trong sọ (xem khối chú thích của khuôn `scalp`).
 * ⇒ Nay mọi kiểu tóc trừ `shaved` đều bắt đầu bằng CÙNG một mũ tóc, rồi mới thêm phần đặc trưng.
 * Búi và bím là **thứ mọc ra từ mái tóc**, không phải thứ thay cho mái tóc.
 *
 * ⚠️ `SCALP_LIFT` LÀ MỘT QUAN HỆ, KHÔNG PHẢI MỘT BỀ DÀY. Mái tóc = cái sọ phóng to đúng 7% quanh
 * gốc khớp `head`; `scalpFit` (tầng `humanShape.js`) tính ra ba con số từ chính cái đầu, nên đổi
 * `headW`/`headH` ở `humanDims` thì mái tóc tự đi theo — đúng bài học `#81` của vòng 49, nơi một
 * cái mũ khai bằng hằng số đã không lớn theo cái đầu và thành ra nhỏ hơn cái sọ nó đội lên.
 * 7% của bán kính sọ ≈ 7 mm ở tỉ lệ người thật — đúng cỡ một mái tóc cắt ngắn.
 */
/*
  ⚠️ ROUND 58: 1,07 → 1,10, VÀ LÝ DO KHÔNG PHẢI "CHO CHẮC" — MỘT ĐIỀU KIỆN ĐỦ VỪA MẤT HIỆU LỰC.
  Lời bảo đảm của vòng 56 (xem `scalpFit` ở `humanShape.js`) đứng trên một mệnh đề hình học: *"gốc
  khớp `head` nằm ở đáy cái đầu và đường sinh của `dome` NHÌN TỪ ĐIỂM ẤY LÀ ĐƠN ĐIỆU, nên phóng to
  đều quanh nó chắc chắn nằm ngoài — không phải hy vọng, mà là thứ bài test đo."*
  Khuôn `skull` của vòng 58 có một chỗ **THÓT Ở THÁI DƯƠNG** (vành 0,84 kẹp giữa 0,88 và 1,00) ⇒
  đường sinh thôi đơn điệu, và điều kiện đủ ấy KHÔNG CÒN ĐÚNG. Đo được: ở 1,07 chỗ sát nhất chỉ còn
  hở **2,79%**, dưới sàn 3% mà chính vòng 56 đặt ra.
  ⇒ 1,10 cho 4,0%. Nhưng điều đáng ghi không phải con số: **một chứng minh gắn với một hình dạng cụ
  thể thì hết hiệu lực khi hình dạng ấy đổi, và không có gì tự nhắc.** Thứ bắt được là cái SÀN 3% —
  một phép đo chạy mỗi lần test — chứ không phải câu chứng minh trong chú thích.
*/
const SCALP_LIFT = 1.10;

function hairPieces(kind, d) {
  if (kind === 'shaved') return [];
  const fit = scalpFit(d.headW, d.headH, SCALP_LIFT, d.headZ);
  const parts = [piece('hair', 'hair', 'scalp', 'head', fit.size, fit.rest)];
  /*
    MÁI TRƯỚC — ROUND 58, VIỆC 5 (*"khối tóc: mái, tóc mai, gáy, khối đỉnh"*).
    ⚠️ BA TRONG BỐN THỨ ĐÀM ĐẶT HÀNG ĐÃ CÓ SẴN, VÀ NÓI THẲNG LÀ TỐT HƠN DỰNG THÊM KHỐI CHO ĐỦ SỐ:
      · **tóc mai** — đường chân tóc bậc hai của vòng 56 tự đưa tóc xuống 0,346 `headH` ở thái
        dương, tức thấp hơn đuôi mắt. Đó ĐÚNG LÀ tóc mai, và nó không tốn khối nào.
      · **gáy** — cũng thế: chân tóc ở gáy dừng ở 0,100 `headH`, gần chân cổ.
      · **khối đỉnh** — `SCALP_LIFT` cho mũ tóc dày 10% quanh sọ ở mọi hướng; ở đỉnh đầu đó là một
        lớp dày bằng 10% chiều cao đầu, đủ để đường bao trên đọc ra là TÓC chứ không phải da đầu.
    Thứ duy nhất một mặt tròn xoay không nói được là **cái mái đổ xuống trán**: nó dày lên ở phía
    TRƯỚC và mỏng dần ra hai bên, tức bất đối xứng trước–sau, cùng họ với `occiput` và `browRidge`.
    ⇒ Đúng một khối, chỉ ở kỷ có tóc, dùng `dome` (kỷ nào cũng đã vẽ) ⇒ 0 lệnh vẽ thêm.
    ⚠️ Nhô 0,53 `headW`, tức hơn mũ tóc (0,507) đúng 0,023 — một cái mái dày hơn thế thì nó thành
    cái lưỡi trai, và dự án đã có đúng một lần như vậy (`hairTop` vòng 52 trùm kín cả khuôn mặt,
    xem chú thích `flare` bên dưới).
  */
  /*
    ⚠️ HAI CON SỐ DƯỚI ĐÂY ĐỀU DO MỘT PHÉP ĐO SỬA, KHÔNG PHẢI DO MẮT NHÌN.
    · `x = 0,33` (bản đầu 0,30): ở 0,30 mặt trước cái mái nằm ở 0,530 `headW`, mà mũ tóc ở CÙNG độ
      cao ấy đã ở 0,512 — chênh 0,018, tức cái mái **chìm gần hết vào trong mũ tóc** và trên ảnh
      không thấy gì. Một khối nằm trong một khối thì không hiện ra: lần thứ ba trong dự án, sau con
      ngươi (vòng 56) và chân tóc (vòng 56).
    · `y = 0,80` (bản đầu 0,735): ở 0,735 cái mái trải xuống tới 0,64 `headH`, tức ĐÈ LÊN hai cái
      lông mày (0,65 … 0,68) và cả gờ mày. Một cái mái che mất lông mày thì nó không còn là mái,
      nó là cái lưỡi trai — dự án đã có đúng một lần như thế (`hairTop` vòng 52 trùm kín khuôn mặt).
      Ở 0,80 nó trải 0,71 … 0,89, ngồi ĐÚNG trên đường chân tóc trước (0,723), là chỗ một cái mái
      thật bắt đầu.
  */
  parts.push(piece('hairFringe', 'hair', 'dome', 'head',
    [d.headW * 0.46, d.headH * 0.18, d.headZ * 0.74],
    [d.headW * 0.33, d.headH * 0.80, 0]));
  switch (kind) {
    // Ôm sọ và hết — chân tóc do chính khuôn `scalp` vẽ ra, không cần khối nào nữa.
    case 'crop':
      break;
    case 'bun':
      parts.push(piece('hairTop', 'hair', 'prism', 'head',
        [d.headW * 0.48, d.headH * 0.44, d.headZ * 0.48],
        [-d.headW * 0.12, d.headH * 1.06, 0]));
      break;
    // Bím buông sau gáy: hẹp theo trục đi (x) mà DÀI xuống, đặt LỆCH VỀ SAU. ⚠️ Lệch theo −x vì
    // `humanPose.js` để +x là hướng đi — đặt nhầm dấu thì cái bím mọc trước mặt, hình học vẫn
    // hợp lệ nên không có gì đỏ lên.
    case 'braid':
      parts.push(piece('hairTop', 'hair', 'calf', 'head',
        [d.headW * 0.34, d.headH * 1.15, d.headZ * 0.34],
        [-d.headW * 0.44, d.headH * 0.18, 0]));
      break;
    // Xoã ngang vai: `flare` rộng ở ĐÁY ⇒ bó ở đỉnh đầu, loạc ra hai bên má rồi xuống gáy.
    // ⚠️ HẠ XUỐNG SAU CHÂN TÓC (0,56 → 0,30 `headH`) ĐỂ KHÔNG PHỦ MẶT. Bản vòng 52 đặt khối này
    // cao tới 1,07 `headH` và rộng hơn sọ ở ngang tầm mắt, tức nó **trùm kín cả khuôn mặt** —
    // chưa ai thấy vì cả bốn kỷ dùng `loose` (5 · 7 · 8 · 9) đều đội mũ, mà mũ thì thắng tóc.
    // Nay mũ tóc lo phần sọ, nên khối này chỉ còn là phần **xoã xuống** và phải bắt đầu từ dưới.
    case 'loose':
      parts.push(piece('hairTop', 'hair', 'flare', 'head',
        [d.headW * 1.26, d.headH * 0.80, d.headZ * 1.22],
        [-d.headW * 0.04, d.headH * 0.30, 0]));
      break;
    default:
      break;
  }
  return parts;
}

/**
 * KHUÔN MẶT — round 56, Phần A, Việc 2. Đàm xếp sẵn thứ tự: *"lông mày trước (nhiều biểu cảm nhất,
 * rẻ nhất) · mắt có lòng trắng và con ngươi · một cái miệng một nét. Mũi và má thì tí thôi."*
 *
 * ⚠️ MỌI KHỐI TREO VÀO KHỚP `head`, KHÔNG VÀO `torso`. Đầu xoay được từ vòng 48; một con mắt neo
 * vào thân thì đầu quay sang trái còn mắt vẫn nhìn thẳng. Đàm nhắc đúng điều này ở Phần A.
 *
 * ⚠️ MỘT KHỐI NHỎ NẰM TRONG MỘT KHỐI LỚN THÌ KHÔNG HIỆN RA — và đây là cùng một bài học vừa trả
 * giá ở chân tóc, chỉ nhỏ hơn. Con ngươi đặt ĐỒNG TÂM với lòng trắng thì nó nằm gọn bên trong và
 * thứ ta thấy lại là giao tuyến của hai mặt tròn xoay. Nên con ngươi đặt ở ĐÚNG CỰC TRƯỚC của lòng
 * trắng (x = 0,55 `headW`, trong khi cực trước của lòng trắng ở 0,57): một nửa nó thò hẳn ra ngoài,
 * nên đường viền ta thấy là viền của chính nó.
 *
 * ⚠️ LÔNG MÀY VÀ MIỆNG DÙNG KHUÔN `box`, CÓ CHỦ Ý. Chúng là những NÉT, và một nét thì có hai đầu
 * cắt — `box` cho đúng điều đó, lại là khuôn kỷ nào cũng đã vẽ nên tốn **0 lệnh vẽ**. Bo tròn
 * chúng là làm đúng cái việc Đàm cấm ở Việc 0: *"không phải cái gì cũng bo tròn"*.
 *
 * ⚠️ VÀ ĐÂY LÀ RỦI RO PHẢI NÓI RA, ĐÃ SOI ẢNH Ở CẢ HAI CỠ: đổi con mắt từ một chấm TỐI đặc sang
 * lòng trắng + con ngươi làm khối mắt SÁNG hơn ở xa. Ở khung toàn cảnh sát nhất, cư dân cao ~30
 * điểm ảnh và cái đầu ~7 — ở cỡ ấy hai thứ trộn lại thành một chấm xám. Đó là cái giá, và nó đổi
 * lấy một khuôn mặt đọc được ở chế độ đi bộ, nơi cùng cái đầu ấy cao ~40 điểm ảnh.
 */
/**
 * SỌ NGƯỜI — ROUND 58, VIỆC 3. *"Không phải thiếu chi tiết. Là thiếu HÌNH."* (Đàm)
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * CÁI ĐẦU CŨ LÀ MỘT QUẢ CẦU, VÀ ĐÂY LÀ SÁU CON SỐ ĐO ĐƯỢC TRƯỚC VÒNG NÀY
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đo trên kỷ 1, đơn vị `headW`, gốc tại tâm đầu, trục +x là hướng người nhìn:
 *     mặt sọ 0,501 · mắt 0,555 · con ngươi 0,595 · lông mày 0,505 · miệng 0,495
 * Cả khuôn mặt nằm trong một dải dày **0,10 `headW`**. Tức nó là một TẤM PHẲNG có vài chấm trên
 * đó, không phải một cái mặt: không gờ mày, không hốc mắt, không gò má, không cằm, không gáy.
 * Và tỉ lệ z/x đúng **1,000** (sọ người: 0,78) ⇒ quay hướng nào cũng y hệt.
 *
 * ⚠️ BẢY ĐẶC ĐIỂM ĐÀM ĐẶT HÀNG, VÀ CHỖ MỖI CÁI ĐƯỢC DỰNG:
 *   1. dẹt hai bên  → `headZ = 0,80 headW` ở `humanDims` (0 khối)
 *   2. phình gáy    → `occiput`
 *   3. trán dốc     → KHÔNG phải một khối: nó là QUAN HỆ `gờ mày (0,580) > sọ ở tầm đỉnh (0,371)`,
 *                     tức mái trán thụt về 0,209 `headW` trên một đoạn 0,21 `headH` ≈ 45°. Một cái
 *                     trán dốc là một sự THỤT LÙI, và một sự thụt lùi thì không dựng bằng cách
 *                     thêm khối — nó có sẵn ngay khi phía dưới nhô ra. `humanSkull.test.js` gác
 *                     đúng quan hệ ấy, nên nó không thể bị "sửa" mất mà vẫn xanh.
 *   4. gờ mày       → `browRidge`
 *   5. hốc mắt      → cũng là QUAN HỆ: gờ mày (0,580) và gò má (0,525) đều nhô hơn mặt sọ, con mắt
 *                     nằm giữa hai cái ⇒ ở cự ly gần, với AO, đó là một cái hốc. ⚠️ NÓI THẲNG GIỚI
 *                     HẠN: khối ở đây không xoay được quanh trục riêng (chỉ có `size` + `rest`),
 *                     nên KHÔNG thể khoét một hốc thật. Đây là hốc dựng bằng hai cái nhô ra, và
 *                     nó chỉ đọc đúng khi còn hai cái ấy.
 *   6. gò má        → `cheekL/R`
 *   7. hàm và cằm   → `jaw` + `chin`;  tai → `earL/R`
 *
 * ⚠️ TÁM KHỐI, **0 KHUÔN MỚI, 0 LỆNH VẼ**: chỉ `box`, `dome`, `chest` — ba khuôn mà cả 15 kỷ đều
 * đã vẽ. Xem chú thích ngón cái ở dưới để biết một khuôn mới đắt thế nào.
 * ⚠️ TAI DÙNG `box` CHỨ KHÔNG `dome`, VÀ ĐÓ LÀ MỘT QUYẾT ĐỊNH VỀ TAM GIÁC: `dome` có 60 cạnh × 5
 * vành = 600 tam giác; một cái tai cao 0,27 `headH` không dùng nổi 600 tam giác, và hai cái thì
 * tốn bằng cả một cái đầu. `box` tốn 12.
 * ⚠️ MỌI KHỐI KHAI `continues: 'head'` — chúng là phần nối dài của cái sọ, không phải vật riêng,
 * nên `humanSeams.js` canh chúng: đổi vai màu một cái là test đỏ. Đó đúng là cái gác Việc 1 dựng.
 */
function skullPieces(d) {
  const W = d.headW;
  const H = d.headH;
  const Z = d.headZ;
  return [
    // GÁY — sọ người phình ra phía sau ở tầm trên, chỗ xương chẩm. Đây là một trong hai đặc điểm
    // BẤT ĐỐI XỨNG TRƯỚC–SAU, tức thứ duy nhất đường sinh `skull` không nói được. Nó cũng là thứ
    // cho cái đầu một HƯỚNG khi nhìn từ trên hoặc từ 3/4, và ở phần lớn các kỷ nó nằm dưới mũ tóc.
    piece('occiput', 'skin', 'dome', 'head',
      [W * 0.50, H * 0.44, Z * 0.74], [-W * 0.290, H * 0.620, 0], 'head'),
    /*
      GỜ MÀY — đặc điểm bất đối xứng trước–sau thứ hai, và là khối duy nhất còn lại trên KHUÔN MẶT.
      ⚠️ HẸP TRONG Z (0,60 `headZ`, không phải 0,88), VÀ ĐÓ LÀ ĐIỀU TẤM ẢNH DẠY. Bản trước trải
      gần hết bề ngang đầu, nên cạnh trên của nó là một ĐƯỜNG NGANG chạy suốt mặt — đọc ra là cái
      băng-đô, không đọc ra cái gờ xương. Gờ mày người thật chỉ chạy hết bề ngang HAI HỐC MẮT rồi
      tan vào thái dương; đúng chỗ ấy `skull` đã có sẵn cái thót thái dương để nó tan vào.
      Nhô tới x = 0,505, tức hơn mặt sọ ở tầm ấy chừng 0,03 `headW` (3%) — bậc của người thật. Bản
      đầu lấy 11,5% vì tôi chọn số cho vừa một MỤC TIÊU HÌNH HỌC ("phải vượt con mắt") thay vì đo
      xem ngoài đời nó bao nhiêu; con mắt hoạt hình vốn được cố ý cho nhô, nên ép gờ mày vượt nó là
      ép một cái xương chạy theo một quy ước vẽ.
    */
    piece('browRidge', 'skin', 'dome', 'head',
      [W * 0.52, H * 0.11, Z * 0.60], [W * 0.245, H * 0.655, 0], 'head'),
    /*
      TAI — NHỎ VÀ ÁP SÁT.
      ⚠️ BẢN ĐẦU LÀ MỘT TẤM THẺ TRẮNG DÁN VÀO ĐẦU: cao 0,27 `headH`, nhô 0,055 `headZ`, mặt ngoài
      phẳng và vuông góc với nắng ⇒ trên ảnh nó sáng hơn cả khuôn mặt. Một cái tai to bằng một phần
      tư cái đầu thì không phải cái tai.
      Vẫn giữ `box`: ở ảnh cận cái tai cao chừng 20 điểm ảnh, không dùng hết 600 tam giác của
      `dome`, mà `box` chỉ tốn 12 — và ở kỷ có tóc thì hai bên đầu còn bị mũ tóc che gần hết.
    */
    piece('earL', 'skin', 'box', 'head',
      [W * 0.13, H * 0.19, Z * 0.05], [-W * 0.07, H * 0.455, -Z * 0.425], 'head'),
    piece('earR', 'skin', 'box', 'head',
      [W * 0.13, H * 0.19, Z * 0.05], [-W * 0.07, H * 0.455, Z * 0.425], 'head'),
  ];
}

function facePieces(d) {
  const W = d.headW;
  const H = d.headH;
  /*
    ⚠️ MỌI BỀ Z VÀ MỌI ĐỘ LỆCH NGANG TRÊN MẶT PHẢI TÍNH THEO `headZ`, KHÔNG THEO `headW` (round 58).
    Từ vòng này sọ hẹp hai bên (z = 0,80 x). Giữ `headW` cho trục z thì hai con mắt trôi ra NGOÀI
    thái dương — đúng họ lỗi "một khối nhỏ nằm trong một khối lớn thì không hiện ra", chỉ theo chiều
    ngược lại: nó hiện ra ở chỗ không có sọ.
  */
  const Z = d.headZ;
  return [
    // LÒNG TRẮNG — HẸP HƠN con mắt vòng 54 (0,30 → 0,23 `headW`), và con số ấy đến từ một tấm ảnh,
    // không từ giải phẫu. Giữ nguyên cỡ cũ thì mảng SÁNG chiếm đúng chỗ mảng TỐI từng chiếm, và
    // khuôn mặt đọc ra là đang trợn mắt — đúng thứ Đàm cấm ở vòng 54 (*"đừng làm mặt tả thực — ở
    // cỡ này nó sẽ thành đáng sợ"*). Một con mắt hoạt hình hiền là **ít lòng trắng, nhiều con ngươi**.
    piece('eyeL', 'eyeWhite', 'dome', 'head', [W * 0.23, H * 0.20, Z * 0.22], [W * 0.44, H * 0.54, -Z * 0.31]),
    piece('eyeR', 'eyeWhite', 'dome', 'head', [W * 0.23, H * 0.20, Z * 0.22], [W * 0.44, H * 0.54, Z * 0.31]),
    // CON NGƯƠI — ở cực trước của lòng trắng, xem khối chú thích trên. To hơn bản đầu (0,11 → 0,13)
    // để tỉ lệ ngươi/trắng nghiêng hẳn về phía ngươi.
    piece('pupilL', 'hair', 'dome', 'head', [W * 0.13, H * 0.15, Z * 0.16], [W * 0.53, H * 0.53, -Z * 0.31]),
    piece('pupilR', 'hair', 'dome', 'head', [W * 0.13, H * 0.15, Z * 0.16], [W * 0.53, H * 0.53, Z * 0.31]),
    // LÔNG MÀY — ngay trên mí trên (mắt trải 0,44…0,64 `headH`), MẢNH (0,03) và NGẮN (0,20). Bản
    // đầu để 0,05 dày × 0,26 dài và ảnh cho ra một VỆT TỐI liền một dải dưới vành mũ, không ra hai
    // cái lông mày. Lông mày là thứ đọc được nhờ KHOẢNG HỞ với con mắt, không nhờ bề dày.
    /*
      ⚠️ ROUND 58: LÔNG MÀY PHẢI NẰM **TRÊN** GỜ MÀY, KHÔNG PHẢI LƠ LỬNG TRƯỚC NÓ — ẢNH SỬA HAI LẦN.
      Từ vòng này có một gờ mày thật, và cái gờ ấy nhô nhất ở ĐÚNG độ cao tâm nó (0,665 `headH`),
      thu lại nhanh về hai phía (nó là `dome`, vành rộng nhất nằm giữa).
      · Lần 1: giữ lông mày ở x = 0,46 ⇒ chìm hẳn vào trong gờ, biến mất.
      · Lần 2: đẩy ra 0,545 mà vẫn để ở y = 0,69 ⇒ ở độ cao ấy gờ đã thu về, nên lông mày thành hai
        **que sẫm treo lơ lửng trước trán** — thấy rất rõ trên ảnh.
      ⇒ Toạ độ của một nét trên mặt không được chọn một mình: nó phải bám ĐỘ CAO và ĐỘ NHÔ của khối
      mang nó. Nay x = 0,490 (gờ ở đó nhô 0,520 nên lông mày chạm mặt gờ) và y = 0,665 (đúng tâm
      gờ). Vẫn trên mí trên của mắt (mắt hết ở 0,64) nên khoảng hở — thứ làm lông mày đọc được —
      còn nguyên.
    */
    piece('browL', 'hair', 'box', 'head', [W * 0.09, H * 0.03, Z * 0.25], [W * 0.490, H * 0.665, -Z * 0.32]),
    piece('browR', 'hair', 'box', 'head', [W * 0.09, H * 0.03, Z * 0.25], [W * 0.490, H * 0.665, Z * 0.32]),
    // MIỆNG — một nét, ở 0,30 `headH`. Cao hơn thì nó nằm ngay dưới mũi; thấp hơn thì rơi xuống cằm.
    // NGẮN (0,20 `headW`): một nét dài bằng khoảng cách hai mắt đọc ra là đang nhăn mặt.
    piece('mouth', 'hair', 'box', 'head', [W * 0.07, H * 0.03, Z * 0.25], [W * 0.455, H * 0.29, 0]),
  ];
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
    // ⚠️ `bun` KHÔNG CÒN Ở ĐÂY (ADR-092) — một cái búi tóc không phải một cái mũ. Nó sang
    // `hairPiece` cùng bốn kiểu tóc khác. Dữ liệu cũ khai `headgear: 'bun'` rơi vào `default` ở đây
    // (không dựng mũ) và được `getHumanStyle` dẫn sang `hair: 'bun'` — không ai mất tóc.
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
        // round 49 (debt #81): 1,9 → 1,7 headW — the crown (0,62 × brim) must still clear the skull, so
        // 1,62 is the floor (`humanShape.test.js`); 1,7 keeps a 5 % margin and takes the hat from
        // 1,52× to 1,36× the shoulders — partial, the rest is the head's own 1,54× enlargement
        [d.headW * 1.7, d.headH * 0.78, d.headW * 1.7],
        [0, d.headH * 1.19, 0])];
    // Mũ trụ: một cái VÒM kim loại. `dome` là hình học của chính vật ấy, không phải một cách điệu.
    case 'helm':
      return [piece('headgear', 'steel', 'dome', 'head',
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
      /*
        ⚠️ ROUND 54 (ADR-094): 1,71 → 1,24 `headW`, VÀ ĐÂY LÀ MỘT PHÉP CHIA, KHÔNG PHẢI MỘT LẦN
        CHỈNH CHO ĐẸP. Việc 4 nâng cái đầu 0,16 → 0,22 (×1,375). Mọi thứ khai theo `headW` lớn theo
        — đó là cả điểm của ADR-090 và nó đúng với mũ vành, mũ trụ, mũ vải. Nhưng nón lá thì KHÔNG:
        1,71 × 1,375 = 2,35 `headW` mới, tức quay đúng về con số 2,2 mà vòng 49 đã phải bỏ vì
        *"cái nấm trắng nuốt trọn người"*.
        ⚠️ VÀ NÓ ĐÃ ĐỎ THẬT, Ở ĐÚNG CHỖ ĐƯỢC BÁO TRƯỚC: bài *"hình bóng đổi theo pha bước"* ở
        `humanPose.test.js` bắt kỷ 6 vào lại danh sách ngoại lệ, và khối chú thích của chính bài ấy
        đã ghi sẵn cơ chế từ 2026-08-23 — *"nón lá kỷ 6 rộng hơn cả sải chân, cái đĩa ấy quyết cả
        min lẫn max ở CẢ HAI pha"*. Một dự đoán viết trong chú thích, ba vòng sau thành sự thật.
        ⇒ 1,71 / 1,375 = 1,24: **giữ nguyên bề rộng TUYỆT ĐỐI của cái nón**. Được phép làm thế vì
        chính chú thích ấy đã ghi: bề rộng một cái nón KHÔNG bị cái đầu ràng buộc theo tỉ lệ, nó chỉ
        bị chặn DƯỚI (phải rộng hơn cái sọ) — và 1,24 vẫn rộng hơn 1,0.
      */
      return [piece('headgear', vai, 'cone', 'head',
        [d.headW * 1.24, d.headH * 0.72, d.headW * 1.24],
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
      return piece('carry', 'steel', 'prism', 'shoulderR',
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
  // Tủ đồ của thế kỷ — tra MỘT LẦN ở đây rồi dùng cho cả tám khối chi. Tra lại ở từng chỗ dùng là
  // mở đường cho hai khối cùng một chi tra ra hai dòng khác nhau, và hình học vẫn hợp lệ nên không
  // có gì đỏ lên — đúng hình dạng "một luật hai công thức" mà `humanDims` được tách ra để tránh.
  const sv = sleeveLook(style.sleeve);
  const lg = legLook(style.leg);
  /*
    ⚠️ VAI MÀU CỦA BÀN TAY — HAI TRẠNG THÁI, KHÔNG BAO GIỜ CÓ TRẠNG THÁI THỨ BA (round 58, Việc 1).
    Đàm: *"màu da khi tay áo ngắn, màu găng khi có găng — và không bao giờ là một màu thứ ba."*
    Có găng ⇒ bàn tay mang ĐÚNG vai màu của cẳng tay (một chiếc găng vải bông cùng lò với áo, đúng
    kiểu Stalingrad 1942); không găng ⇒ da. Không có nhánh nào khác, nên không có chỗ cho một màu
    lạ chen vào.
    ⚠️ Mép tay áo ↔ bàn tay trần LÀ một đường viền CÓ THẬT ngoài đời (cửa tay), nên nó KHÔNG nằm
    trong họ lỗi "ranh giới màu sai chỗ" — xem danh sách `VIEN_CO_THAT` ở `humanSeams.js`.
  */
  const hand = { role: style.gloves ? sv.loRole : 'skin' };

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
    // ── CHÂN: ĐÙI → GỐI → CẲNG CHÂN → BÀN CHÂN ────────────────────────────────────────────
    // ⚠️ Đây là chỗ ADR-057 đổi nhiều nhất. Trước đó mỗi chân là MỘT khối cứng treo vào hông, và
    // "đầu gối" chỉ là phép rút ngắn khối ấy giữa pha đưa chân. Nay là hai khối và một khớp thật;
    // vị trí khớp gối KHÔNG khai ở đây mà do `humanPose.js` giải ra từ chỗ đặt bàn chân.
    // ⚠️ CẲNG CHÂN MẢNH HƠN ĐÙI (0,86) — nếu để bằng nhau thì hai khối nối nhau thành một cái ống
    // dài và cái khớp gối vừa thêm vào sẽ không đọc ra được, tức tiêu hai khối cho một hình cũ.
    // ⚠️ VAI MÀU / KHUÔN / BỀ NGANG CỦA BỐN KHỐI NÀY DO TỦ ĐỒ CỦA KỶ QUYẾT (`LEG_LOOK`), không
    // phải hằng số — xem khối chú thích của `LEG_LOOK` để biết vì sao đây là cách đúng thay vì đắp
    // thêm một ống quần trùm ra ngoài. `lg.upW` = 1,00 chính là vạch xuất phát trước vòng 52.
    piece('thighL', lg.upRole, lg.upShape, 'hipL',
      [d.limbW * lg.upW, d.thighLen, d.limbW * lg.upW], [0, -d.thighLen * 0.5, 0]),
    piece('thighR', lg.upRole, lg.upShape, 'hipR',
      [d.limbW * lg.upW, d.thighLen, d.limbW * lg.upW], [0, -d.thighLen * 0.5, 0]),
    piece('shinL', lg.loRole, lg.loShape, 'kneeL',
      [d.limbW * lg.loW, d.shinLen, d.limbW * lg.loW], [0, -d.shinLen * 0.5, 0]),
    piece('shinR', lg.loRole, lg.loShape, 'kneeR',
      [d.limbW * lg.loW, d.shinLen, d.limbW * lg.loW], [0, -d.shinLen * 0.5, 0]),
    // ⚠️ BÀN CHÂN NAY TREO VÀO KHỚP GỐI, KHÔNG TREO VÀO HÔNG. Treo vào hông thì lúc gối gập, bàn
    // chân đứng nguyên chỗ cũ trong khi cẳng chân đã đi chỗ khác — một bàn chân bay lơ lửng, và
    // hình học vẫn hợp lệ nên KHÔNG có gì đỏ lên.
    // ⚠️ BÀN CHÂN MANG VAI MÀU CỦA CẰNG CHÂN, KHÔNG CỨNG `cloth2`: kỷ đi chân đất (`wrap`) thì bàn
    // chân là DA, kỷ đi ủng thì bàn chân là cùng màu ủng. Để cứng một vai màu là chọn sẵn rằng ai
    // cũng đi giày — sai ở 3 trong 15 kỷ, và sai ngay ở chóp múi người nhìn nhiều nhất lúc đứng gần.
    // Round 52 (ADR-092), Việc 7 *"bàn tay và bàn chân có khối"*: dày 0,62 → 0,76 và bề ngang 1,0 → 1,08.
    // Một bàn chân dẹt là một cái bóng dẹt — ở tầm mắt nó đọc ra là cái chân bàn, không phải cái giày.
    piece('footL', lg.loRole, 'box', 'kneeL',
      [d.limbW * 1.7, d.limbW * 0.76, d.limbW * 1.08],
      [d.limbW * 0.42, -d.shinLen + d.limbW * 0.38, 0], 'shinL'),
    piece('footR', lg.loRole, 'box', 'kneeR',
      [d.limbW * 1.7, d.limbW * 0.76, d.limbW * 1.08],
      [d.limbW * 0.42, -d.shinLen + d.limbW * 0.38, 0], 'shinR'),

    // ── THÂN: XƯƠNG CHẬU → LỒNG NGỰC → ĐẦU ────────────────────────────────────────────────
    // ⚠️ XƯƠNG CHẬU LÀ KHỐI MỚI, VÀ NÓ SỬA MỘT KHUYẾT TẬT CÓ TỪ ĐẦU: hai cái chân trước nay mọc
    // thẳng ra từ đáy cái thân, cách nhau đúng `2 × hipZ`, và giữa chúng là một khe TRỐNG chạy
    // suốt bề rộng hông. Ở cận cảnh khe ấy đọc ra là hai cái que cắm vào một cái thùng. Một khối
    // bẹt nằm ngang bắc qua hai chỏm hông vừa bịt khe, vừa cho hình bóng một chỗ nở ra ở ngang
    // hông — thứ mà mọi hình người thật đều có.
    // Vai màu `cloth2` (cùng quần) chứ không `cloth`: ngoài đời cái quần bắt đầu từ đúng chỗ này.
    piece('pelvis', 'cloth2', 'chest', 'pelvis',
      [d.torsoD * 0.96, d.torsoH * 0.32, d.torsoW * 0.88], [0, d.torsoH * 0.06, 0]),
    piece('torso', 'cloth', 'chest', 'torso', [d.torsoD, d.torsoH, d.torsoW], [0, d.torsoH * 0.5, 0]),
    /*
      ⚠️ CƠ THANG — ROUND 58, VIỆC 4, VÀ NÓ SỬA MỘT KHUYẾT TẬT ĐO ĐƯỢC, KHÔNG PHẢI MỘT CẢM GIÁC.
      Đo trên kỷ 1 trước vòng này: đáy cái đầu ở y = 0,17231, còn ĐỈNH quả cầu vai ở y = 0,17335.
      Quả cầu vai nằm **CAO HƠN hàm 0,020 `headH`** ⇒ chiều cao cổ nhìn thấy được là một số ÂM: cái
      cổ tồn tại trong mã mà không tồn tại trên ảnh, và hai vai là hai cục vuông nhô lên hai bên
      hàm — đúng dáng một người đang so vai, và đúng thứ Đàm gọi là *"thiếu cổ"*.
      Hai chuyện được sửa cùng lúc, vì chúng là MỘT chuyện:
        · `shoulderY` ở `humanPose.js`: 0,88 → 0,74 `torsoH`. Hạ quả cầu vai xuống dưới hàm, và
          nhân đó kéo đầu ngón tay về ĐÚNG giữa đùi — mốc giải phẫu mà `armLen` vẫn tự nhận là
          mình đang giữ (xem chú thích `armLen`) nhưng thực ra chưa bao giờ đạt.
        · khối này: một `chest` bẹt, rộng trong z tới quá tâm vai, thấp trong x để không phình
          ngực. Nó bắc từ chân cổ ra hai chỏm vai, nên đường bao từ cổ ra vai là một đường XUÔI
          thay vì một góc vuông. Vai xuôi không phải một thuộc tính của quả cầu vai — nó là cái
          khối nằm GIỮA cổ và vai, và trước vòng này chỗ ấy trống.
      Vai màu `cloth` và `continues: 'torso'`: nó là phần nối dài của cái thân, nên `humanSeams.js`
      canh nó — đổi màu là test đỏ. Một cái "cổ áo" sáng quanh vai là đúng lỗi vòng 54 đã trả giá.
    */
    piece('trapezius', 'cloth', 'chest', 'torso',
      [d.torsoD * 0.84, d.torsoH * 0.30, d.torsoW * 1.08], [0, d.torsoH * 0.90, 0], 'torso'),
    /*
      ⚠️ CỔ — ROUND 54 (ADR-094), VIỆC 5. Trước vòng này cái đầu ngồi TRỰC TIẾP lên thân, và đó là
      một trong hai thứ làm cư dân đọc ra "chồng hộp" chứ không đọc ra "cơ thể" (thứ kia là khớp).
      Một cái cổ dựng thành đúng một khối `limb` mảnh, thuôn lên trên, và nó làm đúng hai việc:
      bịt cái khe giữa cầu vai và hàm dưới, và cho cái đầu một CHỖ ĐỂ XOAY quanh.
      ⚠️ Treo vào khớp `head` chứ không vào `torso`: đầu nhìn quanh thì cổ phải đi theo, nếu không
      thì đầu quay còn cổ đứng yên và ta được một cái lỗ.
    */
    // ⚠️ 0,46 → 0,38 BỀ NGANG (sửa theo ảnh, cùng lượt với vai màu khớp cầu): ở 0,46 cái cổ rộng
    // gần bằng nửa cái đầu, và từ camera chếch 34° nó hiện ra thành một VÀNH SÁNG chạy quanh chân
    // đầu — đọc ra là cái cổ áo trắng, không đọc ra cái cổ. Một cái cổ thật rộng khoảng một phần ba
    // đầu. Hạ thêm xuống (−0,17 thay vì −0,13) để phần dưới khuất vào trong thân.
    piece('neck', 'skin', 'limb', 'head',
      [d.headW * 0.38, d.headH * 0.40, d.headZ * 0.38], [0, -d.headH * 0.19, 0]),
    piece('head', 'skin', 'skull', 'head', [d.headW, d.headH, d.headZ], [0, d.headH * 0.5, 0]),
    // ⚠️ TÁM KHỐI SỌ (round 58, Việc 3) PHẢI ĐỨNG NGAY SAU CÁI ĐẦU, TRƯỚC KHUÔN MẶT — thứ tự trong
    // mảng không đổi hình, nhưng nó là thứ người đọc mã dùng để hiểu cái gì nằm trên cái gì.
    ...skullPieces(d),
    /*
      ⚠️ HAI CON MẮT — VIỆC 7, VÀ ĐÂY LÀ TOÀN BỘ "KHUÔN MẶT". Đàm nói thẳng: *"kiểu hoạt hình không
      cần mặt chi tiết, nó cần MẮT. Hai chấm tròn lớn đặt đúng chỗ là đủ để một nhân vật có hồn."*
      Và vế sau cũng là một lệnh: *"đừng làm mặt tả thực — ở cỡ này nó sẽ thành đáng sợ."*
      ⚠️ TO QUÁ MỨC GIẢI PHẪU CÓ CHỦ Ý (0,30 bề ngang đầu, đời thật ~0,17) — cùng một lý lẽ với cái
      đầu 4,5 nhịp: chọn sức hấp dẫn, bỏ chính xác. Đặt hơi thấp và hơi ra trước để bắt ánh sáng.
      ⚠️ VAI `hair` CHỨ KHÔNG PHẢI MỘT VAI MỚI: vai này đã là màu tối nhất bảng và đã có ở mọi kỷ,
      nên hai con mắt tốn **0 lệnh vẽ**. Thêm một vai `eye` là thêm một họ vật liệu cho cả 15 kỷ để
      vẽ hai chấm — đúng thứ `iron` ở vòng 51 sinh ra để tránh, nhìn từ chiều ngược lại.
    */
    ...facePieces(d),

    // ── TAY: CÁNH TAY TRÊN → KHUỶU → CẲNG TAY → BÀN TAY ───────────────────────────────────
    // ⚠️ BÀN TAY DÙNG KHUÔN `dome` CHỨ KHÔNG THÊM KHUÔN MỚI, và đó là một quyết định về LỆNH VẼ:
    // số khuôn một kỷ dùng CHÍNH LÀ số lệnh vẽ cư dân tiêu (xem `humanShapesUsed`). `dome` thì kỷ
    // nào cũng đã có sẵn (cái đầu), nên hai bàn tay tốn **0 lệnh vẽ**. Một nắm tay cũng đúng là
    // một cái vòm hơi bẹt, nên đây không phải một phép tiết kiệm làm hỏng hình.
    // ⚠️ ĐÂY LÀ CHỖ ĐỔI NHIỀU NHẤT Ở TẦM MẮT (round 52, ADR-092, Việc 8). Trước vòng này cả hai
    // cánh tay luôn mang vai `skin` — vai SÁNG NHẤT bảng — ở cả 15 kỷ, kể cả kỷ mặc áo măng tô kín
    // tới cổ tay. Đứng ở tầm mắt thì đó là hai cái que trắng vung hai bên một khối vải.
    // Vai màu, khuôn và bề ngang nay do `SLEEVE_LOOK` của kỷ quyết — không thêm một khối nào.
    piece('upperArmL', sv.upRole, sv.upShape, 'shoulderL',
      [d.limbW * sv.upW, d.upperArmLen, d.limbW * sv.upW], [0, -d.upperArmLen * 0.5, 0]),
    piece('upperArmR', sv.upRole, sv.upShape, 'shoulderR',
      [d.limbW * sv.upW, d.upperArmLen, d.limbW * sv.upW], [0, -d.upperArmLen * 0.5, 0]),
    piece('forearmL', sv.loRole, sv.loShape, 'elbowL',
      [d.limbW * sv.loW, d.forearmLen, d.limbW * sv.loW], [0, -d.forearmLen * 0.5, 0]),
    piece('forearmR', sv.loRole, sv.loShape, 'elbowR',
      [d.limbW * sv.loW, d.forearmLen, d.limbW * sv.loW], [0, -d.forearmLen * 0.5, 0]),
    // ⚠️ BÀN TAY LUÔN LÀ DA, KỂ CẢ DƯỚI TAY ÁO THỤNG — và đó là thứ khiến cái tay thụng ĐỌC RA là
    // tay thụng chứ không phải một cái chuông: có một chấm da thò ra ở đáy cái xoè.
    // Việc 7 *"bàn tay có khối"*: 0,94 → 1,02 ngang và 0,74 → 0,86 dày — một nắm tay thật gần bằng
    // bề ngang cổ tay nhân đôi, chứ không mỏng hơn cổ tay như bản cũ.
    /*
      ══════════════════════════════════════════════════════════════════════════════════════════
      ⚠️ BÀN TAY — ROUND 58, VIỆC 1. LẦN THỨ NĂM CÙNG MỘT HÌNH DẠNG LỖI, VÀ LẦN NÀY CÓ CÁI GÁC.
      ══════════════════════════════════════════════════════════════════════════════════════════
      Ảnh cận cảnh vòng 57 cho ra **hai quả cầu TRẮNG gắn vào tay áo sẫm**. Bốn lần trước cùng
      một hình: đinh tán trắng ở khớp (vòng 54) · vành cổ áo trắng (vòng 54) · chân tóc ngang
      (vòng 56) · mũ trụ tô màu vải (vòng 49→56). Và cái luật chữa nó đã nằm sẵn **ngay trong file
      này, ở bàn chân**, từ vòng 52: *khối nối mang vai màu của đoạn nó nối.*

      HAI LỖI, KHÔNG PHẢI MỘT:
      1. **VAI MÀU CỨNG `skin`.** Bàn chân đọc `lg.loRole`; bàn tay thì viết cứng. Kỷ nào có găng
         thì bàn tay phải là GĂNG, không phải một mảng da trần giữa mùa đông Stalingrad.
      2. **HÌNH LÀ QUẢ CẦU.** `dome` co giãn gần đều ([1,02 · 0,86] bề ngang) — ở 70 điểm ảnh nó
         là một chấm, ở 390 điểm ảnh nó là **một quả bóng**. Bàn tay thật DẸT, và có ngón cái
         tách ra. Hai điều ấy là HÌNH, và ở cự ly gần hình đọc mạnh hơn mọi chi tiết.
      ⇒ Nay: một khối dẹt (dày bằng 0,46 bề ngang) + một ngón cái tách ra. Ngón cái là thứ khiến
      mắt đọc ra "bàn tay" chứ không "cái vây" — nó rẻ và nó quyết định.
    */
    piece('handL', hand.role, 'calf', 'elbowL',
      [d.limbW * 0.46, d.handLen * 1.18, d.limbW * 1.02],
      [0, -d.forearmLen - d.handLen * 0.55, 0]),
    piece('handR', hand.role, 'calf', 'elbowR',
      [d.limbW * 0.46, d.handLen * 1.18, d.limbW * 1.02],
      [0, -d.forearmLen - d.handLen * 0.55, 0]),
    /*
      NGÓN CÁI — lệch về phía TRƯỚC (+x là hướng đi) và hơi vào trong, đúng chỗ ngón cái nằm khi tay
      buông. Nhỏ, nhưng nó là dấu hiệu duy nhất phân biệt một bàn tay với một cái mái chèo.

      ⚠️ KHUÔN PHẢI LÀ `calf`, ĐÚNG KHUÔN CỦA BÀN TAY — KHÔNG PHẢI `prism`. Bản đầu dùng `prism` vì
      nó "trông giống một cái ngón" hơn, và `drawCallBudget.test.js` đỏ ngay: **kỷ 2 tốn 17 lệnh vẽ,
      vượt mốc 16**. Vòng 54 (Việc 6) đã cố ý xoá `prism` khỏi kỷ 2 để lấy lại đúng một lệnh vẽ, nên
      một cái ngón cái tưởng là miễn phí đã lặng lẽ trả lại cả phần thắng ấy. Mỗi KHUÔN mới trên
      một `InstancedMesh` là MỘT lệnh vẽ cho toàn bộ dân số — không phải một khối.
      ⇒ Dùng lại khuôn của bàn tay: 0 khuôn mới, 0 lệnh vẽ, ở cả 15 kỷ. Hình thì `calf` bóp nhỏ ở
      cỡ này đọc ra đúng một cái ngón ngắn — cái mắt đọc ở đây là VỊ TRÍ TÁCH RA, không phải đường
      sinh của một khối dài 0,004 ô.
    */
    piece('thumbL', hand.role, 'calf', 'elbowL',
      [d.limbW * 0.30, d.handLen * 0.52, d.limbW * 0.30],
      [d.limbW * 0.16, -d.forearmLen - d.handLen * 0.34, -d.limbW * 0.34], 'handL'),
    piece('thumbR', hand.role, 'calf', 'elbowR',
      [d.limbW * 0.30, d.handLen * 0.52, d.limbW * 0.30],
      [d.limbW * 0.16, -d.forearmLen - d.handLen * 0.34, d.limbW * 0.34], 'handR'),
  ];

  /*
    ⚠️ SÁU KHỚP CẦU — ROUND 54 (ADR-094), VIỆC 5: *"khuỷu và gối là khớp cầu chứ không phải hai ống
    chạm nhau"*. Trước vòng này, chỗ hai đoạn chi gặp nhau là hai mặt cắt phẳng kề nhau: lúc đứng
    yên trông còn được, lúc gập thì hở ra một khe hình nêm và cái chi đọc ra như hai que nối bằng
    băng dính. Một quả cầu nhỏ đúng ở tâm khớp bịt khe ấy ở MỌI góc gập — đó là cả lý do khớp cầu
    tồn tại trong mọi bộ máy hoạt hình, không phải để đẹp.
    ⚠️ ĐƯỜNG KÍNH LẤY THEO BỀ NGANG ĐOẠN CHI DÀY HƠN trong hai đoạn nó nối, nhân 1,04. Nhỏ hơn thì
    khe vẫn hở ở góc gập lớn; to hơn thì khớp phình ra thành một cái bướu. Đây là một QUAN HỆ với
    cái chi, không phải một con số — chi đổi bề ngang theo tủ đồ của kỷ (vòng 52), nên một hằng số
    ở đây sẽ đúng ở kỷ này và sai ở kỷ kia.
    ⚠️ `dome` CHỨ KHÔNG PHẢI MỘT KHUÔN CẦU MỚI: `dome` kỷ nào cũng đã vẽ (cái đầu), nên sáu khớp
    tốn **0 lệnh vẽ**. Cùng lý lẽ với hai bàn tay ở ADR-057.
  */
  /*
    ⚠️ KHỚP MANG VAI MÀU CỦA ĐOẠN CHI NÓ NỐI, KHÔNG CỨNG `skin` — VÀ ĐÂY LÀ MỘT LỖI ĐÃ BỊ ẢNH BẮT.
    Bản đầu của vòng 54 cho cả sáu quả cầu vai `skin`. Ảnh cận cảnh kỷ 12 (quân phục xanh sẫm, tay
    áo dài) cho ra **sáu chấm sáng trắng nằm trên tay áo** — mắt đọc ra sáu cái đinh tán, không đọc
    ra cái khớp. Đúng khuyết tật *"hai cái que trắng vung hai bên một khối vải"* mà `SLEEVE_LOOK`
    sinh ra ở vòng 52 để chữa, chỉ là lần này nó quay lại ở chỗ cái khớp.
    ⇒ Luật đã có sẵn trong chính file này, ở ngay bàn chân: **một khối phụ mang vai màu của khối
    chính mà nó dính vào.** Vai (`shoulder`) lấy màu cánh tay TRÊN, khuỷu lấy màu CẲNG TAY, gối lấy
    màu CẲNG CHÂN. Ở kỷ tay áo ngắn, khuỷu chính là đường cắt giữa vải và da — lấy màu cẳng tay là
    lấy đúng phía DA, tức cái khớp nằm đúng bên dưới mép tay áo, y như ngoài đời.
    ⚠️ VÀ NÓ KHÔNG TỐN THÊM GÌ: mọi vai màu dùng ở đây đều đã có mặt trên chính cái chi ấy.
  */
  /*
    ══════════════════════════════════════════════════════════════════════════════════════════════
    ⚠️ ĐƯỜNG KÍNH KHỚP CẦU — ROUND 58, VIỆC 2. ĐO ĐƯỢC, KHÔNG CÒN LÀ MỘT HỆ SỐ ĐOÁN.
    ══════════════════════════════════════════════════════════════════════════════════════════════
    Bản vòng 54 lấy `bề ngang chi × 1,04`, tức GIẢ ĐỊNH rằng đoạn chi dày đúng bằng bề ngang khai
    báo của nó. Sai: `limb` thu về **0,3505** ở đầu dưới, `calf` nở tới **0,4506** ở đầu trên (đơn
    vị hộp — hỏi `shapeEndRadius`). Ở tay áo dài, quả cầu ra bán kính 0,4686 `limbW` trong khi chỗ
    dày nhất nó nối chỉ 0,4055 ⇒ **to hơn 15,6%**, và ở 390 điểm ảnh nó đọc ra là một cục u.

    ⚠️ BÁN KÍNH ĐÚNG BẰNG BÁN KÍNH CHI, VÀ **GÓC GẬP KHÔNG DỰ PHẦN** — đây là kết quả đáng nhớ.
    Trực giác nói "gập càng nhiều thì khe càng to, cầu phải to theo". Đo thì không: vành mép của cả
    hai đoạn chi đều nằm ĐÚNG trên mặt cầu bán kính r (mọi điểm của vành cách tâm khớp đúng r), nên
    một quả cầu bán kính r căng kín cái nêm giữa hai vành ở MỌI góc. Đo bằng `ball2.mjs` (đi dọc
    từng tia, tìm chỗ độ phủ ĐỨT rồi NỐI LẠI):

        R = 1,00·r → khe 0,000 ở 20° · 40° · 60° · 80° · 100°
        R = 0,95·r → khe 0,030 ở 40°        R = 0,70·r → khe 0,160 ở 40°

    ⇒ Lấy đúng bán kính lớn hơn trong hai đoạn, không nhân thêm gì. Một hệ số an toàn ở đây chính
    là cái đã đẻ ra cục u.
    ⚠️ Và phép đo ĐẦU TIÊN của tôi sai: nó quét cả mặt phẳng rồi báo "hở 1,900" ở mọi cấu hình —
    vì nó đang đo KHÔNG KHÍ quanh cánh tay chứ không đo cái khe ở khớp. Định nghĩa đúng của "hở" là
    *đi dọc một tia từ tâm khớp, độ phủ đứt rồi nối lại*. Lại một lần dụng cụ đo nói dối trước.
  */
  const ball = (id, role, joint, worldRadius, continues) => {
    // `dome` rộng nhất ở vành GIỮA (r = 1,00) ⇒ bán kính thật = shapeMaxRadius × size. Đảo lại.
    const size = worldRadius / shapeMaxRadius('dome');
    return piece(id, role, 'dome', joint, [size, size, size], [0, 0, 0], continues);
  };
  /** Bán kính (đơn vị thế giới) ở đầu `which` của một đoạn chi khuôn `shape`, bề ngang `w`. */
  const endR = (shape, w, which) => shapeEndRadius(shape, which) * d.limbW * w;
  for (const side of ['L', 'R']) {
    // Vai: đầu TRÊN của cánh tay trên (nó treo xuống từ khớp vai).
    parts.push(ball(`shoulderBall${side}`, sv.upRole, `shoulder${side}`,
      endR(sv.upShape, sv.upW, 1), `upperArm${side}`));
    // Khuỷu: đầu DƯỚI của cánh tay trên gặp đầu TRÊN của cẳng tay.
    parts.push(ball(`elbowBall${side}`, sv.loRole, `elbow${side}`,
      Math.max(endR(sv.upShape, sv.upW, -1), endR(sv.loShape, sv.loW, 1)), `forearm${side}`));
    parts.push(ball(`kneeBall${side}`, lg.loRole, `knee${side}`,
      Math.max(endR(lg.upShape, lg.upW, -1), endR(lg.loShape, lg.loW, 1)), `shin${side}`));
  }

  const garment = garmentPiece(style.garment, d);
  if (garment) parts.push(garment);
  // ⚠️ ĐỘI ĐẦU TRẢ VỀ MỘT MẢNG, không phải một khối — vì một cái mũ ngoài đời có thể là một vật
  // (nón lá, mũ trụ) mà cũng có thể là nhiều vật chồng lên nhau. Trả về mảng ngay từ đầu thì
  // ngày nào cần hai lớp sẽ không phải sửa chữ ký hàm — và quan trọng hơn, nó buộc chỗ gọi phải
  // viết vòng lặp, tức không âm thầm chỉ lấy khối đầu tiên.
  const headgear = headgearPieces(style.headgear, d, style.headMaterial);
  for (const hg of headgear) parts.push(hg);
  // ⚠️ ĐỈNH ĐẦU CHỈ CÓ MỘT CHỖ, VÀ CÁI MŨ THẮNG — round 52 (ADR-092), Việc 9.
  // Không phải vì tóc dưới mũ là sai, mà vì trần 18 khối/người đang bị 8/15 kỷ chạm đỉnh và
  // cả 8 đều đội mũ: mua thêm một khối ở đó là mua một dải tóc bị chính cái mũ che gần hết.
  // ⇒ Bốn kỷ đầu trần (1 · 3 · 13 · 14) thôi trọc, mà không kỷ nào đắt thêm một khối.
  if (headgear.length === 0) {
    for (const h of hairPieces(style.hair, d)) parts.push(h);
  }
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
