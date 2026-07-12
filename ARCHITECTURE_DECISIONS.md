# Architecture Decision Records — Pomodoro DC

> "Bộ nhớ kiến trúc" của dự án — trả lời **VÌ SAO** hệ thống được thiết kế như hiện tại, không chỉ
> **NHƯ THẾ NÀO**. Xem `ARCHITECTURE.md` để biết hệ thống đang vận hành ra sao; xem file này để
> biết vì sao nó lại vận hành đúng như vậy chứ không phải một cách khác tưởng như đơn giản hơn.
>
> **Quy tắc ghi**: mỗi quyết định kiến trúc thật (không phải chi tiết vặt) phải có đủ 9 mục dưới
> đây. Thêm bản ghi mới ở ĐẦU danh sách (mới nhất trước). Không xoá bản ghi cũ dù quyết định sau
> này bị đảo ngược — thêm bản ghi MỚI ghi rõ "đảo ngược quyết định #X, lý do", để lịch sử tư duy
> không bị mất. Đây là một phần bắt buộc của Project Governance Protocol — xem `CLAUDE.md`.

---

## ADR-006 — Không tách nhỏ `gameStore.js` trong đợt refactor kiến trúc toàn diện

- **Ngày**: 2026-07-12
- **Bối cảnh**: Đàm yêu cầu refactor kiến trúc toàn dự án theo 10 nguyên tắc rõ ràng, trong đó có
  điều khoản riêng cho "God File": nếu buộc phải sửa `gameStore.js`/`StatsDashboard.jsx` thì phải
  tách các phần logic độc lập ra ngoài (helper thuần, hàm định dạng...) ở mức rủi ro thấp, nhưng
  KHÔNG bắt buộc tách hẳn store/component thành nhiều phần ngay trong đợt này.
- **Vấn đề**: `gameStore.js` dài ~6.000 dòng, có ~78 action, một action (`completeFocusSession`)
  dài ~760 dòng đọc/ghi hàng chục slice state trong một lệnh `set()`. Đây là "God File" kinh điển.
- **Phương án đã cân nhắc**:
  1. Tách toàn bộ thành nhiều slice Zustand riêng (streak/mission/achievement/crafting/prestige...).
  2. Chỉ rút các hàm/logic thuần độc lập ra `src/engine/`/file riêng, giữ nguyên cấu trúc store.
  3. Không đụng gì tới `gameStore.js` trong đợt này.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì tách một store có ~78 action liên kết chặt chẽ
  (một action đọc/ghi hàng chục slice) mà KHÔNG có bộ test hành vi đầy đủ bao phủ trước sẽ tạo rủi
  ro "tính sai điểm/XP/streak âm thầm, không crash" — loại lỗi nguy hiểm nhất vì không tự lộ ra;
  đợt refactor này ưu tiên "không đổi hành vi" tuyệt đối, không phù hợp để đánh cược rủi ro lớn.
  (3) bị loại vì bỏ qua yêu cầu rõ ràng của Đàm về xử lý God File khi động vào khu vực liên quan
  (đã phải sửa `StatsDashboard.jsx` trong đợt này để xoá dead code, nên "không đụng gì" không khả thi).
- **Giải pháp được chọn**: phương án (2) — rút `statsFormatters.js` (11 hàm định dạng thuần + test)
  khỏi `StatsDashboard.jsx`; giữ nguyên cấu trúc `gameStore.js`.
- **Trade-off**: file vẫn khó đọc/khó onboard cho một AI/người mới; đổi lại rủi ro giới thiệu bug
  âm thầm gần như bằng 0 vì không đổi luồng logic nào.
- **Ảnh hưởng**: `gameStore.js` vẫn là "God File" — bất kỳ ai sửa nó phải đọc kỹ trước, đặc biệt
  action `completeFocusSession`. Xem `TECH_DEBT.md` mục tương ứng.
- **Điều kiện xem xét lại**: khi `completeFocusSession` tiếp tục phình to (dấu hiệu cụ thể: vượt
  ~900-1000 dòng, hoặc thêm 1 hệ thống gameplay lớn mới cần cắm vào đúng điểm này) — và CHỈ khi có
  kế hoạch viết thêm test hành vi bao phủ đầy đủ TRƯỚC khi tách, không tách "cho gọn" suông.

---

## ADR-005 — Cấu trúc `api/_lib/` + `api/_tests/` với tiền tố gạch dưới

- **Ngày**: 2026-07-11
- **Bối cảnh**: Vercel gói Hobby giới hạn 12 Serverless Functions/deploy. Thêm `api/keepalive.js`
  (cron giữ Supabase không tự pause) khiến deploy FAIL: "No more than 12 Serverless Functions...".
