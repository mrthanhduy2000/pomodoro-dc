> Last update: **2026-09-08** — **ROUND 40: THINGS THAT HAPPEN AND VANISH (ADR-080).**
> Order: *"Build lớn. Simplify mạnh. Làm game vui hơn và đầy dopamine hơn … Ngân sách thứ đứng yên: 0.
> TOÀN QUYỀN."* Five jobs + the gate; everything on `main`. Round 39's counts are untouched.
>
> ### Done
> 1. **Session beats** — `engine/sessionBeats.js` (pure: `planSessionBeats` · `planBreakBeats` · `resolveBeat` ·
>    `sessionPhaseGlyph`), `focus/BeatRipple.jsx`; PomodoroEngine whispers the beat in the ring label
>    (`useRewardMotion`, arc colour, no digit) and mounts the ripple keyed by beat id; the glow warms with
>    `progressPct`; `useTimer` puts the phase glyph in the tab title; the break title reads ☕ / ⏰.
> 2. **Break beats** — same machinery on `breakTotalSeconds − breakSecondsLeft`, colour `--good`.
> 3. **Tiered ending** — `shared/RewardBurst.jsx` (brick · building · rare; particles through
>    `useCustomMotion` inside child components so hook counts stay fixed; deterministic pattern);
>    `BrickRow` new bricks DROP (`useCustomMotion` keyframes, staggered); `SessionRewardStory` mounts the
>    rare burst behind rare cards and the brick/building burst behind the project glyph.
> 4. **Lucky brick** — `rollLuckyBrick` (+ constants), rolled in `assembleSessionReward` after the perk
>    advance with the injected `random`, skipped when a building just finished; `describeSessionBrick`
>    reads `luckyBrickId` (headline «Gạch đôi — hôm nay may!», two fresh bricks, `lucky` flag);
>    `buildProjectCard` passes it; the card shows a 🍀 chip. Preview scenes `loot-lucky` / `loot-built`
>    use `QUEUE_HEAD`, resolved in `buildPreviewUi(scene, state)`; `shot.mjs --card <id>`.
> 5. **Leftovers** — `rewardTiers.js` colours muted · accent2 · accent · ink; `EraSwitcher` wraps
>    (scroll effect deleted, `cityRenderers.test.js` rewritten); era colours on the City tab kept
>    (decision in ADR-080); clock subline unchanged.
>
> ### Gates
> lint clean · build green · `npm run test:fast` 1,623 tests · 1,622 pass · 0 fail · 1 skipped (`# skipped 1`).
>
> ### Lessons
> - **A line printed with `cut -c1-170` is not the file.** Two edit anchors failed on a trailing
>   `aria-hidden="true"` the cut had hidden. Print the exact lines (`cat -A`) before anchoring.
> - **Preview scenes must stay plain data**: a scene as a function skipped every fidelity test
>   silently (`patch.pendingReward` undefined ⇒ `continue`). A placeholder resolved at apply time
>   keeps the scenes checkable.
> - **Hooks in a `.map` are not allowed, and a particle count that follows a prop changes the hook
>   count** — one child component per particle is the honest shape.

---

