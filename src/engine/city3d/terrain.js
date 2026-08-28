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

/**
 * BỀ RỘNG DANH NGHĨA của dải HOÀ giữa nền phố và đồng bằng mở, tính bằng ô.
 *
 * ⚠️ 2026-08-21 — CON SỐ NÀY ĐI TỪ 2,6 LÊN 7,5, VÀ ĐÓ LÀ NỬA THỨ NHẤT CỦA BẢN VÁ "XOÁ CÁI BỆ".
 * Đàm bác cả 15 kỷ: *"vẫn còn cái bệ"*. Đo bằng `scripts/plateau-score.mjs` (vành đồng tâm bước
 * 0,5 ô, chỉ số bệ = dốc lớn nhất vành 6–9 ÷ dốc trung bình vành 0–5): **10/15 kỷ ≥ 5**, tệ nhất
 * kỷ 14 = 26,98, và **cả 15 kỷ nhảy trong đúng một dải 7,25–8,75** — tức bước nhảy không do địa
 * hình quyết định mà do LƯỚI quyết định. Với bề rộng 2,6 ô thì cả một khoảng tụt 0,62 đơn vị bị
 * nhồi vào chưa tới ba ô: đó chính là cái vành mà mắt đọc ra là mép bàn.
 *
 * ⚠️ VÀ NÓ KHÔNG PHẢI MỘT CON SỐ CỐ ĐỊNH NỮA — xem `APRON_SPREAD`. Một dải hoà rộng bằng nhau ở
 * mọi hướng vẫn là một hình học, chỉ là một hình học rộng hơn.
 */
export const APRON_CELLS = 7.5;

/**
 * Dải hoà rộng hẹp THẤT THƯỜNG bao nhiêu quanh bề rộng danh nghĩa (±62% ⇒ **2,85 … 12,15 ô**).
 *
 * ⚠️ ĐÂY LÀ THỨ TRẢ LỜI ĐÚNG CÂU CỦA ĐÀM: *"ranh giới của vùng bằng TUYỆT ĐỐI KHÔNG được trùng với
 * ranh giới lưới 12×12"*. Nới rộng dải hoà thôi thì chưa đủ — mép của nó vẫn là một đường cách đều
 * mép lưới, tức vẫn là hình vuông bo góc, chỉ là to hơn. Nhân bề rộng với một tầng nhiễu RẤT thô
 * (cỡ ô 9, tức một hai bướu cho cả thế giới) thì chỗ này đồng bằng ăn sát chân phố, chỗ kia nó
 * chạy ra xa mười hai ô — và không còn một bán kính nào để mắt bám vào.
 */
export const APRON_SPREAD = 0.62;

/**
 * Đồng bằng mở nằm thấp hơn **NỀN** phố bao nhiêu.
 *
 * ⚠️ 2026-08-21 — 0,62 → 0,18, VÀ ĐÂY LÀ NỬA THỨ HAI, QUAN TRỌNG HƠN, CỦA BẢN VÁ. Con số cũ được
 * chọn để *"đủ để đọc ra thành phố nằm trên cao"* — tức nó được chọn ĐỂ LÀM RA một cái bệ. Đặt nó
 * cạnh sự thật: `terrainMaxHeight` của 11 trên 15 kỷ **nhỏ hơn 0,62**; kỷ 11 chỉ 0,14. Nghĩa là
 * cái vành quanh thành phố cao gấp **4,4 lần** toàn bộ địa hình bên trong thành phố. Không có
 * ngọn đồi nào cả — chỉ có một cái mặt bàn.
 *
 * ⚠️ VÌ SAO KHÔNG PHẢI 0. Mặt nước là cao độ tuyệt đối DUY NHẤT của thế giới này
 * (`WATER_SURFACE_Y = −APRON_DROP − WATER_DROP_BELOW_PLAIN`) và nó phải nằm dưới MỌI đất khô, kể
 * cả ô thấp nhất của lưới (cao độ 0). Nên đồng bằng buộc phải nằm dưới 0 một chút để còn chỗ cho
 * mặt nước. 0,18 là mức nhỏ nhất còn giữ được lời hứa ấy mà vẫn **nhỏ hơn biên độ gợn của chính
 * đồng bằng** (0,21) — tức có những chỗ đồng bằng CAO HƠN nền phố. Đó mới là câu "thành phố nằm
 * TRONG đồng bằng", chứ không phải "ngồi TRÊN" nó.
 */
export const APRON_DROP = 0.18;

/**
 * Tấm lưới mặt đất thành phố phủ thêm bao nhiêu ô ra ngoài mép lưới 12×12.
 *
 * ⚠️ ĐỔI TÊN TỪ `APRON_EDGE` (2026-08-21) VÌ CÁI TÊN CŨ ĐÃ THÀNH MỘT LỜI NÓI DỐI. Nó từng hứa
 * *"ra khỏi mốc này thì mặt đất phẳng đúng `-APRON_DROP`"* — và chính lời hứa ấy là nguồn thứ ba
 * của cái bệ: nó ép **mọi kỷ về cùng một mặt phẳng ở cùng một bán kính**, tạo ra đúng cái vành mà
 * mắt đọc ra. Lời hứa đã bị xoá, nên cái tên cũng phải đi theo; để lại là gài mìn cho phiên sau.
 *
 * ⚠️ VÀ LỜI HỨA THẬT VỚI `horizon.js` KHÔNG HỀ MẤT — nó chỉ được phát biểu lại cho đúng. Lý do gốc
 * (Phase 9A, hai cái nêm sáng ở chỗ giáp) đòi **hai tấm phải KHỚP NHAU tại chỗ giáp**, chứ không
 * đòi cả hai phải bằng một hằng số. Nay tấm chân trời đọc thẳng `terrain.nenKho(...)` làm nền, nên
 * chúng khớp **theo cấu tạo**, ở mọi hướng, mà không cần ai phẳng cả. Đúng bài học Phase 7D: một
 * lời hứa nói về QUAN HỆ mà viết thành một MỨC thì gãy trong im lặng.
 *
 * Còn lại đúng một nghĩa, và nghĩa ấy thuần kỹ thuật: **tấm lưới phải kết thúc ở đâu đó**. Giá trị
 * giữ nguyên 3,4 để `terrainSurfaceReach` không đổi (9,5) — đổi nó là đổi số đỉnh của tấm lưới,
 * tức đổi ngân sách tam giác, một khoản tiền khác hẳn và phải được đo riêng.
 */
