/**
 * parts.js — bộ chữ cái của ngôn ngữ hình khối. Mọi công trình trong thành phố đều viết bằng đúng
 * HAI hình nguyên thuỷ ở file này, không có hình thứ ba.
 *
 * THUẦN: không import three, không DOM, không `Date`, không `Math.random`. Đây chỉ là MÔ TẢ hình
 * học ở dạng dữ liệu; việc biến mô tả thành đối tượng GPU là của `components/city/render3d/`.
 * Nhờ ranh giới này, toàn bộ "kiến trúc" của 75 công trình test được bằng `node --test` mà không
 * cần trình duyệt — đúng kỷ luật đã áp cho tầng engine của AI Coach (ARCHITECTURE.md §7).
 *
 * ⚠️ VÌ SAO CHỈ HAI HÌNH:
 * Mỗi kiểu hình mới là một nhánh mã mới ở nhà máy hình học, một cách đếm tam giác mới, một chỗ có
 * thể sai lệch giữa "ngân sách dự tính" và "thứ thật sự vẽ ra". `prism` có tham số đã phủ được
 * hộp / kim tự tháp / trụ tròn / nón / tháp thóp dần / mái vòm chỉ bằng cách đổi `sides` và
 * `taper`; `gable` lo phần mái dốc hai bên — thứ duy nhất `prism` không diễn tả nổi mà lại là
 * đường nét làm cho một khối hộp TRÔNG RA căn nhà.
 */

/**
 * Các "vai màu". Phần mô tả KHÔNG bao giờ nói màu cụ thể — nó chỉ nói vai trò, còn màu thật do
 * bảng màu theo kỷ + theo theme quyết định (`engine/city3d/palette3d.js`). Đây là cách giữ đúng
 * tinh thần luật "chỉ dùng CSS variable, cấm hardcode hex" ở một nơi mà CSS variable không với tới.
 */
export const PART_ROLES = [
  'wall',    // thân nhà
  'wall2',   // mảng tường phụ, sáng/tối hơn thân một chút cho đỡ phẳng
  'roof',    // mái
  'trim',    // gờ, diềm, bậc
  'wood',    // gỗ, giàn giáo, cột kèo
  'stone',   // đá, móng, tường thành
  'gold',    // điểm nhấn quý: chóp, tượng, biển hiệu
  'glass',   // cửa sổ, kính — ⚠️ BAN ĐÊM VAI NÀY TỰ PHÁT SÁNG (xem `glowRole` ở `sceneGraph.js`)
  'water',   // mặt ao hồ — TÁCH KHỎI `glass` có lý do, xem ngay dưới
  'leaf',    // tán lá ăn nắng
  // ⚠️ Mặt lá TRONG BÓNG — quan hệ với `leaf` giống hệt quan hệ `wall2` với `wall`, và vì cùng một
  // lý do. Tán cây từ Phase 8D là nhiều thuỳ chồng lấn; nếu mọi thuỳ cùng một vai thì chúng ra
  // cùng một màu và chỉ còn phân biệt được nhờ bóng đổ — mà ở cỡ vài chục điểm ảnh, bóng đổ giữa
  // hai khối sát nhau gần như không đọc ra. Một vai thứ hai là cách rẻ nhất để tán có chiều sâu
  // ngay cả khi đứng trong bóng râm.
  'leaf2',
  'dark',    // bóng sâu, cửa ra vào, khe hở
  /**
   * ROUND 51 (ADR-091): SẮT ĐÚC — cột đèn, trụ nước cứu hoả, nắp cống, ray tàu, cột chắn hiện đại.
   *
   * ⚠️ VÌ SAO PHẢI LÀ MỘT VAI RIÊNG chứ không dùng lại `trim`. Màu của `trim` là màu VẬT LIỆU DIỀM
   * của kỷ ấy, nên ở Manchester nó là GẠCH ĐỎ — và bức ảnh đầu tiên có cột đèn khí đỏ gạch cùng
   * một cái nắp cống MÀU HỒNG. Sắt đúc thì thời nào cũng gần như cùng một màu, đó chính là điều
   * đáng nói về nó; một vai lấy màu từ kỷ không thể phát biểu được câu ấy.
   * ⚠️ Nó cưỡi họ vật liệu `wood` (`materials.js`) — họ mà MỌI kỷ đều đã vẽ — nên không kỷ nào tốn
   * thêm một lệnh vẽ. Đó là điều kiện để thêm một vai mới ở dự án này.
   */
  'iron',
  // round 49 (ADR-089): the props that move, and fire — see `motion.js` (cloth flaps, hull/hook bob)
  // and `materials.js` (all ride the `wood` family so no era gains a draw call).
  'cloth',   // cờ, phướn, buồm, bạt, quần áo phơi — BAY theo gió
  'cloth2',  // màu vải thứ hai (dây phơi)
  'canvas',  // vải mộc chưa nhuộm: buồm, mái che, lều, khăn phơi — BAY
  'flag',    // vải NHUỘM màu nhấn của kỷ: cờ, phướn, cờ đuôi nheo — BAY
  'hull',    // thân thuyền — NHẤP NHÔ theo sóng
  'hook',    // dây và móc cẩu, gàu giếng — nhấp nhô
  'flame',   // ngọn lửa — tự phát sáng (khối glow), kèm `tag: 'fire'` cho lớp lửa
];

