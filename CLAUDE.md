# Pomodoro DC — Project Brief

## Người dùng
- Tên: Đàm (non-coder, dùng Codex + Claude Code để code)
- Giải thích đơn giản, tránh jargon kỹ thuật

## ⚠️ HỎI TRƯỚC KHI LÀM (quy tắc tối cao — đặt trên cả NGUYÊN TẮC SỐ 1)
Phân loại lệnh của Đàm thành 2 nhóm:
- **Lệnh NGHIÊN CỨU / TÌM HIỂU / ĐỀ XUẤT / "cho ý kiến" / "theo bạn…"** → CHỈ trình bày phân tích + khuyến nghị rồi DỪNG. KHÔNG sửa code, KHÔNG commit, KHÔNG deploy. Hỏi "bạn có muốn tôi làm không?". Câu mơ hồ → coi là nghiên cứu + hỏi trước.
- **Lệnh LÀM ("làm đi", "sửa", "thêm", "đổi", "nâng cấp", "deploy"…)** → theo đúng 4 bước: (1) **giải thích NGẮN GỌN, dễ hiểu, không hàn lâm** sắp làm gì + công dụng *trước khi sửa*; (2) làm (kèm `npm test`/lint + cập nhật tài liệu); (3) giải thích *sau khi sửa* đã đổi gì + ích lợi (vẫn dễ hiểu); (4) **TỰ ĐỘNG deploy lên Vercel** (commit + push) — KHÔNG hỏi lại, vì lệnh "làm" đã gồm cho phép deploy.
- Lý do: app production của Đàm (push = Vercel deploy ra mọi thiết bị). Anh cần kiểm soát (nghiên cứu thì đừng động vào), nhưng đã ra lệnh làm thì khỏi hỏi tới lui — giải thích cho anh hiểu rồi deploy luôn. Chi tiết: memory `ask-before-acting.md`.

## ⚠️ NGÂN SÁCH TOKEN — luật đắt tiền nhất, đọc trước mọi thứ khác
Cửa sổ ngữ cảnh là tài nguyên **cạn kiệt được**, và thứ tiêu nó không phải chat của Đàm mà là
**tài liệu của chính dự án này**. Đo 2026-09-06: 20 file `.md` = **2.671.121 ký tự ≈ 1,55 triệu
token = 769% cửa sổ 200k**. Một lệnh `cat TECH_DEBT.md` = **250.000 token = 125% cửa sổ 200k**
— tức nổ cửa sổ chỉ bằng MỘT lệnh.

⚠️ **Đo bằng KÝ TỰ UNICODE (`.length`), KHÔNG bằng `wc -c`.** Tiếng Việt có dấu là 2–3 byte/ký tự
nên `wc -c` thổi phồng ~21% (`CLAUDE.md`: 37.220 ký tự nhưng 45.011 byte). Đã suýt kết luận sai
"vượt trần" vì đọc nhầm byte thành ký tự — đúng luật *"nghi công cụ đo trước, nghi mã sau"*.
Hệ số quy đổi ĐO ĐƯỢC trên tài liệu tiếng Việt dự án này: **1,72 ký tự = 1 token**.
⚠️ Và đo bằng **JS `String.length`** (đơn vị của cổng canh), không phải `len()` của Python:
mỗi emoji ngoài BMP (🗺️ 🎨 🏙️) là **2** code unit trong JS nhưng **1** code point trong Python.

| File | ký tự | ≈token | %cửa sổ 200k | LUẬT |
|---|---:|---:|---:|---|
| `TECH_DEBT.md` | 433.948 | 252k | 126% | ❌ **CẤM `cat`** — `grep -n` hoặc `sed -n 'A,Bp'` |
| `ARCHITECTURE_DECISIONS.md` | 388.555 | 226k | 113% | ❌ CẤM `cat` — `grep -n 'ADR-0NN'` |
| `CHANGELOG.md` | 266.007 | 154k | 77% | ❌ CẤM `cat` — chỉ `head -60` |
| `docs/LESSONS_3D.md` | 261.236 | 152k | 76% | ❌ CẤM `cat` — chỉ `grep` |
| `BAN_GIAO.md` | 234.342 | 136k | 68% | ❌ CẤM `cat` — **chỉ `head -60`** |
| `PERFORMANCE.md` | 168.262 | 98k | 49% | ❌ CẤM `cat` |
| `PROJECT_STRUCTURE.md` · `AI_HANDOFF_KNOWLEDGE.md` · `ARCHITECTURE.md` | ~104k mỗi file | ~60k | 30% | ⚠️ `grep` trước |

