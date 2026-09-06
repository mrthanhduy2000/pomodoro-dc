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
1. **TRƯỚC khi làm:** đọc **`START_HERE.md`** — file DUY NHẤT bắt buộc đọc mỗi phiên. Rồi **`PHASE_RULES.md`** nếu đang làm một phase. Mọi file khác là **KHO TRA CỨU**: chỉ mở phần `grep` trúng, KHÔNG đọc trọn. *(Đổi 2026-09-06 — ĐÍNH CHÍNH quy tắc 2026-08-24: quy tắc ấy xếp cả `CLAUDE.md` vào diện "chỉ grep", nhưng ĐO RA thì harness **TỰ NẠP 100% `CLAUDE.md`** trước khi AI kịp quyết định gì ⇒ câu đó **không AI nào thi hành được**, và file đã âm thầm phình tới **190.700 token = 95% cửa sổ 200k**. Cách chữa duy nhất là TÁCH FILE, đã làm: nay còn ~22.500 token. Xem mục «BẢN ĐỒ TÀI LIỆU» bên dưới.)*
2. **SAU khi có cập nhật:** ghi `BAN_GIAO.md` + `CHANGELOG.md`. File khác **chỉ sửa khi thay đổi làm nội dung nó SAI SỰ THẬT** (bảng ở mục Governance Protocol vẫn đúng về *file nào giữ vai trò gì*, nhưng KHÔNG còn bắt sửa cho đủ bộ mỗi lần — xem `PHASE_RULES.md` §5). Đổi trạng thái hoặc việc tiếp theo thì phải sửa `START_HERE.md`.
3. Bàn giao thiết kế chi tiết nằm ở thư mục memory:
   `/Users/damduy/.claude/projects/-Users-damduy-Downloads-Claude-Code-B-n-sao-Pomodoro-Game---USING/memory/`
   (đặc biệt `upgrade-roadmap.md` cho AI Coach, `ui-review-2026-06.md` cho UI, `resonance-update.md` cho game loop).
4. Luôn chạy `git status` tươi — đừng tin ảnh chụp git cũ.
5. Muốn biết **file nằm ở đâu** → `PROJECT_STRUCTURE.md`. Muốn biết **bức tranh kiến trúc lớn** (luồng dữ liệu, vì sao chia lớp thế này) → `ARCHITECTURE.md`. Cả hai PHẢI cập nhật cùng lúc với mọi thay đổi cấu trúc (đúng quy tắc số 2 ở trên).
6. ⚠️ **File này là NGUỒN SỰ THẬT DUY NHẤT về quy tắc, cho MỌI AI** (Claude Code, Codex, ChatGPT...) — tên file có chữ "CLAUDE" chỉ vì lịch sử, KHÔNG có nghĩa quy tắc chỉ dành cho Claude. `AGENTS.md` (điểm vào của Codex) **chỉ là con trỏ trỏ về đây**, tuyệt đối KHÔNG chép nội dung sang. **TUYỆT ĐỐI không tạo bản sao tài liệu quy tắc cho từng công cụ AI** — đã thử 2026-07-31 và thất bại: bản sao sinh câu vô nghĩa + đường dẫn `.Codex/` không tồn tại, rồi trôi khỏi bản gốc chỉ sau 5 ngày (thiếu nguyên mục "3 cái bẫy menu bar"). Đây chính là điều quy tắc **Composition over Duplication** ở mục Playbook cấm. Chi tiết: `AGENTS.md`.

>⚠️ **ĐỌC TRƯỚC:** phần lớn nghi thức trong file này đã được THU GỌN từ 2026-08-24.
>Quy trình đang có hiệu lực cho phase mỹ thuật thành phố 3D nằm ở **`PHASE_RULES.md`**
>(sản phẩm là ẢNH · không đo hiệu năng · không viết công cụ đo mới · test chỉ giữ bất biến
>ADR-007 · tài liệu 2 file · báo cáo 5 dòng · làm hết 4–8 việc trong một lượt).
>Phần dưới đây giữ lại làm KHO TRA CỨU và vẫn đúng cho phase kiến trúc/hạ tầng
>(Supabase sync, database, AI Coach, deploy, bảo mật).

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

## 🗺️ BẢN ĐỒ TÀI LIỆU — file nào tự nạp, file nào phải tự mở

