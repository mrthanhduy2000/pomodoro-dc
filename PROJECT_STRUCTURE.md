# Cấu trúc dự án — Pomodoro DC

> Mục tiêu file này: giúp người mới (hoặc phiên AI mới) tìm đúng file trong vài giây, không phải
> đoán mò. Chi tiết quy tắc/lịch sử: xem `CLAUDE.md` + `BAN_GIAO.md`. Bức tranh lớn về kiến trúc
> (luồng dữ liệu, vì sao chia lớp thế này): xem `ARCHITECTURE.md`.
>
> ⚠️ **Cập nhật file này mỗi khi thêm/xoá/đổi tên thư mục** — cấu trúc lệch tài liệu = tài liệu vô dụng.

```
├── src/                      # App React (Vite + PWA) — chạy trên web, dùng chung với Electron
│   ├── components/           # Component React, mỗi file = 1 màn hình hoặc 1 mảnh UI lớn
│   │   ├── shared/           # Component/style dùng chung GIỮA NHIỀU file components khác
│   │   │   └── BadgeKit.jsx      # TypeBadge/RarityBadge/PerkSummary (BuildingWorkshop + BlueprintInventory)
│   │   ├── icons/            # Bộ icon SVG tự vẽ (thay emoji), 1 component Glyph + data tách riêng
│   │   ├── CityView.jsx      # Tab Thành Phố — CHỈ lấy dữ liệu + chọn bộ vẽ, giữ mỏng có chủ ý
│   │   ├── city/             # Màn hình Thành Phố. Luật: KHUNG tách khỏi BỘ VẼ (ADR-008)
│   │   │   ├── CityViewShell.jsx # KHUNG: chuyển kỷ, số liệu, trạng thái rỗng. KHÔNG biết bộ vẽ
│   │   │   │                     #   nào đang chạy — bộ vẽ vào qua `children` và TỰ định kích thước
│   │   │   ├── EraSwitcher.jsx   # Thanh chuyển giữa các kỷ trong bảo tàng
│   │   │   │                     #   ⚠️ Tự cuộn kỷ đang xem vào tầm mắt, và phải căn LẠI qua
│   │   │   │                     #   ResizeObserver (font nạp xong mới tràn) — xem BAN_GIAO 3J
│   │   │   ├── BuildingCard.jsx  # Thẻ hiện ra khi CHẠM vào một công trình trong cảnh 3D.
│   │   │   │                     #   Thuần trình bày — nhận sẵn phần tử của layout, không tra cứu
│   │   │   ├── CityGrowthMoment.jsx # 3,2 GIÂY THÀNH PHỐ LỚN LÊN, chen giữa "hết phiên" và hộp
│   │   │   │                     #   thoại phần thưởng. ⚠️ Đứng CHẶN TRƯỚC màn hình phần thưởng
│   │   │   │                     #   của một phiên THẬT ⇒ mọi thứ hỏng-theo-hướng-mở (ADR-010).
│   │   │   │                     #   KHÔNG dựng cảnh 3D ở đây (context WebGL thứ hai)
│   │   │   ├── cityTokens.js     # Token DÙNG CHUNG mọi bộ vẽ: eraTint/eraSolid/cardStyle
│   │   │   ├── render2d/         # Bộ vẽ SVG isometric — nền VĨNH VIỄN, không phải bản nháp:
│   │   │   │                     #   đường lui khi máy không có WebGL / mất context / Đàm chọn 2D
│   │   │   │   ├── CityCanvas2D.jsx # Gộp 144 ô nền thành 4 <path> (ngân sách ≤200 phần tử DOM)
│   │   │   │   ├── CityTile.jsx     # MỘT vật thể nổi (nhà/cảnh vật). Ô nền KHÔNG đi qua đây
│   │   │   │   └── tokens2d.js      # Kích thước ô + bảng màu rgba() + phép chiếu — CHỈ hợp SVG/CSS
│   │   │   ├── CityStage.jsx     # CHỌN bộ vẽ + tự lùi về 2D khi 3D hỏng. Nạp LƯỜI render3d
│   │   │   │                     #   Có CHẾ ĐỘ LỚP NỀN (chrome/still/fill/interactive) — cùng một
│   │   │   │                     #   bộ vẽ, hai vai trò: màn hình để ngắm vs khung cảnh phía sau
│   │   │   ├── CityBackdrop.jsx  # THÀNH PHỐ RA TRANG CHỦ: lớp nền mờ sau đồng hồ ở trang Tập
│   │   │   │                     #   Trung. ⚠️ Đang chạy phiên (và mọi lúc trên điện thoại) thì
│   │   │   │                     #   ĐỨNG YÊN — luật pin, xem ghi chú trong file
│   │   │   ├── CityPerfHud.jsx   # Bảng FPS/lệnh vẽ/tam giác — để đo cổng hiệu năng Phase 3A
│   │   │   └── render3d/         # Bộ vẽ three.js — ⚠️ NƠI DUY NHẤT được import 'three'
│   │   │       ├── CityScene3D.jsx # Vỏ React: vòng đời, resize, mất context. KHÔNG chứa logic 3D
│   │   │       ├── sceneGraph.js   # Dựng cảnh: nền/đường/trời/đất + ánh sáng 3 nguồn + cư dân
│   │   │       ├── geometryFactory.js # Mô tả hình học THUẦN → MỘT BufferGeometry đã gộp.
│   │   │       │                   #   Mọi công trình + cảnh vật = 1 lệnh vẽ, nên "75 công trình
│   │   │       │                   #   khác nhau" KHÔNG đồng nghĩa với 75 lệnh vẽ
│   │   │       ├── themeBridge.js  # Đọc CSS var từ đúng div [data-theme] (KHÔNG documentElement)
│   │   │       └── capability.js   # Dò WebGL2 bằng cách TẠO THỬ context rồi huỷ ngay
│   │   ├── Coach*.jsx         # 3 lối vào AI Coach: CoachChat (hỏi-đáp), CoachOffline (phân tích
│   │   │                     #   tổng thể), CoachNudge (tự nhắc sau phiên) — logic AI thật nằm ở
│   │   │                     #   src/engine/coach/, các file này chỉ là UI + gọi engine.
│   │   ├── StatsDashboard.jsx # Tab Thống kê — LỚN NHẤT dự án (biểu đồ, nhật ký phiên, bộ lọc).
│   │   │                     #   Hàm định dạng thuần đã tách ra statsFormatters.js cạnh nó.
│   │   ├── PomodoroEngine.jsx # Khung chính chứa đồng hồ Pomodoro/Stopwatch (UI, logic timer
│   │   │                     #   thật nằm ở src/hooks/useTimer.js)
│   │   └── ...                # Các màn hình còn lại: Achievements, SkillTree, BuildingWorkshop,
│   │                          #   BlueprintInventory, RelicInventory, Settings, DailyMissions...
│   ├── engine/                # Logic THUẦN (không JSX, không Zustand) — công thức game, dễ test
│   │   ├── coach/             # TOÀN BỘ "bộ não" AI Coach (model-agnostic, hiện chạy Gemini)
│   │   │   ├── prompt.js          # 2 prompt hệ thống (chat/phân tích) + dựng prompt + sanitize
│   │   │   ├── guard.js           # LƯỚI CHỐNG-BỊA tất định — "tài sản quý nhất", xem ARCHITECTURE.md
│   │   │   ├── guardedGenerate.js # pipeline gọi Gemini → sanitize → guard, dùng chung 3 Coach*.jsx
│   │   │   ├── cloudEngine.js     # gọi /api/coach (Gemini qua server), xử lý timeout/lỗi
│   │   │   ├── coachContext.js    # gói số liệu thật thành "bảng dữ liệu" cho prompt đọc
│   │   │   ├── coachIntel.js      # hồ sơ tập trung + dự đoán (Wilson lower bound, "giờ vàng"...)
│   │   │   ├── coachSuggest.js    # chọn câu hỏi gợi ý theo ngữ cảnh (thuần luật, không AI)
│   │   │   ├── coachAdviceMemory.js # nhớ lời khuyên đã đưa để đối chiếu theo thời gian
│   │   │   ├── coachEvalFixtures.js  # ~30 câu mẫu (sạch/bịa) cho eval.test.js
│   │   │   └── *.test.js          # test đi kèm từng file cùng tên
│   │   ├── gameMath.js        # Công thức tính điểm/XP/streak/thống kê — file LỚN, sửa cẩn thận
│   │   ├── constants.js       # Toàn bộ dữ liệu tĩnh của game (kỹ năng, công trình, thành tích...)
│   │   ├── cityLayout.js      # THÀNH PHỐ PIXEL: suy ra bố cục từ danh sách công trình (băm tất
│   │   │                     #   định, KHÔNG lưu toạ độ). Bất biến: cùng đầu vào → cùng bố cục
│   │   │                     #   vĩnh viễn + xây thêm nhà không làm xê dịch nhà cũ.
│   │   ├── cityArchive.js     # THÀNH PHỐ PIXEL: "bảo tàng" các kỷ đã niêm phong (ghi lại công
│   │   │                     #   trình bị cắt khi lên kỷ, thay vì để mất hẳn)
│   │   ├── cityMoment.js      # Điều đáng nói nhất về thành phố NGAY SAU phiên vừa xong.
│   │   │                     #   ⚠️ Trả `null` khi thành phố không đổi gì — thà im lặng còn hơn
│   │   │                     #   một câu chúc mừng rỗng (cùng luật chống-bịa với AI Coach)
│   │   ├── city3d/            # Logic THUẦN của bộ vẽ 3D — cấm import three, cấm DOM
│   │   │   ├── renderMode.js      # Luật chọn 3D/2D (FAIL-CLOSED: không chắc → 2D)
│   │   │   ├── renderLoop.js      # Nhịp khung hình: đứng yên = 0 nhịp rAF + trần FPS khi có hoạt hoạ
│   │   │   ├── orbit.js           # Toán camera xoay (tự viết, KHÔNG dùng OrbitControls)
│   │   │   ├── palette3d.js       # Token màu CSS → số cho WebGL, + vai màu cho ngôn ngữ hình khối
│   │   │   │                      #   ⚠️ NGOẠI LỆ DUY NHẤT của luật "cấm hex, chỉ CSS var":
│   │   │   │                      #   WebGL không đọc được biến CSS (xem ARCHITECTURE.md)
│   │   │   ├── parts.js           # TỪ VỰNG hình khối: prism (đa giác + thóp) và gable. CHỈ 2 hình
│   │   │   │                      #   nguyên thuỷ — hộp/chóp/trụ/nón/vòm đều là prism đổi tham số
│   │   │   ├── eraStyle.js        # NGỮ PHÁP theo 15 kỷ: vật liệu, kiểu mái, cửa sổ, mô-típ
│   │   │   ├── archetypes.js      # Bóng dáng theo 4 LOẠI (hạ tầng/kinh tế/phòng thủ/kỳ quan)
│   │   │   │                      #   + quy mô theo 3 ĐỘ HIẾM
│   │   │   ├── buildingSpec.js    # NƠI 3 TRỤC GẶP NHAU: (kỷ × loại × độ hiếm) → mô tả hình học
│   │   │   ├── propSpec.js        # Cây, đá, đèn, mặt nước, ruộng
│   │   │   │                      #   ⚠️ Mặt nước dùng vai màu RIÊNG (`water`), KHÔNG dùng chung
│   │   │   │                      #   `glass` với cửa sổ — vai `glass` ban đêm TỰ PHÁT SÁNG, ao
│   │   │   │                      #   mà mượn vai đó sẽ thành hộp đèn (xem parts.js)
│   │   │   ├── daylight.js        # 6 CHẶNG TRONG NGÀY: hướng/độ ấm/cường độ nắng, đèn nền, sắc
│   │   │   │                      #   trời, đèn cửa sổ, đèn hắt ra sân. THUẦN — nhận GIỜ làm tham
│   │   │   │                      #   số, không đụng `Date` (tầng ngoài lo lấy giờ Việt Nam)
│   │   │   ├── residents.js       # CƯ DÂN: dân số suy từ tiến độ, tuyến đi bám ĐƯỜNG SÁ
│   │   │   │                      #   ⚠️ residentAt(route, TIME) — chuyển động là hàm của thời
│   │   │   │                      #   gian, không phải biến cộng dồn (test được + rời tab đúng)
│   │   │   ├── pick.js            # CHẠM VÀO CÔNG TRÌNH: hộp bao + tia cắt hộp, THUẦN
│   │   │   │                      #   ⚠️ Không dùng Raycaster của three: cả thành phố gộp thành
│   │   │   │                      #   MỘT mesh (1 lệnh vẽ), ném tia vào đó chỉ biết trúng "thành
│   │   │   │                      #   phố" chứ không biết trúng CĂN NÀO (xem ARCHITECTURE.md)
│   │   │   └── budget.js          # Trần tam giác — biến ngân sách hiệu năng thành test tự kiểm
│   │   ├── achievementTimeline.js # Suy luận ngày mở khoá thành tích cũ (replay lịch sử)
│   │   ├── audioContext.js    # Khởi tạo/resume AudioContext dùng chung cho soundEngine/ambientEngine
│   │   ├── soundEngine.js / ambientEngine.js # Âm thanh 100% procedural (Web Audio API)
│   │   ├── pushPayloads.js    # Nội dung thông báo push (title/body/tag) — dùng chung client+server
│   │   ├── time.js            # Helper giờ/ngày/tuần theo múi giờ VN (mọi engine phải dùng cái này)
│   │   ├── timerSession.js / breaks.js / challengeEngine.js / notifications.js # engine chuyên biệt khác
│   ├── hooks/                 # React hook — cầu nối giữa store và engine/component
│   │   ├── useTimer.js         # LỚN — toàn bộ state machine đồng hồ Pomodoro/Stopwatch
│   │   ├── useCoachContext.js  # build bảng số liệu cho AI Coach (gọi engine/coach/coachContext.js)
│   │   ├── useCityGrowthMoment.js # Cầu nối store → engine/cityMoment.js. Chỉ tính khi được bật
│   │   └── useGameLoop.js
│   ├── lib/                   # Tích hợp dịch vụ ngoài (KHÔNG phải logic game thuần)
│   │   ├── supabase.js         # Supabase client (anon key, hardcode — không cần .env)
│   │   ├── syncService.js      # Đồng bộ 2 chiều "First Action Wins" (xem ARCHITECTURE.md)
│   │   ├── timerLiveService.js # Đồng bộ trạng thái timer cho Electron tray + push webhook
│   │   ├── pushService.js      # Web Push phía trình duyệt (đăng ký, huỷ, lên lịch)
│   │   └── appIdentity.js      # Hằng số key localStorage, tên app (đổi tên app thì sửa ở đây)
│   ├── store/                  # State toàn app (Zustand)
│   │   ├── gameStore.js         # RẤT LỚN (~6000 dòng) — mọi state + action của game. Điểm nóng:
│   │   │                       #   completeFocusSession (~760 dòng). Sửa công thức → gameMath.js,
│   │   │                       #   ĐỪNG nhồi thêm vào đây.
│   │   └── settingsStore.js     # Cài đặt UI riêng (theme, âm thanh...) — KHÔNG lẫn với gameStore
│   └── utils/                  # Tiện ích thuần, dùng nhiều nơi không liên quan game logic
│       ├── labelMark.js         # Sinh ký hiệu 1-2 chữ cho badge tròn (dùng ở 7 nơi)
│       ├── richText.js          # Parser rich-text (bold/italic/link/màu...) dùng bởi RichText.jsx
│       ├── importSummary.js     # Đọc tóm tắt file backup khi import
│       └── runtimeRecovery.js   # Bẫy lỗi runtime (crash recovery) + `createRecoverableLazy`.
│                               #   Có `preload()`: nạp trước gói mã khi biết sắp cần (không hiện
│                               #   gì) — xem ADR-010
│
├── api/                       # Vercel Serverless Functions — MỖI file .js trực tiếp trong đây
│   │                          #   (trừ thư mục bắt đầu bằng "_") = 1 Serverless Function thật.
│   │                          #   Giới hạn 12 function/deploy (gói Free) — xem CLAUDE.md.
│   ├── _lib/                   # Helper dùng chung giữa các route — KHÔNG bị tính là function
│   │   ├── http.js              # readJsonBody/sendJson/methodNotAllowed/isCronAuthorized
│   │   ├── push.js               # Supabase admin client + gửi Web Push + isSessionEndEvent
│   │   ├── gemini.js             # Hàm thuần gọi Gemini (chọn model, dựng body, đọc phản hồi)
│   │   └── coachDigest.js        # Hàm thuần cho cron cảnh báo chuỗi sắp đứt
│   ├── _tests/                 # TOÀN BỘ test của api/ — cũng không bị tính là function
│   │   ├── _lib/                 # test cho api/_lib/*.js
│   │   └── push/                 # test cho api/push/*.js
│   ├── coach.js                # Cổng gọi Gemini (giữ GEMINI_API_KEY ở server)
│   ├── coach-digest.js         # CRON hằng ngày — cảnh báo chuỗi sắp đứt qua push
│   ├── keepalive.js            # CRON hằng ngày — giữ Supabase project không tự pause
│   └── push/                   # Web Push: subscribe/unsubscribe/schedule/cancel/dispatch...
│
├── electron/                   # App phụ Mac (menu bar/tray) — mở URL Vercel, đọc timer từ Supabase
├── public/                     # Asset tĩnh (icon, service worker push-worker.js, manifest PWA)
├── scripts/                    # Công cụ dev chạy tay (không vào app) — xem CLAUDE.md mục nào còn dùng
├── supabase/                   # SQL chạy TAY trong Supabase SQL Editor (không tự động migrate)
│
├── CLAUDE.md                   # Quy tắc bắt buộc + Project Governance Protocol + bối cảnh kỹ thuật
│                               #   NGUỒN SỰ THẬT DUY NHẤT về quy tắc, cho MỌI AI (không riêng Claude)
├── AGENTS.md                    # Điểm vào cho Codex — CHỈ là con trỏ sang CLAUDE.md, KHÔNG chép nội dung
├── BAN_GIAO.md                  # Nhật ký "đang ở đâu, làm gì tiếp" — đọc TRƯỚC CLAUDE.md mỗi phiên
├── ARCHITECTURE.md              # Bức tranh kiến trúc lớn (luồng dữ liệu, vì sao chia lớp thế này)
├── PROJECT_STRUCTURE.md         # File này
├── ARCHITECTURE_DECISIONS.md    # ADR — vì sao từng quyết định kiến trúc được chọn (không chỉ thế nào)
├── TECH_DEBT.md                 # Nợ kỹ thuật đã biết, có cấu trúc (priority/severity/risk/owner...)
├── MIGRATION.md                 # Lịch sử migration THẬT (schema/API/path/workflow đổi)
├── CHANGELOG.md                 # Tóm tắt chính thức theo mốc (không phải lịch sử commit)
├── AI_ONBOARDING.md              # Đọc nhanh 10-15 phút cho AI mới
└── AI_HANDOFF_KNOWLEDGE.md       # Bàn giao tri thức ĐẦY ĐỦ nhất, viết cho AI không đọc được code
```

