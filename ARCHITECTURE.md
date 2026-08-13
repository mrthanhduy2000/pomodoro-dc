# Kiến trúc — Pomodoro DC

> Bức tranh LỚN: các mảnh ghép nào tồn tại, chúng nói chuyện với nhau ra sao, và VÌ SAO lại chia
> lớp thế này. Muốn biết "file X nằm ở đâu" → xem `PROJECT_STRUCTURE.md`. Muốn biết quy tắc cấm/
> chi tiết kỹ thuật từng tính năng → xem `CLAUDE.md`. Lịch sử "đã làm gì, khi nào" → `BAN_GIAO.md`.
> Muốn hiểu sâu VÌ SAO một quyết định cụ thể được chọn (phương án nào bị loại, trade-off gì) →
> `ARCHITECTURE_DECISIONS.md`. Nợ kỹ thuật đã biết → `TECH_DEBT.md`.

## 1. Bức tranh tổng thể

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────────┐
│   iPhone     │        │   Mac (Web)       │        │  Mac (Electron)  │
│  (Safari/PWA)│        │   pomodoro-dc.    │        │  menu bar/tray   │
│              │        │   vercel.app      │        │  (mở URL Vercel) │
└──────┬───────┘        └────────┬─────────┘        └────────┬────────┘
       │  cùng 1 web app (React + Vite), khác cách mở màn hình│
       └──────────────────────────┬──────────────────────────┘
                                   │
                     Zustand store (gameStore.js) + localStorage
                                   │
                    syncService.js — "First Action Wins"
                                   │
                          ┌────────▼────────┐
                          │    Supabase      │  bảng game_state (version tăng
                          │  (Postgres free)  │  bởi trigger), timer_live (tray)
                          └────────┬─────────┘
                                   │ webhook UPDATE timer_live
                                   ▼
                        api/push/dispatch.js (Vercel)
                                   │
                          Web Push → trình duyệt
```

Mọi thiết bị chạy CHUNG một bản web (không có logic riêng cho Electron/iPhone) — khác biệt duy
nhất là Electron mở app trong khung tray thay vì tab trình duyệt, và tự đọc thêm bảng `timer_live`
qua Supabase Realtime để hiện đếm ngược trên menu bar.

## 2. Vì sao đồng bộ là "First Action Wins" (không phải "ai ghi cuối thắng")

**Vấn đề cũ**: mỗi thiết bị tự ghi `updated_at` bằng đồng hồ của chính nó khi đẩy dữ liệu lên
Supabase. Máy nào đẩy tới đích SAU CÙNG sẽ đè lên máy kia, bất kể ai thao tác trước — đúng 2 máy
mở cùng lúc là ăn may, có thể mất dữ liệu thật (đã xảy ra 2026-07-11, xem `BAN_GIAO.md`).

**Cách sửa**: cột `version` (integer) trên bảng `game_state`, tăng bởi TRIGGER PHÍA SERVER
(`supabase/game_state_version.sql`) — không phụ thuộc đồng hồ máy khách. Mỗi lần ghi,
`syncService.js` gửi kèm điều kiện `.eq('version', expectedVersion)` (compare-and-swap):

- Ghi THÀNH CÔNG (version khớp) → máy đó thắng, version tăng lên 1.
- Ghi BỊ TỪ CHỐI (0 dòng khớp, vì máy khác đã ghi trước) → máy đó THUA, phải tự `pullFromCloud()`
  nhận lại bản đã thắng — TUYỆT ĐỐI không được ép ghi đè.

Nhờ vậy thứ tự "ai thao tác trước" được máy chủ phân xử chính xác tuyệt đối, không phải suy đoán
qua cờ `isRunning` như cách cũ (đã gỡ).

**Bốn lưới an toàn quanh cơ chế đó (bản vá C1, 2026-07-17)** — vá đúng các đường có thể mất dữ
liệu mà bản thân CAS không đỡ được:

- **Flush khi rời app**: mọi thay đổi đi qua debounce 5 giây; rời app trong 5 giây đó thì trên iOS
  tab bị đóng băng nên timer KHÔNG bao giờ nổ. Nay `visibilitychange → hidden` và `pagehide` đẩy
  ngay — nhưng CHỈ khi thật sự còn thay đổi đang chờ (không ghi mù mỗi lần ẩn app).
- **Không cho state trắng đè cloud**: `hasMeaningfulState()` (thuần, export để test) nhận diện
  state "có tài sản thật" (history / sessionsCompleted / totalEXP / prestige.count). Local trắng
  mà cloud có dữ liệu → NHẬN lại cloud, không đẩy. Local có dữ liệu thật → vẫn đẩy như cũ, vì đó
  chính là đường hồi phục cho thay đổi offline chưa kịp đẩy.
- **Đường ghi không-CAS được bịt**: nhánh "chưa biết version" (`known < 0`) trước đây upsert thẳng.
  Nay đọc cloud trước; cloud có dữ liệu → nhận về; đọc lỗi → hoãn ghi (fail-safe, không ghi mù).
- **Thiếu cột `version` báo to**: lỗi Postgres `42703` lúc khởi động → `console.error` chỉ đích danh
  `supabase/game_state_version.sql`, thay vì để sync chết âm thầm.

Giới hạn CÒN LẠI (có chủ đích, không phải bỏ sót): hai máy sửa các trường KHÁC NHAU khi đang
offline thì máy thua vẫn mất phần của mình — vá thật cần merge theo trường, thuộc giai đoạn sau
(xem `TECH_DEBT.md` #8).

## 3. AI Coach — model-agnostic, tách "bộ não" khỏi "công cụ sinh chữ"

`src/engine/coach/` là toàn bộ phần THUẦN (test được, không phụ thuộc model nào cụ thể):

```
prompt.js ──┐
            ├─► guardedGenerate.js ─► cloudEngine.js ─► /api/coach (Gemini)
