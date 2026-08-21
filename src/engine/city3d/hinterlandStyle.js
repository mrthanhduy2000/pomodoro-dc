/**
 * hinterlandStyle.js — VÙNG PHỤ CẬN CỦA ĐÔ THỊ: dấu vết CON NGƯỜI nằm ngoài lưới thành phố.
 *
 * ⚠️ VÌ SAO FILE NÀY RA ĐỜI, SAU KHI MỘT BẢN VÁ ĐÚNG ĐÃ KHÔNG ĐỦ.
 *
 * VIỆC 1 đã lấp cái vành đất trống quanh thành phố bằng cây cối, bờ bụi, đá tảng (`outskirts.js`).
 * Nó CHẠY THẬT và đo được: kỷ 12 đi từ 64,82% xuống 38,61% đất trống. Rồi Đàm nhìn lại và **vẫn
 * nói thành phố nhỏ**. Đó là một con số, không phải một ý kiến: **thực vật không mang tín hiệu quy
 * mô.** Một cánh rừng vô tận quanh một cụm nhà làm cụm nhà ấy trông CÔ LẬP HƠN, không lớn hơn.
 *
 * Thứ làm mắt đọc ra "đây là một nơi LỚN" là **dấu vết con người trải ra xa**: ruộng có bờ, kênh
 * tưới, tường thành có cổng, một con đường đi khỏi khung hình, xóm vệ tinh, bến cảng, cối xay, ống
 * khói, cầu. Và đó cũng chính là thứ làm nó **giống thực tế lịch sử hơn** — hai yêu cầu của Đàm
 * («rộng hơn, quy mô hơn» và «giống thực tế lịch sử hơn») là CÙNG MỘT TRỤC, không phải hai.
 *
 * ⚠️ CẤM GIẢI BÀI NÀY BẰNG THỰC VẬT. Không nâng `OUTSKIRT_EDGE_DENSITY`/`OUTSKIRT_FAR_DENSITY`,
 * không thêm loài cây. Cây là CẢNH VẬT, không phải dấu vết người — phép đo (G1) ở
 * `humanTrace.js` phân loại theo BẢN CHẤT chứ không theo vị trí, nên rắc thêm cây ra ngoài lưới
 * sẽ làm con số (G1) đứng yên đúng như nó phải thế.
 *
 * ⚠️ VÌ SAO LÀ MỘT BẢNG RIÊNG CHỨ KHÔNG NHÉT VÀO `settingStyle.js`. `settingStyle` trả lời câu
 * *"chỗ này có nước không, nước nằm phía nào, đất nền kiểu gì"* — ĐỊA THẾ TỰ NHIÊN, thứ có trước
 * con người. Bảng này trả lời *"con người đã làm gì với chỗ ấy"*. Ngoài đời hai câu ấy độc lập:
 * cùng một khúc sông, thời đồ đá là bãi chăn thả còn thời công nghiệp là bến than. Trộn hai câu vào
 * một bảng là đúng cái bẫy "một trường gánh hai việc" mà dự án đã trả giá **năm lần**
 * (`storyHeight` · `roof` · bảng loài cây · `avenue` · `groundFloor`).
 *
 * Quan hệ MỘT CHIỀU, giống hệt `settingStyle` → `setting` → `outskirts`:
 *
 *     eraStyle.country ─┐
 *                       ├─→ hinterlandStyle (BẢNG) ─→ hinterland.js (HÌNH) ─→ sceneGraph (chỉ ĐỌC)
 *     settingStyle.water ┘
 *
 * `hinterlandStyle` ĐỌC `country` (để mỗi dòng buộc vào một đất nước có thật) và ĐỌC bảng nước (để
 * bến cảng không mọc giữa sa mạc). Tuyệt đối không có đường ngược lại. Cả hai ràng buộc đều **có
 * test khoá** — không có chúng thì hai bảng sẽ trôi khỏi nhau, và triệu chứng ("cảng ở kỷ không có
 * nước") chỉ lộ ra khi có người nhìn đúng kỷ ấy.
 *
 * ⚠️ `isValidHinterland` TỪ CHỐI THẲNG, KHÔNG TỰ CHỮA. Tự chữa là cách một bảng 15 dòng lặng lẽ
 * thoái hoá về 1 dòng — đúng cái bẫy `MIN_STONE` ở Phase 9D, nơi một phép kẹp nuốt mất phần chênh
 * giữa bốn kỷ khai bốn con số khác nhau mà không kêu một tiếng.
 *
 * ⚠️ MỖI DÒNG PHẢI TRẢ LỜI ĐƯỢC: *"vùng quanh đô thị nào CÓ THẬT, ở nước ấy, thời ấy, trông như
 * vậy?"* — câu trả lời nằm ở trường `note`, và nó phải nêu ĐÍCH DANH một nơi có thật. Trả lời
 * không được thì con số ấy là tuỳ hứng, mà tuỳ hứng chính là thứ đã sinh ra 15 kỷ cao bằng nhau
 * (Phase 5B).
 *
 * ⚠️ VÀ MUA ĐIỂM QUY MÔ BẰNG CÁCH NÓI DỐI LỊCH SỬ LÀ LỖI NẶNG HƠN MỘT ĐÔ THỊ NHỎ. Cách rẻ nhất để
 * đẩy con số (G1)/(G2) lên là rắc ruộng vuông cho cả 15 kỷ — và một khu định cư thời đồ đá có
 * ruộng vuông là một cái sai tệ hơn hẳn một thành phố trông nhỏ. Vì vậy có **test khoá HAI CHIỀU**
 * (`hinterlandStyle.test.js`): kỷ cổ KHÔNG ĐƯỢC có đường sắt/ống khói/ruộng rào/cần cẩu container,
 * và kỷ hiện đại KHÔNG ĐƯỢC thiếu hạ tầng của mình. Tiền lệ: `streetStyle.js` khoá bó vỉa (phát
 * minh La Mã) và vạch kẻ đường (thế kỷ 20) đúng bằng cách này.
 *
 * ⚠️ KỶ 1 VÀ KỶ 15 LÀ HAI CA NGHIỆM THU. Cả hai đều thật sự ÍT dấu vết nông nghiệp (Göbekli Tepe
 * có trước cây trồng thuần hoá; Dubai là sa mạc), nên tín hiệu quy mô của chúng phải đến từ chỗ
 * khác — đá dựng rải rác + lối mòn ở kỷ 1, đường thẳng tắp + cảng container ở kỷ 15. Nếu bảng này
 * làm hai kỷ ấy trông giống mười ba kỷ kia thì **BẢNG SAI, không phải cổng sai.**
 */

