/**
 * blockStyle.js — HÌNH THÁI KHU PHỐ: **một ô lưới không phải MỘT căn nhà, nó là MỘT KHU PHỐ.**
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ── VẤN ĐỀ NÀY SINH RA TỪ ĐÂU ────────────────────────────────────────────────────────────────
 * Đàm nhìn thành phố và nói: *"mọi thứ hiện tại trông vẫn nhỏ, thành phố không mở rộng mà chỉ là
 * cụm nhỏ"*. Đo ra thì lời ấy đúng từng chữ, và con số chỉ đúng chỗ hỏng:
 *
 *   · `ROAD_LINES = {0, 4, 8, 11}` ⇒ 4×12 + 4×12 − 16 = **80 trong 144 ô là ĐƯỜNG (55,6%)**.
 *   · 45 ô nữa thuộc năm khu landmark (chỉ 5 ô trong đó thật sự có công trình đứng).
 *   · Còn lại đúng **30 ô** cho nhà dân — và cả 15 kỷ đã chạm trần ấy từ lâu.
 *
 * ⇒ Thứ Đàm nhìn thấy là **~30 căn nhà rải trên một mạng đường phủ hơn nửa mặt đất.** Không phải
 * lỗi mỹ thuật của căn nhà; là lỗi ĐƠN VỊ: một ô đang được đọc thành một căn nhà.
 *
 * ── VÌ SAO KHÔNG THÊM NHÀ, MÀ CHIA NHỎ ───────────────────────────────────────────────────────
 * Chỉ thị ban đầu là *"cho mỗi ô một CỤM 4–10 căn nhà nhỏ nối nhau"*. Luật của dự án bắt ĐO TRẦN
 * trước khi tiêu ngân sách cho một phase nội dung, và phép đo ấy đã bác bỏ cơ chế THÊM:
 *
 *   | kỷ | hình chiếu TB của MỘT căn (ô²) | % ô đã bị chiếm | ô² còn trống |
 *   |----|------|--------|-------|
 *   | 1  | 0,639 | 63,9%  | 0,361 |
 *   | 6  | 2,424 | 242,4% | 0,000 |
 *   | TB 15 kỷ | 1,456 | **145,6%** | **0,000** |
 *
 * **12/15 kỷ đã không còn một ô² trống nào** — một căn nhà dân hôm nay đã TRÀN sang ô bên cạnh.
 * Thêm 4–10 căn nữa vào đó là điều không thể; đúng hình dạng `TECH_DEBT #71`, ở cỡ nhà dân.
 *
 * Nhưng **ĐÍCH** của chỉ thị (120–300 khối nhìn thấy được mỗi kỷ) thì đạt được bằng cơ chế NGƯỢC
 * LẠI: **chia nhỏ chính cái hình chiếu đã có**. 30 ô × 4–10 đơn vị = 120–300 — trùng khít con số
 * chỉ thị đưa ra, mà **không tốn một ô² đất nào**, không đụng kỳ quan, không đụng ADR-007.
 *
 * Và nó đổi **ĐƯỜNG VIỀN** chứ không phải bề mặt: một khối trơn → sáu nóc nhà răng cưa. Đó đúng
 * loại chi tiết SỐNG SÓT ở xa (đã đo ở Phase 11: lan can kỷ 7 đổi 8,4% khung hình · ngói bò kỷ 8
 * chỉ 1,2% dù tốn nhiều hình học nhất bảng).
 *
 * ⚠️ CHIA NHỎ MÀ KHÔNG NÂNG CAO THÌ THÀNH PHỐ CÒN TRÔNG NHỎ HƠN. Sáu căn nhà thấp thay cho một
 * căn nhà thấp là sáu cái lều. Ngoài đời một dãy sáu nhà phố rộng đúng bằng một biệt thự, nhưng
 * mỗi căn CAO ba tầng — đó mới là thứ đọc ra "thành phố". Vì vậy `storey` (hệ số chiều cao) là
 * một cột BẮT BUỘC của bảng này, không phải một tuỳ chọn.
 *
 * ── BA LỚP, LẦN THỨ CHÍN ─────────────────────────────────────────────────────────────────────
 * Cùng khuôn đã dùng cho `vernacularRoof` · `floraStyle` · `streetStyle` · `groundFloorStyle` ·
 * `roofStyle` · `settingStyle` · `hinterlandStyle`:
 *
 *   BẢNG (file này)  →  HÌNH (`block.js`)  →  NGƯỜI ĐỌC (`cityParts.js`, chỉ ĐỌC)
 *
 * Mỗi dòng phải trả lời được *"khu dân cư ở nước ấy, thời ấy, xếp nhà thế nào?"* — và `country`
 * bị KHOÁ CỨNG vào `eraStyle.js` bằng test. Không có ràng buộc ấy thì 15 dòng là 15 lần chọn bừa,
 * mà chọn bừa chính là thứ đã sinh ra 15 kỷ nhà giống hệt nhau (bài học Phase 5B).
 *
 * ⚠️ `isValidBlockStyle` **TỪ CHỐI THẲNG** dòng sai, KHÔNG tự chữa. Tự chữa là cách một bảng 15
 * dòng lặng lẽ thoái hoá về 1 dòng — đúng bẫy `MIN_STONE` (Phase 9D) và ADR-026.
 */

import { unit, signed } from '../hashId.js';
import { BUILDING_SCALE } from './parts.js';
import { CELL_PIXELS, EYE_PIXELS } from './streetStyle.js';
import { ROOFTOP_MIN_SPAN } from './rooftop.js';

/** Ba cách một khu phố xếp nhà. Đóng — thêm giá trị mới phải sửa cả `block.js`. */
export const BLOCK_ATTACH = ['party', 'loose', 'court'];

/**
 * BỀ NGANG NHỎ NHẤT một đơn vị được phép có, đo bằng Ô LƯỚI.
 *
 * ⚠️ SUY RA TỪ BA CON SỐ ĐÃ HIỆU CHUẨN, KHÔNG PHẢI MỘT NGƯỠNG MỚI CHỌN TAY. Cắm một con số mới ở
 * đây là tạo một ngưỡng CHƯA HIỆU CHUẨN — đúng cái phễu Phase 9A.
 *
 *   (a) **Mắt còn đọc ra là một CĂN NHÀ**: `CELL_PIXELS = 64` (một ô lưới chiếm bao nhiêu điểm ảnh
 *       ở khung mặc định) × `EYE_PIXELS = 4` (hẹp hơn thế thì không còn là một chi tiết), cả hai đo
 *       được ở Phase 9D. Ba lần `EYE_PIXELS` = 12 điểm ảnh ⇒ **0,1875 ô**.
 *   (b) **Mái còn đội được thứ Phase 11 đã dựng**: `ROOFTOP_MIN_SPAN = 0,24` (đơn vị mô tả) là mức
 *       mà `rooftop.js` TỪ CHỐI THẲNG — hẹp hơn thì ống khói / bồn nước / cửa sổ mái thành vệt bẩn.
 *       Quy sang ô: 0,24 × `BUILDING_SCALE` = **0,312 ô**.
 *
 * ⚠️ VẾ (b) THÊM VÀO SAU, VÀ NÓ ĐƯỢC THÊM VÌ MỘT BÀI TEST ĐỎ, KHÔNG VÌ MỘT LÝ LẼ. Bản đầu của
 * phase này chỉ có vế (a); đo ra thì **13/15 kỷ mất SẠCH chi tiết mái ở nhà dân** (kỷ 1: 17 → 0),
 * tức là nó lặng lẽ xoá đúng thứ Phase 11 tiêu 110.076 tam giác để dựng. Không một cảnh báo nào:
 * `emitRooftop` từ chối ĐÚNG, `buildBlockSpec` dựng ĐÚNG, và cả 13 kỷ mất chi tiết trong im lặng —
 * đúng bài học Phase 10 Bước 2 (*"từ chối thẳng chỉ an toàn khi có người ĐẾM SỐ LẦN TỪ CHỐI"*).
 * Thứ bắt được là `rooftop.test.js` (*"kỷ 1: chỉ 0 nhà dân có mái — quần thể sai hình dạng"*).
 *
 * ⇒ Lấy MAX của hai vế: một đơn vị phải vừa đọc ra được là căn nhà, vừa đội được cái mái của nó.
 */
