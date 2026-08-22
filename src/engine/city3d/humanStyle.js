/**
 * humanStyle.js — 15 kỷ, 15 KIỂU CON NGƯỜI. Bảng này là nguồn DUY NHẤT trả lời "người ở nước ấy,
 * thời ấy, mặc gì, đội gì, mang gì, và đi thế nào".
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY — LỖI THIẾT KẾ, KHÔNG PHẢI LỖI MÃ
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Trước phase này, một cư dân là **hai cái hộp**: một hộp thân, một hộp đầu, dựng thẳng trong
 * `sceneGraph.js`. Không có tay, không có chân, không có tư thế. "Đang đi" được kể bằng một hàm
 * sin nhún người biên độ 0,022 đơn vị — tức **cả 15 kỷ, ai cũng là cùng một viên gạch nhún**.
 *
 * Con số quyết định việc này đáng làm hay không đã được ĐO trước khi viết một dòng mã nào
 * (`scripts/human-scale.mjs`, đối chiếu với ảnh thật bằng `--mask resident,resident-head`):
 * trên MacBook Air M3 của Đàm (1470 × 956 điểm logic ⇒ khung 3D 990 × 614), một cư dân kỷ 1 cao
 * **trung vị 14,4 điểm ảnh CSS** (dải 10,0 tới 20,7; kéo sát nhất 24,5). Ở cỡ đó một chi rộng
 * bằng 1/4 thân chiếm 2 tới 3 điểm ảnh — đủ để đọc ra **HÌNH BÓNG ĐỔI THEO PHA BƯỚC**, chưa đủ
 * để đọc ra "đây là cánh tay". Toàn bộ bảng dưới đây được thiết kế theo đúng ranh giới ấy: mọi
 * trục đều phải đổi được ĐƯỜNG BAO hoặc MÀU, vì đó là hai thứ duy nhất còn sống ở 14 điểm ảnh.
 *
 * ⚠️ TRÊN iPHONE (khung 324 × 201) CƯ DÂN CHỈ CAO 3,3 TỚI 5,1 ĐIỂM ẢNH, và cái đầu chỉ **1 điểm
 * ảnh**. Không một trục nào dưới đây đọc ra được ở đó. Đàm đã biết và đã chọn nhắm vào MacBook
 * (2026-08-22). Ghi ra để phiên sau không đọc sự im lặng thành "chỗ đó cũng ổn".
 *
 * ⚠️ MỖI DÒNG PHẢI TRẢ LỜI ĐƯỢC "NGƯỜI Ở NƯỚC ẤY, THỜI ẤY, MẶC GÌ VÀ ĐI THẾ NÀO?" — đúng luật mà
 * `eraStyle.js` đặt ra cho kiến trúc, `floraStyle.js` theo cho cây cối và `streetStyle.js` theo cho
 * đường phố. Không có ràng buộc ấy thì 15 dòng là 15 lần chọn bừa, mà chọn bừa chính là thứ đã
 * sinh ra 15 kỷ cây giống hệt nhau và 15 kỷ đường giống hệt nhau. `humanStyle.test.js` khoá
 * `country` của bảng này vào `country` của `eraStyle.js` để hai bảng không bao giờ trôi khỏi nhau.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ TỐC ĐỘ ĐI, SẢI CHÂN, TẦN SỐ BƯỚC LÀ BA TÊN CHO HAI ĐẠI LƯỢNG — CHỈ ĐƯỢC KHAI HAI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Yêu cầu ban đầu liệt kê cả `sải chân` lẫn `tần số bước` như hai trục bản sắc. Nhưng
 * **tần số = tốc độ ÷ sải chân** — ba con số ấy không độc lập. Khai đủ ba là dựng sẵn một mâu
 * thuẫn: ngày nào có người chỉnh `walkSpeed` mà quên `cadence`, hai bên lệch nhau và **không có gì
 * đỏ lên**, vì mã sẽ chỉ dùng một trong hai. Đây đúng là cái bẫy "một luật hai công thức" mà dự án
 * đã trả giá ở `daylight.test.js` (hai định nghĩa "chân trời ấm") và ở `palette3d.js` (hai định
 * nghĩa "mái tím").
 * ⇒ Bảng khai `walkSpeed` và `stride`; `cadenceOf()` SUY RA tần số. Tần số vẫn là một đặc điểm
 * bản sắc đọc ra được (kỷ 1 bước dài và thưa, kỷ 11 bước ngắn và gấp), chỉ là nó không được khai.
 *
 * ⚠️ VÀ ĐỪNG NHÉT ĐẶC ĐIỂM HIỆN ĐẠI VÀO KỶ CỔ CHO ĐẸP — luật này chép nguyên từ `streetStyle.js`.
 * Áo may đo vừa người là chuyện của nghề cắt may thế kỷ 14 trở đi; trước đó quần áo là những tấm
 * vải quấn, khoác, buộc. Mũ có vành cứng cần nghề làm nỉ. Ba lô đeo vai hai quai là thế kỷ 20.
 */

