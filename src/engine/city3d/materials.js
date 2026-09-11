/**
 * materials.js — TRỤC THỨ TƯ của ngôn ngữ hình khối: bề mặt PHẢN ỨNG với ánh sáng như thế nào.
 *
 * THUẦN: chỉ dữ liệu + tra cứu. Không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ VÌ SAO FILE NÀY RA ĐỜI — NGUYÊN NHÂN GỐC CỦA CẢM GIÁC "KHỐI MÀU PHẲNG".
 * Đàm nhìn thành phố và nói nó "quá khối, vật liệu phẳng, giống prototype". Đi tìm thì thủ phạm
 * KHÔNG nằm ở số tam giác, không nằm ở bảng màu, cũng không nằm ở đèn: nó nằm ở đúng MỘT dòng —
 * toàn bộ thành phố dùng chung một `MeshLambertMaterial`.
 *
 * Lambert là mô hình khuếch tán THUẦN. Độ sáng của một điểm chỉ bằng `màu × (hướng đèn · pháp
 * tuyến)`. Trong công thức đó **không hề có số hạng phản chiếu**. Nghĩa là: kính, ngói men lưu ly,
 * mái kẽm Paris, mái tranh sông Nin và tường gạch bùn — về mặt TOÁN HỌC là **cùng một bề mặt**,
 * chỉ khác nhau ở màu. Mà mắt người nhận ra vật liệu chủ yếu qua **cách nó bóng**, không phải qua
 * sắc độ: một tấm kính và một tấm bìa cùng màu lam thì ta phân biệt được ngay, và thứ giúp ta
 * phân biệt là vệt sáng trượt trên mặt kính — đúng cái Lambert không có.
 *
 * ⇒ Đổi sang PBR (`MeshStandardMaterial`), mỗi họ vật liệu khai hai con số: `roughness` (nhám tới
 * đâu — 0 là gương, 1 là nhung) và `metalness` (kim loại hay không). Đây là cùng một loại sửa với
 * Phase 5B (`storyHeight` gánh hai việc): trước đây "màu" đang phải gánh cả việc mô tả VẬT LIỆU,
 * và một trường thì không bao giờ tách nổi hai thứ nó đang trộn.
 *
 * ⚠️ BẪY CHẾT NGƯỜI, ĐỌC TRƯỚC KHI KHAI BẤT KỲ `metalness` NÀO:
 * Kim loại gần như KHÔNG có thành phần khuếch tán — toàn bộ màu của nó đến từ thứ nó PHẢN CHIẾU.
 * Cho nên `metalness: 0.9` mà cảnh **không có bản đồ môi trường** sẽ ra một khối **ĐEN THUI**, và
 * nó đen một cách rất thuyết phục (trông như "vật liệu tối màu" chứ không như lỗi). Bản đồ môi
 * trường vì vậy KHÔNG phải phần thưởng thêm — nó là **điều kiện cần** để được phép khai kim loại.
 * `sceneGraph.js` dựng một bầu trời thu nhỏ qua `PMREMGenerator` đúng vì lý do này; gỡ nó đi thì
 * mái kẽm kỷ 9, mái đồng kỷ 11 và chóp vàng mọi kỷ sẽ đen sạch.
 *
 * ⚠️ VÌ SAO CHIA "HỌ" CHỨ KHÔNG PHẢI MỖI KHỐI MỘT VẬT LIỆU:
 * Cả thành phố gộp thành MỘT khối hình học để chỉ tốn một lệnh vẽ (xem `geometryFactory.js`). Một
 * khối hình học thì chỉ nhận được một vật liệu — trừ khi chia nhóm (`addGroup`). Mỗi nhóm là một
 * lệnh vẽ, nên số họ phải NHỎ. 15 họ dưới đây phủ hết 15 kỷ, và một kỷ điển hình chỉ dùng 5–7 họ
 * ⇒ 5–7 lệnh vẽ cho cả thành phố. So với 750 lệnh nếu vẽ rời từng khối, đây vẫn là rẻ mạt.
 */