⚠️ **Sự thật về cơ chế (đo 2026-09-06, sửa lại quy tắc 2026-08-24):** Claude Code / Codex
**TỰ NẠP 100% `CLAUDE.md`** vào đầu mỗi phiên, trước khi AI kịp quyết định gì. Nên câu
*"CLAUDE.md là kho tra cứu, chỉ grep phần cần"* ở quy tắc cũ là **bất khả thi** — không AI nào
thi hành được. Cách duy nhất làm nhẹ phiên là **TÁCH FILE**, và đó là việc đã làm hôm nay:
`CLAUDE.md` đi từ **190.700 → ~20.000 token** (giảm ~89%), không xoá một chữ nào.

| File | Cơ chế | Khi nào mở |
|---|---|---|
| `CLAUDE.md` (file này) | **TỰ NẠP mỗi phiên** — phải luôn NGẮN | luôn có sẵn |
| `START_HERE.md` | bắt buộc đọc mỗi phiên | mở phiên |
| `PHASE_RULES.md` | đọc khi đang làm một phase | làm phase |
| **`docs/LESSONS_3D.md`** | **`grep`, đừng đọc trọn (~146k token)** | sửa mỹ thuật thành phố 3D |
| **`docs/AI_COACH.md`** | `grep` | sửa AI Coach / Gemini / lưới chống-bịa |
| `TECH_DEBT.md` · `ARCHITECTURE_DECISIONS.md` · `PERFORMANCE.md` · `BAN_GIAO.md` | `grep` | tra cứu |

⚠️ **LUẬT MỚI, ÁP CHO MỌI PHIÊN SAU: `CLAUDE.md` có TRẦN ~20.000 token.** Thêm một bài học
mới thì viết vào `docs/LESSONS_3D.md` (mỹ thuật 3D) hoặc file chuyên đề tương ứng, rồi — chỉ khi
nó đổi một QUY TẮC — thêm một dòng trỏ ở đây. Đừng để file này phình lại: nó là thứ duy nhất
tính tiền ở **mọi** phiên, kể cả phiên chẳng liên quan. Kiểm bằng:
`node -e "console.log(require('fs').readFileSync('CLAUDE.md','utf8').length)"`
**Trần 40.000 ký tự** (≈25.000 token = **12,5% cửa sổ 200k** — mỗi phiên chỉ hy sinh 1/8 context cho quy tắc; đó là lý do của con số, không phải một mức chọn bừa). Giá trị THẬT lúc đặt trần: **35.723 ký tự** — biên còn 11%. ⚠️ Ghi cả hai con số vì bài học Phase 9A: *một ngưỡng không kèm giá trị thật là một cái phễu*; và cái trần đầu tiên tôi viết ra hôm nay là 32.000 — **chính file này đã vi phạm nó ngay lúc viết**, đúng bẫy *"một câu tự trấn an phải được kiểm như một con số"*.

## 🎨 Bài học mỹ thuật thành phố 3D → **`docs/LESSONS_3D.md`**

**89 bài học cấp 1 + 96 mục "KÈM THEO"** (146.727 token) đã chuyển sang đó, nguyên văn.
Chúng là phần tri thức đắt nhất dự án — mỗi mục là một lần đã trả giá bằng một phase.

⚠️ **Đang làm bất cứ gì đụng thành phố 3D thì PHẢI `grep` file đó TRƯỚC.** Từ khoá hay trúng:

```bash
grep -n 'CÔNG CỤ ĐO NÓI DỐI' docs/LESSONS_3D.md   # 28 lần công cụ tự chế nói dối
grep -n 'GÁNH HAI VIỆC'      docs/LESSONS_3D.md   # 7 lần một trường/bảng gánh hai việc
grep -n 'PHÉP PHÁ\|THỬ NGƯỢC' docs/LESSONS_3D.md # vì sao một phép phá không nổ
grep -n 'sweep-score\|ngưỡng mắt 12' docs/LESSONS_3D.md  # cổng không-trôi 15 kỷ
grep -n 'mái\|mặt đường\|địa hình\|mặt nước\|cư dân\|khu phố' docs/LESSONS_3D.md
```

