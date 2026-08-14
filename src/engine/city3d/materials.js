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
  mudbrick: { roughness: 0.94, metalness: 0.00, sheen: 0.00 }, // gạch bùn phơi nắng, đất nện
  brick:    { roughness: 0.84, metalness: 0.00, sheen: 0.00 }, // gạch nung đỏ
  stone:    { roughness: 0.74, metalness: 0.00, sheen: 0.00 }, // đá tảng, đá vôi, sa thạch
  plaster:  { roughness: 0.68, metalness: 0.00, sheen: 0.00 }, // vữa trát, tường quét vôi
  tile:     { roughness: 0.52, metalness: 0.00, sheen: 0.00 }, // ngói nung — nhẵn hơn tường rõ rệt
  glazed:   { roughness: 0.22, metalness: 0.04, sheen: 0.00 }, // ngói men, lưu ly — BÓNG như sứ
  slate:    { roughness: 0.40, metalness: 0.08, sheen: 0.00 }, // đá phiến chẻ, ướt thì loáng
  concrete: { roughness: 0.90, metalness: 0.00, sheen: 0.00 }, // bê tông đúc, bê tông quân sự
  metal:    { roughness: 0.32, metalness: 0.70, sheen: 0.00 }, // kẽm, đồng, thép mạ
  gold:     { roughness: 0.20, metalness: 0.92, sheen: 0.00 }, // vàng, đồng thau đánh bóng
  glass:    { roughness: 0.06, metalness: 0.20, sheen: 0.00 }, // kính phản quang
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
 * ⚠️ VÌ SAO KHÔNG DÙNG SSAO: SSAO là một lượt hậu kỳ toàn màn hình, đắt trên điện thoại, và nó
 * PHÁ VỠ render-on-demand (thêm hẳn một pass mỗi khung hình). Ở đây cảnh là tĩnh giữa hai lần
 * dựng, nên bóng tiếp xúc có thể tính MỘT LẦN lúc gộp hình học rồi nướng vào màu đỉnh: giá bằng 0
 * ở lúc chạy, và nó bắt được đúng thứ đáng giá nhất — chân tường tối lại, khiến công trình NGỒI
 * trên mặt đất thay vì nổi lều bều.
 *
 * ⚠️ VÌ SAO CHỈ THEO CHIỀU CAO, KHÔNG PHẢI AO THẬT: AO thật cần biết mỗi đỉnh bị bao nhiêu mặt
 * khác che — tức phải dò tia, tức không còn thuần và không còn rẻ. Phép xấp xỉ "càng gần đất càng
 * tối" bắt được ~80% hiệu quả thị giác vì trong một thành phố, thứ che sáng nhiều nhất CHÍNH LÀ
 * mặt đất và các khối kề bên ở tầng thấp. Khối lơ lửng (kỷ 15) nằm cao nên không bị tối — đúng.
 */

/** Bóng tiếp xúc lan lên cao bao nhiêu (đơn vị thế giới; một ô lưới = 1). */
export const CONTACT_REACH = 0.38;

/** Tối nhất còn lại bao nhiêu phần màu gốc ở sát mặt đất. */
export const CONTACT_FLOOR = 0.58;

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
