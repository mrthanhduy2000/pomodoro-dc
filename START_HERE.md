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

- **Loop — ROUND 43 (2026-09-08, LATEST): ONE DESTINATION, AND EVERY DISTANCE IN SESSIONS (ADR-082).**
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
- **Loop — ROUND 39 (2026-09-07): WHILE A TIMER RUNS, THE FOCUS SCREEN IS THE TIMER (ADR-079).**
  Order: *"Dọn giao diện màn Tập trung — không thêm tính năng."* One indicator while running (daily-goal
  ring deleted, brick strip = one headline, postcard `quiet`, no pill, voice line silent); one line under
  the clock on every device (`describeClockSubline`: «Phiên thứ N hôm nay»; the goal fraction lives on the
  idle postcard caption); goal/break line UNDER the ring; three colours (`--accent` focusing · `--good`
  break; palette classes gone from `PomodoroEngine.jsx` + `focus/*`, Coach gold → accent); quiet chrome for
  focus AND break (`anyTimerRunning`); 20 `truncate` sites → wrap (tab bar keeps 3). Counts while running:
  indicators 6 → 1 · numbers 13 → 2 · colours 6 → 3 · cut texts ≥ 3 → 0. Guards: `timerRing.test.js` (one
  dashed arc · tokens · palette gate), `focusFoldReach.test.js`. Inspect the running state with a seeded
  `timerSession` fixture (ms timestamps) + `--settle 600`.
- **Loop — ROUNDS 37 & 38 (2026-09-06/07): A SESSION ALWAYS LAYS A BRICK (ADR-077) · THE CITY
  LIVES ON THE FOCUS SCREEN (ADR-078).** Moved verbatim to
  `docs/archive/START_HERE_LOG_2026-09-06.md` — `grep` them when you need those rounds. Their
  still-live rules are the ones already stated above and in `docs/UI_INVARIANTS.md`; two lessons
  from 38 are still load-bearing: *the sandbox's software GL trips the FPS watchdog in ~3 s — shoot
  3D with `--settle 600`* and *`--click` matches a button's FULL text*. Nothing was deleted.
- 📚 **Rounds 20 → 38 moved to `docs/archive/START_HERE_LOG_2026-09-06.md`** (verbatim), together
  with the 3D city details (BSP skeleton · `reach` 0.8 · two-layer shadows · 15 eras/`country` ·
  12×12 grid · 3.2× perf headroom) — a finished black box is not worth paying tokens for every
  session. **Keep at most 3 rounds here**; a new round pushes the oldest down.
  Older rounds: `grep -n 'VÒNG 2[0-9]\|VÒNG 33\|ROUND 3[4-8]' docs/archive/START_HERE_LOG_2026-09-06.md`.

### UI invariants — read before touching the UI
⚠️ **Changing anything under `src/components/` or `src/store/uiSkins.js` means reading
[`docs/UI_INVARIANTS.md`](docs/UI_INVARIANTS.md) FIRST.** It holds the rules that are guarded by
tests: one shared reward card and exactly four rarity tiers · the no-exceptions interruption law
(`lastWeeklyReportDate` vs `…SeenDate`) · exactly three motion presets · 5 sidebar items / 4 iPhone
buttons + "Thêm" · 5 skins and the one-time migration that must never run again · the three-way
choice for notifying Đàm · the era-stage progress bar. They are not repeated here because a rule
stated twice drifts.

## Next up
### A. Đàm must choose — do not decide these alone
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
- **3D in the sandbox lives ~3 s** — SwiftShader is slow, the FPS watchdog (`renderLoop.js`) gives up
  after three slow samples and BOTH the City tab and the Focus postcard fall back to the 2D drawing.
  That is the tool, not the app: pass `--settle 600` to `shot.mjs` to catch the 3D frame (ADR-078).
- ✅ **Solved 2026-09-02** — `src/dev/previewStage.js` + `shot.mjs --preview <scene>` (`loot` ·
  `loot-max` · `era` · `level` · `toasts`); round 33 added `dc-preview-card=<card>`. Why it was
  needed: `ui` is not in the store's `partialize`, so it cannot be seeded via `--fixture`/`--ls`, and
  the store is not exposed on `window`, so `--probe` cannot open dialogs either. **Never click Start
  on dev.** This blind spot had blocked a REAL fix (`TECH_DEBT #94`, since closed), not just convenience.
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