> Last update: **2026-09-07** — **ROUND 39: WHILE A TIMER RUNS, THE FOCUS SCREEN IS THE TIMER (ADR-079).**
> Order: *"Một chủ đề duy nhất: DỌN GIAO DIỆN MÀN TẬP TRUNG. Không thêm tính năng. Không tách file.
> Không đóng nợ kỹ thuật … TOÀN QUYỀN."* Six jobs, one theme; everything on `main`.
>
> ### Done
> 1. **One indicator while running** — the daily-goal ring is deleted (`GOAL_RING_*`, its motion, the
>    `--warn` circle); the brick strip is one headline («Đang xây X»; `describeSessionBrick` keeps the
>    numbers in `sub`); the postcard is `quiet` while any timer runs (no caption, scrims or era bar);
>    the «Giải lao dài» pill is gone; `pickFocusMoment` returns null while any timer runs.
> 2. **One line under the clock** — `describeClockSubline` (`engine/timerSession.js`): «Phiên thứ N hôm
>    nay» / «Xong N phiên hôm nay», ≤ 22 chars (the disc's chord at 390 px); the goal fraction moved to
>    the idle postcard caption (`goalLine`, in the goal's own unit).
> 3. **Goal + break line under the ring** (`PomodoroEngine.jsx`, right after the ring container) —
>    inside the disc they crossed the stroke at 390 px.
> 4. **Three colours** — the number is `--good` on a break, `--ink` otherwise; the glow is `color-mix` of
>    the arc's token; 72 palette classes in `PomodoroEngine.jsx` + `focus/*` became tokens (75 identical
>    light/dark ternaries collapsed); Coach `GOLD` → `COACH_COLOR = var(--accent)`.
> 5. **Quiet chrome** — `anyTimerRunning` (`App.jsx`) gates the desktop right column, the phone missions
>    + Coach cards, the top rail, the streak card and the voice line — focus AND break.
> 6. **Truncation sweep** — 20 `truncate` sites wrap now; the greeting has no clamp; the weekly line is
>    shorter; the tab bar keeps 3 (commented as a safety net). Sweep of Hành trang · Thống kê · Cài đặt
>    · Thành Phố · the ending card at 390/1280: no cut text. Logged, not fixed: the City tab's per-era
>    colours and its era-chip scroller (report §10).
>
> ### Hidden while a timer runs (nothing deleted — all of it returns when the timer stops)
> daily-goal ring · brick row + percent · era bar + greeting on the postcard · voice line · desktop
> right column · phone missions + Coach cards · top rail (now on breaks too) · streak card · «Giải lao
> dài» pill · red last-10-s flash · blue break number.
>
> ### Gates
> lint clean · build green · `npm run test:fast` 1,605 tests · 1,604 pass · 0 fail · 1 skipped (`# skipped 1`).
>
> ### Lessons
> - **A line inside a ring must fit the CHORD, not the diameter**: at 390 px the disc's chord under the
>   number is ~155 px and ~96 px one line lower — "Chưa xong phiên nào hôm nay" and every real goal
>   crossed the stroke. Copy has a geometric budget; `timerSession.test.js` pins it.
> - **`lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'` is a smell**: the token was already right
>   for both themes — 75 such ternaries collapsed to one literal after recolouring.
> - A multi-file edit script that writes only at the end leaves a clean tree when an anchor fails —
>   `git status` said so; two anchors (a comment gap, a missing `= {}`) cost two reruns and no damage.
>

---

> Last update: **2026-09-07** — **ROUND 38: THE CITY LIVES ON THE FOCUS SCREEN (ADR-078).**
> Order: *"Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào UX/UI. Thôi dọn, bắt
> đầu xây. TOÀN QUYỀN."* Six streams + a new report law (A for Đàm first, B for the advisor after).
>
> ### Done
> 0. **Round 37's 12 % closed.** `engine/soundEngine.cues.test.js`: a stub AudioContext records the
>    oscillators; start · last minute · brick · finish · break-over are pairwise different and never
>    silent in all four packs; the start cue is scheduled inside the tap (iOS autoplay); **no haptic
>    code exists on purpose** — iOS Safari has no Vibration API, and a test goes red if one appears.
> 1. **The city postcard** (`focus/CityPostcard.jsx`, `focus/cityPostcard.js`, `shared/EraStageBar.jsx`).
>    The ghost backdrop (50 % opacity under a 92 % scrim, frozen on phones, absent at 0 buildings) is
>    gone; the same `CityStage` is framed at full opacity as the first block of Focus — still while a
>    session runs, alive when idle, camera on this session's scaffold (a phantom one at session 1) or
>    on the building the last session finished (`ui.postcardFocusBpId`). Paid for: streak card under
>    the timer (`belowTimer`), era bar in the caption, greeting on the sky. Start at 390 px: bottom
>    edge 759 → ~700 px (tab bar at 774).
> 2. **«Đổi công trình»** on the brick strip: queued projects first (bricks kept), then cheapest
>    fresh blueprints; full queue evicts the last untouched item, never a brick. Engine
>    `chooseSessionProject`/`listSessionProjectChoices`, store `setSessionProject`. Verified by
>    clicking through the shot tool: strip, postcard camera and queue all follow.
> 3. **`assembleSessionReward`** (`engine/sessionRewards.js`, 772 lines, pure, 5 behaviour tests):
>    the ~710-line body moved verbatim with `now`/`today`/`weekKey`/`dailyGoal`/`random` as
>    parameters; ten helper clusters (≈1,180 lines) moved to `engine/` verbatim; `gameStore.js`
>    **4,677 → 2,879**. Hand-copied formula found: the streak bonus in `todayHero.js` → `streakBonusRate`.
> 4. **§9 settled**: `COACH_BUCKET_MIN_SAMPLE` 4 → 3 in ONE definition (it existed twice); the #86 gate
>    is ESLint `no-restricted-syntax` on palette classes and hex/rgb literals in a button's style
>    (57 + 43 hits recoloured to tokens; Settings 5 · Journal 5 · Notification Center 1 action buttons
>    through `ActionButton`). Only the door and pure white are exempt.
> 5. **Ledger 33–37**: ≈20 visible things removed, ≈10 added → **thinner**; the free effort of this
>    round therefore went to adding (postcard, switch, control polish).
>
> ### Gates
> lint clean · build green · `npm run test:fast` 1,602 tests · 1,601 pass · 0 fail · 1 skipped (`# skipped 1`).
>
> ### Lessons
> - **The sandbox's software GL trips the FPS watchdog in ~3 s** and both the postcard and the City
>   tab fall back to 2D — the first postcard shot showed the 2D grid and looked like a bug. Shoot 3D
>   with `--settle 600`. On real hardware the City tab never falls back, so neither will the postcard.
> - **A gate finds what a sweep misses**: round 37 "recoloured Settings by token", yet the inline
>   `style` branch still carried hex colours; the second selector (style literals) found 43 more.
> - **Moving 1,800 lines verbatim is safe only with `no-undef` + `no-unused-vars` as the map**: comment
>   words (`persist`, `getVietnamHour`) became imports until lint said which were dead.
> - The `--click` matcher uses the button's full text (`🔥Bếp Lửa Cổ Đại2 phiên`), not the label.
>
> ### Foreign commits carried to `main`
> Two from another session landed on `origin/main` during this round and are merged in unaltered:
> `ef8b245` (self-healing rotation: `doc-budget.mjs --rotate`, 16 guard tests, the "build, don't audit"
> rule in `CLAUDE.md`) and its merge commit `ca4958a`. Conflicts were docs-only (this file, `CHANGELOG.md`),
> resolved by keeping both entries — round 38 first, the addendum right below.
>
>
---

> Last update: **2026-09-07** — **THE GATES HEAL THEMSELVES; BUILD, DON'T AUDIT (ADR-076 addendum).**
>
> Đàm's requirement: *"nếu file phình to thì cũng tự biết giải quyết"*. A red rotation gate used to
> leave the HOW to the next session. Now `node scripts/doc-budget.mjs --rotate <file>` (or
> `--rotate-all`) moves a log's oldest entries VERBATIM into a fresh dated `docs/archive/` file and
> leaves a title index where they were; the gate's error message names that exact command.
> `TECH_DEBT.md` moves only entries whose own title says closed and refuses to guess about open ones.
> Proven end-to-end on a padded `BAN_GIAO.md`: 126,731 → 59,883 chars, 12 = 11 + 1, green.
> Two bugs caught by the dry run first: rotating under-limit files, and treating "PHẦN LỚN ĐÃ XỬ LÝ"
> as closed. Three planner unit tests pin the contract (lossless split · newest stays · partial never
> moves).
>
> New operating rule in `CLAUDE.md` §TOKEN BUDGET #4 — **build, don't audit**: `npm test` green means
> the doc system is healthy; do not re-measure or re-survey it before the task in the prompt.

> Last update: **2026-09-06 (late night)** — **ROUND 37: A SESSION ALWAYS LAYS A BRICK (ADR-077).**
> Order (verbatim essentials): *"Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào
> UX/UI. TOÀN QUYỀN … thà xong bốn mạch trọn vẹn còn hơn bảy mạch dở dang."* Seven streams; all seven
> reached `main` in three milestone commits + one gate commit + one merge commit (see «Foreign commits»).
>
> ### Done
> 1. **Việc 1 — Stats always answers.** `buildFocusProfile` gained `started`/`whole` counters; the three
>    "strongest" lines rank on the whole-session rate (Wilson), never on goal reviews; below the sample
>    floor they still answer (`thin`). Cards 1–2 hide at zero history so Start is the only answer.
>    Monday-morning fallback: last full week vs the week before (`WEEK_SCOPE`). Goal is OPTIONAL — no
>    gate, chips in the goal card (same task type first). Empty-state sweep: City "Bãi đất trống" (stale
>    nav path) → names the first project; Build hero copy; onboarding overlay deleted.
> 2. **Việc 2 — the brick.** `engine/sessionBrick.js` + `focus/SessionBrickStrip.jsx` + `focus/BrickRow.jsx`;
>    store auto-queues before advancing (`autoQueueSessionProject`, `pendingReward.autoQueuedId`); the
>    ending's project card lands the brick; `CityGrowthMoment` / `FocusCityTease` / `cityMoment.js` deleted.
> 3. **Việc 3 — sound & motion.** `playLastMinute` · `playBrickLaid` · `playBreakOver` added; `playTick`,
>    `tickSoundEnabled`, `playExtensionReady` deleted; countdown ticks last 3 s only; XP card silent;
>    haptics: none (iOS Safari has no Vibration API — decision recorded in ADR-077).
> 4. **Việc 4 — `PomodoroEngine.jsx` 2,958 → 1,922.** `shared/ActionButton.jsx` (the #86 door, +`sm`/`md`),
>    `components/focus/{ModeSwitch,QuickPresets,StrictModeToggle,CategoryChip,CategoryManager,
>    SessionReviewCard,CancelConfirmDialog}.jsx`, `engine/timerSession.js` (`clampFocusMinutes` ·
>    `parseFocusMinutesInput` · `getSessionWorkedMinutes`), `lib/keyboard.js`, `hooks/useMinWidth.js`.
>    Milestone toast + combo/multiplier badges removed (the strip took their slot). Start sits ~22 px
>    above the tab bar at 390×844 (screenshot).
> 5. **Việc 5 — `gameStore.js` 5,413 → 4,696.** `engine/missions.js` · `engine/weeklyChain.js` ·
>    `engine/seededRng.js`; `tickDailyMissions` replaces the hand-written live tick (live = reload);
>    `components/missionXp.js` folded into the engine; `forgiveness` removed from state/partialize/
>    sync/export/constants (round-36 §9 question 2: separately from the sleeping-money migration).
> 6. **Việc 6 — secondary screens.** `WeeklyReportModal.jsx` (916) + `weeklyXpNote.js` deleted; Monday
>    toast + Focus line navigate to Stats; `markWeeklyReportSeen` replaces open/dismiss; unseen dot on
>    the Thống kê tab (`attentionTabIds`). Settings: dead tick toggle gone. #86: door built, tenants
>    not yet moved (next round).
> 7. **Việc 7 — first open.** Fresh save: Focus says «Phiên này đặt viên gạch đầu cho Hang Động Nguyên
>    Thủy», City says «Viên gạch đầu tiên đang chờ»; the first ending tells the brick story.
>
> ### Gates
> `npm run lint` clean · `npm run build` green · `npm run test:fast` **1,589 tests · 1,588 pass · 0 fail ·
> 1 skipped** (round 36: 1,597 — 13 files deleted, 30 tests added). Screenshots (390 px, FULL data as ordered): `scratchpad/shots37/` — `focus-idle2.png`
> (strip + Start on the fold), `ending-project.png` (brick landed), `st-0/st-1.png` (Stats, three lines
> with numbers), `fresh-focus2.png` + `fresh-city2.png` (session #1 story). Fixture regenerated with
> goals + reviews (`make-fixture.mjs`: `goalFields`).
>
> ### Lessons
> - **A fixture that never reaches a state hides the empty box** — round 36 shipped an empty card
>   because the fixture had no `goalAchieved`. Now the fixture carries them, and the engine no longer
>   depends on them.
> - **The shot tool's default seed is NOT a fresh save** (era 7, 5/5 built). A fresh save needs
>   `--fixture` with `{"state":{},"version":4}`.
> - **Multi-file scripts: compute everything, write at the end.** The weekly-report removal aborted
>   once on an assertion; because nothing had been written, the retry was a one-line fix.
> - **`$SP` does not survive between Bash calls** — three files landed in `/` before this was noticed.
>
> ### Foreign commits carried to `main`
> Two batches from another session were already on `origin/main` and are merged into this branch
> unaltered: `feb13e0`…`bc5ac7e` (ADR-072 → ADR-075: Mac menu-bar fix + docs retrieval architecture)
> and `44a362d`…`92b9cf5` (ADR-075 → ADR-076: TECH_DEBT split by subsystem, owner-based knowledge
> gate, ARCHITECTURE.md subsections, governance by discovery). Because that session took **ADR-076**
> first, this round's ADR is numbered **ADR-077** everywhere. Merge conflicts were docs-only
> (six files); resolved by keeping both sides in date order, and the 52 frozen-3D debts stayed in
> `docs/TECH_DEBT_3D.md` where they moved them. `#86`'s full entry now lives in the closed archive,
> so this round's update to it went there.
---

> Last update: **2026-09-06 (night, fifth pass)** — **GOVERNANCE NOW RUNS ON DISCOVERY (ADR-076).**
>
> Đàm asked the right question: *what about the files later work creates — will it just grow back?*
> It would have. Every guard from ADR-075 read a **hand-written list**, so a document nobody
> registered was invisible to all of them. Proof arrived immediately: **three archives created that
> same day** (183,626 · 223,614 · 246,133 chars) were already outside the list.
>
> Fixed at the root: `discoverDocs()` walks the tree and `classify()` assigns a class from the PATH —
> `docs/archive/**` = archive · the four auto-loaded files = autoloaded · append-only logs = journal ·
> **everything else = active**. A file that does not exist yet already lands in "active", so it is
> governed the moment it is created. Nothing to register, nothing to remember.
> Rotation also grew from 2 files to 4: `TECH_DEBT.md` (120,000) and `ARCHITECTURE_DECISIONS.md`
> (250,000) are append-only too — new debts and new ADRs arrive every session.
>
> **Break-tested**: a brand-new `docs/FUTURE_THING.md` of 900,000 chars turns the ceiling gate red by
> name although no list mentions it; padding `TECH_DEBT.md` past its limit turns rotation red.

---

> Last update: **2026-09-06 (night, fourth pass)** — **STARTUP CONTEXT DOWN TO 8,606 TOKENS.**
>
> `START_HERE.md` 11,030 → 9,764 chars: rounds 34 and 35 compressed to the two lessons that outlive
> them (*a valid reward table with green tests can still grant something nobody can see* · *removing
> a button means hunting everything it did besides granting the reward*), full text in
> `docs/archive/START_HERE_LOG_2026-09-06.md`.
> `PHASE_RULES.md` 7,106 → 6,599 chars: its measuring-tool table duplicated `PROJECT_STRUCTURE.md`
> (which documents each tool 4–9× more thoroughly), and its §10 failure shapes are 3D lessons that
> belong in `docs/LESSONS_3D.md`. Both replaced by the rule plus a pointer.
> `CLAUDE.md` 15,780 → 15,183: sync/tray implementation detail moved behind an imperative pointer,
> which only became possible after the knowledge gate was made owner-based.
>
> ⚠️ **The guard was inflating what it protected.** The anti-knowledge-loss gate demanded every core
> law appear in `CLAUDE.md`, so the always-loaded file was forced to keep implementation detail.
> `CORE_LAWS` is now (owner, phrase, why): startup-critical laws owned by `CLAUDE.md`, subsystem
> detail owned by the topic file a session opens before touching that subsystem. Break-tested.
>
> **Startup context across the day: 38,258 → 8,606 tokens/session (−77%).**

---

> Last update: **2026-09-06 (night, third pass)** — **TECH_DEBT SPLIT BY SUBSYSTEM (ADR-075).**
>
> Classifying the 63 "open" debts showed only **7 are actionable**. **52 belong to the frozen 3D city**
> — a black box Đàm forbids touching — and were **87% of the file**; 3 more said ĐÃ ĐÓNG in their own
> titles yet had never been archived. The 52 moved to `docs/TECH_DEBT_3D.md`, **still open, split by
> SUBSYSTEM not by status**, so a `grep` for live work no longer wades through frozen work.
> `TECH_DEBT.md` **250,190 → 43,559 chars (−83%)**; total still 103 entries, nothing lost.
> ⚠️ **Judge the Maintenance Sprint threshold on the 7 actionable entries, not the total** — counting
> a frozen subsystem made that threshold meaningless (the one Priority High, #53, is a 3D debt).
>
> Also: `START_HERE.md` UI invariants → `docs/UI_INVARIANTS.md` behind an imperative pointer
> (every session was loading them before knowing if the task touched the UI); startup context
> **10,020 → 9,145 tokens**. Stale routing fixed in `AI_ONBOARDING.md`, `AI_HANDOFF_KNOWLEDGE.md`,
> `ARCHITECTURE.md` — all three still told a new session to read `BAN_GIAO.md` in full first, and one
> promised "208 tests" when there are 1,610.

---

> Last update: **2026-09-06 (night, second pass)** — **JOURNAL ROTATION ENFORCED (ADR-075).**
>
> `CHANGELOG.md` **266,956 → 56,535 chars** (78% → 16% of a 200k window): 80% of its bulk was a single
> past month; 135 entries older than 2026-09 moved verbatim to
> `docs/archive/CHANGELOG_upto_2026-08.md`, titles kept as an index.
> `BAN_GIAO.md` **240,561 → 58,013 chars, 3,109 → 711 lines**: older journal entries and the dated
> phase logs moved to `docs/archive/BAN_GIAO_2026-09.md`. This is simply `PHASE_RULES.md` §5
> ("past ~500 lines, move the old part to `docs/archive/`") — a rule that had existed unenforced
> while the file tripled past it.
> **Sixth guard added: rotation.** `npm test` now fails if either journal passes 120,000 chars, so
> the rule no longer depends on anyone remembering it. Break-tested.
> Nothing deleted; both archives are one `grep` away.

---

> Last update: **2026-09-06 (night)** — **RETRIEVAL ARCHITECTURE: FREEZE CLOSED KNOWLEDGE, CAP EVERY
> FILE AT ONE CONTEXT WINDOW, GUARD IT (ADR-075).** Third pass of the day, after ADR-073 (split) and
> ADR-074 (English).
>
> ### The remaining waste was retrieval, not storage
> Always-loaded cost was already down to ~10,000 tokens. But three files could not be read in one
> session at all: `TECH_DEBT.md` 252,634 tokens (**126%** of a 200k window),
> `ARCHITECTURE_DECISIONS.md` 227,878 (**114%**), `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md`
> 282,237 (**141%**). And every `grep` waded through knowledge that was already closed history.
>
> ### Done
> 1. **`TECH_DEBT.md` 435,288 → 248,959 chars (126% → 72%)**: 40 closed entries moved verbatim to
>    `docs/archive/TECH_DEBT_CLOSED_2026-09-06.md` (all 14 fields intact), 40-line index left behind.
>    The header also carried 13 accumulated threshold snapshots — **28,849 → 1,858 chars**, so
>    `head -60` finally returns the rules instead of old counts.
> 2. **`ARCHITECTURE_DECISIONS.md` 392,634 → 159,441 chars (114% → 46%)**: 50 oldest ADRs to
>    `docs/archive/ADR_ARCHIVE_001-050.md`, 25 newest stay hot, 50-line index left behind. The rule
>    "never delete an old ADR even when reversed" is intact — they are one `grep` away.
> 3. **`docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md` split** at a date boundary: 141% → 70% + 71%.
>    **No file in the repo now exceeds one context window.**
> 4. **`START_HERE.md` de-duplicated against `CLAUDE.md`**: three of its six "laws" and its entire
>    lookup table restated rules `CLAUDE.md` owns. This is the failure that already happened here —
>    `START_HERE.md` once carried the merge rule BACKWARDS while `CLAUDE.md` had it right.
> 5. **Three new guards, each break-tested**: canonical rule (no auto-loaded file may restate a rule
>    another owns) · pointer (every `.md` reference must resolve) · context-window ceiling.
> 6. **`npm run test:quiet` — the biggest single win of the day, and not a document.** `npm test`
>    prints one line per test: **9,802 lines / 408,514 chars ≈ 230,000 tokens** for one run — more
>    than a whole 200k window, 23× the entire always-loaded context. The quiet form runs the same
>    tests via the `dot` reporter with a `tap` side-channel for the summary: **2,132 chars, −99.5%**,
>    with `# skipped 1` preserved and failures still printed in full.
> 7. `TECH_DEBT #103` closed.
>
> ### ⚠️ Third measuring-tool failure of the day
> The first corpus measurement reported the `.md` corpus **shrinking by 665,806 chars** — which would
> have meant catastrophic data loss. It was the TOOL: the new archives were untracked and
> `git ls-files` silently excluded them. Measured over the working tree the corpus is **+14,294
> chars** (indexes and archive headers), nothing lost. Same family as ADR-074's diluted ratio:
> *the denominator contained something outside the question*.
>
> ### Numbers
> Largest single file **486,294 → 266,956 chars**. Always-loaded **10,171 → 9,942 tokens/session**
> (5.0% of a 200k window). Corpus +0.5%, nothing deleted. `npm test` 1,605 → 1,609.
> Check anytime: `node scripts/doc-budget.mjs`.

---

> Cập nhật lần cuối: **2026-09-06 (tối, cùng phiên "tối ưu context window")** — **TÀI LIỆU TỰ-NẠP
> CHUYỂN SANG TIẾNG ANH + CỔNG CANH NGÔN NGỮ (ADR-074).** Đàm: *"chuyển thành tiếng Anh đi… khi giao
> tiếp với tôi thì sử dụng tiếng Việt để tiết kiệm token"*.
>
> ### Vì sao đổi ngôn ngữ lại là tiết kiệm lớn nhất còn lại
> Hệ số đo được: tiếng Việt **1,723 ký tự/token**, tiếng Anh khoảng **4** ⇒ cùng một ý, bản tiếng
> Việt tốn **~2,3 lần** token. Với file TỰ NẠP MỖI PHIÊN, chi phí ấy nhân với số phiên.
> ⚠️ **Hệ số tiếng Anh CHƯA đo được trong phiên này** — `tiktoken` cần tải bảng BPE qua mạng, proxy
> chặn (403). Mọi con số token tiếng Anh dưới đây là ƯỚC LƯỢNG; phép kiểm thật: Đàm gõ `/context` ở
> phiên mới và đọc dòng "Memory files".
>
> ### Đã làm
> 1. **Dịch + tái cấu trúc 6 file**: `CLAUDE.md` · `START_HERE.md` · `PHASE_RULES.md` · `AGENTS.md` ·
>    `docs/GOVERNANCE.md` · `docs/OPERATIONS.md`. Bốn file tự-nạp: **25.702 → 10.075 token (−61%)**;
>    `docs/OPERATIONS.md` 9.160 → 4.469; `docs/GOVERNANCE.md` 7.382 → 3.287.
> 2. **Dọn cấu trúc `START_HERE.md`**: mục "Việc tiếp theo" vốn có HAI danh sách đánh số chồng lên
>    nhau (0, 0b, 1, 2, 3 rồi lại 0, 1, 2, 3, 4) — nay chia bốn nhóm rõ: A. Đàm phải chọn ·
>    B. Sẵn sàng làm · C. Chờ mắt Đàm · D. Điểm mù của công cụ.
> 3. **Cổng canh ngôn ngữ** (`scripts/docBudget.test.js`): một đoạn tiếng Việt lọt vào file tự-nạp
>    = test ĐỎ. Trần mới theo tiếng Anh: `CLAUDE.md` 16.000 · `START_HERE.md` 16.000 ·
>    `PHASE_RULES.md` 8.000 · `AGENTS.md` 3.500 ký tự.
> 4. **Bảng ranh giới ngôn ngữ** trong `CLAUDE.md` để không sinh mâu thuẫn mới: file tự-nạp + 2 file
>    `docs/` = tiếng Anh (có cổng) · kho tra cứu = phần cũ giữ tiếng Việt, phần MỚI viết tiếng Anh ·
>    **báo cáo cho Đàm = tiếng Việt**.
> 5. **KHÔNG dịch kho tra cứu 2,6 triệu ký tự** — tốn ~700.000 token output cho một lần, và rủi ro
>    mất tri thức mà mỗi mục đã trả giá bằng một phase.
>
> ### ⚠️ Hai bài học đắt nhất phiên này — cả hai đều là CÔNG CỤ ĐO nói dối
> **(a) Cổng canh ngôn ngữ bản đầu KHÔNG NỔ khi thử phá.** Nó đo tỉ lệ ký tự tiếng Việt trên TOÀN
> FILE; chèn một đoạn tiếng Việt vào `CLAUDE.md` chỉ đẩy tỉ lệ 0,21% → **0,59%**, bị 15.000 ký tự
> tiếng Anh pha loãng. Đúng luật *"mẫu số có lẫn thứ không thuộc câu hỏi không"* — câu hỏi là "có
> ĐOẠN nào tiếng Việt không", nên mẫu số phải là một ĐOẠN. Bản sửa quét theo đoạn ≥200 ký tự, ngưỡng
> **8%** chọn từ số đo thật (đoạn tiếng Anh có trích lời Đàm cao nhất **4,21%** · đoạn tiếng Việt
> thuần **13,95–15,69%**), kèm một assert khoá ngưỡng phải nằm GIỮA hai con số ấy.
> **(b) Cổng chống-mất-luật quá giòn**: báo mất *"Composition over Duplication"* chỉ vì markdown ngắt
> dòng giữa hai từ. Đã sửa CÔNG CỤ (chuẩn hoá khoảng trắng), không sửa văn bản cho vừa công cụ.
>
> ### Kết quả đo
> Mỗi phiên gánh **41.076 ký tự ≈ 10.196 token = 5,1% cửa sổ 200k** cho cả 4 file bắt buộc.
> Cộng dồn cả ngày: **21.600 → 3.839 token cho riêng `CLAUDE.md` (−82%)**.
> Kiểm bất cứ lúc nào: `node scripts/doc-budget.mjs`.

---

> Cập nhật lần cuối: **2026-09-06 (chiều, phiên "tối ưu context window")** — **NGÂN SÁCH TOKEN CHO
> TÀI LIỆU: TÁCH FILE + CỔNG CANH BẰNG TEST (ADR-073).** Đàm gửi ảnh `/context`: cửa sổ 699,8k/1M
> (70%), `Messages` chiếm **624,7k = 62,5%** trong khi `CLAUDE.md` chỉ 21,6k = 2,2%.
>
> ### Chẩn đoán: nhắm sai chỗ thì tối ưu bao nhiêu cũng vô ích
> Đo 18 file `.md`: **2.650.448 ký tự ≈ 1,54 triệu token = 769% cửa sổ 200k**. Thủ phạm không phải
> file tự-nạp mà là **kho tra cứu bị `cat`**: `TECH_DEBT.md` = 250k token (**125% cửa sổ 200k trong
> MỘT lệnh**), `ARCHITECTURE_DECISIONS.md` = 223k, `CHANGELOG.md` = 154k, `BAN_GIAO.md` = 134k.
> Đó là cách `Messages` leo tới 62,5%.
>
> ### ⚠️ Công cụ đo suýt nói dối lần thứ 29 — `wc -c` ĐẾM BYTE, KHÔNG ĐẾM KÝ TỰ
> Vòng đo đầu tiên kết luận *"`CLAUDE.md` 45.011 ký tự, vượt trần 40.000 nó tự đặt"*. **SAI.**
> Đó là 45.011 **byte**; số ký tự thật là **37.220** (dưới trần). Tiếng Việt có dấu là 2–3 byte/ký
> tự nên `wc -c` thổi phồng ~21%, còn trần trong tài liệu đo bằng `String.length`. Đúng luật số 1
> của dự án: *nghi CÔNG CỤ ĐO trước, nghi mã sau*. Hệ số quy đổi đo được: **1,723 ký tự = 1 token**
> (tiếng Anh ~4). Nhưng cái vượt trần THẬT vẫn có: **`START_HERE.md` 20.200/20.000**, và nó giữ
> **4 vòng** thay vì 3 như luật của chính nó — không phiên nào biết, vì trần chỉ là một câu chữ.
>
> ### Đã làm (8 việc)
> 1. **Tách `CLAUDE.md` 37.220 → 16.310 ký tự (−56%)**, không xoá một chữ: → `docs/GOVERNANCE.md`
>    (Governance Protocol + AI Engineering Playbook) + `docs/OPERATIONS.md` (hạ tầng · Vercel 12
>    Functions · sync/CAS · Web Push · Electron tray · deploy · MCP). Giữ lại LUẬT dạng một dòng
>    + con trỏ. Token: 21.600 → **9.468**.
> 2. **Mục "NGÂN SÁCH TOKEN" đứng ĐẦU `CLAUDE.md`** — bảng "file nào CẤM `cat`" kèm %cửa sổ, vì
>    luật rẻ nhất là luật ngăn một lệnh 250k token chứ không phải luật tiết kiệm 2k.
> 3. **`scripts/doc-budget.mjs`** — đo ký tự/token mọi tài liệu, in bảng có thanh mức dùng;
>    `--map <file>` in mục lục + khoảng dòng để `sed -n 'A,Bp'` thay vì `cat`.
> 4. **`scripts/docBudget.test.js` (5 bài) — trần NAY LÀ CỔNG CANH THẬT**, đỏ trong `npm test`.
>    Ba phép phá đã thử và đều nổ đúng chỗ: nhồi 5.000 ký tự vào `CLAUDE.md` → đỏ · gỡ luật
>    `api/_tests/` khỏi `CLAUDE.md` → đỏ · đổi tên file có trần (cổng canh file ma) → đỏ.
> 5. **`START_HERE.md` 20.200 → 18.132 ký tự (91% trần)**: đẩy VÒNG 33 + chi tiết Thành phố 3D
>    (hộp đen Đàm cấm đụng — không đáng trả token mỗi phiên) sang `docs/archive/`. Giữ nguyên các
>    luật 2D đang dùng (chuyển động · điều hướng · skin · phần thưởng · toast).
> 6. **Gỡ mâu thuẫn `AGENTS.md`**: nó bảo Codex *"đọc `BAN_GIAO.md` toàn văn"* = **134k token ngay
>    câu thứ hai của phiên**, ngược hẳn `PHASE_RULES.md` §5 (*"chỉ đọc 60 dòng đầu"*). Nay:
>    `START_HERE.md` trước, `head -60 BAN_GIAO.md`, + danh sách file cấm `cat`.
> 7. **Gỡ mâu thuẫn `PHASE_RULES.md` §9** (*"Không tự gộp `main`"*) — đã bị lệnh Đàm 2026-08-22 thay
>    thế (*"sau này tự deploy"*), nay ghi rõ là đã bị thay thế thay vì để hai file nói ngược nhau.
> 8. **Gộp hai báo cáo 11 mục chồng nhau thành MỘT bảng chọn theo loại task** — việc gọn thì 5 dòng,
>    kiến trúc/hạ tầng/sự cố thì TECHNICAL ADVISOR REPORT 11 mục. Tiết kiệm ~2.500 token **output**
>    mỗi task, đây là phần "output hiệu quả nhất" mà Đàm yêu cầu.
>
> ### Kết quả đo
> Mỗi phiên gánh **44.284 ký tự ≈ 25.702 token = 12,9% cửa sổ 200k** cho cả 4 file bắt buộc
> (trước đây riêng `CLAUDE.md` đã 21.600). `npm test` **1.602 bài (1.601 pass · 0 fail · 1 skipped)**
> — thêm đúng 5 bài mới; `test:cross` 32,6 giây; lint sạch; build xanh.
> Kiểm bất cứ lúc nào: `node scripts/doc-budget.mjs`.

---

> Cập nhật lần cuối: **2026-09-06 (cùng ngày, phiên khác)** — **SỬA GỐC: MENU BAR MAC MẤT ĐẾM
> NGƯỢC, LẶP LẠI NHIỀU LẦN (ADR-072).** Đàm báo kèm ảnh chụp: thanh menu Mac chỉ hiện icon đồng
> hồ, không có chữ đếm ngược, dù web app (tab trình duyệt) vẫn đang chạy phiên thật ("24:56").
>
> ### Vì sao lặp lại nhiều lần: một dòng comment mô tả hành vi CHƯA TỪNG tồn tại
> `electron/main.js` từ đầu tới giờ CHỈ gọi `fetchTimerLive()` (đọc REST) MỘT LẦN lúc khởi động,
> sau đó phó thác 100% cho kênh Supabase Realtime để cập nhật `timerData`. Header file ghi "Polls
> Supabase timer_live table every 3 seconds" — `git log -p --follow -- electron/main.js` xác nhận
> dòng polling định kỳ đó **CHƯA BAO GIỜ được viết**, ở BẤT KỲ commit nào trong lịch sử file. Kênh
> WebSocket realtime có thể ngắt lặng lẽ (Mac ngủ/thức, đổi WiFi, socket chết) mà KHÔNG phát lại
> sự kiện đã lỡ trong lúc ngắt — với một app nền chạy cả ngày trên laptop, "ngủ rồi thức" xảy ra
> nhiều lần/ngày, nên `timerData` kẹt ở trạng thái cũ VĨNH VIỄN tới khi Đàm tự khởi động lại app.
> Đây đúng là root cause của việc bug này "đã bị rất nhiều lần" — không phải một lần hỏng ngẫu
> nhiên, mà một thiết kế thiếu lưới an toàn từ đầu.
>
> ### Đã sửa (`electron/main.js`, không đụng web app/schema Supabase)
> 1. **Poll định kỳ** — `setInterval(fetchTimerLive, TIMER_LIVE_POLL_INTERVAL_MS = 5000)`: đọc
>    lại `timer_live` mỗi 5 giây BẤT KỂ kênh realtime còn sống hay không — tự chữa trong tối đa 5
>    giây nếu realtime lỡ mất một sự kiện.
> 2. **`powerMonitor.on('resume', fetchTimerLive)`** — đọc lại NGAY khi Mac vừa thức dậy, thay vì
>    chờ hết chu kỳ poll (Mac ngủ/thức gần như luôn làm rớt socket cũ).
> 3. **Gộp logic chung** — trước đây nhánh realtime và nhánh `fetchTimerLive()` mỗi nơi tự cập
>    nhật `timerData`/`prevIsRunning`, nhánh poll không hề gọi logic phát hiện "phiên vừa xong"
>    (báo Notification desktop). Nay cả hai đi qua một hàm `applyTimerLiveUpdate(newData,
>    previousData)` duy nhất — tránh việc sau này chỉ có nhánh realtime "biết" báo xong phiên, còn
>    nhánh poll thì câm lặng (đúng lỗi cùng họ, cho một triệu chứng khác).
> Chi tiết trade-off + phương án đã loại: `ARCHITECTURE_DECISIONS.md` ADR-072.
>
> ### ⚠️ Đàm CẦN LÀM THÊM MỘT BƯỚC TRÊN MAC (khác web app)
> App tray Electron chạy từ **thư mục dự án cục bộ trên Mac**, không tự cập nhật qua Vercel/GitHub
> như web app. Web app đã lên `main` và tự deploy — không cần làm gì thêm ở đó. Nhưng để MENU BAR
> nhận bản vá này, Đàm cần 2 bước trên Mac: (1) `git pull` bản mới nhất về máy; (2) khởi động lại
> app tray — bấm "Thoát" ở menu tray rồi mở lại (⚠️ LaunchAgent tắt `KeepAlive` có chủ đích để nút
> "Thoát" thoát được thật, nên nó **KHÔNG** tự bật lại ngay — Đàm cần khởi động lại Mac, HOẶC mở
> Terminal chạy `launchctl kickstart -k gui/$(id -u)/com.dcpomodoro.tray`, HOẶC chạy lại lệnh
> Electron thủ công ghi ở `CLAUDE.md` mục "App menu bar Mac"). Không làm 2 bước này thì tray Mac
> vẫn chạy `main.js` CŨ, bug y nguyên.
>
> ### Bài học
> Một dòng comment tả hành vi ("polls every 3 seconds") không phải bằng chứng hành vi đó tồn
> tại — `git log -p` mới là bằng chứng thật. Đây là bản dịch Việt của luật đã có ở mục 3D: *"một
> câu tự trấn an phải được kiểm như một con số"*.
>
> Test **1.597 bài (1.596 pass · 0 fail · 1 skipped)** · lint sạch · build xanh (không đổi số bài —
> đây là mã Electron `main.js` không có test tự động, xem `TECH_DEBT #102` mới mở). Không đụng
> web app, không đụng Thành phố.
>

---

> Cập nhật lần cuối: **2026-09-06 (vòng 36)** — **THỐNG KÊ TRẢ LỜI, KHÔNG TRÌNH BÀY; ĐÓNG #99
> (ADR-071).** Lệnh Đàm: *"Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào UX/UI.
> TOÀN QUYỀN … Đừng hỏi lại tôi bất cứ điều gì rồi ngồi chờ."* Không đụng Thành phố. Đóng `#99 · #6`,
> `#93` hết đối tượng, `#2` xong vế `StatsDashboard.jsx`.
>
> ### Ba chỗ đổi (chi tiết + lý do: ADR-071; tóm tắt: CHANGELOG 2026-09-06 vòng 36)
> 1. **Màn Thống kê viết lại** — `StatsDashboard.jsx` 3.792 → **294 dòng**. Mở ra là thấy ba thẻ:
>    *«Tôi có đang khá lên không?»* (tuần này so CÙNG QUÃNG tuần trước — thứ Hai tới đúng giờ này —
>    một câu + 7 cặp cột T2→CN), *«Khi nào tôi mạnh nhất?»* (giờ · độ dài · loại việc, mỗi dòng
>    «đạt X% · trên N phiên có mục tiêu»; thiếu mẫu thì nói cần gì), *«Làm gì tiếp?»* (đúng MỘT nút
>    «Bắt đầu N phút · loại» → đặt `timerConfig.focusMinutes` + `pendingCategoryId` rồi
>    `onNavigate({tab:'focus'})`; đang có phiên chạy thì chỉ chuyển màn). Dải «Điều đáng chú ý» giữ.
>    Nhật ký · Ghi chú GẤP dưới cùng (hai nút có số mục; `StatsJournal.jsx` · `StatsNotes.jsx` tách
>    nguyên văn; hàng lọc loại việc thôi cuộn ngang). Số ở `engine/statsAnswers.js` (thuần, +7 test):
>    chỉ GHÉP `buildFocusProfile`/`recommendNextSession`/`coachCompletedSessions` — không chế công
>    thức mới; ngưỡng «giữ nhịp» dùng chung `WEEK_TREND_THRESHOLD_PCT`; bộ getter giờ VN tách thành
>    `time.vietnamHistoryTimeOpts` (Coach dùng chung). XOÁ: Tổng Quan · Chiều Sâu · Phân Loại ·
>    `PeriodPicker` · 4 biểu đồ · 2 bản đồ nhiệt · `statsPeriod.js` · `statsFocus.js` (+test) ·
>    `statsPeriodWiring.test.js` · `computeYearGrid` · `computeCategoryStats` · 6 hàm định dạng.
>    `statsNavClarity.test.js` viết lại (6 bài: thứ tự ba câu trước sổ, sổ gấp mặc định, không cuộn
>    ngang, nhãn không trùng điều hướng, nút nhảy màn có dây thật ở App, mọi tỉ lệ kèm mẫu số).
>    `motionCoverage` bỏ ngoại lệ StatsDashboard (4 → 0). `glyph.test.js` soi hai file sổ mới.
> 2. **Đóng `#99`** — phương án *THÔI GHI, giữ khoá* (không migration, không đụng JSONB CAS):
>    `calculateRewards` bỏ mục 8–10 (tài nguyên · RP · tinh luyện) và `largeChest`; xoá
>    `applyDisasterPenalty` · `calculateSessionResourceFloor` · `rollResourceDrop` · `getActiveResources`
>    (gameMath 2.044 → 1.732); store xoá `mergeResources` + ba hàm trừ khi xoá phiên, khối RP/tinh
>    luyện/Lộc-Ban-Tặng-tinh-luyện, `getEconomyRewardModifiers`, phạt huỷ phiên + tiêu lượt «Sự Tha
>    Thứ», hoàn tiền `cancelCrafting`, nhiệm vụ `researchPoints` (2 mục) (store 5.744 → 5.413);
>    `challengeEngine.js` bỏ 12 hàm chết đường thử-thách-bậc/hiến-tế (460 → 219). Bản ghi lịch sử MỚI
>    không còn `resources/rpEarned/refinedEarned/positiveEventRPBonus`; `cancelPenalty: null`. Thẻ
>    tổng kết bỏ «Rương Lớn · +tài nguyên · +RP · +tinh luyện» — phiên thường không mốc/không sự kiện
>    thì nói BẬC phiên. Characterization test đổi theo (`completeFocusSession` · `cancelFocusSession`
>    · `rewardFeed` · `sessionRewardStory`), thêm `gameStore.adr071.test.js` (3 bài).
> 3. **Chữ trong save đọc từ bảng** — `withCanonicalCrisisText` + `findEraCrisisById`
>    (`challengeEngine.js`, +2 test) gọi ở `normalizePersistedGameState`: `eraCrisis.name/icon/
>    description` + nhãn hai lựa chọn đọc lại từ `ERA_CRISES`; `sessions/minMinutes` của thử thách
>    ĐANG chạy giữ nguyên. Cùng luật với di vật (ADR-070) và nhiệm vụ (`normalizeMissionTemplate`).
>
> ### Ba câu tự quyết (mục 9 vòng 35) — đã chốt, lý do ở ADR-071
> · Chuỗi thẻ GIỮ (chỉ bớt chip «Rương Lớn») · Mốc di vật 20/50 GIỮ (fixture 599 phiên: 19,2
> phiên ≥25′/tuần ⇒ trung vị 7,1 ngày và 17,8 ngày; bản thật không đọc được từ hộp cát — proxy 403)
> · Luật chữ-đọc-từ-bảng thành luật chung (di vật · nhiệm vụ · khủng hoảng kỷ).
>
> ### Bài học vòng 36
> · Ảnh nghiệm thu đầu tiên in «Dựa trên 77 phiên…» HAI LẦN — câu lý do của `recommendNextSession`
>   đã tự mang mẫu số, giao diện ghép thêm là in đôi. Luật: **câu chữ có mẫu số thì mẫu số sống ở
>   engine, giao diện chỉ in** (test đọc mã canh `{answers.next.reason}` và cấm «Dựa trên» lần hai).
> · Fixture 599 phiên KHÔNG có `goalAchieved` ⇒ ba dòng «mạnh nhất» trống cả ba. Đó không phải lỗi,
>   nhưng một màn im lặng là một màn chết: thêm một câu nói thẳng việc cần làm (đặt mục tiêu phiên).
> · `applyDisaster` (tuỳ chọn huỷ phiên đời cũ) nay bị BỎ QUA — có test khoá "true hay false đều
>   cùng một bản ghi", để phiên sau không tưởng còn hai đường huỷ.
> · Ba lần trong vòng này một script sửa-nhiều-file DỪNG ở một assert giữa chừng và các file SAU
>   điểm dừng không được ghi — mà file trước đã ghi. Luật: **sau mỗi script nhiều file, `git status`
>   + chạy lại test của TỪNG file định sửa**, đừng tin "ok" in ở cuối một script chưa chạy tới cuối.
>
> Test **1.597 bài (1.596 pass · 0 fail · 1 skipped)** · lint sạch · build xanh. Ảnh nghiệm thu (390px, fixture 599 phiên): 3 lát màn
> Thống kê mới (`scratchpad/shots36/f2-*.png`). `#99 · #6` đóng, `#93` hết đối tượng, `#2` xong nửa.
>

---

> *(cùng ngày, phiên khác)* **2026-09-06 (tối ưu context window)** — **CẮT 89% `CLAUDE.md`, KHÔNG XOÁ
> MỘT CHỮ NÀO.** Lệnh Đàm: *"Tìm hiểu và tối ưu token giúp tôi trong context window của các phiên
> sau"* + *"Tối ưu MCP, nên giữ lại MCP nào... và tối ưu file memory CLAUDE.md - token 190.7k"*.
>
> ### Vì sao: một quy tắc ĐÚNG VỀ Ý ĐỊNH nhưng BẤT KHẢ THI VỀ CƠ CHẾ
> Quy tắc 2026-08-24 viết: *"CLAUDE.md là KHO TRA CỨU: chỉ mở phần `grep` trúng, KHÔNG đọc trọn"*.
> Đo ra thì harness **TỰ NẠP 100% `CLAUDE.md`** vào đầu mỗi phiên, **trước khi AI kịp quyết định
> gì** — nên câu ấy không AI nào thi hành được, và file đã âm thầm phình tới **190.700 token =
> 95% cửa sổ 200k**. Cuộc cải cách 2026-08-24 cứu được `BAN_GIAO.md` (610 KB sang `docs/archive/`)
> **chỉ vì đó là việc TÁCH FILE**; với `CLAUDE.md` nó chỉ là một câu chữ, và một câu chữ thì không
> đỏ lên được. Cùng họ bài học *"một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST
> mới chặn được"* — ở đây thứ chặn được là **cái trần ghi trong chính file**.
>
> ### Số đo (hiệu chuẩn bằng con số THẬT Claude Code báo: 301.940 ký tự = 190.700 token
> ⇒ **1,583 ký tự/token**; ước lượng ban đầu của tôi là 2,4 — **sai 1,5 lần**, tiếng Việt tốn hơn nhiều)
>
> | | trước | sau | giảm |
> |---|---:|---:|---:|
> | `CLAUDE.md` | 190.700 tok | **22.567 tok** | **−88,2%** |
> | `START_HERE.md` | 24.124 tok | **11.572 tok** | −52,0% |
> | **Sàn cố định mỗi phiên** | **214.824 tok** | **34.139 tok** | **−84,1%** |
>
> ### Đã làm
> 1. **`docs/LESSONS_3D.md`** (mới) — 89 bài học cấp 1 + 96 mục "KÈM THEO" về mỹ thuật thành phố
>    3D, **nguyên văn**, kèm mục lục 89 dòng để `grep` trúng. 146.727 token.
> 2. **`docs/AI_COACH.md`** (mới) — toàn bộ chi tiết Gemini/chống-bịa/CoachChat/CoachOffline/
>    CoachNudge/coach-digest, **nguyên văn**. 15.494 token.
> 3. **`docs/archive/START_HERE_LOG_2026-09-06.md`** (mới) — nhật ký VÒNG 20 → 32, nguyên văn.
> 4. **`CLAUDE.md`** giữ nguyên văn toàn bộ QUY TẮC (HỎI TRƯỚC KHI LÀM · Governance · Playbook ·
>    Vercel 12 Functions · Sync CAS + bản vá C1 · Web Push · Electron tray · deploy · KHÔNG làm),
>    thêm **mục «🗺️ BẢN ĐỒ TÀI LIỆU»** + hai mục con trỏ có sẵn lệnh `grep`, và **5 luật phương
>    pháp cô đọng** giữ lại vì chúng áp cho mọi loại task chứ không riêng 3D.
> 5. **Hai cái TRẦN mới, đếm được** — `CLAUDE.md` ~32.000 ký tự, `START_HERE.md` ~250 dòng/20.000
>    ký tự (giữ tối đa 3 vòng gần nhất). Không có trần thì file sẽ phình lại y như lần trước.
> 6. **Đính chính điểm 1 của NGUYÊN TẮC SỐ 1** — nó đang kể một cơ chế không tồn tại.
>
> ### Bảo toàn nội dung (đối chiếu chéo)
> Nguyên bản 301.940 ký tự = giữ 32.221 + chuyển đi 269.715 = **301.936**, chênh **+4** = đúng 4
> dấu xuống dòng ở bốn mối nối. **Không một chữ nào bị xoá.**
>
> ### Cổng nghiệm thu
> `npm run test:fast` **1633 bài · 1632 pass · 0 fail · `# skipped 1`** (đúng con số quy tắc đòi) ·
> `test:cross` 3/3 xanh (40,3 giây) · `npm run lint` sạch · `npm run build` thành công.
> Không một dòng mã nguồn nào bị đổi — `git status` chỉ có `.md`.
>
> ### Còn lại / chưa làm
> - **47 lời trỏ "xem `CLAUDE.md`" trong 38 file mã nguồn** nay trỏ tới một file không còn chứa
>   bài học 3D. **Chuỗi vẫn liền** (mở `CLAUDE.md` là thấy ngay mục 🎨 trỏ tiếp sang
>   `docs/LESSONS_3D.md`), nên KHÔNG sửa 38 file — sửa hàng loạt chú thích là rủi ro cao mà lợi
>   ích bằng không. Ghi ở `TECH_DEBT #101`.
> - **MCP**: đo ra 5 server không liên quan (TickTick · Notion · Canva · Gmail · Google Calendar =
>   162 tool) chỉ tốn **≈1.780 token** vì harness đã "hoãn nạp" (chỉ giữ tên, bỏ mô tả) ⇒ **1% vấn
>   đề**. Vẫn nên tắt để đỡ nhiễu chọn tool. Cấu hình nằm ở tài khoản claude.ai, **không nằm trong
>   repo** (không có `.mcp.json`) nên AI không tắt hộ được — Đàm tự tắt bằng `/mcp` hoặc
>   claude.ai → Settings → Connectors.

---

> *(mốc trước)* Cập nhật **2026-09-06 (vòng 35)** — **MỘT CÁI KẾT DUY NHẤT, KHÔNG NÚT NHẬN, KHÔNG MÀN
> CHẾT (ADR-070).** Lệnh Đàm: *"Tiếp tục làm như prompt trên mà không hỏi lại, cho phép bạn tự quyết
> định mọi thứ và tech debt. Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào UX/UI."*
> Không đụng Thành phố. Đóng `#96 · #98 · #100`, cập nhật `#99`.
>
> ### Năm chỗ đổi (chi tiết + lý do: ADR-070; tóm tắt: CHANGELOG 2026-09-06 vòng 35)
> 1. **Tự chốt bước tuần · thưởng trọn ngày tự vào** — ngay trong `completeFocusSession`
>    (`autoClaimWeeklySteps` + `getDailyMissionAllBonusXP`, cùng công thức nút cũ), cộng vào XP phiên,
>    kể ở chuỗi thẻ (thẻ «Bước tuần» mới · thẻ Nhiệm vụ ghi «Trọn ngày +N XP — đã cộng»). Xoá
>    `claimWeeklyStep` · `claimMissionAllBonus` và mọi nút Nhận/Chốt bước. ⚠️ Phép ĐỐI CHIẾU lịch sử
>    mà nút «Nhận» cũ làm (`rebuildMissionsFromHistory`) đi theo về store — bài test cũ
>    «reconciles stale completed missions» đổi thành bài đối chiếu TRONG phiên.
> 2. **Di vật lớn theo PHIÊN** — `engine/relicGrowth.js`: mốc `[0, 20, 50]` phiên ≥25′ kể từ
>    `relic.earnedAt` (phiên nhận không tính; save cũ đóng dấu lúc nạp ở `normalizePersistedGameState`).
>    Chốt sau `newHistory`, kể ở thẻ «Di vật lên bậc». Xoá `evolveRelic` + `t2Cost/t3Cost` + hai hàm
>    giá; `RelicInventory.jsx` hiện thanh «N/20 phiên ≥25′ · còn M». Kỳ quan kỷ 15 rút mốc 30%.
> 3. **Đặc quyền công trình về trục sống** — `WONDER_EFFECT_REGISTRY` viết lại (11 kỳ quan → buff
>    `passive` XP/EP/combo/XP phẳng có ngưỡng phút; 4 luật còn được đọc giữ id), `wonderEffects.js`
>    là nguồn duy nhất (`wonderPassiveBuffs` → `activeBuffs`; `wonderCrisisWindowBonusHours`;
>    `wonderRelicEvolveFactor`); gỡ 7 helper kỳ quan chép tay trong store + 3 hàm giá/phạt.
>    `BUILDING_PERK_REGISTRY`: rương trả XP thay tinh luyện; `safety_net` → «phiên bù sau khi huỷ».
>    `rewardAxes.test.js` khoá cả hai bảng. Thẻ +XP thêm chip «+N EP» (buff EP phải THẤY được).
> 4. **Xoá `LootDropModal.jsx`** (1.057 dòng) + mọi cổng ở `OverlayStack` (`showLootModal` ·
>    `detail === 'loot'` · `pendingEraChanged` · preload). `finishStory` đóng phần thưởng KHÔNG ĐIỀU
>    KIỆN. Thẻ «Kỷ nguyên mới» có nút «Xem thành phố mới» + `playEraChange`; `notifyLevelUp` kêu một
>    lần ở thẻ lên cấp. `previewStage.js` bỏ 3 trường không ai đọc, thêm 5 trường ADR-070; test của nó
>    đọc HAI file chuỗi thẻ (bắt cả `reward?.x`).
> 5. **Huy hiệu «Kế tiếp»** — 4 huy hiệu gần đạt nhất sau dải hero (thanh + «còn N»); dải hero nói
>    «còn N phút/phiên»; bỏ bộ lọc BẬC; gỡ `AchievementCard` chết (~140 dòng). Dọn chữ đồng tiền ngủ:
>    «Tinh luyện» → «Phiên sâu» (lịch sử Thống kê) · hàng «Tài nguyên» ở Thăng hoa · câu onboarding.
>    `engine/buffLabel.js` dịch buff một chỗ.
>
> ### Đã trả giá / bắt được trong lúc làm
> · **Bài test "cửa vẫn đóng" (eraLegacy) xanh nhờ một thứ chẳng liên quan**: nó đòi
>   `startProject(era5[2]) === false` và đúng chỉ vì fixture KHÔNG có túi kỷ 5 — `startCrafting` từ
>   chối vì thiếu tiền, không vì cửa đóng. ADR-069 gỡ cổng tiền thì nó đỏ trên mã đúng (bẫy Phase
>   7D). Nay hỏi đúng luật còn sống: khe trùng tu có đúng MỘT (`LEGACY_QUEUE_SLOTS`).
> · **Gỡ nút «Nhận» mà đánh rơi phép đối chiếu**: bản đầu `completeFocusSession` tick thẳng trên
>   `prev.missions`, nên một "3/3" giả (không lịch sử) sẽ kéo theo thưởng trọn ngày thật. Bài cũ
>   `claimMissionAllBonus reconciles…` bắt được — đổi nó thành bài đối chiếu trong phiên, và
>   `rebuildMissionsFromHistory` (cùng hàm `refreshDailyMissions` dùng) nay chạy trước tick.
>   *Bỏ một nút thì đi tìm mọi việc nút ấy làm NGOÀI việc trao thưởng.*
> · **Bài test mới của tôi rơi đúng cái bẫy ấy**: «đã nhận hôm nay thì phiên sau KHÔNG cộng lần
>   hai» khai `claimed: true` với lịch sử RỖNG ⇒ bị reset đúng luật ⇒ cộng lại. Sửa TIỀN ĐỀ (thêm một
>   phiên thật hôm nay), không sửa luật.
> · **Chú thích cũ khớp regex của cổng**: `DailyMissions.jsx` có dòng chú thích «hỏi `wonderEffect
>   === '…'`» làm bài canh-cấu-trúc `wonderEffects.test` đỏ. Một bài đọc-mã-nguồn bắt cả LỜI KỂ về
>   lỗi — viết lại chú thích cho khỏi giống lỗi nó kể.
> · **ẢNH BẮT ĐƯỢC THỨ CỔNG SỐ KHÔNG BẮT (lần thứ hai trong hai vòng)**: kho di vật trên fixture in
>   «Di vật Kỷ Băng Hà — tăng tài nguyên rớt» — `rewardAxes.test` xanh vì nó chấm BẢNG, còn chữ ấy nằm
>   trong SAVE (bản chép label/description/buff từ lúc nhận). Vá gốc: `withCanonicalRelicText` đọc lại
>   bốn trường từ `ERA_CRISES` lúc nạp (`normalizeStoredRelic`), có test rehydrate. *Một trường được
>   chép vào save là một bản sao sẽ trôi khỏi bảng — đọc lại từ bảng ở cửa nạp, đừng tin bản chép.*
> · **Hero huy hiệu in «còn còn 37 phiên»**: `cauConLai` đã mang sẵn chữ "còn", dải hero lại thêm một
>   lần. Chỉ ảnh mới thấy; nay có test `inventoryHero` cấm "còn còn".
> · **`no-use-before-define` bắt một hằng số module đặt sau component** (`RELIC_EVOLVE_SESSIONS_TEXT`)
>   — đúng ca luật ấy sinh ra để bắt (app trắng lúc render).
> · Phép so EP kỳ quan dùng TỈ SỐ (`epWith/epWithout ≈ 1,08 ± 0,03`) thay vì con số tuyệt đối — bậc 0
>   kỷ 7 chỉ có `expBonus` nên tỉ số sạch; con số tuyệt đối sẽ trôi theo mọi lần chỉnh EP.
> · Không đụng `engine/city3d/` · `components/city/` (kể cả chú thích lịch sử nhắc `LootDropModal`
>   ở `CityGrowthMoment.jsx`) · `cityLayout` · địa hình. Hình dạng `craftingQueue`/`buildings`/
>   `cityArchive` giữ nguyên; ADR-007 nguyên. Không migration.
>
> ### Cửa soi
> `node scripts/shot.mjs --phone --fixture fx-sp.json --preview "loot-max&dc-preview-card=<thẻ>"` với
> thẻ = `xp|project|streak|today|quests|chain|quest|level|rank|relic|evolve|era` (cảnh `era` cho thẻ kỷ
> mới có nút «Xem thành phố mới»). Màn Tiến trình: `--click "Thêm" --click "Tiến trình"`; kho di vật:
> `--tab "Hành trang" --click "Huy hiệu"`.
>
> > `npm run test:fast`: **1633 bài · 1632 pass · 0 fail · 1 skipped** (vòng 34: 1622). Lint sạch, build xanh. Test
> mới: `gameStore.adr070.test.js` (9) · `relicGrowth.test.js` (7) · `buffLabel.test.js` (3) · `wonderEffects.test.js`
> viết lại (5) · `rewardAxes` +2 · `sessionRewardStory` +2 · `inventoryHero` +1; gỡ 2 bài `evolveRelic`, 2 bài
> đọc `LootDropModal`. Ảnh nghiệm thu 390px: `$SP/shots/v35-*.png` (huy hiệu · tiến trình · 5 thẻ · màn Tập trung).
>
> Cập nhật lần cuối: **2026-09-06 (vòng 34)** — **ĐỒNG TIỀN DUY NHẤT LÀ PHIÊN (ADR-069).** Lệnh Đàm:
> *"SIMPLIFY. MINIMIZE. AMPLIFY FUN. … coi Upgrade + Progression + UX/UI như một sản phẩm cần redesign
> từ đầu … cơ chế nào tồn tại chỉ vì được code ra thì xoá … TUYỆT ĐỐI KHÔNG ĐỤNG VÀO THÀNH PHỐ."*
>
> ### Bốn chỗ đổi (chi tiết + lý do: ADR-069; tóm tắt: CHANGELOG 2026-09-06)
> 1. **Công trình một màn, một nút** — `BuildScreen.jsx` thay Xưởng + Bản vẽ (1.649 dòng; trang
>    2.376px → **1.688px**): Đang xây · **Xây tiếp** (≤3 lựa chọn, «Khởi công», mục chỉ hiện khi còn
>    gì để chọn) · Đã xây (ô kể ĐẶC QUYỀN, không còn «Lv.2 · ×1.75») · Trùng tu (ô riêng, ADR-012).
>    Store **`startProject`**: không hỏi RP/nguyên liệu, giữ cổng ô/trùng/đã-xây/trùng-tu, mục hàng
>    chờ GIỮ NGUYÊN hình dạng (giàn giáo của thành phố đọc nó). Luật thuần `engine/buildChoices.js`.
> 2. **Bậc tự thăng · khủng hoảng kỷ = nhiệm vụ mềm** — `engine/rankLadder.js` đếm thẳng `history`
>    («đủ EP gác + N phiên ≥M′ trong 48 giờ»); không nút, không hạn, không phạt, không chặn Bắt đầu.
>    `EraCrisisModal` · `DisasterModal` · `StakePanel` · `ResourceDisplay` **xoá hẳn**; hộp xác nhận
>    huỷ thôi doạ «phạt N% tài nguyên». `RankDisplay` viết lại thành thẻ kể hai điều kiện.
> 3. **Chuỗi thẻ thưởng** (ADR-068) thêm: thẻ Thành phố (công trình nhích / «hàng chờ trống — chọn
>    ngay») · **lên cấp MỜI CHỌN ≤3 kỹ năng tại chỗ** (`hold`, «Để sau — điểm vẫn giữ») · thử thách
>    kỷ · bậc · di vật. Hộp xác nhận mua kỹ năng bỏ; «Tổ hợp kỹ năng» gấp.
> 4. **Mọi phần thưởng nằm trên trục sống** — phát hiện KHI SOI ẢNH, không phải khi đọc mã: thẻ
>    «THĂNG BẬC» in **«+12% Tài Nguyên»** giữa một vòng lặp vừa bỏ tài nguyên; đếm ra 2/8 bậc mỗi
>    kỷ, **12/15 di vật**, 4 kỹ năng đều thưởng lên ba đồng tiền đã ngủ. Đổi theo chủ đề: bậc lẻ →
>    EP · di vật «tăng trưởng» → EP, «tri thức» (RP) → XP, «che chở» (giảm thảm hoạ) → giờ combo ·
>    Vận May quay ra +XP/+EP (chip «🍀 Vận may» ở thẻ +XP) · Sự Tha Thứ → +6% XP phiên kế sau huỷ.
>    `rewardAxes.test.js` từ chối bảng nào nhắc lại tài nguyên/RP/thảm hoạ.
>
> ### Đã trả giá / bắt được trong lúc làm
> · **Phiên vừa xong bị coi là "tương lai"**: `countQualifyingSessions` bỏ mọi mốc `t > now`, mà
>   `now_ts` trong `completeFocusSession` được đọc TRƯỚC `resolvedFinishedAt` ⇒ bậc KHÔNG BAO GIỜ tự
>   lên trong test store (đỏ đúng). Vá: `now = max(now_ts, mốc của chính phiên ấy)`. *Một phép đếm
>   "gần đây" phải nhận một `now` không sớm hơn thứ nó đang đếm.*
> · **File đã đổi trên đĩa trước khi script của tôi tới** (`sessionRewardStory.js`, `App.jsx`) —
>   assert «đúng 1 chỗ khớp» đếm ra 0 và DỪNG thay vì ghi đè. Không có vế đếm ấy thì một phép sửa
>   trượt và một phép sửa thành công trông y hệt nhau. Mọi script sửa file ở phiên này đều đòi số khớp.
> · **`test:fast` lượt đầu đỏ 4 bài, không bài nào vì mã hỏng**: hai bài đọc-mã-nguồn còn tìm cổng
>   `isCrisisBlockingStart` (đã bỏ), một bài neo vào literal `'Bắt đầu phiên'` (nhãn nay là JSX text
>   trần), một bài đòi hộp thoại thảm hoạ MỞ. ⇒ *Bỏ một cổng thì `grep` tên cổng ấy trong cả test.*
> · **Lần thứ N của «một luật hai công thức» ở tầng test**: `getComboDecayMs` test viết cứng **18**
>   thay vì hỏi `RELIC_COMBO_WINDOW_CAP_HOURS` ⇒ đỏ oan đúng lúc nâng trần. Nay hỏi hằng số.
> · **Một bài test cũ ĐỎ ĐÚNG và thắng tôi**: tôi đặt trần combo 24 («một ngày») dưới tổng Huyền
>   Thoại 26 với một câu lý lẽ rất xuôi; `challengeEngine.test` «trần không được cắn loadout thật»
>   đỏ ngay. Luật đã khoá từ trước đúng hơn quyết định mới — trần về 28 (lưới an toàn như mọi trần).
> · **`soundReach.test` bắt `playDisaster` mồ côi** ngay sau khi xoá `DisasterModal` — gỡ luôn cùng
>   4 dòng palette. *Xoá một màn thì đi tìm tiếng, thông báo, cờ `ui` và test đang trỏ vào nó.*
> · **Ảnh nghiệm thu bắt được thứ số không bắt**: cả ba bảng phần thưởng đều hợp lệ, test xanh, số
>   đúng — chỉ có THỨ NHẬN ĐƯỢC là không ai thấy. Cùng họ ADR-054 (*cổng số xanh chỉ chứng minh thứ
>   nó đọc, không chứng minh thứ ấy tới được điểm ảnh*), ở tầng thiết kế thay vì tầng dây nối.
> · Không đụng `engine/city3d/` · `components/city/` · `cityLayout` · địa hình · thực vật; hình dạng
>   `craftingQueue`/`buildings`/`cityArchive` giữ nguyên (ADR-007 nguyên). Không migration.
>
> ### Cửa soi
> `node scripts/shot.mjs --phone --fixture fx-sp.json --preview "loot-max&dc-preview-card=<thẻ>"` với
> thẻ = `xp|project|streak|today|quests|quest|level|rank|relic|era`; fixture `fx-sp.json` = tài khoản
> kỷ 8 + 5 SP + khủng hoảng mềm đang mở, để soi thẻ lên cấp (chọn kỹ năng) và thẻ thử thách.
>
> Nợ: **#95 ✅ đóng** (ADR-069) · **#99** mới (dữ liệu ngủ: tài nguyên/RP/tinh luyện vẫn cộng, 5
> action + `craftReadiness.js` không ai gọi) · **#100** mới («Chốt bước» + lưới 360 huy hiệu vẫn phải
> bấm) · **#96** vẫn mở (tiến hoá di vật tiêu tinh luyện — nay càng chết; lối ra nhất quán là tiến
> hoá theo PHIÊN, quyết định của Đàm). Test mới: `buildChoices` (7) · `rankLadder` (6) ·
> `gameStore.adr069` (7) · `rewardAxes` (5) · +3 Vận May/Ý Chí ở `gameMath`. **`npm run test:fast`:
> 1.622 bài · 0 fail · 1 skipped.** Lint sạch · build xanh.
>
> Cập nhật lần cuối: **2026-09-05 (vòng 33)** — **CÁCH MẠNG VÒNG LẶP CHÍNH (ADR-068).** Lệnh Đàm:
> *"làm một cuộc cách mạng về upgrade, đừng upgrade nhỏ lẻ nữa… ứng dụng UX Psychology… có thể xoá
> những gì đã có và xây lại… hạn chế đo mà build thẳng… không đụng Thành phố."*
>
> ### Ba chỗ đổi, một vòng lặp (kích hoạt → hành động → thưởng)
> 1. **`TodayHero`** đứng đầu màn Tập trung: chuỗi 🔥 N · "+N% XP/phiên" · **dải bảy ngày T2→CN**
>    (`WeekStrip`) · mốc kế tiếp; chuỗi treo ⇒ *"Làm một phiên để giữ chuỗi"* thay mốc. Lời chào
>    còn một dòng 13px. Ô Hôm nay/Chuỗi ở thanh tiêu đề ẩn ở tab này (`hideStats`, chuông dời lên
>    cạnh "Cấp N"); hai thẻ cùng tên ở `FocusRail` (desktop) gỡ hẳn.
> 2. **Nhiệm vụ ngày ngay dưới đồng hồ** (`<DailyMissions section="daily" />`, `lg:hidden`). Tab
>    `missions` giữ id, nhãn → **"Tiến trình"**, rời nhóm chính ⇒ thanh dưới iPhone **4 nút**.
> 3. **`SessionRewardStory`** sau MỌI phiên: xp → chuỗi → hôm nay → nhiệm vụ → cấp → kỷ. Điều phối ở
>    `OverlayStack`: lễ mừng thành phố → chuỗi thẻ → (lên kỷ) `LootDropModal`. `finishStory` đóng
>    phần thưởng và dọn toast chuỗi thẻ đã nói thay (nhiệm vụ vừa xong, lên cấp).
>
> ### Đã trả giá / bắt được trong lúc làm
> · **Nút Bắt đầu suýt tụt dưới thanh tab LẦN THỨ TƯ** (ảnh 390px: y≈765–800, thanh tab y=774) ngay
>   ở bản đầu của khối chuỗi. Vá bằng cách hạ lời chào 19px×2 dòng → 13px×1 dòng và bỏ hàng
>   "Hôm nay · N phút" khỏi khối. *Mọi thứ thêm vào cột giữa đều tiêu vào biên của nút chính.*
> · **Thẻ "Thưởng chuỗi tuần" bóp tên thành "Th / ch / tua"** (ba dòng) khi có cả ô XP lẫn nút
>   "Chốt bước" — lỗi có sẵn, chỉ lộ khi tab Tiến trình đưa khối tuần lên đầu. Một hàng chỉ đủ MỘT
>   ô bên phải: XP vào nút ("Nhận +43 XP") hoặc đứng một mình.
> · **`ADR-067` đã có chủ** (Thống kê) — bản đầu tôi đánh số trùng; đổi thành 068 chỉ ở dòng mình
>   thêm (so với HEAD từng dòng), không đụng tham chiếu 067 thật.
> · `--preview loot` với phiên thường trước đây cho ra ảnh TRÙNG BYTE với màn Tập trung — không phải
>   cửa soi hỏng: **đó chính là hành vi thật** (toast 4 giây đã tắt trước khi chụp). Đây là con số
>   nói lên vì sao cần cái kết.
> · `previewStage.test.js` chỉ đọc trường từ `LootDropModal` ⇒ thêm `multiplier` vào bản giả bị kêu
>   "bịa". Nay đọc từ CẢ HAI người đọc `pendingReward` (hộp thoại + chuỗi thẻ).
>
> ### Cửa soi mới
> `node scripts/shot.mjs --phone --fixture fx.json --preview "loot&dc-preview-card=streak"` — có
> `dc-preview` thì thẻ ĐỨNG YÊN; `dc-preview-card` = `xp|streak|today|quests|level|era`.
> Cảnh `loot` gieo thêm `missionCompletedIds: ['session_30min']` để soi trạng thái "vừa xong".
>
> Test mới: `todayHero.test.js` (5) · `sessionRewardStory.test.js` (9). Sửa: `appNavigation` (4→3
> nút) · `rewardToastWiring` (+1 cổng chuỗi thẻ) · `previewStage.test`. Không đụng
> `engine/city3d/`, `components/city/`, `useCityMoment.js`.
>

