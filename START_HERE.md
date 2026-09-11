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
The 3D city (`src/engine/city3d/` + `src/components/city/render3d/`) was **unlocked on 2026-09-08
(round 47, ADR-087)**: its art may change; **ADR-007 still locks every building's position.**

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

- **Loop — ROUND 52 (2026-09-11, LATEST): THE PICTURE GOT EXPENSIVE (ADR-092).**
  A **post pass** (`render3d/postFx.js`): AO → god rays → bloom → lens, one profile per daylight phase,
  switch in Settings. **Generated textures** for all 16 material families (`render3d/surfaceTexture.js`)
  — no files, no network, sampled TRIPLANAR because the merged geometry has no UVs. **Residents wear
  their century** and **cast shadows** (map re-dirtied every 2nd animated frame, else they walk and the
  shadows stay put). Five laws worth the tokens:
  ⚠️ Tone mapping lives in `OutputPass`, **not on the renderer** — both means it applies twice.
  ⚠️ **Threshold decides WHAT glows, strength only how much** — night has a 0,5 floor in
  `postFx.test.js`: fire sits near 0,9 and a sunlit wall near 1,0, so lower selects both and every
  window blows out white.
  ⚠️ **AO is OFF in walk mode** — `GTAOPass` returns a BLACK occlusion buffer near the camera at eye
  level (row 612/700, step 16,5/255; the city view measures 1,4). `TECH_DEBT.md` #52 lists every
  parameter already ruled out. Do NOT lower `blendIntensity` to hide it.
  ⚠️ **Clothing is the limb, not a tube around it** (`human.js` `SLEEVE_LOOK`/`LEG_LOOK`) — the obvious
  build cost 8 parts per resident to hide parts it just made. Ask *"how many OBJECTS is this?"*
  ⚠️ `city-preview.mjs` needed **`preserveDrawingBuffer`** (screenshots tore into four pieces) and
  **`still: true`** so grain matches across capture strips.

- **Loop — ROUND 51 (2026-09-09): THE EYE CAME DOWN TO THE STREET (ADR-091).**
  Round 50's walk mode changed the priorities of the four rounds before it: everything from round 47 on
  was built for a camera looking DOWN.
  ⚠️ **The sky is a DECISION, not a backdrop** (`sky.js`, pure). Drawn on a DOME that TURNS — a flat
  cloud plane puts half the clouds between the camera and the city.
  ⚠️ **Geometry has FOUR columns now: `city · backdrop · sky · total`** — `sky` is not inside
  `backdrop`, which exists for being CONSTANT across eras; clouds are the opposite.
  ⚠️ **Street furniture lives in `layout.street`, NOT `layout.props`** — `props` keeps its
  one-thing-per-cell law; a lamp post on a kerb occupies no cell.
  ⚠️ **Role `iron` exists because `trim` borrows the century's colour** (a Manchester gas lamp came out
  brick red). It rides the `wood` family, so no era gained a draw call; any new role must do the same.
  ⚠️ **A wonder opens without relaxing the mirror** (`wonderEntrance.js`): centred at x = 0 or in equal
  ±pairs. ⚠️ **`specSpan` takes `max(w/2, d/2)`, not the depth.**
- **Loop — ROUND 50 (2026-09-09): MORE TO SEE, MORE TO DO (ADR-090).** Seasons, an hour slider, walk
  mode, the postcard, interiors, facade vocabulary; `#77` · `#81` · `#90(b)` closed. Laws still live:
  the **season is a second axis** (`seasonLook`; summer is the identity look — never "improve" it
  without re-measuring the other three; `museumSeason` freezes a sealed era) · **one place derives the
  hour and the season** (`CityScene3D`: `hourNow`/`seasonNow`; the controls hold no logic, a museum
  piece has no handle) · **walk mode is a MODE of `orbit.js`**, never a second camera, and the walker
  stands on the scene's own terrain (at y = 0 it photographs the underside of the world) · **nothing on
  a facade may protrude** (a 0,022 ornament moved a PLINTH count) · **`ROOFTOP_MIN_SPAN` is a RELATION**
  (0,083), while `ROOFTOP_LAND_SPAN` = 0,24 must not move (ADR-007). Full detail: ADR-090.
- **Loops — ROUNDS 47 · 48 · 49 (2026-09-08…09).** Art reopened (ADR-087), the scenery started to move
  (ADR-088: one `uTime` clock; lesson 104 — copy frames from `.city-preview/last-run.json`, never `ls`),
  props, fire and weather arrived (ADR-089: `wet ≥ rain` by construction; lesson 106 — a shader injection
  needs its own program cache key). ⚠️ **ADR-007 still locks every building's position**; run its two tests
  (`cityPlan.test.js` «15 kỷ × 120 mốc», `block.test.js` «QUA THỜI GIAN») before every 3D commit.
- **Loop — ROUND 46 (2026-09-08): THE CITY TAB (ADR-086).** Moved verbatim to
  `docs/archive/START_HERE_LOG_2026-09-06.md` on 2026-09-11. Still-live rules sit in the code they
  govern: `stageMetrics.js` owns the picture height, `museumDaylight()` lights a sealed era once,
  city-tab photos need `--settle ≥ 1500`. Nothing was deleted.
