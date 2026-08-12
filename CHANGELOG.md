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
