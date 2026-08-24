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
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * HAI CÁCH SẮP NHÀ TRONG MỘT KHU PHỐ — và MỐC LỊCH SỬ chia chúng ra (Phase 21, ADR-065)
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm nhìn bản quét Phase 20 rồi ra một mốc, và đây là mốc chứ không phải một cái núm để chỉnh:
 *
 *   > *"nhà vẫn xếp rất ngăn nếp trông như quy hoạch, dù quy hoạch ô bàn cờ chỉ bùng nổ và trở
 *   > thành chuẩn mực từ thế kỷ 19 (Cách mạng Công nghiệp)."*
 *
 * ⇒ **Kỷ 1–9 KHÔNG được xếp hàng lối ở BẤT KỲ TẦNG NÀO. Kỷ 10–15 thì được.** Kỷ 10 là Anh thời
 * công nghiệp — đúng thế kỷ 19, đúng nơi cái bàn cờ ra đời — nên nó thuộc nhóm `grid`, và mốc ấy
 * đọc thẳng từ lịch sử chứ không phải một chỗ chia cho tiện.
 *
 * · `grid`    — chia mặt bằng thành lưới `cols × rows`. Bố cục do NHÀ NƯỚC / NHÀ ĐẦU TƯ vạch ra
 *               một lượt: terrace Anh, block Manhattan, khối tập thể Liên Xô, shophouse Singapore.
 * · `organic` — **chia đôi đệ quy LỆCH TÂM** rồi lấy từng mảnh làm một suất đất. Bố cục do từng
 *               nhà tự bồi đắp qua nhiều đời: Çatalhöyük, insula La Mã, Alfama, làng Bắc Bộ.
 *
 * ⚠️ VÌ SAO CHIA ĐÔI ĐỆ QUY CHỨ KHÔNG PHẢI "RẢI NGẪU NHIÊN RỒI TRÁNH NHAU". Rải rồi thử-và-loại
 * có ba tật cùng lúc: nó có thể KHÔNG đặt nổi đủ số nhà đã khai (rồi im lặng đặt thiếu), nó cần
 * một phép kiểm chồng lấn mà chính phép kiểm ấy là chỗ dễ sai, và số lần thử lại là một cái núm
 * chưa hiệu chuẩn. Các mảnh của một phép chia đôi đệ quy thì **rời nhau THEO CẤU TẠO** — không
 * cần kiểm chồng lấn, không thể xuyên qua nhau, và luôn ra đúng số mảnh nếu còn chỗ. Đây cũng
 * đúng cơ chế mà `cityPlan.js` đã dùng ở tầng THỬA ĐẤT (ADR-060): một luật, một công thức, hai
 * quy mô.
 *
 * ⚠️ VÀ NÓ KHÔNG "ĐỀU" NHƯ TÊN GỌI GỢI Ý. Chỗ cắt lệch tâm theo hạt giống, và mỗi lần chỉ cắt MỘT
 * vùng (vùng lớn nhất) chứ không cắt suốt cả chiều ngang — nên các mảnh không bao giờ xếp thành
 * hàng và cột. `laLuoiDeu` ở cuối file là phép đo nói ra điều đó bằng số, và `blockStyle.test.js`
 * khoá nó theo HAI CHIỀU: kỷ 1–9 phải TRƯỢT, kỷ 10–15 phải ĐẠT.
 */
export const BLOCK_LAYOUT = ['organic', 'grid'];

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
 * BẢNG 15 KỶ. Mỗi dòng buộc vào `country` mà `eraStyle.js` khai, và `note` phải kể được một khu
 * dân cư CÓ THẬT — nếu không viết ra được thì con số ấy là tuỳ hứng.
 *
 * · `layout`      — `grid` (kỷ 10–15) hay `organic` (kỷ 1–9). Xem `BLOCK_LAYOUT` ở trên.
 * · `cols`/`rows` — CHỈ dòng `grid`: chia mặt bằng thành lưới bấy nhiêu đơn vị (`cols` theo phố).
 * · `units`       — CHỈ dòng `organic`: khai thẳng bao nhiêu suất đất. Không có hàng cột nào để
 *                   nhân, nên số nhà phải được NÓI RA. Validator đòi đúng MỘT trong hai cách khai:
 *                   dòng nào khai cả hai, hoặc không khai cách nào, đều bị TỪ CHỐI THẲNG.
 * · `attach`      — `party` chung tường · `loose` rời có sân · `court` quây quanh sân trong.
 * · `alley`       — khe giữa hai đơn vị, tính theo TỈ LỆ bước lưới (0 = dính liền tuyệt đối).
 * · `storey`      — hệ số chiều cao đơn vị so với căn nhà đơn hôm nay.
 * · `vary`        — biên độ chênh cao giữa các đơn vị (0 = đều tăm tắp như luật quy hoạch bắt).
 * · `gableToStreet` — quay đầu hồi ra mặt phố (chỉ có nghĩa với kỷ lợp mái dốc).
 */
