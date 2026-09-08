# NHẬT KÝ VÒNG 20 → 32, VÀ VÒNG 37 + 40 (tách khỏi START_HERE.md ngày 2026-09-06; vòng 37 và 40 thêm ngày 2026-09-08)

> Chuyển ra đây để `START_HERE.md` về đúng lời hứa của chính nó ("file ngắn, đọc mỗi phiên").
> Nguyên văn, không xoá chữ nào. `grep` khi cần truy một vòng cũ.

---

- **Loop — ROUND 40 (2026-09-08): THINGS THAT HAPPEN AND VANISH (ADR-080).** Order: fill the
  gap round 39 exposed, with a static budget of ZERO — only things that happen and are gone. Session
  beats (`engine/sessionBeats.js`: settled · halfway · final stretch · last minute — an 8-second whisper
  in the ring label + `focus/BeatRipple.jsx`, from elapsed time, background-safe, no new sound); the glow
  warms with progress; the tab title carries a phase glyph ○ ◔ ◑ ◕ ● (☕/⏰ on a break); break beats
  (stand up · water · come back). Tiered ending (`shared/RewardBurst.jsx`: brick dust · building ring +
  confetti · rare full-screen; bricks DROP in `BrickRow`). Lucky brick (`rollLuckyBrick`, 12 %, ≥ 15 min,
  never negative, `pendingReward.luckyBrickId`, the card names the double brick first). Leftovers: reward
  tiers in the three-colour family, era chips wrap, era colours on the City tab kept. Round-39 counts
  unchanged (1 · 2 · 3 · 0). Inspect: `--preview loot-lucky --card project` · `--preview loot-built --card
  project` · `--preview loot-max --card level`; a beat: seed `timerSession.startedAt` so elapsed = 751 s
  (`tools/timerFixtures.mjs <base> <run> <break> 751`) and shoot with `--settle 600`.

---

- **Loop — ROUND 37 (2026-09-06): A SESSION ALWAYS LAYS A BRICK (ADR-077).** Order: *"Build
  lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào UX/UI. TOÀN QUYỀN."* Seven streams, all
  on `main`. (1) **The brick**: `engine/sessionBrick.js` names the building THIS session pushes; the
  strip above the ring (`focus/SessionBrickStrip.jsx`, replacing the milestone toast + combo badges +
  city tease) fills the current brick with the timer; the ending's project card lands it (`BrickRow`,
  `playBrickLaid`); an empty queue is auto-filled before the queue advances (`autoQueueSessionProject`)
  — changeable on the Build screen. (2) **Stats never asks for homework**: the three "strongest" lines
  rank on the WHOLE-SESSION rate (`started`/`whole` in `buildFocusProfile`), goal reviews only sharpen
  it; Monday 04:00 compares last full week vs the week before (`WEEK_SCOPE`); the session goal is
  OPTIONAL (chips in the goal card, same task type first). (3) **Sound**: last-minute bell ·
  break-over cue · brick landing; dead tick + 5-minute chime deleted; no haptics (iOS has no API).
  (4) `PomodoroEngine.jsx` 2,958 → 1,922 (`shared/ActionButton.jsx` = the #86 door, seven controls in
  `components/focus/`). (5) `gameStore.js` 5,413 → 4,696 (`engine/missions.js` + `engine/weeklyChain.js`
  + `engine/seededRng.js`; live mission tick = reload path; `forgiveness` removed). (6) **Weekly report
  dialog deleted** — Stats answers it; the unseen dot sits on the Thống kê tab. (7) First open: no
  overlay; Focus + City name the first project. ⚠️ Lessons: *the shot tool's default seed is era 7 with
  5/5 built — a fresh save needs `--fixture` with `{"state":{},"version":4}`*; *`$SP` does not survive
  between Bash calls*. Inspect: `--fixture <fx> --tab "Tập trung"` · `--preview "loot&dc-preview-card=project"`.
- **Stats + economy — ROUND 36 (2026-09-06): STATS ANSWER, THEY DO NOT PRESENT; #99 CLOSED
  (ADR-071).** Order: *"build lớn · simplify mạnh · vui hơn · UX/UI · TOÀN QUYỀN"*.
  (1) `StatsDashboard.jsx` **3,792 → 294 lines**: opening it shows three cards — *am I improving?*
  (this week vs the SAME span last week, 7 column pairs) · *when am I strongest?* (hour · length ·
  task type, each line carrying its sample size) · *what next?* (ONE button «Bắt đầu N phút · type»
  jumping straight to Focus). The «Điều đáng chú ý» strip stays; Journal · Notes fold below
  (`StatsJournal.jsx` · `StatsNotes.jsx`). Numbers come from `engine/statsAnswers.js` (pure, composes
  `coachIntel`/`gameMath`). Deleted: 3 tabs · 6 periods · charts · heat map · `statsPeriod.js` ·
  `statsFocus.js`. (2) **#99 closed**: resources · RP · refining stopped accruing (keys stay in the
  save — no migration), cancelling a session neither deducts nor spends forgiveness,
  `cancelCrafting` refunds nothing, the «Kiếm N RP» quest is gone, cards dropped
  «Rương Lớn/+resources/+RP». (3) Era-crisis text in saves is re-read from `ERA_CRISES` on load
  (`withCanonicalCrisisText`) — general law: *saves store ids + numbers, text comes from the table*.
  ⚠️ Lesson: *the three "strongest" lines only have numbers when sessions SET A GOAL* — the 599-session
  fixture has no goals so all three were empty; the screen now says what to do instead of going quiet.
  Inspect: `node scripts/shot.mjs --phone --fixture <fx> --tab "Thống kê" --full`.
- 📚 **Rounds 20 → 35 moved to `docs/archive/START_HERE_LOG_2026-09-06.md`** (verbatim), together
  with the 3D city details (BSP skeleton · `reach` 0.8 · two-layer shadows · 15 eras/`country` ·
  12×12 grid · 3.2× perf headroom) — a finished black box is not worth paying tokens for every
  session. **Keep at most 3 rounds here**; a new round pushes the oldest down.
  Older rounds: `grep -n 'VÒNG 2[0-9]\|VÒNG 33\|ROUND 3[45]' docs/archive/START_HERE_LOG_2026-09-06.md`.

### UI invariants — read before touching the UI
⚠️ **Changing anything under `src/components/` or `src/store/uiSkins.js` means reading
[`docs/UI_INVARIANTS.md`](docs/UI_INVARIANTS.md) FIRST.** It holds the rules that are guarded by
tests: one shared reward card and exactly four rarity tiers · the no-exceptions interruption law
(`lastWeeklyReportDate` vs `…SeenDate`) · exactly three motion presets · 5 sidebar items / 4 iPhone
buttons + "Thêm" · 5 skins and the one-time migration that must never run again · the three-way
choice for notifying Đàm · the era-stage progress bar. They are not repeated here because a rule
stated twice drifts.

---

