> Last update: **2026-09-17** — **ROUND 62: ONE VISUAL VOCABULARY, A SHORTER ENDING (ADR-098).**
> Order: *"vòng này THUẦN UX/UI… mở bất kỳ màn nào trong app, nó trông như cùng một người làm ra."*
> Everything on `main`, on top of round 61 (the 3D-city stream, which this round does not touch).
>
> ### The audit that decided the round — one element at a time, across everything the app ships
> | element | ways the app drew it |
> |---|---|
> | nhãn nhỏ viết hoa (eyebrow) | **22 cặp cỡ+giãn chữ trên 111 chỗ dùng** |
> | mặt thẻ | **7 bản khai riêng**, một bản đã lệch |
> | con số có mẫu số | **4 kiểu, chỉ riêng màn Thành Phố** |
> | `Cài đặt` phẳng, mở hết | **4.919 px ≈ 5,8 màn điện thoại · 11 mục** |
> | cái kết, phiên may nhất | **11 thẻ · 39,0 giây** |
> ⚠️ Không cái nào là lỗi. Mỗi màn làm ở một vòng khác nhau, mỗi quyết định đều hợp lý hôm ấy, và
> **chưa bao giờ có ai đặt hai màn cạnh nhau**. Đó là cách một app thành ra "vá bởi mười ba người"
> trong khi từng commit một đều cẩn thận.
>
> ### Done
> 1. **`components/shared/surface.js` — MỘT bộ từ vựng thị giác.** `CARD` · `CARD_INSET` · `EYEBROW`
>    · `ratio()` · `remaining()`. Bảy bản khai mặt thẻ còn một; 109 chỗ eyebrow từ 22 hình dạng còn
>    **hai** (nhãn mục 10px/0.2em · viên nhãn có nền 11px/0.14em — hai PHẦN TỬ khác nhau, không phải
>    hai cỡ của một).
>    ⚠️ **Bản lệch là lệch thật**: `StatsDashboard` viết cứng `1px` chỗ ba màn kia đọc
>    `var(--skin-card-border-width, 1px)` — dưới một skin có đặt biến ấy, màn Thống kê có độ dày
>    viền khác cả app, suốt mười vòng, vì muốn thấy phải đọc hai file cùng lúc.
> 2. **`n/N`, không khoảng trắng, và KHÔNG có số dư đứng cạnh.** Ô «Chuỗi» in `0 / 7` trong khi tám
>    viên nhãn ngay dưới in `4/5`. `38/75 còn 37` là `75 − 38` nói hai lần.
>    ⚠️ `còn 1 nữa ★` ĐƯỢC GIỮ: nó không phải số dư, nó là **mốc cách một bước** mà phần thưởng niêm
>    phong vĩnh viễn (ADR-007). Số dư đáng giữ khi nó trả lời *bao giờ*; không đáng khi nó chỉ nói
>    lại cái phân số vừa sinh ra nó.
> 3. **Cái kết gộp chỗ trùng: 11 thẻ → 8, 39,0 s → 29,6 s** (phiên thường 5 → 4, 19,4 s → 16,8 s).
>    · **«Nhịp»** = `streak` + `today`: hai thẻ liền nhau, CÙNG hình dạng (số 56px + dải ngang), cùng
>      trả lời "nhịp của tôi thế nào", khác mỗi đơn vị.
>    · **«Kho báu»** = `rank` + `relic` + `evolve`: ba bản dựng của một bố cục, cùng nói *"bạn vừa có
>      một buff vĩnh viễn"*, nổ liên tiếp 10,2 giây đúng lúc cái kết phải to nhất. **To không phải là
>      dài.**
>    ⚠️ **Ca MỘT MÓN giữ nguyên bố cục cũ** — đó là ca hay gặp nhất; xếp nó thành danh sách một dòng
>    là đổi cái hay gặp lấy cái hiếm gặp. ⚠️ **0 cú bấm thêm, 0 sự thật mất đi**: `isMax`/`nextAt` của
>    di vật vẫn còn (câu duy nhất biến di vật từ cúp lưu niệm thành thứ còn ở phía trước), và
>    `treasure` vẫn là thẻ hạng hiếm, vẫn nổ toàn màn, vẫn đứng lâu hơn.
> 4. **`Cài đặt` gấp lại: 11 mục, 10 mục thu gọn, 0 mục bị xoá.** Câu hỏi vòng 38 quyết chuyện này —
>    gói âm thanh, giao diện, quyền thông báo, xuất dữ liệu, New Game+, Giới thiệu: bật/tắt đúng một
>    lần rồi thôi. Thứ Đàm thật sự đổi là độ dài phiên và mục tiêu ngày, và chúng nằm trên một bức
>    tường năm màn hình những quyết định đã chốt từ lâu.
> 5. **Ba tab con Hành trang tự nói nó có gì**: `Kỹ năng 4/36` · `Công trình 38/75` · `Di vật 12/15` —
>    đúng con số màn đằng sau đang in ở dòng đầu, chỉ đưa lên trước cú chạm.
> 6. **Hai nhiệm vụ khai mục tiêu bằng GIỜ nhưng đếm bằng PHÚT** (`Chinh phục 2 giờ… 0/120`) — nay
>    nói `120 phút`, khớp bộ đếm và khớp mười nhiệm vụ cùng loại. Không đổi `goal`, không đổi XP.
>
> ### Audited, and deliberately NOT changed
> · **Thống kê** — ba câu trả lời vòng 36 vẫn đúng, không chỗ nào còn hiện hệ huy hiệu đã xoá, định
>   dạng giờ/phần trăm/cỡ mẫu đã đi chung `formatMinutesVi`. Không có sửa nào xứng đáng.
> · **Đơn vị** — `phiên`/`phút`/`giờ`/`ngày` sạch; mọi chỗ đổi phút ra giờ đều qua một formatter.
> · **`ActionButton`** — còn 77 thẻ `<button>` thô, nhưng gần hết là viên nhãn tab, ô lưới, vùng chạm
>   của thẻ. Ép chúng qua `ActionButton` sẽ làm chúng TRÔNG NHƯ NÚT, đúng chiều ngược lại.
>
> ### Gates
> lint ✅ · build ✅ · `npm run test:quiet` — xem lần chạy ghi kèm commit.
> ⚠️ `shared/surface.test.js` là cổng mới, và nó **bắt được ba bản sao mặt thẻ mà cái `grep` mở màn
> đã bỏ sót** (`FocusRail` · `TodayHero` · `PomodoroEngine`) — đó chính là lý do phải là một bài
> test chứ không phải một quy ước. **Một ngưỡng không có cổng là một cái phễu.**

