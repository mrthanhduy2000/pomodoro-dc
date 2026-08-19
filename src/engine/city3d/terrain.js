/**
 * terrain.js — ĐỊA HÌNH: mặt đất thôi phẳng lì.
 *
 * ⚠️ LUẬT CỨNG NHẤT CỦA FILE NÀY: **ĐỊA HÌNH LÀ HÀM CỦA KỶ, KHÔNG PHẢI CỦA VIỆC ĐÀM ĐÃ XÂY GÌ.**
 * Đất có trước thành phố. Nếu cao độ phụ thuộc vào số công trình đang đứng trên nó thì mỗi lần
 * Đàm xây xong một căn nhà, cả quả đồi sẽ nhích lên — nhà cũ đang đứng yên bỗng lún xuống hoặc
 * nhô lên, không có gì đỏ, không ai mất dữ liệu, chỉ là một buổi sáng thành phố khác đi. Đây đúng
 * là bất biến mà `cityLayout.js` đã giữ cho VỊ TRÍ (ADR-007) và Phase 6C đã giữ cho THỨ TỰ MỞ
 * ĐƯỜNG (trường `tier`); ở đây giữ nó cho CAO ĐỘ.
 *
 * ⚠️ VÌ SAO PHẢI LÀ **THỀM BẬC** (terrace) CHỨ KHÔNG PHẢI DỐC LIÊN TỤC — và đây là quyết định
 * hình học, không phải mỹ thuật. Nền thành phố là 144 ô hộp, công trình là các khối đáy phẳng.
 * Một mặt đất dốc liên tục thì:
 *   · ô nền hình hộp không dốc theo được ⇒ vẫn ra bậc, chỉ là bậc lởm chởm vì mỗi ô một cao độ;
 *   · công trình rộng ~3 ô sẽ có góc treo lơ lửng trên khoảng trống.
 * Thềm bậc giải quyết cả hai bằng đúng cách mà **mọi thành phố trên đồi ngoài đời** đã giải
 * quyết: san thành từng thềm, chỗ chênh thì kè đá. Nó vừa đúng hình học vừa đúng lịch sử.
 *
 * ⚠️ CÔNG TRÌNH VẪN CÓ THỂ VẮT QUA MÉP THỀM (thềm rộng vài ô, công trình rộng tới 3,687 ô — xem
 * `TECH_DEBT #21`). Cách xử lý ở đây KHÔNG phải làm phẳng ô đất dưới chân nó — làm vậy thì đường
 * đi ngay cạnh sẽ hụt một bậc và mạng đường gãy. Thay vào đó công trình đứng ở cao độ CAO NHẤT
 * dưới bóng nó, và phần hụt được lấp bằng một khối MÓNG (`drop`). Ngoài đời gọi là bệ kè; nó vừa
 * chống lơ lửng vừa thêm đúng loại chi tiết kiến trúc đang thiếu.
 */

import { roadCellCandidates } from '../cityLayout';
import { valueNoise } from './noise';
import { WATER_DROP_BELOW_PLAIN, buildSetting, hazXuongDay } from './setting';

// ⚠️ `valueNoise` ĐÃ DỜI SANG `./noise` (VIỆC 2 Bước B) và file này KHÔNG xuất lại nó. Xuất lại thì
// có hai đường nhập cho một hàm, tức hai chỗ để phiên sau tin — đúng thứ mà cả việc dời file này
// sinh ra để gỡ. Lý do phải dời: `setting.js` cần nhiễu để làm mép bờ lượn, mà `terrain.js` phải
// hỏi `setting.js` xem chỗ nào là nước ⇒ `setting → terrain → setting`, một vòng import thật.

/** Chiều cao MỘT bậc thềm, tính theo đơn vị ô (`TILE_UNIT = 1`). */
export const TERRACE_STEP = 0.5;

/**
 * ĐỘ DỐC LỚN NHẤT MỘT CON PHỐ ĐƯỢC PHÉP CÓ — **34,8%**, và con số này KHÔNG do tôi chọn.
 *
 * Đó là độ dốc chỗ dốc nhất của **Baldwin Street, Dunedin, New Zealand** (1:2,86 ≈ 34,8%) — con
 * phố dân cư dốc nhất thế giới theo Guinness. Để so: hai con dốc nổi tiếng nhất San Francisco
 * (Filbert St đoạn Leavenworth–Hyde, và 22nd St đoạn Church–Vicksburg) đều **31,5%**. Nghĩa là
 * bất cứ chỗ nào trong thành phố của Đàm dốc hơn 34,8% thì **không còn là một con phố** — nó là
 * một vách, và mắt đọc ra ngay lập tức dù không biết vì sao.
 *
 * ⚠️ ĐỪNG NHÂN CON SỐ NÀY VỚI 1 Ô RỒI COI LÀ CHÊNH CAO ĐỘ CHO PHÉP. Mặt đất nội suy giữa hai tâm
 * ô bằng `smoothstep`, mà đạo hàm của `smoothstep` đạt CỰC ĐẠI **1,5** ở chính giữa quãng — nên
 * chỗ dốc nhất dốc gấp rưỡi mức trung bình. Chênh cao độ cho phép là `GRADE / 1,5`, xem
 * `maxRoadRise()`. Quên hệ số này là tự cho mình dốc hơn 50% so với thứ mình vừa viết ra.
 */
export const STREET_MAX_GRADE = 0.348;

/** Đạo hàm cực đại của `smoothstep` trên quãng [0,1] — đúng 1,5, đạt ở chính giữa. */
export const SMOOTHSTEP_PEAK = 1.5;

/** Chênh cao độ tối đa giữa hai ô đường KỀ NHAU để con phố không dốc quá `STREET_MAX_GRADE`. */
export function maxRoadRise() {
  return STREET_MAX_GRADE / SMOOTHSTEP_PEAK;
}