Năm luật cô đọng nhất, giữ lại đây vì chúng áp cho **mọi** loại task chứ không riêng 3D:
1. **Nghi CÔNG CỤ ĐO trước, nghi mã sau** — đã 28 lần công cụ tự chế nói dối.
2. **Một con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ** (chữ "hơn" trong chú thích).
3. **Một bài test chưa từng thấy đỏ thì chưa phải test** — và phải hỏi *nó đỏ khi gỡ CÁI GÌ*.
4. **Một câu tự trấn an phải được kiểm như một con số.**
5. **Trước khi tin một tỉ lệ, hỏi mẫu số có lẫn thứ không thuộc câu hỏi không.**

## AI Coach + tầng engine → chi tiết ở **`docs/AI_COACH.md`**

App có cả một hệ "huấn luyện viên" và engine game thuần. Toàn bộ chi tiết Gemini (chuỗi model,
`tier: 'deep'`, timeout 28s, lưới chống-bịa 6 lớp, CoachChat/CoachOffline/CoachNudge,
cron `coach-digest`, tầng số liệu `buildAnalystContext`) nằm ở `docs/AI_COACH.md`.

Ba điều bắt buộc nhớ, giữ lại đây:
- ⚠️ **CHỈ MỘT ENGINE = GEMINI (đám mây)** — đã gỡ hẳn Qwen/WebLLM 2026-06-24. Thiếu
  `GEMINI_API_KEY` ở Vercel env ⇒ Coach KHÔNG chạy (không còn lưới on-device dự phòng).
- ⚠️ Mọi thay đổi Coach phải qua lưới chống-bịa; điểm số in ra bởi `src/engine/coach/eval.test.js`
  (**FPR = 0**, BẮT ≥ 90%). Tụt điểm = guard bị nới tay.
- ⚠️ Test API mới LUÔN đặt trong `api/_tests/` (xem mục Vercel 12 Functions ở trên).

- **Engine game thuần** tách khỏi state: công thức ở `src/engine/gameMath.js` + `constants.js`, state ở `src/store/gameStore.js`. Sửa công thức → sửa ở engine, đừng nhồi vào store. Dữ liệu ngoài (Supabase/import) PHẢI đi qua `normalizePersistedGameState`.
- ⚠️ Điểm nóng: `completeFocusSession` trong `gameStore.js` rất dài (~760 dòng) — sửa cẩn thận, dễ sinh bug "dùng giá trị cũ".
- Luôn `npm test` trước khi commit + `npm run build`. ⚠️ **`npm test` NAY CHẠY HAI LƯỢT (2026-08-21)**: `test:fast` (mọi bài nhanh — **số bài thật nằm ở dòng cuối của LƯỢT NÀY**, và nó phải hiện `# skipped 1`) rồi `test:cross` (phép đối chiếu chéo `scene-tri` ↔ `plinth-tri`, **~25 giây** sau ADR-048 — trước đó là 70–90 giây tuỳ tải máy, đo được 68,8 · 85,9 · 86,3 giây ở ba lượt, và **chính con số ấy là thứ đã chỉ ra một hồi quy hiệu năng mà không cổng nào canh**; nó **TỰ IN thời gian chạy** thay vì để tài liệu hứa một con số cố định — xem `TECH_DEBT #70`). Muốn xem nhanh số bài → `npm run test:fast`. ⚠️ **Vế chậm được bỏ qua bằng BIẾN MÔI TRƯỜNG `DC_CROSS_SLOW`, KHÔNG bằng `--test-skip-pattern`** — đã thử cờ ấy và nó **không ăn** (Node có liệt kê cờ, không báo lỗi gì, mà bài chậm vẫn chạy ⇒ lượt "nhanh" âm thầm gánh thêm 70 giây). Một cờ bị bỏ qua trong im lặng là đúng thứ dự án này đã bị cắn nhiều lần; cách hiện tại thì `# skipped 1` HIỆN RA, nên nếu ngày nào nó thôi bỏ qua thì con số ấy tự nói. ⚠️ **Glob test ĐÃ ĐỔI 2026-08-12** (`TECH_DEBT #10`): từ danh sách viết tay từng thư mục MỘT CẤP → nay là `'electron/**/*.test.js' 'src/**/*.test.js' 'api/**/*.test.js'`, **để trong dấu nháy đơn** cho chính `node --test` mở rộng (`sh` không có globstar, bỏ nháy là hỏng). Trước đây test đặt trong thư mục con (`src/components/city/…`) sẽ **im lặng không bao giờ chạy** — nay đặt cạnh file nguồn ở bất kỳ độ sâu nào cũng chạy, đúng quy ước ở `PROJECT_STRUCTURE.md`. Thêm thư mục mới KHÔNG cần sửa `package.json` nữa. Công cụ mắt-soi bảng số liệu model nhận: `node --import ./scripts/register-esm-loader.mjs scripts/coach-sample.mjs` (dựng lịch sử mẫu ~24 giờ + in `buildAnalystContext`). Điểm số chống-bịa in ra bởi `src/engine/coach/eval.test.js`.

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
  - ⇒ **Quy tắc cho MỌI AI (Đàm chốt lại 2026-08-22: *"sau này tự deploy, tôi không có việc gì phải tự deploy cả"*)**: làm xong thứ Đàm cần THẤY trên máy thật mà đang ở nhánh phụ → **TỰ gộp vào `main` rồi push, KHÔNG hỏi**. "Deploy" nghĩa là tới được `pomodoro-dc.vercel.app`, KHÔNG phải "đã push lên GitHub" — nhánh phụ = code đã an toàn trên GitHub, KHÔNG có nghĩa là đã lên production, nên dừng ở nhánh rồi báo "đã deploy xong" là báo sai.
    - **CHỈ DỪNG LẠI HỎI** khi việc gỡ xung đột đòi phải **vứt bỏ công của một phiên khác**. Xung đột gỡ được mà không mất gì thì cứ gỡ rồi đi tiếp.
    - **VẪN PHẢI BÁO RÕ đã đưa lên production những gì NGOÀI phần việc của mình.** Nhánh phụ thường mang theo commit của các phiên khác chưa từng lên production (lần 2026-08-22: 11 commit Phase 13–14 của phiên khác đi kèm 2 commit của phiên đang làm). Đàm có quyền biết mình vừa nhận thêm những gì — im lặng chuyện đó là giấu phạm vi thay đổi.
    - Push xong **vẫn phải xác nhận Vercel "Ready"** (gạch đầu dòng ngay dưới).
  - Cách gộp an toàn: `git fetch origin main` → kiểm `git merge-base --is-ancestor origin/main <nhánh>` (trả về true là gộp thẳng được, không xung đột) → `git checkout -B main origin/main && git merge --ff-only <nhánh> && git push origin main`.