import { getEraStyle } from './eraStyle';

/**
 * Hình thái RUỘNG. Mỗi giá trị là một cách con người chia đất, và chúng đọc ra khác nhau từ xa —
 * đó là lý do trục này tồn tại: `strips` cho ra vệt dài song song, `canalGrid` cho ra ô vuông đều,
 * `paddy` cho ra bờ CONG, `vineyard` cho ra hàng cọc thẳng đứng. Bốn hình đó mắt phân biệt được ở
 * cỡ điểm ảnh của khung toàn cảnh, khác hẳn bốn sắc xanh khác nhau của cùng một hình — đúng bài
 * học `TECH_DEBT #41`: ở xa thì ĐƯỜNG VIỀN sống sót, BỀ MẶT thì không.
 */
export const FIELD_FORMS = [
  'none',        // không có ruộng
  'strips',      // dải hẹp dài bám mép nước (sông Nin · Waldhufendorf)
  'canalGrid',   // ô vuông/chữ nhật do kênh tưới chia (Lưỡng Hà · kinh thành Trung Hoa)
  'paddy',       // ruộng lúa nước, bờ vùng bờ thửa CONG
  'vineyard',    // nho / ô liu trồng theo hàng trên đồi
  'hedgedGrid',  // ô vuông có hàng rào cây (enclosure Anh)
  'collective',  // ruộng tập thể mênh mông không hàng rào
  'openField',   // ruộng lớn không hàng rào, luân canh (Pháp trung–cận đại)
];

/** Công trình NƯỚC ngoài đô thị. `none` là một câu trả lời hợp lệ, không phải một chỗ trống. */
export const WATERWORKS = ['none', 'ditch', 'canal', 'dyke', 'aqueduct'];

/**
 * Tường bao NGOÀI đô thị (không phải tường nhà).
 *
 * ⚠️ `bamboo` KHÔNG dựng ra một bức tường — luỹ tre là vòng cây quanh XÓM, và nó được dựng trong
 * `hamlet()` chứ không trong `rampart()`. Hai thứ ấy cùng nằm dưới một tên trường vì cùng trả lời
 * câu *"ranh giới của cộng đồng này là gì"*, nhưng chúng là hai VẬT khác nhau; gộp hình của chúng
 * sẽ đẻ ra một hàng rào tre thẳng tắp dài hàng trăm mét, thứ không tồn tại ở làng Bắc Bộ.
 */
export const WALL_KINDS = ['none', 'earth', 'stone', 'bamboo'];