**Ba việc bắt buộc, không phải khuyến nghị:**
1. **Trước khi mở bất kỳ `.md` nào ngoài `CLAUDE.md`/`START_HERE.md`/`PHASE_RULES.md`: `grep -n`
   trước, đọc theo dòng sau.** Cần bản đồ tiêu đề để biết đọc dòng nào →
   `node scripts/doc-budget.mjs --map <file>` (in mục lục + số dòng, gần như không tốn token).
2. **Đọc code cũng vậy** — `completeFocusSession` (~760 dòng) thì đừng `cat` cả `gameStore.js`.
3. **Trần file tự-nạp có CỔNG CANH THẬT** (`scripts/docBudget.test.js`, chạy trong `npm test`):

   | File | Trần | Giá trị thật lúc đặt trần | Biên còn |
   |---|---:|---:|---:|
   | `CLAUDE.md` | 20.000 | 16.503 | 17% |
   | `START_HERE.md` | 20.000 | 18.132 | 9% |
   | `PHASE_RULES.md` | 10.000 | 6.611 | 34% |
   | `AGENTS.md` | 4.000 | 3.228 | 19% |

   Vượt = **test ĐỎ**, không phải một lời nhắc trôi qua. Kiểm bất cứ lúc nào: `node scripts/doc-budget.mjs`.
   *(Vì sao cần cổng: trần 40.000 cũ chỉ là một câu trong tài liệu, không ai canh — `START_HERE.md`
   đã âm thầm vượt trần 20.000 của nó (20.200) mà không phiên nào biết. Bài học dự án:
   **một ngưỡng không có cổng canh là một cái phễu**; **một câu tự trấn an phải được kiểm như một con số**.)*

## ⚠️ NGUYÊN TẮC ƯU TIÊN SỐ 1 (mọi phiên AI)
1. **TRƯỚC khi làm:** đọc **`START_HERE.md`** — file DUY NHẤT bắt buộc đọc mỗi phiên. Rồi
   **`PHASE_RULES.md`** nếu đang làm một phase. Mọi file khác là **KHO TRA CỨU**: chỉ mở phần
   `grep` trúng (xem NGÂN SÁCH TOKEN ở trên).
2. **SAU khi có cập nhật:** ghi `BAN_GIAO.md` + `CHANGELOG.md`. File khác **chỉ sửa khi thay đổi
   làm nội dung nó SAI SỰ THẬT** — không sửa cho đủ bộ (`PHASE_RULES.md` §5). Đổi trạng thái
   hoặc việc tiếp theo thì phải sửa `START_HERE.md`.
3. Bàn giao thiết kế chi tiết nằm ở thư mục memory trên máy Đàm:
   `/Users/damduy/.claude/projects/-Users-damduy-Downloads-Claude-Code-B-n-sao-Pomodoro-Game---USING/memory/`
   (`upgrade-roadmap.md` cho AI Coach · `ui-review-2026-06.md` cho UI · `resonance-update.md` cho game loop ·
   `ask-before-acting.md` cho quy tắc hỏi-trước). Phiên chạy trên web KHÔNG có thư mục này — đừng đi tìm.
4. Luôn chạy `git status` tươi — đừng tin ảnh chụp git cũ.
5. **File nằm ở đâu** → `PROJECT_STRUCTURE.md`. **Kiến trúc lớn / luồng dữ liệu** → `ARCHITECTURE.md`.
   Cả hai phải cập nhật cùng lúc với mọi thay đổi cấu trúc.
6. ⚠️ **File này là NGUỒN SỰ THẬT DUY NHẤT về quy tắc, cho MỌI AI** (Claude Code, Codex, ChatGPT…) —
   chữ "CLAUDE" chỉ là lịch sử. `AGENTS.md` chỉ là con trỏ về đây. **TUYỆT ĐỐI không tạo bản sao
   tài liệu quy tắc cho từng công cụ AI** — đã thử 2026-07-31 và thất bại (bản sao sinh câu vô
   nghĩa + đường dẫn `.Codex/` không tồn tại, rồi trôi khỏi bản gốc sau 5 ngày). Đó chính là điều
   **Composition over Duplication** cấm. Chi tiết: `AGENTS.md`.

## 📋 Quản trị + quy trình → **`docs/GOVERNANCE.md`** (mở khi làm task đáng kể)
Nguyên văn "PROJECT GOVERNANCE PROTOCOL" + "AI ENGINEERING PLAYBOOK" ở đó. Bảy điều cô đọng:
- **Definition of Done**: code đúng · build · test · lint · **tài liệu đồng bộ** · **project
  knowledge đồng bộ**. Thiếu 1 mục = chưa xong.
