# START_HERE — đọc file này, và chỉ file này, khi mở một phiên mới

> **Đây là file DUY NHẤT bắt buộc đọc trước khi làm việc.** Mọi file khác là KHO TRA CỨU:
> chỉ mở khi `grep` trúng thứ đang cần. Trước đây quy tắc bắt đọc trọn `CLAUDE.md` +
> `BAN_GIAO.md` = **6.323 dòng** mỗi phiên; đó là lý do mỗi phiên chỉ còn ~20% sức để xây.
> Cách làm việc + cách ra prompt + cách báo cáo: **`PHASE_RULES.md`**.

## Dự án là gì
App Pomodoro cá nhân của Đàm (non-coder). React + Vite + PWA · Zustand + localStorage ·
Supabase sync · Vercel. Bản thật: `https://pomodoro-dc.vercel.app`.
Mặt trận đang làm: **thành phố 3D** (`src/engine/city3d/` + `src/components/city/render3d/`).

## 5 luật thật sự cắn — vi phạm là hỏng thật
1. **ADR-007 — bảo tàng bất động.** Công trình đã xây KHÔNG BAO GIỜ đổi chỗ. Địa hình
   không được phụ thuộc tiến độ chơi. Hỏng luật này = mất thành phố của Đàm.
2. **Chỉ nhánh `main` mới lên production.** Push nhánh phụ = chỉ có bản Preview.
   ⚠️ **TỰ GỘP VÀO `main` RỒI PUSH, KHÔNG HỎI** — Đàm chốt 2026-08-22: *"sau này tự deploy,
   tôi không có việc gì phải tự deploy cả"*. CHỈ dừng lại hỏi khi gỡ xung đột đòi phải vứt
   bỏ công của một phiên khác. Vẫn phải BÁO RÕ những gì NGOÀI phần việc của mình cũng vừa
   lên production. Push xong phải xác nhận Vercel hiện "Ready".
   *(Bản đầu của file này ghi ngược — "KHÔNG tự gộp, hỏi Đàm" — trong khi `CLAUDE.md` mục
   "Quy trình deploy" nói rõ điều ngược lại. `CLAUDE.md` là NGUỒN SỰ THẬT DUY NHẤT về quy
   tắc; một bản tóm tắt chép sai một luật vận hành thì tệ hơn không có bản tóm tắt.)*
3. **Không hạ DPR · không thêm nguồn sáng thứ tư.** Hai cách phá hình ảnh nhanh nhất.
4. **Không start phiên focus trên dev/localhost** — dùng chung Supabase row với bản thật.
5. **`no-use-before-define` ĐÃ BẬT** (2026-08-29) — một `const` dùng trước dòng khai báo làm cả
   app ra TRANG TRẮNG, mà lint/test/build đều không bắt (đã cắn thật). 3 chỗ hợp lệ trong
   `CityScene3D.jsx` được miễn trừ kèm lý do. Đừng tắt rule để "cho nhanh".
6. **Vercel Hobby: tối đa 12 Serverless Function.** Test của `api/` phải nằm trong
   `api/_tests/`. Hiện có 10 function thật.

## Đang ở đâu
- Nhánh production: `main`. Nó nay mang **CẢ HAI** dòng công việc, vừa được gộp 2026-08-28 theo
  lệnh trực tiếp của Đàm (*"còn 9 commit Phase 19-21 kia gộp vào main luôn"*) — chỉ thị cũ của
  Phase 21 (*"push nhánh phụ, không tự gộp `main`"*) đã bị lệnh này thay thế.
  ⚠️ **Phase 21 do đó lên production TRƯỚC khi Đàm nhìn ảnh nghiệm thu** — mục "chờ Đàm nhìn ảnh"
  ở phần dưới VẪN CÒN HIỆU LỰC, chỉ là nay nó nghiệm thu một thứ đang chạy thật.
- **Trò chơi — VÒNG 32 (2026-09-05, MỚI NHẤT): ĐÓNG #43, VÀ TÌM RA NĂM BẢN CHÉP CỦA MỘT LỖI.**
  · **#43 ĐÓNG** — `src/engine/city3d/triangleBudget.test.js`: bảng 15 mốc tam giác riêng từng kỷ,
  đúng khuôn `drawCallBudget.test.js`, chạy **dưới 1 giây**, không cần Chromium/`three`. Neo vào
  `scene-tri.mjs` ở 4 kỷ (khớp từng đơn vị). Thử ngược: sửa MỘT dòng `crown` trong `roofStyle.js`
  — đúng loại thay đổi đã sinh ra mục nợ — thì ĐỎ ngay.
  · ⚠️ Chỗ khó mục nợ nêu (mặt đất/đường/chân trời) **không phải chỗ cần giải**: thứ đã trôi là
  khối `city`, còn nền là cố định — gộp vào chỉ pha loãng tín hiệu (`#22`).
  · Kèm: chú thích "bệ kè chỉ tốn 12 tam giác" sai từ Phase 8B (thật là **28**) — nhưng **đừng đọc
  ngược thành "12 đã chết"**: đếm đủ 27 bệ thì 26 ăn 28, **đúng một ăn 12**. Luật bệ kè có BỐN bản
  chép tay, nay gom về hai hàm thuần ở `parts.js`.
  · **NĂM BẢN CHÉP CỦA MỘT LỖI** (`type === 'wonder'` bị bỏ), trong bốn file: giá RP · giá tiến hoá
  di vật · phạt huỷ phiên · trần chuỗi · thưởng nhiệm vụ. Tất cả nay đọc chung
  `engine/wonderEffects.js`, có bài canh CẤU TRÚC `grep` cả bốn file. Một lệch THẬT đã vá: màn hình
  in giá tiến hoá 0 trong khi store trừ 1.
  · Nợ: **97 mục · 37 đã đóng · 60 còn mở**. Test **1.572 bài**.

