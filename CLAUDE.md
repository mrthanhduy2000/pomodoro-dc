# Pomodoro DC — Project Brief

## Người dùng
- Tên: Đàm (non-coder, dùng Codex + Claude Code để code)
- Giải thích đơn giản, tránh jargon kỹ thuật

## ⚠️ HỎI TRƯỚC KHI LÀM (quy tắc tối cao — đặt trên cả NGUYÊN TẮC SỐ 1)
Phân loại lệnh của Đàm thành 2 nhóm:
- **Lệnh NGHIÊN CỨU / TÌM HIỂU / ĐỀ XUẤT / "cho ý kiến" / "theo bạn…"** → CHỈ trình bày phân tích + khuyến nghị rồi DỪNG. KHÔNG sửa code, KHÔNG commit, KHÔNG deploy. Hỏi "bạn có muốn tôi làm không?". Câu mơ hồ → coi là nghiên cứu + hỏi trước.
- **Lệnh LÀM ("làm đi", "sửa", "thêm", "đổi", "nâng cấp", "deploy"…)** → theo đúng 4 bước: (1) **giải thích NGẮN GỌN, dễ hiểu, không hàn lâm** sắp làm gì + công dụng *trước khi sửa*; (2) làm (kèm `npm test`/lint + cập nhật tài liệu); (3) giải thích *sau khi sửa* đã đổi gì + ích lợi (vẫn dễ hiểu); (4) **TỰ ĐỘNG deploy lên Vercel** (commit + push) — KHÔNG hỏi lại, vì lệnh "làm" đã gồm cho phép deploy.
- Lý do: app production của Đàm (push = Vercel deploy ra mọi thiết bị). Anh cần kiểm soát (nghiên cứu thì đừng động vào), nhưng đã ra lệnh làm thì khỏi hỏi tới lui — giải thích cho anh hiểu rồi deploy luôn. Chi tiết: memory `ask-before-acting.md`.

## ⚠️ NGUYÊN TẮC ƯU TIÊN SỐ 1 (mọi phiên AI — quan trọng hơn mọi thứ khác)
1. **TRƯỚC khi làm:** đọc `BAN_GIAO.md` + `CLAUDE.md` (file này), RỒI đọc các file liên quan tới việc sắp làm — hiểu rõ ngữ cảnh trước, đừng sửa mò. (Hook `.claude/session-start-bangiao.sh` tự chèn BAN_GIAO.md đầu mỗi phiên, nhưng vẫn phải đọc kỹ.)
2. **SAU khi có cập nhật (dù nhỏ):** cập nhật ngay `CLAUDE.md` + `BAN_GIAO.md` **và các file liên quan khác** (README, ghi chú...) cho khớp. Làm xong việc mà chưa cập nhật tài liệu = **CHƯA XONG**.
3. Bàn giao thiết kế chi tiết nằm ở thư mục memory:
   `/Users/damduy/.claude/projects/-Users-damduy-Downloads-Claude-Code-B-n-sao-Pomodoro-Game---USING/memory/`
   (đặc biệt `upgrade-roadmap.md` cho AI Coach, `ui-review-2026-06.md` cho UI, `resonance-update.md` cho game loop).
4. Luôn chạy `git status` tươi — đừng tin ảnh chụp git cũ.
5. Muốn biết **file nằm ở đâu** → `PROJECT_STRUCTURE.md`. Muốn biết **bức tranh kiến trúc lớn** (luồng dữ liệu, vì sao chia lớp thế này) → `ARCHITECTURE.md`. Cả hai PHẢI cập nhật cùng lúc với mọi thay đổi cấu trúc (đúng quy tắc số 2 ở trên).
6. ⚠️ **File này là NGUỒN SỰ THẬT DUY NHẤT về quy tắc, cho MỌI AI** (Claude Code, Codex, ChatGPT...) — tên file có chữ "CLAUDE" chỉ vì lịch sử, KHÔNG có nghĩa quy tắc chỉ dành cho Claude. `AGENTS.md` (điểm vào của Codex) **chỉ là con trỏ trỏ về đây**, tuyệt đối KHÔNG chép nội dung sang. **TUYỆT ĐỐI không tạo bản sao tài liệu quy tắc cho từng công cụ AI** — đã thử 2026-07-31 và thất bại: bản sao sinh câu vô nghĩa + đường dẫn `.Codex/` không tồn tại, rồi trôi khỏi bản gốc chỉ sau 5 ngày (thiếu nguyên mục "3 cái bẫy menu bar"). Đây chính là điều quy tắc **Composition over Duplication** ở mục Playbook cấm. Chi tiết: `AGENTS.md`.

## 📋 PROJECT GOVERNANCE PROTOCOL (2026-07-12 — áp dụng vĩnh viễn, mọi phiên AI tương lai)

Project gồm **3 thành phần giá trị ngang nhau**: (1) Source Code, (2) Documentation, (3) Project
Knowledge (quyết định/lịch sử/bối cảnh). Code chỉ nói "hệ thống chạy thế nào" — chỉ tài liệu mới
giữ được "vì sao nó chạy như vậy". Nếu 3 thành phần này lệch nhau, coi như CHƯA XONG việc dù code
đã đúng/build/test/lint đều xanh.

### Definition of Done (áp dụng mọi task, không ngoại lệ)
✓ Source code đúng · ✓ Build thành công · ✓ Test thành công · ✓ Lint thành công ·
✓ **Documentation đã đồng bộ** · ✓ **Project Knowledge đã đồng bộ**. Thiếu 1 mục = chưa xong.

### Bảng: loại thay đổi → tài liệu PHẢI cập nhật
Sau mỗi thay đổi, tự hỏi: có ảnh hưởng kiến trúc/module/workflow/AI/notification/sync/timer/store/
API/database/build/deploy/folder/naming/dependency/testing/performance không? Nếu CÓ, tự xác định
(không đợi Đàm nhắc) tài liệu nào trong bảng sau cần sửa:

| Tài liệu | Vai trò (KHÔNG lẫn với các file khác) | Khi nào phải sửa |
|---|---|---|
| `README.md` | CHỈ trang giới thiệu: project là gì/chạy thế nào/build thế nào/deploy thế nào/đọc tiếp gì. KHÔNG nhồi kiến trúc sâu vào đây. | Đổi cách chạy/build/deploy, hoặc thêm tài liệu mới cần trỏ tới |
| `ARCHITECTURE.md` | Bức tranh lớn: layer/module/dependency/state flow/AI flow/sync flow/notification flow/storage flow/database flow | Bất kỳ FLOW nào đổi |
| `PROJECT_STRUCTURE.md` | Cây thư mục + quy tắc tạo module/chia folder/import/shared module/đặt tên | Đổi cấu trúc thư mục, thêm quy ước mới |
| `CHANGELOG.md` | Tóm tắt CHÍNH THỨC, ngắn gọn theo mốc (mục đích/phạm vi/ảnh hưởng/tương thích) — KHÔNG phải lịch sử commit | Mọi thay đổi quan trọng (không phải mọi commit nhỏ) |
| `MIGRATION.md` | Chỉ ghi khi đổi API/module/đường dẫn/workflow/state/storage/database/folder | CHỈ khi có migration thật — không có thì không cần ghi |
| `ARCHITECTURE_DECISIONS.md` | "Bộ nhớ kiến trúc" — mỗi quyết định: Ngày/Bối cảnh/Vấn đề/Phương án cân nhắc/Lý do loại bỏ/Giải pháp chọn/Trade-off/Ảnh hưởng/Điều kiện xem lại | Quyết định có ≥2 phương án thật sự cân nhắc + trade-off thật + ảnh hưởng lâu dài |
| `TECH_DEBT.md` | Mọi nợ kỹ thuật đã biết (đủ 14 trường: Tên/Module/Priority/Severity/Impact/Root Cause/Current Risk/Future Risk/Recommended Solution/Estimated Complexity/Blocking Conditions/Review Trigger/Owner/Status) | Phát hiện nợ mới mà rủi ro thấp thì xử lý luôn; rủi ro trung bình/cao hoặc ngoài phạm vi task hiện tại → PHẢI ghi vào đây, không bỏ qua |
| `AI_ONBOARDING.md` | Đọc nhanh 10-15 phút — nếu AI mới cần audit cả codebase mới hiểu project thì file này CHƯA đạt yêu cầu | Đổi module quan trọng nhất/rủi ro cao/bài học lớn mới |
| `AI_HANDOFF_KNOWLEDGE.md` | Bàn giao tri thức ĐẦY ĐỦ nhất (domain/flow/ADR/tech debt chi tiết) — để bàn giao cho AI khác hoàn toàn không có quyền đọc code | Thay đổi lớn ảnh hưởng nhiều phần của tài liệu này |
| `BAN_GIAO.md` | Trạng thái hiện tại + nhật ký CHI TIẾT từng việc — luôn cập nhật, đây là NGUYÊN TẮC ƯU TIÊN SỐ 1 có sẵn | MỌI thay đổi dù nhỏ |

### Ngưỡng "Maintenance Sprint"
Khi `TECH_DEBT.md` có **≥8-10 mục Priority High/Critical**, HOẶC một module đã trải qua ≥3 lần vá
lỗi/refactor nhỏ mà chưa từng refactor triệt để, hãy CHỦ ĐỘNG đề xuất mở một "Maintenance Sprint"
(nêu rõ mục tiêu/phạm vi/lợi ích/rủi ro/tiêu chí hoàn thành) thay vì tiếp tục cộng thêm tính năng
mới. Trạng thái ngưỡng hiện tại: xem đầu `TECH_DEBT.md`.

### Tính nhất quán kiến trúc (tự hỏi trước khi tạo mới)
Trước khi tạo folder/module/service/hook/component/store/helper/abstraction/API/utility mới, tự
hỏi: có tăng coupling không? có làm project khó hiểu hơn không? có tạo thêm 1 pattern mới trong khi
pattern tương tự đã tồn tại không (tái sử dụng được không)? có tạo thêm nợ kỹ thuật mới không? Nếu
có cách nhất quán hơn (khớp quy ước đã có ở `PROJECT_STRUCTURE.md`) → ưu tiên cách đó.

### Self-audit trước khi kết thúc task
Kiểm tra: code/test/lint/build, dead code, duplicate logic, unused imports/dependencies,
documentation, kiến trúc, tính nhất quán folder/naming/import, technical debt, knowledge update.
Vấn đề rủi ro thấp/trung bình phát hiện được → xử lý luôn, không cần đợi Đàm yêu cầu (rủi ro cao →
báo trước theo quy tắc "HỎI TRƯỚC KHI LÀM" ở trên).

### Bảo tồn kinh nghiệm (Knowledge Preservation)
Nếu trong lúc làm việc phát hiện: kinh nghiệm mới, bài học mới, bug đặc biệt, edge case, giới hạn
của framework/Supabase/Electron/Vercel/AI/Browser — tự hỏi "thông tin này có giúp phiên sau tránh
lặp lại sai lầm không?". Nếu có, PHẢI bổ sung vào tài liệu phù hợp (bảng ở trên) — không được để
những bài học này chỉ tồn tại trong cuộc hội thoại rồi biến mất khi phiên kết thúc.

### Báo cáo bàn giao cuối phiên (khi hoàn thành một task đáng kể)
1. Đã thay đổi gì · 2. Quyết định kiến trúc mới (nếu có) · 3. Tech debt đã xử lý · 4. Tech debt còn
lại · 5. Migration nếu có · 6. Tài liệu đã cập nhật · 7. Giả định mới của hệ thống · 8. Bài học mới
(Lesson Learned) · 9. Việc phiên sau cần biết · 10. Việc tuyệt đối chưa nên làm + lý do · 11. Đề
xuất bước tiếp theo. Mục nào không đổi → ghi rõ "Không có thay đổi" (đừng bỏ qua im lặng). Áp dụng
mục này ở MỨC ĐỘ PHÙ HỢP với quy mô task — một sửa lỗi nhỏ không cần đủ 11 mục, nhưng một task lớn
(refactor, tính năng mới, sự cố) thì có.

