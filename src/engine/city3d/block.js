/**
 * block.js — DỰNG HÌNH một khu phố: lấy mặt bằng của MỘT căn nhà rồi chia nó thành 4–10 đơn vị.
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * Đây là lớp HÌNH của khuôn ba lớp; lớp BẢNG là `blockStyle.js` (đọc khối chú thích ở đó để biết
 * vì sao phải CHIA NHỎ chứ không THÊM VÀO), và người đọc duy nhất là `cityParts.js`.
 *
 * ── CƠ CHẾ, GỌN TRONG BỐN BƯỚC ───────────────────────────────────────────────────────────────
 *   1. Dựng **bản tham chiếu**: đúng căn nhà mà hôm nay đang đứng ở ô ấy, không sửa gì.
 *   2. Đo hình bao CHỮ NHẬT của nó (`specFootprint`) — đó là chỗ đất khu phố được phép dùng.
 *      ⚠️ KHÔNG dùng `specSpan`: nó trả về cạnh của hình VUÔNG bao ngoài và cố ý ước lượng thừa,
 *      nên nó vừa thổi phồng bề ngang vừa không nói gì về chiều sâu. Xem chú thích của cả hai hàm.
 *   3. Hỏi `deriveBlockUnits` xem chỗ đất ấy chia được thành mấy đơn vị và mỗi đơn vị nằm đâu.
 *   4. Dựng từng đơn vị bằng CHÍNH `buildBuildingSpec` (tham số `plot`), rồi xoay + dời khối của
 *      nó về đúng chỗ và gộp tất cả vào một mô tả duy nhất.
 *
 * ── BA HỆ QUẢ CỦA VIỆC TRẢ VỀ **MỘT** MÔ TẢ CHỨ KHÔNG PHẢI N MÔ TẢ ───────────────────────────
 *   · `cityParts.js` vẫn trả về đúng 30 nhà dân như cũ ⇒ `sceneGraph.js` KHÔNG phải sửa một dòng,
 *     `addPickTarget` vẫn bám đúng chỉ số cũ, thứ tự hợp đồng (công trình → giàn giáo → nhà dân →
 *     cảnh vật) không đổi.
 *   · Mỗi khu phố vẫn chỉ có MỘT bệ kè (`groundPlacement` gọi một lần), đúng như ngoài đời: cả
 *     dãy nhà đứng trên cùng một thềm. Trả về N mô tả thì sẽ có N cái bệ chồng lên nhau.
 *   · **Không thêm một lệnh vẽ nào.** Lệnh vẽ đếm theo HỌ VẬT LIỆU của cả kỷ (xem
 *     `drawCallBudget.test.js`), mà chia nhỏ một căn nhà không đẻ ra họ vật liệu mới.
 */

import { BUILDING_SCALE, countSpecTriangles, specFootprint, specHeight, specSpan } from './parts.js';
import { buildBuildingSpec } from './buildingSpec.js';
import { deriveBlockUnits, getBlockStyle } from './blockStyle.js';
import { buildGroundCover } from './groundCover.js';
import { getGroundCoverStyle, pickCoverKind } from './groundCoverStyle.js';
import { CELL_PIXELS, EYE_PIXELS } from './streetStyle.js';

/**
 * Hệ số thu nhỏ mặt bằng danh nghĩa của khu phố.
 *
 * ⚠️ NÓ TỒN TẠI VÌ MÁI ĐUA, và con số này là số ĐO ĐƯỢC chứ không phải số chọn cho đẹp. Mỗi đơn
 * vị đội một cái mái thò ra khỏi tường (`eaveOverhang`, tối đa 0,28 bề ngang mỗi bên), nên nếu
 * chia đúng khít hình bao của bản tham chiếu thì mái của hai đơn vị ngoài cùng sẽ đẩy khu phố
 * RỘNG HƠN căn nhà cũ — tức là lặng lẽ chiếm thêm đất, đúng thứ phép đo trần đã cấm.
 *
 * `blockStyle.test.js` có một bài đo hình bao thật của cả 15 kỷ × 3 hạng và đòi nó KHÔNG vượt bản
 * tham chiếu. Bài ấy là cái canh; con số dưới đây chỉ là cách đạt nó.
 */
export const BLOCK_FIT = 0.92;