/**
 * Con đường RỜI KHỎI khung hình.
 *
 * ⚠️ ĐÂY LÀ TÍN HIỆU RẺ NHẤT VÀ MẠNH NHẤT CHO CỔNG (G2). Một con đường chạy thẳng ra mép khung
 * đặt dấu vết người vào ĐÚNG những dải xa mà biểu đồ chiều sâu đang trống, với chi phí hình học
 * gần bằng không.
 *
 * ⚠️ VÌ VẬY BẢNG TỪ VỰNG NÀY **KHÔNG CÓ GIÁ TRỊ `'none'`**, và đó là một quyết định chứ không phải
 * một thiếu sót. Một đô thị mà không con đường nào đi đâu cả là một mô hình đặt trên bàn — đúng
 * thứ Đàm đã chỉ ra ở VIỆC 1. Bỏ `'none'` khỏi chính ENUM (thay vì để nó trong enum rồi cho
 * validator chặn) làm luật ấy thành CẤU TRÚC: không khai nhầm được, và không có một nhánh mã đặc
 * biệt nào để quên. Kỷ 1 thời đồ đá vẫn có `'track'` — obsidian và vỏ ốc biển tới Göbekli Tepe từ
 * hàng trăm cây số, tức mạng đi lại CÓ THẬT; thứ chưa tồn tại là mặt đường LÁT, không phải con
 * đường.
 */
export const OUTBOUND_ROADS = ['track', 'road', 'boulevard', 'highway'];

/** Bến / cảng. Bị khoá cứng vào bảng nước — xem `isValidHinterland` và test đi kèm. */
export const DOCK_KINDS = ['none', 'landing', 'wharf', 'container'];

/** Hạ tầng riêng của từng kỷ — mảng 0..3 phần tử. */
export const INFRA_KINDS = [
  'standingStones', 'huntingCamp', 'granary', 'watchtower', 'windmill',
  'chimney', 'railway', 'bridge', 'crane', 'elevatedRoad',
  'factory', 'quarry', 'kiln', 'terracedHousing',
];

const FIELD_SET = new Set(FIELD_FORMS);
const WATERWORKS_SET = new Set(WATERWORKS);
const WALL_SET = new Set(WALL_KINDS);
const ROAD_SET = new Set(OUTBOUND_ROADS);
const DOCK_SET = new Set(DOCK_KINDS);
const INFRA_SET = new Set(INFRA_KINDS);

/**
 * ⚠️ TỪ CHỐI THẲNG, KHÔNG TỰ CHỮA — và đây là lý do, viết ra để đừng ai "cải tiến" nó thành tự
 * chữa cho tiện: một validator biết tự chữa sẽ nhận mọi dòng sai rồi lặng lẽ trả về cùng một giá
 * trị mặc định, và bảng 15 dòng thoái hoá về 1 dòng mà **không có gì đỏ lên**. Đó chính xác là cái
 * bẫy `MIN_STONE` ở Phase 9D (bốn kỷ khai bốn cỡ viên lát, một phép kẹp nuốt hết phần chênh) và là
 * lý do `isValidStreetStyle`/`isValidGroundFloor` cũng chỉ trả `true`/`false`.
 *
 * ⚠️ VÀ ĐI KÈM NÓ PHẢI CÓ MỘT PHÉP ĐẾM Ở ĐẦU BÊN KIA. Bài học Phase 10 Bước 2: kỷ 14 khai
 * `doorWidth: 0.46` vượt trần 0,42 ⇒ validator từ chối ĐÚNG, hàm dựng trả `false` ĐÚNG, và cả kỷ
 * ấy **không có cửa** — hai lời "đúng" cộng lại thành một lỗi im lặng. Nên `hinterlandStyle.test.js`
 * có một assert đòi: kỷ nào khai HỢP LỆ thì `buildHinterland` phải dựng ra ÍT NHẤT một vật thể.
 *
 * Các luật CẤU TRÚC (không cần biết kỷ nào là kỷ nào — những luật ấy nằm ở test vì chúng là quan
 * hệ giữa HAI bảng, xem khối chú thích đầu file):
 *
 *  1. Mọi trường phải nằm trong bảng từ vựng của nó.
 *  2. `fieldDensity` ∈ [0,1], và **bằng 0 khi và chỉ khi `fields === 'none'`**. Một hình thái ruộng
 *     mà mật độ 0 là một dòng nói dối (bảng khai có ruộng, màn hình không có gì); một mật độ khác 0
 *     mà không có hình thái là một con số không ai đọc — nó sẽ trôi tự do vì không gì kiểm nó.
 *  3. `gate` chỉ được `true` khi `wall !== 'none'`. Một cái cổng không có tường là một khung cửa
 *     dựng giữa đồng.
 *  4. `infra` ≤ 3 phần tử và KHÔNG TRÙNG NHAU. Trùng nhau thì bảng trông như có ba thứ trong khi
 *     màn hình chỉ có hai — đúng loại lệch KHAI ↔ DỰNG mà `TECH_DEBT #42` đã trả giá.
 *  5. `note` phải có thật và đủ dài để nêu được đích danh một nơi. Ràng buộc *"nơi ấy có thật
 *     không"* thì máy không kiểm được — nó nằm ở phản biện của con người và ở chính trường `note`.
 *  6. `country` phải có thật. Việc nó có KHỚP `eraStyle.js` hay không là quan hệ giữa hai bảng nên
 *     nó nằm ở `hinterlandCountryMismatches()`, không nằm ở đây — nhưng trường phải tồn tại, vì
 *     nó chính là câu hỏi buộc người điền dòng phải trả lời *"vùng quanh đô thị NÀO?"*.
 *
 * @param {object} style
 * @returns {boolean} true nếu dòng hợp lệ. KHÔNG bao giờ trả về một dòng đã sửa.
 */