### TECHNICAL ADVISOR REPORT (bắt buộc từ 2026-07-17, sau MỖI task hoàn thành; bổ sung cùng ngày: mục 0 + mục 10 + viết 100% tiếng Việt)
Ngoài báo cáo thường, PHẢI kèm một phần tiêu đề "TECHNICAL ADVISOR REPORT" — viết cho một **AI
Technical Advisor độc lập (GPT)** đánh giá kiến trúc, KHÔNG phải cho Đàm. Ngắn gọn nhưng đủ ngữ
cảnh; tối đa ~1-2 trang A4; không văn dài/không marketing/không tự khen/không lặp changelog.
**NGÔN NGỮ: 100% tiếng Việt** (cả tiêu đề mục lẫn nội dung). CHỈ giữ tiếng Anh cho: tên file/
class/hàm/biến, commit hash, API, framework, và thuật ngữ không có cách dịch tự nhiên (CAS,
debounce, snapshot, whitelist...).
Đúng 11 mục theo thứ tự:
0. **Vì sao làm task này lúc này?** (≤10 dòng) — thuộc Priority nào của Roadmap A · gỡ blocker
   nào · cải thiện điều kiện chuyển Phase nào · nếu KHÔNG làm thì rủi ro gì · vì sao ROI cao hơn
   các task tồn đọng khác. Nếu KHÔNG phải task ROI cao nhất → giải thích vì sao vẫn làm.
1. **Mục tiêu** — "tôi được yêu cầu làm gì?" (≤5 dòng).
2. **Đã thay đổi gì** — chính xác file tạo mới / sửa / xoá; file lớn thì ghi module bị ảnh hưởng.
3. **Quyết định kiến trúc** — QUAN TRỌNG NHẤT: vì sao chọn A thay vì B, vì sao chưa refactor,
   vì sao test trước, vì sao giữ tương thích ngược, vì sao hoãn việc gì.
4. **Giả định** — mọi giả định đã dùng (API không đổi, version luôn tăng, 1 phiên active...).
   Không có → "Không có."
5. **Rủi ro mới phát sinh** — rủi ro MỚI do thay đổi này. Không có → "Không có."
6. **Blocker còn lại** — những gì còn chặn Giai đoạn hiện tại (≤10 dòng).
7. **Tác động lên Roadmap** — chấm TỪNG mục: God File · Duplicate · Test · Sync · Nợ kỹ thuật ·
   Độ ổn định AI Coach, theo thang: Không ảnh hưởng / Cải thiện nhẹ / Cải thiện / Hoàn thành.
8. **Độ tự tin** — %; DƯỚI 90% phải giải thích lý do.
9. **Câu hỏi cho Technical Advisor** — ≤5 câu hỏi kiến trúc/hướng đi chưa chắc. Không có → "Không có."
10. **Đề xuất task tiếp theo** — đúng MỘT task (không phải danh sách): vì sao quan trọng nhất ·
    điều kiện Phase A nào tiến thêm · hoàn thành xong mở khoá điều gì. Nhiều lựa chọn ngang nhau
    → nêu trade-off rồi CHỌN MỘT.

## 🛠️ AI ENGINEERING PLAYBOOK (Operating Manual — quy trình làm việc, 2026-07-12)

> Đây là quy trình làm việc TIÊU CHUẨN cho mọi AI tiếp quản project (Claude Code/Codex/ChatGPT...),
> không riêng phiên nào. Mục Governance Protocol ở trên quản lý "tài liệu có đồng bộ với code
> không"; mục này quản lý "AI thực hiện MỘT task như thế nào, từng bước". Hai mục KHÔNG lặp lại
> nhau — chỗ nào trùng, mục này trỏ ngược lên Governance Protocol thay vì chép lại (đúng tinh thần
> "Composition over Duplication" ngay bên dưới).

### Triết lý
Không tối ưu cho việc hoàn thành nhanh — tối ưu cho khả năng bảo trì nhiều năm. Khi có nhiều cách
giải quyết, ưu tiên phương án: đơn giản hơn, dễ bảo trì hơn, ít coupling hơn, ít nợ kỹ thuật hơn,
khớp kiến trúc hiện tại hơn. Vai trò của AI khi làm việc ở đây không chỉ là "người viết code" —
đồng thời là Senior Engineer, Software Architect, Reviewer, QA Engineer, Technical Writer, và
Maintainer.

### Quy trình chuẩn — 7 giai đoạn (không bỏ qua nếu không có lý do đặc biệt)
1. **Hiểu yêu cầu** — xác định loại task (Feature/Bug Fix/Refactor/Performance/Documentation/
   Architecture/Infrastructure/AI/Database/Deployment) + phạm vi ảnh hưởng đầy đủ TRƯỚC khi viết
   dòng code nào.
2. **Audit** — module đang chạy ra sao? đã có abstraction/helper/util tương tự chưa? có pattern
   project đang dùng không? có ADR/Tech Debt/bug cũ nào liên quan không (xem
   `ARCHITECTURE_DECISIONS.md`/`TECH_DEBT.md`)? Ưu tiên tái dùng cái đã có hơn viết mới.
3. **Thiết kế** — thay đổi nhỏ thì làm luôn; thay đổi vừa/lớn phải tự phân tích phạm vi/ảnh hưởng/
   dependency/migration/rollback/test strategy TRƯỚC. Ảnh hưởng kiến trúc → tạo entry mới trong
   `ARCHITECTURE_DECISIONS.md` (theo đúng format ADR đã có).
4. **Thực hiện** — không copy logic, không tạo abstraction/helper trùng cái đã có, không tăng
   coupling/độ phức tạp nếu không cần. Phát hiện duplicate/dead code/naming lệch/module sai trách
   nhiệm trong lúc làm → xử lý LUÔN nếu rủi ro thấp/trung bình, không đợi task khác.
5. **Self Review** — tự soát logic/naming/readability/maintainability/architecture/performance/
   security/consistency TRƯỚC khi commit.
6. **Validation** — build + lint + test luôn luôn. Task đụng API/Database/Sync/Notification/AI/
   Deployment/Realtime → phải kiểm tra CẢ LUỒNG liên quan, không chỉ file vừa sửa.
7. **Knowledge Update** — dùng bảng "loại thay đổi → tài liệu cần cập nhật" ở mục Governance
   Protocol phía trên (không lặp lại bảng ở đây).

### Quy trình theo từng loại task
- **Feature**: Audit → Thiết kế → Đánh giá ảnh hưởng → Code → Test → Documentation → Knowledge Update.
- **Bug Fix**: Reproduce → Root Cause Analysis → Fix → Regression Test → Lesson Learned → Knowledge
  Update. **Sửa nguyên nhân gốc, không sửa triệu chứng** — đúng tinh thần đã áp dụng cho mọi sự cố
  production trong lịch sử dự án (xem `AI_HANDOFF_KNOWLEDGE.md` Phần 11).
- **Refactor**: Audit → Risk Analysis → Refactor Plan → Refactor → Regression Test → Architecture
  Review → Documentation.
- **Architecture Change**: KHÔNG thực hiện ngay — đánh giá + phân tích trade-off + cân nhắc phương
  án + viết `ARCHITECTURE_DECISIONS.md` TRƯỚC, rồi mới thay đổi.

### Quy tắc kiến trúc (luôn ưu tiên)
Single Responsibility · High Cohesion · Low Coupling · Reuse over Rewrite · Composition over
Duplication · Explicit over Implicit. Không hy sinh kiến trúc để đổi lấy tốc độ hoàn thành.

### Quy tắc về AI: không giả định, không suy diễn
Không chắc chắn → kiểm tra source code. Source code chưa đủ → đọc tài liệu. Tài liệu chưa đủ → NÓI
RÕ điều còn thiếu, không tự suy đoán rồi trình bày như sự thật. Đây CHÍNH XÁC là nguyên tắc chống-
bịa đã áp dụng cho AI Coach (`src/engine/coach/guard.js`, xem `ARCHITECTURE.md` mục 3) — áp dụng
lại cho chính AI đang code, không chỉ cho AI Coach của app.

### Quy tắc Review (bổ sung, không lặp Self-audit ở Governance Protocol)
Ngoài checklist Self-audit đã có ở trên, trước khi kết thúc task tự hỏi thêm: có ADR mới cần ghi
không? có Migration cần ghi không? có cần ghi Lesson Learned không? Câu trả lời Có → xử lý trước
khi kết thúc, không để lại cho phiên sau.

### Quy tắc Commit
Mỗi commit: mục tiêu rõ ràng, phạm vi rõ ràng, KHÔNG trộn nhiều thay đổi không liên quan, có thể
rollback độc lập. Không tạo commit chỉ để "tiện tay".

### Continuous Improvement
Sau mỗi task, tự hỏi: project hiện sạch hơn/ít nợ kỹ thuật hơn/ít duplicate hơn/ít coupling hơn/
tài liệu tốt hơn/AI sau dễ tiếp quản hơn so với TRƯỚC khi bắt đầu không? Nếu Không → cân nhắc làm
thêm vài cải tiến nhỏ rủi ro thấp trước khi kết thúc. Thành công không đo bằng số dòng code viết ra
— đo bằng việc project rõ ràng hơn, ổn định hơn, dễ phát triển hơn sau mỗi phiên.

## Nền tảng hiện tại
App chính chạy trên **web** tại `https://pomodoro-dc.vercel.app`.

- Web Vercel là bản đầy đủ, dùng trên iPhone và Mac.
- Electron vẫn được dùng như app phụ trên Mac để có biểu tượng menu bar/tray.
- Electron mở URL Vercel và đọc trạng thái timer từ Supabase, không phải bản app riêng tách logic.
- Localhost chỉ dùng cho dev/test, không phải luồng sử dụng hằng ngày.

## Tech Stack
- React + Vite + PWA
- State: Zustand + localStorage (key: `dc-pomodoro-v1`, vẫn đọc được key cũ `civjourney-v1`)
- Sync cloud: Supabase
- Hosting: Vercel (auto-deploy từ GitHub)

## Hạ tầng

| Thứ | Chi tiết |
|-----|----------|
| App URL | `https://pomodoro-dc.vercel.app` |
| Mac menu bar | Electron companion app |
| GitHub | `https://github.com/mrthanhduy2000/pomodoro-dc` |
| Supabase | `https://jcefdsdccmnmqvuwelmm.supabase.co` |
| Bảng DB | `game_state` (id, data JSONB, updated_at) |
| Timer tray sync | `timer_live` (id `singleton`) |

