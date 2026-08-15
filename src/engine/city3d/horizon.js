/**
 * horizon.js — VÙNG ĐẤT NGOÀI THÀNH PHỐ: thế giới không kết thúc ở rìa lưới.
 *
 * ⚠️ VÌ SAO FILE NÀY RA ĐỜI. Kỷ 13 khai thẳng trong `terrain.js`: *"đô thị Nhật kẹp giữa núi — đất
 * hẹp là lý do có nhà nang"*. Kỷ 7: *"đồi Toscana nối nhau — hình ảnh đặc trưng nhất của kỷ này"*.
 * Kỷ 8: *"Lisbon thành phố bảy quả đồi"*. Chụp ảnh ra thì **không có lấy một quả đồi nào** ở cả ba
 * kỷ: ra khỏi lưới 3,4 ô, thế giới là MỘT TẤM VÁN PHẲNG 72×72 tô một màu duy nhất (`sceneGraph.js`,
 * 12 tam giác). Dữ liệu địa lý đã nằm sẵn trong dự án từ Phase 7B; tầng vẽ vứt nó đi.
 *
 * Hệ quả không chỉ là "thiếu núi". Đo trên ảnh chụp thật (kỷ 11, 15 giờ): pitch camera 34,4° trừ
 * nửa FOV dọc 19° ⇒ **mép TRÊN khung hình nằm 15,4° DƯỚI tầm mắt**, nên 100% khung hình là mặt
 * đất — không một điểm ảnh nào là trời (đã chứng minh bằng cách sơn vòm trời ĐỎ CHÓI rồi chụp:
 * đỉnh khung vẫn nguyên màu đất). Cả bức ảnh vì thế chỉ còn HAI lớp: thành phố, và một mảng phẳng.
 * Đó chính là cảm giác "mô hình đặt trên bàn" thay vì "một nơi chốn".
 *
 * ⚠️ VÌ SAO ĐÂY LÀ MỘT TRƯỜNG RIÊNG CHỨ KHÔNG PHẢI NHÂN `relief` LÊN — LẦN THỨ NĂM CỦA CÙNG MỘT
 * BÀI HỌC. `ERA_TERRAIN[era].relief` tả mặt đất **CỦA THÀNH PHỐ**; núi non **VÂY QUANH** là một đại
 * lượng khác hẳn. Hỏi đúng câu hỏi mà Phase 5B / 7C / 8D đã hỏi — *"ngoài đời hai thứ này có luôn
 * đi cùng nhau không?"*:
 *   · Kyoto/Tokyo: lòng thung gần PHẲNG, núi quanh nó CAO ngất  → thấp ↔ cao
 *   · Manhattan:   nền granite gần phẳng, và cũng CHẲNG có núi   → thấp ↔ thấp
 *   · Burg Eltz:   mỏm đá DỐC NHẤT 15 kỷ, đồi rừng quanh cũng cao → cao  ↔ cao
 *   · Dubai:       thành phố san phẳng, đụn cát xa thì có sóng    → thấp ↔ vừa
 * Bốn tổ hợp đủ cả bốn góc ⇒ hai đại lượng ĐỘC LẬP. Nhân `relief` lên để ra núi thì Kyoto vĩnh viễn
 * không có núi còn Manhattan vĩnh viễn có, và **không cách chỉnh khéo nào thoát ra được** — y hệt
 * `storyHeight` gánh hai việc ở Phase 5B.
 *
 * ⚠️ VÀ ĐÂY LÀ THỨ TỰ BẮT BUỘC, ĐỪNG ĐẢO. Dựng núi TRƯỚC khi sửa sương thì núi **tàng hình hoàn
 * toàn**: sương tuyến tính cũ bão hoà 95–100% ở đúng vùng này (đo bằng cách sơn sương màu hồng cánh
 * sen). Đó đúng là cái bẫy Phase 8D đã sập một lần — ship một cơ chế ĐÃ CHẾT kèm một chú thích dài
 * giải thích nó chạy ra sao. `fogDensityFor` (`daylight.js`) phải đổi sang `FogExp2` TRƯỚC, và có
 * một bài test ở đó canh riêng điều này.
 */