export const MIN_UNIT_CELLS = Math.max(
  (3 * EYE_PIXELS) / CELL_PIXELS,
  ROOFTOP_MIN_SPAN * BUILDING_SCALE,
);

/** Số đơn vị nhỏ nhất / lớn nhất một khu phố được phép có. Ngoài dải này thì bảng bị TỪ CHỐI. */
export const MIN_UNITS = 4;
export const MAX_UNITS = 10;

/**
 * TRẦN ĐỘ PHỦ THỬA — phần diện tích thửa được phép có NHÀ ĐỨNG TRÊN. Phần còn lại là sân, vườn,
 * ngõ cụt, đất trống; nó KHÔNG được biến thành nhà.
 *
 * ⚠️ SINH RA TỪ MỘT CÂU CỦA ĐÀM, VÀ TỪ MỘT PHÉP ĐO ĐI KÈM (Phase 22):
 *     «nhà nó san sát nhau một cách khó hiểu và không giống thực tế, rất phi logic»
 * Đo độ phủ thật của 371 ô nhà dân trước khi sửa (`deriveBlockUnits`, 15 kỷ, 120 phiên):
 *
 *   kỷ 1 **96,0%** · 9 **94,1%** · 10 92,2% · 2 · 5 · 8 · 14 **90,2–90,3%** · 3 · 7 88,4% ·
 *   13 86,5% · 11 84,6% · 15 82,8% · 12 82,6% · 4 78,1% · 6 54,8%  ⇒ **trung vị 88,4%**
 *
 * Tức nhìn từ trên xuống thì 13/15 kỷ là một MẢNG MÁI LIỀN: mắt không thấy một tấc đất nào giữa
 * các căn. Lời của Đàm không phải cảm giác — nó là 88,4%.
 *
 * ⚠️ ĐÂY LÀ MỘT CÁI TRẦN, KHÔNG PHẢI MỘT ĐÍCH. `deriveBlockUnits` chỉ thu nhỏ khi độ phủ THẬT
 * vượt con số này, và phép thu nhỏ **dừng lại ở `MIN_UNIT_CELLS`** — vì một căn nhà hẹp hơn thế
 * thì mắt thôi đọc ra nó là nhà (vế a) và cái mái thôi đội được chi tiết Phase 11 (vế b). Nói
 * cách khác: **SÀN ĐỌC-ĐƯỢC THẮNG TRẦN ĐỘ PHỦ**, và đó là chủ đích — thà thấy bốn căn nhà thật
 * trên một mảnh đất hơi chật còn hơn tám vệt bẩn trên một mảnh đất rộng.
 *
 * ⇒ Hệ quả phải nói thẳng ra, không được giấu sau con số trong bảng: ở những kỷ có thửa nhỏ, độ
 * phủ ĐẠT ĐƯỢC sẽ cao hơn con số khai. Kỷ 6 khai 0,22 (làng Bắc Bộ) nhưng sàn đọc-được chặn nó
 * ở ~0,31; kỷ 1 khai 0,45 và sàn chặn ở ~0,46. `blockStyle.test.js` ĐẾM danh sách kỷ bị sàn
 * chặn, thay vì để nó im lặng.
 */
export const MAX_COVERAGE = 0.7;

/**
 * TRẦN HỆ SỐ CHIỀU CAO của một đơn vị khu phố.
 *
 * ⚠️ **NÂNG 2,0 → 2,4 Ở PHASE 22, VÀ ĐÓ LÀ HỆ QUẢ TRỰC TIẾP CỦA `MAX_COVERAGE` — KHÔNG PHẢI MỘT
 * LẦN NỚI NGƯỠNG CHO TIỆN.** Lý do của cái trần cũ ghi rõ trong mã: *"cao hơn thế thì nhà dân bắt
 * đầu tranh chấp hình bóng với kỳ quan, mà kỳ quan là điểm tựa thị giác của cả kỷ"*. Lý do ấy nói
 * về một **QUAN HỆ** (nhà dân phải thấp hơn kỳ quan), còn con số 2,0 là một **MỨC** — đúng cái bẫy
 * Phase 7D, và nó gãy ngay khi mặt bằng nhà dân co lại.
 *
 * Đo quan hệ thật (nhà dân cao nhất ÷ kỳ quan cao nhất, 15 kỷ, 80 phiên, cấp 3), trước Phase 22:
 * **0,484 … 0,745** (thấp nhất kỷ 1, cao nhất kỷ 5). Tức cái trần 2,0 đang chặn ở một chỗ còn xa
 * mới chạm tới quan hệ mà nó nói là đang bảo vệ.
 *
 * Và việc nâng nó là BẮT BUỘC chứ không phải tuỳ chọn: trần độ phủ thu mặt bằng lại, mà chóp mái
 * thì cao theo bề ngang mái (`pitch = roofPitch × max(w, d)`), nên thu mặt bằng là hạ chiều cao.
 * Không nâng `storey` bù lại thì Phase 22 sẽ làm thành phố THẤP ĐI — đúng cách hỏng mà cả ADR-052
 * sinh ra để ngăn, và là điều Đàm phàn nàn ở phase trước ("thành phố trông vẫn nhỏ").
 *
 * ⇒ Đây cũng chính là phép đánh đổi mà quy hoạch đô thị thật đã dùng cả trăm năm: **ít đất hơn
 * thì đổi lấy cao hơn** (luật giật cấp New York 1916, hệ số sử dụng đất của mikrorayon). Bảng này
 * nay khai cả hai vế của phép đổi ấy trên cùng một dòng.
 */
export const MAX_STOREY = 2.4;