export const PLATE_PAD_CELLS = 3.4;

/**
 * Số ô con trên MỘT ô thành phố của tấm địa hình.
 *
 * ⚠️ SỐNG Ở ĐÂY (tầng thuần) CHỨ KHÔNG Ở `terrainMesh.js`, VÀ ĐÓ LÀ MỘT BẢN VÁ, KHÔNG PHẢI SỞ
 * THÍCH. `horizon.js` cần biết tấm địa hình phủ TỚI ĐÂU để nối liền vào; Phase 9A bản đầu tự suy
 * lại con số ấy bằng tay (`(size−1)/2 + 0,5 + PLATE_PAD_CELLS` = 9,4) trong khi tấm đất thật phủ tới
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
  const padSteps = Math.ceil((0.5 + PLATE_PAD_CELLS) * TERRAIN_SUB);
  return (size - 1) / 2 + padSteps / TERRAIN_SUB;
}

/**
 * HƯỚNG THẤP — phía mà mặt đất đổ xuống. Đây là **LÝ DO** của cả quả đồi.
 *
 * ⚠️ TRƯỜNG NÀY RA ĐỜI VÌ MỘT PHÉP ĐO, KHÔNG VÌ MỘT Ý THÍCH (2026-08-20, §1(B)). Đàm nhìn ảnh kéo
 * xa rồi nói mặt đất gợn lên gợn xuống *"như tấm chăn nhàu"*, không có lý do địa lý nào. Đo ra:
 * phần hình dạng KHÔNG giải thích được bằng chính cái khuôn mà kỷ ấy khai chiếm **75,2% biên độ**,
 * và nó còn đổi chiều **14,3 lần trên 24 đường cắt**. Ngoài đời cao độ luôn có lý do — nước chảy
 * về đâu thì đất thấp về đó — và cái lý do ấy trước nay KHÔNG hề được khai ở đâu cả.
 *
 * Mọi kỷ đều phải có một hướng thấp, kể cả kỷ phẳng: một đồng bằng phù sa vẫn nghiêng về phía
 * sông, chỉ là nghiêng ít. `tilt` nói nghiêng bao nhiêu.
 */
const HUONG_THAP = {
  bac: (_u, v) => v,       // đất đổ về phía BẮC (-y) ⇒ càng về nam càng cao
  nam: (_u, v) => 1 - v,   // đất đổ về phía NAM (+y)
  dong: (u) => 1 - u,      // đất đổ về phía ĐÔNG (+x)
  tay: (u) => u,           // đất đổ về phía TÂY (-x)
};

/** Toạ độ dọc TRIỀN: 0 ở mép THẤP, 1 ở mép CAO. `px`/`py` là toạ độ ô (cho phép lệch phân số). */
function trienAt(px, py, size, drain) {
  const d = size > 1 ? size - 1 : 1;
  const f = HUONG_THAP[drain] ?? HUONG_THAP.nam;
  return Math.min(1, Math.max(0, f(px / d, py / d)));
}

/**
 * Số mũ của SIÊU ELLIPSE dùng thay khoảng cách Chebyshev khi tính `edge`.
 *
 * ⚠️ ĐÂY LÀ BẢN VÁ CHO "CÁI BỆ VUÔNG", VÀ NÓ LẬT MỘT CHÚ THÍCH CŨ. Chú thích cũ chọn Chebyshev với
 * lý do: *"lưới là hình vuông, nên vành đồi hình vuông ôm sát mép lưới, còn vành hình TRÒN sẽ để
 * bốn góc lưới tụt xuống thành bốn hố — trông như lỗi chứ không như địa hình."* Lý lẽ ấy đúng cho
 * một hình TRÒN HOÀN HẢO (p = 2). Nhưng cái giá của nó thì chưa ai đo: bắn 720 tia từ tâm ra tìm
 * mép cao nguyên, tỉ số bán kính CHÉO/TRỤC ra **1,341** trong khi hình vuông hoàn hảo là
 * `√2 = 1,414` — tức mặt đất quanh thành phố **là một cái khay vuông tới 95%**, và đó chính là
 * "mảng vuông nhỏ xíu" Đàm nhìn thấy.
 *
 * `p = 2,5` là đường giữa: bốn góc vẫn đầy đặn hơn hình tròn (không thành bốn cái hố), mà cạnh
 * thì đã cong hẳn. Không phải một con số dung hoà tuỳ hứng — nó được CHỌN BẰNG PHÉP ĐO tỉ số
 * chéo/trục, xem bảng trong `PERFORMANCE.md`.
 */
const SIEU_ELLIPSE_P = 2.5;

/** Khoảng cách BO TRÒN từ tâm lưới, chuẩn hoá 0..1 (1 = tới mép lưới theo trục). */
function edgeAt(px, py, size) {
  const c = (size - 1) / 2;
  if (c <= 0) return 0;
  const dx = Math.abs(px - c);
  const dy = Math.abs(py - c);
  const r = (dx ** SIEU_ELLIPSE_P + dy ** SIEU_ELLIPSE_P) ** (1 / SIEU_ELLIPSE_P);
  return Math.min(1, r / c);
}