/**
 * Bề ngang TỐI THIỂU của một khu phố, đo bằng ô lưới.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI "CHIẾM THÊM ĐẤT". Một ô lưới rộng đúng 1,0 ô và nó đã thuộc về khu phố ấy từ
 * đầu — chỉ là ở vài kỷ căn nhà đứng trên nó nhỏ hơn cả ô (đo được: kỷ 1 rộng 0,725 ô, còn trống
 * 0,361 ô²; kỷ 14 rộng 0,850; kỷ 15 rộng 0,909). Ép khu phố nhỏ theo căn nhà cũ ở những kỷ ấy là
 * bỏ phí đúng phần đất mình đang đứng.
 *
 * 0,92 chứ không phải 1,0: chừa lại 0,08 ô làm khe giữa hai ô kề nhau, để hai khu phố cạnh nhau
 * còn đọc ra là HAI khu chứ không dính thành một tảng.
 *
 * ⚠️ Nó là một cái SÀN, và mãi tới Phase 21 nó mới có một cái TRẦN đi kèm (xem ngay dưới). Chú
 * thích cũ ở đây từng viện dẫn luật *"trần luôn thắng sàn"* để giải thích vì sao 12/15 kỷ được
 * phép rộng hơn một ô — nhưng luật ấy nói về quan hệ giữa MỘT sàn và MỘT trần, mà ở đây trần
 * chưa bao giờ tồn tại. Một câu tự trấn an viện dẫn đúng tên một cái luật vẫn có thể sai, và nó
 * sai theo cách khó thấy nhất: nghe như chuyện đã được cân nhắc rồi.
 */
export const BLOCK_MIN_CELLS = 0.92;

/**
 * Bề ngang TỐI ĐA của một khu phố, đo bằng ô lưới. **Đúng một ô — không hơn một chút nào.**
 *
 * ⚠️ ĐÂY LÀ CÁI TRẦN MÀ `BLOCK_MIN_CELLS` XƯA NAY NHẮC TỚI MÀ KHÔNG CÓ. Trước Phase 21 bề ngang
 * khu phố chỉ có sàn: `max(hình bao × BUILDING_SCALE × BLOCK_FIT, 0,92)`. Vế `max` thì chặn được
 * phía nhỏ, còn phía LỚN thì để ngỏ hoàn toàn — hình bao của bản tham chiếu muốn to bao nhiêu
 * cũng được. Đo ra: khu phố rộng nhất **2,006 ô** (kỷ 8) trên một ô lưới rộng đúng 1,0, và **cả
 * 15 kỷ** đều có khối đè lên khối của ô bên cạnh — 81 cặp ở kỷ 1, sâu nhất **0,813 ô** (kỷ 8).
 * Đó chính là thứ Đàm gọi tên: *"việc mở rộng thành phố không phải là nhà xếp chồng lên nhau, nó
 * rất phản thực tế và lịch sử."* Hai căn nhà xuyên qua nhau nửa mét là chuyện không xảy ra ở bất
 * kỳ thời đại nào.
 *
 * ⚠️ **1,0 KHÔNG PHẢI MỘT CON SỐ CHỌN TAY — nó là bề rộng của chính ô lưới.** Một ô là toàn bộ
 * đất mà khu phố ấy sở hữu; ô bên cạnh thuộc về người khác. Đây là một QUAN HỆ (nằm trong thửa
 * của mình), không phải một ngưỡng thẩm mỹ, nên không có gì để nới ra cho tiện về sau.
 *
 * ⚠️ **KHE GIỮA HAI NHÀ KHÔNG NẰM Ở ĐÂY, NÓ NẰM Ở `alley`.** Hai khu phố kề nhau đều rộng 1,0 thì
 * chúng chạm nhau ĐÚNG MÉP — không chồng một chút nào. Phần đất thật sự dựng nhà là `1,0 × (1 −
 * alley)`, nên khe giữa hai dãy chính bằng `alley` của kỷ ấy: nhà ba gian Việt (0,26) tách hẳn
 * nhau, còn nhà phố Anh đấu lưng (0,03) thì gần như dính tường. Đúng chữ Đàm dùng: *"nhà dính
 * tường thì dính THẲNG HÀNG, không xuyên qua nhau."*
 *
 * ⚠️ Trần này **luôn thắng sàn**: `1,0 > 0,92` nên hôm nay hai vế không cãi nhau, nhưng thứ tự
 * `Math.min(Math.max(...))` viết ra để nếu ngày nào sàn bị nâng quá 1,0 thì trần vẫn cắt xuống —
 * chứ không phải để khu phố lặng lẽ tràn ra khỏi ô lần nữa.
 */
