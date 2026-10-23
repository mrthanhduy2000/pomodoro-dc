# v2 — "Thành phố nhật ký" (the diary city)

> The rewrite Đàm ordered on 2026-10-03: *rewrite the code, every old rule may be remade, the game
> starts from zero (only session history is kept, for stats), the 3D is not frozen.*
> Architecture decisions: **ADR-101** (stage 1), **ADR-102** (stages 2–4). Current status: `START_HERE.md`.

## The one rule
**Every completed session keeps its dated diary identity and notes, never lost.** The city is
Đàm's work diary. New minute plans may split one session's credited time across fixed buildings;
historical plans retain their original one-brick allocation (ADR-104).

## Game rules (built 2026-10-03, ADR-102 — exact numbers in `v2/src/engine/city.js`)
| Piece | Rule |
|---|---|
| Brick | 1 completed session = 1 brick. Colour = category, size = length. Carries date, time, note. Tap to read it back. |
| Building | Đàm **chooses** the next building and **its plot**. New plans need 100 / 200 / 300 completed focus minutes; unversioned historical plans need 4 / 8 / 12 bricks and keeps a ledger ("3/10 → 7/10 · mostly «Học» · 'ôn chương 4'"). |
| Resident | 1 active day = 1 resident, living in the house built that day. Tap → "Thứ Ba 12/10: 5 phiên, 2 giờ 05". |
| Full day | Daily goal (default 4, editable). Reached → that day's lantern burns all night. A streak is an avenue of lanterns. |
| Era = chapter | 70 bricks open an era (10 eras, one roof silhouette each). The city **grows outward and never resets**; old districts keep their old architecture, like tree rings. |
| Surprise | ~8% of sessions give a special brick; ~1% a statue/landmark; a weekly goal unlocks a weekend festival. |
| After a session | The camera flies 2–3 s to where the brick lands, with a sound, then a short summary. |
| Coming back | Absence costs nothing; the city just dims. The first session after ≥2 days away gives double bricks and the residents return. Push names the unfinished thing ("«Chợ phiên» còn 2 viên"). |
| Dropped | Resources, RP, refined materials, crystals, relics, ranks, crises, prestige, skill tree, cancel penalties. Diary identity remains the brick; new construction uses completed focus minutes. |

Cancelling gives no brick and **costs nothing**. Penalties build anxiety, not pull.

## Minute construction (2026-10-23, ADR-104)
New `build.plan` events carry `workUnit: 'minutes', workVersion: 1`. The immutable catalog size
multiplied by `MINUTES_PER_STEP` (25) gives the budget: house 100, hall/market 200, tower/temple 300
minutes. Only completed nonlegacy sessions credit exact `focusedMs`; pause, break, cancellation
and welcome-back bonus bricks give no construction time. Canonical diary bricks, resident homes,
surprises, eras and daily goals retain their original rules. Allocated fragments carry source id,
credited milliseconds and work offset. Overflow fills the queued building or waits in the yard.
Old unversioned plans replay their original session rules, including bonuses; no events are rewritten.
Both v2 views and the return digest read the same version-aware progress helpers. Clients must
reload before creating/interpreting minute plans; no SQL or stored-state migration is needed.
Hoi An phases: layout → foundation → timber frame → masonry → rafters → partial tiling → doors
and finishing → garden/opening. Scaffold workers/materials follow progress and use existing actor
batches and motion policy. Preview slider changes copied sample data only, keeping all 20 anchors.

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
7. **The pull cursor only crosses SETTLED rows** (`pullAll`, ADR-103): `seq` is handed out at
   INSERT start, so a cursor set to the highest seq seen can skip a row that commits late — forever.
8. **The tick never re-reads the log**: `advance(written, now)`; re-reduce only when `events` change.
9. **One shortcut: Space** (start · pause · resume). Discovery is a `title`, never text on screen.

## GPT visual edition (2026-10-22)