/**
 * ⚠️ VÌ SAO `water` PHẢI RIÊNG, KHÔNG DÙNG CHUNG `glass` NHƯ TRƯỚC — lỗi đã thấy tận mắt trong ảnh
 * chụp lúc 6 giờ sáng: giữa thành phố tối om nổi lên một TẤM VÀNG RỰC hình chữ nhật to bằng cả một
 * ô lưới. Đó là cái ao. Ban đêm mọi khối mang vai `glass` được tách sang khối "tự phát sáng" để
 * làm ô cửa sáng đèn — mà mặt nước cũng đang mượn vai `glass`, nên cái ao được đối xử y như một ô
 * cửa và biến thành hộp đèn.
 *
 * Bài học chung: **một vai màu KHÔNG chỉ là "màu gì" — nó còn là "được đối xử thế nào".** Ngày nào
 * vai chỉ dùng để tra màu thì kính và nước dùng chung là tiện; ngày vai bắt đầu quyết định hành vi
 * (phát sáng / không phát sáng) thì việc dùng chung lập tức thành lỗi. Cửa sổ tự phát sáng vì
 * trong nhà có đèn; mặt nước thì chỉ PHẢN CHIẾU — không có đèn nào thì nó tối, đúng như mọi vật
 * khác. Thêm vai mới rẻ hơn nhiều so với thêm một danh sách ngoại lệ phải nhớ cập nhật.
 */
const ROLE_SET = new Set(PART_ROLES);

/** Số cạnh cho phép của lăng trụ. Dưới 3 thì không thành khối; trên 12 thì tốn tam giác vô ích. */
/**
 * Hệ số phóng to công trình so với ô lưới: MỘT đơn vị của tầng mô tả = `BUILDING_SCALE` ô.
 *
 * ⚠️ Lớn hơn 1 là CỐ Ý: tầng mô tả nghĩ theo đơn vị "một ô", nhưng năm công trình rải trên lưới
 * 12×12 mà mỗi cái chỉ chiếm đúng một ô thì thành phố trông như năm hạt đậu trên bàn cờ (đã thấy
 * tận mắt ở ảnh chụp thử đầu tiên). Các khu đất cách nhau ít nhất 2,8 ô nên 1,3 vẫn an toàn tuyệt
 * đối — kỳ quan rộng nhất (1,7 ô) nở ra 2,2 ô, vẫn chưa chạm hàng xóm.
 *
 * ⚠️ NÓ CHUYỂN NHÀ VỀ ĐÂY NGÀY 2026-08-21, VÀ ĐÓ LÀ MỘT BẢN VÁ "MỘT LUẬT MỘT CÔNG THỨC" CÓ NỢ ĐÃ
 * GHI SẴN. Trước đó nó là một `const` riêng của `sceneGraph.js` — mà file ấy `import 'three'` nên
 * tầng THUẦN không nạp được, và hậu quả là con số 1,3 bị chép tay ra **sáu** bản: `humanTrace.js`
 * (kèm hẳn một chú thích tự nhận là nợ), `cityFocus.test.js`, `frame-fit.mjs`, `road-fit.mjs`,
 * `plan-coverage.mjs`, và `plinth-tri.mjs` — nơi bản chép ghi **0,86** (giá trị đời cũ) nên nó đếm
 * 3 bệ thay vì 31 rồi in ra một bảng trông hoàn toàn bình thường (2026-08-20).
 *
 * ⚠️ Hằng số này KHÔNG phải một chi tiết dựng hình: nó là tỉ lệ quy đổi giữa hai hệ đơn vị của
 * chính tầng mô tả (đơn vị khối ↔ ô lưới). Chỗ định nghĩa ngôn ngữ mô tả là chỗ đúng để nó đứng,
 * và từ đây mọi phép đo — kể cả phép đo THUẦN — đều hỏi được cùng một nguồn.
 */
export const BUILDING_SCALE = 1.3;

export const MIN_SIDES = 3;
// ⚠️ ROUND 47 (ADR-087): 12 → 16. Đàm unlocked the black box with «bớt góc cạnh · bo tròn nhiều
// hơn»; a 16-gon is where a column stops reading as a polygon at the sizes the city is drawn at.
// ⚠️ ROUND 54 (ADR-094): 16 → 24. Đàm chốt phong cách Pixar và gỡ trần số cạnh. Với pháp tuyến
// mềm (`render3d/smoothNormals.js`) thì 12 cạnh đã hết gãy về TÔ SÁNG, nhưng ĐƯỜNG VIỀN NGOÀI vẫn
// gãy đúng 12 nhịp — và viền ngoài mới là thứ mắt dùng để đọc hình dạng. Hai việc khác nhau.
// ⚠️ Thêm cạnh làm khối NHỎ ĐI, không to ra: quy ước "bề rộng ngang mặt phẳng = 1,0" cho bán kính
// ngoại tiếp `0,5 / cos(π/n)` — 16 cạnh là 0,50980, 24 cạnh là 0,50431. Hình bao chỉ co lại, nên
// luật số một của vòng 54 (cẩn thận `specSpan`) được thoả theo CẤU TRÚC, không nhờ một cái kẹp.
// ⚠️ ROUND 55, VIỆC 2: 24 → 96. VÀ ĐÂY LÀ CHỖ PHẢI ĐỌC KỸ NHẤT CẢ VÒNG, VÌ NÂNG SỐ NÀY MỘT MÌNH
// **KHÔNG ĐỔI MỘT ĐIỂM ẢNH NÀO**. `MAX_SIDES` chỉ là cái KẸP TRÊN của `prism()`; đo ra thì cả thành
// phố khai nhiều nhất là 12 (mái vòm), còn lại là 4 (325 chỗ) · 6 (63) · 8 (62) · 5 (26) · 10 (3).
// Không có khối nào chạm trần 24, nên trần ấy chưa bao giờ là thứ chặn đường.
// ⇒ Thứ quyết định độ tròn là **số cạnh KHAI Ở TỪNG CHỖ GỌI**, và đó là việc của `SIDES_*` dưới đây.
//   Trần này nâng lên chỉ để MỞ ĐƯỜNG cho chúng, không phải để tự nó làm gì.
// ⚠️ Bài học: khi một cái trần được nâng mà ảnh không đổi, đừng kết luận "số cạnh không ăn thua" —
// hãy hỏi xem có ai chạm tới cái trần ấy không. Vòng 47 và 54 đều nâng nó và đều ghi công nhầm chỗ.
export const MAX_SIDES = 96;