- **Trò chơi — VÒNG 32 (2026-09-05): ĐÓNG #43, VÀ TÌM RA NĂM BẢN CHÉP CỦA MỘT LỖI.**
  · **#43 ĐÓNG** — `src/engine/city3d/triangleBudget.test.js`: bảng 15 mốc tam giác riêng từng kỷ,
  đúng khuôn `drawCallBudget.test.js`, chạy **dưới 1 giây**, không cần Chromium/`three`. Neo vào
  `scene-tri.mjs` ở 4 kỷ (khớp từng đơn vị). Thử ngược: sửa MỘT dòng `crown` trong `roofStyle.js`
  — đúng loại thay đổi đã sinh ra mục nợ — thì ĐỎ ngay.
  · ⚠️ Chỗ khó mục nợ nêu (mặt đất/đường/chân trời) **không phải chỗ cần giải**: thứ đã trôi là
  khối `city`, còn nền là cố định — gộp vào chỉ pha loãng tín hiệu (`#22`).
  · Kèm: chú thích "bệ kè chỉ tốn 12 tam giác" sai từ Phase 8B (thật là **28**) — nhưng **đừng đọc
  ngược thành "12 đã chết"**: đếm đủ 27 bệ thì 26 ăn 28, **đúng một ăn 12**. Luật bệ kè có BỐN bản
  chép tay, nay gom về hai hàm thuần ở `parts.js`.
  · **NĂM BẢN CHÉP CỦA MỘT LỖI** (`type === 'wonder'` bị bỏ), trong bốn file: giá RP · giá tiến hoá
  di vật · phạt huỷ phiên · trần chuỗi · thưởng nhiệm vụ. Tất cả nay đọc chung
  `engine/wonderEffects.js`, có bài canh CẤU TRÚC `grep` cả bốn file. Một lệch THẬT đã vá: màn hình
  in giá tiến hoá 0 trong khi store trừ 1.
  · Nợ: **97 mục · 37 đã đóng · 60 còn mở**. Test **1.572 bài**.

- **Trò chơi — VÒNG 31 (2026-09-02, MỚI NHẤT): BỐN MÀN NGẮN ĐI 29–39%, và cả bốn theo CÙNG MỘT
  khuôn "LƯỚI + MỘT KHUNG CHI TIẾT".** Lệnh Đàm (lần thứ ba): *"Thay đổi lớn hơn nữa… đừng có quá
  đo tiểu tiết, nên thực hiện lớn rồi sửa khi tôi muốn sửa."*
  · **Kỹ năng** 2.231 → **1.957px**: danh sách một-nhánh-một-lúc → **BẢN ĐỒ 6×6** (cột = nhánh,
  hàng = độ sâu). Trước đây phải bấm qua sáu nhánh mới nhìn hết 36 kỹ năng.
  `shared/skillMatrix.js` + `SkillMatrix.jsx`.
  · **Công trình** 4.757 → **2.894px (−39%)**: công trình đã xây thành LƯỚI ô + một khung chi tiết;
  gỡ 3/5 chip luật RP (cả ba mở đầu bằng "có thể … HOẶC …" ⇒ không loại trừ khả năng nào ⇒ không
  mang tin); thẻ bản vẽ thôi chép 4 trường mà `BlueprintDetailPanel` đã in nguyên văn.
  `shared/buildingGrid.js` + `BuildingGrid.jsx`.
  · **Huy hiệu** 4.915 → **3.973px**: gấp lại 102 dấu tiến độ = 0. `shared/badgeGroups.js`.
  · **Tập trung** 2.509 → **1.783px (−29%)**: bảng thiết lập (~1.100px, mở sẵn mọi lần) gấp lại
  sau một dòng nói đủ ("25′ · nghỉ 5′/15′ · kỷ luật"). `pomodoroSetupSummary.js`.
  · ⚠️ **LUẬT CHUNG RÚT RA — "KHÔNG GIẤU, CHỈ GẤP".** Mỗi lần gấp một khối, dòng thay nó phải nói
  ĐỦ (đủ cần gạt / đủ con số còn lại). Gấp mà dòng thay thiếu một thứ thì đó là GIẤU, và người
  dùng phải mở ra mỗi lần để kiểm — lúc ấy còn tệ hơn không gấp.
  · Kèm một LỖI THẬT: dải mở đầu Hành trang bật màu nhấn chỉ vì `spChuaTieu > 0` rồi viết *"mở
  thêm một kỹ năng ngay bên dưới"*. Đo trên ván thật: **1 SP trong tay, ô rẻ nhất giá 3 SP** ⇒ nó
  rực lên và bảo người chơi làm một việc KHÔNG làm được. Nay `gap` hỏi đúng câu bản đồ trả lời.
  · **PHẦN 2 — BA LỖI THẬT CÙNG MỘT HỌ: "CÓ" ≠ "LÀM ĐƯỢC".** (1) dải Công trình đếm bản vẽ ĐÃ MỞ
  thay vì KHỞI CÔNG ĐƯỢC; (2) cái chuông/chấm/"việc tiếp theo" so SP với giá GỐC trong khi store
  trừ giá đã giảm nhờ di vật — sai đúng ở 6 kỹ năng Tinh Hoa; (3) giá RP nghiên cứu có BA bản chép
  tay, bản tầng giao diện thiếu kiểm `type === 'wonder'`. Gốc chung: **luật sống inline trong tầng
  giao diện nên tầng khác không thấy và tự nghĩ ra điều kiện lỏng hơn.** Ba module thuần dùng
  chung: `engine/craftReadiness.js` · `engine/wonderEffects.js` · `shared/skillMatrix.js`.
  · ⚠️ Phép thử ngược soi ra một điểm mù SẴN CÓ: bỏ hẳn phép kiểm nguyên liệu trong
  `listBuildableBlueprints` mà không bài nào đỏ. *Thử ngược không chỉ chứng minh bài MỚI có răng —
  nó soi ra bài CŨ đã mất răng.*
  · Nợ: **97 mục · 36 đã đóng · 61 còn mở** (~49 thuộc Thành Phố 3D). Test **1.565 bài**.

- **Trò chơi — VÒNG 29–30 (2026-09-02, mới nhất): DỌN NỢ — 32 → 35 mục đã đóng.**
  · Đóng **#92** (mã chết tầng giao diện) · **#5** (lệch mô tả↔hành vi, nay là một CỔNG chấm 310
  thành tích) · **#13**, **#7** (đã lỗi thời, chưa ai kiểm lại) · **#91** (test khoá con số thay vì
  khoá luật) · nửa gốc **#86** (84 chỗ chốt cứng màu nhấn → token, đúng ở cả 5 skin) · **#93** đánh
  dấu lại là QUYẾT ĐỊNH chứ không phải nợ.
  · ⚠️⚠️ **BÀI HỌC ĐẮT NHẤT TỪ TRƯỚC TỚI NAY — BA CỔNG CÙNG MÙ.** Bật `no-unused-vars` cho `.jsx`
  ra 54 báo cáo; tôi tin cả 54 và đi gỡ. Kết quả: **lint sạch · build sạch · 1.524 bài test XANH ·
  và app ra thẳng "RENDER RECOVERY: motion is not defined"**. ESLint lõi KHÔNG coi `<motion.div>`
  là một lần DÙNG biến `motion` ⇒ **27/54 là báo nhầm**, nhắm đúng vào những import đang sống.
  ⇒ **XOÁ MÃ HÀNG LOẠT THÌ PHẢI CHỤP LẠI APP TRƯỚC KHI COMMIT** — lint/build/test không thay được
  một tấm ảnh. Mắt xích thiếu là `react/jsx-uses-vars` (nay đã cài); gỡ plugin thì PHẢI tắt lại luật.
  · ⚠️ **#97 — viết bản vá rồi TỰ HOÀN TÁC.** Quét cột chuyển vị báo oan ngay trên đối chứng có
  sẵn, vì ảnh thật đầy mép dọc. *Chuyển vị một phép đo không tạo ra một phép đo mới.*
  · Nợ: **97 mục · 35 đã đóng · 62 còn mở** (~49 thuộc Thành Phố 3D). Test **1530 bài**.

