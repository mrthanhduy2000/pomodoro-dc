# AI Onboarding — Pomodoro DC
### (Đọc trong 10–15 phút để có đủ ngữ cảnh làm việc ngay — không cần audit source code)

> File này là bản NHANH. Nếu cần hiểu sâu một chủ đề cụ thể (domain đầy đủ, lịch sử quyết định chi
> tiết, mọi luồng dữ liệu), đọc `AI_HANDOFF_KNOWLEDGE.md` (bản đầy đủ, ~20.000 từ, 18 phần). File
> này chỉ tồn tại để bạn KHÔNG PHẢI đọc bản đầy đủ đó ngay từ đầu — đọc file này trước, chỉ mở
> bản đầy đủ khi cần đào sâu một phần cụ thể.

## Project là gì, trong 3 câu

Một app Pomodoro (đếm giờ tập trung) được "game hoá" theo phong cách xây dựng văn minh (XP/EP/kỹ
năng/công trình/di vật/kỷ nguyên/prestige) — mỗi phút tập trung THẬT là nguyên liệu duy nhất, không
gì mua được bằng tiền hay cheat được. Có một lớp AI Coach (Gemini) đọc lại lịch sử thật để đưa ra
nhận xét cá nhân hoá, với lưới chống-bịa số rất kỹ (niềm tin là tài sản quý nhất của tính năng này).
Chỉ có **MỘT người dùng thật** (Đàm, non-coder, dùng Codex+Claude Code để phát triển) — không phải
SaaS, không multi-tenant, mọi rủi ro dữ liệu là rủi ro với dữ liệu THẬT của đúng một người.

## Đọc gì trước khi làm bất cứ việc gì (bắt buộc, theo thứ tự)

1. `BAN_GIAO.md` — trạng thái hiện tại, việc đang dở, nhật ký gần nhất (luôn đọc đầu tiên).
2. `CLAUDE.md` — quy tắc bắt buộc (đặc biệt mục "HỎI TRƯỚC KHI LÀM" — phân loại lệnh
   nghiên-cứu-vs-làm — và "Project Governance Protocol"). Đây là quy tắc quan trọng hơn mọi thứ.
3. File này, rồi `ARCHITECTURE.md` (bức tranh lớn) + `PROJECT_STRUCTURE.md` (bản đồ thư mục).

## Kiến trúc — nhìn nhanh

```
UI (React/Vite)  →  Zustand store (gameStore.js)  →  engine thuần (src/engine/, test được độc lập)
       │                                                        │
       ├── src/lib/syncService.js ──→ Supabase game_state (version compare-and-swap)
       ├── src/lib/timerLiveService.js ──→ Supabase timer_live ──→ Electron tray (Realtime)
       └── src/engine/coach/ ──→ api/coach.js (server) ──→ Gemini
```

- **Frontend**: React+Vite+PWA, deploy tĩnh trên Vercel. State: 2 Zustand store
  (`gameStore.js` khổng lồ + `settingsStore.js` nhỏ), persist vào `localStorage`.
- **"Backend"**: chỉ 10 Vercel Serverless Functions (`api/`) — gọi AI hộ client (giấu key) + gửi
  push. KHÔNG chứa business logic game.
- **Supabase**: 3 vai trò tách biệt — kho đồng bộ (`game_state`, 1 dòng), kênh realtime cho
  Electron tray (`timer_live`, 1 dòng), cron nội bộ (pg_cron, dự phòng gửi push mỗi 5s).
- **Electron**: CHỈ hiện đồng hồ tray trên Mac, KHÔNG chứa logic game riêng — tuyệt đối không được
  nhân đôi logic vào đây.
- **AI**: 1 cổng duy nhất (Gemini, qua `api/coach.js`), model-agnostic ở tầng "bộ não"
  (`src/engine/coach/`) — nguyên tắc tối thượng: **AI chỉ diễn đạt lại số đã tính sẵn, không bao
  giờ tự tính**.

Chi tiết đầy đủ từng luồng (Timer/Sync/Notification/AI Coach...): `ARCHITECTURE.md` (súc tích) hoặc
`AI_HANDOFF_KNOWLEDGE.md` Phần 2/5 (đầy đủ nhất).

## Module nào quan trọng nhất, độ rủi ro khi sửa