/**
 * BẢNG 15 KỶ. Mỗi dòng buộc vào `country` mà `eraStyle.js` khai, và `note` phải kể được một khu
 * dân cư CÓ THẬT — nếu không viết ra được thì con số ấy là tuỳ hứng.
 *
 * · `cols`/`rows` — chia mặt bằng khu phố thành lưới bấy nhiêu đơn vị (`cols` theo trục mặt phố).
 * · `attach`      — `party` chung tường · `loose` rời có sân · `court` quây quanh sân trong.
 * · `alley`       — khe giữa hai đơn vị, tính theo TỈ LỆ bước lưới (0 = dính liền tuyệt đối).
 * · `storey`      — hệ số chiều cao đơn vị so với căn nhà đơn hôm nay.
 * · `vary`        — biên độ chênh CAO giữa các đơn vị (0 = đều tăm tắp như luật quy hoạch bắt).
 * · `gableToStreet` — quay đầu hồi ra mặt phố (chỉ có nghĩa với kỷ lợp mái dốc).
 *
 * ── BỐN CỘT THÊM Ở PHASE 22 ──────────────────────────────────────────────────────────────────
 * · `coverage`  — TRẦN độ phủ thửa (xem `MAX_COVERAGE`). Phần dôi ra là sân/vườn/đất trống.
 * · `setFront` / `setBack` — khoảng lùi MẶT PHỐ / SAU, tính theo TỈ LỆ chiều sâu thửa.
 * · `setSide`   — khoảng lùi HÔNG mỗi bên, tính theo TỈ LỆ bề ngang thửa.
 * · `setJitter` — khoảng lùi LỆCH NHAU bao nhiêu theo hạt giống (0 = cả dãy lùi đều tăm tắp).
 * · `sizeVary`  — biên độ chênh CỠ MẶT BẰNG giữa các đơn vị (0 = mọi căn trùng khít nhau).
 *
 * ⚠️ VÌ SAO KHOẢNG LÙI PHẢI LÀ **BA** SỐ CHỨ KHÔNG PHẢI MỘT. Ngoài đời ba mặt của một mảnh đất
 * chịu ba luật khác hẳn nhau: mặt phố do quy chế đô thị định (Haussmann bắt xây SÁT chỉ giới,
 * nhà vườn Bắc Bộ lùi hẳn sau cái sân phơi), mặt sau là chỗ riêng tư (vườn rau, giếng, chuồng),
 * còn hông là chuyện phòng cháy và thoát nước mái. Gộp ba thứ ấy vào một con số là lần thứ TÁM
 * của bẫy *"một trường gánh hai việc"* — và ở đây nó sẽ xoá đúng thứ Đàm đang đòi, vì cái duy
 * nhất mắt đọc ra ở góc nhìn từ trên xuống là **đất ở HÔNG giữa hai căn**.
 *
 * ⚠️ `setFront` LÀ MẶT PHỐ THẬT, KHÔNG PHẢI "PHÍA −z CỦA LƯỚI". Từ Phase 22 mỗi khu phố được XOAY
 * cho hàng 0 quay ra con đường gần nhất (`dwellingFacing` ở `dwellings.js`), nên hàng 0 luôn là
 * hàng giáp phố ở mọi kỷ, mọi ô. Trước đó hướng nhà là một bội số 90° băm từ toạ độ ô, tức mặt
 * tiền quay ra đường chỉ do may rủi.
 */
