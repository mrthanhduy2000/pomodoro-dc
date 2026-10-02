# ARCHITECTURE_DECISIONS — rotated 2026-10-02 (ADR-076)

> 15 entries moved VERBATIM out of `ARCHITECTURE_DECISIONS.md` by `node scripts/doc-budget.mjs --rotate ARCHITECTURE_DECISIONS.md`. Nothing was rewritten or deleted. Index without reading: `node scripts/doc-budget.mjs --map docs/archive/ARCHITECTURE_DECISIONS_2026-10-02.md`

---

## ADR-075 — Retrieval architecture: freeze closed knowledge, cap every file at one context window, guard it

- **Date**: 2026-09-06 (night, same day as ADR-073/074)
- **Context**: after ADR-073 (splitting `CLAUDE.md`) and ADR-074 (English), the always-loaded cost
  was down to ~10,000 tokens/session. The remaining waste was no longer *storage* but **retrieval**:
  `TECH_DEBT.md` 252,634 tokens (126% of a 200k window), `ARCHITECTURE_DECISIONS.md` 227,878 (114%),
  `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md` 282,237 (141%). Three files could not be read in one
  session at all, and every `grep` waded through knowledge that was already closed history.
- **Root problem**: the docs mixed **active work** with **closed history** in the same file. A closed
  debt entry and a superseded ADR are consulted rarely, but were being paid for on every lookup. The
  `cat`-ban written in ADR-073 reduced accidents; it did nothing about the cost of legitimate reads.
- **Options considered**:
  1. Leave it; rely on the `cat`-ban and `grep` discipline.
  2. Delete or summarise closed entries and old ADRs.
  3. Freeze closed knowledge into `docs/archive/`, keep a full one-line index in the active file,
    and add guards so no file can exceed one context window again.
- **Why the others were rejected**: (1) leaves three files literally unreadable in one session, and
  the project rule "a threshold with no guard is a funnel" applies to `grep` discipline too.
  (2) violates the project's own rule *"never delete an old ADR, even when a later decision reverses
  it"*, and every closed debt entry carries the root-cause analysis that stops the same bug returning.
- **Chosen solution**: option (3).
  - `TECH_DEBT.md`: 40 closed entries → `docs/archive/TECH_DEBT_CLOSED_2026-09-06.md`, verbatim, all
    14 fields intact. Active file keeps a 40-line index (number + title) pointing there.
    Stale threshold snapshots (13 accumulated status blocks, 28,849-char header) also moved: the
    header is now 1,858 chars, so `head -60` finally returns the rules instead of old counts.
    **435,288 → 248,959 chars (252,634 → 144,492 tokens; 126% → 72% of a window).**
  - `ARCHITECTURE_DECISIONS.md`: 50 oldest ADRs → `docs/archive/ADR_ARCHIVE_001-050.md`, verbatim,
    with a 50-line index in the active file. The 25 newest stay hot.
    **392,634 → 159,441 chars (227,878 → 92,537 tokens; 114% → 46%).**
  - `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md` split at a date boundary into two parts
    (141% → 70% and 71%).
  - `START_HERE.md` de-duplicated against `CLAUDE.md`: three of its six "laws" and its whole lookup
    table were restatements of rules `CLAUDE.md` owns.
  - Three new guards, each adversarially break-tested: **canonical rule** (no auto-loaded file may
    restate a rule another owns) · **pointer** (every `.md` reference must resolve) ·
    **context-window ceiling** (no reference doc above 200k estimated tokens).
- **Trade-off**: looking up a closed debt or an old ADR now costs one extra hop through an index.
  That is the right trade: the index carries the title, which answers most lookups on its own, and
  the cost is paid only by sessions that actually need cold knowledge — instead of by every session
  that greps the file.
- **⚠️ Measurement lesson (the third this day)**: the first corpus measurement reported the whole
  `.md` corpus shrinking by 665,806 chars, which would have meant catastrophic data loss. It was the
  TOOL: the newly created archives were untracked, and `git ls-files` silently excluded them. Re-run
  over the working tree the corpus is **+14,294 chars** (indexes and archive headers) — nothing lost.
  Same family as ADR-074's diluted ratio: *the denominator contained something outside the question*.
- **Fifth finding — the biggest repeated cost was not a document at all.** `npm test` prints one line
  per test: measured on 1,609 tests, `test:fast` emits **9,802 lines / 408,514 chars ≈ 230,000
  tokens** — a single validation run costs more than a whole 200k context window, and 23× the entire
  always-loaded context it was validating. Added **`npm run test:quiet`**: the `dot` reporter to
  stdout plus a `tap` reporter to a temp file, from which only the summary is printed, so the
  documented `# skipped 1` signal survives and failures still print in full.
  **2,132 chars, −99.5%.** This is the highest-ROI change of the day and it was invisible while only
  documents were being audited — token efficiency is a property of the whole operating model
  (tool output, command choice, reporters), not just of markdown.
- **Second pass, same day**: `CHANGELOG.md` 266,956 → 56,535 chars (78% → 16% of a window; 80% of its
  bulk was one past month) and `BAN_GIAO.md` 240,561 → 58,013 chars / 3,109 → 711 lines — the latter
  simply enforcing `PHASE_RULES.md` §5, a rule that had existed unenforced while the file tripled.
  A sixth guard (**rotation**) now fails `npm test` if either grows past 120,000 chars, so the rule
  no longer depends on someone remembering it.
- **Third pass — split by SUBSYSTEM, not by status.** `TECH_DEBT.md` still held 63 "open" entries, but
  classifying them showed only **7 were actionable**: **52 belong to the 3D city**, a finished black
  box Đàm forbids touching, and were **87% of the file** (218,861 of 250,190 chars). Three more had
  titles saying ĐÃ ĐÓNG yet were never archived. The 52 moved to `docs/TECH_DEBT_3D.md` — **still
  open, relocated by subsystem** so a `grep` for live work stops wading through frozen work — and the
  file went **250,190 → 43,559 chars (−83%)**. ⚠️ The Maintenance Sprint threshold must now be judged
  on the actionable list, not the total: a frozen subsystem cannot be worked on, and counting it was
  making the threshold meaningless.
- **Also**: `START_HERE.md`'s UI invariants (~4,000 chars) moved to `docs/UI_INVARIANTS.md` behind an
  imperative pointer — every session was loading them before knowing whether the task touched the UI.
  Stale routing repointed in `AI_ONBOARDING.md`, `AI_HANDOFF_KNOWLEDGE.md` and `ARCHITECTURE.md`,
  which all still told a new session to read `BAN_GIAO.md` in full first.
- **Impact**: largest single file 486,294 → 266,956 chars. No file exceeds a context window.
  Always-loaded: 10,171 → 9,942 tokens/session. `npm test` 1,605 → 1,609 tests.
- **Review conditions**: when an active reference doc passes ~50% of a window again (the warning
  fires automatically), or when a closed entry needs reopening — move it back out of the archive
  rather than duplicating it.

## ADR-074 — Tài liệu tự-nạp viết bằng TIẾNG ANH, có cổng canh ngôn ngữ đo theo ĐOẠN

- **Ngày**: 2026-09-06 (tối, cùng ngày ADR-073)
- **Bối cảnh**: sau ADR-073, `CLAUDE.md` còn 16.503 ký tự ≈ 9.600 token/phiên. Đàm yêu cầu tiếp:
  *"chuyển thành tiếng Anh đi… khi giao tiếp với tôi thì sử dụng tiếng Việt để tiết kiệm token"*.
  Hệ số đo được của dự án: tiếng Việt **1,723 ký tự/token**; tiếng Anh khoảng **4** (con số phổ biến
  của BPE, **CHƯA đo được trong phiên này** — `tiktoken` cần tải bảng BPE qua mạng và proxy chặn).
- **Vấn đề gốc**: cùng một ý, bản tiếng Việt tốn ~2,3 lần token. Với các file **tự nạp mỗi phiên**,
  chi phí ấy nhân với SỐ PHIÊN. Đây là khoản duy nhất trong ngân sách token mà việc đổi ngôn ngữ
  cắt được mà không mất một chữ nội dung nào.
- **Phương án cân nhắc**:
  1. Dịch TOÀN BỘ 2,6 triệu ký tự tài liệu sang tiếng Anh.
  2. Không dịch gì; chỉ tiếp tục tách file.
  3. Dịch đúng phần bị nhân với số phiên (4 file tự-nạp + 2 file `docs/` hay mở), phần kho tra cứu
     giữ tiếng Việt và chuyển dần khi đụng tới.
- **Lý do loại bỏ**: (1) tốn ~700.000 token output cho MỘT lần, và quan trọng hơn là rủi ro **mất
  tri thức** — mỗi mục trong `docs/LESSONS_3D.md`/`TECH_DEBT.md` là một phase đã trả giá, đúng thất
  bại `AGENTS.md` 2026-07-31 (bản dịch máy móc trôi khỏi bản gốc sau 5 ngày, mất nguyên một mục).
  (2) bỏ qua khoản tiết kiệm lớn nhất còn lại mà không có lý do kỹ thuật nào.
- **Giải pháp được chọn**: phương án (3).
  - Dịch + tái cấu trúc: `CLAUDE.md` · `START_HERE.md` · `PHASE_RULES.md` · `AGENTS.md` ·
    `docs/GOVERNANCE.md` · `docs/OPERATIONS.md`. Bốn file tự-nạp: **25.702 → 10.075 token (−61%)**.
  - **Cổng canh ngôn ngữ** trong `npm test`: một đoạn tiếng Việt lọt vào file tự-nạp = test ĐỎ.
  - Ranh giới ngôn ngữ ghi thành BẢNG trong `CLAUDE.md` để không sinh mâu thuẫn mới: file tự-nạp +
    2 file `docs/` = tiếng Anh (có cổng) · kho tra cứu = phần cũ giữ tiếng Việt, phần MỚI viết tiếng
    Anh · **báo cáo cho Đàm = tiếng Việt**.
- **⚠️ Bài học đắt nhất của quyết định này — cổng canh đầu tiên KHÔNG NỔ khi thử phá.**
  Bản đầu đo tỉ lệ ký tự tiếng Việt trên **TOÀN FILE**. Chèn một đoạn tiếng Việt vào `CLAUDE.md` chỉ
  đẩy tỉ lệ từ 0,21% lên **0,59%** — bị 15.000 ký tự tiếng Anh pha loãng, không ngưỡng nào bắt nổi.
  Đúng luật *"trước khi tin một tỉ lệ, hỏi mẫu số có lẫn thứ không thuộc câu hỏi không"*: câu hỏi là
  *"có ĐOẠN nào viết bằng tiếng Việt không"*, nên mẫu số phải là một ĐOẠN, không phải cả file.
  Bản sửa quét theo đoạn ≥200 ký tự. Ngưỡng **8%** chọn từ số đo thật: đoạn tiếng Anh có trích dẫn
  nguyên văn lời Đàm cao nhất **4,21%**; đoạn tiếng Việt thuần **13,95–15,69%** — biên gần 2 lần cả
  hai phía. Bài test kèm một assert đòi ngưỡng phải nằm GIỮA hai con số ấy, để phiên sau không nới
  ngưỡng cho tiện.
- **⚠️ Bài học thứ hai — cổng chống-mất-luật quá giòn.** Nó so chuỗi thô, nên báo mất
  *"Composition over Duplication"* chỉ vì markdown ngắt dòng giữa hai từ. Đã sửa để chuẩn hoá khoảng
  trắng trước khi so — sửa CÔNG CỤ ĐO, không sửa văn bản cho vừa công cụ.
- **Trade-off**: (a) Đàm không đọc trực tiếp được 6 file này nữa — chấp nhận được vì anh nói rõ
  *"có thể sử dụng toàn bộ là tiếng Anh luôn"*, và mọi báo cáo vẫn là tiếng Việt. (b) Kho tra cứu
  thành song ngữ trong giai đoạn chuyển tiếp; bảng ranh giới trong `CLAUDE.md` là thứ giữ cho nó
  không thành mớ hỗn độn. (c) Hệ số tiếng Anh = 4 **chưa đo được** ⇒ mọi con số token tiếng Anh
  trong tài liệu là ƯỚC LƯỢNG; phép kiểm thật là Đàm gõ `/context` ở phiên mới và đọc "Memory files".
- **Ảnh hưởng**: mỗi phiên gánh **41.000 ký tự ≈ 10.200 token = 5,1% cửa sổ 200k** (trước ADR-073:
  riêng `CLAUDE.md` đã 21.600 token). `docs/OPERATIONS.md` 9.160 → 4.469 token ·
  `docs/GOVERNANCE.md` 7.382 → 3.287 token. Test 1.602 → 1.605 bài.
- **Điều kiện xem lại**: khi đo được hệ số tiếng Anh thật (nếu lệch >20% so với 4,0 thì cập nhật
  `CHARS_PER_TOKEN_EN` và mọi con số dẫn xuất); hoặc nếu Đàm cần tự đọc một trong 6 file ấy thường
  xuyên; hoặc khi kho tra cứu đã chuyển đủ sang tiếng Anh để bỏ hẳn ranh giới song ngữ.

## ADR-073 — Ngân sách token của TÀI LIỆU: tách file + cổng canh bằng test, không nới trần

- **Ngày**: 2026-09-06 (chiều)
- **Bối cảnh**: Đàm gửi ảnh chụp `/context` — cửa sổ ngữ cảnh 699,8k/1M (70%), trong đó `Messages`
  chiếm **624,7k = 62,5%** còn `CLAUDE.md` chỉ 21,6k = 2,2%. Yêu cầu: *"tối ưu token nhất nhưng vẫn
  đem ra output hiệu quả nhất"*. Đo lại toàn bộ tài liệu: 18 file `.md` = **2.650.448 ký tự ≈ 1,54
  triệu token = 769% cửa sổ 200k**. `TECH_DEBT.md` một mình là 250k token (125% cửa sổ 200k).