- **Trò chơi — VÒNG 31 (2026-09-02, MỚI NHẤT): BỐN MÀN NGẮN ĐI 29–39%, và cả bốn theo CÙNG MỘT
  khuôn "LƯỚI + MỘT KHUNG CHI TIẾT".** Lệnh Đàm (lần thứ ba): *"Thay đổi lớn hơn nữa… đừng có quá
  đo tiểu tiết, nên thực hiện lớn rồi sửa khi tôi muốn sửa."*
  · **Kỹ năng** 2.231 → **1.957px**: danh sách một-nhánh-một-lúc → **BẢN ĐỒ 6×6** (cột = nhánh,
  hàng = độ sâu). Trước đây phải bấm qua sáu nhánh mới nhìn hết 36 kỹ năng.
  `shared/skillMatrix.js` + `SkillMatrix.jsx`.
  · **Công trình** 4.757 → **2.894px (−39%)**: công trình đã xây thành LƯỚI ô + một khung chi tiết;
  gỡ 3/5 chip luật RP (cả ba mở đầu bằng "có thể … HOẶC …" ⇒ không loại trừ khả năng nào ⇒ không
  mang tin); thẻ bản vẽ thôi chép 4 trường mà `BlueprintDetailPanel` đã in nguyên văn.
  `shared/buildingGrid.js` + `BuildingGrid.jsx`.
  · **Huy hiệu** 4.915 → **3.973px**: gấp lại 102 dấu tiến độ = 0. `shared/badgeGroups.js`.
  · **Tập trung** 2.509 → **1.783px (−29%)**: bảng thiết lập (~1.100px, mở sẵn mọi lần) gấp lại
  sau một dòng nói đủ ("25′ · nghỉ 5′/15′ · kỷ luật"). `pomodoroSetupSummary.js`.
  · ⚠️ **LUẬT CHUNG RÚT RA — "KHÔNG GIẤU, CHỈ GẤP".** Mỗi lần gấp một khối, dòng thay nó phải nói
  ĐỦ (đủ cần gạt / đủ con số còn lại). Gấp mà dòng thay thiếu một thứ thì đó là GIẤU, và người
  dùng phải mở ra mỗi lần để kiểm — lúc ấy còn tệ hơn không gấp.
  · Kèm một LỖI THẬT: dải mở đầu Hành trang bật màu nhấn chỉ vì `spChuaTieu > 0` rồi viết *"mở
  thêm một kỹ năng ngay bên dưới"*. Đo trên ván thật: **1 SP trong tay, ô rẻ nhất giá 3 SP** ⇒ nó
  rực lên và bảo người chơi làm một việc KHÔNG làm được. Nay `gap` hỏi đúng câu bản đồ trả lời.
  · **PHẦN 2 — BA LỖI THẬT CÙNG MỘT HỌ: "CÓ" ≠ "LÀM ĐƯỢC".** (1) dải Công trình đếm bản vẽ ĐÃ MỞ
  thay vì KHỞI CÔNG ĐƯỢC; (2) cái chuông/chấm/"việc tiếp theo" so SP với giá GỐC trong khi store
  trừ giá đã giảm nhờ di vật — sai đúng ở 6 kỹ năng Tinh Hoa; (3) giá RP nghiên cứu có BA bản chép
  tay, bản tầng giao diện thiếu kiểm `type === 'wonder'`. Gốc chung: **luật sống inline trong tầng
  giao diện nên tầng khác không thấy và tự nghĩ ra điều kiện lỏng hơn.** Ba module thuần dùng
  chung: `engine/craftReadiness.js` · `engine/wonderEffects.js` · `shared/skillMatrix.js`.
  · ⚠️ Phép thử ngược soi ra một điểm mù SẴN CÓ: bỏ hẳn phép kiểm nguyên liệu trong
  `listBuildableBlueprints` mà không bài nào đỏ. *Thử ngược không chỉ chứng minh bài MỚI có răng —
  nó soi ra bài CŨ đã mất răng.*
  · Nợ: **97 mục · 36 đã đóng · 61 còn mở** (~49 thuộc Thành Phố 3D). Test **1.565 bài**.

- **Trò chơi — VÒNG 29–30 (2026-09-02, mới nhất): DỌN NỢ — 32 → 35 mục đã đóng.**
  · Đóng **#92** (mã chết tầng giao diện) · **#5** (lệch mô tả↔hành vi, nay là một CỔNG chấm 310
  thành tích) · **#13**, **#7** (đã lỗi thời, chưa ai kiểm lại) · **#91** (test khoá con số thay vì
  khoá luật) · nửa gốc **#86** (84 chỗ chốt cứng màu nhấn → token, đúng ở cả 5 skin) · **#93** đánh
  dấu lại là QUYẾT ĐỊNH chứ không phải nợ.
  · ⚠️⚠️ **BÀI HỌC ĐẮT NHẤT TỪ TRƯỚC TỚI NAY — BA CỔNG CÙNG MÙ.** Bật `no-unused-vars` cho `.jsx`
  ra 54 báo cáo; tôi tin cả 54 và đi gỡ. Kết quả: **lint sạch · build sạch · 1.524 bài test XANH ·
  và app ra thẳng "RENDER RECOVERY: motion is not defined"**. ESLint lõi KHÔNG coi `<motion.div>`
  là một lần DÙNG biến `motion` ⇒ **27/54 là báo nhầm**, nhắm đúng vào những import đang sống.
  ⇒ **XOÁ MÃ HÀNG LOẠT THÌ PHẢI CHỤP LẠI APP TRƯỚC KHI COMMIT** — lint/build/test không thay được
  một tấm ảnh. Mắt xích thiếu là `react/jsx-uses-vars` (nay đã cài); gỡ plugin thì PHẢI tắt lại luật.
  · ⚠️ **#97 — viết bản vá rồi TỰ HOÀN TÁC.** Quét cột chuyển vị báo oan ngay trên đối chứng có
  sẵn, vì ảnh thật đầy mép dọc. *Chuyển vị một phép đo không tạo ra một phép đo mới.*
  · Nợ: **97 mục · 35 đã đóng · 62 còn mở** (~49 thuộc Thành Phố 3D). Test **1530 bài**.

- **Trò chơi — VÒNG 28 (2026-09-02, mới nhất): HÀNH TRANG — BỚT TRƯỚC, RỒI MỚI DỰNG.**
  · ⚠️ **BÀI HỌC CHÍNH, và nó chỉ vào chính bản vá vòng 27:** Đàm nói **ba lần** rằng Hành trang
  "chưa thấy thay đổi gì". Lý do là vòng 27 tôi THÊM một dải hero lên trên một thẻ đã nói cùng nội
  dung, nên màn hình **dài thêm mà không mới thêm**. ⇒ ***Thêm mà không bớt thì không phải thiết
  kế lại.*** Trước khi thêm bất cứ khối nào vào một màn, hỏi *"khối này nói điều gì mà màn hình
  chưa nói?"* — không trả lời được thì đừng thêm.
  · **Huy hiệu:** 360 dấu nay là **một LƯỚI ô vuông** (`shared/BadgeGrid.jsx`) thay cho hai danh
  sách chữ. Ô chưa đạt để xám kèm vòng tiến độ — bộ sưu tập chỉ có nghĩa khi thấy được phần còn
  thiếu. **Bỏ phân trang**: xem hết là điểm chính. Bộ lọc thu gọn (lưới từng bắt đầu ở y=1398, nay
  y=589). `Achievements.jsx` 977 → 745 dòng.
  · **Công trình:** gỡ tiêu đề "Xưởng xây dựng" (chỗ thứ BA gọi tên màn hình) + thu gọn sáu chip
  thông số vào một `<details>`.
  · Test **1524 bài** (1523 pass · 0 fail · 1 skipped).

