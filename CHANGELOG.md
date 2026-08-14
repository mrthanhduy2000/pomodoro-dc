# Changelog — Pomodoro DC

> Đây KHÔNG phải lịch sử commit, và KHÔNG phải bản sao của `BAN_GIAO.md`. File này là bản tóm tắt
> CHÍNH THỨC, NGẮN GỌN theo mốc thay đổi quan trọng — chỉ ghi mục đích/phạm vi/ảnh hưởng/tương
> thích, để người đọc (hoặc AI) nắm nhanh project đã tiến hoá thế nào theo thời gian mà không phải
> đọc hết nhật ký chi tiết.
>
> **Muốn xem bối cảnh đầy đủ, lý do từng dòng, số liệu test chính xác từng lần** → đọc mục "Nhật ký
> cập nhật" trong `BAN_GIAO.md` (đó mới là nguồn chi tiết đầy đủ nhất, cập nhật ngay sau mỗi việc).
> **Muốn hiểu VÌ SAO một quyết định được chọn** → `ARCHITECTURE_DECISIONS.md`. **Muốn biết migration
> cụ thể nào cần chạy** → `MIGRATION.md`.

---

## 2026-08-14 — Đường sá thành mạng lưới thật (Phase 5C)

- **Mục đích**: Đàm — *"đường đi cũng nên phức tạp hơn"*. Mạng cũ là một dấu cộng: 23 ô trên lưới
  144 ô.
- **Phạm vi**: `engine/cityLayout.js` (`ROAD_CELLS` bốn trục, ba hạng đường, tách
  `MAX_SCATTER_PROPS` khỏi `MAX_PROPS`) · `components/city/render3d/sceneGraph.js` (`LANE_WIDTH`,
  `buildInstances` nhận thêm `sx`/`sz` tuỳ chọn).
- **Ảnh hưởng**: 44 ô đường chia thành phố thành các ô phố; mỗi công trình có mặt tiền quay ra
  đường; số phiên có thứ nhúc nhích trên bản đồ tăng 23 → 44. Ngân sách DOM của bộ vẽ 2D dự phòng
  nới 200 → 230, phần tăng nằm trọn ở đa giác phẳng; số cảnh vật KHỐI siết lại 48 → 34.
- **Tương thích**: KHÔNG đổi state, KHÔNG đổi schema, KHÔNG đổi cân bằng game. Đường sá vốn được
  SUY RA từ số phiên chứ không lưu, nên thành phố cũ trong bảo tàng tự có mạng đường mới.

---

## 2026-08-14 — 15 kỷ, 15 dáng nhà, 15 đất nước (Phase 5A + 5B)

- **Mục đích**: Đàm phản hồi sau khi nhìn thành phố thật — đêm quá tối, camera thu quá xa nên chi
  tiết bị mờ, và *"không thể nào nhà hiện đại lại giống nhà thời đồ đồng được"*. Đo lại thì kỷ 1 và
  kỷ 14 chênh nhau đúng 13% chiều cao.
- **Phạm vi**: `engine/city3d/daylight.js` (độ sáng đêm) · `engine/city3d/orbit.js` (khung hình
  theo kỷ + `CITY_CAMERA_FOV`) · `engine/city3d/eraStyle.js` (`massScale`/`spread`/`country`/
  `landmark` cho 15 kỷ, sửa dáng lều kỷ 1) · `engine/city3d/buildingSpec.js` (nối hai hệ số vào
  chiều cao, mặt bằng, chi tiết đặc trưng và giàn giáo) · `components/city/CityViewShell.jsx`
  (dòng "Kiến trúc lấy mẫu từ …") · `CityScene3D.jsx` + `scripts/city-preview.mjs` (dùng chung FOV).
- **Ảnh hưởng**: chiều cao 15 kỷ trải từ 1,88 lên **3,16 lần**; không kỷ nào bị cắt ngọn; kỷ nhà
  thấp được đóng khung gần hơn mức Phase 5A. Ngân sách tam giác GIẢM (2.592 → 2.208 cho công trình
  nặng nhất) vì nhà thấp thôi sinh nhiều hàng cửa sổ vô nghĩa.
- **Tương thích**: KHÔNG đổi state, KHÔNG đổi schema, KHÔNG đổi cân bằng game. Thành phố cũ trong
  bảo tàng vẫn dựng lại từ đúng dữ liệu cũ — chỉ tỉ lệ hình khối đổi, đúng như mọi lần chỉnh mỹ
  thuật trước đây.

---

## 2026-08-13 — Trùng tu di sản: xây bù công trình của kỷ đã qua (ADR-012)

- **Mục đích**: `TECH_DEBT #14` đo được 95% số phiên tập trung không có lễ mừng nào, vì cả game chỉ
  có 420 bước xây. Đàm chọn hướng (b2): mở cho xây bù bản vẽ kỷ cũ, công trình xong đứng trong bảo
  tàng của kỷ đó.
- **Phạm vi**: `engine/constants.js` (`LEGACY_QUEUE_SLOTS`) · `engine/eraLegacy.js` (3 hàm thuần
  mới) · `store/gameStore.js` (`startCrafting` tách hai diện) · `components/BuildingWorkshop.jsx`
  (mục "Trùng tu di sản") · `ARCHITECTURE_DECISIONS.md` (ADR-012, thay phần bị từ chối ở ADR-011).
- **Ảnh hưởng**: **KHÔNG đổi sức mạnh nhân vật** — công trình trùng tu không sinh đặc quyền. Giới
  hạn: mỗi lúc 1 công trình, và chỉ tiêu được nguyên liệu còn sót của chính kỷ đó (thứ không bao
  giờ kiếm lại được). Kỷ đã bị vắt kiệt nguyên liệu thì vẫn không trùng tu được — đó là thiết kế.
- **Tương thích**: hoàn toàn tương thích ngược, **không thêm trường state nào**, không cần migration.

---

## 2026-08-13 — Điểm tổng bảo tàng: một con số đã viết xong nhưng chưa từng lên màn hình

- **Mục đích**: `summarizeMuseum` (engine, Phase 4B) có ghi chú, có test, tự nhận là *"con số duy
  nhất trả lời tôi đã đi được bao xa"* — nhưng chưa màn hình nào gọi tới. Cùng lúc, ô số liệu thứ
  ba của màn Thành Phố hiện lại đúng con số chuỗi mà thanh tiêu đề đã hiện.
- **Phạm vi**: `src/components/city/CityViewShell.jsx` (nối engine vào ô số liệu) ·
  `src/components/city/cityViewShellWiring.test.js` (MỚI, 2 bài đọc-mã-nguồn).
- **Ảnh hưởng**: ô thứ ba của màn Thành Phố nay là **"Kỷ trọn vẹn — 6/8"** thay cho "Chuỗi ngày".
  Suy ra từ dữ liệu đã có, **không lưu thêm byte nào**, **không đổi cân bằng game**. Kỷ đã niêm
  phong vẫn giữ nguyên ô "EP lúc niêm phong".
- **Tương thích**: hoàn toàn tương thích ngược. Tài khoản có mọi kỷ đều "thất truyền" (schema 3→4)
  vẫn thấy chuỗi ngày như cũ.

---

## 2026-08-13 — Công cụ chấm bản quét từng bịa ra 5 lỗi không có thật

- **Mục đích**: `sweep-score.mjs` (mới ở mốc dưới) tự đoán hình học tấm ảnh bằng một mặc định cỡ ô
  khác với mặc định của công cụ dựng ảnh. Sai lệch dồn theo từng hàng nên nó chấm nhầm sang kỷ
  khác, và in ra một bộ số sai trông rất hợp lý.
