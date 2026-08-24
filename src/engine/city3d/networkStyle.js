/**
 * networkStyle.js — 15 KỶ, 15 KIỂU QUY HOẠCH. Bảng này trả lời một câu mà chưa file nào trong dự
 * án trả lời: **"con đường ở nước ấy, thời ấy, có THẲNG không?"**
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY — MỘT TRỤC BẢN SẮC CHƯA BAO GIỜ TỒN TẠI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm: *"đường đi hiện tại chỉ là những đường thẳng, không giống đường ngoài đời, không uốn cong,
 * và nó cũng như quy hoạch quá — các thời trước làm gì có quy hoạch đường thẳng tấp thế"*.
 *
 * Lời ấy đúng từng chữ, và nó chỉ vào một chỗ trống trong kiến trúc chứ không phải một con số sai.
 * `streetStyle.js` (Phase 9D) đã mở mười trục cho **MẶT CẮT NGANG** của con đường — rộng bao nhiêu,
 * lát bằng gì, viên to cỡ nào, có bó vỉa không. Nhưng cả mười trục ấy nói về *một lát cắt*, và một
 * lát cắt thì không có hình dạng theo chiều dọc. **TIM ĐƯỜNG** — cái đường tâm chạy dọc con phố —
 * chưa bao giờ là một trục bản sắc: `terrainMesh.js` vẽ mọi lòng đường **chính giữa ô lưới**, nên
 * Göbekli Tepe 9500 năm trước và Dubai hôm nay dùng **cùng một tấm lưới bàn cờ hoàn hảo**.
 *
 * Đó là lý do 15 kỷ nhìn vào đâu cũng thấy "quy hoạch": không phải vì mạng đường được quy hoạch,
 * mà vì **mã dựng hình không có cách nào diễn đạt một con đường KHÔNG thẳng**.
 *
 * ⚠️ VÀ ĐÂY LÀ MỘT LỖI LỊCH SỬ, KHÔNG CHỈ LÀ MỘT LỖI MỸ THUẬT. Quy hoạch lưới vuông góc là một
 * phát minh có ngày tháng và có địa chỉ — Hippodamus xứ Miletus (thế kỷ 5 TCN), rồi trại quân La
 * Mã, rồi Chang'an nhà Đường, rồi Commissioners' Plan 1811 của Manhattan. Áp nó cho một làng đồ đá
 * mới là nói ngược lịch sử đúng kiểu mà `streetStyle.js` đã cấm khi nó cấm vạch kẻ ở kỷ đồ đá.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ CÁI TRẦN ĐÃ ĐO TRƯỚC KHI VIẾT MỘT DÒNG MÃ NÀO — VÌ SAO KHÔNG "THÊM Ô ĐƯỜNG"
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm cũng nói *"hiện tại ít đường quá"* và *"mở rộng đường đi"*. Luật của dự án bắt **đo trần
 * trước khi tiêu ngân sách cho một phase nội dung**, và phép đo ấy bác bỏ thẳng cơ chế THÊM Ô:
 *
 *   | thứ | số ô | phần của lưới 144 |
 *   |---|---:|---:|
 *   | ô đường hiện có          | 80 | 55,6% |
 *   | ô đã hứa cho kỳ quan     | 45 | (11 ô chồng lên đường) |
 *   | **ô còn trống**          | **30** | **20,8%** |
 *
 * Và đúng 30 ô trống ấy là **toàn bộ nhà dân của thành phố** (`DWELLING_PLOTS`). Nghĩa là mỗi ô
 * đường thêm vào là một khu nhà bị xoá — đây chính xác cái trần mà Phase 14 §1(3) đã đụng khi Đàm
 * đòi "thêm nhà", và câu trả lời khi ấy vẫn đúng nguyên cho lần này:
 *
 *   ⇒ **KHÔNG thêm ô. Đổi thứ NẰM TRONG một ô.**
 *
 * Một ô đường hiện dựng ra một dải thẳng nằm chính giữa. Nó có thể dựng ra một con đường LƯỢN, có
 * chỗ thắt chỗ phình — cùng số ô, cùng số lệnh vẽ, mà mắt đọc ra một thứ khác hẳn.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ HÌNH HỌC TỰ NÓ ÉP ĐÚNG LỊCH SỬ — VÀ ĐÂY LÀ PHẦN ĐẸP NHẤT CỦA BẢN THIẾT KẾ NÀY
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Một con đường chỉ lượn được trong phần ô mà chính nó chưa chiếm: `chỗ trống = 0,5 − nửa bề rộng
 * − vỉa hè`. Nên **đường càng rộng thì càng KHÔNG THỂ lượn**, không phải vì ai đó chọn thế mà vì
 * hết chỗ. Đối chiếu với lịch sử thì nó khớp một cách gần như đáng ngờ:
 *
 *   · kỷ 1 (lối mòn Göbekli Tepe, rộng 0,46 ô) → còn 0,27 ô để lượn — lượn thoải mái.
 *   · kỷ 12 & 15 (đại lộ Xô Viết / sa mạc, rộng 0,96 ô) → còn 0,02 ô — thẳng băng, không cãi được.
 *
 * ⇒ Bảng dưới đây **không cần** ép kỷ hiện đại phải thẳng; hình học đã ép sẵn. Cột `bend` chỉ nói
 * *"trong phần chỗ trống mà kỷ này có, nó dùng bao nhiêu"*.
 *
 * ⚠️ VÌ VẬY `bend` LÀ MỘT TỈ LỆ (0..1), KHÔNG PHẢI MỘT SỐ Ô. Đây là bài học Phase 7D áp ngay từ
 * lúc thiết kế thay vì sau khi trả giá: một lời hứa nói về QUAN HỆ ("lượn nhiều hơn đường kia")
 * thì phải viết thành một con số quan hệ. Khai `bend: 0,25 ô` sẽ chết trong im lặng đúng ngày có
 * ai chỉnh `avenue` của kỷ ấy — mà `avenue` đã bị chỉnh ở Phase 9D, 12 và 14.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * BA LỚP, LẦN THỨ MƯỜI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Cùng khuôn đã dùng cho `vernacularRoof` · `floraStyle` · `streetStyle` · `groundFloorStyle` ·
 * `roofStyle` · `settingStyle` · `hinterlandStyle` · `blockStyle` · `humanStyle`:
 *
 *   BẢNG (file này)  →  HÌNH (`roadPath.js`)  →  NGƯỜI ĐỌC (`terrainMesh.js`, `residents.js`)
 *
 * Mỗi dòng phải trả lời được *"đường phố ở nước ấy, thời ấy, do CÁI GÌ quyết định hình dạng?"* —
 * và `country` bị KHOÁ CỨNG vào `eraStyle.js` bằng test. Không có ràng buộc ấy thì 15 dòng là 15
 * lần chọn bừa, mà chọn bừa chính là thứ đã sinh ra 15 kỷ đường giống hệt nhau.
 *
 * ⚠️ `isValidNetworkStyle` **TỪ CHỐI THẲNG** dòng sai, KHÔNG tự chữa — đúng bẫy `MIN_STONE`
 * (Phase 9D) và ADR-026: tự chữa là cách một bảng 15 dòng lặng lẽ thoái hoá về 1 dòng.
 */