export const BLOCK_MAX_CELLS = 1;

/** Xoay một mô tả khối quanh gốc của chính nó — CÙNG công thức mà `geometryFactory` dùng cho
 *  `placement.ry`: tâm khối quay theo góc, còn góc riêng của khối thì CỘNG thêm. Dùng hai công
 *  thức khác nhau ở hai nơi là lỗi kinh điển "khối tự xoay đúng nhưng bị văng khỏi vị trí". */
function xoayVaDoi(parts, goc, ox, oz) {
  const c = Math.cos(goc);
  const s = Math.sin(goc);
  return parts.map((part) => {
    const x = part.x ?? 0;
    const z = part.z ?? 0;
    return {
      ...part,
      x: x * c - z * s + ox,
      z: x * s + z * c + oz,
      ry: (part.ry ?? 0) + goc,
    };
  });
}

/**
 * ── SÂN CỦA SUẤT ĐẤT → MỘT MẢNG PHỦ NHÌN THẤY ĐƯỢC ───────────────────────────────────────────
 *
 * `blockStyle.js` đã tách mỗi suất đất thành hai phần: phần có nhà đứng lên, và phần SÂN. Nhưng
 * một mảnh đất trống thì trên màn hình chỉ là mặt cỏ — tức mở sân ra mà không lấp thì thành phố
 * **trông TRỐNG HƠN** chứ không chân thật hơn, đúng cái bẫy Phase 14 đã ghi (*"chia nhỏ mà không
 * nâng cao thì thành phố còn trông nhỏ hơn"*). Nên sân phải được LẤP bằng thứ mắt đọc ra.
 *
 * ⚠️ TÁI DÙNG `groundCover.js` (§2-C), KHÔNG viết nhà máy thứ hai. Bảy kiểu dùng đất ấy đã có
 * bảng 15 kỷ, đã có trọng số theo nước, và — quan trọng nhất — đã được chứng minh là **không đẻ
 * ra lệnh vẽ nào** (chỉ dùng bốn vai `stone`/`wood`/`leaf`/`wall`, cả bốn có ở 15/15 kỷ). Viết
 * một bộ hình riêng cho "sân sau nhà" sẽ là hai bảng nói về cùng một sự thật, rồi trôi khỏi nhau.
 *
 * ⚠️ SÂN HẸP HƠN NGƯỠNG MẮT THÌ **KHÔNG DỰNG GÌ CẢ**, và đây là luật của chính Đàm (ADR-033):
 * *nới cho vượt ngưỡng nhìn thấy được, HOẶC khai thẳng 0 — không có gì ở giữa*. Một mảng phủ rộng
 * 1 điểm ảnh không phải một cái sân, nó là nhiễu; và nó tốn tam giác thật cho thứ không ai thấy.
 *
 * ⚠️ ĐÍNH CHÍNH — CHÚ THÍCH Ở ĐÂY TỪNG GHI *"ngưỡng này loại đúng ba kỷ 1 · 7 · 10, tức đúng ba
 * nền mà ngoài đời nhà thật sự dính vào nhau — cái cổng tự kể đúng lịch sử"*. Nghe rất xuôi, và
 * **SAI**: ba kỷ ấy không có sân vì **BẢNG khai thẳng `yard: 0`**, chứ không phải vì cái cổng này
 * chặn. Đo trên quần thể thật (473 ô · 1.456 suất đất · 80 phiên · cấp 3): **cổng loại đúng 0 /
 * 1.064 cái sân**, và cái sân hẹp nhất cả thành phố là **6,47 px — gấp 1,62 lần ngưỡng 4 px**.
 * Cùng hình dạng với bài học *"một lời hứa đúng NHỜ MỘT THỨ CHẲNG LIÊN QUAN"* (Phase 7D): công
 * trạng bị gán nhầm cho cái cổng, nên ngày nào bảng đổi thì lời giải thích ấy vẫn còn nằm đây.
 *
 * ⚠️ NHƯNG CỔNG NÀY **KHÔNG** ĐÚNG-THEO-CẤU-TẠO (bẫy ADR-048) — nó CÓ đường nổ, chỉ là hôm nay
 * không dòng nào của bảng đi vào đường ấy. Quét chính `deriveBlockUnits` trên 2.704 mặt bằng, chỉ
 * đổi mỗi cột `yard`:
 *
 *     yard 0,22 → 0/2704 dưới ngưỡng (hẹp nhất 6,47 px)   ← dòng nhỏ nhất bảng đang dùng
 *     yard 0,15 → 0/2704                (hẹp nhất 4,32 px)   ← mép an toàn cuối cùng
 *     yard 0,12 → 1352/2704             (hẹp nhất 3,34 px)
 *     yard 0,10 → 2704/2704             (hẹp nhất 2,78 px)   ← CẢ KỶ mất sạch sân, im lặng
 *
 * ⇒ một dòng bảng khai `yard: 0,05` sẽ **được validator nhận** rồi **dựng ra đúng không có gì** —
 * chính cái "khoảng giữa" mà ADR-033 cấm. Thứ chặn được nó KHÔNG phải cổng này (cổng chỉ im lặng
 * trả về mảng rỗng) mà là **phép ĐẾM ở đầu bên kia**: bài `SÂN HOẶC ĐỦ THẤY, HOẶC BẰNG 0` trong
 * `block.test.js` khoá *"tập kỷ không có mảnh sân nào BẰNG tập kỷ khai `yard: 0`"*, nên dòng 0,05
 * ấy làm test ĐỎ thay vì biến mất. Đúng bài học Phase 10 Bước 2: *"từ chối thẳng" chỉ an toàn khi
 * có người ĐẾM số lần từ chối* — hai lời "đúng" cộng lại vẫn ra một lỗi im lặng nếu không ai đếm.
 *
 * ⚠️ MẢNG PHỦ LÀ HÌNH VUÔNG, nên nó lấy CẠNH NGẮN của sân. Sân hình dải (sân sau của một suất đất
 * burgage) thì phần thừa theo cạnh dài để trống — đó là ĐÚNG: một mảnh vườn dài thì cũng chỉ có
 * một khoảnh được dùng, phần còn lại là lối đi. Kéo dãn mảng phủ theo một trục thì mọi khối đã
 * xoay trong nó (rào, sào phơi, giếng) sẽ bị méo, mà `groundCover.js` có bốn chỗ dùng `ry`.
 */
