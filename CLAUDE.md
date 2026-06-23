# Pomodoro DC — Project Brief

## Người dùng
- Tên: Đàm (non-coder, dùng Codex + Claude Code để code)
- Giải thích đơn giản, tránh jargon kỹ thuật

## ⚠️ NGUYÊN TẮC ƯU TIÊN SỐ 1 (mọi phiên AI — quan trọng hơn mọi thứ khác)
1. **TRƯỚC khi làm:** đọc `BAN_GIAO.md` + `CLAUDE.md` (file này), RỒI đọc các file liên quan tới việc sắp làm — hiểu rõ ngữ cảnh trước, đừng sửa mò. (Hook `.claude/session-start-bangiao.sh` tự chèn BAN_GIAO.md đầu mỗi phiên, nhưng vẫn phải đọc kỹ.)
2. **SAU khi có cập nhật (dù nhỏ):** cập nhật ngay `CLAUDE.md` + `BAN_GIAO.md` **và các file liên quan khác** (README, ghi chú...) cho khớp. Làm xong việc mà chưa cập nhật tài liệu = **CHƯA XONG**.
3. Bàn giao thiết kế chi tiết nằm ở thư mục memory:
   `/Users/damduy/.claude/projects/-Users-damduy-Downloads-Claude-Code-B-n-sao-Pomodoro-Game---USING/memory/`
   (đặc biệt `upgrade-roadmap.md` cho AI Coach, `ui-review-2026-06.md` cho UI, `resonance-update.md` cho game loop).
4. Luôn chạy `git status` tươi — đừng tin ảnh chụp git cũ.

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

## Sync (đã hoàn chỉnh)
- `src/lib/supabase.js` — Supabase client
- `src/lib/syncService.js` — pull khi mở app, push debounced 5s
- `initSync()` gọi trong `App.jsx`, ở effect chạy sau khi store nạp xong (`storesHydrated`)