/*
  ══════════════════════════════════════════════════════════════════════════════════════════════
  BẢNG SỐ CẠNH THEO NGHĨA — ROUND 55, VIỆC 2.
  ══════════════════════════════════════════════════════════════════════════════════════════════
  Trước vòng này, "khối tròn" được khai bằng con số 8 viết thẳng vào chỗ gọi, ở 62 nơi. Chú thích
  của chính file này (mục QUY ƯỚC bên dưới) đã nói rõ `sides: 8` NGHĨA LÀ "trụ tròn / nón / nửa
  vòm" — tức con số 8 không bao giờ là một lựa chọn hình học, nó là một TỪ VỰNG. Nhưng vì nó là
  một con số trần trụi, muốn cho cả thành phố tròn hơn thì phải sửa 62 chỗ và chắc chắn sót.

  ⚠️ VÀ 8 CẠNH LÀ MỘT CON SỐ TỒI ĐÚNG THEO LUẬT CỦA VÒNG 54: hai mặt kề của khối 8 cạnh lệch nhau
  **45°**, tức NẰM TRÊN ngưỡng gãy 40° của `creaseNormals.js` ⇒ chúng **cố ý không được làm mềm**.
  Nên suốt vòng 54, mọi cây cột, ống khói, chóp nón của thành phố vẫn là tám tấm phẳng — trong khi
  thân người 20 cạnh đã tròn. Hai hệ số cạnh khác nhau cho hai thứ cùng phải tròn.

  ⇒ Từ đây mỗi NGHĨA có một tên, và đổi một con số là đổi mọi chỗ mang nghĩa ấy:
    · `SIDES_ROUND` 48 — cột, ống khói, chóp nón, nửa vòm. 360/48 = 7,5° ⇒ mềm tuyệt đối.
    · `SIDES_DOME`  72 — mái vòm, tháp tròn. To nhất, đường viền dài nhất, gãy khúc lộ nhất; kỷ 7
      (Duomo Firenze) và kỷ 9 (Panthéon Paris) sống chết bằng cái vòm của chúng.
    · `SIDES_PROP`  32 — thùng, chum, bánh xe, đèn, giếng. Nhỏ trên màn hình nên 32 đã quá đủ.
  ⚠️ KHÔNG ĐỤNG tới `sides: 6` và `sides: 5` (89 chỗ): chúng CỐ Ý có góc — lục giác, ngũ giác, và
  vòng 54 giữ chúng sắc bằng đúng ngưỡng 40°. Làm tròn chúng là xoá một sự đa dạng, không phải thêm.
  ⚠️ VÀ THÊM CẠNH LÀM KHỐI **NHỎ ĐI**, không to ra: bán kính ngoại tiếp `0,5 / cos(π/n)` giảm đơn
  điệu theo `n` — 8 cạnh 0,54120 · 32 cạnh 0,50241 · 48 cạnh 0,50107 · 72 cạnh 0,50048. Hình bao
  ADR-007 vì thế an toàn theo CẤU TRÚC, đúng luật số một của vòng 54 ("kẹp ngay từ đầu").
*/
export const SIDES_ROUND = 48;
export const SIDES_DOME = 72;
export const SIDES_PROP = 32;

function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeRole(role) {
  return ROLE_SET.has(role) ? role : 'wall';
}

/**
 * ROUND 48 (ADR-088) — THE SECOND AXIS. Until this round a part could only spin about the vertical
 * (`ry`), so a palm frond was a flat plate (a "✳" from the camera's height, `TECH_DEBT_3D #29`) and a
 * barrel tile could only stand up, never lie on its slope (#40). `rx`/`rz` tilt the part about its
 * OWN BASE CENTRE: the base stays where `x`/`z` put it and the top leans — `Rz(rz)` leans local +Y
 * toward local −X, `Rx(rx)` leans it toward local +Z, and the yaw `ry` turns the result last
 * (`geometryFactory.partWorld` builds `Ry · Rz · Rx`). A vertical prism tilted past 90° is a hinge:
 * that is how a frond now hangs from the crown instead of lying on it.
 * ⚠️ The keys are written ONLY when non-zero, so every spec that never asked for a tilt serialises
 * byte for byte as before — the GOLDEN digests of `block.test.js` must not move for a no-op.
 */
function tiltKeys(rx, rz) {
  const tx = finite(rx, 0);
  const tz = finite(rz, 0);
  if (tx === 0 && tz === 0) return {};
  return { rx: tx, rz: tz };
}

/** How far a tilted part's top sweeps outward from its base — 0 for an upright part. */
export function tiltReach(part) {
  const tx = part?.rx ?? 0;
  const tz = part?.rz ?? 0;
  if (!tx && !tz) return 0;
  return (part.h ?? 0) * Math.sin(Math.min(Math.PI / 2, Math.hypot(tx, tz)));
}

