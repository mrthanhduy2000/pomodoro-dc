# Changelog — Pomodoro DC

> Đây KHÔNG phải lịch sử commit, và KHÔNG phải bản sao của `BAN_GIAO.md`. File này là bản tóm tắt
> CHÍNH THỨC, NGẮN GỌN theo mốc thay đổi quan trọng — chỉ ghi mục đích/phạm vi/ảnh hưởng/tương
> thích, để người đọc (hoặc AI) nắm nhanh project đã tiến hoá thế nào theo thời gian mà không phải
> đọc hết nhật ký chi tiết.
>
> **Muốn xem bối cảnh đầy đủ, lý do từng dòng, số liệu test chính xác từng lần** → đọc mục "Nhật ký
> cập nhật" trong `BAN_GIAO.md` (đó mới là nguồn chi tiết đầy đủ nhất, cập nhật ngay sau mỗi việc).
> **Muốn hiểu VÌ SAO một quyết định được chọn** → `ARCHITECTURE_DECISIONS.md`. **Muốn biết migration
> cụ thể nào cần chạy** → `MIGRATION.md`.

## 2026-09-08 — Round 40: things that happen and vanish (ADR-080)

**Purpose.** *"Dọn xong thì lộ ra chỗ trống — vòng này lấp chỗ trống ấy."* Give the 125 silent minutes a rhythm, make the ending burst by tier, add one real surprise, design the break — while round 39's screen stays exactly as it is (1 indicator · ≤2 numbers · ≤3 colours · 0 cut text). Static budget: zero.

**Scope.**
- **Session beats** (`engine/sessionBeats.js`, `focus/BeatRipple.jsx`): Vào guồng · Nửa đường · Đoạn cuối · Phút cuối — an 8-second whisper in the ring label plus a ripple out of the ring; derived from elapsed time (background-safe), no new sound. The ring's glow warms with progress; the tab title carries a phase glyph ○ ◔ ◑ ◕ ● (☕/⏰ on a break).
- **Break beats**: Đứng dậy · Uống nước · Sắp hết nghỉ, in `--good`; the existing break-over cue and notification stay.
- **Tiered ending** (`shared/RewardBurst.jsx`, `focus/BrickRow.jsx`): the brick drops with a squash and a dust puff; a finished building gets a light ring and confetti; rare cards (streak milestone · level · rank · relic · era · finished chain) burst full-screen. Never blocks.
- **Lucky brick** (`rollLuckyBrick`, `LUCKY_BRICK_CHANCE` 0.12, ≥ 15 min): sometimes a session lays two bricks — «Gạch đôi — hôm nay may!»; never negative, no odds, no countdown; `pendingReward.luckyBrickId`; preview scenes `loot-lucky` · `loot-built` (queue-head placeholder), shot tool `--card`.
- **Leftovers**: reward tiers recoloured into the three-colour family; era chip strip wraps (scroll machinery deleted); era colours on the City tab kept; clock subline unchanged.
- Tests: `sessionBeats` 6 · `sessionBrickLucky` 4 · `sessionRewards` +2 · `sessionRewardStory` +1; `cityRenderers` era-strip test rewritten. Full suite 1,623 tests · 1,622 pass · 0 fail · 1 skipped.

**Compatibility.** No save migration: `luckyBrickId` lives in `ui.pendingReward` (not persisted); the queue shape is unchanged. Reduce-motion users get the whisper and the drop-less brick, no particles.

## 2026-09-07 — Round 39: while a timer runs, the Focus screen is the timer (ADR-079)

**Purpose.** *"Dọn giao diện màn Tập trung — mở app lên, liếc một cái, biết ngay còn bao lâu và đang làm gì."* No feature added, none deleted: what competes with the time left is hidden while a timer runs and returns when it stops.

**Scope.**
- **One progress indicator while running**: the daily-goal ring (second arc, `--warn`) is deleted; the brick strip is one headline («Đang xây X»); the postcard is a picture only (`quiet`); the «Giải lao dài» pill is gone; the voice line (`pickFocusMoment`) is silent while any timer runs.
- **One line under the clock, every device**: `describeClockSubline` («Phiên thứ N hôm nay» / «Xong N phiên hôm nay»); the daily-goal fraction moved to the idle postcard caption («Hôm nay 2/5 phiên»).
- **Goal line and break line under the ring** — inside the disc they crossed the ring's stroke at 390 px.
- **Three colours**: canvas · ink · one accent (`--accent` focusing, `--good` on a break); the red last-10-s flash, the blue break number, the gold Coach and the palette classes in `PomodoroEngine.jsx` + `focus/*` are gone.
- **Quiet chrome while a timer runs** (focus AND break): desktop right column, phone missions + Coach cards, top rail, streak card — `anyTimerRunning` in `App.jsx`.
- **No cut text**: 20 `truncate` sites now wrap; the greeting wraps; the weekly line fits one line at 390 px; the tab bar keeps its three safety-net `truncate`.
- Tests: `timerRing.test.js` rewritten (one dashed arc · tokens · subline · palette gate over the Focus files); `focusFoldReach` · `focusMoment` · `deadCode` · `sessionBrick` · `timerSession` retargeted. Full suite 1,605 tests · 1,604 pass · 0 fail · 1 skipped.

**Compatibility.** No save migration; no setting changed (the daily-goal settings still drive the idle caption and the Stats/Coach cards). What is hidden while a timer runs is listed in `BAN_GIAO.md`.

## 2026-09-07 — Round 38: the city lives on the Focus screen (ADR-078)

**Purpose.** *"Thôi dọn, bắt đầu xây."* Make the 3D city part of the main loop, let Đàm change the auto-picked project where he stands, finish the God File's last hand-written block, close round 37's unheard sounds, and put a gate on #86.

**Scope.**
- **City postcard** at the top of the Focus screen (`focus/CityPostcard.jsx` + pure `focus/cityPostcard.js`, `shared/EraStageBar.jsx`): full-opacity 3D city, still during a session, alive when idle, camera on this session's scaffold or on the building just finished (`ui.postcardFocusBpId`); at session 1 the first project's scaffold is already staked out. `CityBackdrop.jsx` + `cityBackdropScrim.js` deleted; the streak card moved under the timer (`PomodoroEngine belowTimer`); the era bar moved into the caption (hidden in the top rail on the Focus tab). Start button rises at 390 px.
- **«Đổi công trình»** on the brick strip: in-place list of the era's other projects (queued first, then cheapest); `chooseSessionProject` / `listSessionProjectChoices` (engine), `setSessionProject` (store).
- **`engine/sessionRewards.js`** — `assembleSessionReward` is the whole session-end computation, pure (clocks, calendar, settings, dice as parameters); ten helper modules moved out of the store verbatim; `gameStore.js` 4,677 → 2,879 lines; streak bonus formula deduplicated (`streakBonusRate`).
- **Sound/haptics verified** by `soundEngine.cues.test.js` (five cues pairwise distinct in four packs; start cue inside the tap; no haptic code by design).
- **#86 lint gate**: palette colours in a button's `className` or hex/rgb literals in its `style` are errors; 100 literals recoloured to tokens; 11 action buttons (Settings, Journal, Notification Center) through `ActionButton`.
- **`COACH_BUCKET_MIN_SAMPLE` 4 → 3**, one definition (`gameMath.js`).
- Tests: +20 (`cityPostcard` 4 · `sessionBrickChoose` 5 · `soundEngine.cues` 6 · `sessionRewards` 5); full suite 1,602 tests · 1,601 pass · 0 fail · 1 skipped.

**Compatibility.** No save migration: `ui.postcardFocusBpId` is in-memory; the queue shape is unchanged; the Settings key `cityHomeBackdrop` keeps its name (now the postcard switch). Sandbox lesson: under software GL the FPS watchdog downgrades both the postcard and the City tab to 2D after ~3 s — shoot 3D with `--settle 600`.
## 2026-09-07 — Self-healing rotation + "build, don't audit" (ADR-076 addendum)

- **Purpose**: a red rotation gate said what was wrong but not how to fix it; every future session
  would have re-measured and re-scripted the fix.
- **Scope**: `node scripts/doc-budget.mjs --rotate <file>` / `--rotate-all` [`--dry`] [`--force`]
  moves a log's old entries verbatim into a dated `docs/archive/` file and leaves an index; the gate
  error names the command. Operating rule added to `CLAUDE.md`: `npm test` green = docs healthy, do
  not re-audit before building.
- **Impact**: growth is now handled by one command instead of a session's worth of investigation.
  Tooling + docs only; 16 guard tests.

## 2026-09-06 (late night) — Round 37: a session always lays a brick (ADR-077)

- **Purpose**: Đàm's round-37 order — *build big, simplify hard, more fun, more UX/UI*. Four rounds of
  removal had left the loop thin; this round adds ONE thing that lives in the loop and removes what
  only existed because it had been coded.
- **Scope**: (1) "this session's brick" — the Focus strip names the building this session pushes and
  fills the brick with the timer; the ending's project card lands it with its own sound; a session
  with an empty queue auto-queues the next project. (2) Stats "strongest" lines rank on whole sessions
  (not cancelled, not self-rated missed) — they always have numbers; Monday mornings compare last full
  week vs the week before instead of saying "no sessions". (3) The session goal is optional; recent
  goals are one-tap chips. (4) Sound: last-minute bell, break-over cue, brick landing; dead tick sound
  and setting deleted; XP card silent. (5) `PomodoroEngine.jsx` 2,958 → 1,922 lines (`ActionButton` is
  now `shared/ActionButton.jsx`, seven leaf controls in `components/focus/`). (6) `gameStore.js`
  5,413 → 4,696: daily missions + weekly chain are pure engine modules; the duplicated live mission
  tick is gone; `forgiveness` removed. (7) Weekly report dialog deleted — the Stats screen answers it;
  the unseen dot moved to the Thống kê tab. (8) First open: onboarding overlay deleted, City empty
  state names the first project. Fixture now carries goals + reviews.
- **Impact**: 13 source files deleted, 20 added; `gameStore.js` −717 lines, `PomodoroEngine.jsx` −1,036;
  tests green (30 new engine/store tests — exact count in `BAN_GIAO.md`); lint clean; build green.
- **Compatibility**: saves unchanged except `forgiveness` is no longer written; old rows carry it
  harmlessly. No migration.
## 2026-09-06 (night, fifth pass) — Document governance runs on discovery (ADR-076)

- **Purpose**: the ADR-075 guards all read a hand-written list, so any document created later was
  ungoverned — three archives created the same day were already outside it.
- **Scope**: `discoverDocs()` + `classify()` replace the hardcoded list; classes come from the path,
  so a file that does not exist yet is already governed. Rotation limits extended from 2 to 4
  append-only logs (`TECH_DEBT.md`, `ARCHITECTURE_DECISIONS.md` added).
- **Impact**: 28 documents governed instead of 20 listed; new files need no registration.
- **Compatibility**: tooling and docs only. Break-tested both new gates.

## 2026-09-06 (night, third pass) — TECH_DEBT split by subsystem; UI invariants lazy-loaded (ADR-075)

- **Purpose**: `TECH_DEBT.md` was the most-grepped reference file, and 87% of it was debts on the
  frozen 3D city that nobody may act on.
- **Scope**: 52 3D debts → `docs/TECH_DEBT_3D.md` (still open, split by subsystem); 4 mislabelled
  closed entries → archive; `START_HERE.md` UI invariants → `docs/UI_INVARIANTS.md`; stale routing
  repointed in `AI_ONBOARDING.md`, `AI_HANDOFF_KNOWLEDGE.md`, `ARCHITECTURE.md`.
- **Impact**: `TECH_DEBT.md` 250,190 → 43,559 chars (−83%); startup context 10,020 → 9,145 tokens.
  Nothing deleted; 103 entries still accounted for.

## 2026-09-06 (night, second pass) — Journal rotation enforced (ADR-075)

- **Purpose**: `CHANGELOG.md` (78% of a context window) and `BAN_GIAO.md` (70%, growing ~17,700
  chars/day) were the last active files near the ceiling.
