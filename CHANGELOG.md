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

## 2026-08-19 (mới nhất) — Mặt nước: sông ở kỷ 12, biển ở kỷ 14 (ADR-040)

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