/**
 * Lăng trụ đều có thể thóp dần — hình nguyên thuỷ chủ lực.
 *
 * `sides` + `taper` phủ gần hết nhu cầu:
 *   - `sides: 4, taper: 1`    → hộp vuông (thân nhà)
 *   - `sides: 4, taper: 0`    → kim tự tháp (chóp tháp)
 *   - `sides: 4, taper: 0.6`  → tháp thóp dần (kiểu tháp canh)
 *   - `sides: 8, taper: 1`    → trụ tròn (cột, ống khói)
 *   - `sides: 8, taper: 0`    → nón (mái rơm, mái chóp)
 *   - `sides: 8, taper: 0.55` → nửa vòm (chồng 2 tầng thành mái vòm Phục Hưng)
 *
 * ⚠️ `y` là ĐÁY của khối, không phải tâm. Xếp chồng nhà theo tầng bằng cách cộng dồn chiều cao là
 * thao tác diễn ra hàng trăm lần trong file mô tả; lấy tâm làm gốc thì lần nào cũng phải chia đôi
 * và đó đúng là chỗ sinh lỗi lệch nửa tầng.
 */
export function prism({
  x = 0, y = 0, z = 0,
  w = 1, h = 1, d = null,
  sides = 4,
  taper = 1,
  ry = 0,
  rx = 0,
  rz = 0,
  role = 'wall',
  tag = null,
} = {}) {
  const width = Math.max(0, finite(w, 1));
  return {
    shape: 'prism',
    x: finite(x, 0),
    y: finite(y, 0),
    z: finite(z, 0),
    w: width,
    h: Math.max(0, finite(h, 1)),
    // Thiếu chiều sâu thì lấy bằng chiều rộng — phần lớn khối trong thành phố là vuông, viết
    // `d` mỗi lần chỉ làm file mô tả dài ra mà không thêm thông tin gì.
    d: Math.max(0, finite(d, width)),
    sides: Math.round(clamp(finite(sides, 4), MIN_SIDES, MAX_SIDES)),
    taper: clamp(finite(taper, 1), 0, 1),
    ry: finite(ry, 0),
    ...tiltKeys(rx, rz),
    // round 48: an optional semantic tag (`'stack'` = a chimney the smoke rises from). Written only
    // when given, so untagged specs serialise as before.
    ...(tag ? { tag: String(tag) } : {}),
    role: safeRole(role),
  };
}

/**
 * Mái dốc hai phía. Nóc chạy dọc trục X khi `ry = 0`.
 *
 * ⚠️ `w` là bề ngang CHÂN mái (bằng bề ngang thân nhà), `h` là chiều cao từ chân lên nóc. Mái
 * thò ra khỏi tường (`overhang`) là chi tiết nhỏ nhưng chính nó tạo ra vệt bóng dưới diềm mái —
 * thứ khiến khối trông có bề dày thay vì như dán giấy.
 */
export function gable({
  x = 0, y = 0, z = 0,
  w = 1, h = 0.5, d = null,
  ry = 0,
  rx = 0,
  rz = 0,
  role = 'roof',
} = {}) {
  const width = Math.max(0, finite(w, 1));
  return {
    shape: 'gable',
    x: finite(x, 0),
    y: finite(y, 0),
    z: finite(z, 0),
    w: width,
    h: Math.max(0, finite(h, 0.5)),
    d: Math.max(0, finite(d, width)),
    ry: finite(ry, 0),
    ...tiltKeys(rx, rz),
    role: safeRole(role),
  };
}

/**
 * ─── CẠNH VÁT (Phase 8B) ─────────────────────────────────────────────────────
 *
 * ⚠️ VÌ SAO CẦN. Audit Phase 8A đặt tên ba nguyên nhân làm thành phố đọc ra "low-poly"; Phase 8A
 * sửa hai, còn lại cái NẶNG NHẤT: cả hệ thống không có một cạnh vát nào, nên mọi cạnh là góc 90°
 * trần trụi. Ngoài đời gần như không tồn tại cạnh nhọn tuyệt đối — đá mòn, gỗ bào, bê tông đổ
 * khuôn đều có một dải hẹp ở mép, và chính dải ấy **bắt một vệt sáng** khi ánh sáng quét qua. Vệt
 * sáng viền đó mới là thứ nói cho mắt biết "đây là một vật có khối lượng" chứ không phải một hình
 * tô màu. Đây là lý do một khối vát 300 tam giác trông đặc hơn một khối nhọn 3.000 tam giác.
 *
 * ⚠️ VÌ SAO KÍCH THƯỚC VÁT LÀ MỘT **TỈ LỆ**, KHÔNG PHẢI MỘT SỐ. Một dải vát rộng 0,02 đơn vị đặt
 * lên thân nhà rộng 1,0 là mép vát 2% — vừa mắt. Đặt đúng con số ấy lên một gờ tầng DÀY 0,022 thì
 * nó **nuốt gần trọn** cái gờ, và cái gờ vừa dựng ở Phase 8A biến mất. Đây đúng bài học đã trả giá
 * ở Phase 7D và 5B: một hằng số tuyệt đối áp lên những khối chênh nhau hàng chục lần thì sớm muộn
 * cũng sai ở một đầu. Nên: vát = `cạnh mỏng nhất × BEVEL_RATIO`, chặn trên bởi `BEVEL_MAX`.
 *
 * ⚠️ VÀ NGƯỠNG NHÌN-THẤY-ĐƯỢC LÀ THỨ GIỮ NGÂN SÁCH. Đo ra: **cạnh mỏng nhất của khối TRUNG VỊ chỉ
 * là 0,035** (kính và gờ mảnh chiếm đa số) → vát ra 0,005, tức dưới nửa điểm ảnh ở khoảng cách
 * nhìn thường. Vát chúng là trả 2,3 lần tam giác để đổi lấy thứ không ai thấy. Bỏ qua khối quá mỏng
 * thì chi phí còn **×1,24** và chỉ ~18% số khối được vát — đúng những khối to tạo nên hình bóng.
 * Cái ngưỡng này KHÔNG phải một cách "tối ưu": nó là phát biểu rằng một dải hẹp hơn một điểm ảnh
 * thì không phải một dải.
 *
 * ⚠️ HÀM NÀY PHẢI ĐƯỢC GỌI TRÊN KHỐI **CHƯA NHÂN TỈ LỆ**. `sceneGraph.js` phóng mọi công trình lên
 * `BUILDING_SCALE = 1.3`; nếu nhà máy hình học quyết định dựa trên số ĐÃ nhân còn `countTriangles`
 * quyết định trên số CHƯA nhân, hai bên sẽ bất đồng ở đúng dải khối nằm sát ngưỡng — và bất đồng
 * đó im lặng, chỉ hiện ra dưới dạng ngân sách nói dối. Một luật, một công thức: quyết định ở đây,
 * nhà máy chỉ nhân bề rộng dải vát với tỉ lệ.
 */