export function isValidHinterland(style) {
  if (!style || typeof style !== 'object') return false;

  if (!FIELD_SET.has(style.fields)) return false;
  if (!WATERWORKS_SET.has(style.waterworks)) return false;
  if (!WALL_SET.has(style.wall)) return false;
  if (!ROAD_SET.has(style.outboundRoad)) return false;
  if (!DOCK_SET.has(style.dock)) return false;

  const d = style.fieldDensity;
  if (!Number.isFinite(d) || d < 0 || d > 1) return false;
  if ((style.fields === 'none') !== (d === 0)) return false;

  if (typeof style.gate !== 'boolean') return false;
  if (style.gate && style.wall === 'none') return false;

  if (!Number.isInteger(style.hamletCount) || style.hamletCount < 0 || style.hamletCount > 4) return false;
  if (!Number.isInteger(style.hamletSize) || style.hamletSize < 1 || style.hamletSize > 5) return false;

  if (!Array.isArray(style.infra) || style.infra.length > 3) return false;
  if (style.infra.some((k) => !INFRA_SET.has(k))) return false;
  if (new Set(style.infra).size !== style.infra.length) return false;

  if (typeof style.note !== 'string' || style.note.trim().length < 20) return false;
  if (typeof style.country !== 'string' || style.country.trim().length === 0) return false;

  return true;
}


/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BẢNG 15 KỶ.
 *
 * ⚠️ MỖI DÒNG ĐÃ QUA HAI VÒNG: một vòng nghiên cứu (vùng quanh đô thị ấy, nước ấy, thời ấy trông
 * ra sao) và một vòng PHẢN BIỆN đối kháng đi tìm lỗi thời đại, lỗi lệch bảng nước, và lỗi "mua
 * điểm quy mô bằng cách nói dối lịch sử". Kết quả: 11 dòng ĐẠT nguyên vẹn, 4 dòng bị SỬA, 0 dòng
 * bị BÁC. Bốn chỗ sửa được ghi thẳng vào `note` của dòng ấy, vì chúng là bài học chứ không phải
 * thủ tục:
 *
 *  · **Kỷ 5 (Đức)** — vòng đầu khai `vineyard` 0,34 rồi CHÍNH dẫn chứng của nó tự bác: *"phần lớn
 *    là rừng Eltzer Wald và hẻm suối dốc đứng, nho chỉ bám được vài sườn nắng"*. Một phần ba đất
 *    phủ nho không phải là "vài sườn". Nó cũng sẽ giẫm chân kỷ 7 (Ý), nơi nho–ô liu là chữ ký
 *    thật. Bảng từ vựng đã có sẵn giá trị đúng và chú giải của nó ghi thẳng chữ **Waldhufendorf** —
 *    hình thái khai hoang rừng của Đức trung đại: những dải ruộng hẹp chạy từ đường làng lùi vào
 *    rừng. Và bến thuyền bị gỡ: mặt nước trong khung là khúc uốn suối Elzbach ôm quanh mỏm đá 70 m,
 *    không thuyền nào tới được; cái bến được viện ra nằm ở Moselkern, CÁCH ĐÓ VÀI KILÔMÉT và thấp
 *    hơn hẳn — tức một dòng mô tả MỘT vùng đang ghép hai cảnh.
 *  · **Kỷ 6 (Việt Nam)** — giá trị đúng hết, nhưng ba dẫn chứng sai NIÊN ĐẠI: cổng làng Mông Phụ
 *    thường được ghi 1833 (Minh Mạng), đình Mông Phụ 1684, và "nghĩa thương" là định chế thời
 *    Nguyễn — cả ba đều nằm NGOÀI cửa sổ của kỷ này. Mốc neo đúng là **hệ đê Bắc Bộ**: đê Cơ Xá
 *    1108 và chức Hà đê sứ 1248. Bài học: một dòng có thể đúng ở mọi con số mà vẫn tựa lên một
 *    niên đại sai, và niên đại sai là thứ phiên sau kế thừa rồi dựa vào.
 *  · **Kỷ 13 (Nhật Bản)** — vòng đầu khai ô lúa nhỏ xen nhà. Nhưng `settingStyle` của chính dự án
 *    khai kỷ này `ground: 'reclaimed'` — ĐẤT LẤN BIỂN (umetate) ven vịnh Tokyo, và trên đất lấn
 *    biển thì không có ruộng. Đây là lần bảng địa thế bác một dòng của bảng phụ cận, đúng như quan
 *    hệ một chiều giữa hai bảng phải thế.
 *  · **Kỷ 15 (UAE)** — vòng đầu khai hàng chà là 0,12 rồi cũng tự bác: *"quanh Dubai là sa mạc cát
 *    và sabkha, không trồng trọt được"*. Vườn chà là thật của Dubai nằm ở Al Awir và Al Lisaili,
 *    sâu trong nội địa phía đông-nam — cách vành đai Jebel Ali hàng chục kilômét, tức lại là lỗi
 *    ghép hai vùng. Hàng cọ dọc Sheikh Zayed Road là CẢNH QUAN đô thị, không phải ruộng.
 *
 * ⚠️ BỐN KỶ KHAI `fields: 'none'` (1 · 13 · 14 · 15), VÀ ĐÓ LÀ KẾT QUẢ ĐÚNG, KHÔNG PHẢI
 * MỘT CHỖ CHƯA LÀM. Göbekli Tepe có trước cây trồng thuần hoá; Keihin, Marina Bay và Jebel Ali đều
 * là đất lấn biển hoặc sa mạc. Bốn kỷ ấy phải lấy tín hiệu quy mô từ chỗ khác — đá dựng và lối mòn
 * hội tụ ở kỷ 1; cảng container, đường trên cao và nhà máy ở ba kỷ kia. Nếu bảng làm chúng trông
 * giống mười một kỷ còn lại thì BẢNG SAI, không phải cổng sai.
 */