/**
 * HÌNH BÓNG TRANG PHỤC mà `human.js` dựng được. Khai ở đây (chứ không ở `human.js`) vì bảng dưới
 * phải kiểm được: một kỷ lỡ khai kiểu không tồn tại thì test bắt ngay, không đợi tới lúc nhìn ảnh.
 *
 * Mỗi kiểu là một câu trả lời cho "nhìn từ xa, khối vải này làm đường bao người phình ra ở ĐÂU".
 */
export const GARMENT_KINDS = [
  'none',      // trần hoặc khố — đường bao đúng bằng thân
  'pelt',      // tấm da thú khoác LỆCH một vai — phình một bên, bất đối xứng
  'wrap',      // vải quấn ngang hông/ngực — phình ở giữa thân
  'tunic',     // áo chùng thẳng tới đầu gối — thân thành một khối thang
  'robe',      // áo choàng dài chấm đất — che hẳn chân, đường bao thành hình chuông
  'coat',      // áo khoác có vai — phình ở VAI, eo thóp
  'suit',      // âu phục may đo — bó sát, đường bao hẹp nhất bộ
];

/** ĐỘI ĐẦU. `none` là một lựa chọn thật, không phải thiếu dữ liệu. */
export const HEADGEAR_KINDS = [
  'none',
  'bun',       // tóc búi cao — một khối nhỏ trên đỉnh đầu
  'headcloth', // khăn trùm phủ gáy — đầu to ra và vuông xuống
  'brim',      // mũ vành cứng — một tấm dẹt rộng hơn đầu
  'helm',      // mũ trụ / nón kim loại — khối cao thóp
  'cap',       // mũ lưỡi trai / mũ vải mềm ôm đầu
  'conical',   // nón lá / nón chóp — khối nón rộng
];

/** ĐỒ MANG THEO. Khối THÒ RA NGOÀI đường bao, nên đây là trục đọc ra rõ nhất ở cỡ nhỏ. */
export const CARRY_KINDS = [
  'none',
  'spear',     // giáo/lao dựng đứng cao quá đầu — vệt dọc mảnh, rất dễ nhận
  'bundle',    // bó củi/bó lúa vác trên vai — khối ngang lệch
  'pot',       // vò/thúng đội đầu hoặc ôm hông
  'tool',      // cuốc, búa, dụng cụ cầm tay ngang hông
  'case',      // cặp/vali xách tay — khối hộp thấp bên hông
];

const GARMENT_SET = new Set(GARMENT_KINDS);
const HEADGEAR_SET = new Set(HEADGEAR_KINDS);
const CARRY_SET = new Set(CARRY_KINDS);

/**
 * ⚠️ PRESET PHẢI CÓ TÊN, VÀ 14 KỶ CHƯA LÀM PHẢI TRỎ TỚI NÓ MỘT CÁCH TƯỜNG MINH.
 *
 * Cám dỗ là để 14 kỷ kia THIẾU trường rồi cho `getHumanStyle` rơi về mặc định. Dự án đã trả giá
 * đúng cho chuyện đó ở `vernacularRoof` (Phase 7C): một trường tuỳ chọn rơi ngầm về `roof` khiến
 * 25 căn nhà dân đội mái vòm Duomo, và **không có gì đỏ lên** vì mã vẫn chạy đúng theo luật cũ.
 * ⇒ Ở đây `preset` là BẮT BUỘC với mọi kỷ chưa thiết kế riêng, và `designedEras()` đếm ra con số
 * thật để không ai nhầm "có đủ 15 dòng" với "đã làm đủ 15 kỷ".
 */