export const BLOCK_STYLES = {
  1: {
    country: 'Thổ Nhĩ Kỳ',
    layout: 'organic', units: 5, attach: 'party', alley: 0.02, storey: 1.95, vary: 0.26,
    gableToStreet: false,
    // Çatalhöyük không có phố: nhà dính liền nhau thành một khối, người ta đi TRÊN MÁI và chui
    // xuống bằng thang qua lỗ trên nóc. `alley` gần 0 là chép đúng sự thật ấy, không phải làm đẹp.
    note: 'Çatalhöyük — nhà dính liền, không ngõ, lên xuống bằng lỗ trên mái',
  },
  2: {
    country: 'Ai Cập',
    layout: 'organic', units: 8, attach: 'party', alley: 0.05, storey: 1.93, vary: 0.08,
    gableToStreet: false,
    // Deir el-Medina là làng thợ do NHÀ NƯỚC dựng cho thợ đục lăng mộ: hai dãy thẳng băng nhìn
    // nhau qua một con phố duy nhất, nhà nào cũng chung tường, cũng dài và hẹp như nhau. Vì thế
    // 4 x 2 (bốn suất dọc phố, hai dãy đối nhau) và `vary` gần 0 — nhà nước xây một lượt thì
    // không có chuyện nhà cao nhà thấp.
    note: 'Deir el-Medina — làng thợ nhà nước dựng: dãy thẳng, chung tường, nhà dài và hẹp',
  },
  3: {
    country: 'Iraq',
    layout: 'organic', units: 8, attach: 'party', alley: 0.06, storey: 1.28, vary: 0.14,
    gableToStreet: false,
    note: 'nhà sân trong thành Ur — tường ngoài kín, mọi cửa mở vào sân, hai tầng quanh giếng trời',
  },
  4: {
    country: 'Trung Quốc',
    layout: 'organic', units: 9, attach: 'court', alley: 0.1, storey: 1.38, vary: 0.1,
    gableToStreet: false,
    note: 'tứ hợp viện trong phường có tường — bốn dãy nhà trệt quây một sân, ngõ hutong chen giữa',
  },
  5: {
    country: 'Đức',
    layout: 'organic', units: 6, attach: 'party', alley: 0.05, storey: 1.9, vary: 0.28,
    gableToStreet: true,
    // Nhà khung gỗ quanh quảng trường chợ quay ĐẦU HỒI ra phố, vì thuế thời trung cổ tính theo bề
    // ngang mặt tiền. Cùng lý do ấy làm chúng cao thấp so le — mỗi nhà một chủ, một đời xây.
    note: 'nhà khung gỗ đấu lưng quanh quảng trường chợ, đầu hồi quay ra phố, cao thấp so le',
  },
  6: {
    country: 'Việt Nam',
    layout: 'organic', units: 4, attach: 'loose', alley: 0.26, storey: 1.4, vary: 0.2,
    gableToStreet: false,
    // ⚠️ KỶ DUY NHẤT KHÔNG CHUNG TƯỜNG, và đó là điểm phân biệt chứ không phải thiếu sót: làng Bắc
    // Bộ là nhà ba gian đứng giữa sân vườn, ngăn nhau bằng hàng rào cây chứ không bằng tường gạch.
    note: 'làng Bắc Bộ — nhà ba gian có sân vườn, ngăn bằng hàng rào cây, quây lỏng quanh ao',
  },
  7: {
    country: 'Ý',
    layout: 'organic', units: 7, attach: 'party', alley: 0.06, storey: 1.7, vary: 0.3,
    gableToStreet: false,
    // Insula La Mã là chung cư cho thuê cao 4–6 tầng, cao nhất thế giới cổ đại, và cao thấp lộn
    // xộn tới mức Augustus phải ra luật giới hạn chiều cao. `storey` cao nhất bảng thời cổ.
    note: 'insula / nhà tháp — chung cư cho thuê 4–6 tầng, ngõ chật, cao thấp lộn xộn',
  },
  8: {
    country: 'Bồ Đào Nha',
    layout: 'organic', units: 6, attach: 'party', alley: 0.05, storey: 1.58, vary: 0.16,
    gableToStreet: true,
    note: 'nhà phố Lisboa mặt tiền hẹp — ốp gạch men azulejo, mái dốc, dựng lại sau động đất 1755',
  },
  9: {
    country: 'Pháp',
    layout: 'organic', units: 6, attach: 'party', alley: 0.03, storey: 1.25, vary: 0.04,
    gableToStreet: false,
    // ⚠️ `vary` NHỎ NHẤT BẢNG, và đó là một sự thật lịch sử chứ không phải sự lười: quy chế
    // Haussmann bắt cả dãy phố cùng chiều cao, cùng cao độ ban công, cùng góc mái mansard.
    note: 'nhà phố Haussmann — cả dãy cùng chiều cao theo quy chế, mặt tiền đá liên tục',
  },
  10: {
    country: 'Anh',
    layout: 'grid', cols: 4, rows: 2, attach: 'party', alley: 0.04, storey: 1.7, vary: 0.06,
    gableToStreet: false,
    note: 'terrace đấu lưng thời công nghiệp — hai dãy chung tường hậu, ống khói lặp đều tăm tắp',
  },
  11: {
    country: 'Mỹ',
    layout: 'grid', cols: 4, rows: 2, attach: 'party', alley: 0.08, storey: 1.7, vary: 0.1,
    gableToStreet: false,
    note: 'dãy brownstone + khối chữ nhật dài kiểu Manhattan, có ngõ dịch vụ chạy sau lưng',
  },
  12: {
    country: 'Nga',
    layout: 'grid', cols: 3, rows: 4, attach: 'court', alley: 0.08, storey: 1.45, vary: 0.06,
    gableToStreet: false,
    note: 'khối nhà tập thể quây kín một sân trong — dvor, sân chung của cả khối',
  },
  13: {
    country: 'Nhật Bản',
    layout: 'grid', cols: 3, rows: 2, attach: 'party', alley: 0.07, storey: 1.28, vary: 0.18,
    gableToStreet: false,
    // Machiya quay mặt DÀI ra phố (hira-iri), nên `gableToStreet: false`; ngõ roji giữa hai dãy
    // hẹp tới mức chỉ vừa một người đi. Nhà gỗ thấp nên `storey` nằm ở nhóm thấp của bảng.
    note: 'machiya — nhà gỗ mặt phố mật độ cao, ngõ roji hẹp, không có sân trước',
  },
  14: {
    country: 'Singapore',
    layout: 'grid', cols: 4, rows: 2, attach: 'party', alley: 0.05, storey: 1.1, vary: 0.22,
    gableToStreet: false,
    note: 'dãy shophouse có hiên năm-bộ chạy suốt, xen khối cao tầng phía sau',
  },
  15: {
    country: 'UAE',
    layout: 'grid', cols: 3, rows: 4, attach: 'court', alley: 0.09, storey: 1.1, vary: 0.12,
    gableToStreet: false,
    note: 'nhà quây sân vùng Vịnh — tường chắn nắng cao, ngõ sikka hẹp luôn có bóng râm',
  },
};