export const HINTERLAND_STYLES = {
  // ── Kỷ 1 · Thổ Nhĩ Kỳ ────────────────────────────────────────────────
  1: {
    country: 'Thổ Nhĩ Kỳ',
    note: "Sườn rặng Germuş quanh Göbekli Tepe (Şanlıurfa): thảo nguyên khô nhìn xuống đồng bằng Harran, mỏ đá vôi kề bên còn cột chữ T bỏ dở nằm tại chỗ.",
    fields: 'none',
    fieldDensity: 0,
    waterworks: 'none',
    wall: 'none',
    gate: false,
    outboundRoad: 'track',
    hamletCount: 3,
    hamletSize: 2,
    dock: 'none',
    infra: ['standingStones', 'quarry', 'huntingCamp'],
  },
  // ── Kỷ 2 · Ai Cập ────────────────────────────────────────────────────
  2: {
    country: 'Ai Cập',
    note: "Kahun (el-Lahun) ở cửa Fayum: thị trấn gạch bùn có tường bao và một cổng, quanh là ruộng dải bám kênh Bahr Yussef, đê đất giữ nước lũ, bến thuyền và kho thóc hình nón.",
    fields: 'strips',
    fieldDensity: 0.75,
    waterworks: 'dyke',
    wall: 'earth',
    gate: true,
    outboundRoad: 'track',
    hamletCount: 3,
    hamletSize: 4,
    dock: 'landing',
    infra: ['granary', 'quarry'],
  },
  // ── Kỷ 3 · Iraq ──────────────────────────────────────────────────────
  3: {
    country: 'Iraq',
    note: "Đồng bằng Ur–Eridu quanh Tell al-Muqayyar (Ur), nơi khảo sát của Robert McC. Adams ghi nhận mạng kênh tưới và làng mạc dày đặc; bến tây Ur nối ra nhánh Euphrates cổ.",
    fields: 'canalGrid',
    fieldDensity: 0.72,
    waterworks: 'canal',
    wall: 'earth',
    gate: true,
    outboundRoad: 'track',
    hamletCount: 3,
    hamletSize: 3,
    dock: 'wharf',
    infra: ['granary', 'kiln', 'watchtower'],
  },
  // ── Kỷ 4 · Trung Quốc ────────────────────────────────────────────────
  4: {
    country: 'Trung Quốc',
    note: "Đồng bằng Quan Trung phía bắc thành Trường An (Tây An): lưới kênh Trịnh Quốc Cừ chia ruộng thành ô, bến tào lương Quảng Vận Đàm và cầu Vị Thuỷ bắc qua sông Vị.",
    fields: 'canalGrid',
    fieldDensity: 0.72,
    waterworks: 'canal',
    wall: 'earth',
    gate: true,
    outboundRoad: 'road',
    hamletCount: 4,
    hamletSize: 3,
    dock: 'wharf',
    infra: ['granary', 'bridge', 'watchtower'],
  },
  // ── Kỷ 5 · Đức ───────────────────────────────────────────────────────
  5: {
    country: 'Đức',
    note: "Cao nguyên Maifeld quanh Münstermaifeld và Wierschem, ngay trên hẻm suối Elzbach của Burg Eltz, dẫn ra bến Moselkern nơi suối đổ vào sông Mosel.",
    fields: 'strips',
    fieldDensity: 0.18,
    waterworks: 'ditch',
    wall: 'stone',
    gate: true,
    outboundRoad: 'road',
    hamletCount: 3,
    hamletSize: 3,
    dock: 'none',
    infra: ['quarry', 'kiln', 'watchtower'],
  },
  // ── Kỷ 6 · Việt Nam ──────────────────────────────────────────────────
  6: {
    country: 'Việt Nam',
    note: "Làng Chu Quyến (Ba Vì, Hà Nội) trong vùng đê sông Hồng: luỹ tre gai bọc kín làng, cổng làng trổ qua luỹ tre, bến đò có bậc đá dưới chân đê, trong đê là biển lúa. Mốc của kỷ này là HỆ ĐÊ Bắc Bộ — đê Cơ Xá 1108 (Lý Nhân Tông), đê quai vạc dọc sông và chức Hà đê sứ 1248 (Trần). Ngôi đình Chu Quyến còn đứng đến nay là bản thế kỷ 17 của một hình thái làng đã có từ trước đó, nêu như hậu duệ chứ không dùng làm mốc.",
    fields: 'paddy',
    fieldDensity: 0.88,
    waterworks: 'dyke',
    wall: 'bamboo',
    gate: true,
    outboundRoad: 'track',
    hamletCount: 4,
    hamletSize: 4,
    dock: 'landing',
    infra: ['granary', 'watchtower', 'bridge'],
  },
  // ── Kỷ 7 · Ý ─────────────────────────────────────────────────────────
  7: {
    country: 'Ý',
    note: "Đồi Settignano–Maiano và làng Impruneta quanh Firenze: nho–ô liu trồng theo hàng, mỏ đá pietra serena, lò nung Impruneta từng cấp ngói cho vòm Brunelleschi.",
    fields: 'vineyard',
    fieldDensity: 0.72,
    waterworks: 'canal',
    wall: 'stone',
    gate: true,
    outboundRoad: 'road',
    hamletCount: 3,
    hamletSize: 4,
    dock: 'landing',
    infra: ['bridge', 'quarry', 'kiln'],
  },
  // ── Kỷ 8 · Bồ Đào Nha ────────────────────────────────────────────────
  8: {
    country: 'Bồ Đào Nha',
    note: "Sườn đồi Carnaxide–Belém phía tây Lisboa: vườn nho, cối xay gió trắng, và mỏ đá lioz Pêro Pinheiro — nơi lấy đá xây tu viện Jerónimos (khởi công 1501).",
    fields: 'vineyard',
    fieldDensity: 0.5,
    waterworks: 'ditch',
    wall: 'stone',
    gate: true,
    outboundRoad: 'road',
    hamletCount: 4,
    hamletSize: 3,
    dock: 'wharf',
    infra: ['windmill', 'watchtower', 'quarry'],
  },
  // ── Kỷ 9 · Pháp ──────────────────────────────────────────────────────
  9: {
    country: 'Pháp',
    note: "Vành đai Paris 1780: Arcueil (cầu dẫn nước Médicis vượt thung lũng Bièvre + mỏ đá vôi) và đồi cối xay Montmartre, ngoài xa là đồng lúa mì Plaine de France không hàng rào.",
    fields: 'openField',
    fieldDensity: 0.75,
    waterworks: 'aqueduct',
    wall: 'stone',
    gate: true,
    outboundRoad: 'boulevard',
    hamletCount: 4,
    hamletSize: 4,
    dock: 'wharf',
    infra: ['windmill', 'quarry', 'bridge'],
  },
  // ── Kỷ 10 · Anh ───────────────────────────────────────────────────────
  10: {
    country: 'Anh',
    note: "Chat Moss – Worsley, tây Manchester: đầm than bùn khai hoang thành ô ruộng có hàng rào, kênh Bridgewater với bến than Worsley, đường sắt Liverpool–Manchester 1830 chạy nổi qua đầm.",
    fields: 'hedgedGrid',
    fieldDensity: 0.55,
    waterworks: 'canal',
    wall: 'none',
    gate: false,
    outboundRoad: 'road',
    hamletCount: 3,
    hamletSize: 4,
    dock: 'wharf',
    infra: ['chimney', 'railway', 'terracedHousing'],
  },
  // ── Kỷ 11 · Mỹ ────────────────────────────────────────────────────────
  11: {
    country: 'Mỹ',
    note: "Bờ tây Manhattan nhìn sang Hackensack Meadowlands và bến Hoboken–Weehawken: đất bồi giữ bằng tường bến, lô cỏ muối dài bám lạch, bãi tàu hoả và bến ngón tay sát mép nước.",
    fields: 'strips',
    fieldDensity: 0.3,
    waterworks: 'dyke',
    wall: 'none',
    gate: false,
    outboundRoad: 'boulevard',
    hamletCount: 4,
    hamletSize: 5,
    dock: 'wharf',
    infra: ['railway', 'elevatedRoad', 'chimney'],
  },
  // ── Kỷ 12 · Nga ───────────────────────────────────────────────────────
  12: {
    country: 'Nga',
    note: "Rìa bắc Volgograd: xóm Rynok–Orlovka dưới chân Nhà máy máy kéo Stalingrad, sau lưng là thảo nguyên Don với nông trang tập thể vùng Gorodishche; bờ tây Volga dựng đứng.",
    fields: 'collective',
    fieldDensity: 0.45,
    waterworks: 'ditch',
    wall: 'earth',
    gate: false,
    outboundRoad: 'road',
    hamletCount: 3,
    hamletSize: 4,
    dock: 'wharf',
    infra: ['factory', 'chimney', 'railway'],
  },
  // ── Kỷ 13 · Nhật Bản ──────────────────────────────────────────────────
  13: {
    country: 'Nhật Bản',
    note: "Dải lấn biển Keihin ven vịnh Tokyo, phía đông trung tâm: bến container Shinagawa (1967) và Ōi (1971) sau đê chắn triều, nối liền vành đai nhà máy Kawasaki trên đất umetate Ukishima–Chidori-chō. Toàn bộ vành ngoài là cảng và công nghiệp — trên đất lấn biển không có ruộng.",
    fields: 'none',
    fieldDensity: 0,
    waterworks: 'dyke',
    wall: 'none',
    gate: false,
    outboundRoad: 'highway',
    hamletCount: 3,
    hamletSize: 5,
    dock: 'container',
    infra: ['chimney', 'railway', 'factory'],
  },
  // ── Kỷ 14 · Singapore ─────────────────────────────────────────────────
  14: {
    country: 'Singapore',
    note: "Vành Tuas – Jurong Island (Singapore): đất lấn biển quây đê kè đá, bến container PSA, nhà máy lọc dầu, cao tốc AYE và tuyến MRT trên cao — không một thửa ruộng nào.",
    fields: 'none',
    fieldDensity: 0,
    waterworks: 'dyke',
    wall: 'none',
    gate: false,
    outboundRoad: 'highway',
    hamletCount: 4,
    hamletSize: 5,
    dock: 'container',
    infra: ['elevatedRoad', 'railway', 'factory'],
  },
  // ── Kỷ 15 · UAE ───────────────────────────────────────────────────────
  15: {
    country: 'UAE',
    note: "Vành đai Jebel Ali (cảng container + khu tự do, phía tây nam Dubai): sabkha và cát trống trơn, không canh tác — đường E11 Sheikh Zayed chạy thẳng tắp qua sa mạc, cầu cạn Metro Đỏ chạy song song, hàng cần cẩu giàn ở mép biển. Vườn chà là tưới nhỏ giọt của Dubai nằm ở Al Awir và Al Lisaili, sâu trong nội địa phía đông–đông nam, KHÔNG thuộc vành đai này.",
    fields: 'none',
    fieldDensity: 0,
    waterworks: 'none',
    wall: 'none',
    gate: false,
    outboundRoad: 'highway',
    hamletCount: 3,
    hamletSize: 4,
    dock: 'container',
    infra: ['elevatedRoad', 'crane', 'factory'],
  },
};

