# Migration Log — Pomodoro DC

> Chỉ ghi khi có: đổi API, đổi module/đường dẫn, đổi workflow, đổi state/schema, đổi storage, đổi
> database, đổi folder. KHÔNG ghi thay đổi thông thường không phá vỡ tương thích — việc đó thuộc
> về `CHANGELOG.md`. Đây là một phần bắt buộc của Project Governance Protocol (xem `CLAUDE.md`).
>
> Mỗi mục ghi: **cái gì đổi**, **vì sao**, **có phá vỡ tương thích ngược không**, **cần làm gì khi
> nâng cấp** (nếu còn ai chưa migrate — với app 1 người dùng, mục này chủ yếu để hiểu LỊCH SỬ, ít
> khi cần "migrate" thật theo nghĩa nhiều người dùng).

---

## 2026-07-12 — Gom `src/engine/llm/` vào `src/engine/coach/`, tách `coachPrompt.js` thành `prompt.js` + `guard.js`

- **Đổi gì**: toàn bộ AI Coach engine (từng rải rác giữa `src/engine/llm/` và `src/engine/` gốc)
  dời vào một thư mục duy nhất `src/engine/coach/`. File `coachPrompt.js` (404 dòng) tách thành
  `prompt.js` (mẫu câu/prompt builder) + `guard.js` (toàn bộ hàm chống-bịa). Test đổi tên:
  `coachGuard.test.js` → `guard.test.js`, `coachEval.test.js` → `eval.test.js`.
- **Vì sao**: chuẩn hoá cấu trúc thư mục theo domain rõ ràng (yêu cầu refactor kiến trúc của Đàm).
- **Phá vỡ tương thích ngược?**: Không đối với người dùng cuối (không đổi hành vi runtime nào).
  CÓ đối với bất kỳ import path cũ nào (`src/engine/llm/...`) — nhưng vì đây là app 1 người dùng
  không có consumer bên ngoài, mọi import nội bộ đã được cập nhật đồng thời trong cùng commit.
- **Verify**: `npm test` giữ nguyên điểm chống-bịa (BẮT 16/16, BÁO NHẦM 0/16) sau khi dời — xác
  nhận 0 thay đổi hành vi.
- **Cần làm gì**: không cần hành động gì thêm — đã hoàn tất trong 1 commit.

## 2026-07-12 — Tách hàm thuần Gemini ra `api/_lib/gemini.js`, dời test

- **Đổi gì**: `shouldFallback`/`buildModelChain`/`toGeminiBody`/`extractGeminiText` (từng nằm trong
  `api/coach.js`) dời sang `api/_lib/gemini.js`. Test tương ứng dời từ `api/_tests/coach.test.js`
  sang `api/_tests/_lib/gemini.test.js`.
- **Vì sao**: tách hàm thuần khỏi route handler, đúng quy ước `_lib` cho helper dùng chung.
- **Phá vỡ tương thích ngược?**: Không — `api/coach.js` vẫn là route handler thật duy nhất, chỉ
  import lại từ vị trí mới.
- **Cần làm gì**: không cần hành động gì thêm.

## 2026-07-11 — Test API dời từ cạnh route handler vào `api/_tests/` (mirror cấu trúc)

- **Đổi gì**: 5 file `*.test.js` từng nằm lẫn trong `api/`/`api/push/` dời vào `api/_tests/`
  (mirror cấu trúc, vd `api/_tests/push/dispatch.test.js`). `package.json` test glob cập nhật.
- **Vì sao**: fix tận gốc lỗi deploy Vercel vượt trần 12 Serverless Functions — xem
  `ARCHITECTURE_DECISIONS.md` ADR-005.
- **Phá vỡ tương thích ngược?**: Không đối với hành vi test (cùng bài test, khác vị trí file).
  **CÓ** đối với QUY TẮC bắt buộc từ nay: test API mới PHẢI đặt trong `api/_tests/`, không được
  đặt cạnh route handler nữa — vi phạm quy tắc này có nguy cơ tái tạo sự cố vượt trần function.
- **Cần làm gì**: bất kỳ ai (AI hoặc người) thêm route API mới phải nhớ đặt test đúng vị trí.

## 2026-07-11 — Sync: `LAST_CLOUD_SYNC_KEY` (timestamp) → `LAST_CLOUD_VERSION_KEY` (version số nguyên)

- **Đổi gì**: `src/lib/appIdentity.js` đổi khoá localStorage lưu "mốc đồng bộ cuối" từ một
  timestamp ISO do client tự ghi sang một số nguyên `version` do server cấp qua trigger Postgres.
- **Vì sao**: chuyển cơ chế sync từ "ai ghi cuối thắng" (dựa đồng hồ client) sang "First Action
  Wins" (compare-and-swap dựa version phía server) — xem `ARCHITECTURE_DECISIONS.md` ADR-004.
- **Phá vỡ tương thích ngược?**: **CÓ, và NGHIÊM TRỌNG** — deploy code mới PHẢI chạy
  `supabase/game_state_version.sql` TRƯỚC (hoặc gần như đồng thời). Thiếu cột `version` trên bảng
  `game_state` khiến MỌI LẦN GHI LỖI (`column "version" does not exist`) → sync ngừng hẳn cho tới
  khi SQL được chạy tay. Đây là ví dụ điển hình của rủi ro "deploy code phụ thuộc schema DB chưa
  tồn tại" — luôn kiểm tra `supabase/*.sql` tương ứng trước khi deploy code liên quan.