const SAN_TOI_THIEU_O = EYE_PIXELS / CELL_PIXELS;

/** Bề rộng cơ sở của một mảng phủ, chép từ `buildGroundCover` — xem chú thích ở đó. */
const COVER_BASE_W = 0.86;

/**
 * Dựng mảng phủ cho MỘT cái sân, đã dời về đúng chỗ trong hệ toạ độ của khu phố.
 *
 * ⚠️ CHIA CHO `BUILDING_SCALE`: `u.yard` nói bằng Ô LƯỚI (cùng hệ với `MIN_UNIT_CELLS` và mắt
 * Đàm), còn mọi thứ trong `parts` nói bằng ĐƠN VỊ MÔ TẢ, mà `sceneGraph.js` nhân cả cụm lên
 * `BUILDING_SCALE` lần khi đặt vào cảnh. Quên phép chia này thì cái sân to gấp 1,3 lần chỗ đất
 * của nó và thò sang nhà hàng xóm — im lặng, vì không có gì đo bề rộng sân.
 */
function sanThanhMang({ yard, era, seed, detail }) {
  if (!yard) return [];
  const canhNgan = Math.min(yard.w, yard.d);
  if (!(canhNgan >= SAN_TOI_THIEU_O)) return [];
  const style = getGroundCoverStyle(era);
  const scale = canhNgan / BUILDING_SCALE / COVER_BASE_W;
  const parts = buildGroundCover({
    kind: pickCoverKind(era, seed),
    scale,
    enclose: style.enclose,
    seed,
    detail,
  });
  if (parts.length === 0) return [];
  // ⚠️ GẮN NHÃN `groundCover` — MỘT TRẠNG THÁI KHÔNG ĐẾM ĐƯỢC LÀ MỘT TRẠNG THÁI KHÔNG CANH ĐƯỢC.
  // Cái sân đi qua ba cửa có thể chặn nó lại trong im lặng (`yard` rỗng · cạnh ngắn dưới ngưỡng
  // mắt · nhà đòi lại đất để giữ chi tiết mái), và ba cửa ấy đều TỪ CHỐI THẲNG — đúng luật
  // ADR-026, nhưng "từ chối thẳng" chỉ an toàn khi có người ĐẾM số lần từ chối (bài học Phase 10
  // Bước 2: hai lời "đúng" cộng lại thành một lỗi). Không có nhãn này thì không bài test nào phân
  // biệt nổi "kỷ này cố ý không có sân" với "cơ chế sân đã chết ở cả 15 kỷ" — và tôi đã tự tay
  // viết một phép đo hỏi `p.groundCover` trên những khối KHÔNG mang nhãn ấy, rồi suýt kết luận
  // rằng cả cơ chế đã chết. Nhãn là dữ liệu thuần, không đổi `role` nên không tốn lệnh vẽ nào.
  return xoayVaDoi(parts, 0, yard.ox / BUILDING_SCALE, yard.oz / BUILDING_SCALE)
    .map((khoi) => ({ ...khoi, groundCover: true }));
}

