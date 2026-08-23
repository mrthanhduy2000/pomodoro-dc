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
 * **trung vị 18,3 điểm ảnh CSS** (dải 13,5 tới 29,3; kéo sát nhất 58,1). Ở cỡ đó một chi rộng
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

import { isValidGait } from './humanGait';

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

/**
 * VẬT LIỆU CỦA THỨ ĐỘI TRÊN ĐẦU. Hai giá trị, và chúng là một sự thật VẬT LIỆU chứ không phải một
 * lựa chọn hoà sắc.
 *
 * ⚠️ VÌ SAO PHẢI CÓ TRỤC NÀY (2026-08-23) — LẦN THỨ SÁU CỦA HỌ LỖI "MỘT TRƯỜNG GÁNH HAI VIỆC".
 * Trước bản này, MỌI thứ đội trên đầu (trừ búi tóc và mũ trụ) đều lấy vai màu `cloth2`, mà `cloth2`
 * được định nghĩa là *"quần/chân, tối nhất bộ"* và suy ra bằng `cloth × 0,66`. Nghĩa là **cái nón
 * và cái quần bị buộc phải cùng một lò nhuộm**, và cái nón VĨNH VIỄN tối hơn cái áo.
 *
 * Ngoài đời hai thứ ấy độc lập, và chỗ nó sai nặng nhất là kỷ 6: **nón lá đan bằng lá cọ, để mộc,
 * rất NHẠT** — thế mà nó render ra độ sáng **0,170**, tối thứ nhì cả bảng, vì cái áo nâu củ nâu
 * vốn đã sẫm. Đo cả 15 kỷ thì có SÁU kỷ sai cùng kiểu (2 khăn nemes lanh tẩy · 5 khăn lanh mộc Đức
 * · 6 nón lá · 7 mũ rơm Firenze · 8 mũ rơm ngư dân Bồ · 15 khăn ghutra trắng) và BỐN kỷ mà tối là
 * ĐÚNG (4 futou lụa đen · 9 casquette len · 10 mũ nồi tweed · 11 mũ phớt nỉ).
 *
 * ⚠️ VÀ VÌ SAO CHỈ HAI GIÁ TRỊ, KHÔNG PHẢI BỐN. Nỉ và len nhuộm khác nhau ngoài đời, nhưng ở cỡ
 * cư dân trên màn hình (đo được 14–31 điểm ảnh) chúng chênh nhau dưới ngưỡng mắt ⇒ thêm một giá
 * trị thứ ba là thêm một trục CHẾT, đúng thứ dự án đã trả giá ở Phase 11. Thứ mắt đọc được là
 * NHẠT hay SẪM, và đúng một sự thật vật lý quyết định điều đó: có nhuộm hay không.
 */