/**
 * Số đơn vị một kiểu khu phố sinh ra.
 *
 * · `organic` — đọc thẳng `units` đã khai.
 * · `grid`    — `cols × rows`, trừ đi phần LÒNG nếu quây sân (`court` chỉ giữ vành ngoài).
 *
 * Kỷ `organic` mà quây sân thì con số này vẫn là số NHÀ, không phải số mảnh: bộ chia cắt ra
 * `units + 1` mảnh rồi để MỘT mảnh trống làm sân chung (giếng, ao, khoảnh đất giữa xóm).
 */
export function blockUnitCount(style = {}) {
  const { cols, rows, attach, layout, units } = style;
  if (layout === 'organic') {
    return Number.isInteger(units) && units >= 1 ? units : 0;
  }
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
  if (!BLOCK_LAYOUT.includes(style.layout)) return false;
  if (typeof style.gableToStreet !== 'boolean') return false;
  // ⚠️ ĐÚNG MỘT CÁCH KHAI SỐ NHÀ, KHÔNG ĐƯỢC HAI. Một dòng khai cả `cols/rows` lẫn `units` là hai
  // nguồn sự thật cho cùng một con số, và chúng sẽ trôi khỏi nhau trong im lặng ngay lần đầu có
  // ai sửa một bên. Một dòng không khai cách nào thì `blockUnitCount` trả 0 và cả kỷ ấy mất nhà.
  const coLuoi = style.cols !== undefined || style.rows !== undefined;
  const coDem = style.units !== undefined;
  if (style.layout === 'grid') {
    if (coDem) return false;
    if (!Number.isInteger(style.cols) || style.cols < 1 || style.cols > 5) return false;
    if (!Number.isInteger(style.rows) || style.rows < 1 || style.rows > 5) return false;
  } else {
    if (coLuoi) return false;
    if (!Number.isInteger(style.units) || style.units < 1) return false;
  }
  if (!Number.isFinite(style.alley) || style.alley < 0 || style.alley > 0.4) return false;
  // Trần 2,0: cao hơn thế thì nhà dân bắt đầu tranh chấp hình bóng với kỳ quan, mà kỳ quan là
  // điểm tựa thị giác của cả kỷ. Sàn 0,8: thấp hơn nữa thì chia nhỏ chỉ còn là một đám lều.
  if (!Number.isFinite(style.storey) || style.storey < 0.8 || style.storey > 2) return false;
  if (!Number.isFinite(style.vary) || style.vary < 0 || style.vary > 0.5) return false;
  const n = blockUnitCount(style);
  return n >= MIN_UNITS && n <= MAX_UNITS;
}

