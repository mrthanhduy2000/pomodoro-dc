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

## GPT visual edition (2026-10-25, ADR-105/106)

Opt in at `/v2/?edition=gpt`. The shared v2 log, timer, commands and exact completed-focus
minute accounting remain canonical. Focus has no 3D canvas, including the completion screen.
Its lightweight companion shows seven-day minutes, streak and current construction progress.
The city renderer mounts lazily only in City. Original v1 quick focus durations (15/25/52/90)
are reused as pure constants, with 50/current preference retained. Recent completed goals offer
suggestions; Space and category preferences retain shared behavior.

City opens one map-led Hoi An preview. The old postcard, regional future button and parcel
sample selector are consolidated into this world (ADR-108). Earned progress is an overlay state,
not another architectural model library. All eight mapped monuments use the current parcel kits
and retain construction previews/workers. Thirty mapped road segments provide a dated core;
2,660 bounded static context houses use mapped centres/rectangular footprint envelopes with
interpreted heights/roofs. Forty foreground infill houses are illustrative. No preview writes
sessions or construction credit. Unsupported regions wait for survey rather than appearing
as geographically verified invented clusters. New mapped plans use site.version2/mapVersion1;
old grid and site.version1 events keep their previous allocator and coordinates.

### Historical choices and placement

Ten additive `ha-*-v1` keys use the existing blueprint field and released minute budgets.
Old keys, events and non-bridge building positions are unchanged. Heritage remains identifiable
under other surrounding styles. Models are interpretations built with shared materials/instancing.

