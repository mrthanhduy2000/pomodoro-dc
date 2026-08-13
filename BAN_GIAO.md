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
> 3D (giờ trong ngày, đèn cửa sổ, vũng sáng đêm) · 3F (thành phố ra TRANG CHỦ)**.
> Rồi lệnh *"quét đủ 15 kỷ × 6 chặng ngày… game hoá lên… không bị chán"* → **3G** (vá 6 lỗi mỹ
> thuật từ bản quét 180 cảnh) · **3H** (giàn giáo công trình đang xây) · **3I** (bảng "Đang xây":
> còn bao xa, mở khoá gì) · **3J** (thanh chuyển kỷ tự kéo vào tầm mắt) · **3K** (chạm vào công
> trình để biết nó là ai) · **3L** (nói cho Đàm biết là chạm được) · **4′** (3,2 giây được NHÌN
> THẤY thành phố lớn lên sau mỗi phiên — mắt xích cuối của vòng lặp "làm việc → thấy thành quả").
> **462 bài test.**
> Trước đó 2026-08-10: sửa khoảng trắng thừa trước icon 🍅/☕ trên thanh menu Mac (`electron/main.js`,
> đúng 1 dòng; xoá `public/tray-empty.png`) — chỉ đụng app tray. Trước đó 2026-08-05 có 3 việc
> **cấu hình máy + tài liệu, KHÔNG đổi dòng code ứng dụng nào**: (a) sửa "app biến mất khỏi thanh
> menu Mac" + bật tự khởi động; (b) dọn sạch dấu vết dự án đời cũ trên máy; (c) diệt bản sao
> `AGENTS.md` và cấm nhân bản tài liệu quy tắc theo từng công cụ AI.
>
> ❌ **[ĐÃ ĐÍNH CHÍNH 2026-08-12] Mục "Đang dở" trước đây ở chỗ này là SAI SỰ THẬT.** Nó ghi rằng có
> `src/hooks/useTimer.test.js` với "41 bài characterization test, **tất cả đều xanh**, chỉ chưa nối
> vào `npm test`". Đã kiểm cạn kiệt: `git log --all --diff-filter=A -- '*useTimer.test.js'` **rỗng**
> — file CHƯA TỪNG được commit ở bất kỳ nhánh/commit nào; `find src/hooks -name '*.test.js'` đếm
> được **0 file**. Nó được viết trong một phiên cũ rồi mất theo container (phiên chạy trên máy ảo
> tạm, không commit là mất). **`useTimer.js` hiện có ĐÚNG 0 bài test.**
> Thêm một tầng sai nữa: lý do "chưa nối vào `npm test`" cũng đã lỗi thời — glob test đã đổi thành
> `'src/**/*.test.js'` (`TECH_DEBT` #10, cùng ngày), nên nếu file có thật thì nay nó TỰ ĐỘNG chạy.
> ⚠️ **Dòng ghi sai này đã gây thiệt hại thật**: nó khiến phiên AI hôm nay đề xuất "nối 41 bài test
> vào `npm test`" làm task ưu tiên số một — một task bất khả thi, dựa trên một tài sản không tồn
> tại. **Bài học (lần thứ ba trong cùng một ngày): tài liệu khẳng định một thứ mà không ai kiểm lại
> thì thành bẫy cho chính người đọc nó sau này.** Hai lần kia: ghi chú ở `roof` khẳng định "15 sắc
> mái phân biệt được" trong khi đo ra 0°; bài test giàn giáo chỉ khoá hướng nên nhận cả mức tăng
> 1,02 lần. Nợ thật đã ghi vào **`TECH_DEBT.md` #13**.
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

- **2026-08-13 (soát sau 3W, KHÔNG sửa mã sản phẩm)** — **HỎI TIẾP CÂU CỦA REVIEW TRIGGER: thành quả
  Phase 3V có tới được TRANG CHỦ không?** Câu trả lời đo được: **gần như không.**
  - **Số đo** (ảnh chụp app đã build, bề ngang 1280, hai dải thành phố lộ ra hai bên thẻ đồng hồ):
    cả 6 chặng ngày ra gần như cùng một mảng trắng ngà, độ tươi **0,02–0,12**; cặp cách nhau XA
    NHẤT — giữa trưa ↔ ban đêm, hai cực của cả ngày — chỉ **14/255** (ngưỡng "mắt không phân biệt
    được" là 12). Toàn bộ hành trình màu 178° mà 3V dựng lên **không tới được màn hình Đàm nhìn
    nhiều nhất**.
  - **Nguyên nhân KHÔNG phải `BACKDROP_OPACITY`** mà là lớp phủ giữ-chữ-đọc-được: nó pha về
    `var(--canvas)` — một màu **PHẲNG** — ở 55–92%. Pha về màu phẳng thì **độ tươi tụt theo đúng tỉ
    lệ đó**, còn hình khối (tín hiệu ĐỘ SÁNG) thì sống sót ⇒ lớp phủ lọc mất đúng cái vòng ngày dựa
    vào, và giữ lại đúng cái không thiếu cũng được.
  - ⚠️ **KHÔNG TỰ SỬA.** Chú thích tại chỗ ghi rõ đây là đánh đổi có chủ đích (*"đẹp và dùng được
    đối đầu nhau, dùng được phải thắng"*), và người viết đã cân nhắc rồi mới chọn con số. Đã ghi
    thành `TECH_DEBT.md` **#16** kèm ba lựa chọn và một quan sát có thể mở đường (chữ chỉ nằm ở dải
    TRÊN; đồng hồ và cột phải đều nằm trong thẻ ĐẶC ⇒ có thể giữ nguyên phần trên mà cho nhạt nhanh
    hơn ở phần dưới). **Chờ Đàm quyết.**
  - ⚠️ **CÔNG CỤ CHỤP LẠI NÓI DỐI — LẦN THỨ BẢY TRONG PHIÊN NÀY, và lần này suýt báo một lỗi NẶNG
    không hề có.** Chụp khung điện thoại bằng `--window-size=390,844`: ảnh ra đúng 390 điểm ảnh
    ngang và trông như app **tràn ngang thảm hại** (chữ cụt giữa câu, thanh dưới mất nút). Đo bằng
    số thì `window.innerWidth` thật là **500** — Chromium headless có SÀN 500px — nên trang dàn ở
    500 rồi bị cắt còn 390. Sự thật: `scrollWidth === innerWidth` và **không một phần tử nào vượt
    mép phải**, ở cả 390-giả lẫn 1280. **App không hề tràn.** Muốn khung điện thoại thật phải dùng
    CDP `Emulation.setDeviceMetricsOverride`. Đã ghi vào `CLAUDE.md` kèm luật: **luôn in kèm
    `window.innerWidth` THẬT vào mỗi lần chụp**, nếu không thì mọi kết luận về bố cục hẹp đều dựa
    trên một bề ngang bịa.
  - **Không đổi một dòng mã sản phẩm nào** — chỉ tài liệu (`TECH_DEBT.md` #16, `CLAUDE.md`, file này).

- **2026-08-13 (Phase 3W)** — **BẢO VỆ CHÍNH THÀNH QUẢ CỦA 3V: hai đường rò rỉ mà 3V vừa mở ra.**
  Phase này sinh ra từ đúng một câu trong `TECH_DEBT.md` #14: *"Review Trigger: trước bất kỳ đầu tư
  nào thêm vào hiệu ứng thành phố"*. Tôi vừa đầu tư (3V), nên phải hỏi: **thành quả đó có thật sự
  tới được màn hình Đàm không, và nó có bền không?**
  - **RÒ RỈ 1 — bầu trời ĐỨNG IM khi mở lại app.** `CityScene3D` đọc đồng hồ đúng MỘT LẦN lúc dựng
    cảnh; danh sách phụ thuộc của effect **không có gì liên quan tới thời gian**. Phần lớn trường
    hợp được `sessionCount` cứu (xong một phiên là dựng lại ⇒ đọc lại đồng hồ). Trường hợp KHÔNG
    được cứu: **iPhone (PWA) chỉ ĐÓNG BĂNG tab chứ không đóng hẳn** — mở app buổi sáng, cất máy, mở
    lại lúc tối thì React không mount lại, và Đàm thấy bầu trời buổi sáng giữa đêm. Đây đúng họ lỗi
    tầng đồng bộ đã phải vá ("BẢN VÁ C1" ở `syncService.js`: timer debounce KHÔNG BAO GIỜ nổ trên
    iOS vì tab bị đóng băng) ⇒ dùng lại đúng tín hiệu đó: `visibilitychange`, chỉ SO SÁNH tên chặng
    nên `setState` gần như luôn bị React bỏ qua. **CỐ Ý không hẹn giờ định kỳ**: đổi lại là không
    có nguy cơ cảnh dựng lại GIỮA một phiên tập trung (chớp hình lúc đang tập trung tệ hơn bầu trời
    trễ vài phút). Ca còn hở: app mở + đang hiện suốt nhiều giờ mà không xong phiên nào.
  - ⚠️ **BÀI TEST ĐẦU TIÊN CỦA TÔI XANH OAN.** Viết `/addEventListener\(\s*'visibilitychange'/` rồi
    thử gỡ sạch bộ nghe — **vẫn xanh**, vì trong cùng file còn một bộ nghe `visibilitychange` KHÁC
    (lo việc dừng vòng lặp vẽ). Đúng bẫy "ngưỡng một phía là cái phễu chứ không phải hàng rào". Đã
    siết lại cho bám đúng tên hàm xử lý, rồi thử NGƯỢC với **4 biến thể hỏng** — cả 4 đều đỏ đúng
    chỗ. **Quy tắc: một bài test chưa từng thấy đỏ thì chưa phải là một bài test.**
  - **RÒ RỈ 2 — Phase 3V ĐÃ LÀM MẤT MỘT LỜI BẢO ĐẢM, và tôi suýt không nhận ra.** `ARCHITECTURE.md`
    ghi thẳng *"BẦU TRỜI KHÔNG ĐƯỢC PHA BẰNG CÁCH XOAY GÓC MÀU"* — kết luận mua bằng BA lần hỏng
    liên tiếp. Phép trộn RGB cũ khiến màu tím **bất khả thi về cấu tạo**; xoay sắc thì không. Tính
    tay: nền ấm 40° kéo về đích lam 232° ở lực kéo 0,5 ra **316°**, đúng họ màu `#cf63c2` của lần
    hỏng thứ hai. Bộ tham số hiện tại không rơi vào đó — nhưng **"hiện không rơi" ≠ "không thể
    rơi"**, và khi mở rộng bài test chống-tím từ 6 màu kỷ mẫu lên **đủ 15 kỷ thật** thì nó bắt ngay
    `#bd818e` (mặt nước 5 giờ sáng, kỷ 6 sắc tím): **LẦN THỨ TƯ của cùng họ lỗi, do chính 3V gây
    ra.**
  - **Cách trả lại lời bảo đảm** (một dòng, và nó là phát biểu chính xác hơn của cùng ý "đi qua màu
    xám"): **độ dài vector tổng chính là mức độ CÓ NGHĨA của phép trộn** — hai sắc cùng hướng thì
    dài 1, gần đối nhau thì triệt tiêu. Nhân độ tươi với `min(1, |v| / 0,5)` ⇒ ca mơ hồ nhạt về
    xám, ca kéo mạnh giữ nguyên. Mốc 0,5 chọn theo SỐ ĐO: trưa `|v|` = 0,70 và bình minh 0,98 (giữ
    nguyên), ca hỏng chỉ 0,18 (nhạt còn hơn một phần ba). Buổi sáng sát mốc (0,45) nên nhạt ~10% →
    đã bù bằng `morning.skySaturation` 1,18 → 1,32. Đo lại: **sáng 203°/0,15 · trưa 211°/0,17 — y
    như trước khi vá.** Bầu trời xanh không mất gì.
  - **KHÔNG thêm bài test trùng.** Bản đầu tôi viết hẳn một bài chống-tím mới, rồi phát hiện đã có
    sẵn hai bài. Đã XOÁ bài mới và **mở rộng bài cũ** (đủ 15 kỷ + soi thêm mặt nước) — đúng luật
    "Composition over Duplication", và cũng vá đúng lỗ hổng mà chính file test đó tự cảnh báo
    (*"bộ mẫu 5–6 màu cũ đã chạy XANH suốt trong khi 6/15 kỷ đang có mái tím sen"*).
  - `ARCHITECTURE.md` đã sửa: đoạn cũ nay mâu thuẫn với mã, nên ghi rõ "cùng kết luận, đường khác",
    kèm lý do vì sao đơn thuốc cũ (trộn RGB) gây bệnh thứ hai. **Tài liệu mâu thuẫn với mã còn nguy
    hơn không có tài liệu.**
  - Test **488** bài (485 → +3), lint sạch, build xanh, quét lại đủ 90 ô.

- **2026-08-13 (Phase 3V)** — **TRỜI BAN NGÀY CUỐI CÙNG CŨNG XANH. `TECH_DEBT.md` #15 ĐÃ ĐÓNG.**
  Đây là phần sửa cho lỗi mà Phase 3U (ngay dưới) tìm ra nhưng chưa động tới.
  - **Sửa ở ĐÂU**: `skyward()` trong `src/engine/city3d/palette3d.js` (phép trộn màu) +
    `DAYLIGHT_PROFILES` trong `src/engine/city3d/daylight.js` (2 chặng sáng/trưa) + bài 81 ở
    `daylight.test.js`. **KHÔNG** đụng `sceneGraph.js` — xem "nợ còn lại có chủ đích" bên dưới.
  - **BA tầng chồng lên nhau, sửa một tầng thì vẫn hỏng** (đây mới là bài học, không phải con số):
    1. `skyward()` trộn màu trong **không gian RGB** ⇒ sắc ấm 40° pha sắc lạnh 205° đi qua vùng
       TRUNG TÍNH, ra xám. **Đúng họ lỗi đã sửa cho MÁI NHÀ ở Phase 3N.** Nay xoay sắc bằng
       **vector chroma** (cộng hai vector đơn vị theo góc rồi `atan2`), giữ nguyên tươi/sáng gốc.
    2. **`NeutralToneMapping` nén vùng sáng.** Chân trời để độ sáng 0,80 rơi đúng giữa vùng bị nén
       ⇒ độ tươi ra màn hình chỉ còn **1/5** bảng màu. Hạ xuống 0,70/0,72 và nâng tươi lên
       0,60/0,44 mới thoát ra. ⚠️ Lệch **ngược chiều** với mái nhà (mái render ra tươi GẤP ĐÔI
       bảng màu) — nên "bảng màu ≠ màu trên màn hình" không có một hệ số chung, phải đo từng chỗ.
    3. **Góc màu đặt vào ≠ góc màu đo được.** Nắng ấm nhân vào trời kéo sắc lạnh tụt **13–22°** về
       phía lục (đặt 195° đo ra 173°); sắc ấm thì hơi tăng (đặt 18° đo ra 27°). Hai chặng sáng/trưa
       phải khai cao hơn đích thật ~15°: đặt 210°/216° mới đo ra 203°/211°.
  - **Số đo trước → sau** (kỷ 7, theme sáng, đỉnh trời giữa khung): `26°/40°/41°/38°/19°/224°` →
    `27°/203°/211°/37°/18°/223°`. Bốn chặng ban ngày trải **178°** thay vì 22°. Giữa trưa `#7d8fa3`.
  - **Xác minh đủ 90 ô** (15 kỷ × 6 chặng): không ô nào đen/xám/cháy; 6/6 chặng phân biệt được;
    ⚠️ **ĐÍNH CHÍNH ở Phase 3W: chỗ này bản đầu ghi "180 ô × 2 theme" — SAI, xem mục 3W bên trên;** **đêm không tối hoặc phẳng thêm** (dựng lại khung đêm bằng mã TRƯỚC
    Phase 3V để so trực tiếp: chênh +0,005 độ sáng, +0,002 dải động — nằm trong nhiễu).
  - ⚠️ **CÔNG CỤ ĐO CỦA TÔI TỪNG NÓI DỐI, và suýt làm tôi chữa một bệnh không có.** Phép dò mép
    tấm bảng quét "chạy tới khi khác màu nền" chạy quá đà tới (68, 38) thay vì (8, 8), vì nền tấm
    bảng TRÙNG màu nền trang. Mỗi ô bị lấy mẫu lệch 60px sang phải + 30px xuống dưới, dính cả dải
    nhãn giữa hai hàng — dải đó **sáng trưng ở theme sáng và đen kịt ở theme tối**, nên số đo sai
    theo hai chiều NGƯỢC nhau tuỳ theme và bịa ra một "lỗi đêm phẳng chỉ ở theme tối". Toạ độ thật
    lấy thẳng từ CSS của trang (`#wrap { padding: 8px }`), không dò. **Đây là lần thứ SÁU trong
    phiên này một công cụ đo/fixture tự viết ra sai lệch** — quy tắc: nghi ngờ công cụ đo đúng như
    nghi ngờ mã sản phẩm, và số đo nào gây bất ngờ thì kiểm chính công cụ TRƯỚC khi kiểm mã.
  - **Đêm KHÔNG hỏng, đã kiểm riêng**: cờ "phẳng" ở 12/15 ô đêm là do ngưỡng tôi đặt sai cho một
    cảnh đêm (đêm tối thì tương phản tuyệt đối thấp là ĐÚNG). Phép đo có ý nghĩa là **15 kỷ có còn
    khác nhau không** — tản sắc giữa các kỷ lúc đêm 28,2°, tản sáng 0,008, ngang bằng năm chặng
    kia ⇒ Phase 3M đã chữa được thật. Không mở nợ mới.
  - **Nợ còn lại CÓ CHỦ ĐÍCH**: số mũ `t^2.6` ở `sceneGraph.js` không đụng — chú thích tại chỗ ghi
    rõ nó được nâng từ 1,2 lên để cứu lỗi "mảng oải hương xam xám"; sửa nó là mở lại một lỗi cũ để
    đổi lấy cải thiện mà đường khác đã đạt được rồi.
  - **Kèm theo (rủi ro thấp, xử lý luôn)**: `eslint.config.js` bỏ qua `.city-preview`. ESLint KHÔNG
    tự đọc `.gitignore`, nên chạy `npm run lint` đúng lúc đang dựng ảnh xem thử sẽ ra **29 lỗi giả**
    nằm trong ruột three.js được gói tạm — đủ để một phiên sau tưởng mình vừa làm hỏng gì đó.
  - Test **485** bài (giữ nguyên số — bài 81 viết lại chứ không thêm), lint sạch, build xanh.

- **2026-08-13 (Phase 3U)** — **QUÉT LẠI ĐỦ 15 KỶ × 6 CHẶNG TRÊN MÃ HIỆN TẠI: trời ban ngày KHÔNG
  BAO GIỜ xanh.** Tìm ra lỗi, **ĐỊNH VỊ chính xác nguyên nhân, nhưng CHƯA SỬA** — xem `TECH_DEBT.md`
  **#15**. Hai thử nghiệm sửa đã được **HOÀN TÁC**; mã sản phẩm giữ nguyên từng byte.
  - **Vì sao quét lại**: từ lần quét trước (3G) đã đổi bảng màu (3N) và ánh sáng đêm (3M) — bảng cũ
    không còn nói về mã đang chạy.
  - **Mắt chẩn SAI, phép đo sửa lại**: nhìn bảng quét tôi kết luận "3 chặng ban ngày giống hệt
    nhau". Đo thì **6/6 chặng vẫn phân biệt được** (khoảng cách nhỏ nhất 17/255). Nhưng phép đo lộ
    ra lỗi thật và chính xác hơn: **5/6 chặng nằm gọn trong dải sắc 19°–41° (cam-nâu), chỉ ĐÊM
    (224°) thoát ra.** Cả ngày chỉ đổi ĐỘ SÁNG (0,46 → 0,60 → 0,46) chứ không đổi SẮC — mà độ sáng
    là tín hiệu thị giác yếu nhất. Không phải "giống nhau", mà là **cùng một sắc, khác độ sáng**.
  - **Nguyên nhân (hai tầng nhân nhau)**: (1) `sceneGraph.js` pha vòm trời theo `t^2.6`, camera chúc
    xuống nên dải trời lọt khung chỉ ở `t ≈ 0,50–0,67` ⇒ `0,5^2,6 = 0,17`, tức **trời nhìn thấy được
    là 64–84% MÀU CHÂN TRỜI**. ⇒ **`horizonHue` mới là người quyết định màu trời ban ngày, KHÔNG
    phải `skyHue`** — giữa trưa khai `skyHue: 212, skyPull: 0.70` (mạnh nhất ngày) mà hoàn toàn vô
    hiệu. (2) `skyward()` trộn bằng **`mixRgb`** — ấm 40° pha lạnh 205° trong RGB thì đi qua vùng
    trung tính, **đúng họ lỗi đã sửa cho MÁI NHÀ ở Phase 3N**.
  - ⚠️ **HAI CÁCH ĐÃ THỬ VÀ THẤT BẠI, ĐỪNG THỬ LẠI**: `horizonPull 0.42` → `#a6a69a` 61° tươi 0,06
    (xám); `horizonPull 0.78` → `#9ca7a3` **157° lục-lam** tươi 0,05. Càng kéo mạnh càng lạc sang
    lục rồi chết ở xám ⇒ **chỉnh số trong `DAYLIGHT_PROFILES` KHÔNG chữa được**, phải sửa phép toán.
  - **Vì sao DỪNG chứ không sửa tiếp**: `skyward()` dùng chung cho **180 ô** (15 kỷ × 6 chặng × 2
    theme) và còn nhân với 4 skin. Phát hành một phép toán màu mới chỉnh dở còn tệ hơn giữ nguyên.
    Cần một phase riêng, không làm kèm việc khác.
  - ⚠️ **NGƯỠNG MAINTENANCE SPRINT — VẾ THỨ HAI NAY ĐÃ CHẠM**: `palette3d.js` đã qua **5 đợt** vá mỹ
    thuật (3C · 3G · 3M · 3N · nay #15). Chính sổ nợ đã đặt sẵn mốc "đợt thứ 5 thì dừng lại xem xét
    tổng thể tầng màu thay vì vá tiếp" — mốc đó đã tới. **Khuyến nghị: làm #15 như một đợt xem xét
    TỔNG THỂ phép trộn màu (RGB → HSL) cho cả mái, trời và mặt đất một lượt.**

- **2026-08-12 (Phase 3T)** — **MÔ PHỎNG 365 NGÀY: 95% SỐ PHIÊN KHÔNG CÓ LỄ MỪNG NÀO.** Phát hiện
  lớn nhất trong ngày, và lớn hơn hẳn hai thứ vừa sửa ở 3R/3S. **Chỉ NGHIÊN CỨU + ghi sổ, KHÔNG
  sửa** — mọi phương án đều đổi cân bằng kinh tế nên phải để Đàm chọn (`TECH_DEBT.md` **#14**).
  - **Cách tìm ra**: tôi vừa viết trong báo cáo 3S rằng *"một màn hình chỉ nhàm sau nhiều ngày lặp,
    việc đó không mô phỏng được"*. Sai — repo đã có sẵn **`scripts/simulate-pacing.mjs`** mô phỏng
    trọn 365 ngày, mà xưa nay chỉ dùng để cân KINH TẾ, chưa phiên AI nào dùng nó soi TRẢI NGHIỆM.
  - **Số đo**: 370 ngày × 12 phiên = **4 428 phiên**; cả game chỉ có **420 bước xây** (75 bản vẽ),
    mỗi phiên tiêu 2 bước (`CRAFT_QUEUE_SLOTS = 2`, mỗi phiên đẩy MỌI ô) ⇒ **215 phiên có lễ mừng
    (4,9%)**, **4 213 phiên im lặng (95%)**. Xấu dần theo kỷ: **kỷ 1 im lặng 81% → kỷ 15 im lặng
    98%** (thời gian ở mỗi kỷ tăng từ 4 lên 69 ngày, số bản vẽ mỗi kỷ vẫn là 5).
  - **Hệ quả cần nhớ cho MỌI phiên sau**: mọi đầu tư thêm vào lễ mừng/hiệu ứng thành phố hiện chỉ
    chạm tới **5% số phiên** trước khi tới được Đàm. Chưa xử lý #14 thì các phase kiểu 3R/3S sau này
    đều lãi thấp một cách có hệ thống.
  - **Các hướng đã cân nhắc** (chi tiết + đánh đổi ở #14): (a) tăng số ô hàng đợi — **LOẠI**, làm
    mọi thứ xây xong nhanh hơn nên im lặng tới SỚM hơn; (b) bỏ lọc theo kỷ hiện tại; (d) nói thật
    khi xưởng trống; (e) tăng `sessionsToComplete`.
  - ⚠️ **TỰ ĐÍNH CHÍNH NGAY TRONG PHASE — đây là lỗi tôi suýt để lại trong sổ.** Bản đầu của #14
    khuyến nghị **(c) nâng cấp công trình Lv.1→2→3** là "ứng viên mạnh nhất". **SAI.** Kiểm bằng
    mã: `upgradeBuilding` (`gameStore.js:5717`) là hành động **TỨC THÌ**, trả bằng tài nguyên tinh
    luyện, **KHÔNG tốn phiên nào** ⇒ nó là bể chứa TÀI NGUYÊN chứ không phải bể chứa PHIÊN, không
    thêm một bước xây nào. Cơ chế nâng cấp **đã tồn tại đầy đủ và đang chạy** (`buildingLevels` ·
    UI ở `BuildingWorkshop.jsx`/`BlueprintInventory.jsx` · `levelBoost` ở `buildingSpec.js:48`) —
    chỉ là nó không liên quan tới vấn đề này. *Chính đầu file `TECH_DEBT.md` cảnh báo "sổ khẳng
    định đã có sẵn X thì phải kiểm bằng lệnh trước khi tin" — tôi vừa vi phạm đúng cảnh báo đó khi
    viết #14 dựa vào trí nhớ về `CLAUDE.md` §4.3 thay vì đọc mã.*
  - ⚠️ **SỐ HỌC PHŨ PHÀNG (quan trọng hơn mọi phương án trên)**: 4 428 phiên vs 420 bước xây. Muốn
    chỉ MỘT NỬA số phiên có lễ mừng thì cần ~2 200 bước xây — **gấp hơn 5 lần**. Không tinh chỉnh
    nhỏ nào làm nổi. ⇒ Câu hỏi đúng KHÔNG phải "vá thế nào" mà là: **thành phố có nên là phần
    thưởng của TỪNG PHIÊN không, hay nó vốn là phần thưởng của CẢ THÁNG** — còn từng phiên đã có
    hộp vật phẩm + XP + chuỗi ngày lo? Nếu là vế sau thì #14 không phải lỗi mà là kỳ vọng đặt sai
    chỗ, và việc cần làm là **thôi đổ thêm công vào lễ mừng**, chứ không phải chỉnh kinh tế.

- **2026-08-12 (Phase 3S)** — **NHÌN BẰNG MẮT VÀO CHÍNH THẺ VỪA SỬA — hai lỗi không phép đo nào bắt
  được.** Dựng lại thẻ lễ mừng bằng **CSS đã build thật** trong Chromium headless (đủ 8 tổ hợp
  theme × skin) rồi soi.
  - **Lỗi 1 — bố cục nói TO đúng phần LẶP, thì thầm đúng phần THAY ĐỔI.** Câu cột mốc (thứ Phase 3R
    vừa làm cho đa dạng, thứ mang cảm xúc) nằm ở dòng nhãn **10px in hoa**; còn tên công trình +
    số đếm lùi (phần lặp mỗi phiên) thì **15px in đậm**. Kiểu chữ đang bóp nghẹt chính cải tiến vừa
    làm. **Đã đảo**: cột mốc → 17px đậm (là TIN); tên công trình → 11,5px `mono` mờ (là BỐI CẢNH).
  - **Lỗi 2 — "Sắp hoàn thành" đọc lướt lẫn với "Công trình đã hoàn thành"**, mà hai câu này rơi
    vào **hai phiên LIỀN NHAU** ⇒ lẫn là chắc chắn. Đổi thành **"Đã làm đủ số phiên"** (đúng
    nguyên văn `remaining = 0`, không thể nhầm với "đã xong"). Có bài test cấm câu lúc-chưa-xong
    dùng lại chữ "hoàn thành" (484 → **485**).
  - ⚠️ **LẦN THỨ NĂM: NGHI NGỜ ĐỒ NGHỀ CỨU KHỎI MỘT KẾT LUẬN SAI.** Ảnh chụp cho thấy dấu tiếng
    Việt **rời hẳn ra** ở dòng `mono` ("Đền Thờ Phô ̉ Linh Hôǹ") — trông y như một lỗi font thật.
    Kiểm ra: `dist` KHÔNG có `@font-face` nào, JetBrains Mono nạp từ **Google Fonts lúc chạy**;
    máy chụp ảnh không có mạng nên rơi về font mono của Linux vốn dựng dấu kém. **Trên máy Đàm chữ
    hiện đúng.** Suýt nữa báo một lỗi không tồn tại — và tệ hơn, suýt gỡ `mono` khỏi 265 chỗ đang
    dùng đúng.
  - **Đo kèm**: không câu mừng nào tràn hoặc xuống dòng ở cả 8 tổ hợp; câu dài nhất
    (cột mốc + Tăng tốc + tên dài nhất) xuống 2 dòng, không tràn — đóng lại đúng rủi ro tôi tự nêu
    ở báo cáo Phase 3R.

- **2026-08-12 (Phase 3R)** — **MÀN THƯỞNG THÔI LÀ MỘT HẰNG SỐ: 2 câu → 5 câu, câu lặp nhiều nhất
  82% → 33%.** Đây là lần đầu chữ **"chán"** được xử lý bằng SỐ ĐO thay vì cảm tính.
  - **Đo ra lỗi**: `buildGrowthMoment` nhánh giàn giáo trả đúng MỘT câu cứng `'Thành phố vừa lớn
    lên'`. Chạy qua toàn bộ **75 bản vẽ = 420 phiên xây**: cả game chỉ có **2 câu mừng**, **82% số
    phiên** đọc lại đúng 4 chữ đó. Nhịp ~4 phiên/ngày ⇒ Đàm gặp lại nó **hơn 3 lần MỖI NGÀY**. Màn
    thưởng mà là hằng số thì nó thôi làm phần thưởng — đó chính là "chán" ở dạng đo được.
  - **Đã sửa** (`engine/cityMoment.js`, thuần): thêm `growthHeadline()` sinh câu theo **cột mốc
    THẬT** của công trình — *Vừa khởi công · Đã qua nửa chặng · Chỉ còn một phiên nữa · Sắp hoàn
    thành · Thành phố vừa lớn lên*. Kết quả: 5 câu, câu lặp nhiều nhất còn **33%**, và chúng xếp
    thành một **mạch** (khởi công → qua nửa → còn một phiên → hoàn thành) chứ không phải 5 câu rời.
  - ⚠️ **RÀNG BUỘC KHÔNG ĐƯỢC PHÁ — đọc trước khi "cải tiến" chỗ này**: cách chữa nhàm chán rẻ nhất
    là rắc lời khen ngẫu nhiên ("Tuyệt vời!"). **TUYỆT ĐỐI KHÔNG.** Luật trung thực của file này
    đứng TRÊN luật đa dạng. Mọi câu đều là **mệnh đề ĐÚNG suy ra từ số liệu đã có**, không thêm một
    dữ kiện mới nào. Có bài test canh riêng việc này (xem dưới).
  - **Tiện tay trả một sự thật đang bị giấu**: đặc quyền **"Tăng tốc"** xưa nay chỉ lặng lẽ đổi vạch
    xuất phát của thanh tiến độ — Đàm trả giá cho nó mà không lần nào thấy nó làm việc. Nay dòng phụ
    ghi rõ `· Tăng tốc đẩy thêm 1 bước` khi nó vừa có tác dụng.
  - **Lỗ hổng phụ tìm ra khi đo**: trạng thái `còn 0 phiên` (hàng đợi chưa kịp dọn) vẫn rơi vào câu
    chung chung dù dòng phụ đã ghi "sắp xong" từ lâu → nay có câu riêng `'Sắp hoàn thành'`.
  - **4 bài test mới** (480 → **484**), **đã chứng minh ĐỎ cả hai hướng**: (a) trả `growthHeadline`
    về câu cứng như bản đã chạy thật ⇒ đỏ *"cả game chỉ có 2 câu mừng cho 420 phiên xây"*; (b) rắc
    câu cho đủ đa dạng nhưng nói SAI sự thật ⇒ bài "CỘT MỐC PHẢI ĐÚNG" bắt được ngay. Ngưỡng 50%
    đặt **DƯỚI** giá trị hỏng đã từng chạy thật (82%) — đúng bài học "ngưỡng đặt trên giá trị hỏng
    thì chỉ là cái phễu", phiên này đã trả giá 3 lần cho nó.
  - ⚠️ **BÀI HỌC LẶP LẠI LẦN THỨ TƯ — dev-tool phải bị nghi ngờ như mã sản phẩm**: bản đo đầu tiên
    dùng `bpId` tôi tự bịa (`bp_nha_kho`) nên nhánh "công trình hoàn thành" im lặng; bản thứ hai thì
    mô hình phiên cuối là *giàn giáo còn 0 phiên* thay vì *hoàn thành*, báo 51% thay vì 33%. Cả hai
    lần đều **suýt dẫn tới kết luận sai**. Đã sửa: bài test dựng lịch sử bằng `computeCityLayout` +
    `BUILDING_EFFECTS` thật, và phiên cuối đi qua đúng nhánh `newlyBuilt`.

- **2026-08-12 (Phase 3Q)** — **TRẢ NỢ #12: LỄ MỪNG KHÔNG CÒN BỊ TÍNH VÀO GIỜ NGHỈ.**
  `BREAK_START_DELAY_MS` **500 → 3 200 ms** (`engine/timerSession.js`), phủ trọn lễ mừng.
  - **Trước**: phiên xong → 0,5 s sau đồng hồ nghỉ đã chạy, trong khi lễ mừng còn 3,2 s rồi mới tới
    hộp phần thưởng ⇒ **2 700 ms giờ nghỉ bị lễ mừng ăn mất**, cộng thời gian đọc hộp phần thưởng,
    tổng ~8–18 giây trên một phiên nghỉ 5 phút. Sai về nguyên tắc: **phần thưởng bị trừ vào giờ
    nghỉ** — lễ mừng là tiền công, không phải khoản Đàm tự trả.
  - **Bài test đổi vai**: từ *chốt mức nợ* (Phase 3P) sang khẳng định **bất biến thật**
    `BREAK_START_DELAY_MS >= GROWTH_MOMENT_MS`. **Đã chứng minh ĐỎ cả HAI chiều**: hạ độ trễ về 500
    ⇒ đỏ; kéo lễ mừng lên 5 000 mà quên chỉnh độ trễ ⇒ cũng đỏ.
  - ⚠️ **Hai hằng số CỐ Ý không import lẫn nhau**: tầng đồng hồ KHÔNG được phụ thuộc tầng thành phố
    (đồng hồ phải chạy đúng cả khi không có lễ mừng nào — lễ mừng chỉ xuất hiện khi có công trình
    tiến triển). Ràng buộc xuyên tầng sống ở BÀI TEST, không ở câu `import`.
  - ⚠️ **Đánh đổi đã cân nhắc**: phiên KHÔNG có lễ mừng nay cũng chờ 3,2 s mới vào nghỉ. Chấp nhận
    vì cả hai trường hợp người dùng đều đang nhìn hộp phần thưởng chứ không nhìn đồng hồ; và lệch
    về phía "được nghỉ đủ" an toàn hơn lệch về phía "bị ăn bớt". Muốn quay lại: đổi đúng MỘT dòng
    về 500 (bài test sẽ đỏ và nhắc lại toàn bộ lý do).
  - **Đã kiểm an toàn trước khi đổi**: không logic đồng hồ nào phụ thuộc việc cửa sổ `FINISHED`
    phải ngắn; trong 3,2 s đó màn hình hiện "Hoàn thành" (đúng thứ nên hiện lúc đang ăn mừng), và
    `pendingBreakTimeoutRef` vẫn được `reset()`/`cancel()` dọn như cũ. **480 bài test.**

- **2026-08-12 (Phase 3P)** — **DỰNG LƯỚI CHO NHỊP PHIÊN, KHÔNG TỰ Ý ĐỔI HÀNH VI ĐỒNG HỒ.**
  Trả phần đầu tiên của nợ #13 và dựng hàng rào cho #12, mà KHÔNG đổi một hành vi nào.
  - **Hai con số vô danh nay có TÊN và về tầng THUẦN**: `GROWTH_MOMENT_MS` (3 200) chuyển từ
    `components/city/CityGrowthMoment.jsx` → **`engine/cityMoment.js`**; `BREAK_START_DELAY_MS`
    (500) rút khỏi 2 chỗ viết cứng trong `hooks/useTimer.js` → **`engine/timerSession.js`**.
    `CityGrowthMoment.jsx` xuất lại `MOMENT_MS` nên mọi chỗ đang import không phải sửa.
  - **Vì sao phải về tầng thuần**: chừng nào hai số còn nằm ở hai tầng không nói chuyện được với
    nhau (một trong component có `framer-motion`, một trong hook React) thì **không bài test
    `node --test` nào canh nổi quan hệ giữa chúng** — mà chính khoảng lệch đó là nội dung của #12.
  - **Bài test mới "NHỊP MỘT PHIÊN"** (`timerSession.test.js`): **CHỐT khoảng bị trừ ở 2 700 ms**.
    Đây là bài test *chặn nợ phình to*, KHÔNG phải bài test *mọi thứ đã đúng* — nói rõ điều đó ngay
    trong chú thích để phiên sau không hiểu nhầm là đã xong. Kèm 3 chốt phụ để nó không bị "thoả"
    bằng cách phá thứ khác (lễ mừng không được ngắn dưới 2 s, không vượt trần 3,5 s, độ trễ > 0).
  - **Đã chứng minh ĐỎ**: nâng lễ mừng lên 5 000 ms (mô phỏng việc thêm màn mở khoá kỷ mới) ⇒ bài
    test đỏ ngay. **480 bài test.**
  - ⚠️ **KHÔNG đổi giá trị 500 ms** — đó là thay đổi hành vi đồng hồ production, thuộc quyền quyết
    của Đàm (phương án A/B ở `TECH_DEBT.md` #12). Việc của phiên này chỉ là làm cho khoản nợ **nhìn
    thấy được và không tự lớn lên**.

- **2026-08-12 (rà nhịp phiên)** — **PHÁT HIỆN: LỄ MỪNG ĐANG BỊ TÍNH VÀO GIỜ NGHỈ.** Rà mục "nhịp
  một phiên thật" của `/goal` và tìm ra một lỗi ĐO ĐƯỢC, không cần thiết bị: với cấu hình MẶC ĐỊNH
  (`autoStartBreak: true`), phiên nghỉ bắt đầu đếm sau **500 ms**, trong khi lễ mừng chạy
  **3 200 ms** và hộp phần thưởng chỉ hiện SAU đó ⇒ đồng hồ nghỉ chạy **2 700 ms trước khi lễ mừng
  kết thúc**, rồi chạy tiếp suốt lúc Đàm đọc hộp phần thưởng (~8–18 giây trên 5 phút, ~3–6%).
  Ý nghĩa mới là chỗ đáng nói: **phần thưởng đang bị trừ vào thời gian nghỉ.**
  ⚠️ **CHƯA SỬA — CÓ CHỦ Ý.** Đây là thay đổi HÀNH VI ĐỒNG HỒ trên app production, mà `useTimer.js`
  là hot spot và **hiện có ĐÚNG 0 bài test** ⇒ sửa lúc này là sửa mà hoàn toàn không có lưới. Đã ghi
  đầy đủ 14 trường vào **`TECH_DEBT.md` mục #12** kèm 2 phương án và lý do cần Đàm quyết. Không
  "tiện tay" sửa hot spot.
  ⚠️ *(Đính chính cùng ngày, muộn hơn: câu này ban đầu tôi viết là "41 bài characterization test
  hiện chưa nối vào `npm test`" — chép lại từ `BAN_GIAO.md` mà không kiểm. Kiểm ra thì bộ test đó
  **chưa từng tồn tại**; xem đính chính đầu file + `TECH_DEBT.md` #13. Đúng cái bẫy tài liệu-không-
  kiểm-chứng mà chính phiên này đã gặp hai lần trước đó.)*

- **2026-08-12 (Phase 3O)** — **KHOÁ LỜI HỨA GAME HOÁ CỐT LÕI BẰNG SỐ, KHÔNG BẰNG GHI CHÚ.**
  Lượt XÁC MINH (không thêm tính năng): đóng hai lỗ hổng nghiệm thu tự tạo ra ở 3M/3N.
  - **Theme tối, 15 kỷ**: đo lại sau 3N — cặp mái gần nhau nhất **8,4** lúc trưa và **7,1** lúc đêm,
    phủ **9/12 múi màu**. Đạt. (Cảnh ban ngày vốn không phụ thuộc theme — `isDark` khi có `daylight`
    nghĩa là "trời đêm", không phải "theme tối".)
  - **Giàn giáo có thật sự lớn lên không** — mệnh đề game hoá cốt lõi nhất của dự án. Đo hàm thuần:
    **cao gấp 3,48 lần** từ khởi công tới sắp xong (0,426 → 1,480). ✅ Đúng như thiết kế.
  - ⚠️ **SUÝT SỬA MỘT THỨ KHÔNG HỎNG.** Ảnh `--pending 4` cho ra bốn công trường trông cao gần bằng
    nhau, nhìn như lỗi. Truy ra thì **fixture của chính công cụ xem thử** đặt `sessionsRemaining:
    i+1` ⇒ bốn công trường chỉ trải tiến độ **50%–88%**, không phải 0%→100%. Lỗi ở CÁI THƯỚC, không
    ở sản phẩm. **Bài học: fixture của công cụ dev cũng phải bị nghi ngờ như mã sản phẩm** — một
    công cụ soi lỗi mà tự nó sai thì tệ hơn không có (đúng họ với cái bẫy `--hour` một-giá-trị đã
    ghi ở đầu `scripts/city-preview.mjs`).
  - **Đã siết bài test `giàn giáo cao dần theo tiến độ`** (`buildingSpec.test.js`): bài cũ chỉ khoá
    HƯỚNG ("cao hơn bước trước") nên một bản sửa làm giàn giáo lớn lên **1,02 lần** vẫn xanh sạch
    trong khi mắt không thấy gì. Đây ĐÚNG cái bẫy "ngưỡng một phía là cái phễu" của 3M, chỉ khác là
    phễu nằm ở ĐỘ LỚN. Thêm 2 khẳng định: (a) tỉ lệ lớn lên đầu→cuối **≥ 3 lần**; (b) từ 80% tới
    xong, **tường đá trong lòng giàn giáo phải dâng thêm ≥10%** — vì khung gỗ CỐ Ý kẹp ở
    `fullHeight` từ ~78% (giàn giáo luôn vượt lên trên phần đã xây), nên nếu không có (b) thì 1–2
    phiên cuối, đúng lúc hồi hộp nhất, sẽ không có gì nhúc nhích.
  - **Cả hai khẳng định đã chứng minh ĐỎ** bằng cách bơm đúng hai hồi quy tương ứng vào
    `buildingSpec.js` rồi khôi phục. **479 bài test.** Không đổi dòng mã sản phẩm nào.

- **2026-08-12 (Phase 3N)** — **15 KỶ NAY RA 15 MÀU MÁI, KHÔNG CÒN HAI CỤM.**
  Cùng bảng quét của 3M còn phơi ra lỗi thứ hai, và lỗi này đánh thẳng vào phần thưởng tiến trình.
  - **Số đo lúc chưa sửa**: 15 góc màu mái dồn vào **ĐÚNG HAI CỤM** — 9°–55° (9 kỷ) và 329°–342°
    (6 kỷ); cả khoảng **60°–320° của vòng tròn màu bỏ trống**. **kỷ 5 ↔ 11 ↔ 12 cách nhau 0°**
    (trùng khít), kỷ 2 ↔ 9 cách 1°, kỷ 6 ↔ 15 cách 4°. Nặng nhất: **kỷ 8 (sắc kỷ 198° LAM) và kỷ
    10 (sắc kỷ 0° ĐỎ) ra hai mái cách nhau 1°** — hai sắc kỷ cách nhau 198° mà cho ra gần như cùng
    một màu. Xác nhận bằng mắt ở cỡ thật: ảnh kỷ 6 (Phong Kiến) và kỷ 15 (Trí Tuệ Nhân Tạo) có mái
    mận **y hệt nhau**, chỉ khác hình dáng.
  - **Nguyên nhân gốc**: vai màu `roof` dùng `material(16, 0.40, …)` → `blend` dựng màu kỷ bằng
    `hslToRgb({ h: eraHue, s: sat, l })`, tức **chỉ giữ GÓC MÀU của kỷ, vứt bỏ độ tươi và độ đậm**.
    Thêm nữa neo 16° (đất nung, ẤM) chỉ nhận 40% sắc kỷ, mà trộn RGB luôn cắt qua vùng trung tính
    ⇒ mọi kỷ có sắc LẠNH (gần đối lập 16°) đều bạc về nâu xám. Kỷ 5 và 12 thì vô phương: chúng có
    **cùng góc màu 215°** (`#94a3b8` xám lam nhạt vs `#64748b` xám lam đậm), khác nhau ĐÚNG ở độ
    tươi và độ đậm — hai thứ đang bị vứt.
  - ⚠️ **Ghi chú cũ ở `roof` khẳng định phép trộn này cho "15 sắc mái phân biệt được".** Điều đó
    **chưa bao giờ được ĐO**, và số đo nói ngược lại. **Bài học: một khẳng định về mỹ thuật mà
    không kèm số đo thì là dự đoán, và dự đoán thì trôi.**
  - **Đã sửa**: thêm `eraRoof()` trong `palette3d.js` — vai màu DUY NHẤT dùng CẢ màu kỷ: sắc kỷ
    0,40 → **0,80**; **độ tươi theo kỷ** (kỷ nhợt → mái xám thật, kỷ rực → mái đỏ gạch); **độ đậm
    theo kỷ**. ⚠️ **VẪN TRỘN RGB, KHÔNG quay lại xoay góc màu** — cả họ lỗi "tím sen" là do nội suy
    góc màu; ở đây góc màu lấy THẲNG của kỷ, chỉ kéo độ tươi/độ đậm (hai đại lượng thẳng, không có
    vòng để lật).
  - ⚠️ **Trần riêng cho dải tím (255°–340°, hạ độ tươi về ≤0,40)**: bản đầu của `eraRoof` làm **ĐỎ
    bài test "KHÔNG một vai màu nào ra TÍM SEN RỰC"** (kỷ 6/7/11 ra 0,51–0,54 > ngưỡng 0,42). Cách
    trả lời ĐÚNG là giữ nguyên GÓC MÀU (ba kỷ vẫn phân biệt được ở 268°/284°/307°) và chỉ hạ ĐỘ
    TƯƠI — **không được đi nới ngưỡng của bài test kia**, vì đó mới là phá bất biến.
  - **Kết quả**: cặp gần nhau nhất **0,0 → 8,4**; 15 góc màu trải từ **3° tới 307°** thay vì hai
    cụm. Đúng chất từng kỷ: Tăm Tối xám lam ảm đạm · Khám Phá xanh biển · Công Nghiệp đỏ gạch ·
    Thế Chiến xám bê tông · Trí Tuệ Nhân Tạo chàm sâu, **khác hẳn** Phong Kiến tím.
  - **Hàng rào mới** (`palette3d.test.js`, đã chứng minh ĐỎ trước phép dựng cũ): khoảng cách màu
    nhỏ nhất giữa 15 mái ≥ 6 · 15 mái phải phủ ≥ 6 múi màu 30° (bản hỏng chỉ phủ 3) · không mái nào
    tươi quá 0,66. **479 bài test.**

- **2026-08-12 (Phase 3M)** — **ĐÊM KHÔNG CÒN LÀ MỘT Ô ĐEN.** Quét lại đủ **15 kỷ × 6 chặng ngày**
  (90 cảnh, ảnh `.city-preview/sweep-light-ky1-15.png`) rồi **ĐO BẰNG MÁY** thay vì nhìn bằng mắt —
  và phép đo phơi ra một lỗi mà 3 phase mỹ thuật trước đều không thấy:
  - **Số đo lúc chưa sửa**: dải THÀNH PHỐ (55% dưới khung hình) lúc 22 giờ có độ sáng trung vị
    **0,023** (≈ 6/255 — một nửa diện tích đen đặc), trong khi bình minh/hoàng hôn được 0,22 và
    giữa trưa 0,456. **Dải động** (p95−p05) đêm 0,129 so với trưa 0,474 ⇒ đêm vừa TỐI NHẤT vừa
    PHẲNG NHẤT. **Độ lệch giữa 15 kỷ lúc đêm chỉ 0,010** — thấp nhất trong 6 chặng, tức **ban đêm
    cả 15 kỷ trông y hệt nhau**: mất sạch phần thưởng của việc đi hết 15 kỷ, đúng vào khung giờ
    Đàm hay làm phiên khuya.
  - **Nguyên nhân gốc — đêm bị làm tối tới BA tầng nhân nhau**, mỗi tầng nhìn riêng đều hợp lý:
    (1) màu đèn lấy từ bầu trời đêm (trời đậm ⇒ ánh sáng đậm theo); (2) nắng yếu đi vì là ánh
    trăng; (3) **SƠN cũng bị hạ sắc độ ở nhánh `isDark`**. Tầng (1)(2) LÀ ban đêm, đúng. Tầng (3)
    là đếm thêm một lần nữa cho cùng một chuyện — mặt đất ban đêm không đổi màu sơn, nó chỉ được
    chiếu ít sáng hơn. ⚠️ Đây là lý do **hai lần vá trước (bơm `fillEnergy` 1,45 → 3,40) không ăn
    thua**: chúng CỘNG vào tầng (1) trong khi thủ phạm ở tầng (3), mà (3) thì NHÂN.
  - **Lỗi thứ hai, ngược chiều**: nắng đêm 1,72 × 0,42 = 0,72 trong khi đèn nền 0,78 × 3,40 = 2,65
    ⇒ **ánh sáng KHÔNG HƯỚNG gấp 3,7 lần ánh sáng CÓ HƯỚNG**. Đó là định nghĩa của một bức phẳng.
    Sự thật ngược lại: đêm chỉ có MỘT nguồn sáng cứng (mặt trăng) ⇒ **đêm là chặng chiaroscuro
    mạnh nhất trong ngày**, không phải yếu nhất.
  - **Đã sửa** (`daylight.js` + `palette3d.js`, đều là engine THUẦN): ánh trăng `sunEnergy`
    0,42 → **1,15**; đèn nền `fillEnergy` 3,40 → **2,60** (vẫn gấp 3,25 lần giữa trưa, vẫn qua bài
    test khoá tỉ lệ cũ); sắc độ đêm của `groundShades` 0,286 → **0,40** và `outskirts` 0,18 → **0,34**.
  - **Kết quả đo lại**: trung vị **0,023 → 0,058** (+152%), trung bình 0,049 → 0,085, dải động
    0,129 → **0,170**, độ lệch giữa các kỷ 0,010 → 0,012. **Năm chặng còn lại KHÔNG đổi một byte**
    (0,203/0,313/0,414/0,300/0,204 y hệt trước) — thay đổi được chặn gọn trong nhánh `isDark`.
  - **Hai hàng rào MỚI, đã chứng minh ĐỎ trước giá trị cũ rồi mới XANH sau khi sửa** (478 bài):
    (a) `daylight.test.js` — "ĐÊM PHẢI CÓ HƯỚNG SÁNG": `sunEnergy/fillEnergy ≥ 0,35`, chặn đúng
    cái bẫy mà bài test cũ ("đèn nền đêm phải gấp ≥3 lần trưa") vô tình tạo ra; (b) `palette3d.test.js`
    — ngưỡng sáng trưa/đêm đổi từ **một phía** sang **hai phía** `(1,25 … 1,75)`.
  - ⚠️ **BÀI HỌC LỚN NHẤT PHIÊN NÀY — "một ngưỡng chỉ chặn một phía thì không phải hàng rào, nó là
    cái phễu."** Bài test cũ chỉ đòi "trưa sáng hơn đêm ≥1,6 lần", nên mặt đất đêm càng tối thì
    càng thoả — lỗi đen thui đi qua hàng rào mà không bài nào đỏ. Ngưỡng mới phải đặt **dưới giá
    trị hỏng thật** (1,93) mới có nghĩa; chọn 1,75 vì lý do đó, không phải vì số tròn.
  - ⚠️ **Bài học thứ hai**: **"tối quá" và "phẳng quá" là hai bệnh khác nhau, và thuốc chữa bệnh
    này làm nặng thêm bệnh kia.** Chỉ đo tổng độ sáng thì vĩnh viễn không phân biệt được — phải đo
    thêm **dải động**. Công cụ đo nằm ở `scripts/city-preview.mjs --sweep` + `scripts/png-probe.mjs`.

- **2026-08-12 (Phase 4′-d)** — **NỐI HAI ĐẦU: PHIÊN THẬT CỦA STORE → CÂU CHỮ HIỆN RA.**
  ⚠️ **Phát hiện một CHỖ HỞ mà cả hai lớp test cũ đều không bịt được.** Phase 4′ có hai lớp kiểm:
  (a) test engine đưa giàn giáo TỰ TAY DỰNG vào → chứng minh engine tính đúng, KHÔNG chứng minh
  store có đưa cho engine đúng thứ đó; (b) soi bằng trình duyệt thì BƠM THẲNG `pendingReward` qua
  `window.__store` → chứng minh giao diện hiện đúng, nhưng cũng bơm tay luôn cái trường đáng lẽ
  phải kiểm. **Chỗ hở nằm chính giữa**: đổi tên trường, đổi thứ tự dọn hàng đợi, hay lọc nhầm kỷ —
  cả hai lớp kia đều KHÔNG đỏ, còn Đàm thì hoàn thành một công trình mà không có lễ mừng nào.
  - `gameStore.cityMoment.test.js` (MỚI, 6 bài) chạy ĐÚNG đường thật: gọi `completeFocusSession()`
    rồi lấy state SAU ĐÓ nuôi thẳng vào `computeCityLayout` + `buildGrowthMoment`/`buildFocusTease`.
    **Không một fixture tự chế nào.** Đã xác minh: gỡ dòng `newlyBuiltIds` khỏi store ⇒ **2 bài ĐỎ**
    ngay (trước đó không có bài nào đỏ cả).
  - Bịt luôn một bất biến an toàn chưa ai kiểm: bài 6 đọc `localStorage` sau một phiên thật và
    khẳng định **`pendingReward` KHÔNG bị lưu xuống đĩa** — tức `ui` vẫn nằm ngoài `partialize`,
    đúng điều kiện đã ghi ở ADR-010 (không thêm byte nào vào JSONB đang tranh chấp CAS). Ai đó đưa
    `ui` vào phần được lưu thì từ nay sẽ đỏ ngay.
  - **Đã tự kiểm hai nguyên nhân làm Vercel FAIL BUILD trong lịch sử dự án** (thứ tôi kiểm được từ
    xa, khác với việc xác nhận "Ready"): **10/12** Serverless Function, và mọi đường dẫn trong
    `vercel.json` (2 `functions` + 2 `crons`) đều trỏ tới file CÓ THẬT. Cả hai cửa tử của sự cố
    `8ee264d` đang sạch.
  - Test **477 xanh** (+6), lint sạch, build xanh.

- **2026-08-12 (Phase 4′-c)** — **KHÉP NỐT ĐẦU VÒNG LẶP: LÚC BẤM BẮT ĐẦU, MÀN HÌNH NÓI PHIÊN NÀY
  ĐỂ LÀM GÌ.** Phase 4′ khép được ĐUÔI vòng lặp (xong phiên → thấy thành phố lớn lên), nhưng ĐẦU
  vòng lặp vẫn phẳng: lúc bấm "Bắt đầu", không có gì nói 25 phút sắp tới để làm gì cho thành phố.
  Thẻ "Chuỗi" đã làm đúng việc này cho streak từ lâu (*"Còn N ngày → mốc"*), còn thành phố thì
  chưa có gì tương đương. Đó là chỗ phẳng cuối cùng của chữ "chán".
  - Một DÒNG ngay dưới lời chào, trên đồng hồ. Ba giọng:
    · `Đang xây Thư Viện Khoa Học · còn 2 phiên` (bình thường)
    · **`Phiên tới hoàn thành Thư Viện Khoa Học`** (màu nhấn, đậm — đây mới là lúc đáng bấm Bắt đầu)
    · `Xưởng đang trống — phiên xong lúc này không đẩy công trình nào tiến thêm`
  - ⚠️ **IM LẶNG với người MỚI**: chưa từng xây gì thì KHÔNG hiện câu "xưởng trống". Người mới chưa
    có xưởng để mà trống; nhắc lúc đó là trách móc một việc họ còn chưa biết là có.
  - ⚠️ **KHÔNG hứa hẹn gì về nguyên liệu.** Luật "bản vẽ nào khởi công được" là của
    `BuildingWorkshop` (unlock · đúng kỷ · chưa xây · đủ tài nguyên). Chép sang đây là tạo bản sao
    sẽ trôi khỏi bản gốc — và một lời mời "xây đi" mà bấm vào thì không đủ nguyên liệu còn tệ hơn
    im lặng. Có bài test cấm mọi từ hứa hẹn trong câu đó.
  - ⚠️ **HAI BÀI HỌC VỀ CHỖ ĐẶT (đều do ảnh chụp khung 390px chỉ ra, không phải suy luận)**:
    (a) **`FocusRail` là `hidden … lg:flex` — CHỈ hiện trên màn rộng.** Đặt thẻ ở cột phải là đặt
    vào chỗ Đàm KHÔNG BAO GIỜ nhìn thấy, vì anh làm việc chủ yếu trên iPhone. Phải đặt ở cột giữa.
    (b) Đặt SAU `PomodoroEngine` thì nằm **dưới nếp gấp** — thẻ đồng hồ cao gần hết màn iPhone.
    Ảnh chụp lần đầu không thấy dòng nào cả. Đã chuyển lên NGAY DƯỚI lời chào, trước đồng hồ.
  - **Dọn nợ luôn**: `useCityGrowthMoment.js` đổi thành `useCityMoment.js` chứa CẢ HAI hook, dùng
    chung một `useCitySnapshot` — thay vì chép đoạn "khoá theo nội dung + dựng bố cục" lần thứ ba
    trong dự án. Engine cũng gộp: `pickNearestScaffold` dùng chung cho cả hai đầu phiên, nên hai
    màn hình không thể nói về hai công trình khác nhau (có test khoá đúng điều đó).
  - **Chi phí đã biết, chấp nhận có chủ ý**: trang chủ nay dựng bố cục thành phố 2 lần (lớp nền 3D
    + dòng này). Hook không chia sẻ được `useMemo` giữa hai component nếu không dựng context/cache
    — mà cả hai đều memo theo NỘI DUNG nên chỉ tính lại mỗi phiên một lần, không phải mỗi lượt
    render. Không đáng dựng thêm một tầng context cho việc đó.
  - Đã soi bằng trình duyệt thật ở khung iPhone 390px: **cả ba giọng đều ra đúng chữ**. Test
    **471 xanh** (+6), lint sạch, build xanh. Gói riêng 1,01 KB (0,58 KB gzip).

- **2026-08-12 (Phase 4′-b)** — **CHUÔNG THÔNG BÁO NỔI TRÊN MỌI HỘP THOẠI SUỐT BAO LÂU NAY.**
  Chụp một ảnh khung iPhone của lễ mừng Phase 4′ để xem có tràn không, thì thấy **cái chuông sáng
  trưng nổi lên trên lớp mờ**. Đo lại bằng `elementFromPoint` trong trình duyệt thật: chuông ở
  `z-[75]`, mà **TẤT CẢ hộp thoại của app đều thấp hơn** (z-50: phần thưởng/thảm hoạ/khủng hoảng/
  thăng hoa/báo cáo tuần · z-[60]: Coach, thăng cấp, hướng dẫn · z-[70]: lễ mừng). Tức là **lỗi
  này CÓ SẴN TỪ LÂU và ảnh hưởng tới cả màn hình phần thưởng** — không phải do Phase 4′ gây ra;
  Phase 4′ chỉ là cái làm nó lộ ra.
  - Sửa đúng MỘT chỗ: chuông `z-[75]` → **`z-[45]`**. Vẫn cao hơn mọi nội dung trang thường
    (z-1/z-2) và thanh nổi đáy màn (z-40), nhưng thấp hơn sàn của dải hộp thoại (z-50).
  - Khoá bằng `src/components/notificationLayer.test.js` (3 bài, **đã xác minh ĐỎ** trên số cũ):
    bài 2 **quét cả thư mục** `*Modal.jsx` nên một hộp thoại mới ra đời với z quá thấp sẽ bị bắt
    ngay, không cần ai nhớ sửa test.
  - ⚠️ **BÀI HỌC — bài test suýt phát tín hiệu an toàn GIẢ**: regex đọc lớp z ban đầu đặt `\b` sau
    `]`, mà `]` lẫn dấu cách đứng sau đều không phải ký tự từ ⇒ **mọi lớp dạng `z-[70]` lặng lẽ
    biến mất**, bài quét sẽ XANH trong khi chẳng đo gì cả. Bắt được nhờ chạy thử trên số cũ và
    thấy nó KHÔNG đỏ như đáng lẽ phải thế. Quy tắc: bài test mới nào cũng phải xem nó ĐỎ một lần.
  - ⚠️ **BÀI HỌC — `{/* … */}` không đứng cạnh phần tử gốc được**: đặt chú thích JSX ngay trước
    `<div>` trong `return ( … )` là **hai nút gốc** ⇒ build FAIL. Chú thích giải thích cho cả
    component thì để dạng `//` phía trên `return`.
  - Test **465 xanh** (+3), lint sạch, build xanh. Đã soi lại trong trình duyệt: chuông nay nằm
    dưới cả lễ mừng lẫn màn hình phần thưởng, và vẫn bấm được bình thường khi không có hộp thoại.

- **2026-08-12 (Phase 4′)** — **3,2 GIÂY ĐƯỢC NHÌN THẤY THÀNH PHỐ LỚN LÊN.**
  Đàm: *"mọi thứ phải hoàn hảo và không bị chán"*. Ba phase trước đã làm thành phố **đọc được**
  (còn bao xa) và **sờ được** (chạm vào xem) — nhưng đúng khoảnh khắc đáng giá nhất, lúc chuông báo
  hết 25 phút, Đàm vẫn chỉ thấy một hộp thoại vật phẩm. Thành phố có lớn lên thật, chỉ là **anh
  không được nhìn thấy nó lớn lên**. Đây là mắt xích cuối của vòng lặp "làm việc → thấy thành quả".
  - Sau mỗi phiên, nếu thành phố THẬT SỰ có gì đổi: một thẻ hiện lên 3,2 giây — biểu tượng công
    trình, tên nó, và **thanh tiến độ chạy từ vạch của phiên trước tới vạch bây giờ**. Đó mới là
    nội dung cảm xúc: mắt nhìn thấy cái nấc vừa nhích lên, chứ không phải đọc một con số.
  - ⚠️ **TRUNG THỰC HƠN HIỆU ỨNG**: `buildGrowthMoment` trả `null` khi thành phố không đổi gì —
    đi thẳng vào phần thưởng, không khen rỗng. Một lời khen sai MỘT lần thì mọi lời khen sau đều
    mất giá (cùng nguyên tắc chống-bịa của AI Coach). Vạch xuất phát đọc `acceleratedCraftingIds`
    để biết phiên này đẩy 1 hay 2 bước — không đoán.
  - ⚠️ **ĐIỂM CẮM**: KHÔNG đụng store. `lootModalOpen` vẫn bật đồng bộ (ba bài test hiện có khẳng
    định), chỉ phần HIỂN THỊ được chen thêm một chặng qua `RewardSequence` trong `App.jsx`. Lý do
    đầy đủ + hai phương án bị loại: **ADR-010**.
  - ⚠️ **CỔNG HỎNG THEO HƯỚNG MỞ**: phần thưởng hiện ra TRỪ KHI khoảnh khắc đang thật sự chạy.
    Không có gì để khoe · bật giảm chuyển động · dữ liệu lạ — mọi nhánh đều dẫn thẳng tới phần
    thưởng. Cộng: một chạm là bỏ qua, và đồng hồ bảo hiểm 3,2 giây.
  - **ĐÃ SOI TẬN MẮT bằng trình duyệt thật** (Chromium + CDP, Supabase bị chặn ở tầng DNS nên
    không có đường nào ghi vào dữ liệu thật): (A) có công trường ⇒ khoảnh khắc chặn trước phần
    thưởng; (B) tự nhường chỗ, đo được **giữ sóng 3070 ms** (mã đặt 3200); (C) không có gì để khoe
    ⇒ phần thưởng hiện NGAY. **3/3 đạt, chạy lại 2 lần đều đạt**, không lần nào hiện cả hai.
  - ⚠️ **HAI BÀI HỌC ĐO LƯỜNG (nhớ kỹ, đã trả giá cả hai)**:
    (a) **Đọc đồng hồ, đừng đếm nhịp.** Bản đo đầu đếm số lần lấy mẫu rồi nhân 100 ms — nhưng mỗi
    lần lấy mẫu còn tốn một vòng gọi CDP dài ngắn tuỳ máy đang bận, nên CÙNG một đoạn code cho ra
    "3,2 giây" ở lần chạy này và "0,4 giây" ở lần chạy sau. Suýt nữa thì đi sửa một con bug không
    tồn tại.
    (b) **`innerText` trả về chữ ĐÃ áp `text-transform`.** Nhãn `LootDropModal` có class
    `uppercase`, nên tìm đúng chuỗi gốc `'Phiên Hoàn Tất'` KHÔNG khớp — phép thử báo "phần thưởng
    không hiện" trong khi nó đang hiện chình ình. So chữ trên DOM thì phải bỏ phân biệt hoa/thường.
  - **Đã vá luôn một hồi quy do chính phase này gây ra**: đo bằng máy thấy gói mã của màn phần
    thưởng chỉ **bắt đầu tải SAU khi khoảnh khắc kết thúc** — tức là ta vừa đẩy nó lùi 3,2 giây so
    với trước, và trên mạng yếu cái giá đó là một khoảng trắng ngay sau 25 phút làm việc thật.
    `createRecoverableLazy` nay có `preload()`; đo lại: gói phần thưởng bắt đầu tải ở mốc **326 ms**,
    xong từ lâu trước khi khoảnh khắc hết.
  - ⚠️ **KHÔNG dựng cảnh 3D trong khoảnh khắc này** — trang chủ đã giữ một WebGL context cho lớp
    nền; mở context thứ hai đúng lúc máy vừa chạy xong 25 phút là cách nhanh nhất để iOS thu hồi
    cả hai.
  - Test **462 xanh** (+13: 10 bài `cityMoment` + 3 bài `runtimeRecovery`), lint sạch, build xanh.
    Gói `CityGrowthMoment` tách riêng 2,22 KB (1,06 KB gzip) — không làm gói chính to thêm.

- **2026-08-12 (Phase 3L)** — **NÓI CHO ĐÀM BIẾT LÀ CHẠM ĐƯỢC.**
  ⚠️ **Một tính năng không ai biết là một tính năng không tồn tại.** Chạm-vào-công-trình dựng xong
  ở Phase 3K nhưng KHÔNG có gì trên màn hình nói rằng nó tồn tại — cảnh 3D trông y hệt một bức
  tranh, và không ai đi chạm thử vào một bức tranh. Suýt nữa thì cả Phase 3K nằm im.
  - Dòng nhắc dưới cảnh: *"Kéo để xoay · chạm vào công trình để xem chi tiết"*.
  - Trên máy tính thêm **con trỏ đổi hình** khi rê chuột qua một công trình (`pointer` ↔ `grab`) —
    dùng lại đúng phép dò của Phase 3K, là toán thuần trên dăm cái hộp nên rê chuột liên tục cũng
    không tốn gì; chỉ ghi `style.cursor` khi GIÁ TRỊ ĐỔI, không ghi mỗi lần chuột nhích.
  - Cả hai đều tắt ở lớp nền trang chủ. Đã thêm test khoá `chrome={false}` cho `CityBackdrop` —
    đó là công tắc gom mọi thứ chữ nghĩa của `CityStage` (câu báo lùi-2D, HUD, và nay là dòng
    nhắc); mất nó thì một dòng hướng dẫn kỹ thuật nổi lên ngay sau lưng đồng hồ đếm ngược.
  - Test **449 xanh** (thêm assertion vào bài sẵn có, không thêm bài mới), lint sạch, build xanh.

- **2026-08-12 (Phase 3K)** — **CHẠM VÀO CÔNG TRÌNH ĐỂ BIẾT NÓ LÀ AI.**
  Đàm: *"game hoá lên… đột phá hơn"*. Cho tới trước Phase này, thành phố 3D là một BỨC TRANH —
  kéo xoay được, đẹp, nhưng không chạm được vào bất cứ thứ gì. Nay chạm vào một căn nhà thì nó tự
  nói tên · loại · độ hiếm · cấp · **đặc quyền nó đang mang lại**; chạm vào giàn giáo thì nói
  **còn mấy phiên nữa** và **sẽ mở khoá gì**. Chạm ra chỗ trống thì thẻ tự đóng.
  - ⚠️ **KHÔNG dùng `Raycaster.intersectObjects` của three.js, và đây là quyết định đáng nhớ
    nhất.** Cả thành phố được gộp vào ĐÚNG MỘT khối hình học để chỉ tốn một lệnh vẽ — ném tia vào
    khối đó thì chỉ biết trúng "thành phố", không biết trúng CĂN NÀO. Muốn biết thì phải tách 75
    mesh riêng, tức là **vứt bỏ đúng cái tối ưu lớn nhất của cả bộ vẽ** để phục vụ một cú chạm mỗi
    vài phút. Cách đã chọn: `sceneGraph` xuất thêm `pickTargets` — **dữ liệu thuần**, mỗi công
    trình một hộp bao; **0 tam giác, 0 lệnh vẽ, không cần dọn ở `dispose()`**. Phần khó (tia cắt
    hộp kiểu "slab", chọn cái gần camera nhất) nằm ở `engine/city3d/pick.js`, THUẦN, 13 bài test
    chạy bằng `node --test`. `CityScene3D` chỉ làm đúng việc three buộc phải làm hộ: đổi toạ độ
    điểm ảnh thành một tia.
  - ⚠️ **Và KHÔNG chỉ cắt tia với mặt đất rồi quy ra ô lưới** (cách rẻ hơn, từng định làm): cảnh
    nhìn xiên, nên chạm vào NÓC một toà tháp thì tia đi tiếp và cắt mặt đất ở tận ô phía SAU nó.
    Càng nhà cao càng lệch. Hộp bao đúng với cả nhà cao lẫn nhà thấp.
  - ⚠️ **`TAP_SLOP = 8` điểm ảnh — đừng để 0.** Không ai chạm màn hình cảm ứng mà giữ yên tuyệt
    đối được; ngón tay luôn trượt vài điểm ảnh khi nhấc lên. Để 0 thì trên iPhone gần như KHÔNG
    BAO GIỜ chạm trúng, còn trên máy tính (chuột đứng yên thật) lại chạy tốt — **đúng kiểu lỗi chỉ
    Đàm gặp còn người viết code thì không**. Và phải đo khoảng cách XA NHẤT đã rời khỏi điểm đặt
    tay, chứ không đo lúc nhấc tay: kéo xoay một vòng rồi thả về chỗ cũ vẫn là một cú KÉO.
    Đã kiểm thật: kéo 150px → không mở thẻ · nhích 4px → vẫn mở thẻ · chạm 3/3 lần đều đúng.
  - **Lớp nền trang chủ KHÔNG chạm được** (hai lớp chặn + test): một thẻ thông tin bật lên sau
    lưng đồng hồ đếm ngược vì lỡ chạm là đúng thứ phá mất sự yên tĩnh mà màn hình đó tồn tại để
    giữ. Thẻ nổi cũng phải `pointer-events-none` ở lớp bọc + `pointer-events-auto` ở chính thẻ —
    thiếu là cả dải trống hai bên thẻ nuốt mất thao tác kéo xoay (đã có test khoá).
  - **Dòng trong danh sách bên dưới được tô sáng theo lựa chọn** — nếu không, chạm vào một khối
    nhà xong Đàm vẫn không biết nó ứng với dòng nào; nối lại thì hình và chữ thành CÙNG một thứ
    nhìn theo hai cách.
  - **Bài học công cụ**: `--window-size=390,844` của headless Chromium **KHÔNG** cho ra khung
    390px — headless kẹp cửa sổ ở tối thiểu 500px, đo mới biết. Nghĩa là mọi ảnh chụp "iPhone"
    trước đó đều rộng hơn máy thật 110px, đúng quãng làm một bố cục chật trông thoải mái. Phải
    dùng `Emulation.setDeviceMetricsOverride` qua CDP. Đo lại ở 390px thật: **không tràn ngang**
    (`scrollWidth === clientWidth === 390`), thẻ thông tin vừa khung.
  - Test **449 xanh** (thêm 15 bài), lint sạch, build xanh, `vendor-three` vẫn 131 KB gzip.

- **2026-08-12 (Phase 3J)** — **THANH CHUYỂN KỶ TỰ KÉO KỶ ĐANG XEM VÀO TẦM MẮT.**
  Một lỗi *chỉ lộ ra khi chơi lâu*, nên gần như không thể bắt bằng mắt lúc đang làm: các kỷ đã đi
  qua xếp TRƯỚC kỷ hiện tại trong thanh cuộn ngang, nên càng nhiều kỷ thì cái nút DUY NHẤT Đàm
  quan tâm càng bị đẩy ra ngoài màn hình. **Đo trên bản build thật ở kỷ 7**: nội dung 999px trong
  khung 952px ⇒ nút "Kỷ 7 · đang xây" cụt mất 47px ở MỌI lần mở tab; tới kỷ 15 thì khuất hẳn, mở
  tab lên chỉ thấy một dãy "thất truyền" xám.
  - **Hai cái bẫy đã dẫm phải trong lúc sửa, cả hai đều "chạy thử thấy đúng":**
    (a) `scrollIntoView` kéo luôn cả khung cha ⇒ mở tab thì trang tự nhảy xuống giữa chừng — phải
    tự tính `scrollLeft` của riêng thanh này. (b) `offsetLeft` tính từ `offsetParent`, mà thanh này
    `position: static` nên offsetParent là một khung ở tận ngoài: số đo ra **1151 trong khi toàn bộ
    nội dung thanh chỉ rộng 999**. Ở kỷ hiện tại (nút cuối) sai số đó bị kẹp về đúng mép phải nên
    trông vẫn đúng — **thử ở kỷ hiện tại sẽ KHÔNG thấy sai**, chỉ các kỷ giữa mới cuộn quá tay.
    Phải đo bằng `getBoundingClientRect`.
  - ⚠️ **Bài học lớn nhất: căn một lần là không đủ.** Bản vá đầu tiên đã đúng công thức mà vẫn
    KHÔNG chạy — vì lần chạy đầu rơi vào lúc font riêng của skin chưa nạp xong, các nút còn hẹp,
    thanh chưa tràn khỏi khung nên `max = 0` và hàm thoát ra. Font nạp xong thì chữ nở ra, thanh
    mới tràn — lúc đó không còn ai gọi lại. Phải gắn `ResizeObserver`. **Chỉ phát hiện được nhờ đo
    thẳng trên trang thật** (`scrollLeft` vẫn bằng 0 sau khi đã build và deploy code đúng) — nhìn
    code thì bản vá đầu tiên hoàn toàn hợp lý.
  - Test khoá cả 5 điều trên (`cityRenderers.test.js`), **đã kiểm chứng nó ĐỎ thật** khi đổi ngược
    về `offsetLeft`. Thêm helper `codeOnly()` bỏ chú thích trước khi so — dự án này viết chú thích
    dài và hay giải thích ngay tại chỗ *vì sao KHÔNG dùng* thứ bị cấm, nên so trên nguyên văn file
    thì chính lời giải thích làm test đỏ (đã dính đúng một lần), và người sửa sẽ bị dụ đi xoá chú
    thích thay vì xoá lỗi.
  - Test **434 xanh**, lint sạch, build xanh.

- **2026-08-12 (Phase 3I)** — **BẢNG "ĐANG XÂY": CÒN BAO XA, VÀ ĐI TỚI ĐÓ ĐỂ LÀM GÌ.**
  Phase 3H dựng được giàn giáo trong cảnh, nhưng nhìn giàn giáo thì Đàm chỉ biết "chỗ này sắp có
  nhà" — đẹp, mà không hành động được. Nay dưới cảnh có một bảng liệt kê công trình đang xây, mỗi
  dòng nói **còn mấy phiên** + thanh tiến độ + **mở khoá đặc quyền gì**.
  - **Nói bằng SỐ PHIÊN, không phải phần trăm.** "Đã xong 67%" nghe thì chính xác mà chẳng bảo anh
    phải làm gì; "còn 2 phiên" là một mục tiêu cho chiều nay. Kẹp ở engine (`remaining` luôn nằm
    trong `[0, total]`) để dữ liệu lệch một nhịp không rò ra màn hình thành "còn 99 phiên".
  - **Dòng "Mở khoá: …" là nửa còn lại của câu.** Số phiên trả lời CÒN BAO XA; không có nhãn phần
    thưởng thì vẫn thiếu ĐI TỚI ĐÓ ĐỂ LÀM GÌ, và thanh tiến độ chỉ còn là một thanh tiến độ. Lấy
    `perk.label` (ngắn) chứ không lấy `perk.summary` (dài cả câu, nhét vào một dòng sẽ tràn). Có
    test quét đủ **75 công trình của 15 kỷ**, khoá luôn cả độ dài ≤40 ký tự — nếu ai đó đổi
    `perk.label` thành tên khác trong `constants.js` thì `reward` sẽ lặng lẽ thành `null` ở CẢ 75
    công trình mà không bài test nào kêu (lại đúng cái bẫy `?? []` của Phase 3H).
  - **Gần xong nhất nằm trên đầu**, in đậm + số phiên tô màu kỷ. ⚠️ Sắp xếp bằng một BẢN SAO
    (`buildQueueOrder`) — `layout.scaffolds` đã được sắp theo chiều sâu đẳng cự cho bộ vẽ, đảo tại
    chỗ sẽ làm nhà đằng trước che nhà đằng sau. Hoà nhau thì so `bpId` để danh sách không tự nhảy
    chỗ giữa hai lần vẽ.
  - **Hai chỗ khác cùng sửa cho khỏi nói dối**: ô số liệu thứ tư đổi từ "Cảnh vật" (bao nhiêu cái
    cây thì cũng thế) sang "Đang xây" khi có công trường; và trạng thái "Bãi đất trống" nay chỉ
    hiện khi **vừa không có công trình vừa không có công trường** — trước đó lần đầu Đàm khởi công,
    mở tab lên xem thành quả thì nhận đúng chữ "chưa có gì".
  - **Công cụ mới `scratchpad/shoot.mjs`** (lái Chromium qua CDP): bấm được vào tab rồi mới chụp,
    và cuộn tới đúng chữ cần soi (`--tab city --queue --find "Đang xây" --phone/--dark`). Bản cũ
    `shoot-home.mjs` dùng cờ `--screenshot` nên chỉ chụp được trang đầu — mà tab của app là
    `useState` trong React, **không seed qua localStorage được**. ⚠️ Vẫn giữ nguyên chặn Supabase ở
    tầng phân giải tên miền. Đã soi tận mắt: sáng/tối/iPhone 390px đều gọn.
  - Test **433 xanh** (thêm 2 bài), lint sạch, build xanh.

- **2026-08-12 (Phase 3H)** — **THÀNH PHỐ LỚN LÊN SAU MỖI PHIÊN, KHÔNG PHẢI MỖI TUẦN.**
  Đàm: *"game hoá lên… không bị chán"*. Đây là chỗ chữ "chán" có một nguyên nhân đo được, không
  phải cảm giác: trước tính năng này thành phố **chỉ đổi khi một công trình HOÀN THÀNH** — mà công
  trình rẻ nhất ngốn 4 phiên, đắt nhất 11 phiên. Nghĩa là Đàm hoàn toàn có thể làm việc cả tuần
  liền và thành phố **không nhúc nhích một pixel nào**. Vòng lặp "làm việc → thấy thành phố lớn
  lên" đứt đúng ở quãng dài nhất, tức là đúng lúc cần nó nhất.
  Nay công trình đang xây hiện thành **giàn giáo gỗ**, mỗi phiên xong lại mọc cao thêm một nấc và
  thêm một tầng giằng. Đặt ở lớp nền trang chủ (Phase 3F) thì nấc vừa mọc nằm **đúng trong tầm mắt
  lúc Đàm bấm Bắt đầu phiên kế tiếp**.
  - ⚠️ **Hoá ra 90% đã có sẵn từ trước mà không ai nối lại.** `craftingQueue` đã lưu
    `{bpId, sessionsRemaining}` từ lâu; `BUILDING_EFFECTS[].sessionsToComplete` đã có; `sceneGraph`
    đã đọc `layout.scaffolds`; `buildScaffoldSpec` đã viết xong và đã có test. Thiếu **đúng một
    thứ**: `computeCityLayout` chưa bao giờ sinh ra `scaffolds`, nên `layout.scaffolds ?? []` luôn
    rỗng và cả tính năng im lặng không tồn tại. Bài học: `?? []` là chỗ một tính năng chết mà
    không ai nhận ra — nó không hỏng, nó chỉ *không có gì*.
  - **Nhận thẳng shape của `craftingQueue`**, không bắt bên gọi tự tính `progress`: tri thức "còn
    mấy phiên trên tổng bao nhiêu" chỉ nên nằm một chỗ, nếu không tab Thành Phố và lớp nền trang
    chủ sẽ có ngày hiện hai độ cao khác nhau cho cùng một công trình.
  - **Bảo tàng KHÔNG có giàn giáo** — thành phố đã niêm phong thì chẳng còn ai đang xây gì; dựng
    giàn giáo lên đó là nói dối về quá khứ (bất biến "bảo tàng bất động", ADR-007). Ba lớp chặn:
    store đã gạn theo kỷ, `CityView` chỉ truyền `pending` khi đang xem kỷ hiện tại, và
    `computeCityLayout` lọc theo kỷ lần nữa.
  - **Bộ vẽ 2D cũng có giàn giáo.** Hai bộ vẽ được phép khác nhau về ĐỘ ĐẸP, không được khác nhau
    về NỘI DUNG — nếu không thì đúng người dùng máy yếu nhất (phải lùi về 2D) là người mất vòng
    lặp động viên, trong khi họ chẳng làm gì sai.
  - **Sửa hình giàn giáo sau khi nhìn ảnh chụp**: bản đầu chỉ có giằng ở hai mặt đối nhau và ảnh
    chụp ra thứ trông y như **một cái cổng dựng giữa đồng** — mắt không khép được khối. Thêm hai
    thanh xoay 90° (`ry`) thành cái lồng, cho cột luôn cao hơn phần đã xây (giàn giáo thật bao giờ
    cũng vượt lên trên chỗ thợ đang làm, và nó cho thấy công trình SẼ cao tới đâu), thêm đống vật
    liệu dưới chân vơi dần khi sắp xong.
  - **Test**: 430 bài (+5), có bài khoá **"không truyền `pending` ⇒ bố cục giống hệt TỪNG BYTE"** —
    rủi ro #31 của kế hoạch, vì đây là hàm quyết định vị trí MỌI THỨ và ADR-007 hứa bảo tàng bất
    động. Cùng bài khoá ca "vừa xây xong nhưng hàng đợi chưa kịp dọn" (xảy ra thật, một nhịp sau
    phiên hoàn thành) — nếu không, căn nhà mới toanh sẽ mọc lên trong lòng một bộ giàn giáo đúng
    lúc đáng ăn mừng nhất.

- **2026-08-12 (công cụ)** — **`scripts/png-probe.mjs`: ĐO màu điểm ảnh thật trên ảnh đã chụp.**
  Tự giải mã PNG bằng `zlib` có sẵn của Node, KHÔNG thêm dependency. Ra đời vì một nghi ngờ đúng:
  **bảng màu và màu hiện lên màn hình là hai thứ khác nhau**, giữa chúng còn cường độ đèn (nắng
  2,15 — nhân màu gốc lên hơn hai lần), phép kẹp kênh khi tràn 255, rồi tone mapping.
  ⚠️ **Số đo cụ thể, và nó là một giới hạn phải nhớ**: mái kỷ 6 trong bảng màu là `#77425a`
  (độ tươi 0,29) nhưng **trên màn hình đo được `#5a1733` — độ tươi 0,59, tức GẤP ĐÔI**. Mặt phẳng
  (mặt đất) thì khớp gần như hoàn hảo (`#98957b` → `#8e896d`); chênh lệch nằm ở các mặt DỐC như
  mái, vì chúng nhận ít sáng hơn nhiều.
  ⇒ **Các bài test mỹ thuật ở `palette3d.test.js` canh ĐẦU VÀO, không chứng minh được thứ Đàm nhìn
  thấy.** Chúng vẫn đáng giá (bắt được cả 6 lỗi Phase 3G), nhưng đừng đọc chúng như một lời bảo
  đảm về màn hình. Muốn chắc thì chụp rồi `node scripts/png-probe.mjs <ảnh> --top 10`.

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