/** Tra bảng theo số kỷ. Kỷ lạ → dòng kỷ 1 (nguyên thuỷ nhất), KHÔNG phải một dòng bịa. */
export function getBlockStyle(era) {
  const key = Number.isFinite(era) ? Math.max(1, Math.min(15, Math.round(era))) : 1;
  return BLOCK_STYLES[key] ?? BLOCK_STYLES[1];
}

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
  return style.layout === 'organic'
    ? xepHuuCo(style, seed, blockW, blockD)
    : xepLuoi(style, seed, blockW, blockD);
}

/** Kỷ 10–15: lưới `cols × rows` do quy hoạch vạch ra. Đây là mã cũ, không đổi một luật nào. */
function xepLuoi(style, seed, blockW, blockD) {
  const keep = 1 - style.alley;
  // TRẦN THẮNG SÀN: bớt cột/hàng cho tới khi mỗi đơn vị đủ rộng để còn đọc ra là một căn nhà.
  let cols = style.cols;
  let rows = style.rows;
  while (cols > 1 && (blockW / cols) * keep < MIN_UNIT_CELLS) cols -= 1;
  while (rows > 1 && (blockD / rows) * keep < MIN_UNIT_CELLS) rows -= 1;
  // Quây sân cần ít nhất 3×3 mới có lòng để chừa; co lại quá thì nó thành dãy chung tường.
  const attach = style.attach === 'court' && (cols < 3 || rows < 3) ? 'party' : style.attach;

  const pitchX = blockW / cols;
  const pitchZ = blockD / rows;
  const unitW = pitchX * keep;
  const unitD = pitchZ * keep;

  // Một ô lưới CÓ NHÀ ĐỨNG hay không — dùng để biết mặt tường nào là tường chung.
  const coNha = (c, r) => {
    if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
    if (attach !== 'court') return true;
    return c === 0 || c === cols - 1 || r === 0 || r === rows - 1;
  };

  const out = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!coNha(col, row)) continue;
      const key = `${seed}|blk|${col}|${row}`;
      // Nhà rời thì xê dịch trong lòng ô của mình; nhà chung tường thì KHÔNG được xê dịch, vì
      // xê dịch một căn trong dãy chung tường là mở ra một khe hở giữa hai bức tường chung.
      const nhon = attach === 'loose' ? (pitchX - unitW) * 0.5 : 0;
      const nhonZ = attach === 'loose' ? (pitchZ - unitD) * 0.5 : 0;
      out.push({
        index: out.length,
        col,
        row,
        ox: (col - (cols - 1) / 2) * pitchX + signed(`${key}|ox`) * nhon,
        oz: (row - (rows - 1) / 2) * pitchZ + signed(`${key}|oz`) * nhonZ,
        w: unitW,
        d: unitD,
        // Chênh cao giữa các đơn vị. `unit` (0..1) chứ không phải `signed`, rồi trừ đi nửa biên
        // độ — để chiều cao TRUNG BÌNH của khu phố đúng bằng `storey`, không bị lệch xuống.
        storey: style.storey * (1 + (unit(`${key}|h`) - 0.5) * style.vary),
        // Đầu hồi quay ra mặt phố: xoay 90° những đơn vị nằm ở HÀNG NGOÀI CÙNG (hàng giáp phố).
        ry: style.gableToStreet ? Math.PI / 2 : 0,
        // ⚠️ MẶT NÀO LÀ TƯỜNG CHUNG. `true` = mặt ấy NHÌN RA NGOÀI (được có cửa sổ). Nhà kiểu
        // `loose` cách nhau bằng sân vườn nên bốn mặt đều nhìn ra ngoài; nhà chung tường thì mặt
        // nào có hàng xóm áp vào là mặt ấy bị bịt. Trục ở đây là trục của LƯỚI KHU PHỐ, chưa tính
        // phép xoay đầu hồi — `block.js` đổi trục trước khi đưa xuống bộ dựng cửa sổ.
        faces: attach === 'loose' ? { xm: true, xp: true, zm: true, zp: true } : {
          xm: !coNha(col - 1, row),
          xp: !coNha(col + 1, row),
          zm: !coNha(col, row - 1),
          zp: !coNha(col, row + 1),
        },
      });
    }
  }
  return out;
}

