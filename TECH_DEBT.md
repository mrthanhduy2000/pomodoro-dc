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
> **Trạng thái ngưỡng hiện tại (2026-08-13, cập nhật sau Phase 3X)**: **1 mục Priority High** (#14)
> → vẫn CHƯA đạt ngưỡng 8–10 mục để đề xuất Maintenance Sprint. Còn **2 mục Medium-High** (#3, #13)
> — #15 và #16 đều đã đóng.
> ⚠️ **CÒN MỘT mục đang CHỜ ĐÀM QUYẾT, không phải chờ AI làm**: #14 (95% phiên im lặng — cân bằng
> game). Review Trigger của nó chặn các khoản đầu tư kế tiếp vào lễ mừng, nên **để lâu thì mọi phase
> lễ mừng sau đều lãi thấp một cách có hệ thống**. Đây là chỗ đáng hỏi Đàm trước khi làm thêm.
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
  lý mục này thì khoản đầu tư đó chỉ chạm tới 5% số phiên.
- **Owner**: (chưa gán)
- **Status**: Open — hướng đã chốt (b), CHƯA hiện thực. Phát hiện 2026-08-12 (Phase 3T) khi tự vấn "một màn hình nhàm đi sau bao nhiêu
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
