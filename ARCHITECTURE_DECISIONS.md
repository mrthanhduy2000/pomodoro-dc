# Architecture Decision Records — Pomodoro DC

> "Bộ nhớ kiến trúc" của dự án — trả lời **VÌ SAO** hệ thống được thiết kế như hiện tại, không chỉ
> **NHƯ THẾ NÀO**. Xem `ARCHITECTURE.md` để biết hệ thống đang vận hành ra sao; xem file này để
> biết vì sao nó lại vận hành đúng như vậy chứ không phải một cách khác tưởng như đơn giản hơn.
>
> **Quy tắc ghi**: mỗi quyết định kiến trúc thật (không phải chi tiết vặt) phải có đủ 9 mục dưới
> đây. Thêm bản ghi mới ở ĐẦU danh sách (mới nhất trước). Không xoá bản ghi cũ dù quyết định sau
> này bị đảo ngược — thêm bản ghi MỚI ghi rõ "đảo ngược quyết định #X, lý do", để lịch sử tư duy
> không bị mất. Đây là một phần bắt buộc của Project Governance Protocol — xem `CLAUDE.md`.

---

## 📚 ADR-001 … ADR-50 — full text archived

The **50 oldest ADRs** were moved verbatim to
[`docs/archive/ADR_ARCHIVE_001-050.md`](docs/archive/ADR_ARCHIVE_001-050.md) on 2026-09-06 (ADR-075).
**Nothing was deleted** — the rule "never delete an old ADR, even when reversed" still holds; they
are one `grep` away. This cut the active file from 392,634 chars (**114% of a 200k window**) to
roughly 44%. Titles below are the lookup key; read one with
`grep -n '^## ADR-0NN' docs/archive/ADR_ARCHIVE_001-050.md`.

- **ADR-050** — Chiều quay tam giác là một LUẬT CỦA HỆ, phải bịt ở CÁI CỬA DUY NHẤT; và một bài test đo VỊ TRÍ thì mù hoàn toàn với ĐỘ HIỂN THỊ
- **ADR-049** — Vùng phụ cận của đô thị là một NGỮ PHÁP RIÊNG, không phải một mật độ cảnh vật cao hơn
- **ADR-048** — Nhớ lại giá trị nút lưới nhiễu: vá một hồi quy hiệu năng do ADR-046, **không đổi một con số nào**
- **ADR-047** — Một phép hoà màu đặt SAI THỨ TỰ trong một chồng tầng: nó không sai về công thức, nó chỉ **xoá hai tầng nằm sau nó**
- **ADR-046** — Cái bệ KHÔNG phải một cái BẬC, nó là một **KIỂU PHÂN BỐ ĐỘ DỐC**; và ba nguồn sinh ra nó đều là những **hằng số được chọn ĐỂ LÀM RA nó**
- **ADR-045** — Địa hình: nhiễu phải **BẺ CONG** level set chứ không **CỘNG** vào cao độ; và mỗi kỷ phải khai một **HƯỚNG THẤP** để nền thành phố có lý do phẳng
- **ADR-044** — Lối vào của `meander` là một **QUAN HỆ giữa `MEANDER_NECK` và `SHORE_BAND`**, không phải hai hằng số cạnh nhau; và cái hào phải đo bằng khoảng cách **Ơclit**, không phải khoảng cách lưới
- **ADR-043** — TỔNG KẾT VIỆC 2 (mặt nước, 15 kỷ): khuôn **BẢNG → HÌNH → `worldYaw`** đã chạy đủ ba lớp; và bài học lớn nhất KHÔNG nằm ở nước mà ở **cái thước dùng để nghiệm thu nó**
- **ADR-042** — Trải một lời hứa từ 2 trường hợp ra 14 thì bốn phép đo cùng gãy một kiểu: chúng được viết thành MỨC, mà thứ chúng nói là QUAN HỆ. Cách xử lý là sửa MẪU SỐ hoặc GHI RA ĐẾM ĐƯỢC — không phải hạ ngưỡng
- **ADR-041** — `worldYaw`: xoay TỜ GIẤY, không xoay thế giới. Khi hai hằng số đều đúng mà kết quả sai, thứ phải đặt tên là QUAN HỆ giữa chúng
- **ADR-040** — Mặt nước là chỗ MẶT ĐẤT THẤP HƠN MỘT MẶT PHẲNG, không phải một tấm xanh đặt lên trên; và bờ nước KHÔNG được vẽ
- **ADR-039** — Địa thế là một BẢNG DỮ LIỆU viết TRƯỚC khi có hình, và "không có nước" là một câu trả lời phải khai TƯỜNG MINH
- **ADR-038** — "Cái khay" KHÔNG phải một cái MÉP: thành phố phải có VÙNG QUÊ, và vùng quê là một tầng ĐỊA LÝ nằm ngoài lưới — tách hẳn khỏi tầng TIẾN ĐỘ
- **ADR-037** — Mảng phủ đất: đất trống là một câu hỏi về **CÔNG NĂNG**, không phải một chỗ thiếu cây; và một mảng phủ phải là **MẢNG RIÊNG** chứ không phải một `kind` mới của cảnh vật
- **ADR-036** — Ảnh nghiệm thu: **HỎI trình duyệt canvas nằm đâu** (CDP `clip`), và chụp thành **DẢI NGANG** vì ổ cắm CDP có trần cứng 4 MiB
- **ADR-035** — Chữa va chạm cận cảnh: **LÙI RA TRƯỚC, NGẨNG SAU** (đảo nửa sau của ADR-034); và một phép lấy mẫu rời rạc phải trả về BIÊN CHỨNG MINH ĐƯỢC, không phải khoảng cách đo được
- **ADR-034** — Chế độ cận cảnh khoá KHOẢNG CÁCH THẬT, để mức thu phóng tự khác nhau theo kỷ; và lưới an toàn canh CẢ ĐƯỜNG BAY chứ không chỉ điểm đến
- **ADR-033** — `avenue` là PHẦN MẶT CẮT DÀNH CHO XE, không phải "đại lộ này oai tới đâu"; và một trục bản sắc phải được canh bằng thứ DỰNG RA, không phải thứ KHAI RA
- **ADR-032** — ĐẤT giữ bậc thềm, ĐƯỜNG được san thành dốc thoải: hai loại ô, hai luật cao độ khác nhau
- **ADR-031** — Lòng đường của một ô là MỘT LÕI + TỐI ĐA BỐN CÁNH TAY, không phải một hình chữ nhật; và bề rộng chỗ nối do CẢ HAI ô cùng suy ra bằng một phép ĐỐI XỨNG
- **ADR-030** — Mái là NGỮ PHÁP THỨ NĂM, và nó tách đôi kỳ-quan ↔ nhà-dân lần thứ sáu; nhưng `stackCount` thì CỐ Ý không tách
- **ADR-029** — Bảng tầng trệt dọn sang file riêng: quy ước "bảng ↔ hình" áp cho MỌI bảng 15 kỷ, kể cả bảng ra đời sau; và đảo ngược lý lẽ "để trong tầm mắt" của ADR-026
- **ADR-028** — Ngân sách lệnh vẽ là MỘT BẢNG 15 MỐC RIÊNG, không phải một trần chung; và câu hỏi "thành phố gồm những khối nào" chỉ được trả lời ở MỘT nơi
- **ADR-027** — Trải tầng trệt ra 15 kỷ: thêm ĐÚNG hai kiểu cửa + một đặc trưng, và đo bản sắc bằng 8 TRỤC CẤU TRÚC thay vì bằng mắt
- **ADR-026** — Tầng trệt là một BẢNG BẮT BUỘC 15 kỷ trong `eraStyle.js` + một tầng hình học riêng; và trạng thái "mới làm 3 kỷ" được khai TƯỜNG MINH bằng `door: 'legacy'`
- **ADR-025** — Bản sắc mặt đường là CẤU TRÚC (9 trục hình học), không phải MÀU; và phép đẩy độ đậm phải có TRẦN
- **ADR-024** — Đèn trời là một TỈ LỆ CỦA NẮNG, không phải một hằng số rời; và bóng đổ chỉ được cấu hình ở MỘT chỗ
- **ADR-023** — Phối cảnh không khí là việc của SƯƠNG (theo khoảng cách thật), không nướng sẵn vào nước sơn — đảo ngược một nửa quyết định cũ về `outskirts`
- **ADR-022** — Chân trời là một TRƯỜNG CAO ĐỘ RIÊNG theo kỷ, độc lập với `relief` của mặt đất thành phố
- **ADR-021** — Mật độ cây là một TỈ LỆ với đất còn trống, không phải một số cây tuyệt đối
- **ADR-020** — Thảm thực vật có NGỮ PHÁP RIÊNG (bảng loài theo kỷ + thư viện hình khối), không phải mấy nhánh `if` trong bộ vẽ cảnh vật
- **ADR-019** — Mặt đất là MỘT TẤM LƯỚI LIỀN, và điều đó ĐẢO NGƯỢC một nửa lập luận "phải là thềm bậc"
- **ADR-018** — Cạnh vát theo TỈ LỆ khối + một ngưỡng nhìn-thấy-được, không vát đều tay
- **ADR-017** — Chiều sâu mặt tường dựng bằng HÌNH KHỐI THẬT, không bằng bản đồ pháp tuyến
- **ADR-016** — Mặt đường phát biểu bằng KHOẢNG CÁCH TỚI MẶT ĐẤT, không bằng một độ sáng tuyệt đối
- **ADR-015** — Nhà dân đi qua ĐÚNG bộ máy sinh công trình (không có bộ sinh riêng), và kỷ khai thêm một MÁI NHÀ THƯỜNG tách khỏi mái công trình biểu tượng
- **ADR-014** — Địa hình Thành Phố 3D dùng THỀM BẬC do kỷ quyết định (không phải dốc liên tục, không phải ngẫu nhiên), và nhà vắt qua mép thềm thì kê MÓNG chứ không san phẳng đất
- **ADR-013** — Thành Phố 3D dùng vật liệu PBR có bản đồ môi trường, thay cho một `MeshLambertMaterial` dùng chung; và giữ kiến trúc gộp-hình-học bằng NHÓM vật liệu chứ không bằng nhiều khối
- **ADR-012** — "Trùng tu di sản": mở cho xây bù bản vẽ kỷ cũ — thay thế phần bị TỪ CHỐI ở ADR-011, và cái giá không phải là ô hàng đợi mà là NGUYÊN LIỆU KHÔNG KIẾM LẠI ĐƯỢC
- **ADR-011** — "Di sản dang dở": công trình kỷ cũ được xây tiếp, nhưng phần thưởng chỉ là LỊCH SỬ — nới bất biến của ADR-007 từ "bảo tàng bất động" thành "bảo tàng không xê dịch"
- **ADR-010** — Khoảnh khắc "thành phố lớn lên" chen ở TẦNG HIỂN THỊ, không hoãn `lootModalOpen` trong store; và cổng phải hỏng theo hướng MỞ
- **ADR-009** — Thành Phố là một Ô CỬA SỔ: đồng hồ quyết độ sáng cảnh, theme chỉ quyết cái khung — và sắc kỷ trộn trong RGB, không xoay góc màu
- **ADR-008** — Thành Phố: tách KHUNG màn hình khỏi BỘ VẼ, và giữ bộ vẽ 2D làm nền vĩnh viễn (không phải bản nháp)
- **ADR-007** — Thành Phố Pixel: toạ độ SUY RA từ id, không lưu vào state; và đặt nhà theo "khu đất cố định" thay vì dò xoắn ốc
- **ADR-006** — Không tách nhỏ `gameStore.js` trong đợt refactor kiến trúc toàn diện
- **ADR-005** — Cấu trúc `api/_lib/` + `api/_tests/` với tiền tố gạch dưới
- **ADR-004** — "First Action Wins": đồng bộ đa thiết bị dựa trên version phía server, không phải timestamp máy khách
- **ADR-003** — AI Coach: chỉ dùng Gemini đám mây, gỡ hẳn Qwen on-device (WebLLM)
- **ADR-002** — Lưới chống-bịa AI Coach: "cứu câu/cứu dòng" thay vì huỷ toàn bộ câu trả lời
- **ADR-001** — Không gộp `buildAchievementSnapshot` (real-time) và `buildAchievementSnapshotForReplay` (lịch sử)

---

## ADR-088 — Round 48: the city becomes a place — the scenery moves, the core is flat and the wild is outside, the land grows with the player, and parts and people gain an axis