- **Scope**: 135 changelog entries older than 2026-09 and the older `BAN_GIAO` journal + dated phase
  logs moved verbatim into `docs/archive/`, with title indexes left behind. A sixth guard fails
  `npm test` if either journal passes 120,000 chars.
- **Impact**: `CHANGELOG.md` 266,956 → 56,535 chars, `BAN_GIAO.md` 240,561 → 58,013 chars
  (3,109 → 711 lines). Nothing deleted.

## 2026-09-06 (night) — Retrieval architecture: freeze closed knowledge, cap files at one context window (ADR-075)

- **Purpose**: after ADR-073/074 the always-loaded cost was solved, but three reference files were
  larger than a 200k context window and every lookup paid for closed history.
- **Scope**: 40 closed `TECH_DEBT` entries and the 50 oldest ADRs moved verbatim into `docs/archive/`
  with full indexes left in the active files; the 2026-08-24 handover archive split in two;
  `TECH_DEBT.md` header stripped of 13 stale threshold snapshots; `START_HERE.md` de-duplicated
  against `CLAUDE.md`. Three new guards in `npm test`: canonical rule, pointer resolution, and a
  context-window ceiling — each adversarially break-tested.
- **Also**: added `npm run test:quiet` — same tests as `npm test` but **408,514 → 2,132 chars of
  output (−99.5%)**; the verbose form costs ≈230,000 tokens per run, more than a whole context window.
- **Impact**: `TECH_DEBT.md` 126% → 72% of a window, `ARCHITECTURE_DECISIONS.md` 114% → 46%, largest
  file 486,294 → 266,956 chars, no file above one window. Always-loaded 10,171 → 9,942 tokens.
- **Compatibility**: documentation only, no product code touched. Nothing deleted — corpus +0.5%
  (indexes and archive headers). Tests 1,605 → 1,609.

## 2026-09-06 (tối) — Tài liệu tự-nạp chuyển sang tiếng Anh + cổng canh ngôn ngữ (ADR-074)

- **Mục đích**: tiếng Việt tốn ~2,3 lần token so với tiếng Anh cho cùng một ý (1,723 vs ~4 ký
  tự/token). Với file tự nạp mỗi phiên, chi phí đó nhân với số phiên.
- **Phạm vi**: dịch + tái cấu trúc `CLAUDE.md` · `START_HERE.md` · `PHASE_RULES.md` · `AGENTS.md` ·
  `docs/GOVERNANCE.md` · `docs/OPERATIONS.md`. Thêm cổng canh ngôn ngữ vào
  `scripts/docBudget.test.js` (đoạn tiếng Việt trong file tự-nạp = test đỏ), đo theo ĐOẠN chứ không
  theo toàn file. Kho tra cứu (2,6 triệu ký tự) **không dịch** — phần cũ giữ tiếng Việt, phần mới
  viết tiếng Anh; ranh giới ghi thành bảng trong `CLAUDE.md`.
- **Ảnh hưởng**: 4 file bắt buộc mỗi phiên **25.702 → 10.075 token (−61%)**; riêng `CLAUDE.md` cả
  ngày đi từ 21.600 → 3.839 token (−82%). Báo cáo cho Đàm vẫn 100% tiếng Việt.
- **Tương thích**: không đụng một dòng mã sản phẩm nào. Test 1.602 → 1.605 bài.

## 2026-09-06 (chiều) — Ngân sách token cho tài liệu: tách file + cổng canh bằng test (ADR-073)

- **Mục đích**: cửa sổ ngữ cảnh bị chính tài liệu dự án ăn hết. Đo được 18 file `.md` =
  2.650.448 ký tự ≈ **1,54 triệu token = 769% cửa sổ 200k**; riêng `cat TECH_DEBT.md` = 250k token.
- **Phạm vi**: `CLAUDE.md` tách còn 16.310 ký tự (−56%, 21.600 → 9.468 token) sang hai file mới
  `docs/GOVERNANCE.md` + `docs/OPERATIONS.md` — **không xoá một chữ nào**. Thêm
  `scripts/doc-budget.mjs` (công cụ đo + `--map` in mục lục) và `scripts/docBudget.test.js` (5 bài:
  trần · chống cổng-canh-file-ma · đo bằng ký tự Unicode không phải byte · chống mất luật khi tách
  file). `START_HERE.md` 20.200 → 18.132 ký tự. Gỡ 3 mâu thuẫn tài liệu (`AGENTS.md` bảo đọc toàn
  văn `BAN_GIAO.md` = 134k token · `PHASE_RULES.md` §9 nói ngược luật tự-gộp-`main` · hai bản báo
  cáo 11 mục chồng nhau).
- **Ảnh hưởng**: mỗi phiên AI gánh 25.702 token thay vì phải nạp 21.600 token chỉ riêng `CLAUDE.md`;
  trần tài liệu từ "câu chữ không ai canh" thành **test đỏ trong `npm test`**. Báo cáo cuối task
  gộp hai bản 11 mục thành một bảng chọn (5 dòng / 11 mục), tiết kiệm ~2.500 token output mỗi task.
- **Tương thích**: không đụng một dòng mã sản phẩm nào — chỉ tài liệu + hai file `scripts/`.
  Test 1.597 → 1.602 bài, lint sạch, build xanh.

## 2026-09-06 — Sửa gốc: menu bar Mac mất đếm ngược, lặp lại nhiều lần (ADR-072)

**Mục đích.** Đàm báo (kèm ảnh) tray menu bar Mac không hiện đếm ngược dù phiên đang chạy thật —
*"đã bị rất nhiều lần"*.

**Nguyên nhân gốc.** `electron/main.js` chỉ đọc `timer_live` một lần lúc khởi động rồi phó thác
100% cho kênh Supabase Realtime để cập nhật tiếp — dù comment đầu file ghi "polls every 3 seconds",
dòng polling đó **chưa từng tồn tại** (xác nhận bằng `git log -p`). Kênh WebSocket có thể ngắt lặng
lẽ khi Mac ngủ/thức hoặc đổi WiFi mà không phát lại sự kiện đã lỡ ⇒ tray kẹt ở dữ liệu cũ tới khi
khởi động lại app bằng tay.

**Phạm vi.** `electron/main.js`: thêm poll REST định kỳ (`fetchTimerLive` mỗi 5 giây) làm lưới an
toàn không phụ thuộc trạng thái kênh realtime, cộng `powerMonitor.on('resume', …)` đọc lại ngay khi
Mac vừa thức dậy. Gộp logic phát hiện "phiên vừa xong" (báo Notification) vào một hàm dùng chung
`applyTimerLiveUpdate` cho cả nhánh realtime lẫn nhánh poll, tránh lặp lại đúng lỗi cho nhánh thông
báo. Chi tiết trade-off: `ARCHITECTURE_DECISIONS.md` ADR-072.

**Ảnh hưởng.** 1 file (`electron/main.js`), logic wiring — không đổi hình dạng dữ liệu `timer_live`,
không đụng web app/Supabase schema. `TECH_DEBT #102` mở: phần logic này chưa có test tự động (không
mock được `electron` trong `node --test`).

**Tương thích.** ⚠️ App tray Electron chạy từ THƯ MỤC DỰ ÁN CỤC BỘ trên Mac — **không tự cập nhật
qua Vercel/GitHub như web app**. Web app (`pomodoro-dc.vercel.app`) không đổi gì, không cần Đàm làm
gì thêm ở đó. Để MENU BAR nhận bản vá: `git pull` về máy + khởi động lại app tray — `KeepAlive` của
LaunchAgent đang TẮT có chủ đích nên "Thoát" không tự bật lại; cần khởi động lại Mac, hoặc
`launchctl kickstart -k gui/$(id -u)/com.dcpomodoro.tray`. Chi tiết: `BAN_GIAO.md`.

---

## 2026-09-06 (vòng 36) — Thống kê trả lời, không trình bày; đóng #99 (ADR-071)

**Mục đích.** Lệnh Đàm *"Build lớn. Simplify mạnh. Làm game vui hơn. UX/UI. TOÀN QUYỀN"* với mặt trận
chính là màn Thống kê: mở ra phải thấy ngay ba câu trả lời — *khá lên không · mạnh nhất khi nào · làm
gì tiếp* — không bấm tab con; *"một con số không có mẫu số thì không phải mục tiêu"*.

**Phạm vi.** (1) `StatsDashboard.jsx` 3.792 → 294 dòng: ba thẻ trả lời (engine mới
`statsAnswers.js`, thuần, ghép các phép phân tích ĐÃ CÓ của `coachIntel`/`gameMath`), dải «Điều đáng
chú ý» giữ nguyên, sổ tra cứu Nhật ký · Ghi chú gấp xuống dưới (`StatsJournal.jsx` · `StatsNotes.jsx`);
nút «Bắt đầu N phút · loại» nhảy thẳng sang màn Tập trung. Xoá tab Tổng Quan · Chiều Sâu · Phân Loại,
bộ chọn 6 kỳ, biểu đồ, bản đồ nhiệt, `statsPeriod.js` · `statsFocus.js`. (2) Đóng `TECH_DEBT #99`:
tài nguyên · RP · tinh luyện THÔI được cộng (không migration, khoá vẫn nằm trong save), huỷ phiên không
trừ tài nguyên/không tiêu lượt tha thứ, `cancelCrafting` không hoàn, bỏ hai nhiệm vụ «Kiếm N RP», thẻ
tổng kết bỏ «Rương Lớn/+tài nguyên/+RP». (3) Chữ của khủng hoảng kỷ trong save đọc lại từ `ERA_CRISES`
lúc nạp (cùng luật với di vật).

**Ảnh hưởng.** 29 file, +464/−5.959 dòng mã. Bản ghi lịch sử MỚI không còn `resources/rpEarned/
refinedEarned` (bản cũ giữ nguyên, Thống kê vẫn đọc). `useCoachContext` và Thống kê dùng chung một bộ
getter giờ VN (`time.vietnamHistoryTimeOpts`).

**Tương thích.** Save cũ nạp bình thường; các khoá tiền ngủ không bị xoá. Không đụng Thành phố.

---

## 2026-09-06 — Tối ưu context window: `CLAUDE.md` 190.700 → 22.567 token (−88,2%)

**Mục đích.** Mỗi phiên AI phải gánh một sàn tài liệu cố định 214.824 token (≈107% cửa sổ 200k)
trước khi đọc dòng code đầu tiên. Nguyên nhân: quy tắc 2026-08-24 xếp `CLAUDE.md` vào diện "chỉ
`grep`, không đọc trọn", nhưng harness **tự nạp 100%** file này — câu quy tắc ấy không thi hành
được, nên file phình tới 190.700 token mà không cổng nào canh.

**Phạm vi.** Chỉ tài liệu, **không một dòng mã nguồn nào**. Tách file, **không xoá chữ nào**:
`docs/LESSONS_3D.md` (89 bài học mỹ thuật 3D + 96 mục kèm theo, có mục lục `grep` được) ·
`docs/AI_COACH.md` (chi tiết Gemini + lưới chống-bịa) · `docs/archive/START_HERE_LOG_2026-09-06.md`
(nhật ký VÒNG 20→32). `CLAUDE.md` giữ nguyên văn mọi QUY TẮC + thêm mục «BẢN ĐỒ TÀI LIỆU».

**Ảnh hưởng.** Sàn cố định mỗi phiên **214.824 → 34.139 token (−84,1%)**. Bù lại: phiên làm mỹ
thuật 3D phải `grep` thêm một file (lệnh sẵn trong `CLAUDE.md`). Hai cái **trần đếm được** được
đặt ra để file không phình lại.

**Tương thích.** Không đổi hành vi app. `test:fast` 1633 bài / 0 fail / `# skipped 1` ·
`test:cross` 3/3 · lint sạch · build thành công.

---

## 2026-09-06 (vòng 35) — Một cái kết duy nhất, không nút nhận, không màn chết (ADR-070)

