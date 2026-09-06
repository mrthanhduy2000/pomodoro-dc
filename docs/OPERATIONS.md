# OPERATIONS — hạ tầng, deploy, sync, push, Electron tray, MCP

> **Tách khỏi `CLAUDE.md` ngày 2026-09-06** (cùng lý do với `docs/GOVERNANCE.md`): giữ nguyên văn
> mọi cái bẫy đã trả giá, nhưng không bắt MỌI phiên phải nạp chúng.
> Các LUẬT rút ra vẫn nằm ở `CLAUDE.md` dạng một dòng — file này là phần "vì sao" + cách làm.
>
> **Mở file này khi:** đụng Supabase/sync · deploy trục trặc · thêm route `api/` · sửa Web Push ·
> sửa Electron tray/menu bar · setup lại máy hoặc dự án mới.

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


## Lưu ý kỹ thuật
- `npm install` cần flag `--legacy-peer-deps`
- Electron còn liên quan tới menu bar Mac. Đừng xoá hoặc bỏ qua khi sửa timer/tray.
- `serve-dist.mjs` và LaunchAgent là luồng local cũ, chỉ đụng khi thật sự cần.
- ⚠️ **(Lịch sử, đã gỡ)** Từng có `coachVoice.js` (giọng cảm xúc) + thư mục `ai-coach-sim/` (bản demo trình duyệt) — cả hai đã bị xoá hẳn ngày 2026-06-21 (xem mục "ĐÃ GỠ HẲN" ở trên). KHÔNG còn `src/engine/coachVoice.js` hay `ai-coach-sim/` trong repo — đừng tạo lại trừ khi Đàm yêu cầu.