/**
 * ════════════════════════════════════════════════════════════════════════════════════════════════
 * KỶ 1–9: CHIA ĐÔI ĐỆ QUY LỆCH TÂM — không hàng, không cột, không quy hoạch (Phase 21, ADR-065)
 * ════════════════════════════════════════════════════════════════════════════════════════════════
 * Mỗi lần cắt: chọn **mảnh lớn nhất còn cắt được**, cắt theo cạnh DÀI hơn, chỗ cắt LỆCH TÂM theo
 * hạt giống. Vì mỗi lần chỉ cắt MỘT mảnh chứ không cắt suốt cả chiều ngang, các mảnh không bao giờ
 * xếp thành hàng và cột — đó là điểm khác nhau duy nhất mà cũng là toàn bộ điểm khác nhau so với
 * `xepLuoi`.
 *
 * ⚠️ **TRẦN LUÔN THẮNG SÀN, Y HỆT BÊN LƯỚI.** Một mảnh chỉ được cắt khi CẢ HAI nửa còn rộng hơn
 * `MIN_UNIT_CELLS` (đã cộng bù phần ngõ sẽ bị co đi). Hết chỗ thì DỪNG, ra ít nhà hơn số đã khai —
 * tuyệt đối không ra những căn tí hon.
 *
 * ⚠️ **CÁC MẢNH RỜI NHAU THEO CẤU TẠO**, nên không cần một phép kiểm chồng lấn nào và cũng không
 * thể có nhà xuyên qua nhà (đây là nửa "chồng lấn" của VIỆC 4). Nhà chung tường thì hai bức tường
 * nằm trên đúng một đường thẳng, vì chúng là hai bên của cùng một nhát cắt.
 */
