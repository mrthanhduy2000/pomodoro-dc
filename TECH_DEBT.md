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
> **Trạng thái ngưỡng hiện tại (2026-08-15, cập nhật sau Phase 7D)**: **1 mục Priority High**
> (#14) → vẫn CHƯA đạt ngưỡng 8–10 mục để đề xuất Maintenance Sprint. Còn **3 mục Medium-High**
> (#3, #13, và **#24** — 14/15 kỷ có công trình bị mép khung hình cắt, đã đo đủ, chờ Đàm chọn
> hướng), **4 mục Medium** và **2 mục Low** (#25 — nhà dân nhỏ nhất ở 3 kỷ không có cửa sổ; **#27**
> — MỚI: 3 cặp kỷ có mặt đường gần trùng nhau vào BAN ĐÊM, đều cách nhau ≥3 kỷ, đã đo đủ và có
> chủ đích chưa xử lý).
> ⚠️ **#26 (MỚI, Medium) và #23 đóng được bằng CÙNG MỘT lần đo**: Phase 7C vừa cộng thêm ~50% tam
> giác mỗi cảnh lên một hệ thống mà cổng hiệu năng iPhone **chưa được cân lại kể từ trước Phase 7A**.
> Một ảnh chụp HUD trên máy Đàm đóng cả hai. Nên làm TRƯỚC bước "Living City".
> Bốn mục Medium: **#26**, **#23** (cổng hiệu năng iPhone chưa đo lại sau khi đổi sang PBR),
> **#22** (công cụ `sweep-score.mjs` không còn chấm được 15 kỷ) và
> **#19** (nay đang **treo chờ #22**: hai con số nghiệm thu của nó đo trên bảng mái CŨ, đã bị Phase
> 6B thay hẳn, mà chưa đo lại được). **#15, #16, #17 và #20 đều đã đóng** — không còn mục nào chờ
> Đàm chọn hướng mỹ thuật.
> ⚠️ **#22 là ví dụ sạch nhất trong cả file này của một luật đáng nhớ**: *sửa đúng mã sản phẩm vẫn
> có thể làm HỎNG công cụ đo*, vì công cụ đo bao giờ cũng đứng trên vài giả định không được viết ra
> về thứ nó đang đo. Ở đây giả định ngầm là *"mái là thứ tươi nhất khung hình"* — đúng suốt thời kỳ
> mái suy từ màu nhấn giao diện, và chết ngay khi mái thành vật liệu lợp thật.
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

## #9 — Persist localStorage không bắt `QuotaExceededError`

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
> 3. Việc sửa này **làm hỏng công cụ đo** `sweep-score.mjs` → xem mục **#22** ngay đầu file.

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
- **Status**: Open — chưa đo.
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
- **Status**: Open — đã chặn không cho nói dối, CHƯA khôi phục được năng lực đo.

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

## #27 — Ba cặp kỷ có mặt đường gần trùng nhau VÀO BAN ĐÊM (ban ngày thì không)

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
- **Owner**: Đàm (đo) → phiên AI kế tiếp (cắt nếu cần) · **Status**: Open