/**
 * ĐỘ DỐC LỚN NHẤT CỦA **BỜ ĐẤT BÊN LỀ PHỐ** — 1:1, tức **100% (45°)**.
 *
 * Đây là một đại lượng KHÁC hẳn `STREET_MAX_GRADE`, và trộn hai cái là sai. Cái kia nói về thứ
 * người ta ĐI LÊN; cái này nói về thứ người ta ĐI NGANG QUA. Ngoài đời mái taluy đường bộ đào/đắp
 * thường 1:1,5 đến 1:2 (34°–56° tuỳ vật liệu), và **1:1 là mốc quen thuộc cho mái đá hoặc đất đắp
 * đầm chặt** — dốc hơn nữa thì phải xây tường chắn chứ không còn là một bờ đất.
 *
 * ⚠️ VÌ SAO PHẢI CÓ CON SỐ NÀY, VÀ NÓ RA ĐỜI TỪ MỘT PHÉP ĐO CHỨ KHÔNG TỪ LÝ LẼ: bản đầu của phép
 * san đường chỉ ràng buộc ô đường với ô ĐƯỜNG. Đo lại thì độ dốc DỌC về đúng 35% ở cả 15 kỷ — thắng
 * lợi thật — nhưng độ dốc NGANG (đường ↔ đất kề bên) **xấu đi**: kỷ 5 từ 101% lên **184%**, kỷ 7
 * từ 86% lên 112%. Lý do rất đơn giản khi đã thấy: mặt đường được kéo về một dốc thoải, còn mặt
 * đất hai bên vẫn nhảy trọn bậc, nên hai bên trôi xa nhau. Tức là đã đổi *lòi lõm theo chiều dọc*
 * lấy *lòi lõm theo chiều ngang* — đúng loại "sửa xong lại hỏng chỗ khác" mà phải đo mới thấy.
 */
export const BANK_MAX_GRADE = 1.00;

/** Chênh cao độ tối đa giữa một ô ĐƯỜNG và ô ĐẤT kề nó. */
export function maxBankRise() {
  return BANK_MAX_GRADE / SMOOTHSTEP_PEAK;
}

/**
 * Cỡ ô của lưới nhiễu — bao nhiêu ô thành phố cho MỘT ô nhiễu.
 *
 * ⚠️ Đây là con số nhạy nhất file. Nhỏ quá (2–3) thì mỗi khu đất một cao độ khác ⇒ thành phố trông
 * như bị gặm nhấm, và gần như công trình nào cũng vắt qua mép thềm. Lớn quá (≥8) thì cả lưới 12×12
 * chỉ nằm gọn trong một sườn dốc duy nhất ⇒ về lại phẳng, chỉ là phẳng nghiêng. 4,5 cho ra thềm
 * rộng ~4–5 ô: đủ để phần lớn công trình đứng trọn trên một thềm, đủ để mắt đọc ra là địa hình.
 */
const NOISE_CELL = 4.5;

/** Vùng đất thoải quanh cao nguyên thành phố, tính bằng ô. Bán kính THẬT bị nhiễu nhân vào. */
export const APRON_CELLS = 2.6;
/** Vùng ngoài thấp hơn chân cao nguyên bao nhiêu — đủ để đọc ra "thành phố nằm trên cao". */
export const APRON_DROP = 0.62;
/**
 * Ra khỏi mốc này (tính bằng ô, kể từ mép lưới) thì mặt đất **phẳng đúng** `-APRON_DROP` — hết gợn.
 *
 * ⚠️ ĐÂY LÀ MỘT LỜI HỨA VỚI MỘT FILE KHÁC, KHÔNG PHẢI MỘT CON SỐ MỸ THUẬT. Tấm lưới mặt đất phải
 * kết thúc ở đâu đó, và từ đó trở ra là tấm ván "vùng đất bao quanh" của `sceneGraph.js`. Hai mặt
 * ấy chỉ nối liền được nếu chúng ĐỒNG PHẲNG tại chỗ giáp — mà tấm ván thì phẳng, nên vế còn lại
 * buộc phải phẳng theo. Nếu gợn sóng còn sống tới rìa lưới thì chỗ giáp sẽ là một đường răng cưa
 * lộ cả gầm, và nó **không đỏ ở đâu cả** — chỉ là một vết nứt quanh thành phố.
 */
export const APRON_EDGE = 3.4;

/**
 * Số ô con trên MỘT ô thành phố của tấm địa hình.
 *
 * ⚠️ SỐNG Ở ĐÂY (tầng thuần) CHỨ KHÔNG Ở `terrainMesh.js`, VÀ ĐÓ LÀ MỘT BẢN VÁ, KHÔNG PHẢI SỞ
 * THÍCH. `horizon.js` cần biết tấm địa hình phủ TỚI ĐÂU để nối liền vào; Phase 9A bản đầu tự suy
 * lại con số ấy bằng tay (`(size−1)/2 + 0,5 + APRON_EDGE` = 9,4) trong khi tấm đất thật phủ tới
 * **9,5** — vì `padSteps` có phép LÀM TRÒN LÊN mà bản suy tay không có. Chênh 0,1 đơn vị ấy, cộng
 * thêm một phép làm tròn nữa ở lưới chân trời, mở ra một khe hở 0,5 đơn vị chạy vòng quanh thành
 * phố; trên ảnh chụp nó hiện thành hai cái nêm sáng chói ở hai góc dưới khung hình.
 * Đúng bài học "MỘT LUẬT CHỈ ĐƯỢC CÓ MỘT CÔNG THỨC": hai công thức tương đương trên giấy thì gần
 * như luôn lệch nhau ở biên, và biên chính là chỗ hai tấm phải gặp nhau.
 */
export const TERRAIN_SUB = 3;

/**
 * Tấm địa hình thành phố phủ ra tới đâu, tính bằng ĐƠN VỊ THẾ GIỚI kể từ tâm.
 * Đây là chỗ `horizon.js` phải bắt đầu — không sớm hơn (chồng lấn, chọi mặt), không muộn hơn (hở).
 */
export function terrainSurfaceReach(gridSize = 12) {
  const size = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : 12;
  const padSteps = Math.ceil((0.5 + APRON_EDGE) * TERRAIN_SUB);
  return (size - 1) / 2 + padSteps / TERRAIN_SUB;
}

