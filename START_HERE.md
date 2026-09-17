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

- **Loop — ROUND 64 (2026-09-17, LATEST): FIVE FAULTS ĐÀM COULD SEE (ADR-100).**
  ⚠️ **NEVER PUT A STATIC HINT ON SCREEN.** Round 63 quoted round 40's law and then shipped one
  anyway. Discovery is `focus/ShortcutSheet.jsx` — **hold `?`** — plus hover `title`s. List lives in
  `lib/shortcuts.js`; adding a key means adding a row there or it is undiscoverable.
  ⚠️ **ONE TRUTH ONCE, CHECKED BY VALUE.** `pickFocusMoment` takes `alreadyShown` and skips any
  candidate whose rendered TEXT matches the postcard caption. Gating a branch fixes one instance;
  comparing text fixes the class.
  ⚠️ **THE WIDTH IS ONE BUDGET, AND 868 IS THE CENTRE.** 1.440 − 232 sidebar − 340 rail. A
  `640 | rest` split leaves 196 px: round 63 shipped that and the goal card became one word wide.
  **A number that improves while the screen gets worse is measuring the wrong thing.** Reverted.
  ⚠️ **THE RAIL CARRIES THE DAY, NOT THE WEEK** (`section="daily"`): 1.627 → 1.033 px. The full
  weekly card lives in Hành trang › Kỹ năng and Tiến trình — never put it back in the rail.
  ⚠️ **Thống kê fits 790 px now** (`xl:columns-2`, 1.289 → 771). Cài đặt 1.427 → 1.058.
  ⚠️ **While a timer runs: ONE column, wide** — postcard 1.100 px, 91 % of the width, 0 new
  indicators/numbers/colours.
  ⚠️ **Category hue belongs on Thống kê, not on the Focus chip** — six raw hexes in `constants.js`
  predate the three-colour law, which never reached them.
  ⚠️ Still measured, unfixed: Hành trang 1.566 · Thành Phố 1.060 · Focus column 1.530.