---

> Previous: **2026-09-17** — **ROUND 61: LÕM, AND CHỖ THẮT (Việc 1–4).**
> Order: *"Cận cảnh cư dân vẫn là một con ma-nơ-canh mắt lồi với những khối lòi lõm lạ… Thêm khối
> LỒI không tạo ra chỗ LÕM. Muốn có chỗ lõm thì phải KHOÉT ĐƯỜNG SINH."* Branch
> `claude/city-skill-points-display-7k4nof`. Full reasoning: **ADR-097**.
>
> ### Việc 1–3 — the joint is the narrowest point of a limb, sealed by overlap, not by a sphere
> Round 58 sized each joint sphere to the max radius of its two neighbours — mathematically exact
> at every bend angle, and it read as a string of beads once the eye was looking for anatomy, not a
> mannequin. `limb`/`calf`/`cuff`'s ring profiles are inverted: the joint-adjacent end is now the
> segment's narrowest radius (limb's −1 end and calf's +1 end pinned to the identical value,
> 0.3158 raw), the belly peaks mid-segment (limb ≈ y 0.10, calf ≈ y 0.15), and the six joint-ball
> pieces are deleted outright. Each bone's far end now extends past its neighbouring joint by
> `JOINT_OVERLAP = 0.35` of its own length (`overlapNear`/`overlapFar`), sealing the gap by two
> solids overlapping instead of a sphere padding it.
>
>     residual gap at max gait angle   elbow ≈33° → <1%   ·   knee ≈84° → <6% (binding case)
>     overlap chosen from a measured table (8%…45% tried); 0.35 keeps the elbow sealed and avoids
>     the tip-poke-through risk of pushing further, with the knee's own 3.92% cited by name
>     neck reuses `calf` (×1.15) instead of `limb` — a cinched cylinder with no opposing joint
>     LEG_LOOK.boot's shin switches `limb` → `calf`; its old dodge (a wide ankle via the wrong
>     shape) stops working once `limb` also pinches, so the "wider boot" look now comes from `loW`
>
> Verified two ways: `humanJoints.test.js` rebuilds a real point-in-lathe-solid gap probe (reusing
> the project's own `profileAt`/ring-interpolation math, not an approximation) instead of the old
> ball-radius formula test; and a printed radius profile from shoulder to wrist — before, four
> irregular peaks from the ball bumps; after, two clean up-down cycles, with the elbow measurably
> narrower than both the belly above and the belly below it, at every one of the 15 eras.
>
> Ripple, each with a dated before/after baseline rather than a loosened threshold:
> `drawCallBudget.test.js` (neck→`calf` costs +1 draw call in the 7/15 eras that had no bare `calf`
> already), `humanCoarse.test.js` (the six deleted `bead` spheres change both the coarse-block floor
> and the triangle-savings percentage), `humanPose.test.js` (the leg-cluster block count drops
> 8→6; the silhouette-swing floor is lowered with a measured explanation — the overlap-extended
> segment's larger bounding box dilutes a PROXY metric, confirmed NOT a walking-mechanism regression
> by a separate angle-amplitude test that stayed exact), `humanSeams.test.js`, `humanSkull.test.js`,
> `humanWardrobe.test.js`.
>
> ### Việc 4 — a real eye socket, carved into the skull's own generating line
> The brow ridge (round 58) and the temple pinch (round 58) already existed, but the eyeball itself
> still sat glued at a near-flat depth — `eyeWhite` reached 0.557 `headW` forward while the skull's
> own bare surface at eye height was only ≈0.46, and the pupil (0.595–0.609) poked out past the brow
> ridge (≈0.505–0.510). Two numbers change: `SKULL_RINGS` gains a dedicated floor ring at the eye's
> own height (`[0.045, 0.85]`, replacing the old generic temple pinch at `[-0.04, 0.84]` — one ring
> now serves as BOTH the temple pinch and the socket floor, since a solid of revolution is uniformly
> narrow at a given height in every direction); and `eyeL/R`/`pupilL/R` move backward along the depth
> axis (`x`: 0.44→0.316 for the eyeWhite, 0.525→0.386 for the pupil) while keeping their exact slit
> size and shape from round 59, and the pupil's forward offset from the eyeWhite's own centre — so it
> still visibly pokes through the eyeWhite surface instead of disappearing concentrically (round 56).
>
> A first attempt (floor 0.78, at the exact old temple y-position) broke a THIRD system: 284 hair
> vertices fell inside the skull (`humanShape.test.js`'s hairline-containment test). Root cause,
> found by tracing the one worst vertex: `scalpFit` stretches the scalp mesh's Y axis by
> `SCALP_LIFT` **around the chin**, not around each ring's own position, so a vertex sitting exactly
> at the socket floor in ring-space lands, after the stretch, on the already-wide rising slope
> toward the forehead — a narrow, deep notch is fragile against that mismatch. The shipped notch is
> shallower (floor 0.85) and wider (span 0.155 of head height instead of 0.12, the intermediate ring
> at 0.08 dropped so the profile rises in one gradual slope straight to the parietal ring), clearing
> the hairline test's existing 3% margin rather than inventing a new one.
>
> `humanSkull.test.js`'s round-58 assertion *"brow ridge must never exceed the eye"* is INVERTED,
> not relaxed: that rule was true only because THAT round's fix enlarged the brow ridge itself into
> an awning that swallowed the eyes in shadow. This round never touches the brow ridge, so the
> failure mode can't recur — the new assertion is the opposite, verified at all 15 eras in the new
> `humanFace.test.js`, which also asserts zero new blocks for cheek/nose/brow.
>
> Việc 5–6 (temple hollow — substantially covered as a side effect above; cheek hollow, philtrum,
> collarbone notch) are deferred, not silently dropped: all three remaining features are FRONT-only
> local dents that a rotationally-symmetric lathe cannot represent without the same per-column
> construction the hairline uses, whose fragility this round just measured first-hand. Recorded for
> `TECH_DEBT_3D` rather than attempted under time pressure with the budget this round already spent.
>
> Gates: lint clean, build OK, `npm run test:quiet` 1852 → 1858 pass, 0 fail, skipped 1. Photo
> evidence: face front-on close-up, face 3/4 profile, full arm+leg silhouette, 3-frame walk strip at
> max bend, and a printed shoulder-to-wrist radius chart (before/after) — all at true resolution.
>
>
> ### Việc 0(b) — a NaN loses EVERY comparison, so it must never reach one
> Round 57 wrote the close-up gate as `boxDistance(stand, nearestBlocker(stand, blockers))`: a
> DISTANCE handed to the parameter that wants a BOX. `boxDistance` opened with
> `if (!point || !box) return Infinity`, giving exactly two branches —
>
>     nearestBlocker = 1  =>  boxDistance(p, 1) = NaN   =>  `NaN >= 0.35` false =>  REJECTED
>     nearestBlocker = 0  =>  `!0` is true => Infinity  =>  `Inf >= 0.35` true  =>  ACCEPTED
>
> and `nearestBlocker = 0` means the camera is INSIDE a building. The gate was inverted: the only
> positions it ever accepted were the ones standing in a wall. Nothing threw and no test went red,
> because NaN loses `<`, `>` and `>=` alike — there is no safe way to write the comparison.
> New `finite.js` guards every place a geometric quantity meets a threshold, and the boundary came
> out of `pickNearest`'s own test: **ABSENT is not MALFORMED.** No ray and no box mean "nothing was
> hit" — the right answer for a tap on empty sky. A present-but-broken argument throws.
>
> ### Việc 0(a) — the rebuilt row, and the second defect it uncovered
> With the measurement fixed, all 15 eras found a standing spot. But four chose to walk round
> BEHIND the resident:
>
>     góc lệch trước:  kỷ 3 = 140°  ·  kỷ 4 = −140°  ·  kỷ 13 = −160°  ·  kỷ 14 = −120°
>     góc lệch sau:    lớn nhất 80°, ở đúng MỘT kỷ   ·   kỷ nhìn sau gáy: 4/15 → 0/15
>
> The fault was the search ORDER, not either test: the old loop swept the whole circle at the near
> distance before trying to back off, so a spot behind the head always beat a spot in front that
> needed one step of distance. New order — **in front → back off → only then past 90°.**
> A face seen from farther away is still a face; the back of a head at any distance is not.
> Price: four eras back off 0.30–1.50 units. Debts **#98** and **#99** close.
>
> ### Việc 1 — one coarse shape, and it is the first entry in the budget table that PAYS FOR ITSELF
> `bead` shares `DOME_RINGS` with `dome` — the same frozen table, so the swap is provably
> shape-preserving — at 16 sides instead of 60. The side count comes from a measurement, not from
> taste: an n-gon of radius r falls short by `r(1 − cos(π/n))`, so at the close-up scale of **1,728
> px per world unit** (derived in the test from `residentViewDistance`, never copied) 16 sides hold
> the error under half a pixel for anything up to 52 px wide.
>
>     11 khối qua ngưỡng   hai lòng trắng 20,6 px · hai con ngươi 14,8 · sáu quả cầu khớp 31,5–36,2 · gờ mày 46,7
>     2 khối KHÔNG qua     gáy và mái tóc trước trán, đều 53,1 px ⇒ ở lại `dome`
>     tam giác/người       22.390 → 16.582  (−5.808, −25,9%)   ·   28 cư dân: −162.624/cảnh
>     điểm ảnh đổi         kỷ 1: 397/849.420 = 0,047%   ·   kỷ 12: 180 = 0,021%
>
> The guard checks BOTH directions: a coarse block over the line is red, and a fine block under it
> is red too — it would be wasting the budget.
>
> ### Việc 2 + 3 — every garment edge is a step in the generating line
> A collar stuck on is a second convex body around the neck, and this project has paid twice for
> that shape of mistake (round 58's eight skull blocks, round 59's four eyelid blocks). A real
> collar is where the cloth folds back and thickens — one place where the radius jumps on a single
> surface of revolution.
>
>     `seam`  `chest` + a step at EACH end. One shape, three blocks: trapezius shows only the TOP
>             step (collar), torso only the BOTTOM (hem), pelvis the bottom (trouser seat).
>     `belt`  `seam` + a waist cinch. **0 extra draw calls** — `bodyShape()` answers ONE shape for
>             all three torso blocks, so a belted era uses `belt` INSTEAD OF `seam`.
>     `cuff`  `calf` + a step at the lower end ⇒ sleeve cuff AND trouser hem from one shape. Its +1
>             end radius is identical to `calf`'s, because round 58 sizes every joint ball from it.
>
> Fifteen eras, three disjoint groups, decided by history: **wrapped cloth 2** (a Göbekli Tepe hide
> and an Egyptian shendyt have no sewn edge, so eras 1 and 2 pay NOTHING) · **sewn 5** · **sewn and
> belted 8**.
>
> ⚠️ **TWO MEASURING INSTRUMENTS LIED, AND BOTH ARE RECORDED WHERE THEY LIED.** The first definition
> of "a sewn edge" was *a crease over 40°* — and the counter-test rejected it, correctly: `chest`
> has had two such creases since round 52, **53.6° at the waist and 88° at the shoulder**. Believing
> it would have meant raising the threshold until the test had no teeth, or declaring a plain torso
> tailored. The right question is a DIRECTION: an outward ledge (|Δr| ≥ 3|Δy|) sharp at BOTH ends.
> Then the belt's upper edge measured **35.0°** — under the smoothing threshold, so it would have
> been averaged away: every number right, and no belt in the photograph. One extra near-vertical
> ring takes it to 56.6°.
>
>     gờ cổ áo   4,9–7,7 điểm ảnh ở cận cảnh, 13 kỷ   ·   dải thắt lưng 8,3 điểm ảnh
>
> ### Việc 5 — twelve eras put shoes on
> `shoe` is a 16-side lathe whose widest ring is the **sole welt**. The foot block is already
> 1.70 × 1.08 in plan, so a surface of revolution stretched that way IS a shoe outline, and the one
> step at the bottom wraps the whole edge — sole and toe in a single declaration. The side count's
> cost is stated, not hidden: the foot is 66 px wide, so the silhouette falls short by **0.63 px**,
> above the half-pixel ceiling `bead` must keep. That ceiling was set for blocks on the FACE.
>
> One guard is deliberately released and the release is declared: a bare foot IS the continuation of
> a bare shin, so eras 1–3 keep `continues` and the skin colour; a shoe is not, and `VIEN_CO_THAT`
> has listed "viền giày" as a real edge since round 58. **11/15 eras now wear shoes in their own
> colour.**
>
> ### Gates
>
>     lệnh vẽ / kỷ        8 → 8–13 tuỳ kỷ    ·   kỷ 1 · 2 · 3 trả ÍT NHẤT (vải quấn, chân đất)
>     Chromium kỷ 1·8·13  đo lại BA lần trong ngày: 19·24·18 → 19·26·19 → 19·27·20
>                         khớp dự đoán từng kỷ cả ba lần; khoản "lệch chưa truy" 3·3·1 KHÔNG đổi
>     tam giác/người      22.390 → 16.460…20.712 tuỳ kỷ — kết vòng THẤP HƠN lúc mở vòng
>     khối/người          41 → 40–42 (trần 56)   ·   0 khối thêm cho cả tủ đồ lẫn giày
>
> Round 59's Việc 3 (`lineOfSight`) shipped to `main` in the same push; it had been finished but
> unmerged when this round opened.
>
> ---
>
> **ROUND 58 (2026-09-13): THE FIRST TIME I LOOKED A RESIDENT IN THE FACE.**
> Order: *"Chín vòng qua nhân vật được dựng cho một hình cao 70 px — nay tôi nhìn gần gấp năm lần,
> và ở cỡ ấy nó đọc ra là một con ma-nơ-canh… Không phải thiếu chi tiết. Là thiếu HÌNH."* Branch
> `claude/city-skill-points-display-7k4nof`.
>
> ### Việc 1 — the fifth instance of one defect shape gets a GUARD, not a fix
> Đàm counted them: white rivets on the shoulders (r54) · a white collar ring (r54) · a flat
> hairline (r56) · a helmet in cloth colour (49→56) · white spheres for hands (r58). All five
> passed every existing test; all five were caught by a photograph. His instruction was explicit —
> *"dựng một cái gác cho hình dạng lỗi này, không phải sửa từng ca."*
>
> The obvious measurement was built FIRST and rejected: enumerate adjacent blocks of differing
> colour → **99 pairs** across 15 eras, including `forearmR ↔ pelvis` and `carry ↔ head`, whose
> bounding boxes overlap while their surfaces never meet. A 99-row whitelist is a guard nobody
> reads, and a guard nobody reads is about to be loosened.
>
> `humanSeams.js` asks by STRUCTURE instead: a block declares `continues: '<id>'` — *"I am not a
> thing, I am the next part of that segment"* — and must then carry that segment's colour role.
> Feet, thumbs and the six joint balls declare it. **10 declarations per person, 0 faults in 15/15
> eras.** `VIEN_CO_THAT` lists the 7 places real life DOES have an edge, so widening the guard means
> claiming one more of those exists.
>
>     era 1 → 15   khối nối dài: 10/người   ·   kỷ có lỗi viền màu: 0/15
>
> ⚠️ **The first version of this guard shipped its own bug, and the guard's own test now locks it.**
> Feet declared `continues: 'calfL'` — but `calf` is the SHAPE name; the BLOCK is `shinL`. A check
> that only compares colours reads `undefined !== undefined` as "equal" and goes silent on exactly
> the four blocks it must watch. The test fires a body whose `continues` points at a non-existent id
> and demands the guard SHOUT.
>
> **Hands**: a flat block plus a thumb, skin when the sleeve is open, glove colour when gloved,
> never a third colour. `style.gloves` did not exist in the wardrobe, so that branch was permanently
> false — code claiming a law it did not have. Now a real fact, declared only where real life has it:
> era 12 (Stalingrad), a padded mitten the same colour as the padded sleeve. Era 9's white gloves on
> a dark tailcoat are a REAL edge this model would erase, so that era keeps bare hands.
> The thumb uses the hand's own `calf` shape, not `prism`: a new shape is one draw call for the
> whole population, and `prism` cost era 2 the exact draw call round 54 had won back (17 > 16, red).
>
> ### Việc 2 — the smallest sealing radius, and it does not depend on the angle
> Maximum bend the gait produces, re-measured by the test itself rather than pinned:
>
>     đầu gối 84,3°   ·   khuỷu 32,9°   ·   vai 27,1°
>
> Then the surprise: a segment's end rim is a circle **centred ON the joint**, and rotation about
> the joint preserves distance from it ⇒ a ball of radius `max(the two end radii)` seals at EVERY
> angle. 84° costs nothing extra. That is the number now used, derived from the real profiles.
> The load-bearing premise is that the ball is centred on the joint, so the test checks that in
> three walking frames — a displaced ball only opens its gap while the limb is bent.
>
> ### Việc 3 — a photograph rejected the first skull, and the rejection is the lesson
> Before: z/x of the head measured **1.000** (a human skull is 0.78), and the whole face lay in a
> band 0.10 head-widths deep — a flat plate with dots on it.
>
> First attempt: all seven features as **eight convex blocks glued onto the sphere**, 0 new shapes,
> 0 extra draw calls. Every number correct. The photo:
>
>     gờ mày   → một THANH NGANG sáng giữa tóc và mắt (băng-đô / kính bảo hộ)
>     gò má    → hai QUẢ BÓNG dưới mắt (má chuột túi)
>     cằm      → quả bóng thứ ba dán dưới miệng
>     hàm      → một TẤM BẸT có góc cạnh hai bên
>
> **A sum of convex bodies is not a smooth surface — it is a set of bumps.** Each block brings its
> own silhouette and its own normal break. The result was an assembled mask, worse than round 56's
> plain face. Same lesson the brimmed hat taught in August: ask *"how many objects is this in real
> life?"*, and one surface of revolution beat two blocks on both looks and cost.
>
> Second attempt, shipped: the head gets its own lathe (`skull` / `SKULL_RINGS`) carrying five of
> the seven — chin · jaw taper · cheekbone · **temple pinch** · sloping forehead. Only `occiput` and
> `browRidge` stay blocks, because no surface of revolution is asymmetric front-to-back.
> Price: **+1 draw call in all 15 eras** (18 → 19, +5.5%), paid explicitly with a dated baseline.
>
> ⚠️ Three faults surfaced only because a gate fired, and each is worth more than the feature:
> · `scalp` promised in PROSE that its rings equalled the head's. Changing the head broke it in
>   silence — hair 0.984 vs skull 1.00 at the parietal ⇒ hair inside the skull, round 56's seam back.
>   Now one shared constant. **A promise in prose has no teeth.**
> · The hairline's three numbers were in RING-INDEX units, solved for a 6-ring profile. On 9 rings
>   the front hairline fell 0.672 → **0.343** — down to eye level. Re-expressed in HEIGHT.
> · Round 56's geometric sufficiency proof ("the generating line is monotone") EXPIRED when the
>   temple pinch broke monotonicity. Clearance 2.79%, under its own 3% floor. What caught it was the
>   measured floor, not the sentence.
>
> ### Việc 4 — the neck existed in code and had never existed in a photograph
> Measured, era 1: jaw at y = 0.17231, top of the shoulder ball at y = 0.17335 ⇒ **visible neck =
> −0.020 head heights**. A negative number: the shoulder balls stood higher than the jaw, the pose of
> a man permanently shrugging. Shoulder line 0.88 → 0.74 `torsoH` (neck now +0.158) plus a trapezius
> block bridging neck to shoulder. One number fixed two faults — the fingertips now reach mid-thigh,
> the landmark `armLen`'s own comment had always claimed to hold.
>
> ### Việc 5 — three of the four hair elements already existed, and saying so beat adding blocks
> Sideburns come free from round 56's quadratic hairline (temple at 0.346 head heights, below the
> outer eye corner); the nape likewise (0.100); crown mass from `SCALP_LIFT`. Only the fringe needed
> a block. Its first two numbers were both wrong and both fixed by MEASUREMENT, not by eye: at
> x = 0.30 it sat INSIDE the scalp (0.530 vs 0.512) and at y = 0.735 it covered the eyebrows.
>
> ### Việc 8 — a stance that is a function of identity, not of time
> `humanStance.js`: standing leg · hip drop · **shoulder tilt OPPOSITE the hip** · head tilt · one
> bent arm. Applied as a constant bias ON TOP of the gait rather than as a separate standing pose,
> because residents are almost always walking. Twelve residents measured:
>
>     người  chân trụ   hông    vai     đầu    tay co
>       0     trái      1,9°  −2,5°  −0,2°    9,0°
>       1     phải     −3,0°   1,7°   0,2°   13,3°
>       6     phải     −2,2°   2,1°   0,6°   15,7°
>      11     trái      1,3°  −2,4°  −0,9°    5,2°
>
> ⚠️ **Two red-tests that came back GREEN were the most valuable thing in this section.**
> · Making the elbow share a salt with the hip — deliberately coupling two axes — left the
>   correlation test green, because `hong` carries a random SIGN (`ben`) that erases linear
>   correlation. The test compares magnitudes now.
> · Deleting `+ lechDau` from the head joint — switching OFF one of the five things Đàm asked for —
>   left the whole suite green. Nothing asked whether a computed quantity ARRIVED. Same family as the
>   helmet that carried cloth colour for seven rounds. A new test changes one stance field at a time
>   and demands the pose change.
>
> ### Gates
> lint · build · `npm run test:quiet`: **1,824 pass · 0 fail · skipped 1** (start line 1,797).
> Nineteen red-tests run this round, each naming what to break; two of them did not go red on the
> first try, and both became findings.

> Last update: **2026-09-12** — **ROUND 57: THE PICTURE WAS NEVER DRAWN AT FULL SIZE.**
> Order: *"Build lớn … bám sát lịch sử … Đây là phần phải gây hứng thú."* Branch
> `claude/city-skill-points-display-7k4nof`. Đàm's own hypothesis opened it, and MEASURING IT
> FIRST is the whole lesson of the round.
>
> ### Việc 1 — the hypothesis was WRONG, and the measurement found something else
> He suspected the post chain ran at CSS pixels and was stretched. A new permanent `[res]` line
> asked WebGL and the composer directly:
>
>     chuỗi (composer)            5600×2800   ← pixelRatio nhân HAI lần
>     đệm độ sâu                  2800×1400
>     bloom (tấm đích THẬT)       1400×700
>     `uTexel` của lượt ống kính  2800×1400
>
> `EffectComposer.setSize` multiplies by the renderer's pixelRatio **itself** (three places in
> three.js) and our call sites had multiplied already. So the colour chain ran at pixelRatio
> **squared** — the mirror of the hypothesis. **Second time `EffectComposer` fails to inherit the
> renderer's configuration** (round 55: `samples`).
> ⚠️ The expensive consequence was not waste: **the lens pass blurred at twice its intended
> radius**, because `uTexel` described a 2800-wide buffer while sampling a 5600-wide one. AO and
> depth of field were both smeared 2×. That is the "mềm nhũn", and it was never a shortage of pixels.
>
> ### And the stretch IS real — from a different cause
> `MAX_PIXEL_RATIO = 2` clamped his iPhone's DPR 3. A 390 CSS frame was drawn into **780** pixels
> on a screen area **1170** wide: **stretch 1.50×, only 44% of the pixels ever drawn.**
> ⚠️ **A ceiling that bites on one class of device is invisible on every other** — it never showed
> on the MacBook (DPR 2), which is the only place acceptance photos were ever taken.
>
> ### Việc 2–4 — fixed for the whole chain, and the tool answered honestly
> `composer.setPixelRatio(1)` (one convention: every size in `postFx.js` is device pixels) ·
> `MAX_PIXEL_RATIO` 3 · the app's initial size in device pixels. After: **every pass 4200×2100,
> ratio 1.000**, bloom exactly half by design.
> Việc 4: the capture tool renders through the app's own `createPostFx` (so it never lied about the
> chain) but captures at `deviceScaleFactor: 1` — with the canvas at 3× that makes every acceptance
> photo a 3× **downsample**, i.e. BETTER than Đàm's screen. Use `--dpr 1` at the device width for a
> true 1:1 photo. `--width 4200` works again too: round 56 blamed SwiftShader for its black frame,
> but the buffer then was 8400×4200 because of this same double multiply.
>
> ### Việc 5 — measured, and it inverted the assumption
> Tallest resident on a real iPhone frame (1170×726 device px), era 12, by `--mask residents`:
>
> | chế độ | cao |
> |---|---|
> | toàn cảnh (mặc định) | **82 px** |
> | đi bộ (6 bước) | **23 px** |
> | cận cảnh CÔNG TRÌNH | **22 px** |
>
> **Both close modes are SMALLER than the overview.** Walk mode puts the camera mid-street while
> people are spread along it, and `cityFocus` flies to a *building*. So before round 57 there was
> no mode at all in which a resident exceeded 82 px — at which the eyes of round 56 are 2–3 px.
> Three rounds of character work had nowhere to be seen.
>
> ### Việc 6 — tap a resident and the camera goes to them
> New pure module `engine/city3d/residentFocus.js` (touch box · eye point · caption from the real
> 15-era wardrobe · `planResidentFocus`), 9 tests. `--nguoi N` photographs it.
> ⚠️ **`planCityFocus` is the wrong planner for a person, and the photo said so before any test
> did.** It keeps `yaw` and has two levers when blocked — raise, and back off. Both are right for a
> building and wrong for a person: raising looks at the top of a head, backing off loses the very
> thing you came to see. Measured: a resident 0.204 units tall asking to stand at 0.60 got **6.10**
> back — overview distance again. A person needs the third lever: **walk around them.**
> ⚠️ And the clearance question differs too: `pathGuarantee` asks whether the whole FLIGHT grazes a
> building, which diving into a street always does. For a person the question is whether the camera
> **ends up inside a wall**.
> Result: 82 px → **~390 px** tall in the same 726-px frame.

