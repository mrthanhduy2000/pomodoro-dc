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

## 2026-09-01 (vòng 24) — Tab "Hành trang": 6 màn sau 3 tầng tab → **3 màn, 1 hàng tab**

**Mục đích:** lệnh của Đàm — *"tối ưu lại tab hành trang và toàn bộ những gì trong đó, làm lại
ĐƠN GIẢN HƠN nhưng vẫn nâng cao độ hứng thú, độ nghiện và dopamin… PHẢI DỄ HIỂU, DỄ CHƠI… có thể
đập đi xây lại"*. Khảo sát bằng 12 nhánh soi song song (chỉ đọc), luật *không số đo = không tính*,
rồi sửa TUẦN TỰ. 6 commit.

**CHẨN ĐOÁN GỐC:** Hành trang là **một bảo tàng của những thứ Đàm KHÔNG có**, nằm sau 3 tầng tab
(4 ở chỗ sâu nhất), nơi phần lớn nút không bấm được. Đo: 6 màn dài **115.864px = 137 màn hình
điện thoại**, 4.808 con số, chỉ 44 nút bấm được — và **2/6 màn có ĐÚNG 0 nút**.

**Số đo trước → sau**

| | trước | sau |
|---|---|---|
| tầng tab | 3 (4 ở chỗ sâu nhất) | **1** |
| màn con | 6 | **3** |
| hàng tab ăn của màn hình | 246px (29,1%) | **38px** |
| tổng chiều dài | 115.864px | **17.754px** |
| màn không có nút nào | 2/6 | **0/3** |
| thành tích hiện tiến độ | 0/360 | **310/360 (86%)** |

**1. Ba hàng tab chồng nhau → một.** Cả ba dùng CHUNG component `SubTabs` nên bo góc, màu nền, cỡ
chữ giống hệt nhau — **không có gì nói hàng nào là cha, hàng nào là con**. Ba màn nay gom theo CÂU
HỎI người chơi đang hỏi: **Kỹ năng** (tôi tiêu điểm vào đâu) · **Công trình** (tôi xây gì tiếp) ·
**Huy hiệu** (tôi đã giành được gì). Ba id tab con GIỮ NGUYÊN nên mọi thông báo đã lưu vẫn trúng.

**2. Xoá tab "Lịch sử."** Dài **98.568px = 117 màn hình**, 4.362 con số, **0 nút**, và **0 thông
báo nào trong game trỏ tới nó** (so với `workshop` 8 chỗ · `blueprints` 4 · `relics` 1). Cùng mảng
`history` ấy đã được màn Thống kê đọc và tóm tắt.

**3. Bản vẽ + Xưởng là một vòng lặp bị cắt đôi** — và app đã tự thú: màn Xưởng in hẳn một câu bảo
người chơi *"Đi sang mục Bản vẽ"*. Nay một màn, Xưởng đứng trước (nơi có việc làm ngay).

**4. 310/360 thành tích nay có tiến độ; trước là 0/360.** 86% số mục chỉ là một phép so ngưỡng đơn
`s.<trường> >= <số>` — con số "còn bao nhiêu nữa" nằm sẵn trong dữ liệu từ đầu, chưa ai lấy ra.
Ngưỡng nay là **DỮ LIỆU** (`dem` + `moc`) và `check` được SINH RA từ chính nó. ⚠️ Cách hiển nhiên
(đọc mã nguồn `check` bằng regex) chạy đúng dưới `node` và **hỏng câm trên production** vì Vite rút
gọn `s.sessionsCompleted` thành `s.a`. Nghiệm thu: 360 mục × 62 ảnh chụp = **22.320 phép so, khớp
từng bit**.

**5. Màn Huy hiệu xếp theo ĐỘ KHẨN CẤP.** «Sắp đạt» ba mục gần nhất lên nếp gấp (*"còn 1 ghi chú"*
· *"còn 751 phút"* · *"còn 11 phiên"*); «Chưa đạt» từ y=7.040 lên **y=2.120** và sắp theo tiến độ
(mục gần nhất từng nằm ở y=9.606 = 11,4 màn hình); «Đã đạt» xuống dưới.

**6. Di vật nói thật.** Khủng hoảng chỉ nổ đúng một lần lúc vượt mốc EP ⇒ **5/12 dòng đã lỡ vĩnh
viễn trong ván này**, mà màn hình gộp cả 12 dưới một câu mời "chinh phục để nhận". Nay tách hai
nhóm, hiện PHẦN THƯỞNG THẬT thay cho "???" (bản cũ dùng 2/7 trường và vứt 5), và thêm thẻ đếm
ngược đọc `triggerEP` — con số ấy trước đây được **0 component** đọc.

**7. Kỹ năng thôi nói dối về giá.** Ô giá in giá LẺ trong khi phải mua cả chuỗi tiên quyết:
**21/32 nút (66%) hiện con số thấp hơn giá thật, tệ nhất 2,3 lần** (ghi "8 SP", thật ra 18 SP ≈
254 ngày). Và 21/32 nút khoá không có một chữ nào nói mình làm gì — mô tả bị THAY bằng "Cần mở: X".

**8. Bấm "Hành trang" rơi vào tab CÓ VIỆC**, hỏi cùng hàm nuôi cái chấm đỏ. Không thêm một chữ nào.

**Tương thích:** không migration, không đổi hình dạng dữ liệu lưu, không đổi một công thức thưởng
nào. Ba id tab con giữ nguyên; `collectionTab` cũ được DỊCH chứ không bỏ qua.

**Ghi nợ cho Đàm quyết:** `TECH_DEBT #96` — tiến hoá di vật là **cơ chế chết** (`evolveRelic` tiêu
tinh luyện của kỷ ĐÃ QUA, mà tinh luyện chỉ rơi vào kỷ đang chơi ⇒ 3/3 nút "Chưa đủ tài nguyên",
vĩnh viễn). Mọi lối ra đều là đổi luật KINH TẾ.