- **Loop — ROUND 45 (2026-09-08): A BONUS THAT CANNOT BE SEEN IS NOT A BONUS (ADR-085).** Moved verbatim to
  `docs/archive/START_HERE_LOG_2026-09-06.md` on 2026-09-09 (round 48 arrived; keep the 3 most recent) —
  `grep -n 'ROUND 45'` there. Still-live rules: `docs/UI_INVARIANTS.md` (ADR-085 bullets).
- **Loop — ROUND 44 (2026-09-08): THE CITY FUNDS THE SKILL TREE (ADR-084).** Moved verbatim to
  `docs/archive/START_HERE_LOG_2026-09-06.md` on 2026-09-08 (round 47 arrived; keep the 3 most recent) —
  `grep -n 'ROUND 44'` there. Still-live rules: 1 building = 1 SP owned by `engine/skillPointEconomy.js`;
  the SP counter is a LEDGER, not an event; never a `/* … */` right after an object literal's `{`.
- **Loop — ROUNDS 43 & 41 (2026-09-08): ONE DESTINATION, EVERY DISTANCE IN SESSIONS (ADR-082) · THE LONG
  RHYTHMS, AND A TOOL THAT CAN SEE (ADR-081).** Moved verbatim to
  `docs/archive/START_HERE_LOG_2026-09-06.md` on 2026-09-08 (round 46 arrived; keep the 3 most recent) —
  `grep -n 'ROUND 43\|ROUND 41'` there. Still-live rules: `docs/UI_INVARIANTS.md` (ADR-081/082 bullets).
- **Loop — ROUND 40 (2026-09-08): THINGS THAT HAPPEN AND VANISH (ADR-080).** Moved verbatim to
  `docs/archive/START_HERE_LOG_2026-09-06.md` — `grep` it when you need that round. Its still-live
  rules live in `docs/UI_INVARIANTS.md` (static budget zero); nothing was deleted.

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
  12×12 grid · 3.2× perf headroom) — the city's mechanics are stable and not worth paying tokens for
  every session (its ART was reopened in round 47). **Keep at most 3 rounds here**; a new round pushes
  the oldest down.
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
- **The living city after round 48 — does it move enough in 10 seconds on the iPhone?** The sandbox
  cannot show it (SwiftShader, 3 s watchdog); Đàm's eye decides the wind amplitude (`ERA_MOTION`), the
  smoke density and whether the +6 %/stage camera pull-back feels like growth. `#88` (plots per block)
  still needs his eye on top-down photos before any code.

### B. Ready to build
0. **`TECH_DEBT #52` — root-cause the walk-mode AO band** (round 52 left it measured, not fixed).
   `GTAOPass` returns a solid BLACK occlusion buffer near the camera at eye level; AO is switched off
   for walk mode until someone fixes it. The debt entry lists everything already ruled out and three
   ways in, cheapest first — read it before touching a single GTAO parameter, because every parameter
   has already been tried.
1. **Round 51 and 52 leftovers, in the briefs' order** — greenery, more resident roles and animals,
   age traces by building age, walk-mode features (auto tour, street names, tap while walking, lamps
   pooling light), plus round 52's two: a **wet roughness map** (puddles glossy in the hollows, dry
   under the eaves) and **per-role body proportions** (broad smith, stooped elder, big-headed child)
   — the latter rides the resident ROLE system, not a per-era axis, so it waits on that.
1. **`#65`** — river · canal · estuary still share one geometry; give each its own shape, with the bridge ·
   quay · steps grammar `#60` asks for. Also `#40` (tiles on the slope), more resident roles and animals,
   and people talking in pairs (rounds 49, 50 and 51 all left these).
2. **`TECH_DEBT #88`** — the one-cell ceiling (`BLOCK_MAX_CELLS = 1`) pins the plot count at 4 across
   all 15 eras, making the `units`/`cols`/`rows` columns of the district table a dead axis. Three
   options already measured.
3. **`TECH_DEBT #89` is still OPEN** despite the day-stage gate passing (12.44) — the SKY band, named
   explicitly twice, has barely moved. Do not read the aggregate number as "solved".

### C. Waiting on Đàm's eyes
🔴 **Round 52 on the phone** — put two pictures of the SAME street side by side, before and after.
Đàm's own test, in his words: the after must look like a real game, not a paper model — *"phải đọc
bảng mới thấy khác thì vòng này chưa đạt."* Also check the Settings switch both ways, and say whether
it lags; the post pass has never been timed on real hardware (the sandbox is a CPU rasteriser).
🔴 **Round 51 on the phone** — walk a lap down the street by day and by night in three different eras.
Đàm's own test: each street must read immediately as that country, that century; an empty road or a
smooth sky on that lap means the round failed.
🔴 **Round 50 on the phone** — drag the hour from morning to night, switch all four seasons, walk a lap
down the street, save one postcard. Đàm's own test: every change must show a different city.
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
