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

## ADR-067 — Màn Thống kê có MỘT nguồn kỳ thời gian, và kỳ mang nghĩa LỊCH chứ không phải "N ngày gần nhất"

- **Ngày**: 2026-08-30
- **Bối cảnh**: Đàm hỏi *"xem lại phần Thống kê … có nên sửa gì không hay big upgrade lên không?"*.
  Đi khảo sát thì màn này là file lớn thứ hai dự án (`StatsDashboard.jsx`, 4.901 dòng) và **không
  có một bài test hành vi nào** — bài duy nhất nhắc tên nó là `motionCoverage.test.js`, và bài đó
  chỉ đếm số khai báo chuyển động.
- **Vấn đề**: hai lỗi khác nhau, cùng một hình dạng — *một luật được phát biểu ở nhiều chỗ*.
  1. **Ba bộ lọc thời gian, ba mặc định.** `PERIODS_UI` (Tổng Quan, mặc định `week`) ·
     `FOCUS_PERIODS` (Tập Trung, mặc định `all`) · `CAT_PERIODS` (Phân Loại, mặc định `all`) —
     khác nhau cả danh sách, cả nhãn, cả markup. Bấm từ tab này sang tab kia là **cửa sổ thời gian
     âm thầm đổi**, không có gì báo; hai con số cách nhau một cú bấm đang nói về hai khoảng thời
     gian khác nhau.
  2. **Một lỗi NHÃN (số đúng, tên sai).** Tổng Quan tính cửa sổ bằng `now - 7×86400000` rồi dán
     nhãn *"tuần này"*. Vào thứ Tư thì "tuần này" là T2→T4 còn "7 ngày gần nhất" là T5 tuần
     trước→T4. Và biểu đồ cột **ngay bên dưới** lại dựng theo tuần LỊCH (từ thứ Hai) ⇒ ô số tổng
     và bộ cột dưới nó đo hai khoảng khác nhau mà mang cùng một nhãn. Cùng họ với lỗi nhãn mép
     khung ở `frame-fit.mjs` (Phase 7B): độ lớn đúng, cái tên sai.
  Kèm ba hằng số CHẾT (`PERIODS` · `METRIC_OPTIONS` · `PERIOD_UNITS`) và ba props chết
  (`progress`/`prestige`/`buildings` truyền cho `OverviewTab` mà hàm không nhận).
- **Phương án cân nhắc**:
  1. **Chỉ sửa nhãn cho khớp cửa sổ 7-ngày.** Loại: nó làm ba tab lệch nhau THÊM, vì hai tab kia
     đã dùng nghĩa lịch ("Tuần Này" = từ thứ Hai). Và "7 ngày gần nhất" không phải thứ người dùng
     nghĩ tới khi đọc chữ "tuần này".
  2. **Giữ ba bộ lọc, chỉ đồng bộ danh sách.** Loại: danh sách giống nhau mà TRẠNG THÁI vẫn riêng
     thì cửa sổ vẫn nhảy khi chuyển tab — chữa cái nhìn thấy, để nguyên cái cắn.
  3. **Viết lại cả màn Thống kê.** Loại: 4.901 dòng không test, đập đi xây lại là canh bạc rủi ro
     cao với lợi ích không chắc, trong khi màn hình đang chạy đúng.
  4. **Một nguồn kỳ ở engine + một trạng thái ở component cha** — chọn.
- **Lý do chọn**: kỳ thời gian là phép tính THUẦN, không có điểm ảnh nào trong đó, nên chỗ của nó
  là engine (`src/engine/statsPeriod.js`). Nâng TRẠNG THÁI lên `StatsDashboard` thì ba tab **không
  thể** lệch nhau — không phải "rất khó lệch", mà là không có đường nào để lệch, vì chỉ có một
  biến. Chọn nghĩa LỊCH vì (a) đó là thứ người dùng hiểu khi đọc "tuần này", (b) hai tab còn lại
  đã dùng nghĩa ấy sẵn, (c) nó làm ô số tổng khớp với biểu đồ cột ngay dưới nó — hai thứ ấy nay
  đọc chung `getPeriodStartTs`/`buildPeriodBuckets` nên không thể lệch.
- **Trade-off**: dải "Điều đáng chú ý" (ADR cùng ngày, xem mục Ảnh hưởng) **KHÔNG** theo kỳ đang
  chọn — các hàm tín hiệu ở `gameMath.js` cần 8–24 phiên mới vượt gác cỡ mẫu, lọc về "Hôm Nay" là
  làm chúng câm hết. Đây là một sự KHÔNG NHẤT QUÁN có chủ đích, và cái giá của nó được trả bằng
  một dòng chữ trên màn hình (*"Đọc trên toàn bộ lịch sử, không theo khoảng thời gian đang chọn"*)
  chứ không giấu đi — không nói ra thì nó dựng lại đúng cái hiểu nhầm mà ADR này đi sửa.
  Trade-off thứ hai: bộ chọn nay có SÁU nút nên không nằm vừa cạnh tiêu đề, phải xuống hàng riêng
  (ảnh chụp 1280px cho thấy "Năm Nay"/"Tất Cả" bị mép phải xén mất) — đổi lại ba tab nay có cùng
  một bố cục.
- **Ảnh hưởng**: thêm `src/engine/statsPeriod.js` (nguồn kỳ + `buildPeriodBuckets`, mỗi cột tự
  khai ĐỘ MỊN của nó thay cho chuỗi `if` ở tầng giao diện vốn viết cho ba kỳ) và
  `src/engine/statsInsights.js` (dải "Điều đáng chú ý" — chỉ GỌI hàm `gameMath.js` đã có, KHÔNG
  chế công thức mới). `StatsDashboard.jsx` gỡ 3 props chết + 3 hằng số chết + 2 helper trùng lặp
  + 4 import thời gian thừa + 1 hàm chết (`summarizeSessionReviews`), và nhịp "/ ngày" nay chia
  cho số ngày ĐÃ TRÔI QUA trong kỳ thay vì độ dài danh nghĩa (chia cho 365 vào tháng Giêng là
  đúng phép chia mà sai ý nghĩa). Khoá bằng `statsPeriod.test.js` (20 bài),
  `statsInsights.test.js` (12 bài) và `statsPeriodWiring.test.js` (8 bài đọc mã nguồn) — bài cuối
  làm cho thao tác "thêm một `useState('all')` vào một tab" ĐỎ NGAY, vì đó là cách cái bẫy này
  quay lại mà đọc một mình thì hoàn toàn hợp lý.
- **Ảnh hưởng (bổ sung cùng ngày)**: chuyển nốt `summarizeFocusStats` + bảng dải/buổi (206 dòng,
  phép tính lái toàn bộ tab Tập Trung) xuống `engine/statsFocus.js`. Phép chuyển được chứng minh
  KHÔNG đổi hành vi bằng **đối chiếu chéo**: chạy CẢ HAI bản trên cùng fixture 624 phiên ở cả 6
  kỳ, so JSON — **6/6 trùng khít từng byte** (sau khi bỏ `accent`, khác biệt duy nhất có chủ ý).
  ⚠️ Chính phép đối chiếu ấy bắt được một lỗi TIỀM ẨN trong module mới: thiếu `import
  startOfVietnamDayTs`, thứ chỉ ném `ReferenceError` lúc CHẠY chứ không lúc nạp — `node -e
  "import(...)"` báo nạp thành công, lint sạch, build xanh. *Một module nạp được không có nghĩa là
  nó chạy được.* Và xoá 960 dòng code chết khỏi `StatsDashboard.jsx` (4 component + rác dây
  chuyền), đưa file từ **4.901 → 3.746 dòng (−23,6%)**.
- **Điều kiện xem lại**: nếu có ngày cần một tab đo theo cửa sổ TRƯỢT (ví dụ "30 ngày gần nhất"
  cho một biểu đồ xu hướng), thì thêm nó vào `STATS_PERIODS` như một kỳ RIÊNG có tên nói đúng
  nghĩa ("30 Ngày Gần Nhất"), **đừng** đổi nghĩa của một kỳ đang có — đổi nghĩa là dựng lại đúng
  lỗi nhãn mà ADR này đi sửa.

---

## ADR-066 — Bộ xương thành phố SINH THEO KỶ bằng chia đôi đệ quy; đường là RANH GIỚI THỬA, không phải hàng và cột

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 20. Đàm nhìn bản quét 15 kỷ rồi nói hai câu, và cả hai đều nói về cùng một
  thứ: *"nhà vẫn quy hoạch rất kỳ quặc, nó rất bài bản và xếp chồng lên nhau"* · *"cho tôi một sự
  sắp xếp thành phố ngẫu nhiên và mang tính đặc thù, không phải cứ 3x3 được, nó phải nhiều thứ và
  đa dạng hơn"*.
- **Vấn đề**: bộ xương nằm ở hai hằng số trong `cityGrid.js`, và **không hằng số nào nhận `era`**:
  `ROAD_LINES = {0,4,8,11}` (4 hàng + 4 cột ⇒ 9 siêu-ô đều tăm tắp) và `BUILDING_ZONES` (5 khu
  **3×3** ở bốn góc + tâm). Đo lại để khỏi nói bằng cảm giác — quy về thang *0% = đúng mức ngẫu
  nhiên, 100% = đối xứng bốn chiều hoàn hảo*: **bốn khu kỳ quan ở góc đạt đúng 100,0%**, cả 5 khu
  đạt 90,3% (khu tâm lệch một ô vì 12 là số chẵn), mạng đường đạt 55,0%. Tức phần MANG BẢN SẮC
  NHẤT — chỗ đứng của năm kỳ quan — đối xứng bốn chiều **tuyệt đối, ở cả 15 kỷ**. Mà đối xứng bốn
  chiều là đặc điểm của kinh đô ĐƯỢC QUY HOẠCH (Trường An, Washington), không phải Çatalhöyük,
  không phải Alfama, không phải Tokyo. Mọi phase trước đều sửa thứ nằm TRONG một ô (mái, tầng trệt,
  mặt đường, cụm nhà) nên bộ xương chưa bao giờ đổi — và bộ xương mới là thứ mắt đọc ra ĐẦU TIÊN
  khi nhìn thành phố từ trên cao.
- **Phương án cân nhắc**:
  1. **Giữ lưới, chỉ đa dạng hoá bên trong ô.** Loại: đó chính xác là thứ tám phase vừa qua đã làm,
     và Đàm vẫn nói *"rất bài bản"*. Cái bị kêu là bộ xương, không phải nội thất.
  2. **Voronoi từ điểm gieo + nới lỏng** (chỉ thị nêu tên). Loại — và loại bằng phép ĐO chứ không
     bằng cảm tính: Voronoi cho ranh giới **XIÊN**, mà toàn bộ tầng dựng đường chỉ biết ô vuông
     (`terrainMesh.js` dựng mặt đường theo TỪNG Ô với ba vai; `streetCrossSection` phát biểu bề
     rộng theo MẶT CẮT NGANG của một ô; `carriagewayShape` loe theo bốn hướng vuông góc). Ranh giới
     xiên KHÔNG diễn đạt được bằng bộ từ vựng ấy ⇒ phải viết lại cả tầng đường, kéo theo mất hết
     bó vỉa/vỉa hè/vạch kẻ theo kỷ mà Phase 9D dựng. Đó là một phase khác, không phải một lựa chọn
     trong phase này.
  3. **Viết tay 15 bố cục.** Loại: 15 lần chọn bừa, không có luật nào ràng, và kỷ thứ 16 không có
     đường nào để sinh ra.
  4. **Chia đôi đệ quy lệch tâm (BSP)** — chọn.
- **Lý do chọn**: BSP cho ranh giới THẲNG trùng khít lưới ô ⇒ **dùng lại nguyên tầng đường đã có**,
  không phá gì. Và nó KHÔNG "đều" như tên gọi gợi ý: chỗ cắt lệch tâm theo `sizeVary`, vùng được
  chọn để cắt cũng bốc theo hạt giống, nên hai kỷ cùng số thửa vẫn ra hai hình khác hẳn. Bàn cờ chỉ
  xuất hiện khi `sizeVary` ≈ 0 — tức đúng ba kỷ khai `grid`, và ở đó nó ĐÚNG (Trường An, Manhattan,
  Tokyo thật sự là bàn cờ). Điểm quyết định thứ hai: **đường là HỆ QUẢ của số thửa**, không có bảng
  "kỷ này bao nhiêu ô đường" nào cả — mỗi nhát cắt để lại một hàng/cột làm lối đi, nên nhiều thửa
  nhỏ ⇒ nhiều ngõ, ít thửa lớn ⇒ ít đường. Một hệ quả thì không thể trôi khỏi thứ sinh ra nó; một
  bảng thứ hai thì có (đúng bài học `TECH_DEBT #43`). Kết quả đo trên thang trên: cao nhất còn
  **20,0% (kỷ 4, `grid` — được phép)**, và cao nhất trong các kỷ KHÔNG phải `grid` là **9,6%**.
- **Trade-off — VÀ ĐÂY LÀ PHẦN PHẢI ĐỌC, KHÔNG ĐƯỢC BỎ QUA**: bộ xương mới **dời chỗ TOÀN BỘ 75
  công trình — 5/5 ở cả 15 kỷ**. Không có bộ xương nào vừa khác cái cũ vừa giữ nguyên chỗ cũ; đó là
  hai yêu cầu loại trừ nhau, không phải một khuyết tật cần vá. ADR-007 (*"bảo tàng bất động"*) nói
  vị trí một công trình **không bao giờ được đổi**, và nó vẫn đúng — nhưng nó là lời hứa cho thời
  gian VỀ SAU, và điều kiện của nó là *bố cục phải là hàm thuần của riêng `era`*, thứ mà `cityPlan`
  giữ nguyên (có test gọi kèm dữ liệu rác + quét 1…120 phiên × 15 kỷ đòi kết quả y hệt). Cái giá
  phải trả là MỘT LẦN, đúng lúc đổi bộ sinh. ⇒ **Đây là quyết định của Đàm, không phải của tôi.**
  Kể từ ngày ship, bộ sinh của một kỷ bị ĐÓNG BĂNG.