- **Vấn đề gốc**: Vercel (chế độ build "Other"/không framework cho `api/`) coi MỌI file `.js` nằm
  TRỰC TIẾP trong `api/` (đệ quy) là 1 Serverless Function riêng — kể cả file test — TRỪ file/thư
  mục có tên bắt đầu bằng `_`. Lúc đó có 5 file `*.test.js` nằm lẫn trong `api/`/`api/push/` bị
  tính oan vào trần 12.
- **Phương án đã cân nhắc**:
  1. `.vercelignore` loại trừ `*.test.js` theo tên/pattern (vá nhanh).
  2. Chuyển toàn bộ test của `api/` vào `api/_tests/` (mirror cấu trúc `api/`), dùng đúng quy ước
     underscore-prefix Vercel đã tôn trọng sẵn cho `api/_lib/`.
  3. Xoá bớt function (gộp nhiều route thành 1 file dùng router nội bộ) để có dư chỗ.
- **Lý do loại bỏ từng phương án**: (1) bị Đàm BÁC BỎ có chủ đích — đây là vá THEO TÊN FILE, nghĩa
  là phải nhớ cập nhật blacklist mỗi khi thêm loại file test mới (`.spec.js`, `.mock.js`...), một
  gánh nặng bảo trì vĩnh viễn thay vì fix gốc; (3) bị loại vì làm giảm khả năng đọc/tách bạch từng
  route, và không giải quyết được vấn đề gốc (Vercel vẫn đếm sai file test nếu lỡ đặt nhầm chỗ).
- **Giải pháp được chọn**: phương án (2) — cấu trúc này AN TOÀN VĨNH VIỄN vì không phụ thuộc tên
  file cụ thể: dù sau này thêm hàng trăm file test bất kỳ tên gì đặt ĐÚNG trong `api/_tests/` cũng
  không bao giờ bị tính vào trần 12. `.vercelignore` vẫn giữ làm lớp phòng thủ THỨ HAI (mở rộng
  thêm các đuôi file phụ trợ khác) phòng khi lỡ tay đặt nhầm file vào thẳng `api/`.
- **Trade-off**: không có — đây là giải pháp thuần lợi so với phương án vá tạm.
- **Ảnh hưởng**: mọi test API mới BẮT BUỘC đặt trong `api/_tests/` (mirror đường dẫn file đang
  test), không đặt cạnh route handler nữa. `package.json` test glob phải trỏ đúng thư mục này.
- **Bài học đi kèm** (xem thêm `TECH_DEBT.md`/lịch sử sự cố): một lần build fail do vượt trần này
  (`api/coach-digest.js`, commit `8ee264d` ngày 2026-06-25) từng khiến Vercel ÂM THẦM giữ nguyên
  bản deploy CŨ suốt ~2 tuần rưỡi mà không ai để ý — một tính năng "hoàn tất" trên giấy tờ chưa hề
  chạy thật trên production. Từ đó có quy tắc: LUÔN xác nhận tab Deployments trên Vercel dashboard
  hiện "Ready" sau mỗi lần push.
- **Điều kiện xem xét lại**: nếu Vercel đổi chính sách đếm function (không còn áp dụng quy ước
  underscore-prefix), hoặc nếu dự án nâng cấp lên gói trả phí có trần function cao hơn nhiều (khi
  đó áp lực tổ chức theo trần 12 không còn, nhưng cấu trúc `_lib`/`_tests` vẫn nên giữ vì bản thân
  nó là một quy ước tổ chức tốt, độc lập với lý do Vercel).

---

## ADR-004 — "First Action Wins": đồng bộ đa thiết bị dựa trên version phía server, không phải timestamp máy khách

- **Ngày**: 2026-07-11
- **Bối cảnh**: App chạy trên nhiều thiết bị (Mac laptop + iPhone) có thể mở CÙNG LÚC, cùng ghi
  dữ liệu vào 1 dòng Supabase (`game_state`).
- **Vấn đề**: cơ chế cũ ghi `updated_at` bằng đồng hồ CỦA CHÍNH THIẾT BỊ khi đẩy dữ liệu lên —
  máy nào đẩy TỚI ĐÍCH sau cùng thắng, bất kể ai thao tác trước. Đây là lỗ hổng THIẾT KẾ (không
  phải bug cụ thể): bất cứ lúc nào 2 thiết bị mở gần đồng thời đều CÓ THỂ mất dữ liệu do "ăn may
  ai ghi cuối". Đã thực sự gây mất 1 phiên tập trung thật (25 phút, +26 XP) không thể phục hồi.