> Last update: **2026-09-12** — **ROUND 56 (in progress): EACH THING ITS OWN SHAPE.**
> Order: *"Không phải cái gì cũng bo tròn. Đích của tôi là chất lượng phim hoạt hình 3D, bám sát
> thực tế và lịch sử — không phải 'nhiều cạnh'."* Branch `claude/city-skill-points-display-7k4nof`;
> rounds 55 and 56 are NOT on `main` yet.
>
> ### Việc 0 — a vocabulary by HOW THE THING IS MADE (`14cdc8d`)
> `SIDES_ROUND` said one word for four different facts. Split into `SIDES_TURNED` (thrown/cast/
> moulded, 48) · `SIDES_DOME` (72) · `SIDES_PROP` (32) · `SIDES_STAVED` (built from planks, 14) ·
> `SIDES_HANDMADE` (10, + a deterministic `handmadeFactor` wobble that is a function of position,
> never `Math.random`) · `ROOF_FACETS` (4 — a tiled pitched roof has ridges, not a cone).
>
> ### Phần A — the resident, by photograph first
> Đàm's method for this part, verbatim: *"CHỤP TRƯỚC, SỬA SAU … đừng làm xong cả mạch mới chụp."*
> Building the acceptance shot found the FIRST defect in the instrument, not the city.
>
> 1. **`--pitch` (`9a3a18a`).** `DEFAULT_PITCH = 0.6 rad = 34.4°` looks DOWN at the tops of heads,
>    so every resident acceptance photo of rounds 52, 54 and 55 was taken from an angle that has
>    never once shown a face. The app itself reaches 10.3° by dragging; only the tool could not.
>    Routed through the app's own `orbit.set` so it cannot produce a frame the app cannot.
> 2. **A black frame is now refused (`fc6d410`).** `--width 2800` and `--width 4200` printed the
>    success line, wrote a PNG of the right size and exited 0 — and both images were BLACK
>    (brightest pixel 12.9/255 against 206 for a real noon frame and 224 for a real NIGHT one).
>    The composer buffer at that size exceeds SwiftShader's allocation, the scene is never drawn,
>    and the post pass still paints its vignette onto black. **Sixth time the measuring tool lied,
>    and the worst shape of it: an acceptance photo with the right name, size and tick mark.**
> 3. **A hairline that is a hairline (`305a58a`).** Measured first: round 52's hair cap is buried
>    36% INSIDE the skull, so what the eye sees is not the rim we drew but the intersection of two
>    coaxial lathes — and **that is always a horizontal circle**, measured at `y/headH = 0.6364` at
>    all 60 azimuths. New engine shape `scalp`: the skull's own generatrix lifted 7%, so it is
>    provably outside and its own rim is the boundary; the rim then follows the generatrix
>    parameter, quadratic in `cos θ`, through three anatomical marks —
>    **nape 0.171 · temple 0.347 · forehead 0.672** head-heights, plus a widow's peak using `c^24`
>    (`c^6` spreads the notch to ±40° and flattens the curve instead of cutting it).
>    `bun` and `braid` had been building a bun or a plait on a BALD skull; `hairPiece` returned one
>    block, so the hair itself was never there.
> 4. **A face (Việc 2).** Đàm's order: eyebrows, then eyes with whites and pupils, then a one-stroke
>    mouth. Eight roles now; `eyeWhite` costs **0 draw calls** because residents are one
>    `InstancedMesh` per SHAPE and the role is a per-instance colour — the round-52 comment saying
>    otherwise was about building materials, not people.
> 5. **⚠️ `steel` never reached the renderer — three weeks (`in this round`).** Round 49 split
>    `steel` out of `gear` and did every side of it: `HUMAN_ROLES`, `palette3d.js`, even an
>    exception list in `palette3d.test.js`. The one place nobody changed was the `roleColor` table
>    inside `sceneGraph.js`: six roles, and the line using it ended `?? roleColor.cloth`. **Every
>    helmet and every steel tool head has rendered in the era's CLOTH colour since.** The palette
>    test stayed green because it tests the TABLE, not the place that consumes it. Root fix: the
>    table moved into `human.js` next to `HUMAN_ROLES`, the `??` at the call site is gone (an
>    undeclared role now throws), and two guards cover it.
>
> ### Gates
> lint clean · **1782 pass · 0 fail · skipped 1** (1779 at the start of the round).
> New guards, each proven red for the right reason: hair outside the skull (red at `SCALP_LIFT`
> 1.00: 1191/2154 vertices inside) · hairline not horizontal (red with the curve flattened: 0.000
> spread) · every role has its own colour (red both by removing `steel` and by aliasing it to
> `cloth`) · draw calls +1 at exactly the four bare-headed eras.
>
> ### ⚠️ Found and NOT fixed — a gate asleep three weeks
> Re-measuring the three Chromium draw-call anchors (last taken 2026-08-24) showed the formula in
> `drawCallBudget.test.js` under-counts real city draw calls by **3 · 3 · 1** (eras 1 · 8 · 13), and
> that the `- 2` subtraction has been wrong since round 51 (the sky layer is a second group beside
> the backdrop, so a frame is minus FOUR). None of it is round 56's: round 56 adds exactly +1 and
> that +1 is in the table. The shortfall is content-dependent, so not a constant — suspects are the
> meshes born since (particles, forge glow, outskirts). Written out as a named, dated table so the
> assertion stays an exact equality, and filed as a debt rather than guessed at.