/**
 * Bước sóng (tính bằng ô) của mảng đồi thoai thoải và của sóng đụn cát.
 *
 * ⚠️ HAI CON SỐ NÀY PHẢI SO VỚI CỠ LƯỚI (12 ô), KHÔNG PHẢI VỚI CẢM GIÁC "đồi nên to bằng nào".
 * Bản đầu đặt 7,5 và 5,0 — nghe hợp lý, nhưng trên một lưới 12 ô thì đó là **1,6 và 2,2 chu kỳ**,
 * tức bốn quả đồi và bốn cái hõm chen trong khoảng bằng một thị trấn. Đo ra kỷ 7 nhảy lên **4 đỉnh
 * rời rạc / 59 lần đổi chiều** và kỷ 15 lên **52 lần đổi chiều ở cấp thềm** — tức là hai kỷ này bị
 * chính bản vá chống-nhàu làm cho NHÀU HƠN trước. Sửa đúng một nửa còn tệ hơn không sửa, và chỉ
 * phép đo mới thấy: nhìn ảnh thì "nhiều đồi" trông y hệt "địa hình phong phú".
 *
 * Nay đặt sao cho lưới 12 ô chứa **khoảng MỘT** chu kỳ: một lưng đồi và một triền, đúng thứ mắt
 * đọc ra là "đồi", chứ không phải một tấm tôn lượn sóng.
 */
const SWELL_CELLS = 11.0;
const DUNE_CELLS = 8.0;

/**
 * Mảng ĐỒI NỐI NHAU — hình ảnh Toscana: những lưng đồi dài, thoải, chạy gần song song.
 *
 * ⚠️ **CỘNG hai sóng, ĐỪNG NHÂN.** Bản đầu nhân `sin(x) × sin(y)` — nghe như cách hiển nhiên để có
 * "đồi theo cả hai chiều", nhưng tích của hai sóng đổi dấu thì cho ra một **BÀN CỜ**: bốn góc phần
 * tư luân phiên cao–thấp, tức 2 đỉnh và 2 hõm chen trong 12 ô. Đo ra kỷ 7 giữ nguyên **3 đỉnh rời
 * rạc** kể cả sau khi đã kéo dài bước sóng — vì kéo dài không xoá được cái bàn cờ, nó chỉ làm bàn
 * cờ to ra. Cộng thì được **những sống dài**: một sóng chính chạy theo một trục, một sóng phụ dài
 * hơn hẳn uốn nhẹ các sống ấy cho khỏi thẳng đơ. Đó mới là hình Toscana thật.
 */
function swellAt(px, py) {
  const chinh = Math.sin((px / SWELL_CELLS) * Math.PI * 2);
  const phu = Math.sin((py / (SWELL_CELLS * 1.55)) * Math.PI * 2 + 1.1);
  return (chinh * 0.72 + phu * 0.28 + 1) / 2;
}

/** Sóng ĐỤN CÁT — những sống dài SONG SONG, chạy vuông góc với hướng thấp. */
function duneAt(px, py, size, drain) {
  return (Math.sin((trienAt(px, py, size, drain) * (size - 1) / DUNE_CELLS) * Math.PI * 2) + 1) / 2;
}

/**
 * Kiểu địa hình — mỗi kiểu là một TRƯỜNG HÌNH HỌC TRƠN, không còn là "một cách trộn nhiễu".
 *
 * ⚠️ ĐÂY LÀ THAY ĐỔI GỐC CỦA §1(B), VÀ NÓ ĐẢO NGƯỢC CÁCH NHIỄU ĐI VÀO HÌNH DẠNG.
 * Bản cũ: `cao độ = hình học × w + NHIỄU × (1−w)`, với `w` từ 0 tới 0,7. Nhiễu **CỘNG THẲNG vào
 * cao độ**, nên nó đẻ thêm đỉnh và hố ở khắp nơi — đo được: kỷ 13 có **4 đỉnh rời rạc**, kỷ 1 có
 * **4 đáy rời rạc**, trong khi một cái gò hay một lòng chảo đáng lẽ phải có đúng MỘT. Tệ hơn,
 * `plain` và `rolling` là `(n) => n` — **thuần nhiễu, không một thành phần hình học nào** — nên
 * năm kỷ (2, 3, 7, 11, 12) có mặt đất không thể đọc ra lý do, kể cả kỷ 7 mà cả bản sắc là *"đồi
 * Toscana nối nhau"*.
 *
 * Bản mới: **nhiễu LÀM CONG level set thay vì CỘNG vào cao độ** (domain warp — xem `truongTho`).
 * Đây không phải một thủ thuật mới; nó chính là nguyên tắc đã được viết ra ngay trong file này cho
 * vành ngoài: *"Nhiễu nhân vào BÁN KÍNH chuyển tiếp (không cộng vào cao độ): cộng thì mép vẫn
 * vuông, chỉ là vuông gợn sóng; nhân thì chính cái ranh giới di chuyển ra vào."* Nay áp cùng
 * nguyên tắc ấy cho cả quả đồi. Hệ quả: mặt đất vẫn không đều tăm tắp, nhưng mọi chỗ cao chỗ thấp
 * đều là MỘT hình dạng bị bẻ cong, không phải hai chục cái mụn cộng lại.
 *
 * Mỗi hàm nhận `(edge, trien, swell, wave)` — cả bốn đều TRƠN và đều 0..1:
 *   `edge`  0 ở tâm lưới, 1 ở mép (bo tròn theo siêu ellipse)
 *   `trien` 0 ở phía đất THẤP, 1 ở phía đất CAO — đây là thứ mang LÝ DO
 *   `swell` mảng đồi tròn nối nhau · `wave` sóng đụn cát song song
 */
