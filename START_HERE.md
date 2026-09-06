# START_HERE — read this file, and only this file, when opening a new session

> **The ONLY file required before working.** It holds project STATE; rules, token budget,
> infrastructure and the doc map are canonical in **`CLAUDE.md`** (auto-loaded). Working method,
> prompt shape, report format: **`PHASE_RULES.md`**.
> ⚠️ **Limit 16,000 chars, guarded by `npm test`.** When it goes red, push the oldest round into
> `docs/archive/START_HERE_LOG_*.md` (keep the 3 most recent) — never raise the limit, never delete.

## What this project is
Đàm's personal Pomodoro app (he is a non-coder). React + Vite + PWA · Zustand + localStorage ·
Supabase sync · Vercel. Live: `https://pomodoro-dc.vercel.app`.
Current front: **main loop + upgrades + a Stats screen that answers questions**
(ADR-068/069/070/071, `src/components/` + `src/engine/`).
The 3D city (`src/engine/city3d/` + `src/components/city/render3d/`) is a **finished black box —
Đàm forbids touching it.**

## Laws that bite here — the ones NOT already in `CLAUDE.md`
`CLAUDE.md` §Infrastructure owns the operational laws (only `main` ships · confirm Vercel "Ready" ·
the Vercel function ceiling and where API tests go · CAS sync · Gemini key) and §NEVER owns "never start a focus
session on dev/localhost". Do not restate them here — a summary that drifts from the rule is worse
than no summary (this file once had the merge rule backwards). These three are code invariants and
live here:
1. **ADR-007 — the museum never moves.** A building already placed NEVER changes position. Terrain
   must not depend on play progress. Breaking this = losing Đàm's city.
2. **Never lower DPR · never add a fourth light source.** The two fastest ways to ruin the visuals.
3. **`no-use-before-define` is ON** (2026-08-29) — a `const` used above its declaration renders a
   BLANK app, and lint/test/build all miss it (it happened). Three legitimate exemptions in
   `CityScene3D.jsx` carry a reason each. Never disable the rule "just to move fast".