import { CITY_GRID_SIZE } from '../cityGrid';
import { parcelCapacity } from './parcelCapacity';

/**
 * NĂM KIỂU LƯỢN mà `roadPath.js` dựng được. Mỗi giá trị phải được ÍT NHẤT MỘT kỷ dùng — có test
 * đếm, vì một giá trị không kỷ nào dùng là một nhánh mã chưa bao giờ chạy (bài học "trục CHẾT",
 * Phase 11), và nó sẽ hỏng trong im lặng vào ngày đầu tiên có người khai nó.
 *
 * `grid`     — THẲNG. Quy hoạch bàn cờ có chủ ý: Chang'an nhà Đường, Commissioners' Plan 1811 của
 *              Manhattan, Jackson Plan 1822 của Singapore, siêu đô thị Xô Viết. Đây KHÔNG phải
 *              "chưa làm gì" — nó là một tuyên bố quyền lực, và nó đắt: Manhattan phải san phẳng
 *              cả một địa hình đồi để có được nó.
 * `axial`    — MỘT CUNG DÀI DUY NHẤT. Đường nghi lễ: thẳng về ý đồ nhưng cong nhẹ theo địa thế vì
 *              nó có trước máy trắc địa. Đường rước thành Ur, làng thợ Deir el-Medina, trục sa mạc.
 * `organic`  — LƯỢN TỰ DO, nhiều tần số chồng nhau. Đường không ai vẽ cả: nó là vệt chân người và
 *              súc vật đi mòn, rồi nhà xây bám theo. Trung cổ Đức, phố cổ Hà Nội, Edo, Firenze.
 * `terrace`  — GẤP KHÚC NGẮN RỒI GIỮ. Phố bám đường đồng mức trên sườn dốc: đi ngang một đoạn, rẽ,
 *              rồi lại đi ngang. Alfama (Lisbon) và phố công nghiệp Anh trên đồi Pennine.
 * `radial`   — LỆCH TĂNG DẦN THEO KHOẢNG CÁCH TỚI TÂM. Đại lộ toả ra từ quảng trường, đúng thứ
 *              Haussmann chọc xuyên qua Paris trung cổ: càng ra xa tâm càng doãng khỏi trục lưới.
 */
export const PLAN_KINDS = ['grid', 'axial', 'organic', 'terrace', 'radial'];

/**
 * SÀN VÀ TRẦN CỦA SỐ THỬA. Sàn 5 vì lưới phải chứa đủ 5 kỳ quan mỗi kỷ một thửa riêng; dưới 5 thì
 * hai kỳ quan dùng chung một thửa và mặt tiền của một trong hai biến thành sân sau. Trần 14 vì
 * `minSide` nhỏ nhất là 1 ô, và 12×12 chia mãi cũng chỉ ra được chừng ấy thửa còn dùng được.
 */
export const MIN_PARCELS = 5;
export const MAX_PARCELS = 14;

const PLAN_SET = new Set(PLAN_KINDS);