> Cập nhật lần cuối: **2026-09-05** — **MỘT LỖI THẬT Ở THANH NHIỆM VỤ, TÌM RA BẰNG CÁCH ĐỌC MỘT
> CON SỐ TRÔNG LẠ TRÊN ẢNH CHỤP.**
>
> ⚠️ **`singleSession` có HAI công thức tiến độ trong CÙNG `gameStore.js`, cách nhau ~1.300 dòng.**
> Đường SỐNG (sau khi chốt phiên) ăn-cả-hoặc-không · đường DỰNG LẠI (`getDailyMissionProgress
> FromSnapshot`) liên tục. ⇒ phiên 22 phút ghi **0/30**, tải lại app thì chính nó ghi **22/30**.
> Build xanh · lint sạch · test xanh; triệu chứng duy nhất là một con số tự đổi khi mở lại. Đúng
> luật *một luật một công thức*. Đã kéo đường sống về khớp; **luật hoàn thành không đổi** (vẫn phải
> có MỘT phiên đủ dài). Khoá bằng `missionProgressAgreement.test.js`.
> ⚠️ **CÁCH TÌM RA, đáng lặp lại:** không phải đọc mã mà là **đọc một con số trông lạ trên ảnh
> chụp** — nhãn ghi *"Hoàn thành 1 phiên ≥30 phút"* mà tiến độ ghi *"0/30"*: mẫu số không khớp câu
> chữ. *Khi nhãn và con số cạnh nhau kể hai chuyện khác nhau, một trong hai đang nói dối.*
> ⚠️ **BẪY `indexOf` BẮT NHẦM KHỐI CẮN LẠI** — bài test đầu neo vào
> `const updatedMissionList = refreshedMissions.list.map`, chuỗi ấy có **HAI** chỗ và chỗ đầu là
> một khối hẹp chỉ lo `perfectBreaks` ⇒ đỏ oan, thông báo trỏ vào một loại nhiệm vụ hoàn toàn lành.
> ⇒ **hàm cắt khối phải ĐÒI mốc khớp đúng MỘT lần**, đừng chỉ `indexOf`.
>
> **`DEFAULT_DEEP_FOCUS_THRESHOLD = 26` PHÚT, MÀ PRESET "CHUẨN" LÀ 25** ⇒ ở nhịp mặc định Đàm hụt
> hệ số ×1.3 **đúng một phút, mỗi phiên, mãi mãi**. Đây là quyết định CÂN BẰNG GAME (đổi preset là
> đổi nhịp làm việc của anh) nên **chờ Đàm quyết** — phiên này chỉ làm cho nó nhìn thấy được: dòng
> nhắc đi từ `text-[10px] opacity-60` lên 11px đậm màu nhấn (**"+1′ nữa là ×1.3"**).
>
> **Dòng khoảnh khắc nay xếp theo TÍNH CẤP THIẾT, không theo độ lớn phần thưởng** (ăn mừng → lý do
> bấm Bắt đầu → lời mời đi chỗ khác). Phép thử phân định: *câu này có làm Đàm bấm Bắt đầu không?*
> Trên máy thật, bản cũ nuốt mất *"Còn ~2 phiên nữa tới «Khám Phá Tân Thế Giới»"* ở đúng tài khoản
> đang ở 1.831/1.867 EP.
>
> **ĐÃ ĐO RỒI TỪ CHỐI, đừng thử lại:** nhãn bậc `•••○ TỐT` trên thẻ phần thưởng trông như hằng số
> vô nghĩa (mọi bên gọi truyền cứng), nhưng trên CÙNG một màn thẻ ngày là `tot` còn thẻ tuần là
> `hiem` ⇒ nó phân biệt được hai thứ đứng cạnh nhau. **Giữ.**
>
> ⚠️ **`START_HERE.md` MANG MỘT GHI CHÚ CŨ NGUY HIỂM, ĐÃ SỬA:** nó ghi van ép chuyển skin "chưa
> làm" trong khi việc ấy xong từ 2026-08-29. Để nguyên thì phiên sau ép skin lần thứ hai và **đè
> lên lựa chọn có ý thức của Đàm**. ⇒ *sau một phép gộp nhánh, ghi chú trạng thái là thứ trôi
> trước tiên — kiểm nó bằng MÃ, đừng tin chữ.*
>
> **Kiểm được mà không phải lỗi** (ghi để khỏi đi lại): "CHUỖI 0" trên fixture là ĐÚNG — fixture
> cách hôm nay hai ngày nên chuỗi đứt theo luật.
>
> npm run test:fast: **1363 pass · 1 skipped · 0 fail**. Lint sạch, build xanh.
>

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
- 🔴 **CHỜ ĐÀM — NHÌN ẢNH PHASE 21.** Bản quét 15 kỷ + **12 ảnh nhìn thẳng từ trên xuống** (kỷ
  1 · 3 · 7 · 10 · 11 · 14, mỗi kỷ chụp ở **20 phiên và 120 phiên** để thấy thành phố lan ra),
  `--width 1500`. **Nghiệm thu bằng MẮT, không bằng cổng số**: kỷ 1–9 không được thấy hàng lối nào;
  kỷ 11–15 thì phải thấy. Cổng số chỉ nói được rằng mã làm đúng thứ nó được bảo làm.