| Module | Vai trò | Rủi ro khi sửa |
|---|---|---|
| `src/store/gameStore.js` (~6.000 dòng) | Toàn bộ state+action game — "God File" có chủ đích chưa tách | **Rất cao** — action `completeFocusSession` (~760 dòng) đọc/ghi hàng chục slice |
| `src/engine/gameMath.js` | Mọi công thức thuần (thưởng, streak, softcap, tín hiệu phân tích) | **Cao** — sai công thức ảnh hưởng dây chuyền cả game lẫn AI Coach |
| `src/engine/coach/guard.js` | Lưới chống-bịa số của AI Coach | **Cao** — mọi thay đổi PHẢI verify lại `eval.test.js` (BẮT%/BÁO NHẦM%) không tụt |
| `src/lib/syncService.js` | Đồng bộ "First Action Wins" | **Rất cao** — từng có lỗ hổng gây mất dữ liệu thật, xem ADR-004 |
| `src/hooks/useTimer.js` + `PomodoroEngine.jsx` | State machine đồng hồ chính | **Cao** — logic tính elapsed-time dựa mốc gốc + bù pause rất tinh vi |
| `api/push/dispatch.js` | Gửi push, chống gửi trùng | Trung bình — logic claim atomic + `isSessionEndEvent` là phần tinh vi nhất |
| `src/components/StatsDashboard.jsx` (~4.900 dòng) | Tab Thống kê | Trung bình — lớn nhưng chủ yếu hiển thị, không ghi state game |

Danh sách đầy đủ: `AI_HANDOFF_KNOWLEDGE.md` Phần 9.

## Technical debt cần biết ngay

Xem đầy đủ ở `TECH_DEBT.md`. Đáng chú ý nhất: **nghi vấn 3 kỹ năng prestige (nhánh Thăng Hoa)
không thực sự được nối dây vào `triggerPrestige()`** dù mô tả hứa hẹn đặc quyền — CHƯA xác minh
chắc chắn, ưu tiên trung bình-cao vì ảnh hưởng trực tiếp trải nghiệm/niềm tin. Hiện tại **0 mục
Priority High/Critical** — chưa tới ngưỡng đề xuất Maintenance Sprint (8–10 mục).

## Những quyết định kiến trúc PHẢI hiểu trước khi động vào vùng liên quan

Đầy đủ ở `ARCHITECTURE_DECISIONS.md`. Tóm tắt 3 cái quan trọng nhất:
1. **Sync "First Action Wins"** (version phía server, KHÔNG phải timestamp client) — đã từng gây
   mất dữ liệu thật khi dùng cách cũ. ĐỪNG đề xuất quay lại so sánh timestamp.
2. **AI Coach chỉ Gemini, gỡ hẳn Qwen/WebLLM** — đánh đổi có chủ đích (mất mạng = Coach ngừng) để
   đổi lấy chạy được trên iPhone + nhẹ hơn. ĐỪNG khôi phục Qwen trừ khi được yêu cầu rõ ràng.
3. **`api/_lib/`+`api/_tests/` tiền tố gạch dưới** — Vercel Hobby giới hạn 12 function, coi mọi
   `.js` trực tiếp trong `api/` là 1 function trừ thư mục bắt đầu bằng `_`. Test API mới LUÔN đặt
   trong `api/_tests/`.

## File/vùng tuyệt đối không nên sửa nếu chưa hiểu rõ

- `src/lib/syncService.js` — đừng thêm bất kỳ đường ghi trực tiếp nào vào `game_state` bỏ qua điều
  kiện `version`.
- Đừng gộp `buildAchievementSnapshot` (gameStore.js) và `buildAchievementSnapshotForReplay`
  (achievementTimeline.js) — trông giống trùng lặp nhưng phục vụ 2 mục đích thuật toán khác nhau
  (xem ADR-001).
- Đừng nới lỏng ngưỡng BÁO NHẦM=0% của bộ chấm điểm AI Coach (`src/engine/coach/eval.test.js`).
- Đừng bắt đầu một phiên tập trung THẬT trên dev/localhost — dev dùng CHUNG dòng Supabase với
  production, sẽ ghi đè dữ liệu thật.
- Đừng biến Electron thành app chính riêng biệt hay nhân đôi logic game vào đó.

Danh sách đầy đủ 14 mục: `AI_HANDOFF_KNOWLEDGE.md` Phần 14.

## Giả định quan trọng mà toàn hệ thống đang dựa vào

- Mọi "ngày"/"tuần" trong app đều tính theo **giờ Việt Nam (UTC+7) cố định**, không theo giờ trình
  duyệt hay UTC — hardcode có chủ đích cho một app 1-người-dùng-ở-Việt-Nam.