/**
 * TÁM TRỤC BẢN SẮC — **NÓI VỀ HÌNH DẠNG CỦA CẢ MẠNG ĐƯỜNG, KHÔNG PHẢI VỀ MÉP MỘT ĐOẠN ĐƯỜNG.**
 *
 * ⚠️ BỘ TRỤC NÀY ĐÃ THAY BỘ TRỤC CŨ, VÀ LÝ DO ĐÁNG GHI LẠI. Bản đầu có `coil` (bước sóng lượn) và
 * `ragged` (biến thiên bề rộng) — cả hai đều mô tả **mép của một đoạn đường bên trong ô của nó**.
 * Đàm nhìn kết quả và bác đúng chỗ: *"không phải kiểu đường lồi lõm, mà là dạng đường cong hay
 * không cong, như thể là có giao lộ, đường uốn quanh ấy"*. Hai trục cũ **về mặt cấu tạo không thể**
 * đổi được hình dạng mạng — dù chỉnh tới đâu thì nhìn từ trên xuống vẫn là 4 hàng × 4 cột.
 *
 * `plan`   — **KHUNG MẠNG mọc ra từ đâu**. Đây nay là trục MẠNH NHẤT, vì nó quyết định ô nào là
 *            đường chứ không chỉ quyết định con đường trông thế nào. Xem `roadPlan.js`.
 * `bend`   — **ĐỘ CONG của từng con đường** (0..1). 0 = kẻ bằng thước. Đây là "đường uốn quanh".
 * `arms`   — **SỐ ĐƯỜNG CHÍNH**: mấy nan toả từ chợ, mấy thềm trên sườn dốc, mấy trục xuyên tâm.
 * `loops`  — **SỐ VÒNG khép kín** (đường vành đai / vòng theo tường thành). 0 = không có vòng nào.
 * `tangle` — **ĐỘ RỐI**: bao nhiêu ngõ phụ mọc thêm ngoài khung chính, và chúng ngoằn ngoèo cỡ nào.
 *            Đây là thứ phân biệt một làng chài với Tokyo, dù cả hai đều `organic`.
 *
 * ── BA TRỤC THÊM Ở PHASE 21, VỀ **CÁCH CHIA ĐẤT** (ADR-064) ──────────────────────────────────
 * Năm trục trên trả lời *"con đường có hình gì"*. Chúng KHÔNG trả lời *"mảnh đất giữa hai con
 * đường to bằng nào"* — mà đó mới là thứ Đàm chỉ vào ở Phase 21: *"nhà vẫn xếp rất ngăn nếp trông
 * như quy hoạch"*. Một mạng đường cong hoàn hảo vẫn có thể chia ra 12 mảnh đất bằng chằn chặn.
 *
 * `parcels`  — **SỐ THỬA** mà lưới 12×12 được chia ra. Ít thửa = mỗi thửa to = làng; nhiều thửa =
 *              mỗi thửa nhỏ = phố. Đây là trục QUY MÔ, và nó thay cho `ROAD_LINES` cũ: số ô đường
 *              nay là HỆ QUẢ của việc chia đất, không phải một hằng số kẻ sẵn.
 * `sizeVary` — **ĐỘ CHÊNH GIỮA THỬA LỚN NHẤT VÀ NHỎ NHẤT** (0..1). 0 = chia đôi đúng giữa mỗi lần
 *              ⇒ mọi thửa bằng nhau (Manhattan). 1 = mỗi nhát cắt lệch hết cỡ ⇒ mảnh đất bé xíu
 *              nằm cạnh khu vườn lớn (phố cổ). **ĐÂY LÀ TRỤC MẠNH NHẤT chống lại chữ "ngăn nếp".**
 * `minSide`  — **CẠNH NGẮN NHẤT một thửa được phép có** (ô). Sàn cứng: chia nhỏ hơn nữa thì thửa
 *              không còn chỗ cho một khu phố nào, và ta sẽ có một ô đất rỗng đội lốt một khu nhà.
 *
 * ⚠️ `sizeVary` PHẢI ĂN KHỚP VỚI `plan`, và `isValidNetworkStyle` chặn cả hai chiều: một kỷ khai
 * `grid` mà `sizeVary` cao là bảng đang tự mâu thuẫn (bàn cờ theo định nghĩa là các ô BẰNG NHAU),
 * còn `organic` mà `sizeVary` thấp thì cái nhãn `organic` chỉ là chữ trang trí.
 *
 * ⚠️ `arms` · `loops` · `tangle` CÙNG QUYẾT ĐỊNH SỐ Ô ĐƯỜNG, mà số ô đường thì trừ thẳng vào đất
 * xây nhà (144 ô, 45 ô hứa cho kỳ quan, phần còn lại chia nhau). Khai tay quá thì thành phố hết
 * chỗ ở; khai ít quá thì mỗi phiên không còn ô đường nào để mở (lời hứa "thành phố lớn thêm" của
 * Phase 6C). `isValidNetworkStyle` chặn cả hai đầu bằng `MIN_ROAD_CELLS`/`MAX_ROAD_CELLS`.
 */