## Vercel Hobby: giới hạn 12 Serverless Functions/deploy
- ⚠️ **2026-07-11 — SỰ CỐ + FIX TRIỆT ĐỂ (Đàm yêu cầu xử lý gốc, không vá tạm)**: thêm `api/keepalive.js` làm deploy FAIL — "No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan". **Nguyên nhân gốc**: Vercel (preset "Other"/không framework) coi MỌI file `.js` nằm TRỰC TIẾP trong `api/` (đệ quy) là 1 Serverless Function riêng — kể cả file test — TRỪ file/thư mục có tên bắt đầu bằng `_` (quy ước Vercel đã tôn trọng sẵn cho `api/_lib/`). Lúc đó có 5 file `*.test.js` nằm lẫn trong `api/`/`api/push/` bị tính oan.
  - **FIX CẤU TRÚC (vĩnh viễn, không phải blacklist phải nhớ cập nhật)**: chuyển TOÀN BỘ test của `api/` vào **`api/_tests/`** (mirror lại cấu trúc `api/push/` → `api/_tests/push/`) — dùng ĐÚNG quy ước underscore-prefix mà Vercel đã tự động bỏ qua, giống hệt `api/_lib/`. Vì vậy: test luôn nằm ngoài phạm vi quét Function của Vercel, KHÔNG cần biết trước tên file, KHÔNG cần nhớ xoá/di chuyển gì trước khi deploy — dù sau này có thêm hàng trăm file test (`.test.js`, `.spec.js`, tên gì cũng được) đặt đúng trong `api/_tests/` thì vẫn an toàn tuyệt đối.
  - **⚠️ QUY TẮC BẮT BUỘC cho mọi test API mới**: LUÔN đặt trong `api/_tests/` (mirror đường dẫn của file đang test), KHÔNG đặt cạnh route handler nữa. Cập nhật path import tương ứng (`../coach.js`, `../../push/dispatch.js`...). `package.json` glob test đã trỏ sang `api/_tests/*.test.js api/_tests/push/*.test.js`.
  - **Lớp phòng thủ thứ 2** (`.vercelignore`, phòng khi lỡ tay đặt nhầm file phụ trợ ngay dưới `api/` mà quên cho vào `_tests`/`_lib`): loại thêm `*.spec.*`/`*.mock.*`/`*.fixture(s).*`/`*.stories.*`/`*.bench.*`/`*.e2e.*` — không chỉ `*.test.js`.
  - Hiện tại: đúng **10 function thật** (`coach`, `coach-digest`, `keepalive`, 7 route dưới `api/push/`) — còn dư 2 trước khi chạm trần 12. Thêm route API mới → đếm lại `find api -type f -name "*.js" ! -path "api/_*"`.
  - ⚠️ **PHÁT HIỆN LẠI KHI SOÁT LOG**: commit `8ee264d` (25/6, thêm `api/coach-digest.js` — mảng 6/6 AI Coach) từng bị FAIL build **CÙNG NGUYÊN NHÂN NÀY** nhưng không ai để ý — Vercel giữ nguyên bản deploy trước đó, khiến tính năng "cảnh báo chuỗi sắp đứt qua push" **KHÔNG hề chạy thật trên production suốt 25/6–11/7** dù code/tài liệu đã ghi "hoàn tất" (xem `BAN_GIAO.md`). Bài học: sau mỗi lần push, PHẢI xác nhận tab Deployments trên Vercel hiện "Ready" — code xanh + commit thành công không có nghĩa là đã thực sự lên production.

## Sync (đã hoàn chỉnh)
- `src/lib/supabase.js` — Supabase client
- `src/lib/syncService.js` — pull khi mở app, push debounced 5s
- `initSync()` gọi trong `App.jsx`, ở effect chạy sau khi store nạp xong (`storesHydrated`)
- ⚠️ **Đồng bộ ngừng hoạt động = kiểm tra Supabase project trước tiên, không phải code.** Project Free tier có thể tự PAUSE vì 1 trong 2 lý do khác nhau: (a) vượt hạn mức "Database Size" 0.5 GB — xem sự cố 2026-07-11 ở `BAN_GIAO.md`: `cron.job_run_details` phình tới 795 MB do job push-dispatch chạy mỗi 5s không dọn log, KHÔNG phải do `game_state` — bảng đó luôn chỉ vài trăm KB (đã có job tự-dọn log mỗi đêm `supabase/cleanup_cron_logs.sql` để không tái diễn); (b) project "không hoạt động" ~7 ngày (app 1 người dùng dễ im lặng lâu) — chống bằng cron `api/keepalive.js` (Vercel, 3h sáng mỗi ngày, xem `vercel.json`) gọi 1 query nhẹ qua đúng client Supabase để giữ project luôn "active". Nếu Database Size phình lại, soi `cron.job_run_details` trước; nếu bị pause dù Database Size vẫn thấp, kiểm tra cron `keepalive` có đang chạy không (cần `CRON_SECRET`+`SUPABASE_SERVICE_ROLE_KEY` đã đặt ở Vercel env).
- ⚠️ **"First action wins" (2026-07-11) — chống 2 máy giành nhau ghi đè.** Trước đây `game_state` chỉ có `updated_at` do CLIENT tự ghi (`new Date().toISOString()`) → máy nào ghi CUỐI CÙNG thắng bất kể ai thao tác trước, gây hiện tượng 2 máy nhảy qua nhảy lại + có thể MẤT dữ liệu (xem sự cố cùng ngày ở `BAN_GIAO.md`: mất 1 phiên focus thật vì laptop ghi đè lên phiên điện thoại vừa hoàn thành). ĐÃ SỬA: thêm cột `version` do TRIGGER PHÍA SERVER tự tăng (`supabase/game_state_version.sql`, không phụ thuộc đồng hồ máy khách) — `syncService.js` ghi kiểu compare-and-swap (`.eq('version', expectedVersion)`); ghi bị từ chối (0 dòng khớp) → máy đó THUA, phải tự nhận lại bản đã thắng (`pullFromCloud()`), TUYỆT ĐỐI không được ép ghi đè. Guard cũ dựa trên `localSession?.isRunning` đã bị GỠ (không cần nữa — version là nguồn xác định thứ tự chính xác, không phải suy đoán). Hàm thuần `shouldImportVersion` test ở `src/lib/syncService.test.js`.
- ⚠️ **BẢN VÁ C1 (2026-07-17) — 4 lưới an toàn quanh CAS, ĐỪNG gỡ mà không đọc kỹ.** (a) **Flush khi rời app**: `visibilitychange→hidden` + `pagehide` gọi `pushNow()` **chỉ khi còn thay đổi đang chờ** — vì trên iOS tab bị đóng băng nên timer debounce 5s KHÔNG bao giờ nổ. Điều kiện "còn đang chờ" dựa vào biến `debounceTimer`, nên nó **PHẢI được gán `null`** khi timer nổ hoặc bị huỷ (nếu không, tín hiệu luôn bật và mọi lần ẩn app đều ghi mù). (b) **`hasMeaningfulState()`** (thuần, export): local trắng + cloud có dữ liệu → NHẬN cloud, KHÔNG đẩy; local có dữ liệu thật → vẫn đẩy như cũ (đây là đường hồi phục cho thay đổi offline chưa kịp đẩy — đừng biến nhánh else thành "luôn import"). (c) Nhánh `known < 0` (đường ghi DUY NHẤT không có CAS) phải **đọc cloud trước**; đọc lỗi → hoãn ghi, không ghi mù. (d) Lỗi Postgres **`42703`** lúc initSync → `console.error` chỉ đích danh `supabase/game_state_version.sql`. Test hành vi: `src/lib/syncService.behavior.test.js` (17 bài; file test có stub chặn debounce 5s thật để không flaky). **Giới hạn còn lại có chủ đích**: 2 máy sửa trường KHÁC NHAU khi offline vẫn mất phần của máy thua → `TECH_DEBT.md` #8. ⚠️ Deploy code mới PHẢI chạy `supabase/game_state_version.sql` TRƯỚC (hoặc gần như đồng thời) — thiếu cột `version` thì mọi lần ghi sẽ lỗi (`column "version" does not exist`) → sync ngừng hẳn cho tới khi chạy SQL.