- **Trò chơi — VÒNG 27 (2026-09-02, mới nhất): HÀNH TRANG CÓ BẢN SẮC RIÊNG · ĐÓNG 3 MỤC NỢ.**
  Lệnh Đàm: *"khắc phục toàn bộ tech_debt và sửa lỗi bug… thay đổi lớn hơn nữa, UX/UI và mọi thứ ở
  hành trang vẫn chưa thấy thay đổi gì… đừng có quá đo tiểu tiết, nên thực hiện lớn rồi sửa khi mà
  tôi muốn sửa"*.
  · **Hành trang:** mỗi tab mở đầu bằng một **dải hero có màu** (`shared/InventoryHero.jsx` +
  `inventoryHero.js`) — một con số to + đúng một việc nên làm tiếp + thanh tiến độ. Vòng 24 đổi
  CẤU TRÚC nhưng không đổi phần NHÌN, và Đàm nói đúng là mở ra chẳng thấy gì mới.
  · **Đóng `TECH_DEBT #94`** (độ trễ vào nghỉ đi THEO việc có lễ mừng: 3.200ms/500ms — ~82% số
  phiên từng chờ 3,2 giây trước một màn hình trống) · **#9** (localStorage đầy: dọn khoá cũ rồi
  thử lại, hỏng tiếp thì BÁO chứ không nuốt) · **phần lớn #3** (ba kỹ năng Thăng Hoa giá 16 SP có
  mô tả hứa hẹn mà chưa bao giờ được nối dây — nay có thật; vế "ngưỡng kỷ nguyên giảm 20%" đã được
  GỠ KHỎI MÔ TẢ thay vì để app hứa điều nó không làm).
  · **Giảm nhẹ #14:** thẻ thưởng của phiên thường nay nói TIẾN ĐỘ (*"Cảng Biển Lớn · còn 4 phiên"*)
  thay vì hai con số vô nghĩa. Phần gốc (ba hằng số + lọc theo kỷ) vẫn Open — nó đòi sửa
  `BUILDING_ZONES`/`placeBuilding`, tức đụng ADR-007 và Thành Phố.
  · ⚠️ **BUG IM LẶNG CẮN BA LẦN trong một phiên:** chuỗi tra tên bản vẽ chép ra ba nơi, sai cả ba
  kiểu khác nhau (`.name` — trường không tồn tại · `.find` trên một OBJECT các mảng ·
  `BUILDING_EFFECTS[id].label` — **0/75 mục có `label`**, nhánh chết ngay từ lúc viết). Cả ba im
  lặng vì `??` nuốt gọn và câu hỏng đọc lên vẫn xuôi tai. ⇒ **Tên bản vẽ chỉ được tra bằng
  `blueprintLabel()`** (`engine/craftProgress.js`), nguồn duy nhất là `BLUEPRINT_CATALOG`.
  · Test **1524 bài** (1523 pass · 0 fail · 1 skipped).

- **Trò chơi — VÒNG 26 (2026-09-02, mới nhất): GỠ ĐIỂM MÙ "MÀN SAU KHI KẾT THÚC PHIÊN", RỒI
  LÀM LẠI NÓ.** Đây chính là việc mà vòng 25 đề xuất làm tiếp, và nó mở khoá đúng như dự đoán.
  · **Cách soi từ nay:** `node scripts/shot.mjs --phone --fixture <f.json> --preview <cảnh>` —
  cảnh ở `src/dev/previewStage.js` (`loot` · `loot-max` · `era` · `level` · `toasts`). An toàn vì
  mọi hộp thoại sau phiên CHỈ ĐỌC `ui`, và `ui` nằm ngoài `partialize` ⇒ không ghi localStorage,
  không lên Supabase, không bắt đầu phiên nào. **KHÔNG được cho `ui` vào `partialize`** — cả lời
  hứa an toàn dựa vào việc nó nằm ngoài (có test canh).
  · ⚠️ **LỜI NÓI DỐI THỨ NĂM CỦA `shot.mjs`: một tấm ảnh KHÔNG bắt được thứ chỉ sống 4 giây.**
  Thẻ thưởng hiện ở giây **13,5** và tắt ở giây **17,7**; `--settle` 0,4 → 14 giây đều ra ảnh
  sạch + probe `false` + không lỗi nào, tức đọc y hệt *"tính năng không chạy"* (tôi suýt kết luận
  đúng như vậy). Nguyên nhân: cổng "đợi DOM đứng yên" chạy SAU `--settle` và chỉ nhả khi mọi thứ
  thôi nhúc nhích = khi thẻ đã tắt. ⇒ **Soi thứ thoáng qua thì PHẢI dùng `--watch "<chuỗi>"`**
  (ghi lại mọi lần hiện/tắt + chụp đúng lúc đang hiện), đừng chỉnh `--settle`.
  · **Ba khuyết tật đã sửa, cả ba đo được:** di vật **huyền thoại** từng khác phiên thường đúng
  **3px vệt màu + mấy chấm + một chữ** → nay nền pha màu + vệt dày dần theo bậc (chỉ `hiem`/
  `huyenThoai`; `thuong`/`tot` không đổi một điểm ảnh) · chữ **"THƯỜNG"** từng đóng dấu lên đúng
  chiến thắng vừa giành được (mà `thuong` là bậc MẶC ĐỊNH ⇒ nó mang sự VẮNG tin) → bậc thấp nhất
  không dán nhãn · tin **kỷ nguyên mới** (hiếm nhất game) từng nằm trong thẻ 299px ở **đáy** một
  trang cao 3.201px → nay **nhan đề** nói ngay (kỷ nguyên > lên cấp > xong phiên), còn thẻ ăn mừng
  giai đoạn 6 GIỮ NGUYÊN.
  · Chữ trong màn **327 → 267** (−18%). Chiều cao gần như không đổi — phần còn lại là NỘI DUNG
  phần thưởng thật, cắt tiếp là cắt vào dopamine chứ không phải cắt mỡ.
  · Test **1512 bài** (1511 pass · 0 fail · 1 skipped).