function xepHuuCo(style, seed, blockW, blockD) {
  const keep = 1 - style.alley;
  // Mảnh phải đủ rộng để căn nhà bên trong nó — sau khi đã co lại chừa ngõ — vẫn trên sàn.
  const sanManh = MIN_UNIT_CELLS / keep;
  // Quây sân cần một mảnh THỪA để bỏ trống làm sân chung; xem `blockUnitCount`.
  const quaySan = style.attach === 'court';
  const dich = blockUnitCount(style) + (quaySan ? 1 : 0);

  let manh = [{ x0: -blockW / 2, z0: -blockD / 2, x1: blockW / 2, z1: blockD / 2 }];
  // Vòng lặp có TRẦN CỨNG: mỗi vòng hoặc thêm đúng một mảnh, hoặc `break`. `MAX_UNITS + 1` là
  // đích lớn nhất có thể, nên trần này không bao giờ cắt ngang một phép chia còn dở.
  for (let lan = 0; manh.length < dich && lan <= MAX_UNITS + 1; lan += 1) {
    let chon = -1;
    let dienTich = 0;
    for (let i = 0; i < manh.length; i += 1) {
      const r = manh[i];
      const w = r.x1 - r.x0;
      const d = r.z1 - r.z0;
      if (Math.max(w, d) < sanManh * 2) continue;
      const a = w * d;
      if (a > dienTich) { dienTich = a; chon = i; }
    }
    if (chon < 0) break;
    const r = manh[chon];
    const w = r.x1 - r.x0;
    const d = r.z1 - r.z0;
    // Cắt theo cạnh dài hơn — cắt cạnh ngắn thì ra hai mảnh dẹt như que, và một dãy que thì lại
    // đọc ra thành hàng lối. Hai cạnh gần bằng nhau (chênh dưới 12%) thì để hạt giống chọn trục,
    // nếu không thì mọi mảnh vuông của mọi kỷ đều cắt cùng một chiều.
    const canBang = Math.abs(w - d) < 0.12 * Math.max(w, d);
    const doc = canBang ? unit(`${seed}|truc|${lan}`) < 0.5 : w >= d;
    const dai = doc ? w : d;
    // Chỗ cắt lệch tâm. `lo`/`hi` là hai đầu mà cả hai nửa còn trên sàn; trong khoảng đó thì hạt
    // giống quyết. KHÔNG kẹp ra khỏi giữa: một nhát cắt rơi đúng giữa là chuyện bình thường, cái
    // làm nên bàn cờ là MỌI nhát cùng rơi giữa, mà điều đó không xảy ra được với hạt giống.
    const lo = sanManh / dai;
    const hi = 1 - lo;
    const t = lo + (hi - lo) * unit(`${seed}|cat|${lan}`);
    const cat = doc ? r.x0 + w * t : r.z0 + d * t;
    manh.splice(chon, 1,
      doc ? { ...r, x1: cat } : { ...r, z1: cat },
      doc ? { ...r, x0: cat } : { ...r, z0: cat });
  }

  // Quây sân: bỏ TRỐNG mảnh gần tâm khu phố nhất — đó là cái sân / giếng / ao chung mà cả xóm
  // quay mặt vào.
  //
  // ⚠️ NGƯỠNG 5 LÀ MỘT QUAN HỆ, KHÔNG PHẢI MỘT SỐ CHỌN TAY: một cái sân CHUNG phải có ít nhất bốn
  // nhà vây quanh, nếu không nó chỉ là một khoảng trống cạnh hai ba căn nhà — mà một khoảng trống
  // thì không đọc ra là sân. Dưới ngưỡng ấy thì giữ nguyên mọi mảnh, tức thoái hoá về dãy chung
  // tường, đúng luật thoái hoá mà `court` bên lưới đã dùng khi co xuống dưới 3×3.
  if (quaySan && manh.length >= 5) {
    let giua = 0;
    let gan = Infinity;
    for (let i = 0; i < manh.length; i += 1) {
      const r = manh[i];
      const cx = (r.x0 + r.x1) / 2;
      const cz = (r.z0 + r.z1) / 2;
      const kc = cx * cx + cz * cz;
      if (kc < gan) { gan = kc; giua = i; }
    }
    manh.splice(giua, 1);
  }

  const eps = 1e-9;
  const out = [];
  for (let i = 0; i < manh.length; i += 1) {
    const r = manh[i];
    const rongManh = r.x1 - r.x0;
    const sauManh = r.z1 - r.z0;
    const key = `${seed}|hc|${i}`;
    // ⚠️ MẶT NÀO LÀ TƯỜNG CHUNG — hỏi CÁC MẢNH CÒN LẠI, không suy từ chỉ số. Ở lưới thì "hàng xóm
    // bên trái" là `col - 1`; ở đây không có cột nào để trừ, nên phải đo: một mặt bị bịt khi có
    // mảnh khác áp đúng vào nó VÀ hai mảnh gối lên nhau theo chiều còn lại. Nhờ hỏi mảnh thật nên
    // cái sân vừa bị bỏ đi tự động MỞ LẠI những bức tường quay vào nó — không cần một nhánh riêng.
    const apVao = (canh) => manh.some((o, j) => {
      if (j === i) return false;
      if (canh === 'xm') return Math.abs(o.x1 - r.x0) < eps && o.z0 < r.z1 - eps && o.z1 > r.z0 + eps;
      if (canh === 'xp') return Math.abs(o.x0 - r.x1) < eps && o.z0 < r.z1 - eps && o.z1 > r.z0 + eps;
      if (canh === 'zm') return Math.abs(o.z1 - r.z0) < eps && o.x0 < r.x1 - eps && o.x1 > r.x0 + eps;
      return Math.abs(o.z0 - r.z1) < eps && o.x0 < r.x1 - eps && o.x1 > r.x0 + eps;
    });
    out.push({
      index: i,
      // Không có hàng cột thật, nhưng `block.js` dùng cặp này làm HẠT GIỐNG cho từng đơn vị, nên
      // chúng phải phân biệt được nhau. Cho cả hai bằng chỉ số là cách thẳng thắn nhất: nó nói
      // rằng ở đây mỗi đơn vị là một suất riêng, không thuộc hàng nào cũng không thuộc cột nào.
      col: i,
      row: i,
      ox: (r.x0 + r.x1) / 2,
      oz: (r.z0 + r.z1) / 2,
      w: rongManh * keep,
      d: sauManh * keep,
      storey: style.storey * (1 + (unit(`${key}|h`) - 0.5) * style.vary),
      ry: style.gableToStreet ? Math.PI / 2 : 0,
      faces: style.attach === 'loose'
        ? { xm: true, xp: true, zm: true, zp: true }
        : { xm: !apVao('xm'), xp: !apVao('xp'), zm: !apVao('zm'), zp: !apVao('zp') },
    });
  }
  return out;
}