- ⚠️ **Push xong PHẢI mở tab Deployments xác nhận "Ready"** — code xanh + commit thành công KHÔNG có nghĩa là đã thực sự lên production (xem sự cố `8ee264d` ở mục "Vercel Hobby: giới hạn 12 Serverless Functions").

## 🔌 MCP — giữ cái nào (đo 2026-09-06)

Cấu hình MCP nằm ở **tài khoản claude.ai, KHÔNG nằm trong repo** (không có `.mcp.json`) ⇒ AI không
tắt hộ được. Đàm tự tắt bằng `/mcp` trong Claude Code, hoặc claude.ai → Settings → Connectors.

| Giữ ✅ | Vì sao |
|---|---|
| **github** (55 tool) | **Bắt buộc** — phiên web KHÔNG có `gh` CLI, mọi thao tác PR/issue/CI đi qua đây |
| **Claude Code Remote** (22) | Hệ thống phiên web: `add_repo`, `send_later` (tự hẹn giờ theo dõi PR) |
| **ccd_session** (2) | Hệ thống |

| Tắt ❌ | tool |
|---|---|
| TickTick · Notion · Canva · Gmail · Google Calendar | 162 tool, **0 liên quan tới code dự án này** |

⚠️ **Nhưng đừng kỳ vọng tiết kiệm token ở đây: đo ra chỉ ≈1.780 token = 1% vấn đề.** Lý do:
harness **hoãn nạp** (defer) các MCP không dùng — chỉ giữ cái TÊN (~11 token), bỏ toàn bộ mô tả.
Thứ tốn thật là MCP nạp **schema đầy đủ** (Claude Code Remote ≈11.400 token). Lý do nên tắt là để
**đỡ nhiễu khi chọn công cụ** và tránh thông báo rớt kết nối giữa phiên, KHÔNG phải để tiết kiệm.

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