- **Bảng "loại thay đổi → tài liệu phải sửa"**: ở `docs/GOVERNANCE.md`. Đổi FLOW → `ARCHITECTURE.md` ·
  đổi cấu trúc thư mục → `PROJECT_STRUCTURE.md` · quyết định có ≥2 phương án thật → ADR mới ·
  phát hiện nợ → `TECH_DEBT.md` · mọi thay đổi → `BAN_GIAO.md`.
- **Quy trình 7 giai đoạn**: Hiểu yêu cầu → Audit → Thiết kế → Thực hiện → Self Review → Validation
  → Knowledge Update. **Bug thì sửa NGUYÊN NHÂN GỐC, không sửa triệu chứng.**
- **Kiến trúc**: Single Responsibility · High Cohesion · Low Coupling · **Reuse over Rewrite** ·
  **Composition over Duplication** · Explicit over Implicit. Không hy sinh kiến trúc lấy tốc độ.
- **Không giả định**: không chắc → đọc source; source chưa đủ → đọc tài liệu; vẫn chưa đủ → **NÓI RÕ
  điều còn thiếu**, không suy đoán rồi trình bày như sự thật.
- **Commit**: mỗi commit một mục tiêu, rollback độc lập được, không trộn thay đổi không liên quan.
- **Rủi ro thấp/trung bình phát hiện dọc đường → xử lý luôn**; rủi ro cao → hỏi trước.

### Báo cáo cuối task — MỘT bản, không phải hai (thống nhất 2026-09-06)
Trước đây có hai bản chồng nhau: "Báo cáo bàn giao 11 mục" + "TECHNICAL ADVISOR REPORT 11 mục",
tốn ~2.500 token output MỖI task để nói phần lớn cùng một chuyện. Nay:

| Loại task | Báo cáo |
|---|---|
| Sửa lỗi nhỏ · mỹ thuật 3D · một việc gọn | **5 dòng** (`PHASE_RULES.md` §6): Đã làm · Ảnh/bằng chứng · Chưa xong · Rủi ro · Kế tiếp (đúng MỘT đề xuất) |
| Kiến trúc · hạ tầng · Supabase/sync · database · AI Coach · deploy · bảo mật · refactor lớn · sự cố | **TECHNICAL ADVISOR REPORT 11 mục** (mẫu đầy đủ ở `docs/GOVERNANCE.md`), 100% tiếng Việt, ≤2 trang A4 |

Không bao giờ viết cả hai cho cùng một task.
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

## Hạ tầng + vận hành → chi tiết ở **`docs/OPERATIONS.md`**
| Thứ | Chi tiết |
|-----|----------|
| App URL | `https://pomodoro-dc.vercel.app` (nhánh `main` mới ra production) |
| GitHub | `https://github.com/mrthanhduy2000/pomodoro-dc` |
| Supabase | `https://jcefdsdccmnmqvuwelmm.supabase.co` — bảng `game_state`, `timer_live` |
| Mac menu bar | Electron companion (`node_modules/electron/dist/…/Electron <thư-mục-dự-án>`) |

Tám luật đã trả giá bằng sự cố thật — **chi tiết "vì sao" ở `docs/OPERATIONS.md`, đừng gỡ mà chưa đọc**:
1. ⚠️ **Chỉ `main` lên production.** Nhánh phụ = chỉ có Preview. Làm xong thứ Đàm cần THẤY →
   **TỰ gộp `main` rồi push, KHÔNG hỏi** (Đàm chốt 2026-08-22). Chỉ dừng hỏi khi gỡ xung đột đòi
   vứt bỏ công của phiên khác. **Phải BÁO RÕ những gì NGOÀI phần việc của mình cũng vừa lên production.**
2. ⚠️ **Push xong PHẢI xác nhận Vercel hiện "Ready"** — commit thành công ≠ đã lên production
   (commit `8ee264d` fail build âm thầm, tính năng chết 25/6–11/7 mà tài liệu ghi "hoàn tất").
3. ⚠️ **Vercel Hobby: tối đa 12 Serverless Function.** Mọi `.js` trực tiếp trong `api/` (đệ quy) đều
   tính là 1 function, TRỪ tên bắt đầu bằng `_`. **Test API LUÔN đặt trong `api/_tests/`.**
   Hiện có **10 function thật** — đếm lại: `find api -type f -name "*.js" ! -path "api/_*"`.