## Web Push iPhone (đã chạy; cần làm lại khi setup máy/dự án mới)
- Biến môi trường trên Vercel: `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, **`GEMINI_API_KEY`** (AI Coach đám mây Gemini — ĐÃ cấu hình + **bật billing/paid tier (2026-06-24) → hết 429, chạy ổn định** trên `gemini-2.5-flash`; thiếu key → AI Coach KHÔNG chạy vì đã gỡ Qwen on-device; `GEMINI_MODEL`/`GEMINI_MODEL_FALLBACK`/`GEMINI_MODEL_FALLBACK2` tuỳ chọn). Xem `.env.example`. Khoá Supabase frontend đã hardcode, không cần đặt.
- Tạo khoá Web Push: `npm run push:keys` → dán public/private vào biến môi trường Vercel.
- Bảng + scheduler push nằm trong `supabase/*.sql` — chạy tay trong Supabase SQL editor (thiếu thì push hỏng).
- Sửa push phía trình duyệt: `public/push-worker.js` (service worker) + `public/manifest.json` (PWA).

## AI Coach + tầng engine (mảng lớn nhất, KHÔNG được bỏ qua)
App có cả một hệ "huấn luyện viên" và engine game thuần. Đây là phần lớn nhất dự án.
- ⚠️ **CHỈ MỘT ENGINE = GEMINI (đám mây) (2026-06-24 — Đàm: "bỏ Qwen, chỉ còn Gemini").** ĐÃ GỠ HẲN Qwen2.5-3B + WebLLM + dep `@mlc-ai/web-llm` (xoá `webllmEngine.js`, `guard.test.js`, `LLM_MODELS`/`detectWebLLMCapable`/`mapInitProgress`, manualChunk `vendor-webllm`, globIgnores webllm/wasm). App nhẹ hơn, **chạy CẢ iPhone**, KHÔNG tốn RAM/đĩa máy. **Đánh đổi: mất mạng / hết quota / chưa-có-key → Coach NGỪNG** (không còn lưới on-device dự phòng) → báo lỗi + nút "Thử lại".
  - **Cổng đám mây**: `api/coach.js` (Vercel serverless) giữ `GEMINI_API_KEY` ở server (KHÔNG lộ ra client; đã verify key không vào bundle), map `{system, messages}` → Gemini `generateContent`. Client gọi qua `src/engine/coach/cloudEngine.js` (`generateCloud`). Pure helpers `toGeminiBody`/`extractGeminiText`/`shouldFallback`/`buildModelChain` đã tách sang `api/_lib/gemini.js`, test ở `api/_tests/_lib/gemini.test.js`. Pipeline dùng chung "gọi model → sanitize → chống chữ lạ → chống bịa số" cho cả 3 lối vào Coach nằm ở `src/engine/coach/guardedGenerate.js`.
    - **CHUỖI MODEL (tự nhảy khi quá tải/hết lượt)**: `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2.0-flash` (env `GEMINI_MODEL`/`GEMINI_MODEL_FALLBACK`/`GEMINI_MODEL_FALLBACK2`). `callModelOnce` gọi từng model 1 lần (KHÔNG retry — đổi model nhanh hơn thử lại model đang sập); `shouldFallback` (503/500/**429**) → model kế; lỗi khác (400/403 key) → dừng. ⚠️ Thêm `gemini-2.0-flash` vì 2 model 2.5 free HAY CÙNG 503 — 2.0 đời cũ, dung lượng riêng, rất ổn định. ⚠️ **2.5 bật "thinking" mặc định → ép `thinkingConfig.thinkingBudget: 0`** (chỉ áp model 2.5; 2.0 không có thinking); để ON nó ăn hết `maxOutputTokens` làm câu CỤT/RỖNG.
      - ⚠️ **TẦNG MODEL "deep" (2026-06-25, mảng 4/6)**: `buildModelChain(tier, env)` (thuần, test ở `api/_tests/_lib/gemini.test.js`). Body có thêm `tier`: `'deep'` → thử `gemini-2.5-pro` TRƯỚC rồi rơi về nguyên chuỗi flash (vừa khôn vừa có lưới an toàn nếu pro quá tải); mặc định (chat/nhắc) chỉ chuỗi flash nhanh+rẻ. CHỈ **"AI phân tích tổng thể"** (`CoachOffline.jsx`) gọi `tier:'deep'` (bài 4 phần — việc khó nhất); CoachChat/CoachNudge giữ flash. Env ghi đè `GEMINI_MODEL_DEEP`. Pro cũng là '2.5' → vẫn `thinkingBudget:0` (nhất quán; muốn bật thinking là commit tuning riêng). Timeout 28s + maxDuration 30 (mảng 1) là NỀN cho pro chậm hơn. **Cấu trúc 4 phần KHÔNG cần JSON mode**: `scrubFabricatedLines` đã giữ khung [1][2][3][4] + bỏ riêng dòng bịa + phần rỗng→"chưa đủ dữ liệu" (một số bịa KHÔNG làm rớt cả bài).
  - **Luồng**: CoachChat/CoachOffline → `generateCloud` (Gemini). Lỗi → câu báo lỗi (no-key / hết-lượt / mạng) + nút "Thử lại". KHÔNG còn `capable`/`progress`/warm-prefetch/fallback on-device.
  - **iPhone DÙNG ĐƯỢC Coach** (qua Gemini): không còn gate WebGPU; `FocusRail` luôn hiện thẻ; `FocusCoachMobile.jsx` render thẳng CoachChat+CoachOffline (App.jsx truyền goalProps).
  - ⚠️ **COACH CHỦ ĐỘNG — câu nhắc sau mỗi phiên (2026-06-25, mảng 3/6)**: `CoachNudge.jsx` (trong thẻ AI Coach ở `FocusRail`+`FocusCoachMobile`). Khi một phiên HOÀN THÀNH gần đây (history[0] hợp lệ + xong trong ~5 phút), Coach tự sinh MỘT câu bám số phiên vừa xong → hiện ngay, KHỎI bấm hỏi. Dùng `buildNudgeContext` (ghép dòng "Phiên vừa xong: N phút…" vào ĐẦU context để guard cho phép nhắc số phiên đó) + `NUDGE_INSTRUCTION` + `buildLLMChatPrompt` (CHUNG prompt+guard). **AN TOÀN**: chạy NỀN không chặn kết thúc phiên; lỗi/chữ-lạ → IM LẶNG; VẪN qua lưới chống-bịa (cứu-câu). Chống lặp: localStorage `dc-coach-nudge-v1` ghi id phiên đã nhắc (mỗi phiên ≤1 lần, kể cả mount lại trên mobile) + gác recency 5 phút (mở app sau nhiều giờ KHÔNG nhắc phiên cũ). ⚠️ Đổi nhãn dòng "Phiên vừa xong" phải khớp `buildNudgeContext`. Chưa gửi push (post-session người dùng đang ở trong app); push để dành mảng 6 (chuỗi sắp đứt, lúc người dùng VẮNG).
  - ⚠️ **COACH CHỦ ĐỘNG — cảnh báo chuỗi sắp đứt qua PUSH (2026-06-25, mảng 6/6)**: CRON `api/coach-digest.js` + helpers thuần `api/_lib/coachDigest.js` (`evaluateStreakRisk`/`pickActiveBucketLabel`/`buildStreakNudgePayload`, test `api/_tests/coach-digest.test.js`). Mỗi ngày **17:00 VN** (`vercel.json` crons `"0 10 * * *"` UTC) đọc `game_state` (id `singleton`) từ Supabase; nếu chuỗi đang treo (còn chuỗi ≥1 NHƯNG hôm nay theo ngày VN chưa có phiên hoàn thành nào) → đẩy thông báo nhắc giữ chuỗi (kèm "buổi hay làm" nếu ≥40% phiên + đủ mẫu — KHÔNG phải "giờ vàng" goal-based, phát biểu trung thực). TÁI DÙNG hạ tầng push (`_lib/push.js`: `getAdminClient`/`listActivePushSubscriptions`/`sendPushNotification`), bảo vệ `CRON_SECRET` (Vercel Cron tự gửi `Bearer`). KHÔNG cần SQL mới (dùng bảng `game_state`+`push_subscriptions` sẵn có). ⚠️ Vercel Hobby cron = 1 lần/ngày (đủ); thêm function vào `vercel.json` thì file PHẢI tồn tại. Muốn linh hoạt hơn 1 lần/ngày → cân nhắc `pg_cron` Supabase.
  - ⚠️ **"BỘ NÃO ĐÃ ĐÀO TẠO" GIỮ NGUYÊN** (model-agnostic, áp lên Gemini): 2 prompt chuyên gia, lưới chống-bịa (`findFabricatedNumbers`/`findMismatchedPairs`/`findFabricatedFractions`/`stripFabricatedSentences`/`scrubFabricatedLines`/`buildCorrectionNote`), `sanitizeLLMOutput`, `hasForeignScript`, tầng số liệu (`buildAnalystContext`+signals), gợi ý (`coachSuggest`). `GEMINI_API_KEY` đã ở Vercel env + đã bật billing (hết 429).
  - **(Lịch sử)** 2026-06-21: chỉ Qwen on-device. 2026-06-24 (sáng): Gemini chính + Qwen dự phòng. 2026-06-24 (sau): **bỏ hẳn Qwen, chỉ Gemini**.
  - **2 lối vào, đều dùng Gemini:**
    - *Hỏi Coach* (`CoachChat.jsx`) = **chat** với Gemini theo **khung CHUYÊN GIA 3 nhịp** (quan sát số → xu hướng/chân dung → 1 lời khuyên), `buildLLMChatPrompt` + `COACH_CHAT_SYSTEM`. ⚠️ **KHÔNG few-shot** (đã bỏ `COACH_CHAT_FEWSHOT` — model nhỏ dễ nhái khuôn → bịa, giữ nguyên tắc dù nay đã đổi sang Gemini). Có luật **"ĐỌC ĐÚNG GIÁ TRỊ"** (chép NỘI DUNG sau dấu hai chấm; ví dụ trong prompt dùng PLACEHOLDER X/A/B/C — KHÔNG để số cụ thể) + luật **"TÊN MỤC ≠ NỘI DUNG"** (tên loại việc thật LUÔN trong ngoặc kép). Có **câu hỏi mẫu** (`STARTER_CHIPS`) + **"Đề xuất tiếp theo"** theo ngữ cảnh (`src/engine/coach/coachSuggest.js`, THUẦN luật).
      - ⚠️ **LƯỚI CHẶN-BỊA-SỐ (tất định, tuyến phòng thủ chính chống fake)**: `findFabricatedNumbers`/`hasFabricatedNumbers` (`src/engine/coach/guard.js`) — mọi con số KÈM đơn vị-dữ-liệu (giờ/tiếng/phút/phiên/ngày/tuần/lần/%/h) model viết ra mà KHÔNG có trong bảng → coi là BỊA. Chuẩn hoá `h`/`tiếng`↔`giờ`, dấu phẩy↔chấm; số trần (không đơn vị) được miễn trừ; GIỮ báo làm-tròn (13.3≠13). Chạy được ở CI. KHÔNG bắt "đọc nhầm nhãn" (số có thật) — cái đó do prompt + định dạng bảng lo.
      - ⚠️ **PHÒNG THỦ THEO TẦNG (2026-06-24, ultracode workflow 6 agent + phản biện)**: (1) **viết-lại-CÓ-HƯỚNG-DẪN** — bắt số bịa → `buildCorrectionNote`/`appendCorrectionTurn` chèn lượt chỉ ĐÍCH DANH số sai rồi chạy lần 2 (không blind); chữ-lạ vẫn viết-lại-blind. (2) **CỨU-CÂU** thay vì nuke: `stripFabricatedSentences` (CoachChat — bỏ riêng CÂU chứa số bịa, giữ câu sạch) + `scrubFabricatedLines` (CoachOffline — bỏ riêng DÒNG, giữ khung 4 phần, phần rỗng→"chưa đủ dữ liệu"). Bỏ hết → fallback. (3) **CoachOffline NAY CŨNG có guard số** (trước chỉ chống chữ-lạ). Tất cả THUẦN, test `src/engine/coach/guard.test.js`. ⚠️ Đã BỎ (rủi ro báo nhầm): entity-guard tên loại, kiểm cỡ-mẫu trong guard, đơn-vị-kép, dung sai làm-tròn. ⚠️ Landmine đã vá: `BAND_LABEL.vua` = `'vừa (26 phút–44 phút)'` (mốc dưới PHẢI có "phút", nếu không guard báo nhầm "26 phút").
      - Prompt 2 system thêm luật **"KHÔNG CÓ SỐ THÌ NÓI KHÔNG CÓ"** + **"RANH GIỚI HỌC vs NÓI"** (chỉ lấy số giữa `=== DỮ LIỆU THẬT ===`/`=== HẾT ===`, ví dụ trong prompt KHÔNG phải dữ liệu).
      - ⚠️ **GIỌNG VĂN MƯỢT, BỚT ROBOT (2026-06-24)**: COACH_CHAT_SYSTEM có đoạn **"CÁCH VIẾT"** (3 nhịp là DÀN Ý NGẦM, viết 2–4 câu CHẢY LIỀN, cụm nối "thật ra/nhìn rộng ra"…); COACH_OFFLINE_SYSTEM có đoạn **"GIỌNG VĂN"** ([1][2] văn xuôi, [3] quan sát người-hiểu-người). ⚠️ RANH GIỚI: nới Ở CÂU NỐI, SIẾT Ở CON SỐ — mọi luật trung thực giữ NGUYÊN; lưới chống-bịa tất định độc lập với prompt nên mượt KHÔNG tăng bịa. Câu tất-định (fallback/chữ-lạ/placeholder/chip) đã làm mềm (giữ token `chưa đủ dữ liệu`/`Người dùng chưa có phiên nào` mà test/guard khớp). **decoding GIỮ 0.2/0.8** (0.25/0.85 chỉ đổi ở commit riêng sau khi xác nhận không tăng trôi).
      - ⚠️ **LƯỚI PHÂN SỐ BỊA**: `findFabricatedFractions` (`src/engine/coach/guard.js`) — bắt cặp `N/M` ghép sai (vd "phiên sâu 7/18" khi bảng ghi "4/18"); lookbehind chừa số thập phân (13.3). `extractPctSamplePairs` chuẩn hoá `phần trăm`↔`%`. Cắm vào strip/scrub + gác cuối.
      - ⚠️ **LƯỚI GHÉP-SAI %↔CỠ-MẪU (2026-06-24)**: `findMismatchedPairs` (`src/engine/coach/guard.js`) — bắt kiểu bịa tinh vi: % ghép SAI cỡ mẫu (cả hai số đều CÓ trong bảng nhưng ở 2 dòng khác, vd "đạt 79% trên 18 phiên" — 79% là tổng, 18 phiên là của "Học"). BẢO THỦ: chỉ bắt cặp kề-nhau rõ ("X% … trên N đv" / "N đv … (X%)"), BỎ QUA % so-sánh không cỡ mẫu + mẫu phân số (nghi thì tha — đã verify 9/9 paraphrase thật không báo nhầm). Cắm vào `stripFabricatedSentences`/`scrubFabricatedLines` + gác cuối CoachChat/CoachOffline.
      - **CoachChat UX**: lưu hội thoại localStorage `dc-coach-chat-v1` (lượt `restored` KHÔNG vào prompt — số cũ khỏi mồi model; nút "Xoá hội thoại"); nút "Thử lại" + lỗi phân loại (no-key / gemini-4xx hết-quota / timeout); câu hỏi mẫu BÁM tín hiệu thật (`pickSuggestions` có `limit`); empty-state khi chưa có dữ liệu. ⚠️ ĐÃ BỎ warm-prefetch Qwen (Gemini là chính → không tải model nặng lên máy).
    - *AI phân tích tổng thể* (`CoachOffline.jsx`, tên cũ "Coach offline") = Gemini viết **phân tích 4 phần** `[1] Quan sát · [2] Xu hướng · [3] Chân dung & mẫu hình · [4] Thử nghiệm` (`buildLLMPrompt` + `COACH_OFFLINE_SYSTEM` + ví dụ vàng + tự-kiểm).
    - Cả hai gọi thẳng `generateCloud` (Gemini) — không còn engine on-device, không còn gate `aiCapable`. Nút hiện trong thẻ "AI Coach" ở `FocusRail.jsx` (luôn hiện, kể cả iPhone).
  - **Tầng SỐ LIỆU (KHÔNG phải AI, GIỮ LẠI làm nguồn cho Gemini):** `buildAnalystContext` (`src/engine/coach/coachContext.js`) gom các SIGNAL trong `gameMath.js` (giờ vàng, nhịp hôm nay, phiên khuya, bỏ giữa chừng, xu hướng tuần, hiệu chỉnh mục tiêu, loại bị bỏ bê…) + hồ sơ/dự đoán trong `src/engine/coach/coachIntel.js` (`buildFocusProfile`, `generatePredictions`) → mỗi % kèm cỡ mẫu, bỏ tín hiệu thiếu mẫu. Gemini chỉ **diễn đạt lại số đã-tính-sẵn**, khỏi bịa. Hook: `useAnalystContext` (`useCoachContext.js`).
    - ⚠️ **ĐỊNH DẠNG DÒNG chống đọc-nhầm + guard-safe** (2026-06-22): dòng "Loại việc" đã TÁCH MỖI LOẠI MỘT DÒNG, tên loại trong NGOẶC KÉP, bỏ dấu `|` (vd `Loại việc dành nhiều thời gian nhất là "Học": 13.3 giờ qua 18 phiên…` + `Loại việc "Làm Việc": …`); dòng khuya đổi nhãn → `Tỉ lệ đạt mục tiêu của phiên làm sau 22 giờ đêm: …%`; mọi `′` (prime) ĐỔI sang chữ "phút" (ở `coachContext.js` + `BAND_LABEL`/momentum blurb trong `coachIntel.js`) để guard nhận đơn vị + model khỏi đổi ký tự lạ. ⚠️ Đổi chữ các dòng này phải sửa kèm **marker `coachSuggest.js`** (`category`=`startsWith('loại việc')`, `lateNight`=`'phiên làm sau'`+`'so với ban ngày'`, `longTrend`=`startsWith('xu hướng dài hạn')`, `portrait`=`startsWith('chân dung của bạn')`) + fixture `coachSuggest.test.js` + assertion `coachContext.analyst.test.js`. Chip mới `coachSuggest.js`: `longTrend`+`portrait` (KHÔNG vào `STRONG_SIGNALS`); `detectTopics` (số nhiều) cho câu đa-ý + `LOOSE_KW` bỏ từ quá chung.
    - ⚠️ **CHÍNH XÁC SỐ (2026-06-24)**: dòng khuya dùng `late.lateGoalTotal` (KHÔNG phải `lateAttempts`) làm cỡ mẫu cho % (trước ghép sai mẫu→phóng đại); Tổng quan <60 phút in theo "phút" (tránh "~0 giờ"); trung vị mục tiêu ngày dùng `cal.medianDisplay` (`roundGoalValue`, nhất quán với suggested).
    - ⚠️ **BỘ NHỚ LỜI KHUYÊN (2026-06-25, mảng 5/6 — cá nhân hoá Đàm ưu tiên)**: `coachAdviceMemory.js` (thuần+test `coachAdviceMemory.test.js`) ghi lời khuyên chỉnh-MỤC-TIÊU-NGÀY đã đưa + số liệu LÚC ĐÓ vào localStorage `dc-coach-advice-v1` → sau **≥3 ngày** (cửa sổ 3–21 ngày) thêm dòng `Ghi nhớ: khoảng N ngày trước gợi ý chỉnh mục tiêu về X…(khi đó đạt A% trên B ngày)…đối chiếu hiện tại…tương quan`. Nối ở hook `useCoachContext` (đọc bộ nhớ → dòng + ghi lời khuyên hiện tại, write thưa/idempotent); engine nhận qua `opts.adviceMemoryLine`, linePriority=1. ⚠️ **`parseGoalAdviceFromContext` PARSE dòng "Mục tiêu ngày … thử chỉnh về Z phiên/ngày"** — đổi định dạng dòng đó (ở `coachContext`) PHẢI sửa regex này. THUẦN tương quan, không nhân-quả (prompt cấm vì/nên/do…); mọi số nằm trong dòng → guard không báo nhầm.
    - **"Chân dung của bạn"** (HIỂU CHỦ): dòng tổng hợp đặc điểm ổn định (buổi mạnh, độ dài hợp, độ đều, loại việc chủ đạo, tỉ lệ phiên sâu) — ghép từ `profile`, mỗi mảnh kèm cỡ mẫu.
    - **Tín hiệu MỚI (2026-06-24)**: `getWeekendVsWeekdayContrast` (cuối tuần vs trong tuần — dòng "Cuối tuần so với trong tuần:") + `getComebackRate` (quay lại sau 1 ngày nghỉ — dòng "Phục hồi sau ngày nghỉ: N/M lần") — đều gác chặt (chỉ hiện khi nổi bật) + prefix riêng. **streak-at-risk** GỘP vào `predictStreakKeep` (`atRisk` → dòng "Giữ chuỗi" mở bằng "Chuỗi N ngày đang treo", KHÔNG thêm dòng). ⚠️ **CAP** `COACH_MAX_CONTEXT_LINES=18` + `capContextLines` (cắt theo ƯU TIÊN, giữ Tổng quan/Chân dung/Hôm nay + nhóm STRONG, "Ghi chú" cắt trước — KHÔNG slice mù) chống bảng dài làm 3B loạn. Marker coachSuggest mới: `weekendVsWeekday`=has('cuối tuần so với trong tuần'), `comeback`=has('phục hồi sau ngày nghỉ'). ĐÃ HOÃN (làm bảng dài/trùng): category-momentum, session-length-trend.
    - ⚠️ **Tín hiệu MỚI (2026-06-25, mảng 2/6) — "phiên trơn vs ngắt quãng"**: `getInterruptionPattern` (`gameMath.js`) đọc `e.pauseSegments` (số lần tạm dừng đã LƯU SẴN mỗi phiên, trước nay Coach KHÔNG hề thấy — chỉ Thống kê hiện) → dòng `Phiên liền mạch (chạy hết không tạm dừng): S/T phiên (P%)…`. ⚠️ **CHỈ tính phiên CÓ trường `pauseSegments` (Array)** — phiên CŨ trước khi có tính năng lưu thiếu trường → BỎ, KHÔNG coi là trơn (kẻo thổi phồng); gác cỡ mẫu **≥8 phiên có dữ liệu**. Chip mới `flow` (`coachSuggest.js`): catalog+RELATED+KEYWORD_MAP(`lien mach`/`ngat quang`/`tam dung`…)+GATE+`detectSignals` marker `lineStarts('phiên liền mạch')`. Đổi chữ dòng này phải sửa kèm marker đó + fixture `coachSuggest.test.js` + `coachEvalFixtures.js`.
    - **"Xu hướng dài hạn"** (HỌC THEO THỜI GIAN): `getMultiWeekTrend` (`gameMath.js`) — đi lên/xuống/giữ qua nhiều tuần. ⚠️ CHỈ tính tuần CÓ dữ liệu (tuần không mở app ≠ làm 0 phút — tránh số 0 "ma"), cần **≥3 tuần có dữ liệu** (minWeeks=3) mới hiện; `weekKeysDesc` (4 tuần) dựng bằng Date Ở HOOK (`useCoachContext`), engine vẫn thuần.
  - **Giải mã** (Gemini — default ở `api/coach.js` + caller `CoachChat`/`CoachOffline` truyền `temperature 0.2`): `temperature 0.2 · topP 0.8 · maxOutputTokens 800` (CoachOffline 1200). ⚠️ **2026-06-25 sửa lệch**: tài liệu chủ trương 0.2/0.8 nhưng code chạy 0.3/0.9 → kéo về đúng 0.2/0.8 (tác vụ CHÉP-LẠI-SỐ, nhiệt thấp thì model ít chế số/trôi). **Chống "trôi" tiếng nước ngoài**: prompt ép TIẾNG VIỆT 100% + tự-kiểm; `hasForeignScript()` bắt CJK/Hangul/Kana; component tự VIẾT LẠI 1 lần nếu dính.
  - ⚠️ **ĐÃ GỠ WebLLM/Qwen** (2026-06-24) → không còn build-safety webllm. Muốn đổi model AI → sửa `DEFAULT_MODEL`/`FALLBACK_MODEL` trong `api/coach.js` (hoặc env `GEMINI_MODEL`/`GEMINI_MODEL_FALLBACK`). Nếu sau này muốn dựng lại on-device thì xem lịch sử git (commit "bỏ Qwen").
  - ⚠️ **TIMEOUT + maxDuration (2026-06-25)**: `cloudEngine.js` tự đặt AbortController **28s** khi không có signal ngoài (quá hạn → `code:'timeout'`, không treo vô tận); `vercel.json` đặt `maxDuration:30` cho `/api/coach`. Đây là NỀN cho việc dùng model mạnh-hơn-nhưng-chậm-hơn (mảng 4). ⚠️ Thêm function vào `vercel.json` thì file đó PHẢI tồn tại, không build Vercel sẽ lỗi.
  - ⚠️ **BỘ CHẤM ĐIỂM CHỐNG-BỊA (2026-06-25)**: `src/engine/coach/eval.test.js` + `coachEvalFixtures.js` — đẩy ~30 câu mẫu (sạch/bịa/chữ-lạ) qua TOÀN BỘ guard, đo **BẮT %** (recall) + **BÁO NHẦM %** (FPR), in 1 dòng điểm số mỗi `npm test`. Ngưỡng: **FPR=0 (siết — báo nhầm = xoá oan câu thật, hướng sai nguy hiểm nhất)**, BẮT≥90%. Nâng guard → thêm câu mẫu; tụt điểm = guard bị nới tay, phải xem lại.
- **ĐÃ GỠ HẲN (2026-06-21):** ⚡Nhanh theo luật (`src/engine/qa/`), Hỏi Claude (`api/coach.js` + `buildCoachContext`), model nhúng MiniLM + đọc-nghĩa ghi chú (`src/engine/semantic/`, `useNoteThemes`), bộ trả lời theo luật (`generateCoachBriefing`/`generateCoachInsight`, `useCoachInsight`, `CoachCard`, `FocusReport`, `useCoachIntel`), giọng cảm xúc (`coachVoice.js`, `useCoachVoice`, `ai-coach-sim/`, `coachPersonality`). Gỡ deps `@huggingface/transformers` + `@anthropic-ai/sdk` → app/cài đặt nhẹ hơn. **Đừng khôi phục các thứ này trừ khi Đàm yêu cầu.**
- **Engine game thuần** tách khỏi state: công thức ở `src/engine/gameMath.js` + `constants.js`, state ở `src/store/gameStore.js`. Sửa công thức → sửa ở engine, đừng nhồi vào store. Dữ liệu ngoài (Supabase/import) PHẢI đi qua `normalizePersistedGameState`.
- ⚠️ Điểm nóng: `completeFocusSession` trong `gameStore.js` rất dài (~760 dòng) — sửa cẩn thận, dễ sinh bug "dùng giá trị cũ".
- Luôn `npm test` trước khi commit (xem số bài thật ở dòng cuối output) + `npm run build`. ⚠️ **Glob test ĐÃ ĐỔI 2026-08-12** (`TECH_DEBT #10`): từ danh sách viết tay từng thư mục MỘT CẤP → nay là `'electron/**/*.test.js' 'src/**/*.test.js' 'api/**/*.test.js'`, **để trong dấu nháy đơn** cho chính `node --test` mở rộng (`sh` không có globstar, bỏ nháy là hỏng). Trước đây test đặt trong thư mục con (`src/components/city/…`) sẽ **im lặng không bao giờ chạy** — nay đặt cạnh file nguồn ở bất kỳ độ sâu nào cũng chạy, đúng quy ước ở `PROJECT_STRUCTURE.md`. Thêm thư mục mới KHÔNG cần sửa `package.json` nữa. Công cụ mắt-soi bảng số liệu model nhận: `node --import ./scripts/register-esm-loader.mjs scripts/coach-sample.mjs` (dựng lịch sử mẫu ~24 giờ + in `buildAnalystContext`). Điểm số chống-bịa in ra bởi `src/engine/coach/eval.test.js`.
- ⚠️ **SỬA MỸ THUẬT THÀNH PHỐ 3D thì PHẢI QUÉT, đừng soi từng ảnh rời** (bài học 2026-08-12, Phase 3G): `node scripts/city-preview.mjs --sweep --theme light --eras 1,2,3,4,5` ghép 5 kỷ × 6 chặng ngày vào MỘT tấm ảnh ở `.city-preview/` (~21 giây; đổi `--theme dark`, `--eras`, `--cell`). Lý do phải là bảng chứ không phải ảnh rời: **lỗi mỹ thuật gần như luôn là lỗi SO SÁNH.** Một mặt đất màu cỏ trông vẫn "bình thường" cho tới khi đặt cạnh mặt đất đất-son của kỷ bên; một chân trời xám chỉ lộ ra khi nằm giữa chân trời hồng của bình minh và của hoàng hôn. Đợt quét đầu tiên bắt được **6 lỗi đã chạy trên production nhiều ngày** mà cách soi từng ảnh rời trước đó không hề thấy — trong đó có mái tím sen ở 6/15 kỷ và theme tối làm giữa trưa tối như nửa đêm. Chụp một cảnh duy nhất (có đủ lớp tối góc, đúng như Đàm thấy) thì bỏ `--sweep`; thêm `--pending 3` để soi công trình đang xây (giàn giáo).
- ⚠️ **MỘT CHÚ THÍCH CHỨNG MINH Ý ĐỊNH, KHÔNG CHỨNG MINH RẰNG CON SỐ ĐI KÈM ĐÃ ĐƯỢC ĐO** (bài học 2026-08-13, Phase 3X — suýt để một khoản nợ nằm im vì đọc nhầm chú thích của chính mình). `CityBackdrop.jsx` có câu *"đây là chỗ mà 'đẹp' và 'dùng được' đối đầu nhau trực diện, và dùng được phải thắng"*. Tôi đọc câu đó rồi kết luận "đây là đánh đổi có chủ đích, phải hỏi Đàm mới được đụng" — và **dừng lại**. Đọc kỹ hơn thì chú thích ấy tuyên bố **HAI** ý định chứ không phải một: (1) chữ phải đọc được, và (2) *"thành phố lộ ra rõ nhất ở khoảng trống phía dưới — đúng chỗ chẳng có chữ gì"*. Ý định (1) đạt; ý định (2) **không đạt**. Không hề có xung đột để mà đánh đổi — chỉ có một vế chưa được thực hiện, vì mốc "dải đậm kết thúc ở đâu" chưa bao giờ được đo (nó dựa trên niềm tin rằng mặt đồng hồ nằm trên nền; đo ra thì đồng hồ nằm trong một thẻ ĐẶC ở tận 82% chiều cao). ⇒ **Luật**: trước khi kết luận "cái này là trade-off, cần Đàm quyết", phải kiểm xem mã có đang làm ĐÚNG mọi điều nó tự nhận không. **Một trade-off chỉ có thật khi cả hai vế đều đã đạt và buộc phải hy sinh một vế.** Nếu một vế đang hỏng thì đó là LỖI, và sửa lỗi không cần xin phép.
- ⚠️ **CHỮ Ở TRANG CHỦ NẰM Ở HAI ĐỘ SÂU KHÁC NHAU tuỳ khung màn hình** — và số đo này là NỀN cho lớp phủ ở `cityBackdropScrim.js`: máy bàn (1280) chữ-trên-nền chỉ ở **7%→21%** chiều cao lớp phủ, điện thoại (≤767) ở **31%→48%** (thẻ đồng hồ chiếm gần hết bề ngang nên đẩy khối lời chào xuống). Mặt đồng hồ `25:00` **không** nằm trên nền ở cả hai khung. **Đổi bố cục trang chủ ⇒ PHẢI đo lại** bằng `textmap3.mjs` rồi cập nhật `TEXT_ENDS_PCT` — sai chỗ này **không có gì đỏ cả**, chỉ là chữ khó đọc dần. ⚠️ Và bộ phân loại "chữ trên nền vs chữ trong thẻ" phải dừng ở **phần tử cha của lớp phủ**, KHÔNG phải `<body>`: bản đầu đi tới `<body>` nên chạm phải lớp bọc trang có nền đục và xếp **mọi** chữ vào "trong thẻ" — một kết quả luôn-luôn-đúng, tức vô giá trị. Luôn chạy kèm `--selftest` (bỏ điều kiện nền đục ⇒ mọi chữ phải nhảy nhóm); số không đổi nghĩa là bộ phân loại đã hỏng.
- ⚠️ **BẢNG MÀU ≠ MÀU TRÊN MÀN HÌNH — đừng đọc test mỹ thuật như một lời bảo đảm.** Giữa hai đầu còn ba tầng: cường độ đèn (nắng 2,15 = nhân màu gốc lên hơn hai lần), phép kẹp kênh khi tràn 255, rồi tone mapping. Đo thật (2026-08-12): mái kỷ 6 trong bảng màu là `#77425a` độ tươi **0,29**, trên màn hình ra `#5a1733` độ tươi **0,59 — gấp đôi**; mặt đất (mặt phẳng) thì khớp gần như hoàn hảo. Chênh lệch nằm ở các mặt DỐC. ⇒ Các bài test ở `palette3d.test.js` canh ĐẦU VÀO; muốn biết Đàm thật sự thấy gì thì chụp rồi đo đầu RA: `node scripts/png-probe.mjs <ảnh.png> --top 10` (hoặc `--grid`, hoặc `x,y`). Công cụ tự giải mã PNG bằng `zlib` của Node, không thêm dependency.
  - ⚠️ **KHÔNG CÓ MỘT HỆ SỐ CHUNG — phải đo từng chỗ, và có chỗ lệch NGƯỢC CHIỀU** (bổ sung 2026-08-13, Phase 3V): mái nhà render ra tươi **gấp đôi** bảng màu, còn BẦU TRỜI render ra nhạt đi **5 lần** — vì `NeutralToneMapping` phơi sáng 1,2 nén mạnh vùng sáng, mà chân trời để độ sáng 0,80 thì nằm đúng giữa vùng bị nén. Thêm một tầng nữa chỉ có ở bầu trời: nắng ấm nhân vào làm **góc màu** lạnh tụt 13–22° về phía lục (đặt 195° đo ra 173°), nên muốn ra đúng sắc phải khai cao hơn đích thật ~15°.
  - ⚠️ **ĐO BẢNG QUÉT thì ĐỪNG DÒ MÉP BẰNG MÀU** (bài học 2026-08-13, suýt chữa một bệnh không có): nền tấm bảng TRÙNG màu nền trang, nên phép dò "chạy tới khi khác màu nền" chạy quá đà 60px ngang + 30px dọc, khiến mỗi ô bị lấy mẫu dính sang ô bên và dính dải nhãn giữa hai hàng. Dải nhãn **sáng trưng ở theme sáng, đen kịt ở theme tối** ⇒ số đo sai theo hai chiều NGƯỢC nhau tuỳ theme và bịa ra hẳn một "lỗi đêm phẳng chỉ ở theme tối". Toạ độ thật lấy thẳng từ CSS trong `sweepPageHtml` (`#wrap { padding: 8px }`, rồi `X0 = 60`, `Y0 = 30`, `CELL_H = round(cell × 0,62)`, `LABEL_H = 22`). **Quy tắc chung: nghi ngờ công cụ đo đúng như nghi ngờ mã sản phẩm — số đo nào gây bất ngờ thì kiểm CÔNG CỤ trước, kiểm mã sau.**
  - ⚠️ **CẢNH ĐÊM: đừng chấm bằng độ tương phản tuyệt đối.** Đêm tối thì tương phản thấp là ĐÚNG, không phải lỗi. Phép đo có ý nghĩa cho chặng đêm là **15 kỷ có còn khác nhau không** (độ tản sắc/sáng giữa các kỷ trong cùng một chặng) — vì thứ thật sự mất nếu đêm hỏng là phần thưởng của việc đi hết 15 kỷ. Đo đúng cách (2026-08-13): tản sắc lúc đêm 28,2°, ngang bằng năm chặng kia ⇒ đêm khoẻ.
  - ⚠️ `.city-preview/` đã có trong `.gitignore` **và** trong `globalIgnores` của `eslint.config.js` — ESLint KHÔNG tự đọc `.gitignore`. Thiếu vế thứ hai thì chạy `npm run lint` đúng lúc đang dựng ảnh sẽ ra **29 lỗi giả** nằm trong ruột three.js được gói tạm.
