# Changelog — Pomodoro DC

> Đây KHÔNG phải lịch sử commit, và KHÔNG phải bản sao của `BAN_GIAO.md`. File này là bản tóm tắt
> CHÍNH THỨC, NGẮN GỌN theo mốc thay đổi quan trọng — chỉ ghi mục đích/phạm vi/ảnh hưởng/tương
> thích, để người đọc (hoặc AI) nắm nhanh project đã tiến hoá thế nào theo thời gian mà không phải
> đọc hết nhật ký chi tiết.
>
> **Muốn xem bối cảnh đầy đủ, lý do từng dòng, số liệu test chính xác từng lần** → đọc mục "Nhật ký
> cập nhật" trong `BAN_GIAO.md` (đó mới là nguồn chi tiết đầy đủ nhất, cập nhật ngay sau mỗi việc).
> **Muốn hiểu VÌ SAO một quyết định được chọn** → `ARCHITECTURE_DECISIONS.md`. **Muốn biết migration
> cụ thể nào cần chạy** → `MIGRATION.md`.

---

## 2026-08-12 — Thành Phố (Phase 3C): ánh sáng Phục Hưng

- **Mục đích**: Đàm yêu cầu *"làm đẹp như các bức tranh phục hưng"*. Phase này **không thêm một hình
  khối nào** — chỉ đổi cách ánh sáng và màu được diễn giải. Bài học chính: thứ làm một cảnh 3D đẹp
  lên hầu như không nằm ở mô hình.
- **Phạm vi**: hướng nắng · tone mapping · tỉ lệ nắng/đèn nền · bảng màu hai theme · viền tối góc ·
  quầng sáng mặt trời trên vòm trời · khoảng cách camera. Không đụng dữ liệu, không đụng state.
- **Lỗi lớn nhất đã sửa**: **mặt trời vốn đứng ngay sau lưng camera** (tích vô hướng với trục nhìn
  = −0,98) — kiểu chiếu sáng như đèn flash máy ảnh, làm mọi hình khối bẹp dí và vô hiệu hoá toàn bộ
  công dựng dáng nhà ở Phase 3B. Không lint/build/test nào bắt được vì code hoàn toàn hợp lệ; nay
  đã có **test hình học khoá lại**.
- **Ảnh hưởng**: 393 → **394 bài test, 0 fail**. Chunk chính KHÔNG to thêm (134,44 KB gzip). Viền
  tối góc làm bằng CSS nên **không tốn thêm một khung hình nào** — luật pin giữ nguyên.
- **Tương thích**: hoàn toàn tương thích ngược, không cần chạy SQL, không đổi phiên bản store nào.

## 2026-08-12 — Thành Phố (Phase 3B): 75 công trình khác nhau thật + thành phố có người ở

- **Mục đích**: Đàm xem bản 3A rồi nói *"quá đơn giản và không đẹp"*, và yêu cầu *"tối ưu hình ảnh
  và cộng đồng cư dân, làm đẹp như các bức tranh phục hưng, nhiều animation lên"*. Phase 3B lo hai
  vế đầu: **hình khối** và **cư dân**.
- **Phạm vi**:
  - **Ngôn ngữ hình khối 3 trục** — hình dáng công trình là hàm của (kỷ × loại × độ hiếm × cấp),
    cả ba trục đều đã có sẵn trong dữ liệu game nên **không bịa thêm một byte nào**. 15 × 4 × 3 =
    **75 công trình phân biệt được bằng mắt**, thay vì 15 nhóm giống nhau. Sáu file THUẦN mới ở
    `src/engine/city3d/` (`parts` · `eraStyle` · `archetypes` · `buildingSpec` · `propSpec` ·
    `budget`) — không file nào biết three.js tồn tại.
  - **Bảng màu tranh sơn dầu** — ba nguồn sáng cố ý khác nhiệt độ (nắng ẤM xiên, trời LẠNH rọi
    xuống, đất ẤM hắt lên), vòm trời chuyển sắc, sương mù ở rìa, vùng đất bao quanh.
  - **Cư dân** (`residents.js`) — dân số **suy ra** từ số công trình + số phiên + độ dài chuỗi;
    người đi bộ dọc đường sá trong phần phố đã mở.