| Choice | Minutes | Primary source |
|---|---:|---|
| Tan Ky | 100 | [Da Nang tourism](https://danangfantasticity.com/en/kien-truc/nha-co-tan-ky) |
| Phung Hung | 100 | [Hoi An heritage](https://hoianworldheritage.org.vn/vi/news/Diem-di-tich/Nha-co-Phung-Hung-12.hwh) |
| Phuc Kien | 200 | [Da Nang tourism](https://danangfantasticity.com/hoi-quan-phuc-kien) |
| Chua Cau | 300 | [Da Nang tourism](https://danangfantasticity.com/en/kien-truc/chua-cau) |
| Hoi An market | 200 | [Local food heritage](https://www.hoianworldheritage.org.vn/vi/news/am-thuc/cac-dia-chi-thuong-thuc-cao-lau-hoi-an-ngon-2332.hwh) |
| Thanh Ha pottery | 200 | [Heritage portal](https://hoianworldheritage.org.vn/vi/news/Du-lich-Hoi-An/ve-mien-co-tich-gom-thanh-ha-2767.hwh) |
| Kim Bong carpentry | 200 | [Heritage portal](https://www.hoianworldheritage.org.vn/vi/news/Thong-bao/thong-tin-khai-truong-hoat-dong-huong-dan-tham-quan-tai-lang-moc-kim-bong-2679.hwh) |
| Quang Trieu | 200 | [Official monument record](https://hoianheritage.net/uploads/download/hq-05-hoi-quan-quang-dong.pdf) |
| Quan Cong | 300 | [Official monument record](https://hoianheritage.net/uploads/download/m-01-quan-cong-mieu.pdf) |
| Cam Pho | 200 | [Official heritage record](https://hoianheritage.danang.gov.vn/vi/di-san-van-hoa/Dinh/dinh-cam-pho-so-52-duong-nguyen-thi-minh-khai-phuong-cam-pho-224.html) |

Quang Trieu has stone gates, lateral halls and courtyard; Quan Cong uses axial roofed halls
and red frontage; Cam Pho includes a four-sided front pavilion and East/West houses. No invented
inscriptions or uncertain founding dates. Workshop models represent local traditions, not private
workshop replicas. Source-linked architecture/life notes remain in the inspector.

By explicit user authorization, Chua Cau alone receives a GPT-only river-site projection.
`riverSite` uses an injective signed-pair address from the original integer plot; later plans
cannot displace it. `projectGptCity` preserves `sourcePlot`, IDs, budgets, bricks and all other
building object identities. Placement highlights, picking, camera, workers and deck mosaics
use the same projected site; commands still receive valid original candidates. Classic reads
unmodified plots. The earlier free decorative duplicate is removed. The actual landmark spans
the scene channel with five masonry supports, timber deck, pale half walls, tiled roofs,
attached shrine and landward steps. Its two walkers follow its deck. No Buddha/inscriptions
are invented. Terrain remains independent of earned progress. Detailed pavement loops use original land bounds;
distant river addresses receive local landings instead of generating empty plots across the gap.

### Living streets and rendering

Eight seeded frontage families vary massing, galleries, book displays, dining verandas and
courtyards. Existing connections retain settled thresholds, lanes, drains, rear yards and shared
canopies. Quay cargo, porters, pottery and carpentry use compiled routes/gestures. Six human
archetypes vary silhouette, height, skin, hair/headgear and apron; the latest 24 earned residents
use articulated figures and real resident picks, while the remaining bounded crowd uses lighter
figures. Decorative activity never writes rewards or impersonates historical records.

Market commerce uses a shared 44-second cycle: two alternating buyers approach, browse, pay,
receive a bag and leave. Six finite shelf items decrease on handover and replenish after six
sales. Coin, parcel and shelf changes are animated with the seller response. This is scene-local
activity, not a saved economy. Goods have their own upload ticks so updating a parcel does not
force every distant seller joint to upload. Paused/reduced-motion clocks never catch up.

Keep native DPR, full reflection/shadow resolution, two lights and four-sample MSAA. Warm sun,
cool sky fill, procedural sky/fog, deterministic plaster/stone/wood maps, water ripples, bloom
and organic roof wear remain real 3D. No background image replaces the city. Regional haze scales
for its larger viewing distances. No additional light or postprocessing pass is introduced.

Foliage retains original near geometry, 17/19-unit hysteresis, existing eight-unit cells and
bounds refresh after repartition. Additional roof batching and incremental LOD experiments were
rejected after same-art measurements regressed. Close visible actors keep render cadence,
distant visible poses sample at 15 Hz and offscreen poses at 8 Hz. Only changed matrix ranges
upload. Rendering keeps its measured bounded 40 Hz cadence. Moving shadow refresh remains
350 ms, reflections 80 ms; both idle at 125 ms.
See `PERFORMANCE.md` for measured results and limitations, rather than assuming stable 60 FPS.

### Journal

Shared `engine/stats.js::journalEntries` filters settled history by accent-insensitive goal,
category, status and Vietnam-calendar dates. Totals cover every matching row; UI initially renders
40 and offers more. A 28-day chart drills into a date; 7/28/90/all/custom ranges and legacy badges
preserve real records. Deferred search/memoization avoid per-second timer work. No history edit,
new event, progress reinterpretation or deletion is introduced.

## Run it
`npm run dev:v2` → `http://localhost:31120/v2/` (preview config "Pomodoro v2"). `npm run build`
builds both apps. Tests live next to the code and run inside `npm test`.
One-off on Supabase: run `supabase/v2_events.sql` in the SQL editor — until then v2 says
"Chưa bật đồng bộ", stores locally only, and Settings offers *copy SQL · open editor · check again*.

## Real Hoi An parcels (2026-10-25, ADR-107)

Research and dated Maps panorama observations are in `docs/HOI_AN_PARCELS.md`. They guide new
original geometry, not imported Google images. Proportions are game units, never surveyed metres.
`engine/parcels.js` owns immutable profiles, fixed district street axes, continuous frontage
intervals, physical clearance, water exclusion and conservative legacy-cell reservations.
Named old-town monuments stay in old town; pottery is in Thanh Ha and carpentry in Kim Bong.
Generic buildings can choose among four districts. Frontage width and depth depend on blueprint.

GPT planning passes an explicit site to shared `cmdPlan`; it writes workVersion 2 with site version 1,
district, centre, dimensions and orientation. Replay preserves original requested site, uses the
next clear same-district interval for a concurrent collision, and never reinterprets old plans.
Shared cell ownership survives cancellation of one adjacent parcel. Released minute costs and
exact completed-focus allocation are unchanged. No new SQL, timer or reward contract.
Old clients skip unsupported workVersion-2 plans; reload before using parcel plans.

GPT transforms the kit, picking, mosaics and worksites consistently. Construction workers retain
human proportions rather than being stretched to the lot. Buildings gain parcel-edge walls,
front pavement and rear service access; detailed ground never fills the entire district rectangle.
Optional parcel street commerce is capped at the latest 60 plots; all canonical buildings and
resident records remain. The old postcard and parcel generators are retained for compatibility
checks; the UI now uses regionalCity (ADR-108), including its construction slider and workers.

Expanded parcel scenes use coarse twenty-unit cells only for large static batches; compact
historical scenes keep their original path. Bounds include wind margin and picks follow each
instance. Shadow refresh is captured before the composer so water can defer reflection one frame
rather than sharing the expensive shadow frame. During meaningful camera motion only fullscreen
soft bloom is suspended; it returns after 100 ms settled, including reduced-motion mode. Emissive
lamps, billboard halos, pools, native DPR, 4x MSAA and map resolutions remain. Original plaster
noise/maps are retained after a rejected weather-lookup experiment. See PERFORMANCE.md for final
measured limitations; no universal 60 FPS claim.


### Parcel inspection follow-up (2026-10-26)

Candidate controls select a read-only site rather than writing a plan. The inspector shows its
frontage, depth and area in game units. A single explicit build action calls the existing command.
Only the selected site is rendered and framed, with entrance/boundary/footprint blocks; switching
sites does not create events or multiply full architectural previews. The selected-site camera
key is stable across unrelated timer/UI updates. The original small/full samples remain separate.
Phung Hung's new-parcel-only kit has a deep three-volume sequence, hip middle roof, upper timber
gallery and stone-based posts, based on the dated survey in docs/HOI_AN_PARCELS.md. Legacy kit
geometry and persisted footprint versions stay unchanged. FPS measurement is deferred by request.


### Quang Trieu parcel kit (2026-10-26)

The new-parcel-only kit follows dated gate/courtyard community panoramas and primary monument
sources recorded in docs/HOI_AN_PARCELS.md. A shared three-volume footprint supplies placement,
construction and the open sanctuary/galleries. Round stone gate columns support a raised central
roof and lower side roofs. The static ceramic dragon pool is original bounded geometry with a
plain water-coloured surface; it adds no Reflector, light or animation loop. Native pixels,
instancing and current rendering policies remain. Legacy geometry, site versions/dimensions and
completed-focus credit remain unchanged. FPS measurement stays deferred by request.


### Quan Cong Mieu parcel kit (2026-10-26)

Verified Street View and the 1991 monument dossier precede implementation; references and rejected
misattributions are recorded in docs/HOI_AN_PARCELS.md. Only new-parcel geometry changes. The shared
four-volume footprint supplies construction, placement and architecture: a pass-through three-bay
street block, two galleries and a rear hall around an open court. Circular lattice windows,
hinged painted doors, door eyes and glazed ridge crests distinguish the street facade. Bell,
drum and incense furniture are static inventory-based interpretations, without an invented deity
likeness. Circular vertical motifs compensate the shared world-width transform instead of becoming
ovals. All saved site versions, dimensions/orientations and the 300-minute cost remain. Legacy
geometry and previews are unchanged; native pixels/lights/render scheduling stay. FPS is deferred.


### Phuc Kien parcel kit (2026-10-26)

Dated Maps photographs (April 2025 gate, July 2024 court) and the 2018 Heritage Centre study
precede model changes; source limits are in docs/HOI_AN_PARCELS.md. New-parcel geometry alone
uses three transverse open halls and two longitudinal galleries from one shared footprint
table. The pink three-arch gate gains cream surrounds, a raised central arched tower and
tiered green glazed roofs. The existing roof generator accepts an optional four-tone palette;
default callers retain their original geometry/material output. Bonsai and water-garden props
are static. Saved 7.2 x 7.2 site dimensions, 200-minute target, legacy kits and preview controls
remain unchanged. No light, reflection pass, render scheduling or native pixel change. FPS deferred.


## Unified map-led Hoi An (2026-10-27, ADR-108)

`engine/hoian-map.json` contains30 road segments and8 monument references from the public OSM
snapshot retrieved2026-10-27. `gpt/hoian-buildings.json` contains2,660 rectangular building
envelopes and is loaded only with the lazy city renderer, not by the timer/engine.
`hoianMap.js` projects latitude/longitude into the local world at5 metres/unit. This is a point
reference system, not surveyed land: reference quality varies, Phuc Kien's point requires a
model offset, building heights/roof styles and water envelopes remain interpreted. Do not
replace the version1 snapshot beneath accepted site.version2 plans; a later survey needs
an explicit map version and backwards-compatible validation. OSM copyright/ODbL attribution
is visible inside the source navigator. No Google imagery or texture is shipped.

`parcels.js::mappedCandidates` offers a single fixed reference for eight old-town monuments.
It is opt-in from GPT; version1 parcel allocation is unchanged. Named references cannot be
cloned or relocated on collision. Shared command/replay retains workVersion2 and rejects
malformed map versions/positions; same-site concurrent mapped plans do not fall back to a
version1 street. Older clients reject unsupported site versions until refreshed. Exact focus
credit, all historical site objects and event order remain canonical.

`world.js::regionalCity` preserves original earned building objects and adds read-only context.
An earned mapped monument replaces only its matching reference illustration. Picking/planning
uses the real city, never synthetic progress. The same regional terrain is used during preview
and planning; the phase slider only modifies a copied visual model. Source/road navigation is
collapsed in the inspector. Main navigation contains no old/future/parcel sample switches.
Native pixels/lights/shadows/reflection resolutions remain. Context is static and capped at2,660
lightweight houses; foreground models retain detail. Ordinary selection keeps the same base-city
identity, avoiding a full model rebuild. No FPS run or speed claim in this round.

Legacy grid/site.version1 streets retain their existing commerce/worker builders inside the
unified scene; mapped construction uses the same worksite animation with its site transform.

Mapped detail framing uses neighbouring site/context envelopes and raises obstructed approaches;
legacy scenes retain their previous clearance radius.

Static map-block geometry uses a dedicated plain instanced box kind, grouped by material,
without the detailed-part spatial-cell split. This retains full mapped context coverage without
creating per-house actors or many tiny cell batches. There is no new FPS claim.

### Street-facing context and quay (2026-10-27)

Within the same mapped envelopes, up to72 nearby houses per surveyed corridor receive static
road-facing bays, shutters, thresholds, upper masonry/galleries, awnings and roof channels.
Nearest street projection chooses the exposed box face; this is a typology interpretation,
not an address-by-address replica. Tran Phu, Nguyen Thai Hoc and Bach Dang references are dated
in docs/HOI_AN_PARCELS.md. The Bach Dang promenade joins the existing interpreted bank envelope,
with low capstones, a water-facing course, tree openings and short capped mooring posts placed
by cumulative distance rather than source vertex density. Water/land elevations and widths
remain illustrative. Details use the existing material-only mapBlock batches; no new actors,
light, render pass, pixel reduction or data/placement schema is introduced. FPS stays deferred.