- ✅ **ADR-007 — ĐÀM ĐÃ DUYỆT PHƯƠNG ÁN (a)** (khép lại mục "CHỜ ĐÀM QUYẾT" của Phase 20): chấp nhận
  dời 75/75 công trình **MỘT LẦN**, sau đó bố cục mỗi kỷ **đóng băng vĩnh viễn**. Không dựng hai bộ
  sinh song song. ⚠️ **Từ ngày gộp `main`, đổi bộ sinh bố cục của một kỷ là một quyết định DI TRÚ —
  phải hỏi Đàm trước**, vì nó dời công trình trong bản lưu thật. Ghi ở ADR-064.
- ⚠️ **`TECH_DEBT #89` VẪN MỞ dù cổng đã qua (11,33 → 12,44).** Đừng đọc con số ấy là "đã giải":
  tách ba dải cho thấy toàn bộ phần tăng nằm ở dải ĐẤT (+2,37), còn dải TRỜI — cần gạt đã nêu đích
  danh hai lần — gần như không nhúc nhích (4,12 → 4,05) và dải THÀNH PHỐ còn tệ đi. Biên chỉ 0,44.
  Ba hướng của Đàm vẫn còn nguyên.
- ⚠️ **`TECH_DEBT #90` — ĐÃ THU HẸP HAI LẦN, VẪN MỞ.** (a) danh sách kỷ ngắn đi sau khi chia khu
  phố: `[1,2,6,7]` → `[1,7]` (hợp nhất) → **`[5]`** (sau §5), biên mỏng nhất 0,9508 → 0,9386 →
  **0,9942**; (b) ô mất chi tiết mái **7/476 (1,5%) → 10/473 (2,1%)**, kỷ tệ nhất 0,893 → 0,844 —
  tức nửa (b) **XẤU ĐI** ở §5. ⚠️ Cả hai lần chuyển đều là hệ quả của một phép **đổi tỉ lệ loại
  nhà** (thêm ô đường ⇒ đổi ô nào là nhà ⇒ đổi tỉ lệ `workshop`, nguyên mẫu thấp-rộng có tỉ số xấu
  nhất), **không phải** cơ chế được sửa. Bản vá thật vẫn đụng bảng `storey` lịch sử của Phase 14 và
  kỷ 1 vẫn không còn chỗ (1,95 trên trần 2,0, cần 2,05). **Cấm** hạ sàn 0,7 hoặc hạ ngưỡng 0,95 để
  lấy lại con số.