- **Trò chơi — VÒNG 28 (2026-09-02, mới nhất): HÀNH TRANG — BỚT TRƯỚC, RỒI MỚI DỰNG.**
  · ⚠️ **BÀI HỌC CHÍNH, và nó chỉ vào chính bản vá vòng 27:** Đàm nói **ba lần** rằng Hành trang
  "chưa thấy thay đổi gì". Lý do là vòng 27 tôi THÊM một dải hero lên trên một thẻ đã nói cùng nội
  dung, nên màn hình **dài thêm mà không mới thêm**. ⇒ ***Thêm mà không bớt thì không phải thiết
  kế lại.*** Trước khi thêm bất cứ khối nào vào một màn, hỏi *"khối này nói điều gì mà màn hình
  chưa nói?"* — không trả lời được thì đừng thêm.
  · **Huy hiệu:** 360 dấu nay là **một LƯỚI ô vuông** (`shared/BadgeGrid.jsx`) thay cho hai danh
  sách chữ. Ô chưa đạt để xám kèm vòng tiến độ — bộ sưu tập chỉ có nghĩa khi thấy được phần còn
  thiếu. **Bỏ phân trang**: xem hết là điểm chính. Bộ lọc thu gọn (lưới từng bắt đầu ở y=1398, nay
  y=589). `Achievements.jsx` 977 → 745 dòng.
  · **Công trình:** gỡ tiêu đề "Xưởng xây dựng" (chỗ thứ BA gọi tên màn hình) + thu gọn sáu chip
  thông số vào một `<details>`.
  · Test **1524 bài** (1523 pass · 0 fail · 1 skipped).

- **Trò chơi — VÒNG 27 (2026-09-02, mới nhất): HÀNH TRANG CÓ BẢN SẮC RIÊNG · ĐÓNG 3 MỤC NỢ.**
  Lệnh Đàm: *"khắc phục toàn bộ tech_debt và sửa lỗi bug… thay đổi lớn hơn nữa, UX/UI và mọi thứ ở
  hành trang vẫn chưa thấy thay đổi gì… đừng có quá đo tiểu tiết, nên thực hiện lớn rồi sửa khi mà
  tôi muốn sửa"*.
  · **Hành trang:** mỗi tab mở đầu bằng một **dải hero có màu** (`shared/InventoryHero.jsx` +
  `inventoryHero.js`) — một con số to + đúng một việc nên làm tiếp + thanh tiến độ. Vòng 24 đổi
  CẤU TRÚC nhưng không đổi phần NHÌN, và Đàm nói đúng là mở ra chẳng thấy gì mới.
  · **Đóng `TECH_DEBT #94`** (độ trễ vào nghỉ đi THEO việc có lễ mừng: 3.200ms/500ms — ~82% số
  phiên từng chờ 3,2 giây trước một màn hình trống) · **#9** (localStorage đầy: dọn khoá cũ rồi
  thử lại, hỏng tiếp thì BÁO chứ không nuốt) · **phần lớn #3** (ba kỹ năng Thăng Hoa giá 16 SP có
  mô tả hứa hẹn mà chưa bao giờ được nối dây — nay có thật; vế "ngưỡng kỷ nguyên giảm 20%" đã được
  GỠ KHỎI MÔ TẢ thay vì để app hứa điều nó không làm).
  · **Giảm nhẹ #14:** thẻ thưởng của phiên thường nay nói TIẾN ĐỘ (*"Cảng Biển Lớn · còn 4 phiên"*)
  thay vì hai con số vô nghĩa. Phần gốc (ba hằng số + lọc theo kỷ) vẫn Open — nó đòi sửa
  `BUILDING_ZONES`/`placeBuilding`, tức đụng ADR-007 và Thành Phố.
  · ⚠️ **BUG IM LẶNG CẮN BA LẦN trong một phiên:** chuỗi tra tên bản vẽ chép ra ba nơi, sai cả ba
  kiểu khác nhau (`.name` — trường không tồn tại · `.find` trên một OBJECT các mảng ·
  `BUILDING_EFFECTS[id].label` — **0/75 mục có `label`**, nhánh chết ngay từ lúc viết). Cả ba im
  lặng vì `??` nuốt gọn và câu hỏng đọc lên vẫn xuôi tai. ⇒ **Tên bản vẽ chỉ được tra bằng
  `blueprintLabel()`** (`engine/craftProgress.js`), nguồn duy nhất là `BLUEPRINT_CATALOG`.
  · Test **1524 bài** (1523 pass · 0 fail · 1 skipped).

- **Trò chơi — VÒNG 26 (2026-09-02, mới nhất): GỠ ĐIỂM MÙ "MÀN SAU KHI KẾT THÚC PHIÊN", RỒI
  LÀM LẠI NÓ.** Đây chính là việc mà vòng 25 đề xuất làm tiếp, và nó mở khoá đúng như dự đoán.
  · **Cách soi từ nay:** `node scripts/shot.mjs --phone --fixture <f.json> --preview <cảnh>` —
  cảnh ở `src/dev/previewStage.js` (`loot` · `loot-max` · `era` · `level` · `toasts`). An toàn vì
  mọi hộp thoại sau phiên CHỈ ĐỌC `ui`, và `ui` nằm ngoài `partialize` ⇒ không ghi localStorage,
  không lên Supabase, không bắt đầu phiên nào. **KHÔNG được cho `ui` vào `partialize`** — cả lời
  hứa an toàn dựa vào việc nó nằm ngoài (có test canh).
  · ⚠️ **LỜI NÓI DỐI THỨ NĂM CỦA `shot.mjs`: một tấm ảnh KHÔNG bắt được thứ chỉ sống 4 giây.**
  Thẻ thưởng hiện ở giây **13,5** và tắt ở giây **17,7**; `--settle` 0,4 → 14 giây đều ra ảnh
  sạch + probe `false` + không lỗi nào, tức đọc y hệt *"tính năng không chạy"* (tôi suýt kết luận
  đúng như vậy). Nguyên nhân: cổng "đợi DOM đứng yên" chạy SAU `--settle` và chỉ nhả khi mọi thứ
  thôi nhúc nhích = khi thẻ đã tắt. ⇒ **Soi thứ thoáng qua thì PHẢI dùng `--watch "<chuỗi>"`**
  (ghi lại mọi lần hiện/tắt + chụp đúng lúc đang hiện), đừng chỉnh `--settle`.
  · **Ba khuyết tật đã sửa, cả ba đo được:** di vật **huyền thoại** từng khác phiên thường đúng
  **3px vệt màu + mấy chấm + một chữ** → nay nền pha màu + vệt dày dần theo bậc (chỉ `hiem`/
  `huyenThoai`; `thuong`/`tot` không đổi một điểm ảnh) · chữ **"THƯỜNG"** từng đóng dấu lên đúng
  chiến thắng vừa giành được (mà `thuong` là bậc MẶC ĐỊNH ⇒ nó mang sự VẮNG tin) → bậc thấp nhất
  không dán nhãn · tin **kỷ nguyên mới** (hiếm nhất game) từng nằm trong thẻ 299px ở **đáy** một
  trang cao 3.201px → nay **nhan đề** nói ngay (kỷ nguyên > lên cấp > xong phiên), còn thẻ ăn mừng
  giai đoạn 6 GIỮ NGUYÊN.
  · Chữ trong màn **327 → 267** (−18%). Chiều cao gần như không đổi — phần còn lại là NỘI DUNG
  phần thưởng thật, cắt tiếp là cắt vào dopamine chứ không phải cắt mỡ.
  · Test **1512 bài** (1511 pass · 0 fail · 1 skipped).