export const HEAD_MATERIALS = [
  'natural',   // sợi mộc: lá cọ, rơm, cói, vải lanh/bông chưa nhuộm hoặc đã tẩy — NHẠT
  'dyed',      // vải nhuộm, nỉ ép, lụa cán — cùng lò với áo, SẪM
];
const HEAD_MATERIAL_SET = new Set(HEAD_MATERIALS);

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
    headMaterial: 'dyed',
    carry: 'none',
    // Cố ý nhạt, đúng tinh thần preset: một kiểu đi không nói lên điều gì về thời nào.
    gait: 'saunter',
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
    // ⚠️ ĐÍNH CHÍNH 2026-08-23 — CHÚ THÍCH CŨ Ở ĐÂY LÀ MỘT LÝ DO ĐI SAU CON SỐ, VÀ ĐÃ BỊ ĐO BÁC BỎ.
    // Bản cũ viết: *"cao hơn preset, VÀ ĐÓ LÀ SỰ THẬT NHÂN CHỦNG HỌC CHỨ KHÔNG PHẢI ĐỂ DỄ NHÌN"*,
    // rồi mở ngoặc thừa nhận phần điểm ảnh như một *"tiện lợi đi kèm"*. Đem kiểm đúng cách mà
    // `CLAUDE.md` đòi cho mọi câu tự trấn an (bài học Phase 4G) thì nó không đứng vững:
    //
    //   HƯỚNG thì suy được từ nguồn. Xương người săn bắt hái lượm Cận Đông trước Cách mạng Đá mới
    //   CAO HƠN người nông nghiệp ngay sau đó — tầm vóc tụt khi khẩu phần chuyển sang ngũ cốc đơn
    //   điệu, và kỷ 1 là kỷ DUY NHẤT trong 15 kỷ nằm trước bước tụt ấy. Điều này vẫn đúng.
    //
    //   ĐỘ LỚN thì KHÔNG suy được. Các bộ số thường trích cho vùng Đông Địa Trung Hải là khoảng
    //   175–177 cm (Hậu kỳ Đá cũ / Trung thạch) so với 161–166 cm (Đá mới sớm tới Đồ đồng) ⇒ tỉ số
    //   thật cỡ **1,07 đến 1,10**. Con số 1,18 ở đây lớn gấp khoảng **1,7 lần** hiệu ứng thật.
    //
    // Đo thẳng để trả lời câu *"bỏ phần điểm ảnh đi thì có chọn 1,18 không?"*
    // (`human-scale.mjs --eras 1`, khung 990×614): 1,00 → 15,6 px · **1,10 → 17,0 px** ·
    // 1,18 → 18,3 px. Câu trả lời là **KHÔNG** — nếu chỉ đi theo nguồn thì nó đã là ~1,10.
    //
    // ⇒ NÓI CHO ĐÚNG BẢN CHẤT: đây là **một con số MỸ THUẬT (phóng đại có chủ đích) ĐƯỢC một sự
    // thật lịch sử ĐỠ LƯNG về HƯỚNG**, KHÔNG phải một con số SUY RA từ nguồn. Phóng đại một khác
    // biệt có thật, đúng chiều, trong một thành phố cách điệu nơi con người chỉ cao 18 điểm ảnh —
    // điều đó hợp lệ. Thứ KHÔNG hợp lệ là dán nhãn nó thành "sự thật nhân chủng học", vì phiên sau
    // sẽ kế thừa lời giải thích ấy rồi dựa vào (đúng bài học "sửa đúng không chứng minh hiểu đúng",
    // Phase 3Y/4D). Muốn kéo về đúng nguồn thì đổi sang 1.10 và chấp nhận mất 1,3 điểm ảnh; muốn
    // giữ phóng đại thì giữ nguyên — nhưng đừng gọi nó là thứ nó không phải.
    // ⚠️ Và ADR-025 vẫn được tôn trọng: cấm là cấm *mua một con số bằng cách NÓI DỐI lịch sử*.
    // Phóng đại có khai báo thì không phải nói dối; đúng cái sai vừa được sửa ở ngay trên đây.
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
    // Trơ (búi tóc lấy vai `hair`). Khai `natural` cho đúng sự thật: Çatalhöyük chưa có nghề nhuộm.
    headMaterial: 'natural',
    // Ngọn giáo dựng cao quá đầu — vệt dọc mảnh, trục dễ đọc nhất ở cỡ nhỏ vì nó THÒ HẲN ra ngoài
    // đường bao người. Göbekli Tepe dựng trước nông nghiệp: công cụ của họ là công cụ săn.
    carry: 'spear',
    // ⚠️ SẢI DÀI NHẤT BỘ nhưng TỐC ĐỘ CHẬM NHẤT — hai trục khai riêng, và cặp giá trị này chính là
    // thứ cho ra TẦN SỐ BƯỚC thấp nhất trong 15 kỷ (**1,37 chu kỳ/giây**, so với 4,62 của kỷ 13 —
    // gấp 3,36 lần). Người đi săn trên địa
    // hình hoang bước dài và thưa để đỡ mệt và đỡ gây tiếng động; người phố thị kỷ 11 bước ngắn và
    // gấp. Đó là hai dáng đi khác hẳn nhau mà mắt đọc được ngay cả khi không thấy rõ cái chân.
    // 1,85 lần cẳng chân — dài nhất trong 15 kỷ (người thật ≈ 1,67). Đi săn trên địa hình hoang
    // thì bước dài và thưa: đỡ mệt, đỡ gây tiếng động.
    // Sải dài thong dong trên địa hình hoang: không vỉa hè, không đám đông, không giờ giấc.
    // Chân nhấc thoải mái vì đường đất gồ ghề — quét chân là vấp.
    gait: 'stride',
    stride: 1.85,
    // ⚠️ CHẬM THỨ NHÌ BỘ (kỷ 4 chậm hơn: 0,28). Nhưng cặp (SẢI DÀI NHẤT + chậm) vẫn cho ra TẦN
    // SỐ BƯỚC THẤP NHẤT 15 kỷ — và đó chính là điểm của việc khai hai trục thay vì một: kỷ 4 đi
    // chậm hơn mà nhịp chân lại GẤP ĐÔI kỷ 1 (2,82 so với 1,37), vì nó bước những bước tí hon.
    walkSpeed: 0.30,
    // Vung tay rộng: không mang vác gì trên hai vai, tay thả tự do (cây giáo cầm một tay).
    armSwing: 0.46,
    // Màu đất: da thú, đất son, than. Chưa có thuốc nhuộm — mọi màu đều là màu của vật liệu thô.
    cloth: { hue: 24, sat: 0.30, light: 0.40 },
  },

  // ── 14 KỶ CÒN LẠI, THIẾT KẾ THẬT (2026-08-23) ──────────────────────────────────────────────
  // ⚠️ LUẬT ĐIỀN BẢNG NÀY, ĐỌC TRƯỚC KHI CHỈNH MỘT SỐ NÀO:
  //   1. Mỗi dòng phải trả lời được *"người ở NƯỚC ẤY, THỜI ẤY, mặc gì và đi thế nào?"*. `country`
  //      bị khoá cứng vào `eraStyle.js` (có test bắt) nên câu hỏi luôn có địa chỉ. Không trả lời
  //      được thì con số ấy là tuỳ hứng, và tuỳ hứng chính là thứ đã sinh ra 15 kỷ đi giống hệt nhau.
  //   2. ⚠️ **ĐÚNG LỊCH SỬ LÀ ĐIỀU KIỆN CẦN, KHÔNG PHẢI ĐIỀU KIỆN ĐỦ** (bài học Phase 11-B). Một
  //      giá trị còn phải KHÔNG GIẪM LÊN HÀNG XÓM. Bộ ba (trang phục, đội đầu, đồ mang) là **15 bộ
  //      ba PHÂN BIỆT** — có test đếm; và `humanIdentity.test.js` chấm cả 105 cặp trên 9 trục.
  //   3. ⚠️ **`stature` LÀ TRỤC DUY NHẤT ĐƯỢC PHÓNG ĐẠI, VÀ ĐÃ KHAI RA.** Đường cong tầm vóc dưới
  //      đây là thật và có tài liệu: cao ở người săn bắt hái lượm → **tụt khi chuyển sang nông
  //      nghiệp** → thấp suốt thời cổ/trung đại → **tụt thêm một nhịp ở đô thị công nghiệp** (kỷ 10,
  //      "câu đố tiền nội chiến") → vọt lên ở thế kỷ 20. Nhưng BIÊN ĐỘ ở đây rộng hơn thực tế
  //      khoảng **1,6 lần** (thật: ~158–176 cm ⇒ tỉ số 1,11; ở đây 0,90–1,18 ⇒ 1,31), vì ở 18 điểm
  //      ảnh thì 11% chênh lệch là 2 điểm ảnh. Đó là **cách điệu CÓ KHAI BÁO**, không phải một con
  //      số suy ra từ nguồn — xem đính chính `stature: 1.18` ở kỷ 1 và ADR-053. ADR-025 cấm *nói
  //      dối* lịch sử; nó không cấm phóng đại đúng chiều, miễn là nói ra.
  //   4. `walkSpeed` và `stride` là HAI trục, không phải một (`cadenceOf` suy ra nhịp từ cả hai).
  //      Đừng gộp: cặp (sải dài + chậm) của kỷ 1 và cặp (sải ngắn + nhanh) của kỷ 13 là hai dáng đi
  //      khác hẳn nhau mà mắt đọc được ngay cả khi không thấy rõ cái chân.

  2: {
    country: 'Ai Cập',
    note: 'Cổ vương quốc, Giza — khố lanh shendyt, khăn trùm đầu, đội thúng: đi thẳng lưng vì đội đầu',
    // Tụt hẳn so với kỷ 1: đây là kỷ ĐẦU TIÊN sau Cách mạng Đá mới trong 15 kỷ, và bước tụt tầm
    // vóc theo nông nghiệp (khẩu phần ngũ cốc đơn điệu) là thứ ghi được trên xương.
    stature: 1.00,
    // Gầy: lanh mỏng sát người, khí hậu nóng, lao động nông nghiệp chứ không phải săn bắt.
    build: 0.90,
    legShare: 0.49,
    // ⚠️ THẲNG LƯNG NHẤT BỘ, và đó là SINH CƠ HỌC chứ không phải nghi lễ: đội vật nặng trên đầu chỉ
    // giữ được khi cột sống thẳng đứng. Mọi hình vẽ trong mộ Ai Cập cho thấy đúng tư thế ấy.
    stance: 0.02,
    // Khố quấn ngang hông, thân trên để trần — phình ở GIỮA, vai trần.
    garment: 'wrap',
    headgear: 'headcloth',
    // Khăn nemes là vải LANH TẨY TRẮNG — người Ai Cập tẩy lanh dưới nắng, và trắng là màu của sự sạch trong nghi lễ. Nó phải SÁNG HƠN áo, không tối hơn.
    headMaterial: 'natural',
    carry: 'pot',
    // ⚠️ SUY THẲNG TỪ `carry: 'pot'`, KHÔNG PHẢI MỘT LỰA CHỌN RỜI. Đội vật trên đầu chỉ giữ được
    // khi cái đầu trôi trên một đường gần thẳng; người đội đầu biến cột sống thành bộ giảm xóc.
    // Đây là kỷ DUY NHẤT có `headTrack` gần 1, và nó gần 1 vì một lý do vật lý chứ không vì đẹp.
    gait: 'glide',
    stride: 1.52,
    walkSpeed: 0.36,
    // ⚠️ VUNG TAY RẤT ÍT, và đây là HỆ QUẢ của `carry: 'pot'` chứ không phải một lựa chọn rời: một
    // tay luôn giữ thăng bằng cho vật đội trên đầu. Cùng luật với kỷ 6 (gánh) và kỷ 4 (tay trong
    // tay áo) — ba kỷ vung tay ít vì BA lý do khác nhau, và lý do phải viết ra được.
    armSwing: 0.14,
    // Lanh tẩy trắng: SÁNG NHẤT bộ cho tới tận kỷ 15. Ai Cập không nhuộm vải thường ngày.
    cloth: { hue: 42, sat: 0.10, light: 0.74 },
  },
  3: {
    country: 'Iraq',
    note: 'Ur III, ziggurat — áo choàng len tua rua vắt vai, đầu trần, vác kiện len: bước ngắn vì áo dài',
    stature: 0.99,
    // Len dày, dệt thô: áo choàng kaunakes làm người dày lên hẳn so với lanh Ai Cập ngay bên cạnh.
    build: 1.06,
    // Áo chấm mắt cá nuốt phần trên chân ⇒ pha bước đọc ra yếu hơn hẳn kỷ 2.
    legShare: 0.42,
    stance: 0.06,
    garment: 'robe',
    // ⚠️ ĐẦU TRẦN CÓ CHỦ ĐÍCH, không phải "chưa nghĩ ra". Tượng thờ Sumer nổi tiếng vì để đầu trần,
    // tóc dài hoặc cạo nhẵn. Một ô trống được chọn cũng phải có lý do như một ô được điền.
    headgear: 'none',
    // Trơ (không đội gì). Len cừu Lưỡng Hà để mộc.
    headMaterial: 'natural',
    // Ur là thành phố THƯƠNG MẠI; hàng xuất khẩu chủ lực là len. Kiện hàng trên vai là hình ảnh
    // của chính nền kinh tế dựng nên cái ziggurat kia.
    carry: 'bundle',
    // Ur III là nhà nước quan liêu đầu tiên của lịch sử: sổ sách, định mức, đoàn phu khuân vác.
    // Đi đều, nhấc chân cao — dáng của người đi trong một trật tự có người đếm.
    gait: 'march',
    stride: 1.44,
    walkSpeed: 0.38,
    armSwing: 0.22,
    // Len chưa nhuộm: kem ngả nâu.
    cloth: { hue: 36, sat: 0.22, light: 0.60 },
  },
  4: {
    country: 'Trung Quốc',
    note: 'Đường/Tống — áo giao lĩnh tay thụng + mũ phốc đầu, tay khoanh trong ống tay: bước nhỏ nghi lễ',
    stature: 0.97,
    // ⚠️ TO NGANG KHÔNG PHẢI VÌ NGƯỜI TO. Tay áo thụng và nhiều lớp áo chồng làm ĐƯỜNG BAO rộng ra
    // — đúng cái mà `build` đo (bề ngang thân), tách khỏi `stature` (chiều cao) đúng bài học
    // `storyHeight` ở Phase 5B: cao và to là hai đại lượng, đừng để một trường gánh cả hai.
    build: 1.14,
    // ⚠️ THẤP NHẤT BỘ: áo chấm sàn nuốt gần trọn phần chân nhìn thấy được.
    legShare: 0.40,
    // ⚠️ NGẢ NHẸ RA SAU (âm) — dáng đứng của quan lại, khác hẳn cái chúi của người lao động. Đây là
    // kỷ đầu tiên dùng giá trị âm, và nó tồn tại để trục `stance` không thoái hoá thành "chúi ít
    // hay chúi nhiều".
    stance: -0.04,
    garment: 'robe',
    headgear: 'cap',
    // Futou là lụa the CÁN ĐEN — màu đen ấy là quy chế phẩm phục, không phải ngẫu nhiên. Tối hơn áo là ĐÚNG.
    headMaterial: 'dyed',
    // ⚠️ KHÔNG MANG GÌ, và chính vì thế mới giải thích được `armSwing` thấp nhất bộ: tay khoanh
    // trong ống tay áo là tư thế đi đứng chính thức, không phải vì đang bận cầm vật gì.
    carry: 'none',
    // Sải NGẮN NHẤT bộ: đi trong áo chấm sàn thì bước dài là giẫm lên gấu áo. Ràng buộc vật lý.
    // Áo chấm sàn ghì chân lại: bước dài là giẫm lên gấu áo. Cùng ràng buộc VẬT LÝ với kỷ 7 và
    // kỷ 15 — ba kỷ mặc áo dài, ba kỷ cùng một kiểu đi, và đó là điều đúng chứ không phải trùng lặp.
    gait: 'mince',
    stride: 1.28,
    // Chậm nhất bộ.
    walkSpeed: 0.28,
    // ⚠️ THẤP NHẤT BỘ (0,06). Tay trong ống tay áo thì gần như không vung.
    armSwing: 0.06,
    // Chàm — thuốc nhuộm thường ngày của cả quan lẫn dân.
    cloth: { hue: 214, sat: 0.32, light: 0.30 },
  },
  5: {
    country: 'Đức',
    note: 'Trung cổ, Burg Eltz — áo chẽn + áo khoác len, mũ trùm Gugel, vác rìu thợ: dáng nặng khí hậu lạnh',
    // Nhỉnh hơn các kỷ nông nghiệp phương Nam: khẩu phần Bắc Âu nhiều đạm sữa hơn.
    stature: 1.05,
    // Rộng vai: len nhiều lớp chống lạnh. Cùng lý do với kỷ 12, khác mức.
    build: 1.18,
    legShare: 0.45,
    stance: 0.08,
    // Áo khoác có vai: phình ở TRÊN, thóp ở dưới — đường bao ngược hẳn với `wrap` của kỷ 2.
    garment: 'coat',
    // Gugel: mũ trùm liền khăn phủ vai. Dùng chung hình với khăn trùm Ai Cập vì ở 18 điểm ảnh cả
    // hai đều là "một khối vải bọc đầu và đổ xuống vai" — nhưng hai kỷ ấy cách nhau xa và khác
    // nhau ở 8 trục khác.
    headgear: 'headcloth',
    // Khăn trùm của phụ nữ/thợ thủ công Đức trung cổ là vải lanh MỘC chưa nhuộm — thuốc nhuộm đắt, dành cho áo ngoài.
    headMaterial: 'natural',
    // Thành thị Đức trung cổ là thành thị PHƯỜNG HỘI: người trên phố là thợ, không phải hiệp sĩ.
    carry: 'tool',
    // Thợ phường hội trong một thành phố nhỏ: không vội, không mang nặng trên vai, đường phố ngắn.
    gait: 'saunter',
    stride: 1.62,
    walkSpeed: 0.44,
    armSwing: 0.34,
    // Nâu đỏ rễ thiên thảo (madder) — thuốc nhuộm rẻ và phổ biến nhất châu Âu trung cổ.
    cloth: { hue: 8, sat: 0.34, light: 0.36 },
  },
  6: {
    country: 'Việt Nam',
    note: 'Đình làng Bắc Bộ — áo nâu sồng, NÓN LÁ, gánh đòn: bước ngắn nhịp nhanh theo nhịp nhún của đòn',
    // ⚠️ THẤP NHẤT BỘ. Tầm vóc tiền hiện đại vùng Đông Nam Á thấp hơn Cận Đông và châu Âu — một
    // dữ kiện nhân trắc học, ghi ra vì trục này đã được khai là phóng đại (luật 3 ở đầu bảng).
    stature: 0.90,
    // Gầy nhất bộ: khí hậu nhiệt đới, áo mỏng, lao động lúa nước.
    build: 0.88,
    legShare: 0.48,
    // Chúi mạnh: vai gánh nặng.
    stance: 0.11,
    garment: 'tunic',
    // ⚠️ NÓN LÁ — TRỤC ĐỘI ĐẦU MẠNH NHẤT TOÀN BẢNG. Đĩa rộng 2,2 lần bề ngang đầu, tức phần tử
    // đường bao LỚN NHẤT trong cả bộ từ vựng. Ở cỡ nhỏ, đây là kỷ dễ nhận ra nhất chỉ bằng hình
    // bóng — và đó là lý do nó xứng đáng là một giá trị riêng chứ không phải một cái mũ chung chung.
    headgear: 'conical',
    // ⚠️ ĐÂY LÀ KỶ ĐÃ PHƠI RA CẢ CÁI LỖI. Nón lá đan bằng LÁ CỌ phơi khô, không nhuộm bao giờ — nó là thứ SÁNG NHẤT trên người, nổi bật hẳn trên áo nâu củ nâu. Bản trước render nó ra 0,170 (tối thứ nhì cả bảng).
    headMaterial: 'natural',
    carry: 'bundle',
    // ⚠️ SẢI NGẮN + NHỊP NHANH, và đây là VẬT LÝ của cái đòn gánh: đòn tre nảy theo nhịp, người
    // gánh phải bước khớp với chu kỳ nảy ấy chứ không được bước dài tuỳ ý.
    // ⚠️ ĐÒN TRE LÀ MỘT CÁI LÒ XO. Tải trọng nảy NGƯỢC pha với hông, nên vai và đầu nhún mạnh hơn
    // hông — kỷ DUY NHẤT có `headTrack` âm. Nhịp bước phải khớp chu kỳ nảy ấy, và `stride: 1,34`
    // ngắn ở trên chính là hệ quả của cùng một cái đòn.
    gait: 'bounce',
    stride: 1.34,
    walkSpeed: 0.40,
    // Một tay giữ đòn ⇒ vung tay ít. Cùng họ với kỷ 2 và kỷ 4, khác lý do.
    armSwing: 0.12,
    // ⚠️ MÀU NÂU CỦ NÂU — tối nhất trong mười kỷ tiền công nghiệp (kỷ 1–10; chỉ len xám than kỷ 11
    // và navy kỷ 13 tối hơn). Áo nâu sồng nhuộm bằng củ nâu là trang phục
    // thường ngày của người Bắc Bộ, không phải một lựa chọn hoà sắc.
    cloth: { hue: 30, sat: 0.28, light: 0.26 },
  },
  7: {
    country: 'Ý',
    note: 'Phục Hưng Firenze — áo chùng lucco + mũ vành, tay không: dáng công dân, chân bị áo nuốt',
    stature: 1.00,
    build: 1.02,
    legShare: 0.43,
    // Ngả nhẹ ra sau: tư thế công dân thành bang, cùng họ với kỷ 4 nhưng nhẹ hơn.
    stance: -0.02,
    garment: 'robe',
    headgear: 'brim',
    // Cappello di paglia di Firenze — mũ RƠM Toscana, hàng xuất khẩu nổi tiếng của Ý thế kỷ 18–19.
    headMaterial: 'natural',
    carry: 'none',
    // Áo chùng lucco chấm đất — cùng ràng buộc với kỷ 4, khác thế kỷ và khác lục địa. `note` ở trên
    // đã ghi 'chân bị áo nuốt': dáng đi phải nói lại đúng điều ấy, không được nói ngược.
    gait: 'mince',
    stride: 1.55,
    walkSpeed: 0.42,
    armSwing: 0.28,
    // ⚠️ ĐỎ THẮM KERMES — và đây KHÔNG phải màu chọn cho đẹp. Sự giàu có dựng nên cái vòm Duomo
    // đến TỪ NGHỀ NHUỘM VÀ BUÔN VẢI (Arte di Calimala, Arte della Lana). Màu áo của kỷ này chính
    // là mặt hàng của kỷ này.
    cloth: { hue: 348, sat: 0.30, light: 0.44 },
  },
  8: {
    country: 'Bồ Đào Nha',
    note: 'Thời Khám phá, bến Lisboa — áo thuỷ thủ + mũ vành rộng, đồ nghề xưởng tàu: dáng đi lắc của biển',
    stature: 0.97,
    build: 0.98,
    legShare: 0.48,
    // Chúi và bạnh: quen giữ thăng bằng trên boong.
    stance: 0.07,
    garment: 'tunic',
    headgear: 'brim',
    // Mũ rơm của ngư dân và nông dân Bồ — che nắng Đại Tây Dương, đan từ cói.
    headMaterial: 'natural',
    carry: 'tool',
    // ⚠️ SẢI RỘNG + VUNG TAY RỘNG — "dáng đi của thuỷ thủ": chân dạng, tay mở để giữ thăng bằng.
    // Một dáng đi hình thành từ chỗ LÀM VIỆC chứ không từ quần áo, và đó là điều làm nó khác kỷ 7
    // ngay bên cạnh dù hai kỷ chỉ cách nhau vài chục năm.
    // ⚠️ LẮC NGANG MẠNH NHẤT BỘ, và nó không phải tính cách mà là NGHỀ: người sống trên boong tàu
    // học cách dồn trọng tâm sang bên để bù độ nghiêng, rồi giữ dáng ấy cả khi lên bờ.
    gait: 'roll',
    stride: 1.70,
    walkSpeed: 0.46,
    armSwing: 0.40,
    // Chàm lá bả (woad) ngả xanh biển — thuốc nhuộm rẻ của thuỷ thủ Đại Tây Dương.
    cloth: { hue: 186, sat: 0.24, light: 0.42 },
  },
  9: {
    country: 'Pháp',
    note: 'Khai sáng/Cách mạng, Panthéon — áo carmagnole + MŨ PHRYGIEN, cặp giấy tờ: dáng thị dân gấp gáp',
    stature: 0.96,
    build: 1.04,
    legShare: 0.45,
    stance: 0.03,
    garment: 'coat',
    // ⚠️ MŨ PHRYGIEN (bonnet rouge) — biểu tượng của chính thời điểm mà Panthéon đổi từ nhà thờ
    // thành điện thờ danh nhân (1791). Dùng hình `cap` (mũ mềm ôm đầu, lệch về trước).
    headgear: 'cap',
    // Casquette len nhuộm sẫm của thợ Paris — đồng phục không chính thức của giai cấp công nhân.
    headMaterial: 'dyed',
    // Giấy tờ, sắc lệnh, thỉnh nguyện thư: kỷ của CHỮ VIẾT và thủ tục.
    carry: 'case',
    // Paris cách mạng: thị dân đi giao thỉnh nguyện thư, không phải đi dạo. Thân xoay mạnh, chân
    // nhấc gọn — dáng của người đi trên vỉa hè đông và có việc gấp.
    gait: 'bustle',
    stride: 1.60,
    walkSpeed: 0.48,
    armSwing: 0.32,
    // Lam Pháp.
    cloth: { hue: 224, sat: 0.26, light: 0.36 },
  },
  10: {
    country: 'Anh',
    note: 'Manchester 1840 — áo choàng thợ + mũ lưỡi trai vải, vác kiện bông: thấp, khom, bước gấp theo chuông nhà máy',
    // ⚠️ THẤP THỨ NHÌ BỘ, VÀ ĐÂY LÀ MỘT SỰ THẬT ĐO ĐƯỢC CHỨ KHÔNG PHẢI MỘT ẨN DỤ. Tầm vóc dân đô
    // thị Anh **TỤT XUỐNG** trong giai đoạn công nghiệp hoá dù kinh tế đi lên — hiện tượng có tên
    // riêng trong sử kinh tế. Kỷ 10 là kỷ duy nhất trong 15 kỷ mà tầm vóc đi NGƯỢC chiều tiến bộ
    // kỹ thuật, và bảng này phải kể được điều đó.
    stature: 0.93,
    // Gầy vì thiếu ăn, không phải gầy vì khí hậu như kỷ 6.
    build: 0.92,
    legShare: 0.47,
    // ⚠️ KHOM NHẤT trong nhóm dân sự (chỉ kỷ 12 khom hơn, vì rét). Đứng máy sợi 12 tiếng một ngày.
    stance: 0.14,
    garment: 'tunic',
    headgear: 'cap',
    // Mũ nồi tweed Anh: len nhuộm, cố ý sẫm để giấu bụi than.
    headMaterial: 'dyed',
    // Manchester là "Cottonopolis": kiện bông là chính thứ làm nên thành phố ấy.
    carry: 'bundle',
    // Sải ngắn (mệt) nhưng tốc độ CAO (chuông nhà máy) ⇒ tần số bước cao thứ nhì bộ. Cặp trái
    // chiều này là thứ một trường "nhịp đi" duy nhất sẽ không bao giờ diễn đạt nổi.
    // ⚠️ CÙNG MỘT CÂU CHUYỆN VỚI `stance: 0,14` VÀ `stature: 0,93` Ở TRÊN. Đứng máy sợi 12 tiếng thì
    // chân không còn nhấc nổi; thân đổ nặng sang bên mỗi bước. Không phải đi, là lê.
    gait: 'trudge',
    stride: 1.46,
    walkSpeed: 0.52,
    armSwing: 0.26,
    // Nâu xám ám bồ hóng: Manchester đốt than.
    cloth: { hue: 28, sat: 0.12, light: 0.32 },
  },
  11: {
    country: 'Mỹ',
    note: 'New York thời Mạ Vàng — áo khoác dài + mũ quả dưa, tay không: sải dài, đi nhanh, dáng thẳng',
    // ⚠️ CAO NHẤT trong mười hai kỷ từ 2 tới 13 (chỉ hai kỷ đương đại 14 và 15 cao hơn, và kỷ 1
    // săn bắt). Người Mỹ là dân cao nhất thế giới quanh 1900 — dinh
    // dưỡng dồi dào, đất rộng. Đặt cạnh kỷ 10 ngay trước nó (0,93) thì hai con số này kể đúng
    // câu chuyện của thế kỷ 19: cùng một cuộc cách mạng công nghiệp, hai kết cục cơ thể ngược nhau.
    stature: 1.06,
    build: 1.08,
    legShare: 0.44,
    stance: 0.01,
    garment: 'coat',
    headgear: 'brim',
    // Mũ phớt (fedora) làm bằng NỈ ÉP nhuộm — sẫm là đúng chất liệu, đây là kỷ mà tối KHÔNG phải lỗi.
    headMaterial: 'dyed',
    carry: 'none',
    // Sải dài + nhanh: nhịp phố Manhattan, và khác hẳn cặp (sải ngắn + nhanh) của kỷ 10 và kỷ 13.
    // Manhattan: sải dài, dáng thẳng, đường thẳng và rộng. Dùng chung kiểu với kỷ 1 và điều đó
    // ĐÚNG — hai kỷ ấy đi cùng một CÁCH, chỉ khác NHỊP (0,30 so với 0,58 ô mỗi giây).
    gait: 'stride',
    stride: 1.74,
    walkSpeed: 0.58,
    armSwing: 0.36,
    // Len xám than: đồng phục không chính thức của thành phố công sở đầu tiên.
    cloth: { hue: 30, sat: 0.08, light: 0.22 },
  },
  12: {
    country: 'Nga',
    note: 'Stalingrad 1942 — áo bông dày + mũ sắt, súng trên vai: rộng nhất bộ, khom vì rét, bước chậm trên tuyết',
    stature: 1.02,
    // ⚠️ RỘNG NHẤT BỘ. Áo bông telogreika nhiều lớp: quần áo mùa đông làm đường bao nở ra, không
    // phải cơ thể. Lại là một ca `build` tách khỏi `stature`.
    build: 1.22,
    legShare: 0.43,
    // ⚠️ KHOM NHẤT BỘ: rụt cổ tránh rét cộng với sức nặng của trang bị.
    stance: 0.16,
    garment: 'coat',
    headgear: 'helm',
    // Trơ (mũ trụ lấy vai `gear` kim loại).
    headMaterial: 'dyed',
    // ⚠️ KHẨU SÚNG DÙNG CHUNG HÌNH VỚI CÂY GIÁO KỶ 1, VÀ ĐÓ LÀ CHỦ Ý. Bộ từ vựng này nói về ĐƯỜNG
    // BAO, không nói về công dụng: ở 18 điểm ảnh, một vật dài mảnh dựng chéo trên vai cho ra đúng
    // một vệt dọc, dù nó là gỗ hay là thép. Hai kỷ ấy cách nhau 11 kỷ và khác nhau ở 8 trục khác.
    carry: 'spear',
    // Tuyết sâu tới bắp chân, trang bị nặng, rét. Cùng kiểu với kỷ 10 vì cùng một hệ quả cơ thể,
    // dù hai nguyên nhân khác hẳn nhau (kiệt sức nhà máy ↔ tuyết và giá rét).
    gait: 'trudge',
    stride: 1.50,
    // Trong nhóm BỐN kỷ đi chậm nhất (0,34; sau kỷ 4 · 1 · 15): tuyết sâu, kiệt sức.
    walkSpeed: 0.34,
    // Tay khép sát người giữ ấm.
    armSwing: 0.18,
    // Ô liu ngả cỏ úa.
    cloth: { hue: 96, sat: 0.20, light: 0.30 },
  },
  13: {
    country: 'Nhật Bản',
    note: 'Tokyo 1972, tháp Nakagin — âu phục sẫm, đầu trần, cặp mỏng: bước ngắn NHANH NHẤT bộ',
    stature: 1.02,
    // Âu phục may sát: đường bao gọn nhất trong các kỷ CÓ mặc thêm lớp ngoài.
    build: 0.94,
    legShare: 0.47,
    stance: 0.05,
    garment: 'suit',
    headgear: 'none',
    // Trơ (không đội gì).
    headMaterial: 'dyed',
    carry: 'case',
    // ⚠️ CẶP (SẢI NGẮN + NHANH NHẤT) — ĐỐI CỰC HOÀN TOÀN CỦA KỶ 1. Vỉa hè Tokyo đông nên bước phải
    // ngắn, nhưng nhịp thì gấp; kết quả là TẦN SỐ BƯỚC CAO NHẤT trong 15 kỷ (**4,62 chu kỳ/giây**
    // so với 1,37 của kỷ 1 — gấp **3,36 lần**). Đây chính là cặp giá trị mà cả trục `stride` lẫn trục
    // `walkSpeed` sinh ra để diễn đạt, và một trường duy nhất thì không thể.
    // ⚠️ ĐỐI CỰC CỦA KỶ 1 Ở CẢ BA TRỤC CHUYỂN ĐỘNG: sải ngắn nhất, nhịp cao nhất, và nay là kiểu đi
    // gấp gáp nhất. Vỉa hè Tokyo giờ tan tầm không cho phép bước dài.
    gait: 'bustle',
    stride: 1.40,
    walkSpeed: 0.62,
    armSwing: 0.24,
    // Xanh navy sẫm — đồng phục không chính thức của salaryman.
    cloth: { hue: 230, sat: 0.10, light: 0.20 },
  },
  14: {
    country: 'Singapore',
    note: 'Marina Bay — sơ mi mỏng KHÔNG áo khoác (nhiệt đới), cặp mỏng: đường bao gọn nhất bộ',
    stature: 1.10,
    build: 0.90,
    legShare: 0.48,
    stance: 0.02,
    // ⚠️ `garment: 'none'` KHÔNG PHẢI "CHƯA LÀM" — NÓ LÀ CÂU TRẢ LỜI ĐÚNG. Không ai mặc áo khoác
    // ngoài trời ở Singapore; sơ mi mỏng bó sát nghĩa là KHÔNG có lớp nào thêm vào đường bao. Đây
    // là kỷ có hình bóng GỌN NHẤT trong 15 kỷ, và nó gọn vì khí hậu chứ không vì thiếu thiết kế.
    // Đặt cạnh kỷ 13 (âu phục sẫm, hộp vuông) thì hai kỷ hiện đại này tách nhau rõ nhất ở đúng
    // trục ấy — điều mà hai bộ âu phục giống nhau sẽ không bao giờ làm được.
    garment: 'none',
    headgear: 'none',
    // Trơ (không đội gì).
    headMaterial: 'dyed',
    carry: 'case',
    // Marina Bay: lối đi có mái, khí hậu nóng nhưng trong bóng râm, và một thành phố nổi tiếng vì
    // trật tự. Bước gọn và đều — không lê như kỷ 12, cũng không chen như kỷ 13 ngay trước nó.
    gait: 'march',
    stride: 1.58,
    walkSpeed: 0.56,
    armSwing: 0.30,
    // Sơ mi xanh nhạt: sáng, nhưng KHÔNG trắng — để không giẫm lên áo kandura trắng của kỷ 15 ngay
    // bên cạnh (luật 2 ở đầu bảng: đúng lịch sử vẫn phải không giẫm hàng xóm).
    cloth: { hue: 205, sat: 0.18, light: 0.72 },
  },
  15: {
    country: 'UAE',
    note: 'Dubai — áo kandura trắng chấm mắt cá + khăn ghutra, tay không: sáng nhất và trùm kín nhất bộ',
    stature: 1.10,
    // Kandura rộng, xoè ra khi đi.
    build: 1.10,
    // ⚠️ THẤP THỨ NHÌ BỘ (chỉ hơn kỷ 4): áo chấm mắt cá nuốt gần trọn phần chân.
    legShare: 0.41,
    stance: -0.03,
    garment: 'robe',
    headgear: 'headcloth',
    // Ghutra là khăn bông TRẮNG — cùng lý do vật lý với chiếc kandura ngay dưới: vải sáng phản xạ nắng sa mạc. Tối đi là nói ngược lại chính dòng `cloth`.
    headMaterial: 'natural',
    carry: 'none',
    // Sải ngắn: áo dài cộng với nắng gắt. Cùng lý do vật lý với kỷ 4, khác mức.
    // Kandura chấm mắt cá cộng nắng 40°C: bước ngắn, chân gần như không nhấc, thân không lắc.
    // Cùng ràng buộc áo dài với kỷ 4 và kỷ 7 — ba kỷ, ba lục địa, một hình học.
    gait: 'mince',
    stride: 1.38,
    // ⚠️ CHẬM, VÀ ĐÓ LÀ KHÍ HẬU CHỨ KHÔNG PHẢI TÍNH CÁCH: tốc độ đi bộ ngoài trời giảm theo nhiệt
    // độ. Kỷ 15 giàu và hiện đại nhất bảng nhưng đi chậm hơn kỷ 10 nghèo khổ — một cặp số nói được
    // điều mà "càng hiện đại càng nhanh" sẽ nói sai.
    walkSpeed: 0.32,
    // Áo rộng ghì tay lại.
    armSwing: 0.16,
    // ⚠️ SÁNG NHẤT BỘ. Trắng kandura không phải lựa chọn thẩm mỹ: vải sáng phản xạ nắng sa mạc.
    cloth: { hue: 45, sat: 0.05, light: 0.88 },
  },
};