- ⚠️ **`TECH_DEBT #88` (mới, Phase 21 §4) — cột `units`/`cols`/`rows` của bảng khu phố tạm là TRỤC
  CHẾT.** `BLOCK_MAX_CELLS = 1` (thứ chặn khối nhà xuyên qua nhau) khoá số suất đất ở **4 ở cả 15
  kỷ**. Đã đếm ra tường minh bằng một bài test đi qua đúng đường dựng thật, kèm ba phương án đã đo.
  **Không nới trần**: đo được trần 2 thì khối lại xuyên qua nhau.
- ⚠️ **CHỜ ĐÀM — SAU PHASE 13 VIỆC B (vùng phụ cận).** (a) **Nhìn 15 kỷ** rồi gật hoặc chỉnh hướng
  mỹ thuật — ba cổng đo đều đạt rộng, nhưng điều kiện DỪNG (c) của chỉ thị là *"dựng xong, (G1) đạt,
  mà ẢNH XẤU ĐI"*, và chỉ mắt Đàm mới trả lời được câu đó. (b) Quyết **có gộp `main`** hay không cho
  các commit trên nhánh `claude/xay-san-pham-huong-nay-nasr3n`. **KHÔNG tự gộp.**
- ⚠️ **`TECH_DEBT #74` — CHỜ ĐÀM QUYẾT (câu hỏi thiết kế game, cùng họ `#14`).** Vùng phụ cận là
  tầng ĐỊA LÝ nên **2241 vật ở mốc 80 phiên bằng đúng số vật ở mốc 0 phiên** — nó làm thành phố
  trông lớn ngay từ phiên đầu, nhưng nó **không lớn lên theo công sức của Đàm**. Ba hướng (giữ
  nguyên là bối cảnh / cho một phần mở dần theo phiên / trộn) đã ghi ở mục nợ; chưa tự chọn, vì
  chọn sai hướng là làm hỏng vòng lặp phần thưởng chứ không phải làm hỏng một con số.