/** Căn nhà này có còn chi tiết mái (ống khói, bồn nước, cửa sổ mái…) không? */
const coMai = (spec) => spec.parts.some((p) => p.rooftop);

/**
 * Số lượt CO THÊM tối đa của `dungVuaDat` sau lượt giải tuyến tính.
 *
 * ⚠️ Đây là một cái gác NHANH-CHẬM, không phải một cái gác ĐÚNG-SAI: hết lượt thì hàm vẫn trả về
 * bản vừa nhất nó đã dựng được, chỉ là kém khít hơn. Đo trên 380 ca trả-đất thật, phần thò ra
 * còn lại của ca tệ nhất theo số lượt: **2 lượt → 0,340 ô · 3 → 0,245 · 4 → 0,0735 · 6 → 0,0131
 * · 10 → 0,0001**. Chọn 6 vì `0,0131 ô × CELL_PIXELS(64) = 0,84 điểm ảnh` — dưới ngưỡng mắt 4
 * điểm ảnh (`EYE_PIXELS`), tức mắt không đọc ra được, trong khi 10 lượt thì tốn thêm ~16% số lần
 * dựng để đổi lấy một khoảng cách không ai nhìn thấy.
 */
const VONG_VUA_DAT = 6;

/**
 * Dựng MỘT căn nhà VỪA ĐÚNG mảnh đất `doiW × doiD` (đơn vị mô tả) — và chữ "vừa" ở đây phải
 * **ĐO ĐƯỢC**, không phải **DỰ ĐOÁN ĐƯỢC**.
 *
 * ⚠️ ĐO HÌNH BAO CỦA CHÍNH ĐƠN VỊ, ĐỪNG SUY NÓ TỪ HÌNH BAO CỦA BẢN THAM CHIẾU. Bản đầu tính
 * `fx = doiW / goc.w` với `goc` là hình bao của bản THAM CHIẾU, và nó sai một cách có hệ thống:
 * hình bao gồm cả MÁI ĐUA, mà mái đua thì KHÔNG co theo `fx`. Nhân một hệ số nhỏ vào cả cụm ⇒
 * khối thân teo đi nhiều hơn hình bao, đo ra khối thân chỉ còn ~0,12–0,16 trong khi suất đất
 * rộng 0,25–0,35 — mỗi căn bỏ hoang gần nửa mảnh đất của mình VÀ rơi xuống dưới
 * `ROOFTOP_MIN_SPAN` nên mất luôn chi tiết mái.
 *
 * ⚠️⚠️ **VÀ BẢN VÁ CỦA CÁI SAI ẤY LẠI LÀ MỘT DỰ ĐOÁN KHÁC — NÓ NỔ TUNG NGAY KHI RA KHỎI VÙNG ĐÃ
 * HIỆU CHUẨN (Phase 22).** Bản trước dựng hai lượt rồi kẻ một ĐƯỜNG THẲNG qua hai điểm ấy
 * (`hình bao(f) = thân × f + mái đua`) và giải thẳng ra hệ số cần dùng. Mô hình affine đó đúng
 * khi chỉ chỉnh nhẹ quanh `f = 1`, và Phase 22 đưa nó ra khỏi vùng ấy theo hai hướng cùng lúc:
 * cái sân làm suất đất **DẸT** hẳn đi, rồi phép trả-đất lại đòi **nhảy sang một hình bao to hơn
 * nhiều**. Đo trên 380 ca trả-đất thật: **41% số ca lượt giải tuyến tính cho ra căn nhà TO HƠN
 * mảnh đất được giao**, ca tệ nhất thò ra **0,53 ô** — tức lấn sang nhà hàng xóm, và
 * `block.test.js` («KHÔNG CHIẾM THÊM ĐẤT») bắt được ngay.
 *
 * Nguyên nhân gốc: hình bao **không phải hàm bậc nhất, và cũng KHÔNG đơn điệu**. Đo 7.200 bước
 * (15 kỷ × 6 ô × 41 mức `f` từ 0,20 tới 2,20): **551 bước ĐI LÙI** — hình bao NHỎ ĐI khi hệ số
 * TĂNG — bước lùi lớn nhất **0,85 ô**. Nó là một hàm BẬC THANG nhảy cả hai chiều, vì số cửa sổ,
 * số cột, và chính chi tiết mái đều bật/tắt theo cỡ. Một đường thẳng kẻ qua hai điểm của một hàm
 * như thế có thể trỏ đi bất cứ đâu; và vì **không đơn điệu** nên **chia đôi cũng không cứu được**.
 *
 * ⇒ Bản này thôi đoán. Nó vẫn lấy phép giải tuyến tính làm **ĐIỂM XUẤT PHÁT** (rẻ, và trúng
 * trong 59% số ca), rồi **ĐO bản vừa dựng**: còn thò ra thì nhân hệ số với đúng tỉ lệ thừa rồi
 * dựng lại, tối đa `VONG_VUA_DAT` lượt. Cuối cùng trả về bản **LỚN NHẤT trong những bản ĐO ĐƯỢC
 * LÀ VỪA** — *lớn nhất* vì nhà càng to càng giữ được chi tiết mái, *vừa* vì
 * **TRẦN LUÔN THẮNG SÀN**: thà mất chi tiết mái còn hơn lấn sang đất hàng xóm.
 *
 * ⚠️ KHÔNG có hệ số "ăn thêm cho chắc" nào ở đây. Đã đo bốn mức (1 · 0,99 · 0,97 · 0,94): mức
 * 0,99 hội tụ nhanh hơn thật, nhưng nó **mua tốc độ bằng cách vứt bớt chi tiết mái** và ca trôi
 * tệ nhất lại XẤU HƠN (0,0697 so với 0,0131 ô). Nhân một con số "cho chắc" vào là dựng lại đúng
 * cái phễu Phase 9A ở một chỗ mới.
 */
