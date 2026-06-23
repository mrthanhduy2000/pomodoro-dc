# BÀN GIAO — Pomodoro DC

> Dành cho AI/người làm tiếp. File này trả lời: **đang ở đâu, làm gì tiếp, đã đổi những gì.**
> Chi tiết kỹ thuật + quy tắc cấm: xem `CLAUDE.md`. Lịch sử thiết kế sâu: thư mục memory của Claude.
> **NGUYÊN TẮC ƯU TIÊN SỐ 1:** (1) mọi phiên AI phải đọc file này + `CLAUDE.md` + các file liên quan TRƯỚC khi làm; (2) sau MỌI cập nhật dù nhỏ, phải cập nhật ngay file này + `CLAUDE.md` + các file liên quan khác.
> Cập nhật lần cuối: **2026-06-21**.

---

## ✅ Đã làm (xong, đa số đã deploy)
- **AI Coach 3 tầng**: (a) Hỏi Coach trả lời từ số liệu, không cần mạng; (b) Coach chạy AI ngay trên máy (chỉ desktop, tự bật khi đủ điều kiện); (c) Hỏi Claude qua mạng (chỉ khi bấm).
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
1. **Thử Coach offline thật trên Mac** (bấm "Phân tích chuyên sâu") — bản nâng cấp 2026-06-21 mới verify ở mức engine/test, CHƯA chạy thử output model 3B thật. Nếu nó mượn số trong ví dụ vàng / sinh từ nhân-quả → cân nhắc bỏ few-shot hoặc thêm hậu kiểm. Nếu VẪN "trôi" sang tiếng Trung dù đã vá (prompt+decoding+hasForeignScript+auto-retry) → cân nhắc đổi model prebuilt khác (vd `gemma-2-2b-it`) trong `LLM_MODELS` hoặc tăng số lần viết lại.
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
