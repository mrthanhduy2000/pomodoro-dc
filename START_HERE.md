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
- **Giao diện — VÒNG 20 (2026-08-30, mới nhất):** tối giản toàn app bằng **fan-out soi song song**
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
  ⚠️ **Skin `arcade` ("Sân Chơi") là mặc định MỚI, nhưng máy đã lưu skin cũ thì KHÔNG tự đổi** —
  dữ liệu đã lưu thắng `DEFAULT_UI_SKIN` (xem `uiSkins.js`). Đây là lý do Đàm "sửa nhiều mà không
  thấy gì" ngày 2026-08-28; cần một phép ép chuyển một lần, chưa làm.
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
