# Technical Debt Log — Pomodoro DC

> Mọi nợ kỹ thuật đã biết PHẢI nằm ở đây — không được để chỉ tồn tại trong trí nhớ của một phiên
> AI cụ thể. Đây là một phần bắt buộc của Project Governance Protocol (xem `CLAUDE.md`).
>
> **Quy tắc xử lý khi phát hiện nợ kỹ thuật mới**: nếu rủi ro thấp và có thể xử lý ngay trong phạm
> vi công việc đang làm → xử lý luôn, không cần mở mục riêng. Nếu rủi ro trung bình/cao hoặc ngoài
> phạm vi công việc hiện tại → PHẢI thêm một mục vào file này trước khi kết thúc phiên, không được
> bỏ qua.
>
> **Ngưỡng "Maintenance Sprint"**: khi số mục có Priority = High hoặc Critical vượt quá **8–10
> mục**, HOẶC khi một module cụ thể đã trải qua ≥3 lần vá lỗi/refactor nhỏ trong lịch sử gần đây
> mà không được refactor triệt để, phải CHỦ ĐỘNG đề xuất mở một "Maintenance Sprint" (nêu rõ mục
> tiêu/phạm vi/lợi ích/rủi ro/tiêu chí hoàn thành) thay vì tiếp tục cộng thêm tính năng mới.
>
> **Trạng thái ngưỡng hiện tại (2026-08-27 tối, sau ADR-061 "tách đã-mời khỏi đã-xem")**:
> **#87 ĐÃ ĐÓNG cùng ngày mở** — báo cáo tuần thôi tự bật, và luật mức độ làm phiền của ADR-060 nay
> **không còn ngoại lệ nào**. Vẫn **1 mục Priority High còn mở** (#53), **0 mục Critical** → xa
> ngưỡng Maintenance Sprint.
>
> *(mốc trước)* **(2026-08-27 tối, sau ADR-060 "một ngôn ngữ hình cho phần thưởng")**: thêm **#87**
> (báo cáo tuần vẫn tự bật sáng thứ Hai) ở mức **Low**.
>
> *(mốc trước)* **(2026-08-27, sau khi viết lại `ActionButton`)**: thêm **#86**
> (137 nút tự vẽ không đọc token skin) ở mức **Medium** — vẫn **1 mục Priority High còn mở**
> (#53), **0 mục Critical** → xa ngưỡng Maintenance Sprint.
>
> *(mốc trước)* **Trạng thái ngưỡng (2026-08-24 chiều, sau ADR-059)**: thêm **#84** (kỷ 1 và 2 thấp đi

> *(mốc trước)* **Trạng thái ngưỡng (2026-08-24, sau Phase 21 — HỢP NHẤT hai nhánh)**: phiên này không
> mở mục nợ mới và không đóng mục nào — nó gộp hai bộ sinh bố cục đã giải cùng một bài toán hai
> lần. `buildRoadPlan` cùng năm bộ dựng khung của ADR-059 **đã bị xoá**; nay `buildCityPlan` (chia
> thửa đệ quy, ADR-066) quyết CHỖ CẮT còn `arcTrace` (ADR-059) quyết HÌNH DẠNG nét cắt — xem
> ADR-064. Hệ quả phải biết: **mọi bảng số đo trên một trong hai nhánh cũ đều đã lạc hậu** (quần
> thể ô nhà dân đi 371 → 432 → **476**), nên đừng chép cột "sau" của Phase 19 hay Phase 20 làm mốc
> nền — tự đo lại (bài học `#43`). Con số ngưỡng thì KHÔNG đổi: vẫn **0 Critical**, **2 mục đúng
> chữ `High`** (`#14`, `#53`) ⇒ **dưới ngưỡng 8–10, KHÔNG cần Maintenance Sprint**.

> **(Mốc trước) 2026-08-24 tối (Phase 20)**: Phase 20 **MỞ 1 mục** (`#90` — khu phố
> làm 4 kỷ thấp đi + kỷ 6 mất chi tiết mái) và **KHÔNG đóng mục nào**. `#89` vẫn MỞ nhưng đã nhẹ
> đi: cổng qua ngưỡng (11,33 → **12,44** ✓) nhờ một dải KHÔNG liên quan tới nguyên nhân, còn dải
> TRỜI — cần gạt thật — vẫn đứng yên ở 4,05. `#52` cũng nhẹ đi (đã vá kiểu báo oan trên ảnh
> nhìn-từ-trên-xuống) nhưng nguyên nhân vết rách vẫn chưa truy được. Đếm lại theo đúng cách đã ghi
> bên dưới: **80 mục · 60 còn mở · 0 Critical**; đếm **đúng chữ `High`** ra **2** (`#14`, `#53`),
> đếm **gộp cả `Medium-High`** ra **6** (`#3`, `#13`, `#14`, `#15`, `#53`, `#89`) — `#90` là
> Medium nên không vào cả hai. Cả hai con số vẫn **dưới ngưỡng 8–10** ⇒ **KHÔNG cần Maintenance
> Sprint**.


> **(Mốc trước) 2026-08-24 chiều (ADR-059)**: thêm **#84** (kỷ 1 và 2 thấp đi
> ~4% sau khi ô nhà dân thành khu phố — đã đếm tường minh) ở mức **Low**; **#85 mở rồi ĐÓNG ngay
> trong phiên** (`road-bend.mjs` đo một đại lượng mà ADR-059 đã thay — và trong lúc vá thì lộ ra
> `--selftest` của nó ĐỎ trên một mạng đường lành, vì đối chứng hỏi sai đại lượng). Đếm lại toàn file bằng cách quét trường
> `**Priority**` của TỪNG mục: **1 mục Priority High còn mở** (#53), **0 mục Critical** → xa ngưỡng
> 8–10 mục, KHÔNG cần Maintenance Sprint.
> **(2026-08-24 tối muộn, sau ADR-058)**: thêm **#83** (ngưỡng "lượn
> bao nhiêu thì mắt đọc ra" chưa hiệu chuẩn) ở mức **Low** — không đụng ngưỡng Maintenance Sprint.
> **(2026-08-24 tối, sau ADR-057)**: **#82 ĐÃ ĐÓNG** — chân giải bằng
> khớp ngược nên cả ba chiều bị cấm đều thành miễn phí. (Ghi chú cũ giữ lại bên dưới.)
> **(2026-08-24 sáng, sau ADR-056)**: thêm **#82** (bộ khớp chỉ có một trục
> quay ⇒ hông không lắc ngang, đai hông không xoay) ở mức **Low**. Trước đó: **#80** (cư dân chiếm
> 0,29% khung hình ⇒ chi tiết cơ thể chỉ đọc được ở cận cảnh) ở mức **Medium** và **#81** (mũ có
> chỏm thừa hưởng phép phóng đại của cái đầu) ở mức **Low**. Đếm lại toàn file bằng cách quét trường
> `**Priority**` của TỪNG mục: **1 mục Priority High còn mở** (#53, đang đóng dần), **0 mục
> Critical** → xa ngưỡng 8–10 mục, KHÔNG cần Maintenance Sprint. ⚠️ Con số này đếm bằng cách quét trường `**Priority**` của TỪNG mục, không chép lại từ
> dòng cũ — dòng ngưỡng bên dưới đã đứng yên từ 2026-08-16 trong khi file nở từ #33 lên #78, đúng
> kiểu "một con số tự trấn an" mà `CLAUDE.md` bắt phải kiểm như mọi con số khác.
>
> **(2026-08-16, sau Phase 9D)**: **#30 và #27 đã ĐÓNG CẢ HAI**
> — đúng như hai mục ấy đã tự nối cứng, chúng là một bài toán duy nhất (*màu là trục DUY NHẤT mang
> bản sắc mặt đường*) và được giải cùng lúc bằng cách mở thêm chín trục cấu trúc, chứ không phải
> bằng cách chỉnh lại con số nào. Nay còn **1 mục High** (#14) + **2 mục Medium-High** (#3, #13) +
> **1 mục Medium-High chờ Đàm quyết** (#24) = 4 → xa ngưỡng 8–10 mục, KHÔNG cần Maintenance Sprint.
>
> **Cập nhật 2026-08-21 (Phase 14 §1(3), hình thái khu phố — MỚI NHẤT)**: **MỞ #77**
> (`ROOFTOP_MIN_SPAN` là mức tuyệt đối ⇒ 9/15 kỷ mất một phần chi tiết mái khi nhà dân được chia
> nhỏ; giữ 313/371 ô = 84% — Medium). **RÀ SOÁT #76 đúng hẹn** (Review Trigger của nó là "ngay khi
> bắt đầu §1(3)"): phân bố mái nhà dân KHÔNG đổi, nhưng số khối nhìn thấy tăng từ 371 lên 1812 ⇒
> **Severity Low → Medium**, hoãn có lý do ghi rõ, đặt Review Trigger mới. Nay **2 mục High**
> (#14 · #53), 0 Critical ⇒ vẫn xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Mốc trước) Cập nhật 2026-08-21 (Phase 14 §1(2), kim tự tháp + ziggurat)**: **MỞ #75** (ziggurat
> kỷ 3 đã có hình ĐÚNG nhưng tỉ lệ mái/thân chỉ 34,6% ⇒ mắt đọc ra "cao ốc đội mũ"; đây là bài toán
> KHỐI TÍCH chứ không phải bài toán MÁI — Medium, cố ý hoãn) và **MỞ #76** (mái NHÀ DÂN chỉ có 3 giá
> trị cho 15 kỷ, trong khi mái kỳ quan đã có 10 — Medium, phải gộp vào §1(3)). Cả hai đều Medium ⇒
> **số mục High vẫn là 2** (#14 · #53), 0 Critical ⇒ vẫn xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Mốc trước) Cập nhật 2026-08-21 (Phase 13 VIỆC B, vùng phụ cận)**: **MỞ #74** (vùng phụ cận
> không lớn lên theo số phiên ⇒ tín hiệu quy mô nằm NGOÀI vòng lặp phần thưởng — Medium, CHỜ ĐÀM
> QUYẾT, cùng một câu hỏi với #14). **CẬP NHẬT #53**: hướng Đàm chọn (LẤP) nay đã được thực hiện ở
> phần *dấu vết con người*, và ba con số cũ của mục ấy đã được ĐO LẠI. Số mục High vẫn là 2
> (#14 · #53) ⇒ xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Mốc trước) Cập nhật 2026-08-21 (Phase 13 §2–§3, đo mốc nền)**: **MỞ #71** (khu 3×3 giữ chỗ cho
> HÌNH CHIẾU chứ không cho một ô ⇒ VIỆC A giải phóng 12,2 ô/kỷ chứ không phải 40 — Medium, CHỜ ĐÀM),
> **MỞ #72** (cổng (M2) đã đạt sẵn 15/15 ở mọi mức sàn ⇒ không có răng — Medium, CHỜ ĐÀM) và **MỞ
> #73** (camera buộc cứng vào `gridSize` — Low, cố ý hoãn theo đúng chỉ thị §5 của Đàm). Cả ba đều
> Medium/Low ⇒ **số mục High vẫn là 2** (#14 · #53), 0 Critical ⇒ vẫn xa ngưỡng 8–10, KHÔNG cần
> Maintenance Sprint. ⚠️ Không mục nào được đóng bằng cách nới ngưỡng; hai mục #71 và #72 chính là
> hai điều kiện DỪNG mà Đàm đặt sẵn trong §7, và chúng đã kích hoạt đúng như dự phòng.
>
> **(Mốc trước) Cập nhật 2026-08-21 (ADR-048, «nhớ giá trị nút lưới nhiễu»)**: **MỞ #70** — không có
> cổng nào canh THỜI GIAN dựng cảnh, nên chính bản vá "xoá cái bệ" đã ship kèm một hồi quy 1,7 lần
> trong im lặng (đã vá, xem ADR-048). Priority Medium ⇒ **số mục High vẫn là 2** (#14 · #53), 0
> Critical ⇒ vẫn xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Mốc trước) Cập nhật 2026-08-21 («XOÁ CÁI BỆ»)**: đếm lại bằng máy toàn bộ file ⇒ **2 mục High
> còn mở** (#14 · #53), 0 mục Critical ⇒ **xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint**. (Con số
> "3 mục High" của hai mốc trước đếm cả **#32**, mà #32 đã ở trạng thái Resolved từ 2026-08-17 —
> đính chính, không phải mục nào vừa được đóng.) Trong phiên này: **MỞ #68** (chỉ số bệ chia cho độ
> dốc trong lưới ⇒ ba kỷ cố ý phẳng luôn điểm cao — Low, đã có cột thứ hai để đọc thay) và **MỞ #69**
> (`terrain-score --ngoai` trả về NaN ở 13/15 kỷ vì tiền đề `settle` đã bị gỡ — Low, công cụ đã tự
> khai bệnh). **CẬP NHẬT #53**: nửa "địa thế theo kỷ" nay đã đi thêm một bước lớn — cái BỆ (mặt bàn
> vuông nổi lên) đã bị xoá ở **15/15 kỷ theo cổng mắt**, nhưng **ba con số của #53 (21% khung · 35,1%
> đất trơ · 63,0% là vành ngoài) CHƯA được đo lại** sau ADR-046 nên mục vẫn để **Open**, không tự
> đóng. **KHÔNG mục nào bị đóng bằng cách nới ngưỡng.** ⚠️ Nhắc lại một sự thật đã đo: **kỷ 5 vẫn
> hiện một đường hào VUÔNG** — đó là hình dạng NƯỚC (`#65`, nửa mỹ thuật của `#64`), **không** phải
> một bậc địa hình, nên nó KHÔNG được tính là "bệ chưa xoá xong".


> **(Mốc trước) 2026-08-24 (Phase 19)**: Phase 19 **ĐÓNG 2 mục** (`#24` khung hình cắt công
> trình · `#75` ziggurat đọc ra là khối đội mũ) và **MỞ 1** (`#89`, trục chặng ngày dưới ngưỡng mắt
> — cái giá của ADR-061, đang chờ Đàm chọn hướng). Đếm lại bằng cách quét trường `**Priority**` của
> TỪNG mục rồi loại mục đã đóng: **79 mục · 59 còn mở · 0 Critical**. High thì phải nói rõ cách
> đếm, vì đây đúng chỗ dòng này đã trôi một lần: đếm **đúng chữ `High`** ra **2** (`#14`, `#53`);
> đếm **gộp cả `Medium-High`** ra **6** (`#3`, `#13`, `#14`, `#15`, `#53`, `#89`). Cả hai con số
> đều **dưới ngưỡng 8–10** ⇒ **KHÔNG cần Maintenance Sprint**. ⚠️ Lần trước dòng này ghi "1 mục
> High" mà không nói đếm kiểu gì, nên không ai tái lập được — một con số nghiệm thu phải đi kèm
> cách đo ra nó, kể cả khi con số ấy chỉ nằm trong một dòng tài liệu.

> **(Mốc trước) Cập nhật 2026-08-20 (§1(B))**: đếm lại ⇒ **3 mục High còn mở** (#14 · #32 · #53),
> 0 mục Critical ⇒ **xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint**. Trong phiên §1(B): **MỞ #66**
> (kỷ 12 không phản ứng với hạt giống nhiễu — Low, đã đo là dưới ngưỡng mắt) và **MỞ LẠI MỘT PHẦN
> #59** cho kỷ 4 và 5 (cổng "thấy nước" tệ đi vì một bản vá ĐÚNG về vật lý; nguyên nhân khác hẳn ba
> kỷ 6·7·10 nên hướng chữa cũng khác ⇒ **CHỜ ĐÀM QUYẾT**). Không mục nào bị đóng bằng cách nới ngưỡng.
>
> **(Mốc trước) Cập nhật 2026-08-20 (nghiệm thu Bước C)**: đếm lại bằng máy toàn bộ file ⇒ **3 mục
> High còn mở** (#14 · #32 · #53), 0 mục Critical ⇒ **xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint**.
> Trong phiên này: **ĐÓNG #56** (12 kỷ chưa dựng nước) và **ĐÓNG #62** (tiền đề sai — kỷ 4 chưa bao
> giờ vượt cổng); **MỞ #63** (phép tia mù với cây cối ⇒ cổng nước thật là 5/14 chứ không phải 11/14),
> **#64** (kỷ 5 là một hòn đảo — khuyết tật SẢN PHẨM thật, đã xác nhận bằng ảnh), **#65** (`canal`
> và `estuary` không có hình học riêng); **CẬP NHẬT #55** (trục chặng 13,96 — đã chạm điều kiện
> "< 14", nhưng chẩn đoán cũ bị chính số đo bác bỏ) và **#61** (phép thay thế "chiều dài đường bờ"
> đã ĐO và PHẢI BÁC — nó tương quan NGƯỢC với khả năng đọc ra). Bốn mục **#55 · #61 · #64 · #65**
> đều đã chuẩn bị sẵn phương án, **CHỜ ĐÀM QUYẾT**, không tự chọn.
>
> **Cập nhật 2026-08-20 (Đàm trả lời bốn mục — mới nhất)**: **ĐÓNG #64** (kỷ 5 nay có eo đất rộng
> 1,40 ô = `2×(MEANDER_NECK − SHORE_BAND)` và hào đã bo góc: tỉ số chéo/trục 1,3543 → 1,0215; 7 phép
> phá đều đỏ đúng chỗ đã nêu trước). **#61** thôi là một mục nợ — cổng 5% GIỮ NGUYÊN, và con số thật
> *"5/14 đủ diện tích · **14/14 đọc ra được** (tương phản 30,8–115,5 trên ngưỡng mắt 12)"* nay được
> ghi như một **SỰ THẬT ĐÃ ĐO**, không phải một câu hỏi treo. **#55 HOÃN** (đơn thuốc cũ đã bị số đo
> bác bỏ; mặt trận hình ảnh sắp tới rất có thể tự nâng dải trời + dải thành phố ⇒ đo lại SAU). **#65
> HOÃN** tới sau mặt trận hình ảnh, và nay nó **gánh thêm nửa còn lại của #64** (hình `meander` vẫn
> là một vành đai đều bề rộng ôm quanh hình vuông, chưa đọc ra là một khúc suối).
>
> **Cập nhật 2026-08-20 (chốt #57 — `worldYaw`)**: **ĐÓNG #57**, mở **#59**. Đàm bác cả bốn hướng
> đã đề xuất (*"KHÔNG SỬA CAMERA, KHÔNG SỬA `side`. SỬA THỨ THỨ BA"*) — cả bốn đều hy sinh một
> trong hai vế, trong khi thứ sai là **quan hệ giữa chúng không ai sở hữu**. Đóng bằng ADR-041.
> #59 là phần TRẦN của cùng bài toán: ba kỷ nước hẹp (6, 7, 10) không đạt cổng 5% ở BẤT KỲ góc nào
> — biết TRƯỚC khi Bước C tiêu ngân sách, đúng bài học §2-C. Nay còn **1 mục High** (#14) +
> **2 mục Medium-High** (#3, #13) + **1 chờ Đàm** (#24) + **#59 Medium** → xa ngưỡng 8–10.

> **Cập nhật 2026-08-18 (Việc 1 — chốt #38)**: **ĐÓNG #38** ngay trong ngày mở. Đàm bác đề xuất
> "nâng trần chung lên 14" và chọn **15 mốc riêng từng kỷ** + đối chứng bắt buộc; hoá ra cách ấy
> **không cần đụng `materials.js`** (cổng chỉ ĐỌC bảng vật liệu), nên cái tưởng là blocker thật ra
> là hệ quả của việc đề xuất sai giải pháp. Nay còn **1 mục High** (#14) + **2 mục Medium-High**
> (#3, #13) + **1 mục Medium-High chờ Đàm quyết** (#24) = 4 → xa ngưỡng 8–10, KHÔNG cần Maintenance
> Sprint.
>
> **Cập nhật 2026-08-18 (Phase 12 / Việc 1 — đường sá, nguyên nhân 1)**: **MỞ #42, Priority
> Medium** — vỉa hè bị cái kẹp `walk ≤ 0,5 − half` bóp trong im lặng trên ĐẠI LỘ ở **8/15 kỷ**, tệ
> nhất còn **11%** bề rộng đã khai (kỷ 12 khai "vỉa hè mênh mông" mà dựng ra 0,02 ô). Phát hiện
> trong lúc sửa mép đường; phần chặn lời hứa "hết bậc" đã sửa ở ADR-031, phần còn lại là quyết định
> mỹ thuật ⇒ chờ Đàm. Nay còn **1 High** (#14) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết**
> (#24, #41, #42) = 6 → vẫn dưới ngưỡng 8–10, chưa cần Maintenance Sprint, nhưng **đã có ba mục
> liên tiếp bị chặn bởi cùng một lý do (quyết định mỹ thuật)** — nếu con số này lên 4 thì nên gộp
> thành một lượt hỏi Đàm duy nhất thay vì hỏi lẻ.
>
> **Cập nhật 2026-08-19 (§3a — sai số hộp bao)**: **ĐÓNG luôn câu hỏi hộp bao, nhưng KHÔNG theo
> cách cố vấn đoán.** Cố vấn bảo *"giữ hộp bao, đo sai số một lần, dưới ~5 điểm phần trăm thì đóng
> vĩnh viễn"*. Đo ra **11,10 đpt trung bình, tới 24,47 đpt** — không đóng được, phải sửa. Tách ba
> nguồn: **6,11 đpt** do LUẬT TÔ *"ô mẫu bị chạm vào là tô trọn"* (không liên quan gì tới hộp bao —
> đó là sai số của chính cái bút vẽ) · **4,86 đpt** do tô hộp bao CẢ công trình (sân giữa bốn tháp
> góc bị tính là nhà) · **0,13 đpt** do hình từng khối. ⇒ Phần cố vấn dự đoán là nguồn sai số hoá ra
> là phần **duy nhất không đáng lo**. `planCoverage` nay tô **đa giác đáy thật, luật tâm ô, lưới 16
> mẫu/ô**; bản cũ giữ lại tên `planCoverageCu` chỉ để đối chứng. ⚠️ **Bảng mật độ mặt bằng cũ
> (26,6 / 48,8 / 72,4%) KHÔNG so trực tiếp được** với bảng mới (**20,1 / 37,6 / 55,8%**).
> Khoá bằng `scripts/planCoverage.test.js` (5 bài, 6/7 phép phá đỏ đúng chỗ đã nêu trước; phép phá
> thứ 7 không đỏ và đã đo chứng minh nó là TỊNH TIẾN lưới lấy mẫu chứ không phải sai số).
>
> **Cập nhật 2026-08-19 (§1 — vá #49)**: **ĐÓNG #49** (ảnh nay cắt đúng hộp bao canvas qua CDP
> `clip`, không còn cờ đoán nào) và **MỞ #50, Priority Medium** — `md5sum` ảnh dựng đổi theo TẢI
> MÁY (±1 trên ~2% điểm ảnh), nên nó chỉ chứng minh được một chiều. Số mục High/Critical KHÔNG đổi:
> **1 High** (#14) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết** (#24, #41, #42) = 6, vẫn
> dưới ngưỡng 8–10.
>
> **Cập nhật 2026-08-19 (VIỆC 2 Bước B — mặt nước)**: **MỞ #56** (Low, dở dang CÓ CHỦ Ý — 12 kỷ khai
> có nước mà chưa dựng hình, đã khoá bằng `assert.deepEqual(ERAS_WITH_WATER_GEOMETRY, [12, 14])`),
> **#57** (**High**, chờ Đàm quyết — camera mặc định quay lưng lại bờ nước; kỷ 14 chỉ thấy 0,09% mặt
> biển trong khi trần là 31,43%) và **#58** (Medium — ảnh rộng >1300px có thể nhiễm một khối chữ
> nhật mà cổng chống-rách không thấy). ⚠️ **#57 là mục High THỨ HAI**, nên nay còn **2 High** (#14,
> #57) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết** (#24, #41, #42) + **2 Medium** (#43, #58)
> = 9 → **ĐÃ CHẠM DẢI NGƯỠNG 8–10**. Nhưng đọc kỹ thì 4/9 mục đang chờ **quyết định của Đàm** chứ
> không chờ công sức kỹ thuật (#57, #24, #41, #42), tức một Maintenance Sprint sẽ không đụng được
> vào chúng. ⇒ **Đề xuất đúng không phải mở Sprint mà là gom MỘT lượt hỏi Đàm duy nhất** — đúng
> điều bản cập nhật 2026-08-18 đã dự báo (*"nếu con số này lên 4 thì nên gộp thành một lượt hỏi
> duy nhất thay vì hỏi lẻ"*); con số ấy nay **đúng là 4**.
>
> **Cập nhật 2026-08-18 (Phase 12 — đo mốc nền)**: **MỞ #43, Priority Medium** — `PERFORMANCE.md`
> KHÔNG có gì máy đọc được canh, và nó đã trôi thật: Phase 11-B sửa hình học mái rồi không cập nhật
> tài liệu, để **6/15 kỷ sai số tam giác** suốt từ đó. Cột lệnh vẽ thì có `drawCallBudget.test.js`
> canh nên vẫn đúng — tức chỗ có test thì không trôi, chỗ không có test thì trôi, ngay trong cùng
> một bảng. Nay còn **1 High** (#14) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết** (#24, #41,
> #42) + **1 Medium** (#43) = 7 → vẫn dưới ngưỡng 8–10, nhưng chỉ còn cách một mục.
>
> **Cập nhật 2026-08-18 (Phase 11 — mái, ĐO ẢNH XONG)**: **MỞ #41, Priority Medium** — phase thêm
> 110.076 tam giác lên mái mà **bản quét 15 kỷ vẫn không phân biệt được với bản trước** (90/90 ô
> dưới ngưỡng mắt 12, trung vị 2,2), tức **KHÔNG đạt** điều kiện nghiệm thu Đàm đặt ra. Chi tiết có
> thật ở thang gần (1,2–8,4% điểm ảnh ở khung app; 15,1% khi zoom sát mái kỷ 9) nhưng không sống
> sót tới thang quét. Đo được thêm một quy luật dùng được cho Phase 12: **thứ phá ĐƯỜNG VIỀN sống
> sót, thứ chỉ thêm BỀ MẶT thì không** — kỷ 8 tốn nhiều hình học nhất (+48,5%) mà đổi ít nhất
> (1,2%). ⛔ Cách chữa là quyết định MỸ THUẬT ⇒ **chờ Đàm**, không tự phóng to. Nay còn **1 High**
> (#14) + **2 Medium-High** (#3, #13) + **2 chờ Đàm quyết** (#24, #41) = 5 → vẫn xa ngưỡng 8–10.
>
> **Cập nhật 2026-08-18 (Phase 11 — mái)**: **MỞ #39 và #40**, cả hai Priority **Low**. #39 =
> `crownWeight` là trục mỏng (6/105 cặp) và với `barrel` thì bước lượng hoá còn rộng hơn cả dải hợp
> lệ — đã khoá sự thật ấy bằng một `assert` tự đỏ nếu có kiểu thứ hai rơi vào. #40 = `parts.js`
> không có `rx`/`rz` nên ngói ống là phép xấp xỉ. Cả hai đều là **giới hạn đã biết có điều kiện xem
> lại**, không phải lỗi. Nay còn **1 mục High** (#14) + **2 Medium-High** (#3, #13) + **1
> Medium-High chờ Đàm quyết** (#24) = 4 → xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **Cập nhật 2026-08-18 (Phase 10, Bước 2)**: **ĐÓNG #36** — cả 15 kỷ nay đều có cửa ra vào thật,
> kể cả kỷ 1 và 2. **MỞ #38** (Priority Low-Medium): đo đủ 15 kỷ lần đầu tiên thì lộ ra **kỷ 10 =
> 14 lệnh vẽ**, tức vượt cái trần "13" mà cổng nghiệm thu đang dùng — nhưng nó **đã như vậy từ
> trước Phase 10** (đo trên `HEAD` cũng ra 14), nên đây là một **con số nền chưa từng được đo**,
> không phải hồi quy. Sửa nó phải đụng `materials.js`, nằm ngoài phạm vi file được phép của chương
> trình hiện hành ⇒ ghi nợ, không tự sửa. Ngoài ra Bước 2 phát hiện hai chuyện đáng ghi nhưng cả
> hai đều đã xử lý ngay trong phiên nên không thành nợ: (a) kỷ 14 khai `doorWidth` vượt trần khiến cả
> kỷ ấy **mất cửa trong im lặng** — validator từ chối đúng, `emitGroundFloor` trả `false` đúng, và
> không gì đỏ lên; nay có một assert bắt "khai hợp lệ nhưng không dựng ra khối nào"; (b) kỷ 4 và
> kỷ 6 chỉ khác nhau **1/8 trục** tầng trệt — sửa BẢNG (kỷ 4 lùi cửa sâu hơn, mở rộng hơn, đúng
> quy chế điện cung đình) chứ không hạ sàn. Số mục High vẫn là **1** (#14) — #38 là Low-Medium nên
> không đổi ngưỡng; tổng vẫn **5 mục**, vẫn xa ngưỡng 8–10.
>
> **(Ảnh chụp trước đó, Phase 10 Bước 1)**: mở **#36** (Priority **Medium** — kỷ 1 và 2 vẫn chưa
> có cửa; nguyên nhân gốc đã sửa, tự đóng khi Bước 2 chạy) và **#37** (Priority **Low** — cửa sổ
> không xoay theo độ nghiêng thân nhà, sai số hiện dưới một điểm ảnh). Không mục nào là High/
> Critical ⇒ số mục High vẫn là **1** (#14), vẫn xa ngưỡng.
>
> ⚠️ **Phase 9D KHÔNG mở mục nợ mới**, nhưng có ghi hai bài học vào `CLAUDE.md` (công cụ đo tự chế
> nói dối lần thứ 20 và 21 — cả hai đều nằm trong công cụ vừa viết ra trong chính phiên ấy).
>
> **Cập nhật 2026-08-17 (Performance Gate)**: mở **#31** (Priority **Low** — bản đồ bóng sống sót
> qua `city.dispose()`; app hiện KHÔNG dính vì mỗi cảnh một renderer riêng, nhưng là mìn hẹn giờ
> nếu sau này có ai dùng lại renderer giữa các kỷ) và **#32** (đồng hồ đo HUD báo thiếu 56% số tam
> giác — **ĐÃ SỬA ngay trong phiên**, ghi lại vì nguyên nhân gốc là một hình dạng sai đã tái diễn
> lần thứ hai). Số mục High/Critical **KHÔNG đổi**: vẫn 1 mục High (#14) + 3 mục Medium-High
> (#3, #13, #24) → xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Ảnh chụp trước đó, sau Phase 9B)**: thêm **#30** (Medium-High —
> mặt đường render DƯỚI ngưỡng mắt đọc được xét riêng vật liệu; đã có bản vá đo xong nhưng CỐ Ý
> chưa ship vì nó làm đỏ một lời hứa đang có). ⚠️ **#30 và #27 nay là MỘT cặp phải làm cùng nhau** —
> #30 phơi ra rằng lời hứa "15 kỷ ra 15 mặt đường" xưa nay chỉ đạt nhờ **3% biên**, và đạt được
> chính nhờ khuyết tật mà #30 phải sửa. Nay là **1 mục High** (#14) + **4 mục Medium-High**
> (#3, #13, #24, #30) = 5 → vẫn CHƯA đạt ngưỡng 8–10 mục để đề xuất Maintenance Sprint, nhưng đã
> đi được nửa đường tới đó; nếu phase sau lại thêm một mục Medium-High nữa thì phải cân nhắc.
>
> **(Ảnh chụp trước đó, sau Phase 8D)**: thêm **#29** (Low — cọ nhìn
> từ đúng trên xuống dẹt thành dấu "✳", do `parts.js` không nghiêng được khối; đã giảm nhẹ ở 8D,
> ĐỪNG vá nếu chỉ vì cây cọ). Vẫn **1 mục Priority High**
> (#14) → vẫn CHƯA đạt ngưỡng 8–10 mục để đề xuất Maintenance Sprint. Còn **3 mục Medium-High**
> (#3, #13, và **#24**: 14/15 kỷ có công trình bị mép khung hình cắt, đã đo đủ, chờ Đàm chọn
> hướng). **#28 đã ĐÓNG CẢ HAI PHẦN** — cạnh sắc ở Phase 8B, bàn cờ ô vuông ở Phase 8C.
> Còn **4 mục Medium** và **2 mục Low** (#25 — nhà dân nhỏ nhất ở 3 kỷ không có cửa sổ; **#27**
> — 3 cặp kỷ có mặt đường gần trùng nhau vào BAN ĐÊM, đều cách nhau ≥3 kỷ, đã đo đủ và có
> chủ đích chưa xử lý).
> ⚠️ **#26 và #23 đóng được bằng CÙNG MỘT lần đo, và mảng 8 đã làm nó GẤP HƠN BỐN LẦN**: sau 7C
> cảnh nặng nhất là 21.244 tam giác; **8A → 24.532 (41%)**, **8B → ~29.000 (48%)**, **8C → ~36.100
> (60%)** trần 60.000. Cổng hiệu năng iPhone **chưa được cân lại kể từ trước Phase 7A** — tức đã
> BỐN phase liền cộng tải lên một con số chưa ai kiểm, và phase mới nhất là phase đắt nhất
> (+4.800 tam giác cho địa hình). Một ảnh chụp HUD trên máy Đàm đóng cả hai. ⚠️ Đàm đã chỉ thị rõ
> **không được lấy blocker này làm lý do dừng cải thiện hình ảnh** — nên vẫn làm tiếp, nhưng đây
> nay là mục cần đo GẤP NHẤT: nếu iPhone không gánh nổi thì `SUB = 3` ở `terrainMesh.js` là cái núm
> hạ tải rẻ nhất (SUB 3 → 2 cắt 6.498 xuống 2.888, tức trả lại gần hết khoản chi của 8C).
> ⚠️ **CẬP NHẬT 2026-08-16 — #22 VÀ #19 ĐỀU ĐÃ ĐÓNG.** #22 vá gốc bằng cách **bỏ hẳn** proxy "mái"
> (lưới 6×3 ô con ở `scripts/sweepMetric.mjs`, không còn giả định mỹ thuật nào để mà hỏng lần nữa);
> #19 nhờ đó đo lại được và **cả 105 cặp kỷ đều trên ngưỡng mắt** (gần nhất 23,3 · trung vị 41,1).
> ⚠️ Hai bộ số của #19 **KHÔNG so trực tiếp được** (cũ đo màu mái, mới đo cả dải thành phố) — chi
> tiết ở đầu mục #19. Nay còn **hai mục Medium**: **#26** và **#23** (cổng hiệu năng iPhone chưa đo
> lại sau khi đổi sang PBR). **#15, #16, #17 và #20 đều đã đóng** — không còn mục nào chờ Đàm chọn
> hướng mỹ thuật.
> ⚠️ **#22 là ví dụ sạch nhất trong cả file này của một luật đáng nhớ**: *sửa đúng mã sản phẩm vẫn
> có thể làm HỎNG công cụ đo*, vì công cụ đo bao giờ cũng đứng trên vài giả định không được viết ra
> về thứ nó đang đo. Ở đây giả định ngầm là *"mái là thứ tươi nhất khung hình"* — đúng suốt thời kỳ
> mái suy từ màu nhấn giao diện, và chết ngay khi mái thành vật liệu lợp thật. **Bài học rút ra khi
> đóng nó còn quan trọng hơn**: đừng vá một proxy hỏng bằng một proxy khôn hơn — hỏi lại xem nó
> sinh ra để giải bài toán gì, rồi giải thẳng bài toán đó, để không còn proxy nào mà hỏng.
> ⚠️ **#17 LÀ VÍ DỤ THỨ HAI CỦA ĐÚNG CÁI BẪY MÀ BÀI HỌC #16 DƯỚI ĐÂY CẢNH BÁO** — và lần này nặng
> hơn: mục đó không chỉ ghi nhầm một lỗi thành "đánh đổi cần Đàm quyết", nó còn **chẩn đoán nhầm
> hẳn chặng ngày** (đổ cho chặng chiều, trong khi cặp hỏng thật là bình minh ↔ hoàng hôn). Nguyên
> nhân: đo đúng MỘT trục (góc màu của dải trời) rồi kết luận về cả bức tranh. Đọc phần đóng khung
> ở đầu #17 trước khi viết bất kỳ mục nợ mỹ thuật nào.
> ⚠️ **CÒN MỘT mục đang CHỜ ĐÀM QUYẾT, không phải chờ AI làm**: #14 (phiên im lặng — cân bằng
> game). **Đã nhẹ đi thật, đo lại 2026-08-14: 95% → 80–85%** (Phase 4I + Phase 5D). Nhưng phần còn
> lại **không sửa được bằng mã**: sau phiên thứ 44 của mỗi kỷ, thành phố hết chỗ để lớn thật, nên
> nói thêm câu nào cũng là bịa. Câu hỏi cho Đàm nay đã thành câu hỏi CÓ/KHÔNG, không còn là "vá thế
> nào" — xem cuối mục #14. Review Trigger của nó vẫn chặn các khoản đầu tư kế tiếp vào lễ mừng.
> ⚠️ **BÀI HỌC TỪ #16 — ĐỌC TRƯỚC KHI GHI MỘT MỤC NỢ MỚI LÀ "ĐÁNH ĐỔI CẦN NGƯỜI QUYẾT"**: #16 từng
> được ghi vào đây là *"đánh đổi thẩm mỹ, chờ Đàm quyết"*, vì chú thích tại chỗ tuyên bố nó có chủ
> đích. Nhưng chú thích ấy tuyên bố **HAI** ý định, không phải một — và ý định thứ hai (*"thành phố
> lộ ra rõ nhất ở khoảng trống phía dưới, đúng chỗ chẳng có chữ gì"*) **đang không đạt**. Đo chỗ chữ
> thật đứng thì hoá ra không có gì phải đánh đổi cả. ⇒ Trước khi kết luận "cần người quyết", hãy
> kiểm xem mã có đang làm ĐÚNG điều nó tự nhận không; một trade-off chỉ có thật khi cả hai vế đều
> đã đạt và phải hy sinh một vế.
> ⚠️ **Vế THỨ HAI của ngưỡng ĐÃ CHẠM và đã được XỬ LÝ MỘT PHẦN**: `palette3d.js` đã qua **5 đợt** vá
> mỹ thuật (3C · 3G · 3M · 3N · 3V). Phase 3V không vá riêng bầu trời mà **sửa đúng phép toán dùng
> chung** (`skyward()` chuyển từ trộn RGB sang xoay sắc, cùng khuôn đã dùng cho mái nhà ở 3N) — tức
> đã đi theo khuyến nghị "xem xét tổng thể" thay vì vá điểm.
> **Phần CHƯA làm của khuyến nghị đó**: mặt đất và nước vẫn còn vài chỗ trộn RGB. Chưa thấy triệu
> chứng nào ở 180 ô vừa quét, nên KHÔNG mở mục nợ mới — nhưng nếu xuất hiện **đợt vá thứ 6** cho
> `palette3d.js` thì lần đó phải là một đợt rà soát toàn bộ phép trộn màu còn lại, không vá tiếp.
> ⚠️ **#14 là nợ THIẾT KẾ, không phải nợ mã** — không có gì hỏng, nhưng nó chặn giá trị của mọi đầu
> tư về sau vào lớp thành phố (95% số phiên không thấy lễ mừng). Nó **cần Đàm chọn hướng** trước
> khi bất kỳ phiên AI nào động vào, vì mọi phương án đều đổi cân bằng kinh tế.
> ⚠️ **Cảnh báo quy trình từ mục #13**: một khoản nợ đã bị TÀI LIỆU CHE MẤT nhiều tháng — sổ ghi
> "lưới test đã có, chỉ chưa cắm vào" trong khi thực tế chưa từng có file nào. Khi đọc bất kỳ mục
> nào trong sổ này mà nó khẳng định "đã có sẵn X", hãy **kiểm bằng lệnh trước khi tin** (`git log
> --all --diff-filter=A -- '<đường dẫn>'` / `find`). Sổ nợ mà ghi sai thì còn nguy hơn không có sổ.
> *(Lịch sử của mốc trên, giữ lại để thấy nó tới từ đâu: `palette3d.js` qua 3C ánh sáng · 3G bảng
> quét · 3M sắc độ đêm · 3N màu mái — bốn đợt, đều tìm ra lỗi THẬT bằng phép đo, nên khi đó CHƯA
> phải "vá đi vá lại một chỗ"; `daylight.js` qua 3 đợt 3D · 3G · 3M. Mốc đặt ra khi đó là "đợt thứ
> 5 cùng loại thì dừng xem xét tổng thể" — #15 chính là đợt thứ 5 đó.)*

---

## #1 — God Function: `completeFocusSession`

- **Module**: `src/store/gameStore.js`
- **Priority**: Medium
- **Severity**: Medium
- **Impact**: Khó đọc, khó test từng phần riêng, dễ sinh bug "dùng giá trị state cũ/mới lẫn lộn"
  trong cùng một lệnh `set()`. Ảnh hưởng tới TOÀN BỘ hệ thống thưởng (XP/EP/tài nguyên/streak/
  nhiệm vụ/thành tích/thách đấu) vì đây là điểm nối trung tâm của tất cả.
- **Root Cause**: các hệ thống gameplay được thêm dần qua nhiều tháng phát triển; mỗi tính năng
  mới ra đời lại "gắn thêm" vào đúng điểm nối duy nhất này vì đây là nơi duy nhất biết "một phiên
  vừa hoàn thành".
- **Current Risk**: trung bình — hàm đã có test bao phủ các nhánh chính, đã chạy ổn định qua nhiều
  tháng. Rủi ro thật là với các nhánh ÍT được test (ví dụ tương tác giữa nhiều buff hiếm gặp cùng
  lúc).
- **Future Risk**: cao nếu tiếp tục thêm nhiều hệ thống gameplay mới cắm vào đúng điểm này —
  hàm sẽ tiếp tục phình to, độ khó đọc/sửa tăng phi tuyến.
- **Recommended Solution**: tách theo ranh giới rõ ràng thành các bước tuần tự composable (ví dụ:
  "tính thưởng" → "cập nhật tiến triển" → "kiểm tra thành tích"), MỖI bước có test hành vi riêng
  bao phủ đầy đủ TRƯỚC khi tách.
- **Estimated Complexity**: Cao — cần thiết kế lại ranh giới + viết bộ test hồi quy đầy đủ trước
  khi động vào bất kỳ dòng nào.
- **Blocking Conditions**: ĐÃ GIẢM (2026-07-13) — nay có bộ characterization golden-master
  `gameStore.completeFocusSession.test.js` (15 bài) khóa XP/EP/level/loot/RNG/nhiều loại phiên +
  `gameStore.cancelFocusSession.test.js` (6 bài) làm lưới an toàn cho việc tách. CÒN THIẾU để phủ
  đầy đủ trước khi tách sâu: các nhánh early-return phạt (khủng-hoảng/thăng-cấp thất bại) + ma trận
  waive-bằng-than-lượng (xem NOTE trong file test). Quy mô 1 người dùng vẫn khiến lợi ích "dễ đọc
  hơn" chưa vượt rủi ro, nên vẫn hoãn tách.
- **Review Trigger**: hàm vượt ~900-1000 dòng, HOẶC cần thêm một hệ thống gameplay lớn mới phải
  cắm vào đúng điểm nối này.
- **Owner**: (chưa gán — dự án 1 người dùng, không có ownership phân vai)
- **Status**: Open — hoãn có chủ đích (xem `ARCHITECTURE_DECISIONS.md` ADR-006). 2026-07-13: đã có
  lưới characterization (một phần) → an toàn hơn nếu sau này quyết định tách.

---

## #2 — God File: `gameStore.js` (~6.000 dòng) và `StatsDashboard.jsx` (~4.885 dòng)

- **Module**: `src/store/gameStore.js`, `src/components/StatsDashboard.jsx`
- **Priority**: Low
- **Severity**: Medium
- **Impact**: Khó onboard AI/người mới; thời gian tìm đúng vị trí sửa trong file dài hơn.
- **Root Cause**: tăng trưởng hữu cơ qua nhiều tháng, không có ranh giới module được thiết kế
  trước cho từng hệ thống con (streak/mission/achievement/crafting/prestige đều sống chung 1 file).
- **Current Risk**: thấp — cả 2 file đã có test bao phủ tốt các luồng chính; kích thước lớn nhưng
  không gây lỗi trực tiếp.
- **Future Risk**: trung bình — nếu tiếp tục phình to không kiểm soát, một lúc nào đó sẽ vượt khả
  năng một phiên AI đọc/hiểu trọn vẹn trong một lượt.
- **Recommended Solution**: với `StatsDashboard.jsx`, tiếp tục rút thêm các hàm tính toán/định
  dạng thuần ra file riêng (đã làm một phần: `statsFormatters.js`). Với `gameStore.js`, xem #1.
- **Estimated Complexity**: Cao cho `gameStore.js`; Trung bình cho `StatsDashboard.jsx` (đã có
  tiền lệ tách an toàn).
- **Blocking Conditions**: giống #1.
- **Review Trigger**: giống #1, cộng thêm: `StatsDashboard.jsx` thêm 1 tab con mới lớn.
- **Owner**: (chưa gán)
- **Status**: Open — hoãn có chủ đích.

---

## #3 — Khả năng mismatch: mô tả kỹ năng prestige (Thăng Hoa) không khớp code thật

- **Module**: `src/engine/constants.js` (mô tả 3 kỹ năng `kien_thuc_nen`/`ke_thua`/`sieu_viet`) +
  `src/store/gameStore.js` (`triggerPrestige`)
- **Priority**: Medium-High
- **Severity**: Medium (ảnh hưởng trực tiếp trải nghiệm + niềm tin, không phải crash/mất dữ liệu)
- **Impact**: Ba kỹ năng nhánh Thăng Hoa có văn bản mô tả hứa hẹn đặc quyền giữ lại khi prestige
  (giữ 1 kỹ năng nâng cao, giữ 50% SP chưa dùng, +100% XP kỷ nguyên 1 sau prestige) — nhưng qua
  rà soát trực tiếp code (đợt viết `AI_HANDOFF_KNOWLEDGE.md`, 2026-07-12), KHÔNG tìm thấy đoạn code
  nào trong `triggerPrestige()` thực sự áp dụng các cờ này; việc reset khi prestige có vẻ diễn ra
  KHÔNG ĐIỀU KIỆN bất kể các kỹ năng này có được mở khoá hay không.
- **Root Cause**: nghi vấn — tính năng được thiết kế trên giấy (mô tả trong `constants.js`) nhưng
  chưa từng được nối dây thật vào logic reset, hoặc bị bỏ sót khi logic prestige được viết/sửa sau
  đó. CHƯA XÁC MINH TRỰC TIẾP bằng cách chơi thử/viết test — đây là một PHÁT HIỆN từ đọc code, cần
  xác nhận thêm trước khi coi là bug chắc chắn.
- **Current Risk**: thấp (chưa có ai đạt prestige lần đầu trong đời thật để tự trải nghiệm hậu quả).
- **Future Risk**: cao khi Đàm đạt mốc prestige đầu tiên (ước tính ~1 năm sử dụng theo hiệu chỉnh
  cân bằng trong `constants.js`) — nếu đúng là thiếu, người chơi sẽ không nhận được đúng như mô tả,
  ảnh hưởng trực tiếp tới tính minh bạch của game.
- **Recommended Solution**: (1) viết một test hành vi mô phỏng prestige với/không có 3 kỹ năng này
  đã mở khoá, xác nhận `triggerPrestige()` có/không áp dụng đúng 3 đặc quyền; (2) nếu xác nhận
  thiếu, hoặc nối dây logic thật vào `triggerPrestige()`, hoặc sửa lại mô tả kỹ năng cho khớp hành
  vi thật (KHÔNG được để mô tả hứa hẹn điều code không làm).
- **Estimated Complexity**: Thấp-trung bình nếu xác nhận thiếu và cần thêm 3 nhánh điều kiện vào
  hàm reset.
- **Blocking Conditions**: không có — có thể xử lý bất cứ lúc nào, không phụ thuộc điều kiện nào
  khác.
- **Review Trigger**: nên làm SỚM, lý tưởng là trước khi Đàm tự nhiên đạt prestige lần đầu trong
  quá trình chơi thật.
- **Owner**: (chưa gán)
- **Status**: Open — **ĐÃ XÁC MINH LÀ THẬT** (audit 2026-07-13: grep toàn repo + đọc
  `triggerPrestige` — cả 3 perk chưa-wire hoàn toàn, 4 hằng hậu thuẫn chỉ nằm trong chuỗi mô tả).
  2026-07-17: hành vi hiện tại đã bị **ĐÓNG BĂNG bằng characterization test**
  (`gameStore.prestige.test.js`, bài "[ĐẶC TẢ BUG #3]") — khi sửa mục này (nối dây HOẶC sửa mô
  tả), test đó PHẢI được cập nhật kèm. Ưu tiên cao hơn 2 mục God File ở trên vì ảnh hưởng trực
  tiếp trải nghiệm người dùng thật.

---

## #4 — Thiếu E2E test và giám sát production

- **Module**: toàn dự án (không phải 1 file cụ thể)
- **Priority**: Medium
- **Severity**: Medium
- **Impact**: Các loại lỗi "tính sai âm thầm, không crash" (như nghi vấn #3) có thể tồn tại lâu
  mà không ai biết cho tới khi Đàm tự trải nghiệm gặp phải. Không có Sentry/analytics/dashboard
  lỗi nào giám sát production.
- **Root Cause**: quy mô 1 người dùng khiến đầu tư hạ tầng giám sát chuyên nghiệp có vẻ "thừa" so
  với lợi ích trước mắt; dev và production dùng CHUNG 1 dòng Supabase nên không thể chạy phiên
  focus thật trên dev để test E2E (sẽ ghi đè dữ liệu thật).
- **Current Risk**: trung bình.
- **Future Risk**: trung bình-cao nếu dự án tiếp tục thêm tính năng phức tạp mà không tăng tương
  ứng độ phủ test hành vi.
- **Recommended Solution**: (1) thiết lập một Supabase project THỨ HAI dành riêng cho dev/test,
  tách khỏi production — mở khoá khả năng viết E2E an toàn; (2) cân nhắc một cơ chế giám sát lỗi
  nhẹ (ví dụ chỉ ghi log lỗi runtime vào một bảng Supabase đơn giản, không cần dịch vụ trả phí).
- **Estimated Complexity**: Trung bình cho (1); Thấp cho (2).
- **Blocking Conditions**: cần quyết định của Đàm về việc có đáng đầu tư thêm 1 project Supabase
  hay không (có thể phát sinh chi phí/công sức quản lý thêm).
- **Review Trigger**: khi có đủ ngân sách thời gian, hoặc khi một sự cố "tính sai âm thầm" thực sự
  xảy ra và bị phát hiện muộn (khi đó là bằng chứng cụ thể cần đầu tư ngay).
- **Owner**: (chưa gán)
- **Status**: Open.

---

## #5 — Rủi ro lệch giữa mô tả tĩnh (`constants.js`) và hành vi code thật

- **Module**: `src/engine/constants.js` nói chung (không chỉ 3 kỹ năng ở mục #3)
- **Priority**: Low-Medium
- **Severity**: Low
- **Impact**: mang tính phòng ngừa — mục #3 là MỘT ví dụ cụ thể đã phát hiện; có khả năng còn các
  mô tả khác (achievement/skill/building) cũng lệch so với code thật mà chưa được rà soát.
- **Root Cause**: không có cơ chế kiểm tra tự động nào đối chiếu văn bản `description` với hành vi
  `check()`/logic thật tương ứng.
- **Current Risk**: thấp (chỉ 1 trường hợp cụ thể đã xác nhận khả nghi).
- **Future Risk**: thấp-trung bình, tăng dần theo thời gian nếu không rà soát định kỳ.
- **Recommended Solution**: rà soát định kỳ (không cần gấp) khi có thời gian rảnh giữa các tính
  năng lớn — đọc lại một lượt các mô tả skill/achievement và đối chiếu nhanh với code.
- **Estimated Complexity**: Thấp mỗi lần rà soát, nhưng tốn thời gian vì khối lượng lớn (360
  achievement + 36 skill + 75 blueprint).
- **Blocking Conditions**: không có.
- **Review Trigger**: định kỳ, hoặc khi phát hiện thêm 1 trường hợp lệch cụ thể khác (như #3).
- **Owner**: (chưa gán)
- **Status**: Open — mang tính phòng ngừa, không cấp bách.

---

## #6 — Hiệu năng: các tab nặng của `StatsDashboard.jsx` tính lại toàn bộ lịch sử mỗi lần render

- **Module**: `src/components/StatsDashboard.jsx` (`FocusTab`, `CategoryTab`)
- **Priority**: Low
- **Severity**: Low
- **Impact**: mỗi lần đổi filter (kỳ/danh mục) quét lại toàn bộ mảng `history`. Chưa phải vấn đề
  thật ở quy mô hiện tại (đã có `useMemo`/`useTransition`/`useDeferredValue` giảm giật).
- **Root Cause**: thiết kế đơn giản ban đầu (quét toàn bộ, không cache/index) phù hợp quy mô nhỏ.
- **Current Risk**: rất thấp.
- **Future Risk**: trung bình nếu lịch sử phình lên rất lớn (nhiều năm sử dụng liên tục, hàng chục
  nghìn phiên).
- **Recommended Solution**: nếu thực sự cảm nhận được độ trễ, cân nhắc index hoá theo thời gian
  (ví dụ nhóm sẵn theo tuần/tháng) thay vì quét tuyến tính mỗi lần.
- **Estimated Complexity**: Trung bình.
- **Blocking Conditions**: chỉ đáng làm khi CẢM NHẬN ĐƯỢC độ trễ thật, không tối ưu phòng ngừa.
- **Review Trigger**: người dùng báo cáo tab Thống kê bị giật/chậm.
- **Owner**: (chưa gán)
- **Status**: Open — không cấp bách.

---

## #7 — Dependency: `npm install` cần flag `--legacy-peer-deps`

- **Module**: `package.json` (toàn dự án)
- **Priority**: Low
- **Severity**: Low
- **Impact**: một số peer dependency xung đột phiên bản chưa giải quyết dứt điểm — không ảnh
  hưởng runtime, chỉ ảnh hưởng bước cài đặt.
- **Root Cause**: chưa rà soát/nâng cấp để giải quyết xung đột peer dependency triệt để.
- **Current Risk**: rất thấp — đã biết và có quy trình cài đặt rõ ràng (luôn dùng flag này).
- **Future Risk**: thấp, trừ khi một bản nâng cấp dependency lớn trong tương lai làm xung đột này
  trầm trọng hơn.
- **Recommended Solution**: khi có thời gian rảnh, rà soát `package.json` để xác định chính xác
  cặp dependency nào xung đột và cân nhắc nâng cấp/hạ cấp để bỏ được flag này.
- **Estimated Complexity**: Thấp-trung bình (cần thử nghiệm kỹ sau khi đổi để không phá build).
- **Blocking Conditions**: không có, nhưng không cấp bách.
- **Review Trigger**: khi cần thêm một dependency mới mà xung đột trở nên khó quản lý hơn.
- **Owner**: (chưa gán)
- **Status**: Open — chấp nhận sống chung, không cấp bách.

---

## #8 — Sync: mất dữ liệu khi hai máy sửa các trường KHÁC NHAU lúc offline

- **Module**: `src/lib/syncService.js` (+ giao thức lưu nguyên khối JSONB của `game_state`)
- **Priority**: Medium
- **Severity**: High (khi xảy ra là mất dữ liệu thật, không tự khôi phục được)
- **Impact**: cơ chế "First Action Wins" so version trên CẢ KHỐI state, không merge theo trường.
  Hai máy cùng sửa (dù ở trường khác nhau) giữa hai lần đồng bộ → máy đẩy sau bị từ chối và phải
  nhận lại bản của máy thắng, mất trọn phần sửa của mình.
- **Root Cause**: quyết định kiến trúc có chủ đích (ADR "First Action Wins") — chọn nhất quán +
  đơn giản thay vì merge, vì merge cần thiết kế xung đột riêng cho từng slice.
- **Current Risk**: đã GIẢM đáng kể sau bản vá C1 (2026-07-17): flush khi rời app thu hẹp cửa sổ
  "thay đổi chưa đẩy" từ vô hạn xuống mili-giây. Rủi ro còn lại tập trung ở kịch bản OFFLINE
  (push thất bại vì mất mạng, không có retry) — đúng lớp sự cố đã xảy ra thật 2026-07-11.
- **Future Risk**: tăng nếu sau này có thêm thiết bị thứ 3 hoặc nhiều người dùng.
- **Recommended Solution**: merge theo trường / 3-way merge, HOẶC lớp backup-recovery riêng. Đã
  cân nhắc và LOẠI phương án "snapshot trước mỗi lần import" (đề xuất A4) bằng phân tích định
  lượng: `history` và `savedNotes` đều bị chặn ở 2000 mục, mỗi mục history ~35 trường (~500-800
  byte JSON) ⇒ state ở mức trần ~2-2,5 MB; một bản sao đầy đủ đẩy tổng lên ~4-5 MB, chạm hạn mức
  localStorage ~5 MB của Safari, trong khi đường ghi persist KHÔNG bắt `QuotaExceededError`
  (xem #9) ⇒ cơ chế an toàn có thể trở thành nguồn mất dữ liệu diện rộng hơn.
- **Estimated Complexity**: Cao (đổi giao thức + cần môi trường E2E 2 thiết bị, xem #4).
- **Blocking Conditions**: chưa có E2E 2 thiết bị để kiểm chứng merge; Giai đoạn A cấm mở rộng.
- **Review Trigger**: khi làm tính năng backup/recovery sau Giai đoạn A, hoặc khi xuất hiện sự cố
  mất dữ liệu thật lần nữa, hoặc khi có thiết bị/người dùng thứ 3.
- **Owner**: (chưa gán)
- **Status**: Open — đã giảm rủi ro bằng bản vá C1, giới hạn được ghi nhận công khai trong
  `ARCHITECTURE.md` mục 2 (không giả vờ đã xử lý xong).

---

## #9 — ✅ **ĐÃ XỬ LÝ (2026-09-02)** — Persist localStorage không bắt `QuotaExceededError`

- **Module**: `src/lib/appIdentity.js` (`createLegacyCompatibleJSONStorage`, `storage.setItem`)
- **Priority**: Medium
- **Severity**: High (nếu xảy ra thì app ngừng lưu được state cục bộ)
- **Impact**: `storage.setItem(name, value)` gọi trần, không có `try/catch`. Khi localStorage đầy
  (state ở mức trần ~2-2,5 MB, cộng các khoá khác), lỗi ném thẳng vào trong zustand persist.
- **Root Cause**: đường ghi được viết cho trường hợp bình thường; hạn mức chưa từng bị chạm nên
  chưa lộ ra.
- **Current Risk**: thấp hiện tại (state thật còn xa mức trần 2000 mục).
- **Future Risk**: tăng dần theo số phiên tích luỹ; sẽ tăng vọt nếu có thêm bất kỳ cơ chế nào ghi
  bản sao state vào localStorage (chính là lý do #8 loại phương án snapshot).
- **Recommended Solution**: bọc `try/catch` quanh `setItem`, ghi log rõ ràng và có đường xử lý
  (cảnh báo người dùng / dọn bớt dữ liệu cũ) thay vì để ném lỗi.
- **Estimated Complexity**: Thấp.
- **Blocking Conditions**: không có — chỉ nằm ngoài phạm vi bản vá C1 nên không "tiện tay sửa luôn".
- **Review Trigger**: khi làm backup/recovery, hoặc khi thấy lỗi lưu state trong log production.
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện trong lúc phân tích bản vá C1 (2026-07-17), chưa xử lý.

- **✅ ĐÃ XỬ LÝ 2026-09-02.** `setItem` nay bọc `try/catch`, và khi đầy thì **dọn `legacyKeys`
  trước rồi thử lại** — những khoá ấy là bản sao của chính dữ liệu đang ghi nên xoá chúng vừa giải
  phóng đúng lượng chỗ cần vừa không mất gì. Thất bại lần hai thì `console.error` nói rõ, KHÔNG
  nuốt im lặng: nuốt lỗi ở đây nghĩa là Đàm mở lại app thấy mất tiến độ mà không có một dòng nào
  giải thích.

---

## #20 — ✅ **ĐÃ XỬ LÝ (2026-08-14, Phase 6B)** — Mái kỷ 1 (lều da thú) ra màu XANH LÁ, sai họ vật liệu — không phải lỗi phân biệt, mà lỗi NGHĨA

> ✅ **ĐÃ ĐÓNG — và giải pháp đi XA HƠN đề xuất ghi ở dưới, một cách có chủ đích.**
> Mục này đề xuất thêm một trường `roofHue` **tuỳ chọn** cho riêng kỷ 1. Khi bắt tay vào làm thì
> thấy chẩn đoán ở phần *Root Cause* dưới đây đúng nhưng CHƯA đủ rộng: `accentColor` không chỉ làm
> hỏng kỷ 1 — nó làm hỏng **cả bảng**. Đo được cùng lúc: mái đình làng Bắc Bộ (kỷ 6) ra **TÍM**,
> mái vòm Duomo Firenze (kỷ 7) cũng **TÍM**, bê tông Nakagin (kỷ 13) ra **XANH LƠ**, mái kẽm Paris
> (kỷ 9) ra **XANH NÕN CHUỐI**. Vá riêng kỷ 1 thì 14 kỷ kia vẫn sai, và món nợ sẽ quay lại lần nữa.
> ⇒ Đã làm đúng thứ mục này gọi tên: **tách hẳn hai vai**. Thêm `roofColor` **bắt buộc cho cả 15
> kỷ** trong `eraStyle.js` — mỗi kỷ khai đúng vật liệu lợp của công trình có thật ở nước biểu tượng
> của nó (kỷ 1 `#745339` da thú & gỗ hun khói · kỷ 7 `#c5572b` ngói terracotta · kỷ 11 `#3e9883`
> đồng oxy hoá · kỷ 13 `#ccc9c7` bê tông đúc sẵn…). `accentColor` giữ NGUYÊN, nên màu nhận diện kỷ
> trên toàn app không đổi một pixel.
> **Đo lại sau khi sửa** (bảng màu, giữa trưa, theme sáng): trung vị 105 cặp **46,2 → 62,7** ·
> trải độ sáng **0,18 → 0,40** · cặp gần nhất 6,9 → 10,9. Bốn hàng rào ở `palette3d.test.js` đều
> qua, cộng một **bài đối chứng** mới nhốt sẵn bảng mái hỏng cũ và bắt bộ hàng rào phải còn bắt
> được nó.
> ⚠️ **Ba bài học rút ra, đều đã ghi vào chỗ tương ứng:**
> 1. Phép đếm "15 mái phủ được mấy múi màu 30°" **thưởng cho đúng cái lỗi này** — đường hỏng ăn 9
>    múi, đường vật liệu thật chỉ 6. Vật liệu lợp có thật không trải khắp vòng tròn màu; chúng phân
>    biệt nhau bằng ĐỘ SÁNG. Hàng rào đã đổi theo (`palette3d.test.js`).
> 2. Trần độ tươi từng được phát biểu ở **hai** chỗ với **hai** số (mã kẹp 0,70, test canh 0,66) —
>    nay là một hằng số `ROOF_MAX_SATURATION` mà bài test `import` thẳng.
> 3. Việc sửa này **làm hỏng công cụ đo** `sweep-score.mjs` → mục **#22** (nay đã ĐÓNG, 2026-08-16:
>    proxy "mái" bị bỏ hẳn, thay bằng lưới ô con không giả định gì về màu).

<details>
<summary>Nội dung gốc của mục (giữ nguyên để đối chiếu)</summary>


- **Module**: `src/engine/city3d/palette3d.js` (hàm `eraRoof`) đọc `ERA_METADATA[1].accentColor`
  = `#4ade80`. KHÔNG phải `eraStyle.js` — hình khối đã sửa xong ở Phase 5B.
- **Priority / Severity**: Low-Medium / Low (thuần mỹ thuật, không có gì hỏng, không ai mất dữ liệu).
- **Impact**: Kỷ 1 là kỷ **mọi người dùng đều đi qua đầu tiên** và là ấn tượng đầu về cả màn Thành
  Phố. Mái nón xanh lá trên nền cỏ xanh làm cụm lều đọc ra là **bụi cây / cây thông**, chứ không
  phải chỗ có người ở. Phase 5B đã sửa được phần lớn bằng hình khối (bỏ vành mái thò ra, dựng lều
  nón cao sát đất — trước đó nó đọc ra là *cây nấm*), nhưng sắc xanh vẫn còn.
- **Root Cause**: `accentColor` của mỗi kỷ mang HAI vai không liên quan nhau — vừa là màu nhận diện
  của kỷ trên toàn app (thanh chuyển kỷ, chấm tròn, biểu đồ), vừa là nguồn góc màu cho MÁI trong
  cảnh 3D. Hai vai đó chỉ tình cờ hợp nhau ở 14 kỷ. Đây đúng cùng một hình dạng sai với bài học
  Phase 5B ngay bên trên (`storyHeight` gánh hai việc) — chỉ khác là lần này hai vai nằm ở hai
  **module** khác nhau nên khó thấy hơn.
- **Current Risk**: Không có. Cảnh vẫn dựng đúng, test vẫn xanh, 15 kỷ vẫn phân biệt được với nhau.
- **Future Risk**: Ai đó "sửa cho hợp lý" bằng cách đổi thẳng `ERA_METADATA[1].accentColor` sẽ đổi
  màu nhận diện của kỷ 1 trên **toàn bộ app**, và gần như chắc chắn làm đỏ bài duyệt 105 cặp mái ở
  `palette3d.test.js` — vì bảng màu đó đã được tinh chỉnh qua năm đợt đo.
- **Recommended Solution**: Thêm một trường TUỲ CHỌN `roofHue` trong `eraStyle.js` (nơi đã giữ mọi
  quyết định vật liệu của kỷ), để `eraRoof` ưu tiên nó và lùi về `accentColor` khi không có. Kỷ 1
  đặt ~28° (da thú / rơm rạ). Cách này KHÔNG đụng `accentColor`, nên màu nhận diện của kỷ trên toàn
  app giữ nguyên, và nó tách đúng hai vai đang bị trộn.
- **Estimated Complexity**: Thấp (một trường + một nhánh `??`), nhưng PHẢI chạy lại phép duyệt 105
  cặp mái + quét ảnh 15 kỷ để chắc chắn không đẩy kỷ 1 vào sát một kỷ khác.
- **Blocking Conditions**: Nên gộp vào **cùng một đợt rà soát `palette3d.js`** với #19 thay vì vá
  riêng — đúng luật "đợt vá thứ 6 thì phải rà soát tử tế, không vá điểm" đã ghi ở đầu file này.
- **Review Trigger**: Khi mở đợt rà soát `palette3d.js` cho #19, HOẶC khi Đàm nhắc lại rằng kỷ đầu
  trông không giống chỗ có người ở.
- **Owner**: chưa ai nhận.
- **Status**: MỞ — phát hiện 2026-08-14 (Phase 5B), cố ý CHƯA sửa trong phase đó vì phạm vi của
  phase là HÌNH KHỐI, và đụng vào bảng màu là mở một mặt trận khác hẳn.

</details>

---

## #19 — Hai cặp kỷ vẫn gần như CÙNG MỘT MÀU trên màn hình, dù bảng màu gốc cách nhau rất xa

> ⚠️ **HAI CON SỐ NGHIỆM THU CỦA MỤC NÀY NAY ĐÃ CŨ — ĐỪNG TRÍCH LẠI (2026-08-14, Phase 6B).**
> "kỷ 5↔12 = 9,5" và "kỷ 4↔10 = 10,2" được đo khi mái còn **suy ra từ `accentColor`**. Phase 6B
> thay hẳn NGUỒN của màu mái sang `roofColor` (vật liệu lợp thật) — kỷ 5 nay là đá phiến `#586a89`,
> kỷ 12 là bê tông quân sự `#717b65`, hai thứ chẳng liên quan gì tới hai màu đã đo. Tức mục này
> đang mô tả một bảng màu **không còn tồn tại**.
> ⚠️ Và **chưa đo lại được**: đúng lần sửa ấy làm hỏng bộ lọc mái của `sweep-score.mjs` (mục #22),
> nên công cụ nay TỪ CHỐI chấm phần cặp-kỷ. Mục này vì vậy **treo, chờ #22 xong** — không phải
> "vẫn còn 2 cặp trùng", mà là **chưa biết**. Ghi rõ ra đây thay vì để hai con số cũ nằm im trông
> như số còn đúng: đó chính là cái bẫy mà phần ĐÍNH CHÍNH ngay bên dưới đã dạy một lần rồi.
>
> ## ✅ ĐÃ ĐO LẠI, VÀ ĐÓNG (2026-08-16, sau khi #22 xong)
>
> ⚠️ **HAI BỘ SỐ KHÔNG SO TRỰC TIẾP ĐƯỢC — ĐỪNG VIẾT "9,5 → 35,0" NHƯ MỘT PHÉP CẢI THIỆN.** Số cũ
> đo **màu MÁI** (8% điểm ảnh tươi nhất); số mới đo **cả dải thành phố** chia lưới 6×3. Đó là hai
> đại lượng khác nhau, chỉ trùng đơn vị. Điều số mới nói được là điều mục này thật sự hỏi từ đầu —
> *"hai kỷ này nhìn trên màn hình có phân biệt được không"* — chứ không phải "mái đã tách chưa".
>
> | cặp | phép đo mới (trung bình 6 chặng) | chặng sát nhau nhất | kết luận |
> |---|---|---|---|
> | kỷ 5 ↔ kỷ 12 | **35,0** | 28,1 | ✅ đạt, gấp 2,9 lần ngưỡng mắt |
> | kỷ 4 ↔ kỷ 10 | **44,3** | 35,9 | ✅ đạt, gấp 3,7 lần |
> | kỷ 3 ↔ kỷ 10 | 38,9 | 29,2 | ✅ |
> | cặp gần nhất TRONG CẢ 105 CẶP | **23,3** (kỷ 11 ↔ 12) | 16,4 | ✅ **0/105 dưới ngưỡng** |
>
> ⇒ Hai cặp mà mục này nêu tên **không còn nằm trong nhóm sát nhau nhất**, và cả 105 cặp đều trên
> ngưỡng. Nguyên nhân hợp lý nhất: từ lúc mục này được ghi (Phase 4G) tới nay, bản sắc kỷ đã thôi
> nằm gần hết ở màu mái — Phase 5B (dáng nhà + `massScale`), 6A (chữ ký kiến trúc), 7B (địa hình),
> 7C (nhà dân), 7D (mặt đường), 8B/8C/8D (tường, mặt đất, thảm thực vật) đều thêm trục phân biệt
> mới. Tức mục này được **giải quyết gián tiếp bởi 8 phase mỹ thuật**, không bởi một lần vá màu.
> ⚠️ Vì vậy **KHÔNG được đọc thành "phép trộn màu ở `palette3d.js` đã hết vấn đề"** — luật "đợt vá
> thứ 6 cho `palette3d.js` phải là một đợt rà soát toàn bộ" vẫn còn nguyên hiệu lực.
> Ở tầng bảng màu (không phải điểm ảnh) thì đã đo lại được và số có tốt lên: trung vị 105 cặp
> 46,2 → 62,7, cặp gần nhất 6,9 → 10,9. Nhưng đó là tầng khác, **không thay lời cho phép đo trên
> ảnh** — đúng bài học "bài test bảng màu và phép đo trên ảnh kêu hai tập cặp rời nhau hoàn toàn".

- **Module**: `src/engine/city3d/palette3d.js` (phép pha sắc kỷ vào mái) — KHÔNG phải
  `ERA_METADATA[*].accentColor`.
- **Priority / Severity**: Medium / Low-Medium (thuần mỹ thuật, không có gì hỏng).
- ⚠️ **ĐÍNH CHÍNH (2026-08-13, Phase 4G) — một câu trong chính mục này từng là LỜI BẢO ĐẢM SAI.**
  Bản đầu viết: *"ổn định qua hai cỡ ô 260 và 300 nên không phải nhiễu"*. Câu đó nghe như một phép
  kiểm chứng chéo, nhưng nó **không thể đúng**: cỡ ô KHÔNG phải tham số của phép đo, nó là **sự
  thật về tấm ảnh**. Ảnh dựng ở cỡ 300 mà chấm bằng cỡ 260 thì bước nhảy hàng lệch 30px/hàng, tới
  hàng cuối lệch 420px — tức lấy mẫu ở một kỷ KHÁC. Chạy lại đúng như vậy cho ra một bộ số bịa
  hoàn chỉnh và **trông rất thuyết phục**: "5/105 cặp kỷ + 1/15 cặp chặng dưới ngưỡng, trung vị
  106,4", kèm cả một cặp chặng bình-minh↔hoàng-hôn "hỏng" mà Phase 3Y đã sửa xong từ lâu. Phép
  tự-kiểm khi ấy vẫn báo ✓ vì nó chỉ đọc HÀNG 0 — nơi sai số còn bằng 0. ⇒ Đã vá tận gốc: nay
  `city-preview.mjs` ghi kèm mỗi ảnh một hồ sơ `.geom.json`, `sweep-score.mjs` ĐỌC hồ sơ đó và
  **từ chối chạy nếu thiếu**, và phép tự-kiểm chạy đủ **15/15 hàng**. Số dưới đây là số đo lại
  bằng công cụ đã vá.
- **SỐ ĐO** (2026-08-13, bằng `scripts/sweep-score.mjs` — quét đủ 15 kỷ × 6 chặng, đo màu MÁI
  bằng 8% điểm ảnh tươi nhất của dải thành phố, trung bình trên 6 chặng):

  | | khoảng cách | ghi chú |
  |---|---|---|
  | kỷ 5 ↔ kỷ 12 | **9,5** | hai cặp gần nhau nhất, cách hẳn phần còn lại |
  | kỷ 4 ↔ kỷ 10 | **10,2** | |
  | cặp gần thứ ba (kỷ 3 ↔ kỷ 10) | 13,4 | |
  | trung vị 105 cặp | 44,6 | |
  | 15 cặp CHẶNG NGÀY | gần nhất 32,8 | ✅ toàn bộ đạt, Phase 3Y vẫn giữ |

- **Root Cause — và đây là chỗ đáng học**: bảng màu gốc của hai cặp này **KHÔNG hề gần nhau**. Đo
  bằng redmean trên chính `accentColor`: kỷ 5 (`#94a3b8`) ↔ kỷ 12 (`#64748b`) cách **140**, kỷ 4
  (`#fb923c`) ↔ kỷ 10 (`#f87171`) cách **100** — trong khi cặp gần nhau NHẤT trong bảng gốc là kỷ 6
  ↔ kỷ 7 (43,5), mà cặp đó lại render ra ĐẠT. ⇒ **Chính đường ống render nén hai cặp này lại**, và
  nén không đều: cặp gần nhất trong bảng thì render ra tách được, cặp xa trong bảng lại render ra
  trùng nhau. Đúng bài học đã ghi ở `CLAUDE.md`: *"BẢNG MÀU ≠ MÀU TRÊN MÀN HÌNH"*, và **không có
  một hệ số chung** — phải đo từng chỗ.
- **VÌ SAO CHƯA SỬA TRONG PHIÊN NÀY (cố ý, không phải bỏ quên)**: `palette3d.js` đã qua **5 đợt** vá
  mỹ thuật (3C · 3G · 3M · 3N · 3V), và chính file `TECH_DEBT.md` này đã đặt ra luật: *"nếu xuất
  hiện đợt vá thứ 6 cho `palette3d.js` thì lần đó phải là một đợt rà soát toàn bộ phép trộn màu còn
  lại, không vá tiếp"*. Sửa nhanh hai kỷ ở đây đúng là **đợt thứ 6 kiểu vá điểm** mà luật cấm. Vậy
  nên: ghi lại đầy đủ số đo, để dành cho một đợt rà soát tử tế.
  ⚠️ Và **đừng chữa bằng cách đổi `accentColor`**: màu đó là bản sắc kỷ dùng khắp app (thẻ kỷ, thẻ
  công trình, thẻ lễ mừng, bộ vẽ 2D), lại đang đúng về ý nghĩa (kỷ 5 "Tăm Tối" xám, kỷ 12 "Thế
  Chiến" xám thép). Vấn đề nằm ở chỗ pha, không nằm ở chỗ chọn màu.
- ⚠️ **CƠ CHẾ ĐÃ ĐO ĐƯỢC (2026-08-13, Phase 4G) — hai cặp này hỏng vì CÙNG MỘT nguyên nhân, không
  phải hai chuyện riêng lẻ.** `sweep-score.mjs --eras` nay in màu mái đo được của từng kỷ, và đối
  chiếu với màu mà `eraRoof` phát ra thì thấy đường ống render **nén hai trục và khuếch đại một
  trục**:

  | trục | nguồn (bảng màu) | trên màn hình | hệ số |
  |---|---|---|---|
  | ĐỘ ĐẬM | kỷ 5 vs 12 lệch 0,10 HSL-L (≈25/255) | lệch **5/255** | **nén ~5×** |
  | GÓC MÀU (dải ẤM) | kỷ 4 vs 10 lệch **21,6°** sau khi pha neo | lệch **2,6°** | **nén ~8×** |
  | ĐỘ TƯƠI | — | — | khuếch đại ~2× (đã ghi ở `CLAUDE.md`) |

  Số đo tại chỗ: kỷ 5 `rgb(77,77,54)` tươi 24 ↔ kỷ 12 `rgb(72,70,49)` tươi 23 · kỷ 4 `rgb(104,70,21)`
  tươi 82 ↔ kỷ 10 `rgb(106,72,31)` tươi 75.
  ⇒ **Cả hai cặp đều có chênh lệch THẬT và ĐỦ LỚN ở bảng màu; chính đường ống xoá nó đi.** Và cả hai
  cặp đều rơi đúng vào hai trục BỊ NÉN, trong khi 103 cặp còn lại tách nhau chủ yếu nhờ trục ĐỘ TƯƠI
  — trục được khuếch đại. Đó là lý do "cặp xa trong bảng lại trùng trên màn hình".
  ⚠️ Hệ quả cho người sửa sau: **`eraRoof` đang được thiết kế trong không gian BẢNG MÀU nhưng được
  nghiệm thu trong không gian ĐIỂM ẢNH.** Đó chính là lỗi *"một luật hai công thức"* ở quy mô lớn
  nhất trong dự án này. Mọi lần chỉnh hệ số của `eraRoof` (đã 2 lần: nền độ tươi 0,30→0,52 và hệ số
  độ đậm 0,22→0,55) đều là chỉnh ở đầu VÀO trong khi tiêu chí nằm ở đầu RA — nên chúng cải thiện
  được nhưng không bao giờ đóng được vấn đề.
- **Recommended Solution** (cho đợt rà soát — nay đã có hướng cụ thể, không còn mò):
  1. **Thiết kế trong không gian mắt nhìn, không trong bảng màu.** Viết một hàm THUẦN mô hình hoá
     đường ống (nhân ánh nắng ấm → kẹp kênh → tone mapping), hiệu chuẩn bằng đúng 15 màu mái đã đo
     ở trên, rồi cho `palette3d.test.js` duyệt 105 cặp **trong không gian đã render** với ngưỡng 12.
     Khi đó bài test thuần và `sweep-score.mjs` mới nói CÙNG MỘT luật — hiện chúng nói hai luật khác
     nhau và **hai tập cặp bị kêu không giao nhau một phần tử nào** (xem `CLAUDE.md`).
  2. Chỉ khi đó mới chỉnh `eraRoof`, và chỉnh theo hướng **bù trước cho phần bị nén** (đúng tiền lệ
     đã có ở bầu trời Phase 3V: *"muốn ra đúng sắc phải khai cao hơn đích thật ~15°"*).
  3. Nhân thể rà nốt các phép trộn RGB tuyến tính còn lại (`outskirts`, `edge`, `sun`, mặt đất).
  - Nghiệm thu: `node scripts/city-preview.mjs --sweep --all` rồi `node scripts/sweep-score.mjs
    .city-preview/sweep-light-ky1-15.png --eras` → **0/105 cặp kỷ dưới ngưỡng**.
- **Current Risk**: thấp — chỉ là hai cặp trong mười lăm kỷ nhìn na ná nhau. **Future Risk**: trung
  bình — phần thưởng của việc đi hết 15 kỷ là *thấy thành phố đổi khác*; mỗi cặp trùng làm mất một
  nấc trong hành trình đó.
- **Blocking Conditions**: không có blocker kỹ thuật; chỉ là phải làm thành MỘT đợt rà soát, không
  vá điểm.
- **Review Trigger**: lần tới ai định sửa `palette3d.js` vì bất kỳ lý do gì → gộp mục này vào.
- **Owner**: (chưa gán) · **Status**: **Open** (phát hiện 2026-08-13, Phase 4F).

---

## #18 — ĐÃ ĐÓNG (2026-08-13) · Kỷ 12–14 không hề có bề mặt nào mang màu kỷ

> ⚠️ **ĐÍNH CHÍNH (2026-08-13, cùng ngày, muộn hơn)**: dòng "0/105 ✅" trong bảng bên dưới **chỉ
> đúng với phép đo lúc đó**, không phải một lời bảo đảm chung. Đo lại bằng `scripts/sweep-score.mjs`
> (công cụ mới, có `--selftest` chứng minh bộ lọc mái thật sự chạy: bỏ lọc thì tụt về 51/105) ra
> **2/105 cặp dưới ngưỡng**. Hai phép đo khác nhau ở cách chuẩn hoá khoảng cách và ở ranh giới dải,
> nên **không cái nào "sai"** — nhưng con số 0/105 không được đọc như "đã xong vĩnh viễn". Việc mà
> #18 tuyên bố là đã làm (kỷ mái bằng nay có bề mặt mang màu kỷ) thì vẫn đúng và vẫn đứng. Phần còn
> lại chuyển sang **#19**. 👉 Bài học: **một con số nghiệm thu phải đi kèm CÔNG CỤ đã đo ra nó** —
> ghi mỗi kết quả mà không ghi cách đo thì phiên sau không thể tái lập, và sẽ tưởng là đã đóng.

- **Module**: `src/engine/city3d/buildingSpec.js` — nhánh `case 'flat'` của `roofParts`.
- **Priority / Severity**: Medium / Low-Medium (thuần mỹ thuật) — **đã xử lý xong trong ngày**.
- **Triệu chứng**: duyệt đủ 105 cặp kỷ trên ảnh thật, kỷ 12 ↔ 13 chỉ cách **6,4/255** (ngưỡng mắt
  ~12), và ba trong bốn cặp yếu nhất đều dính kỷ 12 hoặc 13.
- **Root Cause — KHÔNG phải màu, và đây là chỗ đáng học.** Nhánh `'flat'` đẩy ĐÚNG MỘT khối với
  `role: 'trim'` — vai TRUNG TÍNH thuộc họ tường, chỉ ngấm 0,18 sắc kỷ. Ba kỷ 12/13/14 đều dùng
  `roof: 'flat'`, nghĩa là **cả ba chưa bao giờ hiện lấy một milimét vuông vai `roof` nào**. Bảng
  màu hoàn toàn đúng, ánh sáng hoàn toàn đúng, bài test "15 kỷ ra 15 màu mái" xanh suốt — vì nó đo
  MÀU TRONG BẢNG chứ không hỏi màu ấy có được đem VẼ RA hay không.
  ⇒ **Một bài test về BẢNG MÀU không bao giờ thay thế được một bài test về việc màu đó có xuất hiện
  trong HÌNH HỌC hay không. Hai câu hỏi khác nhau, và khoảng trống giữa chúng đủ chỗ cho ba kỷ.**
- **Giải pháp đã làm**: giữ nguyên gờ chắn mái trung tính ở vành ngoài (đó là bê tông/đá ốp thật),
  thêm một **tấm phủ hẹp hơn (0,94) mang vai `roof`** nằm trong lòng nó — đúng cấu tạo mái bằng
  ngoài đời: diềm parapet một vật liệu, sàn mái chống thấm một vật liệu khác. Nhìn từ góc camera
  chúc xuống của thành phố này thì sàn mái là một mảng RẤT to.
- **KẾT QUẢ ĐO LẠI** (105 cặp kỷ, dải thành phố, trung bình 6 chặng):

  | | trước phiên này | sau `eraRoof` 0,55 | sau tấm phủ mái bằng |
  |---|---|---|---|
  | số cặp DƯỚI ngưỡng mắt | 5/105 | 4/105 | **0/105** ✅ |
  | cặp gần nhau nhất | 6,0 | 6,0 | **12,6** |
  | trung vị 105 cặp | 27,9 | 27,6 | **28,2** |

  ⇒ **Cả 105 cặp kỷ nay đều phân biệt được**, cùng với cả 15 cặp chặng ngày (nhỏ nhất 29,5).
- **Bài test khoá lại** (`buildingSpec.test.js`): mọi bản vẽ × mọi kỷ × cả 3 cấp đều phải có ít
  nhất một phần mang vai `roof`, cộng một bài riêng cho các kỷ mái bằng. Đã thử ngược (gỡ tấm phủ)
  và thấy **báo đỏ, gọi đích danh kỷ 12**.
- **Status**: **CLOSED 2026-08-13.** 510/510 test xanh · lint sạch · build xanh.

---

## #17 — ĐÃ ĐÓNG (2026-08-13) · Bình minh và hoàng hôn là CÙNG MỘT BỨC ẢNH

> ⚠️ **MỤC NÀY TỪNG CHẨN ĐOÁN SAI, VÀ CÁI SAI ĐÓ ĐÁNG GHI LẠI HƠN CẢ LỖI.** Bản đầu (viết cùng
> ngày, sớm hơn vài giờ) đặt tên mục là *"Chặng CHIỀU là chặng xấu nhất trong ngày"*, kết luận
> rằng có **hai hướng mỹ thuật khác hẳn nhau cần Đàm chọn**, rồi DỪNG LẠI chờ. Cả ba phần đều sai:
> chặng chiều không phải chặng tệ nhất, không có hai hướng nào cả, và không có gì để chờ.
>
> **Vì sao sai: đo một trục rồi kết luận về cả bức tranh.** Bản đầu đo GÓC MÀU của dải trời, thấy
> ba chặng ấm (bình minh 33° · chiều 43° · hoàng hôn 25°) nằm gọn trong 20°, và suy ra "một nửa số
> chặng trong ngày là cùng một cảnh". Nhưng góc màu chỉ là MỘT trong ba thành phần của màu, và dải
> trời chỉ là MỘT trong ba dải của khung hình. Đo lại bằng vector 9 chiều (trời + thành phố + đất,
> mỗi dải 3 kênh, trung bình 15 kỷ) thì bức tranh lật ngược hẳn:
>
> | cặp chặng | khoảng cách cả cảnh (0–255) | kết luận |
> |---|---|---|
> | **bình minh ↔ hoàng hôn** | **5,9** | dưới ngưỡng mắt (~12) ⇒ **ĐÚNG LÀ MỘT BỨC ẢNH** |
> | chiều ↔ hoàng hôn | 37,6 | cách nhau rõ |
> | chiều ↔ bình minh | 42,1 | cách nhau rõ |
>
> Tức chặng chiều chưa bao giờ là vấn đề "trùng lặp" — nó chỉ ĐỤC (độ tươi 0,25, ra kaki chứ không
> ra vàng), là một lỗi nhỏ và có một cách sửa đúng duy nhất. Còn cặp thật sự trùng nhau thì bản đầu
> **không hề nhắc tới**, vì hai chặng đó góc màu 33° và 25° — trông đã "khác nhau 8°" trên bảng.
>
> ⇒ **Bài học, và nó tổng quát hơn mỹ thuật:** khi kết luận là *"hai thứ này giống nhau"*, phép đo
> phải phủ HẾT những gì mắt nhìn thấy. Đo một trục thì sẽ vừa **báo nhầm** (chiều bị kết tội oan)
> vừa **bỏ sót** (bình minh ↔ hoàng hôn thoát). Và cái sau nguy hiểm hơn nhiều, vì nó im lặng.
>
> **Và vì sao việc "chờ Đàm chọn" là sai:** dự án đã có sẵn luật cho đúng tình huống này
> (`CLAUDE.md`, bài học Phase 3X) — *"một trade-off chỉ có thật khi CẢ HAI vế đều đã đạt và buộc
> phải hy sinh một vế"*. Ở đây không vế nào đạt: chú thích hứa "chiều vàng" mà ra kaki, tức là một
> **lỗi**, và sửa lỗi thì không cần xin phép. Đưa cho Đàm một lựa chọn giả rồi dừng lại chỉ làm mất
> thời gian của anh và để nguyên bức tranh hỏng trên máy anh thêm một vòng nữa.

- **Module**: `src/engine/city3d/daylight.js` (`DAYLIGHT_PROFILES`), `daylight.test.js`,
  `src/components/city/render3d/sceneGraph.js` (sương mù).
- **Priority / Severity**: Medium / Medium (thuần mỹ thuật) — **đã xử lý xong**.
- **Root Cause**: hồ sơ `dawn` và `dusk` không được THIẾT KẾ riêng, chúng được chép ra từ nhau rồi
  chỉnh vài phần trăm ở mỗi tham số (cao độ 0,22 vs 0,18 · ấm 0,85 vs 1,00 · chân trời 18° vs 10° ·
  lực kéo 0,70 vs 0,78 · tươi 1,15 vs 1,25). Không ai chọn cho chúng giống nhau.
- **Vì sao không bài test nào bắt được**: bài *"hai chặng liền nhau không được giống nhau"* duyệt
  danh sách `DAY_PHASES` **theo thứ tự**, tức chỉ các cặp KỀ NHAU. `dawn` ở đầu và `dusk` ở cuối
  nên không bao giờ được đem so với nhau. **Đây là lần thứ HAI cùng một hình dạng sai xuất hiện
  trong chính file test đó** (lần trước: bài "hành trình màu" tính cả `night` nên bộ số hỏng vẫn
  qua). Luật rút ra, nay đã thành mã: **bất biến kiểu "các thứ này phải khác nhau" phải duyệt TỔ
  HỢP ĐÔI, không được duyệt danh sách theo thứ tự** — duyệt theo thứ tự là cái phễu, không phải
  hàng rào.
- **Giải pháp đã làm** — tách hai chặng ở NĂM trục cùng lúc, neo vào một sự thật khí quyển duy
  nhất (*qua đêm thì bụi lắng xuống, hơi nước đọng lại*):
  - **Sương theo giờ** (`haze`, trường mới + hàm thuần `fogRangeFor`). Trước đây sương là hằng số.
    Đây là thứ đóng góp gần như toàn bộ kết quả — tắt riêng nó ra rồi bật lại (giữ nguyên mọi tham
    số khác): **17,2 → 75,1**. Lý do nó hiệu quả: sương lấy MÀU CHÂN TRỜI, nên nó sơn lại cả mảng
    nền phía sau và quanh thành phố bằng sắc của buổi đó.
    ⚠️ **ĐO CHÍNH XÁC NÓ LÀM GÌ, VÀ KHÔNG LÀM GÌ** — nền/chân trời **12,9 → 74,6**; dải THÀNH PHỐ
    **8,4 → 3,3** (GIẢM, không tăng); mặt đất 7,2 → 7,2 (không đổi). Toàn bộ khoảng cách đến từ
    phần NỀN, không từ các công trình — đúng như thiết kế, vì sương cố ý bắt đầu SAU rìa thành phố.
    Và việc nhà cửa ở gần trông na ná nhau ở hai đầu ngày là **đúng vật lý** (cùng một mặt trời
    thấp, cùng một thứ ánh sáng ấm), không phải thiếu sót: ngoài đời cũng vậy, thứ cho ta biết đang
    là sáng hay chiều là bầu trời và sương, không phải màu bức tường trước mặt.
    ⚠️ Bản chú thích đầu tiên viết ngược điều này ("sương quét sắc lên chính những công trình ở xa
    nên cuối cùng chạm được vào dải THÀNH PHỐ") — nghe rất xuôi tai, và SAI. Đã đo lại và sửa.
  - Đỉnh trời tách 202° (lam sạch) vs 252° (tím chàm — "đai sao Kim").
  - Chân trời: bình minh vàng nhạt 34°/0,62/1,00 · hoàng hôn cam đỏ đậm 8°/0,88/1,46.
  - Nắng: 0,50 vs 1,06 · đèn sân: 0,16 vs 0,78.
  - **Chặng chiều** (lỗi thật của nó — đục chứ không trùng): độ tươi 1,05 → 1,30, sắc 34° → 44°.
- **Hai nước đi đã thử và ĐÃ BỊ TEST BẮT** (giữ lại để đừng ai thử lại):
  1. Hạ `dawn.sunWarmth` xuống 0,22 cho nắng sớm LẠNH → bài *"nắng ẤM lúc bình minh/hoàng hôn"* đỏ,
     và nó đúng: mặt trời thấp thì ánh sáng xuyên quãng khí quyển dài — ở CẢ HAI đầu ngày. Cái
     "mát" của buổi sớm nằm ở BẦU TRỜI và SƯƠNG, không ở đĩa mặt trời.
  2. Đẩy chân trời bình minh sang hồng sen 312° → bài *"bầu trời KHÔNG BAO GIỜ ngả tím sen"*
     (`palette3d.test.js`) đỏ với `#d189a5` (28 điểm, lưới cấm ở 10). Quét cả vòng màu: cửa an
     toàn chỉ mở từ **16°**, và thứ chạm trần trước tiên là **MẶT NƯỚC** chứ không phải bầu trời.
     Không nới lưới đó — nó sinh ra từ hai màu hỏng có thật. Và hoá ra không cần: sương mới là
     nguồn khoảng cách chính.
- **KẾT QUẢ ĐO LẠI** (cùng phép đo, cùng bản quét 15 kỷ × 6 chặng):

  | cặp | trước | sau |
  |---|---|---|
  | **bình minh ↔ hoàng hôn** | **5,9** ❌ | **75,1** ✅ |
  | cặp GẦN NHAU NHẤT trong cả ngày | 5,9 ❌ | **29,8** (8h ↔ 12h) ✅ |
  | chiều ↔ hoàng hôn | 37,6 | 44,0 |
  | chiều ↔ bình minh | 42,1 | 46,6 |

  Ngưỡng mắt phân biệt được là ~12 ⇒ **cả 15 cặp nay đều trên ngưỡng, cặp yếu nhất gấp 2,5 lần.**
- **Còn lại một quan sát, KHÔNG phải nợ**: ba chặng ấm vẫn chung họ màu (bình minh 38° · chiều 46° ·
  hoàng hôn 20°, trải 26°). Bản đầu coi đó là bằng chứng "ba chặng là một cảnh" — sai, vì chúng
  khác nhau ở ĐỘ SÁNG và SƯƠNG chứ không ở góc màu: độ sáng trời 0,65 · 0,48 · 0,38, và bình minh
  có sương dày còn hoàng hôn thì trong. Đo cả cảnh thì cặp gần nhất trong bộ ba là 44,0 — gấp 3,7
  lần ngưỡng mắt. **Cùng họ màu ≠ cùng một cảnh.**
- **Bài test mới khoá lại** (`daylight.test.js`): duyệt ĐỦ 15 cặp trên khoảng cách hồ sơ đa-trục
  (ngưỡng 0,40, hiệu chuẩn với phép đo pixel — Spearman 0,854), **cộng một bài đối chứng nhốt sẵn
  bộ số hỏng cũ** và bắt buộc phép đo phải còn bắt được nó. Nhờ vậy nếu về sau ai nới ngưỡng hoặc
  bỏ bớt trục cho tiện thì đỏ ngay — cái phễu không thể lặng lẽ quay lại lần thứ ba.
- **Status**: **CLOSED 2026-08-13.** 509/509 test xanh · lint sạch · build xanh.

---

## #16 — ✅ **ĐÃ XỬ LÝ (2026-08-13, Phase 3X)** — Vòng ngày của thành phố gần như VÔ HÌNH ở trang chủ, nơi Đàm nhìn nhiều nhất

- **Module**: `src/components/city/CityBackdrop.jsx` — cụ thể là **lớp phủ giữ-chữ-đọc-được**, KHÔNG
  phải `BACKDROP_OPACITY` và KHÔNG phải lỗi của `daylight.js`/`palette3d.js`.
- **Priority**: Medium · **Severity**: Low (không có gì hỏng) · **Estimated Complexity**: Low về mã
- **SỐ ĐO** (ảnh chụp app đã build, bề ngang 1280, đo hai dải thành phố lộ ra hai bên thẻ đồng hồ,
  y = 300–800):

  | chặng | màu trung bình | sắc | tươi | sáng |
  |---|---|---|---|---|
  | bình minh | `#d6d3cc` | 39° | 0,11 | 0,82 |
  | sáng | `#d9d8d3` | 49° | 0,07 | 0,84 |
  | giữa trưa | `#dddcd7` | 48° | 0,09 | 0,86 |
  | chiều | `#dad7d0` | 42° | 0,12 | 0,84 |
  | hoàng hôn | `#d7d3cc` | 37° | 0,11 | 0,82 |
  | đêm | `#cececc` | 49° | 0,02 | 0,80 |

  Cặp cách nhau **XA NHẤT** — giữa trưa ↔ ban đêm, tức hai cực của cả ngày — chỉ **14/255**. Đó là
  mức CAO NHẤT, không phải thấp nhất. Ngưỡng "mắt gần như không phân biệt được" là 12.
- **Root Cause**: lớp phủ pha về `var(--canvas)` — một màu **PHẲNG** — ở 55–92% tuỳ độ cao. Pha bất
  kỳ màu nào về phía một màu phẳng thì **độ tươi tụt theo đúng tỉ lệ đó**, trong khi hình khối (tín
  hiệu ĐỘ SÁNG) vẫn sống sót. Mà vòng ngày là tín hiệu **SẮC** gần như thuần tuý ⇒ lớp phủ lọc đúng
  cái cần giữ và giữ đúng cái không thiếu cũng được.
- **Impact**: `CityBackdrop` sinh ra để "đem thành phố ra trang chủ" (Phase 3F), và Phase 3V vừa bỏ
  công dựng cả một hành trình màu 178° cho sáu chặng ngày. Ở tab Thành Phố thì thấy rõ; ở TRANG CHỦ
  — màn hình Đàm nhìn nhiều nhất, và là nơi cái đồng hồ chạy suốt 25 phút — nó gần như không tới.
- **⚠️ (Đánh giá BAN ĐẦU, giữ lại vì bài học nằm ở chỗ nó SAI ở đâu.)** Lúc mới phát hiện, mục này
  kết luận "đây là thiết kế có chủ đích, không được tự ý chỉnh", dựa vào chú thích tại chỗ: *"đây là
  chỗ mà 'đẹp' và 'dùng được' đối đầu nhau trực diện, và dùng được phải thắng"*.
  **Phần đúng**: dải đậm ở TRÊN đúng là có chủ đích và tuyệt đối không được đụng — điều đó giữ
  nguyên tới hôm nay. **Phần sai**: từ đó suy ra rằng *cả hồ sơ* là một đánh đổi đã cân nhắc, nên
  bất kỳ thay đổi nào cũng phải do Đàm quyết. Thực tế mốc "dải đậm kết thúc ở đâu" chưa từng được
  đo — nó dựa trên niềm tin rằng mặt đồng hồ nằm trên nền, mà đồng hồ thì nằm trong thẻ đặc.
  ⇒ **Bài học**: một chú thích chứng minh ý định, KHÔNG chứng minh rằng con số đi kèm đã được đo.
- **✅ GIẢI PHÁP ĐÃ LÀM (2026-08-13, Phase 3X) — và hoá ra KHÔNG HỀ có đánh đổi nào để mà quyết.**
  Mục này ban đầu ghi "chờ Đàm chọn 1 trong 3 hướng", vì chú thích tại chỗ tuyên bố đánh đổi có chủ
  đích. Đọc kỹ lại thì chú thích ấy tuyên bố **HAI** ý định: (1) chữ phải đọc được — ĐẠT; và
  (2) *"thành phố lộ ra rõ nhất ở khoảng trống phía dưới — đúng chỗ chẳng có chữ gì"* — **KHÔNG
  ĐẠT**. Không có xung đột giữa hai vế; chỉ có vế thứ hai chưa được thực hiện.
- **NGUYÊN NHÂN GỐC THẬT SỰ — một niềm tin sai về chỗ chữ đứng, không phải một con số chọn ẩu.**
  Chú thích cũ ghi dải đậm ở trên là *"nơi có tiêu đề và mặt đồng hồ"*. Đo bằng `textmap3.mjs`
  (có bài kiểm ngược để chứng minh bộ phân loại còn phân loại được) thì:
  - mặt đồng hồ `25:00` **KHÔNG nằm trên nền** — nó ở trong một thẻ ĐẶC (`rgb(255,253,250)`), tại
    **82%** chiều cao lớp phủ. Lớp phủ chưa từng bảo vệ nó, và cũng không cần;
  - chữ THẬT SỰ trên nền chỉ là khối lời chào: máy bàn **7%→21%**, điện thoại **31%→48%**.
  ⇒ Từ mốc đó trở xuống, lớp phủ không làm gì cho khả năng đọc — nó chỉ xoá thành phố. Mà ở 38% nó
  vẫn còn 80%, ở 72% vẫn còn 55%.
- **Cách sửa**: tách hồ sơ mốc thuần ra `src/components/city/cityBackdropScrim.js` (chuỗi CSS nằm
  trong JSX thì không bài test nào chạm tới được), **hai hồ sơ theo khung** — dùng lại đúng
  `useIsPhone()` mà `CityBackdrop` đã có sẵn cho `still`, không thêm hạ tầng. Giữ nguyên (thực tế là
  đậm hơn một chút) tới mốc bảo vệ 28%/55%, rồi thả nhanh về 0 ở vùng không có chữ.
- **BẰNG CHỨNG (đo trên điểm ảnh thật, trước ↔ sau, cả 6 chặng ngày)**:
  - vòng ngày: cặp xa nhau nhất **14,0 → 25,0 / 255** (ngưỡng nhìn ra được là 12) — từ dưới ngưỡng
    lên gần gấp đôi ngưỡng;
  - dải CÓ CHỮ: lệch tối đa **0,43/255**, và **sáng hơn ở cả 6/6 chặng, không chặng nào tối đi** ⇒
    tương phản chữ không giảm một phần nghìn nào (pha thêm về nền sáng thì chữ tối càng nổi);
  - dải KHÔNG CHỮ: lệch **22–33/255** ⇒ thành phố mở ra thật, không phải thay đổi lấy lệ.
- **Khoá bằng test**: `cityBackdropScrim.test.js` (7 bài) giữ nguyên hồ sơ CŨ làm mốc và quét **từng
  phần trăm một** — vì `linear-gradient` nội suy giữa các mốc, hai hồ sơ có thể bằng nhau ở mọi mốc
  mà vẫn cắt nhau ở GIỮA (kiểm mốc là cái phễu, không phải hàng rào). Đã thử ngược với hồ sơ cố ý
  nhạt hơn ⇒ đỏ ngay tại **1%**.
- **Review Trigger**: **đổi bố cục trang chủ** (thêm chữ đặt thẳng lên nền, hoặc dời khối lời chào)
  ⇒ phải đo lại bằng `textmap3.mjs` và cập nhật `TEXT_ENDS_PCT`. Sai chỗ này **không có gì đỏ cả**,
  chỉ là chữ khó đọc dần.
- **Owner**: đã xử lý · **Status**: ✅ **RESOLVED (2026-08-13, Phase 3X)** — phát hiện khi tự hỏi
  "thành quả Phase 3V có thật sự tới màn hình Đàm không", câu hỏi đến từ chính Review Trigger của #14.

---

## #15 — ✅ **ĐÃ XỬ LÝ (2026-08-13, Phase 3V)** — Trời ban ngày KHÔNG BAO GIỜ xanh: cả ngày chỉ là dốc sáng–tối, không phải hành trình màu

> **KẾT QUẢ**: đo lại cùng phép đo, cùng kỷ 7, cùng điểm lấy mẫu — đỉnh trời cả ngày nay là
> `27° · 203° · 211° · 37° · 18° · 223°`, thay cho `26° · 40° · 41° · 38° · 19° · 224°`. Bốn chặng
> ban ngày không còn nằm gọn trong một dải cam-nâu 22°; chúng trải **178°**. Giữa trưa ra
> `#7d8fa3` — xanh trời thật. Đã kiểm đủ **90 ô** (15 kỷ × 6 chặng): không ô nào đen, xám hay
> cháy; 6/6 chặng vẫn phân biệt được.
> ⚠️ **ĐÍNH CHÍNH 2026-08-13 (Phase 3W)**: bản đầu của mục này (và commit `83fa6cb`) ghi "180 ô ×
> 2 theme". **SAI.** So từng điểm ảnh giữa hai bản quét: **0/421.200 điểm bên trong các ô khác
> nhau**, chỉ khung ngoài đổi màu. Lý do ở `palette3d.js:183` — hễ có `daylight` thì ĐỒNG HỒ quyết
> `isDark`, theme bị bỏ qua. Số ô thật là 90, dựng hai lần. Phạm vi kiểm vẫn ĐỦ (15 kỷ × 6 chặng
> là toàn bộ không gian có ý nghĩa), nhưng con số thì đã bị thổi gấp đôi. Chi tiết cách sửa: xem chú thích dài
> ngay trên dòng `noon` trong `src/engine/city3d/daylight.js`. Bài test khoá: bài 81
> `daylight.test.js` (đã thử NGƯỢC với bộ số hỏng cũ → báo đỏ đúng như mong đợi, 38° < 90°).
>
> **Giữ nguyên toàn bộ phần chẩn đoán bên dưới** — nó là bằng chứng cho bài học "chỉnh tham số
> không chữa nổi một phép toán sai", và hai thí nghiệm thất bại ở đó vẫn còn giá trị cảnh báo.

- **Module**: `src/components/city/render3d/sceneGraph.js` (số mũ pha vòm trời) + `skyward()` trong
  `src/engine/city3d/palette3d.js` (phép trộn màu). **KHÔNG phải lỗi của `daylight.js`** — bảng ở
  đó ghi đúng ý đồ, chỉ là ý đồ không tới được màn hình.
- **Priority**: **Medium-High**
- **Severity**: Medium
- **Impact**: đây là phần đo được của "chán" ở lớp HÌNH ẢNH, song sinh với #14 ở lớp phần thưởng.
  Đàm mở app nhiều lần mỗi ngày; nếu 5/6 chặng ngày cho ra cùng một sắc trời thì thành phố không
  còn là "nơi chốn đang trôi qua thời gian" như `daylight.js` tự nhận, mà chỉ là một ảnh chụp được
  chỉnh sáng-tối.
- **SỐ ĐO** (kỷ 7, theme sáng, đo đỉnh trời ở giữa khung, y = 12%):

  | chặng | màu ra | sắc | tươi |
  |---|---|---|---|
  | bình minh | `#8e7969` | 26° | 0,15 |
  | sáng | `#a29781` | 40° | 0,15 |
  | **giữa trưa** | `#b1a790` | **41°** | 0,18 |
  | chiều | `#a1957f` | 38° | 0,15 |
  | hoàng hôn | `#8e7468` | 19° | 0,15 |
  | đêm | `#1b2238` | 224° | 0,35 |

  **5/6 chặng nằm gọn trong dải 19°–41° (cam-nâu); chỉ ĐÊM thoát ra.** Cả ngày chỉ đổi độ sáng
  (0,46 → 0,60 → 0,46) — mà độ sáng là tín hiệu thị giác yếu nhất.
- **Root Cause (hai tầng nhân nhau)**:
  (1) **Dải trời nhìn thấy được là 64–84% MÀU CHÂN TRỜI.** `sceneGraph.js` pha vòm trời theo
  `t^2.6`; camera chúc xuống nên phần trời lọt khung chỉ ở `t ≈ 0,50–0,67`, mà `0,5^2,6 = 0,17`.
  ⇒ `skyHue` (đỉnh vòm) gần như KHÔNG BAO GIỜ hiện ra. Giữa trưa khai `skyHue: 212, skyPull: 0.70`
  — lực kéo mạnh nhất cả ngày — nhưng vô hiệu, vì người quyết định màu trời ban ngày là
  `horizonHue`, và giữa trưa nó là `48°` (vàng ấm) với lực kéo chỉ `0,22`.
  ⚠️ Số mũ 2,6 KHÔNG phải lỗi ẩu — chú thích tại chỗ ghi rõ nó được nâng từ 1,2 lên để cứu một lỗi
  khác ("mảng oải hương xam xám"). Sửa mù số mũ sẽ làm sống lại lỗi cũ.
  (2) **`skyward()` trộn bằng `mixRgb`.** Sắc ấm 40° pha sắc lạnh 205° trong RGB thì đi qua vùng
  TRUNG TÍNH — **đúng họ lỗi đã sửa cho MÁI NHÀ ở Phase 3N** (15 kỷ ra 2 cụm màu).
- **⚠️ ĐÃ THỬ VÀ THẤT BẠI — đừng lặp lại** (đo thật, 2026-08-13):
  - `noon.horizonHue: 205, horizonPull: 0.42` → `#a6a69a`, 61°, tươi **0,06** → xám, không xanh.
  - `noon.horizonHue: 205, horizonPull: 0.78` → `#9ca7a3`, **157° lục-lam**, tươi **0,05**.
  - Càng kéo mạnh càng lạc sang lục rồi chết ở xám. ⇒ **Chỉnh số trong `DAYLIGHT_PROFILES` KHÔNG
    chữa được.** Cả hai thử nghiệm đã được HOÀN TÁC; mã hiện tại giữ nguyên giá trị cũ.
- **Current Risk**: thấp về kỹ thuật (không có gì hỏng), trung bình về trải nghiệm.
- **Future Risk**: trung bình. Mỗi phase mỹ thuật về sau đều đâm vào cùng phép trộn sai này.
- **Recommended Solution**: sửa `skyward()` cho xoay sắc trong **không gian HSL** thay vì trộn RGB —
  đúng khuôn đã dùng thành công cho mái nhà ở Phase 3N (`eraRoof` trong `palette3d.js`). ⚠️ Cẩn
  trọng: sắc nền và đích ở nhiều chặng gần như ĐỐI NHAU (40° vs 205°/226°), nên phép nội suy sắc
  ngây thơ sẽ đi qua LỤC hoặc TÍA ở quãng giữa — cần chọn mô hình cho `pull` (ví dụ: lấy thẳng sắc
  đích, để `pull` điều khiển ĐỘ TƯƠI) rồi **tinh chỉnh lại cả 6 chặng**.
- **Estimated Complexity**: **Medium-High** — phép toán thì nhỏ, nhưng phải tinh chỉnh lại 6 chặng
  và kiểm đủ **90 ô** (15 kỷ × 6 chặng) bằng `--sweep --all` trước khi phát hành. ⚠️ `--theme`
  KHÔNG nhân đôi phạm vi khi đã truyền giờ — xem đính chính ở đầu mục.
- **Blocking Conditions**: không có blocker kỹ thuật. Cần một phase riêng, KHÔNG làm kèm việc khác —
  đây là loại thay đổi mà "sửa một chỗ, hỏng ba chỗ" đã xảy ra nhiều lần trong lịch sử tầng màu.
- **Review Trigger**: trước bất kỳ thay đổi nào ở `skyward()`, số mũ vòm trời, hoặc
  `DAYLIGHT_PROFILES`.
- **Owner**: (chưa gán)
- **Status**: ✅ **RESOLVED 2026-08-13 (Phase 3V)** — phát hiện cùng ngày ở Phase 3U khi quét lại đủ
  15 kỷ × 6 chặng trên mã hiện tại. ⚠️ Mắt tôi ban đầu chẩn "3 chặng ban ngày giống hệt nhau" —
  **phép đo BÁC BỎ điều đó** (6/6 chặng vẫn phân biệt được, khoảng cách nhỏ nhất 17/255) nhưng lại
  lộ ra lỗi thật và chính xác hơn: không phải "giống nhau", mà là **cùng một SẮC, chỉ khác ĐỘ SÁNG**.
- **CÁCH SỬA THẬT SỰ ĐÃ DÙNG** (khác một chút so với mục "Recommended Solution" ở trên — ghi lại vì
  chỗ khác nhau chính là phần học được):
  1. `skyward()` xoay sắc bằng **vector chroma** (cộng hai vector đơn vị theo góc rồi `atan2`), giữ
     nguyên độ tươi/độ sáng gốc. Cách này tự tránh được đúng cái bẫy mà mục trên cảnh báo — sắc
     gần đối nhau thì vector tổng ngắn lại chứ không quét qua lục/tía. Trường hợp suy biến (hai
     vector triệt tiêu) đã có nhánh riêng. `t === 0` ra byte y hệt bản cũ ⇒ chỗ nào không kéo thì
     không đổi một pixel.
  2. **Không chỉ là phép trộn.** Còn hai tầng nữa mới ra màu trên màn hình, và nếu bỏ qua thì sửa
     đúng toán vẫn ra trời xám: (a) `NeutralToneMapping` phơi sáng 1,2 nén mạnh vùng sáng, mà chân
     trời để độ sáng 0,80 thì nằm đúng giữa vùng bị nén ⇒ độ tươi ra màn hình chỉ còn **1/5** —
     phải hạ độ sáng xuống 0,70/0,72 và nâng độ tươi lên 0,60/0,44; (b) nắng ấm nhân vào trời làm
     sắc lạnh tụt **13–22°** về phía lục ⇒ hai chặng sáng/trưa phải khai cao hơn đích thật ~15°.
- **Nợ CÒN LẠI, có chủ đích**: số mũ `t^2.6` ở `sceneGraph.js` **không đụng tới**. Chú thích tại chỗ
  ghi rõ nó được nâng từ 1,2 lên để cứu lỗi "mảng oải hương xam xám"; sửa nó là mở lại một lỗi cũ
  để đổi lấy một cải thiện mà đường khác đã đạt được rồi. Vẫn đúng là **màu trời ban ngày do
  `horizonHue` quyết định, không phải `skyHue`** — ai chỉnh bảng `DAYLIGHT_PROFILES` phải nhớ điều đó.

---

## #24 — MỌI KỶ ĐỀU CÓ CÔNG TRÌNH BỊ MÉP KHUNG HÌNH CẮT — và không ai đo cho tới hôm nay

> ✅ **ĐÃ ĐÓNG 2026-08-24 (Phase 19 VIỆC 5, ADR-061).** `cityOrbitOptions` nay tính khoảng cách
> RIÊNG TỪNG KỶ bằng chia đôi, lấy đúng mức TỐI THIỂU để biên mép còn `FRAME_FIT_MARGIN = 0,04`.
> Đo lại bằng `node scripts/frame-fit.mjs`: **0/15 kỷ có công trình bị cắt** (trước: 14/15), hệ số
> **1,307 … 1,878**. Bằng chứng nó tối thiểu thật: **14/15 kỷ ra biên đúng 0,0400 = sàn**, kỷ 15 dư
> 0,0736 vì bị một sàn khác trói, và ngoại lệ ấy được ghi tường minh đếm được trong `orbit.test.js`.
>
> ⚠️ **VÀ THỦ PHẠM HOÁ RA LÀ MỘT BÀI TEST, KHÔNG PHẢI MỘT KHUYẾT TẬT.** Bài *"KỶ THẤP GIỮ NGUYÊN
> KHUNG SÁT"* (Phase 5A) đòi `factor ≤ 1,35`. Đo ra thì 13/15 kỷ cần ≥ 1,47 ⇒ cái trần ấy và lời
> hứa "không cắt công trình nào" **không thể cùng đúng**, và chính nó đã đẻ ra mục nợ này. Một cái
> trần đặt lúc thành phố còn thấp, ở lại sau khi ADR-052 chia ô thành khu phố — đúng hình dạng
> ADR-019 (*tiền đề bị gỡ ở một phase khác, kết luận chết theo mà không ai biết*).
>
> ⚠️ **CÁI GIÁ ĐÃ TRẢ, ghi ở `#89`**: thành phố nay đứng xa hơn ~38% và trục CHẶNG NGÀY của bản
> quét tụt 14,39 → 11,33. Đóng mục này KHÔNG miễn phí, và mục #89 là chỗ ghi phần chưa trả xong.

> ⚠️ **CẬP NHẬT 2026-08-18 (Phase 12) — BỘ SỐ GỐC CỦA MỤC NÀY ĐO THIẾU 30% CHIỀU CAO.**
> `frame-fit.mjs` nhân `BUILDING_SCALE` (1,3) vào bề NGANG nhưng quên nhân vào chiều CAO, trong khi
> `geometryFactory` nhân `scale` vào **cả ba chiều** (`h: part.h * scale`). Nên mọi công trình thật
> **cao hơn 1,3 lần** thứ công cụ tưởng, biên mép TRÊN thật hẹp hơn số đã ghi, và mức độ bị cắt
> **nặng hơn** những gì mục này mô tả — sai theo hướng TRẤN AN. Đã vá; đo lại ở khung 1,30 vẫn ra
> **14/15 kỷ bị cắt**, nhưng hệ số camera cần để vào trọn khung nay là **1,82** (đang dùng
> 1,19–1,58), tức phải lùi xa thêm ~15–50% chứ không phải một chút.
> ⇒ Bài học: **một công cụ đo chép lại hằng số của công cụ dựng thì hai bên trôi khỏi nhau** —
> đúng cái bẫy mà chính chú thích đầu `frame-fit.mjs` đã cảnh báo, ở ngay dòng dưới nó.
> ⚠️ Mục này nay **dính chặt với #41 và với Phase 12**: cả ba đều là một bài toán duy nhất —
> *"thành phố quá nhỏ / quá lớn so với khung hình"*. Đừng chữa riêng một mục.


- **Module**: `src/engine/city3d/orbit.js` (`cityOrbitOptions`) — đo bằng `scripts/frame-fit.mjs`
- **Priority**: Medium-High
- **Severity**: Medium
- **Impact**: đo được ở tỉ lệ khung 1,30 (dáng thẻ cảnh trên máy bàn): **14/15 kỷ có ít nhất một
  công trình lọt ra ngoài mép khung hình**, chủ yếu mép DƯỚI và mép TRÁI. Nặng nhất là kỷ 2
  (`bp_kho_lua`, biên **−0,513** — tức nhô ra ngoài hơn nửa nửa-khung) và kỷ 3 (−0,474). Ở tỉ lệ
  khung VUÔNG (1,0 — gần với thẻ cảnh trên iPhone) thì là **15/15**. Hậu quả với Đàm: ở gần như mọi
  kỷ, một trong năm công trình anh vừa đánh đổi hàng chục phiên tập trung để xây bị xén mất một
  phần ngay trong khung mặc định.
- **Root Cause**: **KHÔNG phải do Phase 7B.** Đã đo đối chứng bằng `--flat` (địa hình phẳng như
  trước 7B): vẫn **14/15** kỷ bị cắt, và hệ số khoảng cách cần thiết còn CAO HƠN (2,01 so với 1,78
  sau khi có địa hình) — tức địa hình + phần bù camera của nó làm khung hình **đỡ** đi, không tệ
  hơn. Nguyên nhân gốc có từ Phase 5A: `CAMERA_DISTANCE_FACTOR` hạ 1,5 → **1,18** để chữa đúng lời
  Đàm *"thu phóng cho vừa đủ thôi, không thu quá xa rồi bị mờ"*. Lần đó chỉ kiểm "nóc công trình
  cao nhất có lọt khung không" (bài `KHÔNG CẮT NGỌN` trong `orbit.test.js`) — **một trục, mép TRÊN,
  một công trình**. Bốn mép còn lại và bốn công trình còn lại chưa bao giờ được đo. Đúng bài học đã
  ghi ở Phase 3Y: *đo một trục thì vừa BÁO NHẦM vừa BỎ SÓT, và cái bỏ sót nguy hiểm hơn vì im lặng.*
- **Current Risk**: thẩm mỹ, không phải chức năng — app chạy đúng, chạm-để-xem-công-trình vẫn đúng,
  và Đàm **kéo/thu phóng được** để nhìn trọn. Nhưng khung MẶC ĐỊNH là thứ anh thấy mỗi lần mở tab,
  và một toà nhà bị xén nửa dưới là đúng cái cảm giác "prototype" mà cả nhánh Phase 7 đang đi chữa.
- **Future Risk**: yêu cầu của Đàm cho các phase sau là **thêm nhà dân, cửa hàng, xưởng, khu dân cư
  lấp đầy lưới**. Thành phố càng phủ kín 12×12 thì phần bị xén càng nhiều, và lúc đó việc mở khung
  sẽ không còn là một lựa chọn mà là bắt buộc — nên quyết sớm thì rẻ hơn.
- **Recommended Solution**: ⚠️ **CẦN ĐÀM QUYẾT — đây là đánh đổi thật, không phải lỗi để tự sửa.**
  Hai vế đều đã đạt và loại trừ nhau: khung sát ⇒ nhìn rõ chi tiết kiến trúc; khung rộng ⇒ không
  xén. Ba hướng:
  - **(a) Mở khung cho vừa hết** — `CAMERA_DISTANCE_FACTOR` 1,18 → **1,78** (khung 1,3) hoặc
    **2,23** (khung vuông). Hết xén hoàn toàn, nhưng công trình nhỏ đi ~1,5 lần, tức quay lại đúng
    cái "mờ" Đàm đã bảo bỏ.
  - **(b) Khung theo TỈ LỆ MÀN HÌNH** — máy bàn (khung bè ngang) giữ sát, điện thoại (khung vuông)
    mở rộng. Đúng hơn về nguyên tắc vì nguyên nhân một phần nằm ở FOV ngang, nhưng `cityOrbitOptions`
    hiện chưa biết tỉ lệ khung; phải truyền thêm tham số.
  - **(c) Co thành phố lại thay vì lùi camera** — kéo 5 khu đất về gần tâm hơn trong `cityLayout.js`.
    Giữ nguyên độ lớn công trình trên màn hình, nhưng **đụng bố cục** nên phải cân với ADR-007 và
    với kế hoạch tăng mật độ sắp tới. Có lẽ là hướng đúng nhất về lâu dài.
- **Estimated Complexity**: (a) Low (~15 phút, một hằng số) · (b) Medium (~1–2 giờ) · (c) Medium-High
  (đụng bố cục, cần đo lại nhiều thứ).
- **Blocking Conditions**: không chặn gì. NÊN quyết trước khi làm phase tăng mật độ nhà, vì lúc đó
  vừa phải chỉnh bố cục vừa phải chỉnh khung — làm một lần rẻ hơn hai lần.
- **Review Trigger**: khi bắt đầu phase "mật độ / khu dân cư"; hoặc ngay khi Đàm thấy khó chịu.
- **Owner**: cần Đàm chọn hướng (a)/(b)/(c)
- **Status**: Open — đã đo đầy đủ, đã có công cụ tái lập, chờ Đàm quyết.
- ⚠️ **CÔNG CỤ ĐÃ ĐO RA CÁC CON SỐ TRÊN** (bắt buộc ghi kèm — bài học `TECH_DEBT #18`):
  `node --import ./scripts/register-esm-loader.mjs scripts/frame-fit.mjs 1.3`
  (thêm `--flat` để lấy đối chứng địa hình phẳng, `--selftest` để chứng minh công cụ còn phản ứng
  đúng trên CẢ HAI trục dọc/ngang). ⚠️ Công cụ này đã nói dối ngay lần chạy đầu — vector `right` viết
  ngược dấu nên **nhãn mép đảo hoàn toàn** (báo "mép TRÊN" trong khi ảnh chụp rõ ràng cắt ở mép
  DƯỚI); độ lớn thì vẫn đúng. Chi tiết ở đầu `frame-fit.mjs`. Lần thứ 17 công cụ tự chế nói dối
  trong dự án này, và lần này con mắt bắt được nó.

---

## #23 — Cổng hiệu năng iPhone của Phase 3A chưa được đo lại sau khi cả cảnh chuyển sang PBR

- **Module**: `src/components/city/render3d/sceneGraph.js` + `CityPerfHud.jsx`
- **Priority**: Medium
- **Severity**: Medium
- **Impact**: chưa biết. Cổng 3A (≥30 FPS khi xoay · <1,5 s tới khung hình đầu · không nóng máy sau
  5 phút · pin tụt <4% sau 10 phút) đã đo ĐẠT trên iPhone thật của Đàm — nhưng **đo trên bản
  Lambert**. Phase 7A đổi ba thứ đều tốn thêm GPU: (a) `MeshStandardMaterial` đắt hơn Lambert cho
  MỖI ĐIỂM ẢNH (thêm phép tính BRDF + tra bản đồ môi trường); (b) mỗi lần dựng cảnh nay nướng thêm
  một lượt PMREM; (c) công trình đi từ 1 lệnh vẽ lên 5–7.
- **Root Cause**: không phải lỗi — là hệ quả có chủ đích của ADR-013. Vấn đề là **con số nghiệm thu
  cũ nay đã hết hiệu lực mà không có gì báo**, đúng họ với bài học `TECH_DEBT #18` ("một con số
  nghiệm thu phải đi kèm công cụ đã đo ra nó" — ở đây thêm một vế: *và đi kèm PHIÊN BẢN nó đo*).
- **Current Risk**: thấp trên máy Mac (ảnh dựng 15 kỷ vẫn ~21 s như trước, không chậm đi rõ rệt).
  Rủi ro thật nằm ở iPhone, nơi chưa ai đo. Đáng chú ý: chi phí (b) và (c) là **một lần mỗi lần
  dựng cảnh**, còn (a) là **mỗi khung hình** — nên nếu có vấn đề thì nó sẽ hiện ra ở FPS lúc xoay
  camera, không phải ở thời gian tới khung hình đầu.
- **Future Risk**: nếu Phase 7B/7C tăng mật độ nhà như Đàm yêu cầu mà chưa đo lại nền này, thì lúc
  máy nóng lên sẽ không biết thủ phạm là vật liệu hay mật độ — hai thay đổi chồng lên nhau, không
  tách được. **Nên đo TRƯỚC khi làm 7B.**
- **Recommended Solution**: Đàm bật HUD hiệu năng trong Cài đặt, mở tab Thành Phố trên iPhone, xoay
  camera ~10 giây rồi chụp màn hình. Nếu FPS < 30: hạ `metalness` về 0 ở chế độ `lowDetail` để bỏ
  hẳn nướng PMREM cho máy yếu (đường lui đã có sẵn — `createSkyEnvironment` trả `null` là hợp lệ,
  cảnh vẫn chạy, chỉ mất phản chiếu kim loại).
- **Estimated Complexity**: Low (đo: ~5 phút của Đàm; vá nếu cần: ~1 giờ).
- **Blocking Conditions**: không chặn gì đang chạy. **Nên** chặn Phase 7B để hai thay đổi không
  chồng lên nhau.
- **Review Trigger**: trước khi bắt đầu Phase 7B (mật độ/địa hình); hoặc ngay khi Đàm thấy máy nóng.
- **Owner**: cần Đàm đo (AI không chạm được vào iPhone thật)
- **Status**: Open — **nửa DESKTOP đã đóng, nửa iPhone vẫn chưa đo.**
- ✅ **CẬP NHẬT 2026-08-17 — NỬA DESKTOP CỦA MỤC NÀY ĐÃ CÓ SỐ, VÀ ĐẠT** (xem `PERFORMANCE.md`).
  Đo trên **Apple M3 · ANGLE Metal · 1100×700 · DPR 2**, 24/24 cảnh: frame time **3,90–5,20 ms**
  trên trần 16,67 ms ⇒ **dư 3,2 lần**. Ba lo ngại của mục này được trả lời riêng từng cái:
  **(a) `MeshStandardMaterial` đắt hơn cho mỗi điểm ảnh** — ĐÚNG, và đó chính là trục đắt: 80% chi
  phí đi theo điểm ảnh. Nhưng ở cỡ cửa sổ này nó chỉ tiêu 5,20 ms lúc xấu nhất.
  **(b) nướng PMREM mỗi lần dựng cảnh** — không hiện ra trong frame time khung ổn định (đúng như
  mục này dự đoán: chi phí một-lần-mỗi-lần-dựng, không phải mỗi khung).
  **(c) công trình đi từ 1 lên 5–7 lệnh vẽ** — đo được 12–13 lệnh vẽ cả cảnh, không phải nút thắt.
  ⇒ **Trên Mac: KHÔNG cần hạ `metalness`, KHÔNG cần bỏ PMREM.** Đường lui ấy vẫn giữ nguyên cho
  iPhone. ⚠️ **Bộ số M3 KHÔNG suy ra được cho iPhone** — GPU khác, băng thông khác, không quạt, và
  `PERFORMANCE.md` ghi rõ điều này. Mục này vì vậy **thu hẹp phạm vi còn ĐÚNG iPhone**.
- ⚠️ **CẬP NHẬT 2026-08-14 — PHASE 7B ĐÃ LÀM MÀ CHƯA CÓ SỐ ĐO NÀY, ghi ra để không ai tưởng là đã
  đo.** Mục này khuyến nghị "nên đo TRƯỚC khi làm 7B" để hai thay đổi khỏi chồng lên nhau; thực tế
  7B chạy trước khi Đàm kịp đo. Lý do chấp nhận được, và đây là lập luận để phản biện chứ không phải
  để trấn an: **7B gần như không tốn thêm gì cho GPU**. Nền vẫn đúng 144 ô hộp trong MỘT
  `InstancedMesh` — địa hình chỉ đổi `y` và hệ số cao của từng thể hiện, không thêm ô, không thêm
  lệnh vẽ. Bệ kè đi vào CÙNG khối hình học gộp của công trình (không thêm lệnh vẽ) và chỉ tốn 12
  tam giác mỗi cái, tối đa 5 cái một kỷ ⇒ **≤ 60 tam giác** trên tổng ~5.000. Nếu iPhone có nóng
  thì thủ phạm gần như chắc chắn vẫn là PBR của 7A, không phải địa hình — nên hai thay đổi trên
  thực tế VẪN tách được. Điều này KHÔNG còn đúng ở phase tăng mật độ nhà sắp tới: chỗ đó thêm hình
  học thật, nên **phải đo trước.**

---

## #22 — `sweep-score.mjs` KHÔNG còn chấm được 15 kỷ: bộ lọc "8% tươi nhất" chấm nhầm CỎ, không phải mái

> ## ✅ ĐÃ ĐÓNG (2026-08-16) — VÁ GỐC BẰNG CÁCH **BỎ HẲN** PROXY "MÁI", KHÔNG PHẢI VÁ BỘ LỌC
>
> **Đã làm gì**: gỡ `roofColor` (bộ lọc 8% tươi nhất) và cổng "TỪ CHỐI CHẤM" đi kèm; ruột phép đo
> chuyển sang `scripts/sweepMetric.mjs` (thuần, `import` được, có `sweepMetric.test.js` canh).
> Dải thành phố nay được chia **lưới 6×3 = 18 ô con**, mỗi ô con một màu trung bình → vector 54
> chiều; hai kỷ so nhau **theo TỪNG chặng rồi lấy trung bình các khoảng cách** (gộp 6 chặng trước
> khi so thì hai kỷ lệch ngược chiều nhau ở hai đầu ngày sẽ triệt tiêu nhau).
>
> **Vì sao cách này không chết lần thứ ba**: nó **không chứa giả định mỹ thuật nào** — phép đo
> không biết "mái"/"cỏ"/"tường" là gì. Bệnh gốc mà bộ lọc sinh ra để chữa là *"trung bình trên vùng
> quá rộng pha loãng tín hiệu ~10 lần"*; thu vùng lấy trung bình xuống **1/18** chữa đúng bệnh đó
> mà không cần biết mái nằm ở đâu.
>
> **Hai hướng đã LOẠI, ghi lại để phiên sau khỏi thử lại** (bổ sung cho ba hướng ở phần
> Recommended Solution cũ bên dưới):
> - *Đối chiếu điểm ảnh với `roofColor` mà `eraStyle.js` khai* → **vòng tròn**: chọn điểm ảnh theo
>   màu đã khai rồi đo xem màu có khớp màu đã khai không.
> - *Lượt ảnh mặt-nạ do `city-preview.mjs` dựng* (hướng "có vẻ đúng nhất" mà chính mục này đề xuất)
>   → **bất khả thi ở tầng dữ liệu**: chạy 15 kỷ qua `getEraStyle` thì **4/15 kỷ khai mái TRÙNG vật
>   liệu tường** — kỷ 3 (mudbrick/mudbrick), kỷ 12 và 13 (concrete/concrete), kỷ 14 (glass/glass).
>   `materialProfile(role==='roof')` xếp tam giác mái vào họ **vật liệu** `style.roofMaterial`, nên
>   ở bốn kỷ ấy "nhóm mái" và "nhóm tường" là MỘT. Mái **không tách được ngay từ NGUỒN** ⇒ không bộ
>   lọc điểm ảnh nào, kể cả mặt nạ do bên dựng cung cấp, cứu được. ⚠️ Và đúng cặp **12↔13** — cặp
>   hay bị kêu trùng nhau nhất — là cặp dùng chung **cả hai** vật liệu; bản sắc của chúng nằm ở
>   màu, khối và cây cối, không nằm ở mái.
>
> **ĐƠN VỊ GIỮ NGUYÊN CÓ CHỦ Ý**: vẫn là khoảng cách RGB trung bình mỗi bộ ba (/255), nên ngưỡng
> mắt **12** hiệu chuẩn ở Phase 3Y (Spearman 0,854) còn dùng được. Đổi sang biểu đồ tần suất/EMD
> sẽ tạo ra một ngưỡng **chưa hiệu chuẩn** — đúng cái phễu Phase 9A đã dạy.
>
> **SỐ ĐO SAU KHI VÁ** (2026-08-16, bản quét `sweep-light-ky1-15.png`, 15 kỷ × 6 chặng, theme
> sáng, cấp 3, 40 phiên — trên mã Phase 9C `53045b2`):
>
> | | kết quả |
> |---|---|
> | 105 cặp kỷ dưới ngưỡng mắt (12) | **0/105** |
> | cặp kỷ gần nhất | **23,3** (kỷ 11 ↔ 12; chặng sát nhau nhất 16,4) |
> | trung vị 105 cặp kỷ | **41,1** |
> | 15 cặp chặng ngày | **0/15** dưới ngưỡng, gần nhất 20,7 |
> | trải giữa 18 ô con, từng kỷ | 14,6 – 31,6 (lưới thật sự nhìn thấy cấu trúc, không phẳng lì) |
>
> **BẰNG CHỨNG LƯỚI Ô CON CÓ TÁC DỤNG TRÊN DỮ LIỆU THẬT** (không chỉ trên ảnh dựng tay):
> `--selftest` thu lưới về 1×1 — tức quay lại đúng phép trung bình cả dải đã gây ra kết luận sai
> 70/105 ở Phase 4C — cho ra **cặp gần nhất 5,0 và 6/105 dưới ngưỡng**. Tức việc chia ô con nâng
> cặp gần nhất lên **~4,7 lần**. Nhãn in ra cũng đổi theo (`lưới 1×1 (--selftest: ĐÃ THU LƯỚI, số
> phải TỆ ĐI)`) — bản đầu vẫn in "6×3" khi đang chạy 1×1, đúng loại lỗi NHÃN đã cắn ở `frame-fit.mjs`.
>
> **PHÉP ĐO MỚI CÓ TEST RIÊNG** — `scripts/sweepMetric.test.js`, 6 bài, **mỗi bài đã được phá thử
> ít nhất một lần và thấy ĐỎ**: mảng nhỏ không bị pha loãng (phá: thu lưới về 1×1 ⇒ 2 đỏ) · không
> thiên vị màu, đá phiến xỉn đọc được (phá: nhân đôi kênh lục ⇒ 2 đỏ) · chỉ đọc dải thành phố (phá:
> bỏ độ lệch dải ⇒ 1 đỏ) · tất định + số chiều khớp lưới (phá: cộng dồn phụ thuộc thứ tự ⇒ 1 đỏ) ·
> không tràn sang ô bên/dải nhãn (phá: nới bề ngang ô con +20px ⇒ 2 đỏ) · đơn vị vẫn là RGB (phá:
> bỏ căn bậc hai ⇒ 2 đỏ). ⚠️ Hai bài đầu ĐỎ ngay lần chạy đầu tiên và **lỗi nằm ở FIXTURE, không ở
> phép đo**: mảng thử là một dải ngang suốt bề rộng, mà dải ngang chỉ hưởng lợi từ chia HÀNG (trần
> nhạy √3 = 1,73). Đã sửa fixture thành mảng vuông vức (giống vật thật), **KHÔNG hạ ngưỡng cho test
> xanh**.
>
> **KHÔNG ĐỤNG GÌ VÀO RENDERER**: `npm test` 718/718 · lint sạch · build xanh · chunk 3D
> `CityScene3D-BoWYJm9L.js` **trùng băm** với commit `53045b2` · không file nào dưới `src/` import
> `sweepMetric`/`sweep-score`/`frame-score`.
>
> **Bài học đã ghi vào `CLAUDE.md`**: *một "thứ đại diện" (proxy) là một giả định mỹ thuật đội lốt
> một phép đo* — chữ "≈" trong "8% tươi nhất **≈ mái**" chính là giả định, và nó chết trong im lặng
> ở một phase khác do tay một người khác. Đừng vá một proxy hỏng bằng một proxy khôn hơn; hỏi lại
> xem nó sinh ra để giải bài toán gì rồi giải thẳng bài toán đó.

- **Module**: `scripts/sweep-score.mjs` (hàm `roofColor`)
- **Priority**: Medium
- **Severity**: Medium
- **Impact**: mất một nửa năng lực của công cụ chấm bản quét — phần **6 chặng ngày** vẫn chạy tốt
  (nó đo cả cảnh 9 chiều, không dùng bộ lọc này), nhưng phần **so 105 cặp kỷ** thì không đo được
  nữa. Không ảnh hưởng gì tới app chạy trên máy Đàm; đây thuần là nợ ở tầng công cụ dev.
- **Root Cause**: bộ lọc đứng trên một giả định **chưa bao giờ được viết ra**: *"mái là thứ tươi
  nhất trong khung hình"*. Giả định ấy đúng suốt thời kỳ mái được suy từ `accentColor` — một màu
  NHẤN GIAO DIỆN, chọn cho chữ nổi trên nền, nên luôn rực hơn mọi thứ khác. **Phase 6B đổi mái sang
  vật liệu lợp thật** (đá phiến xám lam, bê tông gần trung tính, đồng oxy hoá) và giả định lập tức
  hết đúng: thứ tươi nhất còn lại trong khung hình là **cỏ nắng lọt giữa các khối nhà**.
- **SỐ ĐO** (2026-08-14, bản quét 8 kỷ × 6 chặng, chặng trưa):

  | kỷ | vật liệu khai trong `eraStyle.js` | bộ lọc đo ra | lệch góc màu |
  |---|---|---|---|
  | 5 | `#586a89` đá phiến xám lam (218°) | `#4b5745` ô-liu (60°) | **158°** |
  | 11 | `#3e9883` đồng oxy hoá (166°) | `#5d6b4c` ô-liu (62°) | **104°** |
  | 6 | `#844433` ngói âm dương (15°) | `#572409` (17°) | 2° — "khớp" |
  | 3 | `#c59e79` gạch bùn (30°) | `#6a5625` (43°) | 13° — "khớp" |

  ⚠️ **Bất đối xứng ở hai dòng cuối mới là phần đáng nhớ**: các vật liệu ẤM nằm sẵn gần sắc ô-liu
  của cỏ, nên khi bộ lọc chấm nhầm cỏ thì chúng vẫn "khớp". Tức **đa số kỷ về mặt cấu tạo không có
  khả năng phát hiện lỗi này**; chỉ vật liệu LẠNH mới phơi ra được. Vì vậy cổng kiểm dùng luật
  "MỘT kỷ lệch > 60° là đủ kết luận", KHÔNG phải "quá nửa số kỷ" (đã thử luật quá-nửa: nó **không
  nổ**, vì chỉ 2/6 kỷ có đủ tư cách tố cáo).
- **Current Risk**: đã chặn. Công cụ nay **TỪ CHỐI CHẤM** phần cặp-kỷ và in ra đúng lý do, thay vì
  in một con số. Trước khi vá, nó in ra `✗ kỷ 3 ↔ kỷ 10: 6,7 — dưới ngưỡng mắt` — trong khi kỷ 3 là
  gạch bùn nâu vàng SÁNG và kỷ 10 là đá phiến gần ĐEN, hai thứ không ai nhầm được. Một phiên sau
  rất có thể đã mất cả ngày đi chữa cái không hỏng.
- **Future Risk**: nếu ai đó gỡ cổng kiểm cho "đỡ vướng", công cụ quay lại nói dối tự tin.
- **Recommended Solution**: thay bộ chọn mái bằng thứ **không giả định gì về màu**. Đã thử và loại
  ba hướng trong cùng phiên, ghi lại để phiên sau khỏi thử lại:
  1. *8% điểm ảnh SÁNG nhất* → cả 8 kỷ ra `#908a78` gần y hệt nhau (đang chấm nền/đường sáng).
  2. *Điểm đầu tiên khác nền trời khi quét dọc từ trên xuống* → bắt đúng **đường chân trời** ở mọi
     cột (n=1168 đều tăm tắp ở cả 8 kỷ), không phải nóc nhà.
  3. *Như (2) nhưng chỉ lấy cột nhô lên trên chân trời* → sập về n=0 ở 6/8 kỷ (mốc chân trời lấy
     theo phân vị bị chính các khối nhà kéo lệch).
  Hướng còn chưa thử và có vẻ đúng nhất: cho `city-preview.mjs` dựng thêm **một lượt ảnh mặt-nạ**
  (mái tô màu cờ, mọi thứ khác đen) rồi ghi kèm như `.geom.json` — lúc đó việc "đâu là mái" là dữ
  kiện do bên DỰNG cung cấp, không phải bên ĐO đoán. Đúng tinh thần bài học Phase 4G: *"cỡ ô không
  phải tuỳ chọn của phép đo, nó là sự thật về tấm ảnh"*.
- **Estimated Complexity**: Medium (~nửa ngày) — phải sửa cả `city-preview.mjs` lẫn `sweep-score.mjs`.
- **Blocking Conditions**: không chặn gì. Bảng màu vật liệu vẫn được canh ở tầng thuần bằng 5 hàng
  rào ở `palette3d.test.js` (cặp gần nhất · số cặp dưới 12 · trung vị ≥ 52 · trải độ sáng ≥ 0,30 ·
  trần độ tươi) **cộng một bài đối chứng** bắt bộ hàng rào phải còn bắt được bảng mái hỏng cũ, và
  ở tầng dữ liệu bằng bài `MỖI KỶ PHẢI KHAI MỘT MÀU VẬT LIỆU LỢP ĐỌC ĐƯỢC` (`buildingSpec.test.js`).
- **Review Trigger**: lần tới cần đo màu mái trên ảnh chụp thật; hoặc khi thêm/sửa `roofColor`.
- **Owner**: chưa ai
- **Status**: ✅ **ĐÓNG 2026-08-16** — xem khối đóng khung ở đầu mục. Năng lực chấm 105 cặp kỷ đã
  khôi phục, bằng một phép đo KHÔNG còn proxy nào để mà hỏng lần nữa. Phần thân mục dưới đây giữ
  NGUYÊN làm bản ghi lịch sử (đúng luật của file này: không xoá bản ghi cũ khi lật một kết luận).

---

## #21 — Công trình rộng nhất **3,687 ô** trên một khu đất rộng **3 ô** — chưa ai NHÌN xem nó có cắm vào nhà bên không

- **Module**: `src/engine/city3d/archetypes.js` (`masses`) + `buildingSpec.js` (chi tiết `courtyard`)
- **Priority**: Low
- **Severity**: Low
- **Impact**: nếu thật sự tràn thì hai công trình cạnh nhau có thể lồng vào nhau ở kỷ 6 và kỷ 9 —
  xấu, nhưng không mất dữ liệu và không ảnh hưởng hiệu năng.
- **SỐ ĐO** (2026-08-14, Phase 6A — đo cả 75 bản vẽ ở cấp 3, tái lập được bằng
  `buildingSpec.test.js` bài "BỀ NGANG"): rộng nhất `bp_thanh_quan_viet` (kỷ 6, kỳ quan epic)
  **3,687 ô**; thứ nhì `bp_quoc_hoi` (kỷ 9) 3,019. Phân bố: **5/75 vượt 2,6 · 2/75 vượt 3,0**.
- **Root Cause**: chi tiết `courtyard` đặt một khối rộng `w * 1.1` lệch hẳn `d * 0.82` khỏi tâm, nên
  hình bao nở ra gần gấp đôi. `archetypes.js` ghi mốc thiết kế là *"kỳ quan được phép trải tới
  ~1.7 ô"* — tức con số thật đang gấp hơn hai lần mốc mà chính file đó tự đặt ra.
- **⚠️ CÓ TỪ TRƯỚC PHASE 6A**: đo lại trên đúng commit `f324683` (trước khi thêm chữ ký) ra **cùng
  con số 3,687**. Chữ ký kiến trúc KHÔNG làm nó tệ thêm.
- **Current Risk**: thấp — không có gì hỏng, không ai từng kêu.
- **Future Risk**: trung bình. Mọi lần thêm chi tiết mới vào `emitMotif`/`emitSignature` đều có thể
  đẩy con số này lên mà **không có gì đỏ lên**, vì trước hôm nay không hề có phép đo nào cho bề
  ngang (chỉ có phép đo TỈ LỆ cao/rộng, mà tỉ lệ thì tràn ngang vẫn giữ nguyên).
- **Recommended Solution**: ⚠️ **ĐỪNG SỬA TRƯỚC KHI NHÌN.** Luật của dự án này là *nhìn rồi mới kết
  luận về mỹ thuật*, và chưa ai chụp một thành phố kỷ 6 đủ 5 công trình để xem hai khu đất có thật
  sự chạm nhau không. Có thể hoá ra sân đình tràn sang ô bên lại **đẹp** (thành phố thật thì nhà
  cũng không dừng đúng ranh giới lô đất). Trình tự đúng: dựng fixture kỷ 6 đủ 5 công trình → chụp →
  nếu chồng lấn xấu thì kẹp `courtyard` lại, nếu không thì đóng mục này và sửa lại mốc "~1.7 ô" ở
  `archetypes.js` cho khớp sự thật.
- **Estimated Complexity**: Trivial (kẹp một hằng số) — phần khó là quyết định có nên kẹp không.
- **Blocking Conditions**: cần một lần soi bằng mắt, không cần Đàm quyết.
- **Review Trigger**: bất kỳ ai chạm vào `emitMotif`/`emitSignature`/`archetypes.masses` — bánh cóc
  3,7 ở `buildingSpec.test.js` sẽ đỏ nếu con số phình thêm.
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện 2026-08-14 khi thêm chữ ký kiến trúc, đúng lúc đi tìm xem chữ ký có
  làm công trình phình ra không. Nó không, nhưng phép đo dựng để kiểm điều đó lại tìm ra một thứ
  khác đã nằm sẵn ở đó.

---

## #14 — **95% số phiên tập trung KHÔNG có lễ mừng nào** — và càng chơi lâu càng im lặng

- **Module**: cân bằng game — `src/engine/constants.js` (`CRAFT_QUEUE_SLOTS`, `sessionsToComplete`)
  + `advanceCraftingQueueWithPerks` (`gameStore.js:1494`). KHÔNG phải lỗi của `cityMoment.js`.
- **Priority**: **High**
- **Severity**: High
- **Impact**: đây là **nguyên nhân lớn nhất còn lại của chữ "chán"**, lớn hơn hẳn hai thứ vừa sửa ở
  Phase 3R/3S. Toàn bộ công sức làm lễ mừng đẹp, đa dạng, đúng cột mốc chỉ chạm tới **~5% số phiên**.
  95% còn lại Đàm làm xong 25 phút thật và thành phố **không nói gì cả**.
- **SỐ ĐO** (dựng từ chính `scripts/simulate-pacing.mjs` của repo — 12 phiên/ngày, 370 ngày tới
  Prestige = 4 428 phiên; ghép với `sessionsToComplete` thật của 75 bản vẽ = 420 bước xây):

  | | phiên | tỉ lệ |
  |---|---|---|
  | Có lễ mừng | 215 | **4,9 %** |
  | Im lặng | 4 213 | **95 %** |

  Và nó **xấu dần theo kỷ**: kỷ 1 im lặng 81% → kỷ 5: 93% → kỷ 10: 95% → **kỷ 15: 98%**. Thứ đáng
  lẽ thưởng cho việc chơi lâu thì càng chơi lâu càng tắt.
  ⚠️ Đây đã là **trường hợp TỐT NHẤT**: giả định Đàm LUÔN giữ đủ cả 2 ô hàng đợi. Giữ 1 ô thì số
  phiên có lễ mừng tăng gấp đôi nhưng vẫn dưới 10%.
- **Root Cause**: ba hằng số nhân nhau, không cái nào sai một mình.
  (1) `CRAFT_QUEUE_SLOTS = 2` và **mỗi phiên đẩy MỌI ô tiến 1 bước** ⇒ một phiên tiêu 2 bước xây.
  (2) Tổng bước xây cả game chỉ có **420** (75 bản vẽ × trung bình 5,6 phiên).
  (3) Hàng đợi bị **lọc theo KỶ HIỆN TẠI** (`gameStore.js:1258`) ⇒ chỉ được xây 5 bản vẽ của kỷ
  đang ở; xây hết là im lặng cho tới khi lên kỷ mới, mà **thời gian ở mỗi kỷ tăng dần** (kỷ 1: 4
  ngày → kỷ 15: 69 ngày) trong khi số bản vẽ mỗi kỷ giữ nguyên 5.
- **Current Risk**: cao về TRẢI NGHIỆM, bằng 0 về kỹ thuật — không có gì hỏng, không mất dữ liệu,
  không lỗi. Đây là nợ THIẾT KẾ, không phải nợ mã.
- **Future Risk**: cao. Mọi đầu tư thêm vào lễ mừng/thành phố đều bị chia cho 5% trước khi tới được
  người dùng. Nếu không xử lý, mọi phase kiểu 3R/3S sau này đều lãi thấp một cách có hệ thống.
- **Recommended Solution**: ⚠️ **KHÔNG được AI tự quyết** — mọi phương án đều đổi cân bằng kinh tế
  mà Đàm đã tinh chỉnh, nên theo Playbook (*Architecture Change: đánh giá + trade-off + ADR TRƯỚC,
  rồi mới đổi*) và quy tắc "HỎI TRƯỚC KHI LÀM". Bốn hướng đã cân nhắc, kèm đánh đổi thật:
  - **(a) Tăng `CRAFT_QUEUE_SLOTS` 2 → 3–4.** Rẻ nhất, một hằng số. NHƯNG làm mọi thứ xây xong
    NHANH HƠN ⇒ im lặng tới sớm hơn. **Làm nặng thêm vấn đề, không nhẹ đi.** Loại.
  - **(b) Bỏ lọc theo kỷ hiện tại** — cho xây bản vẽ của kỷ CŨ chưa xây. Mở thêm rất nhiều bước
    xây cho các kỷ dài về sau. **✅ ĐÀM ĐÃ CHỌN HƯỚNG NÀY (2026-08-13).**
    ⚠️ **NHƯNG GIÁ THẬT CAO HƠN "Medium" đã ghi ở đây — đọc hết trước khi bắt tay.** Lúc viết mục
    này tôi mới cảnh báo chung chung là "phá ý niệm mỗi kỷ một thành phố". Kiểm bằng mã thì va chạm
    là **CƠ HỌC, không phải ý niệm**:
    `placeBuilding` (`cityLayout.js:167`) lấy khu đất bằng `BUILDING_ZONES[meta.rank]`, mà `rank`
    chỉ là 0..4 (thứ hạng TRONG kỷ) — **`era` KHÔNG hề tham gia vào việc chọn khu đất.** Nghĩa là
    bản vẽ hạng 0 của CẢ 15 KỶ đều nhắm vào cùng MỘT khu đất. Trộn nhiều kỷ vào một thành phố ⇒ tới
    75 công trình tranh nhau 5 khu đất nhỏ ⇒ rơi vào nhánh dò xoắn ốc, mà nhánh đó ADR-007 nói rõ
    chỉ là "lưới an toàn cho id lạ" và khi nó chạy thì **bất biến "bảo tàng bất động" (nhà xây sau
    không đẩy nhà xây trước đi chỗ khác) bị phá** — chính ADR-007 gọi đây là "bất biến quan trọng
    nhất". ADR-007 cũng đã ghi sẵn điều kiện xem lại: *"nếu một kỷ nào đó có số bản vẽ khác 5 thì
    bảng khu đất phải mở rộng tương ứng"*.
    Ngoài ra `pruneEraScopedBlueprintState` hiện **XOÁ** cả `blueprints` lẫn `research.researched`
    của kỷ cũ, nên muốn xây tiếp thì phải thôi xoá chúng ⇒ state phình thêm và đi vào đúng payload
    đồng bộ nguyên-khối (`TECH_DEBT #8`).
    👉 **Hai cách hiện thực, khác nhau rất xa — phải chọn trước khi viết dòng nào:**
    - **(b1) Công trình kỷ cũ mọc trong thành phố ĐANG chơi.** Thưởng mạnh nhất (nó hiện ngay trên
      nền trang chủ, đúng chỗ Đàm nhìn). NHƯNG bắt buộc **thiết kế lại bảng khu đất** theo cặp
      `(era, rank)` thay vì `rank`. Giữ được tương thích hình ảnh nếu khu đất của kỷ ĐANG chơi giữ
      nguyên như cũ và các kỷ cũ lấy vùng khác — nhưng 75 công trình trên lưới 12×12 (144 ô, còn
      phải chừa chỗ cảnh vật) là bài toán bố cục thật, không phải sửa một hằng số. **Cần ADR mới.**
    - **(b2) Công trình kỷ cũ mọc thẳng vào BẢO TÀNG của kỷ đó.** Bất biến ADR-007 còn nguyên TUYỆT
      ĐỐI (mỗi kỷ vẫn đúng ≤5 công trình trên đúng 5 khu đất rời nhau) và ý niệm "mỗi kỷ một thành
      phố" **được củng cố** chứ không bị phá — thêm nữa nó biến bảo tàng từ thứ đông cứng thành thứ
      LỚN DẦN, chữa luôn lời than "tab Thành Phố ngắm vài lần là chán". NHƯNG phần thưởng YẾU hơn
      hẳn: nền trang chủ chỉ vẽ kỷ hiện tại, nên Đàm phải chủ động vào tab Thành Phố rồi chuyển về
      kỷ cũ mới thấy — tức đúng cái vòng lặp mà Phase 3F sinh ra để phá bỏ.
    ⇒ Đây là **Architecture Change** theo Playbook: phải viết ADR (cân nhắc b1 vs b2 + trade-off)
    TRƯỚC khi sửa. Ước lượng lại: **High**, không phải Medium.
    ✅ **ĐÃ LÀM (2026-08-13, Phase 4I — Đàm chọn `b2`, xem ADR-012).** Bản vẽ kỷ cũ khởi công lại
    được; xong thì vào bảo tàng của kỷ đó. Ba lớp chặn: ô riêng `LEGACY_QUEUE_SLOTS = 1` · nguyên
    liệu kỷ cũ không bao giờ kiếm lại được · không sinh đặc quyền. **Bài toán bố cục khu đất của
    (b1) KHÔNG phát sinh** — mỗi kỷ vẫn đúng 5 công trình trên đúng 5 khu đất, bất biến ADR-007 còn
    nguyên. **State KHÔNG phình**: không thêm trường nào, nên `TECH_DEBT #8` không bị chạm tới.
    ⚠️ **MỤC #14 CHƯA ĐÓNG.** Đây mới là mở đường; **chưa ai đo lại tỉ lệ phiên im lặng** sau thay
    đổi. Trần lý thuyết tăng thêm là ~390 bước xây (70 bản vẽ kỷ cũ × ~5,6 phiên), tức gần GẤP ĐÔI
    con số 420 — nhưng trần đó chỉ đạt được nếu Đàm còn đủ nguyên liệu của các kỷ cũ, mà điều đó
    phụ thuộc lối chơi và **chưa được đo**. Việc tiếp theo cho mục này: chạy lại
    `scripts/simulate-pacing.mjs` có tính đường trùng tu rồi cập nhật bảng số ở trên.
  - **(c) ~~Nâng cấp công trình đã xây Lv.1→2→3~~ — ❌ ĐÃ KIỂM: KHÔNG DÙNG ĐƯỢC.**
    ⚠️ **ĐÍNH CHÍNH NGAY TRONG NGÀY (2026-08-12).** Bản đầu của mục này ghi (c) là "ứng viên mạnh
    nhất, nhân số bước xây lên gấp ~3". **SAI.** Kiểm bằng mã: `upgradeBuilding`
    (`gameStore.js:5717`) là hành động **TỨC THÌ** — bấm nút trong xưởng, trả bằng tài nguyên tinh
    luyện (`getUpgradeRefinedCost`), **KHÔNG tốn một phiên tập trung nào**. Nâng cấp là bể chứa TÀI
    NGUYÊN, không phải bể chứa PHIÊN ⇒ nó không thêm một bước xây nào và không chữa được gì.
    Cơ chế này **đã tồn tại đầy đủ và đang chạy** (`buildingLevels` trong store · UI ở
    `BuildingWorkshop.jsx`/`BlueprintInventory.jsx` · `levelBoost` làm nhà cao thêm thật trong
    `buildingSpec.js:48`) — chỉ là nó không giải quyết vấn đề này.
    👉 *Bài học lặp lại: sổ nợ khẳng định "hạ tầng đã có sẵn" thì phải kiểm bằng lệnh trước khi
    tin — đúng cảnh báo ở đầu file này, mà chính tôi vừa vi phạm khi viết mục này.*
  - **(d) Chấp nhận, nhưng nói thật ở màn thưởng** khi xưởng trống (kiểu `tone:'idle'` mà
    `buildFocusTease` đã có). RẺ nhưng RỦI RO: `CityGrowthMoment` là lớp phủ chặn 3,2 s — nhắc
    "xưởng trống" sau MỌI phiên còn tệ hơn im lặng. Chỉ nên làm nếu gắn kèm (b) hoặc (e).
  - **(e) Tăng `sessionsToComplete`** — cách DUY NHẤT tác động thẳng vào con số. Đánh đổi: mỗi công
    trình lâu xong hơn, đổi hẳn nhịp kinh tế Đàm đã tinh chỉnh.
- ⚠️ **ĐÃ THỬ BÁC BỎ MỤC NÀY MỘT LẦN (2026-08-13) VÀ THẤT BẠI — ghi lại để phiên sau khỏi đi lại.**
  Sau khi #16 hoá ra KHÔNG phải đánh đổi như đã ghi, tôi thử áp cùng nghi ngờ lên #14: *"câu 'thành
  phố không nói gì cả' có bị nói quá không? Giàn giáo (Phase 3H) VỐN đã lên một nấc sau mỗi phiên,
  và nó hiện ngay trên nền trang chủ — vậy thành phố đâu có im lặng."* Kiểm bằng mã thì hai vế đầu
  **đúng**: `advanceCraftingQueueWithPerks` (`gameStore.js:1501`) trừ `sessionsRemaining` mỗi phiên,
  `computeCityLayout` trả mảng `scaffolds`, và `CityBackdrop` có truyền `pending: craftingQueue`.
  **NHƯNG số học bác bỏ toàn bộ lập luận**: cả game chỉ có **420 bước xây**, mỗi phiên tiêu **tối đa
  2 bước** ⇒ nhiều nhất ~420/4 428 phiên (**dưới 10%**) là có giàn giáo để mà lên nấc. 90–95% còn
  lại hàng đợi **RỖNG** — không có gì nhúc nhích, và câu "Xưởng đang trống" (`cityMoment.js:233`)
  chính là app đang nói thẳng ra điều đó. ⇒ **Mục #14 đứng nguyên như đã viết.**
  👉 Bài học: nghi ngờ một mục nợ là đúng, nhưng phải nghi ngờ **cả câu chuyện dễ nghe theo hướng
  ngược lại**. Lần trước phép đo cứu tôi khỏi bỏ sót một lỗi thật; lần này phép đo cứu tôi khỏi
  đóng oan một lỗi thật. Cùng một kỷ luật, hai hướng.
- ✅ **ĐÃ ĐO LẠI SAU PHASE 5D (2026-08-14) — và đây là con số đầu tiên của mục này được đo bằng
  lệnh tái lập được, không phải ước lượng.** Phase 5D thêm nhánh thứ ba vào `buildGrowthMoment`:
  khi xưởng trống, nó **ĐO** xem bản đồ có thật sự đổi gì không (gọi lại chính `deriveProps` /
  `deriveResidentCount` đang dựng thành phố, với `sessionCount` và `sessionCount − 1`) rồi mới nói.
  Đây là hướng **(d)** ở trên — nhưng KHÔNG rơi vào rủi ro đã ghi của (d) ("nhắc xưởng trống sau
  MỌI phiên còn tệ hơn im lặng"), vì nó chỉ mở miệng khi có một thay đổi CÓ THẬT để chỉ vào.

  | | phiên | tỉ lệ |
  |---|---|---|
  | Có lễ mừng xây/nâng cấp (như cũ) | 215 | 4,9 % |
  | **Có tin thật nhờ nhánh mới (mở đường)** | **660** | **14,9 %** |
  | Im lặng (chồng lấn chưa mô phỏng chung ⇒ khoảng) | ~3 565–3 780 | **80–85 %** |

  Cách đo, chạy lại được: `node --import ./scripts/register-esm-loader.mjs scripts/simulate-pacing.mjs`
  cho `eraEntryDays` thật (370 ngày × 12 phiên = **4 440** phiên); ghép với `buildGrowthMoment` chạy
  qua 200 phiên × 4 kỷ × 3 mức công trình.
  ⚠️ **HÌNH DẠNG CỦA VẤN ĐỀ KHÔNG ĐỔI — nó vẫn xấu dần theo kỷ, y hệt bảng gốc ở trên**: kỷ 1 nói
  được **92%** số phiên → kỷ 5: 37% → kỷ 10: 14% → **kỷ 15: 5%**. Lý do là cùng một cơ chế: mạng
  đường cố định **44 ô** (`ROAD_CELL_COUNT`) trong khi số phiên mỗi kỷ tăng từ 48 lên 840. Sau phiên
  thứ 44 của một kỷ thì **thành phố thật sự không còn gì để lớn**: đường hết ô, cư dân chạm trần
  `MAX_RESIDENTS = 28`, cảnh vật chạm trần `MAX_SCATTER_PROPS = 34` — cả ba đều là trần HIỆU NĂNG có
  lý do, không phải chỗ để nới bừa.

- **ĐO LẠI LẦN NỮA (2026-08-14, sau Phase 6C — đường vành đai)**. Phép đo ở trên chỉ ra rất rõ thủ
  phạm nên lần này đo thẳng vào nó: nhánh "xưởng trống" qua 200 phiên × 5 kỷ × 3 mức công trình.

  | mốc phiên trong kỷ | TRƯỚC 6C (44 ô đường) | SAU 6C (80 ô đường) |
  |---|---|---|
  | 1–44   | **100 %** | **100 %** |
  | 45–60  | 38 % | **100 %** |
  | 61–88  | 6 %  | **73 %** |
  | 89–120 | 3 %  | 3 % |
  | 121+   | **0 %** | **0 %** |
  | **tổng qua 200 phiên** | **26,3 %** | **40,7 %** |

  Cách đo, chạy lại được: gọi thẳng `buildGrowthMoment` với `newlyBuilt: []`, `scaffolds: []` (ca
  chiếm ~85% số phiên thật), cho `sessionCount` chạy 1→200.
  ⚠️ **ĐỌC CHO ĐÚNG ĐIỀU NÀY CHỨNG MINH**: vành đai **kéo dài** quãng "phiên nào cũng có gì đó mọc
  lên" từ phiên 44 lên phiên 80 — nó KHÔNG chữa được cái đuôi. Từ phiên 121 vẫn im lặng tuyệt đối,
  y như trước. Với kỷ 15 (840 phiên) thì 80 ô đường vẫn chỉ phủ 10% chặng đường. Nói cách khác:
  **6C mua thêm thời gian, không đổi hình dạng vấn đề** — câu hỏi CÓ/KHÔNG cho Đàm ở dưới vẫn
  nguyên vẹn, và đây vẫn là lý do mục này chưa đóng.
  ⚠️ **ĐÍNH CHÍNH**: con số nghiệm thu đầu tiên tôi ghi cho Phase 5D (*"55–69% tuỳ số công trình"*)
  là **ước lượng, sai**. Đo thật ra **55% phẳng lì ở cả 12 cấu hình**, và số công trình không hề
  tham gia. Đã sửa ở `BAN_GIAO.md`. Bài học đúng bằng bài học Phase 4C: *một con số nghiệm thu phải
  đi kèm CÔNG CỤ đã đo ra nó.*
- ⚠️ **SỐ HỌC PHŨ PHÀNG — đọc trước khi chọn bất kỳ hướng nào**: 4 428 phiên so với 420 bước xây.
  Muốn chỉ **một nửa** số phiên có lễ mừng thì cần khoảng **2 200 bước xây — gấp hơn 5 lần hiện
  tại**. **KHÔNG một tinh chỉnh nhỏ nào làm nổi điều đó.** Vì vậy câu hỏi đúng để hỏi Đàm KHÔNG
  phải "vá thế nào", mà là: **thành phố có nên là phần thưởng của TỪNG PHIÊN không, hay nó vốn là
  phần thưởng của CẢ THÁNG — còn phần thưởng từng phiên đã có hộp vật phẩm + XP + chuỗi ngày lo?**
  Nếu là vế sau thì #14 không phải lỗi, mà chỉ là một kỳ vọng đặt sai chỗ — và việc cần làm là
  chỉnh KỲ VỌNG (đừng đổ thêm công vào lễ mừng), chứ không phải chỉnh KINH TẾ.
- **Estimated Complexity**: (a) Trivial (đã loại) · (b) Medium · (c) — (đã loại, không dùng được)
  · (d) Low · (e) Low về mã / **Cao về rủi ro cân bằng**
- **Blocking Conditions**: ~~cần Đàm chọn hướng~~ → **ĐÃ CHỌN (b) ngày 2026-08-13.** Blocker còn
  lại nay là KỸ THUẬT chứ không phải quyết định: phải chọn giữa **(b1)** và **(b2)** ở trên rồi
  viết ADR mới, vì cả hai đều đụng vào bất biến bố cục của ADR-007.
- **Review Trigger**: trước bất kỳ đầu tư nào thêm vào lễ mừng / hiệu ứng thành phố — nếu chưa xử
  lý mục này thì khoản đầu tư đó chỉ chạm tới ~20% số phiên (trước Phase 5D là 5%).
- **Owner**: (chưa gán)
- **Status**: **Open — đã nhẹ đi nhưng CHƯA đóng.** Im lặng 95% → **80–85%** (Phase 4I mở đường
  trùng tu + Phase 5D nói thật khi bản đồ có đổi) → nhẹ thêm một nấc nữa sau **Phase 6C** (vành đai
  đưa mạng đường 44 → 80 ô: quãng "phiên nào cũng có gì đó mọc lên" kéo từ phiên 44 lên phiên 80,
  tỉ lệ nói-được qua 200 phiên đi từ 26,3% lên 40,7% — bảng đo đầy đủ ở trên). Phần còn lại **không
  sửa được bằng mã** theo hướng hiện tại: sau khi mạng đường mở hết, thành phố hết chỗ để lớn thật,
  nên mọi câu nói thêm sẽ là bịa. Vành đai chỉ dời cái mốc ấy ra xa, không xoá nó — với kỷ 15 (840
  phiên) thì 80 ô đường vẫn chỉ phủ 10% chặng đường. 👉 **Việc tiếp theo cần ĐÀM QUYẾT, không phải AI làm**: chấp nhận rằng thành phố là
  phần thưởng của CẢ THÁNG (⇒ đóng mục này, thôi đổ công vào lễ mừng), hay muốn nó là phần thưởng
  của TỪNG PHIÊN (⇒ phải nới trần lưới/cảnh vật hoặc đổi `sessionsToComplete` — đều là đổi cân bằng
  kinh tế, cần ADR). Phát hiện 2026-08-12 (Phase 3T) khi tự vấn "một màn hình nhàm đi sau bao nhiêu
  ngày lặp thì có mô phỏng được không". Câu trả lời hoá ra là CÓ: repo đã có sẵn
  `scripts/simulate-pacing.mjs` mô phỏng trọn 365 ngày mà chưa phiên AI nào dùng nó để soi trải
  nghiệm — nó xưa nay chỉ dùng để cân kinh tế.

---

## #13 — `useTimer.js` (1 100+ dòng, hot spot) có ĐÚNG 0 bài test — và tài liệu từng ghi ngược lại

- **Module**: `src/hooks/useTimer.js`
- **Priority**: **Medium-High**
- **Severity**: High
- **Impact**: `useTimer` là trái tim của app — đếm giờ, hoàn tất phiên, nghỉ tự động, khôi phục sau
  khi đóng tab, đồng bộ trạng thái tray. Nó gọi `commitCompletedSession` → `completeFocusSession`
  (God function, mục #1). **Không một dòng nào của nó được test bao phủ**: `find src/hooks -name
  '*.test.js'` = 0 file. Mọi thay đổi liên quan nhịp phiên (gồm cả mục #12) hiện đều là sửa mù.
- **Root Cause (hai tầng, tầng thứ hai mới là tầng nguy hiểm)**:
  (1) Hook React có nhiều tác dụng phụ theo thời gian ⇒ khó test bằng `node --test` thuần, nên bị
  hoãn nhiều lần.
  (2) ⚠️ **Tài liệu đã che mất khoản nợ này suốt nhiều tháng.** `BAN_GIAO.md` ghi ở mục "Đang dở"
  rằng đã có `src/hooks/useTimer.test.js` với "41 bài characterization test, **tất cả đều xanh**",
  chỉ vướng chuyện chưa nối vào `npm test`. Kiểm cạn kiệt ngày 2026-08-12:
  `git log --all --diff-filter=A -- '*useTimer.test.js'` **rỗng** ⇒ file chưa từng được commit ở
  bất kỳ đâu. Nó được viết trong một phiên chạy trên container tạm rồi mất khi container bị thu
  hồi. Hệ quả: mọi phiên AI đọc `BAN_GIAO.md` đều tin rằng "lưới đã có, chỉ cần cắm vào" — trong
  khi thực tế là **chưa có gì cả**. Chính phiên 2026-08-12 đã đề xuất "nối 41 bài test vào
  `npm test`" làm task ưu tiên số một trước khi phát hiện ra sự thật.
- **Current Risk**: trung bình-cao — mã đã chạy ổn định nhiều tháng nên rủi ro *tĩnh* thấp, nhưng
  rủi ro *khi sửa* thì cao và hiện đang chặn mục #12.
- **Future Risk**: cao — mọi điều chỉnh nhịp phiên về sau (gần như chắc chắn sẽ có, sau khi Đàm
  chạy phiên thật và phản hồi) đều đâm vào đúng chỗ không có lưới này.
- **Recommended Solution**: KHÔNG cố test cả hook một lượt. Làm theo đúng khuôn đã dùng thành công
  ở `syncService` (hàm thuần `shouldImportVersion` + `hasMeaningfulState` tách ra test riêng): rút
  các quyết định THUẦN ra khỏi hook rồi test chúng — đường nghỉ tự động là ứng viên số một
  (`shouldStartBreakAfterCompletion` đã thuần sẵn; độ trễ 500 ms nên thành hằng số có tên, đặt cạnh
  `MOMENT_MS`, kèm test khoá quan hệ giữa hai số đó). Bao phủ đủ để gỡ chặn #12 TRƯỚC, không cần
  characterization đầy đủ ngay.
- **Estimated Complexity**: Medium (phần thuần) · High (characterization đầy đủ cả hook)
- **Blocking Conditions**: không có blocker kỹ thuật — chỉ cần quyết định làm. Việc test hook React
  đầy đủ thì cần thêm công cụ render, nhưng phần THUẦN thì không cần gì thêm.
- **Review Trigger**: trước bất kỳ thay đổi hành vi nào của `useTimer`, gồm cả mục #12.
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện 2026-08-12 khi định thực hiện chính task "nối bộ test đã có" và
  phát hiện bộ test đó không tồn tại.

---

## #12 — ✅ [ĐÃ XỬ LÝ 2026-08-12] Lễ mừng bị TÍNH VÀO giờ nghỉ: nghỉ tự động chạy trước khi lễ mừng xong

> **Đã xử lý cùng ngày phát hiện (Phase 3Q)** bằng phương án (a): `BREAK_START_DELAY_MS` **500 →
> 3 200 ms**, phủ trọn lễ mừng. Bài test "NHỊP MỘT PHIÊN" (`timerSession.test.js`) đổi từ *chốt mức
> nợ* sang khẳng định **bất biến thật**: `BREAK_START_DELAY_MS >= GROWTH_MOMENT_MS`. Đã chứng minh
> ĐỎ theo CẢ HAI chiều hồi quy: hạ độ trễ về 500 ⇒ đỏ; kéo lễ mừng lên 5 000 mà quên chỉnh độ trễ
> ⇒ cũng đỏ.
> **Đánh đổi đã chấp nhận**: phiên KHÔNG có lễ mừng nay cũng chờ 3,2 s mới vào nghỉ — chấp nhận
> được vì cả hai trường hợp người dùng đều đang nhìn hộp phần thưởng chứ không nhìn đồng hồ, và vì
> lệch về phía "được nghỉ đủ" an toàn hơn lệch về phía "bị ăn bớt".
> Phương án (b) (tầng hiển thị phát tín hiệu "lễ mừng xong") KHÔNG làm — nó đúng hơn về ngữ nghĩa
> nhưng tạo coupling đồng hồ ↔ thành phố, đắt hơn nhiều, để đổi lấy vài trăm mili-giây.
> Giữ nguyên mục này (không xoá) để phiên sau hiểu vì sao độ trễ là 3 200 chứ không phải 500.

**Nội dung gốc lúc phát hiện:**


- **Module**: `src/hooks/useTimer.js` (2 chỗ: dòng ~610 và ~1089) ↔ `src/components/city/CityGrowthMoment.jsx` (`MOMENT_MS`) ↔ `src/App.jsx` (`RewardSequence`)
- **Priority**: Medium
- **Severity**: Low-Medium
- **Impact**: Với cấu hình MẶC ĐỊNH (`autoStartBreak: true`, `settingsStore.js:92`), phiên nghỉ bắt
  đầu đếm sau **500 ms**, trong khi lễ mừng "thành phố lớn lên" chạy **3 200 ms** và hộp thoại phần
  thưởng chỉ hiện ra SAU đó. Nghĩa là đồng hồ nghỉ đã chạy **2 700 ms trước khi lễ mừng kết thúc**,
  rồi tiếp tục chạy suốt lúc Đàm đọc hộp phần thưởng. Tổng thiệt hại thực tế ~8–18 giây trên một
  phiên nghỉ 5 phút (~3–6%).
  Vấn đề KHÔNG nằm ở con số đó mà ở ý nghĩa: **phần thưởng của việc đã làm xong đang bị trừ vào
  thời gian nghỉ.** Lễ mừng lẽ ra là tiền công, không phải khoản Đàm tự trả.
- **Root Cause**: Phase 4′ cắm lễ mừng vào TẦNG HIỂN THỊ (`App.jsx`) — đúng theo thiết kế, để không
  phải sửa store và không phá 3 bài test đang khẳng định `lootModalOpen` bật đồng bộ. Nhưng
  `useTimer` thì không hề biết tầng hiển thị đang chạy một lễ mừng, nên nó vẫn hẹn giờ 500 ms như
  thời chưa có lễ mừng. Độ trễ 500 ms đó có từ TRƯỚC Phase 4′ và chưa ai chỉnh lại cho khớp.
- **Current Risk**: thấp — không mất dữ liệu, không sai số liệu thống kê (phiên nghỉ vẫn được ghi
  đúng độ dài của nó), chỉ là Đàm được nghỉ ít hơn vài giây so với ý định.
- **Future Risk**: trung bình — nếu lễ mừng dài thêm (hoặc thêm màn khác chen vào giữa: mở khoá kỷ
  mới, thành tích…), phần bị trừ sẽ lớn dần mà không có gì cảnh báo. Không có bài test nào canh
  quan hệ giữa `MOMENT_MS` và độ trễ 500 ms, nên nó sẽ trôi âm thầm.
- **Recommended Solution**: KHÔNG nên nối thẳng `useTimer` vào tầng thành phố (sẽ tạo coupling đúng
  thứ mà kiến trúc Phase 4′ cố tránh). Hai hướng sạch hơn:
  (a) đưa độ trễ ra thành hằng số dùng chung, đặt `≥ MOMENT_MS`, kèm bài test khoá
  `delay >= MOMENT_MS` — rẻ nhất, nhưng làm chậm cả trường hợp KHÔNG có lễ mừng (lễ mừng chỉ chạy
  khi thật sự có công trình tiến triển);
  (b) để tầng hiển thị phát một tín hiệu "lễ mừng xong" mà `useTimer` chờ, có timeout dự phòng —
  đúng hơn về ngữ nghĩa, nhưng đắt hơn và đụng vào hot spot.
  Cần Đàm quyết vì đây là thay đổi HÀNH VI đồng hồ trên app production, không phải sửa lỗi hiển thị.
- **Estimated Complexity**: (a) thấp · (b) trung bình
- **Blocking Conditions**: `useTimer.js` là hot spot (`CLAUDE.md`) và **hiện có ĐÚNG 0 bài test**
  (xem mục #13 — bản ghi cũ nói có "41 bài đã xanh, chỉ chưa nối vào `npm test`" là SAI, file chưa
  từng tồn tại). Sửa hành vi đồng hồ lúc này là sửa mà **hoàn toàn không có lưới**, chứ không phải
  "có lưới nhưng chưa cắm". ⇒ Điều kiện gỡ chặn nay là **viết** test bao phủ đường nghỉ tự động
  (mục #13), không phải "nối" gì cả.
- **Review Trigger**: khi Đàm phản hồi về nhịp một phiên thật; hoặc khi lễ mừng/`MOMENT_MS` đổi;
  hoặc khi thêm bất kỳ màn nào chen giữa "phiên xong" và "bắt đầu nghỉ".
  ✅ **Đã có hàng rào tự động (2026-08-12)**: hai con số nay có TÊN và nằm ở tầng thuần
  (`GROWTH_MOMENT_MS` ở `engine/cityMoment.js`, `BREAK_START_DELAY_MS` ở `engine/timerSession.js`),
  kèm bài test "NHỊP MỘT PHIÊN" ở `timerSession.test.js` **CHỐT khoảng lệch ở mức 2 700 ms**. Nợ
  chưa trả, nhưng nay **không thể âm thầm phình to**: kéo dài lễ mừng hay rút ngắn độ trễ đều làm
  bài test ĐỎ và buộc người sửa đọc mục này trước. (Đã chứng minh: nâng lễ mừng lên 5 000 ms ⇒ đỏ.)
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện 2026-08-12 khi rà lại mục "nhịp phiên" của `/goal`. Chưa xử lý vì là
  thay đổi hành vi đồng hồ production + đang thiếu lưới test (xem Blocking Conditions).

---

## #11 — ✅ [ĐÃ XỬ LÝ] Theme TỐI: bầu trời gần như đen ở MỌI giờ, kể cả giữa trưa

- **Module**: `src/engine/city3d/palette3d.js` (độ đậm nhánh `isDark` của `horizon` và `sky2.top`)
- **Priority**: Medium
- **Severity**: Medium (thẩm mỹ, không phải lỗi chức năng — thành phố vẫn đọc được)
- **Impact**: ở theme tối, chân trời có độ đậm 0,27 và đỉnh trời 0,17 **bất kể giờ nào**. Ảnh chụp
  lúc 12 giờ trưa ở theme tối cho ra một bầu trời gần như đen, nhìn không khác gì lúc nửa đêm — tức
  là với người dùng theme tối, cả tính năng "thành phố đổi theo giờ" của Phase 3D mất phần lớn tác
  dụng ở BẦU TRỜI (mặt đất và ánh nắng vẫn đổi đúng).
- **Root Cause**: hai con số này có từ Phase 3C, thời điểm chưa có khái niệm "giờ trong ngày" —
  lúc đó "theme tối" ngầm hiểu là "cảnh chạng vạng", nên để trời tối là hợp lý. Phase 3D tách hai
  khái niệm ra (`nightByClock` ≠ `isDark`) nhưng CHỈ tách ở phần bảng màu vật liệu; độ đậm bầu trời
  vẫn còn dính vào theme.
- **Current Risk**: thấp — chỉ ảnh hưởng thẩm mỹ, và chưa rõ Đàm có dùng theme tối cho tab Thành
  Phố hay không.
- **Future Risk**: thấp, không tăng theo thời gian.
- **Recommended Solution**: cho độ đậm bầu trời phụ thuộc vào CHẶNG TRONG NGÀY thay vì vào theme
  (ví dụ thêm một trường `skyLightness` vào `DAYLIGHT_PROFILES`), giữ theme chỉ còn quyết định độ
  tươi và sắc nền. ⚠️ Đổi sẽ làm mọi ảnh chụp theme tối đã duyệt ở Phase 3C khác đi ⇒ phải chụp
  lại và soi đủ 6 chặng trước khi nhận.
- **Estimated Complexity**: Thấp về code, Trung bình về hiệu chỉnh mỹ thuật (phải soi ảnh lại).
- **Blocking Conditions**: không có. Cố ý KHÔNG sửa trong Phase 3D để commit này chỉ chứa đúng một
  chủ đề và rollback được độc lập — đúng quy tắc commit ở `CLAUDE.md`.
- **Review Trigger**: khi Đàm phản hồi về theme tối, hoặc lần sau có ai chỉnh bảng màu bầu trời.
- **Owner**: (chưa gán)
- **Status**: ✅ **ĐÃ XỬ LÝ 2026-08-12 (Phase 3G)** — và hoá ra vấn đề RỘNG HƠN mục này mô tả.
  Bản quét đủ 15 kỷ × 6 chặng cho thấy không chỉ bầu trời tối, mà **cả cảnh** ở theme tối đều tối
  như nửa đêm vào giữa trưa (mặt đất, tường, mái — tất cả đều đi theo nhánh `isDark`).
  - **Cách sửa KHÁC với "Recommended Solution" ở trên, và cố ý.** Đề xuất cũ là thêm một trường
    `skyLightness` vào hồ sơ chặng — tức chữa đúng cái triệu chứng đã ghi (bầu trời), và bỏ sót
    mặt đất/tường/mái vốn cùng gốc. Bản vá thật đánh vào gốc: đổi ý nghĩa của chính `isDark`.
    Có `daylight` ⇒ **đồng hồ quyết định**, không phải theme; không có `daylight` (bảo tàng, các
    chỗ gọi cũ) ⇒ vẫn theo theme y như trước, nên không chỗ nào đang chạy bị đổi kết quả.
  - **Nguyên tắc rút ra**: *thành phố là một Ô CỬA SỔ.* Cảnh nhìn qua cửa sổ không tối đi vì ta sơn
    tường phòng màu đen. Theme quyết định KHUNG cửa (nền thẻ, viền, lớp tối góc — vẫn giữ nguyên),
    đồng hồ quyết định độ sáng BÊN TRONG khung.
  - **Khoá bằng test**: `palette3d.test.js` → "THÀNH PHỐ LÀ Ô CỬA SỔ: để theme tối thì giữa trưa
    vẫn phải sáng như giữa trưa" (đã xác minh bài này ĐỎ trên code cũ).
  - Đã chụp lại đủ 15 kỷ × 6 chặng × 2 theme và soi bằng mắt trước khi nhận, đúng cảnh báo ở trên.

---

## #10 — ✅ [ĐÃ XỬ LÝ] Glob test chỉ quét MỘT cấp: test đặt trong thư mục con sẽ im lặng không bao giờ chạy

- **Module**: `package.json` (script `test`)
- **Priority**: Low-Medium
- **Severity**: Medium
- **Impact**: câu lệnh test liệt kê tay từng thư mục và mỗi mục chỉ có `*.test.js` — **một cấp**
  (vd `src/components/*.test.js`). Một file test đặt trong thư mục con (`src/components/city/`,
  `src/components/city/render2d/`, `src/components/icons/`, `src/components/shared/`) sẽ **không
  bao giờ được chạy, mà cũng không báo lỗi gì**. Đây là loại hỏng nguy hiểm hơn test đỏ: nó tạo
  cảm giác an toàn giả — người viết tin là có lưới, thực tế không có. Hiện chưa có file test nào
  rơi vào bẫy này (đã kiểm), nhưng số thư mục con trong `src/components/` đang tăng.
- **Root Cause**: glob viết tay, thêm dần theo từng lần có thư mục mới; POSIX `sh` không có
  `globstar` nên `**` không mở rộng đệ quy như trực giác — `src/components/**/*.test.js` thực chất
  chỉ ra đúng MỘT cấp con và sẽ **làm mất** các test đang chạy ở cấp trên.
- **Current Risk**: thấp — chưa file nào bị bỏ sót. Đã né tạm bằng cách đặt
  `src/components/cityRenderers.test.js` ở cấp trên (kèm chú thích giải thích vì sao nó không nằm
  cạnh thứ nó kiểm tra).
- **Future Risk**: trung bình và tăng dần. Kế hoạch Thành Phố 3D sẽ thêm `city/render3d/` cùng
  nhiều module con; đặt test cạnh file nguồn là **quy ước chính thức của dự án**
  (`PROJECT_STRUCTURE.md`), nên khả năng ai đó làm đúng quy ước rồi mất test là có thật.
- **Recommended Solution**: hai hướng, ưu tiên hướng (b) vì không đụng vào bộ chạy test.
  (a) Đổi sang `node --test --test-... 'src/**/*.test.js'` với glob do CHÍNH node mở rộng (đặt
  trong dấu nháy để `sh` không đụng vào) — gọn nhưng phải kiểm lại kỹ danh sách file thực tế được
  chọn, vì đây là đường sống của mọi lưới an toàn.
  (b) Thêm một bài test tự canh: quét mọi `*.test.js` trong `src/` + `api/` rồi khẳng định mỗi file
  đều khớp ít nhất một mẫu trong glob của `package.json` — sai là đỏ ngay, không cần đổi bộ chạy.
- **Estimated Complexity**: Thấp.
- **Blocking Conditions**: không có.
- **Review Trigger**: (đã kích hoạt ngay trong ngày — xem Status).
- **Owner**: (chưa gán)
- **Status**: ✅ **RESOLVED 2026-08-12**, cùng ngày phát hiện. "Review Trigger" ghi ở trên nổ ngay
  ở Phase 3A: cần đặt test cạnh `src/engine/city3d/` và `city/render3d/`, tức phải né glob một lần
  nữa hoặc sửa dứt điểm. Đã chọn sửa dứt điểm bằng **hướng (a)**, sau khi chứng minh nó an toàn:
  glob nay là `'electron/**/*.test.js' 'src/**/*.test.js' 'api/**/*.test.js'` — **đặt trong dấu
  nháy đơn để `sh` KHÔNG đụng vào**, để chính `node --test` mở rộng (node hiểu `**` đệ quy thật,
  POSIX `sh` thì không). Trước khi đổi đã đối chiếu **tập hợp file** của glob cũ và glob mới bằng
  `fs.globSync`: **31 file, giống hệt nhau, 0 mất 0 thêm**, và `npm test` giữ nguyên 315 bài — nên
  đây là thay thế tương đương chứng minh được, không phải đổi liều. Từ nay đặt test cạnh file
  nguồn ở BẤT KỲ độ sâu nào cũng chạy, đúng quy ước chính thức ở `PROJECT_STRUCTURE.md`.
  ⚠️ Ràng buộc còn lại: cú pháp nháy đơn này cần shell kiểu POSIX (Mac/Linux — đúng môi trường dự
  án); chạy `npm test` từ `cmd.exe` của Windows sẽ không mở rộng đúng.

---

## #30 — ✅ [ĐÃ XỬ LÝ 2026-08-16, Phase 9D] Mặt đường render ra DƯỚI ngưỡng mắt đọc được, xét riêng vật liệu (kỷ 11 · 13 · 10 · 3)

> **ĐÃ ĐÓNG CÙNG #27 — hai mục là một bài toán, đúng như hai mục này đã tự nối cứng với nhau.**
> Nguyên nhân gốc KHÔNG phải con số `roadColor` của một kỷ nào, mà là: **màu là trục DUY NHẤT mang
> bản sắc mặt đường**, nên toàn bộ sức ép "15 kỷ phải khác nhau" dồn vào ĐỘ ĐẬM — và độ đậm có đáy.
> Phase 9D mở thêm chín trục (`src/engine/city3d/streetStyle.js`: bề rộng đại lộ · bề rộng ngõ ·
> vật liệu lát · cỡ viên · độ mòn · bó vỉa · vỉa hè · vạch kẻ · kiểu mép) và cho phép đẩy độ đậm
> **bão hoà** (`roadContrastGap`: sàn 0,13 · trần 0,26 · vẫn đơn điệu ngặt).
>
> **Nghiệm thu, đo trên ảnh dựng thật, `--no-shadow`, 4 kỷ × 3 giờ = 12 tổ hợp** (công cụ
> `scripts/road-score.mjs`, mặt nạ do chính bên dựng cấp qua `city-preview.mjs --mask road,ground`):
> **12/12 ĐẠT**. Khoảng cách đường↔đất xấu nhất **0,061** (kỷ 11, 22h — ngưỡng mắt 0,05, biên 23%);
> "hố" sâu nhất **0,202** (kỷ 3, 12h — trần 0,26, biên 22%). So với con số mở mục này: kỷ 11 từ
> **0,113 trên nền đất 0,406** nay là **0,302 trên nền 0,495**.
>
> ⚠️ **Kèm một phát hiện ngoài dự kiến, đã sửa**: kỷ 7 lấy `roadColor` từ **pietraforte** — đá XÂY
> TƯỜNG của Palazzo Vecchio — trong khi Firenze LÁT đường bằng **pietra serena** (xám-xanh). Đá ấy
> cùng họ màu với nền đất ấm của kỷ 7, nên con đường chỉ còn độ sáng để tách khỏi đất, mà độ sáng
> thì đang ở đúng sàn: đo được **0,050 lúc 12h và 0,019 lúc 22h**, dưới ngưỡng mắt. Sửa sang đúng
> vật liệu lịch sử ⇒ **0,200 / 0,191 / 0,198**. Đây là chính bệnh của cả Phase 9D, thu nhỏ vào một
> kỷ: một trục (sáng) phải gánh việc của hai (sáng + sắc).

- **Module**: `src/engine/city3d/palette3d.js` (luật `roadL`), đo ở Phase 9B
- **Priority**: Medium-High
- **Severity**: Medium
- **Impact**: đo trên ảnh dựng thật kỷ 11 lúc 15 giờ, **đã TẮT HẲN `sun.castShadow`** để tách vật
  liệu khỏi ánh sáng: mặt đất sáng **0,406**, còn ngõ phố **0,113** — tức nằm DƯỚI ngưỡng 0,12 mà
  mắt còn đọc ra chi tiết, trước khi bóng đổ chạm vào. Trên ảnh, mạng đường đọc ra thành những
  RÃNH ĐEN cắt qua thành phố chứ không phải phố xá. Phép thử ngược: trong 11,1% khung hình bị
  nghiền của kỷ 11, **9,6 điểm phần trăm vẫn còn nguyên khi tắt sạch bóng đổ** ⇒ phần lớn mảng đen
  của kỷ này là MẶT ĐƯỜNG, không phải bóng. Đây chính là chữ *"mảng đen … tuyệt đối"* trong yêu
  cầu của Đàm, ở dạng literal nhất của nó.
- **Root Cause**: `ROAD_MIN_CONTRAST` (0,13) mang nghĩa *"đường và đất phải cách nhau ÍT NHẤT
  chừng này"*, nhưng nó được **CỘNG THÊM** vào phần chênh lệch riêng của vật liệu chứ không làm
  SÀN cho tổng: `roadL = groundL ± (MIN + |off| × SPAN)`. Vật liệu nào vốn đã xa mức trung tính
  thì bị đẩy HAI LẦN. Nhựa đường kỷ 11 (`#3a3b3e`, cách trung tính 0,265) nhận tổng đẩy **0,289**
  — lớn hơn cả chênh lệch của chính nó — và **không có gì chặn lại**. Luật có SÀN mà không có TRẦN;
  chưa ai từng hỏi *"đẩy xa bao nhiêu thì là quá xa?"*.
- **Current Risk**: trung bình. Ảnh hưởng rõ nhất ở 4 kỷ hiện đại/tối (11, 13, 10, 3) — đúng nửa
  sau hành trình, tức phần Đàm sẽ ở lại lâu nhất.
- **Future Risk**: mỗi lần ai đó làm mặt đất SÁNG lên, mặt đường tự động chìm sâu thêm đúng bằng
  chừng ấy, vĩnh viễn, và không có gì đỏ lên (bài test hiện chỉ canh khoảng cách TỐI THIỂU giữa
  đường và đất — nó canh "đủ khác nhau", không canh "đủ sáng để nhìn ra").
- **Recommended Solution**: ĐÃ VIẾT VÀ ĐÃ ĐO XONG, chỉ chưa ship — thay phép đẩy vô hạn bằng phép
  **đẩy BÃO HOÀ**, có cả sàn lẫn trần mà vẫn đơn điệu ngặt:
  `gap = MIN + (MAX − MIN) × (1 − exp(−|off| × SPAN / (MAX − MIN)))`, với `MAX = 0.26`.
  Kết quả đo đủ 15 kỷ: kỷ 11 đại lộ 0,243 → **0,309** (+27%), ngõ 0,208 → **0,266** (+28%); các kỷ
  sáng gần như không nhúc nhích; **thứ tự 15 kỷ giữ nguyên tuyệt đối**. ⚠️ KHÔNG được sửa bằng
  `Math.max(MIN, …)` (phá thứ tự — đúng phép KẸP mà Phase 7D đã phải gỡ) và cũng không nên chỉ hạ
  `ROAD_SPAN` (bóp đều cả 15 kỷ, kể cả những kỷ đang đúng). Luật cũ là **trường hợp giới hạn** của
  công thức trên khi `MAX → ∞`, nên có thể dò dần rất an toàn.
- **⚠️ BỊ CHẶN BỞI #27, VÀ ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CỦA MỤC NÀY**: bản vá trên **làm ĐỎ** bài
  `15 KỶ RA 15 MẶT ĐƯỜNG` (`palette3d.test.js`) — cặp 3↔10 ban đêm tụt từ 10,3 xuống **7,9**, dưới
  ngưỡng 10. Đo tiếp thì thấy điều đáng nói hơn nhiều: **kể cả khi nới trần tới 0,46 (gần như không
  bão hoà nữa) cặp ấy cũng chỉ lên được 9,8** — tức lời hứa "15 kỷ ra 15 mặt đường" xưa nay **chỉ
  đạt nhờ 3% biên** (10,3 so với ngưỡng 10), và nó đạt được **chính nhờ cái khuyết tật này**: phép
  đẩy vô hạn đang thổi phồng khác biệt ở đầu tối. Gỡ khuyết tật thì lời hứa mất theo.
  ⇒ **#27 và #30 nay là MỘT cặp, phải làm cùng nhau.** Và phương án "chấp nhận vĩnh viễn" mà #27
  đề xuất KHÔNG còn dùng được nữa: chấp nhận #27 nghĩa là giữ #30. Muốn cả hai thì phải tách 15 kỷ
  bằng thứ KHÔNG phải độ đậm — vạch kẻ, bề rộng làn, vỉa hè (tức hình học, đúng như #27 đã gợi ý).
- **Estimated Complexity**: thấp cho riêng công thức (một hàm thuần, đã viết + đã đo); trung bình
  nếu làm trọn gói cùng #27.
- **Blocking Conditions**: #27 (xem trên)
- **Review Trigger**: khi bắt tay vào #27, hoặc khi Đàm nói đường trông như rãnh đen
- **Owner**: phiên AI kế tiếp · **Status**: Open (đã đo đủ, có bản vá, CỐ Ý chưa ship vì sẽ phải
  nới một lời hứa đang có — xem `CLAUDE.md` mục cấm nới ngưỡng cho tiện)

---

## #28 — ✅ [ĐÃ XỬ LÝ 2026-08-15] Mặt đất vẫn là bàn cờ ô vuông phẳng

- **Module**: `src/components/city/render3d/geometryFactory.js` (cạnh) + `sceneGraph.js` (ô nền),
  phát hiện bằng ảnh chụp ở Phase 8A
- **Priority**: Medium-High
- **Severity**: Medium
- **Impact**: ~~(a) **Cạnh sắc**~~ → **ĐÃ ĐÓNG ở Phase 8B** (`bevelWidth` + ba vành mặt bên; ×1,24
  tam giác, 3,8% khung hình đổi đủ để mắt thấy — xem ADR-018). Còn lại:
  (b) **Bàn cờ**: nhìn ảnh kỷ 7 ở khoảng cách thường thấy rõ mặt đất là 144 ô vuông phẳng, mỗi ô
  một sắc độ hơi khác — đúng thứ Đàm gọi là *"grid 12×12 với object đặt trong từng ô"*. ⚠️ Mặt đất
  **không** đi qua `geometryFactory` (nó là `InstancedMesh` riêng ở `sceneGraph.js`), nên cạnh vát
  của Phase 8B **không chạm tới nó** — đừng tưởng vát cạnh đã sửa luôn phần này.
- **Root Cause**: ô nền là `InstancedMesh` của một khối hộp — rẻ và đúng lúc mặt đất còn phẳng,
  nhưng Phase 7B đã cho mặt đất cao độ mà ô nền vẫn giữ nguyên cách dựng cũ.
- **Current Risk**: thấp về kỹ thuật (không có gì hỏng), cao về mục tiêu — đây chính là điều Đàm
  đang phàn nàn, và Definition of Done của anh nói rõ *"nếu câu trả lời vẫn là pixel / blocky /
  low-poly / flat, hãy tiếp tục sửa nền tảng thay vì đánh dấu phase hoàn thành"*.
- **Future Risk**: gộp 144 ô thành một lưới liền có cao độ sẽ làm ô nền hết là `InstancedMesh` —
  phải cân lại lệnh vẽ. Ngược lại, để nguyên thì mọi công sức làm mặt đất và ánh sáng vẫn bị một
  lưới ô vuông đè lên trên.
- **Recommended Solution**: gộp mặt đất thành một lưới liền (mỗi ô 2 tam giác nhưng dùng chung
  đỉnh ở mép) hoặc phá nhịp ô vuông bằng biến thiên cao độ/màu trong từng ô. Đo lệnh vẽ trước–sau.
- **Estimated Complexity**: trung bình
- **Blocking Conditions**: không có blocker cứng. Nhưng cần đo cổng hiệu năng (#23/#26) để biết còn
  bao nhiêu chỗ trống thật.
- **Review Trigger**: khi quay lại mảng "thành phố phải có quy mô" trong chỉ thị của Đàm
- **Owner**: chưa gán
- **Status**: ✅ **ĐÃ ĐÓNG CẢ HAI PHẦN.** (a) cạnh sắc → Phase 8B (ADR-018). (b) bàn cờ → **Phase
  8C** (ADR-019): mặt đất và mặt đường mỗi thứ là MỘT tấm lưới liền lấy mẫu từ `surfaceHeightAt`
  (`render3d/terrainMesh.js`), thay cho 144 + ~52 khối hộp. Dữ liệu thềm bậc **không đổi một con
  số** — chỉ cách vẽ đổi, đúng như Đàm cho phép (*"giữ data/progression nhưng thay đổi cách render"*).
  - **Đã trả lời câu hỏi "Future Risk" ở trên bằng số đo**: lệnh vẽ **KHÔNG đổi** (2 trước, 2 sau —
    tấm liền cũng chỉ là 1 lệnh vẽ như `InstancedMesh`). Tam giác thì có: địa hình **2.330 → 7.130**
    (6.498 đất + ~630 đường), tức +4.800 = **+8% ngân sách**; cả cảnh ~29.000 → **~36.100 = 60%**
    của trần 60.000. Đây là khoản chi lớn nhất từ đầu mảng 8 và nó **chưa được đo trên iPhone thật**
    — xem #23/#26, nay gấp hơn một bậc.
  - **Đi kèm**: `terrain.js` thêm `smoothHeightAt`/`surfaceHeightAt`/`tintAt` + vùng đất thoải
    (`APRON_*`) để mép lưới thôi là một hình vuông sắc lẹm; mặt đất thêm hai tầng biến thiên (vết
    loang tần số ~2,9 ô + sườn dốc lộ đất). 11 bài test mới, tất cả đã thử ngược.

---

## #27 — ✅ [ĐÃ XỬ LÝ 2026-08-16, Phase 9D] Ba cặp kỷ có mặt đường gần trùng nhau VÀO BAN ĐÊM (ban ngày thì không)

> **ĐÃ ĐÓNG CÙNG #30 — và đóng bằng cách BỎ HẲN câu hỏi cũ, không phải bằng cách kéo con số lên.**
>
> Mục này đo bản sắc mặt đường bằng **khoảng cách RGB**. Sau khi #30 được vá (phép đẩy độ đậm có
> trần), bài test `15 KỶ RA 15 MẶT ĐƯỜNG` ĐỎ ở cặp **11↔13 (7,9)** — và nó đỏ **một cách đúng đắn**:
> kỷ 11 là lưới Manhattan, kỷ 13 là phố Nhật, **cả hai đều lát NHỰA ĐƯỜNG**. Nhựa đường ở New York
> và ở Tokyo là cùng một vật liệu, nên chúng gần nhau về màu là sự thật vật lý; ép hai con đường
> nhựa ra hai màu khác nhau để một con số đẹp lên mới là nói dối. Đàm nói thẳng ở Phase 9D:
> *"không nới threshold và không giả màu — hãy thay metric RGB bằng đặc trưng structural thực sự."*
>
> ⇒ Phép đo bản sắc chuyển sang **8 trục CẤU TRÚC** (`src/engine/city3d/streetStyle.test.js`), mỗi
> trục lượng hoá về thứ mắt thật sự đọc được, suy từ hai phép đo đã có (một ô ≈ 64 điểm ảnh; ngưỡng
> mắt 12/255) chứ không từ ba hằng số chọn tay. Kết quả trên **cả 105 cặp**: cặp yếu nhất khác nhau
> **3/8 trục**, trung vị **6/8**, không cặp nào dưới 3; **kỷ liền nhau** yếu nhất cũng 3/8.
> Kèm **hai bài đối chứng**: một thế giới 15 kỷ giống hệt nhau (phải ra 0 trục) và một thế giới 15 kỷ
> chỉ chênh nhau 0,001 ô ≈ 0,06 điểm ảnh (sàn 3 trục phải TỪ CHỐI) — để ngưỡng không bị nới dần.
>
> Tầng bảng màu giữ lại đúng hai lời hứa mà **màu** thật sự chịu trách nhiệm được: bảng không dẹt
> (trung vị 105 cặp ≥ 90; đo được 116,4 lúc 12h và 115,9 lúc 22h) và không hai kỷ nào ra ĐÚNG cùng
> một mã màu. Cộng thêm một bài canh chiều ngược: **cặp gần nhau nhất về màu PHẢI là hai kỷ dùng
> chung vật liệu** — nếu một ngày gạch nung và nhựa đường ra cùng màu thì lúc đó bảng màu mới có lỗi.

- **Module**: `src/engine/city3d/eraStyle.js` (`roadColor` 15 kỷ), phát hiện + đo ở Phase 7D
- **Priority**: Low
- **Severity**: Low
- **Impact**: đo 105 cặp kỷ trên bảng màu mặt đường. **Ban ngày: 0 cặp** dưới ngưỡng nhìn-thấy-
  khác-nhau (cặp gần nhất 12,4 · trung vị 116,4). **Ban đêm: 3 cặp** — kỷ 3↔10 = 10,3 · 10↔13 =
  10,3 · 1↔5 = 10,9 (trung vị 116,6). Không cặp nào là hai kỷ LIỀN NHAU (cách nhau lần lượt 7, 3
  và 4 kỷ), nên Đàm gần như không bao giờ nhìn hai cái cạnh nhau.
- **Root Cause**: hai tầng cộng lại. (a) Vật liệu thật sự CÓ trùng họ — nhựa đường Babylon và
  macadam ám bồ hóng Manchester đều là mặt tối gốc hắc ín; ép chúng khác nhau là bịa ra một khác
  biệt không có ngoài đời, đúng thứ luật `country`/`landmark` ở `eraStyle.js` cấm. (b) Ban đêm bảng
  màu hạ độ tươi 20% (hiệu ứng Purkinje), mà độ tươi chính là chỗ ba cặp này khác nhau — nên chúng
  chỉ chụm lại khi trời tối.
- **Current Risk**: rất thấp. Ba cặp trên tổng 105, đều cách nhau ≥3 kỷ, và chỉ vào ban đêm.
- **Future Risk**: nếu sau này có ai hạ độ tươi ban đêm sâu hơn nữa (về 0,6 như mặt đất), số cặp
  trùng ban đêm nhảy từ 3 lên 7 — đã đo. Bài test `palette3d.test.js` canh cực tiểu ≥ 10 và trung
  vị ≥ 90 nên nó sẽ ĐỎ, không trôi ngầm.
- **Recommended Solution**: đừng chỉnh mã màu để chạy theo con số — ba lần thử ở Phase 7D đều
  chỉ ĐỔI CHỖ vấn đề (kéo kỷ 12 ra khỏi 13 thì nó dính vào kỷ 5). Nếu muốn tách thật thì tách
  bằng thứ KHÔNG phải màu: bề rộng làn, vạch kẻ đường, hoặc vỉa hè — tức hình học, thuộc một
  phase sau. Cũng có thể chấp nhận vĩnh viễn: đường Manchester và đường Babylon giống nhau là
  một sự thật, không phải một lỗi.
- **Estimated Complexity**: trung bình (nếu chọn tách bằng hình học); bằng 0 nếu chấp nhận
- **Blocking Conditions**: lưới 12×12 đã đầy (80 ô đường · 34 ô kỳ quan · 30 ô nhà dân = 144),
  nên thêm chi tiết đường phải làm trong CÙNG ô, không được cấp ô mới
- **Review Trigger**: khi làm bước "Historical Architecture", hoặc nếu Đàm nói hai kỷ nào đó có
  đường giống nhau
- **⚠️ CẬP NHẬT 2026-08-15 (Phase 9B) — MỤC NÀY NAY BỊ NỐI CỨNG VỚI #30**: phương án "chấp nhận
  vĩnh viễn" ở trên **không còn dùng được**. Ba cặp này chỉ đạt ngưỡng 10 nhờ đúng cái khuyết tật
  mà #30 phải sửa (phép đẩy độ đậm KHÔNG CÓ TRẦN đang thổi phồng khác biệt ở đầu tối). Bản vá của
  #30 kéo cặp 3↔10 xuống 7,9; nới trần tới mức gần như không bão hoà cũng chỉ lên 9,8. ⇒ chấp
  nhận #27 = giữ #30 (mặt đường đen dưới ngưỡng nhìn). Hai mục phải làm CÙNG NHAU, và lối ra
  nằm ở gợi ý sẵn có ngay trên: tách bằng HÌNH HỌC chứ không bằng độ đậm.
- **Owner**: phiên AI kế tiếp · **Status**: Open (đã đo đủ, có chủ đích chưa xử lý)

---

## #25 — Nhà dân NHỎ NHẤT ở 3 kỷ không có lấy một ô cửa sổ nào (là hộp trơn đội mái)

- **Module**: `src/engine/city3d/buildingSpec.js` (`emitWindows`), phát hiện ở Phase 7C
- **Priority**: Low
- **Severity**: Low
- **Impact**: `emitWindows` bỏ qua mọi mảng nhà cao dưới `0.3` đơn vị. Với 5 công trình kỳ quan thì
  ngưỡng ấy chưa bao giờ chạm tới; với nhà dân cỡ **nhỏ** thì nó chạm ở **kỷ 3, 6 và 8** — những căn
  ấy dựng ra là hộp trơn đội mái, không một ô cửa. Đo bằng `buildBuildingSpec({type:'house',
  rarity:'common'})`: 3 kỷ này có 0 khối vai `glass`. (Kỷ 1 và 2 cũng không có cửa sổ nhưng đó là
  **đúng** — `windows: 'none'`, lều da thú và nhà vách đất thật sự không có cửa sổ.)
- **Root Cause**: ngưỡng `height < 0.3` là một số TUYỆT ĐỐI áp lên những khối chênh nhau nhiều lần —
  đúng cùng một hình dạng sai với `eaves` mà Phase 7C vừa vá bằng `eaveOverhang`. Lần này chưa vá
  vì chưa đo được là ở cỡ hiển thị thật (một cửa sổ nhà dân rộng ~4 điểm ảnh) thì thêm cửa sổ có
  làm mặt tiền đẹp hơn hay chỉ thành một vệt bẩn.
- **Current Risk**: thấp — chỉ ảnh hưởng căn nhỏ nhất ở 3/15 kỷ, và chúng nằm ở ngoại vi.
- **Future Risk**: nếu sau này nhà dân được phép to lên hoặc camera được kéo gần hơn, số kỷ dính sẽ
  đổi mà không có gì báo.
- **Recommended Solution**: đổi ngưỡng tuyệt đối thành ngưỡng theo tỉ lệ (giống `EAVE_MAX_RATIO`),
  HOẶC cho `plain` một cách vẽ cửa sổ tối giản riêng. **Phải chụp ảnh so sánh trước/sau rồi mới
  chọn** — đây là câu hỏi mỹ thuật, không phải câu hỏi mã.
- **Estimated Complexity**: thấp (một dòng + một bài test + một lần quét ảnh)
- **Blocking Conditions**: không có
- **Review Trigger**: khi làm bước "Historical Architecture" hoặc khi Đàm nói nhà dân trông trống
- **Owner**: phiên AI kế tiếp · **Status**: Open

---

## #26 — Nhà dân chưa có LOD, và cổng hiệu năng iPhone vẫn chưa đo lại (nối với #23)

- **Module**: `src/engine/city3d/dwellings.js` + `buildingSpec.js`, sinh ra từ Phase 7C
- **Priority**: Medium
- **Severity**: Medium
- **Impact**: Phase 7C cộng thêm 17–30 công trình mỗi kỷ. Cảnh nặng nhất (kỷ 7) đi từ ~13.600 lên
  **21.244 / 60.000** tam giác — vẫn trong ngân sách, và nhà dân vào **chung khối hình gộp** nên
  KHÔNG tốn thêm lệnh vẽ. Nhưng số tam giác gần **gấp rưỡi**, mà bản đồ bóng đổ vẽ cảnh lần thứ
  hai, nên chi phí thực tế trên máy yếu là gấp đôi con số đó.
- **Root Cause**: nhà dân dùng đúng `buildBuildingSpec` như công trình thật (ADR-015) nên chúng
  mang đủ chi tiết ở mọi khoảng cách. Riêng kỷ 7 và 9 (`windows: 'arch'`) đắt hơn hẳn: mỗi ô cửa
  dựng thêm một nửa vòm phía trên, mà ở cỡ hiển thị thật một ô cửa nhà dân chỉ rộng ~4 điểm ảnh.
  Đây là chỗ cắt rẻ nhất nếu cần cắt.
- **Current Risk**: **chưa biết** — và đó chính là vấn đề. `TECH_DEBT #23` (đo lại cổng hiệu năng
  iPhone sau khi đổi sang PBR ở Phase 7A) vẫn đang mở, nên hiện KHÔNG có số đo nào trên máy thật kể
  từ trước Phase 7A. Phase 7C vừa cộng thêm tải lên một hệ thống chưa được cân lại.
- **Future Risk**: các bước còn lại của Roadmap (Living City — người đi bộ, xe, khói, cờ) sẽ cộng
  tiếp. Nếu không cân trước thì tới lúc đó sẽ không biết phần nào làm nóng máy.
- **Recommended Solution**: (1) Đàm mở màn Thành Phố trên iPhone, bật HUD hiệu năng, chụp màn hình
  gửi lại — đóng luôn #23. (2) Chỉ khi số đo xấu mới cắt: bỏ nửa vòm cửa sổ cho `plain`, rồi tới
  hạ trần mật độ. **Không cắt trước khi có số** — 35% ngân sách là còn rộng, và cắt mù thì mất chi
  tiết mà không biết có đổi được gì.
- **Estimated Complexity**: đo = thấp (một ảnh chụp) · cắt nếu cần = thấp
- **Blocking Conditions**: **chờ Đàm đo trên iPhone thật** (giống #23 — cùng một lần đo là đóng cả hai)
- **Review Trigger**: trước khi bắt đầu bước "Living City"
- **Owner**: Đàm (đo) → phiên AI kế tiếp (cắt nếu cần)
- **Status**: Open — **nửa DESKTOP đã đóng với câu trả lời "ĐỪNG CẮT", nửa iPhone vẫn chưa đo.**
- ✅ **CẬP NHẬT 2026-08-17 — NỬA DESKTOP ĐÃ CÓ SỐ, VÀ NÓ TRẢ LỜI NGƯỢC VỚI THỨ MỤC NÀY LO** (xem
  `PERFORMANCE.md`). Mục này tự đặt luật đúng — *"**Không cắt trước khi có số**"* — và nay đã có số:
  Apple M3 · 1100×700 · DPR 2, 24/24 cảnh trong **3,90–5,20 ms** trên trần 16,67 ms.
  **Câu trả lời cho câu hỏi LOD là: ĐỪNG CẮT.** Bằng chứng trực tiếp: tam giác **thành phố** chênh
  nhau **43%** giữa kỷ 3 (26.168) và kỷ 11 (37.494), mà thời gian chỉ chênh **2,4%**. Tức thứ mục
  này định cắt — nửa vòm cửa sổ, mật độ nhà dân — nằm trên **trục rẻ nhất trong cả hệ thống**. Cắt
  nó là trả một cái giá thẩm mỹ thật để mua về một khoản tiết kiệm không đo được, đúng cái bẫy
  "chọn mục tiêu tối ưu theo số tam giác" mà `PERFORMANCE.md` ghi vào TOP 3 KHÔNG NÊN.
  ⚠️ Còn lo ngại *"bản đồ bóng vẽ cảnh lần thứ hai nên chi phí thực tế gấp đôi"*: **chưa bác được
  và cũng chưa xác nhận được** — chi phí dựng lại bóng nằm DƯỚI mức nhiễu của phép đo ở mọi cảnh,
  nên không có con số nào để trích. Đó là một câu hỏi còn mở, không phải một câu đã trả lời.
  ⇒ Mục này **thu hẹp phạm vi còn ĐÚNG iPhone**, y như #23. Bộ số M3 không suy ra được cho iPhone.

---

## #29 — Cọ nhìn từ ĐÚNG TRÊN XUỐNG vẫn dẹt thành dấu "✳", vì `parts.js` không nghiêng được khối

- **Module**: `src/engine/city3d/flora.js` (`palm`) + `src/engine/city3d/parts.js` (`prism`), phát
  hiện ở Phase 8D bằng ảnh chụp kỷ 14
- **Priority**: Low
- **Severity**: Low
- **Impact**: `prism` chỉ xoay quanh TRỤC ĐỨNG (`ry`), không nghiêng được, nên tàu lá cọ là những
  tấm NẰM NGANG toả tròn. Nhìn chéo từ bên (phần lớn các cây trên màn hình) thì đọc ra đúng là cây
  cọ; nhưng những cây nằm gần đúng dưới camera thì cả vòng lá dẹt lại thành một dấu hoa thị phẳng.
  Ảnh hưởng kỷ **2, 3, 6, 8, 14, 15** (những kỷ có `palm` trong bảng loài).
- **Root Cause**: giới hạn có chủ đích của tầng hình học, ghi rõ ở đầu `flora.js` — thêm một trục
  xoay vào `parts.js` sẽ kéo theo nhà máy hình học, phép đếm tam giác (`countTriangles`) và phép
  tính cạnh vát, tức chạm vào nền móng của cả 75 công trình.
- **Current Risk**: thấp — đã giảm bớt ở Phase 8D bằng cách buộc **độ rủ vào chiều dài tàu lá** (tàu
  càng dài càng oằn thấp, đúng như cọ thật), tốn 0 tam giác. Cái phễu lá dựng lại được phần lớn,
  chỉ những cây nằm đúng tâm khung hình mới còn dẹt.
- **Future Risk**: nếu sau này camera được phép hạ thấp hoặc kéo gần, tật này sẽ **đỡ đi** chứ không
  nặng thêm — nên nó không phải một quả mìn hẹn giờ.
- **Recommended Solution**: hai hướng, cả hai đều KHÔNG nên làm chỉ vì cây cọ. (a) Thêm trục nghiêng
  cho `prism` — chỉ đáng làm nếu có một lý do KHÁC cũng cần nó (mái dốc thật, cầu thang, dốc cầu);
  lúc đó cây cọ đi ké. (b) Tách mỗi tàu lá thành 2 khối bậc thang xuống — đo rồi: đẩy `palm` từ
  ≤212 lên ~336 tam giác, sát trần 340 của một cái cây. Không đáng cho một tật chỉ thấy ở một góc.
- **Estimated Complexity**: (a) cao và rủi ro · (b) thấp nhưng đắt tam giác
- **Blocking Conditions**: không có — nhưng ĐỪNG làm nếu chỉ vì cọ
- **Review Trigger**: khi có một tính năng KHÁC cần trục nghiêng, hoặc khi Đàm nói cọ trông sai
- **Owner**: phiên AI kế tiếp · **Status**: Open

---

## #31 — `city.dispose()` KHÔNG giải phóng bản đồ bóng (app hiện KHÔNG dính, công cụ thì dính)

- **Tên**: Bản đồ bóng của mặt trời sống sót qua `city.dispose()`
- **Module**: `src/components/city/render3d/sceneGraph.js` (hàm `dispose()`, ~dòng 1167)
- **Priority**: Low · **Severity**: Low hôm nay, Medium nếu kiến trúc đổi
- **Impact**: Mỗi lần dựng-rồi-dọn một cảnh để lại **+2 texture sống sót**. Bản đồ bóng desktop là
  2048×2048; chạy 24 cảnh liên tiếp trên MỘT renderer để lại gần **800 MB bộ nhớ đồ hoạ**.
- **Root Cause**: `dispose()` duyệt `meshes` + `disposables` — hai danh sách chứa những thứ nó TỰ
  tạo ra. Bản đồ bóng thì không nằm trong danh sách nào: nó do chính three tạo ra **muộn hơn**, ở
  lần render đầu tiên, và treo vào `sun.shadow.map`. Đây là hình dạng sai quen thuộc — *dọn theo
  danh sách mình ghi, trong khi có thứ được sinh ra ngoài danh sách ấy*.
- **Current Risk**: **App KHÔNG dính.** `CityScene3D.jsx` (`runtime.dispose()`, ~dòng 422) gọi
  `city.dispose()` RỒI `renderer.dispose()` + `renderer.forceContextLoss()` — mất context thì cả
  bối cảnh đồ hoạ bị thu hồi, kể cả những texture không ai gọi tên. Chỉ CÔNG CỤ dính, vì công cụ
  cố ý dùng lại một renderer cho nhiều cảnh (`bench-suite.mjs`, `--sweep`).
- **Future Risk**: ⚠️ Đây là **mìn hẹn giờ**, không phải lỗi đang chảy máu. Ngày nào có ai làm app
  dùng lại renderer khi chuyển kỷ — một tối ưu hoàn toàn hợp lý và rất dễ được đề xuất, vì dựng lại
  context tốn cả trăm mili-giây — thì rò rỉ này thức dậy trên máy Đàm, và triệu chứng sẽ là *"đi qua
  vài kỷ trong bảo tàng thì máy nóng dần rồi tab sập"*, một triệu chứng KHÔNG trỏ về đây chút nào.
- **Recommended Solution**: một dòng trong `dispose()` — `sun?.shadow?.map?.dispose?.()`. Kèm một
  bài test đòi số texture sau dispose KHÔNG tăng qua nhiều vòng dựng-dọn (đã đo được bằng
  `.city-preview/.leak-work/`, hiệu số rất rõ: bật cập nhật bóng thì 1→3→5→7…, tắt thì đứng yên).
- **Estimated Complexity**: Thấp (1 dòng + 1 bài test)
- **Blocking Conditions**: Không có. CỐ Ý chưa sửa trong phiên Performance Gate vì Đàm đã yêu cầu
  *"không benchmark code đang thay đổi"* — sửa renderer giữa lúc đo thì bảng số không còn nói về
  bản `9b9cb66` nữa. Bản vá đã áp **phía công cụ** để bộ đo không tự làm hỏng con số nó đang đo.
- **Review Trigger**: NGAY khi có ai đề xuất dùng lại renderer giữa các cảnh/kỷ; hoặc phiên nào
  đụng vào `dispose()` vì lý do khác thì sửa luôn.
- **Owner**: phiên AI kế tiếp · **Status**: Open


---

## #32 — ✅ [ĐÃ XỬ LÝ 2026-08-17, Performance Gate] Đồng hồ đo HUD báo THIẾU 56% số tam giác

- **Tên**: `stats.triangles` tự tính bằng công thức riêng, lệch +44.126 so với thực tế
- **Module**: `src/components/city/render3d/sceneGraph.js` · `CityScene3D.jsx` · `CityPerfHud.jsx`
- **Priority**: (đã đóng) — lúc phát hiện là **High**, vì đây là con số Đàm dùng để quyết định
- **Impact**: HUD và trang xem thử báo **34.622** tam giác cho kỷ 7 trong khi máy thật sự vẽ
  **78.748** — thiếu **56%**. Sai theo hướng **trấn an**, tức loại sai nguy hiểm nhất cho một đồng
  hồ đo: nó khiến mọi quyết định "còn dư sức, thêm chi tiết đi" dựa trên một ngân sách bịa.
- **Root Cause**: `stats.triangles` được **DỰ ĐOÁN** bằng công thức
  `buildingTriangles + surfaceTriangles + residents × 24`, trong khi three biết chính xác qua
  `renderer.info.render.triangles`. **Chưa ai từng đặt hai bên cạnh nhau.** Hằng số lệch 44.126
  giống hệt ở cả 15 kỷ chính là hai thứ công thức không biết tới: **vòm trời** (960) và **rặng núi
  chân trời** thêm ở **Phase 9A** (43.166). Người thêm chúng không sửa công thức, và **không có gì
  đỏ lên** vì công thức chỉ được so với chính nó.
- **⚠️ Đây là lần thứ HAI cùng một hình dạng sai**: chú thích của `countTriangles` (`parts.js`) đã
  tự nhận *"có test đối chiếu hai bên"* trong khi bài test ấy chỉ so với **hằng số viết tay**
  (Phase 8B, đã ghi trong `CLAUDE.md`). Bài học đã được viết ra mà vẫn tái diễn ở một file khác ⇒
  bài học chưa đủ, phải có **test thật** mới chặn được.
- **Giải pháp đã áp dụng**: thôi DỰ ĐOÁN, chuyển sang **ĐẾM** — `countSceneTriangles(scene)` /
  `countSceneDrawCalls(scene)` duyệt scene graph theo đúng luật `WebGLRenderer` cộng vào
  `info.render`. Một phép đo trên chính thứ sẽ được vẽ thì không thể lạc hậu khi ai đó thêm khối
  mới. `CityScene3D.publishStats()` còn **đè lên** bằng `renderer.info.render` — HUD phải nói máy
  vừa làm gì, nên nó đọc từ đồng hồ chứ không đọc từ dự báo.
- **Nghiệm thu**: `[stats] tam giác | 78748 | 78748 | +0 (0.0%)` — đo bằng
  `node scripts/city-preview.mjs --era 7 --sessions 80 --level 3 --hour 12 --bench 24`.
  Lệnh vẽ vốn đã đúng (13 = 13) nên phần đó không đổi.
- **Test khoá**: `src/components/city/render3d/sceneStats.test.js` — 3 bài, **cả 3 đã thử-cho-đỏ**
  bằng cách khôi phục đúng công thức cũ. Bài test tự duyệt scene graph bằng mã CỦA NÓ rồi so với
  thứ mã sản phẩm báo (chạy CẢ HAI bên, không bên nào so với hằng số thứ ba), kèm một **đối chứng**
  đòi phần "công thức cũ mù" phải còn > 40.000 tam giác và phải nằm trong con số HUD.
- **Owner**: đã đóng · **Status**: Resolved

---

## #33 — Ma trận 24 cảnh mở lại trình duyệt 25 lần thay vì gộp vào MỘT trang

- **Tên**: `bench-macbook.sh` khởi động Chromium mỗi cảnh một lần
- **Module**: `scripts/bench-macbook.sh` · `scripts/city-preview.mjs` (chế độ `--sweep` đã có sẵn
  đúng kỹ thuật cần dùng, chỉ chưa áp cho `--bench`)
- **Priority**: Low · **Severity**: Low
- **Impact**: Mỗi cảnh phải gói lại bundle + mở lại trình duyệt (~8 giây), tức khoảng **3,5 phút**
  trong tổng ~5 phút chạy là chi phí khởi động chứ không phải chi phí đo. Không sai số nào, chỉ tốn
  thời gian chờ của Đàm.
- **Root Cause**: `--bench` sinh ra để đo MỘT cảnh, còn cơ chế "một trang, một WebGL context, vẽ
  tuần tự nhiều cảnh" chỉ được viết cho `--sweep` (dựng ảnh). Hai chế độ chưa dùng chung đường.
- **Current Risk**: Gần như không. Chỉ là chờ lâu hơn cần thiết.
- **Future Risk**: Nếu sau này ma trận nở ra (15 kỷ × 6 chặng × 2 góc = 180 cảnh) thì 8 giây/cảnh
  thành **24 phút** chỉ để khởi động — đủ lâu để không ai chạy nữa, mà một công cụ không ai chạy
  thì bằng không có (đúng lý lẽ đã viết cho `--sweep`).
- **Recommended Solution**: cho `--bench` đi qua đúng đường của `--sweep`: một trang, một context,
  vòng lặp qua danh sách cảnh. ⚠️ Nhưng phải xử lý `TECH_DEBT #31` TRƯỚC hoặc CÙNG LÚC — dùng lại
  một renderer cho 25 cảnh là chính xác cái điều kiện làm rò rỉ bản đồ bóng thức dậy (2 texture
  2048² mỗi cảnh ⇒ gần 800 MB), và một bộ đo tự làm nóng máy giữa chừng thì mọi con số sau đó đều
  trôi. Hai mục này **nối cứng với nhau**, như #30 ↔ #27 đã từng.
- **Estimated Complexity**: Trung bình (gộp hai đường chạy + #31)
- **Blocking Conditions**: **Đàm đã CHỦ ĐỘNG HOÃN** (2026-08-17, vòng 2 Performance Gate): *"ĐỪNG
  làm bây giờ. Ưu tiên là Đàm có bộ số ĐÚNG một lần, không phải có nó nhanh."* Ghi lại ở đây theo
  đúng yêu cầu của anh, KHÔNG tự làm.
- **Review Trigger**: khi ma trận cần nở ra quá ~30 cảnh, hoặc khi #31 được sửa vì lý do khác.
- **Owner**: phiên AI kế tiếp · **Status**: Open (hoãn có chủ đích)

---

## #34 — ✅ [ĐÃ XỬ LÝ 2026-08-17, vòng 4] `--thu` không kiểm điều kiện tiên quyết, nên lỗi "thiếu thư viện" hiện ra thành 20 dòng lỗi Vite

> ✅ **ĐÃ ĐÓNG.** `--thu` nay chạy **preflight 8 mục trước khi gói bundle**, xếp theo giá (kiểm thư
> mục tức thì → gọi node đọc phiên bản → hỏi Chromium → ghi thử file → hỏi git), **dừng ngay ở mục
> đầu tiên hỏng** và in ✅/❌ kèm **ĐÚNG MỘT lệnh cần gõ**. Ca đã cắn Đàm (`node_modules` có nhưng
> thiếu `three`) nay bị bắt trước khi Vite kịp nói một chữ.
>
> Kèm hai thứ phát sinh, cả hai đều do **thử ngược** lộ ra chứ không do đọc mã:
> **(a)** Mục "đúng thư mục dự án" phải đứng **TRƯỚC** mục `node_modules` — hai triệu chứng giống
> hệt nhau (không có `node_modules`) nhưng cách sửa **ngược nhau**: bảo một người đang đứng nhầm
> chỗ chạy `npm install` là làm họ mất vài phút cài vào thư mục chẳng liên quan rồi hỏng y như cũ.
> **(b)** Mục kiểm git tự tố cáo **sản phẩm của chính nó** — script ghi báo cáo vào `.city-preview/`
> trước khi preflight chạy, nên `git status` thấy nó là "thay đổi chưa lưu". Trong kho thật điều đó
> bị `.gitignore` che đi, tức lời cảnh báo đang đúng **nhờ một file chẳng liên quan** — đúng hình
> dạng quả mìn. Đã lọc. Một cảnh báo kêu oan còn tệ hơn không có: nó dạy người dùng bỏ qua MỌI
> cảnh báo.
>
> **Khoá bằng test** (`scripts/benchMacbookSource.test.js`, 8 bài, tất cả đã thử-cho-đỏ). ⚠️ Chính
> phép thử ngược đã bắt được một lỗ hổng trong bài test đầu tiên tôi viết: nó dựng dự án **không
> có `node_modules` nào cả**, nên mục kiểm số 1 bắt trước và **mục kiểm số 2 chưa từng được chạy** —
> gỡ hẳn mục 2 khỏi script mà test vẫn xanh. Đúng bài học Phase 4D: *"một bài test xanh không cho
> biết có BAO NHIÊU thứ đang giữ nó xanh"*. Nay có bài riêng dựng đúng ca "đủ mọi gói, khuyết đúng
> `three`".
>
> **Chỗ cắt log cũng đã sửa (phần B của vòng 4)**: bản cũ `tail -n 20` giữ 20 dòng CUỐI, mà với lỗi
> build thì **nguyên nhân luôn ở ĐẦU còn ngăn xếp ở cuối** — nên nó đã vứt đúng dòng
> `Rolldown failed to resolve import "three"` và giữ lại toàn `at viteLog (...)`. Nay in **15 dòng
> đầu + 8 dòng cuối** có nhãn rõ ràng, lọc bỏ dòng ngăn xếp thuần khỏi phần trích (KHÔNG lọc khỏi
> file log), và luôn ghi đường dẫn đầy đủ tới `.city-preview/bench-loi-toanvan.log`.

**(Bản ghi gốc, giữ nguyên để đối chiếu:)**

- **Tên**: Chế độ thử nhanh của bộ đo báo SAI NGUYÊN NHÂN khi thiếu `node_modules/three`
- **Module**: `scripts/bench-macbook.sh` (chế độ `--thu`) · `scripts/city-preview.mjs`
- **Priority**: **Medium** · **Severity**: Medium
- **Impact**: **Đã cắn Đàm thật ngày 2026-08-17, mất 4 vòng qua lại.** Máy anh chưa cài đủ phụ
  thuộc; `--thu` chạy tới bước gói bundle rồi Vite đổ ra ~20 dòng lỗi phân giải module. Bộ đo báo
  đúng là "HỎNG", nhưng **không nói được vì sao**, nên cả hai bên phải đoán qua lại vài lượt mới ra
  nguyên nhân thật — trong khi bản sửa chỉ là một câu tiếng Việt.
- **Root Cause**: `--thu` sinh ra ở vòng 2 để **chứng minh bộ đo chạy được trước khi chạy thật**, và
  nó làm đúng phần *phát hiện*: nó dừng, in `!!! CẢNH NÀY HỎNG` kèm 20 dòng cuối. Cái thiếu là phần
  *chẩn đoán*: nó không kiểm **điều kiện tiên quyết** (có `node_modules/three` không) TRƯỚC khi
  khởi động, nên nguyên nhân gốc bị chôn dưới hậu quả. Cùng họ với luật "kiểm CÔNG CỤ trước, kiểm
  mã sau" — chỉ là ở đây phải kiểm **môi trường** trước cả hai.
- **Current Risk**: **Trung bình, và nó chỉ nổ với đúng người không biết code.** Một AI đọc lỗi Vite
  là hiểu ngay; Đàm thì không, mà `--thu` được thiết kế riêng cho Đàm. Tức lỗi này nhắm đúng vào
  người dùng duy nhất của tính năng.
- **Future Risk**: mỗi lần Đàm đổi máy / xoá `node_modules` / clone lại repo là lặp lại y hệt. Và
  mọi phụ thuộc tiên quyết khác (Chromium của Playwright, `zlib`, quyền ghi `.city-preview/`) đều
  có cùng hình dạng — chưa cái nào được kiểm trước.
- **Recommended Solution**: thêm một hàm `kiem_moi_truong()` chạy **trước mọi thứ khác** trong cả
  `--thu` lẫn chạy thật, kiểm theo thứ tự và **dừng ngay ở cái đầu tiên thiếu**, mỗi lỗi in **đúng
  một câu tiếng Việt + đúng một câu lệnh cần gõ**:
  (1) `node_modules/three` → *"Thiếu thư viện 3D. Chạy: `npm install --legacy-peer-deps`"*;
  (2) `node_modules` rỗng/không có → cùng câu lệnh trên;
  (3) không tìm thấy Chromium → câu lệnh tương ứng.
  ⚠️ Kiểm bằng **sự tồn tại của thư mục**, đừng kiểm bằng cách chạy thử rồi bắt lỗi — chạy thử
  chính là thứ sinh ra 20 dòng nhiễu.
- **Estimated Complexity**: **Thấp** (~10 dòng shell). Đây là mục rẻ nhất trong cả file này.
- **Blocking Conditions**: không có.
- **Review Trigger**: lần kế tiếp bất kỳ ai chạm vào `bench-macbook.sh`.
- **Owner**: phiên AI kế tiếp · **Status**: ✅ **ĐÃ XỬ LÝ 2026-08-17 (vòng 4)**

---

## #36 — ✅ ĐÃ ĐÓNG (2026-08-18, Phase 10 Bước 2) — Kỷ 1 và kỷ 2 vẫn KHÔNG có cửa ra vào

- **Module**: `src/engine/city3d/eraStyle.js` (bảng `groundFloor` của kỷ 1, 2) · `buildingSpec.js`
- **Priority**: Medium · **Severity**: Low (mỹ thuật, không ảnh hưởng dữ liệu hay hiệu năng)
- **Impact**: hai kỷ đầu của hành trình — tức thứ Đàm nhìn thấy TRƯỚC TIÊN khi mở bảo tàng — có
  công trình không có lối vào. Nhìn kỹ thì mỗi khối là một hình đặc.
- **Root Cause**: cửa đời cũ nằm ở cuối `emitWindows`, mà hàm ấy thoát ngay ở dòng đầu khi
  `style.windows === 'none'`. Kỷ 1 (lều da thú) và kỷ 2 (nhà bùn) khai `'none'` — hoàn toàn đúng về
  lịch sử — nên chưa bao giờ chạy tới dòng cửa. Hai luật chẳng liên quan gì nhau (có cửa sổ không /
  có cửa ra vào không) dùng chung một câu `return`.
- **Current Risk**: thấp. **Nguyên nhân gốc ĐÃ được sửa ở Phase 10**: `emitGroundFloor` nay được
  gọi từ `buildBuildingSpec` chứ không từ `emitWindows`, nên cửa đã thôi phụ thuộc vào cửa sổ. Hai
  kỷ này chưa hưởng chỉ vì Bước 1 cố ý chỉ làm 3 kỷ (6 · 9 · 13) để nghiệm thu hướng mỹ thuật.
- **Future Risk**: thấp — mục này tự đóng khi Bước 2 chạy.
- **Recommended Solution**: ở Bước 2, khai `groundFloor` thật cho kỷ 1 và 2. Gợi ý đã có sẵn dữ
  liệu: kỷ 1 (Göbekli Tepe) là tấm da thú vén lên trên một khung gỗ — `frame: 'wood'`, `steps: 0`,
  `feature: 'none'` (thời đồ đá thì mặt tiền KHÔNG có gì, và khai `'none'` là một câu trả lời hợp
  lệ chứ không phải chỗ trống). Kỷ 2 (làng ven sông Nin) là lỗ cửa trổ trong tường bùn dày, có
  ngưỡng đất nện.
- **Estimated Complexity**: Thấp — chỉ là hai dòng bảng, mã dựng đã có.
- **Blocking Conditions**: chờ Đàm gật cho Bước 1 (xem `BAN_GIAO.md`).
- **Review Trigger**: khi bắt đầu Bước 2 của Phase 10.
- **Owner**: chưa phân công · **Status**: ✅ **ĐÓNG 2026-08-18 (Phase 10 Bước 2)**

**Đã đóng thế nào** — kỷ 1 khai `door: 'flap'` (tấm da căng treo trên thanh ngang, `frame: 'none'`,
`steps: 0`, `feature: 'none'`), kỷ 2 khai `door: 'flap'` + `frame: 'wood'` (lanh tô gỗ sơn đỏ của
làng thợ Deir el-Medina) + `vernacularFeature: 'awning'` (mành sậy chắn nắng). Phải THÊM một kiểu
cửa mới (`flap`) chứ không tái dùng `panel`: dựng cửa bức bàn cho một túp lều da thú là nói dối
lịch sử tới tám nghìn năm. Gợi ý cũ ở mục này ghi kỷ 1 dùng `frame: 'wood'` — **đã đổi thành
`'none'` sau khi đọc lại**: một tấm da vắt qua thanh ngang thì không có khuôn cửa.

⚠️ **BÀI HỌC RÚT RA — và nó lớn hơn chính mục nợ này.** Mục #36 được đóng ĐÚNG HẠN không phải nhờ
ai nhớ ra, mà nhờ **một con số nằm trong một bài test**: Bước 1 viết `assert.equal(soKyLegacy, 12)`.
Con số ấy là thứ buộc Bước 2 phải mở lại bài test mới chạy xanh được. Một mục nợ ghi trong tài liệu
thì chỉ được đọc khi có người đi tìm; một con số trong bài test thì **tự đòi được đọc**. ⇒ Khi phải
ship một trạng thái dở dang, hãy làm nó **ĐẾM ĐƯỢC trong một bài test**, đừng chỉ ghi vào đây.

---

## #37 — Cửa sổ KHÔNG xoay theo độ nghiêng "tay làm" của thân nhà (sai số dưới một điểm ảnh, nhưng là một luật chỉ đúng một nửa)

- **Module**: `src/engine/city3d/buildingSpec.js` (`emitWindows`)
- **Priority**: Low · **Severity**: Low
- **Impact**: ở những kỷ có `rough` cao (kỷ 1 = 0,90 · kỷ 2 = 0,62 · kỷ 5 = 0,44), thân nhà được
  xoay `ry = jitterR` cho xiêu vẹo tự nhiên, nhưng cửa sổ/bệ/lanh tô thì đặt ở toạ độ mặt tường
  CHƯA xoay và bản thân chúng không mang `ry`. Về nguyên tắc chúng lệch khỏi mặt tường.
- **Root Cause**: `emitWindows` không nhận `jitterR`. Phát hiện khi Phase 10 phải truyền `ry` cho
  các khối tầng trệt (cửa mới CÓ xoay theo, xem `emitGroundFloor`).
- **Current Risk**: rất thấp — đo ra: `jitterR` lớn nhất là `rough × 0,14` = **0,126 rad** ở kỷ 1,
  và trên một bức tường rộng 0,7 thì lệch mép ≈ 0,7/2 × sin(0,126) ≈ **0,044 đơn vị**. Ở cỡ hiển
  thị thật, con số đó dưới một điểm ảnh. Chưa ai nhìn thấy, kể cả trong ảnh cận cảnh 1500px.
- **Future Risk**: trung bình. Nếu một phase sau nâng `rough` lên, hoặc cho camera xuống thấp ngang
  tầm mắt, sai số này lớn dần mà **không có gì đỏ lên** — cùng hình dạng với mọi lỗi mỹ thuật im
  lặng đã ghi trong `CLAUDE.md`.
- **Recommended Solution**: truyền `jitterR` vào `emitWindows` y như đã làm cho `emitGroundFloor`,
  rồi gắn `ry` cho mọi khối cửa sổ/bệ/lanh tô/vòm. ⚠️ Xoay quanh TÂM KHỐI chứ không quanh tâm nhà,
  nên khối lệch tâm vẫn còn sai số vị trí nhỏ — muốn đúng tuyệt đối thì phải quay cả toạ độ
  `(x, z)` quanh tâm mảng nhà. Cân nhắc làm cả hai cùng lúc.
- **Estimated Complexity**: Thấp–Trung bình (một tham số, nhưng chạm ~10 chỗ `out.push` và sẽ làm
  đổi mô tả của MỌI kỷ có `rough` > 0 ⇒ phải quét lại ảnh).
- **Blocking Conditions**: không nên làm chung với Phase 10 — nó đổi cả 15 kỷ, tức phá đúng cái
  tính chất "12 kỷ không suy suyển" mà Bước 1 dựa vào để nghiệm thu.
- **Review Trigger**: khi Phase 10 Bước 2 xong, hoặc khi có phase hạ camera xuống thấp.
- **Owner**: chưa phân công · **Status**: Open

---

## #35 — Toàn bộ bộ đo chưa từng chạy thử ở đường dẫn có DẤU TIẾNG VIỆT + DẤU CÁCH, dù `CLAUDE.md` đã có sẵn "BẪY 2" về đúng chuyện đó

- **Tên**: Công cụ mới chưa được thử ở điều kiện đã từng làm chết một tính năng khác
- **Module**: `scripts/bench-macbook.sh` · `scripts/city-preview.mjs` · `scripts/sweep-score.mjs` ·
  `scripts/shot.mjs` — mọi công cụ ghi/đọc `.city-preview/`
- **Priority**: **Medium** · **Severity**: Medium
- **Impact**: Thư mục dự án trên máy Đàm là **`Bản sao Pomodoro Game - USING`** — có **dấu tiếng
  Việt** VÀ **dấu cách** VÀ **dấu gạch nối**. Bộ đo chạy hoàn toàn trong hộp cát Linux ở đường dẫn
  thuần ASCII không dấu cách (`/home/user/pomodoro-dc`), nên **chưa một dòng nào của nó từng gặp
  điều kiện thật của máy Đàm**. Ngày 2026-08-17 nó chạy được trên máy anh — nhưng đó là **may**,
  không phải **đã kiểm**: không có bài test nào khoá, và lần sau đổi một dòng là mất.
- **Root Cause**: hai thứ độc lập, cả hai đều đã có tiền lệ trong chính dự án này.
  (a) **Dấu cách**: shell không trích dẫn biến đường dẫn (`$X` thay vì `"$X"`) thì `Bản sao Pomodoro
  Game - USING` bị tách thành nhiều tham số. Đây là lỗi shell kinh điển, và `bench-macbook.sh` là
  script shell **mới nhất và dài nhất** trong repo.
  (b) **Dấu tiếng Việt (NFC/NFD)**: macOS lưu tên file ở dạng NFD (`a` + dấu rời), phần lớn công cụ
  khác giả định NFC. `CLAUDE.md` đã ghi hẳn **"BẪY 2"** — launchd thoát mã 78 **không có stderr** ở
  đúng đường dẫn này — và ghi thêm rằng nó *"cùng họ với cái bẫy NFC/NFD làm test nạp hai bản
  React"*. Tức dự án đã trả giá **hai lần** cho đúng cái bẫy này, bài học đã được viết ra, **và
  công cụ mới vẫn không được thử ở điều kiện đó.** Đúng bài học *"một bài học được ghi ra KHÔNG chặn
  được gì; chỉ một bài TEST mới chặn được"*.
- **Current Risk**: **Chưa biết — và "chưa biết" là toàn bộ vấn đề.** Bộ đo đã chạy đạt một lần
  trên máy Đàm, nên (a) có vẻ ổn ở đường đi hiện tại; nhưng không có gì chứng minh nó ổn ở mọi
  nhánh (nhánh lỗi, nhánh `tail -n 20`, nhánh ghi log), và (b) chưa hề được chạm tới.
- **Future Risk**: triệu chứng của cả hai đều **im lặng hoặc gây hiểu nhầm** — (a) cho ra "không
  tìm thấy file" trỏ vào một đường dẫn bị cắt cụt, (b) từng cho ra **thoát mã 78 không có stderr**.
  Cả hai đều trông y hệt "bộ đo hỏng" chứ không giống "đường dẫn có dấu", nên sẽ lại tốn nhiều vòng
  qua lại như #34 vừa tốn.
- **Recommended Solution**: một bài test đọc-mã-nguồn + một lần chạy thật, cả hai đều rẻ:
  (1) test quét `scripts/*.sh` bắt mọi biến đường dẫn dùng không có nháy kép (`$THUMUC` thay vì
  `"$THUMUC"`) — khoá được (a) **vĩnh viễn**, và đây là thứ duy nhất chặn được hồi quy;
  (2) chạy `bash scripts/bench-macbook.sh --thu` một lần từ một bản sao repo đặt ở đường dẫn
  `/tmp/Bản sao Pomodoro Game - USING/` — khoá được (b) một lần, ở chính điều kiện của máy Đàm.
  ⚠️ Làm (2) **trong hộp cát Linux vẫn có giá trị** cho vế dấu cách, nhưng **KHÔNG** thay thế được
  vế NFC/NFD: Linux không chuẩn hoá tên file như macOS, nên vế đó chỉ Đàm mới kiểm thật được.
- **Estimated Complexity**: (1) Thấp · (2) Thấp
- **Review Trigger**: lần kế tiếp có ai thêm/sửa một script trong `scripts/`; hoặc ngay khi bộ đo
  báo một lỗi mà Đàm không hiểu.
- **Owner**: Đàm (chỉ còn vế NFD trên macOS)
- **Status**: **Open — vế DẤU CÁCH đã đóng và đã khoá bằng test; vế NFC/NFD của macOS thì KHÔNG
  kiểm được từ Linux, còn nguyên.**
- ✅ **ĐÃ LÀM ĐƯỢC (2026-08-17, vòng 4)** — `scripts/benchMacbookSource.test.js`:
  **(a)** Preflight chạy trọn vẹn từ một thư mục tên `Bản sao Test - CÓ DẤU`, ở **CẢ HAI** dạng
  chuẩn hoá NFC và NFD — chứng minh đường dẫn đi qua được `cd`, `$PWD`, **hai lần gọi `node`**
  (đọc phiên bản three + hỏi Chromium), `mkdir`, ghi file thử và `df` mà không đứt.
  **(b)** Một bài **đọc mã nguồn** bắt mọi biến đường dẫn để trần trong `scripts/bench-macbook.sh`.
  Nó đi **từng ký tự** chứ không dùng regex, vì `"$(grep -c . $tam)"` trông như đã bọc nháy nhưng
  `$tam` bên trong `$( )` **không** được lớp nháy ngoài che — một phép kiểm bằng regex sẽ báo an
  toàn ở đúng chỗ nguy hiểm nhất. Danh sách biến là **cho-phép** chứ không phải cấm (fail-closed):
  thêm biến mới mà quên bọc nháy thì test ĐỎ ngay. Có **đối chứng** nhốt cả hai hình dạng sai.
  ⚠️ Đã thử ngược: chèn `rm -f $thu_file` để trần vào script ⇒ bài (b) ĐỎ đúng như mong đợi.
- ⚠️ **CÒN LẠI — VÀ ĐỪNG ĐỌC MỤC TRÊN THÀNH "ĐÃ XONG"**: Linux lưu tên file **nguyên byte**, không
  chuẩn hoá gì cả; macOS lưu ở dạng **NFD** và một số tầng lại trả về NFC. Nên bài test trên chứng
  minh được vế **dấu cách + ký tự nhiều byte**, KHÔNG chứng minh được hành vi chuẩn-hoá thật của
  macOS — tức đúng cái đã giết LaunchAgent ở "BẪY 2" (`CLAUDE.md`: thoát mã 78, **không có
  stderr**). Phần ấy chỉ máy Đàm kiểm được, và nó đã thành một dòng trong runbook ở
  `PERFORMANCE.md` ("Một điều CHỈ máy Đàm kiểm được").

---

## #39 — `crownWeight` là một trục MỎNG, và với `barrel` nó KHÔNG THỂ tách được hai kỷ dù khai số nào

- **Module**: `src/engine/city3d/roofStyle.js` + `rooftop.js`
- **Priority**: Low · **Severity**: Low
- **Impact**: trong 6 trục dùng để chứng minh "15 kỷ ra 15 mái", `crownWeight` chỉ tách được **6
  trên 105 cặp** (năm trục kia: 74–99). Tệ hơn, với kiểu `barrel` (ngói ống) thì bước lượng hoá đo
  được là **1,459** trong khi cả dải hợp lệ chỉ rộng **1,25** (`CROWN_WEIGHT_MIN` 0,35 →
  `CROWN_WEIGHT_MAX` 1,6) ⇒ hai kỷ cùng lợp ngói ống (kỷ 4 và kỷ 8) **không bao giờ** phân biệt
  được bằng trọng số, dù khai giá trị nào.
- **Root Cause**: `crownWeight` là MỘT số dùng chung cho năm kiểu đường nét có **độ nhạy hình học
  chênh nhau 16 lần** (đầu đao 0,175 đơn-vị-hình-bao mỗi đơn-vị-trọng-số · ngói ống 0,011). Một
  thang chung áp lên năm thứ nhạy khác nhau thì với thứ nhạy nhất nó quá thô, với thứ ít nhạy nhất
  nó gần như không làm gì — đúng họ với bẫy `eaves` ở Phase 7C, chỉ khác là ở đây thứ chênh nhau
  không phải kích thước khối mà là **độ nhạy của phép biến đổi**.
- **Current Risk**: rất thấp. Bảng vẫn đạt 105/105 cặp ≥ 2 trục nhờ năm trục kia, và trục này vẫn
  có việc thật (nó quyết định số con tiện của lan can, độ vươn của đầu đao — hai thứ nhìn thấy
  được). Nó chỉ **yếu**, không sai.
- **Future Risk**: trung bình. Nguy hiểm nằm ở chỗ một phiên sau đọc bảng, thấy có trường
  `crownWeight`, rồi **trông cậy vào nó** để phân biệt hai kỷ mới thêm — và nó im lặng không làm
  được. Đã chặn bằng cách ghi thẳng sự thật vào `roofStyle.test.js` (danh sách `KHONG_VUA_DAI` bị
  khoá bằng `assert.deepEqual(..., ['barrel'])`, tức nó tự đỏ nếu có kiểu thứ hai rơi vào).
- **Recommended Solution**: nếu cần trục này khoẻ hơn thì **chuẩn hoá theo độ nhạy** — cho mỗi kiểu
  một dải riêng, hoặc đổi `crownWeight` từ "hệ số nhân" sang "đơn vị hình bao" (khai thẳng cái đầu
  đao vươn ra bao nhiêu) để một con số nghĩa như nhau ở mọi kiểu. ⚠️ Đừng nới `CROWN_WEIGHT_MAX`
  cho `barrel` vừa — đó là mua điểm bằng cách cho ngói ống dày gấp ba lần thực tế.
- **Estimated Complexity**: Thấp (một hàm chuẩn hoá + đo lại bước) — nhưng nó đổi hình của mọi kỷ
  có đường nét ⇒ phải quét lại 15 kỷ.
- **Blocking Conditions**: không có.
- **Review Trigger**: khi `crownWeight` tụt xuống 0 cặp tách được (bài `MỖI TRỤC PHẢI CÒN SỐNG` sẽ
  đỏ), hoặc khi có phase thêm kiểu đường nét thứ sáu.
- **Owner**: chưa phân công · **Status**: Open

---

## #70 — KHÔNG CÓ CỔNG NÀO CANH **THỜI GIAN DỰNG CẢNH**, nên một hồi quy 1,7 lần đã ship mà không gì đỏ lên

> Mở 2026-08-21, sau ADR-048. Đây là hình dạng *"một bài học được ghi ra KHÔNG chặn được gì; chỉ một
> bài TEST mới chặn được"* — lần này áp cho một đại lượng chưa ai từng canh: **thời gian**.

- **Tên**: ngân sách THỜI GIAN dựng cảnh không có cổng, chỉ có ngân sách TAM GIÁC và LỆNH VẼ
- **Module**: `src/components/city/render3d/terrainMesh.js` · `src/engine/city3d/{terrain,horizon,noise}.js`
  · bộ cổng ở `src/components/city/render3d/sceneStats.test.js` + `src/engine/city3d/drawCallBudget.test.js`
- **Priority**: Medium · **Severity**: Medium (không sai kết quả; sai về TỐC ĐỘ, và sai trong im lặng)
- **Impact**: ADR-046 làm một lượt dựng cảnh đủ 15 kỷ đi từ **40,9 lên 69,3 giây** và
  `sceneStats.test.js` từ **564 lên 827 giây** — tức bản vá "xoá cái bệ" đã ship kèm một hồi quy
  **1,7 lần** mà **build xanh · lint sạch · 960 bài test xanh**, không một cảnh báo nào. Nó chỉ lộ ra
  vì tôi tình cờ cho một việc đo chạy nền. Dự án đã có cổng cho **tam giác** (`sceneStats.test.js`)
  và cho **lệnh vẽ** (`drawCallBudget.test.js`, mốc riêng từng kỷ — xem `TECH_DEBT #38`), nhưng cả
  hai đều đo *"GPU phải vẽ bao nhiêu"*, không cái nào đo *"CPU phải tính bao nhiêu để dựng ra nó"*.
- **Root Cause**: hai đại lượng ấy là hai thứ khác nhau và trước ADR-046 chúng đi cùng chiều, nên
  không ai để ý là chỉ có một nửa được canh. ADR-046 tách chúng ra: **0 tam giác mới, 0 lệnh vẽ mới,
  mà +28 giây CPU** — đúng cái ô trống giữa hai cổng.
- **Current Risk**: thấp NGAY BÂY GIỜ — ADR-048 đã kéo con số xuống dưới cả mốc trước ADR-046
  (lưới chân trời 33,52 → **20,18** giây), nên hôm nay còn dư chỗ. Rủi ro là ở lần sau.
- **Future Risk**: trung bình. Chỗ đau không phải máy dựng ảnh mà là **máy của Đàm**: một hồi quy
  kiểu này ở tầng dựng lưới biến thành thời gian chờ lúc mở tab Thành Phố và lúc chuyển kỷ, mà
  `PERFORMANCE.md` thì chỉ đo phần **VẼ** (ms mỗi khung hình), không đo phần **DỰNG**.
- **Recommended Solution**: một bài test cổng đo thời gian dựng lưới của một hoặc hai kỷ rồi so với
  một mốc. ⚠️ **Và đây chính là chỗ khó, đừng làm ẩu**: thời gian là đại lượng phụ thuộc máy, nên một
  mốc TUYỆT ĐỐI viết vào test sẽ hoặc kêu oan trên máy chậm, hoặc mù trên máy nhanh — đúng bẫy
  Phase 7D ở dạng tệ nhất. Hướng đúng gần như chắc chắn là một **QUAN HỆ đo được trong cùng một lượt
  chạy**: ví dụ *"dựng lưới chân trời không được tốn quá N lần thời gian dựng lưới mặt đất"* (hôm
  nay tỉ số ấy là **15,5×** — tự nó đã là một con số đáng nhìn), hoặc đếm thẳng **số lần gọi
  `valueNoise`** thay vì đếm giây: một phép đếm thì tất định, chạy được ở CI, và nó chính là đại
  lượng sinh ra chi phí.
- **Estimated Complexity**: Medium (phần khó nằm ở việc CHỌN đại lượng, không ở việc viết bài test).
- **Blocking Conditions**: không có.
- **Review Trigger**: lần kế tiếp có phase nào đụng vào `terrain.js` / `horizon.js` / `noise.js` /
  `terrainMesh.js`, hoặc khi `npm test` lượt một lại vượt ~10 phút.
- **Owner**: chưa phân công · **Status**: Open

---

## #69 — `terrain-score.mjs --ngoai` NAY TRẢ VỀ **NaN Ở 13/15 KỶ**: một công cụ đo mà tiền đề của nó đã bị gỡ mất một nửa

> Mở 2026-08-21, cùng phiên với ADR-046/047 («xoá cái bệ»). Đây KHÔNG phải một lỗi chạy — nó là hình
> dạng đã cắn dự án nhiều lần: **một công cụ đo đúng cho tới ngày thế giới nó đo bị đổi, rồi nó tiếp
> tục in ra số mà không ai biết số ấy đã hết nghĩa** (`TECH_DEBT #22`, ADR-014→ADR-019).

- **Tên**: phép đo "vành ngoài vuông hay tròn" mất mất một nửa năng lực vì `settle` đã bị xoá
- **Module**: `scripts/terrain-score.mjs` (`chamBeVuong`, nhánh `--ngoai`)
- **Priority**: Low · **Severity**: Low (không mã sản phẩm nào hỏng; thứ hỏng là một CÔNG CỤ chẩn đoán)
- **Impact**: `chamBeVuong` dựng trên giả định `san = -APRON_DROP` — tức *"ra tới vành ngoài thì mọi
  tia đều chạm đúng một mặt phẳng, nên tia nào chạm SỚM hơn là tia đi qua chỗ đất còn nhô"*. ADR-046
  xoá phép ép-về-phẳng (`settle`), nên vành ngoài nay **gợn liên tục** và rất nhiều tia **không bao
  giờ chạm** mức `san` ⇒ mẫu số 0 ⇒ **NaN**. Đo thật sau bản vá: **13/15 kỷ ra NaN**, với
  **5.323/10.800 tia bão hoà**; chỉ kỷ 1 (0,926) và kỷ 5 (1,130) còn đo được — và cả hai đều nói
  "tròn", đúng như mong đợi. TRƯỚC bản vá: 1,306 với **0/10.800** tia bão hoà.
- **Root Cause**: công cụ hỏi *"tia chạm mặt phẳng đáy ở bán kính nào"*, mà **mặt phẳng đáy ấy nay
  không tồn tại**. Câu hỏi vẫn hợp lệ về mặt hình học (vuông hay tròn), chỉ có **cách hỏi** là đã
  chết theo tiền đề.
- **Current Risk**: thấp — công cụ đã có một khối cảnh báo tiếng Việt dài ngay trên `chamBeVuong` nói
  rõ nó còn trả lời được câu gì và KHÔNG còn trả lời được câu gì, và `PROJECT_STRUCTURE.md` đã ghi
  kèm dòng ấy vào bảng công cụ. Việc "vành ngoài có phẳng không" nay do `scripts/plateau-score.mjs`
  trả lời bằng một đại lượng khác hẳn (phân bố độ dốc theo vành đồng tâm).
- **Future Risk**: trung bình nếu KHÔNG ghi ra — một phiên sau chạy `--ngoai`, thấy `NaN`, rồi hoặc
  (a) tưởng địa hình hỏng, hoặc (b) "sửa" bằng cách hạ `san` xuống cho có số, tức **thay một tiền đề
  chết bằng một tiền đề bịa**. Cả hai đều là cách hỏng đã có tên trong `CLAUDE.md`.
- **Recommended Solution**: hai hướng, chưa chọn. **(1)** đổi `chamBeVuong` sang hỏi bằng một mức
  **TƯƠNG ĐỐI** (phân vị cao độ của chính vành đó) thay vì một mức tuyệt đối — đúng bài học Phase 7D
  (*"câu này có chứa chữ 'so với' không?"*); **(2)** gỡ hẳn nhánh `--ngoai` và để `plateau-score.mjs`
  gánh trọn, chấp nhận mất trục "vuông hay tròn". ⚠️ Hướng (2) rẻ hơn nhưng mất một trục **đã từng
  bắt được lỗi thật**, nên đừng chọn nó chỉ vì tiện.
- **Estimated Complexity**: Low (một hàm thuần, đã có `--selftest` 4/4 xanh để bám vào).
- **Blocking Conditions**: không có.
- **Review Trigger**: lần kế tiếp có ai chạy `terrain-score.mjs --ngoai` và thấy `NaN`, hoặc khi có
  phase đụng lại `APRON_DROP`/`APRON_SPREAD`.
- **Owner**: chưa phân công · **Status**: Open (cố ý — công cụ đã tự khai bệnh, chưa cần chữa ngay)

---

## #68 — "CHỈ SỐ BỆ" CHIA CHO ĐỘ DỐC TRONG LƯỚI, NÊN BA KỶ **CỐ Ý PHẲNG** SẼ MÃI MÃI ĐIỂM CAO DÙ KHÔNG CÓ BỆ NÀO

> Mở 2026-08-21. Ghi ra vì đây là loại số **rất dễ bị đọc thành một hồi quy** ở phiên sau, đúng hình
> dạng *"một con số đúng trả lời sai câu hỏi"* (bài học Performance Gate vòng 2, 2026-08-17).

- **Tên**: mẫu số của chỉ số bệ có thể tiến về 0, nên tỉ số phóng to vô hạn ở kỷ địa hình phẳng
- **Module**: `scripts/plateau-score.mjs` (`chiSoBe`)
- **Priority**: Low · **Severity**: Low (phép đo vẫn đúng công thức; rủi ro nằm ở việc ĐỌC nó)
- **Impact**: `chỉ số bệ = (dốc lớn nhất vành 6–9) ÷ (dốc trung bình vành 0–5)`. Đó là một QUAN HỆ,
  đúng như §1 yêu cầu — nhưng ba kỷ khai địa hình gần như phẳng có mẫu số cực nhỏ (kỷ 3: **0,021** ·
  kỷ 11: **0,023** · kỷ 14: **0,000**), nên tỉ số của chúng luôn nằm ở đầu bảng kể cả khi vành ngoài
  hoàn toàn lành. Bằng chứng trực tiếp: **độ NHÔ** của đúng ba kỷ ấy sau bản vá chỉ **0,026–0,028**
  (trung bình 15 kỷ: 0,047), tức chúng nằm trong nhóm **TỐT NHẤT** bảng theo đại lượng tuyệt đối.
- **Root Cause**: một tỉ số không phân biệt được *"tử số lớn"* với *"mẫu số nhỏ"*. Với đất phẳng chủ
  ý, mẫu số nhỏ là **đúng thiết kế**, không phải triệu chứng.
- **Current Risk**: thấp — bảng in ra đã có **hai** cột (chỉ số bệ và độ NHÔ) và báo cáo phiên
  2026-08-21 đã nói thẳng *"ở ba kỷ này hãy đọc cột độ NHÔ"*.
- **Future Risk**: trung bình — một phiên sau chạy công cụ, thấy kỷ 14 = 9,75 rồi kết luận *"cái bệ
  quay lại rồi"* và đi sửa một thứ không hỏng (đúng cách `TECH_DEBT #22` đã tiêu mất ba phase).
- **Recommended Solution**: in thêm một **cột cảnh báo tường minh** khi mẫu số dưới một ngưỡng đã
  hiệu chuẩn (vd `dốc trong lưới < 0,05` ⇒ in `⚠️ đất phẳng chủ ý — đọc cột độ NHÔ`), thay vì để
  người đọc tự nhớ. **KHÔNG** chữa bằng cách cộng một hằng số vào mẫu số — đó là mua một con số đẹp
  bằng cách làm hỏng một quan hệ (thứ ADR-025 đã cấm với mặt đường).
- **Estimated Complexity**: Low (một dòng in, cộng một bài test đối chứng dựng đất phẳng tuyệt đối
  và ĐÒI cột cảnh báo phải bật).
- **Blocking Conditions**: không có.
- **Review Trigger**: lần kế tiếp có ai trích chỉ số bệ để kết luận về một kỷ có `relief` thấp.
- **Owner**: chưa phân công · **Status**: Open

---

## #67 — **ĐỊA HÌNH CHE**: kỷ 4 và 5 tụt dưới cổng "thấy nước" 5% vì một bản vá ĐÚNG về vật lý, không vì bề rộng

> ⚠️ **CẬP NHẬT 2026-08-24 (Phase 19) — KỶ 5 TỰ LÀNH, VÀ NÓ LÀNH VÌ MỘT LÝ DO CHẲNG LIÊN QUAN GÌ
> TỚI MỤC NÀY.** ADR-061 lùi khung toàn cảnh ra ở cả 15 kỷ để không cắt công trình nào. Mặt nước
> thì nằm **NGOÀI** lưới thành phố, nên lùi ra là kéo thêm nước vào khung: kỷ 5 đi **3,51% → 7,30%**,
> vượt cổng 5%. `waterView.test.js` đã cập nhật: `TRUOT` từ `[2,3,4,5,6,7,9,10]` còn
> `[2,3,4,6,7,9,10]`, `DAT.length` 6 → 7.
> ⇒ Mục này nay **chỉ còn kỷ 4**.
>
> ⚠️ **NHƯNG ĐỪNG ĐÓNG NỬA NÀY VỘI — nó đang ĐỨNG NHỜ ADR-061, mà ADR-061 thì đang chờ Đàm quyết**
> (xem `#89`: phép lùi ấy làm trục chặng ngày tụt xuống dưới ngưỡng mắt). Nếu Đàm chọn hoàn tác
> phép lùi thì kỷ 5 **tụt lại** xuống 3,51%. Đây đúng hình dạng bài học Phase 7D: *một lời hứa đúng
> nhờ một thứ chẳng liên quan thì gãy trong im lặng đúng lúc thứ đó đổi* — nên nó được ghi ra ở đây
> thay vì để yên trong một con số test.

> ⚠️ **CẬP NHẬT 2026-08-24 (Phase 21) — VÀ ĐÚNG CÁI GÃY ẤY ĐÃ XẢY RA, RỒI TỰ LÀNH LẠI TRONG CÙNG
> MỘT PHASE.** Kỷ 5 đổi phe **hai lần nữa** trong Phase 21: bản hợp nhất (ranh giới thửa đi theo
> cung) kéo nó **7,30% → 3,63% ❌**, rồi §5 (nâng số thửa của bảy kỷ) kéo nó **3,63% → 7,00% ✅**.
> Cả hai lần cùng MỘT cơ chế và **không lần nào có ai đụng tới nước**: `terrain.js` san phẳng dải
> đất dưới chân mạng đường, nên đổi mạng đường là đổi hình dạng đồng bằng, là đổi việc sống đất gần
> có che bờ xa hay không (`roadCells` kỷ 5: 80 → 83).
> ⇒ **Đây là lần thứ NĂM kỷ 5 đổi phe** (5,54 → 3,51 → 7,30 → 3,63 → 7,00). Điều phải đọc ra không
> phải "kỷ 5 đã khỏi" mà là **kỷ 5 đứng đúng ở ranh giới nên mọi thay đổi địa hình đều lật được
> nó** — nó không có bệnh riêng, nó là cái phong vũ biểu. Mục này vẫn **MỞ** cho kỷ 4 (3,92%, chưa
> lần nào vượt cổng), và cách chữa THẬT vẫn là hướng `#60` (cầu · bến · thuyền · kè).
> ⚠️ §5 làm **13/14 kỷ đi LÊN** một chút, nhưng ba kỷ hẹp 6·7·10 vẫn ở 2,88 · 3,53 · 1,85 — xác
> nhận lại rằng chứng BỀ RỘNG (`#59`) là một chứng KHÁC, không san đất nào chữa được.

> Tách khỏi `#59` ngày 2026-08-21 theo lệnh Đàm (*"`#59` chứa hai loại nguyên nhân: TÁCH. Hai bệnh,
> hai cách chữa, hai điều kiện đóng"*). `#59` giữ nửa **bề rộng** (đã đóng); mục này giữ nửa **che khuất**.

- **Tên**: bờ XA của mặt nước tụt xuống theo triền đất và khuất sau sống đất gần ⇒ diện tích nước
  nhìn thấy được tụt dưới cổng 5% ở kỷ 4 và kỷ 5
- **Module**: `src/engine/city3d/terrain.js` (`drain`/`tilt`) · `settingStyle.js` (`side`) ·
  `sceneGraph.js` (`worldYaw`, ADR-041) · đo bằng `scripts/water-score.mjs`
- **Priority**: Medium · **Severity**: Low–Medium (hai kỷ, và mắt vẫn ĐỌC RA là nước — xem dưới)
- **Impact**: §1(B) phát hiện `drain` (hướng đất thấp) **lệch hoặc ngược hẳn** `settingStyle.side`
  (phía có nước) ở **9/14 kỷ** — tức nước đang chảy lên dốc. Sửa 9 dòng cho khớp là **đúng vật lý**,
  và nó làm cổng "thấy nước" **TỆ ĐI** ở hai kỷ:

  | kỷ | nền (`9c7032c`) | §1(B) với `drain` SAI | §1(B) với `drain` ĐÚNG |
  |---|---:|---:|---:|
  | 4 | 5,11% ✅ | 4,95% ❌ | **4,95% ❌** |
  | 5 | 5,54% ✅ | 4,40% ❌ | **3,51% ❌** |
  | 7 | 2,41% ❌ | 4,38% ❌ | **3,55% ❌** (kỷ này thuộc `#59`, ghi ở đây để so) |

- **Root Cause**: **một hệ quả vật lý, không phải một lỗi.** Đất nay thoải xuống *phía có nước*, nên
  bờ XA tụt xuống và khuất sau sống đất gần — đúng cách một thung lũng thật che mất khúc sông bên
  kia. Nguyên nhân này **khác hẳn** `#59`: ở đó dòng nước hẹp tới mức *không tồn tại góc nhìn nào*
  đạt cổng; ở đây nước đủ rộng, chỉ là bị **che**.
- **Current Risk**: thấp. Cột thứ hai của bảng nghiệm thu (tương phản nước↔bờ) vẫn **30,8–115,5**
  trên ngưỡng mắt 12 ở cả 14 kỷ ⇒ *chỗ nào có nước thì mắt vẫn ĐỌC RA là nước*. Cái trượt là cột
  **DIỆN TÍCH**, không phải cột **ĐỌC RA** (xem bài học "hai câu hỏi, đừng để một cột gánh cả hai").
- **Future Risk**: nếu phiên sau đọc `TRUOT = [4, 5, 6, 7, 10]` rồi đi chữa cả năm kỷ bằng MỘT cách
  thì chắc chắn sai ở một nửa — đó đúng là lý do Đàm bắt tách mục.
- **Recommended Solution**: **KHÔNG tự chọn — đụng bảng đã duyệt.** Hai hướng, cả hai đều đã đo được:
  - **(a) Hạ `tilt` ở kỷ 4 và 5.** Rẻ nhất. Giá: `tilt` là thứ cho đất *một lý do* để cao thấp
    (ADR-045); hạ nó là trả lại một phần cái "đất cao thấp không vì gì cả".
  - **(b) Cho `worldYaw` ngắm DỌC theo triền dốc thay vì ngang qua nó.** Đúng bài toán hơn (nhìn
    xuôi dòng thì không có sống đất nào chắn), nhưng `worldYaw` là một bảng đã duyệt ở ADR-041 và
    đổi nó là đổi bố cục của kỷ ấy.
  - ❌ **Đã BÁC hai cách**: hạ cổng 5% (cái phễu Phase 9A — Đàm cấm bằng chữ ở `#59`) và quay `drain`
    về giá trị sai (mua một con số bằng cách nói dối địa lý — ADR-025 cấm).
- **Estimated Complexity**: (a) rất thấp · (b) trung bình
- **Blocking Conditions**: **CHỜ ĐÀM QUYẾT** — cả hai hướng đều đụng bảng đã duyệt
- **Review Trigger**: khi có ai đó định sửa `TRUOT` trong `scripts/waterView.test.js`, hoặc khi
  `tilt`/`worldYaw` của kỷ 4 · 5 được đụng tới vì bất kỳ lý do nào khác
- **Owner**: Đàm chốt · **Status**: **Open — CHỜ ĐÀM QUYẾT**

---

## #66 — KỶ 12 KHÔNG PHẢN ỨNG VỚI HẠT GIỐNG NHIỄU: **0/144 ô đổi bậc** khi đổi hạt, nên một trong hai nguồn biến thiên của nó là mã chết

- **Tên**: `terrain.js` — kỷ 12 (Nga, `plain` · `tilt 0,55` · `terraces 2`) cho ra **cùng một bản đồ
  bậc thềm** dù hạt giống nhiễu đổi; kỷ 14 cũng vậy nhưng ĐÚNG THIẾT KẾ (`terraces: 1`, cố ý phẳng)
- **Module**: `src/engine/city3d/terrain.js` (`ERA_TERRAIN[12]`, `truongTho` → chia bậc)
- **Priority**: Low · **Severity**: Low (không ai nhìn thấy — xem "Current Risk")
- **Impact**: bài `HẠT GIỐNG PHẢI CÓ TÁC DỤNG` (`terrain.test.js`) nay phải khai hai ngoại lệ
  tường minh thay vì một:

  ```js
  assert.deepEqual(KHONG_DOI, [12, 14], '…');
  assert.deepEqual(KY_PHANG, [14], 'chỉ kỷ 14 được phép phẳng do khai terraces: 1');
  ```

  Kỷ 14 nằm trong `KY_PHANG` nên nó có lý do; **kỷ 12 thì không**.
- **Root Cause** (đã đo, không đoán): kỷ 12 khai `tilt = 0,55` với chỉ **2 bậc**. Thành phần triền
  dốc đều chiếm hơn nửa trọng số, và với hai bậc thì **ranh giới lượng hoá rơi hẳn vào phần triền**
  — nhiễu còn lại không đủ để đẩy một ô nào qua ranh. Nói cách khác: phép chia bậc **bão hoà**, nên
  một trong hai nguồn biến thiên của kỷ ấy không tới được đầu ra. Cùng họ với bài học Phase 8D
  (*"một cơ chế sắp xếp trong một cái hộp đầy là mã chết"*), chỉ khác là cái hộp ở đây là **số bậc**.
- **Current Risk**: **gần bằng 0, và con số nói ra điều đó**: biên độ cao độ thật của kỷ 12 chỉ
  **0,11 đơn vị** trên toàn lưới — dưới ngưỡng mắt ở mọi khung hình đang dùng. Đàm không thể thấy
  sự khác biệt dù hạt có tác dụng hay không.
- **Future Risk**: ngày nào ai đó nâng `relief` hoặc `terraces` của kỷ 12 (hoặc thêm một kỷ thứ 16
  cùng hình dạng tham số), họ sẽ **tưởng** hạt giống đang tạo biến thiên trong khi nó không — đúng
  loại mã chết mà Phase 8D mất cả một phase mới phát hiện. Ngoại lệ `[12, 14]` là thứ giữ cho điều
  đó không im lặng.
- **Recommended Solution**: hạ `tilt` của kỷ 12 xuống dưới ~0,45 **hoặc** nâng `terraces` lên 3.
  ⚠️ **KHÔNG tự làm**: cả hai đều đụng một dòng bảng đã được duyệt kèm `note` địa lý (Stalingrad bám
  bờ tây sông Volga — đồng bằng thật, nghiêng đều thật), và đổi nó sẽ đổi ảnh của kỷ ấy. Đây là
  quyết định mỹ thuật, không phải một phép sửa lỗi.
- **Estimated Complexity**: rất thấp (một con số) — cái đắt là phải đo lại ảnh + cổng không-trôi
- **Blocking Conditions**: cần Đàm gật, vì nó đụng bảng `ERA_TERRAIN` đã duyệt
- **Review Trigger**: khi `relief` hoặc `terraces` của kỷ 12 đổi vì bất kỳ lý do gì · hoặc khi có
  kỷ thứ ba rơi vào `KHONG_DOI` (lúc ấy đây thôi là một ca lẻ và thành một khuyết tật của cơ chế)
- **Owner**: chưa phân công · **Status**: Open

---

## #65 — `canal` VÀ `estuary` KHÔNG CÓ MỘT DÒNG HÌNH HỌC NÀO CỦA RIÊNG CHÚNG: BA TRONG SÁU "KIỂU NƯỚC" DỰNG BẰNG CÙNG MỘT ĐOẠN MÃ

- **Tên**: `river` · `canal` · `estuary` chia nhau ĐÚNG một nhánh trong `insetGoc`; thứ phân biệt
  chúng trên màn hình chỉ là **một con số bề rộng** và **một mã màu**
- **Module**: `src/engine/city3d/setting.js` (`insetGoc`, `BANK_WOBBLE`) ·
  `src/engine/city3d/settingStyle.js` (`isValidSetting`)
- **Priority**: Medium · **Severity**: Medium (không hỏng gì; nhưng bảng 6 kiểu đang hứa nhiều hơn
  thứ nó giao)
- **Impact**: `grep` cả cây cho thấy trường `water` chỉ đổi hành vi ở **ba** chỗ, không hơn:
  `insetGoc` rẽ nhánh cho `meander` · `isValidSetting` đòi `width === null` cho `sea` ·
  `WATER_TINT` tra một mã màu. Nghĩa là `river`, `canal`, `estuary` đi qua **cùng một dòng mã**.

  Đo trên ảnh đã dựng — độ lượn của mép bờ, khớp một đường thẳng bình phương tối thiểu rồi lấy độ
  lệch, đơn vị ĐIỂM ẢNH, cùng khung `--zoom 2,4 --width 1400`, mép GẦN camera:

  | kỷ | kiểu | `ground` | `BANK_WOBBLE` | lệch RMS | lệch lớn nhất | dài đoạn đo |
  |---:|---|---|---:|---:|---:|---:|
  |  2 | river   | flat      | 0,45 |  3,72 px | 25,9 px | 1025 px |
  |  8 | estuary | bluff     | 0,50 | 20,14 px | 84,7 px | 1025 px |
  | 10 | canal   | reclaimed | 0    |  **2,88 px** | 20,2 px | 1030 px |

  ⚠️ **Cột "canal" là sàn đo được của phép đo, không phải độ lượn thật** — `BANK_WOBBLE` của nó
  bằng 0, tức bờ nó thẳng TUYỆT ĐỐI về mặt toán học, và 2,88 px kia hoàn toàn là răng cưa khi
  rasterise một đường chéo. Con sông kỷ 2 chỉ nhỉnh hơn cái sàn ấy **1,3×**. ⇒ **Thứ được cho là
  bản chất của một con kênh đào — bờ kè thẳng băng — trên màn hình không phân biệt được với một con
  sông.** Nhìn ảnh cũng đúng như số: cả hai đọc ra là một dải nước thẳng cắt chéo khung hình, khác
  nhau ở bề rộng.
- **Root Cause**: ⚠️ **BIẾN THỂ THỨ SÁU CỦA "MỘT TRƯỜNG GÁNH HAI VIỆC", VÀ LẦN NÀY NÓ NGƯỢC:
  không phải một trường gánh hai đại lượng, mà là MỘT ĐẶC ĐIỂM ĐỊNH NGHĨA KIỂU LẠI SỐNG Ở MỘT
  TRƯỜNG KHÁC.** Độ thẳng của bờ do `BANK_WOBBLE` quyết định, mà `BANK_WOBBLE` tra theo **`ground`**
  (`ridge`/`flat`/`bank`/`bluff`/`reclaimed`), KHÔNG theo `water`. Kỷ 10 thẳng **vì nó tình cờ khai
  `ground: 'reclaimed'`**, không vì nó là `canal`. Và `isValidSetting` không hề buộc hai trường ấy
  đi cùng nhau ⇒ một kỷ tương lai khai `canal` + `flat` sẽ có một con "kênh đào" uốn lượn tự nhiên,
  **và không một bài test nào đỏ**. Đó đúng là điều Đàm gọi là *"kênh đào mà lượn tự nhiên là sai
  bản chất"*.

  Với `estuary` thì bảng đã tự biết và tự sửa từ trước: chú thích `settingStyle.js` ghi rõ định
  nghĩa cũ (*"một cái phễu rộng mở dần ra"*) đã bị bỏ vì *"hình dáng ấy tầng vẽ không dựng được ở cỡ
  này"*, và nay `estuary` chỉ hứa MỘT điều — **vẫn còn bờ bên kia**. Lời hứa ấy **ĐẠT**: ảnh kỷ 8
  cho thấy dải nước có bờ đối diện rõ ràng, khác hẳn `sea`. ⇒ Nói cho sòng phẳng: `estuary` mang
  thông tin thật, nhưng thông tin ấy là **so với `sea`**, không phải so với `river`; so với `river`
  thì nó đúng là *"một con sông rộng"* (6 ô so với 1,2–3,4 ô).
- **Current Risk**: thấp — hôm nay 15 dòng bảng tình cờ khai đúng cặp (`canal` ↔ `reclaimed`).
- **Future Risk**: trung bình — một dòng bảng mới là đủ để phá, và triệu chứng ("kênh đào trông như
  con lạch") thuộc loại chỉ thấy được bằng mắt trên một tấm ảnh cận cảnh mà không ai chụp.
- **Recommended Solution**: hai việc, làm được độc lập với nhau.
  **(a) RẺ, LÀM ĐƯỢC NGAY** — `isValidSetting` **từ chối thẳng** `water: 'canal'` mà `ground` không
  thuộc nhóm bờ-người-làm (`reclaimed`), đúng khuôn "từ chối thẳng, không tự chữa" của
  `isValidGroundFloor`/`#59`; kèm một bài test đếm được. Việc này khoá lại một sự thật bảng đang
  đúng nhờ may mắn.
  **(b) ĐẮT, CẦN QUYẾT ĐỊNH MỸ THUẬT** — cho `canal` một hình học của riêng nó (bờ kè đá thẳng đứng
  · bến · cầu bộ hành), tức đúng nội dung `#60`. ⚠️ **Và phải đo TRẦN trước** (luật §2-C): kỷ 10 chỉ
  chiếm **1,18%** khung hình, nên mọi chi tiết đặt lên bờ kè của nó đều nằm dưới ngưỡng mắt ở khung
  toàn cảnh — đây là bài học Phase 11 (+110.076 tam giác lên mái mà bản quét không phân biệt nổi)
  lặp lại y hệt. Nếu làm thì phải nói trước rằng nó **phục vụ khung CẬN CẢNH**, đúng luật Hệ quả 2b.
- **Estimated Complexity**: (a) nhỏ · (b) một phase riêng
- **Blocking Conditions**: (b) chờ Đàm quyết cùng `#60`/`#61`
- **Review Trigger**: khi có ai thêm/đổi một dòng `water: 'canal'` · hoặc khi mở phase ven nước
- **Owner**: — · **Status**: ⏸️ **HOÃN có chủ ý — Đàm chốt 2026-08-20** (*"HOÃN tới sau mặt trận
  hình ảnh. Gom làm một phase sau."*), và mục này nay **gánh thêm NỬA CÒN LẠI CỦA `#64`**.

  `#64` đã đóng hai vế đo được (có eo đất · đã bo góc), nhưng vế thứ ba Đàm ra — *"phải đọc ra
  **mỏm đá trong khúc uốn**, không phải **lâu đài giữa hào nước**"* — vẫn CHƯA đạt, và nó không sửa
  được ở tầng `setting.js`. Lý do đúng là lý do của chính mục này: `meander` lấy hình từ **khoảng
  cách tới hình chữ nhật lưới**, nên dù đã bo góc nó vẫn là một **vành đai đều bề rộng ôm quanh một
  hình vuông**. Một khúc suối thật thì bề rộng thay đổi dọc dòng, ôm ba mặt chứ không bốn, và tâm
  của nó không phải tâm thành phố. ⇒ Ba kiểu `canal` / `estuary` / `meander` đều cần **một dòng
  hình học của riêng chúng**, và đó là một phase, không phải một bản vá.

---

## #64 — ✅ **ĐÃ ĐÓNG 2026-08-20** — KỶ 5 LÀ MỘT **ĐẢO**: `MEANDER_NECK = 1,6` KHÔNG CẮT RA ĐƯỢC LỐI VÀO NÀO

- **Tên**: vành nước `meander` khép kín hoàn toàn quanh thành phố; "dải yên ngựa khô" mà cả bảng
  lẫn ADR đều dựa vào để biện minh cho kiểu nước này **không tồn tại trên màn hình**
- **Module**: `src/engine/city3d/setting.js` (`MEANDER_NECK`, nhánh `meander` của `insetGoc`) ·
  `src/engine/city3d/settingStyle.js` (chú thích dòng kỷ 5 + khối "sáu kiểu nước")
- **Priority**: Medium · **Severity**: Medium (hình vẫn dựng ra, không lỗi runtime — nhưng nó kể
  SAI câu chuyện mà cả kiểu nước ấy sinh ra để kể)
- **Impact**: ĐO ĐƯỢC, hai phép độc lập, cùng kết luận.
  1. **Tia toả tròn**: bắn **720 tia** từ tâm thành phố ra bán kính 14 ô, hỏi mỗi tia *"có gặp
     `blendAt > 0` không?"*. Kết quả **0/720 tia khô suốt**. Tia "cạn nhất" (95°) vẫn chạm
     `blendAt = 0,157` và độ sâu đáy **0,080 ô** — tức có một chỗ NÔNG hơn, nhưng nó vẫn là NƯỚC,
     không phải đất. (Chỗ sâu nhất của vành: `blendAt = 1,000`, đáy 0,111 ô.)
  2. **Loang trên ô khô**: loang từ tâm ra, bước 0,1 ô, chỉ đi qua ô có `blendAt <= 0`, hỏi có tới
     được mép thế giới không. Kỷ 5 = **KHÔNG**. Tám kỷ có nước khác đem thử cùng cách (2 · 4 · 8 ·
     10 · 12 · 13 · 14 · 15) đều = **CÓ**. Kỷ 5 là ca duy nhất.
  3. **Nhìn ảnh** (`--era 5 --hour 12 --zoom 1,7 --width 1400`): một **hào nước hình vuông, bốn góc
     vuông vức**, khép kín quanh thành phố. Nó đọc ra là *"lâu đài có hào"*, không phải *"suối uốn
     ôm quanh mỏm đá"*.
- **Root Cause**: `MEANDER_NECK` là **nửa bề rộng** của hành lang khô, còn `SHORE_BAND = 0,9` là bề
  dày dải hoà bờ. Trong hành lang, "độ khô" bị chặn trên bởi `-min(d[doi], MEANDER_NECK)`, mà
  `d[doi]` chính là khoảng cách ra khỏi mặt lưới — nên ở đoạn hành lang **sát mép lưới** (`d < 0,9`)
  giá trị ấy chưa đủ âm để `blendAt` về 0. Hành lang vì thế bị dải hoà bờ **bịt lại đúng ở đầu
  trong**, tức đúng đầu nối với thành phố. Một hành lang bịt một đầu thì không phải lối vào.

  ⚠️ **VÀ ĐÂY LÀ HÌNH DẠNG SAI ĐÁNG NHỚ: hai hằng số ở hai file/khối khác nhau, mỗi cái đúng riêng
  nó, mà QUAN HỆ giữa chúng thì không ai sở hữu.** `SHORE_BAND` là quyết định về độ mềm của mép
  nước; `MEANDER_NECK` là quyết định về bề rộng lối vào; không có một dòng nào nói *"lối vào phải
  rộng hơn dải hoà bờ"*. Cùng đúng bệnh của `TECH_DEBT #57` (`side` đúng, `DEFAULT_YAW` đúng, quan
  hệ giữa chúng vô chủ) mà ADR-041 đã phải sửa bằng "thứ thứ ba".
- **Current Risk**: trung bình — chú thích trong `setting.js` và `settingStyle.js` hiện **khẳng
  định** rằng có một lối vào duy nhất, và cả hai dùng chính điều đó để biện minh vì sao `meander`
  phải là một kiểu riêng chứ không ép vào `river`. Phiên sau đọc chú thích sẽ tin, và sẽ không đi
  kiểm.
- **Future Risk**: trung bình — Đàm đã nói thẳng trong lệnh nghiệm thu: *"nếu nó không đọc ra là
  'suối ôm quanh mỏm đá' thì đó là một hình dạng CHƯA NGHIỆM THU, không phải một con số cần chỉnh"*.
- **Recommended Solution**: ⚠️ **KHÔNG tự chọn — đây là quyết định mỹ thuật, chờ Đàm.** Ba hướng,
  đã đo sẵn:
  **(a) Chữa cái khe** — cho hành lang khô "trừ hao" dải hoà bờ (ví dụ lấy `-(trongKhe + SHORE_BAND)`
  thay vì `-trongKhe`), tức viết ra thành QUAN HỆ thay vì hai hằng số rời. Rẻ, giữ nguyên ý đồ
  Burg Eltz, và có thể khoá bằng đúng phép loang ở trên (`0/720` → phải có lối ra).
  **(b) Nhận rằng hào-quanh-lâu-đài là một câu chuyện ĐÚNG** — Burg Eltz thật thì nằm trên mỏm đá
  được suối ôm ba mặt, nhưng lâu đài Đức thời ấy có hào là chuyện phổ biến và nó vẫn kể đúng
  *"vì sao lâu đài nằm ở đó"*. Nếu chọn hướng này thì phải **sửa chú thích + đổi tên kiểu**, vì giữ
  chữ `meander` cho một cái hào là để lại một lời nói dối trong bảng.
  **(c) Đổi kỷ 5 sang `river`** — Đàm đã bác hướng này ngày 2026-08-19 với lý do rõ ràng (*"nước
  chắn ba mặt chính là câu trả lời cho vì sao lâu đài nằm ở đó"*), nên nêu ra chỉ để đủ bộ.
  ⚠️ Dù chọn hướng nào, việc BẮT BUỘC là **một bài test đếm được**: phép loang từ tâm phải trả lời
  đúng điều bảng đang hứa. Hôm nay không có bài test nào chạm tới mệnh đề "có lối vào" — đó là lý do
  nó sai suốt từ Bước B mà không có gì đỏ.
- **Estimated Complexity**: (a) nhỏ · (b) nhỏ (chỉ chữ nghĩa + đổi tên) · (c) nhỏ
- **Blocking Conditions**: không còn
- **Review Trigger**: khi có phase đổi `SHORE_BAND`, `MEANDER_NECK`, hoặc thêm kỷ `meander` thứ hai
- **Owner**: — · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-20** — Đàm chọn hướng **(a)**, làm xong.

### ✅ ĐÃ SỬA — 2026-08-20

**Đàm chốt hướng (a)** kèm hai điều kiện thêm: *"bo góc: hào 90° sắc lẹm là dấu hiệu hình dạng sinh
từ LƯỚI VUÔNG, không phải từ DÒNG CHẢY. Suối thật uốn"* và *"nghiệm thu bằng chính phép bắn 720
tia: phải có ít nhất một cung liên tục ra được đất khô, kèm đối chứng nhốt trạng thái hòn đảo"*.

**Hai thay đổi, cả hai đều là QUAN HỆ chứ không phải số hiệu chỉnh** (`src/engine/city3d/setting.js`):

1. `trongKhe = min(d[doi] **+ SHORE_BAND**, MEANDER_NECK − |doc − tâm|)`. Quan hệ được viết ra:
   *một lối vào phải khô hẳn ngay khi nó rời khỏi lưới*, tức độ khô của nó phải vượt trọn dải hoà
   bờ tại `d[doi] = 0`. Cộng đúng `SHORE_BAND` là cách ngắn nhất phát biểu điều đó, và nó **không có
   tham số tự do nào để trôi**.
2. Nhánh `meander` đổi sang hàm khoảng cách mới `distanceOutsideGridRounded` (Ơclit ⇒ **bo góc**).
   `distanceOutsideGrid` (L∞) **giữ nguyên** cho `outskirts.js` — hai nơi đang hỏi hai câu khác
   nhau (*"ra khỏi lưới bao xa theo trục nào"* vs *"cách cái lưới bao xa"*), nên đây KHÔNG phải
   "một luật hai công thức".

**Số nghiệm thu** (`node --test src/engine/city3d/setting.test.js`, và ảnh `--era 5 --hour 12
--sessions 40 --width 1500 --zoom 2.4`):

| Đại lượng | TRƯỚC (`b87df3c`) | SAU | Cách đo |
|---|---|---|---|
| cung liên tục ra đất khô (720 tia, `blendAt`) | **0** | **1 cung, 9,5° (19 tia)** | `cungKhoRaNgoai` |
| bề rộng eo đất, phần KHÔ HẲN | **0,000 ô** | **1,400 ô** = `2×(MEANDER_NECK − SHORE_BAND)` | `beRongEoDat(blendAt)` |
| bề rộng hành lang danh nghĩa | 3,203 ô | **3,203 ô** = `2×MEANDER_NECK` | `beRongEoDat(insetAt)` |
| bo góc: bờ ngoài chéo / trục | **1,3543** (vuông) | **1,0215** (tròn) | `tiSoBoNgoaiCheoTruc`, cổng 1,10 |
| nước chiếm khung hình (kỷ 5) | 3,34 % | 3,49 % | `water-score.mjs --eras 5` |
| tương phản nước↔bờ | 41,7 | 42,7 | như trên (ngưỡng mắt 12) |
| điểm ảnh đổi quá ngưỡng mắt | — | **1,0 %** (khung mặc định) · 0,7 % (cận cảnh) | `sweep-diff --frame` |
| tam giác thành phố kỷ 5 | 85.016 | 85.214 (**+198**) | `city-preview` |
| lệnh vẽ kỷ 5 | 13 | **13** (không đổi) | như trên |

**Bốn bài test mới** (`setting.test.js`, tất cả đã thử-cho-đỏ, 7 phép phá, mỗi phép nêu TRƯỚC chỗ
mong đợi đỏ): *KHÔNG KỶ NÀO ĐƯỢC LÀ HÒN ĐẢO* (15 kỷ, kèm đối chứng vành khép kín) · *EO ĐẤT RỘNG
ĐÚNG BẰNG QUAN HỆ* (khoá cả hai bề rộng + khoá `MEANDER_NECK > SHORE_BAND`) · *HÀO PHẢI BO GÓC*
(kèm hai đối chứng hào-vuông và hào-tròn dựng tay) · *HAI HÀM KHOẢNG CÁCH PHẢI LÀ HAI HÌNH*.

### ⚠️ CÒN LẠI MỘT NỬA CHƯA ĐẠT — VÀ NÓ KHÔNG PHẢI LỖI, NÓ LÀ MỘT QUYẾT ĐỊNH MỸ THUẬT KHÁC

Đàm ra ba điều kiện; **hai điều kiện đo được đã đạt** (có cung liên tục · đã bo góc). Điều kiện thứ
ba — *"nhìn ảnh cận cảnh phải đọc ra **mỏm đá trong khúc uốn**, không phải **lâu đài giữa hào
nước**"* — **CHƯA ĐẠT**, và tôi nói thẳng thay vì tự nhận là xong.

Ảnh sau khi vá đọc ra là *"lâu đài có hào, hào đã bo góc và có một lối vào"*. Nó tốt hơn hẳn bản
trước (hào vuông vức khép kín), nhưng vẫn chưa phải một khúc suối. Lý do nằm ở tầng khác: mặt nước
`meander` lấy hình từ **khoảng cách tới hình chữ nhật lưới**, nên dù bo góc thì nó vẫn là một vành
đai **đều bề rộng ôm quanh một hình vuông**. Suối thật thì bề rộng thay đổi, ôm ba mặt chứ không
bốn, và không lấy tâm là thành phố. Đổi được điều đó nghĩa là đổi **hình** của kiểu `meander` (bảng
`settingStyle.js` + một dòng hình học riêng), tức chính là việc `#65` đang giữ. → **gộp vào `#65`**.

---

---

## #63 — PHÉP TIA ĐO NƯỚC **MÙ VỚI CÂY CỐI**: CỔNG 5% ĐÃ ĐƯỢC CHẤM BẰNG MỘT CÁI THƯỚC SAI, VÀ "11 KỶ ĐẠT" THẬT RA LÀ **5**

- **Tên**: `water-view.mjs` báo % khung hình cao hơn sự thật 1,04–3,01 lần vì nó chỉ dò trường cao
  độ mặt đất, không biết cây cối / nhà cửa / đá / cư dân tồn tại
- **Module**: `scripts/water-view.mjs` (hàm `caoDoTai`) · `scripts/waterView.test.js` ·
  `BAN_GIAO.md` (bảng nghiệm thu Bước C) · công cụ thay thế: `scripts/water-score.mjs` (MỚI)
- **Priority**: Medium · **Severity**: Medium (không có mã sản phẩm nào hỏng — thứ hỏng là **con
  số nghiệm thu** và mọi quyết định dựa trên nó)
- **Impact**: bảng nghiệm thu Bước C ghi *"11 kỷ đạt cổng nước ≥ 5% khung hình ✅"*. Đếm thẳng
  điểm ảnh trên ảnh `--mask water` thì chỉ **5/14**. Hai kỷ Đàm chỉ đích danh trong lệnh nghiệm thu
  (4 và 5) đều nằm trong số bị đọc nhầm — chúng được ghi là ĐẠT (5,02% và 5,62%) trong khi trên màn
  hình chúng chỉ có **3,32%** và **3,34%**.

  **BẢNG ĐỐI CHIẾU ĐẦY ĐỦ** (đo 2026-08-20 · khung mặc định 1100×700 · `--hour 12` · 40 phiên ·
  dựng lại toàn bộ 28 ảnh trong một lượt, lệnh:
  `node scripts/city-preview.mjs --era N --hour 12` và `… --hour 12 --mask water` cho N = 2…15,
  chấm bằng `node --import ./scripts/register-esm-loader.mjs scripts/water-score.mjs`):

  | kỷ | kiểu | phép TIA | trên MÀN HÌNH | tia cao hơn | cổng 5% | tương phản nước↔đất |
  |---:|---|---:|---:|---:|:--:|---:|
  |  2 | river   |  5,52% |  3,77% | 1,46× | TRƯỢT |  43,6 |
  |  3 | river   |  5,32% |  3,87% | 1,37× | TRƯỢT |  73,2 |
  |  4 | river   |  5,02% |  **3,32%** | 1,51× | **TRƯỢT** |  44,2 |
  |  5 | meander |  5,62% |  **3,34%** | 1,68× | **TRƯỢT** |  41,7 |
  |  6 | river   |  4,13% |  1,37% | **3,01×** | TRƯỢT |  37,2 |
  |  7 | river   |  2,40% |  1,49% | 1,61× | TRƯỢT |  60,8 |
  |  8 | estuary |  9,96% |  7,40% | 1,35× | **ĐẠT** |  70,7 |
  |  9 | river   |  5,68% |  2,82% | 2,01× | TRƯỢT |  64,9 |
  | 10 | canal   |  1,62% |  1,18% | 1,37× | TRƯỢT | 103,2 |
  | 11 | estuary |  9,97% |  5,42% | 1,84× | **ĐẠT** |  52,0 |
  | 12 | river   |  9,32% |  4,84% | 1,93× | TRƯỢT |  30,8 |
  | 13 | sea     | 24,12% | 23,18% | 1,04× | **ĐẠT** |  75,2 |
  | 14 | sea     | 23,75% | 20,09% | 1,18× | **ĐẠT** |  67,4 |
  | 15 | sea     | 20,80% | 19,05% | 1,09× | **ĐẠT** | 115,5 |

  ⇒ **5/14 ĐẠT** (8 · 11 · 13 · 14 · 15). ⚠️ **NHƯNG CỘT CUỐI LÀ TIN TỐT, VÀ NÓ LÀ MỘT ĐẠI LƯỢNG
  KHÁC**: tương phản nước↔đất-sát-bờ chạy từ **30,8 tới 115,5**, trong khi ngưỡng mắt là **12** —
  tức **14/14 kỷ, chỗ nào có nước thì chỗ ấy ĐỌC RA LÀ NƯỚC**. Vấn đề thuần tuý là **DIỆN TÍCH**,
  không phải màu, không phải độ sâu, không phải hình. Đừng đi chỉnh `WATER_TINT`.

- **Root Cause**: `caoDoTai` (`water-view.mjs`) trả về `surfaceHeightAt` / `horizon.heightAt` — tức
  **trường cao độ MẶT ĐẤT**. Cây, nhà, đá, cư dân là những khối riêng, không nằm trong trường ấy.
  Một tia xuyên qua tán cây rồi chạm mặt nước phía sau được ghi là "nước". Sai số vì thế **không
  đều**: lớn nhất ở kỷ nước HẸP và bờ RẬM (kỷ 6: 3,01×), nhỏ nhất ở biển rộng (kỷ 13: 1,04×) — đúng
  thứ tự mà một phép mù-cây bắt buộc phải có, và đó chính là bằng chứng cho chẩn đoán này.

  ⚠️ **VÀ GIẢ THUYẾT ĐẦU TIÊN LÀ SAI — GHI LẠI ĐỂ PHIÊN SAU ĐỪNG ĐI LẠI.** Nghi ngờ đầu tiên rất
  xuôi tai: *"hộp bao tấm nước đếm cả lỗ thủng, vì `buildWaterSurface` bỏ hẳn ô có `blendAt <= 0`
  ở cả bốn góc"*. Đo được rằng hộp bao kỷ 5 chỉ được phủ **42,2%** bởi `blendAt > 0` — một con số
  rất thuyết phục cho giả thuyết ấy. Đã vá theo nó, và **các con số không nhúc nhích một chữ số
  nào**. Lý do: phần hộp bao bị thủng luôn có ĐẤT cao hơn mặt phẳng nước, nên phép so `tNuoc < tDat`
  vốn đã loại chúng từ trước. ⇒ **Luật Phase 8A áp thêm một lần nữa: khi một bản vá không đổi kết
  quả, hỏi cả hai câu — "phép phá có hỏng không?" VÀ "thứ tôi vừa sửa có phải nguyên nhân không?".**
  Ở đây câu thứ hai mới đúng, và một con số phụ trợ đúng (42,2%) đã suýt đóng dấu cho một chẩn đoán
  sai.

- **Current Risk**: trung bình — mọi con số % khung hình ghi trước 2026-08-20 đều là số của phép
  tia. Chúng **không so trực tiếp được** với số đo bằng `water-score.mjs` (cùng cách xử lý mà
  `TECH_DEBT #22` đã dùng cho bộ lọc "8% mái" và `#49` cho khung hình bị xén 23 dòng).
- **Future Risk**: trung bình. Nguy hiểm thật không nằm ở con số mà ở **hướng đi**: một cổng bị
  chấm cao hơn sự thật khiến ta tin *"nước đã đủ, sang việc khác"*, trong khi 9/14 kỷ vẫn dưới
  ngưỡng mà Đàm đặt ra.
- **Recommended Solution**: đã làm xong phần công cụ — **`scripts/water-score.mjs`** (mới, 6 ca tự
  kiểm, có đối chứng nhốt đúng cặp số 5,02 ↔ 3,32) chấm cổng bằng cách hỏi thẳng bên dựng qua
  `--mask water`, không đoán màu (bài học `TECH_DEBT #22`). **Phân vai, đừng gộp**: `water-view.mjs`
  vẫn là công cụ đúng cho câu *"xoay camera thì TRẦN là bao nhiêu"* (cây đứng yên khi xoay nên sai
  số triệt tiêu phần lớn, và nó chạy không cần Chromium); `water-score.mjs` trả lời *"hôm nay Đàm
  thật sự THẤY bao nhiêu"*. Phần CÒN LẠI — *9 kỷ dưới cổng thì làm gì* — là một quyết định mỹ
  thuật, **chờ Đàm**, và ba lựa chọn đã đo sẵn nằm ở `#61`.
- **Estimated Complexity**: công cụ đã xong; phần quyết định thì không có việc kỹ thuật nào cho tới
  khi Đàm chốt
- **Blocking Conditions**: chờ Đàm quyết hướng ở `#61` (đổi đại lượng cổng · chấp nhận 5/14 ·
  hay mở phase ngữ pháp ven nước `#60`)
- **Review Trigger**: ngay khi Đàm trả lời `#61` · hoặc khi có phase đổi **mật độ vùng quê** /
  **khung hình mặc định** (cả hai đều dịch được cả hai cột của bảng trên)
- **Owner**: chưa gán · **Status**: **Open — công cụ đã vá, quyết định chờ Đàm**

---

## #62 — ~~KỶ 4 VƯỢT CỔNG NƯỚC 5% ĐÚNG 0,02 ĐIỂM PHẦN TRĂM~~ → **TIỀN ĐỀ SAI: KỶ 4 KHÔNG HỀ VƯỢT CỔNG**

- **Tên**: mục này được mở ngày 2026-08-20 để cảnh báo về một **biên mỏng**; đo lại cùng ngày bằng
  công cụ đúng thì cái biên ấy **không tồn tại** — kỷ 4 nằm HẲN dưới cổng
- **Module**: `src/engine/city3d/settingStyle.js` (dòng kỷ 4) · `scripts/waterView.test.js`
- **Priority**: Low · **Severity**: Low (không có mã nào hỏng — mục nợ này tự nó là thứ sai)
- **Impact**: bản đầu ghi *"kỷ 4 đo được **5,02%** trên cổng **5,00%** ⇒ biên **0,4%**"* và khuyên
  phiên sau đừng hoảng khi thấy nó tụt. Sự thật: **3,32%** trên màn hình, tức **TRƯỢT cổng 33%**,
  và nó đã trượt từ trước khi mục này được viết ra. Con số 5,02% là số của phép tia mù-cây (`#63`).
- **Root Cause**: hai cái sai xếp chồng, và cái thứ hai chỉ có thể xảy ra vì cái thứ nhất.
  **(1)** Con số nguồn sai (`#63`). **(2)** ⚠️ **VÀ ĐÂY MỚI LÀ BÀI HỌC ĐÁNG GIỮ: một mục nợ kỹ
  thuật viết ra để CẢNH BÁO về một con số thì tự nó là một lời khẳng định về con số ấy — nhưng nó
  KHÔNG được kiểm bởi bất cứ thứ gì.** Mã có test, tài liệu có người đọc, còn một dòng trong
  `TECH_DEBT.md` thì im lặng tuyệt đối; và một mục nợ nghe càng lo lắng, càng cẩn thận, thì càng ít
  ai nghĩ tới việc kiểm lại tiền đề của nó. Cùng họ với *"một chú thích nói 'có test đối chiếu hai
  bên' không phải là một bài test"* (Phase 8B) và *"một câu tự trấn an cũng phải được kiểm như một
  con số"* (Phase 4G) — khác ở chỗ lần này câu chưa-được-kiểm nằm trong chính cuốn sổ nợ, nơi lẽ ra
  phải là chỗ đáng tin nhất.
- **Current Risk**: thấp — đã bị chính phiên mở nó bác bỏ trong cùng ngày.
- **Future Risk**: thấp, **với điều kiện** mục này không bị xoá đi. Giữ lại nguyên văn tiền đề sai
  là thứ ngăn phiên sau tìm thấy con số 5,02% ở đâu đó rồi tin lại lần nữa.
- **Recommended Solution**: đã xử lý — nội dung thật chuyển sang **`#63`**; mục này giữ làm bia.
  ⚠️ **KHÔNG nới `width` của kỷ 4 để lấy lại con số.** Sông Vị ở Trường An là một con sông thật với
  bề rộng thật; nới nó là **nói dối địa lý** — đúng thứ Đàm đã bác khi từ chối phương án (a) của
  `#59`. Kỷ 4 nay thuộc cùng nhóm với 6 · 7 · 10 và có cùng một lối chữa: ngữ pháp ven nước (`#60`).
- **Estimated Complexity**: không có việc phải làm
- **Blocking Conditions**: không chặn gì
- **Review Trigger**: không — mục này đã đóng, chỉ đọc
- **Owner**: — · **Status**: **✅ ĐÃ ĐÓNG (2026-08-20) — tiền đề bị bác bỏ, nội dung chuyển sang #63**

---

## #61 — CỔNG "5% KHUNG HÌNH" LÀ MỘT **THỨ ĐẠI DIỆN**, VÀ CHÍNH ĐÀM ĐÃ CHỈ RA ĐIỀU ĐÓ

- **Tên**: cổng nghiệm thu mặt nước đo DIỆN TÍCH, trong khi câu hỏi thật là *"có đọc ra là thành
  phố bên nước không"* — mà thứ quyết định điều đó là **đường bờ có CẮT NGANG khung hình không**
- **Module**: `scripts/water-view.mjs` · `scripts/waterView.test.js`
- **Priority**: Low · **Severity**: Low (hôm nay cổng và mắt đồng ý ở mọi ca đã kiểm)
- **Impact**: nguyên văn Đàm (§2-Q1, 2026-08-20): *"CÓ, một phần — và tự nêu ra được điều đó là
  đúng. % khung hình đo **diện tích**, còn câu hỏi thật là 'có đọc ra là thành phố cảng không', mà
  thứ quyết định điều đó là **đường bờ có cắt ngang khung hình không**, không phải nước chiếm bao
  nhiêu."*
- **Root Cause**: cùng họ với `TECH_DEBT #22` (bộ lọc *"8% điểm ảnh tươi nhất ≈ mái"*) — một đại
  lượng dễ đo được **gọi tên** thành đại lượng thật sự cần. Khác ở chỗ lần này ta biết ngay từ đầu.
- **Current Risk**: thấp — và nay đã ĐỐI CHIẾU BẰNG MẮT THẬT trên bốn ảnh chụp ở khung mặc định
  (`estuary` kỷ 8 và 11 · `canal` kỷ 10 · `meander` kỷ 5), không phải suy từ con số:
  · kỷ 8 (9,96%) và kỷ 11 (9,97%) — **đạt cổng, mắt đọc ra ngay**: dải nước rộng cắt chéo khung
    hình VÀ thấy được bờ bên kia, đúng định nghĩa `estuary` trong bảng.
  · kỷ 10 (1,62%) — **trượt cổng, và mắt cũng KHÔNG đọc ra "thành phố bên kênh"**. Nói cho chính
    xác: mắt ĐỌC RA rằng đó là một cái KÊNH ĐÀO (thẳng tăm tắp, hẹp, mép sắc — không lẫn được với
    sông tự nhiên), nhưng nó nằm tận góc xa, giữa nó và dãy nhà máy là một vạt đất trống rộng. Hai
    câu ấy khác nhau, và câu Đàm hỏi là câu thứ hai ⇒ **cổng và mắt ĐỒNG Ý**.
  · kỷ 5 (5,62%) — **đạt cổng, mắt đọc ra**, nhưng SÁT: nước bám VIỀN khung hình chứ không cắt qua
    giữa cảnh, và kỷ 5 là kỷ nông nhất bảng (chỉ chạm **20,1%** độ sâu đáy tối đa) nên sắc nhạt.
    Đây là ca đáng đo lại đầu tiên nếu mục này phải mở lại.
  ⇒ **Không có ca nào cổng và mắt bất đồng** ⇒ chưa có bằng chứng cổng sai đại lượng.
- **Future Risk**: một kỷ tương lai có dải nước NGẮN nhưng RỘNG (một cái hồ ở góc khung) sẽ đạt 5%
  mà không có đường bờ nào cắt ngang — cổng cho qua, mắt không đọc ra.
- **Recommended Solution**: ⚠️ **KHÔNG ĐỔI BÂY GIỜ**, và lý do Đàm nêu là lý do đúng: cổng 5% đã
  **hiệu chuẩn ở cả hai đầu** (0,09% = không thấy gì · 23,75% = đọc ra ngay), còn "chiều dài đường
  bờ cắt khung" thì **chưa có một mốc nào**. Đổi bây giờ là thay một ngưỡng đã hiệu chuẩn bằng một
  ngưỡng chưa hiệu chuẩn — đúng cái phễu Phase 9A.
- **Estimated Complexity**: trung bình (phải hiệu chuẩn lại từ đầu)
- **Blocking Conditions**: không chặn gì
- **Review Trigger**: ⚠️ **ĐIỀU KIỆN ĐÀM ĐẶT RA, CHÉP NGUYÊN VĂN** — *"nếu Bước C có kỷ nào đạt 5%
  mà nhìn vẫn không ra bờ, hoặc trượt 5% mà nhìn vẫn ra bờ, thì đó là bằng chứng cổng sai đại lượng
  — lúc ấy đổi sang đo CHIỀU DÀI ĐƯỜNG BỜ CẮT KHUNG."* Và: *"Để dữ liệu Bước C tự quyết, đừng đoán
  trước."* **Kết quả Bước C: chưa có ca nào như vậy** ⇒ giữ nguyên cổng.

- ⚠️ **CẬP NHẬT 2026-08-20, NGHIỆM THU BƯỚC C — ĐIỀU KIỆN XEM LẠI ĐÃ ĐƯỢC HỎI, VÀ CÂU TRẢ LỜI LÀ
  "KHÔNG, NHƯNG VÌ MỘT LÝ DO KHÁC HẲN".**

  Đàm đặt điều kiện: *"nếu ≥5% mà bản quét vẫn không thấy ⇒ bằng chứng cổng sai đại lượng, lúc đó
  mới đổi sang đo CHIỀU DÀI ĐƯỜNG BỜ CẮT KHUNG."* Đi kiểm thì **tiền đề không đúng**: kỷ 4 và kỷ 5
  KHÔNG hề ≥5%. Chúng chỉ được ghi là 5,02% và 5,62% vì cái thước bị mù cây (`#63`); trên màn hình
  chúng là **3,32%** và **3,34%**. ⇒ **Cổng không sai — cái THƯỚC sai.** Hai chuyện ấy khác nhau, và
  gộp chúng lại sẽ dẫn tới việc thay một ngưỡng lành bằng một ngưỡng chưa hiệu chuẩn.

  ⚠️ **VÀ ĐÃ ĐO LUÔN CÁI ĐẠI LƯỢNG THAY THẾ — NÓ KHÔNG DÙNG ĐƯỢC, THEO ĐÚNG HAI CHIỀU NGƯỢC NHAU.**
  `duongBoCatKhung` (`water-view.mjs`) đo chiều dài ranh giới nước↔ĐẤT chia cho đường chéo khung:

  | kỷ | kiểu | đường bờ (tương đối) | % khung (màn hình) | mắt đọc ra? |
  |---:|---|---:|---:|---|
  |  5 | meander | **1,879** ← DÀI NHẤT BẢNG | 3,34% | chỉ là một cái hào mảnh |
  | 13 | sea     | 1,108 | 23,18% | biển, đọc ra ngay |
  | 14 | sea     | **1,012** ← NGẮN NHẤT | 20,09% | biển, đọc ra ngay |
  | 15 | sea     | 1,158 | 19,05% | biển, đọc ra ngay |

  Ba kỷ `sea` — những kỷ **không thể nhầm được** là thành phố ven nước — có đường bờ **NGẮN NHẤT**
  bảng, vì một mặt biển chỉ giáp đất bằng đúng một đường ngang. Còn kỷ 5, một cái hào vòng quanh,
  có đường bờ dài nhất vì nó có **hai** mép và chúng uốn quanh bốn phía. ⇒ Đại lượng này **nghịch
  biến** với thứ nó định đo, ở đúng nhóm kỷ quan trọng nhất. Chỉ số `vaoSauNhat` (nước lấn sâu vào
  khung) cũng không tách được: kỷ 6 TRƯỢT với 0,600 trong khi kỷ 4 cũng TRƯỢT với 0,486 — không có
  ngưỡng nào cắt đúng.

  ⇒ **KHÔNG ĐỔI SANG ĐƯỜNG BỜ.** Ghi lại đây để phiên sau khỏi thử lại: nó đã được đo, không phải
  bị bỏ qua. Bài học chung: *một đại lượng thay thế phải được KIỂM trên nhóm ca dễ nhất trước khi
  được tin ở nhóm ca khó* — nếu nó không xếp đúng thứ tự cho ba kỷ biển thì nó không có tư cách
  phân xử cho ba kỷ kênh hẹp.

  ⚠️ **CÁI THẬT SỰ CÒN LẠI ĐỂ ĐÀM QUYẾT** (đã đo đủ, không tự chọn): trên màn hình chỉ **5/14** kỷ
  đạt 5%, mà **14/14 kỷ có tương phản nước↔đất từ 30,8 tới 115,5 — trên ngưỡng mắt 12 rất xa**.
  Nghĩa là *"nước ở đâu cũng đọc ra là nước; nó chỉ chiếm ít chỗ"*. Ba hướng:
  (a) **giữ cổng 5%, chấp nhận 5/14** và coi 9 kỷ kia là việc của phase ngữ pháp ven nước (`#60`);
  (b) **đổi cổng sang một đại lượng khác** — nhưng phải hiệu chuẩn lại từ đầu ở cả hai đầu, và
      đường bờ đã bị loại ở trên;
  (c) **giữ cổng nhưng nói rõ nó là cổng của kỷ BIỂN/CỬA SÔNG**, còn kỷ sông/kênh có một cổng riêng
      thấp hơn — tức viết cổng thành một QUAN HỆ với `width` thay vì một MỨC chung (đúng khuôn
      ADR-028 đã dùng cho lệnh vẽ: 15 mốc riêng thay vì một trần chung).
  ⇒ **CHỜ ĐÀM.** Không tự chọn, và tuyệt đối không hạ con số 5%.
- **Owner**: — · **Status**: ✅ **ĐÃ TRẢ LỜI 2026-08-20 — THÔI LÀ MỘT MỤC NỢ, THÀNH MỘT SỰ THẬT ĐÃ ĐO**

### ✅ ĐÀM CHỐT — 2026-08-20

*"GIỮ NGUYÊN cổng, đổi cách đọc: nay có số màn hình thật, ghi thẳng «5/14 đủ diện tích · 14/14 đọc
ra được» vào tài liệu như một sự thật đã đo, không phải một mục nợ. Cổng 5% vẫn dùng cho phase sau."*

⇒ **Cổng 5% KHÔNG đổi.** Thứ đổi là cách đọc kết quả của nó. Bảng dưới là **số màn hình thật**, đo
bằng `node scripts/water-score.mjs` (mặt nạ `--mask water`, khung mặc định 1100×700, 12 giờ, 40
phiên) — không phải phép tia của `water-view.mjs`, thứ đã bị bác ở `#63`:

| | Số | Nghĩa |
|---|---|---|
| **Đủ DIỆN TÍCH** (≥ 5% khung hình) | **5/14** kỷ (8 · 11 · 13 · 14 · 15) | *"nước chiếm được một mảng đáng kể của bức tranh"* |
| **ĐỌC RA ĐƯỢC** (tương phản nước↔bờ ≥ 12) | **14/14** kỷ, dải **30,8 – 115,5** | *"chỗ nào có nước thì mắt nhận ra ngay là nước"* |

⚠️ **HAI CÂU HỎI, ĐỪNG ĐỂ MỘT CỘT GÁNH CẢ HAI.** Kỷ 10 là đối chứng sống: tương phản **103,2** —
gần mạnh nhất bảng — mà chỉ chiếm **1,18%** khung hình. Nó *rất* dễ đọc ra là nước, chỉ là ít nước.
Ngược lại không có kỷ nào nhiều nước mà khó đọc. ⇒ Cổng 5% đo **"có đủ nhiều không"**, và nó vẫn là
cổng đúng cho phase sau; nhưng *"9 kỷ trượt cổng"* **KHÔNG** có nghĩa là *"9 kỷ trông không ra
nước"* — đọc như thế là gán cho một cột câu hỏi mà nó không trả lời.

**Phương án (a)/(b)/(c) trong mục này KHÔNG còn treo** — Đàm đã chọn: giữ cổng, giữ 5/14, ghi cả
hai con số. Việc *nâng* 9 kỷ kia lên trên 5% nếu có làm thì thuộc `#60`/`#65`, không thuộc mục này.

---

## #60 — NƯỚC HẸP CẦN MỘT NGỮ PHÁP KHÁC: CẦU · BẾN · THUYỀN · KÈ, KHÔNG PHẢI THÊM DIỆN TÍCH

- **Tên**: ba kỷ nước hẹp (6 · 7 · 10) đọc ra là *"có một vệt nước ở xa"* chứ không phải *"thành phố
  bên kênh"*; thứ chữa được là VẬT THỂ VEN NƯỚC, không phải % khung hình
- **Module**: `src/engine/city3d/settingStyle.js` · `setting.js` · một file `HÌNH` mới cho vật ven nước
- **Priority**: Medium · **Severity**: Low (không hỏng gì; là một phần thưởng chưa được trao)
- **Impact**: đây là **hướng (c)** của `#59`, và Đàm công nhận nó đúng: *"đổi thứ mang bản sắc sang
  cầu/bến/thuyền/kè là ĐÚNG về mỹ thuật nhưng là cả một phase mới."* Một con kênh 0,9 ô có **bốn
  cây cầu** đọc ra là *Amsterdam* rõ hơn một vệt xanh 5% — nó giải đúng câu hỏi *"đọc ra là gì"*
  thay vì câu *"chiếm bao nhiêu"*.
- **Root Cause**: `settingStyle.js` chỉ mô tả **hình dạng nước** (`water`/`side`/`reach`/`width`).
  Không có trục nào cho **thứ con người dựng lên bên nước** — mà đó mới là thứ mang bản sắc.
- **Current Risk**: bằng 0. Ba kỷ ấy đã có nước, đã được ghi tường minh vào bảng `TRUOT`.
- **Future Risk**: nếu một phase sau đi giải bài này bằng cách **nới bề rộng nước** thì nó vừa nói
  dối địa lý vừa làm `#59` hết đúng trong im lặng. Ghi ra đây để chặn đúng lối tắt ấy.
- ⚠️ **MỘT SỐ ĐO ĐI KÈM, ĐO ĐƯỢC HÔM NAY (2026-08-20)**: **8/14 kỷ không bao giờ chạm đáy đầy đủ**,
  vì `depthAt` cần chỗ lún sâu ≥ `BED_RAMP = 1,6` ô mới xuống hết `WATER_BED_DEPTH`:

  | kỷ | nước | rộng (ô) | lún sâu nhất | đáy đạt được | % của đáy đầy |
  |---|---|---:|---:|---:|---:|
  | 5 | meander | 0,5 | 0,25 | 0,111 | **20,1%** |
  | 10 | canal | 0,9 | 0,40 | 0,153 | **27,9%** |
  | 6 | river | 1,2 | 0,60 | 0,229 | 41,6% |
  | 7 | river | 1,4 | 0,70 | 0,271 | 49,3% |
  | 3 | river | 1,6 | 0,80 | 0,315 | 57,3% |
  | 9 | river | 1,8 | 0,90 | 0,359 | 65,2% |
  | 2 | river | 2,2 | 1,10 | 0,441 | 80,2% |
  | 4 | river | 2,6 | 1,30 | 0,507 | 92,1% |

  Đây **KHÔNG phải lỗi** — `terrainMesh.js` lấy chính `depthAt` làm sắc nước, nên nước hẹp render
  ra **nhạt hơn**, đúng vật lý. Nhưng nó cùng một họ với mục này: cùng một nguyên nhân gốc (BỀ RỘNG)
  vừa làm ba kỷ trượt cổng 5%, vừa làm tám kỷ nhạt màu. Có bài test khoá quan hệ *rộng ⇒ sâu* ở cả
  hai chiều (`setting.test.js`, bảng `SAU`/`NONG`).
- **Recommended Solution**: một phase riêng theo đúng khuôn **BẢNG-trước-HÌNH-sau** đã dùng bốn lần
  (`vernacularRoof` · `undergrowth` · `streetStyle` · `groundFloor`): một BẢNG 15 kỷ khai *bên nước
  này có gì* (cầu đá / cầu gỗ / bến thuyền / kè đá / thuyền dhow / sà lan…), buộc vào `country`, có
  test bắt; một file HÌNH riêng; `setting.js` chỉ ĐỌC. ⚠️ Và theo luật §2-C của Đàm: **đo TRẦN của
  cơ chế TRƯỚC khi viết mã** — dựng thử một cây cầu ở kỷ 10 rồi đo xem nó chiếm bao nhiêu điểm ảnh
  ở khung mặc định; nếu dưới ngưỡng mắt thì cả phase là công cốc (bài học Phase 11).
- **Estimated Complexity**: cao (một phase đầy đủ)
- **Blocking Conditions**: không chặn gì đang chạy
- **Review Trigger**: ⚠️ **điều kiện Đàm đặt ra, nguyên văn: *"khi nào có phase chi tiết ven nước"***
- **Owner**: chưa giao · **Status**: **Open**

---

## #59 — ✅ ĐÃ ĐÓNG (2026-08-20, Đàm chốt hướng (b)) — **BỀ RỘNG**: ba kỷ nước hẹp (6 · 7 · 10) không thể đạt cổng 5% ở **bất kỳ** góc nhìn nào

> ⚠️ **CẬP NHẬT 2026-08-24 (Phase 19) — MỘT LỜI KHẲNG ĐỊNH TRONG CHÍNH TIÊU ĐỀ MỤC NÀY ĐÃ BỊ BÁC BỎ
> BẰNG SỐ.** Tiêu đề nói kỷ 6 *"không thể đạt cổng 5% ở **bất kỳ** góc nhìn nào"*. Đo lại sau
> ADR-061: **trần toàn cục của kỷ 6 đi từ 4,36% lên 7,24%** — tức nay CÓ góc cứu được, chữ "bất kỳ"
> hết đúng. Nguyên nhân không phải bề rộng đổi (bảng `settingStyle` không đụng tới) mà là khung
> toàn cảnh lùi ra, kéo thêm mặt nước ngoài lưới vào khung.
> ⇒ `waterView.test.js` đã **đảo vế** bài kỷ 6 kèm giải thích: góc MẶC ĐỊNH vẫn trượt (2,59% < 5%)
> **nhưng** trần toàn cục nay > 5%. Hai câu ấy phải cùng được khẳng định, vì chỉ câu đầu thì đọc
> thành "vẫn hỏng", chỉ câu sau thì đọc thành "đã xong".
> ⚠️ Kết luận **BỀ RỘNG** của mục này (kỷ 7 và 10) vẫn nguyên giá trị, và mục vẫn ĐÓNG — thứ đổi là
> một chữ trong tiêu đề, không phải hướng chữa. Và nó cũng đứng nhờ ADR-061 (xem `#89`).

> ⚠️ **MỤC NÀY ĐÃ ĐƯỢC TÁCH ĐÔI (2026-08-21, Đàm ra lệnh: *"`#59` chứa hai loại nguyên nhân: TÁCH"*).**
> Nó từng ôm cả hai chứng bệnh: **(1) nước quá HẸP** (kỷ 6 · 7 · 10) và **(2) địa hình CHE** (kỷ 4 · 5,
> phát sinh ở §1(B) khi `drain` được sửa cho khớp `side`). Hai chứng ấy có nguyên nhân khác nhau, hướng
> chữa khác nhau, và **điều kiện đóng khác nhau** — gộp chung thì mục này không bao giờ đóng dứt điểm
> được, vì một nửa đã xong còn một nửa chờ Đàm. Nửa **(2)** nay sống riêng ở **`#67`**.
> Mục này từ đây **CHỈ** nói về bề rộng, và nó **ĐÃ ĐÓNG**.

- **Tên**: kỷ 6, 7, 10 khai nước quá hẹp; xoay kiểu gì cũng không đưa nổi lên 5% khung hình
- **Module**: `src/engine/city3d/settingStyle.js` (cột bề rộng nước) · đo bằng `scripts/water-view.mjs`
- **Priority**: Medium · **Severity**: Medium (Bước C sẽ tiêu ngân sách cho ba kỷ nhìn gần như không thấy)
- **Impact**: `worldYaw` (ADR-041) đã đưa 11/14 kỷ có nước lên trên cổng 5% của §3. Ba kỷ còn lại
  thì **không** — và không phải vì xoay sai, mà vì **dòng nước của chúng quá hẹp**:

  | kỷ | nước | bề rộng (ô) | trần TOÀN CỤC (đo 24 góc) | đạt 5%? |
  |---|---|---:|---:|:--:|
  | 6 | sông | 1,2 | **4,44%** | ❌ **không ở MỌI góc** |
  | 7 | sông | 1,4 | 9,05% | chỉ ở góc xiên, phá khung các kỷ khác |
  | 10 | kênh | 0,9 | 7,37% | chỉ ở một góc phá hỏng mọi kỷ khác |

  ⚠️ **Kỷ 6 là ca cứng nhất và cũng là ca sạch nhất**: trần toàn cục 4,44% nghĩa là *không tồn tại*
  góc nhìn nào đạt cổng. Đó là một sự thật về **DÒNG BẢNG**, không về phép xoay — nên mọi cố gắng
  chỉnh `worldYaw` cho kỷ 6 đều là chỉnh sai chỗ.
- **Root Cause**: cổng 5% được đặt từ hai kỷ ĐÃ DỰNG HÌNH (12 sông rộng, 14 biển) rồi mặc nhiên áp
  cho cả 14 kỷ. ⚠️ Đúng hình dạng **`TECH_DEBT #38`**: *một con số suy từ một mẫu nhỏ được đọc thành
  luật của cả tập*. Khác biệt duy nhất là lần này ta biết TRƯỚC khi tiêu ngân sách, chứ không phải sau.
- **Current Risk**: bằng 0 hôm nay — ba kỷ ấy **chưa dựng hình nước** (`ERAS_WITH_WATER_GEOMETRY`
  mới có [12, 14], xem #56). Rủi ro chỉ hiện thực khi Bước C trải nốt.
- **Future Risk**: trải Bước C mà không chốt mục này ⇒ ba kỷ tốn +1 lệnh vẽ và hàng nghìn tam giác
  cho một dải nước Đàm gần như không thấy — **đúng bài học §2-C** (*đo TRẦN của một cơ chế TRƯỚC khi
  tiêu ngân sách cho nó*).
- **Recommended Solution**: **KHÔNG tự chọn — đụng bảng đã duyệt.** Ba hướng:
  - **(a) Nới bề rộng nước ở ba kỷ ấy.** Giá: đụng sự thật địa lý. Kênh Amsterdam RỘNG 0,9 ô là
    đúng — kênh thật hẹp thật. Nới là mua một con số bằng cách nói dối, thứ ADR-025 đã cấm.
  - **(b) Chấp nhận ba kỷ dưới cổng, ghi tường minh ĐẾM ĐƯỢC trong test.** Trung thực nhất; theo
    đúng khuôn `assert.deepEqual(TRUOT, [...])` đã dùng cho `TECH_DEBT #44`. Kỷ thứ tư trượt thì đỏ,
    mà một trong ba kỷ được sửa xong cũng đỏ.
  - **(c) Với nước hẹp thì đổi thứ mang bản sắc**: không đo bằng % khung hình mà bằng **cầu, bến,
    thuyền, kè** — một con kênh 0,9 ô có bốn cây cầu đọc ra là *Amsterdam* rõ hơn một vệt xanh 5%.
    Đắt nhất, và cũng là hướng duy nhất giải đúng bài toán *"đọc ra là gì"* thay vì *"chiếm bao nhiêu"*.
- **Estimated Complexity**: (a) thấp · (b) rất thấp · (c) cao

### ✅ ĐÃ CHỐT THẾ NÀO (2026-08-20)

Đàm chọn **(b)**, và bác (a) bằng đúng một câu: *"nới kênh là **nói dối địa lý** — kênh Bridgewater
hẹp thật."* Hướng (c) được công nhận là **đúng về mỹ thuật** nhưng *"là cả một phase mới"* ⇒ tách
ra thành `TECH_DEBT #60` với điều kiện xem lại riêng, KHÔNG nhét vào khe hở của Bước C.

⚠️ **VÀ MỘT CÂU CẤM RÕ RÀNG: KHÔNG NỚI CỔNG 5% XUỐNG CHO VỪA BA KỶ ĐÓ.** Nguyên văn: *"Nới một
ngưỡng cho vừa kết quả là cái phễu Phase 9A."* Con số 5% đã hiệu chuẩn ở **cả hai đầu** bằng phép
đo thật (0,09% = không nhìn thấy gì · 23,75% = đọc ra ngay là thành phố cảng), nên hạ nó xuống là
vứt một thứ đã hiệu chuẩn để lấy một thứ chưa hiệu chuẩn.

**Đóng bằng một con số trong bài test, không bằng một dòng trong tài liệu** (`scripts/waterView.test.js`):

```js
assert.deepEqual(TRUOT, [6, 7, 10], '…');
assert.equal(DAT.length, 11, 'phải có đúng 11 kỷ đạt cổng 5%');
```

Nó tự đỏ **cả hai chiều**: kỷ thứ tư trượt thì đỏ, mà một trong ba kỷ được chữa xong cũng đỏ. Kèm
một bài riêng — `KỶ 6 TRƯỢT VÌ BỀ RỘNG` — quét đủ 24 góc và đòi trần toàn cục của kỷ 6 phải **dưới**
5%; đó là vế chứng minh câu *"giới hạn của bề rộng, không phải của góc nhìn"*, thay vì để nó nằm
làm một lời khẳng định chưa kiểm trong chú thích (bài học Phase 4G).

⚠️ **Kỷ 7 và 10 KHÔNG có bài tương tự, và đó là sự thật chứ không phải chỗ bỏ sót**: trần toàn cục
của chúng (9,11% · 7,22% — đo lại ở độ mịn bài test) CÓ vượt 5%, chỉ là ở những góc phá hỏng bố cục
của 14 kỷ còn lại. Viết *"không góc nào cứu được"* cho chúng sẽ là một câu sai.

**Nghiệm thu bằng mắt (Bước C, 2026-08-20)** — Đàm đặt điều kiện xem lại ở `#61`: kỷ 10 trượt cổng
(1,60%) **và mắt cũng không đọc ra là thành phố bên kênh** (ảnh cận cảnh: con kênh là một vệt xanh
mảnh ở góc trên-trái, thành phố không có quan hệ gì với nó). Tức cổng và mắt **đồng ý** ở ca này —
chưa có bằng chứng cổng đang đo sai đại lượng.
### ⚠️ CẬP NHẬT 2026-08-20 → ĐÃ TÁCH SANG `#67` (2026-08-21)

§1(B) làm danh sách trượt cổng đi từ 3 lên 5 kỷ, và hai kỷ mới (4 và 5) trượt vì **địa hình che**,
không vì bề rộng. Toàn bộ bảng số + phân tích của nửa ấy nay nằm ở **`#67`**; con số đang khoá trong
`scripts/waterView.test.js` là con số CHUNG của cả hai chứng (`TRUOT = [4, 5, 6, 7, 10]`,
`DAT.length === 9`) và nó sẽ đổi khi **một trong hai** mục được chữa — đó chính là lý do phải đọc cả
hai mục trước khi sửa con số ấy.

- **Owner**: Đàm chốt · **Status**: **✅ Closed (2026-08-20)** — ba kỷ 6 · 7 · 10, đúng khuôn (b);
  điều kiện xem lại duy nhất là nếu ai đó muốn nới bề rộng nước của chúng (⇒ nói dối địa lý, đã bị bác)

---

## #58 — ẢNH CHỤP RỘNG HƠN ~1300px CÓ THỂ BỊ NHIỄM MỘT **KHỐI CHỮ NHẬT** Ở GÓC, VÀ CỔNG CHỐNG-RÁCH HIỆN CÓ KHÔNG THỂ THẤY

- **Tên**: lỗi ghép DẢI lúc chụp CDP sinh ra một khối chữ nhật lệch ở ảnh rộng; cổng `soiVetRach`
  chỉ quét mép HÀNG nên mù với mép ĐỨNG
- **Module**: `scripts/city-preview.mjs` (đường ghép dải `Page.captureScreenshot`) ·
  cổng `soiVetRach`
- **Priority**: Medium · **Severity**: Medium
- **Impact**: một cặp ảnh nghiệm thu "trước/sau" có thể lệch nhau hàng chục phần trăm vì lý do
  KHÔNG liên quan gì tới mã cảnh, và nó **qua được** cổng chống-rách hiện tại. Đã cắn thật:
  VIỆC 2 Bước B, cặp **kỷ 1 ở 1500px** lệch **20,8%** trong khi kỷ 1 là kỷ KHÔ và ở 1100px thì hai
  ảnh trùng TỪNG BYTE. Phần lệch là hình chữ nhật **hàng 0–348 × cột 780–1499**.
- **Root Cause**: **349 = chiều cao đúng một dải** cho ảnh rộng 1500 (`2 MiB ÷ 4 byte ÷ 1500`), nên
  đây là lỗi ở bước ghép dải chứ không phải ở cảnh. Vì sao cổng không thấy: `soiVetRach` sinh ra
  cho `TECH_DEBT #52` — một vết rách NGANG — nên nó quét mép giữa các HÀNG. Một khối lệch có mép
  ĐỨNG ở cột 780 **không tạo ra mép ngang nào** ở phần lớn chiều rộng, nên phép đo về mặt cấu trúc
  không thể thấy nó. Đúng bài học đã ghi nhiều lần: *"hỏi 'đại lượng tôi đang vặn có nằm trong thứ
  công cụ này đo không?'"*.
- **Current Risk**: **THẤP** — mọi ảnh nghiệm thu chuẩn của dự án là **1100px**, dưới ngưỡng cắn;
  chưa gặp lần nào ở 1100px. Số đo w1500 của Bước B đã bị **vứt bỏ toàn bộ**, không dùng một con nào.
- **Future Risk**: **CAO nếu có phase dùng ảnh cận cảnh rộng** — `CLAUDE.md` đang khuyên chụp
  `--width 1500` để soi chi tiết nhỏ (cây, đèn, tầng trệt, mái). Tức đúng loại ảnh mà bài học
  "chi tiết chỉ thấy khi nhìn gần" bảo phải dùng lại chính là loại ảnh có thể nhiễm, **và người đọc
  sẽ tin nó** vì cổng báo sạch.
- **Recommended Solution**: mở rộng `soiVetRach` sang mép **ĐỨNG** (cùng công thức, đổi trục), và
  quan trọng hơn — thêm một mục kiểm **ngay tại chỗ ghép**: mỗi dải phải đúng chiều cao đã yêu cầu
  và tổng chiều cao các dải phải bằng chiều cao khung nhìn. Kèm **đối chứng nhốt đúng ca này**
  (dựng lại khối 0–348 × 780–1499) đòi phép đo phải bắt được, theo đúng luật ngưỡng-phải-có-đối-chứng.
- **Estimated Complexity**: Nhỏ–Vừa (một hàm thuần + đối chứng; không đụng mã cảnh)
- **Blocking Conditions**: không có. Nằm ngoài phạm vi VIỆC 2 Bước B (Đàm giới hạn ở `city3d/*`
  + test + scripts + tài liệu — `scripts` thì trong phạm vi, nhưng việc này không phục vụ Bước B và
  làm kèm sẽ trộn hai thay đổi không liên quan vào một commit, trái luật commit của dự án).
- **Review Trigger**: lần đầu có phase cần ảnh nghiệm thu rộng hơn 1300px; hoặc khi có cặp ảnh
  "trước/sau" lệch nhau ở một kỷ đáng lẽ không đổi.
- **Owner**: chưa phân công · **Status**: Open

---

## #57 — ✅ ĐÃ ĐÓNG (2026-08-20, ADR-041) — Camera mặc định quay lưng lại phía có nước: kỷ 14 chỉ thấy **0,09%** mặt biển, trần là **31,43%**

- **Tên**: bờ nước và góc camera mặc định chỏi nhau; 8/14 kỷ có nước sẽ gần như vô hình
- **Module**: `src/engine/city3d/settingStyle.js` (cột `side`) ↔ `src/engine/city3d/orbit.js`
  (`DEFAULT_YAW`) · đo bằng `scripts/water-view.mjs`
- **Priority**: **High** · **Severity**: High (nó vô hiệu hoá phần thưởng chính của cả VIỆC 2)
- **Impact**: Đàm mở màn Thành Phố ở kỷ 14 — kỷ *đảo quốc Singapore* — và **không nhìn thấy biển**.
  Toàn bộ hình học biển vẫn được dựng, vẫn tốn +1 lệnh vẽ, vẫn tốn 16.128 tam giác; nó chỉ nằm
  ngoài khung hình. Đây chính xác là cổng không-đo-được-bằng-test mà Đàm đặt ra (*"phải đọc ra là
  thành phố cảng, không phải thành phố cạnh một vũng xanh"*) — và nó **TRƯỢT**.
- **Root Cause**: `DEFAULT_YAW = π/4` đặt camera ở góc **ĐÔNG-NAM** rồi nhìn về gốc toạ độ, tức
  nhìn về hướng **tây-bắc**. Nên bờ `nam` và bờ `dong` nằm **SAU LƯNG** camera, còn bờ `bac`/`tay`
  thì nằm trọn trong khung. Kỷ 14 khai `side: 'nam'` — và khai ĐÚNG (Marina Bay thật sự nhìn nam ra
  eo Malacca). Hai quyết định đều đúng một mình, và **chúng chưa bao giờ được đặt cạnh nhau**.
  ⚠️ Đây là **cùng một hình dạng sai với `TECH_DEBT #38`/Phase 7D**: một lời hứa nói về QUAN HỆ
  (*"nước phải NHÌN THẤY ĐƯỢC"*) được cài đặt bằng hai HẰNG SỐ ở hai file không tham chiếu nhau.
- **Current Risk**: đã hiện thực, không phải rủi ro tiềm tàng — đo được ở HAI kỷ đã dựng hình.
- **Future Risk**: Bước C trải nốt 12 kỷ ⇒ **8/14 kỷ có nước rơi vào phía khuất** (`nam`: 6, 7, 8,
  14 · `dong`: 2, 5, 12, 13). Làm xong Bước C mà không chốt mục này là **tiêu ngân sách cho một
  thứ hơn nửa số kỷ sẽ không nhìn thấy** — đúng bài học §2-C (*đo TRẦN trước khi tiêu*), chỉ khác
  là lần này trần đã đo xong TRƯỚC, nên không còn cớ.
- **SỐ ĐO** (`node --import ./scripts/register-esm-loader.mjs scripts/water-view.mjs --eras 12,14,1`,
  2026-08-19; bắn tia qua đúng camera app dùng, không đếm màu):

  | kỷ | loại nước | bờ | mặc định 45° | trần (đứng đối diện) | gấp |
  |---|---|---|---:|---:|---:|
  | 14 | sea | nam | **0,09%** | **31,43%** | **345,7×** |
  | 12 | river | dong | 2,30% | 9,16% | 4,0× |
  | 1 | none | none | 0,00% | 0,00% | — |

  ⚠️ Sông đỡ hơn biển rất nhiều (4,0× so với 345,7×) vì một dòng sông **cắt ngang cả cảnh** nên
  luôn còn một khúc trong khung, còn biển là một **nửa mặt phẳng** nằm trọn về một phía.
- **Recommended Solution**: **KHÔNG tự chọn — Đàm quyết** (đụng `camera` hoặc đụng bảng đã duyệt,
  cả hai đều nằm trong 6 ca phải dừng hỏi). Bốn hướng, kèm giá đã cân:
  - **(a) Xoay `DEFAULT_YAW` thêm 180°** (45° → 225°). Rẻ nhất về mã (một số), đắt nhất về hệ quả:
    **mọi kỷ đổi khung hình**, nên toàn bộ mốc `sweep-score`, mọi kết luận mỹ thuật đã duyệt, và
    `PERFORMANCE.md` đều phải đo lại. Và nó chỉ đổi chỗ vấn đề: `bac`/`tay` (6 kỷ) sẽ thành phía khuất.
  - **(b) Camera xoay THEO bờ nước của kỷ** (`yaw` suy từ `side`). Giải đúng gốc — mọi kỷ đều nhìn
    ra nước. Giá: chuyển kỷ thì góc nhìn nhảy, và `cityFocus`/`sceneStats` phải kiểm lại.
  - **(c) Sửa cột `side`** cho các kỷ vào phía khuất. **Không nên**: nó mua một con số đẹp bằng cách
    nói dối địa lý — đúng thứ ADR-025 đã cấm với mặt đường.
  - **(d) Chấp nhận**: nước là phần thưởng khi Đàm TỰ xoay camera (app cho kéo). Giá bằng 0 về mã,
    nhưng ảnh mặc định — thứ Đàm nhìn thấy hằng ngày — vẫn không có biển.
- **Estimated Complexity**: (a) rất thấp về mã / rất cao về nghiệm thu lại · (b) trung bình ·
  (c) thấp · (d) 0
- **Blocking Conditions**: **Bước C không nên bắt đầu trước khi mục này được chốt** — trải 12 kỷ
  rồi mới đổi góc nhìn là phải nghiệm thu lại toàn bộ hai lần.
- **Review Trigger**: ngay khi Đàm trả lời cổng "thành phố cảng"
- **Owner**: Đàm đã chốt 2026-08-20 · **Status**: ✅ **ĐÃ ĐÓNG**

### ĐÃ SỬA THẾ NÀO — Đàm bác cả bốn hướng trên và ra hướng thứ NĂM

⚠️ **Bài học đáng giá nhất của mục này nằm ở chỗ cả bốn hướng tôi đề xuất đều SAI CHỖ.** Đàm:
*"KHÔNG SỬA CAMERA, KHÔNG SỬA `side`. SỬA THỨ THỨ BA."* Câu hỏi đúng không phải *"nên xoay camera
hay sửa bảng"* mà là ***"vì sao một dữ kiện QUAN TRỌNG của cảnh lại nằm ở một hướng mà KHÔNG CƠ CHẾ
NÀO chịu trách nhiệm?"*** — `side` đúng (sự thật lịch sử), `DEFAULT_YAW` đúng (hằng số mỹ thuật),
thứ sai là **quan hệ giữa chúng không ai sở hữu**. Bốn hướng (a)–(d) đều là *"hy sinh một trong hai
vế"*; hướng thứ năm là **cho cái quan hệ ấy một cái tên**: trường `worldYaw` (ADR-041) xoay ĐỊA THẾ
(nước + địa hình + vùng quê + rặng núi) chứ không xoay camera và không xoay lưới 12×12.

**Số đo sau khi sửa** (cùng lệnh, cùng công cụ, 2026-08-20):

| kỷ | bờ (`side`, GIỮ NGUYÊN) | `worldYaw` | mặc định TRƯỚC | mặc định SAU | trần |
|---|---|---:|---:|---:|---:|
| 14 | `nam` | +90° | 0,09% | **23,75%** | 31,43% |
| 12 | `dong` | +90° | 2,30% | **9,32%** | 8,97% |
| 1 | `none` | 0° | 0,00% | 0,00% | 0,00% |

⚠️ Kỷ 12 SAU (9,32%) **cao hơn cả trần cũ** (8,97%) — không phải lỗi làm tròn: trần đo bằng cách
đứng ĐỐI DIỆN bờ, mà với một dải sông thì góc chính diện KHÔNG phải góc tối ưu (nhìn xiên thì khúc
sông trải dài hơn trong khung). Đã đo lại cả 14 kỷ × 24 góc, xem `PERFORMANCE.md`.

**Cái canh cho nó không bị mất**: `scripts/waterView.test.js` khoá `macDinh >= 0.05` cho mọi kỷ
trong `ERAS_WITH_WATER_GEOMETRY`, kèm đối chứng trần. Đây là cách mục nợ này được đóng tử tế thay
vì nằm mãi ở Open — và bài kiểm cũ (`KHUYẾT TẬT VẪN CÒN NGUYÊN`) **đã reo đúng như thiết kế** khi
mã hết bệnh, một bằng chứng thực nghiệm cho luật *"một con số trong bài test là cái hẹn giờ duy
nhất chạy được"*.

---

## #56 — ✅ ĐÃ ĐÓNG (2026-08-20, Bước C) — 12/14 kỷ có nước trong bảng nhưng chưa được dựng hình (dở dang CÓ CHỦ Ý, và nó đếm được)

- **Tên**: `settingStyle.js` khai 14 kỷ có nước; `ERAS_WITH_WATER_GEOMETRY` mới dựng 2 (12 và 14)
- **Module**: `src/engine/city3d/setting.js` · `settingStyle.js` · `drawCallBudget.test.js`
- **Priority**: Medium · **Severity**: Low (không hỏng gì; chỉ là 12 kỷ chưa nhận phần thưởng)
- **Impact**: mười hai kỷ vẫn hiện đúng như trước Bước B — không nước, không lỗi, không hồi quy.
  Cái mất là **bản sắc địa lý** mà bảng đã hứa: kỷ 3 (Ur bên Euphrates), kỷ 9 (Paris bên Seine),
  kỷ 13 (vịnh Tokyo)… hôm nay vẫn là những thành phố giữa đồng.
- **Root Cause**: **KHÔNG PHẢI một thiếu sót — là lệnh của Đàm.** Chỉ thị Bước B ghi rõ: *"DỰNG
  HÌNH, ĐÚNG 3 KỶ… Đừng trải 12 kỷ còn lại"*, và kèm một cổng không đo được bằng test (*"kỷ có
  biển phải đọc ra là 'thành phố cảng', không phải 'thành phố cạnh một vũng xanh'"*). Trải 12 kỷ
  trước khi Đàm nhìn ảnh là trải một hướng mỹ thuật chưa được duyệt ra mười hai chỗ.
- **Current Risk**: gần như không. Trạng thái dở dang này **ĐẾM ĐƯỢC trong `npm test`**:
  `assert.deepEqual(ERAS_WITH_WATER_GEOMETRY, [12, 14])` + `soKyKho === 13` +
  `assert.equal(soKyTang, 2)` ở `drawCallBudget.test.js`. Đúng bài học Phase 10 (`door: 'legacy'`):
  *"một mục nợ trong tài liệu chỉ được đọc khi có người đi tìm; một con số trong bài test thì tự
  đòi được đọc."* Ba con số ấy — chứ không phải mục này — là thứ buộc phiên sau phải mở lại.
- **Future Risk**: nếu để lâu, `hasWater` (BẢNG khai) và `waterIsBuilt` (HÌNH đã dựng) sẽ bắt đầu
  bị dùng lẫn lộn. Hai cái tên đã cố tình tách nhau vì lý do đó, nhưng tên chỉ nhắc chứ không chặn.
- **Recommended Solution**: sau khi Đàm gật hướng mỹ thuật → trải nốt, **đo lại mốc lệnh vẽ của
  TỪNG kỷ** (không cộng đều: một kỷ có thể vốn đã dùng họ vật liệu ấy). Chú ý riêng **kỷ 5**
  (`meander` — khúc uốn ôm ba mặt): đó là kiểu nước DUY NHẤT chưa ai nhìn bằng mắt, và
  `MEANDER_NECK = 1,6` hôm nay là một suy luận, không phải một quyết định đã nghiệm thu.
- **Estimated Complexity**: Thấp về mã (một dòng danh sách), Trung bình về nghiệm thu (12 ảnh +
  12 mốc lệnh vẽ + một vòng quét không-trôi).

### ✅ ĐÃ ĐÓNG THẾ NÀO (2026-08-20, Bước C)

Đàm duyệt ảnh Bước B (*"DUYỆT ẢNH — ĐẠT"*) ⇒ trải nốt. `ERAS_WITH_WATER_GEOMETRY` nay là đủ 14 kỷ,
và **lời hứa đổi hình dạng**: từ một danh sách đếm một trạng thái DỞ DANG thành một **QUAN HỆ** —
*mọi kỷ bảng khai có nước thì phải dựng ra nước*, kiểm ở cả 15 kỷ bằng `hasWater(era) === waterIsBuilt(era)`.

⚠️ **`hasWater` và `waterIsBuilt` VẪN LÀ HAI CÁI TÊN, kể cả bây giờ khi hai tập hợp đã trùng nhau.**
Việc chúng trùng là một **sự thật của hôm nay**, không phải một định nghĩa. Gộp chúng lại là xoá
mất chỗ để ghi *"kỷ này khai có nước mà chưa dựng"* — thứ sẽ cần lại ngay lần tới có ai thêm một kỷ.

**Số đo nghiệm thu (đo ngày 2026-08-20, lệnh ghi ngay dưới mỗi bảng):**

| hạng mục | trước Bước C | sau Bước C |
|---|---|---|
| kỷ đã dựng nước | 2 (12, 14) | **14** |
| kỷ khô | 13 | **1** (kỷ 1 — nhân chứng của luật *"nước không tính tiền lên kỷ không có nước"*) |
| kỷ đạt cổng 5% | 2/2 | **11/14** (ba kỷ hẹp nằm trong bảng `TRUOT`, xem `#59`) |
| lệnh vẽ | mốc riêng từng kỷ | **mỗi kỷ có nước đúng +1**, kỷ 1 không đổi |

⚠️ **Kỷ 5 (`meander`) đã được nhìn bằng mắt** như mục này yêu cầu: hai nhánh nước ôm lấy một sống
đất, thành phố đứng trên sống — đúng hình khúc uốn. `MEANDER_NECK = 1,6` thôi là một suy luận.
- **Owner**: đã xong · **Status**: **✅ Closed (2026-08-20)**

---

## #55 — VÙNG QUÊ KHÔNG PHẢN ỨNG VỚI GIỜ TRONG NGÀY, VÀ NÓ ĐANG KÉO TRỤC "6 CHẶNG NGÀY" XUỐNG

- **Tên**: Thảm thực vật ngoài lưới giống hệt nhau ở cả 6 chặng ngày ⇒ pha loãng khác biệt sáng/trưa/chiều/tối
- **Module**: `src/engine/city3d/outskirts.js` · `render3d/sceneGraph.js` (chỗ đặt vùng quê) · công cụ chấm `scripts/sweep-score.mjs`
- **Priority**: Medium · **Severity**: Low (mỹ thuật, biên còn 37%)
- **Impact**: Bản quét 15 kỷ × 6 chặng chấm hai trục. Sau VIỆC 1, trục **KỶ đi lên** (trung vị
  37,6 → **40,8**, gần nhất 21,3 → 21,5) nhưng trục **CHẶNG NGÀY đi xuống**: cặp gần nhất
  20,7 → **16,5** (bình minh 6h ↔ chiều 15h). Vẫn trên ngưỡng mắt 12 tới 37%, nhưng là hướng sai.
- **Root Cause**: ⚠️ **KHÔNG PHẢI phép đo hỏng — mã hỏng.** Phép đo chặng lấy trung bình CẢ CẢNH
  (vector 9 chiều), và vùng quê là một mảng lớn **giống hệt nhau ở cả 6 chặng**, nên nó pha loãng
  đúng cái đại lượng đang được hỏi. Cùng hình dạng `TECH_DEBT #22` (trung bình trên vùng quá rộng)
  và bài học ngân sách tam giác 2026-08-17 (hằng số nền pha loãng 43% xuống 16%) — nhưng lần này
  thứ pha loãng KHÔNG phải một lỗi đo, mà là một khuyết tật thật: ngoài đời đồng ruộng và rừng cây
  đổi màu theo nắng **mạnh hơn cả mái nhà**, trong khi ở đây chúng đứng yên.
- ⚠️ **ĐÀM ĐÃ BÁC PHƯƠNG ÁN "SỬA PHÉP ĐO"**, và anh bác đúng: bỏ vùng quê ra khỏi vùng lấy mẫu là
  **định nghĩa lại câu hỏi cho vừa câu trả lời**. Câu hỏi gốc là *"6 chặng ngày có còn phân biệt
  được không"*, mà người dùng nhìn CẢ KHUNG HÌNH chứ không nhìn riêng thành phố. (Chính tôi đã tự
  nêu nghi ngại này — *"đổi phép đo có nguy cơ tự cho mình điểm đẹp"* — rồi suýt không nghe theo.)
- **Current Risk**: thấp — 16,5 còn cách ngưỡng mắt 12 một khoảng 37%.
- **Future Risk**: trung bình. Mỗi phase sau thêm thứ gì đó **không phụ thuộc giờ trong ngày** sẽ
  kéo tiếp, và biên đang thu hẹp chứ không nới ra.
- **Recommended Solution**: cho vùng quê nhận `daylight` như thành phố đã nhận — lá cây ngả vàng
  lúc hoàng hôn, xám lại lúc chạng vạng. **KHÔNG cần nguồn sáng mới** (vai màu đã đi qua cùng hệ
  ánh sáng), chỉ cần màu lá đọc thêm một hệ số theo giờ.
- **Estimated Complexity**: nhỏ.
- **Blocking Conditions**: ⚠️ **ĐỪNG LÀM BÂY GIỜ.** Đàm chốt: VIỆC 2 sắp thêm NƯỚC, mà mặt nước
  phản ứng với ánh sáng rất mạnh, nên con số này **có thể tự phục hồi**. Đo lại sau VIỆC 2 rồi mới
  quyết — sửa trước là có nguy cơ chữa một cái sắp tự lành.
- **Review Trigger**: ⚠️ **NGƯỠNG TƯỜNG MINH DO ĐÀM ĐẶT — "nếu trục chặng ngày xuống DƯỚI 14 thì
  phải làm vùng quê đổi theo giờ, KHÔNG được nới ngưỡng."** Ngoài ra: đo lại ngay sau khi VIỆC 2
  ship (lệnh `node scripts/city-preview.mjs --sweep --all --theme light` rồi
  `node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png`).
- ⚠️ **CẬP NHẬT 2026-08-20, NGHIỆM THU BƯỚC C — NGƯỠNG ĐÃ CHẠM, VÀ CHẨN ĐOÁN Ở TRÊN ĐÃ BỊ CHÍNH SỐ
  ĐO BÁC BỎ. HAI VIỆC KHÁC NHAU, ĐỪNG GỘP.**

  **(1) Con số.** Đo lại sau Bước C (md5 ảnh `c210cbe93adaa8fc5ea2bd7eafd1dead`): trục chặng ngày =
  **13,9616**, tức **DƯỚI 14** — ngưỡng hành động của Đàm ĐÃ chạm. ⚠️ Bảng nghiệm thu đầu tiên của
  phiên này ghi *"14,0"*; phép làm tròn ấy đẩy con số lên đúng phía kia của cổng và biến một điều
  kiện-đã-kích-hoạt thành một câu *"vừa đúng ngưỡng, tạm ổn"*. ⇒ **Một con số dùng để chấm cổng thì
  phải in đủ chữ số để phân biệt hai phía của cổng ấy.**

  **(2) Nhưng nguyên nhân KHÔNG phải vùng quê — đã đo và bác bỏ.** Tách bản quét ra ba dải (trung
  bình 15 kỷ, thang RGB/255), ở đúng cặp yếu nhất **6h ↔ 15h**:

  | dải | 6h (R,G,B) | 15h (R,G,B) | khoảng cách | so với ngưỡng mắt 12 |
  |---|---|---|---:|---|
  | trời      | 103,103, 75 | 106,110, 79 |  **9,29** | **DƯỚI ngưỡng** |
  | thành phố |  89, 87, 60 |  93, 93, 69 | **11,50** | **DƯỚI ngưỡng** |
  | mặt đất   |  76, 79, 51 |  87, 91, 62 | **19,14** | trên ngưỡng 60% |

  Và dải **mặt đất** đi **68,8 → 82,2 → 97,6 → 79,8 → 61,2 → 36,7** qua sáu chặng — tức vùng quê
  PHẢN ỨNG rất mạnh với giờ trong ngày, và ở cặp yếu nhất nó là dải **KHOẺ NHẤT**. Nó cũng gần như
  không đổi qua Bước C (19,04 → 19,14). ⇒ **Bản vá mà mục này đề xuất ("cho vùng quê nhận
  `daylight`") sẽ đi bồi thêm cho dải đang mạnh nhất và không chạm vào hai dải đang hỏng.** Thứ
  thật sự dẹt là **BẦU TRỜI** (9,29) và **THÀNH PHỐ** (11,50) — bình minh 6h và chiều 15h đang có
  gần như cùng một bầu trời.

  ⚠️ Đây là một cái bẫy đáng ghi: chẩn đoán cũ nghe **cực kỳ xuôi tai** (nó đúng về cơ chế — thêm
  thứ không-phụ-thuộc-giờ thì pha loãng thật) và nó được viết ra ở thời điểm chưa ai tách dải. ⇒
  **Trước khi đi sửa theo một chẩn đoán, tách con số gộp ra từng thành phần và hỏi thành phần nào
  thật sự kéo nó xuống** (cùng họ `#22`).

  **(3) VÀ MỘT PHÁT HIỆN VỀ CHÍNH PHÉP ĐO — CHƯA ĐƯỢC PHÉP TỰ SỬA.** `sweep-score.mjs` tính trục
  chặng bằng cách **gộp 15 kỷ thành một vector trung bình rồi mới so**, đúng thứ mà chú thích của
  trục KỶ trong CHÍNH file ấy cấm (*"gộp trước thì hai kỷ khác nhau ở bình minh nhưng ngược chiều ở
  hoàng hôn sẽ TRIỆT TIÊU nhau"*). Trục kỷ đã được vá; trục chặng thì chưa bao giờ. Đo cả hai cách
  trên cùng hai bản quét:

  | cách | trước Bước C | sau Bước C | Δ |
  |---|---:|---:|---:|
  | A · gộp-trước (đang dùng) | 15,75 | **13,96** | −1,79 |
  | B · so-từng-kỷ (cách trục kỷ) | 17,63 | **17,41** | −0,22 |

  Ở cách B, kỷ tệ nhất trong cặp 6h↔15h còn **TỐT LÊN** (9,09 → 9,70). ⚠️ **KHÔNG được lặng lẽ đổi
  sang cách B**: ba mốc 20,7 / 17 / 14 đều hiệu chuẩn trên cách A, nên đổi ruột phép đo mà giữ
  ngưỡng cũ là tạo ra một ngưỡng chưa hiệu chuẩn — đúng cái phễu Phase 9A, và đúng thứ Đàm gọi là
  *"định nghĩa lại câu hỏi cho vừa câu trả lời"*. Ghi ra để Đàm quyết, không tự làm.

- **Recommended Solution (CẬP NHẬT)**: ⚠️ **KHÔNG làm bản vá vùng quê** — nó nhắm sai dải. Ba hướng,
  chờ Đàm chọn:
  (a) **làm BẦU TRỜI 6h khác BẦU TRỜI 15h** — đây là dải dẹt nhất (9,29) và cũng là dải rẻ nhất để
      sửa (`daylight.js` đã có sẵn trục giờ; không cần nguồn sáng mới). Đây là hướng tôi khuyến
      nghị nếu Đàm muốn kéo con số lên;
  (b) **sửa phép đo cho khớp trục kỷ** (chuyển sang cách B) — nhưng bắt buộc phải **hiệu chuẩn lại
      ba mốc** bằng ảnh thật, không được mang ngưỡng cũ sang;
  (c) **chấp nhận 13,96** và ghi rõ rằng cặp 6h↔15h là cặp cố ý gần nhau (cùng là ánh nắng xiên,
      chỉ khác hướng) — có lý về vật lý, và đúng thứ `CLAUDE.md` đã ghi cho cặp bình minh↔hoàng hôn.
- **Owner**: — · **Status**: ⏸️ **HOÃN có chủ ý — Đàm chốt 2026-08-20**

  *"HOÃN. Đơn thuốc cũ đã bị số đo bác bỏ, và Bước 2 của mặt trận mới (tone mapping, tương phản,
  bóng) rất có thể tự nâng dải trời và dải thành phố. Đo lại SAU Bước 2 rồi mới quyết."*

  Lý do kỹ thuật đứng sau quyết định ấy: số đo đã chỉ rõ thủ phạm **KHÔNG** phải vùng quê. Tách
  con số gộp 13,96 ra ba dải ở đúng cặp yếu nhất (6h ↔ 15h): **mặt đất 19,14** (khoẻ nhất) ·
  **thành phố 11,50** · **trời 9,29** — hai dải sau đã DƯỚI ngưỡng mắt 12. Bốc thuốc "làm vùng quê
  đổi theo giờ" là đi bồi cho dải đang khoẻ nhất. Mà tone mapping / tương phản / bóng đổ thì tác
  động thẳng vào **trời** và **thành phố** — đúng hai dải đang kéo con số xuống. ⇒ Đo lại sau, chứ
  không sửa trước.

  ⚠️ **KHÔNG được nới ngưỡng.** Ba mốc Đàm đặt (≥20,7 tự phục hồi · <17 khuyết tật thật · <14 phải
  làm vùng quê đổi theo giờ) giữ nguyên, và giá trị hiện hành **13,9616** vẫn đang nằm dưới mốc thứ
  ba — chỉ là thứ tự xử lý được đổi, không phải cái cổng.

---

## #54 — BỘ HOẠCH ĐỊNH ĐƯỜNG BAY CẬN CẢNH CHỈ BIẾT CÔNG TRÌNH, KHÔNG BIẾT ĐỊA HÌNH QUANH NÓ

- **Tên**: Camera cận cảnh né được nhà nhưng KHÔNG né được quả đồi
- **Module**: `src/engine/city3d/cityFocus.js` (`planCityFocus`, danh sách `blockers`) · nguồn cao độ
  là `terrain.js` (`surfaceHeightAt`) và `horizon.js` (`heightAt`)
- **Priority**: Medium · **Severity**: Medium (chỉ chạm khi Đàm bấm vào một công trình ở rìa phố)
- **Impact**: `planCityFocus` nhận `blockers` là **danh sách khối CÔNG TRÌNH**, nên nó chứng minh
  được "đường bay không xuyên qua nhà" mà **không** chứng minh được "đường bay không xuyên qua đất".
  Đo được ở **kỷ 8 (Bồ Đào Nha)**: mặt đất vùng quê dâng tới **+2,18** đơn vị thế giới trong khi nền
  thành phố quanh 0 — tức **camera ĐÃ CÓ THỂ chui qua sườn đồi ấy từ trước phase này**, không phải
  lỗi do vùng quê sinh ra.
- **Root Cause**: ADR-034 định nghĩa lưới an toàn theo **khối kiến trúc**, vì lúc viết nó mặt đất
  còn gần như phẳng ở mọi chỗ camera đi qua. Phase 7B cho mặt đất cao độ thật và Phase 9A thêm rặng
  núi, nhưng `planCityFocus` **không được kể lại** — đúng hình dạng *"một kết luận đúng hết đúng vì
  TIỀN ĐỀ của nó bị gỡ ở một phase khác"* (Phase 8C).
- **Current Risk**: thấp–trung bình. Chỉ lộ ra ở kỷ có địa hình dâng cao gần rìa (đo được: kỷ 8 cao
  nhất). Triệu chứng là một khoảnh khắc camera lướt qua trong lòng đất khi bay tới công trình rìa phố.
- **Future Risk**: TĂNG theo mỗi phase địa hình. VIỆC 2 (bảng `settingStyle.js` — bờ biển, vách đá,
  cửa sông) sẽ dựng những khối đất CAO và DỐC hơn hẳn hiện nay; làm xong VIỆC 2 mà chưa vá mục này
  thì xác suất chui-qua-đất tăng rõ rệt.
- **Recommended Solution**: cho `planCityFocus` lấy mẫu **CAO ĐỘ MẶT ĐẤT dọc đường bay** (nó đã lấy
  mẫu cả đường bay sẵn rồi — ADR-034 §"lưới an toàn canh CẢ ĐƯỜNG BAY") và đòi camera luôn cao hơn
  `max(surfaceHeightAt, horizon.heightAt)` một khoảng hở tối thiểu. ⚠️ **KHÔNG** giải bằng cách nhét
  cây cối vùng quê vào `blockers`: cây chỉ là thứ MỌC TRÊN quả đồi, chặn cây mà không chặn đồi là
  chữa triệu chứng, và nó còn làm hỏng phép đo (đo thật: khoảng hở kỷ 8 tụt xuống 0,81 khi thêm cây,
  tức bài test kêu OAN về một nguyên nhân sai).
- **Estimated Complexity**: nhỏ–vừa. Hàm cao độ đã thuần và đã có sẵn; việc chính là thêm một trục
  vào phép kiểm đường bay và hiệu chuẩn lại khoảng hở tối thiểu bằng số đo, không bằng cảm giác.
- **Blocking Conditions**: không có. Nên làm **TRƯỚC hoặc CÙNG** VIỆC 2 (địa thế theo kỷ).
- **Review Trigger**: ngay khi bắt đầu VIỆC 2, hoặc khi có ai báo camera "chui xuống đất" lúc bấm
  vào một công trình.
- **Owner**: chưa phân công · **Status**: Open
- **Cách tái lập số**: chạy `planCityFocus` cho 15 kỷ rồi so cao độ camera dọc đường bay với
  `surfaceHeightAt` tại chính toạ độ ấy; con số +2,18 của kỷ 8 lấy từ `surfaceHeightAt` trên vành
  ngoài lưới (`distanceOutsideGrid > 0`).

---

## #53 — VÀNH ĐẤT NGOÀI LƯỚI CHIẾM ~21% KHUNG HÌNH VÀ KHÔNG MỘT PHASE NỘI DUNG NÀO CHẠM TỚI ĐƯỢC

> ⚠️ **CẬP NHẬT 2026-08-21 (Phase 13 VIỆC B, ADR-049) — NỬA CÒN LẠI ĐÃ LÀM, VÀ BA CON SỐ «CHƯA ĐO
> LẠI» Ở KHỐI DƯỚI NAY ĐÃ CÓ SỐ THẬT.** Vùng phụ cận (`hinterlandStyle.js` + `hinterland.js`) là
> tầng nội dung ĐẦU TIÊN đặt được dấu vết CON NGƯỜI ra ngoài lưới 12×12 — thứ mà cả `§2-B` lẫn
> `§2-C` về mặt cấu tạo không làm được. Đo trên bộ ảnh s80 dựng lại cùng ngày (chi tiết ở
> `PERFORMANCE.md` mục "Phase 13 VIỆC B"):
>
> | | TRƯỚC (`e455114`) | SAU (`8bc80ab`) |
> |---|---|---|
> | dấu vết người ngoài lưới — số vật | **0** | **2241** (1697,6 ô², TB 149,4/kỷ) |
> | dấu vết người ngoài lưới — % khung | **0,00** | **4,22** (0,25 … 8,49) |
> | (M1) dấu vết người cả khung | 37,18% | **41,43%** (tăng ở 15/15 kỷ) |
> | dải 2 (dải xa nhất còn tấm đất) | 21,56% | **32,81%** (tăng ở 15/15 kỷ) |
> | tấm đất (grid+apron) 6 dải | 2,02 · 19,67 · 26,24 · 37,39 · 44,24 · 54,26 | 1,29 · 16,18 · 25,11 · 37,37 · 43,66 · 50,86 |
>
> ⚠️ **NHƯNG MỤC NÀY CHƯA ĐÓNG, VÀ LÝ DO ĐÁNG ĐỌC.** Vành ngoài KHÔNG còn là *mảng chết*, nhưng nó
> vẫn KHÔNG *giảm khi Đàm chơi* — vùng phụ cận là một tầng **ĐỊA LÝ** (không nhận `built`/
> `sessionCount`, có test gọi kèm dữ liệu rác khoá điều đó), nên 2241 vật ở mốc 80 phiên **bằng
> đúng** số vật ở mốc 0 phiên. Tức nửa "trống" của mục này đã đóng; nửa "**không phải phần thưởng
> của việc chơi**" thì chưa, và nó đã được tách ra thành mục riêng **`#74`**. Câu gốc của mục này —
> *"càng chơi lâu, phần trống Đàm nhìn thấy càng là phần không ai chạm được"* — nay phải đọc thành
> *"phần ấy đã có nội dung, nhưng nội dung ấy không lớn lên theo công sức của Đàm"*.

> ⚠️ **ĐÍNH CHÍNH 2026-08-21 — MỘT TIỀN ĐỀ CỦA MỤC NÀY ĐÃ BỊ GỠ, NÊN PHẦN LẬP LUẬN DỰA VÀO NÓ HẾT
> ĐÚNG** (đúng khuôn ADR-019: *"một kết luận đúng có thể hết đúng mà không ai động vào nó, vì TIỀN
> ĐỀ của nó bị gỡ ở một phase khác"*). Mục này viện dẫn `APRON_EDGE` và lời hứa *"tấm đất phải phẳng
> đúng `−APRON_DROP` ở chỗ giáp rặng núi"*. **Cả hai đều không còn tồn tại** sau ADR-046: hằng số
> đổi tên thành `PLATE_PAD_CELLS`, và phép ép-về-phẳng (`settle`) đã bị **xoá hẳn** vì chính nó là
> một trong ba nguồn sinh ra cái bệ. Lời hứa THẬT với `horizon.js` không mất mà được phát biểu lại
> thành một QUAN HỆ — `horizon.heightAt` nay đọc thẳng `terrain.nenKho(...)` nên hai tấm khớp nhau
> **theo cấu tạo**, không cần bên nào phẳng. ⇒ **Câu *"lời hứa ấy chỉ ràng buộc `APRON_EDGE ≥
> APRON_CELLS`"* nay SAI theo cả hai chiều**: nó không còn ràng buộc gì cả, VÀ trên thực tế
> `APRON_CELLS` (7,5, thất thường tới 12,15) nay **lớn hơn hẳn** `PLATE_PAD_CELLS` (3,4) — tức dải
> hoà chạy vượt ra ngoài tấm lưới thành phố và tiếp tục trên tấm chân trời, đúng như phải thế.
>
> **Ba con số của mục này (21% khung · 35,1% đất trơ · 63,0% là vành ngoài) CHƯA ĐƯỢC ĐO LẠI** sau
> ADR-046, nên đừng trích chúng như số hiện hành. Chúng gần như chắc chắn đã đổi: vùng đất bao quanh
> nay **gợn liên tục thay vì phẳng tuyệt đối**, tức nó thôi là một mảng chết — nhưng "thôi là mảng
> chết" và "thôi trống" là hai chuyện khác nhau, và chỉ phép đo mới phân biệt được. Đo lại bằng
> `node scripts/city-preview.mjs --era N --sessions 80 --mask ...` rồi `scripts/*-score.mjs` trước
> khi mở bất kỳ phase nội dung nào dựa trên mục này. **Hướng Đàm đã chọn (LẤP, không thu nhỏ, không
> siết khung) KHÔNG đổi** — chỉ có mấy con số và tên hằng số là cũ.


- **Tên**: Vành đất ngoài lưới thành phố là vùng trống lớn nhất còn lại — và nó KHÔNG giảm khi Đàm chơi
- **Module**: `src/engine/city3d/terrain.js` (`APRON_CELLS`/`APRON_SPREAD`/`PLATE_PAD_CELLS` — tên cũ `APRON_EDGE`, đổi 2026-08-21) · `render3d/terrainMesh.js` · khung hình (`orbit.js`)
- **Priority**: High · **Severity**: Medium (mỹ thuật, không phải lỗi chạy)
- **Impact**: Ở mốc 80 phiên, trung bình 15 kỷ: **đất trơ chiếm 35,1% khung hình, và 63,0% chỗ trơ ấy
  là VÀNH NGOÀI** — phần mà `§2-C` (mảng phủ) lẫn `§2-B` (nhà dân) đều không đặt được thứ gì lên,
  vì cả hai chỉ mọc trong lưới 12×12. Tệ hơn: tỉ lệ ấy **TĂNG theo thời gian chơi** (48,9% ở 20
  phiên → 59,7% ở 50 → 63,0% ở 80), vì thành phố chỉ lấp được phần trong lưới. Càng chơi lâu, phần
  trống Đàm nhìn thấy càng là phần không ai chạm được.
- **Root Cause**: mặt đất là một tấm **VUÔNG 19×19** đơn vị thế giới (`u0 = −4` … `+15`, quy về thế
  giới là −9,5 … +9,5) trong khi lưới thành phố chỉ **12×12** ⇒ **60,1% diện tích tấm đất nằm ngoài
  lưới**. Bề rộng ấy đến từ `APRON_EDGE = 3,4` ô, và **con số đó CÓ lý do thật, vẫn còn đúng**: nó là
  một LỜI HỨA với `sceneGraph.js`/`horizon.js` — tấm đất phải **phẳng đúng `−APRON_DROP`** ở chỗ giáp
  rặng núi, nếu không sẽ có một đường răng cưa lộ gầm chạy vòng quanh thành phố (Phase 9A đã trả giá
  bằng hai cái nêm sáng chói ở hai góc dưới khung). ⚠️ NHƯNG lời hứa ấy chỉ ràng buộc **QUAN HỆ**
  `APRON_EDGE ≥ APRON_CELLS` (gợn sóng phải tắt hết trước mép), **không** ràng buộc giá trị 3,4.
- **Current Risk**: thấp — không có lỗi chạy, không có hồi quy. Chỉ là thành phố trông trống hơn
  công sức Đàm bỏ ra, và mọi phase nội dung tiếp theo đều sẽ đụng trần này.
- **Future Risk**: cao nếu KHÔNG ghi ra: phiên sau rất dễ tiêu thêm một ngân sách nữa vào tầng nội
  dung (thêm nhà, thêm cây, thêm mảng phủ) rồi đo ra "chỉ nhích vài phần trăm" — đúng hình dạng
  `TECH_DEBT #41` và bài học lùm cây Phase 8D.
- **Recommended Solution**: ⚠️ **ĐÂY LÀ QUYẾT ĐỊNH MỸ THUẬT CỦA ĐÀM, KHÔNG PHẢI CỦA AI** (ca 6 của
  §5). Ba phương án đã đo, xem báo cáo phiên 2026-08-19 và `PERFORMANCE.md`.
- **Estimated Complexity**: thu tấm đất = nhỏ (2 hằng số + đo lại) · lấp vành ngoài = lớn (một tầng
  nội dung mới, và phải KHÔNG thêm lệnh vẽ) · siết camera = nhỏ nhưng đụng `TECH_DEBT #24`.
- **Blocking Conditions**: chờ Đàm chọn hướng.
- **Review Trigger**: trước khi bắt đầu BẤT KỲ phase nội dung nào khác cho thành phố 3D — đọc mục
  này trước, vì nó nói ngay rằng trần của tầng nội dung là 37% chỗ trống, không phải 100%.
- **Owner**: Đàm đã quyết · **Status**: ⚠️ **ĐANG ĐÓNG DẦN — nửa "lấp vành" ĐÃ LÀM (2026-08-19,
  VIỆC 1), nửa "địa thế theo kỷ" còn lại ở VIỆC 2.**
- ⚠️ **ĐÀM ĐÃ CHỌN (2026-08-19), VÀ ANH BÁC CẢ HAI PHƯƠNG ÁN "THU NHỎ"**: không thu tấm đất, không
  siết khung hình — mà **LẤP**. Lý do anh nêu thẳng vào bản chất chứ không vào con số: *"Tại sao một
  thành phố lại được xây trên một ô đất nhô ra, đâu có thành phố nào như vậy… Nếu có ô đất nhô ra
  thì là cảnh thiên nhiên xung quanh."* Tức chẩn đoán "vành đất quá rộng" là **SAI ĐỀ**: vành ấy
  không rộng quá, nó chỉ **TRỐNG**. Thu nó lại là giấu triệu chứng và đồng thời làm thế giới nhỏ đi.
- ⚠️ **VÀ CHẨN ĐOÁN CŨ CỦA CHÍNH MỤC NÀY CŨNG SAI MỘT NỬA.** Mục này (và ba giả thuyết đi trước nó)
  đổ lỗi cho **MÉP tấm đất** — tường đứng ở `APRON_EDGE`, chỗ nối màu, vùng gần phẳng. Đo lại thì cả
  ba đều bị bác: cao độ hai bên mép khớp tới **0,0000**; bước màu lớn nhất qua 353 vị trí chỉ
  **1,1/255** (ngưỡng mắt 12); bản vá "gợn sóng gần" đổi 25,6% điểm ảnh nhưng **0 điểm ảnh** vượt
  ngưỡng mắt. Thứ chỉ ra sự thật là **phủ ranh giới các vùng lên chính ảnh render** rồi nhìn: KHÔNG
  có mép nào ở cả hai ranh giới. Cái khay chưa bao giờ là một cái MÉP — nó là **hình chữ nhật thành
  phố dừng đột ngột giữa một mặt phẳng trống trơn**. ⇒ Bài học: *"khi ba giả thuyết liên tiếp đều bị
  số đo bác bỏ, hãy nghi chính CÂU HỎI"*, và cách rẻ nhất để đổi câu hỏi là **vẽ thứ mình tin lên
  đúng tấm ảnh mình đang nhìn**.
- **Đã làm được gì (VIỆC 1, đo ở `--hour 12 --sessions 60`, khung mặc định)**: `deriveOutskirts`
  rải cây/bụi/đá RA NGOÀI lưới 12×12, mật độ tắt dần ra xa, giống loài lấy từ `floraStyle.js`.
  ĐẤT TRỐNG: kỷ 3 **65,63% → 60,64%** · kỷ 12 **64,82% → 38,61%** · kỷ 14 **64,15% → 52,44%**.
  Phần `trong lưới` gần như đứng yên (18,38→18,34 · 11,66→11,16 · 8,63→8,56) — bằng chứng trực tiếp
  rằng lưới thành phố KHÔNG bị đụng vào.
- **Còn lại gì**: vùng quê hiện là **một tấm thảm thực vật ĐỒNG NHẤT quanh mọi phía** — nó xoá cái
  khay nhưng chưa trả lời câu hỏi thứ hai của Đàm (*"nên có những kỷ có biển đi, nằm sát bờ biển
  chẳng hạn, như thành Troy"*). Đó là VIỆC 2: bảng `settingStyle.js` 15 kỷ (biển/sông/không nước).
- **Cách tái lập số**:
  `node scripts/city-preview.mjs --all --hour 12 --sessions <20|50|80> --mask ground-grid,ground-apron,horizon`
  rồi `--mask city,road,residents`, sau đó đếm bằng `scripts/mask-count.mjs`. Cờ `splitGroundMesh`
  (mặc định TẮT, có test khoá ở `sceneStats.test.js`) là thứ tách được hai vùng đất — **không** dò
  bằng màu, vì hai vùng dùng chung dải sắc độ (`TECH_DEBT #22`).

---

## #52 — Một ảnh nghiệm thu đã bị RÁCH NGANG và ta KHÔNG biết vì sao; nay có cổng chặn nhưng chưa có chẩn đoán

- **Module**: `scripts/city-preview.mjs` (`shoot`, `soiVetRach`, `chiaBang`).
- **Priority**: Medium · **Severity**: High (một tấm rách cho ra số liệu lệch vài điểm phần trăm mà
  không cổng nào kêu) · **Status**: Open (mở 2026-08-19 trong §2-C).
- **Impact**: `TRUOC-A-s20-ky09.png` báo đất trống **37,37%** trong khi sự thật là **41,61%** — sai
  4,24 điểm phần trăm trên đúng đại lượng đang dùng để nghiệm thu. Nếu tấm ấy không tình cờ bị hai
  mặt nạ khác nhau cãi nhau về cùng một đại lượng thì con số sai đã đi thẳng vào báo cáo, và cả một
  kết luận mỹ thuật đã dựa lên nó.
- **Root Cause**: **CHƯA BIẾT.** Lời giải thích đầu tiên — *"`shoot` chụp thành nhiều dải, một dải
  đến từ khung hình cũ"* — nghe rất xuôi và **đã bị chính số đo bác bỏ**: chỗ rách nằm ở **hàng
  441**, còn mốc chia dải của khung 1100×700 là **hàng 476**. Ảnh gốc đã bị ghi đè bằng bản dựng
  lại (md5 `5263956e…`) nên không truy được nữa. Các giả thuyết còn sống: Chromium trả về một khung
  hình đang vẽ dở; một lượt `Page.captureScreenshot` bắt gặp cảnh giữa hai lần rAF; hoặc một khối
  cảnh vật/mặt nạ được gắn muộn hơn một khung.
- **Current Risk**: THẤP-đã-chặn. `shoot` nay quét MỌI mép hàng bằng `soiVetRach` sau khi ghép,
  chụp lại tối đa 3 lượt, và **dừng hẳn chứ không ghi ảnh** nếu vẫn rách. Ngưỡng hiệu chuẩn bằng số
  đo thật (120 ảnh lành: mép lớn nhất 0,0582 · tỉ số lớn nhất 14,5× — đối chứng rách: 0,180/66× và
  0,361/132×), khoá bằng 4 bài ở `scripts/cityPreviewSource.test.js`, cả 7 phép phá đều đã thử-cho-đỏ.
- **Future Risk**: cổng chặn **triệu chứng**, không chữa **nguyên nhân**. Nếu tỉ lệ rách tăng (hôm
  nay ~1/120) thì mỗi ảnh phải chụp 2–3 lượt và bản quét 15 kỷ chậm gấp đôi; nếu một ngày nào đó
  nó rách theo chiều DỌC thì phép quét theo hàng mù hoàn toàn.
- **✅ ĐÃ LÀM (2026-08-19, Đàm chốt)**: **NHẬT KÝ MỖI LẦN KÍCH HOẠT.** Đàm: *"cổng chặn + chụp lại
  là đủ cho bây giờ vì nó biến một lỗi IM LẶNG thành một lỗi ỒN ÀO — đó là 90% giá trị. Nhưng thêm
  đúng một thứ rẻ: mỗi lần kích hoạt, ghi một dòng kèm kỷ/mốc/kích thước/số dải. Sau vài chục lần
  sẽ có mẫu, và lúc đó truy nguyên nhân là đọc bảng chứ không phải đoán."* ⇒ `dongNhatKyVetRach`
  (thuần) ghi 10 cột vào `.city-preview/vet-rach.log`, trong đó cột đáng giá nhất là
  **`trungMocDai`** — chính nó là thứ đã bác bỏ giả thuyết đầu tiên, nên nó phải có mặt trong mọi
  dòng. Ghi **TRƯỚC** khi ném lỗi (lượt cuối là lượt đáng ghi nhất) và **SAU** `if (!soi.hong)`
  (đừng ghi lượt lành). 3 bài test khoá, 4 phép phá đều đã thử-cho-đỏ.
- ⚠️ **GIỚI HẠN CỦA NHẬT KÝ, PHẢI NÓI THẲNG**: `.city-preview/` nằm trong `.gitignore`, mà phiên
  làm việc từ xa chạy trong một hộp cát **bị thu hồi sau khi xong**. Nghĩa là bảng này chỉ sống
  trong MỘT phiên. **Phiên nào thấy cổng kích hoạt thì PHẢI chép dòng ấy sang `BAN_GIAO.md`** —
  nếu không thì "sau vài chục lần sẽ có mẫu" không bao giờ tới được. Công cụ tự in ra lời nhắc này.
- **Recommended Solution**: (a) giữ một bản sao ảnh bị từ chối vào `.city-preview/rach/` để lần sau
  còn có vật chứng mà chẩn đoán — hôm nay không có, và đó chính là lý do mục này phải để ngỏ;
  (b) đo tỉ lệ rách thật bằng cách đếm số lượt chụp lại qua một lần quét đầy đủ; (c) nếu tỉ lệ đáng
  kể thì ép trang đứng yên (dừng vòng lặp hoạt hoạ) trước khi chụp thay vì chụp rồi kiểm.
- **Estimated Complexity**: (a) rất nhỏ · (b) nhỏ · (c) vừa.
- **Blocking Conditions**: không có — (a) làm được ngay, nhưng cố ý KHÔNG làm trong §2-C để không
  mở rộng phạm vi một task đang đo mật độ.
- ⚠️ **BÀI HỌC KÈM THEO, ĐÃ TRẢ GIÁ NGAY TRONG PHIÊN MỞ MỤC NÀY**: ngưỡng hiệu chuẩn trên **120 ảnh
  một-cảnh** rồi đem áp cho **bảng quét 15 kỷ** ⇒ kêu oan đúng **30 chỗ**, cách nhau đều 208 hàng =
  `CELL_H(186) + LABEL_H(22)` — đó là các **dải nhãn** mà chính trang xem thử vẽ ra. Một tấm bảng
  dán ảnh thì CÓ mép sắc lẹm, và có rất nhiều. Đúng hình dạng `TECH_DEBT #38`: một con số đo trên
  MỘT quần thể được đọc thành luật của CẢ TẬP. Cách chữa **không** phải nới ngưỡng (nới thì ảnh
  một-cảnh mất hết hàng rào) mà là **kể tên những hàng mà mép sắc lẹm là ĐÚNG THIẾT KẾ**
  (`hangCauTrucBangQuet`, suy từ CÙNG công thức bố cục của `sweepPageHtml`, tái lập đúng cả 30 hàng
  — có test đòi BẰNG NHAU chứ không "bao gồm", vì "bao gồm" là cách một bản vá thành cái chăn trùm).
- **Review Trigger** (Đàm chốt 2026-08-19, TƯỜNG MINH VÀ ĐẾM ĐƯỢC): **quá 5 lần kích hoạt thì DỪNG
  LẠI TRUY NGUYÊN NHÂN**, đừng chụp lại tiếp. Ngưỡng ấy là hằng số `NGUONG_TRUY_VET_RACH = 5` trong
  `city-preview.mjs`; công cụ **tự đếm số dòng nhật ký và tự in lời nhắc** khi chạm ngưỡng, có test
  khoá rằng hằng số ấy thật sự được ĐỌC. Một điều kiện xem lại chỉ nằm trong tài liệu thì phải có
  người đi tìm mới đọc được — một con số trong mã thì tự đòi được đọc.
- ⚠️ **2026-08-24 (Phase 20) — NGƯỠNG 5 ĐÃ CHẠM (7 lần), ĐÃ DỪNG TRUY, VÀ BẢNG NHẬT KÝ ĐÃ CHO RA
  MỘT MẪU ĐỌC ĐƯỢC.** Đúng thứ Đàm đặt nhật ký ra để có. Bảy dòng (đã chép sang `BAN_GIAO.md` theo
  đúng luật ở gạch đầu dòng trên) chia làm **hai nhóm rạch ròi**:

  | nhóm | ảnh | `trungMocDai` | hàng bị kêu | lặp giữa các lượt |
  |---|---|---|---|---|
  | 1 dòng | `s40`, khung thường | **1/1** — TRÙNG mốc dải | 476 | — |
  | 6 dòng | **toàn bộ là `--topdown`** | **0/N** — không trùng mốc dải nào | 317,331 · 314 · 202,396 | **y hệt ở cả 3 lượt độc lập** |

  ⇒ **Cổng có một kiểu BÁO OAN CÓ HỆ THỐNG trên ảnh nhìn-từ-trên-xuống**, và nguyên nhân là hình
  học chứ không phải ngẫu nhiên: nhìn thẳng từ trên xuống thì một con đường thẳng chiếu ra thành
  một mép NGANG SẮC LẸM CHẠY HẾT BỀ NGANG khung — đúng bằng chữ ký mà cổng đi tìm. Đây là `#38`
  lặp lại lần nữa (*một con số đo trên MỘT quần thể được đọc thành luật của CẢ TẬP*): ngưỡng hiệu
  chuẩn trên ảnh khung nghiêng, rồi đem áp cho một góc camera chưa hề tồn tại lúc hiệu chuẩn.
- ✅ **ĐÃ VÁ, VÀ KHÔNG BẰNG MỘT NGƯỠNG THỨ TƯ**: cổng nay so **CHỮ KÝ** của lần kêu trước (`hàng` +
  `bước`, làm tròn 4 chữ số). Vết rách là một cuộc đua nên nó **không thể** rơi đúng cùng một hàng
  với cùng một bước ở hai lượt chụp độc lập; một mép NỘI DUNG thì lặp lại y hệt mãi mãi. Trùng chữ
  ký ⇒ nhận ảnh và ghi một dòng `ℹ️` ra stderr. **Không có tham số nào để vặn**, nên nó không thể
  bị nới dần cho tiện (phễu Phase 9A) — và nó áp cho MỌI khung hình, không riêng `--topdown`.
  ⚠️ Nó **không** thay cổng cũ: dòng nhóm 1 (`trungMocDai=1/1`, hàng 476 = đúng mốc dải) vẫn bị
  chặn và chụp lại như trước, vì nó KHÔNG lặp chữ ký.
- **Owner**: chưa phân công · **Status**: Open — cổng đã bớt kêu oan, **nguyên nhân vết rách thật
  vẫn chưa truy được** (mới 1 mẫu thật trong phiên này; cần vài chục dòng nữa mới thành mẫu)

---

## #51 — Bộ vẽ 2D CHƯA BAO GIỜ vẽ nhà dân, nên hai bộ vẽ khác nhau về NỘI DUNG chứ không chỉ độ đẹp

- **Module**: `src/components/city/render2d/CityCanvas2D.jsx` (mảng `risen`), đối chiếu
  `src/engine/city3d/cityParts.js` (bộ 3D).
- **Priority**: Medium · **Severity**: Medium · **Status**: Open (phát hiện 2026-08-19 trong §2-C,
  **có TRƯỚC phase này** — không phải nợ do §2-C sinh ra).
- **Impact**: đo 2026-08-19, trung bình 15 kỷ mỗi thành phố: **10,0 nhà dân ở 20 phiên · 23,3 ở 50
  phiên · 24,7 ở 80 phiên** — bộ 2D không vẽ một căn nào. Ở mốc 80 phiên, **24,7 trong tổng 29,7
  công trình (83%)** biến mất khi Đàm rơi về bản 2D, và thành phố tụt về đúng 5 công trình như
  trước Phase 7C.
- **Root Cause**: Phase 7C thêm `layout.dwellings` như một MẢNG RIÊNG (không nhập vào
  `layout.buildings`), và chỉ nối vào bộ 3D. `CityCanvas2D.jsx` dựng `risen` bằng cách liệt kê tay
  ba nguồn (`buildings` · `props` lọc bỏ đường · `scaffolds`) — thêm nguồn thứ tư thì phải sửa
  chỗ này, mà không có gì nhắc. Đúng hình dạng *"một luật được phát biểu lại ở nhiều nơi"* đã cắn
  ở Phase 4D và Phase 7B, chỉ khác là ở đây chỗ quên nằm trong một bộ vẽ ít ai mở.
- **Current Risk**: THẤP hôm nay — bộ 2D là đường lui, và cổng hiệu năng 3D đang ĐẠT nên hầu như
  không ai thấy nó. Nhưng chính điều đó làm nó im lặng: nó chỉ hiện ra đúng lúc 3D hỏng, tức đúng
  lúc không ai muốn gặp thêm bất ngờ.
- **Future Risk**: TRUNG BÌNH. `CityCanvas2D.jsx` tự tuyên bố luật *"Hai bộ vẽ được phép khác nhau
  về ĐỘ ĐẸP, không được khác nhau về NỘI DUNG"* — một chú thích đang nói dối, và đó chính là loại
  câu mà phiên sau kế thừa rồi dựa vào (bài học Phase 4D).
- **Recommended Solution**: nối `layout.dwellings` vào `risen` (một dòng, cùng khuôn `scaffolds`),
  rồi khoá bằng một bài test **đọc mã nguồn** đòi mọi mảng mà `computeCityLayout` trả về đều có
  mặt ở CẢ HAI bộ vẽ — canh QUAN HỆ chứ không canh danh sách viết tay, nếu không mảng thứ sáu
  thêm sau này lại lọt y hệt.
- **Estimated Complexity**: Nhỏ (~10 dòng mã + ~25 dòng test) — nhưng đụng `render2d/`, **nằm
  ngoài phạm vi file của chương trình hiện tại (§3)**, nên ghi lại chứ không sửa.
- **Blocking Conditions**: không có.
- **Review Trigger**: lần kế tiếp có ai đụng vào `render2d/`, hoặc lần kế tiếp cổng 3D trượt và bộ
  2D được bật thật.
- **Owner**: chưa phân công.

---

## #50 — `md5sum` của ảnh dựng KHÔNG ổn định khi máy bận, nên nó chỉ chứng minh được MỘT chiều

- **Module**: mọi phép nghiệm thu bằng ảnh (`scripts/city-preview.mjs` → `md5sum`), và luật nghiệm
  thu trong `CLAUDE.md` / các lời hứa "trùng từng byte" ở `ARCHITECTURE_DECISIONS.md` (ADR-034),
  `CHANGELOG.md`, `BAN_GIAO.md`.
- **Priority**: Medium · **Severity**: Low (không có gì SAI hôm nay; rủi ro là kết luận nhầm sau này)
- **Impact**: đo 2026-08-19 — **cùng một lệnh, cùng một cây mã**, chỉ khác tải máy:
  máy rảnh 5 lượt liên tiếp ra `2ad06f97…`; bật 4 vòng lặp bận trên máy 4 nhân thì ra
  `28992bba…`; hết tải quay lại `2ad06f97…`. Chênh lệch **±1 trên một kênh, ~2% điểm ảnh** —
  SwiftShader chia ô rasterise theo số luồng dùng được nên tải máy đổi thì đường làm tròn đổi.
- **Root Cause**: `md5sum` là phép so BYTE, mà thứ ta muốn hỏi là "ảnh có đổi không" — hai câu khác
  nhau. Chúng trùng nhau chừng nào bộ dựng còn tất định TUYỆT ĐỐI; nó không tất định tuyệt đối.
- **Current Risk**: THẤP. Chiều đang được dùng vẫn đúng: **trùng md5 ⇒ ảnh y hệt** (ADR-034 và
  `CHANGELOG` VIỆC 2 dựa vào đúng chiều này, nên chúng vẫn đứng vững), và luật nghiệm thu *"từ chối
  nếu cặp trước/sau TRÙNG byte"* cũng vẫn đúng — nó bắt lỗi chép nhầm/đặt sai tên.
- **Future Risk**: TRUNG BÌNH và im lặng. Ai đó chạy lại phép chứng minh của ADR-034 trên một máy
  đang bận sẽ thấy md5 lệch và kết luận **có hồi quy trong khi không có** — đúng loại báo động giả
  đã cắn ở Phase 9D (`road-score.mjs`). Ngược lại, một người muốn chứng minh "không đổi" có thể bị
  cám dỗ chạy đi chạy lại tới khi md5 khớp.
- **Recommended Solution**: đừng dùng md5 làm phép đo mỹ thuật. Muốn chứng minh **KHÔNG đổi** thì
  (a) chụp hai lượt LIỀN NHAU trên máy rảnh, và (b) nếu md5 lệch thì **đo chênh lệch điểm ảnh rồi
  so với ngưỡng mắt 12/255** (±1 thấp hơn ngưỡng ấy 12 lần ⇒ không đổi được kết luận nào).
  Cách đóng triệt để: một công cụ `anh-bang-nhau.mjs` trả lời "lệch tối đa bao nhiêu" thay vì
  "giống/khác", để không ai phải tự nhớ luật này.
- **Estimated Complexity**: Nhỏ (~40 dòng, tái dùng `decodePng`) — nhưng chưa cấp bách.
- **Blocking Conditions**: không có.
- **Review Trigger**: lần kế tiếp có một lời hứa "trùng từng byte" cần chứng minh, hoặc lần kế tiếp
  một phép so ảnh trước/sau cho kết quả khó hiểu.
- **Owner**: chưa phân công · **Status**: Open (đã ghi đầy đủ số đo vào `PERFORMANCE.md`).

---

## #49 — `city-preview.mjs` xén mất 23 dòng cuối của MỌI ảnh đơn, và không có gì nói ra

- **Module**: `scripts/city-preview.mjs` (hàm `shoot`, cờ `--window-size`)
- **Priority**: Medium · **Severity**: Low-Medium
- **Impact**: `--width 1100 --height 700` dựng canvas đúng 1100×700, nhưng **khung nhìn thật chỉ
  cao 693** (đo 2026-08-19 bằng chính trang xem thử: `khung nhìn: 1134x693`). Canvas đặt ở
  `y = 16`, nên **23 dòng cuối của khung hình chưa bao giờ được vẽ ra**; ảnh PNG vẫn cao 780 vì
  Chromium chụp vượt khung nhìn rồi phủ nốt bằng nền trang. Nói cách khác: mọi ảnh đơn từ trước
  tới nay là một khung hình **1100×677** mang tên 1100×700, cộng một dải nền trang cao 87 dòng.
- **Root Cause**: `--window-size=${width + 34},${height + 80}` — con số `+80` là một ước lượng cho
  phần khung cửa sổ, và nó THIẾU 23 điểm ảnh trong hộp cát này. Không ai từng đặt nó cạnh sự thật,
  vì trang xem thử không in ra `window.innerHeight` (đúng bài học đã ghi cho `shot.mjs`: *"luôn in
  kèm `window.innerWidth` thật, nếu không mọi kết luận về bố cục đều dựa trên một bề ngang bịa"* —
  bài học ấy có sẵn, chỉ là chưa được áp cho công cụ này).
- **Current Risk**: THẤP cho việc so ảnh trước/sau (cả hai vế cùng bị xén y hệt) và cho bản quét 15
  kỷ (đường đi khác, dùng `sweepPageHtml`). CAO cho bất kỳ phép đo nào tin vào con số KHAI: bản đầu
  của phép đo mật độ đã khai canvas cao 700 rồi cắt theo, và 23 dòng chênh ấy lọt thẳng vào mẫu số.
- **Future Risk**: một kết luận mỹ thuật về **mép dưới khung hình** (mặt đường gần nhất, bóng đổ
  chân tường, bệ kè) sẽ nói về một vùng ảnh KHÔNG tồn tại. Và bất cứ ai đọc `--height 700` rồi suy
  ra tỉ lệ khung 1100:700 = 1,571 đều sai — tỉ lệ THẬT trên màn hình là 1100:677 = 1,625, trong khi
  camera vẫn dựng theo 1,571 (`tỉ lệ camera: 1.5714`), tức ảnh đang bị **kéo dãn dọc nhẹ**.
- **Recommended Solution**: nới `+80` thành một số đủ (đo được: cần ≥ +103), HOẶC bỏ hẳn cách đoán
  bằng cách chụp qua CDP `Page.captureScreenshot` với `clip` đúng hộp bao canvas. Kèm một cổng tự
  kiểm: trang PHẢI in `window.innerHeight` và script PHẢI đỏ nếu `innerHeight < pad + height`.
- **Estimated Complexity**: Nhỏ (một dòng + một cổng kiểm) — nhưng xem Blocking Conditions.
- **Blocking Conditions**: sửa xong thì **MỌI ảnh tham chiếu đổi kích thước**, nên mọi con số
  nghiệm thu đã đo bằng ảnh 1134×780 (kể cả các phép `md5sum` byte-identical dùng trong phiên này)
  sẽ không tái lập được. Phải làm thành một bước riêng, đo lại mốc nền, chứ không kèm vào một phase
  mỹ thuật — đúng bài học `TECH_DEBT #43` (*mỗi phase phải tự đo lại mốc nền của mình*).
- **Review Trigger**: trước phase kế tiếp có kết luận về mép dưới khung hình, hoặc trước lần đo
  nghiệm thu nào phải khai toạ độ canvas.
- **Owner**: — · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-19.**
  - **Đã làm gì**: bỏ hẳn BA cờ ĐOÁN (`--window-size`, `--screenshot`, `--virtual-time-budget`).
    Nay đặt khung nhìn bằng CDP `Emulation.setDeviceMetricsOverride`, **hỏi** trình duyệt canvas
    nằm đâu (`getBoundingClientRect`), rồi chụp `Page.captureScreenshot` với `clip` đúng hộp bao
    đó. **Không nới `+80` thành `+103`** — đó là thay một con số đoán bằng một con số đoán khác, và
    nó sẽ trôi lại ngay khi ai đó đổi bố cục trang, thanh cuộn, hay chạy ở DPR khác.
  - **Cổng chặn**: `kiemKhungNhin` (thuần, xuất ra, có `--selftest`) TỪ CHỐI chạy nếu hộp bao thò
    ra ngoài khung nhìn, và đối chứng của nó **nhốt đúng ca 23 dòng bị xén** (1134×693) — bắt cả
    chiều ngang lẫn chiều dọc, và không tha một mẩu thò 0,4 điểm ảnh.
  - **Đối chứng thứ hai, nằm ở đầu bên kia**: ảnh nay đúng bằng khung hình nên `mask-count.mjs`
    phải đếm được **0 điểm màu mốc `rgb(1,2,3)`**. Khác 0 là `clip` trượt, và công cụ in số đó ra.
  - **Kết quả đo**: ảnh ra **1100×700** (trước: 1134×780 với 23 dòng canvas không tồn tại), hồ sơ
    hình học ghi hộp ĐO ĐƯỢC `doX:16 doY:16 doW:1100 doH:700` trong khung nhìn `1196×940`,
    `pad: 0`.
  - ⚠️ **Vá xong thì đụng ngay một cái trần khác** — ổ cắm CDP chỉ cho **4 MiB một tin nhắn**, nên
    bản quét 15 kỷ (~9 MB base64) chết với đúng một dòng "ổ cắm CDP lỗi". Đã đo chính xác cái trần
    rồi chụp thành **dải ngang** và ghép ở phía Node. Xem `PERFORMANCE.md` mục *"Vá xong cái xén
    thì đụng ngay cái trần"*, và **`#50`** cho hệ quả về `md5sum`.
  - **Mốc nền cũ**: KHÔNG so trực tiếp được với số mới — đã ghi thành một mục riêng trong
    `PERFORMANCE.md`, đúng cách `#22` xử lý bộ lọc "8% mái".

---

## #48 — Chi tiết Phase 10–11 nằm DƯỚI ngưỡng mắt ở 11/15 kỷ, **kể cả ở khoảng cách cận cảnh lý tưởng**

- **Module**: `src/engine/city3d/groundFloorStyle.js` + `roofStyle.js` (bảng) · `rooftop.js` +
  `groundFloor.js` (hình) — KHÔNG phải `cityFocus.js`
- **Priority**: Medium · **Severity**: Medium
- **Impact**: chế độ cận cảnh (ADR-034) được ship kèm một con số chứng minh: *"lệch trung bình
  15,45 — TRÊN ngưỡng mắt 12"*. Con số ấy đo ở **đúng một kỷ (kỷ 9)**. Đo lần đầu đủ 15 kỷ
  (2026-08-18, cùng một dòng lệnh, `b98a47d` → `e95cdf1`, khung 1134×780):

  | kỷ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
  | lệch TB | **0,71** | 4,56 | 5,03 | 8,17 | 3,72 | 3,19 | **15,52** | 11,19 | **15,45** | 8,85 | **12,61** | 5,81 | **12,20** | 4,48 | 3,02 |

  Chỉ **4/15 kỷ** trên ngưỡng. Kỷ 1 gần như KHÔNG đổi gì (0,71 — chỉ 0,9% điểm ảnh).
- **Root Cause**: KHÔNG phải camera, và đây là điểm dễ kết luận nhầm nhất. Đối chứng: đo lại 8 kỷ
  có lùi ra, ở **khoảng cách lý tưởng 7,5** (tức không lùi chút nào) — chênh lệch so với ca xấu
  nhất chỉ **−0,72 … +2,14**, và **không kỷ nào đổi phía so với ngưỡng**. Tức camera đã làm hết
  phần việc của nó; thứ thiếu là **thứ để mà nhìn**. Hai nguyên nhân thật, cả hai đã có tên sẵn
  trong `#41`: (a) Phase 10–11 thêm rất ÍT vào một số kỷ (kỷ 1 là lều da thú: +9,1% tam giác, và
  tầng trệt của nó chỉ là một cửa lều); (b) thứ được thêm ở nhiều kỷ là **BỀ MẶT** chứ không phải
  **ĐƯỜNG VIỀN** — kỷ 8 tốn nhiều hình học nhất bảng (+48,5%, ngói bò) mà chỉ ra 11,19.
  Đối chiếu: 4 kỷ đạt đều là kỷ có chi tiết phá đường viền (lan can kỷ 7, cửa sổ mái kỷ 9).
- **Current Risk**: thấp về kỹ thuật (không hỏng gì, không lệnh vẽ mới). Trung bình về giá trị:
  Đàm bay tới ngắm gần một khu phố ở 11/15 kỷ và thấy gần như y hệt trước Phase 10.
- **Future Risk**: trung bình. Đây đúng là cái bẫy `#41` cảnh báo — nếu Phase 13 lại thêm chi tiết
  bề mặt lên cùng những kỷ ấy thì kết quả sẽ lặp lại với một ngân sách nữa.
- **Recommended Solution**: theo đúng LUẬT MỚI ở `#41` — chọn kỷ theo con số trong bảng trên, và
  chỉ thêm thứ **đổi đường viền**: `crown`/`dormer` cho những kỷ đang chỉ có `stack`, hoặc một đặc
  trưng tầng trệt nhô ra khỏi mặt tường (mái hiên, cột hiên, bậc thềm rộng). ⚠️ **KHÔNG** phóng to
  đều mọi thứ — bẫy "cây nấm" (Phase 7C) và bẫy `MIN_STONE` (Phase 9D). ⚠️ Và với kỷ 1–2 phải hỏi
  trước: một túp lều da thú **có nên** có nhiều chi tiết không, hay sự đơn sơ mới đúng?
- **Estimated Complexity**: Trung bình — sửa bảng thì rẻ, nhưng phải chụp + đo lại 15 kỷ mỗi vòng
  (~12 phút/vòng) và mỗi giá trị mới phải trả lời được *"công trình có thật nào ở nước ấy trông
  như vậy?"*.
- **Blocking Conditions**: ⛔ **CHỜ ĐÀM QUYẾT** — mục 5 ca 6 (quyết định mỹ thuật). Cụ thể: có
  đáng tiêu một phase nữa để kéo 11 kỷ kia lên trên ngưỡng không, hay chấp nhận rằng **những kỷ
  đơn sơ thì vốn dĩ đơn sơ** và chuyển ngân sách sang chỗ khác (mật độ nhà — xem báo cáo cùng
  ngày)?
- **Review Trigger**: trước khi bắt đầu bất kỳ phase nào thêm chi tiết lên nhà.
- **Owner**: chờ Đàm · **Status**: 🟡 MỞ — đã đo đủ 15 kỷ, đã có đối chứng loại trừ camera

---

## #47 — Chế độ cận cảnh khoá KHOẢNG CÁCH, nên một công trình RỘNG BẤT THƯỜNG sẽ bị cắt hai đầu

- **Module**: `src/engine/city3d/cityFocus.js` (`FOCUS_VIEW_DISTANCE`)
- **Priority**: Low · **Severity**: Low
- **Impact**: chưa có. Hôm nay **không có kỷ nào** dính — công trình rộng nhất trong 15 kỷ vẫn nằm
  gọn trong khung ở khoảng cách 7,5.
- **Root Cause**: ADR-034 khoá **khoảng cách thật** (7,5) thay vì khoá "công trình chiếm bao nhiêu
  phần khung", và đó là lựa chọn ĐÚNG vì nó giữ được lời hứa *"một cái ống khói ở kỷ 1 và ở kỷ 15
  chiếm bằng nhau số điểm ảnh"*. Nhưng khoá khoảng cách là một luật về **CHIỀU SÂU**, mà thứ quyết
  định "có lọt khung không" là **BỀ NGANG**. Hai đại lượng ấy hôm nay đi cùng nhau chỉ vì mọi công
  trình đều cao-hơn-rộng; ngày nào có một công trình bè ngang (một cây cầu, một bức tường thành
  dài, một sân vận động) thì chúng tách ra, và cận cảnh sẽ cắt mất hai đầu.
- **Current Risk**: bằng không — **cố ý ghi ra một mục nợ cho một thứ CHƯA hỏng**, vì cố vấn kỹ
  thuật chỉ đúng một điều: cách hỏng duy nhất còn lại của việc khoá khoảng cách là ca này, và nó
  sẽ đến im lặng (không có gì đỏ lên, chỉ là một tấm ảnh bị cắt).
- **Future Risk**: thấp hôm nay, trung bình khi có công trình bè ngang.
- **Recommended Solution**: ⚠️ **ĐỪNG SỬA BÂY GIỜ** (Đàm chốt 2026-08-18). Sửa trước khi có ca
  hỏng là tự đặt một ngưỡng chưa hiệu chuẩn — đúng cái phễu Phase 9A. Khi ca ấy tới thì cách đúng
  là **giữ khoá khoảng cách làm mặc định và thêm một phép nới CHỈ khi bề ngang vượt khung**, chứ
  không đổi sang khoá theo bề ngang cho mọi công trình (làm vậy là mất lời hứa gốc ở 15/15 kỷ để
  chữa cho 1 kỷ).
- **Estimated Complexity**: Thấp.
- **Blocking Conditions**: không — chờ điều kiện xem lại.
- **Review Trigger**: ⚠️ **ĐIỀU KIỆN TƯỜNG MINH** — khi một công trình có bề ngang (`w` sau
  `BUILDING_SCALE`) vượt **quá chiều cao của chính nó**, hoặc khi thêm một loại công trình mới
  thuộc nhóm cầu/tường thành/sân vận động. Hai điều kiện ấy đếm được, không phải "khi nào thấy
  kỳ kỳ".
- **Owner**: chưa ai · **Status**: 🟡 MỞ — cố ý, làm cái hẹn cho một ca chưa xảy ra

---

## #46 — ✅ ĐÃ ĐÓNG (2026-08-18, ADR-035) — Chế độ cận cảnh ở những kỷ CAO ngả thành nhìn-từ-trên-xuống: kỷ 15 ngẩng 65,3°, tầng trệt gần như biến mất

- **Module**: `src/engine/city3d/cityFocus.js` (thứ tự chữa trong `planCityFocus`)
- **Priority**: Medium · **Severity**: Low
- **Impact**: chế độ cận cảnh sinh ra để Đàm NHÌN THẤY công sức của Phase 10 (tầng trệt: cửa ra
  vào, cửa lùa, bức bàn) và Phase 11 (mái). Ở những kỷ thấp nó làm được cả hai. Ở kỷ 15 (Dubai —
  thành phố cao nhất) lưới an toàn phải ngẩng camera lên **65,3°**, và ở góc ấy màn hình gần như
  chỉ còn MÁI: tường bị chính mái che, nên đúng nửa số chi tiết mới không tới được mắt. Ảnh nghiệm
  thu `.city-preview/city-era15-light-h12-focus1.png` cho thấy rõ.
- **Root Cause**: `planCityFocus` chữa va chạm theo thứ tự **ngẩng trước → lùi sau**, chọn vì
  "ngẩng giữ nguyên độ lớn của vật, lùi thì làm vật nhỏ đi". Lý lẽ ấy đúng về mặt số điểm ảnh và
  **bỏ sót một chiều khác**: ngẩng quá cao thì vật vẫn to nhưng ta không còn nhìn thấy MẶT ĐỨNG
  của nó nữa. Đo 1200 chuyến bay: 0 chuyến phải lùi, tức thứ tự này khiến cách chữa thứ hai **chưa
  bao giờ được dùng** — cái giá dồn hết vào góc nhìn.
- **Current Risk**: thấp — không sai chức năng, camera vẫn thoáng (1,06 ô ở kỷ 15, trên mức tối
  thiểu 1 ô), và 14/15 kỷ có góc dễ nhìn (34,4°–45°).
- **Future Risk**: trung bình. Kỷ mới cao hơn nữa sẽ đẩy góc lên sát trần `MAX_PITCH` (85,4°) —
  lúc đó cận cảnh thành ảnh chụp từ trực thăng, và **không có gì đỏ lên** vì mọi bài test hiện có
  chỉ đòi "thoáng", không đòi "còn nhìn thấy mặt đứng".
- **Recommended Solution**: một trong hai, **Đàm chọn** (đây là quyết định MỸ THUẬT, không phải kỹ
  thuật): (a) **đổi thứ tự** — lùi ra trước, ngẩng sau; vật nhỏ đi nhưng giữ được góc nhìn ngang,
  và ngân sách lùi có sẵn vì chưa dùng bao giờ. (b) **đặt trần góc ngẩng riêng cho chế độ cận
  cảnh** (ví dụ 50°), vượt trần thì chuyển sang lùi. Cách nào cũng phải đo lại đủ 1200 chuyến +
  chụp lại ảnh kỷ 15.
- **Estimated Complexity**: Thấp (một khối trong `planCityFocus` + đo lại).
- **Blocking Conditions**: cần Đàm chọn hướng — xem ảnh kỷ 15 rồi quyết "thà nhỏ hơn mà thấy mặt
  tiền" hay "thà to mà nhìn từ trên xuống".
- **Review Trigger**: khi thêm kỷ mới cao hơn kỷ 15, hoặc khi Đàm nói cận cảnh ở kỷ cao khó nhìn.
- **Owner**: đã xong · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-18** — Đàm chọn **(a) đổi thứ tự**, xem
  ADR-035.

### Đã đóng thế nào, và cái giá thật là bao nhiêu

`planCityFocus` nay chữa theo thứ tự **lùi ra (giữ nguyên góc) → ngẩng lên → đứng yên**.

| Đo lại sau khi đổi | Trước (ngẩng trước) | Sau (lùi trước) |
|---|--:|--:|
| góc ngẩng kỷ 15, ca thật của app | 65,3° | **34,4°** |
| số chuyến phải NGẨNG (75 chuyến ca thật) | 8 | **0** |
| số chuyến phải NGẨNG (1200 chuyến, 4 góc xuất phát) | 109 | **0** |
| số chuyến bị kẹt cứng | 0 | **0** |
| chỗ phải lùi xa nhất | — | 11,00 (kỷ 15) |
| tỉ lệ thu phóng tệ nhất | — | 0,664 (kỷ 11) |

⚠️ **Giá phải trả, nói thẳng**: 3 kỷ (11 · 14 · 15) nay có ca xấu nhất nằm **ngoài dải thu phóng
0,38–0,58** mà Đàm chốt ở ADR-034 — lần lượt 0,664 · 0,623 · 0,579. Dải ấy là một lời hứa về
*"công trình chiếm bao nhiêu khung hình"*, và ở ca phải lùi thì nó không giữ được. Đổi lại, lời hứa
*"còn nhìn thấy mặt đứng"* thì giữ được ở **15/15 kỷ**.

⚠️ **Và điều quan trọng nhất, đo bằng đối chứng chứ không suy luận**: việc lùi ra **KHÔNG làm mất
chi tiết**. Đo cùng một kỷ ở khoảng cách lý tưởng 7,5 rồi ở ca xấu nhất của nó, lệch trung bình cả
khung thay đổi trong khoảng **−0,72 … +2,14** — có kỷ còn TĂNG, vì lùi ra thì lọt vào khung nhiều
nhà hơn. **Không một kỷ nào tụt qua ngưỡng mắt vì lùi ra.** Đây chính là điều kiện Đàm đặt ra
(*"nếu một kỷ nào tụt xuống dưới 12 thì DỪNG và báo"*): số kỷ TỤT vì bản vá này là **0**.
⚠️ Nhưng phép đo ấy lôi ra một sự thật KHÁC và lớn hơn, không liên quan gì tới thứ tự chữa — xem
**#48**.

---

## #45 — 5/2160 chỗ bờ đất bên lề đường dốc hơn MỘT bậc thềm (giá phải trả của việc san đường)

- **Module**: `src/engine/city3d/terrain.js` (lượt 3 — SAN ĐƯỜNG) ↔ `src/engine/city3d/terrain.test.js`
- **Priority**: Low · **Severity**: Low
- **Impact**: sau khi đường được san thành dốc thoải (ADR-032), cao độ ô đường **không còn** là bội
  số nguyên của một bậc thềm. Ở hầu hết chỗ, phép trung-vị-ba giữ được cả hai lời hứa cùng lúc
  (phố không dốc quá Baldwin Street **và** bờ đất bên lề không dốc quá 1:1). Nhưng có **5 chỗ trên
  2160** (4 ở kỷ 5, 1 ở kỷ 7) mà hai lời hứa ấy **về mặt hình học không thể cùng đạt**: đường buộc
  phải đi qua giữa hai thềm cách nhau nhiều bậc trong một ô. Ở 5 chỗ đó **phố thắng, bờ đất chịu
  giá** — bờ dốc hơn một bậc thềm.
- **Root Cause**: bài toán bị ràng buộc quá chặt ở một số ô: mạng đường là hằng số (cột/hàng thứ 4),
  còn thềm bậc thì sinh từ trường nhiễu của từng kỷ. Có kỷ mà một ô đường rơi đúng vào chỗ trường
  nhiễu nhảy hai bậc liền. Không có phép làm mượt nào tránh được điều đó mà không phá một trong hai
  trần (phố hoặc bờ) — đây là ràng buộc, không phải sai số cần tinh chỉnh.
- **Current Risk**: rất thấp. Bờ đất dốc là thứ **có thật ngoài đời** (kè, ta-luy) và đã có `bệ kè`
  (`groundPlacement` trong `sceneGraph.js`) dựng khối đá che phần hụt, nên nó đọc ra như một bờ kè
  chứ không như một lỗi. 5/2160 = 0,2%.
- **Future Risk**: thấp, nhưng **sẽ tăng nếu có ai nâng `relief` hoặc `terraces` của một kỷ** — càng
  nhiều bậc trên cùng một quãng thì càng nhiều ô rơi vào ca không thể. Đã chặn bằng
  `assert.ok(soCho <= 5)` trong `terrain.test.js` (bài *SAN ĐƯỜNG KHÔNG ĐƯỢC ĐẨY ĐỘ DỐC SANG NGANG*)
  — con số 5 là **số đo hôm nay**, không phải một ngưỡng chọn tay, nên nó tự đỏ ngay khi có chỗ thứ
  sáu.
- **Recommended Solution**: nếu muốn về 0 thì phải cho ranh thềm **né** ô đường ở tầng sinh trường
  nhiễu (dịch mắt lưới sao cho ranh rơi vào giữa khối đất), tức đổi cách sinh địa hình chứ không
  phải thêm một lượt làm mượt nữa. ⚠️ **Đừng nới `assert.ok(soCho <= 5)`** — nới là mua một con số
  đẹp bằng cách bỏ phép đo, đúng thứ §4 cấm.
- **Estimated Complexity**: Trung bình (đổi tầng sinh trường nhiễu ⇒ đổi hình 15 kỷ ⇒ phải quét lại).
- **Blocking Conditions**: không có.
- **Review Trigger**: khi bài *SAN ĐƯỜNG KHÔNG ĐƯỢC ĐẨY ĐỘ DỐC SANG NGANG* đỏ, hoặc khi có phase
  chỉnh `relief`/`terraces` của bất kỳ kỷ nào.
- **Owner**: chưa phân công · **Status**: Open

---

## #44 — ✅ ĐÃ ĐÓNG (2026-08-18) — KHÔNG PHẢI NỢ, LÀ LỰA CHỌN: kỷ 4 là kinh thành trên đồng bằng

- **Module**: `src/engine/city3d/terrain.js` (bảng `ERA_TERRAIN`) ↔ `src/engine/city3d/terrain.test.js`
- **Priority**: Low · **Severity**: Low
- **Impact**: bài `kỷ khai TỪ 3 BẬC TRỞ LÊN thì không bậc nào được chiếm quá 60% số ô` là thứ canh
  bài học Phase 7B (*phân bố một trường nhiễu trên lưới nhỏ không tuân luật số lớn*). Kỷ 4 hiện ở
  **64%** — tức trường nhiễu của kỷ ấy vẫn dồn cục, và người chơi thấy một mảng phẳng chiếm gần hai
  phần ba thành phố thay vì ba thềm rõ rệt.
- **Root Cause**: ⚠️ **đây KHÔNG phải hồi quy do việc san đường.** Đo lại trên cây git ở `be261ef`
  (trước khi san) thì kỷ 4 **đã là 64%**. Bài test cũ xanh chỉ vì nó đếm **cả ô đường**: 80 ô đường
  trên 144 ô (56% lưới) nằm rải đều mọi bậc, nên chúng pha loãng phép đếm xuống dưới 60%. Sau khi
  tách ô đất ra đo riêng — việc bắt buộc, vì ô đường nay không còn là bội số của bậc thềm — con số
  thật lộ ra. Đúng hình dạng `TECH_DEBT #22`: **trung bình trên vùng quá rộng làm loãng tín hiệu.**
- **Current Risk**: thấp. Một kỷ hơi phẳng là chuyện mỹ thuật, không phải lỗi chạy; và 14/15 kỷ còn
  lại vẫn đạt.
- **Future Risk**: trung bình nếu bị bỏ quên — cách rẻ nhất để "sửa" là nới ngưỡng 60% lên 65%, và
  lúc ấy phép đo mất răng cho **cả 15 kỷ**. Đã chặn bằng cách ghi ngoại lệ ra **tường minh đếm
  được**: `assert.deepEqual(TRUOT, [4])` — kỷ thứ hai trượt thì đỏ ngay, mà kỷ 4 được sửa xong cũng
  đỏ (buộc phải xoá tên khỏi danh sách).
- **Recommended Solution**: chỉnh `noiseScale`/`shape` của riêng kỷ 4 rồi đo lại bằng chính bài test
  ấy; hoặc hạ `terraces` của kỷ 4 từ 3 xuống 2 nếu bảng chấp nhận (lúc đó bài test không áp cho nó
  nữa — nhưng phải hỏi *"kỷ này ĐÁNG có mấy thềm?"* trước, đừng hạ chỉ để hết đỏ).
- **Estimated Complexity**: Thấp (một dòng bảng + đo lại 15 kỷ).
- **Blocking Conditions**: không có.
- **Review Trigger**: khi `TRUOT` khác `[4]`, hoặc khi có phase chỉnh bảng `ERA_TERRAIN`.
- **Owner**: Đàm quyết 2026-08-18 · **Status**: ✅ **ĐÃ ĐÓNG — phân loại lại, không phải sửa**

### Vì sao đóng mà không sửa gì (ADR-032 bổ sung (b))

Đàm đặt đúng câu hỏi mà mục này chưa từng hỏi: ***"đây là thứ mình MẮC hay thứ mình CHỌN?"*** —
*"Nợ là thứ mình MẮC; cái này có thể là thứ mình CHỌN. Phân biệt hai cái đó, đừng để sổ nợ phình
bằng những lựa chọn có chủ ý."* Đi kiểm ý định trước khi đi sửa, và ba bằng chứng đều nói CHỌN:

1. **Bảng khai đúng như vậy.** `ERA_TERRAIN[4]` = `{ shape: 'valley', terraces: 3, relief: 0.60 }`
   kèm `note` nguyên văn *"kinh thành Trung Hoa trên ĐỒNG BẰNG, đồi thấp vây bốn phía"*. Trường An
   và Lạc Dương nằm trên bình nguyên Quan Trung / bồn địa Lạc Dương — đồng bằng có đồi thấp vây
   quanh. Một dải phẳng chiếm phần lớn mặt đất **chính là** câu ấy dịch sang hình học.
2. **Không mất bậc nào** — đây là dấu hiệu phân biệt quyết định. Kỷ 4 khai 3 bậc và **dùng đủ 3**:
   20% ở đáy lòng chảo · 64% ở dải đồng bằng · 16% ở vành đồi. Một trường nhiễu *sập* (bẫy Phase
   7B) thì mất bậc, hoặc dồn về một ĐẦU; ở đây dải đông nhất nằm ở **GIỮA**, có đất thấp hơn bên
   dưới và vành cao hơn bên trên. Đó là mặt cắt của một lòng chảo, không phải của một mặt phẳng.
3. **Kỷ 9 khai cùng một thứ và chỉ cách 6 điểm.** Kỷ 9 (`valley`, 3 bậc, *"lòng chảo sông Seine,
   gần phẳng"*) đo ra **58%** — cùng hình dạng phân bố, chỉ tình cờ nằm dưới vạch. Vạch 60% đang
   cắt ngang giữa hai kỷ mô tả **cùng một loại địa hình**, nên nó không phân biệt được "đồng bằng
   có chủ ý" với "địa hình sập".

**Không sửa một dòng mã nào.** Bài test giữ nguyên `assert.deepEqual(TRUOT, [4])` — vẫn là hàng
rào, chỉ đổi vai: từ *"một khuyết tật chờ sửa"* thành *"một ngoại lệ đã khai, đếm được"*, đỏ theo
cả hai chiều (kỷ thứ hai tụt xuống ⇒ đỏ; kỷ 4 hoá gồ ghề ⇒ cũng đỏ). Chú thích của bài test đã
viết lại cho khớp — **một lời giải thích sai là thứ phiên sau kế thừa rồi dựa vào**.

⚠️ **Ghi kèm cho trung thực**: ngưỡng 60% là một con số **CHỌN TAY** (bản đầu 70% cho cả 15 kỷ, hạ
xuống sau khi nó đòi bịa ra đồi ở Lưỡng Hà và thảo nguyên Nga), không phải con số đo được, và kỷ 9
chỉ đứng cách vạch 2 điểm. Thứ thật sự canh *"địa hình có sập không"* là bài **"MỌI KỶ PHẢI DÙNG ĐỦ
SỐ BẬC MÌNH KHAI"** — nó hỏi thẳng vào khuyết tật thay vì hỏi qua một tỉ lệ. Theo chỉ đạo của Đàm,
**KHÔNG thêm một ngưỡng thứ hai** bên cạnh nó (một ngưỡng chưa hiệu chuẩn đặt cạnh một ngưỡng có
gốc là đúng cái phễu Phase 9A).

---

## #43 — Số tam giác trong `PERFORMANCE.md` không có gì canh, và nó ĐÃ trôi ở 6/15 kỷ

- **Module**: `PERFORMANCE.md` (bảng số) ↔ `src/engine/city3d/*` + `src/components/city/render3d/*`
  (nguồn sinh ra số)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: `PERFORMANCE.md` là nơi DUY NHẤT trả lời *"thêm thứ này vào cảnh có nặng không?"*, và
  mọi quyết định "còn dư sức, thêm chi tiết đi" đều dựa vào nó. Đo lại đủ 15 kỷ ngày 2026-08-18 thì
  **6/15 kỷ sai**: kỷ 8 lệch −3.560 tam giác, kỷ 11 +3.776, kỷ 12 +4.160, kỷ 13 +3.776, kỷ 14
  +2.624, kỷ 15 +3.584; tổng lệch **+14.360**. Nguyên nhân: `e95cdf1` (Phase 11-B) sửa
  `roofStyle.js` — hình học thật — và không đụng `PERFORMANCE.md`.
- **Root Cause**: **cột lệnh vẽ có một bài test canh (`drawCallBudget.test.js`, bảng 15 mốc), cột
  tam giác thì không có gì cả.** Chỗ có test không trôi, chỗ không có test trôi — ngay trong cùng
  một bảng, cùng một phase. Đây đúng bài học đã ghi ở `CLAUDE.md`: *"một bài học được ghi ra KHÔNG
  chặn được gì; chỉ một bài TEST mới chặn được"*. Definition of Done có ghi "tài liệu đã đồng bộ",
  nhưng nó là một câu chữ, và một câu chữ thì không đỏ lên được.
- **Current Risk**: trung bình. Không hỏng gì lúc chạy, nhưng một con số ngân sách sai theo hướng
  **trấn an** (bảng ghi kỷ 11 = 50.114 trong khi thật là 53.890) là loại sai tệ nhất cho một đồng
  hồ đo — cùng hình dạng với vụ HUD thiếu 56% tam giác ngày 2026-08-17.
- **Future Risk**: trung bình-cao và TĂNG DẦN. Mỗi phase mới lại thêm một bảng "trước → sau"; càng
  nhiều bảng thì xác suất một bảng nào đó mô tả một commit đã chết càng cao, và không có cách nào
  phát hiện ngoài việc đo lại tay đủ 15 kỷ (≈15 phút Chromium mỗi lượt).
- **Recommended Solution**: ba hướng, chưa chọn.
  (1) **Một bài test THUẦN cho tam giác**, giống hệt cách `drawCallBudget.test.js` đã làm cho lệnh
  vẽ: hiện `countSceneTriangles` cần `three`, nhưng `collectCitySpecs` + `countTriangles` (`parts.js`)
  thì THUẦN. Cần thêm phần mặt đất/đường/vòm trời/rặng núi mới ra được số tổng — tức phải tìm một
  công thức thuần cho chúng, đúng kiểu `lệnh vẽ = họ vật liệu + 4` đã tìm được ở ADR-028.
  (2) **Bảng 15 mốc tam giác riêng từng kỷ** (không phải một trần chung — bẫy `TECH_DEBT #38`), đặt
  cạnh `MOC_LENH_VE`, có dung sai; rẻ hơn (1) nhưng vẫn cần (1) để tính được số.
  (3) **Chấp nhận + đổi cách viết tài liệu**: mọi bảng ghi rõ HAI commit nó so, và mỗi phase bắt
  buộc tự đo mốc nền (đã làm ở Phase 12 + đã thêm luật vào mục "Khi nào phải đo lại"). Rẻ nhất,
  nhưng vẫn là một câu chữ, tức vẫn không đỏ lên được.
- **Estimated Complexity**: (3) đã xong · (2) thấp một khi có (1) · (1) trung bình — chỗ khó là
  mặt đất/đường/chân trời, vì số ô con của chúng phụ thuộc `pavingSubdivision` và lưới địa hình.
- **Blocking Conditions**: không có blocker kỹ thuật. Nằm ngoài phạm vi Việc 1 (chỉ nhận hai nguyên
  nhân "đường lởm chởm") ⇒ ghi lại thay vì mở rộng phạm vi.
- **Review Trigger**: ngay trước phase kế tiếp có đụng hình học; hoặc khi có ai định trích một con
  số tam giác từ `PERFORMANCE.md` mà không tự đo lại.
- **Owner**: chưa ai · **Status**: MỞ, đã đo đủ số, hướng (3) đã áp dụng, (1)+(2) chưa làm

---

## #42 — ✅ ĐÃ ĐÓNG (2026-08-18, ADR-033) — Vỉa hè bị bóp trong im lặng trên ĐẠI LỘ ở 8/15 kỷ, kỷ tệ nhất chỉ còn 11% bề rộng đã khai

- **Module**: `src/engine/city3d/streetStyle.js` (`streetCrossSection`)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: `walk` là **một trong 8 trục bản sắc** của bảng mặt đường (ADR-025), nhưng trên đại lộ
  nó bị cái kẹp `walk ≤ 0,5 − half` nuốt gần hết ở hơn nửa số kỷ. Đo ngày 2026-08-18 (sau khi đã
  đặt `MAX_AVENUE = 0,96`):

  | kỷ | khai | dựng ra trên đại lộ | còn lại | trên ngõ |
  |---|--:|--:|--:|--:|
  | 12 (Nga) | 0,190 | 0,020 | **11%** | 100% |
  | 15 (UAE) | 0,180 | 0,020 | **11%** | 100% |
  | 9 (Pháp) | 0,170 | 0,030 | **18%** | 100% |
  | 14 (Singapore) | 0,200 | 0,050 | **25%** | 100% |
  | 11 (Mỹ) | 0,140 | 0,040 | **29%** | 100% |
  | 10 (Anh) | 0,150 | 0,110 | 73% | 100% |
  | 13 (Nhật) | 0,160 | 0,140 | 88% | 100% |
  | 4 (Trung Quốc) | 0,100 | 0,090 | 90% | 100% |

  Kỷ 12 khai `walk: 0,19` và `note` của nó viết nguyên chữ *"vỉa hè mênh mông"* — con số và lời
  giải thích cùng bị bóp còn một phần chín, **không có gì đỏ lên**. Đúng hình dạng bẫy `MIN_STONE`
  (Phase 9D) và bẫy Phase 7D: một giá trị khai ra rồi bị một cái kẹp ở nơi khác nuốt mất.
- **Root Cause**: vỉa hè bị buộc phải nằm **trong đúng một ô lưới** cùng với lòng đường, nên tổng
  `half + walk ≤ 0,5` là một ràng buộc cứng. Đại lộ càng rộng thì chỗ còn lại càng ít, và ở những
  kỷ hiện đại (đại lộ rộng **và** vỉa hè rộng — đúng đặc điểm lịch sử của chúng) hai vế chọi nhau
  trực diện. Ngoài đời, đại lộ Haussmann rộng *và* có vỉa hè rộng vì cả mặt cắt phố rộng ra; ở đây
  mặt cắt bị khoá cứng bằng một ô.
- **Current Risk**: thấp về kỹ thuật (không hỏng gì, không lệnh vẽ mới), trung bình về giá trị: một
  trục bản sắc đang chỉ sống ở các **ngõ**, còn ở đại lộ — chỗ mắt nhìn nhiều nhất — thì gần như
  không phát biểu được. Bài `15 KỶ RA 15 MẶT ĐƯỜNG` vẫn xanh vì nó đọc **bảng khai**, không đọc
  thứ dựng ra ⇒ hiện KHÔNG có gì canh chỗ này.
- **Future Risk**: trung bình. Thêm một kỷ mới khai đại lộ rộng + vỉa hè rộng sẽ lặng lẽ rơi vào
  cùng cái kẹp, và người thêm sẽ tưởng mình vừa khai một đặc điểm mới.
- **Recommended Solution**: ba hướng, chưa chọn.
  (1) **Cho vỉa hè lấn sang ô ĐẤT bên cạnh** khi ô ấy không phải công trình — đúng như ngoài đời
  (vỉa hè thuộc lộ giới, không thuộc lòng đường). Đắt nhất: phải biết ô bên cạnh là gì, tức lại là
  một phép hỏi hàng xóm như `carriagewayShape`.
  (2) **Từ chối thẳng ở `isValidStreetStyle`**: `avenue/2 + walk ≤ 0,5`, buộc bảng khai ra thứ dựng
  được. Rẻ nhất, trung thực nhất, nhưng ép 8 kỷ phải hạ một trong hai con số — tức đổi bản sắc.
  (3) **Chấp nhận + ghi thành lời hứa tường minh** ("vỉa hè là đặc điểm của NGÕ, không phải của đại
  lộ") và thêm test khoá điều đó, để nó thôi là một khuyết tật vô danh.
  ⚠️ Cả ba đều đụng bản sắc 15 kỷ ⇒ là **quyết định mỹ thuật**, không tự chọn.
- **Estimated Complexity**: (2) và (3) thấp (một buổi); (1) trung bình — cần dữ liệu ô hàng xóm và
  phải nghĩ lại ai sở hữu phần đất giáp ranh.
- **Blocking Conditions**: ⛔ **CHỜ ĐÀM QUYẾT** (mục 5 ca 6 — quyết định mỹ thuật). Nằm ngoài phạm
  vi Việc 1, vốn chỉ nhận hai nguyên nhân "đường lởm chởm".
- **Review Trigger**: khi Đàm trả lời; hoặc ngay khi có ai định thêm/sửa một dòng `walk` trong
  `STREET_STYLES`.
- **Owner**: Đàm quyết 2026-08-18 · **Status**: ✅ **ĐÃ ĐÓNG** — chọn phương án (2) "từ chối thẳng",
  kèm một luật mà cả ba phương án cũ đều thiếu: **nới cho vượt ngưỡng nhìn thấy được, HOẶC khai
  thẳng `walk: 0` — không có gì ở giữa.**

### Đã đóng thế nào (2026-08-18, ADR-033)

Sửa được nhờ nhìn ra một chuyện lớn hơn cái kẹp: **`avenue` đang được VIẾT như thể nó trả lời câu
"đại lộ này oai tới đâu", trong khi mã ĐỌC nó là "bao nhiêu phần mặt cắt dành cho XE".** Ngoài đời
hai câu ấy gần như ngược nhau — Champs-Élysées rộng 70m thì **21m mỗi bên là vỉa hè**, tức hơn 60%
mặt cắt dành cho người đi bộ. Nên khai Paris `0,94` không phải "chật quá không đủ chỗ", mà là **sai
lịch sử**. Sửa bảng, mỗi dòng kèm một mặt cắt có thật:

| kỷ | avenue T→S | walk khai T→S | **dựng ra** T→S | điểm ảnh T→S |
|---|--:|--:|--:|--:|
| 4 Trung Quốc | 0,82 → 0,80 | 0,10 → 0,08 | 0,09 → **0,08** | 5,8 → 5,1 |
| 9 Pháp | 0,94 → **0,54** | 0,17 → 0,22 | 0,03 → **0,22** | 1,9 → **14,1** |
| 10 Anh | 0,78 → 0,78 | 0,15 → 0,10 | 0,11 → **0,10** | 7,0 → 6,4 |
| 11 Mỹ | 0,92 → **0,62** | 0,14 → 0,17 | 0,04 → **0,17** | 2,6 → **10,9** |
| 12 Nga | 0,96 → **0,70** | 0,19 → 0,14 | 0,02 → **0,14** | 1,3 → **9,0** |
| 13 Nhật | 0,72 → 0,72 | 0,16 → 0,12 | 0,14 → **0,12** | 9,0 → 7,7 |
| 14 Singapore | 0,90 → **0,54** | 0,20 → 0,19 | 0,05 → **0,19** | 3,2 → **12,2** |
| 15 UAE | 0,96 → **0,84** | 0,18 → 0,07 | 0,02 → **0,07** | 1,3 → **4,5** |

**Kết quả: 0/15 kỷ bị kẹp** (trước 8/15) · **0/15 kỷ dưới ngưỡng mắt** (trước 5/15). Vỉa hè dựng ra
nay bằng ĐÚNG con số khai ở cả 15 kỷ. Kỷ 15 (UAE) là kỷ hiện đại nhất mà vỉa hè HẸP nhất bảng —
đó là sự thật về Dubai: Sheikh Zayed Road là trục 12+ làn bắc qua bằng cầu bộ hành, còn chỗ đi bộ
tử tế thì nằm ở các promenade riêng (Mohammed Bin Rashid Boulevard, The Walk at JBR) và đều CÓ MÁI
CHE — một thiết bị chống 45°C, khác hẳn cái trottoir Paris làm ra để kê bàn cà phê.

⚠️ **Bài học lớn hơn cái lỗi** — bài test canh trục này đọc **thứ đã KHAI** (`s.walk`) chứ không đọc
**thứ đã DỰNG** (`streetCrossSection().walk`), nên nó xanh suốt nhiều tháng về một con số chưa bao
giờ tới được mắt Đàm. Hai con số hiệu chuẩn (`CELL_PIXELS`, `EYE_PIXELS`) khi ấy chỉ là bản chép tay
nằm trong file test, còn mã sản phẩm không biết chúng tồn tại ⇒ `isValidStreetStyle` **không thể**
canh ngưỡng mắt dù có muốn. Nay cả hai `export` từ `streetStyle.js` và bài test `import` về — một
luật một công thức. Xem `CLAUDE.md`.

⚠️ **Vì sao mục này ra đời trong lúc sửa một việc khác**: đi tìm nguyên nhân "đường lởm chởm" thì
phát hiện `avenue: 1.00` của kỷ 12/15 làm vỉa hè **bằng 0 tuyệt đối**. Phần ấy đã sửa trong ADR-031
(vì nó chặn chính lời hứa "hết bậc"), nhưng nó chỉ kéo hai kỷ ấy từ 0% lên 11% — bệnh gốc thì rộng
hơn và nằm ngoài phạm vi. Ghi lại thay vì mở rộng phạm vi, đúng luật `CLAUDE.md`.

---

## #41 — ✅ ĐÃ ĐÓNG (2026-08-18) — Chi tiết mái KHÔNG sống sót tới thang bản quét: 90/90 ô dưới ngưỡng mắt

- **Module**: `src/engine/city3d/rooftop.js` + `roofStyle.js` (kích cỡ), `scripts/sweep-diff.mjs` (đo)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: Phase 11 thêm **110.076 tam giác (+20,6%)** lên mái, và ở **thang bản quét 15 kỷ ×
  6 chặng thì gần như không thấy gì**: 90/90 ô dưới ngưỡng mắt 12, trung vị **2,2**, ô đổi mạnh
  nhất (kỷ 7 @ 12h) mới 10,6. Đây chính là điều kiện nghiệm thu Đàm đặt ra cho phase — *"nếu hai
  bản quét vẫn khó phân biệt thì phase này CHƯA đạt mục tiêu của nó"* — nên phải ghi là **CHƯA
  ĐẠT**, không phải "đạt có bảo lưu".
- **Root Cause**: hai nguyên nhân độc lập, và cái thứ hai mới là cái sâu. **(a) Kích cỡ**: vật trên
  mái bị kẹp bởi `STACK_W_MAX_RATIO = 0,3` và `STACK_W_MIN = 0,055`, cỡ ấy chọn để không thành "cây
  nấm" khi nhìn gần, nhưng ở thang quét (một thành phố ≈ 300 × 186 điểm ảnh) thì một cái ống khói
  rộng 0,3 lần bề ngang mái chỉ còn **vài điểm ảnh**. **(b) Loại chi tiết**: đo theo từng kỷ thì
  thứ sống sót là thứ phá **ĐƯỜNG VIỀN** mái (`dormer` kỷ 9 = 5,3% ở khung app · `balustrade` kỷ 7
  = 8,4%), còn thứ chỉ thêm **BỀ MẶT** thì tan biến — kỷ 8 tốn nhiều hình học nhất (**+48,5%** tam
  giác, ngói bò `barrel`) mà đổi **ít nhất (1,2%)**. Ngói bò là những cục nhỏ lặp lại: đắt nhất về
  khối, rẻ nhất về thứ mắt đọc được ở xa.
- **Current Risk**: thấp về mặt kỹ thuật (không có gì hỏng, không có lệnh vẽ mới, hiệu năng vẫn nằm
  sâu trong vùng rẻ), **cao về mặt giá trị**: một phase đã tiêu hết ngân sách hình học của nó mà
  Đàm mở app ra vẫn thấy gần như y cũ. Ở khung app thì có thấy (1,2–8,4% điểm ảnh), nhưng bản quét
  — chỗ DUY NHẤT đặt 15 kỷ cạnh nhau — thì không.
- **Future Risk**: trung bình-cao **nếu không quyết**. Phase 12 sẽ lại thêm chi tiết lên cùng những
  bề mặt ấy; nếu không biết "thứ gì sống sót ở xa" thì nó sẽ lặp lại đúng kết quả này với một ngân
  sách nữa. Ngược lại, phóng đại vật trên mái mà không có gác tỉ lệ sẽ dựng lại bẫy **"cây nấm"** —
  Phase 7C đã trả giá một lần vì `eaves` là số tuyệt đối áp lên những khối chênh nhau vài lần.
- **Recommended Solution**: KHÔNG phải "nhân mọi thứ lên cho to". Ba hướng, theo thứ tự ROI đo được:
  (1) **ưu tiên thứ phá đường viền** — nâng `crown` (lan can, đầu đao, sống mái nổi) và `dormer` ở
  những kỷ đang chỉ có `stack`, vì đó là loại chi tiết đã ĐO ra là sống sót; (2) **nâng trần tỉ lệ
  của riêng vật cao** (bể nước, lồng thang máy, cột ăng-ten — thứ nhô lên khỏi đường viền mái) chứ
  không nâng đều mọi `stack`; (3) chấp nhận rằng chi tiết mái là phần thưởng khi nhìn GẦN và ghi
  điều đó thành lời hứa tường minh, thay vì để nó là một thất bại không tên. **Cả ba đều là quyết
  định MỸ THUẬT ⇒ phải Đàm chọn.**
- **Estimated Complexity**: thấp cho (1) và (2) — bảng đã có sẵn cả hai trục, sửa là sửa giá trị
  trong `roofStyle.js` cộng nới `STACK_W_MAX_RATIO`; phần tốn là chụp + đo lại 15 kỷ (~12 phút).
- **Blocking Conditions**: ⛔ **CHỜ ĐÀM QUYẾT** — mục 5 ca 6 của chương trình làm việc (quyết định
  mỹ thuật với độ tự tin dưới 80%). Tuyệt đối không tự phóng to rồi báo "đã đạt".
- **Review Trigger**: ngay khi Đàm trả lời; hoặc trước khi Phase 12 bắt đầu thêm bất cứ chi tiết
  nào lên mái/tường, vì cùng câu hỏi sẽ lặp lại.
- **Owner**: đã xong · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-18** (xem mục "ĐÓNG NGÀY 2026-08-18" bên
  dưới; phần chưa giải chuyển sang `#48`) — VIỆC 2
  (2026-08-18, ADR-034) chọn một hướng thứ TƯ mà mục này chưa liệt kê: **không phóng to chi tiết,
  mà đưa MẮT lại gần** (chạm vào công trình → camera bay tới, khoảng cách 7,5). Đo được: cùng thay
  đổi mã ấy, lệch trung bình cả khung đi từ **5,54 (dưới ngưỡng mắt 12)** ở khung toàn cảnh lên
  **15,45 (trên ngưỡng)** ở khung cận cảnh. ⚠️ **Câu chữ của mục này vẫn ĐÚNG và vì vậy chưa đóng**:
  chi tiết mái vẫn KHÔNG sống sót tới thang **bản quét** (mỗi thành phố ~300 điểm ảnh), và sẽ không
  bao giờ sống sót tới thang đó. Cái đã đổi là **nó không còn cần phải sống sót tới đó nữa**. Ba
  phương án (1)(2)(3) ở trên còn nguyên giá trị nếu Đàm muốn chi tiết đọc được ngay ở khung mặc
  định — nhưng nay chúng là *thêm*, không phải *cứu*.

### ĐÓNG NGÀY 2026-08-18 — ghi CẢ HAI NỬA, vì mỗi nửa là một kết luận khác nhau

**NỬA ĐÃ GIẢI:** chi tiết Phase 10–11 **có** vượt ngưỡng mắt khi camera lại gần — nhưng **chỉ ở
4/15 kỷ**, không phải cả 15 như bản ghi trước của mục này (VIỆC 2) để người đọc tưởng. Đo lần đầu
đủ 15 kỷ, cùng một dòng lệnh, `b98a47d` → `e95cdf1`, lệch trung bình cả khung ở khoảng cách cận
cảnh: kỷ 7 = **15,52** · kỷ 9 = **15,45** · kỷ 11 = **12,61** · kỷ 13 = **12,20** (bốn kỷ trên
ngưỡng 12); 11 kỷ còn lại từ **0,71** (kỷ 1) tới 11,19 (kỷ 8). Con số 15,45 mà VIỆC 2 khoe là kỷ 9
— **một mẫu, đọc thành luật của cả tập**, đúng hình dạng đã sinh ra `#38`.

**NỬA VĨNH VIỄN KHÔNG GIẢI (kết luận cuối, KHÔNG phải việc còn tồn):** ở **thang bản quét** thì chi
tiết mái sẽ **không bao giờ** đọc được, và đó không phải một thất bại cần chữa. Mỗi thành phố trong
bản quét rộng ~300 điểm ảnh, mỗi căn nhà cao 40–60 điểm ảnh, nên mọi chi tiết cỡ ống khói còn 3–5
điểm ảnh — **bất kể nó nằm trên mái hay dưới đất**. Từ nay bản quét chỉ dùng để canh
**KHÔNG-TRÔI** (15 kỷ còn phân biệt được với nhau không), không dùng để chứng minh một phase chi
tiết có tác dụng.

### ⚠️ LUẬT MỚI CHO MỌI PHASE SAU (Đàm chốt 2026-08-18)

> **Trước khi thêm bất kỳ chi tiết nào, trả lời trước: nó dành cho khung TOÀN CẢNH hay khung CẬN
> CẢNH? Chi tiết cỡ dưới ~12 điểm ảnh ở toàn cảnh thì chỉ đáng làm nếu nó phục vụ cận cảnh.**

Hệ quả thực hành, đã đo trên chính Phase 11: thứ sống sót ở xa là thứ đổi **ĐƯỜNG VIỀN** (lan can
kỷ 7 → 8,4% · cửa sổ mái kỷ 9 → 5,3%), không phải thứ thêm **BỀ MẶT** (ngói bò kỷ 8 tốn nhiều hình
học nhất bảng, **+48,5%** tam giác, mà chỉ đổi **1,2%**). Nên câu hỏi thứ hai luôn là: *"cái này
đổi đường viền hay đổi bề mặt?"*

**Phần chưa giải được chuyển sang `#48`** — nó là một câu hỏi KHÁC (*"vì sao 11 kỷ có quá ít thứ để
mà nhìn"*), không phải phần còn lại của câu hỏi này.

⚠️ **Bài học đi kèm, đáng giá hơn cả mục nợ này**: bản quét là thang NHỎ NHẤT dự án có, và nó
**không phải** thang Đàm dùng app. Một thay đổi có thể thật ở khung app mà chết ở bản quét (đúng ca
này), hoặc ngược lại. `sweep-diff.mjs` nay có **hai chế độ** (`--sweep` mặc định và `--frame`) dùng
CHUNG đơn vị + ngưỡng, để hai con số đặt cạnh nhau được. **Đọc cả hai, đừng chọn con số dễ nghe.**

---

## #40 — `parts.js` chỉ xoay được quanh trục ĐỨNG, nên ngói ống là một phép XẤP XỈ chứ không phải hình thật

- **Module**: `src/engine/city3d/parts.js` (nhà máy hình học) · biểu hiện ở `rooftop.js` (`emitBarrel`)
- **Priority**: Low · **Severity**: Low
- **Impact**: `prism()` nhận `ry` (xoay quanh trục đứng) nhưng KHÔNG có `rx`/`rz`. Ngói ống thật
  là những ống bán trụ **nằm nghiêng theo chiều dốc mái**; không nghiêng được khối thì Phase 11
  dựng bằng **đầu ngói ở diềm + cuộn nóc**, tức mắt đọc ra "mái này lợp ngói ống" từ hai đầu chứ
  không thấy các cuộn chạy dọc mặt dốc.
- **Root Cause**: quyết định kiến trúc cũ của nhà máy hình học — một trục xoay đủ cho mọi thứ đứng
  trên mặt đất, và thêm trục làm ma trận biến đổi phức tạp hơn cho MỌI khối của cả thành phố.
- **Current Risk**: thấp. Ở cỡ bản quét (một thành phố ≈ 300px) sự khác biệt không đọc được; ảnh
  cận cảnh 1500px thì thấy được, nhưng hình hiện tại vẫn kể đúng câu chuyện vật liệu.
- **Future Risk**: thấp–trung bình. Nếu một phase sau hạ camera xuống gần mái, hoặc thêm kiểu mái
  cần khối nghiêng (mái vòm có gân, cầu thang ngoài trời, mái hắt), thì thiếu `rx`/`rz` sẽ chặn
  nhiều thứ cùng lúc chứ không riêng ngói ống.
- **Recommended Solution**: thêm `rx`/`rz` vào `prism()` và nhân ma trận theo thứ tự cố định
  (`rz → rx → ry`), có test khoá thứ tự ấy. ⚠️ Đây là thay đổi chạm vào MỌI khối của thành phố ⇒
  phải quét lại 15 kỷ × 6 chặng và đo lại tam giác; **không được làm kèm một phase mỹ thuật**, vì
  lúc ấy không tách được "đổi vì nhà máy hình học" khỏi "đổi vì mỹ thuật".
- **Estimated Complexity**: Trung bình.
- **Blocking Conditions**: nên có một phase riêng, không gộp.
- **Review Trigger**: khi có phase cần khối nghiêng, hoặc khi camera xuống gần mái.
- **Owner**: chưa phân công · **Status**: Open

---

## #38 — ✅ ĐÃ ĐÓNG (2026-08-18) — Trần "13 lệnh vẽ" là con số suy từ MẪU 3 KỶ, và kỷ 10 nằm ngoài nó

- **Module**: `src/engine/city3d/materials.js` (bảng `MATERIAL_ORDER`) · `eraStyle.js` (vai vật liệu
  của kỷ 10) · `PERFORMANCE.md` (chỗ phát biểu cái trần)
- **Priority**: **Low-Medium**
- **Severity**: **Low** — không phải lỗi hiệu năng, là lỗi **của một con số nghiệm thu**.
- **Impact**: Ràng buộc "không quá 13 lệnh vẽ" là một trong sáu mục cổng nghiệm thu Đàm đặt ra cho
  cả chương trình Phase 10–12. Một cổng mà **thực tế đã vượt sẵn từ trước khi chương trình bắt đầu**
  thì hoặc sẽ báo đỏ oan ở mọi phase sau (và bị nới dần cho tiện — đúng cái phễu Phase 9A), hoặc bị
  ngó lơ và mất luôn tác dụng.
- **Root Cause**: Bảng "Sau Phase 10" bản đầu đo **ba kỷ** (6 · 9 · 13 → 13 · 12 · 11 lệnh vẽ cả
  cảnh) rồi con số cao nhất trong ba ấy được viết ra như **luật của cả 15 kỷ**. Đo đủ 15 kỷ lần đầu
  tiên (2026-08-18) ra kỷ 10 = **14**. Kỷ 10 (Anh, thời công nghiệp) là kỷ **duy nhất** dùng cùng
  lúc cả `brick` lẫn `slate`, cộng `glass` · `stone` · `wood` ⇒ 5 họ vật liệu riêng phần thành phố,
  nhiều hơn mọi kỷ khác đúng một họ.
  ⚠️ Đây **KHÔNG phải hồi quy của Phase 10**: đo trên `HEAD` (trước Bước 2) cũng ra **14**. Cùng
  hình dạng với bài học *"một ngân sách tự tính mà chưa bao giờ được đặt cạnh sự thật thì không phải
  ngân sách"* — cái trần chưa bao giờ được kiểm với cả 15 kỷ, nó chỉ được kiểm với **chính cái mẫu
  đã sinh ra nó**.
- **Current Risk**: **Thấp.** Mô hình chi phí đo trên M3 nói 80% chi phí đi theo ĐIỂM ẢNH; một lệnh
  vẽ thêm trong một cảnh 12–14 lệnh vẽ nằm dưới mức phép đo phân giải được. Không có triệu chứng
  nào Đàm nhìn thấy.
- **Future Risk**: **Trung bình.** Phase 11 (mái) sẽ đụng đúng tầng vật liệu này. Nếu để nguyên,
  phase ấy sẽ hoặc phải làm việc với một cổng đã đỏ sẵn, hoặc vô tình được miễn cổng.
- **Recommended Solution**: ⚠️ **Đề xuất ban đầu của tôi — "ghi trần là 14" — ĐÃ BỊ ĐÀM BÁC, và
  anh đúng.** Lý do anh nêu: *"14 kỷ khác đang ở 11–13, nên trần chung 14 cho chúng ba lệnh vẽ
  trống để trôi vào trong im lặng. Cổng chỉ bắt được kỷ tệ nhất."* Đó chính là bẫy Phase 7D — **một
  con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ**; lời hứa thật không phải "≤ 13" mà
  là *"kỷ này không được tốn hơn chính nó hôm nay"*.
  ⇒ **Giải pháp đã làm: MỘT BẢNG 15 MỐC RIÊNG**, mỗi mốc là số đo của chính kỷ ấy.
  ❌ **KHÔNG** gộp `brick` với `slate` để lấy lại con số 13: hai vật liệu ấy khác nhau thật, và mua
  một con số đẹp bằng cách nói dối vật liệu chính là thứ `ADR-025` đã cấm với mặt đường.
- **Estimated Complexity**: Thấp (một mục tài liệu + một bài test thuần).
- **Blocking Conditions**: (đã gỡ) — hoá ra **không cần đụng `materials.js` một dòng nào**: cổng
  mới chỉ ĐỌC bảng vật liệu, không sửa nó, nên nó nằm gọn trong `src/engine/city3d/*` mà §3 cho
  phép. Cái tưởng là blocker thật ra là hệ quả của việc đề xuất sai giải pháp.
- **Review Trigger**: (đã tới) Trước Phase 11 (mái) — và đã xử lý xong trước khi Phase 11 bắt đầu.
- **Owner**: Việc 1 của chương trình "CHỐT #38 + DỌN QUY ƯỚC + VÀO PHASE 11".
- **Status**: ✅ **ĐÓNG 2026-08-18.**

### Đã làm gì để đóng

1. **`src/engine/city3d/drawCallBudget.test.js`** (mới, 4 bài) — bảng `MOC_LENH_VE` 15 dòng, mỗi
   dòng là số đo ngày 2026-08-18 kèm **lệnh đo chép sẵn trong chú thích** để phiên sau tái lập được:
   `node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow`.
   | Kỷ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
   |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
   | Mốc (thành phố) | 9 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 10 | **12** | 10 | 10 | 10 | 10 | 10 |
2. **ĐỐI CHỨNG bắt buộc** (Đàm: *"Không có đối chứng thì không biết bài test có còn răng hay
   không"*): kéo thêm một họ vật liệu vào một kỷ ⇒ **đúng kỷ ấy** phải vượt mốc, và vượt **đúng 1**.
   Hỏi từng kỷ một, không hỏi tổng.
3. **Bài chống "trần chung đội lốt"**: cách rẻ nhất để bài 1 hết đỏ là điền cả 15 dòng cùng một số;
   bài này đòi khoảng trải ≥ 2 và ≥ 10/15 kỷ nằm dưới mốc cao nhất.
4. **Bài khoá quan hệ nền** `lệnh vẽ thành phố = (số họ vật liệu) + 4` — đúng **15/15 kỷ, không một
   ngoại lệ**. Đây là thứ cho phép cả bộ chạy trong `npm test` bằng `node --test`, không cần
   Chromium. Hằng số 4 = nền ô lưới · mặt đường · thân cư dân · đầu cư dân, và nó là **hiệu số đo
   được**, không phải kết quả đếm bằng mắt trong `sceneGraph.js`.
5. **`src/engine/city3d/cityParts.js`** (mới) — trả lời câu *"thành phố kỷ N gồm những khối nào?"*
   ở đúng MỘT nơi. Trước đó câu ấy nằm giữa thân `sceneGraph.js` nên mọi thứ muốn hỏi đều phải chép
   lại, và một bài test đã chép rồi chép sai. Nay `sceneGraph.js` gọi nó để DỰNG, bài test gọi nó
   để ĐO. Đàm: *"Đừng cố khoá hai bản chép cho khớp nhau — hãy làm cho chỉ còn một bản."*
6. **Tài liệu đã sửa**: `PERFORMANCE.md` (mục "Sau Phase 10" — bỏ hẳn phát biểu "không quá 13", thay
   bằng bảng 15 mốc + cách khoá), `ARCHITECTURE_DECISIONS.md` (ADR-028), `PROJECT_STRUCTURE.md`,
   `BAN_GIAO.md`, `CLAUDE.md`.

### 12 phép thử ngược (mỗi bài test mới đều đã thấy ĐỎ ở đúng chỗ dự đoán trước)

Phá `role:'stone'` → `'water'` · điền cả 15 mốc = 12 · `TAM_CO_DINH` 4→5 · `collectCitySpecs` trả
rỗng · đối chứng chọn họ ĐÃ CÓ · bảng 14 dòng bằng nhau + 1 dòng lệch · `NHIP_SESSIONS` còn một
dòng · `SWEEP_MAX` 150→0 · `kieuNhaDan` trả rỗng · đối chứng dùng nhịp già thay nhịp trẻ · nới kẹp
cấp `Math.min(3,…)` → `Math.min(9,…)` · cắt bớt danh sách cấp thử. **Cả 12 đều đỏ đúng câu assert
đã nêu trước khi chạy.**

---

## #71 — Khu 3×3 quanh kỳ quan KHÔNG giữ chỗ cho một Ô, nó giữ chỗ cho HÌNH CHIẾU ĐÁY — và 225/225 công trình đều tràn ra ngoài ô neo

> Mở 2026-08-21, do phép kiểm bắt buộc của §3 (Phase 13). Đây là câu trả lời cho một câu hỏi mà
> chính Đàm bắt phải hỏi TRƯỚC khi viết mã, và câu trả lời là "không" — nên VIỆC A đổi tính chất.

- **Tên**: Kích thước khu giữ chỗ chưa bao giờ được suy từ hình học, và không ai biết nó đang giữ gì
- **Module**: `src/engine/cityGrid.js` (`BUILDING_ZONES`) · `src/engine/city3d/dwellings.js`
  (`DWELLING_PLOTS`) · `src/engine/cityLayout.js` (`placeBuilding`)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: Phương án "thu khu giữ chỗ về đúng 5 ô neo" — thứ được ước lượng là giải phóng **40 ô**
  — thật ra chỉ giải phóng **12,2 ô/kỷ** (trải 5…24 ô tuỳ kỷ), vì phần lớn 40 ô kia đang bị chính
  hình chiếu đáy của công trình chiếm.
- **Root Cause**: `BUILDING_ZONES` khai 5 khu 3×3 = 45 ô, còn `placeBuilding` chỉ dùng khu ấy để
  **chọn một ô neo** (`zone.x + hashPick(...)`). Không có chỗ nào trong mã nối bề rộng khu với bề
  rộng công trình. Con số 3×3 là một lựa chọn không có phép đo đứng sau — đúng hình dạng *"một con
  số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ"* (bẫy Phase 7D): lời hứa thật là *"chừa
  đủ chỗ cho công trình"*, mà một hằng số thì không nhìn thấy công trình.
- **Số đo (2026-08-21, `d72c033`, kịch bản `$SP/hinhchieu*.mjs`, 15 kỷ × 3 cấp, `sessionCount: 400`)**:
  | đại lượng | giá trị |
  |---|---|
  | công trình có hình chiếu VƯỢT ra ngoài ô neo | **225/225** (100%) |
  | vượt xa nhất | **1,271 ô** — `bp_thanh_quan_viet` (kỷ 6, wonder/epic) |
  | ĐỐI CHỨNG — chồng lấn nhà dân × công trình HÔM NAY | **29 chỗ**, lớn nhất **0,7025 ô²**, trung vị 0,0505 |
  | nếu chỉ giữ 5 ô neo: ô mở thêm | 29,9 ô/kỷ, trong đó **17,7 ô có chồng lấn** |
  | chồng lấn xấu nhất của ca mới | **1,5025 ô²** = **2,14×** mức xấu nhất hôm nay đã chấp nhận |
  | nếu giữ chỗ SUY TỪ hình chiếu (giữ ô nào nhà dân sẽ chạm công trình) | mở thêm **12,2 ô/kỷ** |
- ⚠️ **Bài học nằm ở ĐỐI CHỨNG, không ở con số chính.** Vòng 1 của phép kiểm chọn ngưỡng "chồng lấn
  phải bằng 0" — nghe an toàn — và báo **6.036 vi phạm**. Nhưng thế giới HÔM NAY đã có **29 chỗ chồng
  lấn** với ca xấu nhất **0,7025 ô²**, tức ngưỡng 0 là một ngưỡng mà sản phẩm đang chạy cũng trượt.
  Không đo đối chứng thì con số 6.036 sẽ được đọc thành "phương án này hỏng nặng", trong khi câu đúng
  là "nó tệ hơn hiện trạng **2,14 lần**". Đây là bẫy phễu Phase 9A đi theo chiều ngược: ngưỡng quá
  CHẶT cũng nói dối, chỉ là nó gây hoảng thay vì trấn an.
- ⚠️ **Và vòng 2 lại nói quá vì CÁI BÚT.** Đo bằng `specBounds` (hộp bao CẢ công trình) ra "hình
  chiếu chạm 44,3 ô" — nhiều hơn cả 45 ô đang giữ. Sai vì một kỳ quan bốn tháp góc có hộp bao phủ
  trọn khoảng giữa, nơi không có gì. Đo lại bằng **từng MẢNG một** mới ra bộ số trong bảng. Cùng
  bài học §3a (2026-08-19): hộp bao cả công trình nói quá 4,86 đpt, hình thật từng khối chỉ 0,13.
- **Current Risk**: Không có — hôm nay khu 3×3 đủ rộng nên không ai bị cắm nhà vào giữa kỳ quan.
- **Future Risk**: Bất kỳ phase nào thêm loại công trình mới, hoặc nới `spread`/`massScale`, đều có
  thể làm hình chiếu vượt khỏi khu 3×3 mà **không có gì đỏ lên** — và lúc ấy nhà dân sẽ mọc xuyên
  qua tường kỳ quan. Đã có 2,1 ô/kỷ tràn ra ngoài khu và 20,9 ô/kỷ đạp lên ô ĐƯỜNG (đường thì
  không kêu, vì mặt đường được vẽ dưới chân công trình).
- **Recommended Solution**: KHÔNG thay 3×3 bằng một con số khác. Suy vùng giữ chỗ TỪ hình chiếu đáy
  thật, đúng cách `plan-coverage.mjs` đang tô, rồi để `deriveDwellings` nhận vùng ấy thay vì hỏi
  `isBuildingZone`. ⚠️ Hệ quả kiến trúc: tập ô nhà dân **thôi là hằng số cấp module** và trở thành
  **phụ thuộc kỷ** — nên phải nối các ô mới vào ĐUÔI danh sách đã sắp xếp, giữ nguyên 30 chỉ số đầu,
  nếu không mọi căn nhà hiện có của Đàm sẽ đổi chỗ.
- **Estimated Complexity**: Medium (đụng chữ ký `deriveDwellings`, cần test khoá 30 ô đầu bất động).
- **Blocking Conditions**: **CHỜ ĐÀM QUYẾT** — §7(a) của chỉ thị Phase 13 buộc dừng đúng ở đây.
- **Review Trigger**: khi có phase thêm loại công trình mới, hoặc nới `spread`/`massScale`.
- **Owner**: chưa phân công · **Status**: Open — chờ quyết định

---

## #72 — Phép đo (M2) «mấy tầng chiều sâu có dấu vết con người» ĐÃ ĐẠT SẴN mục tiêu trước khi làm gì cả: 15/15 kỷ, ở MỌI mức sàn thử

> Mở 2026-08-21. Một cái cổng không có răng, phát hiện được vì đã làm đúng thứ tự Đàm ra: **in giá
> trị THẬT trước, chọn ngưỡng sau**.

- **Tên**: (M2) đo một đại lượng đã bão hoà, nên nó không phân biệt được trước với sau
- **Module**: `scripts/mask-count.mjs` (`countBands`) — công cụ vẫn ĐÚNG; chỗ hỏng là ĐỊNH NGHĨA phép đo
- **Priority**: Medium · **Severity**: Medium
- **Impact**: Nếu dùng (M2) làm cổng nghiệm thu cho VIỆC B, cổng ấy sẽ xanh dù VIỆC B không dựng gì.
- **Số đo (2026-08-21, `d72c033`, bản quét 15 kỷ `--sessions 80 --hour 12 --theme light`, 6 dải)**:
  dấu vết con người theo dải (dải 1 = XA nhất), trung bình 15 kỷ:
  **0,41 · 21,37 · 60,96 · 60,31 · 47,49 · 30,36 %**
  | mức sàn thử | 0,5 | 1 | 2 | 3 | 5 | 8 | 10 | 15 | 20 |
  |---|---|---|---|---|---|---|---|---|---|
  | số dải đạt (TB) | 5,3 | 5,2 | 5,0 | 5,0 | 5,0 | 4,9 | 4,9 | 4,7 | 4,3 |
  | số kỷ đạt ≥3 dải | **15/15** | 15/15 | 15/15 | 15/15 | 15/15 | 15/15 | 15/15 | 15/15 | **15/15** |
  Mục tiêu Đàm đặt là *"≥3 dải ở ít nhất 12/15 kỷ"* ⇒ **mốc nền đã 15/15 ở mọi mức sàn từ 0,5% tới
  20%**. Không có mức sàn nào cho ra "đúng 1 dải" như giả định ban đầu.
- **Root Cause**: mẫu số của (M2) là **diện tích của chính dải ấy**, mà tấm đất thành phố phủ gần
  hết 5/6 dải, nên dải nào chứa tấm đất thì cũng chứa dấu vết con người. (M2) đang đo *"thành phố có
  lấp đầy giữa khung hình không"* — điều đã đúng sẵn — chứ không đo *"dấu vết con người có vươn ra XA
  không"*. Cùng họ `TECH_DEBT #44`: mẫu số lẫn thứ không thuộc câu hỏi.
- ⚠️ **Nhưng chính bảng ấy lại NÓI RA khuyết tật Đàm mô tả, chỉ là ở HÌNH DẠNG chứ không ở SỐ ĐẾM**:
  hồ sơ 6 dải là một cái BƯỚU — 0,41 ở dải xa nhất, vọt lên 60,96 ở giữa, rồi tụt về 30,36 ở dải gần
  nhất. Dấu vết con người mất hẳn ở CẢ HAI đầu chiều sâu. Đó đúng là "một hòn đảo giữa một tấm đất
  trống", và nó đọc được từ số. Vậy nên bảng dải vẫn ĐÁNG GIỮ — **để BÁO CÁO hình dạng, không để làm
  CỔNG**.
- **Recommended Solution** (chờ Đàm chốt): thay cổng bằng **% khung hình là dấu vết con người NẰM
  NGOÀI lưới 12×12**. Đã đo mốc nền: **0/446** công trình + nhà dân + giàn giáo + ô đường của cả 15
  kỷ nằm ngoài lưới ⇒ mốc nền **bằng 0 theo cấu trúc**. Phép đo này (a) có răng thật, (b) **không
  thể mua bằng cách thêm cây** — cây thuộc `props`/`landscape`, không thuộc dấu vết con người, đúng
  điều Đàm cấm tuyệt đối, (c) chỉ nhúc nhích nếu VIỆC B thật sự dựng thứ gì đó ngoài lưới.
  ⚠️ Mốc nền bằng 0 thì phải kèm **một đối chứng chứng minh phép đo CÓ THỂ thấy giá trị khác 0**,
  nếu không nó là bài test luôn-xanh (bài học lùm cây Phase 8D).
- **Estimated Complexity**: Low (đặt tên khối cho tầng hinterland rồi đếm bằng đúng `mask-count.mjs`).
- **Blocking Conditions**: **CHỜ ĐÀM QUYẾT** — §7(b) buộc dừng và trình bày phương án thay thế,
  cấm nới sàn.
- **Review Trigger**: ngay khi VIỆC B bắt đầu.
- **Owner**: chưa phân công · **Status**: Open — chờ quyết định

---

---

## #74 — Vùng phụ cận KHÔNG lớn lên theo số phiên, nên **tín hiệu quy mô nằm ngoài vòng lặp phần thưởng**

- **Tên**: Thứ làm đô thị trông rộng thì có sẵn từ phiên số 0, và không bao giờ đổi
- **Module**: `src/engine/city3d/hinterland.js` (`planHinterland`) · `city3d/hinterlandStyle.js`
- **Priority**: Medium · **Severity**: Low (mỹ thuật/động lực, không phải lỗi chạy)
- **Impact**: `hinterland` được dựng đúng khuôn `outskirts` — **tầng ĐỊA LÝ, không phải tầng TIẾN
  ĐỘ** — nên nó không nhận `built`/`levels`/`sessionCount` và có test gọi kèm dữ liệu rác khoá điều
  đó. Hệ quả đo được: 2241 vật ngoài lưới ở mốc 80 phiên **cũng đúng bằng** số vật ở mốc 0 phiên.
  Người mới mở app lần đầu thấy y hệt vùng phụ cận mà người chơi 120 phiên thấy. Toàn bộ phần
  "rộng hơn, quy mô hơn" mà Đàm yêu cầu vì vậy là một **món quà tặng trước**, không phải một phần
  thưởng kiếm được — trong khi mọi tầng khác của thành phố (nhà, đường, nhà dân, mảng phủ) đều lớn
  lên theo phiên.
- **Root Cause**: chỉ thị §4 của Đàm cho phép vùng phụ cận phụ thuộc số phiên *"nhưng nếu có thì
  phải theo bất biến **chỉ thêm, không bao giờ dời**"*. Tôi chọn KHÔNG phụ thuộc, vì hai lý do đo
  được: (a) `outskirts` đã là tầng địa lý và hai tầng ngoài lưới mà một cái đứng yên một cái lớn dần
  sẽ trôi khỏi nhau đúng như hai bảng mật độ đã suýt trôi ở ADR-038; (b) bất biến "chỉ thêm" đòi một
  phép quét liệt kê 1…120 phiên × 15 kỷ để chứng minh, và phép quét ấy chưa được viết (xem #71 —
  cùng một món nợ, cùng một lý do hoãn).
- **Current Risk**: Thấp. Không ai mất gì; chỉ là một cơ hội chưa dùng.
- **Future Risk**: Trung bình. Nếu sau này Đàm muốn *"vùng quê mở rộng theo chuỗi ngày"* thì phải
  làm ĐÚNG bất biến "chỉ thêm, không bao giờ dời" — mà ba đường rò rỉ của bất biến ấy đã được liệt
  kê sẵn ở #71 (ngân sách suy từ số ô còn trống · bộ lọc va chạm chạy SAU khi sắp xếp · `hashPick`
  lấy dư theo ĐỘ DÀI danh sách). Làm ẩu thì mỗi phiên xong lại có một cái ruộng NHẢY CHỖ, đúng thứ
  ADR-007 sinh ra để cấm.
- **Recommended Solution**: nếu Đàm muốn, cho `hamletCount` (và CHỈ nó) tăng theo mốc phiên bằng
  cách **nối thêm vào ĐUÔI** danh sách đã có, kèm một bài test liệt kê 1…120 phiên × 15 kỷ đòi mọi
  vật cũ giữ nguyên toạ độ từng chữ số.
- **Estimated Complexity**: Trung bình (phép quét liệt kê là phần tốn nhất, không phải phần dựng).
- **Blocking Conditions**: cần Đàm quyết — đây là một câu hỏi **thiết kế trò chơi** (*"cái rộng lớn
  là quà tặng hay là phần thưởng?"*), không phải một câu hỏi kỹ thuật. Nó là cùng một câu hỏi với
  #14.
- **Review Trigger**: khi #14 được chốt, hoặc lần đầu Đàm nói *"vùng quanh thành phố nên lớn lên
  theo tôi"*.
- **Owner**: chưa ai · **Status**: MỞ, CHỜ ĐÀM QUYẾT

## #73 — Camera bị buộc cứng vào `CITY_GRID_SIZE`, nên "lưới to hơn" và "nhà cao hơn" TỰ TRIỆT TIÊU nhau

> Mở 2026-08-21 theo đúng chỉ thị §5 (Q2) của Đàm: ghi lại, **KHÔNG tách bây giờ**.

- **Tên**: `gridSize` gánh hai việc — vừa là "lưới địa chỉ rộng mấy ô", vừa là "mắt đứng lùi bao xa"
- **Module**: `src/engine/city3d/orbit.js` (`cityOrbitOptions`)
- **Priority**: **Low** · **Severity**: Low
- **Impact**: Mọi phương án làm thành phố "trông rộng hơn" bằng cách nới lưới hoặc nâng `massScale`
  đều bị camera lùi ra đúng bằng phần vừa thêm ⇒ tỉ lệ khung hình không đổi, có khi còn tệ đi.
- **Root Cause**: `distance = gridSize × factor + terrainLift × TERRAIN_TO_DISTANCE`. Ngoài đời hai
  đại lượng ấy không tỉ lệ với nhau: một thành phố rộng gấp đôi thì người ta **không** tự động đứng
  lùi gấp đôi. Đây là lần thứ **năm** của hình dạng *"một trường gánh hai việc"* (sau `storyHeight`,
  `roof`, bảng loài cây, `avenue`).
- **Số đo (2026-08-21)**: lưới 12 → 16 làm khoảng cách camera đi **13,24 → 17,39** (kỷ 1) ·
  14,98 → 19,62 (kỷ 8) · 16,85 → 22,47 (kỷ 14). Hệ quả đo được trên chỉ số "% khung hình là thành
  phố": nới lưới lên 16 ra **−4,21 đpt** (đi LÙI), nâng `massScale` ×1,3 ra **−1,03 đpt** (cũng lùi).
- **Recommended Solution**: tách `gridSize` (địa chỉ) khỏi một trường mới kiểu `viewSpan` (tầm mắt),
  đúng khuôn `storyHeight`/`massScale` của Phase 5B.
- ⚠️ **VÌ SAO CHƯA LÀM (Đàm chốt 2026-08-21)**: (a) không phase nào hiện nay đổi `CITY_GRID_SIZE`,
  nên tách ra là dựng một cơ chế **không ai chạy** — đúng thứ mã chết vừa đo được ở 40 ô khu kỳ
  quan; (b) tách xong thì cái núm còn lại duy nhất là *"đứng gần hơn"*, tức phương án **(D) siết
  khung** mà Đàm **đã bác hai lần**; (c) chưa đủ dữ kiện để viết một ADR tử tế.
- **Estimated Complexity**: Medium.
- **Blocking Conditions**: không có — đây là nợ ĐƯỢC CHỌN mang, không phải nợ bị kẹt.
- **Review Trigger**: **lần đầu tiên có một phase thật sự cần đổi `CITY_GRID_SIZE`.**
- **Owner**: chưa phân công · **Status**: Open — cố ý hoãn

---

## #75 — Ziggurat kỷ 3 đã có hình ĐÚNG nhưng vẫn đọc ra là «một khối cao đội cái mũ giật cấp» — đây là bài toán KHỐI TÍCH, không phải bài toán MÁI

> ✅ **ĐÃ ĐÓNG 2026-08-24 (Phase 19 VIỆC 2, ADR-054)** — và đóng đúng bằng cách mà chính mục này đã
> chẩn đoán: **bài toán KHỐI TÍCH**. Không chỉnh `massScale`, không thêm kiểu mái; thêm hẳn nguyên
> mẫu thứ 8 `monolith` — công trình LÀ khối, dựng thẳng từ mặt đất, **không thân tường, không
> `groundFloor`, không `eaves`, không `rooftop`**. Kỷ 3 nay đọc ra là GIẬT CẤP (thềm + tường
> nghiêng batter + đền trắng trên đỉnh + cầu thang chính diện), kỷ 2 là CHÓP TRƠN. Cái "thân nhà
> cao gấp ba" mà mục này đo được **không còn tồn tại** — không phải nhỏ đi, mà là không được dựng
> ra nữa.

> Mở 2026-08-21 (Phase 14 §1(2)). Nợ này **được chọn mang**, không phải nợ bị kẹt: hình đã đúng
> lịch sử, thứ còn lệch là TỈ LỆ giữa mái và thân, mà thân thì nằm ở một tầng khác hẳn.

- **Tên**: `massScale`/`getMassing` cho kỷ 3 dựng một thân nhà cao gấp ba lần khối ziggurat đặt lên nó
- **Module**: `src/engine/city3d/eraStyle.js` (`massScale`, `storyHeight`) + `src/engine/city3d/buildingSpec.js` (`getMassing`)
- **Priority**: Medium · **Severity**: Low (mỹ thuật, không ảnh hưởng dữ liệu/hiệu năng)
- **Impact**: Ở Ur, **cả toà nhà LÀ cái ziggurat** — không có "thân nhà" nào bên dưới. Trong app thì
  ba thềm giật cấp đang ngồi trên một khối tường trơn cao hơn chúng, nên mắt đọc ra "một cao ốc đội
  mũ" chứ không đọc ra "một ngọn núi nhân tạo". Hình đúng, tỉ lệ sai.
- **Số đo (2026-08-21, kỳ quan `bp_ziggutat` cấp 3)**: thân nhà cao **1,663** · ba thềm ziggurat cao
  **0,575** (= **34,6%** thân) · kể cả đền trên đỉnh thì **0,739** (**44%** thân, **31%** tổng chiều
  cao). Để so sánh, kim tự tháp kỷ 2 sau bản vá cùng ngày: mái **0,818** trên thân **1,079** =
  **76%** thân, **43%** tổng — và chính tỉ lệ ấy là lý do kỷ 2 đọc ra ngay còn kỷ 3 thì không.
- **Root Cause**: `emitRoof` chỉ được cấp phần chiều cao **phía trên `top`**, mà `top` do khối tích
  quyết định. Muốn ziggurat chiếm phần lớn công trình thì phải hạ `massScale`/`storyHeight` của kỷ 3
  **và** cho `roofPitch` phần bù lại — tức sửa ở tầng KHỐI TÍCH, không sửa được ở tầng MÁI.
- ⚠️ **Vì sao KHÔNG vá bằng cách nâng `roofPitch` kỷ 3**: `roofPitch` là **một trường gánh hai việc**
  (lần thứ sáu của hình dạng ấy trong dự án) — nó vừa định chiều cao mái kỳ quan, vừa định độ dày
  lan can của mái `flat` mà **nhà dân** kỷ 3 dùng (`lip = max(0,05, pitch × 0,28)` và
  `capH = max(0,05, pitch × 0,34)` trong `emitRoof`). Nâng nó lên là làm mọi nhà dân kỷ 3 đội một
  vành bê tông dày, để chữa một công trình duy nhất. Cái bẫy này đã bắt được **trước khi ship**.
- ⚠️ **Vì sao KHÔNG nâng `PLAN`/`CAO` của `case 'ziggurat'`**: tỉ lệ thật của Ur là thềm 1 cao ≈11 m
  trên đáy 64×45 m, tức **h/w ≈ 0,17**; giá trị đang chạy đã cao hơn thế vì lý do đọc-được-ở-xa.
  Nâng thêm nữa là **mua một ấn tượng bằng cách nói dối tỉ lệ** — đúng thứ ADR-025 cấm với mặt đường.
- **Current Risk**: Thấp. Kỷ 3 nay đã phân biệt được với kỷ 11 (`stepped`) và có thềm đọc ra được.
- **Future Risk**: Trung bình — nếu §1(3) (khu phố nhiều nhà) làm nhà dân đông lên, kỳ quan sẽ phải
  nổi bật hơn nữa mới giữ được vai trò "nhận ra từ xa" mà Phase 7C đặt ra.
- **Recommended Solution**: một phase KHỐI TÍCH riêng, đặt câu hỏi cho **cả 15 kỷ** chứ không riêng
  kỷ 3: *"tỉ lệ mái/thân của kỳ quan kỷ này phải là bao nhiêu để nó đọc ra đúng công trình thật?"*
  Kèm một phép đo tỉ lệ mái/thân cho cả 15 kỷ (hôm nay chưa ai đo đại lượng này).
- **Estimated Complexity**: Medium.
- **Blocking Conditions**: không có.
- **Review Trigger**: **khi §1(3) (khu phố) xong và Đàm nhìn lại kỷ 3** — hoặc sớm hơn, nếu có phase
  nào đụng vào `massScale`.
- **Owner**: chưa phân công · **Status**: Open — cố ý hoãn

---

## #77 — `ROOFTOP_MIN_SPAN` là một MỨC TUYỆT ĐỐI áp lên những khối chênh nhau nhiều lần, nên 9/15 kỷ mất một phần chi tiết mái ngay khi nhà dân được chia nhỏ

> Mở 2026-08-21 (Phase 14 §1(3), ADR-052). Phát hiện vì `rooftop.test.js` ĐỎ — không phải vì ai đi
> tìm nó. Nếu bài test ấy không tồn tại thì **13/15 kỷ đã mất SẠCH chi tiết mái nhà dân trong im
> lặng** (kỷ 1: 17 → 0 ô), và không một cổng nào khác kêu lên.

- **Tên**: trần "mảng nhà hẹp hơn mức này thì không có gì trên mái" viết bằng một con số tuyệt đối
- **Module**: `src/engine/city3d/rooftop.js` (`ROOFTOP_MIN_SPAN = 0.24`, dòng gác ở `emitRooftop`)
- **Priority**: Medium · **Severity**: Medium
- **Số đo (2026-08-21, quần thể 371 ô nhà dân của 15 kỷ ở `sessionCount: 80`)**: giữ được
  **313/371 ô (84%)**. Chín kỷ dưới 100%: **4 · 5 · 6 · 7 · 8 · 9 · 11 · 12 · 13**. Tệ nhất kỷ 13
  = **21/29 = 0,724**. Sáu kỷ còn nguyên 100%: 1 · 2 · 3 · 10 · 14 · 15.
- **Impact**: Phase 11 đã tiêu **110.076 tam giác** để dựng ống khói / bồn nước / cửa sổ mái / lan
  can. Ở 9 kỷ trên, một phần khoản đầu tư ấy nay không tới được màn hình. Nó chỉ thấy được ở CẬN
  CẢNH (bản quét 15 kỷ không đủ độ phân giải — xem `TECH_DEBT #41`), nên nó sẽ không tự lộ ra.
- **Root Cause**: đây là **bẫy Phase 7D lần thứ N** — *"một con số tuyệt đối không diễn đạt được
  một luật nói về QUAN HỆ"*. Câu mà `ROOFTOP_MIN_SPAN` đang muốn nói là *"chi tiết mái phải còn đủ
  to để MẮT đọc ra"*, tức một quan hệ giữa cỡ chi tiết và số điểm ảnh nó chiếm; nó lại được viết
  thành một mức cố định trong hệ đơn vị mô tả, áp chung cho mọi khối bất kể to nhỏ. Cùng họ với
  `eaves` (Phase 7C) — một số tuyệt đối áp lên những khối chênh nhau nhiều lần thì sớm muộn cũng sai.
- **Current Risk**: thấp — 84% vẫn còn, và phần mất nằm ở chi tiết chỉ thấy khi zoom.
- **Future Risk**: **trung bình và tăng dần**. Mọi phase sau chia nhỏ thêm bất cứ thứ gì (nhà dân,
  công trình phụ, ki-ốt) đều tiêu tiếp vào cùng một khoản dự trữ, mà cái trần này thì không kêu —
  nó **từ chối thẳng** rồi trả `false`, đúng cách hỏng đã cắn ở Phase 10 Bước 2 (kỷ 14 mất sạch cửa).
- **Recommended Solution**: viết lại thành QUAN HỆ. Trần phải hỏi *"chi tiết này chiếm bao nhiêu
  ĐIỂM ẢNH ở khung cận cảnh?"* — hai con số hiệu chuẩn đã có sẵn và đã export (`CELL_PIXELS = 64`,
  `EYE_PIXELS = 4` ở `streetStyle.js`), nên phép quy đổi không cần hằng số thứ ba chọn tay. Ai làm
  thì phải kèm một **đối chứng nhốt bộ số hỏng cũ** (bơm lại cỡ khối của bản chia-nhỏ-đầu-tiên và
  đòi phép đo còn bắt được nó), nếu không cái trần sẽ bị nới dần cho tiện.
- **Estimated Complexity**: Medium — đụng vào `rooftop.js` là đụng vào 12 bài test đang xanh.
- **Blocking Conditions**: không có. ⚠️ Nhưng KHÔNG được chữa bằng cách **hạ** `ROOFTOP_MIN_SPAN`:
  con số ấy tồn tại vì một lý do thật (*"dưới đây mọi chi tiết đều thành vệt bẩn"*), hạ nó là mua
  một con số đẹp bằng cách rắc vệt bẩn lên mái.
- **Review Trigger**: khi tỉ lệ giữ chi tiết mái tụt xuống dưới **80%**, hoặc khi có phase nào chia
  nhỏ thêm khối lần nữa. Cổng đếm nằm ở `block.test.js` (bài `CHI TIẾT MÁI KHÔNG ĐƯỢC CHẾT`), và nó
  kể tên chín kỷ BẰNG chứ không "bao gồm" — kỷ thứ mười rơi vào thì ĐỎ, mà một kỷ được chữa xong
  cũng ĐỎ.
- **Owner**: chưa phân công · **Status**: Open

## #76 — Từ vựng mái NHÀ DÂN chỉ có **3 giá trị cho 15 kỷ**, trong khi mái KỲ QUAN đã có 10

> Mở 2026-08-21 (Phase 14 §1(2)), phát hiện trong lúc trả lời chính câu hỏi *"bộ từ vựng mái có đủ
> giàu không?"* — câu trả lời là **có ở kỳ quan, KHÔNG ở nhà dân**.

- **Tên**: `vernacularRoof` chỉ dùng 3 trên 10 giá trị của `ROOF_KINDS`
- **Module**: `src/engine/city3d/eraStyle.js` (trường `vernacularRoof`, 15 dòng)
- **Priority**: Medium · **Severity**: Low hôm nay, sẽ tăng khi §1(3) xong
- **Số đo (2026-08-21)**: `flat` × **7 kỷ** · `gable` × **7 kỷ** · `cone` × **1 kỷ** (kỷ 1). Tức
  14/15 kỷ chia nhau đúng **hai** hình mái. Bộ mái kỳ quan cùng lúc đó dùng **8/10** giá trị.
- **Impact**: Hôm nay mỗi kỷ chỉ hiện **6–30 nhà dân** rải rác nên chưa ai để ý. **§1(3) sẽ nâng con
  số ấy lên 120–300** — lúc đó "hai hình mái cho cả 15 kỷ" chính là thứ mắt nhìn thấy nhiều nhất
  trong khung hình, và nó sẽ đọc ra là *"15 kỷ xây cùng một loại nhà"*.
- **Root Cause**: `vernacularRoof` sinh ra ở Phase 7C để **tách** mái nhà dân khỏi mái kỳ quan (một
  trường gánh hai việc). Việc tách đã làm đúng, nhưng bảng mới chỉ được điền bằng những giá trị đã
  có sẵn lúc ấy — chưa ai quay lại hỏi *"mỗi nước dựng mái nhà thường ra sao?"*.
- ⚠️ **Cấm rơi im lặng về mặc định**: nếu mở rộng thì mọi giá trị mới phải khai đủ cho **cả 15 kỷ**,
  kỷ chưa nghiên cứu khai một giá trị "chưa đụng tới" ĐẾM ĐƯỢC bằng test (tiền lệ `door: 'legacy'`
  ở Phase 10). Bài `TỪ VỰNG MÁI (a) — không giá trị chết` trong `buildingSpec.test.js` đã canh sẵn
  chiều ngược lại: thêm một giá trị vào `ROOF_KINDS` mà không kỷ nào khai thì test ĐỎ.
- **Recommended Solution**: gộp vào **chính §1(3)** — bảng hình thái khu phố và bảng mái nhà dân trả
  lời cùng một câu hỏi (*"nhà thường ở nước này trông thế nào?"*), làm rời nhau thì hai bảng sẽ trôi.
- **Estimated Complexity**: Low nếu làm cùng §1(3); Medium nếu làm riêng.
- **Blocking Conditions**: không có.
- **Review Trigger**: **ngay khi bắt đầu §1(3) (hình thái khu phố)** — không được để sang phase sau.
- ⚠️ **ĐÃ RÀ SOÁT ĐÚNG HẸN (2026-08-21, trong §1(3)) — KẾT QUẢ: HOÃN CÓ CHỦ ĐÍCH, KHÔNG PHẢI BỎ QUÊN.**
  - **Đo lại**: phân bố KHÔNG đổi — `flat` × 7 kỷ · `gable` × 7 kỷ · `cone` × 1 kỷ. Vẫn 3/10 giá trị.
  - **Dự đoán cũ đã thành sự thật, và đo được**: §1(3) nâng số khối nhìn thấy từ **371 lên 1812**
    (×4,88). Nghĩa là mái nhà thường nay xuất hiện gấp gần năm lần trên khung hình so với lúc mục
    này được mở ⇒ **Severity: Low → Medium**.
  - **Vì sao vẫn KHÔNG làm trong cùng commit**: §1(3) giao hàng bằng **CẶP ẢNH TRƯỚC/SAU**, và cả
    phase chỉ đổi đúng một thứ (hình thái khu phố). Đổi thêm bảng mái nhà dân trong cùng lượt thì
    hai thay đổi trộn vào một tấm ảnh và **không ai còn đọc được vế nào làm ra thay đổi nào** —
    đúng thứ mà quy tắc Commit của `CLAUDE.md` cấm (*"không trộn nhiều thay đổi không liên quan,
    có thể rollback độc lập"*), và cũng đúng bài học `TECH_DEBT #43` (một bảng số trộn hai thay
    đổi thì vô dụng). Việc mở rộng còn cần nghiên cứu lịch sử cho **14 kỷ**, tức nó là một phase
    riêng chứ không phải một dòng sửa kèm.
  - **Điều đã LÀM được ngay**: bảng khu phố `blockStyle.js` mở thêm **7 trục** phân biệt kỷ
    (`cols`/`rows`/`attach`/`alley`/`storey`/`vary`/`gableToStreet`), nên "15 kỷ xây cùng một loại
    nhà" nay sai ở tầng BỐ CỤC dù còn đúng ở tầng MÁI. Đó là giảm nhẹ, không phải chữa khỏi.
- **Review Trigger (MỚI, thay cho mốc đã dùng)**: **ngay phase sau §1(3)**, hoặc sớm hơn nếu Đàm
  nhìn ảnh §1(3) rồi nói mái nhà dân trông giống nhau giữa các kỷ.
- **Owner**: chưa phân công · **Status**: Open (đã rà soát 2026-08-21, hoãn có lý do)

---

> ⚠️ **ĐÁNH SỐ LẠI khi hợp nhất (Phase 21)**: hai mục dưới đây vốn mang số **#79** và **#80** trên
> nhánh Phase 19/20, trùng với hai mục CÙNG SỐ mà `main` đã dùng cho hai chuyện khác hẳn (vai màu
> `gear` · cư dân chiếm 0,29% khung hình). Theo đúng luật đã áp cho ADR — *số của `main` giữ
> nguyên nghĩa* — chúng đổi thành **#89** (trục chặng ngày) và **#90** (khu phố làm 4 kỷ thấp đi).

## #88 — Trần "một khu phố không rộng quá MỘT Ô" khoá luôn số suất đất ở 4, làm cột `units`/`cols`/`rows` của bảng khu phố thành một TRỤC CHẾT

> Mở 2026-08-24 (Phase 21 §4). Đây là **cái giá đã đo được** của việc chữa đúng thứ Đàm chỉ ra
> (*«việc mở rộng thành phố không phải là nhà xếp chồng lên nhau, nó rất phản thực tế và lịch
> sử»*), không phải một lỗi cài đặt. Ghi ra vì nó là một trục CHẾT, mà một trục chết bị bỏ im
> lặng chính là thứ `MIN_STONE` (Phase 9D) đã dạy.

- **Tên**: 15 dòng bảng khai 4…10 suất đất, dựng ra đúng MỘT con số — 4
- **Module**: `src/engine/city3d/block.js` (`BLOCK_MAX_CELLS`) · `blockStyle.js`
  (`MIN_UNIT_CELLS`, cột `units`/`cols`/`rows`) — khoá bằng `block.test.js`
  (`TRỤC CHẾT ĐƯỢC ĐẾM RA`)
- **Priority**: Medium · **Severity**: Low (mỹ thuật; không đụng dữ liệu, không đụng hiệu năng)
- **Impact**: một trong bảy trục của bảng khu phố ngừng nói. Trước §4 thì khối/ô trải **4,00–6,13**;
  nay **4,00 ở cả 15 kỷ**, tổng khối 2370 → **1904** (−19,7%). Sáu trục còn lại (`layout`, `attach`,
  `alley`, `storey`, `vary`, `gableToStreet`) vẫn sống, và HÌNH của bốn suất đất vẫn khác nhau giữa
  kỷ hữu cơ và kỷ lưới — nên mắt vẫn phân biệt được 15 kỷ; thứ mất là **mật độ** khác nhau giữa các
  kỷ ở cấp MỘT Ô. (Mật độ ở cấp THÀNH PHỐ thì không mất: số ô nhà dân vẫn trải 28…71 tuỳ kỷ.)
- **Root Cause**: SỐ HỌC, không phải một tham số chỉnh sai. Một ô rộng 1,0 chia cho sàn
  `MIN_UNIT_CELLS = 0,3276` ra 3,05 ⇒ tối đa **2 suất mỗi trục ⇒ 4**. Mà trần 1,0 ô là mức
  **nhỏ nhất có thể** để hai khu phố ở hai ô kề nhau chạm nhau mà không xuyên qua nhau — đo được
  96,1% ô nhà dân CÓ láng giềng kề cạnh (616 ô ứng viên, cả 15 kỷ), nên không thể nới trần theo
  từng ô mà vẫn giữ lời hứa. Hai vế "không xuyên qua nhau" và "mỗi ô 4–10 căn có chi tiết mái"
  **loại trừ nhau** trong một ô 1,0.
- **Current Risk**: thấp. Không ai mất dữ liệu; ảnh vẫn đọc ra 15 kỷ khác nhau.
- **Future Risk**: trung bình — rủi ro thật là **có người đọc bảng rồi tưởng cột `units` đang có
  tác dụng**, sửa nó, đo không thấy gì đổi, rồi kết luận sai về một chỗ khác. Bài test kể tên
  (`raBaoNhieu` phải BẰNG `[4]`) là thứ chặn điều đó: nó đỏ cả khi trục sống lại lẫn khi có ô chật
  tới mức không chia nổi.
- **Recommended Solution — BA HƯỚNG, ĐÃ ĐO, KHÔNG TỰ CHỌN**:
  (a) **HAI SÀN**: sàn "mắt còn đọc ra là căn nhà" (`3 × EYE_PIXELS / CELL_PIXELS` = 0,1875) cho
  mọi suất, cộng luật "mỗi khu phố phải giữ ÍT NHẤT một suất trên sàn mái" — một khuôn viên gồm
  nhà chính + nhà phụ, đúng đời thật. Đo được: sàn 0,1875 thì **cả 15 kỷ đạt đúng số đã khai**
  (trung bình 7,27 khối/ô). ⚠️ Chỉ chạy được cho kỷ hữu cơ (1–9); kỷ lưới (10–15) chia đều
  `cols × rows` nên hoặc tất cả đạt sàn mái hoặc không cái nào — cần một lưới KHÔNG ĐỀU (lô mặt
  phố sâu hơn lô phía trong, đúng dãy phố thật) thì mới áp được.
  (b) **THỬA TO HƠN MỘT Ô**: cho một khu phố trải trên nhiều ô của cùng một thửa `cityPlan`
  (`planParcelAt` đã có sẵn, hiện chưa ai dùng ngoài test). Đây là hướng đúng nhất về kiến trúc —
  ngoài đời một dãy phố là một THỬA chứ không phải một ô — nhưng nó đụng `dwellings.js` (một nhà
  dân = một ô) nên là một thay đổi có tầm ADR.
  (c) **CHẤP NHẬN**: bỏ cột `units`/`cols`/`rows` khỏi bảng, thay bằng một hằng số 4, và lấy mật
  độ từ số Ô của kỷ. Rẻ nhất, và trung thực nhất với thứ đang chạy.
  ❌ **KHÔNG nới `BLOCK_MAX_CELLS`** để lấy lại con số — nới là dựng lại đúng cái chồng lấn Đàm
  vừa bác (đo được: trần 2 ô ⇒ khối/ô 4,00–5,94, và nhà lại xuyên qua nhau).
- **Estimated Complexity**: (a) trung bình cho kỷ 1–9, cao cho kỷ 10–15 · (b) cao (tầm ADR) ·
  (c) thấp
- **Blocking Conditions**: (a) và (b) đều đổi HÌNH của mọi nhà dân ⇒ phải đi kèm một lượt quét 15
  kỷ + ảnh nhìn từ trên xuống để Đàm nghiệm thu bằng mắt; không phải việc làm kèm trong một phase
  khác. (b) còn liên đới ADR-007 (một nhà dân đổi từ "một ô" sang "một phần thửa" là đổi bộ sinh).
- **Review Trigger**: mỗi lần chạm `BLOCK_MAX_CELLS`, `MIN_UNIT_CELLS`, hoặc cột
  `units`/`cols`/`rows` của `blockStyle.js`.
- **Owner**: chưa giao · **Status**: MỞ

---


## #95 — Xây MỘT công trình phải qua BA cổng tiền tệ, cả ba đều là hàm của số phút — ĐÀM CHỌN, tôi không tự chọn

> Mở 2026-09-01 (vòng 23). Đây là phát hiện có điểm ĐƠN GIẢN HOÁ cao nhất cả vòng (8/10) nhưng
> cũng có điểm RỦI RO cao nhất (6/10), vì nó đụng vào kinh tế game — thứ Đàm đã tích luỹ 180 ngày.

- **Tên**: ba cổng tiền tệ chồng nhau trên cùng một hành động "xây một công trình"
- **Module**: `src/engine/constants.js` (RP · tài nguyên thô · tinh luyện) · `BuildingWorkshop.jsx`
- **Priority**: Medium · **Severity**: Medium
- **Impact**: Đàm phải hiểu và theo dõi BA loại tiền để làm MỘT việc, mà cả ba đều suy ra từ cùng
  một đại lượng gốc là SỐ PHÚT TẬP TRUNG. Ba con số cho một quyết định.
- **Số đo**: kho thô thừa **20.422 đơn vị** = 2.552 tinh luyện quy đổi, trong khi nâng trọn 5 công
  trình kỷ 8 lên cấp 3 chỉ tốn **180** ⇒ dư **14 lần**. (Đo trên fixture 180 ngày; công thức là
  thật, nhịp chơi là giả — xem cảnh báo ở đầu `make-fixture.mjs`.)
- **VÌ SAO CHƯA LÀM**: gộp hay bỏ một loại tiền là đổi luật KINH TẾ, không phải đổi hiển thị.
  Nguyên tắc an toàn của vòng 23 là *đơn giản hoá thứ Đàm THẤY và CẢM, đừng xoá thứ Đàm đã KIẾM
  ĐƯỢC* — mục này nằm ở phía bên kia ranh giới ấy.
- **⚠️ ĐÃ BÁC một "phương án đỡ phí"**: nối dây một nút "đổi 8 thô lấy 1 tinh luyện" (hàm
  `craftTier` từng tồn tại với 0 nơi gọi, đã xoá ở vòng 23). Chính con số 14 lần bác nó: bấm cái
  nút ấy một buổi là xoá sạch tính khan hiếm của tinh luyện. Việc nó chưa bao giờ có nút bấm là
  điều MAY, không phải điều thiếu.
- **Review Trigger**: khi Đàm thấy kho tài nguyên là thứ phiền chứ không phải thứ vui.
- **Owner**: Đàm quyết · **Status**: MỞ, chờ Đàm

## #94 — ✅ **ĐÃ XỬ LÝ (2026-09-02)** — `BREAK_START_DELAY_MS` chờ 3,2 giây ở ~82% số phiên KHÔNG có lễ mừng nào để che

> Mở 2026-09-01 (vòng 23). Tiền đề của hằng số này chết do HAI bản vá ở chỗ khác, không do ai
> động vào `timerSession.js`.

- **Tên**: độ trễ vào nghỉ là HẰNG SỐ trong khi thứ nó sinh ra để che là BIẾN
- **Module**: `src/engine/timerSession.js` (`BREAK_START_DELAY_MS`) · `src/hooks/useTimer.js`
- **Priority**: Medium · **Severity**: Low
- **Impact**: sau mỗi phiên, màn hình giữ trạng thái vừa-xong thêm 3,2 giây trước khi chuyển sang
  nghỉ. Chú thích của hằng số biện minh cho con số ấy bằng câu *"cả hai trường hợp người dùng đều
  đang nhìn hộp phần thưởng"* — câu ấy nay SAI ở ~82% số phiên.
- **Root Cause**: ADR-060 làm phiên thường thôi tự mở hộp phần thưởng; vòng 22 siết lễ mừng thành
  phố xuống CHỈ khi có công trình vừa xong. Đo `sessionsToComplete` qua 15 kỷ: trung bình **5,60
  phiên mỗi công trình ⇒ lễ mừng chỉ chạy ở 17,9% số phiên**. Trên fixture 588 phiên hoàn thành:
  **31,4 phút** chờ không còn lý do, trong 180 ngày.
- **Recommended Solution**: làm độ trễ THEO chính thứ nó che — 3.200 ms khi có lễ mừng, 500 ms khi
  không (500 là giá trị đã chạy đúng suốt thời kỳ trước khi có lễ mừng). Tức đổi một HẰNG SỐ thành
  một QUAN HỆ. Hai bài test hiện khoá quan hệ `BREAK_START_DELAY_MS >= GROWTH_MOMENT_MS` sẽ phải
  viết lại thành có điều kiện.
- **⚠️ VÌ SAO CHƯA LÀM**: (a) nó đụng thẳng luồng tự-vào-nghỉ, nơi một sai lầm sẽ **ÂM THẦM ăn bớt
  giờ nghỉ thật** của Đàm; (b) khoảnh khắc ấy **KHÔNG chụp ảnh kiểm được trên bản dev** — `ui`
  không nằm trong `partialize` nên không gieo được bằng `--fixture`, và cấm bấm "Bắt đầu" trên dev
  vì dùng chung một hàng Supabase với bản thật. **Đổi một hành vi đồng hồ mà không quan sát được
  nó là thứ phải hỏi Đàm trước.**
- **Blocking Conditions**: cần một cách quan sát được khoảnh khắc sau-phiên trên dev.
- **Owner**: Đàm quyết · **Status**: MỞ, chờ Đàm

## #93 — `buildCategoryAdvisor` (170 dòng) vẫn nằm trong file giao diện, và ĐÓ LÀ CÓ CHỦ ĐÍCH — đừng "dọn" nó xuống engine

> Mở 2026-08-30, ngay sau khi chuyển thành công `summarizeFocusStats` xuống
> `engine/statsFocus.js`. Ghi mục này để phiên sau **không mất công phân tích lại rồi đi tới cùng
> một kết luận** — hoặc tệ hơn, đi tới kết luận ngược rồi kéo màu sắc xuống tầng engine.

- **Tên**: khối sinh lời khuyên của tab Phân Loại còn ở `StatsDashboard.jsx`
- **Module**: `src/components/StatsDashboard.jsx` (`buildCategoryAdvisor`, ~170 dòng)
- **Priority**: Low · **Severity**: Low
- **Impact**: 170 dòng sinh **văn bản Đàm đọc** (giọng cố vấn + tối đa 4 khuyến nghị + 3 kịch bản
  + 3 tín hiệu) mà không có bài test nào.
- **Root Cause / VÌ SAO KHÔNG CHUYỂN**: nó **không phải logic thuần** — nó là một *bộ dựng
  view-model*. Đo được: mã màu dệt vào **7 chỗ** (`color: bestEfficiencyCat?.color ?? '#0ea5e9'`,
  `uncategorizedShare >= 20 ? '#ef4444' : '#64748b'`…), có cả `icon: 'NX'/'XP'/'CB'`, và nó gọi
  `fmtHours` — một hàm ĐỊNH DẠNG. Kéo nguyên khối xuống `engine/` là kéo bảng màu và hàm định
  dạng xuống theo, tức phá đúng ranh giới mà `PROJECT_STRUCTURE.md` đang giữ (*"engine = logic
  THUẦN, không JSX"*), và đi ngược bài học vừa rút ra ở `statsFocus.js` (*màu rời khỏi engine*).
- **Current Risk**: thấp — văn bản viết dè dặt ("Thử…", "Hãy thử…"), không phát biểu như kết luận.
  ⚠️ **Đã kiểm một nghi vấn và BÁC BỎ**: nhánh `Math.round(longestAvgCat.minutes /
  longestAvgCat.sessions)` không có gác chia-cho-0 trong khi nhánh kế bên có
  (`Math.max(sessions, 1)`) — bất đối xứng đáng ngờ, nhưng **không phải lỗi**:
  `computeCategoryStats` đã lọc `sessions > 0` ở engine, và `longestAvgCat` lọc lại lần nữa. Gác
  thừa, không phải gác thiếu.
- **Future Risk**: trung bình — nó gác cỡ mẫu ở `totalSess < 4`, LỎNG hơn nhiều so với các tín
  hiệu ở `gameMath.js` (cần 8–24 phiên). Tức nó có thể nói *"X mới là loại cho XP/phút tốt nhất"*
  dựa trên 4 phiên.
- **Recommended Solution**: **KHÔNG** chuyển nguyên khối. Nếu muốn test nó thì tách theo ĐÚNG
  ranh giới: phần *quyết định* (chọn kịch bản nào, ngưỡng nào) xuống engine dưới dạng trả về
  **khoá** (`'thieu-du-lieu'` · `'loang-vi-chua-phan-loai'` · …), còn phần *câu chữ + màu + icon*
  ở lại giao diện tra theo khoá ấy. Đó cũng là cách gỡ được cái gác cỡ mẫu quá lỏng.
- **Estimated Complexity**: trung bình (đụng văn bản người dùng đọc ⇒ phải chụp ảnh nghiệm thu).
- **Blocking Conditions**: không có — nhưng đây là việc cải thiện cấu trúc, không phải sửa lỗi.
- **Review Trigger**: khi có ai định "dọn nốt cho đồng bộ với `statsFocus.js`", hoặc khi cái gác
  `totalSess < 4` sinh ra một lời khuyên sai mà Đàm để ý thấy.
- **Owner**: chưa ai · **Status**: MỞ (có chủ đích)

## #92 — `no-unused-vars` đang TẮT cho MỌI file `.jsx`, nên code chết ở cả tầng giao diện là vô hình với lint

> Mở 2026-08-30, phát hiện khi đi tìm lý do ba bảng kỳ chết sống sót nhiều tháng trong
> `StatsDashboard.jsx`. ⚠️ **Rule ấy tắt KHÔNG phải do cẩu thả — đã kiểm và phải đính chính chẩn
> đoán đầu tiên của chính tôi.** Bật thử lên thì ra 45 lỗi, nhưng phần lớn là **BÁO NHẦM**:
> `DisasterModal.jsx` dùng `motion.` 6 lần mà vẫn bị tố "motion không dùng", vì luật gốc
> `no-unused-vars` không hiểu `<motion.div>` trong JSX. Tắt rule là một cách NÉ lỗi giả, không
> phải bỏ mặc.

- **Tên**: tầng `.jsx` không có cổng nào bắt biến/hằng/import chết
- **Module**: `eslint.config.js` dòng ~53 (`'no-unused-vars': 'off'` trong khối `files: ['**/*.jsx']`)
- **Priority**: Medium · **Severity**: Low (không gây lỗi chạy, nhưng làm rác tích lại im lặng)
- **Impact**: đo được trong đúng MỘT file (`StatsDashboard.jsx`, trước bản vá 2026-08-30): **3 hằng
  số chết** (`PERIODS` · `METRIC_OPTIONS` · `PERIOD_UNITS`), **1 hàm chết** 30 dòng
  (`summarizeSessionReviews`), **3 import chết** (`useReducedMotion` · `createRichTextPreview` ·
  `computeAllTimeStats`) — tất cả đều có TỪ TRƯỚC bản vá, không ai biết. Toàn repo: 45 lỗi thô,
  trong đó ~30 là `motion` báo nhầm ⇒ khoảng **15 lỗi THẬT** nằm rải ở ~10 file.
- **Root Cause**: dự án không cài `eslint-plugin-react`, nên không có `react/jsx-uses-vars` — luật
  duy nhất dạy `no-unused-vars` rằng một định danh xuất hiện trong JSX là ĐANG ĐƯỢC DÙNG.
- **Current Risk**: thấp. Rác không chạy thì không hỏng gì; nó chỉ làm file phình và làm phiên sau
  tưởng một hằng số chết là đang có tác dụng (đã suýt xảy ra: `PERIODS` có 5 kỳ trong khi màn hình
  chỉ hiện 3, đọc lướt sẽ tưởng hai kỳ kia đang ở đâu đó).
- **Future Risk**: trung bình, và **tăng dần theo thời gian** — mỗi phiên thêm một ít rác mà không
  có cổng nào đếm. Đây chính là cách `StatsDashboard.jsx` đi tới 4.901 dòng.
- **Recommended Solution**: thêm `eslint-plugin-react` (devDependency, không vào bundle) và bật
  đúng **một** luật của nó — `react/jsx-uses-vars` — rồi mở lại `no-unused-vars` cho `.jsx` với
  cùng `varsIgnorePattern: '^[A-Z_]'` mà khối `.js` đang dùng. Sau đó dọn ~15 lỗi thật.
  ⚠️ **ĐỪNG** bật `no-unused-vars` mà chưa có plugin ấy: 30 lỗi giả sẽ khiến người ta hoặc tắt lại
  rule, hoặc tệ hơn là đổi `varsIgnorePattern` thành một cái rây thủng để cho qua — tức mua một
  cổng xanh bằng cách bỏ hết răng của nó.
- **Estimated Complexity**: nhỏ (1 dependency + 2 dòng cấu hình), nhưng phần dọn 15 lỗi chạm nhiều
  file ở nhiều màn khác nhau nên phải đi kèm một lượt chụp ảnh nghiệm thu.
- **Blocking Conditions**: thêm một dependency là quyết định của Đàm, không phải của phiên AI —
  dự án có lịch sử CỐ Ý gỡ dependency cho nhẹ (Qwen/WebLLM, `@huggingface/transformers`,
  `@anthropic-ai/sdk`). Cần Đàm đồng ý trước.
- **Review Trigger**: lần tới có ai đụng `eslint.config.js`, hoặc khi một file `.jsx` vượt 3.000
  dòng và cần biết bao nhiêu phần trong đó là rác.
- **Owner**: chưa ai · **Status**: MỞ
- **Giảm nhẹ tạm thời (đã làm 2026-08-30)**: `src/components/statsPeriodWiring.test.js` đọc mã
  nguồn và cấm bảng kỳ chết quay lại **trong riêng màn Thống kê**. Nó KHÔNG thay được cái cổng
  toàn cục — nó chỉ bịt đúng chỗ vừa bị cắn, đúng tinh thần *"một bài học được ghi ra không chặn
  được gì; chỉ một bài TEST mới chặn được"*.

## #91 — Bài test canh khung bóng đổ CHÉP TAY hệ số `0,8` thay vì đọc từ mã, nên nó xanh kể cả khi mã dùng một `reach` khác

> Mở 2026-08-28, phát hiện trong lúc gộp nhánh Phase 19–21 vào `main`. Suýt cắn thật: phép gộp có
> một xung đột đúng ở dòng ấy (`main` chốt 0,75 · nhánh chốt 0,80), và **chọn nhầm bên thì bóng bị
> cắt cụt trên production mà bài test này vẫn xanh**.

- **Tên**: `sceneStats.test.js` viết cứng `const reachBong = 12 * 0.8` thay vì đọc `reach` đã dựng
- **Module**: `src/components/city/render3d/sceneStats.test.js` (~dòng 754) ↔ `sceneGraph.js`
  (`createCityScene`, `const reach = gridSize * 0.8`)
- **Priority**: Medium · **Severity**: Medium (khuyết tật nhìn thấy được, và im lặng tuyệt đối)
- **Impact**: khối đổ bóng xa tâm nhất nằm ở bán kính **9,2275** (kỷ 13, 120 phiên). Với 0,80 thì
  `reach` = 9,60 (dư 4%); với 0,75 thì 9,00 — **nhỏ hơn 9,2275**, tức nhà ở vành ngoài bị cụt bóng.
  Bài test tự tính `12 × 0,8 = 9,60` nên nó so khối xa nhất với một con số KHÔNG phải con số mã
  đang chạy: cả hai vế (không-được-thiếu và không-được-thừa) đều xanh ở cả hai giá trị.
- **Root Cause**: `reach` là biến cục bộ trong `createCityScene`, không export, nên bài test không
  có đường nào hỏi mã ngoài việc chép lại công thức. Đây đúng khuôn `#42` (*assert con số đã KHAI
  thay vì con số đã DỰNG*) và *một luật một công thức* — chỉ khác là ở đây bản chép nằm phía test.
  Chú thích ngay trên dòng ấy còn tự nhận *"không có bài test nào từng phát biểu quan hệ ấy"*,
  trong khi chính nó là bài test được giao việc đó.
- **Current Risk**: thấp ngay lúc này — hai bên đang khớp (mã 0,8 · test 0,8), đã kiểm bằng tay
  trong phép gộp 2026-08-28.
- **Future Risk**: **cao**. Bất kỳ ai siết `reach` cho "nét hơn" (đúng cám dỗ mà chú thích của
  `SHADOW_MAP_DESKTOP` kể là đã xảy ra một lần) sẽ không thấy gì đỏ lên, và triệu chứng là bóng
  cụt ở góc lưới — thứ chỉ lộ ra khi soi ảnh đúng kỷ, đúng giờ.
- **Recommended Solution**: export hệ số ra một hằng số có tên (`SHADOW_REACH_RATIO = 0.8`) đặt
  cạnh `SHADOW_MAP_DESKTOP`, cho `createCityScene` VÀ bài test cùng `import` nó. Rẻ, không đổi hành
  vi, và xoá hẳn khả năng hai bên trôi khỏi nhau.
- **Estimated Complexity**: rất thấp (một hằng số + hai lời gọi `import`)
- **Blocking Conditions**: không có
- **Review Trigger**: lần tới có ai đụng `sun.shadow.camera`, `SHADOW_MAP_DESKTOP`, hoặc bố cục
  thành phố làm khối lan xa hơn
- **Owner**: chưa ai nhận · **Status**: MỞ


- **✅ ĐÃ XỬ LÝ 2026-09-02.** Hằng số thành hàm: `breakStartDelayMs(hasCelebration)` — 3.200ms khi
  có lễ mừng, **500ms** khi không (500 là giá trị đã chạy đúng suốt thời kỳ trước khi có lễ mừng,
  không phải một con số mới chọn tay). `completeFocusSession` nay trả thêm `celebrates`, đọc CHÍNH
  hai biến mà `App.jsx` dùng để quyết định hiện lễ mừng (`activeNewlyBuilt` · `eraChanged`) chứ
  không chép lại điều kiện. Bài test ở `useTimer.test.js` đã đổi từ canh MỘT MỨC sang canh QUAN
  HỆ và chạy CẢ HAI nhánh — một nhánh thôi thì đổi hằng số nào cũng xanh.

---

## #90 — Chia ô thành khu phố làm 4 kỷ THẤP ĐI và kỷ 6 mất một phần ba chi tiết mái; cả hai đều bị chặn bởi bảng lịch sử của Phase 14

> Mở 2026-08-24 (Phase 20). Hai khuyết tật khác nhau nhưng **cùng một nguyên nhân gốc và cùng một
> vật cản**, nên ghi chung: chia một ô thành 4–10 đơn vị (ADR-052) làm mỗi đơn vị nhỏ đi, mà cả hai
> lời hứa bên dưới đều được phát biểu bằng một MỨC TUYỆT ĐỐI áp lên đơn vị.

- **Tên**: (a) 4/15 kỷ có khu phố THẤP HƠN căn nhà đơn cũ · (b) kỷ 6 mất **40,7%** chi tiết mái nhà dân
- **Module**: `src/engine/city3d/block.js` · `blockStyle.js` · `eraStyle.js` (cột `storey`) ·
  `rooftop.js` (`ROOFTOP_MIN_SPAN`) — khoá bằng `src/engine/city3d/block.test.js`
- **Priority**: Medium · **Severity**: Low (mỹ thuật; không đụng dữ liệu, không đụng hiệu năng)
- **Impact**: (a) bốn kỷ `[1, 2, 6, 7]` có khu phố thấp hơn căn nhà cũ, biên mỏng nhất **0,9508×**
  — tức thành phố ở những kỷ ấy trông lùn đi một chút so với trước ADR-052. (b) kỷ 6 rơi từ trên
  0,7 xuống **0,593** tỉ lệ đơn vị còn giữ được chi tiết mái. ⚠️ Con số TỔNG lại **TỐT LÊN**
  (389/432 = 90% so với 313/371 = 84%), nên đọc mỗi số tổng sẽ tưởng không có gì hỏng — đúng bài
  học `#22`: một con số gộp phải được tách ra trước khi đọc thành "ổn".
- **Root Cause**: cả hai là bẫy Phase 7D (*một mức tuyệt đối không diễn đạt được một quan hệ*) áp
  lên một đại lượng vừa bị chia nhỏ. (a) `storey` là chiều cao một tầng, khai theo kỷ ở
  `eraStyle.js` từ Phase 14; khi một ô thành 4–10 đơn vị thì mỗi đơn vị hẹp lại, mái ngắn theo
  (`pitch = max(0,08, roofPitch) × max(w,d)`) mà `storey` thì không biết chuyện đó. (b)
  `ROOFTOP_MIN_SPAN` là một bề ngang tối thiểu tuyệt đối; kỷ 6 khai `alley: 0,26` — ngõ rộng nhất
  bảng, đúng với làng Việt nhà thưa có vườn giữa — nên đơn vị của nó bị bóp nhỏ nhất bảng và nhiều
  đơn vị rơi xuống dưới ngưỡng ấy.
- **Current Risk**: thấp. Không ai mất dữ liệu; hai khuyết tật chỉ thấy được khi so trước/sau.
- **Future Risk**: trung bình — **cả hai đang được canh bằng danh sách kể tên**
  (`assert.deepEqual(truot, [1,2,6,7])` và `assert.deepEqual(duoiSan, [6])`), nên một kỷ thứ năm rơi
  xuống sẽ ĐỎ, mà một kỷ được chữa xong cũng ĐỎ. Đó là chủ đích: danh sách kể tên là cái hẹn giờ duy
  nhất chạy được (bài học Phase 10 Bước 1). Rủi ro thật là có người **nới sàn** cho hết đỏ.
- **Recommended Solution — ĐÃ ĐO SẴN, KHÔNG TỰ LÀM**: (a) nâng `storey` kỷ 2 (1,93 → 1,94), kỷ 6
  (1,4 → 1,5), kỷ 7 (1,7 → 1,75) là đủ cho ba kỷ. ⚠️ **Kỷ 1 thì HẾT CHỖ**: nó ở 1,95 trên trần 2,0
  mà cần 2,05, và `cols×rows` đã đúng `MIN_UNITS` nên không bớt được đơn vị nào nữa — kỷ 1 cần một
  quyết định khác (nới trần, hay chấp nhận). (b) đổi `ROOFTOP_MIN_SPAN` từ một MỨC sang một QUAN HỆ
  với bề ngang đơn vị — cùng cách đã chữa `eaves` ở Phase 7C. ❌ **KHÔNG hạ sàn 0,7** và ❌ **KHÔNG
  nới 0,95**: cả hai là bỏ răng cho cả 15 kỷ (phễu Phase 9A).
- **Estimated Complexity**: (a) thấp cho ba kỷ, trung bình cho kỷ 1 · (b) trung bình
- **Blocking Conditions**: (a) đụng bảng `storey` — bảng LỊCH SỬ của Phase 14, mỗi dòng buộc vào một
  công trình có thật, nên sửa nó là sửa một lời khai lịch sử chứ không phải vặn một cái núm; nằm
  ngoài phạm vi Phase 20. (b) liên đới `#77` (cùng nói về `ROOFTOP_MIN_SPAN`) — nên làm CÙNG LÚC,
  không vá riêng kỷ 6.
- **Review Trigger**: mỗi lần chạm `block.js`, `blockStyle.js`, cột `storey`, `ROOFTOP_MIN_SPAN`,
  **hoặc bảng `networkStyle.js`** (cột `parcels`/`minSide` — xem cập nhật bên dưới).
- **Owner**: chưa giao · **Status**: MỞ (đã thu hẹp hai lần, xem bên dưới)

### ⚠️ CẬP NHẬT 2026-08-24 (Phase 21) — CẢ HAI NỬA ĐỀU THU HẸP, VÀ CẢ HAI ĐỀU KHÔNG PHẢI DO AI ĐI CHỮA CHÚNG

Bảng số ở trên đo trên quần thể **432** ô của Phase 20. Phase 21 đổi quần thể hai lần (hợp nhất với
ADR-059 ⇒ 476 ô; rồi §5 nâng số thửa của bảy kỷ ⇒ **473** ô), và cả hai lần đều làm bảng dịch mà
**không ai đụng vào `storey`, `ROOFTOP_MIN_SPAN`, hay `blockStyle.js`**:

| | Phase 20 (432 ô) | hợp nhất (476 ô) | sau §5 (473 ô) |
|---|---|---|---|
| (a) kỷ THẤP ĐI | `[1, 2, 6, 7]`, tệ nhất 0,9508 | `[1, 7]`, tệ nhất 0,9386 | **`[5]`, tệ nhất 0,9942** |
| (b) kỷ mất >⅓ chi tiết mái | `[6]` (0,593) | `[]` (kỷ 6 = 0,893) | **`[]`** (kỷ 6 = 0,844) |
| (b) tổng ô còn chi tiết mái | 389/432 (90%) | 469/476 (98,5%) | **463/473 (97,9%)** |

⚠️ **ĐỌC ĐÚNG NGUYÊN NHÂN, ĐỪNG ĐỌC THÀNH "ĐÃ CHỮA".** Số thửa quyết ranh giới thửa → quyết tập ô
đường → quyết ô nào là nhà dân **và ô ấy là loại gì**. `workshop` là nguyên mẫu thấp-rộng cho cả hai
con số tệ nhất bảng, nên một kỷ có nhiều `workshop` hơn sẽ tụt ở CẢ HAI vế. Tức đây là **một hỗn hợp
nguyên mẫu dịch chỗ**, không phải một cơ chế được vá — bằng chứng: kỷ 5 vừa TỤT xuống dưới 1 trong
khi kỷ 1 và 7 tự khỏi, và kỷ 6 vừa TỆ ĐI (0,893 → 0,844) dù `alley` của nó không đổi một chữ số.
**Nguyên nhân gốc ở mục Root Cause vẫn nguyên vẹn**: hai lời hứa vẫn được phát biểu bằng MỨC TUYỆT
ĐỐI áp lên một đơn vị vừa bị chia nhỏ, nên chúng còn dịch mỗi lần bảng mạng đường đổi.

⚠️ **KHÔNG NỚI GÌ CẢ, VÀ CÓ SIẾT MỘT CHỖ.** Sàn 0,7 giữ nguyên · ngưỡng 1 giữ nguyên · cổng 0,95
giữ nguyên. Cửa sổ GHIM quanh kỷ tệ nhất dịch theo giá trị thật (0,85–0,95 → 0,80–0,90) vì nó là
một cái ghim chứ không phải một cái sàn. Trần trôi hình bao thì **SIẾT** 0,13 → 0,10 (giá trị thật
0,1259 → 0,0919) — siết một cái trần thì không bao giờ giấu được khuyết tật.

---


## #85 — `road-bend.mjs` đo trên một đại lượng mà ADR-059 đã thay: nó vẫn hỏi "tim đường lệch bao nhiêu trong ô", trong khi bản sắc nay nằm ở HÌNH DẠNG CỦA CẢ MẠNG

- **Tên**: công cụ đo độ lượn đường đứng sau một lần đổi trục
- **Module**: `scripts/archive/road-bend.mjs`
- **Priority**: Low · **Severity**: Low
- **Impact**: Công cụ vẫn CHẠY và vẫn đo đúng thứ nó nói (`lệch ÷ bề rộng lòng đường`), nhưng sau
  ADR-059 đại lượng ấy chỉ còn là một PHẦN nhỏ của câu hỏi *"con đường ở kỷ này có cong không"* —
  phần lớn hơn hẳn nằm ở tập ô đường (`roadPlan.js`), thứ công cụ này không nhìn tới. Ai chạy nó rồi
  đọc con số như một lời phán về bản sắc đường sẽ đọc thiếu.
- **Root Cause**: nó sinh ra ở ADR-058, khi tim-đường-lượn-trong-ô là cơ chế DUY NHẤT. ADR-059 thêm
  một tầng NẰM TRÊN nó mà không ai đi sửa lại phạm vi của công cụ — đúng hình dạng "một phép đo tự
  xưng là toàn thế giới trong khi nó chỉ nhìn 1/10 thế giới" (Bước C mặt nước, 2026-08-20).
- **Current Risk**: Thấp. Không cổng nào đọc nó; `networkStyle.test.js` và `cityLayout.test.js` canh
  hình dạng mạng bằng bất biến hình học riêng.
- **Future Risk**: Trung bình — một công cụ đo còn chạy được mà đã hết đúng-việc là loại nói dối khó
  thấy nhất (lần thứ 22 trong lịch sử dự án đều thuộc họ này).
- **Recommended Solution**: đổi TÊN dòng tổng kết cho nói đúng phạm vi (*"trong ô"*), rồi thêm một
  dòng thứ hai đo hình dạng mạng (số giao lộ · số vòng · số ô nằm ngoài bốn trục bàn cờ cũ).
- **Estimated Complexity**: Thấp.
- **Blocking Conditions**: Không có.
- **Review Trigger**: —
- **Owner**: phiên 2026-08-24 (chiều) · **Status**: ✅ **ĐÃ ĐÓNG cùng ngày**

### Đã xử lý thế nào (2026-08-24, ADR-059)

Thêm `hìnhMạng(era)` — một phép đo THUẦN trên `buildRoadPlan` (không đụng hình học đã dựng, không
cần Chromium) — và bảng nay in **hai nửa**: *trong ô* (`LỆCH÷BỀ RỘNG`) và *cả mạng* (ô · giao lộ ·
vòng · ô ngoài bốn trục bàn cờ cũ), kèm hai dòng tổng kết tách bạch với một chú thích cấm đọc gộp.

⚠️ **VÀ TRONG LÚC VÁ THÌ LỘ RA MỘT LỖI THỨ HAI, NẶNG HƠN, ĐÃ SỐNG TỪ ADR-058**: mục `--selftest`
*"kỷ 1 lượn nhất bảng"* đòi `uốnTB > 1.01` — tức **độ uốn khúc** (sinuosity), đúng cái đại lượng mà
khối chú thích ở ĐẦU CHÍNH FILE ẤY đã ghi rõ là SAI cho câu hỏi này (nó tăng theo bình phương độ dốc
nên gần như mù với một con đường lượn biên độ nhỏ mà dài). Đo ra: kỷ 1 lệch **0,734 lần bề rộng**
mà sinuosity chỉ **1,0083** ⇒ đối chứng **ĐỎ trên một mạng đường hoàn toàn lành**. Một công cụ có
`--selftest` đỏ thì còn tệ hơn không có công cụ. Nay nó hỏi `tỉSốTB`, đúng đại lượng mà bảng in ra.
**Bài học: một đối chứng phải hỏi cùng đại lượng mà bảng công bố — nếu file tự bác một đại lượng
trong chú thích thì đừng để `--selftest` của chính nó vẫn dùng đại lượng ấy.**

---

## #87 — ~~Báo cáo tuần VẪN tự bật sáng thứ Hai~~ ✅ **ĐÃ ĐÓNG 2026-08-27 (ADR-061)**

- **Tên**: `weeklyReportOpen` tự bật (không do Đàm bấm) và mở một hộp thoại toàn màn hình.
- **Module**: `src/App.jsx` (`OverlayStack`) · `src/store/gameStore.js` (`checkWeeklyReport`) ·
  `src/components/WeeklyReportModal.jsx`.
- **Priority**: Low · **Severity**: Low.
- **Impact**: sáng thứ Hai đầu tiên trong tuần, Đàm mở app và bị chặn bởi một bản tổng kết mà anh
  không xin. Đúng loại làm phiền mà ADR-060 sinh ra để dẹp — nhưng nó là bản tổng kết chứ không
  phải một phần thưởng, nên nó nằm ngoài phạm vi bảy đường trao thưởng của phase này.
- **Root Cause**: `checkWeeklyReport` đặt `weeklyReportOpen: true` + `weeklyReportMode: 'previous'`
  vào sáng thứ Hai. Có sẵn hai chế độ (`'previous'` = tự bật · `'current'` = Đàm bấm ở thanh bên),
  nên phân biệt "tự bật" với "được gọi" là chuyện SẴN CÓ, không cần thêm cờ mới.
- **Current Risk**: thấp — mỗi tuần đúng một lần.
- **Future Risk**: nó là ngoại lệ duy nhất còn lại; ngoại lệ nào cũng là chỗ để ngoại lệ thứ hai
  bám vào (*"nếu báo cáo tuần được phép tự bật thì cái này cũng được"*).
- **Recommended Solution**: `showWeeklyModal = weeklyReportOpen && (weeklyReportMode === 'current'
  || detail === 'weekly')`, và chế độ `'previous'` sinh một thẻ toast bấm-để-mở.
- **⚠️ ĐIỀU KIỆN BẮT BUỘC trước khi làm** (đây là lý do phase này KHÔNG làm luôn): `dismissWeeklyReport`
  ghi `lastWeeklyReportDate` ⇒ **đóng một lần là mất báo cáo của cả tuần**. Một toast tự tắt sau 4
  giây mà cũng gọi hàm ấy thì lỡ một cái toast = mất báo cáo. Phải tách "đã xem" khỏi "đã bỏ qua"
  TRƯỚC, nếu không bản vá đổi một phiền toái nhỏ lấy một mất mát thật.
- **Estimated Complexity**: Small (nếu đã tách xong hai trạng thái trên); Medium nếu tính cả việc tách.
- **Blocking Conditions**: không có blocker kỹ thuật; chỉ chờ quyết định của Đàm về đánh đổi ở trên.
- **Review Trigger**: khi Đàm nói báo cáo tuần làm phiền, hoặc khi có mục thứ hai xin được tự bật.
- **Owner**: chưa giao · **Status**: ✅ **ĐÓNG 2026-08-27** (ADR-061) — cùng ngày mở.
- **Đã làm gì**: tách trường theo đúng "ĐIỀU KIỆN BẮT BUỘC" ở trên trước khi đụng vào tính năng.
  `lastWeeklyReportDate` = *đã MỜI* · `lastWeeklyReportSeenDate` = *đã XEM*. `checkWeeklyReport`
  nay chỉ bật `ui.weeklyReportPending` (một thẻ toast, nguồn `weekly` trong `rewardFeed.js`); hộp
  thoại chỉ mở khi Đàm bấm. Toast hết 4 giây gọi `dismissWeeklyReportToast` — **không ghi ngày nào**.
- **Lưới an toàn** (thứ khiến bản vá này KHÔNG phải là đánh đổi mà mục này cảnh báo): chấm "chưa
  xem" ở nút *Báo cáo tuần* trên thanh bên, do `lastWeeklyReportSeenDate` điều khiển nên nó KHÔNG
  hết hạn; và cú bấm đầu tiên trong tuần mở thẳng bản `'previous'` — đúng thứ hộp thoại tự bật đưa ra.
- **Khoá bằng test**: `src/store/gameStore.weeklyReport.test.js` (9 bài, 7 phép thử ngược đã đỏ),
  trong đó có bài dựng lại chính khuyết tật cũ và ĐÒI nó phải đỏ.
- ⚠️ **BỔ SUNG cùng ngày — lưới an toàn phải căng ở CẢ HAI nền tảng.** Cái chấm ở trên lúc đầu chỉ
  có ở thanh bên desktop (`hidden md:flex`), mà **trước ADR-061 iPhone không có nút nào mở báo cáo
  tuần** — nút duy nhất nằm đúng ở cái thanh bên ấy. Trên iPhone, hộp thoại tự bật vì thế không
  phải cách báo cáo *xuất hiện* mà là cách nó *tồn tại*; lưới căng ở nền tảng kia thì lỡ toast vẫn
  là mất báo cáo cả tuần. Đã thêm mục **"Báo cáo tuần" vào menu "Thêm" trên điện thoại**, mang cùng
  chấm `weeklyReportUnseen`, và khoá bằng `rewardToastWiring.test.js` (đòi cả lối vào lẫn cái chấm
  ở CẢ HAI thanh điều hướng). **Bài học**: gỡ một cơ chế rồi thay bằng "một lưới an toàn" thì phải
  liệt kê MỌI đường vào hiện có trước — một lưới chỉ căng một bên là một lời hứa đúng một nửa.

---

## #88 — `soiVetRach` bỏ sót một vết rách mắt thường nhìn ra ngay

- **Tên**: cổng chống-ảnh-rách của `city-preview.mjs` báo LÀNH cho một tấm ảnh rách rõ rệt
- **Module**: `scripts/city-preview.mjs` (`soiVetRach`, `VET_RACH_SAN`, `VET_RACH_HE_SO`)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: Dựng `--era 8 --hour 12 --width 1500` (3 dải ngang) ra một tấm ảnh mà **một mảng chữ
  nhật ở góc trên phải thuộc về một khung hình khác** — nhìn là thấy ngay. `soiVetRach` trả về
  `hong: false` nên ảnh được ghi ra bình thường, và một phép đo chênh lệch điểm ảnh trên nó cho ra
  **21,38% điểm ảnh vượt ngưỡng mắt, lệch tối đa 222** — một bộ số hoàn toàn bịa, đủ thuyết phục để
  kết luận sai về một bản vá mỹ thuật. Dựng lại lần hai thì sạch (md5 khác), xác nhận là vết rách
  chứ không phải nội dung thật.
- **Root Cause**: chưa truy. `soiVetRach` quét **mép HÀNG** (`TECH_DEBT #52` cố ý làm vậy để không
  phụ thuộc mốc chia dải). Vết rách lần này có một mép **DỌC** rõ rệt ở giữa khung — một phép quét
  chỉ nhìn mép ngang có thể mù với nó nếu hai dải chỉ khác nhau ở một PHẦN bề rộng chứ không khác
  trên cả hàng. Cần đo lại trước khi tin lời giải thích này.
- **Current Risk**: Trung bình — ảnh rách chỉ xảy ra ở ảnh nhiều dải (`--width` lớn hoặc `--sweep`),
  tức đúng những ảnh dùng để soi CHI TIẾT NHỎ, nơi một mảng sai dễ bị đọc thành "chi tiết mới".
- **Future Risk**: Trung bình. Mỗi phase mỹ thuật đều dựng ảnh cận cảnh để nghiệm thu.
- **Recommended Solution**: bổ sung một vế quét mép **DỌC** cho `soiVetRach` (cùng khuôn: so cột kề
  nhau, tìm mép nổi bật hẳn so với phân bố), và hiệu chuẩn ngưỡng trên chính tấm ảnh rách này —
  **giữ lại nó làm đối chứng nhốt-ca-hỏng**, đừng chỉ nới ngưỡng.
- **Estimated Complexity**: Low–Medium (hàm đã thuần và đã có test).
- **Blocking Conditions**: không có.
- **Review Trigger**: lần tới có ai dựng ảnh nhiều dải để nghiệm thu chi tiết nhỏ.
- **Owner**: chưa ai · **Status**: MỞ (2026-08-27)

## #86 — 137 nút tự vẽ trên 28 file KHÔNG đọc token skin, và `ActionButton` không nhận nổi chúng

- **Tên**: nút hành động của app tồn tại hai thế giới — `ActionButton` (nay đọc token, đúng ở cả 10
  tổ hợp skin × chế độ) và 137 thẻ `<button>`/`<motion.button>` tự vẽ bằng lớp Tailwind chốt cứng.
- **Module**: 28 file dưới `src/components/` (đậm nhất: `StatsDashboard.jsx` 38 · `PomodoroEngine.jsx`
  35 · `Settings.jsx` 15 · `NotificationCenter.jsx` 8 · `SkillTree.jsx` 11)
- **Priority**: Medium · **Severity**: Low
- **Impact**: Những nút ấy chốt cứng bảng màu **editorial** — `rgba(201,100,66,…)` (terracotta),
  `border-emerald-200`, `bg-[rgba(244,242,236,0.82)]` — và rẽ nhánh theo `lightTheme`, tức chúng chỉ
  đúng ở **2 trong 10** tổ hợp skin × chế độ. Đây ĐÚNG cái bệnh vừa chữa cho `ActionButton`
  (2026-08-27), chỉ là ở 137 chỗ khác. Chưa ai kêu vì cả 5 skin đều dùng chung một họ màu ấm.
- **Root Cause**: `ActionButton` có `sizeMap` là một bộ **ĐÓNG gồm 3 cỡ**, cả ba đều `text-lg px-7`
  và `rounded-2xl` — chúng được đo riêng cho HÀNG NÚT LỚN của đồng hồ. Mọi ứng viên khác đều lệch ít
  nhất một chiều, nên chuyển sang là ĐỔI HÌNH DẠNG chứ không phải hợp nhất. Đã soi từng cái:
  | Chỗ | Vì sao KHÔNG chuyển được |
  |---|---|
  | `PomodoroEngine.jsx:1772` "Thu nhỏ" | `position: fixed` + `style` safe-area riêng, chữ 11px, `rounded-full` |
  | `PomodoroEngine.jsx:2023` chọn chế độ | có TRẠNG THÁI ĐƯỢC CHỌN + con trỏ trượt `layoutId`; `ActionButton` không có khái niệm "đang chọn" |
  | `PomodoroEngine.jsx:2241` chip phân loại | màu lấy từ dữ liệu người dùng qua `style` inline |
  | `PomodoroEngine.jsx:2292 · 2307` đạt/không đạt | cặp hai lựa chọn có trạng thái chọn, `flex-1 rounded-full` |
  | `PomodoroEngine.jsx:2395 · 2406` Quay lại / Hủy phiên | `rounded-full px-4 py-2.5 text-sm` — chuyển thì thành `rounded-2xl px-7 py-3.5 text-lg` |
  | `PomodoroEngine.jsx:2524` "Thêm" | `px-4 py-2 text-sm`, nằm cùng hàng với một ô nhập — cỡ `default` sẽ phá hàng |
  | `AppErrorBoundary.jsx:115 · 128` | màn hình lỗi CỐ Ý không phụ thuộc component nào khác (nó chạy khi cây React đã hỏng) |
  | `CoachChat` · `CoachOffline` · `Achievements` · `RichText` · `SkillTree` · `StatsDashboard` | `ActionButton` KHÔNG được export — nằm trong `PomodoroEngine.jsx` (2.598 dòng); dùng xuyên file phải export hoặc tách ra file riêng |
- **Current Risk**: Thấp — 5 skin hiện tại cùng họ màu ấm nên mã cứng terracotta chưa chọi rõ với
  skin nào. Rủi ro nhảy lên NGAY khi có một skin lệch tông (xanh/lam/tím).
- **Future Risk**: Medium. Mỗi phase thêm nút mới lại nhân thêm một chỗ phải sửa tay.
- **Recommended Solution**: theo THỨ TỰ, đừng làm ngược: **(1)** tách `ActionButton` ra
  `src/components/ActionButton.jsx` và export (thuần trình bày, không đọc store nữa từ 2026-08-27 nên
  tách là an toàn); **(2)** thêm các mục `sizeMap` còn thiếu (`dialog` = `px-4 py-2.5 text-sm`,
  `inline` = `px-4 py-2 text-sm`) — đúng lối mà chú thích `sizeMap` đã chỉ, KHÔNG chồng lớp qua
  `className`; **(3)** thêm `shape` (`pill` | `card`) vì `rounded-2xl` đang chốt cứng trong khuôn;
  **(4)** thêm khái niệm "đang chọn" HOẶC tách hẳn một `ToggleButton` riêng cho nhóm có trạng thái —
  đây là nhóm đông nhất và KHÔNG nên nhồi vào `ActionButton`.
- **Estimated Complexity**: Medium–High (đụng 28 file; phải chụp ảnh đối chiếu từng màn hình).
- **Blocking Conditions**: không có blocker kỹ thuật; chỉ cần một phiên riêng đủ dài, vì rủi ro thật
  nằm ở việc ĐỔI BỐ CỤC 137 chỗ chứ không ở việc viết mã.
- **Review Trigger**: khi thêm một skin **lệch tông** với họ ấm hiện tại, hoặc khi ai đó báo "nút chỗ
  này không đổi màu theo skin".
- **Owner**: chưa ai · **Status**: MỞ (mở 2026-08-27, cùng phiên viết lại `ActionButton`)

## #84 — Kỷ 1 và kỷ 2 THẤP ĐI sau khi ô nhà dân thành khu phố, và mọi cần gạt đã cạn

- **Tên**: hai kỷ không giữ được lời hứa "chia khu phố xong thành phố không thấp đi" (ADR-052)
- **Module**: `src/engine/city3d/block.js` + `blockStyle.js` (kỷ 1 · 2)
- **Priority**: Low · **Severity**: Low
- **Impact**: Chiều cao trung bình của nhà dân ở kỷ 1 còn **0,9584** lần bản một-căn-một-ô (kỷ 2:
  **0,9669**) — tức thấp đi ~4%, dưới ngưỡng mắt ở khung toàn cảnh nhưng vẫn là một lời hứa bị vỡ.
  Được ĐẾM TƯỜNG MINH bằng `THAP_DI = [1, 2]` trong `block.test.js`: kỷ thứ ba rơi vào thì đỏ, mà
  một trong hai kỷ này được chữa thì cũng đỏ.
- **Root Cause**: biên gốc của hai kỷ ấy xưa nay đã rất mỏng (đo lại được **1,0072** và **1,0078**),
  nên chỉ cần chia ô thành nhiều đơn vị nhỏ hơn là mất. Kỷ 1 đã đứng đúng `MIN_UNITS = 4` (không chia
  ít hơn được nữa) và `storey` đã kịch trần 2,0; kỷ 2 thì cách chữa duy nhất còn lại sẽ mâu thuẫn với
  chính `note` lịch sử của nó (xóm thợ Deir el-Medina — nhà một tầng, mái bằng).
- **Current Risk**: Thấp — 4% nằm dưới ngưỡng mắt ở khung mặc định (một căn nhà kỷ 1 cao chừng 40–60
  điểm ảnh, 4% là 2 điểm ảnh).
- **Future Risk**: Thấp, nhưng sẽ TĂNG nếu có phase sau chia nhỏ đơn vị thêm lần nữa.
- **Recommended Solution**: nếu muốn chữa thì phải chữa ở tầng BẢNG chứ không ở phép kẹp — cho kỷ 1
  và 2 một `massScale` riêng cho nhà dân (tách khỏi `massScale` của kỳ quan), đúng khuôn "một trường
  gánh hai việc" đã tách sáu lần trước. Tuyệt đối KHÔNG hạ `MIN_UNITS` để lấy lại chiều cao: đó là
  mua một con số bằng cách bỏ chính thứ ADR-052 sinh ra để có.
- **Estimated Complexity**: Trung bình (một trục mới trong bảng, phải buộc vào `country` và có test).
- **Blocking Conditions**: Không có.
- **Review Trigger**: khi `MIN_UNITS` được đổi, hoặc khi có phase chia nhỏ đơn vị nhà dân lần nữa.
- **Owner**: chưa ai · **Status**: 🔴 mở

---

## #83 — Ngưỡng "lượn bao nhiêu thì mắt đọc ra" CHƯA được hiệu chuẩn bằng một phép dựng ảnh

- **Tên**: mốc `0,25 lần bề rộng` trong `scripts/archive/road-bend.mjs` là một con số LÀM VIỆC, không phải
  một con số đã đo
- **Module**: `scripts/archive/road-bend.mjs` (dòng tổng kết `N/15 kỷ có đường lượn ĐỌC RA ĐƯỢC`)
- **Priority**: Low · **Severity**: Low
- **Impact**: Con số `3/15 kỷ` mà công cụ in ra phụ thuộc hoàn toàn vào mốc ấy. Đặt 0,20 thì thành
  `6/15`, đặt 0,30 thì thành `2/15` — tức một câu kết luận về CHẤT LƯỢNG đang treo trên một con số
  chưa ai chứng minh. Bản thân phép đo (`lệch ÷ bề rộng`) thì đã đúng đại lượng và có `--selftest`
  bảo chứng; chỗ chưa chắc chỉ là cái MỐC.
- **Root Cause**: dự án có hai con số đã hiệu chuẩn cho MẮT — `CELL_PIXELS = 64` và `EYE_PIXELS = 4`
  (bề rộng nhỏ nhất còn đọc ra được), cùng `ngưỡng mắt 12/255` cho MÀU (hiệu chuẩn ở Phase 3Y).
  Nhưng **chưa có con số nào cho "một đường cong lệch bao nhiêu thì đọc ra là cong"** — đó là một
  đại lượng khác hẳn hai cái kia, và tôi đã chọn 0,25 bằng suy luận chứ không bằng phép dựng ảnh.
- **Current Risk**: Thấp. Không có mã sản phẩm nào đọc con số này; nó chỉ nằm trong một dòng tổng
  kết của công cụ đo. Mọi cổng THẬT (`networkStyle.test.js`) đều canh bằng bất biến hình học, không
  canh bằng mốc này.
- **Future Risk**: Trung bình — đúng hình dạng cái phễu Phase 9A: một ngưỡng đặt "cho chắc" rồi ở
  lại mãi, và phiên sau sẽ trích `3/15` như thể đó là một phép đo.
- **Recommended Solution**: hiệu chuẩn đúng cách dự án đã hiệu chuẩn ngưỡng mắt 12: dựng một loạt
  ảnh CÙNG một kỷ với biên độ lượn tăng dần (0,05 · 0,10 · 0,20 · 0,40 · 0,80 lần bề rộng), đo phần
  trăm điểm ảnh lệch quá ngưỡng mắt giữa mỗi bản và bản thẳng, rồi lấy mốc ở chỗ con số ấy vượt
  khỏi nền nhiễu. Sau đó ghi con số kèm ĐÚNG lệnh đã sinh ra nó (luật §3-Q2 của `PERFORMANCE.md`).
- **Estimated Complexity**: Thấp (một vòng ~6 lần dựng ảnh, ~3 phút máy).
- **Blocking Conditions**: Không có.
- **Review Trigger**: khi có ai định trích con số `N/15 kỷ` vào một báo cáo, HOẶC khi một phase sau
  dùng nó để quyết định có nên chỉnh `bend` của một kỷ hay không.
- **Owner**: chưa ai · **Status**: 🔴 mở

---

## #82 — Bộ khớp cư dân chỉ có MỘT trục quay, nên hông không lắc ngang và đai hông không xoay

- **Tên**: hai chiều chuyển động của người đi bộ bị bỏ lại vì bộ khớp chỉ quay quanh một trục
- **Module**: `src/engine/city3d/human.js` (`joint` của từng khối) · `humanPose.js` (`poseAt`) ·
  `render3d/sceneGraph.js` (phép ghép ma trận)
- **Priority**: Low · **Severity**: Low
- **Impact**: Đo được, và đã CỐ Ý bỏ trong ADR-056. Người đi bộ thật có **6 chiều** ở đai hông
  (Inman): gập/duỗi, lắc ngang (pelvic list, biên độ ~5°), xoay quanh trục đứng (~8°). ADR-056 làm
  được 4 chiều mới nhưng **hai chiều còn lại đòi một trục quay THỨ HAI** ở khớp hông và khớp đai
  hông. Hệ quả nhìn thấy được ở cận cảnh: hai chân luôn nằm trong đúng một mặt phẳng đứng, nên
  người vẫn hơi "đi trên đường ray"; ở khung toàn cảnh thì **không đọc ra** (`TECH_DEBT #80`).
- **Root Cause**: `sceneGraph.js` xoay mỗi khối bằng **một quaternion quanh MỘT trục ngang duy
  nhất** (mặt phẳng đi tới) — một quyết định của ADR-053 để giữ phép ghép ma trận rẻ và để
  `partCornersAt` (tầng thuần) tái lập được ĐÚNG phép biến đổi ấy. Thêm trục thứ hai thì **hai
  chỗ** phải cùng đổi, mà chúng là hai công thức phải khớp nhau từng chữ số (có test đối chiếu
  chéo canh).
- **Current Risk**: Thấp. Không có gì hỏng; đây là một chiều chân thực còn thiếu, không phải một
  khuyết tật.
- **Future Risk**: Trung bình nếu có phase nào đưa camera lại gần cư dân hơn nữa (`TECH_DEBT #80`
  / ADR-034 mở đường ấy) — lúc đó "đi trên đường ray" sẽ thành thứ đọc ra được.
- **Recommended Solution**: cho `poseAt` trả về **hai** góc mỗi khớp (`pitch` quanh trục ngang,
  `roll` quanh trục đi tới) rồi ghép `quatPitch × quatRoll` ở CẢ `sceneGraph.js` lẫn
  `partCornersAt`. ⚠️ Phải giữ **ràng buộc bàn chân không trượt** làm cổng: mọi biên độ mới phải
  đi qua đúng bài test 135 tổ hợp kỷ × kiểu đi đã có, và phải kèm một đối chứng dựng lại bản hỏng.
- **Estimated Complexity**: Trung bình (hai công thức phải khớp nhau, cộng một vòng thử ngược đầy
  đủ để chứng minh bài test có răng ở chiều mới).
- **Blocking Conditions**: Không có. Hoãn vì ở khung mặc định nó không đổi được điểm ảnh nào.
- **Review Trigger**: khi khung cận cảnh (`FOCUS_VIEW_DISTANCE`) được kéo gần hơn nữa, HOẶC khi có
  người kêu cư dân "đi cứng" sau ADR-056.
- **Owner**: chưa ai · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-24 (ADR-057)** — và cách đóng không giống
  cách đã kê đơn ở trên, nên đọc kỹ đoạn này. "Recommended Solution" đề xuất **thêm một trục quay
  thứ hai rồi đi bù** cho mọi thứ nó làm xê dịch. Cách thật sự dùng là **đảo chiều nhân quả**: chân
  giải bằng KHỚP NGƯỢC (đặt bàn chân trước, suy ngược ra góc đùi và góc gối), nên bàn chân thành
  ĐẦU VÀO thay vì ĐẦU RA. Từ lúc đó, cả ba mục bị cấm (lắc ngang · nghiêng đai hông · xoay đai
  hông) **biến mất cùng lúc và miễn phí** — không một số hạng bù nào, vì cái chân tự lo phần còn
  lại. ⇒ **Bài học**: khi một mục nợ liệt kê nhiều hạn chế mà mọi hạn chế đều quy về cùng một câu
  *"vì X là kết quả chứ không phải đầu vào"*, hãy hỏi có đảo được X không, thay vì đi bù từng mục.
  Trục thứ hai (`b`) vẫn được thêm đúng như kê đơn, và cổng "bàn chân không trượt" vẫn giữ nguyên
  vai trò — nay chạy trên **210 tổ hợp** (14 kiểu × 15 kỷ) và đo được **4,86 × 10⁻¹⁷ ô**.

---

## #81 — Mũ CÓ CHỎM thừa hưởng phép phóng đại của cái đầu, nên rộng ~1,5 lần vai thay vì ~0,7 như đời thật

- **Tên**: cái đầu to gấp 1,54 lần đời thật kéo theo mọi thứ đội lên nó
- **Module**: `src/engine/city3d/human.js` (`headgearPieces`, kiểu `brim`) · `humanDims` (`headW`)
- **Priority**: Low · **Severity**: Low
- **Impact**: Đo được. `headW = 0,20 × chiều cao` trong khi người thật ~0,13 ⇒ **phóng đại 1,54
  lần**, và đó là một quyết định CÓ CHỦ Ý về khả năng đọc (ở 14 điểm ảnh, một cái đầu đúng tỉ lệ
  chỉ còn 1,8 điểm ảnh). Nhưng mũ vành cứng phải có **chỏm lồng vừa sọ**, nên bề rộng của nó bị
  cột chặt vào `headW`: 1,9 `headW` = 0,38 chiều cao = **1,52 lần bề ngang vai**, trong khi một
  chiếc mũ phớt thật rộng 30 cm trên vai 45 cm = **0,67 lần**. Sai số **2,3 lần**, ở 3 kỷ (7 · 8 ·
  11). Trên ảnh dựng, kỷ 11 (mũ nỉ SẪM) đọc ra là một mảng tối che kín phần thân trên.
- **Root Cause**: một đại lượng đã bị phóng đại có chủ ý (`headW`) được dùng làm **hệ quy chiếu**
  cho một đại lượng khác, nên phép phóng đại được thừa kế mà không ai viết ra. Từng con số riêng
  lẻ đều "đúng theo vật thật" (chỏm 1,18 `headW`, vành gấp 1,61 lần chỏm — cả hai đều là tỉ lệ của
  một chiếc mũ có thật), nên không có chỗ nào để mà đỏ lên.
- **Current Risk**: Thấp. Nó chỉ đọc được ở khung cận cảnh, và ở đó nó vẫn ra "người đội mũ rộng
  vành" chứ không ra một vật lạ.
- **Future Risk**: Trung bình nếu thêm kỷ nào đội mũ rộng hơn nữa (mũ cói Trung Hoa, mũ cao bồi),
  hoặc nếu ngày nào cư dân được vẽ to hơn trên khung (`TECH_DEBT #80`) — lúc đó sai số 2,3 lần sẽ
  chuyển từ "hơi to" sang "sai".
- **Recommended Solution**: **KHÔNG phải thu nhỏ cái mũ** — đã thử ngày 2026-08-23 và bài test
  *"mũ vành phải đội vừa cái đầu"* bắt được ngay (vành 1,38 `headW` cho ra chỏm 0,86 `headW`, hẹp
  hơn cả cái sọ). Sửa gốc là **giảm phóng đại của `headW`** (0,20 → ~0,17) rồi bù khả-năng-đọc
  bằng tương phản màu thay vì bằng kích thước. ⚠️ Cái giá: `headW` nằm trong hầu hết mọi kích
  thước của bảng đội đầu và trong `humanIdentity.test.js`, nên đây là một lần **hiệu chuẩn lại cả
  bảng**, không phải một lần sửa số.
- **Estimated Complexity**: Trung bình (một hằng số, nhưng ripple qua 7 kiểu đội đầu + hai bộ chấm
  bản sắc + bảng ngưỡng mắt).
- **Blocking Conditions**: Không có. Hoãn vì `TECH_DEBT #80` nói rằng ở khung mặc định KHÔNG ai
  nhìn thấy khác biệt này, nên sửa nó bây giờ là tiêu công cho một thứ chưa ai thấy.
- **Review Trigger**: khi cư dân được vẽ lớn hơn trên khung mặc định, HOẶC khi có kỷ thứ tư khai
  `headgear: 'brim'`.
- **Owner**: chưa ai · **Status**: mở

---

## #80 — Cư dân chiếm 0,29% khung hình ở góc mặc định, nên MỌI chi tiết cơ thể chỉ đọc được khi camera bay tới gần

- **Tên**: chi tiết cơ thể là phần thưởng của cận cảnh, không phải của toàn cảnh
- **Module**: `src/engine/city3d/human.js` · `humanShape.js` · `sceneGraph.js` (cụm cư dân)
- **Priority**: Medium · **Severity**: Low
- **Impact**: Đo ngày 2026-08-23 trên cặp ảnh `--era 1 --hour 12 --sessions 80` (1100×700, ngưỡng
  mắt 12/255), so commit `f5a4e11` với bộ 7 khuôn: **cả khung hình chỉ 0,2% điểm ảnh đổi quá ngưỡng
  (lệch trung bình 0,09)**, trong khi **riêng trong mặt nạ cư dân là 57,5% (lệch trung bình
  22,26)**. Mặt nạ ấy chỉ có 2.198 điểm ảnh = **0,29% khung**. Nói cách khác: bản vá đổi rất mạnh
  đúng chỗ nó sống, và không thể dịch nổi con số toàn khung vì chỗ ấy quá nhỏ.
- **Root Cause**: KHÔNG phải cơ thể thiếu chi tiết. Cư dân cao **12–30 điểm ảnh** ở góc mặc định
  (`human-strip.mjs` in ra bảng này mỗi lần chạy), nên mọi thứ nhỏ hơn một bộ phận đều rơi xuống
  dưới `EYE_PIXELS = 4`. Cùng gốc với `TECH_DEBT #41` (chi tiết mái) và với bài học Phase 11: *cả
  thành phố quá nhỏ trong khung hình*.
- **Current Risk**: Thấp — đã có ADR-034 (chạm vào công trình thì camera bay tới), và ở khoảng cách
  ấy chi tiết đọc ra rõ.
- **Future Risk**: Trung bình theo nghĩa **ngân sách**: mỗi phase sau dễ lặp lại đúng sai lầm của
  Phase 11 (tiêu 110.076 tam giác lên mái rồi mới biết bản quét không phân biệt nổi). Ở đây chi phí
  đã trả là +2…+5 lệnh vẽ và ×2…×3 tam giác cư dân, và nó ĐƯỢC BIẾT TRƯỚC — nhưng lần sau thì chưa
  chắc ai đọc lại mục này.
- **Recommended Solution**: hai hướng, và chúng khác hẳn nhau: (a) **nếu muốn cư dân đọc được ở
  toàn cảnh** thì đó là bài toán KHUNG HÌNH (`TECH_DEBT #73` — camera bị buộc cứng vào
  `CITY_GRID_SIZE`), không phải bài toán mô hình; (b) **nếu chấp nhận nó là phần thưởng cận cảnh**
  thì phải làm cho việc bay tới gần dễ xảy ra hơn (hôm nay phải chạm vào một công trình, chứ không
  chạm được vào một người).
- **Estimated Complexity**: (a) Lớn — đụng camera, ảnh hưởng mọi phép đo mỹ thuật đã hiệu chuẩn.
  (b) Nhỏ.
- **Blocking Conditions**: Không có; đây là một **sự thật đã đo**, ghi ra để phiên sau không lặp
  lại cùng một kỳ vọng rồi lại ngạc nhiên.
- **Review Trigger**: trước khi bắt đầu BẤT KỲ phase nào thêm chi tiết vào cư dân — đọc mục này và
  trả lời trước câu hỏi của Đàm (HỆ QUẢ 2b, 2026-08-18): *"cái này dành cho khung TOÀN CẢNH hay
  khung CẬN CẢNH?"*
- **Owner**: chưa ai · **Status**: mở

---

## #79 — Vai màu `gear` gánh BA vật liệu (gỗ · xương · kim loại), nên mũ sắt kỷ 12 lẫn vào áo bông

- **Tên**: `gear` là một vai màu, ba vật liệu
- **Module**: `src/engine/city3d/palette3d.js` (vai `gear`) · `src/engine/city3d/human.js` (`carryBox`,
  `headgearBox` kiểu `helm`)
- **Priority**: Low · **Severity**: Low
- **Impact**: Đo được: mũ trụ kỷ 12 cách áo bông **+0,011 độ đậm**, tức dưới ngưỡng mắt (0,047) **4,3
  lần** ⇒ nó không đọc ra được ở khung mặc định. Cùng vai ấy còn tô cây giáo kỷ 1 (gỗ + đá lửa), bó
  củi, cái vò gốm, cái cặp da và bộ đồ nghề — năm vật liệu khác nhau, một mã màu.
- **Root Cause**: cùng hình dạng với khuyết tật vừa đóng ở ADR-054 (`cloth2` gánh quần + đội đầu),
  chỉ khác chỗ. Chú thích của `gear` tự khai luôn là *"gỗ, xương, kim loại xỉn"* — ba thứ trong một
  dòng, và ai đọc cũng lướt qua vì nó nghe như một lời mô tả chứ không như một lời thú nhận.
- **Current Risk**: Thấp và **có phần là sự thật**. Mũ SSh-40 Stalingrad ngoài đời được SƠN đúng màu
  áo bông để nguỵ trang, nên riêng kỷ 12 thì tương phản thấp là ĐÚNG. Rủi ro thật nằm ở chỗ khác:
  ngày nào có kỷ đội mũ trụ **thép trần** (Rus trung cổ, hiệp sĩ) thì nó sẽ ra màu gỗ.
- **Future Risk**: Trung bình khi bộ từ vựng đồ mang theo dài ra. Một cái cặp da đen và một bó lúa
  vàng cùng màu là thứ mắt bắt được ngay khi hai kỷ đứng cạnh nhau.
- **Recommended Solution**: tách vai `metal` (xám lạnh, tươi thấp, độ đậm ~0,55) khỏi `gear`, rồi
  cho `carryBox`/`headgearBox` chọn theo một trục vật liệu — **giống hệt cách ADR-054 đã làm cho đội
  đầu**, và cũng tốn 0 lệnh vẽ, 0 tam giác. ⚠️ Nhưng phải trả lời TRƯỚC: cây giáo kỷ 1 là gỗ + đá,
  không phải kim loại ⇒ trục ấy thuộc về từng ĐỒ VẬT của từng kỷ, không thuộc về `kind`.
- **Estimated Complexity**: Nhỏ (một trục bảng + một vai màu + một bài test quan hệ).
- **Blocking Conditions**: Không có. Hoãn vì hôm nay nó chỉ ảnh hưởng đúng một kỷ, và ở đúng kỷ ấy
  thì tương phản thấp lại là sự thật lịch sử.
- **Review Trigger**: khi thêm một kỷ đội mũ kim loại trần, HOẶC khi bộ từ vựng `CARRY_KINDS` vượt 8
  giá trị.
- **Owner**: chưa ai · **Status**: mở

---

## #78 — 14/15 kỷ vẫn dùng chung MỘT mốc người phổ thông (chỉ kỷ 1 có bản sắc thật) — ✅ ĐÃ ĐÓNG 2026-08-23

> **✅ ĐÃ ĐÓNG 2026-08-23.** Cả 15 dòng nay được thiết kế thật, mỗi dòng buộc vào `country` mà
> `eraStyle.js` khai và có `note` giải thích. `designedEras()` báo **15/15**, không kỷ nào còn trỏ
> preset. Bộ chấm `humanIdentity.test.js` đo được: (A) 105/105 cặp khác nhau, yếu nhất **5/9 trục**
> (kỷ 4↔15), trung vị **8/9**; (B) 105/105 cặp khác nhau ở ít nhất một thứ **mắt đọc được ở 18
> điểm ảnh**. Tam giác không đổi (tối đa 9 hộp/người, 2,03% ngân sách).
> ⚠️ **Mục *«phần nào của việc này chỉ phục vụ máy bàn»* bên dưới VẪN NGUYÊN GIÁ TRỊ** — nó là kết
> luận đã đo, không phải một việc còn dở: trên iPhone 10/11 trục bản sắc không đọc ra được. Ba
> hướng ĐỀ XUẤT ở mục Recommended Solution chưa hướng nào được làm.
> ⚠️ Và một khuyết tật do chính việc này phơi ra đã được vá riêng ở **ADR-054**: 15 kỷ từng dùng
> chung MỘT màu vải và MỘT màu lá vì một tham số bị một biến cùng tên che khuất ở `palette3d.js`.


- **Tên**: `HUMAN_STYLES` mới thiết kế thật 1/15 dòng
- **Module**: `src/engine/city3d/humanStyle.js` (bảng) · `src/engine/city3d/human.js` (thư viện hình
  — hiện mới có 7 loại trang phục, 7 loại đội đầu, 6 loại đồ mang theo, đủ dùng cho vài kỷ nữa
  nhưng chưa đủ cho cả 15)
- **Priority**: Medium · **Severity**: Low
- **Impact**: Đi từ kỷ 2 tới kỷ 15, con người trong thành phố **không đổi gì cả** — cùng áo chẽn,
  cùng đầu trần, cùng tay không, cùng sải chân 1,62 và tốc độ 0,42. Đúng thứ bệnh mà bảng cây cối
  (trước Phase 8D) và bảng mặt đường (trước Phase 9D) đã mắc, chỉ khác là lần này nó **được khai
  báo công khai** chứ không núp sau một giá trị mặc định ngầm.
- **Root Cause**: có chủ đích. Đàm yêu cầu *"chỉ hoàn thiện kỷ 1, nhưng khung phải dựng cho cả 15
  kỷ"* — nên khung, bảng, bộ kiểm và phép đo đã xong; chỉ 14 dòng dữ liệu là chưa.
- **Current Risk**: Không có rủi ro kỹ thuật. `getHumanStyle` luôn trả bộ ĐẦY ĐỦ, bộ kiểm
  `isValidHumanStyle` chặn dòng sai, và bài test **in ra** `[humanStyle] đã thiết kế thật: 1/15 kỷ`
  mỗi lần chạy `npm test` — nên con số này không thể lặng lẽ bị đọc thành "xong rồi".
- **Future Risk**: Nếu để lâu, cái preset `mocPhoThong` sẽ dần được coi là "người nói chung" và
  phiên sau sẽ chỉnh THẲNG vào nó khi thấy một kỷ nào đó trông chưa ưng — lúc ấy 14 kỷ cùng đổi
  theo và không ai biết. ⚠️ Chỉnh preset là chỉnh 14 kỷ một lúc; muốn sửa một kỷ thì phải **tách
  dòng riêng cho kỷ ấy trước**.
- **Recommended Solution**: mỗi kỷ thêm một dòng, và dòng ấy phải trả lời được đúng câu mà kỷ 1 đã
  trả lời: *"người ở nước ấy, thời ấy, mặc gì và đi thế nào?"* — `country` đã bị khoá cứng vào
  `eraStyle.js` nên câu hỏi luôn có địa chỉ. Bài test đòi **≥5 trục khác preset** cho mọi kỷ được
  liệt vào `designedEras()`, nên không thể "làm cho có" bằng cách đổi một số thập phân. Ưu tiên
  theo mức tương phản với kỷ 1: kỷ 14 (Singapore, sơ mi công sở, cặp tài liệu, bước ngắn nhanh) và
  kỷ 5 (Đức trung cổ, áo choàng dài, mũ trùm) là hai kỷ cho khác biệt lớn nhất trên mỗi giờ bỏ ra.
- **Estimated Complexity**: Thấp cho mỗi kỷ (1 dòng bảng + có thể 1–2 hình mới trong `human.js`);
  trung bình nếu làm cả 14 kỷ một lượt.
- **Blocking Conditions**: Không có. Chỉ cần Đàm quyết làm kỷ nào tiếp.
- **Review Trigger**: khi Đàm yêu cầu kỷ tiếp theo, hoặc khi số kỷ đã thiết kế đủ nhiều để cần một
  phép chấm bản sắc kiểu `streetStyle.test.js` (105 cặp × N trục) thay cho phép so với preset.
- ⚠️ **PHẦN NÀY CHỈ PHỤC VỤ MÁY BÀN — ĐÃ ĐO, KHÔNG PHẢI PHỎNG ĐOÁN** (bổ sung 2026-08-23, theo
  yêu cầu kiểm chéo). Báo cáo trước dựa vào câu *"Đàm chỉ dùng MacBook Air M3"* rồi lấy đó làm cớ
  bỏ qua iPhone. Câu ấy **chưa được kiểm**, và nó sai về mặt hệ thống: `renderMode.js` KHÔNG loại
  iPhone khỏi 3D (chú thích trong đó nói rõ coi *"thiếu `deviceMemory`"* là máy yếu thì mọi iPhone
  đều rớt, tức giết luôn mục tiêu), `CLAUDE.md` ghi *"Web Vercel là bản đầy đủ, dùng trên iPhone và
  Mac"*, và Đàm dùng iPhone 17 Pro Max hằng ngày. Nên phải đo, và đây là số đo.
  - **Khung 3D đo thật** (`node scripts/shot.mjs --tab "Thành Phố" --width 390 --probe …` trên bản
    dựng ngày 2026-08-23, KHÔNG nhân nhẩm từ CSS): iPhone 390 ⇒ **324 × 201** điểm ảnh CSS
    (bộ đệm 648 × 402, `devicePixelRatio` 2). Máy bàn chạm trần **990 × 614** từ bề ngang 1440 trở
    lên, nên MacBook Air M3 (1470 điểm logic) đúng là 990 × 614.
  - **Cư dân kỷ 1 cao bao nhiêu** (`human-scale.mjs --eras 1`): MacBook **18,3 px** trung vị
    (13,5–29,3; kéo sát nhất 29,5) · iPhone **6,0 px** trung vị (4,4–9,6; kéo sát nhất 9,7).
  - **Từng bộ phận, đo riêng, so với ngưỡng mắt 4 px của dự án** (`EYE_PIXELS`, `streetStyle.js`):

    | bộ phận (kỷ 1) | MacBook cao × rộng | iPhone cao × rộng |
    |---|---|---|
    | thân (hình bóng trang phục) | 7,8 × 6,2 ✅ | 2,5 × 2,0 ❌ |
    | khoác da thú (mảng lệch vai) | 6,7 × 5,3 ✅ | 2,2 × 1,8 ❌ |
    | đầu | 5,9 × 5,5 ✅ | 1,9 × 1,8 ❌ |
    | chân | 8,2 × 3,9 ⚠️ | 2,7 × 1,3 ❌ |
    | tay | 6,0 × 3,5 ⚠️ | 2,0 × 1,1 ❌ |
    | cây giáo | 17,2 × 3,8 ⚠️ | 5,6 × 1,2 ❌ |
    | **búi tóc** | **2,7 × 2,5 ❌** | 0,9 × 0,8 ❌ |

  - **Dáng đi** (`human-scale.mjs --gait --eras 1`, cùng chỗ cùng hướng khác pha): hình bóng đổi
    **1,9 px trên bề rộng 10,8 px** ở MacBook, nhưng chỉ **0,6 px trên 3,5 px** ở iPhone.
  - ⇒ **KẾT LUẬN TRUNG THỰC — trên iPhone thì 10/11 trục bản sắc KHÔNG đọc ra được.** Cụ thể:
    tỉ lệ cơ thể (chênh so với preset chỉ ~0,9 px) · dáng đứng (lệch dưới một điểm ảnh) · hình
    bóng trang phục · đội đầu · sải chân · tần số bước · biên độ vung tay · tốc độ đi (chỉ đọc
    được nếu nhìn liên tục vài giây) · và cả cụm dáng đi gộp lại (0,6 px). **Đồ mang theo** là trục
    duy nhất còn cửa: cây giáo cao 5,6 px và tách khỏi thân, tức một vệt dọc mảnh — nhưng rộng
    1,2 px nên sau khử răng cưa nó là một vết mờ, xếp loại **MARGINAL, không phải đọc được**.
    **Màu vải** không cần độ phân giải không gian nên về lý còn sống, nhưng nó chỉ còn ~5 điểm ảnh
    vuông pha rất mạnh với nền đất ⇒ cũng marginal.
  - ⚠️ **VÀ MỘT SỰ THẬT KHÓ CHỊU NGAY TRÊN CHÍNH MÁY ĐÍCH**: **búi tóc 2,7 × 2,5 px ở MacBook cũng
    đã DƯỚI ngưỡng mắt 4 px.** Tức trong bốn trục Đàm chọn cho kỷ 1, trục *"đội đầu"* gần như không
    trả về gì kể cả trên máy bàn. Ba trục kia (trang phục + khoác da thú, đồ mang theo, tỉ lệ cơ
    thể + dáng đứng) thì đọc được rõ. Ghi ra đây vì im lặng chuyện này chính là cách một trục chết
    được tính vào công lao — đúng bài học cơ chế *"lùm cây"* chết trong im lặng ở Phase 8D.
  - **Recommended Solution cho phần iPhone (CHỈ ĐỀ XUẤT, CHƯA LÀM — cần Đàm quyết)**: KHÔNG nên
    phóng to cư dân (nó phá tỉ lệ với nhà, và ADR-053 buộc mọi trục phải có lý do lịch sử
    viết ra được — xem đính chính `stature: 1.18` ngày 2026-08-23: phóng đại thì được, miễn KHAI RA). Ba hướng, xếp theo mức tôi tin:
    1. **Chấp nhận và ghi rõ** — iPhone xem thành phố ở mức *bố cục và màu*, máy bàn mới là chỗ
       xem *con người*. Rẻ nhất, trung thực nhất, và khớp với việc màn Thành Phố vốn là màn để
       ngắm chứ không phải màn thao tác. Hôm nay dự án đang ở đúng trạng thái này.
    2. **Cho iPhone một mức thu-phóng mặc định GẦN HƠN** — kéo sát nhất đã đưa cư dân lên 9,7 px,
       vẫn dưới ngưỡng cho từng bộ phận nhưng đủ để cả người đọc ra là một người. Rủi ro: đổi khung
       mặc định là đổi thứ Đàm đã quen nhìn, và mọi con số nghiệm thu ảnh phải đo lại.
    3. **ADR-034 đã có sẵn lối đi đúng: chạm vào một công trình thì camera bay tới** (`FOCUS_VIEW_
       DISTANCE = 7,5`). Mở rộng cho phép chạm vào một **cư dân** thì con người sẽ đọc ra được ở
       mọi khung hình mà không đụng gì tới khung mặc định. Đây là hướng tôi tin nhất về lâu dài,
       nhưng nó là một tính năng tương tác chứ không phải một chỉnh số, nên phải là task riêng.
  - **Cách tái lập mọi con số trên** (đủ ba vế CÔNG CỤ · ĐẦU VÀO · ĐỜI ẢNH theo luật `PERFORMANCE.md`):
    `node scripts/shot.mjs --tab "Thành Phố" --width 390 --probe "…getBoundingClientRect()…"` (cần
    `CHROME_PATH` trỏ Chrome, và `npm run build` TRƯỚC vì `shot.mjs` phục vụ `dist/`) ·
    `node --import ./scripts/register-esm-loader.mjs scripts/human-scale.mjs --eras 1` ·
    `… scripts/human-scale.mjs --gait --eras 1`. Đo trên cây mã tại commit `be9d2ea`.
- **Owner**: phiên AI kế tiếp · **Status**: Open (có chủ đích, đúng phạm vi Đàm giao)

---


## #89 — Trục CHẶNG NGÀY của bản quét tụt xuống DƯỚI ngưỡng mắt (11,33) — cái giá của ADR-061, và cần gạt để nâng nó lên KHÔNG nằm ở thành phố

> Mở 2026-08-24 (Phase 19 VIỆC 6). Đây là nợ **được chọn mang có ý thức**, và nó là một **CÂU HỎI
> CHO ĐÀM**, không phải một việc tôi được tự quyết: hai thứ anh đã yêu cầu đang xung đột nhau.
>
> ⚠️ **CẬP NHẬT 2026-08-24 (Phase 20) — CỔNG ĐÃ QUA (11,33 → 12,44 ✓), NHƯNG CHẨN ĐOÁN BÊN DƯỚI
> VẪN ĐỨNG NGUYÊN, VÀ MỤC NÀY CHƯA ĐÓNG.** Bộ xương sinh theo kỷ (ADR-066) đưa cặp yếu nhất
> `bình minh 6h ↔ chiều 15h` từ **11,33 lên 12,44**, tức 0/15 cặp dưới ngưỡng. Mốc nền được **TỰ ĐO
> lại** trong một `git worktree` ở đúng HEAD `0abb272` (không chép cột "sau" của Phase 19 — bài học
> `#43`) và nó tái lập **y hệt** 11,33 · 19,18 · 36,31, nên phép so là sạch.
>
> ⚠️ **NHƯNG ĐỪNG ĐỌC "12,44 ✓" THÀNH "ĐÃ CHỮA".** Tách ba dải của đúng cặp ấy (trước → sau):
> **trời 4,12 → 4,05** · **thành phố 6,51 → 5,56** · **đất 18,05 → 20,42**.
> ⇒ Toàn bộ phần đi lên nằm ở dải **ĐẤT (+2,37)**; dải **THÀNH PHỐ còn TỆ ĐI (−0,95)**; và dải
> **TRỜI đứng yên (−0,07)** — đúng như phải thế, vì Phase 20 không chạm một dòng nào vào bầu trời.
> Tức **cần gạt thật vẫn chưa được kéo**: trời vẫn là dải yếu nhất bảng, 4,05, thấp hơn ngưỡng mắt
> ba lần. Mục này qua được cổng nhờ một dải KHÁC bù vào, không nhờ chỗ hỏng được sửa.
> ⚠️ **Cơ chế vì sao dải ĐẤT mạnh lên thì CHƯA ĐƯỢC CHỨNG MINH.** Thứ duy nhất đã đo được là một
> tương quan: số ô đường đi từ **80 cố định ở cả 15 kỷ** xuống **34…92, trung bình 59,7**, tức đất
> trống lộ ra nhiều hơn. Đó là một ỨNG VIÊN, không phải một kết luận — đừng chép nó thành nhân quả
> khi chưa bật/tắt để đo (bài học Phase 3Y: *sửa đúng không chứng minh hiểu đúng*).
> ⇒ **Ba hướng bên dưới vẫn nguyên giá trị**, và hướng (a) *nâng bầu trời* vẫn là hướng đúng.
> Trạng thái đổi từ "một cặp đang dưới ngưỡng" sang "biên mỏng 0,44 trên ngưỡng, dựa vào một dải
> không liên quan tới nguyên nhân" — nhẹ đi, chưa hết.

- **Tên**: bản quét 15 kỷ × 6 chặng — cặp `bình minh 6h ↔ chiều 15h` = **11,33**, dưới ngưỡng mắt 12
- **Module**: `src/engine/city3d/orbit.js` (nguyên nhân) · `src/engine/city3d/daylight.js` (cần gạt)
  · đo bằng `scripts/city-preview.mjs --sweep` + `scripts/sweep-score.mjs`
- **Priority**: Medium-High · **Severity**: Medium (mỹ thuật; không ảnh hưởng dữ liệu/hiệu năng)
- **Impact**: hai trong sáu chặng ngày là **CÙNG MỘT BỨC ẢNH** với mắt người. Thứ mất đi là phần
  thưởng của việc mở app vào những giờ khác nhau. ⚠️ Trục **KỶ vẫn ĐẠT** — 0/105 cặp dưới ngưỡng,
  gần nhất 19,18, trung vị 36,31 — nên *"15 kỷ còn phân biệt được"*, đúng điều VIỆC 6 hỏi, là CÓ.
- **Root Cause — ĐÃ TÁCH MỘT BIẾN, KHÔNG PHẢI SUY ĐOÁN**: ba lượt quét đầy đủ trên ba cây mã:

  | cây mã | trục chặng | trục kỷ | trung vị |
  |---|---|---|---|
  | mốc nền `be9d2ea` (tự đo, không chép của phase trước) | **14,39** ✓ | 22,13 | 38,59 |
  | Phase 19 **trừ** `orbit.js` (đủ VIỆC 1+2+3+4) | **14,23** ✓ | 21,24 | 38,67 |
  | Phase 19 **đủ** | **11,33** ✗ | 19,18 | 36,31 |

  ⇒ bốn việc kia cộng lại tốn **0,16**; **2,90 là của riêng phép lùi khung hình** (ADR-061). Cơ chế:
  các dải đo là phân số **CỐ ĐỊNH** của ô (trời 2–30% · thành phố 34–68% · đất 72–98%), nên thành
  phố nhỏ lại thì mỗi dải bị pha loãng thêm nền — đúng hình dạng `TECH_DEBT #22`.
- **Current Risk**: thấp — không ai mất dữ liệu, không ai thấy lỗi. Nó chỉ làm nhạt đi một phần
  thưởng.
- **Future Risk**: cao nếu bị **hiểu nhầm**. Một phiên sau đọc "11,33 < 12" rồi đi sửa MÀU thành
  phố sẽ chữa nhầm chỗ. Tách ba dải của đúng cặp yếu nhất (mốc nền → nay):
  **trời 8,38 → 4,12** · thành phố 10,74 → 6,51 · **đất 20,88 → 18,05**.
  ⇒ Đất vẫn khoẻ gấp bốn lần trời. **Cần gạt nằm ở BẦU TRỜI lúc 6h so với 15h** — đúng kết luận mà
  `CLAUDE.md` đã ghi sau Phase 14 §1(3), nay được xác nhận lại bằng một bộ số mới.
  ⚠️ Và nó **bác bỏ lần thứ hai** chỉ thị cũ *"phải làm vùng quê đổi theo giờ"*: vùng quê nằm ở dải
  ĐẤT, dải đang mạnh nhất bảng.
- **Recommended Solution — BA HƯỚNG, ĐÀM CHỌN, TÔI KHÔNG TỰ CHỌN**:
  - **(a) Giữ khung mới, nâng bầu trời.** Được cả hai lời hứa. Là một thay đổi MỸ THUẬT vào vòng
    ngày (`daylight.js`), nằm ngoài phạm vi Phase 19 nên tôi không tự làm.
  - **(b) Hoàn tác ADR-061.** Lấy lại 14,39 và mở lại `TECH_DEBT #24` (nóc nhà bị cắt ở 14/15 kỷ).
  - **(c) Giữ nguyên, chấp nhận hai chặng nhìn giống nhau** cho tới khi có phase riêng cho bầu trời.
  ❌ **KHÔNG được nới ngưỡng 12** (phễu Phase 9A) và ❌ **KHÔNG được đổi cách cắt dải để lấy lại con
  số** — ba mốc 20,7/17/14 của Đàm đều hiệu chuẩn trên cách đo hiện tại; đổi ruột thước mà giữ vạch
  cũ là tạo ra một ngưỡng chưa hiệu chuẩn (`TECH_DEBT #55`).
- **Estimated Complexity**: (a) trung bình · (b) thấp · (c) không
- **Blocking Conditions**: chờ Đàm chọn hướng.
- **Review Trigger**: mỗi lần chạm `orbit.js`, `daylight.js`, hoặc kích thước công trình — và mỗi lần
  bản quét đổi, vì cổng nay chỉ hơn ngưỡng **0,44** và phần dư ấy đến từ một dải KHÔNG liên quan
  tới nguyên nhân, nên nó có thể mất đi vì một thay đổi chẳng dính gì tới bầu trời.
- **Owner**: chưa giao · **Status**: MỞ — cổng đã qua (12,44 ✓) nhưng nguyên nhân chưa chữa; chờ quyết định

## #96 — Tiến hoá di vật là một cơ chế CHẾT: nó đòi tinh luyện của kỷ ĐÃ QUA — ĐÀM CHỌN, tôi không tự chọn

> Mở 2026-09-01 (vòng 24, lúc soi lại tab Hành trang). Đây là một NGÕ CỤT cấu trúc, không phải một
> con số cần cân bằng lại — nên nó khác `#95`, và nó cũng không sửa được bằng cách chỉnh giá.

- **Tên**: `evolveRelic` tiêu `resourcesRefined[kỷ của di vật]`, mà tinh luyện chỉ rơi vào kỷ ĐANG CHƠI
- **Module**: `src/store/gameStore.js` (`evolveRelic` ~5795, credit tinh luyện ~4135) · `RelicInventory.jsx`
- **Priority**: Medium · **Severity**: Medium
- **Số đo**: `evolveRelic` đọc `state.resourcesRefined[evoDef.era]`; còn tinh luyện khi xong phiên
  được cộng vào `resourcesRefined[reward.activeBook]` — **kỷ đang chơi**. Nguồn duy nhất khác là
  đặc quyền hạ tầng, nhưng `pruneEraScopedBlueprintState` gỡ công trình của kỷ cũ khi lên kỷ ⇒
  **không có đường nào kiếm tinh luyện của một kỷ đã qua**. Ảnh chụp fixture (3 di vật, kỷ 8):
  **3/3 nút tiến hoá đều "Chưa đủ tài nguyên"**, và chúng sẽ ở nguyên như vậy vĩnh viễn.
- **Impact**: màn hình vẽ ra một thang tiến hoá `1 → 2 → 3` kèm một dòng chi phí và một cái nút —
  cả ba đều là lời hứa về một việc **không thể làm được**. Cửa sổ dùng được của cơ chế này chỉ là
  khoảng thời gian giữa lúc thắng khủng hoảng và lúc lên kỷ, mà khủng hoảng nổ ở ~95% ngưỡng kết
  thúc kỷ ⇒ cửa sổ ấy gần như bằng không.
- **⚠️ VÌ SAO CHƯA LÀM**: mọi lối ra đều là đổi luật KINH TẾ, không phải đổi hiển thị —
  (a) cho tinh luyện của kỷ cũ tiếp tục rơi, (b) cho đổi tinh luyện kỷ mới lấy kỷ cũ, (c) đổi chi
  phí tiến hoá sang tinh luyện của kỷ ĐANG chơi. Nguyên tắc an toàn đang áp: *đơn giản hoá thứ Đàm
  THẤY và CẢM, đừng xoá thứ Đàm đã KIẾM ĐƯỢC* — cả ba phương án nằm ở phía bên kia ranh giới ấy.
- **⚠️ ĐÃ CÂN NHẮC VÀ BÁC "vá bằng cách giấu đi"**: ẩn thang tiến hoá khi không đủ tài nguyên. Nó
  làm màn hình hết nói dối nhưng cũng xoá luôn dấu vết của một cơ chế đã viết xong — và phiên sau
  sẽ không có cách nào biết nó tồn tại. Ghi ra một mục nợ đọc được thì hơn.
- **Review Trigger**: khi Đàm hỏi "sao cái nút tiến hoá di vật không bấm được bao giờ".
- **Owner**: Đàm quyết · **Status**: MỞ, chờ Đàm