- **Trò chơi — VÒNG 25 (2026-09-02, mới nhất): MÀN "TẬP TRUNG" + "THỐNG KÊ" — gỡ bốn chỗ app
  NÓI DỐI HOẶC IM LẶNG.** Nốt phần còn lại của lệnh vòng 24 (*"tổng đại tu cho đơn giản, dễ hiểu
  hơn về UX/UI của mục Tập Trung, Hành Trang và Thống Kê"*).
  · **CHẨN ĐOÁN GỐC:** màn Tập trung KHÔNG thiếu tính năng — nó có bốn thứ **đã viết xong mà không
  tới được Đàm**, mỗi thứ im lặng một kiểu, nên không thứ nào lộ ra ba thứ kia.
  · **Số đo:** bắt đầu một phiên **4 thao tác → 2 chạm ngay trên nếp gấp** (khoảng hở tới thanh
  điều hướng **76px**) · huy hiệu mốc 25/50/75% từ **không thể hiện** (cổng `!useMinimalFocusStage`
  luôn sai lúc phiên chạy ⇒ app tính mốc rồi vứt đi) **→ hiện thật** · nhãn vòng đồng hồ **"SẴN
  SÀNG" → "Chờ mục tiêu"** khi app đang từ chối bắt đầu · **mục tiêu phiên nay còn nhìn thấy trong
  lúc phiên chạy** (trước đó mọi chỗ render đều gác `isIdle` ⇒ bắt gõ ≥10 ký tự rồi giấu 25 phút) ·
  Thống kê: **1/5 tab và 3/6 kỳ hạn** từng nằm ngoài màn hình sau cuộn ngang **→ hiện đủ**.
  · ⚠️ **ĐÁNG NHỚ NHẤT — HẾT GIỜ NGHỈ CÂM TRÊN CẢ BA KÊNH CÙNG LÚC** (tiếng · thông báo trình duyệt
  · Web Push), nên **không kênh nào lộ ra rằng hai kênh kia cũng câm**. Đây là lần thứ BA tìm thấy
  một hàm viết xong với **0 nơi gọi** (`playMilestone` vòng 22 · `playBreakStart` vòng 23 ·
  `notifyBreakOver` vòng 25) ⇒ đã dựng `notificationReach.test.js` để lớp THÔNG BÁO cũng được ĐẾM
  như lớp TIẾNG. `notifyFocusComplete`/`notifyDisaster` nằm trong danh sách miễn trừ **tường minh
  kèm lý do đo được**, không phải bị bỏ quên.
  · ⚠️ **MÌN CHO PHIÊN SAU:** đây là lần đầu `soundEngine`/`notificationManager` bị chạm từ một
  ĐỒNG HỒ (`useGameLoop`, mỗi giây) chứ không từ một cú bấm nút. Bài test node nào tick giờ nghỉ sẽ
  nổ `ReferenceError: window is not defined` — chữa bằng cách đặt `.enabled = false` TRONG BÀI TEST,
  **không** đi rào hai engine dùng chung (rào sai một chỗ là câm tiếng thật của Đàm trên production).
  · Test **1499 bài** (1498 pass · 0 fail · 1 skipped).

- **Trò chơi — VÒNG 24 (2026-09-01): TAB "HÀNH TRANG" — 6 màn sau 3 tầng tab → 3 màn,
  1 hàng tab.** Lệnh Đàm: *"làm lại đơn giản hơn… phải DỄ HIỂU, DỄ CHƠI… có thể đập đi xây lại"*.
  Khảo sát bằng 12 nhánh soi song song, luật *không số đo = không tính*, rồi sửa TUẦN TỰ.
  · **CHẨN ĐOÁN GỐC:** Hành trang là **bảo tàng của những thứ Đàm KHÔNG có** — nó trả lời *"tôi
  đang có gì"*, một câu không có tính cấp bách, trong khi vòng lặp gây nghiện cần *"tôi SẮP có gì,
  còn bao xa"*.
  · **Số đo:** tầng tab **3 → 1** · màn con **6 → 3** · hàng tab **246px (29,1% màn hình) → 38px**
  · tổng chiều dài **115.864px → 17.754px** · màn không có nút nào **2/6 → 0/3** · thành tích hiện
  tiến độ **0/360 → 310/360**.
  · Ba màn gom theo CÂU HỎI, không theo loại dữ liệu: **Kỹ năng · Công trình** (Bản vẽ+Xưởng) **·
  Huy hiệu** (Thành tích+Di vật). ⚠️ **Ba id tab con GIỮ NGUYÊN** (`skills`/`collection`/
  `achievements`) nên thông báo đã lưu vẫn trúng; `collectionTab` cũ được DỊCH chứ không bỏ qua
  (`relics` → Huy hiệu, `history` → Thống kê).
  · **Xoá tab "Lịch sử"**: 98.568px = 117 màn hình, 4.362 con số, **0 nút**, **0 thông báo trỏ tới**.
  · **«Sắp đạt»** ba mục gần nhất lên nếp gấp Huy hiệu; «Chưa đạt» từ y=7.040 → **y=2.120** và sắp
  theo tiến độ (mục gần nhất từng nằm ở y=9.606 = 11,4 màn hình).
  · **Di vật nói thật**: khủng hoảng chỉ nổ MỘT LẦN lúc vượt mốc EP ⇒ **5/12 dòng đã lỡ vĩnh viễn**
  mà màn hình vẫn mời "chinh phục"; nay tách hai nhóm + hiện phần thưởng thật thay "???" + đếm
  ngược đọc `triggerEP` (trước đó **0 component** đọc con số ấy).
  · **Kỹ năng thôi nói dối**: **21/32 nút (66%) hiện giá thấp hơn giá thật, tệ nhất 2,3 lần**.
  ⚠️ **BÀI HỌC LỚN NHẤT — MỘT CÁCH LÀM CHẠY ĐÚNG DƯỚI `node` VÀ HỎNG CÂM TRÊN BẢN THẬT:** đọc
  ngưỡng thành tích bằng regex trên mã nguồn `check` đúng 100% khi đo và **sai 100% trên production**
  (Vite rút gọn `s.sessionsCompleted` → `s.a`). Ngưỡng phải là **DỮ LIỆU**, `check` sinh ra từ nó.
  ⚠️ **KHÔNG làm** hai việc khảo sát đề nghị, cả hai bị bác BẰNG SỐ: đưa Di vật lên đầu (khủng
  hoảng kế còn **114 phiên** — không phải "việc tiếp theo") · thêm khối "Làm được ngay" (câu ấy đã
  có ở màn Tập trung; thứ thiếu là **đứng đúng chỗ**, nên nay bấm "Hành trang" rơi vào tab CÓ việc,
  không in thêm một chữ).
  ⚠️ **`TECH_DEBT #96` — tiến hoá di vật là CƠ CHẾ CHẾT**: tiêu tinh luyện của kỷ ĐÃ QUA, mà tinh
  luyện chỉ rơi vào kỷ đang chơi ⇒ 3/3 nút "Chưa đủ tài nguyên" vĩnh viễn. **Đàm chọn.**
- **Trò chơi — VÒNG 23 (2026-09-01): "hứng thú hơn, đơn giản hơn, NHƯNG KHÔNG LẠM PHÁT
  THÔNG TIN".** Vế cuối là vế MỚI và nó **đảo ngược phản xạ mặc định**: cách rẻ nhất để một màn
  hình "vui hơn" luôn là thêm huy hiệu / thêm chữ / thêm thẻ — đúng thứ bị cấm. Nên cả vòng phải
  trả lời bằng phép **TRỪ**: 9 việc, 27 file, **+1.006 / −1.248 dòng (ròng −242)**.
  · ⚠️ **VÁ HAI LỖI THẬT ĐANG CHẠY TRÊN PRODUCTION.** (1) **Chồng thẻ thưởng che TRỌN thanh điều
  hướng sau MỖI phiên** — nav y=774…832, `bottom-3` đặt đáy chồng thẻ đúng ở 832, `z-[48] > z-40`,
  mỗi thẻ là `<button>` có `pointer-events-auto` ⇒ chạm bất kỳ nút nào trong 5 nút đều mở hộp phần
  thưởng. Ba thứ **đều đúng riêng lẻ** cộng lại thành lỗi, không có dòng nào để `grep`.
  (2) **Bước cuối chuỗi tuần hiện "Đã chốt" và "0%" cạnh nhau** — hai công thức cho một sự thật
  (`chainStepsCompleted` so với `chainStepIndex`, lệch đúng 1 khi xong chuỗi). Nay trạng thái một
  bước tính MỘT LẦN ở `components/weeklyChainStep.js`, ba trạng thái loại trừ nhau ⇒ mâu thuẫn cũ
  **bất khả thi theo cấu tạo**.
  · **~860 dòng mã KHÔNG BAO GIỜ chạy được đã xoá — ba kiểu chết, chỉ MỘT kiểu `grep`/lint thấy:**
  (a) 0 nơi tham chiếu (`setSurgeChoice` · `addBuildingPassiveResources` · `craftTier`);
  (b) chết vì một `return null` ĐỨNG TRƯỚC (`FocusIntro` là nơi gọi DUY NHẤT của
  `getFocusIntroCopy`) ⇒ kho câu chào **39 bank/762 dòng → 3 bank/42 dòng**, **giữ nguyên toàn bộ
  câu TIÊU ĐỀ**; (c) chết vì một trường vĩnh viễn `null` (`surgeOverride`).
  `App.jsx` **3.006 → 2.176 dòng** · `gameStore.js` 6.230 → 6.123.
  · **Chữ nói lại chữ, bảy màn:** Thành tích **19.059 → 11.739px (−38,4%)** · Xưởng 2.559 → 2.455 ·
  Bản vẽ 2.832 → 2.745 · nút chính màn Tập trung **188×59 → 308×42**, biên tới nav 32 → **71px**
  (ca tiêu đề dài nhất **~6 → 45px** — màn này đã để nút chính chui xuống dưới nav HAI lần rồi).
  · **Chồng thẻ sau phiên: cắt `rank` + `mission`** (cả hai đã có kênh bền VÀ chúng lặp) ⇒ ca
  thường ngày **2–3 → 1–2 thẻ**. **GIỮ `weekly`** — một nhịp MỖI TUẦN là thứ ĐỐI LẬP với lạm phát.
  · **Ba khoảnh khắc câm nay có tiếng, tốn 0 chữ** (một trong ba còn XOÁ 174 ký tự): chọn gói âm
  thanh nay LÀ cú nghe thử · vào nghỉ có tiếng · 5 nút nav nhúc nhích khi bấm. Cộng cổng mới
  `soundReach.test.js` (mọi `play*` phải có ≥1 nơi gọi; miễn trừ là `assert.deepEqual`).
  ⚠️ **HAI LẦN KHẢO SÁT ĐỀ NGHỊ XOÁ MỘT THỨ ĐÁNG GIỮ** và cả hai lần lý lẽ nghe rất xuôi (thẻ
  «tổng kết tuần»; 15 dòng di vật — mỗi dòng mang một danh từ riêng trả lời *"cái này rơi ở đâu"*).
  **Điểm "đơn giản hoá" cao không tự nó là lý do làm.**
- **Trò chơi — VÒNG 22 (2026-09-01): "hứng thú hơn, hệ thống ĐƠN GIẢN hơn".** Bảy việc,
  không việc nào thêm một khái niệm mới cho Đàm; ba việc là XOÁ hoặc HẠ.
  · **Cây kỹ năng 336 SP → 138 SP** (2/3/5/8 theo hạng). Ở nhịp ~80 SP/năm thì mở trọn cây đi từ
  **15,9 năm xuống ~1,7 năm**. Hạ giá là phép CỘNG THÊM thuần — kỹ năng đã mở giữ nguyên, SP đã
  tiêu không đòi lại, KHÔNG cần migration. ⚠️ Cố ý **KHÔNG** đụng `EXP_PER_LEVEL`: `player.level`
  được LƯU chứ không suy ra, và `migrate` KHÔNG chạy trên đường Supabase pull (`_importGameData`
  và `merge` gọi thẳng `normalizePersistedGameState`) — muốn tặng SP hồi tố thì phải có cờ một-lần
  kiểu `skinMigratedV1` đặt TRONG `normalize`.
  · **Sự kiện của phiên lên mặt thẻ.** 63% số phiên sinh một sự kiện có tên/icon/câu chuyện riêng
  (+15–30% XP) nhưng nó chỉ được vẽ trong `LootDropModal`, mà hộp ấy chỉ tự mở ở **1,2%** số phiên
  ⇒ ~358 câu chuyện đã tính rồi bị xoá không ai thấy.
  · **513 biểu tượng vẽ tay lên được màn hình** — `getGlyph`/`hasGlyphIcon` ở `utils/labelMark.js`.
  Mọi màn sưu tập trước nay hiện ký hiệu 2 chữ cái ("NH" · "VC" · "XĐ" · "RL").
  · **Huy hiệu hệ số hết câm**: bản cũ chỉ nói được vách ×1.3 rồi im ở **75,2%** số phiên, mà im
  đúng khúc 45–59 phút nơi **117 phiên** đã dừng khi chỉ còn 1–15 phút là chạm ×2.0.
  · **Mốc chuỗi 7/14/30 nay có thẻ + tiếng chuông** (`playMilestone` xưa nay 0 nơi gọi).
  · **Rương Lớn + tinh luyện được gọi tên** trên thẻ (10,1% và 28,8% số phiên).
  · **Lễ mừng thành phố chỉ chạy khi có công trình MỚI** — trước đó nó chạy 3,2 giây sau MỌI phiên
  để khoe một dòng chữ vốn luôn hiện sẵn: 30,9 phút chờ trong 579 phiên.
  ⚠️ **KHÔNG làm** cái chấm chú ý theo `sp > 0`: đo lại thì `hasReadyOpportunity` ĐÃ đọc `sp` và
  gác đúng (sáng ở 2 SP, tắt ở 1 SP). Bật chấm ở 1 SP là đẩy Đàm sang màn anh không làm được gì.
- **Thống kê — VÒNG 21 (2026-08-30, phiên khác):** gộp ba bộ lọc thời gian thành MỘT
  (`engine/statsPeriod.js` là nguồn kỳ duy nhất, 6 kỳ theo nghĩa LỊCH — trước đó ba tab có ba mặc
  định khác nhau nên bấm sang tab là cửa sổ thời gian âm thầm đổi); sửa lỗi NHÃN "tuần này" vốn
  tính bằng `now − 7 ngày`; thêm dải "Điều đáng chú ý" đưa ~10 phép phân tích SẴN CÓ trong
  `gameMath.js` ra màn hình (trước đó chúng chỉ chảy vào AI Coach, tức cần mạng + tốn tiền Gemini);
  xoá 960 dòng code chết khỏi `StatsDashboard.jsx` (4.901 → 3.941). Xem `TECH_DEBT #93`.
- **Giao diện — VÒNG 20 (2026-08-30):** tối giản toàn app bằng **fan-out soi song song**
  (6 nhánh chỉ-đọc soi 9 màn ở 390px, luật *không số đo = không tính*, rồi sửa TUẦN TỰ — 9 commit).
  ⚠️ **Nút chính màn Tập trung từng bị thanh tab che LẠI sau vòng 19** vì vòng 19 đo trên NGÀY CHÀO
  NGẮN, mà khối chào dài 2 hoặc 3 dòng tuỳ biến thể copy (chênh 26px). Nay: `FocusNextAction` đã
  NHẬP vào bộ chọn `focusMomentPick` thành nguồn thứ năm (cột giữa còn đúng HAI dòng, trần xấu nhất
  khoá bằng CẤU TRÚC), trần vòng đồng hồ `64vw → 58vw`, `pt-8 → pt-4` ở khổ điện thoại ⇒ **nút cách
  thanh tab 53px**. ⚠️ **Thêm bất cứ gì vào cột giữa màn Tập trung thì phải đo lại bằng ảnh
  VIEWPORT — ảnh `--full` KHÔNG thấy lỗi này** (nó là ảnh ghép nên thanh `fixed` không đè lên gì).
  Số đo khác: màn Tập trung 2.920→2.660px · tab Kỹ năng 3.145→2.032px · Thành tích 14.254→12.633px
  · nhãn tiếng Anh trên màn hình 11→0.

- **Trò chơi — VÒNG 33 (2026-09-05): CÁCH MẠNG VÒNG LẶP CHÍNH (ADR-068), không đụng
  Thành phố.** Ba chỗ đổi: (1) `TodayHero` mở đầu màn Tập trung — chuỗi · dải bảy ngày T2→CN ·
  mốc kế tiếp (thay ô Chuỗi ở thanh tiêu đề tại tab này + hai thẻ ở cột phải desktop); (2) nhiệm
  vụ ngày nằm ngay dưới đồng hồ, tab `missions` đổi nhãn "Tiến trình" và vào menu Thêm ⇒ thanh dưới
  **4 nút**; (3) **`SessionRewardStory`** sau MỌI phiên (xp → chuỗi → hôm nay → nhiệm vụ → cấp →
  kỷ), hộp thoại 7 giai đoạn chỉ còn mở khi lên kỷ hoặc bấm "Xem chi tiết". ADR-060 đảo ngược MỘT
  NỬA (vế toast-sau-mọi-phiên). Cửa soi: `--preview "loot&dc-preview-card=streak"`.
  ⚠️ Nút Bắt đầu suýt tụt dưới thanh tab lần thứ TƯ — mọi thứ thêm vào cột giữa tiêu vào biên ấy.
  Nợ mới: `TECH_DEBT #98` (`LootDropModal` trùng vai với chuỗi thẻ).

*(VÒNG 33 chuyển về đây 2026-09-06 chiều: `START_HERE.md` giữ tối đa 3 vòng gần nhất — luật của chính nó — và đã vượt trần 20.000 ký tự, 20.200.)*

## Chi tiết THÀNH PHỐ 3D — chuyển từ `START_HERE.md` ngày 2026-09-06 (chiều)

*Lý do: `START_HERE.md` là file BẮT BUỘC đọc mỗi phiên, mà Thành phố 3D là **HỘP ĐEN đã xong, Đàm cấm đụng**. Trả tiền token mỗi phiên cho chi tiết của một thứ không được đụng tới là lãng phí thuần tuý. Các luật 2D vẫn đang dùng (chuyển động · điều hướng · skin · phần thưởng · toast) được GIỮ LẠI ở `START_HERE.md`. Đụng 3D thì `grep` file này + `docs/LESSONS_3D.md`.*

- **Thành phố 3D (từ nhánh Phase 19–21): ADR-064 · ADR-065 · ADR-066.** Bộ xương thành phố sinh
  theo kỷ: BSP quyết cắt Ở ĐÂU, cung cong quyết cắt theo HÌNH GÌ; **một thửa là TẬP Ô**, không phải
  hình chữ nhật đã khai. Trước đó: ADR-059 (mỗi kỷ MỘT MẠNG ĐƯỜNG riêng — hết bàn cờ).
- ⚠️ **PHÉP GỘP 2026-08-28 CÓ MỘT QUYẾT ĐỊNH PHẢI BIẾT — `reach` LẤY 0,8 CỦA NHÁNH, KHÔNG LẤY 0,75
  CỦA `main`.** Hai phiên đo cùng một đại lượng trên hai THẾ GIỚI khác nhau: `main` đo trên bố cục
  cũ và chốt 0,75; nhánh đo trên bố cục Phase 21 §4 (thành phố LAN RA NGOÀI ô lưới) và thấy khối đổ
  bóng xa tâm nhất đi tới bán kính **9,2275** — xa hơn cả `reach` mà 0,75 cho ra (9,00). Sau gộp,
  thế giới là bố cục MỚI, nên số của nhánh mới là số đúng; giữ 0,75 là cắt cụt bóng ở vành ngoài.
  Đúng bài học `TECH_DEBT #43`: **một bảng số chỉ đúng cho đúng hai commit đã sinh ra nó.**
- ⚠️ **Bóng đổ nay có HAI tầng nướng sẵn, nhân vào nhau** — `contactShade` (trục ĐỨNG, đo từ nền của
  CHÍNH công trình nhờ bản vá của `main`) × `occlusionShade` (đủ BA chiều, từ nhánh Phase 21). Phép
  gộp giữ cả hai; đừng gỡ tầng nào mà chưa đọc `geometryFactory.js` dòng ~90.
- Cảnh 3D: 15 kỷ, mỗi kỷ buộc vào một nước có thật (`country`/`landmark` ở `eraStyle.js`).
  Các bảng bản sắc 15 kỷ đã có: mái · tầng trệt · mặt đường · thực vật · địa thế/nước ·
  vùng phụ cận · khu phố (có trục `layout`) · dáng đi · mạng đường.
- Lưới thành phố **12×12**. Mỗi kỷ có mạng đường RIÊNG (**44…88 ô**, không còn là 80 ô chung).
  Thửa chia vai ở `city3d/parcelRoles.js`: 5 kỳ quan (536 ô) · 1–2 sân bỏ trống (155 ô) ·
  còn lại nhà dân (**371 ô trên cả 15 kỷ**, đã chạm trần). Muốn thành phố đông hơn thì đổi thứ
  NẰM TRONG một ô, đừng thêm ô.
  ⚠️ Hỏi mạng đường thì phải truyền `era`: `roadCellCandidates(era)` / `roadCellCount(era)`
  (ở `src/engine/cityLayout.js`) — gọi thiếu tham số sẽ **im lặng** trả lời về kỷ 1.
- Hiệu năng: đã đo dứt điểm trên Apple M3 — **dư 3,2 lần**, hình học gần như miễn phí.
  **KHÔNG đo lại** trừ khi Đàm thấy khung hình giật trên máy thật.

---

## Rounds 34 and 35 — full text (moved from START_HERE.md 2026-09-06 night)

- **Game — ROUND 35 (2026-09-06): ONE ENDING, NO CLAIM BUTTONS, NO DEAD SCREENS (ADR-070).**
  (1) Weekly step + full-day bonus land automatically inside `completeFocusSession` and are narrated
  in the card chain — `claimWeeklyStep`/`claimMissionAllBonus` and every Claim button deleted;
  (2) **relics grow by SESSION** (`engine/relicGrowth.js`, thresholds 20/50 sessions ≥25′ since
  `earnedAt`; old saves stamped on load) — `evolveRelic` and refining costs gone (`#96` closed);
  (3) 11/15 wonders + 2 building perks moved onto the living axis (`WONDER_EFFECT_REGISTRY.passive`,
  `wonderEffects.js` is the single source); (4) **`LootDropModal` deleted** — the card chain is the
  only ending; the «Kỷ nguyên mới» card carries a «Xem thành phố mới» button (`#98` closed);
  (5) Badges gained a «Kế tiếp» block (4 closest, bar + «còn N»), tier filter removed (`#100` closed).
  ⚠️ Lesson: *when you remove a button, hunt down everything it did BESIDES granting the reward* —
  the old «Nhận» button also reconciled quests against history; that now lives in
  `completeFocusSession`. Inspect: `--preview "loot-max&dc-preview-card=quests|chain|evolve"` and
  `--preview era`.
- **Game — ROUND 34 (2026-09-06): THE ONLY CURRENCY IS A SESSION (ADR-069).**
  Order: *"SIMPLIFY. MINIMIZE. AMPLIFY FUN."* (1) Building is one screen, one button
  (`BuildScreen.jsx`; `startProject` asks for no RP or materials — the price is N sessions + a queue
  slot); (2) ranks self-promote from history, era crises became soft quests — no button, no deadline,
  no penalty, no blocking of Start (`engine/rankLadder.js`; deleted `EraCrisisModal` · `DisasterModal`
  · `StakePanel` · `ResourceDisplay`); (3) the reward chain gained a City card · level-up offers ≤3
  skills inline · era challenge · rank · relic; (4) **every reward sits on the living axis** — odd
  ranks → EP, 12/15 relics → EP/XP/combo, Luck → +XP/+EP, Forgiveness → +6% XP after a cancel
  (`rewardAxes.test.js`). Resources/RP/refining became DORMANT DATA (`TECH_DEBT #99`, deliberate — do
  not delete what Đàm earned, do not touch synced state). ⚠️ Lesson: a Rank card printed «+12% Tài
  Nguyên» — *a valid reward table with green tests can still grant something nobody can see; only a
  SCREENSHOT catches it.*

---

## Rounds 36 → 38 — moved out of `START_HERE.md` on 2026-09-08 (round 42), verbatim

- **Loop — ROUND 38 (2026-09-07): THE CITY LIVES ON THE FOCUS SCREEN (ADR-078).** Order:
  *"Thôi dọn, bắt đầu xây"* + a permanent report law (A for Đàm first, B for the advisor). (1) **City
  postcard** (`focus/CityPostcard.jsx` + pure `focus/cityPostcard.js`): the same `CityStage` framed at
  full opacity at the top of Focus — still in a session, alive when idle, camera on this session's
  scaffold (phantom at session 1) or on the building just finished (`ui.postcardFocusBpId`); the ghost
  `CityBackdrop` is deleted; streak card under the timer (`belowTimer`), era bar in the caption
  (`shared/EraStageBar.jsx`, hidden in the top rail on Focus). (2) **«Đổi công trình»** on the brick strip
  (`chooseSessionProject`, store `setSessionProject`). (3) **`engine/sessionRewards.js`** —
  `assembleSessionReward` is the whole session-end computation, pure (`now`/`today`/`weekKey`/
  `dailyGoal`/`random` params); ten helper clusters moved to `engine/`; `gameStore.js` 4,677 → 2,879.
  (4) `COACH_BUCKET_MIN_SAMPLE` 4 → 3, one definition. (5) **#86 gate**: ESLint rejects palette classes
  and hex/rgb literals on any button (0 violations; 11 action buttons through `ActionButton`).
  (6) `soundEngine.cues.test.js` proves the five cues differ; no haptics by design (iOS has no API).
  ⚠️ Lessons: *the sandbox's software GL trips the FPS watchdog in ~3 s — shoot 3D with `--settle 600`*;
  *`--click` matches a button's FULL text, emoji included*. Inspect: `--fixture <fx> --tab "Tập trung"
  --settle 600` · `--fixture fresh.json --tab "Tập trung" --click "Đổi công trình" --settle 600`.
- **Loop — ROUND 37 (2026-09-06): A SESSION ALWAYS LAYS A BRICK (ADR-077).** Order: *"Build
  lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào UX/UI. TOÀN QUYỀN."* Seven streams, all
  on `main`. (1) **The brick**: `engine/sessionBrick.js` names the building THIS session pushes; the
  strip above the ring (`focus/SessionBrickStrip.jsx`, replacing the milestone toast + combo badges +
  city tease) fills the current brick with the timer; the ending's project card lands it (`BrickRow`,
  `playBrickLaid`); an empty queue is auto-filled before the queue advances (`autoQueueSessionProject`)
  — changeable on the Build screen. (2) **Stats never asks for homework**: the three "strongest" lines
  rank on the WHOLE-SESSION rate (`started`/`whole` in `buildFocusProfile`), goal reviews only sharpen
  it; Monday 04:00 compares last full week vs the week before (`WEEK_SCOPE`); the session goal is
  OPTIONAL (chips in the goal card, same task type first). (3) **Sound**: last-minute bell ·
  break-over cue · brick landing; dead tick + 5-minute chime deleted; no haptics (iOS has no API).
  (4) `PomodoroEngine.jsx` 2,958 → 1,922 (`shared/ActionButton.jsx` = the #86 door, seven controls in
  `components/focus/`). (5) `gameStore.js` 5,413 → 4,696 (`engine/missions.js` + `engine/weeklyChain.js`
  + `engine/seededRng.js`; live mission tick = reload path; `forgiveness` removed). (6) **Weekly report
  dialog deleted** — Stats answers it; the unseen dot sits on the Thống kê tab. (7) First open: no
  overlay; Focus + City name the first project. ⚠️ Lessons: *the shot tool's default seed is era 7 with
  5/5 built — a fresh save needs `--fixture` with `{"state":{},"version":4}`*; *`$SP` does not survive
  between Bash calls*. Inspect: `--fixture <fx> --tab "Tập trung"` · `--preview "loot&dc-preview-card=project"`.
- **Stats + economy — ROUND 36 (2026-09-06): STATS ANSWER, THEY DO NOT PRESENT; #99 CLOSED
  (ADR-071).** Order: *"build lớn · simplify mạnh · vui hơn · UX/UI · TOÀN QUYỀN"*.
  (1) `StatsDashboard.jsx` **3,792 → 294 lines**: opening it shows three cards — *am I improving?*
  (this week vs the SAME span last week, 7 column pairs) · *when am I strongest?* (hour · length ·
  task type, each line carrying its sample size) · *what next?* (ONE button «Bắt đầu N phút · type»
  jumping straight to Focus). The «Điều đáng chú ý» strip stays; Journal · Notes fold below
  (`StatsJournal.jsx` · `StatsNotes.jsx`). Numbers come from `engine/statsAnswers.js` (pure, composes
  `coachIntel`/`gameMath`). Deleted: 3 tabs · 6 periods · charts · heat map · `statsPeriod.js` ·
  `statsFocus.js`. (2) **#99 closed**: resources · RP · refining stopped accruing (keys stay in the
  save — no migration), cancelling a session neither deducts nor spends forgiveness,
  `cancelCrafting` refunds nothing, the «Kiếm N RP» quest is gone, cards dropped
  «Rương Lớn/+resources/+RP». (3) Era-crisis text in saves is re-read from `ERA_CRISES` on load
  (`withCanonicalCrisisText`) — general law: *saves store ids + numbers, text comes from the table*.
  ⚠️ Lesson: *the three "strongest" lines only have numbers when sessions SET A GOAL* — the 599-session
  fixture has no goals so all three were empty; the screen now says what to do instead of going quiet.
  Inspect: `node scripts/shot.mjs --phone --fixture <fx> --tab "Thống kê" --full`.


## Rotated out of `START_HERE.md` on 2026-09-08 (round 45 arrived; keep the 3 most recent)

- **Loop — ROUND 42 (2026-09-08): SPACE — ONE NUMBER FOR A SHAPE, ONE AXIS FOR A STACK
  (ADR-083).** Order: *"VÒNG 42 = KHÔNG GIAN: cái gì nằm ở đâu, to bao nhiêu, có vừa khung không"*, with three
  photographs. Root cause, one sentence: the ring was DRAWN at `min(canvas, cap) × transform: scale()` while the
  room under it was RESERVED from a SECOND expression — a transform does not change layout, so once the cap bit
  the drawing was bigger than the hole (390 px full screen: **427 drawn, 281 reserved, the goal line 32 px inside
  the arc**); and `timerStageVisual` is a FRAGMENT of stacked blocks that desktop full screen mounted into a ROW
  flex, so the same line flew onto the digits at 1280/2000. **`src/components/focus/ringMetrics.js` is now the ONE
  owner** of the ring's geometry: `ringSizeCss()` → one CSS length for `width`, `aspect-ratio: 1` for the height,
  three terms (px ceiling · 94 % of the column · `calc(100svh − min(<reserve>px, <reserve>svh))`); the slot has NO
  height of its own, so reserved ≡ drawn; nine constants and the scaling wrapper deleted. Text inside the disc is
  `cqw` (a fraction of the ring) instead of eleven rem values. `timerStageContent` carries its own column and is
  the only mount point. Full screen is `h-[100svh] overflow-hidden` with the 890 px notebook behind a disclosure;
  `min-h-[76/84/88vh]` only while idle. Sidebar rail: labels under icons, dots carry their reason
  («Có việc» · «Tuần mới»). Gate: **`focus/ringText.test.js`** — 25 % clearance for every clock string at every
  ring size 160–720 px, identical ratio at every size, red on a 10-character clock. Measured after: vertical
  scroll **0** in every running/break/full-screen cell at 375/390/1280/2000; gap ring→line **+12 px** everywhere.
  ⚠️ Inspect a running/break state with a seeded `timerSession`/`breakSession` fixture (ms timestamps, **regenerate
  it right before each shot — a 25-minute session in a stale fixture has already ENDED and you photograph the
  reward card instead**) and `--settle 900`.

## Rotated out of `START_HERE.md` on 2026-09-08 (round 46 arrived; keep the 3 most recent)

- **Loop — ROUND 43 (2026-09-08): ONE DESTINATION, AND EVERY DISTANCE IN SESSIONS (ADR-082).**
  ⚠️ **`engine/journey.js` owns the destination and nothing else may compute it.** The city is finite —
  15 eras x 5 blueprints = **75 buildings** — and that is the app's answer to *"đi tới đâu?"*. The
  denominator is SUMMED from `BLUEPRINT_CATALOG`, never typed; `hooks/useJourney.js` is the only seam
  to the store. ⚠️ **No screen prints raw EP as a distance any more.** `describeRailProgress` says the
  distance in SESSIONS while that is honest and falls through to `38/75 công trình` when it is not —
  and it must NEVER fall back to EP (`describeStageCountdown` has an EP branch for the no-sample case;
  the guard that drops it is pinned by a red test). Same rule everywhere: rank card says `Đã đủ`, badge
  thresholds say hours past 120 minutes, the level countdown HIDES past `STAGE_COUNTDOWN_MAX_SESSIONS`
  rather than print a 155-session wall. The city's fourth stat cell is the destination, not `Cư dân`.
  ⚠️ XP rewards for the 360 achievements were measured (126.030 XP ≈ 21 levels ≈ 42 SP over the game)
  and REJECTED as a second faucet — that decision is still open in `TECH_DEBT.md`.
  Also: `components/journeyWiring.test.js` reads call sites, because an engine test proves a function
  RUNS and never that anyone CALLS it — this project has now shipped three finished-but-uncalled ones.

- **Loop — ROUND 41 (2026-09-08): THE LONG RHYTHMS, AND A TOOL THAT CAN SEE (ADR-081).**
  ⚠️ **`shot.mjs --dilate <rate>` is how a transient moment is photographed now.** One framer animation
  runs on TWO clocks (`opacity` on WAAPI, `x/y/scale` on framer's own rAF loop); `--dilate` slows both,
  patching `performance.now()` in the page while `Date.now()` stays real. Add `--frames n --frame-gap ms`
  for a filmstrip, `--city2d` to keep the main thread free, `--ask <js>` to question the page. Three
  rounds in a row shipped something nobody could see before this existed — do not ship a moment without
  a photograph of it. The burst was redrawn the day it could be seen (two colours, upward fan).
  Day and week now open and close (`engine/dayArc.js` + `focus/DayMoment.jsx`: 7-second banner, stamps in
  `localStorage`, no branch that reads as a failure). Three surprises at three beats: «Gạch đôi» (ending) ·
  «Guồng vàng» (mid-session, a hash so both sides agree without state) · «Thợ đêm» (a day's open,
  `rollNightBuilder`). No silence over 15 minutes at any session length. Inspect: `--preview arc-gift`
  (and `arc-day-open` · `arc-day-close` · `arc-week-open` · `arc-week-close`), `--preview loot-lucky
  --card project --dilate 0.05 --watch "HÔM NAY MAY" --snap --frames 2`.