**Cổng:** lint sạch · build xanh · **1484 bài (# skipped 1) · 0 đỏ** (trước vòng: 1453).
33 bài mới, tất cả đã thử-cho-đỏ.

---

## 2026-09-01 (vòng 23) — Hứng thú hơn, hệ thống đơn giản hơn, **KHÔNG lạm phát thông tin**

**Mục đích:** cùng mục tiêu vòng 22, cộng thêm một mệnh lệnh mới của Đàm — *"nhưng không bị lạm
phát thông tin"*. Mệnh lệnh ấy đảo ngược phản xạ mặc định: câu trả lời phải đến từ phép **TRỪ**
(xoá · gộp), không từ việc thêm huy hiệu và thêm chữ. Chín việc; **không việc nào thêm một khái
niệm mới**, và toàn vòng ròng lại là **−242 dòng** mã (27 file, +1.006 / −1.248).

**Phạm vi:** tầng hiển thị + hai tác dụng phụ âm thanh. **Không đổi một luật tính thưởng nào**,
không đụng `completeFocusSession`, không thêm trường nào vào store, không đụng Thành Phố.

**HAI LỖI THẬT ĐANG CHẠY TRÊN PRODUCTION đã được vá:**

**1. Chồng thẻ thưởng che TRỌN thanh điều hướng sau MỖI phiên.** Thanh nav nằm ở y=774–832, còn
`bottom-3` đặt đáy chồng thẻ đúng ở 832 với `z-[48] > z-40`; mỗi thẻ là một `<button>` có
`pointer-events-auto` ⇒ chạm bất kỳ nút nào trong 5 nút đều mở hộp phần thưởng thay vì chuyển tab.
Vá bằng đúng MỘT lớp CSS (`bottom-[calc(env(safe-area-inset-bottom)+82px)]`); đo lại còn 12px hở.

**2. Bước cuối của chuỗi tuần hiện "Đã chốt" và "0%" cạnh nhau.** Hai cột dùng hai công thức cho
cùng một sự thật (`index < chainStepsCompleted` so với `index < chainStepIndex`), mà khi xong chuỗi
thì hai biến ấy lệch nhau đúng 1. Lỗi có ở MỌI độ dài chuỗi và nổ đúng lúc trả thưởng lớn nhất
tuần. Vá hai tầng: **gỡ cột «%»** (nó là hàm của dòng chữ bên trái, cộng thanh tiến độ bên dưới là
ba cách mã hoá một con số) và đưa trạng thái một bước về **một hàm thuần duy nhất**
(`weeklyChainStep.js`) — ba trạng thái loại trừ nhau, nên mâu thuẫn cũ nay **bất khả thi theo cấu
tạo**, không phải nhờ một cái `if`.

**~860 DÒNG MÃ KHÔNG BAO GIỜ CHẠY ĐƯỢC đã bị xoá — ba kiểu chết, chỉ MỘT kiểu `grep`/lint thấy:**
- *(a) không ai tham chiếu* — `setSurgeChoice` · `addBuildingPassiveResources` · `craftTier`
  (0 nơi gọi toàn repo), kéo theo 2 hàm mồ côi và 1 hằng số.
- *(b) chết vì một `return null` đứng trước* — `FocusIntro` mở đầu bằng
  `if (hasFocusSessionInProgress) return null` mà nó là nơi gọi DUY NHẤT của `getFocusIntroCopy`,
  nên cả nhánh "phiên đang chạy" + `getLiveSessionIntroCopy` + 6 bank câu chưa từng chạy một lần.
  Kho câu chào **39 bank/762 dòng → 3 bank/42 dòng**; **giữ nguyên toàn bộ câu tiêu đề** — đó
  chính là phần "bất ngờ mỗi ngày".
- *(c) chết vì một trường vĩnh viễn `null`* — nhánh `surgeOverride` trong `gameMath.js`.

`src/App.jsx` **3.006 → 2.176 dòng**; `gameStore.js` 6.230 → 6.123.

**CHỮ NÓI LẠI CHỮ — bảy màn hình được dọn (mọi con số đo bằng `shot.mjs`, không ước lượng):**
- **Thành tích: 19.059 → 11.739px (−38,4%)** — 48 hộp "ghi chú AI" sinh từ 5 nhánh `if`, tức 48
  bản sao của 5 câu. Câu theo NHÓM vẫn còn, nhưng in MỘT LẦN dưới hàng lọc.
- **Tập trung** — bỏ phụ đề nói lại "Phiên 0/5 hôm nay" ở cách đó 338px; bỏ chuỗi `0/4` khi chu kỳ
  chưa chạy; bỏ viên `×4` (cả 4 preset đều khai `longBreakAfterN: 4` nên trục ấy không phân biệt
  được gì — viết thành điều kiện HỎI THẲNG BẢNG, ngày nào có preset khác thì viên tự hiện lại).
- **Bản vẽ: 2.832 → 2.745px** — ba cái tên cho một màn trong 83px, một cái bằng tiếng Anh.
- **Xưởng: 2.559 → 2.455px** — 3 chip tóm tắt tên đặc quyền đã in nguyên văn trên chính thẻ sinh
  ra nó, cộng một câu luật CHUNG in 4 lần một màn (nay in một lần dưới tiêu đề).
- **Di vật** — 15 chữ "Khoá" trong một danh sách dựng bằng `locked.map(...)`, tức khoá theo cấu
  tạo. ⚠️ **ĐÃ BÁC** đề nghị thay 15 dòng bằng một dòng tổng: mỗi dòng mang một danh từ riêng
  ("??? từ Kỷ Băng Hà") trả lời đúng câu *"cái này rơi ở đâu"*.
- **Cài đặt** — đổi **174 ký tự tả tiếng bằng lời** lấy một cú nghe thử.
- Lịch sử phiên: chip `×N.N` thành đường lui (nó lặp lại bậc ngay bên cạnh); 'JP'/'RF'/'PM' → 🎰/💎/🍅.

**CHỒNG THẺ SAU PHIÊN — cắt chỗ LẶP, giữ chỗ VUI.** Cắt hai nguồn đã có kênh bền VÀ lặp: `rank`
(cùng sự kiện đã đẩy vào chuông) và `mission` (xong gần như mỗi ngày; tab "Nhiệm vụ" là nút 2/5 và
hiện tiến độ sống). **Giữ** `weekly` (một nhịp MỖI TUẦN là thứ đối lập với lạm phát thông tin —
đổi ý sau khi đọc chính bài test của nó) và `achievement` (cái chấm 6px trả lời "có việc", nó
không phải một lời chúc mừng). Ca thường ngày: **2–3 thẻ → 1–2 thẻ**.

**BA KHOẢNH KHẮC CÂM NAY CÓ TIẾNG — dopamine tốn 0 chữ:**
- **chọn gói âm thanh = nghe thử luôn** (gọi SAU `setPack`, nếu không sẽ nghe tiếng gói CŨ);
- **vào nghỉ có tiếng** (`playBreakStart` — 0 nơi gọi từ khi viết ra; đặt ở STORE và NGOÀI
  `set(...)`, vì hàm cập nhật zustand có thể chạy hai lần);
- **năm nút thanh điều hướng nhúc nhích khi bấm** (`usePressMotion()` — tự im khi bật "Giảm chuyển
  động").
Cộng một cổng mới `soundReach.test.js`: mọi hàm `play*` phải có ít nhất một nơi gọi; danh sách
miễn trừ là `assert.deepEqual` nên **tường minh và đếm được** (đúng một mục: `playTick`).

**MÀN TẬP TRUNG — biên an toàn 6px → 45px.** Màn này đã để nút chính chui xuống dưới thanh điều
hướng HAI lần (vòng 19, vòng 20). Nút phụ «Toàn màn hình» chiếm 112/308px và vì nhãn hai chữ xuống
dòng nên chính nó quyết định chiều cao 59px của cả hàng; gỡ ở nhánh CHỜ (giữ ở ĐANG CHẠY và TẠM
DỪNG). Nút chính **188×59 → 308×42**; biên tới thanh nav 32 → **71px** hôm nay, ~6 → **45px** ở
tiêu đề dài nhất (63 ký tự = 3 dòng).

**Tương thích:** không có migration. Không đổi hình dạng dữ liệu lưu, không đổi một công thức
thưởng nào; mọi thứ đã kiếm được giữ nguyên.

**HAI VIỆC GIÁ TRỊ CAO ĐÃ TỪ CHỐI LÀM và ghi lại cho Đàm quyết** (`TECH_DEBT #94`, `#95`):
- **#94** — `BREAK_START_DELAY_MS` chờ 3,2 giây ở **~82%** số phiên không còn lễ mừng nào để che
  (31,4 phút trong 180 ngày). Tiền đề của hằng số ấy chết do HAI bản vá ở chỗ khác. Chưa sửa vì nó
  đụng thẳng luồng tự-vào-nghỉ — sai một lần là **âm thầm ăn bớt giờ nghỉ thật** — và khoảnh khắc
  ấy KHÔNG chụp ảnh kiểm được trên bản dev.
- **#95** — xây một công trình phải qua **BA cổng tiền tệ**, cả ba đều là hàm của số phút. Kho thô
  thừa **14 lần** nhu cầu. Gộp hay bỏ một loại tiền là đổi luật KINH TẾ, không phải đổi hiển thị.

**Nguyên tắc an toàn giữ nguyên từ vòng 22:** *đơn giản hoá thứ Đàm THẤY và CẢM, đừng xoá thứ Đàm
đã KIẾM ĐƯỢC.*

**Cổng:** lint sạch · build xanh · **1453 bài (# skipped 1) · 0 đỏ** (trước vòng: 1431).
22 bài mới, tất cả đã thử-cho-đỏ.

---

## 2026-09-01 (vòng 22) — Hứng thú hơn, hệ thống ĐƠN GIẢN hơn

**Mục đích:** nâng tỉ lệ *hứng thú ÷ độ phức tạp*. Nguyên tắc an toàn của cả vòng: **đơn giản hoá
thứ Đàm THẤY và CẢM, đừng xoá thứ Đàm đã KIẾM ĐƯỢC.** Bảy việc; không việc nào thêm một khái niệm
mới cho người chơi, và ba việc là XOÁ hoặc HẠ.

**Phạm vi:** chỉ tầng hiển thị + một bảng giá. **Không đổi một luật tính thưởng nào**, không đụng
`completeFocusSession`, không thêm trường nào vào store, không dùng localStorage mới.

**1. Cây kỹ năng: 336 SP → 138 SP.** 36 nút, giá theo hạng 3/7/14/22 → **2/3/5/8**. Ở nhịp
~80 SP/năm thì mở trọn cây đi từ **15,9 năm xuống ~1,7 năm**. Cây cũ mua được +5,1% XP trong khi
chỉ cần kéo dài phiên đã cho +103% — tức nhánh tiến trình này gần như không đáng theo.

**2. Sự kiện của phiên lên MẶT thẻ tổng kết.** 63% số phiên sinh một sự kiện có tên, icon và câu
chuyện riêng (+15–30% XP), nhưng nó chỉ được vẽ bên trong `LootDropModal` — hộp thoại ấy sau
ADR-060 chỉ tự mở khi LÊN KỶ, tức **1,2%** số phiên. ~358 câu chuyện đã tính, đã cộng XP, rồi bị
xoá không ai thấy; thẻ thì nói "🎁 Phiên đã xong" ở cả 579 phiên.

**3. Lễ mừng thành phố chỉ chạy khi có công trình MỚI.** Trước đó nó chạy 3,2 giây sau MỌI phiên
để khoe một dòng chữ vốn luôn hiện sẵn trên màn hình — **30,9 phút chờ trong 579 phiên**.

**4. 513 biểu tượng vẽ tay lên được màn hình.** Dữ liệu đã có sẵn biểu tượng cho 360 thành tích,
75 bản vẽ, 36 nút kỹ năng, 15 di vật, 14 nhóm, 7 cộng hưởng, 6 loại việc — nhưng mọi màn sưu tập
hiện ký hiệu 2 chữ cái ("NH" · "VC" · "XĐ" · "RL"). `getGlyph`/`hasGlyphIcon` (`utils/labelMark.js`)
dùng biểu tượng khi có, rơi về ký hiệu tắt khi không (loại việc Đàm tự tạo ghi `icon: ''`).
`ACHIEVEMENT_TIERS` là bảng duy nhất thiếu `icon` — đã thêm.

**5. Huy hiệu hệ số gọi tên vách KẾ TIẾP.** Bản cũ chỉ nói được "còn N phút để ×1.3" rồi câm ở
**75,2%** số phiên, mà im đúng khúc đáng nói nhất: **117 phiên** dừng trong 45–59 phút, chỉ còn
1–15 phút nữa là chạm ×2.0 (bậc nhảy lớn nhất thang, +54%).

**6. Mốc chuỗi 7/14/30 nay có thẻ ăn mừng + tiếng chuông.** `soundEngine.playMilestone()` xưa nay
có **0 nơi gọi**. Chống lặp không cần state mới: `streakMissionXP` đã là tín hiệu một-lần-mỗi-ngày,
và ngưỡng 7 của nó nằm đúng dưới cả ba mốc.

**7. Rương Lớn và tinh luyện được gọi tên trên thẻ** (10,1% và 28,8% số phiên); và bỏ dòng
"Không có jackpot." khỏi bản tổng kết tuần — jackpot đòi một kỹ năng Đàm chưa mở, tức nó **không
thể xảy ra**, nên đó là bản tin tuần nào cũng giống tuần nào về một việc không có thật.

**Tương thích:** hoàn toàn ngược tương thích. Hạ giá SP là phép cộng thêm thuần (kỹ năng đã mở giữ
nguyên, SP đã tiêu không đòi lại). **KHÔNG có migration nào cần chạy.**

---

---

## 2026-08-30 (vòng 21) — Màn Thống kê: một bộ lọc thời gian, và dải "Điều đáng chú ý"

**Vấn đề 1 — ba bộ lọc thời gian, ba mặc định.** Tab Tổng Quan mặc định "tuần", tab Tập Trung và
Phân Loại mặc định "tất cả", và mỗi tab khai bảng kỳ riêng. Bấm sang tab khác là **cửa sổ thời
gian âm thầm đổi**, không có gì báo — hai con số cách nhau một cú bấm đang nói về hai khoảng thời
gian khác nhau.

**Vấn đề 2 — một lỗi NHÃN đã ship.** Tổng Quan tính cửa sổ bằng `now − 7 ngày` rồi dán nhãn *"tuần
này"*. Vào thứ Tư, "tuần này" là T2→T4 còn "7 ngày gần nhất" là T5 tuần trước→T4. Tệ hơn: biểu đồ
cột **ngay bên dưới** lại dựng theo tuần LỊCH, nên ô số tổng và bộ cột dưới nó đo hai khoảng khác
nhau mà mang cùng một nhãn.

**Vấn đề 3 — kho báu bỏ quên.** `gameMath.js` đã có sẵn ~10 phép phân tích ĐÃ VIẾT, ĐÃ TEST, ĐÃ
GÁC CỠ MẪU (giờ vàng · hay bỏ giữa chừng · phiên khuya kém hơn · loại việc bị bỏ bê · quay lại sau
ngày nghỉ · phiên liền mạch…). Chúng chỉ chảy vào AI Coach — tức cần mạng, tốn tiền Gemini, có thể
lỗi. Màn Thống kê không hiện một cái nào.

**Đã đổi.** Thêm `engine/statsPeriod.js` làm **nguồn kỳ duy nhất** (6 kỳ, nghĩa LỊCH) và nâng
trạng thái kỳ lên component cha ⇒ ba tab **không thể** lệch nhau nữa. Kỳ liền trước nay là kỳ
trước theo lịch (tuần trước), không phải "lùi thêm N ngày". Nhịp "/ ngày" chia cho số ngày ĐÃ TRÔI
QUA trong kỳ. Thêm `engine/statsInsights.js` + dải **"Điều đáng chú ý"** ở tab Tổng Quan — chỉ GỌI
hàm đã có, không chế công thức mới; mọi phần trăm kèm cỡ mẫu, và nói tương quan chứ không nói nhân
quả (cả hai đều có test canh). Dải này đọc TOÀN BỘ lịch sử chứ không theo kỳ đang chọn, và màn
hình **nói rõ điều đó**.

**Dọn kèm.** Gỡ 3 props chết, 3 hằng số chết, 1 hàm chết 30 dòng, 2 helper trùng lặp với engine,
4 import thời gian thừa.

**Dọn code chết.** Quét khai báo cấp cao nhất nào chỉ xuất hiện đúng một lần: **4 component chết**
(`AreaChart` 600 dòng · `OverviewHeroMetric` · `WeekPulseList` · `TrendBadge`) + rác dây chuyền chỉ
sống nhờ chúng (6 hàm, 7 hằng số, 2 import). `StatsDashboard.jsx`: **4.901 → 3.941 dòng (−19,6%)**.
⚠️ Gói tải không nhỏ đi (bundler vốn đã tree-shake được) — cái được là **khả năng bảo trì**, không
phải tốc độ.

**Ảnh hưởng / tương thích.** Không đụng dữ liệu đã lưu, không migration, không đổi store. Chỉ là
cách màn Thống kê ĐỌC lịch sử. Mặc định kỳ đổi từ "tất cả" sang **"Tuần Này"** ở hai tab Tập Trung
và Phân Loại — có chủ đích: một màn thống kê mở ra ở "toàn bộ lịch sử" thì con số đầu tiên người
dùng thấy gần như không đổi theo ngày, nên nó không nói được gì về hôm nay.

**Test.** +40 bài (20 kỳ · 12 insight · 8 canh mã nguồn) ⇒ 1371 đạt · 1 bỏ qua · 0 hỏng. Chi tiết
quyết định: `ARCHITECTURE_DECISIONS.md` ADR-067. Nợ mới ghi ở `TECH_DEBT.md` #92.
## 2026-08-30 (vòng 20) — Tối giản toàn app bằng fan-out soi song song

**Cách làm:** 6 nhánh CHỈ ĐỌC soi song song 9 màn ở khung 390px thật (mỗi nhánh một màn, ảnh ra
tên riêng, mọi phát hiện phải kèm toạ độ Y + chiều cao px — *không số đo = không tính*), rồi
chấm chéo và **sửa TUẦN TỰ**, mỗi việc một commit. 9 việc.

**1. Nút chính hết bị thanh tab che.** Đo lại trên tài khoản đã chơi 6 tháng: nút "Điền mục tiêu →"
y=773…815 còn thanh tab NỔI y=774, nền ĐỤC hoàn toàn ⇒ **lòi ra 1px**. Vòng 19 đã vá nhưng chỉ đủ
cho NGÀY CHÀO NGẮN. Ba nguyên nhân: cụm ba dòng nhắc cùng nổ (84px) · khối chào dài 2 hoặc 3 dòng
tuỳ biến thể copy (chênh 26px) · 32px khoảng trắng đỉnh cột giữa. Vá: `FocusNextAction` nhập vào bộ
chọn `focusMomentPick` thành **nguồn thứ năm** (còn đúng HAI dòng, trần xấu nhất khoá bằng CẤU
TRÚC) · trần vòng đồng hồ `64vw → 58vw` (226px ở 390px, máy bàn không đổi) · `pt-8 → pt-4` ở khổ
điện thoại. **Kết quả: nút cách thanh tab 53px** (ngày 2 dòng) / 27px (ngày 3 dòng).

**2. Thẻ "Chuẩn bị phiên" nói một điều năm lần → giữ ba.** Gỡ hai đoạn văn (80px + 59px) chỉ diễn
đạt lại tên của chính cái ô ngay dưới chúng; giữ nhãn "Bắt buộc", placeholder có VÍ DỤ, và dòng
gợi ý ở đúng chỗ sắp gõ. Cùng lượt gỡ "Chọn mode…" (41px) và "Thời lượng countdown…" (16px).
**Trang màn Tập trung 2.920 → 2.660px.**

**3. Tab Kỹ năng thôi dựng lại nguyên tab Nhiệm vụ ở iPhone.** `SkillTree` render `<DailyMissions/>`
làm cột ngữ cảnh — đúng ở màn rộng (thanh bên desktop không có mục "Nhiệm vụ"), nhưng ở 390px hai
cột xếp chồng nên nó thành **1.097px chắn ngang**, mà đúng thẻ ấy LÀ toàn bộ tab "Nhiệm vụ".
**Trang Kỹ năng 3.145 → 2.032px (−35%)**, máy bàn không đổi.

**4. Ô "Chuỗi" có mẫu số: `1` → `1 / 7`.** Mốc chuỗi kế tiếp đã tính sẵn nhưng hai chỗ dùng nó đều
không tới được iPhone. Không tốn thêm một điểm ảnh chiều cao (đã đo).

**5. Kỹ năng: sáu nhánh thôi giống hệt nhau.** Nhãn tên nhánh là `hidden sm:inline` (sm=640px) nên
ở 390px **5/6 nhánh cùng ghi "0/6" ⇒ năm nút trông y hệt nhau**. Và "THÀNH TỰU GẦN ĐÂY" chỉ hiện
"VC"/"DS"/"C5", tên thật nằm trong `title` — tức **chỉ con chuột mới đọc được**.

**6. Hai chỗ chữ bị cắt mà không cổng nào kêu.** `RewardCard`: mô tả được **144px cho 370px chữ
(61% ngoài màn hình)** vì `min-w-[9rem]` luôn vừa cạnh huy hiệu bậc nên không bao giờ wrap → tách
hai hàng, mô tả trọn bề ngang (131 → 272px, 2 dòng). `StatsDashboard`: 8 grid khai `lg:grid-cols-…`
mà thiếu `grid-cols-1` ⇒ track `auto` phình theo lịch nhiệt `min-w-[560px]`, kéo tiêu đề và câu dẫn
ra 560px trên máy 390px.

**7. Nhãn tiếng Anh còn sót → quét lại còn 0.** "Full Screen"×3 · "Overclock" · "stake" ·
"Stopwatch"/"Flowtime" · "OFF/RAIN/WIND/FOREST/CAFE/WAVES/FIRE" · "CL/NT/SW/MN" · "JSON"×3.

**8. Thành tích: gỡ sáu chỗ nói-lần-hai. 14.254 → 12.633px.** Trong đó nhãn "Ghi chú tiến trình"
lặp ở CẢ 48 thẻ, và chip "#146" `shrink-0` ép tiêu đề vỡ hai dòng.

**9. "Đạt mục tiêu 0%" khi chưa phiên nào đặt mục tiêu.** Hai tình huống ngược hẳn nhau ra cùng
một con số; nay in "—" kèm "chưa phiên nào đặt mục tiêu". Không đụng tầng tính.

**Cổng:** `npm test` 1355 bài xanh (+ lượt cross 3 bài) · lint sạch · build xanh. Ba phép phá
thử-cho-đỏ cho `focusNextActionWiring.test.js` (gỡ nhánh · gỡ `onNavigate` · gỡ lời gọi hook) đều
đỏ, khôi phục xanh. `timerFold.test.js` nay khoá QUAN HỆ (trần ≤ 58vw, hai vế phải cùng trần) thay
vì khoá con số 64.

**Tương thích:** không đổi dữ liệu, không migration, không đụng tập Thành Phố.

## 2026-08-30 (vòng 19) — Nút Bắt đầu lần đầu nằm TRÊN nếp gấp

**Đo trước khi sửa** (khung 390px thật): nút chính của cả app nằm ở **y=779..822** trong khi thanh
tab **NỔI** bắt đầu ở **y=774** ⇒ **nút bị thanh tab che**, và Đàm phải cuộn mới bấm được đúng thứ
anh mở app ra để bấm. Mỗi phiên, mỗi ngày. Không cổng nào bắt được: lint sạch, test xanh, build
xanh, ảnh chụp trông vẫn "đẹp" — chỉ có một nút nằm sau một thanh nổi.

**Hai bước, tổng 92px.**
1. **Thu khoảng trắng quanh đồng hồ (36px)** — `mt-5` → `mt-2` ở khối vòng, `mt-4` → `mt-2` và
   `min-h-[68px]` → `min-h-[52px]` ở hàng nút. Không đụng gì tới hình.
2. **Trần theo bề ngang cho vòng đồng hồ (48px)** — `min(298px, 64vw)`. ⚠️ **Là `min()` chứ không
   phải một hằng số nhỏ hơn**: hằng số thì thu đồng hồ ở MỌI khổ màn hình, kể cả nơi không hề thiếu
   chỗ. Trần này chỉ cắn khi bề ngang < 466px. Đo lại: **390px → 250px** (vẫn 64% bề ngang máy, vẫn
   là thứ to nhất màn hình) · **1280px → 411px, không đổi một điểm ảnh nào**.

**Kết quả:** nút ở **y=731..773**, thanh tab bắt đầu ở 774. Cả vòng lặp nay nằm trọn MỘT màn: lời
chào → đang xây gì → phần thưởng tuần → hệ số nhân → đồng hồ → nút bắt đầu.

⚠️ **Vế dễ quên nhất, và quên thì không được một điểm ảnh nào:** `minHeight` của khối cha là chỗ
**giữ sẵn** chiều cao — thu mỗi cái vòng mà để nguyên nó thì khoảng trống vẫn bị giữ y như cũ. Có
test canh (`timerFold.test.js`, 3 bài, đã thử-cho-đỏ), vì chỗ này rất dễ trôi lại: chỉ cần một phase
sau thêm một dòng vào cột giữa hoặc nới lại một khoảng trắng là nút chui xuống.

**Ảnh hưởng.** Chỉ giao diện, chỉ ở khổ hẹp. Không migration.

---

## 2026-08-30 (vòng 18) — Ba dòng cột mốc gộp thành MỘT dòng biết chọn

**Rủi ro tôi tự tạo ra trong chính phiên này, và đây là bản vá.** Vòng 10 và 15 thêm hai dòng mới
vào cột giữa màn Tập trung. Cộng với những dòng có sẵn, ở đó thành **năm** component độc lập, mỗi
cái tự quyết có hiện hay không: `FocusCityTease` · `FocusNextAction` · `FocusStageCountdown` ·
`FocusStreakMilestone` · `FocusWeeklyReportTease`. Ba cái gác sau **độc lập nhau** (≤12 phiên tới
hết chặng · ≤3 ngày tới mốc chuỗi · chưa xem tổng kết tuần) ⇒ về mặt cấu trúc cả năm CÓ THỂ cùng
nổ (~130px), đủ đẩy đồng hồ xuống dưới nếp gấp — đúng cái vòng 8–9 vừa mất công kéo lên. Ở đây
không có chỗ cho lý lẽ *"hiếm nên chắc không sao"*: ba điều kiện độc lập thì sớm muộn cũng trùng
nhau một ngày, và ngày đó không ai biết trước.

**Đã gộp** ba dòng cột-mốc thành `FocusMoment` — **đúng một dòng**, chọn ra khoảnh khắc đáng nói
nhất. Trần xấu nhất từ **5 dòng xuống 3**.

**Và nó đơn giản hơn thật, không chỉ an toàn hơn:** ba dòng ấy trả lời CÙNG một câu — *bấm Bắt đầu
bây giờ thì được gì* — chỉ khác thang thời gian. Ba câu trả lời cùng lúc cho một câu hỏi là nhiễu,
không phải nhiều thông tin.

**Thứ tự ưu tiên, mỗi bậc một lý do:** ăn mừng vừa qua mốc chặng (ăn mừng thì phải NGAY, để lỡ là
mất luôn) → tổng kết tuần chưa xem (phần thưởng cả tuần, mỗi tuần một lần) → sắp chạm mốc chuỗi
(thứ mất đi thì không lấy lại được) → đếm ngược tới hết chặng (đích xa nhất, nhường trước).

⚠️ **KHÔNG tái dùng ba component cũ rồi chỉ chọn cái nào được render** — làm thế thì mỗi hook bị gọi
HAI lần, và với `useStageCountdown` điều đó **sai thật** chứ không chỉ phí: nó giữ một `useState`
cho dấu "đã ăn mừng", nên hai bản sao có hai state riêng — bấm tắt ở con thì bản ở cha không hay
biết và vẫn tiếp tục chọn nhánh ăn mừng.

**Test.** `focusMoment.test.js` (9 bài) chấm thẳng luật chọn thuần, gồm một gác cấu trúc đòi **đúng
MỘT** dòng khoảnh khắc trong `App.jsx` — cái sai nó ngăn là một phiên sau "thêm một dòng nữa cho
tiện" rồi dựng lại đúng đống năm dòng vừa gỡ. Ba bài cũ trỏ vào component đã xoá được **sửa phép đo,
giữ nguyên lời hứa**, không xoá.

**Ảnh hưởng.** Chỉ giao diện. Không migration.

---

## 2026-08-30 (vòng 17) — Công cụ soi giao diện lần đầu bấm được nút chỉ-có-biểu-tượng

**Lỗi công cụ, và nó giấu cả một họ màn hình.** `shot.mjs --click` khớp nút bằng **chữ hiển thị**.
Mọi nút chỉ-có-biểu-tượng đều có `textContent` rỗng — chuông thông báo, nút ⚙, nút đóng "×" — nên
chúng **không soi được bằng bất kỳ cách nào**. Hậu quả cụ thể: **Trung tâm thông báo** nằm trên MỌI
màn hình của app và chưa lần nào được chụp. Cùng hình dạng với lỗi fixture ở vòng 11 (soi mãi một
màn rỗng rồi tưởng đó là màn thật) — chỉ khác là ở đây thứ giấu màn hình không phải dữ liệu mà là
cách chọn phần tử.

**Đã vá.** `--click` nay thử **chữ hiển thị trước** (chính xác hơn, ít bất ngờ hơn) rồi mới tới
`aria-label` / `title`. Danh sách gợi ý khi bấm trượt cũng kể luôn nhãn trợ năng — không có vế đó
thì người đọc thông báo lỗi sẽ tưởng nút mình cần không tồn tại, trong khi nó chỉ không có chữ.
Khoá bằng `scripts/shotSource.test.js` (4 bài, đã thử-cho-đỏ): file parse được · có nhánh nhãn trợ
năng · danh sách gợi ý kể nhãn ấy · **thứ tự ưu tiên** không được đảo.

**Nhân tiện, dọn nốt một nhãn dán.** "TRUNG TÂM" đứng trên "Thông báo" trong chính panel vừa soi
được lần đầu — panel bật ra từ nút chuông vừa bấm, và dòng ngay dưới đã ghi "Thông báo".

**Ảnh hưởng.** `shot.mjs` là công cụ dev, không vào bundle. Thay đổi giao diện chỉ một dòng nhãn.

---

## 2026-08-30 (vòng 16) — Nhật Ký và Ghi Chú: gỡ ~800px văn giải thích mỗi màn

Hai tab của màn Thống kê mở đầu bằng cùng một khối bốn lớp, và cả bốn đều nói về một màn hình mà
người đọc **đang đứng trong đó**: nhãn "LƯU TRỮ" (nhắc lại nút tab đang sáng) · một tiêu đề 1,9rem
xuống hai dòng ở khung 390px · một đoạn kể rằng nhật ký thì lưu các phiên / kho ghi chú thì giữ ghi
chú · một đoạn về **cách xoá**.

Đoạn cuối là thông tin thật và quan trọng — nhưng đặt sai chỗ: mỗi phiên (và mỗi ghi chú) **đã có
sẵn một bước xác nhận riêng** ngay tại nút xoá của nó, với nhãn ghi rõ *"Xoá + hoàn tác"* /
*"Xoá phiên"*. Nói luật hoàn tác ở ĐẦU MÀN là nói trước cho người chưa định xoá gì, mỗi lần mở, mãi
mãi; nói ở NÚT là nói đúng lúc người ta sắp bấm.

**Kết quả:** ~800px mỗi tab. Nhật Ký nay hiện ngay bốn ô số thật (624 phiên · 99 có ghi chú · 36 đã
tự chấm · 36 phiên huỷ) cộng bộ lọc danh mục, và phiên đầu tiên lên khỏi vùng phải cuộn một màn
rưỡi. Cùng lượt, gỡ nhãn "TẬP TRUNG" ở tab Tập Trung — nó là ĐÚNG chữ trên nút tab đang sáng cách
đó vài chục điểm ảnh, trong khi tiêu đề ngay dưới thì đổi theo số liệu.

**Ảnh hưởng.** Chỉ giao diện. Không migration.

---

## 2026-08-30 (vòng 15) — Báo cáo tuần lần đầu tự mời: một dòng ở màn Tập trung

**Vấn đề.** `WeeklyReportModal` là **màn đầy dopamine nhất của cả app** — một con số to ("15g14p"),
một mức tăng ("+19% so với tuần trước"), một điểm hạng ("A · Xuất Sắc"), số ngày hoạt động ("6/7").
Nó là phần thưởng cho cả một tuần làm việc. Vậy mà trên iPhone, tín hiệu DUY NHẤT báo có nó là **một
chấm tròn 6px nằm BÊN TRONG một menu phải bấm mới mở ra** ("Thêm" → "Báo cáo tuần"). Phần thưởng lớn
nhất được thông báo bằng thứ nhỏ nhất, ở chỗ khuất nhất.

**Đã thêm.** `FocusWeeklyReportTease` — một dòng ở cột giữa màn Tập trung, chữ đậm màu nhấn kèm 🏆:
*"Tổng kết tuần trước đã xong — xem thử"*. Bấm là mở thẳng báo cáo. Ẩn khi phiên đang chạy (cùng
luật `FocusNextAction`: đây là lời mời đi chỗ khác). Im lặng khi đã xem — mỗi tuần nhiều nhất một
lần.

**KHÔNG tính lại con số nào, và đó là chủ ý.** Điểm hạng và các số liệu tuần sống trong
`WeeklyReportModal` dưới dạng hằng số cấp module; kéo chúng ra để in sẵn lên dòng chữ sẽ hoặc phải
chép lại công thức (đúng bẫy *"một luật hai công thức"* dự án đã trả giá nhiều lần), hoặc phải tách
một module engine mới cho một dòng chữ. Dòng này chỉ làm một việc: **nói rằng CÓ**, rồi mở ra — con
số ở lại đúng chỗ nó đang sống. Có test cấm nó tự tính lại (`GRADES`, `computeWeekStats`, …).

**Ảnh hưởng.** Chỉ giao diện. Không migration.

---

## 2026-08-30 (vòng 14) — Gỡ 11 nhãn tiếng Anh khỏi Cài đặt, sửa một tên công trình bị cắt cụt

**Một lỗi thật ở Xưởng.** Thẻ "Hàng chờ xây dựng" xếp tên công trình chung hàng với hai huy hiệu
(độ hiếm + loại), và **cả hai huy hiệu đều `shrink-0`** ⇒ tên là thứ DUY NHẤT trong hàng có thể bị
bóp. Ở khung 390px "Cảng Biển Lớn" hiện ra thành **"Cảng Biể…"** — thứ trả lời câu *"tôi đang xây
cái gì"* lại là thứ nhường chỗ cho hai cái nhãn phân loại. Không có gì đỏ lên: `truncate` là hành
vi ĐÚNG của CSS, chỉ là nó cắt nhầm thứ. Nay tên có một hàng riêng.

**Cài đặt: 11 nhãn tiếng Anh + 11 vòng tròn trang trí.** Mười một mục mang nhãn `Rhythm` ·
`Atmosphere` · `Signals` · `Pack` · `Alerts` · `Surface` · `Archive` · `Cycle` · `Install` ·
`About` · `Reset` — tiếng Anh trong một app tiếng Việt, mỗi cái đứng ngay trên một tiêu đề tiếng
Việt đã nói rõ hơn ("Rhythm" trên "Bộ hẹn giờ"). Cùng lý do đã gỡ chữ "Workspace". Vòng tròn hai
chữ bên cạnh ("RH", "AT", "SI"…) hoá ra **không phải biểu tượng** mà là `eyebrow.slice(0, 2)` — hai
ký tự đầu của chính chữ tiếng Anh kia; giữ nó lại là giữ cái bóng của thứ vừa bỏ đi.

**Khối mở đầu Cài đặt: ~590px xuống một dòng.** Nhãn "TÙY CHỈNH" + tiêu đề "Cài đặt trải nghiệm tập
trung" cỡ 30–40px (xuống hai dòng ở 390px) + ba dòng văn xuôi kể rằng cài đặt dùng để chỉnh cài
đặt. Giữ tiêu đề ở cỡ nhỏ (trên iPhone Đàm tới đây qua tab "Thêm" nên đó là thứ duy nhất nói anh
đang ở màn nào) và giữ ba chip trạng thái (chúng đổi theo lựa chọn, không phải lời giải thích).
**Kết quả: ba nút chỉnh đầu tiên nay thấy và bấm được ngay, không cần cuộn.**

**Kho báu → Di vật: gỡ thẻ rỗng.** Màn ấy nói "chưa có di vật nào" ở BA chỗ, và câu hướng dẫn của
thẻ rỗng là bản viết lại của câu nằm cách nó chưa tới 60px. Gỡ đi (~500px) thì thứ đầu tiên đập vào
mắt là **danh sách những gì lấy được** thay vì một lời nhắc rằng bạn chưa có gì.

**Ảnh hưởng.** Chỉ giao diện. Không migration.

---

## 2026-08-30 (vòng 13) — Danh sách di vật khoá: 3.000px xuống 700px

**Vấn đề.** Tab Kho báu → Di vật liệt kê 15 di vật chưa mở, mỗi cái một THẺ cao ~200px ⇒ **~3.000px
cuộn** ở khung 390px. Và mỗi thẻ nói đúng một câu như nhau — *"Chinh phục «X» ở chế độ Đương Đầu để
mở khóa"* — trong đó phần duy nhất khác nhau (**tên khủng hoảng**) đã nằm ngay trên tiêu đề của
chính thẻ ấy. Tức mỗi thẻ nói tên ấy hai lần, và cái luật chơi được nói lại mười lăm lần.

**Đã đổi.** Mỗi di vật khoá nay là MỘT DÒNG: `??? từ «tên khủng hoảng»` · `KHOÁ`. Luật chơi **không
mất** — nó đã có sẵn một chỗ để nói ngay đầu màn (*"0/15 — chinh phục Khủng Hoảng Kỷ Nguyên để nhận
buff vĩnh viễn"*); nói một lần ở đầu danh sách là đủ, nói lại ở từng dòng thì nó thôi là hướng dẫn
và thành nhiễu. Ô "ẨN" 48×48 cũng gỡ — mười lăm ô giống hệt nhau không phân biệt được gì, mà chính
chúng ép mỗi thẻ phải cao ít nhất 48px.

**Kết quả:** ~3.000px → ~700px, cả 15 di vật lọt trong **một màn hình**, và danh sách **liếc được**
thay vì phải đọc — nhìn một cái thấy trọn vòng cung khủng hoảng từ Kỷ Băng Hà tới Nổi Dậy AI, thứ
mà bản cũ giấu sau mười lăm lần cuộn.

**Ảnh hưởng.** Chỉ giao diện. Không migration.

---

## 2026-08-30 (vòng 12) — Bỏ số thứ tự trang trí ở tab Thống kê

Năm tab của màn Thống kê mang số thứ tự "01…05" trước nhãn. Ở khung 390px mỗi nút chỉ rộng ~108px,
mà con số chiếm mất phần đầu ⇒ nhãn hai chữ bị đẩy **xuống hai dòng** ("Tổng / Quan", "Tập / Trung",
"Phân / Loại") và cả hàng tab cao gấp đôi. Con số ấy không nói được gì mà cái nhãn chưa nói — không
ai gọi "tab 02", còn thứ tự thì mắt đã đọc ra từ vị trí trái-sang-phải. Gỡ đi: mỗi nhãn về một
dòng, **bốn tab lọt vào khung thay vì ba**, hàng tab thấp đi ~45px.

Cùng lý do đã gỡ chữ "Workspace" khỏi `ShellPane`: một nhãn giống nhau ở mọi nơi thì không phân
biệt được gì, nó chỉ tốn chỗ.

**Ảnh hưởng.** Chỉ giao diện màn Thống kê. Không migration.

---

## 2026-08-30 (vòng 11) — Fixture lần đầu gieo thành tích, và một thẻ nói-lần-hai ở màn Thành tích

**Lỗi công cụ, và nó nằm ngay trong chú thích của chính công cụ.** `scripts/make-fixture.mjs` mở đầu
bằng câu nêu rõ nó sinh ra để chữa cảnh *"0 XP, **0/360 thành tích**, 0 kỹ năng"* — mà nó **chưa bao
giờ gieo một dấu thành tích nào**. Nghĩa là mọi lần soi tab Thành tích bằng fixture đều đang xem màn
hình của NGÀY ĐẦU TIÊN: một thẻ "0 / 360 dấu", một thẻ "Chưa có dấu nào", một thẻ "0·0·0·0·0" — và
không kết luận mỹ thuật nào rút ra từ đó có giá trị. Cùng bài học *"một câu tự trấn an cũng phải
được kiểm như một con số"*, lần này câu ấy nằm trong chú thích của một công cụ đo.

**Vá bằng cách DÙNG LẠI, không viết công thức thứ hai.** Dự án đã có HAI bản dựng ảnh chụp trạng
thái thành tích và chú thích của chúng đã cảnh báo nhau về nguy cơ trôi lệch; thêm bản thứ ba trong
một script là mời đúng cái bẫy ấy. Thay vào đó fixture gọi `inferAchievementUnlockTimes` — nó replay
lịch sử và gọi **chính `achievement.check()` của mã sản phẩm**. Kết quả: **147/360 dấu** cho 588
phiên qua 180 ngày, kèm mốc thời gian mở khoá thật. Sai số đã biết và đã ghi: vài dấu kiểu "mở được
N dấu khác" có thể nổ sớm, vì hàm ấy được đưa cả 360 id làm ứng viên — chấp nhận được với một
fixture dùng để SOI GIAO DIỆN, và tuyệt đối không trích số ở đó vào kết luận cân bằng game.

**Cắt một thẻ nói-lần-hai.** Thẻ "Hiển thị" ở đầu màn Thành tích in *"N đã đạt / M chưa đạt"* — đúng
hai con số mà hai danh sách ngay bên dưới tự in ra làm tiêu đề của chính chúng (*"Đã đạt (N)"* /
*"Chưa đạt (M)"*) — kèm một câu hướng dẫn sử dụng giao diện. Ở khung 390px ba thẻ con ấy **xếp dọc**
(grid chỉ chia 3 cột từ `md:`), nên thẻ thừa chiếm ~130px trước khi thấy một thành tích nào.

**Ảnh hưởng.** Fixture là công cụ dev, không vào bundle. Thay đổi giao diện chỉ ở màn Thành tích.
Không migration.

---

## 2026-08-30 (vòng 10) — Cơ chế thưởng mạnh nhất game lần đầu tới được iPhone

**Vấn đề.** Cột mốc chuỗi — kể cả mốc **"Bền Vững"** cho một **bonus VĨNH VIỄN**, phần thưởng mạnh
nhất trong cả game — đã chạy từ lâu, có test, và được hiện ở `FocusRail`. Nhưng `FocusRail` nằm
trong cột phải `hidden … lg:flex`, tức **iPhone KHÔNG BAO GIỜ thấy** — mà iPhone là thiết bị Đàm
dùng hằng ngày. Một cơ chế đúng, đã trả tiền để làm, mà không tới được người dùng thì bằng không.

**Đã thêm.** `describeStreakMilestone` (`engine/gameMath.js`) → `useStreakMilestone` →
`FocusStreakMilestone.jsx`: **một dòng** ở cột GIỮA màn Tập trung, cạnh ba dòng anh em đã có. Bốn
dòng cùng trả lời một câu — *bấm Bắt đầu bây giờ thì được gì* — ở bốn thang thời gian: phiên này ·
việc kế tiếp · chặng của kỷ · **chuỗi ngày**.

**Gác chặt, im lặng là mặc định.** `STREAK_MILESTONE_NEAR_DAYS = 3`: chỉ mở miệng khi còn ≤3 ngày
tới mốc. Cùng lý do với `STAGE_COUNTDOWN_MAX_SESSIONS = 12` — một cái đích còn rất xa thì **làm nản
chứ không kéo**, và bốn dòng cùng hiện thì đồng hồ lại rơi xuống dưới nếp gấp. Còn 1 ngày thì đổi
giọng (nhịp phần thưởng, màu nhấn, nói "Mai" thay vì "còn 1 ngày") — chỗ dopamine mạnh nhất nằm
ngay trước đích.

**Cách gọi tên có chủ đích:** mốc thường gọi bằng SỐ NGÀY ("mốc chuỗi 14 ngày"), mốc vĩnh viễn gọi
bằng TÊN RIÊNG và nói rõ phần thưởng ("Bền Vững — bonus vĩnh viễn"). Bản đầu ghép thẳng nhãn của
bảng vào câu và ra *"chạm mốc 7 chuỗi"* — đúng dữ liệu, sai tiếng Việt.

**Khoá bằng test** (`streakMilestoneLine.test.js`, 7 bài): im khi chưa có chuỗi · im khi còn xa ·
đúng số ngày ở mọi mốc · **cắt đúng ở biên** (đúng trần thì nói, quá một ngày thì im — chỗ một bản
vá "nới cho chắc" sẽ đi qua mà không ai thấy) · đổi giọng ở ngày cuối · cách gọi tên · và một bài
đọc `App.jsx` đòi component **thật sự được gắn vào cột giữa** — đúng loại hỏng đã để cơ chế này
nằm ngoài tầm mắt suốt nhiều tháng.

**Ảnh hưởng.** Chỉ giao diện; không đụng kinh tế game, không đụng Thành Phố. Không migration.

---

## 2026-08-30 (vòng 9) — Nút chính hết là ngõ cụt: "Cần điền mục tiêu" → "Điền mục tiêu →"

**Vấn đề, đo bằng ảnh chụp khung 390px THẬT.** Nút quan trọng nhất của cả app, khi chưa có mục tiêu,
là một nút **`disabled`** ghi *"Cần điền mục tiêu"*. Một nút `disabled` KHÔNG nhận sự kiện bấm ⇒ nó
nói ra điều đang thiếu mà **không nói thiếu ở đâu**, và bấm vào thì không có gì xảy ra. Ô mục tiêu
thật nằm ở **y≈1400 trên một trang cao 3035px** — Đàm phải cuộn qua đồng hồ, qua "Chu kỳ nghỉ", qua
"Ghi chú phiên" mới thấy, gõ, rồi cuộn ngược lên mới bấm được. **Mỗi phiên một lần, mãi mãi, ngay
tại hành động quan trọng nhất của app.**

**Đã đổi.** Lúc chưa có mục tiêu, chỗ ấy nay là một nút KHÁC — bấm được, `variant="soft"`, nhãn
*"Điền mục tiêu →"* — cuộn tới ô mục tiêu rồi đặt luôn con trỏ vào đó. Cộng với chip gợi ý mục tiêu
đã có từ vòng 6, chuỗi thao tác đi từ *thấy-nút-chết → cuộn → gõ 10 ký tự → cuộn ngược* xuống còn
**bấm → bấm một chip → bấm Bắt đầu**.

**KHÔNG nới luật.** Vẫn phải đủ `SESSION_GOAL_MIN_CHARS` ký tự mới bắt đầu được phiên — cổng ấy có
chủ đích (phiên có đích thì mới chấm được, AI Coach đọc nó) và còn nguyên. Thứ bị gỡ là ma sát ĐI
LẠI. Nút cũng cố ý KHÔNG mang `variant="primary"`: nó không bắt đầu phiên, mà một nút trông như nút
chính lại làm việc khác là cách nhanh nhất để mất lòng tin vào nút.

**Khoá lại bằng test** (`focusGoalJump.test.js`, 5 bài, đã thử-cho-đỏ): cuộn-trước-focus-sau (trên
iOS bàn phím che nửa dưới) · **CẢ HAI** ô nhập mục tiêu phải mang mốc chung `data-session-goal-field`
(màn Tập trung dựng hai ô ở hai bố cục; quên một nhánh thì nút dẫn đường lặng lẽ không tới đâu) ·
nút không được `disabled` trở lại · cổng đủ-ký-tự còn nguyên.

**Ảnh hưởng.** Chỉ giao diện màn Tập trung; không đụng engine, kinh tế game, hay Thành Phố.
**Tương thích:** không có migration.

---

## 2026-08-30 — Tối giản vòng 8: gỡ bốn chỗ "nói lần thứ hai", và sửa ba câu bị cắt cụt

**Mục đích.** Đàm: *"đơn giản hoá, tối giản hoá và làm hứng thú hơn"*, kèm một ràng buộc mới:
**không đụng tới những gì thuộc Thành Phố**. Nên vòng này làm ở bốn màn còn lại.

**Đo trước khi cắt** (ảnh chụp khung 390px THẬT, `shot.mjs --phone`): ở màn **Tập trung** — màn Đàm
mở nhiều nhất — đồng hồ `25:00` nằm ở y≈1325 trên một trang cao 1690, tức **thứ duy nhất Đàm mở app
để làm đang nằm dưới nếp gấp**, và nút bắt đầu bị thanh tab che hẳn. Phía trên nó là 425px thanh đầu
cộng 280px khối chào, trong đó "hôm nay làm 0 phiên" được nói **ba lần**.

**Đã đổi.**
- **Màn Tập trung** — gỡ dòng nhãn "NGÀY HÔM NAY · CHỦ NHẬT" (câu ngay dưới nó mở bằng "Chào buổi
  tối", đã nói xong cả "hôm nay" lẫn "lúc nào trong ngày") và gỡ câu "Bạn chưa chốt phiên nào trong
  hôm nay" (chỗ thứ ba nói cùng con số; bản dưới đồng hồ — "Phiên 0/5 hôm nay" — tốt hơn vì có mẫu
  số). Giữ nửa hành-động-được: "Bạn còn 5 phiên nữa là đủ nhịp hôm nay."
- **Thanh đầu (mọi màn)** — ba ô số liệu xuống còn hai: gỡ ô "Phiên". Nó và ô "Tập trung" là hai
  hình chiếu của cùng một sự việc (làm 3 phiên thì đương nhiên có ~75 phút), và ở màn Tập trung nó
  còn trùng lần thứ hai với dòng dưới đồng hồ **trong cùng một khung nhìn**. Giữ số PHÚT chứ không
  giữ số phiên: số phút không được nói ở đâu khác, số phiên thì có.
- **Màn Nhiệm vụ** — gỡ hai nhãn "HÔM NAY" / "CHUỖI TUẦN" đứng trên "Nhiệm vụ ngày" / "Nhiệm vụ
  tuần" (chữ "ngày"/"tuần" trong chính tiêu đề đã nói xong). `QuietSection.eyebrow` nay là **tuỳ
  chọn thật**, không còn rơi về mặc định im lặng "Nhật ký".
- **Màn Hành trang** — gỡ hai nhãn "TIẾN TRÌNH" / "CÂY KỸ NĂNG" (cái sau nhắc lại tên tab Đàm vừa
  bấm). Đổi dòng luật chơi "6.000 XP/cấp · 2 SP mỗi cấp" thành **đếm ngược tới phần thưởng**:
  "Còn 3.555 XP nữa lên cấp 6 → +2 SP" — cùng chỗ, nhưng nó đổi sau mỗi phiên.

**Một lỗi thật, im lặng ở mọi cổng.** Cả **ba** câu mô tả của thẻ "Thưởng trọn ngày" dài 32–34 ký tự
trong khi ô chứa chúng là một dòng `truncate`, nên cả ba hiện ra cụt: «Còn 123 XP từ các mục …».
Hợp đồng "đúng một dòng" có ghi trong chú thích của `RewardCard` nhưng **không có gì canh**. Nay ba
câu ≤22 ký tự, tách ra `src/components/dailyBonusCopy.js` và có `dailyBonusCopy.test.js` (4 bài, đã
thử-cho-đỏ) đo độ dài — kể cả ca XP 5 chữ số.

**Ảnh hưởng.** Chỉ giao diện; không đụng engine, không đụng kinh tế game, không đụng Thành Phố.
**Tương thích:** không có migration.

---

## 2026-08-29 (đêm) — Tối giản: cắt 213px chữ khỏi màn Thành Phố, và sửa một lỗi cắt chữ im lặng

**Mục đích.** Đàm: *"đơn giản hoá, tối giản hoá, làm thành phố hứng thú hơn"*. Nguyên tắc áp dụng:
**gỡ bớt trước, thêm sau** — và mọi thứ gỡ đi đều là chỗ nói lại điều vừa nói.

**Đo trước khi cắt** (khung 390px, tab Thành Phố): canvas 3D chỉ chiếm **24% chiều cao** và bắt đầu
ở **y=537** — tức 63% màn hình trôi qua trước khi thấy thứ đáng xem nhất. Trước hình có sáu lớp,
phần lớn là chữ giải thích luật chơi.

**Đã gỡ / thu.** Chữ "Workspace" (tiếng Anh, hiện y hệt ở cả 5 tab ⇒ không phân biệt gì) · khối
tiêu đề trang trên điện thoại (nhãn tab đang sáng đã nói tên màn hình) · dòng "Kiến trúc lấy mẫu
từ…" chuyển xuống DƯỚI hình (nó là chú thích cho ảnh) · câu hướng dẫn kéo/chạm rút gọn · khối
"Nhịp hiện tại" ở Nhiệm vụ chỉ còn hiện khi THẬT SỰ có chuỗi · dòng "Tiến độ hiện tại: 0/1" dưới
mỗi nhiệm vụ (con số ấy đã ở ngay bên phải) · "Cấp 5" trên thanh tiêu đề điện thoại thôi hiện hai
lần. Canvas nay bắt đầu ở **y=324**, lọt trọn nửa trên màn hình.

**Đã thêm, không tốn dòng nào.** Cảnh 3D đổi theo đồng hồ thật từ lâu nhưng không màn hình nào nói
ra — nay ghép một chữ vào cuối dòng chú thích đã có (*"· buổi chiều"*), biến một hiệu ứng vô hình
thành lý do mở app vào giờ khác.

**Đã sửa một lỗi thật.** Cột cây kỹ năng phình 567px trên khung 390px ⇒ mô tả mỗi kỹ năng bị cắt
cụt giữa câu. Nguyên nhân: ở khung hẹp grid chỉ có một cột ngầm cỡ `auto`, tự phình theo nội dung;
`min-w-0` không cứu được, phải là `grid-cols-1` (`minmax(0,1fr)`). Lỗi im lặng ở mọi cổng — desktop
không tràn, và `--fit` chỉ soi nút chứ không soi thẻ `<p>`.

**Cổng.** 1315 bài xanh · lint sạch · build xanh · đã quét cả sáu màn ở khung 390px, không còn khối
nào tràn.

---

## 2026-08-29 (tối) — Phần thưởng khi TỚI đích, và chuỗi đang treo

**Mục đích.** Bước trước dựng một cái đích (*"còn ~3 phiên nữa tới «…»"*) rồi khi tới nơi thì
**không có gì xảy ra cả** — đúng thứ mà chính mã ấy cảnh báo: *một lời hứa hụt làm hỏng mọi lời hứa
sau đó*. Hai việc, không thêm một dòng nào lên màn hình vì cả hai dùng chỗ đã có.

**(1) Vượt mốc thì được ăn mừng.** Dòng đếm ngược đổi giọng thành *"🎉 Vừa mở «Khám Phá Tân Thế
Giới»"*, bấm được để tắt và trả chỗ lại cho dòng đếm ngược của chặng kế. Dấu "đã ăn mừng" ở
localStorage (`dc-stage-seen-v1`) — chuyện của từng máy, không thêm byte nào vào dữ liệu đồng bộ.
Lần đầu chạy thì GIEO dấu rồi im lặng: không có luật ấy, Đàm sẽ nhận lời chúc mừng cho chặng anh
đi qua từ nhiều tuần trước.

**(2) Ô "Chuỗi" báo khi chuỗi đang treo.** Một con số trần không phân biệt được *"17 ngày, hôm nay
xong rồi"* với *"17 ngày, hết hôm nay là mất sạch"*. Cái thứ hai là thứ đáng nói nhất trong ngày, và
trước bản này nó chỉ sống trong AI Coach và push lúc 17h — tức chỉ tới được Đàm khi anh KHÔNG mở
app. Nay nhãn đổi thành `Chuỗi ⚠` kèm viền màu nhấn: đọc được cả khi không nhìn màu (luật ADR-060).
Lá Chắn KHÔNG làm hết treo, nó chỉ đổi hậu quả.

**(3) `no-use-before-define` bật cho toàn dự án.** Xem mục dưới — một `const` dùng trước dòng khai
báo làm cả app ra trang trắng, mà không cổng nào bắt được.

**Phạm vi.** `engine/eraStage.js` · `engine/gameMath.js` · `hooks/useStageCountdown.js` ·
`components/FocusStageCountdown.jsx` · `App.jsx` · `eslint.config.js` · `scripts/shot.mjs` (cờ
`--ls` để gieo khoá localStorage tuỳ ý — không có nó thì mọi trạng thái "lần đầu nhìn thấy" là
không thể chụp).

**Cổng.** 1315 bài `test:fast` xanh (thêm 11) · lint sạch · build xanh · ba trạng thái mới đều đã
nghiệm thu bằng ảnh khung 390px.

---

## 2026-08-29 (chiều) — Mốc gần hơn: thanh tiêu đề đo CHẶNG, và đếm ngược bằng số phiên

**Mục đích.** Đàm: *"làm cho game hứng thú và đầy dopamine hơn, nhưng đơn giản"*. Không thêm hệ
thống nào — chỉ đổi **cái mốc đang được ĐO**.

**Chẩn đoán.** Thanh trên thanh tiêu đề đo cả KỶ. Một kỷ dài 5.600–20.800 EP, nên ở nhịp thường một
phiên đẩy thanh **~1%** và nó đầy đúng MỘT lần mỗi 1–6 tháng — một cái đích xa tới mức không nhìn
thấy mình đang tiến. Mỗi kỷ đã chia sẵn 3 chặng từ lâu (`makeEraStages`), nhưng chặng chỉ được dùng
ở `ResourceDisplay` — mà thẻ đó nằm trong cột `hidden … lg:flex`, tức **trên iPhone Đàm chưa bao
giờ nhìn thấy nó**.

**Thay đổi.** (1) `engine/eraStage.js` mới — nguồn DUY NHẤT của phép chia chặng; `ResourceDisplay`
bỏ bản sao cục bộ. (2) Thanh tiêu đề đo chặng: ~3%/phiên, đầy **ba lần mỗi kỷ**, kèm ba vạch cho
biết đang ở chặng mấy. (3) Dòng đếm ngược ở màn Tập trung: *"còn ~3 phiên nữa tới «Khám Phá Tân
Thế Giới»"* — nhịp lấy TRUNG VỊ 10 phiên gần nhất (chịu được phiên dài bất thường), chưa đủ mẫu thì
nói bằng EP chứ không bịa. (4) Còn ≤1 phiên thì dòng đổi giọng và đổi màu.

**Ảnh hưởng / tương thích.** Thuần hiển thị: không đụng `gameStore`, không đổi một luật tính thưởng
nào, không thêm byte nào vào dữ liệu đồng bộ. `eraProgress` (tiến độ cả kỷ) vẫn giữ — nó là con số
đúng cho câu hỏi "còn bao xa tới kỷ sau", chỉ là không phải con số nên đặt ở chỗ liếc mắt.

**Cổng.** 1304 bài `test:fast` xanh (thêm 12 bài) · lint sạch · build xanh · nghiệm thu bằng ảnh
khung 390px ở cả hai trạng thái (bình thường và sắp-tới-đích).

---

## 2026-08-29 — Mở van skin + dòng "Việc tiếp theo" ở màn Tập trung

**Mục đích.** Hai việc nhỏ nhắm vào cùng một câu hỏi của Đàm: *"làm sao game dễ chơi và hứng thú
hơn"*. Cả hai đều KHÔNG thêm hệ thống mới — game đã có 51 kỹ năng, 75 công trình, 360 thành tích;
cái thiếu chưa bao giờ là nội dung.

**(1) Ép chuyển skin một lần.** Đổi `DEFAULT_UI_SKIN` không đổi được giao diện của máy đã lưu lựa
chọn cũ — dữ liệu đã lưu thắng mặc định, và điều đó vốn đúng. Nhưng skin `editorial` trong bản lưu
của Đàm nằm đó vì hồi ấy nó LÀ mặc định, không phải vì anh chọn; hệ quả là bảy bước làm lại giao
diện chạy trên production nhiều ngày mà chủ dự án không thấy một thứ nào. Nay `migrate` (version
8 → 9) đưa bản lưu chưa có cờ `skinMigratedV1` về mặc định hiện hành **đúng một lần** rồi bật cờ;
từ đó lựa chọn của người dùng được tôn trọng vĩnh viễn. Cờ riêng chứ không so `uiSkin === 'editorial'`
— so giá trị thì mọi lần bump version sau đều ép lại, kể cả với người đã chọn có ý.

**(2) 7 ký tự commit ở cuối màn Cài đặt.** Bơm lúc build (`vite.config.js` → `__APP_COMMIT__`, ưu
tiên `VERCEL_GIT_COMMIT_SHA`, `catch` về `'dev'` để build không bao giờ đổ vì một dòng trang trí).
Không có nó thì "chưa deploy" và "deploy rồi mà không thấy" trông giống hệt nhau — hai thứ cần hai
cách sửa ngược nhau, và đã tốn trọn một phiên để phân biệt.

**(3) Dòng "Việc tiếp theo".** `engine/opportunities.js` đã tính sẵn ba danh sách (kỹ năng mở được /
bản vẽ nghiên cứu được / công trình xây được) nhưng chỉ dùng làm một cái CHẤM — chấm nói *"có
việc"*, không nói *"việc gì"*. Thêm hàm thuần `pickNextAction` chọn ra một việc, ưu tiên **XÂY >
NGHIÊN CỨU > KỸ NĂNG** (xây là việc duy nhất cho kết quả nhìn thấy được trong thành phố ở phiên
sau), kèm `othersCount` để dòng không nói dối bằng cách bỏ sót. Hiện ở **cột giữa** màn Tập trung,
cạnh dòng "đang xây" — cột phải không hiện trên iPhone.

**Phạm vi.** `store/uiSkins.js` · `store/settingsStore.js` (version 9) · `vite.config.js` ·
`eslint.config.js` · `components/Settings.jsx` · `engine/opportunities.js` ·
`hooks/useNextAction.js` (mới) · `components/FocusNextAction.jsx` (mới) · `App.jsx`.

**Ảnh hưởng / tương thích.** Lần mở app đầu tiên sau bản này, máy nào chưa có cờ sẽ nhảy sang skin
"Sân Chơi" — đổi skin lại trong Cài đặt là giữ vĩnh viễn. Không đụng `gameStore`, không thêm byte
nào vào khối JSONB đồng bộ Supabase, không đổi luật chơi hay công thức phần thưởng.

**Cổng.** 1292 bài `test:fast` xanh (`# skipped 1`) + 3 bài `test:cross` · lint sạch · build xanh ·
đã xác nhận bằng ảnh chụp khung 390px thật.

---

## 2026-08-27 (tối muộn) — Báo cáo tuần: lối vào trên iPhone (bổ sung ADR-061)

**Mục đích.** ADR-061 (phiên khác, cùng ngày) bỏ hộp thoại báo cáo tuần tự bật và thay bằng một thẻ
toast cộng một chấm "chưa xem" làm lưới an toàn. Cái chấm ấy chỉ có ở **thanh bên desktop**, mà
thanh bên là `hidden md:flex` — và trước ADR-061, **iPhone không có nút nào mở báo cáo tuần**. Nên
trên thiết bị Đàm dùng nhiều nhất, lỡ một cái toast 4 giây vẫn là mất báo cáo cả tuần.

**Phạm vi.** Một mục trên thanh điều hướng dưới + một bài test. Không đụng store, không đụng luật
tính thưởng, không đổi mô hình hai-ngày của ADR-061.

- **`src/App.jsx`** — thêm mục **"Báo cáo tuần" vào menu "Thêm"** trên điện thoại, mang cùng chấm
  `weeklyReportUnseen` (đọc lại biến sẵn có, không tự tính lại). Số cột của menu đọc
  `MOBILE_SECONDARY_TABS.length + 1` chứ không chốt cứng.
- **`src/components/rewardToastWiring.test.js`** — khoá cả lối vào lẫn cái chấm ở CẢ HAI thanh
  điều hướng.

**Tương thích.** Không migration, không đổi dữ liệu.

---

## 2026-08-27 (khuya) — Bóng tiếp xúc đo từ nền của chính công trình, không từ y = 0

**Mục đích.** Lấy việc "giống 3D hơn" trong hàng đợi. Trong lúc làm thì lộ ra một khuyết tật thật:
`contactShade` — bóng tiếp xúc nướng sẵn vào màu đỉnh, chính là "AO" mà hàng đợi đòi thêm — đo độ
cao so với **y = 0**, tiền đề đúng khi nó được viết (mặt đất phẳng) nhưng đã chết từ Phase 7B khi
mặt đất có cao độ.

**Phạm vi.** Thành phố 3D, tầng hình học và ánh sáng. Không thêm nguồn sáng, không đụng camera.

- **`src/components/city/render3d/geometryFactory.js`** — `shade` (boolean) → `shadeBase` (cao độ
  nền của chính công trình). Đo được: **7/15 kỷ** có ô nền cao hơn `CONTACT_REACH` = 0,38, nhiều
  nhất là kỷ 8 với 88/144 ô (61%); công trình trên những ô đó trước đây mất sạch bóng chân.
- **`src/components/city/render3d/sceneGraph.js`** — `SHADOW_MAP_DESKTOP` 2048 → 4096 (điện thoại
  giữ 512). Thử siết `sun.shadow.camera` xuống 0,58·lưới và **hoàn tác**: không đọc ra khác biệt
  trên ảnh, mà rủi ro cắt cụt bóng ở vành ngoài thì có thật — lý do đã ghi vào mã.
- **`START_HERE.md`** — gỡ việc "kim tự tháp / ziggurat" khỏi hàng đợi: **đã làm xong từ
  2026-08-21**, hàng đợi đang bảo phiên sau đi làm lại. Viết lại mục "giống 3D hơn" thành ba lựa
  chọn mỹ thuật cần Đàm chọn.
- **`TECH_DEBT.md`** — thêm **#88**: `soiVetRach` bỏ sót một vết rách ảnh mắt thường nhìn ra ngay,
  và một phép đo chạy trên tấm ảnh ấy cho ra bộ số bịa rất thuyết phục.

**Ảnh hưởng.** Công trình trên thềm cao nay có bóng chân như công trình dưới thấp. Mép bóng đổ nét
gấp đôi. Cả hai đều dưới ngưỡng mắt ở khung toàn cảnh — thấy rõ khi soi gần.

**Tương thích.** Không đổi dữ liệu, không migration, không đụng ADR-007.

**Cổng.** `npm test` 1.234 bài · 1.233 pass · 0 fail · 1 skipped · lint sạch · build xanh.

---

## 2026-08-27 (khuya) — Ba nhịp phủ kín giao diện, và một cổng chặn hồi quy

**Mục đích.** Lượt trước gom 11 file; phần còn lại của giao diện vẫn tự khai nhịp riêng. Và không
có gì ngăn một file MỚI gõ lại `initial={{ opacity: 0, y: 20 }}` — đúng cách hơn ba mươi file đã
trôi thành 5 thời lượng và 7 đường cong.

**Phạm vi.** Toàn bộ `src/**/*.jsx` **trừ** `components/city/render3d/` (three.js, một hệ khác).

- **Đo được, trên cả hai mốc, bằng cùng một phép đếm:** **410 khai báo rời rạc trên 30 file → 54
  trên 11 file (−87%)**. Ba ổ lớn nhất: `StatsDashboard` 36→4 · `Settings` 32→0 · `SkillTree` 10→0.
- **`withDelay(preset, giây)` (mới)** — danh sách hiện SO LE vẫn là nhịp `enter`, chỉ lệch giờ.
  Hàm THUẦN nên gọi được trong `.map()`, và tự giữ lời hứa Giảm chuyển động. **Không phải nhịp
  thứ tư.**
- **`src/lib/motionCoverage.test.js` (mới)** — cổng đếm khai báo rời rạc từng file, so với một
  BẢNG NGOẠI LỆ tường minh. Có cả hai vế: ngoài bảng phải bằng 0, **và** trong bảng mà dọn bớt rồi
  thì phải hạ số xuống. 5/5 phép thử ngược đã thấy đỏ.
- **Dọn kèm:** prop `reducedMotion` truyền tay xuống 4 component nay là prop chết — đã gỡ; 4 bản
  vá tay `width: reduceMotion ? … : undefined` cũng gỡ (`useSnapMotion` đã làm đúng việc đó).

**Ảnh hưởng.** Thuần thị giác. Vài chỗ đổi hình dạng thấy được: các nút ở Cài đặt trước đây phóng
to ba mức khác nhau (1,01 · 1,02 · 1,03) nay một mức; hai biểu đồ ở Thống kê trước đây tự vẽ ra
theo hai bộ số khác nhau nay chung một bộ.

**Tương thích.** Không đổi dữ liệu, không đổi API, không cần migration.

**Cố ý đứng ngoài.** `city/CityGrowthMoment.jsx` là một đoạn phim 3,2 giây có ba luật cứng riêng và
**không hề được dựng** khi bật Giảm chuyển động — ép nó vào `enter` là làm hỏng một cảnh diễn để
đổi lấy một con số đẹp.
## 2026-08-27 (đêm) — Phase 21 §1: gộp `main` vào nhánh Phase 21, gỡ hai va chạm số

**Mục đích.** Chỉ thị Phase 21 §1 yêu cầu hợp nhất trước mọi việc khác. `main` đã đi thêm 20 commit
(tới `4360ca5`) trong lúc nhánh Phase 21 làm việc.

**Phạm vi.** Chỉ tài liệu và đánh số — **không một dòng mã sản phẩm nào bị sửa để giải xung đột**.
Cả 5 xung đột đều là "hai bên cùng thêm mốc mới vào đầu file", giải bằng cách giữ cả hai theo thứ
tự thời gian. Hai va chạm số được gỡ: **ADR-060** (Phase 21 → **ADR-066**, 33 chỗ) và
**TECH_DEBT #86/#87** (Phase 21 → **#89**/**#90**, 40 chỗ) — nhánh đã lên production giữ số, nhánh
tính năng nhường. Kèm hai khuyết tật có sẵn được vá: mục `#78` bị tách làm hai nửa rời nhau, và
ADR-066 chứa lạc nguyên một thân ADR-061 (45 dòng, thiếu đúng dòng tiêu đề nên không phép đếm nào
thấy).

**Ảnh hưởng.** Không đổi hành vi app. Số bài test đi từ 1.184 lên **1.266** (`main` mang sang ~82
bài). Bản quét 15 kỷ đo lại sau khi gộp **không trôi một chữ số** (12,11 · 22,14 · trung vị 36,42 ·
0/15 · 0/105) — đúng kết quả phải có, vì `git diff` cho thấy `main` chỉ đụng CHÚ THÍCH ở tầng màu
3D (thêm skin thứ 5 nên "8 tổ hợp" → "10 tổ hợp"), không đụng giá trị màu nào. Sự đứng yên ấy đồng
thời chứng minh skin arcade mới không rò vào cảnh 3D.

**Tương thích.** Hoàn toàn tương thích ngược; không có migration. Ai đang trích dẫn `ADR-060` hoặc
`TECH_DEBT #86`/`#87` từ tài liệu Phase 21 (trước `c2b66bc`) thì nay phải đọc là `ADR-066`, `#89`,
`#90`.

---

## 2026-08-27 (tối) — Một ngôn ngữ hình cho mọi phần thưởng, và phân tầng mức độ làm phiền

**Mục đích.** App có bảy đường trao thưởng và bảy cách trình bày — riêng `LootDropModal` đã có ba
hình cho ba loại thưởng trong cùng một hộp thoại, và bốn từ vựng độ hiếm rời nhau cùng trả lời một
câu hỏi *"cái này quý tới đâu?"*. Đồng thời mọi phần thưởng, lớn hay nhỏ, đều mở một hộp thoại toàn
màn hình: nhận một hòn đá và lên một kỷ nguyên mới gây ra cùng một mức gián đoạn.

**Phạm vi.** Tầng hiển thị + hai hàm thuần ở `engine/`. **Không đổi một luật tính thưởng nào** —
store vẫn bật `lootModalOpen` đồng bộ y như cũ.

- **`src/engine/rewardTiers.js` (mới)** — thang độ hiếm DUY NHẤT, đúng bốn bậc: thường `--muted` ·
  tốt `--good` · hiếm `--warn` · huyền thoại `--accent`. Kèm ánh xạ từ cả bốn từ vựng sẵn có (độ
  hiếm bản vẽ · hạng thành tích · hệ số nhân phiên · bucket nhiệm vụ). Màu là BIẾN CSS chứ không
  phải mã màu, nên đúng ở cả 10 tổ hợp skin × chế độ.
- **`src/components/shared/RewardCard.jsx` (mới)** — thẻ phần thưởng dùng chung, đặt cạnh
  `BadgeKit.jsx`. Nhận `icon` · `name` · `tier` · `description` · `amount`. Độ hiếm đọc được cả khi
  không nhìn màu: nhãn chữ + dải chấm, màu chỉ là tín hiệu thứ ba.
- **`src/engine/rewardFeed.js` (mới)** — hàm THUẦN gom sáu kênh thưởng nhẹ thành một hàng đợi toast,
  cắt còn tối đa 3 thẻ + dòng "và N phần thưởng khác".
- **`src/components/RewardToastHost.jsx` (mới)** — chồng toast ở góc màn hình, mỗi thẻ một đồng hồ
  riêng 4 giây, bấm vào mở chi tiết. Thay `AchievementToast.jsx` (**đã xoá**).
- **`src/App.jsx`** — `GlobalOverlays` nay thi hành LUẬT MỨC ĐỘ LÀM PHIỀN: chặn màn hình chỉ dành
  cho **lên kỷ · thăng hoa · khủng hoảng kỷ · thảm hoạ**; mọi thứ còn lại đi qua toast.
- **`LootDropModal.jsx` · `DailyMissions.jsx`** — chuyển sang `RewardCard`. Ở `DailyMissions` chỉ
  phần TRẢ THƯỞNG dùng thẻ; các dòng nhiệm vụ giữ nguyên dạng hàng vì thẻ không có thanh tiến độ.
- **`LevelUpModal.jsx`** — không còn tự bật; nó thành phần CHI TIẾT mở khi bấm thẻ.
- **`src/store/gameStore.js`** — `dismissAchievementNotification`/`dismissMissionNotification` nhận
  thêm **id tuỳ chọn**; không truyền thì hành vi y hệt bản cũ.

**Ảnh hưởng.** Ba kênh `relicNotification` · `rankUpNotification` · `missionCompletedIds` được store
ghi từ lâu mà **không màn hình nào đọc** — nghĩa là nhận một di vật xưa nay không hiện gì cả. Chồng
toast là chỗ đọc đầu tiên của cả ba.

**Tương thích.** Không có migration. Không đụng dữ liệu lưu (`ui` không nằm trong `partialize` nên
không lên Supabase). Ngoại lệ duy nhất còn lại của luật mới: báo cáo tuần vẫn tự bật sáng thứ Hai —
cố ý, ghi ở `TECH_DEBT #87`. Chi tiết quyết định: **ADR-060**.
## 2026-08-27 (tối) — Thanh tài nguyên: ba con số cộng một thanh tiến độ

**Mục đích.** `ResourceDisplay` bày cùng lúc EP, chặng của kỷ, tài nguyên thô, tài nguyên tinh chế,
RP và tinh thể — tất cả cùng một trọng lượng thị giác. Khi mọi thứ đều được nhấn thì không thứ nào
được nhấn: mắt không có thứ tự đọc, nên thanh này thật ra không nói được điều gì.

**Phạm vi.** Tầng giao diện, đúng một thẻ. Không đụng engine game, store, thành phố 3D hay sync.
Không dữ liệu nào bị xoá — chỉ đổi chỗ hiển thị.

- **`src/components/ResourceDisplay.jsx`** — viết lại. LUÔN hiện đúng ba thứ: thanh tiến độ kỷ (trọn
  chiều ngang, nhãn `Kỷ N · chặng i/n`, phần chạy `var(--accent)` đặc trên nền `var(--line)`) ·
  `chuỗi` · `tinh thể`. Tài nguyên thô, tinh chế, RP, tên giai đoạn và khoảng EP của chặng chuyển vào
  panel mở bằng nút **Kho** (`aria-expanded`/`aria-controls`). Số tăng thì nháy `var(--good)` 400ms;
  bật giảm chuyển động thì đổi màu tức thì, không tween.
- **`src/components/resourceDisplayFormat.js`** (mới) — ba luật trình bày, mỗi luật một công thức:
  `NUMBER_STYLE` (mọi con số `tabular-nums`, `Object.freeze`) · `labelSizeFor()` (nhãn nhỏ hơn số 40%,
  màu `var(--muted)`) · `shouldFlashOnIncrease()` + `FLASH_MS`. Tách ra file `.js` thuần vì bộ chạy
  test là `node --test` không biên dịch JSX — luật để trong `.jsx` là luật không test nào chạm tới.
- **`src/components/resourceDisplay.test.js`** (mới, 11 bài) — nửa thuần khoá ba luật trên; nửa đọc-mã
  khoá bố cục: trần BA con số ở vùng luôn hiện · đúng một thanh tiến độ · thanh dùng `--accent`/`--line`
  và `w-full` · tài nguyên thô/tinh chế/RP chỉ nằm sau cổng Kho (và vẫn PHẢI còn ở đó) · nháy đúng
  `--good` và tôn trọng giảm chuyển động · không chỗ nào tự khai `tabular-nums`. Chín phép thử ngược
  đều đỏ đúng bài dự kiến, khôi phục thì xanh lại.

**Tương thích.** Không đổi store, không đổi dữ liệu lưu, không migration. Thuần trình bày.
## 2026-08-27 (tối) — Đồng hồ Pomodoro trả lời hai câu hỏi thay vì một

**Mục đích.** Nhìn một cái vào đồng hồ phải biết được CẢ HAI: còn bao nhiêu phút của phiên này, và
hôm nay đã đi được mấy phần mục tiêu. Trước đây nó chỉ trả lời câu thứ nhất, bằng một vòng mảnh
7px mà màu thì chốt cứng nên không đổi theo skin.

**Phạm vi.** Màn Tập trung. Không đụng thành phố 3D, không thêm nguồn sáng.

- **`src/components/PomodoroEngine.jsx`** — vòng chính nét 7 → **14**, bo tròn hai đầu, nền
  `--timer-track`; màu theo trạng thái đọc token (tập trung `--accent`, nghỉ ngắn **và** nghỉ dài
  `--good`). Thêm **vòng thứ hai** mảnh 4px cách 8px nằm ngoài, màu `--warn`, thể hiện tiến độ mục
  tiêu ngày; chưa đặt mục tiêu thì không vẽ. Con số ở giữa +20% cỡ (cả 12 mốc đáp ứng), weight 800,
  `tabular-nums`; thêm dòng 13px `--muted` "Phiên 2/5 hôm nay" ngay dưới.
- **`src/engine/gameMath.js`** — thêm `countSessionsOnDay`, `sumFocusMinutesOnDay`,
  `getDailyGoalProgress` làm **nguồn sự thật duy nhất** cho "tiến độ hôm nay". `App.jsx` (và qua đó
  thẻ "Hôm nay" ở `FocusRail`) nay dùng chung công thức với vòng quanh đồng hồ, nên hai con số cạnh
  nhau không thể nói hai điều khác nhau.
- **`src/components/timerRing.test.js`** (mới, 7 bài) + 5 bài thuần trong `gameMath.test.js` — khoá
  hình học hai vòng, màu đọc token, bo tròn đầu vòng, không vẽ vòng rỗng, và việc vòng kẹp 100%
  trong khi dòng chữ nói thật con số đã vượt. Cả 10 phép thử ngược đều đỏ đúng chỗ.
- **`scripts/shot.mjs`** — fixture có 2 phiên của hôm nay (seed vào `history`, vì store dựng lại bộ
  đếm ngày từ history), nếu không vòng mục tiêu luôn vẽ 0% và vô hình trong mọi ảnh chụp.

**Ảnh hưởng.** Đồng hồ to hơn ~9% (khung SVG nới để ôm vòng thứ hai) và con số to hơn 20%. Đã đo:
không tràn ở cả 1280px lẫn 390px, kể cả chuỗi dài nhất "180:00".

**Tương thích.** Không có migration. Không đổi dữ liệu lưu.

**Đã biết, chưa xử lý.** Con số đồng hồ vẫn dùng `.serif` chốt cứng `'Source Serif 4'` thay vì
`var(--skin-font-display)`, nên ở skin Sân Chơi (sans) nó vẫn là serif — cùng họ bệnh với
`ActionButton` đã chữa cùng ngày, nhưng đổi font là một quyết định mỹ thuật nên để lại.

**Cổng.** `npm test` 1.175 bài · 1.174 pass · 0 fail · 1 skipped · `test:cross` 3/3 · lint sạch ·
build xanh.
## 2026-08-27 (khuya) — Điều hướng chính từ 8 mục xuống 5: gộp, không xoá

**Mục đích.** Thanh điều hướng có 8 mục, trong đó Kỹ năng · Kho báu · Thành tích chiếm ba ô cho ba
màn cùng một họ ("những gì tôi đã tích luỹ"). Trên iPhone, 8 mục chen vào 4 nút nên "Thành Phố" —
mặt trận đang xây — bị đẩy vào nút "Thêm". Gộp ba mục ấy thành một tab **"Hành trang"** trả lại ô
thứ tư cho Thành Phố mà không màn hình nào bị xoá.

**Phạm vi.** Tầng điều hướng. Không đụng engine game, thành phố 3D, sync, hay nội dung từng màn —
mỗi tab con vẫn dựng đúng component cũ với đúng state cũ.

- **`src/App.jsx`** — `DESKTOP_TABS` còn **5 mục** (Tập trung · Hành trang · Thành Phố · Thống kê ·
  Cài đặt); `MOBILE_TABS` còn 6, `MOBILE_PRIMARY_IDS` = 4 nút (Tập trung · Nhiệm vụ · Hành trang ·
  Thành Phố), nút "Thêm" giữ Thống kê + Cài đặt. Thêm `INVENTORY_TABS` (3 tab con **giữ nguyên id
  cũ** `skills`/`collection`/`achievements`) và `resolveTabTarget` — cửa dịch id cũ sang "tab Hành
  trang + tab con". Dải tab con tách thành `SubTabs` dùng chung với `COLLECTION_TABS`.
- **`src/engine/opportunities.js`** (mới) — ba phép đếm "có việc đang chờ" chuyển từ
  `NotificationCenter.jsx` sang đây, vì nay có HAI người đọc chúng.
- **`src/engine/navAttention.js`** + **`src/hooks/useInventoryAttention.js`** (mới) — chấm màu
  `var(--accent)` trên tab "Hành trang" khi có kỹ năng/bản vẽ/công trình sẵn sàng, hoặc có thành
  tích đã mở khoá mà chưa xem.
- **Test mới**: `src/appNavigation.test.js` (6 bài, đọc mã nguồn — đếm 5 mục/4 nút/3 tab con và
  canh mọi đích thông báo còn tới được), `src/engine/navAttention.test.js` (6),
  `src/engine/opportunities.test.js` (5). Cả **15 phép thử ngược** đều đỏ đúng bài dự kiến.

**Gộp nhánh.** Nhánh này gộp với mốc "ba nhịp chuyển động" (`motionPresets.js`) đã lên `main`
trước đó; hai bên đụng nhau ở 2 chỗ trong `App.jsx` và giữ CẢ HAI (hiệu ứng `enterMotion` của mốc
kia + lưới co theo số mục và prop `attentionTabIds` của mốc này). Sau gộp: `npm test` 1.186 bài.

**Ảnh hưởng.** Số màn hình không đổi — mọi màn cũ vẫn vào được, qua một lớp tab con. Thanh dưới
iPhone đổi chỗ "Thống kê" (nay nằm sau nút "Thêm") lấy chỗ cho "Thành Phố".

**Tương thích.** Thông báo đã lưu trong localStorage mang `action: { tab: 'skills' }` /
`{ tab: 'collection', collectionTab: … }` **vẫn đi đúng chỗ** — id cũ được `resolveTabTarget` dịch
chứ không bị đổi ở nguồn. Không có migration.

---

## 2026-08-27 (tối) — Mọi chuyển động của app về đúng BA NHỊP

**Mục đích.** `initial`/`animate`/`transition` được khai rời rạc ở hơn ba mươi file, mỗi chỗ một
thời lượng và một đường cong. Đo được **5 thời lượng** (0,18 · 0,22 · 0,26 · 0,28 · 0,35 giây) và
**7 đường cong** khác nhau. Mắt không đọc ra "app này mượt" mà đọc ra "mỗi chỗ một kiểu". Kèm theo,
tuỳ chọn **Giảm chuyển động** của hệ điều hành được xử lý bằng tay ở từng file, với ba tên biến
khác nhau — nên nó vắng mặt ở đúng những chỗ người ta quên.

**Phạm vi.** Tầng giao diện: `App.jsx`, `PomodoroEngine.jsx` và toàn bộ modal. **KHÔNG đụng**
`src/components/city/render3d/` (chuyển động thành phố 3D là một hệ khác), không đụng engine game,
sync, hay AI Coach.

- **`src/lib/motionPresets.js` (MỚI)** — ba nhịp, không hơn: `enter` (opacity 0→1, y 6→0, 180ms,
  ease `[0.22,1,0.36,1]`) · `press` (scale 1→0,97, 90ms) · `reward` (scale 0,9→1 bằng lò xo
  420/18). Cả ba là **hook** và **tự trả về object rỗng** khi `useReducedMotion()` bật, nên chỗ
  gọi không phải tự kiểm tra. Kèm hai cái GÁC cho ngoại lệ (`useCustomMotion` bỏ hẳn ·
  `useSnapMotion` nhảy thẳng tới đích khi `animate` mang bố cục) và hằng `SCRIM_FADE` dùng chung
  cho lớp phủ tối của modal.
- **11 file đã đổi** — `App.jsx`, `PomodoroEngine.jsx`, `DisasterModal`, `EraCrisisModal`,
  `LevelUpModal`, `LootDropModal`, `PrestigeModal`, `WeeklyReportModal`, `OnboardingOverlay`,
  `BlueprintInventory`, `SkillTree`. Bốn nhóm nút của bảng điều khiển đồng hồ trước đây khai
  **y hệt nhau bốn lần**, nay một nhịp. ⚠️ Hai file cuối chứa modal nằm LỒNG bên trong
  (`BlueprintDetailPanel`, `PurchaseConfirmDialog`) — quét theo tên file `*Modal.jsx` sẽ bỏ sót
  chúng; phải quét theo HÌNH DẠNG (`fixed inset-0`).
- **`src/lib/motionPresets.test.js` (MỚI)** — 6 bài đọc-mã-nguồn, cả **9 phép thử ngược** đều đã
  thấy đỏ. Nó ĐẾM số preset (nhịp thứ tư là đỏ) và chặn một quả mìn thật: framer-motion 12 **ném
  lỗi ở bản dev và im lặng ở bản production** khi một lò xo nhận quá hai mốc.

**Ảnh hưởng.** Mọi thẻ và modal mở ra cùng một nhịp 180ms. Bật *Giảm chuyển động* (Mac: Trợ năng →
Màn hình; iPhone: Trợ năng → Chuyển động) thì giao diện đứng yên: pháo hoa và mưa hạt biến mất hẳn,
những thứ mang bố cục (bề ngang cột, núm gạt, thanh tiến độ, vòng đếm giờ) nhảy thẳng tới đích thay
vì chạy.

**Tương thích.** Không đổi dữ liệu, không đổi API, không cần migration. Thuần thị giác.

**Hai chỗ cố ý đứng ngoài ba nhịp** — `ActionButton` (cú lún `y:4` BẰNG ĐÚNG chiều dày vạch bóng
đặc, `actionButtonPress.test.js` khoá cứng quan hệ ấy) và các hiệu ứng SO LE (`ResourceCascade`,
viên tài nguyên của `EraChangeBanner`) — cả hai vẫn được gác Giảm chuyển động, và đều có chú thích
tại chỗ nêu lý do.

---

## 2026-08-27 (chiều) — Nút hành động nghe theo skin, và có cảm giác bấm lún xuống

**Mục đích.** `ActionButton` là nút chuẩn của app nhưng nó khai hai bảng màu chốt cứng rẽ theo
`lightTheme` — chỉ đúng ở 2 trong 10 tổ hợp skin × chế độ, nên đổi skin không đổi được nút. Bóng mờ
nhiều lớp làm nó trông như thẻ giấy trôi thay vì một phím bấm, và `whileHover scale 1.03` phóng to
cả khối nên chữ nhoè đúng lúc con trỏ đang ở trên nó.

**Phạm vi.** Tầng giao diện. Không đụng engine game, thành phố 3D, sync, hay `sizeMap`.

- **`src/components/PomodoroEngine.jsx`** — `ActionButton` viết lại: một `themeMap` DUY NHẤT trỏ
  toàn token (`--ink`, `--accent`, `--card-bg-solid`, `--accent-soft` có fallback, `--card-bg-solid2`),
  bỏ hẳn nhánh `lightTheme` và bỏ luôn việc đọc `useSettingsStore`. Bóng đặc `0 4px 0 0`; `whileTap
  { y: 4 }` + `active:shadow-none` (lún đúng bằng chiều dày vạch rồi vạch biến mất); `whileHover
  { y: -1 }` + `hover:brightness-[1.06]`; `disabled:shadow-none`. `sizeMap` **giữ nguyên từng ký tự**.
- **`src/components/actionButtonPress.test.js`** (mới, 5 bài) — khoá: quãng lún BẰNG chiều dày bóng ·
  không mã màu cứng và không rẽ theo `lightTheme` · không `scale` khi hover · bóng tắt bằng độ đặc
  hiệu chứ không bằng thứ tự bảng kiểu · không để Framer animate `boxShadow`/màu. Cả 6 phép thử
  ngược đều đỏ đúng bài dự kiến.
- **`src/index.css`** — bỏ đúng một dòng `box-shadow: none !important` trong luật nút primary của
  skin Thụy Sĩ. Dòng ấy viết cho bóng MỜ; với bóng ĐẶC nó làm nút tụt 4px mà không có gì để tụt vào.
  Ba dòng màu giữ nguyên — quyết định "CTA đỏ thay vì đen" của skin đó không đổi.
- **`scripts/shot.mjs`** — thêm cờ `--press "<chữ>"` (bấm giữ một nút bằng input CDP thật rồi đo
  quãng lún + độ dày bóng ở ba mốc nghỉ/giữ/nhả), và **vá `--probe`**: nó khai `awaitPromise` nhưng
  bọc `String()` ở ngoài nên mọi biểu thức bất đồng bộ trả về `"[object Promise]"` — một dòng kết
  quả trông bình thường mà không chứa số nào thật.
- **`TECH_DEBT.md`** — thêm **#86**: 137 nút tự vẽ trên 28 file không đọc token skin, kèm bảng từng
  file + lý do không chuyển được, và lộ trình 4 bước.

**Ảnh hưởng.** Nút đổi màu theo cả 5 skin và cả hai chế độ (đo trên trình duyệt thật: 6 tổ hợp ra 6
bộ giá trị khác nhau). Người dùng thấy nút có "chân" và lún xuống khi bấm. Không có thay đổi nào về
kích thước hay bố cục nút.

**Tương thích.** Không có migration. Không đổi API của `ActionButton` (vẫn `variant`/`size`/`disabled`).

**Đã biết, chưa xử lý.** (a) Nửa Framer của cú bấm không quan sát được trong Chromium headless —
mốc nền tại commit trước hành xử y hệt nên không phải hồi quy, nhưng nguyên nhân chưa truy ra; bất
biến được khoá ở tầng mã nguồn thay thế. (b) 137 nút tự vẽ vẫn chốt cứng bảng màu editorial — xem
`TECH_DEBT #86`.

**Cổng.** `npm test` 1.163 bài · 1.162 pass · 0 fail · 1 skipped · `test:cross` 3/3 · lint sạch ·
build xanh.

---

## 2026-08-27 — Skin thứ 5 "Sân Chơi" (arcade), đặt làm mặc định

**Mục đích.** Nền cho hướng game hoá đơn giản, hiện đại. Bỏ giấy, bỏ serif, bỏ gradient, bỏ kính
mờ; còn lại ba thứ: mặt phẳng sạch, chữ sans đậm, và **bóng đặc** — một vạch màu dày 3px dưới đáy
thẻ thay cho bóng mờ nhiều lớp, cho thẻ một "cái chân" như phím bấm.

**Phạm vi.** Tầng giao diện. Không đụng engine game, không đụng thành phố 3D, không đụng sync.

- **`src/index.css`** — khối `[data-skin="arcade"]` (bảng token đầy đủ, `--app-bg` là **màu phẳng**)
  + khối `[data-theme="dark"][data-skin="arcade"]` + quy tắc tiêu đề `h1–h4` (Inter 800, tracking
  −0.025em). Không thêm font mới: Inter đã được app tải sẵn và đủ dấu tiếng Việt; tương phản tạo
  bằng ĐỘ ĐẬM.
- **`src/store/uiSkins.js`** (mới) — nguồn sự thật DUY NHẤT về danh sách skin + mặc định. Trước đây
  whitelist được chép nguyên văn ở hai nơi trong `settingsStore.js`; thêm skin mà quên một chỗ thì
  skin ấy bị đá về mặc định ở đúng một trong hai đường đi, không có gì đỏ lên.
- **`src/store/uiSkins.test.js`** (mới, 6 bài) — khoá ba chiều: mỗi skin phải có mặt trong
  `UI_SKINS`, trong `SKIN_OPTIONS` của màn Cài đặt, và có khối `[data-skin="…"]` trong CSS; cộng
  hai bất biến về chế độ tối (nền phẳng phải phẳng ở cả hai chế độ; màu của bản sáng không được rò
  sang bản tối). Cả 5 phép thử ngược đều làm đỏ đúng bài dự kiến.
- **`src/components/Settings.jsx`** — mục "Sân Chơi" đứng đầu danh sách; sửa câu mô tả cũ (nói
  editorial là cấu hình hợp nhất) vì nó đã thành sai.
- **`scripts/shot.mjs`** — thêm cờ `--skin <tên>`; fixture thôi chốt cứng `editorial` và đọc thẳng
  `DEFAULT_UI_SKIN`, để ảnh nghiệm thu không lặng lẽ mô tả một skin khác mặc định của app.
- 12 chú thích/thông báo ghi "2 theme × 4 skin = 8 tổ hợp" đã cập nhật thành 5 skin / 10 tổ hợp.
  Hai **bản ghi số đo có ngày tháng** thì giữ nguyên văn và thêm dòng đính chính (số đo gắn với
  đúng thứ đã đo; viết lại "8" thành "10" là nhận vơ một phép đo chưa từng chạy).

**Ảnh hưởng.** Người dùng **đã lưu lựa chọn skin cũ sẽ KHÔNG bị đổi giao diện** — dữ liệu đã lưu
thắng giá trị mặc định, đúng như phải thế. Mặc định mới chỉ áp cho máy chưa từng chọn. Muốn dùng
skin mới thì vào **Cài đặt → Bộ giao diện → Sân Chơi**.

**Tương thích.** Không có migration. `uiSkin` cũ vẫn hợp lệ; giá trị rác vẫn rơi về mặc định như
trước (nay là `arcade` thay vì `editorial`).

**Đã biết, chưa xử lý.** `--warn` của skin này đạt 2,53:1 trên thẻ trắng — dưới ngưỡng 3:1 cho màu
tín hiệu, trong khi ba skin sáng còn lại đạt 3,49–3,54:1; nó có được dùng làm màu chữ. Và chân bóng
ở chế độ tối chỉ đạt 1,19:1 so với thân thẻ (bản sáng 1,48:1) — giới hạn vật lý, vì thân thẻ tối
vốn đã gần đen nên đen tuyệt đối cũng chỉ tới 1,28:1. Chi tiết + phương án ở `BAN_GIAO.md`.

**Cổng.** `npm test` 1.158 bài · 1.157 pass · 0 fail · 1 skipped · `test:cross` 3/3 · lint sạch ·
build xanh. Nghiệm thu bằng trình duyệt thật trên CSS đã build, cả hai chế độ.

## 2026-08-24 (khuya) — PHASE 21: hợp nhất hai nhánh, và bàn cờ trở thành một mốc lịch sử (ADR-064, ADR-065)

**Mục đích.** Đàm xem bản quét Phase 20 và vẫn bác: *«nhà vẫn xếp rất ngăn nếp trông như quy hoạch,
dù quy hoạch ô bàn cờ chỉ bùng nổ và trở thành chuẩn mực từ thế kỷ 19»*. Phase 20 đã đổi được **bộ
xương** thành phố nhưng chưa chạm vào **bên trong một thửa**.

**Phạm vi.** Chỉ tầng dựng hình 3D (`src/engine/city3d/`) và tài liệu. Không đụng timer, store,
sync, AI Coach, hay bất kỳ luồng dữ liệu nào.

- **§1 Hợp nhất hai nhánh (ADR-064)** — `main` có đường lượn theo cung cong (ADR-059), nhánh này có
  chia thửa đệ quy (ADR-066). Hai bên trả lời hai câu khác nhau nên **ghép được**: BSP quyết cắt Ở
  ĐÂU, cung cong quyết cắt theo HÌNH GÌ. Một thửa nay là **tập ô**, không phải hình chữ nhật đã
  khai. ADR đánh số lại cho hết trùng (060 · 061 · 062 · 063 · 064).
- **§2 ADR-007** — Đàm duyệt: dời 75/75 công trình **một lần**, sau đó bố cục mỗi kỷ đóng băng vĩnh
  viễn. Từ ngày gộp `main`, đổi bộ sinh bố cục của một kỷ là **một quyết định di trú, phải hỏi**.
- **§3 Trục `layout` trong `blockStyle.js` (ADR-065)** — kỷ **1–9** `organic` (chia thửa đệ quy,
  không hàng không cột), kỷ **10–15** `grid` (giữ nguyên). Khoá bằng test hai chiều.
- **§4 Khối nhà nằm trong thửa của nó** — cặp khối đè lên nhau **290 → 15**, chỗ sâu nhất
  −0,441 → **−0,015 ô** (≈1 điểm ảnh, dưới sàn mắt 4). Thêm bài canh "thành phố lan RA NGOÀI":
  hộp bao ở 120 phiên nở **1,65–12,0 lần** so với 20 phiên.
- **§5 `parcelRoles.js` (module mới)** — 6/15 kỷ từng có **đúng 0 thửa dành cho nhà dân**, nên phép
  đo "thửa có khác cỡ không" đang đo các khu đất kỳ quan. Sau khi sửa, tỉ số ô đất lớn nhất/nhỏ
  nhất: `organic` **5,50** · `terrace` 4,67 · `grid` 2,25 · `radial` 2,00 · `axial` 1,25.

**Ảnh hưởng.** ⚠️ **Bố cục của cả 15 kỷ đổi** — công trình đã xây sẽ đứng ở chỗ khác **một lần** khi
bản này lên production (Đàm đã duyệt, §2). Sau lần đó, mỗi kỷ đóng băng vĩnh viễn và bất biến "chỉ
thêm, không bao giờ dời" vẫn xanh cho 1…120 phiên × 15 kỷ. Không mất dữ liệu, không migration.
Cái giá đã đo và không giấu: ô mất chi tiết mái 1,5% → 2,1% (`TECH_DEBT #90` vẫn mở); cột
`units`/`cols`/`rows` tạm là trục chết vì trần một-ô (`TECH_DEBT #88`).

**Tương thích.** Không đổi schema, không đổi API, không đổi cách chạy/build/deploy.

---

## 2026-08-24 (đêm) — Quy trình làm việc: cắt 6.323 dòng bắt buộc đọc xuống 55

**Mục đích.** Mỗi phiên đang tiêu ~80% sức vào đọc tài liệu, đo đạc và viết báo cáo, chỉ ~20% vào
xây. Ba phase liên tiếp qua sạch mọi cổng số mà vẫn bị bác về mặt thị giác.

**Phạm vi.** Chỉ tài liệu và `scripts/`. **Không sửa một dòng nào trong `src/`.**

- **`START_HERE.md`** (mới, 55 dòng) — file DUY NHẤT bắt buộc đọc mỗi phiên.
- **`PHASE_RULES.md`** (mới) — quy trình cho phase mỹ thuật: sản phẩm là ẢNH · không đo hiệu năng ·
  không viết công cụ đo mới · test chỉ giữ bất biến ADR-007 · tài liệu 2 file · báo cáo 5 dòng ·
  làm hết 4–8 việc trong một lượt · khung prompt cố định 4 mục ≤60 dòng.
- **`BAN_GIAO.md`** 5.821 → 397 dòng; phần cũ nguyên vẹn ở `docs/archive/`.
- **`CLAUDE.md`** quy tắc số 1 và số 2 viết lại; phần Governance Protocol giữ làm kho tra cứu và
  vẫn có hiệu lực cho phase kiến trúc/hạ tầng (sync, database, AI Coach, deploy, bảo mật).
- **`scripts/`** 10 công cụ dùng-một-lần chuyển sang `scripts/archive/`.

**Ảnh hưởng.** Không đổi hành vi app. Định nghĩa "phiên thành công" đổi từ *mọi cổng xanh* sang
**≥4 thay đổi nhìn thấy được trong ảnh**.

**Tương thích.** Không mất tài liệu nào — chỉ chuyển chỗ. Báo cáo 11 mục vẫn bắt buộc cho phase
kiến trúc/hạ tầng.

---

## 2026-08-24 (chiều) — MỖI KỶ MỘT MẠNG ĐƯỜNG RIÊNG: hết bàn cờ, có giao lộ thật (ADR-059)

**Mục đích.** Đàm bác chính bản vá buổi sáng: *"Không phải là kiểu đường lồi lõm, mà là dạng đường
cong hay không cong, như thể là có giao lộ, đường uốn quanh ấy, hãy làm lại … hiện tại ở thời nguyên
thuỷ hay các thời trước làm gì có đường dạng bàn cờ, hiểu không"*.

**Phạm vi.**
- **MỚI** `src/engine/roadPlan.js` — bộ sinh mạng đường theo KỶ. Nối các điểm mốc (5 khu kỳ quan ·
  tâm · cửa ngõ) bằng những **cung cong**, 5 kiểu khung (bàn cờ · xương sống · mạng rối · nan quạt +
  vòng thành · thềm theo đường đồng mức). Thay hằng số `ROAD_CELLS` — một bàn cờ 80 ô dùng chung cho
  cả 15 kỷ, sống từ Phase 6C.
- `networkStyle.js` — **đổi bộ trục**: bỏ `coil` và `ragged` (chỉ đổi được MÉP một đoạn đường, và
  `ragged` chính là thứ Đàm gọi là "lồi lõm"), thêm `plan` · `arms` · `loops` · `tangle` · `diagonal`.
- `roadPath.js` — `boundaryBend` nay **TRA THẲNG** chỗ cung cắt qua ranh giới, không sinh nhiễu băm;
  `roadHalfWidth` **đều tuyệt đối** dọc một hạng đường.
- `cityLayout.js` · `dwellings.js` · `terrain.js` · `cityMoment.js` — mọi phép hỏi mạng đường nay
  nhận `era`. `describeRoadCell` đặt tên theo VAI TRÒ thật của ô (ngã tư · ngã ba · ngõ cụt · vành
  đai), không theo toạ độ.
- `terrain.js` — kỷ 10 (Manchester) nâng `tilt` 0,26 → 0,36; lý do lịch sử có thật (kênh Rochdale
  qua 9 âu thuyền trong 1,6 km giữa lòng thành phố), không phải nới ngưỡng.

**Ảnh hưởng.** 15 kỷ ra **15 mạng đường khác nhau** (29 … 83 ô, trước là 80 cho mọi kỷ) · **3 … 19
giao lộ** mỗi kỷ · mảng "sân lát" 2×2 từ **56 khối (kỷ 13)** xuống **0–4**. Mặt tiền kỳ quan **TỐT
LÊN**: 2/75 → **0/75** kỳ quan không có lối vào. ADR-007 nguyên vẹn (không kỳ quan nào xê dịch).
Nhiều đất trống hơn cho nhà dân: 368 → **371 ô**.

**Tương thích.** Không có migration, không đụng dữ liệu người dùng. ⚠️ **CÓ MỘT LỜI HỨA BỊ MẤT**:
"thành phố Đàm đang có không tự sắp xếp lại sau deploy" (Phase 6C) — mạng đổi thì thứ tự mở đường
đổi, và đổi mạng chính là thứ được yêu cầu. Thứ còn giữ: ở mỗi kỷ, đường vành đai vẫn mở SAU cùng.

---

## 2026-08-24 — Đường phố biết uốn cong, và mạng đường có ba hạng (ADR-058)

**Mục đích.** Đàm: *"đường đi hiện tại chỉ là những đường thẳng, không giống đường ngoài đời, không
uốn cong, và nó cũng như quy hoạch quá… hiện tại ít đường và loại đường quá"*.

**Phạm vi.**
- **MỚI** `src/engine/city3d/networkStyle.js` — bảng 15 kỷ × 4 trục hình thái mạng đường, mỗi dòng
  buộc vào một nước có thật (Çatalhöyük không có đường · Chang'an nhà Đường lưới tuyệt đối ·
  Manhattan Commissioners' Plan 1811 · Alfama trước động đất 1755 · Tokyo dựng lại trên ranh thửa Edo).
- **MỚI** `src/engine/city3d/roadPath.js` — tim đường lượn; độ lệch là thuộc tính của RANH GIỚI nên
  hai ô kề nhau không thể lệch nhau.
- **MỚI** `scripts/road-bend.mjs` — đo độ lượn trên tam giác ĐÃ DỰNG, có `--selftest` 7 mục.
- `streetStyle.js` — hạng đường thứ BA (`ring`, không vỉa hè, không vạch kẻ) cho 36/80 ô vành đai
  vốn đang được vẽ y hệt ngõ phố; `streetCrossSection` đổi từ boolean sang HẠNG.
- `cityLayout.js` — `tier` nay đi theo prop đường (trước bị bỏ lại, nên vành đai vô hình với tầng vẽ).
- `residents.js` — cư dân đi theo chính tim đường ấy, không đi tâm ô nữa.

**Ảnh hưởng.** Mặt đường đổi chỗ **≈47% diện tích của chính nó** (kỷ 6, đo trên mặt nạ `road`).
Lệnh vẽ **KHÔNG đổi** ở cả 15 kỷ. ADR-007 nguyên vẹn — không ô nào xê dịch.

**Tương thích.** Không có migration. Dữ liệu người dùng không đụng tới. Bảng cũ đọc được nguyên vẹn;
`streetCrossSection` vẫn nhận boolean theo đúng nghĩa cũ để không có lời gọi sót nào bị đảo ngược.

---

## 2026-08-24 (tối) — Chân có đầu gối THẬT: giải bằng khớp ngược, 14 kiểu đi, 9 khuôn tròn hơn

**Mục đích**: Đàm ra chỉ thị *"làm sao cho con người có nhiều góc bo tròn, **cử động khớp thật**,
**có thể vẽ thêm tam giác/khối mỗi ngưới tới lúc nó bo tròn**, 3D nhiều hơn, tăng thêm kiểu đi,
chuyển động thật và ít mặt phẳng hơn"* — hai vế in đậm là hai lệnh thu hồi tường minh (cái mẹo
co-gối-giả của ADR-056, và trần 11 khối mỗi người).

**Phạm vi**
- **Khớp ngược** (`humanPose.js` viết lại hoàn toàn): đặt hai bàn chân trong không gian thế giới
  TRƯỚC, rồi `solveTwoBone` suy ngược ra góc đùi và góc gối bằng định lý hàm cosin. Đảo chiều nhân
  quả ấy làm **đai hông được lắc ngang, nghiêng và xoay MIỄN PHÍ** ⇒ **đóng `TECH_DEBT #82`**, và
  làm trường `knee` cùng toàn bộ định lý `sin²` của ADR-056 **biến mất** (tiền đề bị gỡ, bẫy
  Phase 8C). `stretchOf` và `legFactorAt` bị xoá.
- **Cơ thể**: 11 → **16…18 khối**, 3 → **11 khớp** (thêm `pelvis`, `elbowL/R`, `kneeL/R`). Mỗi chân
  nay là đùi + cẳng chân + bàn chân; mỗi tay là cánh tay + cẳng tay + bàn tay.
- **Khuôn**: bộ 8 → **9** (thêm `calf`), mọi khuôn không phải hộp đi từ 8 lên **12 mặt** và 3–6
  **vành**. ⚠️ Số VÀNH mới là thứ quyết định "nhìn có phẳng không", không phải số mặt.
- **Dáng đi**: bảng 9 → **14 kiểu**, 4 → **6 trục** (`lift · flex · sway · twist · headTrack ·
  splay`). Mỗi kỷ một kiểu, buộc vào `country`, cả 14 kiểu đều có người dùng.
- **Khớp hai trục**: `a` ngửa quanh trục ngang-màn-hình, `b` lắc quanh trục đi tới, ghép theo thứ
  tự cố định `Rx(b) · Rz(a)` ở cả tầng thuần lẫn `sceneGraph.js`.

**Ảnh hưởng**: tam giác mỗi người 220…324 → **1.616…1.928** (×6,4); tam giác cả 15 kỷ +4,1%; **+1
lệnh vẽ ở cả 15 kỷ** (khuôn `calf`). Trần khối 11 → **18** và trần tỉ lệ 11% → **30%**, cả hai theo
lệnh tường minh của Đàm kèm bốn căn cứ đo được. ⚠️ **ms mỗi khung CHƯA đo lại** — hộp cát chỉ có
SwiftShader; muốn xác nhận thì `bash scripts/bench-macbook.sh` trên máy Đàm.

**Tương thích**: không đụng dữ liệu người dùng, không đụng sync, không đụng API. Bàn chân đứng yên
tuyệt đối (**4,86 × 10⁻¹⁷ ô** trên 210 tổ hợp) nên ADR-007 (vị trí bất biến) nguyên vẹn.

**Tài liệu**: ADR-057 · `ARCHITECTURE.md` · `PROJECT_STRUCTURE.md` · `PERFORMANCE.md` (Phase 17) ·
`TECH_DEBT.md` (**đóng #82**) · `CLAUDE.md` · `BAN_GIAO.md`.

---

## 2026-08-24 — Cư dân thôi đi như robot: 9 kiểu đi, co gối giả, và khuôn cơ thể hết phẳng

- **Mục đích**: Đàm — *"ít ảnh phẳng hơn, tạo nhiều đặc trưng hơn, di chuyển mượt mà hơn (nhiều
  kiểu di chuyển), mỗi kỷ phải tốt hơn, mỗi người phải ra dáng người hơn và không cử động như
  robot, hình ảnh 3D hơn, đẹp hơn"*.
- **Phạm vi + ảnh hưởng**:
  - `src/engine/city3d/humanGait.js` **MỚI** (thuần): **bảng 9 KIỂU ĐI** — `stride · glide · march
    · mince · trudge · bounce · roll · bustle · saunter`, mỗi kiểu 4 trường (`knee` · `sway` ·
    `twist` · `headTrack`). Trục thứ **12** của bảng con người, buộc vào `country`; không kỷ liền
    nhau nào trùng kiểu.
  - **CO GỐI GIẢ** (`stretchOf` trong `humanPose.js`): mesh cứng không gập được, nên chân đưa bị
    **rút ngắn**. Đây là nguyên nhân gốc của dáng "robot" — một chân cứng dài đúng `legLen`
    **quệt đất** ở giữa pha đưa, và đó là định nghĩa toán học của dáng com-pa.
  - Hệ số phải là **`sin²` chứ không phải `sin`**: bản `sin` làm bàn chân **trượt ở mọi
    `knee < 1`**. Ngưỡng `knee ≥ 0,5` là một **định lý**, không phải một con số chọn tay (chứng
    minh + đối chứng dựng lại bản hỏng, xem ADR-056).
  - **Ba chiều chuyển động nữa, tốn 0 khối và 0 lệnh vẽ**: thân/đầu nghiêng sang bên (`sway`), vai
    xoay ngược chiều hông (`twist`), đầu bù lại cái nhún (`headTrack`, giá trị âm ở kỷ 6 = đầu nhún
    mạnh hơn thân).
  - **Khuôn `chest` MỚI** cho thân và áo may đo; mọi khuôn cong nay có **≥1 điểm uốn**. Lý do:
    **số VÀNH** quyết định "phẳng hay không", không phải số mặt — khuôn 2 vành cho đúng MỘT dải
    sáng dọc dù `sides` bằng bao nhiêu.
- **Số**: tam giác mỗi người **220…324 → 476…628**; **khối mỗi người vẫn 9…11** (trần Đàm đặt còn
  nguyên); **lệnh vẽ +1 ở CẢ 15 kỷ** (đúng bằng khuôn `chest` mới); tổng tam giác 15 kỷ **+5,0%**.
  Trần tỉ lệ nâng **6% → 11%** kèm bốn bằng chứng đo được, ca xấu nhất **kỷ 1 = 9,68%**. Bàn chân
  nâng lúc đưa chân **5%…34%** chiều dài chân tuỳ kiểu đi, đúng thứ tự `knee`.
- **Tương thích**: không có migration. `lowDetail` giữ nguyên mô hình 2 hộp (nó là **đối chứng**
  của mọi phép đo dáng đi). Ba bất biến cũ còn nguyên ở mức sai số máy: bàn chân không trượt, bàn
  chân chạm đất lúc trụ, góc hông không vượt trần.
- **Giới hạn nói thẳng**: `ms` mỗi khung **chưa đo lại** (hộp cát chỉ có SwiftShader) ⇒ 11% là trần
  theo tỉ lệ hình học, không phải lời hứa về tốc độ. Hông chưa lắc ngang và đai hông chưa xoay
  (`TECH_DEBT #82`) vì bộ khớp chỉ có một trục quay.

---

## 2026-08-23 (tối) — Cơ thể cư dân thôi là chồng gạch: 7 khuôn mặt tròn xoay, mỗi kỷ một bộ

- **Mục đích**: Đàm — *"làm cho chân thật nhất, ít ô vuông hơn và giống 3D hơn, làm kỹ từng kỷ"*.
- **Phạm vi + ảnh hưởng**:
  - `src/engine/city3d/humanShape.js` **MỚI** (thuần): bộ **7 khuôn** dựng bằng mặt tròn xoay —
    `box` · `prism` · `limb` · `flare` · `cone` · `dome` · `hat`. Một hộp cho mắt **3 mảng sáng**,
    một lăng trụ 8 mặt cho **8** ⇒ khối đọc ra là khối. Chọn khuôn theo câu hỏi vật lý *"bộ phận
    này thon về phía nào"*, không theo thẩm mỹ.
  - Quy ước **"mặt phẳng = 1,0"** (`R = 0,5/cos(π/sides)`) nên độ trải x/z **đúng bằng hộp cũ** ⇒
    `partCornersAt`/`silhouetteSpanX`/`human-scale.mjs` và toàn bộ bảng tỉ lệ cơ thể **không phải
    hiệu chuẩn lại một con số nào**. `sides = 4` qua cùng công thức tái tạo **chính xác** hộp đơn vị.
  - **Bàn chân là khối mới** (giữ khuôn `box` có chủ ý): nó che mặt cắt vuông góc từng ngửa lên
    bắt nắng ở cuối cẳng chân, và thêm một mấu nhô về phía trước cho hình bóng.
  - **Nón lá kỷ 6 thu từ 2,2 xuống 1,71 `headW`** — bản đầu giữ 2,2 với lý lẽ *"đo theo đầu thì
    đúng"*, ảnh dựng bác bỏ ngay (cái mũ nuốt trọn người, 65% chiều cao khung → nay 50%). Mũ vành
    **giữ 1,9** vì chỏm phải lồng vừa sọ — một bài test bắt được lúc tôi thử thu nhỏ nó.
  - **Sửa một ngân sách lạc hậu 5,4 lần theo hướng SIẾT**: chú thích trong `human.js` tính trần
    "136 tam giác mỗi người" từ mẫu số kỷ 1 = 19.434, trong khi kỷ 1 nay là **104.958** (Phase 14
    §1(3)). Trần thật là **319**. Loại lạc hậu này im lặng vĩnh viễn vì nó không làm gì hỏng.
  - **Sửa một hằng số ngân sách lệnh vẽ sai +1 ở CẢ 15 KỶ** kể từ ADR-053: bài test so **một công
    thức với một bảng suy từ chính công thức ấy** — một cái gương, không phải một cái cân. Nay
    bảng được neo vào **ba phép đo Chromium độc lập**.
  - Danh sách ngoại lệ của phép đo dáng đi **cạn hẳn**: `[6, 7]` → `[6]` → **`[]`**.
- **Tương thích**: **tam giác mỗi người 108 → 220…324** (ca xấu nhất kỷ 1 = 5,40% trên trần 6%) ·
  **lệnh vẽ +2…+5 mỗi kỷ** (cư dân tiêu đúng `số khuôn − 1`). Chấp nhận theo lời Đàm 2026-08-21
  (*"không quan trọng hiệu năng"*). Người dùng không phải làm gì.
- **Số**: xem `BAN_GIAO.md` cùng ngày. Chi tiết quyết định: **ADR-055**.

---

## 2026-08-23 (chiều) — Con người có bản sắc ở đủ 15 kỷ; và một cái nón lá màu đen đã tố cáo hai lỗi

- **Mục đích**: hoàn tất `TECH_DEBT #78` (14/15 kỷ còn dùng chung một mốc người phổ thông), rồi
  **nhìn bằng mắt** thay vì dừng ở cổng số.
- **Phạm vi + ảnh hưởng**:
  - `humanStyle.js`: **15/15 dòng được thiết kế thật**, không kỷ nào còn trỏ preset. Mỗi dòng buộc
    vào `country` mà `eraStyle.js` khai, kèm `note` giải thích. Chấm được: 105/105 cặp kỷ khác nhau,
    yếu nhất 5/9 trục, trung vị 8/9; và 105/105 cặp khác nhau ở ít nhất một thứ **mắt đọc được**.
  - **Sửa một lỗi ĐANG CHẠY TRÊN PRODUCTION** (ADR-054): trong `palette3d.js`, tham số `era` bị đổi
    tên rồi bị một biến MÀU cùng tên che khuất, nên `getFloraStyle`/`getHumanStyle` nhận một object
    màu và rơi về kỷ 1 ⇒ **15 kỷ dùng chung một màu lá và một màu vải**. Mảng "mỗi kỷ một `leafHue`"
    của Phase 8D chưa từng chạy thật. Không cổng nào đỏ; nó chỉ lộ ra khi dán 15 cư dân cạnh nhau.
  - **Tách vai màu `straw`** khỏi `cloth2` + trục bảng `headMaterial` (ADR-054): nón lá kỷ 6 đi từ độ
    đậm **0,170 lên 0,879**; sáu kỷ sợi mộc được sửa, bốn kỷ vải nhuộm giữ nguyên vì tối là đúng.
  - Sửa hai hàm đo trong `humanIdentity.test.js` tìm bộ phận theo **vai màu** — mũ trụ kỷ 12 cũng
    mang vai `gear` nên trục "đồ mang" của kỷ ấy xưa nay đo nhầm cái mũ thay vì khẩu súng.
  - Công cụ mới `scripts/human-strip.mjs`; nợ mới `TECH_DEBT #79` (vai `gear` gánh ba vật liệu).
- **Tương thích**: **tam giác và lệnh vẽ không đổi một đơn vị**. Người dùng không phải làm gì.
- **Số**: 1113 bài nhanh (1112 xanh, 1 bỏ qua có chủ đích) + 3 bài đối chiếu chéo · lint sạch · build OK.

---

## 2026-08-23 — Dọn ba thứ trước khi deploy: bài test đỏ vĩnh viễn, luật gộp `main`, và một lý do đi sau con số

- **Mục đích**: ba việc dọn dẹp, không thêm tính năng. Cả ba đều là *"thứ đang sai mà không có gì
  đỏ lên"*.
- **Phạm vi + ảnh hưởng**:
  - `src/hooks/useTimer.test.js` **vào repo lần đầu** (1273 dòng, 41 bài). Nó vốn nằm ngoài git từ
    một phiên trước và **đỏ vĩnh viễn**: chờ cứng `advance(500)` trong khi `BREAK_START_DELAY_MS`
    đã được nâng lên **3200 ms**. Mã đúng, phép đo già đi. Nay bài ấy đọc thẳng hằng số sản phẩm và
    **ghim CẢ HAI phía ngưỡng**. Hook lớn nhất dự án (1408 dòng) từ chỗ **không có test nào trong
    repo** nay có 41 bài. Bộ test: **1107 bài · 1106 xanh · 0 đỏ · 1 bỏ qua có chủ đích**.
  - `CLAUDE.md` — luật gộp `main` đảo chiều theo quyết định của Đàm ngày 2026-08-22: nhánh phụ thì
    **TỰ gộp rồi push, không hỏi**; chỉ dừng hỏi khi gỡ xung đột đòi vứt bỏ công của phiên khác;
    vẫn phải **báo rõ đã đưa lên production những gì ngoài phần việc của mình**.
  - `humanStyle.js` + ADR-053 — đính chính `stature: 1.18` của kỷ 1. Chú thích cũ gọi nó là *"sự
    thật nhân chủng học"*; đo lại thì **hướng** suy được từ nguồn nhưng **độ lớn thì không** (tỉ số
    thật ~1,07–1,10; 1,18 lớn gấp ~1,7 lần). Giữ nguyên giá trị, **đổi nhãn** thành phóng đại có
    khai báo. Không đổi một điểm ảnh nào.
  - `TECH_DEBT #78` — đo iPhone thay vì suy đoán. Khung 3D thật **324×201**, cư dân **6,0 px**,
    **10/11 trục bản sắc không đọc ra được**, dáng đi chỉ đổi **0,6 px**. Và ngay trên MacBook,
    **búi tóc 2,7×2,5 px cũng đã dưới ngưỡng mắt 4 px**.
- **Tương thích**: không đổi API, không đổi dữ liệu, không đổi hình ảnh. Chỉ test + tài liệu + một
  khối chú thích.

## 2026-08-24 — Phase 20: BỎ LƯỚI CỨNG, bộ xương thành phố SINH THEO KỶ (ADR-066)

- **Mục đích**: Đàm nhìn bản quét rồi nói *"nhà vẫn quy hoạch rất kỳ quặc, rất bài bản và xếp chồng
  lên nhau"* · *"cho tôi một sự sắp xếp thành phố ngẫu nhiên và mang tính đặc thù, không phải cứ
  3x3 được, nó phải nhiều thứ và đa dạng hơn"*. Chẩn đoán: cả 15 kỷ dùng **chung một bộ xương**
  (`ROAD_LINES = {0,4,8,11}` + 5 khu kỳ quan 3×3), và **không thứ nào trong đó phụ thuộc kỷ**. Mọi
  phase trước đều sửa thứ nằm TRONG một ô nên bộ xương chưa bao giờ đổi — mà bộ xương mới là thứ
  mắt đọc ra ĐẦU TIÊN khi nhìn từ trên cao.
- **Phạm vi**:
  1. **`city3d/networkStyle.js` (BẢNG)** — 15 kỷ × 5 trục: `plan` (`organic`/`axial`/`grid`) ·
     `parcels` (6…14 thửa) · `sizeVary` (0,05…0,86) · `ring` · `minSide`. Mỗi dòng buộc vào
     `country` mà `eraStyle.js` khai, có test bắt. ⚠️ *"Kỳ quan chọn thửa nào"* và *"bao nhiêu thửa
     để trống"* **cố ý KHÔNG có cột riêng** — cái đầu suy từ `plan`, cái sau suy từ số thửa dôi ra;
     một cột riêng sẽ cho phép khai những tổ hợp vô nghĩa (`grid` + "gần nước nhất") mà không gì bắt.
  2. **`city3d/cityPlan.js` (HÌNH)** — **chia đôi đệ quy lệch tâm (BSP)** ra danh sách THỬA ĐẤT.
     Chọn BSP chứ không Voronoi vì ranh giới Voronoi XIÊN, mà cả tầng dựng mặt đường chỉ nói được
     tiếng "ô thẳng trục" — BSP tái dùng nguyên tầng ấy.
  3. **Đường là RANH GIỚI THỬA, không phải hàng và cột** — và nó là **HỆ QUẢ, không phải một cột
     của bảng**: mỗi nhát cắt chừa lại một hàng/cột làm lối đi ⇒ số ô đường tự đi từ hằng số **80**
     sang **34…92 tuỳ kỷ (trung bình 59,7)**, không ai phải chọn tay 15 con số.
  4. **Kỳ quan CHIẾM THỬA**, không còn khu 3×3. `BUILDING_ZONES` · `ROAD_LINES` · `ROAD_MAIN_AXIS` ·
     `ROAD_CROSS_AXIS` · `RING_LOW`/`RING_HIGH` **đã xoá hẳn**; `cityGrid.js` nay chỉ còn đúng một
     câu (`CITY_GRID_SIZE = 12`).
  5. **ADR-007 khoá bằng hai bài**: gọi kèm **dữ liệu rác** (`built`/`sessionCount`/`buildings`) đòi
     kết quả trùng từng byte, và **liệt kê đủ 1…120 phiên × 15 kỷ**.
  6. **Nghiệm thu bằng số, không bằng mắt**: độ đối xứng bốn chiều của ô kỳ quan **100,0% → tối đa
     20,0%** (và **9,6%** nếu bỏ ba kỷ `grid`, nơi đối xứng là ĐÚNG). Thang lấy 0% là mức trùng hợp
     ngẫu nhiên, và nó tự nghiệm thu: thứ vốn đối xứng hoàn hảo đo ra đúng 100,0%.
- **Ảnh hưởng — MỘT CÁI GIÁ PHẢI ĐÀM QUYẾT, KHÔNG PHẢI TÔI**: bộ xương mới **DỜI công trình đã xây**.
  Không kiểm được bản lưu thật của Đàm từ hộp cát này (Supabase bị proxy chặn), nhưng theo bản quy
  hoạch mới thì **75/75 công trình (5 mỗi kỷ × 15 kỷ) sẽ đổi chỗ**. ADR-007 chỉ hứa *"từ nay không
  dời"*; việc đổi bộ xương thì tự nó là một lần dời. Ghi ở phần Trade-off của ADR-066.
- **Phụ**: trục CHẶNG NGÀY của bản quét **11,33 → 12,44** (qua lại ngưỡng mắt 12, 0/15) và trục KỶ
  **19,18 → 21,77** · trung vị **36,31 → 38,48** (0/105). ⚠️ Nhưng `TECH_DEBT #89` **VẪN MỞ**: tách
  ba dải cho thấy toàn bộ phần tăng nằm ở dải ĐẤT (+2,37), còn **dải TRỜI — cái cần gạt đã nêu đích
  danh — gần như không nhúc nhích** (4,12 → 4,05) và dải THÀNH PHỐ còn **tệ đi** (6,51 → 5,56).
  Cổng qua nhờ một dải chẳng liên quan; đó không phải lời giải cho #89.
- **Tương thích**: không đụng state, không đụng schema, không migration. Chỉ tầng bố cục + hình ảnh.

## 2026-08-24 — Phase 19: khối kiến trúc, bóng đổ, khung hình (ADR-062/063/061)

- **Mục đích**: Đàm nhìn kỷ 1 · 2 · 14 và nói *"đường có nét đứt trông giả tạo kinh khủng · kim tự
  tháp không có khối hình chóp"*, cộng một yêu cầu cũ chưa làm: *"hiệu ứng hơn, ánh sáng đổ bóng…
  giống 3D hoá hơn nữa"*. Sáu việc.
- **Phạm vi**:
  1. **Đường nét đứt** — bisect trước, đoán sau.
  2. **Nguyên mẫu thứ 8 `monolith`** (ADR-062): công trình LÀ khối, không phải nhà đội mái. Kỷ 2 ra
     chóp TRƠN (tỉ lệ Giza 0,64), kỷ 3 ra GIẬT CẤP có cầu thang chính diện. **Đóng `TECH_DEBT #75`.**
  3. **Bóng đổ nét hơn**: bản đồ bóng máy bàn 2048 → **4096** (điện thoại GIỮ 512 — 4096² là 64 MB
     texture, iOS Safari giết tab vì thứ đó). ⚠️ Nửa sau của chỉ thị — *"siết khung bóng xuống phạm
     vi thành phố"* — **đã đo và bác bỏ**: `reach` (9,00) ĐÃ LÀ phạm vi thành phố, khối đổ bóng xa
     nhất ở 8,48 ⇒ dư 6%, siết thêm là cắt cụt bóng nhà ở góc lưới.
  4. **Che khuất môi trường (AO)** (ADR-063): nướng vào MÀU ĐỈNH ⇒ **0 lệnh vẽ, 0 tam giác** thêm.
     Điều kiện dừng của Đàm (*"ảnh ngả trắng bệch thì BỎ NGAY"*) **không kích hoạt** — sàn độ sáng
     đi XUỐNG, dải tương phản NỞ RA.
  5. **Nóc nhà thôi bị mép khung cắt** (ADR-061): khoảng cách camera nay tính RIÊNG TỪNG KỶ, bằng
     đúng mức tối thiểu để không cắt gì. **0/15 kỷ bị cắt** (trước 14/15). **Đóng `TECH_DEBT #24`**,
     mở từ Phase 7B.
  6. **Quét lại 15 kỷ**: **105/105 cặp kỷ ĐẠT** (gần nhất 19,18 · trung vị 36,31).
- **Ảnh hưởng — VÀ MỘT CÁI GIÁ PHẢI NÓI THẲNG**: trục CHẶNG NGÀY của bản quét tụt **14,39 → 11,33**,
  lần đầu xuống dưới ngưỡng mắt 12. Đã **tách một biến** để biết ai tiêu tiền: cây có đủ 4 việc mỹ
  thuật nhưng hoàn tác riêng khung hình ra **14,23** ⇒ bốn việc kia tốn 0,16, **2,90 là của riêng
  phép lùi khung**. Nguyên nhân là pha loãng (`TECH_DEBT #22`), không phải 15 kỷ giống nhau hơn.
  ⇒ Ghi thành `TECH_DEBT #89` với **ba hướng cho Đàm chọn**; không tự chọn, không nới ngưỡng.
- **Tương thích**: không đụng state, không đụng schema, không migration. Chỉ tầng hình ảnh.

---

## 2026-08-22 — Cư dân có KHỚP XƯƠNG, và kỷ 1 có bản sắc con người riêng (ADR-053)

- **Mục đích**: cư dân cũ là **hai cái hộp** cộng một cái nhún hình sin — không có gì để nhìn, và
  15 kỷ đi bộ giống hệt nhau. Dựng lại thành một cơ thể có khớp hoạt động, đồng thời mở khung bản
  sắc con người cho cả 15 kỷ (Đàm yêu cầu **hoàn thiện kỷ 1**, khung dựng sẵn cho 14 kỷ còn lại).
- **Đo TRƯỚC khi dựng (Giai đoạn 0)**: trên khung 3D thật **990×614** của MacBook Air M3, cư dân kỷ
  1 cao **18,3 px** (trung vị) — đủ để đọc *hình bóng đang đổi*, không đủ để đọc *"kia là cánh
  tay"*. Trên iPhone (324×201) chỉ **4,4–9,6 px**, đầu người **1 px**: Đàm chọn nhắm riêng MacBook.
- **Phạm vi**: thêm `src/engine/city3d/humanStyle.js` (bảng 15 kỷ × 11 trục) · `human.js` (thư viện
  hình: 7 trang phục, 7 kiểu đội đầu, 6 đồ mang theo) · `humanPose.js` (dáng đi) và ba file test đi
  kèm; `residents.js` trả `travelled` thay cho `bob` và lấy tốc độ đi từ bảng kỷ; `palette3d.js`
  thêm 4 vai màu (`cloth`/`cloth2`/`hair`/`gear`); `sceneGraph.js` gộp hai `InstancedMesh` cũ thành
  **một** trên hộp đơn vị 1×1×1; công cụ đo mới `scripts/human-scale.mjs` + cờ `--t` / `--lowdetail`
  cho `city-preview.mjs` + cờ `--probe` cho `scripts/shot.mjs`.
- **Ảnh hưởng**: số lệnh vẽ cả cảnh **GIẢM 11 → 10**. Tam giác cư dân **672 → 3.024** =
  **2,03% tổng cảnh** (trần Đàm đặt 6%) và **2,88% riêng phần thành phố**. Dáng đi làm hình bóng
  đổi **18%** theo phép chiếu và **0,73× → 1,89×** tỉ lệ rộng/cao theo phép đo trên ảnh thật — cả
  hai kèm đối chứng mô hình 2 hộp (0,0083 px và 1,0000 ± 0,00%). Kỷ 1 khác mốc phổ thông **10/11
  trục**. `lowDetail` quay về **đúng** mô hình 2 hộp cũ; `still` giữ nguyên (không có cư dân).
- **Tương thích**: không đụng dữ liệu lưu — dân số vẫn **suy ra** từ tiến độ, thêm **0 byte** vào
  khối JSONB. Không thêm thư viện, không GLTF, không skinning. Tầng engine vẫn thuần.
- **Còn lại**: 14/15 kỷ vẫn dùng chung preset `mocPhoThong` — mở thành `TECH_DEBT #78`, và bài test
  in ra `[humanStyle] đã thiết kế thật: 1/15 kỷ` mỗi lần chạy `npm test` để con số ấy không lặng lẽ
  bị đọc thành "xong rồi".

---

## 2026-08-21 — Phase 14 §1(3): một ô không phải một căn nhà, một ô là một KHU PHỐ (ADR-052)

- **Mục đích**: Đàm nói *«mọi thứ hiện tại trông vẫn nhỏ, thành phố không mở rộng mà chỉ là cụm
  nhỏ»*. Số học của `cityGrid.js` cho biết vì sao: `ROAD_LINES = {0, 4, 8, 11}` ⇒ **80/144 ô là
  đường (55,6%)**, cộng khu kỳ quan ⇒ chỉ ~30 ô xây được nhà dân, và cả 15 kỷ đã chạm trần ấy từ
  lâu. «Thêm nhà» là điều **bất khả** nếu không dời ô (ADR-007 cấm) hay nới lưới.
- **Phạm vi**: hai file mới theo khuôn ba lớp lần thứ **CHÍN** — `city3d/blockStyle.js` (BẢNG 15 kỷ:
  cols · rows · attach · alley · storey · vary · gableToStreet, mỗi dòng buộc vào `country`) và
  `city3d/block.js` (HÌNH: đo hình chiếu đáy thật rồi chia thành 4–10 đơn vị). `buildingSpec.js`
  nhận thêm tham số tuỳ chọn `plot` (co giãn hình chiếu đáy + mặt nạ tường chung) và
  `cityParts.js` gọi `buildBlockSpec` cho mỗi ô nhà dân. Bảng và hình đều KHÔNG đụng bố cục.
- **Ảnh hưởng**: khối nhà dân nhìn thấy **371 → 1.812** (×4,88) ở 15 kỷ · 80 phiên. Tam giác cả
  cảnh 2.425.912 → 3.090.464 (×1,274) — vẫn sâu trong vùng rẻ. **Lệnh vẽ không đổi một đơn vị ở
  cả 15 kỷ.** Thời gian dựng cảnh ×1,086 (trần 1,25×). Ảnh `--width 1500` đổi 6,0–10,9% điểm ảnh
  vượt ngưỡng mắt. Cổng chống-trôi bản quét vẫn ĐẠT 0/15 + 0/105.
- **Mặt trái đã đo**: mỗi CĂN nhà chỉ còn **45% bề ngang cũ** (0,907 → 0,406 ô); cột `storey` bù
  lại theo chiều cao nên mỗi Ô cao thêm 7,0%. Trục chặng ngày tụt **15,36 → 14,39**, cú tụt
  một-phase lớn nhất từ trước tới nay, còn cách mốc «< 14» của Đàm đúng **0,39**.
- **Tương thích**: KHÔNG có migration. ADR-007 nguyên vẹn — có bài test liệt kê **1…120 phiên ×
  15 kỷ** (≥ 30.000 phép so) khoá mô tả hình học khớp từng byte, và luật *"chỉ thêm, không bao giờ
  dời"* được giữ bằng cách cho cụm mọc quanh chỗ căn nhà cũ đứng.

## 2026-08-21 — Phase 14 §1(2): kim tự tháp có hình chóp, ziggurat có thềm (ADR-051)

- **Mục đích**: Đàm nhìn kỷ 2 rồi nói *«kim tự tháp không có khối hình chóp»*. Câu hỏi đúng không
  phải *"vá kỷ 2 thế nào"* mà là *"bộ từ vựng mái có đủ giàu để 15 kỷ nói ra 15 câu khác nhau
  không?"* — và câu trả lời đo được là **CÓ ở kỳ quan, KHÔNG ở nhà dân**.
- **Nguyên nhân gốc**: kỷ 2 (Ai Cập) khai `roof: 'cone'`, mà `cone` là một lăng trụ **8 cạnh** thu
  về đỉnh ⇒ render ra một cái lều rạp xiếc, không phải kim tự tháp. Giá trị `pyramid` (4 cạnh) đã
  tồn tại sẵn trong bảng nhưng chỉ có kỷ 9 dùng. Kỷ 3 (Ur) thì dùng chung `stepped` với kỷ 11
  (setback cao ốc New York 1916) — mà `stepped` thu vào từ **mép MÁI** (rộng hơn tường) nên bậc đầu
  tiên không tạo ra cái thềm nào đọc được.
- **Phạm vi**: `ROOF_KINDS` mở rộng **9 → 10** giá trị (thêm `ziggurat`); kỷ 2 → `pyramid` (kèm
  `landmark: 'kim tự tháp Giza'`); kỷ 3 → `ziggurat` với `case` hình học mới (ba thềm thu vào theo
  tỉ lệ **THÂN NHÀ**, mặt tường nghiêng `taper 0,88`, đền thờ trên đỉnh mang vai `trim` đã có sẵn ở
  kỷ ấy). `mastaba` **cố ý KHÔNG thêm** — không kỷ nào sở hữu nó ⇒ sẽ là từ vựng chết.
- **Ảnh hưởng**: **lệnh vẽ không đổi (14/14)** vì không thêm họ vật liệu nào. Tam giác cả cảnh
  (`KHO=… node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs`, `SESSIONS=80
  HOUR=12 LEVEL=3`): kỷ 2 138.824 → **138.978** (+154 · +0,11%) · kỷ 3 144.528 → **144.836**
  (+308 · +0,21%) · **13 kỷ còn lại không đổi MỘT ĐƠN VỊ** — đó vừa là kết quả vừa là đối chứng
  cho chính phép đo. Nhìn bằng mắt (`sweep-diff --frame` so với `0fbd47f`): kỷ 2 đổi **4,6%** điểm
  ảnh vượt ngưỡng mắt (lệch trung bình **54,62**), kỷ 3 **4,3%** (**97,27**).
- **Tương thích**: không migration, không đụng state/Supabase/ADR-007.
- **Lưới an toàn mới**: 5 bài trong `buildingSpec.test.js` (1017 → **1022** bài). Hai bài canh hình
  của kỷ 2 và kỷ 3 bằng **quan hệ** chứ không bằng mức (chóp phải rộng hơn thân, độ dốc trong
  0,40–0,90 — Giza thật 0,637; thềm phải thu vào từ mép THÂN và hẹp dần đơn điệu). Ba bài canh chính
  cái BẢNG: không giá trị chết · mọi kiểu phải dựng ra hình RIÊNG (so dấu vân tay với nhánh
  `default`) · bảng không được dẹt.
- **Nợ ghi ra**: `TECH_DEBT #75` (tỉ lệ mái/thân kỷ 3 mới 34,6% ⇒ vẫn đọc ra "cao ốc đội mũ"; đó là
  bài toán KHỐI TÍCH, không phải bài toán mái) · `TECH_DEBT #76` (mái NHÀ DÂN chỉ 3 giá trị cho 15
  kỷ, phải gộp vào §1(3)).

---

## 2026-08-21 — Phase 14 §1(1): mạng đường thôi đứt nét — 13,9–34,4% mặt đường chưa từng được vẽ (ADR-050)

- **Mục đích**: Đàm nhìn kỷ 1 và kỷ 2 rồi nói *«cái đường có nét đứt trông giả tạo kinh khủng»*.
  Bisect trước, sửa sau: nét đứt **có sẵn ở `main` (`d72c033`)** — VIỆC B vô can, nó chỉ làm khuyết
  tật dễ thấy hơn.
- **Nguyên nhân gốc**: `FrontSide` (mặc định của three) vứt mọi tam giác xếp NGƯỢC CHIỀU. Hàm
  `dai()` dựng bốn cánh tay lòng đường, trong đó cánh **TÂY** chạy từ giá trị lớn xuống giá trị nhỏ
  và cánh **NAM** chạy theo trục `v` — cả hai cho ra chiều quay úp, nên bị cắt sạch. Khúc hiện ≈
  khúc mất ≈ nửa ô, đúng hình dạng một nét đứt.
- **Phạm vi**: một hàm duy nhất — `quad4` trong
  `src/components/city/render3d/terrainMesh.js` nay tự chuẩn hoá chiều quay bằng diện tích có dấu.
  Không đổi bảng nào, không đổi engine, không thêm lớp mới.
- **Ảnh hưởng**: diện tích mặt đường **nhìn thấy được** đi từ **80,8% → 100,0%** trên 15 kỷ (kỷ 1:
  65,8% → 100% · kỷ 2: 71,5% → 100%). **Hình học không đổi một chữ số**: tổng diện tích trùng tới
  ba chữ số thập phân ở cả 15 kỷ, số tam giác và số lệnh vẽ trùng từng đơn vị.
- **Tương thích**: không có migration. Không đụng state, không đụng Supabase, không đụng ADR-007.
- **Lưới an toàn mới**: `terrainMesh.test.js` thêm bài *"MỌI TAM GIÁC NẰM NGANG PHẢI NGỬA MẶT LÊN
  TRỜI"* — duyệt cả 15 kỷ, cả tấm đất lẫn tấm đường, có gác chạy-rỗng và gác "đủ bốn phía". Bài này
  **ĐỎ ở cả 15 kỷ trên mã chưa vá** (5.492 tam giác) và xanh sau khi vá.

---

## 2026-08-21 — Phase 13 VIỆC B: vùng phụ cận của đô thị (ADR-049)

- **Mục đích**: làm thành phố đọc ra là **một NƠI LỚN**, không phải một cụm nhà đẹp. Vòng trước đã
  lấp vành ngoài bằng cây cối và Đàm **vẫn nói thành phố nhỏ** — đó là dữ liệu, không phải ý kiến:
  thảm thực vật không mang tín hiệu quy mô. Thứ đọc ra "nơi lớn" là **dấu vết CON NGƯỜI trải ra
  ngoài**: ruộng có bờ, kênh mương, thành luỹ có cổng, con đường đi khỏi khung hình, xóm vệ tinh,
  bến cảng, đường sắt, cần cẩu.
- **Phạm vi**: hai file engine mới — `src/engine/city3d/hinterlandStyle.js` (BẢNG 15 kỷ × 9 trục,
  buộc vào `country` của `eraStyle.js`, `isValidHinterland` **từ chối thẳng** dòng sai) và
  `src/engine/city3d/hinterland.js` (12 loại hình học). `outskirts.js` / `sceneGraph.js` **chỉ
  ĐỌC**. Khuôn ba lớp lần thứ **TÁM**. Thêm lớp mặt nạ `hinterland` để đếm tách khỏi `city`. Công cụ:
  `sweep-diff.mjs --chi <mặt nạ>:<kênh>`, phần thuần chuyển sang `sweepMetric.mjs` để test được.
- **Kết quả đo** (TRƯỚC `e455114` ↔ SAU `8bc80ab`, cùng một dòng lệnh, ảnh đã kiểm mốc thời gian):
  - **(G1)** dấu vết người ngoài lưới **0 → 2241 vật** (1697,6 ô²) và **0,00% → 4,22%** khung hình;
    tương phản trong vùng ấy **44,7–93,0** trên ngưỡng mắt 12 ⇒ **15/15 kỷ đọc ra được** (yêu cầu
    8/15). Hai mặt nạ độc lập khớp nhau trong **1,96** (16% ngưỡng mắt).
  - **(G2)** dải xa nhất còn tấm đất (dải 2) **21,56% → 32,81%**, tăng ở **15/15 kỷ**; bướu chiều sâu
    bẹt lại (đỉnh ÷ dải 2: 2,84 → **1,92**).
  - **(G3)** (M1) cả khung **37,18% → 41,43%**, tăng ở **15/15 kỷ**.
  - Δ của (M1) **bằng đúng** tỉ lệ điểm ảnh của riêng lớp `hinterland` ở cả 15 kỷ ⇒ không một điểm
    ảnh nào trong lưới dịch chuyển (ADR-007 xác nhận ở tầng điểm ảnh).
  - Cổng CPU dựng cảnh **1,067×** (trần 1,25×) · chống trôi bản quét 15/15 + 105/105 · lint sạch ·
    build xanh · `test:fast` **1016 bài, 0 fail, 1 skipped**.
- **Ảnh hưởng**: +1 lệnh vẽ ở 4 kỷ (5·7·8·9, do họ vật liệu `water`) — ngân sách lệnh vẽ nay là dữ
  liệu theo dõi chứ không còn là hàng rào (§0 của chỉ thị). Vùng phụ cận **không vào `blockers`** nên
  camera cận cảnh không né nó (kế thừa `TECH_DEBT #54`). Mở `TECH_DEBT #74`: vùng phụ cận là tầng
  ĐỊA LÝ nên **không lớn lên theo số phiên** — tín hiệu quy mô nằm ngoài vòng lặp phần thưởng.
- **Tương thích**: không đổi state, không migration, không đụng DB. Bố cục trong lưới bất biến.

## 2026-08-21 — Phase 13 §2–§3: đo mốc nền «quy mô», hai điều kiện DỪNG kích hoạt

- **Mục đích**: trước khi làm thành phố "rộng hơn, quy mô hơn", dựng cho xong hai phép đo sẽ dùng
  để chấm việc ấy, và chạy phép kiểm bắt buộc mà chỉ thị đặt ra trước khi đụng vào mã.
- **Phạm vi**: **KHÔNG sửa một dòng mã sản phẩm nào của thành phố 3D.** Thêm `countBands` +
  `--bands N` vào `scripts/mask-count.mjs`; thêm `scripts/maskCount.test.js` (5 bài, 4 phép phá đều
  đỏ đúng chỗ đã nêu trước); cập nhật `PERFORMANCE.md`, `TECH_DEBT.md`, `BAN_GIAO.md`.
- **Kết quả đo**: mốc nền (M1) "dấu vết con người" = **36,84%** khung hình (15 kỷ). Hồ sơ chiều sâu
  6 dải là một cái bướu **0,41 · 21,37 · 60,96 · 60,31 · 47,49 · 30,36** — dấu vết con người mất hẳn
  ở cả hai đầu. **0/446** công trình + nhà dân + đường của cả 15 kỷ nằm ngoài lưới 12×12.
- **Ảnh hưởng**: hai việc đã lên kế hoạch đều phải chờ quyết định — khu 3×3 quanh kỳ quan hoá ra giữ
  chỗ cho **hình chiếu đáy** chứ không cho một ô (225/225 công trình tràn ra ngoài ô neo), và cổng
  (M2) đã đạt sẵn 15/15 ở mọi mức sàn nên không phân biệt được trước với sau. Xem `TECH_DEBT` #71,
  #72, #73.
- **Tương thích**: không đổi hành vi sản phẩm, không migration, không đụng state/DB.

## 2026-08-21 — Nhớ lại giá trị nút lưới nhiễu: vá một **hồi quy hiệu năng 1,7 lần** do ADR-046 (ADR-048)

**Mục đích.** Ngay sau khi ship bản "xoá cái bệ", mấy việc đo chạy nền trả về một con số không ai
chờ: `sceneStats.test.js` đi từ **564 lên 827 giây**, dựng cảnh đủ 15 kỷ từ **40,9 lên 69,3 giây**.
Không cổng nào đỏ — dự án có ngân sách TAM GIÁC và LỆNH VẼ, không có ngân sách THỜI GIAN DỰNG.

**Phạm vi.** Sửa: `src/engine/city3d/noise.js` (nhớ lại giá trị từng nút lưới + `thongKeNho()`).
Mới: `src/engine/city3d/noise.test.js` (8 bài, cả 8 đã thử-cho-đỏ). Tài liệu: `PERFORMANCE.md`
(mục mới về trục chi phí này), `TECH_DEBT.md` (#70), `ARCHITECTURE_DECISIONS.md` (ADR-048),
`PROJECT_STRUCTURE.md`, `CLAUDE.md`, và con số "~70–90 giây" trong `scripts/sceneTriCross.test.js`
(nay ~25 giây). **KHÔNG đụng một dòng nào của `terrain.js` / `horizon.js`.**

**Ảnh hưởng.** Lưới chân trời 66,41 → **20,18 giây** (nhanh hơn cả mốc trước ADR-046 là 33,52 giây);
lưới mặt đất 3,02 → **1,30 giây**; `npm test` 860 → **278 giây**.

**Tương thích.** **Không đổi một con số nào** — đã chứng minh **trùng từng byte ở cả 15 kỷ** so với
`19305ab` bằng hai lượt băm MD5 phủ **mọi** người dùng `valueNoise`: (1) mảng đỉnh lưới mặt đất +
lưới chân trời; (2) đầu ra `deriveOutskirts()` + dấu chân mặt nước của `setting.js`. Không có
migration. Không đổi dữ liệu người dùng.

---

## 2026-08-21 — Xoá **cái bệ**: thành phố nằm TRONG đồng bằng, không ngồi TRÊN nó (ADR-046, ADR-047)

**Mục đích.** Đàm bác ba vòng liên tiếp, vòng cuối bác cả 15 kỷ: *"VẪN CÒN CÁI BỆ."* Anh cũng chỉ
ra chỉ thị trước đó của cố vấn (*"trong lưới thoải, ngoài lưới gồ ghề"*) **chính là định nghĩa của
một cái bệ** — *"Không phải thực thi sai; chỉ thị sai."*

**Phạm vi.** Sửa: `src/engine/city3d/terrain.js` (4 hằng số + `nenKho`/`dongBangKho`/`beRongHoa`
thay `surfaceHeightAt` cũ + `nenRoll` bão hoà không đối xứng), `src/engine/city3d/horizon.js` (nền
đọc thẳng `terrain.nenKho`), `src/components/city/render3d/terrainMesh.js` (thứ tự tầng màu),
`src/components/city/render3d/sceneGraph.js` (đổi tên hằng số). Công cụ mới:
`scripts/plateau-score.mjs`; vá `scripts/sweep-score.mjs`. Test mới: `scripts/sceneTriCross.test.js`
(đối chiếu chéo `scene-tri` ↔ `plinth-tri`, chạy ở lượt hai của `npm test`).
**Không** thêm lệnh vẽ, **không** thêm vật liệu, **không** thêm nguồn sáng.

**Cách chữa (một câu).** Phép đo cũ đi tìm một cái **BẬC**, mà cái bệ là một **KIỂU PHÂN BỐ ĐỘ
DỐC** — nên nó về mặt cấu trúc không thể thấy thứ Đàm thấy. Đo bằng đại lượng đúng (dốc vành ngoài
÷ dốc vành trong) thì ba nguồn lộ ra, và cả ba đều là *một hằng số được chọn ĐỂ LÀM RA cái bệ*:
vùng bằng rộng 2,6 ô (nay **7,5 ô, thất thường 2,85–12,15 tuỳ hướng**), `APRON_DROP` 0,62 khai
thẳng một bậc (nay **0,18**, trong khi 11/15 kỷ có địa hình nội thành thấp hơn 0,62), và một phép
`settle` ép mọi kỷ về **cùng một mặt phẳng ở cùng một bán kính** (nay **xoá hẳn**).

**Ảnh hưởng.** Cổng chính là **mắt**: 15 ảnh kéo xa (`--zoom 2`), **15/15 kỷ không còn đọc ra một
mặt bàn vuông**. Chỉ số bệ (`plateau-score.mjs`): trước **10/15 kỷ ≥ 5**, tệ nhất 26,98. Bản quét
15 kỷ × 6 chặng vẫn qua cổng không-trôi và còn nhích lên: cặp chặng gần nhất **15,16 → 16,27**,
cặp kỷ gần nhất **22,22 → 22,13**, trung vị **39,81 → 39,35**, 0/15 và 0/105 dưới ngưỡng mắt.
Kèm một bản vá màu (ADR-047): phép hoà ra màu vùng ngoài đứng CUỐI nên nó **xoá** vết loang và
sườn lộ đất ở đúng rìa tấm đất, đẻ ra một đường viền vuông sắc lẹm (trung vị **20–36**/255 ở cả 15
kỷ, ngưỡng mắt 12); chuyển nó lên giữa tầng 1 và tầng 2 ⇒ còn **~6**.

**Tương thích.** ADR-007 nguyên vẹn — trong lưới, cao độ **không đổi một chữ số**, nhà cũ không
nhích một phân. Hằng số `APRON_EDGE` đổi tên thành `PLATE_PAD_CELLS` (chỉ dùng nội bộ tầng 3D,
không có dữ liệu người dùng nào tham chiếu). `npm test` nay chạy **hai lượt**: `test:fast` (số bài
thật nằm ở dòng cuối lượt này) rồi `test:cross` (~70 giây, tự in thời gian chạy).

---

## 2026-08-20 — Đất thôi "nhàu": nhiễu bẻ cong level set, mỗi kỷ có một hướng thấp (ADR-045)

**Mục đích.** Đàm nhìn ảnh thu nhỏ và nói mặt đất *"lòi lõm như tấm chăn nhàu"*, và chốt thứ tự
làm: **quy mô + độ cao TRƯỚC, hiệu ứng SAU** (*"Tô bóng đẹp lên một bố cục sai thì được một bố cục
sai được tô bóng đẹp"*). Đây là nửa (B) — độ cao. Nửa (A) — quy mô — chưa làm, xem cuối mục.

**Phạm vi.** Sửa: `src/engine/city3d/terrain.js` (bảng `ERA_TERRAIN` 15 dòng + 6 hàm hình dạng +
`HUONG_THAP` + `surfaceHeightAt` + quan hệ `ROLL_HEADROOM_SHARE`). Sửa test: `terrain.test.js`,
`horizon.test.js`, `cityFocus.test.js`, `waterView.test.js`. Công cụ: `scripts/terrain-score.mjs`
(thêm cột R² hướng + khớp KHUÔN), `scripts/scene-tri.mjs` và `scripts/plinth-tri.mjs` (mới).
**Không** thêm khối, **không** thêm vật liệu, **không** thêm lệnh vẽ.

**Cách chữa (một câu).** Nhiễu trước nay **CỘNG THẲNG vào cao độ** nên nó **cắt vụn** đường đồng
mức — mỗi bướu nhiễu đẻ một cực trị mới. Nay nhiễu **bẻ cong toạ độ LẤY MẪU** (domain warping) nên
đường đồng mức chỉ **uốn lượn**, sườn dốc vẫn là sườn dốc. Cộng thêm: mỗi kỷ khai một **hướng thấp**
(`drain` bắc/nam/đông/tây) buộc vào đúng đất nước `eraStyle.js` đã khai — Firenze tụt về thung lũng
Arno phía tây, Amsterdam đổ ra biển bắc — nên chỗ cao chỗ thấp có **lý do địa lý**, không phải hạt
nhiễu. Trong lưới thì thoải; **ngoài** lưới mới gồ ghề, và gồ ghề theo đúng hướng ấy.

**Kết quả (đo bằng `node --import ./scripts/register-esm-loader.mjs scripts/terrain-score.mjs`).**

| Đại lượng | TRƯỚC (`9c7032c`) | SAU |
|---|---|---|
| chênh cao trong lưới, kỷ tệ nhất | kỷ 5 = **2,70** đv | kỷ 5 = **0,90** đv |
| bậc lớn nhất giữa hai ô KỀ NHAU | kỷ 7 = **1,15** ⇒ dốc **172%** | **0,45** (đúng một bậc thềm) |
| đổi chiều cao dọc đường cắt (THÔ · THỀM) | 36,7 · 13,6 | **15,8 · 9,9** |
| **R² hướng** (đất có lý do cao thấp không) | **0,174** | **0,434** — gấp 2,5 lần |
| khớp KHUÔN (đọc ra được hình mình khai) | — (bản nền chưa tách được hình khỏi nhiễu) | **0,776** · **11/14** kỷ |
| đỉnh · đáy rời rạc trung bình | 1,6 · 1,5 | **0,9 · 1,0** |
| kỷ ≥3 bậc có một bậc nuốt >60% ô đất | kỷ 4 = 64% | **không kỷ nào** (sát nhất 51,6%) |
| tam giác thành phố 15 kỷ · lệnh vẽ | 1.490.686 · 9…13 | **1.490.510 (−176, −0,012%)** · **y hệt** |

Thềm bậc **vẫn còn ở 14/15 kỷ** (kỷ 14 Singapore cố ý phẳng) — đúng yêu cầu *"đừng xoá thềm bậc ở
chỗ nó đúng"*. Ảnh trước/sau ở `--zoom 2`: **34,5–65,1%** điểm ảnh vượt ngưỡng mắt 12/255; ở khung
app mặc định: **57,9–80,9%**. Bản quét 15 kỷ × 6 chặng vẫn **15/15 cặp chặng · 105/105 cặp kỷ**
(cặp chặng gần nhất 13,96 → 15,16 · cặp kỷ gần nhất 21,84 → 22,22 — cả hai TỐT LÊN; trung vị
40,73 → 39,81, nhích xuống 0,92 nên phải theo dõi, tuy còn rất xa ngưỡng mắt 12) ⇒ không trôi.

**⚠️ Một sự thật vật lý lộ ra SAU khi mọi số đã xanh: nước đang chảy lên dốc ở 9/14 kỷ.** `drain`
được buộc vào `country`, nhưng **`country` không phải ràng buộc chặt nhất** — một đất nước có bốn
phía, một dòng sông chỉ có MỘT. Đặt bảng `drain` cạnh bảng `settingStyle.side` (nước ở phía nào)
lần đầu tiên thì 9/14 kỷ lệch hoặc **ngược hẳn**. Đã sửa 9 dòng + test khoá hai chiều. **Cái giá
phải nói thẳng**: sửa cho đúng vật lý làm cổng "thấy nước" TỆ ĐI ở hai kỷ (kỷ 4: 5,11% → 4,95%;
kỷ 5: 5,54% → 3,51%) vì đất thoải xuống phía nước ⇒ bờ XA tụt xuống, khuất sau sống đất gần. Danh
sách miễn trừ đi từ `[6,7,10]` sang `[4,5,6,7,10]` (`TECH_DEBT #59`). **Không** hạ cổng 5% (cái phễu
Phase 9A) và **không** quay `drain` về giá trị sai (mua một con số bằng cách nói dối địa lý).

**Ảnh hưởng / tương thích.** Không đụng dữ liệu người dùng, không migration, không đổi API. ADR-007
("chỉ thêm, không bao giờ dời") vẫn được khoá bằng test gọi kèm dữ liệu tiến độ rác. Ngoại lệ `[4]`
của cổng 60% (ADR-032 b) nay **hết là ngoại lệ** — danh sách trượt về rỗng.

**⚠️ Việc CHƯA làm, nói thẳng.** Nửa **(A) QUY MÔ** chưa đụng tới — mới đo phần chuẩn bị. Còn cái
hình chữ nhật Đàm chỉ ra thì **không phải mép của tấm đất** (đo rồi: tỉ số bệ chéo/trục 1,306, cao
độ hai bên mép khớp 0,0000): nó là chỗ **mặt lát và nhà cửa dừng đột ngột**, đúng chẩn đoán ADR-038,
và Đàm đã chọn hướng **LẤP** cho nó (`outskirts.js` đã làm nửa đầu).
## 2026-08-20 (mới nhất) — GỘP `main` + KỶ 5 THÔI LÀ HÒN ĐẢO

**Mục đích.** Hai việc theo lệnh Đàm: (1) gộp nhánh đã sống 25 commit vào `main`; (2) sửa
`TECH_DEBT #64` — kỷ 5 (`meander`, Burg Eltz) ship ra một **hào vuông khép kín** thay vì một khúc
uốn có lối vào, và bo góc cái hào ấy.

**Phạm vi.** `main` = `b87df3c` (fast-forward, 0 xung đột, 0 file đụng store/sync/api/AI Coach).
Sửa: `src/engine/city3d/setting.js` (+1 hàm thuần `distanceOutsideGridRounded`, +2 dòng đổi trong
nhánh `meander`) · `setting.test.js` (+4 bài, 3 helper đo) · `settingStyle.js` (chú thích) ·
`TECH_DEBT.md` · `ARCHITECTURE_DECISIONS.md` (ADR-044) · `CLAUDE.md`.

**Ảnh hưởng.** Chỉ kỷ 5; 14 kỷ còn lại không đổi (lệnh vẽ 13 → 13, bản quét 15 kỷ qua cổng
không-trôi 15/15 + 105/105). Hai khuyết tật độc lập được vá bằng hai dòng:
1. **Lối vào bị bịt** — dải hoà bờ `SHORE_BAND` bắc cầu ngang qua CỬA hành lang khô. Quan hệ nay
   được viết ra thành mã: *một lối vào phải khô hẳn ngay khi nó rời khỏi lưới*. Bề rộng eo đất khô
   đi từ **0,000 ô → 1,400 ô** = `2 × (MEANDER_NECK − SHORE_BAND)`; 720 tia bắn từ tâm đi từ
   **0 cung → 1 cung liên tục 9,5°**.
2. **Hào vuông** — `meander` đo bằng khoảng cách L∞ (đường đồng mức là hình chữ nhật góc 90°). Nay
   dùng khoảng cách Ơclit cho riêng nó; tỉ số bờ-ngoài chéo/trục đi từ **1,3543 → 1,0215** (cổng
   1,10). `distanceOutsideGrid` giữ nguyên vì `outskirts.js` đang hỏi một câu KHÁC.

**Tương thích.** Không migration. Không đổi API, không đổi dữ liệu lưu. `distanceOutsideGrid` giữ
nguyên chữ ký và hành vi.

**Còn nợ, nói thẳng.** Đàm ra **ba** tiêu chí; hai tiêu chí đo được đã đạt, tiêu chí thứ ba —
*"ảnh cận cảnh phải đọc ra 'mỏm đá trong khúc uốn', không phải 'lâu đài giữa hào nước'"* — **CHƯA
ĐẠT**. Ảnh sau vẫn đọc ra là một cái hào, chỉ khác là nay bo góc và có một lối vào. Nguyên nhân
thuộc tầng khác: `meander` lấy hình từ khoảng cách tới **hình chữ nhật lưới**, nên dù bo góc nó vẫn
là một **vành ĐỀU quanh một hình vuông**; suối thật thì rộng hẹp thất thường, ôm ba mặt chứ không
bốn, và không lấy thành phố làm tâm. Việc ấy là `TECH_DEBT #65` (cho `canal`/`estuary`/`meander`
hình học riêng), nay đã gánh thêm nửa còn lại của `#64`.

**Chi tiết**: ADR-044 · `TECH_DEBT #64` · mục nhật ký cùng ngày trong `BAN_GIAO.md`.

---

## 2026-08-20 — NGHIỆM THU BƯỚC C: cái thước sai, không phải cái cổng sai

**Mục đích.** Đàm ra lệnh soi ba kỷ trông khô trên bản quét (1 · 4 · 5), nhìn hai kiểu nước lần đầu
có hình (`estuary` · `canal`), đo lại trục chặng ngày, rồi đóng VIỆC 2. Không sửa mỹ thuật.

**Phạm vi.** **Không một dòng `src/` nào đổi.** Mới: `scripts/water-score.mjs` (chấm % khung trên
ẢNH ĐÃ DỰNG, 6 ca tự kiểm, cả 6 đã thử-cho-đỏ đúng chỗ nêu trước). Sửa: `scripts/water-view.mjs`
(chú thích nói thật về giới hạn của nó) · `scripts/sweep-score.mjs` (in 2 chữ số ở dòng tổng) ·
`scripts/waterView.test.js` (đổi tên bài + thông điệp assert cho khỏi đọc nhầm) · tài liệu.

**Ảnh hưởng — ba phát hiện, đều là về CÔNG CỤ ĐO chứ không phải về nước.**
1. **Cổng nước: 5/14 kỷ đạt, không phải 11/14.** Phép tia của `water-view.mjs` chỉ dò trường cao độ
   nên nó MÙ với cây cối — tia xuyên qua tán cây rồi chạm nước được ghi là "nước". Nói quá
   1,04–3,01 lần, và lệch nặng nhất đúng ở kỷ nước hẹp bờ rậm, tức đúng những kỷ đứng sát cổng.
   ⚠️ **Nhưng 14/14 kỷ có tương phản nước↔bờ 30,8–115,5 — cao hơn ngưỡng mắt 12 từ 2,6 tới 9,6 lần.**
   Chỗ nào có nước thì nó ĐỌC RA là nước; vấn đề thuần tuý là DIỆN TÍCH (`TECH_DEBT #63`).
2. **Kỷ 5 là một HÒN ĐẢO — khuyết tật sản phẩm thật.** 720 tia từ tâm, **0/720** ra được đất khô;
   phép loang trên ô khô không ra nổi mép thế giới (8/8 kỷ có nước khác thì ra được). `MEANDER_NECK`
   bị `SHORE_BAND` bịt kín cổ hào. Hai hằng số đúng khi đứng riêng, một QUAN HỆ không ai sở hữu
   (`TECH_DEBT #64`, ba phương án, **chờ Đàm quyết**).
3. **Trục chặng ngày 13,96 — đã chạm điều kiện "< 14", nhưng đơn thuốc cũ SAI.** Tách theo dải:
   trời 9,29 · thành phố 11,50 · **mặt đất 19,14 (dải KHOẺ NHẤT, và Bước C làm nó nhích LÊN)**. Câu
   "vùng quê không đổi theo giờ" bị chính số đo bác bỏ. **Không nới ngưỡng, không làm theo đơn cũ**
   (`TECH_DEBT #55`, ba phương án, chờ Đàm quyết).

**Tương thích.** Không đổi hành vi app, không đổi dữ liệu, không migration.

---

## 2026-08-20 — BƯỚC C: mặt nước trải ra 14/15 kỷ, chỉ kỷ 1 còn khô (ADR-042)

**Mục đích.** Hoàn tất mảng địa thế: mọi kỷ mà `settingStyle.js` khai có nước nay đều **dựng hình
thật**, không còn kỷ nào "khai có nước mà không thấy nước". Kỷ 1 (Göbekli Tepe, sườn núi) là kỷ khô
DUY NHẤT và nó khai `water: 'none'` một cách tường minh.

**Phạm vi.** Mã sản phẩm gần như không đổi — `ERAS_WITH_WATER_GEOMETRY` mở từ 2 kỷ lên 14, phần còn
lại đã có sẵn từ ADR-040/041. Việc thật nằm ở **bốn phép đo phải sửa cho đúng đại lượng** (ADR-042):
sắc nước · mật độ vùng quê · vòng rìa · chỗ giáp hai tấm. Sửa: `setting.js` · `setting.test.js` ·
`terrain.test.js` · `horizon.test.js` · `outskirts.test.js` · `terrainMesh.test.js` ·
`sceneStats.test.js` · `drawCallBudget.test.js` · `scripts/waterView.test.js`. Mới:
`settingReaders.test.js` (bảng `NGUOI_DOC_DAU_CHAN` — mọi nơi chạm dấu chân nước phải đi qua một cửa).

**Ảnh hưởng.** Lệnh vẽ **+1 CHỈ ở kỷ có nước**, mốc riêng từng kỷ đã cập nhật (`MOC_LENH_VE`); kỷ 1
không đổi một đơn vị. ~~11/14 kỷ đạt cổng "nước ≥ 5% khung hình"~~ ⟵ **SAI, xem mục nghiệm thu
2026-08-20 ngay trên: đo lại trên MÀN HÌNH chỉ 5/14; con số 11 là của một phép tia mù với cây cối**;
ba kỷ nước hẹp (6 · 7 · 10) trượt
vì **BỀ RỘNG** chứ không vì góc nhìn — Đàm đã chốt ghi ra tường minh đếm được
(`TRUOT = [6, 7, 10]`), **KHÔNG hạ cổng 5%**. Xem `TECH_DEBT` #59 (đã đóng) · #60 · #61.

**Tương thích.** Không đổi dữ liệu người dùng, không đổi state, không migration.

---

## 2026-08-20 — `worldYaw`: xoay TỜ GIẤY, không xoay thế giới (ADR-041)

**Mục đích.** Đóng `TECH_DEBT #57`: kỷ 14 dựng đủ hình học biển nhưng camera mặc định quay lưng lại
nên chỉ thấy **0,09%** khung hình. Đàm bác cả bốn hướng đã đề xuất — *"KHÔNG SỬA CAMERA, KHÔNG SỬA
`side`. SỬA THỨ THỨ BA"* — vì cả bốn đều hy sinh một trong hai vế, trong khi thứ sai là **quan hệ
giữa chúng không ai sở hữu** (đúng bẫy Phase 7D).

**Phạm vi.** Sửa: `src/engine/city3d/settingStyle.js` (thêm `worldYaw`/`SIDE_YAW`/`normalizeYaw`) ·
`setting.js` (`insetAt` thành vỏ bọc xoay ngược toạ độ; `bounds` xoay theo) · `scripts/water-view.mjs`
(cột "trần" đọc theo góc đã xoay). Mới: `settingWorldYaw.test.js` (8 bài). **Không** đụng camera,
**không** đụng cột `side`, **không** đụng lưới 12×12.

**Ảnh hưởng.** Kỷ 14 đi từ **0,09% → 23,75%** khung hình, kỷ 12 từ **2,30% → 9,32%** — cả hai vượt
cổng 5% của Đàm. **Lệnh vẽ không đổi một đơn vị ở cả 15 kỷ** (xoay toạ độ, không thêm khối); 13 kỷ
không có nước dựng ra ảnh **không phân biệt được bằng mắt** (0,0% điểm ảnh vượt ngưỡng 12, lệch
trung bình 0,02). Bản quét 15 kỷ vẫn **15/15 · 105/105**, trung vị đi LÊN 37,6 → 40,7.

**Tương thích.** Không có migration. `worldYaw` là hàm THUẦN suy từ `side` + `DEFAULT_YAW` bằng một
công thức (không phải bảng 15 số khai tay), luôn trả bội của 90° — góc lệch sẽ đưa nửa mặt phẳng
nước cắt vào góc lưới vuông tới 2,49 ô, nên `quarterTurns()` **từ chối thẳng** thay vì tự làm tròn.

**Mở kèm `TECH_DEBT #59`**: ba kỷ nước hẹp (6 sông 1,2 ô · 7 sông 1,4 ô · 10 kênh 0,9 ô) **không
đạt cổng 5% ở BẤT KỲ góc nào** — kỷ 6 có trần toàn cục 4,44%. Đó là bài toán BỀ RỘNG chứ không phải
bài toán góc, đo xong TRƯỚC khi Bước C tiêu ngân sách cho chúng.

---

## 2026-08-19 — Mặt nước: sông ở kỷ 12, biển ở kỷ 14 (ADR-040)

**Mục đích.** Dựng HÌNH cho bảng địa thế đã duyệt ở ADR-039 — nhưng chỉ cho **ba kỷ** để Đàm nhìn
trước khi trải rộng: kỷ 14 (biển Singapore) · kỷ 12 (sông Nga) · kỷ 1 (khô Thổ Nhĩ Kỳ, làm nhân
chứng cho ràng buộc "kỷ không nước giữ nguyên mốc lệnh vẽ").

**Phạm vi.** Mới: `src/engine/city3d/setting.js` (dấu chân mặt nước, thuần) ·
`src/engine/city3d/noise.js` (`valueNoise` dọn ra khỏi `terrain.js` để gỡ vòng import). Sửa:
`terrain.js` + `horizon.js` (khoét lòng nước bằng MỘT phép dùng chung) · `outskirts.js` (không
trồng cây dưới nước) · `terrainMesh.js` (`buildWaterSurface`) · `sceneGraph.js` (một tấm nước).

**Ảnh hưởng.** Mặt nước là chỗ **mặt đất thấp hơn một mặt phẳng**, không phải một tấm xanh đặt lên
trên — nên **bờ nước không được vẽ**: nó tự lượn theo mọi gợn của địa hình. Tấm nước là một hình
chữ nhật phẳng ⇒ **+1 lệnh vẽ, chỉ ở kỷ có nước** (kỷ 12: 10→11 · kỷ 14: 10→11 · **13 kỷ còn lại
không đổi một đơn vị**). Không nguồn sáng mới, không texture, không shader nước động (lệnh Đàm).

**Tương thích.** Không đụng state, không đụng lưới 12×12, không đụng `deriveDwellings` /
`computeCityLayout`. ADR-007 ("bảo tàng bất động") giữ nguyên: cao độ trong lưới không đổi một
phần nghìn nào, có test đo dày ở cả 15 kỷ.

**Đang dở dang có chủ ý**: bảng khai 14 kỷ có nước, hình mới dựng 2 — `TECH_DEBT #56`, chờ Đàm gật
hướng mỹ thuật.

---

## 2026-08-19 — Bảng địa thế 15 kỷ: thành phố nằm ở đâu và vì sao (ADR-039)

**Mục đích.** Vùng quê của ADR-038 hôm nay giống hệt nhau ở mọi hướng. Một thành phố thật gần như
luôn nằm cạnh một thứ quyết định vì sao nó ở đúng chỗ ấy — một con sông, một cửa biển, một con kênh
đào, hoặc một sống núi khô không có nước nào cả. Đàm chốt thứ tự: **BẢNG TRƯỚC, HÌNH SAU**.

**Phạm vi.** Chỉ DỮ LIỆU, chưa một tam giác nào. Thêm `src/engine/city3d/settingStyle.js` (15 dòng:
`water` · `side` · `ground` · `reach` · `width` · `note`, mỗi dòng buộc vào `country` của
`eraStyle.js`) và `settingStyle.test.js` (**13 bài**, cả 13 đã thử-cho-đỏ đúng chỗ đã nêu trước).
Gộp hai cờ đo `splitCityMesh`/`splitGroundMesh` thành một tham số `tachDeDo`, và thêm trần hộp bao
cho khối `city` (20,12 — giá trị đo hôm nay 19,7239 cộng 2%, có đối chứng chống phễu).

**Đàm sửa gì sau khi đọc bảng.** Ba thay đổi, mỗi cái sửa một loại sai khác nhau. (1) **Kỷ 5 phải
CÓ NƯỚC** — suối Elzbach uốn quanh mỏm đá Burg Eltz ba mặt, và đó chính là lý do lâu đài nằm ở đó;
hình ấy không ép được vào `river` nên bảng có kiểu thứ sáu **`meander`** (nước BAO LẤY đất, chừa
đúng một lối vào). Kéo theo kỷ 8 đổi `reach 2→1`, `width 7→6`. (2) **Kỷ 11 đổi `sea` → `estuary`**
— Hudson ở Manhattan là cửa sông chịu triều, và `kind` phải khớp `note`. (3) **Luật hướng bờ nước
viết lại thành QUAN HỆ**: `MAX_ERAS_PER_SIDE = 6` (mức tuyệt đối, bẫy Phase 7D) → `MAX_SIDE_SPREAD
= 2` (hiệu giữa hướng đông nhất và thưa nhất). Cộng một phép gác mới: nước phải **nằm gọn trong địa
hình** (`reach + width ≤ OUTSKIRT_REACH`, `import` thẳng hằng số ấy). Đếm cuối: khô 1 · river 7 ·
meander 1 · canal 1 · estuary 2 · sea 3; hướng bắc 3 · nam 4 · đông 4 · tây 3.

**Ảnh hưởng.** Chưa file nào đọc bảng địa thế; Bước B sẽ nối qua đúng một cửa `hasWater(era)`. Bước
B chỉ dựng hình cho **3 kỷ** — biển kỷ 14 (Singapore) · sông kỷ 12 (Nga, dải rộng nhất bảng) · khô
kỷ 1 (Thổ Nhĩ Kỳ, làm chứng rằng kỷ không nước giữ nguyên mốc lệnh vẽ) — rồi dừng để Đàm xem, Bước
C mới trải 12 kỷ còn lại. Không đụng lưới 12×12, không đụng vị trí nhà, không đụng
`computeCityLayout`.

**Tương thích.** Không có migration. Không đổi dữ liệu người dùng, không đổi API.

---

## 2026-08-19 — Bỏ "cái khay": thành phố có vùng quê bao quanh (ADR-038)

**Mục đích.** Đàm: *"Tại sao một thành phố lại được xây trên một ô đất nhô ra, đâu có thành phố nào
như vậy… Nếu có ô đất nhô ra thì là cảnh thiên nhiên xung quanh."* Anh bác cả hai phương án thu-nhỏ
của `TECH_DEBT #53` (thu tấm đất / siết khung hình) và chọn **LẤP**.

**Chẩn đoán, và vì sao ba lần đầu sai.** "Cái khay" **không phải một cái MÉP**. Đo ra: cao độ hai
bên mép tấm đất khớp **0,0000**; bước màu lớn nhất qua 353 vị trí chỉ **1,1/255** (ngưỡng mắt 12);
bản vá "gợn sóng gần" đổi 25,6% điểm ảnh nhưng **0 điểm ảnh** vượt ngưỡng mắt. Sự thật chỉ lộ ra khi
**phủ ranh giới các vùng lên chính ảnh render**: không có mép nào cả — cái khay là **hình chữ nhật
đường-và-nhà dừng đột ngột giữa một mặt phẳng trống trơn**.

**Phạm vi.** Mới: `src/engine/city3d/outskirts.js` + `outskirts.test.js` (9 bài). Sửa:
`city3d/cityParts.js`, `render3d/sceneGraph.js` (đặt khối + nhãn `vungQue` + nhóm đo `landscape`),
`render3d/sceneStats.test.js` (+1 bài), `city3d/cityFocus.test.js`, `scripts/city-preview.mjs`.

**Kết quả.**
- ĐẤT TRỐNG: kỷ 3 **65,63 → 60,64%** · kỷ 12 **64,82 → 38,61%** · kỷ 14 **64,15 → 52,44%**.
- Phần `trong lưới` gần như đứng yên (18,38→18,34 · 11,66→11,16 · 8,63→8,56) ⇒ ADR-007 còn nguyên.
- **0 lệnh vẽ mới ở cả 15 kỷ** · 0 nguồn sáng mới · 0 texture mới · 0 shader động.
- Tam giác +55,8% (1.386.406 → 2.159.670) — nằm sâu trong vùng rẻ, nhưng **chi phí ms là ƯỚC LƯỢNG**
  (< 0,3 ms/khung), chưa chạy bộ đo thật trên M3.

**Tương thích.** Không đụng state, không đụng schema, không migration. Vùng quê là tầng ĐỊA LÝ
thuần: không phụ thuộc `built`/`levels`/`sessionCount`, có test gọi kèm dữ liệu rác khoá điều đó.

**Còn lại.** Vùng quê hiện đồng nhất quanh mọi phía; vế thứ hai của Đàm (*"nên có những kỷ có biển…
như thành Troy"*) là VIỆC 2 — bảng `settingStyle.js` 15 kỷ, **chưa bắt đầu**.

---

## 2026-08-19 (cuối) — Mảng phủ đất: đất trống thôi là một tấm thảm xanh trơn (ADR-037)

**Mục đích.** Đàm nhìn thành phố và thấy nó "thưa". Đo ra: **46,2% khung hình là đất trống** ở mốc
20 phiên. Trước khi làm nhà mọc dày hơn (§2-B), lấp phần đất ấy bằng thứ đúng ra phải có ở đó —
**sân, vườn rào, ruộng, giếng, sân phơi, bãi quây, khoảnh đất** — mỗi kỷ một cách, buộc vào đúng
đất nước mà `eraStyle.js` đã khai.

**Phạm vi.** Mới: `src/engine/city3d/groundCoverStyle.js` (BẢNG 15 kỷ) +
`src/engine/city3d/groundCover.js` (HÌNH) + 2 file test. Sửa: `src/engine/cityLayout.js`
(`deriveGroundCover`, mảng `covers` RIÊNG), `src/engine/city3d/cityParts.js`, `propSpec.js`,
`render3d/sceneGraph.js`, `render2d/CityCanvas2D.jsx` + `CityTile.jsx`, `cityLayout.test.js`.
Công cụ: `scripts/city-preview.mjs` (`soiVetRach`) + `scripts/cityPreviewSource.test.js`.

**Kết quả.**
- Đất trống **46,17 → 44,84** (20 phiên) · **38,52 → 36,23** (50) · **35,88 → 34,77** (80).
  **45/45 ô đều giảm.** Phần đất mất đi chảy đúng sang mảng phủ (cảnh vật+mảng phủ 1,58 → 4,40).
- **0 lệnh vẽ mới** ở cả 15 kỷ — mảng phủ chỉ dùng lại các họ vật liệu đã có (`water` bị CẤM vì chỉ
  7/15 kỷ có). Đây là con số ĐẾM, không phải giả định.
- Bản quét 15 kỷ × 6 chặng vẫn **15/15 cặp chặng · 105/105 cặp kỷ**, gần nhất 20,7 / 21,3, trung vị
  37,6 — không nhúc nhích, tức mảng phủ không làm 15 kỷ mờ vào nhau.
- Thêm hai bài khoá bất biến **"chỉ thêm, không bao giờ dời"** — trục NHÀ DÂN × THỜI GIAN trước nay
  chưa ai canh, và đó đúng là trục §2-B sắp vặn.

**⚠️ Trần của cách làm này, đo được chứ không đoán.** Ép phủ tối đa cũng chỉ hạ được thêm ~6–7 điểm
phần trăm: **ô lưới trống chỉ chiếm ~12–16% số điểm ảnh "đất"**, phần còn lại là vạt đất NGOÀI lưới
thành phố. §2-B sẽ đụng đúng cái trần này.

**Ảnh hưởng / tương thích.** Không đụng state, không đụng dữ liệu lưu. Mảng `covers` là trường mới
trong kết quả `computeCityLayout` (thêm, không đổi thứ cũ). Nợ mới: `TECH_DEBT #51` (bộ vẽ 2D chưa
bao giờ vẽ nhà dân) và `#52` (một ảnh nghiệm thu đã bị rách ngang, nguyên nhân gốc **chưa biết** —
nay có cổng chặn, chưa có chẩn đoán).

---

## 2026-08-19 (sau) — Ảnh nghiệm thu thôi bị xén: chụp đúng hộp bao canvas, và chụp thành dải (ADR-036)

**Mục đích.** Đóng `TECH_DEBT #49` ở gốc, TRƯỚC khi làm bất cứ việc mỹ thuật nào — vì mọi con số
nghiệm thu của thành phố 3D đều đọc từ ảnh do công cụ này chụp.

**Phạm vi.** `scripts/city-preview.mjs` (bỏ hẳn `--window-size` · `--screenshot` ·
`--virtual-time-budget`; chụp qua CDP `clip` theo `getBoundingClientRect`; cổng `kiemKhungNhin`;
chia dải `chiaBang`), `scripts/png-probe.mjs` (thêm `encodePng` + `ghepDoc`),
`scripts/pngProbe.test.js` (mới, 5 bài), `scripts/cityPreviewSource.test.js` (+4 bài),
`scripts/mask-count.mjs` (đối chứng đếm điểm nền trang). **Không đụng một dòng nào trong `src/`.**

**Kết quả.**
- Ảnh đơn ra **1100×700** thay vì 1134×780 — trong đó 23 dòng canvas trước đây **chưa bao giờ được
  vẽ** và 12,9% tấm ảnh không phải khung hình. `mask-count.mjs` nay đếm được **0 điểm nền trang**.
- Phát hiện thêm một trần cứng chưa ai biết: **ổ cắm CDP chỉ cho 4 MiB một tin nhắn** (đo chính
  xác), nên bản quét 15 kỷ chưa bao giờ chụp được bằng đường CDP. Đã chia thành 12 dải ngang rồi
  ghép — khoá bằng bài test "ghép ba dải phải ra byte giống hệt ghi một lần".
- Mốc nền dựng lại ở HEAD: bản quét 15 kỷ × 6 chặng vẫn **15/15 cặp chặng và 105/105 cặp kỷ** trên
  ngưỡng mắt, cặp gần nhất 20,7 / 21,3, trung vị 37,6 — **không nhúc nhích** so với số cũ.

**Ảnh hưởng / tương thích.** ⚠️ Mọi con số đo TRÊN ẢNH trước ngày này **không so trực tiếp được**
với số mới (khung bị xén ↔ khung đúng) — đã ghi thành một mục riêng trong `PERFORMANCE.md`, đúng
cách `TECH_DEBT #22` xử lý bộ lọc "8% mái". Tam giác · lệnh vẽ · ms mỗi khung **KHÔNG** bị ảnh
hưởng (đọc từ `renderer.info`). Nợ mới `TECH_DEBT #50`: `md5sum` ảnh dựng đổi theo tải máy nên chỉ
chứng minh được một chiều.

---

## 2026-08-19 — Đo mật độ nhà, và ba lớp vá cho chính phép đo

**Mục đích.** Trả lời câu hỏi của Đàm *"nhà chỉ che khoảng 1/3 mặt đất, có nên xây dày hơn không?"*
bằng số đo chứ không bằng cảm giác. **CHỈ ĐO — không sửa mỹ thuật, không đổi một dòng nào của tầng
dựng cảnh ngoài phần phục vụ phép đo.**

**Phạm vi.** `scripts/mask-count.mjs` (mới), `scripts/plan-coverage.mjs` (mới),
`scripts/city-preview.mjs` (cờ `--mask` kể tên khối bị tô đen · nền trang mang màu mốc · ghi kèm
`.geom.json`), `src/components/city/render3d/sceneGraph.js` (cờ đo `splitCityMesh`, mặc định TẮT +
đặt tên cho cư dân), `sceneStats.test.js` (3 bài khoá).

**Kết quả.** Nhà chiếm **20,7% → 25,0% → 25,5%** khung hình toàn cảnh ở 20/50/80 phiên; nhìn từ
trên xuống thì che **26,6% → 48,8% → 72,4%** phần đất không phải đường. Tiền đề "1/3" đúng với
thành phố trẻ, sai với thành phố già: 72,4% đã vượt dải 30–60% của khu dân cư thấp tầng Nhật (hệ số
建蔽率) và tiệm cận trần 80% của khu thương mại.

**Ảnh hưởng / tương thích.** Không đổi hình ảnh app: cờ `splitCityMesh` mặc định TẮT và có test
khoá, khung mặc định vẫn trùng từng byte. Một khoản nợ mới: `TECH_DEBT #49` — công cụ xem thử xén
mất 23 dòng cuối của mọi ảnh đơn (đã vá đường vòng cho phép đo, chưa vá gốc vì sửa sẽ làm đổi kích
thước MỌI ảnh tham chiếu).

---

## 2026-08-18 — Cận cảnh chữa va chạm bằng cách LÙI RA, không phải NGẨNG LÊN (ADR-035)

**Mục đích**: giữ được **mặt đứng** của công trình khi camera bay tới ngắm gần. Bản trước
(ADR-034) chữa va chạm bằng cách ngẩng camera lên, và ở kỷ 15 nó ngẩng tới **65,3°** — mái đọc rõ
còn tầng trệt (cả Phase 10) biến mất. Đàm chốt đổi thứ tự: *"lùi ra giữ được LỜI HỨA, và giữ được
cả CON SỐ."*

**Phạm vi**: `src/engine/city3d/cityFocus.js` (đảo thứ tự chữa + hàm mới `pathGuarantee`), test
tương ứng (+2 bài), một chú thích ở `sceneGraph.js`. Không đụng giao diện, không đụng dữ liệu.

**Ảnh hưởng**: góc nhìn cận cảnh nay **giữ nguyên 34,4° ở cả 15 kỷ** (0/75 chuyến phải ngẩng, so
với 8 trước đây; 0/1200 ở phép thử rộng). Khung mặc định vẫn trùng **TỪNG BYTE** (kỷ 9, kỷ 15, và
cả bản quét 90 ô). Giá phải trả, nói thẳng: 3 kỷ có ca xấu nhất nằm ngoài dải thu phóng 0,38–0,58
(0,664 · 0,623 · 0,579), nhưng **việc lùi ra KHÔNG làm mất chi tiết** — đo đối chứng cùng kỷ ở
khoảng cách lý tưởng, chênh lệch chỉ −0,72…+2,14 và không kỷ nào đổi phía so với ngưỡng mắt.
Kèm một bản vá âm thầm nhưng quan trọng: phép lấy mẫu 48 chặng nay báo **biên chứng minh được**
(`gap − bước/2`, vì khoảng-cách-tới-một-tập là hàm 1-Lipschitz) thay vì khoảng cách đo được — lời
hứa "cách một ô lưới" trước đó chỉ chứng minh được tới ~0,82.

⚠️ **Đo lần đầu đủ 15 kỷ thì lộ ra rằng con số 15,45 của ADR-034 là số của MỘT kỷ**: chi tiết
Phase 10–11 chỉ vượt ngưỡng mắt ở **4/15 kỷ**. Nguyên nhân không phải camera (đã có đối chứng loại
trừ) mà là **thứ để mà nhìn** — xem `TECH_DEBT #48`. `TECH_DEBT #41` và `#46` đã ĐÓNG.

---

## 2026-08-18 — Chạm vào một khu phố thì camera bay tới ngắm gần (ADR-034)

**Mục đích**: Phase 10 (tầng trệt) và Phase 11 (chi tiết mái) đổ công vào những thứ mà ở khung hình
mặc định gần như không nhìn thấy (`TECH_DEBT #41`: 90/90 ô bản quét dưới ngưỡng mắt). Chạm vào một
công trình nay đưa camera **bay tới đứng gần nó** — thứ làm cho hai phase ấy có giá trị thật.

**Phạm vi**: file thuần mới `src/engine/city3d/cityFocus.js` + test; `orbit.js` nhận điểm ngắm di
động và sàn giới hạn tạm thời; `sceneGraph.js` xuất thêm `blockers` (dữ liệu thuần, 0 lệnh vẽ);
`CityScene3D.jsx` nội suy 700 ms; `CityStage.jsx` thêm đường thoát "⤺ Toàn cảnh" + phím Esc;
`scripts/city-preview.mjs` thêm `--focus N` để chụp ĐÚNG chế độ này (không dựng lại bằng `--zoom`).

**Ảnh hưởng**: **khung mặc định KHÔNG đổi — chứng minh bằng `md5sum`, ảnh kỷ 9 và kỷ 15 trùng từng
byte với bản trước.** 0 lệnh vẽ mới · 0 tam giác mới · 0 điểm ảnh mới. Chi tiết Phase 10–11 ở
khoảng cách cận cảnh: lệch trung bình **15,45 (trên ngưỡng mắt 12)** so với **5,54** ở khung toàn
cảnh; điểm ảnh vượt ngưỡng **17,0%** so với **7,0%**. Lưới an toàn canh cả đường bay: 1200 chuyến
thử, 0 chuyến kẹt, 0 chuyến phải lùi ra.

**Tương thích**: không đổi dữ liệu lưu, không migration. Bộ vẽ 2D không có tính năng này (đúng như
mọi tính năng 3D khác — nó là đường lui, không phải bản song song đầy đủ).

---

## 2026-08-18 — Vỉa hè thôi bị bóp trong im lặng (ADR-033, đóng `TECH_DEBT #42`)

**Mục đích**: `walk` (bề rộng vỉa hè) là một trong 8 trục bản sắc mặt đường, nhưng 8/15 kỷ bị một
phép kẹp im lặng nuốt gần hết — kỷ tệ nhất còn **11%** bề rộng đã khai, tức 1,3 điểm ảnh trên màn
hình, trong khi `note` của kỷ ấy viết "vỉa hè mênh mông".

**Phạm vi**: `src/engine/city3d/streetStyle.js` (bảng 15 kỷ + `isValidStreetStyle` + hai hằng số
hiệu chuẩn nay `export`), hai file test tương ứng. Không đụng tầng dựng hình, không đụng bảng màu.

**Ảnh hưởng**: `avenue` được sửa lại cho đúng nghĩa nó vẫn luôn mang trong mã — *phần mặt cắt dành
cho XE*, không phải *"đại lộ này oai tới đâu"*. Paris/Moskva/Manhattan/Singapore/Dubai giảm phần
lòng đường và tăng phần người đi bộ, đúng mặt cắt thật của chúng. Vỉa hè dựng ra nay **bằng đúng**
con số khai ở 15/15 kỷ (trước: 8 kỷ bị bóp, 5 kỷ dưới ngưỡng nhìn thấy). 0 lệnh vẽ mới;
**−2.266 tam giác** (4 kỷ nhẹ đi, 11 kỷ không đổi). Bản quét 15 kỷ không trôi.

**Tương thích**: không đổi dữ liệu lưu, không migration. Thuần hình ảnh.

---

## 2026-08-18 — Phase 12: đường sá thôi lởm chởm — mép ngang và mặt cắt dọc (ADR-031 + ADR-032)

- **Mục đích**: Đàm nói *"đường lòi lõm, mất tự nhiên quá"*. Đo ra thì câu ấy gộp **hai nguyên nhân
  độc lập**, và một bản vá cho cái này không chạm được cái kia.
- **Phạm vi — nguyên nhân 1, MÉP NGANG (ADR-031)**: lòng đường trong một ô thôi là **một hình chữ
  nhật** (chỉ có hai bề rộng, trong khi một ngã tư cần bốn) mà thành **một LÕI + tối đa BỐN CÁNH
  TAY loe**. Bề rộng chỗ nối là `min(nửa của tôi, nửa của hàng xóm)` — một phép **đối xứng**, nên
  hai ô kề nhau không có cách nào lệch. Kèm `MAX_AVENUE = 0,96`.
  **Đo: 45% số mép có một bậc vuông góc (lớn nhất 0,380 ô) → 0% · 0,000 ô.**
- **Phạm vi — nguyên nhân 2, MẶT CẮT DỌC (ADR-032)**: **hai loại ô, hai luật cao độ**. 64 ô ĐẤT
  giữ nguyên bậc thềm (đo lại từng ô: giống hệt, không đụng ô nào); 80 ô ĐƯỜNG được **san thành dốc
  thoải** có trần lấy từ ngoài đời — **34,8%**, Baldwin Street (Dunedin, NZ), con phố dốc nhất thế
  giới. `terrain.js` nay đọc `roadCellCandidates()` của `cityLayout.js`: danh sách **ứng viên** (80
  ô, hằng số), **không** phải mạng đường đang hiện.
  **Đo: 205 chỗ vượt trần Baldwin → 0; dốc dọc tệ nhất 173% → 35%.** Trên mạng đã hiện ở 80 phiên:
  cú nhảy tệ nhất từ 85% chiều cao một căn nhà xuống **33%**, dốc 59,9° → **19,2°**.
- **Ảnh hưởng**: **0 lệnh vẽ mới · 0 vật liệu mới · 0 nguồn sáng mới** ở cả hai nguyên nhân. Hình
  học: nguyên nhân 1 **−6.752 tam giác (−1,0%)**, nguyên nhân 2 **+64 (+0,010%)** — và +64 ấy nằm ở
  **bệ kè** (4 công trình cạnh đường nay có mép hụt thật nên được kè), không ở mặt đường.
- **Tương thích**: không đổi dữ liệu lưu, không migration. Bất biến ADR-007 ("bảo tàng bất động")
  giữ nguyên và thực ra **chặt hơn**: địa hình khoá vào tập ứng viên — tập cha thật sự của mọi mạng
  đường đã hiện — chứ không khoá vào thứ đổi theo tiến độ.
- **Giá phải trả, ghi rõ chứ không giấu**: cao độ ô đường thôi là bội số của bậc thềm (có chủ đích);
  **5/2160** chỗ bờ đất bên lề dốc hơn một bậc, ở đó phố thắng và bờ chịu giá (`TECH_DEBT #45`);
  ranh thềm cắt ngang đường về **30** chứ không về 0, và 30 chỗ ấy dốc 22–34% — thoải hơn San
  Francisco (`TECH_DEBT #44` là một phát hiện KHÁC, có sẵn từ trước, không do phase này gây ra).

---

## 2026-08-18 — Phase 11: mái thôi là một tấm phẳng trơn — ống khói, bồn nước, cửa sổ mái, đường nét mái (ADR-030)

- **Mục đích**: camera nhìn **chúc xuống**, nên mái là mặt lớn nhất trong khung hình — và cho tới
  Phase 10 nó vẫn là một tấm phẳng trơn ở cả 15 kỷ. Ngân sách đo trên M3 nói hình học gần như miễn
  phí (dư 3,2 lần; 80% chi phí đi theo ĐIỂM ẢNH), tức đây là chỗ tiêu ngân sách có lãi nhất.
- **Phạm vi**: **ngữ pháp thứ năm**, đúng khuôn ba lớp đã dùng bốn lần — BẢNG `city3d/roofStyle.js`
  (15 kỷ, buộc vào `country`, có test bắt) · HÌNH ở `city3d/rooftop.js` · `buildingSpec.js` chỉ ĐỌC.
  Hai trục vuông góc: `stack` (thứ **nhô lên** phá mặt phẳng — ống khói · bồn nước · buồng thang ·
  cột ăng-ten · giàn phơi · chậu cây · cửa sổ mái · cửa sập · bó cọc) và `crown` (thứ **vẽ đường
  nét** — đầu dầm · ngói ống · thanh nóc · đầu đao · lan can). Tách đôi kỳ quan ↔ nhà dân ở 4
  trường; `stackCount` **cố ý dùng chung** vì nó là sự thật văn hoá của cả thành phố. Hai họ ràng
  buộc là **điều kiện cấu trúc** (mái nào đỡ được thứ gì · mốc lịch sử hai chiều), không phải trí nhớ.
- **Ảnh hưởng**: **0 lệnh vẽ mới ở cả 15 kỷ** — mỗi kỷ vẫn đúng mốc riêng của chính nó
  (9·11·11·11·10·11·11·11·10·12·10·10·10·10·10). Tam giác thành phố +27,9% (394.466 → 504.458 trên
  cả 15 kỷ; phần mái chiếm 21,8%), nằm gọn trong mô hình chi phí đã đo. Test 775 → **798**.
- **Tương thích**: không đổi state, không đổi schema, không migration. Công trình đã xây giữ nguyên
  hình (ADR-007) vì hạt giống vẫn thuần theo `bpId` + vị trí — có test khoá.
- **Nợ kỹ thuật mở thêm**: `TECH_DEBT #39` (trục `crownWeight` mỏng — 6/105 cặp; với ngói ống thì
  bước lượng hoá còn rộng hơn cả dải hợp lệ) và `#40` (`parts.js` không có `rx`/`rz` nên ngói ống
  là phép xấp xỉ). Cả hai Priority Low, đều có điều kiện xem lại.

---

## 2026-08-18 — Phase 10: tầng trệt cho cả 15 kỷ; và cổng lệnh vẽ thành BẢNG 15 MỐC (đóng `TECH_DEBT #36` + `#38`)

- **Mục đích**: chỗ mắt nhìn vào đầu tiên khi đứng trước một công trình — cửa ra vào — vẫn là một
  khối tối bề ngang **viết cứng 0,14** giống hệt nhau ở cả 15 kỷ, trong khi mái · thảm thực vật ·
  mặt đường đều đã có ngữ pháp riêng theo kỷ.
- **Phạm vi**: **ngữ pháp thứ tư** theo đúng khuôn ba lớp đã dùng ba lần — BẢNG `groundFloor`
  (`eraStyle.js`, bắt buộc đủ 15 kỷ, buộc vào `country`, có test bắt) · HÌNH ở
  `city3d/groundFloor.js` · `buildingSpec.js` chỉ ĐỌC. Bước 1 làm 3 kỷ (6 Việt Nam · 9 Pháp ·
  13 Nhật), Bước 2 trải nốt 12 kỷ và **xoá hẳn trạng thái `legacy`**. Mọi kích thước là **TỈ LỆ có
  TRẦN**, trần luôn thắng sàn; khối quá hẹp thì **không có cửa**, chứ không có một cái cửa tí hon.
  Bản sắc đo bằng **8 trục cấu trúc**: 105/105 cặp ≥ 3/8, trung vị 6/8, cả 8 trục đều còn sống.
  Xem ADR-026 + ADR-027.
- **Ảnh hưởng**: **không thêm một lệnh vẽ nào ở cả 15 kỷ** (tầng trệt cố ý chỉ dùng lại vai màu đã
  có). Tam giác thành phố 474.924 → 535.360 (**+12,7%**), kỷ nặng nhất +24,6%. Mô hình chi phí đã
  đo trên M3 nói 80% chi phí đi theo ĐIỂM ẢNH ⇒ hình học thêm ở mức này nằm dưới nhiễu.
- **Kèm theo — cổng nghiệm thu đổi hình dạng**: đo đủ 15 kỷ lần đầu tiên thì lộ ra rằng ràng buộc
  *"số lệnh vẽ không quá 13"* là con số suy từ **mẫu 3 kỷ**, và kỷ 10 nằm ngoài nó (14, kể cả
  trước Phase 10). Đàm bác cách chữa "nâng trần chung lên 14" ⇒ nay là **bảng 15 mốc riêng từng
  kỷ**, khoá bằng `src/engine/city3d/drawCallBudget.test.js` (chạy trong `npm test`, không cần
  Chromium, nhờ quan hệ đo được `lệnh vẽ = số họ vật liệu + 4` đúng 15/15 kỷ). Xem ADR-028.
- **Tương thích**: không đổi dữ liệu lưu, không migration. Công trình đã xây giữ nguyên vị trí và
  hạt giống (ADR-007); chỉ hình khối tầng trệt là mới.

---

## 2026-08-16 — Phase 9D: đường phố thành một HỆ THỐNG, bản sắc chuyển từ màu sang cấu trúc (đóng `TECH_DEBT #30` + `#27`)

- **Mục đích**: sửa nguyên nhân gốc của hai mục nợ đã tự nối cứng với nhau. Mặt đường trước đây là
  *một dải màu phẳng*: không bó vỉa, không vỉa hè, không viên lát, không vạch kẻ, mép cắt vuông
  giữa đồng, và ở vài kỷ tối tới mức thành một cái rãnh. Gốc rễ: **màu là trục DUY NHẤT mang bản
  sắc**, nên mọi sức ép "15 kỷ phải khác nhau" dồn vào độ đậm — mà độ đậm có đáy.
- **Phạm vi**: thêm `src/engine/city3d/streetStyle.js` (bảng 15 kỷ × 10 trường + 3 hàm thuần) và
  `streetStyle.test.js`; `terrainMesh.js` dựng thêm bó vỉa · vỉa hè · viên lát · vạch kẻ (tim
  đường / vạch đứt / vạch sang đường) và nối liền mặt đường qua ngã tư; `palette3d.js` đổi phép đẩy
  độ đậm sang **bão hoà** (sàn 0,13 · trần 0,26); `eraStyle.js` sửa vật liệu lát kỷ 7 (pietraforte
  → pietra serena — xem bên dưới); công cụ đo `scripts/road-score.mjs` + cờ `--mask` / `--no-shadow`
  cho `city-preview.mjs`.
- **Ảnh hưởng**: **12/12** tổ hợp nghiệm thu (kỷ 3·7·11·14 × 12h·15h·22h) đạt cả hai lời hứa —
  đường đọc được (xấu nhất 0,061 trên ngưỡng mắt 0,05) và không thành hố (sâu nhất 0,202 dưới trần
  0,26). Bản sắc 105 cặp kỷ nay đo bằng **8 trục cấu trúc**: yếu nhất 3/8, trung vị 6/8. Phép chấm
  15 kỷ toàn cảnh giữ nguyên 15/15 chặng và 105/105 kỷ. Số lệnh vẽ **13 → 13**; tam giác
  terrain+road 27 626 → 31 546 ở kỷ nặng nhất.
- **⚠️ Một lỗi đọc sử đã sửa**: kỷ 7 dùng **pietraforte** (đá XÂY TƯỜNG Palazzo Vecchio) làm màu mặt
  đường, trong khi Firenze LÁT đường bằng **pietra serena** (xám-xanh). Hậu quả đo được: đá ấy cùng
  họ màu với nền đất ấm nên con đường gần như tàng hình (0,050 lúc 12h · **0,019 lúc 22h**). Sửa
  đúng vật liệu ⇒ 0,200 / 0,191 / 0,198.
- **Tương thích**: không đổi dữ liệu lưu, không đổi API, không thêm dependency. Bài test
  `15 KỶ RA 15 MẶT ĐƯỜNG` đổi chỗ ở (`palette3d.test.js` → `streetStyle.test.js`) và đổi đại lượng
  đo (khoảng cách RGB → 8 trục cấu trúc); tầng bảng màu giữ lại hai lời hứa mà màu thật sự chịu
  trách nhiệm được. Chi tiết lý do: **ADR-025**.

---

## 2026-08-16 — Công cụ đo: bỏ hẳn proxy "mái", khôi phục phép chấm 15 kỷ (`TECH_DEBT #22` + `#19`)

- **Mục đích**: sửa **nguyên nhân gốc** của #22 — công cụ chấm bản quét không còn chấm được 105 cặp
  kỷ vì bộ lọc "8% điểm ảnh tươi nhất **≈ mái**" đã chuyển sang chấm **CỎ**. Chữ "≈" là một giả
  định mỹ thuật không được viết ra (*mái là thứ tươi nhất khung hình*), đúng khi mái suy từ
  `accentColor` và chết ở **Phase 6B** khi mái thành vật liệu lợp thật.
- **Phạm vi**: **chỉ tầng công cụ dev** — `scripts/sweepMetric.mjs` (mới, phép đo thuần),
  `scripts/sweepMetric.test.js` (mới, 6 bài), `scripts/sweep-score.mjs` (gỡ `roofColor` + cổng "từ
  chối chấm"; so từng chặng rồi lấy trung bình khoảng cách), `package.json` (glob test thêm gốc
  `scripts/`). **Không đụng một dòng nào của renderer**: chunk 3D `CityScene3D-BoWYJm9L.js` trùng
  băm với `53045b2`.
- **Vì sao không "chọn điểm ảnh mái cho khéo hơn"**: đo ở tầng dữ liệu thì **4/15 kỷ khai mái TRÙNG
  vật liệu tường** (kỷ 3, 12, 13, 14) ⇒ mái không tách được ngay từ NGUỒN, nên cả hướng "mặt nạ do
  bên dựng cung cấp" mà chính #22 đề xuất cũng là ngõ cụt. Thay bằng **chia lưới 6×3 ô con** — giải
  thẳng bệnh gốc ("trung bình trên vùng quá rộng pha loãng ~10 lần") mà không cần biết mái là gì.
- **Ảnh hưởng**: **0/105 cặp kỷ** dưới ngưỡng mắt (gần nhất 23,3 · trung vị 41,1) và **0/15 cặp
  chặng** (gần nhất 20,7). Phase 9C **không** đẩy cặp nào xuống dưới ngưỡng (24,1→23,3 · 42,8→41,1).
  `TECH_DEBT #19` nhờ đó đo lại được và cũng đóng. **718 bài test** (+6), lint sạch, build xanh.
- **Tương thích**: ⚠️ **mọi con số cặp-kỷ ghi trước 2026-08-16 đo một đại lượng KHÁC** (màu mái vs
  cả dải thành phố) — trùng đơn vị nhưng **không so trực tiếp được**. Ngưỡng mắt 12 giữ nguyên vì
  đơn vị RGB/255 được giữ có chủ ý.

---

## 2026-08-15 — Phase 9B: bóng đổ thôi là mảng đen tuyệt đối

- **Mục đích**: Đàm yêu cầu *"bóng đổ không được là những mảng đen cứng, phẳng và tuyệt đối"*. Đo
  bằng công cụ mới `scripts/shadow-score.mjs`: **8,2–20,8% khung hình** đang bị nghiền dưới ngưỡng
  mắt còn đọc ra chi tiết.
- **Phạm vi**: `sceneGraph.js` (đèn trời phát biểu thành TỈ LỆ của nắng — xem ADR-024; cấu hình
  bóng đổ dồn vào `applyPaintedLook`; cỡ bản đồ bóng máy bàn 1024 → 2048), `CityScene3D.jsx` và
  `scripts/city-preview.mjs` (bỏ phần tự khai lại), `scripts/shadow-score.mjs` (mới).
- **Ảnh hưởng**: sàn độ sáng **0,107→0,170 · 0,029→0,054 · 0,109→0,160** (kỷ 7/11/13); bị nghiền
  **13,4→0,2% · 16,9→11,1% · 8,2→2,7%**; **độ tươi đứng yên** và khoảng cách sáng-tối nhích lên ⇒
  không rơi vào bẫy "pastel như sữa" của Phase 7A.
- **Phát hiện kèm theo**: cỡ bản đồ bóng từng viết cứng ở **ba nơi với ba giá trị** (app 1024, xem
  thử một-kỷ 1024, **bản quét 15 kỷ chỉ 512**) — tức mọi nhận xét về bóng đổ rút ra từ bản quét đều
  đang nói về một thế giới thô gấp đôi thứ Đàm nhìn thấy.
- **Chưa làm, có chủ đích**: mặt đường render DƯỚI ngưỡng nhìn xét riêng vật liệu (`TECH_DEBT #30`)
  — đã có bản vá đo xong nhưng ship nó sẽ làm đỏ một lời hứa đang có, và lời hứa ấy hoá ra chỉ đạt
  nhờ 3% biên; #30 và #27 nay phải làm cùng nhau.
- **Tương thích**: không đổi dữ liệu, không đổi API, không cần migration.

## 2026-08-15 — Thế giới không kết thúc ở rìa thành phố: chân trời theo kỷ (Phase 9A)

**Mục đích.** Xoá nốt cảm giác "mô hình đặt trên bàn". Đo trên ảnh chụp: ra khỏi lưới 3,4 ô, thế
giới là **một tấm ván phẳng 72×72 tô một màu, đúng 12 tam giác** — trong khi `terrain.js` đã khai
sẵn từ Phase 7B rằng kỷ 13 *"kẹp giữa núi"*, kỷ 7 *"đồi Toscana nối nhau"*, kỷ 8 *"thành phố bảy
quả đồi"*. Dữ liệu địa lý có sẵn; tầng vẽ chưa bao giờ đọc tới nó.

**Phạm vi.** Một mô-đun thuần mới `city3d/horizon.js` (bảng 15 kỷ + trường cao độ fBm) · tấm vẽ mới
`buildHorizonSurface` thay tấm ván cũ · đổi mô hình sương từ tuyến tính sang `FogExp2` · hạ pha
sương nướng-sẵn trong `outskirts` 0,42 → 0,15 · một công cụ đo mới `scripts/depth-score.mjs`.

**Ảnh hưởng.** Số lớp không gian ở dải xa **0 → 55**. Ba thứ phải sửa cùng lúc chứ không tách được:
sương tuyến tính có mặt phẳng `far` (đo bằng cách sơn sương hồng cánh sen: đỉnh khung **95–100%
sương nguyên chất**) nên dựng núi trước khi sửa sương thì núi tàng hình hoàn toàn; và `outskirts`
pha sẵn 42% màu trời khiến cả dãy núi được sơn bằng màu TRỜI (lệch **147°** góc màu so với mặt đất
thành phố), đọc ra là sương/nước chứ không phải đất.

**Tương thích.** Không đụng state, không đụng dữ liệu lưu, không migration. Chỉ tầng hiển thị 3D.
Chi tiết quyết định: **ADR-022** (chân trời độc lập với `relief`) và **ADR-023** (phối cảnh không khí
là việc của sương, đảo ngược một nửa quyết định cũ về `outskirts`).

---

## 2026-08-15 — Cây thôi là hình nón trên que: thảm thực vật có ngữ pháp 15 kỷ (Phase 8D)

**Mục đích.** Đàm chỉ đích danh mắt xích còn lại: *"cây cone + cylinder hiện là một trong những yếu
tố khiến cảnh vẫn giống prototype"*, với đích rất cụ thể — *"nhìn vào phải nhận ra CÂY, không phải
'hình nón màu xanh trên một cái que'"*, cây phải hợp với từng kỷ, và **không được rải đều trên
lưới**.

**Phạm vi.** Hai file mới ở tầng thuần: `city3d/floraStyle.js` (bảng 15 kỷ — loài + cỡ + mật độ +
tầng cây bụi + màu lá, mỗi dòng buộc vào `country` mà `eraStyle.js` đã khai) và `city3d/flora.js`
(7 loài: tán rộng · thông · cọ · trắc bách diệp · đa · cây phố · bụi). `propSpec.js` viết lại: cây
gọi thư viện mới, thêm loại `bush`, đá có 3 dáng, đèn có 4 kiểu theo thời đại, ao có vành đá, ruộng
chia ba kiểu (ruộng nước · vườn nho có cọc · luống thường). `parts.js` thêm vai màu `leaf2` (mặt lá
trong bóng). `cityLayout.js` thêm cơ chế **mọc thành lùm** + **lệch khỏi tâm ô** + **trần phủ xanh
theo tỉ lệ**. Gộp 4 bản sao của `unit`/`signed`/`pickIndex` về `hashId.js`. Xem **ADR-020** và
**ADR-021**.

**Ảnh hưởng (đo được).** Cấu trúc cây khác nhau trên 15 kỷ: **3 → 405**. Cảnh vật lệch khỏi tâm ô
lưới: **0% → 100%**. Chỉ số tụ Clark–Evans khi bật/tắt cơ chế lùm: **1,051 → 0,923** (34 phiên) và
**0,914 → 0,782** (80 phiên). Đất trần còn lại ở thành phố trưởng thành: **0 ô ở 10/15 kỷ → 7–24 ô
ở mọi kỷ**. Chi phí: trung bình **30.656 → 30.769 tam giác (+0,4%)**, lệnh vẽ **không đổi** (11–13)
— toàn bộ chi phí cây nhiều thuỳ được trả bằng trần phủ xanh. Test 665 → **688**.

**Tương thích.** Không đụng state/schema/Supabase — cây suy ra từ hạt băm của ô lưới như trước, nên
bảo tàng vẫn bất động (ADR-007). Bộ vẽ 2D dự phòng đã thêm hình bụi để không lặng lẽ thưa đi.

---

## 2026-08-15 — Mặt đất thôi là bàn cờ: một tấm lưới liền thay 144 khối hộp (Phase 8C)

**Mục đích.** Thứ Đàm gọi thẳng là *"vấn đề rất lớn"*: *"terrain như các bậc thang… grid rõ… toàn
cảnh giống prototype/editor hơn là một thế giới 3D"*. Nguyên nhân gốc nằm gọn trong một câu: mặt
đất **là** 144 khối hộp riêng lẻ. Hộp không dốc được (chênh cao độ chỉ có thể là BẬC), hộp có mặt
bên (mỗi ô bốn cạnh đứng), và 144 ô mỗi ô một sắc phẳng thì mắt đọc ra ngay hàng lối.

**Phạm vi.** `terrain.js` thêm `smoothHeightAt`/`surfaceHeightAt`/`tintAt` + vùng đất thoải quanh
cao nguyên (`APRON_*`). File mới `render3d/terrainMesh.js` dựng hai tấm lưới liền — đất và đường —
pháp tuyến MƯỢT tính từ sai phân trường cao độ. `sceneGraph.js` bỏ hai khối `InstancedMesh` và hàm
`buildInstances`; tấm ván vùng ngoài nay ngồi theo `APRON_DROP` thay vì một con số viết tay.
Mặt đất thêm hai tầng biến thiên: **vết loang** ở tần số không liên quan lưới, và **sườn dốc lộ
đất**. Xem **ADR-019** — trong đó có việc một nửa lập luận của ADR-014 bị đảo ngược **có chủ đích**.

**Tương thích.** **Dữ liệu bậc thềm không đổi một con số** — `cells`/`footprint`/`drop`/ADR-007
nguyên vẹn, không đụng state/schema/Supabase. Chỉ cách VẼ đổi, đúng như Đàm cho phép (*"giữ
data/progression nhưng thay đổi cách render"*).

**Ảnh hưởng.** Lệnh vẽ **KHÔNG đổi** (2 → 2). Tam giác địa hình **2.330 → 7.130**, cả cảnh
**~29.000 → ~36.100 = 60%** trần 60.000 — khoản chi lớn nhất của cả mảng 8, chưa đo trên iPhone
thật (TECH_DEBT #23/#26, nay gấp hơn một bậc). **665 bài test** (+11, tất cả đã thử ngược), lint
sạch, build xanh. **TECH_DEBT #28 đóng cả hai phần.**

**Hai lỗi do chính bài test mới bắt được, không phải do đọc mã.** (1) Lưới đỉnh ban đầu neo ở
`-0,5 - padSteps × du` — cái `-0,5` không chia hết cho bước lưới 1/3, nên **không đỉnh nào nằm đúng
tâm ô**, và tâm ô là chỗ nhà/cây/cư dân đứng: cả thành phố lệch vài phần nghìn, ảnh vẫn đẹp, không
gì đỏ. (2) Bản đầu nhét mặt đường vào chung lưới đất; ràng buộc chẵn-lẻ khiến ngõ phố không thể vừa
đúng bề rộng vừa cân giữa ô — phải tách thành tấm riêng, và cái giá hoá ra bằng không.

---

## 2026-08-15 — Cạnh vát: khối thôi sắc như dao, và một bài test đã hứa suốt 6 tháng (Phase 8B)

**Mục đích.** Nguyên nhân gốc **số 1** trong ba cái audit Phase 8A đặt tên: cả hệ thống chỉ có hai
hình cơ bản, không một cạnh vát nào. Ngoài đời cạnh nhọn tuyệt đối gần như không tồn tại, và chính
dải hẹp ở mép là thứ bắt vệt sáng viền — thứ nói cho mắt biết "vật này có khối lượng".

**Phạm vi.** `parts.js` thêm `bevelWidth()` (thuần) + `countTriangles` biết đếm khối vát;
`geometryFactory.js` dựng ba vành mặt bên thay vì một. Bề rộng vát = tỉ lệ theo cạnh mỏng nhất, và
khối quá mỏng để thấy thì **không vát** — xem **ADR-018**.

**Ảnh hưởng.** ×1,24 tam giác công trình (kỷ nặng nhất 18.532 → 22.948), ~18% số khối được vát.
Đo trên ảnh: **3,8% khung hình đổi đủ để mắt thấy**. Không thêm lệnh vẽ, không đụng state/schema.
**653 bài test** (+3), lint sạch, build xanh.

**Kèm theo — vá một lỗ hổng có từ Phase 3B.** Chú thích của `countTriangles` khẳng định *"có test
đối chiếu hai bên"*, nhưng bài duy nhất tồn tại chỉ so hàm ấy với **những con số viết cứng**, trên
khối không có `w`/`d`/`h`; nó chưa bao giờ chạm vào nhà máy hình học. Nay đã có bài đối chiếu thật
(dựng cả 15 kỷ rồi đếm thẳng từ bộ đệm đỉnh). Phase 8B mới làm chuyện đó thành nguy hiểm thật, vì
kể từ đây một khối đổi số tam giác tuỳ kích thước của chính nó.

---

## 2026-08-15 — Tường thôi phẳng: chân tường, gờ mái, gờ tầng, bệ cửa sổ (Phase 8A)

**Mục đích.** Đàm ra chỉ thị mới, và nó bác thẳng cách làm cũ: *"không coi các thay đổi palette,
màu đường, terrain hoặc thêm vài nhà hiện tại là đã hoàn thành Visual Foundation"* — thành phố vẫn
*"quá pixel, hình hộp, low-poly, vật liệu phẳng"*, và *"nhà không được chỉ gồm: box + roof + vài ô
cửa"*. Audit đo ra anh đúng theo nghĩa đen: nhà dân nhỏ nhất là **12 khối, trong đó thân nhà đúng
MỘT cái hộp**; cả cảnh chỉ dùng **5–23%** ngân sách tam giác.

**Phạm vi.** `buildingSpec.js` (engine thuần): mỗi mảng nhà nay có **chân tường** (nơi chạm đất),
**gờ mái** (dải ngang dưới mái, thò ra xa nhất để hắt bóng xuống tường), **≤3 gờ tầng**, và mỗi ô
cửa sổ có **bệ + lanh tô** thò ra xa hơn chính ô kính. Ba mức thò ra bắt buộc theo thứ tự
`gờ mái > chân tường > gờ tầng`; cửa **vòm** cố ý không có lanh tô (cái vòm CHÍNH LÀ lanh tô).

**Ảnh hưởng.** Nhà dân nhỏ 12 → **17 khối** (172 → 232 tam giác); kỷ nặng nhất **23% → 41%** trần
tam giác. Không thêm ảnh chụp (texture), không thêm vật liệu, không thêm lệnh vẽ, không đụng
state/schema. **650 bài test** (+4), lint sạch, build xanh.

**Tương thích.** Bảo tàng hiện lại bằng bộ khối mới — không vi phạm ADR-007 (khoá *vị trí và danh
tính*, không khoá cách vẽ). Xem **ADR-017** để biết vì sao chọn hình khối thật thay vì bản đồ pháp
tuyến hay kẻ đường bằng màu.

---

## 2026-08-15 — Mặt đường theo thời đại, và con đường tàng hình ban đêm (Phase 7D)

**Mục đích.** Bước "Đường xá" trong thứ tự Đàm đã chốt. Yêu cầu nêu đích danh: *"hệ thống đường phải
thay đổi theo thời đại: đất/đá cổ đại, ngõ đá trung cổ, đường công nghiệp, đường quy hoạch hiện
đại"*. Audit tìm ra mặt đường của cả 15 kỷ là đúng MỘT dòng hằng số — đường mòn thời đồ đá và đại lộ
Dubai đang là *cùng một mặt phẳng cùng một màu*.

**Phạm vi.** 15 kỷ khai thêm `roadMaterial` + `roadColor`, mỗi giá trị kèm một công trình/vật liệu
có thật (nhựa đường tự nhiên Babylon · gạch nghiêng + đất đỏ làng Bắc Bộ · thanh thạch Tử Cấm Thành ·
pietraforte Firenze · pavé Paris · macadam ám bồ hóng Manchester · asphalt Tokyo…). Thêm họ vật liệu
`dirt`. Mặt đường nay là một `InstancedMesh` có **vật liệu PBR riêng** (nhám 0,99 cho đất nện ↔ 0,90
cho bê tông), không dùng chung với mặt đất nữa — giá phải trả: 0 lệnh vẽ, vì nó vốn đã là mesh riêng.

**Lỗi gốc thứ hai, nặng hơn, tìm ra khi đo chứ không khi nhìn.** Luật *"đường phải nhạt hơn đất để
mắt đọc ra lối đi"* được viết thành một HẰNG SỐ TUYỆT ĐỐI (0,42) thay vì một QUAN HỆ. Phase 3M nâng
độ đậm mặt đất ban đêm 0,286 → 0,400 vì một lý do chẳng liên quan, và mặt đường không có cách nào
biết. Kết quả: **ban đêm đường cách đất 0,012–0,020 — tàng hình**, chạy như vậy nhiều ngày, không có
gì đỏ lên. Nay mặt đường ĐO mặt đất thật rồi tự đặt mình cách ra, giữ đúng chiều của vật liệu. Xem
**ADR-016**.

**Chỗ rò rỉ thứ ba.** Ngõ phố (2/3 số ô đường) tô bằng `palette.roles.stone` — màu ĐÁ XÂY TƯỜNG,
chẳng liên quan mặt đường — nên chúng sẽ không đổi theo kỷ kể cả sau khi đại lộ đã sửa xong, mà nhìn
ảnh thì vẫn tưởng đã xong. Thêm vai màu `roadLane` suy thẳng từ `road`.

**Ảnh hưởng.** 0 thay đổi dữ liệu lưu, 0 API đổi, 0 lệnh vẽ thêm. Đo lại: khoảng cách đường↔đất tối
thiểu **0,131** ở mọi kỷ và mọi chặng trong ngày (trước: 0,012 ban đêm); 105 cặp kỷ ban ngày **0 cặp**
dưới ngưỡng nhìn-thấy-khác-nhau (trung vị 116), ban đêm còn 3 cặp ở 10,3–10,9 — đều cách nhau ≥3 kỷ,
ghi ở `TECH_DEBT.md` #27. Test 640 → **646**.

**Tương thích.** Không có migration. Kỷ nào thiếu `roadColor` vẫn dựng được (rơi về vật liệu trung
tính) và vẫn đi qua luật khoảng cách, nên không bao giờ tàng hình.

---

## 2026-08-15 — Nhà dân: thành phố có người ở (Phase 7C)

**Mục đích.** Bước thứ ba trong thứ tự Đàm đã chốt (*Visual Foundation → Terrain/City → …*). Yêu cầu
nêu đích danh *"nhà dân nhỏ/vừa/lớn, cửa hàng, xưởng"*, bố cục *"ngoại vi → khu dân cư → trung tâm →
landmark"*, và *"~50 phút → thêm một nhà dân"*. Trước bản này mỗi kỷ chỉ có **5 công trình trên lưới
144 ô** — phần còn lại là đất trống, tức thứ Đàm nhìn thấy là một bãi đất chứ không phải một thành phố.

**Phạm vi.** Module thuần mới `engine/city3d/dwellings.js`: 30 ô đất trống chia ba khu theo khoảng
cách tới tâm (12 ngoại vi · 12 khu dân cư · 6 trung tâm), mỗi khu cho phép công năng và cỡ nhà khác
nhau. Cứ **2 phiên** (~50 phút) mọc thêm một căn, mọc từ trong ra ngoài, trần mật độ theo kỷ (17 căn
kỷ 1 → 30 căn kỷ 15). Nhà dân đi qua **đúng** `buildBuildingSpec` nên tự động thừa hưởng mái/vật
liệu/tỉ lệ của kỷ; cờ `plain` tắt chữ ký kiến trúc + mô-típ để kỳ quan vẫn nổi bật. Xem **ADR-015**.

**Hai lỗi gốc phát hiện bằng ảnh chụp và sửa kèm.** (1) `style.roof` gánh hai việc → 25 nhà dân kỷ 7
đội mái vòm y hệt Duomo; thêm trường `vernacularRoof` (bắt buộc 15/15 kỷ, 9 kỷ khai khác). (2) `eaves`
là số tuyệt đối → mái nhà dân rộng gấp **2,4 lần** thân nhà (một cái ô, không phải mái hiên); thêm
`eaveOverhang()` kẹp theo tỉ lệ, còn **1,41 lần**.

**Ảnh hưởng.** Cảnh nặng nhất (kỷ 7) đi từ ~13.600 lên **21.244 / 60.000** tam giác — vẫn trong ngân
sách, và nhà dân vào **chung khối hình gộp** nên không tốn thêm lệnh vẽ. Phép kẹp diềm mái chạm vào
**115/215 mảng nhà** của 75 công trình đã có (những mảng phụ nhỏ vốn đang "đội ô" từ lâu). Nhà dân
KHÔNG chạm được — chỉ công trình thật và giàn giáo mới mở bảng thông tin.

**Tương thích.** Không đụng state, không migration, không đổi schema. Nhà dân là hàm THUẦN của
`(kỷ, số công trình, số phiên)` nên không tốn một byte nào trong JSONB đang tranh chấp CAS.

**Test.** 625 → **640** bài.

---

## 2026-08-14 — Mặt đất có cao độ: 15 kỷ, 15 vùng đất (Phase 7B)

**Mục đích.** Bước thứ hai trong thứ tự Đàm đã chốt cho Thành phố 3D (*Visual Foundation → Terrain
/City → …*). Yêu cầu nêu đích danh *"terrain must have elevation"* và *"clear foreground/midground
/background"*. Trước bản này mặt đất là 144 ô hộp **phẳng tuyệt đối ở cao độ 0** cho cả 15 kỷ — tức
trục "địa hình" hoàn toàn không tồn tại và mọi kỷ dùng chung một mặt bàn.

**Phạm vi.** Module thuần mới `engine/city3d/terrain.js`: mỗi kỷ một trường cao độ **thềm bậc**,
khai bằng 3 tham số (`shape` / `terraces` / `relief`) cộng một trường `note` **bắt buộc** giải thích
địa hình bằng một nơi có thật ở đúng nước của kỷ đó (gò Göbekli Tepe · đồng bằng sông Nin · mỏm đá
Burg Eltz · đồi Toscana · bảy quả đồi Lisbon · lòng chảo sông Seine · granite Manhattan · thảo
nguyên Nga · đất lấn biển Marina Bay · đụn cát Dubai…). `sceneGraph.js` bám địa hình ở **sáu** chỗ
và sinh **bệ kè** cho công trình vắt qua mép thềm. `orbit.js` bù khoảng cách + điểm ngắm camera theo
độ cao địa hình, tính bằng **đơn vị thế giới**. Xem **ADR-014**.

**Ảnh hưởng.** Không đụng state, không đụng schema, không migration. **Không thêm lệnh vẽ nào**:
nền vẫn là một `InstancedMesh` 144 ô (chỉ đổi `y` + hệ số cao mỗi thể hiện), bệ kè đi vào cùng khối
hình học gộp của công trình (≤ 60 tam giác trên tổng ~5.000). Test 612 → **625**.

**Đo được.** 15/15 kỷ ra 15 trường cao độ khác nhau; mọi kỷ dùng đủ số bậc mình khai. Độ phân biệt
6 chặng ngày tụt nhẹ 37,1 → **32,6** (ngưỡng mắt 12; vẫn 0/15 cặp dưới ngưỡng) — mặt bên thềm khuất
nắng nên làm dịu biên độ màu. Biên khung hình theo chiều cao: kỷ dốc nhất (kỷ 5) tụt từ 30,6° xuống
**22,1°**, vẫn cách mép trên 6,7°.

**Phát hiện kèm theo (chưa sửa — cần Đàm quyết).** Công cụ mới `scripts/frame-fit.mjs` đo ra
**14/15 kỷ có công trình bị mép khung hình cắt**, và đối chứng `--flat` cho thấy đây là lỗi **có từ
Phase 5A**, không phải do 7B (địa hình thực ra làm khung hình đỡ đi: hệ số cần thiết 2,01 → 1,78).
Sửa triệt để nghĩa là mở khung ~1,5 lần, tức đi ngược yêu cầu *"không thu quá xa rồi bị mờ"* của
chính Đàm ⇒ ghi thành `TECH_DEBT.md` **#24** với ba hướng để Đàm chọn.

---

## 2026-08-14 — Vật liệu thật: đá ra đá, kính ra kính, kim loại ra kim loại (Phase 7A)

**Mục đích.** Đàm yêu cầu nâng cấp toàn diện Thành phố 3D vì nó *"còn giống low-poly/prototype"*,
đích đến là **premium stylized 3D realism**, với yêu cầu cụ thể *"vật liệu phải đọc ra rõ là đá,
gạch, gỗ, đất nung, ngói, bê tông, kim loại"*. Đây là bước đầu tiên (Visual Foundation) trong thứ
tự Đàm đã chốt.

**Nguyên nhân gốc.** Cả thành phố dùng đúng một `MeshLambertMaterial` — mô hình thuần khuếch tán,
không có số hạng phản xạ gương. Nghĩa là *về mặt toán học* mọi bề mặt là cùng một bề mặt, chỉ khác
sắc; không bảng màu nào chữa được. Xem **ADR-013**.

**Phạm vi.** Module thuần mới `engine/city3d/materials.js` (15 họ vật liệu + tra vai→họ + đường
cong bóng tiếp xúc). `eraStyle.js` thêm `wallMaterial`/`roofMaterial` bắt buộc cho cả 15 kỷ, khai
theo công trình có thật ở nước biểu tượng. `geometryFactory.js` gom tam giác theo họ rồi phát ra
nhóm vật liệu (`addGroup`) — giữ kiến trúc gộp-hình-học, chỉ đi từ 1 lệnh vẽ lên 5–7 (thay vì 750
nếu vẽ rời). `sceneGraph.js` chuyển sang `MeshStandardMaterial` (PBR) + nướng bản đồ môi trường từ
chính bầu trời đang nhìn thấy, và nướng sẵn bóng tiếp xúc vào màu đỉnh (không dùng SSAO — SSAO chạy
mỗi khung hình, phá vỡ render-on-demand).

**Ảnh hưởng.** Vật liệu nay phân biệt được bằng mắt: mái tranh kỷ 1 lì hoàn toàn, mái kẽm kỷ 9 có
vệt sáng gương trượt trên mặt, kính kỷ 15 bóng dịu. ⚠️ Kim loại **bắt buộc** có bản đồ môi trường —
thiếu nó thì `metalness: 0.9` render ra ĐEN, nên `CityScene3D.jsx` và cả hai chỗ gọi trong
`scripts/city-preview.mjs` đều phải truyền `renderer` vào `createCityScene`.

**Tương thích.** Không đụng state, không đụng dữ liệu đã lưu, không thêm dependency, không migration.
Test 591 → 612. ⚠️ `MeshStandardMaterial` đắt hơn Lambert cho mỗi điểm ảnh — nếu iPhone nóng lên thì
đo lại bằng HUD hiệu năng (cổng Phase 3A).

---

## 2026-08-14 — Đường vành đai, và câu báo nói ra đúng con đường vừa mở (Phase 6C)

**Mục đích.** Đàm: *"mở rộng thêm, làm cầu kỳ lên"*. Nhưng việc này chọn theo SỐ ĐO chứ không theo
cảm tính: đo nhánh "xưởng trống" của `buildGrowthMoment` (ca chiếm ~85% số phiên thật) thì phiên
1–44 nói được **100%**, rồi sập xuống 38% → 6% → 3% → **0% từ phiên 121**. Mạng đường LÀ động cơ của
cảm giác "có gì đó mọc lên", và nó tắt đúng ở phiên 44 — số ô của mạng lưới.

**Phạm vi.** `cityLayout.js`: thêm vành đai chạy đúng viền lưới (x/y ∈ {0, 11} — dải duy nhất không
chạm khu đất công trình nào), đưa mạng đường **44 → 80 ô**. Thêm trường `tier` để vành đai mở SAU
toàn bộ mạng cũ. Hàm mới `describeRoadCell(x, y)` đặt tên cho từng đoạn; `cityMoment.js` dùng nó nên
câu báo nay nói *"Vừa mở thêm một đoạn đại lộ ngang"* / *"một khúc cua vành đai"* / *"một ngã tư
mới"* thay vì "một đoạn đường" lặp 80 lần — 8 cách gọi, cộng một cột mốc riêng khi vành đai khép
kín (*"Mạng đường đã hoàn chỉnh"*).

**Ảnh hưởng đo được**: quãng "phiên nào cũng có gì đó mọc lên" kéo từ phiên 44 lên **phiên 80**; tỉ
lệ nói-được qua 200 phiên **26,3% → 40,7%**. ⚠️ Nhưng nó **không** chữa cái đuôi: từ phiên 121 vẫn
im lặng tuyệt đối. `TECH_DEBT #14` vì vậy vẫn mở, và câu hỏi CÓ/KHÔNG cho Đàm vẫn nguyên vẹn.

**Tương thích — bất biến quan trọng nhất của phase này.** 44 ô đường cũ giữ **y nguyên thứ tự mở**,
nên thành phố Đàm đang có không bị sắp xếp lại sau deploy. Nếu chỉ thả vành đai vào rồi để phép xếp
theo khoảng cách lo, ô giữa cạnh viền sẽ chen lên trước đoạn cuối đại lộ và người đã chơi tới phiên
30 sẽ thấy phố mình khác đi. Có bài test riêng khoá điều này (đã thử-cho-đỏ).

**Dọn kèm.** Hai hằng số nghiệm thu chép tay (`MAX_PROPS = 96`, ngân sách DOM `230`) đã hết đúng khi
đường lên 80 — nay cả hai **suy ra từ nguồn**. `city-preview.mjs` thêm cờ `--sessions` (trước đó ghim
cứng `40` ở bốn chỗ, tức mọi bản quét chỉ còn thấy nửa mạng đường mà không báo gì), và ghi con số ấy
vào hồ sơ `.geom.json`.

## 2026-08-14 — Mái nhà là VẬT LIỆU LỢP, không phải màu nhấn giao diện (Phase 6B)

**Mục đích.** Đàm: *"phải ra nét đặc trưng và ra signature"*. Phase 6A cho mỗi kỷ một bộ phận chép
từ công trình có thật — nhưng đình làng Bắc Bộ đang lợp mái **TÍM**, và vòm Duomo Firenze cũng
**TÍM**. Một chữ ký kiến trúc lợp sai màu vật liệu thì không còn là chữ ký.

**Nguyên nhân gốc.** Đúng lại hình dạng sai của Phase 5B (`storyHeight` gánh hai việc), lần này ở
`accentColor`: một trường vừa là **màu nhận diện kỷ trên toàn app** (thanh chuyển kỷ, chấm tròn,
biểu đồ) vừa là **nguồn màu mái trong cảnh 3D**. Màu nhấn giao diện được chọn để chữ nổi trên nền,
nên nó rực và trải khắp vòng tròn màu — vật liệu lợp thì không.

**Phạm vi.** `eraStyle.js` thêm `roofColor` cho **cả 15 kỷ**, mỗi kỷ khai đúng vật liệu của công
trình có thật ở nước biểu tượng (ngói terracotta Duomo · đá phiến sông Rhine · ngói âm dương Bắc Bộ
· mái kẽm Paris · đồng oxy hoá New York · bê tông đúc sẵn Nakagin · thép mạ champagne Dubai…).
`palette3d.js` tra màu này ở **một chỗ duy nhất** trong `buildScenePalette`, nên không chỗ gọi nào
quên được. `accentColor` **giữ nguyên** ⇒ màu nhận diện kỷ trên toàn app không đổi một pixel.

**Ảnh hưởng đo được** (bảng màu, giữa trưa, theme sáng): trung vị 105 cặp mái **46,2 → 62,7** ·
trải độ sáng **0,18 → 0,40** · cặp gần nhất 6,9 → 10,9. Đóng `TECH_DEBT #20`.

**Hàng rào đổi theo.** Phép đếm "15 mái phủ mấy múi màu" bị bỏ khỏi vai trò hàng rào chính vì nó
**thưởng cho đúng bản hỏng** (đường cũ ăn 9 múi, đường vật liệu thật chỉ 6 — vật liệu lợp có thật
không trải khắp vòng tròn màu, chúng phân biệt nhau bằng ĐỘ SÁNG). Thay bằng: trung vị ≥ 52 · trải
độ sáng ≥ 0,30 · **một bài đối chứng** nhốt sẵn bảng mái hỏng cũ và bắt bộ hàng rào phải còn bắt
được nó. Trần độ tươi gộp về một hằng số `ROOF_MAX_SATURATION` (trước đó mã kẹp 0,70 còn test canh
0,66 — một luật hai công thức).

**Nợ mới.** Việc sửa này làm **hỏng công cụ đo** `sweep-score.mjs`: bộ lọc "8% điểm ảnh tươi nhất ≈
mái" đứng trên giả định ngầm *"mái là thứ tươi nhất khung hình"*, nay chấm nhầm **cỏ**. Công cụ đã
được cắm cổng tự kiểm và nay **TỪ CHỐI CHẤM** phần cặp-kỷ thay vì in số sai → `TECH_DEBT #22`.

**Tương thích.** Không có migration, không đụng state, không thêm dependency. Bảo tàng kỷ cũ giữ
nguyên vị trí; màu mái đổi — đây là thay đổi hình ảnh có chủ đích.

## 2026-08-14 — Chữ ký kiến trúc: mỗi kỷ một công trình có thật (Phase 6A)

**Mục đích.** Đàm: *"phải ra nét đặc trưng và ra signature"*. Phase 5B đã tách được 15 kỷ theo TỈ LỆ
(cao/rộng), tức sửa được hình bóng nhìn từ xa. Lại gần thì vẫn là hộp đội mái.

**Phạm vi.** File mới `src/engine/city3d/signature.js` — trục thứ ba của ngôn ngữ hình khối, sau
`eraStyle` (nét vẽ) và `archetypes` (khối tích). Mỗi kỷ một bộ phận chép từ công trình có thật của
nước biểu tượng; `eraStyle.js` thêm trường `signature` và hàm `roofRise` (dùng chung công thức mái
với `buildingSpec`, để chữ ký đặt đúng chỗ những thứ NẰM TRÊN mái).

**Vì sao cần một trục nữa.** `roof` chỉ có 9 giá trị và `windows` có 7 cho 15 kỷ ⇒ buộc phải dùng
lại. `motifs` thì chỉ dựng ở hạng rare/epic ⇒ 30 trong 75 căn nhà của cả game không có lấy một chi
tiết đặc trưng nào. Chữ ký khác cả hai: mỗi kỷ một cái riêng, và hiện ở mọi hạng.

**Ảnh hưởng.** Công trình hạng `common` từ ~4 khối lên 6–35 khối. Ngân sách tam giác 2.208 → 2.384
trên trần 8.000 (30%). Không đụng state, không thêm dependency.

**Lỗi vá kèm.** Bốn tháp góc của kỳ quan kỷ 5 và kỷ 8 mỗi cái quay nóc mái một hướng — lỗi đối xứng
có thật, chạy nhiều tháng, không có gì đỏ lên vì bài test đối xứng cũ chỉ soi kỷ 1 (mái nón).

**Tương thích.** Không có migration. Bảo tàng kỷ cũ dựng lại y hệt về VỊ TRÍ; HÌNH DÁNG có thêm chữ
ký — đây là thay đổi hình ảnh có chủ đích, không phải mất dữ liệu.

## 2026-08-14 — Xưởng trống không còn nghĩa là im lặng (Phase 5D)

- **Mục đích**: Đàm — *"mỗi phiên hoàn thành thì phải có nhà xây lên hay gì đó"*. `TECH_DEBT #14`
  đo được 95% số phiên kết thúc không có lễ mừng nào.
- **Phạm vi**: `engine/cityMoment.js` (nhánh 3 `buildTickMoment`) · `engine/cityLayout.js`
  (`ROAD_CELL_COUNT`) · `hooks/useCityMoment.js` (truyền thêm số phiên + chuỗi) ·
  `components/city/CityGrowthMoment.jsx` (ẩn thanh tiến độ khi không có cú nhích).
- **Ảnh hưởng**: ca xưởng-trống đi từ 0% lên 100% trong 44 phiên đầu mỗi kỷ. Không thêm một byte
  state nào — mọi câu đều SUY RA từ số phiên đã có, và được ĐO lại bằng chính hàm dựng thành phố
  nên không thể khoe một thứ không xảy ra.
- **Tương thích**: bốn tham số mới của `buildGrowthMoment` đều tuỳ chọn; thiếu chúng thì hành vi
  giống hệt bản cũ. KHÔNG đổi state, KHÔNG đổi schema, KHÔNG đổi cân bằng game.

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
