> Last update: **2026-09-11** — **ROUND 53: A WALL THAT CANNOT SHADOW ITSELF (ADR-093).**
> Order: *"KHỐI PHẢI CÓ ĐỘ SÂU … Vòng 52 làm xong tầng shader. Ảnh có đẹp lên. Nhưng nhìn vẫn 'low',
> và tôi đã biết vì sao."* Everything on `main`, on top of round 52.
> Same three laws: ADR-007 · determinism · 105 era pairs × 4 seasons.
>
> ### Measured before
> Every window a flat pane standing 0,035 PROUD of the wall · 0 vertical relief on any facade ·
> ambient occlusion OFF at eye level (`TECH_DEBT #52`) · lit windows lighting nothing outside.
>
> ### Done — Phase A and Phase B, deep, as the brief asked
> 1. **Every window is a recess** (`engine/city3d/windowOpening.js`): two vertical JAMBS — the half
>    the old code never built — plus lintel, drip sill, glazing bars, and per era iron bars, shutters,
>    a hood. Eras 14/15 hang glass on steel, so they get MULLION FINS instead, which do the same job.
>    The jambs matter because **the sun stands to one side**: one catches light, one throws shadow
>    into the opening, and that pair changes with the facing of the wall.
> 2. **Pilasters** (Việc 3) — the wall had three horizontal lines since Phase 8A and no upright one.
> 3. **AO written into `LensShader`** (Việc 5), sampling the depth buffer DOF already builds.
>    `GTAOPass` removed entirely; **`TECH_DEBT #52` closed**. Measured: 31,4% of pixels darker by
>    more than 2/255 on the same frame, concentrated in creases.
> 4. **Lit windows spill onto the pavement** (Việc 7): the interior lamps moved from the centre of
>    the building to its facade, on the side facing the city centre — which is the side with the road.
>
> ### Not done, and why — the brief said "làm sâu A + B, đừng rải mỏng năm phần"
> - **Việc 6 (wet roughness, puddles reflecting)** — not built. Round 49's wet ground still runs.
> - **Phase C** (BEVEL_MAX, MAX_SIDES, debt #40), **Phase D** (value variation across one face,
>   moss/rust by age), **Phase E** (the 18-part ceiling, beards, a resident ROLE system) — not built.
>   Phase E is the one with a note attached: the ceiling is only worth lifting together with the role
>   system that would use it, and that is a build of its own, not a constant.
>
> ### Three bugs found by measurement, all mine
> - Shutters reached past the corner of the house ⇒ era 6's envelope +10% ⇒ `block.js` shrank units ⇒
>   **11 houses lost their roof detail**. Three stages, none of which said anything.
> - `TOTAL_RELIEF_CAP` now equals the old `SILL_RELIEF` exactly, so the envelope cannot move at all.
> - **`prism`'s `y` is the BOTTOM, not the centre** — and the symptom was era 15's wonder declaring
>   itself 29% taller, failing an aspect-ratio test in a subsystem the round never touched.
>
> ### Gates
> lint clean · build clean · **1 775 pass · 0 fail · skipped 1** (round 52 baseline: 1 768).
> New: `windowOpening.test.js`. `MAX_TRIANGLES_PER_*` are now runaway detectors (10× real), with a
> 6×-median relation as the real guard. GOLDEN digests and per-era triangle marks re-based with the
> scope recorded — era 1 alone unchanged.

---

> Last update: **2026-09-11** — **ROUND 52: THE PICTURE GOT EXPENSIVE (ADR-092).**
> Order: *"NÂNG CẤP ĐỒ HOẠ … Build lớn … high detail stylized game art — low-poly nhưng vật liệu và
> ánh sáng ở mức AAA … TOÀN QUYỀN."* Everything on `main`, on top of round 51.
> Same three laws: ADR-007 · determinism · 105 era pairs × 4 seasons.
>
> ### Measured before
> 0 post-processing passes (refused in a comment) · 0 of 16 material families with a texture map ·
> resident arms `skin` in 15/15 eras · 4 eras with a bare skull · residents cast no shadow.
>
> ### Done
> 1. **A post pass** (`render3d/postFx.js`): AO → god rays → bloom → lens → output, with a profile per
>    daylight phase and a switch in Settings ("Hiệu ứng hình ảnh nâng cao"). Tone mapping moved into
>    `OutputPass` so it applies ONCE.
> 2. **Textures generated at build time** (`render3d/surfaceTexture.js`): 16 material families, colour
>    + normal derived from one height field, torus-wrapped so they tile, sampled TRIPLANAR by world
>    position because the merged geometry has no UVs. No files, no network, byte-identical every build.
> 3. **Clothing is the limb, not a tube around it** (`human.js`): sleeves and trousers change the ROLE,
>    SHAPE and WIDTH of the arm and leg parts. 13/15 eras now have cloth arms. **0 extra parts.**
> 4. **Hair got its own axis** (`humanStyle.js` `HAIR_KINDS` + `HAIRDO`) — 0 eras bare-skulled, still
>    one part on the crown (a hat wins it when there is one).
> 5. **Residents cast shadows**, refreshed at 15 Hz while they walk (`CityScene3D.jsx` `SHADOW_EVERY_N`).
>
> ### Not done, and why
> - **AO is off in walk mode** — three's `GTAOPass` returns a solid BLACK occlusion buffer near the
>   camera at eye level (row 612/700, step 16,5/255). The city view measures 1,4/255, i.e. clean.
>   Full measurement and everything ruled out: `TECH_DEBT.md` #52.
> - Volumetric rays, DOF, vignette and grain ship; **no per-role wet roughness map** (Việc 6) and
>   **no per-role body proportions** (smith/elder/child) — the latter needs the resident ROLE system
>   that task "R51 V6" owns, not a per-era axis.
>
> ### Two capture bugs fixed along the way (both pre-existing, both in `city-preview.mjs`)
> - The renderer was built without `preserveDrawingBuffer`, so a screenshot assembled from several
>   reads could tear into four pieces. Older than this round; the post chain only widened the window.
> - Film grain was seeded per frame, so two capture strips of one STILL image disagreed. `still: true`
>   in `postFx.js` pins it.
>
> ### Gates
> lint clean · build clean · **1 767 pass · 0 fail · skipped 1** (round 51 baseline: 1 752).
> New test files: `humanWardrobe.test.js`, plus the walk-mode AO law in `postFx.test.js`.

---