> Last update: **2026-09-11** — **ROUND 54: FROM BLOCKS TO ROUND (ADR-094).**
> Order: *"TỪ KHỐI SANG TRÒN … Pixar-style 3D animation — hình tròn mềm, tô sáng mượt, nhân vật dễ
> thương, ánh sáng dịu."* Acceptance, his words: *"tôi nhìn một cư dân ở tầm mắt — và người đó phải
> tròn, mềm, dễ thương như một nhân vật hoạt hình 3D, không phải một chồng hộp gỗ."*
> Everything on `main`, on top of round 53. Same four laws: ADR-007 · determinism · 105 era pairs ×
> 4 seasons · a photograph for everything.
>
> ### Measured before
> Every curved block in the city rendered as flat plates: `geometryFactory.js` and `humanShape.js`
> both wrote one normal per FACE, so a 12-sided body showed 12 plates · residents 12-sided, 18 parts,
> 1.808 triangles, 7,5 heads tall, no neck, no eyes, no joints · loose cloth a perfect surface of
> revolution · a shadow cut 100% of the sun.
>
> ### Done
> 1. **⭐ Crease-angle smooth normals** (`engine/city3d/creaseNormals.js`, 40°). Adds **zero
>    triangles** and changes every curved object in all 15 eras. The angle needs no role table: a
>    4-gon's faces are 90° apart (sharp), a 12-gon's 30° (smooth), a side meets a cap at 90° (sharp).
>    So round 53's window recesses, pilasters and mouldings keep every edge that makes their shadows.
> 2. **⚠️ It lives in `engine/`, not `render3d/`, and the first draft got that wrong.** Residents do
>    NOT go through `geometryFactory` — they go `humanShape.js` → `humanGeometry.js` → `InstancedMesh`.
>    The first version rounded the whole city and left the people as twenty flat plates, which is
>    exactly what the round is judged on.
> 3. **Residents became cartoon characters**: 20 sides, head 0,16 → 0,22 (**4,55 heads**, a deliberate
>    reversal of ADR-090 on Đàm's explicit order), a real neck, six ball joints, two oversized eyes on
>    the existing `hair` role so the face costs **0 draw calls**. 18 → 27 parts, 1.808 → 5.124 tri.
> 4. **Cloth reads as cloth**: four folds and a scalloped hem on `flare`, the hip wrap moved
>    `prism` → `flare`. Envelope unchanged **to the digit** — see the lesson below.
> 5. **`MAX_SIDES` 16 → 24 · `BEVEL_MAX` 0,06 → 0,14 · `footBevel` for cones and pyramids** (foot
>    chamfered, tip still sharp — decision 7 of ADR-094).
> 6. **Shadows never black**: `sun.shadow.intensity = 0.82`. Floor up, crushed down, **contrast holds
>    to three digits** in all three measured eras. Rim light 0,22 → 0,30. Five glossiest material
>    families one step rougher; `water` deliberately untouched at 0,04.
> 7. **Tree canopies stop being polyhedra**: lobes keep the outline, `lobeSides` (min 10) crosses the
>    40° threshold so the surface goes round.
>
> ### Not done, and why
> - **Distance-softening shadows (Việc 8b)** — NOT built. A penumbra that widens with distance from
>   the occluder is PCSS, a rewrite of three.js's shadow sampling; the cheap substitute (VSM +
>   `shadow.radius`) blurs uniformly and light-bleeds through exactly the thin window reveals round 53
>   built. Việc 12 forbids that trade. Logged rather than faked.
> - **Việc 13 (free choice)** — spent on decisions 2 and 5 of ADR-094 (the layering fix and the joint
>   colour fix), both found by photographs rather than by the brief.
>
> ### Two bugs found by a PHOTOGRAPH, not by a test
> - Six ball joints hard-coded to `skin` rendered as **six bright rivets** on era 12's dark uniform —
>   the round-52 "two white sticks" defect returning one level down. A joint now wears the colour of
>   the limb it joins, the rule the foot already used.
> - The neck at 0,46 of head width read as a pale **collar ring** from the 34° camera. Now 0,38, lower.
>
> ### Gates
> lint clean · build clean · **1 778 pass · 0 fail · skipped 1** (round 53 baseline: 1 775).
> New: `GOLDEN_KHOI` in `block.test.js`, `MOC_TRUOC_VAI_XOE` in `drawCallBudget.test.js`, a
> smoothing-actually-runs test in `humanShape.test.js`. Per-era triangle marks re-based twice with the
> scope recorded (era 14 alone unmoved by `footBevel`; all 15 moved by the trees). Part/triangle
> ceilings for residents and trees converted to runaway detectors that print the real number each run.