/**
 * Bảng họ vật liệu. `roughness`/`metalness` là hai con số PBR chuẩn, không phải hệ số tự chế.
 *
 * ⚠️ MỌI CON SỐ Ở ĐÂY PHẢI TRẢ LỜI ĐƯỢC "ngoài đời sờ vào thấy thế nào?" — y như luật đã áp cho
 * `country`/`landmark` ở `eraStyle.js`. Không trả lời được thì con số ấy là tuỳ hứng, và tuỳ hứng
 * chính là thứ đã sinh ra 15 kỷ dùng chung một bề mặt.
 *
 * `sheen` (0..1) là mức "ánh nhung" — dành riêng cho vật liệu sợi (rơm, lá, da thú) vốn hắt sáng ở
 * rìa chứ không phản chiếu thành đốm. Ba số này đủ để phân biệt cả 15 họ mà không cần texture.
 */
export const MATERIAL_FAMILIES = {
  //          nhám  kim loại  nhung   ngoài đời là gì
  thatch:   { roughness: 0.97, metalness: 0.00, sheen: 0.55 }, // rơm, lá cọ, da thú căng
  wood:     { roughness: 0.80, metalness: 0.00, sheen: 0.10 }, // gỗ xẻ, cột kèo, giàn giáo
  dirt:     { roughness: 0.99, metalness: 0.00, sheen: 0.00 }, // ĐẤT NỆN rời — mặt đường chưa lát
  mudbrick: { roughness: 0.94, metalness: 0.00, sheen: 0.00 }, // gạch bùn phơi nắng, đất nện
  brick:    { roughness: 0.84, metalness: 0.00, sheen: 0.00 }, // gạch nung đỏ
  stone:    { roughness: 0.74, metalness: 0.00, sheen: 0.00 }, // đá tảng, đá vôi, sa thạch
  plaster:  { roughness: 0.68, metalness: 0.00, sheen: 0.00 }, // vữa trát, tường quét vôi
  tile:     { roughness: 0.52, metalness: 0.00, sheen: 0.00 }, // ngói nung — nhẵn hơn tường rõ rệt
  glazed:   { roughness: 0.30, metalness: 0.04, sheen: 0.00 }, // ngói men, lưu ly — BÓNG như sứ
  slate:    { roughness: 0.46, metalness: 0.08, sheen: 0.00 }, // đá phiến chẻ, ướt thì loáng
  concrete: { roughness: 0.90, metalness: 0.00, sheen: 0.00 }, // bê tông đúc, bê tông quân sự
  metal:    { roughness: 0.40, metalness: 0.70, sheen: 0.00 }, // kẽm, đồng, thép mạ
  gold:     { roughness: 0.27, metalness: 0.92, sheen: 0.00 }, // vàng, đồng thau đánh bóng
  glass:    { roughness: 0.12, metalness: 0.20, sheen: 0.00 }, // kính phản quang
  water:    { roughness: 0.04, metalness: 0.02, sheen: 0.00 }, // mặt nước lặng
  foliage:  { roughness: 0.88, metalness: 0.00, sheen: 0.28 }, // tán lá — hắt sáng ở rìa
};

/**
 * Thứ tự CỐ ĐỊNH của các họ khi gộp hình học.
 *
 * ⚠️ ĐÂY LÀ MỘT HỢP ĐỒNG, KHÔNG PHẢI MỘT DANH SÁCH CHO ĐẸP. `geometryFactory.js` đổ tam giác theo
 * đúng thứ tự này rồi đánh dấu từng nhóm; `sceneGraph.js` dựng mảng vật liệu theo đúng thứ tự đó.
 * Hai bên tự sắp xếp riêng thì mái sẽ mang vật liệu của mặt nước — một lỗi mà mắt thấy ngay nhưng
 * đọc code thì không, vì cả hai bên đều "đúng" theo cách hiểu của riêng nó.
 */
