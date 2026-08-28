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
 * đúng cơ chế mà `cityPlan.js` đã dùng ở tầng THỬA ĐẤT (ADR-066): một luật, một công thức, hai
 * quy mô.
 *
 * ⚠️ VÀ NÓ KHÔNG "ĐỀU" NHƯ TÊN GỌI GỢI Ý. Chỗ cắt lệch tâm theo hạt giống, và mỗi lần chỉ cắt MỘT
 * vùng (vùng lớn nhất) chứ không cắt suốt cả chiều ngang — nên các mảnh không bao giờ xếp thành
 * hàng và cột. `laLuoiDeu` ở cuối file là phép đo nói ra điều đó bằng số, và `blockStyle.test.js`
 * khoá nó theo HAI CHIỀU: kỷ 1–9 phải TRƯỢT, kỷ 10–15 phải ĐẠT.
 */
export const BLOCK_LAYOUT = ['organic', 'grid'];

/**
 * Phần đất mà MÁI ĐUA ăn thêm ngoài mặt mái — xem khối chú thích của `MIN_UNIT_CELLS` ngay dưới.
 */
export const EAVE_LAND_FACTOR = 1.05;

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
 *
 * ⚠️ **VẾ (b) ĐO SAI ĐẠI LƯỢNG SUỐT TỪ ĐẦU, VÀ NÓ ĐÚNG ĐƯỢC LÀ NHỜ MỘT LỖI KHÁC** (Phase 21).
 * `ROOFTOP_MIN_SPAN` là ngưỡng của **MẶT MÁI**, còn `MIN_UNIT_CELLS` là sàn của **SUẤT ĐẤT** — hai
 * thứ khác nhau đúng bằng phần mái đua ăn ra ngoài. Đặt chúng bằng nhau tức là ngầm coi mái đua
 * rộng bằng không. Nó vẫn xanh nhiều tháng vì phép co hai lượt (xem `block.js`) dựng ra căn nhà
 * **rộng hơn suất đất khoảng 15%** một cách có hệ thống, và đúng 15% ấy che lấp chỗ thiếu. Phase 21
 * vá phép co cho trúng đích ⇒ khuyết tật lộ ra ngay: với bảng lúc ấy (ngõ kỷ 6 còn 0,26) thì kỷ 6
 * và kỷ 10 cùng tụt xuống dưới sàn 0,7 của `block.test.js`; hạ ngõ kỷ 6 rồi thì chỉ còn kỷ 10.
 * **Một lời hứa đang xanh nhờ chính khuyết tật mà ta sắp sửa** — bài học Phase 9B, lặp lại ở một
 * file khác.
 *
 * ⚠️ HỆ SỐ 1,05 LÀ MỘT SỐ **ĐO ĐƯỢC, KHÔNG PHẢI MỘT SỐ SUY RA** — và phải đọc đúng như thế.
 * Tôi đặt tên nó theo cơ chế mình tin (mái đua ăn thêm đất) rồi quét cả dải để kiểm; bảng số dưới
 * đây **bác bỏ chính cái mô hình ấy**: nếu hệ số chỉ là phần đất mái đua ăn thêm thì nới nó ra
 * phải làm chi tiết mái TỐT LÊN, mà đo ra là đơn điệu NGƯỢC LẠI. Nên nó được giữ là một BIÊN đo
 * được, và cái tên chỉ nói nó ra đời để làm gì, không nói nó là một phép tính.
 *
 * ⚠️ **BẢNG DƯỚI ĐÂY ĐO LẠI Ở PHASE 22 §6 — BỘ SỐ CŨ ĐÃ BỊ XOÁ, ĐỪNG ĐI TÌM LẠI NÓ.** Bộ cũ
 * (ghi "1,05 → 98,5% · khối/ô 4,00–4,00") đo bằng bộ khớp-đất HỎNG: 41% số ca trả-đất dựng ra căn
 * nhà TO HƠN suất đất của nó, nên phần lớn "chi tiết mái giữ được" ngày ấy là mái của những căn
 * đang lấn sang nhà bên, và cột "khối/ô" của nó cũng bịa nốt. Đây đúng là `TECH_DEBT #43`
 * (*"đừng chép cột SAU của phase trước làm cột TRƯỚC của phase mình"*), lần này ở dạng khó thấy
 * hơn: bảng vẫn nằm nguyên chỗ cũ, chỉ có thứ nó mô tả là đã chết.
 * Quét lại trên quần thể THẬT (473 ô, `sessionCount: 80`), bộ khớp MỚI, chấm bốn cột cùng lúc:
 *
 *     hệ số   sàn (điểm ảnh)   còn chi tiết mái   kỷ tệ nhất   kỷ dưới sàn 0,7   khối/ô
 *   →  1,05   0,3276 (21,0)         97,0%            0,844            []          2,87 {2,3,4}
 *      1,15   0,3588 (23,0)         95,1%            0,774            []          2,69 {2,3,4}
 *      1,25   0,3900 (25,0)         92,2%            0,645           [9]          2,48 {2,3,4}
 *      1,35   0,4212 (27,0)         89,0%            0,613          [8,9]         2,36 {1,2,4}
 *      1,45   0,4524 (29,0)         91,1%            0,590          [7,8]         1,56 {1,2,4}
 *      1,55   0,4836 (31,0)         98,7%            0,903            []          1,05 {1,2}
 *
 * 1,05 thắng ở CẢ BA cột đầu cùng lúc, nên không có gì phải cân nhắc ở dải 1,05–1,45. Cái bẫy nằm
 * ở dòng cuối: **1,55 có bảng mái đẹp nhất bảng (98,7% · tệ nhất 0,903 · dưới sàn rỗng) và nó là
 * lựa chọn SAI** — nó mua con số ấy bằng cách giết đúng thứ Phase 22 sinh ra để cứu, là cột
 * `units`/`cols`/`rows`: 1,05 khối mỗi ô nghĩa là gần như mọi ô chỉ còn MỘT căn nhà, tức quay về
 * đúng thế giới trước Phase 14 §1(3). ⇒ **Một cột số đẹp lên trong khi một cột khác chết là một
 * phép đánh đổi, không phải một cải thiện; đọc cả bảng trước khi đọc một cột.**
 *
 * ⚠️ VÀ CỘT "khối/ô" NAY ĐÃ SỐNG (`TECH_DEBT #88` đóng ở Phase 22): trước đây cả 15 kỷ ra đúng
 * 4,00 nên `units`/`cols`/`rows` là một trục CHẾT; nay ở 1,05 nó trải 2–4 (trung bình 2,87), vì
 * cột `yard` mới ăn vào chiều sâu suất đất nên số suất vừa được một ô đổi theo từng kỷ. Đó là
 * một trục bản sắc vừa hồi sinh — đừng vô tình giết lại nó bằng cách nới hệ số này.
 */
