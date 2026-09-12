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

- **Loop — ROUND 57 (2026-09-12, LATEST): THE PICTURE WAS NEVER DRAWN AT FULL SIZE.**
  Detail in `BAN_GIAO.md`; four laws live here:
  ⚠️ **`EffectComposer` inherits NOTHING from the renderer** — round 55 found it for `samples`,
  round 57 for SIZE: `setSize` multiplies by pixelRatio itself, so our own multiply made the chain
  run at pixelRatio². Any new pass must be checked against the `[res]` indicator, not assumed.
  ⚠️ **A wrong texel size is a blur, not an error.** `uTexel` described a 2800-wide buffer while
  sampling a 5600-wide one, so AO and depth of field smeared at 2× radius — silently.
  ⚠️ **A ceiling that bites on one class of device is invisible on every other.**
  `MAX_PIXEL_RATIO = 2` only ever cost anything on a DPR-3 phone, which is exactly where no
  acceptance photo is ever taken. Now 3.
  ⚠️ **Two kinds of target, two camera laws.** `planCityFocus` raises and backs off — right for a
  building, wrong for a person (raising = the top of a head; backing off = losing what you came
  for). A person needs "walk around them", and the clearance question is "does the camera end up
  inside a wall", not "does the flight graze one".

- **Loop — ROUNDS 55 + 56 (2026-09-12): SHAPE BY HOW A THING IS MADE.** Branch
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

- **Loop — ROUND 52 (ADR-092): THE PICTURE GOT EXPENSIVE.** Archived verbatim (2026-09-12).
  Still-live: tone mapping lives in `OutputPass`, **not on the renderer** (two passes = the washed
  "pastel như sữa" this project nearly died of twice) · the bloom THRESHOLD decides what glows,
  strength only how much.

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
  BECAME THE REWARD.** Moved verbatim to `docs/archive/START_HERE_LOG_2026-09-06.md` on 2026-09-12
  — it was the oldest and by far the largest entry here (7.042 chars), and round 57 pushed the file
  past its 16.000 guard. Nothing deleted; `grep` the archive for the full text.
