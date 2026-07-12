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

## 7. Tầng lưu trữ (storage flow), database schema flow, và hướng phụ thuộc (dependency)

**Storage — 3 tầng độc lập, mỗi tầng một mục đích**: `localStorage` (bản sao tức thời, luôn có sẵn
kể cả offline) + Supabase `game_state` (bản đồng bộ đám mây, nguồn thật khi xung đột đa thiết bị)
+ file JSON export/import thủ công (bản sao lưu tay). Cả 3 đường ghi vào state sống đều PHẢI đi
qua đúng MỘT hàm `normalizePersistedGameState` (gameStore.js) — phễu an toàn duy nhất chống dữ
liệu hỏng/cũ/thiếu trường phá vỡ app. Xem `MIGRATION.md` cho lịch sử các lần schema version bump
(0→1→2→3) đi qua phễu này.

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