export const MIN_UNIT_CELLS = Math.max(
  (3 * EYE_PIXELS) / CELL_PIXELS,
  ROOFTOP_MIN_SPAN * BUILDING_SCALE * EAVE_LAND_FACTOR,
);

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * SÂN / VƯỜN — phần suất đất KHÔNG có nhà đứng lên (Phase 22, ADR-067)
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm nhìn ảnh nhìn-từ-trên-xuống rồi nói: *"đừng có làm cho nó giả quá … ngày xưa làm gì có vụ
 * nhà sát sát nhau như thế."* Đo ra thì lời ấy đúng từng chữ, và hai con số nói ra chỗ hỏng:
 *
 *   · **87,1% đất khu dân cư là MÁI NHÀ** (trung bình 15 kỷ, `(1 − alley)²`).
 *   · Khe giữa hai căn trung bình **3,9 điểm ảnh** ở khung mặc định — đúng bằng `EYE_PIXELS = 4`.
 *     Nghĩa là ở đúng khung Đàm nhìn, cái khe ấy KHÔNG TỒN TẠI: một khu phố đọc ra là MỘT TẤM.
 *
 * ⚠️ VÀ THỨ THIẾU KHÔNG PHẢI "KHE RỘNG HƠN" — nới `alley` chỉ ra một tấm có kẻ chỉ. Thứ thiếu là
 * một ĐẠI LƯỢNG CHƯA HỀ CÓ TRONG MÔ HÌNH: **suất đất của một căn nhà tiền công nghiệp phần lớn
 * KHÔNG phải nhà.** Nó là sân, vườn, chuồng, ao, giếng, sân phơi. Suất đất burgage của thị trấn
 * trung cổ châu Âu là ca kinh điển: nhà ngồi ở đầu giáp phố, phần còn lại là vườn/chuồng chạy dài
 * vào lòng khu phố. Cùng một hình dạng ấy có ở machiya Nhật, nhà ba gian Bắc Bộ, tứ hợp viện
 * Trung Hoa, nhà quây sân vùng Vịnh.
 *
 * ⚠️ SÂN ĐƯỢC ĐÒI **TRƯỚC** KHI CHIA LÔ, VÀ ĐÓ LÀ ĐIỂM QUAN TRỌNG NHẤT CỦA CƠ CHẾ NÀY. Nếu chia
 * lô xong mới bóp căn nhà lại thì nhà tụt xuống dưới `MIN_UNIT_CELLS` và biến thành vệt bẩn —
 * đúng luật `TRẦN LUÔN THẮNG SÀN`: hết chỗ thì làm **ÍT** nhà, tuyệt đối không làm nhà tí hon.
 * Nên kỷ nào nhiều sân thì có ÍT suất đất hơn mà mỗi suất TO hơn — đúng hình dạng một cái làng so
 * với một khu nhà trọ, và nó khôi phục một trục đã chết (xem `TECH_DEBT #88`) theo chiều NGƯỢC
 * với cách người ta hay nghĩ: không phải "khai nhiều thì ra nhiều", mà "khai ít sân thì ra nhiều".
 *
 * ⚠️ SÂN CHỈ ĂN **MỘT** TRỤC — CHIỀU SÂU — Ở MỌI KIỂU XẾP. Nhà đẩy ra mép ngoài khu phố (nơi có
 * phố), vườn chạy vào lòng khu: đó chính là suất đất burgage. Bản đầu cho `loose` một cái VÀNH
 * bao quanh bốn mặt và nó tự sát về mặt số học — xem chú thích của `sanCuaLo`. Việc *"nhà rời thì
 * không dính nhau theo bề ngang"* thuộc về `alley`, một cột đã có sẵn: một knob một việc.
 *
 * ⚠️ HOẶC ĐỦ THẤY, HOẶC KHAI THẲNG 0 — KHÔNG CÓ GÌ Ở GIỮA (luật của Đàm, ADR-033). Một mảnh sân
 * rộng 2–3 điểm ảnh không phải một cái sân, nó là nhiễu, và nó vẫn tốn tam giác. Ba kỷ khai 0 —
 * **1 · 7 · 10** — và đó KHÔNG phải ba chỗ bỏ trống mà là ba lời khai lịch sử: Çatalhöyük không
 * có sân (đi trên mái), insula La Mã xây kín tới mép, nhà đấu lưng Anh thì "không có sân" chính
 * là định nghĩa của nó. Cái cổng ngưỡng-mắt tự kể đúng lịch sử — nó loại đúng ba nền ấy và giữ
 * lại mười hai nền còn lại. `blockStyle.test.js` ĐẾM RA đúng ba số ấy.
 *
 * ⚠️ VÀ MẶT TƯỜNG QUAY VÀO SÂN PHẢI ĐƯỢC MỞ LẠI. Nó vốn bị `apVao`/`coNha` đánh dấu là tường
 * chung vì hai suất đất kề nhau; sau khi lùi vào thì nó nhìn ra vườn nhà mình, tức nó ĐƯỢC có cửa
 * sổ. Quên vế này thì cả dãy nhà quay lưng vào chính khu vườn vừa mở ra.
 *
 * ── 15 GIÁ TRỊ, MỖI GIÁ TRỊ MỘT SỰ THẬT ──────────────────────────────────────────────────────
 * (In cả cột ra một chỗ, đúng luật *"trước khi vá một dòng của một bảng, in ra HISTOGRAM cả cột"*.
 * Dải trải 0 → 0,58 và KHÔNG đơn điệu theo thời gian — cái đó mới là dấu hiệu bảng đang đọc
 * lịch sử chứ không đọc một đường xu hướng.)
 *
 *   | kỷ | sân  | vì sao ĐÚNG con số ấy |
 *   |----|------|------------------------|
 *   |  1 | 0    | Çatalhöyük KHÔNG có sân: nhà dính liền, không có cả phố — người ta đi trên mái và chui xuống bằng thang. |
 *   |  2 | 0,22 | Deir el-Medina: nhà dãy, nhưng cuối nhà có sân bếp lộ thiên có tường quây. |
 *   |  3 | 0,30 | Nhà sân trong Ur — cái sân LÀ trung tâm nhà, mọi phòng mở vào nó. |
 *   |  4 | 0,44 | Tứ hợp viện: sân lớn quây bốn dãy. Và một phần ba nam thành Trường An suốt đời Đường vẫn là RUỘNG VƯỜN trong tường. |
 *   |  5 | 0,46 | Suất đất burgage: nhà ở đầu giáp phố, sau lưng là vườn rau + chuồng lợn + lò bánh, dài gấp mấy lần cái nhà. |
 *   |  6 | 0,58 | Nhà ba gian Bắc Bộ = nhà + sân gạch + vườn + ao. Nhà là phần NHỎ của thửa. Rộng nhất bảng. |
 *   |  7 | 0    | Insula La Mã: chung cư cho thuê, xây kín tới mép; đất trong tường thành đắt tới mức không ai chừa sân, và chính vì thế mà cháy Rome lan được. |
 *   |  8 | 0,24 | Lisboa sau 1755: lô hẹp và sâu, cuối lô có quintal nhỏ lấy sáng. |
 *   |  9 | 0,28 | Haussmann: khối kín mặt phố, giữa khối là cour intérieure — quy chế bắt phải chừa. |
 *   | 10 | 0    | Back-to-back thời công nghiệp: KHÔNG có sân — đó là định nghĩa của kiểu nhà này, và chính vì thế nó bị cấm bằng luật vệ sinh cuối thế kỷ 19. |
 *   | 11 | 0,32 | Brownstone New York: luật bắt chừa rear yard, mỗi lô một mảnh sau lưng. |
 *   | 12 | 0,50 | Khối tập thể Liên Xô quây quanh dvor — cái sân chung là chính typology, không phải phần thừa. |
 *   | 13 | 0,38 | Machiya "giường lươn": lô rất sâu, nhà ở mặt phố, trong có tsuboniwa và vườn sau. |
 *   | 14 | 0,26 | Shophouse: giếng trời giữa nhà + sân sau, hiên năm-bộ ăn nốt mặt tiền. |
 *   | 15 | 0,55 | Nhà quây sân vùng Vịnh: cái sân là phòng khách ngoài trời, tường cao che nắng bao quanh. |
 */