- ⚠️ **`--virtual-time-budget` LÀM ĐÓNG BĂNG MỌI HOẠT HOẠ rAF — ẢNH CHỤP CÓ THỂ THIẾU HẲN MỘT KHỐI MÀ KHÔNG BÁO GÌ** (bài học 2026-08-13, suýt báo lỗi ma lần thứ hai trong cùng một ngày). framer-motion dựng phần tử ở trạng thái `initial` rồi mới chạy tới `animate` bằng `requestAnimationFrame`. Tua nhanh thời gian ảo thì rAF không nhích ⇒ phần tử **kẹt vĩnh viễn ở `initial`**. Một `motion.section` khai `initial={{opacity:0}}` sẽ ra ảnh là **một mảng trắng**, trong khi mọi phần tử KHÔNG hoạt hoạ quanh nó vẫn vẽ bình thường — nên tấm ảnh trông hoàn toàn hợp lý, chỉ thiếu mất một khối. Thực tế đã gặp ở tab Thành Tích: `Achievements.jsx:488` là phần tử hoạt hoạ DUY NHẤT của cả trang, và đúng nó biến mất, để lại khoảng trắng ~490px trông y hệt một lỗi bố cục nghiêm trọng. ⚠️ **Và `getComputedStyle(el).opacity` KHÔNG giúp phát hiện**: nó trả về độ mờ của CHÍNH phần tử đó, không phải độ mờ hiệu dụng — con chữ vẫn báo `opacity=1 visible` màu đen trong khi tổ tiên đang `opacity:0`. Phải đi NGƯỢC lên cây mới thấy. ⇒ **Đừng dùng `--virtual-time-budget` để soi giao diện nữa. Dùng `node scripts/shot.mjs`** (CDP: đợi bằng thời gian THẬT nên rAF chạy đủ, `Emulation.setDeviceMetricsOverride` cho bề ngang điện thoại THẬT, và luôn in `innerWidth` thật kèm cảnh báo tràn ngang). Hệ quả đáng lo: **mọi lần soi giao diện bằng công cụ cũ đều có thể đã bỏ sót nội dung** — nếu một kết luận mỹ thuật cũ dựa trên ảnh chụp kiểu cũ, hãy chụp lại bằng `shot.mjs` trước khi tin.
- ⚠️ **KẾT LUẬN "HAI THỨ NÀY GIỐNG NHAU" CHỈ ĐÁNG TIN KHI PHÉP ĐO PHỦ HẾT NHỮNG GÌ MẮT THẤY** (bài học 2026-08-13, Phase 3Y — một phép đo hẹp vừa kết tội oan vừa bỏ lọt cùng lúc). Bản quét 15 kỷ × 6 chặng được chấm bằng **góc màu của dải trời**, và từ đó kết luận "chặng chiều là chặng xấu nhất, ba chặng ấm nằm gọn trong 20°". Chấm lại bằng **cả cảnh** (vector 9 chiều: dải trời + dải thành phố + dải đất, mỗi dải 3 kênh, trung bình 15 kỷ) thì lật ngược hẳn: chặng chiều cách hoàng hôn **37,6/255** — rõ ràng — còn **bình minh ↔ hoàng hôn chỉ 5,9**, dưới ngưỡng mắt phân biệt (~12). Tức hai chặng đó là CÙNG MỘT BỨC ẢNH suốt nhiều ngày, mà phép đo hẹp không hé một lời. Góc màu chỉ là một trong ba thành phần của màu; dải trời chỉ là một trong ba dải của khung hình. ⇒ **Đo một trục thì vừa BÁO NHẦM vừa BỎ SÓT, và cái bỏ sót nguy hiểm hơn vì nó im lặng.** Kèm theo: **đo tổng cả cảnh nói được CÓ lỗi nhưng không nói được lỗi Ở ĐÂU** — phải đo theo TỪNG DẢI mới truy ra nguyên nhân (chính phép đo từng dải mới lộ ra rằng đổi màu trời không hề chạm tới dải thành phố).
- ⚠️ **MỘT LUẬT CHỈ ĐƯỢC CÓ MỘT CÔNG THỨC — thấy hai chỗ cùng phát biểu một luật thì gộp lại NGAY, đừng chờ nó cắn** (bài học 2026-08-13; cùng một hình dạng sai cắn **hai lần trong một ngày**). (1) `daylight.test.js` phát biểu "chân trời bình minh/hoàng hôn phải ẤM" ở hai chỗ: một chỗ viết `horizonHue < 60`, chỗ kia có hàm `warm(h) = h < 90 || h >= 300` biết quấn vòng màu. Bản `< 60` chặt hơn nên nó âm thầm thắng, và chính nó nhốt hai chặng vào chung một múi 60° — tức là **cái luật viết cẩu thả hơn lại là cái đang cai trị**. (2) `palette3d.js` chặn "mái tím rực" bằng **cửa sổ góc màu** `h >= 255 && h <= 340`, còn `palette3d.test.js` định nghĩa dải tím bằng **quan hệ kênh** (đỏ và lam đều cao hơn lục). Hai vùng chồng nhau nhưng không trùng ⇒ có khe, và mái kỷ 15 ở **247°** lọt đúng khe đó (tươi 0,44 / trần 0,42). ⇒ Khi mã sản phẩm và bài test cùng canh một luật, **mã phải gọi đúng phép thử mà test dùng**, không được diễn đạt lại bằng một công thức "tương đương" — hai công thức tương đương trên giấy gần như luôn lệch nhau ở biên.
- ⚠️ **BẤT BIẾN KIỂU "CÁC THỨ NÀY PHẢI KHÁC NHAU" PHẢI DUYỆT TỔ HỢP ĐÔI, KHÔNG ĐƯỢC DUYỆT DANH SÁCH THEO THỨ TỰ.** `daylight.test.js` có bài "hai chặng liền nhau không được giống nhau", viết dạng `for (i = 1; i < DAY_PHASES.length; i++)` — tức chỉ các cặp KỀ NHAU. `dawn` ở đầu danh sách và `dusk` ở cuối nên **không bao giờ** được đem so với nhau, và lỗi trên sống sót qua mọi lần chạy test. Đây là **lần thứ HAI cùng một hình dạng sai xuất hiện trong chính file đó** (lần trước: bài "hành trình màu" tính cả `night` nên bộ số hỏng vẫn đủ độ trải). Cùng họ với "ngưỡng một phía là cái phễu, không phải hàng rào". ⇒ Khi viết bài test kiểu "N thứ này phải phân biệt được", luôn duyệt `for i` × `for j > i`, và **nhốt sẵn bộ giá trị HỎNG cũ vào một bài đối chứng** bắt buộc phép đo phải còn bắt được nó — đó là cách duy nhất giữ cho ngưỡng không bị nới dần cho tiện. (Muốn ngưỡng thuần-số đáng tin thì phải HIỆU CHUẨN nó với phép đo thật: ở đây 0,31↔5,9px · 0,52↔29,8px · 1,28↔75,1px, Spearman 0,854.) **Và canh cả SỐ LƯỢNG cặp sát nhau, không chỉ cặp gần nhất** — "cặp gần nhất = 8,4" đứng yên y hệt dù có MỘT cặp sát nhau hay NĂM cặp, mà năm cặp nghĩa là một phần ba hành trình 15 kỷ không cho người chơi thấy gì mới. Cực tiểu cũng là một con số gộp.
- ⚠️ **CÔNG CỤ ĐO TỰ CHẾ NÓI DỐI LẦN THỨ 11 — và lần này nó nói dối theo hướng GÂY HOẢNG, không phải trấn an.** Đo "15 kỷ có khác nhau không" bằng cách lấy TRUNG BÌNH cả dải thành phố ra kết luận **70/105 cặp kỷ trùng nhau**. Sai: mái (thứ mang bản sắc kỷ) chỉ chiếm ~1/10 diện tích dải đó, phần còn lại là mặt đất và trời lọt giữa các khối — giống hệt nhau ở mọi kỷ, tức tín hiệu bị pha loãng ~10 lần. Lọc lấy 8% pixel TƯƠI NHẤT (tức mái) thì con số thật là **5/105**. ⇒ Hai cách nhận ra: (a) luôn cắm `--selftest` bỏ bộ lọc — nếu số không nhảy về mức pha loãng thì bộ lọc chưa hề chạy; (b) **khi hai phép đo cãi nhau thì phải truy tới cùng, không được chọn cái nghe hợp ý** — ở đây tầng thuần đã có sẵn bài duyệt 105 cặp màu mái báo "cặp gần nhất 8,4", mâu thuẫn hẳn với "70 cặp trùng", và chính mâu thuẫn đó chỉ ra công cụ mới là thứ hỏng.
- ⚠️ **MUỐN ĐỔI MÀU CỦA VẬT THÌ PHẢI ĐỔI THỨ CHIẾU VÀO VẬT (hoặc thứ PHỦ LÊN vật), KHÔNG PHẢI THỨ ĐỨNG SAU VẬT.** Đẩy chân trời bình minh đi thật xa hoàng hôn thì dải TRỜI tách được, nhưng dải THÀNH PHỐ vẫn chỉ cách 8,7/255 (góc màu 51° vs 44°). Lý do: thứ nhuộm màu lên thành phố là ĐÈN MẶT TRỜI (`sunWarmth`) và đèn bán cầu (lấy màu từ **`skyHue` đỉnh trời**, không phải `horizonHue`) — còn `horizonHue` chỉ vẽ tấm phông. Mà `sunWarmth` thì **buộc phải ấm ở cả hai đầu ngày** (mặt trời thấp ⇒ ánh sáng xuyên quãng khí quyển dài — vật lý, không phải lựa chọn mỹ thuật; đã thử nói ngược lại và bị test bắt). Lối thoát là **SƯƠNG MÙ**: nó lấy màu chân trời nên nó sơn lại cả mảng NỀN phía sau và quanh thành phố. Tắt riêng nó rồi bật lại: **17,2 → 75,1/255**. ⚠️ Nhưng phải nói cho đúng nó làm gì: nền/chân trời **12,9 → 74,6**, còn dải THÀNH PHỐ **8,4 → 3,3 — GIẢM**, mặt đất không đổi. Toàn bộ khoảng cách đến từ phần nền, không từ các công trình (sương cố ý bắt đầu SAU rìa thành phố nên không chạm nhà ở gần) — và điều đó ĐÚNG vật lý: cùng một mặt trời thấp thì tường nhà buổi sáng và buổi chiều vốn phải giống nhau; thứ cho ta biết đang là sáng hay chiều là bầu trời, là sương, là đèn đường đã bật hay chưa. ⚠️ **Chú thích đầu tiên tôi viết cho chỗ này khẳng định ngược lại** ("sương quét sắc lên chính những công trình ở xa nên cuối cùng chạm được vào dải THÀNH PHỐ") — nghe cực kỳ xuôi tai, và sai hẳn dấu. **Một cơ chế nghe hợp lý vẫn phải ĐO rồi mới được viết ra**, kể cả khi con số tổng đã xác nhận là việc sửa có tác dụng: "sửa đúng" không chứng minh "hiểu đúng vì sao".
- ⚠️ **NGƯỠNG TƯƠNG PHẢN ÁP CHO THỨ MANG THÔNG TIN, KHÔNG ÁP CHO THỨ TRANG TRÍ** (bài học 2026-08-13, Phase 4B). Thanh chuyển kỷ có một **chấm tròn** màu kỷ và — mới thêm — một **ngôi sao "trọn vẹn"**. Bản đầu tô cả hai bằng `eraSolid(era)` cho nhất quán. Đo tương phản `ERA_METADATA.accentColor` trên nền thẻ qua đủ 8 tổ hợp theme × skin: kỷ 9 `#a3e635` ra **1,49:1**, kỷ 3 `#facc15` ra 1,51:1 (ngưỡng cho ký hiệu là 3:1) — tức ngôi sao **gần như tàng hình ở theme sáng**, đúng chỗ đáng lẽ là phần thưởng. Nhưng cái chấm tròn ở cùng màu ấy thì **không sao cả**, và đã chạy nhiều tháng không ai kêu. Khác biệt không nằm ở màu mà ở VAI TRÒ: chấm tròn là trang trí thuần (số kỷ ghi ngay cạnh nó, mất chấm không mất gì), còn ngôi sao là thứ DUY NHẤT nói "kỷ này trọn vẹn". ⇒ Đừng áp một ngưỡng cho mọi thứ trên màn hình, và cũng đừng bỏ ngưỡng vì "chỗ kia màu đó vẫn ổn". Hỏi: **mất phần tử này thì Đàm có mất thông tin nào không?** Có → 3:1 trở lên (chữ nhỏ 4,5:1); không → tuỳ mỹ thuật. `--accent` đo được **2,97–7,43:1** qua 8 tổ hợp và là màu "cái này quan trọng" sẵn có của app. **Không có gì đỏ lên khi sai chỗ này** — build xanh, lint sạch, test xanh; chỉ có một phần thưởng vô hình. Đã khoá bằng test đọc-mã-nguồn ở `cityRenderers.test.js` (đã thử ngược và thấy đỏ).
- ⚠️ **MỘT CON SỐ KHÔNG CÓ MẪU SỐ THÌ KHÔNG PHẢI MỤC TIÊU** (bài học thiết kế 2026-08-13, Phase 4B — ghi lại vì nó lặp ở nhiều màn hình khác). Màn Thành Phố hiện "Công trình: 3" suốt từ đầu, và **không ai nhận ra đó là lỗi** vì con số hoàn toàn đúng. Nhưng ba trên mấy thì chính Đàm cũng không biết, nên nó không bảo được anh còn phải làm gì. Thêm mẫu số ("3/5") thì đúng con số đó tự đọc ra "còn 2 nữa là trọn vẹn kỷ này". ⇒ Trước khi thêm hiệu ứng/hoạt hoạ cho "đỡ chán", soát xem **các con số đang hiện đã hành động được chưa** — rẻ hơn nhiều và ăn sâu hơn nhiều. ⚠️ Và mẫu số PHẢI tự đếm từ nguồn (`BLUEPRINT_CATALOG`), cấm viết cứng: hôm nay cả 15 kỷ đều đúng 5 bản vẽ, nhưng viết cứng số 5 là gài mìn — ngày nào có bản vẽ thứ 6, màn hình sẽ gắn sao "trọn vẹn" cho một thành phố còn thiếu nhà mà không có gì đỏ lên.
- ⚠️ **FIXTURE ĐỀU TĂM TẮP LÀ FIXTURE VÔ DỤNG** (lần thứ 12 công cụ dev nói dối, 2026-08-13). `scripts/make-fixture.mjs` có dòng `notBuilt.length > 1` kèm lý do chính đáng: "chừa lại một bản vẽ chưa xây để còn `craftingQueue` mà soi giàn giáo". Ý định đúng — nhưng nó áp cho **MỌI kỷ**, kể cả kỷ đã niêm phong nơi chẳng còn ai đang xây gì. Hệ quả: **không kỷ nào trong fixture có thể đạt 5/5**, cả bảo tàng ra một dãy "4/5" giống hệt nhau, và trạng thái "trọn vẹn" gần như không tồn tại để mà nhìn thấy. Một tính năng hỏng vẫn sẽ trông bình thường trên fixture đó. Đúng bài học **"một trade-off chỉ có thật khi cả hai vế đều đã đạt"**: ở đây vế thứ hai (giàn giáo) chỉ liên quan tới kỷ ĐANG chơi, nên nó **không hề cần** cái giá kia. ⇒ Khi soi một màn hình có nhiều phần tử cùng loại (kỷ, thành tích, danh mục…), **kiểm xem dữ liệu mẫu có ĐỦ ĐA DẠNG để phân biệt không** trước khi kết luận "trông ổn" — y như luật đã có cho bảng quét 15 kỷ: lỗi mỹ thuật gần như luôn là lỗi SO SÁNH.
- ⚠️ **CHỤP KHUNG ĐIỆN THOẠI BẰNG `--window-size` LÀ SAI — Chromium headless có SÀN 500px** (bài học 2026-08-13, suýt báo một lỗi không có). Đặt `--window-size=390,844` thì ảnh ra đúng 390 điểm ảnh ngang, **nhưng `window.innerWidth` thật là 500**: trang dàn ở 500 rồi bị cắt còn 390, trông y hệt một lỗi tràn ngang nghiêm trọng (chữ cụt giữa câu, thanh dưới mất nút). Đo bằng số thì `scrollWidth === innerWidth` và **không phần tử nào vượt mép phải** — app hoàn toàn không tràn. ⇒ Muốn khung điện thoại THẬT phải dùng CDP `Emulation.setDeviceMetricsOverride`, không dùng `--window-size`. Và **luôn in kèm `window.innerWidth` thật vào mỗi lần chụp** — nếu không thì mọi kết luận về bố cục hẹp đều dựa trên một bề ngang bịa.
- ⚠️ **LỚP NỀN THÀNH PHỐ Ở TRANG CHỦ NUỐT GẦN HẾT VÒNG NGÀY** (đo 2026-08-13, CHƯA xử lý — chờ Đàm quyết, xem `TECH_DEBT.md` #16). Đo trên ảnh chụp thật ở bề ngang 1280, hai dải thành phố lộ ra hai bên thẻ đồng hồ: cả 6 chặng ngày ra gần như cùng một mảng trắng ngà (`#cececc`–`#dddcd7`, độ tươi **0,02–0,12**), và cặp cách nhau XA NHẤT — giữa trưa với ban đêm — chỉ **14/255**. Nguyên nhân không phải `BACKDROP_OPACITY` mà là **lớp phủ giữ-chữ-đọc-được**: nó pha về `var(--canvas)` (một màu PHẲNG) ở 55–92%, mà pha về màu phẳng thì **giết ĐỘ TƯƠI mạnh hơn giết độ sáng** — đúng thứ vòng ngày dựa vào. Hình khối (tín hiệu độ sáng) sống sót, còn màu thì không. ⚠️ Đây là **thiết kế có chủ đích** (chú thích tại chỗ ghi rõ "đẹp và dùng được đối đầu, dùng được phải thắng"), nên **đừng tự chỉnh** — nhưng cũng đừng tưởng công sức làm bầu trời tới được trang chủ.

## App menu bar Mac (Electron tray) — cách bật, và 4 cái bẫy đã trả giá (2026-08-05, 2026-08-10)
- **Chạy bằng gì**: `node_modules/electron/dist/Electron.app/Contents/MacOS/Electron <đường-dẫn-dự-án>` (binary chạy thẳng). KHÔNG có bản `.app` đóng gói nào cho app tray.
- ⚠️ **BẪY 1 (đã dọn 2026-08-05, ghi lại để đừng tạo lại)**: từng có `DC Pomodoro.app` nằm ngay trong thư mục dự án, trông như app menu bar nhưng **KHÔNG PHẢI** — nó là applet AppleScript đời cũ, khởi động `serve-dist.mjs` ở `localhost:31105` rồi mở Chrome (đúng luồng localhost đã bị cấm ở mục "KHÔNG làm những thứ này"), lại còn trỏ vào thư mục cũ `Pomodoro Game - USING`. Mở nó KHÔNG làm hiện icon tray. **Đã xoá.** Đừng tạo lại kiểu launcher này; muốn bật app tray thì dùng LaunchAgent bên dưới.
- ⚠️ **BẪY 2 — launchd KHÔNG chạy được đường dẫn có ký tự tiếng Việt.** Trỏ `ProgramArguments` thẳng vào đường dẫn chứa "Bản sao…" thì job luôn thoát **mã 78 (EX_CONFIG)**, KHÔNG có stderr, dù `plutil -lint` OK và `test -x` báo file tồn tại (bash chuẩn hoá NFC/NFD, launchd thì không). **Cùng họ với cái bẫy NFC/NFD làm test nạp hai bản React.** Cách vá: LaunchAgent chỉ trỏ tới script bọc ở đường dẫn **thuần ASCII** — `~/Library/Application Support/dc-pomodoro-tray.sh` — script đó mới `cd` vào thư mục có dấu (bash xử lý đúng). Log cũng phải để ở đường dẫn ASCII (`~/Library/Logs/dc-pomodoro-tray.*.log`).
- **Tự khởi động**: LaunchAgent `~/Library/LaunchAgents/com.dcpomodoro.tray.plist` (`RunAtLoad` bật, **`KeepAlive` TẮT** để nút "Thoát" trong menu tray thoát được thật, không bị bật lại ngay).
- ⚠️ **BẪY 3 — `main.js` KHÔNG có khoá chống chạy trùng** (`requestSingleInstanceLock`). Chạy 2 lần = **2 biểu tượng** trên thanh menu. Trước khi nạp LaunchAgent phải `pkill` bản đang chạy tay.
- ⚠️ **BẪY 4 (2026-08-10) — "ảnh trong suốt" KHÔNG bằng "không có ảnh".** Khi có phiên chạy, tray bỏ icon đi và chỉ hiện chữ (`🍅 mm:ss` / `☕ mm:ss`). Trước đây chỗ "bỏ icon" nạp `public/tray-empty.png` (16x16, alpha = 0 toàn bộ). Trong suốt nên KHÔNG nhìn thấy, **nhưng macOS vẫn chừa đủ 16 điểm ảnh chỗ cho nó** → sinh khoảng trắng ngay trước quả cà chua / cốc cà phê. Vá đúng: `nativeImage.createEmpty()` (ảnh 0x0, không chiếm chỗ). File `tray-empty.png` đã xoá hẳn. **Đừng quay lại dùng PNG trong suốt cho mục đích "ẩn icon".**
- **Không có phiên nào chạy thì tray chỉ hiện icon trơn** (`updateTrayTitle` đặt tiêu đề rỗng) — đó là bình thường, không phải hỏng. Có phiên mới hiện `🍅 mm:ss`.
- **(Đã dọn sạch 2026-08-05)** Toàn bộ dấu vết dự án đời cũ đã bị xoá (chuyển Thùng rác): LaunchAgent `com.civjourney.localhost`; thư mục dự án cũ `Downloads/Claude Code/Pomodoro Game - USING` (đã rỗng, chỉ còn log); applet `DC Pomodoro.app`; 2 file backup dữ liệu game cũ + 2 file thiết kế đời CivJourney trong `Downloads`; 2 thư mục phiên Claude của đường dẫn dự án cũ. **Từ nay chỉ còn MỘT thư mục dự án duy nhất**: `Downloads/Claude Code/Bản sao Pomodoro Game - USING`. (Hai thứ tên có "pomodoro" còn lại trong `~/Library` — `com.macpomodoro` và `iCloud~com~limepresso~pomodorofree` — là app Pomodoro của hãng KHÁC, không liên quan dự án này, KHÔNG được xoá nhầm.)

## Quy trình deploy
```
Sửa code → git add . && git commit -m "mô tả" → git push origin main
→ Vercel tự deploy trong ~2 phút
→ Mọi thiết bị thấy bản mới
```
Hoặc bấm đúp file `/Users/damduy/Desktop/🚀 Deploy App.command`

- ⚠️ **PHẢI LÀ NHÁNH `main`, không phải nhánh nào khác** (bài học 2026-08-12, mất công chờ vô ích): Vercel **chỉ cập nhật production khi có push vào `main`**. Push vào nhánh khác (vd nhánh tính năng `claude/...` mà phiên Claude Code trên web tự tạo) chỉ sinh một bản **Preview** ở URL riêng — `pomodoro-dc.vercel.app` KHÔNG đổi gì cả, và bản Preview của gói Hobby thường bắt đăng nhập Vercel mới xem được trên Safari iPhone. Chính trang Overview của Vercel có ghi *"To update your Production Deployment, push to the `main` branch"* nhưng rất dễ lướt qua.
  - ⇒ **Quy tắc cho MỌI AI**: làm xong thứ Đàm cần THẤY trên máy thật mà đang ở nhánh phụ → **hỏi Đàm cho gộp vào `main`**, đừng dừng ở nhánh rồi báo "đã deploy xong". Nhánh phụ = code đã an toàn trên GitHub, KHÔNG có nghĩa là đã lên production.
  - Cách gộp an toàn: `git fetch origin main` → kiểm `git merge-base --is-ancestor origin/main <nhánh>` (trả về true là gộp thẳng được, không xung đột) → `git checkout -B main origin/main && git merge --ff-only <nhánh> && git push origin main`.
- ⚠️ **Push xong PHẢI mở tab Deployments xác nhận "Ready"** — code xanh + commit thành công KHÔNG có nghĩa là đã thực sự lên production (xem sự cố `8ee264d` ở mục "Vercel Hobby: giới hạn 12 Serverless Functions").

## Việc đang dở & sắp tới
→ Xem **`BAN_GIAO.md`** (mục "Sẽ làm tiếp" + "Nhật ký cập nhật"). Web Push iPhone đã xong & deploy.

## KHÔNG làm những thứ này
- ❌ Không biến Electron thành app chính riêng biệt.
- ❌ Không dùng localhost / serve-dist.mjs / LaunchAgent làm luồng chạy chính.
- ❌ Không nhân đôi logic game giữa web và Electron. Logic chính nằm ở web app.
- ❌ KHÔNG start phiên focus trên dev/localhost — dev dùng chung Supabase row với production, sẽ ghi đè dữ liệu thật của Đàm.

## Lưu ý kỹ thuật
- `npm install` cần flag `--legacy-peer-deps`
- Electron còn liên quan tới menu bar Mac. Đừng xoá hoặc bỏ qua khi sửa timer/tray.
- `serve-dist.mjs` và LaunchAgent là luồng local cũ, chỉ đụng khi thật sự cần.
- ⚠️ **(Lịch sử, đã gỡ)** Từng có `coachVoice.js` (giọng cảm xúc) + thư mục `ai-coach-sim/` (bản demo trình duyệt) — cả hai đã bị xoá hẳn ngày 2026-06-21 (xem mục "ĐÃ GỠ HẲN" ở trên). KHÔNG còn `src/engine/coachVoice.js` hay `ai-coach-sim/` trong repo — đừng tạo lại trừ khi Đàm yêu cầu.