export const HUMAN_PRESETS = {
  /**
   * `mocPhoThong` — người chung chung, không thuộc thời nào. CỐ Ý nhạt: nó là chỗ giữ chỗ, và một
   * chỗ giữ chỗ mà trông có bản sắc thì sẽ không ai buồn thay nó nữa.
   */
  mocPhoThong: {
    stature: 1.00,
    build: 1.00,
    legShare: 0.46,
    stance: 0.00,
    garment: 'tunic',
    headgear: 'none',
    carry: 'none',
    stride: 1.62,
    // ⚠️ GIỮ ĐÚNG 0,42 — bằng hằng số `WALK_SPEED` mà `residents.js` dùng trước phase này. Nhờ vậy
    // 14 kỷ chưa thiết kế đi y hệt tốc độ cũ, và 8 bài test cư dân có sẵn vẫn đo đúng thứ chúng đo.
    walkSpeed: 0.42,
    armSwing: 0.30,
    cloth: { hue: 30, sat: 0.14, light: 0.52 },
  },
};

/**
 * MƯỜI MỘT TRỤC BẢN SẮC. Đọc kỹ ý nghĩa trước khi chỉnh — vài trục trông giống nhau nhưng trả lời
 * hai câu hỏi khác hẳn.
 *
 * `stature`   — CHIỀU CAO TỔNG, nhân vào `RESIDENT_HEIGHT`. 1 = cỡ chuẩn.
 * `build`     — BỀ NGANG thân, nhân vào bề dày chuẩn. Tách khỏi `stature` vì cao và to là hai
 *               chuyện: một người Bắc Âu thời trung cổ cao mà gầy, một thợ mỏ Manchester thấp mà
 *               vạm vỡ. Trộn hai thứ này lại là đúng cái bẫy `storyHeight` đã cắn (Phase 5B).
 * `legShare`  — chân chiếm bao nhiêu PHẦN chiều cao (0..1). Đây là trục "tỉ lệ cơ thể" thật sự:
 *               áo choàng dài làm chân biến mất khỏi đường bao, còn quần âu thì phơi trọn.
 * `stance`    — ĐỘ KHOM của thân, radian. Dương = chúi về trước.
 * `garment`   — hình bóng trang phục (danh sách trên).
 * `headgear`  — đội đầu (danh sách trên).
 * `carry`     — đồ mang theo (danh sách trên).
 * `stride`    — SẢI CHÂN, tính bằng **SỐ LẦN CHIỀU DÀI CHÂN** mà thân đi được trong MỘT chu kỳ
 *               trọn vẹn của một chân. ⚠️ PHẢI LÀ MỘT TỈ LỆ, KHÔNG ĐƯỢC LÀ SỐ Ô TUYỆT ĐỐI — và
 *               đây là một cái bẫy đã suýt ship. Bản đầu khai `stride: 0.78` ô; với chân kỷ 1 dài
 *               0,123 ô thì bàn chân phải đưa ra trước 0,195 ô, tức XA HƠN CẢ CÁI CHÂN, và `asin`
 *               kẹp góc hông về 90° — chân duỗi NGANG như người tập xoạc, ở cả 15 kỷ. Sải chân là
 *               một QUAN HỆ với cơ thể ("bước dài bằng ngần này lần cẳng chân"), mà một con số
 *               tuyệt đối thì không nhìn thấy cơ thể — đúng bài học mặt đường ở Phase 7D, và nó
 *               còn tệ hơn ở đây vì `stature`/`legShare` là hai trục CÓ THỂ ĐỔI. Người thật: sải
 *               1,5m trên chân 0,9m ≈ 1,67.
 * `walkSpeed` — TỐC ĐỘ ĐI, ô mỗi giây. KHÔNG suy ra từ `stride` (xem khối cảnh báo ở đầu file).
 * `armSwing`  — BIÊN ĐỘ VUNG TAY, radian. Người vác nặng thì gần như không vung.
 * `cloth`     — bảng màu vải `{hue, sat, light}`. Ở ĐÂY chứ không ở `palette3d.js` vì nó là thuộc
 *               tính của NGHỀ NHUỘM thời ấy (thuốc nhuộm khoáng đục, thuốc nhuộm hoá học rực),
 *               không phải một lựa chọn hoà sắc — đúng lý do màu lá nằm ở `floraStyle.js`.
 */