export const BLOCK_YARD_MAX = 0.7;

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
 * · `yard`        — phần suất đất là SÂN/VƯỜN chứ không phải nhà. Xem khối `BLOCK_YARD_MAX`.
 * · `storey`      — hệ số chiều cao đơn vị so với căn nhà đơn hôm nay.
 * · `vary`        — biên độ chênh cao giữa các đơn vị (0 = đều tăm tắp như luật quy hoạch bắt).
 * · `gableToStreet` — quay đầu hồi ra mặt phố (chỉ có nghĩa với kỷ lợp mái dốc).
 */
export const BLOCK_STYLES = {
  1: {
    country: 'Thổ Nhĩ Kỳ',
    layout: 'organic', units: 5, attach: 'party', alley: 0.02, yard: 0, storey: 1.95, vary: 0.26,
    gableToStreet: false,
    // Çatalhöyük không có phố: nhà dính liền nhau thành một khối, người ta đi TRÊN MÁI và chui
    // xuống bằng thang qua lỗ trên nóc. `alley` gần 0 là chép đúng sự thật ấy, không phải làm đẹp.
    note: 'Çatalhöyük — nhà dính liền, không ngõ, lên xuống bằng lỗ trên mái',
  },
  2: {
    country: 'Ai Cập',
    layout: 'organic', units: 8, attach: 'party', alley: 0.05, yard: 0.22, storey: 1.93, vary: 0.08,
    gableToStreet: false,
    // Deir el-Medina là làng thợ do NHÀ NƯỚC dựng cho thợ đục lăng mộ: hai dãy thẳng băng nhìn
    // nhau qua một con phố duy nhất, nhà nào cũng chung tường, cũng dài và hẹp như nhau. Vì thế
    // 4 x 2 (bốn suất dọc phố, hai dãy đối nhau) và `vary` gần 0 — nhà nước xây một lượt thì
    // không có chuyện nhà cao nhà thấp.
    note: 'Deir el-Medina — làng thợ nhà nước dựng: dãy thẳng, chung tường, nhà dài và hẹp',
  },
  3: {
    country: 'Iraq',
    layout: 'organic', units: 8, attach: 'party', alley: 0.06, yard: 0.3, storey: 1.28, vary: 0.14,
    gableToStreet: false,
    note: 'nhà sân trong thành Ur — tường ngoài kín, mọi cửa mở vào sân, hai tầng quanh giếng trời',
  },
  4: {
    country: 'Trung Quốc',
    layout: 'organic', units: 9, attach: 'court', alley: 0.1, yard: 0.44, storey: 1.38, vary: 0.1,
    gableToStreet: false,
    note: 'tứ hợp viện trong phường có tường — bốn dãy nhà trệt quây một sân, ngõ hutong chen giữa',
  },
  5: {
    country: 'Đức',
    layout: 'organic', units: 6, attach: 'party', alley: 0.05, yard: 0.46, storey: 1.9, vary: 0.28,
    gableToStreet: true,
    // Nhà khung gỗ quanh quảng trường chợ quay ĐẦU HỒI ra phố, vì thuế thời trung cổ tính theo bề
    // ngang mặt tiền. Cùng lý do ấy làm chúng cao thấp so le — mỗi nhà một chủ, một đời xây.
    note: 'nhà khung gỗ đấu lưng quanh quảng trường chợ, đầu hồi quay ra phố, cao thấp so le',
  },
  6: {
    country: 'Việt Nam',
    layout: 'organic', units: 4, attach: 'loose', alley: 0.1, yard: 0.48, storey: 1.4, vary: 0.2,
    gableToStreet: false,
    // ⚠️ KỶ DUY NHẤT KHÔNG CHUNG TƯỜNG, và đó là điểm phân biệt chứ không phải thiếu sót: làng Bắc
    // Bộ là nhà ba gian đứng giữa sân vườn, ngăn nhau bằng hàng rào cây chứ không bằng tường gạch.
    // ⚠️ NGÕ 0,26 → 0,18 (PHASE 21) → **0,10 (PHASE 22 §6)**, cả ba lần VÌ MỘT SỐ ĐO. Ngõ ăn vào
    // bề NGANG của chính căn nhà (`unitW = lot × (1 − alley)`) còn vườn ăn bề SÂU, nên kỷ này
    // trả tiền cho HAI cột cùng lúc — chẩn đoán ấy có từ Phase 21 và vẫn đúng; thứ đổi là CÁCH
    // TRẢ. Trước đây tôi hạ VƯỜN cho đỡ tốn, nay hạ NGÕ, vì hai lý do đo được và một lý do lịch sử:
    // ⚠️ (1) HAI BẢNG SỐ CŨ Ở ĐÂY ĐỀU ĐO BẰNG BỘ KHỚP-ĐẤT HỎNG, ĐỪNG TRÍCH LẠI. Chúng ghi
    //     "0,18 → 89,3%" và "0,48 → 84,4%", nhưng bộ khớp khi ấy giải hình bao bằng một phép nội
    //     suy tuyến tính, mà hình bao thì KHÔNG tuyến tính và cũng KHÔNG đơn điệu (đo được:
    //     41% số ca trả-đất dựng ra căn nhà TO HƠN suất đất của nó, ca tệ nhất thò 0,53 ô). Tức
    //     phần lớn "chi tiết mái giữ được" ngày ấy là mái của những căn đang **lấn sang nhà bên**.
    //     Vá bộ khớp xong (xem `dungVuaDat` ở `block.js`) thì kỷ 6 rơi xuống **0,594** — DƯỚI sàn
    //     0,7 — và điều đáng nói là nó **chỉ 0,656 kể cả khi ép mọi vườn về 0**, tức vườn CHƯA
    //     BAO GIỜ là thủ phạm. Đúng bài học Phase 9B: một lời hứa đang xanh có thể đang sống nhờ
    //     chính khuyết tật mà ta sắp sửa.
    // ⚠️ (2) QUÉT LẠI TRÊN QUẦN THỂ THẬT, hai cột cùng lúc (`alley` × `yard`, bộ khớp MỚI). Ở
    //     `alley 0,10` thì cả vạt `yard 0,40…0,52` đều giữ ≥ 0,81 chi tiết mái (0,875 · 0,875 ·
    //     0,844 · 0,875 · 0,844 · 0,875 · 0,813) — BẢY giá trị liền nhau, tức một VẠT PHẲNG chứ
    //     không phải một điểm nhọn. Ở `alley 0,12` cùng vạt ấy nhấp nhô 0,750…0,813 và chỉ hai
    //     giá trị lọt cửa; `alley 0,16` và `0,18` thì gần như cả vạt DƯỚI sàn. Chọn vạt phẳng là
    //     có chủ đích: hình bao không đơn điệu nên một điểm nhọn là NHIỄU, không phải tín hiệu.
    // ⚠️ (3) VÀ NGÕ HẸP MỚI LÀ CÁI ĐÚNG LỊCH SỬ — chính dòng `note` bên dưới đã khai từ đầu:
    //     ranh giới giữa hai nhà làng Bắc Bộ là HÀNG RÀO CÂY quanh vườn, không phải một con ngõ.
    //     Ngõ xóm Bắc Bộ là lối đi lát gạch nghiêng kẹp giữa hai bờ tre, HẸP. Để kỷ này giữ con
    //     ngõ rộng nhất bảng (0,18 — gấp 1,8 lần kỷ đứng thứ hai) là đọc sai chính lời khai của
    //     nó. Ngân sách ngăn cách của làng nằm ở VƯỜN, nên `yard` giữ nguyên 0,48 (rộng thứ ba
    //     bảng) và `alley` về 0,10 (ngang kỷ 4, vẫn ở đầu bảng vì "quây lỏng" là có thật).
    // ⇒ Sau bản vá: **0,844 chi tiết mái · 2,00 suất đất mỗi ô · vườn hẹp nhất 21,1 điểm ảnh**
    // (ngưỡng mắt `EYE_PIXELS` = 4). ⚠️ ĐÂY LÀ `TRẦN LUÔN THẮNG SÀN` ở tầng BẢNG: đất không có
    // thì bảng nhường, chứ KHÔNG hạ sàn 0,7 của `block.test.js` (hạ là bỏ răng cho cả 15 kỷ).
    note: 'làng Bắc Bộ — nhà ba gian có sân vườn, ngăn bằng hàng rào cây, quây lỏng quanh ao',
  },
  7: {
    country: 'Ý',
    layout: 'organic', units: 7, attach: 'party', alley: 0.06, yard: 0, storey: 1.7, vary: 0.3,
    gableToStreet: false,
    // Insula La Mã là chung cư cho thuê cao 4–6 tầng, cao nhất thế giới cổ đại, và cao thấp lộn
    // xộn tới mức Augustus phải ra luật giới hạn chiều cao. `storey` cao nhất bảng thời cổ.
    note: 'insula / nhà tháp — chung cư cho thuê 4–6 tầng, ngõ chật, cao thấp lộn xộn',
  },
  8: {
    country: 'Bồ Đào Nha',
    layout: 'organic', units: 6, attach: 'party', alley: 0.05, yard: 0.24, storey: 1.58, vary: 0.16,
    gableToStreet: true,
    note: 'nhà phố Lisboa mặt tiền hẹp — ốp gạch men azulejo, mái dốc, dựng lại sau động đất 1755',
  },
  9: {
    country: 'Pháp',
    layout: 'organic', units: 6, attach: 'party', alley: 0.03, yard: 0.28, storey: 1.25, vary: 0.04,
    gableToStreet: false,
    // ⚠️ `vary` NHỎ NHẤT BẢNG, và đó là một sự thật lịch sử chứ không phải sự lười: quy chế
    // Haussmann bắt cả dãy phố cùng chiều cao, cùng cao độ ban công, cùng góc mái mansard.
    note: 'nhà phố Haussmann — cả dãy cùng chiều cao theo quy chế, mặt tiền đá liên tục',
  },
  10: {
    country: 'Anh',
    layout: 'grid', cols: 4, rows: 2, attach: 'party', alley: 0.04, yard: 0, storey: 1.7, vary: 0.06,
    gableToStreet: false,
    note: 'terrace đấu lưng thời công nghiệp — hai dãy chung tường hậu, ống khói lặp đều tăm tắp',
  },
  11: {
    country: 'Mỹ',
    layout: 'grid', cols: 4, rows: 2, attach: 'party', alley: 0.08, yard: 0.32, storey: 1.7, vary: 0.1,
    gableToStreet: false,
    note: 'dãy brownstone + khối chữ nhật dài kiểu Manhattan, có ngõ dịch vụ chạy sau lưng',
  },
  12: {
    country: 'Nga',
    layout: 'grid', cols: 3, rows: 4, attach: 'court', alley: 0.08, yard: 0.5, storey: 1.45, vary: 0.06,
    gableToStreet: false,
    note: 'khối nhà tập thể quây kín một sân trong — dvor, sân chung của cả khối',
  },
  13: {
    country: 'Nhật Bản',
    layout: 'grid', cols: 3, rows: 2, attach: 'party', alley: 0.07, yard: 0.38, storey: 1.28, vary: 0.18,
    gableToStreet: false,
    // Machiya quay mặt DÀI ra phố (hira-iri), nên `gableToStreet: false`; ngõ roji giữa hai dãy
    // hẹp tới mức chỉ vừa một người đi. Nhà gỗ thấp nên `storey` nằm ở nhóm thấp của bảng.
    note: 'machiya — nhà gỗ mặt phố mật độ cao, ngõ roji hẹp, không có sân trước',
  },
  14: {
    country: 'Singapore',
    layout: 'grid', cols: 4, rows: 2, attach: 'party', alley: 0.05, yard: 0.26, storey: 1.1, vary: 0.22,
    gableToStreet: false,
    note: 'dãy shophouse có hiên năm-bộ chạy suốt, xen khối cao tầng phía sau',
  },
  15: {
    country: 'UAE',
    layout: 'grid', cols: 3, rows: 4, attach: 'court', alley: 0.09, yard: 0.55, storey: 1.1, vary: 0.12,
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
  // TỪ CHỐI THẲNG, không rơi về 0. Một dòng quên khai `yard` mà lặng lẽ chạy như cũ thì cả kỷ ấy
  // quay về tấm-mái-liền, và không có gì đỏ lên — đúng bẫy `MIN_STONE` (Phase 9D) mà chính file
  // này đã cảnh báo ở đầu. Trần 0,7: cao hơn nữa thì căn nhà bị chính mảnh vườn của nó nuốt mất.
  if (!Number.isFinite(style.yard) || style.yard < 0 || style.yard > BLOCK_YARD_MAX) return false;
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
/**
 * Sân ăn mất bao nhiêu của mỗi trục — hàm THUẦN, và nó là chỗ duy nhất phát biểu luật ấy.
 *
 * `doc` = trục CHIỀU SÂU (trục mà nhà lùi vào, chừa vườn ở phía trong khu phố).
 * `ngang` = trục còn lại, tức bề ngang mặt tiền.
 *
 * ⚠️ VÌ SAO `party`/`court` CHỈ ĂN MỘT TRỤC. Bóp cả hai trục thì hai bức tường chung tách nhau ra
 * và cả dãy nhà phố biến thành một hàng hộp rời — tức là xoá đúng lời khai của 14/15 dòng bảng.
 * Ngoài đời cái vườn của một căn nhà phố nằm SAU LƯNG nó, không nằm bao quanh nó.
 *
 * ⚠️ `loose` chia đều cho hai trục bằng CĂN BẬC HAI, không phải chia đôi: `yard` là một phần DIỆN
 * TÍCH, mà diện tích thì đi theo tích hai cạnh. Nhân mỗi cạnh với `1 − yard/2` sẽ chừa ra nhiều
 * sân hơn số đã khai, và sai càng lớn khi `yard` càng lớn — đúng chỗ nó được dùng nhiều nhất.
 *
 * @param {object} style một dòng của `BLOCK_STYLES`
 * @returns {{doc:number, ngang:number, san:number}} hệ số giữ lại của từng trục, và `san` đã kẹp
 */
export function blockYardKeep(style = {}) {
  const y = Number.isFinite(style.yard) ? Math.max(0, Math.min(BLOCK_YARD_MAX, style.yard)) : 0;
  return { doc: 1 - y, ngang: 1, san: y };
}

export function deriveBlockUnits({ style, seed = 'block', blockW = 1, blockD = 1 } = {}) {
  if (!isValidBlockStyle(style)) return [];
  if (!(blockW > 0) || !(blockD > 0)) return [];
  return style.layout === 'organic'
    ? xepHuuCo(style, seed, blockW, blockD)
    : xepLuoi(style, seed, blockW, blockD);
}

/** Kỷ 10–15: lưới `cols × rows` do quy hoạch vạch ra. Đây là mã cũ, không đổi một luật nào. */
/**
 * Phần chiều sâu của suất đất mà CĂN NHÀ giữ lại — tức `1 − sân`, nhưng có một cái SÀN CỨNG.
 *
 * ⚠️ ĐÂY LÀ VẾ THỨ HAI CỦA `TRẦN LUÔN THẮNG SÀN`, VÀ BẢN ĐẦU QUÊN NÓ. Vòng `while` ở trên bớt
 * hàng/cột cho tới khi mỗi suất đủ rộng — nhưng nó **không thể bớt xuống dưới MỘT hàng**. Khi cả
 * khu phố chỉ còn một hàng mà kỷ ấy khai nhiều sân (kỷ 6 khai 0,58), phần còn lại cho căn nhà tụt
 * xuống 0,323 ô = **20,7 điểm ảnh**, dưới sàn 0,3276 — và cái sàn ấy không phải con số làm đẹp:
 * nó chính là `ROOFTOP_MIN_SPAN`, ngưỡng mà dưới đó `emitRooftop` TỪ CHỐI dựng chi tiết mái. Đo
 * được: kỷ 3 · 6 · 15 mất quá một phần ba chi tiết mái, trong im lặng.
 *
 * ⇒ Khi hai đại lượng tranh nhau một mảnh đất thì phải nói rõ **cái nào nhường**: căn nhà là cái
 * KHÔNG nhường (nó có sàn hiệu chuẩn bằng mắt), nên **SÂN nhường**. Một kỷ khai nhiều sân hơn chỗ
 * đất cho phép thì nó nhận đúng phần sân còn lại — chứ không phải một căn nhà bị bóp thành vệt.
 *
 * ⚠️ Và phải kẹp ở đây, TẠI CHỖ DÙNG, chứ không kẹp trong `blockYardKeep`: hàm ấy không biết suất
 * đất rộng bao nhiêu (nó chỉ đọc bảng), mà cái sàn thì là một QUAN HỆ với bề sâu suất đất — viết
 * nó thành một con số trong bảng là đúng bẫy Phase 7D.
 */
function docGiuLai(co, sauLo) {
  if (!(sauLo > 0)) return co.doc;
  return Math.min(1, Math.max(co.doc, MIN_UNIT_CELLS / sauLo));
}

function xepLuoi(style, seed, blockW, blockD) {
  const keep = 1 - style.alley;
  const co = blockYardKeep(style);
  // TRẦN THẮNG SÀN: bớt cột/hàng cho tới khi mỗi đơn vị — **SAU KHI ĐÃ CHỪA SÂN** — còn đủ rộng
  // để đọc ra là một căn nhà. Hỏi TRƯỚC khi chia, không bóp SAU khi chia: bóp sau thì căn nhà tụt
  // xuống dưới `MIN_UNIT_CELLS` mà không có gì đỏ lên, và cả kỷ ấy mất chi tiết mái trong im lặng
  // (đúng ca đã cắn ở Phase 14 §1(3)).
  let cols = style.cols;
  let rows = style.rows;
  while (cols > 1 && (blockW / cols) * keep * co.ngang < MIN_UNIT_CELLS) cols -= 1;
  while (rows > 1 && (blockD / rows) * keep * co.doc < MIN_UNIT_CELLS) rows -= 1;
  // Quây sân cần ít nhất 3×3 mới có lòng để chừa; co lại quá thì nó thành dãy chung tường.
  const attach = style.attach === 'court' && (cols < 3 || rows < 3) ? 'party' : style.attach;

  const pitchX = blockW / cols;
  const pitchZ = blockD / rows;
  // SUẤT ĐẤT (đã trừ ngõ) — khác với căn nhà đứng trên nó, và đây là chỗ hai khái niệm tách ra.
  const loW = pitchX * keep;
  const loD = pitchZ * keep;
  const unitW = loW * co.ngang;
  const unitD = loD * docGiuLai(co, loD);   // sân nhường, nhà KHÔNG nhường — xem `docGiuLai`

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
      const nhon = attach === 'loose' ? (pitchX - loW) * 0.5 : 0;
      const nhonZ = attach === 'loose' ? (pitchZ - loD) * 0.5 : 0;
      const loOx = (col - (cols - 1) / 2) * pitchX + signed(`${key}|ox`) * nhon;
      const loOz = (row - (rows - 1) / 2) * pitchZ + signed(`${key}|oz`) * nhonZ;
      // ⚠️ NHÀ LÙI VỀ PHÍA MÉP NGOÀI KHU PHỐ, VƯỜN CHẠY VÀO LÒNG KHU — đó là suất đất burgage, và
      // trên lưới thì "mép ngoài" đọc thẳng ra từ chỉ số HÀNG: hàng 0 giáp phố phía −z, hàng cuối
      // giáp phố phía +z. Một hàng duy nhất thì không có phía nào ngoài hơn phía nào ⇒ để hạt
      // giống chọn, chứ đừng mặc định một phía (mọi khu phố cùng quay một hướng là một cái lưới
      // mới, dựng lại đúng thứ vừa đi xoá).
      const huong = rows === 1
        ? (signed(`${key}|huong`) >= 0 ? 1 : -1)
        : (Math.sign(row - (rows - 1) / 2) || (signed(`${key}|huong`) >= 0 ? 1 : -1));
      const roi = attach === 'loose';
      const lui = (huong * (loD - unitD)) / 2;
      const mn = roi ? { xm: true, xp: true, zm: true, zp: true } : {
        xm: !coNha(col - 1, row),
        xp: !coNha(col + 1, row),
        zm: !coNha(col, row - 1),
        zp: !coNha(col, row + 1),
      };
      // ⚠️ MẶT QUAY VÀO SÂN ĐƯỢC MỞ LẠI. Nó bị `coNha` đánh dấu là tường chung vì hàng xóm áp vào
      // SUẤT ĐẤT; sau khi nhà lùi ra mép thì mặt ấy nhìn ra vườn nhà mình ⇒ nó ĐƯỢC có cửa sổ.
      // Quên vế này thì cả dãy quay lưng vào chính khu vườn vừa mở ra.
      const faces = (!roi && loD - unitD > 1e-6)
        ? { ...mn, ...(huong > 0 ? { zm: true } : { zp: true }) }
        : mn;
      out.push({
        index: out.length,
        col,
        row,
        ox: loOx,
        oz: loOz + lui,
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
        faces,
        // MẢNH ĐẤT TRỐNG của suất này — `block.js` lấy nó để dựng sân/vườn/rào. `null` khi kỷ ấy
        // khai `yard: 0` (Çatalhöyük gần như thế), chứ không phải một hình chữ nhật dày 0.
        yard: sanCuaLo({ san: co.san, loOx, loOz, loW, loD, unitW, unitD, huong, doc: false }),
        // ⚠️ CẢ SUẤT ĐẤT, TRƯỚC KHI SÂN ĂN VÀO — cùng hình dạng `{ox, oz, w, d}` với `yard`, vì
        // hai thứ ấy là hai mảnh của cùng một hình chữ nhật. `block.js` cần nó để TRẢ LẠI đất cho
        // căn nhà khi đo ra rằng cái sân vừa giết mất chi tiết mái. Không có nó thì tầng ngoài
        // phải SUY NGƯỢC vị trí suất đất từ `yard` + `ox`/`w`, tức chép lại một luật đã phát biểu
        // ở đây — đúng cái bẫy "một luật hai công thức" đã cắn dự án nhiều lần.
        // `faces` ở đây là mặt nạ khi căn nhà chiếm TRỌN suất đất — tức chưa mở lại mặt quay vào
        // vườn. Trả đất cho nhà thì nó lại áp vào hàng xóm, nên phải dùng mặt nạ NÀY, không phải
        // mặt nạ đã mở; quên vế ấy thì có cửa sổ mọc trên một bức tường chung.
        plot: { ox: loOx, oz: loOz, w: loW, d: loD, faces: mn },
      });
    }
  }
  return out;
}