export const BLOCK_STYLES = {
  1: {
    country: 'Thổ Nhĩ Kỳ',
    cols: 2, rows: 2, attach: 'loose', alley: 0.06, storey: 2.4, vary: 0.3, gableToStreet: false,
    coverage: 0.62, setFront: 0.1, setBack: 0.1, setSide: 0.07, setJitter: 0.85, sizeVary: 0.3,
    // ⚠️ ĐỔI TỪ `party` SANG `loose` Ở PHASE 22, và nó KHÔNG mâu thuẫn với Çatalhöyük. Nhà ở đây
    // đúng là dính liền nhau — nhưng chúng dính thành từng CỤM, và giữa các cụm là những khoảng
    // hở chất phế thải (midden) mà báo cáo khai quật mô tả là sân lộ thiên dùng chung. Một ô lưới
    // của ta là một cụm như thế, nên thứ đúng để dựng là "vài nếp nhà quây sát nhau giữa một
    // khoảng sân rác", không phải một tấm bê tông kín ô. Độ phủ cũ 96,0% là tấm bê tông ấy.
    note: 'Çatalhöyük — cụm nhà quây sát quanh sân rác lộ thiên, lên xuống bằng lỗ trên mái',
  },
  2: {
    country: 'Ai Cập',
    cols: 4, rows: 2, attach: 'loose', alley: 0.1, storey: 2.24, vary: 0.16, gableToStreet: false,
    coverage: 0.66, setFront: 0.06, setBack: 0.12, setSide: 0.05, setJitter: 0.4, sizeVary: 0.16,
    // Deir el-Medina là làng thợ do NHÀ NƯỚC dựng cho thợ đục lăng mộ: hai dãy thẳng băng nhìn
    // nhau qua một con phố duy nhất, nhà nào cũng dài và hẹp như nhau. Vì thế 4 x 2 (bốn suất dọc
    // phố, hai dãy đối nhau) và `vary` nhóm thấp — nhà nước xây một lượt thì không có chuyện nhà
    // cao nhà thấp. ⚠️ `setBack` gấp đôi `setFront`: mặt bằng đã khai quật cho thấy sân sau (bếp,
    // hầm, cầu thang lên mái) chiếm phần cuối mỗi suất đất.
    note: 'Deir el-Medina — làng thợ nhà nước dựng: hai dãy thẳng, nhà dài hẹp, sân sau có bếp',
  },
  3: {
    country: 'Iraq',
    cols: 3, rows: 3, attach: 'court', alley: 0.1, storey: 1.34, vary: 0.2, gableToStreet: false,
    coverage: 0.55, setFront: 0.05, setBack: 0.05, setSide: 0.05, setJitter: 0.45, sizeVary: 0.2,
    // ⚠️ NAY LÀ `court` — và đó là chép đúng cái tên vốn đã nằm trong `note` cũ. Nhà ở khu AH thành
    // Ur là NHÀ SÂN TRONG theo nghĩa đen: tường ngoài kín mít, mọi phòng mở vào một cái sân lát
    // gạch ở giữa. Khai `party` rồi mô tả "nhà sân trong" là bảng tự nói ngược mình.
    note: 'nhà sân trong thành Ur — tường ngoài kín, mọi phòng mở vào sân lát gạch giữa nhà',
  },
  4: {
    country: 'Trung Quốc',
    cols: 3, rows: 4, attach: 'court', alley: 0.12, storey: 1.44, vary: 0.14, gableToStreet: false,
    coverage: 0.5, setFront: 0.08, setBack: 0.06, setSide: 0.06, setJitter: 0.35, sizeVary: 0.16,
    note: 'tứ hợp viện trong phường có tường — bốn dãy nhà trệt quây một sân, ngõ hutong chen giữa',
  },
  5: {
    country: 'Đức',
    cols: 2, rows: 3, attach: 'loose', alley: 0.09, storey: 2.02, vary: 0.34, gableToStreet: true,
    coverage: 0.62, setFront: 0.04, setBack: 0.14, setSide: 0.04, setJitter: 0.7, sizeVary: 0.26,
    // Nhà khung gỗ quanh quảng trường chợ quay ĐẦU HỒI ra phố, vì thuế thời trung cổ tính theo bề
    // ngang mặt tiền. Cùng lý do ấy làm chúng cao thấp so le — mỗi nhà một chủ, một đời xây.
    // ⚠️ `loose` chứ không `party`: phố Đức trung cổ chừa khe `Zwischenraum` giữa hai đầu hồi để
    // nước mái không dội sang nhà bên và để lửa khỏi lan — hẹp tới mức chỉ lách vừa một người,
    // nhưng nó CÓ, và nó chính là vệt đất mà mắt đọc ra từ trên xuống. Sân sau sâu (`setBack`
    // 0,14) là mảnh `Hofstatt` có chuồng và giếng, thứ nuôi sống cả nhà.
    note: 'nhà khung gỗ quanh quảng trường chợ — đầu hồi ra phố, khe thoát nước giữa hai nhà, sân sau có giếng',
  },
  6: {
    country: 'Việt Nam',
    cols: 2, rows: 2, attach: 'loose', alley: 0.1, storey: 1.5, vary: 0.26, gableToStreet: false,
    coverage: 0.22, setFront: 0.12, setBack: 0.08, setSide: 0.08, setJitter: 0.9, sizeVary: 0.28,
    // ⚠️ ĐỘ PHỦ THẤP NHẤT BẢNG, và đó là điểm phân biệt chứ không phải thiếu sót: nhà ba gian Bắc
    // Bộ đứng LÙI HẲN sau một cái sân gạch phơi thóc — cái sân ấy là công cụ sản xuất, không phải
    // chỗ trống. Sau nhà là vườn rau và ao. Ngăn nhau bằng hàng rào cây chứ không bằng tường gạch.
    note: 'làng Bắc Bộ — nhà ba gian lùi sau sân phơi, vườn và ao phía sau, rào cây thay tường',
  },
  7: {
    country: 'Ý',
    cols: 3, rows: 2, attach: 'party', alley: 0.08, storey: 2.06, vary: 0.36, gableToStreet: false,
    coverage: 0.68, setFront: 0.02, setBack: 0.12, setSide: 0.0, setJitter: 0.3, sizeVary: 0.18,
    // Insula La Mã là chung cư cho thuê cao 4–6 tầng, cao nhất thế giới cổ đại, và cao thấp lộn
    // xộn tới mức Augustus phải ra luật giới hạn chiều cao. `storey` cao nhất bảng thời cổ.
    // ⚠️ `setSide = 0` NHƯNG `setBack = 0,12`: insula xây sát nhau theo mặt phố (đó là định nghĩa
    // của một dãy chung tường), còn phía trong khối là giếng trời / sân sau — chính chỗ Vitruvius
    // gọi là `cavaedium`. Đó là vệt đất chạy giữa hai hàng, và nó là thứ mắt đọc ra từ trên xuống.
    note: 'insula — chung cư cho thuê 4–6 tầng sát mặt phố, giếng trời phía trong, cao thấp lộn xộn',
  },
  8: {
    country: 'Bồ Đào Nha',
    cols: 3, rows: 2, attach: 'party', alley: 0.07, storey: 1.66, vary: 0.24, gableToStreet: true,
    coverage: 0.62, setFront: 0.02, setBack: 0.14, setSide: 0.0, setJitter: 0.3, sizeVary: 0.2,
    note: 'nhà phố Lisboa mặt tiền hẹp — gạch men azulejo, mái dốc, sân sau sau trận động đất 1755',
  },
  9: {
    country: 'Pháp',
    cols: 3, rows: 2, attach: 'party', alley: 0.05, storey: 1.32, vary: 0.06, gableToStreet: false,
    coverage: 0.65, setFront: 0.0, setBack: 0.16, setSide: 0.0, setJitter: 0.08, sizeVary: 0.08,
    // ⚠️ `vary`/`setJitter` NHỎ NHẤT BẢNG, và đó là một sự thật lịch sử chứ không phải sự lười:
    // quy chế Haussmann bắt cả dãy phố cùng chiều cao, cùng cao độ ban công, cùng góc mái mansard,
    // và xây ĐÚNG chỉ giới đường đỏ — nên `setFront` bằng 0 tuyệt đối. Cái sân `cour` nằm ở phía
    // TRONG khối, đó là lý do `setBack` lại lớn nhất trong nhóm nhà phố.
    note: 'nhà phố Haussmann — cả dãy cùng chiều cao theo quy chế, xây sát chỉ giới, sân cour phía trong',
  },
  10: {
    country: 'Anh',
    cols: 4, rows: 2, attach: 'party', alley: 0.06, storey: 1.8, vary: 0.1, gableToStreet: false,
    coverage: 0.7, setFront: 0.02, setBack: 0.1, setSide: 0.0, setJitter: 0.12, sizeVary: 0.1,
    // ⚠️ ĐỘ PHỦ KỊCH TRẦN 0,70 — đây là "lõi công nghiệp", kỷ dày nhất bảng, và nó dày có lý do.
    // ⚠️ VÀ ĐÂY LÀ MỘT NGOẠI LỆ PHẢI NÓI RÕ: terrace "đấu lưng" (back-to-back) thật sự dùng chung
    // CẢ tường hậu, tức `setBack` đáng lẽ bằng 0. Nhưng chính kiểu nhà ấy bị Đạo luật Y tế Công
    // cộng 1875 CẤM vì không thông gió được, và thứ thay thế nó — dãy terrace có sân sau và ngõ
    // dịch vụ — mới là hình ảnh đọng lại của phố công nghiệp Anh. Lấy hình sau, và ghi ra ở đây
    // rằng đó là một lựa chọn chứ không phải một sơ suất.
    note: 'terrace công nghiệp Anh — dãy chung tường bên, sân sau và ngõ dịch vụ sau 1875, ống khói lặp đều',
  },
  11: {
    country: 'Mỹ',
    cols: 4, rows: 2, attach: 'party', alley: 0.08, storey: 1.8, vary: 0.14, gableToStreet: false,
    coverage: 0.7, setFront: 0.05, setBack: 0.13, setSide: 0.0, setJitter: 0.16, sizeVary: 0.12,
    // ⚠️ `setFront` KHÁC 0 dù là nhà phố chung tường: dãy brownstone Manhattan lùi khỏi vỉa hè một
    // quãng để lấy chỗ cho cái bậc thang `stoop` dẫn lên tầng hai — nét nhận dạng của cả kiểu nhà.
    // `setBack` lớn vì giữa hai hàng là ngõ dịch vụ, đúng như `note` cũ đã ghi.
    note: 'dãy brownstone Manhattan — lùi lấy chỗ bậc stoop, ngõ dịch vụ chạy sau lưng',
  },
  12: {
    country: 'Nga',
    cols: 3, rows: 4, attach: 'court', alley: 0.1, storey: 1.5, vary: 0.06, gableToStreet: false,
    coverage: 0.46, setFront: 0.1, setBack: 0.08, setSide: 0.08, setJitter: 0.06, sizeVary: 0.06,
    // ⚠️ KỶ ĐỀU NHẤT BẢNG, CÓ CHỦ ĐÍCH: nhà tập thể lắp ghép từ tấm bê tông đúc sẵn theo một bộ
    // bản vẽ điển hình dùng chung cho cả Liên bang — cả dãy giống nhau tới từng ô cửa sổ là ĐÚNG.
    // Độ phủ thấp cũng đúng: chuẩn quy hoạch mikrorayon dành phần lớn đất cho cây xanh và sân
    // chơi, khối nhà chỉ chiếm một phần nhỏ lô đất.
    note: 'mikrorayon — khối nhà lắp ghép điển hình quây một sân dvor, phần lớn đất là cây xanh',
  },
  13: {
    country: 'Nhật Bản',
    cols: 3, rows: 3, attach: 'court', alley: 0.09, storey: 1.36, vary: 0.22, gableToStreet: false,
    coverage: 0.65, setFront: 0.0, setBack: 0.16, setSide: 0.03, setJitter: 0.3, sizeVary: 0.22,
    // ⚠️ NAY LÀ `court`, VÀ ĐÓ LÀ CHÍNH XÁC HƠN CHỨ KHÔNG PHẢI NỚI TAY. Machiya là "chỗ ngủ của
    // con lươn": mặt tiền hẹp dính sát phố (`setFront` = 0) nhưng thân nhà chạy sâu hun hút, và ở
    // GIỮA thân có một hai cái sân trong `tsuboniwa` lấy sáng, thông gió, thoát nước. Phía cuối
    // là kho `kura` và mảnh vườn sau. Đó đúng là một khu quây sân, chỉ khác là cái sân nằm dọc.
    note: 'machiya — mặt phố hẹp dính sát, thân nhà sâu, sân trong tsuboniwa lấy sáng, kho và vườn sau',
  },
  14: {
    country: 'Singapore',
    cols: 4, rows: 2, attach: 'party', alley: 0.07, storey: 1.2, vary: 0.28, gableToStreet: false,
    coverage: 0.68, setFront: 0.02, setBack: 0.14, setSide: 0.0, setJitter: 0.2, sizeVary: 0.18,
    // Hiên năm-bộ (five-foot way) là một hành lang có mái BẮT BUỘC theo quy chế Raffles, chạy suốt
    // mặt phố — nên `setFront` rất nhỏ chứ không bằng 0. Sân sau (`airwell` + lối phục vụ) mới là
    // chỗ đất trống thật của kiểu nhà này.
    note: 'dãy shophouse — hiên năm-bộ bắt buộc chạy suốt mặt phố, giếng trời và ngõ sau',
  },
  15: {
    country: 'UAE',
    cols: 3, rows: 4, attach: 'court', alley: 0.11, storey: 1.2, vary: 0.16, gableToStreet: false,
    coverage: 0.52, setFront: 0.06, setBack: 0.06, setSide: 0.05, setJitter: 0.35, sizeVary: 0.18,
    // Nhà quây sân vùng Vịnh: các phòng xếp thành vành quanh cái sân `hawi`, tường chắn nắng cao,
    // và giữa hai nhà là ngõ `sikka` hẹp — hẹp có chủ đích để luôn có bóng râm và hút gió.
    note: 'nhà quây sân vùng Vịnh — phòng xếp vành quanh sân hawi, ngõ sikka hẹp luôn có bóng râm',
  },
};