/** Danh sách trường mà một dòng ĐÃ THIẾT KẾ phải khai đủ. Thiếu một trường là test đỏ. */
export const HUMAN_AXES = [
  'stature', 'build', 'legShare', 'stance',
  'garment', 'headgear', 'headMaterial', 'carry',
  'gait', 'stride', 'walkSpeed', 'armSwing', 'cloth',
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
    headMaterial: HEAD_MATERIAL_SET.has(merged.headMaterial) ? merged.headMaterial : 'dyed',
    carry: CARRY_SET.has(merged.carry) ? merged.carry : 'none',
    gait: isValidGait(merged.gait) ? merged.gait : 'saunter',
  };
}

/**
 * CỠ CHUẨN của một con người, tính bằng ô. Chiều cao THẬT của một kỷ là `HUMAN_BASE_HEIGHT ×
 * stature`.
 *
 * ⚠️ HẰNG SỐ NÀY NẰM Ở ĐÂY, KHÔNG NẰM Ở `human.js`, VÌ MỘT LÝ DO CỤ THỂ. `cadenceOf` bên dưới cần
 * chiều dài cẳng chân để ra được ĐÚNG ĐƠN VỊ, mà `human.js` thì `import` file này ⇒ không thể
 * `import` ngược lại. Hai lối thoát khác đều tệ hơn: chép số 0,2 sang đây là "một luật hai công
 * thức" (đúng quả mìn `BUILDING_SCALE = 0.86` chép tay ở `plinth-tri.mjs`, đếm 3 bệ thay vì 31),
 * còn để `cadenceOf` trả về một đại lượng sai đơn vị thì chính là lỗi vừa được sửa ngay dưới đây.
 * `human.js` `import` hằng số này và `export` lại để mọi chỗ gọi cũ không phải đổi.
 *
 * ⚠️ GIỮ NGUYÊN 0,2 — bằng đúng `RESIDENT_HEIGHT` cũ. Nhà cửa, camera và bản quét 15 kỷ đều đã
 * hiệu chuẩn quanh con số này.
 */