- ⚠️ **`TECH_DEBT #54` — vùng phụ cận KHÔNG chặn camera cận cảnh.** Kế thừa có chủ ý: bộ hoạch định
  đường bay chỉ biết CÔNG TRÌNH chứ không biết ĐỊA HÌNH, nên chặn cây/ruộng mà không chặn quả đồi
  bên dưới là mua một sự an toàn GIẢ. Xem lại khi nào bộ hoạch định biết đọc cao độ.
- ⚠️ **CHỜ ĐÀM — BA VIỆC SAU BƯỚC C.** (a) **Xem 4 ảnh** `estuary` kỷ 8 · `estuary` kỷ 11 · `canal`
  kỷ 10 · `meander` kỷ 5 rồi gật hoặc chỉnh hướng mỹ thuật. (b) Chạy **một lượt**
  `bash scripts/bench-macbook.sh` trên MacBook để làm mới số liệu (KHÔNG phải cổng, không chặn gì) —
  hộp cát AI chạy SwiftShader nên script tự từ chối ở đó. (c) Quyết **có gộp `main`** hay không cho
  các commit đang nằm ở nhánh `claude/xay-san-pham-huong-nay-nasr3n`. **KHÔNG tự gộp.**
- ⚠️ **`TECH_DEBT #60` — NGỮ PHÁP VEN NƯỚC (cầu · bến · thuyền · kè).** Đây là phương án (c) mà Đàm
  đã CHẤM ĐÚNG VỀ MỸ THUẬT nhưng hoãn lại: *"đổi thứ mang bản sắc sang cầu/bến/thuyền/kè là ĐÚNG về
  mỹ thuật nhưng là cả một phase mới… đừng nhét vào khe hở của Bước C."* Điều kiện xem lại: **khi
  nào có phase chi tiết ven nước**. Nó là thứ chữa được ba kỷ nước hẹp (6 · 7 · 10) mà KHÔNG phải
  nói dối địa lý.