/**
 * Dòng bảng của một kỷ. Kỷ lạ → rơi về kỷ 1.
 *
 * ⚠️ RƠI VỀ KỶ 1 CHỨ KHÔNG TRẢ VỀ MỘT DÒNG MẶC ĐỊNH BỊA RA. Kỷ 1 là dòng NGHÈO NHẤT bảng (không
 * ruộng, không tường, không bến, không công trình nước), nên một kỷ lạ sẽ ra một vùng phụ cận
 * thưa thớt — dễ nhận ra là bất thường. Một dòng mặc định "trung bình" thì ngược lại: nó trông
 * hợp lý ở mọi kỷ và vì thế che mất lỗi.
 */
export function getHinterlandStyle(era) {
  return HINTERLAND_STYLES[era] ?? HINTERLAND_STYLES[1];
}

/** Mọi số kỷ bảng này khai — dùng cho test duyệt đủ 15 dòng, không viết cứng `1..15`. */
export const HINTERLAND_ERAS = Object.keys(HINTERLAND_STYLES).map(Number).sort((a, b) => a - b);

/**
 * ⚠️ MỐC LỊCH SỬ — HAI CHIỀU, và cả hai chiều đều cần thiết.
 *
 * Chiều CẤM giữ cho kỷ cổ khỏi có thứ chưa được phát minh. Chiều BẮT BUỘC giữ cho kỷ hiện đại
 * khỏi trống trơn — vì nếu chỉ có chiều cấm thì cách rẻ nhất để "15 kỷ khác nhau" là rắc hạ tầng
 * hiện đại khắp nơi rồi gỡ dần ở kỷ cổ, tức mua điểm bằng cách bỏ trống nửa bảng.
 *
 * Tiền lệ: `streetStyle.js` khoá bó vỉa (phát minh La Mã) và vạch kẻ đường (thế kỷ 20) đúng bằng
 * hai chiều này. Các mốc dưới đây là mốc CÔNG NGHỆ, không phải mốc thẩm mỹ, nên chúng kiểm được:
 *
 *  · đường sắt · ống khói nhà máy · nhà máy · dãy nhà thợ — cách mạng công nghiệp, thế kỷ 19 ⇒ kỷ ≥ 10
 *  · cần cẩu giàn container — Malcom McLean 1956 ⇒ kỷ ≥ 13
 *  · đường trên cao · cao tốc — thế kỷ 20 ⇒ kỷ ≥ 11
 *  · ruộng ô có hàng rào (enclosure) — Anh thế kỷ 16–19 ⇒ kỷ ≥ 10
 *  · ruộng tập thể — thế kỷ 20 ⇒ kỷ ≥ 12
 */