**Mục đích.** Lệnh Đàm *"Tiếp tục … tự quyết định mọi thứ và tech debt. Build lớn. Simplify mạnh.
Làm game vui hơn. Tập trung nhiều hơn vào UX/UI."* Sau ADR-069 còn bốn chỗ phần thưởng ĐÃ ĐẠT mà vẫn
cách người chơi một cái nút hoặc một cánh cửa khoá; vòng này xoá cả bốn.

**Đã đổi.**
1. **Tự chốt bước tuần · thưởng trọn ngày tự vào** ngay trong `completeFocusSession`, cộng vào XP
   phiên, kể ở chuỗi thẻ (thẻ «Bước tuần» mới; thẻ Nhiệm vụ ghi «Trọn ngày +N XP — đã cộng»). Xoá
   nút «Chốt bước»/«Nhận» và hai action. Phép đối chiếu nhiệm vụ với lịch sử đi theo về store.
2. **Di vật lớn theo PHIÊN**: mỗi 20 rồi 50 phiên ≥25′ kể từ lúc nhận là lên một bậc — không còn giá
   tinh luyện của kỷ đã qua (cơ chế từng chết vĩnh viễn, `#96`). Kho di vật hiện thanh «N/20 · còn
   M»; chuỗi thẻ thêm thẻ «Di vật lên bậc». Save cũ được đóng dấu `earnedAt` lúc nạp.
3. **Đặc quyền công trình về trục sống**: 11/15 kỳ quan thôi hứa RP/tinh luyện/thảm hoạ/tài nguyên,
   nay là +XP/+EP/+giờ combo/+XP phẳng (có ngưỡng phút); rương ngày/rương sâu trả XP; `safety_net`
   thành «phiên bù sau khi huỷ». Chip «+N EP» ở thẻ +XP để buff EP nhìn thấy được.
4. **Xoá `LootDropModal`** (1.057 dòng): chuỗi thẻ là cái kết duy nhất, kể cả khi lên kỷ — thẻ «Kỷ
   nguyên mới» có nút «Xem thành phố mới». Không còn «Xem chi tiết», tiếng chỉ kêu một lần.
5. **Huy hiệu**: khối «Kế tiếp» (4 huy hiệu gần đạt nhất, thanh + «còn N»), dải hero nói «còn N»;
   bỏ bộ lọc bậc; gỡ thẻ-hàng chết. Dọn chữ đồng tiền ngủ ở Thống kê/Thăng hoa/Onboarding.

**Ảnh hưởng / tương thích.** Không đụng Thành phố; không migration (một trường mới `relics[].earnedAt`
được đóng dấu khi nạp). `pendingReward` +5 trường. Đóng `TECH_DEBT #96 · #98 · #100`, cập nhật `#99`.
Chi tiết + lý do: `ARCHITECTURE_DECISIONS.md` ADR-070.

---

## 2026-09-06 — Đồng tiền duy nhất là PHIÊN (ADR-069): công trình một nút, bậc và thử thách kỷ tự chạy, kỹ năng chọn ngay lúc lên cấp

**Mục đích.** Lệnh Đàm *"SIMPLIFY. MINIMIZE. AMPLIFY FUN."*: coi Upgrade + Progression + UX/UI là
một sản phẩm phải thiết kế lại; xoá cơ chế chỉ tồn tại vì đã được code; không đụng Thành phố.
Đo trên tài khoản thật: xây MỘT công trình phải qua BA cổng và BỐN loại tiền mà RP dư 8,5 lần,
nguyên liệu dư 14 lần — các cổng chưa bao giờ đóng, chúng chỉ để bấm qua.

**Đã đổi.**
1. **Công trình một màn, một nút** — `BuildScreen` thay Xưởng + Bản vẽ (1.649 dòng, 2.376px):
   Đang xây · **Xây tiếp** (≤3 lựa chọn, "Khởi công") · Đã xây · Trùng tu. Không còn RP, bảng
   giá nguyên liệu, tinh luyện, nâng cấp, huy hiệu loại/hiếm trên từng thẻ. Cái giá = N phiên + ô
   hàng chờ. Store: `startProject`.
2. **Bậc tự thăng** theo lịch sử (đủ EP gác + đủ phiên dài trong 48 giờ) — không nút, không hạn,
   không phạt. **Khủng hoảng kỷ thành nhiệm vụ mềm**: không hộp thoại, không chặn nút Bắt đầu,
   không hạn; qua thì di vật vào túi. Hộp thoại khủng hoảng và hộp "mất N% tài nguyên" **xoá hẳn**
   (`EraCrisisModal.jsx` · `DisasterModal.jsx`).