- **Cần làm gì**: nếu tái tạo lại project Supabase mới (ví dụ chuyển hạ tầng), PHẢI chạy lại
  `supabase/game_state_version.sql` trước khi dùng code hiện tại.

## 2026-06-25 → 2026-07-11 — `GAME_STORE_SCHEMA_VERSION` bump 0 → 1 → 2 → 3

- **Đổi gì**: 3 lần tăng version schema persisted state, mỗi lần kèm một hàm migrate trong
  `migratePersistedGameState` (gameStore.js):
  - **v0→v1**: chuẩn hoá lại hình dạng `timerSession`/`forgiveness`.
  - **v1→v2**: `migrateV1ToV2Skills` — refund SP cho các kỹ năng V1 đã bị gỡ (`khoi_dong_nhanh`,
    `y_chi_thep`, `bat_khuat`, `kho_du_tru`, `chuyen_gia`, `da_nang`, `chuyen_mon_hoa`, `can_bang`),
    ghi `_pendingV2MigrationNotice` để UI hiện toast 1 lần thông báo cho người chơi.
  - **v2→v3**: clamp cột `tinhThe` (TTCH) vào khoảng `[0, TINH_THE_HARD_CAP]` — đánh dấu "idempotent,
    backup-only" vì đường tải web THẬT đi qua `normalizePersistedGameState` (hàm `merge` của
    zustand persist), không phải qua `migratePersistedGameState` (chỉ chạy khi rehydrate từ
    localStorage với `fromVersion` cũ hơn).
- **Vì sao**: mỗi lần thay đổi cấu trúc lưu trữ đáng kể (gỡ kỹ năng cũ, thêm giới hạn TTCH) cần
  một đường di trú an toàn cho dữ liệu đã lưu từ trước.
- **Phá vỡ tương thích ngược?**: Không đối với người chơi hiện tại — mỗi bump có migrate function
  xử lý êm, không mất dữ liệu (v1→v2 còn chủ động refund công bằng cho người chơi bị ảnh hưởng).
- **Cần làm gì**: không cần hành động — các bump này đã lùi vào lịch sử, chỉ ghi lại để hiểu tại
  sao `migratePersistedGameState` có nhiều nhánh `fromVersion`.
- **Lưu ý quan trọng cho tương lai**: `normalizePersistedGameState` (hàm `merge`) mới là "đường
  tải web THẬT" chạy trên MỌI lần hydrate — `migratePersistedGameState` chỉ là một lớp bổ sung cho
  trường hợp cụ thể `fromVersion` cũ hơn hiện tại. Đừng nhầm lẫn 2 cơ chế này khi thêm version mới.

## (không rõ ngày chính xác) — Đổi tên app: khoá localStorage `civjourney-v1` → `dc-pomodoro-v1`

- **Đổi gì**: đổi tên sản phẩm kéo theo đổi khoá lưu trữ chính trong `localStorage`.
- **Vì sao**: đổi thương hiệu/tên app (không rõ chi tiết đầy đủ — xảy ra trước các bản ghi nhật ký
  hiện có trong `BAN_GIAO.md`).
- **Phá vỡ tương thích ngược?**: Đã xử lý — code vẫn ĐỌC ĐƯỢC khoá cũ `civjourney-v1` nếu khoá mới
  chưa tồn tại, để không mất dữ liệu người dùng từ trước khi đổi tên.
- **Cần làm gì**: không cần hành động — cơ chế đọc cả 2 khoá đã tồn tại sẵn trong code.

## (không rõ ngày chính xác) — Thêm cột `mode`/`ended_reason` cho bảng `timer_live`

- **Đổi gì**: thêm 2 cột tuỳ chọn vào bảng Supabase `timer_live` (`supabase/timer_live_session_reason.sql`)
  để phân biệt "đang chạy Pomodoro/Stopwatch/nghỉ" và "lý do kết thúc" (hoàn thành/huỷ/reset).
- **Vì sao**: cần thiết để `isSessionEndEvent` (api/_lib/push.js) phân biệt chính xác một hoàn
  thành THẬT với một huỷ/reset trông giống hệt nhau về mặt hình dạng dữ liệu.
- **Phá vỡ tương thích ngược?**: Không — `src/lib/timerLiveService.js` có fallback tự động thử
  lại KHÔNG kèm 2 cột này nếu Supabase báo lỗi thiếu cột (`isMissingOptionalColumnError`), nghĩa là
  code hiện tại vẫn chạy được (giảm tính năng, không crash) trên một schema `timer_live` cũ chưa
  chạy migration SQL này.
- **Cần làm gì**: nếu tái tạo project Supabase mới, nên chạy `supabase/timer_live_session_reason.sql`
  để có đầy đủ tính năng phân biệt lý do kết thúc (nếu không, app vẫn chạy nhưng một số logic chống
  báo-nhầm-thông-báo sẽ kém chính xác hơn).

---

## Ghi chú vận hành

- File này chỉ có giá trị nếu được cập nhật NGAY khi một migration thật xảy ra — một migration
  không được ghi lại ở đây sẽ khiến bất kỳ ai (AI hoặc người) dựng lại hạ tầng từ đầu (ví dụ tạo
  Supabase project mới) gặp lỗi khó hiểu vì thiếu bước migrate cần thiết.
- Không bịa ngày nếu không chắc chắn — ghi "không rõ ngày chính xác" (áp dụng cùng nguyên tắc
  chống-bịa như `ARCHITECTURE_DECISIONS.md`).