- ⚠️ **`TECH_DEBT #61` — theo dõi, KHÔNG hành động.** Cổng 5% là một *thứ đại diện*, chính Đàm chỉ
  ra. Dữ liệu Bước C **chưa** cho ca nào cổng và mắt bất đồng ⇒ giữ nguyên cổng đã hiệu chuẩn.
- *(ĐÃ XONG, giữ lại để đối chiếu)* **`TECH_DEBT #59` — Đàm chốt hướng (b) ngày 2026-08-20.** Ba kỷ nước hẹp không đạt
  cổng 5% ở **BẤT KỲ** góc nào (kỷ 6 có trần toàn cục 4,44%). Đây là bài toán **BỀ RỘNG trong bảng**,
  không phải bài toán góc — nên `worldYaw` không chữa được, và trải Bước C tới chúng mà chưa chốt là
  tiêu ngân sách cho thứ Đàm gần như không nhìn thấy. Ba hướng đã cân sẵn ở `TECH_DEBT #59`
  (nới bề rộng / chấp nhận + đếm tường minh trong test / đổi thứ mang bản sắc sang cầu-bến-thuyền-kè).
  **Mười một kỷ còn lại KHÔNG bị chặn.**
- *(ĐÃ XONG 2026-08-20, ADR-042 — giữ lại nguyên văn để đối chiếu)* **VIỆC 2 Bước C.** `TECH_DEBT #57` đã ĐÓNG (ADR-041, 2026-08-20):
  camera mặc định nay thật sự nhìn ra nước (kỷ 14: 0,09% → **23,75%** · kỷ 12: 2,30% → **9,32%**),
  nên phần thưởng của Bước C sẽ không còn nằm ngoài khung hình. Bước B đã XONG (ADR-040, 2026-08-19).
  Bước B đã dựng hình nước cho đúng 3 kỷ (14 biển · 12 sông · 1 khô), mọi ràng buộc Đàm ra đều đo
  được và đã đạt: +1 lệnh vẽ CHỈ ở 2 kỷ có nước · kỷ 1 trùng từng byte · 0 nguồn sáng mới · 0 texture
  mới · 0 shader động · 0 lỗ thủng ở bờ. **Bước C = trải nốt 12 kỷ còn lại — ĐÃ LÀM XONG**, xem
  khối 🌊 ở đầu file. (Câu cũ ghi "13 kỷ" là đếm nhầm: 15 − 2 kỷ đã dựng − 1 kỷ khô = **12**.)
  *(Nguyên văn chỉ thị Bước B, giữ lại để đối chiếu:)*
  Ba sửa ấy: kỷ 5 phải CÓ NƯỚC (thêm kiểu thứ sáu `meander` — khúc uốn ôm ba mặt) · kỷ 11 đổi
  `sea` → `estuary` cho khớp `note` · luật hướng bờ nước viết lại thành QUAN HỆ
  (`MAX_SIDE_SPREAD = 2` thay cho mức tuyệt đối 6), cộng phép gác Q2 "nước phải nằm gọn trong địa
  hình". Bước B: dựng hình cho **ĐÚNG 3 kỷ** — **biển kỷ 14** (Singapore, đảo quốc) · **sông kỷ 12**
  (Nga, `width 3,4`, dải rộng nhất bảng) · **khô kỷ 1** (Thổ Nhĩ Kỳ — làm chứng cho ràng buộc cứng:
  kỷ không nước giữ nguyên mốc lệnh vẽ, không đổi một đơn vị) — chụp ảnh trước/sau ở khung mặc định,
  đo chỗ giáp bờ, rồi **DỪNG hỏi tiếp**. Bước C mới trải 12 kỷ còn lại. Ràng buộc Đàm ra: nước tốn
  **tối đa +1 lệnh vẽ và CHỈ ở kỷ có nước**, cập nhật `MOC_LENH_VE` theo TỪNG KỶ, **KHÔNG nâng trần
  chung** · **CẤM** nguồn sáng mới, texture mới, shader nước động (sóng/gợn/phản chiếu động) — nước
  PHẲNG, vật liệu TĨNH; hình học thì thoải mái · **cấm đụng** lưới 12×12, `deriveDwellings`,
  `computeCityLayout` · quan hệ `settingStyle → outskirts` MỘT CHIỀU.
  ⚠️ **Cổng không đo được bằng test** (lời Đàm): *"kỷ có biển phải đọc ra là **thành phố cảng**,
  không phải thành phố cạnh một vũng xanh. Ảnh không đạt câu đó thì phase chưa xong, dù mọi con số
  đều xanh."*