export const NETWORK_STYLES = {
  1: {
    country: 'Thổ Nhĩ Kỳ',
    // ⚠️ KỶ DUY NHẤT KHÔNG HỀ CÓ KHÁI NIỆM "ĐƯỜNG", VÀ ĐÓ LÀ SỰ THẬT KHẢO CỔ NỔI TIẾNG NHẤT VỀ NÓ.
    // Çatalhöyük (7100 TCN) không có một con phố nào: nhà xây dính liền nhau thành một khối, cửa
    // trổ trên MÁI, người ta đi lại TRÊN NÓC NHÀ và tụt xuống bằng thang. Göbekli Tepe thì chỉ có
    // vệt mòn giữa các vòng cột. Vậy nên đây phải là kỷ lượn nhiều nhất bảng — một vệt chân người
    // đi mòn thì không có lý do gì để thẳng, và nó cũng chẳng có ai để mà thẳng cho.
    // ⚠️ `minSide: 2` CHỨ KHÔNG PHẢI 3, VÀ LÝ DO LÀ MỘT SỐ ĐO. Çatalhöyük là một khối nhà dính
    // liền rất lớn, nên phản xạ đầu tiên là khai `minSide: 3` (thửa dày). Đo ra thì nó phản tác
    // dụng: với 6 thửa trên một lưới 12×12, sàn 3 ô khoá chặt tới mức bộ chia không còn chỗ để
    // chênh lệch, và kỷ này — kỷ khai `sizeVary` CAO NHẤT BẢNG (0,86) — dựng ra tỉ số thửa
    // lớn/nhỏ chỉ **1,60**, phẳng nhất cả 15 kỷ. Tức một con số nói "rất đa dạng" bị một con số
    // khác nuốt mất trong im lặng. Hạ về 2 thì nó lên **6,00** — cao nhất bảng, đúng thứ tự phải
    // có. Khối nhà Çatalhöyük dính liền nhưng KHÔNG đều: nó là một mớ ô lớn nhỏ chen nhau.
    note: 'Çatalhöyük/Göbekli Tepe — chưa có "đường": vệt chân người mòn giữa các lều, đi cả trên mái',
    plan: 'organic', bend: 0.85, arms: 3, loops: 0, tangle: 0.20,
    parcels: 6, sizeVary: 0.86, minSide: 2,
  },
  2: {
    country: 'Ai Cập',
    // ⚠️ NGƯỢC HẲN KỶ 1, VÀ ĐÂY LÀ CHỖ DỄ ĐOÁN SAI NHẤT CẢ BẢNG: "cổ hơn ⇒ lộn xộn hơn" là SAI.
    // Deir el-Medina (làng thợ xây lăng mộ, ~1500 TCN) là một trong những khu định cư CÓ QUY HOẠCH
    // sớm nhất từng đào được: một con phố thẳng duy nhất chạy giữa, nhà xếp thành hai dãy đều nhau
    // hai bên, cả làng bọc trong một bức tường. Nó do NHÀ NƯỚC dựng cho công nhân, nên nó thẳng.
    // Vẫn `axial` chứ không `grid` vì nó chỉ có MỘT trục, không phải một tấm lưới.
    // ⚠️ `minSide: 3` — DÀY NHẤT BẢNG, và nó là chỗ đúng cho giá trị ấy. Nhà Deir el-Medina là
    // nhà ỐNG SÂU: mặt tiền hẹp mở ra con phố duy nhất, còn thân nhà chạy lùi vào tới 4–5 phòng
    // nối tiếp (phòng trước · phòng khách có bàn thờ · kho · bếp có sân sau). Một thửa mỏng 2 ô
    // không chứa nổi hình dạng ấy. Đây cũng là kỷ khai `sizeVary` thấp thứ nhì (0,28) nên sàn dày
    // không nuốt mất gì — nhà nước dựng thì các thửa vốn phải bằng nhau.
    note: 'Deir el-Medina — làng thợ do nhà nước dựng: một phố thẳng duy nhất, hai dãy nhà đều nhau',
    plan: 'axial', bend: 0.22, arms: 2, loops: 0, tangle: 0.05,
    parcels: 7, sizeVary: 0.28, minSide: 3,
  },
  3: {
    country: 'Iraq',
    // Ur có HAI hình thái sống cạnh nhau, và đó chính là điều đáng kể: đường rước (Processional
    // Way) rộng và thẳng phục vụ nghi lễ, còn khu ở (khu AH mà Woolley đào) là một mê cung ngõ hẹp
    // ngoằn ngoèo không theo trục nào. `plan: 'axial'` kể vế thứ nhất (một xương sống thẳng), còn
    // `tangle` 0,35 kể vế thứ hai — đám ngõ phụ mọc thêm ngoài cái xương sống ấy.
    note: 'thành Ur — đường rước thẳng cho kiệu thần, nhưng khu ở là mê cung ngõ hẹp ngoằn ngoèo',
    plan: 'axial', bend: 0.40, arms: 4, loops: 1, tangle: 0.35,
    parcels: 8, sizeVary: 0.44, minSide: 2,
  },
  4: {
    country: 'Trung Quốc',
    // ⚠️ THẲNG TUYỆT ĐỐI — 0,00, VÀ ĐÂY LÀ MỘT TRONG HAI KỶ DUY NHẤT ĐƯỢC PHÉP KHAI SỐ 0.
    // Chang'an đời Đường là thành phố quy hoạch nghiêm ngặt nhất từng tồn tại trước thời hiện đại:
    // 108 phường có tường bao riêng, 9 đại lộ bắc-nam và 12 đại lộ đông-tây, tất cả vuông góc tuyệt
    // đối, đại lộ Chu Tước rộng 150m chạy thẳng từ cổng nam tới hoàng thành. Nó là một tuyên ngôn
    // vũ trụ quan (thành phố là hình ảnh của trật tự trời đất), không phải một tiện ích giao thông.
    // Cho nó lượn dù chỉ một chút là nói dối về chính điều làm nó nổi tiếng.
    // ⚠️ `loops: 1` — CÓ VÀNH ĐAI, và đây là chỗ dễ bỏ sót nhất của kỷ này. Chang'an có tường
    // thành ngoài dài 36 km bao trọn 84 km²; ngay bên trong tường ấy chạy một con phố vành đai
    // phục vụ tuần phòng và cổng thành. Một thành phố mà đặc điểm nổi bật nhất là BỨC TƯỜNG thì
    // không thể khai `loops: 0`.
    // ⚠️ VÀ `minSide` PHẢI LÀ 2, KHÔNG PHẢI 3, VÌ MỘT LÝ DO SỐ HỌC CHỨ KHÔNG PHẢI MỸ THUẬT: có
    // vành đai thì bộ chia chỉ còn làm việc trên lưới 10×10, mà `parcelCapacity(10, 10, 3)` chỉ
    // ra **4** thửa — dưới con số 9 mà bảng khai. Bộ chia khi ấy bí ở nhát cắt đầu tiên và cả kỷ
    // rơi về MỘT thửa duy nhất, im lặng tuyệt đối. `isValidNetworkStyle` nay từ chối thẳng tổ hợp
    // ấy (xem gác `parcelCapacity` cuối file) nên nó không thể tái diễn.
    note: 'Chang\'an nhà Đường — 108 phường có tường bao, lưới vuông góc tuyệt đối, đại lộ Chu Tước rộng 150m',
    plan: 'grid', bend: 0.00, arms: 4, loops: 1, tangle: 0.00,
    parcels: 9, sizeVary: 0.06, minSide: 2,
  },
  5: {
    country: 'Đức',
    // ⚠️ NAN QUẠT TOẢ TỪ CHỢ, KHÔNG PHẢI LƯỚI. Phố trung cổ Đức không do ai vẽ: nó mọc từ đường
    // mòn dẫn tới chợ, rồi nhà bám theo ranh giới thửa đất, rồi thửa đất bám theo địa hình. Nên
    // `plan: 'radial'` với `arms` 5 và một vòng khép kín (tường thành) là cách kể đúng nhất —
    // thứ mà khách du lịch gọi là "quyến rũ" còn người đánh xe ngựa gọi là địa ngục.
    note: 'phố cổ trung cổ — ngõ mọc theo ranh thửa đất và đường ra chợ, đổi hướng vài mét một lần',
    plan: 'radial', bend: 0.75, arms: 5, loops: 1, tangle: 0.30,
    parcels: 6, sizeVary: 0.82, minSide: 2,
  },
  6: {
    country: 'Việt Nam',
    // "36 phố phường" mọc trên nền các làng nghề ven sông Tô Lịch và bám theo đê — tức hình dạng
    // của nó do MẶT NƯỚC quyết định, không do người vẽ. Hàng Bạc, Hàng Đào, Hàng Buồm đều cong
    // theo dòng chảy cũ. Bước sóng dài hơn kỷ 5 vì một khúc sông thì lượn thoải hơn một ranh thửa.
    // ⚠️ `minSide: 1` — MỎNG NHẤT BẢNG cùng kỷ 8·11·13·14, và ở đây nó là một sự thật kiến trúc
    // chứ không phải một cách để nhét thêm thửa. Nhà ống Hà Nội cổ có mặt tiền chỉ 2–4 m (thuế
    // đánh theo BỀ NGANG mặt phố, nên ai cũng xây hẹp và sâu tới 60–80 m), và cả một dãy phố nghề
    // là nhiều dải đất rất mảnh xếp cạnh nhau. Sàn 2 ô gộp chúng lại thành những khối vuông vức —
    // đúng cái vẻ "quy hoạch" mà phase này sinh ra để xoá.
    note: 'phố cổ Hà Nội — phố bám theo đê và dòng sông Tô Lịch cũ, cong theo dòng nước chứ không theo trục',
    plan: 'organic', bend: 0.80, arms: 4, loops: 1, tangle: 0.55,
    parcels: 7, sizeVary: 0.74, minSide: 1,
  },
  7: {
    country: 'Ý',
    // ⚠️ KỶ CHỒNG BA LỚP, NÊN NÓ PHẢI Ở GIỮA BẢNG CHỨ KHÔNG Ở ĐẦU NÀO. Firenze là trại quân La Mã
    // (lưới vuông) → bị lấp đầy bằng ngõ trung cổ (lượn) → rồi Phục Hưng chọc vài trục thẳng qua.
    // Ba lớp ấy còn nguyên trên bản đồ hôm nay. Biên độ vừa phải là cách duy nhất trung thực để kể
    // một thành phố vừa có lưới vừa không.
    note: 'Firenze — lưới trại quân La Mã bị ngõ trung cổ lấp đầy, rồi Phục Hưng chọc trục thẳng qua',
    plan: 'organic', bend: 0.55, arms: 4, loops: 1, tangle: 0.40,
    parcels: 9, sizeVary: 0.6, minSide: 2,
  },
  8: {
    country: 'Bồ Đào Nha',
    // ⚠️ KỶ NÀY LÀ **TRƯỚC** ĐỘNG ĐẤT 1755, NÊN NÓ KHÔNG ĐƯỢC LÀ LƯỚI. Đây là chỗ rất dễ sai: cái
    // lưới Pombaline nổi tiếng của Lisbon chỉ ra đời SAU khi động đất san phẳng thành phố. Kỷ 8 là
    // thời Manueline (Đại Hàng Hải, ~1500), tức Lisbon của Alfama: phố leo sườn đồi dốc đứng, bám
    // đường đồng mức, đi ngang một đoạn rồi bẻ góc rồi lại đi ngang. Đó đúng định nghĩa `terrace`.
    note: 'Alfama trước động đất 1755 — phố leo sườn đồi theo đường đồng mức, đi ngang rồi bẻ góc',
    plan: 'terrace', bend: 0.60, arms: 4, loops: 0, tangle: 0.30,
    parcels: 12, sizeVary: 0.72, minSide: 1,
  },
  9: {
    country: 'Pháp',
    // ⚠️ KỶ DUY NHẤT DÙNG `radial`, VÀ NÓ LÀ LÝ DO KIỂU LƯỢN ẤY TỒN TẠI. Haussmann (1853–70) không
    // nắn phố cũ cho thẳng — ông CHỌC những đại lộ mới xuyên qua thành phố trung cổ, toả ra từ các
    // quảng trường tròn (Étoile có 12 đại lộ toả ra). Nên đặc trưng của nó không phải "cong" mà là
    // "doãng khỏi trục lưới, càng ra xa tâm càng doãng". Bước sóng dài nhất bảng: một đại lộ
    // Haussmann chạy hàng cây số mà không đổi hướng một lần nào.
    note: 'Paris Haussmann — đại lộ chọc xuyên phố trung cổ, toả ra từ quảng trường tròn (Étoile: 12 nhánh)',
    plan: 'radial', bend: 0.30, arms: 6, loops: 1, tangle: 0.10,
    parcels: 9, sizeVary: 0.55, minSide: 2,
  },
  10: {
    country: 'Anh',
    // Phố công nghiệp Manchester/Leeds: nhà liền dãy back-to-back dựng hàng loạt bởi tư nhân, mỗi
    // chủ đất một mảnh, nên các dãy khớp nhau rất tệ ở chỗ giáp ranh — thẳng trong từng đoạn ngắn
    // rồi lệch hẳn ở ranh thửa. Đó là `terrace` theo đúng cả hai nghĩa của từ (thềm dốc, và nhà
    // liền dãy). Biên độ thấp hơn Lisbon vì đồi Pennine thoải hơn sườn Alfama nhiều.
    note: 'phố công nghiệp — dãy nhà back-to-back do nhiều chủ đất dựng, khớp lệch nhau ở ranh thửa',
    plan: 'terrace', bend: 0.35, arms: 5, loops: 0, tangle: 0.20,
    parcels: 11, sizeVary: 0.3, minSide: 2,
  },
  11: {
    country: 'Mỹ',
    // ⚠️ KỶ THỨ HAI VÀ CUỐI CÙNG ĐƯỢC KHAI `bend: 0`. Commissioners' Plan 1811 chia Manhattan
    // thành 12 đại lộ × 155 phố cắt vuông góc, và để làm được điều đó người ta đã BẠT PHẲNG cả một
    // địa hình đồi đá — tức cái lưới này thắng địa hình chứ không nhượng bộ nó. `tangle` 0 vì
    // lưới ấy không chừa chỗ cho một con ngõ tự phát nào.
    note: 'Manhattan — Commissioners\' Plan 1811: 12 đại lộ × 155 phố vuông góc, bạt phẳng cả đồi đá để có lưới',
    plan: 'grid', bend: 0.00, arms: 4, loops: 0, tangle: 0.00,
    parcels: 14, sizeVary: 0.05, minSide: 1,
    diagonal: true,
  },
  12: {
    country: 'Nga',
    // Quy hoạch Xô Viết: siêu ô phố (mikrorayon) với vài đại lộ rất rộng thay vì nhiều phố nhỏ —
    // đại lộ để duyệt binh, không để đi lại. Thẳng vì nó là công cụ của nhà nước, y hệt Chang'an,
    // chỉ khác động cơ. ⚠️ Nhưng KHÔNG khai 0: khai `grid` với một chút biên độ để nó vẫn phân biệt
    // được với kỷ 4 và 11 nếu ngày nào `avenue` của nó hẹp lại. Hình học hiện đã ép nó gần như
    // thẳng rồi (đại lộ rộng 0,96 ô ⇒ chỉ còn 0,02 ô chỗ trống), nên con số này gần như chỉ là
    // một lời khai về Ý ĐỊNH, và đó là chủ đích.
    // ⚠️ `loops: 1` — MOSCOW LÀ *THÀNH PHỐ VÀNH ĐAI* ĐIỂN HÌNH CỦA THẾ GIỚI, và khai 0 ở đây là
    // bỏ sót đúng đặc điểm ai cũng nhận ra nó: Бульварное кольцо (Vành đai Đại lộ, trên nền tường
    // thành Bely Gorod thế kỷ 16), Садовое кольцо (Vành đai Vườn, trên nền luỹ Zemlyanoy Gorod),
    // rồi МКАД. Bản đồ Moscow đọc ra là những vòng tròn đồng tâm quanh Kremlin.
    // ⚠️ `parcels: 6` — ÍT NHẤT BẢNG cùng kỷ 1 và 5, và nó ĐÚNG theo đúng nghĩa đen của cái tên:
    // *микрорайон* là một siêu ô phố 10–60 ha có trường, nhà trẻ, cửa hàng nằm TRONG nó, tức mỗi
    // ô phố lớn gấp nhiều lần một block Manhattan. Chang'an chia 108 phường; Moscow Xô Viết thì
    // chia ÍT mảnh và mỗi mảnh TO. Khai 9 như trước là kể ngược câu chuyện.
    note: 'siêu ô phố Xô Viết — vài đại lộ rất rộng để duyệt binh thay cho nhiều phố nhỏ',
    plan: 'grid', bend: 0.10, arms: 3, loops: 1, tangle: 0.00,
    parcels: 6, sizeVary: 0.1, minSide: 2,
  },
  13: {
    country: 'Nhật Bản',
    // ⚠️ DÒNG NÀY TỪNG VIẾT SAI THỜI, VÀ CÁCH BẮT ĐƯỢC ĐÁNG GHI LẠI. Bản đầu tôi ghi "Edo
    // jōkamachi — phố quanh lâu đài cố ý ngoằn ngoèo để chặn quân địch". Câu ấy đúng về lịch sử
    // Nhật Bản và SAI về kỷ này: `eraStyle.js` khai landmark của kỷ 13 là **tháp nang Nakagin**
    // (Tokyo 1972), còn `streetStyle.js` khai `paving: 'asphalt'` với vạch sang đường — tức đây là
    // Nhật Bản HIỆN ĐẠI, cách Edo hơn một thế kỷ. Ba bảng cùng nói về một kỷ mà tôi suýt để chúng
    // kể ba câu chuyện khác nhau (đúng bài học ADR-045: *hai bảng nói về cùng một sự thật vật lý
    // mà chưa bao giờ được đặt cạnh nhau*).
    //
    // Sửa cho đúng thời thì kết luận KHÔNG đổi, chỉ có lý do đổi — và lý do mới còn hay hơn: Tokyo
    // hiện đại vẫn là một trong những mạng đường ít quy hoạch nhất trong các đô thị lớn, vì bản đồ
    // án tái thiết Ishikawa sau 1945 gần như bị bỏ, nên thành phố mọc lại TRÊN ĐÚNG ranh thửa cũ
    // của Edo. Phố hẹp, cong, phần lớn không có tên (địa chỉ đánh theo ô phố chứ không theo phố).
    // ⚠️ `minSide: 1` — thửa nhỏ nhất chỉ một ô. Đây KHÔNG phải một con số vặn cho vừa cái trần:
    // Tokyo là quê hương của *kyōshō jūtaku* (nhà siêu nhỏ trên mảnh đất dưới 50 m²), hệ quả trực
    // tiếp của việc thừa kế ranh thửa Edo cộng thuế thừa kế buộc chia nhỏ đất. Không nơi nào trong
    // bảng này có thửa nhỏ hơn thế, và đó chính là điều làm kỷ 13 khác kỷ 11 dù cả hai đều đông đúc.
    note: 'Tokyo hiện đại — dựng lại trên đúng ranh thửa Edo sau 1945, phố hẹp và cong, phần lớn không tên',
    plan: 'organic', bend: 0.70, arms: 5, loops: 1, tangle: 0.75,
    parcels: 12, sizeVary: 0.66, minSide: 1,
  },
  14: {
    country: 'Singapore',
    // Jackson Plan 1822 (Raffles) chia thành phố thành các khu sắc tộc trên một lưới vuông rất
    // nghiêm. Hiện đại thì thêm đường cao tốc chạy cong theo địa hình đảo. Biên độ nhỏ nhưng KHÁC 0
    // vì đảo Singapore có đồi và bờ biển, còn Manhattan thì đã bị bạt phẳng — hai kiểu "lưới" khác
    // nhau ở đúng chỗ ấy.
    // ⚠️ `minSide: 1` — Jackson Plan là một thành phố NHÀ PHỐ: mặt tiền hẹp (thuế đánh theo bề
    // ngang), thửa sâu, ô phố nhỏ và dày. Lưới của nó nghiêm chứ không lớn; giữ `minSide: 2` thì
    // Singapore ra cùng cỡ ô phố với Trường An, mà hai nơi ấy khác nhau đúng ở chỗ này.
    note: 'Jackson Plan 1822 — lưới khu sắc tộc rất nghiêm, nay thêm cao tốc uốn theo bờ đảo',
    plan: 'grid', bend: 0.25, arms: 4, loops: 1, tangle: 0.05,
    parcels: 12, sizeVary: 0.2, minSide: 1,
  },
  15: {
    country: 'UAE',
    // Trục sa mạc: Sheikh Zayed Road chạy thẳng hàng chục cây số song song bờ biển, siêu ô phố hai
    // bên. `axial` chứ không `grid` vì Dubai không có lưới — nó có MỘT trục xương sống và mọi thứ
    // treo vào đó. Biên độ nhỏ, bước sóng rất dài: một đại lộ sa mạc có uốn thì cũng uốn cả cây số.
    note: 'trục Sheikh Zayed — một xương sống thẳng chạy song song bờ biển, siêu ô phố treo hai bên',
    plan: 'axial', bend: 0.20, arms: 3, loops: 1, tangle: 0.05,
    parcels: 8, sizeVary: 0.26, minSide: 2,
  },
};

