# GOVERNANCE — quy tắc quản trị dự án + quy trình làm việc chuẩn

> **Tách khỏi `CLAUDE.md` ngày 2026-09-06** để `CLAUDE.md` (file TỰ NẠP 100% mỗi phiên, tính tiền
> ở MỌI phiên kể cả phiên chẳng liên quan) về dưới trần. **Không xoá một chữ nào** — nguyên văn
> hai mục "PROJECT GOVERNANCE PROTOCOL" và "AI ENGINEERING PLAYBOOK" nằm dưới đây.
>
> **Mở file này khi:** làm một task đáng kể và cần biết phải cập nhật tài liệu nào · cần mẫu
> Technical Advisor Report · phân vân về quy trình 7 giai đoạn · sắp tạo module/abstraction mới.
> **Không cần mở khi:** sửa mỹ thuật 3D (dùng `PHASE_RULES.md`) hoặc một sửa lỗi nhỏ.

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

