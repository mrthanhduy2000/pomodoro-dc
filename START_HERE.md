# START_HERE — đọc file này, và chỉ file này, khi mở một phiên mới

⚠️ **TRẦN: 20.000 ký tự — NAY CÓ CỔNG CANH THẬT, không còn là lời hứa.** `npm test` sẽ ĐỎ
(`scripts/docBudget.test.js`) nếu file này vượt trần. Kiểm ngay: `node scripts/doc-budget.mjs`.
File này BẮT BUỘC đọc mỗi phiên nên mọi dòng thừa ở đây bị nhân với **số phiên**.
**Khi test đỏ, cách chữa DUY NHẤT: đẩy vòng cũ nhất sang `docs/archive/START_HERE_LOG_*.md` —
giữ tối đa 3 vòng gần nhất. KHÔNG nới trần, KHÔNG xoá tri thức.**
*(Lịch sử: 2026-09-06 sáng file phình tới 456 dòng = 24.124 token trong khi tự nhận là "file ngắn";
chiều cùng ngày phát hiện nó vẫn vượt trần của chính mình — 20.200/20.000 — mà không phiên nào
biết, vì trần chỉ là một câu chữ. Đó là lý do phải có cổng canh.)*

> **Đây là file DUY NHẤT bắt buộc đọc trước khi làm việc.** Mọi file khác là KHO TRA CỨU:
> chỉ mở khi `grep` trúng thứ đang cần. Trước đây quy tắc bắt đọc trọn `CLAUDE.md` +
> `BAN_GIAO.md` = **6.323 dòng** mỗi phiên; đó là lý do mỗi phiên chỉ còn ~20% sức để xây.
> Cách làm việc + cách ra prompt + cách báo cáo: **`PHASE_RULES.md`**.