import { APRON_DROP, terrainSurfaceReach, valueNoise } from './terrain';

/** Bao xa thì hết thế giới, tính bằng CẠNH LƯỚI. Phải nhỏ hơn bán kính vòm trời (3,6 × lưới). */
export const HORIZON_REACH = 3.0;

/**
 * Lưới đỉnh của vùng đất xa chia làm bao nhiêu bước từ TÂM ra tới CHỖ GIÁP.
 *
 * ⚠️ ĐỊNH NGHĨA THEO CHỖ GIÁP CHỨ KHÔNG PHẢI THEO MỘT BƯỚC LƯỚI CHO SẴN — và đó là cách DUY NHẤT
 * để chắc chắn có một đỉnh nằm ĐÚNG trên chỗ giáp. Bản đầu làm ngược lại (chọn bước lưới 2,0 rồi
 * làm tròn xem chỗ giáp rơi vào đâu) và mở ra một khe hở 0,5 đơn vị chạy vòng quanh thành phố, hiện
 * lên ảnh chụp thành hai cái nêm sáng chói ở hai góc dưới.
 */
export const HORIZON_INNER_STEPS = 20;

/**
 * Số tầng nhiễu TỐI ĐA chồng lên nhau (fBm).
 *
 * ⚠️ MỘT TẦNG NHIỄU KHÔNG BAO GIỜ RA ĐƯỢC MỘT DÃY NÚI — bản đầu của Phase 9A đã thử và ảnh quét cho
 * ra một đám **bong bóng tròn xoe** như sáp chảy, không phải núi. Lý do không phải "chỉnh chưa
 * khéo": địa hình thật là **phân dạng** — hình lớn có hình nhỏ trên nó, hình nhỏ lại có hình nhỏ
 * hơn. Một tầng nhiễu chỉ có đúng một cỡ hình, và mọi giá trị `ridged`/`grain` đều chỉ đổi cỡ cái
 * bong bóng chứ không sinh ra được cấp thứ hai.
 *
 * ⚠️ VÀ ĐÂY LÀ MỘT CÁI TRẦN CHƯA BAO GIỜ CHẠM TỚI — nói thẳng ra thay vì để con số 5 tự nhận công.
 * Đo thật (`.tmp-oct.mjs`, lưới 12/24/48 × 15 kỷ): mọi kỷ ra **3–4 tầng**, không kỷ nào ra 5. Thứ
 * thật sự cắt số tầng là SÀN Nyquist (`MIN_SAMPLES_PER_CELL`), và tỉ số `baseCell / minCell` rút
 * gọn lại chỉ còn phụ thuộc `grain` (≈ `grain × 11,5`) — cạnh lưới triệt tiêu, nên phóng to thành
 * phố cũng không thêm tầng. Cái trần này chỉ bắt đầu cắn khi `grain` > ~2,7, tức ngoài dải mà bảng
 * dưới đây khai và ngoài dải mà `horizon.test.js` cho phép. Nó là dây bảo hiểm cho mã viết sau, KHÔNG
 * phải một cơ chế đang chạy. Muốn biết số tầng THẬT thì đọc `buildHorizon(...).octaves`.
 */
export const MAX_OCTAVES = 5;

/**
 * Ô nhiễu KHÔNG BAO GIỜ được nhỏ hơn bấy nhiêu lần bước lưới.
 *
 * ⚠️ ĐÂY LÀ MỘT QUAN HỆ, VÀ NÓ ĐÃ CẮN MỘT LẦN. Bản đầu chọn cỡ ô nhiễu độc lập với bước lưới; kỷ 13
 * ra ô nhiễu 1,01 trong khi lưới lấy mẫu mỗi 2,0 đơn vị — tức trường gồ ghề **gấp bốn lần** thứ mà
 * lưới có thể tả. Kết quả: mỗi tam giác vớ được một giá trị nhiễu khác hẳn hàng xóm, và dãy núi ra
 * những mảng tam giác sắc lẹm — ĐÚNG cái vẻ "low-poly prototype" mà cả phase này sinh ra để xoá.
 * Pháp tuyến mượt KHÔNG cứu được: mượt hoá một trường đã bị lấy mẫu thiếu thì chỉ ra một tấm giấy
 * gấp bóng loáng. Cách chữa duy nhất là **đừng khai nhiều chi tiết hơn mức lưới chở nổi**.
 */