/*
  ⚠️ ROUND 54 (ADR-094), VIỆC 10 — NĂM HỌ BÓNG NHẤT ĐƯỢC NHÁM THÊM MỘT BẬC, VÀ NƯỚC THÌ KHÔNG.
  Đàm: *"vật liệu mềm hơn: giảm tương phản specular, hơi ẩm/mềm."* Trong PBR, `roughness` quyết
  chính xác điều đó: đốm sáng gương hẹp và gắt (nhám thấp) hay loang rộng và dịu (nhám cao). Cùng
  một lượng ánh sáng, chỉ khác nó dồn vào mấy điểm ảnh.
      glazed 0,22 → 0,30 · slate 0,40 → 0,46 · metal 0,32 → 0,40 · gold 0,20 → 0,27 · glass 0,06 → 0,12
  ⚠️ **`water` GIỮ NGUYÊN 0,04, VÀ ĐÓ LÀ QUYẾT ĐỊNH CHỨ KHÔNG PHẢI SÓT.** Mặt nước phẳng lặng thì
  ĐÚNG là một cái gương — vòng 49 và 53 đã mua ảnh phản chiếu trên mặt nước ướt bằng đúng con số
  này. "Làm mềm cho nhất quán" ở đây là đổi một sự thật vật lý lấy một sự nhất quán trên giấy.
  ⚠️ VÀ ĐỪNG NÂNG TIẾP: quá 0,5 thì `metal` và `gold` thôi đọc ra là kim loại (kim loại nhám là
  kim loại XỈN), tức mất đúng thứ bảng này sinh ra để phân biệt. Mềm, không phải xỉn.
*/
export const MATERIAL_ORDER = Object.keys(MATERIAL_FAMILIES);

/** Họ dùng khi gặp tên lạ (dữ liệu hỏng) — thà ra một mặt tường trát còn hơn nổ. */
export const FALLBACK_FAMILY = 'plaster';

/**
 * Vai màu nào ĐÃ TỰ NÓI RA vật liệu của nó, không cần hỏi kỷ.
 *
 * ⚠️ `wall`/`wall2`/`roof`/`trim` CỐ Ý VẮNG MẶT ở đây: chúng là ba thứ DUY NHẤT đổi theo nền văn
 * minh. Tường của kỷ 1 là đá xếp, của kỷ 10 là gạch nung, của kỷ 14 là kính — cùng một vai, ba
 * vật liệu khác hẳn. Đó chính là chỗ `eraStyle` phải lên tiếng.
 */
const ROLE_FAMILY = {
  wood: 'wood',
  stone: 'stone',
  gold: 'gold',
  glass: 'glass',
  water: 'water',
  leaf: 'foliage',
  // Mặt lá trong bóng vẫn là LÁ: cùng độ nhám, cùng độ bóng — chỉ khác màu. Cho nó một họ vật liệu
  // riêng là tự thêm một lệnh vẽ cho mỗi thành phố mà không đổi được gì trên màn hình.
  leaf2: 'foliage',
  // Round 49 (ADR-089): the props that move. Every new role maps onto an EXISTING family on purpose —
  // a new family is a new draw call in every era (`drawCallBudget.test.js`) and `thatch`/`gold` are
  // not drawn by every era either — `wood` is, so all five ride on it (a cloth is matte enough). `flame` lives in the glow sink (unlit), so its
  // family only matters for the rare part that is not glowing.
  cloth: 'wood',
  cloth2: 'wood',
  canvas: 'wood',
  flag: 'wood',
  hull: 'wood',
  hook: 'wood',
  flame: 'wood',
  // round 51 (ADR-091): cast iron. Matte and dark, so the `wood` family's roughness fits it exactly —
  // and `wood` is drawn by all 15 eras, which is the condition for adding a role at all.
  iron: 'wood',
};

/**
 * Vai màu + ngữ pháp kỷ → họ vật liệu.
 *
 * @param {string} role  một giá trị của `PART_ROLES` (`parts.js`)
 * @param {object} [style] kết quả `getEraStyle(era)`
 * @returns {string} khoá trong `MATERIAL_FAMILIES` — LUÔN hợp lệ
 */
export function materialFamilyFor(role, style = null) {
  const direct = ROLE_FAMILY[role];
  if (direct) return direct;

  if (role === 'roof') return safeFamily(style?.roofMaterial);
  if (role === 'trim') return safeFamily(style?.trimMaterial ?? style?.wallMaterial);
  // `dark` = cửa ra vào, khe hở, bóng sâu. Nó là một MẢNG TỐI TRÊN CHÍNH BỨC TƯỜNG, nên phải bóng
  // giống tường — cho nó vật liệu riêng thì lỗ cửa sẽ bắt sáng khác mặt tường quanh nó và lộ ra
  // như một miếng dán.
  return safeFamily(style?.wallMaterial);
}