## Dự án là gì
App Pomodoro cá nhân của Đàm (non-coder). React + Vite + PWA · Zustand + localStorage ·
Supabase sync · Vercel. Bản thật: `https://pomodoro-dc.vercel.app`.
Mặt trận đang làm: **vòng lặp chính + nâng cấp + màn Thống kê trả lời** (ADR-068/069/070/071, `src/components/` + `src/engine/`).
Thành phố 3D (`src/engine/city3d/` + `src/components/city/render3d/`) là HỘP ĐEN đã xong — Đàm cấm đụng.

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
- **Thống kê + kinh tế — VÒNG 36 (2026-09-06, MỚI NHẤT): THỐNG KÊ TRẢ LỜI, KHÔNG TRÌNH BÀY; ĐÓNG #99
  (ADR-071), không đụng Thành phố.** Lệnh *"build lớn · simplify mạnh · vui hơn · UX/UI · TOÀN QUYỀN"*.
  (1) `StatsDashboard.jsx` **3.792 → 294 dòng**: mở ra là thấy ba thẻ *khá lên không* (tuần này so
  CÙNG QUÃNG tuần trước, 7 cặp cột) · *mạnh nhất khi nào* (giờ · độ dài · loại việc, mỗi dòng kèm cỡ
  mẫu) · *làm gì tiếp* (MỘT nút «Bắt đầu N phút · loại» nhảy thẳng sang Tập trung); dải «Điều đáng chú
  ý» giữ; Nhật ký · Ghi chú GẤP xuống dưới (`StatsJournal.jsx` · `StatsNotes.jsx`). Số ở
  `engine/statsAnswers.js` (thuần, ghép `coachIntel`/`gameMath`). Xoá 3 tab · 6 kỳ · biểu đồ · bản đồ
  nhiệt · `statsPeriod.js` · `statsFocus.js`. (2) **#99 đóng**: tài nguyên · RP · tinh luyện THÔI được
  cộng (khoá vẫn trong save — không migration), huỷ phiên không trừ/không tiêu lượt tha thứ,
  `cancelCrafting` không hoàn, bỏ nhiệm vụ «Kiếm N RP», thẻ bỏ «Rương Lớn/+tài nguyên/+RP». (3) Chữ
  khủng hoảng kỷ trong save đọc lại từ `ERA_CRISES` lúc nạp (`withCanonicalCrisisText`) — luật chung
  *"save lưu id + số, chữ đọc từ bảng"*. ⚠️ Bài học: *ba dòng «mạnh nhất» chỉ có số khi phiên ĐẶT MỤC
  TIÊU* — fixture 599 phiên không có mục tiêu nên cả ba trống; màn nói thẳng việc cần làm thay vì im.
  Cửa soi: `node scripts/shot.mjs --phone --fixture <fx> --tab "Thống kê" --full`. Test **1.597 bài (1.596 pass · 0 fail · 1 skipped)**.
  Nợ: **101 mục · 43 đã đóng · 58 còn mở** (#101 do phiên khác mở cùng ngày).
- **Trò chơi — VÒNG 35 (2026-09-06): MỘT CÁI KẾT DUY NHẤT, KHÔNG NÚT NHẬN, KHÔNG MÀN
  CHẾT (ADR-070), không đụng Thành phố.** Lệnh *"tự quyết định mọi thứ và tech debt · build lớn ·
  simplify mạnh · vui hơn · UX/UI"*. (1) Bước tuần + thưởng trọn ngày TỰ VÀO trong
  `completeFocusSession`, kể ở chuỗi thẻ — xoá `claimWeeklyStep`/`claimMissionAllBonus` và mọi nút
  Nhận; (2) **di vật lớn theo PHIÊN** (`engine/relicGrowth.js`, mốc 20/50 phiên ≥25′ kể từ
  `earnedAt`; save cũ đóng dấu lúc nạp) — xoá `evolveRelic` và giá tinh luyện (`#96` đóng); (3) 11/15
  kỳ quan + 2 đặc quyền công trình về trục sống (`WONDER_EFFECT_REGISTRY.passive`, `wonderEffects.js`
  là nguồn duy nhất); (4) **xoá `LootDropModal`** — chuỗi thẻ là cái kết duy nhất, thẻ «Kỷ nguyên
  mới» có nút «Xem thành phố mới» (`#98` đóng); (5) Huy hiệu có khối «Kế tiếp» (4 gần đạt nhất, thanh
  + «còn N»), bỏ bộ lọc bậc (`#100` đóng). ⚠️ Bài học: *bỏ một nút thì đi tìm mọi việc nút ấy làm
  NGOÀI việc trao thưởng* — nút «Nhận» cũ còn ĐỐI CHIẾU nhiệm vụ với lịch sử; phép ấy nay nằm trong
  `completeFocusSession`. Cửa soi: `--preview "loot-max&dc-preview-card=quests|chain|evolve"` và
  `--preview era` (thẻ kỷ mới). Test **1633 bài** (1632 pass · 0 fail · 1 skipped). Nợ: **100 mục · 40 đã đóng · 60 còn mở**.
- **Trò chơi — VÒNG 34 (2026-09-06): ĐỒNG TIỀN DUY NHẤT LÀ PHIÊN (ADR-069), không đụng
  Thành phố.** Lệnh *"SIMPLIFY. MINIMIZE. AMPLIFY FUN."* (1) Công trình một màn, một nút
  (`BuildScreen.jsx`; store `startProject` không hỏi RP/nguyên liệu — cái giá = N phiên + ô hàng
  chờ); (2) bậc TỰ thăng theo lịch sử, khủng hoảng kỷ = nhiệm vụ mềm — không nút, không hạn, không
  phạt, không chặn Bắt đầu (`engine/rankLadder.js`; xoá `EraCrisisModal` · `DisasterModal` ·
  `StakePanel` · `ResourceDisplay`); (3) chuỗi thẻ thưởng thêm thẻ Thành phố · lên cấp MỜI CHỌN ≤3
  kỹ năng tại chỗ · thử thách kỷ · bậc · di vật; (4) **mọi phần thưởng nằm trên trục sống** — bậc lẻ
  → EP, 12/15 di vật → EP/XP/combo, Vận May → +XP/+EP, Sự Tha Thứ → +6% XP sau huỷ
  (`rewardAxes.test.js`). Tài nguyên/RP/tinh luyện thành DỮ LIỆU NGỦ (`TECH_DEBT #99`, cố ý —
  không xoá thứ Đàm đã kiếm, không đổi state đồng bộ). ⚠️ Bài học: thẻ Thăng bậc in «+12% Tài
  Nguyên» — *một bảng phần thưởng hợp lệ + test xanh vẫn có thể thưởng lên thứ không ai thấy; chỉ
  ẢNH mới bắt được.* Cửa soi: `--preview "loot-max&dc-preview-card=level|rank|relic|project|quest"`.
- 📚 **Nhật ký VÒNG 20 → 33 đã chuyển sang `docs/archive/START_HERE_LOG_2026-09-06.md`**
  (2026-09-06, nguyên văn). Lý do: file này tự nhận "ngắn, đọc mỗi phiên" nhưng đã phình tới
  **455 dòng = 24.119 token**, mà nó là file BẮT BUỘC đọc ⇒ mọi phiên đều trả tiền cho nhật ký cũ.
  **Giữ tối đa 3 vòng** (34 · 35 · 36) ở trên — thêm vòng mới thì đẩy vòng cũ nhất xuống đây. Cần vòng cũ hơn:
  `grep -n 'VÒNG 2[0-9]\|VÒNG 33' docs/archive/START_HERE_LOG_2026-09-06.md`
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
- 🏙️ **Chi tiết Thành phố 3D** (bộ xương BSP · `reach` 0,8 · bóng 2 tầng · 15 kỷ/`country` ·
  lưới 12×12 · hiệu năng dư 3,2×) **đã chuyển sang `docs/archive/START_HERE_LOG_2026-09-06.md`**
  — nó là HỘP ĐEN đã xong, Đàm cấm đụng, nên không đáng trả token mỗi phiên. Cần thì:
  `grep -n 'Thành phố 3D\|reach\|Lưới thành phố' docs/archive/START_HERE_LOG_2026-09-06.md`
  và `docs/LESSONS_3D.md`.

## Việc tiếp theo (chưa làm)
0. **Hai thứ CHƯA SOI ĐƯỢC, không phải chưa làm** (vòng 20 ghi lại để phiên sau khỏi đi lại):
   (a) ✅ **ĐÃ SOI ĐƯỢC từ 2026-09-02** — `src/dev/previewStage.js` + `shot.mjs --preview <cảnh>`
   (`loot` · `loot-max` · `era` · `level` · `toasts`); vòng 33 thêm `dc-preview-card=<thẻ>` cho
   chuỗi thẻ thưởng. Ghi chú cũ bên dưới giữ để hiểu VÌ SAO phải có cửa soi: `ui` KHÔNG nằm trong
   `partialize` của store nên KHÔNG gieo được bằng `--fixture`/`--ls`, và store không lộ ra
   `window` nên `--probe` cũng không mở được hộp thoại. Cấm bấm "Bắt đầu" trên dev.
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
   đổi luật KINH TẾ. ⚠️ **Sau ADR-069 (2026-09-06) nó càng chết** — tinh luyện đã là dữ liệu ngủ
   (`#99`). Lối ra NHẤT QUÁN với ADR-069: tiến hoá theo PHIÊN (vd. N phiên ≥45′ ở kỷ mới), KHÔNG
   quay lại tiền tệ. Vẫn là quyết định của Đàm vì nó đổi tốc độ mạnh lên của di vật.
   · ✅ **`TECH_DEBT #95` — ĐÃ ĐÓNG 2026-09-06 (ADR-069)**: cái giá duy nhất còn lại là PHIÊN + ô
   hàng chờ; ba cổng tiền tệ gỡ khỏi đường chơi, tài nguyên/RP thành dữ liệu ngủ (`#99`), không xoá
   thứ Đàm đã kiếm. Nợ mới cùng ngày: `#99` (dữ liệu ngủ) · `#100` («Chốt bước» + lưới huy hiệu vẫn
   phải bấm để nhận thứ đã đạt).
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