const SHAPES = {
  /** Đồng bằng phù sa: nghiêng đều về phía sông, điểm xuyết vài gờ đất (đê tự nhiên). */
  plain: (edge, trien, swell) => trien * 0.82 + swell * 0.18,
  /** Đồi Toscana nối nhau — nay có HÌNH THẬT, không còn là nhiễu trắng. */
  rolling: (edge, trien, swell) => swell * 0.42 + trien * 0.58,
  /** Thung lũng: thấp ở giữa, cao ở rìa. */
  valley: (edge) => edge,
  /** Gò/mỏm đá: cao ở giữa, đổ xuống bốn phía (Göbekli Tepe, lâu đài Burg Eltz). */
  ridge: (edge) => 1 - edge,
  /** Bờ dốc xuống một phía (Lisbon đổ ra cửa sông Tejo) — một triền duy nhất, sạch. */
  coast: (edge, trien) => trien,
  /** Đụn cát: những sống dài song song, chạy vuông góc với hướng gió/hướng thấp. */
  dune: (edge, trien, swell, wave) => wave * 0.55 + trien * 0.45,
};

/**
 * ĐỊA HÌNH THEO KỶ — mỗi dòng phải trả lời được "nước ấy trông như vậy thật không?".
 *
 * ⚠️ Cùng luật với `country`/`landmark` ở `eraStyle.js`: đây KHÔNG phải nhãn dán cho đẹp. Một con
 * số tuỳ hứng ở đây sẽ sinh ra đúng thứ mà Phase 5B đã phải đi sửa — 15 kỷ khác nhau trên giấy mà
 * giống nhau trên màn hình.
 *
 * `terraces` = số bậc thềm CỦA NỀN THÀNH PHỐ (1 = phẳng tuyệt đối) · `relief` = chiều cao một bậc
 * · `drain` = phía đất đổ xuống · `tilt` = bao nhiêu phần hình dạng là cái triền nghiêng ấy.
 *
 * ⚠️ `terraces`/`relief` ĐÃ HẠ Ở CẢ 15 KỶ (2026-08-20, §1(B)) — đây là lệnh của Đàm, không phải một
 * lượt chỉnh số cho đẹp: *"Nền thành phố phải BẰNG hoặc gần bằng… Địa hình NGOÀI lưới mới được gồ
 * ghề."* Đo trước khi sửa: chênh cao TRONG lưới 12×12 lên tới **2,70 đơn vị** ở kỷ 5 (một ô rộng 1
 * đơn vị, một căn nhà cao 1–2), và bậc giữa hai ô KỀ NHAU lên tới **1,15** ⇒ độ dốc **172%**, trong
 * khi con phố dốc nhất thế giới (Baldwin Street) là 34,8%. Đó không phải một thị trấn trên đồi, đó
 * là một cái vách.
 *
 * ⚠️ VÀ ĐÂY LÀ MỘT LẦN NỮA CỦA "MỘT TRƯỜNG GÁNH HAI VIỆC" — lần thứ SÁU trong dự án này
 * (`storyHeight` · `roof` · bảng loài cây · `avenue` · `groundFloor`, rồi tới đây). `relief` xưa
 * nay trả lời đồng thời hai câu: *"vùng đất này hùng vĩ tới đâu"* và *"nền thành phố gập ghềnh tới
 * đâu"*. Ngoài đời hai câu ấy KHÔNG đi cùng nhau: Positano nằm trên một vách núi dựng đứng mà từng
 * bậc phố thì vẫn đi bộ được, vì người ta SAN NỀN. Ở đây `terraces`/`relief` nay chỉ còn trả lời
 * câu thứ hai; câu thứ nhất do `drain`/`tilt` và vành đất ngoài lưới trả lời.
 */
export const ERA_TERRAIN = {
  1:  { shape: 'ridge',   drain: 'nam',  tilt: 0.25, terraces: 3, relief: 0.62, note: 'Göbekli Tepe nằm trên một GÒ ĐẤT cao nhìn xuống đồng bằng Harran ở phía nam' },
  2:  { shape: 'plain',   drain: 'dong', tilt: 0.55, terraces: 2, relief: 0.34, note: 'đồng bằng phù sa sông Nin — phẳng tới chân trời, nghiêng đều về phía sông ở phía đông' },
  3:  { shape: 'plain',   drain: 'tay',  tilt: 0.60, terraces: 2, relief: 0.26, note: 'Lưỡng Hà phẳng tuyệt đối, dốc không nhận ra được về nhánh Euphrates phía tây — mạng kênh của Ur dẫn nước từ đó; ziggurat là ngọn núi NHÂN TẠO duy nhất' },
  4:  { shape: 'valley',  drain: 'bac',  tilt: 0.22, terraces: 3, relief: 0.40, note: 'Trường An đặt BỜ NAM sông Vị nên đất thoải về phía bắc ra sông; "mặt quay về nam" là hướng CUNG ĐIỆN theo phong thuỷ, không phải hướng đất thấp' },
  5:  { shape: 'ridge',   drain: 'dong', tilt: 0.30, terraces: 3, relief: 0.90, note: 'Burg Eltz dựng trên MỎM ĐÁ mà suối Elzbach uốn quanh ở phía đông — dốc nhất cả 15 kỷ' },
  6:  { shape: 'valley',  drain: 'nam',  tilt: 0.35, terraces: 2, relief: 0.44, note: 'đình làng Bắc Bộ quay hướng nam nên bến nước và ao đình ở ngay phía nam: đồng trũng dần về đó, đình trên gò cao' },
  7:  { shape: 'rolling', drain: 'nam',  tilt: 0.44, terraces: 3, relief: 0.55, note: 'đồi Toscana nối nhau, THOẢI; Duomo đứng BỜ BẮC nên cả vùng tụt dần về lòng sông Arno phía nam' },
  8:  { shape: 'coast',   drain: 'nam',  tilt: 0.62, terraces: 3, relief: 0.85, note: 'Lisbon "thành phố bảy quả đồi" đổ dốc xuống cửa sông Tejo ở phía nam' },
  9:  { shape: 'valley',  drain: 'tay',  tilt: 0.30, terraces: 2, relief: 0.36, note: 'lòng chảo sông Seine chảy ở phía tây, gần phẳng, chỉ nhô đồi Montmartre' },
  10: { shape: 'valley',  drain: 'bac',  tilt: 0.26, terraces: 3, relief: 0.55, note: 'Manchester trong thung lũng công nghiệp, nhà máy bám sườn thoải xuống kênh Bridgewater phía bắc' },
  11: { shape: 'plain',   drain: 'tay',  tilt: 0.38, terraces: 2, relief: 0.28, note: 'Manhattan là một tấm granite gần phẳng nghiêng về sông Hudson phía tây — chiều cao đến từ NHÀ' },
  12: { shape: 'plain',   drain: 'dong', tilt: 0.55, terraces: 2, relief: 0.22, note: 'thảo nguyên Nga mênh mông, phẳng đến mức thành biểu tượng; dải phố Stalingrad bám BỜ TÂY nên đất thoải về sông Volga phía đông' },
  13: { shape: 'valley',  drain: 'dong', tilt: 0.40, terraces: 3, relief: 0.62, note: 'đô thị Nhật kẹp giữa núi, mở ra vịnh phía đông — đất hẹp là lý do có nhà nang' },
  14: { shape: 'plain',   drain: 'nam',  tilt: 0.00, terraces: 1, relief: 0.00, note: 'Marina Bay là đất LẤN BIỂN: phẳng tuyệt đối, do người san — kỷ DUY NHẤT không có hướng thấp' },
  15: { shape: 'dune',    drain: 'bac',  tilt: 0.30, terraces: 3, relief: 0.42, note: 'sa mạc Dubai: đụn cát sóng dài song song, thoải về vịnh Ba Tư phía bắc' },
};