function safeFamily(name) {
  return Object.prototype.hasOwnProperty.call(MATERIAL_FAMILIES, name) ? name : FALLBACK_FAMILY;
}

/**
 * Tra thông số của một họ. Luôn trả về đối tượng dùng được.
 */
export function materialProfile(family) {
  return MATERIAL_FAMILIES[safeFamily(family)];
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BÓNG TIẾP XÚC (contact ambient occlusion) nướng thẳng vào màu đỉnh.
 *
 * ⚠️ VÌ SAO VẪN NƯỚNG SẴN, DÙ TỪ VÒNG 52 ĐÃ CÓ SSAO THẬT — CÂU NÀY ĐÃ ĐƯỢC VIẾT LẠI 2026-09-11.
 * Bản cũ ở đây nói *"KHÔNG dùng SSAO"* vì nó là một lượt hậu kỳ toàn màn hình, đắt trên điện thoại,
 * và phá render-on-demand. Lý do ấy đo được và đúng ở thời điểm nó được viết; **Đàm gỡ nó ở vòng 52**
 * (*"Máy tôi rất mạnh. Lag thì tôi nói."*) và nay `postFx.js` chạy một lượt GTAO thật mỗi khung hình,
 * có công tắc tắt trong Cài đặt.
 *
 * ⇒ Nhưng phép nướng sẵn này KHÔNG bị thay thế, nó thành NỀN cho lượt kia, và đó là một quyết định
 * chứ không phải quán tính: (1) nó là thứ DUY NHẤT còn sống khi Đàm tắt hậu kỳ — không có nó, tắt
 * công tắc là mọi công trình lại nổi lều bều trên mặt đất; (2) nó tối ở chỗ SSAO màn hình yếu nhất
 * — chân tường bị chính công trình che khuất khỏi camera; (3) giá bằng 0 lúc chạy, nên giữ lại
 * không tốn gì. Hai lớp che khuất chồng nhau là đúng ý đồ, không phải trùng lặp.
 *
 * ⚠️ VÌ SAO CHỈ THEO CHIỀU CAO, KHÔNG PHẢI AO THẬT: AO thật cần biết mỗi đỉnh bị bao nhiêu mặt
 * khác che — tức phải dò tia, tức không còn thuần và không còn rẻ. Phép xấp xỉ "càng gần đất càng
 * tối" bắt được ~80% hiệu quả thị giác vì trong một thành phố, thứ che sáng nhiều nhất CHÍNH LÀ
 * mặt đất và các khối kề bên ở tầng thấp. Khối lơ lửng (kỷ 15) nằm cao nên không bị tối — đúng.
 */

/**
 * Bóng tiếp xúc lan lên cao bao nhiêu (đơn vị thế giới; một ô lưới = 1).
 * ⚠️ ROUND 47 (ADR-087): 0,38 → 0,52 and the floor 0,58 → 0,44 — Đàm's decision on the item that
 * had waited in `START_HERE` §A since Phase 19 ("deeper / taller contact shadows"). Deeper feet are
 * what make a low-poly block SIT on the ground instead of floating on it; the exponent below keeps
 * the darkening concentrated in the crease, so the whole ground floor is not smeared grey.
 */
export const CONTACT_REACH = 0.52;

/** Tối nhất còn lại bao nhiêu phần màu gốc ở sát mặt đất. */
export const CONTACT_FLOOR = 0.44;

/**
 * Hệ số nhân màu theo độ cao so với mặt đất.
 *
 * ⚠️ SỐ MŨ 0,55 (không phải tuyến tính) LÀ CHỦ ĐÍCH: bóng tiếp xúc thật ĐẬM ở ngay sát khe rồi
 * nhạt rất nhanh. Để tuyến tính thì cả tầng trệt bị ám xám đều một cách giả tạo, trông như căn nhà
 * bị bẩn chứ không như có bóng.
 *
 * @param {number} y độ cao thế giới của đỉnh
 * @returns {number} 0..1 — nhân vào từng kênh màu
 */
export function contactShade(y) {
  if (!Number.isFinite(y) || y >= CONTACT_REACH) return 1;
  if (y <= 0) return CONTACT_FLOOR;
  const t = Math.pow(y / CONTACT_REACH, 0.55);
  return CONTACT_FLOOR + (1 - CONTACT_FLOOR) * t;
}