guard.js ───┘         ▲
                       │ dùng bởi CoachChat.jsx / CoachOffline.jsx / CoachNudge.jsx
```

- **prompt.js** — 2 prompt hệ thống ("Hỏi Coach" hội thoại 3 nhịp, "AI phân tích tổng thể" khung
  4 phần) + hàm dựng prompt từ bảng số liệu (`coachContext.js` cung cấp bảng đó).
- **guard.js** — LƯỚI CHỐNG-BỊA tất định (không phải AI): so khớp mọi con số model viết ra với
  bảng dữ liệu thật, cắt bỏ câu/dòng bịa. Đây là "tài sản quý nhất" của Coach — có bộ chấm điểm
  riêng (`eval.test.js`, ngưỡng BÁO NHẦM=0/BẮT≥90%, in điểm mỗi lần `npm test`).
- **guardedGenerate.js** — gói pipeline "gọi model → sanitize → chống chữ lạ → chống bịa số →
  cứu câu/cứu dòng" thành MỘT hàm dùng chung cho cả 3 lối vào Coach (trước 2026-07-12 mỗi nơi tự
  chép lại, dễ lệch khi sửa 1 chỗ quên chỗ kia).
- **cloudEngine.js** → gọi `api/coach.js` (server giữ `GEMINI_API_KEY`, không lộ ra client).

Vì toàn bộ prompt/guard/context là THUẦN LUẬT (không gọi AI), đổi nhà cung cấp model (đã từng đổi
từ Qwen on-device → Gemini đám mây) chỉ cần thay `cloudEngine.js`, không phải viết lại "bộ não".

## 4. Push notification — 2 đường dẫn, 1 nguồn nội dung

- **Đường chính (tức thời)**: Supabase Database Webhook bắn khi `timer_live` UPDATE (phiên hoàn
  thành) → `api/push/dispatch.js` gửi ngay.
- **Đường dự phòng**: `pg_cron` bên trong Supabase gọi lại `api/push/dispatch.js` mỗi 5 giây,
  phòng khi webhook bị lỡ (xem sự cố "cron.job_run_details phình 795MB", `BAN_GIAO.md`).
- **Nội dung thông báo** (title/body/tag) định nghĩa DUY NHẤT ở `src/engine/pushPayloads.js`,
  dùng chung bởi client (`src/lib/pushService.js`, dù server không đọc lại nội dung client gửi —
  chỉ validate có tồn tại) và server (`api/push/schedule.js`, `api/push/notify-now.js`).

## 5. Vercel Hobby: 12 Serverless Functions — vì sao `_lib`/`_tests` không bị tính

Vercel (preset "Other") coi MỌI file `.js` nằm trực tiếp trong `api/` là 1 Serverless Function,
TRỪ file/thư mục bắt đầu bằng `_`. Toàn bộ helper dùng chung (`api/_lib/`) và test (`api/_tests/`)
đặt trong thư mục có tiền tố `_` để KHÔNG bao giờ bị tính vào trần 12 — dù thêm hàng trăm file test
sau này cũng an toàn tuyệt đối, không cần nhớ danh sách trừ hao. Xem `CLAUDE.md` mục "Vercel
Hobby" để biết cách đếm lại khi thêm route mới.

## 6. Engine game thuần tách khỏi state

`src/engine/gameMath.js` + `constants.js` chứa TOÀN BỘ công thức (XP, streak, softcap, Wilson
lower bound...) — không đụng Zustand. `src/store/gameStore.js` chỉ gọi các hàm này và lưu kết
quả. Sửa công thức → sửa ở `gameMath.js`; đừng nhồi công thức mới thẳng vào action của store.

`gameStore.js` hiện vẫn RẤT LỚN (~6000 dòng, điểm nóng `completeFocusSession` ~760 dòng) — đây là
lựa chọn CÓ CHỦ Ý, không phải bỏ sót: audit 2026-07-12 xác nhận việc tách nhỏ store cần rất nhiều
test hành vi (XP/streak/mission tính sai sẽ không có gì tự động bắt được, vì app này không chạy
được E2E trên dev — xem `CLAUDE.md`). Rủi ro tách nhỏ store hiện lớn hơn lợi ích "dễ đọc hơn" cho
một app 1 người dùng — xem đề xuất "lần refactor tiếp theo" ở nhật ký `BAN_GIAO.md` ngày 2026-07-12
nếu muốn làm tiếp, kèm điều kiện cần có trước khi làm an toàn.

### 6.1 Vòng lặp một phiên — hai đầu đều phải nói được "để làm gì"

```
        ĐẦU PHIÊN                                    ĐUÔI PHIÊN
   (màn Tập trung, trên đồng hồ)              (ngay khi chuông báo hết giờ)
   useCityFocusTease                          useCityGrowthMoment
        │                                            │
   engine/cityMoment.buildFocusTease           engine/cityMoment.buildGrowthMoment
        │                                            │
   "Phiên tới hoàn thành X"                    lễ mừng 3,2 giây → phần thưởng