- **Ảnh hưởng**: `cityGrid.js` co lại còn đúng một hằng số (`CITY_GRID_SIZE`), gỡ `BUILDING_ZONES` ·
  `ROAD_MAIN_AXIS` · `ROAD_CROSS_AXIS` · `RING_LOW/HIGH` · `ROAD_LINES`. Thêm hai file theo khuôn ba
  lớp lần thứ **MƯỜI**: `networkStyle.js` (BẢNG, 5 trục × 15 kỷ — `plan` · `parcels` · `sizeVary` ·
  `ring` · `minSide`; `country` khoá cứng vào `eraStyle`) và `cityPlan.js` (HÌNH). Bản quét lên ở cả
  hai trục: CHẶNG NGÀY **11,33 → 12,44** (qua lại ngưỡng mắt 12, 0/15), KỶ gần nhất **19,18 → 21,77**
  · trung vị **36,31 → 38,48** (0/105).
  ⚠️ **ĐÍNH CHÍNH TRONG CHÍNH ADR NÀY — BẢN ĐẦU GHI "ĐÓNG `TECH_DEBT #89`" VÀ ĐÓ LÀ MỘT KẾT LUẬN
  SAI, ĐÃ ĐO VÀ TỰ BÁC BỎ.** Lời giải thích đi kèm cũng sai (*"bộ xương mỗi kỷ nay đổ bóng khác nhau
  nên các chặng không còn bị 15 bản sao pha loãng"*) — nghe cực kỳ xuôi, và tách ba dải của đúng cặp
  yếu nhất (6h↔15h) thì nó ngược hẳn: **trời 4,12 → 4,05 (−0,07)** · thành phố 6,51 → 5,56 (**tệ
  đi**) · **đất 18,05 → 20,42 (+2,37 — TOÀN BỘ phần tăng)**. Mà dải TRỜI mới là cần gạt đã được nêu
  đích danh HAI LẦN ở `CLAUDE.md`. ⇒ **`#89` GIỮ NGUYÊN TRẠNG THÁI MỞ**; cổng qua nhờ một dải chẳng
  liên quan tới chẩn đoán, và biên chỉ **0,44**. Cơ chế khả dĩ cho phần tăng ở dải đất — ghi là
  **TƯƠNG QUAN, chưa chứng minh nhân quả** — là số ô đường thôi là hằng số 80 mà thành 34…92 tuỳ kỷ.
  Bài học: **một cái cổng đo một con số GỘP thì không phân biệt được "đã chữa đúng bệnh" với "một
  dải chẳng liên quan tình cờ khoẻ lên"**, và nhận công cho lần thứ hai thì phiên sau sẽ đóng mục nợ
  ấy trong khi bệnh còn nguyên.
- **Điều kiện xem lại**: (a) nếu có kỷ thứ 16, nó chỉ cần thêm MỘT dòng vào bảng — không được sửa
  bộ sinh, vì sửa bộ sinh là dời thành phố của 15 kỷ cũ; (b) nếu sau này tầng dựng đường học được
  ranh giới xiên thì Voronoi mới trở thành một lựa chọn thật, và lúc ấy phải cân lại bằng ẢNH chứ
  không bằng lý lẽ; (c) trần `minSide` là một ràng buộc SỐ HỌC (`(minSide+1)·k − 1 ≤ L`) — muốn một
  kỷ `grid` có nhiều thửa hơn thì phải hạ `minSide` hoặc bỏ vành đai, không có đường thứ ba.

---


## ADR-065 — **BÀN CỜ LÀ MỘT MỐC LỊCH SỬ, KHÔNG PHẢI MỘT CÁCH SẮP XẾP MẶC ĐỊNH**: bố cục bên trong một thửa có trục `layout`, và một khu nhà phải NẰM TRONG thửa của nó

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 21 §3–§5. Phase 20 (ADR-066) đã đổi được **bộ xương** thành phố — đường thôi
  là hàng và cột, thửa khác cỡ khác hình. Đàm xem bản quét và vẫn nói: *«nhà vẫn xếp rất ngăn nếp
  trông như quy hoạch, dù quy hoạch ô bàn cờ chỉ bùng nổ và trở thành chuẩn mực từ thế kỷ 19 (Cách
  mạng Công nghiệp). Và việc mở rộng thành phố không phải là nhà xếp chồng lên nhau, nó rất phản
  thực tế và lịch sử.»* Ba lời phê riêng biệt trong một câu, và cả ba đều đúng vào một chỗ mà
  Phase 20 **không hề chạm tới**: bên trong MỘT thửa, `blockStyle.js` (ADR-052) vẫn dựng khu nhà
  bằng một lưới `cols × rows` cho cả 15 kỷ.
- **Vấn đề**: ba khuyết tật, và điều đáng nói là **chúng chỉ lộ ra khi đứng cạnh nhau**:
  1. **NGĂN NẾP** — `cols × rows` là một cái bàn cờ thu nhỏ. Đổi bộ xương ở tầng trên rồi mà tầng
     dưới vẫn là lưới thì mắt vẫn đọc ra lưới; hai tầng chỉ khác nhau về cỡ.
  2. **CHỒNG LÊN NHAU** — đo lần đầu ra **290 cặp** khối nhà dân đè lên nhau, chỗ sâu nhất
     **−0,441 ô**, khối rộng nhất **1,734 ô** (tức một khu nhà tràn qua trọn ô bên cạnh). Không có
     gì đỏ lên suốt từ Phase 14 §1(3), vì chưa bài test nào hỏi câu ấy.
  3. **THỬA VẪN KHÁ ĐỀU NHAU** — và khi đi đo mới lộ ra nguyên nhân thật, ở một chỗ không ai ngờ:
     ⚠️ **6/15 kỷ có ĐÚNG 0 thửa dành cho nhà dân.** `WONDER_PARCELS = 5` ăn trước, phần dư mới
     chia cho nhà; kỷ nào khai `parcels: 6` thì còn đúng 1 thửa, mà thửa ấy lại bị lấy làm sân.
     Nghĩa là con số "tỉ số thửa lớn nhất / nhỏ nhất" mà ta định đem đi chấm **đang đo các khu đất
     kỳ quan**, không đo đất ở — một phép đo trả lời rất tự tin về một đại lượng khác.
- **Phương án cân nhắc**:
  1. **Rải theo hạt giống rồi tránh nhau (scatter-and-retry)** cho kỷ 1–9. Loại: cần một phép kiểm
     chồng lấn + một số lần thử lại, tức **hai hằng số phải hiệu chuẩn** và một nhánh "thử mãi
     không được thì làm gì". Đúng họ những cơ chế đã chết trong im lặng ở Phase 8D (lùm cây).
  2. **Chia thửa đệ quy lệch tâm (BSP) cho kỷ 1–9, giữ `cols × rows` cho kỷ 10–15** — chọn.
  3. **Bỏ hẳn `cols × rows`, cho cả 15 kỷ dùng BSP.** Loại: nó xoá luôn cái mốc lịch sử Đàm vừa
     ra — Manhattan 1811 và Barcelona của Cerdà **phải** đọc ra là lưới, đó là bản sắc của chúng.
  4. Cho chồng lấn: **nới khoảng cách giữa các suất đất**. Loại: nó không chữa gốc (khối tự nó
     rộng hơn suất đất của nó) và nó ăn mất chính phần đất vừa chia ra.
- **Lý do chọn**:
  - **Các lá của một cây BSP rời nhau THEO CẤU TẠO.** Không cần phép kiểm chồng lấn, không có số
    lần thử lại để phải hiệu chuẩn, không có nhánh thất bại. Và nó **tái dùng đúng cơ chế
    `cityPlan.js`** đang chạy ở tầng trên — một luật một công thức, ở hai cấp.
  - **Mốc lịch sử áp thẳng, không chỉnh khéo**: kỷ **1–9** không được xếp hàng lối ở bất kỳ tầng
    nào; kỷ **10–15** thì được. Khoá bằng test **hai chiều** (kỷ 1–9 **phải trượt** phép kiểm "là
    lưới đều"; kỷ 11–15 **phải đạt**) — một chiều thôi thì cách rẻ nhất để test hết đỏ là làm mọi
    kỷ hữu cơ, tức xoá mất nửa kia của mốc.
- **Giải pháp**:
  - **§3 — trục `layout`.** `BLOCK_LAYOUT = ['organic', 'grid']` trong `blockStyle.js`. Kỷ 1–9 khai
    `units` (số suất đất) và đi qua `xepHuuCo()`: chia thửa đệ quy lệch tâm, **mỗi lần cắt chọn
    vùng LỚN NHẤT còn chia được, cắt theo cạnh DÀI hơn**, tỉ lệ cắt lấy từ hạt giống. Kỷ có sân
    (`attach: 'court'`) cắt thêm một lá rồi xoá lá gần tâm nhất làm sân chung — **chỉ khi còn ≥ 5
    lá**, vì một cái sân cần ít nhất bốn nhà vây quanh. Kỷ 10–15 giữ `cols × rows` (`xepLuoi`),
    không đổi một dòng.
  - **§4 vế 1 — khu nhà NẰM TRONG thửa của nó.** Ba việc, mỗi việc đo riêng:

    | | cặp chồng lấn | sâu nhất | khối rộng nhất |
    |---|---|---|---|
    | nền `84d31e2` | 290 | −0,441 ô | 1,734 ô |
    | + `BLOCK_MAX_CELLS = 1` | 84 | −0,078 | 1,092 |
    | + giải affine lượt thứ ba | 20 | −0,044 | 1,048 |
    | + `EAVE_LAND_FACTOR = 1,05` | **15** | **−0,015** | 1,062 |

    −0,015 ô ở `CELL_PIXELS = 64` là khoảng **1 điểm ảnh**, dưới sàn mắt 4 điểm ảnh.
    ⚠️ Lượt thứ ba là một phép **GIẢI**, không phải một vòng lặp: `specFootprint` là hàm **BẬC
    THANG** của `fx` (số cửa sổ, số cột, số bậc đều là số nguyên) nên lặp tới hội tụ thì **phân
    kỳ** — đo được lượt ba đi XA hơn lượt hai. Hai lượt cho ra hai điểm, và một đường thẳng qua hai
    điểm thì giải được. (Cùng bài học Phase 14 §1(3): *trước khi lặp tới hội tụ, hỏi "hàm này có
    liên tục không?"*.)
  - **§4 vế 2 — thành phố LAN RA.** Đã đúng sẵn theo cấu tạo (`dwellingPlots` xếp theo khoảng cách
    tới tâm tăng dần, `deriveDwellings` lấy **tiền tố**), nhưng **chưa bài nào canh**. Nay có: so
    20 phiên với 120 phiên, đủ 15 kỷ — bán kính xa nhất đi từ 1,5–3,5 lên 4,5–5,5 và hộp bao nở
    **1,65 lần** (kỷ 4) tới **12,0 lần** (kỷ 13). Đảo thứ tự sắp xếp thì bài đỏ ngay ở kỷ đầu tiên
    — đã thử.
  - **§5 — tách vai của thửa ra một module lá.** `parcelRoles.js` (0 lời `import`) giữ **một** công
    thức chia vai `wonder / plaza / dwelling`, và **cả `cityPlan.js` lẫn `networkStyle.js` cùng
    gọi nó** — nếu không thì cái trần sức chứa và phép chia vai sẽ trôi khỏi nhau và lại đẻ ra
    những kỷ 0 thửa nhà. `isValidNetworkStyle` nay **từ chối thẳng** dòng nào để lại
    `< MIN_DWELLING_PARCELS` (= 2) thửa nhà, không tự chữa. Bảy kỷ được nới `parcels`
    (1: 6→11 · 2: 7→9 · 5: 6→9 · 6: 7→12 · 7: 9→11 · 12: 6→8 · 13: 12→13); kỷ 9 xét rồi **giữ
    nguyên**, ghi lại lý do tại chỗ.
- **Trade-off**:
  - **§4 đã trả giá, và nói thẳng ra**: `BLOCK_MAX_CELLS = 1` khoá số suất đất ở 4 cho cả 15 kỷ ⇒
    cột `units`/`cols`/`rows` của bảng khu phố tạm thành một **trục chết**. Đã đếm ra tường minh
    bằng một bài test đi qua đúng đường dựng thật, kèm ba phương án đã đo, ghi ở `TECH_DEBT #88`.
    **Không nới trần**: đo được trần 2 thì khối lại xuyên qua nhau.
  - **§5 làm bảy mốc số cũ già đi**, và chúng được ghim lại **sau khi đo**, không một cái sàn hay
    trần chất lượng nào bị nới (một cái trần còn được SIẾT: `TRAN_TROI` 0,13 → 0,10 ô). Tốt lên:
    chiều cao nhà kỷ 1 và 7 hết trượt · kỷ 5 thôi bị khung hình thu nhỏ vô cớ (biên 0,2294 →
    0,0400) · mảng phủ đất nay đạt ở **cả bảy** mốc phiên (trước hụt ở mốc 150) · nước nhìn thấy
    được tăng ở **13/14 kỷ** và kỷ 5 vượt cổng 5% (3,63 → 7,00). Xấu đi và không giấu: ô mất chi
    tiết mái **7/476 (1,5%) → 10/473 (2,1%)**, kỷ tệ nhất 0,893 → 0,844. Nguyên nhân là một phép
    **đổi tỉ lệ loại nhà** (thêm ô đường ⇒ đổi ô nào là nhà ⇒ đổi tỉ lệ `workshop`, nguyên mẫu
    thấp-rộng có tỉ số xấu nhất), **không phải** một cơ chế hỏng.
- **Ảnh hưởng**: `blockStyle.js` (trục `layout` + `xepHuuCo`) · `block.js` (trần một ô, giải affine,
  `EAVE_LAND_FACTOR`) · `cityPlan.js` + `networkStyle.js` (cùng gọi `parcelRoles`) · module mới
  `parcelRoles.js`. **ADR-007 nguyên vẹn**: mọi thứ vẫn là hàm thuần của `era` (+ vị trí ô), và bài
  test "chỉ thêm, không bao giờ dời" vẫn xanh cho 1…120 phiên × 15 kỷ.
- **Điều kiện xem lại**: (a) `TECH_DEBT #88` — nếu tìm được cách cho suất đất > 4 mà khối vẫn không
  xuyên nhau thì cột `units` sống lại; (b) nếu Đàm thấy kỷ 10 (bản lề) nên ngả hẳn về một phía;
  (c) nếu có kỷ thứ 16 được thêm, nó phải tự khai `layout` — không có mặc định.

---

## ADR-064 — Hợp nhất hai nhánh: **BSP quyết cắt Ở ĐÂU, cung cong quyết cắt theo HÌNH GÌ**; và một thửa là TẬP Ô, không phải hình chữ nhật đã khai

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 21. Hai nhánh đã đi giải **cùng một bài toán** — *"xoá vẻ quy hoạch của bộ
  xương thành phố"* — bằng hai lời giải khác nhau, trong hai phiên không nhìn thấy nhau. `main` có
  **ADR-059**: mỗi kỷ tự sinh tập ô đường bằng những **CUNG CONG** (`arcTrace` trong `roadPlan.js`),
  cho ra đường lượn và giao lộ chữ T/Y thật. Nhánh Phase 20 có **ADR-066**: **chia thửa đệ quy**
  (`cityPlan.js`), cho ra thửa **khác cỡ khác hình** thay cho 9 siêu-ô đều tăm tắp. Đàm ra lệnh hợp
  nhất, và nói rõ giữ `cityPlan` làm nguồn sự thật về bố cục còn ADR-059 làm tầng hình dạng của
  đường. Hai bên còn **trùng số ADR 056 và 057** cho hai nội dung khác hẳn nhau, và trùng cả
  `TECH_DEBT #79`/`#80`.
- **Vấn đề**: gộp mù thì mất một trong hai. Ghép được hay không phụ thuộc vào một câu hỏi chưa ai
  đặt ra: **hai bộ sinh ấy có đang trả lời cùng một câu hỏi không?** Đọc kỹ cả hai thì **không**:
  chia thửa trả lời *"đất chia thế nào"*, cung cong trả lời *"một ranh giới có hình gì"*. Mọi ranh
  giới BSP đều **thẳng băng** (đó là một nửa của cái vẻ "quy hoạch" còn sót lại), còn bộ sinh
  nan-quạt/bàn-cờ của ADR-059 thì **không có khái niệm thửa** nên không thể cho thửa to nhỏ khác
  nhau. Mỗi bên thiếu đúng thứ bên kia có.
  ⚠️ Nhưng ghép xong thì một mệnh đề ngầm bị phá: `cityPlan` xưa nay coi **một thửa LÀ hình chữ
  nhật** `(x0,y0,x1,y1)` mà phép chia đệ quy khai ra. Cho nhát cắt vồng lên thì con đường **ăn vào
  bên trong hình chữ nhật ấy**, và bài "thửa + đường = 144 ô" thủng — không phải vì một lỗi tính
  toán mà vì hai định nghĩa của chữ "thửa" bắt đầu nói về hai thứ khác nhau.
- **Phương án cân nhắc**:
  1. **Chỉ giữ ADR-059, bỏ chia thửa.** Loại: mất luôn thửa khác cỡ — đúng thứ Đàm nêu tên
     (*"không phải cứ 3x3 được, nó phải nhiều thứ và đa dạng hơn"*).
  2. **Chỉ giữ chia thửa, bỏ cung cong.** Loại: mất đường lượn và giao lộ thật, tức quay lại đúng
     câu Đàm đã bác ở Phase 19 (*"nó chỉ là những đường thẳng"*).
  3. **Ghép, và kẹp cung cong lại cho nó đừng ăn vào thửa** (giữ định nghĩa thửa = hình chữ nhật).
     Loại: cái kẹp ấy phải chặt tới mức cung gần như thẳng, tức giữ được cái tên mà mất cái việc.
  4. **Ghép, và ĐỔI ĐỊNH NGHĨA của "thửa"** — chọn.
- **Lý do chọn**: hình chữ nhật là **Ý ĐỊNH**, con đường đã dựng mới là **SỰ THẬT**. Nên thửa nay
  là **tập ô**: mỗi ô không phải đường được giao cho hình chữ nhật **gần nhất** (`chuO` +
  `cellSet`). Phép giao ấy **phủ kín và không chồng lấn theo cấu tạo** — ô nằm trong một hình thì
  khoảng cách 0, các hình rời nhau nên không tranh chấp — nên bài "thửa + đường = 144" không thể
  thủng lại vì một lý do hình học. Hình chữ nhật vẫn được giữ, nhưng chỉ để trả lời ba câu về Ý
  ĐỊNH (*"thửa này sâu bao nhiêu" · "tâm nó ở đâu" · "nó có mỏng hơn `minSide` không"*); mọi câu
  hỏi ở cấp Ô đều hỏi `cells`.
  ⚠️ Và đây **không phải một phép vá cho test hết đỏ**: một thửa có mép cong thì khu nhà bên trong
  nó thôi là một hình chữ nhật đều đặn — tức nó chính là thứ chỉ thị đòi.
- **Giải pháp**:
  - `buildCityPlan(era)` (ADR-066) quyết **CHỖ CẮT**; mỗi nhát cắt gọi `arcTrace` (ADR-059) để lấy
    **HÌNH DẠNG** của nét cắt ấy, kèm `crossings` — tim đường cắt qua mỗi ranh giới ô ở đâu, chuẩn
    hoá `[−1, 1]` — thứ mà `roadPath.boundaryBend` đọc để mặt đường **đọc ra là cong** thay vì một
    bậc thang.
  - **Độ vồng có TRẦN, và trần ấy là một QUAN HỆ**: `maxDev` = phần đất DƯ của bên hẹp hơn sau khi
    đã chừa đủ `minSide`; dư 0 ⇒ cắt thẳng, không ngoại lệ. Cộng `BOW_MAX_SHARE = 0.25` — một cung
    không bao giờ được vồng quá một phần tư chính chiều dài của nó (vồng 3 ô trên nhát cắt dài 12 ô
    là một con phố cong; vồng 3 ô trên nhát cắt dài 4 ô là một nhát chém chéo). Bản đầu viết
    `Math.min(..., 2)` — đúng bẫy Phase 7D, vừa quá rộng cho nhát ngắn vừa quá chặt cho nhát dài.
  - `buildRoadPlan` cùng năm bộ dựng khung của ADR-059 (nan quạt, bàn cờ, xương cá, vành đai, hữu
    cơ) **bị xoá**: chúng trả lời câu *"đất chia thế nào"* bằng một đường khác, và giữ cả hai là
    giữ hai nguồn sự thật cho một đại lượng. Ba hàm còn sống của `roadPlan.js` (`arcTrace`, `gom`,
    `vaLienThong`, `tiaMangDuong`) đều thuộc tầng **hình dạng**, không thuộc tầng bố cục.
  - `networkStyle.js` (BẢNG) nay có 8 trục, trong đó `parcels`/`sizeVary`/`minSide` là của tầng bố
    cục còn `bow`/`wiggle`/`loops` là của tầng hình dạng. Đo lại toàn bộ ở bảng CUỐI CÙNG: quần thể
    ô nhà dân **476** (đi từ 371 → 432 → 476), **2.370** khối, chi tiết mái giữ **431/476 = 90,5%**.
  - **Đánh số lại cho hết trùng**: số của `main` giữ nguyên nghĩa; entry của nhánh này đổi
    ADR-057 → **ADR-066** (chia thửa) · ADR-056 → **ADR-061** (khung hình) · ADR-054 → **ADR-062**
    (`monolith`) · ADR-055 → **ADR-063** (che khuất môi trường); `TECH_DEBT #79` → **#89**,
    `#80` → **#90**. ⚠️ Vì vậy thứ tự VẬT LÝ của file này không còn giảm dần đơn điệu ở đoạn
    059…053 — đó là dấu vết của lần hợp nhất, không phải một chỗ hỏng.
- **✅ ADR-007 — ĐÀM ĐÃ DUYỆT PHƯƠNG ÁN (a), ghi lại ở đây vì nó là một quyết định kiến trúc, không
  phải một chi tiết thi công**: chấp nhận **dời 75/75 công trình ĐÚNG MỘT LẦN**, và sau lần ship
  này bố cục mỗi kỷ **đóng băng vĩnh viễn**. Không dựng hai bộ sinh song song (một cho thành phố cũ,
  một cho thành phố mới) — hai bộ sinh là hai nguồn sự thật, và nguồn thứ hai sẽ trôi khỏi nguồn thứ
  nhất trong im lặng. ⚠️ **Từ ngày ship, đổi bộ sinh bố cục của một kỷ là một quyết định DI TRÚ,
  phải hỏi Đàm trước** — không phải một lần chỉnh tham số. Bất biến gốc của ADR-007 (*"chỉ thêm,
  không bao giờ dời"*) **vẫn phải xanh cho mọi mốc phiên 1…120 × 15 kỷ**, chỉ là nó được phát biểu
  lại cho đúng: bất biến ấy nói về **trong cùng một phiên bản bộ sinh**, không nói về hai phiên bản
  khác nhau của phần mềm.
- **Trade-off**: (a) mất 5 bộ dựng khung của ADR-059 — chúng đã được đo, đã ship, và bị xoá sau
  chưa tới một ngày; cái được là **một** nguồn sự thật thay vì hai. (b) Thành phố đã xây của Đàm
  dựng lại khác đi một lần. (c) Bảng số hiệu năng của Phase 19 trong `PERFORMANCE.md` **không tái
  lập được nữa** (lệnh trong đó gọi `buildRoadPlan`) — đã ghi đính chính tại chỗ thay vì xoá bảng,
  vì nó vẫn là bản ghi đúng của thời điểm nó được đo.
- **Ảnh hưởng**: `cityPlan.js` · `networkStyle.js` · `roadPlan.js` (xoá 5 bộ dựng) · `cityGrid.js` ·
  `dwellings.js` · `roadPath.js` · `scripts/archive/road-bend.mjs` (đổi nguồn sang `planRoadCells`).
  Bảy tài liệu phải gỡ xung đột. `TECH_DEBT` không mở mục mới, không đóng mục nào.
- **Điều kiện xem lại**: nếu sau này cần ranh giới **XIÊN** (Voronoi) thì đây là chỗ phải quay lại —
  và lúc ấy phải viết lại cả tầng dựng đường, vì `terrainMesh`/`streetCrossSection`/`carriagewayShape`
  chỉ biết ô vuông (lý do loại Voronoi ở ADR-066 vẫn còn nguyên giá trị).

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

## ADR-061 — Tách "đã MỜI" khỏi "đã XEM" để gỡ nốt ngoại lệ cuối của luật mức độ làm phiền

**Ngày:** 2026-08-27
**Trạng thái:** đã áp dụng. Không đảo ngược ADR nào — nó HOÀN TẤT ADR-060, đóng `TECH_DEBT #87`.

**Bối cảnh.** ADR-060 chốt: chặn màn hình chỉ dành cho bốn việc buộc phải QUYẾT ĐỊNH (lên kỷ ·
thăng hoa · khủng hoảng kỷ · thảm hoạ). Nhưng nó để lại đúng MỘT ngoại lệ, và ghi rõ lý do:
`checkWeeklyReport` vẫn tự mở `WeeklyReportModal` sáng thứ Hai. Ngoại lệ ấy không phải vì lười —
nó bị chặn bởi một khuyết tật ở tầng dữ liệu.

**Vấn đề.** `dismissWeeklyReport` ghi `lastWeeklyReportDate` ở MỌI lần đóng, và cùng một trường ấy
là thứ chặn `checkWeeklyReport` chạy lại. Tức một trường đang trả lời HAI câu hỏi khác nhau —
*"tuần này đã mời chưa?"* và *"Đàm đã xem chưa?"*. Chừng nào còn gộp thì đẩy bản tổng kết xuống một
toast 4 giây là **đổi một phiền toái nhỏ lấy một mất mát thật**: lỡ một cái toast = mất báo cáo của
cả tuần. Đây là lần thứ **BẢY** của khuôn *"một trường gánh hai việc"* (`storyHeight` · `roof` ·
bảng loài cây · `avenue` · vai màu `cloth2` · hồ sơ `{sides, rings}`), và lần đầu nó gánh hai việc
ở tầng DỮ LIỆU BỀN chứ không ở tầng hình.

**Phương án đã cân nhắc.**
- **(A) Cứ đẩy xuống toast, giữ nguyên một trường.** Rẻ nhất, và chính `TECH_DEBT #87` đã cấm: nó
  biến một phiền toái đo được thành một mất mát im lặng.
- **(B) Giữ hộp thoại tự bật, chấp nhận ngoại lệ vĩnh viễn.** Loại: một ngoại lệ là chỗ để ngoại lệ
  thứ hai bám vào (*"nếu báo cáo tuần được phép tự bật thì cái này cũng được"*), và luật mức độ làm
  phiền chỉ sống được khi không có ngoại lệ nào.
- **(C) Cho toast KHÔNG tự tắt, phải bấm mới mất.** Loại: đó là một hộp thoại đội lốt toast, và nó
  phá luật 4 giây mà `RewardToastHost` vừa dựng cho cả sáu kênh còn lại.
- **(D — đã chọn) Tách đôi trường, cộng một lưới an toàn KHÔNG hết hạn.**

**Giải pháp.** Hai trường bền, hai câu hỏi:
`lastWeeklyReportDate` = *đã MỜI tuần này* (ghi lúc `checkWeeklyReport` bật lời mời, để không mời
lại mỗi lần mở app) · `lastWeeklyReportSeenDate` = *đã MỞ bản tổng kết ra* (ghi lúc
`openWeeklyReport`). Toast hết 4 giây gọi `dismissWeeklyReportToast`, thứ **chỉ tắt lời mời và
không ghi ngày nào**.

⚠️ **Ba luật đi kèm, đừng gỡ cái nào:**
1. **MỞ = đã xem; ĐÓNG = không ghi gì.** Ghi ở lúc đóng là dựng lại đúng cái bẫy cũ ở một chỗ khác.
2. **Cú mở ĐẦU TIÊN trong tuần rơi vào chế độ `'previous'`.** Không có luật này thì việc đổi sang
   toast âm thầm đổi luôn NỘI DUNG Đàm nhận được — nút ở thanh bên xưa nay mở `'current'` (tuần
   đang chạy dở), còn hộp thoại tự bật thì mở `'previous'` (tuần đã xong).
3. **Chấm ở nút "Báo cáo tuần" là LƯỚI AN TOÀN, không phải trang trí.** Nó do
   `lastWeeklyReportSeenDate` điều khiển nên nó KHÔNG hết hạn. Thiếu nó thì phương án (D) thoái hoá
   về phương án (A): một lời mời 4 giây có thể bị lỡ, và không còn dấu vết nào cho biết đã lỡ.

**Đánh đổi.** Thêm một trường vào dữ liệu bền (đi qua `normalizePersistedGameState`, ảnh chụp thăng
hoa và `partialize` lên Supabase) — giá phải trả để một trường thôi gánh hai việc. Máy cũ nạp lên có
`lastWeeklyReportSeenDate` rỗng ⇒ chấm sáng một lần và cú bấm đầu tiên đưa đúng bản tuần trước; đó
là hành vi ĐÚNG chứ không phải một ca cần migration.

**Ảnh hưởng.** ADR-060 nay không còn ngoại lệ nào: `blocking` ở `OverlayStack` chỉ còn chứa những
hộp thoại do Đàm bấm hoặc do bốn việc bắt buộc phải quyết định.

**Điều kiện xem lại.** Khi có mục thứ hai xin được tự bật — lúc đó câu hỏi không phải "cho nó bật
không" mà là "nó có buộc phải quyết định gì không".

**Khoá bằng test.** `src/store/gameStore.weeklyReport.test.js` (9 bài, chạy store THẬT với đồng hồ
đóng băng ở một thứ Hai giờ VN, có bài đối chứng khẳng định mốc ấy đúng là thứ Hai). Bảy phép thử
ngược đều đỏ đúng bài dự kiến — trong đó có phép dựng lại chính khuyết tật cũ (toast hết giờ cũng
ghi "đã xem") và phép bỏ luật `'previous'`.

**⚠️ BỔ SUNG CÙNG NGÀY — LƯỚI AN TOÀN PHẢI CÓ MẶT TRÊN CẢ HAI NỀN TẢNG, KHÔNG CHỈ DESKTOP.**
Bản đầu của quyết định này đặt cái chấm "chưa xem" ở **thanh bên desktop**, mà thanh bên là
`hidden md:flex`. Đi đọc lại toàn bộ đường vào mới thấy điều làm hỏng cả lập luận: **trước ADR
này, iPhone KHÔNG có nút nào mở báo cáo tuần** — nút duy nhất nằm đúng ở cái thanh bên ấy. Nghĩa
là trên iPhone, hộp thoại tự bật không phải cách báo cáo *xuất hiện*, nó là cách báo cáo *tồn
tại*; bỏ nó đi mà lưới an toàn lại nằm ở nền tảng kia thì trên thiết bị Đàm dùng nhiều nhất, lỡ
một cái toast 4 giây vẫn là mất báo cáo cả tuần — đúng thứ ADR này sinh ra để tránh.

⇒ Đã thêm mục **"Báo cáo tuần" vào menu "Thêm" trên điện thoại**, mang cùng cái chấm
`weeklyReportUnseen`. Đây là **điều kiện an toàn của quyết định, không phải một tiện ích**: gỡ nó
ra thì ADR-061 trở lại thành một hồi quy, và là hồi quy im lặng (build xanh, lint sạch, mọi bài
test khác xanh). Khoá bằng `rewardToastWiring.test.js` — bài test đòi cả lối vào lẫn cái chấm ở
CẢ HAI thanh điều hướng.

**Bài học chung:** khi gỡ một cơ chế và thay bằng "một lưới an toàn", hãy liệt kê **mọi đường vào
hiện có** trước — một lưới chỉ căng ở một nền tảng thì nó không phải lưới, nó là một lời hứa đúng
một nửa. Cùng họ với luật đã ghi ở `appNavigation.test.js`: *nối một chỗ quên một chỗ — mà iPhone
mới là chỗ Đàm dùng nhiều nhất.*


---

## ADR-061 — Khung hình lùi ra tới mức TỐI THIỂU đủ để không cắt công trình nào; và cái trần 1,35 cũ và lời hứa "không cắt" là hai thứ KHÔNG THỂ CÙNG ĐÚNG

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 19 VIỆC 5 — Đàm yêu cầu *"nóc nhà thôi bị mép khung cắt"*, kèm ràng buộc rất
  hẹp: sửa trong `orbit.js`, **giữ `distance = gridSize × factor`, chỉ nới `factor`**, nghiệm thu
  bằng ẢNH. Đây là `TECH_DEBT #24`, mở từ Phase 7B.
- **Vấn đề**: `orbit.test.js` có một bài tên *"KỶ THẤP GIỮ NGUYÊN KHUNG SÁT"* đòi `factor ≤ 1,35`,
  đặt ở Phase 5A với lý do đúng đắn *"đừng thu quá xa rồi bị mờ"*. Đo ra thì **13/15 kỷ cần ≥ 1,47**
  và kỷ 8 cần **1,88** mới không cắt công trình nào. Tức cái trần ấy và lời hứa "không cắt" **không
  thể cùng đúng** — và chính cái trần là thứ đã ĐẺ RA `TECH_DEBT #24`, chứ không phải một khuyết
  tật nào khác. Một cái trần được đặt khi thành phố còn thấp, rồi ở lại sau khi ADR-052 chia ô
  thành khu phố và nhà cao lên: đúng hình dạng ADR-019 (*một kết luận đúng hết đúng vì tiền đề của
  nó bị gỡ ở một phase khác*).
- **Phương án cân nhắc**:
  1. **Giữ trần 1,35, chấp nhận cắt.** Loại: đó là chính cái Đàm yêu cầu sửa.
  2. **Nới trần lên 1,88 cho cả 15 kỷ.** Loại: kỷ 1 chỉ cần 1,307, ép nó ra 1,88 là bắt thành phố
     nhỏ nhất chịu cái giá của thành phố lớn nhất — và một trần chung là đúng bẫy Phase 7D mà
     ADR-028 đã gỡ một lần cho ngân sách lệnh vẽ.
  3. **Nâng `target.y` (chĩa camera lên) thay vì lùi ra.** Loại — và loại bằng SỐ, không bằng lý
     lẽ: đo mép nào là mép sát nhất ở cả 15 kỷ thì **mép TRÊN không bao giờ là mép quyết định**
     (DƯỚI 7 kỷ · TRÁI 6 · PHẢI 2). Cái ràng buộc là hai bên hông và mép dưới, mà chĩa lên/xuống
     thì không chữa được mép hông.
  4. ⭐ **Mỗi kỷ một `factor` RIÊNG, bằng đúng khoảng cách TỐI THIỂU để biên mép còn `FRAME_FIT_MARGIN`**
     — chọn. Tìm bằng chia đôi 40 bước trên [0,8; 4,0], có nhớ kết quả.
- **Lý do chọn**: nó biến một con số VIẾT TAY thành một con số ĐO ĐƯỢC. Bằng chứng nó tối thiểu
  thật: **14/15 kỷ ra biên đúng `0,0400` = sàn**, không dư một li; chỉ kỷ 15 dư (0,0736) vì nó bị
  một sàn KHÁC trói (khoảng lùi theo `massScale`), và ngoại lệ ấy được ghi **tường minh đếm được**
  (`assert.deepEqual(DU_DIA, [15])`) theo đúng khuôn `TECH_DEBT #44` — kỷ thứ hai dư thì đỏ, mà kỷ
  15 hết dư cũng đỏ.
- **Trade-off — VÀ ĐÂY LÀ PHẦN PHẢI ĐỌC, KHÔNG ĐƯỢC BỎ QUA**: hệ số trung bình đi từ nền 1,18 lên
  **1,626**, tức thành phố đứng xa hơn ~38% và chiếm khoảng **53% diện tích khung** so với trước.
  Cái giá ấy hiện ra ở đúng một chỗ đo được: **trục CHẶNG NGÀY của bản quét tụt 14,39 → 11,33**,
  xuống DƯỚI ngưỡng mắt 12 — vì các dải đo là phân số CỐ ĐỊNH của ô, nên thành phố nhỏ lại thì mỗi
  dải bị pha loãng thêm nền trời và nền đất (đúng hình dạng `TECH_DEBT #22`). Đã tách một biến để
  chứng minh: cây mã có đủ VIỆC 1+2+3+4 nhưng **hoàn tác riêng `orbit.js`** ra **14,23** — tức bốn
  việc kia cộng lại chỉ tốn 0,16, còn **2,90 là của riêng phép lùi này**. Và phép lùi KHÔNG rút
  ngắn được: hạ biên an toàn từ 4% xuống 0% chỉ lấy lại 3,3% khoảng cách.
- **Ảnh hưởng**: đóng `TECH_DEBT #24`; mở `TECH_DEBT #89` (trục chặng dưới ngưỡng). Cặp đôi này là
  một **quyết định của Đàm**, không phải của tôi — hai thứ anh đã yêu cầu đang xung đột nhau, và
  cách duy nhất sai là lặng lẽ chọn hộ rồi nới ngưỡng (phễu Phase 9A).
- **Điều kiện xem lại**: khi trục chặng được nâng lại bằng cần gạt THẬT (bầu trời lúc 6h so với
  15h — xem `TECH_DEBT #89`), hoặc khi Đàm chốt hướng.

---


## ADR-060 — MỘT ngôn ngữ hình cho mọi phần thưởng, và một luật MỨC ĐỘ LÀM PHIỀN có phân tầng

**Ngày:** 2026-08-27
**Trạng thái:** đã áp dụng. Không đảo ngược ADR nào.

**Bối cảnh.** App có bảy đường trao thưởng: `LootDropModal` · `LevelUpModal` · `AchievementToast` ·
`DailyMissions` · `PrestigeModal` · `EraCrisisModal` · `WeeklyReportModal`. Mỗi đường tự chọn cách
vẽ và tự chọn màu, và điều đó không dừng ở "mỗi file một kiểu": **riêng `LootDropModal` đã có BA
hình cho ba loại thưởng trong CÙNG một hộp thoại** (`SupportRewardCard` · thẻ trong
`ResourceCascade` · `BonusPill`). Về màu thì có bốn từ vựng rời nhau cùng trả lời một câu hỏi
*"cái này quý tới đâu?"*: bốn "tone" của hộp thoại phần thưởng · ba bậc Tailwind ở `badgeStyles.js` ·
năm hạng huy chương của thành tích · một dòng chữ `tierLabel` của phiên. Đồng thời mọi phần thưởng,
lớn hay nhỏ, đều mở một hộp thoại toàn màn hình — **một phiên Pomodoro thường cũng chặn màn hình**.

**Vấn đề.** Hai thứ, và chúng độc lập với nhau:
1. **Không so được.** Không có cách nào nhìn hai phần thưởng đến từ hai đường rồi biết cái nào quý
   hơn, vì chúng không nói cùng một thứ tiếng.
2. **Làm phiền đồng loạt.** Nhận một hòn đá và lên một kỷ nguyên mới gây ra cùng một mức gián đoạn.

**Phương án đã cân nhắc.**
- **(A) Chỉ thống nhất MÀU, giữ nguyên bảy cách vẽ.** Rẻ nhất. Loại: nó chữa triệu chứng dễ thấy
  nhất mà không chạm vế thứ hai, và bảy cách vẽ vẫn tiếp tục trôi khỏi nhau.
- **(B) Một `RewardModal` chung cho tất cả.** Loại: nó làm vế 2 tệ hơn — chuẩn hoá mức làm phiền
  bằng cách nâng mọi thứ lên mức cao nhất.
- **(C) Đẩy MỌI thứ xuống toast, bỏ hẳn hộp thoại.** Loại: lên kỷ và khủng hoảng kỷ buộc phải
  QUYẾT ĐỊNH; một quyết định trôi qua trong 4 giây là mất quyết định.
- **(D — đã chọn) Một thẻ chung + phân tầng theo *"việc này có buộc phải quyết định không?"*.**

**Giải pháp.** Ba lớp, đúng khuôn ba lớp mà dự án đã dùng cho mái · tầng trệt · mặt đường · thực vật:
- `src/engine/rewardTiers.js` — **BẢNG**: thang độ hiếm duy nhất, **đúng bốn bậc**
  (thường `--muted` · tốt `--good` · hiếm `--warn` · huyền thoại `--accent`), kèm ánh xạ từ cả bốn
  từ vựng cũ. Sống ở `engine/` chứ không ở `components/shared/` (nơi `badgeStyles.js` ở) vì
  `rewardFeed.js` cần nó, mà **chưa từng có file nào trong `engine/` import từ `components/`**.
- `src/components/shared/RewardCard.jsx` — **HÌNH**: một thẻ duy nhất, chỉ vẽ, không đọc store.
- `src/engine/rewardFeed.js` — **LUẬT**: hàm thuần gom sáu kênh thưởng nhẹ thành một hàng đợi,
  cắt còn 3 thẻ + một dòng "và N phần thưởng khác".
- `src/components/RewardToastHost.jsx` — chồng toast ở góc; thay `AchievementToast.jsx` (đã xoá).

**Luật mức độ làm phiền** — chặn màn hình CHỈ dành cho: **lên kỷ · thăng hoa · khủng hoảng kỷ ·
thảm hoạ**. Mọi thứ còn lại đi qua toast, tự tắt sau 4 giây, bấm vào thì mở chi tiết.

**Trade-off.**
- Hộp thoại phần thưởng đầy đủ nay phải BẤM mới thấy ở phiên thường. Đổi lại 25 phút làm việc kết
  thúc bằng một thẻ trượt vào góc thay vì một tấm chắn.
- Một thẻ hẹp hơn hộp thoại ⇒ mô tả phải gói trong một dòng. Bố cục đã qua **hai lần bị ảnh dựng
  bác bỏ** trước khi đúng (xem chú thích trong `RewardCard.jsx`).
- Bốn bậc là ÍT so với năm hạng huy chương ⇒ bạch kim và kim cương dùng chung bậc đỉnh. Chấp nhận:
  một thang màu chỉ đọc được khi số bậc còn đếm được trong một cái liếc.

**Ảnh hưởng.**
- **KHÔNG đổi một luật tính thưởng nào.** Store vẫn bật `lootModalOpen` ĐỒNG BỘ y như cũ (ba bài
  test ở `completeFocusSession.test.js` khẳng định điều đó); toàn bộ thay đổi nằm ở tầng hiển thị,
  đúng điểm cắm mà `RewardSequence` đã chọn từ Phase 4′.
- **Ba kênh thông báo chết nay sống lại.** `relicNotification` · `rankUpNotification` ·
  `missionCompletedIds` được store ghi từ lâu mà **không màn hình nào đọc** — nghĩa là *nhận một
  di vật xưa nay không hiện gì cả*. Chồng toast là chỗ đọc đầu tiên.
- `dismissAchievementNotification` / `dismissMissionNotification` nhận thêm **id tuỳ chọn** (không
  truyền thì hành vi y hệt bản cũ): ba thẻ chồng nhau có ba đồng hồ riêng, nên thẻ thứ ba có thể
  hết trước thẻ thứ nhất và `slice(1)` sẽ bỏ nhầm.
- `LevelUpModal` không còn tự bật; nó thành phần CHI TIẾT mở khi bấm thẻ.

**Điều kiện xem lại.** Nếu Đàm nói toast dễ bị bỏ lỡ ⇒ xem lại 4 giây và số 3, KHÔNG xem lại việc
phân tầng. Nếu có mục thứ hai xin được tự bật ⇒ đọc `TECH_DEBT #87` trước.

---

## ADR-059 — MẠNG ĐƯỜNG là một trục bản sắc: mỗi kỷ tự sinh lấy tập ô đường của mình bằng những CUNG CONG, thay cho một bàn cờ chung cho cả 15 kỷ

**Ngày:** 2026-08-24
**Trạng thái:** đã áp dụng. **ĐẢO NGƯỢC NỬA SAU của ADR-058** (phần "độ lệch tim đường sinh bằng
nhiễu băm nhiều tần số" và trục `coil`/`ragged`), giữ nguyên nửa đầu (độ lệch là thuộc tính của
RANH GIỚI). Thay `ROAD_CELLS` — một hằng số cấp module đã sống từ Phase 6C.

### Bối cảnh

Đàm nhìn thành phố và nói hai lần, lần sau bác chính bản vá của lần trước:

> *"Hãy cải thiện đường đi, hiện tại nó chỉ là những đường thẳng, không giống đường ngoài đời,
> không uốn cong, và nó cũng như quy hoạch quá, các thời trước làm gì có quy hoạch đường thẳng tấp
> thế, và hiện tại ít đường và loại đường quá."*

> *"Không phải là kiểu đường lồi lõm, mà là dạng đường cong hay không cong, như thể là có giao lộ,
> đường uốn quanh ấy, hãy làm lại … hiện tại ở thời nguyên thuỷ hay các thời trước làm gì có đường
> dạng bàn cờ, hiểu không."*

Trước ADR này, `cityLayout.js` có một hằng số `ROAD_CELLS` dựng từ bốn trục `x, y ∈ {0, 4, 8, 11}`
— **một mạng bàn cờ 80 ô dùng chung cho cả 15 kỷ**, từ Göbekli Tepe 9500 năm trước tới Dubai.

### Vấn đề

ADR-058 đã cố chữa đúng lời phàn nàn ấy, và chữa **sai chỗ**: nó cho tim đường lượn nhẹ **bên
trong ô của nó**. Sai lầm bắt nguồn từ một suy luận của chính tôi mà Đàm đã bác:

> Đo được rằng **không thêm được ô đường** (80/144 ô đã là đường, 30 ô còn lại đúng bằng toàn bộ
> nhà dân), rồi từ đó suy ra rằng **không đổi được mạng đường**.

Hai mệnh đề ấy KHÔNG tương đương. Phép đo kia chặn cơ chế **THÊM**; nó không nói một chữ nào về cơ
chế **SẮP XẾP LẠI**. Hậu quả: nhìn từ trên xuống, cả 15 kỷ vẫn là 4 hàng × 4 cột cắt nhau vuông
góc — tức vẫn nguyên cái bàn cờ Đàm chỉ vào ngay từ đầu. Lượn vài phần trăm ô bên trong một ô
không đổi được điều đó, vì thứ mắt đọc ra là **HÌNH DẠNG CỦA CẢ MẠNG**, không phải mép của một đoạn.

Thêm một vấn đề thứ hai, cùng gốc: bảng `networkStyle.js` khi ấy có `coil` (bước sóng lượn) và
`ragged` (biến thiên bề rộng) — cả hai đều chỉ mô tả mép của một đoạn đường. `ragged` còn đẻ ra
đúng thứ Đàm gọi là **"lồi lõm"**: cùng một con đường chỗ nở chỗ tóp theo băm.

### Phương án đã cân nhắc

1. **Giữ bàn cờ, chỉnh mạnh tay hơn các trục cũ** (`coil` ngắn hơn, `bend` cao hơn).
2. **Thêm ô đường** cho mạng phong phú hơn.
3. **Mỗi kỷ tự sinh lấy tập ô đường** bằng cách nối các điểm mốc bằng những cung cong.

### Lý do loại bỏ

- **(1)** Đây chính là thứ vừa bị bác. Về mặt cấu tạo nó không thể đổi hình dạng mạng: `coil` và
  `bend` cùng lắm dịch mép đường vài phần trăm ô, còn tập ô thì đứng yên.
- **(2)** **ĐÃ ĐO TRẦN TRƯỚC KHI VIẾT MÃ** (luật Đàm chốt 2026-08-19): `ROAD_LINES = {0,4,8,11}`
  cho 80/144 ô là đường (55,6%); cộng 45 ô vùng kỳ quan thì **chỉ còn ~30 ô chứa được nhà dân**,
  và cả 15 kỷ đã đứng ở đúng cái trần ấy. Mỗi ô đường thêm vào là một khu nhà bị xoá.

### Giải pháp được chọn — phương án (3), khuôn ba lớp lần thứ MƯỜI

- **`src/engine/roadPlan.js`** (MỚI) = **BỘ SINH**: mỗi kỷ khai một danh sách **đường nối** giữa
  các điểm mốc (5 khu kỳ quan · tâm · các cửa ngõ ở mép lưới), mỗi đường nối được rasterise thành
  một **cung cong** (`arcTrace`) chứ không phải một đoạn thẳng. Hai cung cắt nhau ở đâu thì ở đó có
  **giao lộ** — chữ T, chữ Y, ngã năm — thay vì 16 ngã tư vuông góc đều tăm tắp.
- **`city3d/networkStyle.js`** = **BẢNG 15 kỷ × 6 trục**: `plan` (grid/axial/organic/terrace/radial)
  · `bend` · `arms` · `loops` · `tangle` · `diagonal`. Bỏ hẳn `coil` và `ragged`.
- **`city3d/roadPath.js`** = **HÌNH**: nay chỉ TRA BẢNG `crossings` mà `arcTrace` ghi ra, không
  sinh ra đường lượn nào của riêng mình.
- **`cityLayout.js` · `terrain.js` · `dwellings.js` · `cityMoment.js`** = chỉ ĐỌC.

**Năm kiểu khung**, mỗi kiểu trả lời *"ở nước ấy thời ấy, con đường mọc ra từ ĐÂU?"*: bàn cờ
(Trường An · Manhattan · Singapore · siêu ô phố Xô Viết) · một xương sống (Deir el-Medina · đường
rước thành Ur · trục Sheikh Zayed) · mạng rối (Çatalhöyük · phố cổ Hà Nội · Firenze · Edo) · nan
quạt + vòng thành (Đức trung cổ · Paris) · thềm theo đường đồng mức (Alfama · đồi Pennine).

### Ba điều KHÔNG được làm sai, và cả ba đã trả giá trong chính phiên này

**(a) MỘT KHỐI 2×2 TOÀN ĐƯỜNG KHÔNG PHẢI MỘT CON ĐƯỜNG — NÓ LÀ MỘT CÁI SÂN LÁT.** Mỗi cung được
rasterise ĐỘC LẬP, nên hai cung chạy gần song song cách nhau một ô sẽ tô kín cả dải giữa chúng. Đo
trên bản nháp: **13/15 kỷ có mảng 2×2**, và ở kỷ 13 thì **92% số ô đường nằm trong một mảng như
thế** — nửa dưới thành phố là một vũng bê tông liền. Đây **cùng họ với thứ Đàm đã bác**, chỉ ở một
cấp khác: thứ làm mắt đọc ra "phố" không phải bản thân mặt đường mà là **ĐẤT HAI BÊN NÓ**. Vá bằng
`tiaMangDuong` — bỏ dần những ô vừa nằm trong mảng 2×2 vừa bỏ đi được mà mạng vẫn liền. Sau khi
tỉa: **0–4 khối mỗi kỷ**.

**(b) VÀNH ĐAI KHÔNG ĐƯỢC TỈA.** Bản đầu của phép tỉa ăn cả `tier: 1`, và nó ăn mất chính những
cái vòng: kỷ 5 (Đức, khai `loops: 1`) đi từ 5 chu trình độc lập xuống **0** — cả thành phố thành
một cái CÂY, trong khi bảng khai rành rành là có tường thành. Đúng bẫy `MIN_STONE` (Phase 9D).
Lý lẽ để chừa: một mảng 2×2 sinh ra vì hai cung **tình cờ** chạy sát nhau, còn vành đai là một cấu
trúc **có chủ đích**.

**(c) MỘT KHÚC CUA KHÔNG PHẢI MỘT NGÃ TƯ.** Bản đầu gán vai ĐẠI LỘ cho mọi ô vừa có hàng xóm ngang
vừa có hàng xóm dọc — một luật mượn từ Phase 6C, đúng cho mạng BÀN CỜ nơi ngang-và-dọc chỉ xảy ra ở
chỗ hai trục cắt nhau. Trong một mạng CONG thì gần như mọi ô đều là một khúc cua, nên luật ấy biến
cả mạng thành đại lộ (kỷ 5: 105 ô thì gần hết mang vai đại lộ).

### Trade-off — cái giá đã trả, nói thẳng

- ⚠️ **MẤT LỜI HỨA TƯƠNG THÍCH NGƯỢC "THÀNH PHỐ ĐÀM ĐANG CÓ KHÔNG TỰ SẮP XẾP LẠI"** (Phase 6C).
  Mạng đổi thì thứ tự mở đường đổi — không có cách nào vừa đổi mạng vừa giữ nguyên thứ tự của mạng
  cũ, mà đổi mạng chính là thứ Đàm yêu cầu. Thứ CÒN giữ được là **luật xếp**: `tier` sắp trước mọi
  thứ khác, nên ở mỗi kỷ vành đai vẫn mở sau cùng (thành phố lớn từ trong ra ngoài).
- **Số ô đường đổi theo kỷ** (29 … 83, trước là 80 cho mọi kỷ) ⇒ `ROAD_CELL_COUNT` thôi làm MẪU SỐ
  và chỉ còn dùng để cấp phát bộ đệm; mọi chỗ hiện tiến độ phải hỏi `roadCellCount(era)`.
- **Bốn kỷ có mạng đường là một CÂY** (không đường vòng nào): 1 · 2 · 8 · 15. Cả bốn đều đúng lịch
  sử và được **đếm tường minh** trong test.
- **Hai kỷ không có vành đai** (1 · 2) — cũng đếm tường minh.

### Ảnh hưởng

- **ADR-007 KHÔNG bị đụng**: vị trí 5 kỳ quan suy từ `wonderAnchor(bpId, rank)`, chỉ phụ thuộc
  `bpId` — có test khoá bằng cách gọi kèm dữ liệu rác.
- **Mặt tiền kỳ quan TỐT LÊN**: mạng bàn cờ cũ để **2/75** kỳ quan không có ô đường kề bên; mạng
  mới là **0/75** (nhờ nhánh cụt dẫn vào).
- `city3d/terrain.js` san cao độ theo mạng đường ⇒ mạng **phải là hàm thuần của `era`**; có test
  gọi kèm `sessionCount`/`built` rác và đòi kết quả y hệt.
- Kỷ 10 (Manchester) phải nâng `tilt` 0,26 → 0,36 vì phép đếm "một bậc thềm nuốt quá 60% mặt ĐẤT"
  nay chạy trên một tập ô đất khác. Lý do lịch sử có thật, không phải nới ngưỡng: kênh Rochdale
  phải qua **9 âu thuyền trong 1,6 km** giữa lòng thành phố.

### Điều kiện xem lại

Nếu lưới 12×12 được nới ra, hoặc nếu có ai muốn mạng đường **đổi theo tiến độ** (mở dần theo hình
dạng chứ không theo thứ tự): cả hai đều đụng vào bất biến cao độ mặt đất, phải đọc lại mục "Ảnh
hưởng" trước khi làm gì.

---

## ADR-058 — TIM ĐƯỜNG là một trục bản sắc, và độ lệch của nó là thuộc tính của RANH GIỚI chứ không phải của Ô

**Ngày:** 2026-08-24
**Trạng thái:** đã áp dụng. Mở rộng `streetStyle.js` (Phase 9D / ADR-025) sang chiều DỌC con đường,
và thêm hạng đường thứ BA. Không đảo ngược quyết định nào.

### Bối cảnh
Đàm: *"đường đi hiện tại chỉ là những đường thẳng, không giống đường ngoài đời, không uốn cong, và
nó cũng như quy hoạch quá — các thời trước làm gì có quy hoạch đường thẳng tấp thế, và hiện tại ít
đường và loại đường quá. Hãy tìm hiểu các kỷ có bao nhiêu đường, hình thái, .. và build nó + mở
rộng đường đi"*.

### Vấn đề
Lời ấy chỉ vào một chỗ **TRỐNG trong kiến trúc**, không phải một con số sai. `streetStyle.js` đã mở
mười trục bản sắc cho **MẶT CẮT NGANG** của con đường — rộng bao nhiêu, lát bằng gì, viên to cỡ nào,
có bó vỉa không. Nhưng cả mười trục ấy nói về *một lát cắt*, mà một lát cắt thì không có hình dạng
theo chiều dọc. **TIM ĐƯỜNG chưa bao giờ là một trục bản sắc**: `terrainMesh.js` dựng mọi lòng
đường **chính giữa ô lưới**, nên Göbekli Tepe 9500 năm trước và Dubai hôm nay dùng chung một tấm
lưới bàn cờ hoàn hảo.

Cộng thêm một lỗ hổng thứ hai đo được: `streetCrossSection(style, isLane)` nhận một **boolean**, nên
cả mạng đường chỉ có đúng HAI bề rộng — trong khi **đường vành đai chiếm 36/80 ô (45% cả mạng)** và
được vẽ y hệt ngõ phố.

### Phương án đã cân nhắc

**(A) Thêm ô đường** — cách hiểu đen của "mở rộng đường đi". **BỊ LOẠI BỞI PHÉP ĐO TRẦN**, chạy
TRƯỚC khi viết dòng mã nào (luật của dự án): 80/144 ô đã là đường (55,6%), 45 ô hứa cho kỳ quan,
**chỉ còn 30 ô trống** — và đúng 30 ô ấy là `DWELLING_PLOTS`, tức TOÀN BỘ nhà dân. Mỗi ô đường thêm
vào là một khu nhà bị xoá. Đây chính xác cái trần Phase 14 §1(3) đã đụng khi Đàm đòi "thêm nhà".

**(B) Đổi mạng đường theo kỷ** (kỷ này lưới, kỷ kia ngoằn ngoèo bằng cách đổi Ô NÀO là đường) — bị
loại vì nó dời nhà dân giữa các kỷ và đổi cao độ địa hình, tức đụng vào một vùng đã có ADR-007 canh,
để đổi lấy một hiệu quả mà phương án (C) cho gần như miễn phí.

**(C) ĐÃ CHỌN — không thêm ô, đổi thứ NẰM TRONG một ô.** Con đường trong ô được phép **lệch khỏi
tâm ô và lượn**, bề rộng **thắt/phình dọc đường**, và hạng đường lên **ba**. Cùng số ô, cùng số
lệnh vẽ.

### Giải pháp
Khuôn ba lớp lần thứ **MƯỜI** (sau `vernacularRoof` · `floraStyle` · `streetStyle` ·
`groundFloorStyle` · `roofStyle` · `settingStyle` · `hinterlandStyle` · `blockStyle` · `humanStyle`):

- **BẢNG** `city3d/networkStyle.js` — 15 kỷ × 4 trục (`plan` · `bend` · `coil` · `ragged`),
  `country` khoá cứng vào `eraStyle.js` bằng test.
- **HÌNH** `city3d/roadPath.js` — `boundaryBend` · `buildRoadPaths` · `roadHalfWidth`.
- **NGƯỜI ĐỌC** `terrainMesh.js` (dựng mặt đường) và `residents.js` (cư dân đi bộ) — chỉ ĐỌC.

**Luật sống còn: độ lệch là thuộc tính của RANH GIỚI, không phải của Ô.** Ô (x,y) và ô (x+1,y) cùng
hỏi `boundaryBend(era, 'u', x+1, y)` cho chỗ giáp của chúng, nên chúng **không thể** lệch nhau —
không phải "rất khó lệch". Đây đúng phép `min` đối xứng đã xoá bậc bề rộng ở Phase 12 (ADR-031),
dùng lại cho độ lệch. Đo: **lệch 0 tuyệt đối trên 1.320 cặp ô kề nhau × 15 kỷ**.

**Hạng thứ ba (`ring`) không có vỉa hè** — và đó là một sự thật đô thị, không phải một mẹo để nó
vừa ô: đường chạy vòng ngoài rìa là đường ĐI QUA, không phải đường ĐI DẠO, nên không ai lát vỉa hè
(từ Zwinger trung cổ tới vành đai cao tốc hôm nay). Nó cũng chính là thứ cho hạng này một dáng riêng
mắt đọc ra ngay, độc lập với bề rộng.

### Trade-off đã chấp nhận, nói thẳng
- **Đường càng rộng càng KHÔNG THỂ lượn** — chỗ trống để lượn là `0,5 − nửa bề rộng − vỉa hè`. Ở kỷ
  hiện đại, lòng đường cộng vỉa hè đã lấp gần trọn ô. Đây **không phải khuyết tật**: nó khớp lịch sử
  (lối mòn hẹp thì lượn, đại lộ Xô Viết thì thẳng) và nó là một ràng buộc HÌNH HỌC, không phải một
  con số chọn tay. Kết quả đo: **3/15 kỷ lượn rõ (≥ 0,25 lần bề rộng), 2 kỷ thẳng tuyệt đối theo
  chủ đích (4, 11), 10 kỷ lượn nhẹ.**
- Ngưỡng "0,25 lần bề rộng = mắt đọc ra được" **CHƯA được hiệu chuẩn bằng một phép dựng ảnh**; nó là
  một mốc làm việc, và phải nói rõ như vậy thay vì trình bày như một con số đã đo (`TECH_DEBT #83`).
- Diện tích mặt đường nhìn thấy được **giảm 8%** ở kỷ 6 — một phần do `widthJitter` thắt lại, một
  phần do đường lượn đi khuất sau nhà.

### Ảnh hưởng
Lệnh vẽ **KHÔNG đổi** ở cả 15 kỷ (mặt đường vẫn là MỘT khối, màu đi theo đỉnh). Tam giác mặt đường
+52% ở kỷ 6 và +63% ở kỷ 9, trên một thành phần chiếm ~0,8% cảnh ⇒ không đo được ở tổng.
ADR-007 nguyên vẹn: không ô nào xê dịch, `roadCellCandidates()` không đổi một byte.

### Điều kiện xem lại
Nếu một kỷ nào đó cần lượn mạnh hơn cái trần hình học cho phép, thì cần gạt ĐÚNG là bề rộng lòng
đường hoặc vỉa hè của kỷ ấy trong `streetStyle.js` — **không phải** nới `EDGE_KEEP` hay bỏ phép kẹp,
vì cả hai đều dẫn thẳng tới mặt đường lấn sang thửa đất bên cạnh.

## ADR-057 — Chân giải bằng KHỚP NGƯỢC: đặt bàn chân trước, suy ngược ra góc đùi và góc gối

**Ngày:** 2026-08-24
**Trạng thái:** đã áp dụng — **đảo ngược nửa sau của ADR-056** (bỏ trường `knee` và định lý `sin²`),
vì TIỀN ĐỀ của nó đã bị gỡ. Đồng thời **đóng `TECH_DEBT #82`**.

### Bối cảnh
Đàm xem thành phố sau ADR-056 rồi ra một chỉ thị gộp nhiều việc: *"làm sao cho con người có nhiều
góc bo tròn, **cử động khớp thật**, **có thể vẽ thêm tam giác/khối mỗi ngưới tới lúc nó bo tròn**,
3D nhiều hơn, tăng thêm kiểu đi, chuyển động thật và ít mặt phẳng hơn"*. Hai vế in đậm là hai lệnh
thu hồi tường minh: (a) *khớp thật* bác chính cái mẹo của ADR-056; (b) *vẽ thêm tam giác/khối* thu
hồi trần **11 khối mỗi người** mà chính Đàm đặt ra trước đó.

### Vấn đề
ADR-056 chữa dáng com-pa bằng cách **rút ngắn chân lúc đưa** (`stretchOf`), vì một mesh cứng không
gập được. Cái mẹo ấy đúng trong khuôn khổ của nó và đắt về mặt khái niệm:

- Chân vẫn là **một đoạn thẳng**. Mắt không bao giờ thấy một đầu gối, chỉ thấy một cái chân co giãn
  như ống lồng.
- Nó kéo theo cả một định lý (`knee ≥ 0,5`, hệ số phải là `sin²` chứ không phải `sin`) chỉ để bàn
  chân khỏi trượt — tức một ràng buộc phức tạp sinh ra để phục vụ một mô hình sai.
- Và nó **cấm ba chuyển động có thật**, ghi thành `TECH_DEBT #82`: hông không lắc ngang được, đai
  hông không nghiêng được, đai hông không xoay được. Cả ba đều bị cấm vì cùng một lý do: chúng làm
  bàn chân dịch chỗ, mà bàn chân là **KẾT QUẢ** của chuỗi khớp nên không ai giữ nó lại được.

### Phương án đã cân nhắc
1. **Giữ chân một khối, thêm một khối "bắp chân" trang trí gập theo một hàm sin riêng.** Rẻ nhất.
   Bác: hai khối chuyển động theo hai luật độc lập thì chúng rời nhau ở đúng chỗ đáng lẽ là khớp
   gối — đúng bẫy *"một luật hai công thức"*, và tệ hơn, cả hai công thức đều chạy nên không cái
   nào lỗi.
2. **Khớp thuận (forward kinematics): khai góc hông và góc gối theo pha bước, rồi tính ra bàn chân
   ở đâu.** Đây là cách hiển nhiên, và nó **giữ nguyên toàn bộ bệnh cũ**: bàn chân vẫn là kết quả,
   nên muốn nó đứng yên thì phải đi hiệu chỉnh ngược từng số hạng một. Thêm lắc hông là thêm một số
   hạng bù; thêm xoay đai hông là thêm một số hạng bù nữa. Mỗi chuyển động mới đẻ ra một phép bù,
   và `TECH_DEBT #82` sẽ không bao giờ đóng được.
3. **Khớp ngược (inverse kinematics): đặt bàn chân TRƯỚC, rồi giải ngược ra góc đùi và góc gối.**
   Đắt hơn về khái niệm (phải giải một tam giác bằng định lý hàm cosin) nhưng nó **lật ngược quan
   hệ nhân quả**, và mọi thứ khác rơi ra theo.

### Giải pháp đã chọn — phương án 3
`poseAt` mở đầu bằng đúng ba dòng đặt hai bàn chân trong KHÔNG GIAN THẾ GIỚI, rồi `solveTwoBone`
giải ngược. Hệ quả không phải một cái lợi mà là **bốn cái lợi cùng lúc**, và cả bốn đều *đúng theo
cấu tạo* chứ không phải *đúng nhờ hiệu chỉnh*:

- **Bàn chân đứng yên tuyệt đối** trong pha tiếp đất — đo được **4,86 × 10⁻¹⁷ ô** trên 210 tổ hợp
  (14 kiểu đi × 15 kỷ). Đó là sai số dấu phẩy động, không phải một dung sai.
- **Đai hông được phép lắc ngang, nghiêng, và xoay** — cả ba miễn phí, vì cái chân tự lo phần còn
  lại. `TECH_DEBT #82` đóng lại không cần một số hạng bù nào.
- **Trường `knee` và định lý `sin²` biến mất**, không phải vì chúng sai mà vì tiền đề *"mesh cứng
  không gập được"* đã bị gỡ (bẫy Phase 8C).
- **`reach` trở thành một bất biến đọc được**: tỉ số giữa khoảng cách hông→bàn chân và tổng chiều
  dài hai đoạn xương. Chạm 1 là chân duỗi thẳng đơ; vượt 1 là bàn chân nằm ngoài tầm với và phép
  giải buộc phải kẹp lại ⇒ trượt. Nó chỉ thẳng vào NGUYÊN NHÂN, còn "bàn chân trượt" chỉ là triệu
  chứng. Đo được: cao nhất **0,9928** ở kỷ 12 (`march`, sải chân dài nhất bảng).

Kèm theo, ba việc còn lại của chỉ thị:
- **Bo tròn**: bộ khuôn 7 → **9** (thêm `calf` cho cẳng chân, `flare` cho tà áo loe), và mọi khuôn
  không phải hộp đi từ 8 lên **12 mặt** cùng 3 tới 6 **VÀNH**. ⚠️ Số **vành** mới là thứ quyết định
  "nhìn có phẳng không", không phải số mặt — xem mục Bài học.
- **Khớp hai trục**: mỗi khớp nay có `a` (ngửa quanh trục ngang-màn-hình) và `b` (lắc quanh trục đi
  tới), ghép theo thứ tự cố định `Rx(b) · Rz(a)` ở cả tầng thuần lẫn tầng cảnh.
- **Bảng dáng đi 9 → 14 kiểu, 4 → 6 trục** (`lift · flex · sway · twist · headTrack · splay`).

### Trade-off
- **Giá phải trả**: +1 lệnh vẽ ở **cả 15 kỷ** (khuôn `calf` là một `InstancedMesh` nữa) và tam giác
  mỗi người đi từ 220…324 lên **1.616…1.928** (×6,4). Cư dân nay chiếm **16,3%…26,1%** tam giác
  cảnh, so với trần cũ 6%. Đây là cái giá Đàm đã cho phép tường minh, không phải một cái phễu.
- **Chưa đo lại mili-giây.** Hộp cát dựng bằng SwiftShader (bộ tô hình chạy trên CPU), mà luật của
  dự án là *"một con số đo trong hộp cát chỉ được dùng để so các trường hợp TRONG hộp cát ấy"*. Bốn
  căn cứ để tin là an toàn (dư 3,2 lần trên máy thật · 80% chi phí đi theo ĐIỂM ẢNH chứ không theo
  tam giác · cư dân không đổ bóng · lệnh vẽ chỉ +1) đều là suy từ phép đo CŨ trên MacBook của Đàm,
  không phải phép đo MỚI. Muốn xác nhận: `bash scripts/bench-macbook.sh`.
- **Phép giải phức tạp hơn**: `solveTwoBone` có một nhánh kẹp khi bàn chân ngoài tầm với. Nhánh ấy
  hôm nay **không bao giờ chạy** (0,9928 < 1), và đó là lý do phải có một bài test bơm `stride: 5`
  để chứng minh nó vẫn còn hoạt động — một nhánh chưa từng chạy là một nhánh chưa từng được kiểm.

### Ảnh hưởng
- `humanPose.js` viết lại hoàn toàn; `stretchOf` và `legFactorAt` bị xoá, `sceneGraph.js` bỏ theo.
- `human.js`: 11 → 16…18 khối, 3 → 11 khớp (thêm `pelvis`, `elbowL/R`, `kneeL/R`).
- Bảng ngân sách `MOC_LENH_VE` và `CANH_TAM_GIAC` đo lại toàn bộ, neo bằng Chromium ở 3 kỷ.

### Điều kiện xem lại
Nếu `bash scripts/bench-macbook.sh` trên máy Đàm cho ra một cảnh vượt **8 ms** (mức làm việc đã
chốt ở `PERFORMANCE.md`), thì cắt số vành của các khuôn xuống trước, đừng cắt số khớp — vành là
thứ mắt chỉ thấy khi nhìn gần, còn khớp là thứ thấy ở mọi khoảng cách vì nó đổi ĐƯỜNG VIỀN.

### Bài học rút ra
1. ⚠️ **Số VÀNH quyết định "phẳng hay không", không phải số MẶT.** Một khuôn hai vành cho ra ĐÚNG
   MỘT dải sáng dọc dù `sides` bằng 8, 12 hay 64 — vì cả 8 mặt bên đều là hình thang PHẲNG. Thứ
   sinh ra dải sáng thứ hai là một **ĐIỂM UỐN** trên đường sinh (thắt gối, eo, sườn lõm). Đọc một
   hồ sơ `{sides, rings}` thì phải hỏi **hai** câu riêng: *"nhìn từ trên xuống nó tròn tới đâu"* và
   *"nhìn ngang nó có gãy khúc không"*. Trộn hai câu ấy vào một chữ "mượt" là lần thứ **bảy** của
   *"một trường gánh hai việc"* trong dự án này.
2. ⚠️ **Đổi chiều nhân quả của một mô hình có thể xoá nhiều ràng buộc CÙNG LÚC.** Ba mục cấm của
   `TECH_DEBT #82` không được gỡ từng cái một — chúng biến mất cùng nhau, vì cả ba đều là hệ quả
   của việc bàn chân là ĐẦU RA. Khi một danh sách hạn chế dài ra mà mọi mục đều quy về cùng một câu
   *"vì X là kết quả chứ không phải đầu vào"*, hãy hỏi có đảo được X không, thay vì đi bù từng mục.
3. ⚠️ **Một cái trần do người dùng đặt ra thì chỉ người dùng thu hồi được, và khi họ thu hồi thì
   phải ghi lại NGUYÊN VĂN.** Trần 11 khối có một lý lẽ đúng (*"ở cỡ 18 px thì khối thứ 12 không
   đổi được điểm ảnh nào"*), nhưng lý lẽ ấy nói về khung TOÀN CẢNH, mà ADR-034 đã thêm lối đưa mắt
   tới gần từ lâu. Tiền đề đổi trước, lệnh thu hồi tới sau.
4. ⚠️ **Một bản vá đúng làm đỏ sáu bài test cũ, và KHÔNG bài nào đỏ vì mã hỏng.** Bốn bài đo một
   mô hình đã chết (`legFactorAt`, hệ số `sin²`, chân là một khối, trần 80 tam giác), hai bài đếm
   sai số khối vì cụm chân nay có 6 khối chứ không phải 4. Phản xạ sai nhất lúc ấy là nới ngưỡng
   cho hết đỏ. Ví dụ cụ thể: bài *"biên độ khớp có trần"* đòi góc đùi ≤ `asin(stride/4)` — một trần
   suy từ tam giác vuông của mô hình chân CỨNG. Có đầu gối thật thì đùi **phải** nghiêng nhiều hơn
   thế (đo được 57,3° so với 27,5° ở kỷ 1). Giữ nguyên con số ấy làm trần là dùng một bài test để
   hoàn tác một bản vá đúng; cách đúng là **đổi vai của nó thành SÀN**.

---

## ADR-056 — DÁNG ĐI là một trục bản sắc riêng, và bốn chiều chuyển động mới đều phải luồn qua ràng buộc "bàn chân không được trượt"

**Ngày:** 2026-08-24
**Trạng thái:** đã áp dụng

### Bối cảnh
ADR-053 cho cư dân bộ xương có khớp, ADR-055 cho họ hình khối tròn xoay. Đàm nhìn kết quả rồi ra
chỉ thị tiếp: *"Tiếp tục trau chuốt, ít ảnh phẳng hơn, tạo nhiều đặc trưng hơn, di chuyển mượt mà
hơn (nhiều kiểu di chuyển), mỗi kỷ phải tốt hơn, mỗi người phải ra dáng người hơn và không cử động
như robot, hình ảnh 3D hơn, đẹp hơn."*

### Vấn đề — HAI thứ, và chúng độc lập với nhau

**(1) "KHÔNG CỬ ĐỘNG NHƯ ROBOT" LÀ MỘT LỜI TỐ CÁO CHÍNH XÁC VỀ HÌNH HỌC, KHÔNG PHẢI MỘT CẢM GIÁC.**
Trước bản này, toàn bộ chuyển động của một cư dân nằm gọn trong **một mặt phẳng đứng dọc theo hướng
đi**: hai cái que xoay quanh hông, hai cái que xoay quanh vai, một cái nhún suy ra từ chân trụ. Ba
chiều chuyển động mà người thật có — **lắc ngang**, **vai xoay ngược hông**, **đầu gối co** — đều
bằng **0 tuyệt đối**, không phải "nhỏ".

Trong ba cái đó, cái đắt nhất là đầu gối, và lý do thì không phải thẩm mỹ mà là hình học: chân cứng
dài đúng `legLen` thì ở GIỮA pha đưa chân, hông đang cao đúng `legLen` (chân trụ thẳng đứng) còn
chân đưa cũng duỗi thẳng xuống `legLen` ⇒ **bàn chân ở đúng cao độ 0, tức nó quệt mặt đường**. Đó
chính là dáng đi compa của hình nhân đồ chơi.

**(2) `stride` · `walkSpeed` · `armSwing` CHỈ CHỈNH ĐƯỢC ĐỘ LỚN CỦA CÙNG MỘT CHUYỂN ĐỘNG.** Chúng
cho ra người bước dài hơn hoặc gấp hơn; chúng không cho ra một **CÁCH ĐI** khác. Người gánh nước,
người đội thúng, người lê chân trong tuyết và người tất bật trên vỉa hè Tokyo khác nhau ở chỗ hoàn
toàn khác, và không trục nào trong ba trục ấy diễn đạt nổi.

**(3) HÌNH KHỐI CỦA ADR-055 VẪN CÒN QUÁ THẲNG.** Mỗi khuôn khi đó có đúng HAI vành, mà với pháp
tuyến phẳng theo từng mặt thì hai vành cho ra đúng **một dải sáng** theo chiều dọc: tám mặt bên đều
là hình thang phẳng, sáng đều từ chân lên đỉnh. Bỏ hộp rồi mà mắt vẫn đọc ra "ống nhựa".

### Phương án đã cân nhắc

**A. Thêm khớp thật (tách chân làm đùi + cẳng, tay làm bắp + cẳng).** Đúng nhất về giải phẫu.
**Loại**: tốn 4 khối/người, đẩy 4 kỷ từ 11 lên 15 khối, vượt trần 11 mà Đàm chốt. Và trần ấy có căn
cứ đo được (*"ở cỡ 18 px thì khối thứ 12 không đổi được điểm ảnh nào"*).

**B. Một trường "biên độ nhún" trong bảng dáng đi**, để kỷ 6 nảy theo đòn gánh. **Loại sau khi đã
thử**: nó đẩy hông LÊN TRÊN chiều cao đứng yên, phá thẳng bất biến *"cái nhún luôn kéo xuống"* — mà
bất biến ấy đúng vì một lý do vật lý thật: mô hình này **không có cổ chân**, nên "nhón chân" là điều
nó không được phép giả vờ. Cái nảy nay diễn đạt bằng `headTrack` ÂM (thân trên nảy mạnh hơn hông),
cùng một hiện tượng nói bằng một đại lượng mà mô hình này có thật.

**C. Cho cả thân LẪN hông lắc ngang.** Đúng nhất về sinh cơ học. **Loại**: bộ khớp chỉ xoay quanh
MỘT trục (trước-sau), nên chân không dạng ra bù được ⇒ bàn chân trượt ngang 3 tới 4 điểm ảnh với
kiểu `roll`. Chỉ thân trên lắc; phần còn thiếu ghi ở `TECH_DEBT #82`.

**D. Cho đai hông xoay ngược cùng đai vai.** Đúng nhất. **Loại sau khi ĐO**: biên độ
`hipZ · sin(0,14) ≈ 0,0028 ô` = **0,2 điểm ảnh**, dưới ngưỡng mắt kể cả ở khung cận cảnh, trong khi
nó buộc phải thêm một số hạng bù vào chính cái luật chống-trượt cộng hai cái trần trong bài test.
Xoay riêng vai đã cho ra trọn vẹn độ xoay TƯƠNG ĐỐI — thứ mắt thật sự đọc.

### Giải pháp đã chọn

**(a) TRỤC THỨ 12 `gait`, KHUÔN BA LỚP LẦN THỨ MƯỜI.** `city3d/humanGait.js` = BẢNG 9 kiểu đi ×
4 trường thuần (`knee` · `sway` · `twist` · `headTrack`) → `humanPose.js` = CHUYỂN ĐỘNG →
`sceneGraph.js` = chỉ ghép ma trận. Mỗi kỷ khai một kiểu, buộc vào `country` và vào chính những
trường đã có (kỷ 2 `glide` vì `carry: 'pot'`; kỷ 6 `bounce` vì cái đòn gánh cũng là thứ ép
`stride: 1,34`).

**(b) ĐẦU GỐI GIẢ, VÀ GỌI ĐÚNG TÊN NÓ.** Khối cứng không gập được, nên chân **rút ngắn** giữa pha
đưa chân. Thứ mắt đọc ở 18 điểm ảnh không phải cái đầu gối mà là **QUỸ ĐẠO BÀN CHÂN**, và quỹ đạo
ấy thì đúng: bàn chân nay nhấc lên `legLen × (1 − knee)` = 5% (lê) tới 34% (đi đều) chiều dài chân.

⚠️ **Hàm rút chân phải là `sin²`, và đó là một ĐỊNH LÝ chứ không phải một lựa chọn cho mượt.** Góc
hông là `asin(off / (legLen·f))`, nên rút chân là NHÂN góc lên, mà góc hông có trần
`asin(stride/4)`. Với `s = sin(πu)`, cần `√(1−s²) ≤ f`. Dùng `f = 1 − c·s` thì gần hai đầu pha vế
phải tụt TUYẾN TÍNH còn vế trái tụt theo `s²/2` ⇒ bất đẳng thức **vỡ ngay sát mép, ở MỌI giá trị
`knee < 1`**. Dùng `f = 1 − c·s²` thì đặt `g(s) = 1 − c·s² − √(1−s²)`: `g(0) = 0`, `g(1) = 1 − c > 0`,
`g′(s) = s·(1/√(1−s²) − 2c) > 0` với mọi `c ≤ 0,5` ⇒ `g ≥ 0`. Đúng khi và chỉ khi **`knee ≥ 0,5`**,
và `isValidGaitProfile` từ chối thẳng mọi giá trị dưới đó.

**(c) HAI CHIỀU CHUYỂN ĐỘNG MỚI, CẢ HAI TỐN 0 KHỐI.** Lắc ngang chỉ áp cho thân/vai/đầu; vai xoay
ngược quanh trục đứng, diễn đạt bằng một độ lệch x đối xứng nên không cần thêm trục quay nào vào
đường ghép ma trận.

**(d) HỒ SƠ KHUÔN NHIỀU VÀNH, CỘNG KHUÔN THỨ TÁM `chest`.** Mỗi khuôn nay có ít nhất một **điểm đổi
chiều** (đầu gối thắt, eo thắt, sườn nón lõm) — chỗ GÃY giữa hai dải sáng mới là thứ mắt gọi là "có
khối". Thân phải tách ra khuôn riêng vì một cái chân thắt ở đầu gối rồi nhỏ hẳn ở cổ chân, còn một
cái thân thắt ở EO rồi nở lại ở hông: hai đường cong ngược nhau ở nửa dưới, dùng chung một hồ sơ thì
một trong hai phải sai. Lần thứ BẢY của họ *"một trường gánh hai việc"*, lần này thứ gánh hai việc
là một HỒ SƠ HÌNH HỌC.

### Trade-off
- **Tam giác mỗi người 220…324 → 476…628** (nặng nhất kỷ 8). Ca xấu nhất theo tỉ lệ là kỷ 1:
  **9,68%** cảnh. Trần tỉ lệ nâng **6% → 11%** — xem mục dưới, đây là chỗ phải đọc kỹ nhất.
- **Lệnh vẽ +1 mỗi kỷ** (khuôn `chest`): 11…17 → 12…18.
- **Trần 11 khối/người KHÔNG đổi.** Cái tăng là số tam giác mỗi khối, không phải số khối.
- `twist` **dưới ngưỡng mắt ở khung mặc định** (≈0,5 điểm ảnh mỗi vai). Nó dành cho khung cận cảnh
  (ADR-034), và điều đó được khai ngay trong chú thích của bảng theo đúng luật HỆ QUẢ 2b.
- Đai hông không xoay, thân dưới không lắc ⇒ `TECH_DEBT #82`.

### ⚠️ Vì sao được phép nâng trần tam giác 6% → 11%
Con số 6% **chưa bao giờ được buộc vào một phép đo thời gian nào** — nó là một trần tự đặt, và một
trần tự đặt rất dễ bị đọc thành một sự thật vật lý. Bốn căn cứ, xếp từ mạnh xuống yếu:
1. `PERFORMANCE.md` đo trên chính MacBook Air M3 của Đàm: cảnh chậm nhất **5,20 ms** trên trần
   16,67 ms ⇒ **dư 3,2 lần**; mô hình chi phí là *"0,87 ms cố định + 1,14 ms mỗi triệu điểm ảnh
   thật"* ⇒ **80% chi phí theo ĐIỂM ẢNH**. Bằng chứng trực tiếp: tam giác thành phố chênh **43%**
   giữa kỷ 3 và 11 mà thời gian chỉ chênh **2,4%**.
2. Cư dân **không đổ bóng** ⇒ không tốn gì ở lượt dựng bản đồ bóng, lượt đắt nhất mà hình học trả.
3. Đàm gỡ cổng hiệu năng 2026-08-21 và 2026-08-24 lại yêu cầu đúng hướng này.
4. Trần 11 KHỐI không đổi ⇒ không đụng vào luận cứ khả-đọc-ở-18-px.

⚠️ **GIỚI HẠN PHẢI NÓI THẲNG: chưa đo lại mili-giây.** Hộp cát chạy SwiftShader, mà luật dự án là
*"một con số đo trong hộp cát chỉ được dùng để so các trường hợp TRONG hộp cát ấy"*. Bốn căn cứ trên
đều suy từ phép đo CŨ trên máy thật. Xác nhận bằng `bash scripts/bench-macbook.sh` trên máy Đàm.

### Ảnh hưởng
`humanGait.js` (mới) · `humanShape.js` (8 khuôn, hồ sơ nhiều vành) · `humanStyle.js` (trục thứ 12) ·
`humanPose.js` (4 chiều chuyển động mới, `stretchOf`, `legFactorAt`) · `human.js` (thân và áo cắt
may dùng `chest`) · `sceneGraph.js` (áp hệ số rút chân vào ma trận) · bảng `MOC_LENH_VE`,
`MOC_TRUOC_HINH_KHOI`, `CANH_TAM_GIAC` đo lại.

### Điều kiện xem lại
- Nếu trần 11 khối được nới thì đầu gối THẬT (tách đùi/cẳng) là bước tiếp theo, và lúc đó `knee`
  đổi nghĩa từ "chân còn bao nhiêu phần" sang "gối gập bao nhiêu độ".
- Nếu bộ khớp có thêm trục quay thứ hai thì `TECH_DEBT #82` (hông lắc, hông xoay) mở lại được.
- Nếu Đàm đo `bench-macbook.sh` ra trên 8 ms thì phải xem lại trần 11%.

---

## ADR-055 — Cơ thể cư dân dựng bằng MẶT TRÒN XOAY khai bằng dữ liệu thuần, không bằng hình khối của three; và một ngân sách lạc hậu theo hướng SIẾT thì im lặng vĩnh viễn

**Ngày:** 2026-08-23
**Trạng thái:** đã áp dụng

### Bối cảnh
ADR-053 cho cư dân một bộ xương có khớp; ADR-054 chữa màu. Đàm nhìn kết quả rồi ra chỉ thị tiếp:
*"Tiếp tục tối ưu hoá model con người, làm cho chân thật nhất, ít ô vuông hơn và giống 3D hơn, làm
kỹ từng kỷ."*

Chữ **"ít ô vuông hơn"** mô tả chính xác thứ đang có: mọi bộ phận của mọi kỷ đều là
`new BoxGeometry(1, 1, 1)` co giãn bằng ma trận. Một cái đầu là hộp, một cái nón lá là hộp, một cái
vò gốm là hộp.

### Vấn đề — HAI thứ, và cái thứ hai mới là thứ giữ cho cái thứ nhất tồn tại lâu như vậy

**(1) MỘT KHỐI HỘP CHỈ CHO MẮT BA MẢNG SÁNG.** Với một nguồn sáng định hướng, một hộp lộ ra tối đa
ba mặt: đỉnh, một mặt hướng nắng, một mặt khuất. Ba mảng phẳng cạnh nhau đọc ra là **một tấm bìa
gấp**, không đọc ra là một cái khối — và mười một tấm bìa gấp xếp chồng lên nhau vẫn là bìa. Đây
không phải chuyện thiếu chi tiết (thêm hộp không chữa được), mà là chuyện **số mức chuyển sáng**.
Một lăng trụ 8 mặt cho **tám** mảng chuyển dần; tám mức chính là thứ mắt gọi là "tròn".

**(2) NGÂN SÁCH TAM GIÁC GHI TRONG `human.js` ĐÃ LẠC HẬU 5,4 LẦN — THEO HƯỚNG SIẾT.** Chú thích ở
đó tính trần "136 tam giác mỗi người" từ mẫu số *"kỷ 1 = 19.434 tam giác thành phố"*. Đo lại
(`scripts/scene-tri.mjs`): kỷ 1 nay là **104.958**, vì Phase 14 §1(3) làm mỗi ô thành một KHU PHỐ.
Cùng 6%, cùng `MAX_RESIDENTS = 28`, trần thật là **319 tam giác mỗi người**. Cơ thể lúc ấy tiêu 108.

⚠️ **Một trần lạc hậu theo hướng SIẾT thì không ai phát hiện.** Nó không làm gì hỏng — nó chỉ làm
một hướng đi tốt trông như đã bị cấm. Trần lạc hậu theo hướng nới thì sớm muộn có người kêu máy
giật; trần lạc hậu theo hướng siết thì **im lặng vĩnh viễn**. Đây là mặt còn lại của bài học
Performance Gate 2026-08-17, và nó chính là thứ đã giữ cơ thể ở dạng chồng-gạch lâu hơn cần thiết.

### Phương án đã cân nhắc

**A. Giữ hộp, chia nhỏ thêm.** Bắp tay tách khỏi cẳng tay, đùi tách khỏi cẳng chân, thêm bàn tay.
**Loại**, hai lý do độc lập: (i) Đàm đã chốt trần **11 khối/người** (*"ở cỡ 18 px thì hộp thứ 12
không đổi được điểm ảnh nào"*) và bộ hiện tại đã dùng 9–11; (ii) căn bản hơn, thêm hộp **không xoá
được cái phẳng, nó nhân bản cái phẳng** — hai mươi hai mảng sáng phẳng thay vì mười một.

**B. Dùng `SphereGeometry`/`CylinderGeometry`/`CapsuleGeometry` của three.** Rẻ nhất về công viết.
**Loại**, ba lý do: (i) `src/engine/city3d/` là tầng **THUẦN**, không được `import` three — đưa
hình khối của three vào đây là phá đúng ranh giới mà `flora.js` (ADR-020) và `streetStyle.js`
(ADR-025) đã dựng; (ii) các khối ấy sinh **normal nội suy mượt**, trong khi toàn bộ ngôn ngữ hình
ảnh của thành phố là **mặt phẳng cắt gọt** — một cư dân bóng mượt đứng giữa một thành phố lập thể
đọc ra là một dị vật, không phải một cải tiến; (iii) chúng không tham số hoá được theo *"thon về
phía nào"*, mà đó chính là thứ phân biệt một cái chân với một cái vò gốm.

**C. (CHỌN) Một bộ khuôn dựng bằng MẶT TRÒN XOAY, khai bằng dữ liệu thuần, normal PHẲNG theo mặt.**

### Giải pháp
`src/engine/city3d/humanShape.js` (thuần) — bảy khuôn, mỗi khuôn là một hồ sơ dữ liệu
`{sides, rings: [[y, r]]}`:

| khuôn | mặt | tam giác | dùng cho | vì sao |
|---|---|---|---|---|
| `box` | 4 | 12 | bàn chân · cặp/vali | đế phẳng, gót vuông — vuông là ĐÚNG ở đây |
| `prism` | 8 | 28 | búi tóc · da thú · vải quấn · cán giáo · bó củi | vật QUẤN hoặc VÓT tròn |
| `limb` | 8 | 28 | tay · chân · thân · áo khoác · âu phục | thon xuống dưới (đùi > bắp chân) |
| `flare` | 8 | 28 | áo chùng · áo choàng · khăn trùm · vò gốm | gấu BUÔNG thì xoè ra |
| `cone` | 8 | 14 | nón lá | có CHÓP |
| `dome` | 8 | 44 | đầu · mũ trụ · mũ vải mềm | sọ tròn, bẹt đỉnh, thon cằm |
| `hat` | 8 | 60 | mũ vành cứng | vành + chỏm là MỘT vật |

Ba quyết định con, mỗi cái đều có thể tự đứng làm một bài học:

**(a) "MẶT PHẲNG = 1,0", KHÔNG PHẢI "BÁN KÍNH = 0,5".** Bán kính đỉnh dựng bằng
`R = 0,5 / cos(π/sides)` và các đỉnh lệch pha nửa cung, nên **độ trải theo x và z đúng bằng ±0,5** —
y hệt hộp cũ. Nhờ vậy `partCornersAt`, `silhouetteSpanX`, `human-scale.mjs`, `humanPose.js` và mọi
con số hiệu chuẩn quanh chúng **không phải đổi một dòng nào**. Nếu chọn quy ước "bán kính = 0,5"
thì mọi khối co lại 7,6% và toàn bộ bảng tỉ lệ cơ thể phải hiệu chuẩn lại — một phép đổi đơn vị
âm thầm, đúng loại việc đẻ ra nợ. (`sides = 4` qua đúng công thức ấy tái tạo **chính xác** hộp đơn
vị, nên `box` không phải một nhánh đặc biệt mà là một trường hợp của cùng một luật.)

**(b) `shape` LÀ THAM SỐ BẮT BUỘC, không có mặc định.** Cho nó rơi ngầm về `'box'` thì mọi khối
viết sau này sẽ lặng lẽ quay lại làm viên gạch — đúng cái đã xảy ra với `vernacularRoof` khi nó còn
là trường tuỳ chọn (Phase 7C). Khai sai tên khuôn thì **ném ngay ở tầng thuần**.

**(c) MŨ VÀNH LÀ MỘT KHỐI, VÀ CÁI TRẦN CỦA ĐÀM ĐÃ ÉP RA CÂU TRẢ LỜI ĐÚNG.** Bản đầu dựng nó bằng
HAI khối (đĩa + chỏm) vì *"một cái mũ vành thì có hai phần"*. Nó đẩy kỷ 8 lên **12 khối**, vượt
trần 11, và bài test đỏ. Phản xạ sai là nới trần. Hỏi lại *"ngoài đời đây là mấy vật?"* — **một**;
và một cái mũ là một mặt tròn xoay liền khối, thứ `humanShape.js` dựng được. Kết quả **vừa giữ
trần, vừa đúng hình học hơn, vừa rẻ hơn 12 tam giác**.

`src/components/city/render3d/humanGeometry.js` biến hồ sơ thuần thành `BufferGeometry` **không
chỉ mục** với normal phẳng theo mặt. `sceneGraph.js` gom khối theo KHUÔN: mỗi khuôn một
`InstancedMesh` (một `InstancedMesh` chỉ mang được một hình học).

### Trade-off — nói thẳng cái giá
- **Tam giác mỗi người 108 → 220…324** (×2,0…×3,0). Trần thật là 319 với mẫu số của kỷ 1; ca xấu
  nhất đo đủ 15 dòng là **kỷ 1 = 5,40%** trên trần 6% ⇒ biên còn **10,0%**. Kỷ 8 tiêu nhiều tam
  giác nhất (324) nhưng mẫu số của nó lớn hơn nên tỉ lệ thấp hơn.
- **Lệnh vẽ: cư dân nay tiêu đúng `(số khuôn − 1)` lệnh thêm mỗi kỷ, tức +2…+5.** Trước bản này cả
  cơ thể là một khuôn duy nhất nên chi phí ấy bằng 0. Đây là một khoản chi có thật, và nó được
  chấp nhận theo đúng lời Đàm 2026-08-21 (*"không quan trọng hiệu năng, máy tôi là M3"*) — bảng
  lệnh vẽ nay là một CÁI CÂN, không phải một CÁI CỔNG.
- **"Ca xấu nhất là kỷ 1" thôi là một LẬP LUẬN, nay là một KẾT LUẬN.** Lý lẽ cũ (*"cư dân tốn một
  lượng CỐ ĐỊNH nên tỉ lệ cao nhất ở kỷ có mẫu số nhỏ nhất"*) đứng trên tiền đề "tử số cố định",
  mà từ bản này mỗi kỷ một cơ thể khác nhau. Nay phải **tính đủ 15 dòng** mới biết ca xấu nhất ở
  đâu. Kết quả vẫn là kỷ 1 — nhưng ta BIẾT thế chứ không SUY thế.

### Ảnh hưởng
- `humanShape.js` · `humanGeometry.js` MỚI; `human.js` không còn khối `box` nào ngoài bàn chân,
  cái cặp và mô hình `lowDetail`.
- `drawCallBudget.test.js`: hằng số `TAM_CO_DINH_KHO = 4` **sai +1 ở CẢ 15 KỶ** kể từ ADR-053 (nó
  gộp hai lưới cư dân làm một mà không ai sửa hằng số). Không lộ ra vì bài test so **một công thức
  với một bảng suy từ chính công thức ấy** — một cái gương, không phải một cái cân. Nay bảng được
  **neo vào ba phép đo Chromium độc lập** và phần cư dân đọc thẳng `humanShapesUsed(era)`.
- `humanPose.test.js`: cụm chân nay là 4 khối (chân + bàn chân mỗi bên); danh sách ngoại lệ đếm
  được của phép đo hình bóng **tốt lên** từ `[6, 7]` xuống `[6]`.

### Điều kiện xem lại
- Nếu Đàm muốn cư dân đọc rõ ở khung TOÀN CẢNH (không phải cận cảnh): bản này **không** giải bài
  toán đó — ở 14–18 điểm ảnh, tám mảng sáng và ba mảng sáng chênh nhau dưới ngưỡng mắt. Bài toán
  ấy là bài toán KHUNG HÌNH, xem `TECH_DEBT #80`.
- Nếu một kỷ nào đó cần khuôn thứ tám: thêm vào `PROFILES`, và bài test *"mọi khuôn phải có ít nhất
  một kỷ dùng tới"* sẽ đỏ nếu nó thành một trục chết.
- Nếu trần 11 khối được nới: đọc lại (c) trước — cái trần ấy đã ép ra một thiết kế tốt hơn một lần.

---

## ADR-054 — Vật liệu của thứ đội trên đầu là một TRỤC RIÊNG, không phải một sắc độ của quần; và một tham số bị một biến cùng tên che khuất đã giết hai tính năng trong im lặng

**Ngày:** 2026-08-23
**Trạng thái:** đã áp dụng

### Bối cảnh
`humanStyle.js` vừa được thiết kế đủ 15 kỷ (ADR-053). Bộ chấm bản sắc bằng SỐ báo xanh sạch:
105/105 cặp kỷ khác nhau ở ít nhất một thứ mắt đọc được, trung vị 8/9 trục. Theo mọi cổng số thì
việc đã xong.

Rồi 15 cư dân được dán cạnh nhau và phóng to (`scripts/human-strip.mjs`) — **cả 15 đều nâu**.

### Vấn đề — HAI lỗi độc lập, cùng lộ ra trong một lần nhìn

**(1) MỘT THAM SỐ BỊ CHE KHUẤT BỞI MỘT BIẾN CÙNG TÊN.** `buildScenePalette({ …, era: eraNumber, … })`
đổi tên tham số `era` (một SỐ KỶ) thành `eraNumber` ngay dòng khai báo, rồi vài dòng sau gán một
`const era` KHÁC — một MÀU. Từ đó hai dòng ở cuối hàm:

```js
const flora = getFloraStyle(era);   // ← truyền một OBJECT MÀU vào hàm chờ một SỐ KỶ
const human = getHumanStyle(era);
```

Cả hai hàm ấy **cố ý** rơi về kỷ 1 với dữ liệu lạ (không được ném lỗi giữa màn hình Thành Phố), nên
hậu quả là **15 kỷ dùng chung một màu lá và một màu vải** — build xanh · lint sạch · toàn bộ test
xanh · không một cảnh báo nào. Mảng "mỗi kỷ một `leafHue`" của Phase 8D **chưa bao giờ chạy thật
trên production**.

**(2) MỘT VAI MÀU GÁNH HAI VIỆC — lần thứ SÁU của họ lỗi ấy.** Mọi thứ đội trên đầu (trừ búi tóc và
mũ trụ) đều lấy vai `cloth2`, mà `cloth2` được định nghĩa là *"quần/chân, tối nhất bộ"* và suy ra
bằng `cloth × 0,66`. Nghĩa là **cái nón và cái quần bị buộc phải cùng một lò nhuộm**, và cái nón
VĨNH VIỄN tối hơn cái áo. Đo cả 15 kỷ (độ đậm 0..1):

| kỷ | thứ đội | thật ngoài đời | trước | sau |
|---|---|---|---|---|
| 6 Việt Nam | nón lá | lá cọ phơi, không nhuộm | **0,170** (tối nhì bảng) | 0,879 |
| 5 Đức | khăn lanh | lanh mộc | 0,196 | 0,879 |
| 7 Ý | mũ rơm Firenze | rơm | 0,249 | 0,879 |
| 8 Bồ Đào Nha | mũ rơm ngư dân | cói | 0,311 | 0,879 |
| 2 Ai Cập | khăn nemes | lanh tẩy trắng | 0,499 | 0,879 |
| 15 UAE | khăn ghutra | bông trắng | 0,586 | 0,879 |
| 4 · 9 · 10 · 11 | futou · casquette · mũ nồi · mũ phớt | vải/nỉ NHUỘM | sẫm — **ĐÚNG** | không đổi |

### Phương án đã cân nhắc
1. **Chỉnh tay `cloth2` của riêng kỷ 6 cho sáng lên.** Bác: `cloth2` cũng là màu QUẦN, nên nó sẽ
   cho người Việt mặc quần trắng; và nó vá đúng một kỷ trong sáu kỷ cùng bệnh (đúng cái đã xảy ra
   với `eaves` ở Phase 7C — vá cho một kỷ rồi bệnh gốc quay lại khi có 30 công trình mỗi kỷ).
2. **Suy vai màu từ `kind` (`conical`/`brim` ⇒ nhạt).** Bác: **mũ rơm Firenze và mũ phớt New York
   đều là `brim`** nhưng một cái rơm một cái nỉ nhuộm. Suy từ hình là dựng lại đúng cái bẫy đang gỡ.
3. **Bốn giá trị vật liệu (rơm · lanh · len · nỉ).** Bác: ở cỡ cư dân đo được (14–31 điểm ảnh) len
   và nỉ chênh nhau **dưới ngưỡng mắt** ⇒ một trục CHẾT, đúng thứ Phase 11 đã trả giá.

### Giải pháp đã chọn
**(1)** Đổi tên biến màu thành `sacKy` — một cái tên không thể bị nhầm với số kỷ — và truyền
`eraNumber` vào hai hàm. Khoá bằng `palette3d.test.js` mục *15 KỶ RA 15 MÀU LÁ VÀ 15 MÀU VẢI*, kèm
đối chứng nhốt đúng bộ hỏng cũ (không truyền số kỷ ⇒ phải ra ĐÚNG 1 giá trị).

**(2)** Thêm trục bảng `headMaterial ∈ {'natural','dyed'}` (bắt buộc cả 15 dòng, validator TỪ CHỐI
thẳng dòng thiếu) và vai màu thứ sáu `straw` trong `palette3d.js`. `headgearBox` chọn vai theo VẬT
LIỆU, không theo hình. **Giá: 0 lệnh vẽ, 0 tam giác** — cả cộng đồng đi qua một `InstancedMesh` và
màu vào qua `setColorAt`, nên số vai màu không phải một ngân sách.

`straw` cố ý KHÔNG theo kỷ, và lý lẽ ở đây mạnh hơn ở `hair`/`gear`: thứ làm cho mọi vật liệu trong
nhóm này giống nhau chính là **sự vắng mặt của thuốc nhuộm**.

### Đánh đổi — nói thẳng, không giấu
- **Hai kỷ vẫn có đội đầu không tách khỏi áo, và cả hai đều ĐÚNG với sự thật vật lý:** kỷ 12 (mũ sắt
  SSh-40 Stalingrad được SƠN đúng màu áo bông để nguỵ trang) và kỷ 15 (ghutra trắng trên kandura
  trắng — ngoài đời thứ tách chúng là sợi dây agal ĐEN mà bộ từ vựng chưa có). Ép chúng tương phản
  là mua một con số bằng cách nói dối lịch sử, đúng thứ ADR-025 cấm. Ghi thành **ngoại lệ tường
  minh đếm được** `assert.deepEqual(khôngTáchKhỏiÁo, [12, 15])` — kỷ thứ ba rơi vào là đỏ, mà một
  trong hai kỷ này được sửa cũng đỏ.
- **Năm kỷ có `headMaterial` TRƠ** (1 · 3 · 12 · 13 · 14 — không đội gì, hoặc búi tóc lấy vai `hair`,
  hoặc mũ trụ lấy vai `gear`). Khai một trường mà nó không đổi được điểm ảnh nào là chỗ ẩn náu tốt
  cho một lỗi ⇒ danh sách ấy được khoá bằng `assert.deepEqual(trơ, [1, 3, 12, 13, 14])`.
- **Nón lá kỷ 6 nay che gần trọn thân người** khi nhìn từ góc mặc định. Đây là hệ quả hình học đã
  biết (nón lá thật rộng ~2,5 lần đầu) và nó đã được ghi thành ngoại lệ `[6, 7]` của phép đo hình
  bóng ở `humanPose.test.js`. Đổi lại, kỷ 6 nay nhận ra được ngay từ xa.

### Ảnh hưởng
`palette3d.js` (vai `straw`, đổi tên `sacKy`) · `humanStyle.js` (trục `headMaterial`, 15 dòng) ·
`human.js` (`HUMAN_ROLES` 6 vai, `headgearBox` nhận vật liệu) · `sceneGraph.js` (một dòng bảng màu)
· 3 file test. Tam giác và lệnh vẽ **không đổi một đơn vị**.

### Điều kiện xem lại
Khi có kỷ thứ 16, hoặc khi ai đó muốn tách vai `gear` (nay đang gánh gỗ + xương + kim loại — cùng
hình dạng lỗi, xem `TECH_DEBT #79`).

---

## ADR-053 — Cư dân là một BỘ XƯƠNG có khớp, dựng bằng MỘT InstancedMesh hộp đơn vị; dáng đi là hàm của QUÃNG ĐƯỜNG đã đi, không phải của thời gian

- **Ngày**: 2026-08-22
- **Bối cảnh**: Đàm yêu cầu *"dựng lại mô hình người trong thành phố 3D thành một cơ thể có khớp
  hoạt động, và cho kỷ 1 một bản sắc con người riêng"*, kèm ràng buộc rất chặt: tầng engine THUẦN
  (không three/DOM/Date/Math.random), **không thêm thư viện, không GLTF, không skinning, không
  animation clip**, cả cộng đồng nằm trong **1–2 lệnh vẽ**, tam giác cư dân **≤6% tổng cảnh**, và
  bob (cái nhún) phải **chuyển hẳn** khỏi `residents.js`.
- **Vấn đề**: cư dân cũ là **hai hộp** (thân + đầu) cộng một cái nhún hình sin. Hai hộp thì không
  có gì để nhìn, mà cũng không có gì để PHÂN BIỆT: 15 kỷ đi bộ giống hệt nhau, nên phần thưởng của
  việc đi hết 15 kỷ không chạm tới con người trong thành phố. Nhưng trước khi dựng bất cứ thứ gì
  phải trả lời được một câu đo được: **ở khung 3D thật trên máy Đàm, một cư dân cao bao nhiêu điểm
  ảnh?** — vì nếu câu trả lời là 4 px thì mọi khớp xương đều là mã chết.
- **Phương án cân nhắc**:
  1. **Giữ 2 hộp, chỉ đổi màu/kích thước theo kỷ.** Rẻ nhất, và đủ để "15 kỷ khác nhau" trên giấy.
     Loại: thứ mắt đọc được ở cỡ 18 px không phải màu mà là **hình bóng ĐANG ĐỔI** — một khối cứng
     đứng yên thì đọc ra "một cái cột", bất kể sơn màu gì.
  2. **Mỗi bộ phận một `Mesh` riêng, xoay bằng `Object3D` cha-con.** Đúng cách three thường làm và
     rẻ về mặt trí óc. Loại: 28 người × 9 bộ phận = **252 lệnh vẽ**, gấp 25 lần cả thành phố hiện
     tại (10 lệnh). Vi phạm thẳng ràng buộc Đàm đặt.
  3. **Skinning / GLTF / animation clip.** Loại thẳng: Đàm cấm, và nó kéo theo một thư viện, một
     định dạng tệp, một ống dẫn tài sản — cho một nhân vật cao 18 px.
  4. **Thêm trục xoay nghiêng vào `parts.js`** để khối tự nghiêng được. Loại: Đàm cấm thẳng, và nó
     sẽ đẩy một khái niệm của RIÊNG con người vào nhà máy hình học dùng chung cho nhà cửa, cây cối
     — đúng thứ `TECH_DEBT #29` đang phải trả giá theo chiều ngược lại.
  5. ⭐ **MỘT `InstancedMesh` trên một hộp đơn vị 1×1×1; mỗi bộ phận của mỗi người là một instance,
     kích thước đi vào ma trận co giãn, khớp xoay ở tầng ma trận** — chọn.
- **Giải pháp chọn**: ba file thuần mới, tách đúng khuôn `floraStyle.js` ↔ `flora.js` (ADR-020) đã
  chứng minh:
  - `src/engine/city3d/humanStyle.js` — **BẢNG 15 kỷ × 11 trục** (`stature` · `build` · `legShare` ·
    `stance` · `garment` · `headgear` · `carry` · `stride` · `walkSpeed` · `armSwing` · `cloth`),
    mỗi dòng buộc vào đúng `country` mà `eraStyle.js` khai (có test bắt), 14 kỷ chưa làm trỏ một
    preset **CÓ TÊN** (`mocPhoThong`) chứ không rơi ngầm về mặc định.
  - `src/engine/city3d/human.js` — **THƯ VIỆN HÌNH**: khớp `humanDims` (tỉ lệ cơ thể) và
    `buildHumanBody` (danh sách hộp, mỗi hộp gắn vào một khớp + một vai màu).
  - `src/engine/city3d/humanPose.js` — **DÁNG ĐI**: `poseAt(body, travelled)` trả góc từng khớp.
  - `residents.js` giữ nguyên trách nhiệm cũ (bao nhiêu người, đi đâu) và **trả `travelled` thay cho
    `bob`**; `sceneGraph.js` chỉ còn ghép ma trận.
- **Trade-off**: (a) **một trục xoay mỗi khớp** (trục ngang, mặt phẳng đi tới) — đủ cho đi bộ, không
  đủ cho quay người/vung tay ngang; đây là lựa chọn có chủ đích ở cỡ 18 px, không phải thiếu sót.
  (b) Tam giác cư dân **672 → 3.024** (+350%), tức **2,03% tổng cảnh** (trần Đàm đặt: 6%) nhưng
  **2,88% riêng phần thành phố** — hai con số trả lời hai câu khác nhau, phải đọc đúng câu (bài học
  Performance Gate vòng 2). (c) Số lệnh vẽ **GIẢM 11 → 10**: hai `InstancedMesh` (thân + đầu) gộp
  làm một. (d) Trên iPhone cư dân chỉ cao **4,4–9,6 px**, đầu người **1 px** — mọi thứ dựng ở đây
  **không đọc được trên điện thoại**; Đàm đã chọn nhắm riêng MacBook Air M3 và điều đó được ghi
  thẳng vào mã để phiên sau không đọc sự im lặng thành "vậy cũng ổn".
- **Ảnh hưởng (đo được)**: trên khung 3D thật **990×614** của Đàm, cư dân kỷ 1 cao **18,3 px** (trung
  vị; 29,3 px với người gần camera nhất) — đủ để đọc **hình bóng đang đổi**, không đủ để đọc "kia là
  cánh tay". Dáng đi làm hình bóng đổi **1,9 px trên bề rộng 10,8 px (18%)** theo phép chiếu, và
  **0,73× → 1,89× tỉ lệ rộng/cao** theo phép đo trên ẢNH THẬT 1500 px có ghép cặp từng cư dân; cả
  hai đều kèm ĐỐI CHỨNG là mô hình 2 hộp cũ (ra **0,0083 px** và **1,0000 ± 0,00%**). Kỷ 1 khác
  preset ở **10/11 trục**.
- **⚠️ Phát hiện kèm theo, quan trọng cho mọi phiên sau**:
  1. **`stride` PHẢI là bội số của CẲNG CHÂN, không phải số ô.** Bản đầu khai `0,78` ô, trong khi
     cẳng chân kỷ 1 dài `0,118` ô ⇒ bàn chân phải với ra xa hơn cả chiều dài chân, `asin` kẹp hông
     về 90° và cả 15 kỷ duỗi chân ngang. Đây là bài học Phase 7D ("một số tuyệt đối không diễn đạt
     được một quan hệ") áp cho một giá trị có **hai** đầu vào biến động (`stature`, `legShare`).
     Con số hỏng `0,78` nay bị nhốt lại bằng một assert trong `humanStyle.test.js`.
  2. **Đo hình bóng CHÉO NHAU GIỮA HAI KHUNG HÌNH là bất khả thi ở đây, và nó nói dối rất thuyết
     phục.** Trong 0,57 giây cư dân đi được ~10 px — xa hơn cả bề ngang cơ thể — nên mọi phép so
     hai khung đều bị **TỊNH TIẾN** và **CHE KHUẤT** át hẳn. Bằng chứng không cãi được: mô hình 2
     hộp, thứ **không có khớp nào**, đo ra diện tích hình bóng đổi **94,2%**. Cách chữa không phải
     nới ngưỡng mà là **KHỬ** nhiễu: hai bản dựng ở CÙNG thời điểm thì vị trí/hướng/vật che giống
     hệt nhau ⇒ ghép từng người với chính mình rồi lấy TỈ SỐ.
  3. **So pha 0 với pha ½ thì hình bóng KHÔNG đổi** — ở pha ½ hai chân chỉ đổi vai cho nhau, ảnh
     là ảnh gương của đúng bề rộng ấy. Phải so pha 0 với pha ¼.
  4. **Công cụ đo tự chế nói dối lần thứ 23**, và lần này lệch **1,36 lần**: bản đầu của
     `human-scale.mjs` chiếu một ĐOẠN THẲNG từ chân lên đỉnh đầu (8,1 px) trong khi mắt đọc KHỐI
     ĐẶC (11,0 px đo trên ảnh thật) — camera nghiêng 34° nên mặt trên cũng chiếm chỗ theo chiều dọc.
     Sau khi chiếu đủ 8 đỉnh của mọi hộp: **11,1 so với 11,0**.
- ⚠️ **ĐÍNH CHÍNH 2026-08-23 (a) — MỘT TRONG CÁC CON SỐ CỦA ADR NÀY LÀ PHÓNG ĐẠI CÓ CHỦ ĐÍCH, VÀ
  CHÚ THÍCH CŨ ĐÃ GỌI NÓ SAI TÊN.** `stature: 1.18` của kỷ 1 được chú thích là *"sự thật nhân
  chủng học chứ không phải để dễ nhìn"*, kèm một dấu ngoặc coi phần điểm ảnh là *"tiện lợi đi
  kèm"*. Kiểm lại: **HƯỚNG** thì suy được từ nguồn (người săn bắt hái lượm Cận Đông trước Cách
  mạng Đá mới cao hơn người nông nghiệp ngay sau đó, và kỷ 1 là kỷ duy nhất nằm trước bước tụt
  ấy), nhưng **ĐỘ LỚN thì không**: tỉ số thường trích là ~175–177 cm so với ~161–166 cm, tức
  **1,07–1,10**, còn 1,18 lớn gấp ~1,7 lần hiệu ứng thật. Đo thẳng (`human-scale.mjs --eras 1`):
  1,00 → 15,6 px · **1,10 → 17,0 px** · 1,18 → 18,3 px ⇒ bỏ phần điểm ảnh đi thì con số đã là
  ~1,10. ⇒ Đây là **một con số mỹ thuật được một sự thật lịch sử ĐỠ LƯNG về hướng**, không phải một
  con số suy ra từ nguồn. **Giữ nguyên giá trị** (phóng đại một khác biệt có thật, đúng chiều,
  trong một thành phố cách điệu là hợp lệ) nhưng **đổi nhãn**, vì ADR-025 cấm *nói dối* lịch sử chứ
  không cấm cách điệu, và vì lời giải thích mới là thứ phiên sau kế thừa rồi dựa vào (Phase 3Y/4D).
- ⚠️ **ĐÍNH CHÍNH 2026-08-23 (b) — TRÊN iPHONE THÌ 10/11 TRỤC CỦA BẢNG NÀY KHÔNG ĐỌC RA ĐƯỢC.** ADR
  này được quyết dựa trên khung 990×614 của MacBook Air M3, với lý lẽ *"Đàm chỉ dùng MacBook"* —
  một câu chưa được kiểm, và `renderMode.js` KHÔNG loại iPhone khỏi 3D. Đo khung thật bằng
  `shot.mjs --probe`: iPhone 390 ⇒ **324×201**, cư dân **6,0 px** (so với 18,3 px). Từng bộ phận
  đều dưới ngưỡng mắt 4 px (đầu 1,9 · thân 2,5 · giáo 5,6×1,2), dáng đi chỉ đổi hình bóng **0,6 px**
  (MacBook: 1,9 px). ⚠️ Và ngay trên máy đích, **búi tóc 2,7×2,5 px cũng đã dưới ngưỡng** — tức
  trục *"đội đầu"* gần như không trả về gì kể cả ở 990×614. Bảng đầy đủ + ba hướng xử lý đề xuất:
  `TECH_DEBT #78`.
- **Điều kiện xem lại**: khi làm kỷ thứ 2 trở đi (`TECH_DEBT #78` — 14 kỷ còn lại); nếu số cư dân
  vượt 28 hoặc số hộp mỗi người vượt 11 (bài test ngân sách sẽ đỏ); nếu sau này muốn quay người
  hoặc vung tay ngang (lúc đó phải thêm trục thứ hai cho khớp và đo lại ngân sách); hoặc nếu
  màn Thành Phố được đưa lên iPhone như một trải nghiệm thật chứ không phải bản thu nhỏ.

---

## ADR-052 — Một ô nhà dân là một KHU PHỐ, không phải một căn nhà; và «thêm nhà» là điều bất khả, chỉ có «chia nhỏ»

**Ngày**: 2026-08-21 · **Phase 14 §1(3)** · **Trạng thái**: đã áp dụng

### Bối cảnh
Đàm nhìn thành phố rồi nói: *«mọi thứ hiện tại trông vẫn nhỏ, thành phố không mở rộng mà chỉ là
cụm nhỏ»*. Đi đếm thì lời phàn nàn ấy có một con số đứng sau:

- `cityGrid.js` khai `ROAD_LINES = {0, 4, 8, 11}` ⇒ **80 trên 144 ô là ô ĐƯỜNG (55,6%)**.
- 45 ô nữa thuộc vùng kỳ quan, mà chỉ 5 ô trong đó có công trình đứng.
- ⇒ chỉ còn **30 ô** có thể chứa nhà dân, và **cả 15 kỷ đã chạm trần ấy từ lâu**.

Thứ Đàm nhìn thấy vì vậy là **khoảng 30 căn nhà rải rác trên một mạng đường phủ hơn nửa mặt đất** —
đúng nghĩa một cụm nhỏ, và không một phép chỉnh mỹ thuật nào chữa được điều đó.

### Vấn đề
Chỉ thị ban đầu là *"cho mỗi ô nhà dân một CỤM 4–10 căn nhà nhỏ"*, hiểu theo nghĩa **THÊM VÀO**. Đo
thì cách hiểu ấy **bất khả thi**: **12/15 kỷ có ĐÚNG 0,000 ô² đất trống** trong lưới — không còn
một chỗ nào để đặt thêm căn nhà thứ hai. Cơ chế duy nhất còn lại là **CHIA NHỎ** chính mặt bằng
căn nhà đang đứng đó.

Và chia nhỏ mang theo một cái bẫy chết người, phải nói ra trước khi viết một dòng mã nào:
`pitch = max(0,08, roofPitch) × max(w, d)` — chiều cao mái tỉ lệ với cạnh dài nhất của mặt bằng.
Chia một mặt bằng ra sáu phần thì sáu cái mái đều **thấp đi**, trong khi `massHeight` (chiều cao
thân) **không phụ thuộc mặt bằng**. Nghĩa là: **chia nhỏ mà quên nâng cao thì thành phố còn trông
NHỎ HƠN trước** — sáu căn nhà thấp thay cho một căn nhà thấp là sáu cái lều. Cách hỏng ấy im lặng
tuyệt đối: build xanh, lint sạch, số khối tăng gấp năm.

### Phương án cân nhắc
1. **Nới lưới 12×12 rộng ra, hoặc bớt đường.** — BỎ. Lưới là hệ toạ độ của ADR-007 (*"chỉ thêm,
   không bao giờ dời"*): đổi nó thì mọi thành phố đã niêm phong trong bảo tàng mở ra khác lần
   trước. Bớt đường thì phá luôn mạng đường vừa sửa xong ở §1(1).
2. **Lùi camera / thu khung hình cho thành phố «trông to hơn».** — BỎ, và Đàm đã cấm hẳn hướng
   này từ trước (nó không làm thành phố lớn lên, nó chỉ làm mọi thứ nhỏ đi đều nhau).
3. **Giải bài «quy mô» bằng thực vật / vùng phụ cận.** — BỎ. Phase 13 VIỆC B đã đi hướng đó, qua cả
   ba cổng số, và **Đàm bác** — ba trong bốn lời phàn nàn nằm BÊN TRONG lưới. Đàm cũng cấm tường
   minh việc nâng mật độ cây.
4. **Trả về N mô tả cho một ô (mỗi căn nhà một mục trong danh sách).** — BỎ. `sceneGraph.js` bám
   theo CHỈ SỐ của danh sách ấy (`addPickTarget`), và `groundPlacement` gọi một lần cho mỗi mục —
   N mục nghĩa là N cái bệ kè chồng lên nhau dưới cùng một dãy nhà.
5. **CHIA NHỎ mặt bằng, GỘP lại thành đúng MỘT mô tả, và NÂNG CAO để bù phần mái mất đi.** — CHỌN.

### Giải pháp được chọn
Khuôn ba lớp, lần thứ **chín** (sau `vernacularRoof` · `undergrowth` · `streetStyle` · `groundFloor`
· `floraStyle` · `roofStyle` · `settingStyle` · `hinterlandStyle`):

| Lớp | File | Việc duy nhất |
|---|---|---|
| **BẢNG** | `city3d/blockStyle.js` | 15 dòng × 7 trục (`cols`/`rows`/`attach`/`alley`/`storey`/`vary`/`gableToStreet`), mỗi dòng buộc vào `country` mà `eraStyle.js` khai, mỗi dòng kể một khu dân cư CÓ THẬT |
| **HÌNH** | `city3d/block.js` | đo mặt bằng căn nhà đang đứng đó → chia → dựng từng đơn vị bằng CHÍNH `buildBuildingSpec` → gộp |
| **NGƯỜI ĐỌC** | `city3d/cityParts.js` | chỉ gọi, vẫn trả về đúng 30 mục như cũ |

Bốn ràng buộc đã được viết thành mã và thành test:

- **`storey` là một cột BẮT BUỘC của bảng**, không phải tuỳ chọn — nó là thứ bù lại phần mái mất đi
  khi chia nhỏ. Cổng canh nó là bài `CAO LÊN, KHÔNG THẤP ĐI` (`block.test.js`).
- **TRẦN LUÔN THẮNG SÀN**: ô chật thì ra **ÍT** căn, tuyệt đối không ra những căn tí hon. Phép kẹp
  bớt cột/hàng cho tới khi mỗi đơn vị còn đủ rộng (`MIN_UNIT_CELLS`).
- **TƯỜNG CHUNG THÌ KHÔNG CÓ CỬA SỔ** — vừa là sự thật kiến trúc (nhà "back-to-back" chỉ có cửa
  trước và cửa sau), vừa là khoản tiết kiệm lớn nhất của cả phase (đo ở kỷ 10: **−36%** tam giác).
- **KHÔNG THÊM MỘT LỆNH VẼ NÀO** — lệnh vẽ đếm theo họ vật liệu của cả kỷ, mà chia nhỏ một căn nhà
  không đẻ ra họ vật liệu mới. Đã đo: **0 vai lạ ở cả 15 kỷ**.

### Trade-off
- **Hai lượt dựng cho mỗi đơn vị.** Hình bao của một đơn vị **KHÔNG suy được** từ hình bao của bản
  tham chiếu, vì mái đua không co theo hệ số thu nhỏ; bản đầu suy như vậy và làm khối thân teo còn
  ~0,12–0,16 trên một suất đất rộng 0,25–0,35. Phải **dựng thử rồi ĐO** (luật *"đừng DỰ ĐOÁN thứ có
  thể ĐO"*). Cái giá là gấp đôi số lượt dựng, và nó được canh bởi cổng thời gian dựng cảnh
  (`TECH_DEBT #70`).
- **Còn 0,11 ô trôi bề ngang, và nó KHÔNG chữa được bằng một lượt dựng thứ ba.** Hình bao không
  phải hàm liên tục của hệ số thu nhỏ — bên trong `buildBuildingSpec` có những quyết định RỜI RẠC
  (số cột cửa sổ, một phép kẹp bám vào rồi nhả ra), nên nó là hàm BẬC THANG. Đã đo: lượt thứ ba
  kéo sai số tệ nhất từ **0,186 lên 0,234 ô** — nó **PHÂN KỲ** ở kỷ 5 · 8 · 10. Đây là sai số được
  CHẤP NHẬN và được canh bằng con số, không phải một thứ chờ vá.
- **9/15 kỷ mất một phần chi tiết mái** (giữ 313/371 ô = 84%, tệ nhất kỷ 13 = 72,4%). Nguyên nhân
  là `ROOFTOP_MIN_SPAN = 0,24` — một phép "từ chối thẳng" trong `rooftop.js`. Xem `TECH_DEBT #77`.
- **Tam giác nhà dân ×2,98** (335.740 → 1.000.376), cả cảnh **×1,27**. Chấp nhận được vì
  `PERFORMANCE.md` đã đo: hình học RẺ, điểm ảnh và ánh sáng mới đắt — và phase này thêm **0 nguồn
  sáng, 0 lệnh vẽ**.

### Ảnh hưởng
- `buildBuildingSpec` nhận thêm tham số tuỳ chọn `plot` (`fx`/`fz`/`storey`/`faces`). Đây là hàm mà
  **cả thành phố** đang gọi, nên nó được khoá bằng **15 chữ ký GOLDEN** sinh trên HAI cây mã
  (`git worktree` ở `ff8c2a4` và cây làm việc) rồi `diff`: **trùng từng byte**.
- `cityFocus.test.js` đổi danh sách kỷ cần canh cả-đường-bay từ 11 lên **12 kỷ / 15 chuyến** — kỷ
  14 là kỷ mới rơi vào, vì dãy shophouse nay cao và dày hơn căn nhà đơn cũ. Hệ quả ĐÚNG, không phải
  hồi quy.

### Điều kiện xem xét lại
- Nếu `ROOFTOP_MIN_SPAN` được làm cho co theo cỡ khối (`TECH_DEBT #77`), đo lại tỉ lệ giữ chi tiết
  mái và **rút ngắn danh sách 9 kỷ** trong `block.test.js` thay vì để nó thành một lời nói dối.
- Nếu ngày nào lưới thôi là 12×12, hoặc mạng đường bớt chiếm 55,6% mặt đất, thì bài toán gốc đổi
  và cả ADR này phải được đọc lại từ mục **Bối cảnh**.
- Biên của bài `CAO LÊN, KHÔNG THẤP ĐI` hiện chỉ còn **0,7%** ở kỷ 1 và kỷ 2 (`storey` 1,95 và
  1,93 trên trần 2,0). Ai muốn chia nhỏ thêm ở hai kỷ ấy sẽ **hết chỗ nâng** — lúc đó câu trả lời
  là bớt cột/hàng, KHÔNG phải nới trần.

---

## ADR-051 — Kim tự tháp và ziggurat là HAI hình khối, không phải một giá trị mái viết khác đi; và một nhánh `default` biến «thiếu `case`» thành «lặng lẽ đổi kiểu»

**Ngày**: 2026-08-21 · **Phase 14 §1(2)** · **Trạng thái**: đã áp dụng

### Bối cảnh
Đàm nhìn thành phố rồi nói: *«kim tự tháp không có khối hình chóp»*. Đi đọc bảng thì lời phàn nàn
ấy đúng theo hai cách khác nhau ở hai kỷ kề nhau:

- **Kỷ 2 (Ai Cập)** khai `roof: 'cone'`. `cone` là lăng trụ **TÁM cạnh** thóp về một điểm — trên
  màn hình nó ra một cái **lều rạp xiếc tròn**. Nền văn minh mà cả thế giới nhận ra bằng đúng một
  hình khối lại là kỷ duy nhất không có hình khối ấy. Và `pyramid` (bốn cạnh, `taper` gần 0) đã tồn
  tại trong mã từ lâu, chỉ chưa ai nối vào đây.
- **Kỷ 3 (Iraq, ziggurat thành Ur)** dùng CHUNG nhánh `stepped` với **kỷ 11 (cao ốc giật cấp
  Manhattan)** — hai thứ ngược nhau về kiến trúc. `stepped` mở đầu ở `rw` (= thân nhà + 2·`eaves`,
  tức **RỘNG HƠN** thân) nên bậc thứ nhất không tạo ra một cái thềm nào, nó chỉ nối tiếp mặt tường
  đi lên; mắt chỉ đọc được bậc thứ hai trở đi, cao 0,32 trên một thân nhà cao 1,87.

Đo bảng từ vựng: **9 giá trị mái kỳ quan cho 15 kỷ** (`flat` 3 kỷ · `cone`/`stepped`/`tiered`/`gable`
mỗi cặp 2 kỷ). Câu hỏi cố vấn đặt ra — *"`roof` có đủ từ vựng để nói 'kim tự tháp' không?"* — có
câu trả lời bằng số: **chưa**.

### Vấn đề
Vá riêng kỷ 2 thì sửa được triệu chứng và bỏ nguyên nhân. Hai kỷ kề nhau đang được yêu cầu kể hai
câu chuyện kiến trúc ngược nhau — **Giza TRƠN, Ur GIẬT CẤP** — bằng một bộ từ vựng không phân biệt
nổi chúng. Và bất kỳ giá trị mới nào cũng phải trả lời được *"công trình có thật nào trông như
vậy?"*, nếu không thì nó là mã chết mang hình dạng một tính năng.

### Phương án cân nhắc
1. **Chỉ đổi kỷ 2 sang `pyramid`, để kỷ 3 nguyên.** — BỎ. Nó chữa đúng một nửa lời phàn nàn và để
   nguyên cái gốc: hai kỷ vẫn dùng chung một nhánh mã cho hai hình khối ngược nhau.
2. **Thêm cả `mastaba` (ghế đá mộ Ai Cập) cho đủ bộ Ai Cập.** — BỎ. **Không kỷ nào có chủ cho nó**:
   kỷ 2 đã lấy kim tự tháp, và không kỷ nào khác nói về Ai Cập. Đây đúng là từ vựng chết mà mục
   Playbook cấm; nay đã có bài test `TỪ VỰNG MÁI (a)` bắt.
3. **Nâng `roofPitch` của kỷ 3 để khối ziggurat áp đảo thân nhà.** — BỎ. `roofPitch` **gánh hai
   việc**: nó vừa quyết mái kỳ đài, vừa quyết bề dày gờ chắn mái của NHÀ DÂN (kỷ 3 khai
   `vernacularRoof: 'flat'`, mà nhánh `flat` tính `lip`/`cap` theo `pitch`). Nâng lên 1,05 thì mỗi
   căn nhà bùn đội một tấm slab dày 45% chiều cao của chính nó. Đây là lần thứ SÁU của hình dạng
   *"một trường gánh hai việc"* trong dự án — và lần này nó bị bắt TRƯỚC khi ship, không phải sau.
4. **✅ Tách `ziggurat` thành một giá trị riêng, và nối kỷ 2 vào `pyramid`.** — CHỌN.

### Giải pháp chọn
`ROOF_KINDS` đi từ 9 lên 10 giá trị. Kỷ 2 khai `roof: 'pyramid'` (giữ nguyên `roofPitch` 0,72 và
`eaves` 0,2); kỷ 3 khai `roof: 'ziggurat'`, một nhánh MỚI trong `emitRoof` khác `stepped` ở **ba
điểm đo được**, và điểm thứ hai mới là điểm quyết định mắt có đọc ra "giật cấp" hay không:

| | `stepped` (setback New York 1916) | `ziggurat` (Ur) |
|---|---|---|
| mặt tường thềm | **ĐỨNG** (`taper: 1`) | **NGHIÊNG VÀO** (`taper: 0,88`) |
| thềm dưới cùng thu vào từ | mép **MÁI** (`rw`, rộng hơn thân) | mép **THÂN NHÀ** (0,80·w, hẹp hơn thân) |
| trên đỉnh | không có gì | **đền thờ nhỏ** (cella), vai màu riêng |

`landmark` của kỷ 2 đổi từ «làng ven sông Nin» sang «kim tự tháp Giza» — trường ấy là **lời giải
thích cho những con số nằm cùng dòng**, nên nó phải nói đúng công trình mà các con số đang mô tả.
Chú thích `vernacularRoof: 'flat'` giữ nguyên và nay đọc còn rõ hơn: kỳ đài của một nền văn minh và
cái nhà người ta ở hằng ngày gần như không bao giờ cùng một hình mái.

Tỉ lệ dốc của kim tự tháp KHÔNG phải con số chọn cho tiện: Đại Kim Tự Tháp Giza cao 146,6 m trên
đáy 230,3 m = **0,637 lần bề ngang**; ở đây đo được **0,533** (mái phủ `rw = w + 2·eaves` nên đáy
rộng hơn thân). Bài test khoá dải [0,40 ; 0,90], bao lấy cả tỉ lệ thật lẫn số đang dựng.

### Trade-off
- **Cái được**: kỷ 2 có một khối chóp bốn mặt thật, đáy rộng **135%** thân nhà và cao **76%** thân
  nhà — một KHỐI, không phải một cái mũ. Kỷ 3 có ba thềm nghiêng thu dần cộng một đền nhỏ trên
  đỉnh. Bảng từ vựng rộng thêm một giá trị; hai kỷ kề nhau thôi dùng chung một nhánh mã.
- **Cái mất**: **+154 tam giác** ở kỷ 2 và **+308** ở kỷ 3 (0,16% và 0,30%). **Lệnh vẽ KHÔNG đổi**
  (14 ở cả hai kỷ) vì `ziggurat` chỉ dùng hai vai màu `roof`/`trim` mà kỷ 3 đã có sẵn.
- **Cái CHƯA giải quyết, và phải nói thẳng**: khối ziggurat mới chiếm **35% chiều cao** thân nhà nó
  đứng lên. Ở Ur thì cả công trình LÀ cái ziggurat, không có thân nhà nào bên dưới. Đẩy tỉ lệ ấy
  lên bằng cách kéo cao các thềm sẽ làm chúng dày hơn tỉ lệ thật của Ur (thềm 1 cao 11 m trên đáy
  64 m = 0,17 lần bề ngang) — tức **mua một ấn tượng bằng cách nói dối tỉ lệ**, đúng thứ ADR-025 đã
  cấm với mặt đường. Đây là bài toán **KHỐI** (`massScale`, `getMassing`), không phải bài toán MÁI.
  Ghi thành `TECH_DEBT #75`.

### Ảnh hưởng
- `src/engine/city3d/eraStyle.js` — `ROOF_KINDS` +1 giá trị; kỷ 2 và kỷ 3 đổi `roof`; kỷ 2 đổi
  `landmark`.
- `src/engine/city3d/buildingSpec.js` — thêm `case 'ziggurat'`; **`emitRoof` nay được `export`**,
  và đó không phải để tiện dùng lại (không ai ngoài file ấy gọi nó) mà để bài test hỏi THẲNG nhà
  máy mái — xem mục "Điều kiện xem lại".
- `src/engine/city3d/buildingSpec.test.js` — 5 bài mới, cả 5 đã thử-cho-đỏ.
- KHÔNG đụng: bảng màu · mạng đường · địa hình · camera · ADR-007.

### Điều kiện xem lại
- Khi có kỷ thứ 16, hoặc khi một kiểu mái chạm 4 kỷ — bài `TỪ VỰNG MÁI (c)` sẽ đỏ, và câu trả lời
  đúng là *"kỷ ấy thật sự lợp mái gì?"* chứ không phải nới cái chốt.
- Khi `TECH_DEBT #75` được mở: nếu khối kỳ quan kỷ 3 được hạ xuống thì tỉ lệ thềm/thân đổi, và các
  ngưỡng trong bài `KỶ 3 — ZIGGURAT` phải được đo lại (chúng là QUAN HỆ nên phần lớn sẽ tự đúng).
- ⚠️ **Nếu ai đó gỡ `export` của `emitRoof` cho "sạch"**: bài `TỪ VỰNG MÁI (b)` sẽ không dựng được.
  Đừng thay nó bằng phép đo trên công trình đã lắp xong — đã thử và nó **không thể đỏ** (xem dưới).

### Bài học kèm theo — hai lần phép thử ngược bác bỏ chính chú thích tôi vừa viết
1. **Bản đầu của bài `TỪ VỰNG MÁI (b)`** đo *"khối kết cấu cao nhất có vươn lên trên đỉnh thân nhà
   chính không"* trên kỳ quan THẬT. Xoá hẳn `case 'ziggurat'` ⇒ **vẫn xanh**, vì `emitSignature`
   của kỷ 3 (`ziggurStair`) dựng bậc thang ở đúng chỗ ấy, cùng `x`/`z`, cùng cao độ. Một cái gác
   không thể đỏ, và lý do nằm ở một file khác.
2. **Bản thứ hai** hỏi thẳng `emitRoof` và assert `out.length >= 1`, với chú thích khẳng định
   *"`switch` không có nhánh `default` nên thiếu `case` thì không dựng ra gì"*. Phá lại ⇒ **vẫn
   xanh**: `emitRoof` **CÓ** `default`, và nó đẩy ra một tấm phiến trơn. Câu khẳng định của tôi về
   chính đoạn mã mình vừa sửa là SAI, và rủi ro thật thì **ngược lại và tệ hơn**: một giá trị mái
   thiếu `case` không biến mất — nó **lặng lẽ hoá thành một tấm phiến trơn**, tức kỷ ấy mất căn
   cước mái mà vẫn "có mái", và trên ảnh nó trông như một quyết định mỹ thuật.

   ⇒ Bản đúng dựng một kiểu mái KHÔNG TỒN TẠI để lấy đúng hình của nhánh `default`, rồi đòi mọi
   kiểu thật phải khác nó. Đây là *"một câu tự trấn an cũng phải được kiểm như một con số"*
   (Phase 4G) ở biến thể nguy hiểm nhất: câu ấy nói về **chính đoạn mã mình đang sửa**, nên nó
   nghe chắc chắn nhất và ít bị nghi nhất.