export const MOC_CONG_NGHIEP = 10;
export const MOC_THE_KY_20 = 11;
export const MOC_CONTAINER = 13;

/**
 * Đối chiếu `country` của bảng này với `eraStyle.js`. Xuất ra để BÀI TEST gọi — mã sản phẩm không
 * cần tới nó. Viết ở đây chứ không viết trong bài test vì cùng lý do `settingCountryMismatches`
 * (`settingStyle.js`) đã nêu: một sợi dây buộc hai bảng phải có ĐÚNG MỘT công thức, không phải
 * một vòng lặp so sánh chép lại ở mỗi chỗ cần.
 *
 * ⚠️ VÌ SAO PHẢI CHÉP `country` VÀO ĐÂY thay vì đọc thẳng `eraStyle` lúc chạy: trường này không
 * phải dữ liệu để dùng, nó là **câu hỏi buộc người điền dòng phải trả lời**. `streetStyle.js` và
 * `settingStyle.js` đều làm đúng thế, và CLAUDE.md ghi rõ lý do: *"không có ràng buộc ấy thì 15
 * dòng là 15 lần chọn bừa, mà chọn bừa chính là thứ đã sinh ra 15 kỷ giống hệt nhau"*. Bản chép
 * không trôi được vì hàm này khoá nó.
 */
