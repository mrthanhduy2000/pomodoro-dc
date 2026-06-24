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
- Biến môi trường trên Vercel: `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, **`GEMINI_API_KEY`** (AI Coach đám mây — lấy free ở aistudio.google.com; thiếu → Coach rơi về Qwen on-device; `GEMINI_MODEL` tuỳ chọn, mặc định `gemini-2.5-flash`). Xem `.env.example`. Khoá Supabase frontend đã hardcode, không cần đặt.
- Tạo khoá Web Push: `npm run push:keys` → dán public/private vào biến môi trường Vercel.
- Bảng + scheduler push nằm trong `supabase/*.sql` — chạy tay trong Supabase SQL editor (thiếu thì push hỏng).
- Sửa push phía trình duyệt: `public/push-worker.js` (service worker) + `public/manifest.json` (PWA).

## AI Coach + tầng engine (mảng lớn nhất, KHÔNG được bỏ qua)
App có cả một hệ "huấn luyện viên" và engine game thuần. Đây là phần lớn nhất dự án.
- ⚠️ **2 ENGINE (2026-06-24 — Đàm đổi hướng): GEMINI (đám mây) là CHÍNH + Qwen on-device làm DỰ PHÒNG.** Lý do: 3B yếu + ăn RAM/đĩa; Gemini khôn hơn, không tốn máy, **CHẠY CẢ iPhone**.
  - **Cổng đám mây**: `api/coach.js` (Vercel serverless) giữ `GEMINI_API_KEY` ở server (KHÔNG lộ ra client), map `{system, messages}` → Gemini `generateContent`. Client gọi qua `src/engine/llm/cloudEngine.js` (`generateCloud`). Pure helpers `toGeminiBody`/`extractGeminiText`/`shouldFallback` test ở `api/coach.test.js`.
    - **Model: CHÍNH `gemini-2.5-flash` → DỰ PHÒNG `gemini-2.5-flash-lite`** (đổi qua env `GEMINI_MODEL`/`GEMINI_MODEL_FALLBACK`). `callModel`: chính thử-lại 1 lần khi 503/500; nếu vẫn `shouldFallback` (503/500/**429** hết-lượt) → tự gọi model dự phòng (lite ổn định + giới hạn free rộng hơn). ⚠️ **2.5 bật "thinking" mặc định → ép `thinkingConfig.thinkingBudget: 0`** (tác vụ chép-số, nếu để thinking ON nó ăn hết `maxOutputTokens` làm câu CỤT/RỖNG).
  - **Luồng**: CoachChat/CoachOffline gọi **Gemini trước**; lỗi (chưa có key / hết quota / mất mạng) → **rơi về Qwen trên máy** (chỉ desktop có WebGPU; iPhone không có Qwen → hiện thông báo lỗi nhẹ). KHÔNG còn warm-prefetch Qwen (không tải model nặng lên máy nữa) — Qwen chỉ tải khi đám mây hỏng.
  - **iPhone NAY DÙNG ĐƯỢC Coach** (qua Gemini): bỏ `if(!capable) return null`; `FocusRail` bỏ gate `aiCapable`; `FocusCoachMobile.jsx` render thẳng CoachChat+CoachOffline (App.jsx truyền goalProps). `detectWebLLMCapable` giờ CHỈ quyết định "có Qwen dự phòng không".
  - ⚠️ **MỌI prompt + lưới chống-bịa + tầng số liệu GIỮ NGUYÊN** (model-agnostic) → chuyển sang Gemini 100%, chạy tốt hơn (Gemini bám luật chuẩn hơn 3B). Cần `GEMINI_API_KEY` trong Vercel env (Đàm tự lấy free ở aistudio.google.com); thiếu key → tự rơi Qwen.
  - **(Lịch sử)** Trước 2026-06-24: "CHỈ Qwen2.5-3B on-device, iPhone ẨN Coach" (2026-06-21). Nay đảo lại theo lệnh Đàm vì 3B ngu + tốn máy.
  - **2 lối vào, đều dùng Gemini (dự phòng Qwen):**
    - *Hỏi Coach* (`CoachChat.jsx`) = **chat** với Qwen theo **khung CHUYÊN GIA 3 nhịp** (quan sát số → xu hướng/chân dung → 1 lời khuyên), `buildLLMChatPrompt` + `COACH_CHAT_SYSTEM`. ⚠️ **KHÔNG few-shot** (đã bỏ `COACH_CHAT_FEWSHOT` — Qwen 3B nhái khuôn → bịa). Có luật **"ĐỌC ĐÚNG GIÁ TRỊ"** (chép NỘI DUNG sau dấu hai chấm; ví dụ trong prompt dùng PLACEHOLDER X/A/B/C — KHÔNG để số cụ thể, vì 3B từng chép luôn số trong ví dụ ra) + luật **"TÊN MỤC ≠ NỘI DUNG"** (tên loại việc thật LUÔN trong ngoặc kép). Có **câu hỏi mẫu** (`STARTER_CHIPS`) + **"Đề xuất tiếp theo"** theo ngữ cảnh (`src/engine/coachSuggest.js`, THUẦN luật).
      - ⚠️ **LƯỚI CHẶN-BỊA-SỐ (tất định, tuyến phòng thủ chính chống fake)**: `findFabricatedNumbers`/`hasFabricatedNumbers` (`coachPrompt.js`) — mọi con số KÈM đơn vị-dữ-liệu (giờ/tiếng/phút/phiên/ngày/tuần/lần/%/h) model viết ra mà KHÔNG có trong bảng → coi là BỊA. Chuẩn hoá `h`/`tiếng`↔`giờ`, dấu phẩy↔chấm; số trần (không đơn vị) được miễn trừ; GIỮ báo làm-tròn (13.3≠13). Chạy được ở CI (không cần WebGPU). KHÔNG bắt "đọc nhầm nhãn" (số có thật) — cái đó do prompt + định dạng bảng lo.
      - ⚠️ **PHÒNG THỦ THEO TẦNG (2026-06-24, ultracode workflow 6 agent + phản biện)**: (1) **viết-lại-CÓ-HƯỚNG-DẪN** — bắt số bịa → `buildCorrectionNote`/`appendCorrectionTurn` chèn lượt chỉ ĐÍCH DANH số sai rồi chạy lần 2 (không blind); chữ-lạ vẫn viết-lại-blind. (2) **CỨU-CÂU** thay vì nuke: `stripFabricatedSentences` (CoachChat — bỏ riêng CÂU chứa số bịa, giữ câu sạch) + `scrubFabricatedLines` (CoachOffline — bỏ riêng DÒNG, giữ khung 4 phần, phần rỗng→"chưa đủ dữ liệu"). Bỏ hết → fallback. (3) **CoachOffline NAY CŨNG có guard số** (trước chỉ chống chữ-lạ). Tất cả THUẦN, test `coachGuard.test.js`. ⚠️ Đã BỎ (rủi ro báo nhầm): entity-guard tên loại, kiểm cỡ-mẫu trong guard, đơn-vị-kép, dung sai làm-tròn. ⚠️ Landmine đã vá: `BAND_LABEL.vua` = `'vừa (26 phút–44 phút)'` (mốc dưới PHẢI có "phút", nếu không guard báo nhầm "26 phút").
      - Prompt 2 system thêm luật **"KHÔNG CÓ SỐ THÌ NÓI KHÔNG CÓ"** + **"RANH GIỚI HỌC vs NÓI"** (chỉ lấy số giữa `=== DỮ LIỆU THẬT ===`/`=== HẾT ===`, ví dụ trong prompt KHÔNG phải dữ liệu).
      - ⚠️ **GIỌNG VĂN MƯỢT, BỚT ROBOT (2026-06-24)**: COACH_CHAT_SYSTEM có đoạn **"CÁCH VIẾT"** (3 nhịp là DÀN Ý NGẦM, viết 2–4 câu CHẢY LIỀN, cụm nối "thật ra/nhìn rộng ra"…); COACH_OFFLINE_SYSTEM có đoạn **"GIỌNG VĂN"** ([1][2] văn xuôi, [3] quan sát người-hiểu-người). ⚠️ RANH GIỚI: nới Ở CÂU NỐI, SIẾT Ở CON SỐ — mọi luật trung thực giữ NGUYÊN; lưới chống-bịa tất định độc lập với prompt nên mượt KHÔNG tăng bịa. Câu tất-định (fallback/chữ-lạ/placeholder/chip) đã làm mềm (giữ token `chưa đủ dữ liệu`/`Người dùng chưa có phiên nào` mà test/guard khớp). **decoding GIỮ 0.2/0.8** (0.25/0.85 chỉ đổi ở commit riêng sau khi xác nhận không tăng trôi).
      - ⚠️ **LƯỚI PHÂN SỐ BỊA**: `findFabricatedFractions` (`coachPrompt.js`) — bắt cặp `N/M` ghép sai (vd "phiên sâu 7/18" khi bảng ghi "4/18"); lookbehind chừa số thập phân (13.3). `extractPctSamplePairs` chuẩn hoá `phần trăm`↔`%`. Cắm vào strip/scrub + gác cuối.
      - ⚠️ **LƯỚI GHÉP-SAI %↔CỠ-MẪU (2026-06-24)**: `findMismatchedPairs` (`coachPrompt.js`) — bắt kiểu bịa tinh vi: % ghép SAI cỡ mẫu (cả hai số đều CÓ trong bảng nhưng ở 2 dòng khác, vd "đạt 79% trên 18 phiên" — 79% là tổng, 18 phiên là của "Học"). BẢO THỦ: chỉ bắt cặp kề-nhau rõ ("X% … trên N đv" / "N đv … (X%)"), BỎ QUA % so-sánh không cỡ mẫu + mẫu phân số (nghi thì tha — đã verify 9/9 paraphrase thật không báo nhầm). Cắm vào `stripFabricatedSentences`/`scrubFabricatedLines` + gác cuối CoachChat/CoachOffline.
      - **CoachChat UX**: lưu hội thoại localStorage `dc-coach-chat-v1` (lượt `restored` KHÔNG vào prompt — số cũ khỏi mồi model; nút "Xoá hội thoại"); nút "Thử lại" + lỗi phân loại (no-key / gemini-4xx hết-quota / timeout); câu hỏi mẫu BÁM tín hiệu thật (`pickSuggestions` có `limit`); empty-state khi chưa có dữ liệu. ⚠️ ĐÃ BỎ warm-prefetch Qwen (Gemini là chính → không tải model nặng lên máy).
    - *AI phân tích tổng thể* (`CoachOffline.jsx`, tên cũ "Coach offline") = Qwen viết **phân tích 4 phần** `[1] Quan sát · [2] Xu hướng · [3] Chân dung & mẫu hình · [4] Thử nghiệm` (`buildLLMPrompt` + `COACH_OFFLINE_SYSTEM` + ví dụ vàng + tự-kiểm).
    - Cả hai **dùng CHUNG** engine singleton `webllmEngine.js` → tải 1 lần, xài lại ngay. Nút hiện trong thẻ "AI Coach" ở `FocusRail.jsx` (chỉ khi `aiCapable`).
  - **Tầng SỐ LIỆU (KHÔNG phải AI, GIỮ LẠI làm nguồn cho Qwen):** `buildAnalystContext` (`coachContext.js`) gom các SIGNAL trong `gameMath.js` (giờ vàng, nhịp hôm nay, phiên khuya, bỏ giữa chừng, xu hướng tuần, hiệu chỉnh mục tiêu, loại bị bỏ bê…) + hồ sơ/dự đoán trong `coachIntel.js` (`buildFocusProfile`, `generatePredictions`) → mỗi % kèm cỡ mẫu, bỏ tín hiệu thiếu mẫu. Qwen chỉ **diễn đạt lại số đã-tính-sẵn**, khỏi bịa. Hook: `useAnalystContext` (`useCoachContext.js`).
    - ⚠️ **ĐỊNH DẠNG DÒNG chống đọc-nhầm + guard-safe** (2026-06-22): dòng "Loại việc" đã TÁCH MỖI LOẠI MỘT DÒNG, tên loại trong NGOẶC KÉP, bỏ dấu `|` (vd `Loại việc dành nhiều thời gian nhất là "Học": 13.3 giờ qua 18 phiên…` + `Loại việc "Làm Việc": …`); dòng khuya đổi nhãn → `Tỉ lệ đạt mục tiêu của phiên làm sau 22 giờ đêm: …%`; mọi `′` (prime) ĐỔI sang chữ "phút" (ở `coachContext.js` + `BAND_LABEL`/momentum blurb trong `coachIntel.js`) để guard nhận đơn vị + model khỏi đổi ký tự lạ. ⚠️ Đổi chữ các dòng này phải sửa kèm **marker `coachSuggest.js`** (`category`=`startsWith('loại việc')`, `lateNight`=`'phiên làm sau'`+`'so với ban ngày'`, `longTrend`=`startsWith('xu hướng dài hạn')`, `portrait`=`startsWith('chân dung của bạn')`) + fixture `coachSuggest.test.js` + assertion `coachContext.analyst.test.js`. Chip mới `coachSuggest.js`: `longTrend`+`portrait` (KHÔNG vào `STRONG_SIGNALS`); `detectTopics` (số nhiều) cho câu đa-ý + `LOOSE_KW` bỏ từ quá chung.
    - ⚠️ **CHÍNH XÁC SỐ (2026-06-24)**: dòng khuya dùng `late.lateGoalTotal` (KHÔNG phải `lateAttempts`) làm cỡ mẫu cho % (trước ghép sai mẫu→phóng đại); Tổng quan <60 phút in theo "phút" (tránh "~0 giờ"); trung vị mục tiêu ngày dùng `cal.medianDisplay` (`roundGoalValue`, nhất quán với suggested).
    - **"Chân dung của bạn"** (HIỂU CHỦ): dòng tổng hợp đặc điểm ổn định (buổi mạnh, độ dài hợp, độ đều, loại việc chủ đạo, tỉ lệ phiên sâu) — ghép từ `profile`, mỗi mảnh kèm cỡ mẫu.
    - **Tín hiệu MỚI (2026-06-24)**: `getWeekendVsWeekdayContrast` (cuối tuần vs trong tuần — dòng "Cuối tuần so với trong tuần:") + `getComebackRate` (quay lại sau 1 ngày nghỉ — dòng "Phục hồi sau ngày nghỉ: N/M lần") — đều gác chặt (chỉ hiện khi nổi bật) + prefix riêng. **streak-at-risk** GỘP vào `predictStreakKeep` (`atRisk` → dòng "Giữ chuỗi" mở bằng "Chuỗi N ngày đang treo", KHÔNG thêm dòng). ⚠️ **CAP** `COACH_MAX_CONTEXT_LINES=18` + `capContextLines` (cắt theo ƯU TIÊN, giữ Tổng quan/Chân dung/Hôm nay + nhóm STRONG, "Ghi chú" cắt trước — KHÔNG slice mù) chống bảng dài làm 3B loạn. Marker coachSuggest mới: `weekendVsWeekday`=has('cuối tuần so với trong tuần'), `comeback`=has('phục hồi sau ngày nghỉ'). ĐÃ HOÃN (làm bảng dài/trùng): category-momentum, session-length-trend.
    - **"Xu hướng dài hạn"** (HỌC THEO THỜI GIAN): `getMultiWeekTrend` (`gameMath.js`) — đi lên/xuống/giữ qua nhiều tuần. ⚠️ CHỈ tính tuần CÓ dữ liệu (tuần không mở app ≠ làm 0 phút — tránh số 0 "ma"), cần **≥3 tuần có dữ liệu** (minWeeks=3) mới hiện; `weekKeysDesc` (4 tuần) dựng bằng Date Ở HOOK (`useCoachContext`), engine vẫn thuần.
  - **Giải mã** (`webllmEngine.js`): `temperature 0.2 · top_p 0.8 · frequency_penalty 0.2 · max_tokens 700` (hạ từ 0.3/0.85 ngày 2026-06-22 — đây là tác vụ CHÉP-LẠI-SỐ, nhiệt thấp thì 3B ít chế số/trôi). **Chống "trôi" tiếng nước ngoài** (Qwen 3B hay chèn chữ Hán 小时/约…): prompt ép TIẾNG VIỆT 100% + tự-kiểm; `hasForeignScript()` bắt CJK/Hangul/Kana; component tự VIẾT LẠI 1 lần nếu dính.
  - ⚠️ **BUILD-SAFETY:** `@mlc-ai/web-llm` CHỈ được `import()` động trong `webllmEngine.js` (canh bởi `src/engine/llm/guard.test.js`); chunk `vendor-webllm` KHÔNG vào precache (xem `vite.config.js` globIgnores + grep `dist/sw.js`). Muốn đổi model → `LLM_MODELS` ở `coachPrompt.js` (khôn hơn→`Qwen2.5-7B` nặng ~4.5GB; ít trôi hơn→`gemma-2-2b-it`, khác họ nên phải chỉnh lại lưới chống-trôi).
- **ĐÃ GỠ HẲN (2026-06-21):** ⚡Nhanh theo luật (`src/engine/qa/`), Hỏi Claude (`api/coach.js` + `buildCoachContext`), model nhúng MiniLM + đọc-nghĩa ghi chú (`src/engine/semantic/`, `useNoteThemes`), bộ trả lời theo luật (`generateCoachBriefing`/`generateCoachInsight`, `useCoachInsight`, `CoachCard`, `FocusReport`, `useCoachIntel`), giọng cảm xúc (`coachVoice.js`, `useCoachVoice`, `ai-coach-sim/`, `coachPersonality`). Gỡ deps `@huggingface/transformers` + `@anthropic-ai/sdk` → app/cài đặt nhẹ hơn. **Đừng khôi phục các thứ này trừ khi Đàm yêu cầu.**
- **Engine game thuần** tách khỏi state: công thức ở `src/engine/gameMath.js` + `constants.js`, state ở `src/store/gameStore.js`. Sửa công thức → sửa ở engine, đừng nhồi vào store. Dữ liệu ngoài (Supabase/import) PHẢI đi qua `normalizePersistedGameState`.
- ⚠️ Điểm nóng: `completeFocusSession` trong `gameStore.js` rất dài (~760 dòng) — sửa cẩn thận, dễ sinh bug "dùng giá trị cũ".
- Luôn `npm test` trước khi commit (hiện 175 bài; glob đã thêm `api/*.test.js`) + `npm run build` (xác nhận precache không có webllm). Công cụ mắt-soi bảng số liệu model nhận: `node --import ./scripts/register-esm-loader.mjs scripts/coach-sample.mjs` (dựng lịch sử mẫu ~24 giờ + in `buildAnalystContext`).

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