const FALLBACK_TERRAIN = { shape: 'plain', drain: 'nam', tilt: 0.3, terraces: 2, relief: 0.40, note: '' };

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
 * NHIỄU BẺ CONG LEVEL SET ĐI BAO XA, tính bằng ô.
 *
 * Quá nhỏ (< 1) thì hình học lộ ra là công thức — vành đồi tròn trịa như vẽ bằng compa. Quá lớn
 * (> 3) thì level set tự cắt nhau và ta quay về đúng chỗ cũ: đỉnh rời rạc, mặt đất nhàu.
 * 1,8 ô (tức lệch tối đa ±0,9 ô) giữ cho mọi kỷ có đúng MỘT đỉnh và MỘT đáy — có test đếm.
 */
const WARP_CELLS = 1.8;

/**
 * VÀNH ĐẤT NGOÀI LƯỚI nghiêng bao nhiêu theo hướng thấp của kỷ (đơn vị thế giới, trước khi nhân
 * `tilt` của chính kỷ ấy). Nhỏ hơn một bậc thềm — vành đất là nền, không được tranh chấp với
 * thành phố; nhưng đủ để bên cao và bên thấp đọc ra khác nhau.
 */
const OUTER_TILT = 0.55;

/**
 * PHẦN KHOẢNG HỞ TỚI MẶT NƯỚC MÀ VÀNH ĐẤT ĐƯỢC PHÉP ĂN.
 *
 * ⚠️ ĐÂY LÀ MỘT **QUAN HỆ**, KHÔNG PHẢI MỘT MỨC — VÀ NÓ ĐÃ TỪNG BỊ VIẾT THÀNH MỘT MỨC.
 *
 * Vành đất ngoài lưới lượn quanh `-APRON_DROP`, còn mặt nước nằm ở `WATER_SURFACE_Y`, tức thấp
 * hơn đúng `WATER_DROP_BELOW_PLAIN`. Nên biên độ lượn của vành đất **không phải một lựa chọn mỹ
 * thuật tự do**: lượn sâu quá mực nước là đẻ ra một *vũng nước ma* giữa đồng khô (bất biến (3)
 * của `setting.js`). Trước bản vá, biên độ ấy được viết thẳng là `0,42` (tức ±0,21) — một con số
 * đúng, nhưng đúng **nhờ** một hằng số ở file khác mà nó không hề tham chiếu tới. §1(B) thêm
 * thành phần NGHIÊNG vào cùng chỗ ấy, không ai phải sửa `0,42`, và đất khô của kỷ 8 tụt xuống
 * **0,0288 ô dưới mặt nước**. Đúng hình dạng bài học Phase 7D (*mặt đường phát biểu bằng KHOẢNG
 * CÁCH TỚI MẶT ĐẤT, không bằng một độ sáng tuyệt đối*): một lời hứa nói về QUAN HỆ mà viết thành
 * HẰNG SỐ thì gãy trong im lặng ở một phiên khác, do tay một người khác.
 *
 * 0,70 KHÔNG phải một con số mới chọn tay: `0,70 × WATER_DROP_BELOW_PLAIN (0,30) = 0,21`, đúng
 * bằng biên độ mà bản trước đang chạy. Bản vá này **không đổi thế giới**, nó chỉ nói ra cái quan
 * hệ vốn đã ngầm ở đó — và từ nay hạ `WATER_DROP_BELOW_PLAIN` sẽ tự kéo vành đất nông theo, thay
 * vì lặng lẽ mở một vũng nước ma.
 */
const ROLL_HEADROOM_SHARE = 0.70;

/**
 * Biên độ lượn **XUỐNG** của đồng bằng mở quanh `-APRON_DROP`. Đây là vế bị MẶT NƯỚC chặn.
 */
export function bienDoRollNgoai() {
  return ROLL_HEADROOM_SHARE * WATER_DROP_BELOW_PLAIN;
}

