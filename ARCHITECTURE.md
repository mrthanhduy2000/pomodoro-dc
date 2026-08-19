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

**"Di sản dang dở" — công trình sống sót qua ranh giới kỷ (2026-08-13, ADR-011)**: trước đây
`pruneEraScopedBlueprintState` cắt SẠCH `craftingQueue` của kỷ cũ khi lên kỷ, nên khởi công sát ngày
lên kỷ là mất trắng tiến độ. Nay hàng đợi được `splitCraftingQueue` (`src/engine/eraLegacy.js`, thuần)
tách làm hai: mục của kỷ hiện tại (`active`) và mục của kỷ ĐÃ QUA (`legacy`) — cả hai đều được giữ,
cả hai đều xây tiếp bằng phiên tập trung. Khác biệt nằm ở **lúc hoàn thành**: `completeFocusSession`
gọi `pickLegacyCompletions(newlyBuilt, finalBook)`, và những gì thuộc kỷ cũ được ghi bổ sung vào
`cityArchive` (qua `mergeCityArchive` với `sealedAt: null` — giữ nguyên mốc niêm phong gốc) **thay vì**
vào `buildings`. Hệ quả cố ý: **không perk `BUILDING_EFFECTS`, không tài nguyên, 0 đơn vị cân bằng
thay đổi** — phần thưởng duy nhất là con số `4/5` nhích lên `5/5` và ngôi sao sáng lên.
⚠️ Ba chỗ dễ sai: (a) phải chấm theo **kỷ SAU phiên** (`finalBook`) chứ không phải kỷ trước — một
phiên có thể vừa xây xong vừa lên kỷ, và công trình của kỷ vừa rời khỏi thì đúng nghĩa là di sản.
(Đã ĐO 2026-08-13: ở ca ấy lần **niêm phong** cũng ghi công trình đó vào bảo tàng, nên đây là lưới
thứ hai chứ không phải lưới duy nhất — giá trị của `finalBook` là làm tầng di sản TỰ ĐỦ, không dựa
ngầm vào phạm vi quét của lần niêm phong. Ca mà nó là lưới duy nhất: xây xong ở phiên KHÔNG lên kỷ.)
(b) di sản **không chiếm ô hàng đợi** (`countActiveCrafting` chỉ đếm kỷ hiện tại), nếu không
một phần thưởng thuần lịch sử lại thành cái bẫy; (c) `withEraCompletion` phải truyền `pending` cho
**MỌI kỷ**, không riêng kỷ hiện tại — chặn lại thì bảng sưu tập ghi "chưa xây" ngay bên dưới cái
giàn giáo mà cảnh 3D đang dựng.

**Tiến độ chế tạo có ĐÚNG MỘT công thức (2026-08-13)**: `describeCraftProgress`
(`src/engine/craftProgress.js`, thuần) là nơi DUY NHẤT quy `{ bpId, sessionsRemaining }` ra
`{ total, remaining, done, ratio, pct }`. `cityLayout.js` (để dựng giàn giáo cao dần) và
`BuildingWorkshop.jsx` (để in "3/5 phiên") cùng gọi nó. ⚠️ Vì sao phải gom: trước đây hai nơi tự
chia lại, **lại tra hai bảng khác nhau** (`BUILDING_EFFECTS.sessionsToComplete` vs
`BLUEPRINT_META.sessionsToComplete`) và không kẹp biên ⇒ Xưởng in ra **"-4/2 phiên"**. Hai bảng
hiện khớp nhau 75/75 và có bài test canh cho khỏi lệch, nhưng "hiện đang khớp" không phải là một
bảo đảm — nên nơi đọc chỉ được có một. Bản vẽ lạ (`total === null`) thì **đừng in mẫu số**: "còn 3
phiên" vẫn là câu dùng được, "3/ phiên" thì không.