export const HUMAN_STYLES = {
  1: {
    country: 'Thổ Nhĩ Kỳ',
    note: 'Göbekli Tepe — người săn bắt hái lượm Anatolia: khoác da thú lệch vai, tóc búi, vác giáo',
    // ⚠️ CAO HƠN PRESET, VÀ ĐÓ LÀ SỰ THẬT NHÂN CHỦNG HỌC CHỨ KHÔNG PHẢI ĐỂ DỄ NHÌN. Xương người
    // săn bắt hái lượm Cận Đông trước Cách mạng Đá mới CAO HƠN người nông nghiệp ngay sau đó —
    // tầm vóc tụt xuống khi khẩu phần chuyển sang ngũ cốc đơn điệu. Kỷ 1 là kỷ DUY NHẤT trong 15
    // kỷ nằm trước bước tụt ấy. (Tiện lợi đi kèm: 1,18 lần đưa trung vị từ 14,4 lên ~17 điểm ảnh
    // trên máy Đàm — nhưng nếu lý do lịch sử không có thì con số này đã không được phép đổi.)
    stature: 1.18,
    // Vạm vỡ: săn bắt là lao động toàn thân, và bộ xương thời ấy dày hơn hẳn người nông nghiệp.
    build: 1.12,
    // ⚠️ CHÂN DÀI NHẤT BỘ, và nó suy thẳng từ `garment: 'pelt'`. Không có vải phủ thì chân lộ
    // trọn từ hông xuống — tức pha bước ĐỔI ĐƯỢC ĐƯỜNG BAO nhiều nhất trong cả 15 kỷ. Kỷ mặc áo
    // choàng dài (kỷ 3, 7) thì chân bị nuốt và trục "sải chân" gần như không đọc ra.
    legShare: 0.50,
    // Hơi chúi: người vác đồ nặng đi đường đất gồ ghề, không phải người đi dạo trên vỉa hè.
    stance: 0.13,
    // Tấm da thú khoác LỆCH MỘT VAI — đường bao bất đối xứng, thứ mà không kỷ nào khác có, và là
    // đặc điểm đọc ra được ngay ở 14 điểm ảnh vì nó phá thế đối xứng trái-phải.
    garment: 'pelt',
    // Tóc búi: chưa có nghề làm nỉ, chưa có vải dệt khổ lớn để trùm. Búi tóc là thứ giữ tóc khỏi
    // vướng khi săn, và nó có mặt trong tượng người thời Đá mới vùng Anatolia.
    headgear: 'bun',
    // Ngọn giáo dựng cao quá đầu — vệt dọc mảnh, trục dễ đọc nhất ở cỡ nhỏ vì nó THÒ HẲN ra ngoài
    // đường bao người. Göbekli Tepe dựng trước nông nghiệp: công cụ của họ là công cụ săn.
    carry: 'spear',
    // ⚠️ SẢI DÀI NHẤT BỘ nhưng TỐC ĐỘ CHẬM NHẤT — hai trục khai riêng, và cặp giá trị này chính là
    // thứ cho ra "tần số bước" thấp nhất trong 15 kỷ (0,52 chu kỳ/giây). Người đi săn trên địa
    // hình hoang bước dài và thưa để đỡ mệt và đỡ gây tiếng động; người phố thị kỷ 11 bước ngắn và
    // gấp. Đó là hai dáng đi khác hẳn nhau mà mắt đọc được ngay cả khi không thấy rõ cái chân.
    // 1,85 lần cẳng chân — dài nhất trong 15 kỷ (người thật ≈ 1,67). Đi săn trên địa hình hoang
    // thì bước dài và thưa: đỡ mệt, đỡ gây tiếng động.
    stride: 1.85,
    // Chậm nhất bộ. Cặp (sải dài + chậm) cho ra TẦN SỐ BƯỚC thấp nhất 15 kỷ — xem `cadenceOf`.
    walkSpeed: 0.30,
    // Vung tay rộng: không mang vác gì trên hai vai, tay thả tự do (cây giáo cầm một tay).
    armSwing: 0.46,
    // Màu đất: da thú, đất son, than. Chưa có thuốc nhuộm — mọi màu đều là màu của vật liệu thô.
    cloth: { hue: 24, sat: 0.30, light: 0.40 },
  },

  // ── 14 kỷ dưới đây CHƯA được thiết kế riêng ─────────────────────────────────────────────────
  // Chúng trỏ tường minh tới preset `mocPhoThong`. `country` vẫn khai đủ và vẫn bị test khoá vào
  // `eraStyle.js`, vì đó là thứ phải đúng NGAY từ bây giờ: ngày nào có người ngồi thiết kế kỷ 6,
  // họ phải thấy sẵn chữ "Việt Nam" ở đó chứ không phải đi tra lại. `note` ghi sẵn hướng đi đã
  // nghiên cứu được, để phiên sau không bắt đầu từ số không. Xem `TECH_DEBT.md`.
  2: {
    country: 'Ai Cập', preset: 'mocPhoThong',
    note: 'hướng: khố vải lanh trắng, đầu cạo hoặc tóc giả, đội thúng/vò — dáng đi thẳng nghi lễ',
  },
  3: {
    country: 'Iraq', preset: 'mocPhoThong',
    note: 'hướng: áo choàng len tua rua kiểu kaunakes, râu xoăn, ôm vò nước — bước ngắn vì áo dài',
  },
  4: {
    country: 'Trung Quốc', preset: 'mocPhoThong',
    note: 'hướng: áo giao lĩnh tay thụng, búi tóc cài trâm, gánh đòn hai đầu — vai gánh thì tay không vung',
  },
  5: {
    country: 'Đức', preset: 'mocPhoThong',
    note: 'hướng: áo chẽn + áo choàng len, mũ trụ với lính, vác búa/rìu — dáng nặng, sải vừa',
  },
  6: {
    country: 'Việt Nam', preset: 'mocPhoThong',
    note: 'hướng: áo tứ thân/áo nâu sồng, NÓN LÁ (trục đội đầu mạnh nhất), gánh quang — bước ngắn nhịp đều',
  },
  7: {
    country: 'Ý', preset: 'mocPhoThong',
    note: 'hướng: áo chùng dài Phục Hưng + mũ berretto, cầm sách/cuộn giấy — chân bị áo nuốt, sải ngắn',
  },
  8: {
    country: 'Bồ Đào Nha', preset: 'mocPhoThong',
    note: 'hướng: áo thuỷ thủ + mũ vành mềm, vác thùng/kiện hàng bến cảng — dáng khom vì vác nặng',
  },
  9: {
    country: 'Pháp', preset: 'mocPhoThong',
    note: 'hướng: áo đuôi tôm + mũ chóp cao, chống ba toong — dáng ưỡn, sải dài, vung tay ít (lễ nghi)',
  },
  10: {
    country: 'Anh', preset: 'mocPhoThong',
    note: 'hướng: áo khoác thợ + mũ vải mềm, xách hộp cơm — thấp, vạm vỡ, bước gấp (nhịp nhà máy)',
  },
  11: {
    country: 'Mỹ', preset: 'mocPhoThong',
    note: 'hướng: âu phục + mũ phớt, cặp da — sải NGẮN và tần số CAO nhất bộ (nhịp phố Manhattan)',
  },
  12: {
    country: 'Nga', preset: 'mocPhoThong',
    note: 'hướng: áo bông dày + mũ ushanka — `build` lớn nhất bộ vì quần áo mùa đông, sải ngắn trên tuyết',
  },
  13: {
    country: 'Nhật Bản', preset: 'mocPhoThong',
    note: 'hướng: áo sơ mi trắng công sở, cặp mỏng — vóc nhỏ, bước rất đều, vung tay biên độ nhỏ',
  },
  14: {
    country: 'Singapore', preset: 'mocPhoThong',
    note: 'hướng: áo mỏng nhiệt đới sáng màu, ba lô một quai — dáng thoải mái, tốc độ trung bình',
  },
  15: {
    country: 'UAE', preset: 'mocPhoThong',
    note: 'hướng: áo kandura trắng dài chấm đất + khăn ghutra — `legShare` thấp nhất bộ (áo nuốt chân)',
  },
};