/**
 * Dải vát rộng bao nhiêu phần cạnh mỏng nhất của khối.
 * ⚠️ ROUND 47 (ADR-087): 0,15 → 0,22 and `BEVEL_MAX` 0,035 → 0,06. `TECH_DEBT_3D #48` measured the
 * Phase 8B bevel BELOW the eye threshold at the default camera in 11/15 eras — a 3,5 % strip on a
 * 1-unit wall is 2–3 px in the City tab, i.e. "a mechanism that runs and does nothing" (PHASE_RULES
 * §10.2). The round's gate is a pair of photographs, bevel off / bevel on, that differ BY EYE; the
 * numbers below were raised until they did. Real chamfers and rounded quoins sit at 4–8 % of a
 * façade, so 6 % is inside the range architecture actually uses, not a cartoon.
 */
export const BEVEL_RATIO = 0.22;
/**
 * Trần tuyệt đối — thân nhà to mấy thì mép vát cũng chỉ là một dải hẹp, không phải một mặt cắt.
 *
 * ⚠️ CHỌN BẰNG BẢNG ĐO, KHÔNG BẰNG CẢM GIÁC (đúng cách đã dùng cho `ENV_DIFFUSE` ở Phase 7A). Dựng
 * cùng một cảnh kỷ 11 lúc 16 giờ có vát và không vát rồi đếm điểm ảnh đổi ĐỦ ĐỂ MẮT THẤY (>24/765):
 *     0,020 → 3,3%   ·   **0,035 → 3,8%**   ·   0,050 → 4,4%   ·   0,070 → 4,9%
 * Lợi ích tăng đều nhưng giảm dần, còn **chi phí tam giác thì KHÔNG đổi theo con số này** (vẫn
 * đúng ba vành mặt bên) — nên thứ chặn tay không phải hiệu năng mà là mỹ thuật: 0,070 trên một
 * mảng nhà rộng 0,5 là ăn 14% mỗi bên, lúc ấy nó thôi là cái mép vát và bắt đầu là một khối thóp
 * khác hẳn. Mép vát của kiến trúc thật rơi vào khoảng 2–5% bề mặt; 0,035 trên thân nhà rộng 1 đơn
 * vị là 3,5%, nằm giữa dải đó.
 */
// ⚠️ ROUND 54 (ADR-094), Việc 3: 0,06 → 0,14. Trong hoạt hình 3D **không tồn tại một cạnh sắc lý
// tưởng nào** — mọi cạnh đều bo nhẹ để bắt một vệt sáng chạy dọc, và chính vệt sáng ở mép đó là
// thứ làm khối trông "đắt". 0,06 là mức chỉ nhìn thấy ở cận cảnh; 0,14 là mức đọc được ở tầm mắt.
// ⚠️ VÁT LÀ CẮT VÀO GÓC, tức khối chỉ NHỎ ĐI — lại một lần nữa hình bao an toàn theo cấu trúc.
// ⚠️ ĐỪNG NÂNG QUÁ 0,2: `BEVEL_RATIO` nhân với cạnh NGẮN NHẤT của khối, nên một khối dẹt (bệ cửa
// sổ, gờ phào của vòng 53) sẽ bị vát hết chiều dày và biến thành một cái nêm.
export const BEVEL_MAX = 0.14;
/**
 * Hẹp hơn mức này thì dưới một điểm ảnh ở khoảng cách nhìn thường ⇒ không vát, khỏi tốn.
 * ⚠️ ROUND 47: 0,006 → 0,014. With `BEVEL_RATIO` 0,22 the old floor let window reliefs (0,035 thick)
 * and every 0,055 moulding earn a bevel AND four rounded corners — 92 triangles each for a strip
 * under one pixel wide, and the city tripled its triangles for nothing the eye could see (measured:
 * era 6 198k → 640k). At the default camera one grid unit is ~80 px in the City tab, so 0,014 is
 * about one pixel: the floor of "a strip is a strip". Bodies, roofs and plinths keep their bevel;
 * frames, sills and cornices keep their old shape byte for byte.
 */
export const BEVEL_MIN_VISIBLE = 0.014;

/**
 * ⚠️ ROUND 47 (ADR-087) — THE BOX LOSES ITS CORNERS, NOT JUST ITS EDGES.
 *
 * Phase 8B chamfered the TOP and BOTTOM edges of a prism (three bands instead of one). From the
 * default camera those two edges are one horizontal line each; what the eye reads as "a box" is
 * the four VERTICAL corners, and those stayed razor-sharp. So a 4-sided prism that earns a bevel
 * now also rounds its four vertical corners: each corner becomes an arc of `CORNER_SEGMENTS`
 * segments with the same radius as the bevel, i.e. the ring has `4 + 4 × CORNER_SEGMENTS` vertices
 * instead of 4. Two segments is the least that reads as a CURVE rather than a second chamfer; the
 * arc faces sit at ±30° and catch the sun and the rim light differently from both walls they join,
 * which is exactly the highlight a rounded quoin gives in a painting.
 *
 * Only `sides: 4`: a polygon with more sides already has soft corners. Only when the part earns a
 * bevel (`bevelWidth > 0`): thin trims keep their old shape byte for byte, so the ground-floor
 * mouldings of Phase 10 are untouched. `countTriangles` and `geometryFactory.emitPrism` read this
 * SAME constant — one law, one number (the "budget must not lie" test rebuilds all 15 eras and
 * counts the real vertex buffer against the arithmetic here).
 */