Opt in at `/v2/?edition=gpt` from the original app or the v2 header. It shares v2 data and
commands; this is not the stage-5 cutover. The classic view keeps the storey representation.
Both Focus and City use real three.js architecture. "Xem trước 3D" opens a labelled, read-only
sample with five selectable building types. No illustrative background replaces the city.
GPT renders the same bricks as construction details plus independently selectable mosaic tiles,
with unchanged plot centers. Hoi An frontages fill more of each plot; adjacent developed buildings
share render-only tiled alley passages, planted pergolas and lantern strings. Developed
houses/halls/markets have shallow service wings inside their own plot, clear of the canal.
Hoi An paving excludes the navigation margin without changing camera bounds; perimeter trees
and fine layered crowns soften the open edge. Four place-inspired skins and seasonal
atmosphere are local presentation preferences. The labelled twenty-building sample town contains no earned progress and cannot write
sample sessions or buildings to the log. A sample-only construction slider changes a copied
sample building's minute progress, exposing workers/scaffolding without changing the real log or sample
anchors. Leaving the sample resets this toggle. Actual plot selection still uses the shared `cmdPlan` validation.

GPT atmosphere uses the existing hemisphere and directional lights: cool sky fill, warm direct
sun, restrained lamp bloom and continuous day/night interpolation. Rain softens the direct sun
and increases distance haze. The procedural sky shares its horizon with exponential fog and
its glow direction with the actual sun. No image background, extra light, camera change or
additional postprocessing pass is used.

Hoi An houses have six stable frontage compositions, selected by a suffix hash of planId.
The variant affects massing, ridge direction, gallery/courtyard and shop displays, never plot
coordinates or construction facts. Articulated street/quay figures, vendors and boat occupants are
decorative; they are separate from earned residents and never write or impersonate diary records.
Boat occupants share their hull transform. Walkers follow short, fixed clear corridors with smooth
starts, stops and on-the-spot turns; vendors reach/bend and figures breathe/look around with seeded
phases. Completed market stalls and selected street carts share a customer/seller clock: approach,
browse, exchange, leave with a parcel, then return. Existing walkers become customers rather than
adding a second crowd. Cafe occupants drink from cups; unfinished earned buildings gain worksite
scaffolding, timber, buckets and an articulated worker. These are progress-derived scenery only.
Moving parts use their own instanced batches, separate from architecture. Animation uses a
paused local clock, respects reduced motion and never catches up after an offscreen/hidden pause.

GPT reuses procedural surface maps across rebuilds and disposes GPU textures with the scene.
Immutable CPU canvases for the five surface roles survive scene mounts, avoiding repeated pixel
generation when switching screens; they do not retain old renderer-owned GPU resources. Motion toggles
update the current scene without rebuilding it. Reflections and shadow maps retain their original
resolution but refresh at most every 125 ms while the view rests. Moving-camera reflections refresh
at most every 80 ms rather than rendering the whole city on every orbit frame; the last camera view
remains pending until refreshed. Sky/rebuild changes invalidate both immediately. Water ripples/people keep the scene's existing
40 Hz render cadence. With motion off, the composer skips identical views; interaction, resize,
selection and sky changes still redraw. Native DPR and light count are unchanged; architecture keeps full detail at every distance.
Foliage batches partition into original close leaf sprays and seeded coarser distant sprays, with
17/19-world-unit hysteresis. View classification is throttled and matrices upload only when a
partition changes. See `PERFORMANCE.md` for the controlled Apple M3 orbit/zoom comparison at Retina 2×.

Organic wear is deterministic: world-space plaster dampness, grouped clay-tile ageing,
small roof installation offsets and irregular street planting never reseed on rebuild.
Broadleaf branches and palm fronds vary by their existing planting seed. Broadleaf twigs use
three shared merged leaf sprays (one per foliage tone), keeping fine leaves without rebuilding
individual leaf transforms per tree. A shared GPU wind clock gently moves leaves and cloth;
reduced motion freezes it. Cloth awnings/curtains and alley laundry use shared geometry. Open door
panels, settled apron stones, moss and staggered eaves connect houses to paving. Shop ceiling strips
feed the existing warm ground-pool batch, adding no light or postprocessing pass. Quay steps have
seeded settlement, ropes sag, boats remain within their fixed moorings, and the rower's oar shares
its animation frequency.

## Run it
`npm run dev:v2` → `http://localhost:31120/v2/` (preview config "Pomodoro v2"). `npm run build`
builds both apps. Tests live next to the code and run inside `npm test`.
One-off on Supabase: run `supabase/v2_events.sql` in the SQL editor — until then v2 says
"Chưa bật đồng bộ", stores locally only, and Settings offers *copy SQL · open editor · check again*.
