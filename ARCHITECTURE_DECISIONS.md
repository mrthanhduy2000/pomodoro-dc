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

## ADR-102 — v2 stages 2–4: the city is DERIVED from the log, game choices are events, one renderer, one daily push

**Date**: 2026-10-03 · **Order**: *"Tự động hoá toàn bộ, SQL hay gì đó thì bạn cứ tự làm / Hãy tiếp tục toàn bộ / Cải thiện nhiều hơn và lớn hơn nữa"* — Đàm explicitly overrides the waiting gates of ADR-101 (Gate 1 "3 real days", Gate 2 "one week of 2D first"). ⚠️ Recorded so a later session does not mistake the skipped gates for an oversight: the gates were skipped **by order**, and the data they were meant to produce (does v2 make Đàm come back more than v1?) **does not exist yet**.

**Context.** Stage 1 (ADR-101) shipped the daily core. The plan's diagnosis of v1 was that its city read counters and never `history[]`, so two people with the same session count had identical cities, and nothing in the city answered "what did I do on Tuesday". The one rule of v2: *every session becomes ONE visible object — dated, in a fixed place, never lost.*

**Problem.** Where does the city live? v1 stored the city in `game_state` and had to migrate, reset and reconcile it (an entire history of ADR-007…ADR-087). A stored city can drift from the sessions that produced it.