- **Trò chơi — VÒNG 25 (2026-09-02, mới nhất): MÀN "TẬP TRUNG" + "THỐNG KÊ" — gỡ bốn chỗ app
  NÓI DỐI HOẶC IM LẶNG.** Nốt phần còn lại của lệnh vòng 24 (*"tổng đại tu cho đơn giản, dễ hiểu
  hơn về UX/UI của mục Tập Trung, Hành Trang và Thống Kê"*).
  · **CHẨN ĐOÁN GỐC:** màn Tập trung KHÔNG thiếu tính năng — nó có bốn thứ **đã viết xong mà không
  tới được Đàm**, mỗi thứ im lặng một kiểu, nên không thứ nào lộ ra ba thứ kia.
  · **Số đo:** bắt đầu một phiên **4 thao tác → 2 chạm ngay trên nếp gấp** (khoảng hở tới thanh
  điều hướng **76px**) · huy hiệu mốc 25/50/75% từ **không thể hiện** (cổng `!useMinimalFocusStage`
  luôn sai lúc phiên chạy ⇒ app tính mốc rồi vứt đi) **→ hiện thật** · nhãn vòng đồng hồ **"SẴN
  SÀNG" → "Chờ mục tiêu"** khi app đang từ chối bắt đầu · **mục tiêu phiên nay còn nhìn thấy trong
  lúc phiên chạy** (trước đó mọi chỗ render đều gác `isIdle` ⇒ bắt gõ ≥10 ký tự rồi giấu 25 phút) ·
  Thống kê: **1/5 tab và 3/6 kỳ hạn** từng nằm ngoài màn hình sau cuộn ngang **→ hiện đủ**.
  · ⚠️ **ĐÁNG NHỚ NHẤT — HẾT GIỜ NGHỈ CÂM TRÊN CẢ BA KÊNH CÙNG LÚC** (tiếng · thông báo trình duyệt
  · Web Push), nên **không kênh nào lộ ra rằng hai kênh kia cũng câm**. Đây là lần thứ BA tìm thấy
  một hàm viết xong với **0 nơi gọi** (`playMilestone` vòng 22 · `playBreakStart` vòng 23 ·
  `notifyBreakOver` vòng 25) ⇒ đã dựng `notificationReach.test.js` để lớp THÔNG BÁO cũng được ĐẾM
  như lớp TIẾNG. `notifyFocusComplete`/`notifyDisaster` nằm trong danh sách miễn trừ **tường minh
  kèm lý do đo được**, không phải bị bỏ quên.
  · ⚠️ **MÌN CHO PHIÊN SAU:** đây là lần đầu `soundEngine`/`notificationManager` bị chạm từ một
  ĐỒNG HỒ (`useGameLoop`, mỗi giây) chứ không từ một cú bấm nút. Bài test node nào tick giờ nghỉ sẽ
  nổ `ReferenceError: window is not defined` — chữa bằng cách đặt `.enabled = false` TRONG BÀI TEST,
  **không** đi rào hai engine dùng chung (rào sai một chỗ là câm tiếng thật của Đàm trên production).
  · Test **1499 bài** (1498 pass · 0 fail · 1 skipped).

- **Trò chơi — VÒNG 24 (2026-09-01): TAB "HÀNH TRANG" — 6 màn sau 3 tầng tab → 3 màn,
  1 hàng tab.** Lệnh Đàm: *"làm lại đơn giản hơn… phải DỄ HIỂU, DỄ CHƠI… có thể đập đi xây lại"*.
  Khảo sát bằng 12 nhánh soi song song, luật *không số đo = không tính*, rồi sửa TUẦN TỰ.
  · **CHẨN ĐOÁN GỐC:** Hành trang là **bảo tàng của những thứ Đàm KHÔNG có** — nó trả lời *"tôi
  đang có gì"*, một câu không có tính cấp bách, trong khi vòng lặp gây nghiện cần *"tôi SẮP có gì,
  còn bao xa"*.
  · **Số đo:** tầng tab **3 → 1** · màn con **6 → 3** · hàng tab **246px (29,1% màn hình) → 38px**
  · tổng chiều dài **115.864px → 17.754px** · màn không có nút nào **2/6 → 0/3** · thành tích hiện
  tiến độ **0/360 → 310/360**.
  · Ba màn gom theo CÂU HỎI, không theo loại dữ liệu: **Kỹ năng · Công trình** (Bản vẽ+Xưởng) **·
  Huy hiệu** (Thành tích+Di vật). ⚠️ **Ba id tab con GIỮ NGUYÊN** (`skills`/`collection`/
  `achievements`) nên thông báo đã lưu vẫn trúng; `collectionTab` cũ được DỊCH chứ không bỏ qua
  (`relics` → Huy hiệu, `history` → Thống kê).
  · **Xoá tab "Lịch sử"**: 98.568px = 117 màn hình, 4.362 con số, **0 nút**, **0 thông báo trỏ tới**.
  · **«Sắp đạt»** ba mục gần nhất lên nếp gấp Huy hiệu; «Chưa đạt» từ y=7.040 → **y=2.120** và sắp
  theo tiến độ (mục gần nhất từng nằm ở y=9.606 = 11,4 màn hình).
  · **Di vật nói thật**: khủng hoảng chỉ nổ MỘT LẦN lúc vượt mốc EP ⇒ **5/12 dòng đã lỡ vĩnh viễn**
  mà màn hình vẫn mời "chinh phục"; nay tách hai nhóm + hiện phần thưởng thật thay "???" + đếm
  ngược đọc `triggerEP` (trước đó **0 component** đọc con số ấy).
  · **Kỹ năng thôi nói dối**: **21/32 nút (66%) hiện giá thấp hơn giá thật, tệ nhất 2,3 lần**.
  ⚠️ **BÀI HỌC LỚN NHẤT — MỘT CÁCH LÀM CHẠY ĐÚNG DƯỚI `node` VÀ HỎNG CÂM TRÊN BẢN THẬT:** đọc
  ngưỡng thành tích bằng regex trên mã nguồn `check` đúng 100% khi đo và **sai 100% trên production**
  (Vite rút gọn `s.sessionsCompleted` → `s.a`). Ngưỡng phải là **DỮ LIỆU**, `check` sinh ra từ nó.
  ⚠️ **KHÔNG làm** hai việc khảo sát đề nghị, cả hai bị bác BẰNG SỐ: đưa Di vật lên đầu (khủng
  hoảng kế còn **114 phiên** — không phải "việc tiếp theo") · thêm khối "Làm được ngay" (câu ấy đã
  có ở màn Tập trung; thứ thiếu là **đứng đúng chỗ**, nên nay bấm "Hành trang" rơi vào tab CÓ việc,
  không in thêm một chữ).
  ⚠️ **`TECH_DEBT #96` — tiến hoá di vật là CƠ CHẾ CHẾT**: tiêu tinh luyện của kỷ ĐÃ QUA, mà tinh
  luyện chỉ rơi vào kỷ đang chơi ⇒ 3/3 nút "Chưa đủ tài nguyên" vĩnh viễn. **Đàm chọn.**
- **Trò chơi — VÒNG 23 (2026-09-01): "hứng thú hơn, đơn giản hơn, NHƯNG KHÔNG LẠM PHÁT
  THÔNG TIN".** Vế cuối là vế MỚI và nó **đảo ngược phản xạ mặc định**: cách rẻ nhất để một màn
  hình "vui hơn" luôn là thêm huy hiệu / thêm chữ / thêm thẻ — đúng thứ bị cấm. Nên cả vòng phải
  trả lời bằng phép **TRỪ**: 9 việc, 27 file, **+1.006 / −1.248 dòng (ròng −242)**.
  · ⚠️ **VÁ HAI LỖI THẬT ĐANG CHẠY TRÊN PRODUCTION.** (1) **Chồng thẻ thưởng che TRỌN thanh điều
  hướng sau MỖI phiên** — nav y=774…832, `bottom-3` đặt đáy chồng thẻ đúng ở 832, `z-[48] > z-40`,
  mỗi thẻ là `<button>` có `pointer-events-auto` ⇒ chạm bất kỳ nút nào trong 5 nút đều mở hộp phần
  thưởng. Ba thứ **đều đúng riêng lẻ** cộng lại thành lỗi, không có dòng nào để `grep`.
  (2) **Bước cuối chuỗi tuần hiện "Đã chốt" và "0%" cạnh nhau** — hai công thức cho một sự thật
  (`chainStepsCompleted` so với `chainStepIndex`, lệch đúng 1 khi xong chuỗi). Nay trạng thái một
  bước tính MỘT LẦN ở `components/weeklyChainStep.js`, ba trạng thái loại trừ nhau ⇒ mâu thuẫn cũ
  **bất khả thi theo cấu tạo**.
  · **~860 dòng mã KHÔNG BAO GIỜ chạy được đã xoá — ba kiểu chết, chỉ MỘT kiểu `grep`/lint thấy:**
  (a) 0 nơi tham chiếu (`setSurgeChoice` · `addBuildingPassiveResources` · `craftTier`);
  (b) chết vì một `return null` ĐỨNG TRƯỚC (`FocusIntro` là nơi gọi DUY NHẤT của
  `getFocusIntroCopy`) ⇒ kho câu chào **39 bank/762 dòng → 3 bank/42 dòng**, **giữ nguyên toàn bộ
  câu TIÊU ĐỀ**; (c) chết vì một trường vĩnh viễn `null` (`surgeOverride`).
  `App.jsx` **3.006 → 2.176 dòng** · `gameStore.js` 6.230 → 6.123.
  · **Chữ nói lại chữ, bảy màn:** Thành tích **19.059 → 11.739px (−38,4%)** · Xưởng 2.559 → 2.455 ·
  Bản vẽ 2.832 → 2.745 · nút chính màn Tập trung **188×59 → 308×42**, biên tới nav 32 → **71px**
  (ca tiêu đề dài nhất **~6 → 45px** — màn này đã để nút chính chui xuống dưới nav HAI lần rồi).
  · **Chồng thẻ sau phiên: cắt `rank` + `mission`** (cả hai đã có kênh bền VÀ chúng lặp) ⇒ ca
  thường ngày **2–3 → 1–2 thẻ**. **GIỮ `weekly`** — một nhịp MỖI TUẦN là thứ ĐỐI LẬP với lạm phát.
  · **Ba khoảnh khắc câm nay có tiếng, tốn 0 chữ** (một trong ba còn XOÁ 174 ký tự): chọn gói âm
  thanh nay LÀ cú nghe thử · vào nghỉ có tiếng · 5 nút nav nhúc nhích khi bấm. Cộng cổng mới
  `soundReach.test.js` (mọi `play*` phải có ≥1 nơi gọi; miễn trừ là `assert.deepEqual`).
  ⚠️ **HAI LẦN KHẢO SÁT ĐỀ NGHỊ XOÁ MỘT THỨ ĐÁNG GIỮ** và cả hai lần lý lẽ nghe rất xuôi (thẻ
  «tổng kết tuần»; 15 dòng di vật — mỗi dòng mang một danh từ riêng trả lời *"cái này rơi ở đâu"*).
  **Điểm "đơn giản hoá" cao không tự nó là lý do làm.**
- **Trò chơi — VÒNG 22 (2026-09-01): "hứng thú hơn, hệ thống ĐƠN GIẢN hơn".** Bảy việc,
  không việc nào thêm một khái niệm mới cho Đàm; ba việc là XOÁ hoặc HẠ.
  · **Cây kỹ năng 336 SP → 138 SP** (2/3/5/8 theo hạng). Ở nhịp ~80 SP/năm thì mở trọn cây đi từ
  **15,9 năm xuống ~1,7 năm**. Hạ giá là phép CỘNG THÊM thuần — kỹ năng đã mở giữ nguyên, SP đã
  tiêu không đòi lại, KHÔNG cần migration. ⚠️ Cố ý **KHÔNG** đụng `EXP_PER_LEVEL`: `player.level`
  được LƯU chứ không suy ra, và `migrate` KHÔNG chạy trên đường Supabase pull (`_importGameData`
  và `merge` gọi thẳng `normalizePersistedGameState`) — muốn tặng SP hồi tố thì phải có cờ một-lần
  kiểu `skinMigratedV1` đặt TRONG `normalize`.
  · **Sự kiện của phiên lên mặt thẻ.** 63% số phiên sinh một sự kiện có tên/icon/câu chuyện riêng
  (+15–30% XP) nhưng nó chỉ được vẽ trong `LootDropModal`, mà hộp ấy chỉ tự mở ở **1,2%** số phiên
  ⇒ ~358 câu chuyện đã tính rồi bị xoá không ai thấy.
  · **513 biểu tượng vẽ tay lên được màn hình** — `getGlyph`/`hasGlyphIcon` ở `utils/labelMark.js`.
  Mọi màn sưu tập trước nay hiện ký hiệu 2 chữ cái ("NH" · "VC" · "XĐ" · "RL").
  · **Huy hiệu hệ số hết câm**: bản cũ chỉ nói được vách ×1.3 rồi im ở **75,2%** số phiên, mà im
  đúng khúc 45–59 phút nơi **117 phiên** đã dừng khi chỉ còn 1–15 phút là chạm ×2.0.
  · **Mốc chuỗi 7/14/30 nay có thẻ + tiếng chuông** (`playMilestone` xưa nay 0 nơi gọi).
  · **Rương Lớn + tinh luyện được gọi tên** trên thẻ (10,1% và 28,8% số phiên).
  · **Lễ mừng thành phố chỉ chạy khi có công trình MỚI** — trước đó nó chạy 3,2 giây sau MỌI phiên
  để khoe một dòng chữ vốn luôn hiện sẵn: 30,9 phút chờ trong 579 phiên.
  ⚠️ **KHÔNG làm** cái chấm chú ý theo `sp > 0`: đo lại thì `hasReadyOpportunity` ĐÃ đọc `sp` và
  gác đúng (sáng ở 2 SP, tắt ở 1 SP). Bật chấm ở 1 SP là đẩy Đàm sang màn anh không làm được gì.
- **Thống kê — VÒNG 21 (2026-08-30, phiên khác):** gộp ba bộ lọc thời gian thành MỘT
  (`engine/statsPeriod.js` là nguồn kỳ duy nhất, 6 kỳ theo nghĩa LỊCH — trước đó ba tab có ba mặc
  định khác nhau nên bấm sang tab là cửa sổ thời gian âm thầm đổi); sửa lỗi NHÃN "tuần này" vốn
  tính bằng `now − 7 ngày`; thêm dải "Điều đáng chú ý" đưa ~10 phép phân tích SẴN CÓ trong
  `gameMath.js` ra màn hình (trước đó chúng chỉ chảy vào AI Coach, tức cần mạng + tốn tiền Gemini);
  xoá 960 dòng code chết khỏi `StatsDashboard.jsx` (4.901 → 3.941). Xem `TECH_DEBT #93`.
- **Giao diện — VÒNG 20 (2026-08-30):** tối giản toàn app bằng **fan-out soi song song**
  (6 nhánh chỉ-đọc soi 9 màn ở 390px, luật *không số đo = không tính*, rồi sửa TUẦN TỰ — 9 commit).
  ⚠️ **Nút chính màn Tập trung từng bị thanh tab che LẠI sau vòng 19** vì vòng 19 đo trên NGÀY CHÀO
  NGẮN, mà khối chào dài 2 hoặc 3 dòng tuỳ biến thể copy (chênh 26px). Nay: `FocusNextAction` đã
  NHẬP vào bộ chọn `focusMomentPick` thành nguồn thứ năm (cột giữa còn đúng HAI dòng, trần xấu nhất
  khoá bằng CẤU TRÚC), trần vòng đồng hồ `64vw → 58vw`, `pt-8 → pt-4` ở khổ điện thoại ⇒ **nút cách
  thanh tab 53px**. ⚠️ **Thêm bất cứ gì vào cột giữa màn Tập trung thì phải đo lại bằng ảnh
  VIEWPORT — ảnh `--full` KHÔNG thấy lỗi này** (nó là ảnh ghép nên thanh `fixed` không đè lên gì).
  Số đo khác: màn Tập trung 2.920→2.660px · tab Kỹ năng 3.145→2.032px · Thành tích 14.254→12.633px
  · nhãn tiếng Anh trên màn hình 11→0.
- **Giao diện (từ `main`): ADR-060 + ADR-061** — MỘT thẻ phần thưởng chung; luật mức độ làm phiền
  **hết ngoại lệ** (chặn màn hình CHỈ dành cho lên kỷ · thăng hoa · khủng hoảng kỷ · thảm hoạ).
  Nó chạy được nhờ tách MỘT trường thành HAI: `lastWeeklyReportDate` = *đã MỜI* ·
  `lastWeeklyReportSeenDate` = *đã XEM*. Luật: **mở = đã xem, đóng = không ghi gì, toast hết giờ =
  không ghi gì**; chấm ở nút "Báo cáo tuần" là LƯỚI AN TOÀN (không hết hạn), đừng gỡ, và nó phải
  căng ở **CẢ HAI** nền tảng (thanh bên desktop VÀ menu "Thêm" trên iPhone — trước ADR-061 iPhone
  không có nút nào mở báo cáo tuần).
  ✅ **Skin `arcade` ("Sân Chơi") — VAN ÉP CHUYỂN ĐÃ LÀM (2026-08-29), đừng làm lần nữa.**
  Dữ liệu đã lưu vốn thắng `DEFAULT_UI_SKIN`, nên đổi mặc định KHÔNG đổi được máy của Đàm — đó là
  lý do anh "sửa nhiều mà không thấy gì" ngày 2026-08-28. Nay `settingsStore` lên **version 9** và
  `migrate` gọi `resolveSkinAfterMigration` (`uiSkins.js`): máy nào chưa mang cờ `skinMigratedV1`
  thì bị kéo về mặc định ĐÚNG MỘT LẦN rồi đóng dấu.
  ⚠️ **TỪ NAY KHÔNG ĐƯỢC ÉP LẦN NỮA** — cờ đã đóng dấu nghĩa là mọi lựa chọn skin sau đó là lựa
  chọn CÓ Ý THỨC của Đàm; ép thêm một lần là đè lên nó. Muốn đổi mặc định cho máy mới thì chỉ sửa
  `DEFAULT_UI_SKIN`, đừng tăng version để chạy lại `migrate`.
  *(Dòng này trước đây ghi "chưa làm" — một ghi chú cũ sống sót qua phép gộp; để nguyên thì phiên
  sau sẽ ép skin lần thứ hai và xoá lựa chọn của Đàm.)*
- **Thành phố 3D (từ nhánh Phase 19–21): ADR-064 · ADR-065 · ADR-066.** Bộ xương thành phố sinh
  theo kỷ: BSP quyết cắt Ở ĐÂU, cung cong quyết cắt theo HÌNH GÌ; **một thửa là TẬP Ô**, không phải
  hình chữ nhật đã khai. Trước đó: ADR-059 (mỗi kỷ MỘT MẠNG ĐƯỜNG riêng — hết bàn cờ).
- ⚠️ **PHÉP GỘP 2026-08-28 CÓ MỘT QUYẾT ĐỊNH PHẢI BIẾT — `reach` LẤY 0,8 CỦA NHÁNH, KHÔNG LẤY 0,75
  CỦA `main`.** Hai phiên đo cùng một đại lượng trên hai THẾ GIỚI khác nhau: `main` đo trên bố cục
  cũ và chốt 0,75; nhánh đo trên bố cục Phase 21 §4 (thành phố LAN RA NGOÀI ô lưới) và thấy khối đổ
  bóng xa tâm nhất đi tới bán kính **9,2275** — xa hơn cả `reach` mà 0,75 cho ra (9,00). Sau gộp,
  thế giới là bố cục MỚI, nên số của nhánh mới là số đúng; giữ 0,75 là cắt cụt bóng ở vành ngoài.
  Đúng bài học `TECH_DEBT #43`: **một bảng số chỉ đúng cho đúng hai commit đã sinh ra nó.**
- ⚠️ **Bóng đổ nay có HAI tầng nướng sẵn, nhân vào nhau** — `contactShade` (trục ĐỨNG, đo từ nền của
  CHÍNH công trình nhờ bản vá của `main`) × `occlusionShade` (đủ BA chiều, từ nhánh Phase 21). Phép
  gộp giữ cả hai; đừng gỡ tầng nào mà chưa đọc `geometryFactory.js` dòng ~90.
- Chuyển động: **ĐÚNG BA NHỊP**, nguồn duy nhất `src/lib/motionPresets.js` — `enter` (thứ xuất
  hiện) · `press` (thứ bấm được) · `reward` (phần thưởng, cột mốc). Cả ba **tự im** khi bật
  "Giảm chuyển động" nên chỗ gọi đừng tự kiểm tra. ⚠️ Đừng gõ lại `initial`/`animate` bằng tay,
  đừng thêm nhịp thứ tư (`motionPresets.test.js` đếm và sẽ đỏ). Danh sách hiện SO LE thì dùng
  `withDelay(enterMotion, i * 0.03)` — vẫn là nhịp `enter`, chỉ lệch giờ. Ngoại lệ đi qua
  `useCustomMotion` (bỏ hẳn) hoặc `useSnapMotion` (nhảy tới đích, cho thứ mà `animate` MANG BỐ
  CỤC — trả rỗng ở đó là VỠ giao diện), và phải kèm một dòng lý do. **KHÔNG áp cho thành phố 3D.**
  ⚠️ `motionCoverage.test.js` canh CẢ CÂY: file ngoài bảng ngoại lệ phải có 0 khai báo rời rạc,
  và file trong bảng mà dọn bớt rồi thì phải HẠ số xuống. Thêm một dòng vào bảng ấy là một
  quyết định, không phải một thao tác dọn dẹp.
- Điều hướng: **5 mục** ở thanh bên desktop (Tập trung · Hành trang · Thành Phố · Thống kê · Cài
  đặt); iPhone **4 nút + "Thêm"**. Kỹ năng/Kho báu/Thành tích là ba TAB CON của "Hành trang" và
  **vẫn mang id cũ** — thông báo đã lưu trỏ vào chúng, `resolveTabTarget` (`App.jsx`) là cửa dịch.
- Giao diện: **5 skin**, mặc định là **"Sân Chơi" (`arcade`)** — phẳng, sans đậm, thẻ có chân bóng
  đặc 3px. Danh sách skin + mặc định có MỘT nguồn duy nhất: `src/store/uiSkins.js`. ⚠️ Thêm skin thì
  phải đủ ba chỗ (danh sách · `SKIN_OPTIONS` ở `Settings.jsx` · khối `[data-skin=…]` ở `index.css`)
  **và** một khối `[data-theme="dark"][data-skin=…]`, vì khối `[data-theme="dark"]` đứng sau mọi
  khối skin với độ đặc hiệu bằng nhau nên nó thắng. `uiSkins.test.js` canh cả bốn.
- Phần thưởng: MỘT thẻ chung `components/shared/RewardCard.jsx`, MỘT thang độ hiếm **đúng bốn
  bậc** ở `engine/rewardTiers.js` (thường/tốt/hiếm/huyền thoại). ⚠️ Đừng thêm bậc thứ năm và đừng
  vẽ thẻ phần thưởng riêng ở một màn nào nữa — `rewardTiers.test.js` khoá con số 4.
- ⚠️ **Mọi thứ mới muốn "báo cho Đàm biết" thì chọn MỘT trong ba, không tự bật hộp thoại**: toast
  (`engine/rewardFeed.js`) · chấm chú ý (`engine/navAttention.js` → `attentionTabIds`) · chuông
  thông báo (`ui.notificationFeed`). `rewardToastWiring.test.js` canh việc này.
- Cảnh 3D: 15 kỷ, mỗi kỷ buộc vào một nước có thật (`country`/`landmark` ở `eraStyle.js`).
  Các bảng bản sắc 15 kỷ đã có: mái · tầng trệt · mặt đường · thực vật · địa thế/nước ·
  vùng phụ cận · khu phố (có trục `layout`) · dáng đi · mạng đường.
- Lưới thành phố **12×12**. Mỗi kỷ có mạng đường RIÊNG (**44…88 ô**, không còn là 80 ô chung).
  Thửa chia vai ở `city3d/parcelRoles.js`: 5 kỳ quan (536 ô) · 1–2 sân bỏ trống (155 ô) ·
  còn lại nhà dân (**371 ô trên cả 15 kỷ**, đã chạm trần). Muốn thành phố đông hơn thì đổi thứ
  NẰM TRONG một ô, đừng thêm ô.
  ⚠️ Hỏi mạng đường thì phải truyền `era`: `roadCellCandidates(era)` / `roadCellCount(era)`
  (ở `src/engine/cityLayout.js`) — gọi thiếu tham số sẽ **im lặng** trả lời về kỷ 1.
- Hiệu năng: đã đo dứt điểm trên Apple M3 — **dư 3,2 lần**, hình học gần như miễn phí.
  **KHÔNG đo lại** trừ khi Đàm thấy khung hình giật trên máy thật.

## Việc tiếp theo (chưa làm)
0. **Hai thứ CHƯA SOI ĐƯỢC, không phải chưa làm** (vòng 20 ghi lại để phiên sau khỏi đi lại):
   (a) **màn hiện ra SAU khi kết thúc một phiên** — khoảnh khắc dopamine lớn nhất của app. `ui`
   KHÔNG nằm trong `partialize` của store nên KHÔNG gieo được bằng `--fixture`/`--ls`, và store
   không lộ ra `window` nên `--probe` cũng không mở được hộp thoại. Cấm bấm "Bắt đầu" trên dev.
   (b) **tab Kho báu › Di vật** — fixture chưa gieo `relics`/`research` nên nó luôn hiện 0/15 và 15
   dòng "??? KHOÁ"; cái trống ấy là của CÔNG CỤ, không phải của app. Muốn soi thật thì phải thêm
   gieo `relics` vào `scripts/make-fixture.mjs` trước.
   (c) **`refinedEarned` / `jackpot` trong fixture luôn bằng 0** (vòng 22) — `make-fixture.mjs`
   không replay hai trường ấy, nên đừng đọc chúng để suy ra tần suất. Hỏi thẳng CÔNG THỨC:
   `minutes >= T2_DROP_THRESHOLD_MIN` (45') và `>= DEEP_SESSION_THRESHOLD` (60').
   ⚠️ **(a) đã chặn một việc THẬT ở vòng 23, không chỉ là bất tiện.** `BREAK_START_DELAY_MS` chờ
   3,2 giây ở **~82%** số phiên không còn lễ mừng nào để che (31,4 phút trong 180 ngày) — bản vá
   đúng đã biết rồi (đổi hằng số thành quan hệ: 3.200 khi có lễ mừng, 500 khi không) nhưng **không
   ship được vì không quan sát được**. Ai gỡ được điểm mù (a) thì mở khoá luôn `TECH_DEBT #94`.
0b. **HAI VIỆC ĐÀM PHẢI CHỌN, tôi không tự chọn** (mở ở vòng 23, đã đo sẵn):
   · **`TECH_DEBT #94`** — độ trễ vào nghỉ, xem ngay trên.
   · **`TECH_DEBT #96`** — **tiến hoá di vật là một cơ chế CHẾT**: `evolveRelic` tiêu tinh luyện
   của kỷ ĐÃ QUA, mà tinh luyện chỉ rơi vào kỷ đang chơi và công trình kỷ cũ bị gỡ khi lên kỷ ⇒
   không có đường nào kiếm. Ảnh chụp: 3/3 nút "Chưa đủ tài nguyên", vĩnh viễn. Mọi lối ra đều là
   đổi luật KINH TẾ.
   · **`TECH_DEBT #95`** — xây MỘT công trình phải qua **BA cổng tiền tệ**, cả ba đều là hàm của
   số phút. Kho thô thừa **14 lần** nhu cầu. Đây là **kinh tế**, không phải hiển thị ⇒ nằm ở phía
   bên kia ranh giới an toàn *"đừng xoá thứ Đàm đã KIẾM ĐƯỢC"*. ⚠️ **ĐÃ BÁC** phương án "nối dây
   nút đổi thô lấy tinh luyện": chính con số 14 lần bác nó.
1. **Kim tự tháp / ziggurat** — kỷ 2 (Ai Cập) và kỷ 3 (Iraq) đang ra mái nón nhiều cạnh,
   không có khối chóp bốn mặt. `prism` với `sides: 4` + `taper: 0` chính là thứ cần.
2. **"Giống 3D hơn"** — bóng đổ nét hơn (`SHADOW_MAP_DESKTOP` 2048 → 4096, siết
   `sun.shadow.camera` về phạm vi thành phố) + thêm che khuất môi trường (AO).
3. **Chặng trong kỷ: MỐC đã xong, THÀNH PHỐ thì chưa** (2026-08-29 chiều). Chặng nay là mốc đo
   được thật — thanh tiêu đề đo chặng (~3%/phiên, đầy 3 lần mỗi kỷ) + dòng đếm ngược "còn ~N phiên
   nữa tới «…»" ở màn Tập trung. Nguồn duy nhất: `src/engine/eraStage.js`.
   ⚠️ **ĐÃ BỎ nửa sau của đề xuất cũ** ("thành phố 3D đổi theo chặng"): `deriveProps` và
   `deriveResidentCount` ĐÃ nhận `sessionCount` + `streakLength`, tức thành phố vốn đã đông dần
   theo tiến độ — thêm "theo chặng" là trùng lặp mà phải đụng mặt trận 3D.
   ⚠️ Vượt mốc nay CÓ ăn mừng (`pickStageCelebration`, dấu ở localStorage `dc-stage-seen-v1`), và
   ô "Chuỗi" ở thanh tiêu đề báo `Chuỗi ⚠` khi chuỗi đang treo (`evaluateStreakAtRisk`).
   ⚠️ Đừng "dọn dẹp" thanh tiêu đề về đo cả kỷ: một kỷ dài 5.600–20.800 EP ⇒ ~1%/phiên, đầy một
   lần mỗi 1–6 tháng. Có `stageProgressWiring.test.js` canh, kèm bài đòi nó nằm NGOÀI mọi khối
   `hidden … lg:flex` (thanh chặng cũ chỉ có ở cột phải nên iPhone chưa bao giờ thấy).
0. ✅ **ÉP CHUYỂN SKIN MỘT LẦN — XONG 2026-08-29.** `resolveSkinAfterMigration` + cờ
   `skinMigratedV1` + `settingsStore` version **8 → 9**: bản lưu chưa có cờ về `DEFAULT_UI_SKIN`
   đúng một lần rồi bật cờ, có cờ rồi thì tôn trọng tuyệt đối lựa chọn đã lưu. Màn Cài đặt nay
   hiện 7 ký tự commit đang chạy (`__APP_COMMIT__`, bơm lúc build ở `vite.config.js`).
   ⚠️ **Đừng "sửa" thành so `uiSkin === 'editorial'`** — so giá trị thì mọi lần bump version sau
   đều ép lại, kể cả với người đã chọn có ý. Ba bài ở `uiSkins.test.js` + ba bài ở
   `settingsStore.migrate.test.js` khoá cả hai chiều.
1. 🔴 **CHỜ ĐÀM NHÌN ẢNH PHASE 21** — bản quét 15 kỷ + 12 ảnh nhìn thẳng từ trên xuống (kỷ
   1 · 3 · 7 · 10 · 11 · 14, mỗi kỷ ở 20 phiên và 120 phiên). Nghiệm thu bằng MẮT: kỷ 1–9
   không được thấy hàng lối nào; kỷ 11–15 thì phải thấy. ⚠️ Nay nó đã Ở TRÊN production.
2. **`TECH_DEBT #88`** — trần một-ô (`BLOCK_MAX_CELLS = 1`) đang khoá số suất đất ở 4 ở cả 15
   kỷ, làm cột `units`/`cols`/`rows` của bảng khu phố thành trục chết. Ba phương án đã đo.
3. **`TECH_DEBT #89` vẫn MỞ** dù cổng trục chặng ngày đã qua (12,44) — dải TRỜI, cần gạt đã
   nêu đích danh hai lần, gần như không nhúc nhích. Đừng đọc con số gộp là "đã giải".
4. **"Giống 3D hơn" — nay cần Đàm CHỌN, không cần code.** Hai cần gạt đã dùng hết (2026-08-27):
   bản đồ bóng 2048 → **4096** ✓ · `sun.shadow.camera` đã bó sát. Cần gạt còn lại đều là quyết
   định MỸ THUẬT, đừng tự chọn: (a) đậm/cao thêm bóng tiếp xúc (`CONTACT_FLOOR` 0,58 ·
   `CONTACT_REACH` 0,38) · (b) mép bóng cứng hơn (`PCFSoftShadowMap` → `PCFShadowMap`) · (c) hạ
   đèn nền cho bóng sâu hơn — nhưng (c) đụng cảnh báo "nhợt như sữa" ở `PHASE_RULES` §2.

## Lệnh hay dùng
```
npm install --legacy-peer-deps          # cần flag này
npm test                                # in số bài THẬT ở dòng cuối
npm run lint && npm run build
node scripts/city-preview.mjs --era 6 --hour 12 --width 1500     # soi một kỷ
node scripts/city-preview.mjs --sweep --eras 1,2,3,4,5           # bảng so sánh
```

## Tra cứu ở đâu
`PHASE_RULES.md` cách làm việc · `CLAUDE.md` quy tắc đầy đủ + lịch sử bài học ·
`PROJECT_STRUCTURE.md` file nằm đâu · `ARCHITECTURE.md` luồng dữ liệu ·
`ARCHITECTURE_DECISIONS.md` vì sao chọn thế · `TECH_DEBT.md` nợ đã biết ·
`PERFORMANCE.md` số đo · `BAN_GIAO.md` nhật ký (chỉ đọc 60 dòng đầu) ·
`docs/archive/` lịch sử đầy đủ.