```

Cả hai đi qua **cùng một** `pickNearestScaffold`, nên hai đầu của một phiên luôn nói về **cùng một
công trình** — có bài test khoá đúng điều đó. Cả hai theo cùng luật trung thực: không có gì thật để
nói thì trả `null` và màn hình im lặng.

⚠️ **Chỗ đặt là một quyết định kiến trúc, không phải chuyện thẩm mỹ**: `FocusRail` (cột phải) là
`hidden … lg:flex` — chỉ hiện trên màn rộng. Mọi thứ Đàm cần thấy hằng ngày phải nằm ở **cột giữa**,
vì anh làm việc chủ yếu trên iPhone.

### 6.2 Luồng "phiên vừa xong" — vì sao có một màn chen giữa

```
useTimer.commitCompletedSession()
        │  (KHÔNG đổi — vẫn đồng bộ y như trước)
        ▼
gameStore.completeFocusSession()  ── đặt ui.lootModalOpen = true NGAY LẬP TỨC
        │                            (ba bài test khẳng định điều này)
        ▼
App.jsx <GlobalOverlays> ── {lootModalOpen && <RewardSequence />}
        │
        ├─ useCityGrowthMoment → engine/cityMoment.buildGrowthMoment()
        │        │
        │        ├── có công trình vừa xong / có giàn giáo vừa cao thêm ⇒ trả về một khoảnh khắc
        │        └── thành phố KHÔNG đổi gì ⇒ trả `null`  (im lặng, không khen rỗng)
        │
        ├─ CÓ khoảnh khắc & Đàm không bật giảm chuyển động
        │        └→ <CityGrowthMoment> 3,2 giây → onDone → LootDropModal
        │           (song song: LootDropModal.preload() nạp sẵn gói mã)
        │
        └─ MỌI trường hợp khác → <LootDropModal> NGAY
