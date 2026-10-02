# v2 — "Thành phố nhật ký" (the diary city)

> The rewrite Đàm ordered on 2026-10-03: *rewrite the code, every old rule may be remade, the game
> starts from zero (only session history is kept, for stats), the 3D is not frozen.*
> Architecture decisions: **ADR-101** (stage 1), **ADR-102** (stages 2–4). Current status: `START_HERE.md`.

## The one rule
**Every session becomes ONE visible object — dated, in a fixed place, never lost.** The city is
Đàm's work diary, built from bricks. Anything that does not serve this rule is out.

## Game rules (built 2026-10-03, ADR-102 — exact numbers in `v2/src/engine/city.js`)
| Piece | Rule |
|---|---|
| Brick | 1 completed session = 1 brick. Colour = category, size = length. Carries date, time, note. Tap to read it back. |
| Building | Đàm **chooses** the next building and **its plot**. It needs 4 / 8 / 12 bricks and keeps a ledger ("3/10 → 7/10 · mostly «Học» · 'ôn chương 4'"). |
| Resident | 1 active day = 1 resident, living in the house built that day. Tap → "Thứ Ba 12/10: 5 phiên, 2 giờ 05". |
| Full day | Daily goal (default 4, editable). Reached → that day's lantern burns all night. A streak is an avenue of lanterns. |
| Era = chapter | 70 bricks open an era (10 eras, one roof silhouette each). The city **grows outward and never resets**; old districts keep their old architecture, like tree rings. |
| Surprise | ~8% of sessions give a special brick; ~1% a statue/landmark; a weekly goal unlocks a weekend festival. |
| After a session | The camera flies 2–3 s to where the brick lands, with a sound, then a short summary. |
| Coming back | Absence costs nothing; the city just dims. The first session after ≥2 days away gives double bricks and the residents return. Push names the unfinished thing ("«Chợ phiên» còn 2 viên"). |
| Dropped | Resources, RP, refined materials, crystals, relics, ranks, crises, prestige, skill tree, cancel penalties. One unit only: the brick. |

Cancelling gives no brick and **costs nothing**. Penalties build anxiety, not pull.

## Stages and gates (do not skip a gate)
0. **Prepare** — done.
1. **Daily core** — timer state machine, session log, sync, push at focus end AND break end, PWA,
   v1 history import. **Shipped 2026-10-03.**
   **Gate 1:** Đàm focuses with `/v2/` for real for 3 days with no timer or sync fault.
2. **Game loop** — bricks, choosing building + plot, ledger, residents, full days, eras,
   surprises. **Shipped 2026-10-03, straight in 3D** (2D step skipped by Đàm's order, ADR-102).
   **Gate 2:** after one week, active days/week ≥ v1 (computed from `history`; v1 baseline after
   the 6/9 reset is 3 days then nothing).
3. **3D city on the same data** — camera flight to the brick, the storey drops in, tap targets,
   real day/night, full-day lanterns. **Shipped 2026-10-03.** MacBook measured (frame 2.2 ms);
   ⚠️ **iPhone not measured yet.**
4. **Return hooks** — `pickV2Nudge` folded into `coach-digest` (welcome back · unfinished ·
   full day · streak), max one push a day; weekly festival. **Shipped 2026-10-03.**
5. **Cutover** — copy AI Coach, Electron tray reads v2, production points at v2, v1 to an archive
   branch. **Gate 5:** Đàm approves by eye; v1 data stays intact as the way back.

⚠️ Gates 1 and 2 were skipped by order (2026-10-03: "tiếp tục toàn bộ"). Their measurement still
matters: if two weeks of real v2 use are not stickier than v1, the problem is the habit, not the
code — stop and rethink before adding more. Stage 5 needs sync ON first (else two cities).

## How stage 1 is built
- **State = an append-only event log** (`events_v2`), reduced by a pure function. Kinds:
  `focus.start/pause/resume/complete/cancel`, `break.start/end/skip`, `legacy.session`,
  `category.upsert`, `prefs.set`. Unknown kinds are ignored.
- `v2/src/engine/` — pure, tested: `timer.js` (reducer + commands + `dueEvents` + `justFinished`),
  `stats.js` (VN day = UTC+7, streak, retention), `log.js` (merge, row mapping), `legacyImport.js`.
- `v2/src/store/logStore.js` — Zustand persist `dc-pomodoro-v2`: events, outbox, cursor, deviceId.
- `v2/src/lib/` — `sync.js` (upload outbox, pull by `seq`, realtime, flush on hide), `push.js`
  (subscription tagged `v2:`), `legacy.js` (reads v1 history READ-ONLY).
- `v2/src/app/useTimerApp.js` — the only place UI meets the engine; `v2/src/ui/` — views.

## How stages 2–4 are built
- `engine/catalog.js` — eras (style, roof) and blueprints `e<era>-<slot>` (house 4 · hall 8 ·
  market 8 · tower 12 · temple 12). `engine/city.js` — `buildCity` (pure), `brickReport`,
  `ledger`, `cmdPlan`, `cmdCancelPlan`. Choices are events: `build.plan`, `build.cancel`.
- `city/layout.js` (where everything stands) and `city/sky.js` (light at a Hanoi moment) are pure
  and tested; `city/CityScene.js` is the only three.js file; `ui/CityCanvas.jsx` mounts it and is
  loaded lazily through `ui/LazyCityCanvas.jsx`.
- `ui/CityView.jsx` = the City tab (planner, ledger, details); `ui/FocusView.jsx` shows the brick
  landing after each session.
- Push: `api/_lib/v2Digest.js` (pure) called from `api/coach-digest.js`.

## Laws for v2
1. **v2 never writes `game_state` or `timer_live`.** Reading v1 history for import is the only contact.
2. **Never rewrite or delete an event.** Correct a mistake by appending a newer fact.
3. **A fact two devices may emit gets a deterministic id**; a fact only one device emits gets a uuid.
4. **Stamp completions at the theoretical end**, never at wake-up time (iOS freezes tabs).
5. **On localhost, sync is OFF** unless `?sync=1` — test sessions must never reach Đàm's real log.
6. **Laptop first** (1440×790), phone must still work at 375 px with no horizontal scroll.

## Run it
`npm run dev:v2` → `http://localhost:31120/v2/` (preview config "Pomodoro v2"). `npm run build`
builds both apps. Tests live next to the code and run inside `npm test`.
One-off on Supabase: run `supabase/v2_events.sql` in the SQL editor — until then v2 says
"Chưa bật đồng bộ", stores locally only, and Settings offers *copy SQL · open editor · check again*.