export const CORNER_SEGMENTS = 2;

/** Vertices in one ring of a prism, given its side count and whether its corners are rounded. */
export function ringVertexCount(sides, rounded) {
  return sides === 4 && rounded ? 4 + 4 * CORNER_SEGMENTS : sides;
}

/**
 * A plan narrower than this keeps square corners: window sills, frames, mouldings and courses are
 * exactly the parts whose corner radius would be under a pixel and whose count is in the hundreds.
 * A quarter of a cell is where a corner starts to be a corner the eye can see.
 */
export const CORNER_MIN_PLAN = 0.25;

/**
 * Radius of the ROUNDED VERTICAL CORNERS of a 4-sided prism, in grid units. `0` = square corners.
 *
 * ⚠️ WHY THIS IS SEPARATE FROM `bevelWidth` (round 47, found by photograph). The first pass rounded
 * corners only where the top/bottom edges were beveled, and `bevelWidth` reads the THINNEST of the
 * three dimensions — so a cornice 1 unit wide and 0,05 tall got nothing. But the box look of a
 * building is carried by exactly those wide, thin plates: cornices, plinths, roof caps, the
 * spreading courses. Their PLAN corners are large and visible; their EDGES are not. So the corner
 * radius reads the plan (`min(w, d)`) and the edge bevel reads all three — two questions, two
 * answers, the same two constants.
 */
export function cornerRadius(part) {
  if (!part || part.shape === 'gable' || (part.sides ?? 4) !== 4) return 0;
  if (!(part.taper > 0)) return 0;
  const plan = Math.min(part.w ?? 0, part.d ?? 0);
  if (!(plan >= CORNER_MIN_PLAN)) return 0;
  const r = Math.min(BEVEL_MAX, plan * BEVEL_RATIO);
  return r >= BEVEL_MIN_VISIBLE ? r : 0;
}

/**
 * Bề rộng dải vát của MỘT khối, đơn vị ô lưới. `0` nghĩa là khối này không vát.
 * Thuần và tất định — cùng một khối luôn ra cùng một con số, vĩnh viễn (bất biến bảo tàng).
 */
export function bevelWidth(part) {
  if (!part) return 0;
  // Khối thóp về MỘT ĐIỂM (chóp, nón, kim tự tháp) đã nhọn theo thiết kế — vát đỉnh nhọn là cắt
  // cụt cái chóp, tức phá đúng hình bóng mà nó sinh ra để tạo. (Round 47 kept this on purpose:
  // Đàm asked for "bo tròn nhiều hơn", and a rounded apex is a CUT apex — a cone that stops being a
  // cone. The silhouette wins.)
  if (part.shape !== 'gable' && !(part.taper > 0)) return 0;
  const thinnest = Math.min(part.w ?? 0, part.d ?? 0, part.h ?? 0);
  if (!(thinnest > 0)) return 0;
  const width = Math.min(BEVEL_MAX, thinnest * BEVEL_RATIO);
  return width >= BEVEL_MIN_VISIBLE ? width : 0;
}

/**
 * VÁT CHÂN CỦA MỘT KHỐI THÓP VỀ MỘT ĐIỂM — ROUND 54 (ADR-094), Việc 3.
 *
 * ⚠️ VÌ SAO ĐÂY LÀ MỘT HÀM RIÊNG CHỨ KHÔNG PHẢI MỘT NHÁNH TRONG `bevelWidth`. `bevelWidth` trả lời
 * đúng MỘT câu: *"dải vát ở HAI ĐẦU một khối lăng trụ rộng bao nhiêu"*, và cả nhà máy hình học lẫn
 * `countTriangles` đọc nó theo nghĩa ấy (ba vành mặt bên). Một cái chóp không có hai đầu — nó có
 * một cái chân và một cái mũi. Nhét câu trả lời thứ hai vào cùng một hàm là đúng họ bài học
 * *"một trường gánh hai việc"* đã trả giá tám lần trong dự án này.
 *
 * ⚠️ CHỈ VÁT CHÂN, KHÔNG VÁT MŨI — và câu này KHÔNG đổi so với vòng 47. Một cái chóp bị cắt cụt
 * mũi thì thôi là cái chóp; hình bóng thắng. Thứ vòng 54 nhận ra là **cái chân thì khác hẳn cái
 * mũi**: chỗ sườn chóp gặp mặt đáy là một cạnh 90° chạy vòng quanh, và nó nằm đúng ở chân trời
 * của vật — chỗ mắt đọc "vật này đặt lên hay cắm vào". Làm mềm góc gãy (vòng 54, Việc 1) KHÔNG
 * chạm được vào cạnh ấy, vì 90° nằm trên ngưỡng gãy 40°. Chỉ hình học mới gỡ được.
 *
 * ⚠️ VÀ NÓ KHÔNG LÀM KHỐI TO RA: vành đáy THỤT VÀO `b`, vành gối ở `y + b` giữ nguyên bề rộng đầy
 * đủ. Chỗ rộng nhất vẫn đúng chỗ cũ, chiều cao vẫn đúng cũ ⇒ hình bao ADR-007 an toàn theo CẤU
 * TRÚC, không nhờ may mắn. (Luật số một của vòng 54: *"kẹp mọi thứ nở ra trong hình bao cũ ngay
 * từ đầu, đừng chờ test bắt"*.)
 *
 * ⚠️ THÊM TRẦN THEO CHIỀU CAO (`h * 0.25`) mà `bevelWidth` không cần: một cái chóp CAO thì vát chân
 * là một dải hẹp, nhưng một cái chóp BẸT (mái vòm thấp, gờ nhọn) có thể bị vát ăn hết nửa thân và
 * biến thành một cái đĩa. `bevelWidth` không gặp chuyện này vì nó đã đọc cạnh MỎNG NHẤT, trong đó
 * có `h`; ở đây `h` phải được hỏi riêng vì dải vát chỉ nằm ở MỘT đầu.
 */