/**
 * ⚠️ SỐ KỶ ĐƯỢC PHÉP KHAI `bend: 0` — MỘT CON SỐ TRONG BÀI TEST LÀ CÁI HẸN GIỜ DUY NHẤT CHẠY ĐƯỢC.
 * Thẳng tuyệt đối là một lời khai MẠNH (nó nói "nước này thời này quy hoạch bàn cờ có chủ ý"), và
 * nó cũng là cách rẻ nhất để một kỷ né toàn bộ việc phải có bản sắc. Nên nó được đếm: kỷ thứ ba
 * khai 0 thì test đỏ, mà một trong hai kỷ này bỏ số 0 thì test cũng đỏ.
 */
export const RULER_STRAIGHT_ERAS = [4, 11];

/**
 * Bảng có hợp lệ không. **TỪ CHỐI THẲNG, KHÔNG TỰ CHỮA** — xem chú thích đầu file.
 */
export function isValidNetworkStyle(style) {
  if (!style || typeof style !== 'object') return false;
  if (typeof style.country !== 'string' || style.country.length === 0) return false;
  if (typeof style.note !== 'string' || style.note.length === 0) return false;
  if (!PLAN_SET.has(style.plan)) return false;
  if (!Number.isFinite(style.bend) || style.bend < 0 || style.bend > 1) return false;
  if (!Number.isFinite(style.arms) || style.arms < 2 || style.arms > 8) return false;
  if (!Number.isFinite(style.loops) || style.loops < 0 || style.loops > 3) return false;
  if (!Number.isFinite(style.tangle) || style.tangle < 0 || style.tangle > 1) return false;
  if (!Number.isInteger(style.parcels) || style.parcels < MIN_PARCELS || style.parcels > MAX_PARCELS) return false;
  if (!Number.isFinite(style.sizeVary) || style.sizeVary < 0 || style.sizeVary > 1) return false;
  if (!Number.isInteger(style.minSide) || style.minSide < 1 || style.minSide > 4) return false;
  // ⚠️ HAI CHIỀU, KHÔNG PHẢI MỘT. Bàn cờ theo định nghĩa là các ô BẰNG NHAU, nên `grid` mà chia
  // đất lệch là bảng tự mâu thuẫn; ngược lại `organic` mà chia đều thì cái nhãn ấy chỉ là chữ
  // trang trí, và ta sẽ dựng ra đúng thứ Đàm bác ở Phase 21 trong khi bảng vẫn báo "hợp lệ".
  if (style.plan === 'grid' && style.sizeVary > 0.25) return false;
  if (style.plan === 'organic' && style.sizeVary < 0.45) return false;
  /**
   * ⚠️ **SỐ THỬA PHẢI VỪA MẢNH ĐẤT CÒN LẠI SAU KHI TRỪ VÀNH ĐAI — và đây là một QUAN HỆ, không
   * phải một cái trần chung.** `MAX_PARCELS = 14` là trần của cả lưới 12×12 ở `minSide` nhỏ nhất;
   * nó không nói gì về một kỷ khai `minSide: 3` (trần thật 9) hay một kỷ khai `loops: 1` (vành đai
   * ăn hết viền ngoài ⇒ chỉ còn 10×10 để chia). Khai vượt thì bộ sinh **chỉ có thể dựng ra ít
   * hơn**, và trước Phase 21 nó làm vậy trong im lặng: kỷ 13 và 14 khai 12 thửa trên một mảnh chứa
   * tối đa 9. Hỏi thẳng `parcelCapacity` — cùng một hàm mà `cityPlan` dùng, nên không thể có hai
   * câu trả lời cho cùng một câu hỏi.
   */
  const canh = style.loops > 0 ? CITY_GRID_SIZE - 2 : CITY_GRID_SIZE;
  if (style.parcels > parcelCapacity(canh, canh, style.minSide)) return false;
  // ⚠️ Kỷ khai `grid` mà lại lượn mạnh là bảng đang tự mâu thuẫn: `plan` nói "bàn cờ có chủ ý" còn
  // `bend` nói "ngoằn ngoèo". Một trong hai đang nói dối, và không có cách nào biết cái nào —
  // nên chặn ngay tại bảng thay vì để nó dựng ra một thứ không ai giải thích được.
  if (style.plan === 'grid' && style.bend > 0.25) return false;
  return true;
}

const FALLBACK = NETWORK_STYLES[1];

export function getNetworkStyle(era) {
  return NETWORK_STYLES[era] ?? FALLBACK;
}