3. **Chuỗi thẻ thưởng** thêm: thẻ Thành phố (công trình nhích một nấc / "hàng chờ trống — chọn
   ngay"), thẻ lên cấp **mời chọn ≤3 kỹ năng ngay tại chỗ**, thẻ thử thách kỷ, thẻ bậc, thẻ di vật.
4. **Dọn nhiễu**: thẻ Kho tài nguyên (trùng thanh EP) gỡ; "Tăng lực phiên" (cược EP) rời màn chờ;
   hộp xác nhận mua kỹ năng bỏ; "Tổ hợp kỹ năng" gấp; thẻ Bậc chỉ kể hai điều kiện; đầu thẻ "Bản đồ
   kỹ năng" và mục "Xây tiếp" rỗng thôi nói lại điều dải mở đầu vừa nói; ô công trình đã xây kể ĐẶC
   QUYỀN thay cho "Lv.2 · ×1.75".
5. **Mọi phần thưởng nằm trên trục sống** (phát hiện khi soi ảnh: thẻ Thăng bậc in "+12% Tài
   Nguyên"): bậc lẻ → **+N% EP**; 12/15 di vật → **EP / XP / giờ combo** theo chủ đề (tăng trưởng →
   EP, tri thức → XP, che chở → combo); ba kỹ năng Vận May quay ra **+XP/+EP** thay vì nguyên
   liệu/tinh luyện (chip «🍀 Vận may» ở thẻ +XP); Sự Tha Thứ → **+6% XP cho phiên kế sau khi huỷ**.
   Hộp xác nhận huỷ thôi doạ "phạt N% tài nguyên". Khoá bằng `rewardAxes.test.js`.

**Tương thích.** Không đổi state đồng bộ, không migration, không đụng Thành phố (giàn giáo, bảo
tàng, ADR-007 nguyên). Tài nguyên/RP/tinh luyện vẫn cộng nhưng không còn cổng tiêu — dữ liệu
ngủ, ghi `TECH_DEBT #99`. `startCrafting`/`researchBlueprint` giữ cho test + dữ liệu cũ.

## 2026-09-05 — Cách mạng vòng lặp chính (ADR-068): chuỗi lên đầu, nhiệm vụ về cạnh nút Bắt đầu, và một cái KẾT cho mỗi phiên

**Mục đích.** Lệnh Đàm: *"làm một cuộc cách mạng về upgrade… ứng dụng UX Psychology đằng sau các
app khiến người dùng không thể ngừng dùng… không đụng Thành phố."* Các cơ chế đã có đủ; thứ thiếu
là CHỖ ĐỨNG: chuỗi và nhiệm vụ ở sau tab hoặc sau `lg:`, và cái kết của một phiên là một thẻ toast
4 giây ở góc màn hình.

**Đã đổi (ba chỗ, cùng một vòng lặp).**
1. **Màn Tập trung mở đầu bằng `TodayHero`**: số ngày chuỗi · "+N% XP/phiên" · **dải bảy ngày
   T2→CN** · mốc chuỗi kế tiếp; chuỗi đang treo thì hiện *"Làm một phiên để giữ chuỗi"*. Lời chào
   hạ xuống một dòng nhỏ. Ô "Hôm nay"/"Chuỗi" ở thanh tiêu đề ẩn ở tab này; hai thẻ cùng tên ở cột
   phải desktop gỡ hẳn.
2. **Nhiệm vụ ngày nằm ngay dưới đồng hồ** (điện thoại/tablet; desktop giữ cột phải). Tab
   "Nhiệm vụ" thành **"Tiến trình"** (nhịp tuần · tài nguyên · hạng) trong menu "Thêm" ⇒ thanh dưới
   iPhone còn **4 nút**. Id `missions` giữ nguyên cho thông báo đã lưu.
3. **Chuỗi thẻ thưởng sau MỌI phiên** (`SessionRewardStory`): +XP đếm lên → 🔥 chuỗi với ô hôm
   nay bật lên trên dải bảy ngày → nhịp hôm nay 2/5 chạy thanh → nhiệm vụ tick ✓ (nút "Nhận thưởng
   trọn ngày" ngay tại chỗ) → lên cấp → kỷ mới. Chạm để lật, tự lật, bỏ qua một chạm. Hộp thoại chi
   tiết 7 giai đoạn chỉ còn mở khi lên kỷ hoặc bấm "Xem chi tiết".

**Kèm.** Thẻ "Thưởng trọn ngày"/"Thưởng chuỗi tuần" bị bóp tên thành *"Th / ch / tua"* khi có cả ô
XP lẫn nút — nay XP đi vào nút hoặc chỉ đứng một mình. `scaleMissionXP` + thưởng trọn ngày dùng
chung ở `components/missionXp.js`; `useCountUp` tách ra `lib/`. Cửa soi thêm `dc-preview-card`.

**Tương thích.** Không đổi luật tính thưởng, không đổi state đồng bộ, không đụng Thành phố. Tài
khoản cũ không cần migration. ADR-060 đảo ngược MỘT NỬA (vế toast-sau-mọi-phiên) — xem ADR-068.

---

## 2026-09-05 — Một lỗi thật ở thanh nhiệm vụ, và hai móc dopamine bị nói quá nhỏ

**LỖI THẬT: cùng một nhiệm vụ, hai công thức tiến độ, trong cùng một file.** Loại nhiệm vụ
`singleSession` ("Hoàn thành 1 phiên ≥30 phút") được tính ở HAI đường trong `gameStore.js`, cách
nhau ~1.300 dòng: đường **sống** (ngay sau khi chốt phiên) ăn-cả-hoặc-không
(`minutesFocused >= goal ? goal : progress`), còn đường **dựng lại từ lịch sử**
(`getDailyMissionProgressFromSnapshot`) thì liên tục (`min(goal, maxSessionMinutes)`).
⇒ Làm một phiên 22 phút thì thanh ghi **0/30**; tải lại app thì **chính nó** ghi **22/30**. Cùng
một ngày, cùng một dữ liệu, hai con số. Không cổng nào bắt được: build xanh · lint sạch · test
xanh; triệu chứng duy nhất là một con số tự đổi khi mở lại.

Nay đường sống dùng cùng phép LẤY MAX. **Luật hoàn thành không đổi một chút nào** — `progress` chỉ
chạm `goal` khi có MỘT phiên đủ dài (ba phiên 25 phút vẫn ra 25/30, vẫn chưa xong). Cái được thêm
là một số 0 chết biến thành con số biết nói: *"22/30"* bảo Đàm còn thiếu 8 phút.
Khoá bằng `missionProgressAgreement.test.js` (4 bài, đã thử-cho-đỏ), gồm cả vế canh đường dựng lại
để không ai "thống nhất" hai bên theo chiều ngược.

**Dòng hệ số nhân: từ tiếng thì thầm thành tiếng nói.** Chip cạnh đồng hồ báo *"còn 1' để ×1.3"*
bằng `text-[10px] opacity-60` — mờ hơn cả nhãn bậc ngay bên cạnh. Đó là móc dopamine TỨC THÌ mạnh
nhất màn hình (phần thưởng của chính phiên sắp bấm tăng gần một phần ba, thu được trong 26 phút
tới). Nay 11px, đậm, màu nhấn: **"+1′ nữa là ×1.3"**.
⚠️ **Và con số thường là 1**: preset "Chuẩn" dài **25 phút** trong khi
`DEFAULT_DEEP_FOCUS_THRESHOLD = 26` ⇒ ở nhịp mặc định Đàm hụt ×1.3 **đúng một phút, mỗi phiên**.
Đó là quyết định CÂN BẰNG GAME nên KHÔNG tự sửa — chỉ làm cho nó nhìn thấy được.

**Dòng khoảnh khắc xếp lại theo TÍNH CẤP THIẾT, không theo độ lớn phần thưởng.** Bản trước xếp
tổng-kết-tuần trên mốc-chuỗi và đếm-ngược-chặng, nên trên máy thật (tài khoản ở **1.831/1.867 EP**)
câu *"Còn ~2 phiên nữa tới «Khám Phá Tân Thế Giới»"* bị nuốt bởi một lời mời đi đọc chuyện tuần
trước. Phép thử phân định: ***câu này có làm Đàm bấm Bắt đầu không?*** Nay: ăn mừng → lý do bấm Bắt
đầu (mốc chuỗi, đếm ngược chặng) → lời mời đi xem chỗ khác. Tổng kết tuần **không mất**: cờ chưa-xem
không hết hạn, và chấm ở nút "Báo cáo tuần" là lưới an toàn thứ hai (ADR-061).

**Đã ĐO rồi TỪ CHỐI một hướng**, ghi lại để phiên sau khỏi thử lại: nhãn bậc trên thẻ phần thưởng
(`•••○ TỐT`) trông như hằng số vô nghĩa vì mọi bên gọi đều truyền cứng — nhưng trên **cùng một màn**
thẻ ngày là `tot` còn thẻ tuần là `hiem`, tức nó phân biệt được hai thứ đứng cạnh nhau. Giữ.

**Sửa một ghi chú cũ nguy hiểm trong `START_HERE.md`**: nó ghi van ép chuyển skin "chưa làm" trong
khi việc ấy đã xong từ 2026-08-29 (version 9 + `resolveSkinAfterMigration`). Để nguyên thì phiên sau
sẽ ép skin lần thứ hai và **đè lên lựa chọn có ý thức của Đàm**.

**Ảnh hưởng.** Một sửa lỗi ở store (không đổi luật hoàn thành, không đổi phần thưởng), hai đổi giao
diện. Không migration.

---

## 2026-09-05 (vòng 32) — Đóng #43, và năm bản chép của một lỗi

**Mục đích.** Đóng mục nợ phi-đồ-hoạ dễ đóng nhất còn lại, rồi đi hết cái họ lỗi đã tìm thấy ở
vòng 31b.

**Phạm vi.**
- **`TECH_DEBT #43` ĐÓNG.** `src/engine/city3d/triangleBudget.test.js` — bảng 15 mốc tam giác riêng
  từng kỷ, chạy dưới 1 giây trong `npm test`, không cần Chromium. Cột tam giác nay có cổng canh
  đúng như cột lệnh vẽ, nên nó thôi trôi trong im lặng.
- **Năm bản chép của một hình dạng lỗi**, trong bốn file: luật *"đặc quyền này chỉ tính khi công
  trình là KỲ QUAN"* bị bỏ ở tầng giao diện. Gom hết về `engine/wonderEffects.js`.
- Luật **bệ kè** cũng có bốn bản chép; gom về hai hàm thuần ở `parts.js`.

**Ảnh hưởng.** Không đổi một luật chơi nào, không đổi hình học (kỷ 6 vẫn 198.388 tam giác sau khi
gom). Một lệch THẬT đã vá: giá tiến hoá di vật hiện 0 trong khi store trừ 1.

**Tương thích.** Hoàn toàn tương thích ngược.

---

## 2026-09-02 (vòng 31b) — Ba lỗi thật cùng một họ: "CÓ" không bằng "LÀM ĐƯỢC"

**Mục đích.** Sau khi bắt được một lời hứa sai ở dải mở đầu tab Kỹ năng, đi tìm cùng hình dạng ấy
ở chỗ khác.

**Phạm vi.** Ba lỗi, một nguyên nhân gốc — luật sống inline trong tầng giao diện nên tầng khác
không thấy nó và tự nghĩ ra một điều kiện lỏng hơn:

1. Dải mở đầu tab Công trình đếm bản vẽ ĐÃ MỞ thay vì bản vẽ KHỞI CÔNG ĐƯỢC (không kiểm nguyên
   liệu, không kiểm ô hàng đợi).
2. Cái chuông · cái chấm · dòng "việc tiếp theo" so SP với giá GỐC của kỹ năng, trong khi store
   trừ giá đã giảm nhờ cộng hưởng di vật — sai đúng ở 6 kỹ năng Tinh Hoa.
3. Giá RP nghiên cứu có ba bản chép tay; bản ở tầng giao diện thiếu phép kiểm `type === 'wonder'`
   và thiếu sàn 1 RP.

**Ảnh hưởng.** Không đổi luật chơi, không đổi con số cân bằng. Ba module THUẦN mới dùng chung:
`engine/craftReadiness.js` · `engine/wonderEffects.js`. "Hàng đợi đầy" nay là một lý do RIÊNG chứ
không gộp vào "thiếu nguyên liệu", và nút bị khoá trước thay vì cho bấm rồi báo lỗi.

**Tương thích.** Hoàn toàn tương thích ngược.

---

## 2026-09-02 (vòng 31) — Bốn màn ngắn đi 29–39%, cùng MỘT khuôn "lưới + một khung chi tiết"

**Mục đích.** Đàm nói lần thứ ba rằng *"UX/UI và mọi thứ ở hành trang vẫn chưa thấy thay đổi gì …
đừng có quá đo tiểu tiết, nên thực hiện lớn"*. Vòng 28 đã rút ra *"thêm mà không bớt thì không phải
thiết kế lại"*; vòng này áp nó cho bốn màn dài nhất app.

**Phạm vi.**

| Màn | trước | sau | đổi gì |
|---|---|---|---|
| Kỹ năng | 2.231px | **1.957px** | danh sách một-nhánh-một-lúc → **bản đồ 6×6** (cột = nhánh, hàng = độ sâu) |
| Công trình | 4.757px | **2.894px (−39%)** | công trình đã xây thành lưới ô + một khung chi tiết; gỡ 3/5 chip luật RP; thẻ bản vẽ thôi chép 4 trường đã có ở khung chi tiết |
| Huy hiệu | 4.915px | **3.973px** | gấp lại 102 dấu có tiến độ = 0 |
| Tập trung | 2.509px | **1.783px (−29%)** | bảng thiết lập (~1.100px, mở sẵn mọi lần) gấp sau một dòng nói đủ |

Đo ở khung 390px trên fixture đã chơi 6 tháng, bằng `node scripts/shot.mjs --phone --fixture
.shots/fixture.json --full`.

**Ảnh hưởng.** Không đổi một luật chơi nào, không đổi một con số cân bằng nào, không đổi
localStorage/Supabase. Toàn bộ là tầng trình bày. Bốn module THUẦN mới, mỗi cái có test riêng:
`shared/skillMatrix.js` · `shared/buildingGrid.js` · `shared/badgeGroups.js` ·
`pomodoroSetupSummary.js`.

**Một lỗi thật đã sửa kèm:** dải mở đầu Hành trang bật màu nhấn chỉ vì còn điểm kỹ năng chưa tiêu,
rồi viết *"mở thêm một kỹ năng ngay bên dưới"* — với 1 SP trong tay mà ô rẻ nhất giá 3 SP thì đó là
một lời hứa không làm được. Nay nó hỏi đúng câu *"có mở được ô nào không"*.

**Tương thích.** Hoàn toàn tương thích ngược. Mọi khối bị gấp đều mở lại được bằng một nút ghi rõ
còn bao nhiêu — **không giấu, chỉ gấp**.

---

## 2026-09-02 (vòng 30) — Dọn nợ tiếp: #91, #86, và một bản vá TỰ HOÀN TÁC

**Đóng #91** — `sceneStats.test.js` chép tay `12 * 0.8` thay vì đọc hệ số đã dựng, tức khoá một CON
SỐ chứ không khoá cái LUẬT. Suýt cắn thật ở lần gộp nhánh Phase 19–21 (xung đột đúng dòng ấy,
`main` 0,75 · nhánh 0,80). Nay `SHADOW_REACH_RATIO` là hằng số có tên, được export, test import nó.

**Đóng nửa gốc của #86** — 84 chỗ trong 16 file chốt cứng `rgba(201, 100, 66, …)`, đúng terracotta
của skin MẶC ĐỊNH, trong khi `arcade` khai `226, 84, 44` và `inkgold` khai `217, 164, 65`. Tức chúng
chỉ đúng ở **2 trong 10** tổ hợp theme × skin. Nay tất cả đọc `rgba(var(--accent-rgb), …)` — tương
đương tuyệt đối ở skin mặc định, đúng ở bốn skin còn lại. Nửa còn lại (137 nút không dùng
`ActionButton`) **cố ý không sửa**: chính mục nợ đã soi từng cái và kết luận chuyển sang là ĐỔI HÌNH
DẠNG chứ không phải hợp nhất.

⚠️ **#97 — viết một bản vá rồi TỰ HOÀN TÁC, và đó là kết quả đúng.** Chẩn đoán ("phép quét chỉ nhìn
mép NGANG nên mù với mép DỌC") đúng, cách chữa hiển nhiên là quét cột chuyển vị. Viết xong thì nó
**báo oan ngay** trên bài đối chứng có sẵn — vì ảnh thật đầy mép dọc (mép nhà, mép đường), nên một
phép quét cột dùng cùng ngưỡng **về mặt cấu trúc** là cỗ máy báo động giả. Đã hoàn tác và ghi rõ vì
sao, để phiên sau không đi lại con đường ấy.

**Trạng thái nợ: 97 mục · 35 đã đóng (36%) · 62 còn mở** — trong đó **~49 thuộc Thành Phố 3D**.

---

## 2026-09-02 (vòng 29) — Dọn nợ: đóng 5 mục, và một bài học đắt về ba cổng cùng mù

**Đóng:** #92 (mã chết ở tầng giao diện) · #5 (lệch mô tả ↔ hành vi) · #13 & #7 (đã lỗi thời, chưa
ai kiểm lại) · #93 (là QUYẾT ĐỊNH, không phải nợ — đánh dấu lại).

⚠️ **BÀI HỌC ĐẮT NHẤT VÒNG NÀY.** Bật `no-unused-vars` cho `.jsx` ra **54 báo cáo**; tôi tin cả 54
và đi gỡ. Kết quả: **lint sạch · build sạch · 1.524 bài test XANH · và app ra thẳng "RENDER
RECOVERY: motion is not defined"**. ESLint lõi không coi `<motion.div>` là một lần DÙNG biến
`motion`, nên **27/54 là báo nhầm** và chúng nhắm đúng vào những import đang sống. Ba cổng mạnh
nhất của dự án cùng xanh trên một app đã vỡ hoàn toàn — thứ duy nhất bắt được là một **ẢNH CHỤP**.
Vá bằng `react/jsx-uses-vars`; 27 chỗ còn lại là mã chết thật và đã dọn.

⚠️ **#5 — biến một LỜI HẸN thành một CỔNG.** Mục nợ kê đơn *"rà soát định kỳ khi có thời gian
rảnh"* — mà một lời hẹn thì không bao giờ đỏ lên (chính #3 nằm im gần hai tháng để chứng minh).
Nay `descriptionDrift.test.js` đối chiếu con số trong mô tả với ngưỡng thật ở **310 thành tích**;
lần chạy đầu: **0 chỗ lệch**.

**Trạng thái nợ:** 97 mục · **32 đã đóng** · 65 còn mở, trong đó **49 thuộc Thành Phố 3D** (vùng
Đàm dặn không đụng) và **3 chờ Đàm quyết**.

---

## 2026-09-02 (vòng 28) — Hành trang: **bớt trước, rồi mới dựng**

**Mục đích:** Đàm lặp lại y nguyên yêu cầu lần thứ ba — *"UX/UI và mọi thứ ở hành trang vẫn chưa
thấy thay đổi gì"*.

**CHẨN ĐOÁN — và nó chỉ vào chính bản vá vòng trước.** Vòng 27 THÊM một dải hero lên trên một thẻ
đã nói cùng nội dung ("157/360" + "SẮP ĐẠT"), nên màn hình **dài thêm mà không mới thêm**.
⇒ **Thêm mà không bớt thì không phải thiết kế lại.**

**BỚT** — ba chỗ nói cùng một chuyện trên cùng một màn Huy hiệu: thẻ tóm tắt (137 dòng) · danh sách
"Mới đạt gần đây" (62 dòng) · hai danh sách "Đã đạt"/"Chưa đạt" (124 dòng). Và ở Công trình: tiêu
đề "Xưởng xây dựng" (chỗ thứ BA gọi tên màn hình) + sáu chip thông số.

**DỰNG** — 360 huy hiệu thành **một LƯỚI** (`shared/BadgeGrid.jsx`). Bản cũ vẽ mỗi dấu thành một
HÀNG CHỮ đầy đủ cho 360 mục: một bảng tính, không phải bộ sưu tập — dài tới mức chính giao diện
phải thừa nhận *"đang hiện 40/203 mục để giữ giao diện nhẹ hơn"*. Nay mỗi dấu là một ô có màu theo
bậc; ô chưa đạt để xám KÈM vòng tiến độ, và **bỏ luôn phân trang** — một bộ sưu tập chỉ có nghĩa
khi thấy được phần còn thiếu.

| | trước | sau |
|---|---|---|
| lưới huy hiệu bắt đầu ở | — (không có lưới) | **y=589** (từng là y=1398 khi bộ lọc còn mở) |
| `Achievements.jsx` | 977 dòng | **745 dòng** |
| bộ lọc | 13 chip, ~9 hàng, chắn trước bộ sưu tập | một dòng, mở khi cần |

**Ảnh hưởng:** thuần giao diện. Không đụng dữ liệu, không đụng Thành Phố, không đụng công thức.

---

## 2026-09-02 (vòng 27) — Hành trang có bản sắc riêng · đóng 3 mục nợ · 1 bug im lặng cắn 3 lần

**Mục đích:** lệnh Đàm — *"khắc phục toàn bộ tech_debt và sửa lỗi bug… thay đổi lớn hơn nữa, UX/UI
và mọi thứ ở hành trang vẫn chưa thấy thay đổi gì"*.

**HÀNH TRANG.** Vòng 24 gộp 6 màn xuống 3 — một thay đổi về CẤU TRÚC — nhưng phần NHÌN không đổi
một chút nào: cả ba tab vẫn là thẻ trắng trên nền trắng, y hệt mọi màn khác. Nay mỗi tab mở đầu
bằng **một dải hero có màu**: một con số to + đúng một việc nên làm tiếp + thanh tiến độ.
Kỹ năng → *điểm CHƯA TIÊU* (thứ hành động được, không phải số kỹ năng đã mở). Công trình →
*"còn 4 phiên nữa · Cảng Biển Lớn"*. Huy hiệu → *"99% · Biên Niên Sử Nhỏ — gần xong rồi"*.

**NỢ KỸ THUẬT ĐÃ ĐÓNG**

| mục | trước | sau |
|---|---|---|
| **#94** | chờ 3,2 giây vào nghỉ ở **mọi** phiên, kể cả ~82% phiên không có lễ mừng nào | độ trễ đi THEO việc có lễ mừng: 3.200ms / 500ms |
| **#9** | localStorage đầy ⇒ lỗi ném thẳng vào persist, app ngừng lưu | dọn khoá cũ rồi thử lại; hỏng tiếp thì báo, không nuốt |
| **#3** | 3 kỹ năng Thăng Hoa (16 SP) có mô tả hứa hẹn mà **không làm gì cả** | nối dây thật, tất định, có đối chứng |
| **#14** | 95% phiên chỉ nhận *"+20 tài nguyên · +18 RP"* | mọi phiên nói TIẾN ĐỘ: *"Cảng Biển Lớn · còn 4 phiên"* (phần gốc vẫn Open) |

**BUG IM LẶNG CẮN BA LẦN** trong cùng một phiên: chuỗi tra tên bản vẽ bị chép ra ba nơi và sai cả
ba kiểu khác nhau — `.name` (trường không tồn tại ở bảng nào), `.find` trên một OBJECT các mảng, và
`BUILDING_EFFECTS[id].label` (0/75 mục có `label` — nhánh chết ngay từ lúc viết). Cả ba im lặng vì
`??` nuốt gọn. Nay chỉ còn MỘT hàm `blueprintLabel`, **không có nhánh dự phòng nào để giấu lỗi lần
thứ tư**.

**Ảnh hưởng:** giao diện + hai luật kinh tế nhỏ (độ trễ vào nghỉ, đặc quyền Thăng Hoa). **Không**
đụng Thành Phố, **không** đụng công thức tính thưởng mỗi phiên.

**Tương thích:** không có migration. `prestige` thêm hai trường có mặc định.

---

## 2026-09-02 (vòng 26) — Gỡ điểm mù "màn sau khi kết thúc phiên", rồi làm lại nó

**Mục đích:** lệnh Đàm — *"gỡ điểm mù màn hiện ra sau khi kết thúc… đơn giản hơn, dopamine lớn
nhất, không phức tạp, có thể làm lại toàn bộ nếu muốn"*.

**PHẦN 1 — GỠ ĐIỂM MÙ.** Khoảnh khắc dopamine lớn nhất của app là màn DUY NHẤT chưa ai từng soi
được, suốt nhiều vòng. Ba đường vào đều bịt: nó sống trong `state.ui`, mà `ui` nằm ngoài
`partialize` ⇒ gieo `--fixture`/`--ls` không tới; store không lộ ra `window` ⇒ `--probe` không mở
được; bấm "Bắt đầu" thì bị CẤM trên dev. Nay có `src/dev/previewStage.js` + `shot.mjs --preview`.
**An toàn vì đã ĐO**: mọi hộp thoại sau phiên CHỈ ĐỌC `ui`, mọi hành động đóng cũng CHỈ ghi `ui`
⇒ không ghi localStorage, không lên Supabase, không bắt đầu phiên nào.

⚠️ **Và ngay trong lúc gỡ, tìm ra LỜI NÓI DỐI THỨ NĂM của `shot.mjs`:** một tấm ảnh không bắt được
thứ chỉ sống 4 giây. Đo được: thẻ thưởng hiện ở giây **13,5**, tắt ở giây **17,7**; `--settle` thử
0,4 · 1 · 3,5 · 6 · 14 giây đều ra ảnh sạch + probe `false` + không lỗi nào — đọc y hệt *"tính năng
không chạy"*. Vá bằng `--watch "<chuỗi>"` (MutationObserver gắn từ đầu trang + bỏ qua cổng
đứng-yên để chụp đúng lúc nó đang hiện).