- **Phương án đã cân nhắc**:
  1. Giữ nguyên so sánh timestamp client, chỉ thêm cảnh báo UI khi phát hiện xung đột.
  2. Khoá optimistic-lock qua cột `version` tăng bởi TRIGGER PHÍA SERVER (compare-and-swap).
  3. Khoá bi quan (pessimistic lock) — một thiết bị phải "xin khoá" trước khi ghi.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì timestamp client KHÔNG đáng tin — lệch đồng hồ
  giữa thiết bị, và quan trọng hơn, không có khái niệm "thứ tự thao tác THẬT" được cả 2 bên đồng
  thuận — chỉ thêm cảnh báo không giải quyết được gốc rễ mất dữ liệu; (3) bị loại vì phức tạp hoá
  quá mức cho một app 1-người-dùng (cần xử lý khoá hết hạn, deadlock, UX xin/nhả khoá) trong khi
  lợi ích không hơn nhiều so với (2).
- **Giải pháp được chọn**: phương án (2) — cột `version` (integer) trên `game_state`, tăng bởi
  trigger Postgres (`supabase/game_state_version.sql`), KHÔNG phụ thuộc đồng hồ máy khách nào.
  Mọi lần ghi từ `syncService.js` kèm điều kiện `.eq('version', expectedVersion)`; ghi bị từ chối
  (0 dòng khớp) → thiết bị đó THUA, buộc `pullFromCloud()` nhận lại bản đã thắng, TUYỆT ĐỐI không
  được ép ghi đè. Gỡ guard cũ dựa trên `timerSession.isRunning` (không còn cần — version mạnh hơn
  suy đoán qua trạng thái).
- **Trade-off**: bên thua LUÔN mất mọi thay đổi cục bộ chưa kịp đồng bộ (không có hợp nhất từng
  phần/CRDT) — chấp nhận được vì đơn giản và đáng tin hơn nhiều so với một cơ chế hợp nhất phức
  tạp dễ có lỗi tinh vi hơn chính vấn đề nó giải quyết.
- **Ảnh hưởng**: MỌI ghi vào `game_state` phải qua `syncService.js`, không được viết tắt trực tiếp
  ở bất kỳ đâu khác trong code.
- **Điều kiện xem xét lại**: về nguyên tắc có thể thay bằng CRDT/hợp nhất từng trường nếu tương lai
  dự án cần nhiều người dùng thao tác đồng thời phức tạp hơn — nhưng với app 1-người-dùng hiện tại,
  KHÔNG có lý do chính đáng để thay đổi. **Bất kỳ đề xuất "đơn giản hoá" nào quay lại so sánh
  timestamp client đều phải bị từ chối ngay** — đó chính xác là lỗ hổng đã gây sự cố thật.

---

## ADR-003 — AI Coach: chỉ dùng Gemini đám mây, gỡ hẳn Qwen on-device (WebLLM)

- **Ngày**: 2026-06-24 (quyết định cuối, sau một giai đoạn trung gian "Gemini chính + Qwen dự phòng")
- **Bối cảnh**: AI Coach ban đầu (2026-06-20) chạy 100% miễn phí bằng Qwen2.5 (chốt bản 3B tham
  số) tải và chạy ngay trên máy qua WebGPU (thư viện WebLLM) — không tốn phí API.
- **Vấn đề**: model 3B chất lượng phân tích kém, hay "trôi" sang tiếng Trung, và quan trọng nhất —
  **hoàn toàn không chạy được trên iPhone** (không có WebGPU), trong khi người dùng chính lại chủ
  yếu dùng điện thoại.
- **Phương án đã cân nhắc**:
  1. Nâng cấp lên Qwen2.5-7B (thử qua một đợt, rồi rút lui).
  2. Gemini làm CHÍNH + Qwen làm dự phòng khi mất mạng/hết quota (thử qua giai đoạn trung gian).
  3. Gemini là DUY NHẤT, gỡ hẳn Qwen/WebLLM.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì 7B nặng máy hơn nhiều (~4.5GB tải, ~5GB VRAM)
  mà vẫn không giải quyết được vấn đề cốt lõi là không chạy được trên iPhone; (2) bị loại sau khi
  thử vì duy trì 2 pipeline AI song song (đám mây + on-device) làm tăng độ phức tạp bảo trì đáng kể
  (2 bộ decode config, 2 luồng lỗi, 2 UI trạng thái) trong khi Gemini đã đủ ổn định để không cần
  dự phòng on-device nữa.