function dungVuaDat({ bpId, era, type, rarity, storey, faces, doiW, doiD }) {
  const dung = (fx, fz) => buildBuildingSpec({
    bpId, era, type, rarity, level: 1, plot: { fx, fz, storey, faces },
  });
  const daDung = [];
  const themBan = (fx, fz) => {
    const spec = dung(fx, fz);
    const hinhBao = specFootprint(spec.parts);
    const ban = { spec, hinhBao, troi: Math.max(hinhBao.w - doiW, hinhBao.d - doiD, 0) };
    daDung.push(ban);
    return ban;
  };

  const mot = themBan(1, 1);
  const k1 = mot.hinhBao.w > 0 ? doiW / mot.hinhBao.w : 1;
  const k2 = mot.hinhBao.d > 0 ? doiD / mot.hinhBao.d : 1;
  const hai = themBan(k1, k2);

  // Hai điểm `(1, mot)` và `(k, hai)` xác định một đường thẳng — giải ra hệ số cho ĐÍCH. Đây chỉ
  // là điểm xuất phát; `m ≤ 0` nghĩa là hai điểm ấy không nói được gì (hàm vừa đi lùi ở đoạn đó),
  // lúc ấy quay về `k` chứ không giả vờ đã giải được.
  const giai = (dich, f1, k, f2) => {
    if (Math.abs(1 - k) < 1e-9) return k;
    const m = (f1 - f2) / (1 - k);
    if (!(m > 1e-9)) return k;
    const c = f1 - m;
    const f = (dich - c) / m;
    return Number.isFinite(f) && f > 1e-6 ? f : k;
  };
  let fx = giai(doiW, mot.hinhBao.w, k1, hai.hinhBao.w);
  let fz = giai(doiD, mot.hinhBao.d, k2, hai.hinhBao.d);
  let cuoi = (fx === k1 && fz === k2) ? hai : themBan(fx, fz);

  // CO CHO VỪA — mỗi lượt nhân hệ số với đúng tỉ lệ đang thừa, và chỉ co trục nào thật sự thừa.
  for (let vong = 0; vong < VONG_VUA_DAT && cuoi.troi > 1e-9; vong += 1) {
    if (cuoi.hinhBao.w > doiW) fx *= doiW / cuoi.hinhBao.w;
    if (cuoi.hinhBao.d > doiD) fz *= doiD / cuoi.hinhBao.d;
    cuoi = themBan(fx, fz);
  }

  const vuaDat = daDung.filter((b) => b.troi <= 1e-9);
  if (vuaDat.length) {
    // vừa đất rồi thì chọn bản CHIẾM NHIỀU ĐẤT NHẤT — nhà to thì giữ được chi tiết mái.
    return vuaDat.reduce((a, b) => (b.hinhBao.w * b.hinhBao.d > a.hinhBao.w * a.hinhBao.d ? b : a)).spec;
  }
  // không bản nào vừa (khuôn nhà có sàn cứng) ⇒ lấy bản THÒ RA ÍT NHẤT.
  return daDung.reduce((a, b) => (b.troi < a.troi ? b : a)).spec;
}

