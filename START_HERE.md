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

- **Loop — ROUND 49 (2026-09-09, LATEST): SOMETHING TO BLOW, AND A FIRE LIT (ADR-089).**
  Order: flags, sails, boats, cranes, market life · fire and night · weather whose rain WETS the ground.
  ⚠️ **Lesson 106 — a shader injection needs its own program cache key.** `applySurfaceDetail` keys differ with
  motion; before the fix nothing merged ever moved (era 8: 0,31 % → 1,44 % px). Verify motion on the thing
  you changed, with the magenta heat-map, not with one era's smoke.
  ⚠️ **Cloth is `canvas` (undyed) or `flag` (`FLAG_HUE`); `cloth`/`cloth2` are the residents'.** New part
  roles ride `wood` (`materials.js`) — a family that appears or vanishes moves five draw-call tables.
  ⚠️ **Boats are item kind `water` in `KIND_NGOAI_LUOI`** — outside the city box and the blockers, one law.
  ⚠️ **Fire = parts tagged `fire`**; an era may declare `fire` particles only if `ERA_LIFE` puts a fire prop
  FIRST for it. Fire lights: ≤ 6, `fireFlicker(t)` — never `Math.random`. `MUSEUM_HOUR` is 18 (dusk).
  ⚠️ **Weather is `weatherAt(era, hour)` per day phase; `wet ≥ rain` by construction** (`weather.js`). The
  three ground materials read `wet` through `wetSurface`; the specular gain is spread only when wet — the
  dry law of the wiring test is intact. `city-preview --dry` is the control frame.
- **Loop — ROUND 48 (2026-09-09): THE CITY BECOMES A PLACE (ADR-088).**
  Order: make the city *"MỘT NƠI CÓ THẬT"* — a place, not a photograph; ten seconds untouched must show
  motion. **No performance measuring** (Đàm: measure again only when he reports lag).
  ⚠️ **Lesson 104 — copy frames from `.city-preview/last-run.json`, never from `ls`.** The tool now
  locks its folder (a second overlapping run exits 3), deletes every target before rendering, and stamps
  `sourceStamp` into every `.geom.json`. `--nomotion` freezes scenery for A/B strips (residents stay).
  ⚠️ **Motion is a function of time only** (`engine/city3d/motion.js` = per-era vocabulary; the renderer's
  `update(t)` feeds ONE `uTime` to foliage/cloth vertices, water and particles). Never add `Math.random`
  or a second clock; every object's phase comes from `phaseAt(x, z)`. `still` scenes do not move.
  ⚠️ **Parts tilt** (`rx`/`rz`) and **joints yaw** (`c`); GOLDEN digests are the alarm. **The core is flat**
  (`ERA_TERRAIN`); **the land grows only by ADDING** (`landGrowth.js`); a sealed era renders with its frozen
  session count. ADR-007's 15 × 120 tests stay the stop condition.
- **Loop — ROUND 47 (2026-09-08): THE CITY IS REDRAWN ON THE SAME MAP (ADR-087).** The 3D city's ART is
  open again; **ADR-007 still locks every building's position** — run its two tests (`cityPlan.test.js`
  «15 kỷ × 120 mốc», `block.test.js` «QUA THỜI GIAN») before every 3D commit. Ground and wall are per-era
  FACTS in `eraStyle.js`; rounding lives in `parts.js` (`bevelWidth`, `cornerRadius`, `BEVEL_MIN_VISIBLE`).
  Full detail: ADR-087 and `BAN_GIAO.md`.
- **Loop — ROUND 46 (2026-09-08): THE CITY TAB CATCHES UP WITH THE CITY'S THREE ROLES (ADR-086).**
  Order: *"THÀNH PHỐ PHẢI TRÔNG NHƯ THỨ ĐÁNG NHẤT TRONG APP."* Measured before (390×844, 12 eras): picture
  **201 px = 23,8 %** at y = 494 · header 202 px · 12 chips = 6 rows · «SP» said 0 times · museum 2,5× darker
  at night. After: picture **268 px = 31,8 %** at y = 190 · header 77 · **15 eras = 2 rows @390, 1 @1280** ·
  stat grid above the tab bar at 12 AND 15 eras · museum 0,37 at 22h = 12h.
  ⚠️ **`components/city/stageMetrics.js` is the ONE owner of the picture's height** (ADR-083's pattern):
  aspect floor 1,3 = the engine's `FRAME_FIT_ASPECT` (taller crops the near corner — the only way to
  cut a building without touching the camera), `100svh − declared reserve`, ceiling. `CityScene3D` runs in
  `fill` on every tenant. Never add a second height, a ratio'd placeholder, or a transform.
  ⚠️ **A sealed era is lit ONCE** — `museumDaylight()` / `MUSEUM_HOUR = 15` for `dimmed` scenes. The clock
  belongs to the living city only.
  ⚠️ **The tab names its pay from `engine/skillPointEconomy.js`**: cell 2 «Điểm kỹ năng» (whole city +
  «+N từ kỷ này»), «Đang xây» header, every unbuilt slot. The session count is the plaque under the
  picture (`cityCopy.eraStatusLine`). The museum's raw-EP cell is gone (nothing to do with it).
  ⚠️ **Đàm's premise that a sealed era's empty slot can never be built again is FALSE in the approved
  code** — ADR-012 (his choice, 2026-08-13) restores museum lots from the inventory's restoration
  section, with no resource gate, and a restored building pays 1 SP. The slot note says so (`slotNote`,
  sealed variant). What ADR-007 locks is POSITION, not growth.
  ⚠️ **Arrival moment = a DIFFERENCE, not an event** (`engine/cityArrival.js`, stamp `dc-city-seen-v1` per
  device in `localStorage`): camera flight to the newest building + 4,2 s banner. First visit stamps
  silently. Photograph it over the 2D renderer (`--city2d`, `--ls 'dc-city-seen-v1={"builtTotal":N-1}'`):
  headless SwiftShader does not composite that overlay over WebGL (ADR-086 §Tool lessons).
  ⚠️ **City-tab photos need `--settle ≥ 1500`**: the first 3D frame is a zoomed transient that looks like a
  camera bug. `--click "Kỷ 3★"` (tile text). `--hour` moves the day-arc stamps — seed `dc-day-arc-v1`.
  Decided NOT to build a museum gallery: the tile strip is the overview (stars and gaps in one glance).

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
1. **`#90(b)` + `#77` together** — `ROOFTOP_MIN_SPAN` as a pixel relation (`CELL_PIXELS`/`EYE_PIXELS`), with
   a control that traps the old broken sizes; 12 green rooftop tests. Also `#40` (tiles on the slope) and
   people talking in pairs (round 49 left both).
2. **`TECH_DEBT #88`** — the one-cell ceiling (`BLOCK_MAX_CELLS = 1`) pins the plot count at 4 across
   all 15 eras, making the `units`/`cols`/`rows` columns of the district table a dead axis. Three
   options already measured.
3. **`TECH_DEBT #89` is still OPEN** despite the day-stage gate passing (12.44) — the SKY band, named
   explicitly twice, has barely moved. Do not read the aggregate number as "solved".

### C. Waiting on Đàm's eyes
🔴 **Round 49 at 22:00** — the phone, 10 s untouched: fire burning and flickering, flags flying, boats
bobbing; rain on a wet street in eras 9 · 11 · 13 at night. Museum pieces now at dusk (18:00).
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