/** Danh sách trường mà một dòng ĐÃ THIẾT KẾ phải khai đủ. Thiếu một trường là test đỏ. */
export const HUMAN_AXES = [
  'stature', 'build', 'legShare', 'stance',
  'garment', 'headgear', 'carry',
  'stride', 'walkSpeed', 'armSwing', 'cloth',
];

/**
 * Kỷ lạ / thiếu → dùng kỷ 1. Không bao giờ ném lỗi: dữ liệu cloud có thể hỏng, và một ngoại lệ ở
 * đây làm sập cả màn hình Thành Phố.
 *
 * Trả về bộ trường ĐẦY ĐỦ đã trộn preset — bên gọi không bao giờ phải tự biết luật rơi về mặc định.
 */
export function getHumanStyle(era) {
  const row = HUMAN_STYLES[era] ?? HUMAN_STYLES[1];
  const base = row.preset ? HUMAN_PRESETS[row.preset] ?? HUMAN_PRESETS.mocPhoThong : null;
  const merged = base ? { ...base, ...row } : row;
  return {
    ...merged,
    garment: GARMENT_SET.has(merged.garment) ? merged.garment : 'tunic',
    headgear: HEADGEAR_SET.has(merged.headgear) ? merged.headgear : 'none',
    carry: CARRY_SET.has(merged.carry) ? merged.carry : 'none',
  };
}