/**
 * Kiểu địa hình — mỗi kiểu là một cách BIẾN ĐỔI trường nhiễu, không phải bảng cao độ chép tay.
 *
 * Mỗi hàm ở đây chỉ trả lời DUY NHẤT một câu: **"chỗ nào cao hơn chỗ nào"**. Câu "cao bao nhiêu"
 * là việc của `relief` + `terraces`. Đây đúng luật "một trường một việc" đã trả giá ở Phase 5B với
 * `storyHeight`.
 *
 * ⚠️ NHƯNG PHẢI NÓI CHO ĐÚNG THỨ ĐANG BẢO ĐẢM ĐIỀU ĐÓ, vì tôi đã suýt ghi sai vào đây. Bản đầu
 * viết `plain: (n) => n * 0.35` — nhét luôn "đồng bằng thì thấp" vào hàm hình dạng — và đo ra
 * **bốn kỷ (2, 3, 11, 12) phẳng TUYỆT ĐỐI**, 15 kỷ chỉ còn 11 trường cao độ khác nhau. Tôi sửa
 * bằng cách cho mọi hàm trả trọn 0..1, rồi viết chú thích rằng ĐÓ là thứ giữ cho lỗi không tái
 * phát. **Sai.** Thử ngược mới lộ ra: sau khi thêm bước **CĂNG TRƯỜNG** ở lượt 2 (xem `buildTerrain`),
 * nhân `plain` với 0,35 cho ra kết quả **y hệt từng con số** — vì phép căng theo min/max của chính
 * kỷ đó xoá sạch mọi hệ số nhân chung. Tức biên độ trong hàm hình dạng nay **không thể** gây lỗi
 * nữa, do CẤU TRÚC chứ không do kỷ luật viết hàm.
 *
 * ⇒ Thứ đang gánh bất biến này là **bước căng trường**, không phải quy ước 0..1. Bỏ bước căng đi
 * thì cả ba hàng rào ở `terrain.test.js` đỏ ngay (đã thử). Giữ quy ước 0..1 vẫn tốt cho người đọc,
 * nhưng đừng nhầm nó là lưới an toàn — cùng loại nhầm lẫn với "sương mù quét sắc lên công trình" ở
 * Phase 3Y: sửa đúng KHÔNG chứng minh hiểu đúng.
 */
const SHAPES = {
  /** Đồng bằng: hình dạng thuần nhiễu. Cái làm nó PHẲNG là `terraces: 2` + `relief` thấp. */
  plain: (n) => n,
  /** Đồi thoai thoải nối nhau (Toscana) — cũng thuần nhiễu, nhưng nhiều bậc và relief cao. */
  rolling: (n) => n,
  /**
   * Thung lũng: thấp ở giữa, cao ở rìa. `edge` = 0 ở tâm lưới, 1 ở góc.
   * Trường nhiễu bị TRỘN với một hàm hình học, nên hai kỷ cùng seed mà khác `shape` vẫn ra hai
   * địa hình khác hẳn. Trọng số 0,40/0,60: nghiêng về hình học đủ để đọc ra là thung lũng, nhưng
   * còn đủ nhiễu để hai bên sườn không đối xứng như khuôn đúc.
   */
  valley: (n, edge) => n * 0.40 + edge * 0.60,
  /** Gò/mỏm đá: cao ở giữa, đổ xuống bốn phía (Göbekli Tepe, lâu đài Burg Eltz). */
  ridge: (n, edge) => n * 0.40 + (1 - edge) * 0.60,
  /**
   * Bờ dốc xuống một phía (Lisbon đổ ra cửa sông Tejo).
   *
   * `slope` chạy theo MỘT TRỤC THẲNG, không theo đường chéo `(x+y)` — vì bờ sông ngoài đời là một
   * ĐƯỜNG, không phải một góc chéo.
   *
   * ⚠️ Lý do lịch sử, và một lần nữa phải nói cho đúng thứ đang bảo đảm điều gì: bản đầu dùng
   * đường chéo và đo ra **85% số ô rơi vào cùng một bậc** — cả "thành phố bảy quả đồi" thành một
   * mặt phẳng có đúng hai góc lệch. Nguyên nhân thuần xác suất: tổng hai toạ độ có **phân bố hình
   * tam giác** (1 cách ra tổng 0, nhưng 12 cách ra tổng 11), nên phần lớn ô dồn về giữa dải. Tôi
   * đổi sang trục thẳng và nó hết. **Nhưng thử ngược sau khi thêm bước căng trường thì đường chéo
   * KHÔNG còn gây lỗi nữa** (kỷ 8 vẫn dùng đủ 5 bậc, mức đông nhất 34% — dưới ngưỡng 60%). Trục
   * thẳng nay được giữ vì nó ĐÚNG ĐỊA LÝ, không phải vì nó đang cứu phép chia bậc.
   */
  coast: (n, edge, slope) => n * 0.30 + slope * 0.70,
  /** Đụn cát: sóng dài chồng lên nhiễu — không mặt nào thật bằng, nhưng cũng không dốc. */
  dune: (n, edge, slope, wave) => n * 0.45 + wave * 0.55,
};

/**
 * ĐỊA HÌNH THEO KỶ — mỗi dòng phải trả lời được "nước ấy trông như vậy thật không?".
 *
 * ⚠️ Cùng luật với `country`/`landmark` ở `eraStyle.js`: đây KHÔNG phải nhãn dán cho đẹp. Một con
 * số tuỳ hứng ở đây sẽ sinh ra đúng thứ mà Phase 5B đã phải đi sửa — 15 kỷ khác nhau trên giấy mà
 * giống nhau trên màn hình. `terraces` = số bậc thềm (1 = phẳng tuyệt đối), `relief` = độ cao tổng.
 */