```

**Luật của tầng này (ADR-010)**: trạng thái của một hoạt hoạ 3 giây **không phải dữ liệu** — nó là
vòng đời của một component. Store không biết gì về khoảnh khắc này, nên không có cờ nào có thể kẹt
ở trạng thái bật và chặn mất phần thưởng vĩnh viễn. Cổng **hỏng theo hướng MỞ**: phần thưởng hiện ra
TRỪ KHI khoảnh khắc đang thật sự chạy.

⚠️ `ui.pendingReward.newlyBuiltIds` là trường **chỉ để hiển thị**: `ui` không nằm trong `partialize`
của store, nên nó không lên Supabase — không thêm một byte nào vào JSONB đang tranh chấp CAS
(xem mục 2).

## 7. Tầng lưu trữ (storage flow), database schema flow, và hướng phụ thuộc (dependency)

**Storage — 3 tầng độc lập, mỗi tầng một mục đích**: `localStorage` (bản sao tức thời, luôn có sẵn
kể cả offline) + Supabase `game_state` (bản đồng bộ đám mây, nguồn thật khi xung đột đa thiết bị)
+ file JSON export/import thủ công (bản sao lưu tay). Cả 3 đường ghi vào state sống đều PHẢI đi
qua đúng MỘT hàm `normalizePersistedGameState` (gameStore.js) — phễu an toàn duy nhất chống dữ
liệu hỏng/cũ/thiếu trường phá vỡ app. Xem `MIGRATION.md` cho lịch sử các lần schema version bump
(0→1→2→3) đi qua phễu này.

⚠️ **Ba danh sách trường được lưu, viết tay riêng biệt — sửa một chỗ phải sửa cả ba**: `partialize`
(gameStore → localStorage), `handleExport` (`ExportImport.jsx` → file backup JSON), và
`getExportableState` (`syncService.js` → gói đồng bộ Supabase). Không có nguồn chung nào ràng buộc
chúng khớp nhau, nên thêm một trường state mới mà chỉ sửa 1-2 chỗ sẽ tạo ra lỗi âm thầm kiểu "dữ
liệu có trên máy này nhưng không bao giờ sang máy kia". Xem `MIGRATION.md` mục schema 3→4 (thêm
`cityArchive`) làm ví dụ, và test tự động đối chiếu cả 3 nơi ở `gameStore.cityArchive.test.js`.

**Bảo tàng Thành Phố (`cityArchive`) — tách "hiệu lực chơi" khỏi "dấu vết lịch sử"**: khi lên kỷ
mới, `pruneEraScopedBlueprintState` CẮT toàn bộ công trình kỷ cũ khỏi state đang chơi (luật cân
bằng, không đổi). Từ 2026-08-12, thứ bị cắt được GHI LẠI vào `cityArchive` để ghé thăm — chỉ để
NGẮM, không perk, không tài nguyên, không ảnh hưởng cân bằng. Hàm này được gọi ở 5 chỗ nhưng **chỉ
đúng một chỗ** (`completeFocusSession`, đường lên kỷ thật) được truyền `sealContext` để niêm phong;
4 chỗ còn lại (hydrate lúc nạp app, hoàn tác phiên, 2 nhánh dev) chạy đi chạy lại nên tuyệt đối
không được ghi vào bảo tàng. **Toạ độ thành phố KHÔNG được lưu** — `src/engine/cityLayout.js` suy
ra từ chính id công trình bằng băm tất định, xem ADR-007.

**Bảng sưu tập "trọn vẹn kỷ" — một lớp GHÉP THÊM, không sửa lớp có sẵn (2026-08-13)**:
`src/engine/cityCompletion.js` trả lời "kỷ này đã xây mấy trên mấy, còn thiếu cái nào", suy ra từ
`BLUEPRINT_CATALOG` + danh sách công trình. ⚠️ Nó **không** được nhét vào `listVisitableEras`
(`cityArchive.js`): hàm đó cố ý chỉ biết về BẢO TÀNG, tức quá khứ đã niêm phong, nên kỷ ĐANG chơi
luôn có `built: []` ở đó. Nhét state sống vào là kéo một tầng biết-hiện-tại vào một tầng cố ý chỉ
biết-quá-khứ. Thay vào đó `withEraCompletion(eras, { built, pending })` ghép ở NGOÀI, trong
`CityView.jsx` — nơi đã sẵn có tri thức "kỷ hiện tại lấy state sống, kỷ cũ lấy ảnh chụp". Đây là
"Composition over Duplication" áp cho tầng dữ liệu. Kết quả dùng chung cho cả thanh chuyển kỷ và
khung màn hình, nên hai chỗ không thể nói hai con số khác nhau.

**Luồng vẽ Thành Phố — bố cục TRỪU TƯỢNG tách khỏi cách vẽ (2026-08-12)**: một chiều, 3 chặng.
(1) `CityView.jsx` chọn NGUỒN dữ liệu — kỷ hiện tại lấy state sống, kỷ đã niêm phong lấy ảnh chụp
trong `cityArchive`; đây là chỗ dễ sai nhất cả màn hình. (2) `computeCityLayout` (engine thuần) trả
về **ô lưới `(x, y)`, không phải pixel** — cùng một bố cục dùng được cho mọi cách vẽ. Bố cục gồm
`buildings` (đã xây) · `props` (cảnh vật) · **`scaffolds` (đang xây)** · `ground`. `scaffolds` nhận
THẲNG shape của `craftingQueue` trong store (`{ bpId, sessionsRemaining }`) và tự quy ra tiến độ —
cố ý không bắt bên gọi tính sẵn, để hai màn hình (tab Thành Phố và lớp nền trang chủ) không thể
tính lệch nhau. Mỗi giàn giáo mang theo đủ ba thứ một màn hình cần để nói thành câu: `progress`
(vẽ hình), `remaining`/`total` (**còn bao xa** — số phiên, thứ hành động được), và `reward` (nhãn
đặc quyền sẽ mở khoá — **đi tới đó để làm gì**). ⚠️ Giàn giáo được đặt chỗ TRƯỚC khi sinh cảnh vật,
nếu không cây sẽ mọc giữa công trường. (3) Bộ vẽ
biến ô lưới thành hình. `CityViewShell.jsx` là KHUNG (chuyển kỷ, số liệu, trạng thái rỗng) và
**không biết bộ vẽ nào đang chạy** — bộ vẽ vào qua `children` và tự quyết định kích thước của mình.
Có HAI bộ vẽ: `city/render2d/` (SVG isometric) và `city/render3d/` (three.js). `render3d/` là **nơi
duy nhất được phép `import 'three'`** — luật này giữ cho `src/engine/` tiếp tục test được bằng
`node --test` (không DOM, không WebGL), và có test đọc mã nguồn canh nó
(`components/city/cityRenderers.test.js`).

**Chạm vào công trình (2026-08-12)** đi ngược lại đúng ba chặng đó và **không phá vỡ chặng nào**:
cả thành phố vẫn gộp vào MỘT khối hình học (một lệnh vẽ), nên không thể ném tia vào mesh để biết
trúng căn nào — muốn vậy phải tách 75 mesh riêng, tức vứt bỏ chính tối ưu lớn nhất của bộ vẽ. Thay
vào đó `sceneGraph` xuất thêm `pickTargets`: **dữ liệu thuần**, mỗi công trình một hộp bao, không
tam giác nào, không lệnh vẽ nào, không cần dọn ở `dispose()`. Phần khó (tia cắt hộp, chọn cái gần
camera nhất) nằm ở `engine/city3d/pick.js` — thuần, test bằng `node --test`. `CityScene3D` chỉ làm
đúng việc mà three.js buộc phải làm hộ: đổi toạ độ điểm ảnh thành một tia. Bộ vẽ 2D không có tính
năng này, và đó là chấp nhận được — nó là đường lui, không phải bản song song đầy đủ.

Bộ vẽ 2D **không phải bản nháp sẽ xoá**: nó là đường lui
thường trực khi máy không có WebGL, khi trình duyệt mất context, hoặc khi Đàm tự chọn tắt 3D.
Xem ADR-008.

**Ai chọn bộ vẽ, và ba cửa lùi (2026-08-12)**: `city/CityStage.jsx` gom toàn bộ tri thức "khi nào
3D, khi nào 2D". Luật quyết định là hàm THUẦN `decideRenderMode` (`engine/city3d/renderMode.js`),
**fail-closed**: chưa dò xong / không có WebGL2 / máy chắc chắn yếu / đang tiết kiệm dữ liệu → 2D.
⚠️ Nguyên tắc dễ làm hỏng nhất ở đây: **thiếu thông tin KHÔNG phải bằng chứng máy yếu** — Safari
không có `deviceMemory` lẫn `connection`, coi `undefined` là "yếu" thì mọi iPhone đều rớt, tức giết
đúng mục tiêu mà nhánh 3D sinh ra để phục vụ. Ba cửa lùi, cửa nào cũng phải dẫn về 2D chứ không dẫn
tới màn hình trống: (1) dò trước khi dựng, (2) dựng thất bại, (3) đang chạy thì hỏng (mất context /
FPS thấp kéo dài).

**Luật pin của cảnh 3D**: KHÔNG có vòng lặp thường trực. `engine/city3d/renderLoop.js` chỉ đặt một
nhịp `requestAnimationFrame` khi thật sự có gì đổi (`invalidate`, gộp nhiều lời gọi thành một
khung), hoặc khi đang có hoạt hoạ thật (`beginSustained`/`endSustained`, đếm tham chiếu). Thành phố
đứng yên ⇒ **không một nhịp rAF nào tồn tại** — không phải "có nhịp nhưng bỏ qua không vẽ". Hai hệ
quả bắt buộc nhớ: (a) **FPS chỉ đo được trong lúc có hoạt hoạ** — đo lúc đứng yên sẽ ra 0 và
watchdog hạ 2D oan; (b) **bóng đổ phải tắt tự-cập-nhật** (`shadow.autoUpdate = false` ở cả
`DirectionalLight` lẫn `renderer.shadowMap`), vì mặc định của three là vẽ lại shadow map MỖI khung
hình — nó âm thầm biến mọi khung hình thành đắt như khung đầu tiên. Ngoài ra `pause`/`resume` (rời
tab) là hai hàm KHÁC `stop` (tháo cảnh): `stop` là vĩnh viễn, gọi nhầm khi rời tab thì quay lại
thấy thành phố đóng băng.

**Ngôn ngữ hình khối 3 trục — vì sao mô tả hình học lại là ENGINE THUẦN (2026-08-12)**: hình dáng
một công trình là hàm của **(kỷ × loại × độ hiếm × cấp)**, cả ba trục đều đã có sẵn trong dữ liệu
game (`ERA_METADATA`, `BUILDING_EFFECTS[].type`, `BLUEPRINT_CATALOG[].rarity`) — 15 × 4 × 3 = **75
công trình khác nhau thật** mà không phải bịa thêm một byte dữ liệu nào. Chuỗi: `parts.js` (từ
vựng: chỉ 2 hình nguyên thuỷ) → `eraStyle.js` + `archetypes.js` (ngữ pháp) → `buildingSpec.js` (mô
tả hình học thuần) → `render3d/geometryFactory.js` (**nơi duy nhất** biết three tồn tại). Ranh giới
này KHÔNG phải hình thức: nó cho phép `node --test` kiểm được những thứ mà mắt người kiểm rất tệ —
trần tam giác, tỉ lệ cao/rộng, "hai kỷ bất kỳ phải khác nhau", "cùng id thì hình vĩnh viễn không
đổi". Biến thể tất định đi qua `hashId` DÙNG CHUNG với `cityLayout.js`, nên nhà không bao giờ đổi
dáng giữa hai lần mở app — mở rộng ADR-007 từ vị trí sang hình dáng.
⚠️ **Gộp hình học là thứ làm cho điều đó rẻ**: toàn bộ công trình + cảnh vật gộp thành MỘT
`BufferGeometry`, màu đi qua thuộc tính màu ĐỈNH chứ không qua material. Nhờ vậy "mỗi công trình
một hình dáng riêng" tốn đúng **1 lệnh vẽ**, không phải 75.

**Ánh sáng và màu là một hệ THỐNG NHẤT, không phải các nút chỉnh rời (2026-08-12, Phase 3C)**:
bốn thứ dưới đây khoá lẫn nhau, đổi một cái phải soi lại ba cái còn lại.
1. **Hướng nắng** (`SUN_DIRECTION`, `sceneGraph.js`) phải LỆCH SANG BÊN so với hướng nhìn mặc định
   của camera (`DEFAULT_YAW` ở `orbit.js`). Nắng trùng trục nhìn = đèn flash: mọi mặt sáng đều
   nhau, bóng trốn ra sau, hình khối bẹp. Đây là lỗi **không lộ ra khi đọc code** (vector trông
   hoàn toàn hợp lý), nên có test hình học khoá lại ở `components/city/cityRenderers.test.js`.
2. **Tone mapping** (`applyPaintedLook`) quyết định dải sáng bị CẮT hay bị NÉN — và nó đổi cách mọi
   màu trong bảng hiện ra. Đổi nó ⇒ phải soi lại mọi chỗ dựa vào chênh lệch màu nhỏ.
3. **Tỉ lệ nắng / đèn nền** là thứ tạo chiaroscuro. ⚠️ Chiaroscuro là KHOẢNG CÁCH sáng–tối, không
   phải "tối đi": theme tối cần NHIỀU đèn nền hơn theme sáng, vì phải kéo vùng sáng lên.
4. **Bảng màu theo theme** (`palette3d.js`): hai theme là hai CẢNH khác nhau (nắng chiều ấm ↔ chạng
   vạng xanh lam), không phải một cảnh vặn nhỏ độ sáng. Theme tối giảm mạnh độ tươi — ánh sáng yếu
   thì mắt mất khả năng phân biệt màu.
5. **Giờ trong ngày** (`engine/city3d/daylight.js`, Phase 3D) là trục THỨ NĂM cắt ngang cả bốn thứ
   trên: cùng một thành phố, mở lúc 6 giờ sáng và 11 giờ đêm phải ra hai bức khác hẳn. Sáu chặng
   rời rạc (không nội suy — cảnh chỉ dựng lại khi bố cục đổi, nội suy sẽ tính cho một thứ không ai
   thấy chuyển động). ⚠️ **"Theme tối" ≠ "trời đã tối"**: theme là sở thích của Đàm, giờ là sự
   thật — nên giờ đêm ép cảnh sang bảng màu tối ở CẢ hai theme, nếu không thì ai để theme sáng sẽ
   vĩnh viễn thấy giữa trưa.

⚠️ **BẦU TRỜI KHÔNG ĐƯỢC PHA BẰNG CÁCH XOAY GÓC MÀU** — họ lỗi này đã lộ ra BA lần trong cùng một
Phase, mỗi lần ở một chỗ khác nhau, và cả ba lần chỉ ảnh chụp mới thấy chứ đọc code thì không:
cộng thẳng offset độ (`skyShift`) · nội suy góc màu về đích cố định · pha sắc kỷ bằng `mixHue`. Gốc
rễ giống hệt nhau: nội suy góc màu luôn đi ĐƯỜNG NGẮN trên vòng tròn màu, mà hai đầu màu của bầu
trời (cam bình minh ↔ lam) nằm gần như ĐỐI DIỆN nhau — đường ngắn đó chạy xuyên qua vùng TÍM, và
khi hai đầu cách nhau đúng ~180° thì hướng đi còn lật ngẫu nhiên. Kết quả từng thấy: chân trời giữa
trưa hồng phấn, đỉnh trời bình minh tím sen, đèn bán cầu tím. Cách đúng là cách của người vẽ: từ
cam sang lam thì **đi qua màu xám**. Góc màu vẫn tốt cho VẬT LIỆU (tường/mái/đá, nơi các góc màu
gần nhau nên không bao giờ lật hướng).

⚠️ **CẬP NHẬT 2026-08-13 (Phase 3V) — CÙNG KẾT LUẬN, NHƯNG NAY ĐẠT BẰNG ĐƯỜNG KHÁC. Đoạn trên tả
đúng LỖI nhưng đơn thuốc của nó (trộn RGB) hoá ra gây một bệnh thứ hai.** "Đi qua màu xám" diệt
được màu tím, nhưng nó cũng diệt luôn màu XANH: trưa khai `horizonHue: 205` với lực kéo mạnh nhất
ngày mà đỉnh trời vẫn ra `#b1a790` — **41° vàng nâu** — vì đường thẳng nối hai sắc gần đối nhau
trong RGB dừng lại ở vùng trung tính chứ không tới được sắc đích. Cả năm chặng ban ngày nằm gọn
trong dải 19°–41°, chỉ đêm thoát ra (`TECH_DEBT.md` #15). Nên `skyward` nay **xoay sắc bằng vector
chroma**, và giữ nguyên lời hứa "không bao giờ tím" bằng một cơ chế khác — vẫn là cơ chế "đi qua
màu xám", chỉ là phát biểu chính xác hơn:

> **Độ dài của vector tổng chính là mức độ CÓ NGHĨA của phép trộn.** Hai sắc cùng hướng → dài 1 →
> giữ nguyên độ tươi. Hai sắc gần ĐỐI NHAU → vector triệt tiêu → **độ tươi bị kéo về xám**, đúng
> chỗ mà phép nội suy góc màu ngày trước cho ra màu tím rực. Một dòng: `s × min(1, |v| / 0,5)`.

Vì sao tin được rằng lần này khác: bản đầu của Phase 3V **thiếu** đúng dòng đó, và bài test quét đủ
15 kỷ bắt ngay ra `#bd818e` (nước lúc 5 giờ, kỷ 6 sắc tím) — **lần thứ TƯ của cùng họ lỗi**. Tức
là đường xoay sắc thật sự có nguy cơ đó, và dòng chặn kia đã được thử ngược cho thấy nó chặn thật.

⇒ Luật hiện hành: **bầu trời được xoay sắc, NHƯNG độ tươi phải nhạt dần theo độ mơ hồ của phép
trộn.** Khoá bằng test quét 24 giờ × 2 theme × **đủ 15 kỷ thật** (mở rộng từ 6 kỷ mẫu — chính bộ
mẫu cũ đã để lọt lỗi mái tím ở 6/15 kỷ), soi cả **mặt nước** ở `palette3d.test.js`.

⚠️ **BAN ĐÊM BỊ LÀM TỐI HAI LẦN** — và đây là cái bẫy số học đã cho ra một ảnh chụp mặt đất
`#030401` (gần đúng số 0). Giờ đêm vừa chuyển SƠN sang bảng màu tối (~2,9×) vừa làm MÀU ĐÈN tối đi
(đèn bán cầu lấy màu từ chính bầu trời đêm, ~2×) — nhân lại là ~5,8× trong khi `fillEnergy` lúc đó
chỉ bù 1,45×. Nguyên tắc rút ra: **cường độ đèn phải bù cho cả độ đậm của MÀU đèn**, hai thứ đó
nhân nhau chứ không thay thế nhau.

**Thành phố ra TRANG CHỦ — một bộ vẽ, hai vai trò (2026-08-12, Phase 3F)**: `city/CityBackdrop.jsx`
đặt chính cảnh 3D đó làm lớp nền mờ phía sau đồng hồ ở trang Tập Trung. Nó KHÔNG dựng cảnh riêng —
vẫn thuê `CityStage`, chỉ bật bốn công tắc (`chrome`/`still`/`fill`/`interactive`). Đây là chỗ dễ
sinh bản sao thứ hai nhất trong cả dự án, mà bản sao đó sẽ phải nhớ vá song song mọi thứ về sau
(đường lùi 2D, watchdog FPS, dọn WebGL context, giờ trong ngày) — có test đọc mã nguồn khoá lại ở
`components/city/cityRenderers.test.js`.

⚠️ **Luật ở trang chủ NGẶT HƠN ở tab Thành Phố, và lý do là thời lượng chứ không phải thẩm mỹ**:
tab Thành Phố mở vài chục giây, trang chủ mở 25 phút liền. Nên ở lớp nền: **đang chạy phiên ⇒ đứng
yên tuyệt đối** (0 nhịp rAF, không phải "vẽ lại cùng một hình"), **điện thoại ⇒ luôn đứng yên** (dải
thành phố ló ra sau thẻ đồng hồ quá hẹp để mắt nhận ra chuyển động, trong khi giá phải trả y hệt
máy bàn), **không nhận thao tác** (bật `interactive` thì `wheel` với `passive:false` sẽ nuốt cú cuộn
trang), và **hỏng thì biến mất không một lời** (`fallback={() => null}` — mọi chỗ khác trong app
hiện bảng báo lỗi, riêng chỗ này thì không, vì thứ nó nằm phía sau là công cụ chính của cả app).
Máy không chạy được 3D ⇒ KHÔNG lùi về bản 2D ở đây: bản 2D isometric là hình minh hoạ sắc nét có
viền, đặt sau lưng đồng hồ nó đọc ra "ảnh dán nhầm chỗ" chứ không ra "khung cảnh".

⚠️ **VAI MÀU KHÔNG CHỈ LÀ "MÀU GÌ", CÒN LÀ "ĐƯỢC ĐỐI XỬ THẾ NÀO"** (`parts.js`). Khi vai chỉ dùng
để tra màu thì cửa kính và mặt nước dùng chung vai `glass` là tiện. Ngày vai bắt đầu quyết định
HÀNH VI — ban đêm mọi khối vai `glass` tách sang khối tự phát sáng để làm ô cửa sáng đèn — thì việc
dùng chung lập tức thành lỗi: cái ao biến thành một tấm vàng rực giữa thành phố tối. Thêm vai mới
(`water`) rẻ hơn nhiều so với thêm một danh sách ngoại lệ phải nhớ cập nhật.

Viền tối góc làm bằng **lớp gradient CSS**, KHÔNG phải post-processing: post-processing đòi thêm
thư viện + khung đệm toàn màn hình + vẽ lại mọi điểm ảnh mỗi khung hình, tức là khoản đắt nhất có
thể thêm vào — đúng thứ luật pin cấm. Lớp CSS đứng yên cho hiệu quả gần như y hệt với giá bằng 0.

**Cư dân — chuyển động là hàm của THỜI GIAN (2026-08-12)**: `engine/city3d/residents.js` thuần.
Dân số **suy ra** từ (số công trình, số phiên, độ dài chuỗi), không lưu vào state — cùng nguyên tắc
với toạ độ (ADR-007) và cảnh vật, nên thêm **0 byte** vào khối JSONB đang chịu CAS. `residentAt(route,
time)` nhận thời điểm làm THAM SỐ thay vì cộng dồn vào biến trạng thái; hệ quả quan trọng nhất
không phải "test được" mà là: rời tab nửa tiếng rồi quay lại, thành phố hiện ra ở đúng trạng thái
đáng lẽ phải có thay vì đứng im từ lúc trình duyệt đóng băng nó.
⚠️ **Tuyến đi phải bám quan hệ KỀ NHAU thật, không bám thứ tự mảng `roadCells`** — mảng đó đã bị
`computeCityLayout` sắp theo chiều sâu isometric cho bộ vẽ 2D xếp lớp, nên hai phần tử liền nhau có
thể ở hai đầu thành phố (test bắt được bước nhảy 3,6 ô).
⚠️ **Cư dân PHÁ luật "đứng yên = 0 nhịp rAF" một cách có chủ ý** — tab Thành Phố là màn hình mở ra
để NGẮM, chuyển động chính là nội dung của nó. Đổi lại phải có đủ ba lớp bảo vệ pin: **trần
30 khung/giây** (`targetFps` của `renderLoop`), dừng hẳn khi rời tab, và tắt sạch khi bật "giảm
chuyển động" của hệ điều hành hoặc khi xem bảo tàng. Đặt trần thì **ngưỡng watchdog phải tính theo
trần** (`slowThresholdFor` = min(24, trần × 0,7)); giữ nguyên 24 sẽ đuổi máy khoẻ xuống 2D chỉ vì
trượt vài khung.

**Database schema — KHÔNG có migration tự động**: mọi thay đổi cấu trúc bảng Supabase (`game_state`,
`timer_live`, `push_jobs`, `push_subscriptions`...) đòi hỏi chạy TAY một file `.sql` trong
`supabase/` TRƯỚC KHI deploy code phụ thuộc vào nó — không dùng Prisma/Drizzle/ORM migration nào.
Thiếu bước này khiến production lỗi ngay khi ghi vào cột chưa tồn tại (đã xảy ra thật — xem
`MIGRATION.md` mục "First Action Wins"). Mọi thay đổi schema PHẢI được ghi vào `MIGRATION.md`.

**Hướng phụ thuộc (dependency direction) — một chiều, không được đảo ngược**:
`src/engine/` (thuần, 0 phụ thuộc React/Zustand/Date trực tiếp) ← `src/store/` (Zustand, phụ thuộc
engine) ← `src/components/`/`src/hooks/` (React, phụ thuộc store + engine). `api/` là một nhánh
riêng, ĐƯỢC PHÉP import trực tiếp từ `src/engine/` (tiền lệ: `api/coach-digest.js` import
`src/engine/time.js`) vì các hàm đó thuần, không phụ thuộc DOM/browser. `src/engine/` KHÔNG BAO GIỜ
được import từ `src/store/`/`src/components/` — vi phạm chiều này là dấu hiệu coupling sai hướng,
ghi vào `TECH_DEBT.md` nếu phát hiện thay vì âm thầm bỏ qua.

## 8. Quy tắc lâu dài (bắt buộc cho mọi thay đổi tương lai)

1. **Đọc trước khi sửa**: `BAN_GIAO.md` + `CLAUDE.md` + file liên quan — xem NGUYÊN TẮC ƯU TIÊN
   SỐ 1 + Project Governance Protocol trong `CLAUDE.md`.
2. **Phát hiện logic bị chép tay ≥2 nơi** → gộp thành 1 abstraction dùng chung (tham số hoá đúng
   khác biệt THẬT nếu có, đừng ép giống nhau nếu chúng thực sự khác — xem ví dụ `BadgeKit.jsx`
   dùng prop `variant` thay vì bắt 2 nơi trông giống hệt nhau).
3. **Không tạo file/thư mục rời rạc** — đặt đúng vị trí theo cấu trúc ở `PROJECT_STRUCTURE.md`.
4. **Sau MỌI thay đổi cấu trúc** (thêm/xoá/đổi tên file, đổi kiến trúc) → cập nhật ngay
   `PROJECT_STRUCTURE.md` (+ `ARCHITECTURE.md` nếu đổi luồng dữ liệu, + `MIGRATION.md` nếu có
   migration thật, + `ARCHITECTURE_DECISIONS.md` nếu là một quyết định có trade-off đáng ghi) +
   `CLAUDE.md`/`BAN_GIAO.md`. Chưa cập nhật tài liệu = chưa xong việc (xem Definition of Done ở
   `CLAUDE.md`).
5. **Không đổi hành vi khi refactor thuần tuý** — nếu phát hiện bug thật trong lúc dọn dẹp, sửa
   nhưng phải NÊU RÕ đó là sửa bug (không lẫn vào phần "chỉ di chuyển code").
6. **Phát hiện nợ kỹ thuật mới trong lúc làm** → xử lý luôn nếu rủi ro thấp, nếu không phải ghi
   vào `TECH_DEBT.md` (không được để chỉ tồn tại trong hội thoại rồi mất khi phiên kết thúc).