export function footBevel(part) {
  if (!part) return 0;
  if (part.shape === 'gable' || part.taper > 0) return 0;
  const plan = Math.min(part.w ?? 0, part.d ?? 0);
  const h = part.h ?? 0;
  if (!(plan > 0) || !(h > 0)) return 0;
  const width = Math.min(BEVEL_MAX, plan * BEVEL_RATIO, h * 0.25);
  return width >= BEVEL_MIN_VISIBLE ? width : 0;
}

/**
 * Số tam giác của MỘT khối. Đây là con số dùng cho cả ngân sách hiệu năng lẫn bảng HUD, nên nó
 * phải khớp CHÍNH XÁC với số tam giác nhà máy hình học thật sự sinh ra — một ngân sách tự tính
 * riêng mà lệch với thực tế thì còn tệ hơn không có ngân sách.
 *
 * ⚠️ CÂU TRÊN TỪNG NÓI DỐI SUỐT TỪ PHASE 3B. Nó viết là "có test đối chiếu hai bên", nhưng bài
 * test duy nhất tồn tại chỉ so hàm này với **những con số viết cứng**, trên những khối không hề có
 * `w`/`d`/`h` — nó chưa bao giờ chạm vào nhà máy hình học, nên hai bên có thể lệch tuỳ ý mà không
 * gì đỏ lên. Bài đối chiếu THẬT nay nằm ở `render3d/geometryFactory.test.js` ("NGÂN SÁCH KHÔNG NÓI
 * DỐI"): nó dựng cả 15 kỷ rồi đếm thẳng từ bộ đệm đỉnh của khối hình học. Phase 8B mới làm chuyện
 * này thành nguy hiểm thật, vì kể từ đây **một khối đổi số tam giác tuỳ theo kích thước của chính
 * nó** — hai bên buộc phải đọc chung một `bevelWidth`, không được ai tự suy ra.
 */
export function countTriangles(part) {
  if (!part) return 0;
  if (part.shape === 'gable') {
    // 2 mặt dốc (2 tam giác mỗi mặt) + 2 đầu hồi tam giác + đáy (2 tam giác) = 8.
    // ⚠️ ROUND 47: a gable that earns a bevel gets a ROUNDED RIDGE — the ridge line becomes a narrow
    // flat cap (2 triangles) and each gable end becomes a quad (2 triangles instead of 1) ⇒ 12.
    // Phase 8B returned 0 for every gable, which left the whole skyline of seven eras razor-edged.
    return bevelWidth(part) > 0 ? 12 : 8;
  }
  const n = part.sides ?? 4;
  if (part.taper === 0) {
    // thóp về một điểm: mặt bên thành tam giác, không còn mặt trên
    // ⚠️ ROUND 54, Việc 3: có vát chân ⇒ thêm một vành mặt bên (2n) giữa vành đáy và vành gối.
    // Đáy (n − 2) + vành vát (2n) + sườn lên mũi (n). Con số này PHẢI khớp nhà máy hình học —
    // bài "NGÂN SÁCH KHÔNG NÓI DỐI" đếm thẳng từ bộ đệm đỉnh của cả 15 kỷ.
    return footBevel(part) > 0 ? (n - 2) + 2 * n + n : n + (n - 2);
  }
  // Vát hai đầu ⇒ mặt bên chia làm BA vành (dải vát dưới · thân · dải vát trên) thay vì một.
  const bands = bevelWidth(part) > 0 ? 3 : 1;
  // Round 47: a box with a wide enough plan rounds its four vertical corners — more vertices per ring.
  const m = ringVertexCount(n, cornerRadius(part) > 0);
  return bands * 2 * m + 2 * (m - 2);
}

/** Tổng tam giác của một danh sách khối. */
export function countSpecTriangles(parts) {
  if (!Array.isArray(parts)) return 0;
  let total = 0;
  for (const part of parts) total += countTriangles(part);
  return total;
}

/**
 * Chiều cao đỉnh của một danh sách khối — dùng để đặt khung bóng đổ và ngắm camera cho vừa.
 * Lấy `y + h` chứ không phải chỉ `h`, vì khối xếp chồng có `y` khác nhau.
 */
export function specHeight(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return 0;
  let top = 0;
  for (const part of parts) top = Math.max(top, (part?.y ?? 0) + (part?.h ?? 0));
  return top;
}

/**
 * Bề ngang lớn nhất mà danh sách khối chiếm — để công trình không lấn sang ô bên cạnh.
 * Tính theo hình bao vuông (không xoay), hơi rộng hơn thực tế một chút khi khối có `ry` — cố ý:
 * ước lượng THỪA thì cùng lắm là hai nhà cách nhau hơi xa, ước lượng THIẾU thì chúng cắm vào nhau.
 */
export function specSpan(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return 0;
  let span = 0;
  for (const part of parts) {
    if (!part) continue;
    const halfW = (part.w ?? 0) / 2;
    const halfD = (part.d ?? 0) / 2;
    // khối xoay thì hình bao của nó nở ra tới đường chéo
    const reach = (part.ry ? Math.hypot(halfW, halfD) : Math.max(halfW, halfD)) + tiltReach(part);
    span = Math.max(
      span,
      Math.abs(part.x ?? 0) + reach,
      Math.abs(part.z ?? 0) + reach,
    );
  }
  return span * 2;
}

