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
> **Trạng thái ngưỡng hiện tại (2026-07-17)**: 0 mục Priority High/Critical (mục #8 và #9 có
> Severity cao nhưng Priority Medium) → CHƯA đạt ngưỡng đề xuất Maintenance Sprint. Mục có
> Priority cao nhất hiện tại là Medium-High (mục #3).

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