## Quy tắc đặt file mới (để khỏi lại rối theo thời gian)

- **Logic thuần (không JSX, test được, không đụng Zustand/DOM)** → `src/engine/` (hoặc
  `src/engine/coach/` nếu liên quan AI Coach). KHÔNG nhồi vào `gameStore.js` hay component.
- **Component dùng CHUNG từ 2 file trở lên** → `src/components/shared/`. Component chỉ 1 nơi dùng
  thì cứ để trong chính file đó hoặc file component tương ứng.
- **Một màn hình lớn cần nhiều mảnh riêng của nó** → thư mục cùng tên chữ thường cạnh file màn hình
  (`CityView.jsx` + `city/`), KHÔNG đổ vào `shared/` (chỗ đó dành cho thứ dùng chung THẬT).
- **Nhiều cách trình bày cùng một dữ liệu** (2D/3D, in/màn hình…) → mỗi cách MỘT thư mục con
  (`city/render2d/`, `city/render3d/`), và thứ chỉ đúng với một cách thì nằm TRONG thư mục đó
  (`tokens2d.js` là bảng màu `rgba()` + phép chiếu isometric — WebGL không dùng lại được). Thư mục
  cha chỉ giữ phần dùng chung. Lý do đầy đủ: ADR-008.
- **Test** luôn đặt CẠNH file nguồn, cùng tên + `.test.js` (vd `guard.js` → `guard.test.js`), ở
  **bất kỳ độ sâu nào** — glob trong `package.json` quét đệ quy nên thêm thư mục mới KHÔNG cần sửa
  `package.json`. (Trước 2026-08-12 glob chỉ quét một cấp và test trong thư mục con sẽ im lặng
  không bao giờ chạy — xem `TECH_DEBT.md` #10.)
  Riêng test của `api/` bắt buộc đặt trong `api/_tests/` (mirror cấu trúc `api/`) — xem lý do ở
  `CLAUDE.md` mục "Vercel Hobby: giới hạn 12 Serverless Functions".
- **Route API mới** → thêm file trực tiếp trong `api/` hoặc `api/push/`, rồi đếm lại tổng số
  function thật: `find api -type f -name "*.js" ! -path "api/_*"` (phải luôn ≤ 12).
- **Helper dùng chung giữa client (`src/`) và server (`api/`)** (vd nội dung thông báo push) →
  đặt trong `src/engine/` (file thuần, không import gì đặc thù Node/browser), cả hai phía cùng
  import từ đó — xem `src/engine/pushPayloads.js` làm ví dụ.

## Quy tắc import (hiện trạng THẬT đã verify — không phải lý tưởng hoá)

- **Chỉ dùng relative import** (`./foo`, `../engine/gameMath`) — repo KHÔNG cấu hình path alias
  nào (không có `@/` trong `vite.config.js`, đã grep xác nhận 0 kết quả). Đừng tự ý thêm alias trừ
  khi được yêu cầu rõ ràng — thêm giữa chừng sẽ tạo 2 phong cách import lẫn lộn trong cùng codebase.
- **KHÔNG có file `index.js`/`index.jsx` barrel export nào trong `src/`** (đã grep xác nhận 0 kết
  quả) — mỗi nơi import trực tiếp từ đường dẫn cụ thể của module cần dùng, không qua một điểm gom
  re-export. Giữ nguyên quy ước này khi thêm thư mục mới (kể cả `src/engine/coach/`).
- **Hướng import phải theo đúng chiều phụ thuộc** ở `ARCHITECTURE.md` mục 7: `src/engine/` không
  bao giờ import từ `src/store/`/`src/components/`/`src/hooks/`.

## Quy tắc đặt tên

- **Component React** (`.jsx`) → PascalCase, tên file = tên component (`PomodoroEngine.jsx` export
  `PomodoroEngine`).
- **File logic thuần/hook/lib** (`.js`) → camelCase (`gameMath.js`, `useTimer.js`, `syncService.js`).
- **Test** → luôn cùng tên file nguồn + hậu tố `.test.js` (`guard.js` → `guard.test.js`), đặt CẠNH
  file nguồn (trừ `api/`, xem quy tắc test ở trên).
- **Hằng số cấp module** → SCREAMING_SNAKE_CASE (`XP_FACTOR_HARD_CAP`, `COACH_MIN_SAMPLE`).
- **Route API** → tên file = tên endpoint, camelCase hoặc kebab-case ngắn gọn khớp URL
  (`coach-digest.js` → `/api/coach-digest`).
