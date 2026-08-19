# Cấu trúc dự án — Pomodoro DC

> Mục tiêu file này: giúp người mới (hoặc phiên AI mới) tìm đúng file trong vài giây, không phải
> đoán mò. Chi tiết quy tắc/lịch sử: xem `CLAUDE.md` + `BAN_GIAO.md`. Bức tranh lớn về kiến trúc
> (luồng dữ liệu, vì sao chia lớp thế này): xem `ARCHITECTURE.md`.
>
> ⚠️ **Cập nhật file này mỗi khi thêm/xoá/đổi tên thư mục** — cấu trúc lệch tài liệu = tài liệu vô dụng.

```
├── src/                      # App React (Vite + PWA) — chạy trên web, dùng chung với Electron
│   ├── components/           # Component React, mỗi file = 1 màn hình hoặc 1 mảnh UI lớn
│   │   │                     # ⚠️ THỨ TỰ LỚP (z-index): đồ trang trí thường trực (chuông thông
│   │   │                     #   báo) < z-50 · MỌI hộp thoại ≥ z-50. Khoá bằng
│   │   │                     #   `notificationLayer.test.js` — thêm hộp thoại mới thì đừng dùng
│   │   │                     #   z dưới 50, kẻo chuông nổi lên trên lớp mờ và bấm được
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
│   │   │   ├── cityBackdropScrim.js # Hồ sơ mốc THUẦN của lớp phủ giữ-chữ-đọc-được (2 hồ sơ: máy
│   │   │   │                     #   bàn / điện thoại, vì chữ đứng ở hai độ sâu khác nhau).
│   │   │   │                     #   ⚠️ Tách khỏi JSX vì một chuỗi CSS trong JSX thì KHÔNG bài
│   │   │   │                     #   test nào chạm tới được, mà đây là thứ sai được theo kiểu đo
│   │   │   │                     #   được — đổi bố cục trang chủ thì phải đo lại (textmap3.mjs)
│   │   │   ├── CityPerfHud.jsx   # Bảng FPS/lệnh vẽ/tam giác — để đo cổng hiệu năng Phase 3A
│   │   │   └── render3d/         # Bộ vẽ three.js — ⚠️ NƠI DUY NHẤT được import 'three'
│   │   │       ├── CityScene3D.jsx # Vỏ React: vòng đời, resize, mất context. KHÔNG chứa logic 3D
│   │   │       ├── terrainMesh.js  # MẶT ĐẤT + MẶT ĐƯỜNG: mỗi thứ MỘT tấm lưới liền có cao độ ở
│   │   │       │                   #   từng đỉnh, pháp tuyến MƯỢT (ngược hẳn công trình — xem
│   │   │       │                   #   ADR-019). Thay 144 khối hộp của thời trước Phase 8C.
│   │   │       │                   #   ⚠️ Đường là tấm RIÊNG vì ràng buộc chẵn-lẻ: nhét chung lưới
│   │   │       │                   #   thì ngõ phố không thể vừa đúng bề rộng vừa cân giữa ô
│   │   │       ├── terrainMesh.test.js # Hình học THẬT (không đọc mã nguồn): có đỉnh đúng tâm mỗi ô
│   │   │       │                   #   không · mặt đất có lén quay về bậc thang không · đường có bám
│   │   │       │                   #   sườn dốc không · ngõ có cân giữa không · ngân sách tam giác
│   │   │       ├── sceneGraph.js   # Dựng cảnh: trời/đất + ánh sáng 3 nguồn + công trình + cư dân
│   │   │       │                   #   + NƯỚNG BẢN ĐỒ MÔI TRƯỜNG từ chính bầu trời đang nhìn thấy
│   │   │       │                   #   (`paintSkyGradient` dùng chung cho vòm trời và quả cầu dò —
│   │   │       │                   #   một luật một công thức). ⚠️ Kim loại KHÔNG có bản đồ này thì
│   │   │       │                   #   render ra ĐEN, không phải "kém đẹp đi" — xem ADR-013
│   │   │       ├── sceneGraphWiring.test.js # Test ĐỌC MÃ NGUỒN: canh đường dây không thể quan sát
│   │   │       │                   #   lúc chạy nếu không dựng cả WebGL (mảng vật liệu có lấy từ
│   │   │       │                   #   `merged.families` không · có còn là PBR không · kim loại có
│   │   │       │                   #   `envMap` không). Cùng khuôn `cityViewShellWiring.test.js`
│   │   │       ├── geometryFactory.js # Mô tả hình học THUẦN → MỘT BufferGeometry đã gộp, chia
│   │   │       │                   #   NHÓM theo họ vật liệu (`addGroup`). Mọi công trình = 1 khối
│   │   │       │                   #   hình học nhưng 5–7 lệnh vẽ (một lệnh mỗi họ), KHÔNG phải 750
│   │   │       │                   #   ⚠️ Thứ tự nhóm PHẢI theo `MATERIAL_ORDER`, không theo thứ tự
│   │   │       │                   #   khối được dựng — thứ tự ấy đổi khi Đàm xây thêm một công trình
│   │   │       │                   #   Cũng là nơi NƯỚNG SẴN bóng tiếp xúc vào màu đỉnh (0đ lúc chạy)
│   │   │       ├── themeBridge.js  # Đọc CSS var từ đúng div [data-theme] (KHÔNG documentElement)
│   │   │       └── capability.js   # Dò WebGL2 bằng cách TẠO THỬ context rồi huỷ ngay
│   │   ├── Coach*.jsx         # 3 lối vào AI Coach: CoachChat (hỏi-đáp), CoachOffline (phân tích
│   │   │                     #   tổng thể), CoachNudge (tự nhắc sau phiên) — logic AI thật nằm ở
│   │   │                     #   src/engine/coach/, các file này chỉ là UI + gọi engine.
│   │   ├── StatsDashboard.jsx # Tab Thống kê — LỚN NHẤT dự án (biểu đồ, nhật ký phiên, bộ lọc).
│   │   │                     #   Hàm định dạng thuần đã tách ra statsFormatters.js cạnh nó.
│   │   ├── PomodoroEngine.jsx # Khung chính chứa đồng hồ Pomodoro/Stopwatch (UI, logic timer
│   │   │                     #   thật nằm ở src/hooks/useTimer.js)
│   │   ├── sessionGoalState.js # BA trạng thái ô "Mục tiêu phiên" (empty/partial/ready) — thuần.
│   │   │                     #   Tách ra vì hai trạng thái là KHÔNG đủ: ô chưa gõ gì mà bị dán
│   │   │                     #   màu cảnh báo thì app thành ra mắng người dùng ngay lúc mở lên.
│   │   │                     #   Cả 2 khối giao diện mục tiêu đều đọc file này ⇒ không lệch nhau.
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
│   │   ├── hashId.js          # FILE LÁ: băm tất định FNV-1a. KHÔNG import gì — đó là điểm chính.
│   │   │                     #   Tách khỏi cityLayout.js ở Phase 7C để cắt vòng import
│   │   │                     #   cityLayout ↔ city3d/dwellings. cityLayout TÁI XUẤT, không chép.
│   │   ├── cityGrid.js        # FILE LÁ: hợp đồng về mảnh đất — lưới 12×12, 5 khu đất đã hứa cho
│   │   │                     #   kỳ quan (BUILDING_ZONES), các hàng/cột có đường. Cùng lý do tách
│   │   │                     #   như hashId.js. Sai lệch giữa hai bên = nhà mọc đè kỳ quan, IM LẶNG.
│   │   ├── cityLayout.js      # THÀNH PHỐ PIXEL: suy ra bố cục từ danh sách công trình (băm tất
│   │   │                     #   ⚠️ `roadCellCandidates()` (2026-08-18) = tập ỨNG VIÊN đường, hằng
│   │   │                     #   số, ĐỪNG nhầm với mạng đã hiện trong `layout.props` — cái sau đổi
│   │   │                     #   theo tiến độ. 3 bài test ở cityLayout.test.js khoá cả hai chiều
│   │   │                     #   định, KHÔNG lưu toạ độ). Bất biến: cùng đầu vào → cùng bố cục
│   │   │                     #   vĩnh viễn + xây thêm nhà không làm xê dịch nhà cũ.
│   │   ├── cityArchive.js     # THÀNH PHỐ PIXEL: "bảo tàng" các kỷ đã niêm phong (ghi lại công
│   │   │                     #   trình bị cắt khi lên kỷ, thay vì để mất hẳn)
│   │   ├── cityCompletion.js  # THÀNH PHỐ PIXEL: "trọn vẹn kỷ" — mỗi kỷ có đúng 5 bản vẽ; file này
│   │   │                     #   trả lời "đã xây mấy trên mấy, còn thiếu cái nào". Suy ra từ
│   │   │                     #   BLUEPRINT_CATALOG, KHÔNG lưu. ⚠️ mẫu số PHẢI tự đếm, cấm viết
│   │   │                     #   cứng số 5 (có test khoá).
│   │   ├── eraLegacy.js       # THÀNH PHỐ PIXEL: "di sản dang dở" — công trình đã khởi công trước
│   │   │                     #   khi lên kỷ thì xây tiếp được, nhưng xong thì chỉ vào cityArchive
│   │   │                     #   (KHÔNG vào buildings ⇒ không perk, 0 thay đổi cân bằng). Xem
│   │   │                     #   ADR-011. ⚠️ chấm theo kỷ SAU phiên, không phải kỷ trước.
│   │   ├── craftProgress.js   # MỘT công thức duy nhất cho "đã xong mấy / còn mấy phiên" của công
│   │   │                     #   trình đang chế tạo. ⚠️ Trước đây cityLayout.js và
│   │   │                     #   BuildingWorkshop.jsx mỗi nơi tự tính, lại tra hai bảng KHÁC nhau
│   │   │                     #   (BUILDING_EFFECTS vs BLUEPRINT_META) và không kẹp biên ⇒ Xưởng in
│   │   │                     #   ra "-4/2 phiên". Mọi nơi cần con số này PHẢI gọi
│   │   │                     #   describeCraftProgress, đừng tự chia lại.
│   │   ├── cityMoment.js      # Điều đáng nói về thành phố ở CẢ HAI đầu một phiên: buildFocusTease
│   │   │                     #   (trước — phiên này đẩy cái gì tới đâu) + buildGrowthMoment (sau —
│   │   │                     #   thành phố vừa lớn lên thế nào). Chung một phép chọn công trường.
│   │   │                     #   ⚠️ Trả `null` khi không có gì thật để nói — thà im lặng còn hơn
│   │   │                     #   một câu chúc mừng rỗng (cùng luật chống-bịa với AI Coach)
│   │   ├── city3d/            # Logic THUẦN của bộ vẽ 3D — cấm import three, cấm DOM
│   │   │   ├── renderMode.js      # Luật chọn 3D/2D (FAIL-CLOSED: không chắc → 2D)
│   │   │   ├── renderLoop.js      # Nhịp khung hình: đứng yên = 0 nhịp rAF + trần FPS khi có hoạt hoạ
│   │   │   ├── orbit.js           # Toán camera xoay (tự viết, KHÔNG dùng OrbitControls). Từ VIỆC 2
│   │   │   │                      #   nhận thêm ĐIỂM NGẮM di động + `setLimits`/`getHome` để chế độ
│   │   │   │                      #   cận cảnh hạ sàn khoảng cách xuống mà không phá giới hạn toàn cảnh
│   │   │   ├── cityFocus.js      # CHẾ ĐỘ CẬN CẢNH (ADR-034): tính ra chỗ đứng an toàn khi chạm vào
│   │   │   │                      #   một khu phố. Khoá KHOẢNG CÁCH THẬT (7,5) để mức thu phóng tự
│   │   │   │                      #   khác nhau theo kỷ; canh CẢ ĐƯỜNG BAY chứ không chỉ điểm đến.
│   │   │   │                      #   ⚠️ KHÔNG phải hệ camera thứ hai — vẫn trả tham số cho `orbit.js`
│   │   │   ├── palette3d.js       # Token màu CSS → số cho WebGL, + vai màu cho ngôn ngữ hình khối
│   │   │   │                      #   ⚠️ NGOẠI LỆ DUY NHẤT của luật "cấm hex, chỉ CSS var":
│   │   │   │                      #   WebGL không đọc được biến CSS (xem ARCHITECTURE.md)
│   │   │   ├── parts.js           # TỪ VỰNG hình khối: prism (đa giác + thóp) và gable. CHỈ 2 hình
│   │   │   │                      #   nguyên thuỷ — hộp/chóp/trụ/nón/vòm đều là prism đổi tham số
│   │   │   ├── materials.js       # BỀ MẶT: bảng 15 HỌ vật liệu (nhám/kim loại) + tra vai→họ +
│   │   │   │                      #   đường cong bóng tiếp xúc. ⚠️ `MATERIAL_ORDER` là HỢP ĐỒNG
│   │   │   │                      #   giữa `geometryFactory` (đánh số nhóm) và `sceneGraph` (dựng
│   │   │   │                      #   mảng vật liệu) — hai bên tự sắp riêng thì mái mang độ bóng
│   │   │   │                      #   của mặt nước, mắt thấy ngay mà đọc code thì không
│   │   │   ├── eraStyle.js        # NGỮ PHÁP theo 15 kỷ: vật liệu, kiểu mái, cửa sổ, mô-típ
│   │   │   │                      #   ⚠️ `wallMaterial`/`roofMaterial` là BỀ MẶT (nhám/bóng), tách
│   │   │   │                      #   hẳn khỏi `wallColor`/`roofColor` (sắc). Cùng bài học "một
│   │   │   │                      #   trường gánh hai việc" của `storyHeight` ở Phase 5B
│   │   │   │                      #   ⚠️ KHÔNG chứa bảng tầng trệt nữa (dọn sang `groundFloorStyle
│   │   │   │                      #   .js` ngày 2026-08-18, ADR-029) — quy ước "bảng ↔ hình" áp cho
│   │   │   │                      #   MỌI bảng 15 kỷ, kể cả bảng ra đời sau
│   │   │   │                      #   ⚠️ `normalizeEraKey` XUẤT RA để mọi bảng 15 kỷ tra kỷ bằng
│   │   │   │                      #   CÙNG một phép chuẩn hoá — chép lại `Math.round` + mặc định là
│   │   │   │                      #   "một luật hai công thức", và hai công thức tương đương trên
│   │   │   │                      #   giấy gần như luôn lệch nhau ở BIÊN (Phase 3Y)
│   │   │   ├── groundFloorStyle.js # BẢNG TẦNG TRỆT 15 KỶ (ADR-026/027, dọn ra riêng ADR-029): cửa
│   │   │   │                      #   ra vào (kiểu · bề rộng · chiều cao · khuôn · độ hõm · bậc) +
│   │   │   │                      #   MỘT đặc trưng mặt phố, tách riêng cho kỳ quan và nhà dân.
│   │   │   │                      #   Mỗi dòng buộc vào `country` của eraStyle — CÓ TEST BẮT, và
│   │   │   │                      #   test ấy hỏi TỪ KHOÁ trong `note` chứ không chỉ so tên nước
│   │   │   │                      #   ⚠️ Khoá bảng này PHẢI khớp khoá `ERA_STYLES` (có test): thiếu
│   │   │   │                      #   một dòng thì kỷ ấy MẤT CỬA trong im lặng — `emitGroundFloor`
│   │   │   │                      #   trả `false` đúng luật, và không gì đỏ lên
│   │   │   │                      #   Hình dựng ở `city3d/groundFloor.js`
│   │   │   ├── roofStyle.js       # BẢNG MÁI 15 KỶ (Phase 11, ADR-030): HAI TRỤC vuông góc —
│   │   │   │                      #   `stack` (thứ NHÔ LÊN phá mặt phẳng: ống khói · bồn nước ·
│   │   │   │                      #   buồng thang · cột ăng-ten · giàn phơi · chậu cây · cửa sổ
│   │   │   │                      #   mái · cửa sập · bó cọc) và `crown` (thứ VẼ ĐƯỜNG NÉT: đầu
│   │   │   │                      #   dầm · ngói ống · thanh nóc · đầu đao · lan can) + `crownWeight`
│   │   │   │                      #   (đường nét ấy đậm tới đâu) + `stackCount` (mấy cái).
│   │   │   │                      #   TÁCH ĐÔI kỳ quan ↔ nhà dân ở 4 trường, nhưng `stackCount`
│   │   │   │                      #   CỐ Ý dùng chung — nó là sự thật văn hoá của cả thành phố,
│   │   │   │                      #   không phải một mức chi tiết (ADR-030 Quyết định 3)
│   │   │   │                      #   Mỗi dòng buộc vào `country` của eraStyle — CÓ TEST BẮT
│   │   │   │                      #   ⚠️ Hai họ ràng buộc là ĐIỀU KIỆN CẤU TRÚC, không phải trí nhớ:
│   │   │   │                      #   `CROWN_NEEDS_ROOF`/`STACK_NEEDS_ROOF` hỏi thẳng `style.roof`
│   │   │   │                      #   (bồn nước cần mặt bằng, ngói ống cần mái dốc), `EARLIEST_ERA`
│   │   │   │                      #   là mốc lịch sử kiểm CẢ HAI CHIỀU
│   │   │   │                      #   ⚠️ `crownWeight` là trục MỎNG: chỉ tách 6/105 cặp, và với
│   │   │   │                      #   `barrel` thì bước lượng hoá còn rộng hơn cả dải hợp lệ ⇒ hai
│   │   │   │                      #   kỷ cùng ngói ống KHÔNG BAO GIỜ tách được bằng trọng số
│   │   │   │                      #   Hình dựng ở `city3d/rooftop.js`
│   │   │   ├── rooftop.js         # HÌNH của bảng mái: 5 kiểu đường nét + 10 kiểu nhô lên.
│   │   │   │                      #   ⚠️ TUYỆT ĐỐI không tự tính lại hình mái — nhận `RoofAnchors`
│   │   │   │                      #   do `emitRoof` TRẢ VỀ (`eaveY`/`apexY`/`deck`/`ridges`). Tự
│   │   │   │                      #   tính lại là "một luật hai công thức", đúng thứ đã làm
│   │   │   │                      #   `sweep-score.mjs` bịa ra một bộ số hoàn chỉnh ở Phase 4G
│   │   │   │                      #   ⚠️ `parts.js` CHỈ có `ry` (không `rx`/`rz`) ⇒ ngói ống dựng
│   │   │   │                      #   bằng ĐẦU NGÓI ở diềm + CUỘN NÓC, không xấp xỉ cuộn nằm nghiêng
│   │   │   │                      #   ⚠️ BA NÚT BỊT ĐỐI XỨNG đặt Ở `emitRooftop`, không đặt trong
│   │   │   │                      #   từng hàm dựng: `at(k, off)` (hạt giống theo |vị trí|) ·
│   │   │   │                      #   `lateral()` (lệch ngang = 0) · `spin()` (góc xoay = 0). Nhét
│   │   │   │                      #   `off` vào CHUỖI KHOÁ là vô hiệu hoá nút bịt — đã cắn một lần
│   │   │   │                      #   ở `emitPlanter`, xem chú thích tại chỗ
│   │   │   ├── dwellings.js       # NHÀ DÂN (ADR-015): 30 ô đất trống chia 3 khu theo khoảng cách
│   │   │   │                      #   tới tâm (ngoại vi/dân cư/trung tâm); mỗi 2 phiên mọc thêm 1
│   │   │   │                      #   căn, mọc từ trong ra. Nhà dân đi qua ĐÚNG buildingSpec.js —
│   │   │   │                      #   không có bộ sinh riêng — nên tự thừa hưởng mái/vật liệu kỷ.
│   │   │   ├── horizon.js         # CHÂN TRỜI 15 KỶ (Phase 9A, ADR-022): vùng đất NGOÀI thành phố
│   │   │   │                      #   — núi/đồi/thảo nguyên/đụn cát. Bảng 5 trường mỗi kỷ:
│   │   │   │                      #   `rise` (đỉnh cao nhất) · `grain` (cỡ khối núi) · `rough`
│   │   │   │                      #   (độ gồ ghề bề mặt) · `ridged` (sống núi sắc hay đồi tròn) ·
│   │   │   │                      #   `near` (núi áp sát hay lùi xa) + `note` bắt buộc nhắc tên
│   │   │   │                      #   nước mà `eraStyle.js` khai (CÓ TEST BẮT — chống trôi hai bảng)
│   │   │   │                      #   ⚠️ ĐỘC LẬP với `relief` của `terrain.js`: đất thành phố và núi
│   │   │   │                      #   VÂY QUANH là hai đại lượng khác nhau (Kyoto phẳng ↔ núi cao;
│   │   │   │                      #   Manhattan phẳng ↔ không núi) — xem ADR-022
│   │   │   │                      #   ⚠️ fBm NHIỀU TẦNG, không phải một tầng nhiễu: một tầng chỉ có
│   │   │   │                      #   một cỡ hình ⇒ ra "bong bóng tròn xoe", không ra dãy núi.
│   │   │   │                      #   Số tầng thật đọc ở `buildHorizon(...).octaves` (3–4), bị SÀN
│   │   │   │                      #   Nyquist cắt chứ không phải `MAX_OCTAVES` cắt
│   │   │   │                      #   ⚠️ Cùng bất biến "không phụ thuộc tiến độ" như `terrain.js`
│   │   │   ├── terrain.js         # ĐỊA HÌNH: 15 kỷ = 15 trường cao độ THỀM BẬC (ADR-014)
│   │   │   │                      #   ⚠️ Cao độ là hàm của DUY NHẤT (era, gridSize) — cố tình KHÔNG
│   │   │   │                      #   nhận danh sách công trình, nếu không thì mỗi lần Đàm xây xong
│   │   │   │                      #   một căn nhà cả quả đồi sẽ nhích và nhà cũ lún mà không có gì
│   │   │   │                      #   báo (cùng bất biến "không xê dịch" với ADR-007)
│   │   │   │                      #   ⚠️ NGOẠI LỆ DUY NHẤT (2026-08-18, ADR-032): nó ĐỌC thêm
│   │   │   │                      #   `roadCellCandidates()` của cityLayout.js — danh sách ỨNG VIÊN
│   │   │   │                      #   (80 ô, hằng số suy từ CITY_GRID_SIZE), KHÔNG phải mạng đường
│   │   │   │                      #   ĐANG HIỆN (cái đó CÓ đổi theo kỷ + số phiên). Ứng viên là tập
│   │   │   │                      #   CHA của mọi mạng đã hiện ⇒ lời hứa CHẶT HƠN ADR-007, không
│   │   │   │                      #   lỏng hơn. 64 ô ĐẤT giữ nguyên bậc thềm; 80 ô ĐƯỜNG được san
│   │   │   │                      #   thành dốc thoải (trần 34,8% = Baldwin Street) nên KHÔNG còn
│   │   │   │                      #   là bội số của bậc thềm — đây là chỗ duy nhất phá tính lượng
│   │   │   │                      #   tử hoá, và phá có chủ đích
│   │   │   │                      #   ⚠️ THỀM chứ không phải DỐC: nền là 144 ô HỘP và công trình là
│   │   │   │                      #   khối ĐÁY PHẲNG — dốc liên tục sẽ hở khe / cắm chìm góc
│   │   │   │                      #   ⚠️ Mỗi kỷ phải có `note` giải thích bằng một nơi CÓ THẬT, y
│   │   │   │                      #   như `country`/`landmark`: số không có lời giải thích là số
│   │   │   │                      #   tuỳ hứng — thứ đã sinh ra "15 kỷ cao bằng nhau" ở Phase 5B
│   │   │   ├── archetypes.js      # Bóng dáng theo 4 LOẠI (hạ tầng/kinh tế/phòng thủ/kỳ quan)
│   │   │   │                      #   + quy mô theo 3 ĐỘ HIẾM
│   │   │   ├── signature.js       # CHỮ KÝ KIẾN TRÚC: mỗi kỷ MỘT bộ phận lấy từ công trình CÓ THẬT
│   │   │   │                      #   của nước biểu tượng (cột chữ T Göbekli Tepe · cầu thang
│   │   │   │                      #   ziggurat · đấu củng · đầu đao đình Việt · tháp chuông Giotto
│   │   │   │                      #   · bồn nước mái NY · viên nang Nakagin · vòng xuyến Dubai…)
│   │   │   │                      #   ⚠️ TRỤC DUY NHẤT có đủ 15 giá trị cho 15 kỷ: `roof` chỉ có 9
│   │   │   │                      #   và `windows` có 7 nên hai trục ấy BUỘC phải dùng lại
│   │   │   │                      #   ⚠️ Dựng ở MỌI hạng kể cả `common` — khác `motifs` (chỉ
│   │   │   │                      #   rare/epic, tức 30/75 căn trước đây là hộp trơn)
│   │   │   ├── groundFloor.js     # BẢNG TẦNG TRỆT 15 KỶ (Phase 10, ADR-026): cửa ra vào · bậc
│   │   │   │                      #   thềm · MỘT đặc trưng tầng trệt theo kỷ (hiên cột · ô văng ·
│   │   │   │                      #   ban công · cửa chớp · biển hiệu · hàng vòm). Nguồn DUY NHẤT trả lời
│   │   │   │                      #   "đứng trước cửa một công trình ở kỷ này thì thấy gì".
│   │   │   │                      #   BẢNG nằm ở `eraStyle.js` (trường `groundFloor`), HÌNH nằm ở
│   │   │   │                      #   đây, `buildingSpec.js` chỉ ĐỌC — giống hệt streetStyle/flora
│   │   │   │                      #   ⚠️ KỲ QUAN ≠ NHÀ DÂN: `feature` cho công trình biểu tượng,
│   │   │   │                      #   `vernacularFeature` cho nhà dân — cùng bài học Phase 7C
│   │   │   │                      #   (25 nhà nhỏ đội mái vòm Duomo). Nhà dân còn bị LOD cắn:
│   │   │   │                      #   `VERNACULAR_DOOR_SHRINK` + tối đa 1 bậc + không hõm sâu
│   │   │   │                      #   ⚠️ MỌI kích thước là TỈ LỆ bề ngang khối, có TRẦN kẹp
│   │   │   │                      #   (`DOOR_MAX_WIDTH_RATIO`) — số tuyệt đối áp lên khối chênh
│   │   │   │                      #   nhau vài lần thì sớm muộn cũng sai (bài học `eaves` Phase 7C)
│   │   │   │                      #   ⚠️ Bước 2 (ADR-027) ĐÃ XOÁ `door: 'legacy'`: cả 15 kỷ khai
│   │   │   │                      #   đủ số đo, `isValidGroundFloor` TỪ CHỐI THẲNG dòng thiếu.
│   │   │   │                      #   5 kiểu cửa (`flap` tấm mềm · `panel` · `double` · `sliding`
│   │   │   │                      #   · `glazed` mặt kính) — thêm kiểu thứ 6 phải trả lời được
│   │   │   │                      #   "phục vụ ≥2 kỷ, và diễn đạt hình học mà 5 kiểu kia không có"
│   │   │   │                      #   ⚠️ BẢN SẮC ĐO BẰNG 8 TRỤC CẤU TRÚC (`groundFloor.test.js`,
│   │   │   │                      #   cùng khuôn streetStyle): 105/105 cặp ≥3/8 · trung vị 6/8 ·
│   │   │   │                      #   mọi trục còn sống. Kỷ nào trông giống kỷ khác thì sửa BẢNG,
│   │   │   │                      #   KHÔNG hạ sàn — kỷ 4 đã phải lùi cửa sâu hơn vì lý do đó
│   │   │   │                      #   ⚠️ LỊCH SỬ LÀ MỘT RÀNG BUỘC CÓ TEST: kỷ cổ không được có
│   │   │   │                      #   ban công/biển hiệu/hàng vòm, kỷ hiện đại không được giữ tấm
│   │   │   │                      #   da thời đồ đá — khoá CẢ HAI CHIỀU
│   │   │   ├── buildingSpec.js    # NƠI 3 TRỤC GẶP NHAU: (kỷ × loại × độ hiếm) → mô tả hình học
│   │   │   ├── cityParts.js       # DANH SÁCH MỌI KHỐI CỦA MỘT THÀNH PHỐ (2026-08-18), thuần:
│   │   │   │                      #   layout → [{kind, source, spec}] cho công trình · giàn giáo ·
│   │   │   │                      #   nhà dân · cảnh vật. Nguồn DUY NHẤT trả lời "thành phố kỷ N
│   │   │   │                      #   gồm những khối nào" — `sceneGraph.js` gọi để DỰNG, bài test
│   │   │   │                      #   gọi để ĐO, nên hai bên không thể trôi khỏi nhau
│   │   │   │                      #   ⚠️ RA ĐỜI VÌ CÂU HỎI ẤY TỪNG NẰM GIỮA THÂN `sceneGraph.js`:
│   │   │   │                      #   mọi thứ muốn hỏi đều phải CHÉP LẠI vòng lặp, và một bài test
│   │   │   │                      #   đã chép rồi chép sai (21 công trình giả định thay vì 5 bản vẽ
│   │   │   │                      #   + 6–30 nhà dân). Đàm: "hãy làm cho chỉ còn một bản"
│   │   │   │                      #   ⚠️ THỨ TỰ TRẢ VỀ LÀ HỢP ĐỒNG (công trình → giàn giáo → nhà dân
│   │   │   │                      #   → cảnh vật): `addPickTarget` gắn theo CHỈ SỐ của nhóm công
│   │   │   │                      #   trình, đảo thứ tự = chạm nhà này mà app kể tên nhà kia
│   │   │   │                      #   ⚠️ KHÔNG trả lời "khối ấy đứng ở đâu / cao độ bao nhiêu" —
│   │   │   │                      #   phần ấy cần `terrain` nên thuộc tầng dựng cảnh
│   │   │   ├── drawCallBudget.test.js  # ⚠️ NGOẠI LỆ CÓ CHỦ ĐÍCH của luật "test cùng tên file
│   │   │   │                      #   nguồn": đây là một CỔNG cắt ngang, không canh một file nào
│   │   │   │                      #   cả. Bảng 15 MỐC LỆNH VẼ riêng từng kỷ (ADR-028) + đối chứng.
│   │   │   │                      #   Chạy được trong `npm test` nhờ quan hệ ĐO ĐƯỢC
│   │   │   │                      #   `lệnh vẽ thành phố = (số họ vật liệu) + 4`, đúng 15/15 kỷ
│   │   │   ├── streetStyle.js     # BẢNG ĐƯỜNG PHỐ 15 KỶ (Phase 9D, ADR-025): bề rộng đại lộ · bề
│   │   │   │                      #   rộng ngõ · vật liệu lát · cỡ viên · độ mòn · bó vỉa · vỉa hè
│   │   │   │                      #   · vạch kẻ · kiểu mép. Nguồn DUY NHẤT trả lời "ở kỷ này con
│   │   │   │                      #   đường trông như thế nào". Mỗi dòng buộc vào `country` của
│   │   │   │                      #   eraStyle — CÓ TEST BẮT, chống trôi hai bảng
│   │   │   │                      #   ⚠️ RA ĐỜI VÌ BẢN SẮC ĐƯỜNG TỪNG NẰM GỌN TRONG MỘT MÃ MÀU: một
│   │   │   │                      #   trục thì không đủ chỗ cho 15 giá trị vừa cách nhau vừa nằm
│   │   │   │                      #   trong vùng mắt đọc được (TECH_DEBT #30 + #27)
│   │   │   │                      #   ⚠️ `carriagewayShape` — một ô đường là MỘT LÕI + tối đa BỐN
│   │   │   │                      #   CÁNH TAY loe, KHÔNG phải một hình chữ nhật (ADR-031). Bề rộng
│   │   │   │                      #   là đại lượng của MẶT CẮT NGANG; áp lên chiều DỌC thì đường vỡ
│   │   │   │                      #   thành mảng rời rạc, còn ép về chữ nhật thì ngã ba phình trọn
│   │   │   │                      #   ô ⇒ 45% số mép có bậc. Chỗ nối = min(nửa tôi, nửa hàng xóm)
│   │   │   │                      #   ⚠️ `avenue`/`lane` ≤ `MAX_AVENUE = 0,96` — rộng trọn ô thì cánh
│   │   │   │                      #   tay dài bằng 0 VÀ vỉa hè bị nuốt sạch. `isValidStreetStyle`
│   │   │   │                      #   TỪ CHỐI THẲNG, không tự kẹp (bẫy `MIN_STONE`)
│   │   │   │                      #   ⚠️ `stone` không được nhỏ hơn `MIN_STONE = 1/7` (viên 8 điểm
│   │   │   │                      #   ảnh, ĐO ĐƯỢC) — nhỏ hơn thì cái kẹp nuốt mất phần chênh trong
│   │   │   │                      #   im lặng, đúng bẫy Phase 7B. `isValidStreetStyle` chặn thẳng
│   │   │   │                      #   ⚠️ Bó vỉa = La Mã (kỷ 1–6 không có) · vạch kẻ = thế kỷ 20 (kỷ
│   │   │   │                      #   1–10 không có). Test khoá CẢ HAI CHIỀU — không có nó thì cách
│   │   │   │                      #   dễ nhất để "15 kỷ khác nhau" là nói dối lịch sử
│   │   │   ├── floraStyle.js      # BẢNG THẢM THỰC VẬT 15 KỶ (Phase 8D): loài + trọng số · cỡ ·
│   │   │   │                      #   mật độ · tầng cây bụi · màu lá. Nguồn DUY NHẤT trả lời "kỷ
│   │   │   │                      #   này mọc cây gì". Mỗi dòng buộc vào `country` của eraStyle —
│   │   │   │                      #   có test bắt, để hai bảng không trôi khỏi nhau
│   │   │   │                      #   ⚠️ `bush` KHÔNG BAO GIỜ nằm trong bảng loài: nó là TẦNG CÂY
│   │   │   │                      #   BỤI (trường `undergrowth` riêng), không phải một loài để bốc
│   │   │   ├── flora.js           # 7 LOÀI CÂY (Phase 8D): tán rộng · thông · cọ · trắc bách diệp
│   │   │   │                      #   · đa · cây phố · bụi. Luật chống-primitive: tán là NHIỀU
│   │   │   │                      #   THUỲ chồng lấn lệch tâm, KHÔNG phải một khối lồi (xem ADR-020)
│   │   │   │                      #   ⚠️ `sides`/`taper` phải theo HẠT, không viết cứng — lỗi này
│   │   │   │                      #   đã cắn 4 lần trong chính file này (cypress/streetTree/banyan/
│   │   │   │                      #   bush), mỗi lần đều ra "40 hạt chỉ 2–4 dáng"
│   │   │   ├── outskirts.js       # VÙNG QUÊ NGOÀI LƯỚI (ADR-038): cây/bụi/đá rải RA NGOÀI lưới
│   │   │   │                      #   12×12, mật độ tắt dần ra xa + trường nhiễu tạo lùm. Đây là
│   │   │   │                      #   thứ xoá "cái khay" — cái khay chưa bao giờ là một cái MÉP,
│   │   │   │                      #   nó là hình chữ nhật phố dừng đột ngột giữa mặt phẳng trống
│   │   │   │                      #   ⚠️ TẦNG ĐỊA LÝ, KHÔNG PHẢI TẦNG TIẾN ĐỘ: không nhận `built`/
│   │   │   │                      #   `levels`/`sessionCount`. Cây ngoại ô KHÔNG mọc thêm khi Đàm
│   │   │   │                      #   xây nhà — có test gọi kèm DỮ LIỆU RÁC khoá điều đó
│   │   │   │                      #   ⚠️ KHÔNG có bảng 15 kỷ riêng — ĐỌC `floraStyle.js`, có test
│   │   │   │                      #   khoá tương quan hạng. Bảng 15 kỷ thuộc về `settingStyle.js`
│   │   │   │                      #   (VIỆC 2: biển/sông/không nước), là câu hỏi KHÁC
│   │   │   ├── settingStyle.js    # BẢNG ĐỊA THẾ 15 KỶ (VIỆC 2 Bước A, ADR-039): thành phố NẰM Ở
│   │   │   │                      #   ĐÂU và VÌ SAO. `water` (none/river/canal/estuary/sea) ·
│   │   │   │                      #   `side` (hướng mặt nước) · `ground` (ngồi thế nào so với
│   │   │   │                      #   nước: ridge/flat/bank/bluff/reclaimed) · `reach` · `width`.
│   │   │   │                      #   Buộc vào `country` của eraStyle — có test hỏi TỪ KHOÁ trong
│   │   │   │                      #   `note`, khuôn thứ BẢY sau streetStyle/flora/groundFloor/
│   │   │   │                      #   roof/groundCover
│   │   │   │                      #   ⚠️ QUAN HỆ MỘT CHIỀU `settingStyle` → `outskirts`: vùng quê
│   │   │   │                      #   ĐỌC `hasWater(era)` để không trồng cây dưới nước; TUYỆT ĐỐI
│   │   │   │                      #   không để outskirts khai hướng rồi bảng này đọc ngược lại
│   │   │   │                      #   ⚠️ `water: 'none'` là câu trả lời ĐÚNG (kỷ 1, 5), khai tường
│   │   │   │                      #   minh + có test ĐẾM. `MAX_SEA_ERAS`/`MAX_ERAS_PER_SIDE` là
│   │   │   │                      #   hai trần "dưới một nửa", mỗi trần có ĐỐI CHỨNG bơm bảng hỏng
│   │   │   │                      #   Hình sẽ dựng ở `city3d/setting.js` (Bước B) — CHƯA CÓ
│   │   │   ├── groundCoverStyle.js# BẢNG DÙNG ĐẤT 15 KỶ (§2-C, ADR-037): bộ kiểu + trọng số ·
│   │   │   │                      #   `share` (phần đất trống được dùng) · `scale` · `enclose`.
│   │   │   │                      #   Trả lời "ở nước ấy mảnh đất cạnh nhà dùng làm gì" — buộc vào
│   │   │   │                      #   `country` của eraStyle, có test bắt (khuôn thứ SÁU sau
│   │   │   │                      #   streetStyle/flora/groundFloor/roof)
│   │   │   │                      #   ⚠️ CẤM vai `water`: chỉ 7/15 kỷ có họ ấy ⇒ dùng là đẻ lệnh vẽ
│   │   │   │                      #   ⚠️ `share` là một PHẦN, không phải một LƯỢNG (bài học Phase 8D)
│   │   │   ├── groundCover.js     # 7 KIỂU MẢNG PHỦ (§2-C): sân · vườn rào · sân phơi · bãi quây ·
│   │   │   │                      #   đống rơm · giếng · quảng trường. RỘNG và THẤP — ngược hẳn cây
│   │   │   │                      #   ⚠️ `canhVien` thụt vào `w/2 − dày/2`: mép NGOÀI hàng rào mới
│   │   │   │                      #   là thứ phải trùng mép mảng. Đặt tâm ở ±w/2 thì rào cưỡi lên
│   │   │   │                      #   ranh giới ô — đã đo 0,506 và test bắt
│   │   │   ├── propSpec.js        # BỘ GHÉP cảnh vật: cây · bụi · đá · đèn · mặt nước · ruộng
│   │   │   │                      #   Từ Phase 8D chỉ còn GHÉP — hình cây nằm ở `flora.js`
│   │   │   │                      #   ⚠️ Mặt nước dùng vai màu RIÊNG (`water`), KHÔNG dùng chung
│   │   │   │                      #   `glass` với cửa sổ — vai `glass` ban đêm TỰ PHÁT SÁNG, ao
│   │   │   │                      #   mà mượn vai đó sẽ thành hộp đèn (xem parts.js)
│   │   │   │                      #   ⚠️ Thêm loại cảnh vật mới thì PHẢI thêm hình cho nó ở
│   │   │   │                      #   `render2d/CityTile.jsx` — chỗ đó trả `null` trong im lặng
│   │   │   │                      #   cho loại lạ, nên bản 2D sẽ lặng lẽ thưa đi
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
│   │   ├── useCityMoment.js   # Cầu nối store → engine/cityMoment.js, CẢ HAI đầu của một phiên:
│   │   │                     #   useCityFocusTease (trước) + useCityGrowthMoment (sau). Dùng chung
│   │   │                     #   một snapshot memo theo NỘI DUNG
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
│   └── shot.mjs                #   CHỤP MÀN HÌNH ĐÁNG TIN (qua CDP). ⚠️ DÙNG CÁI NÀY, đừng tự dựng
│                               #   lệnh Chromium mới: `--virtual-time-budget` đóng băng hoạt hoạ rAF
│                               #   (khối framer-motion biến mất im lặng) và `--window-size` không
│                               #   cho ra khung điện thoại thật (sàn 500px). Xem CLAUDE.md.
│   ├── city-preview.mjs        #   Dựng cảnh 3D thật rồi chụp/đo. `--bench N` là bộ đo hiệu năng
│   │                           #   DUY NHẤT — đừng viết bộ thứ hai, hai phép đo song song sớm muộn
│   │                           #   sẽ lệch nhau (bài học sweep-score, Phase 4G).
│   ├── cityPreviewSource.test.js # Khoá BA nhóm bẫy của file trên mà không gì khác bắt được: dấu
│   │                           #   huyền (`) trong chú thích làm chết cả template >300 dòng; nháy
│   │                           #   kép ASCII trong dòng in ra bị bench-macbook.sh cắt cụt; và
│   │                           #   `kiemKhungNhin` + `chiaBang` (cổng chống xén ảnh · chia dải
│   │                           #   chụp cho lọt trần 4 MiB của ổ cắm CDP — ADR-036); và `soiVetRach`
│   │                           #   + `hangCauTrucBangQuet` (ảnh RÁCH NGANG — `TECH_DEBT #52`).
│   │                           #   ⚠️ `soiVetRach` quét MỌI mép hàng, CỐ Ý không dựa vào mốc chia
│   │                           #   dải: ảnh hỏng thật rách ở hàng 441 còn mốc dải là 476, tức lời
│   │                           #   giải thích "một dải đến từ khung hình cũ" đã bị số đo bác bỏ.
│   │                           #   Bảng quét có mép sắc lẹm ĐÚNG THIẾT KẾ ở mọi dải nhãn ⇒ phải
│   │                           #   truyền `hangCauTruc`, và test đòi danh sách ấy BẰNG đúng 30 hàng.
│   ├── png-probe.mjs           #   ĐỌC **VÀ GHI** PNG — cả dự án chỉ một chỗ biết định dạng này.
│   │                           #   `decodePng` để đo màu thật trên màn hình; `encodePng`+`ghepDoc`
│   │                           #   để ghép các dải chụp lại thành một ảnh. Đừng dựng chunk IHDR ở
│   │                           #   chỗ khác — hai bên sẽ lệch nhau ở biên mà không gì đỏ lên.
│   ├── pngProbe.test.js        #   Khoá phép ghi/ghép. Bài có răng nhất: ghép BA DẢI phải ra byte
│   │                           #   GIỐNG HỆT ghi MỘT LẦN (chạy cả hai bên rồi so với nhau).
│   ├── bench-macbook.sh        #   Một lệnh duy nhất cho Đàm: ma trận 24 cảnh (1100×700) + 1 cảnh
│   │                           #   1600×1000, trên GPU thật. `--thu` = PREFLIGHT 8 mục (kiểm rẻ
│   │                           #   trước, đắt sau) rồi thử 1 cảnh ~20s. Mỗi ❌ in ĐÚNG MỘT lệnh
│   │                           #   cần gõ — nguyên tắc gốc: người nhận phải biết làm gì tiếp.
│   └── benchMacbookSource.test.js # Khoá hai lời hứa của file trên: (a) preflight chạy được ở
│                               #   đường dẫn có DẤU TIẾNG VIỆT + DẤU CÁCH (cả NFC lẫn NFD) như
│                               #   thư mục thật của Đàm; (b) mọi biến đường dẫn đều bọc nháy kép
│                               #   (đi từng ký tự, vì `"$(… $x)"` trông như đã bọc mà thật ra
│                               #   không). ⚠️ Linux không chuẩn hoá tên file như macOS ⇒ KHÔNG
│                               #   bảo chứng được vế NFD thật — xem TECH_DEBT #35.
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
├── PERFORMANCE.md               # ⚠️ NGÂN SÁCH HIỆU NĂNG Thành Phố 3D, đo trên MacBook M3 thật
│                                #   (2026-08-17). ĐỌC TRƯỚC khi thêm bất cứ gì vào cảnh 3D: hình
│                                #   học gần như miễn phí, điểm ảnh + ánh sáng mới là trục đắt.
│                                #   Là bản ghi CHÍNH THỨC — file kết quả gốc nằm trong
│                                #   `.city-preview/` (bị gitignore), không có trong repo.
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
  **bất kỳ độ sâu nào** — glob trong `package.json` quét đệ quy nên thêm thư mục con mới KHÔNG cần
  sửa `package.json`. (Trước 2026-08-12 glob chỉ quét một cấp và test trong thư mục con sẽ im lặng
  không bao giờ chạy — xem `TECH_DEBT.md` #10.)
  ⚠️ **Nhưng thêm một thư mục GỐC mới thì PHẢI thêm một mục vào glob** — nó liệt kê từng gốc một
  (`electron/` · `src/` · `api/` · `scripts/`), và một gốc thiếu ở đó thì test trong đó im lặng
  không chạy, đúng hình dạng sai của #10. `scripts/` được thêm vào 2026-08-16 khi công cụ đo có bài
  test đầu tiên (`sweepMetric.test.js`).
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

## Bộ công cụ soi bằng MẮT và chấm bằng SỐ (đủ bộ, dùng cùng nhau)

| Lệnh | Trả lời câu hỏi gì |
|---|---|
| `node scripts/shot.mjs --phone --out a.png` | app trông thế nào ở bề ngang THẬT (kèm `--tab`, `--full`, `--crop`, `--dark`, `--hour`) |
| `node scripts/shot.mjs --phone --fit` | có nút nào chữ tràn / bị xén / bị dấu "…" cắt không |
| `node scripts/shot.mjs --phone --fit --el "<chữ>"` | font-size/padding/overflow THẬT của một phần tử (dùng khi `--fit` và mắt bất đồng) |
| `node scripts/city-preview.mjs --sweep --all` | dựng bảng 15 kỷ × 6 chặng ngày thành MỘT tấm ảnh |
| `node scripts/sweep-score.mjs <ảnh quét>` | **chấm** bảng đó: 15 cặp chặng + 105 cặp kỷ, cặp nào dưới ngưỡng mắt. Ruột phép đo nằm ở `scripts/sweepMetric.mjs` (thuần, có `sweepMetric.test.js` canh) — file `sweep-score.mjs` chỉ là lớp vỏ đọc `process.argv` + in bảng, nên **đừng chép công thức sang chỗ khác, hãy `import` từ `sweepMetric.mjs`** |
| `node scripts/shadow-score.mjs <ảnh>` | **chấm bóng đổ**: sàn độ sáng · % khung hình bị nghiền · khoảng cách sáng-tối · độ tươi · chênh sắc nóng-lạnh. Đo PHÂN BỐ chứ không chấm vài điểm — chấm tay rất dễ trúng mặt đường (vật liệu đen sẵn) rồi ghi công cho bóng đổ. `--selftest` có 5 ca, trong đó một ca tách riêng "chữa đúng" khỏi "chữa ngây thơ làm nhạt ảnh" |
| `node scripts/png-probe.mjs <ảnh> --top 10` | màu THẬT trên màn hình tại một điểm/vùng |
| `node scripts/city-preview.mjs --era 7 --mask buildings,ground,road` | **hỏi thẳng bên dựng điểm ảnh nào là cái gì** — tô mỗi lớp một kênh màu thuần (đỏ/lục/lam), phần còn lại đen. Tên lớp là `mesh.name` do `sceneGraph.js` đặt, KHÔNG dò bằng màu (`TECH_DEBT #22`). In kèm dòng "tô đen" kể tên mọi khối rơi vào sọt đen, để phần nền không bao giờ là một cái sọt vô danh |
| `node scripts/mask-count.mjs <ảnh mặt nạ> nhà đất đường` | đếm mỗi lớp chiếm bao nhiêu **phần khung hình**. ⚠️ Nền trang (ngoài canvas) được bên dựng tô màu mốc `rgb(1,2,3)` và bị loại khỏi MẪU SỐ — không có nó thì mọi tỉ lệ thấp hơn sự thật ~13% mà chẳng có gì kêu (xem `TECH_DEBT #49`). `--selftest` có 4 đối chứng |
| `node --import ./scripts/register-esm-loader.mjs scripts/plan-coverage.mjs` | **độ phủ xây dựng nhìn từ trên xuống** (khác hẳn "phần khung hình" ở trên — đây là tỉ lệ ĐẤT bị nhà chiếm, so được với hệ số 建蔽率 của Nhật). Rasterise HỢP của các hộp bao, KHÔNG cộng diện tích từng nhà: nhà rộng hơn ô của nó (`TECH_DEBT #21`) nên phép cộng đếm hai lần và từng cho ra 109,9% — `--selftest` giữ đúng đối chứng "không kỷ nào được vượt 100%" |
| `node --import ./scripts/register-esm-loader.mjs scripts/frame-fit.mjs 1.3` | công trình nào đang bị **mép khung hình cắt**, và phải lùi camera bao nhiêu thì hết (`--flat` = đối chứng địa hình phẳng · `--selftest`) |
| `node --import ./scripts/register-esm-loader.mjs scripts/road-fit.mjs` | **đường sá có lởm chởm không, và lởm chởm cỡ nào** — đo HAI khuyết tật độc lập: (1) *bậc ở mép đường* = hai ô kề nhau trình ra hai bề rộng khác nhau tại chỗ giáp; (2) *mặt cắt dọc* = chênh cao độ hai ô đường kề nhau, quy về **phần của một căn nhà** (số tuyệt đối không nói lên gì — bài học Phase 7D). Hỏi thẳng `carriagewayShape`, không diễn đạt lại luật. ⚠️ Từ ADR-031, ĐO 1 ra 0 **theo cấu trúc** (luật `min` đối xứng), nên `--selftest` giữ một **đối chứng bơm LUẬT CŨ** vào — không còn bắt được bộ số hỏng cũ thì con số 0 kia vô nghĩa (11 ca) |
| `node scripts/city-preview.mjs --era 7 --bench 120` | **chấm hiệu năng MỘT cảnh**: frame time P50/P95 ở khung ỔN ĐỊNH và ở khung DỰNG LẠI BÓNG (hai câu hỏi khác nhau, in riêng), số tam giác + lệnh vẽ đọc từ `renderer.info`, DPR thật, cỡ bản đồ bóng, số shader/geometry/texture. Thêm `--gpu` để dùng card thật (bắt buộc trên máy Đàm), `--no-shadow` để tách "vật liệu tối" khỏi "chi phí bóng" |
| `bash scripts/bench-macbook.sh --thu` | **CHẠY CÁI NÀY TRƯỚC** — thử đúng 1 cảnh (~20 giây), in ĐẠT/HỎNG + tên card đồ hoạ |
| `bash scripts/bench-macbook.sh` | **ĐO TRÊN MACBOOK THẬT** — ma trận 4 kỷ × 3 giờ × 2 góc = 24 cảnh ở **1100×700** + 1 cảnh **1600×1000**, 120 khung mỗi cảnh, ghi ra `.city-preview/bench-macbook.txt`. Kiểm mã thoát từng cảnh, đếm N/24, DỪNG NGAY nếu card là SwiftShader |

⚠️ **Bảng `[stats]` của `--bench` in ra BỐN cột, và đọc nhầm cột là ra kết luận sai.**
`trong cảnh: thành phố` · `nền (trời+núi)` · `trong cảnh: tổng` · `đã vẽ (sau khi cắt)`.
- Hỏi *"GPU vẽ bao nhiêu mỗi khung"* → đọc **tổng**. Hỏi *"kỷ nào nặng / xây thêm nhà có nặng
  không"* → đọc **thành phố**. Phần nền là một **HẰNG SỐ 44.126 tam giác ở cả 15 kỷ**, đọc số tổng
  để so kỷ thì nó pha loãng chênh lệch thật **1,43 lần** xuống còn **1,16 lần** (vòng 2 Performance
  Gate, đúng hình dạng `TECH_DEBT #22`). Tách theo **nhãn gắn lúc tạo khối**, không đoán bằng màu.
- ⚠️ Hai cột cuối **KHÔNG buộc bằng nhau**, và lệch nhau là ĐÚNG: `renderer.info` đếm SAU khi three
  cắt bỏ khối ngoài khung hình. Hôm nay chúng luôn bằng nhau vì cả cảnh chỉ có 7 khối lớn nằm ôm
  lấy camera hoặc ở gốc toạ độ (đã đo ở mọi mức zoom) — ngày nào tách công trình thành nhiều khối
  thì chúng lệch. `sceneStats.test.js` khoá QUAN HỆ `đã vẽ ≤ trong cảnh`, **không** khoá "bằng nhau".
- Tháng 8/2026 con số HUD từng được DỰ ĐOÁN bằng công thức riêng và lệch **56%** (báo 34.622, máy vẽ
  78.748) suốt từ Phase 9A vì chưa ai đặt nó cạnh sự thật. Nay là một phép ĐẾM trên chính cảnh.
⚠️ **Số FPS đo trong hộp cát dựng ảnh là VÔ NGHĨA**: ở đó WebGL chạy bằng SwiftShader (tô hình bằng
CPU), ~2,4 giây/khung — sai ba bậc so với GPU thật VÀ sai cả hình dạng chi phí. Dòng
`[bench] máy đồ hoạ=...` tồn tại để bảng kết quả tự khai nó được đo bằng gì; thấy chữ "SwiftShader"
hay "Software" thì vứt phần thời gian, chỉ giữ các con số **không phụ thuộc máy** (tam giác, lệnh
vẽ, shader, cỡ bản đồ bóng).

⚠️ **`--sweep` mà không `sweep-score` thì mới đi được nửa đường**: mắt chỉ so được các ô KỀ NHAU,
nên hai lỗi nặng nhất từng lọt qua đều là hai ô nằm ở HAI ĐẦU bảng (bình minh ↔ hoàng hôn ở Phase
3Y; kỷ 12 ↔ 13 ở `TECH_DEBT #18`). Máy so được cả 105 cặp.
⚠️ Bản quét đã truyền `--hours` thì **đồng hồ quyết bảng màu, `--theme` chỉ đổi khung ngoài** —
nội dung 3D của theme sáng và tối GIỐNG HỆT nhau, đừng chạy hai lần rồi đếm thành hai lượt quét.

## Quy tắc Tailwind: KHÔNG chồng lớp cùng thuộc tính lên một component có sẵn "size"

⚠️ **Bài học 2026-08-13 (Phase 4E), đã trả giá một lần và suýt trả lần hai.** Dự án KHÔNG cài
`tailwind-merge`. Khi một component đã tự khai lớp kích thước (ví dụ `ActionButton` với
`sizeMap.default = 'px-7 py-3.5 text-lg font-bold …'`) mà nơi gọi truyền thêm `px-2.5 text-[11px]`
qua `className`, thì **lớp nào thắng do THỨ TỰ TRONG BẢNG KIỂU sinh ra quyết định, không phải thứ
tự viết trong chuỗi**. Ở ca thật: lớp truyền thêm THUA, nút chạy `font-size: 18px` + `padding:
28px` trong một khung 186px ⇒ chữ bị xén — mà build xanh, lint xanh, không có gì báo động.

- ✅ **Đúng**: dùng prop `size` (thêm một mục vào `sizeMap` nếu cần) — `sizeMap[size] ?? sizeMap
  .default` chỉ phát ra MỘT bộ nên không có gì để đánh nhau.
- ✅ `className` chỉ nên chứa lớp KHÔNG đụng hàng với `sizeMap`: `min-w-0 w-full`, màu, bo góc…
- ❌ Đừng truyền `px-…`/`py-…`/`text-<cỡ>`/`font-…`/`leading-…`/`whitespace-…` qua `className`.
- Có lưới tự động: `src/components/actionButtonSizing.test.js` (đọc mã nguồn, cả 3 bài đã được
  thử-cho-đỏ). Kiểm bằng mắt/bằng số: `node scripts/shot.mjs --phone --fit` và
  `node scripts/shot.mjs --phone --fit --el "<chữ trên nút>"` (in ra font-size/padding THẬT).

## Quy tắc đặt tên

- **Component React** (`.jsx`) → PascalCase, tên file = tên component (`PomodoroEngine.jsx` export
  `PomodoroEngine`).
- **File logic thuần/hook/lib** (`.js`) → camelCase (`gameMath.js`, `useTimer.js`, `syncService.js`).
- **Test** → luôn cùng tên file nguồn + hậu tố `.test.js` (`guard.js` → `guard.test.js`), đặt CẠNH
  file nguồn (trừ `api/`, xem quy tắc test ở trên).
- **Hằng số cấp module** → SCREAMING_SNAKE_CASE (`XP_FACTOR_HARD_CAP`, `COACH_MIN_SAMPLE`).
- **Route API** → tên file = tên endpoint, camelCase hoặc kebab-case ngắn gọn khớp URL
  (`coach-digest.js` → `/api/coach-digest`).