---

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

## 📚 Rotated 2026-09-17 → [`docs/archive/BAN_GIAO_2026-09-17.md`](docs/archive/BAN_GIAO_2026-09-17.md)

8 entries moved verbatim (ADR-076); nothing deleted. Find one: `grep -n '<title>' docs/archive/BAN_GIAO_2026-09-17.md`.

<details><summary>Titles</summary>

- Last update: **2026-09-09** — **ROUND 49: SOMETHING TO BLOW, AND A FIRE LIT (ADR-089).**
- Last update: **2026-09-09** — **ROUND 48: THE CITY BECOMES A PLACE (ADR-088).**
- Last update: **2026-09-08** — **ROUND 45: A BONUS THAT CANNOT BE SEEN IS NOT A BONUS (ADR-085).**
- Last update: **2026-09-08** — **ROUND 40: THINGS THAT HAPPEN AND VANISH (ADR-080).**
- Last update: **2026-09-07** — **ROUND 39: WHILE A TIMER RUNS, THE FOCUS SCREEN IS THE TIMER (ADR-079).**
- Last update: **2026-09-07** — **ROUND 38: THE CITY LIVES ON THE FOCUS SCREEN (ADR-078).**
- Last update: **2026-09-07** — **THE GATES HEAL THEMSELVES; BUILD, DON'T AUDIT (ADR-076 addendum).**
- Last update: **2026-09-06 (night, fifth pass)** — **GOVERNANCE NOW RUNS ON DISCOVERY (ADR-076).**

</details>

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
