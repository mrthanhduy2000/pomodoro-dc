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
- **CHỈ MỘT AI = Qwen2.5-3B chạy TRÊN MÁY** (WebLLM/WebGPU, `src/engine/llm/`). (2026-06-21 — Đàm ra lệnh "bỏ hết AI khác, chỉ giữ Qwen"; workflow 4 agent map+xoá+xây lại.) MỌI phản hồi cho người dùng đều do Qwen sinh. Vì Qwen cần WebGPU → **chỉ chạy trên máy tính**; **iPhone ẨN Coach** (CoachChat/CoachOffline tự `return null` khi `!detectWebLLMCapable`; `FocusCoachMobile.jsx` hiện dòng "Mở trên máy tính để dùng AI Coach").
  - **2 lối vào, đều là Qwen:**
    - *Hỏi Coach* (`CoachChat.jsx`) = **chat** với Qwen (`buildLLMChatPrompt` + `COACH_CHAT_SYSTEM` + `COACH_CHAT_FEWSHOT` 2 ví dụ vàng KHÔNG-số dạy văn phong, hội thoại, không ép khuôn). Có **câu hỏi mẫu** (`STARTER_CHIPS`, lúc trống) + **"Đề xuất tiếp theo"** sau mỗi câu trả lời (engine `src/engine/coachSuggest.js`, THUẦN luật, không LLM — chỉ GỢI Ý câu hỏi theo ngữ cảnh: tín hiệu user có + chủ đề vừa hỏi, bỏ câu đã hỏi).
    - *AI phân tích tổng thể* (`CoachOffline.jsx`, tên cũ "Coach offline") = Qwen viết **phân tích tổng thể 3 phần** `[1] Quan sát · [2] Mẫu hình · [3] Thử nghiệm` (`buildLLMPrompt` + `COACH_OFFLINE_SYSTEM` + ví dụ vàng + tự-kiểm).
    - Cả hai **dùng CHUNG** engine singleton `webllmEngine.js` → tải 1 lần, xài lại ngay. Nút hiện trong thẻ "AI Coach" ở `FocusRail.jsx` (chỉ khi `aiCapable`).
  - **Tầng SỐ LIỆU (KHÔNG phải AI, GIỮ LẠI làm nguồn cho Qwen):** `buildAnalystContext` (`coachContext.js`) gom các SIGNAL trong `gameMath.js` (giờ vàng, nhịp hôm nay, phiên khuya, bỏ giữa chừng, xu hướng tuần, hiệu chỉnh mục tiêu, loại bị bỏ bê…) + hồ sơ/dự đoán trong `coachIntel.js` (`buildFocusProfile`, `generatePredictions`) → mỗi % kèm cỡ mẫu, bỏ tín hiệu thiếu mẫu. Qwen chỉ **diễn đạt lại số đã-tính-sẵn**, khỏi bịa. Hook: `useAnalystContext` (`useCoachContext.js`).
  - **Giải mã** (`webllmEngine.js`): `temperature 0.3 · top_p 0.85 · frequency_penalty 0.2 · max_tokens 700`. **Chống "trôi" tiếng nước ngoài** (Qwen 3B hay chèn chữ Hán 小时/约…): prompt ép TIẾNG VIỆT 100% + tự-kiểm; `hasForeignScript()` bắt CJK/Hangul/Kana; component tự VIẾT LẠI 1 lần nếu dính.
  - ⚠️ **BUILD-SAFETY:** `@mlc-ai/web-llm` CHỈ được `import()` động trong `webllmEngine.js` (canh bởi `src/engine/llm/guard.test.js`); chunk `vendor-webllm` KHÔNG vào precache (xem `vite.config.js` globIgnores + grep `dist/sw.js`). Muốn đổi model → `LLM_MODELS` ở `coachPrompt.js` (khôn hơn→`Qwen2.5-7B` nặng ~4.5GB; ít trôi hơn→`gemma-2-2b-it`, khác họ nên phải chỉnh lại lưới chống-trôi).
- **ĐÃ GỠ HẲN (2026-06-21):** ⚡Nhanh theo luật (`src/engine/qa/`), Hỏi Claude (`api/coach.js` + `buildCoachContext`), model nhúng MiniLM + đọc-nghĩa ghi chú (`src/engine/semantic/`, `useNoteThemes`), bộ trả lời theo luật (`generateCoachBriefing`/`generateCoachInsight`, `useCoachInsight`, `CoachCard`, `FocusReport`, `useCoachIntel`), giọng cảm xúc (`coachVoice.js`, `useCoachVoice`, `ai-coach-sim/`, `coachPersonality`). Gỡ deps `@huggingface/transformers` + `@anthropic-ai/sdk` → app/cài đặt nhẹ hơn. **Đừng khôi phục các thứ này trừ khi Đàm yêu cầu.**
- **Engine game thuần** tách khỏi state: công thức ở `src/engine/gameMath.js` + `constants.js`, state ở `src/store/gameStore.js`. Sửa công thức → sửa ở engine, đừng nhồi vào store. Dữ liệu ngoài (Supabase/import) PHẢI đi qua `normalizePersistedGameState`.
- ⚠️ Điểm nóng: `completeFocusSession` trong `gameStore.js` rất dài (~760 dòng) — sửa cẩn thận, dễ sinh bug "dùng giá trị cũ".
- Luôn `npm test` trước khi commit (hiện 116 bài) + `npm run build` (xác nhận precache không có webllm).

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