- **Phạm vi**: `scripts/city-preview.mjs` (ghi kèm hồ sơ `.geom.json`) · `scripts/sweep-score.mjs`
  (đọc hồ sơ, từ chối chạy nếu thiếu; tự-kiểm đủ 15 hàng; thêm `--eras` in màu mái từng kỷ) ·
  `TECH_DEBT.md` (#19: đính chính + bổ sung cơ chế đo được).
- **Ảnh hưởng**: chỉ công cụ phát triển — **không đụng mã chạy trên máy Đàm**. Số nghiệm thu mỹ
  thuật nay tái lập được. Số thật: 0/15 cặp chặng và 2/105 cặp kỷ dưới ngưỡng mắt.
- **Tương thích**: ảnh quét cũ (không có `.geom.json`) không chấm được nữa — phải quét lại. Cố ý:
  thà từ chối còn hơn đoán sai.

---

## 2026-08-13 — Quét đủ 15 kỷ × 6 chặng, và lần đầu CHẤM được bản quét bằng số

- **Mục đích**: bảng quét 90 ô đã có từ Phase 3G, nhưng xưa nay chỉ được đọc bằng mắt — mà mắt chỉ
  so được các ô kề nhau. Cần một phép chấm so được **cả 15 cặp chặng ngày và cả 105 cặp kỷ**.
- **Phạm vi**: `scripts/sweep-score.mjs` (MỚI) · `PomodoroEngine.jsx` (thêm `sizeMap.compactPrimary`)
  · `TECH_DEBT.md` (#19 mới + đính chính #18).
- **Kết quả đo**: **15/15 cặp chặng ngày ĐẠT** (gần nhất 32,8) · **2/105 cặp kỷ KHÔNG đạt** —
  kỷ 5 ↔ 12 = 9,5 và kỷ 4 ↔ 10 = 10,2 (ngưỡng mắt 12, cặp gần thứ ba đã là 13,4, trung vị 44,6).
- **Cố ý CHƯA sửa hai cặp đó** → `TECH_DEBT #19`: sửa chúng chính là "đợt vá thứ 6" cho
  `palette3d.js` mà sổ nợ bắt phải làm thành một đợt rà soát toàn bộ, không vá điểm.
- **Phát hiện đáng ghi**: bảng màu gốc của hai cặp đó cách nhau RẤT XA (140 và 100), còn cặp gần
  nhau nhất trong bảng gốc lại render ra đạt ⇒ lỗi nằm ở đường ống render, và **một bài test trên
  bảng màu không thể bắt được nó**.
- **Đóng nốt rủi ro của mốc trước**: nút chính trang chủ có `size` riêng (`compactPrimary`, 13px)
  thay vì mượn bộ dành cho hàng 4–5 nút (10px).
- **Tương thích**: thuần hiển thị + công cụ ⇒ **không có migration**. 551 test xanh.

---

## 2026-08-13 — Đánh bóng chữ trên màn hình: bốn chỗ hiện sai, và bốn kiểu nói dối của công cụ đo

- **Mục đích**: một lượt soi UI/UX bằng SỐ (không bằng cảm nhận) trên cả khung điện thoại 390px và
  máy bàn 1280px, ở cả 7 màn hình chính. Mọi phát hiện đều phải đo được và kiểm lại được bằng ảnh.
- **Bốn lỗi hiển thị đã sửa**:
  1. Xưởng chế tạo in **"-4/2 phiên"** (số âm). Gốc: hai nơi tự chia lại tiến độ, lại tra hai bảng
     khác nhau và không kẹp biên ⇒ tách `src/engine/craftProgress.js` làm **công thức duy nhất**;
     `cityLayout.js` và `BuildingWorkshop.jsx` cùng gọi nó. Nay in `0/2 phiên`.
  2. Nút chính trang chủ ở 390px chạy **font 18px + padding 28px** trong khung 186px ⇒ chữ bị xén.
     Gốc: lớp `px-2.5 text-[11px]` truyền qua `className` **thua** `px-7 text-lg` của `sizeMap`
     trong `ActionButton` (Tailwind xếp theo bảng kiểu, dự án không có `tailwind-merge`). Sửa đúng
     cách: dùng `size="compactMobile"` đã có sẵn. Cùng lỗi ở nút "Full Screen".
  3. Bốn thẻ preset (`Khởi động`/`Chuẩn`/…) cắt mô tả thành "Vào việc …", "Nhịp hằng …" — ở CẢ
     390px lẫn 1280px, vì thẻ luôn nằm trong cột hẹp ~130px. Chuyển sang xếp dọc ở mọi bề ngang.
  4. Tên hợp lực ở tab Kỹ năng cắt thành "Bậc Thầy…" — cho xuống 2 dòng thay vì cắt (tên riêng).
- **Công cụ đo (`scripts/shot.mjs`) — vá 4 kiểu nói dối mới** (số 5–8, nối tiếp 4 kiểu đã ghi
  trước đó): lớp trang trí `position:absolute` bị tính thành "chữ tràn" · cổng "app đã mọc ra
  chưa" chỉ vá cho một nhánh, và bản "đợi DOM đứng yên" bị vỏ HTML tĩnh lừa · băng cuộn ngang bị
  đếm là "bị xén" (7 báo động giả) · đo trước khi web font về nên số đo chữ sai. Thêm cờ `--el`
  (in style THẬT của một phần tử) và `--crop` (cắt vùng / cắt quanh một chuỗi chữ).
- **Lưới giữ về sau**: `src/components/actionButtonSizing.test.js` (3 bài đọc mã nguồn, đều đã
  thử-cho-đỏ) + `src/engine/craftProgress.test.js` (6 bài, gồm quét cả 75 bản vẽ và bài canh hai
  bảng `BLUEPRINT_META`/`BUILDING_EFFECTS` không được lệch nhau).
- **Tương thích**: thuần hiển thị + công cụ. KHÔNG đổi state, schema, hay cân bằng game ⇒ **không
  có migration**. 551 test xanh · lint sạch · build xanh.

---

## 2026-08-13 — Di sản dang dở: công trình xây dở của kỷ cũ không còn bốc hơi khi lên kỷ

- **Mục đích**: Đàm chọn cơ chế *"Cho xây tiếp công trình kỷ cũ"*. Sau khi Phase 4B gắn ngôi sao
  "trọn vẹn kỷ", luật cũ (lên kỷ = cắt sạch hàng đợi) dạy đúng một bài học ngược: **đừng bao giờ
  khởi công khi sắp lên kỷ** — tức app tự thưởng cho việc ngừng làm việc.
- **Phạm vi**: `src/engine/eraLegacy.js` (MỚI, thuần: `blueprintEraOf` · `splitCraftingQueue` ·
  `countActiveCrafting` · `pickLegacyCompletions`) + test 10 bài · `gameStore.js`
  (`pruneEraScopedBlueprintState` giữ nhánh legacy · `completeFocusSession` ghi bổ sung vào
  `cityArchive` + thông báo riêng · `startCrafting` đếm ô theo kỷ hiện tại) · `BuildingWorkshop.jsx`
  (nhãn "DI SẢN KỶ N", số ô `n/2` không tính di sản) · `NotificationCenter.jsx` · `CityView.jsx` ·
  `cityCompletion.js` · `EraSwitcher.jsx`.
- **Kết quả**: công trình đã khởi công trước khi lên kỷ nay sống sót và xây tiếp; hoàn thành thì
  được ghi vào bảo tàng của kỷ sinh ra nó. Ngôi sao của một kỷ đã niêm phong lại **với tới được** —
  nhưng chỉ với những gì đã bắt đầu, không khởi công mới.
- **KHÔNG đổi cân bằng game**: di sản hoàn thành **không** vào `buildings` ⇒ không perk
  `BUILDING_EFFECTS`, không tài nguyên. Phần thưởng thuần tuý là lịch sử. Di sản cũng **không chiếm
  ô hàng đợi** (`CRAFT_QUEUE_SLOTS` vẫn là 2 ô cho kỷ hiện tại).
- **Nới bất biến ADR-007** từ "bảo tàng bất động" thành **"bảo tàng không xê dịch"** — xem ADR-011.
  Vế được bảo vệ (nhà xây sau không đẩy nhà xây trước) vẫn nguyên vẹn vì `computeCityLayout` đặt nhà
  theo khu đất cố định.
- **Hai lỗi bắt được bằng mắt, cùng một họ (không có gì đỏ lên)**: bảng sưu tập ghi "chưa xây" ngay
  bên dưới giàn giáo đang dựng, và thanh chuyển kỷ vẽ "Kỷ 7 · 4/5 đứng chết vĩnh viễn" giống hệt
  "Kỷ 7 · 4/5 còn cách ngôi sao ba phiên". Cả hai đều là gác thừa bằng `isCurrent` — một cái luật
  đúng cho tới Phase 4D thì hết đúng.
- **Tương thích**: KHÔNG đổi schema, KHÔNG thêm trường state ⇒ **không có migration**. Dữ liệu cũ
  chạy nguyên vẹn.
- **Test**: 542 bài, xanh (thêm 16: 10 tầng thuần `eraLegacy` + 5 hành vi qua `completeFocusSession` + 1 canh mã nguồn thanh chuyển kỷ).

---

## 2026-08-13 — Quét lại 15 kỷ × 6 chặng: con số "0/105" trong tài liệu là số của vùng tối

- **Mục đích**: quét lại đủ 90 cảnh để kiểm mọi thay đổi đồ hoạ gần đây. Bảng "màu mái đo được" in
  ra gần như ĐEN ở giữa trưa — số đo gây bất ngờ thì kiểm công cụ trước.
- **Lần thứ 13 công cụ dev nói dối**: bộ lọc "8% pixel tươi nhất" dùng độ tươi TƯƠNG ĐỐI
  (`(max−min)/max`), mà mẫu số là `max` nên pixel càng tối càng dễ thắng ⇒ nó lấy **mặt mái khuất
  trong bóng** chứ không lấy mái nắng. Con số "0/105 · gần nhất 12,6" đã ghi vào `CLAUDE.md` là số
  của vùng tối, SAI. `--selftest` không bắt được vì nó chỉ hỏi "bỏ lọc thì số có tụt không" — một
  phép tự kiểm chứng minh bộ lọc CÓ tác dụng, không chứng minh nó có tác dụng ĐÚNG.
- **Sự thật**: 3/105 cặp kỷ dưới ngưỡng mắt (5↔12 = 7,2 · 3↔12 = 10,1 · 5↔7 = 11,1). Hai kỷ xám-lam
  độ tươi thấp bị nắng ấm + ánh phản từ cỏ rửa trôi hết sắc lam, ra cùng một mảng olive.
- **Phạm vi**: `src/engine/city3d/palette3d.js` (`eraRoof`: hệ số nền độ tươi 0,30 → 0,52 — chỉ
  chạm 3/15 kỷ vì 12 kỷ kia đã chạm trần từ trước), `palette3d.test.js` (nới số đếm 2 → 3 kèm phép
  canh PHÂN BỐ mới: trung vị ≥ 34), `CLAUDE.md`/`BAN_GIAO.md` (sửa con số sai).
- **Kết quả**: 0/105 cặp dưới ngưỡng (thật) · cặp gần nhất 7,2 → **14,1** · trung vị 28,2 → **39,6**.
  Chặng ngày giữ nguyên: 0/15 cặp dưới ngưỡng, gần nhất 29,5.
- **Phát hiện sâu hơn**: bài test tầng bảng màu và phép đo trên ảnh kêu **hai tập cặp rời nhau hoàn
  toàn** — tầng thuần vừa báo nhầm vừa bỏ sót. Ngưỡng 12 là ngưỡng mắt trên điểm ảnh đã dựng, áp
  thẳng vào bảng màu là lỗi "một luật hai công thức".
- **Tương thích**: chỉ đổi màu hiển thị, KHÔNG đụng state/schema/cân bằng game.
- **Test**: 524 bài, xanh.

---

## 2026-08-13 — Trọn vẹn kỷ: mỗi kỷ có 5 công trình, và giờ Đàm nhìn thấy con số 5 đó

- **Mục đích**: mỗi kỷ có đúng 5 bản vẽ, nhưng cả app không chỗ nào nói ra con số ấy. Màn hình
  Thành Phố hiện "Công trình: 3" và thanh chuyển kỷ hiện "Kỷ 3 · 2" — hai trên mấy thì không ai
  biết. Một con số không có mẫu số thì không phải mục tiêu; nó chỉ là một con số.
- **Phạm vi**: `src/engine/cityCompletion.js` (MỚI, thuần: `listEraBlueprints`,
  `summarizeEraCompletion`, `withEraCompletion`, `summarizeMuseum`) + test 13 bài ·
  `CityView.jsx` (ghép state sống vào danh sách kỷ) · `EraSwitcher.jsx` (chip hiện `3/5`, kỷ trọn
  vẹn được gắn ★) · `CityViewShell.jsx` (ô "Công trình" có mẫu số · danh sách công trình đổi thành
  **bảng sưu tập đủ 5 ô**, ô chưa xây để mờ · ô thống kê thứ tư nay hiện **dân số**).
- **Kết quả**: bảo tàng thôi làm album ảnh và thành bảng thành tích — kỷ nào xây trọn vẹn được gắn
  sao VĨNH VIỄN (kỷ cũ niêm phong không sửa lại được, ADR-007). Màn hình "bãi đất trống" của một kỷ
  mới thôi là ngõ cụt: nó liệt kê sẵn 5 thứ sắp mọc lên ở đó.
- **Hai lỗi bắt được khi soi bằng mắt (không có gì đỏ lên)**: (1) ô thống kê "Đang xây: N" TRÙNG
  hoàn toàn với thẻ "Đang xây" ngay bên dưới, và vì công trường gần như lúc nào cũng có nên nó
  khiến dân số vĩnh viễn vô hình → bỏ ô thừa; (2) ngôi sao tô bằng màu kỷ chỉ đạt **1,49:1** tương
  phản (kỷ 9) trên nền thẻ sáng → đổi sang `var(--accent)` (2,97–7,43:1 qua 8 tổ hợp theme × skin),
  khoá bằng một bài test đã thử ngược và thấy đỏ.
- **Công cụ**: `scripts/make-fixture.mjs` từng cấm mọi kỷ xây kín 5/5 (để luôn còn giàn giáo mà
  soi) — hệ quả là **cả bảo tàng ra một dãy "4/5" giống hệt nhau** và trạng thái "trọn vẹn" gần như
  không tồn tại để nhìn thấy. Nay chỉ chừa chỗ cho giàn giáo ở kỷ ĐANG chơi.
- **Tương thích**: KHÔNG đổi state, KHÔNG đổi schema, KHÔNG thêm byte nào vào JSONB Supabase (mọi
  con số đều suy ra từ catalog + danh sách công trình). Cân bằng game KHÔNG đổi.
- **Test**: 509 → **524** bài, xanh.

---

## 2026-08-13 — Ba kỷ cuối cùng cũng có mái mang màu của chúng (105/105 cặp kỷ phân biệt được)

- **Mục đích**: kỷ 12–14 đều dùng `roof: 'flat'`, mà nhánh `'flat'` chỉ đẩy đúng một khối với vai
  `trim` — vai TRUNG TÍNH họ tường. Nghĩa là **ba kỷ ấy chưa bao giờ hiện lấy một milimét vuông vai
  `roof` nào**: bảng màu đúng, ánh sáng đúng, nhưng không có bề mặt nào để màu kỷ nói ra.
- **Vì sao mọi bài test đều xanh**: bài "15 kỷ phải ra 15 màu mái" đo MÀU TRONG BẢNG, không hỏi màu
  ấy có được đem VẼ RA hay không. Hai câu hỏi khác nhau, và khoảng trống giữa chúng đủ chỗ cho ba kỷ.
- **Phạm vi**: `src/engine/city3d/buildingSpec.js` (nhánh `case 'flat'`: giữ gờ chắn mái trung tính
  ở vành ngoài, thêm tấm phủ hẹp hơn mang vai `roof` trong lòng — đúng cấu tạo mái bằng ngoài đời),
  `buildingSpec.test.js` (+1 bài, đã thử ngược và thấy đỏ).
- **Kết quả**: số cặp kỷ dưới ngưỡng mắt **5/105 → 0/105**; cặp gần nhau nhất 6,0 → **12,6**; trung
  vị 28,2. Cùng với 15/15 cặp chặng ngày (nhỏ nhất 29,5) ⇒ **90 ô của bản quét không còn ô nào
  trùng ô nào**. `TECH_DEBT` #18 đóng ngay trong ngày mở.
- **Ảnh hưởng**: thuần mỹ thuật. 510 test xanh, lint sạch, build xanh.

---

## 2026-08-13 — 15 kỷ: bớt được ba cặp thành phố trông giống hệt nhau

- **Mục đích**: bản quét 15 × 6 mới chỉ được chấm bằng "tản sắc giữa 15 kỷ" — một ĐỘ LỆCH CHUẨN.
  Số gộp đó có thể rất khoẻ trong khi vẫn có vài cặp kỷ trùng khít. Duyệt đủ **105 cặp** thì lộ ra
  **5 cặp** mái gần như cùng một màu, trong đó kỷ 5 ↔ kỷ 12 chỉ cách 8,4.
- **Nguyên nhân**: `ERA_METADATA` có hai kỷ dùng gần như cùng một sắc (`#94a3b8` và `#64748b` —
  cùng góc màu 215°, chỉ khác độ sáng 0,65 vs 0,47), mà `eraRoof` khi đó nén chênh lệch độ sáng lại
  chỉ còn **0,22 lần** ⇒ trên mái chỉ còn 0,04. Nâng hệ số lên 0,55 (mái diễn đạt CẢ màu kỷ chứ
  không chỉ góc màu — đúng lý do `roof` dùng `eraRoof` thay vì `material`): **5 cặp → 2 cặp**.
- **Kèm một lỗi cùng họ**: `eraRoof` chặn "mái tím rực" bằng CỬA SỔ GÓC MÀU (255°–340°) trong khi
  bài test định nghĩa dải tím bằng QUAN HỆ KÊNH (đỏ và lam đều cao hơn lục). Hai cách nói một luật
  ⇒ có khe: mái kỷ 15 ở 247° lọt qua cửa sổ mà vẫn phạm luật (tươi 0,44 / trần 0,42). Nay dùng
  chung đúng một phép thử. (Cùng ngày đã sửa một khe y hệt ở `daylight.test.js`.)
- **Bài test mạnh thêm**: bài "15 kỷ phải ra 15 màu" vốn chỉ canh cặp GẦN NHẤT — một số gộp khác.
  Nay canh cả SỐ LƯỢNG cặp nằm dưới ngưỡng mắt (≤2). Đã thử ngược với hệ số cũ và thấy nó báo đỏ,
  gọi tên đủ 5 cặp.
- **Còn lại, đã ghi thành `TECH_DEBT` #18**: kỷ 12–14 là khối hộp hiện đại **mái bằng**, gần như
  không có diện tích mái để sắc kỷ nói — nên dù màu mái ở tầng thuần đã tách bạch, trên ảnh ba kỷ
  này vẫn na ná nhau. Đó là vấn đề HÌNH KHỐI, không phải màu.
- **Ảnh hưởng**: thuần mỹ thuật. 509 test xanh, lint sạch, build xanh.

---

## 2026-08-13 — Sáu chặng ngày, sáu bức tranh: bình minh thôi trùng khít hoàng hôn

- **Mục đích**: đo lại bản quét 15 kỷ × 6 chặng bằng phép đo CẢ CẢNH (vector 9 chiều: dải trời +
  dải thành phố + dải đất, trung bình 15 kỷ) thay vì chỉ đo góc màu dải trời. Kết quả lật ngược
  chẩn đoán cũ: **bình minh và hoàng hôn cách nhau 5,9/255** — dưới ngưỡng mắt phân biệt được
  (~12) — tức trong sáu chặng ngày thì có hai chặng là **cùng một bức ảnh**. Mở app lúc 6 giờ sáng
  hay 6 giờ chiều cũng vậy. Không bài test nào bắt được vì bài "hai chặng liền nhau phải khác
  nhau" chỉ duyệt các cặp KỀ NHAU trong danh sách, mà `dawn`/`dusk` nằm ở hai đầu.
- **Phạm vi**: `src/engine/city3d/daylight.js` (trường mới `haze` + hàm thuần `fogRangeFor`, chỉnh
  hồ sơ `dawn`/`dusk`/`afternoon`), `src/components/city/render3d/sceneGraph.js` (sương mù đọc
  `haze` thay vì hằng số), `src/engine/city3d/daylight.test.js` (+4 bài).
- **Thay đổi lớn nhất là SƯƠNG THEO GIỜ.** Trước đây sương mù là một hằng số nên buổi nào cũng
  trong veo như nhau. Nay sáng sớm có sương dày (`haze` 0,90), chiều tà trời quang (0,08) — neo vào
  một sự thật khí quyển: qua đêm thì bụi lắng xuống và hơi nước đọng lại. Tắt riêng sương ra rồi
  bật lại (giữ nguyên mọi tham số khác): **17,2 → 75,1**, tức nó đóng góp gần như toàn bộ kết quả.
  Đo theo từng dải cho thấy nó làm gì và KHÔNG làm gì: nền/chân trời **12,9 → 74,6**, dải thành phố
  **8,4 → 3,3** (giảm), mặt đất không đổi. Toàn bộ khoảng cách đến từ phần NỀN — đúng như thiết kế,
  vì sương cố ý bắt đầu sau rìa thành phố. Nhà cửa ở gần trông na ná nhau ở hai đầu ngày là đúng
  vật lý (cùng một mặt trời thấp), không phải thiếu sót.
- **Kết quả đo**: bình minh ↔ hoàng hôn **5,9 → 75,1**. Cặp gần nhau nhất trong cả ngày **5,9 →
  29,8**. Cả 15 cặp nay đều trên ngưỡng mắt, cặp yếu nhất gấp 2,5 lần ngưỡng.
- **Bài test mới khoá lại**: duyệt ĐỦ 15 cặp (không chỉ cặp kề nhau) trên khoảng cách hồ sơ đa-trục,
  ngưỡng hiệu chuẩn với phép đo pixel thật (Spearman 0,854). Kèm **một bài đối chứng nhốt sẵn bộ số
  hỏng cũ** và bắt buộc phép đo phải còn bắt được nó — nếu về sau ai nới ngưỡng cho tiện thì đỏ ngay.
- **Ảnh hưởng / tương thích**: thuần mỹ thuật. KHÔNG đụng state, KHÔNG đụng cân bằng game, KHÔNG
  cần chạy SQL, KHÔNG đổi schema. `TECH_DEBT.md` **#17 đã ĐÓNG** (và mục đó được viết lại vì chẩn
  đoán ban đầu của nó sai — nó đổ lỗi cho chặng chiều).
- **Test**: 505 → **509 bài, tất cả xanh**; lint sạch; build xanh.

---

## 2026-08-13 — Trang chủ: app thôi mắng Đàm ngay lúc vừa mở lên

- **Mục đích**: ô "Mục tiêu phiên" chỉ biết HAI trạng thái — `isSessionGoalValid` đúng hoặc sai.
  "Sai" gộp chung hai hoàn cảnh khác hẳn nhau: *chưa gõ chữ nào* và *gõ dở rồi dừng*. Hệ quả: mỗi
  lần mở app, thứ đầu tiên đập vào mắt là nhãn **"Thiếu mục tiêu"** + một dòng chữ **đậm màu cảnh
  báo** (`--accent2` = `#8a3f24`) nói *"Cần nhập mục tiêu trước khi bắt đầu phiên"* — trên một ô
  Đàm còn chưa chạm vào. Đúng màn hình anh mở nhiều nhất trong ngày.
- **Phạm vi**: `src/components/sessionGoalState.js` (mới, thuần + 10 bài test) — ba trạng thái
  `empty` / `partial` / `ready` với ba tông riêng; `src/components/PomodoroEngine.jsx` dùng nó cho
  **cả hai** khối giao diện (thẻ "Chuẩn bị phiên" gọn và mục "Mục tiêu phiên" mở rộng), nên hai
  khối không thể lệch nhau nữa.
- **Đổi giọng, KHÔNG đổi luật**: nhãn `Thiếu mục tiêu` → `Chưa đặt mục tiêu` (mô tả sự việc thay vì
  quy kết khiếm khuyết), màu từ cảnh báo → chữ phụ trung tính (đo được: `rgb(106,104,98)`); câu
  dưới ô đổi thành *"Phiên này bạn định chốt xong việc gì? Viết một dòng từ 10 ký tự là bắt đầu
  được."* — vẫn nêu đủ ngưỡng. Nút Bắt đầu vẫn bị vô hiệu hoá và vẫn ghi "Cần điền mục tiêu phiên",
  nên không mất một chút thông tin nào. Trạng thái *đã gõ dở* GIỮ NGUYÊN màu nhắc — lúc đó "thiếu"
  mới là mô tả đúng.
- **Kèm một lỗi đơn vị**: bộ đếm `0/10` đếm KÝ TỰ nhưng nhãn dưới nó ghi "tối thiểu **từ**" — đọc
  ra thành "tối thiểu 10 TỪ", gấp nhiều lần luật thật. Đổi thành "ký tự tối thiểu".
- **Ảnh hưởng / tương thích**: thuần hiển thị. Không đụng `handleStartSession`, không đụng ngưỡng
  10 ký tự, không đụng state, không migration.
- **Test**: 495 → **505 xanh**. Bài quan trọng nhất (`empty` và `partial` không được cùng tông) đã
  được **thử ngược**: ép về logic hai-trạng-thái cũ ⇒ đỏ ngay, đúng thông điệp mong đợi.

## 2026-08-13 — Công cụ + sửa nhãn: thanh tiêu đề thôi gọi EP là XP

- **Mục đích**: mọi đợt soi giao diện trước nay đều chạy trên một tài khoản gần như RỖNG — tức là
  xem màn hình của NGÀY ĐẦU TIÊN trong khi Đàm đang sống ở tháng thứ sáu. Dựng một fixture "đã chơi
  6 tháng" để soi đúng thứ Đàm thấy.
- **Công cụ mới**: `scripts/make-fixture.mjs` (534 phiên · 312 giờ · 20.888 EP → kỷ 8 · cấp 4 ·
  7 kỷ đã niêm phong trong bảo tàng · 1 công trình đang xây 3/6 phiên). Chạy dưới
  `register-esm-loader` để dùng **công thức thật** (`calculateRewards`/`getActiveBook`/
  `mergeCityArchive`) thay vì chép lại tỉ giá; `Math.random` được thay bằng một dòng số có hạt
  giống nên vẫn tất định (hai lần chạy ra hai file y hệt). `scripts/shot.mjs` nhận thêm `--fixture`.
- **Bản nháp đầu của chính công cụ này đã tự mâu thuẫn** — bịa tỉ giá rồi ép cứng kỷ 7, làm thanh
  tiến độ hiện "41.390 / 18.500" (tiến độ vượt quá vạch đích của nó). Luật rút ra và đã ghi vào đầu
  file: **mọi con số mà giao diện đem SO với một con số khác đều phải được SUY RA, không được bịa.**
- **Lỗi thật tìm được nhờ fixture**: 3 chỗ trên màn hình dán nhãn **XP** cho một đại lượng là **EP**
  — `App.jsx` (thanh tiến trình kỷ ở tiêu đề, thấy trên MỌI màn hình, mọi thiết bị) và
  `RankDisplay.jsx` ×2 ("… XP trong kỷ này để mở thử thách"). Cả ba đều đọc từ `progress.totalEP`
  và `ERA_THRESHOLDS`, tức cùng đơn vị mà `ResourceDisplay`/`PrestigeModal`/`StakePanel` đều gọi là
  EP. Bằng chứng là nhầm chứ không phải cố ý: ngay trong `RankDisplay.jsx`, nhãn "EP trong kỷ" bên
  cạnh vẫn luôn ghi đúng.
- **Vì sao lỗi này sống lâu**: trên tài khoản mới nó chỉ là "0 / 1.300" — vô hại. Chỉ khi có số
  thật mới lộ: cấp 4 mà thanh "XP" báo 20.888.
- **Phạm vi**: `src/App.jsx` (1 chuỗi), `src/components/RankDisplay.jsx` (2 chuỗi + đổi tên biến
  cục bộ `xpInEra`/`remainingXP` → `epInEra`/`remainingEP` để lỗi không quay lại). Không đụng công
  thức, không đụng state, không migration.
- **Test**: 495 xanh, không đổi số bài (đây là sửa nhãn hiển thị, không có logic mới để khoá).

## 2026-08-13 — Trang chủ (Phase 3X): vòng ngày cuối cùng cũng tới được màn hình Đàm nhìn nhiều nhất

- **Mục đích**: Phase 3V dựng cả một hành trình màu 178° cho sáu chặng ngày, nhưng ở TRANG CHỦ —
  nơi cái đồng hồ chạy suốt 25 phút — sáu chặng chỉ cách nhau **tối đa 14/255**, dưới ngưỡng mắt
  phân biệt được (12). Tức thành quả đó gần như không tới được người dùng.
- **Nguyên nhân gốc — một niềm tin sai, không phải một con số chọn ẩu**: lớp phủ giữ-chữ-đọc-được
  đặt mốc đậm theo giả định rằng mặt đồng hồ nằm trực tiếp trên nền. Đo thật thì `25:00` nằm trong
  một thẻ ĐẶC ở **82%** chiều cao — lớp phủ chưa từng bảo vệ nó. Chữ thật sự trên nền chỉ là khối
  lời chào: máy bàn 7%→21%, điện thoại 31%→48%. Từ đó trở xuống lớp phủ không làm gì cho khả năng
  đọc, nó chỉ xoá thành phố — mà ở 38% nó vẫn còn 80%.
- **KHÔNG phải một cuộc đánh đổi**: mục nợ này ban đầu được ghi là "đánh đổi thẩm mỹ, chờ Đàm
  quyết". Chú thích tại chỗ thật ra tuyên bố HAI ý định, và ý định thứ hai (*"thành phố lộ ra rõ
  nhất ở khoảng trống phía dưới, đúng chỗ chẳng có chữ gì"*) đang không đạt. Sửa cho nó đạt thì
  không phải hy sinh vế nào.
- **Phạm vi**: `src/components/city/cityBackdropScrim.js` (mới, thuần + 7 bài test),
  `src/components/city/CityBackdrop.jsx` (thay chuỗi gradient chốt cứng bằng hồ sơ theo khung màn
  hình, dùng lại `useIsPhone()` đã có sẵn). Không đụng `daylight.js`/`palette3d.js` — bầu trời vốn
  đã đúng từ 3V.
- **Kết quả đo (điểm ảnh thật, trước ↔ sau, 6 chặng)**: vòng ngày **14,0 → 25,0/255**; dải CÓ CHỮ
  lệch tối đa **0,43/255** và **sáng hơn ở cả 6/6 chặng, không chặng nào tối đi** (tương phản chữ
  không giảm một phần nghìn nào); dải KHÔNG CHỮ lệch **22–33/255**.
- **Ảnh hưởng / tương thích**: chỉ là lớp trang trí, không đụng dữ liệu, không đụng state, không
  migration. Đàm vẫn tắt được hẳn trong Cài đặt (`cityHomeBackdrop`).
- **Test**: 488 → **495 xanh**. Bài khoá quét TỪNG PHẦN TRĂM (không chỉ tại các mốc, vì
  `linear-gradient` nội suy ở giữa) và đã được thử ngược: hồ sơ cố ý nhạt hơn ⇒ đỏ ngay tại 1%.

---

## 2026-08-13 — Bền vững (Phase 3W): bầu trời đi theo đồng hồ, và không bao giờ ngả tím

- **Mục đích**: bảo vệ chính thành quả của Phase 3V trước hai đường rò rỉ mà nó vừa mở ra.
- **Lỗi 1 — bầu trời đứng im khi mở lại app**: `CityScene3D` đọc đồng hồ đúng một lần lúc dựng
  cảnh, và danh sách phụ thuộc không có gì liên quan tới thời gian. Phần lớn trường hợp được
  `sessionCount` cứu (xong phiên là dựng lại), nhưng **iPhone (PWA) chỉ ĐÓNG BĂNG tab chứ không
  đóng hẳn** ⇒ mở app buổi sáng, mở lại lúc tối vẫn thấy bầu trời buổi sáng. Cùng họ lỗi với "BẢN
  VÁ C1" ở `syncService.js`, nên dùng lại cùng tín hiệu: `visibilitychange`. Cố ý KHÔNG hẹn giờ
  định kỳ, để không có nguy cơ cảnh dựng lại giữa một phiên tập trung.
- **Lỗi 2 — Phase 3V làm mất một lời bảo đảm**: phép trộn RGB cũ khiến màu tím **bất khả thi về
  cấu tạo**; xoay sắc thì không. Bài test quét đủ 15 kỷ bắt được `#bd818e` (mặt nước 5 giờ sáng, kỷ
  6 sắc tím) — **lần thứ tư của họ lỗi đã hỏng ba lần trước đó**. Đã trả lại lời bảo đảm bằng cấu
  tạo: độ tươi nhân với độ dài vector chroma (`s × min(1, |v| / 0,5)`) ⇒ hai sắc gần đối nhau thì
  nhạt về xám, còn lực kéo mạnh thì giữ nguyên độ tươi. Bầu trời xanh không mất gì (đo lại: sáng
  203°/0,15 · trưa 211°/0,17, y như trước).
- **Phạm vi**: `src/components/city/render3d/CityScene3D.jsx` (+ test mới),
  `src/engine/city3d/palette3d.js`, `src/engine/city3d/daylight.js` (bù độ tươi buổi sáng),
  `src/engine/city3d/palette3d.test.js` (mở rộng bài chống-tím), `ARCHITECTURE.md`. Không đụng
  state, không cần chạy SQL, không thêm dependency.
- **Test**: 485 → **488** bài. Mọi khẳng định mới đều đã thử NGƯỢC với mã hỏng và thấy báo đỏ —
  trong đó bài `visibilitychange` bản đầu **xanh oan** vì bám nhầm một bộ nghe khác trong cùng file.

## 2026-08-13 — Mỹ thuật (Phase 3V): trời ban ngày cuối cùng cũng xanh

- **Mục đích**: đóng `TECH_DEBT.md` #15. Trước đó 5/6 chặng ngày cho ra cùng một sắc trời cam-nâu
  (26°/40°/41°/38°/19°), chỉ đêm mới thoát ra — nghĩa là "thành phố đổi theo giờ" thực chất chỉ đổi
  ĐỘ SÁNG, tín hiệu thị giác yếu nhất.
- **Nguyên nhân gốc (ba tầng nhân nhau, phải sửa cả ba)**: (1) `skyward()` trộn màu trong không
  gian RGB nên sắc ấm pha sắc lạnh đi qua vùng trung tính — **cùng họ lỗi đã sửa cho mái nhà ở
  Phase 3N**; (2) `NeutralToneMapping` nén vùng sáng, mà chân trời để độ sáng 0,80 thì nằm đúng
  giữa vùng bị nén ⇒ độ tươi ra màn hình chỉ còn 1/5 bảng màu; (3) nắng ấm nhân vào trời kéo sắc
  lạnh tụt 13–22° về phía lục.
- **Phạm vi**: `src/engine/city3d/palette3d.js` (`skyward()` xoay sắc bằng vector chroma; độ
  sáng/độ tươi chân trời), `src/engine/city3d/daylight.js` (chỉnh 2 chặng sáng/trưa),
  `src/engine/city3d/daylight.test.js` (bài 81 viết lại thành bất biến thật). Không đụng state,
  không cần chạy SQL, không thêm dependency.
- **Kết quả đo**: đỉnh trời cả ngày nay là `27° · 203° · 211° · 37° · 18° · 223°` — bốn chặng ban
  ngày trải **178°** thay vì 22°. Giữa trưa ra `#7d8fa3`, xanh trời thật.
- **Xác minh**: dựng và ĐO đủ **90 ô** (15 kỷ × 6 chặng) — không ô nào đen/xám/cháy, 6/6 chặng
  phân biệt được, đêm không hề tối hoặc phẳng thêm (chênh +0,005, trong nhiễu).
  ⚠️ **Đính chính (Phase 3W)**: bản đầu ghi "180 ô × 2 theme"; đo từng điểm ảnh cho thấy nội dung
  3D của hai theme GIỐNG HỆT nhau khi đã truyền giờ, nên con số thật là 90.
- **Tương thích**: `skyward(…, t = 0)` cho ra byte y hệt bản cũ ⇒ mọi chỗ gọi không kéo màu đều
  không đổi một pixel.
- **Kèm theo**: `eslint.config.js` bỏ qua `.city-preview` (ESLint không tự đọc `.gitignore`, nên
  chạy lint đúng lúc đang dựng ảnh sẽ ra 29 lỗi giả từ ruột three.js).
- **Test**: **485** bài, giữ nguyên số lượng — bài 81 được viết lại chứ không thêm mới, và đã thử
  NGƯỢC với bộ số hỏng cũ để chắc chắn nó báo đỏ (38° < 90°).

## 2026-08-12 — UX (Phase 3S): nhìn bằng mắt vào thẻ lễ mừng

- **Mục đích**: Phase 3R sửa NỘI DUNG bằng số đo; phase này nhìn HÌNH DẠNG bằng mắt — dựng lại thẻ
  bằng CSS đã build thật trong Chromium headless, đủ 8 tổ hợp theme × skin.
- **Lỗi 1**: kiểu chữ đảo ngược tầm quan trọng — câu cột mốc (phần thay đổi mỗi phiên, mang cảm
  xúc) ở 10px in hoa; tên công trình + số đếm lùi (phần lặp lại) ở 15px in đậm. Đã đảo: cột mốc
  17px đậm, tên công trình 11,5px mờ.
- **Lỗi 2**: "Sắp hoàn thành" đọc lướt lẫn với "Công trình đã hoàn thành", mà hai câu rơi vào hai
  phiên liền nhau. Đổi thành "Đã làm đủ số phiên".
- **Phạm vi**: `src/components/city/CityGrowthMoment.jsx` (kiểu chữ), `src/engine/cityMoment.js`
  (một chuỗi), `src/engine/cityMoment.test.js`. Không đổi state, không cần chạy SQL.
- **Xác minh**: không câu nào tràn hoặc xuống dòng xấu ở cả 8 tổ hợp.
- **Test**: 484 → **485** bài.

## 2026-08-12 — Vòng lặp (Phase 3R): màn thưởng thôi là một hằng số

- **Mục đích**: xử lý chữ "chán" bằng SỐ ĐO thay vì cảm tính. Phần đo được của nó: nếu màn thưởng
  nói cùng một câu mọi lần thì nó là hằng số, không phải phần thưởng.
- **Lỗi đo ra**: nhánh giàn giáo của `buildGrowthMoment` trả đúng một câu cứng. Chạy qua toàn bộ 75
  bản vẽ = 420 phiên xây: cả game chỉ có **2 câu mừng**, **82% số phiên** đọc lại đúng 4 chữ "Thành
  phố vừa lớn lên" — với nhịp ~4 phiên/ngày là hơn 3 lần mỗi ngày.
- **Phạm vi**: `src/engine/cityMoment.js` (thuần) + `src/engine/cityMoment.test.js`. Không đụng
  component, không đụng state, không cần chạy SQL.
- **Đã sửa**: thêm `growthHeadline()` sinh câu theo cột mốc THẬT của công trình — *Vừa khởi công ·
  Đã qua nửa chặng · Chỉ còn một phiên nữa · Sắp hoàn thành · Thành phố vừa lớn lên*. Kèm: đặc
  quyền "Tăng tốc" nay được nói ra ở dòng phụ thay vì chạy im lặng.
- **Ảnh hưởng**: 2 câu → **5 câu**; câu lặp nhiều nhất **82% → 33%**; và chúng xếp thành một mạch
  (khởi công → qua nửa → còn một phiên → hoàn thành) chứ không phải 5 câu rời rạc.
- **Ràng buộc giữ nguyên**: luật trung thực của `cityMoment.js` đứng TRÊN luật đa dạng — mọi câu là
  mệnh đề đúng suy ra từ số liệu đã có, không một lời khen rỗng nào. Có bài test canh riêng.
- **Test**: 480 → **484** bài; đã chứng minh ĐỎ cả hai hướng (quay về câu cứng ⇒ đỏ; nói bừa cho đủ
  đa dạng ⇒ cũng đỏ).

## 2026-08-12 — Nhịp phiên (Phase 3Q): lễ mừng không còn bị trừ vào giờ nghỉ

- **Mục đích**: xử lý dứt điểm `TECH_DEBT.md` #12. Lễ mừng 3 200 ms chen giữa "hết phiên" và hộp
  phần thưởng, nhưng đồng hồ nghỉ lại bắt đầu chạy từ mốc 500 ms ⇒ **2 700 ms cuối của lễ mừng, và
  cả lúc đọc hộp phần thưởng, đang bị tính là thời gian nghỉ.** Phần thưởng cho việc vừa làm xong
  bị trừ vào khoản người dùng được hưởng.
- **Phạm vi**: một dòng ở `src/engine/timerSession.js` (`BREAK_START_DELAY_MS` 500 → 3 200) +
  `src/engine/timerSession.test.js`. **Không đổi dòng mã giao diện nào.**
- **Ảnh hưởng**: phiên nghỉ 5 phút nay được nghỉ đủ 5 phút. Đánh đổi đã cân nhắc: phiên KHÔNG có lễ
  mừng cũng chờ 3,2 s mới vào nghỉ (cả hai trường hợp người dùng đều đang nhìn hộp phần thưởng).
  Không đổi state, không cần chạy SQL, không ảnh hưởng cân bằng game.
- **Vì sao không `import` chéo hai hằng số**: tầng đồng hồ không được phụ thuộc tầng thành phố —
  đồng hồ phải chạy đúng cả khi không có lễ mừng nào. Ràng buộc canh bằng test, không bằng import.
- **Test**: giữ **480** bài; bài "NHỊP MỘT PHIÊN" đổi từ khoá-giá-trị sang khoá-BẤT-BIẾN
  (`BREAK_START_DELAY_MS >= GROWTH_MOMENT_MS`), đã chứng minh ĐỎ theo cả hai hướng hồi quy.

## 2026-08-12 — Nhịp phiên (Phase 3P): dựng lưới cho hai con số quyết định nhịp

- **Mục đích**: làm cho khoản nợ "lễ mừng bị tính vào giờ nghỉ" (`TECH_DEBT.md` #12) nhìn thấy được
  và không thể âm thầm phình to — mà không tự ý đổi hành vi đồng hồ.
- **Phạm vi**: `src/engine/cityMoment.js` (+`GROWTH_MOMENT_MS`), `src/engine/timerSession.js`
  (+`BREAK_START_DELAY_MS`), `src/components/city/CityGrowthMoment.jsx` (xuất lại `MOMENT_MS`),
  `src/hooks/useTimer.js` (2 literal `500` → hằng số có tên), `src/engine/timerSession.test.js`.
- **Ảnh hưởng**: **không đổi hành vi** — mọi giá trị giữ nguyên (3 200 ms và 500 ms). Chỉ đổi chỗ
  khai báo và thêm hàng rào. Không đổi state, không cần chạy SQL.
- **Tương thích**: `MOMENT_MS` vẫn xuất từ `CityGrowthMoment.jsx` như cũ.
- **Test**: 479 → **480** bài. Bài mới đã chứng minh ĐỎ khi kéo dài lễ mừng lên 5 000 ms.

## 2026-08-12 — Thành Phố (Phase 3O): khoá lời hứa game hoá bằng số

- **Mục đích**: "thành phố lớn lên sau MỖI phiên" là mệnh đề game hoá cốt lõi nhất của dự án, mà
  cho tới nay nó chỉ được bảo vệ bằng một đoạn ghi chú. Phiên này đã hai lần cho thấy ghi chú
  không kèm số đo thì trôi.
- **Phạm vi**: chỉ `src/engine/city3d/buildingSpec.test.js`. **Không đổi dòng mã sản phẩm nào.**
- **Xác minh**: theme tối giữ nguyên chất lượng sau Phase 3N (cặp mái gần nhau nhất 8,4 lúc trưa /
  7,1 lúc đêm, phủ 9/12 múi màu); giàn giáo lớn lên 3,48 lần từ khởi công tới sắp xong.
- **Đã siết**: bài test cũ chỉ khoá HƯỚNG nên bản sửa làm giàn giáo lớn lên 1,02 lần vẫn xanh.
  Thêm khoá ĐỘ LỚN (≥3 lần) và khoá "mấy phiên cuối không được đứng yên" (tường đá trong lòng giàn
  giáo phải dâng thêm ≥10% từ mốc 80% tới lúc xong).
- **Ảnh hưởng**: không đổi hành vi, không đổi hình ảnh, không đổi state. Chỉ tăng độ chặt của lưới
  an toàn.
- **Test**: giữ **479** bài; hai khẳng định mới đã chứng minh ĐỎ trước hai hồi quy tương ứng.

## 2026-08-12 — Thành Phố (Phase 3N): 15 kỷ ra 15 màu mái

- **Mục đích**: phần thưởng của việc đi qua 15 kỷ nằm ở chỗ thành phố TRÔNG KHÁC ĐI. Đo ra thì nó
  gần như không khác.
- **Phạm vi**: `src/engine/city3d/palette3d.js` (thuần) + bài test khoá. Không đụng
  `ERA_METADATA.accentColor` — màu nhận diện kỷ dùng khắp giao diện giữ nguyên từng byte.
- **Lỗi tìm ra**: 15 góc màu mái dồn vào đúng hai cụm (9°–55° và 329°–342°), bỏ trống 60°–320°.
  Kỷ 5 ↔ 11 ↔ 12 cách nhau 0°; kỷ 8 (sắc lam 198°) và kỷ 10 (sắc đỏ 0°) ra hai mái cách nhau 1°.
  Nguyên nhân: vai màu mái chỉ giữ GÓC MÀU của kỷ và vứt bỏ độ tươi + độ đậm, lại neo vào một sắc
  ấm cố định nên mọi kỷ lạnh đều bạc thành nâu xám.
- **Đã sửa**: thêm `eraRoof()` dùng cả ba thành phần của màu kỷ; sắc kỷ 0,40 → 0,80; kèm trần
  riêng cho dải tím để không phá bất biến "không có màu tím sen rực".
- **Ảnh hưởng**: cặp kỷ gần nhau nhất 0,0 → 8,4; 15 mái trải từ 3° tới 307°. Chỉ đổi hình ảnh tab
  Thành Phố; không đổi cân bằng game, không đổi state, không cần chạy SQL.
- **Test**: 478 → **479** bài.

## 2026-08-12 — Thành Phố (Phase 3M): đêm không còn là một ô đen

- **Mục đích**: quét lại đủ 15 kỷ × 6 chặng ngày rồi ĐO BẰNG MÁY, thay vì nghiệm thu bằng mắt.
- **Phạm vi**: `src/engine/city3d/daylight.js` + `src/engine/city3d/palette3d.js` (đều thuần) và
  hai bài test khoá tương ứng. Không đụng store, không đụng đồng bộ, không đụng AI Coach.
- **Lỗi tìm ra**: cảnh đêm có độ sáng trung vị 0,023 (≈ 6/255) và dải động 0,129 — vừa tối nhất
  vừa phẳng nhất trong 6 chặng; độ lệch giữa 15 kỷ lúc đêm chỉ 0,010 nên **ban đêm mọi kỷ trông
  giống hệt nhau**. Nguyên nhân: đêm bị làm tối ở BA tầng nhân nhau (màu đèn · nắng yếu · sơn hạ
  sắc độ), trong khi hai lần vá trước chỉ cộng thêm đèn nền — sai tầng.
- **Đã sửa**: ánh trăng 0,42 → 1,15 · đèn nền 3,40 → 2,60 · sắc độ đêm mặt đất 0,286 → 0,40 và
  vùng ngoài phố 0,18 → 0,34.
- **Ảnh hưởng**: trung vị 0,023 → 0,058 (+152%), dải động 0,129 → 0,170. Năm chặng còn lại giữ
  nguyên từng byte. Không đổi cân bằng game, không đổi state, không cần chạy SQL.
- **Tương thích**: hoàn toàn ngược tương thích. Đường không truyền `daylight` (bảo tàng + theme
  tối) cũng sáng lên theo, đúng hướng cải thiện.
- **Test**: 477 → **478** bài. Hai hàng rào mới đều đã chứng minh ĐỎ trước giá trị cũ.

## 2026-08-12 — Thành Phố (Phase 4′-d): test nối phiên thật của store với câu chữ hiện ra

- **Mục đích**: bịt chỗ hở giữa hai lớp test cũ. Test engine dùng giàn giáo tự dựng; phép soi
  trình duyệt bơm thẳng `pendingReward`. Không lớp nào chứng minh `completeFocusSession` thật sự
  sinh ra `newlyBuiltIds` — đổi tên trường hay lọc nhầm kỷ thì không có gì đỏ.
- **Phạm vi**: `src/store/gameStore.cityMoment.test.js` (MỚI, 6 bài). Không đổi một dòng code chạy.
- **Ảnh hưởng**: chỉ thêm lưới an toàn. Bao gồm một bài khoá bất biến "`pendingReward` không được
  lưu xuống đĩa" (điều kiện an toàn của ADR-010, trước nay chưa ai kiểm).
- **Tương thích**: giữ nguyên hoàn toàn.

---

## 2026-08-12 — Thành Phố (Phase 4′-c): lúc bấm Bắt đầu, màn hình nói phiên này để làm gì

- **Mục đích**: Phase 4′ khép ĐUÔI vòng lặp (xong phiên → thấy thành phố lớn lên); phase này khép
  ĐẦU vòng lặp. Một dòng ngay dưới lời chào: đang xây gì, còn mấy phiên — và khi phiên tới là
  phiên hoàn thành thì nói to hẳn lên.
- **Phạm vi**: `engine/cityMoment.js` thêm `buildFocusTease` (thuần) + 6 bài test;
  `components/city/FocusCityTease.jsx` (MỚI); `App.jsx` cắm vào cột giữa, trên đồng hồ;
  `hooks/useCityGrowthMoment.js` → `hooks/useCityMoment.js` (hai hook dùng chung một snapshot).
- **Ảnh hưởng**: chỉ màn Tập trung, thêm một dòng chữ tĩnh. Store, engine game, cân bằng: không
  đổi. Không có gì đáng nói ⇒ không render gì (im lặng là mặc định).
- **Trung thực**: không hứa hẹn gì về nguyên liệu, và im lặng hoàn toàn với người chưa từng xây.
- **Tương thích**: giữ nguyên hoàn toàn.

---

## 2026-08-12 — Sửa thứ tự lớp: chuông thông báo nổi trên mọi hộp thoại

- **Mục đích**: chuông ở `z-[75]` cao hơn TẤT CẢ hộp thoại của app (z-50/60/70), nên mỗi lần một
  hộp thoại mở ra thì chuông vẫn sáng trưng trên lớp mờ và bấm vào được. Lỗi có sẵn từ lâu, ảnh
  hưởng cả màn hình phần thưởng; chỉ lộ ra khi chụp ảnh khung iPhone của lễ mừng Phase 4′.
- **Phạm vi**: `NotificationCenter.jsx` đổi `z-[75]` → `z-[45]` (một dòng);
  `notificationLayer.test.js` (MỚI) khoá bất biến "chuông luôn dưới dải hộp thoại", có quét cả
  thư mục nên hộp thoại thêm sau này cũng được kiểm.
- **Ảnh hưởng**: chuông vẫn nằm trên nội dung trang thường và thanh nổi đáy màn; chỉ chìm xuống
  khi có hộp thoại đang chặn màn hình.
- **Tương thích**: giữ nguyên hoàn toàn.

---

## 2026-08-12 — Thành Phố (Phase 4′): 3,2 giây được NHÌN THẤY thành phố lớn lên

- **Mục đích**: khép kín vòng lặp "làm việc → thấy thành quả". Trước Phase này, đúng khoảnh khắc
  đáng giá nhất — lúc chuông báo hết 25 phút — Đàm chỉ thấy một hộp thoại vật phẩm; thành phố có
  lớn lên thật nhưng anh không được nhìn thấy nó lớn lên.
- **Phạm vi**: `engine/cityMoment.js` (MỚI, thuần) + test; `hooks/useCityGrowthMoment.js` (MỚI);
  `components/city/CityGrowthMoment.jsx` (MỚI); `App.jsx` thêm `RewardSequence`;
  `gameStore` thêm đúng một trường hiển thị `pendingReward.newlyBuiltIds`;
  `utils/runtimeRecovery.js` thêm `createRecoverableLazy(...).preload()` + test.
- **Ảnh hưởng**: store, engine game, cân bằng — **không đổi**. `lootModalOpen` vẫn bật đồng bộ y
  như cũ; chỉ phần HIỂN THỊ được chen thêm một chặng. Không thêm byte nào lên Supabase.
- **Trung thực hơn hiệu ứng**: thành phố không đổi gì thì KHÔNG có khoảnh khắc nào — đi thẳng vào
  phần thưởng, không khen rỗng.
- **Tương thích**: giữ nguyên hoàn toàn. Bật "giảm chuyển động" ở mức hệ điều hành ⇒ bỏ qua sạch.

---

## 2026-08-12 — Thành Phố (Phase 3L): nói cho Đàm biết là chạm được

- **Mục đích**: Phase 3K dựng xong tính năng chạm nhưng không có gì trên màn hình nói rằng nó tồn
  tại — cảnh 3D trông y hệt một bức tranh. Một tính năng không ai biết là một tính năng không có.
- **Phạm vi**: `CityStage` thêm dòng nhắc dưới cảnh; `CityScene3D` đổi con trỏ khi rê chuột qua
  công trình (máy tính); test khoá `chrome={false}` ở `CityBackdrop`.
- **Ảnh hưởng**: chỉ tab Thành Phố. Lớp nền trang chủ không có dòng nhắc lẫn đổi con trỏ.
- **Tương thích**: giữ nguyên hoàn toàn.

---

## 2026-08-12 — Thành Phố (Phase 3K): chạm vào công trình để biết nó là ai

- **Mục đích**: Đàm yêu cầu *"game hoá lên… đột phá hơn"*. Trước Phase này thành phố 3D là một bức
  tranh — kéo xoay được, nhưng không chạm được vào bất cứ thứ gì. Nay chạm vào một căn nhà thì nó
  tự nói tên, loại, độ hiếm, cấp và đặc quyền đang mang lại; chạm vào giàn giáo thì nói còn mấy
  phiên nữa và sẽ mở khoá gì.
- **Phạm vi**: `engine/city3d/pick.js` (MỚI, thuần: hộp bao + tia cắt hộp) + test;
  `sceneGraph` xuất thêm `pickTargets` (dữ liệu thuần, 0 lệnh vẽ); `CityScene3D` thêm `onPick`;
  `CityStage` hiện thẻ nổi; `BuildingCard.jsx` (MỚI); `computeCityLayout` thêm `perk` cho công
  trình đã xây; dòng danh sách tương ứng được tô sáng theo lựa chọn.
- **Ảnh hưởng**: **không phá vỡ tối ưu một-lệnh-vẽ** — cả thành phố vẫn gộp thành một khối hình
  học, việc dò va chạm làm bằng toán chứ không bằng `Raycaster`. Lớp nền trang chủ KHÔNG chạm được
  (hai lớp chặn + test). Bộ vẽ 2D không có tính năng này, đúng vai trò "đường lui".
- **Tương thích**: giữ nguyên hoàn toàn. `perk`/`pickTargets` là dữ liệu thêm; không đụng state.

---

## 2026-08-12 — Thành Phố (Phase 3J): thanh chuyển kỷ tự kéo kỷ đang xem vào tầm mắt

- **Mục đích**: sửa một lỗi chỉ lộ ra khi chơi lâu — các kỷ đã đi qua xếp trước kỷ hiện tại trong
  thanh cuộn ngang, nên nút Đàm quan tâm bị đẩy dần ra ngoài màn hình (đo thật ở kỷ 7: cụt 47px).
- **Phạm vi**: `EraSwitcher` tự tính `scrollLeft` để căn nút đang xem vào giữa, căn lại qua
  `ResizeObserver` khi font nạp xong; thêm test khoá ở `cityRenderers.test.js` + helper `codeOnly()`
  bỏ chú thích trước khi so mã nguồn.
- **Ảnh hưởng**: chỉ màn hình Thành Phố. Không đụng state, dữ liệu, hay bộ vẽ.
- **Tương thích**: giữ nguyên hoàn toàn.

---

## 2026-08-12 — Thành Phố (Phase 3I): bảng "Đang xây" — còn bao xa và đi tới đó để làm gì

- **Mục đích**: Phase 3H dựng được giàn giáo trong cảnh, nhưng nhìn giàn giáo thì chỉ biết "chỗ này
  sắp có nhà". Phase này biến nó thành một mục tiêu cho hôm nay: bảng liệt kê công trình đang xây,
  mỗi dòng nói **còn mấy phiên** và **mở khoá đặc quyền gì**.
- **Phạm vi**: `computeCityLayout` trả thêm `reward` (nhãn `perk.label`) trên mỗi giàn giáo;
  `CityViewShell` thêm bảng "Đang xây" (xếp gần-xong-lên-đầu, thanh tiến độ có `role="progressbar"`),
  ô số liệu thứ tư đổi từ "Cảnh vật" sang "Đang xây" khi có công trường, và trạng thái "Bãi đất
  trống" không còn che mất công trường đầu tiên. Không đụng state, không thêm dependency.
- **Ảnh hưởng**: trả lời được câu "làm nốt phiên này thì được gì" — trước đây không màn hình nào
  trong app trả lời được. Bảo tàng không có bảng này (kỷ đã niêm phong thì không còn gì đang xây).
- **Tương thích**: giữ nguyên hoàn toàn — `reward` là trường mới, thiếu dữ liệu thì bằng `null` và
  dòng chữ tự biến mất.

---

## 2026-08-12 — Thành Phố (Phase 3H): công trình đang xây → thành phố lớn lên sau MỖI phiên

- **Mục đích**: Đàm yêu cầu *"game hoá lên… không bị chán"*. Trước Phase này thành phố chỉ đổi khi
  một công trình HOÀN THÀNH — rẻ nhất 4 phiên, đắt nhất 11 phiên — nên Đàm có thể làm việc cả tuần
  mà thành phố không nhúc nhích. Nay công trình đang xây hiện thành giàn giáo mọc cao thêm một nấc
  sau mỗi phiên.
- **Phạm vi**: `computeCityLayout` nhận thêm tham số tuỳ chọn `pending` (đúng shape `craftingQueue`)
  và trả thêm `scaffolds`; `CityView`/`CityBackdrop` truyền vào; `buildScaffoldSpec` sửa hình cho ra
  cái lồng thay vì cái cổng; bộ vẽ 2D thêm hình giàn giáo. Không đụng state, không thêm dependency.
- **Ảnh hưởng**: 90% hạ tầng vốn đã có sẵn từ các Phase trước (`craftingQueue`, `sessionsToComplete`,
  `buildScaffoldSpec`, `sceneGraph` đọc `layout.scaffolds`) — thiếu đúng một mắt xích là bố cục
  chưa bao giờ sinh ra `scaffolds`, nên `?? []` luôn rỗng và tính năng im lặng không tồn tại.
  Bảo tàng KHÔNG có giàn giáo (bất biến "bảo tàng bất động", ADR-007).
- **Tương thích**: giữ nguyên hoàn toàn — có test khoá "không truyền `pending` ⇒ bố cục giống hệt
  bản cũ từng byte".

---

## 2026-08-12 — Thành Phố (Phase 3G): quét đủ 15 kỷ × 6 chặng ngày và vá mỹ thuật

- **Mục đích**: Đàm yêu cầu *"quét đủ 15 kỷ × 6 chặng ngày đi… đánh bóng mọi thứ lên"*. Quét 90 ô
  × 2 theme = 180 cảnh và xem tận mắt từng ô.
- **Phạm vi**: `scripts/city-preview.mjs` thêm chế độ `--sweep` (ghép nhiều cảnh vào MỘT bảng liên
  hoàn, một bundle, một WebGL context dùng lại); `palette3d.js` + `daylight.js` vá 6 lỗi mỹ thuật.
  Không đụng dữ liệu game, không đụng state, không thêm dependency.
- **Ảnh hưởng**: 4 trong 6 lỗi (mái tím sen ở 6/15 kỷ · mặt đất màu cỏ nhân tạo ở 7/15 kỷ · kính
  ngả tím · ánh trăng xanh lục) hoá ra là **cùng một cái bẫy nội suy góc màu, lần thứ tư**. Vá vào
  PHÉP PHA chứ không vá từng con số: sắc kỷ nay trộn trong RGB, nên cả họ lỗi này không thể tái
  xuất hiện với bất kỳ kỷ hay vai màu nào thêm về sau. Hai lỗi còn lại: theme tối làm giữa trưa
  cũng tối như nửa đêm (nay đồng hồ quyết độ sáng cảnh, không phải theme — đóng `TECH_DEBT #11`),
  và cả vòm trời dùng chung một đích màu (nay đỉnh trời và chân trời có đích riêng).
- **Tương thích**: giữ nguyên hoàn toàn. Mọi chỗ gọi `buildScenePalette` KHÔNG truyền `daylight`
  (bảo tàng và các màn hình cũ) vẫn cho ra kết quả theo theme y như trước.

---

## 2026-08-12 — Thành Phố (Phase 3F): thành phố ra trang chủ

- **Mục đích**: Đàm yêu cầu *"đem nó ra trang chủ hoặc làm cái gì đó đột phá hơn nữa"*. Trước Phase
  này, thành phố nằm trong một tab riêng — nghĩa là thứ Đàm xây được gần như vô hình đúng vào lúc
  anh đang xây nó. Nay nó là lớp nền mờ phía sau đồng hồ ở trang Tập Trung.
- **Phạm vi**: `CityBackdrop.jsx` (mới) thuê lại `CityStage` chứ không dựng cảnh riêng;
  `CityStage`/`CityScene3D` nhận thêm 4 công tắc để cùng một bộ vẽ đóng hai vai. Cài đặt mới
  `cityHomeBackdrop` (mặc định bật). Không đụng dữ liệu game, không đụng logic timer.
- **Luật hiệu năng riêng cho trang chủ** (ngặt hơn tab Thành Phố vì thời lượng — 25 phút so với vài
  chục giây): đang chạy phiên ⇒ thành phố đứng yên tuyệt đối; điện thoại ⇒ luôn đứng yên; lớp nền
  không nhận thao tác; hỏng thì biến mất không một lời thay vì hiện bảng báo lỗi; máy không chạy
  được 3D thì trả về nền trơn chứ không lùi về bản vẽ 2D.
- **Ảnh hưởng**: `npm test` **412 → 418**. `settingsStore` **version 7 → 8** (tự động, không cần
  thao tác gì). Chunk chính **134,54 KB gzip** — chỉ +0,1 KB, nhờ nạp lười lớp nền.
- **Tương thích**: hoàn toàn ngược. Tắt cài đặt là trang chủ trở lại y như trước. Bản lưu cũ mặc
  định BẬT tính năng mới. Không cần chạy SQL, không cần migration dữ liệu.

---

## 2026-08-12 — Thành Phố (Phase 3D): thành phố đổi theo giờ trong ngày

- **Mục đích**: Đàm yêu cầu *"nhiều animation lên và nhiều hiệu ứng hơn"*. Cho tới trước Phase này,
  thành phố trông y hệt nhau ở mọi thời điểm — mở lúc 6 giờ sáng hay 11 giờ đêm cũng là đúng một
  bức ảnh. Nay mỗi lần mở app là một cảnh khác, mà **không thêm một hình khối nào và không thêm một
  byte nào vào state**.
- **Phạm vi**: 6 chặng trong ngày (rạng sáng/sáng/trưa/chiều/chạng vạng/đêm) đổi hướng + độ ấm +
  cường độ nắng, đèn nền, sắc trời · ô cửa **sáng đèn** ban đêm · **vũng sáng ấm** hắt xuống chân
  công trình ban đêm · vai màu riêng cho mặt nước. Lấy **giờ Việt Nam**, không phải giờ máy.
  Không đụng dữ liệu, không đụng state, không đụng cân bằng game.
- **Ba lỗi mỹ thuật đã sửa — cả ba đều lint/test xanh, chỉ ảnh chụp mới thấy**: (a) cảnh đêm gần
  như đen thui vì đêm bị làm tối ở hai chỗ độc lập rồi nhân dồn lên nhau; (b) bầu trời ngả hồng và
  tím sen vì nội suy góc màu đi đường ngắn xuyên qua vùng tím — đã sửa vào gốc bằng cách bỏ hẳn
  phép xoay góc màu khỏi đường dựng màu trời; (c) mặt nước biến thành hộp đèn vì dùng chung vai màu
  với cửa kính, mà vai đó ban đêm được đối xử là "tự phát sáng".
- **Ảnh hưởng**: `npm test` **394 → 412**. Chunk `vendor-three` 130,8 KB gzip — không đổi, vẫn dưới
  trần 135 KB của cổng hiệu năng 3A. Mọi lưới an toàn hiệu năng giữ nguyên; đèn điểm là nguồn sáng
  duy nhất tính theo điểm ảnh nên có ngân sách riêng (điện thoại 2, máy bàn 3) và hiện trên HUD.
- **Tương thích**: hoàn toàn ngược. Không truyền tham số giờ ⇒ ánh sáng trung tính y như trước.
  Không cần chạy SQL, không cần migration.

---

## 2026-08-12 — Thành Phố (Phase 3C): ánh sáng Phục Hưng

- **Mục đích**: Đàm yêu cầu *"làm đẹp như các bức tranh phục hưng"*. Phase này **không thêm một hình
  khối nào** — chỉ đổi cách ánh sáng và màu được diễn giải. Bài học chính: thứ làm một cảnh 3D đẹp
  lên hầu như không nằm ở mô hình.
- **Phạm vi**: hướng nắng · tone mapping · tỉ lệ nắng/đèn nền · bảng màu hai theme · viền tối góc ·
  quầng sáng mặt trời trên vòm trời · khoảng cách camera. Không đụng dữ liệu, không đụng state.
- **Lỗi lớn nhất đã sửa**: **mặt trời vốn đứng ngay sau lưng camera** (tích vô hướng với trục nhìn
  = −0,98) — kiểu chiếu sáng như đèn flash máy ảnh, làm mọi hình khối bẹp dí và vô hiệu hoá toàn bộ
  công dựng dáng nhà ở Phase 3B. Không lint/build/test nào bắt được vì code hoàn toàn hợp lệ; nay
  đã có **test hình học khoá lại**.
- **Ảnh hưởng**: 393 → **394 bài test, 0 fail**. Chunk chính KHÔNG to thêm (134,44 KB gzip). Viền
  tối góc làm bằng CSS nên **không tốn thêm một khung hình nào** — luật pin giữ nguyên.
- **Tương thích**: hoàn toàn tương thích ngược, không cần chạy SQL, không đổi phiên bản store nào.

## 2026-08-12 — Thành Phố (Phase 3B): 75 công trình khác nhau thật + thành phố có người ở

- **Mục đích**: Đàm xem bản 3A rồi nói *"quá đơn giản và không đẹp"*, và yêu cầu *"tối ưu hình ảnh
  và cộng đồng cư dân, làm đẹp như các bức tranh phục hưng, nhiều animation lên"*. Phase 3B lo hai
  vế đầu: **hình khối** và **cư dân**.
- **Phạm vi**:
  - **Ngôn ngữ hình khối 3 trục** — hình dáng công trình là hàm của (kỷ × loại × độ hiếm × cấp),
    cả ba trục đều đã có sẵn trong dữ liệu game nên **không bịa thêm một byte nào**. 15 × 4 × 3 =
    **75 công trình phân biệt được bằng mắt**, thay vì 15 nhóm giống nhau. Sáu file THUẦN mới ở
    `src/engine/city3d/` (`parts` · `eraStyle` · `archetypes` · `buildingSpec` · `propSpec` ·
    `budget`) — không file nào biết three.js tồn tại.
  - **Bảng màu tranh sơn dầu** — ba nguồn sáng cố ý khác nhiệt độ (nắng ẤM xiên, trời LẠNH rọi
    xuống, đất ẤM hắt lên), vòm trời chuyển sắc, sương mù ở rìa, vùng đất bao quanh.
  - **Cư dân** (`residents.js`) — dân số **suy ra** từ số công trình + số phiên + độ dài chuỗi;
    người đi bộ dọc đường sá trong phần phố đã mở.
- **Ảnh hưởng**: 360 → **393 bài test, 0 fail**. Cả thành phố (công trình + cảnh vật) vẫn gộp trong
  **1 lệnh vẽ** nhờ hình học gộp — "mỗi công trình một dáng riêng" KHÔNG đồng nghĩa với 75 lệnh vẽ.
  Không đổi dữ liệu, không đổi cân bằng game, **0 byte** thêm vào dữ liệu đồng bộ Supabase.
- **Đánh đổi đã cân nhắc**: cư dân đi lại ⇒ phải vẽ liên tục ⇒ phá luật "đứng yên = 0 nhịp vẽ" của
  Phase 3A. Chấp nhận vì chuyển động chính là nội dung của màn hình này, nhưng bù lại **ba lớp bảo
  vệ pin**: trần 30 khung/giây, dừng hẳn khi rời tab, tắt sạch khi bật "giảm chuyển động" của hệ
  điều hành hoặc khi xem bảo tàng.
- **Tương thích**: hoàn toàn tương thích ngược, không cần chạy SQL, không đổi phiên bản store nào.

## 2026-08-12 — Thành Phố (Phase 3A): bộ vẽ 3D thật (three.js) + bảng đo hiệu năng

- **Mục đích**: thay bộ vẽ phẳng bằng 3D thật. Phase này CỐ Ý dừng ở hình khối thô — mục tiêu là
  **đo xem iPhone của Đàm có kham nổi không** trước khi đầu tư vào mỹ thuật. Đẹp là việc Phase 3B.
- **Phạm vi**: thêm đúng MỘT thư viện — `three@0.185.1` (ghim cứng, không `^`; thư viện này không
  có dependency con nào). Bốn file logic THUẦN mới ở `src/engine/city3d/` (luật chọn 3D/2D, nhịp
  khung hình, toán camera, cầu nối màu) + `src/components/city/render3d/` (nơi DUY NHẤT được import
  three) + `CityStage.jsx` chọn bộ vẽ + `CityPerfHud.jsx`. Cài đặt mới: "Thành Phố" (Tự động / Luôn
  3D / Luôn 2D) và công tắc bảng số liệu hiệu năng.
- **Ảnh hưởng**: **chunk chính KHÔNG to thêm** (134,4 KB gzip, y như trước) — three.js nằm ở chunk
  riêng `vendor-three` (130 KB gzip) chỉ tải khi thật sự dùng tới bản 3D. Không đổi dữ liệu, không
  đổi cân bằng game. 315 → **360 bài test, 0 fail.**
- **Luật pin**: thành phố đứng yên ⇒ **không một nhịp vẽ nào tồn tại** (không phải "có nhịp nhưng
  bỏ qua"). Bóng đổ chỉ tính lại khi cảnh thật sự đổi. Cả thành phố gộp còn **3 lệnh vẽ**.
- **Ba cửa lùi về 2D**, cửa nào cũng dẫn về hình chứ không dẫn tới màn hình trống: máy không có
  WebGL2 → 2D ngay; dựng cảnh thất bại → 2D; đang chạy mà mất tài nguyên đồ hoạ hoặc quá chậm → tự
  chuyển về 2D kèm một dòng giải thích cho Đàm biết vì sao hình vừa đổi kiểu.
- **Tương thích**: hoàn toàn tương thích ngược, không cần chạy SQL. `settingsStore` version 6 → 7
  (xem `MIGRATION.md`) — 0 byte thêm vào dữ liệu đồng bộ Supabase.
- **✅ Cổng hiệu năng đã qua** — nhưng qua bằng QUYẾT ĐỊNH của Đàm sau khi xem trên máy thật
  (*"hãy tiếp tục xây dựng sản phẩm và không dừng lại"*), không bằng con số đo. Vì vậy **mọi lưới
  an toàn giữ nguyên**: watchdog FPS, ba cửa lùi về 2D, và bản 2D vẫn nằm đó làm nền.

## 2026-08-12 — Thành Phố (Phase 3-2D): tab Thành Phố hiện ra, vẽ bằng SVG

- **Mục đích**: cho Đàm NHÌN THẤY thành phố của mình lần đầu — hai Phase trước chỉ dựng dữ liệu,
  chưa có gì trên màn hình. Đồng thời dựng sẵn chỗ đứng cho bộ vẽ 3D (three.js) đã được duyệt làm
  tiếp, mà không phải đập đi làm lại phần khung.
- **Phạm vi**: tab mới "Thành Phố" (`CityView.jsx`, nạp lười — chunk riêng ~14 KB) + thư mục
  `src/components/city/` chia làm KHUNG (`CityViewShell.jsx`) và BỘ VẼ (`render2d/`). Sửa
  `src/App.jsx` đúng 5 chỗ (import lười, icon, 2 danh sách tab, khối render). **Không đụng
  `store/`, `engine/`, `hooks/`, `lib/`** — 0 dòng thay đổi logic game.
- **Ảnh hưởng**: thuần hiển thị, không đổi dữ liệu, không đổi cân bằng, không thêm thư viện nào.
  Thanh tab dưới trên iPhone vẫn giữ đúng 4 nút chính — "Thành Phố" nằm trong nút "Thêm". Toàn bộ
  144 ô nền được gộp thành 4 phần tử SVG để giữ số phần tử DOM thấp. 309 → **315 bài test, 0 fail**
  (+6 bài đọc mã nguồn để khoá ranh giới kiến trúc, đặt sẵn trước khi three.js xuất hiện).
- **Tương thích**: hoàn toàn tương thích ngược. Không cần chạy SQL, không migration.
- **Quyết định kiến trúc**: KHUNG không biết BỘ VẼ nào đang chạy, và bộ vẽ 2D được giữ làm nền
  **vĩnh viễn** (đường lui khi máy không có WebGL / mất context / Đàm tự chọn tắt 3D) chứ không
  phải bản nháp sẽ xoá — xem ADR-008.

## 2026-08-12 — Thành Phố Pixel (Phase 1–2/6): nền móng thuần + bảo tàng thành phố các kỷ đã qua

- **Mục đích**: biến "danh sách công trình đã xây" thành một thành phố nhìn thấy được, và ngừng
  XOÁ VĨNH VIỄN thành phố của mỗi kỷ khi lên kỷ mới. Đàm duyệt spec ngày 2026-08-12 và **miễn trừ
  cổng Giai đoạn A** riêng cho hạng mục gamification này.
- **Phạm vi**: Phase 1 — 2 file engine THUẦN mới (`src/engine/cityLayout.js` suy ra bố cục thành
  phố bằng băm tất định, `cityArchive.js` quản lý bảo tàng) + 2 file test, **0 dòng đụng vào state
  hay UI**. Phase 2 — thêm đúng MỘT trường state `cityArchive`, sửa `pruneEraScopedBlueprintState`
  để ghi lại thứ nó cắt, bump `GAME_STORE_SCHEMA_VERSION` 3 → 4, và thêm `cityArchive` vào cả 3
  danh sách trường được lưu (localStorage · file backup · đồng bộ Supabase).
- **Ảnh hưởng**: **cân bằng game KHÔNG đổi một chút nào** — công trình kỷ cũ vẫn bị cắt y hệt, chỉ
  được sao chép sang một kho riêng chỉ-để-ngắm trước khi bị vứt. Có test hồi quy khoá điều này.
  State phình thêm ~1,7 KB cho cả 15 kỷ (+0,07%). Chưa có gì hiện ra trên màn hình — UI là Phase 3.
  261 → **309 bài test, 0 fail**.
- **Tương thích**: hoàn toàn tương thích ngược, không cần chạy SQL Supabase (thay đổi nằm trong
  khối JSONB sẵn có). Save cũ thiếu `cityArchive` → mặc định `{}`. Xem `MIGRATION.md` schema 3→4.
- **Giới hạn phải biết**: thành phố các kỷ Đàm ĐÃ đi qua trước 2026-08-12 mất vĩnh viễn, không
  khôi phục được — bảo tàng chỉ ghi từ kỷ đang chơi trở đi; kỷ cũ hiện là "Thành phố thất truyền".

## 2026-08-10 — Sửa khoảng trắng thừa trên icon thanh menu Mac

- **Mục đích**: bỏ khoảng trắng nằm ngay trước 🍅 (đang tập trung) và ☕ (đang giải lao) trên thanh
  menu Mac.
- **Phạm vi**: `electron/main.js` (1 dòng: `nativeImage.createEmpty()` thay cho việc nạp một PNG
  trong suốt) + xoá asset `public/tray-empty.png`. KHÔNG đụng web app.
- **Ảnh hưởng**: thuần hiển thị của app tray; không đổi logic timer, không đổi dữ liệu, không đổi
  API. 261 test giữ nguyên và vẫn xanh.
- **Tương thích**: không cần migration. Cần khởi động lại app tray để thấy thay đổi.
- **Bài học**: "ảnh trong suốt" không bằng "không có ảnh" — macOS vẫn chừa chỗ cho ảnh 16x16 dù
  alpha = 0 (`CLAUDE.md`, BẪY 4).

## 2026-07-17 — Giai đoạn A: bản vá C1 (đóng blocker Critical của lớp đồng bộ)

- **Mục đích**: bịt 4 đường mất dữ liệu quanh cơ chế "First Action Wins" mà compare-and-swap
  không tự đỡ được — thiết kế đã qua 2 vòng phản biện (Principal Engineer tự bác bỏ + Technical
  Advisor) trước khi viết dòng code đầu tiên.
- **Phạm vi**: chỉ `src/lib/syncService.js` (~60 dòng) + test. Đẩy ngay khi rời app nếu còn thay
  đổi chờ; chặn state trắng ghi đè cloud (`hasMeaningfulState`); bịt đường ghi không-CAS ở nhánh
  chưa-biết-version; báo to khi thiếu cột `version`; huỷ lịch push mồ côi khi nạp bản cloud.
- **Ảnh hưởng**: không đổi giao thức, không đổi schema, không đổi API công khai; 253→261 test.
- **Tương thích**: không cần migration mới (cột `version` đã có từ 2026-07-11).
- **Chưa làm (có chủ đích)**: merge theo trường cho xung đột offline khác-trường — xem
  `TECH_DEBT.md` #8.

## 2026-07-17 — Giai đoạn A: lưới an toàn đợt 2 (level-up, prestige, streak, skill, sync-retry)

- **Mục đích**: hoàn tất phần còn thiếu của "safety net" — bảo đảm các tài sản quan trọng (SP,
  cấp độ, chuỗi ngày, và đặc biệt toàn bộ dữ liệu giữ-lại khi Thăng Hoa) không mất âm thầm sau
  các thao tác chính.
- **Phạm vi**: +16 bài test (237→253), gồm 1 file MỚI `gameStore.prestige.test.js` (bảo toàn
  từng khoá whitelist qua `triggerPrestige` + đóng băng bug TECH_DEBT #3 bằng characterization)
  và bổ sung vào 4 file test có sẵn (`computeLevelUps` trực tiếp, streak nối/đứt chuỗi,
  `unlockSkill` cơ bản, sync retry-sau-lỗi).
- **Ảnh hưởng**: chỉ-thêm-test; không đổi một dòng code ứng dụng; lint sạch; build OK.
- **Tương thích**: không thay đổi runtime/API/migration.
- **Ghi chú**: bug #3 (3 kỹ năng Thăng Hoa hứa đặc quyền nhưng không nối dây) nay bị ĐÓNG BĂNG
  bằng test — sửa #3 trong tương lai bắt buộc phải cập nhật test đó một cách có ý thức.

## 2026-07-13 — Giai đoạn A: lưới an toàn test cho đường-tiền + đường-sync + hủy phiên

- **Mục đích**: dựng "safety net" characterization/behavior test TRƯỚC khi được phép refactor hoặc
  sửa logic quan trọng — đòn bẩy #1 để tiến gần cổng Giai đoạn A của roadmap POS (tiêu chí "test đủ
  bảo vệ module quan trọng").
- **Phạm vi**: 3 file test MỚI, chỉ-thêm-test: `gameStore.completeFocusSession.test.js` (15 bài),
  `syncService.behavior.test.js` (8 bài), `gameStore.cancelFocusSession.test.js` (6 bài). Khóa
  hành vi thật của XP/EP/level/loot/RNG-tất-định, push/pull compare-and-swap (thắng/thua/re-pull/
  lỗi), và phạt/rollback khi hủy phiên.
- **Ảnh hưởng**: `npm test` 208→237 bài (xanh hết); lint sạch; build OK. **KHÔNG đổi một dòng code
  ứng dụng nào** — bundle production không đổi (Vite không đóng gói file test).
- **Tương thích**: không có thay đổi runtime, không đổi API, không migration.
- **Ghi chú**: test #7 của sync KHÓA CHỦ ĐÍCH hành vi rủi ro C1 (initSync đẩy local vô điều kiện khi
  cloud không mới hơn) làm đặc tả hiện trạng; các nhánh phạt early-return + waive-bằng-than-lượng +
  bảo tồn dữ liệu qua prestige còn để dành (NOTE trong file test).

## 2026-07-12 — Refactor kiến trúc toàn dự án + thiết lập Project Governance Protocol

- **Mục đích**: dọn trùng lặp code tích luỹ qua nhiều tháng, chuẩn hoá cấu trúc thư mục theo domain,
  giảm coupling — theo yêu cầu "Senior Software Architect" của Đàm (10 nguyên tắc rõ ràng).
- **Phạm vi**: 90 file bị đụng (thêm/sửa/xoá/dời); gom toàn bộ AI Coach vào `src/engine/coach/`;
  gộp 9 mảng logic bị chép tay nhiều nơi (mark-label, AudioContext, auth-check cron, badge/style,
  Rich Text parser, Glyph icon, pipeline Gemini, payload push, helper Gemini thuần); xoá dead code
  (~1350 dòng); thêm `ARCHITECTURE.md`+`PROJECT_STRUCTURE.md`.
- **Ảnh hưởng**: `npm test` 195→208 bài; lint sạch; build OK; vẫn đúng 10 Serverless Functions.
- **Tương thích**: không đổi business logic ngoài 1 bug xác nhận đã sửa (`isSessionEndEvent` lệch
  chuẩn giữa 2 route push, nay hợp nhất 1 bản đúng).
- **Đi kèm**: thiết lập Project Governance Protocol (file này + `TECH_DEBT.md`+`MIGRATION.md`+
  `ARCHITECTURE_DECISIONS.md`+`AI_ONBOARDING.md` mới, section governance mới trong `CLAUDE.md`).

## 2026-07-11 — Sự cố kép: sync mất dữ liệu + Supabase tự pause + vượt trần Vercel function

- **Mục đích**: xử lý 3 sự cố production liên tiếp trong cùng một ngày.
- **Phạm vi**: (1) thiết kế lại cơ chế sync sang "First Action Wins" (version compare-and-swap
  phía server, thay cho so sánh timestamp client); (2) dọn log cron phình dung lượng + thêm cron
  keepalive chống Supabase tự pause; (3) chuyển toàn bộ test `api/` vào `api/_tests/` để không còn
  bị Vercel tính oan vào trần 12 Serverless Functions.
- **Ảnh hưởng**: mất vĩnh viễn 1 phiên tập trung thật (không phục hồi được, chấp nhận có chủ đích
  để không tạo dữ liệu giả đi vòng qua hệ thống XP/streak).
- **Tương thích**: đổi schema DB (thêm cột `version` cho `game_state`) — xem `MIGRATION.md`.
- **Chi tiết đầy đủ**: `BAN_GIAO.md` (3 mục nhật ký cùng ngày) + `ARCHITECTURE_DECISIONS.md` ADR-004/005.

## 2026-06-25 — Hoàn tất chuỗi 6 mảng nâng cấp trí tuệ AI Coach

- **Mục đích**: nâng cấp toàn diện AI Coach theo lệnh "làm toàn bộ, chuyên sâu" của Đàm.
- **Phạm vi**: (1) siết niềm tin (nhiệt độ giải mã, bộ chấm điểm chống-bịa, timeout); (2) tín hiệu
  "phiên liền mạch vs ngắt quãng" (`pauseSegments`); (3) Coach chủ động tự nhắc sau mỗi phiên; (4)
  model mạnh hơn (`gemini-2.5-pro`) cho bài phân tích 4 phần; (5) bộ nhớ lời khuyên theo thời gian;
  (6) cảnh báo chuỗi sắp đứt qua push (cron chiều tối).
- **Ảnh hưởng**: AI Coach trở thành tính năng khác biệt hoá lớn nhất của app.
- **Lưu ý tương thích quan trọng**: mảng (6) từng bị Vercel build FAIL âm thầm ngay khi commit (do
  cùng nguyên nhân vượt trần function ở trên) — KHÔNG chạy thật trên production suốt 25/6–11/7 dù
  tài liệu ghi "hoàn tất". Bài học: xác nhận Vercel Deployments "Ready", đừng tin code xanh.

## 2026-06-24 — Chốt AI Coach: chỉ Gemini đám mây, gỡ hẳn Qwen/WebLLM on-device

- **Mục đích**: Qwen 3B chất lượng kém + không chạy được trên iPhone.
- **Phạm vi**: xoá `webllmEngine.js`, dependency `@mlc-ai/web-llm`, mọi nhánh fallback on-device.
  Bật billing Gemini (hết lỗi 429).
- **Ảnh hưởng**: app nhẹ hơn hẳn, AI Coach chạy được TRÊN CẢ IPHONE.
- **Tương thích**: đánh đổi có chủ đích — mất mạng/hết quota = Coach ngừng, không còn dự phòng
  chạy tại chỗ. Xem `ARCHITECTURE_DECISIONS.md` ADR-003.

## 2026-06-20 → 2026-06-24 — Nhiều vòng nâng cấp "bộ não" AI Coach (chuyên gia hoá + chống-bịa)

- **Mục đích**: Coach từ một bộ trả lời đơn giản trở thành "chuyên gia phân tích dữ liệu" đáng tin.
- **Phạm vi**: khung 3 nhịp (chat)/4 phần (báo cáo tổng thể); lưới chống-bịa số nhiều tầng
  (`findFabricatedNumbers`/`findFabricatedFractions`/`findMismatchedPairs`); tầng số liệu
  `coachIntel.js` (Wilson lower bound, hồ sơ tập trung, dự đoán); nhiều tín hiệu phân tích mới
  (giờ vàng, xu hướng dài hạn, cuối tuần vs trong tuần, phục hồi sau nghỉ...).
- **Ảnh hưởng**: đặt nền móng "AI chỉ diễn đạt số đã tính sẵn, không bao giờ tự tính" — nguyên tắc
  áp dụng xuyên suốt tới nay.
- **Chi tiết đầy đủ**: `BAN_GIAO.md` có ~15 mục nhật ký riêng cho giai đoạn này (mỗi lần chỉnh guard
  đều ghi số liệu BẮT%/BÁO NHẦM% cụ thể).

## 2026-06-20 — "Cộng Hưởng": nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu

- **Mục đích**: liên kết 3 hệ thống tiến triển vốn tách rời, không lạm phát.
- **Phạm vi**: thêm currency TTCH (Tinh Thể Cộng Hưởng, cap 12), cơ chế cộng hưởng di vật↔kỹ năng
  (giảm 50% giá SP), "Dồn Lực" (chỉ 1 hiệu ứng bùng nổ/phiên), softcap phòng-hờ cho tương lai.
- **Ảnh hưởng**: không đổi additive-pool hiện có; mọi softcap mới là no-op tại thời điểm ra mắt
  (phòng hờ cho nội dung tương lai).

## 2026-06-14 → 2026-06-16 — Làm lại giao diện theo hướng "calm focus" + 4 skin + icon riêng

- **Mục đích**: UI/UX review đa chiều, chọn hướng "tập trung tĩnh lặng".
- **Phạm vi**: "Focus tĩnh" khi đang chạy phiên (ẩn huy hiệu game); 4 skin (Editorial/Aurora/
  Ink&Gold/Swiss) qua token CSS; bộ icon hình học tự vẽ thay emoji; sidebar tối gọn; cột phải
  Focus (Hôm nay/Chuỗi/AI Coach).
- **Ảnh hưởng**: chỉ giao diện — không đổi game logic.

## 2026-06-14 — Khởi động chuỗi nâng cấp gameplay ("upgrade roadmap")

- **Mục đích**: audit đa-agent tìm hướng nâng cấp UX/UI/gameplay, chọn hướng "deep & differentiating".
- **Phạm vi**: thưởng mục tiêu thật (+12% khi đạt goal), gợi ý độ dài phiên thông minh, lá chắn
  streak, onboarding 3 thẻ, và khởi đầu ý tưởng AI Coach.
- **Ảnh hưởng**: đặt nền cho toàn bộ các đợt nâng cấp lớn sau này.

---

## Ghi chú vận hành

- Mỗi lần hoàn thành một thay đổi ĐÁNG KỂ (không phải mọi commit nhỏ), thêm 1 mục MỚI vào ĐẦU file
  này — ngắn gọn (mục đích/phạm vi/ảnh hưởng/tương thích), không kể lể chi tiết như `BAN_GIAO.md`.
- Nếu thay đổi có một quyết định kiến trúc đáng ghi ADR → thêm cả vào `ARCHITECTURE_DECISIONS.md`
  và trỏ chéo. Nếu có migration thật → thêm vào `MIGRATION.md` và trỏ chéo.