**Luồng vẽ Thành Phố — bố cục TRỪU TƯỢNG tách khỏi cách vẽ (2026-08-12)**: một chiều, 3 chặng.
(1) `CityView.jsx` chọn NGUỒN dữ liệu — kỷ hiện tại lấy state sống, kỷ đã niêm phong lấy ảnh chụp
trong `cityArchive`; đây là chỗ dễ sai nhất cả màn hình. (2) `computeCityLayout` (engine thuần) trả
về **ô lưới `(x, y)`, không phải pixel** — cùng một bố cục dùng được cho mọi cách vẽ. Bố cục gồm
`buildings` (đã xây) · **`dwellings` (nhà dân)** · `props` (cảnh vật) · **`scaffolds` (đang xây)** ·
`ground`. `scaffolds` nhận
THẲNG shape của `craftingQueue` trong store (`{ bpId, sessionsRemaining }`) và tự quy ra tiến độ —
cố ý không bắt bên gọi tính sẵn, để hai màn hình (tab Thành Phố và lớp nền trang chủ) không thể
tính lệch nhau. Mỗi giàn giáo mang theo đủ ba thứ một màn hình cần để nói thành câu: `progress`
(vẽ hình), `remaining`/`total` (**còn bao xa** — số phiên, thứ hành động được), và `reward` (nhãn
đặc quyền sẽ mở khoá — **đi tới đó để làm gì**). ⚠️ Giàn giáo được đặt chỗ TRƯỚC khi sinh cảnh vật,
nếu không cây sẽ mọc giữa công trường.
**`dwellings` (Phase 7C, ADR-015)** là hàm THUẦN của `(kỷ, số công trình đã xây, số phiên)` — không
lưu byte nào vào state. 30 ô đất trống (những ô không phải đường, không thuộc 5 khu đất đã hứa cho
kỳ quan) chia ba khu theo khoảng cách tới tâm: ngoại vi → khu dân cư → trung tâm, mỗi khu cho phép
công năng và cỡ nhà riêng. Cứ 2 phiên (~50 phút) mọc thêm một căn, **mọc từ trong ra ngoài**, trần
mật độ tăng dần theo kỷ (17 căn kỷ 1 → 30 căn kỷ 15). ⚠️ Nhà dân cũng phải đặt chỗ TRƯỚC `deriveProps`
— cùng lý do với giàn giáo, và cùng kiểu hỏng im lặng (một cái cây mọc trong phòng khách). Nhà dân
đi qua **đúng** `buildBuildingSpec` như công trình thật, chỉ khác cờ `plain` (tắt chữ ký kiến trúc +
mô-típ) và mái `vernacularRoof` — nhờ vậy chúng thừa hưởng mái/vật liệu/tỉ lệ của kỷ mà không tranh
mất hình bóng của 5 kỳ quan.
**`props` (cảnh vật) — thảm thực vật có ngữ pháp riêng (Phase 8D, ADR-020/021)**: cùng khuôn ba
lớp với nhà cửa, chỉ khác trục. `city3d/floraStyle.js` là BẢNG (15 kỷ → loài + cỡ + mật độ + tầng
cây bụi + màu lá, mỗi dòng buộc vào `country` mà `eraStyle.js` đã khai); `city3d/flora.js` là THƯ
VIỆN HÌNH (7 loài); `propSpec.js` chỉ còn GHÉP. Luật chống-primitive nằm ở một câu: **tán là nhiều
thuỳ chồng lấn lệch tâm, không phải một khối lồi** — một khối lồi tất yếu cho viền trơn, một dải
sáng và đối xứng xoay hoàn hảo, ba tật không chữa được bằng cách tăng số cạnh. `palette3d.js` đọc
`leafHue`/`leafSat` từ bảng ấy y như cách nó đã đọc `roofColor` từ `eraStyle.js` — màu lá là thuộc
tính của LOÀI, không phải một lựa chọn hoà sắc.
⚠️ Chỗ đặt cảnh vật có **hai luật quan hệ, không phải hai con số**: (a) cảnh vật mọc thành **LÙM**
(tối đa 4 tâm lùm, vật sau có 7/10 khả năng bám vào một lùm sẵn có) và **lệch khỏi tâm ô** — mắt
người bắt lưới rất giỏi, vài vật thẳng hàng là lộ ra cái bàn cờ mà Phase 8C vừa tốn công xoá;
(b) **trần phủ xanh theo TỈ LỆ** với đất còn trống, và chính tỉ lệ ấy mang mật độ của kỷ. Một trần
đếm-số-cây tuyệt đối không nhìn thấy "còn chừa bao nhiêu đất" — đo ra thì 10/15 kỷ lấp kín 144/144
ô, tức mọi cơ chế phân bố đều thành vô nghĩa (ADR-021).
**`covers` (mảng phủ đất — §2-C, ADR-037)** trả lời một câu mà cả cây lẫn nhà đều không trả lời
được: *"phần đất KHÔNG xây nhà ở đây được dùng làm gì?"*. Đo trước khi làm: đất trơn chiếm **46,2%
khung hình ở 20 phiên** và vẫn **35,9% ở 80 phiên**. Thêm cây không chữa được — một cái cây là vật
NHỎ đứng giữa một ô RỘNG, và Phase 8D đã đo ra rằng ở thành phố trưởng thành lưới cảnh vật lấp kín
144/144 ô mà đất vẫn trống, vì *"có một cái cây trong ô"* ≠ *"ô ấy được dùng vào việc gì"*. Cùng
khuôn ba lớp lần thứ SÁU: `city3d/groundCoverStyle.js` là BẢNG (15 kỷ → bộ kiểu + `share` + `scale`
+ `enclose`, mỗi dòng buộc vào `country`), `city3d/groundCover.js` là THƯ VIỆN HÌNH (7 kiểu), còn
`propSpec.js`/`cityParts.js` chỉ ĐỌC.
**`outskirts` (vùng quê) — địa lý NGOÀI lưới, và đây là tầng đầu tiên KHÔNG nằm trong lưới 12×12
(VIỆC 1 «bỏ cái khay», 2026-08-19, ADR-038)**: `city3d/outskirts.js` rải cây/bụi/đá ra **ngoài**
lưới thành phố, mật độ tắt dần ra xa (`smoothstep`) nhân với một trường nhiễu tạo lùm; giống loài,
cỡ và tỉ lệ bụi **đọc thẳng từ `floraStyle.js`** — cố ý KHÔNG có bảng 15 kỷ riêng, vì hai bảng mật
độ sẽ trôi khỏi nhau và triệu chứng ("cây trong phố rậm mà cây ngoài phố thưa, ở đúng vài kỷ") rất
khó truy; có test khoá tương quan hạng giữa hai bên.
⚠️ **Điểm kiến trúc quan trọng nhất: đây là tầng ĐỊA LÝ, không phải tầng TIẾN ĐỘ.** `deriveOutskirts`
nhận đúng `{era, gridSize}` — không `built`, không `levels`, không `sessionCount`. Cây ngoại ô có từ
trước khi có thành phố và không mọc thêm khi Đàm xây xong một căn nhà; trộn nó vào `computeCityLayout`
là mời đúng cái bẫy *"một trường gánh hai việc"* đã cắn năm lần trong dự án này. Bất biến ấy được
khoá bằng một bài test **gọi kèm dữ liệu rác** và đòi kết quả y hệt lần gọi sạch.
⚠️ **Và nó KHÔNG vào `blockers`** (danh sách vật cản của camera cận cảnh): bộ hoạch định đường bay
chỉ biết CÔNG TRÌNH chứ không biết ĐỊA HÌNH, nên chặn cây mà không chặn quả đồi bên dưới là mua một
sự an toàn GIẢ — xem `TECH_DEBT #54`. Việc loại trừ ấy dùng một **nhãn tường minh** (`vungQue`) chứ
không dùng vị trí trong mảng, và có một bài test dựng cảnh THẬT rồi đòi mọi vật cản phải nằm trong
lưới (bản đầu không có bài này, và gỡ cái gác đi thì cả 891 bài vẫn xanh).
**`settingStyle` (địa thế) — khuôn ba lớp lần thứ BẢY, và nó là bảng đầu tiên viết ra TRƯỚC khi có
hình (VIỆC 2 Bước A, 2026-08-19, ADR-039)**: `city3d/settingStyle.js` trả lời *"thành phố tiêu biểu
của nước ấy, thời ấy, nằm ở đâu và vì sao nằm ở đó?"* — `water` (không / sông / kênh đào / cửa sông
/ biển) · `side` (hướng mặt nước) · `ground` (thành phố ngồi thế nào so với nước) · `reach` · `width`.
Trục thứ hai `ground` là thứ tách 7 kỷ cùng khai `river` ra khỏi nhau; chỉ mỗi "có sông" thì chúng
sẽ ra bảy bức ảnh giống nhau. Hình sẽ dựng ở `city3d/setting.js` (Bước B, chưa có).
⚠️ **Quan hệ với `outskirts` là MỘT CHIỀU: `settingStyle` → `outskirts`.** Vùng quê sẽ đọc
`hasWater(era)` để không trồng cây dưới nước; `outskirts.js` tuyệt đối không được khai hướng nước
rồi để bảng địa thế đọc ngược lại. Lý do là câu hỏi chuẩn của dự án — *"ngoài đời hai thứ này có
luôn đi cùng nhau không?"*: loài cây và hướng ra nước độc lập (Lisboa và Porto cùng cây cùng khí
hậu, quay ra nước hai hướng khác nhau). Hai chiều là cách hai bảng trôi khỏi nhau.
⚠️ **"Không có nước" là một câu trả lời, không phải một chỗ trống**: hai kỷ khai `none` (Göbekli Tepe
trên sống núi khô — điều nổi tiếng nhất về nơi ấy; Burg Eltz trên mỏm đá, thứ giữ nó là địa hình chứ
không phải nước), và danh sách ấy bị khoá bằng `assert.deepEqual(KHO, [1, 5])` để cả hai chiều đổi
đều phải qua mắt người. Hai trần `MAX_SEA_ERAS = 7` và `MAX_ERAS_PER_SIDE = 6` đều là "dưới một
nửa", mỗi trần có một đối chứng bơm bảng hỏng vào để chứng minh phép đếm còn răng.