export const ERA_TERRAIN = {
  1:  { shape: 'ridge',   terraces: 4, relief: 1.00, note: 'Göbekli Tepe nằm trên một GÒ ĐẤT cao nhìn xuống đồng bằng Harran' },
  2:  { shape: 'plain',   terraces: 2, relief: 0.45, note: 'đồng bằng phù sa sông Nin — phẳng tới chân trời, chỉ gợn bờ đê' },
  3:  { shape: 'plain',   terraces: 2, relief: 0.35, note: 'Lưỡng Hà phẳng tuyệt đối; ziggurat là ngọn núi NHÂN TẠO duy nhất' },
  4:  { shape: 'valley',  terraces: 3, relief: 0.60, note: 'kinh thành Trung Hoa trên đồng bằng, đồi thấp vây bốn phía' },
  5:  { shape: 'ridge',   terraces: 5, relief: 1.35, note: 'Burg Eltz dựng trên MỎM ĐÁ giữa thung lũng — dốc nhất cả 15 kỷ' },
  6:  { shape: 'valley',  terraces: 3, relief: 0.55, note: 'làng Bắc Bộ ven sông: đồng trũng, đình làng trên gò cao' },
  7:  { shape: 'rolling', terraces: 5, relief: 1.15, note: 'đồi Toscana nối nhau — hình ảnh đặc trưng nhất của kỷ này' },
  8:  { shape: 'coast',   terraces: 5, relief: 1.20, note: 'Lisbon "thành phố bảy quả đồi" đổ dốc xuống cửa sông Tejo' },
  9:  { shape: 'valley',  terraces: 3, relief: 0.50, note: 'lòng chảo sông Seine, gần phẳng, chỉ nhô đồi Montmartre' },
  10: { shape: 'valley',  terraces: 4, relief: 0.80, note: 'Manchester trong thung lũng công nghiệp, nhà máy bám sườn' },
  11: { shape: 'plain',   terraces: 2, relief: 0.40, note: 'Manhattan là một tấm granite gần phẳng — chiều cao đến từ NHÀ' },
  12: { shape: 'plain',   terraces: 2, relief: 0.30, note: 'thảo nguyên Nga mênh mông, phẳng đến mức thành biểu tượng' },
  13: { shape: 'valley',  terraces: 4, relief: 0.95, note: 'đô thị Nhật kẹp giữa núi — đất hẹp là lý do có nhà nang' },
  14: { shape: 'plain',   terraces: 1, relief: 0.00, note: 'Marina Bay là đất LẤN BIỂN: phẳng tuyệt đối, do người san' },
  15: { shape: 'dune',    terraces: 3, relief: 0.55, note: 'sa mạc Dubai: đụn cát sóng dài, không có mặt nào thật bằng' },
};

const FALLBACK_TERRAIN = { shape: 'plain', terraces: 2, relief: 0.40, note: '' };

export function eraTerrainProfile(era) {
  return ERA_TERRAIN[era] ?? FALLBACK_TERRAIN;
}

/**
 * Đỉnh cao nhất mà địa hình của một kỷ CÓ THỂ đạt tới — tính bằng công thức, không phải bằng cách
 * dựng cả trường rồi đo.
 *
 * ⚠️ TỒN TẠI ĐỂ CAMERA KHÔNG PHẢI ĐOÁN. Địa hình nâng công trình lên tới gần 3 đơn vị; một khung
 * hình không biết điều đó sẽ cắt cụt nóc đúng ở những kỷ dốc nhất — **và không có gì đỏ lên**, y
 * hệt lỗi cắt ngọn mà `massScale` đã gây ra ở Phase 5B. Camera phải co giãn theo CHÍNH con số đã
 * sinh ra chiều cao ấy, không theo một hằng số đoán mò song song ("một luật một công thức").
 *
 * Có bài test buộc con số này khớp với `buildTerrain(...).maxHeight` thật — hai công thức "tương
 * đương trên giấy" là thứ dự án này đã trả giá nhiều lần.
 */