/**
 * Ô ĐẤT mà một công trình chiếm, tính bằng ô lưới — dùng để hỏi địa hình xem chân nó có hụt không.
 * ⚠️ MỘT LUẬT MỘT CÔNG THỨC: `sceneGraph.js` (bên DỰNG), `scripts/plinth-tri.mjs` (bên ĐO) và bài
 * canh ngân sách tam giác đều gọi hàm này. Bản chép tay của phép nhân `BUILDING_SCALE` từng sai
 * một lần và đếm 3 bệ thay vì 31 (2026-08-20) — sau đó số hằng đã dọn về đây, nay tới lượt công
 * thức.
 */
export function buildingSpanCells(parts) {
  return Math.max(1, Math.round(specSpan(parts) * BUILDING_SCALE));
}

/**
 * BỆ KÈ dưới chân một công trình vắt qua mép thềm — khối đá lấp phần hụt.
 *
 * ⚠️ NÓ TỐN **28** TAM GIÁC KHI CÓ VÁT, 12 KHI KHÔNG — và chú thích cũ ở `sceneGraph.js` ghi "chỉ
 * tốn 12 tam giác" như thể đó là con số DUY NHẤT. Câu ấy đúng ở thời một lăng trụ 4 cạnh luôn là
 * 2×4 + 2×(4−2) = 12; **Phase 8B làm bề rộng vát phụ thuộc KÍCH THƯỚC của chính khối**, nên bệ kè
 * đủ lớn thì có vát ⇒ mặt bên chia làm BA vành ⇒ 3×2×4 + 2×2 = **28**. Con số 12 đứng yên nhiều
 * tháng vì không có gì đặt nó cạnh phép đo — đúng hình dạng `TECH_DEBT #43`, lần này ở một chú
 * thích thay vì một bảng.
 * ⚠️ VÀ ĐỪNG ĐỌC NGƯỢC LẠI THÀNH "12 ĐÃ CHẾT" — đó là bản vá tôi suýt ship. Đếm đủ 27 bệ của cả 15
 * kỷ (2026-09-05): **26 bệ tốn 28, ĐÚNG MỘT bệ tốn 12** (nó quá mỏng để có vát). Ngoại lệ ấy được
 * đếm tường minh ở `triangleBudget.test.js` chứ không bị làm tròn đi. Chênh lệch giữa phép đếm
 * thuần và phép duyệt cảnh thật khớp TỪNG ĐƠN VỊ ở bốn kỷ đã đối chiếu (kỷ 6: 4 bệ ⇒ +112 · kỷ 8:
 * 1 bệ ⇒ +28).
 *
 * @param {number} span  bề ngang ô đất (`buildingSpanCells`)
 * @param {number} drop  phần hụt so với cao độ đứng
 * @returns {object|null} `null` khi không hụt — không hụt thì KHÔNG có bệ, chứ không phải bệ cao 0
 */
export function plinthParts(span, drop) {
  if (!(drop > 0)) return null;
  return [prism({
    y: 0, w: span * 0.92, d: span * 0.92, h: drop, sides: 4, taper: 1, role: 'stone',
  })];
}

/**
 * Hình bao CHỮ NHẬT thật của một danh sách khối — trả về `{w, d}` theo đúng hai trục X/Z.
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG `specSpan` CHO VIỆC NÀY. `specSpan` trả về MỘT con số: cạnh của hình VUÔNG
 * bao ngoài, và nó cố ý ước lượng THỪA (khối xoay được tính tới đường chéo). Điều đó đúng cho việc
 * nó sinh ra — *"chừa chỗ để hai nhà không cắm vào nhau"* — nhưng sai cho câu hỏi *"căn nhà này
 * rộng bao nhiêu, sâu bao nhiêu"*. Đo thử trên nhà dân 15 kỷ: `specSpan × BUILDING_SCALE` ra 0,933 ô
 * ở kỷ 1 trong khi hình bao thật là 0,725 × 0,553 — thừa 29% ở trục rộng và không nói gì về trục sâu.
 * Chia một ô thành khu phố mà dùng con số thừa ấy thì mỗi đơn vị bị co nhỏ hơn chỗ thật sự có.
 *
 * ⚠️ *"Một bán kính chỉ là bán kính khi vật thể TRÒN"* — cùng bài học, ở đây là *"một con số chỉ tả
 * được hình bao khi hình bao VUÔNG"*. Hàm này trả về HAI số vì mặt bằng nhà không vuông.
 */
export function specFootprint(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return { w: 0, d: 0 };
  let x0 = Infinity; let x1 = -Infinity; let z0 = Infinity; let z1 = -Infinity;
  for (const part of parts) {
    if (!part) continue;
    const ry = part.ry ?? 0;
    const c = Math.abs(Math.cos(ry));
    const s = Math.abs(Math.sin(ry));
    const lean = tiltReach(part);   // round 48: a leaning top sweeps outward — count it, conservatively on both axes
    const halfW = ((part.w ?? 0) / 2) * c + ((part.d ?? 0) / 2) * s + lean;
    const halfD = ((part.w ?? 0) / 2) * s + ((part.d ?? 0) / 2) * c + lean;
    const x = part.x ?? 0;
    const z = part.z ?? 0;
    x0 = Math.min(x0, x - halfW); x1 = Math.max(x1, x + halfW);
    z0 = Math.min(z0, z - halfD); z1 = Math.max(z1, z + halfD);
  }
  if (!Number.isFinite(x0)) return { w: 0, d: 0 };
  return { w: x1 - x0, d: z1 - z0 };
}