**Options considered.**
1. **Store the city as its own state** (v1's way). Fast to read, but two sources of truth and a migration every time a rule changes.
2. **Derive the whole city from the event log, store only the CHOICES as events (chosen).** One source of truth; a rule change re-derives every city consistently; two devices always agree.
3. **Ship the 2D map first as the plan said, 3D later.** Cheaper to test stickiness, but Đàm's order was "continue everything, bigger".

**Decision 1 — `buildCity(events, timerState, now)` (`v2/src/engine/city.js`) derives everything.** Bricks, buildings, residents, lanterns, statues, festivals, era. Nothing about the city is persisted except Đàm's two kinds of choice: `build.plan {planId, blueprint, plot}` (id `build.plan:<planId>`) and `build.cancel {planId}`. Unknown kinds stay ignored by the timer.

**Decision 2 — bricks fill planned buildings first-in-first-out; with nothing planned they wait in the yard.** Never auto-choose a building for Đàm — choosing is the agency the plan asked for — but never lose a brick either: the yard empties into the next plan. At most `MAX_OPEN_PLANS` = 2 open plans (one building, one queued), so the city stays a sequence of decisions, not a backlog. A plan can be cancelled **only while it has no brick** — a placed brick never moves (the one rule).

**Decision 3 — plots: 4-neighbour adjacency to the built area, and a collision resolves deterministically.** Two devices may plan the same plot offline; the later plan by `(at, id)` moves to the nearest free candidate. Both devices compute the same move, so no conflict ever reaches Đàm.

**Decision 4 — an era is a chapter of `ERA_BRICKS` = 70 bricks (~2–3 weeks at 4/day) and never resets.** Buildings keep the style of the era they were planned in (tree rings); later eras may still plan older styles. 10 eras with one silhouette-level difference each (roof: cone → flat → curved → crenel → gable → dome → chimney → mansard → antenna → garden), because silhouette reads at overview distance and surface detail does not (the v1 lesson: 52 of 60 commits went into detail nobody could see).

**Decision 5 — surprises are hashed, not rolled.** FNV-1a of `brick:<sid>`: < 0.01 statue, < 0.09 gold (≈ 8 %). Same session → same surprise on every device, every reload; no runtime randomness anywhere in the city.

**Decision 6 — coming back costs nothing and pays double.** ≥ 2 empty VN days before today → the first session today lays TWO bricks (`#0` + `#1`). Residents = active days (home = the building that day's first brick went into); lanterns = days that reached the goal **as it was set that day** (goal timeline from `prefs.set`, so raising the goal never darkens old lanterns); a festival = a Monday-based week with ≥ 5 × goal sessions.

**Decision 7 — one small renderer, budget first** (`v2/src/city/`). `layout.js` and `sky.js` are pure and tested; `CityScene.js` is the only three.js file: InstancedMesh for storeys, windows, lots, streets, lanterns, residents, trees and the yard; one mesh per roof; real Hanoi time drives sun/moon/sky; raycast picking (brick · building · resident · statue · plot); camera fly-to; the new storey drops in after a session; 40 fps cap. **Measured** on the MacBook (dev, 127 bricks / 13 buildings): frame 2.2 ms, render 3 ms. ⚠️ **iPhone NOT measured yet.** The renderer is a lazy chunk (`LazyCityCanvas.jsx`): main bundle **1,014 → 444 kB** (gzip 274 → 130), so the timer opens without waiting for three.js.

**Decision 8 — the return push is pure and folded into the existing cron.** `pickV2Nudge(events, now)` (`api/_lib/v2Digest.js`) reuses the v2 engine itself, so the server and the app cannot disagree about which building is unfinished. Priority, first match wins, max one a day: welcome-back → unfinished (≤ 3 left, nothing today) → one or two sessions from a full day → a streak breaking tonight → silence. Never nags someone who reached the goal or never used v2. Runs inside `coach-digest` (`Promise.allSettled` with v1's digest): **still 10/12 functions**. Reads `events_v2` with the service role and returns silently while the table does not exist.

**Decision 9 — a routing bug fixed on the way.** v1's streak nudge was sent to **every** subscription, including v2-only devices. `sendToApp(payload, app)` now filters by `pushAppOfSubscription`, so v1 nudges reach v1 subscriptions only and v2 nudges v2 only.

**Decision 10 — the SQL step stays manual, and the app makes it two clicks.** Creating `events_v2` needs Đàm's Supabase login; there is no service key or CLI on this machine, and writing probe rows into the shared production database was refused by the safety layer — correctly. Settings now shows, only while the table is missing: *copy the SQL* · *open the Supabase SQL editor* · *check again*. The outbox keeps every local event and uploads it once the table exists.

**Trade-offs.** The city is recomputed once a minute and on every new event (`useMemo` on `events`, `cityNow`) — linear in bricks, trivial now, worth memoising per day if the log reaches tens of thousands. Skipping the 2D stage means Gate 2 now measures the 3D game, so a failure can no longer tell "the loop is weak" from "the 3D is weak".

**Consequences.** 13 city tests + 5 layout tests + 5 digest tests, each rule break-tested red (welcome gap, era gate, empty-only cancel, yard FIFO). Stage 5 (cutover, Electron tray, AI Coach copy) is **not** started: it requires sync to be on, otherwise Đàm's iPhone and MacBook would hold two different cities.

**Revisit when.** iPhone frame time > 16 ms (cut shadows first, then windows); or two weeks of real v2 use show fewer active days per week than v1's baseline.

---

## ADR-101 — v2 rewrite, stage 1: the whole state is an append-only event log, served at `/v2/` beside v1

**Date**: 2026-10-03 · **Order**: *"Rà soát và lên plan tối ưu hoá toàn bộ… thành phố vô hồn"* → *"Làm lại toàn bộ, không chừa cái gì cả, mọi rule giờ có thể làm mới"* · *"Viết lại cả code"* · *"Bắt đầu lại từ số 0"* · *"Không đóng băng"* (3D).

**Context.** v1 is ~80k lines, a dozen currencies, and a 3D city that reads counters, never `history[]`. Real usage after the 6/9 progress reset: 3 active days (6–8 Sep, 11 sessions), two cancelled sessions on 17–18 Sep, then nothing. The approved plan (`v2/DESIGN.md`) rewrites the game around one rule — *one session = one dated brick that never moves or disappears* — and gates every stage on real use. Stage 1 is only the daily core: timer, session log, sync, push, PWA, import of v1 history.

**Problem.** The plan said "copy v1's CAS sync". CAS over one JSON row means a losing device must throw away its write and re-pull, and v1 has lost a real session to that race (2026-07-11) and still loses offline edits to different fields (`TECH_DEBT #8`). A timer is a stream of facts (start, pause, resume, complete), which is the one shape that can be merged without anybody losing.

**Options considered.**
1. **CAS on a `game_state_v2` row (the plan).** Proven code, but keeps the loser-discards-work property and needs four safety nets around it (`docs/OPERATIONS.md`).
2. **Append-only event log, state = pure reduction (chosen).** Every device appends facts; sync is set union by id; no write can be rejected, so nothing is ever discarded.
3. **Separate Vercel project / repo for v2.** Clean, but a second deploy pipeline, a second push key pair, a second domain for Đàm's iPhone to trust.

**Decision 1 — one table `events_v2` (`supabase/v2_events.sql`): id · seq · at · kind · data · device.** The anon role may **SELECT and INSERT only** — no UPDATE, no DELETE — so a client bug cannot destroy history. `seq` (bigserial) is the pull cursor; the table is in the realtime publication. Upload is `INSERT … ON CONFLICT DO NOTHING`, so a retry is always safe.

**Decision 2 — the reducer is pure and order-independent** (`v2/src/engine/timer.js`). Events are sorted by `(at, id)` before reduction, so two devices that received the same set in different orders compute the same state (tested with a seeded shuffle, 50 runs). Unknown kinds and malformed events are ignored, never thrown.

**Decision 3 — facts more than one device may emit carry a DETERMINISTIC id** (`focus.complete:<sid>`, `focus.cancel:<sid>`, `break.end:<sid>`, `break.skip:<sid>`). Laptop and phone both noticing the timer ran out write the same row once. A completion is stamped at the **theoretical** end (start + target + pauses), not at the moment a device woke up — so an iOS tab frozen for an hour still logs the session at the right minute. `settle(now)` emits these due facts before any command.

**Decision 4 — no penalties and no hidden state.** Cancel has no cost field. An early finish counts only after `MIN_COUNTED_MS` = 10 min. A second start supersedes a running session. Prefs and categories are last-write-wins by `at`. Even "skip the break" is an event, so the "just finished" panel survives a reload and closes on every device at once (`justFinished`).

**Decision 5 — same repo, same deploy, served at `/v2/`.** `v2/vite.config.js` builds into `dist/v2` with its own PWA (scope `/v2/`, `importScripts('/push-worker.js')`); v1's service worker denylists `/v2`. `vercel.json` gets one rewrite. No new serverless function (still 10/12).

**Decision 6 — push is routed, not duplicated.** A v2 subscription's `platform` starts with `v2:`; v2 jobs carry `payload.app = 'v2'`; `dispatch.js` filters with `subscriptionMatchesJob`. No schema change, so v1 delivery is untouched. Schedule and cancel are sent from **every** device, not only the one with push enabled — otherwise a pause on the laptop could not cancel the phone's job.

**Decision 7 — a dev host never touches the cloud log** unless the URL has `?sync=1` (CLAUDE.md: never start a focus session on dev/localhost against real data). Status `dev-local` is shown in Settings.

**Decision 8 — v1 history is imported read-only, as `legacy.session` events** with ids `legacy:<id>`, so importing twice is a no-op. v2 has **no code path** that writes `game_state` or `timer_live`.

**Trade-offs.** The log only grows (fine: a year of heavy use is a few thousand small rows). The state is recomputed on every tick (fine at this size; memoise if it ever shows in a profile). The Electron tray still reads v1's `timer_live` until stage 5.

**Consequences.** Two pre-existing local-build faults surfaced and were fixed on the way: six v1 imports that collided case-insensitively on macOS (`Foo.jsx` vs `foo.js`) now name the `.jsx` explicitly, and five tests that built paths with `new URL(...).pathname` (which keeps `%20` and percent-encoded diacritics) now use `fileURLToPath`. Neither failed on Vercel (Linux), both failed on Đàm's machine.

**Revisit when.** Gate 1 fails for a sync reason, or the log passes ~50k rows on one device.

---

## ADR-100 — Round 64: five faults Đàm could see, and a rail that was carrying a whole week on a screen for starting one session

**Date**: 2026-09-17 · **Order**: *"Lệnh vòng 63 ghi rõ: 'Không thêm thứ đứng yên trên màn hình để quảng cáo phím tắt.' Hover tooltip anh làm là đúng — nhưng cái ô này thì không."*

**Context — the round opens with the previous round breaking its own rule, found in a screenshot.** Round 63 quoted round 40's law back at itself and then shipped a permanent line of text reading *"SPACE BẮT ĐẦU · SHIFT TRÁI + F FULL SCREEN · SHIFT TRÁI + G THU/MỞ CỘT · 1–5 ĐỔI TAB"* in the middle column. Four things learned once, occupying the screen every second of every session. That is the third round running in which the camera caught what the reasoning missed.

**Decision 1 — hold `?`, the keys appear; release, they are gone (`focus/ShortcutSheet.jsx`).** The affordance now has the same shape as the thing it describes: a shortcut is reached for with the keyboard, so the question is asked with the keyboard. ⚠️ The list moved to `lib/shortcuts.js` — one source, because a second copy is how a key gets renamed in one place and not the other. ⚠️ `?` needs no modifier, belongs to no browser, and stands down inside a text field.

**Decision 2 — one truth is said once, enforced by VALUE rather than by branch.** `describeStageCountdown` has two readers — the postcard caption and `pickFocusMoment` — so *"Còn ~5 phiên nữa tới «Nhân Tiền Sử»"* printed twice, about 60 px apart. `pickFocusMoment` now takes `alreadyShown` and skips any candidate whose **rendered text** matches it, then falls through to the next. ⚠️ Gating only the `stage` branch would have fixed this instance and left the next one; this is round 62's `38/75 còn 37` in a different costume, and Đàm was right that it is a recurring class.

**Decision 3 — the category chip stops painting itself with the category's own hue.** `DEFAULT_SESSION_CATEGORIES` carries six raw hexes, including `#ec4899`, and they predate round 39's three-colour law — they live in `constants.js`, not in any component anyone was counting, so the law never reached them. ⚠️ The hue keeps its job on **Thống kê**, where six categories are compared and the colour IS the distinction. On the Focus screen only one bit matters (chosen / not chosen) and the app already has one way to say it.

**Decision 4 — one heading where there were two, and they did not agree.** A pill «TUỲ CHỌN» sat beside a second uppercase «MỤC TIÊU PHIÊN»: two shouts, two treatments, wrapping into two rows. ⚠️ **The first draft deleted the pill and a test went red for exactly the right reason** — that pill was the only place the screen said the goal is optional, so deleting it deleted a fact. Merged instead: `MỤC TIÊU PHIÊN · Tuỳ chọn`, one label, both facts. A test that fails a *correct-looking* edit is the cheapest kind of proof that the rule "re-column, never trim" is load-bearing.

**Decision 5 — the note box stops being a text editor bolted to a clock.** Counted on a finished session: 8 format buttons · 1 highlight · 5 colour swatches · a "Cách dùng" button · 5 tag chips · a word counter, for a field whose job is *"ghi hai dòng"*. **B** and the checklist stay out; the other six plus the colours fold behind one «⋯». ⚠️ Every keyboard shortcut keeps working whether its button is visible or not, so the power user loses nothing at all.

**Decision 6 — THE BIG ONE: the rail carries the day, not the whole week. 1.627 → 1.033 px (−37%).** The rail is the tallest region in the app, and the breakdown named the culprit exactly: AI Coach 145 · daily card 458 · **weekly card 646**. Four steps with four progress bars and a bonus header is the right thing on a screen you opened to plan a week, and 646 px of a 340 px rail on a screen you opened to press Start. `section="daily"` swaps it for the one-line week summary round 62 already built and tested. ⚠️ **Nothing is lost**: the full weekly card still stands in Hành trang › Kỹ năng and on Tiến trình. The phone Focus screen has made this exact swap since round 62; the rail had simply never been told.

**Decision 7 — Thống kê and Cài đặt flow into two columns at `xl`.** Thống kê **1.289 → 771 px**, which is under the 790 px fold: **it no longer scrolls at all.** Cài đặt **1.427 → 1.058 px** (−26%) once the folded rows stopped being stretched to the height of the one open section.

**Decision 8 — while a timer runs there is ONE column, and it is wide.** Đàm on the round-63 photograph: *"một cột 700px trôi giữa màn 1440px trông như app chưa biết mình đang chạy trên máy nào."* The postcard goes 730 → **1.100 px** and the clock card 640 → 820, so **91 % of the content width is used** (was 67 %). ⚠️ Zero new indicators, numbers or colours — the same elements, drawn larger; the veto table is untouched. ⚠️ **And the two-column grid is now gated OFF while running**: the first build left round 63's split on, and the shot showed the clock shoved off-centre with a lone «GHI CHÚ PHIÊN» stranded beside it. The camera again.

**A correction to round 63's own table, which Đàm was working from.** Round 63 reported *"thẻ kết phiên 1.666 px — 2,11 màn"*. That number was the **right rail measured behind the overlay**, not the ending card. Measured directly this round (`[role=dialog]` and its own scrollers): the dialog is 1.440 × 790 and **nothing inside it overflows** — the ending card already fits. ⚠️ This is measuring lesson #30 recorded and then repeated in the very table that recorded it: *a number with no address is not a measurement*, and one of mine had no address. The ending still gained `xl:max-w-[900px]` — at 460 px on a 1.440 px screen its credit chips wrapped into a phone-width ribbon — but as a look-right fix, not a scroll fix.

**Decision 9 — and round 63's two-column idle grid is REVERTED, with the arithmetic that should have been done then.** The centre column is **868 px** (1.440 − 232 sidebar − 340 rail). A `640 px clock | rest` split leaves the right cell **196 px**, and this round's photograph showed what that means: the session-goal card one word wide, its label broken across three lines, its button wrapped to four. ⚠️ Round 63 reported that layout as a **−24 % height win** and it was — 1.554 → 1.184 px — while the screen's primary input became unusable. **A number that improves while the screen gets worse is a number measuring the wrong thing.** The height win never came from the columns anyway: it came from dropping `xl:min-h-[88vh]`, which stays, so the Focus column sits at **1.530 px** with the goal card intact. ⚠️ `viewports.test.js` had a case demanding those two grids exist — a test pinning an implementation rather than a rule. It went red for doing the right thing and was rewritten to assert only what this file owns: a re-column must never reach the phone.

**Consequences.** Regions needing a scroll at 1.440 × 790: **6/8 → 5/8** (round 63 said 7/8; one of those eight was the ending card, which the correction above shows was never scrolling). The two worst both moved — **rail −37 %**, **Cài đặt −26 %** — and **Thống kê reached zero**. Uppercase labels on one Focus screen: **17 → 14**. Still measured and unfixed: Hành trang 1.566 px, Thành Phố 1.060 px, and the Focus column's own 1.530 px.

**Alternatives considered.** Deleting the rail's weekly card outright (rejected: it is the only place four steps are readable — folding to a summary keeps both). Widening the rail to fit the week (rejected with numbers in round 63: +85 px of rail costs 568 px of the column beside it). Filling the running screen's margins with content (rejected: round 39 bought that emptiness with a measured argument, and the veto table forbids raising the centre's counts — the fix was to make the one thing worth looking at bigger).

---

## ADR-099 — Round 63: the reference frame was wrong for fourteen rounds, and the scarce axis flips with it

**Date**: 2026-09-17 · **Order**: *"Tôi dùng app này 98% thời gian trên MacBook Air M3, 2% trên iPhone… Mọi prompt từ vòng 38 tới 62 đều ghi '390px — khung tôi dùng nhiều nhất'. Sai."*

**Context — a fact, not a preference, and it invalidated fourteen rounds of layout reasoning.** Every brief since round 38 named 390px as the frame Đàm used most, and every layout decision was made against it. It is 2% of his use. The correction matters far beyond "make things bigger", because **the scarce axis flips with the frame**: a phone is short of WIDTH, a laptop is short of HEIGHT. Fourteen rounds of habits — stack it vertically, cap the column, let it scroll — are all optimisations for the axis that is plentiful on the frame that counts.

Measured on the reference frame for the first time (1.440 × 790, the real Chrome window on a MacBook Air M3 13,6"):

| region, Focus screen idle | visible | real | screens |
|---|---|---|---|
| main content column | 719 px | **1.554 px** | **2,16** |
| right rail | 661 px | **1.627 px** | **2,46** |

and every other screen scrolled too: Hành trang 1.584 · Cài đặt 1.427 · Thống kê 1.289 · Thành Phố 1.060 · the ending card **1.666**, which he meets several times a day.

**Decision 1 — `lib/viewports.js` records the frame as a project constant.** `LAPTOP` (css 1470×956, chrome 1440×790) · `PHONE` · `LAPTOP_FOLD` · `TWO_COLUMN_MIN`. ⚠️ The fold is the **browser** height, not the display height: the number that decides layout is the one he actually looks at. `viewports.test.js` pins that the laptop leads, that the fold is the window, and that the two axes invert between the frames — the inversion is the whole reason the file exists.

**Decision 2 — on a laptop the Focus screen becomes a ROW: 1.554 → 1.184 px, −24%.** `min-h-[88vh]`, added in round 42 to centre the clock on "a big empty desktop screen", reserved **695 px of a 790 px window for the clock alone** and pushed the session goal, the notes, the categories and the timer setup below the fold. At `xl` the clock and the setup stack now sit side by side. ⚠️ **Below `xl` nothing changed at all** — the phone measured 2.424 px before and 2.444 px after (+0,8%), which is noise, not a cost.

**Decision 3 — Space covers the whole session, and 1–5 switch tabs.** The Space shortcut has existed since round 37 but was gated on `IDLE`: it started a session and then went dead for 25 minutes, so pausing meant leaving the keyboard his hands were already on. It now means start · pause · resume, one meaning per state, and never cancel (cancelling is destructive and keeps its dialog). Number keys 1–5 follow the sidebar's own order, so the number IS the position on screen. ⚠️ Both refuse when a modifier is held (⌘1 belongs to the browser), when a text field has focus, and — for the numbers — while the ending chain is playing, which is a story with its own tap handling.

**Decision 4 — hover carries the shortcut, so nothing static advertises it.** Round 40 forbids parking anything permanent on screen to announce a feature. A laptop already has the answer: the cursor is a question, a `title` tooltip is the reply, and both vanish when he stops asking. The one muted hint line on the Focus screen now also follows the timer's state instead of only appearing while idle — which was precisely when Space was least worth knowing about.

**What was tried and REVERTED, because the measurement said so.** The rail is the tallest region in the app (1.627 px in 661 px). Every mission label wraps at 340 px, so widening it to 400 px should shorten it — and it did, by 85 px. **But it cost 568 px of the column beside it**: the centre fell 868 → 808 px, which squeezed this round's own two-column grid until the right cell wrapped, taking the main column 1.184 → 1.752 px. Net 483 px worse. ⚠️ The lesson is the shape, not the number: on a laptop the sidebar (232) + centre + rail share one width, and any of the three grows only by taking from another.

**The measuring-tool lesson, the 30th (project law #1).** `shot.mjs` prints the tallest scrolling element, and for four builds in a row that element was the **right rail**, not the content. I read "1.627 unchanged" three times and nearly reverted a change that was in fact cutting 370 px off the column next to it. The fix was to stop reading one number and enumerate every scroller with its width and x-position. **A number with no denominator is not a measurement — and neither is one with no address.**

**Audited, and deliberately NOT changed (Việc 5).** The phone-pattern hunt came back mostly clean, and three of the five items in the brief were already fixed: the sidebar **has labels** (round 42's complaint, closed), there is **no bottom tab bar** on desktop, and there are **zero** hardcoded 44px touch targets. What remains true is the width split above.

**Consequences and what is left.** The rail's 2,46 screens is measured and unfixed; so are Hành trang (1.584), Cài đặt (1.427) and the ending card (1.666). This round moved the screen he opens most and left the rest with numbers rather than guesses — which is the honest half of "measure first".

**Alternatives considered.** Putting content back into the empty margins while a timer runs (rejected: round 39 bought that emptiness with a measured argument, and the veto table still forbids raising the centre's counts — the void is now a smaller share of a re-columned screen instead). Removing the right rail on laptops to give the centre 1.208 px (rejected: it is where the missions live, and deleting a column to fix a height is trading a real loss for a measurement).

---

## ADR-098 — Round 62: one visual vocabulary for eight screens, and an ending that stops saying the same thing three times

**Date**: 2026-09-17 · **Order**: *"Vòng này THUẦN UX/UI… mở bất kỳ màn nào trong app, nó trông như cùng một người làm ra."* · *"Một luật tốt đang chỉ canh một màn."*

**Context — round 39's four numbers were right, and they only ever guarded one screen in eight.** Focus has been held to *1 chỉ báo · ≤2 số · ≤3 màu · 0 chữ cắt* for seven rounds. Nothing guarded the other seven screens, and rounds 43–45 kept adding text to exactly those. Counting one visual element at a time across everything the app ships:

| one element | how many ways the app drew it |
|---|---|
| the small uppercase section label ("eyebrow") | **22 size+tracking combinations over 111 uses** |
| the card surface | **7 local definitions**, one of which had drifted |
| a number with a denominator | **4 shapes on the Thành Phố screen alone** |
| `Cài đặt`, flat and fully expanded | **4.919 px ≈ 5,8 phone screens, 11 sections** |
| the ending, luckiest session | **11 cards · 39,0 s** |

None of these was a bug and none was lazy: each screen was built in a different round, each decision was reasonable on the day, and nothing ever compared two of them side by side. That is how an app comes to look *"vá bởi mười ba người"* while every individual commit looks careful.

**Decision 1 — `components/shared/surface.js` is the one visual vocabulary.** `CARD` · `CARD_INSET` · `EYEBROW` · `ratio()` · `remaining()`. Seven card definitions became one import; 109 eyebrow instances collapsed from 22 shapes to **two** — a section label (10px/0.2em) and a badge pill (11px/0.14em), which are genuinely two elements rather than two sizes of one.

⚠️ **The card drift was real, not cosmetic.** `BuildScreen` · `RankDisplay` · `SkillTree` carried three byte-identical copies; `StatsDashboard` carried a fourth that hardcoded `1px` where the others read `var(--skin-card-border-width, 1px)`. Under any skin that sets that variable, Thống kê had a different border width from the entire rest of the app — invisible for ten rounds, because finding it required reading two files at once and nobody ever did. Three more copies (`FocusRail`, `TodayHero`, `PomodoroEngine`) were found by the guard, not by the grep that started the round.

⚠️ **One eyebrow size, not two.** The 22 variants did not come from a design intent with tiers; they came from nobody having a name to reuse. A second size is a second place to drift, and the round after that makes it three.

**Decision 2 — a number with a denominator is `n/N`, and a remainder never sits beside it.** The header printed `0 / 7` while eight era chips below printed `4/5`: one relation, two punctuations, one screen, one moment. And `38/75 còn 37` is `75 − 38` said twice, costing a second number and a second colour to add nothing. ⚠️ The `còn 1 nữa ★` hint SURVIVES, because it is not a remainder — it names a milestone one step away whose reward seals permanently (ADR-007). A remainder earns its place when it answers *when*; never when it restates the fraction it came from.

**Decision 3 — the ending merges what repeats: 11 cards → 8, 39,0 s → 29,6 s (normal 5 → 4, 19,4 s → 16,8 s).** Two merges, both found by asking Đàm's question — *what does this card say that no other card says?*
- **«Nhịp»** — `streak` and `today` were consecutive cards with the SAME SHAPE (a 56px number, a caption, a full-width strip) answering the SAME question in different units. One card now: streak is the headline (it is the thing that can break), the week strip is the middle, today's bar is underneath at 24px.
- **«Kho báu»** — `rank` · `relic` · `evolve` were three renderings of one layout saying *"bạn vừa có một buff vĩnh viễn"*, firing back to back for 10,2 seconds at the loudest moment of the ending. Loud is not the same as long.

⚠️ **THE COMMON CASE KEEPS THE OLD LAYOUT EXACTLY.** One treasure is by far the usual outcome; a one-row list would have made the frequent case worse to improve the rare one. The renderer stacks only when two or more actually land.
⚠️ **Zero taps added, nothing deleted, the burst kept its tier.** `treasure` is still a rare-tier card with the full-screen burst and the longer hold. `isMax`/`nextAt` survive as a per-row note — that sentence is the one thing that turns a relic from a trophy into something still ahead of him, and merging three cards is allowed to cost a card, never a fact.

**Decision 4 — `Cài đặt` folds: eleven sections, ten of them collapsed.** Round 38's question decides it — *"cái nào tôi đã bật/tắt đúng một lần rồi không bao giờ đụng nữa?"* The sound pack, the theme, the notification permission, the export, New Game+, the About text: all of them. What he changes is the timer lengths and the daily goal, and those sat on top of a five-screen wall of decisions he made years ago. ⚠️ **Folded, not deleted** — every control is one tap away, same order, same words. The header moved inside `Card`, which both makes the whole row a reliable tap target and deleted eleven repeated `<SectionHeader>` call sites.

**Decision 5 — the three Hành trang sub-tabs say what is behind them.** Round 45 kept all three (three verbs); Đàm's follow-up was the sharper half: *"đừng bắt tôi bấm thử."* Three bare words are three identical doors, so each now carries the same `n/N` the screen behind it already prints as its first line — `Kỹ năng 4/36` · `Công trình 38/75` · `Di vật 12/15`. No new unit, no second source of truth, just moved in front of the tap. `TOTAL_SKILLS` and `TOTAL_RELICS` joined `TOTAL_BUILDINGS` in `engine/journey.js` rather than becoming a third private derivation.

**Decision 6 — two missions stated their goal in an hour and counted it in minutes.** `Chinh phục 2 giờ tập trung  0/120` and `Vượt 2.5 giờ tập trung trong ngày  0/150` — the other ten `focusMinutes` missions say minutes and match their counter. Labels now say `120 phút` / `150 phút`. No goal, no XP, no weight changed; only the unit in the sentence.

**Consequences.**
- `shared/surface.test.js` is the gate: it fails a new eyebrow variant, a new card definition, a spaced slash, or `ratio()` losing its clamps. It caught three card copies the opening grep had missed — which is the argument for the test rather than the convention. **A threshold with no guard is a funnel**, the doc-budget lesson applied to pixels.
- The eyebrow rule is scoped to 10–12px on purpose: below that the app uses uppercase letters as an ICON FALLBACK sized to fill an icon slot, not as a label.
- Six card types shrank to four in the ending, so `previewStage` scenes and four tests moved with them; `rewardBurst.test.js` now asserts the tier on `treasure`, and the behavioural hold assertion lives in `sessionRewardStory.test.js` where it can check the real function instead of grepping for a literal.

**Audited and deliberately NOT changed.** **Thống kê** (Việc 4): the three round-36 answers still hold, nothing on the screen references the deleted badge system, and the hour/percentage/sample formatting is already consistent through `formatMinutesVi` — no change earned its place. **Units** (Việc 2): `phiên` · `phút` · `giờ` · `ngày` came back clean; every place that turns minutes into hours goes through one formatter, and the only two offenders were the mission labels fixed above. **`ActionButton`**: 77 raw `<button>` tags remain, but nearly all are tab chips, grid cells and card tap targets rather than buttons — forcing them through `ActionButton` would make them look like buttons, which is the opposite of the goal. The #86 lint gate already forbids the drift that matters (palette colours and hex literals inside a `<button>`).

**Alternatives considered.** Keeping a "small" and a "large" eyebrow (rejected: two names is how 22 started). Deleting the rarely-used Cài đặt sections outright (rejected: a setting changed once a year is not worthless, it just should not cost a scroll). Merging `quests` and `chain` in the ending too (rejected: one is today and one is this week, and unlike streak/today they do not share a shape — that would have been merging by category rather than by duplication).
## ADR-097 — Round 61: a joint is the narrowest point of a limb, not the widest, and a hollow only ever comes from carving the generating line

**Date**: 2026-09-17 · **Order**: *"Cận cảnh cư dân vẫn là một con ma-nơ-canh mắt lồi với những khối
lòi lõm lạ… Cơ thể người đọc ra là người phần lớn nhờ những chỗ LÕM và những chỗ THẮT: hốc mắt, thái
dương, hõm cổ, eo, cổ tay, khuỷu, gối, cổ chân. Thêm khối LỒI không tạo ra chỗ LÕM."* · Branch
`claude/city-skill-points-display-7k4nof`.

### Context
Three straight rounds — round 58's eight skull blocks, round 59's four eyelid blocks, round 58's
six joint spheres — had each solved a different photograph by ADDING a convex block. ADR-095 had
already named the first failure mode (*"a sum of convex bodies is not a smooth surface"*) but the
joint spheres and the eyeballs survived that diagnosis because they measured correct: the sphere
sealed the gap at every bend angle, the eyeball sat where the brow ridge and cheek profile left
room for it. Đàm's round-61 diagnosis reframes the whole class of bug: it is not that the added
blocks were the wrong SHAPE, it is that addition itself cannot produce the feature these body parts
need — a hollow, or a pinch — because a hollow is an absence, and nothing is subtracted by gluing
something on.

### Decision — two applications of one rule
**(1) A joint is the segment's narrowest point, sealed by overlap, not by a padding sphere.**
`limb`/`calf`/`cuff`'s ring profiles are inverted so the joint-adjacent end is the smallest radius
on the whole segment and the belly peaks mid-segment. The six joint-ball pieces are deleted; each
bone's far end now extends past its neighbouring joint by `JOINT_OVERLAP = 0.35` of its own length
(`overlapNear`/`overlapFar` in `human.js`), sealing the gap by two solids overlapping in the
interpenetration zone instead of one sphere padding it from outside.
**(2) An eye socket is a ring in the skull's own generating line, narrower than its neighbours —
never a block added for brow, nose or cheek.** `SKULL_RINGS` gains a dedicated floor at the eye's
own height (`[0.045, 0.85]`, replacing a generic temple pinch at `[-0.04, 0.84]`); the eyeball
(`eyeL/R`, `pupilL/R`) is pulled backward along the depth axis to sit behind both the brow ridge and
the skull's own cheek-height radius, keeping its exact slit shape from round 59.

### Verification method, because neither claim is provable by algebra alone
For the joints: a real point-in-lathe-solid gap probe (`humanJoints.test.js`), reusing the project's
own `profileAt`/ring-interpolation math rather than an approximation, measures residual gap
coverage at the app's own measured max gait angles — elbow ≈33° (<1% residual), knee ≈84° (<6%,
the binding case; `JOINT_OVERLAP` was tuned against a table of overlap-vs-residual-gap, not chosen
for a round number). For the eye socket: a printed radius profile from shoulder to wrist (before:
four irregular peaks from the ball bumps; after: two clean up-down cycles) and four before/after
photo pairs at true resolution (face front-on, face 3/4, full arm+leg silhouette, 3-frame walk
strip at max bend), per Đàm's own stated acceptance method.

### The fragility a shared generating line hides, and the fix that nearly broke it
The skull profile is a solid of revolution shared by TWO shapes (`skull`, the head, and `scalp`,
the hair, via one constant since ADR-095). A first attempt deepened the eye-socket ring to 0.78 at
the eye's exact height and broke `humanShape.test.js`'s hairline-containment test: 284 hair
vertices fell inside the skull. Root cause, found by tracing the exact failing vertex: `scalpFit`
stretches the whole scalp mesh's Y axis by `SCALP_LIFT` **around the chin** (y = 0), not around
each ring's own position — so a vertex sitting exactly at the socket floor in ring-space lands,
after the stretch, at a real-world height that has already climbed back onto the wide part of the
rising slope toward the forehead. A deep, narrow notch is fragile against that mismatch; the
shipped notch is shallower (floor 0.85, not 0.78) and spans 0.155 of head height instead of 0.12 —
verified against the SAME hairline-containment test with its clearance margin restored above the
existing 3% floor, not a new one invented for this round.

### Alternatives rejected
- **Deepen the eye socket to 0.78, keep it narrow.** Rejected: breaks the hairline (284 intruding
  vertices), and every attempt to compensate by raising `SCALP_LIFT` alone required 1.35× (up from
  1.10×) — visibly puffier hair in all 15 eras just to buy back margin the ring shape itself was
  spending.
  - **Add convex brow/nose/cheek blocks to fake a hollow by surrounding contrast.** Rejected by the
  order itself: *"đừng thêm khối cho gò mày, cho sống mũi, cho gò má"* — the same failure mode
  ADR-095 already named, applied to a different feature.
- **Keep the pupil's absolute forward offset from the eyeWhite unchanged (0.085 `headW`) while
  pulling both back.** Rejected: the socket floor and the cheek-height radius leave only ~0.015
  `headW` of clearance at this depth, and the old offset pushed the pupil past the brow ridge.
  The offset that stays (matching the eyeWhite's own recess) still guarantees the pupil visibly
  pokes through the eyeWhite surface (round 56's concentric-block bug does not return).

### Consequences
- `humanSkull.test.js`'s round-58 assertion *"brow ridge must never exceed the eye"* is inverted,
  not relaxed — that rule was true only because THAT round's fix enlarged the brow ridge itself into
  an awning; this round never touches the brow ridge, so the failure mode it guarded against cannot
  recur, and the new assertion is the opposite: the eye now sits behind the brow ridge, at all 15
  eras (`humanFace.test.js`, new).
- `humanPose.js`'s `footContactAt` generalises from a hardcoded `-part.h` to `part.rest.y - part.h/2`
  — overlap breaks the assumption that a limb's rest position is exactly `-h/2` from its joint.
- Several test files' hardcoded expectations move with dated before/after baselines rather than
  being loosened: `drawCallBudget.test.js` (neck reusing `calf` costs +1 draw call in 7/15 eras that
  had no bare `calf` before), `humanCoarse.test.js` (the six `bead` joint spheres are gone, so both
  the block-count floor and the triangle-savings percentage are recomputed from the actual post-change
  numbers, not guessed), `humanPose.test.js` (the silhouette-swing amplitude floor is lowered with a
  measured explanation: the overlap-extended segment's larger axis-aligned bounding box dilutes a
  proxy metric, not the walking mechanism itself, which a separate angle-amplitude test confirms
  unchanged).
- Việc 5–6 (temple hollow, cheek hollow, philtrum, collarbone notch) were assessed and deferred: the
  temple pinch is already substantially satisfied as a side effect of the eye-socket ring (they are
  geometrically the same ring on a solid of revolution), but a philtrum, a cheek hollow and a
  collarbone notch are all FRONT-only local features that a rotationally-symmetric lathe cannot
  represent without the same class of per-column construction the hairline uses — and this round's
  own eye-socket fix shows exactly how fragile that construction is to a change nobody expected to
  touch it. Recorded as `TECH_DEBT_3D` work rather than attempted under time pressure.

### Status
Accepted. Gates: lint · build · `npm run test:quiet`. Tests 1,852 → 1,858 pass, 0 fail, skipped 1.

---

## ADR-096 — Round 60: a NaN loses every comparison, so a geometric quantity must be checked before it meets a threshold; and every garment edge is a step in the generating line

**Date**: 2026-09-16 · **Order**: *"Lỗi NaN đảo cổng khoảng hở sống từ vòng 57… Dựng lại hàng 15 kỷ
bằng phép đo đã sửa và đưa con số thật."* and *"LUẬT: mỗi mép quần áo là một BẬC TRONG ĐƯỜNG SINH,
không phải một khối dán lên."* · Branch `claude/city-skill-points-display-7k4nof`.

### Context
Round 57 gave the app tap-a-resident-to-fly-close. Rounds 58 and 59 rebuilt the head, the eyes and
the hands against photographs taken through that feature, and published "15/15 eras" figures from
it. Round 60 opened by discovering that the gate deciding where the camera may stand had been
**exactly inverted since round 57**, so none of those photographs came from the planner they
claimed. The round then had to finish Phần C: clothes that look sewn.

### Decision — two rules, and they are the same rule twice

**(1) A geometric quantity is validated BEFORE it is compared, and an invalid one throws.**
`finite.js` holds the shared guards. `+Infinity` is a legal distance (an empty city IS infinitely
clear) and NaN never is, so these are not one `Number.isFinite` call. The boundary that emerged
from `pickNearest`'s own test: **ABSENT is not MALFORMED** — a missing ray or a missing box means
"nothing was hit", which is the right answer for a tap on empty sky; a present-but-malformed
argument is a programming error and must die.

**(2) A garment edge is a STEP in a lathe profile, never a block glued on.**
Three profiles carry every edge the round needed: `seam` (a step at each end), `belt` (`seam` plus
a waist cinch) and `cuff` (`calf` plus a step at the wrist/ankle), plus `shoe` for the sole welt.
A step is only an edge while it stays SHARP after `smoothCrease`, so the guard asks for an ANGLE:
an outward ledge (|Δr| ≥ 3|Δy|) that is sharp at BOTH ends.

### Why the inverted gate survived three rounds
```
    boxDistance(stand, nearestBlocker(stand, blockers))     <- a DISTANCE in the BOX parameter
    nearestBlocker = 1  =>  boxDistance(p, 1) = NaN   =>  `NaN >= 0.35` false =>  REJECTED
    nearestBlocker = 0  =>  `!0` is true => Infinity  =>  `Inf >= 0.35` true  =>  ACCEPTED
```
`nearestBlocker = 0` means the camera stands INSIDE a building. The only positions the gate ever
accepted were the ones standing inside a wall. Two properties had to hold at once: a wrong TYPE
produced NaN instead of an error, and **NaN loses every comparison** — `NaN < x`, `NaN >= x` and
`NaN > x` are all false — so whichever way the gate is written, NaN silently picks a side. The fix
therefore cannot be "write the comparison the other way round".

### What the rebuilt row then exposed
With the measurement corrected, 15/15 eras found a standing spot — but four of them (3 · 4 · 13 ·
14) chose turns of 140° · −140° · −160° · −120° away from front-on. Geometrically correct, and the
photographs are the back of a head. The fault was the SEARCH ORDER: the old loop swept the whole
circle at the near distance before trying to back off, so a spot behind the head always beat a spot
in front that needed one step of distance. New order, the same shape as `planCityFocus`'s "keep
what can be seen first": **in front → back off → only then past 90°.** A face seen from farther
away is still a face; the back of a head at any distance is not.

### Alternatives rejected
- **Write the clearance comparison the other way round.** Rejected: NaN loses both directions.
- **One `Number.isFinite` guard everywhere.** Rejected: an empty city is legitimately `Infinity`.
- **Validate every box field in `boxDistance`.** Rejected: it is the hottest loop of the chain
  (48 samples × every blocker × up to 30 replans) and every bad input arrives at the exit as NaN,
  so one exit check catches what six entry checks would.
- **Build the collar, cuff and hem as extra blocks.** Rejected by two photographs already paid for:
  round 58's eight skull blocks read as an assembled mask, round 59's four eyelid blocks as a pair
  of spectacles. A sum of convex bodies is not a smooth surface.
- **A separate shape per edge (collar, hem, waistband).** Rejected: each block has one end buried
  in its neighbour, so ONE profile with a step at each end serves all three for one draw call.
- **Give every era a collar.** Rejected as historically false: a Göbekli Tepe hide and an Egyptian
  shendyt are wrapped cloth, and eras 1 and 2 accordingly pay zero draw calls this round.

### Consequences
- Rounds 57, 58 and 59 published close-up figures produced by an inverted planner. Their pictures
  were real pictures of a real city, but the sentence "15/15 eras have a usable close-up" was never
  measured by the planner it named. Debts **#98** and **#99** close.
- Residents cost **+1 draw call** for the coarse shape, **+0/+1/+2** for the garment edges by era
  and **+0/+1** for shoes — and the coarse shape returns 25.9% of each resident's triangles, so the
  round ends BELOW where it started on geometry (22,390 → 16,460..20,712 per resident).
- `drawCallBudget.test.js` gains three baselines and three subtractions, one per change, and the
  Chromium anchor was re-measured three times in one day. Its per-era predictions matched the
  browser exactly on all three occasions, including the rows that must NOT move.
- Two measuring instruments lied during the round and both are recorded where they lied: a
  "crease over 40°" definition that would have called a plain torso tailored, and a belt edge at
  35.0° that every number called correct and no photograph would have shown.

---

## ADR-095 — Round 58: adding convex lumps does not make a curved surface — five of the seven skull features belong in ONE generating line

**Date**: 2026-09-13 · **Order**: *"Chín vòng qua nhân vật được dựng cho một hình cao 70 px — nay tôi
nhìn gần gấp năm lần, và ở cỡ ấy nó đọc ra là một con ma-nơ-canh… Không phải thiếu chi tiết. Là
thiếu HÌNH."* · Branch `claude/city-skill-points-display-7k4nof`.

### Context
Round 57 gave the app tap-a-resident-to-fly-close. The first thing Đàm saw at that distance was a
head that had been a perfect sphere for nine rounds. He listed seven skull features (flat sides,
occipital bulge, sloping forehead, brow ridge, eye sockets, cheekbones, jaw/chin, ears), a visible
neck with sloping shoulders, and hair with volume.

### Decision
The head gets its **own lathe profile** (`skull`, exported as the shared constant `SKULL_RINGS`)
carrying five of the seven features — chin, jaw taper, cheekbone flare, **a pinch at the temples**,
and the sloping forehead. Only the two features that are front-back asymmetric, which no surface of
revolution can express, stay separate blocks: `occiput` and `browRidge`.

### The rejected design, and why the photograph rejected it
The first implementation did all seven with **eight convex blocks glued onto the sphere**, at zero
new shapes and therefore zero extra draw calls. Every number measured correct: the cheekbone stood
proud of the skull, the chin was the forwardmost point of the lower face, z/x fell from 1.000 to
0.800. Then a frontal photograph at 1170×726:

| block | intended | what the photo showed |
|---|---|---|
| `browRidge` (box, full head width) | brow ridge | a **horizontal bar** — a headband or goggles |
| `cheekL/R` (dome) | cheekbones | two **balls** under the eyes — chipmunk |
| `chin` (dome) | chin | a third **ball** stuck under the mouth |
| `jaw` (chest) | jaw | a **flat slab** with hard corners at the sides |

Cause, stated properly: each block is a separate CONVEX body, so it brings its own silhouette and
its own normal discontinuity where it meets the skull. **A sum of convex bodies is not a smooth
surface — it is a set of bumps.** The result read as an assembled mask, worse than round 56's plain
face.

This is the same lesson the project already paid for at the brimmed hat (2026-08-23): built from
two blocks it was wrong; asking *"how many objects is this in real life?"* — one — and merging them
into one surface of revolution was better looking AND cheaper.

### Price, paid explicitly
`skull` is a new shape ⇒ a new `InstancedMesh` ⇒ **+1 draw call in all 15 eras**, from 18 to 19 in
the heaviest scene (+5.5%). `drawCallBudget.test.js` carries the new baseline with its date and a
control table proving the difference is +1 everywhere — never +2. Reshaping `dome` instead was
rejected: `dome` also draws the eyes, pupils and six joint balls, and a skull-shaped knee is worse.

### Consequences, including three that only surfaced because a gate fired
1. **`scalp` had to share the profile, not copy it.** Its comment promised *"rings exactly equal
   `dome`"* in prose. Changing the head to `skull` broke that promise silently — at the parietal the
   skull widened to 1.00 while the hair, still on `dome`, reached 0.92 ⇒ hair sinks INTO the skull
   and round 56's horizontal seam returns. Now both read `SKULL_RINGS`. **A promise written in prose
   has no teeth.**
2. **The hairline's three calibration numbers were in RING-INDEX units.** Solved for 6-ring `dome`,
   they meant nothing on a 9-ring `skull`: the front hairline fell from 0.672 to **0.343** of head
   height, down to eye level. Re-expressed in HEIGHT, which no ring count can shift. *A number only
   means something together with the frame it was solved in* — same family as the `cadenceOf` label
   bug (`humanStyle.js`).
3. **A geometric sufficiency proof expired.** Round 56 guaranteed the hair sits outside the skull
   because *"the generating line of `dome` seen from the head joint is monotone"*. The temple pinch
   destroys monotonicity; clearance fell to 2.79%, under round 56's own 3% floor. `SCALP_LIFT`
   1.07 → 1.10. What caught it was the measured FLOOR, not the sentence in the comment.
4. `humanShape.test.js` held a THIRD hand-copy of the ring table and reported *"872 hair vertices
   inside the skull"* for hair that was entirely outside. It now asks `shapeRings(head.shape)`.

### Also decided this round
- **`MAX_PARTS` 40 → 56** and the resident triangle ratio ceiling 3.0 → 4.0. Residents now cost
  **328.69%** of the city's triangles (22,754 × 28 on a 193,836-triangle scene) — most of that from
  round 55's 60 sides, not this round. Both ceilings keep the relation they exist to guard (a
  mis-nested loop multiplies by ≥ 2×). Recorded as a debt: a 6-pixel cheekbone was spending 716
  triangles because `dome` has 60 sides; the fix is a COARSE shape in the common set, not another
  raise.
- **The shoulder line drops from 0.88 to 0.74 `torsoH`.** Measured: the shoulder ball's top was at
  y = 0.17335 while the jaw was at 0.17231 — **the visible neck was a NEGATIVE number**. The neck
  existed in code from round 54 and had never existed in a photograph. One number fixed two faults:
  the fingertips now reach mid-thigh, the landmark `armLen`'s own comment always claimed to hold.
- **Stance is a pure function of resident identity** (`humanStance.js`), added as a constant bias on
  top of the gait rather than a separate standing pose — residents are almost always walking, so a
  standing pose would show rarely and would fight the gait where it did. The shoulder tilts
  OPPOSITE the hip; that one sign is the whole law, and at 3° the eye cannot name the error, it only
  sees "something is off". A test guards the sign.

### Status
Accepted. Gates: lint · build · `npm run test:quiet`. Tests 1,797 → 1,824 pass, 0 fail, skipped 1.

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

## 📚 Rotated 2026-10-02 → [`docs/archive/ARCHITECTURE_DECISIONS_2026-10-02.md`](docs/archive/ARCHITECTURE_DECISIONS_2026-10-02.md)

15 entries moved verbatim (ADR-076); nothing deleted. Find one: `grep -n '<title>' docs/archive/ARCHITECTURE_DECISIONS_2026-10-02.md`.

<details><summary>Titles</summary>

- ADR-075 — Retrieval architecture: freeze closed knowledge, cap every file at one context window, guard it
- ADR-074 — Tài liệu tự-nạp viết bằng TIẾNG ANH, có cổng canh ngôn ngữ đo theo ĐOẠN
- ADR-073 — Ngân sách token của TÀI LIỆU: tách file + cổng canh bằng test, không nới trần
- ADR-072 — Tray menu bar: realtime KHÔNG được là nguồn cập nhật DUY NHẤT, luôn cần một lưới poll dự phòng
- ADR-071 — THỐNG KÊ TRẢ LỜI, KHÔNG TRÌNH BÀY; ĐÓNG #99: BA ĐỒNG TIỀN NGỦ THÔI ĐƯỢC CỘNG; CHỮ TRONG SAVE ĐỌC TỪ BẢNG
- ADR-070 — MỘT CÁI KẾT DUY NHẤT, KHÔNG NÚT NHẬN, KHÔNG MÀN CHẾT: phần thưởng đã đạt thì tự vào, di vật lớn theo phiên, đặc quyền công trình về trục sống
- ADR-069 — ĐỒNG TIỀN DUY NHẤT LÀ PHIÊN: công trình một nút, bậc và thử thách kỷ tự chạy theo lịch sử, kỹ năng chọn ngay lúc lên cấp
- ADR-068 — VÒNG LẶP CHÍNH theo tâm lý học thói quen: chuỗi lên đầu màn hình, nhiệm vụ ngày về chỗ ra quyết định, và mỗi phiên kết thúc bằng một CHUỖI THẺ chứ không phải một thẻ toast
- ADR-062 — Nguyên mẫu thứ 8 `monolith`: công trình LÀ khối, không phải nhà đội mái
- ADR-089 — Round 49: give the machine something to blow, and light the fire — props that move, fire and night, weather that wets the ground
- ADR-094 — Round 54: the geometry was already curved; nobody had told the shading
- ADR-093 — Round 53: a wall that cannot shadow itself cannot be lit, however many effects you pour on it
- ADR-092 — Round 52: the post pass, surfaces that are not plastic, and the gate that said "how many OBJECTS is this?"
- ADR-091 — Round 51: the eye came down to the street, and the two biggest things in the frame were the two emptiest
- ADR-090 — Round 50: more to see and more to do — four seasons, a handle on the clock, a walk down the street, a postcard, and insides

</details>

---