const MIN_SAMPLES_PER_CELL = 2.6;

/**
 * Vùng đất xa bắt đầu nhô lên từ đâu, tính bằng CẠNH LƯỚI kể từ tâm.
 *
 * ⚠️ PHẢI LỚN HƠN mép ngoài của tấm địa hình thành phố (`0,5 + APRON_EDGE` ô ≈ 0,33 × lưới) — chỗ
 * giáp giữa hai tấm phải PHẲNG ở cả hai bên thì mới không lộ đường nối. Chừa thêm một quãng nữa để
 * mắt đọc ra "một vùng đất bằng rồi mới tới chân núi", chứ không phải núi mọc ngay sát nhà.
 */
export const HORIZON_ONSET = 0.62;

/**
 * BẢNG 15 KỶ — mỗi dòng phải trả lời được *"đứng ở thành phố ấy mà nhìn ra xa thì thấy gì?"*.
 *
 * ⚠️ Cùng luật với `country`/`landmark` (`eraStyle.js`) và `FLORA_STYLES` (`floraStyle.js`): đây
 * KHÔNG phải nhãn dán cho đẹp. `note` bắt buộc nhắc tên nước mà `eraStyle.js` đã khai, **và có bài
 * test bắt** — không có ràng buộc đó thì 15 dòng thành 15 lần chọn bừa, mà chọn bừa chính là thứ đã
 * sinh ra "15 kỷ cao bằng nhau" (Phase 5B) và "mái tím ở 6/15 kỷ" (Phase 3G).
 *
 * · `rise`   đỉnh cao nhất của vùng đất xa, ĐƠN VỊ THẾ GIỚI (nhà dân cao ~1,5–3). 0 = phẳng thật.
 * · `grain`  cỡ hình LỚN NHẤT (cả khối núi / cả đợt sóng cát), tính theo cạnh lưới.
 * · `rough`  0 = chỉ có hình lớn, mặt trơn (đụn cát, thảo nguyên) · 1 = chi tiết nhỏ dày đặc (núi đá).
 * · `ridged` 0 = đồi tròn xoe · 1 = sống núi sắc. Dùng phép gấp `1 − |2n − 1|`, thứ tạo ra nếp gấp.
 * · `near`   0 = dãy núi lùi xa tít · 1 = đồi áp sát ngay ngoài thành phố.
 *
 * ⚠️ `grain` VÀ `rough` LÀ HAI VIỆC KHÁC NHAU, ĐỪNG GỘP. Bản đầu chỉ có `grain` và nó phải vừa trả
 * lời *"khối núi to bằng nào?"* vừa trả lời *"bề mặt gồ ghề tới đâu?"* — lần thứ SÁU của bài học
 * "một trường gánh hai việc". Ngoài đời hai thứ ấy độc lập: một đụn cát Sahara rất LỚN mà mặt cực
 * TRƠN; một mỏm đá vôi nhỏ mà mặt gồ ghề vụn nát. Gộp lại thì muốn cát trơn phải làm đụn bé xíu, và
 * muốn núi gồ ghề phải làm núi bé xíu — đúng thế bí mà Phase 5B đã gặp với `storyHeight`.
 */