- **Giải pháp được chọn**: phương án (3) — xoá hẳn `webllmEngine.js`, dependency `@mlc-ai/web-llm`,
  toàn bộ code nhánh fallback on-device. Giữ nguyên "bộ não" model-agnostic (prompt + lưới chống-
  bịa + tầng số liệu) — chỉ thay cổng gọi model.
- **Trade-off chấp nhận**: mất khả năng hoạt động khi mất mạng/hết quota Gemini/chưa cấu hình key
  (Coach NGỪNG hẳn, không còn lưới dự phòng chạy tại chỗ); dữ liệu số liệu (không phải dữ liệu cá
  nhân nhạy cảm dạng văn bản tự do) rời khỏi máy lên server Google.
- **Ảnh hưởng**: giảm kích thước app đáng kể (không còn tải model ~2.4GB); AI Coach giờ CHẠY ĐƯỢC
  TRÊN CẢ IPHONE — đây là lợi ích chính biện minh cho trade-off.
- **Điều kiện xem xét lại**: nếu Gemini đổi chính sách giá/ngừng free tier đột ngột theo hướng bất
  lợi, hoặc nếu tương lai có một model on-device đủ nhỏ+đủ tốt+chạy được cả trên iPhone (hiện chưa
  có công nghệ này ở thời điểm quyết định). Kiến trúc model-agnostic (prompt/guard tách khỏi cổng
  gọi model) được thiết kế có chủ đích để đổi nhà cung cấp AI trong tương lai chỉ cần thay 1 file
  (`cloudEngine.js`), không cần viết lại "bộ não".

---

## ADR-002 — Lưới chống-bịa AI Coach: "cứu câu/cứu dòng" thay vì huỷ toàn bộ câu trả lời

- **Ngày**: 2026-06-24 (qua nhiều vòng tinh chỉnh, 2026-06-22 → 2026-06-24)
- **Bối cảnh**: Lưới chống-bịa số (`findFabricatedNumbers` và tương tự) phát hiện AI viết ra một
  con số không có trong bảng dữ liệu thật.
- **Vấn đề**: phiên bản đầu tiên của lưới, khi phát hiện MỘT con số bịa, sẽ huỷ TOÀN BỘ câu trả
  lời (hoặc rơi về một câu fallback chung chung) — lãng phí phần lớn nội dung ĐÚNG chỉ vì một chi
  tiết sai.
- **Phương án đã cân nhắc**:
  1. Giữ nguyên "nuke toàn bộ" khi phát hiện bịa (đơn giản nhất).
  2. Viết lại MÙ (yêu cầu model thử lại từ đầu, không nói rõ cái gì sai).
  3. Viết-lại-CÓ-HƯỚNG-DẪN (chỉ đích danh số bịa) + nếu vẫn còn bịa, cắt riêng câu/dòng chứa nó
     ("cứu câu/cứu dòng"), giữ nguyên phần còn lại sạch.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì trải nghiệm tệ — người dùng mất toàn bộ phân
  tích chỉ vì 1 con số sai trong 10 câu đúng; (2) thử qua nhưng kém hiệu quả hơn vì model không
  biết chính xác cần sửa gì, dễ tiếp tục bịa ở lượt thử lại.