/**
 * Biên độ lượn **LÊN** của đồng bằng mở — rộng hơn, và đó không phải một sự nới tay.
 *
 * ⚠️ 2026-08-21. Cái trần 0,21 tồn tại vì MỘT lý do duy nhất: đất khô không được chui xuống dưới
 * mặt nước. Lý do ấy **chỉ nói về chiều XUỐNG**. Áp nó cho cả chiều LÊN là đúng cái bẫy Phase 7D
 * ở dạng ngược: một ràng buộc một phía bị viết thành một cái kẹp hai phía, và cái kẹp thừa ấy
 * chính là thứ giữ cho đồng bằng vĩnh viễn nằm dưới nền phố — tức giữ cho cái bệ tồn tại.
 *
 * Con số là một QUAN HỆ, không phải một lựa chọn: `xuống + APRON_DROP`. Cộng lại thì đỉnh gợn cao
 * nhất của đồng bằng nằm CAO HƠN nền phố đúng bằng mức nó lượn xuống dưới mức trung bình của chính
 * nó ⇒ phân bố của đồng bằng đối xứng quanh **nền phố**, không phải quanh một mức thấp hơn. Đó là
 * phát biểu bằng số của câu *"thành phố NẰM TRONG đồng bằng, không NGỒI TRÊN nó"*.
 */
export function bienDoRollLen() {
  return bienDoRollNgoai() + APRON_DROP;
}

/**
 * Nén một độ lệch thô về trong biên độ cho phép — **BÃO HOÀ, KHÔNG KẸP**, và **KHÔNG ĐỐI XỨNG**.
 *
 * Hai biên độ khác nhau cho hai chiều (`bienDoRollNgoai` xuống · `bienDoRollLen` lên) vì chỉ
 * chiều xuống mới bị mặt nước chặn. Vẫn ĐƠN ĐIỆU NGẶT trên cả trục, và đạo hàm ở 0 bằng 1 ở cả
 * hai phía nên không có chỗ gãy ở gốc.
 *
 * Kẹp (`Math.min/max`) thì mọi kỷ nghiêng mạnh đều dồn về đúng một giá trị, tức xoá mất thứ tự
 * giữa chúng — đúng bài học Phase 7D (*"KẸP thì phá thứ tự, ĐẨY thì không"*) và Phase 9B (*phép
 * đẩy phải có cả sàn lẫn trần mà vẫn đơn điệu ngặt*). `tanh` gần như là phép đồng nhất ở vùng
 * lệch nhỏ (phần lớn mặt đất KHÔNG đổi một chút nào) và tiệm cận biên ở vùng lệch lớn, nên nó vừa
 * giữ nguyên thứ tự vừa không bao giờ chạm mặt nước.
 */
export function nenRoll(tho, xuong = bienDoRollNgoai(), len = bienDoRollLen()) {
  const bienDo = tho >= 0 ? len : xuong;
  if (!(bienDo > 0)) return 0;
  return bienDo * Math.tanh(tho / bienDo);
}

/**
 * TRƯỜNG THÔ — hình dạng trước khi chia bậc: `shape` áp lên bốn thành phần (nhiễu, `edge`, `slope`,
 * `wave`). Trả về mảng chưa căng, chưa chia bậc.
 *
 * ⚠️ TỒN TẠI VÌ **MỘT LUẬT CHỈ ĐƯỢC CÓ MỘT CÔNG THỨC**. `buildTerrain` cần nó với nhiễu thật;
 * `geometricTemplate` cần đúng nó với nhiễu GIỮ NGUYÊN MỘT GIÁ TRỊ, để tách xem trong hình dạng
 * cuối cùng có bao nhiêu phần là "hình mà kỷ này khai" và bao nhiêu phần là gợn ngẫu nhiên. Nếu
 * hai bên tự dựng lấy `edge`/`slope`/`wave` thì chúng sẽ lệch nhau ở biên và phép đo sẽ đo một
 * thế giới khác với thế giới được vẽ ra — đúng loại lỗi đã cắn ở `sweep-score.mjs` (Phase 4G).
 *
 * @param {(edge:number, trien:number, swell:number, wave:number) => number} shape
 * @param {number} size
 * @param {(x:number, y:number) => number} nhieu  nguồn nhiễu 0..1 (dùng để BẺ CONG toạ độ)
 * @param {object} profile  hồ sơ kỷ — cần `drain` (hướng thấp) và `tilt` (nghiêng bao nhiêu)
 */
function truongTho(shape, size, nhieu, profile) {
  const drain = profile?.drain ?? 'nam';
  const tilt = Math.min(1, Math.max(0, profile?.tilt ?? 0.3));
  const raw = new Float64Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // ⚠️ NHIỄU ĐI VÀO ĐÂY — VÀO **TOẠ ĐỘ**, KHÔNG VÀO CAO ĐỘ. Lấy mẫu hình học ở một chỗ hơi
      // lệch đi thì level set bị bẻ cong; cộng nhiễu vào kết quả thì level set bị XÉ VỤN. Cùng
      // một hạt nhiễu, hai kết quả khác hẳn nhau — xem khối chú thích của `SHAPES`.
      const wx = (nhieu(x, y) - 0.5) * WARP_CELLS;
      const wy = (nhieu(x + 37.5, y + 91.25) - 0.5) * WARP_CELLS;
      const px = x + wx;
      const py = y + wy;
      const edge = edgeAt(px, py, size);
      const trien = trienAt(px, py, size, drain);
      const hinh = shape(edge, trien, swellAt(px, py), duneAt(px, py, size, drain));
      // TRIỀN LUÔN CÓ MẶT, ở mọi kỷ. Đây là thứ giữ cho không kỷ nào còn là nhiễu không lý do —
      // kể cả kỷ khai `ridge` hay `valley` (một cái gò ngoài đời cũng nằm trên một sườn nghiêng).
      raw[y * size + x] = hinh * (1 - tilt) + trien * tilt;
    }
  }
  return raw;
}