- Mọi hàm trong `src/engine/` là THUẦN — không gọi `Date.now()`/`Math.random()` trực tiếp, nhận
  qua tham số — để giữ khả năng test xác định (deterministic).
- Mọi trạng thái "đã hoàn thành/đã nhận" (nhiệm vụ, streak, thành tích) LUÔN được tái tính từ
  `history` thật mỗi lần đọc — KHÔNG BAO GIỜ tin trạng thái đã lưu là sự thật tuyệt đối.
- Dữ liệu từ 3 nguồn (localStorage/Supabase/import file) đều PHẢI đi qua đúng MỘT hàm
  `normalizePersistedGameState` trước khi vào state sống.

## Bài học lớn nhất trong lịch sử dự án (đọc kỹ, đừng lặp lại)

1. **"Code xanh + commit thành công + test pass" KHÔNG có nghĩa đã thực sự lên production.** Một
   lần build fail do vượt trần Vercel function từng khiến một tính năng "hoàn tất" không hề chạy
   thật suốt 2 tuần rưỡi mà không ai biết. LUÔN xác nhận tab Deployments trên Vercel hiện "Ready".
2. **Đừng quay lại sync dựa timestamp client** — đây chính xác là lỗ hổng đã gây mất 1 phiên tập
   trung thật không thể phục hồi.
3. **Đừng đặt số cụ thể trong ví dụ minh hoạ (few-shot) cho AI** nếu model có xu hướng nhái khuôn
   — từng khiến model chép thẳng số ví dụ ra làm câu trả lời "thật".
4. **Phân loại lệnh "nghiên cứu" vs "làm" trước khi hành động** — nghiên cứu = chỉ trình bày rồi
   dừng, KHÔNG tự sửa/deploy. Câu mơ hồ → mặc định coi là nghiên cứu + hỏi lại.

## Nếu cần làm gì tiếp theo

- **Debug**: xác định trước lỗi là TÍNH SỐ SAI (mở `gameMath.js`/`gameStore.js`) hay HẠ TẦNG (kiểm
  tra Supabase/Vercel dashboard TRƯỚC khi nghi ngờ code) hay AI COACH (kiểm tra API key/quota Gemini
  trước khi nghi ngờ guard/prompt).
- **Thêm feature**: xác nhận đây là lệnh "làm" rõ ràng (không mơ hồ) trước. Logic/số liệu mới →
  viết hàm thuần trong `src/engine/` trước (kèm test), rồi mới nối vào store.
- **Route API mới**: nhớ đếm lại `find api -type f -name "*.js" ! -path "api/_*"` (phải ≤12), đặt
  test trong `api/_tests/`.
- Xem đầy đủ lộ trình tiếp quản (ngày 1, ngày 2, ưu tiên...): `AI_HANDOFF_KNOWLEDGE.md` Phần 16.

## Definition of Done cho MỌI task (Project Governance Protocol)

Một task chỉ hoàn thành khi: source code đúng + build/test/lint xanh + **Documentation đã đồng bộ**
(README/ARCHITECTURE/PROJECT_STRUCTURE/CHANGELOG/MIGRATION nếu áp dụng) + **Project Knowledge đã
đồng bộ** (ARCHITECTURE_DECISIONS.md nếu có quyết định mới, TECH_DEBT.md nếu phát hiện nợ mới,
BAN_GIAO.md luôn luôn). Chi tiết đầy đủ + bảng "loại thay đổi → tài liệu cần cập nhật" +
checklist self-audit + mẫu báo cáo bàn giao cuối phiên: xem `CLAUDE.md` mục "Project Governance
Protocol".

## Quy trình làm việc từng bước (AI Engineering Playbook)

Governance Protocol ở trên trả lời "tài liệu nào cần đồng bộ" — **`CLAUDE.md` mục "AI Engineering
Playbook"** trả lời "làm MỘT task cụ thể theo trình tự nào" (7 giai đoạn: Hiểu yêu cầu → Audit →
Thiết kế → Thực hiện → Self Review → Validation → Knowledge Update, cộng trình tự riêng cho từng
loại task Feature/Bug Fix/Refactor/Architecture Change). Nguyên tắc đáng nhớ nhất: **"không giả
định, không suy diễn"** — không chắc thì đọc code, code chưa đủ thì đọc tài liệu, tài liệu chưa đủ
thì NÓI RÕ điều còn thiếu thay vì tự đoán rồi trình bày như sự thật (đúng tinh thần chống-bịa đã
áp dụng cho AI Coach, giờ áp dụng lại cho chính AI đang code).