4. ⚠️ **Sync ngừng chạy → kiểm Supabase project TRƯỚC, không phải code** (Free tier tự pause vì
   vượt 0.5 GB hoặc im lặng ~7 ngày; đã có cron dọn log + `api/keepalive.js` chống cả hai).
5. ⚠️ **Ghi cloud là compare-and-swap theo cột `version` do trigger SERVER tăng** ("first action
   wins"). Ghi bị từ chối = máy đó THUA, phải `pullFromCloud()`, **tuyệt đối không ép ghi đè**.
   Deploy code mới PHẢI chạy `supabase/game_state_version.sql` trước.
6. ⚠️ **4 lưới an toàn quanh CAS (bản vá C1)** — flush khi rời app · `hasMeaningfulState()` ·
   nhánh `known < 0` đọc cloud trước · bắt lỗi `42703`. **Đừng gỡ mà không đọc `docs/OPERATIONS.md`.**
7. ⚠️ **Electron tray: 4 cái bẫy** (applet đời cũ · launchd không chạy đường dẫn tiếng Việt ·
   không có khoá chống chạy trùng → 2 icon · "ảnh trong suốt" ≠ "không có ảnh").
8. ⚠️ **Thiếu `GEMINI_API_KEY` ở Vercel env ⇒ AI Coach KHÔNG chạy** (đã gỡ hẳn engine on-device).

## 🗺️ BẢN ĐỒ TÀI LIỆU — file nào tự nạp, file nào phải tự mở
Claude Code / Codex **TỰ NẠP 100% `CLAUDE.md`** mỗi phiên trước khi AI kịp quyết định gì ⇒ câu
*"CLAUDE.md là kho tra cứu, chỉ grep phần cần"* là **bất khả thi**. Cách duy nhất làm nhẹ phiên là
**TÁCH FILE**. Đã làm hai đợt: 190.700 → 21.600 token (2026-09-06 sáng, tách `LESSONS_3D`/`AI_COACH`)
→ **9.000 token** (2026-09-06 chiều, tách `GOVERNANCE`/`OPERATIONS`). Không xoá một chữ nào.

| File | Cơ chế | Khi nào mở |
|---|---|---|
| `CLAUDE.md` (file này) | **TỰ NẠP mỗi phiên** — trần **20.000 ký tự**, có cổng canh | luôn có sẵn |
| `START_HERE.md` | bắt buộc đọc mỗi phiên — trần **20.000** | mở phiên |
| `PHASE_RULES.md` | đọc khi đang làm một phase — trần **10.000** | làm phase |
| `AGENTS.md` | con trỏ cho Codex — trần **4.000** | Codex mở phiên |
| **`docs/GOVERNANCE.md`** | mở khi cần | task đáng kể · cần mẫu báo cáo 11 mục |
| **`docs/OPERATIONS.md`** | mở khi cần | sync · deploy · `api/` · push · tray |
| `docs/LESSONS_3D.md` · `docs/AI_COACH.md` | **`grep`, ĐỪNG đọc trọn** | sửa 3D · sửa Coach |
| `TECH_DEBT.md` · `ARCHITECTURE_DECISIONS.md` · `PERFORMANCE.md` · `BAN_GIAO.md` · `CHANGELOG.md` | **`grep`/`head`, CẤM đọc trọn** | tra cứu |

⚠️ **Thêm bài học mới thì viết vào file chuyên đề** (`docs/LESSONS_3D.md` cho 3D, `docs/OPERATIONS.md`
cho hạ tầng, `docs/GOVERNANCE.md` cho quy trình), rồi — **chỉ khi nó đổi một QUY TẮC** — thêm MỘT DÒNG
trỏ ở đây. Đừng để file này phình lại: nó là thứ duy nhất tính tiền ở **mọi** phiên.
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

## Việc đang dở & sắp tới
→ Xem **`BAN_GIAO.md`** (mục "Sẽ làm tiếp" + "Nhật ký cập nhật"). Web Push iPhone đã xong & deploy.

## KHÔNG làm những thứ này
- ❌ Không biến Electron thành app chính riêng biệt.
- ❌ Không dùng localhost / serve-dist.mjs / LaunchAgent làm luồng chạy chính.
- ❌ Không nhân đôi logic game giữa web và Electron. Logic chính nằm ở web app.
- ❌ KHÔNG start phiên focus trên dev/localhost — dev dùng chung Supabase row với production, sẽ ghi đè dữ liệu thật của Đàm.

