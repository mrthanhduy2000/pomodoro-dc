# BÀN GIAO — Pomodoro DC

> Dành cho AI/người làm tiếp. File này trả lời: **đang ở đâu, làm gì tiếp, đã đổi những gì.**
> Chi tiết kỹ thuật + quy tắc cấm: xem `CLAUDE.md`. Lịch sử thiết kế sâu: thư mục memory của Claude.
> **NGUYÊN TẮC ƯU TIÊN SỐ 1:** (1) mọi phiên AI phải đọc file này + `CLAUDE.md` + các file liên quan TRƯỚC khi làm; (2) sau MỌI cập nhật dù nhỏ, phải cập nhật ngay file này + `CLAUDE.md` + các file liên quan khác.
> Cập nhật lần cuối: **2026-06-21**.

---

## ✅ Đã làm (xong, đa số đã deploy)
- **AI Coach 3 tầng**: (a) Hỏi Coach — **2 chế độ**: ⚡ Nhanh (số liệu, offline, tức thì) + 🧠 AI trên máy (chat tự do với LLM Qwen 3B, chỉ desktop); (b) Coach offline — LLM 3B tự viết phân tích chuyên sâu (desktop); (c) Hỏi Claude qua mạng (chỉ khi bấm). (a-AItrênmáy và (b) dùng CHUNG 1 engine 3B singleton; dự phòng khi lỗi = ⚡Nhanh (0 byte).
- **Coach offline (b) nâng cấp lớn**: chốt **một phong cách phân tích chuyên sâu, đọc số** (bỏ giọng cảm xúc ở tầng này); nạp bản số liệu giàu hơn (`buildAnalystContext` = hồ sơ sâu Wilson + dự đoán + nhịp hôm nay + phiên khuya, mỗi % kèm cỡ mẫu); prompt 3 phần `[1] Quan sát · [2] Mẫu hình · [3] Thử nghiệm` + tự-kiểm; giải mã tinh hơn (0.4 / top_p 0.85 / freq 0.3 / 700 token). Thông minh hơn các bản trước.
- **Thẻ AI Coach (briefing)**: **(2026-06-21) phong cách ĐỌC SỐ** — câu chính + dòng phụ đều là phân tích số liệu thật (`useCoachInsight` → `generateCoachBriefing`): chẩn đoán + 1 gợi ý theo số, kèm cỡ mẫu. Đã bỏ HẲN giọng cảm xúc (engine `coachVoice.js`/`useCoachVoice.js` giữ lại nhưng không nối UI). Khác hẳn Coach offline (b).
- **Cộng Hưởng**: nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu, có chặn lạm phát.
- **Focus Intelligence**: hồ sơ + dự đoán "giờ vàng" + khuyến nghị + báo cáo.
- **Đọc-nghĩa ghi chú** chạy ngay trên máy (gom chủ đề, tìm phiên giống nhau).
- **Web Push iPhone**: đã làm xong & deploy.
- **Giao diện Thụy Sĩ** + bộ icon tự vẽ thay emoji.
- **Đồng bộ Supabase** (game_state + timer_live cho menu bar Mac).
- **Gộp engine Coach về 1 nguồn** — hết bản chép đôi.

## 🔧 Đang làm
- (Trống — việc gần nhất đã xong. Xem "Sẽ làm tiếp".)

## 🔜 Sẽ làm tiếp (ưu tiên từ trên xuống)
1. **Thử Coach offline + chat AI (Qwen 3B) thật trên Mac** (bấm "Phân tích chuyên sâu" / chế độ "AI trên máy" ở Hỏi Coach) — đã CHỐT 1 model 3B cho gọn (~2.4GB) nhưng CHƯA chạy thử thật. Cần soi: (a) 3B còn "trôi" chữ Hán nhiều không (3B trôi hơn 7B; đã có lưới hasForeignScript + viết-lại + decoding siết 0.3/0.85); (b) văn có cụt/bỏ mục [1][2][3] không. Nếu 3B "đuối/trôi" rõ → phương án B: `gemma-2-2b-it-q4f16_1-MLC` (Google, ~1.9GB, gần như không trôi tiếng Trung, NHƯNG khác họ Qwen → phải chỉnh lại lưới chống-trôi + ví dụ vàng). Muốn khôn hơn & chấp nhận nặng → quay lại `Qwen2.5-7B`.
2. **Nối giọng Coach vào sự kiện timer thật** — để Coach biết lúc phiên kết thúc/bị gián đoạn (giờ mới chỉ phản chiếu trạng thái cả ngày).
2. **Thêm test cho `coachVoice.js`** — engine Coach của app thật hiện chưa có test riêng.
3. **Giao diện còn dở**: full-screen iPhone (tai thỏ che mép trên), nút đóng ✕ cho hộp phần thưởng, gom cỡ chữ cho đồng nhất, tắt hiệu ứng cho người nhạy chuyển động.
4. *(khi cần)* Giới hạn lượt gọi `api/coach.js`; thêm `vercel.json` + file SQL cho bảng gốc Supabase.

## ⚠️ Nhớ kỹ (kẻo hỏng)
- **Không bấm chạy phiên focus trên bản dev/localhost** — nó dùng chung dữ liệu với bản thật, sẽ ghi đè dữ liệu của Đàm.
- **Coach mặc định miễn phí** — đừng tự bật hướng trả tiền (Claude API) trừ khi Đàm yêu cầu.
- **Sửa câu thẻ AI Coach (đọc số)** → `generateCoachBriefing` trong `src/engine/gameMath.js`. (Engine giọng cảm xúc `src/engine/coachVoice.js` giờ DORMANT — chỉ `ai-coach-sim` còn dùng; đừng sửa nó để mong thay đổi thẻ.)
- Luôn `npm test` trước khi commit; luôn chạy `git status` tươi (đừng tin ảnh chụp cũ).
- **Lịch sử git `main` từng bị xáo** (thao tác git song song): bản đang chạy là `eb44638` — chứa ĐỦ mọi việc gần đây (Hỏi Coach offline + fix đêm khuya + Coach offline analyst). Vài commit cũ (`1e27505`, `9fbcd62`) thành dangling, KHÔNG còn trong `git log` nhưng code vẫn nằm trong bản deploy. Đừng hoảng nếu không thấy chúng.

## 🗒️ Nhật ký cập nhật
> Mỗi lần xong việc đáng kể, thêm 1 dòng vào ĐẦU danh sách.

- **2026-06-21** — **Chốt 1 model GỌN: Qwen2.5-7B → Qwen2.5-3B** (workflow 4 agent: tiếng Việt+trôi / năng lực-vs-kích thước / chạy thực 16GB → hợp nhất). Lý do: LLM ở app chỉ DIỄN ĐẠT số đã-tính-sẵn nên 3B "đủ khôn"; cùng họ 7B nên dùng lại nguyên lưới chống-trôi; ~2.4GB nhẹ trên 16GB. `LLM_MODELS` còn DUY NHẤT `Qwen2.5-3B` (bỏ key `light`); BỎ nút "Thử mô hình nhỏ hơn" + tải model thứ 2 — dự phòng = ⚡Nhanh (luật, 0 byte). Decoding siết lại `temp 0.35→0.3, top_p 0.9→0.85` (3B dễ trôi hơn 7B). Timeout `900s→300s`. UI: bỏ "7B"/"~4.5GB"/"RAM≥16GB", đổi nhãn "AI 7B"→"AI trên máy" (model-agnostic). Tiết kiệm ~2GB so với 7B (tới ~4GB nếu trước đã cache cả 7B+3B). Phương án B nếu 3B trôi nhiều: `gemma-2-2b-it`. `npm test` 142/142, lint sạch. Cache 7B cũ vẫn nằm trong trình duyệt tới khi xoá site data thủ công.
- **2026-06-21** — **"Hỏi Coach" chat được với AI 7B trên máy** (Đàm muốn chat với 7B thay vì cứ bị đẩy sang Claude). Thêm toggle 2 chế độ trong `CoachChat.jsx`: ⚡ Nhanh (engine số liệu cũ) / 🧠 AI 7B (chat tự do, CHỈ desktop có WebGPU). Chat 7B dùng `buildLLMChatPrompt`+`COACH_CHAT_SYSTEM` mới (hội thoại, KHÔNG ép khuôn 3 phần) + `buildAnalystContext` (số liệu giàu) + streaming + lưới `hasForeignScript`/viết-lại + timeout 900s. Tái dùng engine 7B singleton của Coach offline → đã tải thì xài lại NGAY, không tải lại. Câu ngoài tầm Nhanh → nút "Hỏi AI trên máy (7B)" (desktop) đặt cạnh "Hỏi Claude". `webllmEngine` vẫn CHỈ dynamic import (build-safety ok). +1 test `buildLLMChatPrompt` (142/142), lint sạch. iPhone: không có WebGPU → không thấy toggle, vẫn chế độ Nhanh + Claude như cũ.
- **2026-06-21** — **Nâng model Coach offline 3B → Qwen2.5-7B** (Đàm chọn, Mac 16GB). `LLM_MODELS.default` = `Qwen2.5-7B-Instruct-q4f16_1-MLC` (~4.5GB tải, ~5GB VRAM), `light` = 3B (fallback nút "Thử mô hình nhỏ hơn"). Khôn hơn + model lớn nên ÍT trôi tiếng Trung. Giải mã nới: `temp 0.3→0.35, top_p 0.8→0.9` (`webllmEngine.js`). Timeout tải `300s→900s` cho file lớn (`CoachOffline.jsx`) + đổi chữ UI "~1GB"→"~4.5GB, RAM ≥16GB". Model tải runtime từ CDN nên KHÔNG đụng bundle/precache. `npm test` 141/141, lint sạch. CHƯA chạy thử 7B thật trên Mac.
- **2026-06-21** — **Vá lỗi Coach offline (LLM) "trôi" sang tiếng Trung** (Đàm thấy output có 小时/约…). 3 lớp: (1) prompt ép TIẾNG VIỆT 100% + cấm chữ Hán/Pinyin/Anh, đơn vị viết chữ Việt + thêm bước tự-kiểm ngôn ngữ (`COACH_OFFLINE_SYSTEM`); (2) hạ giải mã `temperature 0.4→0.3`, `top_p 0.85→0.8`, `freq 0.3→0.2` (`webllmEngine.js`) để bớt token lạ; (3) `hasForeignScript()` mới (`coachPrompt.js`, bắt CJK/Hangul/Kana) + `CoachOffline.jsx` TỰ VIẾT LẠI 1 lần khi dính, vẫn dính → trạng thái `error-lang` mời thử lại/Hỏi Coach. +1 test `hasForeignScript`. `npm test` 141/141, lint sạch. CHƯA verify model thật trên Mac.
- **2026-06-21** — **Thẻ AI Coach briefing → phong cách ĐỌC SỐ** (theo yêu cầu Đàm: muốn đọc/phân tích số liệu + gợi ý theo số, không cảm xúc). Bỏ HẲN giọng cảm xúc khỏi thẻ: `FocusRail.jsx` + `FocusCoachMobile.jsx` thôi dùng `useCoachVoice`, lấy `coach.text`/`coach.reason` từ `useCoachInsight` (→ `generateCoachBriefing`) làm câu chính + dòng phụ; `tone="đọc số"`. `useCoachVoice.js` + `engine/coachVoice.js` GIỮ lại nhưng dormant (không nơi nào trong `src/` import; sim 4104/4104 vẫn chạy). `settingsStore.coachPersonality` orphan. `npm test` 140/140, lint sạch. *(Cùng ngày trước đó đã thử bước trung gian: gỡ 3 nút + cố định giọng zen — nay thay luôn bằng đọc-số.)*
- **2026-06-21** (deploy `eb44638`) — **Coach offline (LLM trên máy) nâng cấp trí tuệ** (workflow 7 agent: hiểu bài → 3 thiết kế → hợp nhất). Chốt **một phong cách phân tích chuyên sâu đọc-số** (bỏ giọng cảm xúc ở tầng này). Mới: `buildAnalystContext` (`coachContext.js`) nạp cả `buildCoachIntel` (hồ sơ Wilson + dự đoán) + `getTodayPaceInsight` + `getLateNightQualityDrop` — mỗi % kèm cỡ mẫu, bỏ tín hiệu thiếu mẫu, bỏ trùng ghi chú; hook `useAnalystContext`. Prompt 3 phần + ví dụ vàng + tự-kiểm (`COACH_OFFLINE_SYSTEM`); giải mã `0.4/top_p0.85/freq0.3/700` (`webllmEngine.js`); UI `CoachOffline.jsx` đổi sang "Phân tích chuyên sâu". KHÔNG đụng `buildCoachContext` (Claude vẫn dùng). +10 test thuần (`coachContext.analyst.test.js`) + nới cap sanitize→2200. Tiện tay: sửa 1 lỗi lint cũ ở `coachVoice.js` (bỏ tham số `score` thừa trong `breakRules`, không đổi hành vi). `npm test` 140/140, lint sạch, sim coachVoice 4104/4104. CHƯA verify output model 3B thật (cần Mac có WebGPU).
- **2026-06-21** — Sửa lỗi `predictBestWindow` (`coachIntel.js`) bỏ sót buổi đêm khuya (buổi vắt qua nửa đêm) + test. *(Đã gộp vào `eb44638`; commit gốc `9fbcd62` giờ dangling sau khi main bị xáo lịch sử.)*
- **2026-06-20** — "Hỏi Coach" trả lời OFFLINE không cần LLM (`src/engine/qa/` + `CoachChat.jsx`). *(Đã gộp vào `eb44638`; commit gốc `1e27505` giờ dangling.)*
- **2026-06-20** — Nâng quy tắc tài liệu thành **NGUYÊN TẮC ƯU TIÊN SỐ 1**, mở rộng 2 vế: (1) đọc CLAUDE.md+BAN_GIAO.md+file liên quan trước khi làm; (2) sau mọi thay đổi dù nhỏ, cập nhật CLAUDE.md+BAN_GIAO.md+file liên quan khác. Ghi vào CLAUDE.md, hook, và bộ nhớ.
- **2026-06-20** — Ghi cứng quy tắc "luôn cập nhật CLAUDE.md + BAN_GIAO.md sau mọi thay đổi" vào bộ nhớ cá nhân của Claude (loại feedback) để mọi phiên sau không quên.
- **2026-06-20** — Dọn file thừa/lệch: xoá 2 worktree copy mâu thuẫn trong `.claude/`; xoá `NATURALNESS-REPORT.md` (gộp vào `ai-coach-sim/README.md`); gỡ `backups/`, `DC Pomodoro.app`, Logo html khỏi git (giữ trên máy + gitignore); bỏ dòng cảnh báo worktree trong CLAUDE.md.
- **2026-06-20** — Soát lại 2 file đối chiếu code (workflow 3 agent): BAN_GIAO khớp 100%; sửa 2 chỗ lệch nhỏ trong CLAUDE.md (initSync chạy sau khi store nạp xong; coachVoice có test riêng ở ai-coach-sim/) + thêm khối Web Push (env/VAPID/SQL/service worker) + cảnh báo worktree cũ.
- **2026-06-20** — Bắt buộc quy trình bàn giao: thêm hook tự chèn BAN_GIAO.md vào đầu MỖI phiên AI (`.claude/session-start-bangiao.sh` + `.claude/settings.local.json`), và ghi 2 quy tắc bắt buộc (đọc-trước / cập-nhật-sau) lên đầu CLAUDE.md.
- **2026-06-20** — Gọn tài liệu về 2 file (CLAUDE.md + BAN_GIAO.md), đổi tên HANDOVER → BAN_GIAO.
- **2026-06-20** — Gộp engine Coach về 1 nguồn (`ai-coach-sim/ai-coach.mjs` chỉ trỏ về `src/engine/coachVoice.js`). Verify: test sandbox 4104/4104 + `npm test` 131/131.
- **2026-06-20** — Vá CLAUDE.md (thêm mục AI Coach, tick web push đã xong) + lập bàn giao đầu tiên.
- **2026-06-20** (`7a72f48`) — Giọng Coach theo tính cách gắn vào thẻ Coach.
- **2026-06-20** (`b94db18`) — Cộng Hưởng: nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu.
- (cũ hơn) — Xem `git log` + thư mục memory cho lịch sử đầy đủ.