**PHẦN 2 — LÀM LẠI.** Nhìn lần đầu thấy ba khuyết tật, cả ba đo được:

| | trước | sau |
|---|---|---|
| di vật **huyền thoại** vs phiên thường | khác nhau **3px vệt màu + mấy chấm + một chữ** | nền pha màu + vệt dày dần theo bậc |
| nhãn bậc trên chiến thắng vừa giành | đóng dấu **"THƯỜNG"** | bậc thấp nhất không dán nhãn |
| tin **kỷ nguyên mới** (hiếm nhất game) | thẻ 299px ở **đáy** trang cao 3.201px | **nhan đề** nói ngay: kỷ nguyên > lên cấp > xong phiên |
| chữ trong màn | 327 chữ · 31 số | **267 chữ** (−18%) |

**Ảnh hưởng:** chỉ tầng giao diện + một module dev mới. **Không** đụng công thức phần thưởng,
**không** đụng Thành Phố, **không** đụng `partialize`. `DailyMissions` không đổi một điểm ảnh
(chỉ dùng bậc `tot`/`hiem`, đã đếm).

**Tương thích:** không có migration.

---

## 2026-09-02 (vòng 25) — Màn "Tập trung" + "Thống kê": gỡ bốn chỗ app **nói dối hoặc im lặng**

**Mục đích:** phần còn lại của lệnh Đàm ở vòng 24 — *"tổng đại tu cho đơn giản, dễ hiểu hơn về
UX/UI của mục Tập Trung, Hành Trang và Thống Kê"*. Hành trang xong ở vòng 24; vòng này làm hai mục
còn lại. Khảo sát song song chỉ-đọc, luật *không số đo = không tính*, rồi sửa TUẦN TỰ.

**CHẨN ĐOÁN GỐC:** màn Tập trung không thiếu tính năng — nó có bốn chỗ **đã viết xong mà không tới
được Đàm**, mỗi chỗ im lặng theo một kiểu khác nhau, nên không chỗ nào lộ ra ba chỗ kia.

| chỗ | trước | sau |
|---|---|---|
| bắt đầu một phiên | **4 thao tác** (bấm nút chỉ-để-cuộn → gõ → cuộn ngược → bấm) | **2 chạm ngay trên nếp gấp** |
| huy hiệu mốc 25/50/75% | tính ra rồi **vứt đi** — cổng `!useMinimalFocusStage` luôn sai lúc phiên chạy | hiện thật, ~25 phút có 3 tín hiệu |
| nhãn vòng đồng hồ lúc thiếu mục tiêu | ghi **"SẴN SÀNG"** trong khi nút cách 200px ghi "Điền mục tiêu →" | **"Chờ mục tiêu"** |
| mục tiêu phiên lúc đang chạy | **không hiện ở đâu cả** (mọi chỗ render gác `isIdle`) | hiện trong vòng đồng hồ, 2 dòng |
| hết giờ nghỉ | im trên **cả ba kênh** (tiếng · thông báo · Web Push) | có tiếng + thông báo, gác cửa sổ 90 giây |
| tab/kỳ hạn ở Thống kê | **1/5 tab và 3/6 kỳ hạn** nằm ngoài màn hình, sau cuộn ngang | xuống dòng, hiện đủ |

**Ảnh hưởng:** chỉ tầng giao diện + một chỗ nối tín hiệu ở `gameStore`. **Không** đụng công thức
phần thưởng, **không** đụng Thành Phố, **không** nới cổng 10 ký tự của mục tiêu phiên.

**Tương thích:** không có migration. Dữ liệu cũ đọc nguyên vẹn.

**Đáng nhớ nhất:** khoảnh khắc hết giờ nghỉ câm trên cả ba kênh cùng lúc — nên *không kênh nào lộ
ra rằng hai kênh kia cũng câm*. Đó là lần thứ ba dự án tìm thấy một hàm viết xong với 0 nơi gọi
(`playMilestone` vòng 22, `playBreakStart` vòng 23, `notifyBreakOver` vòng 25); lần này đã dựng
`notificationReach.test.js` để lớp thông báo cũng được ĐẾM như lớp tiếng.

---

## 2026-09-01 (vòng 24) — Tab "Hành trang": 6 màn sau 3 tầng tab → **3 màn, 1 hàng tab**

**Mục đích:** lệnh của Đàm — *"tối ưu lại tab hành trang và toàn bộ những gì trong đó, làm lại
ĐƠN GIẢN HƠN nhưng vẫn nâng cao độ hứng thú, độ nghiện và dopamin… PHẢI DỄ HIỂU, DỄ CHƠI… có thể
đập đi xây lại"*. Khảo sát bằng 12 nhánh soi song song (chỉ đọc), luật *không số đo = không tính*,
rồi sửa TUẦN TỰ. 6 commit.

**CHẨN ĐOÁN GỐC:** Hành trang là **một bảo tàng của những thứ Đàm KHÔNG có**, nằm sau 3 tầng tab
(4 ở chỗ sâu nhất), nơi phần lớn nút không bấm được. Đo: 6 màn dài **115.864px = 137 màn hình
điện thoại**, 4.808 con số, chỉ 44 nút bấm được — và **2/6 màn có ĐÚNG 0 nút**.

**Số đo trước → sau**

| | trước | sau |
|---|---|---|
| tầng tab | 3 (4 ở chỗ sâu nhất) | **1** |
| màn con | 6 | **3** |
| hàng tab ăn của màn hình | 246px (29,1%) | **38px** |
| tổng chiều dài | 115.864px | **17.754px** |
| màn không có nút nào | 2/6 | **0/3** |
| thành tích hiện tiến độ | 0/360 | **310/360 (86%)** |