/** Số đơn vị một kiểu khu phố sinh ra — `court` chỉ giữ vành ngoài, lòng để trống làm sân. */
export function blockUnitCount({ cols, rows, attach } = {}) {
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) return 0;
  if (attach === 'court') {
    if (cols < 3 || rows < 3) return 0;
    return cols * rows - (cols - 2) * (rows - 2);
  }
  return cols * rows;
}

/**
 * TỪ CHỐI THẲNG một dòng sai — không tự chữa, không rơi về mặc định.
 *
 * ⚠️ Cơ chế "từ chối thẳng" chỉ an toàn khi có người ĐẾM SỐ LẦN TỪ CHỐI ở đầu bên kia. Bài học
 * Phase 10 Bước 2: kỷ 14 khai `doorWidth` vượt trần, validator từ chối ĐÚNG, hàm dựng trả `false`
 * ĐÚNG, và cả kỷ ấy không có cửa — không một cảnh báo nào. Vì vậy `blockStyle.test.js` có một bài
 * bắt buộc *"kỷ nào khai hợp lệ thì PHẢI dựng ra đủ số đơn vị đã khai"*.
 */
export function isValidBlockStyle(style) {
  if (!style || typeof style !== 'object') return false;
  if (typeof style.country !== 'string' || style.country.trim() === '') return false;
  if (typeof style.note !== 'string' || style.note.trim() === '') return false;
  if (!BLOCK_ATTACH.includes(style.attach)) return false;
  if (typeof style.gableToStreet !== 'boolean') return false;
  if (!Number.isInteger(style.cols) || style.cols < 1 || style.cols > 5) return false;
  if (!Number.isInteger(style.rows) || style.rows < 1 || style.rows > 5) return false;
  if (!Number.isFinite(style.alley) || style.alley < 0 || style.alley > 0.4) return false;
  // Trần 2,0: cao hơn thế thì nhà dân bắt đầu tranh chấp hình bóng với kỳ quan, mà kỳ quan là
  // điểm tựa thị giác của cả kỷ. Sàn 0,8: thấp hơn nữa thì chia nhỏ chỉ còn là một đám lều.
  if (!Number.isFinite(style.storey) || style.storey < 0.8 || style.storey > MAX_STOREY) return false;
  if (!Number.isFinite(style.vary) || style.vary < 0 || style.vary > 0.5) return false;
  // ── BỐN TRỤC PHASE 22 ──────────────────────────────────────────────────────────────────────
  // Sàn 0,15: thấp hơn nữa thì khu phố thành vài chấm nhà giữa một bãi đất, tức mất luôn tín hiệu
  // "đây là một thành phố". Trần là `MAX_COVERAGE` — con số Đàm ra, và là lời hứa trung tâm của
  // cả phase, nên nó nằm ở validator (TỪ CHỐI THẲNG) chứ không nằm ở một phép kẹp im lặng.
  if (!Number.isFinite(style.coverage) || style.coverage < 0.15 || style.coverage > MAX_COVERAGE) return false;
  for (const ten of ['setFront', 'setBack', 'setSide']) {
    // Trần 0,35 mỗi mặt: lùi hơn thế thì hai khoảng lùi đối nhau đã ăn hết 70% thửa và phần xây
    // được không còn đủ cho `MIN_UNIT_CELLS` — bảng sẽ khai một đằng, hình dựng ra một nẻo.
    if (!Number.isFinite(style[ten]) || style[ten] < 0 || style[ten] > 0.35) return false;
  }
  // Ít nhất MỘT mặt phải lùi khác 0. Khai cả ba bằng 0 là quay lại đúng thế giới trước Phase 22:
  // nhà lấp kín tới tận ranh thửa, không sân, không khoảng lùi.
  if (style.setFront + style.setBack + style.setSide <= 0) return false;
  if (!Number.isFinite(style.setJitter) || style.setJitter < 0 || style.setJitter > 1) return false;
  if (!Number.isFinite(style.sizeVary) || style.sizeVary < 0 || style.sizeVary > 0.5) return false;
  const n = blockUnitCount(style);
  return n >= MIN_UNITS && n <= MAX_UNITS;
}

/** Tra bảng theo số kỷ. Kỷ lạ → dòng kỷ 1 (nguyên thuỷ nhất), KHÔNG phải một dòng bịa. */
export function getBlockStyle(era) {
  const key = Number.isFinite(era) ? Math.max(1, Math.min(15, Math.round(era))) : 1;
  return BLOCK_STYLES[key] ?? BLOCK_STYLES[1];
}

/**
 * PHẦN THỬA ÍT NHẤT PHẢI CÒN LẠI SAU KHI TRỪ KHOẢNG LÙI.
 *
 * Ba khoảng lùi cộng lại có thể nuốt gần trọn một thửa nhỏ, và lúc ấy `MIN_UNIT_CELLS` sẽ bắt bớt
 * hàng/cột cho tới khi khu phố chỉ còn một căn — tức khoảng lùi lặng lẽ xoá đúng thứ Phase 14 xây.
 * Sàn này giữ lại nửa thửa để xây, và khoản lùi bị cắt được chia lại cho hai mặt THEO ĐÚNG TỈ LỆ
 * bảng đã khai (mặt nào bảng cho lùi nhiều hơn thì vẫn được lùi nhiều hơn).
 */
export const MIN_BUILDABLE = 0.5;