/**
 * Hình chữ nhật đất trống của MỘT suất — hàm thuần, dùng chung cho cả hai kiểu xếp.
 *
 * `doc = true` nghĩa là nhà lùi theo trục X (suất đất nằm ngang), `false` là lùi theo trục Z.
 *
 * ⚠️ KHÔNG CÓ ĐẶC CÁCH CHO `loose`, VÀ ĐÓ LÀ MỘT BẢN VÁ ĐÃ ĐO. Bản đầu cho nhà rời đứng GIỮA suất
 * đất với vườn bao quanh — nghe rất đúng ("nhà rời thì phải có đất bốn phía"), và nó giết chính
 * thứ phase này đi mở ra: một cái VÀNH thì dày bằng NỬA hiệu số cạnh, nên muốn vành đủ dày cho
 * mắt đọc ra thì suất đất phải to gấp đôi ⇒ số suất tụt còn MỘT ở kỷ 6 (đo được 4,00 → 1,00
 * lô/ô). Hai lối thoát còn lại đều tệ hơn: hạ `yard` xuống ≤ 0,25 thì vành chỉ còn ~3 điểm ảnh —
 * **dưới ngưỡng mắt**, tức trả tam giác cho một mảnh vườn không ai thấy, đúng cái "khoảng giữa"
 * mà ADR-033 cấm; hoặc chấp nhận mỗi ô đúng một căn nhà, tức xoá luôn tầng khu phố của Phase 14.
 *
 * ⇒ `yard` ăn MỘT trục (chiều sâu) ở MỌI kiểu xếp, còn việc *"nhà rời thì không dính nhau theo bề
 * ngang"* là việc của `alley` — một cột đã có sẵn, đã khai đủ 15 dòng, và kỷ 6 đang khai cao nhất
 * bảng (0,18). Một knob một việc: `alley` = khe giữa hai nhà, `yard` = mảnh vườn. Gộp hai câu hỏi
 * ấy vào một con số là đúng cái bẫy "một trường gánh hai việc" đã cắn dự án bảy lần.
 */