export const HORIZON_STYLES = {
  1:  { rise: 2.6, grain: 0.8, rough: 0.42, ridged: 0.35, near: 0.7,
        note: 'Thổ Nhĩ Kỳ: Göbekli Tepe nhìn xuống đồng bằng Harran, vành đồi đá vôi thoai thoải vây quanh' },
  2:  { rise: 1.5, grain: 1.15, rough: 0.22, ridged: 0.1, near: 0.2,
        note: 'Ai Cập: hai bên thung lũng sông Nin là vách sa mạc thấp, xa và bằng — nhìn được tới chân trời' },
  3:  { rise: 0.5, grain: 1.3, rough: 0.15, ridged: 0.05, near: 0.15,
        note: 'Iraq: Lưỡng Hà phẳng tuyệt đối, không có gì chắn mắt — ziggurat là ngọn núi duy nhất, do người dựng' },
  4:  { rise: 3.4, grain: 0.88, rough: 0.46, ridged: 0.45, near: 0.55,
        note: 'Trung Quốc: kinh thành tựa lưng vào núi theo phong thuỷ, đồi thấp vây bốn phía' },
  5:  { rise: 5.2, grain: 0.74, rough: 0.58, ridged: 0.72, near: 0.85,
        note: 'Đức: Burg Eltz nằm lọt giữa rừng Eifel, sườn thung lũng dựng đứng ngay sát chân thành' },
  6:  { rise: 2.2, grain: 0.82, rough: 0.5, ridged: 0.55, near: 0.45,
        note: 'Việt Nam: đồng bằng Bắc Bộ trải rộng, dãy núi đá vôi mờ xanh nhô lên ở phía chân trời' },
  7:  { rise: 3.0, grain: 0.95, rough: 0.3, ridged: 0.12, near: 0.72,
        note: 'Ý: đồi Toscana nối nhau, tròn và mềm — không đỉnh nào nhọn, đó là cả nét đặc trưng' },
  8:  { rise: 2.8, grain: 0.78, rough: 0.44, ridged: 0.3, near: 0.8,
        note: 'Bồ Đào Nha: Lisboa "thành phố bảy quả đồi" đổ dốc, bên kia cửa sông Tejo là dải đồi thấp' },
  9:  { rise: 1.6, grain: 1.05, rough: 0.26, ridged: 0.15, near: 0.35,
        note: 'Pháp: lòng chảo sông Seine rộng và thoải, chỉ vài gò như Montmartre nhô khỏi mặt bằng' },
  10: { rise: 3.6, grain: 0.8, rough: 0.52, ridged: 0.5, near: 0.68,
        note: 'Anh: Manchester nằm dưới chân dãy Pennine, sườn đồi than đá dựng ngay rìa thành phố' },
  11: { rise: 1.2, grain: 1.1, rough: 0.24, ridged: 0.2, near: 0.25,
        note: 'Mỹ: Manhattan là đảo granite gần phẳng, xa mới thấy dải đồi New Jersey mờ bên kia sông' },
  12: { rise: 0.8, grain: 1.35, rough: 0.16, ridged: 0.05, near: 0.12,
        note: 'Nga: thảo nguyên mênh mông, phẳng đến mức thành biểu tượng — mắt không vướng gì cả' },
  13: { rise: 6.0, grain: 0.85, rough: 0.6, ridged: 0.8, near: 0.92,
        note: 'Nhật Bản: đô thị kẹp giữa núi, sườn dốc dựng lên ngay sau dãy nhà cuối cùng' },
  14: { rise: 1.0, grain: 1.0, rough: 0.2, ridged: 0.18, near: 0.3,
        note: 'Singapore: đất lấn biển phẳng tuyệt đối, chân trời chỉ có mấy hòn đảo thấp ngoài eo biển' },
  15: { rise: 2.4, grain: 1.2, rough: 0.18, ridged: 0.06, near: 0.5,
        note: 'UAE: sa mạc Dubai, đụn cát sóng dài nối nhau tới tận chân trời, không đỉnh nào nhọn' },
};

const FALLBACK_HORIZON = HORIZON_STYLES[1];

export function getHorizonStyle(era) {
  return HORIZON_STYLES[era] ?? FALLBACK_HORIZON;
}

function smoothstep(t) { return t * t * (3 - 2 * t); }

/**
 * Đỉnh cao nhất mà vùng đất xa của một kỷ CÓ THỂ đạt tới — tính bằng công thức, không dựng cả
 * trường rồi đo. Cùng lý do tồn tại với `terrainMaxHeight`: tầng vẽ cần biết trước để đặt sương và
 * để kiểm bằng test, mà "dựng ra rồi đo" thì không dùng được ở tầng thuần.
 */
export function horizonMaxHeight(era) {
  return Math.max(0, getHorizonStyle(era).rise);
}