export const HUMAN_BASE_HEIGHT = 0.2;

/**
 * TẦN SỐ BƯỚC — **chu kỳ chân mỗi giây, đơn vị 1/giây**. SUY RA từ `walkSpeed` và `stride`, không
 * khai thành một trường thứ ba. Xem khối cảnh báo ở đầu file.
 *
 * ⚠️ ĐÃ SỬA MỘT LỖI **NHÃN** Ở ĐÂY (2026-08-23), VÀ NÓ CHỈ LỘ RA KHI BẢNG ĐỦ 15 DÒNG.
 * Bản cũ trả về `walkSpeed / stride` và tự xưng là *"chu kỳ chân mỗi giây"*. Sai đơn vị: `stride`
 * đo bằng **bội số cẳng chân**, không phải bằng ô, nên thương số ấy có đơn vị `ô / (giây · cẳng
 * chân)` chứ không phải `1/giây`. Muốn ra tần số thật thì phải chia thêm cho chính chiều dài cẳng
 * chân — `HUMAN_BASE_HEIGHT × stature × legShare`.
 *
 * ⚠️ VÀ CÁI GIÁ KHÔNG PHẢI LÀ "CHỈ SAI HỆ SỐ" — **NÓ XẾP SAI THỨ TỰ CÁC KỶ.** Cẳng chân trải
 * 1,37 lần qua 15 kỷ (0,0864 tới 0,1180 ô), đủ để đảo chỗ: theo công thức cũ thì kỷ 14 (0,354)
 * nhịp gấp hơn kỷ 6 (0,299), còn theo tần số THẬT thì ngược lại (3,36 so với 3,45). Một đại lượng
 * dùng để so sánh mà đảo được thứ tự thì nó không so được gì.
 * ⇒ Đây là cùng họ với bài học `frame-fit.mjs` (Phase 7B): **công cụ nói dối bằng NHÃN chứ không
 * bằng SỐ**, nên phần dễ kiểm nhất của nó — các con số — thì vẫn "đúng", chỉ có ý nghĩa là sai.
 * Nó sống được suốt thời kỳ chỉ có MỘT kỷ được thiết kế, vì một danh sách một phần tử thì không
 * có thứ tự nào để mà sai.
 */
export function cadenceOf(style) {
  const s = style?.stride;
  const v = style?.walkSpeed;
  const st = style?.stature;
  const ls = style?.legShare;
  if (!Number.isFinite(s) || !Number.isFinite(v) || s <= 0) return 0;
  if (!Number.isFinite(st) || !Number.isFinite(ls) || st <= 0 || ls <= 0) return 0;
  return v / (s * HUMAN_BASE_HEIGHT * st * ls);
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
  if (!HEAD_MATERIAL_SET.has(row.headMaterial)) return false;
  if (!CARRY_SET.has(row.carry)) return false;
  if (!isValidGait(row.gait)) return false;
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
