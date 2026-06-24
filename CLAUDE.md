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
    - *Hỏi Coach* (`CoachChat.jsx`) = **chat** với Qwen theo **khung CHUYÊN GIA 3 nhịp** (quan sát số → xu hướng/chân dung → 1 lời khuyên), `buildLLMChatPrompt` + `COACH_CHAT_SYSTEM`. ⚠️ **KHÔNG few-shot** (đã bỏ `COACH_CHAT_FEWSHOT` — Qwen 3B nhái khuôn → bịa). Có luật **"ĐỌC ĐÚNG GIÁ TRỊ"** (chép NỘI DUNG sau dấu hai chấm; ví dụ trong prompt dùng PLACEHOLDER X/A/B/C — KHÔNG để số cụ thể, vì 3B từng chép luôn số trong ví dụ ra) + luật **"TÊN MỤC ≠ NỘI DUNG"** (tên loại việc thật LUÔN trong ngoặc kép). Có **câu hỏi mẫu** (`STARTER_CHIPS`) + **"Đề xuất tiếp theo"** theo ngữ cảnh (`src/engine/coachSuggest.js`, THUẦN luật).
      - ⚠️ **LƯỚI CHẶN-BỊA-SỐ (tất định, tuyến phòng thủ chính chống fake)**: `findFabricatedNumbers`/`hasFabricatedNumbers` (`coachPrompt.js`) — mọi con số KÈM đơn vị-dữ-liệu (giờ/phút/phiên/ngày/tuần/lần/%/h) model viết ra mà KHÔNG có trong bảng → coi là BỊA. `CoachChat.jsx`: dính chữ-lạ HOẶC số-bịa → viết lại 1 lần; vẫn bịa → KHÔNG hiện câu bịa, thay bằng câu "chưa đủ dữ liệu". Chuẩn hoá `h`↔`giờ`, dấu phẩy↔chấm; số trần (không đơn vị) được miễn trừ. Chạy được ở CI (không cần WebGPU). Test: `src/engine/llm/coachGuard.test.js`. KHÔNG bắt "đọc nhầm nhãn" (số có thật) — cái đó do prompt + định dạng bảng lo.
    - *AI phân tích tổng thể* (`CoachOffline.jsx`, tên cũ "Coach offline") = Qwen viết **phân tích 4 phần** `[1] Quan sát · [2] Xu hướng · [3] Chân dung & mẫu hình · [4] Thử nghiệm` (`buildLLMPrompt` + `COACH_OFFLINE_SYSTEM` + ví dụ vàng + tự-kiểm).
    - Cả hai **dùng CHUNG** engine singleton `webllmEngine.js` → tải 1 lần, xài lại ngay. Nút hiện trong thẻ "AI Coach" ở `FocusRail.jsx` (chỉ khi `aiCapable`).
  - **Tầng SỐ LIỆU (KHÔNG phải AI, GIỮ LẠI làm nguồn cho Qwen):** `buildAnalystContext` (`coachContext.js`) gom các SIGNAL trong `gameMath.js` (giờ vàng, nhịp hôm nay, phiên khuya, bỏ giữa chừng, xu hướng tuần, hiệu chỉnh mục tiêu, loại bị bỏ bê…) + hồ sơ/dự đoán trong `coachIntel.js` (`buildFocusProfile`, `generatePredictions`) → mỗi % kèm cỡ mẫu, bỏ tín hiệu thiếu mẫu. Qwen chỉ **diễn đạt lại số đã-tính-sẵn**, khỏi bịa. Hook: `useAnalystContext` (`useCoachContext.js`).
    - ⚠️ **ĐỊNH DẠNG DÒNG chống đọc-nhầm + guard-safe** (2026-06-22): dòng "Loại việc" đã TÁCH MỖI LOẠI MỘT DÒNG, tên loại trong NGOẶC KÉP, bỏ dấu `|` (vd `Loại việc dành nhiều thời gian nhất là "Học": 13.3 giờ qua 18 phiên…` + `Loại việc "Làm Việc": …`); dòng khuya đổi nhãn → `Tỉ lệ đạt mục tiêu của phiên làm sau 22 giờ đêm: …%`; mọi `′` (prime) ĐỔI sang chữ "phút" (ở `coachContext.js` + `BAND_LABEL`/momentum blurb trong `coachIntel.js`) để guard nhận đơn vị + model khỏi đổi ký tự lạ. ⚠️ Đổi chữ các dòng này phải sửa kèm **marker `coachSuggest.js`** (`category`=`startsWith('loại việc')`, `lateNight`=`'phiên làm sau'`+`'so với ban ngày'`) + fixture `coachSuggest.test.js` + assertion `coachContext.analyst.test.js`.
    - **"Chân dung của bạn"** (HIỂU CHỦ): dòng tổng hợp đặc điểm ổn định (buổi mạnh, độ dài hợp, độ đều, loại việc chủ đạo, tỉ lệ phiên sâu) — ghép từ `profile`, mỗi mảnh kèm cỡ mẫu.
    - **"Xu hướng dài hạn"** (HỌC THEO THỜI GIAN): `getMultiWeekTrend` (`gameMath.js`) — đi lên/xuống/giữ qua nhiều tuần. ⚠️ CHỈ tính tuần CÓ dữ liệu (tuần không mở app ≠ làm 0 phút — tránh số 0 "ma"), cần **≥3 tuần có dữ liệu** (minWeeks=3) mới hiện; `weekKeysDesc` (4 tuần) dựng bằng Date Ở HOOK (`useCoachContext`), engine vẫn thuần.
  - **Giải mã** (`webllmEngine.js`): `temperature 0.2 · top_p 0.8 · frequency_penalty 0.2 · max_tokens 700` (hạ từ 0.3/0.85 ngày 2026-06-22 — đây là tác vụ CHÉP-LẠI-SỐ, nhiệt thấp thì 3B ít chế số/trôi). **Chống "trôi" tiếng nước ngoài** (Qwen 3B hay chèn chữ Hán 小时/约…): prompt ép TIẾNG VIỆT 100% + tự-kiểm; `hasForeignScript()` bắt CJK/Hangul/Kana; component tự VIẾT LẠI 1 lần nếu dính.
  - ⚠️ **BUILD-SAFETY:** `@mlc-ai/web-llm` CHỈ được `import()` động trong `webllmEngine.js` (canh bởi `src/engine/llm/guard.test.js`); chunk `vendor-webllm` KHÔNG vào precache (xem `vite.config.js` globIgnores + grep `dist/sw.js`). Muốn đổi model → `LLM_MODELS` ở `coachPrompt.js` (khôn hơn→`Qwen2.5-7B` nặng ~4.5GB; ít trôi hơn→`gemma-2-2b-it`, khác họ nên phải chỉnh lại lưới chống-trôi).