**1. Ba hàng tab chồng nhau → một.** Cả ba dùng CHUNG component `SubTabs` nên bo góc, màu nền, cỡ
chữ giống hệt nhau — **không có gì nói hàng nào là cha, hàng nào là con**. Ba màn nay gom theo CÂU
HỎI người chơi đang hỏi: **Kỹ năng** (tôi tiêu điểm vào đâu) · **Công trình** (tôi xây gì tiếp) ·
**Huy hiệu** (tôi đã giành được gì). Ba id tab con GIỮ NGUYÊN nên mọi thông báo đã lưu vẫn trúng.

**2. Xoá tab "Lịch sử."** Dài **98.568px = 117 màn hình**, 4.362 con số, **0 nút**, và **0 thông
báo nào trong game trỏ tới nó** (so với `workshop` 8 chỗ · `blueprints` 4 · `relics` 1). Cùng mảng
`history` ấy đã được màn Thống kê đọc và tóm tắt.

**3. Bản vẽ + Xưởng là một vòng lặp bị cắt đôi** — và app đã tự thú: màn Xưởng in hẳn một câu bảo
người chơi *"Đi sang mục Bản vẽ"*. Nay một màn, Xưởng đứng trước (nơi có việc làm ngay).

**4. 310/360 thành tích nay có tiến độ; trước là 0/360.** 86% số mục chỉ là một phép so ngưỡng đơn
`s.<trường> >= <số>` — con số "còn bao nhiêu nữa" nằm sẵn trong dữ liệu từ đầu, chưa ai lấy ra.
Ngưỡng nay là **DỮ LIỆU** (`dem` + `moc`) và `check` được SINH RA từ chính nó. ⚠️ Cách hiển nhiên
(đọc mã nguồn `check` bằng regex) chạy đúng dưới `node` và **hỏng câm trên production** vì Vite rút
gọn `s.sessionsCompleted` thành `s.a`. Nghiệm thu: 360 mục × 62 ảnh chụp = **22.320 phép so, khớp
từng bit**.

**5. Màn Huy hiệu xếp theo ĐỘ KHẨN CẤP.** «Sắp đạt» ba mục gần nhất lên nếp gấp (*"còn 1 ghi chú"*
· *"còn 751 phút"* · *"còn 11 phiên"*); «Chưa đạt» từ y=7.040 lên **y=2.120** và sắp theo tiến độ
(mục gần nhất từng nằm ở y=9.606 = 11,4 màn hình); «Đã đạt» xuống dưới.

**6. Di vật nói thật.** Khủng hoảng chỉ nổ đúng một lần lúc vượt mốc EP ⇒ **5/12 dòng đã lỡ vĩnh
viễn trong ván này**, mà màn hình gộp cả 12 dưới một câu mời "chinh phục để nhận". Nay tách hai
nhóm, hiện PHẦN THƯỞNG THẬT thay cho "???" (bản cũ dùng 2/7 trường và vứt 5), và thêm thẻ đếm
ngược đọc `triggerEP` — con số ấy trước đây được **0 component** đọc.

**7. Kỹ năng thôi nói dối về giá.** Ô giá in giá LẺ trong khi phải mua cả chuỗi tiên quyết:
**21/32 nút (66%) hiện con số thấp hơn giá thật, tệ nhất 2,3 lần** (ghi "8 SP", thật ra 18 SP ≈
254 ngày). Và 21/32 nút khoá không có một chữ nào nói mình làm gì — mô tả bị THAY bằng "Cần mở: X".

**8. Bấm "Hành trang" rơi vào tab CÓ VIỆC**, hỏi cùng hàm nuôi cái chấm đỏ. Không thêm một chữ nào.

**Tương thích:** không migration, không đổi hình dạng dữ liệu lưu, không đổi một công thức thưởng
nào. Ba id tab con giữ nguyên; `collectionTab` cũ được DỊCH chứ không bỏ qua.

**Ghi nợ cho Đàm quyết:** `TECH_DEBT #96` — tiến hoá di vật là **cơ chế chết** (`evolveRelic` tiêu
tinh luyện của kỷ ĐÃ QUA, mà tinh luyện chỉ rơi vào kỷ đang chơi ⇒ 3/3 nút "Chưa đủ tài nguyên",
vĩnh viễn). Mọi lối ra đều là đổi luật KINH TẾ.