- **Giải pháp được chọn**: phương án (3) — hai lớp: (a) lượt thử lại đầu tiên LUÔN chỉ đích danh
  số bị coi là bịa (`buildCorrectionNote`), không phải yêu cầu chung chung; (b) nếu vẫn còn bịa sau
  thử lại, cắt bỏ RIÊNG câu (`stripFabricatedSentences`, chế độ hội thoại) hoặc dòng
  (`scrubFabricatedLines`, chế độ báo cáo 4 phần — giữ khung cấu trúc, phần rỗng → "chưa đủ dữ
  liệu"), giữ lại phần còn lại vẫn sạch.
- **Trade-off**: phức tạp hơn về code (nhiều bước xử lý hơn "nuke" đơn giản); đổi lại giữ được
  nhiều giá trị thật hơn cho người dùng mỗi lần guard phải can thiệp.
- **Ảnh hưởng**: mọi lối vào Coach (Chat/Offline/Nudge) dùng chung pipeline này qua
  `guardedGenerate.js`.
- **Điều kiện xem xét lại**: không có kế hoạch đảo ngược — đây là kết quả của nhiều lần tinh chỉnh
  thực nghiệm, đã ổn định. Chỉ nên xem lại nếu bộ chấm điểm `eval.test.js` (BẮT %/BÁO NHẦM %) cho
  thấy chiến lược "cứu câu/cứu dòng" đang tạo ra câu văn cụt/khó hiểu quá mức trong thực tế sử dụng.

---

## ADR-001 — Không gộp `buildAchievementSnapshot` (real-time) và `buildAchievementSnapshotForReplay` (lịch sử)

- **Ngày**: không rõ ngày chính xác thiết lập ban đầu (trước 2026-07-12) — được TÁI XÁC NHẬN và
  ghi chép rõ trong đợt refactor 2026-07-12 khi rà soát toàn bộ trùng lặp code.
- **Bối cảnh**: hai hàm tính "ảnh chụp số liệu" (snapshot) trông giống nhau đến mức dễ bị đề xuất
  gộp lại trong bất kỳ đợt dọn dẹp trùng lặp nào.
- **Vấn đề**: `buildAchievementSnapshot` (gameStore.js) tính lại TỪ ĐẦU mỗi lần gọi — chấp nhận
  được vì chỉ chạy 1 lần/phiên hoàn thành (tần suất thấp). `buildAchievementSnapshotForReplay`
  (achievementTimeline.js) dùng thuật toán TÍCH LUỸ-GIA-TĂNG để phát lại TOÀN BỘ lịch sử một lần
  (suy luận ngày mở khoá cũ) — cần O(n), không thể chấp nhận O(n²) nếu phải tính lại từ đầu ở mỗi
  bước phát lại.
- **Phương án đã cân nhắc**:
  1. Gộp thành một hàm duy nhất, tham số hoá chế độ "tính từ đầu" vs "tích luỹ".
  2. Giữ 2 hàm riêng biệt, đồng bộ bằng kỷ luật comment cảnh báo tréo nhau.
- **Lý do loại bỏ phương án (1)**: buộc phải chọn MỘT đặc tính hiệu năng, gây hại cho trường hợp
  còn lại — nếu ép real-time dùng thuật toán tích luỹ, phải luồn một accumulator xuyên suốt toàn bộ
  `completeFocusSession` (thay đổi kiến trúc lớn cho lợi ích nhỏ); nếu ép replay dùng "tính từ đầu
  mỗi bước", một người dùng có hàng nghìn phiên sẽ có replay chậm rõ rệt (O(n²)).
- **Giải pháp được chọn**: phương án (2) — giữ 2 hàm tách biệt, mỗi file có một comment tiếng Việt
  cảnh báo TRỎ CHÉO sang file kia, yêu cầu tường minh: "Đổi field ở đây thì kiểm tra luôn bên kia
  kẻo lệch."
- **Trade-off**: rủi ro 2 hàm lệch nhau theo thời gian nếu ai đó thêm trường snapshot mới ở một
  nơi mà quên nơi kia — rủi ro này được giảm nhẹ (không loại bỏ hoàn toàn) bằng kỷ luật comment,
  KHÔNG có test/type tự động enforce việc này.
- **Ảnh hưởng**: bất kỳ achievement mới nào đọc một trường snapshot mới phải được thêm vào CẢ HAI
  hàm, nếu không thành tích đó sẽ mở khoá đúng real-time nhưng KHÔNG BAO GIỜ suy luận được ngày mở
  khoá hồi tố cho các save cũ.
- **Điều kiện xem xét lại**: nếu trong tương lai có bằng chứng cụ thể 2 hàm đã lệch nhau NHIỀU lần
  do lỗi con người quên đồng bộ, cân nhắc đầu tư một test tự động đối chiếu field-parity giữa 2
  hàm (không phải gộp hàm — chỉ enforce tự động rằng chúng luôn cùng field), hoặc một schema chung
  mô tả field bắt buộc để cả 2 hàm cùng implement.

---

## Ghi chú vận hành cho ADR log này

- Không backfill NGÀY một cách suy đoán — nếu không chắc chắn ngày chính xác, ghi rõ "không rõ
  ngày chính xác" thay vì bịa một ngày cụ thể. Nguyên tắc này nhất quán với triết lý chống-bịa số
  của chính AI Coach (xem `ARCHITECTURE.md` mục 3) — áp dụng cho cả tài liệu, không chỉ cho AI.
- Không phải mọi thay đổi đều xứng đáng một ADR — chỉ ghi quyết định có: (a) nhiều phương án thật
  sự được cân nhắc, (b) trade-off thật (không phải "chỉ có 1 cách làm đúng"), (c) ảnh hưởng lâu
  dài tới cách code được viết sau này. Một lần sửa bug thông thường không cần ADR — ghi vào
  `CHANGELOG.md`/`BAN_GIAO.md` là đủ.