/**
 * Mô tả hình học đầy đủ của MỘT KHU PHỐ nhà dân.
 *
 * @param {object} input
 * @param {string} input.bpId    khoá hình dáng của ô ấy (`dwellingBpId`)
 * @param {number} input.era     1..15
 * @param {string} input.type    'house' | 'shop' | 'workshop'
 * @param {string} input.rarity  'common' | 'rare' | 'epic' — ở nhà dân nghĩa là CỠ nhà
 * @param {string} [input.detail] 'high' | 'low' — CHỈ áp cho mảng phủ sân; khối nhà không có LOD
 * @returns {{parts:Array, height:number, span:number, triangles:number, units:number}}
 */
export function buildBlockSpec({ bpId, era, type, rarity = 'common', detail = 'high' } = {}) {
  // BƯỚC 1 — bản tham chiếu: đúng căn nhà hôm nay, dựng bằng đúng lời gọi cũ.
  const ref = buildBuildingSpec({ bpId, era, type, rarity, level: 1 });
  const style = getBlockStyle(era);

  // BƯỚC 2 — đo chỗ đất, quy sang Ô LƯỚI (hệ đơn vị mà `MIN_UNIT_CELLS` và mắt Đàm cùng dùng).
  const goc = specFootprint(ref.parts);
  // ⚠️ KẸP HAI ĐẦU, và trần đứng NGOÀI sàn (`min` bọc `max`) — xem `BLOCK_MAX_CELLS`.
  const kep = (v) => Math.min(Math.max(v, BLOCK_MIN_CELLS), BLOCK_MAX_CELLS);
  const blockW = kep(goc.w * BUILDING_SCALE * BLOCK_FIT);
  const blockD = kep(goc.d * BUILDING_SCALE * BLOCK_FIT);

  // BƯỚC 3 — chia.
  const units = deriveBlockUnits({ style, seed: bpId, blockW, blockD });
  if (units.length === 0 || !(goc.w > 0) || !(goc.d > 0)) return { ...ref, units: 1 };

  // BƯỚC 4 — dựng từng đơn vị.
  const parts = [];
  for (const u of units) {
    // Đơn vị quay đầu hồi ra phố thì hình bao của nó ĐỔI TRỤC: chỗ đất rộng `u.w` sẽ đón chiều
    // SÂU của căn nhà. Hỏi sai vế ở đây thì nhà quay ngang rồi thò ra khỏi khu phố.
    const quay = Math.abs(Math.sin(u.ry)) > 0.5;
    const doiW = (quay ? u.d : u.w) / BUILDING_SCALE;
    const doiD = (quay ? u.w : u.d) / BUILDING_SCALE;
    // ⚠️ TƯỜNG CHUNG THÌ KHÔNG CÓ CỬA SỔ — và đây vừa là sự thật kiến trúc vừa là khoản tiết kiệm
    // lớn nhất của cả phase. Một dãy 4×2 có 8 đơn vị × 4 mặt = 32 mặt tường, mà chỉ ~12 mặt thật
    // sự nhìn ra ngoài; 20 mặt kia bị chôn trong lòng nhà hàng xóm. Không có mặt nạ này thì cửa sổ
    // vẫn được dựng đủ trên cả 32 mặt: tốn tam giác cho thứ không ai nhìn thấy, VÀ sai — nhà phố
    // đấu lưng ngoài đời chỉ có cửa trước và cửa sau, đó chính là lý do nó gọi là "back-to-back".
    //
    // ⚠️ Mặt nạ tính theo LƯỚI KHU PHỐ, mà `emitWindows` thì làm việc trong hệ TOẠ ĐỘ RIÊNG của
    // căn nhà. Đơn vị nào quay 90° thì hai hệ ấy lệch nhau, nên phải đổi trục — quên chỗ này thì
    // cửa sổ biến mất ở mặt tiền và mọc ra trong bức tường chung.
    const doiTruc = (m) => (quay ? { xm: m.zp, xp: m.zm, zm: m.xm, zp: m.xp } : m);
    const faces = doiTruc(u.faces);
    const spec = dungVuaDat({ bpId: `${bpId}#${u.col},${u.row}`, era, type, rarity, storey: u.storey, faces, doiW, doiD });
    // ⚠️ SÂN NHƯỜNG, NHÀ KHÔNG NHƯỜNG — VÀ CÂU ẤY PHẢI **ĐO**, KHÔNG ĐƯỢC **ĐOÁN**.
    //
    // `MIN_UNIT_CELLS` là một DỰ ĐOÁN về chỗ đất tối thiểu để `emitRooftop` chịu dựng chi tiết
    // mái (`ROOFTOP_MIN_SPAN × BUILDING_SCALE × EAVE_LAND_FACTOR`). Nó đúng ở thế giới trước
    // Phase 22, nơi căn nhà chiếm TRỌN suất đất nên hai cạnh luôn cùng cỡ. Mở sân ra thì một
    // cạnh bị ép xuống đúng cái sàn ấy trong khi cạnh kia vẫn dài — và ở hình bao dẹt đó thì
    // `EAVE_LAND_FACTOR = 1,05` không còn đủ biên: đo được **67/473 ô** mất chi tiết mái, kỷ 15
    // chỉ còn 0,286. Một dự đoán được hiệu chuẩn ở một hình dạng rồi đem dùng cho hình dạng khác
    // là đúng bài học *"đừng DỰ ĐOÁN thứ có thể ĐO"* (Performance Gate 2026-08-17).
    //
    // ⇒ Không đi chỉnh con số dự đoán ấy (chỉnh là siết cả 15 kỷ cho một ca của ba kỷ), cũng
    // KHÔNG hạ sàn 0,7 của `block.test.js` (hạ là bỏ răng cho cả bảng). Thay vào đó: **hỏi thẳng
    // căn nhà vừa dựng xem nó còn mái không**, và nếu không thì TRẢ LẠI cho nó cả suất đất. Cái
    // sân của riêng suất ấy biến mất — đúng thứ tự nhường đã ghi ở `docGiuLai`, và cũng đúng
    // ngoài đời: không phải nhà nào trong xóm cũng có vườn.
    //
    // Giá phải trả có thật và đã đo: thêm tối đa ba lượt dựng cho những đơn vị rơi vào ca này
    // (~14% số đơn vị), canh bởi cổng thời gian dựng cảnh (`TECH_DEBT #70`).
    let dung = spec;
    let san = u.yard;
    let ox = u.ox;
    let oz = u.oz;
    if (san && u.plot && coMai(ref) && !coMai(spec)) {
      const rong = dungVuaDat({
        bpId: `${bpId}#${u.col},${u.row}`,
        era,
        type,
        rarity,
        storey: u.storey,
        faces: doiTruc(u.plot.faces ?? u.faces),
        doiW: (quay ? u.plot.d : u.plot.w) / BUILDING_SCALE,
        doiD: (quay ? u.plot.w : u.plot.d) / BUILDING_SCALE,
      });
      // Nhận cả suất đất thì cũng phải về đứng GIỮA suất đất — căn nhà không còn lùi ra mép nữa
      // vì không còn cái vườn nào để lùi khỏi. Quên vế này thì nó lệch nửa chiều sâu sân và
      // thò sang nhà bên.
      if (coMai(rong)) { dung = rong; san = null; ox = u.plot.ox; oz = u.plot.oz; }
    }
    parts.push(...xoayVaDoi(dung.parts, u.ry, ox / BUILDING_SCALE, oz / BUILDING_SCALE));
    parts.push(...sanThanhMang({
      yard: san, era, seed: `${bpId}#${u.col},${u.row}|san`, detail,
    }));
  }

  return {
    parts,
    height: specHeight(parts),
    span: specSpan(parts),
    triangles: countSpecTriangles(parts),
    units: units.length,
  };
}