**Cổng:** lint sạch · build xanh · **1484 bài (# skipped 1) · 0 đỏ** (trước vòng: 1453).
33 bài mới, tất cả đã thử-cho-đỏ.

---

## 2026-09-01 (vòng 23) — Hứng thú hơn, hệ thống đơn giản hơn, **KHÔNG lạm phát thông tin**

**Mục đích:** cùng mục tiêu vòng 22, cộng thêm một mệnh lệnh mới của Đàm — *"nhưng không bị lạm
phát thông tin"*. Mệnh lệnh ấy đảo ngược phản xạ mặc định: câu trả lời phải đến từ phép **TRỪ**
(xoá · gộp), không từ việc thêm huy hiệu và thêm chữ. Chín việc; **không việc nào thêm một khái
niệm mới**, và toàn vòng ròng lại là **−242 dòng** mã (27 file, +1.006 / −1.248).

**Phạm vi:** tầng hiển thị + hai tác dụng phụ âm thanh. **Không đổi một luật tính thưởng nào**,
không đụng `completeFocusSession`, không thêm trường nào vào store, không đụng Thành Phố.

**HAI LỖI THẬT ĐANG CHẠY TRÊN PRODUCTION đã được vá:**

**1. Chồng thẻ thưởng che TRỌN thanh điều hướng sau MỖI phiên.** Thanh nav nằm ở y=774–832, còn
`bottom-3` đặt đáy chồng thẻ đúng ở 832 với `z-[48] > z-40`; mỗi thẻ là một `<button>` có
`pointer-events-auto` ⇒ chạm bất kỳ nút nào trong 5 nút đều mở hộp phần thưởng thay vì chuyển tab.
Vá bằng đúng MỘT lớp CSS (`bottom-[calc(env(safe-area-inset-bottom)+82px)]`); đo lại còn 12px hở.

**2. Bước cuối của chuỗi tuần hiện "Đã chốt" và "0%" cạnh nhau.** Hai cột dùng hai công thức cho
cùng một sự thật (`index < chainStepsCompleted` so với `index < chainStepIndex`), mà khi xong chuỗi
thì hai biến ấy lệch nhau đúng 1. Lỗi có ở MỌI độ dài chuỗi và nổ đúng lúc trả thưởng lớn nhất
tuần. Vá hai tầng: **gỡ cột «%»** (nó là hàm của dòng chữ bên trái, cộng thanh tiến độ bên dưới là
ba cách mã hoá một con số) và đưa trạng thái một bước về **một hàm thuần duy nhất**
(`weeklyChainStep.js`) — ba trạng thái loại trừ nhau, nên mâu thuẫn cũ nay **bất khả thi theo cấu
tạo**, không phải nhờ một cái `if`.

**~860 DÒNG MÃ KHÔNG BAO GIỜ CHẠY ĐƯỢC đã bị xoá — ba kiểu chết, chỉ MỘT kiểu `grep`/lint thấy:**
- *(a) không ai tham chiếu* — `setSurgeChoice` · `addBuildingPassiveResources` · `craftTier`
  (0 nơi gọi toàn repo), kéo theo 2 hàm mồ côi và 1 hằng số.
- *(b) chết vì một `return null` đứng trước* — `FocusIntro` mở đầu bằng
  `if (hasFocusSessionInProgress) return null` mà nó là nơi gọi DUY NHẤT của `getFocusIntroCopy`,
  nên cả nhánh "phiên đang chạy" + `getLiveSessionIntroCopy` + 6 bank câu chưa từng chạy một lần.
  Kho câu chào **39 bank/762 dòng → 3 bank/42 dòng**; **giữ nguyên toàn bộ câu tiêu đề** — đó
  chính là phần "bất ngờ mỗi ngày".
- *(c) chết vì một trường vĩnh viễn `null`* — nhánh `surgeOverride` trong `gameMath.js`.

`src/App.jsx` **3.006 → 2.176 dòng**; `gameStore.js` 6.230 → 6.123.

**CHỮ NÓI LẠI CHỮ — bảy màn hình được dọn (mọi con số đo bằng `shot.mjs`, không ước lượng):**
- **Thành tích: 19.059 → 11.739px (−38,4%)** — 48 hộp "ghi chú AI" sinh từ 5 nhánh `if`, tức 48
  bản sao của 5 câu. Câu theo NHÓM vẫn còn, nhưng in MỘT LẦN dưới hàng lọc.
- **Tập trung** — bỏ phụ đề nói lại "Phiên 0/5 hôm nay" ở cách đó 338px; bỏ chuỗi `0/4` khi chu kỳ
  chưa chạy; bỏ viên `×4` (cả 4 preset đều khai `longBreakAfterN: 4` nên trục ấy không phân biệt
  được gì — viết thành điều kiện HỎI THẲNG BẢNG, ngày nào có preset khác thì viên tự hiện lại).
- **Bản vẽ: 2.832 → 2.745px** — ba cái tên cho một màn trong 83px, một cái bằng tiếng Anh.
- **Xưởng: 2.559 → 2.455px** — 3 chip tóm tắt tên đặc quyền đã in nguyên văn trên chính thẻ sinh
  ra nó, cộng một câu luật CHUNG in 4 lần một màn (nay in một lần dưới tiêu đề).
- **Di vật** — 15 chữ "Khoá" trong một danh sách dựng bằng `locked.map(...)`, tức khoá theo cấu
  tạo. ⚠️ **ĐÃ BÁC** đề nghị thay 15 dòng bằng một dòng tổng: mỗi dòng mang một danh từ riêng
  ("??? từ Kỷ Băng Hà") trả lời đúng câu *"cái này rơi ở đâu"*.
- **Cài đặt** — đổi **174 ký tự tả tiếng bằng lời** lấy một cú nghe thử.
- Lịch sử phiên: chip `×N.N` thành đường lui (nó lặp lại bậc ngay bên cạnh); 'JP'/'RF'/'PM' → 🎰/💎/🍅.

**CHỒNG THẺ SAU PHIÊN — cắt chỗ LẶP, giữ chỗ VUI.** Cắt hai nguồn đã có kênh bền VÀ lặp: `rank`
(cùng sự kiện đã đẩy vào chuông) và `mission` (xong gần như mỗi ngày; tab "Nhiệm vụ" là nút 2/5 và
hiện tiến độ sống). **Giữ** `weekly` (một nhịp MỖI TUẦN là thứ đối lập với lạm phát thông tin —
đổi ý sau khi đọc chính bài test của nó) và `achievement` (cái chấm 6px trả lời "có việc", nó
không phải một lời chúc mừng). Ca thường ngày: **2–3 thẻ → 1–2 thẻ**.

**BA KHOẢNH KHẮC CÂM NAY CÓ TIẾNG — dopamine tốn 0 chữ:**
- **chọn gói âm thanh = nghe thử luôn** (gọi SAU `setPack`, nếu không sẽ nghe tiếng gói CŨ);
- **vào nghỉ có tiếng** (`playBreakStart` — 0 nơi gọi từ khi viết ra; đặt ở STORE và NGOÀI
  `set(...)`, vì hàm cập nhật zustand có thể chạy hai lần);
- **năm nút thanh điều hướng nhúc nhích khi bấm** (`usePressMotion()` — tự im khi bật "Giảm chuyển
  động").
Cộng một cổng mới `soundReach.test.js`: mọi hàm `play*` phải có ít nhất một nơi gọi; danh sách
miễn trừ là `assert.deepEqual` nên **tường minh và đếm được** (đúng một mục: `playTick`).

**MÀN TẬP TRUNG — biên an toàn 6px → 45px.** Màn này đã để nút chính chui xuống dưới thanh điều
hướng HAI lần (vòng 19, vòng 20). Nút phụ «Toàn màn hình» chiếm 112/308px và vì nhãn hai chữ xuống
dòng nên chính nó quyết định chiều cao 59px của cả hàng; gỡ ở nhánh CHỜ (giữ ở ĐANG CHẠY và TẠM
DỪNG). Nút chính **188×59 → 308×42**; biên tới thanh nav 32 → **71px** hôm nay, ~6 → **45px** ở
tiêu đề dài nhất (63 ký tự = 3 dòng).

**Tương thích:** không có migration. Không đổi hình dạng dữ liệu lưu, không đổi một công thức
thưởng nào; mọi thứ đã kiếm được giữ nguyên.

**HAI VIỆC GIÁ TRỊ CAO ĐÃ TỪ CHỐI LÀM và ghi lại cho Đàm quyết** (`TECH_DEBT #94`, `#95`):
- **#94** — `BREAK_START_DELAY_MS` chờ 3,2 giây ở **~82%** số phiên không còn lễ mừng nào để che
  (31,4 phút trong 180 ngày). Tiền đề của hằng số ấy chết do HAI bản vá ở chỗ khác. Chưa sửa vì nó
  đụng thẳng luồng tự-vào-nghỉ — sai một lần là **âm thầm ăn bớt giờ nghỉ thật** — và khoảnh khắc
  ấy KHÔNG chụp ảnh kiểm được trên bản dev.
- **#95** — xây một công trình phải qua **BA cổng tiền tệ**, cả ba đều là hàm của số phút. Kho thô
  thừa **14 lần** nhu cầu. Gộp hay bỏ một loại tiền là đổi luật KINH TẾ, không phải đổi hiển thị.

**Nguyên tắc an toàn giữ nguyên từ vòng 22:** *đơn giản hoá thứ Đàm THẤY và CẢM, đừng xoá thứ Đàm
đã KIẾM ĐƯỢC.*

**Cổng:** lint sạch · build xanh · **1453 bài (# skipped 1) · 0 đỏ** (trước vòng: 1431).
22 bài mới, tất cả đã thử-cho-đỏ.

---

## 2026-09-01 (vòng 22) — Hứng thú hơn, hệ thống ĐƠN GIẢN hơn

**Mục đích:** nâng tỉ lệ *hứng thú ÷ độ phức tạp*. Nguyên tắc an toàn của cả vòng: **đơn giản hoá
thứ Đàm THẤY và CẢM, đừng xoá thứ Đàm đã KIẾM ĐƯỢC.** Bảy việc; không việc nào thêm một khái niệm
mới cho người chơi, và ba việc là XOÁ hoặc HẠ.

**Phạm vi:** chỉ tầng hiển thị + một bảng giá. **Không đổi một luật tính thưởng nào**, không đụng
`completeFocusSession`, không thêm trường nào vào store, không dùng localStorage mới.

**1. Cây kỹ năng: 336 SP → 138 SP.** 36 nút, giá theo hạng 3/7/14/22 → **2/3/5/8**. Ở nhịp
~80 SP/năm thì mở trọn cây đi từ **15,9 năm xuống ~1,7 năm**. Cây cũ mua được +5,1% XP trong khi
chỉ cần kéo dài phiên đã cho +103% — tức nhánh tiến trình này gần như không đáng theo.

**2. Sự kiện của phiên lên MẶT thẻ tổng kết.** 63% số phiên sinh một sự kiện có tên, icon và câu
chuyện riêng (+15–30% XP), nhưng nó chỉ được vẽ bên trong `LootDropModal` — hộp thoại ấy sau
ADR-060 chỉ tự mở khi LÊN KỶ, tức **1,2%** số phiên. ~358 câu chuyện đã tính, đã cộng XP, rồi bị
xoá không ai thấy; thẻ thì nói "🎁 Phiên đã xong" ở cả 579 phiên.

**3. Lễ mừng thành phố chỉ chạy khi có công trình MỚI.** Trước đó nó chạy 3,2 giây sau MỌI phiên
để khoe một dòng chữ vốn luôn hiện sẵn trên màn hình — **30,9 phút chờ trong 579 phiên**.

**4. 513 biểu tượng vẽ tay lên được màn hình.** Dữ liệu đã có sẵn biểu tượng cho 360 thành tích,
75 bản vẽ, 36 nút kỹ năng, 15 di vật, 14 nhóm, 7 cộng hưởng, 6 loại việc — nhưng mọi màn sưu tập
hiện ký hiệu 2 chữ cái ("NH" · "VC" · "XĐ" · "RL"). `getGlyph`/`hasGlyphIcon` (`utils/labelMark.js`)
dùng biểu tượng khi có, rơi về ký hiệu tắt khi không (loại việc Đàm tự tạo ghi `icon: ''`).
`ACHIEVEMENT_TIERS` là bảng duy nhất thiếu `icon` — đã thêm.

**5. Huy hiệu hệ số gọi tên vách KẾ TIẾP.** Bản cũ chỉ nói được "còn N phút để ×1.3" rồi câm ở
**75,2%** số phiên, mà im đúng khúc đáng nói nhất: **117 phiên** dừng trong 45–59 phút, chỉ còn
1–15 phút nữa là chạm ×2.0 (bậc nhảy lớn nhất thang, +54%).

**6. Mốc chuỗi 7/14/30 nay có thẻ ăn mừng + tiếng chuông.** `soundEngine.playMilestone()` xưa nay
có **0 nơi gọi**. Chống lặp không cần state mới: `streakMissionXP` đã là tín hiệu một-lần-mỗi-ngày,
và ngưỡng 7 của nó nằm đúng dưới cả ba mốc.

**7. Rương Lớn và tinh luyện được gọi tên trên thẻ** (10,1% và 28,8% số phiên); và bỏ dòng
"Không có jackpot." khỏi bản tổng kết tuần — jackpot đòi một kỹ năng Đàm chưa mở, tức nó **không
thể xảy ra**, nên đó là bản tin tuần nào cũng giống tuần nào về một việc không có thật.

**Tương thích:** hoàn toàn ngược tương thích. Hạ giá SP là phép cộng thêm thuần (kỹ năng đã mở giữ
nguyên, SP đã tiêu không đòi lại). **KHÔNG có migration nào cần chạy.**

---

---

## 📚 Entries up to 2026-08 — archived

The **135 older entries** were moved verbatim to
[`docs/archive/CHANGELOG_upto_2026-08.md`](docs/archive/CHANGELOG_upto_2026-08.md) on 2026-09-06 (ADR-075); nothing was deleted. Look one up with
`grep -n '<date>' docs/archive/CHANGELOG_upto_2026-08.md`, or `node scripts/doc-budget.mjs --map docs/archive/CHANGELOG_upto_2026-08.md` for the full index.

<details>
<summary>Titles of the 135 archived entries</summary>

- 2026-08-30 (vòng 21) — Màn Thống kê: một bộ lọc thời gian, và dải "Điều đáng chú ý"
- 2026-08-30 (vòng 20) — Tối giản toàn app bằng fan-out soi song song
- 2026-08-30 (vòng 19) — Nút Bắt đầu lần đầu nằm TRÊN nếp gấp
- 2026-08-30 (vòng 18) — Ba dòng cột mốc gộp thành MỘT dòng biết chọn
- 2026-08-30 (vòng 17) — Công cụ soi giao diện lần đầu bấm được nút chỉ-có-biểu-tượng
- 2026-08-30 (vòng 16) — Nhật Ký và Ghi Chú: gỡ ~800px văn giải thích mỗi màn
- 2026-08-30 (vòng 15) — Báo cáo tuần lần đầu tự mời: một dòng ở màn Tập trung
- 2026-08-30 (vòng 14) — Gỡ 11 nhãn tiếng Anh khỏi Cài đặt, sửa một tên công trình bị cắt cụt
- 2026-08-30 (vòng 13) — Danh sách di vật khoá: 3.000px xuống 700px
- 2026-08-30 (vòng 12) — Bỏ số thứ tự trang trí ở tab Thống kê
- 2026-08-30 (vòng 11) — Fixture lần đầu gieo thành tích, và một thẻ nói-lần-hai ở màn Thành tích
- 2026-08-30 (vòng 10) — Cơ chế thưởng mạnh nhất game lần đầu tới được iPhone
- 2026-08-30 (vòng 9) — Nút chính hết là ngõ cụt: "Cần điền mục tiêu" → "Điền mục tiêu →"
- 2026-08-30 — Tối giản vòng 8: gỡ bốn chỗ "nói lần thứ hai", và sửa ba câu bị cắt cụt
- 2026-08-29 (đêm) — Tối giản: cắt 213px chữ khỏi màn Thành Phố, và sửa một lỗi cắt chữ im lặng
- 2026-08-29 (tối) — Phần thưởng khi TỚI đích, và chuỗi đang treo
- 2026-08-29 (chiều) — Mốc gần hơn: thanh tiêu đề đo CHẶNG, và đếm ngược bằng số phiên
- 2026-08-29 — Mở van skin + dòng "Việc tiếp theo" ở màn Tập trung
- 2026-08-27 (tối muộn) — Báo cáo tuần: lối vào trên iPhone (bổ sung ADR-061)
- 2026-08-27 (khuya) — Bóng tiếp xúc đo từ nền của chính công trình, không từ y = 0
- 2026-08-27 (khuya) — Ba nhịp phủ kín giao diện, và một cổng chặn hồi quy
- 2026-08-27 (đêm) — Phase 21 §1: gộp `main` vào nhánh Phase 21, gỡ hai va chạm số
- 2026-08-27 (tối) — Một ngôn ngữ hình cho mọi phần thưởng, và phân tầng mức độ làm phiền
- 2026-08-27 (tối) — Thanh tài nguyên: ba con số cộng một thanh tiến độ
- 2026-08-27 (tối) — Đồng hồ Pomodoro trả lời hai câu hỏi thay vì một
- 2026-08-27 (khuya) — Điều hướng chính từ 8 mục xuống 5: gộp, không xoá
- 2026-08-27 (tối) — Mọi chuyển động của app về đúng BA NHỊP
- 2026-08-27 (chiều) — Nút hành động nghe theo skin, và có cảm giác bấm lún xuống
- 2026-08-27 — Skin thứ 5 "Sân Chơi" (arcade), đặt làm mặc định
- 2026-08-24 (khuya) — PHASE 21: hợp nhất hai nhánh, và bàn cờ trở thành một mốc lịch sử (ADR-064, ADR-065)
- 2026-08-24 (đêm) — Quy trình làm việc: cắt 6.323 dòng bắt buộc đọc xuống 55
- 2026-08-24 (chiều) — MỖI KỶ MỘT MẠNG ĐƯỜNG RIÊNG: hết bàn cờ, có giao lộ thật (ADR-059)
- 2026-08-24 — Đường phố biết uốn cong, và mạng đường có ba hạng (ADR-058)
- 2026-08-24 (tối) — Chân có đầu gối THẬT: giải bằng khớp ngược, 14 kiểu đi, 9 khuôn tròn hơn
- 2026-08-24 — Cư dân thôi đi như robot: 9 kiểu đi, co gối giả, và khuôn cơ thể hết phẳng
- 2026-08-23 (tối) — Cơ thể cư dân thôi là chồng gạch: 7 khuôn mặt tròn xoay, mỗi kỷ một bộ
- 2026-08-23 (chiều) — Con người có bản sắc ở đủ 15 kỷ; và một cái nón lá màu đen đã tố cáo hai lỗi
- 2026-08-23 — Dọn ba thứ trước khi deploy: bài test đỏ vĩnh viễn, luật gộp `main`, và một lý do đi sau con số
- 2026-08-24 — Phase 20: BỎ LƯỚI CỨNG, bộ xương thành phố SINH THEO KỶ (ADR-066)
- 2026-08-24 — Phase 19: khối kiến trúc, bóng đổ, khung hình (ADR-062/063/061)
- 2026-08-22 — Cư dân có KHỚP XƯƠNG, và kỷ 1 có bản sắc con người riêng (ADR-053)
- 2026-08-21 — Phase 14 §1(3): một ô không phải một căn nhà, một ô là một KHU PHỐ (ADR-052)
- 2026-08-21 — Phase 14 §1(2): kim tự tháp có hình chóp, ziggurat có thềm (ADR-051)
- 2026-08-21 — Phase 14 §1(1): mạng đường thôi đứt nét — 13,9–34,4% mặt đường chưa từng được vẽ (ADR-050)
- 2026-08-21 — Phase 13 VIỆC B: vùng phụ cận của đô thị (ADR-049)
- 2026-08-21 — Phase 13 §2–§3: đo mốc nền «quy mô», hai điều kiện DỪNG kích hoạt
- 2026-08-21 — Nhớ lại giá trị nút lưới nhiễu: vá một **hồi quy hiệu năng 1,7 lần** do ADR-046 (ADR-048)
- 2026-08-21 — Xoá **cái bệ**: thành phố nằm TRONG đồng bằng, không ngồi TRÊN nó (ADR-046, ADR-047)
- 2026-08-20 — Đất thôi "nhàu": nhiễu bẻ cong level set, mỗi kỷ có một hướng thấp (ADR-045)
- 2026-08-20 (mới nhất) — GỘP `main` + KỶ 5 THÔI LÀ HÒN ĐẢO
- 2026-08-20 — NGHIỆM THU BƯỚC C: cái thước sai, không phải cái cổng sai
- 2026-08-20 — BƯỚC C: mặt nước trải ra 14/15 kỷ, chỉ kỷ 1 còn khô (ADR-042)
- 2026-08-20 — `worldYaw`: xoay TỜ GIẤY, không xoay thế giới (ADR-041)
- 2026-08-19 — Mặt nước: sông ở kỷ 12, biển ở kỷ 14 (ADR-040)
- 2026-08-19 — Bảng địa thế 15 kỷ: thành phố nằm ở đâu và vì sao (ADR-039)
- 2026-08-19 — Bỏ "cái khay": thành phố có vùng quê bao quanh (ADR-038)
- 2026-08-19 (cuối) — Mảng phủ đất: đất trống thôi là một tấm thảm xanh trơn (ADR-037)
- 2026-08-19 (sau) — Ảnh nghiệm thu thôi bị xén: chụp đúng hộp bao canvas, và chụp thành dải (ADR-036)
- 2026-08-19 — Đo mật độ nhà, và ba lớp vá cho chính phép đo
- 2026-08-18 — Cận cảnh chữa va chạm bằng cách LÙI RA, không phải NGẨNG LÊN (ADR-035)
- 2026-08-18 — Chạm vào một khu phố thì camera bay tới ngắm gần (ADR-034)
- 2026-08-18 — Vỉa hè thôi bị bóp trong im lặng (ADR-033, đóng `TECH_DEBT #42`)
- 2026-08-18 — Phase 12: đường sá thôi lởm chởm — mép ngang và mặt cắt dọc (ADR-031 + ADR-032)
- 2026-08-18 — Phase 11: mái thôi là một tấm phẳng trơn — ống khói, bồn nước, cửa sổ mái, đường nét mái (ADR-030)
- 2026-08-18 — Phase 10: tầng trệt cho cả 15 kỷ; và cổng lệnh vẽ thành BẢNG 15 MỐC (đóng `TECH_DEBT #36` + `#38`)
- 2026-08-16 — Phase 9D: đường phố thành một HỆ THỐNG, bản sắc chuyển từ màu sang cấu trúc (đóng `TECH_DEBT #30` + `#27`)
- 2026-08-16 — Công cụ đo: bỏ hẳn proxy "mái", khôi phục phép chấm 15 kỷ (`TECH_DEBT #22` + `#19`)
- 2026-08-15 — Phase 9B: bóng đổ thôi là mảng đen tuyệt đối
- 2026-08-15 — Thế giới không kết thúc ở rìa thành phố: chân trời theo kỷ (Phase 9A)
- 2026-08-15 — Cây thôi là hình nón trên que: thảm thực vật có ngữ pháp 15 kỷ (Phase 8D)
- 2026-08-15 — Mặt đất thôi là bàn cờ: một tấm lưới liền thay 144 khối hộp (Phase 8C)
- 2026-08-15 — Cạnh vát: khối thôi sắc như dao, và một bài test đã hứa suốt 6 tháng (Phase 8B)
- 2026-08-15 — Tường thôi phẳng: chân tường, gờ mái, gờ tầng, bệ cửa sổ (Phase 8A)
- 2026-08-15 — Mặt đường theo thời đại, và con đường tàng hình ban đêm (Phase 7D)
- 2026-08-15 — Nhà dân: thành phố có người ở (Phase 7C)
- 2026-08-14 — Mặt đất có cao độ: 15 kỷ, 15 vùng đất (Phase 7B)
- 2026-08-14 — Vật liệu thật: đá ra đá, kính ra kính, kim loại ra kim loại (Phase 7A)
- 2026-08-14 — Đường vành đai, và câu báo nói ra đúng con đường vừa mở (Phase 6C)
- 2026-08-14 — Mái nhà là VẬT LIỆU LỢP, không phải màu nhấn giao diện (Phase 6B)
- 2026-08-14 — Chữ ký kiến trúc: mỗi kỷ một công trình có thật (Phase 6A)
- 2026-08-14 — Xưởng trống không còn nghĩa là im lặng (Phase 5D)
- 2026-08-14 — Đường sá thành mạng lưới thật (Phase 5C)
- 2026-08-14 — 15 kỷ, 15 dáng nhà, 15 đất nước (Phase 5A + 5B)
- 2026-08-13 — Trùng tu di sản: xây bù công trình của kỷ đã qua (ADR-012)
- 2026-08-13 — Điểm tổng bảo tàng: một con số đã viết xong nhưng chưa từng lên màn hình
- 2026-08-13 — Công cụ chấm bản quét từng bịa ra 5 lỗi không có thật
- 2026-08-13 — Quét đủ 15 kỷ × 6 chặng, và lần đầu CHẤM được bản quét bằng số
- 2026-08-13 — Đánh bóng chữ trên màn hình: bốn chỗ hiện sai, và bốn kiểu nói dối của công cụ đo
- 2026-08-13 — Di sản dang dở: công trình xây dở của kỷ cũ không còn bốc hơi khi lên kỷ
- 2026-08-13 — Quét lại 15 kỷ × 6 chặng: con số "0/105" trong tài liệu là số của vùng tối
- 2026-08-13 — Trọn vẹn kỷ: mỗi kỷ có 5 công trình, và giờ Đàm nhìn thấy con số 5 đó
- 2026-08-13 — Ba kỷ cuối cùng cũng có mái mang màu của chúng (105/105 cặp kỷ phân biệt được)
- 2026-08-13 — 15 kỷ: bớt được ba cặp thành phố trông giống hệt nhau
- 2026-08-13 — Sáu chặng ngày, sáu bức tranh: bình minh thôi trùng khít hoàng hôn
- 2026-08-13 — Trang chủ: app thôi mắng Đàm ngay lúc vừa mở lên
- 2026-08-13 — Công cụ + sửa nhãn: thanh tiêu đề thôi gọi EP là XP
- 2026-08-13 — Trang chủ (Phase 3X): vòng ngày cuối cùng cũng tới được màn hình Đàm nhìn nhiều nhất
- 2026-08-13 — Bền vững (Phase 3W): bầu trời đi theo đồng hồ, và không bao giờ ngả tím
- 2026-08-13 — Mỹ thuật (Phase 3V): trời ban ngày cuối cùng cũng xanh
- 2026-08-12 — UX (Phase 3S): nhìn bằng mắt vào thẻ lễ mừng
- 2026-08-12 — Vòng lặp (Phase 3R): màn thưởng thôi là một hằng số
- 2026-08-12 — Nhịp phiên (Phase 3Q): lễ mừng không còn bị trừ vào giờ nghỉ
- 2026-08-12 — Nhịp phiên (Phase 3P): dựng lưới cho hai con số quyết định nhịp
- 2026-08-12 — Thành Phố (Phase 3O): khoá lời hứa game hoá bằng số
- 2026-08-12 — Thành Phố (Phase 3N): 15 kỷ ra 15 màu mái
- 2026-08-12 — Thành Phố (Phase 3M): đêm không còn là một ô đen
- 2026-08-12 — Thành Phố (Phase 4′-d): test nối phiên thật của store với câu chữ hiện ra
- 2026-08-12 — Thành Phố (Phase 4′-c): lúc bấm Bắt đầu, màn hình nói phiên này để làm gì
- 2026-08-12 — Sửa thứ tự lớp: chuông thông báo nổi trên mọi hộp thoại
- 2026-08-12 — Thành Phố (Phase 4′): 3,2 giây được NHÌN THẤY thành phố lớn lên
- 2026-08-12 — Thành Phố (Phase 3L): nói cho Đàm biết là chạm được
- 2026-08-12 — Thành Phố (Phase 3K): chạm vào công trình để biết nó là ai
- 2026-08-12 — Thành Phố (Phase 3J): thanh chuyển kỷ tự kéo kỷ đang xem vào tầm mắt
- 2026-08-12 — Thành Phố (Phase 3I): bảng "Đang xây" — còn bao xa và đi tới đó để làm gì
- 2026-08-12 — Thành Phố (Phase 3H): công trình đang xây → thành phố lớn lên sau MỖI phiên
- 2026-08-12 — Thành Phố (Phase 3G): quét đủ 15 kỷ × 6 chặng ngày và vá mỹ thuật
- 2026-08-12 — Thành Phố (Phase 3F): thành phố ra trang chủ
- 2026-08-12 — Thành Phố (Phase 3D): thành phố đổi theo giờ trong ngày
- 2026-08-12 — Thành Phố (Phase 3C): ánh sáng Phục Hưng
- 2026-08-12 — Thành Phố (Phase 3B): 75 công trình khác nhau thật + thành phố có người ở
- 2026-08-12 — Thành Phố (Phase 3A): bộ vẽ 3D thật (three.js) + bảng đo hiệu năng
- 2026-08-12 — Thành Phố (Phase 3-2D): tab Thành Phố hiện ra, vẽ bằng SVG
- 2026-08-12 — Thành Phố Pixel (Phase 1–2/6): nền móng thuần + bảo tàng thành phố các kỷ đã qua
- 2026-08-10 — Sửa khoảng trắng thừa trên icon thanh menu Mac
- 2026-07-17 — Giai đoạn A: bản vá C1 (đóng blocker Critical của lớp đồng bộ)
- 2026-07-17 — Giai đoạn A: lưới an toàn đợt 2 (level-up, prestige, streak, skill, sync-retry)
- 2026-07-13 — Giai đoạn A: lưới an toàn test cho đường-tiền + đường-sync + hủy phiên
- 2026-07-12 — Refactor kiến trúc toàn dự án + thiết lập Project Governance Protocol
- 2026-07-11 — Sự cố kép: sync mất dữ liệu + Supabase tự pause + vượt trần Vercel function
- 2026-06-25 — Hoàn tất chuỗi 6 mảng nâng cấp trí tuệ AI Coach
- 2026-06-24 — Chốt AI Coach: chỉ Gemini đám mây, gỡ hẳn Qwen/WebLLM on-device
- 2026-06-20 → 2026-06-24 — Nhiều vòng nâng cấp "bộ não" AI Coach (chuyên gia hoá + chống-bịa)
- 2026-06-20 — "Cộng Hưởng": nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu
- 2026-06-14 → 2026-06-16 — Làm lại giao diện theo hướng "calm focus" + 4 skin + icon riêng
- 2026-06-14 — Khởi động chuỗi nâng cấp gameplay ("upgrade roadmap")

</details>

---


## Ghi chú vận hành

- Mỗi lần hoàn thành một thay đổi ĐÁNG KỂ (không phải mọi commit nhỏ), thêm 1 mục MỚI vào ĐẦU file
  này — ngắn gọn (mục đích/phạm vi/ảnh hưởng/tương thích), không kể lể chi tiết như `BAN_GIAO.md`.
- Nếu thay đổi có một quyết định kiến trúc đáng ghi ADR → thêm cả vào `ARCHITECTURE_DECISIONS.md`
  và trỏ chéo. Nếu có migration thật → thêm vào `MIGRATION.md` và trỏ chéo.