- **Vấn đề gốc**: thủ phạm KHÔNG phải file tự-nạp mà là **kho tra cứu bị `cat`**. Một lệnh
  `cat TECH_DEBT.md` nổ cửa sổ 200k trong MỘT lượt; đó là cách `Messages` leo tới 62,5%. Đồng thời,
  ba trần đã ghi trong tài liệu (`CLAUDE.md` 40.000 · `START_HERE.md` 20.000 · quy tắc "3 vòng gần
  nhất") **chỉ tồn tại dưới dạng câu chữ, không có gì canh** — `START_HERE.md` đã âm thầm vượt trần
  của chính nó (20.200/20.000) và giữ 4 vòng thay vì 3, không phiên nào biết. Thêm ba mâu thuẫn
  làm phiên sau đốt token hoặc làm sai: `AGENTS.md` bảo Codex *"đọc `BAN_GIAO.md` toàn văn"*
  (**134k token** ngay câu thứ hai của phiên) trong khi `PHASE_RULES.md` §5 nói *"chỉ đọc 60 dòng
  đầu"*; `PHASE_RULES.md` §9 ghi *"Không tự gộp `main`"* trong khi `CLAUDE.md` + `START_HERE.md`
  ghi *"TỰ gộp `main`, KHÔNG hỏi"*; và hai bản báo cáo 11 mục chồng nhau (Báo cáo bàn giao +
  TECHNICAL ADVISOR REPORT) tốn ~2.500 token **output** mỗi task để nói phần lớn cùng một chuyện.
- **Phương án cân nhắc**:
  1. Nén văn bản: viết lại tài liệu cho súc tích, xoá phần dài dòng.
  2. Nới trần cho khớp thực tế (40.000 → 50.000) và chấp nhận chi phí.
  3. Tách file theo chủ đề + đặt trần có **cổng canh bằng test thật** + cấm `cat` kho tra cứu.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì tri thức trong tài liệu này là thứ đắt nhất dự án
  — mỗi mục là một phase đã trả giá; nén văn bản là con đường ngắn nhất tới việc **đánh mất một luật
  vận hành**, đúng thất bại `AGENTS.md` 2026-07-31 (bản sao trôi khỏi bản gốc sau 5 ngày, mất nguyên
  mục "3 cái bẫy menu bar"). (2) bị loại vì nới trần là *chữa cái nhiệt kế* — và trần cũ 40.000 ký tự
  vốn đã tương đương 21,6k token/phiên, tức bản thân con số ấy mới là vấn đề chứ không phải việc
  chạm nó.
- **Giải pháp được chọn**: phương án (3), lặp lại đúng mẫu hình đã thành công sáng cùng ngày (tách
  `docs/LESSONS_3D.md` + `docs/AI_COACH.md`, giảm 190.700 → 21.600 token mà **không xoá một chữ nào**):
  - Tách `CLAUDE.md` → `docs/GOVERNANCE.md` (Governance Protocol + AI Engineering Playbook, nguyên
    văn) + `docs/OPERATIONS.md` (hạ tầng · Vercel 12 Functions · sync/CAS · Web Push · Electron tray ·
    deploy · MCP, nguyên văn). `CLAUDE.md` giữ lại LUẬT ở dạng một dòng + con trỏ: **37.220 → 16.310
    ký tự (−56%)**, 21.600 → 9.468 token.
  - `scripts/doc-budget.mjs` + `scripts/docBudget.test.js`: trần trở thành **cổng canh chạy trong
    `npm test`**, đỏ khi vượt. Đo bằng **ký tự Unicode** (`String.length`), KHÔNG bằng `wc -c` —
    tiếng Việt có dấu là 2–3 byte/ký tự nên `wc -c` thổi phồng ~21% và trong chính phiên này đã suýt
    cho kết luận sai *"CLAUDE.md vượt trần 40.000"* (thật ra 37.220 ký tự / 45.011 byte).
  - Mục "NGÂN SÁCH TOKEN" đứng ĐẦU `CLAUDE.md` với bảng "file nào cấm `cat`" — vì luật rẻ nhất là
    luật ngăn một lệnh 250k token, không phải luật tiết kiệm 2k token.
  - Gộp hai báo cáo 11 mục thành MỘT bảng chọn theo loại task (5 dòng cho việc gọn · 11 mục cho
    kiến trúc/hạ tầng/sự cố).
- **Trade-off**: (a) tri thức nay nằm xa hơn một bước — phiên nào cần quy trình hay chi tiết hạ tầng
  phải mở thêm một file; đổi lại mọi phiên KHÔNG cần chúng thì không trả tiền. (b) Trần cứng sẽ đỏ
  khi `START_HERE.md` nhận vòng mới (đang ở 91%) — đó là **hành vi mong muốn**: nó buộc phiên sau
  đẩy vòng cũ sang `docs/archive/`, đúng luật vốn có mà trước đây không ai thi hành.
- **Ảnh hưởng**: mỗi phiên gánh 44.284 ký tự ≈ **25.702 token = 12,9% cửa sổ 200k** cho toàn bộ
  4 file bắt buộc (trước: `CLAUDE.md` một mình đã 21.600). Test 1.597 → **1.602 bài**.
- **Điều kiện xem lại**: khi Claude Code đổi cơ chế nạp `CLAUDE.md` (ví dụ cho phép nạp một phần),
  hoặc khi hệ số 1,723 ký tự/token đo lại thấy lệch >10%, hoặc khi `docs/GOVERNANCE.md` /
  `docs/OPERATIONS.md` tự phình quá 30.000 ký tự (lúc đó tách tiếp, đừng nén).

## ADR-072 — Tray menu bar: realtime KHÔNG được là nguồn cập nhật DUY NHẤT, luôn cần một lưới poll dự phòng

- **Ngày**: 2026-09-06
- **Bối cảnh**: Đàm báo (kèm ảnh) menu bar Mac không hiện đếm ngược dù web app đang chạy phiên thật
  — *"đã bị rất nhiều lần"*. `electron/main.js` chỉ gọi `fetchTimerLive()` (đọc REST một lần) lúc
  khởi động, sau đó phó thác 100% cho kênh Supabase Realtime (`postgres_changes`) để cập nhật
  `timerData`. Comment đầu file ghi "Polls Supabase timer_live table every 3 seconds" nhưng
  `git log -p` xác nhận dòng polling đó **CHƯA BAO GIỜ tồn tại** trong lịch sử file — một lời hứa
  chưa từng được giữ.
- **Vấn đề gốc**: kênh realtime là một WebSocket có thể ngắt lặng lẽ (Mac ngủ/thức, đổi WiFi, socket
  chết) mà không tự phát lại các sự kiện đã lỡ trong lúc ngắt. Với một app nền chạy cả ngày trên
  laptop, việc "ngủ rồi thức" xảy ra nhiều lần/ngày ⇒ `timerData` kẹt ở trạng thái cũ VĨNH VIỄN cho
  tới khi Đàm tự khởi động lại app — đúng khớp triệu chứng "lặp lại nhiều lần" mà không sửa gốc lần
  nào từng đứng vững.
- **Phương án cân nhắc**:
  1. Theo dõi trạng thái kênh realtime (`.subscribe((status) => …)`) và tự resubscribe/refetch khi
     thấy `CLOSED`/`CHANNEL_ERROR`.
  2. Thêm polling định kỳ độc lập với sức khoẻ kênh realtime, cộng thêm refetch ngay khi
     `powerMonitor` báo Mac vừa thức dậy.
  3. Không sửa — dặn Đàm tự khởi động lại app khi thấy mất đếm ngược.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì hành vi callback trạng thái của supabase-js
  realtime không ổn định giữa các phiên bản và khó kiểm chứng trong CI (main.js vốn không mock
  được `electron`/`@supabase/supabase-js` để viết test), tức lại thêm một chỗ "tự tin nhưng chưa
  từng đỏ" — đúng bẫy dự án đã cắn nhiều lần ở mảng 3D; (3) bị loại vì đây là sửa triệu chứng, và
  Đàm chính là non-coder phải chịu áp lực nhớ việc vận hành thay vì phần mềm tự chữa.
- **Giải pháp được chọn**: phương án (2) — mô phỏng ĐÚNG mẫu hình dự án đã dùng cho push notification
  (`ARCHITECTURE.md` mục 4: "Đường chính tức thời" + "Đường dự phòng định kỳ"): realtime vẫn là
  đường chính (độ trễ thấp), `setInterval(fetchTimerLive, TIMER_LIVE_POLL_INTERVAL_MS = 5000)` là
  lưới an toàn tự chữa không phụ thuộc trạng thái kênh, và `powerMonitor.on('resume', fetchTimerLive)`
  rút ngắn thời gian phục hồi ngay sau khi Mac thức dậy thay vì chờ hết chu kỳ poll. Gộp luôn logic
  phát hiện "phiên vừa hoàn thành" (báo Notification) vào một hàm dùng chung `applyTimerLiveUpdate`
  cho cả 2 nguồn — tránh lặp lại đúng lỗi này lần nữa cho nhánh thông báo.
- **Trade-off**: thêm một request REST mỗi 5 giây tới Supabase (rất nhẹ, cùng bảng `timer_live` chỉ
  1 dòng `singleton`) để đổi lấy việc KHÔNG BAO GIỜ kẹt liên tục quá 5 giây (hoặc tới lúc Mac thức
  dậy) dù kênh realtime có chết theo bất kỳ cách nào.
- **Ảnh hưởng**: `electron/main.js` không còn nơi nào giả định realtime là nguồn DUY NHẤT của sự
  thật — mọi cập nhật tray PHẢI đi qua `applyTimerLiveUpdate`, đừng viết thêm một nhánh cập nhật
  `timerData`/`prevIsRunning` riêng mà bỏ qua hàm này.
- **Bài học đi kèm**: một dòng comment mô tả hành vi ("polls every 3 seconds") không phải bằng
  chứng hành vi đó tồn tại — `git log -p` mới là bằng chứng; đọc code, đừng đọc lời hứa của code.
- **Điều kiện xem xét lại**: nếu `main.js` được tách thành module thuần có thể mock `electron`/
  `supabase-js` để test, có thể bổ sung theo dõi trạng thái kênh (phương án 1) làm lớp giảm độ trễ
  thêm — nhưng polling vẫn PHẢI giữ làm lưới an toàn cuối cùng, không thay thế.

---

## ADR-071 — THỐNG KÊ TRẢ LỜI, KHÔNG TRÌNH BÀY; ĐÓNG #99: BA ĐỒNG TIỀN NGỦ THÔI ĐƯỢC CỘNG; CHỮ TRONG SAVE ĐỌC TỪ BẢNG

- **Ngày**: 2026-09-06 (vòng 36, ngay sau ADR-070)
- **Trạng thái**: đã áp dụng. Không đụng Thành phố (`engine/city3d/`, `components/city/render3d/`);
  ADR-007 nguyên. KHÔNG đổi hình dạng JSONB đồng bộ: các khoá `resources` · `research` ·
  `resourcesRefined` · `tinhThe` · `forgiveness` vẫn nằm trong save, chỉ THÔI được ghi.
- **Bối cảnh**: lệnh Đàm vòng 36 — *"Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn
  vào UX/UI. TOÀN QUYỀN"*, mặt trận chính là màn Thống kê: *"Thống kê phải TRẢ LỜI, chứ không TRÌNH
  BÀY. Mở ra là thấy ngay, không phải bấm tab con nào: (a) tôi có đang khá lên không; (b) khi nào tôi
  mạnh nhất; (c) làm gì tiếp — đúng một gợi ý, bấm được"*, kèm luật *"một con số không có mẫu số thì
  không phải mục tiêu"* và *"Xoá nhiều là tốt"*. Nếu còn sức: đóng nốt `TECH_DEBT #99`, rồi tự quyết ba
  câu hỏi mục 9 của vòng trước. Luật tiết kiệm token của vòng này: không chạy công cụ đo Thành phố,
  không bảng số trước/sau nhiều cột, ảnh nghiệm thu ≤6 tấm 390px của đúng màn vừa sửa.
- **Vấn đề**:
  · `StatsDashboard.jsx` **3.792 dòng** (23% mã giao diện), 5 tab · 6 kỳ · 4 biểu đồ · 2 bản đồ nhiệt;
    ở 390px nếp gấp đầu là HAI HÀNG NÚT, và ba câu Đàm hỏi nằm rải ở ba tab khác nhau — không câu nào
    được trả lời ở nếp gấp đầu. Phần lớn con số ở đó không có mẫu số ("Giờ 12,4" — so với gì?).
  · `#99`: sau ADR-069/070 tài nguyên · RP · tinh luyện không còn cổng tiêu, nhưng `completeFocusSession`
    vẫn tính và cộng chúng mỗi phiên, huỷ phiên vẫn trừ tài nguyên và tiêu lượt «Sự Tha Thứ»,
    `cancelCrafting` vẫn hoàn 50% nguyên liệu, hai nhiệm vụ ngày «Kiếm 80/160 RP» vẫn trong bộ, thẻ
    tổng kết vẫn in «+18 tài nguyên · +50 RP · Rương Lớn». ~1.100 dòng phục vụ một kinh tế không ai thấy.
  · Save còn hai chỗ chép CHỮ của bảng: di vật (đã sửa ADR-070) và **khủng hoảng kỷ** (`eraCrisis.name/
    icon/description` + nhãn hai lựa chọn chép từ `ERA_CRISES` lúc kích hoạt) — bảng đổi chữ thì save
    kể chuyện cũ trong im lặng.
- **Phương án cân nhắc**:
  · *Thống kê* — (A) giữ 5 tab, thêm tab «Tổng kết» đứng đầu: bác — vẫn phải bấm, vẫn 3.792 dòng.
    (B) rút còn 3 tab: bác — vẫn TRÌNH BÀY, mỗi tab một bảng số. **(C — chọn)** ba thẻ trả lời ở đầu,
    dải «Điều đáng chú ý» giữ nguyên, sổ tra cứu (Nhật ký · Ghi chú) GẤP xuống dưới — không giấu, chỉ
    gấp; xoá thẳng Tổng Quan · Chiều Sâu · Phân Loại · bộ chọn kỳ · biểu đồ · bản đồ nhiệt.
  · *So tuần* — (A) trọn tuần trước vs tuần này (như `getWeeklyTrend` của Coach): bác — sáng thứ Ba tuần
    này có hai ngày, tuần trước bảy ⇒ ô đỏ suốt sáu ngày mỗi tuần. **(B — chọn)** tuần này vs CÙNG QUÃNG
    của tuần trước (thứ Hai → đúng giờ này); ngưỡng "giữ nhịp" dùng CHUNG `WEEK_TREND_THRESHOLD_PCT`.
  · *#99* — (A) migration xoá khoá + `normalizePersistedGameState`: bác — đổi JSONB đang tranh chấp CAS,
    và xoá thứ Đàm đã kiếm mà anh chưa xác nhận không tiếc. **(B — chọn)** THÔI GHI, giữ khoá: phép
    cộng/trừ/hoàn/phạt và hai nhiệm vụ RP xoá hẳn, dữ liệu cũ nằm yên; bản ghi lịch sử MỚI không còn
    `resources/rpEarned/refinedEarned`, bản ghi cũ giữ nguyên (Thống kê vẫn đọc được).
  · *Chữ trong save* — (A) chỉ di vật (ADR-070): bác — cùng một lỗi còn nằm ở khủng hoảng kỷ.
    **(B — chọn)** luật chung *"save lưu id + số, CHỮ đọc từ bảng lúc nạp"*: di vật (`withCanonical
    RelicText`) · nhiệm vụ (`normalizeMissionTemplate`, đã có) · khủng hoảng kỷ (`withCanonicalCrisisText`,
    mới) — chỉ làm tươi CHỮ, không đổi `sessions/minMinutes` của thử thách ĐANG chạy.
- **Giải pháp**:
  1. `engine/statsAnswers.js` (THUẦN, +test): `buildWeekComparison` (7 cặp cột thứ Hai→Chủ nhật,
     cùng quãng) · `buildBestWindow` (giờ · độ dài · loại việc, đọc thẳng `buildFocusProfile` — cùng số
     với Coach, Wilson lower bound) · `buildNextAction` (bọc `recommendNextSession`; thiếu dữ liệu vẫn
     là MỘT NÚT chạy được) · `buildStatsAnswers`. Bộ getter giờ VN tách thành `time.vietnamHistoryTimeOpts`
     dùng chung với `useCoachContext` (trước là bản chép tay).
  2. `StatsDashboard.jsx` 3.792 → **294 dòng**: ba `AnswerCard` + `InsightStrip` + «Sổ tra cứu» (hai nút
     có số mục, mặc định gấp). Nút «Bắt đầu N phút · loại» đặt `timerConfig.focusMinutes` +
     `pendingCategoryId` rồi `onNavigate({tab:'focus'})` — App truyền `handleNotificationNavigate`
     (cùng đường với thông báo đẩy); đang có phiên chạy thì chỉ chuyển màn, không đổi đồng hồ.
     `StatsJournal.jsx` · `StatsNotes.jsx` · `statsTheme.js` tách ra nguyên văn (hàng lọc loại việc
     thôi cuộn ngang). Xoá `statsPeriod.js` · `statsFocus.js` (+test), `statsPeriodWiring.test.js`,
     `computeYearGrid` · `computeCategoryStats`, 6 hàm định dạng biểu đồ.
  3. `#99`: `calculateRewards` thôi trả `resources/rpEarned/t2Drop/largeChest` (xoá mục 8–10, hai hàm
     phạt, `rollResourceDrop`, `getActiveResources`); store xoá `mergeResources` + 3 hàm trừ khi xoá
     phiên, khối RP/tinh luyện/Lộc Ban Tặng-tinh-luyện, hệ số kinh tế công trình, phạt huỷ phiên +
     lượt tha thứ, hoàn tiền `cancelCrafting`, nhiệm vụ `researchPoints`; `rewardFeed`/chuỗi thẻ bỏ
     «Rương Lớn» · «+N tài nguyên/RP/tinh luyện» (thẻ phiên thường nói BẬC phiên). `challengeEngine.js`
     bỏ 12 hàm chết của đường thử-thách-bậc/hiến-tế cũ (460 → 219 dòng).
  4. `withCanonicalCrisisText` + `findEraCrisisById` (`challengeEngine.js`), gọi ở
     `normalizePersistedGameState`; test tầng thuần + tầng store (`gameStore.adr071.test.js`).
- **Trade-off**: mất biểu đồ cột theo kỳ, bản đồ nhiệt 16 tuần/365 ngày, tab Phân Loại (kể cả
  `buildCategoryAdvisor` 170 dòng — `#93`), bộ chọn 6 kỳ. Đổi lại: mở màn là thấy câu trả lời, mọi tỉ
  lệ có mẫu số. Mất «Rương Lớn» trên thẻ (một cái rương không còn gì để đựng). Lượt «Sự Tha Thứ» thôi
  bị tiêu — kỹ năng ấy nay chỉ còn vế +XP sau huỷ (ADR-069). Save cũ vẫn mang các khoá tiền ngủ (dữ liệu
  chết, không đọc, không ghi) — migration để dành khi Đàm xác nhận không tiếc.
- **Ba câu tự quyết (mục 9 vòng 35)**: (1) **Chuỗi thẻ GIỮ, chỉ ngắn đi một chip** — thẻ Bước tuần /
  Di vật lên bậc / Kỷ mới chỉ hiện khi việc ấy xảy ra (hiếm), gộp vào thẻ XP là làm thẻ dài ở MỌI phiên
  để tiết kiệm ở vài phiên; (2) **Mốc di vật 20/50 phiên ≥25′ GIỮ** — đo trên fixture 599 phiên (bản
  thật không đọc được từ hộp cát, proxy 403): 19,2 phiên ≥25′/tuần ⇒ trung vị **7,1 ngày** tới bậc 1,
  **17,8 ngày** tới bậc 2; ở nhịp 8 phiên/tuần là ~2,5 và ~6 tuần — đủ chậm để là "lớn lên", đủ nhanh để
  còn nhớ; (3) **Luật chữ-đọc-từ-bảng mở rộng thành luật chung** (xem Phương án).
- **Ảnh hưởng**: 29 file, +464/−5.959 dòng mã (chưa kể tài liệu); `gameStore.js` 5.744 → 5.413,
  `gameMath.js` 2.044 → 1.732. Test mới: `statsAnswers.test.js` (7) · `statsNavClarity.test.js` (viết
  lại, 6) · `challengeEngine.test.js` (+2) · `gameStore.adr071.test.js` (3); characterization test của
  `completeFocusSession`/`cancelFocusSession`/`rewardFeed`/`sessionRewardStory` đổi theo luật mới.
- **Điều kiện xem lại**: Đàm dùng màn Thống kê mới vài tuần — nếu ba dòng «mạnh nhất» vẫn trống (không
  đặt mục tiêu phiên) thì cần một cách khác để có mẫu số, không phải một biểu đồ khác. Migration xoá
  khoá tiền ngủ: chỉ khi Đàm nói không tiếc kho.

## ADR-070 — MỘT CÁI KẾT DUY NHẤT, KHÔNG NÚT NHẬN, KHÔNG MÀN CHẾT: phần thưởng đã đạt thì tự vào, di vật lớn theo phiên, đặc quyền công trình về trục sống

- **Ngày**: 2026-09-06 (vòng 35, ngay sau ADR-069)
- **Trạng thái**: đã áp dụng. Không đụng Thành phố (`engine/city3d/`, `components/city/`, địa hình,
  đường, thực vật, bảng màu, `cityLayout`; hình dạng `craftingQueue`/`buildings`/`cityArchive` giữ
  nguyên từng byte — ADR-007 nguyên). Đảo ngược nốt nửa còn lại của ADR-060 (hộp thoại chi tiết) và
  đóng bốn mục nợ ADR-069 để lại (`#96` · `#98` · `#100`, cập nhật `#99`). Không đổi hình dạng dữ
  liệu đồng bộ; một trường MỚI (`relics[].earnedAt`) được đóng dấu lúc nạp cho save cũ.
- **Bối cảnh**: lệnh Đàm *"Tiếp tục làm như prompt trên mà không hỏi lại, cho phép bạn tự quyết định
  mọi thứ và tech debt. Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào UX/UI."*
  Sau ADR-069, đo lại trên chính app: còn **bốn chỗ phần thưởng ĐÃ ĐẠT mà vẫn cách người chơi một
  cái nút hoặc một cánh cửa khoá**:
  · Bước tuần đủ điều kiện đứng chờ nút «Chốt bước» — ở tab Tiến trình, cách màn Tập trung hai cú
    chạm; thưởng trọn ngày đứng chờ nút «Nhận» (ở màn Tập trung VÀ trong chuỗi thẻ). Cả hai là
    đúng loại ma sát ADR-069 vừa gỡ ở bậc/khủng hoảng (`#100`).
  · Tiến hoá di vật đòi **tinh luyện của kỷ ĐÃ QUA** mà tinh luyện chỉ rơi vào kỷ đang chơi ⇒ 14/15
    di vật không bao giờ lên bậc; ba nút «Chưa đủ tài nguyên» đứng đó nói dối nhiều tháng (`#96`,
    ghi "Đàm chọn" — lệnh mới uỷ quyền quyết).
  · 11/15 kỳ quan hứa «giảm giá RP», «rẻ tinh luyện», «giảm thảm hoạ», «mang tài nguyên sang kỷ
    sau»; 2/4 đặc quyền công trình thường trả bằng tinh luyện — toàn đồng tiền đã ngủ sau ADR-069.
    Bảng hợp lệ, test xanh, chỉ có thứ nhận được là không ai thấy (cùng bệnh với ADR-069 mục 6).
  · Một phiên có **HAI cái kết**: chuỗi thẻ (ADR-068) rồi hộp thoại 7 giai đoạn 1.057 dòng khi lên kỷ
    hoặc khi bấm «Xem chi tiết» — hai bản trình bày một `pendingReward`, tiếng mở rương kêu hai lần,
    mỗi trường mới phải nối hai chỗ (`#98`). Hộp thoại ấy chỉ còn hơn ở phần liệt kê ba đồng tiền ngủ.
- **Vấn đề**: mọi thứ trên đều là **khoảng cách giữa "đã đạt" và "đã nhận"** — một nút, một cánh cửa,
  hoặc một màn thứ hai. Tâm lý học thói quen: phần thưởng phải đến NGAY sau hành động và đến MỘT
  LẦN; một nút "Nhận" chỉ hiện khi đủ điều kiện là một nút hầu như không ai thấy, và một cơ chế không
  thể kích hoạt là một lời hứa treo ở đúng chỗ đáng lẽ tạo ham muốn.
- **Phương án đã cân nhắc**:
  - **(A) Giữ nút Nhận nhưng đưa nó lên chuỗi thẻ / thanh tiêu đề**. Loại: vẫn là một việc phải làm
    để lấy thứ đã có; và bấm trong chuỗi thẻ từng làm chuỗi thẻ dựng lại từ đầu (`#98` kèm).
  - **(B) Cho tinh luyện kỷ cũ rơi lại / đổi tinh luyện kỷ mới lấy kỷ cũ** để cứu nút tiến hoá. Loại:
    mở lại một đồng tiền vừa đóng (trái ADR-069); và vẫn là một cánh cửa phải "đủ tiền".
  - **(C) Giữ `LootDropModal` làm màn chi tiết, chỉ gỡ khi lên kỷ**. Loại: hai bản trình bày vẫn tồn
    tại; phần "chi tiết" nay liệt kê toàn đồng tiền ngủ; và Đàm chưa từng được hỏi có bấm nó không —
    lệnh mới uỷ quyền quyết, và quyết là xoá.
  - **(D — đã chọn) Mọi phần thưởng đã đạt TỰ VÀO ngay trong `completeFocusSession` và được KỂ ở
    chuỗi thẻ; di vật lớn theo PHIÊN kể từ lúc nhận; đặc quyền công trình là buff trên ba trục sống;
    chuỗi thẻ là cái kết DUY NHẤT (thẻ «Kỷ nguyên mới» có nút xem thành phố).**
- **Giải pháp**:
  1. **Tự chốt bước tuần + thưởng trọn ngày** (store): `autoClaimWeeklySteps` chốt liền mọi bước đã
     đủ (XP theo ĐÚNG công thức nút cũ, SP thưởng chuỗi, buff Cử Tri/Kế Hoạch Hoàn Hảo đẩy vào hàng);
     thưởng trọn ngày vào ở phiên khép nốt nhiệm vụ cuối (`getDailyMissionAllBonusXP`, cùng hàm). Cả
     hai cộng vào XP PHIÊN (lên cấp tính một lần). ⚠️ Phép ĐỐI CHIẾU với lịch sử mà nút «Nhận» cũ làm
     (`rebuildMissionsFromHistory`) đi theo về `completeFocusSession` — một "3/3" không có lịch sử đỡ
     (sync lệch máy, phiên đã xoá) không được kéo theo một khoản thưởng thật. `pendingReward` kể ba
     tin mới: `dailyBonusXP` · `weeklySteps`/`weeklyChainTitle`/`weeklyBonusSP` · `relicsEvolved`.
     Xoá `claimWeeklyStep` · `claimMissionAllBonus`; `DailyMissions.jsx` không còn nút, chỉ trả lời
     "còn bao xa" (ca nhiệm vụ cuối xong NGOÀI phiên: «cộng ở phiên kế»).
  2. **Di vật lớn theo phiên** — `engine/relicGrowth.js` (thuần): mốc `RELIC_EVOLVE_SESSIONS =
     [0, 20, 50]` phiên ≥`RELIC_EVOLVE_MIN_MINUTES` (25′) đếm TỪ SAU `relic.earnedAt` (phiên nhận
     không tính; phiên trước khi có di vật không tính — nếu không thì người chơi lâu năm nhận là lên
     thẳng Huyền Thoại, chẳng còn gì để chờ); `evaluateRelicEvolutions` chạy sau `newHistory` trong
     `completeFocusSession`, bậc mới áp từ phiên KẾ (buff phiên này đã tính với bậc cũ — cố ý, để
     hai đường đo khớp). Save cũ không có `earnedAt` ⇒ `normalizePersistedGameState` đóng dấu LÚC
     NẠP (đồng hồ bắt đầu hôm nay, không nhảy bậc từ lịch sử cũ). Xoá `evolveRelic` + giá
     `t2Cost`/`t3Cost` + `getRelicEvolutionRefinedCost`/`relicEvolutionCostOf`; `RelicInventory.jsx`
     hiện thanh «N/20 phiên ≥25′ · còn M». Kỳ quan kỷ 15 (`relic_evo_30off`) rút mốc 30%.
     ⚠️ Kèm một lỗi thật ảnh 390px bắt được: save cũ mang BẢN CHÉP label/icon/description/buff của di vật
     từ lúc nhận, nên kho di vật vẫn in «tăng tài nguyên rớt» sau khi ADR-069 đã đổi bảng. Nay
     `withCanonicalRelicText` (cùng file) đọc lại bốn trường ấy từ `ERA_CRISES` lúc nạp — buff thì store
     đã đọc từ bảng tiến hoá từ trước, chữ phải đi cùng đường (một luật một công thức).
  3. **Đặc quyền công trình về trục sống** — `WONDER_EFFECT_REGISTRY` viết lại: 11 kỳ quan → buff
     thụ động `passive: { expBonus | epBonus | comboWindowHours | flatXp, minMinutes? }` (vd kỷ 2
     «+10% XP phiên ≥45′», kỷ 6 «+2h combo», kỷ 10 «+150 XP phiên ≥90′»); 4 luật còn được store đọc
     giữ nguyên id (`streak_cap_plus` · `mission_bonus_20` · `longer_crisis_window` → nay cộng giờ vào
     thử thách kỷ · `relic_evo_30off`). `engine/wonderEffects.js` là nguồn duy nhất
     (`wonderPassiveBuffs` cộng vào `activeBuffs`; `wonderCrisisWindowBonusHours`;
     `wonderRelicEvolveFactor`); gỡ `researchCostOf` · `relicEvolutionCostOf` ·
     `cancelPenaltyWonderMultiplier` cùng 7 helper chép tay trong store. `BUILDING_PERK_REGISTRY`:
     rương ngày/rương sâu trả XP thay tinh luyện; `safety_net` → «phiên bù sau khi huỷ» (+80 XP cho
     phiên kế ≥15′). `rewardAxes.test.js` khoá cả hai bảng (mô tả không được nhắc đồng tiền ngủ; mỗi
     đặc quyền phải có hiệu ứng trên trục sống hoặc là một luật còn được đọc; 15 kỳ quan 15 đặc quyền
     KHÁC nhau).
  4. **Một cái kết** — xoá `LootDropModal.jsx` (1.057 dòng) và mọi cổng của nó ở `OverlayStack`
     (`showLootModal` · `detail === 'loot'` · `pendingEraChanged` · preload). `finishStory` đóng
     phần thưởng KHÔNG ĐIỀU KIỆN. Chuỗi thẻ thêm thẻ **Bước tuần** (`chain`), **Di vật lên bậc**
     (`evolve`), chip «+N EP» ở thẻ +XP (buff EP phải THẤY được), thẻ Nhiệm vụ kể «Trọn ngày +N XP — đã
     cộng» thay nút; thẻ «Kỷ nguyên mới» có nút **«Xem thành phố mới»** (điều hướng tab Thành phố) và
     phát `playEraChange` — tiếng và thông báo lên cấp/lên kỷ chỉ còn kêu MỘT lần.
  5. **Huy hiệu "Kế tiếp"** — `Achievements.jsx`: sau dải hero (nay nói «còn N phút/phiên» thay «gần
     xong rồi»), một khối 4 huy hiệu gần đạt nhất với thanh + mẫu số (goal-gradient); bỏ bộ lọc BẬC
     (bậc đã có trên từng ô); gỡ `AchievementCard` chết (~140 dòng không ai gọi từ 2026-09-02).
  6. **Dọn chữ đồng tiền ngủ** còn nhìn thấy: nhãn «Tinh luyện» ở lịch sử Thống kê → «Phiên sâu»;
     hàng «Tài nguyên» ở hộp Thăng hoa; câu chào onboarding «XP và tài nguyên» → «XP và điểm kỷ
     nguyên»; `engine/buffLabel.js` dịch buff một chỗ cho cả kho di vật lẫn chuỗi thẻ.
- **Trade-off**:
  - Mọi phần thưởng nay đến mà không cần chạm — mất "cú bấm nhận" (một nhịp dopamine nhỏ), đổi lấy
    việc không bao giờ có phần thưởng nằm chờ không ai lấy. Chuỗi thẻ là nơi ăn mừng thay cho nút.
  - Di vật lớn CHẬM và ĐỀU (20 rồi 50 phiên dài) thay vì "mua" — cố ý: tiến hoá thành một mốc tự
    tới, cùng khuôn bậc/thử thách kỷ. Save cũ đếm từ hôm nay, tức người chơi lâu năm không được
    hồi tố — chấp nhận, vì hồi tố sẽ nhảy thẳng bậc cuối và giết chính cơ chế chờ.
  - Không còn màn liệt kê tài nguyên/RP/tinh luyện — chúng là dữ liệu ngủ (`#99`), và màn duy nhất
    còn nhắc chúng nay bị xoá; phần cộng vào store vẫn giữ (không đụng JSONB đang tranh chấp CAS).
  - Bước tuần đủ NGOÀI phiên (kết thúc nghỉ đúng giờ) chỉ chốt ở phiên kế — chấp nhận, vì đường
    duy nhất trao XP là `completeFocusSession`; màn Tiến trình nói rõ «chốt ở phiên kế».
- **Ảnh hưởng**: `pendingReward` +5 trường; `relics[].earnedAt` mới (đóng dấu lúc nạp); `RELIC_EVOLUTION`
  mất `t2Cost`/`t3Cost`; store mất 7 action (`claimWeeklyStep` · `claimMissionAllBonus` · `evolveRelic`
  · `craftBuilding` · `researchBlueprint` · `startCrafting` · `upgradeBuilding`) và 7 helper kỳ quan;
  xoá `LootDropModal.jsx` · `engine/craftReadiness.js`; thêm `engine/relicGrowth.js` ·
  `engine/buffLabel.js`; `previewStage.js` đọc trường từ hai file chuỗi thẻ (người đọc duy nhất);
  `motionCoverage`/`notificationLayer` bớt một hộp thoại. Test: `gameStore.adr070.test.js` (8 bài chạy
  THẬT qua store: tự chốt bước · trọn ngày · đối chiếu lịch sử · di vật lên bậc · kỳ quan ×1,08 EP ·
  đóng dấu `earnedAt` khi nạp) · `relicGrowth.test.js` · `buffLabel.test.js` · `wonderEffects.test.js`
  viết lại · `rewardAxes` +2 bài · `rewardToastWiring` viết lại 3 bài.
- **Điều kiện xem lại**: (a) Đàm thấy chuỗi thẻ quá dài ở phiên có nhiều tin (xp · thành phố · chuỗi
  · hôm nay · nhiệm vụ · bước tuần · thử thách · cấp · bậc · di vật · lên bậc · kỷ = 12 thẻ ở ca
  đỉnh) ⇒ gộp `chain` vào thẻ nhiệm vụ; (b) mốc 20/50 phiên quá xa hoặc quá gần ⇒ chỉnh
  `RELIC_EVOLVE_SESSIONS` (một hằng số, một chỗ); (c) muốn "khan hiếm" thì đặt ở PHIÊN, không mở lại
  tiền tệ (`#99`).

---

## ADR-069 — ĐỒNG TIỀN DUY NHẤT LÀ PHIÊN: công trình một nút, bậc và thử thách kỷ tự chạy theo lịch sử, kỹ năng chọn ngay lúc lên cấp

- **Ngày**: 2026-09-06
- **Trạng thái**: đã áp dụng. Không đụng Thành phố (`engine/city3d/`, `components/city/`, địa hình,
  đường, thực vật, bảng màu, `cityLayout`). Bổ sung cho ADR-068 (chuỗi thẻ thưởng nay là CHỖ DUY
  NHẤT mọi hệ thăng tiến hiện ra). Không đổi hình dạng dữ liệu đồng bộ — tài khoản cũ không cần
  migration.
- **Bối cảnh**: lệnh Đàm (*"SIMPLIFY. MINIMIZE. AMPLIFY FUN."*): *"nhìn toàn bộ hệ thống Upgrade +
  Progression + UX/UI như một sản phẩm cần redesign từ đầu … giảm 5 bước thành 2 … giảm 3 hệ thống
  thành 1 … cơ chế nào tồn tại chỉ vì được code ra thì xoá … tuyệt đối không đụng Thành phố"*.
  Chẩn đoán trên ảnh 390px của tài khoản thật (kỷ 8):
  · Tab Công trình dài **2.376px** = hai hệ nối đuôi (Xưởng + Nghiên cứu), **ba cổng** (RP → nguyên
    liệu thô + tinh luyện → ô hàng chờ) và **bốn loại tiền** cho MỘT hành động — trong khi RP dư
    **8,5 lần** giá nghiên cứu và nguyên liệu dư **14 lần** (`TECH_DEBT #95`): ba cổng đầu chưa bao
    giờ đóng, chúng chỉ tồn tại để được bấm qua. Thẻ "Hàng chờ" in lại thẻ "Đang xây" ngay trên nó.
  · Lên bậc là một nghi thức bốn bước (đủ EP → bấm "Bắt đầu thử thách" → N phiên trong 48 giờ →
    trễ thì hộp thoại đỏ "mất 5% tài nguyên"). Khủng hoảng kỷ còn nặng hơn: **chặn nút Bắt đầu**
    cho tới khi chọn "hiến tế 40%" hay một thử thách có hạn, trễ thì phạt 20%. Hai hệ, hai bộ luật,
    hai hộp thoại, cùng trả lời một câu: *"gần đây anh có làm vài phiên tử tế không?"*
  · "+2 điểm kỹ năng" lúc lên cấp là phần thưởng bị HOÃN: phải đi Hành trang › Kỹ năng, chọn ô,
    rồi trả lời một hộp xác nhận.
  · Tab Tiến trình in lại thanh EP của thanh tiêu đề; màn chờ có "Tăng lực phiên" (cược 5% EP,
    khung "thua thì mất") đứng ngay trước nút Bắt đầu.
- **Vấn đề**: mọi hệ nâng cấp đều đo cùng một thứ — SỐ PHIÊN TẬP TRUNG — nhưng được đổi ra 4–6 loại
  tiền và 3 nghi thức bấm nút, nên người chơi phải HIỂU hệ thống trước khi được thưởng bởi nó.
  Fun-density thấp không vì thiếu cơ chế mà vì cơ chế đứng chắn giữa hành động và phần thưởng.
- **Phương án đã cân nhắc**:
  - **(A) Cân bằng lại giá** (hạ RP/nguyên liệu để cổng "có ý nghĩa"). Loại: cổng có ý nghĩa là cổng
    đôi khi ĐÓNG, tức thêm những lúc "chưa đủ, đợi" vào một vòng lặp đang cần ít ma sát hơn; và
    Đàm đã tích 180 ngày tài nguyên — chỉnh giá là xoá thứ anh đã kiếm.
  - **(B) Gộp ba loại tiền thành một** ("điểm xây"). Loại: vẫn là một loại tiền phải đọc, phải so;
    con số ấy chỉ đại diện cho số phiên — mà số phiên thì đã là cái giá rõ nhất.
  - **(C) Giữ thử thách bậc nhưng bỏ phạt**. Loại: vẫn còn nút "Bắt đầu" và đồng hồ 48 giờ, tức vẫn
    còn một việc phải nhớ; và khủng hoảng kỷ vẫn chặn nút Bắt đầu.
  - **(D — đã chọn) Cái giá duy nhất là PHIÊN và Ô hàng chờ; mọi hệ thăng tiến ĐỌC LỊCH SỬ thay
    vì đòi bấm nút; phần thưởng hiện ngay trong chuỗi thẻ.**
- **Giải pháp**:
  1. **Công trình một màn, một nút** — `components/BuildScreen.jsx` thay `BuildingWorkshop` +
     `BlueprintInventory` (1.649 dòng): Đang xây (thanh tiến độ, huỷ hai chạm) · **Xây tiếp** (≤3 lựa
     chọn mở sẵn, còn lại GẤP) · Đã xây (ô nhỏ, chạm mới kể đặc quyền) · Trùng tu di sản (chỉ khi
     còn việc, ô riêng ADR-012). Luật thuần ở `engine/buildChoices.js`. Store thêm **`startProject`**:
     cùng hình dạng mục hàng chờ, cùng cổng ô/trùng/đã-xây/trùng-tu, **không hỏi RP, không hỏi
     nguyên liệu**; ghi `research.researched` để thành tích/bảo tàng vẫn thấy "đã mở".
     `engine/opportunities.js` còn HAI phép đếm: kỹ năng mở được · **ô hàng chờ trống** (một ô trống
     LÀ một việc: phiên chỉ đẩy thứ đang nằm trong hàng chờ).
  2. **Bậc tự thăng** — `engine/rankLadder.js` (thuần): đủ EP gác + đủ N phiên ≥M′ trong 48 giờ
     gần nhất, đếm THẲNG từ `history` ⇒ `completeFocusSession` thăng một bậc mỗi phiên nhiều nhất và
     kể vào `pendingReward.rankUp`. Bỏ `initiateRankChallenge`/`checkRankChallengeDeadlines`/phạt.
  3. **Khủng hoảng kỷ = nhiệm vụ mềm** — mở ra là vào chế độ thử thách ngay, **không deadline,
     không hộp thoại, không chặn nút Bắt đầu, không phạt**; cùng phép đếm lịch sử; qua thì di vật
     vào túi và kể ở thẻ `relic`. `checkEraCrisisDeadlines` giữ tên (App gọi lúc mở app) nhưng chỉ
     đưa dữ liệu đời cũ về dạng mềm. `EraCrisisModal` xoá; `DisasterModal` cũng **xoá hẳn** (huỷ
     phiên không còn hộp thoại "mất N% tài nguyên" — một hộp không ai mở nữa là mã chết; cờ
     `ui.disasterModalOpen`/`pendingDisaster` + `closeDisasterModal` gỡ theo, chi tiết phạt vẫn ở
     bản ghi lịch sử `cancelPenalty`).
  4. **Chuỗi thẻ thưởng** (ADR-068) thêm bốn thẻ: **`project`** (công trình nhích một nấc, hoặc
     "hàng chờ trống — chọn ngay" có nút đi thẳng) · **`level` MỜI CHỌN ≤3 kỹ năng mở được ngay tại
     chỗ** (`hold`: thẻ đứng yên chờ, "Để sau" giữ điểm; không mở được thì nói *"còn N điểm nữa mở
     được «X»"*) · **`quest`** (thử thách kỷ vừa mở / vừa nhích) · **`rank`** · **`relic`**.
     `finishStory` dọn toast di vật đã kể thay và điều hướng tới Công trình khi bấm "Chọn ngay".
  5. **Dọn nhiễu**: `ResourceDisplay` (thẻ EP trùng + Kho) xoá; `StakePanel` rời màn chờ; hộp xác
     nhận mua kỹ năng bỏ (một chạm; ô nào cũng là kỹ năng thật); "Tổ hợp kỹ năng" gấp lại;
     `RankDisplay` thành thẻ kể (hai điều kiện, không nút) + thẻ thử thách kỷ.
  6. **Mọi phần thưởng nằm trên TRỤC SỐNG** (bổ sung cùng ngày, sau khi soi ảnh): khi ba đồng tiền rời
     đường chơi, ba bảng phần thưởng lộ ra là nhãn không có hiệu ứng — **2/8 bậc mỗi kỷ** thưởng
     «+N% Tài Nguyên», **12/15 di vật** thưởng tài nguyên/RP/giảm thảm hoạ, **4 kỹ năng** quay ra
     nguyên liệu/tinh luyện hoặc miễn một khoản phạt đã biến mất. Thẻ «THĂNG BẬC» in «+12% Tài
     Nguyên» giữa một vòng lặp không còn tài nguyên. Đổi THEO CHỦ ĐỀ, giữ nguyên độ lớn/xác suất:
     bậc lẻ → **+N% EP** (cùng số) · di vật «tăng trưởng» → EP (½ giá trị cũ) · di vật «tri thức»
     (RP) → XP · di vật «che chở» (giảm thảm hoạ) → giờ combo · `ban_tay_vang`/`nhan_quan`/`linh_cam`
     → cú may +XP/+EP cùng xác suất (kể ở thẻ +XP bằng chip «🍀 Vận may») · `su_tha_thu` → +6% XP cho
     phiên ≥25′ ngay sau khi huỷ (bậc đầu của cặp «tha thứ → phục hồi»; `phuc_hoi` cộng thêm). Bậc
     «Cơ Bản» của `RELIC_EVOLUTION` PHẢI trùng `successRelic.buff` — một luật một công thức. Hai
     trần mới `RELIC_EP_BONUS_CAP`/`RELIC_EXP_BONUS_CAP` là lưới an toàn như các trần cũ; trần combo
     nâng 18 → 28 vì nay có 6 di vật trên trục ấy (vẫn không cắn loadout thật — test đã khoá luật đó
     từ trước, và nó đã đỏ đúng lúc). Hộp xác nhận huỷ thôi nói «phạt N%–M% tài nguyên»; nó nói sự
     thật còn lại (không tính XP/EP) và, nếu có kỹ năng Ý Chí, phiên kế được bù gì. Khoá bằng
     `engine/rewardAxes.test.js` (5 bài, cả ba bảng) + 3 bài Vận May/Ý Chí ở `gameMath.test.js`.
- **Trade-off**:
  · Tài nguyên/RP/tinh luyện VẪN được cộng vào store (không đổi `completeFocusSession` phần thưởng,
    không đổi state đồng bộ) nhưng **không còn cổng nào tiêu chúng** trên đường chơi — chúng là dữ
    liệu ngủ. Đây là cái giá cố ý để KHÔNG xoá thứ Đàm đã kiếm và không đụng luồng đồng bộ; dọn hẳn
    là việc của một ADR sau khi anh đã chơi vài tuần (`TECH_DEBT #99`).
  · Nâng cấp công trình (Lv.2/3 bằng tinh luyện) không còn lối vào; cấp đã có vẫn áp hiệu ứng.
  · Thử thách bậc và khủng hoảng mất tính "căng" của một đồng hồ đếm ngược — đổi lấy việc không
    bao giờ bị phạt vì quên mở app. Đàm chọn dopamine, không chọn cortisol.
  · `startCrafting`/`researchBlueprint`/`upgradeBlueprint`… giữ lại cho test và dữ liệu cũ, không
    còn màn hình nào gọi (đếm ở `TECH_DEBT #99`).
  · Đổi trục di vật là đổi CÂN BẰNG: ở loadout Huyền Thoại đủ 15 di vật, EP +106% · XP +65% · combo
    26 giờ (so với +60% Tất Cả của bậc 8 kỷ 15). Con số chọn bằng phép so với thang bậc, chưa đo trên
    người chơi thật — điều kiện xem lại (c) bên dưới. Di vật đã nhận vẫn giữ `buff` cũ trong state;
    mọi nơi TÍNH và HIỆN đều đọc `RELIC_EVOLUTION` theo id nên hiệu ứng đổi ngay, không cần migration.
- **Ảnh hưởng**: `BuildScreen.jsx` (mới) · `engine/buildChoices.js` + `rankLadder.js` (mới, thuần,
  có test) · `gameStore.js` (`startProject`, khối bậc/khủng hoảng trong `completeFocusSession`,
  `pendingReward.{rankUp,relicEarned,crisisOpened}`, xoá 4 action) · `opportunities.js` ·
  `SessionRewardStory.jsx`/`sessionRewardStory.js` · `RankDisplay.jsx` (viết lại) · `SkillTree.jsx` ·
  `PomodoroEngine.jsx` (hộp xác nhận huỷ + gỡ dự báo phạt) · `App.jsx` · `NotificationCenter.jsx` ·
  hai hook cơ hội · `constants.js` (RANK_SYSTEM · ERA_CRISES · RELIC_EVOLUTION · SKILL_TREE nhánh Vận
  May/Ý Chí · hai trần mới) · `gameMath.js` (cú may XP/EP, Sự Tha Thứ) · `challengeEngine.js` (trần
  EP/XP) · xoá 7 file (`DisasterModal.jsx` kể cả).
  Test mới: `buildChoices.test.js` · `rankLadder.test.js` · `gameStore.adr069.test.js` · `rewardAxes.test.js`.
- **Điều kiện xem lại**: (a) Đàm thấy thiếu "khan hiếm" — công trình nào cũng chọn được ngay ⇒ cân
  nhắc GIÁ BẰNG PHIÊN cao hơn cho kỳ quan, KHÔNG quay lại tiền tệ; (b) sau vài tuần không ai mở
  "Xem chi tiết" ⇒ gộp `LootDropModal` vào chuỗi thẻ (`#98`) và dọn dữ liệu ngủ (`#99`); (c) sau
  vài tuần, nếu kỷ chuyển quá nhanh (EP từ di vật + bậc cộng dồn) ⇒ hạ hệ số ½ của di vật EP, KHÔNG
  quay lại trục tài nguyên.

## ADR-068 — VÒNG LẶP CHÍNH theo tâm lý học thói quen: chuỗi lên đầu màn hình, nhiệm vụ ngày về chỗ ra quyết định, và mỗi phiên kết thúc bằng một CHUỖI THẺ chứ không phải một thẻ toast

- **Ngày**: 2026-09-05
- **Trạng thái**: đã áp dụng. **Đảo ngược MỘT NỬA ADR-060** (vế "mọi phiên thường → toast góc màn
  hình"); giữ nguyên nửa còn lại (một thẻ chung, một thang độ hiếm, "chặn màn hình chỉ cho việc
  phải QUYẾT ĐỊNH").
- **Bối cảnh**: Đàm ra lệnh *"làm một cuộc cách mạng về upgrade, đừng upgrade nhỏ lẻ nữa … ứng
  dụng UX Psychology đằng sau các app khiến người dùng không thể ngừng dùng … có thể xoá những gì
  đã có và xây lại … không đụng Thành phố"*. Đi soi màn hình Đàm mở nhiều nhất (Tập trung, khung
  390px) bằng con mắt của một app thói quen (Duolingo · Strava · Headspace) thì ba thứ mọi app ấy
  đặt ở chỗ mắt đọc ĐẦU TIÊN lại nằm ở những chỗ iPhone không thấy hoặc thấy rất nhỏ:
  1. **Chuỗi** — cơ chế giữ chân mạnh nhất — là một ô 68px ghi "7 / 14" ở thanh tiêu đề; tấm
     "Chuỗi" đầy đủ và thẻ "Hôm nay" nằm ở cột phải `hidden … lg:flex`.
  2. **Nhiệm vụ ngày** — ba việc dở dang, cái móc Zeigarnik của cả ngày — ở một tab riêng, tức
     sau một cú chuyển tab, không nằm cạnh nút Bắt đầu.
  3. **Cái kết của một phiên** — sau ADR-060, một phiên thường kết thúc bằng một thẻ toast 4 giây ở
     góc; đo ở `timerSession.js`: ~82% số phiên không còn lễ mừng thành phố nào để che. Luật
     peak-end (Kahneman): người ta nhớ một trải nghiệm bằng ĐỈNH và bằng CÁI KẾT của nó — một cái
     kết ở góc màn hình không phải một cái kết.
- **Vấn đề**: các cơ chế đã có đủ (chuỗi, mốc chuỗi, mục tiêu ngày, nhiệm vụ, hệ số nhân, sự kiện
  tích cực) nhưng chúng **không đứng ở chỗ tâm lý học bảo phải đứng**: không ở lúc mở app (kích
  hoạt), không ở lúc bấm Bắt đầu (hành động), và không ở lúc xong phiên (phần thưởng). Mô hình
  Hooked (kích hoạt → hành động → thưởng biến thiên → đầu tư) có đủ bốn mắt xích trong mã, nhưng
  ba mắt xích đầu bị giấu sau tab hoặc sau `lg:`.
- **Phương án đã cân nhắc**:
  - **(A) Vá lẻ** — nới cỡ ô "Chuỗi", thêm một dòng nhắc nhiệm vụ. Loại: đây đúng là "upgrade nhỏ
    lẻ" Đàm vừa cấm, và nó không đổi CHỖ ĐỨNG của thứ gì.
  - **(B) Mở lại hộp thoại 7 giai đoạn cũ sau mọi phiên** (đảo ngược ADR-060 hoàn toàn). Loại: hộp
    thoại ấy đo được 3.384px · 327 chữ · 31 con số — lý do ADR-060 ra đời vẫn còn nguyên. Vấn đề
    của nó là DÀI, không phải là CHẶN.
  - **(C) Một màn "Hôm nay" riêng** làm tab đầu, đồng hồ là tab thứ hai. Loại: tách chỗ nhìn khỏi
    chỗ bấm là mở lại đúng khoảng cách vừa muốn xoá.
  - **(D — đã chọn) Xếp lại vòng lặp tại chỗ**: mọi thứ mắt cần thấy đứng trên cùng một màn hình
    với nút Bắt đầu; cái kết của phiên là một chuỗi thẻ ngắn, mỗi thẻ một con số, và mỗi con số ấy
    là thứ Đàm đã thấy lúc mở app — giờ được TÔ THÊM MỘT NẤC.
- **Giải pháp**:
  1. **`TodayHero`** (`components/TodayHero.jsx` + luật ở `todayHero.js`, có test) đứng đầu màn
     Tập trung: số ngày chuỗi · "+N% XP/phiên" · **dải bảy ngày T2→CN** (`WeekStrip.jsx`) · mốc
     chuỗi kế tiếp, và khi chuỗi đang treo thì câu *"Làm một phiên để giữ chuỗi"* đứng thay mốc
     (loss aversion đúng chỗ). Ô "Hôm nay"/"Chuỗi" ở thanh tiêu đề ẩn ở tab này; hai thẻ ở cột
     phải desktop gỡ — *hai chỗ nói cùng một chuyện thì chỗ nói ít hơn nhường*.
  2. **Nhiệm vụ ngày nằm ngay dưới đồng hồ** (`<DailyMissions section="daily" />`, `lg:hidden` vì
     desktop đã có cột phải). Tab cũ giữ **id `missions`** (thông báo đã lưu trỏ vào nó) nhưng đổi
     nhãn thành **"Tiến trình"** (nhịp tuần · tài nguyên · hạng) và rời nhóm chính ⇒ thanh dưới
     iPhone còn **4 nút** (Tập trung · Hành trang · Thành Phố · Thêm) — luật Hick.
  3. **`SessionRewardStory`** (`components/SessionRewardStory.jsx` + luật ở `sessionRewardStory.js`,
     có test) chạy sau MỌI phiên: xp → chuỗi (dải bảy ngày, ô hôm nay bật lên) → nhịp hôm nay
     (thanh chạy từ mức trước phiên tới mức sau phiên) → nhiệm vụ (dòng vừa xong bật dấu ✓, nút
     "Nhận thưởng trọn ngày" ngay tại chỗ) → lên cấp → kỷ mới. Chạm để lật, tự lật sau 2,6 giây,
     thẻ cuối có "Tiếp tục" và "Xem chi tiết". Hộp thoại chi tiết (`LootDropModal`) chỉ còn mở khi
     lên kỷ hoặc khi bấm. Điều phối ở `OverlayStack` (`App.jsx`): lễ mừng thành phố → chuỗi thẻ →
     (lên kỷ) hộp thoại; `finishStory` đóng phần thưởng và dọn những toast chuỗi thẻ đã nói thay.
  4. Hai công thức dùng chung tách ra `components/missionXp.js` (XP nhiệm vụ, thưởng trọn ngày) và
     `lib/useCountUp.js` — vì chuỗi thẻ in cùng con số với thẻ nhiệm vụ và hộp thoại cũ.
- **Trade-off**:
  - Màn Tập trung dài thêm một khối ⇒ nút Bắt đầu suýt tụt dưới thanh tab lần thứ tư; trả bằng cách
    hạ lời chào từ tiêu đề 19px hai dòng xuống một dòng 13px, bỏ hàng "Hôm nay · N phút" khỏi khối
    (số phút còn ở thanh tiêu đề các tab khác và ở Thống kê).
  - Mỗi phiên nay có ~10 giây màn hình thưởng thay vì 4 giây ở góc. Bỏ qua được bằng MỘT chạm;
    thẻ cuối tự đóng sau 9 giây để không giam màn hình.
  - `LootDropModal` 7 giai đoạn nay là màn CHI TIẾT ít được mở — nó và chuỗi thẻ cùng trình bày
    một `pendingReward` (ghi `TECH_DEBT #98`).
- **Ảnh hưởng**:
  - **KHÔNG đổi một luật tính thưởng nào**; store vẫn bật `lootModalOpen` đồng bộ như cũ. Toàn bộ
    thay đổi nằm ở tầng hiển thị — đúng điểm cắm ADR-060 đã chọn.
  - **Không đụng `src/engine/city3d/`, `components/city/`, `useCityMoment.js`** — lệnh Đàm.
  - `appNavigation.test.js` (3 nút chính) · `rewardToastWiring.test.js` (+1 bài canh cổng chuỗi thẻ)
    · `previewStage.test.js` (đọc trường từ CẢ HAI người đọc `pendingReward`) · hai file test mới.
  - Cửa soi: `--preview loot` (thẻ đầu) và `--preview "loot&dc-preview-card=streak"` (nhảy thẻ).
- **Điều kiện xem lại**: Đàm nói chuỗi thẻ "dài" hoặc "phiền" ⇒ rút số thẻ mặc định còn 2 (xp +
  chuỗi) trước khi nghĩ tới việc tắt; nếu `LootDropModal` không được mở trong nhiều tuần ⇒ xoá nó và
  chuyển nút "Xem chi tiết" thành một thẻ liệt kê tài nguyên.

---

## ADR-062 — Nguyên mẫu thứ 8 `monolith`: công trình LÀ khối, không phải nhà đội mái

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 19 VIỆC 2. Đàm nhìn kỷ 2 và nói *"kim tự tháp không có khối hình chóp"*.
- **Vấn đề**: `roof: 'pyramid'` đã tồn tại và kỷ 2 khai đúng — **bệnh nằm cao hơn một tầng**. Cả 7
  nguyên mẫu đều là THÂN + MÁI, nên Đại Kim Tự Tháp dựng ra là *một hộp gạch bùn đội cái nón*: có
  tường, có cửa, có mái đua `eaves: 0.2` loe chân thành cây nấm. Kỷ 3 (ziggurat Ur) cùng bệnh —
  đúng `TECH_DEBT #75`, vốn đã chẩn đoán ra rằng *"đây là bài toán KHỐI TÍCH, không phải bài toán
  MÁI"* mà chưa ai làm.
- **Phương án cân nhắc**:
  1. **Cho kỷ 2 khai `eaves: 0`, `windows: 'none'`, thân thật thấp.** Loại: đó là dùng một chuỗi
     giá trị biên để GIẢ một hình khối khác — mọi luật của nguyên mẫu nhà vẫn chạy bên dưới, và
     phase sau đụng vào `groundFloor`/`rooftop` sẽ làm cửa mọc lại trên mặt kim tự tháp.
  2. **Thêm một kiểu mái `pyramid-full` cao bằng cả công trình.** Loại: cùng bệnh — vẫn phải có
     một cái thân ở dưới để mà đội, và ADR-051 vừa dạy đúng bài này (một `switch` mái không tách
     được hai công trình khác nhau về KHỐI).
  3. ⭐ **Một nguyên mẫu thứ 8, `monolith`, dựng thẳng từ mặt đất: không thân tường, không
     `groundFloor`, không `eaves`, không `rooftop`** — chọn.
- **Lý do chọn**: đúng khuôn ba lớp đã dùng chín lần (BẢNG khai → NHÀ MÁY HÌNH dựng → nơi dùng chỉ
  ĐỌC). Nó cũng làm cho *"không có cửa trên kim tự tháp"* thành một sự thật CẤU TRÚC thay vì một
  con số khai khéo — thứ duy nhất sống sót qua các phase sau.
- **Trade-off**: hai kỷ mất mọi chi tiết của tầng trệt và mái. Đó là **đúng ý đồ**, không phải mất
  mát: một khối đá thì không có cửa sổ.
- **Ảnh hưởng**: kỷ 2 ra chóp TRƠN (tỉ lệ cao:đáy 0,64 như Giza), kỷ 3 ra GIẬT CẤP có cầu thang
  chính diện — hai kỷ liền nhau, hai hình khác hẳn, và bản quét chấm cặp 2↔3 vẫn trên ngưỡng.
  Đóng `TECH_DEBT #75`.
- **Điều kiện xem lại**: nếu có kỷ thứ ba cần khối đặc (lăng mộ, gò đền), khai thêm dòng vào bảng
  chứ đừng thêm nhánh `if` theo số kỷ.

---

## 📚 Rotated 2026-09-09 → [`docs/archive/ARCHITECTURE_DECISIONS_2026-09-09.md`](docs/archive/ARCHITECTURE_DECISIONS_2026-09-09.md)

16 entries moved verbatim (ADR-076); nothing deleted. Find one: `grep -n '<title>' docs/archive/ARCHITECTURE_DECISIONS_2026-09-09.md`.

<details><summary>Titles</summary>

- ADR-067 — Màn Thống kê có MỘT nguồn kỳ thời gian, và kỳ mang nghĩa LỊCH chứ không phải "N ngày gần nhất"
- ADR-066 — Bộ xương thành phố SINH THEO KỶ bằng chia đôi đệ quy; đường là RANH GIỚI THỬA, không phải hàng và cột
- ADR-065 — **BÀN CỜ LÀ MỘT MỐC LỊCH SỬ, KHÔNG PHẢI MỘT CÁCH SẮP XẾP MẶC ĐỊNH**: bố cục bên trong một thửa có trục `layout`, và một khu nhà phải NẰM TRONG thửa của nó
- ADR-064 — Hợp nhất hai nhánh: **BSP quyết cắt Ở ĐÂU, cung cong quyết cắt theo HÌNH GÌ**; và một thửa là TẬP Ô, không phải hình chữ nhật đã khai
- ADR-061 — Tách "đã MỜI" khỏi "đã XEM" để gỡ nốt ngoại lệ cuối của luật mức độ làm phiền
- ADR-061 — Khung hình lùi ra tới mức TỐI THIỂU đủ để không cắt công trình nào; và cái trần 1,35 cũ và lời hứa "không cắt" là hai thứ KHÔNG THỂ CÙNG ĐÚNG
- ADR-060 — MỘT ngôn ngữ hình cho mọi phần thưởng, và một luật MỨC ĐỘ LÀM PHIỀN có phân tầng
- ADR-059 — MẠNG ĐƯỜNG là một trục bản sắc: mỗi kỷ tự sinh lấy tập ô đường của mình bằng những CUNG CONG, thay cho một bàn cờ chung cho cả 15 kỷ
- ADR-058 — TIM ĐƯỜNG là một trục bản sắc, và độ lệch của nó là thuộc tính của RANH GIỚI chứ không phải của Ô
- ADR-057 — Chân giải bằng KHỚP NGƯỢC: đặt bàn chân trước, suy ngược ra góc đùi và góc gối
- ADR-056 — DÁNG ĐI là một trục bản sắc riêng, và bốn chiều chuyển động mới đều phải luồn qua ràng buộc "bàn chân không được trượt"
- ADR-055 — Cơ thể cư dân dựng bằng MẶT TRÒN XOAY khai bằng dữ liệu thuần, không bằng hình khối của three; và một ngân sách lạc hậu theo hướng SIẾT thì im lặng vĩnh viễn
- ADR-054 — Vật liệu của thứ đội trên đầu là một TRỤC RIÊNG, không phải một sắc độ của quần; và một tham số bị một biến cùng tên che khuất đã giết hai tính năng trong im lặng
- ADR-053 — Cư dân là một BỘ XƯƠNG có khớp, dựng bằng MỘT InstancedMesh hộp đơn vị; dáng đi là hàm của QUÃNG ĐƯỜNG đã đi, không phải của thời gian
- ADR-052 — Một ô nhà dân là một KHU PHỐ, không phải một căn nhà; và «thêm nhà» là điều bất khả, chỉ có «chia nhỏ»
- ADR-051 — Kim tự tháp và ziggurat là HAI hình khối, không phải một giá trị mái viết khác đi; và một nhánh `default` biến «thiếu `case`» thành «lặng lẽ đổi kiểu»

</details>

---

## ADR-089 — Round 49: give the machine something to blow, and light the fire — props that move, fire and night, weather that wets the ground

**Date**: 2026-09-09 · **Order**: *"CHO CÁI MÁY THỨ ĐỂ THỔI, VÀ THẮP LỬA LÊN … tôi mở tab Thành Phố lúc 10 giờ tối, không chạm gì, nhìn 10 giây — và tôi thấy lửa cháy, cờ bay, thuyền nhấp nhô."* Full authority; no performance measuring; the only numeric gate is the 105 era pairs; ADR-007's two tests are the only stop condition.

### Context
Round 48 built the motion machine — one clock, a per-vertex `aMotion`, particles — and had almost nothing to blow: no flag, sail, boat or crane existed, the only "fire" was a tag with no flame, and the sky did the same thing at every hour. Worse, one of round 48's own measurements was carried by smoke and residents alone: the merged city (trees, cloth) never moved in the tool, and no test was red (lesson 106).

### Decisions
0. **Lesson 106 — the program cache key.** `applySurfaceDetail` gave every patched material the same `customProgramCacheKey`. The motion injection edits shader CODE, so whichever material compiled first decided for all: the ground's program (no motion) served the merged city too, and nothing merged ever moved. The key now differs with motion; a control test builds one material with and one without and demands different keys. Era 8, two frames 0,8 s apart: **0,31 % → 1,44 %** of pixels change, with no other change in between.
1. **Cloth is two dyes, not one role.** `canvas` = undyed sailcloth (sails, awnings, tents, laundry sheets — one sun-bleached linen for all eras, the `straw` logic) and `flag` = dyed (`FLAG_HUE` per era: heraldic red mostly, blue for Paris and New York, green for Dubai — never the UI accent, which is violet in era 6 and fails the magenta guard). `cloth`/`cloth2` stay the residents' dyes. Every new role (`canvas` · `flag` · `hull` · `hook` · `flame`) rides the `wood` family, so no era gains a draw call; the stall's goods went `gold` → `trim` because era 13 draws no gold at all.
2. **Props that move.** A flag on every `mast` motif and on rooftop masts (a mirrored PAIR — the symmetry law), a hanging cloth on every `banner`; **boats** from `waterProps.js` (cells with `insetAt` above a per-water threshold, 1,7 cells apart, yaw along the water's open axis; item kind `water`, group `landscape` so they widen neither the city box nor the blocker list, 1,3× scale, the whole hull a rigid `bob`); **cranes** on scaffolds past t > 0,3 (a wooden jib before era 10, a tower crane after; `hook` bobs); **life props** from `lifeProps.js` (`ERA_LIFE`, 15 rows: stalls with awnings, laundry lines, tents, campfires, braziers, forges, wells, barrels, firewood, lanterns, carts, animals, benches) on free cells that touch a road or sit within two cells of a home — hash-ranked, only-add, no existing prop re-rolled. Flap weights: a flag is held along its −X edge, a hanging cloth along its top; the held edge weighs 0.
3. **Fire.** `PARTICLE_STYLE.fire` — additive, unfogged tongues that shrink and cool from orange to dark red, every fourth one an ember. Sources are every part tagged `fire` in ANY group: campfire · brazier · forge · firepit · a torch on the lamp posts of eras 1–3 (a bronze collar keeps `gold` in those eras — a family that vanishes moves five draw-call tables). `ERA_MOTION` declares `fire` for eras 1–10 and 12, and `ERA_LIFE` lists a fire-bearing prop FIRST for each of them, so a declared particle kind always has a source (the `sceneStats` law). At night `flame` joins `glass` in the glow sink, in its own colour. **Local light**: up to 6 `PointLight`s (`FIRE_LIGHT`: reach 0,24 cell, decay 2), nearest to the centre first, flicker = three incommensurate sines of t (`fireFlicker`) — deterministic, never `Math.random`. Not a fourth fill light.
4. **Museum hour 15 → 18**, by eye on two frames of era 1: at 15:00 the fires are three dots in flat sun; at 18:00 the same city has warm side-light, long shadows, lit windows and a pool of firelight at every hearth, roofs still readable. A sealed era keeps ONE hour — the promise of ADR-086 — and now one weather (`museumWeather`).
5. **Weather.** `weather.js`: `weatherAt(era, hour)` is a pure table per DAY PHASE (so it changes only when the daylight phase does — no second rebuild trigger). **The one law: rain wets the ground** — `wet ≥ rain` by construction in `normalize`; the three ground materials go through `wetSurface` (roughness → 0,34, albedo × 0,70, specular gain × 2,4 — applied ONLY when wet, the dry law of the wiring test holds); fog = daylight haze × (1 + 2,5 · weather fog); rain/drizzle are streak particles owned by the weather, never by an era's list; smoke is lit by the phase (`smokeLightFor`: night 0,3). The tool renders the weather of `--hour`; `--dry` is the control frame. Era 13 at 22:00, wet vs dry: **29,8 %** of pixels differ, and the difference is a darker, glossier street under white streaks — not noise on a matte one.
6. **People.** `#79`: `steel` split from `gear` (helmet, tool head) by HUE, kept as dark as gear on purpose — the SSh-40 of era 12 was painted the colour of the jacket; the palette test's exception list [12, 15] is history, not a threshold. `#81`: brim 1,9 → 1,7 headW — the crown (0,62 × brim) must clear the skull, so 1,62 is the floor; partial by design.
7. **Re-based on purpose:** GOLDEN eras 1 · 4 · 6 · 8 · 12 · 13 (flag, banner and flame parts), `MOC_TAM_GIAC` all 15 (+0,5 … +2,1 %), the cityFocus control list [1, 8, 10, 12, 15] / 8 flights (era 12's masthead flag), `cityFocus.test.js` blockers now exclude `water` through the same `KIND_NGOAI_LUOI` as `sceneGraph`. Draw-call marks untouched.

### Consequences
| | Before (round 48) | After |
|---|---|---|
| Prop kinds | 6 (+ ground covers) | 20 (+ boats, cranes, 12 life kinds) |
| Flags · sails · boats · cranes | 0 · 0 · 0 · 0 | on every mast · on 5 boat rigs · 8 boats/era with water · 1 per scaffold past 30 % |
| Particle kinds | 6 (smoke · steam · snow · sand · dust · birds) | 9 (+ fire, rain, drizzle) |
| Eras with a fire burning | 0 | 11 (1–10, 12), lit and flickering at night |
| Weather kinds | 1 | 7 (clear · haze · fog · drizzle · rain · snow · sand), per era, per phase |
| Rain without wet ground | possible | impossible (`wet ≥ rain`) |
| Pixels changed, era 8, 0,8 s apart | 0,31 % (nothing merged moved) | 1,44 % |
| Museum hour | 15:00 | 18:00 |
| 3D debts | 47 open | #79 closed · #81 partial · #75 and #24 confirmed closed (frame-fit 0/15) · #90(b), #77 read and left open |

**Not done, on purpose:** `#90(b)` with `#77` (the rooftop span as a pixel relation touches 12 green tests — its own round); people talking in pairs; puddles as a mask (wet is roughness + albedo + specular); nothing removed in the 390 px audit this round (judged on the sweep, see BAN_GIAO); no 22:00 sweep of the round-48 code (the after-sweep is the record).

### Tool lessons
- A percentage cannot say WHAT is still — the magenta heat-map of changed pixels is what found lesson 106 (flags, sails, palms all black; only the shoreline and the residents lit up).
- `--dry` is the only fair control for a weather frame: same hour, same light, same clock, no weather.

---

## ADR-094 — Round 54: the geometry was already curved; nobody had told the shading

**Date**: 2026-09-11 · **Order**: *"TỪ KHỐI SANG TRÒN … Build lớn … Đây là phần phải gây hứng thú, tiêm thêm nhiều dopamine … TOÀN QUYỀN. Không đẩy quyết định nào về phía tôi."* Target style, settled by Đàm: *"Pixar-style 3D animation — hình tròn mềm, tô sáng mượt, nhân vật dễ thương, ánh sáng dịu. Không đuổi theo Pixar thật … Nhưng chất thì phải ra Pixar."* Acceptance, in his words: *"tôi nhìn một cư dân ở tầm mắt — và người đó phải tròn, mềm, dễ thương như một nhân vật hoạt hình 3D, không phải một chồng hộp gỗ."* Same four laws as rounds 47–53: ADR-007, determinism, 105 era pairs across four seasons, and a photograph for everything.

### Context
Đàm's own diagnosis opened the round, and it was right: *"`humanShape.js` đã dựng thân người bằng khối tiện tròn 12 cạnh nhiều vòng … Hình học đã cong thật. Nhưng `geometryFactory.js` ghi pháp tuyến thẳng vào bộ đệm theo từng mặt — không `computeVertexNormals`, không làm mềm, không góc gãy … Một hình trụ 12 cạnh hiện lên thành 12 tấm phẳng."* The geometry had been curved since ADR-057; three rounds of lighting work had been poured onto surfaces whose normals said "I am flat".

### Decisions
1. **⭐ Smooth by CREASE ANGLE, and the angle needs no role table** (`engine/city3d/creaseNormals.js`, `CREASE_DEGREES = 40`). Weld vertices by quantised position, then for each vertex average only the face normals within 40° of its own. The rule falls out of geometry rather than taste: two side faces of a 4-gon are 90° apart (stay sharp), of a 6-gon 60° (sharp), of a 12-gon 30° (smooth), and a side face meets a cap at 90° (sharp). **A box keeps its corners and a column turns round, and nobody declares either.** A `role → smooth` table would have 21 entries today and a 22nd nobody remembers; an angle is already correct for blocks not yet written. Corollary worth remembering: **raising a block's `sides` IS switching smoothing on for it** — Việc 1 and Việc 2 are one mechanism seen from two sides.
2. **It must run per PART, never on the merged buffer.** The scene merges every building of a material family into one mesh. Welding across that buffer would smooth two touching houses INTO each other and a street corner would bend like toffee.
3. **⭐ The law lives in the pure engine layer, because residents do not go through `geometryFactory` at all.** The first draft put it in `render3d/` and shipped a city that was round everywhere except the people — who travel `humanShape.js` → `humanGeometry.js` → `InstancedMesh`, a separate pipeline. Since the round is judged on *"tôi nhìn một cư dân ở tầm mắt"*, that omission was the whole round. One crease law, two callers: Composition over Duplication, and the pure layer is the only place both can reach.
4. **Cute beats accurate, and this deliberately reverses ADR-090** (`human.js`, `headH` 0,16 → 0,22 ⇒ **4,55 heads tall**). Đàm's instruction, quoted in the code: *"nhân vật hoạt hình không đi theo đời thật — chúng đi theo sức hấp dẫn … Ghi rõ vào ADR rằng đây là đảo quyết định vòng 50 có lý do, không phải quên."* Round 50 shrank the head to 0,16 to be anatomically right; round 54 puts it back for the opposite reason, on purpose.
5. **A joint wears the colour of the limb it joins** — found by a photograph, not a test. Six ball joints hard-coded to `skin` rendered as six bright rivets on era 12's dark uniform. The rule already existed in this file at the foot, and it is the same defect `SLEEVE_LOOK` was built to fix in round 52, returning one level down. **Shoulder takes the upper arm's role, elbow the forearm's, knee the shin's** — so on a short-sleeved era the elbow correctly lands on the skin side of the sleeve's cut line.
6. **⭐ Cloth folds are a j-indexed TABLE, not `cos(k·θ)` — because the gate pointed at a better design.** A continuous cosine modulation of the radius breaks the exact unit-box invariant every silhouette measurement depends on (`humanPose.partCornersAt`, `silhouetteSpanX`): at 20 sides the extreme vertices sit at `j mod 5 ∈ {0,4}`, and no continuous cosine equals 1 at all eight of them, so the block would shrink by fractions of a thousandth and every measurement would lie, silently. Placing the fold RIDGES exactly on those eight vertices costs nothing: **the envelope does not move by one digit and four folds are free.** Third time this project has been handed a better design by a gate it could not get around (after the brimmed hat and the round-52 sleeve).
7. **A cone's TIP stays sharp; its FOOT does not** (`footBevel`, separate from `bevelWidth`). Round 47 left `taper: 0` solids unbevelled because a cut apex stops being an apex — still true. But where a spire's flank meets its base cap, two faces meet at 90°, along the object's own horizon, and decision 1 cannot touch it (90 > 40). Only geometry can. Separate function because `bevelWidth` answers *"how wide is the strip at BOTH ends of a prism"* and both the geometry factory and `countTriangles` read it that way; a cone has a foot and a tip, not two ends.
8. **⭐ Shadows stop at 82% of the sun, and the LEVER matters more than the number** (`SHADOW_INTENSITY = 0.82`). Raising `SKY_FILL_RATIO` also lifts the shadow floor — and lifts every lit face with it, which is the "milky pale" failure Phase 7A paid to remove and wrote into the comment directly above. `shadow.intensity` touches only pixels already in shadow, so the ceiling does not move. Measured floor / crushed / saturation / contrast: era 11 `0,133→0,138 · 3,9%→3,6% · 0,116→0,118 · 0,322→0,323`; era 7 `0,171→0,177 · 0,1%→0,0% · 0,199→0,201 · 0,445→0,444`; era 13 `0,161→0,170 · 1,4%→0,9% · 0,078→0,077 · 0,415→0,415`. **Contrast holds to three digits** — the proof this is not the milky trap.
9. **A second measurement stopped the round going further, and that is the finding.** Pushing to 0,74 moves era 11 only to `0,139 / 3,5%` — inside the noise. The reason is not lighting: Phase 9B's reverse test showed **9,6 of era 11's 11,1 crushed points are ASPHALT under full sun** (`TECH_DEBT #30`), a palette defect no lighting lever can reach. *Before trusting a ratio, ask whether the denominator contains things outside the question.*
10. **Tree lobes stay; their SIDES change** (`flora.js`, `lobeSides`, min 10). The file's header warned *"the fix is NOT more sides — smoother just looks more like geometry"*, and that was true while normals were flat: more sides bought a polyhedron with more faces. Decision 1 changed the premise. `360/n` crosses 40° between 9 sides (40,0) and 10 (36,0), so at 10 a lobe **stops being a polyhedron** rather than becoming a smoother one. The two mechanisms add: **lobes own the OUTLINE, sides own the SURFACE.** The header now says so, or the next session would revert this on the strength of the old sentence.

### Consequences
| | Before (round 53) | After |
|---|---|---|
| Vertex normals | flat per face, everywhere | merged under 40°; box byte-identical, turned shapes 69–92% merged |
| Resident body | 12-sided, 18 parts, 1.808 tri | **20-sided, 27 parts, 5.124 tri**, neck + 2 eyes + 6 ball joints |
| Resident proportion | 7,5 heads (ADR-090) | **4,55 heads** — reversed on purpose |
| Loose cloth | a perfect surface of revolution | **4 folds + a scalloped hem**, envelope unchanged to the digit |
| `MAX_SIDES` · `BEVEL_MAX` | 16 · 0,06 | **24 · 0,14** |
| Cone / pyramid foot | a 90° rim | a chamfer; tip still sharp |
| Shadow | cuts 100% of the sun | **cuts at most 82%** |
| Rim light | 0,22 × sun | **0,30 × sun** |
| Heaviest tree | ~340 tri | **616 tri**; scene totals +13,4% (era 8) to +42,7% (era 1) |
| Era 2 draw calls | 17 | **16** — the hip wrap left `prism` for `flare` |
| Museum signature | one digest over the whole spec | **two**: `GOLDEN_KHOI` (parts only) and `GOLDEN` |

### The lesson worth more than the round
**A museum signature that contains a render cost will go red for a change that moved nothing.** `block.test.js`'s GOLDEN hashes the whole building spec — including `triangles`, a number the geometry factory decides. Decision 7 changed how a cone is drawn and five eras went red while **not one block moved**. Proved rather than assumed, by digesting `spec.parts` alone across a worktree at `8dde63d` and the working tree: identical in all 15 eras. The fix is not to re-base more carefully next time; it is that the file now carries TWO digests, because *"có viên gạch nào xê dịch không"* and *"vẽ nó tốn mấy tam giác"* are two questions and one field cannot answer both. Same family as every other "một trường gánh hai việc" in this project — this time the field was a hash.

---

## ADR-093 — Round 53: a wall that cannot shadow itself cannot be lit, however many effects you pour on it

**Date**: 2026-09-11 · **Order**: *"KHỐI PHẢI CÓ ĐỘ SÂU … Vòng 52 làm xong tầng shader … Ảnh có đẹp lên. Nhưng nhìn vẫn 'low', và tôi đã biết vì sao."* Đàm's own diagnosis, and it was exactly right: `emitWindows` laid a flat `prism(role:'glass')` ONTO the wall instead of cutting a recess INTO it, so every wall in the city was a smooth plane — and a smooth plane cannot shadow itself. Bloom, texture, god rays and SSAO are all light; light needs edges, sills, reveals and overhangs to make shadows from. Same three laws as rounds 47–52: ADR-007, determinism, 105 era pairs across four seasons.

### Context
The project had already written this down, in `parts.js`'s docstring for `gable`: *"Mái thò ra khỏi tường (overhang) là chi tiết nhỏ nhưng chính nó tạo ra vệt bóng dưới diềm mái — thứ khiến khối trông có bề dày thay vì như dán giấy."* And `buildingSpec.js` had diagnosed the window case specifically, prescribing the right cure: *"cách đúng là dựng KHUNG quanh nó thò ra XA HƠN."* The prescription was filled halfway — a sill below, a lintel above, and never the two side jambs.

### Decisions
1. **⭐ A window is a HOLE, and the missing half was the vertical half** (`engine/city3d/windowOpening.js`). The two horizontal mouldings the code already built give an opening a thin dark line above and below — the same on every face of a box, so all four faces still read alike. Two vertical REVEALS are different in kind, for a reason of geometry rather than taste: **the sun stands to ONE SIDE.** One jamb catches the light, the other throws a shadow into the opening, and that light/dark pair CHANGES with the facing of the wall. That is what stops a box reading as a box, and it is why this one change touches every wall of all fifteen eras at once.
2. **You cannot cut a hole, and you do not need to.** The body is a solid in a merged mesh; there is no boolean here. But the eye does not measure depth, it reads SHADOW — and a four-sided frame standing `reveal` proud of the wall, with the glass almost against it, produces exactly the shadows a recess `reveal` deep would. That is the principle of relief sculpture, not a trick.
3. **The relief cap is the OLD sill relief, to the digit** (`TOTAL_RELIEF_CAP = SILL_RELIEF = 0.085`). Not a performance budget — Đàm removed those three rounds running — but a GEOMETRIC one, because the envelope has a consumer far from here: `block.js` shrinks each unit to fit its cell by exactly that envelope. The first draft used 0.16 and the consequence travelled three stages in silence: era 6's envelope grew 10% → units shrank → `min(rw,rd)` fell under `ROOFTOP_MIN_SPAN` → **eleven houses lost their roof detail entirely**. The visible recess is 0.073, twice the old protrusion; and what makes the shadow is the jambs EXISTING, not another two centimetres.
4. **A decoration that will not fit is not built.** Shutters ask how much wall is left beside the opening (`room`) and are skipped when they would reach past the corner — the same answer `emitGroundFloor` gives a door that would come out 4cm wide. Clamping them to a hand-picked smaller size would have hidden the same bug at a smaller scale.
5. **The wall gained its vertical axis** (pilasters, Việc 3). It had three horizontal lines since Phase 8A and not one upright. Pilasters spread by exactly `COURSE_SPREAD` so they meet the string courses flush and the envelope does not move.
6. **⭐ Ambient occlusion moved into `LensShader`, and `GTAOPass` is gone** (Việc 5, closing `TECH_DEBT #52`). It samples the depth buffer depth-of-field already builds, so it is nearly free — but the reason it beats patching GTAO is not cost: **it never reconstructs view-space position.** GTAO rebuilds a 3D point from depth through an inverse projection, and that is precisely what fails up close. Comparing distances has no matrix and no inverse, so the old failure has nowhere to come back from. Measured on one frame, `--post lens` vs `--post ao,lens`: **31,4% of pixels darker by more than 2/255**, concentrated in creases rather than a flat dim.
7. **The triangle ceilings became runaway detectors.** Đàm removed the triangle ceiling in writing in rounds 50, 52 and 53. But a ceiling does two jobs — *"this is more detail than the eye can use"* (a design decision, withdrawn) and *"someone nested a loop by mistake"* (a bug net, still needed). Deleting both throws the second away with the first. The numbers are now 10× real, and the guard that replaces them is a RELATION that never needs raising: no building may exceed **6× the median of its own era** (worst measured: 3,08×), and no building may emit zero triangles — the shape of the round-51 failure where `emitWonderEntrance` produced nothing in fifteen eras with every test green.

### Consequences
| | Before (round 52) | After |
|---|---|---|
| Window openings | a flat pane standing 0,035 PROUD | a recess 0,073 DEEP with two jambs, lintel, drip sill, glazing bars |
| Per-era opening kits | 0 | **7 kinds + 8 era overrides** (bars, shutters, hoods, shoji grille) |
| Vertical relief on a wall | 0 | **pilasters**, 2–6 per face |
| AO at eye level | off (`TECH_DEBT #52`) | **on**, 31,4% of pixels affected |
| Lit windows | a ring of light under the floor slab | a pool on the pavement at the facade |
| Triangle ceiling | a gate at 12k/24k | a runaway detector at 10×, plus a 6×-median relation |

### The lesson worth more than the round
**`prism`'s `y` is the BOTTOM of a block, and `parts.js` says so in its first line — I wrote two emitters as though it were the centre.** It did not surface as "the windows sit half a window too high". `spec.height` is derived from the tallest part, so the upright pieces pushed the DECLARED height of era 15's wonder from 4,665 to 6,011 (+29%) and what went red was the aspect-ratio test — *"không công trình nào cao vống thành ống khói"*. A coordinate bug surfaced two layers away as a proportion bug, in a test about neither coordinates nor windows. Corollary: when a test fails in a subsystem you did not touch, the shortest path is not to reason about the subsystem — it is `git stash` and measure the same number both ways.

---

## ADR-092 — Round 52: the post pass, surfaces that are not plastic, and the gate that said "how many OBJECTS is this?"

**Date**: 2026-09-11 · **Order**: *"NÂNG CẤP ĐỒ HOẠ … Build lớn. Chuyển động, motion, 3D chuẩn hơn … Đây là phần phải gây hứng thú, tiêm thêm nhiều dopamine … TOÀN QUYỀN. Không đẩy quyết định nào về phía tôi."* Style: *"high detail stylized game art — low-poly nhưng vật liệu và ánh sáng ở mức AAA"*. Order of work A → B → C → D, and *"không đủ sức làm hết thì làm sâu A + B, đừng rải mỏng cả bốn."* Same three laws as rounds 47–51: ADR-007, determinism, and the 105 era pairs across four seasons.

### Context
Two refusals written into this codebase were both lifted by Đàm in writing on 2026-09-11: `CityScene3D.jsx` had refused an `EffectComposer` and `materials.js`/`occlusion.js` had refused SSAO, both times for fear of weak hardware. His words: *"Cả hai lần đều từ chối vì lo máy yếu. Tôi gỡ cái lo đó: máy tôi rất mạnh. Lag thì tôi nói."* He also required a switch in Settings, so the decision stays reversible by the person who has to live with it.

### Decisions
1. **One post-processing chain, and its order is physics** (`render3d/postFx.js`). AO → god rays → bloom → lens → output. AO belongs before the light bleeds, because occlusion is a property of the surface, not of the glow; rays come from the scene's own bright pixels, so they read the AO'd image; bloom is what the lens does with the light that survives; grain and vignette are the film, so they come last. **Tone mapping moved into `OutputPass`** so `NeutralToneMapping` + exposure applies exactly ONCE — leaving it on the renderer applies it to the scene AND again to the composited result.
2. **A profile per daylight phase, and the threshold decides WHAT glows.** Textbook night values (strength 1,05 · threshold 0,26) blew every lit window into a white blob, because round 49's glow sink already puts fire and lit windows near 0,9 while a sunlit wall sits near 1,0 — under about 0,5 a threshold selects BOTH. Night is now threshold 0,72, and `postFx.test.js` holds that floor as a law: *strength says how much, threshold says what*.
3. **Textures are GENERATED at build time, never fetched** (`render3d/surfaceTexture.js`). A recipe per material family (16 of them) drives one height field, and the normal map is DERIVED from that height's gradient rather than authored beside it — so the bump and the shading can never disagree. `tileNoise` wraps on a torus, so every map tiles seamlessly; `surfaceTexture.test.js` measures the seam (< 120/255) instead of trusting it. No files, no network, byte-identical every build.
4. **They are sampled TRIPLANAR, by world position** — the only way to texture this scene at all, because its geometry is merged per material family and has **no UVs anywhere**. It also makes the grain continuous across a merge, which a UV layout would not. Built on top of `surfaceDetail.js` as Đàm required (*"đừng dựng hệ thứ hai song song"*), with the shader variation encoded in `customProgramCacheKey` — lesson 106, paid for once already.
5. **⭐ Clothing is the limb, not a tube around it** (`human.js` `SLEEVE_LOOK` / `LEG_LOOK`). The first build did the obvious thing: a cloth sleeve over each arm, a trouser leg over each leg. Eight extra parts per resident, era 12 at **26 parts** against a ceiling of 18 and **2 856 triangles** against 1 808 — 58% more geometry bought to HIDE the parts it had just built, since the eye never sees the arm inside the sleeve. The parts ceiling went red and it was right. The way out is the question that produced the `hat` shape: *how many OBJECTS is this in real life?* A sleeve is not an object beside an arm; it is what the eye sees where the arm is. So the limb part changes ROLE, SHAPE and WIDTH — width as well as role, because cloth has thickness and thickness is the only thing a silhouette can read. Cost: **0 extra parts, 0 extra draw calls**, and the same per-era triangle counts as before the round.
6. **Hair is its own axis** (`humanStyle.js` `HAIR_KINDS` + `HAIRDO`). `bun` had been sitting in the headgear table, so the question "what hair does this century have" could not be asked for the other fourteen — the four bare-headed eras walked the street with a smooth skull. The crown holds ONE part: a hat wins it when there is one, hair when there is not. Eight of fifteen eras sit exactly at the parts ceiling and all eight wear hats, so a second part there would buy a strip of hair the hat covers.
7. **Residents cast shadows**, and the reason they did not has expired: the shadow map went 2048 → 4096, round 48 doubled their size, round 50 lets Đàm walk up to them. A figure with no shadow reads as pasted onto the ground rather than standing on it. It carries an obligation elsewhere — the scene's shadow map does not auto-update, so `CityScene3D` dirties it every other animated frame (15 Hz: smooth to the eye, half the cost of 30). Without that the people walk and the shadows stay put, and no test goes red.
8. **AO is off in walk mode, and that is a recorded defect, not a taste** (`TECH_DEBT.md` #52). At eye level three's `GTAOPass` returns a solid BLACK occlusion buffer for everything near the camera: measured at era 10, 12:00, 1400×700 as a dead-straight horizontal line at **row 612/700 with a 16,5/255 brightness step**. The city (orbit) view — the one Đàm looks at most — measures **1,4/255**, i.e. nothing. Ship AO where it is right, switch it off where it is wrong, record the measurement, and do NOT lower `blendIntensity` to push the artefact under the eye's threshold, which would be the funnel `CLAUDE.md` forbids.

### Consequences
| | Before (round 51) | After |
|---|---|---|
| Post-processing | refused in a comment | **4 passes**, profile per daylight phase, switch in Settings |
| Texture maps | 0 material families | **16**, colour + normal, generated, seamless, deterministic |
| Resident arms | `skin` in all 15 eras | **cloth in 13/15**, with sleeve volume and flare |
| Eras with a bare skull | 4 | **0** |
| Residents casting a shadow | no | **yes**, refreshed at 15 Hz while walking |
| Parts per resident (worst era) | 18 | **18** — the wardrobe cost nothing |

### The lesson worth more than the round
**When every parameter you turn leaves the defect exactly where it was, stop turning parameters and go look at the INTERMEDIATE BUFFER.** The GTAO band survived radius 0,12 / 0,35 / 0,70, a screen-space radius, thickness 0,6 → 3,5, three image widths, and an extra `composer.setSize` — all at row 612. A number that does not move when you move everything is not coming from any of the things you moved. One line (`gtao.output = OUTPUT.Denoise`) showed the AO buffer itself and the answer was immediate: it was not "too dark", it was BLACK, and its boundary rose where a wall stood closer — so it tracks DEPTH, not pixel rows.

---

## ADR-091 — Round 51: the eye came down to the street, and the two biggest things in the frame were the two emptiest

**Date**: 2026-09-09 · **Order**: *"PHỐ ĐÃ MỞ, GIỜ PHẢI CÓ NGƯỜI Ở … MẮT TÔI NAY ĐỨNG DƯỚI ĐƯỜNG … Ở tầm mắt, bầu trời chiếm gần nửa khung hình và mặt đường chiếm phần lớn nửa còn lại. Hai thứ lớn nhất trong tầm nhìn đang là hai thứ trống nhất … Không đủ sức làm hết thì làm sâu A + B, đừng rải mỏng cả bốn."* Same three laws: ADR-007, determinism, and the 105 era pairs across all four seasons.

### Context
Round 50 gave Đàm a walk mode, and that one feature invalidated the priorities of the four rounds before it. Everything built between round 47 and round 50 was designed for a camera looking DOWN from across the square: ground colours read from above, roof detail, skylines, string courses at storey height. From the pavement, none of that is where the eye is. The sky was one gradient — the same gradient in all fifteen eras, all four seasons, all twenty-four hours — and the road was a coloured strip with nothing standing on it.

### Decisions
1. **The sky is a decision, not a backdrop** (`engine/city3d/sky.js`, pure). `skyAt(era, season, hour, weather, dayIndex)` answers what is up there: cloud kind and cover, drift speed, how much a low sun lights the cloud from below, how many stars survive the era's own light pollution, whether the Milky Way shows, and where the moon is in a real 29,53-day cycle. `ERA_SKY` gives each century its own: Anatolia clear and starlit (`pollution: 0`), Manchester a closed lid (`amount: 0,85`), Tokyo the brightest night on the board (`pollution: 0,95`, effectively starless).
2. **The clouds are on a DOME and they turn** (`render3d/skyLayer.js`). The first draft scattered them on a flat plane at cloud height over a 36-unit square; the camera orbits ~22 out and ~12 up, so half of them ended up BETWEEN the camera and the city, and the photo showed pale slabs draped over Tuscany. A sky is high in the middle and comes down to the horizon: clouds sit on a shallow dome inside the gradient dome, their height falling with the square of the distance from the centre, and they drift by TURNING about the vertical axis — which has no wrap seam, and which from the street is exactly what the eye sees. Each cloud is a CLUSTER of four puffs drawn out along the wind, because a lump needs at least three overlapping bodies to read as one.
3. **Cloud shadows fall on the real ground.** One soft disc per cloud, projected down the scene's own sun ray and placed at the height `horizon.heightAt` gives — the same surface the walker stands on. They are what make a cloud an object with a place rather than a decal. Darkness peaks at BROKEN cloud and falls to zero at full cover, because an overcast sky has no shadow edges at all. A flat disc on a slope would cut into the hill, so each one asks the ground at two points of its own rim before drawing.
4. **A FOURTH geometry column: `sky`** (`measureSceneGeometry`). It is deliberately NOT folded into `backdrop`. The backdrop column exists because the dome and the mountains are a constant across all fifteen eras and a constant dilutes era comparison; the clouds are the opposite of constant. Same reasoning, opposite answer, so it needs its own column — and `sceneStats.test.js` now demands both: backdrop identical across 15 eras, sky NOT.
5. **The street gets furniture** (`streetFurniture.js` + `streetFurnitureSpec.js`). Nineteen shapes, a kit per century, each piece hung on the KERB LINE of a road cell that already exists — using that street's own cross-section (`streetCrossSection`) to know where the kerb is. Every row is a date, not a taste: a hydrant is 1801, a gas lamp 1807, a public bin the 1870s, a tram rail the 1830s, a hitching post as old as the ridden horse — the same law `streetStyle.js` already applies to kerbs (Rome) and road markings (C20).
6. **Street furniture lives in `layout.street`, not `layout.props`.** `props` carries a one-thing-per-cell invariant that six tests guard, and they are right to: two trees in one cell is a bug. A lamp post on a kerb occupies no cell at all. Putting it in `props` turned all six red at once and every one was telling the truth — the same reason ground cover got its own array.
7. **A new part role: `iron`.** `trim` takes the era's trim material, so a cast-iron gas lamp in Manchester came out BRICK RED and a manhole cover came out PINK. Iron looked the same in Paris and in Manchester, and a role that borrows the century's colour cannot say that. It rides the `wood` material family — drawn by all fifteen eras — so no era gained a draw call.
8. **The facade vocabulary gained the bottom two metres** (`facadeDetail.js`): a number plate beside the door, a window box under the sill, a shop board with goods across the opening. These are pinned to the GROUND in absolute units, not to a fraction of the height — `height × 0,16` would put era 11's house numbers on the fourth floor. A house number belongs to a PERSON, not to a storey.
9. **The wonder opens** (`wonderEntrance.js`). Round 50 left the landmark sealed for a real reason: a door, a room and a sign are asymmetric and the wonder must mirror. The way out was not to relax the mirror but to build something that is symmetric anyway — which a great entrance already is in all fifteen of these traditions: a portal on the centre line, a colonnade in EQUAL PAIRS, a lintel and a pediment across the whole front. Nothing projects; the portal is cut INTO the wall, and going inward can never widen a footprint. A monolith wonder gets what a monolith actually has: era 3's ziggurat its processional stair, era 2's pyramid nothing at all, because the Great Pyramid has no stair on its outer face and one would have been Mesoamerican.

### Consequences
| | Before (round 50) | After |
|---|---|---|
| The sky | one gradient, all eras/hours/seasons | **per era · season · weather · hour** — cloud kind, cover, drift, stars, Milky Way, moon phase |
| Cloud shadows | none | **on the real ground**, moving with the cloud, strongest at broken cloud |
| Things standing beside the road | 0 | **19 kinds**, a kit per century |
| Wonders you can enter | 0/15 | **14/15** (era 2's pyramid stays solid, on purpose) |
| Facade detail kinds | 19 | **22**, three of them at eye level |
| Part roles | 20 | **21** (`iron`) |
| Geometry columns | city · backdrop · total | **city · backdrop · sky · total** |
| Triangles (era 6, the largest) | 237 632 | **243 174** (+2,3 %) |
| Draw calls | — | **unchanged in all 15 eras** (no era gained a material family) |
| Tests | 1 734 | **1 751** |

**Not done, and named rather than hidden:** Việc 5 (vines, trellises, planters, vegetable beds, street trees), Việc 6 (more resident roles and animals), Việc 7 (moss, rust, peeling paint, soot scaled by building age), Việc 8 (`#65` river/canal/estuary geometry, `#60` bridges and quays), Việc 9 (auto tour, street names, tap-while-walking, lamps pooling light, remembering where you stood). The brief said explicitly: *"Không đủ sức làm hết thì làm sâu A + B, đừng rải mỏng cả bốn"* — so the budget went to A and B in full.

### What the tests caught that reading the code did not
Five, and every one of them was invisible in a green build:
1. **The wonder entrance never fired.** Fifteen eras, zero portals, every test green — because the call sat inside `if (!mass.low)` and on an epic wonder the mass facing the street IS a low one. This is why the portal now carries `tag: 'portal'`: the side that BUILDS a thing knows what it is, and a probe that guesses from part counts answered "2" for a wonder with an entrance and "2" for one without.
2. **On the widest mass the portal came out 0,036 world units tall** — a doorway for a mouse — because a podium is declared `low` and scaled by 0,34. Only the tallest mass can hold a great door.
3. **A `glass` light in the doorway gave era 1 a material family it does not have**, +1 draw call on the very era Đàm chose as the witness for *"nothing may quietly charge itself to a century"*. And the error was not only performance: the Stone Age has no glass. It lights a doorway with FIRE.
4. **`specSpan` takes `max(w/2, d/2)`, not the depth.** A ziggurat tread 0,17 wide and 0,05 deep therefore measures as 0,17 DEEP, and era 3 read 3,908 cells against a 3,7 limit — twice — while every number in the function looked right. The clamp now asks the measuring formula its own question. (Project law #1: suspect the measuring tool first.)
5. **The wonder-symmetry test's tower heuristic aged.** It found the four corner towers by *"a `trim` part off-centre on BOTH axes can only be a tower"* — true for two years, false the moment a `trim` capital stood on a colonnade in front of a facade. The fix was not a wider threshold but a tag.

## ADR-090 — Round 50: more to see and more to do — four seasons, a handle on the clock, a walk down the street, a postcard, and insides

**Date**: 2026-09-09 · **Order**: *"VÒNG 50 — THÊM TIỂU TIẾT VÀ TÍNH NĂNG … CHỈ THÊM, KHÔNG BỚT … BỎ HẾT VIỆC NGƯỠNG VÀ TRẦN … Vòng này đo bằng đúng hai câu: thành phố có thêm bao nhiêu thứ để nhìn, và tôi làm được thêm bao nhiêu việc với nó."* Three laws only: ADR-007, determinism, and the 105 era pairs.

### Context
Rounds 47–49 built a city that is a place: fifteen grounds, motion, fire, weather. But Đàm could only ever see it at the hour it happened to be, from above, and could not keep a picture of it; and seventy-five buildings were seventy-five shells. Two debts about roof detail (`#77`, `#90(b)`) had been deferred three rounds running because they touch twelve green tests, and `#81` had been half-fixed at the symptom.

### Decisions
1. **The season is the second axis of the sky** (`season.js`). Fifteen eras × four seasons = sixty looks on machinery that already existed. `seasonLook(era, season)` is a pure table per CLIMATE (`cold · temperate · tropical · arid`) with per-era touches: sakura over Tokyo, peach over Chang'an, young rice then harvest gold in the Red River delta, snow on Stalingrad, Manchester's smog thickening in autumn. It moves leaf hue/saturation/lightness, the blossom (leaf2 becomes the blossom colour, never a new role), the ground's hue and lightness, snow cover on ground and roofs, wind, fog, and what falls (petals, leaves). Summer is the identity look — every table of rounds 47–49 was tuned on it. A sealed era freezes its own season (`museumSeason`) the way ADR-086 froze its hour.
2. **The weather gained the same axis** (`SEASON_WEATHER` per climate replaces the era's row for that phase; a cold winter turns any rain into snow). The one law of round 49 still holds by construction: `wet ≥ rain`, swept over 15 × 24 × 4 in `season.test.js`.
3. **A handle on the clock and the calendar** (`CityTimeControls`): a 0–23 h slider and four season chips under the picture. No logic of its own — `deriveDaylight(hour)`, `weatherAt(era, hour, season)` and `seasonLook` already took these as parameters. The hour commits 150 ms after the slider stops because each commit rebuilds the WebGL scene; the caption follows the thumb immediately. A museum piece has NO handle: it shows its frozen hour and season as a caption, because a slider that does nothing would be a lie about the museum.
4. **Walk mode is a mode of the same crane** (`walk.js` + `orbit.setWalk`), never a second camera — the trap `cityFocus.js` has warned about since Phase 3. The walker holds a position on the road network and produces ORBIT STATES; the crane's pitch floor and distance clamp are freed while walking and restored on exit; the lens widens (62°) and its near plane comes in (0,03). It stands on the scene's own terrain (`groundHeightAt`) — at y = 0 the eye was under the ground plate, and the first photos showed the underside of the world. Keys, buttons and the wheel walk; drag looks around; Esc and the corner button fly home through the existing focus-flight mechanism.
5. **The postcard** (`cityPostcard.js`): the scene renders and reads its canvas in the SAME turn (a WebGL drawing buffer is cleared at composite time, so a frame-late `toDataURL` returns black, and `preserveDrawingBuffer` would tax every frame of every session). A caption band names era, country, landmark, buildings, sessions, season and hour.
6. **The shells got insides** (`interiors.js`): ~60 % of non-symmetric buildings stand with the door open, and behind it a dark cavity with two or three objects — forge, shelves, table, loom, bookcase, altar, bar, bed, sacks, desk — chosen by (era, type, seed). A forge's flame carries `tag: 'fire'`, so round 49's fire layer turns it into particles, a glow at night and a flickering local light. Two clamps, both measured: the cavity is never deeper than a third of the building, and a symmetric landmark keeps its door shut.
7. **`#77` and `#90(b)` closed together, as `#77` demanded.** `ROOFTOP_MIN_SPAN` is now a RELATION, derived from the two calibrations that already existed (`CELL_PIXELS = 64`, `EYE_PIXELS = 4`), `BUILDING_SCALE`, `STACK_W_RATIO` and the close-up frame's 3,4× gain: **0,083** instead of 0,24. The LAND floor stayed at 0,24 under its own name (`ROOFTOP_LAND_SPAN`) — it decides how much ground a dwelling gets, and every dwelling ever built stands where it stands. Measured: eras losing rooftop detail went from [6, 10, 11, 13] to **[]**, worst ratio 0,844 → **1,000** (473/473 units).
8. **Every facade speaks its era** (`facadeDetail.js`): string courses, pilasters, Fachwerk framing, bracket sets, brick arches, shutters, balconies with a plant, fire escapes, downpipes, signs and vertical signs, lanterns, lamps, awnings, tile panels, niches, air-conditioners, glass fins. Three rules make it safe at this scale: every item is FLUSH with the wall (a 0,022 protrusion tipped era 5 into another cell and gave it a plinth it never had — a test about TERRAIN caught a wall ornament), only roles every era already draws, and a landmark gets only the symmetric half of the vocabulary.
9. **`#81` fixed at the root**, on Đàm's explicit order: the HEAD, not the hat. `headH`/`headW` 0,20 → **0,16** of body height (real ≈ 0,13). Every hat, helmet and nón lá is expressed in `headW`, so they all came right untouched: the brim went from 1,36× the shoulders to ≈ 1,09× (0,67× in life). The enlargement's original reason — a true-scale head is 1,8 px at 14 px tall — weakened twice: round 47 doubled the resident's size and round 50 lets Đàm walk up to them.

### Consequences
| | Before (round 49) | After |
|---|---|---|
| Looks (era × season) | 15 | **60** |
| See the city at any hour | no | **yes** — slider 0–23 h, scene rebuilt |
| Walk down the street | no | **yes** — eye level, on the roads, all 15 eras |
| Keep a picture | no | **yes** — PNG with a caption band |
| Buildings you can see into | 0/75 | **~60 % of every non-symmetric building** |
| Facade detail kinds | 0 | **18**, per-era vocabulary |
| Rooftop detail kept | 0,844 worst (4 eras losing) | **1,000 — 473/473 units** |
| Falling things | rain · drizzle · snow · sand · dust | **+ petals · leaves** |
| Triangles (era 6, the largest) | 200 308 | **237 632** (+18,6 %) |
| Draw calls | unchanged | **unchanged** (no era gained a material family) |
| 3D debts | 46 open | **43 open** — `#77` · `#81` · `#90(b)` closed |

**Not done, on purpose:** `#65` (river · canal · estuary still share one geometry) and the rest of Việc 8's ground work; more resident roles and animals (Việc 10 beyond the head fix); traces of habitation beyond round 49's life props (Việc 11). All three are additive and none is blocked — they are simply the next round's, and the budget went to Part A and the two roof debts, as the brief's own ordering asked.

### The one numeric gate, and what it caught
Four seasons are four new chances for fifteen cities to converge, so the round-47 pair measurement was
extended to run over EVERY season, on roofs AND ground (`palette3d.test.js`). It went red immediately:
in winter, **10 of the 105 pairs** fell under the eye threshold (eras 5 · 9 · 10 · 11 · 12, with 5↔9 at
1,0), because a uniform `snow: 1,0` paints every ground and roof the same white. The fix was not a
lower threshold but snow that belongs to its city — deep in Stalingrad, thinner in the Eifel, cleared
in Paris, ploughed in New York, and grey with soot in Manchester — plus 45 % of each era's own ground
saturation surviving at full cover. Re-measured: **0/105 in all four seasons**, and the gate now runs
in the suite forever.

### Tool lessons
- A walker without the ground under it stands at y = 0 and photographs the underside of the world — the scene must lend its own terrain, never a second copy.
- A wall ornament that protrudes 0,022 changed a PLINTH count: `round(specSpan × BUILDING_SCALE)` is a cliff, and anything decorative must be flush.
- `--season`, `--walk N`, `--walk-turn` and `--walk-look` were added to the preview tool so every claim in this ADR was photographed, not asserted.

---