/**
 * **CÓ PHẢI MỘT LƯỚI ĐỀU KHÔNG?** — phép đo nói ra bằng số cái mốc lịch sử Đàm đã ra.
 *
 * ⚠️ Đây là một QUAN HỆ chứ không phải một ngưỡng: nó không hỏi *"lệch bao nhiêu thì hết là lưới"*
 * mà hỏi ba câu chỉ có đúng/sai — nên không có con số nào để nới ra cho tiện sau này.
 *
 *   (a) **KÍN**: số đơn vị phải khớp đúng một lưới đầy (`nx × nz`) hoặc đúng cái vành ngoài của nó
 *       (kiểu quây sân). Các mảnh chia đôi đệ quy có tâm gần như đôi một khác nhau, nên `nx × nz`
 *       phình lên cỡ `n²` và câu này trượt ngay.
 *   (b) **BƯỚC ĐỀU** ở cả hai trục.
 *   (c) **CÙNG MỘT GÓC XOAY** — hàng lối thì không có nhà nào quay chệch đi.
 *
 * ⚠️ Phải hỏi ở một mặt bằng ĐỦ RỘNG. Ô chật thì phép kẹp "trần thắng sàn" bóp lưới về một hàng
 * hoặc một cột, và lúc ấy `nx` hoặc `nz` bằng 1 — câu trả lời `false` khi ấy nói về cái ô chật,
 * không nói về bảng.
 */
export function laLuoiDeu(units) {
  if (!Array.isArray(units) || units.length < 4) return false;
  const lam = (v) => Math.round(v * 1e6) / 1e6;
  const xs = [...new Set(units.map((u) => lam(u.ox)))].sort((a, b) => a - b);
  const zs = [...new Set(units.map((u) => lam(u.oz)))].sort((a, b) => a - b);
  if (xs.length < 2 || zs.length < 2) return false;
  const day = xs.length * zs.length;
  const vanh = day - Math.max(0, xs.length - 2) * Math.max(0, zs.length - 2);
  if (units.length !== day && units.length !== vanh) return false;
  const deu = (a) => {
    if (a.length < 3) return true;
    const b = a.slice(1).map((v, i) => v - a[i]);
    return Math.max(...b) - Math.min(...b) <= 1e-6;
  };
  if (!deu(xs) || !deu(zs)) return false;
  return new Set(units.map((u) => lam(u.ry))).size === 1;
}