> Last update: **2026-09-09** — **ROUND 51: THE EYE CAME DOWN TO THE STREET (ADR-091).**
> Order: *"PHỐ ĐÃ MỞ, GIỜ PHẢI CÓ NGƯỜI Ở … Ở tầm mắt, bầu trời chiếm gần nửa khung hình và mặt đường
> chiếm phần lớn nửa còn lại. Hai thứ lớn nhất trong tầm nhìn đang là hai thứ trống nhất."* Everything
> on `main`, on top of round 50. Same three laws: ADR-007 · determinism · 105 era pairs × 4 seasons.
>
> ### Measured before
> One sky gradient for all 15 eras × 4 seasons × 24 hours · 0 things standing beside the road ·
> 0/15 wonders you could enter · facade vocabulary of 19 items, every one at storey height or above.
>
> ### Done
> 1. **The sky is a decision** (`engine/city3d/sky.js`, pure) — `skyAt(era, season, hour, weather,
>    dayIndex)`: cloud kind and cover, drift, dawn/dusk underlighting, stars behind the era's own light
>    pollution, the Milky Way, and the moon on a real 29,53-day cycle. `ERA_SKY` = 15 rows.
> 2. **Drawn as a DOME that turns** (`render3d/skyLayer.js`) — clusters of four puffs drawn out along
>    the wind, stars with a Milky Way band, a moon with a dark disc across it, and CLOUD SHADOWS on the
>    real ground (`horizon.heightAt`), strongest at broken cloud and absent under full cover.
> 3. **A fourth geometry column, `sky`** — not folded into `backdrop`, because backdrop exists for
>    being CONSTANT across eras and the clouds are the opposite. `sceneStats.test.js` demands both.
> 4. **19 kinds of street furniture** (`streetFurniture.js` + `…Spec.js`) on the kerb line of road
>    cells, a kit per century, every row a date (hydrant 1801 · gas lamp 1807 · bin 1870s · rail 1830s).
>    They live in `layout.street`, NOT `layout.props` — `props` keeps its one-thing-per-cell law.
> 5. **A new role, `iron`** — `trim` borrows the century's colour, so a Manchester gas lamp came out
>    brick red and a manhole cover pink. Rides the `wood` family: no era gained a draw call.
> 6. **The bottom two metres of the facade** — a number plate, a window box, a shop board, all pinned
>    to the GROUND in absolute units (`height × 0,16` would put era 11's numbers on the fourth floor).
> 7. **The wonder opens** (`wonderEntrance.js`) — a portal cut INTO the front, a colonnade in equal
>    pairs, a lintel, a pediment, a light inside. 14/15; era 2's pyramid stays solid on purpose.
>    Era 3's ziggurat gets its processional stair.
>
> ### Numbers
> 1 751 pass · 0 fail · skipped 1 (was 1 734) · draw calls UNCHANGED in all 15 eras · triangles
> +1,7 % … +7,9 % per era, re-measured and anchored to `scripts/scene-tri.mjs --era 11` = 151 594 ·
> 0/105 era pairs below the eye threshold in all four seasons (the round's only numeric gate).
>
> ### Not done, named
> Việc 5 (greenery), 6 (more people/animals), 7 (age traces), 8 (`#65`/`#60` water and bridges),
> 9 (walk-mode features). The brief said *"làm sâu A + B, đừng rải mỏng cả bốn"* — the budget went to
> A and B in full. Full reasoning: **ADR-091**.
>
> ---
>
> Previous: **2026-09-09** — **ROUND 50: MORE TO SEE, MORE TO DO (ADR-090).**
> Order: *"THÊM TIỂU TIẾT VÀ TÍNH NĂNG. CHỈ THÊM, KHÔNG BỚT. BỎ HẾT VIỆC NGƯỠNG VÀ TRẦN."* Everything on
> `main`, on top of round 49. Three laws only: ADR-007 · determinism · the 105 era pairs.
>
> ### Measured before
> 15 looks (one per era) · the city could only be seen at the current hour · no way down to the street ·
> no way to keep a picture · 0/75 buildings had an inside · 0 kinds of facade detail · 4 eras losing
> rooftop detail (worst ratio 0,844) · the head 1,54× life size with `#81` half-fixed at the hat.
>
> ### Done
> 1. **Four seasons** (`season.js`) — climate × season tables (`cold · temperate · tropical · arid`) plus
>    per-era touches: sakura (13), peach (4), young rice then harvest gold (6), snow (5·9·10·11·12),
>    steppe flowers (1). Moves leaves, blossom, ground, snow on roofs and ground, wind, fog, and what
>    falls. Summer is the identity look. `museumSeason` freezes a sealed era. `weather.js` gained
>    `SEASON_WEATHER`; a cold winter snows instead of raining; `wet ≥ rain` still holds by construction.
> 2. **The handle** (`CityTimeControls`) — a 0–23 h slider and four season chips under the picture, the
>    hour committed 150 ms after the slider stops (each commit rebuilds the scene). A museum piece has no
>    handle, only a caption naming its frozen hour and season.
> 3. **Walk mode** (`walk.js` + `orbit.setWalk`) — eye level on the road network, as a MODE of the same
>    crane: the walker emits orbit states, the pitch floor and distance clamp are freed and restored, the
>    lens widens to 62° with a 0,03 near plane. It stands on the scene's own terrain (`groundHeightAt`).
>    Keys · buttons · wheel walk, drag looks around, Esc and the corner button fly home.
> 4. **Postcard** (`cityPostcard.js`) — render and read the canvas in the same turn, then a caption band
>    (era · country · landmark · buildings · sessions · season · hour) and a PNG download.
> 5. **Interiors** (`interiors.js`) — ~60 % of non-symmetric buildings open their door onto a room: forge
>    (with a real `fire` source), shelves, table, loom, bookcase, altar, bar, bed, sacks, desk. Cavity
>    depth ≤ a third of the building; landmarks stay shut (symmetry).
> 6. **`#77` + `#90(b)` closed together** — `ROOFTOP_MIN_SPAN` is a relation now (0,083, derived from
>    `CELL_PIXELS`/`EYE_PIXELS`/`BUILDING_SCALE`/`STACK_W_RATIO` and the close-up frame's 3,4× gain); the
>    LAND floor keeps 0,24 as `ROOFTOP_LAND_SPAN`, so no dwelling moved. Eras losing rooftop detail:
>    [6,10,11,13] → **[]**; worst ratio 0,844 → **1,000** (473/473 units).
> 7. **Facade vocabulary** (`facadeDetail.js`) — 18 kinds, per era, all flush with the wall.
> 8. **`#81` closed at the root** — head 0,20 → 0,16 of body height; every hat came right untouched.
> 9. **The one numeric gate caught a real one.** The 105-pair measurement now runs over all four seasons
>    (`palette3d.test.js`). First run: **10/105 pairs under the eye threshold in winter** (eras 5·9·10·11·12,
>    5↔9 just 1,0 apart) because `snow: 1,0` paints every city white. Fixed with snow that belongs to its
>    city — deep in Stalingrad, cleared in Paris, ploughed in New York, grey with soot in Manchester — and
>    45 % of each era's ground saturation surviving. Re-measured **0/105 in all four seasons**.
> 10. **Re-based on purpose:** GOLDEN (15) · triangle marks (15) · plinth count era 5 0→1 and its
>    distribution 26→27 · cityFocus control list [1,7,8,10,12,15] / 9 flights · one named zoom pair [10,11].
>
> ### Measured after
> looks 15 → **60** · hours viewable 1 → **24** · street level **yes** · postcard **yes** · buildings with
> an inside 0 → **~60 % of non-symmetric** · facade detail kinds 0 → **18** · rooftop detail 473/473 ·
> falling kinds +petals +leaves · draw calls **unchanged** · triangles era 6 200 308 → 237 632 ·
> 3D debts 46 → **43 open** · `npm run test:quiet` **1 733 pass · 0 fail · skipped 1** · lint 0 · build ✓.
>
> ### Not done · why
> `#65` (river · canal · estuary share one geometry) and the rest of Việc 8's ground work · more resident
> roles and animals beyond the head fix (Việc 10) · traces of habitation beyond round 49's life props
> (Việc 11). All additive, none blocked — the budget went to Part A and the two roof debts, in the order
> the brief itself asked for.

---

> Last update: **2026-09-09** — **ROUND 49: SOMETHING TO BLOW, AND A FIRE LIT (ADR-089).**
> Order: *"CHO CÁI MÁY THỨ ĐỂ THỔI, VÀ THẮP LỬA LÊN … lúc 10 giờ tối, không chạm gì, nhìn 10 giây — và tôi thấy
> lửa cháy, cờ bay, thuyền nhấp nhô."* Everything on `main`, on top of round 48. No performance numbers (Đàm).
>
> ### Measured before
> era 8, two frames 0,8 s apart: **0,31 %** of pixels change — and a heat-map shows only the shoreline and the
> residents; no flag, sail, palm or tree moves (the round-48 2,6 % was era 10: smoke + residents) · prop kinds 6
> · particle kinds 6 · 0 eras with fire · one weather for every hour · museum hour 15.
>
> ### Done
> 1. **Lesson 106.** `surfaceDetail.applySurfaceDetail` shares one program cache key across materials with and
>    without the motion injection ⇒ the merged city's program was the ground's ⇒ nothing merged moved. Key now
>    splits on motion; control test in `surfaceDetail.test.js`. Same frames: **1,44 %**.
> 2. **Cloth** — `canvas` (undyed) and `flag` (`FLAG_HUE` per era; the UI accent is violet in era 6 and fails the
>    magenta guard) · flags on `mast` motifs and rooftop masts (mirrored pair) · banners · sails · awnings ·
>    laundry · tents. Flap weights: held edge = 0 (flag: −X edge; hanging cloth: top). All new roles ride `wood`.
> 3. **Boats** — `waterProps.js` (`insetAt` threshold per water kind, 1,7 cells apart, yaw along the open axis);
>    item kind `water` in `KIND_NGOAI_LUOI` (landscape group; the same law excludes them from camera blockers
>    in `sceneGraph` AND `cityFocus.test.js`); 1,3× scale; the whole hull is one rigid `bob` (`geometryFactory`).
> 4. **Cranes** on scaffolds past t > 0,3; **life props** `lifeProps.js` (`ERA_LIFE` 15 rows; free cells touching a
>    road or within 2 of a home; only-add — `lifeProps.test.js`).
> 5. **Fire** — `PARTICLE_STYLE.fire` (additive, unfogged, embers) from every part tagged `fire` in any group
>    (campfire · brazier · forge · firepit · torches on the lamps of eras 1–3, bronze collar keeps `gold`);
>    `ERA_MOTION` declares `fire` for 1–10 and 12 and `ERA_LIFE` puts a fire prop FIRST there (sceneStats law:
>    a declared kind needs a source); `flame` glows at night with `glass`; ≤ 6 local `PointLight`s, deterministic
>    flicker (`fireFlicker`); `MUSEUM_HOUR` 15 → 18 by eye (two frames of era 1).
> 6. **Weather** — `weather.js` (`weatherAt` per day phase; `wet ≥ rain` by construction; `wetSurface`; `museumWeather`);
>    `sceneGraph`: fog × (1 + 2,5·fog), three ground materials darker/smoother/reflective only when wet
>    (`wetGain` — the dry specular law of the wiring test still holds), rain/drizzle streaks, smoke tint by phase;
>    `CityScene3D` passes the weather of the same hour; `city-preview --dry` = control. Era 13 22 h wet vs dry:
>    **29,8 %** pixels differ. `weather.test.js` (6) + a wiring test.
> 7. **People** — `#79` closed (`steel` role, kept dark: SSh-40 painted like the jacket, palette exception [12, 15]
>    is history) · `#81` partial (brim 1,9 → 1,7; floor 1,62 from the crown law).
> 8. **Re-based on purpose:** GOLDEN eras 1·4·6·8·12·13 · `MOC_TAM_GIAC` 15 eras (+0,5 … +2,1 %) · cityFocus control
>    list [1, 8, 10, 12, 15] / 8 flights (era 12 masthead flag) · stall goods `gold` → `trim` (era 13 draws no gold).
>
> ### Measured after
> prop kinds 6 → 20 · particle kinds 6 → 9 · eras with fire 0 → 11 · weather kinds 1 → 7 · era 8 px change
> 0,31 % → 1,44 % · frame-fit 0/15 cut · ADR-007 15 × 120: 0 moved · `npm run test:quiet` **1 715 pass · 0 fail · skipped 1 (+12 vs round 48)** · lint 0 · build ✓.
>
> ### Not done · why
> `#90(b)` + `#77` (rooftop span as a pixel relation — 12 green tests, its own round) · people talking in pairs ·
> puddles as a mask · 390 px audit: judged on the sweep, nothing removed (the details added this round —
> boats 1,3×, flags, awnings — were sized at the default camera first) · no 22 h before-sweep (round-48 code).
>
> ### Photos (scratch, in the report)
> era 8 strip 17,5/18,3/19,1 s (river crop 2×) · era 1 at 22 h (fires) · era 13 at 22 h wet vs `--dry` · phone 390 px.

---

> Last update: **2026-09-09** — **ROUND 48: THE CITY BECOMES A PLACE (ADR-088).**
> Order: *"Chuyển động, motion, 3D chuẩn hơn. Bám sát lịch sử. Mở rộng diện tích thành phố … biến nó thành
> MỘT NƠI CÓ THẬT."* Everything on `main`, on top of round 47. **No performance numbers this round** (Đàm).
>
> ### Measured before
> only residents moved (`isAnimated: residents.length > 0`) · parts 1 axis, joints 2 · terraces 1–3 with
> relief up to 0,90 inside the grid · outskirts ring fixed at 8 cells for every session count · the
> round-47 "two code paths" of the preview tool (a wrong diagnosis).
>
> ### Done
> 1. **Việc 0 — lesson 104.** Reproduced: `--eras 11,12,13` vs `--era 12` = 0 pixels differ. Root cause:
>    a stale file in the shared `.city-preview/` folder + a swallowed per-era log + overlapping runs
>    sharing one bundle. `city-preview.mjs`: lock (exit 3), pre-delete of every target, `last-run.json`
>    + `sourceStamp` in every `.geom.json`, `--nomotion`; 3 source tests.
> 2. **Second axis** — `parts.js` `rx`/`rz` (keys only when non-zero; GOLDEN untouched) · `geometryFactory`
>    `Ry·Rz·Rx` about the base centre · `specSpan/specFootprint` count the lean · palm fronds hinged at
>    the crown (#29 closed) · `humanPose` joints `c` + `HEAD_LOOK_RAD`, `sceneGraph` `jointYaw`.
> 3. **Motion** — `engine/city3d/motion.js` (ERA_MOTION 15 rows, PARTICLE_STYLE, phaseAt, motionTime) ·
>    `render3d/motion.js` (GLSL sway/bob/flap, water waves, `createParticles`) · factory `aMotion` ·
>    `surfaceDetail` injects through its one hook · `sceneGraph` `update(t)`, smoke sources from
>    `tag: 'stack'` + hearth fallback, `isAnimated` true whenever the era moves · `CityScene3D`
>    calls `city.update`. Era 12: 3,66 % px change between frames 1,5 s apart (0,11 % with `--nomotion`).
> 4. **Terrain** — `ERA_TERRAIN` flattened (13 × 1, eras 5/8 × 2 at 0,14/0,12) · `HORIZON_STYLES`
>    `near` +0,12…0,17 and `rise` up for eras 1 · 5 · 10 · 13. Terrain, horizon and waterView tests green
>    without touching a list — no old gate moved.
> 5. **Land growth** — `landGrowth.js` (milestones, reach, hamlet bonus, camera pullback) · `outskirts.js`
>    stage-0 lattice byte-identical, outer ring at new indices · `hinterland.js` hamlets appended ·
>    `cityParts.js` passes `layout.sessionCount` · `orbit.js` pullback · call sites in `CityScene3D`
>    and `city-preview`. `landGrowth.test.js`: 15 eras × 5 stages only-add sweep.
> 6. **Tests re-based on purpose:** GOLDEN (chimney `tag`), sceneStats InstancedMesh names (particles),
>    outskirts/hinterland purity laws (sessionCount may ADD).
>
> ### Measured after
> moving kinds 1 → 9 · axes 1/2 → 3/3 · terraces max 3 → 2 · ring 8 → 11 cells at 140 sessions ·
> ADR-007 15 × 120: 0 moved · sealed eras: same size (frozen count) · `npm run test:quiet`
> **1 703 pass · 0 fail · skipped 1** (+16 tests vs round 47) · lint 0 · build ✓.
>
> ### Not done · why
> boats · cranes · flags on masts (no such props/parts yet — the `cloth` role and flap shader wait for
> them) · gait stop/turn/sit · 390 px detail pass · celebration inside the picture · #40 tiles on the slope
> (under 12 px) · #88 plots per block. Each is a ❌ with its reason in the round-48 report.
>
> ---
>
> Previous update: **2026-09-08** — **ROUND 47: THE CITY IS REDRAWN ON THE SAME MAP (ADR-087).**
> Order: *"ĐỘT PHÁ MỸ THUẬT. Vẽ lại thành phố từ đầu, trên đúng tấm bản đồ cũ. Tôi mở khoá thành phố 3D
> — hộp đen không còn."* Everything on `main`, on top of round 46.
>
> ### Measured before (15-era noon sweep, `city-preview.mjs`, default camera)
> one `GROUND_ANCHOR` (58°, 22%) under all 15 eras · median saturation of the 14 largest colours ≥ 0,20 in
> **2/15** eras (China's gold roofs, Singapore's glass) · `sweep-score` closest pair **22,4**, median **36,2**
> · `BEVEL_MAX` 0,035 — a bevel-off/on pair at the default camera is identical to the eye · 15-era city
> total 1 925 908 triangles (era 8: 124 348).
>
> ### Done
> 1. **Ground per era** — `GROUND_KINDS` (sand · clay · steppe · meadow · paddy · paving · cinder · snow, each
>    a hue/sat/light WINDOW) + `groundKind` / `groundColor` / `wallColor` on all 15 `ERA_STYLES`; `palette3d`
>    derives ground shades (spread ≤ 0,018 L), outskirts, night, walls/trim from them; legacy path byte-identical
>    when an era declares nothing. Tests: window per era · ≥ 5 kinds · pairwise distinct · walls real materials.
> 2. **Rounding that shows** — `BEVEL_MAX` 0,06 · `BEVEL_RATIO` 0,22 · `BEVEL_MIN_VISIBLE` 0,014 (0,006 blew
>    era 6 to 640 k triangles) · rounded gable ridge · **plan-corner rounding** (`cornerRadius`, ≥ 0,25 unit,
>    `CORNER_SEGMENTS` 2) on walls AND wide thin plates. `countTriangles` mirrors the factory (92 / 44 / 12).
> 3. **Light** — `CONTACT_FLOOR` 0,58 → 0,44 · `CONTACT_REACH` 0,38 → 0,52 · one rim `DirectionalLight` (0,22 ×
>    sun, sky colour, no shadow). `PCFShadowMap` tried, renders differ (`cmp`), REJECTED by eye. No 4th fill,
>    tone mapping Neutral, DPR untouched.
> 4. **Fifteen looks** — `hip` + `mansard` roofs; `vernacularRoof` 3 → 5 values; `vernacularPitch` (4: 0,42 ·
>    7: 0,30 · 9: 0,62 · 12: 0,62) applied by `getVernacularStyle`; domes 12 sides; `emitWindows` floor
>    `storyHeight × 0,36` (closes `TECH_DEBT_3D #25`).
> 5. **Roof rise on the full-plot footprint** — `emitRoof` reads `ctx.plotFx/plotFz`; `block.test.js` «CAO LÊN»
>    list `[5]` → `[]` (era 12 had dropped to 0,69× with its new gable; now no era is lower). Closes #90(a).
> 6. **Docs** — black box retired (`CLAUDE.md` · `START_HERE.md` · `docs/TECH_DEBT_3D.md` header ·
>    `PROJECT_STRUCTURE.md`); #25 · #76 · #90(a) closed, #88 · #73 annotated; `docs/LESSONS_3D.md` 101–103;
>    START_HERE round 44 rotated to the archive log.
>
> ### Measured after (same tools, same camera)
> 15/15 eras own ground (8 kinds) · saturation ≥ 0,20 in **10/15** (8 · 10 · 11 · 12 · 13 stay honest greys) ·
> `sweep-score` closest **24,9**, median **51,6**, **0/105** below 12 · bevel off/on differs by eye (×3 crop
> of the default frame) · triangles 15-era total **1 877 928 (−2,5 %)**, era 8 **118 508**, worst era 6 **199 252** (+0,4 %), worst building 8 520/12 000 ·
> ADR-007 15 kỷ × 120 mốc: **0 moved**. Gates: `npm run test:quiet` **1 687 pass · 0 fail · skipped 1** (+5 tests vs round 46) · lint 0 · build ✓.
>
> ### Not done · why
> `#88` plots per block stay 4 (options reshape every dwelling, need Đàm's top-down eye) · `#73` camera not
> moved (every photo compares at the default eye) · `#90(b)` era 6 rooftop detail loss · the `--all` vs
> `--era N` render discrepancy of `city-preview.mjs` (lesson 103) is recorded, not root-caused.
>
> ---
>
> Previous update: **2026-09-08** — **ROUND 46: THE CITY TAB CATCHES UP WITH THE CITY'S THREE ROLES (ADR-086).**
> Order: *"THÀNH PHỐ PHẢI TRÔNG NHƯ THỨ ĐÁNG NHẤT TRONG APP … làm cho màn hình của nó nói ra cả hai."*
> Acceptance: *"mở tab Thành Phố trên iPhone, chưa cuộn một lần nào, và tôi thấy ba thứ."*
> Everything on `main`, on top of round 45.
>
> ### Measured before (390×844, 12-era save, `shot.mjs --probe`)
> picture **201 px = 23,8 %**, starting at **y = 494** · header 202 px (taller than the city) · 12 era
> chips = **6 rows / 217 px** · «SP» on the tab: **0** (ledger 37) · Kỷ 3 at night **0,15** vs noon 0,37 ·
> «EP lúc niêm phong: 5006» printed raw · desktop 1280×900: stat row at y = 1013 (below the fold).
>
> ### Done
> 1. **`components/city/stageMetrics.js` — ONE owner of the picture's height** (aspect floor 1,3 =
>    `FRAME_FIT_ASPECT` from the engine · `100svh − reserve` · ceiling). `CityScene3D` in `fill` mode on
>    every tenant; `StagePlaceholder` and the 1 : 0,62 constant deleted. Reserves declared and listed.
> 2. **Phone top rail on the City tab: title · level · bell only** (`hideStats`, `hideEra`) — 202 → 77 px.
> 3. **Era TILES** (`EraSwitcher.jsx` + `cityCopy.eraTile`): «Kỷ 12» over «★ | 4/5 | —»; `auto-fill`
>    grid, 40 px floor. **15 eras = 2 rows at 390 · 1 row at 1280.** «đang xây» said once, in the caption.
> 4. **The tab says what it pays**: cell 2 = «Điểm kỹ năng» (`cityEarnedSP`, whole city + «+N từ kỷ
>    này»); «Đang xây» header «xong là +1 SP»; unbuilt slots «chưa xây · +1 SP»; the plaque under the
>    picture keeps the session count. Call-site test in `cityViewShellWiring.test.js`.
> 5. **Museum lit once**: `MUSEUM_HOUR = 15` / `museumDaylight()` for `dimmed` scenes. Night = noon = 0,37.
> 6. **«EP lúc niêm phong» gone**; cell 3 shows «Kỷ trọn vẹn» in every era.
> 7. **Sealed-era empty slot: «trùng tu được · +1 SP»** — ⚠️ Đàm's premise («không bao giờ xây được
>    nữa») is FALSE in his own ADR-012: restoration exists, has no resource gate, and pays 1 SP.
> 8. **Arrival moment** (`engine/cityArrival.js` + `CityMoment.jsx`): count difference vs a per-device
>    `localStorage` stamp (`dc-city-seen-v1`) → camera flight to the newest building + 4,2 s banner.
>    First visit stamps silently; a shrunken city is never announced. Also rendered on the 2D branch.
> 9. «Kéo để xoay» hint is a pill ON the picture (top-left; escape button top-right; card/moment bottom-left).
>
> ### Measured after
> picture **268 px = 31,8 %** at **y = 190** (15 eras: 204) · stat grid bottom 669 / 716 < tab bar 726 ·
> 15 tiles **2 rows / 80 px** at 390, **1 row** at 1280 · horizontal scroll 375/390/1280/2000 = 0 ·
> 1280×900 picture 438 px, stat row at 868 · museum 0,37 at 22h and 12h · SP said in ≥ 3 places.
> Gates: lint clean · build green · FAST **1.682 pass · 0 fail · skipped 1** (baseline 1.639) · cross 3/3.
>
> ### Decided, and deliberately NOT done
> · **No museum gallery** — eight WebGL contexts or eight 80-px stamps; the tile strip is the overview.
> · **No camera change for a taller frame** — the black box owns `cityFrameDistance`; the aspect floor obeys it.
> · **The rate stays 1 SP / building** and the destination stays 75. No fifth stat cell, no new unit.
>
> ### Tool lessons (ADR-086 §Tool lessons)
> · First 3D frame at `--settle 600` is a transient (zoomed, cropped) — shoot the City tab at ≥ 1500.
> · Headless SwiftShader does not composite the bottom overlay over WebGL: the moment was photographed
>   over the 2D renderer (`--city2d`), same component, same slot. `--probe` exits before capture.
> · `--hour` moves the day-arc stamps: seed `dc-day-arc-v1` for 2026-08-13 or the week banner lands on the photo.
>
> Photos (scratch, 4 attached to the report): `before-390.png` · `after-390.png` · `moment-390-2d.png` ·
> `museum-night.png` · `strip-15-390.png`; also shot: `after-1280-v1.png`, `museum-noon.png`.

> Last update: **2026-09-08** — **ROUND 45: A BONUS THAT CANNOT BE SEEN IS NOT A BONUS (ADR-085).**
> Order: *"vòng 44 mở van cho tôi kiếm được điểm. Vòng này trả lời câu kế tiếp: tiêu vào đó có đáng
> không?"* · *"tôi mở một kỹ năng, và tôi biết ngay app vừa khác đi ở chỗ nào."*
> Everything on `main`, on top of round 44.
>
> ### The audit that decided the round
> All 36 skills walked against *"can he feel it, where and when?"*: **27 are a silent `+X% XP/EP`**
> that appears on no screen ever · 6 are genuinely felt (breaks +5′, streak shield, combo window,
> multiplier tier, two manual activations) · 3 are prestige-only and dead on a save that has never
> prestiged. One skill is worth **3–7 XP on a 48-minute session**. So round 44's twelve taps bought
> twelve numbers nobody could see, folded into one headline already summing eleven other things.
> ⚠️ No percentage could have fixed that — the percentages were never the part that failed.
>
> ### Done
> 1. **Every bonus names itself at the ending** — new pure `engine/sessionCredits.js`. A ledger
>    collects one line per bonus as `gameMath.js` adds it (25 sites); `challengeEngine` and
>    `wonderEffects` now return `sources` beside their pre-summed percentages, so ranks, relics and
>    building perks arrive with names instead of as three anonymous totals. The card shows the top
>    three as chips and counts the rest. ⚠️ **A PASSENGER, NOT A DRIVER**: it reads the formula's
>    locals and never feeds one back, so a bug there can make the CARD wrong and never the PAYOUT.
>    At `XP_FACTOR_HARD_CAP` the credits are rescaled proportionally — chips that sum to more than
>    the headline above them destroy the breakdown's credibility in one glance.
> 2. **Opening a skill is a 4,2-second moment** — `engine/skillPreview.js` +
>    `components/focus/SkillMoment.jsx`. ⚠️ The number is **MEASURED, not looked up**:
>    `previewSkillGain` runs the real `calculateRewards` twice, with and without the skill, at the
>    player's own median session length. A table would be a second copy of 36 formulas. Dice skills
>    (`VAN_MAY`) are **refused, not averaged** — an expected value printed as a promise is the same
>    lie the old headline told.
> 3. **The three-skill choice is a decision now**, not a button with three labels: each choice
>    carries its measured worth (`≈ +5 XP / phiên 48′`), and `null` where the honest answer is
>    "it depends on a roll".
> 4. **The week is one line on the day card** (three daily + one weekly = four things to remember
>    for an app he only wants to open and press Start). Gated on `showDaily && !showWeekly`, so it
>    never ships beside the full weekly card on desktop or on Tiến trình. No `truncate`.
> 5. **The skill-tree header stopped being blank.** It only ever knew ONE distance — the next level
>    — which on a real save is **~155 sessions**, over `STAGE_COUNTDOWN_MAX_SESSIONS`, so it printed
>    nothing while the city was three sessions from paying. `nextSkillPointETA` prints the nearer of
>    the two taps countable in sessions. The week is excluded on purpose: a chain closes on a
>    calendar, so "~N phiên" would be an invented number.
>
> ### Decided, and deliberately NOT changed
> · **The 1 SP/building rate stays.** Đàm read the rhythm as 5,6 sessions per point — that is the
>   city tap alone. All three taps are ~139 SP over ~420 build-sessions ≈ **3 sessions per point**;
>   his felt number was nearly twice too slow because two taps were invisible from where he stood.
>   The ratio is load-bearing (it makes the tree finish as the city finishes), so the fix was a
>   sentence, not a rate.
> · **Hành trang keeps all three sub-tabs** — three verbs, not three views: *spend points* ·
>   *choose what to build* · *read what is running*. «Đã xây» looked like a copy of the Thành Phố
>   tab until the tap was traced: it is the ONLY place that names what a built building's perk does.
>   Deleting it would have made perks less felt in the round meant to make them felt.
>
> ### What the CAMERA caught and the review did not
> The first perk chip read *«🏛 +5% XP mọi phiên +8 XP»* — the registry `label` is the EFFECT, so the
> chip printed a percentage beside the amount that percentage had just produced: one fact twice, in
> eight characters. No test could see it; both halves were right. A perk is now credited by the
> **building that grants it** (*«🏛 Thờ Phổ Linh Hồn +8 XP»*), and a test refuses any source label
> containing `%`. ⚠️ Round 41's law paying for itself: **do not hand over a moment without a
> photograph of it.**
>
> ### The measuring-tool lesson, the 29th
> The skill-moment shot kept catching the day banner. A render trace proved the moment rendered at
> t=13.138 ms and dismissed at t=17.440 ms — exactly its 4,2 s. Nothing was broken: the sandbox takes
> ~13 s to hydrate and `--settle` fired outside the window. `--watch "KỸ NĂNG MỚI"` (UPPERCASE —
> `--watch` matches `innerText` after CSS uppercasing) catches it every time. **The tool was late,
> not the code.**
>
> ### Gates
> lint ✅ · build ✅ · `npm run test:quiet` — see the run recorded with the commit.
> ⚠️ One existing test was RELAXED IN SHAPE, not in strength: `dayMoment.test.js` string-matched the
> whole `quiet={…}` expression, so a legitimate FOURTH silencer turned it red. It now asserts each
> silencer separately — removing any is still red, adding one is allowed.

---

> Previous: **2026-09-08** — **ROUND 44: THE CITY FUNDS THE SKILL TREE (ADR-084).**
> Order: *"tôi kiếm được gì, và tôi tiêu nó vào đâu?"* · *"360 thứ không thưởng gì thì tệ hơn 20 thứ
> thưởng thật."* Everything on `main`, on top of round 42 (layout) which landed while round 43 ran.
>
> ### The five numbers that decided the round
> Tree = **138 SP** for all 36 skills · SP arrived at **~86 sessions each** (6.000 XP/level against a
> measured median ~35 XP/session) · a real **617-session save had 2 unspent SP and 4/36 skills** ·
> the other SP source (weekly chain) sat behind a tab that does not exist on desktop · and **360
> badges paid nothing at all**. The one thing worth buying could not be earned; the thing that could
> be earned endlessly bought nothing.
>
> ### Done
> 1. **A finished building pays 1 SP** — `engine/skillPointEconomy.js`. The rate is DERIVED, not
>    chosen for feel: 75 buildings × 1 + ~50 from the weekly chain + ~14 from levels = **~139 SP
>    against a tree costing 138**, so the tree finishes as the city finishes and all three sources
>    still matter. 2 SP/building would have covered the tree from the city alone. **~5,6 sessions per
>    SP, down from ~86.**
> 2. **It is a LEDGER, not an event.** `settleCitySP` compares what the city has EARNED against what
>    `player.spFromCity` says it has PAID. ⚠️ That shape is the whole point: it pays an existing save
>    RETROACTIVELY with no migration (38 buildings ⇒ 38 points on first load), it cannot double-pay
>    so it is safe to settle on hydration AND after every session, and it self-heals after a rejected
>    CAS write instead of losing a point forever. It NEVER subtracts — a city can shrink (a cloud
>    pull from a device that is behind) and clawing back spent points is unforgivable. It rides
>    through Thăng Hoa, because prestige does not reset the city and a reset ledger would turn
>    prestige into an SP printer.
> 3. **Đàm's save now opens with 40 points and 12 skills unlockable** (was 2 and 8).
> 4. **The 360-badge system is DELETED — #103 closed.** Adding XP to it was measured first and
>    refused: **126.030 XP ≈ 21 cấp ≈ 42 SP** over the game against a 138 SP tree, i.e. a second
>    faucet big enough to dissolve the one-currency rule. Gone: the data + two tier tables, three
>    engine modules, five components, the toast source, the localStorage "seen" bookkeeping, the
>    persisted `achievements` slice, and the sub-tab (now **"Di vật"** — relics still buff, so they
>    keep their job). ⚠️ `resolveTabTarget` translates the old `achievements` id on purpose: saved
>    notifications in Đàm's localStorage still carry it and would otherwise be dead buttons.
> 5. **The weekly chain finally says it pays SP.** It always had (1–2 per chain) and the screen only
>    ever printed `+328`, an unlabelled XP number.
> 6. **Two "lên cấp để tích thêm" captions removed** — at ~171 sessions per level that sentence
>    pointed at the longest road on the board. They now point at the building being built.
>
> ### The trap worth remembering
> A `/* … */` comment placed right after the `{` of an object literal turned `journeyWiring.test.js`
> RED in a different file: its JSX-comment stripper `\{\s*\/\*[\s\S]*?\*\/\s*\}` backtracked past the
> intended end and ate hundreds of lines of real code before the assertions ran. Use `//` there.
>
> ### Nghiệm thu bằng mắt — đã đóng nốt
> Thẻ «Thành phố trả công · +1 SP» ĐÃ CHỤP ĐƯỢC (`.city-preview/r44/after-loot-citySP-390.png`):
> 🧱 · "+1 SP" · "chọn một kỹ năng · 40 điểm trong tay" · ba kỹ năng bấm được · "để sau — điểm vẫn
> giữ". Báo cáo vòng 44 gửi đi khi chưa có tấm này; nay có, và luật vòng 41 được giữ trọn.
> ⚠️ **CÁCH CHỤP MỘT THẺ KHÔNG PHẢI THẺ ĐẦU**: `--ask` được `evaluate` với `awaitPromise: true`, nên
> nó nhận một async IIFE vừa `click()` vừa `await` — và phải bấm ĐÚNG `[role="dialog"]`, không phải
> `elementFromPoint(x,y)`. Tay cầm nhịp nằm ở GỐC lớp phủ (`onClick={holding ? undefined : next}`);
> bấm theo toạ độ thì trúng một phần tử con và bị đọc là "đóng", lớp phủ biến mất và ta chụp đúng
> màn hình phía sau nó. Ba lần thử đã cháy vì chuyện đó. Thẻ nào bấm mà KHÔNG đổi là thẻ HOLD —
> đó là chỗ đặt máy ảnh. Ví dụ đầy đủ nằm ở đầu `--ask` trong `scripts/shot.mjs`.
>
> ### Gates
> lint ✅ · build ✅ · `npm run test:quiet` — see the run recorded with the commit.
> ⚠️ Two floors were LOWERED, and both only because a system was deleted: glyph coverage 513 → 139
> and toast density 5 → 4. Lowering either for any other reason is muting the alarm.

---

> Previous: **2026-09-08** — **ROUND 43: ONE DESTINATION, AND EVERY DISTANCE IN SESSIONS (ADR-082).**
> Order: *"tôi đang tiến tới cái gì, và vì sao tôi nên quan tâm"* · *"một đơn vị mà tôi không làm gì
> được với nó thì nó không phải tiền tệ, nó là tiếng ồn."*
> Everything on `main`. Round 42 (layout and space) was UNMERGED while this ran, so nothing here
> moves, resizes or re-spaces anything — every change is text inside an element that already existed.
>
> ### The audit that decided the round
> Twelve units of progress were found, not the eight Đàm counted. Column three — *what can he DO with
> it?* — is empty for six of them: EP, level, era, rank title, day streak, and the 360 badges.
> Only TWO are spendable: SP (skill tree) and the bricks that become a building. And **not one of the
> twelve ever ends**, which is why none of them could answer "where am I going".
>
> ### Done
> 1. **The destination** — `engine/journey.js` (pure): 15 eras x 5 blueprints = **75 buildings**, and
>    then the city is finished. The denominator is SUMMED from `BLUEPRINT_CATALOG`, never typed, so a
>    16th era moves the destination by itself (`journey.test.js` goes red on a literal). No ninth unit:
>    the numerator is `summarizeMuseum().builtTotal`, the same bricks already counted one cell away.
>    `hooks/useJourney.js` is the ONLY seam between that pure module and the store.
> 2. **The top rail stops printing EP** — on every tab, and in the Focus postcard's caption. It says
>    the distance in SESSIONS while that estimate is honest, and falls through to `38/75 công trình`
>    when it is not. ⚠️ It never falls back to EP: `describeStageCountdown` has an EP-phrased branch
>    for the no-sample case, and `describeRailProgress` drops it. Removing that guard is a RED test.
> 3. **`Cư dân 28` → `Thành phố 38/75 · còn 37`** in the city's four-cell stat grid. Residents were
>    derived, unspendable and unaimable — the only decorative cell of the four. They did not leave the
>    app: they still walk the streets in the picture directly above the cell.
> 4. **Distances that changed unit** — rank card `✓ 3.955 / 672` → `✓ Đã đủ` (a met condition printed
>    as a fraction bigger than its own denominator read like a bug); badge thresholds ≥120 minutes say
>    `còn ~27 giờ` instead of `còn 1.627 phút`; weekly chain `+328` → `+328 XP` with `≈ 6 phiên` under
>    it; daily mission rows now carry a unit at all.
> 5. **The level countdown is silent past the reach ceiling.** Converting it to sessions is what made
>    the ladder legible — and it said *"còn ~155 phiên"* (6.000 XP/level against a measured median of
>    ~35 XP/session). `STAGE_COUNTDOWN_MAX_SESSIONS` exists to refuse that number, so the line hides.
>    SP is not the bottleneck anyway: the 617-session save has 2 unspent points and 8 affordable skills.
> 6. **A close names the destination, an open never does** — `describeDayClose`/`describeWeekClose`
>    take a `journeyLine`. A total is a reward when he is looking back and a demand when he is starting.
>
> ### Decided and NOT done, with the number
> **XP for achievements — rejected.** 360 badges grant nothing; that is the emptiest third column in
> the app. Tier-scaled XP would have filled it with an existing unit, and the cost was measured first:
> bronze 64 · silver 87 · gold 89 · platinum 61 · diamond 59, at 60/120/250/500/1.000, is **126.030 XP
> ≈ 21 levels ≈ 42 SP** across the game, against a tree of 36 skills. A second XP faucet that large
> dissolves the one-currency rule this whole round enforces. Left open in `TECH_DEBT.md`.
>
> ### The finding worth keeping
> `describeStageCountdown` — the EP→sessions converter, written with a threshold, a silence rule and
> its own tests — had been reachable from exactly ONE screen since the day it was written, while the
> top rail printed raw EP on every tab all day. **Third time** this project has shipped a finished
> engine function nobody called (`summarizeMuseum` was the first two). `components/journeyWiring.test.js`
> now reads the call sites: an engine test proves a function RUNS, never that anyone CALLS it.
>
> ### Gates
> lint ✅ · build ✅ · `npm run test:quiet` **1.652 tests · 1.651 pass · 0 fail · skipped 1** ✅
> Shots at 390px: before/after of Thành Phố · Tiến trình · Hành trang · Tập trung, in `.city-preview/`.

---

> Previous: **2026-09-08** — **ROUND 42: SPACE — ONE NUMBER FOR A SHAPE, ONE AXIS FOR A STACK (ADR-083).**
> Order: *"Build lớn. Simplify mạnh… Tập trung nhiều hơn vào UX/UI. VÒNG 42 = KHÔNG GIAN. TOÀN QUYỀN."*
> Reported with three photographs of a real session. Round 41 (TIME) ran in parallel on its own branch.
>
> ### The bug, in one paragraph
> Round 39 put the session goal UNDER the ring. The ring was DRAWN at `min(canvas, cap) × transform: scale()`
> and the room under it RESERVED from a SECOND expression, `min(canvas × scale + pad, cap)`. A transform does
> not change layout, so once the cap bit, the drawing was bigger than the hole. **390 px, full screen: 427
> drawn, 281 reserved, the goal line 32 px INSIDE the arc.** Separately, the stage is a FRAGMENT of stacked
> blocks and desktop full screen mounted it into a ROW flex — so at 1280/2000 the same line flew to the ring's
> right edge and landed on the digits. Nine constants described that one circle; a test pinned that two of them
> shared a cap and stayed green through all of it, because it guarded the cap and not the multiplication after.
>
> ### Done
> 1. **`focus/ringMetrics.js`** is the ONE owner of the ring's geometry. `ringSizeCss()` → one CSS length for
>    `width`; `aspect-ratio: 1` gives the height. Three terms: a px ceiling · **94 %** of the column · `calc(100svh
>    − min(<reserve>px, <reserve>svh))`. The slot around the ring has NO height of its own, so what is reserved
>    IS what is drawn. Nine constants and the scaling wrapper deleted.
> 2. **Text inside the disc is a fraction of the ring** (`cqw`, `container-type: inline-size`), replacing eleven
>    rem values across four breakpoints. Label · clock · subline · the two stopwatch lines.
> 3. **`timerStageContent` carries its own column** and is the only place `timerStageVisual` is mounted; the
>    desktop full-screen docked-button branch is gone. No caller can pick the axis any more.
> 4. **One screen while a timer owns it.** Full screen `h-[100svh] overflow-hidden`; the 890 px session notebook
>    became a disclosure, closed by default. `min-h-[76/84/88vh]` only while idle. Card padding halves while
>    running. City postcard `h-[min(168px,20svh)]`.
> 5. **The gate (Việc 3): `focus/ringText.test.js`.** Glyph advance solved from ONE browser measurement of round
>    39 and predicting two others within 1 px. Proves 25 % clearance for every clock string at every ring size
>    160–720 px, that the clearance RATIO is identical at every size, label/subline against their own chord, the
>    four frames × three contexts fitting one screen — and **goes red** on a 10-character clock.
> 6. **Việc 4 — the collapsed sidebar** keeps its 144 px saving but not its silence: labels under every icon
>    (wrapped, never truncated), and `attentionTabIds` (a Set) → `attentionByTab` (id → «Có việc» / «Tuần mới»).
>
> ### Measured (probe, `shot.mjs`)
> | | before | after |
> |---|---|---|
> | goal line vs ring (390 FS · 375 FS · 1280 FS) | −32 · −36 · −423 px (on the arc) | **+12 px** everywhere |
> | vertical scroll, running/break/full screen, 4 frames | 355 · 251 · 999 · 1038 · 1062 px | **0 in every cell** |
> | ring reserved vs ring drawn | 281 vs 427 | **equal in every cell** |
> | ring off the viewport edge (390 FS) | 19 px each side | **0** |
> | horizontal scroll, 6 screens × 4 frames | 0 | **0** |
> | Table 1 while running (indicators · numbers · colours · cut) | 1 · 2 · 3 · 0 | **1 · 2 · 3 · 0** |
>
> ### Not done / found, not fixed
> - **375×667 idle still scrolls** (1 471 px) — by design: the goal card, the day's missions and the Coach live
>   below the fold. «Bắt đầu phiên» ends at y=728 against a tab bar at y=774.
> - **Thống kê at 1280** has a decorative `pointer-events-none … inset-x-[-6%] -z-10` band 9 px past the viewport;
>   it is clipped, causes no scroll, and is deliberate bleed. Left alone.
> - The reward-card rhythm and the session-end moment belong to **round 41** (time); its airy full-screen layout
>   was checked (no cut text, no overlap, no horizontal scroll) and not restyled.
>
> ### Gate
> `npm run lint` clean · `npm run build` green · `npm run test:quiet` **1 633 tests, 1 632 pass, 1 skipped**
> (+10 from round 40: 8 new in `ringText.test.js`, `timerFold.test.js` rewritten around the new invariant).

---

> Previous: **2026-09-08** — **ROUND 41: THE LONG RHYTHMS, AND A TOOL THAT CAN SEE (ADR-081).**
> Order: *"Ba lần liên tiếp có thứ không nghiệm thu được là đủ rồi … Chữa cái công cụ, đừng chữa từng ca."*
> Everything on `main`. Round 39's counts and round 40's seven moments are untouched.
>
> ### Done
> 0. **The tool** — `shot.mjs --dilate <rate>` patches `performance.now()` and the rAF timestamp in the
>    page (before the bundle) and sets the WAAPI playback rate to match. ⚠️ THE FINDING OF THIS ROUND:
>    one framer animation runs on TWO clocks — `opacity` on WAAPI, `x/y/scale` on framer's own rAF loop.
>    Slowing one gave a photograph that LIED (particles halfway along their path with opacity already 0),
>    which is exactly what round 40 read as "cannot be photographed". `--frames n --frame-gap ms` for a
>    filmstrip; `--city2d` keeps the main thread free; `--ask <js>` asks the page a question.
> 1. **The burst, redrawn after seeing it** — `--accent2` is a smudge on the dark canvas (a third of the
>    confetti was invisible) and a full circle threw half of it through the headline. Two colours now,
>    upward fan −165°…−15°, gravity arc, varied shards. Both lessons locked in `rewardBurst.test.js`.
> 2. **Day and week arcs** — `engine/dayArc.js` (pure: `describeDayOpen` · `describeDayClose` ·
>    `describeWeekOpen` · `describeWeekClose` · `pickArcMoment`) + `focus/DayMoment.jsx` (7 s banner,
>    tap to dismiss, stamps in `localStorage`, silent while any timer runs or the reward chain is up).
> 3. **Two new surprises at two new beats** — «Guồng vàng» mid-session (hash of day + sessions done
>    today, so the screen and `assembleSessionReward` agree with no state passed; +15 % XP, chip in the
>    ending) and «Thợ đêm» at a day's open (`rollNightBuilder`, ~16 %, one brick, never the last one).
> 4. **Beats at every length** — `MAX_GAP_SECONDS = 15 min`, gaps filled evenly («Vẫn trong guồng» /
>    «Cứ nghỉ tiếp»); a 25-minute session keeps exactly the four beats of ADR-080.
> 5. **Round-40 questions decided** — no task name in «Đoạn cuối»; the ripple stays (the photographs
>    settle it); no lucky brick on 2-session projects.
>
> ### Gates
> lint clean · build green · `npm run test:fast` 1,637 tests · 1,636 pass · 0 fail · 1 skipped (`# skipped 1`).
>
> ### Lessons
> - **"The DOM has it" is not "the screen shows it".** A field, an element, a particle count — none of
>   them is evidence about pixels. Three rounds died on this; the fix was one flag, not three excuses.
> - **One animation, two clocks.** Before slowing anything down, ask WHICH clock drives it — and check
>   that every property of the same animation answers the same way.
> - **A screenshot tool that waits for the DOM to go still can never photograph a moment.** `--watch`
>   plus a snap path that skips every probe between the hit and the shutter is the whole trick.

> Last update: **2026-09-08** — **ROUND 40: THINGS THAT HAPPEN AND VANISH (ADR-080).**
> Order: *"Build lớn. Simplify mạnh. Làm game vui hơn và đầy dopamine hơn … Ngân sách thứ đứng yên: 0.
> TOÀN QUYỀN."* Five jobs + the gate; everything on `main`. Round 39's counts are untouched.
>
> ### Done
> 1. **Session beats** — `engine/sessionBeats.js` (pure: `planSessionBeats` · `planBreakBeats` · `resolveBeat` ·
>    `sessionPhaseGlyph`), `focus/BeatRipple.jsx`; PomodoroEngine whispers the beat in the ring label
>    (`useRewardMotion`, arc colour, no digit) and mounts the ripple keyed by beat id; the glow warms with
>    `progressPct`; `useTimer` puts the phase glyph in the tab title; the break title reads ☕ / ⏰.
> 2. **Break beats** — same machinery on `breakTotalSeconds − breakSecondsLeft`, colour `--good`.
> 3. **Tiered ending** — `shared/RewardBurst.jsx` (brick · building · rare; particles through
>    `useCustomMotion` inside child components so hook counts stay fixed; deterministic pattern);
>    `BrickRow` new bricks DROP (`useCustomMotion` keyframes, staggered); `SessionRewardStory` mounts the
>    rare burst behind rare cards and the brick/building burst behind the project glyph.
> 4. **Lucky brick** — `rollLuckyBrick` (+ constants), rolled in `assembleSessionReward` after the perk
>    advance with the injected `random`, skipped when a building just finished; `describeSessionBrick`
>    reads `luckyBrickId` (headline «Gạch đôi — hôm nay may!», two fresh bricks, `lucky` flag);
>    `buildProjectCard` passes it; the card shows a 🍀 chip. Preview scenes `loot-lucky` / `loot-built`
>    use `QUEUE_HEAD`, resolved in `buildPreviewUi(scene, state)`; `shot.mjs --card <id>`.
> 5. **Leftovers** — `rewardTiers.js` colours muted · accent2 · accent · ink; `EraSwitcher` wraps
>    (scroll effect deleted, `cityRenderers.test.js` rewritten); era colours on the City tab kept
>    (decision in ADR-080); clock subline unchanged.
>
> ### Gates
> lint clean · build green · `npm run test:fast` 1,623 tests · 1,622 pass · 0 fail · 1 skipped (`# skipped 1`).
>
> ### Lessons
> - **A line printed with `cut -c1-170` is not the file.** Two edit anchors failed on a trailing
>   `aria-hidden="true"` the cut had hidden. Print the exact lines (`cat -A`) before anchoring.
> - **Preview scenes must stay plain data**: a scene as a function skipped every fidelity test
>   silently (`patch.pendingReward` undefined ⇒ `continue`). A placeholder resolved at apply time
>   keeps the scenes checkable.
> - **Hooks in a `.map` are not allowed, and a particle count that follows a prop changes the hook
>   count** — one child component per particle is the honest shape.

---

> Last update: **2026-09-07** — **ROUND 39: WHILE A TIMER RUNS, THE FOCUS SCREEN IS THE TIMER (ADR-079).**
> Order: *"Một chủ đề duy nhất: DỌN GIAO DIỆN MÀN TẬP TRUNG. Không thêm tính năng. Không tách file.
> Không đóng nợ kỹ thuật … TOÀN QUYỀN."* Six jobs, one theme; everything on `main`.
>
> ### Done
> 1. **One indicator while running** — the daily-goal ring is deleted (`GOAL_RING_*`, its motion, the
>    `--warn` circle); the brick strip is one headline («Đang xây X»; `describeSessionBrick` keeps the
>    numbers in `sub`); the postcard is `quiet` while any timer runs (no caption, scrims or era bar);
>    the «Giải lao dài» pill is gone; `pickFocusMoment` returns null while any timer runs.
> 2. **One line under the clock** — `describeClockSubline` (`engine/timerSession.js`): «Phiên thứ N hôm
>    nay» / «Xong N phiên hôm nay», ≤ 22 chars (the disc's chord at 390 px); the goal fraction moved to
>    the idle postcard caption (`goalLine`, in the goal's own unit).
> 3. **Goal + break line under the ring** (`PomodoroEngine.jsx`, right after the ring container) —
>    inside the disc they crossed the stroke at 390 px.
> 4. **Three colours** — the number is `--good` on a break, `--ink` otherwise; the glow is `color-mix` of
>    the arc's token; 72 palette classes in `PomodoroEngine.jsx` + `focus/*` became tokens (75 identical
>    light/dark ternaries collapsed); Coach `GOLD` → `COACH_COLOR = var(--accent)`.
> 5. **Quiet chrome** — `anyTimerRunning` (`App.jsx`) gates the desktop right column, the phone missions
>    + Coach cards, the top rail, the streak card and the voice line — focus AND break.
> 6. **Truncation sweep** — 20 `truncate` sites wrap now; the greeting has no clamp; the weekly line is
>    shorter; the tab bar keeps 3 (commented as a safety net). Sweep of Hành trang · Thống kê · Cài đặt
>    · Thành Phố · the ending card at 390/1280: no cut text. Logged, not fixed: the City tab's per-era
>    colours and its era-chip scroller (report §10).
>
> ### Hidden while a timer runs (nothing deleted — all of it returns when the timer stops)
> daily-goal ring · brick row + percent · era bar + greeting on the postcard · voice line · desktop
> right column · phone missions + Coach cards · top rail (now on breaks too) · streak card · «Giải lao
> dài» pill · red last-10-s flash · blue break number.
>
> ### Gates
> lint clean · build green · `npm run test:fast` 1,605 tests · 1,604 pass · 0 fail · 1 skipped (`# skipped 1`).
>
> ### Lessons
> - **A line inside a ring must fit the CHORD, not the diameter**: at 390 px the disc's chord under the
>   number is ~155 px and ~96 px one line lower — "Chưa xong phiên nào hôm nay" and every real goal
>   crossed the stroke. Copy has a geometric budget; `timerSession.test.js` pins it.
> - **`lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'` is a smell**: the token was already right
>   for both themes — 75 such ternaries collapsed to one literal after recolouring.
> - A multi-file edit script that writes only at the end leaves a clean tree when an anchor fails —
>   `git status` said so; two anchors (a comment gap, a missing `= {}`) cost two reruns and no damage.
>

---

> Last update: **2026-09-07** — **ROUND 38: THE CITY LIVES ON THE FOCUS SCREEN (ADR-078).**
> Order: *"Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào UX/UI. Thôi dọn, bắt
> đầu xây. TOÀN QUYỀN."* Six streams + a new report law (A for Đàm first, B for the advisor after).
>
> ### Done
> 0. **Round 37's 12 % closed.** `engine/soundEngine.cues.test.js`: a stub AudioContext records the
>    oscillators; start · last minute · brick · finish · break-over are pairwise different and never
>    silent in all four packs; the start cue is scheduled inside the tap (iOS autoplay); **no haptic
>    code exists on purpose** — iOS Safari has no Vibration API, and a test goes red if one appears.
> 1. **The city postcard** (`focus/CityPostcard.jsx`, `focus/cityPostcard.js`, `shared/EraStageBar.jsx`).
>    The ghost backdrop (50 % opacity under a 92 % scrim, frozen on phones, absent at 0 buildings) is
>    gone; the same `CityStage` is framed at full opacity as the first block of Focus — still while a
>    session runs, alive when idle, camera on this session's scaffold (a phantom one at session 1) or
>    on the building the last session finished (`ui.postcardFocusBpId`). Paid for: streak card under
>    the timer (`belowTimer`), era bar in the caption, greeting on the sky. Start at 390 px: bottom
>    edge 759 → ~700 px (tab bar at 774).
> 2. **«Đổi công trình»** on the brick strip: queued projects first (bricks kept), then cheapest
>    fresh blueprints; full queue evicts the last untouched item, never a brick. Engine
>    `chooseSessionProject`/`listSessionProjectChoices`, store `setSessionProject`. Verified by
>    clicking through the shot tool: strip, postcard camera and queue all follow.
> 3. **`assembleSessionReward`** (`engine/sessionRewards.js`, 772 lines, pure, 5 behaviour tests):
>    the ~710-line body moved verbatim with `now`/`today`/`weekKey`/`dailyGoal`/`random` as
>    parameters; ten helper clusters (≈1,180 lines) moved to `engine/` verbatim; `gameStore.js`
>    **4,677 → 2,879**. Hand-copied formula found: the streak bonus in `todayHero.js` → `streakBonusRate`.
> 4. **§9 settled**: `COACH_BUCKET_MIN_SAMPLE` 4 → 3 in ONE definition (it existed twice); the #86 gate
>    is ESLint `no-restricted-syntax` on palette classes and hex/rgb literals in a button's style
>    (57 + 43 hits recoloured to tokens; Settings 5 · Journal 5 · Notification Center 1 action buttons
>    through `ActionButton`). Only the door and pure white are exempt.
> 5. **Ledger 33–37**: ≈20 visible things removed, ≈10 added → **thinner**; the free effort of this
>    round therefore went to adding (postcard, switch, control polish).
>
> ### Gates
> lint clean · build green · `npm run test:fast` 1,602 tests · 1,601 pass · 0 fail · 1 skipped (`# skipped 1`).
>
> ### Lessons
> - **The sandbox's software GL trips the FPS watchdog in ~3 s** and both the postcard and the City
>   tab fall back to 2D — the first postcard shot showed the 2D grid and looked like a bug. Shoot 3D
>   with `--settle 600`. On real hardware the City tab never falls back, so neither will the postcard.
> - **A gate finds what a sweep misses**: round 37 "recoloured Settings by token", yet the inline
>   `style` branch still carried hex colours; the second selector (style literals) found 43 more.
> - **Moving 1,800 lines verbatim is safe only with `no-undef` + `no-unused-vars` as the map**: comment
>   words (`persist`, `getVietnamHour`) became imports until lint said which were dead.
> - The `--click` matcher uses the button's full text (`🔥Bếp Lửa Cổ Đại2 phiên`), not the label.
>
> ### Foreign commits carried to `main`
> Two from another session landed on `origin/main` during this round and are merged in unaltered:
> `ef8b245` (self-healing rotation: `doc-budget.mjs --rotate`, 16 guard tests, the "build, don't audit"
> rule in `CLAUDE.md`) and its merge commit `ca4958a`. Conflicts were docs-only (this file, `CHANGELOG.md`),
> resolved by keeping both entries — round 38 first, the addendum right below.
>
>
---

> Last update: **2026-09-07** — **THE GATES HEAL THEMSELVES; BUILD, DON'T AUDIT (ADR-076 addendum).**
>
> Đàm's requirement: *"nếu file phình to thì cũng tự biết giải quyết"*. A red rotation gate used to
> leave the HOW to the next session. Now `node scripts/doc-budget.mjs --rotate <file>` (or
> `--rotate-all`) moves a log's oldest entries VERBATIM into a fresh dated `docs/archive/` file and
> leaves a title index where they were; the gate's error message names that exact command.
> `TECH_DEBT.md` moves only entries whose own title says closed and refuses to guess about open ones.
> Proven end-to-end on a padded `BAN_GIAO.md`: 126,731 → 59,883 chars, 12 = 11 + 1, green.
> Two bugs caught by the dry run first: rotating under-limit files, and treating "PHẦN LỚN ĐÃ XỬ LÝ"
> as closed. Three planner unit tests pin the contract (lossless split · newest stays · partial never
> moves).
>
> New operating rule in `CLAUDE.md` §TOKEN BUDGET #4 — **build, don't audit**: `npm test` green means
> the doc system is healthy; do not re-measure or re-survey it before the task in the prompt.

> Last update: **2026-09-06 (night, fifth pass)** — **GOVERNANCE NOW RUNS ON DISCOVERY (ADR-076).**
>
> Đàm asked the right question: *what about the files later work creates — will it just grow back?*
> It would have. Every guard from ADR-075 read a **hand-written list**, so a document nobody
> registered was invisible to all of them. Proof arrived immediately: **three archives created that
> same day** (183,626 · 223,614 · 246,133 chars) were already outside the list.
>
> Fixed at the root: `discoverDocs()` walks the tree and `classify()` assigns a class from the PATH —
> `docs/archive/**` = archive · the four auto-loaded files = autoloaded · append-only logs = journal ·
> **everything else = active**. A file that does not exist yet already lands in "active", so it is
> governed the moment it is created. Nothing to register, nothing to remember.
> Rotation also grew from 2 files to 4: `TECH_DEBT.md` (120,000) and `ARCHITECTURE_DECISIONS.md`
> (250,000) are append-only too — new debts and new ADRs arrive every session.
>
> **Break-tested**: a brand-new `docs/FUTURE_THING.md` of 900,000 chars turns the ceiling gate red by
> name although no list mentions it; padding `TECH_DEBT.md` past its limit turns rotation red.

---

## 📚 Rotated 2026-09-09 → [`docs/archive/BAN_GIAO_2026-09-09.md`](docs/archive/BAN_GIAO_2026-09-09.md)

12 entries moved verbatim (ADR-076); nothing deleted. Find one: `grep -n '<title>' docs/archive/BAN_GIAO_2026-09-09.md`.

<details><summary>Titles</summary>

- Last update: **2026-09-06 (late night)** — **ROUND 37: A SESSION ALWAYS LAYS A BRICK (ADR-077).**
- Last update: **2026-09-06 (night, fourth pass)** — **STARTUP CONTEXT DOWN TO 8,606 TOKENS.**
- Last update: **2026-09-06 (night, third pass)** — **TECH_DEBT SPLIT BY SUBSYSTEM (ADR-075).**
- Last update: **2026-09-06 (night, second pass)** — **JOURNAL ROTATION ENFORCED (ADR-075).**
- Last update: **2026-09-06 (night)** — **RETRIEVAL ARCHITECTURE: FREEZE CLOSED KNOWLEDGE, CAP EVERY
- Cập nhật lần cuối: **2026-09-06 (tối, cùng phiên "tối ưu context window")** — **TÀI LIỆU TỰ-NẠP
- Cập nhật lần cuối: **2026-09-06 (chiều, phiên "tối ưu context window")** — **NGÂN SÁCH TOKEN CHO
- Cập nhật lần cuối: **2026-09-06 (cùng ngày, phiên khác)** — **SỬA GỐC: MENU BAR MAC MẤT ĐẾM
- Cập nhật lần cuối: **2026-09-06 (vòng 36)** — **THỐNG KÊ TRẢ LỜI, KHÔNG TRÌNH BÀY; ĐÓNG #99
- Cập nhật lần cuối: **2026-09-06 (vòng 34)** — **ĐỒNG TIỀN DUY NHẤT LÀ PHIÊN (ADR-069).** Lệnh Đàm:
- Cập nhật lần cuối: **2026-09-05 (vòng 33)** — **CÁCH MẠNG VÒNG LẶP CHÍNH (ADR-068).** Lệnh Đàm:
- Cập nhật lần cuối: **2026-09-05** — **MỘT LỖI THẬT Ở THANH NHIỆM VỤ, TÌM RA BẰNG CÁCH ĐỌC MỘT

</details>

---

## ✅ Đã làm (xong, đa số đã deploy)
- **AI Coach = CHỈ GEMINI (đám mây)** (2026-06-24, Đàm: "bỏ Qwen, chỉ còn Gemini"): mọi phản hồi do Gemini sinh; ĐÃ GỠ HẲN Qwen2.5-3B + WebLLM + dep `@mlc-ai/web-llm`. **CHẠY CẢ iPhone**, app nhẹ hơn, không tốn RAM/đĩa. Đánh đổi: mất mạng/hết quota/chưa-có-key → Coach ngừng (báo lỗi + Thử lại), không còn dự phòng on-device. Cổng `api/coach.js` (giữ `GEMINI_API_KEY`, flash→flash-lite, tắt thinking) + `cloudEngine.js`. 2 lối vào (Hỏi Coach + AI phân tích tổng thể) dùng CHUNG "bộ não đã đào tạo" model-agnostic: prompt + lưới chống-bịa + tầng SỐ LIỆU (`gameMath`/`coachIntel`/`buildAnalystContext`) + gợi ý (`coachSuggest`). **`GEMINI_API_KEY` đã ở Vercel env + ĐÃ BẬT BILLING (paid tier, 2026-06-24) → hết 429, chạy ổn định** trên `gemini-2.5-flash`. Đã GỠ trước đó: ⚡Nhanh, Hỏi Claude (Anthropic), MiniLM, giọng cảm xúc.
- **Cộng Hưởng**: nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu, có chặn lạm phát.
- **Focus Intelligence (tầng số liệu)**: hồ sơ + dự đoán "giờ vàng" + khuyến nghị — giờ là NGUỒN SỐ cho Qwen đọc (không tự hiển thị nữa).
- **Web Push iPhone**: đã làm xong & deploy.
- **Giao diện Thụy Sĩ** + bộ icon tự vẽ thay emoji.
- **Đồng bộ Supabase** (game_state + timer_live cho menu bar Mac).

## 🔧 Đang làm
- **THÀNH PHỐ 3D** (kế hoạch Đàm duyệt 2026-08-12, mở rộng từ `SPEC V2 Thành Phố 3D`).
  Phase 1, 2, 3-2D, 3A, **3B-1/3B-2/3B-3 đã xong & push**. ✅ Cổng hiệu năng đã qua (Đàm quyết).
  - Đã đạt sẵn (đo được trên máy build): chunk `vendor-three` = **130,66 KB gzip** ≤ ngưỡng 135;
    chunk chính không to thêm; three KHÔNG bị precache nhưng vẫn chạy offline.
  - **Đàm yêu cầu tiếp** (nguyên văn): *"tối ưu hình ảnh và cộng đồng cư dân, hãy cố gắng làm đẹp
    như các bức tranh phục hưng, nhiều animation lên và nhiều hiệu ứng hơn, đem nó ra trang chủ
    hoặc làm cái gì đó đột phá hơn nữa"*. Chia thành: **3B** hình khối + cư dân (XONG) · **3C**
    ánh sáng/màu Phục Hưng · **3D** hiệu ứng sống động · **3F** đem thành phố ra trang chủ.
  - Lưới an toàn KHÔNG được gỡ dù đã qua cổng: watchdog FPS, ba cửa lùi 2D, trần 30 khung/giây.

## ✅ NÂNG CẤP TRÍ TUỆ AI COACH — chuỗi 6 mảng (2026-06-25, code XONG hết; mảng 6 MỚI THỰC SỰ LÊN PRODUCTION 2026-07-11)
> Đàm ra lệnh "làm toàn bộ, chuyên sâu" sau workflow đề-xuất 10 agent. Cả 6 mảng test xanh, code đã commit đủ.
1. **Siết niềm tin ✅** — nhiệt độ 0.3→0.2/0.8, bộ chấm điểm chống-bịa (`coachEval`), timeout 28s + `vercel.json` maxDuration, CoachOffline viết-lại-có-hướng-dẫn, dọn chữ Qwen cũ.
2. **Tín hiệu "phiên trơn vs ngắt quãng" ✅** — `getInterruptionPattern` đọc `pauseSegments` (chiều chất lượng trước bị bỏ phí) + chip `flow`.
3. **Coach tự nhắc sau mỗi phiên ✅** — `CoachNudge.jsx` (in-app, chủ động, bám số phiên vừa xong, qua guard).
4. **Model mạnh hơn cho bài 4 phần ✅** — `buildModelChain` tier 'deep' = gemini-2.5-pro (rơi về flash).
5. **Bộ nhớ lời khuyên ✅** — `coachAdviceMemory` (cá nhân hoá: nhớ lời khuyên chỉnh mục tiêu + theo dõi theo thời gian).
6. **Cảnh báo chuỗi sắp đứt qua push ✅ (code) — ⚠️ CHỈ THỰC SỰ CHẠY TỪ 2026-07-11.** Commit `8ee264d` (25/6, thêm `api/coach-digest.js`) **bị Vercel FAIL build** lúc đó (rất có thể cùng nguyên nhân "vượt trần 12 Serverless Functions" — xem mục Vercel Hobby ở `CLAUDE.md`, phát hiện lại khi soát log Deployments ngày 11/7). Vercel giữ nguyên bản deploy trước đó (mảng 5/6) khi build fail → **tính năng này coi như CHƯA TỪNG chạy thật trên production suốt 25/6–11/7** (cron `api/coach-digest` không tồn tại trong bản đang chạy, dù code + tài liệu đã ghi "hoàn tất"). Chỉ thực sự lên production từ deploy `caec62a` (11/7, sau khi fix trần function). Bài học: **build FAIL trên Vercel PHẢI được xác nhận đã hết**, đừng chỉ tin log local/test xanh — kiểm tra tab Deployments thấy "Ready" thật sự.
- ⚠️ **CẦN ĐÀM THỬ TAY** (không test được trên dev): (a) câu nhắc-sau-phiên hiện sau khi xong PHIÊN THẬT; (b) bài "AI phân tích tổng thể" giờ chạy pro — xem có chậm/khác chất lượng không; (c) dòng "Ghi nhớ" lời khuyên hiện sau ≥3 ngày; (d) thông báo chuỗi-sắp-đứt: **từ nay** (11/7) chiều nào quên làm sẽ nhận push (cần đã bật push iPhone) — đây là lần đầu tiên thực sự có cơ hội chạy thật.

## 🔜 Sẽ làm tiếp (ưu tiên từ trên xuống)
- 🔴 **CHỜ ĐÀM — NHÌN ẢNH PHASE 21.** Bản quét 15 kỷ + **12 ảnh nhìn thẳng từ trên xuống** (kỷ
  1 · 3 · 7 · 10 · 11 · 14, mỗi kỷ chụp ở **20 phiên và 120 phiên** để thấy thành phố lan ra),
  `--width 1500`. **Nghiệm thu bằng MẮT, không bằng cổng số**: kỷ 1–9 không được thấy hàng lối nào;
  kỷ 11–15 thì phải thấy. Cổng số chỉ nói được rằng mã làm đúng thứ nó được bảo làm.
- ✅ **ADR-007 — ĐÀM ĐÃ DUYỆT PHƯƠNG ÁN (a)** (khép lại mục "CHỜ ĐÀM QUYẾT" của Phase 20): chấp nhận
  dời 75/75 công trình **MỘT LẦN**, sau đó bố cục mỗi kỷ **đóng băng vĩnh viễn**. Không dựng hai bộ
  sinh song song. ⚠️ **Từ ngày gộp `main`, đổi bộ sinh bố cục của một kỷ là một quyết định DI TRÚ —
  phải hỏi Đàm trước**, vì nó dời công trình trong bản lưu thật. Ghi ở ADR-064.
- ⚠️ **`TECH_DEBT #89` VẪN MỞ dù cổng đã qua (11,33 → 12,44).** Đừng đọc con số ấy là "đã giải":
  tách ba dải cho thấy toàn bộ phần tăng nằm ở dải ĐẤT (+2,37), còn dải TRỜI — cần gạt đã nêu đích
  danh hai lần — gần như không nhúc nhích (4,12 → 4,05) và dải THÀNH PHỐ còn tệ đi. Biên chỉ 0,44.
  Ba hướng của Đàm vẫn còn nguyên.
- ⚠️ **`TECH_DEBT #90` — ĐÃ THU HẸP HAI LẦN, VẪN MỞ.** (a) danh sách kỷ ngắn đi sau khi chia khu
  phố: `[1,2,6,7]` → `[1,7]` (hợp nhất) → **`[5]`** (sau §5), biên mỏng nhất 0,9508 → 0,9386 →
  **0,9942**; (b) ô mất chi tiết mái **7/476 (1,5%) → 10/473 (2,1%)**, kỷ tệ nhất 0,893 → 0,844 —
  tức nửa (b) **XẤU ĐI** ở §5. ⚠️ Cả hai lần chuyển đều là hệ quả của một phép **đổi tỉ lệ loại
  nhà** (thêm ô đường ⇒ đổi ô nào là nhà ⇒ đổi tỉ lệ `workshop`, nguyên mẫu thấp-rộng có tỉ số xấu
  nhất), **không phải** cơ chế được sửa. Bản vá thật vẫn đụng bảng `storey` lịch sử của Phase 14 và
  kỷ 1 vẫn không còn chỗ (1,95 trên trần 2,0, cần 2,05). **Cấm** hạ sàn 0,7 hoặc hạ ngưỡng 0,95 để
  lấy lại con số.
- ⚠️ **`TECH_DEBT #88` (mới, Phase 21 §4) — cột `units`/`cols`/`rows` của bảng khu phố tạm là TRỤC
  CHẾT.** `BLOCK_MAX_CELLS = 1` (thứ chặn khối nhà xuyên qua nhau) khoá số suất đất ở **4 ở cả 15
  kỷ**. Đã đếm ra tường minh bằng một bài test đi qua đúng đường dựng thật, kèm ba phương án đã đo.
  **Không nới trần**: đo được trần 2 thì khối lại xuyên qua nhau.
- ⚠️ **CHỜ ĐÀM — SAU PHASE 13 VIỆC B (vùng phụ cận).** (a) **Nhìn 15 kỷ** rồi gật hoặc chỉnh hướng
  mỹ thuật — ba cổng đo đều đạt rộng, nhưng điều kiện DỪNG (c) của chỉ thị là *"dựng xong, (G1) đạt,
  mà ẢNH XẤU ĐI"*, và chỉ mắt Đàm mới trả lời được câu đó. (b) Quyết **có gộp `main`** hay không cho
  các commit trên nhánh `claude/xay-san-pham-huong-nay-nasr3n`. **KHÔNG tự gộp.**
- ⚠️ **`TECH_DEBT #74` — CHỜ ĐÀM QUYẾT (câu hỏi thiết kế game, cùng họ `#14`).** Vùng phụ cận là
  tầng ĐỊA LÝ nên **2241 vật ở mốc 80 phiên bằng đúng số vật ở mốc 0 phiên** — nó làm thành phố
  trông lớn ngay từ phiên đầu, nhưng nó **không lớn lên theo công sức của Đàm**. Ba hướng (giữ
  nguyên là bối cảnh / cho một phần mở dần theo phiên / trộn) đã ghi ở mục nợ; chưa tự chọn, vì
  chọn sai hướng là làm hỏng vòng lặp phần thưởng chứ không phải làm hỏng một con số.
- ⚠️ **`TECH_DEBT #54` — vùng phụ cận KHÔNG chặn camera cận cảnh.** Kế thừa có chủ ý: bộ hoạch định
  đường bay chỉ biết CÔNG TRÌNH chứ không biết ĐỊA HÌNH, nên chặn cây/ruộng mà không chặn quả đồi
  bên dưới là mua một sự an toàn GIẢ. Xem lại khi nào bộ hoạch định biết đọc cao độ.
- ⚠️ **CHỜ ĐÀM — BA VIỆC SAU BƯỚC C.** (a) **Xem 4 ảnh** `estuary` kỷ 8 · `estuary` kỷ 11 · `canal`
  kỷ 10 · `meander` kỷ 5 rồi gật hoặc chỉnh hướng mỹ thuật. (b) Chạy **một lượt**
  `bash scripts/bench-macbook.sh` trên MacBook để làm mới số liệu (KHÔNG phải cổng, không chặn gì) —
  hộp cát AI chạy SwiftShader nên script tự từ chối ở đó. (c) Quyết **có gộp `main`** hay không cho
  các commit đang nằm ở nhánh `claude/xay-san-pham-huong-nay-nasr3n`. **KHÔNG tự gộp.**
- ⚠️ **`TECH_DEBT #60` — NGỮ PHÁP VEN NƯỚC (cầu · bến · thuyền · kè).** Đây là phương án (c) mà Đàm
  đã CHẤM ĐÚNG VỀ MỸ THUẬT nhưng hoãn lại: *"đổi thứ mang bản sắc sang cầu/bến/thuyền/kè là ĐÚNG về
  mỹ thuật nhưng là cả một phase mới… đừng nhét vào khe hở của Bước C."* Điều kiện xem lại: **khi
  nào có phase chi tiết ven nước**. Nó là thứ chữa được ba kỷ nước hẹp (6 · 7 · 10) mà KHÔNG phải
  nói dối địa lý.
- ⚠️ **`TECH_DEBT #61` — theo dõi, KHÔNG hành động.** Cổng 5% là một *thứ đại diện*, chính Đàm chỉ
  ra. Dữ liệu Bước C **chưa** cho ca nào cổng và mắt bất đồng ⇒ giữ nguyên cổng đã hiệu chuẩn.
- *(ĐÃ XONG, giữ lại để đối chiếu)* **`TECH_DEBT #59` — Đàm chốt hướng (b) ngày 2026-08-20.** Ba kỷ nước hẹp không đạt
  cổng 5% ở **BẤT KỲ** góc nào (kỷ 6 có trần toàn cục 4,44%). Đây là bài toán **BỀ RỘNG trong bảng**,
  không phải bài toán góc — nên `worldYaw` không chữa được, và trải Bước C tới chúng mà chưa chốt là
  tiêu ngân sách cho thứ Đàm gần như không nhìn thấy. Ba hướng đã cân sẵn ở `TECH_DEBT #59`
  (nới bề rộng / chấp nhận + đếm tường minh trong test / đổi thứ mang bản sắc sang cầu-bến-thuyền-kè).
  **Mười một kỷ còn lại KHÔNG bị chặn.**
- *(ĐÃ XONG 2026-08-20, ADR-042 — giữ lại nguyên văn để đối chiếu)* **VIỆC 2 Bước C.** `TECH_DEBT #57` đã ĐÓNG (ADR-041, 2026-08-20):
  camera mặc định nay thật sự nhìn ra nước (kỷ 14: 0,09% → **23,75%** · kỷ 12: 2,30% → **9,32%**),
  nên phần thưởng của Bước C sẽ không còn nằm ngoài khung hình. Bước B đã XONG (ADR-040, 2026-08-19).
  Bước B đã dựng hình nước cho đúng 3 kỷ (14 biển · 12 sông · 1 khô), mọi ràng buộc Đàm ra đều đo
  được và đã đạt: +1 lệnh vẽ CHỈ ở 2 kỷ có nước · kỷ 1 trùng từng byte · 0 nguồn sáng mới · 0 texture
  mới · 0 shader động · 0 lỗ thủng ở bờ. **Bước C = trải nốt 12 kỷ còn lại — ĐÃ LÀM XONG**, xem
  khối 🌊 ở đầu file. (Câu cũ ghi "13 kỷ" là đếm nhầm: 15 − 2 kỷ đã dựng − 1 kỷ khô = **12**.)
  *(Nguyên văn chỉ thị Bước B, giữ lại để đối chiếu:)*
  Ba sửa ấy: kỷ 5 phải CÓ NƯỚC (thêm kiểu thứ sáu `meander` — khúc uốn ôm ba mặt) · kỷ 11 đổi
  `sea` → `estuary` cho khớp `note` · luật hướng bờ nước viết lại thành QUAN HỆ
  (`MAX_SIDE_SPREAD = 2` thay cho mức tuyệt đối 6), cộng phép gác Q2 "nước phải nằm gọn trong địa
  hình". Bước B: dựng hình cho **ĐÚNG 3 kỷ** — **biển kỷ 14** (Singapore, đảo quốc) · **sông kỷ 12**
  (Nga, `width 3,4`, dải rộng nhất bảng) · **khô kỷ 1** (Thổ Nhĩ Kỳ — làm chứng cho ràng buộc cứng:
  kỷ không nước giữ nguyên mốc lệnh vẽ, không đổi một đơn vị) — chụp ảnh trước/sau ở khung mặc định,
  đo chỗ giáp bờ, rồi **DỪNG hỏi tiếp**. Bước C mới trải 12 kỷ còn lại. Ràng buộc Đàm ra: nước tốn
  **tối đa +1 lệnh vẽ và CHỈ ở kỷ có nước**, cập nhật `MOC_LENH_VE` theo TỪNG KỶ, **KHÔNG nâng trần
  chung** · **CẤM** nguồn sáng mới, texture mới, shader nước động (sóng/gợn/phản chiếu động) — nước
  PHẲNG, vật liệu TĨNH; hình học thì thoải mái · **cấm đụng** lưới 12×12, `deriveDwellings`,
  `computeCityLayout` · quan hệ `settingStyle → outskirts` MỘT CHIỀU.
  ⚠️ **Cổng không đo được bằng test** (lời Đàm): *"kỷ có biển phải đọc ra là **thành phố cảng**,
  không phải thành phố cạnh một vũng xanh. Ảnh không đạt câu đó thì phase chưa xong, dù mọi con số
  đều xanh."*

> ⚠️ **CHƯƠNG TRÌNH ĐANG CHẠY (cập nhật 2026-08-20) — "QUY MÔ TRƯỚC, HIỆU ỨNG SAU".** Đàm đảo thứ
> tự vì tôi đã đọc sai yêu cầu của anh: mệnh đề ĐẦU là **quy mô**, mệnh đề HAI là **độ cao**, ánh
> sáng chỉ là mệnh đề BA và *"tô bóng đẹp lên một bố cục sai thì được một bố cục sai được tô bóng
> đẹp"*.
> - **§1 (B) ĐỘ CAO — ✅ XONG** (2026-08-20, ADR-045). Đất trong lưới thôi gợn; ngoài lưới gồ ghề
>   CÓ HƯỚNG; thềm bậc còn ở 14/15 kỷ. ADR-007 vẫn nguyên.
> - **§2 (A) QUY MÔ — ⏳ CHỜ ĐÀM, đã đo xong phần chuẩn bị.** Phải tách hai nghĩa: "to hơn **trong
>   khung hình**" (camera) ≠ "to hơn **so với thế giới**" (tỉ lệ đĩa đất / rặng núi) — **Đàm muốn
>   nghĩa thứ hai**. Cần gạt trùng với `TECH_DEBT #53`, nên hai việc phải quyết CÙNG LÚC. Ba phương
>   án + giá + rủi ro ADR-007 đã ghi ở `TECH_DEBT #53`. **KHÔNG tự sửa bán kính đĩa đất, KHÔNG tự
>   đổi `gridSize`.**
> - **§3 HIỆU ỨNG — chỉ làm SAU (A) và (B).** Thứ tự rẻ-trước: tone mapping/tương phản → khử răng
>   cưa → che khuất môi trường (AO) → bóng mềm → phản chiếu mặt nước. Mỗi thứ MỘT commit, trước/sau
>   đo bằng `sweep-diff.mjs --frame`, ms thật. Trần làm việc **8 ms**. ⚠️ **ĐỪNG HẠ DPR.**
> - **§4 Q1 — chưa làm**: thêm một biến thể "khung mặc định" của cảnh nặng nhất vào
>   `scripts/bench-macbook.sh`.
> - Bộ số M3 vẫn CHƯA có cho các phase gần đây — nhắc Đàm chạy `bash scripts/bench-macbook.sh` khi
>   tiện. **Không** chặn §1 và §2.

> ⚠️ **CHƯƠNG TRÌNH ĐANG CHẠY (2026-08-18)** — Đàm đã duyệt hướng mỹ thuật Bước 1 và ra một
> **chương trình làm việc liên tục** cho giai đoạn "tiêu ngân sách" hiệu năng (dư 3,2 lần trên M3),
> gồm ba phase theo THỨ TỰ CỐ ĐỊNH, với **uỷ quyền tự chạy** giữa các phase:
> **Phase 10 Bước 2 ✅ (tầng trệt đủ 15 kỷ)** → **Phase 11 (MÁI — phase có thu hoạch thị giác lớn
> nhất, vì camera mặc định NHÌN XUỐNG nên mái là bề mặt lớn nhất trong khung hình)** → **Phase 12
> (ĐO tỉ lệ khung hình thành phố chiếm, rồi TRÌNH PHƯƠNG ÁN và DỪNG)**.
> ⚠️ **Ranh giới Đàm đặt — chỉ 6 ca phải dừng hỏi**: (1) **gộp `main` — LUÔN LUÔN hỏi**; (2) cổng
> nghiệm thu trượt 2 lần liên tiếp; (3) muốn đụng file ngoài danh sách cho phép (`src/engine/city3d/*`
> + test + `scripts/*` + tài liệu; **CẤM**: bảng màu · ánh sáng · đường · địa hình · thực vật ·
> camera · store · sync · AI Coach · `api/`); (4) phát hiện điều mâu thuẫn `PERFORMANCE.md`;
> (5) hết bước đo của Phase 12; (6) một quyết định mỹ thuật mà độ tự tin **dưới 80%**.
> ⚠️ **Được tiêu: tam giác · khối · đỉnh. CẤM tiêu: lệnh vẽ mới · vật liệu mới · nguồn sáng mới ·
> texture mới.** Và cấm "tối ưu hiệu năng" — máy còn dư 3,2 lần, mọi lo lắng về hiệu năng phải trả
> lời bằng `PERFORMANCE.md` chứ không bằng cảm giác.

0. **NHÁNH THÀNH PHỐ 3D — thứ tự Đàm đã chốt, KHÔNG được nhảy bước.**
   *Visual Foundation (**7A ✅**) → Terrain/City (**7B: địa hình ✅ · mật độ + khu dân cư CHƯA**) →
   Roads → Historical Architecture → Living City → Pomodoro → Polish.*
   **Việc kế tiếp = "mật độ + khu dân cư"**: thêm nhà dân nhỏ/vừa/lớn, cửa hàng, xưởng, kho, công
   trình phụ, và quy hoạch **ngoại vi → khu dân cư → trung tâm → landmark**. Đây là thứ Đàm phàn nàn
   rõ nhất còn lại — đất vẫn trống nhiều, 5 công trình cho cả một lưới 12×12.
   ⚠️ **Hai việc PHẢI làm TRƯỚC khi thêm nhà**: (a) Đàm đo lại cổng hiệu năng iPhone (`TECH_DEBT #23`)
   — phase này thêm hình học THẬT nên nếu không đo trước sẽ không tách được thủ phạm khi máy nóng;
   (b) Đàm chọn hướng cho `TECH_DEBT #24` (khung hình đang cắt công trình) — thành phố càng dày thì
   phần bị xén càng nhiều, và chỉnh bố cục + chỉnh khung một lần rẻ hơn hai lần.
   ⚠️ **CẬP NHẬT 2026-08-17 — việc (a) nay chỉ còn đúng nửa iPhone.** Nửa **Desktop đã đo và ĐẠT**
   trên MacBook M3 (dư 3,2 lần), và bộ số ấy nói rằng **thêm hình học gần như miễn phí** — 43%
   chênh tam giác chỉ đổi 2,4% thời gian. Tức trên Mac, "thêm nhà" **không còn là việc phải xin
   phép hiệu năng**. Trên iPhone thì vẫn chưa ai đo. **Trước mọi phase mỹ thuật, đọc
   `PERFORMANCE.md`** — nó nói bằng SỐ thứ gì rẻ (hình học), thứ gì đắt (điểm ảnh + ánh sáng), và
   ba thứ tuyệt đối không nên đụng.
1. **Giao diện còn dở**: full-screen iPhone (tai thỏ che mép trên), nút đóng ✕ cho hộp phần thưởng, gom cỡ chữ cho đồng nhất, tắt hiệu ứng cho người nhạy chuyển động.
2. **(Giai đoạn A, gần xong)** Lưới an toàn test: đợt 1 (2026-07-13) phủ `completeFocusSession`/
   `cancelFocusSession`/`syncService`; đợt 2 (2026-07-17) phủ nốt `computeLevelUps`, bảo-toàn-tài-sản
   qua `triggerPrestige`, streak, `unlockSkill`, sync-retry. CÒN THIẾU (nhỏ): các nhánh early-return
   phạt (khủng-hoảng/thăng-cấp thất bại — cần dùng action khởi tạo thật làm builder) + ma trận
   waive-bằng-than-lượng + nhánh safeCancelPerk — xem NOTE trong các file test.
3. **(Tuỳ chọn, không gấp)** Tách nhỏ `gameStore.js`/`completeFocusSession` — hoãn có chủ đích ở đợt
   refactor 2026-07-12 vì rủi ro cao hơn lợi ích; NAY đã có characterization golden-master làm lưới
   an toàn nên rủi ro tách giảm, nhưng vẫn chỉ làm khi thật cần (xem `ARCHITECTURE.md` mục 6).

## ⚠️ Nhớ kỹ (kẻo hỏng)
- **PHÂN LOẠI LỆNH** (Đàm dặn 2026-06-21): **"nghiên cứu/tìm hiểu/đề xuất"** = CHỈ trình bày rồi DỪNG, KHÔNG tự sửa/commit/deploy (câu mơ hồ → coi là nghiên cứu, hỏi trước). **"làm/sửa/thêm/đổi/deploy"** = (1) giải thích ngắn gọn dễ hiểu công dụng TRƯỚC khi sửa → (2) làm → (3) giải thích đã sửa gì + ích gì → (4) TỰ ĐỘNG deploy Vercel (khỏi hỏi lại). Chi tiết: memory `ask-before-acting.md`.
- **Không bấm chạy phiên focus trên bản dev/localhost** — nó dùng chung dữ liệu với bản thật, sẽ ghi đè dữ liệu của Đàm.
- **AI Coach = CHỈ Gemini (đám mây)** (Đàm chốt 2026-06-24): đã gỡ ⚡Nhanh/Claude/MiniLM/briefing-luật/giọng-cảm-xúc + Qwen/WebLLM. ĐỪNG khôi phục trừ khi Đàm yêu cầu. Muốn đổi câu Coach → sửa PROMPT (`COACH_OFFLINE_SYSTEM`/`COACH_CHAT_SYSTEM` ở `src/engine/coach/prompt.js`) hoặc SỐ LIỆU nạp vào (`buildAnalystContext` ở `src/engine/coach/coachContext.js`); đổi model → `DEFAULT_MODEL`/`FALLBACK_MODEL` ở `api/_lib/gemini.js` (hoặc env `GEMINI_MODEL`). *(2026-07-12: `coachPrompt.js` tách thành `prompt.js`+`guard.js`, cả thư mục `src/engine/llm/` dời sang `src/engine/coach/` — xem `PROJECT_STRUCTURE.md`.)*
- **NIỀM TIN = TÀI SẢN QUÝ NHẤT:** lưới chống-bịa tất định (`src/engine/coach/guard.js`) phải chạy TRƯỚC mọi nội dung AI hiện ra / gửi push. Có bộ chấm điểm `src/engine/coach/eval.test.js` (đo BẮT %/BÁO NHẦM %) — sửa guard mà tụt điểm = phải xem lại. Quy tắc vàng: thà SÓT một câu bịa còn hơn BÁO NHẦM xoá oan câu thật (FPR phải = 0).
- Luôn `npm test` trước khi commit; luôn chạy `git status` tươi (đừng tin ảnh chụp cũ).
- **Lịch sử git `main` từng bị xáo** (thao tác git song song): bản đang chạy là `eb44638` — chứa ĐỦ mọi việc gần đây (Hỏi Coach offline + fix đêm khuya + Coach offline analyst). Vài commit cũ (`1e27505`, `9fbcd62`) thành dangling, KHÔNG còn trong `git log` nhưng code vẫn nằm trong bản deploy. Đừng hoảng nếu không thấy chúng.

### (Nhật ký cũ hơn → `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md`)

---

## 📚 Older journal + phase logs — archived

Entries before 2026-09-06 and the dated phase logs were moved verbatim to
[`docs/archive/BAN_GIAO_2026-09.md`](docs/archive/BAN_GIAO_2026-09.md) on 2026-09-06 (ADR-075); nothing was deleted.
`grep -n '<date>' docs/archive/BAN_GIAO_2026-09.md` to find one, or `node scripts/doc-budget.mjs --map docs/archive/BAN_GIAO_2026-09.md` for the index.
**This file is append-only and read `head -60` — keep it that way.**