/**
 * Dựng trường cao độ cho VÙNG ĐẤT XA.
 *
 * Toạ độ vào là **toạ độ THẾ GIỚI** (không phải toạ độ ô như `buildTerrain`), vì vùng này không còn
 * liên quan gì tới lưới 12×12 nữa — nó là phong cảnh, không phải đất xây dựng.
 *
 * ⚠️ HÀM NÀY KHÔNG ĐƯỢC PHỤ THUỘC TIẾN ĐỘ NGƯỜI CHƠI. Cùng bất biến với `buildTerrain` (xem
 * `ADR-007` và bài học Phase 7B): nếu dãy núi đổi hình mỗi lần Đàm xây xong một căn nhà thì cả chân
 * trời sẽ nhấp nhô theo từng phiên tập trung, và **không có gì báo**. Có bài test gọi kèm dữ liệu
 * rác để khoá điều này.
 *
 * @param {object} input
 * @param {number} input.era       1..15 (giá trị lạ → hồ sơ mặc định, không ném lỗi)
 * @param {number} input.gridSize  cạnh lưới thành phố (12)
 * @returns {{
 *   heightAt: (x:number, z:number) => number,
 *   innerEdge: number, reach: number, maxHeight: number, style: object,
 * }}
 */
export function buildHorizon({ era, gridSize = 12 } = {}) {
  const style = getHorizonStyle(era);
  const size = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : 12;
  const seed = `h|${era}`;

  // Mép TRONG: ĐỌC từ chính công thức sinh ra mép ngoài của tấm địa hình thành phố, không suy lại
  // bằng tay. Hai tấm phải gặp nhau ở đây, cùng cao độ `-APRON_DROP`; lệch một chút là có một khe
  // hở chạy vòng quanh thành phố (đã xảy ra thật — xem `TERRAIN_SUB` ở `terrain.js`).
  const innerEdge = terrainSurfaceReach(size);
  const reach = size * HORIZON_REACH;
  // Bước lưới suy từ chỗ giáp ⇒ luôn có một đỉnh nằm đúng trên đó.
  const step = innerEdge / HORIZON_INNER_STEPS;
  // `near` = 1 ⇒ núi bắt đầu ngay sát mép trong; `near` = 0 ⇒ lùi ra tới giữa quãng còn lại.
  const onset = Math.max(
    innerEdge + 0.6,
    size * HORIZON_ONSET + (1 - style.near) * (reach - size * HORIZON_ONSET) * 0.5,
  );
  const span = Math.max(1e-6, reach - onset);

  // Cỡ ô nhiễu LỚN NHẤT, theo ĐƠN VỊ THẾ GIỚI, suy từ cạnh lưới — `grain` là một TỈ LỆ, không phải
  // một khoảng cách. Viết thẳng "4,5 đơn vị" ở đây thì đổi cỡ lưới là cả dãy núi đổi tần số mà không
  // ai hiểu vì sao (đúng bài học "một con số tuyệt đối không diễn đạt được một QUAN HỆ", Phase 7D).
  // …và SÀN theo bước lưới: xem `MIN_SAMPLES_PER_CELL`. Kẹp ở đây chứ không ở tầng vẽ, vì trường
  // nhiễu là thứ BIẾT mình mịn tới đâu — tầng vẽ chỉ lấy mẫu.
  const minCell = step * MIN_SAMPLES_PER_CELL;
  const baseCell = Math.max(style.grain * size * 0.75, minCell);

  // BAO NHIÊU TẦNG fBm THẬT SỰ CHẠY. Mỗi tầng mịn gấp đôi tầng trước; dừng khi tầng kế tiếp mịn hơn
  // mức lưới chở nổi. `MAX_OCTAVES` chỉ là trần an toàn — ở lưới 12 thì SÀN Nyquist luôn cắn trước
  // (ra 3–4 tầng, xem `horizon.test.js`), nên đừng đọc con số 5 như "đang có 5 tầng".
  // Trả ra ngoài để bài test hỏi được: một vòng lặp fBm chạy đúng MỘT vòng thì lại là nhiễu một
  // tầng, tức đúng cái bong bóng tròn xoe mà cả bản vá này sinh ra để xoá — mà nhìn mã thì không
  // thấy, vì mã vẫn là một vòng `for` trông rất "phân dạng".
  let octaves = 0;
  for (let c = baseCell; octaves < MAX_OCTAVES && c >= minCell; c /= 2) octaves += 1;
  octaves = Math.max(1, octaves);

  function heightAt(x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return -APRON_DROP;
    // Khoảng cách Chebyshev — CÙNG phép đo mà vùng đất thoải của `terrain.js` dùng. Dùng Euclid ở
    // đây thì bốn góc thế giới tụt xuống thành bốn cái hố vuông góc với vành núi hình tròn.
    const d = Math.max(Math.abs(x), Math.abs(z));
    if (d <= onset) return -APRON_DROP;

    const t = smoothstep(Math.min(1, (d - onset) / span));

    // fBm: chồng `octaves` tầng nhiễu, mỗi tầng mịn gấp đôi và nhẹ đi `rough` lần. Đây là thứ phân
    // biệt "dãy núi" với "mấy cái bướu": một tầng chỉ có đúng một cỡ hình, mà địa hình thật thì hình
    // lớn nào cũng có hình nhỏ hơn nằm trên nó.
    //
    // `rough` chính là hệ số nhẹ-đi ấy, và nó đọc ra nghĩa vật lý: 0,16 (thảo nguyên Nga) ⇒ tầng thứ
    // hai chỉ còn 16% ⇒ mặt gần như chỉ có hình lớn, trơn tuột; 0,6 (núi Nhật) ⇒ chi tiết nhỏ vẫn
    // còn hơn nửa sức ⇒ sườn vụn nát. Cùng một `grain` vẫn ra hai bề mặt khác hẳn — đó là lý do hai
    // trường này phải tách đôi.
    let amp = 1;
    let sum = 0;
    let norm = 0;
    let c = baseCell;
    for (let o = 0; o < octaves; o += 1) {
      let n = valueNoise(`${seed}|o${o}`, x / c, z / c);
      // Phép GẤP: `1 − |2n − 1|` biến một quả đồi tròn thành một nếp gấp có SỐNG. Gấp ở MỌI tầng
      // (không chỉ tầng mịn) mới ra được sống núi lớn có sống nhỏ chạy trên nó — gấp mỗi tầng cuối
      // thì hình lớn vẫn tròn xoe và chỉ có bề mặt lấm tấm.
      if (style.ridged > 0) {
        const folded = 1 - Math.abs(2 * n - 1);
        n += (folded - n) * style.ridged;
      }
      sum += n * amp;
      norm += amp;
      amp *= style.rough;
      c /= 2;
    }
    const fractal = norm > 0 ? sum / norm : 0;

    // MẶT NẠ KHỐI NÚI — một tầng nhiễu RẤT thô (3,1 lần tầng lớn nhất, tức chỉ một hai ô cho cả thế
    // giới) quyết định HƯỚNG nào có núi cao, hướng nào thoáng. Đây KHÔNG phải một tầng fBm nữa: fBm
    // tả bề mặt của một khối núi, còn cái này tả việc khối núi ấy có mặt hay không. Thiếu nó thì
    // vành núi cao đều tăm tắp quanh thành phố như một cái chậu — đúng kiểu hỏng "rải đều trên lưới"
    // của Phase 8D, chỉ khác là rải đều theo góc nhìn.
    const massif = valueNoise(`${seed}|b`, x / (baseCell * 3.1), z / (baseCell * 3.1));

    // Nhân chứ không cộng: khối núi VẮNG MẶT thì phải kéo cả tầng chi tiết xuống theo, không để lại
    // một đám lấm tấm lơ lửng. Trần 1,0 giữ nguyên nên `horizonMaxHeight` vẫn là một cái kẹp đúng.
    const shape = (0.34 + massif * 0.66) * fractal;
    return -APRON_DROP + style.rise * t * shape;
  }

  return { heightAt, innerEdge, reach, step, octaves, maxHeight: horizonMaxHeight(era), style };
}
