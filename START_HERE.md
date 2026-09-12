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

- **Loop — ROUNDS 55 + 56 (2026-09-12, LATEST): NOT ON `main` YET.** Branch
  `claude/city-skill-points-display-7k4nof`. Detail in `BAN_GIAO.md`; five laws live here:
  ⚠️ **Two coaxial lathes always meet in a HORIZONTAL circle.** Round 52's hair cap sat 36% inside
  the skull, so the visible hairline was that intersection, not the rim drawn — identical at all 60
  azimuths. A cap must be provably OUTSIDE the skull for its own rim to be the boundary.
  ⚠️ **A colour boundary must not sit where real life has none** (Đàm, R56). Third instance of one
  defect shape: joint balls as rivets · a neck as a white collar · the hairline. All three found by
  a PHOTOGRAPH; none by any of 1,784 tests.
  ⚠️ **Roles on a resident cost NO draw calls** — one `InstancedMesh` per SHAPE, colour per instance.
  ⚠️ **A table has a test; the place that CONSUMES it may not.** Role `steel` reached `HUMAN_ROLES`,
  `palette3d.js` and an exception list in `palette3d.test.js` at round 49 — and never reached
  `sceneGraph.js`, so every helmet rendered in the era's CLOTH colour for three weeks.
  ⚠️ **The preview tool lied twice more** (5th and 6th): it could not photograph a face at all
  (34.4° default pitch), and above 1400 px it wrote BLACK images while reporting success.

- **Loop — ROUND 54 (ADR-094): FROM BLOCKS TO ROUND.** Archived verbatim (2026-09-12). Still-live:
  **the crease ANGLE needs no role table** (4-gon 90° sharp · 12-gon 30° smooth · side-meets-cap 90°
  sharp) · **raising `sides` IS switching smoothing on** — `360/n` crosses 40° between 9 and 10 ·
  **residents do NOT go through `geometryFactory`**, so a shape law must live in `engine/` to reach
  both pipelines · **a joint wears the colour of the limb it joins** · **a museum signature must not
  contain a render cost** — `GOLDEN` (whole spec) and `GOLDEN_KHOI` (parts only), two digests.

- **Loop — ROUND 53 (ADR-093): A WALL THAT CAN SHADOW ITSELF.** Archived verbatim (2026-09-12).
  Still-live: **`TOTAL_RELIEF_CAP` = the old `SILL_RELIEF` to the digit** — `block.js` shrinks each
  unit by its ENVELOPE, and a 10% growth cost era 6 eleven roofs three stages away, silently ·
  **`prism`'s `y` is the BOTTOM of a block** · **triangle ceilings are runaway detectors, not limits.**

- **Loop — ROUND 52 (ADR-092): THE PICTURE GOT EXPENSIVE.** Archived verbatim. Still-live: tone
  mapping is in `OutputPass`, **not on the renderer** · threshold decides WHAT glows, strength only
  how much · **clothing is the limb, not a tube around it** · `city-preview.mjs` needs
  `preserveDrawingBuffer` and `still: true`.

- **Loop — ROUND 51 (ADR-091): THE EYE CAME DOWN TO THE STREET.** Archived verbatim. Still-live: sky
  is a DECISION on a turning DOME · geometry has FOUR columns · street furniture lives in
  `layout.street` · role `iron` exists because `trim` borrows the century's colour · **`specSpan` takes
  `max(w/2, d/2)`, not the depth.**

- **Loop — ROUND 50 (ADR-090): MORE TO SEE, MORE TO DO.** Archived verbatim. Still-live: season is a
  second axis · ONE place derives hour and season (`CityScene3D`) · walk mode is a MODE of `orbit.js` ·
  nothing on a facade may protrude · `ROOFTOP_LAND_SPAN` = 0,24 must not move (ADR-007).

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
0. **Round 54's one leftover** — **distance-softening shadows** (Việc 8b). A penumbra that widens with
   distance from the occluder is PCSS, i.e. rewriting three's shadow sampling; the cheap substitute
   (VSM + `shadow.radius`) blurs uniformly and bleeds light through the thin window reveals round 53
   built, which Việc 12 forbids. Logged rather than faked. Round 53's leftovers: Việc 6 (wet roughness),
   Phần D (value variation across ONE face; moss/rust by age). `BEVEL_MAX`/`MAX_SIDES` done in round 54.
1. **Rounds 49–52 leftovers, in the briefs' order** — greenery and age traces by building age;
   walk-mode features (auto tour, street names, tap while walking, lamps pooling light); a **wet
   roughness map**; **`#65`/`#60`** (river · canal · estuary still share one geometry — give each its
   own shape plus the bridge · quay · steps grammar); `#40` (tiles on the slope); more resident roles
   and animals, people talking in pairs. **Per-role body proportions** (broad smith, stooped elder,
   big-headed child) ride the resident ROLE system, not a per-era axis, so they wait on that.
2. **`TECH_DEBT #88`** — the one-cell ceiling (`BLOCK_MAX_CELLS = 1`) pins the plot count at 4 across
   all 15 eras, making the `units`/`cols`/`rows` columns of the district table a dead axis. Three
   options already measured.
3. **`TECH_DEBT #89` is still OPEN** despite the day-stage gate passing (12.44) — the SKY band, named
   explicitly twice, has barely moved. Do not read the aggregate number as "solved".

### C. Waiting on Đàm's eyes
🔴 **Round 54 on the phone** — stand at eye level beside ONE resident. Đàm's own test: that person
must read as a soft, round, likeable cartoon character, not a stack of woodblocks — *"vẫn thấy các
mặt phẳng ghép lại thì vòng này chưa đạt"*, however green every other box is. Also: scene triangles
rose 13–43% per era for the round trees; say if anything lags.
🔴 **Round 53 on the phone** — stand before a sunlit wall. Đàm's test: it must shadow ITSELF — in the
recess, under the sill, under the eave, beside the pilaster. Still flat = the round failed.
🔴 **Round 52 on the phone** — put two pictures of the SAME street side by side, before and after.
Đàm's own test, in his words: the after must look like a real game, not a paper model — *"phải đọc
bảng mới thấy khác thì vòng này chưa đạt."* Also check the Settings switch both ways, and say whether
it lags; the post pass has never been timed on real hardware (the sandbox is a CPU rasteriser).
🔴 **Rounds 50 · 51 and Phase 21, all still unseen** — one walk covers them: drag the hour and the
season, walk a lap by day and by night in three eras, save a postcard. Each street must read at once
as that country and that century. Phase 21's own check (eras 1–9 no rows, 11–15 rows) needs the
top-down sweep. ⚠️ All of it is already running in production.

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