/**
 * KHUÔN HÌNH HỌC của một kỷ — chính `truongTho` nhưng nhiễu bị giữ ở HẰNG SỐ 0,5.
 *
 * Đây là "hình mà kỷ này khai": gò, lòng chảo, bờ dốc, sóng cát — không có một hạt nhiễu nào. So
 * trường cao độ thật với khuôn này cho biết bao nhiêu phần hình dạng là CÓ NGUYÊN NHÂN và bao
 * nhiêu phần là gợn ngẫu nhiên. Chỉ dùng để ĐO (`scripts/terrain-score.mjs`); `buildTerrain` không
 * gọi nó, nên nó không thể làm đổi một điểm ảnh nào.
 *
 * ⚠️ Giá trị trả về chỉ có nghĩa **sai khác một phép biến đổi affine** (nhiễu hằng 0,5 để lại một
 * số cộng thêm, và các hàm `SHAPES` có hệ số nhân riêng). Vì vậy phép so PHẢI khớp bình phương bé
 * nhất `a·khuôn + c`, đừng so thẳng từng con số.
 */
export function geometricTemplate({ era, gridSize = 12 } = {}) {
  const profile = eraTerrainProfile(era);
  const size = Math.max(1, Math.round(Number.isFinite(gridSize) ? gridSize : 12));
  const shape = SHAPES[profile.shape] ?? SHAPES.plain;
  return { field: truongTho(shape, size, () => 0.5, profile), size, profile };
}

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

  const heights = new Float64Array(size * size);
  let maxHeight = 0;

  // ── LƯỢT 1: trường thô ────────────────────────────────────────────────────
  const raw = truongTho(shape, size, (x, y) => valueNoise(seed, x / NOISE_CELL, y / NOISE_CELL), profile);
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of raw) { if (v < lo) lo = v; if (v > hi) hi = v; }

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
   * ⚠️ DÙNG `roadCellCandidates(era)` — DANH SÁCH ỨNG VIÊN, KHÔNG PHẢI MẠNG ĐANG HIỆN. Đây là điều
   * kiện sống còn của ADR-007: mạng đang hiện đổi theo `sessionCount` (công trình chiếm chỗ thì ô
   * đường bị bỏ), nên hỏi nó thì cao độ mặt đất sẽ nhúc nhích mỗi lần Đàm xây thêm một căn nhà.
   * Danh sách ứng viên chỉ phụ thuộc `era` và là TẬP CHA của mọi mạng đã hiện — đặt luật lên nó là
   * một lời hứa chặt hơn. Có test khoá cả hai vế ở `cityLayout.test.js`.
   * ⚠️ TRUYỀN `era` VÀO (Phase 20): từ khi bộ xương sinh theo kỷ, gọi thiếu tham số sẽ lấy mạng
   * đường của kỷ 1 cho MỌI kỷ — mặt đất sẽ được san phẳng dọc những con đường KHÔNG TỒN TẠI ở kỷ
   * đang xem, và đường thật thì gồ ghề. Không có gì đỏ lên, ảnh vẫn dựng ra bình thường.
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
    for (const cell of roadCellCandidates(era)) {
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

  // Hoành/tung dùng chung cho triền thoát nước — hoisted ra khỏi vòng lấy mẫu vì `nenKho` được
  // hỏi cho TỪNG ĐỈNH của cả hai tấm lưới (hàng chục nghìn lần mỗi lần dựng cảnh).
  const dCanh = size > 1 ? size - 1 : 1;
  const huongThap = HUONG_THAP[profile.drain] ?? HUONG_THAP.nam;

  /**
   * ĐỒNG BẰNG MỞ — cao độ đất KHÔ ở vùng ngoài, tại **bất kỳ đâu** trên thế giới.
   *
   * ⚠️ ĐÂY LÀ THỨ THAY THẾ HẰNG SỐ `-APRON_DROP` (2026-08-21). Trước bản vá, mọi thứ ra khỏi
   * `PLATE_PAD_CELLS` đều bằng đúng một con số, và tấm chân trời cũng bắt đầu từ đúng con số ấy —
   * nên quanh thành phố có một vành **phẳng tuyệt đối rộng 5,7 ô** (từ 8,9 ra tới chỗ núi bắt
   * đầu). Một mặt bàn đứng giữa một sàn nhà: đó là toàn bộ cái bệ mà Đàm nhìn thấy, và không phép
   * đo "có gián đoạn không" nào thấy được nó, vì **không hề có gián đoạn** — cả hai bên đều phẳng.
   *
   * Hai tần số, có chủ đích: tầng thô (cỡ ô 3,4) cho mảng đồi thoải, tầng mịn (cỡ ô 1,55) cho gợn
   * ruộng. Một tầng duy nhất thì đồng bằng ra một hàm sin, mắt đọc ngay là nhân tạo.
   *
   * `nghieng` là TRIỀN THOÁT NƯỚC — cùng hàm `HUONG_THAP` mà trong lưới dùng, nên bên cao vẫn cao
   * và bên thấp vẫn thấp khi đi ra khỏi phố. KHÔNG kẹp 0..1: ngoài lưới thì triền phải TIẾP TỤC.
   *
   * `nenRoll` bão hoà (không kẹp) nên tổng bao nhiêu cũng không bao giờ chui xuống dưới mặt nước —
   * và nó bão hoà KHÔNG ĐỐI XỨNG: xuống bị mặt nước chặn, lên thì không. Xem `bienDoRollLen`.
   */
  function dongBangKho(u, v) {
    const nghieng = (huongThap(u / dCanh, v / dCanh) - 0.5) * OUTER_TILT * (profile.tilt ?? 0);
    const tho = (valueNoise(`${seed}|roll`, u / 3.4, v / 3.4) - 0.5) * 0.30;
    const min = (valueNoise(`${seed}|roll2`, u / 1.55, v / 1.55) - 0.5) * 0.16;
    return -APRON_DROP + nenRoll(nghieng + tho + min);
  }

  /**
   * BỀ RỘNG DẢI HOÀ tại một điểm — rộng hẹp thất thường theo một tầng nhiễu RẤT thô.
   *
   * ⚠️ ĐÂY LÀ CÂU TRẢ LỜI CHO *"ranh giới vùng bằng TUYỆT ĐỐI KHÔNG được trùng ranh giới lưới"*.
   * Cỡ ô 9 (gần bằng cả cạnh lưới) ⇒ chỉ một hai bướu cho toàn thế giới ⇒ đồng bằng ăn sát chân
   * phố ở hướng này và chạy ra xa mười hai ô ở hướng kia. Nhiễu MỊN ở đây thì vô dụng: nó chỉ làm
   * răng cưa một đường tròn, mà mắt vẫn đọc ra đường tròn ấy.
   */
  function beRongHoa(u, v) {
    const n = valueNoise(`${seed}|dongbang`, u / 9, v / 9);
    return Math.max(0.5, APRON_CELLS * (1 + (n - 0.5) * 2 * APRON_SPREAD));
  }

  /** Điểm này có nằm trong lưới 12×12 (kể cả nửa ô mép) không. */
  function trongLuoi(u, v) {
    return u >= -0.5 && u <= size - 0.5 && v >= -0.5 && v <= size - 0.5;
  }

  /**
   * MẶT ĐẤT KHÔ ở bất kỳ đâu — **MỘT MẶT LIÊN TỤC DUY NHẤT**, chưa khoét lòng nước.
   *
   * ⚠️ HÀM NÀY LÀ NỀN CHUNG CỦA **CẢ HAI** TẤM LƯỚI. `terrainMesh` hỏi nó qua `surfaceHeightAt`;
   * `horizon.heightAt` cũng hỏi đúng nó rồi mới cộng núi lên trên. Vì vậy chỗ giáp ở 9,5 khớp
   * nhau **theo cấu tạo**, ở mọi hướng, mà không bên nào phải phẳng — đó chính là lời hứa thật của
   * Phase 9A (hai cái nêm sáng), được phát biểu lại thành một QUAN HỆ thay vì một MỨC.
   *
   * Ba việc, và không việc nào tạo ra một bán kính để mắt bám vào:
   *   1. **TRONG lưới**: y hệt `smoothHeightAt` — không đổi một chữ số. ADR-007 nguyên vẹn, nhà
   *      vẫn đứng đúng cao độ `heights[]` mà `footprint` trả về.
   *   2. **HOÀ** từ nền phố sang đồng bằng mở trên một dải rộng **2,85 … 12,15 ô** tuỳ hướng
   *      (`beRongHoa`). `smoothstep` có đạo hàm 0 ở hai đầu ⇒ đất RỜI nền phố với độ dốc thêm
   *      bằng 0, tức không có mép nào để nhìn thấy.
   *   3. **ĐỒNG BẰNG MỞ** gợn liên tục ra tới tận chân núi — không còn vành phẳng nào.
   */
  function nenKho(u, v) {
    const cu = Math.min(size - 0.5, Math.max(-0.5, u));
    const cv = Math.min(size - 0.5, Math.max(-0.5, v));
    const nenPho = smoothHeightAt(cu, cv);
    // ⚠️ KHOẢNG CÁCH **BO TRÒN**, KHÔNG PHẢI CHEBYSHEV. `Math.max(|du|, |dv|)` là khoảng cách tới
    // một hình VUÔNG, nên mọi đường đồng mức quanh thành phố đều là hình vuông và mắt đọc ra một
    // cái khay. Đo bằng 720 tia: tỉ số bán kính CHÉO/TRỤC ra **1,341** trong khi hình vuông hoàn
    // hảo là `√2 = 1,414` — tức 95% là một cái khay. `hypot` cho bốn góc bo tròn tự nhiên.
    const outside = Math.hypot(u - cu, v - cv);
    if (outside <= 0) return nenPho;
    const t = smoothstep(Math.min(1, outside / beRongHoa(u, v)));
    return lerp(nenPho, dongBangKho(u, v), t);
  }

  /**
   * Cao độ mặt đất mà tầng vẽ hỏi cho từng đỉnh — `nenKho` cộng phép khoét lòng nước.
   *
   * ⚠️ PHÉP KHOÉT CHỈ CÓ MẶT Ở VÙNG NGOÀI LƯỚI, và đó là một sự thật chứ không phải một lời hứa.
   * Bảng khai `reach ≥ SHORE_BAND` ở mọi kỷ và mép bờ gần chỉ được lượn RA XA, nên độ trộn luôn
   * bằng 0 trong lưới; nhưng "luôn bằng 0" là một lời hứa, còn "không có mặt trong hàm" thì không
   * thể hỏng. Xem chú thích của `khoetLongNuoc`.
   */
  function surfaceHeightAt(u, v) {
    const kho = nenKho(u, v);
    if (trongLuoi(u, v)) return kho;
    return khoetLongNuoc(u, v, kho);
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
    // ⚠️ `nenKho` TRẢ RA CHO `horizon.js`, VÀ ĐÓ LÀ CẢ BẢN VÁ "XOÁ CÁI BỆ" GÓI TRONG MỘT DÒNG.
    // Tấm chân trời trước đây bắt đầu từ hằng số `-APRON_DROP`; nay nó bắt đầu từ ĐÚNG cao độ đất
    // thật tại chỗ giáp, khác nhau theo từng hướng. Hai tấm vì thế khớp nhau theo cấu tạo, và
    // không còn cái vành phẳng nào để mắt đọc ra mép bàn. Đây là `surfaceHeightAt` CHƯA khoét lòng
    // nước — bên kia tự khoét bằng cùng một hàm `setting.hazXuongDay`, nếu trả ra bản đã khoét thì
    // nó bị khoét HAI lần và hai tấm lệch nhau ở đúng chỗ có nước.
    nenKho,
    // Trả ra chứ không bắt tầng vẽ tự `buildSetting` lần nữa: hai lần dựng là hai cơ hội để một bên
    // truyền `gridSize` khác bên kia, và triệu chứng sẽ là tấm nước lệch khỏi lòng nước vài phần
    // mười ô — đúng loại lỗi im lặng mà "một luật một công thức" sinh ra để chặn.
    setting,
  };
}