> ⚠️ **CHƯƠNG TRÌNH ĐANG CHẠY (cập nhật 2026-08-20) — "QUY MÔ TRƯỚC, HIỆU ỨNG SAU".** Đàm đảo thứ
> tự vì tôi đã đọc sai yêu cầu của anh: mệnh đề ĐẦU là **quy mô**, mệnh đề HAI là **độ cao**, ánh
> sáng chỉ là mệnh đề BA và *"tô bóng đẹp lên một bố cục sai thì được một bố cục sai được tô bóng
> đẹp"*.
> - **§1 (B) ĐỘ CAO — ✅ XONG** (2026-08-20, ADR-045). Đất trong lưới thôi gợn; ngoài lưới gồ ghề
>   CÓ HƯỚNG; thềm bậc còn ở 14/15 kỷ. ADR-007 vẫn nguyên.
> - **§2 (A) QUY MÔ — ⏳ CHỜ ĐÀM, đã đo xong phần chuẩn bị.** Phải tách hai nghĩa: "to hơn **trong
>   khung hình**" (camera) ≠ "to hơn **so với thế giới**" (tỉ lệ đĩa đất / rặng núi) — **Đàm muốn
>   nghĩa thứ hai**. Cần gạt trùng với `TECH_DEBT #53`, nên hai việc phải quyết CÙNG LÚC. Ba phương
>   án + giá + rủi ro ADR-007 đã ghi ở `TECH_DEBT #53`. **KHÔNG tự sửa bán kính đĩa đất, KHÔNG tự
>   đổi `gridSize`.**
> - **§3 HIỆU ỨNG — chỉ làm SAU (A) và (B).** Thứ tự rẻ-trước: tone mapping/tương phản → khử răng
>   cưa → che khuất môi trường (AO) → bóng mềm → phản chiếu mặt nước. Mỗi thứ MỘT commit, trước/sau
>   đo bằng `sweep-diff.mjs --frame`, ms thật. Trần làm việc **8 ms**. ⚠️ **ĐỪNG HẠ DPR.**
> - **§4 Q1 — chưa làm**: thêm một biến thể "khung mặc định" của cảnh nặng nhất vào
>   `scripts/bench-macbook.sh`.
> - Bộ số M3 vẫn CHƯA có cho các phase gần đây — nhắc Đàm chạy `bash scripts/bench-macbook.sh` khi
>   tiện. **Không** chặn §1 và §2.

> ⚠️ **CHƯƠNG TRÌNH ĐANG CHẠY (2026-08-18)** — Đàm đã duyệt hướng mỹ thuật Bước 1 và ra một
> **chương trình làm việc liên tục** cho giai đoạn "tiêu ngân sách" hiệu năng (dư 3,2 lần trên M3),
> gồm ba phase theo THỨ TỰ CỐ ĐỊNH, với **uỷ quyền tự chạy** giữa các phase:
> **Phase 10 Bước 2 ✅ (tầng trệt đủ 15 kỷ)** → **Phase 11 (MÁI — phase có thu hoạch thị giác lớn
> nhất, vì camera mặc định NHÌN XUỐNG nên mái là bề mặt lớn nhất trong khung hình)** → **Phase 12
> (ĐO tỉ lệ khung hình thành phố chiếm, rồi TRÌNH PHƯƠNG ÁN và DỪNG)**.
> ⚠️ **Ranh giới Đàm đặt — chỉ 6 ca phải dừng hỏi**: (1) **gộp `main` — LUÔN LUÔN hỏi**; (2) cổng
> nghiệm thu trượt 2 lần liên tiếp; (3) muốn đụng file ngoài danh sách cho phép (`src/engine/city3d/*`
> + test + `scripts/*` + tài liệu; **CẤM**: bảng màu · ánh sáng · đường · địa hình · thực vật ·
> camera · store · sync · AI Coach · `api/`); (4) phát hiện điều mâu thuẫn `PERFORMANCE.md`;
> (5) hết bước đo của Phase 12; (6) một quyết định mỹ thuật mà độ tự tin **dưới 80%**.
> ⚠️ **Được tiêu: tam giác · khối · đỉnh. CẤM tiêu: lệnh vẽ mới · vật liệu mới · nguồn sáng mới ·
> texture mới.** Và cấm "tối ưu hiệu năng" — máy còn dư 3,2 lần, mọi lo lắng về hiệu năng phải trả
> lời bằng `PERFORMANCE.md` chứ không bằng cảm giác.

0. **NHÁNH THÀNH PHỐ 3D — thứ tự Đàm đã chốt, KHÔNG được nhảy bước.**
   *Visual Foundation (**7A ✅**) → Terrain/City (**7B: địa hình ✅ · mật độ + khu dân cư CHƯA**) →
   Roads → Historical Architecture → Living City → Pomodoro → Polish.*
   **Việc kế tiếp = "mật độ + khu dân cư"**: thêm nhà dân nhỏ/vừa/lớn, cửa hàng, xưởng, kho, công
   trình phụ, và quy hoạch **ngoại vi → khu dân cư → trung tâm → landmark**. Đây là thứ Đàm phàn nàn
   rõ nhất còn lại — đất vẫn trống nhiều, 5 công trình cho cả một lưới 12×12.
   ⚠️ **Hai việc PHẢI làm TRƯỚC khi thêm nhà**: (a) Đàm đo lại cổng hiệu năng iPhone (`TECH_DEBT #23`)
   — phase này thêm hình học THẬT nên nếu không đo trước sẽ không tách được thủ phạm khi máy nóng;
   (b) Đàm chọn hướng cho `TECH_DEBT #24` (khung hình đang cắt công trình) — thành phố càng dày thì
   phần bị xén càng nhiều, và chỉnh bố cục + chỉnh khung một lần rẻ hơn hai lần.
   ⚠️ **CẬP NHẬT 2026-08-17 — việc (a) nay chỉ còn đúng nửa iPhone.** Nửa **Desktop đã đo và ĐẠT**
   trên MacBook M3 (dư 3,2 lần), và bộ số ấy nói rằng **thêm hình học gần như miễn phí** — 43%
   chênh tam giác chỉ đổi 2,4% thời gian. Tức trên Mac, "thêm nhà" **không còn là việc phải xin
   phép hiệu năng**. Trên iPhone thì vẫn chưa ai đo. **Trước mọi phase mỹ thuật, đọc
   `PERFORMANCE.md`** — nó nói bằng SỐ thứ gì rẻ (hình học), thứ gì đắt (điểm ảnh + ánh sáng), và
   ba thứ tuyệt đối không nên đụng.
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

### (Nhật ký cũ hơn → `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md`)

---

## 📚 Older journal + phase logs — archived

Entries before 2026-09-06 and the dated phase logs were moved verbatim to
[`docs/archive/BAN_GIAO_2026-09.md`](docs/archive/BAN_GIAO_2026-09.md) on 2026-09-06 (ADR-075); nothing was deleted.
`grep -n '<date>' docs/archive/BAN_GIAO_2026-09.md` to find one, or `node scripts/doc-budget.mjs --map docs/archive/BAN_GIAO_2026-09.md` for the index.
**This file is append-only and read `head -60` — keep it that way.**
