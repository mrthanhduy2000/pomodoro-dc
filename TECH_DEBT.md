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
> **Threshold status (2026-09-08, after ADR-080 "round 40")**: no entry opened or closed; a moments-only round
> (beats · tiered ending · lucky brick · break beats · round-39 leftovers). Counts unchanged.
>
> *(previous)* **Threshold status (2026-09-07, after ADR-079 "round 39")**: no entry opened or closed; a UI-only round
> (one indicator · three colours · no cut text on the Focus screen). Two things seen and NOT fixed are in
> the round report, not here: the City tab's per-era colours and its era-chip scroller — design calls for Đàm.
>
> *(previous)* **Threshold status (2026-09-07, after ADR-078 "round 38")**: no entry opened or closed; **#2** progressed
> again (`gameStore.js` 4,677 → 2,879 — the reward assembly and ten helper clusters are `engine/` now) and
> **#86** has its GATE (ESLint: palette classes / hex-rgb literals on any button) with 0 violations and
> 11 action buttons through the door. Counts unchanged.
>
> *(previous)* **Threshold status (2026-09-06 late night, after ADR-077 "round 37")**: no entry opened or closed;
> **#2** progressed (`gameStore.js` 5,413 → 4,696 · `PomodoroEngine.jsx` 2,958 → 1,922) and **#86**
> got its single door (`shared/ActionButton.jsx`, tenants not yet moved). Counts as in the snapshot below (this round opened and closed nothing).
>
> *(previous)* **Threshold status (2026-09-06 night, after ADR-075)**: **103 entries · 44 closed · 59 open**, now
> stored by subsystem: **7 actionable debts live in this file** (#1 #2 #3 #4 #8 #14 #102), **52 belong
> to the frozen 3D city** (`docs/TECH_DEBT_3D.md` — still open, not actionable while Đàm forbids
> touching 3D), and the closed ones are in `docs/archive/TECH_DEBT_CLOSED_2026-09-06.md`.
> **0 Priority High or Critical among the 7 actionable** (the one High, #53, is a 3D debt) → far from
> the Maintenance Sprint threshold. ⚠️ Count the actionable list, not the total, when judging that
> threshold — a frozen subsystem cannot be worked on.
>
> *(previous)* **(2026-09-06 tối, sau ADR-074 "tài liệu tự-nạp sang tiếng Anh")**: đóng
> **#101** (41 lời trỏ sai đích đã sửa theo nội dung từng dòng). **103 mục · 44 đã đóng · 59 còn
> mở**. Vẫn **1 mục Priority High còn mở** (#53), **0 mục Critical** → xa ngưỡng Maintenance Sprint.
>
> *(mốc trước)* **(2026-09-06 chiều, sau ADR-073 "ngân sách token cho tài liệu")**: thêm
> **#103** (Medium — kho tra cứu đã lớn tới mức một lệnh `cat` nổ cửa sổ ngữ cảnh; luật cấm `cat`
> hiện là văn bản, chưa phải cổng). **103 mục · 43 đã đóng · 60 còn mở**. Vẫn **1 mục Priority High
> còn mở** (#53), **0 mục Critical** → xa ngưỡng Maintenance Sprint.
>

> 📚 **Older threshold snapshots (2026-08-24 and earlier) were moved to**
> `docs/archive/TECH_DEBT_CLOSED_2026-09-06.md` § "Threshold history" on 2026-09-06 (ADR-075).
> They are a log of past counts, re-read on every `head` of this file for no operational
> benefit. Nothing was deleted.
- **#103** — Reference archive so large that one `cat` blew the context window, with no guard
- **#86** — 137 nút tự vẽ trên 28 file KHÔNG đọc token skin, và `ActionButton` không nhận nổi chúng — ADR-078: GATED (`eslint.config.js`, palette classes or hex/rgb literals on any button = error, 0 violations); 11 action buttons through the door, the rest read tokens
- **#18** — ĐÃ ĐÓNG (2026-08-13) · Kỷ 12–14 không hề có bề mặt nào mang màu kỷ
- **#17** — ĐÃ ĐÓNG (2026-08-13) · Bình minh và hoàng hôn là CÙNG MỘT BỨC ẢNH

---

## ✅ Closed entries — full text archived

**44 closed entries** were moved verbatim to
[`docs/archive/TECH_DEBT_CLOSED_2026-09-06.md`](docs/archive/TECH_DEBT_CLOSED_2026-09-06.md)
on 2026-09-06 (ADR-075). Nothing was deleted — each keeps all 14 fields and its rationale.
Together with trimming stale threshold snapshots out of the header, this cut the active file from
435,288 to 248,875 chars — **126% → 72% of a 200k window**.
Look one up with `grep -n '^## #<number>' docs/archive/TECH_DEBT_CLOSED_2026-09-06.md`.

- **#101** — 47 lời trỏ "xem `CLAUDE.md`" trong 38 file mã nay trỏ tới file KHÔNG CÒN chứa bài học 3D
- **#100** — Hai chỗ vẫn phải BẤM để nhận thứ đã đạt: "Chốt bước" chuỗi tuần, và lưới 360 huy hiệu dài ~5.350px
- **#99** — DỮ LIỆU NGỦ sau ADR-069: tài nguyên · RP · tinh luyện vẫn được cộng, không còn cổng tiêu; 5 action + 1 hộp thoại còn nằm lại không ai gọi
- **#98** — `LootDropModal` (7 giai đoạn) và `SessionRewardStory` cùng trình bày MỘT `pendingReward`
- **#96** — Tiến hoá di vật là một cơ chế CHẾT: nó đòi tinh luyện của kỷ ĐÃ QUA
- **#95** — Xây MỘT công trình phải qua BA cổng tiền tệ, cả ba đều là hàm của số phút
- **#94** — `BREAK_START_DELAY_MS` chờ 3,2 giây ở ~82% số phiên KHÔNG có lễ mừng nào để che
- **#93** — 📌 từng là QUYẾT ĐỊNH, KHÔNG PHẢI NỢ (2026-09-02) — `buildCategoryAdvisor` (170 dòng) vẫn nằm trong file giao diện, và ĐÓ LÀ CÓ CHỦ ĐÍCH — đừng "dọn" nó xuống engine
- **#92** — `no-unused-vars` đang TẮT cho MỌI file `.jsx`, nên code chết ở cả tầng giao diện là vô hình với lint
- **#91** — Bài test canh khung bóng đổ CHÉP TAY hệ số `0,8` thay vì đọc từ mã, nên nó xanh kể cả khi mã dùng một `reach` khác
- **#87** — ~~Báo cáo tuần VẪN tự bật sáng thứ Hai~~ ✅ **ĐÃ ĐÓNG 2026-08-27 (ADR-061)**
- **#78** — 14/15 kỷ vẫn dùng chung MỘT mốc người phổ thông (chỉ kỷ 1 có bản sắc thật) — ✅ ĐÃ ĐÓNG 2026-08-23
- **#64** — KỶ 5 LÀ MỘT **ĐẢO**: `MEANDER_NECK = 1,6` KHÔNG CẮT RA ĐƯỢC LỐI VÀO NÀO
- **#59** — ✅ ĐÃ ĐÓNG (2026-08-20, Đàm chốt hướng (b)) — **BỀ RỘNG**: ba kỷ nước hẹp (6 · 7 · 10) không thể đạt cổng 5% ở **bất kỳ** góc nhìn nào
- **#57** — ✅ ĐÃ ĐÓNG (2026-08-20, ADR-041) — Camera mặc định quay lưng lại phía có nước: kỷ 14 chỉ thấy **0,09%** mặt biển, trần là **31,43%**
- **#56** — ✅ ĐÃ ĐÓNG (2026-08-20, Bước C) — 12/14 kỷ có nước trong bảng nhưng chưa được dựng hình (dở dang CÓ CHỦ Ý, và nó đếm được)
- **#46** — ✅ ĐÃ ĐÓNG (2026-08-18, ADR-035) — Chế độ cận cảnh ở những kỷ CAO ngả thành nhìn-từ-trên-xuống: kỷ 15 ngẩng 65,3°, tầng trệt gần như biến mất
- **#44** — ✅ ĐÃ ĐÓNG (2026-08-18) — KHÔNG PHẢI NỢ, LÀ LỰA CHỌN: kỷ 4 là kinh thành trên đồng bằng
- **#43** — Số tam giác không có gì canh, và nó ĐÃ trôi ở 6/15 kỷ
- **#42** — ✅ ĐÃ ĐÓNG (2026-08-18, ADR-033) — Vỉa hè bị bóp trong im lặng trên ĐẠI LỘ ở 8/15 kỷ, kỷ tệ nhất chỉ còn 11% bề rộng đã khai
- **#41** — ✅ ĐÃ ĐÓNG (2026-08-18) — Chi tiết mái KHÔNG sống sót tới thang bản quét: 90/90 ô dưới ngưỡng mắt
- **#38** — ✅ ĐÃ ĐÓNG (2026-08-18) — Trần "13 lệnh vẽ" là con số suy từ MẪU 3 KỶ, và kỷ 10 nằm ngoài nó
- **#36** — ✅ ĐÃ ĐÓNG (2026-08-18, Phase 10 Bước 2) — Kỷ 1 và kỷ 2 vẫn KHÔNG có cửa ra vào
- **#34** — ✅ [ĐÃ XỬ LÝ 2026-08-17, vòng 4] `--thu` không kiểm điều kiện tiên quyết, nên lỗi "thiếu thư viện" hiện ra thành 20 dòng lỗi Vite
- **#32** — ✅ [ĐÃ XỬ LÝ 2026-08-17, Performance Gate] Đồng hồ đo HUD báo THIẾU 56% số tam giác
- **#31** — `city.dispose()` KHÔNG giải phóng bản đồ bóng (app hiện KHÔNG dính, công cụ thì dính)
- **#30** — ✅ [ĐÃ XỬ LÝ 2026-08-16, Phase 9D] Mặt đường render ra DƯỚI ngưỡng mắt đọc được, xét riêng vật liệu (kỷ 11 · 13 · 10 · 3)
- **#28** — ✅ [ĐÃ XỬ LÝ 2026-08-15] Mặt đất vẫn là bàn cờ ô vuông phẳng
- **#27** — ✅ [ĐÃ XỬ LÝ 2026-08-16, Phase 9D] Ba cặp kỷ có mặt đường gần trùng nhau VÀO BAN ĐÊM (ban ngày thì không)
- **#20** — Mái kỷ 1 (lều da thú) ra màu XANH LÁ, sai họ vật liệu — không phải lỗi phân biệt, mà lỗi NGHĨA
- **#16** — Vòng ngày của thành phố gần như VÔ HÌNH ở trang chủ, nơi Đàm nhìn nhiều nhất
- **#15** — Trời ban ngày KHÔNG BAO GIỜ xanh: cả ngày chỉ là dốc sáng–tối, không phải hành trình màu
- **#13** — `useTimer.js` (1 100+ dòng, hot spot) có ĐÚNG 0 bài test — và tài liệu từng ghi ngược lại
- **#12** — ✅ [ĐÃ XỬ LÝ 2026-08-12] Lễ mừng bị TÍNH VÀO giờ nghỉ: nghỉ tự động chạy trước khi lễ mừng xong
- **#11** — ✅ [ĐÃ XỬ LÝ] Theme TỐI: bầu trời gần như đen ở MỌI giờ, kể cả giữa trưa
- **#10** — ✅ [ĐÃ XỬ LÝ] Glob test chỉ quét MỘT cấp: test đặt trong thư mục con sẽ im lặng không bao giờ chạy
- **#9** — Persist localStorage không bắt `QuotaExceededError`
- **#7** — Dependency: `npm install` cần flag `--legacy-peer-deps`
- **#6** — Hiệu năng: các tab nặng của `StatsDashboard.jsx` tính lại toàn bộ lịch sử mỗi lần render
- **#5** — Rủi ro lệch giữa mô tả tĩnh (`constants.js`) và hành vi code thật

---

## 🏙️ 3D city subsystem — 52 open debts, split out

The 3D city is a **finished black box Đàm forbids touching**, so its debts are not actionable work
today — yet they were **87% of this file**. They moved verbatim (still OPEN, split by SUBSYSTEM not
by status) to [`docs/TECH_DEBT_3D.md`](docs/TECH_DEBT_3D.md) on 2026-09-06 (ADR-075).
Look one up: `grep -n '^## #<n>' docs/TECH_DEBT_3D.md`.

<details>
<summary>Index of the 52 3D debts</summary>

- **#97** — `soiVetRach` bỏ sót một vết rách mắt thường nhìn ra ngay
- **#90** — Chia ô thành khu phố làm 4 kỷ THẤP ĐI và kỷ 6 mất một phần ba chi tiết mái; cả hai đều bị chặn bởi bảng lịch s
- **#89** — Trục CHẶNG NGÀY của bản quét tụt xuống DƯỚI ngưỡng mắt (11,33) — cái giá của ADR-061, và cần gạt để nâng nó lê
- **#88** — Trần "một khu phố không rộng quá MỘT Ô" khoá luôn số suất đất ở 4, làm cột `units`/`cols`/`rows` của bảng khu 
- **#85** — `road-bend.mjs` đo trên một đại lượng mà ADR-059 đã thay: nó vẫn hỏi "tim đường lệch bao nhiêu trong ô", trong
- **#84** — Kỷ 1 và kỷ 2 THẤP ĐI sau khi ô nhà dân thành khu phố, và mọi cần gạt đã cạn
- **#83** — Ngưỡng "lượn bao nhiêu thì mắt đọc ra" CHƯA được hiệu chuẩn bằng một phép dựng ảnh
- **#82** — Bộ khớp cư dân chỉ có MỘT trục quay, nên hông không lắc ngang và đai hông không xoay
- **#81** — Mũ CÓ CHỎM thừa hưởng phép phóng đại của cái đầu, nên rộng ~1,5 lần vai thay vì ~0,7 như đời thật
- **#80** — Cư dân chiếm 0,29% khung hình ở góc mặc định, nên MỌI chi tiết cơ thể chỉ đọc được khi camera bay tới gần
- **#79** — Vai màu `gear` gánh BA vật liệu (gỗ · xương · kim loại), nên mũ sắt kỷ 12 lẫn vào áo bông
- **#77** — `ROOFTOP_MIN_SPAN` là một MỨC TUYỆT ĐỐI áp lên những khối chênh nhau nhiều lần, nên 9/15 kỷ mất một phần chi t
- **#76** — Từ vựng mái NHÀ DÂN chỉ có **3 giá trị cho 15 kỷ**, trong khi mái KỲ QUAN đã có 10
- **#75** — Ziggurat kỷ 3 đã có hình ĐÚNG nhưng vẫn đọc ra là «một khối cao đội cái mũ giật cấp» — đây là bài toán KHỐI TÍ
- **#74** — Vùng phụ cận KHÔNG lớn lên theo số phiên, nên **tín hiệu quy mô nằm ngoài vòng lặp phần thưởng**
- **#73** — Camera bị buộc cứng vào `CITY_GRID_SIZE`, nên "lưới to hơn" và "nhà cao hơn" TỰ TRIỆT TIÊU nhau
- **#72** — Phép đo (M2) «mấy tầng chiều sâu có dấu vết con người» ĐÃ ĐẠT SẴN mục tiêu trước khi làm gì cả: 15/15 kỷ, ở MỌ
- **#71** — Khu 3×3 quanh kỳ quan KHÔNG giữ chỗ cho một Ô, nó giữ chỗ cho HÌNH CHIẾU ĐÁY — và 225/225 công trình đều tràn 
- **#70** — KHÔNG CÓ CỔNG NÀO CANH **THỜI GIAN DỰNG CẢNH**, nên một hồi quy 1,7 lần đã ship mà không gì đỏ lên
- **#69** — `terrain-score.mjs --ngoai` NAY TRẢ VỀ **NaN Ở 13/15 KỶ**: một công cụ đo mà tiền đề của nó đã bị gỡ mất một n
- **#68** — "CHỈ SỐ BỆ" CHIA CHO ĐỘ DỐC TRONG LƯỚI, NÊN BA KỶ **CỐ Ý PHẲNG** SẼ MÃI MÃI ĐIỂM CAO DÙ KHÔNG CÓ BỆ NÀO
- **#67** — **ĐỊA HÌNH CHE**: kỷ 4 và 5 tụt dưới cổng "thấy nước" 5% vì một bản vá ĐÚNG về vật lý, không vì bề rộng
- **#66** — KỶ 12 KHÔNG PHẢN ỨNG VỚI HẠT GIỐNG NHIỄU: **0/144 ô đổi bậc** khi đổi hạt, nên một trong hai nguồn biến thiên 
- **#65** — `canal` VÀ `estuary` KHÔNG CÓ MỘT DÒNG HÌNH HỌC NÀO CỦA RIÊNG CHÚNG: BA TRONG SÁU "KIỂU NƯỚC" DỰNG BẰNG CÙNG M
- **#63** — PHÉP TIA ĐO NƯỚC **MÙ VỚI CÂY CỐI**: CỔNG 5% ĐÃ ĐƯỢC CHẤM BẰNG MỘT CÁI THƯỚC SAI, VÀ "11 KỶ ĐẠT" THẬT RA LÀ **
- **#62** — KỶ 4 VƯỢT CỔNG NƯỚC 5% ĐÚNG 0,02 ĐIỂM PHẦN TRĂM → **TIỀN ĐỀ SAI: KỶ 4 KHÔNG HỀ VƯỢT CỔNG**
- **#61** — CỔNG "5% KHUNG HÌNH" LÀ MỘT **THỨ ĐẠI DIỆN**, VÀ CHÍNH ĐÀM ĐÃ CHỈ RA ĐIỀU ĐÓ
- **#60** — NƯỚC HẸP CẦN MỘT NGỮ PHÁP KHÁC: CẦU · BẾN · THUYỀN · KÈ, KHÔNG PHẢI THÊM DIỆN TÍCH
- **#58** — ẢNH CHỤP RỘNG HƠN ~1300px CÓ THỂ BỊ NHIỄM MỘT **KHỐI CHỮ NHẬT** Ở GÓC, VÀ CỔNG CHỐNG-RÁCH HIỆN CÓ KHÔNG THỂ TH
- **#55** — VÙNG QUÊ KHÔNG PHẢN ỨNG VỚI GIỜ TRONG NGÀY, VÀ NÓ ĐANG KÉO TRỤC "6 CHẶNG NGÀY" XUỐNG
- **#54** — BỘ HOẠCH ĐỊNH ĐƯỜNG BAY CẬN CẢNH CHỈ BIẾT CÔNG TRÌNH, KHÔNG BIẾT ĐỊA HÌNH QUANH NÓ
- **#53** — VÀNH ĐẤT NGOÀI LƯỚI CHIẾM ~21% KHUNG HÌNH VÀ KHÔNG MỘT PHASE NỘI DUNG NÀO CHẠM TỚI ĐƯỢC
- **#52** — Một ảnh nghiệm thu đã bị RÁCH NGANG và ta KHÔNG biết vì sao; nay có cổng chặn nhưng chưa có chẩn đoán
- **#51** — Bộ vẽ 2D CHƯA BAO GIỜ vẽ nhà dân, nên hai bộ vẽ khác nhau về NỘI DUNG chứ không chỉ độ đẹp
- **#50** — `md5sum` của ảnh dựng KHÔNG ổn định khi máy bận, nên nó chỉ chứng minh được MỘT chiều
- **#49** — `city-preview.mjs` xén mất 23 dòng cuối của MỌI ảnh đơn, và không có gì nói ra
- **#48** — Chi tiết Phase 10–11 nằm DƯỚI ngưỡng mắt ở 11/15 kỷ, **kể cả ở khoảng cách cận cảnh lý tưởng**
- **#47** — Chế độ cận cảnh khoá KHOẢNG CÁCH, nên một công trình RỘNG BẤT THƯỜNG sẽ bị cắt hai đầu
- **#45** — 5/2160 chỗ bờ đất bên lề đường dốc hơn MỘT bậc thềm (giá phải trả của việc san đường)
- **#40** — `parts.js` chỉ xoay được quanh trục ĐỨNG, nên ngói ống là một phép XẤP XỈ chứ không phải hình thật
- **#39** — `crownWeight` là một trục MỎNG, và với `barrel` nó KHÔNG THỂ tách được hai kỷ dù khai số nào
- **#37** — Cửa sổ KHÔNG xoay theo độ nghiêng "tay làm" của thân nhà (sai số dưới một điểm ảnh, nhưng là một luật chỉ đúng
- **#35** — Toàn bộ bộ đo chưa từng chạy thử ở đường dẫn có DẤU TIẾNG VIỆT + DẤU CÁCH, dù `CLAUDE.md` đã có sẵn "BẪY 2" về
- **#33** — Ma trận 24 cảnh mở lại trình duyệt 25 lần thay vì gộp vào MỘT trang
- **#29** — Cọ nhìn từ ĐÚNG TRÊN XUỐNG vẫn dẹt thành dấu "✳", vì `parts.js` không nghiêng được khối
- **#26** — Nhà dân chưa có LOD, và cổng hiệu năng iPhone vẫn chưa đo lại (nối với #23)
- **#25** — Nhà dân NHỎ NHẤT ở 3 kỷ không có lấy một ô cửa sổ nào (là hộp trơn đội mái)
- **#24** — MỌI KỶ ĐỀU CÓ CÔNG TRÌNH BỊ MÉP KHUNG HÌNH CẮT — và không ai đo cho tới hôm nay
- **#23** — Cổng hiệu năng iPhone của Phase 3A chưa được đo lại sau khi cả cảnh chuyển sang PBR
- **#22** — `sweep-score.mjs` KHÔNG còn chấm được 15 kỷ: bộ lọc "8% tươi nhất" chấm nhầm CỎ, không phải mái
- **#21** — Công trình rộng nhất **3,687 ô** trên một khu đất rộng **3 ô** — chưa ai NHÌN xem nó có cắm vào nhà bên không
- **#19** — Hai cặp kỷ vẫn gần như CÙNG MỘT MÀU trên màn hình, dù bảng màu gốc cách nhau rất xa

</details>

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

## #2 — God File: `gameStore.js` (~2,900 dòng sau ADR-078) — CÒN MỞ; `StatsDashboard.jsx` đã xử lý (ADR-071: 3.792 → 294) · `PomodoroEngine.jsx` 2,958 → 1,922 (ADR-077)

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
- **Cập nhật 2026-09-06 (ADR-071)**: `StatsDashboard.jsx` 3.792 → **294 dòng** (ba thẻ trả lời + sổ tra cứu gấp); phần tra cứu tách nguyên văn sang `StatsJournal.jsx` (881) · `StatsNotes.jsx` (275) · `statsTheme.js` (45); logic ba câu trả lời ở `engine/statsAnswers.js` (171, thuần). `gameStore.js` 5.744 → 5.413 nhờ đóng #99 (xoá kinh tế ngủ), `gameMath.js` 2.044 → 1.732. Vế `gameStore.js` VẪN MỞ — ứng viên tách kế tiếp: chuỗi tuần (`autoClaimWeeklySteps` + `refreshWeeklyChain`) và nhiệm vụ ngày sang engine thuần.
- **Update 2026-09-07 (ADR-078)**: `completeFocusSession` is a 15-line wrapper over `engine/sessionRewards.js` (`assembleSessionReward`, pure, clocks and dice as parameters, 5 behaviour tests); ten helper clusters moved verbatim to `engine/feedNotifications.js` · `achievementState.js` · `streak.js` · `overclock.js` · `trackingDefaults.js` · `eraScope.js` · `buildingPerks.js` · `historyStats.js` · `longBreakCycle.js` · `savedNotes.js`; `gameStore.js` **4,677 → 2,879**. Still open: `normalizePersistedGameState` + the hydration/migration cluster (~600 lines) and the remaining actions. Next cut: split `assembleSessionReward` into named stages (`reward → history → buildings → notifications`).
- **Update 2026-09-06 (ADR-077)**: done — daily missions and the weekly chain are `engine/missions.js` + `engine/weeklyChain.js` (pure, `now`/`today` params, 14 tests); the hand-written live mission tick inside `completeFocusSession` is gone (`tickDailyMissions`, live = reload); `forgiveness` removed. `gameStore.js` **5,413 → 4,696**. `PomodoroEngine.jsx` **2,958 → 1,922** (`shared/ActionButton.jsx`, `components/focus/*`, helpers to `engine/timerSession.js`). Still open: `completeFocusSession` itself (~700 lines) and the setup/support cards still inline in `PomodoroEngine.jsx`. Next candidate: `completeFocusSession` reward assembly → `engine/sessionRewards.js`.

## #3 — ⚠️ **PHẦN LỚN ĐÃ XỬ LÝ (2026-09-02)** — mô tả kỹ năng prestige (Thăng Hoa) không khớp code thật

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


- **⚠️ ĐÃ NỐI DÂY 2026-09-02 — chọn (b) NỐI DÂY, không chọn (a) sửa mô tả.** Ba kỹ năng ấy tốn
  **16 SP**; sửa mô tả thành "không làm gì" là hợp thức hoá việc bán một món hàng rỗng.
  Luật nằm ở `src/engine/prestigeCarryover.js` (thuần, TẤT ĐỊNH — có test đảo thứ tự khoá để
  chứng minh):
  - `kien_thuc_nen` (3 SP) → giữ lại đúng MỘT kỹ năng Cao Cấp, chọn theo *đắt nhất trước, hoà thì
    id nhỏ hơn* (không random, không phụ thuộc thứ tự mở khoá).
  - `ke_thua` (5 SP) → giữ `Math.floor(sp × 0.50)`. **Làm tròn XUỐNG**: hứa 50% thì 13 ra 6, không
    phải 7 — làm tròn lên là tự tặng thêm một điểm mà mô tả không hứa.
  - `sieu_viet` (8 SP) → cờ `prestige.sieuViet` SỐNG SÓT qua reset (để ở `player` thì lần Thăng Hoa
    kế tiếp xoá mất), và phiên ≥30' ở kỷ 1 nhận +100% XP.
  Bài "[ĐẶC TẢ BUG #3]" từng cố ý đóng băng hành vi lỗi đã được **thay** (không nới), kèm một bài
  ĐỐI CHỨNG: chưa mua ba kỹ năng ấy thì reset vẫn sạch trơn — thiếu nó thì bản vá có thể đang tặng
  đặc quyền cho mọi người chơi mà bài chính vẫn xanh.
- **CÒN LẠI (thu hẹp):** vế *"ngưỡng kỷ nguyên giảm 20%"* của `sieu_viet` CHƯA nối — nó đòi sửa
  `getActiveBook`, hàm được gọi một-tham-số ở rất nhiều nơi, và để hai nơi tính ngưỡng khác nhau
  là cách chắc chắn nhất khiến hai màn hình nói hai kỷ khác nhau. Vế ấy **đã được GỠ khỏi mô tả**
  nên app không còn hứa điều nó không làm. Muốn có thì phải làm tử tế: một nguồn duy nhất cho
  ngưỡng, có ADR.

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

## #14 — ⚠️ **GIẢM NHẸ MỘT PHẦN (2026-09-02)** — 95% số phiên tập trung KHÔNG có lễ mừng nào

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


- **⚠️ GIẢM NHẸ, CHƯA ĐÓNG (2026-09-02).** Nguyên nhân gốc (ba hằng số nhân nhau + lọc theo kỷ)
  **KHÔNG đụng tới** — hướng (b) mà Đàm chọn đòi sửa `BUILDING_ZONES`/`placeBuilding`, tức đụng
  thẳng ADR-007 và bố cục Thành Phố; đó là việc riêng, phải có ADR trước.
  Thứ ĐÃ làm là chữa TRIỆU CHỨNG lớn nhất mà không đổi một luật kinh tế nào: thẻ thưởng của phiên
  thường nay nói **TIẾN ĐỘ** thay vì hai con số vô nghĩa. Trước: *"+20 tài nguyên · +18 RP"* —
  giống hệt nhau ở mọi phiên, và Đàm không dùng chúng để quyết bất cứ điều gì. Sau: *"Cảng Biển
  Lớn · còn 4 phiên"* — đổi sau mỗi phiên, và trả lời được câu *"làm thêm phiên nữa thì được gì"*.
  Mỗi phiên đều đẩy hàng đợi tiến một bước; sự thật ấy vốn đã có, chỉ là chưa ai nói ra.
  Thứ tự nhường ở phần mô tả: `stageHint` (hiếm nhất) > `buildHint` > danh sách tài nguyên.
  ⇒ Tỉ lệ phiên có LỄ MỪNG vẫn ~5%; tỉ lệ phiên có một câu **nói được điều gì đó về tiến độ** nay
  là 100% khi hàng đợi không rỗng. Mục này giữ **Open** cho phần gốc.

---

## #102 — `electron/main.js` (tray menu bar) không có test tự động nào cho vòng đời realtime/poll/resume

- **Tên**: Lưới an toàn poll + `powerMonitor` (ADR-072) chỉ được xác nhận bằng đọc code, chưa có
  test tự động chặn hồi quy
- **Module**: `electron/main.js` (hàm `applyTimerLiveUpdate`, `fetchTimerLive`, khối `app.whenReady`)
- **Priority**: Medium · **Severity**: Low
- **Impact**: Đây đúng là lớp mã vừa gây ra bug "menu bar mất đếm ngược, lặp lại nhiều lần" (ADR-072)
  — nếu một phiên sau lỡ xoá `setInterval(fetchTimerLive, …)` hoặc `powerMonitor.on('resume', …)`
  (vd. tưởng là code thừa vì "đã có realtime rồi"), không có bài test nào đỏ để cản, và lỗi chỉ lộ
  ra sau vài ngày dùng thật trên máy Đàm — đúng chu kỳ đã lặp lại trước khi vá lần này.
- **Root Cause**: `electron/main.js` `require('electron')` trực tiếp (`Tray`, `nativeImage`,
  `powerMonitor`, `Notification`...) nên không nạp được bằng `node --test` thường (không có
  runtime Electron thật, và dự án chưa có cơ chế mock module `electron`). Vì vậy chỉ phần logic
  THUẦN được tách sang `electron/trayTimer.js` mới có test (`trayTimer.test.js`); phần glue trong
  `main.js` — bao gồm `applyTimerLiveUpdate` và toàn bộ dây nối `setInterval`/`powerMonitor` —
  chưa từng có test kể từ khi file này tồn tại (không phải nợ mới do lần sửa này tạo ra, nhưng lần
  sửa này làm nó rõ ràng hơn vì logic quan trọng nhất của tray nay nằm ở đúng lớp không test được).
- **Current Risk**: Thấp — code hiện tại đã chạy qua build + lint + test hiện có, và cấu trúc
  `applyTimerLiveUpdate` dùng chung cho cả 2 nhánh (realtime/poll) nên ít chỗ để trượt.
- **Future Risk**: Trung bình — một lần "dọn dẹp tưởng là thừa" trong tương lai có thể xoá đúng
  lưới an toàn này mà không ai biết cho tới khi bug tái diễn lần thứ N+1.
- **Recommended Solution**: Tách phần logic QUYẾT ĐỊNH (không phải I/O) ra khỏi `main.js` thành một
  module thuần thêm — ví dụ để `applyTimerLiveUpdate` (và các hàm `createActiveSessionSnapshot`/
  `getCompletedSessionTotalSeconds`/`rememberActiveSessionSnapshot` nó gọi) sống trong
  `electron/trayTimer.js` cùng chỗ với các hàm thuần khác, nhận state qua tham số thay vì biến
  module-level (`timerData`/`prevIsRunning`/`lastActiveSessionSnapshot`) — khi đó viết test cho
  toàn bộ vòng đời "phiên đang chạy → phiên xong → thông báo" mà không cần mock `electron`. Việc
  polling/`powerMonitor` tự nó (I/O thật) vẫn phải ở `main.js` và vẫn không test được, nhưng phạm
  vi không-test-được co lại chỉ còn đúng phần wiring, không còn ôm cả logic quyết định.
- **Estimated Complexity**: Trung bình — đụng đường ranh giới module hiện có của `trayTimer.js`
  nhưng không đổi hành vi, có thể làm dần khi có việc khác chạm `main.js`.
- **Blocking Conditions**: Không có — không chặn việc gì khác.
- **Review Trigger**: Lần tới có ai sửa `electron/main.js` vì bất kỳ lý do gì, hoặc nếu bug "menu
  bar mất đếm ngược" tái diễn lần nữa sau bản vá ADR-072 này.
- **Owner**: chưa ai · **Status**: MỞ