- **Ảnh hưởng**: 360 → **393 bài test, 0 fail**. Cả thành phố (công trình + cảnh vật) vẫn gộp trong
  **1 lệnh vẽ** nhờ hình học gộp — "mỗi công trình một dáng riêng" KHÔNG đồng nghĩa với 75 lệnh vẽ.
  Không đổi dữ liệu, không đổi cân bằng game, **0 byte** thêm vào dữ liệu đồng bộ Supabase.
- **Đánh đổi đã cân nhắc**: cư dân đi lại ⇒ phải vẽ liên tục ⇒ phá luật "đứng yên = 0 nhịp vẽ" của
  Phase 3A. Chấp nhận vì chuyển động chính là nội dung của màn hình này, nhưng bù lại **ba lớp bảo
  vệ pin**: trần 30 khung/giây, dừng hẳn khi rời tab, tắt sạch khi bật "giảm chuyển động" của hệ
  điều hành hoặc khi xem bảo tàng.
- **Tương thích**: hoàn toàn tương thích ngược, không cần chạy SQL, không đổi phiên bản store nào.

## 2026-08-12 — Thành Phố (Phase 3A): bộ vẽ 3D thật (three.js) + bảng đo hiệu năng

- **Mục đích**: thay bộ vẽ phẳng bằng 3D thật. Phase này CỐ Ý dừng ở hình khối thô — mục tiêu là
  **đo xem iPhone của Đàm có kham nổi không** trước khi đầu tư vào mỹ thuật. Đẹp là việc Phase 3B.
- **Phạm vi**: thêm đúng MỘT thư viện — `three@0.185.1` (ghim cứng, không `^`; thư viện này không
  có dependency con nào). Bốn file logic THUẦN mới ở `src/engine/city3d/` (luật chọn 3D/2D, nhịp
  khung hình, toán camera, cầu nối màu) + `src/components/city/render3d/` (nơi DUY NHẤT được import
  three) + `CityStage.jsx` chọn bộ vẽ + `CityPerfHud.jsx`. Cài đặt mới: "Thành Phố" (Tự động / Luôn
  3D / Luôn 2D) và công tắc bảng số liệu hiệu năng.
- **Ảnh hưởng**: **chunk chính KHÔNG to thêm** (134,4 KB gzip, y như trước) — three.js nằm ở chunk
  riêng `vendor-three` (130 KB gzip) chỉ tải khi thật sự dùng tới bản 3D. Không đổi dữ liệu, không
  đổi cân bằng game. 315 → **360 bài test, 0 fail.**