## Where we are
Production branch `main` carries **both** work streams (merged 2026-08-28 on Đàm's direct order).
⚠️ Phase 21 therefore shipped **before** Đàm reviewed its screenshots — the "waiting on Đàm's eyes"
item below is still live, it just now reviews something already running.

- **Stats + economy — ROUND 36 (2026-09-06, LATEST): STATS ANSWER, THEY DO NOT PRESENT; #99 CLOSED
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
- 📚 **Rounds 20 → 33 moved to `docs/archive/START_HERE_LOG_2026-09-06.md`** (verbatim), together
  with the 3D city details (BSP skeleton · `reach` 0.8 · two-layer shadows · 15 eras/`country` ·
  12×12 grid · 3.2× perf headroom) — a finished black box is not worth paying tokens for every
  session. **Keep at most 3 rounds here**; a new round pushes the oldest down.
  Older rounds: `grep -n 'VÒNG 2[0-9]\|VÒNG 33' docs/archive/START_HERE_LOG_2026-09-06.md`.

### UI invariants currently in force
- **Rewards**: ONE shared card (`components/shared/RewardCard.jsx`), ONE rarity scale of **exactly
  four** tiers (`engine/rewardTiers.js`). Never add a fifth, never draw a bespoke reward card
  anywhere — `rewardTiers.test.js` locks the number 4.
- **Interruption law has no exceptions** (ADR-060/061): full-screen blocking is reserved for era-up ·
  ascension · era crisis · disaster. It works because one field became two:
  `lastWeeklyReportDate` = *invited*, `lastWeeklyReportSeenDate` = *seen*. Law: **opening = seen,
  closing writes nothing, an expired toast writes nothing**; the dot on the "Báo cáo tuần" button is
  the safety net (never expires) and must be wired on **both** platforms (desktop sidebar AND the
  iPhone "Thêm" menu).
- **Motion: EXACTLY THREE presets**, single source `src/lib/motionPresets.js` — `enter` · `press` ·
  `reward`. All three self-silence under "Reduce motion", so callers must not check it themselves.
  Never hand-write `initial`/`animate`, never add a fourth preset (`motionPresets.test.js` counts).
  Staggered lists use `withDelay(enterMotion, i * 0.03)`. Exceptions go through `useCustomMotion`
  (opt out) or `useSnapMotion` (jump to target, for cases where `animate` CARRIES LAYOUT — returning
  empty there breaks the UI) and must carry a one-line reason. **Not applied to the 3D city.**
  ⚠️ `motionCoverage.test.js` guards the whole tree: files outside the exemption table must have zero
  loose declarations, and a file in the table that got tidied must have its number LOWERED. Adding a
  row there is a decision, not a cleanup.
- **Navigation: 5 sidebar items** on desktop (Tập trung · Hành trang · Thành Phố · Thống kê · Cài
  đặt); iPhone shows **4 buttons + "Thêm"**. Skills/Treasure/Achievements are sub-tabs of "Hành
  trang" and **keep their old ids** — saved notifications point at them; `resolveTabTarget`
  (`App.jsx`) is the translation layer.
- **Skins: 5**, default **"Sân Chơi" (`arcade`)**. Single source: `src/store/uiSkins.js`. Adding one
  needs all three places (list · `SKIN_OPTIONS` in `Settings.jsx` · `[data-skin=…]` in `index.css`)
  **plus** a `[data-theme="dark"][data-skin=…]` block, because the dark block follows every skin
  block at equal specificity and would otherwise win. `uiSkins.test.js` guards all four.
  ✅ **The one-time skin migration is DONE (2026-08-29) — never do it again.** Saved data beat
  `DEFAULT_UI_SKIN`, which is why changing the default did nothing on Đàm's machine on 2026-08-28.
  `settingsStore` is now version 9 and `migrate` calls `resolveSkinAfterMigration`: a machine without
  the `skinMigratedV1` flag is pulled to the default exactly once, then stamped. ⚠️ **Never force
  again** — after the stamp, every skin choice is Đàm's conscious choice. To change the default for
  new machines edit `DEFAULT_UI_SKIN` only; do not bump the version to re-run `migrate`. And never
  "fix" this into comparing `uiSkin === 'editorial'` — value comparison re-forces on every later
  version bump.
- **Anything new that wants to "tell Đàm" picks ONE of three, never opens a dialog by itself**:
  toast (`engine/rewardFeed.js`) · attention dot (`engine/navAttention.js` → `attentionTabIds`) ·
  notification bell (`ui.notificationFeed`). `rewardToastWiring.test.js` guards this.
- **Era stages**: the milestone is real (`src/engine/eraStage.js`) — the header bar measures the
  stage (~3%/session, fills 3× per era) plus a "còn ~N phiên nữa tới «…»" countdown on Focus.
  Crossing one celebrates (`pickStageCelebration`, stamped in localStorage `dc-stage-seen-v1`), and
  the Streak cell shows `Chuỗi ⚠` when the streak is at risk (`evaluateStreakAtRisk`).
  ⚠️ Never "tidy" the header bar back to measuring a whole era: an era is 5,600–20,800 EP ⇒ ~1% per
  session, filling once every 1–6 months. `stageProgressWiring.test.js` guards it, including a case
  demanding it stay OUTSIDE any `hidden … lg:flex` block (the old stage bar lived only in the right
  column, so iPhone never saw it).

## Next up
### A. Đàm must choose — do not decide these alone
- **`TECH_DEBT #94`** — break-start delay. `BREAK_START_DELAY_MS` waits 3.2s in **~82%** of sessions
  that have no celebration to cover it (31.4 minutes per 180 days). The correct patch is known
  (turn the constant into a relation: 3,200 with a celebration, 500 without).
- **`TECH_DEBT #96`** — relic evolution is a **dead mechanic**: `evolveRelic` spends refining from a
  PAST era, but refining only drops in the current era. Screenshot: 3/3 buttons permanently read
  "Chưa đủ tài nguyên". ⚠️ After ADR-069 it is even deader — refining is dormant data (`#99`). The
  exit consistent with ADR-069 is evolution by SESSION (e.g. N sessions ≥45′ in the new era), never
  back to currency. Still Đàm's call: it changes how fast relics grow.
- **"More 3D-looking" — needs Đàm's taste, not code.** Both cheap levers are spent (shadow map
  2048 → **4096** ✓, `sun.shadow.camera` tightened). What is left is purely artistic: (a) deeper /
  taller contact shadows (`CONTACT_FLOOR` 0.58 · `CONTACT_REACH` 0.38) · (b) harder shadow edges
  (`PCFSoftShadowMap` → `PCFShadowMap`) · (c) dimmer fill light — but (c) risks the "milky pale"
  warning in `PHASE_RULES` §2.