/**
 * SÀN ĐỌC-ĐƯỢC NỞ LÊN BAO NHIÊU PHẦN CỦA `sizeVary`.
 *
 * Cái sàn phải mang phương sai (nếu không, kỷ nào bị sàn chặn sẽ ra một dãy nhà trùng khít — xem
 * chú thích tại chỗ dùng). Nhưng nở HẾT `sizeVary` thì sàn trung bình cao hơn sàn danh nghĩa tới
 * `sizeVary`/2, và ở kỷ 6 (`sizeVary` 0,28) nó đẩy độ phủ thật từ 34,0% lên **43,7%** — tức mua
 * phương sai bằng đúng thứ Đàm đang đòi (đất trống giữa các căn). Lấy một nửa: đủ để bốn nếp nhà
 * trong một sân vườn khác nhau rõ, mà chỉ nhấc độ phủ lên vài điểm phần trăm.
 */
export const SAN_NO = 0.5;

/**
 * Chia mặt bằng một khu phố thành danh sách đơn vị.
 *
 * Mọi con số VÀO và RA đều tính bằng **Ô LƯỚI** — đó là hệ đơn vị mà `MIN_UNIT_CELLS` nói, và
 * cũng là hệ mà mắt Đàm nhìn thấy. `block.js` lo việc quy đổi sang đơn vị của tầng mô tả.
 *
 * ⚠️ CHIA THEO TỈ LỆ, VÀ **TRẦN LUÔN THẮNG SÀN**. Ô chật thì ra ÍT căn, tuyệt đối không ra những
 * căn tí hon: nếu một đơn vị hẹp hơn `MIN_UNIT_CELLS` thì bớt hàng/cột đi cho tới khi vừa. Đây
 * đúng luật đã dùng cho mái đua (`EAVE_MAX_RATIO`, Phase 7C) và cho cửa (ADR-026).
 *
 * ── NĂM BƯỚC, THEO ĐÚNG THỨ TỰ NÀY (Phase 22) ────────────────────────────────────────────────
 *   1. **Khoảng lùi** cắt thửa xuống phần ĐƯỢC PHÉP XÂY. Ba mặt ba số, vì ngoài đời chúng chịu
 *      ba luật khác nhau — xem chú thích của bảng.
 *   2. **Bớt hàng/cột** cho tới khi mỗi suất đất đủ rộng để còn đọc ra là một căn nhà.
 *   3. **Chênh cỡ theo hạt giống** (`sizeVary`): mỗi căn một mặt bằng riêng.
 *   4. **Trần độ phủ** (`coverage`): đo độ phủ THẬT rồi thu đều cả lượt nếu vượt trần. Đo SAU
 *      bước 3 chứ không trước, vì thế mới bảo đảm được cái trần — thu trước rồi mới rắc chênh cỡ
 *      thì phần chênh lại đẩy độ phủ vượt lên, và cái trần thành một lời nói suông.
 *   5. **Xê dịch trong suất đất** (`setJitter`): biên xê dịch = chỗ trống CÒN LẠI của chính suất
 *      đất ấy, nên không căn nào có thể thò ra khỏi thửa dù hạt giống rơi vào đâu.
 *
 * ⚠️ HÀNG 0 LÀ HÀNG GIÁP PHỐ, ở mọi kỷ, mọi ô. Nó nằm ở phía −z của lưới khu phố, và tầng dựng
 * cảnh xoay cả khu phố sao cho −z quay ra con đường gần nhất (`dwellingFacing`, `dwellings.js`).
 * Mọi thứ trong hàm này nói "trước / sau" đều theo nghĩa ấy.
 *
 * @param {object} opts
 * @param {object} opts.style   một dòng của `BLOCK_STYLES`
 * @param {string} opts.seed    hạt giống tất định (thường là `dwellingBpId`)
 * @param {number} opts.blockW  bề ngang khu phố, tính bằng ô lưới
 * @param {number} opts.blockD  chiều sâu khu phố, tính bằng ô lưới
 * @returns {Array<{index:number, col:number, row:number, ox:number, oz:number,
 *                  w:number, d:number, storey:number, ry:number}>}
 */