- **Loop — ROUND 63 (2026-09-17): THE REFERENCE FRAME MOVES TO THE LAPTOP (ADR-099).**
  ⚠️ **`lib/viewports.js` IS THE FRAME, AND IT IS THE LAPTOP.** Every brief from round 38 to 62 said
  390px was what Đàm used most; it is **2%**, a MacBook Air M3 is **98%**. Design against
  `LAPTOP.chrome` = **1440 × 790** — the BROWSER window, not the 1470 × 956 display.
  ⚠️ **THE SCARCE AXIS FLIPS WITH THE FRAME**: a phone lacks WIDTH, a laptop lacks HEIGHT. Fourteen
  rounds of habits (stack it, cap the column, let it scroll) optimise the plentiful axis here. Every
  laptop re-column is gated at `xl` (`TWO_COLUMN_MIN`), so the phone never pays for a laptop fix —
  `viewports.test.js` fails an ungated one.
  ⚠️ **The width is ONE budget**: sidebar 232 + centre + rail 340 share 1.440. Widening the rail to
  400 bought 85px of rail and cost **568px** of the column beside it — measured, then reverted.
  ⚠️ **Space means start · pause · resume** (it was idle-only for 26 rounds), **1–5 switch tabs** in
  the sidebar's order. Both refuse under a modifier, in a text field, and mid-ending. Discovery is a
  hover `title`, never a static banner (round 40's law).
  ⚠️ **MEASURING LESSON #30**: `shot.mjs` prints the TALLEST scroller, which for four builds was the
  right rail, not the content — I nearly reverted a fix that was cutting 370px. Enumerate every
  scroller with its width and x, never read one number. **A number with no ADDRESS is not a measurement.**
  Still measured-but-unfixed: rail 1.627px (2,46 screens) · Hành trang 1.584 · Cài đặt 1.427 · ending 1.666.

- **Loop — ROUND 62 (2026-09-17): ONE VISUAL VOCABULARY FOR EIGHT SCREENS (ADR-098).**
  2D screens only — this round does not touch the 3D-city stream (rounds 47–61). Round 39's four
  numbers guarded Focus for seven rounds and guarded nothing else. The count that decided it: the
  small uppercase label had **22 size+tracking shapes over 111 uses**; the card surface had **7 local
  definitions**, one of them drifted.
  ⚠️ **`components/shared/surface.js` IS THE ONE SOURCE** — `CARD` · `CARD_INSET` · `EYEBROW` ·
  `ratio()` · `remaining()`. Never hand-write a card surface or an uppercase label again; import it.
  `shared/surface.test.js` fails a new variant, and it already caught three card copies the opening
  grep had missed. Exactly TWO label shapes are legal: a section eyebrow (10px/0.2em) and a badge
  pill (11px/0.14em) — two ELEMENTS, not two sizes, and a third is how 22 started. The rule is scoped
  to 10–12px because below that the app uses uppercase letters as an ICON FALLBACK.
  ⚠️ **A number with a denominator is `n/N`** — no spaces, and never beside its own remainder
  (`38/75 còn 37` is `75 − 38` said twice). `còn 1 nữa ★` SURVIVES: it names a milestone one step
  away whose reward seals permanently, which is a different sentence from a subtraction.
  ⚠️ **The ending merged what repeated: 11 cards → 8, 39,0 s → 29,6 s.** «Nhịp» = streak + today;
  «Kho báu» = rank + relic + evolve. One treasure KEEPS the old big-icon layout — the common case is
  never made worse to improve the rare one. Zero taps added, rare-tier burst untouched.
  ⚠️ **`Cài đặt` folds** (11 sections, 10 collapsed, 0 deleted): 5,8 phone screens → 2,5.
  ⚠️ **The Hành trang tab count MUST come from `useJourney`.** The first draft re-derived it, read
  `s.activeBook` instead of `s.progress.activeBook`, and printed «30/75» under a rail saying «38/75».
  ADR-082 named that hook the one seam; `journeyWiring.test.js` now pins it.

- **Loop — ROUND 61 (2026-09-17): LÕM, AND CHỖ THẮT.**
  Detail in `BAN_GIAO.md` and ADR-097; three laws live here:
  ⚠️ **Adding a convex block never creates a hollow — only carving the generating line does.**
  Three straight rounds (skull, eyelids, joint balls) only ever added lumps: joints read as a
  string of beads, eyes as two balls glued on a face. The fix inverts each rule instead of adding
  to it — joints are now the segment's NARROWEST point; the eye socket is a real ring in
  `SKULL_RINGS`, not a relation between two separate glued blocks.
  ⚠️ **Padding a gap and sealing it by overlap are different shapes.** A joint sphere sized to the
  max of both neighbours closes the gap at every angle but reads as a bead. Two segments extended
  past the joint by a fixed fraction of their own length seal it by union instead — measured with a
  real point-in-lathe-solid probe, not assumed.
  ⚠️ **A shared generating line is a shared FRAGILITY, in a system you didn't touch.** Deepening
  the eye socket broke the hairline: `scalpFit` stretches the scalp's Y axis around the CHIN, not
  the ring's own position, so a vertex reading "deep in the socket" in ring-space lands, after the
  stretch, back on the wide part of the rising slope. Wide and shallow clears it; narrow and deep
  does not.

- **Loop — ROUND 60 (2026-09-16): THE RULER WAS READING BACKWARDS.** Moved verbatim to
  `docs/archive/START_HERE_LOG_2026-09-06.md` — `grep -n 'ROUND 60'` there.

- **Loop — ROUND 58 (2026-09-13): THE FIRST TIME I LOOKED A RESIDENT IN THE FACE (ADR-095).**
  Archived verbatim. Still-live: a sum of convex bodies is not a smooth surface, only asymmetric
  features may be separate blocks · shared constants over promises written in prose (`TECH_DEBT
  #42`) · a number means nothing without the frame it was solved in · a sufficiency proof expires
  the moment the shape it proved something about changes.

- **Loop — ROUND 57 (2026-09-12): THE PICTURE WAS NEVER DRAWN AT FULL SIZE.**
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

- **Loop — ROUNDS 55 + 56 (2026-09-12): SHAPE BY HOW A THING IS MADE.** Moved verbatim to
  `docs/archive/START_HERE_LOG_2026-09-06.md` — `grep -n 'ROUNDS 55'` there.

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

- **Loop — ROUND 39 (2026-09-07):** Moved verbatim to `docs/archive/START_HERE_LOG_2026-09-06.md`.

- **Loop — ROUNDS 37 & 38 (2026-09-06/07):** Moved verbatim to
  `docs/archive/START_HERE_LOG_2026-09-06.md`.

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