function sanCuaLo({ san, loOx, loOz, loW, loD, unitW, unitD, huong, doc }) {
  if (!(san > 0)) return null;
  if (doc) {
    const w = loW - unitW;
    return w > 1e-6 ? { ox: loOx - (huong * unitW) / 2, oz: loOz, w, d: unitD } : null;
  }
  const d = loD - unitD;
  return d > 1e-6 ? { ox: loOx, oz: loOz - (huong * unitD) / 2, w: unitW, d } : null;
}

function xepHuuCo(style, seed, blockW, blockD) {
  const keep = 1 - style.alley;
  const co = blockYardKeep(style);
  // ⚠️ SÀN MẢNH PHẢI TÍNH CẢ PHẦN SÂN, VÀ ĐÂY LÀ CHỖ CƠ CHẾ NÀY THẬT SỰ SỐNG. Mảnh phải đủ rộng để
  // căn nhà bên trong nó — sau khi đã trừ ngõ VÀ trừ sân — vẫn trên sàn. Lấy hệ số NHỎ HƠN của hai
  // trục vì phép chia đệ quy không biết trước mảnh sẽ nằm ngang hay nằm dọc, nên phải chuẩn bị cho
  // ca xấu nhất; đoán sai chiều thì căn nhà rơi xuống dưới sàn và mất chi tiết mái trong im lặng.
  //
  // Hệ quả là kỷ nào khai nhiều sân thì ra ÍT suất đất hơn mà mỗi suất TO hơn — đó là ĐÚNG: một
  // cái làng có ít nhà to có vườn, một khu nhà trọ có nhiều nhà nhỏ không vườn. Cột `units` vì thế
  // sống lại theo chiều NGƯỢC với trực giác (`TECH_DEBT #88`).
  // ⚠️ SÀN MẢNH LÀ **HAI** CON SỐ CHỨ KHÔNG PHẢI MỘT. Mảnh phải đủ rộng để căn nhà bên trong nó —
  // sau khi đã trừ ngõ VÀ trừ sân — vẫn trên sàn; nhưng ở nhà chung tường thì sân chỉ ăn vào MỘT
  // trục, nên áp hệ số của trục ấy cho cả hai trục là siết gấp đôi.
  //
  // ⚠️ ĐÃ ĐO CÁI GIÁ CỦA VIỆC SIẾT GẤP ĐÔI, VÀ NÓ KHÔNG NHỎ: bản đầu của phase này dùng đúng MỘT
  // sàn `MIN / (keep × min(doc, ngang))` — nghe thận trọng, và nó kéo **kỷ 3·4·5·6 xuống ĐÚNG MỘT
  // suất đất mỗi khu phố**, tức xoá sạch cả tầng khu phố mà Phase 14 dựng ra. Một cái sàn đặt cho
  // "ca xấu nhất" khi ca ấy KHÔNG THỂ xảy ra thì không phải thận trọng — nó là một cái phễu ngược.
  const sanNgan = MIN_UNIT_CELLS / (keep * co.ngang);   // cạnh KHÔNG bị sân ăn
  const sanDai = MIN_UNIT_CELLS / (keep * co.doc);      // cạnh BỊ sân ăn
  // Sàn của một nhát cắt phụ thuộc cạnh CÒN LẠI: nếu cạnh kia đã đủ dài để gánh vai trục-bị-sân-ăn
  // thì mảnh này chỉ cần trên sàn ngắn; nếu không thì chính nó phải gánh vai ấy.
  const sanCat = (canhKia) => (canhKia >= sanDai ? sanNgan : sanDai);
  const catDuoc = (dai, ngan) => dai >= 2 * sanCat(ngan);
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
      if (!catDuoc(w, d) && !catDuoc(d, w)) continue;   // còn ít nhất MỘT trục cắt được
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
    // ⚠️ VÀ TRỤC ĐÃ CHỌN PHẢI TỰ NÓ ĐỦ DÀI. Bản đầu gác bằng một sàn CHUNG cho cả hai trục rồi
    // để hạt giống chọn trục — nên khi hai cạnh gần bằng nhau mà chỉ cạnh DÀI đủ chỗ, hạt giống
    // vẫn có thể chọn cạnh NGẮN và đẻ ra hai mảnh dưới sàn. Đo được ở kỷ 4 (2,4×1,6): hai suất
    // đất hụt 7,2 × 10⁻⁶ và 4,7 × 10⁻⁴ ô — nhỏ, nhưng nó là một lỗ hổng thật chứ không phải nhiễu
    // số thực, và `TRẦN LUÔN THẮNG SÀN` bắt được nó. Chọn trục TRƯỚC, rồi nếu trục ấy không đủ
    // dài thì đổi sang trục kia; cả hai không đủ thì mảnh này thôi chia.
    const canBang = Math.abs(w - d) < 0.12 * Math.max(w, d);
    let doc = canBang ? unit(`${seed}|truc|${lan}`) < 0.5 : w >= d;
    if (!catDuoc(doc ? w : d, doc ? d : w)) doc = !doc;
    const dai = doc ? w : d;
    const sanNay = sanCat(doc ? d : w);
    // Chỗ cắt lệch tâm. `lo`/`hi` là hai đầu mà cả hai nửa còn trên sàn; trong khoảng đó thì hạt
    // giống quyết. KHÔNG kẹp ra khỏi giữa: một nhát cắt rơi đúng giữa là chuyện bình thường, cái
    // làm nên bàn cờ là MỌI nhát cùng rơi giữa, mà điều đó không xảy ra được với hạt giống.
    const lo = sanNay / dai;
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
    const loOx = (r.x0 + r.x1) / 2;
    const loOz = (r.z0 + r.z1) / 2;
    const loW = rongManh * keep;
    const loD = sauManh * keep;
    const roi = style.attach === 'loose';
    // ⚠️ NHÀ LÙI THEO CẠNH DÀI CỦA SUẤT ĐẤT, KHÔNG PHẢI THEO MỘT TRỤC CỐ ĐỊNH. Suất đất burgage
    // dài và hẹp, nhà ngồi ở đầu NGẮN giáp phố còn vườn chạy hết cạnh DÀI — nên trục lùi chính là
    // cạnh dài của mảnh. Ở lưới thì hàng/cột đã nói ra điều đó; ở đây không có hàng cột nào, phải
    // ĐO. Lùi ra xa tâm khu phố, vì tâm khu phố là chỗ KHÔNG có phố.
    const doc = loW >= loD;
    const truc = doc ? loOx : loOz;
    const huong = Math.abs(truc) > 1e-6
      ? Math.sign(truc)
      : (signed(`${key}|huong`) >= 0 ? 1 : -1);
    const unitW = doc ? loW * docGiuLai(co, loW) : loW;
    const unitD = doc ? loD : loD * docGiuLai(co, loD);
    const lui = (huong * ((doc ? loW - unitW : loD - unitD))) / 2;
    const mn = roi
      ? { xm: true, xp: true, zm: true, zp: true }
      : { xm: !apVao('xm'), xp: !apVao('xp'), zm: !apVao('zm'), zp: !apVao('zp') };
    // Mặt quay vào sân được mở lại — xem chú thích cùng tên ở `xepLuoi`.
    const moRa = doc ? (huong > 0 ? 'xm' : 'xp') : (huong > 0 ? 'zm' : 'zp');
    const faces = (!roi && (doc ? loW - unitW : loD - unitD) > 1e-6) ? { ...mn, [moRa]: true } : mn;
    out.push({
      index: i,
      // Không có hàng cột thật, nhưng `block.js` dùng cặp này làm HẠT GIỐNG cho từng đơn vị, nên
      // chúng phải phân biệt được nhau. Cho cả hai bằng chỉ số là cách thẳng thắn nhất: nó nói
      // rằng ở đây mỗi đơn vị là một suất riêng, không thuộc hàng nào cũng không thuộc cột nào.
      col: i,
      row: i,
      ox: loOx + (doc ? lui : 0),
      oz: loOz + (doc ? 0 : lui),
      w: unitW,
      d: unitD,
      storey: style.storey * (1 + (unit(`${key}|h`) - 0.5) * style.vary),
      ry: style.gableToStreet ? Math.PI / 2 : 0,
      faces,
      yard: sanCuaLo({ san: co.san, loOx, loOz, loW, loD, unitW, unitD, huong, doc }),
      // Cả suất đất, trước khi sân ăn vào — xem chú thích cùng tên ở `xepLuoi`.
      plot: { ox: loOx, oz: loOz, w: loW, d: loD, faces: mn },
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