⚠️ Ba quyết định đáng nhớ hơn cái bảng. (a) **`covers` là một MẢNG RIÊNG, không phải một `kind` mới
của `props`** — vì một ô phải trả lời được HAI câu độc lập (*"vật gì đứng đây"* và *"mảnh đất này
dùng làm gì"*), và vì nhờ vậy `deriveProps` **không bị đụng tới một dòng nào**: bất biến *"chỉ thêm,
không bao giờ dời"* thành đúng **theo cấu trúc**. ⚠️ Nhưng *"đúng theo cấu trúc"* là đúng loại
lời hứa chết trong im lặng khi phiên sau đổi cấu trúc, nên nó nay có **hai bài test canh**
(`cityLayout.test.js`, nhóm `CHỈ THÊM`) — và phép phá *"dời một căn nhà theo số phiên"* chỉ làm đỏ
đúng một bài trong cả bộ, tức trục NHÀ DÂN × THỜI GIAN trước nay **chưa ai canh**. (b) **Ô nào được
CHIA CHUNG với cảnh vật là một phép ĐO, không phải một sở thích**: đo 15 kỷ × 8 hạt thì cây (vươn
0,415) và đèn (0,225) lọt vào trong hàng rào ở ±0,43, còn bụi (0,545) và đá (0,50) thì không — và
hai loại bị loại đều **NẰM TRÊN** mặt đất, hai loại được nhận đều **MỌC LÊN** từ một điểm. (c)
**0 lệnh vẽ mới, đã đếm chứ không suy**: bốn vai được phép (`stone`/`wood`/`leaf` ánh xạ thẳng sang
ba họ có mặt ở 15/15 kỷ, `wall` rơi về `wallMaterial` của chính kỷ đó) sinh ra **0 họ mới ở cả 15
kỷ**, nên `MOC_LENH_VE` không đổi một đơn vị. `water` bị **cấm** vì chỉ 7/15 kỷ có họ ấy — một cái
ao nghe rất hợp nhưng nó là một lệnh vẽ phải trả bằng một mục nợ, không phải thứ lén thêm.
⚠️ **Trần của lớp này, đo được**: ép phủ mọi ô đất trống cũng chỉ hạ "đất trống" thêm ~6–7 điểm phần
trăm, vì **ô lưới trống chỉ chiếm ~12–16% số điểm ảnh "đất" nhìn thấy được** — phần còn lại là vạt
đất NGOÀI lưới thành phố (đĩa đất bán kính 13,5 so với thành phố ~7,5). Mọi cách làm chỉ đụng tới ô
lưới — kể cả §2-B (nhà dân sớm hơn) — đều đụng cùng cái trần này.

(3) Bộ vẽ biến ô lưới thành hình. `CityViewShell.jsx` là KHUNG (chuyển kỷ, số liệu, trạng thái rỗng) và
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

**Bay tới một khu phố (2026-08-18, VIỆC 2 — ADR-034)** dùng lại đúng `pickTargets` ở trên và đúng
`createOrbit` sẵn có — **không có hệ camera thứ hai**. `engine/city3d/cityFocus.js` là một hàm
THUẦN: nhận chỗ đứng hiện tại + hộp bao của công trình được chạm + danh sách hộp bao của MỌI khối
trong phố (`city.blockers`, do `sceneGraph` xuất ra cùng lúc với `pickTargets`), trả về bộ tham số
`{yaw, pitch, distance, target}` rồi đưa cho chính cái cần cẩu cũ. Hai luật đáng nhớ: **khoảng
cách THẬT được khoá (7,5 đơn vị), còn mức thu phóng thì tự khác nhau theo kỷ** — đó là điều kiện để
một cái ống khói ở kỷ 1 và ở kỷ 15 chiếm bằng nhau số điểm ảnh; và **lưới an toàn lấy mẫu cả đường
bay** (48 chặng, cách mọi khối ≥ 1 ô lưới), vì điểm đến thoáng không có nghĩa là đoạn giữa thoáng —
đo thật: 9/1200 chuyến bay thoáng ở đích nhưng vi phạm giữa đường. `CityScene3D` chỉ giữ phần mà
React buộc phải giữ: nội suy 700 ms giữa hai chỗ đứng, và hạ sàn giới hạn khi hạ cánh.

⚠️ **Hai bản vá ngày 2026-08-18 (ADR-035), đọc kèm mới đủ.** (1) **Thứ tự chữa va chạm là LÙI RA
trước, NGẨNG LÊN sau** — bản đầu làm ngược, và ở kỷ 15 nó ngẩng tới 65,3°, tức cận cảnh ngả thành
ảnh chụp từ trực thăng và tầng trệt biến mất. Lý lẽ cũ (*"ngẩng thì vật vẫn to bằng ấy"*) đo đúng
một chiều — số điểm ảnh — và bỏ sót chiều thứ hai: **còn nhìn thấy mặt đứng hay không**. (2) Phép
lấy mẫu rời rạc nay báo ra **BIÊN CHỨNG MINH ĐƯỢC** chứ không phải khoảng cách đo được: 48 mẫu chỉ
biết 48 điểm, nhưng khoảng-cách-tới-một-tập là hàm **1-Lipschitz**, nên giữa hai mẫu cách nhau `s`
độ thoáng không thể tụt quá `s/2` ⇒ `pathGuarantee` trả `gap − s/2`, và bộ lập kế hoạch nhận theo
con số ấy. Đây là câu trả lời cho câu hỏi *"48 chặng có đủ không, hay phải quét liên tục?"*: **một
cái biên chứng minh được thì đủ; thêm mẫu chỉ làm biên hẹp lại chứ không đổi bản chất** — và quét
liên tục là độ-chính-xác-giả, vì bản thân vật cản chỉ là hộp bao thô.

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

**Luật ánh sáng ngoài trời (Phase 9B, ADR-024)**: cảnh có ba nguồn — nắng có hướng (`DirectionalLight`,
là nguồn đổ bóng duy nhất), đèn bán cầu mang màu TRỜI ở trên và màu ĐẤT ở dưới, và một `AmbientLight`
gần bằng 0. ⚠️ **Đèn bán cầu KHÔNG phải một hằng số — nó là một TỈ LỆ của cường độ nắng**
(`SUN_BASE × SKY_FILL_RATIO`). Lý do là một luật, không phải một sở thích: độ đen của bóng đổ do
**khoảng cách giữa đèn nền và nắng** quyết định, nên viết hai thứ ấy thành hai con số không biết
nhau là gài sẵn một cái bẫy — lần nào có người chỉnh nắng vì lý do riêng thì bóng đổ tối đi trong
im lặng (đúng hình dạng lỗi mặt đường Phase 7D, và đã xảy ra thật ở Phase 7A). Phần "nâng vùng tối"
dồn vào bán cầu chứ không vào `AmbientLight`, vì ambient rọi đều tuyệt đối ⇒ mang thông tin không
gian bằng 0 và làm dẹt hình khối.

**Cấu hình bóng đổ chỉ có MỘT chỗ**: `applyPaintedLook(renderer)` (kiểu + tắt tự-cập-nhật) và
`createCityScene` (cỡ bản đồ, `SHADOW_MAP_DESKTOP`/`SHADOW_MAP_MOBILE`). App và **cả hai** đường
dựng của `scripts/city-preview.mjs` đều đi qua đúng đó. ⚠️ Trước Phase 9B, cỡ bản đồ bóng được viết
cứng ở ba nơi với ba giá trị (app 1024 · xem thử một-kỷ 1024 · **bản quét 15 kỷ 512**), nghĩa là
công cụ duyệt mỹ thuật chính thức đang đánh giá một thế giới khác với thứ Đàm nhìn thấy. Có test
đọc-mã-nguồn chặn cả hai nơi gọi tự khai lại (`sceneGraphWiring.test.js`).

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
một hình dáng riêng" tốn **5–7 lệnh vẽ** cho cả thành phố, không phải 750.

**KHỐI KIẾN TRÚC — vì sao chiều sâu mặt tường cũng nằm ở tầng THUẦN (2026-08-15, Phase 8A)**: một
mảng tường không có gì cắt ngang thì mắt đọc ra một hình chữ nhật tô màu, không đọc ra một khối
đặc. Trước Phase 8A, thân một căn nhà dân đúng là **MỘT** khối hộp (`wall:1`), và cả cảnh chỉ dùng
5–23% ngân sách tam giác — tức đang tiết kiệm ở nơi thừa gấp 4–5 lần, rồi đi chỉnh màu để bù. Nay
`buildingSpec.js` phát ra thêm bốn loại khối cho mỗi mảng nhà: **chân tường · gờ mái · ≤3 gờ tầng ·
bệ + lanh tô cửa sổ**, tất cả vẫn là `PartSpec` đi qua đúng chuỗi cũ — **không có đường dẫn mới,
không ảnh chụp (texture), không vật liệu mới, không thêm lệnh vẽ**. Ba mức thò ra bắt buộc theo thứ
tự `gờ mái > chân tường > gờ tầng`, và bệ cửa sổ phải thò xa hơn chính ô kính: đó là các QUAN HỆ
(nếu gờ thò ít hơn thứ dưới nó thì nó mất bóng và thành đường kẻ vô nghĩa), nên chúng được khoá
bằng assert chứ không để nằm rời như bốn con số. Vì sao chọn hình khối thật thay vì bản đồ pháp
tuyến: **ADR-017**. Giá: kỷ nặng nhất 23% → **41%** trần tam giác.

**CẠNH VÁT — và vì sao nó buộc hai tầng phải đọc CHUNG một hàm (2026-08-15, Phase 8B)**: `parts.js`
vẫn chỉ có hai hình cơ bản, nhưng lăng trụ nay có thể mọc thêm hai vành mặt bên hẹp ở hai đầu. Vì
hình học ở đây **không đánh chỉ mục** (mỗi mặt có pháp tuyến phẳng riêng — xem đầu `geometryFactory.js`),
hai vành ấy tự có pháp tuyến nghiêng ~45° và bắt sáng khác hẳn mặt tường bên cạnh: đó chính là vệt
sáng viền, không cần thêm đèn, vật liệu hay ảnh nào. ⚠️ **Hệ quả kiến trúc quan trọng hơn cả hiệu
ứng**: kể từ đây **một khối đổi số tam giác tuỳ theo kích thước của chính nó**, nên `bevelWidth()`
phải là nguồn DUY NHẤT cho cả `countTriangles` (tầng thuần, nuôi ngân sách + HUD) lẫn `emitPrism`
(nhà máy), và cả hai phải hỏi trên khối **CHƯA nhân `BUILDING_SCALE = 1.3`**. Hỏi trên số đã nhân ở
một bên thôi là đủ để khối nằm sát ngưỡng được vát mà không được đếm — bảng ngân sách sẽ nói dối
trong im lặng. Đã khoá bằng bài "NGÂN SÁCH KHÔNG NÓI DỐI" (`geometryFactory.test.js`), bài đối chiếu
mà chú thích đã hứa từ Phase 3B nhưng chưa từng tồn tại. Chọn bề rộng: **ADR-018**.

**BỀ MẶT là một trục ĐỘC LẬP với màu (2026-08-14, Phase 7A)** — và đây là lớp cuối cùng của chuỗi
trên. Trước Phase 7A cả thành phố dùng đúng **một** `MeshLambertMaterial`. Lambert thuần khuếch
tán: không có số hạng phản xạ gương, nên **về mặt toán học mọi bề mặt là cùng một bề mặt**, chỉ
khác sắc — kính không thể đọc ra khác đá, kẽm không thể đọc ra khác ngói, dù bảng màu có công phu
tới đâu. Đó là nguyên nhân gốc của cảm giác "khối màu phẳng", không phải số tam giác. Xem ADR-013.
Chuỗi nay dài thêm một mắt: `materials.js` (thuần — bảng 15 **họ** vật liệu: nhám/kim loại; tra
`vai màu × kỷ → họ`) → `geometryFactory.js` gom tam giác **theo họ** rồi phát ra các **nhóm**
(`geometry.addGroup`) → `sceneGraph.js` dựng mảng vật liệu **từ chính `families` nhà máy trả về**.
Ba điều ràng buộc lẫn nhau ở đây, đổi một cái phải soi hai cái kia:
1. **Thứ tự nhóm phải theo `MATERIAL_ORDER`, không theo thứ tự khối được dựng** — thứ tự chèn vào
   `Map` đổi khi Đàm xây thêm một công trình; một thứ tự "ổn định trong hầu hết trường hợp" là loại
   lỗi tệ nhất. Hai bên tự liệt kê riêng ⇒ mái mang độ bóng của mặt nước, mắt thấy ngay mà đọc code
   thì không. Khoá bằng `geometryFactory.test.js` + `sceneGraphWiring.test.js`.
2. **Kim loại BẮT BUỘC có bản đồ môi trường** — nó gần như không có thành phần khuếch tán, nên
   `metalness: 0.9` mà không có gì để phản chiếu sẽ render ra **ĐEN**, không phải "kém bóng đi".
   Bản đồ được nướng bằng `PMREMGenerator.fromScene` trên một quả cầu tô bằng **cùng hàm**
   `paintSkyGradient` vẽ vòm trời — một luật một công thức, nếu không thì kính phản chiếu một bầu
   trời khác với bầu trời ngay sau lưng nó.
   ⚠️ Bản đồ phải gắn vào **từng vật liệu** (`envMap`), KHÔNG gắn qua `scene.environment`: đi đường
   đó thì three **bỏ qua `envMapIntensity` hoàn toàn** và môi trường rọi ở mức 1,0 bất kể ta khai
   gì — cả bảng màu đất công phu của các Phase trước bạc phếch như sữa. Đã đo: vặn núm từ 0 lên 3,0
   mà ảnh không đổi một điểm ảnh nào.
3. **Bóng tiếp xúc nướng SẴN vào màu đỉnh** (`contactShade`), không dùng lượt SSAO — SSAO là hậu kỳ
   chạy mỗi khung hình, nó phá vỡ render-on-demand (đứng yên = 0 nhịp rAF), thứ đắt nhất phải giữ
   trên iPhone. Nướng sẵn tốn 0 đồng lúc chạy.

**THẾ GIỚI KHÔNG KẾT THÚC Ở RÌA THÀNH PHỐ (2026-08-15, Phase 9A)** — `engine/city3d/horizon.js`
(thuần) + `render3d/terrainMesh.js#buildHorizonSurface` (vẽ). Xem **ADR-022** và **ADR-023**.

Luồng: `buildHorizon({era, gridSize})` → `heightAt(x, z)` (toạ độ THẾ GIỚI, không phải toạ độ ô) →
`buildHorizonSurface` lấy mẫu thành lưới đỉnh → một `Mesh` duy nhất trong `sceneGraph.js`, thay chỗ
tấm ván phẳng 12 tam giác cũ.

Bốn ràng buộc ở tầng kiến trúc, mỗi cái đều đã trả giá một lần trong chính phase đó:
1. **Chỗ giáp hai tấm là một CON SỐ DÙNG CHUNG, không được suy lại bằng tay.** `terrainSurfaceReach()`
   (`terrain.js`) là nguồn duy nhất; `buildHorizon` đọc nó rồi chia bước lưới TỪ nó (`innerEdge /
   HORIZON_INNER_STEPS`) để chắc chắn có một đỉnh nằm đúng trên chỗ giáp. Bản đầu suy tay ra 9,4
   trong khi thật là 9,5 ⇒ một khe hở 0,5 đơn vị chạy vòng quanh thành phố.
2. **Thứ tự bắt buộc: sửa SƯƠNG trước, dựng NÚI sau.** Sương tuyến tính cũ có mặt phẳng `far` và bão
   hoà 95–100% ở đúng vùng này, nên núi dựng trước sẽ tàng hình hoàn toàn — ship một cơ chế đã chết
   kèm một chú thích dài giải thích nó chạy ra sao (bẫy Phase 8D). Nay là `FogExp2`, mật độ chọn từ
   ba mốc đo được chứ không phải một hằng số (xem `fogDensityFor` ở `daylight.js`).
3. **Hai tấm phải chia chung LUẬT MÀU, không chỉ chung cao độ.** `applyBareEarth` (sườn dốc lộ đất)
   và trường vết loang `terrain.tintAt` đều dùng chung cho cả hai. Bản đầu để tấm núi tự nghĩ ra một
   luật riêng (sáng dần theo độ cao) và mắt đọc ra một cái bệ với một cái hào, dù hình học khớp
   tuyệt đối.
4. **Tấm núi KHÔNG nhận bóng và KHÔNG đổ bóng** — vì đúng, không phải vì nhanh: khung bóng đổ chỉ bó
   quanh lưới 12×12, điểm ngoài khung tra nhầm mép bản đồ bóng ⇒ cả dãy núi đen kịt.

Đo bằng `scripts/depth-score.mjs` (đếm số lần ĐỔI CHIỀU độ sáng ở dải trên — một dốc màu mượt có
biên độ lớn mà 0 lớp, nên biên độ một mình không nói được gì): **0 → 55 lớp không gian**.

---

**MẶT ĐẤT KHÔNG CÒN PHẲNG (2026-08-14, Phase 7B)** — `engine/city3d/terrain.js`, thuần như mọi thứ
khác trong `city3d/`. Xem ADR-014 cho lý do chọn **thềm bậc** thay vì dốc liên tục và **bệ kè** thay
vì san phẳng đất.

⚠️ **VÀ NỬA ĐẦU CỦA ADR-014 ĐÃ BỊ ĐẢO NGƯỢC Ở PHASE 8C (ADR-019) — đọc cả hai, đừng đọc mỗi cái cũ.**
Lập luận "phải là thềm bậc" đứng trên tiền đề *"nền thành phố là 144 ô hộp"*; Phase 8C gỡ chính tiền
đề đó, nên **cách VẼ** nay là hai tấm lưới liền (`render3d/terrainMesh.js`) lấy mẫu mượt từ
`surfaceHeightAt`. **DỮ LIỆU bậc thềm không đổi một con số** — `cells`/`footprint`/`drop` nguyên vẹn,
và công trình vẫn đứng trên thềm (chúng là khối đáy phẳng, vẫn cần mặt bằng). Bất biến giữ hai vế
khớp nhau: tại toạ độ NGUYÊN, `smoothHeightAt` trả về **đúng** `heightAt`.

Bốn điểm về LUỒNG DỮ LIỆU đáng nhớ ở tầng kiến trúc:
1. **Cao độ là hàm của DUY NHẤT `(era, gridSize)`** — `buildTerrain` cố tình không nhận danh sách
   công trình. Đây là cùng một bất biến đã giữ cho VỊ TRÍ ô đất (ADR-007) và THỨ TỰ mở đường
   (Phase 6C): thứ gì thuộc về "vùng đất" thì không được đổi theo tiến độ của Đàm, nếu không mỗi
   căn nhà mới xây sẽ làm cả quả đồi nhích và nhà cũ lún — **im lặng**, không có gì báo.
2. **Bước CĂNG TRƯỜNG là chỗ chịu lực**, không phải các hàm hình dạng. Trên lưới 12×12 chỉ có ~9
   giá trị mắt lưới nhiễu độc lập, nên luật số lớn không áp dụng được và phân bố thô bị dồn cục:
   5/15 kỷ sập về 1–2 bậc dù khai 4–5 bậc. Chuẩn hoá min→0/max→1 rồi chia bậc bằng `floor` (KHÔNG
   phải `round` — ô biên của `round` chỉ rộng bằng nửa ô giữa) mới làm mọi kỷ dùng đủ số bậc mình
   khai. Đã khoá bằng test, và đó là bài đỏ khi gỡ bước căng.
3. **SÁU chỗ phải hỏi `terrain`** (ô nền · đường · công trình · bệ kè · cảnh vật · cư dân). Quên
   một chỗ thì thứ đó lơ lửng hoặc lún, và build/lint/test đều xanh — đúng loại vi phạm chỉ test
   **đọc mã nguồn** mới chặn nổi (`sceneGraphWiring.test.js`, bảng `GROUND_ANCHORS`).
   ⚠️ Từ Phase 8C danh sách này **trải trên HAI file**: hai chỗ đầu (nền, đường) đã sang
   `render3d/terrainMesh.js`, bốn chỗ còn lại vẫn ở `sceneGraph.js`. Bảng `GROUND_ANCHORS` vì vậy
   ghi kèm TÊN FILE cho từng hàng — để nguyên bảng cũ thì hai hàng ấy đỏ trong khi mã hoàn toàn
   đúng (phép đo già đi, không phải mã hỏng).
   Camera cũng phải bù, và bù theo **ĐƠN VỊ THẾ GIỚI** chứ không trộn vào `massScale`: đo được 1 đơn
   vị `massScale` ≈ 5 đơn vị thế giới, nên quy đổi qua cỡ lưới là quy đổi bằng một con số chẳng liên
   quan (bản đầu bù thiếu ~4 lần và ảnh vẫn "trông có vẻ đúng").
4. ⚠️ **HAI LOẠI Ô, HAI LUẬT CAO ĐỘ (2026-08-18, ADR-032)** — điểm 1 ở trên vẫn nguyên vẹn, nhưng
   `buildTerrain` nay đọc thêm **một hằng số thứ hai**: `roadCellCandidates()` từ `cityLayout.js`.
   Đây KHÔNG phải cửa sau cho tiến độ lọt vào: đó là danh sách **ỨNG VIÊN** (80 ô, suy một lần từ
   `CITY_GRID_SIZE`), không phải mạng đường đã hiện. Mạng đã hiện thì CÓ đổi theo kỷ và theo số
   phiên (công trình chiếm mất ô); ứng viên là **tập cha thật sự** của mọi mạng đã hiện, nên khoá
   địa hình vào nó là một lời hứa **CHẶT HƠN** ADR-007, không phải lỏng hơn. Ba bài test ở
   `cityLayout.test.js` khoá đúng ba mệnh đề ấy (ứng viên bất biến · ứng viên là tập cha · mạng đã
   hiện thì KHÔNG bất biến — đừng dựa vào nó).
   · **Luật ĐẤT không đổi**: 64 ô đất vẫn là bội số nguyên của một bậc thềm, đo lại từng ô trước và
     sau bản vá thì **giống hệt, không một ô nào nhúc nhích**.
   · **Luật ĐƯỜNG mới**: 80 ô đường được san thành dốc thoải, có **trần độ dốc lấy từ ngoài đời**
     (Baldwin Street, Dunedin NZ — 34,8%, con phố dốc nhất thế giới), nên cao độ của chúng KHÔNG
     còn là bội số của bậc thềm. Đây là chỗ duy nhất trong `terrain.js` phá tính "mọi cao độ đều
     lượng tử hoá", và nó phá có chủ đích.
   · Phép san là **trung vị của BA hàm C-Lipschitz** (bao dưới · bao trên · hai trần từ đất bên lề).
     Chọn trung vị vì nó là cách duy nhất giữ được **cả hai** lời hứa cùng lúc (phố không dốc quá
     Baldwin **và** bờ đất bên lề không dốc quá 1:1) — lấy trung bình hai bao thì không tôn trọng
     được trần nào cả, đã thử và đo ra là sai. Trung vị của ba hàm C-Lipschitz vẫn C-Lipschitz, và
     điểm bất động của phép quét là DUY NHẤT ⇒ không phụ thuộc thứ tự duyệt ⇒ tất định, đúng ADR-007.
   · Hệ quả nhìn thấy được: ranh thềm cắt ngang đường nay là một **đoạn dốc** thay vì một bức tường.
     Vì đường nằm ở mọi hàng/cột thứ 4, gần như mọi ranh thềm đều đi qua đường, nên cả thành phố
     mềm hẳn đi — mà **quan trắc quan trọng nhất là dải cao độ của ĐẤT không hề thu hẹp**: địa hình
     vẫn cao thấp đúng như cũ, chỉ có các BẬC hoá thành DỐC.

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

⚠️ **MỘT VAI MÀU PHẢI ĐỌC ĐƯỢC TRÊN THỨ NÓ NẰM CẠNH, NÊN NÓ PHẢI BIẾT THỨ ẤY ĐANG Ở ĐÂU**
(Phase 7D, xem **ADR-016**). Đa số vai màu trong `palette3d.js` khai một độ đậm tuyệt đối cho từng
theme, và điều đó ổn vì chúng đứng một mình. **Mặt đường thì không**: cả công dụng của nó là được
đọc ra như một lối đi TRÊN mặt đất, tức nó là một QUAN HỆ chứ không phải một con số. Viết nó thành
hằng số một lần thì lần sau có ai chỉnh mặt đất là quan hệ ấy gãy trong im lặng — và đã gãy thật:
Phase 3M nâng độ đậm mặt đất ban đêm 0,286 → 0,400, mặt đường giữ nguyên 0,42, nên **suốt nhiều
ngày ban đêm mặt đường tàng hình** (cách mặt đất 0,012–0,020 thay vì 0,13). Nay `road`/`roadLane`
đo mặt đất thật rồi tự đặt mình cách ra, giữ đúng chiều của vật liệu (đường đất SÁNG hơn nền cỏ,
nhựa đường TỐI hơn). Vai màu nào sau này cũng phải "đọc được trên nền X" thì làm y như vậy, đừng
khai một con số rồi tin nó đứng yên.

⚠️ **NHƯNG QUAN HỆ ẤY CHỈ CÓ SÀN, KHÔNG CÓ TRẦN — VÀ ĐÓ LÀ NỬA CÒN LẠI, SỬA Ở PHASE 9D**
(xem **ADR-025**). Phép đẩy của Phase 7D **CỘNG** 0,13 vào chênh lệch riêng của vật liệu chứ không
lấy 0,13 làm sàn cho TỔNG, nên vật liệu nào vốn đã xa mức trung tính thì bị đẩy **hai lần**: nhựa
đường kỷ 11 nhận tổng đẩy 0,289 và render ra độ sáng **0,113** trong khi mặt đất 0,406 — dưới ngưỡng
0,12 mà mắt còn đọc ra chi tiết, **xét riêng vật liệu, trước khi bóng đổ chạm vào**. Con đường thành
cái rãnh. Nay `roadContrastGap` **bão hoà**: sàn 0,13 · trần 0,26 · vẫn đơn điệu ngặt (vật liệu xa
trung tính hơn vẫn nằm xa đất hơn, nên bão hoà không nuốt mất trục vật liệu).

⚠️ **VÀ CÁI TRẦN ẤY MỘT MÌNH KHÔNG ĐỦ — VÌ NÓ LÀM ĐỎ MỘT LỜI HỨA KHÁC, ĐÚNG ĐẮN.** Đây là chỗ
Phase 9D chạm tới KIẾN TRÚC chứ không chỉ chạm tới một con số. Chặn cái rãnh lại nghĩa là thu hẹp
dải độ đậm khả dụng, mà bản sắc *"15 kỷ ra 15 mặt đường"* khi ấy **chỉ nằm trên trục độ đậm** — nên
bài test ấy đỏ ngay ở cặp **11↔13**. Nó đỏ đúng: Manhattan và Tokyo **đều lát nhựa đường**, gần nhau
về màu là sự thật vật lý. Gốc rễ không phải cái trần, mà là **một trục đang gánh việc của mười**.

⇒ **Luồng mới, ba lớp tách bạch** (`engine/city3d/streetStyle.js` → `render3d/terrainMesh.js` →
`palette3d.js`): bảng 15 kỷ × 10 trường trả lời *"con đường kỷ này TRÔNG NHƯ THẾ NÀO"* (bề rộng đại
lộ · bề rộng ngõ · vật liệu lát · cỡ viên · độ mòn · bó vỉa · vỉa hè · vạch kẻ · kiểu mép); tầng vẽ
chỉ DỰNG theo bảng; bảng màu chỉ còn lo MÀU và chỉ còn hai lời hứa về màu (bảng không dẹt · không
hai kỷ trùng khít mã màu). Phép đo bản sắc chuyển sang **8 trục cấu trúc** ở `streetStyle.test.js`.
Ba hệ quả kiến trúc đáng nhớ:
1. **`carriagewayShape` xoá luôn khái niệm `variant` khỏi tầng vẽ.** Bề rộng là đại lượng của MẶT
   CẮT NGANG; bản đầu áp nó lên cả chiều DỌC nên đường vỡ thành những mảng rời rạc. Bản vá 9D —
   *mép giáp ô đường thì vươn tới ranh giới, mép giáp đất thì dừng ở nửa bề rộng* — làm đường dọc,
   ngã tư và đầu đường cụt tự đúng, không cần ba nhánh mã. ⚠️ **Nhưng nó giữ nguyên một giả định
   chưa ai viết ra: lòng đường một ô là MỘT hình chữ nhật** — mà hình chữ nhật chỉ có hai bề rộng
   còn ngã tư cần bốn, nên ngã ba buộc phải phình trọn ô theo hướng có nhánh dù nhánh ấy chỉ rộng
   một phần ba. Đo ở Phase 12: **45% số mép đường có một bậc vuông góc**, bậc lớn nhất 0,380 ô.
   **ADR-031** thay hình chữ nhật bằng **một LÕI + tối đa bốn CÁNH TAY loe**, bề rộng chỗ nối do cả
   hai ô cùng suy ra bằng `min(nửa của tôi, nửa của hàng xóm)` — một phép ĐỐI XỨNG, nên hai ô kề
   nhau không còn cách nào lệch. Đo lại: **0%**. Kèm `MAX_AVENUE = 0,96` (cánh tay cần chỗ để loe;
   `avenue: 1,00` vừa làm cánh tay dài bằng 0 vừa nuốt sạch vỉa hè của chính kỷ ấy).
2. **Cả hệ đường vẫn là MỘT hình học, MỘT vật liệu, MỘT lệnh vẽ.** Bó vỉa/vỉa hè/vạch kẻ phân biệt
   nhau bằng `ROAD_PART` (thuộc tính đỉnh) chứ không bằng mesh riêng — nên số lệnh vẽ đứng yên
   **13 → 13**. Cái giá đã biết và chấp nhận: vỉa hè không có độ nhám riêng, nó chỉ sáng hơn.
3. **Bảng đường buộc cứng vào `eraStyle.js` qua `country`** (có test bắt), y như `floraStyle.js`.
   Không có ràng buộc ấy thì 15 dòng là 15 lần chọn bừa — mà chọn bừa chính là thứ đã sinh ra 15 kỷ
   đường giống hệt nhau ngay từ đầu.

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