### B. Ready to build
1. **Pyramids / ziggurats** — eras 2 (Egypt) and 3 (Iraq) currently produce many-sided cone roofs
   with no four-sided pyramid mass. `prism` with `sides: 4` + `taper: 0` is exactly the shape needed.
2. **`TECH_DEBT #88`** — the one-cell ceiling (`BLOCK_MAX_CELLS = 1`) pins the plot count at 4 across
   all 15 eras, making the `units`/`cols`/`rows` columns of the district table a dead axis. Three
   options already measured.
3. **`TECH_DEBT #89` is still OPEN** despite the day-stage gate passing (12.44) — the SKY band, named
   explicitly twice, has barely moved. Do not read the aggregate number as "solved".

### C. Waiting on Đàm's eyes
🔴 **Phase 21 screenshots** — the 15-era sweep + 12 top-down views (eras 1 · 3 · 7 · 10 · 11 · 14, each
at 20 and 120 sessions). Accepted by EYE: eras 1–9 must show no rows/alignment; eras 11–15 must.
⚠️ This is already running in production.

### D. Known blind spots in the tooling (not "not done" — "cannot be seen")
- ✅ **Solved 2026-09-02** — `src/dev/previewStage.js` + `shot.mjs --preview <scene>` (`loot` ·
  `loot-max` · `era` · `level` · `toasts`); round 33 added `dc-preview-card=<card>`. Why it was
  needed: `ui` is not in the store's `partialize`, so it cannot be seeded via `--fixture`/`--ls`, and
  the store is not exposed on `window`, so `--probe` cannot open dialogs either. **Never click Start
  on dev.** This blind spot had blocked a REAL fix (`TECH_DEBT #94`), not just convenience.
- **Treasure › Relics tab** — the fixture never seeds `relics`/`research`, so it always shows 0/15 and
  15 "??? KHOÁ" rows. That emptiness belongs to the TOOL, not the app. Seed `relics` in
  `scripts/make-fixture.mjs` first.
- **`refinedEarned` / `jackpot` are always 0 in fixtures** — `make-fixture.mjs` does not replay those
  two fields, so never infer frequency from them. Ask the formula directly:
  `minutes >= T2_DROP_THRESHOLD_MIN` (45′) and `>= DEEP_SESSION_THRESHOLD` (60′).

## Commands
```
npm install --legacy-peer-deps                                   # required flag
npm run test:quiet                                               # 2,132 chars of output, not 408,514
node scripts/doc-budget.mjs [--map <file>]                       # doc token budget / table of contents
node scripts/city-preview.mjs --era 6 --hour 12 --width 1500     # inspect one era
node scripts/shot.mjs --phone --tab "Thống kê" --full            # 2D UI screenshot
```
(`npm test` / lint / build semantics: `CLAUDE.md` §Testing.)

## Where to look things up
`CLAUDE.md` §DOC MAP is the canonical routing table (which file, when to open, what is `grep`-only).