/**
 * TẦN SỐ BƯỚC (chu kỳ chân mỗi giây) — SUY RA, không khai. Xem khối cảnh báo ở đầu file.
 * Tồn tại để bài test chứng minh được "15 kỷ đi khác nhịp nhau" mà không cần một trường thứ ba.
 */
export function cadenceOf(style) {
  const s = style?.stride;
  const v = style?.walkSpeed;
  if (!Number.isFinite(s) || !Number.isFinite(v) || s <= 0) return 0;
  return v / s;
}

/**
 * Những kỷ ĐÃ được thiết kế thật (không trỏ preset).
 * ⚠️ Tồn tại để một dòng in ra trong test nói thẳng "3/15 kỷ" thay vì để "có đủ 15 dòng" bị đọc
 * nhầm thành "đã làm đủ 15 kỷ" — đúng bài học `summarizeMuseum` (Phase 4H): một thứ làm xong 90%
 * mà thiếu một dòng nối thì không có gì đỏ lên, chỉ có một màn hình thiếu mất thứ đáng lẽ phải có.
 */
export function designedEras() {
  return Object.keys(HUMAN_STYLES)
    .map(Number)
    .filter((era) => !HUMAN_STYLES[era].preset)
    .sort((a, b) => a - b);
}

/**
 * Một dòng có hợp lệ không. TỪ CHỐI THẲNG thay vì kẹp về giá trị gần nhất — bài học `MIN_STONE`
 * của `streetStyle.js`: cái kẹp nuốt mất phần chênh TRONG IM LẶNG, nên bốn kỷ khai bốn số lại dựng
 * ra một kết quả và không ai biết.
 */
export function isValidHumanStyle(row) {
  if (!row || typeof row !== 'object') return false;
  if (typeof row.country !== 'string' || row.country.length === 0) return false;
  if (row.preset) return Object.hasOwn(HUMAN_PRESETS, row.preset);

  for (const axis of HUMAN_AXES) if (!Object.hasOwn(row, axis)) return false;
  if (!(row.stature > 0.4 && row.stature < 2)) return false;
  if (!(row.build > 0.4 && row.build < 2)) return false;
  if (!(row.legShare > 0.2 && row.legShare < 0.7)) return false;
  if (!(Math.abs(row.stance) < 0.5)) return false;
  if (!GARMENT_SET.has(row.garment)) return false;
  if (!HEADGEAR_SET.has(row.headgear)) return false;
  if (!CARRY_SET.has(row.carry)) return false;
  // Trần 2,4 lần cẳng chân: quá mức đó thì `asin(stride / 4)` vượt 37° và chân bắt đầu duỗi ngang.
  if (!(row.stride > 0.8 && row.stride <= 2.4)) return false;
  if (!(row.walkSpeed > 0.05 && row.walkSpeed < 2)) return false;
  // ⚠️ TRẦN BIÊN ĐỘ VUNG TAY. Không có nó thì cách rẻ nhất để "15 kỷ khác nhau" là cho tay quay
  // như chong chóng — mua điểm bản sắc bằng cách nói dối về giải phẫu.
  if (!(row.armSwing >= 0 && row.armSwing <= 0.7)) return false;
  const c = row.cloth;
  if (!c || !(c.hue >= 0 && c.hue < 360) || !(c.sat >= 0 && c.sat <= 1) || !(c.light > 0 && c.light < 1)) {
    return false;
  }
  return true;
}