- **Luật pin**: thành phố đứng yên ⇒ **không một nhịp vẽ nào tồn tại** (không phải "có nhịp nhưng
  bỏ qua"). Bóng đổ chỉ tính lại khi cảnh thật sự đổi. Cả thành phố gộp còn **3 lệnh vẽ**.
- **Ba cửa lùi về 2D**, cửa nào cũng dẫn về hình chứ không dẫn tới màn hình trống: máy không có
  WebGL2 → 2D ngay; dựng cảnh thất bại → 2D; đang chạy mà mất tài nguyên đồ hoạ hoặc quá chậm → tự
  chuyển về 2D kèm một dòng giải thích cho Đàm biết vì sao hình vừa đổi kiểu.
- **Tương thích**: hoàn toàn tương thích ngược, không cần chạy SQL. `settingsStore` version 6 → 7
  (xem `MIGRATION.md`) — 0 byte thêm vào dữ liệu đồng bộ Supabase.
- **✅ Cổng hiệu năng đã qua** — nhưng qua bằng QUYẾT ĐỊNH của Đàm sau khi xem trên máy thật
  (*"hãy tiếp tục xây dựng sản phẩm và không dừng lại"*), không bằng con số đo. Vì vậy **mọi lưới
  an toàn giữ nguyên**: watchdog FPS, ba cửa lùi về 2D, và bản 2D vẫn nằm đó làm nền.

## 2026-08-12 — Thành Phố (Phase 3-2D): tab Thành Phố hiện ra, vẽ bằng SVG

- **Mục đích**: cho Đàm NHÌN THẤY thành phố của mình lần đầu — hai Phase trước chỉ dựng dữ liệu,
  chưa có gì trên màn hình. Đồng thời dựng sẵn chỗ đứng cho bộ vẽ 3D (three.js) đã được duyệt làm
  tiếp, mà không phải đập đi làm lại phần khung.
- **Phạm vi**: tab mới "Thành Phố" (`CityView.jsx`, nạp lười — chunk riêng ~14 KB) + thư mục
  `src/components/city/` chia làm KHUNG (`CityViewShell.jsx`) và BỘ VẼ (`render2d/`). Sửa
  `src/App.jsx` đúng 5 chỗ (import lười, icon, 2 danh sách tab, khối render). **Không đụng
  `store/`, `engine/`, `hooks/`, `lib/`** — 0 dòng thay đổi logic game.
- **Ảnh hưởng**: thuần hiển thị, không đổi dữ liệu, không đổi cân bằng, không thêm thư viện nào.
  Thanh tab dưới trên iPhone vẫn giữ đúng 4 nút chính — "Thành Phố" nằm trong nút "Thêm". Toàn bộ
  144 ô nền được gộp thành 4 phần tử SVG để giữ số phần tử DOM thấp. 309 → **315 bài test, 0 fail**
  (+6 bài đọc mã nguồn để khoá ranh giới kiến trúc, đặt sẵn trước khi three.js xuất hiện).
- **Tương thích**: hoàn toàn tương thích ngược. Không cần chạy SQL, không migration.
- **Quyết định kiến trúc**: KHUNG không biết BỘ VẼ nào đang chạy, và bộ vẽ 2D được giữ làm nền
  **vĩnh viễn** (đường lui khi máy không có WebGL / mất context / Đàm tự chọn tắt 3D) chứ không
  phải bản nháp sẽ xoá — xem ADR-008.

## 2026-08-12 — Thành Phố Pixel (Phase 1–2/6): nền móng thuần + bảo tàng thành phố các kỷ đã qua

- **Mục đích**: biến "danh sách công trình đã xây" thành một thành phố nhìn thấy được, và ngừng
  XOÁ VĨNH VIỄN thành phố của mỗi kỷ khi lên kỷ mới. Đàm duyệt spec ngày 2026-08-12 và **miễn trừ
  cổng Giai đoạn A** riêng cho hạng mục gamification này.
- **Phạm vi**: Phase 1 — 2 file engine THUẦN mới (`src/engine/cityLayout.js` suy ra bố cục thành
  phố bằng băm tất định, `cityArchive.js` quản lý bảo tàng) + 2 file test, **0 dòng đụng vào state
  hay UI**. Phase 2 — thêm đúng MỘT trường state `cityArchive`, sửa `pruneEraScopedBlueprintState`
  để ghi lại thứ nó cắt, bump `GAME_STORE_SCHEMA_VERSION` 3 → 4, và thêm `cityArchive` vào cả 3
  danh sách trường được lưu (localStorage · file backup · đồng bộ Supabase).
- **Ảnh hưởng**: **cân bằng game KHÔNG đổi một chút nào** — công trình kỷ cũ vẫn bị cắt y hệt, chỉ
  được sao chép sang một kho riêng chỉ-để-ngắm trước khi bị vứt. Có test hồi quy khoá điều này.
  State phình thêm ~1,7 KB cho cả 15 kỷ (+0,07%). Chưa có gì hiện ra trên màn hình — UI là Phase 3.
  261 → **309 bài test, 0 fail**.
- **Tương thích**: hoàn toàn tương thích ngược, không cần chạy SQL Supabase (thay đổi nằm trong
  khối JSONB sẵn có). Save cũ thiếu `cityArchive` → mặc định `{}`. Xem `MIGRATION.md` schema 3→4.
- **Giới hạn phải biết**: thành phố các kỷ Đàm ĐÃ đi qua trước 2026-08-12 mất vĩnh viễn, không
  khôi phục được — bảo tàng chỉ ghi từ kỷ đang chơi trở đi; kỷ cũ hiện là "Thành phố thất truyền".

## 2026-08-10 — Sửa khoảng trắng thừa trên icon thanh menu Mac

- **Mục đích**: bỏ khoảng trắng nằm ngay trước 🍅 (đang tập trung) và ☕ (đang giải lao) trên thanh
  menu Mac.
- **Phạm vi**: `electron/main.js` (1 dòng: `nativeImage.createEmpty()` thay cho việc nạp một PNG
  trong suốt) + xoá asset `public/tray-empty.png`. KHÔNG đụng web app.
- **Ảnh hưởng**: thuần hiển thị của app tray; không đổi logic timer, không đổi dữ liệu, không đổi
  API. 261 test giữ nguyên và vẫn xanh.
- **Tương thích**: không cần migration. Cần khởi động lại app tray để thấy thay đổi.
- **Bài học**: "ảnh trong suốt" không bằng "không có ảnh" — macOS vẫn chừa chỗ cho ảnh 16x16 dù
  alpha = 0 (`CLAUDE.md`, BẪY 4).

## 2026-07-17 — Giai đoạn A: bản vá C1 (đóng blocker Critical của lớp đồng bộ)

- **Mục đích**: bịt 4 đường mất dữ liệu quanh cơ chế "First Action Wins" mà compare-and-swap
  không tự đỡ được — thiết kế đã qua 2 vòng phản biện (Principal Engineer tự bác bỏ + Technical
  Advisor) trước khi viết dòng code đầu tiên.
- **Phạm vi**: chỉ `src/lib/syncService.js` (~60 dòng) + test. Đẩy ngay khi rời app nếu còn thay
  đổi chờ; chặn state trắng ghi đè cloud (`hasMeaningfulState`); bịt đường ghi không-CAS ở nhánh
  chưa-biết-version; báo to khi thiếu cột `version`; huỷ lịch push mồ côi khi nạp bản cloud.
- **Ảnh hưởng**: không đổi giao thức, không đổi schema, không đổi API công khai; 253→261 test.
- **Tương thích**: không cần migration mới (cột `version` đã có từ 2026-07-11).
- **Chưa làm (có chủ đích)**: merge theo trường cho xung đột offline khác-trường — xem
  `TECH_DEBT.md` #8.

## 2026-07-17 — Giai đoạn A: lưới an toàn đợt 2 (level-up, prestige, streak, skill, sync-retry)

- **Mục đích**: hoàn tất phần còn thiếu của "safety net" — bảo đảm các tài sản quan trọng (SP,
  cấp độ, chuỗi ngày, và đặc biệt toàn bộ dữ liệu giữ-lại khi Thăng Hoa) không mất âm thầm sau
  các thao tác chính.
- **Phạm vi**: +16 bài test (237→253), gồm 1 file MỚI `gameStore.prestige.test.js` (bảo toàn
  từng khoá whitelist qua `triggerPrestige` + đóng băng bug TECH_DEBT #3 bằng characterization)
  và bổ sung vào 4 file test có sẵn (`computeLevelUps` trực tiếp, streak nối/đứt chuỗi,
  `unlockSkill` cơ bản, sync retry-sau-lỗi).
- **Ảnh hưởng**: chỉ-thêm-test; không đổi một dòng code ứng dụng; lint sạch; build OK.
- **Tương thích**: không thay đổi runtime/API/migration.
- **Ghi chú**: bug #3 (3 kỹ năng Thăng Hoa hứa đặc quyền nhưng không nối dây) nay bị ĐÓNG BĂNG
  bằng test — sửa #3 trong tương lai bắt buộc phải cập nhật test đó một cách có ý thức.

## 2026-07-13 — Giai đoạn A: lưới an toàn test cho đường-tiền + đường-sync + hủy phiên

- **Mục đích**: dựng "safety net" characterization/behavior test TRƯỚC khi được phép refactor hoặc
  sửa logic quan trọng — đòn bẩy #1 để tiến gần cổng Giai đoạn A của roadmap POS (tiêu chí "test đủ
  bảo vệ module quan trọng").
- **Phạm vi**: 3 file test MỚI, chỉ-thêm-test: `gameStore.completeFocusSession.test.js` (15 bài),
  `syncService.behavior.test.js` (8 bài), `gameStore.cancelFocusSession.test.js` (6 bài). Khóa
  hành vi thật của XP/EP/level/loot/RNG-tất-định, push/pull compare-and-swap (thắng/thua/re-pull/
  lỗi), và phạt/rollback khi hủy phiên.
- **Ảnh hưởng**: `npm test` 208→237 bài (xanh hết); lint sạch; build OK. **KHÔNG đổi một dòng code
  ứng dụng nào** — bundle production không đổi (Vite không đóng gói file test).
- **Tương thích**: không có thay đổi runtime, không đổi API, không migration.
- **Ghi chú**: test #7 của sync KHÓA CHỦ ĐÍCH hành vi rủi ro C1 (initSync đẩy local vô điều kiện khi
  cloud không mới hơn) làm đặc tả hiện trạng; các nhánh phạt early-return + waive-bằng-than-lượng +
  bảo tồn dữ liệu qua prestige còn để dành (NOTE trong file test).

## 2026-07-12 — Refactor kiến trúc toàn dự án + thiết lập Project Governance Protocol

- **Mục đích**: dọn trùng lặp code tích luỹ qua nhiều tháng, chuẩn hoá cấu trúc thư mục theo domain,
  giảm coupling — theo yêu cầu "Senior Software Architect" của Đàm (10 nguyên tắc rõ ràng).
- **Phạm vi**: 90 file bị đụng (thêm/sửa/xoá/dời); gom toàn bộ AI Coach vào `src/engine/coach/`;
  gộp 9 mảng logic bị chép tay nhiều nơi (mark-label, AudioContext, auth-check cron, badge/style,
  Rich Text parser, Glyph icon, pipeline Gemini, payload push, helper Gemini thuần); xoá dead code
  (~1350 dòng); thêm `ARCHITECTURE.md`+`PROJECT_STRUCTURE.md`.
- **Ảnh hưởng**: `npm test` 195→208 bài; lint sạch; build OK; vẫn đúng 10 Serverless Functions.
- **Tương thích**: không đổi business logic ngoài 1 bug xác nhận đã sửa (`isSessionEndEvent` lệch
  chuẩn giữa 2 route push, nay hợp nhất 1 bản đúng).
- **Đi kèm**: thiết lập Project Governance Protocol (file này + `TECH_DEBT.md`+`MIGRATION.md`+
  `ARCHITECTURE_DECISIONS.md`+`AI_ONBOARDING.md` mới, section governance mới trong `CLAUDE.md`).

## 2026-07-11 — Sự cố kép: sync mất dữ liệu + Supabase tự pause + vượt trần Vercel function

- **Mục đích**: xử lý 3 sự cố production liên tiếp trong cùng một ngày.
- **Phạm vi**: (1) thiết kế lại cơ chế sync sang "First Action Wins" (version compare-and-swap
  phía server, thay cho so sánh timestamp client); (2) dọn log cron phình dung lượng + thêm cron
  keepalive chống Supabase tự pause; (3) chuyển toàn bộ test `api/` vào `api/_tests/` để không còn
  bị Vercel tính oan vào trần 12 Serverless Functions.
- **Ảnh hưởng**: mất vĩnh viễn 1 phiên tập trung thật (không phục hồi được, chấp nhận có chủ đích
  để không tạo dữ liệu giả đi vòng qua hệ thống XP/streak).
- **Tương thích**: đổi schema DB (thêm cột `version` cho `game_state`) — xem `MIGRATION.md`.
- **Chi tiết đầy đủ**: `BAN_GIAO.md` (3 mục nhật ký cùng ngày) + `ARCHITECTURE_DECISIONS.md` ADR-004/005.

## 2026-06-25 — Hoàn tất chuỗi 6 mảng nâng cấp trí tuệ AI Coach

- **Mục đích**: nâng cấp toàn diện AI Coach theo lệnh "làm toàn bộ, chuyên sâu" của Đàm.
- **Phạm vi**: (1) siết niềm tin (nhiệt độ giải mã, bộ chấm điểm chống-bịa, timeout); (2) tín hiệu
  "phiên liền mạch vs ngắt quãng" (`pauseSegments`); (3) Coach chủ động tự nhắc sau mỗi phiên; (4)
  model mạnh hơn (`gemini-2.5-pro`) cho bài phân tích 4 phần; (5) bộ nhớ lời khuyên theo thời gian;
  (6) cảnh báo chuỗi sắp đứt qua push (cron chiều tối).
- **Ảnh hưởng**: AI Coach trở thành tính năng khác biệt hoá lớn nhất của app.
- **Lưu ý tương thích quan trọng**: mảng (6) từng bị Vercel build FAIL âm thầm ngay khi commit (do
  cùng nguyên nhân vượt trần function ở trên) — KHÔNG chạy thật trên production suốt 25/6–11/7 dù
  tài liệu ghi "hoàn tất". Bài học: xác nhận Vercel Deployments "Ready", đừng tin code xanh.

## 2026-06-24 — Chốt AI Coach: chỉ Gemini đám mây, gỡ hẳn Qwen/WebLLM on-device

- **Mục đích**: Qwen 3B chất lượng kém + không chạy được trên iPhone.
- **Phạm vi**: xoá `webllmEngine.js`, dependency `@mlc-ai/web-llm`, mọi nhánh fallback on-device.
  Bật billing Gemini (hết lỗi 429).
- **Ảnh hưởng**: app nhẹ hơn hẳn, AI Coach chạy được TRÊN CẢ IPHONE.
- **Tương thích**: đánh đổi có chủ đích — mất mạng/hết quota = Coach ngừng, không còn dự phòng
  chạy tại chỗ. Xem `ARCHITECTURE_DECISIONS.md` ADR-003.

## 2026-06-20 → 2026-06-24 — Nhiều vòng nâng cấp "bộ não" AI Coach (chuyên gia hoá + chống-bịa)

- **Mục đích**: Coach từ một bộ trả lời đơn giản trở thành "chuyên gia phân tích dữ liệu" đáng tin.
- **Phạm vi**: khung 3 nhịp (chat)/4 phần (báo cáo tổng thể); lưới chống-bịa số nhiều tầng
  (`findFabricatedNumbers`/`findFabricatedFractions`/`findMismatchedPairs`); tầng số liệu
  `coachIntel.js` (Wilson lower bound, hồ sơ tập trung, dự đoán); nhiều tín hiệu phân tích mới
  (giờ vàng, xu hướng dài hạn, cuối tuần vs trong tuần, phục hồi sau nghỉ...).
- **Ảnh hưởng**: đặt nền móng "AI chỉ diễn đạt số đã tính sẵn, không bao giờ tự tính" — nguyên tắc
  áp dụng xuyên suốt tới nay.
- **Chi tiết đầy đủ**: `BAN_GIAO.md` có ~15 mục nhật ký riêng cho giai đoạn này (mỗi lần chỉnh guard
  đều ghi số liệu BẮT%/BÁO NHẦM% cụ thể).

## 2026-06-20 — "Cộng Hưởng": nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu

- **Mục đích**: liên kết 3 hệ thống tiến triển vốn tách rời, không lạm phát.
- **Phạm vi**: thêm currency TTCH (Tinh Thể Cộng Hưởng, cap 12), cơ chế cộng hưởng di vật↔kỹ năng
  (giảm 50% giá SP), "Dồn Lực" (chỉ 1 hiệu ứng bùng nổ/phiên), softcap phòng-hờ cho tương lai.
- **Ảnh hưởng**: không đổi additive-pool hiện có; mọi softcap mới là no-op tại thời điểm ra mắt
  (phòng hờ cho nội dung tương lai).

## 2026-06-14 → 2026-06-16 — Làm lại giao diện theo hướng "calm focus" + 4 skin + icon riêng

- **Mục đích**: UI/UX review đa chiều, chọn hướng "tập trung tĩnh lặng".
- **Phạm vi**: "Focus tĩnh" khi đang chạy phiên (ẩn huy hiệu game); 4 skin (Editorial/Aurora/
  Ink&Gold/Swiss) qua token CSS; bộ icon hình học tự vẽ thay emoji; sidebar tối gọn; cột phải
  Focus (Hôm nay/Chuỗi/AI Coach).
- **Ảnh hưởng**: chỉ giao diện — không đổi game logic.

## 2026-06-14 — Khởi động chuỗi nâng cấp gameplay ("upgrade roadmap")

- **Mục đích**: audit đa-agent tìm hướng nâng cấp UX/UI/gameplay, chọn hướng "deep & differentiating".
- **Phạm vi**: thưởng mục tiêu thật (+12% khi đạt goal), gợi ý độ dài phiên thông minh, lá chắn
  streak, onboarding 3 thẻ, và khởi đầu ý tưởng AI Coach.
- **Ảnh hưởng**: đặt nền cho toàn bộ các đợt nâng cấp lớn sau này.

---

## Ghi chú vận hành

- Mỗi lần hoàn thành một thay đổi ĐÁNG KỂ (không phải mọi commit nhỏ), thêm 1 mục MỚI vào ĐẦU file
  này — ngắn gọn (mục đích/phạm vi/ảnh hưởng/tương thích), không kể lể chi tiết như `BAN_GIAO.md`.
- Nếu thay đổi có một quyết định kiến trúc đáng ghi ADR → thêm cả vào `ARCHITECTURE_DECISIONS.md`
  và trỏ chéo. Nếu có migration thật → thêm vào `MIGRATION.md` và trỏ chéo.