- **ĐÃ GỠ HẲN (2026-06-21):** ⚡Nhanh theo luật (`src/engine/qa/`), Hỏi Claude (`api/coach.js` + `buildCoachContext`), model nhúng MiniLM + đọc-nghĩa ghi chú (`src/engine/semantic/`, `useNoteThemes`), bộ trả lời theo luật (`generateCoachBriefing`/`generateCoachInsight`, `useCoachInsight`, `CoachCard`, `FocusReport`, `useCoachIntel`), giọng cảm xúc (`coachVoice.js`, `useCoachVoice`, `ai-coach-sim/`, `coachPersonality`). Gỡ deps `@huggingface/transformers` + `@anthropic-ai/sdk` → app/cài đặt nhẹ hơn. **Đừng khôi phục các thứ này trừ khi Đàm yêu cầu.**
- **Engine game thuần** tách khỏi state: công thức ở `src/engine/gameMath.js` + `constants.js`, state ở `src/store/gameStore.js`. Sửa công thức → sửa ở engine, đừng nhồi vào store. Dữ liệu ngoài (Supabase/import) PHẢI đi qua `normalizePersistedGameState`.
- ⚠️ Điểm nóng: `completeFocusSession` trong `gameStore.js` rất dài (~760 dòng) — sửa cẩn thận, dễ sinh bug "dùng giá trị cũ".
- Luôn `npm test` trước khi commit (hiện 136 bài) + `npm run build` (xác nhận precache không có webllm). Công cụ mắt-soi bảng số liệu Qwen nhận: `node --import ./scripts/register-esm-loader.mjs scripts/coach-sample.mjs` (dựng lịch sử mẫu ~24 giờ + in `buildAnalystContext`).

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