export function hinterlandCountryMismatches() {
  const lech = [];
  for (const era of HINTERLAND_ERAS) {
    const cua_bang = HINTERLAND_STYLES[era].country;
    const cua_eraStyle = getEraStyle(era)?.country;
    if (cua_bang !== cua_eraStyle) lech.push({ era, cua_bang, cua_eraStyle });
  }
  return lech;
}

/**
 * Đếm xem mỗi giá trị từ vựng được BAO NHIÊU kỷ dùng tới.
 *
 * ⚠️ Đây là phép đo *"trục này còn sống không"*. Một trục mà cả 15 kỷ khai giống hệt nhau thì bảng
 * thật ra hẹp hơn nó trông — đúng cơ chế "lùm cây" chết im lặng ở Phase 8D, nơi mã vẫn chạy đủ mà
 * chưa bao giờ làm được gì. Bài test đòi mỗi trục phải có ≥ 2 giá trị được dùng.
 *
 * Nhận `styles` làm tham số để ĐỐI CHỨNG bơm được một bảng hỏng (15 kỷ y hệt nhau) vào rồi đòi
 * phép đếm bắt được — nếu bài test tự viết lại vòng lặp thì luật đếm có hai công thức.
 */
export function summarizeHinterland(styles = HINTERLAND_STYLES) {
  const dem = { fields: {}, waterworks: {}, wall: {}, outboundRoad: {}, dock: {}, infra: {} };
  for (const st of Object.values(styles)) {
    dem.fields[st.fields] = (dem.fields[st.fields] ?? 0) + 1;
    dem.waterworks[st.waterworks] = (dem.waterworks[st.waterworks] ?? 0) + 1;
    dem.wall[st.wall] = (dem.wall[st.wall] ?? 0) + 1;
    dem.outboundRoad[st.outboundRoad] = (dem.outboundRoad[st.outboundRoad] ?? 0) + 1;
    dem.dock[st.dock] = (dem.dock[st.dock] ?? 0) + 1;
    for (const k of st.infra ?? []) dem.infra[k] = (dem.infra[k] ?? 0) + 1;
  }
  return dem;
}
