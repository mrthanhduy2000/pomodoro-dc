# BÀN GIAO — Pomodoro DC

> Dành cho AI/người làm tiếp. File này trả lời: **đang ở đâu, làm gì tiếp, đã đổi những gì.**
> Chi tiết kỹ thuật + quy tắc cấm + **Project Governance Protocol**: xem `CLAUDE.md`. Lịch sử
> thiết kế sâu: thư mục memory của Claude + `AI_HANDOFF_KNOWLEDGE.md`. Vì sao 1 quyết định được
> chọn: `ARCHITECTURE_DECISIONS.md`. Nợ kỹ thuật: `TECH_DEBT.md`. Migration: `MIGRATION.md`. Tóm
> tắt theo mốc: `CHANGELOG.md`.
> **NGUYÊN TẮC ƯU TIÊN SỐ 1:** (1) mọi phiên AI phải đọc file này + `CLAUDE.md` + các file liên quan TRƯỚC khi làm; (2) sau MỌI cập nhật dù nhỏ, phải cập nhật ngay file này + `CLAUDE.md` + các file liên quan khác.
> Cập nhật lần cuối: **2026-08-12** — **THÀNH PHỐ, 3 phase liên tiếp trong ngày**: (1) engine thuần
> suy ra bố cục thành phố từ danh sách công trình; (2) **bảo tàng** — thành phố kỷ cũ được niêm
> phong thay vì xoá vĩnh viễn (`GAME_STORE_SCHEMA_VERSION` **3 → 4**, tương thích ngược, KHÔNG cần
> chạy SQL); (3) **tab "Thành Phố" hiện ra**, vẽ bằng SVG; (4) **Phase 3A — bộ vẽ 3D thật
> (three.js)** + bảng đo hiệu năng trong app. **360 bài test.** Cân bằng game KHÔNG đổi, chunk
> chính KHÔNG to thêm.
> ✅ **CỔNG HIỆU NĂNG 3A ĐÃ QUA** (2026-08-12, Đàm quyết): Đàm đã xem bản 3D trên máy thật và ra
> lệnh *"hãy tiếp tục xây dựng sản phẩm và không dừng lại"* — tức là qua cổng bằng QUYẾT ĐỊNH của
> chủ dự án, không phải bằng con số đo. ⚠️ **Mọi lưới an toàn hiệu năng vẫn còn nguyên, KHÔNG được
> gỡ**: watchdog FPS, ba cửa lùi về 2D, trần 30 khung/giây, dừng khi rời tab. Nhận xét của Đàm:
> *"quá đơn giản và không đẹp"* → đã chạy tiếp **Phase 3B (hình khối + cư dân) · 3C (ánh sáng) ·
> 3D (giờ trong ngày, đèn cửa sổ, vũng sáng đêm) · 3F (thành phố ra TRANG CHỦ)**. **418 bài test.**
> Trước đó 2026-08-10: sửa khoảng trắng thừa trước icon 🍅/☕ trên thanh menu Mac (`electron/main.js`,
> đúng 1 dòng; xoá `public/tray-empty.png`) — chỉ đụng app tray. Trước đó 2026-08-05 có 3 việc
> **cấu hình máy + tài liệu, KHÔNG đổi dòng code ứng dụng nào**: (a) sửa "app biến mất khỏi thanh
> menu Mac" + bật tự khởi động; (b) dọn sạch dấu vết dự án đời cũ trên máy; (c) diệt bản sao
> `AGENTS.md` và cấm nhân bản tài liệu quy tắc theo từng công cụ AI.
>
> ⏳ **Đang dở (chưa commit vào luồng chạy):** `src/hooks/useTimer.test.js` — 41 bài characterization
> test cho `useTimer.js`, **tất cả đều xanh**, nhưng CHƯA nối vào `npm test` vì tiến trình test
> không tự thoát khi chạy riêng file này. Xem mục "Sẽ làm tiếp".
>
> Mốc kỹ thuật gần nhất: **2026-07-17** (Giai đoạn A — **đã ĐÓNG blocker Critical C1 của lớp đồng bộ**:
> vá 4 đường mất dữ liệu trong `syncService.js` (flush khi rời app · chặn state trắng ghi đè cloud ·
> bịt đường ghi không-CAS · báo to khi thiếu cột `version`), 261 bài test. Trước đó cùng ngày:
> hoàn tất đợt 2 "lưới an toàn": +16 bài test cho
> `computeLevelUps`, bảo-toàn-tài-sản qua `triggerPrestige` (kèm ĐÓNG BĂNG bug #3 bằng test),
> streak nối/đứt chuỗi, `unlockSkill` cơ bản, sync retry-sau-lỗi. Tổng 253 bài. KHÔNG đổi hành vi
> runtime. Trước đó 2026-07-13: đợt 1 lưới an toàn +29 bài cho `completeFocusSession`/`syncService`/
> `cancelFocusSession`).
> **Roadmap POS (A→B→C→D) là nguyên tắc ưu tiên cao nhất** — đang ở **Giai đoạn A** (ổn định kiến
> trúc); CẤM mở rộng AI/gamification/Life-Analytics/Knowledge-Graph tới khi qua cổng A. Xem memory
> `phase-roadmap-pos.md`.

---

## ✅ Đã làm (xong, đa số đã deploy)
- **AI Coach = CHỈ GEMINI (đám mây)** (2026-06-24, Đàm: "bỏ Qwen, chỉ còn Gemini"): mọi phản hồi do Gemini sinh; ĐÃ GỠ HẲN Qwen2.5-3B + WebLLM + dep `@mlc-ai/web-llm`. **CHẠY CẢ iPhone**, app nhẹ hơn, không tốn RAM/đĩa. Đánh đổi: mất mạng/hết quota/chưa-có-key → Coach ngừng (báo lỗi + Thử lại), không còn dự phòng on-device. Cổng `api/coach.js` (giữ `GEMINI_API_KEY`, flash→flash-lite, tắt thinking) + `cloudEngine.js`. 2 lối vào (Hỏi Coach + AI phân tích tổng thể) dùng CHUNG "bộ não đã đào tạo" model-agnostic: prompt + lưới chống-bịa + tầng SỐ LIỆU (`gameMath`/`coachIntel`/`buildAnalystContext`) + gợi ý (`coachSuggest`). **`GEMINI_API_KEY` đã ở Vercel env + ĐÃ BẬT BILLING (paid tier, 2026-06-24) → hết 429, chạy ổn định** trên `gemini-2.5-flash`. Đã GỠ trước đó: ⚡Nhanh, Hỏi Claude (Anthropic), MiniLM, giọng cảm xúc.
- **Cộng Hưởng**: nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu, có chặn lạm phát.
- **Focus Intelligence (tầng số liệu)**: hồ sơ + dự đoán "giờ vàng" + khuyến nghị — giờ là NGUỒN SỐ cho Qwen đọc (không tự hiển thị nữa).
- **Web Push iPhone**: đã làm xong & deploy.
- **Giao diện Thụy Sĩ** + bộ icon tự vẽ thay emoji.
- **Đồng bộ Supabase** (game_state + timer_live cho menu bar Mac).

## 🔧 Đang làm
- **THÀNH PHỐ 3D** (kế hoạch Đàm duyệt 2026-08-12, mở rộng từ `SPEC V2 Thành Phố 3D`).
  Phase 1, 2, 3-2D, 3A, **3B-1/3B-2/3B-3 đã xong & push**. ✅ Cổng hiệu năng đã qua (Đàm quyết).
  - Đã đạt sẵn (đo được trên máy build): chunk `vendor-three` = **130,66 KB gzip** ≤ ngưỡng 135;
    chunk chính không to thêm; three KHÔNG bị precache nhưng vẫn chạy offline.
  - **Đàm yêu cầu tiếp** (nguyên văn): *"tối ưu hình ảnh và cộng đồng cư dân, hãy cố gắng làm đẹp
    như các bức tranh phục hưng, nhiều animation lên và nhiều hiệu ứng hơn, đem nó ra trang chủ
    hoặc làm cái gì đó đột phá hơn nữa"*. Chia thành: **3B** hình khối + cư dân (XONG) · **3C**
    ánh sáng/màu Phục Hưng · **3D** hiệu ứng sống động · **3F** đem thành phố ra trang chủ.
  - Lưới an toàn KHÔNG được gỡ dù đã qua cổng: watchdog FPS, ba cửa lùi 2D, trần 30 khung/giây.

## ✅ NÂNG CẤP TRÍ TUỆ AI COACH — chuỗi 6 mảng (2026-06-25, code XONG hết; mảng 6 MỚI THỰC SỰ LÊN PRODUCTION 2026-07-11)
> Đàm ra lệnh "làm toàn bộ, chuyên sâu" sau workflow đề-xuất 10 agent. Cả 6 mảng test xanh, code đã commit đủ.
1. **Siết niềm tin ✅** — nhiệt độ 0.3→0.2/0.8, bộ chấm điểm chống-bịa (`coachEval`), timeout 28s + `vercel.json` maxDuration, CoachOffline viết-lại-có-hướng-dẫn, dọn chữ Qwen cũ.
2. **Tín hiệu "phiên trơn vs ngắt quãng" ✅** — `getInterruptionPattern` đọc `pauseSegments` (chiều chất lượng trước bị bỏ phí) + chip `flow`.
3. **Coach tự nhắc sau mỗi phiên ✅** — `CoachNudge.jsx` (in-app, chủ động, bám số phiên vừa xong, qua guard).
4. **Model mạnh hơn cho bài 4 phần ✅** — `buildModelChain` tier 'deep' = gemini-2.5-pro (rơi về flash).
5. **Bộ nhớ lời khuyên ✅** — `coachAdviceMemory` (cá nhân hoá: nhớ lời khuyên chỉnh mục tiêu + theo dõi theo thời gian).
6. **Cảnh báo chuỗi sắp đứt qua push ✅ (code) — ⚠️ CHỈ THỰC SỰ CHẠY TỪ 2026-07-11.** Commit `8ee264d` (25/6, thêm `api/coach-digest.js`) **bị Vercel FAIL build** lúc đó (rất có thể cùng nguyên nhân "vượt trần 12 Serverless Functions" — xem mục Vercel Hobby ở `CLAUDE.md`, phát hiện lại khi soát log Deployments ngày 11/7). Vercel giữ nguyên bản deploy trước đó (mảng 5/6) khi build fail → **tính năng này coi như CHƯA TỪNG chạy thật trên production suốt 25/6–11/7** (cron `api/coach-digest` không tồn tại trong bản đang chạy, dù code + tài liệu đã ghi "hoàn tất"). Chỉ thực sự lên production từ deploy `caec62a` (11/7, sau khi fix trần function). Bài học: **build FAIL trên Vercel PHẢI được xác nhận đã hết**, đừng chỉ tin log local/test xanh — kiểm tra tab Deployments thấy "Ready" thật sự.
- ⚠️ **CẦN ĐÀM THỬ TAY** (không test được trên dev): (a) câu nhắc-sau-phiên hiện sau khi xong PHIÊN THẬT; (b) bài "AI phân tích tổng thể" giờ chạy pro — xem có chậm/khác chất lượng không; (c) dòng "Ghi nhớ" lời khuyên hiện sau ≥3 ngày; (d) thông báo chuỗi-sắp-đứt: **từ nay** (11/7) chiều nào quên làm sẽ nhận push (cần đã bật push iPhone) — đây là lần đầu tiên thực sự có cơ hội chạy thật.

## 🔜 Sẽ làm tiếp (ưu tiên từ trên xuống)
1. **Giao diện còn dở**: full-screen iPhone (tai thỏ che mép trên), nút đóng ✕ cho hộp phần thưởng, gom cỡ chữ cho đồng nhất, tắt hiệu ứng cho người nhạy chuyển động.
2. **(Giai đoạn A, gần xong)** Lưới an toàn test: đợt 1 (2026-07-13) phủ `completeFocusSession`/
   `cancelFocusSession`/`syncService`; đợt 2 (2026-07-17) phủ nốt `computeLevelUps`, bảo-toàn-tài-sản
   qua `triggerPrestige`, streak, `unlockSkill`, sync-retry. CÒN THIẾU (nhỏ): các nhánh early-return
   phạt (khủng-hoảng/thăng-cấp thất bại — cần dùng action khởi tạo thật làm builder) + ma trận
   waive-bằng-than-lượng + nhánh safeCancelPerk — xem NOTE trong các file test.
3. **(Tuỳ chọn, không gấp)** Tách nhỏ `gameStore.js`/`completeFocusSession` — hoãn có chủ đích ở đợt
   refactor 2026-07-12 vì rủi ro cao hơn lợi ích; NAY đã có characterization golden-master làm lưới
   an toàn nên rủi ro tách giảm, nhưng vẫn chỉ làm khi thật cần (xem `ARCHITECTURE.md` mục 6).

## ⚠️ Nhớ kỹ (kẻo hỏng)
- **PHÂN LOẠI LỆNH** (Đàm dặn 2026-06-21): **"nghiên cứu/tìm hiểu/đề xuất"** = CHỈ trình bày rồi DỪNG, KHÔNG tự sửa/commit/deploy (câu mơ hồ → coi là nghiên cứu, hỏi trước). **"làm/sửa/thêm/đổi/deploy"** = (1) giải thích ngắn gọn dễ hiểu công dụng TRƯỚC khi sửa → (2) làm → (3) giải thích đã sửa gì + ích gì → (4) TỰ ĐỘNG deploy Vercel (khỏi hỏi lại). Chi tiết: memory `ask-before-acting.md`.
- **Không bấm chạy phiên focus trên bản dev/localhost** — nó dùng chung dữ liệu với bản thật, sẽ ghi đè dữ liệu của Đàm.
- **AI Coach = CHỈ Gemini (đám mây)** (Đàm chốt 2026-06-24): đã gỡ ⚡Nhanh/Claude/MiniLM/briefing-luật/giọng-cảm-xúc + Qwen/WebLLM. ĐỪNG khôi phục trừ khi Đàm yêu cầu. Muốn đổi câu Coach → sửa PROMPT (`COACH_OFFLINE_SYSTEM`/`COACH_CHAT_SYSTEM` ở `src/engine/coach/prompt.js`) hoặc SỐ LIỆU nạp vào (`buildAnalystContext` ở `src/engine/coach/coachContext.js`); đổi model → `DEFAULT_MODEL`/`FALLBACK_MODEL` ở `api/_lib/gemini.js` (hoặc env `GEMINI_MODEL`). *(2026-07-12: `coachPrompt.js` tách thành `prompt.js`+`guard.js`, cả thư mục `src/engine/llm/` dời sang `src/engine/coach/` — xem `PROJECT_STRUCTURE.md`.)*
- **NIỀM TIN = TÀI SẢN QUÝ NHẤT:** lưới chống-bịa tất định (`src/engine/coach/guard.js`) phải chạy TRƯỚC mọi nội dung AI hiện ra / gửi push. Có bộ chấm điểm `src/engine/coach/eval.test.js` (đo BẮT %/BÁO NHẦM %) — sửa guard mà tụt điểm = phải xem lại. Quy tắc vàng: thà SÓT một câu bịa còn hơn BÁO NHẦM xoá oan câu thật (FPR phải = 0).
- Luôn `npm test` trước khi commit; luôn chạy `git status` tươi (đừng tin ảnh chụp cũ).
- **Lịch sử git `main` từng bị xáo** (thao tác git song song): bản đang chạy là `eb44638` — chứa ĐỦ mọi việc gần đây (Hỏi Coach offline + fix đêm khuya + Coach offline analyst). Vài commit cũ (`1e27505`, `9fbcd62`) thành dangling, KHÔNG còn trong `git log` nhưng code vẫn nằm trong bản deploy. Đừng hoảng nếu không thấy chúng.

## 🗒️ Nhật ký cập nhật
> Mỗi lần xong việc đáng kể, thêm 1 dòng vào ĐẦU danh sách.

- **2026-08-12 (Phase 3G)** — **QUÉT ĐỦ 15 KỶ × 6 CHẶNG NGÀY, VÀ VÁ 6 LỖI MỸ THUẬT NÓ PHƠI RA.**
  Đàm: *"quét đủ 15 kỷ × 6 chặng ngày đi… đánh bóng mọi thứ lên, mọi thứ phải hoàn hảo và không bị
  chán"*. Làm được đúng thế: 90 ô × 2 theme = **180 cảnh**, xem tận mắt từng ô.

  **⚠️ BÀI HỌC LỚN NHẤT — công cụ soi quyết định thứ soi được.** Trước đây mỗi lần chụp một ảnh
  rời, và soi kiểu đó **không hề bắt được lỗi nào trong 6 lỗi dưới đây**, dù chúng đã chạy trên
  production nhiều ngày. Lý do: cả 6 đều là lỗi **so sánh** — một mặt đất màu cỏ trông vẫn "bình
  thường" cho tới khi đặt cạnh mặt đất đất-son của kỷ bên; một chân trời xám chỉ lộ ra khi nằm
  giữa chân trời hồng của bình minh và chân trời hồng của hoàng hôn. Xếp 90 ô vào **một tấm ảnh**
  là thứ biến chúng từ vô hình thành hiển nhiên. `scripts/city-preview.mjs --sweep` (một bundle,
  MỘT WebGL context dùng lại, ~21 giây cho 5 kỷ) là công cụ, không phải sản phẩm phụ.

  **6 lỗi, mà hoá ra 4 trong số đó là CÙNG MỘT LỖI:**
  1. **Mái nhà tím sen rực ở 6/15 kỷ** (kỷ 5, 6, 8, 11, 12, 15 — đo được góc màu 305–342° ở độ tươi
     0,50). 2. **Mặt đất màu cỏ nhân tạo ở 7/15 kỷ** (102–117°) trong khi kỷ 7 và 11, *cùng họ màu
     lam-tím*, lại ra đất nâu. 3. **Ô cửa kính ngả tím** ở kỷ sắc cam. 4. **Ánh trăng màu XANH LỤC**
     (`#93beb4`) — sống sót lâu vì chỉ hiện lúc 19–4 giờ.
     → Cả bốn là **cùng một cái bẫy `mixHue` đã cắn dự án lần thứ tư**: nội suy GÓC MÀU luôn đi
     đường ngắn trên vòng tròn màu, mà (a) từ lam sang đất nung thì đường ngắn **chạy xuyên qua
     vùng tím**, và (b) hai góc cách nhau ~180° thì **hướng đi lật ngẫu nhiên**. Ba lần trước đều
     vá riêng lẻ đúng chỗ vừa phát hiện. Lần này vá **PHÉP PHA**: mọi sắc kỷ nay trộn trong RGB
     (`blend`/`material` trong `palette3d.js`) — đi qua màu XÁM đúng như người vẽ pha bột màu, nên
     **không đầu vào nào còn đẻ ra được màu tím và không còn chỗ nào để lật hướng.** Phần thưởng
     kèm theo chính là thứ làm ra "chất tranh": trộn RGB tự bạc màu ở giữa, nên kỷ có sắc đối lập
     ra mái TRẦM (xám tía, mận chín, rượu vang) còn kỷ sắc gần ra mái TƯƠI (đất nung, vàng đất) —
     15 kỷ 15 sắc mái, không sắc nào rơi ra ngoài dải vật liệu có thật.
  5. **Theme tối thì GIỮA TRƯA cũng tối như nửa đêm** — lỗi nặng nhất. `isDark` cũ trả lời hai câu
     hỏi khác nhau bằng một biến. Nguyên tắc chốt lại: **thành phố là một Ô CỬA SỔ** — cảnh nhìn
     qua cửa sổ không tối đi vì ta sơn tường phòng màu đen. Nay có `daylight` ⇒ **đồng hồ quyết**;
     không có (bảo tàng, chỗ gọi cũ) ⇒ vẫn theo theme y như trước. Đóng luôn `TECH_DEBT #11`.
  6. **Chân trời 8 giờ sáng ra XÁM CHẾT** (đo được độ tươi **0,06**) còn bình minh thì ĐỈNH trời ra
     nâu ô-liu — vì cả vòm trời dùng chung một đích. Tách thành `skyHue` (đỉnh, luôn lạnh) và
     `horizonHue` (chân, luôn giữ hơi ấm — trừ đêm). Thêm: **vùng đất ngoài phố** (chiếm nhiều
     diện tích hơn cả trời lẫn thành phố cộng lại) nay pha về đúng màu chân trời của chặng, tức
     phối cảnh không khí thật; **mặt nước** thôi là miếng dán lam bất biến (`#7f9ebd` y hệt ở 5
     chặng) mà bắt lửa theo chân trời; **đèn cửa sổ** mờ dần theo `lampEnergy` thay vì sáng y hệt
     lúc 6 giờ sáng và 10 giờ đêm; giữa trưa hạ cao độ nắng 0,92→0,84 và đèn nền 0,92→0,80 để khối
     có lại mặt sáng/mặt tối (cột 12 giờ trước đây phẳng nhất, nhạt nhất cả bảng).

  **Nghiệm thu**: 425 test xanh (+7 bài mới), lint sạch, build xanh. ⚠️ **Cả 5 bài test mới đều đã
  được xác minh ĐỎ trên code cũ trước khi nhận** — một bài test mỹ thuật chưa từng đỏ thì không
  chứng minh được gì. Đã chụp lại và soi đủ 180 cảnh sau khi vá.

- **2026-08-12 (deploy)** — **Gộp cả 4 commit Thành Phố vào `main` → lên production.**
  ⚠️ **Bài học vận hành, dễ mất thời gian nếu quên**: cả 4 commit ban đầu chỉ nằm ở nhánh
  `claude/xay-san-pham-huong-nay-nasr3n`. Đàm chờ 5 phút không thấy gì đổi trên
  `pomodoro-dc.vercel.app` và tưởng deploy hỏng. **Vercel CHỈ cập nhật production khi có push vào
  `main`**; push vào nhánh khác chỉ sinh bản Preview (lại còn thường bắt đăng nhập Vercel mới xem
  được trên iPhone — gói Hobby). Trang Overview của Vercel có nói thẳng điều này ở dòng *"To update
  your Production Deployment, push to the `main` branch"*, nhưng rất dễ lướt qua.
  ⇒ **Từ nay: xong việc mà Đàm cần THẤY trên máy thật thì phải hỏi gộp vào `main`, đừng dừng ở
  nhánh rồi báo "đã deploy".** Gộp lần này là **fast-forward, 0 xung đột** (main đang ở `2c24e0f`,
  là tổ tiên trực tiếp) — `2c24e0f..4f371ad`. Đã chạy lại 360 test + lint + build ngay trước khi
  push, và đếm lại Serverless Function: **10/12**, còn dư 2.

- **2026-08-12 (Phase 3F)** — **THÀNH PHỐ RA TRANG CHỦ.**
  Đàm: *"đem nó ra trang chủ hoặc làm cái gì đó đột phá hơn nữa"*. Đây là thay đổi ít code nhất mà
  nặng ký nhất của cả nhánh 3D: **thứ Đàm xây được trước nay gần như vô hình đúng vào lúc anh đang
  xây nó** — thành phố nằm trong một tab riêng, mà lúc đang tập trung thì không ai đi mở tab khác.
  Đưa nó ra sau lưng đồng hồ đếm ngược thì vòng lặp khép kín: làm việc → thấy thành phố lớn lên →
  muốn làm tiếp. Không thêm tính năng nào, chỉ đổi chỗ đứng.
  - `components/city/CityBackdrop.jsx` — **thuê lại `CityStage`, KHÔNG dựng cảnh riêng.** `CityStage`
    và `CityScene3D` nhận thêm 4 công tắc (`chrome`/`still`/`fill`/`interactive`) để cùng một bộ vẽ
    đóng được hai vai: màn hình để NGẮM (tab Thành Phố) và khung cảnh để LÀM VIỆC PHÍA TRƯỚC.
  - ⚠️ **Luật ở trang chủ ngặt hơn tab Thành Phố — vì THỜI LƯỢNG, không phải thẩm mỹ.** Tab Thành
    Phố mở vài chục giây; trang chủ mở 25 phút liền. Nên: **đang chạy phiên ⇒ đứng yên tuyệt đối**
    (0 nhịp rAF; vừa để tiết kiệm pin vừa để không có gì nhúc nhích sau lưng đồng hồ kéo mắt Đàm);
    **điện thoại ⇒ luôn đứng yên** kể cả lúc rảnh (dải thành phố ló ra sau thẻ đồng hồ trên màn hẹp
    quá mỏng để mắt nhận ra chuyển động, mà giá phải trả thì y hệt máy bàn — đây đúng chỗ bỏ hoạt
    hoạ đi không mất gì); **không nhận thao tác** (`interactive={false}` — `wheel` của bộ vẽ đăng ký
    `passive:false` và có `preventDefault`, bật lên là nuốt cú cuộn trang); **hỏng thì biến mất
    không một lời** (`fallback={() => null}`, khác mọi chỗ khác trong app — thứ nó nằm phía sau là
    công cụ chính, không được để một lớp trang trí làm mất cái đồng hồ).
  - **Máy yếu ⇒ KHÔNG lùi về bản 2D ở đây**, chỉ trả về nền trơn. Bản 2D isometric là hình minh hoạ
    sắc nét có viền — đặt sau lưng đồng hồ nó đọc ra "ảnh dán nhầm chỗ" chứ không ra "khung cảnh".
    Tab Thành Phố thì vẫn luôn có đủ bản 2D như cũ.
  - **Nạp LƯỜI** dù nằm ngay màn hình đầu: nạp tĩnh đo được **+4,9 KB gzip** vào chunk chính, tức
    làm chậm đúng thứ phải hiện ra trước nhất (cái đồng hồ). Sau khi cho lười: chunk chính
    **134,54 KB gzip**, tức +0,1 KB so với trước Phase 3F.
  - Cài đặt mới `cityHomeBackdrop` (mặc định BẬT), `settingsStore` **version 7 → 8**.
    ⚠️ Bản lưu cũ chuẩn hoá bằng `!== false` chứ KHÔNG phải `=== true` — viết `=== true` (phản xạ
    tự nhiên, và đúng cho `cityPerfHud` ngay bên cạnh vì cái đó mặc định TẮT) sẽ làm tính năng mới
    tắt sẵn với đúng những người đã dùng app từ trước, nghĩa là với chính Đàm. Đã có test riêng
    (`settingsStore.migrate.test.js`) và **đã xác minh nó ĐỎ khi viết `=== true`**.
  - **Đã soi bằng ảnh chụp thật của app đã build** (Mac 1680, laptop 1280, iPhone 390 · cả 2 theme).
    Dựng một khung chụp riêng có **chặn Supabase ở tầng phân giải tên miền** để phiên chụp tuyệt đối
    không thể ghi gì lên dữ liệu thật. Kết quả: bề ngang Mac cho ra hai dải thành phố sáng đèn ôm
    hai bên thẻ đồng hồ, chữ đọc rõ ở cả hai theme. (Nhân tiện xác nhận: hiện tượng tràn ngang trên
    khung 390px là **có sẵn từ trước**, chụp với lớp nền TẮT ra y hệt — không phải do Phase 3F.)
  - **418 test** (+6) · lint sạch · build xanh.

- **2026-08-12 (Phase 3D)** — **THÀNH PHỐ ĐỔI THEO GIỜ: mở app lúc nào là ra cảnh lúc đó.**
  Đàm: *"nhiều animation lên và nhiều hiệu ứng hơn"*. Đây là hiệu ứng đắt giá nhất trong cả nhánh
  3D tính theo tỉ lệ công/kết quả: **không thêm một hình khối nào, không thêm một byte state nào**,
  mà thành phố thôi là một tấm ảnh và thành một NƠI CHỐN đang trôi qua thời gian cùng Đàm.
  - **6 chặng trong ngày** (`engine/city3d/daylight.js`, THUẦN — nhận GIỜ làm tham số, không đụng
    `Date`): rạng sáng · sáng · trưa · chiều · chạng vạng · đêm. Mỗi chặng đổi hướng + độ ấm +
    cường độ nắng, cường độ đèn nền, sắc trời, và **cửa sổ có sáng đèn hay không**. Lấy **giờ Việt
    Nam**, không phải giờ máy. KHÔNG nội suy giữa hai chặng — cảnh chỉ dựng lại khi bố cục đổi, nội
    suy sẽ tốn công tính cho một thứ không ai ngồi nhìn nó chuyển động.
  - **Ô cửa sáng đèn** ban đêm: tách riêng thành khối vật liệu tự phát sáng (`MeshBasicMaterial`,
    tắt sương mù) — ban ngày không tách nên **không tốn thêm lệnh vẽ nào**.
  - **Vũng sáng ấm hắt xuống chân công trình** (tối đa 3 đèn, điện thoại 2). Đây là chi tiết biến
    cảnh đêm từ "có đèn" thành "có người ở": ô cửa tự phát sáng thì KHÔNG rọi ra ngoài, nên nếu
    thiếu vũng sáng này thì cửa sáng trưng mà chân tường vẫn tối om, đọc ra như hình dán.
  - ⚠️ **BA LỖI CHỈ ẢNH CHỤP MỚI THẤY — cả ba đều lint/test xanh:**
    1. **Đêm gần như ĐEN THUI** (đo được mặt đất `#030401`). Đêm bị làm tối ở hai chỗ độc lập rồi
       nhân dồn lên nhau: sơn chuyển sang bảng màu tối (~2,9×) **và** màu đèn bán cầu lấy từ chính
       bầu trời đêm nên cũng tối (~2×) — tổng ~5,8× trong khi hệ số bù mới có 1,45×.
       ⇒ Bài học: **cường độ đèn phải bù cho cả độ đậm của MÀU đèn** (hai thứ nhân nhau).
    2. **Bầu trời ngả hồng/tím sen** — chân trời trưa `#e0b8c9`, đỉnh trời bình minh `#cf63c2`, đèn
       bán cầu `#45395f`. Cùng MỘT gốc rễ, lộ ra **ba lần ở ba chỗ khác nhau**: nội suy góc màu
       luôn đi đường ngắn trên vòng tròn màu, mà cam bình minh ↔ lam nằm gần như đối diện nhau nên
       đường ngắn chạy xuyên qua vùng TÍM. ⇒ Sửa vào GỐC: đường dựng màu trời nay **không còn phép
       xoay góc màu nào**, cả ba bước đều trộn trong RGB (đi qua màu xám, đúng cách người vẽ làm).
    3. **Cái ao biến thành hộp đèn** — một tấm vàng rực giữa thành phố tối. Mặt nước đang mượn
       chung vai màu `glass` với cửa sổ, mà ban đêm vai `glass` được đối xử là "tự phát sáng".
       ⇒ Bài học: **vai màu không chỉ là "màu gì", còn là "được đối xử thế nào"**; đã tách vai
       `water` riêng (rẻ hơn một danh sách ngoại lệ phải nhớ cập nhật).
  - **Công cụ soi lỗi cũng có lỗi, và nó nguy hiểm hơn cả ba lỗi trên**: `scripts/city-preview.mjs`
    nhận `--hour` nhiều lần nhưng chỉ vẽ giờ CUỐI, hai file kia vẫn nằm nguyên trên đĩa từ lần chạy
    trước. Tôi đã mở đúng hai file cũ đó, tưởng là bản mới, và kết luận sai rằng bản vá không ăn
    thua. **Một công cụ im lặng đưa dữ liệu cũ còn tệ hơn không có công cụ.** Đã sửa để vẽ đủ mọi
    giờ được truyền vào.
  - **Khoá lại bằng test** (412 bài, +18): quét bầu trời 24 giờ × 2 theme × 6 kỷ để bắt sắc tím ·
    tỉ lệ đèn nền đêm/trưa ≥ 3 · đèn sân chỉ bật khi cửa sổ sáng · mặt nước không mang vai `glass`.
    ⚠️ Bài test bầu trời **đã được xác minh là ĐỎ trên code cũ** rồi mới nhận — một bài test chưa
    từng thấy màu đỏ thì chưa chứng minh được nó bắt được gì.
  - Đã chạy: **412 test xanh · lint sạch · build xanh** (`vendor-three` 130,8 KB gzip, vẫn dưới trần
    135 KB của cổng 3A).

- **2026-08-12 (Phase 3C)** — **ÁNH SÁNG PHỤC HƯNG: cùng hình khối đó, nhìn ra tranh.**
  Đàm: *"làm đẹp như các bức tranh phục hưng"*. Phase này KHÔNG thêm một hình khối nào — chỉ đổi
  cách ánh sáng và màu được diễn giải. Đó cũng là điều đáng ghi nhớ nhất: **thứ làm cảnh 3D đẹp lên
  hầu như không nằm ở mô hình.**
  - ⚠️ **LỖI LỚN NHẤT, VÀ KHÔNG AI ĐỌC CODE MÀ THẤY ĐƯỢC: mặt trời đứng sau lưng camera.**
    Hướng nắng cũ `(0,78 · 0,54 · 0,46)` đọc lên rất hợp lý ("nắng xiên từ trên cao"). Nhưng camera
    mặc định ở phương vị 45°, còn hướng đó ở ~60° ⇒ **tích vô hướng với trục nhìn = −0,98**, tức là
    đèn flash máy ảnh chiếu thẳng vào mặt vật. Mọi mặt quay về phía ta sáng đều nhau, bóng đổ trốn
    hết ra sau công trình, hình khối bẹp dí — **toàn bộ công dựng dáng nhà ở Phase 3B bị vô hiệu
    bởi đúng MỘT vector**. Sửa: phương vị 150° (vuông góc trục nhìn) ⇒ mỗi khối có một mặt sáng,
    một mặt khuất, bóng rạch chéo qua khung hình. **Đã khoá bằng test** (`cityRenderers.test.js`) —
    lint/build/test hành vi đều không bắt được loại lỗi này, chỉ một phép tính hình học mới bắt được.
  - **Tone mapping** — mặc định three là `NoToneMapping`, tức là mọi giá trị vượt 1,0 bị CẮT PHẲNG:
    tường hứng nắng và mái hứng nắng cùng thành một mảng bệt. Đã thử cả ba: `ACESFilmic` (ngả lạnh,
    rút hết hơi ấm) · `AgX` (nén đẹp nhưng **bạc màu có chủ đích** → thành phố pastel như sữa, đúng
    cái ngược lại với tranh Phục Hưng) · **`Neutral`** (giữ độ tươi ở vùng giữa) ← chọn cái này.
  - ⚠️ **BÀI HỌC KÈM: đổi tone mapping KHÔNG phải một dòng độc lập.** Nó đổi cách MỌI màu hiện ra.
    Đúng lần đổi AgX → Neutral đã làm lộ ra một bàn cờ xanh–vàng ở mặt đất mà AgX vốn đang che
    giúp (chênh lệch góc màu ±9° quá lớn, đã siết còn ±4°). Đổi tone mapping ⇒ phải soi lại mọi chỗ
    dựa vào chênh lệch màu nhỏ.
  - **Viền tối góc (vignette)** — thứ rẻ nhất mà đổi được nhiều nhất về "chất tranh": người vẽ sơn
    dầu luôn dìm bốn góc để dồn mắt vào vùng sáng giữa. Làm bằng **một lớp gradient CSS**, KHÔNG
    phải post-processing: post-processing đòi thêm thư viện, thêm khung đệm toàn màn hình, và vẽ
    lại toàn bộ điểm ảnh MỖI khung hình — khoản đắt nhất có thể thêm vào iPhone. Lớp CSS đứng yên
    cho hiệu quả gần như y hệt với giá bằng **không**.
  - ⚠️ **CHIAROSCURO LÀ KHOẢNG CÁCH SÁNG–TỐI, KHÔNG PHẢI "TỐI ĐI"** — trả giá bằng một ảnh chụp gần
    như đen kịt. Lần đầu hạ đèn nền cho CẢ HAI theme; theme sáng đẹp hẳn lên, theme tối thành không
    đọc nổi (bảng màu tối vốn đã đặt tường ở 0,36). Ở theme tối, muốn giữ khoảng cách đó thì phải
    kéo vùng sáng LÊN ⇒ cần **NHIỀU** đèn nền hơn theme sáng, không phải ít hơn.
  - **Hai theme nay là hai CẢNH khác nhau, không phải một cảnh vặn nhỏ độ sáng**: theme sáng = nắng
    chiều ấm (chân trời vàng 40°); theme tối = **chạng vạng, trời xanh lam sâu** (224°) + mặt đất
    **giảm độ tươi mạnh** (0,26 → 0,12, đúng hiệu ứng Purkinje: ánh sáng yếu thì mắt mất khả năng
    phân biệt màu). Viền tối cũng nhẹ hơn hẳn ở theme tối — nó là thứ tương đối với nền nó phủ lên.
  - **Cửa sổ nay là LỖ THỦNG, không phải tấm nhựa xanh** — độ đậm 0,52 → 0,26, độ tươi 0,36 → 0,16.
    Nhìn từ ngoài vào ban ngày, cửa sổ gần như đen; đó là thứ cho mặt tiền chiều sâu.
  - **Camera lại gần** (1,85 → 1,5 × lưới): lưới luôn 12×12 nhưng mỗi kỷ chỉ có 5 bản vẽ, nên rìa
    **vĩnh viễn** là đất trống — ở 1,85 thì khung hình bị chiếm bởi đúng phần không có gì để nhìn.
    Tham số camera nay ở `cityOrbitOptions()` (một nguồn sự thật, dùng chung với trang xem thử).
  - **Quầng sáng mặt trời nướng sẵn vào màu đỉnh của vòm trời** — tính MỘT LẦN lúc dựng cảnh, 0 chi
    phí mỗi khung hình. Vòm trời lên 32×16 để quầng không lộ mảng tam giác.
  - **393 → 394 bài test.** Lint + build xanh. Chunk chính KHÔNG to thêm (134,44 KB gzip).

- **2026-08-12 (Phase 3B-3)** — **CƯ DÂN: thành phố có người ở.**
  Đàm xem bản 3A rồi nói *"quá đơn giản và không đẹp"* + *"tối ưu hình ảnh và **cộng đồng cư dân**"*.
  Đây là mảng "cộng đồng cư dân" trong câu đó.
  - **Dân số SUY RA, không lưu vào state** — cùng nguyên tắc với cảnh vật và với toạ độ (ADR-007):
    `deriveResidentCount` = f(số công trình, số phiên, độ dài chuỗi). **0 byte** thêm vào khối JSONB
    đang chịu CAS trên Supabase, và không bao giờ lệch giữa hai máy. Trần 28 người (ngưỡng hiệu
    năng, không phải con số đẹp). Đường cong dốc lúc đầu rồi thoải: 0→4 người phải cảm nhận được ở
    những phiên đầu tiên (lúc dễ bỏ cuộc nhất), 20→24 thì gần như không ai đếm.
  - ⚠️ **CHUYỂN ĐỘNG LÀ HÀM CỦA THỜI GIAN, không phải biến cộng dồn.** `residentAt(route, time)`
    nhận thời điểm làm tham số. Ba cái lợi, cái thứ ba mới là lý do thật: (a) test được — đưa vào
    t = 12,5 giây thì biết chắc người ở đâu; (b) bỏ lỡ khung hình không làm thành phố trôi chậm
    lại; (c) **Đàm rời tab nửa tiếng rồi quay lại, thành phố hiện ra ở đúng trạng thái ĐÁNG LẼ phải
    có** thay vì đứng im từ lúc bị đóng băng.
  - ⚠️ **BUG ĐÃ BỊ TEST BẮT — cư dân bay xuyên qua nhà.** Bản đầu đi theo THỨ TỰ MẢNG `roadCells`,
    nhưng mảng đó đã bị `computeCityLayout` sắp lại theo **chiều sâu isometric** (để bộ vẽ 2D xếp
    lớp đúng) — hai phần tử liền nhau trong mảng hoàn toàn có thể nằm ở hai đầu thành phố. Test đo
    được bước nhảy **3,6 ô**. Đã sửa: dựng `roadSet` + quan hệ kề-nhau 4 hướng thật rồi mới đi, khép
    kín tuyến bằng cách đi ngược lại chính lộ trình (tính kề nhau được bảo đảm miễn phí).
  - ⚠️ **HAI KHỐI MỚI RA HÌNH NGƯỜI, MỘT KHỐI THÌ KHÔNG.** Bản đầu dùng đúng một hộp; ảnh chụp gần
    cho thấy những **viên gạch màu** trôi trên đường. Thứ làm mắt nhận ra dáng người ở cỡ vài điểm
    ảnh không phải tay chân — mà là **một chấm NHỎ HƠN, SÁNG HƠN đặt trên một khối lớn hơn, tối
    hơn** (ngôn ngữ của quân cờ vua và hình nhân Lego). Thêm vai màu `skin` vào bảng màu, **không
    pha sắc kỷ** (người thời nào cũng một màu, và chính vì nó KHÔNG thuộc họ màu công trình nên mắt
    mới bám vào được). Giá: 12 tam giác + 1 lệnh vẽ cho cả cộng đồng.
  - ⚠️ **ĐÁNH ĐỔI CÓ CHỦ Ý VỚI LUẬT PIN.** Cư dân đi lại ⇒ phải vẽ liên tục ⇒ phá luật "đứng yên =
    0 nhịp rAF" của Phase 3A. Chấp nhận, vì tab Thành Phố là màn hình Đàm mở ra để NGẮM và chuyển
    động chính là nội dung của nó. **Ba lớp bảo vệ pin thay thế**: (a) **trần 30 khung/giây**
    (`targetFps` mới ở `renderLoop`) — trên iPhone ProMotion không có trần này là vẽ gấp bốn lần
    công việc cần thiết; (b) dừng hẳn khi rời tab; (c) tắt sạch khi bật "giảm chuyển động" của hệ
    điều hành, và trong bảo tàng (kỷ đã niêm phong đứng yên tuyệt đối).
  - ⚠️ **NGƯỠNG WATCHDOG PHẢI TÍNH THEO TRẦN MÌNH TỰ ĐẶT.** Đặt trần 30 rồi vẫn coi dưới 24 là máy
    yếu thì chỉ cần trượt vài khung là watchdog hạ xuống 2D — máy hoàn toàn khoẻ mà bị đuổi khỏi
    3D. `slowThresholdFor(targetFps)` = min(24, trần × 0,7).
  - **375 → 393 bài test** (+8 cư dân, +10 nhịp khung hình). Lint + build xanh.
  - Hai chỗ dễ sai đã bịt: `useEffect` phải có `reduceMotion`/`sessionCount`/`streakLength` trong
    danh sách phụ thuộc (cả ba đọc lúc DỰNG cảnh, không có đường cập nhật sau) — và ba prop đó phải
    là **SỐ RỜI**, không gói thành object (object mới mỗi lượt render cha ⇒ dựng lại cả cảnh WebGL
    vài lần mỗi giây). Cao độ chân người dùng chung hằng số `ROAD_LIFT` với mặt đường.

- **2026-08-12 (Phase 3A)** — **THÀNH PHỐ 3D THẬT (three.js) + bảng đo hiệu năng. ✅ ĐÃ QUA CỔNG.**
  Phase này CỐ Ý xấu: hình khối còn là hộp thô. Mục tiêu là **đo xem iPhone có kham nổi không**
  trước khi đầu tư vào mỹ thuật (Phase 3B). Nhưng đo trên đúng TẢI THẬT — 144 ô nền, số công trình
  thật, bóng đổ bật — chứ đo 5 cái hộp thì con số chẳng dự đoán được gì.
  - **Thêm đúng 1 thư viện**: `three@0.185.1` — ghim cứng KHÔNG có `^` (đổi phiên bản three là đổi
    cả hành vi WebGL, không được để npm tự nâng). Đã kiểm: thư viện này **0 dependency con**.
  - **Chunk chính KHÔNG to thêm**: 134,4 KB gzip, y hệt trước khi thêm three. three nằm ở chunk
    riêng `vendor-three` (130,16 KB gzip) chỉ tải khi thật sự mở bản 3D. Đã xác minh bằng cách đọc
    `dist/sw.js`: **0/45 mục precache** là three, nhưng có luật `CacheFirst` bù lại nên tab 3D vẫn
    mở được khi mất mạng. Thiếu MỘT trong hai vế là hỏng: thiếu `globIgnores` thì tải 130 KB mỗi
    lần mở app; thiếu `runtimeCaching` thì mất mạng là tab 3D trắng.
  - **Kiến trúc**: 4 file THUẦN ở `src/engine/city3d/` (`renderMode` luật chọn 3D/2D · `renderLoop`
    nhịp khung hình · `orbit` toán camera · `palette3d` màu) — test được bằng `node --test` không
    cần trình duyệt. `components/city/render3d/` là NƠI DUY NHẤT được `import 'three'`.
  - ⚠️ **LUẬT PIN — quan trọng nhất cả phase**: KHÔNG có vòng lặp thường trực. Cách thường thấy là
    chạy `setAnimationLoop` 60 lần/giây rồi bên trong kiểm tra cờ "có gì đổi không" — vòng đó **vẫn
    đánh thức CPU 60 lần mỗi giây** dù thành phố đứng yên tuyệt đối. Ở đây: đứng yên ⇒ **0 nhịp
    rAF**. Hai hệ quả BẮT BUỘC nhớ: (a) **FPS chỉ đo được lúc đang kéo xoay** — đo lúc đứng yên ra
    0 và watchdog sẽ hạ 2D oan; (b) **bóng đổ phải tắt tự-cập-nhật** (`shadow.autoUpdate = false` ở
    CẢ đèn lẫn renderer), vì mặc định của three là vẽ lại shadow map MỖI khung hình — nó âm thầm
    biến mọi khung hình thành đắt như khung đầu tiên. Cả thành phố gộp còn **3 lệnh vẽ**.
  - **Ba cửa lùi về 2D**, cửa nào cũng phải dẫn về hình chứ không dẫn tới màn hình trống: không có
    WebGL2 → 2D ngay · dựng cảnh thất bại → 2D · đang chạy mà mất context / quá chậm → tự chuyển
    về 2D **kèm một dòng nói rõ vì sao** (không nói thì Đàm chỉ thấy hình đột nhiên đổi kiểu).
  - ⚠️ **FAIL-CLOSED, nhưng "thiếu thông tin ≠ máy yếu"**: Safari không có `deviceMemory` lẫn
    `connection`. Nếu coi `undefined` là "yếu" thì **mọi iPhone đều rớt xuống 2D** — tức giết đúng
    mục tiêu mà cả nhánh 3D sinh ra để phục vụ. Chỉ loại khi biết CHẮC là yếu. Có test khoá.
  - **2 lỗi thật do test bắt được, đã sửa**: (1) **kéo dọc bị đảo chiều** so với quy ước
    `OrbitControls` (kéo xuống phải nghiêng về góc nhìn từ trên) — kiểu bug người dùng cảm thấy
    ngay nhưng đọc code không thấy; (2) **rời tab gọi `stop()`** mà `stop()` là VĨNH VIỄN ⇒ quay
    lại tab là thành phố đóng băng, không cách nào cứu. Đã tách `pause`/`resume` riêng.
  - **315 → 360 bài test, 0 fail.** Lint + build xanh. `settingsStore` version 6 → 7 (thêm
    `cityRenderMode` + `cityPerfHud`) — đặt ở đây chứ KHÔNG phải `gameStore` vì đây là sở thích của
    TỪNG MÁY, và store này không lên Supabase nên thêm **0 byte** vào khối JSONB đang chịu CAS.
  - Tài liệu: `ARCHITECTURE.md` (luật pin + 3 cửa lùi) · `PROJECT_STRUCTURE.md` · `MIGRATION.md`
    (settingsStore 6→7) · `CHANGELOG.md`.
  - ✅ **CỔNG ĐÃ QUA** — nhưng qua bằng **quyết định của Đàm**, không bằng số đo: Đàm xem trên máy
    thật rồi ra lệnh *"hãy tiếp tục xây dựng sản phẩm và không dừng lại"*. ⚠️ **Vì cổng không được
    đóng bằng số, mọi lưới an toàn phải giữ NGUYÊN** — watchdog FPS, ba cửa lùi 2D, trần 30
    khung/giây, dừng khi rời tab. Nếu sau này máy Đàm nóng/tụt pin thì đường lùi vẫn còn đủ, và
    bản 2D vẫn nằm đó làm nền (ADR-008). Muốn có số thật thì bật *"Hiện bảng số liệu hiệu năng"*
    trong Cài đặt rồi mở tab Thành Phố — nay có cư dân đi lại nên FPS hiện số thật, không cần kéo
    xoay như trước nữa.

- **2026-08-12 (công cụ)** — **Sửa glob test: từ nay test đặt ở thư mục con cũng chạy.**
  Trước đây `npm test` liệt kê tay từng thư mục và mỗi mục chỉ quét **một cấp**
  (`src/components/*.test.js`). File test đặt trong thư mục con (`src/components/city/…`,
  `src/engine/city3d/…`) sẽ **không bao giờ chạy mà cũng không báo lỗi gì** — nguy hiểm hơn test
  đỏ, vì nó tạo cảm giác an toàn giả. Ghi vào `TECH_DEBT #10` lúc phát hiện, rồi **xử lý dứt điểm
  ngay cùng ngày** khi Phase 3A cần đặt test cạnh `city/render3d/` và đụng đúng cái bẫy đó.
  - Glob nay là `'electron/**/*.test.js' 'src/**/*.test.js' 'api/**/*.test.js'`, **để trong nháy
    đơn** cho chính `node --test` mở rộng. ⚠️ Bỏ nháy là hỏng: POSIX `sh` không có globstar nên
    `**` co lại thành `*`, và `src/**/*.test.js` sẽ **mất** các test ở cấp trên.
  - Đổi có chứng minh, không đổi liều: đối chiếu **tập hợp file** cũ ↔ mới bằng `fs.globSync` →
    **31 file, giống hệt, 0 mất 0 thêm**; `npm test` giữ nguyên 315 bài.
  - Nhờ vậy đã chuyển `cityRenderers.test.js` về đúng chỗ (`src/components/city/`), cạnh thứ nó
    canh gác — đúng quy ước "test nằm cạnh file nguồn" của `PROJECT_STRUCTURE.md`.
  - Từ nay **thêm thư mục mới KHÔNG cần sửa `package.json`** nữa. Tài liệu: `CLAUDE.md` ·
    `PROJECT_STRUCTURE.md` · `TECH_DEBT.md` #10 (Resolved).

- **2026-08-12 (Phase 3-2D)** — **THÀNH PHỐ: tab hiện ra, Đàm nhìn thấy thành phố lần đầu.**
  Thuần hiển thị: **0 dòng đụng `store/`, `engine/`, `hooks/`, `lib/`**, không thêm thư viện nào.
  - Tab mới "Thành Phố" nạp lười (chunk riêng ~14 KB, không nặng lần mở app đầu). Sửa `App.jsx`
    đúng 5 chỗ: import lười · icon `AppIcon.city` · 2 danh sách tab · khối render.
    ⚠️ **CỐ Ý không cho vào nhóm 4 tab chính của iPhone** (`MOBILE_PRIMARY_IDS`) — thanh dưới giữ
    nguyên 4 nút, "Thành Phố" nằm trong nút "Thêm".
  - `src/components/city/` chia làm **KHUNG** (`CityViewShell.jsx`: chuyển kỷ, số liệu, 2 trạng
    thái rỗng) và **BỘ VẼ** (`render2d/CityCanvas2D.jsx` + `CityTile.jsx` + `tokens2d.js`).
    Khung KHÔNG biết bộ vẽ nào đang chạy — bộ vẽ vào qua `children` và tự định kích thước.
  - Hiệu năng: 144 ô nền gộp thành **4 phần tử SVG** (không phải 144), đường sá gộp thành 1. Chỉ
    nhà + cảnh vật nổi mới là phần tử riêng. Không quét lại `history` khi render (`TECH_DEBT #6`).
  - **309 → 315 bài test, 0 fail.** Lint + build xanh. Phase này không thêm logic thuần nào (mọi
    thứ mới đều là JSX, bố cục đã được 36 bài của Phase 1 khoá), nên 6 bài mới
    (`src/components/cityRenderers.test.js`) không test hành vi mà **đọc thẳng mã nguồn để khoá
    ranh giới kiến trúc** — cùng thủ pháp đã dùng cho "3 danh sách trường được lưu" ở Phase 2.
    Khoá 5 luật: chỉ `render3d/` được `import 'three'` · khung không import bộ vẽ · hai bộ vẽ không
    import lẫn nhau · bộ vẽ không đọc store · `tokens2d` không rò ra ngoài `render2d/`.
    ⚠️ **Viết NGAY BÂY GIỜ dù three.js chưa tồn tại** — đúng lúc Phase 3A thêm nó vào mới là lúc dễ
    vi phạm nhất, một lần lỡ `import` tĩnh ở file ngoài là ~130 KB rơi vào chunk chính. Đã thử phá
    hoại 2 lần để xác nhận test fail thật, không phải pass rỗng (có cả 1 bài tự canh cách quét).
  - ⚠️ **Quyết định kiến trúc — ADR-008**: **bộ vẽ 2D là nền VĨNH VIỄN, không phải bản nháp.** Kế
    hoạch 3D (three.js) đã duyệt, nhưng WebGL không phải thứ chắc chắn có: máy có thể không hỗ trợ
    WebGL2, iOS hay **mất context giữa chừng** khi thiếu bộ nhớ, Đàm có thể tự tắt 3D cho đỡ tốn
    pin, và cổng hiệu năng Phase 3A có thể TRƯỢT. Trong mọi tình huống đó màn hình vẫn phải hiện
    được. Vì vậy KHÔNG xoá bản 2D kể cả khi 3D chạy tốt.
  - Tài liệu: `ARCHITECTURE_DECISIONS.md` ADR-008 · `ARCHITECTURE.md` (mục 7: luồng vẽ 3 chặng) ·
    `PROJECT_STRUCTURE.md` (cây `city/` + 2 quy tắc đặt file mới) · `CHANGELOG.md`.
    Sửa luôn 1 lỗi tài liệu: dòng Phase 1 bên dưới ghi "ADR-010" trong khi bản ghi thật là ADR-007.

- **2026-08-12 (Phase 2/6)** — **THÀNH PHỐ PIXEL: niêm phong thành phố kỷ cũ thay vì xoá (schema 3→4).**
  Phase DUY NHẤT đụng vào state đã lưu. **Cân bằng game không đổi một chút nào** — công trình kỷ cũ
  vẫn bị cắt y hệt, chỉ được sao chép sang kho `cityArchive` chỉ-để-ngắm trước khi bị vứt.
  - 6 thay đổi trong `gameStore.js`: state `cityArchive: {}` · `pruneEraScopedBlueprintState` nhận
    thêm tham số `sealContext` (mặc định `null`) · `completeFocusSession` là chỗ DUY NHẤT truyền
    `sealContext` · `normalizePersistedGameState` · `partialize` · `GAME_STORE_SCHEMA_VERSION` 3→4.
  - ⚠️ **PHÁT HIỆN QUAN TRỌNG — spec bỏ sót 2 trong 3 danh sách trường được lưu.** Dự án có **BA**
    danh sách viết tay riêng biệt, không dùng chung nguồn nào: `partialize` (localStorage),
    `handleExport` ở `ExportImport.jsx` (file backup JSON), `getExportableState` ở `syncService.js`
    (đồng bộ Supabase). Spec chỉ nhắc `partialize`, lại còn CẤM đụng `syncService.js` — làm y spec
    thì **bảo tàng chỉ tồn tại trên đúng cái máy đã lên kỷ, iPhone thấy trống, cài lại app là mất
    sạch**. Đã hỏi và **Đàm chốt: phải đồng bộ** → thêm đúng 1 dòng vào mỗi nơi (KHÔNG đụng gì tới
    cơ chế CAS "First Action Wins"). Có test tự động ĐỌC MÃ NGUỒN cả 3 nơi để bắt lỗi bỏ sót về sau.
  - +12 bài test mới (`src/store/gameStore.cityArchive.test.js`), gồm 2 bài chống-hồi-quy-cân-bằng.
    Sửa 1 bài cũ (`gameStore.test.js`) vốn khoá cứng `SCHEMA_VERSION === 3` — nay là tripwire cho 4.
  - **297 → 309 bài test, 0 fail.** Lint + build xanh. KHÔNG cần chạy SQL Supabase.
  - Tài liệu: `MIGRATION.md` (schema 3→4) · `ARCHITECTURE.md` (mục 7: bảo tàng + cảnh báo 3 danh
    sách trường) · `CHANGELOG.md` · `ARCHITECTURE_DECISIONS.md` ADR-007.

- **2026-08-12 (Phase 1/6)** — **THÀNH PHỐ PIXEL: nền móng thuần, chưa ai nhìn thấy gì.** Theo
  `SPEC Thành Phố Pixel` Đàm duyệt cùng ngày (Đàm **miễn trừ cổng Giai đoạn A** cho hạng mục
  gamification này — quyết định 0.2 của spec). Thêm 2 file engine THUẦN + 2 file test, **0 dòng
  thay đổi ở `store/`, `components/`, `hooks/`** — app chạy y hệt trước.
  - `src/engine/cityLayout.js` — suy ra bố cục thành phố từ danh sách công trình bằng băm tất định
    (FNV-1a), **KHÔNG lưu toạ độ vào state** (quyết định 0.3: thành phố kỷ cũ dựng lại y nguyên
    sau nhiều năm, tốn 0 byte, không đụng `TECH_DEBT #8`/`#9`).
  - `src/engine/cityArchive.js` — "bảo tàng": `mergeCityArchive` / `normalizeCityArchive` /
    `listVisitableEras`. Chưa nối vào store (Phase 2).
  - **+36 bài test** (261 → **297 bài, 0 fail**), lint + build xanh.
  - ⚠️ **Chệch spec CÓ CHỦ Ý, đã ghi ADR-007**: spec đề nghị đặt nhà bằng "dò xoắn ốc theo bpId đã
    sắp xếp". Cách đó chỉ giữ được bất biến "bảo tàng bất động" khi KHÔNG va chạm — mà 5 công trình
    trên lưới 144 ô va chạm ~7%, tức bảo tàng có thể tự xê dịch. Đã thay bằng **khu đất riêng theo
    thứ hạng bản vẽ trong kỷ** (mỗi kỷ đúng 5 bản vẽ → 5 zone rời nhau) ⇒ vị trí mỗi nhà chỉ phụ
    thuộc chính id của nó, bất biến đúng TUYỆT ĐỐI. Chữ ký `placeBuilding(bpId, occupiedSet)` giữ
    nguyên như spec, dò xoắn ốc vẫn còn làm lưới an toàn cho id lạ.
  - ⚠️ **Spec ghi sai số bài test nền**: spec nói nền là 302 bài (và chê tài liệu cũ ghi 261 là
    sai). Đo thật ngày 2026-08-12: **261 bài** — tức tài liệu cũ ĐÚNG, spec sai. Mốc nghiệm thu
    "≥323 bài" của spec vì vậy không dùng được; mốc thật tương đương là ≥283.

- **2026-08-10** — **Sửa khoảng trắng thừa trước icon trên thanh menu Mac.** Đàm báo: đang trong
  phiên pomodoro thì có khoảng trắng trước 🍅, đang giải lao thì có vệt trắng cạnh ☕. Nguyên nhân:
  khi có phiên chạy, tray bỏ icon để chỉ hiện chữ, nhưng chỗ "bỏ icon" lại nạp
  `public/tray-empty.png` — file 16x16 **trong suốt hoàn toàn** (đã kiểm alpha: toàn bộ = 0).
  Không nhìn thấy, nhưng macOS vẫn chừa đủ 16 điểm ảnh chỗ cho nó. Vá: `nativeImage.createEmpty()`
  (ảnh 0x0, không chiếm chỗ) ở `electron/main.js`; xoá hẳn `public/tray-empty.png` (không còn ai
  dùng). Sửa đúng 1 dòng code, cả 2 đường hiện tiêu đề (`updateTrayTitle` +
  `applyRendererTrayUpdate`) đều dùng chung biến `iconEmpty` nên khỏi sửa 2 chỗ. Đã khởi động lại
  LaunchAgent và **chụp màn hình xác nhận bằng mắt**: khoảng trắng đã hết. 261 test + lint + build
  xanh. Bài học ghi vào `CLAUDE.md` thành **BẪY 4**: "ảnh trong suốt" KHÔNG bằng "không có ảnh".

- **2026-08-05 (c)** — **Dọn 2 file lạc chưa commit + diệt gốc nạn nhân bản tài liệu quy tắc.**
  `git status` tồn đọng `AGENTS.md` + `.codex/` từ 31/7 (do Codex tạo, không phải Claude).
  `AGENTS.md` khi đó là BẢN SAO nguyên văn 288 dòng của `CLAUDE.md`, tạo bằng cách thay máy móc
  "Claude"→"Codex" → sinh câu vô nghĩa ("dùng Codex + Codex để code", "Hỏi Codex") và **đường dẫn
  không tồn tại** (`.Codex/session-start-bangiao.sh`, `/Users/damduy/.Codex/projects/...`); tệ hơn,
  chỉ sau 5 ngày nó đã **trôi khỏi bản gốc** — thiếu nguyên mục "App menu bar Mac — 3 cái bẫy", tức
  Codex đọc nó sẽ không biết những bẫy đó và dẫm lại. **Xử lý gốc, không vá**: viết lại `AGENTS.md`
  thành **con trỏ ~40 dòng** trỏ về `CLAUDE.md` (kèm 3 điều nguy hiểm nhất để không cần đọc hết mới
  biết) — bỏ 288 dòng trùng lặp, từ nay chỉ còn MỘT nguồn quy tắc. Thêm quy tắc số 6 vào
  "NGUYÊN TẮC ƯU TIÊN SỐ 1": **cấm tạo bản sao tài liệu quy tắc cho từng công cụ AI**. `.codex/`
  cho vào `.gitignore` cạnh `.claude` (cùng loại: cấu hình cục bộ chứa đường dẫn tuyệt đối của máy
  Đàm, vô dụng ở máy khác) → `git status` sạch trở lại. `PROJECT_STRUCTURE.md` bổ sung dòng
  `AGENTS.md`. **KHÔNG đụng code ứng dụng** — 261 bài test + build vẫn xanh.

- **2026-08-05 (b)** — **Dọn sạch mọi dấu vết dự án đời cũ trên máy (Đàm yêu cầu).** Chuyển Thùng
  rác 10 mục: thư mục dự án cũ `Downloads/Claude Code/Pomodoro Game - USING` (đã rỗng ruột, chỉ còn
  18MB log — KHÔNG phải git repo, không có mã nguồn nào, đã kiểm trước khi xoá); applet
  `DC Pomodoro.app` (724K, không nằm trong git); 2 backup dữ liệu game (`dc-pomodoro-backup-2026-06-24.json`,
  `civjourney-backup-2026-04-23.json`); 2 file thiết kế đời CivJourney; 2 thư mục phiên Claude của
  đường dẫn dự án cũ; 2 log của luồng localhost. **Dùng Thùng rác thay vì xoá vĩnh viễn** để còn
  đường lùi (nhất là 2 file backup dữ liệu thật). Đã quét lại toàn máy: chỉ còn MỘT thư mục dự án.
  ⚠️ **KHÔNG đụng tới** `~/Library/Application Scripts/com.macpomodoro` và
  `~/Library/Mobile Documents/iCloud~com~limepresso~pomodorofree` — đó là app Pomodoro của hãng
  khác, không liên quan dự án. Cũng giữ `~/Library/Application Support/pomodoro-game` (dữ liệu
  Electron của app tray đang chạy). Đã xác nhận app menu bar vẫn chạy sau khi dọn.

- **2026-08-05** — **Sửa "app biến mất khỏi thanh menu Mac" + bật tự khởi động.** KHÔNG đụng một
  dòng code ứng dụng nào (chỉ cấu hình máy + tài liệu). Nguyên nhân: app tray Electron không hề
  chạy (đã tắt từ lần khởi động lại máy nào đó). **3 bài học đắt, đã ghi vào `CLAUDE.md` mục
  "App menu bar Mac"**: (1) `DC Pomodoro.app` trong thư mục dự án KHÔNG phải app tray — nó là
  applet AppleScript đời cũ chạy `serve-dist.mjs` ở localhost:31105 và trỏ vào thư mục cũ
  `Pomodoro Game - USING`; mở nó không làm hiện icon (tôi đã nhầm đúng chỗ này lúc chẩn đoán đầu);
  (2) **launchd không chạy được đường dẫn có chữ tiếng Việt** — luôn thoát mã 78 không stderr, dù
  `plutil -lint` OK và `test -x` thấy file; đây CÙNG HỌ với bẫy NFC/NFD làm test nạp hai bản React
  → phải bọc qua script ASCII `~/Library/Application Support/dc-pomodoro-tray.sh`; (3) `main.js`
  không có khoá chống chạy trùng nên chạy 2 lần = 2 icon. Kết quả: LaunchAgent
  `com.dcpomodoro.tray` (RunAtLoad bật, KeepAlive tắt để nút "Thoát" còn tác dụng), đã xác minh
  bằng ảnh chụp màn hình thật (icon hiện, đếm ngược `🍅 22:34` khớp phiên đang chạy trên web, chỉ
  1 icon). Đã gỡ sạch LaunchAgent cũ `com.civjourney.localhost` (plist vào Thùng rác, khôi phục
  được) — nó thuộc luồng localhost đã bị cấm.

- **2026-07-17 (c)** — **ĐÓNG BLOCKER CRITICAL C1 (đồng bộ).** Đây là task THỰC THI đầu tiên đi
  qua đủ quy trình "Observe → Design → phản biện → Advisor duyệt → Implement": bản thiết kế bị
  chính mình bác 2 lỗi (tín hiệu `debounceTimer` luôn bật; bẫy lỗi đặt sai chỗ vì `pullFromCloud`
  không throw) + 1 lỗ (nhánh ghi không-CAS), rồi Advisor loại tiếp 2 đề xuất thừa (snapshot
  trước import; thêm `savedNotes` vào heuristic — chứng minh được `savedNotes` chỉ là phép chiếu
  của `history`). Sửa **duy nhất `src/lib/syncService.js`**: (a) `debounceTimer` về `null` khi nổ/
  huỷ; (b) rời app (`hidden`/`pagehide`) → đẩy ngay nếu còn thay đổi chờ; (c) `hasMeaningfulState()`
  chặn state trắng ghi đè cloud ở CẢ nhánh else của `initSync` LẪN nhánh `known < 0` (đường ghi
  duy nhất không có CAS — nay đọc cloud trước, lỗi thì hoãn ghi); (d) lỗi `42703` → `console.error`
  chỉ đích danh file SQL cần chạy; (e) nạp bản cloud thì huỷ lịch push mồ côi + cảnh báo. Test
  253→**261** (8 bài mới cho sync, 2 bài cũ sửa vì đặc tả hành vi cũ, + stub chặn debounce 5s thật
  để hết flaky). Lint sạch, build OK. **KHÔNG** làm snapshot A4 — đã ghi `TECH_DEBT.md` #8 kèm
  phân tích dung lượng; phát hiện thêm #9 (persist không bắt `QuotaExceededError`). Giới hạn còn
  lại có chủ đích: xung đột offline khác-trường vẫn mất phần của máy thua (ghi rõ ở
  `ARCHITECTURE.md` mục 2, không giả vờ đã xử lý).

- **2026-07-17 (b)** — **Quy tắc mới vĩnh viễn: TECHNICAL ADVISOR REPORT.** Đàm yêu cầu: sau MỖI
  task hoàn thành, ngoài báo cáo thường phải kèm phần "TECHNICAL ADVISOR REPORT" viết cho một AI
  Technical Advisor độc lập (GPT) đánh giá kiến trúc — ngắn, đủ ngữ cảnh, ≤1-2 trang A4, không
  marketing/tự khen/lặp changelog. **Bổ sung cùng ngày:** nâng từ 9 → **11 mục** (thêm mục 0 "Vì
  sao làm task này lúc này?" trước Mục tiêu, và mục 10 "Đề xuất task tiếp theo" — đúng MỘT task
  kèm trade-off), và **viết 100% tiếng Việt** (tiếng Anh chỉ cho tên file/class/hàm/biến/commit
  hash/API/framework/thuật ngữ không dịch tự nhiên được như CAS, debounce, snapshot, whitelist).
  Format chuẩn đã ghi vào `CLAUDE.md` (mục mới trong Governance Protocol, ngay sau "Báo cáo bàn
  giao cuối phiên") + memory `technical-advisor-report.md`.

- **2026-07-17** — **Giai đoạn A, lưới an toàn ĐỢT 2 (+16 bài, tổng 237→253; chỉ-thêm-test, không
  đụng code app).** Làm nốt phần Priority 1/3 còn thiếu so với đợt 1:
  • `gameMath.test.js` +6 bài `computeLevelUps` (ngưỡng đúng 6000, nhiều cấp một lần, giữa cấp,
    XP=0, và ĐẶC TẢ hiện trạng: XP âm cho levelsGained/spGained ÂM — không kẹp, ghi NOTE).
  • `gameStore.prestige.test.js` (MỚI, 5 bài) — bảo toàn tài sản qua Thăng Hoa: khoá TỪNG khoá
    whitelist sống sót (relics/relicEvolutions/achievements+unlockTimes/history/historyStats/
    savedNotes/sessionCategories/lastWeeklyReportDate/timerConfig/tinhThe + phát hiện `buildings`
    sống sót "ngầm" vì không nằm trong reset-state), khoá TỪNG khoá bị reset, sổ prestige
    (count/+5%/history), dưới ngưỡng 111000 EP → false không đổi gì, và **ĐÓNG BĂNG BUG #3**:
    3 skill Thăng Hoa (kien_thuc_nen/ke_thua/sieu_viet) mở rồi vẫn mất sạch + SP về 0 khi prestige
    — test khẳng định hành vi "hứa mà không làm" hiện tại; khi sửa #3 test này PHẢI đổi có ý thức.
  • `gameStore.completeFocusSession.test.js` +2 bài streak (hôm qua 5→hôm nay 6 kèm longestStreak;
    bỏ 3 ngày→về 1). • `gameStore.test.js` +2 bài `unlockSkill` cơ bản (trừ đúng 22 SP; thiếu SP →
    từ chối, không trừ oan). • `syncService.behavior.test.js` +1 bài retry (push lỗi bị nuốt →
    pushNow kế tiếp vẫn CAS đúng version cũ và thắng — lỗi không đầu độc trạng thái module).
  - Không phát hiện bug MỚI; bug đã biết #3 nay bị đóng băng bằng test. Lint sạch, build OK.

- **2026-07-13** — **Giai đoạn A: dựng "lưới an toàn" test cho 3 đường quan trọng nhất (đòn bẩy #1
  của roadmap POS — làm TRƯỚC khi sửa logic quan trọng).** Đàm ra lệnh chỉ thêm characterization/
  behavior test, KHÔNG refactor/không sửa bug/không đổi API. Đã thêm 3 file test (+29 bài, tổng
  208→237, xanh hết, lint sạch, build OK, **không đổi 1 dòng code app nào**):
  • `src/store/gameStore.completeFocusSession.test.js` (15 bài) — khóa đường-tiền: XP (qua đẳng
    thức `base = xp − missionBonus − streakMission − buildingPerk` để độc-lập-ngày), EP, tier/hệ số,
    tài nguyên/RP/refined, level-up (ngưỡng `EXP_PER_LEVEL`), loot, overclock hoàn gốc, combo, RNG
    tất định (stub `Math.random`), edge 0 phút, category tracking.
  • `src/lib/syncService.behavior.test.js` (8 bài) — khóa push/pull/CAS: upsert khởi tạo, update
    thắng (`.eq(version)`), **thua→re-pull nhận lại bản thắng** (đúng đoạn từng mất phiên thật), nuốt
    lỗi Supabase, initSync (cloud mới/rỗng/không-mới-hơn), shouldImportVersion. Mock singleton
    `supabase` + spy `_importGameData`; re-import "tươi" mỗi test để reset state module. **Test #7
    khóa CHỦ ĐÍCH hành vi rủi ro C1** (nhánh else initSync đẩy local vô điều kiện) làm đặc tả hiện
    trạng — bản vá C1 tương lai phải cập nhật test này.
  • `src/store/gameStore.cancelFocusSession.test.js` (6 bài) — khóa phạt/rollback: non-strict không
    trừ tài nguyên, strict trừ theo trần + mở disaster modal, recordSession:false, mất EP giam +
    reset staking, kẹp progressRatio [0,1], tất định.
  - Phương pháp: PROBE trước (quan sát hành vi thật, xác nhận tất định qua 2 lần chạy) → mới chốt
    golden. KHÔNG đoán. Bug phát hiện được → chỉ ghi NOTE trong file test, KHÔNG sửa (ngoài phạm vi).
  - Bài học kỹ thuật (để phiên sau đỡ vấp): (1) test đụng `syncService` sẽ nạp client Supabase THẬT
    → tạo 1 `MessagePort` giữ event loop sống → phải `unref()` handle trong `after()` kẻo `npm test`
    treo; (2) `setKnownVersion` ghi qua `localStorage` trần còn `getKnownVersion` đọc
    `window.localStorage` — mock phải trỏ CHUNG 1 store (trong trình duyệt là cùng object); (3) tổng
    XP một phiên dính bonus nhiệm vụ seed-theo-NGÀY nên KHÔNG hardcode được — phải khóa phần `base`.
  - Deploy: commit + push theo đúng quy tắc "làm" (test-only nên **bundle production KHÔNG đổi** —
    Vite không đóng gói `*.test.js`; đẩy chỉ để lưu lịch sử + giữ CI xanh, app không đổi hành vi).

- **2026-07-12** — **Thêm AI Engineering Playbook (Operating Manual) — protocol vĩnh viễn THỨ HAI
  cùng ngày, sau Project Governance Protocol bên dưới.** Đàm gửi tiếp một quy trình chi tiết cho
  CÁCH một AI thực hiện từng task (khác Governance Protocol — cái đó quản lý "tài liệu nào cần
  đồng bộ", cái này quản lý "làm task theo trình tự nào"). Đã tích hợp vào `CLAUDE.md` mục mới
  "🛠️ AI ENGINEERING PLAYBOOK": quy trình chuẩn 7 giai đoạn (Hiểu yêu cầu→Audit→Thiết kế→Thực
  hiện→Self Review→Validation→Knowledge Update), trình tự riêng theo loại task (Feature/Bug Fix/
  Refactor/Architecture Change), vai trò AI phải đóng (Senior Engineer/Architect/Reviewer/QA/
  Technical Writer/Maintainer), nguyên tắc kiến trúc (SRP/High Cohesion/Low Coupling/Reuse over
  Rewrite/Composition over Duplication/Explicit over Implicit), quy tắc commit, và mục quan trọng
  nhất: **"không giả định, không suy diễn"** — không chắc về codebase thì đọc code trước, code
  chưa đủ thì đọc tài liệu, tài liệu chưa đủ thì NÓI RÕ điều còn thiếu thay vì tự đoán rồi trình
  bày như sự thật (chính xác nguyên tắc chống-bịa đã áp dụng cho AI Coach, giờ áp dụng lại cho
  chính AI đang code). **Tránh trùng lặp có chủ đích**: phần "Review"/"Session Handoff" của
  Playbook trùng khá nhiều với Governance Protocol đã có — thay vì viết 2 checklist gần giống
  nhau, đã HỢP NHẤT template "báo cáo bàn giao cuối phiên" thành 1 bản 11 mục duy nhất (thêm mục
  "Đề xuất bước tiếp theo" từ bản Playbook vào bản Governance Protocol cũ, đổi số 10→11 mục), và
  phần Review chỉ bổ sung 3 câu hỏi Playbook có mà Governance Protocol chưa có (ADR mới/Migration/
  Lesson Learned) thay vì chép lại toàn bộ Self-audit checklist. Cập nhật kèm: `AI_ONBOARDING.md`
  (thêm mục trỏ tới Playbook), memory `project-governance-protocol.md` (gộp cả 2 protocol vào 1
  memory, sửa số đếm mục đã lệch). Không đổi code/hành vi app nào — thuần tài liệu + quy trình.

- **2026-07-12** — **Thiết lập Project Governance Protocol** (Đàm ra lệnh, áp dụng vĩnh viễn cho
  mọi phiên tương lai). Nguyên tắc cốt lõi: dự án gồm 3 thành phần giá trị NGANG NHAU — Source
  Code, Documentation, Project Knowledge — một task chỉ hoàn thành khi cả 3 nhất quán, KỂ CẢ khi
  code/build/test/lint đều xanh. Thêm **Definition of Done** mới (source+build+test+lint+doc+
  knowledge, thiếu 1 mục = chưa xong) và bảng "loại thay đổi → tài liệu cần cập nhật" vào
  `CLAUDE.md`. **5 file tài liệu MỚI** (ánh xạ trực tiếp từ yêu cầu của Đàm, tránh trùng lặp với
  `BAN_GIAO.md`/`AI_HANDOFF_KNOWLEDGE.md` đã có bằng cách phân vai rõ ràng ngay trong header mỗi
  file): `ARCHITECTURE_DECISIONS.md` (ADR — vì sao 6 quyết định kiến trúc lớn được chọn, phương án
  nào bị loại và tại sao), `TECH_DEBT.md` (7 mục nợ kỹ thuật đã biết, format có cấu trúc — đáng chú
  ý nhất: nghi vấn 3 kỹ năng prestige nhánh Thăng Hoa có thể chưa được nối dây thật vào
  `triggerPrestige()`, CẦN XÁC MINH trước khi Đàm đạt prestige lần đầu), `MIGRATION.md` (lịch sử
  migration schema/path thật, vd bump schema version 0→3, đổi cơ chế sync), `CHANGELOG.md` (tóm
  tắt CHÍNH THỨC ngắn gọn theo mốc, trỏ về nhật ký chi tiết ở đây cho ai cần sâu hơn), và
  `AI_ONBOARDING.md` (bản đọc nhanh 10-15 phút, khác `AI_HANDOFF_KNOWLEDGE.md` là bản đầy đủ). Rà
  soát nhẹ `README.md` (thêm 5 câu hỏi bắt buộc: project là gì/chạy/build/deploy/đọc tiếp gì),
  `ARCHITECTURE.md` (thêm mục storage flow + database schema flow + hướng phụ thuộc), và
  `PROJECT_STRUCTURE.md` (thêm quy tắc import — xác nhận KHÔNG có alias/barrel trong repo — và quy
  tắc đặt tên). Không đổi code/hành vi app nào — thuần tài liệu + quy trình.

- **2026-07-12** — **Refactor kiến trúc toàn dự án (Đàm yêu cầu "Senior Software Architect", 10 nguyên tắc rõ ràng — không sửa lỗi lẻ tẻ, ưu tiên kiến trúc).** KHÔNG đổi business logic (điểm/XP/streak/nhiệm vụ/timer/schema DB/API contract) — chỉ dọn trùng lặp + chuẩn hoá cấu trúc + giảm coupling. Tóm tắt (chi tiết đầy đủ: xem báo cáo bàn giao cuối do Claude viết ra trong phiên này, hoặc `git log` các commit cùng ngày):
  - **Xoá dead code**: `electron/preload.js`, `EraHUD.jsx`/`ParticleBackground.jsx`/`DCPomodoroBrand.jsx`, 9 file SVG `public/brand/`, `tray-icon.png`, `icons.svg`, `OverviewTabLegacy` (~772 dòng chết trong `StatsDashboard.jsx`), vài effect/hàm mồ côi.
  - **Gộp 9 mảng logic bị chép tay nhiều nơi** thành abstraction dùng chung: mark-label 1-2 chữ (7 nơi) → `src/utils/labelMark.js`; AudioContext (sound/ambient engine) → `src/engine/audioContext.js`; auth-check CRON_SECRET (3 route) → `isCronAuthorized` (`api/_lib/http.js`) — nhân tiện SỬA 1 bug thật: `isSessionEndEvent` lệch chuẩn giữa `dispatch.js`/`notify-now.js`, nay hợp nhất 1 bản; badge/style (BuildingWorkshop↔BlueprintInventory) → `src/components/shared/BadgeKit.jsx`; parser Rich Text trùng trong `RichText.jsx`; icon Glyph cục bộ (NotificationCenter) → dùng chung `icons/Glyph.jsx`; pipeline Gemini (gọi model→sanitize→chống chữ lạ→chống bịa số) từng chép 3 lần ở CoachChat/CoachOffline/CoachNudge → `src/engine/coach/guardedGenerate.js`; payload push (title/body/tag) từng chép ở client+2 route server → `src/engine/pushPayloads.js`; hàm gọi Gemini thuần tách khỏi `api/coach.js` → `api/_lib/gemini.js`.
  - **Chuẩn hoá cấu trúc lớn nhất**: gom TOÀN BỘ "bộ não" AI Coach (từng rải ở `src/engine/llm/` lẫn `src/engine/` gốc) vào **`src/engine/coach/`** — `coachPrompt.js` (404 dòng) tách thành `prompt.js` (mẫu câu) + `guard.js` (lưới chống-bịa); `coachContext.js`/`coachIntel.js`/`coachSuggest.js`/`coachAdviceMemory.js`/`cloudEngine.js`/`guardedGenerate.js` dời vào cùng thư mục. ⚠️ Verify AN TOÀN quan trọng nhất: sau khi dời, `coachEval.test.js` (đổi tên `eval.test.js`) vẫn in đúng **BẮT 16/16 (100%) · BÁO NHẦM 0/16 (0%)** — chứng minh KHÔNG đổi hành vi lưới chống-bịa.
  - **Tách nhẹ God file** (không tách hẳn, theo đúng yêu cầu): rút 11 hàm định dạng thuần khỏi `StatsDashboard.jsx` → `src/components/statsFormatters.js` (+9 test). `gameStore.js`/`useTimer.js` giữ nguyên cấu trúc (đã đánh giá: tách hẳn cần rất nhiều test hành vi mới an toàn — xem lý do ở `ARCHITECTURE.md` mục 6).
  - **Tài liệu mới**: `ARCHITECTURE.md` (bức tranh kiến trúc + luồng dữ liệu + lý do chia lớp), `PROJECT_STRUCTURE.md` (cây thư mục annotated + quy tắc đặt file mới); sửa mọi đường dẫn cũ trong `CLAUDE.md`/`BAN_GIAO.md` theo cấu trúc mới; thêm pointer ở đầu `README.md`.
  - **Kết quả cuối**: `npm test` **208/208** (từ 195, +13 bài mới cho code vừa tách), lint sạch, build OK, đúng **10 Serverless Functions** (không đổi). 86 file bị đụng tới (thêm/sửa/xoá/dời), 0 thay đổi business logic ngoài 1 bug auth đã nêu trên.
  - ⚠️ **Việc CHƯA làm, để dành lần sau** (không phải bỏ sót — quyết định có chủ đích vì rủi ro/lợi ích chưa đủ hấp dẫn cho app 1 người dùng): tách nhỏ `gameStore.js` (~6000 dòng)/`completeFocusSession` (~760 dòng) thành nhiều store con; `shouldImportVersion` vẫn nằm trong `syncService.js` (chưa đưa ra `lib`/`engine` riêng, giá trị thấp).

- **2026-07-11** — **FIX TRIỆT ĐỂ (theo yêu cầu Đàm): deploy Vercel FAIL vượt trần 12 Serverless Functions.** Bản vá đầu (`.vercelignore` loại `*.test.js`) chỉ là tạm — Đàm yêu cầu xử lý gốc, không phải nhớ cập nhật blacklist mỗi lần thêm test. Đã **chuyển toàn bộ 5 file test của `api/` vào `api/_tests/`** (mirror cấu trúc, vd `api/_tests/push/dispatch.test.js`), dùng đúng quy ước underscore-prefix Vercel đã tự bỏ qua sẵn cho `api/_lib/` — cấu trúc này an toàn VĨNH VIỄN, không phụ thuộc tên file, không cần nhớ thao tác gì trước khi deploy. `.vercelignore` giữ lại làm lớp phòng thủ thứ 2 (mở rộng thêm `*.spec.*`/`*.mock.*`/`*.fixture(s).*`/`*.stories.*`/`*.bench.*`/`*.e2e.*` phòng lỡ tay đặt nhầm chỗ). `package.json` glob test → `api/_tests/*.test.js api/_tests/push/*.test.js`. `npm test` 195/195, lint sạch, build OK. Còn đúng 10 function thật, dư 2 trước khi chạm trần 12. ⚠️ **Quy tắc mới**: mọi test API sau này PHẢI đặt trong `api/_tests/`, không đặt cạnh route handler nữa (xem CLAUDE.md).

- **2026-07-11** — **SỰ CỐ + FIX: "First action wins" — chống 2 máy giành nhau ghi đè khi đồng bộ.** Sau khi resume project (sự cố phía trên), điện thoại vừa hoàn thành 1 phiên "Học Đại Học 25p" nhưng lần đẩy dữ liệu đó bị lỗi mạng (đúng lúc project đang khôi phục) — thất bại ÂM THẦM, không tự thử lại. Sau đó laptop mở app, một thao tác vô hại (chuyển tab Thống kê) vẫn khiến nó đẩy state CŨ (không có phiên đó) lên đè lên đám mây — vì cơ chế cũ dùng "ai ghi cuối cùng thắng" (client tự ghi `updated_at`, không phải server). Khi thử khắc phục trực tiếp (bảo Đàm bấm nút trên điện thoại), 2 máy cùng mở app RỒI GIÀNH NHAU ghi liên tục → màn hình timer nhảy qua nhảy lại, lệnh Huỷ không ăn — phải bảo Đàm ĐÓNG HẲN 1 máy lại mới dừng được vòng lặp. **Kết quả: phiên "Học Đại Học 25p" đó bị mất khỏi bản đồng bộ chung** (có khả năng cao đã bị ghi đè mất luôn cả khỏi local điện thoại trong lúc giành giật, do một lần pull tự động chạy đúng lúc `isRunning` không chặn được).
  - **NGUYÊN NHÂN GỐC** (Đàm chỉ đích danh + đặc tả rõ yêu cầu): sync cũ là "ai ghi cuối thắng" theo đồng hồ CLIENT, không có khái niệm thứ tự thao tác thật (server) → 2 máy mở cùng lúc = ăn may, có thể mất dữ liệu bất cứ lúc nào, không chỉ lúc lỗi mạng.
  - **FIX: "First Action Wins"** qua compare-and-swap phía server. Thêm cột `version` (integer) vào `game_state` + trigger Postgres tự tăng mỗi lần UPDATE (`supabase/game_state_version.sql`, do SERVER cấp — không lệch giờ giữa máy). `src/lib/syncService.js` viết lại: mọi lần ghi kèm điều kiện `.eq('version', expectedVersion)`; ghi bị từ chối (0 dòng khớp, nghĩa là máy khác đã ghi trước) → máy đó THUA, tự `pullFromCloud()` nhận lại bản đã thắng, KHÔNG được phép ép ghi đè nữa (đúng yêu cầu "chỉ tồn tại 1 trạng thái duy nhất"). Guard cũ dựa vào `timerSession.isRunning` (thêm hồi tháng 6 để chống 1 bug khác) đã GỠ vì không còn cần — version là nguồn xác định thứ tự chính xác tuyệt đối, mạnh hơn suy đoán isRunning. Đổi `LAST_CLOUD_SYNC_KEY` (timestamp máy khách) → `LAST_CLOUD_VERSION_KEY` (số version từ server) trong `appIdentity.js`. Test thuần `shouldImportVersion` ở `src/lib/syncService.test.js`. `npm test` 195/195 (+2), lint sạch, build OK.
  - ⚠️ **THỨ TỰ DEPLOY QUAN TRỌNG**: phải chạy `supabase/game_state_version.sql` trong SQL Editor TRƯỚC (hoặc gần như ngay khi) code mới lên Vercel — thiếu cột `version`, mọi lần ghi sẽ lỗi `column "version" does not exist` → sync ngừng hẳn tạm thời cho tới khi chạy SQL.
  - ⚠️ **DỮ LIỆU MẤT THẬT**: phiên "Học Đại Học 25p" (~15:47–16:12 ngày 11/07/2026, +26 XP) coi như mất, không phục hồi qua sync được nữa (không tái tạo tay bằng SQL vì sẽ không đi qua đúng logic XP/streak/mission của game, dễ gây sai lệch số liệu khác). Bài học ghi vào memory `sync-first-action-wins.md`.

- **2026-07-11** — **Thêm cron "giữ nhịp tim" cho Supabase** (tiếp theo sự cố pause bên dưới). Ngoài nguyên nhân "vượt hạn mức dung lượng" (đã xử lý), Supabase Free còn có thể tự pause project nếu ~7 ngày không có request API nào — rủi ro thật với app 1 người dùng. Thêm `api/keepalive.js` (Vercel Cron, `vercel.json` chạy 3h sáng mỗi ngày UTC) gọi 1 câu `select` cực nhẹ vào `game_state` qua `getAdminClient()` (đúng client Supabase, tính là hoạt động thật, không phải cron nội bộ Postgres). Bảo vệ bằng `CRON_SECRET` như các cron khác (`api/coach-digest.js`, `api/push/dispatch.js`). `npm test` 193/193 (+2 `isAuthorized`), lint sạch, build OK. Không cần biến môi trường mới (dùng lại `CRON_SECRET`+`SUPABASE_SERVICE_ROLE_KEY` đã có).

- **2026-07-11** — **SỰ CỐ: đồng bộ 2 máy ngừng hoạt động — project Supabase tự tạm dừng vì phình dung lượng.** Đàm báo máy tính+laptop không còn đồng bộ. Điều tra: project Supabase bị Supabase tự PAUSE (miễn phí tự pause khi hạn mức bị vượt), dữ liệu vẫn an toàn (không phải bị xoá). Nguyên nhân gốc: bảng nội bộ `cron.job_run_details` phình tới **795 MB / 821 MB tổng dung lượng** (dữ liệu game thật `public.game_state` chỉ ~192 KB — không hề có vấn đề). Job `dc-pomodoro-push-dispatch` (đẩy thông báo push, xem `supabase/push_dispatch_scheduler.sql`) chạy mỗi 5 giây suốt ~2 tháng, mỗi lần tự ghi 1 dòng log vào `cron.job_run_details` mà chưa từng dọn → vượt hạn mức 0.5 GB của gói Free → Supabase tự pause project. **ĐÃ XỬ LÝ**: (1) Đàm bấm "Resume project" trên Supabase dashboard — khôi phục xong, dữ liệu nguyên vẹn. (2) Dọn log cũ (`DELETE` + `VACUUM FULL cron.job_run_details`) → Database Size tụt về 0.028 GB. (3) Thêm job tự-dọn log mỗi đêm (giữ 3 ngày gần nhất) — xem `supabase/cleanup_cron_logs.sql` — để không bao giờ phình lại. (4) Giữ nguyên tần suất job push-dispatch ở 5 giây (Đàm quyết định giữ nguyên, không giãn ra — job tự-dọn mỗi đêm là đủ để giữ dung lượng ổn định ở mức thấp). ⚠️ **Lưu ý cho phiên sau**: nếu Database Size lại báo gần 0.5 GB, kiểm tra `cron.job_run_details` trước tiên (không phải `game_state` — bảng đó luôn nhỏ). Nếu job tự-dọn (`cleanup-job-run-details`) từng bị mất do tạo lại project mới thì phải chạy lại `supabase/cleanup_cron_logs.sql`.

- **2026-06-25** — **[Mảng 6/6] Cảnh báo chuỗi sắp đứt qua PUSH** (Coach chủ động lúc người dùng VẮNG). CRON `api/coach-digest.js` + helpers thuần `api/_lib/coachDigest.js` (`evaluateStreakRisk`/`pickActiveBucketLabel`/`buildStreakNudgePayload`, test). Mỗi ngày 17:00 VN (`vercel.json` crons) đọc `game_state` từ Supabase; nếu chuỗi treo (còn chuỗi nhưng hôm nay chưa làm phiên nào) → đẩy thông báo giữ-chuỗi (kèm "buổi hay làm" nếu rõ). Tái dùng hạ tầng push sẵn có (không cần SQL mới). Bảo vệ `CRON_SECRET`. `npm test` **191/191** (+3), lint sạch, build OK, smoke-import endpoint OK. ⚠️ Vercel Hobby cron 1 lần/ngày; cần đã bật push iPhone + env (CRON_SECRET/SERVICE_ROLE/WEB_PUSH) sẵn có. **→ HOÀN TẤT chuỗi 6 mảng nâng cấp AI Coach.**

- **2026-06-25** — **[Mảng 5/6] Bộ nhớ lời khuyên (cá nhân hoá — Đàm ưu tiên)**. `coachAdviceMemory.js` (thuần+test): Coach NHỚ lời khuyên chỉnh-mục-tiêu-ngày đã đưa + số liệu lúc đó (localStorage `dc-coach-advice-v1`), sau ≥3 ngày (cửa sổ 3–21 ngày) thêm dòng "Ghi nhớ: khoảng N ngày trước gợi ý chỉnh mục tiêu về X… (khi đó đạt A% trên B ngày)… đối chiếu hiện tại… tương quan". Biến Coach từ phân-tích-một-lần thành theo-dõi-theo-thời-gian. Nối ở hook `useCoachContext` (đọc bộ nhớ → dòng + ghi lời khuyên hiện tại parse từ context; write thưa/idempotent). THUẦN tương quan, KHÔNG nhân-quả (prompt cấm); mọi số nằm trong dòng → guard không báo nhầm. ⚠️ `parseGoalAdviceFromContext` parse dòng "Mục tiêu ngày…thử chỉnh về Z phiên/ngày" — đổi định dạng dòng đó phải sửa regex. `npm test` **188/188** (+6), lint sạch, build OK, eval vẫn 100%/0%. ⚠️ Dòng "Ghi nhớ" chỉ hiện sau ≥3 ngày kể từ lần đầu có gợi ý chỉnh mục tiêu (cần thời gian trôi để có "câu chuyện từ đó tới nay").

- **2026-06-25** — **[Mảng 4/6] Model MẠNH hơn cho bài phân tích 4 phần**. `buildModelChain(tier,env)` (`api/coach.js`, thuần+test): body thêm `tier`; `'deep'` → thử `gemini-2.5-pro` trước rồi rơi về nguyên chuỗi flash (vừa khôn vừa an toàn). CHỈ "AI phân tích tổng thể" (`CoachOffline`) gọi `tier:'deep'`; chat + nhắc-sau-phiên giữ flash nhanh+rẻ (đã bật billing nên không lo tiền). `cloudEngine` truyền `tier`. Timeout 28s + maxDuration 30 (mảng 1) đỡ cho pro chậm hơn. KHÔNG đổi sang JSON mode (rủi ro) vì `scrubFabricatedLines` đã giữ khung [1][2][3][4] + bỏ riêng dòng bịa → một số bịa không làm rớt cả bài. `npm test` **182/182** (+1 buildModelChain), lint sạch, build OK.

- **2026-06-25** — **[Mảng 3/6] Coach CHỦ ĐỘNG: tự nhắc 1 câu sau mỗi phiên** (đòn bẩy lớn nhất). `CoachNudge.jsx` trong thẻ AI Coach (cả desktop `FocusRail` lẫn iPhone `FocusCoachMobile`): khi vừa xong một phiên (history[0] hợp lệ + trong ~5 phút), Coach tự viết MỘT câu bám số phiên vừa xong → hiện ngay, khỏi bấm hỏi. Phần thuần: `buildNudgeContext` (ghép "Phiên vừa xong: N phút, loại …" vào đầu context để guard CHO PHÉP nhắc số phiên đó) + `NUDGE_INSTRUCTION`, dùng CHUNG `buildLLMChatPrompt`+lưới chống-bịa. An toàn: chạy nền không chặn kết thúc phiên, lỗi/chữ-lạ → im lặng, vẫn qua guard (cứu-câu). Chống lặp + chạy đúng cả mobile (thẻ ẩn lúc chạy phiên rồi mount lại): localStorage `dc-coach-nudge-v1` (mỗi phiên ≤1 lần) + gác recency 5 phút (mở app sau nhiều giờ không nhắc phiên cũ). `npm test` **181/181** (+1 buildNudgeContext), lint sạch, build OK. ⚠️ Chỉ thấy "sống" khi Đàm xong một PHIÊN THẬT (không test được trên dev vì cấm chạy phiên trên dev). Chưa gửi push (người dùng đang ở trong app); push để dành mảng 6.

- **2026-06-25** — **[Mảng 2/6] Tín hiệu "phiên trơn vs ngắt quãng"** cho AI Coach. App đã LƯU SẴN số lần tạm dừng mỗi phiên (`e.pauseSegments`) và hiện ở Thống kê, nhưng Coach KHÔNG hề đọc → thêm `getInterruptionPattern` (`gameMath.js`) đếm phiên liền mạch (0 lần dừng) vs đứt quãng (≥1) → dòng mới trong `buildAnalystContext` ("Phiên liền mạch (chạy hết không tạm dừng): S/T phiên (P%)…"). ⚠️ CHỈ tính phiên CÓ trường pauseSegments (phiên cũ thiếu trường → bỏ, KHÔNG coi là trơn để khỏi thổi phồng); gác ≥8 phiên có dữ liệu. Thêm chip `flow` ("Phiên của mình có hay bị tạm dừng…") trong `coachSuggest.js` (catalog/RELATED/KEYWORD/GATE/detectSignals). Eval mở rộng (+1 sạch/+1 bịa, vẫn BẮT 16/16, BÁO NHẦM 0/16). `npm test` **180/180**, lint sạch, build OK. ⚠️ Dòng chỉ hiện khi đã có ≥8 phiên MỚI (có pauseSegments) — dữ liệu mẫu cũ chưa có nên chưa thấy; phiên thật từ nay sẽ tích dần.

- **2026-06-25** — **[Mảng 1/6] Siết NIỀM TIN cho AI Coach** (Đàm: "làm toàn bộ, chuyên sâu" sau workflow đề-xuất 10 agent). 5 việc: **(1) Sửa nhiệt độ lệch** — tài liệu ghi 0.2/0.8 nhưng code chạy 0.3/0.9; kéo về 0.2/0.8 ở `api/coach.js` (default) + 2 caller `CoachChat`/`CoachOffline` → model ít chế số/trôi. **(2) Bộ chấm điểm chống-bịa** `coachEval.test.js` + `coachEvalFixtures.js` (30 câu mẫu: 15 sạch + 15 bịa + 4 chữ-lạ) → đo BẮT %/BÁO NHẦM %; ngưỡng BÁO NHẦM=0 (siết), BẮT≥90%. Lần đầu: **BẮT 15/15 (100%), BÁO NHẦM 0/15 (0%)** — in ra mỗi lần `npm test`. **(3) Timeout** `cloudEngine.js` tự AbortController 28s (không treo vô tận → code 'timeout') + `vercel.json` `maxDuration:30` cho `/api/coach` (tránh Vercel cắt hàm trước khi model dự phòng kịp cứu; nền cho việc dùng model mạnh hơn ở mảng 4). **(4) CoachOffline viết-lại-CÓ-HƯỚNG-DẪN** (bắt số bịa → chèn lượt chỉ đích danh rồi chạy lần 2, như CoachChat) thay vì viết-lại-mù. **(5) Dọn chữ cũ** còn hứa "mất mạng tự dùng AI dự phòng trên máy" (Qwen đã gỡ) ở CoachChat/CoachOffline + comment header. `npm test` **178/178** (172→178: +4 coachEval, +1 topP, sửa 1 assertion temp), build OK. ⚠️ Verify bằng test (không mở dev — tránh đụng dữ liệu thật Supabase).

- **2026-06-24** — **BẬT BILLING Gemini (paid tier) → CHẠY ỔN ĐỊNH, HẾT 429.** Đàm tự bật billing trên Google AI Studio/Cloud cho key. Đã verify cổng production 2 lượt: cả 2 OK trên `gemini-2.5-flash`, trả lời tiếng Việt tự nhiên, **không còn 429**. Trước đó 429 là do trần FREE thấp + đo/test nhiều trong ngày, KHÔNG phải bug. **Không cần sửa code** (billing nằm phía Google). Cập nhật CLAUDE.md + BAN_GIAO + memory. Chuỗi model giữ nguyên: gemini-2.5-flash → 2.5-flash-lite → 2.0-flash. ⚠️ Nên đặt budget cảnh báo ~$5/tháng cho an tâm; chi phí thực ~16–80k đ/tháng (dùng cá nhân vài câu/ngày).
- **2026-06-24** — **GỠ HẲN Qwen2.5-3B + WebLLM, chỉ còn Gemini** (Đàm: "bỏ Qwen, giữ cấu trúc đã đào tạo để áp lên Gemini"). XOÁ `src/engine/llm/webllmEngine.js` + `guard.test.js`; gỡ `LLM_MODELS`/`detectWebLLMCapable`/`mapInitProgress` khỏi `coachPrompt.js` (+ test); gỡ dep `@mlc-ai/web-llm` (npm install --legacy-peer-deps; lockfile 0 @mlc); gỡ manualChunk `vendor-webllm` + globIgnores webllm/wasm trong `vite.config.js`. SỬA `CoachChat.jsx`/`CoachOffline.jsx`: bỏ nhánh fallback Qwen + `capable`/`progress`/warm-prefetch → chỉ `generateCloud`; làm sạch câu chữ UI. GIỮ NGUYÊN "bộ não": 2 prompt + toàn bộ lưới chống-bịa + tầng số liệu + coachSuggest (model-agnostic, áp lên Gemini). `npm test` 174/174 (−3: bỏ 2 test webllm-cap + guard.test.js), lint sạch, build OK, **không còn webllm trong bundle/precache, key không vào bundle**. Smoke-test preview: thẻ Coach render sạch, không lỗi (mấy lỗi console là trạng-thái HMR giữa chừng, đã hết sau khi build). Đánh đổi: mất mạng/hết quota = Coach ngừng (không còn dự phòng máy).
- **2026-06-24** — **Gemini: chốt model + chống 503 + tắt thinking** (sau khi verify cổng production). `gemini-2.5-flash` CHÍNH → tự nhảy `gemini-2.5-flash-lite` khi 503/500/429 (đo thực tế flash free hay quá tải + chạm giới hạn; lite ổn định hơn). TẮT thinking (`thinkingBudget:0`) vì 2.5 bật mặc định → ăn hết token làm câu CỤT. `callModel` (chính retry 1 lần, dự phòng 1 lần) + `shouldFallback`. Env `GEMINI_MODEL`/`GEMINI_MODEL_FALLBACK` (có default, khỏi đặt). ⚠️ Key `AQ.Ab8…` Đàm dán trong chat **trông không giống key AI Studio (`AIza…`)** — đã dặn Đàm tạo key mới + revoke key lộ. `npm test` 177.
- **2026-06-24** — **ĐỔI HƯỚNG: Coach chạy GEMINI (đám mây) làm chính + Qwen dự phòng + CHẠY CẢ iPHONE** (Đàm chốt: 3B ngu + tốn RAM/đĩa → chuyển sang API free khôn hơn). **MỚI**: `api/coach.js` (Vercel serverless, giữ `GEMINI_API_KEY`, map sang Gemini `generateContent`; pure helpers test `api/coach.test.js`) + `src/engine/llm/cloudEngine.js` (`generateCloud` gọi `/api/coach`). **LUỒNG**: CoachChat/CoachOffline gọi Gemini trước → lỗi (no-key/quota/mất mạng) rơi về Qwen on-device (chỉ desktop; iPhone báo lỗi nhẹ). **iPhone NAY DÙNG ĐƯỢC Coach**: bỏ `if(!capable) return null`, FocusRail bỏ gate `aiCapable`, `FocusCoachMobile` render thẳng CoachChat+CoachOffline (App.jsx truyền goalProps). Bỏ warm-prefetch Qwen (không tải model nặng lên máy nữa). **GIỮ NGUYÊN** toàn bộ prompt + lưới chống-bịa + tầng số liệu (model-agnostic) → chạy tốt hơn vì Gemini khôn hơn 3B. `.env.example` thêm `GEMINI_API_KEY`/`GEMINI_MODEL`; test glob thêm `api/*.test.js`. `npm test` 175/175, lint sạch, build OK precache 0 webllm; smoke-test preview: thẻ Coach hiện cả desktop+mobile, 0 lỗi console. ⚠️ **ĐÀM PHẢI TỰ LÀM**: lấy key free ở aistudio.google.com → thêm `GEMINI_API_KEY` vào Vercel env (chưa có key thì Coach tự rơi về Qwen trên máy).
- **2026-06-24** — **Coach: tín hiệu mới + giọng văn MƯỢT (bớt robot) + chống-bịa thêm** (ultracode, workflow 3 góc + phản biện; synth chốt tay sau lỗi auth tạm thời). Đàm: thêm tín hiệu phân tích, câu chữ trơn tru hơn, không robot, chống bịa hơn. **(1) 2 tín hiệu mới (gác chặt, prefix riêng)**: `getWeekendVsWeekdayContrast` (cuối tuần vs trong tuần) + `getComebackRate` (quay lại sau 1 ngày nghỉ). **streak-at-risk** GỘP vào `predictStreakKeep` (`atRisk` → "Giữ chuỗi" mở bằng "Chuỗi N ngày đang treo", KHÔNG thêm dòng). Bỏ category-momentum + session-length-trend (làm bảng dài/trùng → 3B loạn). **(2) CAP** `COACH_MAX_CONTEXT_LINES=18` + `capContextLines` cắt theo ƯU TIÊN (giữ Tổng quan/Chân dung/Hôm nay + STRONG, "Ghi chú" cắt trước). **(3) GIỌNG MƯỢT**: prompt thêm "CÁCH VIẾT"/"GIỌNG VĂN" (viết câu chảy liền, bớt liệt kê) + làm mềm các câu tất-định — RANH GIỚI nới-câu-nối/siết-con-số, honesty giữ nguyên, **decoding GIỮ 0.2/0.8**. **(4) CHỐNG BỊA**: `findFabricatedFractions` (phân số N/M ghép sai) + chuẩn hoá `phần trăm`↔`%`. Phản biện (CẦN_CHỈNH) bắt: giữ prefix empty-state, cap theo ưu-tiên không slice mù, không entity-guard, không đổi temp vội — đã áp hết. `npm test` 172/172, lint sạch, build OK precache 0; 3 lưới self-consistency rỗng, bảng 16 dòng (≤18), không ký tự `′`. ⚠️ Giọng mượt cần Đàm thử tay trên Mac.
- **2026-06-24** — **Bổ sung TOÀN DIỆN Coach (đợt rà 24 ý → vét → 10 việc an toàn)** (ultracode, workflow 3 phase: 4 ý-tưởng + ~24 vét + 1 chốt). Đàm: "thêm mọi thứ, thông minh + chính xác hơn". Làm 4 đợt: **(1) Sửa 3 BUG chính xác**: dòng khuya dùng `lateGoalTotal` làm cỡ mẫu % (trước dùng `lateAttempts` → phóng đại); Tổng quan <60 phút in "phút" (hết "~0 giờ"); trung vị mục tiêu ngày `medianDisplay` qua `roundGoalValue`. **(2) Chip thông minh hơn**: `detectTopics` (số nhiều) cho câu đa-ý + `LOOSE_KW`; thêm 2 chip `longTrend`+`portrait` (mở khoá tín hiệu sâu). **(3) Lưới GHÉP-SAI %↔cỡ-mẫu** `findMismatchedPairs` (bắt "79% trên 18 phiên" kiểu ghép chéo; BẢO THỦ, verify 9/9 paraphrase thật không báo nhầm) cắm vào cứu-câu. **(4) UX CoachChat (desktop)**: lưu hội thoại localStorage (lượt khôi phục KHÔNG vào prompt), làm ấm engine khi mở modal, nút Thử lại + lỗi phân loại, câu mẫu bám tín hiệu + empty-state. **HOÃN (trình Đàm quyết riêng — làm bảng dài/3B loạn hoặc đảo quyết-định-sản-phẩm)**: tín hiệu mới `category-momentum`/`session-length-trend`/`streak-at-risk`/`comeback-after-rest`, và `mobile-static-summary` (iPhone xem số tĩnh — Đàm từng gỡ rule-answers nên cần xác nhận). `npm test` 158/158, lint sạch, build OK precache 0 webllm; self-consistency 2 lưới rỗng. ⚠️ Phần UI cần Đàm thử tay trên Mac.
- **2026-06-24** — **Nâng trung thực Coach: phòng-thủ-theo-tầng** (ultracode, workflow 6 agent + 1 phản biện). Đàm: nâng độ chính xác, không bịa số, không có số thì BÁO không có. (1) **Viết-lại-CÓ-HƯỚNG-DẪN**: bắt số bịa → `buildCorrectionNote`/`appendCorrectionTurn` chèn lượt chỉ ĐÍCH DANH số sai rồi chạy lần 2 (thay vì blind). (2) **CỨU-CÂU** thay nuke: `stripFabricatedSentences` (chat — bỏ riêng CÂU bịa, giữ câu sạch) + `scrubFabricatedLines` (offline — bỏ riêng DÒNG, giữ 4 phần, phần rỗng→"chưa đủ dữ liệu"). (3) **CoachOffline NAY CŨNG có guard số** (trước chỉ chống chữ-lạ). (4) **Mở rộng lưới**: thêm đơn vị "tiếng"(=giờ). (5) **Siết prompt** 2 system: "KHÔNG CÓ SỐ THÌ NÓI KHÔNG CÓ" + "RANH GIỚI HỌC vs NÓI" + map 1-1 phần [3] cứng. ⚠️ **Phản biện bắt 1 landmine THẬT**: band "vừa (26–44 phút)" — mốc dưới "26" không có "phút" liền sau → guard sẽ báo nhầm "26 phút" khi user vào band vừa → đã vá `BAND_LABEL.vua='vừa (26 phút–44 phút)'` TRƯỚC. ⚠️ BỎ (rủi ro báo nhầm): entity-guard, kiểm cỡ-mẫu trong guard, đơn-vị-kép, dung sai làm-tròn. `npm test` 147/147, lint sạch, build OK precache 0 webllm. Self-consistency rỗng + band-vừa không báo nhầm. ⚠️ Qwen vẫn cần Mac (WebGPU) để test câu chữ.
- **2026-06-22** — **DIỆT fake-số ở "Hỏi Coach"** (ultracode, workflow 4 agent: lưới chặn-bịa + làm rõ bảng + siết prompt). Đàm báo Hỏi Coach VẪN bịa số nhiều. Tạo **tệp lịch sử mẫu ~24 giờ** `scripts/coach-sample.mjs` → in đúng bảng số liệu Qwen nhận (bảng CHUẨN → fake là do 3B). 4 tuyến: (1) **Lưới chặn-bịa-số TẤT ĐỊNH** `findFabricatedNumbers`/`hasFabricatedNumbers` (`coachPrompt.js`): số kèm đơn-vị-dữ-liệu không có trong bảng = bịa → `CoachChat.jsx` viết lại 1 lần, vẫn bịa thì KHÔNG hiện câu bịa (test `coachGuard.test.js`; self-consistency rỗng; bắt đủ 50 phiên/3.7 giờ/95%/40 phiên). (2) **Làm rõ bảng** (`coachContext.js`): dòng "Loại việc" tách mỗi loại 1 dòng + tên trong ngoặc kép + bỏ `|`; dòng khuya đổi nhãn "phiên làm sau 22 giờ đêm"; **bỏ hết ký tự `′`** đổi sang "phút" (cả `coachIntel.js` BAND_LABEL + momentum) — guard nhận đơn vị + 3B khỏi đọc nhầm. (3) **Siết prompt**: SỬA ví dụ "ĐỌC ĐÚNG GIÁ TRỊ" — bỏ số cụ thể "2.3h" (chính nó bị 3B chép ra!), thay bằng PLACEHOLDER X/A/B/C; thêm luật "TÊN MỤC ≠ NỘI DUNG". (4) **Hạ nhiệt** decoding 0.3→0.2, 0.85→0.8. Kèm sửa marker `coachSuggest.js` + fixture + assertion test. `npm test` 136/136, lint sạch, build OK precache 0 webllm. ⚠️ Tôi KHÔNG chạy được Qwen ở máy dev (cần WebGPU) → guard là tuyến tất định; Đàm test tay trên Mac để xác nhận câu chữ.
- **2026-06-21** — **Coach thành "chuyên gia phân tích" + SỬA bug trả-lời-giả** (ultracode; workflow thiết kế + workflow /code-review 17 agent). BUG Đàm báo: Hỏi Coach nhái khuôn few-shot → bịa ("Loại việc 2.3h"). FIX: bỏ HẲN `COACH_CHAT_FEWSHOT` + thêm luật **ĐỌC ĐÚNG GIÁ TRỊ** (chép phần sau dấu hai chấm, đừng lấy nhãn). KHÔN HƠN: chat = khung chuyên gia 3 nhịp (quan sát→xu hướng→1 lời khuyên); "AI phân tích tổng thể" = 4 phần (thêm [2] Xu hướng + [3] Chân dung). HIỂU CHỦ: dòng **"Chân dung của bạn"** (đặc điểm ổn định, kèm cỡ mẫu). HỌC THEO THỜI GIAN: **`getMultiWeekTrend`** + dòng "Xu hướng dài hạn". **/code-review bắt 1 bug THẬT**: xu hướng tính cả tuần-trống = 0′ "ma" → báo hướng SAI ("0′→0′→300′→320′: giữ nhịp") cho người mới/quay lại → ĐÃ SỬA: CHỈ tính tuần CÓ dữ liệu, cần ≥3 tuần (minWeeks=3), len lẻ dùng ceil (không bỏ sót tuần giữa); + sửa ví dụ vàng offline (bỏ "+12%/tuần" sai math/không khớp output). Không retrain, không persist field mới (history dày dần → tín hiệu chín dần). `npm test` 125/125, lint sạch, build OK precache 0 webllm.
- **2026-06-21** — **Hỏi Coach khôn hơn + Đề xuất theo ngữ cảnh + đổi tên Coach offline** (Đàm ra lệnh, ultracode, workflow 4 agent). (1) `COACH_CHAT_SYSTEM` viết lại (bản đồ "chọn-đúng-dòng" theo câu hỏi + siết trung thực) + `COACH_CHAT_FEWSHOT` 2 ví dụ vàng KHÔNG-số (dạy văn phong, tránh rò số) chèn vào `buildLLMChatPrompt`; `STARTER_CHIPS` 10 câu mẫu. (2) Engine MỚI `src/engine/coachSuggest.js` (thuần luật, không LLM) + `coachSuggest.test.js` (8 bài): `pickSuggestions` chọn 2-3 "Đề xuất tiếp theo" theo tín hiệu user CÓ (đọc chuỗi buildAnalystContext) + chủ đề vừa hỏi (`detectTopic` có/không dấu), bỏ câu đã hỏi, tất định. CoachChat render khối "Đề xuất tiếp theo" sau mỗi câu trả lời (chip bấm → gửi). (3) Đổi tên "Coach offline" → **"AI phân tích tổng thể"** ở UI + COACH_OFFLINE_SYSTEM + comment. KHÔNG train lại trọng số (model đúc sẵn) — "khôn hơn" qua prompt+few-shot+context+gợi-ý. `npm test` 116/116, lint sạch, build OK precache vẫn 0 webllm.
- **2026-06-21** — **GỠ MỌI AI TRỪ QWEN + dọn nhẹ app** (Đàm ra lệnh, ultracode, workflow 4 agent map+thiết kế → tự code tuần tự). XOÁ: `src/engine/qa/` (⚡Nhanh) + `useCoachQA`; `api/coach.js` (Claude) + `buildCoachContext`/default `useCoachContext`; `src/engine/semantic/` (MiniLM) + `useNoteThemes`; bộ trả lời theo luật `generateCoachBriefing`/`generateCoachInsight` (gameMath) + `useCoachInsight`/`CoachCard`/`FocusReport`/`useCoachIntel`; giọng cảm xúc `coachVoice.js`/`useCoachVoice`/`ai-coach-sim/`/`coachPersonality`; `coachContext.test.js`. GỠ deps `@huggingface/transformers`+`@anthropic-ai/sdk`; dọn `vite.config.js` + `package.json` test glob. DỜI guard test webllm → `src/engine/llm/guard.test.js`. SỬA: `CoachChat.jsx` (chat Qwen thuần, iPhone `return null`), `FocusRail.jsx` (thẻ AI = 2 nút Qwen, chỉ desktop), `FocusCoachMobile.jsx` ("Mở trên máy tính"), `App.jsx`, `useCoachContext.js`, `coachContext.js`, `gameMath.js`/`.test.js`, `settingsStore.js`. Tầng số liệu GIỮ làm nguồn cho Qwen. `npm test` 108/108, lint sạch, `npm run build` OK + precache 1.6MB (0 webllm/wasm). Lockfile cập nhật.
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