export function deriveBlockUnits({ style, seed = 'block', blockW = 1, blockD = 1 } = {}) {
  if (!isValidBlockStyle(style)) return [];
  if (!(blockW > 0) || !(blockD > 0)) return [];

  // ── BƯỚC 1: KHOẢNG LÙI ─────────────────────────────────────────────────────────────────────
  // Kẹp về `MIN_BUILDABLE` rồi CHIA LẠI phần bị cắt theo đúng tỉ lệ bảng khai — kẹp thẳng mỗi số
  // riêng lẻ sẽ dồn mọi kỷ lùi mạnh về cùng một giá trị và phá THỨ TỰ giữa các kỷ (bài học
  // "kẹp thì phá thứ tự, đẩy thì không", Phase 7D).
  const luiHong = blockW * style.setSide;
  const rong = Math.max(blockW * MIN_BUILDABLE, blockW - luiHong * 2);
  const tongLuiDoc = style.setFront + style.setBack;
  const sau = Math.max(blockD * MIN_BUILDABLE, blockD * (1 - tongLuiDoc));
  const duTruoc = tongLuiDoc > 0 ? (blockD - sau) * (style.setFront / tongLuiDoc) : 0;
  // Tâm phần xây được, đo từ tâm thửa. Lùi trước nhiều hơn lùi sau ⇒ cả khu phố dịch về phía SAU.
  const tamZ = -blockD / 2 + duTruoc + sau / 2;

  // ── BƯỚC 2: BỚT HÀNG/CỘT — TRẦN THẮNG SÀN ──────────────────────────────────────────────────
  const keep = 1 - style.alley;
  let cols = style.cols;
  let rows = style.rows;
  while (cols > 1 && (rong / cols) * keep < MIN_UNIT_CELLS) cols -= 1;
  while (rows > 1 && (sau / rows) * keep < MIN_UNIT_CELLS) rows -= 1;
  // Quây sân cần ít nhất 3×3 mới có lòng để chừa; co lại quá thì nó thành một cụm nhà RỜI.
  // ⚠️ THOÁI HOÁ VỀ `loose`, KHÔNG VỀ `party` (đổi ở Phase 22). Cả năm kỷ khai `court` đều là kỷ
  // KHÔNG có nhà phố chung tường (3 Ur · 4 tứ hợp viện · 12 mikrorayon · 13 machiya · 15 vùng
  // Vịnh); cho chúng thoái hoá thành một dãy chung tường là dựng ra một kiểu nhà chưa từng tồn
  // tại ở nước ấy, chỉ vì hôm nay thửa đất hơi chật.
  const attach = style.attach === 'court' && (cols < 3 || rows < 3) ? 'loose' : style.attach;

  const pitchX = rong / cols;
  const pitchZ = sau / rows;
  /**
   * SÀN THẬT SỰ ÁP ĐƯỢC cho một đơn vị.
   *
   * ⚠️ `MIN_UNIT_CELLS` là sàn ta MUỐN, không phải sàn ta LUÔN có: khi đã bớt xuống còn một
   * hàng (hoặc một cột) mà suất đất vẫn hẹp hơn nó thì không còn gì để bớt nữa, và lúc ấy ép
   * sàn sẽ làm căn nhà RỘNG HƠN suất đất của nó — tức thò sang thửa bên. Lấy `min` của hai
   * thứ: sàn đọc-được, và chính suất đất đang có.
   *
   * ⚠️ VÀ NÓ PHẢI ĐƯỢC ÁP Ở **CẢ HAI** BƯỚC SAU (chênh cỡ · thu theo trần độ phủ), không chỉ ở
   * bước thu. Bản đầu chỉ áp ở bước thu, và `blockStyle.test.js` bắt được ngay: phép chênh cỡ
   * tự nó đã kéo một đơn vị kỷ 1 xuống **0,306 ô** trước khi bước thu kịp chạy, nên cái sàn
   * nhìn thấy một con số đã nằm dưới nó rồi và không nâng lên nữa.
   */
  const sanW = Math.min(MIN_UNIT_CELLS, pitchX * keep);
  const sanD = Math.min(MIN_UNIT_CELLS, pitchZ * keep);

  // Một ô lưới CÓ NHÀ ĐỨNG hay không — dùng để biết mặt tường nào là tường chung.
  const coNha = (c, r) => {
    if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
    if (attach !== 'court') return true;
    return c === 0 || c === cols - 1 || r === 0 || r === rows - 1;
  };

  // ── BƯỚC 3: CHÊNH CỠ MẶT BẰNG THEO HẠT GIỐNG ───────────────────────────────────────────────
  // ⚠️ ĐÂY LÀ CÂU TRẢ LỜI CHO *"hàng chục căn trùng khít nhau"*. Trước Phase 22 mọi đơn vị trong
  // một khu phố dùng CHUNG một `unitW`/`unitD`, nên chúng khác nhau đúng ở hai chỗ: chiều cao
  // (`vary`) và hạt giống của bộ sinh khối. Ở góc nhìn từ trên xuống — góc mà Đàm dùng để chấm —
  // chiều cao gần như không đọc ra được, nên cả dãy hiện ra là những hình chữ nhật y hệt nhau.
  //
  // Hệ số quanh 1 và ĐỐI XỨNG (`unit` − 0,5), nên mặt bằng TRUNG BÌNH của khu phố không đổi; thứ
  // đổi là phương sai. Kẹp trên bằng đúng suất đất (`pitch`) để không căn nào lấn sang căn bên.
  const rawUnits = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!coNha(col, row)) continue;
      const key = `${seed}|blk|${col}|${row}`;
      const heW = 1 + (unit(`${key}|sw`) - 0.5) * style.sizeVary;
      const heD = 1 + (unit(`${key}|sd`) - 0.5) * style.sizeVary;
      /**
       * ⚠️ **SÀN RIÊNG CHO TỪNG ĐƠN VỊ, VÀ NÓ MANG SẴN PHƯƠNG SAI.** Một cái sàn dùng chung là
       * một phép kẹp, mà một phép kẹp không chỉ chặn — **nó nuốt phương sai**. Ở kỷ có trần độ
       * phủ thấp (kỷ 6, làng Bắc Bộ, khai 0,22) thì MỌI đơn vị bị thu xuống dưới sàn rồi cùng kẹp
       * về ĐÚNG một giá trị, nên cả bốn căn ra **cùng một mặt bằng tới từng chữ số** — tức đúng
       * thứ Đàm đang bác ("hàng chục căn trùng khít nhau"), tái tạo ở chính cái kỷ lẽ ra phải
       * trông tự nhiên nhất. Bài `HẾT NHÀ TRÙNG KHÍT` bắt được ca này.
       *
       * Sàn nở lên theo hạt giống (một chiều, đi lên — dưới sàn thì không được phép, nên chỗ duy
       * nhất còn lại để khác nhau là phía trên), và **cùng một con số ấy được dùng ở CẢ hai bước**
       * (chênh cỡ · thu theo trần độ phủ). Bản trước vá bằng một bước 4b chạy SAU phép thu, và nó
       * đẩy độ phủ VƯỢT TRẦN mà không ai kêu: phép thu đã chạy xong rồi mới có người nới cỡ nhà
       * lên. Một cái trần chỉ giữ được nếu không có bước nào đứng sau nó làm ngược lại.
       */
      const rieng = {
        col,
        row,
        key,
        sanW: Math.min(pitchX, sanW * (1 + unit(`${key}|fw`) * style.sizeVary * SAN_NO)),
        sanD: Math.min(pitchZ, sanD * (1 + unit(`${key}|fd`) * style.sizeVary * SAN_NO)),
      };
      rieng.w = Math.min(pitchX, Math.max(rieng.sanW, pitchX * keep * heW));
      rieng.d = Math.min(pitchZ, Math.max(rieng.sanD, pitchZ * keep * heD));
      rieng.sanChan = rieng.w <= rieng.sanW + 1e-9 || rieng.d <= rieng.sanD + 1e-9;
      rawUnits.push(rieng);
    }
  }
  if (rawUnits.length === 0) return [];

  // ── BƯỚC 4: TRẦN ĐỘ PHỦ THỬA ───────────────────────────────────────────────────────────────
  // Đo độ phủ THẬT so với CẢ thửa (không phải so với phần xây được — khoảng lùi cũng là đất của
  // thửa ấy, và nó chính là phần Đàm muốn nhìn thấy). Vượt trần thì thu đều một hệ số duy nhất
  // cho mọi đơn vị, nên thứ tự to/nhỏ giữa các căn giữ nguyên.
  //
  // ⚠️ SÀN ĐỌC-ĐƯỢC THẮNG TRẦN ĐỘ PHỦ — xem `MAX_COVERAGE`. Ở kỷ có thửa nhỏ thì phép thu dừng
  // lại ở `MIN_UNIT_CELLS` và độ phủ đạt được sẽ CAO HƠN con số khai. Đó là một đánh đổi có chủ
  // đích, và nó được ĐẾM RA ở `blockStyle.test.js` thay vì im lặng.
  const dienTichThua = blockW * blockD;
  const daXay = rawUnits.reduce((tong, u) => tong + u.w * u.d, 0);
  const phu = daXay / dienTichThua;
  if (phu > style.coverage) {
    const k = style.coverage / phu;
    for (const u of rawUnits) {
      /**
       * ⚠️ THU **KHÔNG ĐỀU HAI TRỤC**, VÀ ĐÂY LÀ MỘT PHÉP ĐO CHỨ KHÔNG PHẢI MỘT SỞ THÍCH.
       *
       * Cách hiển nhiên là nhân cả hai cạnh với `√k`. Đo ra thì nó tốn rất đắt ở một chỗ không
       * ai ngờ: `emitRooftop` từ chối dựng gì trên mái khi **CẠNH NGẮN** của mái < `ROOFTOP_MIN_SPAN`,
       * nên thu đều hai trục là đem cạnh ngắn — cạnh đang quyết định — xuống cùng một nhịp với
       * cạnh dài vốn còn dư rất nhiều.
       *
       * Với cùng một diện tích, `min(w, d)` LỚN NHẤT khi ta rút của cạnh DÀI trước. Nên: rút cạnh
       * dài xuống, chạm tới cạnh ngắn thì mới rút cả hai. Cùng độ phủ, cùng lượng đất nhường ra,
       * mà giữ được nhiều mái có chi tiết hơn — và tiện thể nó dựng ra những căn nhà DÀI VÀ HẸP,
       * đúng hình một suất đất phố thật (machiya "chỗ ngủ của con lươn", nhà ống Deir el-Medina).
       */
      const dai = Math.max(u.w, u.d);
      const ngan = Math.min(u.w, u.d);
      let daiMoi;
      let nganMoi;
      if (k * dai >= ngan) {
        daiMoi = k * dai;
        nganMoi = ngan;
      } else {
        daiMoi = Math.sqrt(k * dai * ngan);
        nganMoi = daiMoi;
      }
      const wLaDai = u.w >= u.d;
      u.w = Math.max(wLaDai ? daiMoi : nganMoi, u.sanW);
      u.d = Math.max(wLaDai ? nganMoi : daiMoi, u.sanD);
      if (u.w <= u.sanW + 1e-9 || u.d <= u.sanD + 1e-9) u.sanChan = true;
    }
  }

  // ── BƯỚC 5: XÊ DỊCH TRONG SUẤT ĐẤT ─────────────────────────────────────────────────────────
  const out = [];
  for (const u of rawUnits) {
    const { col, row, key } = u;
    // Biên xê dịch = đúng chỗ trống còn lại của suất đất ấy ⇒ không căn nào thò ra khỏi thửa.
    // ⚠️ DÃY CHUNG TƯỜNG KHÔNG XÊ DỊCH NGANG: xê dịch một căn trong dãy chung tường là mở ra một
    // khe hở giữa hai bức tường chung. Nhưng nó VẪN xê dịch DỌC — chỉ giới xây dựng của một dãy
    // phố thật không bao giờ thẳng tuyệt đối, trừ nơi có quy chế bắt thế (kỷ 9 Haussmann khai
    // `setJitter` 0,08, kỷ 12 mikrorayon khai 0,06 — hai kỷ đều-nhất bảng, và đều có lý do).
    /**
     * ⚠️ CHỖ ĐỂ XÊ DỊCH KHÔNG CHỈ LÀ PHẦN THỪA TRONG SUẤT ĐẤT — NÓ CÒN LÀ CHÍNH DẢI KHOẢNG LÙI.
     *
     * Bản đầu lấy biên xê dịch bằng `(pitch − cỡ nhà) / 2`, tức chỉ dùng phần thừa bên trong suất
     * đất. Bài test `KHOẢNG LÙI CÓ THẬT` bắt được ngay: kỷ 1 khai `setJitter` **0,85** (cao gần
     * nhất bảng) mà mép trước cả dãy chỉ trải **0,0096 ô** — vì `alley` của nó là 0,06 nên phần
     * thừa gần bằng 0. Một cái núm khai 0,85 mà thực tế chạy 0,01 là một cột đã CHẾT, đúng kiểu
     * cơ chế "lùm cây" Phase 8D.
     *
     * ⇒ Hàng/cột NGOÀI CÙNG được lấn thêm vào tối đa nửa dải khoảng lùi của chính mặt nó, và chỉ
     * lấn RA NGOÀI. Hai hệ quả đều đúng ý: (1) nó không bao giờ đụng vào hàng phía trong, nên
     * không cần một phép kiểm chồng lấn nào; (2) nó không bao giờ ra khỏi thửa, vì dải khoảng lùi
     * là đất của chính thửa ấy. Và nó nói đúng điều ngoài đời xảy ra: mỗi nhà lấy một phần khác
     * nhau của khoảng lùi mình được phép dùng.
     */
    const duSau = blockD - sau - duTruoc;
    const lanRa = (be) => be * 0.5 * style.setJitter * unit(`${key}|lan${be.toFixed(3)}`);
    const bienX = attach === 'party' ? 0 : Math.max(0, (pitchX - u.w) * 0.5);
    const bienZ = Math.max(0, (pitchZ - u.d) * 0.5);
    const lanZ = row === 0 ? -lanRa(duTruoc) : (row === rows - 1 ? lanRa(duSau) : 0);
    const lanX = attach === 'party' ? 0
      : (col === 0 ? -lanRa(luiHong) : (col === cols - 1 ? lanRa(luiHong) : 0));
    // Đầu hồi quay ra mặt phố (`gableToStreet`) là một quyết định của CẢ dãy — thuế thời trung cổ
    // tính theo bề ngang mặt tiền thì nhà nào cũng phải quay đầu hồi ra, không có chuyện mỗi nhà
    // một kiểu. Còn nhà RỜI thì ngược lại: không ai bắt nó phải song song với hàng xóm, nên một
    // phần được xoay ngang sống mái — đây là phần thứ ba của câu trả lời cho "nhà trùng khít".
    const doiSongMai = attach !== 'party' && unit(`${key}|ridge`) < 0.38;
    const ry = (style.gableToStreet !== doiSongMai) ? Math.PI / 2 : 0;
    out.push({
      index: out.length,
      col,
      row,
      // ⚠️ CỜ NÀY KHÔNG PHỤC VỤ MÃ DỰNG — nó phục vụ câu hỏi *"độ phủ vượt trần vì sàn đọc-được
      // chặn, hay vì phép thu đã chết?"*. Không có nó thì đầu bên kia phải SUY từ kích thước, mà
      // kích thước đã đi qua thêm một bước nữa nên suy ra sẽ sai (bài học `TECH_DEBT #42`).
      sanChan: Boolean(u.sanChan),
      ox: (col - (cols - 1) / 2) * pitchX + signed(`${key}|ox`) * bienX * style.setJitter + lanX,
      oz: (row - (rows - 1) / 2) * pitchZ + tamZ + signed(`${key}|oz`) * bienZ * style.setJitter + lanZ,
      w: u.w,
      d: u.d,
      // Chênh cao giữa các đơn vị. `unit` (0..1) chứ không phải `signed`, rồi trừ đi nửa biên
      // độ — để chiều cao TRUNG BÌNH của khu phố đúng bằng `storey`, không bị lệch xuống.
      storey: style.storey * (1 + (unit(`${key}|h`) - 0.5) * style.vary),
      ry,
      /**
       * ⚠️ MẶT NÀO LÀ TƯỜNG CHUNG. `true` = mặt ấy NHÌN RA NGOÀI (được có cửa sổ).
       *
       * ── ĐỔI Ở PHASE 22: TƯỜNG CHUNG CHỈ CHẠY DỌC MẶT PHỐ ────────────────────────────────
       * Đàm: *"nhà dính tường chỉ áp cho căn giáp ranh thửa phía có đường… Căn nằm sâu trong
       * thửa luôn tách rời."* Trước bản này, mặt nạ hỏi hàng xóm theo CẢ HAI trục, nên hai hàng
       * của một khu phố cũng dính lưng vào nhau và cả thửa thành một tảng đặc.
       *
       * Nay chỉ hàng xóm CÙNG HÀNG mới là tường chung (`xm`/`xp`) — đó đúng là định nghĩa của
       * một dãy nhà phố: các căn chung tường BÊN, xếp dọc theo mặt phố. Còn `zm`/`zp` LUÔN hở,
       * vì giữa hai hàng là sân sau: `cavaedium` của insula La Mã, `cour` của Haussmann, ngõ
       * dịch vụ sau lưng brownstone, giếng trời của shophouse — mỗi kỷ một cái tên, cùng một
       * vệt đất. Và chính vệt đất ấy là thứ mắt đọc ra khi nhìn từ trên xuống.
       *
       * Nhà `loose` và `court` thì bốn mặt đều nhìn ra ngoài: chúng là những nếp nhà RỜI đứng
       * quanh một cái sân, không phải một dãy liền.
       */
      faces: attach === 'party' ? {
        xm: !coNha(col - 1, row),
        xp: !coNha(col + 1, row),
        zm: true,
        zp: true,
      } : { xm: true, xp: true, zm: true, zp: true },
    });
  }
  return out;
}