## Web Push iPhone (đã chạy; cần làm lại khi setup máy/dự án mới)
- Biến môi trường trên Vercel: `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (xem `.env.example`). `ANTHROPIC_API_KEY` chỉ cần nếu bật "Hỏi Claude". Khoá Supabase frontend đã hardcode, không cần đặt.
- Tạo khoá Web Push: `npm run push:keys` → dán public/private vào biến môi trường Vercel.
- Bảng + scheduler push nằm trong `supabase/*.sql` — chạy tay trong Supabase SQL editor (thiếu thì push hỏng).
- Sửa push phía trình duyệt: `public/push-worker.js` (service worker) + `public/manifest.json` (PWA).

## AI Coach + tầng engine (mảng lớn nhất, KHÔNG được bỏ qua)
App có cả một hệ "huấn luyện viên" và engine game thuần. Đây là phần lớn nhất dự án.
- **3 tầng Coach tách biệt, người dùng tự bấm** (không có bộ tự chọn):
  - (a) *Hỏi Coach* (`CoachChat.jsx`) — **2 chế độ** (toggle, mặc định Nhanh): **⚡ Nhanh** = trả lời tức thì từ số liệu, offline, không LLM (`src/engine/qa/`, `coachIntel.js`); **🧠 AI 7B** = chat tự do với LLM Qwen 7B trên máy (CHỈ desktop có WebGPU, dùng `buildLLMChatPrompt`+`COACH_CHAT_SYSTEM` ở `coachPrompt.js` + `buildAnalystContext`; tái dùng engine singleton của Coach offline → đã tải thì xài lại ngay; có lưới `hasForeignScript` + viết lại). Câu ngoài tầm Nhanh → nút "Hỏi AI trên máy (7B)" (desktop) hoặc "Hỏi Claude" (cần mạng). Cấm bịa số, cấm từ nhân-quả.
  - (b) *Coach offline* — AI thật (LLM Qwen2.5-**7B**, fallback 3B) chạy trên máy qua WebLLM, chỉ desktop, opt-in — `src/engine/llm/`. (2026-06-21 nâng mặc định 3B→7B cho khôn hơn + ít trôi tiếng Trung; cần RAM ≥16GB, tải ~4.5GB lần đầu; `LLM_MODELS` ở `coachPrompt.js`.) **Một phong cách duy nhất: PHÂN TÍCH CHUYÊN SÂU, đọc số** (KHÔNG dùng giọng cảm xúc zen/buddy/strict — đó là tầng khác). Prompt 3 phần `[1] Quan sát · [2] Mẫu hình · [3] Thử nghiệm` + ví dụ vàng + tự-kiểm, ở `COACH_OFFLINE_SYSTEM` (`coachPrompt.js`). Nạp **bản số liệu giàu** `buildAnalystContext` (`coachContext.js`) — tái dùng cả `buildCoachIntel` (hồ sơ Wilson + dự đoán) + `getTodayPaceInsight` + `getLateNightQualityDrop`, mỗi % luôn kèm cỡ mẫu, bỏ tín hiệu thiếu mẫu. Hook riêng `useAnalystContext`. Giải mã: `temperature 0.35 · top_p 0.9 · frequency_penalty 0.2 · max_tokens 700` (`webllmEngine.js`; nới hơn bản 3B vì 7B trôi rất ít). Timeout tải lần đầu 15 phút (`CoachOffline.jsx`, cho file ~4.5GB). ⚠️ **Chống "trôi" tiếng nước ngoài** (Qwen 3B hay chèn chữ Hán 小时/约…): prompt ép TIẾNG VIỆT 100% + tự-kiểm ngôn ngữ; `hasForeignScript()` (`coachPrompt.js`) bắt CJK/Hangul/Kana; `CoachOffline.jsx` tự VIẾT LẠI 1 lần nếu dính, vẫn dính → báo lỗi `error-lang` mời thử lại/Hỏi Coach. ⚠️ Đừng nhồi giọng cảm xúc vào tầng này; đừng đụng `buildCoachContext` (vẫn dùng cho Claude).
  - (c) *Hỏi Claude* — gọi `api/coach.js` (Claude Haiku 4.5), CHỈ khi người dùng bấm. Mặc định KHÔNG bật vì chưa đặt `ANTHROPIC_API_KEY` → đừng tự đề xuất hướng trả phí. Dùng `buildCoachContext` (bản gọn) qua `useCoachContext`.
- **Thẻ AI Coach (briefing)** — **(2026-06-21) phong cách ĐỌC SỐ**: câu chính + dòng phụ đều là phân tích số liệu thật, lấy từ `useCoachInsight` → `generateCoachBriefing` (`gameMath.js`) — chẩn đoán + tối đa 1 gợi ý theo số, mỗi tín hiệu kèm cỡ mẫu, không nhân-quả. Hiển thị ở `CoachCard.jsx` (`text`=câu phân tích, `reason`=cỡ mẫu nền, `tone`="đọc số"), nối tại `FocusRail.jsx` (desktop) + `FocusCoachMobile.jsx` (mobile). ⚠️ **Đã bỏ HẲN giọng cảm xúc** strict/zen/buddy khỏi thẻ này: `src/engine/coachVoice.js` + `src/hooks/useCoachVoice.js` GIỮ lại (dormant, vẫn có sim test 4104/4104) nhưng **KHÔNG còn nối vào UI**; `settingsStore.coachPersonality` orphan. Muốn xem phân tích sâu hơn → nút "Xem phân tích" (FocusReport) / "Coach offline" (LLM, mục b).
- **Engine game thuần** tách khỏi state: công thức ở `src/engine/gameMath.js` + `constants.js`, state ở `src/store/gameStore.js`. Sửa công thức → sửa ở engine, đừng nhồi vào store. Dữ liệu ngoài (Supabase/import) PHẢI đi qua `normalizePersistedGameState`.
- ⚠️ Điểm nóng: `completeFocusSession` trong `gameStore.js` rất dài (~760 dòng) — sửa cẩn thận, dễ sinh bug "dùng giá trị cũ".
- Luôn `npm test` trước khi commit (hiện 140 bài). Lưu ý: `npm test` chưa gồm `coachVoice.js` — engine giọng Coach có test riêng ở `ai-coach-sim/ai-coach.test.mjs` (chạy bằng `node ai-coach-sim/ai-coach.test.mjs`).

## Quy trình deploy
```
Sửa code → git add . && git commit -m "mô tả" && git push
→ Vercel tự deploy trong ~2 phút
→ Mọi thiết bị thấy bản mới
```
Hoặc bấm đúp file `/Users/damduy/Desktop/🚀 Deploy App.command`

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
- ✅ **Coach một nguồn duy nhất:** engine giọng Coach chỉ nằm ở `src/engine/coachVoice.js`. `ai-coach-sim/ai-coach.mjs` đã được rút gọn thành re-export (`export * from "../src/engine/coachVoice.js"`) nên KHÔNG còn bản chép đôi. Muốn sửa câu/intent/tone → chỉ sửa `coachVoice.js`, đừng dán nội dung engine vào `ai-coach.mjs`. (Bản demo trình duyệt: `node ai-coach-sim/dev-server.mjs` phục vụ từ gốc dự án để nạp được `src/engine/`.)