export function terrainMaxHeight(era) {
  const profile = eraTerrainProfile(era);
  return Math.max(0, profile.terraces - 1) * TERRACE_STEP * profile.relief;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { return t * t * (3 - 2 * t); }

/**
 * ⚠️ MỰC NƯỚC — CAO ĐỘ TUYỆT ĐỐI DUY NHẤT CỦA MẶT NƯỚC, VÀ NÓ SỐNG Ở ĐÂY CÓ LÝ DO.
 *
 * `setting.js` (dấu chân mặt nước) chỉ khai ĐỘ LỆCH, vì nếu nó biết `APRON_DROP` thì nó phải nhập
 * từ file này, mà file này lại phải hỏi nó *"chỗ này có nước không"* ⇒ vòng import. Nên chỗ giữ
 * `APRON_DROP` cũng là chỗ làm phép trừ cuối cùng, và `horizon.js` · `terrainMesh.js` ·
 * `sceneGraph.js` đều đọc lại đúng hằng số này thay vì tự tính. Một luật một công thức.
 */
export const WATER_SURFACE_Y = -APRON_DROP - WATER_DROP_BELOW_PLAIN;

/**
 * Dựng trường cao độ cho một kỷ.
 *
 * @param {object} input
 * @param {number} input.era        1..15 (giá trị lạ → hồ sơ mặc định, không ném lỗi)
 * @param {number} input.gridSize   cạnh lưới (12)
 * @returns {{
 *   heightAt: (x:number, y:number) => number,
 *   footprint: (x:number, y:number, span:number) => {top:number, drop:number},
 *   cells: Array<{x:number, y:number, h:number}>,
 *   maxHeight: number,
 *   profile: object,
 * }}
 */
export function buildTerrain({ era, gridSize = 12 } = {}) {
  const profile = eraTerrainProfile(era);
  const size = Math.max(1, Math.round(Number.isFinite(gridSize) ? gridSize : 12));
  const shape = SHAPES[profile.shape] ?? SHAPES.plain;
  const terraces = Math.max(1, Math.round(profile.terraces));
  const seed = `${era}|${profile.shape}`;

  // ⚠️ ĐỌC MỘT CHIỀU: `terrain` hỏi `setting` chỗ nào là nước, `setting` KHÔNG bao giờ hỏi ngược
  // lại (nó chỉ khai độ lệch, `WATER_SURFACE_Y` ở trên là chỗ duy nhất biến độ lệch thành cao độ).
  // Lớp này chỉ nhận `era` + `gridSize` — không nhận bố cục — nên bất biến "địa hình là hàm của KỶ,
  // không phải của việc Đàm đã xây gì" (Phase 7B, ADR-007) còn nguyên, và có test gọi kèm dữ liệu
  // rác khoá điều đó.
  const setting = buildSetting({ era, gridSize: size });

  const centre = (size - 1) / 2;
  const heights = new Float64Array(size * size);
  let maxHeight = 0;

  // ── LƯỢT 1: trường thô ────────────────────────────────────────────────────
  const raw = new Float64Array(size * size);
  let lo = Infinity;
  let hi = -Infinity;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = valueNoise(seed, x / NOISE_CELL, y / NOISE_CELL);
      // `edge` = 0 ở tâm, 1 ở góc xa nhất. Dùng khoảng cách Chebyshev (hình vuông) chứ không phải
      // Euclid: lưới là hình vuông, nên vành đồi hình vuông ôm sát mép lưới, còn vành hình TRÒN sẽ
      // để bốn góc lưới tụt xuống thành bốn hố — trông như lỗi chứ không như địa hình.
      const edge = Math.max(Math.abs(x - centre), Math.abs(y - centre)) / centre;
      // ⚠️ MỘT TRỤC THẲNG, KHÔNG PHẢI ĐƯỜNG CHÉO — xem lý do đầy đủ ở `SHAPES.coast`.
      const slope = size > 1 ? y / (size - 1) : 0;
      const wave = (Math.sin((x + y * 0.6) / NOISE_CELL) + 1) / 2;
      const v = shape(n, edge, slope, wave);
      raw[y * size + x] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }

  // ── LƯỢT 2: CĂNG TRƯỜNG RA TRỌN 0..1 rồi mới chia bậc ─────────────────────
  /**
   * ⚠️ VÌ SAO PHẢI CĂNG LẠI, VÀ VÌ SAO NÓ KHÔNG PHẢI "LÀM ĐẸP SỐ LIỆU": ở tần số nhiễu này
   * (`NOISE_CELL` 4,5 trên lưới 12) cả trường chỉ lấy mẫu từ khoảng **3×3 = 9 giá trị ngẫu nhiên
   * độc lập**. Chín mẫu thì luật số lớn không áp dụng — trường cao độ đơn giản là "chín con số ấy
   * tình cờ ra sao". Đo bản chưa căng: **5/15 kỷ có trên 70% số ô dồn vào MỘT bậc** (kỷ 3 và 12
   * tới 81%), tức là phẳng, chỉ khác là phẳng ở một cao độ lẻ. Căng theo min/max của chính kỷ đó
   * bảo đảm mọi kỷ dùng trọn dải bậc mình khai, bất kể chín con số kia rơi vào đâu.
   *
   * ⚠️ VÀ CHIA BẬC BẰNG `floor`, KHÔNG PHẢI `round` — đây là lỗi phân bố THỨ HAI trong cùng hàm
   * này. `Math.round(c × (T−1))` cho các thùng ở HAI ĐẦU chỉ rộng bằng NỬA thùng giữa, nên với 3
   * bậc thì bậc giữa luôn nuốt gấp đôi phần đáng ra của nó — đúng triệu chứng của kỷ 6 và 9 (dùng
   * 2/3 mức, 80% dồn một chỗ). `floor(c × T)` cho mọi thùng rộng bằng nhau.
   */
  const span = hi - lo;
  for (let i = 0; i < raw.length; i += 1) {
    const normalized = span > 1e-9 ? (raw[i] - lo) / span : 0;
    const step = terraces > 1
      ? Math.min(terraces - 1, Math.floor(normalized * terraces))
      : 0;
    const h = step * TERRACE_STEP * profile.relief;
    heights[i] = h;
    if (h > maxHeight) maxHeight = h;
  }

  // ── LƯỢT 3: SAN ĐƯỜNG — RANH THỀM CHẠY DỌC THEO PHỐ, KHÔNG CẮT NGANG QUA PHỐ ─────────────
  /**
   * ⚠️ ĐÂY LÀ NỬA CÒN LẠI CỦA "ĐƯỜNG LÒI LÕM", VÀ NÓ KHÔNG PHẢI CHUYỆN BỀ RỘNG. Nửa thứ nhất (mép
   * ngang có bậc) đã xong ở ADR-031. Nửa này là MẶT CẮT DỌC: hai ô đường kề nhau nằm ở hai bậc
   * thềm khác nhau, nên con phố phải leo trọn một bậc — có khi HAI bậc — trong đúng một ô.
   * Đo trước khi sửa, trên 80 ô ứng viên × 15 kỷ: **235 chỗ ranh thềm cắt ngang đường**, chỗ dốc
   * nhất **173%** (kỷ 7 — dốc 60°, tức 85% chiều cao một căn nhà trong một ô). Con phố dốc nhất
   * thế giới ngoài đời là 34,8%. Đó không phải một con phố, đó là một vách đá.
   *
   * ⚠️ VÌ SAO SAN **ĐƯỜNG** CHỨ KHÔNG SAN **ĐẤT** — và vì sao đây không phải lựa chọn tuỳ tiện.
   * Ba phương án, hai cái chết vì hình học chứ không vì thẩm mỹ:
   *   (a) *Làm mượt cả trường cao độ* ⇒ chết. Bài `cao độ luôn là BỘI SỐ NGUYÊN của một bậc thềm`
   *       tồn tại vì CÔNG TRÌNH là khối đáy phẳng rộng tới 3 ô; thềm bậc là thứ cho chúng mặt đất
   *       bằng để đặt xuống. Làm mượt đất là gỡ đúng thứ đang đỡ các toà nhà.
   *   (b) *Ép mọi ô đường về CÙNG một cao độ* ⇒ chết. Mạng đường là 4 cột + 4 hàng cắt nhau, tức
   *       một đồ thị LIÊN THÔNG: "không ô đường nào lệch ô đường nào" ⇒ cả 80 ô phải bằng nhau ⇒
   *       56% mặt lưới phẳng tuyệt đối, và vì mọi ô đất đều kề một ô đường nên độ dốc chỉ bị dồn
   *       sang ngang. Đổi một khuyết tật lấy một khuyết tật to hơn.
   *   (c) ⇒ **Đất giữ nguyên bậc thềm; ĐƯỜNG được san thành dốc thoải.** Ranh giới thềm bị đẩy ra
   *       khỏi lòng phố và nằm lại ở mép thửa đất — đúng cách Positano, Cinque Terre, Sa Pa làm
   *       thật: phố men theo đường đồng mức, tường chắn đất nằm sau lưng thửa đất.
   *
   * ⚠️ CAO ĐỘ Ô ĐƯỜNG VÌ THẾ **KHÔNG CÒN LÀ BỘI SỐ NGUYÊN CỦA MỘT BẬC THỀM**, và điều đó là CÓ CHỦ
   * ĐÍCH, không phải sơ suất. Lý do của bất biến cũ (mặt đất bằng cho khối đáy phẳng) **không áp
   * cho ô đường**: chỗ ấy là mặt phố, không ai đặt nhà lên. Bài test đã tách làm hai vế và đếm
   * riêng, để trạng thái này TƯỜNG MINH chứ không lặng lẽ.
   *
   * ⚠️ DÙNG `roadCellCandidates()` — DANH SÁCH ỨNG VIÊN, KHÔNG PHẢI MẠNG ĐANG HIỆN. Đây là điều
   * kiện sống còn của ADR-007: mạng đang hiện đổi theo `sessionCount` và theo kỷ (công trình chiếm
   * chỗ thì ô đường bị bỏ), nên hỏi nó thì cao độ mặt đất sẽ nhúc nhích mỗi lần Đàm xây thêm một
   * căn nhà. Danh sách ứng viên là hằng số cấp module và là TẬP CHA của mọi mạng đã hiện — đặt
   * luật lên nó là một lời hứa chặt hơn. Có test khoá cả hai vế ở `cityLayout.test.js`.
   *
   * PHÉP SAN: giữ đúng hai bao hình Lipschitz rồi lấy trung bình.
   *   `duoi[a] = min_b (h[b] + C·d(a,b))` — hàm C-Lipschitz LỚN NHẤT còn ≤ h
   *   `tren[a] = max_b (h[b] − C·d(a,b))` — hàm C-Lipschitz NHỎ NHẤT còn ≥ h
   * Trung bình của hai hàm C-Lipschitz vẫn C-Lipschitz, và nó nằm gọn giữa `duoi` và `tren` nên
   * không bao giờ vượt ra ngoài dải cao độ gốc. `d` đo bằng số bước ĐI TRÊN ĐƯỜNG, nên một bậc
   * thềm 0,575 tự trải thành dốc 4 ô mà không ai phải chọn tay con số 4. Điểm bất động là DUY
   * NHẤT nên kết quả không phụ thuộc thứ tự duyệt — tất định tuyệt đối.
   */
  const roadIdx = [];
  const roadNb = [];
  const roadLandNb = [];
  {
    const isRoad = new Uint8Array(size * size);
    for (const cell of roadCellCandidates()) {
      if (cell.x < 0 || cell.y < 0 || cell.x >= size || cell.y >= size) continue;
      isRoad[cell.y * size + cell.x] = 1;
    }
    const viTri = new Map();
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const i = y * size + x;
        if (isRoad[i]) { viTri.set(i, roadIdx.length); roadIdx.push(i); }
      }
    }
    for (const i of roadIdx) {
      const x = i % size;
      const y = (i - x) / size;
      const nb = [];
      const dat = [];
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        const j = ny * size + nx;
        if (isRoad[j]) nb.push(viTri.get(j)); else dat.push(heights[j]);
      }
      roadNb.push(nb);
      roadLandNb.push(dat);
    }
  }
  if (roadIdx.length > 1) {
    const C = maxRoadRise();
    // Trần bờ đất: không được rộng hơn MỘT bậc thềm của chính kỷ này. Trước bản vá, chênh
    // đường↔đất luôn ≤ 1 bậc (cả hai cùng nằm trên lưới bậc); nếu sau khi san mà nó rộng hơn thế
    // thì ta chỉ đổi lòi lõm dọc lấy lòi lõm ngang. Đây là mốc KHÔNG-ĐƯỢC-TỆ-HƠN, đo được.
    const buoc = TERRACE_STEP * profile.relief;
    const D = buoc > 0 ? Math.min(maxBankRise(), buoc) : maxBankRise();

    /**
     * Bao hình Lipschitz trên ĐỒ THỊ ĐƯỜNG: hàm C-Lipschitz lớn nhất còn ≤ `moc` (`huong = -1`),
     * hoặc nhỏ nhất còn ≥ `moc` (`huong = +1`). Điểm bất động là DUY NHẤT nên kết quả không phụ
     * thuộc thứ tự duyệt — tất định tuyệt đối, đúng yêu cầu của ADR-007.
     */
    const baoHinh = (moc, huong) => {
      const v = moc.slice();
      for (let vong = 0; vong < roadIdx.length; vong += 1) {
        let doi = false;
        for (let k = 0; k < roadIdx.length; k += 1) {
          for (const m of roadNb[k]) {
            if (huong < 0) {
              if (v[m] + C < v[k] - 1e-12) { v[k] = v[m] + C; doi = true; }
            } else if (v[m] - C > v[k] + 1e-12) { v[k] = v[m] - C; doi = true; }
          }
        }
        if (!doi) break;
      }
      return v;
    };

    const goc = roadIdx.map((i) => heights[i]);
    // (1) Dốc thoải: trung bình hai bao hình của chính trường gốc — bám sát địa hình, C-Lipschitz.
    const duoi = baoHinh(goc, -1);
    const tren = baoHinh(goc, +1);
    // (2) Trần/sàn do BỜ ĐẤT áp đặt, rồi kéo trần/sàn ấy thành C-Lipschitz để còn ghép được.
    const INF = 1e9;
    const tranTren = baoHinh(roadLandNb.map((ds, k) => (
      ds.length ? Math.min(...ds.map((h) => h + D)) : goc[k] + INF)), -1);
    const tranDuoi = baoHinh(roadLandNb.map((ds, k) => (
      ds.length ? Math.max(...ds.map((h) => h - D)) : goc[k] - INF)), +1);
    // (3) TRUNG VỊ của ba hàm C-Lipschitz vẫn C-Lipschitz (min/max của các hàm C-Lipschitz đều
    //     C-Lipschitz), và nó nằm trong [sàn, trần] ở mọi chỗ hai vế ấy còn giao nhau.
    //     ⚠️ KHÔNG dùng phép KẸP thẳng: kẹp phá mất tính Lipschitz, tức trả lại đúng cái bậc vừa
    //     xoá (cùng bài học "KẸP thì phá thứ tự, ĐẨY thì không" ở Phase 7D).
    for (let k = 0; k < roadIdx.length; k += 1) {
      const a = tranDuoi[k];
      const b = (duoi[k] + tren[k]) / 2;
      const c = tranTren[k];
      heights[roadIdx[k]] = Math.max(Math.min(a, b), Math.min(b, c), Math.min(a, c));
    }
  }

  /** Cao độ mặt trên của ô. Ngoài lưới → kẹp về ô mép gần nhất (đất không kết thúc đột ngột). */
  function heightAt(x, y) {
    const cx = x < 0 ? 0 : (x >= size ? size - 1 : Math.round(x));
    const cy = y < 0 ? 0 : (y >= size ? size - 1 : Math.round(y));
    return heights[cy * size + cx];
  }

  /**
   * Cao độ tại một điểm BẤT KỲ giữa các ô — `u`/`v` là toạ độ ô ở dạng số thực (`u = 3` là đúng
   * tâm ô 3, `u = 3,5` là ranh giới giữa ô 3 và ô 4).
   *
   * ⚠️ ĐÂY LÀ THỨ BIẾN THỀM BẬC THÀNH SƯỜN DỐC, và nó KHÔNG mâu thuẫn với quyết định "phải là thềm
   * bậc" ở đầu file — nó gỡ đúng cái tiền đề mà quyết định ấy dựa vào. Lý lẽ cũ là: *"ô nền hình
   * HỘP không dốc theo được"*. Đúng — chừng nào mặt đất còn là 144 cái hộp. Phase 8C thay chúng
   * bằng MỘT tấm lưới liền có cao độ ở từng đỉnh (`render3d/terrainMesh.js`), nên tiền đề ấy hết
   * đúng và cái kết luận đi theo nó cũng hết đúng. Đàm nói thẳng: *"terrain như các bậc thang…
   * nếu architecture hiện tại phụ thuộc vào grid 12x12 khiến terrain luôn giống board game, hãy
   * tìm cách giữ data/progression nhưng thay đổi cách render"*. Dữ liệu bậc thềm giữ NGUYÊN từng
   * con số; chỉ cách vẽ nó đổi.
   *
   * ⚠️ TẠI TÂM Ô, HÀM NÀY TRẢ VỀ ĐÚNG `heightAt` — không xê dịch một phần nghìn. Đó là bất biến
   * bắt buộc, không phải chi tiết: công trình, cây, cư dân đều đứng ở cao độ `heightAt` của ô mình,
   * nên nếu mặt đất mượt đi qua tâm ô ở một cao độ KHÁC thì mọi thứ trên đó lơ lửng hoặc lún —
   * đúng hình dạng lỗi "sáu chỗ đặt vật lên mặt đất" của Phase 7B, lần này im lặng hơn vì nó chỉ
   * lệch vài phần trăm. Bất biến này khoá bằng test.
   *
   * Chuyển tiếp dùng `smoothstep` chứ không phải nội suy thẳng: nội suy thẳng cho mặt dốc PHẲNG
   * gặp nhau ở một nếp gấp sắc ngay trên tâm ô — đổi một loại cạnh cứng này lấy một loại khác.
   * `smoothstep` cho đạo hàm bằng 0 ở hai đầu, nên thềm vẫn còn là thềm và chỗ nối là sườn cong.
   */
  function smoothHeightAt(u, v) {
    const x0 = Math.floor(u);
    const y0 = Math.floor(v);
    const tx = smoothstep(u - x0);
    const ty = smoothstep(v - y0);
    const top = lerp(heightAt(x0, y0), heightAt(x0 + 1, y0), tx);
    const bottom = lerp(heightAt(x0, y0 + 1), heightAt(x0 + 1, y0 + 1), tx);
    return lerp(top, bottom, ty);
  }

  /**
   * Cao độ cho một công trình phủ `span` ô quanh tâm `(x, y)`.
   *
   * `top` = cao nhất dưới bóng nó (đứng ở đây thì KHÔNG bao giờ có góc treo lơ lửng).
   * `drop` = phần hụt so với chỗ thấp nhất — dựng thành khối MÓNG lấp xuống, đúng như bệ kè ngoài
   * đời. Trả `drop = 0` khi công trình nằm trọn trên một thềm (phần lớn trường hợp) ⇒ không tốn
   * hình học thừa.
   */
  function footprint(x, y, span = 1) {
    const reach = Math.max(0, Math.floor((Math.max(1, span) - 1) / 2));
    let top = -Infinity;
    let bottom = Infinity;
    for (let dy = -reach; dy <= reach; dy += 1) {
      for (let dx = -reach; dx <= reach; dx += 1) {
        const h = heightAt(x + dx, y + dy);
        if (h > top) top = h;
        if (h < bottom) bottom = h;
      }
    }
    if (top === -Infinity) { top = 0; bottom = 0; }
    return { top, drop: top - bottom };
  }

  const cells = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) cells.push({ x, y, h: heights[y * size + x] });
  }

  /**
   * Cao độ mặt đất ở BẤT KỲ đâu — kể cả ngoài lưới thành phố. Đây là hàm mà tấm lưới mặt đất
   * (`render3d/terrainMesh.js`) hỏi cho từng đỉnh, và là **nguồn DUY NHẤT** cho hình dạng mặt đất.
   *
   * ⚠️ VÌ SAO VÙNG ĐẤT NGOÀI PHẢI NẰM CHUNG MỘT HÀM VỚI VÙNG TRONG. Trước Phase 8C, "thành phố" là
   * 144 ô hộp còn "vùng đất bao quanh" là một tấm ván vuông riêng đặt thấp hơn — hai thứ không biết
   * nhau, nên chỗ giáp ranh luôn là một MÉP VUÔNG SẮC LẸM, và ảnh chụp đọc ra đúng "một miếng bìa
   * đặt giữa hư không". Nối chúng vào một hàm thì mép ấy không còn tồn tại để mà sắc.
   *
   * Ba việc hàm này làm ở vùng ngoài:
   *   1. **Hạ dần** xuống `APRON_DROP` — thành phố thành một cao nguyên, không phải một cái khay.
   *   2. **Ranh giới LƯỢN**, không vuông: bán kính vùng chuyển tiếp bị nhiễu nhân vào, nên chỗ đất
   *      thoải ra xa, chỗ dốc gấp. Đây là "irregular silhouette" — thứ mà một hình vuông hoàn hảo
   *      không bao giờ có, và là dấu hiệu số một để mắt đọc ra "bàn cờ".
   *   3. **Gợn sóng** nhẹ, nên vùng ngoài không phải một mặt phẳng chết.
   */
  function surfaceHeightAt(u, v) {
    const cu = Math.min(size - 0.5, Math.max(-0.5, u));
    const cv = Math.min(size - 0.5, Math.max(-0.5, v));
    const plateau = smoothHeightAt(cu, cv);
    const outside = Math.max(Math.abs(u - cu), Math.abs(v - cv));
    if (outside <= 0) return plateau;

    // Nhiễu nhân vào BÁN KÍNH chuyển tiếp (không cộng vào cao độ): cộng thì mép vẫn vuông, chỉ là
    // vuông gợn sóng; nhân thì chính cái ranh giới di chuyển ra vào, tức hình dáng cao nguyên đổi.
    // ⚠️ SÀN 0,62 CHỨ KHÔNG PHẢI 0,45: bán kính chuyển tiếp hẹp nhất phải còn đủ rộng cho lưới đỉnh
    // lấy được vài mẫu ngang qua nó. Ở 0,45 thì chỗ dốc nhất chỉ rộng 1,17 ô ≈ 3 mẫu, và một sườn
    // dốc dựng từ 3 mẫu thì lại đúng là một cái BẬC — tức là đi vòng một vòng để về chỗ cũ.
    const wobble = 0.62 + valueNoise(`${seed}|rim`, u / 2.6, v / 2.6) * 0.8;
    // ⚠️ KẸP TRẦN BÁN KÍNH Ở `APRON_EDGE`. Không kẹp thì chỗ nào nhiễu cho `wobble` lớn nhất sẽ có
    // bán kính 3,69 ô > 3,4 ô — tức tại rìa lưới nó vẫn đang trên đường dốc, chưa chạm đáy, và lời
    // hứa "ra khỏi `APRON_EDGE` thì phẳng đúng `-APRON_DROP`" thành sai ở đúng vài chỗ. Loại sai
    // này im lặng và rời rạc: một vết hở ở góc này, không hở ở góc kia.
    const radius = Math.min(APRON_EDGE, APRON_CELLS * wobble);
    const t = smoothstep(Math.min(1, outside / radius));
    // Gợn sóng TẮT DẦN về 0 khi ra tới `APRON_EDGE`, để rìa tấm lưới phẳng đúng `-APRON_DROP` và
    // khớp được với tấm ván vùng ngoài. Xem chú thích của `APRON_EDGE`.
    const settle = smoothstep(Math.min(1, Math.max(0,
      (outside - APRON_CELLS) / Math.max(1e-6, APRON_EDGE - APRON_CELLS))));
    const roll = (valueNoise(`${seed}|roll`, u / 3.4, v / 3.4) - 0.5) * 0.42 * (1 - settle);
    return khoetLongNuoc(u, v, lerp(plateau, -APRON_DROP + roll, t));
  }

  /**
   * Hạ mặt đất xuống làm LÒNG NƯỚC. Trả về `dat` y nguyên ở kỷ khô và ở mọi chỗ trên cạn.
   *
   * ⚠️ PHÉP KHOÉT NẰM Ở `setting.hazXuongDay`, KHÔNG VIẾT LẠI Ở ĐÂY — `horizon.js` cũng gọi đúng
   * hàm ấy, và hai tấm phải khoét giống hệt nhau ở chỗ giáp (Phase 9A). Ở đây chỉ còn việc tra
   * `setting` rồi trừ ra cao độ đáy.
   *
   * ⚠️ VÀ VÌ SAO NÓ CHỈ NẰM Ở ĐÂY, KHÔNG NẰM Ở `heightAt`/`smoothHeightAt`: hai hàm kia tả cao độ
   * TRONG lưới 12×12 — chỗ nhà đứng, chỗ đường chạy, chỗ ADR-007 hứa "bảo tàng bất động". Bảng khai
   * `reach ≥ SHORE_BAND` ở mọi kỷ và mép bờ gần chỉ được lượn RA XA, nên độ trộn luôn bằng 0 trong
   * lưới; nhưng "luôn bằng 0" là một lời hứa, còn "không có mặt trong hàm" là một sự thật.
   */
  function khoetLongNuoc(u, v, dat) {
    if (!setting.built) return dat;
    const tron = setting.blendAt(u, v);
    if (tron <= 0) return dat;
    return hazXuongDay(dat, WATER_SURFACE_Y - setting.depthAt(u, v), tron);
  }

  /**
   * VẾT LOANG trên mặt đất: 0..1 tất định tại một điểm bất kỳ, ở TẦN SỐ KHÔNG LIÊN QUAN LƯỚI Ô.
   *
   * ⚠️ ĐÂY LÀ NỬA THỨ HAI CỦA VIỆC GỠ BÀN CỜ, VÀ NÓ GỠ THÊM MỘT TIỀN ĐỀ NỮA. `palette3d.js` có
   * hẳn một khối chú thích kể ba lần vá liên tiếp để mặt đất thôi ra bàn cờ, kết luận bằng cách
   * **siết bốn sắc nền lại còn ±4° góc màu và ~0,018 độ sáng** — "vừa đủ để mặt đất không phẳng lì,
   * chưa đủ để mắt nối thành lưới". Cái trần chật chội ấy hoàn toàn đúng, nhưng nó tồn tại vì một
   * lý do DUY NHẤT: biến thiên màu bị buộc vào Ô VUÔNG, mà mắt người nối các ô vuông cùng sắc
   * thành hàng lối nhanh hơn bất cứ thứ gì. Khi biến thiên chạy theo một trường liên tục ở tần số
   * ~2,9 ô — không chia hết cho ô, không thẳng hàng với ô — thì không còn hàng lối nào để mà nối,
   * nên biên độ được phép lớn hơn hẳn. Đúng cùng dạng với việc thềm bậc thôi bắt buộc: một kết
   * luận đúng mất hiệu lực khi tiền đề của nó bị gỡ.
   *
   * Số nguyên/thập phân đều nhận; ngoài lưới vẫn có giá trị (vùng đất thoải cũng cần loang).
   */
  function tintAt(u, v) {
    return valueNoise(`${seed}|tint`, u / 2.9, v / 2.9);
  }

  return {
    heightAt, smoothHeightAt, surfaceHeightAt, tintAt, footprint, cells, maxHeight, profile,
    // Trả ra chứ không bắt tầng vẽ tự `buildSetting` lần nữa: hai lần dựng là hai cơ hội để một bên
    // truyền `gridSize` khác bên kia, và triệu chứng sẽ là tấm nước lệch khỏi lòng nước vài phần
    // mười ô — đúng loại lỗi im lặng mà "một luật một công thức" sinh ra để chặn.
    setting,
  };
}