**Date**: 2026-09-09 · **Order**: *"Build lớn. Chuyển động, motion, 3D chuẩn hơn. Bám sát lịch sử. Mở rộng diện tích thành phố. … thành phố đang là một tấm ảnh đẹp. Vòng này biến nó thành MỘT NƠI CÓ THẬT. … Nhìn 10 giây mà không thấy gì nhúc nhích thì vòng này chưa đạt."* · **Performance is not measured this round** (Đàm's instruction; `PHASE_RULES §2`: measure again only when he reports lag).

### Context
After round 47 the 3D city was a good photograph: fifteen grounds, dense colour, rounded edges — and one line in `sceneGraph.js` said what was wrong with it: `isAnimated: residents.length > 0`. Nothing but people moved. Terrain still stepped inside the grid (era 5: three 0,45-unit terraces under a 0,4-unit house). The land a player had after 553 sessions was the land of day one (`#74`). Every part could only spin about the vertical (`#29`, `#40`); the human rig had two axes (`#82`, closed in ADR-057) but no twist. And the round-47 report had blamed a tool discrepancy on two code paths without a root cause.

### Decisions
0. **The ruler (lesson 104).** `--eras` and `--era N` render byte-identical frames; the "flat-roofed era 12" was a stale file in the shared `.city-preview/` folder, copied after a run that never replaced it. `city-preview.mjs` now takes a **lock** (an overlapping run exits with code 3), **deletes every target PNG/.geom.json before rendering it**, and writes **`last-run.json`** with a `sourceStamp` (sha1 of the bundled 3D sources, also in every `.geom.json`). Copy from the manifest, never from `ls`. Three source tests keep the guards.
1. **A second axis for parts, a third for people.** `prism`/`gable` accept `rx`/`rz` (tilt about the part's own base centre; `geometryFactory` builds `Ry·Rz·Rx`), written only when non-zero so untilted specs serialise byte for byte. Palm fronds are vertical blades hinged at the crown, tilted past horizontal — a palm is a dome of drooping fronds, not a "✳" (#29). Resident joints gain `c` (yaw): pelvis and shoulder girdles counter-rotate as BLOCKS, the head glances around keyed to distance travelled — deterministic.
2. **The scenery moves — one clock, three layers.** `engine/city3d/motion.js` declares each era's vocabulary (wind amp/speed, smoke kind, particle set): Manchester pours soot, Stalingrad snows, Dubai blows sand, Lisbon has gulls. `geometryFactory` writes a per-vertex `aMotion` (kind · amplitude · phase · weight) from part ROLES — foliage sways with height-weighted amplitude, cloth flaps — and the vertex shader displaces it through the ONE `onBeforeCompile` hook (`surfaceDetail`), fading with camera distance but never to zero. The water surface rides two crossed waves with its normal recomputed, so the sky reflection shifts. Chimney stacks carry `tag: 'stack'`; smoke is born there (hearth smoke at the roof of one house in three where no stack exists). Particles are `InstancedMesh`es whose every instance is a function of (index, time) with a fixed bounding sphere (culling stays on). Laws: **determinism** (no clock but `uTime`, no `Math.random`) and **no synchrony** (`phaseAt(x, z)` per object). `still` scenes and `--nomotion` freeze the scenery; residents keep walking. Measured on era 12: **3,66 %** of pixels change between frames 1,5 s apart with motion on, **0,11 %** off.
3. **Flat core, wild outside.** `ERA_TERRAIN`: 13 eras `terraces: 1`; Burg Eltz (5) and Lisbon (8) keep ONE step of 0,07/0,06 units. Göbekli Tepe is a flat settlement on a mound that looks down on the plain — the mound is the horizon's job. `HORIZON_STYLES`: hill and mountain eras start their relief closer (`near` +0,12…+0,17, inside the 8-cell ring the camera sees) and the three true mountain settings rise higher; the plains stay flat and far. No old art gate moved: `waterView` TRUOT list unchanged, terrain tests green.
4. **The land grows with the player (#74) — only add, never move.** `landGrowth.js`: milestones **0 · 25 · 50 · 90 · 140** sessions of the era → stages 0…4. The outskirts ring extends **8 → 11 cells** (the stage-0 lattice is byte-identical to Phase 8D's, growth adds nodes at new indices only, planted denser than the old far edge so a milestone is seen); **one extra hamlet per stage** is appended to the hinterland's tail; the default camera steps back **+5 % per stage** (#73's coupling, now used on purpose). A sealed era is rendered with the session count stored at its seal (`CityView` already did this), so a museum piece keeps its size. `landGrowth.test.js` sweeps 15 eras × 5 stages: every old item keeps its coordinates, digit for digit. ADR-007's position tests (15 × 120) untouched and green.

### Consequences
| | Before | After |
|---|---|---|
| Kinds of moving things | 1 (people) | people · foliage · cloth · water · smoke/steam · snow · sand · dust · birds |
| Rotation axes: parts · human joints | 1 · 2 | 3 · 3 |
| Terraces inside the grid | 1–3 (relief up to 0,90) | 1 (13 eras) · 2 (eras 5, 8: 0,14/0,12) |
| Land vs sessions | fixed | ring 8 → 11 cells · +4 hamlets · camera +20 % over 5 stages |
| Sealed era reopened | same | same (frozen session count) |
| Tool: two runs, two cities | possible | lock · pre-delete · manifest |
| 3D debts closed | 49 open | #29 · #74 closed; #73 used; #40 unlocked (tiles not re-laid, under 12 px) |

**Not done, on purpose:** boats and cranes (no prop exists yet); flags on landmark masts (`cloth` role and flap shader are ready, no mast carries cloth yet); barrel tiles on the slope (#40, under the eye threshold at the default camera); #88 plots per block; the completion celebration inside the picture (round 46's banner + camera flight stand); gait stop/turn/sit.

### Tool lessons
- Two runs of the preview tool that overlap share one bundle — the lock is the only honest answer; running "one era at a time" was avoidance (lesson 104).
- A frustum-culling control test catches a particle mesh with `frustumCulled = false` — the fix is a fixed bounding sphere, not turning the test off.

---

## ADR-087 — Round 47: the city is redrawn on the same map — each era stands on its own ground, its colours are dense, its edges are rounded, and the 3D city stops being a black box

**Date**: 2026-09-08 · **Order**: *"ĐỘT PHÁ MỸ THUẬT. Vẽ lại thành phố từ đầu, trên đúng tấm bản đồ cũ. … Tôi mở khoá thành phố 3D — hộp đen không còn. … bớt góc cạnh · bo tròn nhiều hơn · trông 3D hơn · màu tươi hơn, sáng hơn, tương phản hơn · bám sát lịch sử hơn. Và tôi muốn đột phá, không phải chỉnh sửa."* · **ADR-007 locks POSITION, not SHAPE** (Đàm's own reading, this round).

### Context — one ground for fifteen centuries
Since Phase 9 every era stood on the same `GROUND_ANCHOR` (hue 58°, saturation 22%): Ur, Florence, Stalingrad and Dubai all sat on one olive-khaki lawn, and the road palette carried the whole burden of "which century is this". Measured on the 15-era noon sweep before this round: median saturation of the 14 largest colours per era **0,06–0,13 in 13/15 eras** (only China's gold roofs and Singapore's glass broke 0,30); closest era pair in `sweep-score` **22,4**, median **36,2**. Bevels existed (`BEVEL_MAX` 0,035, `BEVEL_RATIO` 0,15) but were invisible at the default camera: a 0,035 chamfer on a 1,3-unit house is about one pixel at 1400 px.

### Decision
1. **Ground is a per-era fact, declared where the era is declared.** `ERA_STYLES[n]` gains `groundKind` (one of `GROUND_KINDS`: sand · clay · steppe · meadow · paddy · paving · cinder · snow — each a hue/saturation/lightness WINDOW, not a colour) and `groundColor`. `palette3d.js` builds `ground`/`groundAlt`/`groundShades`/outskirts from that colour in HSL, in the same relations as before (shade spread ≤ 0,018 L — the checkerboard lesson; outskirts +6° −0,05 s +0,035 L mixed 0,15 to the horizon; night 0,62 s × 0,75 L). Eras that declare nothing fall back to the legacy anchor, byte for byte. Tests: every era must declare a real kind and sit inside its window (`eraStyle.test.js`); ≥ 5 kinds and every pair of grounds apart by ≥ 6° or ≥ 0,05 L or ≥ 0,10 s (`palette3d.test.js`).
2. **Walls are a per-era material too** (`wallColor` → `wall`/`wall2`/`trim`, s ≤ 0,55, lightness spread ≥ 0,35 across eras). Roads keep their own law (lightness = ground ± `roadContrastGap`); the closest-pair test is restated per paving FAMILY (cut stone may neighbour cut stone; brick, asphalt and dirt may not coincide).
3. **Rounding that can be seen.** `BEVEL_MAX` 0,035 → **0,060**, `BEVEL_RATIO` 0,15 → 0,22, gables get a rounded ridge cap (12 tris), and — the part that actually moved the eye — **plan-corner rounding** (`cornerRadius`, `CORNER_SEGMENTS` 2) on every 4-sided prism whose plan is ≥ 0,25 unit, INCLUDING wide thin plates (cornices, plinths, piers): the box look lived in those plates, not in the walls. Sill-sized parts keep 12 triangles. `countTriangles` mirrors the factory exactly ("the budget must not lie" test): a rounded beveled box is 92, a rounded plate 44. Per-building ceiling 8 000 → 12 000; city totals per era re-based in `triangleBudget.test.js`.
4. **Light.** Contact AO deeper (`CONTACT_FLOOR` 0,58 → 0,44 · `CONTACT_REACH` 0,38 → 0,52) and ONE rim/back `DirectionalLight` (0,22 × sun, sky-coloured, no shadow) opposite the sun — allowed by the order; **no fourth fill light, tone mapping and DPR untouched.** `PCFShadowMap` was tried (renders differ from soft, `cmp` confirmed) and REJECTED by eye: at 1400 px the edges are not visibly harder, so the softer map stays.
5. **Fifteen looks.** `ROOF_KINDS` += `hip`, `mansard`; `vernacularRoof` now 5 values (China hip · Tuscany low hip · Paris mansard with dormers · Stalingrad snow gable) and may carry its own `vernacularPitch`; domes 8 → 12 sides; the smallest common house of every windowed era has windows (`storyHeight × 0,36` ratio, closes `TECH_DEBT_3D #25`).
6. **Roof rise is taken on the full-plot footprint** (`ctx.plotFx/plotFz` in `emitRoof`) — the root cause `TECH_DEBT_3D #90` named: a steep vernacular gable on a split block lost more height than `plot.storey` gave back (era 12: 0,69× the reference house, under the 0,75 floor). Now **no era is lower after the split** — `block.test.js`'s named list went `[5]` → `[]` (era 5 fixed as a by-product).
7. **The black-box rule is retired** in `CLAUDE.md`, `START_HERE.md`, `docs/TECH_DEBT_3D.md`. ADR-007 (position) stays; the 15 × 120 position test and the block-position test ran green before every commit.

### Consequences — measured after (same tools, same camera)
| | Before | After |
|---|---|---|
| Eras with their own ground | 0 (one anchor) | **15 / 15 · 8 kinds** |
| Median saturation ≥ 0,20 (top-14 colours, noon) | 2 / 15 | **10 / 15** — stone/asphalt/soot/snow eras (8 · 10 · 11 · 12 · 13) stay honest greys |
| Closest era pair / median (`sweep-score`) | 22,4 / 36,2 | **24,9 / 51,6** · 0/105 below 12 |
| Rounding visible at default camera | ❌ | ✅ (bevel off/on photo, ×3 crop of the same frame) |
| Triangles, whole city (sum of 15 eras) | 1 925 908 | **1 877 928 (−2,5 %)** · era 8 124 348 → 118 508 · worst era 6 198 388 → 199 252 |
| Eras lower after block split | 1 (era 5) | **0** |
| 3D debts closed | — | #25 · #76 · #90(a) |

**Not done, on purpose:** `#88` (plots per block stay 4 — options change every dwelling's shape and need Đàm's eye on top-down views) · `#73` (camera not moved: every photo this round compares at the default eye) · `#90(b)`.

### Tool lessons
- `city-preview.mjs --all` and `--era N` rendered era 12 differently in the same minute (flat vernacular roofs vs the gables the code declares). Not root-caused this round; the 15 final renders were taken with `--era N` one by one. Suspect the tool before the code — again.
- A saturation gate on the FULL frame is dominated by the largest surfaces (sky, outskirts, plaza), so a ground that is right in `eraStyle` can still read 0,16 in the photo; fix the ground, not the metric.
- Frame time in the sandbox (SwiftShader) is not a device number; the 8 ms veto is judged on triangle count and on Đàm's Mac.

---

## ADR-086 — Round 46: the City tab catches up with the city's three roles — the picture is the biggest thing on its own screen, the screen says what the city pays, and a museum piece is lit once

**Date**: 2026-09-08 · **Order**: *"THÀNH PHỐ PHẢI TRÔNG NHƯ THỨ ĐÁNG NHẤT TRONG APP. Vòng 43 cho nó một cái đích (75 công trình). Vòng 44 biến nó thành ngân hàng (1 công trình = 1 điểm kỹ năng). Vòng này làm cho màn hình của nó nói ra cả hai."* · Acceptance, in his words: *"tôi mở tab Thành Phố trên iPhone, chưa cuộn một lần nào, và tôi thấy ba thứ — thành phố của tôi, nó còn cách đích bao xa, và nó vừa trả tôi bao nhiêu điểm kỹ năng."*

### Context — one sentence, four measurements
The city is the destination (ADR-082), the bank (ADR-084) and the one thing that can never be revised (ADR-007) — and its screen had not caught up. Measured 2026-09-08 on an iPhone frame (390×844, `shot.mjs --probe`, a 12-era save):

| | Before | Why it matters |
|---|---|---|
| City picture | **201 px = 23,8 %** of the screen | the smallest block on the tab named after it: header 202 · era strip 217 · stat grid 135 |
| Picture starts at | **y = 494** (8 eras 421 · 15 eras ~564) | one scrolls to see one's own city |
| «SP» / «kỹ năng» on the tab | **0 times**, ledger `spFromCity` = 37 | the trap round 44 wrote a rule against, on the one screen that earns the money |
| Museum (Kỷ 3) brightness, 5 points | **0,15 at night · 0,37 at noon** | a permanent reward 2,5× darker at the hour he opens the app, on top of the `dimmed` fade |

Two more lines were false or dead: the museum's stat cell printed **«EP lúc niêm phong: 5006»** (raw EP, no separator, nothing to do with it — against ADR-082), and the ADR-080 promise *"fifteen chips fit three rows at 390"* measured **6 rows at 12 chips** after «5/5 ★» and «· đang xây» fattened them.

### Decision 1 — the picture's height has ONE owner: `components/city/stageMetrics.js`
Same pattern as the ring (ADR-083), same reason: two expressions for one shape drift the moment a cap binds. `stageFrameStyle()` is the frame's whole geometry — `aspect-ratio: 1.3` (the FLOOR, imported from the engine's own camera fit `FRAME_FIT_ASPECT`: a wider frame only adds margin, a narrower one crops the near corner — so this is the tallest the picture may be without touching the camera) · `max-height: min(ceiling, 100svh − reserve)` · a 200 px floor. `CityScene3D` runs in `fill` mode on every tenant now and reads the frame; the 1 : 0,62 constant and the `StagePlaceholder` that carried a second copy of it are gone. The reserves are DECLARED (measured, rounded up, contents listed beside each number) — a runtime measurement would be a feedback loop, and a declared reserve fails safe.
**Refused**: passing the real aspect into `cityFrameDistance` so the camera backs off for a taller frame — that is the camera, and the 3D city is a finished black box; it would also make the framing depend on the device. **Refused**: a bleed beyond the card (390 ÷ 1,3 = 300 px) — 31 px of picture is not worth a picture with no edge.

### Decision 2 — everything above the picture gave way, by the rule that was already in the file
*Two places saying one thing: the one saying less yields.* The phone's top rail on this tab keeps title · level · bell (`hideStats`, `hideEra`, as the Focus tab already did): its stage bar read «57/75 công trình», which is the tab's fourth stat cell, and «Kỷ 12» is the selected tile. 202 → 77 px. The era strip became two-line TILES (`EraSwitcher.jsx`, words in `cityCopy.eraTile`): «Kỷ 12» over «★ | 4/5 | —». The star MEANS five of five, so no fraction beside it; «đang xây» is said once, in the era card's status line, and a sealed era with a restoration in flight keeps its fraction in the accent tone. `repeat(auto-fill, minmax(40px, 1fr))`: 40 px is the finger floor and the width «Kỷ 15» needs — 8 tiles a row at 390, 15 tiles on one row at 1280. Still never a scroller (ADR-080).

### Decision 3 — the city says what it pays, from the economy, in SP first (ADR-084's rule)
The «Phiên trong kỷ» cell failed round 43's test (*what can Đàm DO with this number?*) and is now **«Điểm kỹ năng» — `cityEarnedSP(builtTotal)` for the whole city, `+N từ kỷ này` as the hint** (era share). The count itself survives as the plaque under the picture (`eraStatusLine`: «Đã niêm phong 2025-06-21 · 54 phiên»). The «Đang xây» card's header names the pay («xong là +1 SP»), every unbuilt slot names its price, and the arrival moment (Decision 6) names it again. No typed rate anywhere: `SP_TAG` is built from `SP_PER_BUILDING`, and `cityViewShellWiring.test.js` reads the CALL SITES — an engine test proves a function runs, never that anyone calls it (this project's third uncalled function was found that way).

### Decision 4 — a sealed era is lit once (`MUSEUM_HOUR = 15`, `museumDaylight()`)
The shell already hid the «đang là hoàng hôn» caption for sealed eras because "that is a place that no longer changes" — but the LIGHT still followed tonight's clock. Half a rule. A `dimmed` scene now reads one fixed daylight profile (15:00 — a warm, low sun, gallery light); it is a plain existing profile, not a fourth light source or a new material, so the black box renders it as any afternoon. The current era keeps the real clock — the promise "every open is a different scene" belongs to the city that is alive. Measured after: **0,37 at night = 0,37 at noon**, five points identical.

### Decision 5 — two false lines, and one premise corrected
The museum's «EP lúc niêm phong» cell is gone; the third cell shows the museum score «Kỷ trọn vẹn 6/8» whichever era is on screen, like the destination cell (the two numbers that must not move while he browses). And Đàm's brief said an unbuilt slot in a sealed era «không bao giờ xây được nữa» — **that premise is false in the code he approved**: ADR-012 (2026-08-13, his decision) opened *«Trùng tu di sản»* in Hành trang, one legacy slot at a time, `startProject` has no resource gate any more, and a restored building pays the same skill point (`countBuiltBuildings` counts the archive). So the honest label is not «vĩnh viễn khoá» but **«trùng tu được · +1 SP»** — the museum's grey lots are a PATH to the missing star and to a point, and the screen now says so. What makes the star worth having is that the city never MOVES (ADR-007), not that it cannot grow. Both wordings live in `cityCopy.slotNote` and are pinned by test.

### Decision 6 — the City tab reacts when a building has finished: a DIFFERENCE, not an event (`engine/cityArrival.js`)
Finishing a building is the rarest, most expensive event in the game and the ending card was its only witness; the tab named after the thing that grew did nothing. It now compares `summarizeMuseum().builtTotal` with the count stamped on THIS device the last time the tab was shown (`localStorage` `dc-city-seen-v1`, per device like `DayMoment`'s stamps — never a synced write). A difference flies the camera to the newest building (the existing focus flight; `buildings[]` is in completion order) and stands a banner in the frame — «Vừa xây xong · Bệnh Viện Dã Chiến · +1 SP · đã cộng vào cây kỹ năng» — for `ARRIVAL_VISIBLE_MS` = 4,2 s, then both leave (ADR-080). A first visit stamps silently: "38 new buildings" on the day this shipped would be a lie about the past. A shrunken city (cloud pull) is never announced. Works across reloads, days and devices, for the same reasons the SP ledger does. The banner is also rendered on the 2D branch — a machine without WebGL2 still finishes buildings.

### Decision 7 — no museum gallery; the shelf IS the overview
Đàm asked whether eight sealed cities deserve a place to be seen at once. **No** — eight WebGL scenes are eight contexts, and eight 2D thumbnails at 390 px are 80-px stamps below the eye threshold (PHASE_RULES §10). What the collection needs at a glance is *which eras are whole*: the tile strip now shows exactly that — a row of stars with the gaps visible, no new unit, no second tab.

### Consequences (measured after, same instruments)
- Picture **268 px = 31,8 %** (+33 %), starts at **y = 190** at 12 eras (**204** at 15) — from 494. The stat grid's bottom edge sits at 669 (716 at 15 eras), above the floating tab bar (726): his three things, no scroll. Desktop 1280×900: picture 438 px, stat row on screen at 868 (before: 569 px picture, stats at 1013 — below the fold).
- Era strip: **15 tiles = 2 rows / 80 px at 390 · 1 row at 1280** (from 6 rows / 217 px at 12 chips). Horizontal scroll 375/390/1280/2000: 0.
- ADR-007: the invariant test is unchanged and green; no camera, geometry, light or DPR touched. FAST pass 1.682 · 0 fail · skipped 1 (baseline 1.639); cross 3/3; lint clean; build green.
- New guards: `stageMetrics.test.js` (one owner, screens 390/375/1280/2000) · `cityCopy.test.js` (tile words, slot notes, no scroller) · `cityArrival.test.js` (first visit silent, never negative, CityView call sites) · `cityViewShellWiring.test.js` (SP cell, no raw EP, rail flags) · `CityScene3D.test.js` (museum light). `cityRenderers.test.js` updated for the tile structure.

### Tool lessons (recorded here because two of them cost the round hours)
1. **The first 3D frame on the City tab is a transient.** At `--settle 600` the frame showed a zoomed, cropped city — the scene's first `resize()` — and looked exactly like a camera bug. `--settle ≥ 1500` shows the truth. Suspect the measuring tool first (LESSONS_3D law 1).
2. **Headless Chrome (SwiftShader) does not composite the bottom overlay over the WebGL canvas.** The arrival banner was in the DOM, opacity 1, top of `elementsFromPoint`, transform neutralised — and absent from the pixels, while the top-left pill in the same frame painted fine. The moment was therefore photographed over the 2D renderer (`--city2d`), which is the same component in the same slot. On real GPUs positioned DOM over WebGL is routine.
3. `--probe` exits before the capture — a `--out` on a probe run writes nothing, and the previous file stays. `--click` matches the tile's full text: `--click "Kỷ 3★"`. `--hour` also moves the day-arc stamps: seed `dc-day-arc-v1` for 2026-08-13 when using it, or the week banner lands on the photo.

---

## ADR-085 — Round 45: a bonus that cannot be seen is not a bonus — every source names itself, and unlocking a skill becomes a moment

**Date**: 2026-09-08 · **Order**: *"Vòng 44 mở van cho tôi kiếm được điểm. Vòng này trả lời câu kế tiếp: tiêu vào đó có đáng không?"* · *"Tôi mở một kỹ năng, và tôi biết ngay app vừa khác đi ở chỗ nào. Nếu tôi mở xong mà không thấy gì đổi thì vòng này chưa đạt."*

**Context — round 44 opened a valve onto an empty warehouse, and the measurement says exactly how empty.** Round 44 made the city pay skill points, which handed a real save ~40 SP at once: twelve skills, twelve taps, 29% of a 138 SP tree spent in two minutes. Đàm's question was whether those twelve taps were a pleasure or twelve taps. Walking all 36 skills against *"can he feel it, where and when?"*:

| the 36 skills | count | what the screen shows |
|---|---|---|
| a silent `+X% XP/EP` inside the reward formula | **27** | nothing, ever, anywhere |
| genuinely felt (breaks +5′, streak shield, combo window, multiplier tier, two manual activations) | 6 | a visible state change |
| prestige-only | 3 | dead on a save that has never prestiged |

One skill is worth roughly **3–7 XP on a 48-minute session**. So twelve taps bought twelve numbers nobody could see, folded into one headline that was already the sum of eleven other things. That is not a balance problem — no change to the percentages could fix it, because the percentages were never the part that failed.

**Decision 1 — a CREDIT LEDGER that runs alongside the arithmetic, never inside it (`engine/sessionCredits.js`).** Every place `gameMath.js` adds a bonus now also writes one line naming who paid it (25 sites), and `challengeEngine`/`wonderEffects` return a `sources` list beside their pre-summed percentages, so ranks, relics and building perks arrive with names instead of as three anonymous totals. The ending card prints the top three as chips (`✦ Vào Guồng +18 XP`) and counts the rest (`+2 nguồn nữa`).

⚠️ **The ledger is a passenger, not a driver.** It reads the same locals the formula uses and never feeds a value back, so a bug in the ledger can make the CARD wrong but can never move the PAYOUT. At the hard cap (`XP_FACTOR_HARD_CAP`) the credits are rescaled proportionally, because chips that add up to more than the headline above them destroy the credibility of the whole breakdown in one glance.

**Decision 2 — unlocking a skill is a 4,2-second moment stating the gain in sessions and XP (`engine/skillPreview.js` + `components/focus/SkillMoment.jsx`).** Round 40's law says a static thing is noise and a transient thing is a reward, so this is a banner that arrives, says its number, and leaves.

⚠️ **The number is MEASURED, not looked up.** `previewSkillGain` runs the real `calculateRewards` twice — once with the skill, once without, at the player's own median session length — and prints the difference: *"Phiên 48 phút, khi đủ điều kiện: +5 XP."* A hardcoded table would be a second copy of 36 formulas and would drift the first time one changes. Skills whose payoff is a dice roll (`VAN_MAY`) are **refused, not averaged** — printing an expected value as if it were a promise is the same lie the old headline told.

**Decision 3 — the three-skill choice must be a decision, not a button with three labels.** Each choice on the level-up card now carries its measured worth (`≈ +5 XP / phiên 48′`), computed by the same double-run, and `null` where the honest answer is "it depends on a roll". Three different shapes of value beat three variations of `+x%`.

**Decision 4 — the week becomes ONE line on the day card, where the week card is absent.** Three daily missions plus a weekly chain is four things to remember for an app Đàm only wants to open and press Start. Rather than cut either kind, the phone Focus screen's day card ends with one line — which step the week is on, what finishing it pays. Gated on `showDaily && !showWeekly` so it never ships alongside the full card on desktop or on Tiến trình: *two places saying one thing means the shorter one yields*. No `truncate` — the longest step today is 30 characters and wraps rather than ending in "…", per the veto table.

**Decision 5 — Hành trang keeps all three sub-tabs, and «Đã xây» survives the duplication charge.** The three are three different verbs — *spend points* (Kỹ năng) · *choose what to build next* (Công trình) · *read what is running* (Di vật) — not three views of one dataset. «Đã xây» looked like a copy of the Thành Phố tab until the tap was traced: selecting a built tile is the ONLY place in the app that names what that building's perk does (`PerkSummary`). Deleting it would have made perks *less* felt in the same round that set out to make them felt.

**Decision 6 — the spend rhythm does NOT change; what was missing was a sentence, not a rate.** Đàm read the rhythm as 5,6 sessions per point. That is the city tap alone. All three taps together are 139 SP over ~420 build-sessions ≈ **3 sessions per point** — his felt number was nearly twice too slow because two of the three taps were invisible from where he stood. The 1 SP/building ratio is load-bearing (it is what makes the tree finish as the city finishes), so instead `nextSkillPointETA` prints the NEARER of the two taps that can honestly be counted in sessions.

⚠️ **This fixes a line that was almost always blank.** The skill-tree header only ever knew one distance — the next level — and on a real save that was **~155 sessions**, above `STAGE_COUNTDOWN_MAX_SESSIONS`, so it printed nothing at all while the city was three sessions from paying. The week is deliberately excluded: a chain closes on a calendar, and converting "2 steps left" into "~N sessions" would be inventing a number.

**Consequences.**
- The ending card can now be audited against the payout by eye: three named chips plus a count, all rescaled to sum to what was actually paid.
- 27 silent skills become 27 nameable ones without touching a single percentage — the economy round 44 balanced is untouched.
- `sessionCredits.test.js` holds a guard that no future buff can move `expBonus`/`epBonus` without also merging its `sources`; that failure is invisible to any assertion on the payout, because the payout stays right.
- Two banners collided at `top: 96px`. The direct response to a tap (a skill unlock) wins over the ambient greeting (the day/week arc), pinned by a test rather than by luck of mount order.
- `SkillTree` stopped importing `SP_PER_LEVEL`: the header's payout number now comes from the ETA, so the constant is read once, in the engine.

**What the CAMERA caught, and the code review did not.** The first perk chip read
*«🏛 +5% XP mọi phiên +8 XP»* — `WONDER_EFFECT_REGISTRY[id].label` is the EFFECT, so the chip printed
a percentage next to the amount that percentage had already produced: one fact, twice, in eight
characters of space. Nothing in the tests could see it, because both halves were correct. A perk is
now credited by the **building that grants it** (*«🏛 Thờ Phổ Linh Hồn +8 XP»*) — the half Đàm owns,
one of his 75 — and a test refuses any source label containing `%`. ⚠️ This is the round-41 law
paying for itself again: *do not hand over a moment before you have a photograph of it.*

**A measuring-tool lesson, the 29th (project law #1).** The skill-moment screenshot kept showing the day banner instead. A render trace proved the moment rendered at t=13.138 ms and dismissed at t=17.440 ms — exactly its 4,2 s — so nothing was broken: the sandbox takes ~13 s to hydrate, and `--settle` had been fired outside the window. `--watch "KỸ NĂNG MỚI"` (uppercase, because `--watch` matches `innerText` after CSS uppercasing) catches it every time. **The tool was late, not the code.**

**Alternatives considered.** Printing an expected value for the luck skills (rejected: an average presented as a promise is the very lie being fixed). A lookup table of per-skill descriptions (rejected: a second copy of 36 formulas, guaranteed to drift). Cutting daily missions or the weekly chain outright (rejected: both pay real currency — the chain pays the only spendable one — so the fault was the presentation, and merging cost one line where deleting would have cost a faucet). Raising SP per building to shorten the wait (rejected: it breaks the 75-building/138-SP alignment round 44 derived, and Đàm's brief forbids it).

---

## ADR-084 — Round 44: the CITY funds the skill tree, and the 360-badge system is deleted outright

**Date**: 2026-09-08 · **Order**: *"tôi kiếm được gì, và tôi tiêu nó vào đâu?"* · *"360 thứ không thưởng gì thì tệ hơn 20 thứ thưởng thật."*

**Context — five measured numbers that only make sense together.** Round 43 gave the app a destination (75 buildings) and killed the units nobody could spend. It did not fix why. The economy underneath had stopped running:

| measured | value |
|---|---|
| units of progress · how many are spendable | 12 · 2 |
| the whole skill tree, all 36 skills | **138 SP** |
| SP from levels: 6.000 XP/level against a median ~35 XP/session | **~86 sessions per SP** |
| a real 617-session save | **2 unspent SP · 4 of 36 skills open** |
| the other SP source (weekly chain, 1–2 SP) | behind a tab that does not exist on desktop |

So the one thing worth buying was the one thing that could not be earned, while 360 badges could be earned endlessly and bought nothing. Those are not numbers to tune.

**Decision 1 — a finished building pays 1 skill point (`engine/skillPointEconomy.js`).** The city was already the destination (ADR-082); it is now the economy too, so the two never compete for attention. The rate is derived, not chosen for feel: 75 buildings × 1 SP = 75, plus ~1 SP/week from the chain over ~50 weeks, plus ~14 from levels, is **~139 SP against a tree costing 138** — the tree finishes as the city finishes and all three sources still matter. Two SP per building would have covered the tree from the city alone and made the other two decorative. **~5,6 sessions per SP**, down from ~86.

**Decision 2 — it is a LEDGER, not an event.** `settleCitySP` compares what the city has EARNED (a function of how many buildings stand) against what it has already PAID (`player.spFromCity`). Three properties fall out, and each was a reason not to write `if (built) sp += 1`: it pays a pre-existing save **retroactively with no migration step** (38 buildings ⇒ 38 points on first load); it **cannot double-pay**, so it is safe to settle on hydration AND after every session, which is what happens; and it **self-heals** after a rejected CAS write instead of losing a point forever. It never subtracts — a city can shrink (a cloud pull from a device that is behind, an older import) and clawing back spent points is the one thing an economy must never do. It rides through Thăng Hoa, because prestige does not reset the city and a reset ledger would make prestige an SP printer.

**Decision 3 — the 360-badge system is DELETED, closing TECH_DEBT #103.** Round 43 measured the alternative before refusing it: tier-scaled XP over bronze 64 · silver 87 · gold 89 · platinum 61 · diamond 59 at a modest 60/120/250/500/1.000 is **126.030 XP ≈ 21 levels ≈ 42 SP**, against a tree of 138 — a second faucet large enough to dissolve the one-currency rule (ADR-069). Đàm's own principle decided the rest: *360 things that pay nothing are worse than 20 that pay something*. Gone: `ACHIEVEMENTS` (360) + `ACHIEVEMENT_TIERS` + `ACHIEVEMENT_CATEGORIES`, three engine modules, five components, the achievement toast source, the localStorage "seen" bookkeeping in `navAttention.js`, the `achievements` slice of persisted state, and the Huy hiệu sub-tab. **No corpse left**: the tab is now "Di vật" (relics still buff, so they keep their job), and `resolveTabTarget` explicitly translates the old `achievements` id so saved notifications do not become dead buttons.

**Decision 4 — the weekly chain leads with SP.** It had *always* paid 1–2 skill points, and the screen had never said so: it printed `+328`, an unlabelled XP number. Naming the SP changes the question from *"is 328 a lot?"* to *"finishing this week is a new skill."*

**Consequences.**
- Every unit now terminates in the same sink. `gạch → công trình → SP`; `XP` and everything that multiplies it (streak · rank · relics · skills · missions) `→ cấp → SP`; `EP → kỷ → 5 more buildings → 5 more SP`. One sink (the tree), one destination (the city), no orphan numbers.
- The reward card that lets Đàm SPEND a point now fires for city points too, right after the card naming the building — `"Kho Gia Vị xong" → "+1 SP, chọn một kỹ năng"` is one thought. It was previously gated on a level-up, i.e. roughly twice a year.
- Two "go level up" captions were removed as dead advice: at ~171 sessions per level that sentence pointed at the longest road on the board.
- `countBuiltBuildings` in `engine/journey.js` is now read by the LEDGER as well as the screens, so a second way of counting would pay the wrong number of points, not merely draw a wrong caption.
- The glyph-coverage floor drops 513 → 139 and the toast-density floor 5 → 4. Both are recorded as *a system was deleted*, with a note that this is the only legitimate reason to lower either.

**A trap found while writing this.** A `/* … */` block comment placed immediately after the `{` of an object literal made `components/journeyWiring.test.js` go red in an unrelated file: its JSX-comment stripper (`\{\s*\/\*[\s\S]*?\*\/\s*\}`) backtracked past the intended end and swallowed hundreds of lines of real code before the assertions ran. Line comments there instead; the warning sits at the site.

**Alternatives considered.** Rewriting the XP ladder so levels become reachable (rejected: to fit inside the 12-session countdown window a level must cost ~420 XP, which puts a 617-session save at level 70 and makes the number absurd — the ladder cannot be both sane in count and reachable in that window, so the city had to be the faucet). Keeping ~24 curated badges that pay SP (rejected: a third faucet for the same sink, and it keeps a screen Đàm never opens).

---

## ADR-083 — Round 42: a shape and the space reserved for it must be ONE number; a stack must carry its own axis

**Date**: 2026-09-08 · **Order**: *"Build lớn. Simplify mạnh… Tập trung nhiều hơn vào UX/UI. VÒNG 42 = KHÔNG GIAN: cái gì nằm ở đâu, to bao nhiêu, có vừa khung không. TOÀN QUYỀN."* Reported with three photographs of a real session.

**Context.** Round 39 moved the session goal and the break line OUT of the disc (inside it, every real goal ran across the stroke) and put them UNDER the ring. The position was right; the measurement was not, in two independent ways, and both were invisible to lint, tests, build and to any screenshot taken at the frame the author happened to use.

1. **Two expressions for one circle.** The ring was DRAWN at `min(canvasPx, viewportCap)` and then multiplied by a `transform: scale()`; the room under it was RESERVED from a SECOND expression, `min(canvasPx × scale + pad, viewportCap)`. A transform does not change layout, so the two agreed only while the cap did not bite. Measured 2026-09-08, iPhone 390 in full screen, session running: **427 px drawn, 281 px reserved, the goal line 32 px inside the arc** — «sức khoẻ» swallowed by the ring. Nine constants described this one circle (`immersiveTimerScale`, `fullScreenDesktopBoost`, `timerCircleBoost`, `timerCanvasSize`, `timerFootprintScale/Size/Height`, `ringViewportCap`, `fullScreenTimerScaleDown/CanvasDown`), and a test already existed pinning that two of them shared a cap — it stayed green through the whole failure, because it guarded the cap and not the multiplication after it.
2. **A stack mounted into a row.** `timerStageVisual` is a FRAGMENT of stacked blocks. A fragment has no layout of its own, so its children become children of whatever mounts it — and the desktop full-screen branch mounted it into `flex items-center justify-center`, a ROW. At 1280 and 2000 the goal line therefore sat at the ring's right edge, vertically centred, on top of the digits. No margin on that line could have fixed it.
3. **Absolute type next to a variable shape**, the same failure one layer in: eleven rem values across four breakpoints, hand-tuned for the ring size of the day. Round 39 had already paid for this once — raising the type 20 % pushed "180:00" 9 px past the disc.
4. Separately, three screens needed scrolling to reach a control while a timer ran: 355 px at 1280 (the Focus stage kept `min-h-[84vh]` under a 212 px postcard) and 887–1062 px in full screen (an always-mounted 890 px session notebook below the clock).

**Decisions.**
1. **`src/components/focus/ringMetrics.js` is the ONE owner of the ring's geometry.** `ringSizeCss()` returns a single CSS length used for the ring's `width`; `aspect-ratio: 1` derives the height from it. Three terms, smallest wins: a px ceiling (never absurd on a tall window) · **94 %** of its column (never off the edge, and the `inset-[-10%]` glow stays inside the card) · `calc(100svh − min(<reserve>px, <reserve>svh))` (never taller than the screen minus everything else). The reserve is declared per context with its parts named, so raising one means naming what grew.
2. **The slot around the ring has NO height of its own.** It is `height: auto` and hugs an ordinary in-flow box, so *what is reserved IS what is drawn* — there is no second number left to disagree. Nothing scales the ring by transform any more. `timerFold.test.js` fails if a `minHeight`/`height` returns to that slot, if any of the nine deleted constants comes back, or if a `scale` appears around the box.
3. **The reserve has two forms and the smaller wins** (px, and a share of the viewport). A px reserve is honest about what it counts — a button row, a line, the floating tab bar — but on a short screen those px are a much bigger share: at 375×667 a fixed 566 px reserve left a **101 px clock**, i.e. a screen "fitting" by deleting the only thing on it. The svh form makes the chrome give way first there, and it is honest only because the chrome really does shrink: the city postcard became `h-[min(168px,20svh)]`, unchanged at 844 px.
4. **Every string inside the disc is a FRACTION of the ring** (`cqw`; the ring box declares `container-type: inline-size`). The answer to Đàm's two questions — *what if the text were twice as long? what if the shape were 20 % bigger?* — is now structural rather than inspected. Six characters ("180:00", the stopwatch past 100 minutes) take the smaller of two ratios.
5. **The stage carries its own column, and is mounted in exactly one place.** The desktop full-screen branch that docked the buttons separately is deleted; there is no longer a caller that can choose the axis.
6. **A timer owning the screen means one screen.** Full screen is `h-[100svh] overflow-hidden`; the session notebook below it became a disclosure, closed by default (nothing removed — the scroll is now asked for instead of landed in). On the Focus tab, `min-h-[76/84/88vh]` applies only while idle, and the timer card's vertical padding halves while a timer runs (64 px is 10 % of a 667 px phone).
7. **The nav's silent marks speak.** The collapsed sidebar rail keeps its space saving (88 px instead of 232) but every icon carries its name, wrapped and never truncated; `attentionTabIds` (a Set) became `attentionByTab` (id → the reason in words: «Có việc» · «Tuần mới»). The expanded sidebar shows the word alone — a dot beside its own explanation is two marks for one fact.

**The gate (Việc 3).** `focus/ringText.test.js`. The glyph advance it measures with is not a home-made estimator: it is solved from ONE in-browser measurement round 39 recorded and then predicts two others it was not fitted to, both within 1 px — a constant that predicts measurements it was not fitted to is a measurement. On top of it the file proves 25 % of clearance for every clock string at every ring diameter the app can build (160 → 720 px), proves that the clearance RATIO is identical at every size (which is what "a fraction of the ring" means, and what absolute rem could never promise), checks the label and subline against the chord where they actually sit rather than the widest one, and **goes red on a 10-character clock and on a 35 %-oversized one** — a gate that passes everything is not a gate.

**Trade-offs.** The clock is ~5 % smaller at 390 px than the old hand-tuned value (68.5 px against 72) and much larger in desktop full screen (140 px against 135, with the ring at 720 px instead of a 290 px drawing inside an 821 px box). The desktop full-screen button row is no longer docked at the bottom edge; it sits under the clock like everywhere else. `container-type: inline-size` needs Safari 16+ / Chrome 105+ — below that the `cqw` sizes fall back to nothing, so the clock would render at the browser default; acceptable for a personal app on an iPhone and a Mac, and the reason the layout itself never depends on `cqw`. A declared reserve is checked by EYE at the four frames, not by a runtime measurement: a `ResizeObserver` feeding a size that feeds the layout that feeds the observer can oscillate and would run for 25 minutes on a battery — and the declared form fails SAFE, since too large only shrinks the ring and can never put text back on the arc.

**Counts, running Focus screen (Table 1).** Progress indicators 1 → **1** · numbers on screen 2 → **2** · colours 3 → **3** · cut text 0 → **0**. Measured by probe at 390 and 1280.

**Space (Table 2).** 375×667 · 375×812 · 390×844 · 1280×900 · 2000×1080, in idle · running · break · full screen: vertical scroll **0** in every running, break and full-screen cell (before: 355–1062 px in six of them); horizontal scroll **0** everywhere including Thống kê · Hành trang · Thành Phố · Cài đặt; gap between the ring and the line under it **12–13 px** in every cell (before: −32 to −452 px, i.e. text on the arc); ring reserved ≡ ring drawn in every cell. Idle still scrolls by design — the goal card, the day's missions and the Coach live below the fold — but «Bắt đầu phiên» ends at y=728 against a tab bar at y=774 on a 390 px phone.

**Rejected.** Patching the three reported symptoms separately (the ask was the root cause, and there was one). A `ResizeObserver` sizing the ring from the measured slot (see Trade-offs). Deleting the city postcard or the full-screen notebook to make things fit — «không xoá nội dung để cho vừa khung»: both were made to give way instead. Removing the collapsed sidebar mode (it returns 144 px to the content; what was wrong was its silence, not its existence). A browser-driven layout test as the Việc 3 gate: it cannot run in `npm test`, and what actually broke — two expressions for one circle, a stack in a row — is provable statically.

**Revisit when**: a fifth frame enters the acceptance set (add it to `FRAMES` in `ringText.test.js`, do not re-tune by eye); a new row joins the Focus stack (its height goes into `RING_HEIGHT_RESERVE_PX` with its own name, never into "safety"); Đàm asks for a bigger clock on the phone (the width budget is 94 %, and it is the binding term there, not the height); `container-type` needs a fallback for a browser he actually uses.

---

## ADR-082 — Round 43: the app names ONE destination, and stops telling distances in units nobody can spend

**Date**: 2026-09-08 · **Order**: *"không phải cái gì xảy ra lúc nào (vòng 41 làm rồi), không phải cái gì nằm ở đâu (vòng 42 đang làm), mà: tôi đang tiến tới cái gì, và vì sao tôi nên quan tâm."*

**Context.** Đàm counted at least eight units of progress on screen at once — XP · EP 222/1.867 · Cấp 5 · Kỷ 8 · gạch 4/6 · chuỗi ngày · nhiệm vụ ngày 0/3 · nhiệm vụ tuần +328 — while ADR-069 had already declared the only currency of this game to be a SESSION. He set the test that decides the round: *"Cột thứ ba là cột giết người: một đơn vị mà tôi không làm gì được với nó thì nó không phải tiền tệ, nó là tiếng ồn."* The audit found **twelve** units, not eight, and only two of them spendable (SP, and the bricks that become a building).

Worse, none of the twelve ENDS. Every one only grows, and a number that only grows cannot answer *"where am I going?"* — at 222 EP and at 22.000 EP the screen says the same thing, "keep going", which is the sentence a slot machine says.

**Decision.**

1. **The destination is the city, and the city is finite: 15 eras x 5 blueprints = 75 buildings.** `engine/journey.js` is the one place that says so; the denominator is summed from `BLUEPRINT_CATALOG`, never typed, so a 16th era moves the destination by itself. No ninth unit was created — the numerator is `summarizeMuseum().builtTotal`, the same bricks already counted.
2. **The top rail stops printing EP.** `describeRailProgress` answers in SESSIONS while a session estimate is honest, and falls through to the destination when it is not. It never falls back to EP, and `journey.test.js` fails if that guard is removed — `describeStageCountdown` has an EP-phrased branch, and letting it through would quietly restore the exact number this round removed.
3. **Every remaining distance changes unit.** The rank card's `3.955 / 672` (a met condition shown as a fraction larger than its own denominator) became `Đã đủ`; badge thresholds over two hours say hours, not four-digit minutes; the weekly chain's unlabelled `+328` says `+328 XP` with `≈ 6 phiên` under it; daily mission rows carry their unit at all.
4. **The city's fourth stat cell moved from decoration to destination.** `Cư dân 28` became `Thành phố 38/75 · còn 37`. Residents were derived, unspendable, and unaimable; and they did not leave the app — they still walk the streets in the picture directly above the cell, which says "28" better than the digits did.
5. **A close names the destination; an open never does.** `describeDayClose` / `describeWeekClose` take a `journeyLine`; the arc's opening moments stay light. A total is a reward when Đàm is already looking back and a demand when he is starting.
6. **The level countdown obeys the same reach ceiling as the stage countdown, and is silent past it.** Converting the old line into sessions is what finally made the level ladder legible, and what it said was *"còn ~155 phiên"* — 6.000 XP per level against a measured median of ~35 XP per session. `STAGE_COUNTDOWN_MAX_SESSIONS` exists to refuse exactly that number, so the line now hides instead of restating a wall in a friendlier unit.

**Rejected: paying XP for achievements.** 360 badges grant nothing, which is the emptiest third column in the app. Tier-scaled XP would have filled it using an existing unit — and it was measured before being rejected: bronze 64 · silver 87 · gold 89 · platinum 61 · diamond 59, at a modest 60/120/250/500/1.000, is **126.030 XP, about 21 levels, about 42 SP** across the whole game, against a tree of 36 skills. That is a second XP faucet large enough to dissolve the very one-currency rule this ADR enforces everywhere else. Badges stay a RECORD; the decision to reward them or delete them is left open and named in `TECH_DEBT.md`.

**Consequences.**
- `engine/journey.js` (pure) plus `hooks/useJourney.js` (the single store seam) are now the only source of the destination; a second hand-rolled fraction is a drift bug waiting to happen, and `components/journeyWiring.test.js` reads the call sites to catch it.
- `medianSessionEP` and the new `medianSessionXP` share one private `medianSessionField` — one median rule, two fields.
- `describeStageCountdown`, written with a threshold and a silence rule and its own tests, had been reachable from exactly ONE screen since it was written. That is the third time this project has shipped a finished engine function nobody called (`summarizeMuseum` was the first two). `journeyWiring.test.js` is the standing answer: **an engine test proves a function RUNS; it never proves anyone CALLS it.**
- Round 42 (layout and space) was unmerged while this ran, so nothing here moves, resizes or re-spaces anything: every change is text inside an element that already existed, or one stat cell changing what it reads.

**Alternatives considered.** Deleting the 360-badge grid (rejected: a real deletion of content in the one round that could not reshape the screen around it); showing the destination as a percentage (rejected: `51%` hides both ends, and the round-43 brief required a sentence that names what is done AND what is left).

---

## ADR-081 — Round 41: a day and a week that open and close; three kinds of surprise at three different beats; and the tool that finally photographs a moment

**Date**: 2026-09-08 · **Order**: *"Build lớn. Simplify mạnh. Làm game vui hơn và đầy dopamine hơn … Ba lần liên tiếp có thứ không nghiệm thu được là đủ rồi."*

**Context.** Round 40 added seven moments and kept the round-39 counts, but it ended the way rounds 36 and 37 had ended: with a promise nobody could see. Its three ending bursts were shipped on the evidence *"the DOM has 20 particles"* — which says they EXIST, not that they are any good. Đàm named the pattern: three rounds in a row is a hole in the tooling, not bad luck. Meanwhile the app still had no long rhythm: every morning looked like the last, and no day was ever closed, so no day ever felt finished.

**Decisions.**
1. **A moment is not shipped until it has been photographed** (`scripts/shot.mjs --dilate <rate>`). The diagnosis round 40 reached was half right: CDP's `Animation.setPlaybackRate` only drives WAAPI. The other half is that **one framer animation runs on TWO clocks** — `opacity` goes to WAAPI, `x/y/scale` are driven by framer's own `requestAnimationFrame` loop off `performance.now()`. Slowing one produced a photograph that lied: particles frozen halfway along their path with opacity already at 0, i.e. "present in the DOM, invisible on screen" — exactly the false negative of round 40. `--dilate` patches `performance.now()` and the rAF timestamp in the page before the bundle loads AND sets the WAAPI rate to match, so the whole animation crawls together; `Date.now()` is untouched, so the session clock, the `__NOW±s__` fixture stamps and every app calculation still run in real time. With `--frames n --frame-gap ms` a moment comes back as a filmstrip.
2. **What the first photographs showed, fixed the same day.** Two faults no test could have caught: a third of the confetti was `--accent2`, which on the dark canvas reads as a smudge rather than a spark; and a full circle around a glyph that sits above a headline throws half the confetti through the words. The burst is now TWO legible colours and an upward fan (−165°…−15°) with a gravity arc, in varied shard sizes. `rewardBurst.test.js` locks both lessons.
3. **The day opens and closes** (`engine/dayArc.js`, `components/focus/DayMoment.jsx`). A banner, 7 s, tap to dismiss, nothing left behind: the first open of a day greets you with what yesterday was and how long the streak is; the day closes the moment its goal falls, or in the evening with at least one session behind it. **No branch reads as a failure** — Đàm's constraint, and the reason there is no "you did not reach it" copy anywhere in the file: *"nếu app làm tôi thấy tệ khi làm ít thì tôi sẽ tránh mở nó."* A day with zero sessions is never mentioned at all.
4. **The week opens and closes** through the same machinery — a new week's opening also stamps the day, so the two never stack, and Sunday evening closes it. Priority: a close outranks an open, the week outranks the day.
5. **Three kinds of surprise, at three different beats.** «Gạch đôi» (ADR-080) still lands at the ending. **«Guồng vàng»** lands mid-session: rarely, one beat of a session comes up golden and that session pays +15 % XP, revealed as a chip in the ending. It is a HASH of the day and the number of sessions already done today, not dice — so the running screen and `assembleSessionReward` agree without passing any state, and a reload or a background tab can never re-roll it. **«Thợ đêm»** lands at the open of a day: sometimes the scaffold moved overnight (one brick, ~16 %), and the morning banner names the project. It can never finish a building — that ending belongs to a session.
6. **The rhythm is a property of the clock, not of 25 minutes.** Round 40's four beats were measured on one duration; a 90-minute session got 40 minutes of silence twice. No gap may now exceed 15 minutes: wider ones are filled with evenly spaced «Vẫn trong guồng» beats (and «Cứ nghỉ tiếp» on a long break). A 25-minute session keeps exactly its four original beats.
7. **The three round-40 open questions, decided.** «Đoạn cuối» does NOT carry the task name — the session goal already sits under the ring and would be said twice. The ripple STAYS at two waves — the photographs show it reading as a pulse of the ring rather than a distraction, with its reach capped at 1.42× so it dies inside the card. The lucky brick is now **skipped on 2-session projects**: doubling one finishes it on the spot and spends the «công trình hoàn thành» moment on nothing.

**Trade-offs.** The arc stamps live in `localStorage`, not in the synced save: a second device may greet the same morning twice, which is the price of never making a greeting contend with a session for the compare-and-swap write (`docs/OPERATIONS.md`). The night crew does write game state once a day. `--dilate` is a tool-only patch and never reaches `dist/`.

**Counts, running Focus screen (Table 1).** Progress indicators 1 → 1 · numbers 2 → 2 · colours 3 → 3 · cut text 0 → 0. The banner is a fixed overlay that never appears while a timer runs; the golden whisper reuses the same label slot as every other beat.

**Rejected.** A morning gift stored in the synced save (a write on every app open, contending with real data). A "lucky streak" counter of any kind (a counter is a countdown, and a countdown is gambling grammar). OS notifications for the long rhythms (they pull the eye; a banner waits until the app is already open). Closing a zero-session day (there is nothing to say, so the app says nothing).

**Revisit when**: Đàm reports the morning banner as noise (then keep only the gift and the day close); a second device greeting the same morning becomes annoying (then move the stamps into the save behind the session write, never in front of it); the golden beat's 15 % starts to feel expected (then vary which beat, never the size).
## ADR-080 — Round 40: things that HAPPEN AND VANISH — session beats, a tiered ending, the lucky brick, a designed break; the static budget stays at zero

**Date**: 2026-09-08 · **Order**: *"Build lớn. Simplify mạnh. Làm game vui hơn và đầy dopamine hơn … Vòng 39 dọn xong thì lộ ra chỗ trống. Vòng này lấp chỗ trống ấy. Ngân sách thứ đứng yên: 0."*

**Context.** Đàm counted a five-session day: ~152 minutes in the app, of which ~125 are "a number going down. Nothing else." Rounds 33–39 removed three currencies, four dialogs, every Claim button, the city movie, the milestone toasts and (round 39) everything that stood next to the clock — each removal right, their sum a timer with nice graphics. The one law that reconciles *simplify* with *dopamine*: what STANDS on the screen is noise (round 39 removed it); what HAPPENS and is GONE is reward (this round adds only that). Acceptance: round 39's counts unchanged (1 indicator · ≤2 numbers · ≤3 colours · 0 cut text) AND a ledger of moments, each with a duration and an exit.

**Decisions.**
1. **Session beats** (`engine/sessionBeats.js`, pure; `focus/BeatRipple.jsx`). A 25-minute session has four moments of its own — *Vào guồng* at 5:00 (a fifth of the session, capped at five minutes), *Nửa đường*, *Đoạn cuối* at −5:00, *Phút cuối* at −1:00 as the visual twin of the bell that already rings there. A beat is an 8-second window: the ring's label whispers the beat in the arc's colour (no digit, ≤ 12 characters — the label slot of round 39, nothing added), two rings swell out of the clock and fade (1.9 s), then the state label returns. Beats are a function of ELAPSED time, never of ticks: a background tab catches up on its first tick and a beat it slept through is simply gone (`resolveBeat` returns the last open window or null). No sound of their own. Sessions under 10 minutes get only *Nửa đường*; under 2 minutes, nothing.
2. **The tab strip is the peripheral channel.** The title carries a phase glyph ○ ◔ ◑ ◕ ● (`sessionPhaseGlyph`) that changes four times a session — the only thing that moves while the tab sits in the background, and it is a shape, not a count. On a break the title reads ☕ and, in the last minute, ⏰. The ring's glow WARMS with progress (60 % → 120 % of its round-39 strength) — the one thing that "grows slowly and completes", a property of the ring rather than an element.
3. **The break is designed with the same machinery** (`planBreakBeats`): *Đứng dậy* at 0:20, *Uống nước* halfway, *Sắp hết nghỉ* at −1:00, in `--good`. The existing break-over cue and OS notification remain the return signal; the city on the postcard is alive during a break (it was already: `still` only while focusing) — that is what there is to look at while resting.
4. **A tiered ending** (`shared/RewardBurst.jsx`, three sizes = three tiers; `focus/BrickRow.jsx`). *Brick*, every session: the new brick DROPS from above and lands with a squash, a puff of six dust particles (0.7 s). *Building*, every few sessions: a light ring plus twelve confetti (1.1 s). *Rare* — streak milestone, level, rank, relic, relic evolved, era, a finished weekly chain: a full-screen wave, twenty-four confetti and an accent flash (1.4 s) behind the card. Same three colours, fixed particle pattern per index (deterministic, so a screenshot is evidence), pointer-events none, no button, no hold: it bursts, it never blocks.
5. **The lucky brick** (`rollLuckyBrick` in `engine/sessionBrick.js`; `LUCKY_BRICK_CHANCE = 0.12`, `LUCKY_BRICK_MIN_MINUTES = 15`). After the normal queue advance, the injected dice may lay ONE extra brick on the queue head; it may finish the building. Never when a building just finished (that ending is the bigger moment), never for short sessions, never shown as odds or a countdown, never negative — a miss is "bình thường". `pendingReward.luckyBrickId` names it; the card says «Gạch đôi — hôm nay may!», wears a 🍀 chip, gets the building-size burst, and two bricks drop. On the session axis only: `sessionsRemaining` moves, `sessionsCompleted` does not (ADR-069 holds).
6. **Round-39 leftovers** (Việc 5). The reward-tier scale now lives inside the three colours (muted · accent2 · accent · ink; pips and labels carry the rank). The era chip strip WRAPS instead of scrolling — the scroll-to-active machinery is deleted with it. Era colours on the City tab are KEPT: fifteen eras need an identity and the City tab is not the Focus screen. The clock subline stays without the daily goal (§9 of round 39: no).

**Trade-offs.** A beat can be missed (by design — nothing queues, nothing stays). A glyph in the title is a change every ~6 minutes in the tab strip. The lucky brick shifts building pace by ~12 % on average; that is the price of a real surprise and it is only ever upward. Green and yellow leave the reward-tier palette; the four tiers still read by label and pips. The era grid takes three rows at 390 px.

**Counts, running Focus screen (Table 1).** Progress indicators 1 → 1 · numbers 2 → 2 · colours 3 → 3 · cut text 0 → 0. Every moment below lives inside those numbers: a whisper replaces the state label, a ripple is the ring's own outline, bursts belong to the ending overlay.

**Ledger of moments (Table 2).** Vào guồng · Nửa đường · Đoạn cuối · Phút cuối — 5:00 · 12:30 · 20:00 · 24:00 of a 25-minute session — 8 s each (ripple 1.9 s) — gone. Đứng dậy · Uống nước · Sắp hết nghỉ — 0:20 · half · −1:00 of a break — 8 s — gone. Brick drop + dust — the ending's project card — 0.9 s — gone. Building burst — when a building finishes — 1.25 s — gone. Lucky double brick — ~1 session in 8 — burst 1.25 s, chip for the life of the card — gone with the card. Rare burst — rare cards — 1.55 s — gone. Glow warmth and the title glyph are properties, not elements.

**Rejected.** A progress bar or percent for the brick during the session (a second indicator — round 39 just removed it). OS notifications at beats (they pull the eye; the tab glyph does not). A fourth currency or a "lucky streak" counter (ADR-069; a counter is a countdown). A spin, a chest, odds on screen (gambling grammar). Keeping the era strip scrolling with a smarter align (it still cut the first chip).

**Revisit when**: Đàm reports a beat as distracting (then drop the ripple and keep the whisper, or lengthen the windows apart); a skin's `--good` and `--accent` are too close for the break whisper; the lucky brick makes long buildings finish too fast (then lower the chance, never add a cap counter); Reduce-motion users ask for the beats back (then the whisper alone is the beat — it already is).

---

## ADR-079 — Round 39: while a timer runs, the Focus screen IS the timer — one ring, three colours, nothing cut

**Date**: 2026-09-07 · **Order**: *"Một chủ đề duy nhất: DỌN GIAO DIỆN MÀN TẬP TRUNG. Không thêm tính năng. Không tách file. Không đóng nợ kỹ thuật … mở app lên, liếc một cái, biết ngay còn bao lâu và đang làm gì — không phải đọc."*

**Context.** On a running Focus screen Đàm counted six progress indicators (clock ring · brick row · "79% viên gạch này" · "Phiên 0/5 hôm nay" · the era bar on the postcard · the mission bars in the right column), thirteen numbers, six colours and at least three cut texts. The break ring drew two arcs (green session arc over the yellow daily-goal arc) that he read as one broken ring. The line under the clock said "Phiên 0/5 hôm nay" on the Mac and "0/300 phút hôm nay" on the iPhone for the same state, and "0" while a session was running. Each of those was true and defensible on its own; together they made the screen something to read instead of something to glance at.

**Decisions.**
1. **One progress indicator while a timer runs: the time left.** The outer daily-goal ring is deleted (its constants, motion, circle and the "clamp at 100 %" logic). The brick strip renders only its headline while running («Đang xây X» — no number, no brick row, no percent; `describeSessionBrick` keeps the numbers in `sub` for the idle strip and the ending). The postcard is a picture only while ANY timer runs (`quiet`: no caption, no scrim, no era bar). The «Giải lao dài» pill above the ring is gone — the ring label says it. `pickFocusMoment` returns null while any timer runs, every branch. Nothing is deleted from the app: all of it returns the moment the timer stops.
2. **One line under the clock, the same on every device: an ordinal.** `describeClockSubline` (`engine/timerSession.js`, pure): «Phiên thứ N hôm nay» while idle or running, «Xong N phiên hôm nay» on a break. The daily-goal fraction was a per-DEVICE setting (sessions on the Mac, minutes on the iPhone) — it now lives only on the idle postcard caption («Hôm nay 2/5 phiên»), in the goal's own unit. Every string of this line must fit the disc's chord at 390 px (≈ 22 characters); that is geometry, not copy taste, and the test pins the length.
3. **The session goal and the break line sit UNDER the ring, not inside it.** Inside, the disc's chord one line below the number is ~96 px at 390 px, so every real goal ran across the ring's stroke. Under the ring: same card, above the buttons (still above the fold while running), full width, wraps, no clamp.
4. **Three colours on Focus: canvas · ink · ONE accent** — `--accent` while focusing, `--good` on a break; the number wears the arc's colour and the glow is mixed from the same token (`color-mix`). Gone: the red flash of the last ten seconds, the blue break number, the gold Coach (`COACH_COLOR = var(--accent)`), and every Tailwind palette class in `PomodoroEngine.jsx` + `focus/*` (75 identical light/dark ternaries collapsed on the way). `timerRing.test.js` rejects any palette class in those files.
5. **While a timer runs the chrome goes too** — one flag, `anyTimerRunning` (`App.jsx`), for focus AND break: the desktop right column (Coach, missions, daily bonus, weekly chain, rank), the phone's missions + Coach cards, the top rail, the streak card, the voice line. Until now a break kept all of it on screen.
6. **No `truncate` anywhere except the tab bar's safety net.** Twenty sites became wrapping text (`whitespace-normal break-words`, `leading-snug`); the postcard greeting wraps with no clamp; the weekly voice line was shortened to fit one line at 390 px («Tuần mới — xem Thống kê so tuần trước»). The three tab-bar `truncate` stay as a net over labels measured to fit, with a comment saying so.

**Trade-offs.** The daily missions cannot be checked mid-session on desktop any more (they were never on the phone's running screen). The ordinal says nothing about the daily goal while running — by design: the goal is a reason to start, not something to watch. The Coach lost its gold identity for the skin's accent. Wrapped labels can grow a row by a line (preset cards, category chips) — height is cheaper than a cut word.

**Counts (running state, dark, 617-session fixture, by eye on the after-shots).** Progress indicators 6 → 1 · numbers on screen 13 → 2 on desktop, 8 → 2 on the phone · colours 6 → 3 · cut or ring-crossing texts ≥ 3 → 0 · `truncate` sites in `src/` 20 → 3 (tab bar).

**Rejected.** A smaller ring at 390 px so the goal fits inside (the ring is the one thing that must stay big). Keeping the daily-goal ring "only when a goal is set" (a second arc is a second indicator whatever its gate). Clamping the greeting to two lines (a clamp is an ellipsis waiting to happen). Recolouring the City tab's per-era colours (they are the era's identity; logged for Đàm's call).

**Revisit when**: Đàm wants the daily goal while running (then «Phiên thứ 3/5 hôm nay» — still one line, still device-independent); a skin's `--good` sits too close to its `--accent` (then the break needs its own token); the idle screen is judged by the same three-colour rule (the idle right column still carries `--good` on done states).

---

## ADR-078 — Round 38: the city lives on the Focus screen; the auto-pick is changeable in place; the reward assembly is a pure engine function; #86 gets a lint gate

**Date**: 2026-09-07 · **Order**: *"Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào UX/UI … thôi dọn, bắt đầu xây."* Six streams, one report law (A for Đàm, B for the advisor).

**Context.** The 3D city is the most expensive thing in the project and the Focus screen showed it as a ghost: `CityBackdrop` at 50 % opacity under a scrim that hid up to 92 % of it where the eye lands, frozen on phones, absent at zero buildings. Round 37 had added the brick strip but removed the two bridges (`CityGrowthMoment`, `FocusCityTease`). The auto-picked project could only be changed on another screen. `completeFocusSession` was ~710 hand-written lines. Round 37 shipped three sounds nobody had heard, and #86 (137 hand-drawn buttons) had a door but no gate. Two §9 questions were open.

**Decisions.**
1. **The city is a POSTCARD, not a backdrop** (`components/focus/CityPostcard.jsx`, pure data in `focus/cityPostcard.js`). Same scene, same `CityStage`, framed at full opacity as the first block of the Focus column; still while a session runs, alive when idle; camera on this session's scaffold (`CityStage` now forwards `selection` for non-interactive tenants), or on the building the last session finished until the next session starts (`ui.postcardFocusBpId`, in-memory). At session 1 a PHANTOM scaffold shows the auto-pick's plot, appended after the queue exactly where `autoQueueSessionProject` will append it (same plot, no move — ADR-007 concerns built buildings only). *Alternatives rejected*: raising the backdrop's opacity (fights every text line above it, ten skin × theme combinations); a canvas snapshot pipeline (needs `preserveDrawingBuffer` or renderer changes, i.e. touching the forbidden black box); a 2D silhouette (Đàm wants the 3D city). *Paid for*: the streak card moved under the timer (`belowTimer` slot of `PomodoroEngine`), the era bar moved into the postcard's caption (`shared/EraStageBar.jsx`, one component for the top rail and the caption), the greeting became the caption — the Start button rose ~60 px at 390 px instead of sinking.
2. **Change the auto-pick where you stand** (`chooseSessionProject`, `listSessionProjectChoices` in `engine/sessionBrick.js`; store `setSessionProject`; «Đổi công trình» on the strip). Queued projects first (they keep their bricks), then fresh blueprints cheapest first; a full queue evicts the last item with no brick laid, never one with bricks; restorations keep their own door. Idle only.
3. **`assembleSessionReward` (`engine/sessionRewards.js`) is the reward.** The body moved verbatim; `state` replaces both `get()` and `prev` (synchronous action), and every clock, calendar, settings read and dice roll is a parameter (`now` · `today` · `weekKey` · `dailyGoal` · `random`). Ten helper clusters left the store the same way (`feedNotifications` · `achievementState` · `streak` · `overclock` · `trackingDefaults` · `eraScope` · `buildingPerks` · `historyStats` · `longBreakCycle` · `savedNotes`; `lib/isRecord.js`; `BLUEPRINT_LOOKUP` deduplicated into `buildChoices.CATALOG_LOOKUP`). `gameStore.js` 4,677 → 2,879 lines. Found and closed on the way: the streak bonus formula written twice (`todayHero.js` vs the reward) → `streakBonusRate` in `engine/streak.js`.
4. **`COACH_BUCKET_MIN_SAMPLE` 4 → 3, ONE definition** (`gameMath.js`, re-exported by `coachIntel.js`; it used to exist twice). A one-session-a-day user waits most of a week per hour bucket at 4; the Wilson lower bound remains the brake and `thin` still marks anything under the floor.
5. **#86 gets a GATE, not another sweep** (`eslint.config.js`, `no-restricted-syntax`): a `<button>`/`<motion.button>` whose `className` carries a Tailwind palette colour, or whose inline `style` carries a hex or numeric rgb()/rgba() literal, is a lint error. Discovery-based (every file), the only exemption is the door itself (`shared/ActionButton.jsx`) and pure white (white-on-accent is the door's own recipe). The rule found 57 className and 43 inline-style literals; all now read skin tokens, and 11 true action buttons (Settings 5 · Journal 5 · Notification Center 1) go through `ActionButton`. Tabs, chips and toggles stay raw buttons — they only have to read tokens.
6. **Sound and haptics closed by a test, not a promise** (`engine/soundEngine.cues.test.js`): a stub `AudioContext` records every oscillator; start · last minute · brick landing · finish · break over are pairwise different and never silent in all four packs; the start cue is scheduled inside the tap (autoplay-safe); no vibration code exists because iOS Safari has no Vibration API — a test goes red if one appears.

**Trade-offs.** The postcard costs one WebGL context on the Focus screen while idle (0 rAF while a session runs; the FPS watchdog falls back to 2D exactly as the City tab does). The gate blocks a whole class of quick hacks, so a new coloured button must either use the door or a token. `assembleSessionReward` is still ~750 lines — pure and tested, but one function; splitting it into named stages is the next cut.

**Ledger, rounds 33–37 (Việc 5).** Removed from sight: 1 tab, 3 currencies, 4 dialogs, every Claim button, 6 Stats tabs, the weekly-report dialog, the onboarding overlay, the city moment, the city tease (≈ 20 things). Added to sight: the Build screen's one button, the reward card chain, relic growth, the «Kế tiếp» badge block, three Stats answers and the «Bắt đầu N phút» button, the brick strip and brick row, optional-goal chips, three sounds (≈ 10 things). **Verdict: thinner** — the floor is clean, the walls are bare. Consequence: this round's free effort went to ADDING what is seen (the postcard, the in-place switch, the recoloured controls), not to more cleanup.

**Revisit when**: the postcard's idle rendering shows up as battery drain on Đàm's phone (then default `still` on phones again, as the backdrop did); a second tenant needs the camera-focus API (then lift `postcardSelection` into `engine/`); the gate blocks a legitimate brand colour (then add a named token, never an exemption).

---

## ADR-077 — Round 37: a session always lays a brick; Stats answers on whole sessions; the goal is optional; missions and the weekly chain leave the store; the weekly report folds into Stats

- **Date**: 2026-09-06 (late night). Branch `claude/game-development-engagement-xvqc2h`, merged into `main`.
- **Context**: Rounds 33–36 removed tabs, currencies, "Claim" buttons, six Stats tabs and the sleeping
  economy. Đàm's round-37 order: *"Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào
  UX/UI"* — seven streams, full autonomy, "thà xong bốn mạch trọn vẹn còn hơn bảy mạch dở dang".
  Audits (six read-only sweeps) found: the heart of the new Stats screen depended on goal reviews that
  its only player rarely gives; the ending was an auto-advancing chain of number cards preceded by a
  separate 3.2-second "city moment" overlay; a session with an empty build queue built nothing;
  `PomodoroEngine.jsx` was 2,958 lines and `gameStore.js` 5,413; the weekly report dialog (916 lines)
  answered the same question the Stats screen now answers; `forgiveness` was a write-only key;
  `playTick` and `tickSoundEnabled` had no caller; "last minute" had no sound of its own.
- **Problem**: the loop had become thin and quiet, and its most-watched screens still carried empty
  boxes and gates that only existed because they had been coded.
- **Options weighed**
  1. *Stats "strongest" lines* — (A) keep the goal basis and make goals mandatory with one-tap chips
     (rejected: the gate had nobody behind it); (B) switch the AI Coach to the same new basis
     (rejected: the anti-hallucination guard has scored fixtures on goal-rate wording, and goal-rate is
     the sharper instrument where it exists); **(C) chosen**: `buildFocusProfile` counts
     `started`/`whole` per bucket next to the goal counters; Stats ranks on the whole-session rate
     (started · not cancelled · not self-rated "Chưa đạt") with the same Wilson brake; the Coach is
     untouched. Below the sample floor the line still answers with the busiest bucket (`thin`).
  2. *The one new thing* — (A) animate the 3D city during the session (rejected: black box, second WebGL
     context on iPhone); (B) a day strip of sessions (rejected: another statistic); **(C) chosen**:
     "this session's brick" — `engine/sessionBrick.js` describes which building the session pushes,
     the strip above the ring fills the current brick with the timer, and the ending's project card
     lands it (`BrickRow`, `playBrickLaid`). It replaces the milestone toast + combo/multiplier badges
     (same height budget) and the one-line city tease.
  3. *Empty build queue* — (A) leave it (a session builds nothing); (B) block Start until a project is
     chosen (a gate); **(C) chosen**: `autoQueueSessionProject` queues the first of `listNextProjects`
     right before the queue advances — the same pick the strip showed before Start; changeable on the
     Build screen. The City empty state and the first ending now name that project.
  4. *Weekly report* — (A) keep the modal; **(B) chosen**: delete it. Monday still invites (toast), a
     missed toast still leaves the never-expiring dot — now on the Thống kê tab — and "seeing" is
     `markWeeklyReportSeen()` + the Stats tab. The interruption law of ADR-060/061 holds unchanged.
  5. *`forgiveness`* (round-36 question 2) — (A) remove it with the sleeping-money migration;
     **(B) chosen**: remove now. It was a weekly-reset counter with no consumer and no granter since
     ADR-069/071; unlike resources/RP it never held anything Đàm earned, so no confirmation is needed.
     Resources · research · refining · tinhThe · staking stay dormant until Đàm confirms (#99).
  6. *Week comparison* (round-36 question 1) — one law: compare equal windows. When BOTH same-span
     windows are empty (Monday 04:00), the window moves back one week: last full week vs the week
     before, labelled by the engine (`WEEK_SCOPE`). A "Sunday-evening full-week variant" was rejected:
     a second formula for a four-hour window.
  7. *Haptics* — none. iOS Safari has no Vibration API; the checkbox-`switch` trick is undocumented
     behaviour. A code path a Mac + iPhone user can never feel is dead code.
  8. *Sound* — three signatures: start (unchanged rising pair) · last minute (`playLastMinute`, one
     bell at 60 s; countdown ticks only in the last 3 s) · finish (unchanged); break-over gets its own
     `playBreakOver`; the ending's brick gets `playBrickLaid`; the XP card is silent; `playTick`,
     `tickSoundEnabled` and `playExtensionReady` (a copy of the milestone chime) are deleted.
- **Decision**: all of the above, plus: the session goal is optional (Start never blocks; recent goals
  are one-tap chips in the goal card, same task type first); daily missions and the weekly chain become
  pure modules (`engine/missions.js`, `engine/weeklyChain.js`, `engine/seededRng.js`) — the store's
  hand-written live tick is replaced by `tickDailyMissions`, which rebuilds from history WITH the
  finished session (live = reload, one formula); `ActionButton` moves to `shared/ActionButton.jsx` as
  the single door for #86 (sizes `sm`/`md` added); seven leaf controls move to `components/focus/`;
  `OnboardingOverlay` (three static cards) is deleted because the Focus strip already tells the first
  session what it builds.
- **Trade-offs / what was lost**: the weekly report's charts and "best day/block" lines; the combo and
  multiplier chips on the Focus screen (they still show on the ending); the 5-minute "extension ready"
  chime; the 25/50/75% milestone toast; the choice to leave the build queue empty; the mandatory goal.
- **Impact**: `gameStore.js` 5,413 → 4,696 lines; `PomodoroEngine.jsx` 2,958 → 1,922; deleted
  `WeeklyReportModal.jsx` (916), `CityGrowthMoment.jsx`, `FocusCityTease.jsx`, `cityMoment.js`,
  `useCityMoment.js`, `OnboardingOverlay.jsx`, `focusGoalJump.js`, `missionXp.js`, `weeklyXpNote.js`;
  new `engine/{missions,weeklyChain,seededRng,sessionBrick}.js`, `components/focus/*`,
  `shared/ActionButton.jsx`, `lib/keyboard.js`, `hooks/useMinWidth.js`; 37 new tests. Synced JSONB
  shape: `forgiveness` no longer written (old rows keep it harmlessly); nothing else changed.
- **Review conditions**: if Đàm wants to choose every project himself → make auto-queue a setting; if
  the last-minute bell annoys → drop it, keep the three ticks; if the whole-session rate reads 100%
  in every bucket on the real save → add average length as the tiebreak (still one law); #86 is
  "door built, tenants not moved" — migrate the remaining hand-drawn buttons through `ActionButton`
  next.
## ADR-076 — Document governance runs on DISCOVERY, not on a hand-written list

- **Date**: 2026-09-06 (night, after ADR-075)
- **Context**: ADR-075 left six guards protecting the documentation budget, but every one of them
  read a hardcoded array (`REFERENCE_DOCS`) or a two-entry limit table. Đàm asked the right question:
  *what about the files that later work creates — is there a solution, or will it just grow back?*
- **Root problem**: a guard driven by a list only governs what someone remembered to add. Proof was
  immediate: three archives created **that same day** (183,626 · 223,614 · 246,133 chars) were
  already outside the list and therefore outside every gate. That is exactly how this repository
  reached 2.7M chars in the first place — nothing was watching the files nobody listed.
- **Options considered**:
  1. Keep the list and add a rule ("remember to register new docs").
  2. A generated budget file (`doc-limits.json`) that every doc must appear in, regenerated on demand.
  3. Discover every `.md` and classify it by PATH CONVENTION.
- **Why the others were rejected**: (1) is the failure mode itself — a rule with no enforcement is
  the "threshold with no guard is a funnel" lesson repeated. (2) works, but a per-file number is a
  maintenance chore and a lazy session can regenerate it to make red go away, which defeats the
  ratchet.
- **Chosen solution**: option (3). `discoverDocs()` walks the tree (skipping `node_modules`, `.git`,
  `dist`, `coverage`) and `classify()` assigns a class from the path alone:
  `docs/archive/**` → archive (capped only by the context window) · the four auto-loaded files →
  their explicit char limits · append-only logs → journal (rotation limit) · **everything else →
  active** (context-window ceiling, warning at half a window). A file that does not exist yet already
  falls into "active", so it is governed the moment it is created — nothing to register, nothing to
  remember.
- **Also**: the rotation class grew from 2 files to 4. `TECH_DEBT.md` and `ARCHITECTURE_DECISIONS.md`
  are append-only too — new debts and new ADRs arrive with every session — so they now carry rotation
  limits (120,000 and 250,000 chars) that force shedding old entries into `docs/archive/`.
- **Break-tested**: creating `docs/FUTURE_THING.md` at 900,000 chars turns the ceiling gate red
  naming that file, though no list mentions it; padding `TECH_DEBT.md` past 120,000 chars turns the
  rotation gate red.
- **Trade-off**: discovery costs a directory walk per test run (negligible) and the classes are
  coarse — a genuinely special document cannot get a bespoke limit without adding it to a table. That
  is deliberate: coarse rules that need no maintenance beat precise rules nobody maintains.
- **Addendum 2026-09-07 — the gate now heals itself.** A red rotation gate used to say "move old
  entries to `docs/archive/`" and leave the HOW to the next session, which then had to measure, read
  and write a one-off script — the opposite of Đàm's requirement *"nếu file phình to thì cũng tự biết
  giải quyết"*. `node scripts/doc-budget.mjs --rotate <file>` (or `--rotate-all`) now does it: each
  append-only log declares how its entries are delimited and ordered; rotation keeps the newest until
  the file is under 60% of its limit, moves the rest VERBATIM into a fresh dated
  `docs/archive/<name>_<date>.md` (so no archive can outgrow a window either) and leaves a title
  index where the entries were. `TECH_DEBT.md` moves only entries whose own title says closed — never
  "PHẦN LỚN ĐÃ XỬ LÝ" — and tells a human when the remaining open debts must be split by subsystem.
  The gate's error message names the exact command. Proven end-to-end: `BAN_GIAO.md` padded to
  126,731 chars → red → `--rotate` → 59,883 chars, 12 entries = 11 kept + 1 archived, structural
  sections intact, green. Two bugs caught by the dry run before trusting it: it rotated files that
  were still under their limit (now only over-limit, or `--force`), and it treated "mostly resolved"
  as closed.
- **Also**: operating rule #4 in `CLAUDE.md` — **build, don't audit**. `npm test` green means the doc
  system is healthy; a session must not re-measure or re-survey it before the task in the prompt.
- **Review conditions**: if a legitimate document must exceed one context window, do not raise the
  ceiling — split it, and if splitting is genuinely impossible, that is the signal to revisit this ADR.

## ADR-075 — Retrieval architecture: freeze closed knowledge, cap every file at one context window, guard it

- **Date**: 2026-09-06 (night, same day as ADR-073/074)
- **Context**: after ADR-073 (splitting `CLAUDE.md`) and ADR-074 (English), the always-loaded cost
  was down to ~10,000 tokens/session. The remaining waste was no longer *storage* but **retrieval**:
  `TECH_DEBT.md` 252,634 tokens (126% of a 200k window), `ARCHITECTURE_DECISIONS.md` 227,878 (114%),
  `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md` 282,237 (141%). Three files could not be read in one
  session at all, and every `grep` waded through knowledge that was already closed history.
- **Root problem**: the docs mixed **active work** with **closed history** in the same file. A closed
  debt entry and a superseded ADR are consulted rarely, but were being paid for on every lookup. The
  `cat`-ban written in ADR-073 reduced accidents; it did nothing about the cost of legitimate reads.
- **Options considered**:
  1. Leave it; rely on the `cat`-ban and `grep` discipline.
  2. Delete or summarise closed entries and old ADRs.
  3. Freeze closed knowledge into `docs/archive/`, keep a full one-line index in the active file,
    and add guards so no file can exceed one context window again.
- **Why the others were rejected**: (1) leaves three files literally unreadable in one session, and
  the project rule "a threshold with no guard is a funnel" applies to `grep` discipline too.
  (2) violates the project's own rule *"never delete an old ADR, even when a later decision reverses
  it"*, and every closed debt entry carries the root-cause analysis that stops the same bug returning.
- **Chosen solution**: option (3).
  - `TECH_DEBT.md`: 40 closed entries → `docs/archive/TECH_DEBT_CLOSED_2026-09-06.md`, verbatim, all
    14 fields intact. Active file keeps a 40-line index (number + title) pointing there.
    Stale threshold snapshots (13 accumulated status blocks, 28,849-char header) also moved: the
    header is now 1,858 chars, so `head -60` finally returns the rules instead of old counts.
    **435,288 → 248,959 chars (252,634 → 144,492 tokens; 126% → 72% of a window).**
  - `ARCHITECTURE_DECISIONS.md`: 50 oldest ADRs → `docs/archive/ADR_ARCHIVE_001-050.md`, verbatim,
    with a 50-line index in the active file. The 25 newest stay hot.
    **392,634 → 159,441 chars (227,878 → 92,537 tokens; 114% → 46%).**
  - `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md` split at a date boundary into two parts
    (141% → 70% and 71%).
  - `START_HERE.md` de-duplicated against `CLAUDE.md`: three of its six "laws" and its whole lookup
    table were restatements of rules `CLAUDE.md` owns.
  - Three new guards, each adversarially break-tested: **canonical rule** (no auto-loaded file may
    restate a rule another owns) · **pointer** (every `.md` reference must resolve) ·
    **context-window ceiling** (no reference doc above 200k estimated tokens).
- **Trade-off**: looking up a closed debt or an old ADR now costs one extra hop through an index.
  That is the right trade: the index carries the title, which answers most lookups on its own, and
  the cost is paid only by sessions that actually need cold knowledge — instead of by every session
  that greps the file.
- **⚠️ Measurement lesson (the third this day)**: the first corpus measurement reported the whole
  `.md` corpus shrinking by 665,806 chars, which would have meant catastrophic data loss. It was the
  TOOL: the newly created archives were untracked, and `git ls-files` silently excluded them. Re-run
  over the working tree the corpus is **+14,294 chars** (indexes and archive headers) — nothing lost.
  Same family as ADR-074's diluted ratio: *the denominator contained something outside the question*.
- **Fifth finding — the biggest repeated cost was not a document at all.** `npm test` prints one line
  per test: measured on 1,609 tests, `test:fast` emits **9,802 lines / 408,514 chars ≈ 230,000
  tokens** — a single validation run costs more than a whole 200k context window, and 23× the entire
  always-loaded context it was validating. Added **`npm run test:quiet`**: the `dot` reporter to
  stdout plus a `tap` reporter to a temp file, from which only the summary is printed, so the
  documented `# skipped 1` signal survives and failures still print in full.
  **2,132 chars, −99.5%.** This is the highest-ROI change of the day and it was invisible while only
  documents were being audited — token efficiency is a property of the whole operating model
  (tool output, command choice, reporters), not just of markdown.
- **Second pass, same day**: `CHANGELOG.md` 266,956 → 56,535 chars (78% → 16% of a window; 80% of its
  bulk was one past month) and `BAN_GIAO.md` 240,561 → 58,013 chars / 3,109 → 711 lines — the latter
  simply enforcing `PHASE_RULES.md` §5, a rule that had existed unenforced while the file tripled.
  A sixth guard (**rotation**) now fails `npm test` if either grows past 120,000 chars, so the rule
  no longer depends on someone remembering it.
- **Third pass — split by SUBSYSTEM, not by status.** `TECH_DEBT.md` still held 63 "open" entries, but
  classifying them showed only **7 were actionable**: **52 belong to the 3D city**, a finished black
  box Đàm forbids touching, and were **87% of the file** (218,861 of 250,190 chars). Three more had
  titles saying ĐÃ ĐÓNG yet were never archived. The 52 moved to `docs/TECH_DEBT_3D.md` — **still
  open, relocated by subsystem** so a `grep` for live work stops wading through frozen work — and the
  file went **250,190 → 43,559 chars (−83%)**. ⚠️ The Maintenance Sprint threshold must now be judged
  on the actionable list, not the total: a frozen subsystem cannot be worked on, and counting it was
  making the threshold meaningless.
- **Also**: `START_HERE.md`'s UI invariants (~4,000 chars) moved to `docs/UI_INVARIANTS.md` behind an
  imperative pointer — every session was loading them before knowing whether the task touched the UI.
  Stale routing repointed in `AI_ONBOARDING.md`, `AI_HANDOFF_KNOWLEDGE.md` and `ARCHITECTURE.md`,
  which all still told a new session to read `BAN_GIAO.md` in full first.
- **Impact**: largest single file 486,294 → 266,956 chars. No file exceeds a context window.
  Always-loaded: 10,171 → 9,942 tokens/session. `npm test` 1,605 → 1,609 tests.
- **Review conditions**: when an active reference doc passes ~50% of a window again (the warning
  fires automatically), or when a closed entry needs reopening — move it back out of the archive
  rather than duplicating it.

## ADR-074 — Tài liệu tự-nạp viết bằng TIẾNG ANH, có cổng canh ngôn ngữ đo theo ĐOẠN

- **Ngày**: 2026-09-06 (tối, cùng ngày ADR-073)
- **Bối cảnh**: sau ADR-073, `CLAUDE.md` còn 16.503 ký tự ≈ 9.600 token/phiên. Đàm yêu cầu tiếp:
  *"chuyển thành tiếng Anh đi… khi giao tiếp với tôi thì sử dụng tiếng Việt để tiết kiệm token"*.
  Hệ số đo được của dự án: tiếng Việt **1,723 ký tự/token**; tiếng Anh khoảng **4** (con số phổ biến
  của BPE, **CHƯA đo được trong phiên này** — `tiktoken` cần tải bảng BPE qua mạng và proxy chặn).
- **Vấn đề gốc**: cùng một ý, bản tiếng Việt tốn ~2,3 lần token. Với các file **tự nạp mỗi phiên**,
  chi phí ấy nhân với SỐ PHIÊN. Đây là khoản duy nhất trong ngân sách token mà việc đổi ngôn ngữ
  cắt được mà không mất một chữ nội dung nào.
- **Phương án cân nhắc**:
  1. Dịch TOÀN BỘ 2,6 triệu ký tự tài liệu sang tiếng Anh.
  2. Không dịch gì; chỉ tiếp tục tách file.
  3. Dịch đúng phần bị nhân với số phiên (4 file tự-nạp + 2 file `docs/` hay mở), phần kho tra cứu
     giữ tiếng Việt và chuyển dần khi đụng tới.
- **Lý do loại bỏ**: (1) tốn ~700.000 token output cho MỘT lần, và quan trọng hơn là rủi ro **mất
  tri thức** — mỗi mục trong `docs/LESSONS_3D.md`/`TECH_DEBT.md` là một phase đã trả giá, đúng thất
  bại `AGENTS.md` 2026-07-31 (bản dịch máy móc trôi khỏi bản gốc sau 5 ngày, mất nguyên một mục).
  (2) bỏ qua khoản tiết kiệm lớn nhất còn lại mà không có lý do kỹ thuật nào.
- **Giải pháp được chọn**: phương án (3).
  - Dịch + tái cấu trúc: `CLAUDE.md` · `START_HERE.md` · `PHASE_RULES.md` · `AGENTS.md` ·
    `docs/GOVERNANCE.md` · `docs/OPERATIONS.md`. Bốn file tự-nạp: **25.702 → 10.075 token (−61%)**.
  - **Cổng canh ngôn ngữ** trong `npm test`: một đoạn tiếng Việt lọt vào file tự-nạp = test ĐỎ.
  - Ranh giới ngôn ngữ ghi thành BẢNG trong `CLAUDE.md` để không sinh mâu thuẫn mới: file tự-nạp +
    2 file `docs/` = tiếng Anh (có cổng) · kho tra cứu = phần cũ giữ tiếng Việt, phần MỚI viết tiếng
    Anh · **báo cáo cho Đàm = tiếng Việt**.
- **⚠️ Bài học đắt nhất của quyết định này — cổng canh đầu tiên KHÔNG NỔ khi thử phá.**
  Bản đầu đo tỉ lệ ký tự tiếng Việt trên **TOÀN FILE**. Chèn một đoạn tiếng Việt vào `CLAUDE.md` chỉ
  đẩy tỉ lệ từ 0,21% lên **0,59%** — bị 15.000 ký tự tiếng Anh pha loãng, không ngưỡng nào bắt nổi.
  Đúng luật *"trước khi tin một tỉ lệ, hỏi mẫu số có lẫn thứ không thuộc câu hỏi không"*: câu hỏi là
  *"có ĐOẠN nào viết bằng tiếng Việt không"*, nên mẫu số phải là một ĐOẠN, không phải cả file.
  Bản sửa quét theo đoạn ≥200 ký tự. Ngưỡng **8%** chọn từ số đo thật: đoạn tiếng Anh có trích dẫn
  nguyên văn lời Đàm cao nhất **4,21%**; đoạn tiếng Việt thuần **13,95–15,69%** — biên gần 2 lần cả
  hai phía. Bài test kèm một assert đòi ngưỡng phải nằm GIỮA hai con số ấy, để phiên sau không nới
  ngưỡng cho tiện.
- **⚠️ Bài học thứ hai — cổng chống-mất-luật quá giòn.** Nó so chuỗi thô, nên báo mất
  *"Composition over Duplication"* chỉ vì markdown ngắt dòng giữa hai từ. Đã sửa để chuẩn hoá khoảng
  trắng trước khi so — sửa CÔNG CỤ ĐO, không sửa văn bản cho vừa công cụ.
- **Trade-off**: (a) Đàm không đọc trực tiếp được 6 file này nữa — chấp nhận được vì anh nói rõ
  *"có thể sử dụng toàn bộ là tiếng Anh luôn"*, và mọi báo cáo vẫn là tiếng Việt. (b) Kho tra cứu
  thành song ngữ trong giai đoạn chuyển tiếp; bảng ranh giới trong `CLAUDE.md` là thứ giữ cho nó
  không thành mớ hỗn độn. (c) Hệ số tiếng Anh = 4 **chưa đo được** ⇒ mọi con số token tiếng Anh
  trong tài liệu là ƯỚC LƯỢNG; phép kiểm thật là Đàm gõ `/context` ở phiên mới và đọc "Memory files".
- **Ảnh hưởng**: mỗi phiên gánh **41.000 ký tự ≈ 10.200 token = 5,1% cửa sổ 200k** (trước ADR-073:
  riêng `CLAUDE.md` đã 21.600 token). `docs/OPERATIONS.md` 9.160 → 4.469 token ·
  `docs/GOVERNANCE.md` 7.382 → 3.287 token. Test 1.602 → 1.605 bài.
- **Điều kiện xem lại**: khi đo được hệ số tiếng Anh thật (nếu lệch >20% so với 4,0 thì cập nhật
  `CHARS_PER_TOKEN_EN` và mọi con số dẫn xuất); hoặc nếu Đàm cần tự đọc một trong 6 file ấy thường
  xuyên; hoặc khi kho tra cứu đã chuyển đủ sang tiếng Anh để bỏ hẳn ranh giới song ngữ.

## ADR-073 — Ngân sách token của TÀI LIỆU: tách file + cổng canh bằng test, không nới trần

- **Ngày**: 2026-09-06 (chiều)
- **Bối cảnh**: Đàm gửi ảnh chụp `/context` — cửa sổ ngữ cảnh 699,8k/1M (70%), trong đó `Messages`
  chiếm **624,7k = 62,5%** còn `CLAUDE.md` chỉ 21,6k = 2,2%. Yêu cầu: *"tối ưu token nhất nhưng vẫn
  đem ra output hiệu quả nhất"*. Đo lại toàn bộ tài liệu: 18 file `.md` = **2.650.448 ký tự ≈ 1,54
  triệu token = 769% cửa sổ 200k**. `TECH_DEBT.md` một mình là 250k token (125% cửa sổ 200k).
- **Vấn đề gốc**: thủ phạm KHÔNG phải file tự-nạp mà là **kho tra cứu bị `cat`**. Một lệnh
  `cat TECH_DEBT.md` nổ cửa sổ 200k trong MỘT lượt; đó là cách `Messages` leo tới 62,5%. Đồng thời,
  ba trần đã ghi trong tài liệu (`CLAUDE.md` 40.000 · `START_HERE.md` 20.000 · quy tắc "3 vòng gần
  nhất") **chỉ tồn tại dưới dạng câu chữ, không có gì canh** — `START_HERE.md` đã âm thầm vượt trần
  của chính nó (20.200/20.000) và giữ 4 vòng thay vì 3, không phiên nào biết. Thêm ba mâu thuẫn
  làm phiên sau đốt token hoặc làm sai: `AGENTS.md` bảo Codex *"đọc `BAN_GIAO.md` toàn văn"*
  (**134k token** ngay câu thứ hai của phiên) trong khi `PHASE_RULES.md` §5 nói *"chỉ đọc 60 dòng
  đầu"*; `PHASE_RULES.md` §9 ghi *"Không tự gộp `main`"* trong khi `CLAUDE.md` + `START_HERE.md`
  ghi *"TỰ gộp `main`, KHÔNG hỏi"*; và hai bản báo cáo 11 mục chồng nhau (Báo cáo bàn giao +
  TECHNICAL ADVISOR REPORT) tốn ~2.500 token **output** mỗi task để nói phần lớn cùng một chuyện.
- **Phương án cân nhắc**:
  1. Nén văn bản: viết lại tài liệu cho súc tích, xoá phần dài dòng.
  2. Nới trần cho khớp thực tế (40.000 → 50.000) và chấp nhận chi phí.
  3. Tách file theo chủ đề + đặt trần có **cổng canh bằng test thật** + cấm `cat` kho tra cứu.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì tri thức trong tài liệu này là thứ đắt nhất dự án
  — mỗi mục là một phase đã trả giá; nén văn bản là con đường ngắn nhất tới việc **đánh mất một luật
  vận hành**, đúng thất bại `AGENTS.md` 2026-07-31 (bản sao trôi khỏi bản gốc sau 5 ngày, mất nguyên
  mục "3 cái bẫy menu bar"). (2) bị loại vì nới trần là *chữa cái nhiệt kế* — và trần cũ 40.000 ký tự
  vốn đã tương đương 21,6k token/phiên, tức bản thân con số ấy mới là vấn đề chứ không phải việc
  chạm nó.
- **Giải pháp được chọn**: phương án (3), lặp lại đúng mẫu hình đã thành công sáng cùng ngày (tách
  `docs/LESSONS_3D.md` + `docs/AI_COACH.md`, giảm 190.700 → 21.600 token mà **không xoá một chữ nào**):
  - Tách `CLAUDE.md` → `docs/GOVERNANCE.md` (Governance Protocol + AI Engineering Playbook, nguyên
    văn) + `docs/OPERATIONS.md` (hạ tầng · Vercel 12 Functions · sync/CAS · Web Push · Electron tray ·
    deploy · MCP, nguyên văn). `CLAUDE.md` giữ lại LUẬT ở dạng một dòng + con trỏ: **37.220 → 16.310
    ký tự (−56%)**, 21.600 → 9.468 token.
  - `scripts/doc-budget.mjs` + `scripts/docBudget.test.js`: trần trở thành **cổng canh chạy trong
    `npm test`**, đỏ khi vượt. Đo bằng **ký tự Unicode** (`String.length`), KHÔNG bằng `wc -c` —
    tiếng Việt có dấu là 2–3 byte/ký tự nên `wc -c` thổi phồng ~21% và trong chính phiên này đã suýt
    cho kết luận sai *"CLAUDE.md vượt trần 40.000"* (thật ra 37.220 ký tự / 45.011 byte).
  - Mục "NGÂN SÁCH TOKEN" đứng ĐẦU `CLAUDE.md` với bảng "file nào cấm `cat`" — vì luật rẻ nhất là
    luật ngăn một lệnh 250k token, không phải luật tiết kiệm 2k token.
  - Gộp hai báo cáo 11 mục thành MỘT bảng chọn theo loại task (5 dòng cho việc gọn · 11 mục cho
    kiến trúc/hạ tầng/sự cố).
- **Trade-off**: (a) tri thức nay nằm xa hơn một bước — phiên nào cần quy trình hay chi tiết hạ tầng
  phải mở thêm một file; đổi lại mọi phiên KHÔNG cần chúng thì không trả tiền. (b) Trần cứng sẽ đỏ
  khi `START_HERE.md` nhận vòng mới (đang ở 91%) — đó là **hành vi mong muốn**: nó buộc phiên sau
  đẩy vòng cũ sang `docs/archive/`, đúng luật vốn có mà trước đây không ai thi hành.
- **Ảnh hưởng**: mỗi phiên gánh 44.284 ký tự ≈ **25.702 token = 12,9% cửa sổ 200k** cho toàn bộ
  4 file bắt buộc (trước: `CLAUDE.md` một mình đã 21.600). Test 1.597 → **1.602 bài**.
- **Điều kiện xem lại**: khi Claude Code đổi cơ chế nạp `CLAUDE.md` (ví dụ cho phép nạp một phần),
  hoặc khi hệ số 1,723 ký tự/token đo lại thấy lệch >10%, hoặc khi `docs/GOVERNANCE.md` /
  `docs/OPERATIONS.md` tự phình quá 30.000 ký tự (lúc đó tách tiếp, đừng nén).

## ADR-072 — Tray menu bar: realtime KHÔNG được là nguồn cập nhật DUY NHẤT, luôn cần một lưới poll dự phòng

- **Ngày**: 2026-09-06
- **Bối cảnh**: Đàm báo (kèm ảnh) menu bar Mac không hiện đếm ngược dù web app đang chạy phiên thật
  — *"đã bị rất nhiều lần"*. `electron/main.js` chỉ gọi `fetchTimerLive()` (đọc REST một lần) lúc
  khởi động, sau đó phó thác 100% cho kênh Supabase Realtime (`postgres_changes`) để cập nhật
  `timerData`. Comment đầu file ghi "Polls Supabase timer_live table every 3 seconds" nhưng
  `git log -p` xác nhận dòng polling đó **CHƯA BAO GIỜ tồn tại** trong lịch sử file — một lời hứa
  chưa từng được giữ.
- **Vấn đề gốc**: kênh realtime là một WebSocket có thể ngắt lặng lẽ (Mac ngủ/thức, đổi WiFi, socket
  chết) mà không tự phát lại các sự kiện đã lỡ trong lúc ngắt. Với một app nền chạy cả ngày trên
  laptop, việc "ngủ rồi thức" xảy ra nhiều lần/ngày ⇒ `timerData` kẹt ở trạng thái cũ VĨNH VIỄN cho
  tới khi Đàm tự khởi động lại app — đúng khớp triệu chứng "lặp lại nhiều lần" mà không sửa gốc lần
  nào từng đứng vững.
- **Phương án cân nhắc**:
  1. Theo dõi trạng thái kênh realtime (`.subscribe((status) => …)`) và tự resubscribe/refetch khi
     thấy `CLOSED`/`CHANNEL_ERROR`.
  2. Thêm polling định kỳ độc lập với sức khoẻ kênh realtime, cộng thêm refetch ngay khi
     `powerMonitor` báo Mac vừa thức dậy.
  3. Không sửa — dặn Đàm tự khởi động lại app khi thấy mất đếm ngược.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì hành vi callback trạng thái của supabase-js
  realtime không ổn định giữa các phiên bản và khó kiểm chứng trong CI (main.js vốn không mock
  được `electron`/`@supabase/supabase-js` để viết test), tức lại thêm một chỗ "tự tin nhưng chưa
  từng đỏ" — đúng bẫy dự án đã cắn nhiều lần ở mảng 3D; (3) bị loại vì đây là sửa triệu chứng, và
  Đàm chính là non-coder phải chịu áp lực nhớ việc vận hành thay vì phần mềm tự chữa.
- **Giải pháp được chọn**: phương án (2) — mô phỏng ĐÚNG mẫu hình dự án đã dùng cho push notification
  (`ARCHITECTURE.md` mục 4: "Đường chính tức thời" + "Đường dự phòng định kỳ"): realtime vẫn là
  đường chính (độ trễ thấp), `setInterval(fetchTimerLive, TIMER_LIVE_POLL_INTERVAL_MS = 5000)` là
  lưới an toàn tự chữa không phụ thuộc trạng thái kênh, và `powerMonitor.on('resume', fetchTimerLive)`
  rút ngắn thời gian phục hồi ngay sau khi Mac thức dậy thay vì chờ hết chu kỳ poll. Gộp luôn logic
  phát hiện "phiên vừa hoàn thành" (báo Notification) vào một hàm dùng chung `applyTimerLiveUpdate`
  cho cả 2 nguồn — tránh lặp lại đúng lỗi này lần nữa cho nhánh thông báo.
- **Trade-off**: thêm một request REST mỗi 5 giây tới Supabase (rất nhẹ, cùng bảng `timer_live` chỉ
  1 dòng `singleton`) để đổi lấy việc KHÔNG BAO GIỜ kẹt liên tục quá 5 giây (hoặc tới lúc Mac thức
  dậy) dù kênh realtime có chết theo bất kỳ cách nào.
- **Ảnh hưởng**: `electron/main.js` không còn nơi nào giả định realtime là nguồn DUY NHẤT của sự
  thật — mọi cập nhật tray PHẢI đi qua `applyTimerLiveUpdate`, đừng viết thêm một nhánh cập nhật
  `timerData`/`prevIsRunning` riêng mà bỏ qua hàm này.
- **Bài học đi kèm**: một dòng comment mô tả hành vi ("polls every 3 seconds") không phải bằng
  chứng hành vi đó tồn tại — `git log -p` mới là bằng chứng; đọc code, đừng đọc lời hứa của code.
- **Điều kiện xem xét lại**: nếu `main.js` được tách thành module thuần có thể mock `electron`/
  `supabase-js` để test, có thể bổ sung theo dõi trạng thái kênh (phương án 1) làm lớp giảm độ trễ
  thêm — nhưng polling vẫn PHẢI giữ làm lưới an toàn cuối cùng, không thay thế.

---

## ADR-071 — THỐNG KÊ TRẢ LỜI, KHÔNG TRÌNH BÀY; ĐÓNG #99: BA ĐỒNG TIỀN NGỦ THÔI ĐƯỢC CỘNG; CHỮ TRONG SAVE ĐỌC TỪ BẢNG

- **Ngày**: 2026-09-06 (vòng 36, ngay sau ADR-070)
- **Trạng thái**: đã áp dụng. Không đụng Thành phố (`engine/city3d/`, `components/city/render3d/`);
  ADR-007 nguyên. KHÔNG đổi hình dạng JSONB đồng bộ: các khoá `resources` · `research` ·
  `resourcesRefined` · `tinhThe` · `forgiveness` vẫn nằm trong save, chỉ THÔI được ghi.
- **Bối cảnh**: lệnh Đàm vòng 36 — *"Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn
  vào UX/UI. TOÀN QUYỀN"*, mặt trận chính là màn Thống kê: *"Thống kê phải TRẢ LỜI, chứ không TRÌNH
  BÀY. Mở ra là thấy ngay, không phải bấm tab con nào: (a) tôi có đang khá lên không; (b) khi nào tôi
  mạnh nhất; (c) làm gì tiếp — đúng một gợi ý, bấm được"*, kèm luật *"một con số không có mẫu số thì
  không phải mục tiêu"* và *"Xoá nhiều là tốt"*. Nếu còn sức: đóng nốt `TECH_DEBT #99`, rồi tự quyết ba
  câu hỏi mục 9 của vòng trước. Luật tiết kiệm token của vòng này: không chạy công cụ đo Thành phố,
  không bảng số trước/sau nhiều cột, ảnh nghiệm thu ≤6 tấm 390px của đúng màn vừa sửa.
- **Vấn đề**:
  · `StatsDashboard.jsx` **3.792 dòng** (23% mã giao diện), 5 tab · 6 kỳ · 4 biểu đồ · 2 bản đồ nhiệt;
    ở 390px nếp gấp đầu là HAI HÀNG NÚT, và ba câu Đàm hỏi nằm rải ở ba tab khác nhau — không câu nào
    được trả lời ở nếp gấp đầu. Phần lớn con số ở đó không có mẫu số ("Giờ 12,4" — so với gì?).
  · `#99`: sau ADR-069/070 tài nguyên · RP · tinh luyện không còn cổng tiêu, nhưng `completeFocusSession`
    vẫn tính và cộng chúng mỗi phiên, huỷ phiên vẫn trừ tài nguyên và tiêu lượt «Sự Tha Thứ»,
    `cancelCrafting` vẫn hoàn 50% nguyên liệu, hai nhiệm vụ ngày «Kiếm 80/160 RP» vẫn trong bộ, thẻ
    tổng kết vẫn in «+18 tài nguyên · +50 RP · Rương Lớn». ~1.100 dòng phục vụ một kinh tế không ai thấy.
  · Save còn hai chỗ chép CHỮ của bảng: di vật (đã sửa ADR-070) và **khủng hoảng kỷ** (`eraCrisis.name/
    icon/description` + nhãn hai lựa chọn chép từ `ERA_CRISES` lúc kích hoạt) — bảng đổi chữ thì save
    kể chuyện cũ trong im lặng.
- **Phương án cân nhắc**:
  · *Thống kê* — (A) giữ 5 tab, thêm tab «Tổng kết» đứng đầu: bác — vẫn phải bấm, vẫn 3.792 dòng.
    (B) rút còn 3 tab: bác — vẫn TRÌNH BÀY, mỗi tab một bảng số. **(C — chọn)** ba thẻ trả lời ở đầu,
    dải «Điều đáng chú ý» giữ nguyên, sổ tra cứu (Nhật ký · Ghi chú) GẤP xuống dưới — không giấu, chỉ
    gấp; xoá thẳng Tổng Quan · Chiều Sâu · Phân Loại · bộ chọn kỳ · biểu đồ · bản đồ nhiệt.
  · *So tuần* — (A) trọn tuần trước vs tuần này (như `getWeeklyTrend` của Coach): bác — sáng thứ Ba tuần
    này có hai ngày, tuần trước bảy ⇒ ô đỏ suốt sáu ngày mỗi tuần. **(B — chọn)** tuần này vs CÙNG QUÃNG
    của tuần trước (thứ Hai → đúng giờ này); ngưỡng "giữ nhịp" dùng CHUNG `WEEK_TREND_THRESHOLD_PCT`.
  · *#99* — (A) migration xoá khoá + `normalizePersistedGameState`: bác — đổi JSONB đang tranh chấp CAS,
    và xoá thứ Đàm đã kiếm mà anh chưa xác nhận không tiếc. **(B — chọn)** THÔI GHI, giữ khoá: phép
    cộng/trừ/hoàn/phạt và hai nhiệm vụ RP xoá hẳn, dữ liệu cũ nằm yên; bản ghi lịch sử MỚI không còn
    `resources/rpEarned/refinedEarned`, bản ghi cũ giữ nguyên (Thống kê vẫn đọc được).
  · *Chữ trong save* — (A) chỉ di vật (ADR-070): bác — cùng một lỗi còn nằm ở khủng hoảng kỷ.
    **(B — chọn)** luật chung *"save lưu id + số, CHỮ đọc từ bảng lúc nạp"*: di vật (`withCanonical
    RelicText`) · nhiệm vụ (`normalizeMissionTemplate`, đã có) · khủng hoảng kỷ (`withCanonicalCrisisText`,
    mới) — chỉ làm tươi CHỮ, không đổi `sessions/minMinutes` của thử thách ĐANG chạy.
- **Giải pháp**:
  1. `engine/statsAnswers.js` (THUẦN, +test): `buildWeekComparison` (7 cặp cột thứ Hai→Chủ nhật,
     cùng quãng) · `buildBestWindow` (giờ · độ dài · loại việc, đọc thẳng `buildFocusProfile` — cùng số
     với Coach, Wilson lower bound) · `buildNextAction` (bọc `recommendNextSession`; thiếu dữ liệu vẫn
     là MỘT NÚT chạy được) · `buildStatsAnswers`. Bộ getter giờ VN tách thành `time.vietnamHistoryTimeOpts`
     dùng chung với `useCoachContext` (trước là bản chép tay).
  2. `StatsDashboard.jsx` 3.792 → **294 dòng**: ba `AnswerCard` + `InsightStrip` + «Sổ tra cứu» (hai nút
     có số mục, mặc định gấp). Nút «Bắt đầu N phút · loại» đặt `timerConfig.focusMinutes` +
     `pendingCategoryId` rồi `onNavigate({tab:'focus'})` — App truyền `handleNotificationNavigate`
     (cùng đường với thông báo đẩy); đang có phiên chạy thì chỉ chuyển màn, không đổi đồng hồ.
     `StatsJournal.jsx` · `StatsNotes.jsx` · `statsTheme.js` tách ra nguyên văn (hàng lọc loại việc
     thôi cuộn ngang). Xoá `statsPeriod.js` · `statsFocus.js` (+test), `statsPeriodWiring.test.js`,
     `computeYearGrid` · `computeCategoryStats`, 6 hàm định dạng biểu đồ.
  3. `#99`: `calculateRewards` thôi trả `resources/rpEarned/t2Drop/largeChest` (xoá mục 8–10, hai hàm
     phạt, `rollResourceDrop`, `getActiveResources`); store xoá `mergeResources` + 3 hàm trừ khi xoá
     phiên, khối RP/tinh luyện/Lộc Ban Tặng-tinh-luyện, hệ số kinh tế công trình, phạt huỷ phiên +
     lượt tha thứ, hoàn tiền `cancelCrafting`, nhiệm vụ `researchPoints`; `rewardFeed`/chuỗi thẻ bỏ
     «Rương Lớn» · «+N tài nguyên/RP/tinh luyện» (thẻ phiên thường nói BẬC phiên). `challengeEngine.js`
     bỏ 12 hàm chết của đường thử-thách-bậc/hiến-tế cũ (460 → 219 dòng).
  4. `withCanonicalCrisisText` + `findEraCrisisById` (`challengeEngine.js`), gọi ở
     `normalizePersistedGameState`; test tầng thuần + tầng store (`gameStore.adr071.test.js`).
- **Trade-off**: mất biểu đồ cột theo kỳ, bản đồ nhiệt 16 tuần/365 ngày, tab Phân Loại (kể cả
  `buildCategoryAdvisor` 170 dòng — `#93`), bộ chọn 6 kỳ. Đổi lại: mở màn là thấy câu trả lời, mọi tỉ
  lệ có mẫu số. Mất «Rương Lớn» trên thẻ (một cái rương không còn gì để đựng). Lượt «Sự Tha Thứ» thôi
  bị tiêu — kỹ năng ấy nay chỉ còn vế +XP sau huỷ (ADR-069). Save cũ vẫn mang các khoá tiền ngủ (dữ liệu
  chết, không đọc, không ghi) — migration để dành khi Đàm xác nhận không tiếc.
- **Ba câu tự quyết (mục 9 vòng 35)**: (1) **Chuỗi thẻ GIỮ, chỉ ngắn đi một chip** — thẻ Bước tuần /
  Di vật lên bậc / Kỷ mới chỉ hiện khi việc ấy xảy ra (hiếm), gộp vào thẻ XP là làm thẻ dài ở MỌI phiên
  để tiết kiệm ở vài phiên; (2) **Mốc di vật 20/50 phiên ≥25′ GIỮ** — đo trên fixture 599 phiên (bản
  thật không đọc được từ hộp cát, proxy 403): 19,2 phiên ≥25′/tuần ⇒ trung vị **7,1 ngày** tới bậc 1,
  **17,8 ngày** tới bậc 2; ở nhịp 8 phiên/tuần là ~2,5 và ~6 tuần — đủ chậm để là "lớn lên", đủ nhanh để
  còn nhớ; (3) **Luật chữ-đọc-từ-bảng mở rộng thành luật chung** (xem Phương án).
- **Ảnh hưởng**: 29 file, +464/−5.959 dòng mã (chưa kể tài liệu); `gameStore.js` 5.744 → 5.413,
  `gameMath.js` 2.044 → 1.732. Test mới: `statsAnswers.test.js` (7) · `statsNavClarity.test.js` (viết
  lại, 6) · `challengeEngine.test.js` (+2) · `gameStore.adr071.test.js` (3); characterization test của
  `completeFocusSession`/`cancelFocusSession`/`rewardFeed`/`sessionRewardStory` đổi theo luật mới.
- **Điều kiện xem lại**: Đàm dùng màn Thống kê mới vài tuần — nếu ba dòng «mạnh nhất» vẫn trống (không
  đặt mục tiêu phiên) thì cần một cách khác để có mẫu số, không phải một biểu đồ khác. Migration xoá
  khoá tiền ngủ: chỉ khi Đàm nói không tiếc kho.

## ADR-070 — MỘT CÁI KẾT DUY NHẤT, KHÔNG NÚT NHẬN, KHÔNG MÀN CHẾT: phần thưởng đã đạt thì tự vào, di vật lớn theo phiên, đặc quyền công trình về trục sống

- **Ngày**: 2026-09-06 (vòng 35, ngay sau ADR-069)
- **Trạng thái**: đã áp dụng. Không đụng Thành phố (`engine/city3d/`, `components/city/`, địa hình,
  đường, thực vật, bảng màu, `cityLayout`; hình dạng `craftingQueue`/`buildings`/`cityArchive` giữ
  nguyên từng byte — ADR-007 nguyên). Đảo ngược nốt nửa còn lại của ADR-060 (hộp thoại chi tiết) và
  đóng bốn mục nợ ADR-069 để lại (`#96` · `#98` · `#100`, cập nhật `#99`). Không đổi hình dạng dữ
  liệu đồng bộ; một trường MỚI (`relics[].earnedAt`) được đóng dấu lúc nạp cho save cũ.
- **Bối cảnh**: lệnh Đàm *"Tiếp tục làm như prompt trên mà không hỏi lại, cho phép bạn tự quyết định
  mọi thứ và tech debt. Build lớn. Simplify mạnh. Làm game vui hơn. Tập trung nhiều hơn vào UX/UI."*
  Sau ADR-069, đo lại trên chính app: còn **bốn chỗ phần thưởng ĐÃ ĐẠT mà vẫn cách người chơi một
  cái nút hoặc một cánh cửa khoá**:
  · Bước tuần đủ điều kiện đứng chờ nút «Chốt bước» — ở tab Tiến trình, cách màn Tập trung hai cú
    chạm; thưởng trọn ngày đứng chờ nút «Nhận» (ở màn Tập trung VÀ trong chuỗi thẻ). Cả hai là
    đúng loại ma sát ADR-069 vừa gỡ ở bậc/khủng hoảng (`#100`).
  · Tiến hoá di vật đòi **tinh luyện của kỷ ĐÃ QUA** mà tinh luyện chỉ rơi vào kỷ đang chơi ⇒ 14/15
    di vật không bao giờ lên bậc; ba nút «Chưa đủ tài nguyên» đứng đó nói dối nhiều tháng (`#96`,
    ghi "Đàm chọn" — lệnh mới uỷ quyền quyết).
  · 11/15 kỳ quan hứa «giảm giá RP», «rẻ tinh luyện», «giảm thảm hoạ», «mang tài nguyên sang kỷ
    sau»; 2/4 đặc quyền công trình thường trả bằng tinh luyện — toàn đồng tiền đã ngủ sau ADR-069.
    Bảng hợp lệ, test xanh, chỉ có thứ nhận được là không ai thấy (cùng bệnh với ADR-069 mục 6).
  · Một phiên có **HAI cái kết**: chuỗi thẻ (ADR-068) rồi hộp thoại 7 giai đoạn 1.057 dòng khi lên kỷ
    hoặc khi bấm «Xem chi tiết» — hai bản trình bày một `pendingReward`, tiếng mở rương kêu hai lần,
    mỗi trường mới phải nối hai chỗ (`#98`). Hộp thoại ấy chỉ còn hơn ở phần liệt kê ba đồng tiền ngủ.
- **Vấn đề**: mọi thứ trên đều là **khoảng cách giữa "đã đạt" và "đã nhận"** — một nút, một cánh cửa,
  hoặc một màn thứ hai. Tâm lý học thói quen: phần thưởng phải đến NGAY sau hành động và đến MỘT
  LẦN; một nút "Nhận" chỉ hiện khi đủ điều kiện là một nút hầu như không ai thấy, và một cơ chế không
  thể kích hoạt là một lời hứa treo ở đúng chỗ đáng lẽ tạo ham muốn.
- **Phương án đã cân nhắc**:
  - **(A) Giữ nút Nhận nhưng đưa nó lên chuỗi thẻ / thanh tiêu đề**. Loại: vẫn là một việc phải làm
    để lấy thứ đã có; và bấm trong chuỗi thẻ từng làm chuỗi thẻ dựng lại từ đầu (`#98` kèm).
  - **(B) Cho tinh luyện kỷ cũ rơi lại / đổi tinh luyện kỷ mới lấy kỷ cũ** để cứu nút tiến hoá. Loại:
    mở lại một đồng tiền vừa đóng (trái ADR-069); và vẫn là một cánh cửa phải "đủ tiền".
  - **(C) Giữ `LootDropModal` làm màn chi tiết, chỉ gỡ khi lên kỷ**. Loại: hai bản trình bày vẫn tồn
    tại; phần "chi tiết" nay liệt kê toàn đồng tiền ngủ; và Đàm chưa từng được hỏi có bấm nó không —
    lệnh mới uỷ quyền quyết, và quyết là xoá.
  - **(D — đã chọn) Mọi phần thưởng đã đạt TỰ VÀO ngay trong `completeFocusSession` và được KỂ ở
    chuỗi thẻ; di vật lớn theo PHIÊN kể từ lúc nhận; đặc quyền công trình là buff trên ba trục sống;
    chuỗi thẻ là cái kết DUY NHẤT (thẻ «Kỷ nguyên mới» có nút xem thành phố).**
- **Giải pháp**:
  1. **Tự chốt bước tuần + thưởng trọn ngày** (store): `autoClaimWeeklySteps` chốt liền mọi bước đã
     đủ (XP theo ĐÚNG công thức nút cũ, SP thưởng chuỗi, buff Cử Tri/Kế Hoạch Hoàn Hảo đẩy vào hàng);
     thưởng trọn ngày vào ở phiên khép nốt nhiệm vụ cuối (`getDailyMissionAllBonusXP`, cùng hàm). Cả
     hai cộng vào XP PHIÊN (lên cấp tính một lần). ⚠️ Phép ĐỐI CHIẾU với lịch sử mà nút «Nhận» cũ làm
     (`rebuildMissionsFromHistory`) đi theo về `completeFocusSession` — một "3/3" không có lịch sử đỡ
     (sync lệch máy, phiên đã xoá) không được kéo theo một khoản thưởng thật. `pendingReward` kể ba
     tin mới: `dailyBonusXP` · `weeklySteps`/`weeklyChainTitle`/`weeklyBonusSP` · `relicsEvolved`.
     Xoá `claimWeeklyStep` · `claimMissionAllBonus`; `DailyMissions.jsx` không còn nút, chỉ trả lời
     "còn bao xa" (ca nhiệm vụ cuối xong NGOÀI phiên: «cộng ở phiên kế»).
  2. **Di vật lớn theo phiên** — `engine/relicGrowth.js` (thuần): mốc `RELIC_EVOLVE_SESSIONS =
     [0, 20, 50]` phiên ≥`RELIC_EVOLVE_MIN_MINUTES` (25′) đếm TỪ SAU `relic.earnedAt` (phiên nhận
     không tính; phiên trước khi có di vật không tính — nếu không thì người chơi lâu năm nhận là lên
     thẳng Huyền Thoại, chẳng còn gì để chờ); `evaluateRelicEvolutions` chạy sau `newHistory` trong
     `completeFocusSession`, bậc mới áp từ phiên KẾ (buff phiên này đã tính với bậc cũ — cố ý, để
     hai đường đo khớp). Save cũ không có `earnedAt` ⇒ `normalizePersistedGameState` đóng dấu LÚC
     NẠP (đồng hồ bắt đầu hôm nay, không nhảy bậc từ lịch sử cũ). Xoá `evolveRelic` + giá
     `t2Cost`/`t3Cost` + `getRelicEvolutionRefinedCost`/`relicEvolutionCostOf`; `RelicInventory.jsx`
     hiện thanh «N/20 phiên ≥25′ · còn M». Kỳ quan kỷ 15 (`relic_evo_30off`) rút mốc 30%.
     ⚠️ Kèm một lỗi thật ảnh 390px bắt được: save cũ mang BẢN CHÉP label/icon/description/buff của di vật
     từ lúc nhận, nên kho di vật vẫn in «tăng tài nguyên rớt» sau khi ADR-069 đã đổi bảng. Nay
     `withCanonicalRelicText` (cùng file) đọc lại bốn trường ấy từ `ERA_CRISES` lúc nạp — buff thì store
     đã đọc từ bảng tiến hoá từ trước, chữ phải đi cùng đường (một luật một công thức).
  3. **Đặc quyền công trình về trục sống** — `WONDER_EFFECT_REGISTRY` viết lại: 11 kỳ quan → buff
     thụ động `passive: { expBonus | epBonus | comboWindowHours | flatXp, minMinutes? }` (vd kỷ 2
     «+10% XP phiên ≥45′», kỷ 6 «+2h combo», kỷ 10 «+150 XP phiên ≥90′»); 4 luật còn được store đọc
     giữ nguyên id (`streak_cap_plus` · `mission_bonus_20` · `longer_crisis_window` → nay cộng giờ vào
     thử thách kỷ · `relic_evo_30off`). `engine/wonderEffects.js` là nguồn duy nhất
     (`wonderPassiveBuffs` cộng vào `activeBuffs`; `wonderCrisisWindowBonusHours`;
     `wonderRelicEvolveFactor`); gỡ `researchCostOf` · `relicEvolutionCostOf` ·
     `cancelPenaltyWonderMultiplier` cùng 7 helper chép tay trong store. `BUILDING_PERK_REGISTRY`:
     rương ngày/rương sâu trả XP thay tinh luyện; `safety_net` → «phiên bù sau khi huỷ» (+80 XP cho
     phiên kế ≥15′). `rewardAxes.test.js` khoá cả hai bảng (mô tả không được nhắc đồng tiền ngủ; mỗi
     đặc quyền phải có hiệu ứng trên trục sống hoặc là một luật còn được đọc; 15 kỳ quan 15 đặc quyền
     KHÁC nhau).
  4. **Một cái kết** — xoá `LootDropModal.jsx` (1.057 dòng) và mọi cổng của nó ở `OverlayStack`
     (`showLootModal` · `detail === 'loot'` · `pendingEraChanged` · preload). `finishStory` đóng
     phần thưởng KHÔNG ĐIỀU KIỆN. Chuỗi thẻ thêm thẻ **Bước tuần** (`chain`), **Di vật lên bậc**
     (`evolve`), chip «+N EP» ở thẻ +XP (buff EP phải THẤY được), thẻ Nhiệm vụ kể «Trọn ngày +N XP — đã
     cộng» thay nút; thẻ «Kỷ nguyên mới» có nút **«Xem thành phố mới»** (điều hướng tab Thành phố) và
     phát `playEraChange` — tiếng và thông báo lên cấp/lên kỷ chỉ còn kêu MỘT lần.
  5. **Huy hiệu "Kế tiếp"** — `Achievements.jsx`: sau dải hero (nay nói «còn N phút/phiên» thay «gần
     xong rồi»), một khối 4 huy hiệu gần đạt nhất với thanh + mẫu số (goal-gradient); bỏ bộ lọc BẬC
     (bậc đã có trên từng ô); gỡ `AchievementCard` chết (~140 dòng không ai gọi từ 2026-09-02).
  6. **Dọn chữ đồng tiền ngủ** còn nhìn thấy: nhãn «Tinh luyện» ở lịch sử Thống kê → «Phiên sâu»;
     hàng «Tài nguyên» ở hộp Thăng hoa; câu chào onboarding «XP và tài nguyên» → «XP và điểm kỷ
     nguyên»; `engine/buffLabel.js` dịch buff một chỗ cho cả kho di vật lẫn chuỗi thẻ.
- **Trade-off**:
  - Mọi phần thưởng nay đến mà không cần chạm — mất "cú bấm nhận" (một nhịp dopamine nhỏ), đổi lấy
    việc không bao giờ có phần thưởng nằm chờ không ai lấy. Chuỗi thẻ là nơi ăn mừng thay cho nút.
  - Di vật lớn CHẬM và ĐỀU (20 rồi 50 phiên dài) thay vì "mua" — cố ý: tiến hoá thành một mốc tự
    tới, cùng khuôn bậc/thử thách kỷ. Save cũ đếm từ hôm nay, tức người chơi lâu năm không được
    hồi tố — chấp nhận, vì hồi tố sẽ nhảy thẳng bậc cuối và giết chính cơ chế chờ.
  - Không còn màn liệt kê tài nguyên/RP/tinh luyện — chúng là dữ liệu ngủ (`#99`), và màn duy nhất
    còn nhắc chúng nay bị xoá; phần cộng vào store vẫn giữ (không đụng JSONB đang tranh chấp CAS).
  - Bước tuần đủ NGOÀI phiên (kết thúc nghỉ đúng giờ) chỉ chốt ở phiên kế — chấp nhận, vì đường
    duy nhất trao XP là `completeFocusSession`; màn Tiến trình nói rõ «chốt ở phiên kế».
- **Ảnh hưởng**: `pendingReward` +5 trường; `relics[].earnedAt` mới (đóng dấu lúc nạp); `RELIC_EVOLUTION`
  mất `t2Cost`/`t3Cost`; store mất 7 action (`claimWeeklyStep` · `claimMissionAllBonus` · `evolveRelic`
  · `craftBuilding` · `researchBlueprint` · `startCrafting` · `upgradeBuilding`) và 7 helper kỳ quan;
  xoá `LootDropModal.jsx` · `engine/craftReadiness.js`; thêm `engine/relicGrowth.js` ·
  `engine/buffLabel.js`; `previewStage.js` đọc trường từ hai file chuỗi thẻ (người đọc duy nhất);
  `motionCoverage`/`notificationLayer` bớt một hộp thoại. Test: `gameStore.adr070.test.js` (8 bài chạy
  THẬT qua store: tự chốt bước · trọn ngày · đối chiếu lịch sử · di vật lên bậc · kỳ quan ×1,08 EP ·
  đóng dấu `earnedAt` khi nạp) · `relicGrowth.test.js` · `buffLabel.test.js` · `wonderEffects.test.js`
  viết lại · `rewardAxes` +2 bài · `rewardToastWiring` viết lại 3 bài.
- **Điều kiện xem lại**: (a) Đàm thấy chuỗi thẻ quá dài ở phiên có nhiều tin (xp · thành phố · chuỗi
  · hôm nay · nhiệm vụ · bước tuần · thử thách · cấp · bậc · di vật · lên bậc · kỷ = 12 thẻ ở ca
  đỉnh) ⇒ gộp `chain` vào thẻ nhiệm vụ; (b) mốc 20/50 phiên quá xa hoặc quá gần ⇒ chỉnh
  `RELIC_EVOLVE_SESSIONS` (một hằng số, một chỗ); (c) muốn "khan hiếm" thì đặt ở PHIÊN, không mở lại
  tiền tệ (`#99`).

---

## ADR-069 — ĐỒNG TIỀN DUY NHẤT LÀ PHIÊN: công trình một nút, bậc và thử thách kỷ tự chạy theo lịch sử, kỹ năng chọn ngay lúc lên cấp

- **Ngày**: 2026-09-06
- **Trạng thái**: đã áp dụng. Không đụng Thành phố (`engine/city3d/`, `components/city/`, địa hình,
  đường, thực vật, bảng màu, `cityLayout`). Bổ sung cho ADR-068 (chuỗi thẻ thưởng nay là CHỖ DUY
  NHẤT mọi hệ thăng tiến hiện ra). Không đổi hình dạng dữ liệu đồng bộ — tài khoản cũ không cần
  migration.
- **Bối cảnh**: lệnh Đàm (*"SIMPLIFY. MINIMIZE. AMPLIFY FUN."*): *"nhìn toàn bộ hệ thống Upgrade +
  Progression + UX/UI như một sản phẩm cần redesign từ đầu … giảm 5 bước thành 2 … giảm 3 hệ thống
  thành 1 … cơ chế nào tồn tại chỉ vì được code ra thì xoá … tuyệt đối không đụng Thành phố"*.
  Chẩn đoán trên ảnh 390px của tài khoản thật (kỷ 8):
  · Tab Công trình dài **2.376px** = hai hệ nối đuôi (Xưởng + Nghiên cứu), **ba cổng** (RP → nguyên
    liệu thô + tinh luyện → ô hàng chờ) và **bốn loại tiền** cho MỘT hành động — trong khi RP dư
    **8,5 lần** giá nghiên cứu và nguyên liệu dư **14 lần** (`TECH_DEBT #95`): ba cổng đầu chưa bao
    giờ đóng, chúng chỉ tồn tại để được bấm qua. Thẻ "Hàng chờ" in lại thẻ "Đang xây" ngay trên nó.
  · Lên bậc là một nghi thức bốn bước (đủ EP → bấm "Bắt đầu thử thách" → N phiên trong 48 giờ →
    trễ thì hộp thoại đỏ "mất 5% tài nguyên"). Khủng hoảng kỷ còn nặng hơn: **chặn nút Bắt đầu**
    cho tới khi chọn "hiến tế 40%" hay một thử thách có hạn, trễ thì phạt 20%. Hai hệ, hai bộ luật,
    hai hộp thoại, cùng trả lời một câu: *"gần đây anh có làm vài phiên tử tế không?"*
  · "+2 điểm kỹ năng" lúc lên cấp là phần thưởng bị HOÃN: phải đi Hành trang › Kỹ năng, chọn ô,
    rồi trả lời một hộp xác nhận.
  · Tab Tiến trình in lại thanh EP của thanh tiêu đề; màn chờ có "Tăng lực phiên" (cược 5% EP,
    khung "thua thì mất") đứng ngay trước nút Bắt đầu.
- **Vấn đề**: mọi hệ nâng cấp đều đo cùng một thứ — SỐ PHIÊN TẬP TRUNG — nhưng được đổi ra 4–6 loại
  tiền và 3 nghi thức bấm nút, nên người chơi phải HIỂU hệ thống trước khi được thưởng bởi nó.
  Fun-density thấp không vì thiếu cơ chế mà vì cơ chế đứng chắn giữa hành động và phần thưởng.
- **Phương án đã cân nhắc**:
  - **(A) Cân bằng lại giá** (hạ RP/nguyên liệu để cổng "có ý nghĩa"). Loại: cổng có ý nghĩa là cổng
    đôi khi ĐÓNG, tức thêm những lúc "chưa đủ, đợi" vào một vòng lặp đang cần ít ma sát hơn; và
    Đàm đã tích 180 ngày tài nguyên — chỉnh giá là xoá thứ anh đã kiếm.
  - **(B) Gộp ba loại tiền thành một** ("điểm xây"). Loại: vẫn là một loại tiền phải đọc, phải so;
    con số ấy chỉ đại diện cho số phiên — mà số phiên thì đã là cái giá rõ nhất.
  - **(C) Giữ thử thách bậc nhưng bỏ phạt**. Loại: vẫn còn nút "Bắt đầu" và đồng hồ 48 giờ, tức vẫn
    còn một việc phải nhớ; và khủng hoảng kỷ vẫn chặn nút Bắt đầu.
  - **(D — đã chọn) Cái giá duy nhất là PHIÊN và Ô hàng chờ; mọi hệ thăng tiến ĐỌC LỊCH SỬ thay
    vì đòi bấm nút; phần thưởng hiện ngay trong chuỗi thẻ.**
- **Giải pháp**:
  1. **Công trình một màn, một nút** — `components/BuildScreen.jsx` thay `BuildingWorkshop` +
     `BlueprintInventory` (1.649 dòng): Đang xây (thanh tiến độ, huỷ hai chạm) · **Xây tiếp** (≤3 lựa
     chọn mở sẵn, còn lại GẤP) · Đã xây (ô nhỏ, chạm mới kể đặc quyền) · Trùng tu di sản (chỉ khi
     còn việc, ô riêng ADR-012). Luật thuần ở `engine/buildChoices.js`. Store thêm **`startProject`**:
     cùng hình dạng mục hàng chờ, cùng cổng ô/trùng/đã-xây/trùng-tu, **không hỏi RP, không hỏi
     nguyên liệu**; ghi `research.researched` để thành tích/bảo tàng vẫn thấy "đã mở".
     `engine/opportunities.js` còn HAI phép đếm: kỹ năng mở được · **ô hàng chờ trống** (một ô trống
     LÀ một việc: phiên chỉ đẩy thứ đang nằm trong hàng chờ).
  2. **Bậc tự thăng** — `engine/rankLadder.js` (thuần): đủ EP gác + đủ N phiên ≥M′ trong 48 giờ
     gần nhất, đếm THẲNG từ `history` ⇒ `completeFocusSession` thăng một bậc mỗi phiên nhiều nhất và
     kể vào `pendingReward.rankUp`. Bỏ `initiateRankChallenge`/`checkRankChallengeDeadlines`/phạt.
  3. **Khủng hoảng kỷ = nhiệm vụ mềm** — mở ra là vào chế độ thử thách ngay, **không deadline,
     không hộp thoại, không chặn nút Bắt đầu, không phạt**; cùng phép đếm lịch sử; qua thì di vật
     vào túi và kể ở thẻ `relic`. `checkEraCrisisDeadlines` giữ tên (App gọi lúc mở app) nhưng chỉ
     đưa dữ liệu đời cũ về dạng mềm. `EraCrisisModal` xoá; `DisasterModal` cũng **xoá hẳn** (huỷ
     phiên không còn hộp thoại "mất N% tài nguyên" — một hộp không ai mở nữa là mã chết; cờ
     `ui.disasterModalOpen`/`pendingDisaster` + `closeDisasterModal` gỡ theo, chi tiết phạt vẫn ở
     bản ghi lịch sử `cancelPenalty`).
  4. **Chuỗi thẻ thưởng** (ADR-068) thêm bốn thẻ: **`project`** (công trình nhích một nấc, hoặc
     "hàng chờ trống — chọn ngay" có nút đi thẳng) · **`level` MỜI CHỌN ≤3 kỹ năng mở được ngay tại
     chỗ** (`hold`: thẻ đứng yên chờ, "Để sau" giữ điểm; không mở được thì nói *"còn N điểm nữa mở
     được «X»"*) · **`quest`** (thử thách kỷ vừa mở / vừa nhích) · **`rank`** · **`relic`**.
     `finishStory` dọn toast di vật đã kể thay và điều hướng tới Công trình khi bấm "Chọn ngay".
  5. **Dọn nhiễu**: `ResourceDisplay` (thẻ EP trùng + Kho) xoá; `StakePanel` rời màn chờ; hộp xác
     nhận mua kỹ năng bỏ (một chạm; ô nào cũng là kỹ năng thật); "Tổ hợp kỹ năng" gấp lại;
     `RankDisplay` thành thẻ kể (hai điều kiện, không nút) + thẻ thử thách kỷ.
  6. **Mọi phần thưởng nằm trên TRỤC SỐNG** (bổ sung cùng ngày, sau khi soi ảnh): khi ba đồng tiền rời
     đường chơi, ba bảng phần thưởng lộ ra là nhãn không có hiệu ứng — **2/8 bậc mỗi kỷ** thưởng
     «+N% Tài Nguyên», **12/15 di vật** thưởng tài nguyên/RP/giảm thảm hoạ, **4 kỹ năng** quay ra
     nguyên liệu/tinh luyện hoặc miễn một khoản phạt đã biến mất. Thẻ «THĂNG BẬC» in «+12% Tài
     Nguyên» giữa một vòng lặp không còn tài nguyên. Đổi THEO CHỦ ĐỀ, giữ nguyên độ lớn/xác suất:
     bậc lẻ → **+N% EP** (cùng số) · di vật «tăng trưởng» → EP (½ giá trị cũ) · di vật «tri thức»
     (RP) → XP · di vật «che chở» (giảm thảm hoạ) → giờ combo · `ban_tay_vang`/`nhan_quan`/`linh_cam`
     → cú may +XP/+EP cùng xác suất (kể ở thẻ +XP bằng chip «🍀 Vận may») · `su_tha_thu` → +6% XP cho
     phiên ≥25′ ngay sau khi huỷ (bậc đầu của cặp «tha thứ → phục hồi»; `phuc_hoi` cộng thêm). Bậc
     «Cơ Bản» của `RELIC_EVOLUTION` PHẢI trùng `successRelic.buff` — một luật một công thức. Hai
     trần mới `RELIC_EP_BONUS_CAP`/`RELIC_EXP_BONUS_CAP` là lưới an toàn như các trần cũ; trần combo
     nâng 18 → 28 vì nay có 6 di vật trên trục ấy (vẫn không cắn loadout thật — test đã khoá luật đó
     từ trước, và nó đã đỏ đúng lúc). Hộp xác nhận huỷ thôi nói «phạt N%–M% tài nguyên»; nó nói sự
     thật còn lại (không tính XP/EP) và, nếu có kỹ năng Ý Chí, phiên kế được bù gì. Khoá bằng
     `engine/rewardAxes.test.js` (5 bài, cả ba bảng) + 3 bài Vận May/Ý Chí ở `gameMath.test.js`.
- **Trade-off**:
  · Tài nguyên/RP/tinh luyện VẪN được cộng vào store (không đổi `completeFocusSession` phần thưởng,
    không đổi state đồng bộ) nhưng **không còn cổng nào tiêu chúng** trên đường chơi — chúng là dữ
    liệu ngủ. Đây là cái giá cố ý để KHÔNG xoá thứ Đàm đã kiếm và không đụng luồng đồng bộ; dọn hẳn
    là việc của một ADR sau khi anh đã chơi vài tuần (`TECH_DEBT #99`).
  · Nâng cấp công trình (Lv.2/3 bằng tinh luyện) không còn lối vào; cấp đã có vẫn áp hiệu ứng.
  · Thử thách bậc và khủng hoảng mất tính "căng" của một đồng hồ đếm ngược — đổi lấy việc không
    bao giờ bị phạt vì quên mở app. Đàm chọn dopamine, không chọn cortisol.
  · `startCrafting`/`researchBlueprint`/`upgradeBlueprint`… giữ lại cho test và dữ liệu cũ, không
    còn màn hình nào gọi (đếm ở `TECH_DEBT #99`).
  · Đổi trục di vật là đổi CÂN BẰNG: ở loadout Huyền Thoại đủ 15 di vật, EP +106% · XP +65% · combo
    26 giờ (so với +60% Tất Cả của bậc 8 kỷ 15). Con số chọn bằng phép so với thang bậc, chưa đo trên
    người chơi thật — điều kiện xem lại (c) bên dưới. Di vật đã nhận vẫn giữ `buff` cũ trong state;
    mọi nơi TÍNH và HIỆN đều đọc `RELIC_EVOLUTION` theo id nên hiệu ứng đổi ngay, không cần migration.
- **Ảnh hưởng**: `BuildScreen.jsx` (mới) · `engine/buildChoices.js` + `rankLadder.js` (mới, thuần,
  có test) · `gameStore.js` (`startProject`, khối bậc/khủng hoảng trong `completeFocusSession`,
  `pendingReward.{rankUp,relicEarned,crisisOpened}`, xoá 4 action) · `opportunities.js` ·
  `SessionRewardStory.jsx`/`sessionRewardStory.js` · `RankDisplay.jsx` (viết lại) · `SkillTree.jsx` ·
  `PomodoroEngine.jsx` (hộp xác nhận huỷ + gỡ dự báo phạt) · `App.jsx` · `NotificationCenter.jsx` ·
  hai hook cơ hội · `constants.js` (RANK_SYSTEM · ERA_CRISES · RELIC_EVOLUTION · SKILL_TREE nhánh Vận
  May/Ý Chí · hai trần mới) · `gameMath.js` (cú may XP/EP, Sự Tha Thứ) · `challengeEngine.js` (trần
  EP/XP) · xoá 7 file (`DisasterModal.jsx` kể cả).
  Test mới: `buildChoices.test.js` · `rankLadder.test.js` · `gameStore.adr069.test.js` · `rewardAxes.test.js`.
- **Điều kiện xem lại**: (a) Đàm thấy thiếu "khan hiếm" — công trình nào cũng chọn được ngay ⇒ cân
  nhắc GIÁ BẰNG PHIÊN cao hơn cho kỳ quan, KHÔNG quay lại tiền tệ; (b) sau vài tuần không ai mở
  "Xem chi tiết" ⇒ gộp `LootDropModal` vào chuỗi thẻ (`#98`) và dọn dữ liệu ngủ (`#99`); (c) sau
  vài tuần, nếu kỷ chuyển quá nhanh (EP từ di vật + bậc cộng dồn) ⇒ hạ hệ số ½ của di vật EP, KHÔNG
  quay lại trục tài nguyên.

## ADR-068 — VÒNG LẶP CHÍNH theo tâm lý học thói quen: chuỗi lên đầu màn hình, nhiệm vụ ngày về chỗ ra quyết định, và mỗi phiên kết thúc bằng một CHUỖI THẺ chứ không phải một thẻ toast

- **Ngày**: 2026-09-05
- **Trạng thái**: đã áp dụng. **Đảo ngược MỘT NỬA ADR-060** (vế "mọi phiên thường → toast góc màn
  hình"); giữ nguyên nửa còn lại (một thẻ chung, một thang độ hiếm, "chặn màn hình chỉ cho việc
  phải QUYẾT ĐỊNH").
- **Bối cảnh**: Đàm ra lệnh *"làm một cuộc cách mạng về upgrade, đừng upgrade nhỏ lẻ nữa … ứng
  dụng UX Psychology đằng sau các app khiến người dùng không thể ngừng dùng … có thể xoá những gì
  đã có và xây lại … không đụng Thành phố"*. Đi soi màn hình Đàm mở nhiều nhất (Tập trung, khung
  390px) bằng con mắt của một app thói quen (Duolingo · Strava · Headspace) thì ba thứ mọi app ấy
  đặt ở chỗ mắt đọc ĐẦU TIÊN lại nằm ở những chỗ iPhone không thấy hoặc thấy rất nhỏ:
  1. **Chuỗi** — cơ chế giữ chân mạnh nhất — là một ô 68px ghi "7 / 14" ở thanh tiêu đề; tấm
     "Chuỗi" đầy đủ và thẻ "Hôm nay" nằm ở cột phải `hidden … lg:flex`.
  2. **Nhiệm vụ ngày** — ba việc dở dang, cái móc Zeigarnik của cả ngày — ở một tab riêng, tức
     sau một cú chuyển tab, không nằm cạnh nút Bắt đầu.
  3. **Cái kết của một phiên** — sau ADR-060, một phiên thường kết thúc bằng một thẻ toast 4 giây ở
     góc; đo ở `timerSession.js`: ~82% số phiên không còn lễ mừng thành phố nào để che. Luật
     peak-end (Kahneman): người ta nhớ một trải nghiệm bằng ĐỈNH và bằng CÁI KẾT của nó — một cái
     kết ở góc màn hình không phải một cái kết.
- **Vấn đề**: các cơ chế đã có đủ (chuỗi, mốc chuỗi, mục tiêu ngày, nhiệm vụ, hệ số nhân, sự kiện
  tích cực) nhưng chúng **không đứng ở chỗ tâm lý học bảo phải đứng**: không ở lúc mở app (kích
  hoạt), không ở lúc bấm Bắt đầu (hành động), và không ở lúc xong phiên (phần thưởng). Mô hình
  Hooked (kích hoạt → hành động → thưởng biến thiên → đầu tư) có đủ bốn mắt xích trong mã, nhưng
  ba mắt xích đầu bị giấu sau tab hoặc sau `lg:`.
- **Phương án đã cân nhắc**:
  - **(A) Vá lẻ** — nới cỡ ô "Chuỗi", thêm một dòng nhắc nhiệm vụ. Loại: đây đúng là "upgrade nhỏ
    lẻ" Đàm vừa cấm, và nó không đổi CHỖ ĐỨNG của thứ gì.
  - **(B) Mở lại hộp thoại 7 giai đoạn cũ sau mọi phiên** (đảo ngược ADR-060 hoàn toàn). Loại: hộp
    thoại ấy đo được 3.384px · 327 chữ · 31 con số — lý do ADR-060 ra đời vẫn còn nguyên. Vấn đề
    của nó là DÀI, không phải là CHẶN.
  - **(C) Một màn "Hôm nay" riêng** làm tab đầu, đồng hồ là tab thứ hai. Loại: tách chỗ nhìn khỏi
    chỗ bấm là mở lại đúng khoảng cách vừa muốn xoá.
  - **(D — đã chọn) Xếp lại vòng lặp tại chỗ**: mọi thứ mắt cần thấy đứng trên cùng một màn hình
    với nút Bắt đầu; cái kết của phiên là một chuỗi thẻ ngắn, mỗi thẻ một con số, và mỗi con số ấy
    là thứ Đàm đã thấy lúc mở app — giờ được TÔ THÊM MỘT NẤC.
- **Giải pháp**:
  1. **`TodayHero`** (`components/TodayHero.jsx` + luật ở `todayHero.js`, có test) đứng đầu màn
     Tập trung: số ngày chuỗi · "+N% XP/phiên" · **dải bảy ngày T2→CN** (`WeekStrip.jsx`) · mốc
     chuỗi kế tiếp, và khi chuỗi đang treo thì câu *"Làm một phiên để giữ chuỗi"* đứng thay mốc
     (loss aversion đúng chỗ). Ô "Hôm nay"/"Chuỗi" ở thanh tiêu đề ẩn ở tab này; hai thẻ ở cột
     phải desktop gỡ — *hai chỗ nói cùng một chuyện thì chỗ nói ít hơn nhường*.
  2. **Nhiệm vụ ngày nằm ngay dưới đồng hồ** (`<DailyMissions section="daily" />`, `lg:hidden` vì
     desktop đã có cột phải). Tab cũ giữ **id `missions`** (thông báo đã lưu trỏ vào nó) nhưng đổi
     nhãn thành **"Tiến trình"** (nhịp tuần · tài nguyên · hạng) và rời nhóm chính ⇒ thanh dưới
     iPhone còn **4 nút** (Tập trung · Hành trang · Thành Phố · Thêm) — luật Hick.
  3. **`SessionRewardStory`** (`components/SessionRewardStory.jsx` + luật ở `sessionRewardStory.js`,
     có test) chạy sau MỌI phiên: xp → chuỗi (dải bảy ngày, ô hôm nay bật lên) → nhịp hôm nay
     (thanh chạy từ mức trước phiên tới mức sau phiên) → nhiệm vụ (dòng vừa xong bật dấu ✓, nút
     "Nhận thưởng trọn ngày" ngay tại chỗ) → lên cấp → kỷ mới. Chạm để lật, tự lật sau 2,6 giây,
     thẻ cuối có "Tiếp tục" và "Xem chi tiết". Hộp thoại chi tiết (`LootDropModal`) chỉ còn mở khi
     lên kỷ hoặc khi bấm. Điều phối ở `OverlayStack` (`App.jsx`): lễ mừng thành phố → chuỗi thẻ →
     (lên kỷ) hộp thoại; `finishStory` đóng phần thưởng và dọn những toast chuỗi thẻ đã nói thay.
  4. Hai công thức dùng chung tách ra `components/missionXp.js` (XP nhiệm vụ, thưởng trọn ngày) và
     `lib/useCountUp.js` — vì chuỗi thẻ in cùng con số với thẻ nhiệm vụ và hộp thoại cũ.
- **Trade-off**:
  - Màn Tập trung dài thêm một khối ⇒ nút Bắt đầu suýt tụt dưới thanh tab lần thứ tư; trả bằng cách
    hạ lời chào từ tiêu đề 19px hai dòng xuống một dòng 13px, bỏ hàng "Hôm nay · N phút" khỏi khối
    (số phút còn ở thanh tiêu đề các tab khác và ở Thống kê).
  - Mỗi phiên nay có ~10 giây màn hình thưởng thay vì 4 giây ở góc. Bỏ qua được bằng MỘT chạm;
    thẻ cuối tự đóng sau 9 giây để không giam màn hình.
  - `LootDropModal` 7 giai đoạn nay là màn CHI TIẾT ít được mở — nó và chuỗi thẻ cùng trình bày
    một `pendingReward` (ghi `TECH_DEBT #98`).
- **Ảnh hưởng**:
  - **KHÔNG đổi một luật tính thưởng nào**; store vẫn bật `lootModalOpen` đồng bộ như cũ. Toàn bộ
    thay đổi nằm ở tầng hiển thị — đúng điểm cắm ADR-060 đã chọn.
  - **Không đụng `src/engine/city3d/`, `components/city/`, `useCityMoment.js`** — lệnh Đàm.
  - `appNavigation.test.js` (3 nút chính) · `rewardToastWiring.test.js` (+1 bài canh cổng chuỗi thẻ)
    · `previewStage.test.js` (đọc trường từ CẢ HAI người đọc `pendingReward`) · hai file test mới.
  - Cửa soi: `--preview loot` (thẻ đầu) và `--preview "loot&dc-preview-card=streak"` (nhảy thẻ).
- **Điều kiện xem lại**: Đàm nói chuỗi thẻ "dài" hoặc "phiền" ⇒ rút số thẻ mặc định còn 2 (xp +
  chuỗi) trước khi nghĩ tới việc tắt; nếu `LootDropModal` không được mở trong nhiều tuần ⇒ xoá nó và
  chuyển nút "Xem chi tiết" thành một thẻ liệt kê tài nguyên.

---

## ADR-063 — Che khuất môi trường nướng vào MÀU ĐỈNH: 0 lệnh vẽ, 0 tam giác, và vì thế CHỈ ẢNH mới chứng minh được nó chạy

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 19 VIỆC 4 — Đàm muốn *"hiệu ứng hơn, ánh sáng đổ bóng… giống 3D hoá hơn nữa"*,
  kèm một điều kiện dừng viết hoa: **nếu ảnh ngả TRẮNG BỆCH thì BỎ NGAY, không được chỉnh cho nó
  qua cổng.**
- **Vấn đề**: cảnh chỉ có một mặt trời + một đèn bán cầu, nên mọi góc lõm (chân tường giáp đất, khe
  giữa hai khối, dưới mái đua) đều nhận đúng lượng sáng như mặt phẳng trống — thứ làm khối đọc ra
  là khối chính là cái tối dần ở chỗ hai mặt gặp nhau.
- **Phương án cân nhắc**:
  1. **SSAO/GTAO hậu kỳ** (`EffectComposer`). Loại: thêm một lượt vẽ toàn khung, tính tiền theo
     ĐIỂM ẢNH — mà `PERFORMANCE.md` đã đo 80% chi phí khung hình là điểm ảnh. Đắt đúng chỗ đắt nhất.
  2. **Thêm đèn.** Loại: đo được mỗi nguồn sáng ≈ +19% một khung, và nó làm sáng đều chứ không làm
     tối chỗ lõm — sai bài toán.
  3. ⭐ **Nướng sẵn vào MÀU ĐỈNH lúc gộp hình học** (`occlusion.js` → `buildMergedGeometry`) — chọn.
- **Lý do chọn**: vật liệu đã dùng `vertexColors`, nên chỗ chứa đã có sẵn; phép tính chạy MỘT LẦN
  lúc dựng cảnh, không chạy mỗi khung. **0 lệnh vẽ thêm, 0 tam giác thêm** — đã đo, kỷ 6 = 13 và
  kỷ 11 = 12 ở cả hai phía, y hệt.
- **Giả định**: cảnh dựng lại khi thành phố đổi, và AO chỉ phụ thuộc hình học tĩnh (không phụ thuộc
  giờ trong ngày). Hệ quả **phải biết trước**: AO là chi tiết CHUNG trên trục chặng ngày.
- **Rủi ro mới**: chính vì nó không đổi một con số nào trong `renderer.info`, **không có cách nào
  ngoài ẢNH để biết nó có chạy hay không** — một bản vá chết sẽ im lặng tuyệt đối. Vì thế cờ
  `--no-ao` của `city-preview.mjs` KHÔNG phải một tuỳ chọn tiện tay: nó là **đối chứng bắt buộc**,
  và tên file mang hậu tố `-noao` để hai vế không bao giờ ghi đè nhau.
- **Ảnh hưởng**: đo trên cặp ảnh dựng từ CÙNG một cây mã, kỷ 2 · 6 · 11 ở 1500px: **2,2–4,1% điểm
  ảnh đổi quá ngưỡng mắt**, lệch tại chỗ đã đổi **15,87 · 16,55 · 15,90** (ngưỡng 12). Đọc cột đầu
  thôi sẽ kết luận "vô hình" — đó đúng là cái sai của Phase 11; hiệu ứng CỤC BỘ thì phải đọc cột
  "chỉ chỗ đã đổi". **Điều kiện dừng của Đàm KHÔNG kích hoạt**: sàn độ sáng đi XUỐNG, dải tương
  phản NỞ RA, độ tươi không tụt — cả ba đều ngược hướng "trắng bệch".
- **Điều kiện xem lại**: nếu một phase sau làm khối nhà nhỏ đi nữa thì kiểm lại xem vùng lõm còn đủ
  điểm ảnh để đọc ra không.

---

## ADR-062 — Nguyên mẫu thứ 8 `monolith`: công trình LÀ khối, không phải nhà đội mái

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 19 VIỆC 2. Đàm nhìn kỷ 2 và nói *"kim tự tháp không có khối hình chóp"*.
- **Vấn đề**: `roof: 'pyramid'` đã tồn tại và kỷ 2 khai đúng — **bệnh nằm cao hơn một tầng**. Cả 7
  nguyên mẫu đều là THÂN + MÁI, nên Đại Kim Tự Tháp dựng ra là *một hộp gạch bùn đội cái nón*: có
  tường, có cửa, có mái đua `eaves: 0.2` loe chân thành cây nấm. Kỷ 3 (ziggurat Ur) cùng bệnh —
  đúng `TECH_DEBT #75`, vốn đã chẩn đoán ra rằng *"đây là bài toán KHỐI TÍCH, không phải bài toán
  MÁI"* mà chưa ai làm.
- **Phương án cân nhắc**:
  1. **Cho kỷ 2 khai `eaves: 0`, `windows: 'none'`, thân thật thấp.** Loại: đó là dùng một chuỗi
     giá trị biên để GIẢ một hình khối khác — mọi luật của nguyên mẫu nhà vẫn chạy bên dưới, và
     phase sau đụng vào `groundFloor`/`rooftop` sẽ làm cửa mọc lại trên mặt kim tự tháp.
  2. **Thêm một kiểu mái `pyramid-full` cao bằng cả công trình.** Loại: cùng bệnh — vẫn phải có
     một cái thân ở dưới để mà đội, và ADR-051 vừa dạy đúng bài này (một `switch` mái không tách
     được hai công trình khác nhau về KHỐI).
  3. ⭐ **Một nguyên mẫu thứ 8, `monolith`, dựng thẳng từ mặt đất: không thân tường, không
     `groundFloor`, không `eaves`, không `rooftop`** — chọn.
- **Lý do chọn**: đúng khuôn ba lớp đã dùng chín lần (BẢNG khai → NHÀ MÁY HÌNH dựng → nơi dùng chỉ
  ĐỌC). Nó cũng làm cho *"không có cửa trên kim tự tháp"* thành một sự thật CẤU TRÚC thay vì một
  con số khai khéo — thứ duy nhất sống sót qua các phase sau.
- **Trade-off**: hai kỷ mất mọi chi tiết của tầng trệt và mái. Đó là **đúng ý đồ**, không phải mất
  mát: một khối đá thì không có cửa sổ.
- **Ảnh hưởng**: kỷ 2 ra chóp TRƠN (tỉ lệ cao:đáy 0,64 như Giza), kỷ 3 ra GIẬT CẤP có cầu thang
  chính diện — hai kỷ liền nhau, hai hình khác hẳn, và bản quét chấm cặp 2↔3 vẫn trên ngưỡng.
  Đóng `TECH_DEBT #75`.
- **Điều kiện xem lại**: nếu có kỷ thứ ba cần khối đặc (lăng mộ, gò đền), khai thêm dòng vào bảng
  chứ đừng thêm nhánh `if` theo số kỷ.

---

## 📚 Rotated 2026-09-09 → [`docs/archive/ARCHITECTURE_DECISIONS_2026-09-09.md`](docs/archive/ARCHITECTURE_DECISIONS_2026-09-09.md)

16 entries moved verbatim (ADR-076); nothing deleted. Find one: `grep -n '<title>' docs/archive/ARCHITECTURE_DECISIONS_2026-09-09.md`.

<details><summary>Titles</summary>

- ADR-067 — Màn Thống kê có MỘT nguồn kỳ thời gian, và kỳ mang nghĩa LỊCH chứ không phải "N ngày gần nhất"
- ADR-066 — Bộ xương thành phố SINH THEO KỶ bằng chia đôi đệ quy; đường là RANH GIỚI THỬA, không phải hàng và cột
- ADR-065 — **BÀN CỜ LÀ MỘT MỐC LỊCH SỬ, KHÔNG PHẢI MỘT CÁCH SẮP XẾP MẶC ĐỊNH**: bố cục bên trong một thửa có trục `layout`, và một khu nhà phải NẰM TRONG thửa của nó
- ADR-064 — Hợp nhất hai nhánh: **BSP quyết cắt Ở ĐÂU, cung cong quyết cắt theo HÌNH GÌ**; và một thửa là TẬP Ô, không phải hình chữ nhật đã khai
- ADR-061 — Tách "đã MỜI" khỏi "đã XEM" để gỡ nốt ngoại lệ cuối của luật mức độ làm phiền
- ADR-061 — Khung hình lùi ra tới mức TỐI THIỂU đủ để không cắt công trình nào; và cái trần 1,35 cũ và lời hứa "không cắt" là hai thứ KHÔNG THỂ CÙNG ĐÚNG
- ADR-060 — MỘT ngôn ngữ hình cho mọi phần thưởng, và một luật MỨC ĐỘ LÀM PHIỀN có phân tầng
- ADR-059 — MẠNG ĐƯỜNG là một trục bản sắc: mỗi kỷ tự sinh lấy tập ô đường của mình bằng những CUNG CONG, thay cho một bàn cờ chung cho cả 15 kỷ
- ADR-058 — TIM ĐƯỜNG là một trục bản sắc, và độ lệch của nó là thuộc tính của RANH GIỚI chứ không phải của Ô
- ADR-057 — Chân giải bằng KHỚP NGƯỢC: đặt bàn chân trước, suy ngược ra góc đùi và góc gối
- ADR-056 — DÁNG ĐI là một trục bản sắc riêng, và bốn chiều chuyển động mới đều phải luồn qua ràng buộc "bàn chân không được trượt"
- ADR-055 — Cơ thể cư dân dựng bằng MẶT TRÒN XOAY khai bằng dữ liệu thuần, không bằng hình khối của three; và một ngân sách lạc hậu theo hướng SIẾT thì im lặng vĩnh viễn
- ADR-054 — Vật liệu của thứ đội trên đầu là một TRỤC RIÊNG, không phải một sắc độ của quần; và một tham số bị một biến cùng tên che khuất đã giết hai tính năng trong im lặng
- ADR-053 — Cư dân là một BỘ XƯƠNG có khớp, dựng bằng MỘT InstancedMesh hộp đơn vị; dáng đi là hàm của QUÃNG ĐƯỜNG đã đi, không phải của thời gian
- ADR-052 — Một ô nhà dân là một KHU PHỐ, không phải một căn nhà; và «thêm nhà» là điều bất khả, chỉ có «chia nhỏ»
- ADR-051 — Kim tự tháp và ziggurat là HAI hình khối, không phải một giá trị mái viết khác đi; và một nhánh `default` biến «thiếu `case`» thành «lặng lẽ đổi kiểu»

</details>

---

## ADR-089 — Round 49: give the machine something to blow, and light the fire — props that move, fire and night, weather that wets the ground

**Date**: 2026-09-09 · **Order**: *"CHO CÁI MÁY THỨ ĐỂ THỔI, VÀ THẮP LỬA LÊN … tôi mở tab Thành Phố lúc 10 giờ tối, không chạm gì, nhìn 10 giây — và tôi thấy lửa cháy, cờ bay, thuyền nhấp nhô."* Full authority; no performance measuring; the only numeric gate is the 105 era pairs; ADR-007's two tests are the only stop condition.

### Context
Round 48 built the motion machine — one clock, a per-vertex `aMotion`, particles — and had almost nothing to blow: no flag, sail, boat or crane existed, the only "fire" was a tag with no flame, and the sky did the same thing at every hour. Worse, one of round 48's own measurements was carried by smoke and residents alone: the merged city (trees, cloth) never moved in the tool, and no test was red (lesson 106).

### Decisions
0. **Lesson 106 — the program cache key.** `applySurfaceDetail` gave every patched material the same `customProgramCacheKey`. The motion injection edits shader CODE, so whichever material compiled first decided for all: the ground's program (no motion) served the merged city too, and nothing merged ever moved. The key now differs with motion; a control test builds one material with and one without and demands different keys. Era 8, two frames 0,8 s apart: **0,31 % → 1,44 %** of pixels change, with no other change in between.
1. **Cloth is two dyes, not one role.** `canvas` = undyed sailcloth (sails, awnings, tents, laundry sheets — one sun-bleached linen for all eras, the `straw` logic) and `flag` = dyed (`FLAG_HUE` per era: heraldic red mostly, blue for Paris and New York, green for Dubai — never the UI accent, which is violet in era 6 and fails the magenta guard). `cloth`/`cloth2` stay the residents' dyes. Every new role (`canvas` · `flag` · `hull` · `hook` · `flame`) rides the `wood` family, so no era gains a draw call; the stall's goods went `gold` → `trim` because era 13 draws no gold at all.
2. **Props that move.** A flag on every `mast` motif and on rooftop masts (a mirrored PAIR — the symmetry law), a hanging cloth on every `banner`; **boats** from `waterProps.js` (cells with `insetAt` above a per-water threshold, 1,7 cells apart, yaw along the water's open axis; item kind `water`, group `landscape` so they widen neither the city box nor the blocker list, 1,3× scale, the whole hull a rigid `bob`); **cranes** on scaffolds past t > 0,3 (a wooden jib before era 10, a tower crane after; `hook` bobs); **life props** from `lifeProps.js` (`ERA_LIFE`, 15 rows: stalls with awnings, laundry lines, tents, campfires, braziers, forges, wells, barrels, firewood, lanterns, carts, animals, benches) on free cells that touch a road or sit within two cells of a home — hash-ranked, only-add, no existing prop re-rolled. Flap weights: a flag is held along its −X edge, a hanging cloth along its top; the held edge weighs 0.
3. **Fire.** `PARTICLE_STYLE.fire` — additive, unfogged tongues that shrink and cool from orange to dark red, every fourth one an ember. Sources are every part tagged `fire` in ANY group: campfire · brazier · forge · firepit · a torch on the lamp posts of eras 1–3 (a bronze collar keeps `gold` in those eras — a family that vanishes moves five draw-call tables). `ERA_MOTION` declares `fire` for eras 1–10 and 12, and `ERA_LIFE` lists a fire-bearing prop FIRST for each of them, so a declared particle kind always has a source (the `sceneStats` law). At night `flame` joins `glass` in the glow sink, in its own colour. **Local light**: up to 6 `PointLight`s (`FIRE_LIGHT`: reach 0,24 cell, decay 2), nearest to the centre first, flicker = three incommensurate sines of t (`fireFlicker`) — deterministic, never `Math.random`. Not a fourth fill light.
4. **Museum hour 15 → 18**, by eye on two frames of era 1: at 15:00 the fires are three dots in flat sun; at 18:00 the same city has warm side-light, long shadows, lit windows and a pool of firelight at every hearth, roofs still readable. A sealed era keeps ONE hour — the promise of ADR-086 — and now one weather (`museumWeather`).
5. **Weather.** `weather.js`: `weatherAt(era, hour)` is a pure table per DAY PHASE (so it changes only when the daylight phase does — no second rebuild trigger). **The one law: rain wets the ground** — `wet ≥ rain` by construction in `normalize`; the three ground materials go through `wetSurface` (roughness → 0,34, albedo × 0,70, specular gain × 2,4 — applied ONLY when wet, the dry law of the wiring test holds); fog = daylight haze × (1 + 2,5 · weather fog); rain/drizzle are streak particles owned by the weather, never by an era's list; smoke is lit by the phase (`smokeLightFor`: night 0,3). The tool renders the weather of `--hour`; `--dry` is the control frame. Era 13 at 22:00, wet vs dry: **29,8 %** of pixels differ, and the difference is a darker, glossier street under white streaks — not noise on a matte one.
6. **People.** `#79`: `steel` split from `gear` (helmet, tool head) by HUE, kept as dark as gear on purpose — the SSh-40 of era 12 was painted the colour of the jacket; the palette test's exception list [12, 15] is history, not a threshold. `#81`: brim 1,9 → 1,7 headW — the crown (0,62 × brim) must clear the skull, so 1,62 is the floor; partial by design.
7. **Re-based on purpose:** GOLDEN eras 1 · 4 · 6 · 8 · 12 · 13 (flag, banner and flame parts), `MOC_TAM_GIAC` all 15 (+0,5 … +2,1 %), the cityFocus control list [1, 8, 10, 12, 15] / 8 flights (era 12's masthead flag), `cityFocus.test.js` blockers now exclude `water` through the same `KIND_NGOAI_LUOI` as `sceneGraph`. Draw-call marks untouched.

### Consequences
| | Before (round 48) | After |
|---|---|---|
| Prop kinds | 6 (+ ground covers) | 20 (+ boats, cranes, 12 life kinds) |
| Flags · sails · boats · cranes | 0 · 0 · 0 · 0 | on every mast · on 5 boat rigs · 8 boats/era with water · 1 per scaffold past 30 % |
| Particle kinds | 6 (smoke · steam · snow · sand · dust · birds) | 9 (+ fire, rain, drizzle) |
| Eras with a fire burning | 0 | 11 (1–10, 12), lit and flickering at night |
| Weather kinds | 1 | 7 (clear · haze · fog · drizzle · rain · snow · sand), per era, per phase |
| Rain without wet ground | possible | impossible (`wet ≥ rain`) |
| Pixels changed, era 8, 0,8 s apart | 0,31 % (nothing merged moved) | 1,44 % |
| Museum hour | 15:00 | 18:00 |
| 3D debts | 47 open | #79 closed · #81 partial · #75 and #24 confirmed closed (frame-fit 0/15) · #90(b), #77 read and left open |

**Not done, on purpose:** `#90(b)` with `#77` (the rooftop span as a pixel relation touches 12 green tests — its own round); people talking in pairs; puddles as a mask (wet is roughness + albedo + specular); nothing removed in the 390 px audit this round (judged on the sweep, see BAN_GIAO); no 22:00 sweep of the round-48 code (the after-sweep is the record).

### Tool lessons
- A percentage cannot say WHAT is still — the magenta heat-map of changed pixels is what found lesson 106 (flags, sails, palms all black; only the shoreline and the residents lit up).
- `--dry` is the only fair control for a weather frame: same hour, same light, same clock, no weather.

---
