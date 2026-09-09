# ARCHITECTURE_DECISIONS — rotated 2026-09-09 (ADR-076)

> 16 entries moved VERBATIM out of `ARCHITECTURE_DECISIONS.md` by `node scripts/doc-budget.mjs --rotate ARCHITECTURE_DECISIONS.md`. Nothing was rewritten or deleted. Index without reading: `node scripts/doc-budget.mjs --map docs/archive/ARCHITECTURE_DECISIONS_2026-09-09.md`

---

## ADR-067 — Màn Thống kê có MỘT nguồn kỳ thời gian, và kỳ mang nghĩa LỊCH chứ không phải "N ngày gần nhất"

- **Ngày**: 2026-08-30
- **Bối cảnh**: Đàm hỏi *"xem lại phần Thống kê … có nên sửa gì không hay big upgrade lên không?"*.
  Đi khảo sát thì màn này là file lớn thứ hai dự án (`StatsDashboard.jsx`, 4.901 dòng) và **không
  có một bài test hành vi nào** — bài duy nhất nhắc tên nó là `motionCoverage.test.js`, và bài đó
  chỉ đếm số khai báo chuyển động.
- **Vấn đề**: hai lỗi khác nhau, cùng một hình dạng — *một luật được phát biểu ở nhiều chỗ*.
  1. **Ba bộ lọc thời gian, ba mặc định.** `PERIODS_UI` (Tổng Quan, mặc định `week`) ·
     `FOCUS_PERIODS` (Tập Trung, mặc định `all`) · `CAT_PERIODS` (Phân Loại, mặc định `all`) —
     khác nhau cả danh sách, cả nhãn, cả markup. Bấm từ tab này sang tab kia là **cửa sổ thời gian
     âm thầm đổi**, không có gì báo; hai con số cách nhau một cú bấm đang nói về hai khoảng thời
     gian khác nhau.
  2. **Một lỗi NHÃN (số đúng, tên sai).** Tổng Quan tính cửa sổ bằng `now - 7×86400000` rồi dán
     nhãn *"tuần này"*. Vào thứ Tư thì "tuần này" là T2→T4 còn "7 ngày gần nhất" là T5 tuần
     trước→T4. Và biểu đồ cột **ngay bên dưới** lại dựng theo tuần LỊCH (từ thứ Hai) ⇒ ô số tổng
     và bộ cột dưới nó đo hai khoảng khác nhau mà mang cùng một nhãn. Cùng họ với lỗi nhãn mép
     khung ở `frame-fit.mjs` (Phase 7B): độ lớn đúng, cái tên sai.
  Kèm ba hằng số CHẾT (`PERIODS` · `METRIC_OPTIONS` · `PERIOD_UNITS`) và ba props chết
  (`progress`/`prestige`/`buildings` truyền cho `OverviewTab` mà hàm không nhận).
- **Phương án cân nhắc**:
  1. **Chỉ sửa nhãn cho khớp cửa sổ 7-ngày.** Loại: nó làm ba tab lệch nhau THÊM, vì hai tab kia
     đã dùng nghĩa lịch ("Tuần Này" = từ thứ Hai). Và "7 ngày gần nhất" không phải thứ người dùng
     nghĩ tới khi đọc chữ "tuần này".
  2. **Giữ ba bộ lọc, chỉ đồng bộ danh sách.** Loại: danh sách giống nhau mà TRẠNG THÁI vẫn riêng
     thì cửa sổ vẫn nhảy khi chuyển tab — chữa cái nhìn thấy, để nguyên cái cắn.
  3. **Viết lại cả màn Thống kê.** Loại: 4.901 dòng không test, đập đi xây lại là canh bạc rủi ro
     cao với lợi ích không chắc, trong khi màn hình đang chạy đúng.
  4. **Một nguồn kỳ ở engine + một trạng thái ở component cha** — chọn.
- **Lý do chọn**: kỳ thời gian là phép tính THUẦN, không có điểm ảnh nào trong đó, nên chỗ của nó
  là engine (`src/engine/statsPeriod.js`). Nâng TRẠNG THÁI lên `StatsDashboard` thì ba tab **không
  thể** lệch nhau — không phải "rất khó lệch", mà là không có đường nào để lệch, vì chỉ có một
  biến. Chọn nghĩa LỊCH vì (a) đó là thứ người dùng hiểu khi đọc "tuần này", (b) hai tab còn lại
  đã dùng nghĩa ấy sẵn, (c) nó làm ô số tổng khớp với biểu đồ cột ngay dưới nó — hai thứ ấy nay
  đọc chung `getPeriodStartTs`/`buildPeriodBuckets` nên không thể lệch.
- **Trade-off**: dải "Điều đáng chú ý" (ADR cùng ngày, xem mục Ảnh hưởng) **KHÔNG** theo kỳ đang
  chọn — các hàm tín hiệu ở `gameMath.js` cần 8–24 phiên mới vượt gác cỡ mẫu, lọc về "Hôm Nay" là
  làm chúng câm hết. Đây là một sự KHÔNG NHẤT QUÁN có chủ đích, và cái giá của nó được trả bằng
  một dòng chữ trên màn hình (*"Đọc trên toàn bộ lịch sử, không theo khoảng thời gian đang chọn"*)
  chứ không giấu đi — không nói ra thì nó dựng lại đúng cái hiểu nhầm mà ADR này đi sửa.
  Trade-off thứ hai: bộ chọn nay có SÁU nút nên không nằm vừa cạnh tiêu đề, phải xuống hàng riêng
  (ảnh chụp 1280px cho thấy "Năm Nay"/"Tất Cả" bị mép phải xén mất) — đổi lại ba tab nay có cùng
  một bố cục.
- **Ảnh hưởng**: thêm `src/engine/statsPeriod.js` (nguồn kỳ + `buildPeriodBuckets`, mỗi cột tự
  khai ĐỘ MỊN của nó thay cho chuỗi `if` ở tầng giao diện vốn viết cho ba kỳ) và
  `src/engine/statsInsights.js` (dải "Điều đáng chú ý" — chỉ GỌI hàm `gameMath.js` đã có, KHÔNG
  chế công thức mới). `StatsDashboard.jsx` gỡ 3 props chết + 3 hằng số chết + 2 helper trùng lặp
  + 4 import thời gian thừa + 1 hàm chết (`summarizeSessionReviews`), và nhịp "/ ngày" nay chia
  cho số ngày ĐÃ TRÔI QUA trong kỳ thay vì độ dài danh nghĩa (chia cho 365 vào tháng Giêng là
  đúng phép chia mà sai ý nghĩa). Khoá bằng `statsPeriod.test.js` (20 bài),
  `statsInsights.test.js` (12 bài) và `statsPeriodWiring.test.js` (8 bài đọc mã nguồn) — bài cuối
  làm cho thao tác "thêm một `useState('all')` vào một tab" ĐỎ NGAY, vì đó là cách cái bẫy này
  quay lại mà đọc một mình thì hoàn toàn hợp lý.
- **Ảnh hưởng (bổ sung cùng ngày)**: chuyển nốt `summarizeFocusStats` + bảng dải/buổi (206 dòng,
  phép tính lái toàn bộ tab Tập Trung) xuống `engine/statsFocus.js`. Phép chuyển được chứng minh
  KHÔNG đổi hành vi bằng **đối chiếu chéo**: chạy CẢ HAI bản trên cùng fixture 624 phiên ở cả 6
  kỳ, so JSON — **6/6 trùng khít từng byte** (sau khi bỏ `accent`, khác biệt duy nhất có chủ ý).
  ⚠️ Chính phép đối chiếu ấy bắt được một lỗi TIỀM ẨN trong module mới: thiếu `import
  startOfVietnamDayTs`, thứ chỉ ném `ReferenceError` lúc CHẠY chứ không lúc nạp — `node -e
  "import(...)"` báo nạp thành công, lint sạch, build xanh. *Một module nạp được không có nghĩa là
  nó chạy được.* Và xoá 960 dòng code chết khỏi `StatsDashboard.jsx` (4 component + rác dây
  chuyền), đưa file từ **4.901 → 3.746 dòng (−23,6%)**.
- **Điều kiện xem lại**: nếu có ngày cần một tab đo theo cửa sổ TRƯỢT (ví dụ "30 ngày gần nhất"
  cho một biểu đồ xu hướng), thì thêm nó vào `STATS_PERIODS` như một kỳ RIÊNG có tên nói đúng
  nghĩa ("30 Ngày Gần Nhất"), **đừng** đổi nghĩa của một kỳ đang có — đổi nghĩa là dựng lại đúng
  lỗi nhãn mà ADR này đi sửa.

---

## ADR-066 — Bộ xương thành phố SINH THEO KỶ bằng chia đôi đệ quy; đường là RANH GIỚI THỬA, không phải hàng và cột

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 20. Đàm nhìn bản quét 15 kỷ rồi nói hai câu, và cả hai đều nói về cùng một
  thứ: *"nhà vẫn quy hoạch rất kỳ quặc, nó rất bài bản và xếp chồng lên nhau"* · *"cho tôi một sự
  sắp xếp thành phố ngẫu nhiên và mang tính đặc thù, không phải cứ 3x3 được, nó phải nhiều thứ và
  đa dạng hơn"*.
- **Vấn đề**: bộ xương nằm ở hai hằng số trong `cityGrid.js`, và **không hằng số nào nhận `era`**:
  `ROAD_LINES = {0,4,8,11}` (4 hàng + 4 cột ⇒ 9 siêu-ô đều tăm tắp) và `BUILDING_ZONES` (5 khu
  **3×3** ở bốn góc + tâm). Đo lại để khỏi nói bằng cảm giác — quy về thang *0% = đúng mức ngẫu
  nhiên, 100% = đối xứng bốn chiều hoàn hảo*: **bốn khu kỳ quan ở góc đạt đúng 100,0%**, cả 5 khu
  đạt 90,3% (khu tâm lệch một ô vì 12 là số chẵn), mạng đường đạt 55,0%. Tức phần MANG BẢN SẮC
  NHẤT — chỗ đứng của năm kỳ quan — đối xứng bốn chiều **tuyệt đối, ở cả 15 kỷ**. Mà đối xứng bốn
  chiều là đặc điểm của kinh đô ĐƯỢC QUY HOẠCH (Trường An, Washington), không phải Çatalhöyük,
  không phải Alfama, không phải Tokyo. Mọi phase trước đều sửa thứ nằm TRONG một ô (mái, tầng trệt,
  mặt đường, cụm nhà) nên bộ xương chưa bao giờ đổi — và bộ xương mới là thứ mắt đọc ra ĐẦU TIÊN
  khi nhìn thành phố từ trên cao.
- **Phương án cân nhắc**:
  1. **Giữ lưới, chỉ đa dạng hoá bên trong ô.** Loại: đó chính xác là thứ tám phase vừa qua đã làm,
     và Đàm vẫn nói *"rất bài bản"*. Cái bị kêu là bộ xương, không phải nội thất.
  2. **Voronoi từ điểm gieo + nới lỏng** (chỉ thị nêu tên). Loại — và loại bằng phép ĐO chứ không
     bằng cảm tính: Voronoi cho ranh giới **XIÊN**, mà toàn bộ tầng dựng đường chỉ biết ô vuông
     (`terrainMesh.js` dựng mặt đường theo TỪNG Ô với ba vai; `streetCrossSection` phát biểu bề
     rộng theo MẶT CẮT NGANG của một ô; `carriagewayShape` loe theo bốn hướng vuông góc). Ranh giới
     xiên KHÔNG diễn đạt được bằng bộ từ vựng ấy ⇒ phải viết lại cả tầng đường, kéo theo mất hết
     bó vỉa/vỉa hè/vạch kẻ theo kỷ mà Phase 9D dựng. Đó là một phase khác, không phải một lựa chọn
     trong phase này.
  3. **Viết tay 15 bố cục.** Loại: 15 lần chọn bừa, không có luật nào ràng, và kỷ thứ 16 không có
     đường nào để sinh ra.
  4. **Chia đôi đệ quy lệch tâm (BSP)** — chọn.
- **Lý do chọn**: BSP cho ranh giới THẲNG trùng khít lưới ô ⇒ **dùng lại nguyên tầng đường đã có**,
  không phá gì. Và nó KHÔNG "đều" như tên gọi gợi ý: chỗ cắt lệch tâm theo `sizeVary`, vùng được
  chọn để cắt cũng bốc theo hạt giống, nên hai kỷ cùng số thửa vẫn ra hai hình khác hẳn. Bàn cờ chỉ
  xuất hiện khi `sizeVary` ≈ 0 — tức đúng ba kỷ khai `grid`, và ở đó nó ĐÚNG (Trường An, Manhattan,
  Tokyo thật sự là bàn cờ). Điểm quyết định thứ hai: **đường là HỆ QUẢ của số thửa**, không có bảng
  "kỷ này bao nhiêu ô đường" nào cả — mỗi nhát cắt để lại một hàng/cột làm lối đi, nên nhiều thửa
  nhỏ ⇒ nhiều ngõ, ít thửa lớn ⇒ ít đường. Một hệ quả thì không thể trôi khỏi thứ sinh ra nó; một
  bảng thứ hai thì có (đúng bài học `TECH_DEBT #43`). Kết quả đo trên thang trên: cao nhất còn
  **20,0% (kỷ 4, `grid` — được phép)**, và cao nhất trong các kỷ KHÔNG phải `grid` là **9,6%**.
- **Trade-off — VÀ ĐÂY LÀ PHẦN PHẢI ĐỌC, KHÔNG ĐƯỢC BỎ QUA**: bộ xương mới **dời chỗ TOÀN BỘ 75
  công trình — 5/5 ở cả 15 kỷ**. Không có bộ xương nào vừa khác cái cũ vừa giữ nguyên chỗ cũ; đó là
  hai yêu cầu loại trừ nhau, không phải một khuyết tật cần vá. ADR-007 (*"bảo tàng bất động"*) nói
  vị trí một công trình **không bao giờ được đổi**, và nó vẫn đúng — nhưng nó là lời hứa cho thời
  gian VỀ SAU, và điều kiện của nó là *bố cục phải là hàm thuần của riêng `era`*, thứ mà `cityPlan`
  giữ nguyên (có test gọi kèm dữ liệu rác + quét 1…120 phiên × 15 kỷ đòi kết quả y hệt). Cái giá
  phải trả là MỘT LẦN, đúng lúc đổi bộ sinh. ⇒ **Đây là quyết định của Đàm, không phải của tôi.**
  Kể từ ngày ship, bộ sinh của một kỷ bị ĐÓNG BĂNG.
- **Ảnh hưởng**: `cityGrid.js` co lại còn đúng một hằng số (`CITY_GRID_SIZE`), gỡ `BUILDING_ZONES` ·
  `ROAD_MAIN_AXIS` · `ROAD_CROSS_AXIS` · `RING_LOW/HIGH` · `ROAD_LINES`. Thêm hai file theo khuôn ba
  lớp lần thứ **MƯỜI**: `networkStyle.js` (BẢNG, 5 trục × 15 kỷ — `plan` · `parcels` · `sizeVary` ·
  `ring` · `minSide`; `country` khoá cứng vào `eraStyle`) và `cityPlan.js` (HÌNH). Bản quét lên ở cả
  hai trục: CHẶNG NGÀY **11,33 → 12,44** (qua lại ngưỡng mắt 12, 0/15), KỶ gần nhất **19,18 → 21,77**
  · trung vị **36,31 → 38,48** (0/105).
  ⚠️ **ĐÍNH CHÍNH TRONG CHÍNH ADR NÀY — BẢN ĐẦU GHI "ĐÓNG `TECH_DEBT #89`" VÀ ĐÓ LÀ MỘT KẾT LUẬN
  SAI, ĐÃ ĐO VÀ TỰ BÁC BỎ.** Lời giải thích đi kèm cũng sai (*"bộ xương mỗi kỷ nay đổ bóng khác nhau
  nên các chặng không còn bị 15 bản sao pha loãng"*) — nghe cực kỳ xuôi, và tách ba dải của đúng cặp
  yếu nhất (6h↔15h) thì nó ngược hẳn: **trời 4,12 → 4,05 (−0,07)** · thành phố 6,51 → 5,56 (**tệ
  đi**) · **đất 18,05 → 20,42 (+2,37 — TOÀN BỘ phần tăng)**. Mà dải TRỜI mới là cần gạt đã được nêu
  đích danh HAI LẦN ở `CLAUDE.md`. ⇒ **`#89` GIỮ NGUYÊN TRẠNG THÁI MỞ**; cổng qua nhờ một dải chẳng
  liên quan tới chẩn đoán, và biên chỉ **0,44**. Cơ chế khả dĩ cho phần tăng ở dải đất — ghi là
  **TƯƠNG QUAN, chưa chứng minh nhân quả** — là số ô đường thôi là hằng số 80 mà thành 34…92 tuỳ kỷ.
  Bài học: **một cái cổng đo một con số GỘP thì không phân biệt được "đã chữa đúng bệnh" với "một
  dải chẳng liên quan tình cờ khoẻ lên"**, và nhận công cho lần thứ hai thì phiên sau sẽ đóng mục nợ
  ấy trong khi bệnh còn nguyên.
- **Điều kiện xem lại**: (a) nếu có kỷ thứ 16, nó chỉ cần thêm MỘT dòng vào bảng — không được sửa
  bộ sinh, vì sửa bộ sinh là dời thành phố của 15 kỷ cũ; (b) nếu sau này tầng dựng đường học được
  ranh giới xiên thì Voronoi mới trở thành một lựa chọn thật, và lúc ấy phải cân lại bằng ẢNH chứ
  không bằng lý lẽ; (c) trần `minSide` là một ràng buộc SỐ HỌC (`(minSide+1)·k − 1 ≤ L`) — muốn một
  kỷ `grid` có nhiều thửa hơn thì phải hạ `minSide` hoặc bỏ vành đai, không có đường thứ ba.

---


## ADR-065 — **BÀN CỜ LÀ MỘT MỐC LỊCH SỬ, KHÔNG PHẢI MỘT CÁCH SẮP XẾP MẶC ĐỊNH**: bố cục bên trong một thửa có trục `layout`, và một khu nhà phải NẰM TRONG thửa của nó

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 21 §3–§5. Phase 20 (ADR-066) đã đổi được **bộ xương** thành phố — đường thôi
  là hàng và cột, thửa khác cỡ khác hình. Đàm xem bản quét và vẫn nói: *«nhà vẫn xếp rất ngăn nếp
  trông như quy hoạch, dù quy hoạch ô bàn cờ chỉ bùng nổ và trở thành chuẩn mực từ thế kỷ 19 (Cách
  mạng Công nghiệp). Và việc mở rộng thành phố không phải là nhà xếp chồng lên nhau, nó rất phản
  thực tế và lịch sử.»* Ba lời phê riêng biệt trong một câu, và cả ba đều đúng vào một chỗ mà
  Phase 20 **không hề chạm tới**: bên trong MỘT thửa, `blockStyle.js` (ADR-052) vẫn dựng khu nhà
  bằng một lưới `cols × rows` cho cả 15 kỷ.
- **Vấn đề**: ba khuyết tật, và điều đáng nói là **chúng chỉ lộ ra khi đứng cạnh nhau**:
  1. **NGĂN NẾP** — `cols × rows` là một cái bàn cờ thu nhỏ. Đổi bộ xương ở tầng trên rồi mà tầng
     dưới vẫn là lưới thì mắt vẫn đọc ra lưới; hai tầng chỉ khác nhau về cỡ.
  2. **CHỒNG LÊN NHAU** — đo lần đầu ra **290 cặp** khối nhà dân đè lên nhau, chỗ sâu nhất
     **−0,441 ô**, khối rộng nhất **1,734 ô** (tức một khu nhà tràn qua trọn ô bên cạnh). Không có
     gì đỏ lên suốt từ Phase 14 §1(3), vì chưa bài test nào hỏi câu ấy.
  3. **THỬA VẪN KHÁ ĐỀU NHAU** — và khi đi đo mới lộ ra nguyên nhân thật, ở một chỗ không ai ngờ:
     ⚠️ **6/15 kỷ có ĐÚNG 0 thửa dành cho nhà dân.** `WONDER_PARCELS = 5` ăn trước, phần dư mới
     chia cho nhà; kỷ nào khai `parcels: 6` thì còn đúng 1 thửa, mà thửa ấy lại bị lấy làm sân.
     Nghĩa là con số "tỉ số thửa lớn nhất / nhỏ nhất" mà ta định đem đi chấm **đang đo các khu đất
     kỳ quan**, không đo đất ở — một phép đo trả lời rất tự tin về một đại lượng khác.
- **Phương án cân nhắc**:
  1. **Rải theo hạt giống rồi tránh nhau (scatter-and-retry)** cho kỷ 1–9. Loại: cần một phép kiểm
     chồng lấn + một số lần thử lại, tức **hai hằng số phải hiệu chuẩn** và một nhánh "thử mãi
     không được thì làm gì". Đúng họ những cơ chế đã chết trong im lặng ở Phase 8D (lùm cây).
  2. **Chia thửa đệ quy lệch tâm (BSP) cho kỷ 1–9, giữ `cols × rows` cho kỷ 10–15** — chọn.
  3. **Bỏ hẳn `cols × rows`, cho cả 15 kỷ dùng BSP.** Loại: nó xoá luôn cái mốc lịch sử Đàm vừa
     ra — Manhattan 1811 và Barcelona của Cerdà **phải** đọc ra là lưới, đó là bản sắc của chúng.
  4. Cho chồng lấn: **nới khoảng cách giữa các suất đất**. Loại: nó không chữa gốc (khối tự nó
     rộng hơn suất đất của nó) và nó ăn mất chính phần đất vừa chia ra.
- **Lý do chọn**:
  - **Các lá của một cây BSP rời nhau THEO CẤU TẠO.** Không cần phép kiểm chồng lấn, không có số
    lần thử lại để phải hiệu chuẩn, không có nhánh thất bại. Và nó **tái dùng đúng cơ chế
    `cityPlan.js`** đang chạy ở tầng trên — một luật một công thức, ở hai cấp.
  - **Mốc lịch sử áp thẳng, không chỉnh khéo**: kỷ **1–9** không được xếp hàng lối ở bất kỳ tầng
    nào; kỷ **10–15** thì được. Khoá bằng test **hai chiều** (kỷ 1–9 **phải trượt** phép kiểm "là
    lưới đều"; kỷ 11–15 **phải đạt**) — một chiều thôi thì cách rẻ nhất để test hết đỏ là làm mọi
    kỷ hữu cơ, tức xoá mất nửa kia của mốc.
- **Giải pháp**:
  - **§3 — trục `layout`.** `BLOCK_LAYOUT = ['organic', 'grid']` trong `blockStyle.js`. Kỷ 1–9 khai
    `units` (số suất đất) và đi qua `xepHuuCo()`: chia thửa đệ quy lệch tâm, **mỗi lần cắt chọn
    vùng LỚN NHẤT còn chia được, cắt theo cạnh DÀI hơn**, tỉ lệ cắt lấy từ hạt giống. Kỷ có sân
    (`attach: 'court'`) cắt thêm một lá rồi xoá lá gần tâm nhất làm sân chung — **chỉ khi còn ≥ 5
    lá**, vì một cái sân cần ít nhất bốn nhà vây quanh. Kỷ 10–15 giữ `cols × rows` (`xepLuoi`),
    không đổi một dòng.
  - **§4 vế 1 — khu nhà NẰM TRONG thửa của nó.** Ba việc, mỗi việc đo riêng:

    | | cặp chồng lấn | sâu nhất | khối rộng nhất |
    |---|---|---|---|
    | nền `84d31e2` | 290 | −0,441 ô | 1,734 ô |
    | + `BLOCK_MAX_CELLS = 1` | 84 | −0,078 | 1,092 |
    | + giải affine lượt thứ ba | 20 | −0,044 | 1,048 |
    | + `EAVE_LAND_FACTOR = 1,05` | **15** | **−0,015** | 1,062 |

    −0,015 ô ở `CELL_PIXELS = 64` là khoảng **1 điểm ảnh**, dưới sàn mắt 4 điểm ảnh.
    ⚠️ Lượt thứ ba là một phép **GIẢI**, không phải một vòng lặp: `specFootprint` là hàm **BẬC
    THANG** của `fx` (số cửa sổ, số cột, số bậc đều là số nguyên) nên lặp tới hội tụ thì **phân
    kỳ** — đo được lượt ba đi XA hơn lượt hai. Hai lượt cho ra hai điểm, và một đường thẳng qua hai
    điểm thì giải được. (Cùng bài học Phase 14 §1(3): *trước khi lặp tới hội tụ, hỏi "hàm này có
    liên tục không?"*.)
  - **§4 vế 2 — thành phố LAN RA.** Đã đúng sẵn theo cấu tạo (`dwellingPlots` xếp theo khoảng cách
    tới tâm tăng dần, `deriveDwellings` lấy **tiền tố**), nhưng **chưa bài nào canh**. Nay có: so
    20 phiên với 120 phiên, đủ 15 kỷ — bán kính xa nhất đi từ 1,5–3,5 lên 4,5–5,5 và hộp bao nở
    **1,65 lần** (kỷ 4) tới **12,0 lần** (kỷ 13). Đảo thứ tự sắp xếp thì bài đỏ ngay ở kỷ đầu tiên
    — đã thử.
  - **§5 — tách vai của thửa ra một module lá.** `parcelRoles.js` (0 lời `import`) giữ **một** công
    thức chia vai `wonder / plaza / dwelling`, và **cả `cityPlan.js` lẫn `networkStyle.js` cùng
    gọi nó** — nếu không thì cái trần sức chứa và phép chia vai sẽ trôi khỏi nhau và lại đẻ ra
    những kỷ 0 thửa nhà. `isValidNetworkStyle` nay **từ chối thẳng** dòng nào để lại
    `< MIN_DWELLING_PARCELS` (= 2) thửa nhà, không tự chữa. Bảy kỷ được nới `parcels`
    (1: 6→11 · 2: 7→9 · 5: 6→9 · 6: 7→12 · 7: 9→11 · 12: 6→8 · 13: 12→13); kỷ 9 xét rồi **giữ
    nguyên**, ghi lại lý do tại chỗ.
- **Trade-off**:
  - **§4 đã trả giá, và nói thẳng ra**: `BLOCK_MAX_CELLS = 1` khoá số suất đất ở 4 cho cả 15 kỷ ⇒
    cột `units`/`cols`/`rows` của bảng khu phố tạm thành một **trục chết**. Đã đếm ra tường minh
    bằng một bài test đi qua đúng đường dựng thật, kèm ba phương án đã đo, ghi ở `TECH_DEBT #88`.
    **Không nới trần**: đo được trần 2 thì khối lại xuyên qua nhau.
  - **§5 làm bảy mốc số cũ già đi**, và chúng được ghim lại **sau khi đo**, không một cái sàn hay
    trần chất lượng nào bị nới (một cái trần còn được SIẾT: `TRAN_TROI` 0,13 → 0,10 ô). Tốt lên:
    chiều cao nhà kỷ 1 và 7 hết trượt · kỷ 5 thôi bị khung hình thu nhỏ vô cớ (biên 0,2294 →
    0,0400) · mảng phủ đất nay đạt ở **cả bảy** mốc phiên (trước hụt ở mốc 150) · nước nhìn thấy
    được tăng ở **13/14 kỷ** và kỷ 5 vượt cổng 5% (3,63 → 7,00). Xấu đi và không giấu: ô mất chi
    tiết mái **7/476 (1,5%) → 10/473 (2,1%)**, kỷ tệ nhất 0,893 → 0,844. Nguyên nhân là một phép
    **đổi tỉ lệ loại nhà** (thêm ô đường ⇒ đổi ô nào là nhà ⇒ đổi tỉ lệ `workshop`, nguyên mẫu
    thấp-rộng có tỉ số xấu nhất), **không phải** một cơ chế hỏng.
- **Ảnh hưởng**: `blockStyle.js` (trục `layout` + `xepHuuCo`) · `block.js` (trần một ô, giải affine,
  `EAVE_LAND_FACTOR`) · `cityPlan.js` + `networkStyle.js` (cùng gọi `parcelRoles`) · module mới
  `parcelRoles.js`. **ADR-007 nguyên vẹn**: mọi thứ vẫn là hàm thuần của `era` (+ vị trí ô), và bài
  test "chỉ thêm, không bao giờ dời" vẫn xanh cho 1…120 phiên × 15 kỷ.
- **Điều kiện xem lại**: (a) `TECH_DEBT #88` — nếu tìm được cách cho suất đất > 4 mà khối vẫn không
  xuyên nhau thì cột `units` sống lại; (b) nếu Đàm thấy kỷ 10 (bản lề) nên ngả hẳn về một phía;
  (c) nếu có kỷ thứ 16 được thêm, nó phải tự khai `layout` — không có mặc định.

---

## ADR-064 — Hợp nhất hai nhánh: **BSP quyết cắt Ở ĐÂU, cung cong quyết cắt theo HÌNH GÌ**; và một thửa là TẬP Ô, không phải hình chữ nhật đã khai

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 21. Hai nhánh đã đi giải **cùng một bài toán** — *"xoá vẻ quy hoạch của bộ
  xương thành phố"* — bằng hai lời giải khác nhau, trong hai phiên không nhìn thấy nhau. `main` có
  **ADR-059**: mỗi kỷ tự sinh tập ô đường bằng những **CUNG CONG** (`arcTrace` trong `roadPlan.js`),
  cho ra đường lượn và giao lộ chữ T/Y thật. Nhánh Phase 20 có **ADR-066**: **chia thửa đệ quy**
  (`cityPlan.js`), cho ra thửa **khác cỡ khác hình** thay cho 9 siêu-ô đều tăm tắp. Đàm ra lệnh hợp
  nhất, và nói rõ giữ `cityPlan` làm nguồn sự thật về bố cục còn ADR-059 làm tầng hình dạng của
  đường. Hai bên còn **trùng số ADR 056 và 057** cho hai nội dung khác hẳn nhau, và trùng cả
  `TECH_DEBT #79`/`#80`.
- **Vấn đề**: gộp mù thì mất một trong hai. Ghép được hay không phụ thuộc vào một câu hỏi chưa ai
  đặt ra: **hai bộ sinh ấy có đang trả lời cùng một câu hỏi không?** Đọc kỹ cả hai thì **không**:
  chia thửa trả lời *"đất chia thế nào"*, cung cong trả lời *"một ranh giới có hình gì"*. Mọi ranh
  giới BSP đều **thẳng băng** (đó là một nửa của cái vẻ "quy hoạch" còn sót lại), còn bộ sinh
  nan-quạt/bàn-cờ của ADR-059 thì **không có khái niệm thửa** nên không thể cho thửa to nhỏ khác
  nhau. Mỗi bên thiếu đúng thứ bên kia có.
  ⚠️ Nhưng ghép xong thì một mệnh đề ngầm bị phá: `cityPlan` xưa nay coi **một thửa LÀ hình chữ
  nhật** `(x0,y0,x1,y1)` mà phép chia đệ quy khai ra. Cho nhát cắt vồng lên thì con đường **ăn vào
  bên trong hình chữ nhật ấy**, và bài "thửa + đường = 144 ô" thủng — không phải vì một lỗi tính
  toán mà vì hai định nghĩa của chữ "thửa" bắt đầu nói về hai thứ khác nhau.
- **Phương án cân nhắc**:
  1. **Chỉ giữ ADR-059, bỏ chia thửa.** Loại: mất luôn thửa khác cỡ — đúng thứ Đàm nêu tên
     (*"không phải cứ 3x3 được, nó phải nhiều thứ và đa dạng hơn"*).
  2. **Chỉ giữ chia thửa, bỏ cung cong.** Loại: mất đường lượn và giao lộ thật, tức quay lại đúng
     câu Đàm đã bác ở Phase 19 (*"nó chỉ là những đường thẳng"*).
  3. **Ghép, và kẹp cung cong lại cho nó đừng ăn vào thửa** (giữ định nghĩa thửa = hình chữ nhật).
     Loại: cái kẹp ấy phải chặt tới mức cung gần như thẳng, tức giữ được cái tên mà mất cái việc.
  4. **Ghép, và ĐỔI ĐỊNH NGHĨA của "thửa"** — chọn.
- **Lý do chọn**: hình chữ nhật là **Ý ĐỊNH**, con đường đã dựng mới là **SỰ THẬT**. Nên thửa nay
  là **tập ô**: mỗi ô không phải đường được giao cho hình chữ nhật **gần nhất** (`chuO` +
  `cellSet`). Phép giao ấy **phủ kín và không chồng lấn theo cấu tạo** — ô nằm trong một hình thì
  khoảng cách 0, các hình rời nhau nên không tranh chấp — nên bài "thửa + đường = 144" không thể
  thủng lại vì một lý do hình học. Hình chữ nhật vẫn được giữ, nhưng chỉ để trả lời ba câu về Ý
  ĐỊNH (*"thửa này sâu bao nhiêu" · "tâm nó ở đâu" · "nó có mỏng hơn `minSide` không"*); mọi câu
  hỏi ở cấp Ô đều hỏi `cells`.
  ⚠️ Và đây **không phải một phép vá cho test hết đỏ**: một thửa có mép cong thì khu nhà bên trong
  nó thôi là một hình chữ nhật đều đặn — tức nó chính là thứ chỉ thị đòi.
- **Giải pháp**:
  - `buildCityPlan(era)` (ADR-066) quyết **CHỖ CẮT**; mỗi nhát cắt gọi `arcTrace` (ADR-059) để lấy
    **HÌNH DẠNG** của nét cắt ấy, kèm `crossings` — tim đường cắt qua mỗi ranh giới ô ở đâu, chuẩn
    hoá `[−1, 1]` — thứ mà `roadPath.boundaryBend` đọc để mặt đường **đọc ra là cong** thay vì một
    bậc thang.
  - **Độ vồng có TRẦN, và trần ấy là một QUAN HỆ**: `maxDev` = phần đất DƯ của bên hẹp hơn sau khi
    đã chừa đủ `minSide`; dư 0 ⇒ cắt thẳng, không ngoại lệ. Cộng `BOW_MAX_SHARE = 0.25` — một cung
    không bao giờ được vồng quá một phần tư chính chiều dài của nó (vồng 3 ô trên nhát cắt dài 12 ô
    là một con phố cong; vồng 3 ô trên nhát cắt dài 4 ô là một nhát chém chéo). Bản đầu viết
    `Math.min(..., 2)` — đúng bẫy Phase 7D, vừa quá rộng cho nhát ngắn vừa quá chặt cho nhát dài.
  - `buildRoadPlan` cùng năm bộ dựng khung của ADR-059 (nan quạt, bàn cờ, xương cá, vành đai, hữu
    cơ) **bị xoá**: chúng trả lời câu *"đất chia thế nào"* bằng một đường khác, và giữ cả hai là
    giữ hai nguồn sự thật cho một đại lượng. Ba hàm còn sống của `roadPlan.js` (`arcTrace`, `gom`,
    `vaLienThong`, `tiaMangDuong`) đều thuộc tầng **hình dạng**, không thuộc tầng bố cục.
  - `networkStyle.js` (BẢNG) nay có 8 trục, trong đó `parcels`/`sizeVary`/`minSide` là của tầng bố
    cục còn `bow`/`wiggle`/`loops` là của tầng hình dạng. Đo lại toàn bộ ở bảng CUỐI CÙNG: quần thể
    ô nhà dân **476** (đi từ 371 → 432 → 476), **2.370** khối, chi tiết mái giữ **431/476 = 90,5%**.
  - **Đánh số lại cho hết trùng**: số của `main` giữ nguyên nghĩa; entry của nhánh này đổi
    ADR-057 → **ADR-066** (chia thửa) · ADR-056 → **ADR-061** (khung hình) · ADR-054 → **ADR-062**
    (`monolith`) · ADR-055 → **ADR-063** (che khuất môi trường); `TECH_DEBT #79` → **#89**,
    `#80` → **#90**. ⚠️ Vì vậy thứ tự VẬT LÝ của file này không còn giảm dần đơn điệu ở đoạn
    059…053 — đó là dấu vết của lần hợp nhất, không phải một chỗ hỏng.
- **✅ ADR-007 — ĐÀM ĐÃ DUYỆT PHƯƠNG ÁN (a), ghi lại ở đây vì nó là một quyết định kiến trúc, không
  phải một chi tiết thi công**: chấp nhận **dời 75/75 công trình ĐÚNG MỘT LẦN**, và sau lần ship
  này bố cục mỗi kỷ **đóng băng vĩnh viễn**. Không dựng hai bộ sinh song song (một cho thành phố cũ,
  một cho thành phố mới) — hai bộ sinh là hai nguồn sự thật, và nguồn thứ hai sẽ trôi khỏi nguồn thứ
  nhất trong im lặng. ⚠️ **Từ ngày ship, đổi bộ sinh bố cục của một kỷ là một quyết định DI TRÚ,
  phải hỏi Đàm trước** — không phải một lần chỉnh tham số. Bất biến gốc của ADR-007 (*"chỉ thêm,
  không bao giờ dời"*) **vẫn phải xanh cho mọi mốc phiên 1…120 × 15 kỷ**, chỉ là nó được phát biểu
  lại cho đúng: bất biến ấy nói về **trong cùng một phiên bản bộ sinh**, không nói về hai phiên bản
  khác nhau của phần mềm.
- **Trade-off**: (a) mất 5 bộ dựng khung của ADR-059 — chúng đã được đo, đã ship, và bị xoá sau
  chưa tới một ngày; cái được là **một** nguồn sự thật thay vì hai. (b) Thành phố đã xây của Đàm
  dựng lại khác đi một lần. (c) Bảng số hiệu năng của Phase 19 trong `PERFORMANCE.md` **không tái
  lập được nữa** (lệnh trong đó gọi `buildRoadPlan`) — đã ghi đính chính tại chỗ thay vì xoá bảng,
  vì nó vẫn là bản ghi đúng của thời điểm nó được đo.
- **Ảnh hưởng**: `cityPlan.js` · `networkStyle.js` · `roadPlan.js` (xoá 5 bộ dựng) · `cityGrid.js` ·
  `dwellings.js` · `roadPath.js` · `scripts/archive/road-bend.mjs` (đổi nguồn sang `planRoadCells`).
  Bảy tài liệu phải gỡ xung đột. `TECH_DEBT` không mở mục mới, không đóng mục nào.
- **Điều kiện xem lại**: nếu sau này cần ranh giới **XIÊN** (Voronoi) thì đây là chỗ phải quay lại —
  và lúc ấy phải viết lại cả tầng dựng đường, vì `terrainMesh`/`streetCrossSection`/`carriagewayShape`
  chỉ biết ô vuông (lý do loại Voronoi ở ADR-066 vẫn còn nguyên giá trị).

---
## ADR-061 — Tách "đã MỜI" khỏi "đã XEM" để gỡ nốt ngoại lệ cuối của luật mức độ làm phiền

**Ngày:** 2026-08-27
**Trạng thái:** đã áp dụng. Không đảo ngược ADR nào — nó HOÀN TẤT ADR-060, đóng `TECH_DEBT #87`.

**Bối cảnh.** ADR-060 chốt: chặn màn hình chỉ dành cho bốn việc buộc phải QUYẾT ĐỊNH (lên kỷ ·
thăng hoa · khủng hoảng kỷ · thảm hoạ). Nhưng nó để lại đúng MỘT ngoại lệ, và ghi rõ lý do:
`checkWeeklyReport` vẫn tự mở `WeeklyReportModal` sáng thứ Hai. Ngoại lệ ấy không phải vì lười —
nó bị chặn bởi một khuyết tật ở tầng dữ liệu.

**Vấn đề.** `dismissWeeklyReport` ghi `lastWeeklyReportDate` ở MỌI lần đóng, và cùng một trường ấy
là thứ chặn `checkWeeklyReport` chạy lại. Tức một trường đang trả lời HAI câu hỏi khác nhau —
*"tuần này đã mời chưa?"* và *"Đàm đã xem chưa?"*. Chừng nào còn gộp thì đẩy bản tổng kết xuống một
toast 4 giây là **đổi một phiền toái nhỏ lấy một mất mát thật**: lỡ một cái toast = mất báo cáo của
cả tuần. Đây là lần thứ **BẢY** của khuôn *"một trường gánh hai việc"* (`storyHeight` · `roof` ·
bảng loài cây · `avenue` · vai màu `cloth2` · hồ sơ `{sides, rings}`), và lần đầu nó gánh hai việc
ở tầng DỮ LIỆU BỀN chứ không ở tầng hình.

**Phương án đã cân nhắc.**
- **(A) Cứ đẩy xuống toast, giữ nguyên một trường.** Rẻ nhất, và chính `TECH_DEBT #87` đã cấm: nó
  biến một phiền toái đo được thành một mất mát im lặng.
- **(B) Giữ hộp thoại tự bật, chấp nhận ngoại lệ vĩnh viễn.** Loại: một ngoại lệ là chỗ để ngoại lệ
  thứ hai bám vào (*"nếu báo cáo tuần được phép tự bật thì cái này cũng được"*), và luật mức độ làm
  phiền chỉ sống được khi không có ngoại lệ nào.
- **(C) Cho toast KHÔNG tự tắt, phải bấm mới mất.** Loại: đó là một hộp thoại đội lốt toast, và nó
  phá luật 4 giây mà `RewardToastHost` vừa dựng cho cả sáu kênh còn lại.
- **(D — đã chọn) Tách đôi trường, cộng một lưới an toàn KHÔNG hết hạn.**

**Giải pháp.** Hai trường bền, hai câu hỏi:
`lastWeeklyReportDate` = *đã MỜI tuần này* (ghi lúc `checkWeeklyReport` bật lời mời, để không mời
lại mỗi lần mở app) · `lastWeeklyReportSeenDate` = *đã MỞ bản tổng kết ra* (ghi lúc
`openWeeklyReport`). Toast hết 4 giây gọi `dismissWeeklyReportToast`, thứ **chỉ tắt lời mời và
không ghi ngày nào**.

⚠️ **Ba luật đi kèm, đừng gỡ cái nào:**
1. **MỞ = đã xem; ĐÓNG = không ghi gì.** Ghi ở lúc đóng là dựng lại đúng cái bẫy cũ ở một chỗ khác.
2. **Cú mở ĐẦU TIÊN trong tuần rơi vào chế độ `'previous'`.** Không có luật này thì việc đổi sang
   toast âm thầm đổi luôn NỘI DUNG Đàm nhận được — nút ở thanh bên xưa nay mở `'current'` (tuần
   đang chạy dở), còn hộp thoại tự bật thì mở `'previous'` (tuần đã xong).
3. **Chấm ở nút "Báo cáo tuần" là LƯỚI AN TOÀN, không phải trang trí.** Nó do
   `lastWeeklyReportSeenDate` điều khiển nên nó KHÔNG hết hạn. Thiếu nó thì phương án (D) thoái hoá
   về phương án (A): một lời mời 4 giây có thể bị lỡ, và không còn dấu vết nào cho biết đã lỡ.

**Đánh đổi.** Thêm một trường vào dữ liệu bền (đi qua `normalizePersistedGameState`, ảnh chụp thăng
hoa và `partialize` lên Supabase) — giá phải trả để một trường thôi gánh hai việc. Máy cũ nạp lên có
`lastWeeklyReportSeenDate` rỗng ⇒ chấm sáng một lần và cú bấm đầu tiên đưa đúng bản tuần trước; đó
là hành vi ĐÚNG chứ không phải một ca cần migration.

**Ảnh hưởng.** ADR-060 nay không còn ngoại lệ nào: `blocking` ở `OverlayStack` chỉ còn chứa những
hộp thoại do Đàm bấm hoặc do bốn việc bắt buộc phải quyết định.

**Điều kiện xem lại.** Khi có mục thứ hai xin được tự bật — lúc đó câu hỏi không phải "cho nó bật
không" mà là "nó có buộc phải quyết định gì không".

**Khoá bằng test.** `src/store/gameStore.weeklyReport.test.js` (9 bài, chạy store THẬT với đồng hồ
đóng băng ở một thứ Hai giờ VN, có bài đối chứng khẳng định mốc ấy đúng là thứ Hai). Bảy phép thử
ngược đều đỏ đúng bài dự kiến — trong đó có phép dựng lại chính khuyết tật cũ (toast hết giờ cũng
ghi "đã xem") và phép bỏ luật `'previous'`.

**⚠️ BỔ SUNG CÙNG NGÀY — LƯỚI AN TOÀN PHẢI CÓ MẶT TRÊN CẢ HAI NỀN TẢNG, KHÔNG CHỈ DESKTOP.**
Bản đầu của quyết định này đặt cái chấm "chưa xem" ở **thanh bên desktop**, mà thanh bên là
`hidden md:flex`. Đi đọc lại toàn bộ đường vào mới thấy điều làm hỏng cả lập luận: **trước ADR
này, iPhone KHÔNG có nút nào mở báo cáo tuần** — nút duy nhất nằm đúng ở cái thanh bên ấy. Nghĩa
là trên iPhone, hộp thoại tự bật không phải cách báo cáo *xuất hiện*, nó là cách báo cáo *tồn
tại*; bỏ nó đi mà lưới an toàn lại nằm ở nền tảng kia thì trên thiết bị Đàm dùng nhiều nhất, lỡ
một cái toast 4 giây vẫn là mất báo cáo cả tuần — đúng thứ ADR này sinh ra để tránh.

⇒ Đã thêm mục **"Báo cáo tuần" vào menu "Thêm" trên điện thoại**, mang cùng cái chấm
`weeklyReportUnseen`. Đây là **điều kiện an toàn của quyết định, không phải một tiện ích**: gỡ nó
ra thì ADR-061 trở lại thành một hồi quy, và là hồi quy im lặng (build xanh, lint sạch, mọi bài
test khác xanh). Khoá bằng `rewardToastWiring.test.js` — bài test đòi cả lối vào lẫn cái chấm ở
CẢ HAI thanh điều hướng.

**Bài học chung:** khi gỡ một cơ chế và thay bằng "một lưới an toàn", hãy liệt kê **mọi đường vào
hiện có** trước — một lưới chỉ căng ở một nền tảng thì nó không phải lưới, nó là một lời hứa đúng
một nửa. Cùng họ với luật đã ghi ở `appNavigation.test.js`: *nối một chỗ quên một chỗ — mà iPhone
mới là chỗ Đàm dùng nhiều nhất.*


---

## ADR-061 — Khung hình lùi ra tới mức TỐI THIỂU đủ để không cắt công trình nào; và cái trần 1,35 cũ và lời hứa "không cắt" là hai thứ KHÔNG THỂ CÙNG ĐÚNG

- **Ngày**: 2026-08-24
- **Bối cảnh**: Phase 19 VIỆC 5 — Đàm yêu cầu *"nóc nhà thôi bị mép khung cắt"*, kèm ràng buộc rất
  hẹp: sửa trong `orbit.js`, **giữ `distance = gridSize × factor`, chỉ nới `factor`**, nghiệm thu
  bằng ẢNH. Đây là `TECH_DEBT #24`, mở từ Phase 7B.
- **Vấn đề**: `orbit.test.js` có một bài tên *"KỶ THẤP GIỮ NGUYÊN KHUNG SÁT"* đòi `factor ≤ 1,35`,
  đặt ở Phase 5A với lý do đúng đắn *"đừng thu quá xa rồi bị mờ"*. Đo ra thì **13/15 kỷ cần ≥ 1,47**
  và kỷ 8 cần **1,88** mới không cắt công trình nào. Tức cái trần ấy và lời hứa "không cắt" **không
  thể cùng đúng** — và chính cái trần là thứ đã ĐẺ RA `TECH_DEBT #24`, chứ không phải một khuyết
  tật nào khác. Một cái trần được đặt khi thành phố còn thấp, rồi ở lại sau khi ADR-052 chia ô
  thành khu phố và nhà cao lên: đúng hình dạng ADR-019 (*một kết luận đúng hết đúng vì tiền đề của
  nó bị gỡ ở một phase khác*).
- **Phương án cân nhắc**:
  1. **Giữ trần 1,35, chấp nhận cắt.** Loại: đó là chính cái Đàm yêu cầu sửa.
  2. **Nới trần lên 1,88 cho cả 15 kỷ.** Loại: kỷ 1 chỉ cần 1,307, ép nó ra 1,88 là bắt thành phố
     nhỏ nhất chịu cái giá của thành phố lớn nhất — và một trần chung là đúng bẫy Phase 7D mà
     ADR-028 đã gỡ một lần cho ngân sách lệnh vẽ.
  3. **Nâng `target.y` (chĩa camera lên) thay vì lùi ra.** Loại — và loại bằng SỐ, không bằng lý
     lẽ: đo mép nào là mép sát nhất ở cả 15 kỷ thì **mép TRÊN không bao giờ là mép quyết định**
     (DƯỚI 7 kỷ · TRÁI 6 · PHẢI 2). Cái ràng buộc là hai bên hông và mép dưới, mà chĩa lên/xuống
     thì không chữa được mép hông.
  4. ⭐ **Mỗi kỷ một `factor` RIÊNG, bằng đúng khoảng cách TỐI THIỂU để biên mép còn `FRAME_FIT_MARGIN`**
     — chọn. Tìm bằng chia đôi 40 bước trên [0,8; 4,0], có nhớ kết quả.
- **Lý do chọn**: nó biến một con số VIẾT TAY thành một con số ĐO ĐƯỢC. Bằng chứng nó tối thiểu
  thật: **14/15 kỷ ra biên đúng `0,0400` = sàn**, không dư một li; chỉ kỷ 15 dư (0,0736) vì nó bị
  một sàn KHÁC trói (khoảng lùi theo `massScale`), và ngoại lệ ấy được ghi **tường minh đếm được**
  (`assert.deepEqual(DU_DIA, [15])`) theo đúng khuôn `TECH_DEBT #44` — kỷ thứ hai dư thì đỏ, mà kỷ
  15 hết dư cũng đỏ.
- **Trade-off — VÀ ĐÂY LÀ PHẦN PHẢI ĐỌC, KHÔNG ĐƯỢC BỎ QUA**: hệ số trung bình đi từ nền 1,18 lên
  **1,626**, tức thành phố đứng xa hơn ~38% và chiếm khoảng **53% diện tích khung** so với trước.
  Cái giá ấy hiện ra ở đúng một chỗ đo được: **trục CHẶNG NGÀY của bản quét tụt 14,39 → 11,33**,
  xuống DƯỚI ngưỡng mắt 12 — vì các dải đo là phân số CỐ ĐỊNH của ô, nên thành phố nhỏ lại thì mỗi
  dải bị pha loãng thêm nền trời và nền đất (đúng hình dạng `TECH_DEBT #22`). Đã tách một biến để
  chứng minh: cây mã có đủ VIỆC 1+2+3+4 nhưng **hoàn tác riêng `orbit.js`** ra **14,23** — tức bốn
  việc kia cộng lại chỉ tốn 0,16, còn **2,90 là của riêng phép lùi này**. Và phép lùi KHÔNG rút
  ngắn được: hạ biên an toàn từ 4% xuống 0% chỉ lấy lại 3,3% khoảng cách.
- **Ảnh hưởng**: đóng `TECH_DEBT #24`; mở `TECH_DEBT #89` (trục chặng dưới ngưỡng). Cặp đôi này là
  một **quyết định của Đàm**, không phải của tôi — hai thứ anh đã yêu cầu đang xung đột nhau, và
  cách duy nhất sai là lặng lẽ chọn hộ rồi nới ngưỡng (phễu Phase 9A).
- **Điều kiện xem lại**: khi trục chặng được nâng lại bằng cần gạt THẬT (bầu trời lúc 6h so với
  15h — xem `TECH_DEBT #89`), hoặc khi Đàm chốt hướng.

---


## ADR-060 — MỘT ngôn ngữ hình cho mọi phần thưởng, và một luật MỨC ĐỘ LÀM PHIỀN có phân tầng

**Ngày:** 2026-08-27
**Trạng thái:** đã áp dụng. Không đảo ngược ADR nào.

**Bối cảnh.** App có bảy đường trao thưởng: `LootDropModal` · `LevelUpModal` · `AchievementToast` ·
`DailyMissions` · `PrestigeModal` · `EraCrisisModal` · `WeeklyReportModal`. Mỗi đường tự chọn cách
vẽ và tự chọn màu, và điều đó không dừng ở "mỗi file một kiểu": **riêng `LootDropModal` đã có BA
hình cho ba loại thưởng trong CÙNG một hộp thoại** (`SupportRewardCard` · thẻ trong
`ResourceCascade` · `BonusPill`). Về màu thì có bốn từ vựng rời nhau cùng trả lời một câu hỏi
*"cái này quý tới đâu?"*: bốn "tone" của hộp thoại phần thưởng · ba bậc Tailwind ở `badgeStyles.js` ·
năm hạng huy chương của thành tích · một dòng chữ `tierLabel` của phiên. Đồng thời mọi phần thưởng,
lớn hay nhỏ, đều mở một hộp thoại toàn màn hình — **một phiên Pomodoro thường cũng chặn màn hình**.

**Vấn đề.** Hai thứ, và chúng độc lập với nhau:
1. **Không so được.** Không có cách nào nhìn hai phần thưởng đến từ hai đường rồi biết cái nào quý
   hơn, vì chúng không nói cùng một thứ tiếng.
2. **Làm phiền đồng loạt.** Nhận một hòn đá và lên một kỷ nguyên mới gây ra cùng một mức gián đoạn.

**Phương án đã cân nhắc.**
- **(A) Chỉ thống nhất MÀU, giữ nguyên bảy cách vẽ.** Rẻ nhất. Loại: nó chữa triệu chứng dễ thấy
  nhất mà không chạm vế thứ hai, và bảy cách vẽ vẫn tiếp tục trôi khỏi nhau.
- **(B) Một `RewardModal` chung cho tất cả.** Loại: nó làm vế 2 tệ hơn — chuẩn hoá mức làm phiền
  bằng cách nâng mọi thứ lên mức cao nhất.
- **(C) Đẩy MỌI thứ xuống toast, bỏ hẳn hộp thoại.** Loại: lên kỷ và khủng hoảng kỷ buộc phải
  QUYẾT ĐỊNH; một quyết định trôi qua trong 4 giây là mất quyết định.
- **(D — đã chọn) Một thẻ chung + phân tầng theo *"việc này có buộc phải quyết định không?"*.**

**Giải pháp.** Ba lớp, đúng khuôn ba lớp mà dự án đã dùng cho mái · tầng trệt · mặt đường · thực vật:
- `src/engine/rewardTiers.js` — **BẢNG**: thang độ hiếm duy nhất, **đúng bốn bậc**
  (thường `--muted` · tốt `--good` · hiếm `--warn` · huyền thoại `--accent`), kèm ánh xạ từ cả bốn
  từ vựng cũ. Sống ở `engine/` chứ không ở `components/shared/` (nơi `badgeStyles.js` ở) vì
  `rewardFeed.js` cần nó, mà **chưa từng có file nào trong `engine/` import từ `components/`**.
- `src/components/shared/RewardCard.jsx` — **HÌNH**: một thẻ duy nhất, chỉ vẽ, không đọc store.
- `src/engine/rewardFeed.js` — **LUẬT**: hàm thuần gom sáu kênh thưởng nhẹ thành một hàng đợi,
  cắt còn 3 thẻ + một dòng "và N phần thưởng khác".
- `src/components/RewardToastHost.jsx` — chồng toast ở góc; thay `AchievementToast.jsx` (đã xoá).

**Luật mức độ làm phiền** — chặn màn hình CHỈ dành cho: **lên kỷ · thăng hoa · khủng hoảng kỷ ·
thảm hoạ**. Mọi thứ còn lại đi qua toast, tự tắt sau 4 giây, bấm vào thì mở chi tiết.

**Trade-off.**
- Hộp thoại phần thưởng đầy đủ nay phải BẤM mới thấy ở phiên thường. Đổi lại 25 phút làm việc kết
  thúc bằng một thẻ trượt vào góc thay vì một tấm chắn.
- Một thẻ hẹp hơn hộp thoại ⇒ mô tả phải gói trong một dòng. Bố cục đã qua **hai lần bị ảnh dựng
  bác bỏ** trước khi đúng (xem chú thích trong `RewardCard.jsx`).
- Bốn bậc là ÍT so với năm hạng huy chương ⇒ bạch kim và kim cương dùng chung bậc đỉnh. Chấp nhận:
  một thang màu chỉ đọc được khi số bậc còn đếm được trong một cái liếc.

**Ảnh hưởng.**
- **KHÔNG đổi một luật tính thưởng nào.** Store vẫn bật `lootModalOpen` ĐỒNG BỘ y như cũ (ba bài
  test ở `completeFocusSession.test.js` khẳng định điều đó); toàn bộ thay đổi nằm ở tầng hiển thị,
  đúng điểm cắm mà `RewardSequence` đã chọn từ Phase 4′.
- **Ba kênh thông báo chết nay sống lại.** `relicNotification` · `rankUpNotification` ·
  `missionCompletedIds` được store ghi từ lâu mà **không màn hình nào đọc** — nghĩa là *nhận một
  di vật xưa nay không hiện gì cả*. Chồng toast là chỗ đọc đầu tiên.
- `dismissAchievementNotification` / `dismissMissionNotification` nhận thêm **id tuỳ chọn** (không
  truyền thì hành vi y hệt bản cũ): ba thẻ chồng nhau có ba đồng hồ riêng, nên thẻ thứ ba có thể
  hết trước thẻ thứ nhất và `slice(1)` sẽ bỏ nhầm.
- `LevelUpModal` không còn tự bật; nó thành phần CHI TIẾT mở khi bấm thẻ.

**Điều kiện xem lại.** Nếu Đàm nói toast dễ bị bỏ lỡ ⇒ xem lại 4 giây và số 3, KHÔNG xem lại việc
phân tầng. Nếu có mục thứ hai xin được tự bật ⇒ đọc `TECH_DEBT #87` trước.

---

## ADR-059 — MẠNG ĐƯỜNG là một trục bản sắc: mỗi kỷ tự sinh lấy tập ô đường của mình bằng những CUNG CONG, thay cho một bàn cờ chung cho cả 15 kỷ

**Ngày:** 2026-08-24
**Trạng thái:** đã áp dụng. **ĐẢO NGƯỢC NỬA SAU của ADR-058** (phần "độ lệch tim đường sinh bằng
nhiễu băm nhiều tần số" và trục `coil`/`ragged`), giữ nguyên nửa đầu (độ lệch là thuộc tính của
RANH GIỚI). Thay `ROAD_CELLS` — một hằng số cấp module đã sống từ Phase 6C.

### Bối cảnh

Đàm nhìn thành phố và nói hai lần, lần sau bác chính bản vá của lần trước:

> *"Hãy cải thiện đường đi, hiện tại nó chỉ là những đường thẳng, không giống đường ngoài đời,
> không uốn cong, và nó cũng như quy hoạch quá, các thời trước làm gì có quy hoạch đường thẳng tấp
> thế, và hiện tại ít đường và loại đường quá."*

> *"Không phải là kiểu đường lồi lõm, mà là dạng đường cong hay không cong, như thể là có giao lộ,
> đường uốn quanh ấy, hãy làm lại … hiện tại ở thời nguyên thuỷ hay các thời trước làm gì có đường
> dạng bàn cờ, hiểu không."*

Trước ADR này, `cityLayout.js` có một hằng số `ROAD_CELLS` dựng từ bốn trục `x, y ∈ {0, 4, 8, 11}`
— **một mạng bàn cờ 80 ô dùng chung cho cả 15 kỷ**, từ Göbekli Tepe 9500 năm trước tới Dubai.

### Vấn đề

ADR-058 đã cố chữa đúng lời phàn nàn ấy, và chữa **sai chỗ**: nó cho tim đường lượn nhẹ **bên
trong ô của nó**. Sai lầm bắt nguồn từ một suy luận của chính tôi mà Đàm đã bác:

> Đo được rằng **không thêm được ô đường** (80/144 ô đã là đường, 30 ô còn lại đúng bằng toàn bộ
> nhà dân), rồi từ đó suy ra rằng **không đổi được mạng đường**.

Hai mệnh đề ấy KHÔNG tương đương. Phép đo kia chặn cơ chế **THÊM**; nó không nói một chữ nào về cơ
chế **SẮP XẾP LẠI**. Hậu quả: nhìn từ trên xuống, cả 15 kỷ vẫn là 4 hàng × 4 cột cắt nhau vuông
góc — tức vẫn nguyên cái bàn cờ Đàm chỉ vào ngay từ đầu. Lượn vài phần trăm ô bên trong một ô
không đổi được điều đó, vì thứ mắt đọc ra là **HÌNH DẠNG CỦA CẢ MẠNG**, không phải mép của một đoạn.

Thêm một vấn đề thứ hai, cùng gốc: bảng `networkStyle.js` khi ấy có `coil` (bước sóng lượn) và
`ragged` (biến thiên bề rộng) — cả hai đều chỉ mô tả mép của một đoạn đường. `ragged` còn đẻ ra
đúng thứ Đàm gọi là **"lồi lõm"**: cùng một con đường chỗ nở chỗ tóp theo băm.

### Phương án đã cân nhắc

1. **Giữ bàn cờ, chỉnh mạnh tay hơn các trục cũ** (`coil` ngắn hơn, `bend` cao hơn).
2. **Thêm ô đường** cho mạng phong phú hơn.
3. **Mỗi kỷ tự sinh lấy tập ô đường** bằng cách nối các điểm mốc bằng những cung cong.

### Lý do loại bỏ

- **(1)** Đây chính là thứ vừa bị bác. Về mặt cấu tạo nó không thể đổi hình dạng mạng: `coil` và
  `bend` cùng lắm dịch mép đường vài phần trăm ô, còn tập ô thì đứng yên.
- **(2)** **ĐÃ ĐO TRẦN TRƯỚC KHI VIẾT MÃ** (luật Đàm chốt 2026-08-19): `ROAD_LINES = {0,4,8,11}`
  cho 80/144 ô là đường (55,6%); cộng 45 ô vùng kỳ quan thì **chỉ còn ~30 ô chứa được nhà dân**,
  và cả 15 kỷ đã đứng ở đúng cái trần ấy. Mỗi ô đường thêm vào là một khu nhà bị xoá.

### Giải pháp được chọn — phương án (3), khuôn ba lớp lần thứ MƯỜI

- **`src/engine/roadPlan.js`** (MỚI) = **BỘ SINH**: mỗi kỷ khai một danh sách **đường nối** giữa
  các điểm mốc (5 khu kỳ quan · tâm · các cửa ngõ ở mép lưới), mỗi đường nối được rasterise thành
  một **cung cong** (`arcTrace`) chứ không phải một đoạn thẳng. Hai cung cắt nhau ở đâu thì ở đó có
  **giao lộ** — chữ T, chữ Y, ngã năm — thay vì 16 ngã tư vuông góc đều tăm tắp.
- **`city3d/networkStyle.js`** = **BẢNG 15 kỷ × 6 trục**: `plan` (grid/axial/organic/terrace/radial)
  · `bend` · `arms` · `loops` · `tangle` · `diagonal`. Bỏ hẳn `coil` và `ragged`.
- **`city3d/roadPath.js`** = **HÌNH**: nay chỉ TRA BẢNG `crossings` mà `arcTrace` ghi ra, không
  sinh ra đường lượn nào của riêng mình.
- **`cityLayout.js` · `terrain.js` · `dwellings.js` · `cityMoment.js`** = chỉ ĐỌC.

**Năm kiểu khung**, mỗi kiểu trả lời *"ở nước ấy thời ấy, con đường mọc ra từ ĐÂU?"*: bàn cờ
(Trường An · Manhattan · Singapore · siêu ô phố Xô Viết) · một xương sống (Deir el-Medina · đường
rước thành Ur · trục Sheikh Zayed) · mạng rối (Çatalhöyük · phố cổ Hà Nội · Firenze · Edo) · nan
quạt + vòng thành (Đức trung cổ · Paris) · thềm theo đường đồng mức (Alfama · đồi Pennine).

### Ba điều KHÔNG được làm sai, và cả ba đã trả giá trong chính phiên này

**(a) MỘT KHỐI 2×2 TOÀN ĐƯỜNG KHÔNG PHẢI MỘT CON ĐƯỜNG — NÓ LÀ MỘT CÁI SÂN LÁT.** Mỗi cung được
rasterise ĐỘC LẬP, nên hai cung chạy gần song song cách nhau một ô sẽ tô kín cả dải giữa chúng. Đo
trên bản nháp: **13/15 kỷ có mảng 2×2**, và ở kỷ 13 thì **92% số ô đường nằm trong một mảng như
thế** — nửa dưới thành phố là một vũng bê tông liền. Đây **cùng họ với thứ Đàm đã bác**, chỉ ở một
cấp khác: thứ làm mắt đọc ra "phố" không phải bản thân mặt đường mà là **ĐẤT HAI BÊN NÓ**. Vá bằng
`tiaMangDuong` — bỏ dần những ô vừa nằm trong mảng 2×2 vừa bỏ đi được mà mạng vẫn liền. Sau khi
tỉa: **0–4 khối mỗi kỷ**.

**(b) VÀNH ĐAI KHÔNG ĐƯỢC TỈA.** Bản đầu của phép tỉa ăn cả `tier: 1`, và nó ăn mất chính những
cái vòng: kỷ 5 (Đức, khai `loops: 1`) đi từ 5 chu trình độc lập xuống **0** — cả thành phố thành
một cái CÂY, trong khi bảng khai rành rành là có tường thành. Đúng bẫy `MIN_STONE` (Phase 9D).
Lý lẽ để chừa: một mảng 2×2 sinh ra vì hai cung **tình cờ** chạy sát nhau, còn vành đai là một cấu
trúc **có chủ đích**.

**(c) MỘT KHÚC CUA KHÔNG PHẢI MỘT NGÃ TƯ.** Bản đầu gán vai ĐẠI LỘ cho mọi ô vừa có hàng xóm ngang
vừa có hàng xóm dọc — một luật mượn từ Phase 6C, đúng cho mạng BÀN CỜ nơi ngang-và-dọc chỉ xảy ra ở
chỗ hai trục cắt nhau. Trong một mạng CONG thì gần như mọi ô đều là một khúc cua, nên luật ấy biến
cả mạng thành đại lộ (kỷ 5: 105 ô thì gần hết mang vai đại lộ).

### Trade-off — cái giá đã trả, nói thẳng

- ⚠️ **MẤT LỜI HỨA TƯƠNG THÍCH NGƯỢC "THÀNH PHỐ ĐÀM ĐANG CÓ KHÔNG TỰ SẮP XẾP LẠI"** (Phase 6C).
  Mạng đổi thì thứ tự mở đường đổi — không có cách nào vừa đổi mạng vừa giữ nguyên thứ tự của mạng
  cũ, mà đổi mạng chính là thứ Đàm yêu cầu. Thứ CÒN giữ được là **luật xếp**: `tier` sắp trước mọi
  thứ khác, nên ở mỗi kỷ vành đai vẫn mở sau cùng (thành phố lớn từ trong ra ngoài).
- **Số ô đường đổi theo kỷ** (29 … 83, trước là 80 cho mọi kỷ) ⇒ `ROAD_CELL_COUNT` thôi làm MẪU SỐ
  và chỉ còn dùng để cấp phát bộ đệm; mọi chỗ hiện tiến độ phải hỏi `roadCellCount(era)`.
- **Bốn kỷ có mạng đường là một CÂY** (không đường vòng nào): 1 · 2 · 8 · 15. Cả bốn đều đúng lịch
  sử và được **đếm tường minh** trong test.
- **Hai kỷ không có vành đai** (1 · 2) — cũng đếm tường minh.

### Ảnh hưởng

- **ADR-007 KHÔNG bị đụng**: vị trí 5 kỳ quan suy từ `wonderAnchor(bpId, rank)`, chỉ phụ thuộc
  `bpId` — có test khoá bằng cách gọi kèm dữ liệu rác.
- **Mặt tiền kỳ quan TỐT LÊN**: mạng bàn cờ cũ để **2/75** kỳ quan không có ô đường kề bên; mạng
  mới là **0/75** (nhờ nhánh cụt dẫn vào).
- `city3d/terrain.js` san cao độ theo mạng đường ⇒ mạng **phải là hàm thuần của `era`**; có test
  gọi kèm `sessionCount`/`built` rác và đòi kết quả y hệt.
- Kỷ 10 (Manchester) phải nâng `tilt` 0,26 → 0,36 vì phép đếm "một bậc thềm nuốt quá 60% mặt ĐẤT"
  nay chạy trên một tập ô đất khác. Lý do lịch sử có thật, không phải nới ngưỡng: kênh Rochdale
  phải qua **9 âu thuyền trong 1,6 km** giữa lòng thành phố.

### Điều kiện xem lại

Nếu lưới 12×12 được nới ra, hoặc nếu có ai muốn mạng đường **đổi theo tiến độ** (mở dần theo hình
dạng chứ không theo thứ tự): cả hai đều đụng vào bất biến cao độ mặt đất, phải đọc lại mục "Ảnh
hưởng" trước khi làm gì.

---

## ADR-058 — TIM ĐƯỜNG là một trục bản sắc, và độ lệch của nó là thuộc tính của RANH GIỚI chứ không phải của Ô

**Ngày:** 2026-08-24
**Trạng thái:** đã áp dụng. Mở rộng `streetStyle.js` (Phase 9D / ADR-025) sang chiều DỌC con đường,
và thêm hạng đường thứ BA. Không đảo ngược quyết định nào.

### Bối cảnh
Đàm: *"đường đi hiện tại chỉ là những đường thẳng, không giống đường ngoài đời, không uốn cong, và
nó cũng như quy hoạch quá — các thời trước làm gì có quy hoạch đường thẳng tấp thế, và hiện tại ít
đường và loại đường quá. Hãy tìm hiểu các kỷ có bao nhiêu đường, hình thái, .. và build nó + mở
rộng đường đi"*.

### Vấn đề
Lời ấy chỉ vào một chỗ **TRỐNG trong kiến trúc**, không phải một con số sai. `streetStyle.js` đã mở
mười trục bản sắc cho **MẶT CẮT NGANG** của con đường — rộng bao nhiêu, lát bằng gì, viên to cỡ nào,
có bó vỉa không. Nhưng cả mười trục ấy nói về *một lát cắt*, mà một lát cắt thì không có hình dạng
theo chiều dọc. **TIM ĐƯỜNG chưa bao giờ là một trục bản sắc**: `terrainMesh.js` dựng mọi lòng
đường **chính giữa ô lưới**, nên Göbekli Tepe 9500 năm trước và Dubai hôm nay dùng chung một tấm
lưới bàn cờ hoàn hảo.

Cộng thêm một lỗ hổng thứ hai đo được: `streetCrossSection(style, isLane)` nhận một **boolean**, nên
cả mạng đường chỉ có đúng HAI bề rộng — trong khi **đường vành đai chiếm 36/80 ô (45% cả mạng)** và
được vẽ y hệt ngõ phố.

### Phương án đã cân nhắc

**(A) Thêm ô đường** — cách hiểu đen của "mở rộng đường đi". **BỊ LOẠI BỞI PHÉP ĐO TRẦN**, chạy
TRƯỚC khi viết dòng mã nào (luật của dự án): 80/144 ô đã là đường (55,6%), 45 ô hứa cho kỳ quan,
**chỉ còn 30 ô trống** — và đúng 30 ô ấy là `DWELLING_PLOTS`, tức TOÀN BỘ nhà dân. Mỗi ô đường thêm
vào là một khu nhà bị xoá. Đây chính xác cái trần Phase 14 §1(3) đã đụng khi Đàm đòi "thêm nhà".

**(B) Đổi mạng đường theo kỷ** (kỷ này lưới, kỷ kia ngoằn ngoèo bằng cách đổi Ô NÀO là đường) — bị
loại vì nó dời nhà dân giữa các kỷ và đổi cao độ địa hình, tức đụng vào một vùng đã có ADR-007 canh,
để đổi lấy một hiệu quả mà phương án (C) cho gần như miễn phí.

**(C) ĐÃ CHỌN — không thêm ô, đổi thứ NẰM TRONG một ô.** Con đường trong ô được phép **lệch khỏi
tâm ô và lượn**, bề rộng **thắt/phình dọc đường**, và hạng đường lên **ba**. Cùng số ô, cùng số
lệnh vẽ.

### Giải pháp
Khuôn ba lớp lần thứ **MƯỜI** (sau `vernacularRoof` · `floraStyle` · `streetStyle` ·
`groundFloorStyle` · `roofStyle` · `settingStyle` · `hinterlandStyle` · `blockStyle` · `humanStyle`):

- **BẢNG** `city3d/networkStyle.js` — 15 kỷ × 4 trục (`plan` · `bend` · `coil` · `ragged`),
  `country` khoá cứng vào `eraStyle.js` bằng test.
- **HÌNH** `city3d/roadPath.js` — `boundaryBend` · `buildRoadPaths` · `roadHalfWidth`.
- **NGƯỜI ĐỌC** `terrainMesh.js` (dựng mặt đường) và `residents.js` (cư dân đi bộ) — chỉ ĐỌC.

**Luật sống còn: độ lệch là thuộc tính của RANH GIỚI, không phải của Ô.** Ô (x,y) và ô (x+1,y) cùng
hỏi `boundaryBend(era, 'u', x+1, y)` cho chỗ giáp của chúng, nên chúng **không thể** lệch nhau —
không phải "rất khó lệch". Đây đúng phép `min` đối xứng đã xoá bậc bề rộng ở Phase 12 (ADR-031),
dùng lại cho độ lệch. Đo: **lệch 0 tuyệt đối trên 1.320 cặp ô kề nhau × 15 kỷ**.

**Hạng thứ ba (`ring`) không có vỉa hè** — và đó là một sự thật đô thị, không phải một mẹo để nó
vừa ô: đường chạy vòng ngoài rìa là đường ĐI QUA, không phải đường ĐI DẠO, nên không ai lát vỉa hè
(từ Zwinger trung cổ tới vành đai cao tốc hôm nay). Nó cũng chính là thứ cho hạng này một dáng riêng
mắt đọc ra ngay, độc lập với bề rộng.

### Trade-off đã chấp nhận, nói thẳng
- **Đường càng rộng càng KHÔNG THỂ lượn** — chỗ trống để lượn là `0,5 − nửa bề rộng − vỉa hè`. Ở kỷ
  hiện đại, lòng đường cộng vỉa hè đã lấp gần trọn ô. Đây **không phải khuyết tật**: nó khớp lịch sử
  (lối mòn hẹp thì lượn, đại lộ Xô Viết thì thẳng) và nó là một ràng buộc HÌNH HỌC, không phải một
  con số chọn tay. Kết quả đo: **3/15 kỷ lượn rõ (≥ 0,25 lần bề rộng), 2 kỷ thẳng tuyệt đối theo
  chủ đích (4, 11), 10 kỷ lượn nhẹ.**
- Ngưỡng "0,25 lần bề rộng = mắt đọc ra được" **CHƯA được hiệu chuẩn bằng một phép dựng ảnh**; nó là
  một mốc làm việc, và phải nói rõ như vậy thay vì trình bày như một con số đã đo (`TECH_DEBT #83`).
- Diện tích mặt đường nhìn thấy được **giảm 8%** ở kỷ 6 — một phần do `widthJitter` thắt lại, một
  phần do đường lượn đi khuất sau nhà.

### Ảnh hưởng
Lệnh vẽ **KHÔNG đổi** ở cả 15 kỷ (mặt đường vẫn là MỘT khối, màu đi theo đỉnh). Tam giác mặt đường
+52% ở kỷ 6 và +63% ở kỷ 9, trên một thành phần chiếm ~0,8% cảnh ⇒ không đo được ở tổng.
ADR-007 nguyên vẹn: không ô nào xê dịch, `roadCellCandidates()` không đổi một byte.

### Điều kiện xem lại
Nếu một kỷ nào đó cần lượn mạnh hơn cái trần hình học cho phép, thì cần gạt ĐÚNG là bề rộng lòng
đường hoặc vỉa hè của kỷ ấy trong `streetStyle.js` — **không phải** nới `EDGE_KEEP` hay bỏ phép kẹp,
vì cả hai đều dẫn thẳng tới mặt đường lấn sang thửa đất bên cạnh.

## ADR-057 — Chân giải bằng KHỚP NGƯỢC: đặt bàn chân trước, suy ngược ra góc đùi và góc gối

**Ngày:** 2026-08-24
**Trạng thái:** đã áp dụng — **đảo ngược nửa sau của ADR-056** (bỏ trường `knee` và định lý `sin²`),
vì TIỀN ĐỀ của nó đã bị gỡ. Đồng thời **đóng `TECH_DEBT #82`**.

### Bối cảnh
Đàm xem thành phố sau ADR-056 rồi ra một chỉ thị gộp nhiều việc: *"làm sao cho con người có nhiều
góc bo tròn, **cử động khớp thật**, **có thể vẽ thêm tam giác/khối mỗi ngưới tới lúc nó bo tròn**,
3D nhiều hơn, tăng thêm kiểu đi, chuyển động thật và ít mặt phẳng hơn"*. Hai vế in đậm là hai lệnh
thu hồi tường minh: (a) *khớp thật* bác chính cái mẹo của ADR-056; (b) *vẽ thêm tam giác/khối* thu
hồi trần **11 khối mỗi người** mà chính Đàm đặt ra trước đó.

### Vấn đề
ADR-056 chữa dáng com-pa bằng cách **rút ngắn chân lúc đưa** (`stretchOf`), vì một mesh cứng không
gập được. Cái mẹo ấy đúng trong khuôn khổ của nó và đắt về mặt khái niệm:

- Chân vẫn là **một đoạn thẳng**. Mắt không bao giờ thấy một đầu gối, chỉ thấy một cái chân co giãn
  như ống lồng.
- Nó kéo theo cả một định lý (`knee ≥ 0,5`, hệ số phải là `sin²` chứ không phải `sin`) chỉ để bàn
  chân khỏi trượt — tức một ràng buộc phức tạp sinh ra để phục vụ một mô hình sai.
- Và nó **cấm ba chuyển động có thật**, ghi thành `TECH_DEBT #82`: hông không lắc ngang được, đai
  hông không nghiêng được, đai hông không xoay được. Cả ba đều bị cấm vì cùng một lý do: chúng làm
  bàn chân dịch chỗ, mà bàn chân là **KẾT QUẢ** của chuỗi khớp nên không ai giữ nó lại được.

### Phương án đã cân nhắc
1. **Giữ chân một khối, thêm một khối "bắp chân" trang trí gập theo một hàm sin riêng.** Rẻ nhất.
   Bác: hai khối chuyển động theo hai luật độc lập thì chúng rời nhau ở đúng chỗ đáng lẽ là khớp
   gối — đúng bẫy *"một luật hai công thức"*, và tệ hơn, cả hai công thức đều chạy nên không cái
   nào lỗi.
2. **Khớp thuận (forward kinematics): khai góc hông và góc gối theo pha bước, rồi tính ra bàn chân
   ở đâu.** Đây là cách hiển nhiên, và nó **giữ nguyên toàn bộ bệnh cũ**: bàn chân vẫn là kết quả,
   nên muốn nó đứng yên thì phải đi hiệu chỉnh ngược từng số hạng một. Thêm lắc hông là thêm một số
   hạng bù; thêm xoay đai hông là thêm một số hạng bù nữa. Mỗi chuyển động mới đẻ ra một phép bù,
   và `TECH_DEBT #82` sẽ không bao giờ đóng được.
3. **Khớp ngược (inverse kinematics): đặt bàn chân TRƯỚC, rồi giải ngược ra góc đùi và góc gối.**
   Đắt hơn về khái niệm (phải giải một tam giác bằng định lý hàm cosin) nhưng nó **lật ngược quan
   hệ nhân quả**, và mọi thứ khác rơi ra theo.

### Giải pháp đã chọn — phương án 3
`poseAt` mở đầu bằng đúng ba dòng đặt hai bàn chân trong KHÔNG GIAN THẾ GIỚI, rồi `solveTwoBone`
giải ngược. Hệ quả không phải một cái lợi mà là **bốn cái lợi cùng lúc**, và cả bốn đều *đúng theo
cấu tạo* chứ không phải *đúng nhờ hiệu chỉnh*:

- **Bàn chân đứng yên tuyệt đối** trong pha tiếp đất — đo được **4,86 × 10⁻¹⁷ ô** trên 210 tổ hợp
  (14 kiểu đi × 15 kỷ). Đó là sai số dấu phẩy động, không phải một dung sai.
- **Đai hông được phép lắc ngang, nghiêng, và xoay** — cả ba miễn phí, vì cái chân tự lo phần còn
  lại. `TECH_DEBT #82` đóng lại không cần một số hạng bù nào.
- **Trường `knee` và định lý `sin²` biến mất**, không phải vì chúng sai mà vì tiền đề *"mesh cứng
  không gập được"* đã bị gỡ (bẫy Phase 8C).
- **`reach` trở thành một bất biến đọc được**: tỉ số giữa khoảng cách hông→bàn chân và tổng chiều
  dài hai đoạn xương. Chạm 1 là chân duỗi thẳng đơ; vượt 1 là bàn chân nằm ngoài tầm với và phép
  giải buộc phải kẹp lại ⇒ trượt. Nó chỉ thẳng vào NGUYÊN NHÂN, còn "bàn chân trượt" chỉ là triệu
  chứng. Đo được: cao nhất **0,9928** ở kỷ 12 (`march`, sải chân dài nhất bảng).

Kèm theo, ba việc còn lại của chỉ thị:
- **Bo tròn**: bộ khuôn 7 → **9** (thêm `calf` cho cẳng chân, `flare` cho tà áo loe), và mọi khuôn
  không phải hộp đi từ 8 lên **12 mặt** cùng 3 tới 6 **VÀNH**. ⚠️ Số **vành** mới là thứ quyết định
  "nhìn có phẳng không", không phải số mặt — xem mục Bài học.
- **Khớp hai trục**: mỗi khớp nay có `a` (ngửa quanh trục ngang-màn-hình) và `b` (lắc quanh trục đi
  tới), ghép theo thứ tự cố định `Rx(b) · Rz(a)` ở cả tầng thuần lẫn tầng cảnh.
- **Bảng dáng đi 9 → 14 kiểu, 4 → 6 trục** (`lift · flex · sway · twist · headTrack · splay`).

### Trade-off
- **Giá phải trả**: +1 lệnh vẽ ở **cả 15 kỷ** (khuôn `calf` là một `InstancedMesh` nữa) và tam giác
  mỗi người đi từ 220…324 lên **1.616…1.928** (×6,4). Cư dân nay chiếm **16,3%…26,1%** tam giác
  cảnh, so với trần cũ 6%. Đây là cái giá Đàm đã cho phép tường minh, không phải một cái phễu.
- **Chưa đo lại mili-giây.** Hộp cát dựng bằng SwiftShader (bộ tô hình chạy trên CPU), mà luật của
  dự án là *"một con số đo trong hộp cát chỉ được dùng để so các trường hợp TRONG hộp cát ấy"*. Bốn
  căn cứ để tin là an toàn (dư 3,2 lần trên máy thật · 80% chi phí đi theo ĐIỂM ẢNH chứ không theo
  tam giác · cư dân không đổ bóng · lệnh vẽ chỉ +1) đều là suy từ phép đo CŨ trên MacBook của Đàm,
  không phải phép đo MỚI. Muốn xác nhận: `bash scripts/bench-macbook.sh`.
- **Phép giải phức tạp hơn**: `solveTwoBone` có một nhánh kẹp khi bàn chân ngoài tầm với. Nhánh ấy
  hôm nay **không bao giờ chạy** (0,9928 < 1), và đó là lý do phải có một bài test bơm `stride: 5`
  để chứng minh nó vẫn còn hoạt động — một nhánh chưa từng chạy là một nhánh chưa từng được kiểm.

### Ảnh hưởng
- `humanPose.js` viết lại hoàn toàn; `stretchOf` và `legFactorAt` bị xoá, `sceneGraph.js` bỏ theo.
- `human.js`: 11 → 16…18 khối, 3 → 11 khớp (thêm `pelvis`, `elbowL/R`, `kneeL/R`).
- Bảng ngân sách `MOC_LENH_VE` và `CANH_TAM_GIAC` đo lại toàn bộ, neo bằng Chromium ở 3 kỷ.

### Điều kiện xem lại
Nếu `bash scripts/bench-macbook.sh` trên máy Đàm cho ra một cảnh vượt **8 ms** (mức làm việc đã
chốt ở `PERFORMANCE.md`), thì cắt số vành của các khuôn xuống trước, đừng cắt số khớp — vành là
thứ mắt chỉ thấy khi nhìn gần, còn khớp là thứ thấy ở mọi khoảng cách vì nó đổi ĐƯỜNG VIỀN.

### Bài học rút ra
1. ⚠️ **Số VÀNH quyết định "phẳng hay không", không phải số MẶT.** Một khuôn hai vành cho ra ĐÚNG
   MỘT dải sáng dọc dù `sides` bằng 8, 12 hay 64 — vì cả 8 mặt bên đều là hình thang PHẲNG. Thứ
   sinh ra dải sáng thứ hai là một **ĐIỂM UỐN** trên đường sinh (thắt gối, eo, sườn lõm). Đọc một
   hồ sơ `{sides, rings}` thì phải hỏi **hai** câu riêng: *"nhìn từ trên xuống nó tròn tới đâu"* và
   *"nhìn ngang nó có gãy khúc không"*. Trộn hai câu ấy vào một chữ "mượt" là lần thứ **bảy** của
   *"một trường gánh hai việc"* trong dự án này.
2. ⚠️ **Đổi chiều nhân quả của một mô hình có thể xoá nhiều ràng buộc CÙNG LÚC.** Ba mục cấm của
   `TECH_DEBT #82` không được gỡ từng cái một — chúng biến mất cùng nhau, vì cả ba đều là hệ quả
   của việc bàn chân là ĐẦU RA. Khi một danh sách hạn chế dài ra mà mọi mục đều quy về cùng một câu
   *"vì X là kết quả chứ không phải đầu vào"*, hãy hỏi có đảo được X không, thay vì đi bù từng mục.
3. ⚠️ **Một cái trần do người dùng đặt ra thì chỉ người dùng thu hồi được, và khi họ thu hồi thì
   phải ghi lại NGUYÊN VĂN.** Trần 11 khối có một lý lẽ đúng (*"ở cỡ 18 px thì khối thứ 12 không
   đổi được điểm ảnh nào"*), nhưng lý lẽ ấy nói về khung TOÀN CẢNH, mà ADR-034 đã thêm lối đưa mắt
   tới gần từ lâu. Tiền đề đổi trước, lệnh thu hồi tới sau.
4. ⚠️ **Một bản vá đúng làm đỏ sáu bài test cũ, và KHÔNG bài nào đỏ vì mã hỏng.** Bốn bài đo một
   mô hình đã chết (`legFactorAt`, hệ số `sin²`, chân là một khối, trần 80 tam giác), hai bài đếm
   sai số khối vì cụm chân nay có 6 khối chứ không phải 4. Phản xạ sai nhất lúc ấy là nới ngưỡng
   cho hết đỏ. Ví dụ cụ thể: bài *"biên độ khớp có trần"* đòi góc đùi ≤ `asin(stride/4)` — một trần
   suy từ tam giác vuông của mô hình chân CỨNG. Có đầu gối thật thì đùi **phải** nghiêng nhiều hơn
   thế (đo được 57,3° so với 27,5° ở kỷ 1). Giữ nguyên con số ấy làm trần là dùng một bài test để
   hoàn tác một bản vá đúng; cách đúng là **đổi vai của nó thành SÀN**.

---

## ADR-056 — DÁNG ĐI là một trục bản sắc riêng, và bốn chiều chuyển động mới đều phải luồn qua ràng buộc "bàn chân không được trượt"

**Ngày:** 2026-08-24
**Trạng thái:** đã áp dụng

### Bối cảnh
ADR-053 cho cư dân bộ xương có khớp, ADR-055 cho họ hình khối tròn xoay. Đàm nhìn kết quả rồi ra
chỉ thị tiếp: *"Tiếp tục trau chuốt, ít ảnh phẳng hơn, tạo nhiều đặc trưng hơn, di chuyển mượt mà
hơn (nhiều kiểu di chuyển), mỗi kỷ phải tốt hơn, mỗi người phải ra dáng người hơn và không cử động
như robot, hình ảnh 3D hơn, đẹp hơn."*

### Vấn đề — HAI thứ, và chúng độc lập với nhau

**(1) "KHÔNG CỬ ĐỘNG NHƯ ROBOT" LÀ MỘT LỜI TỐ CÁO CHÍNH XÁC VỀ HÌNH HỌC, KHÔNG PHẢI MỘT CẢM GIÁC.**
Trước bản này, toàn bộ chuyển động của một cư dân nằm gọn trong **một mặt phẳng đứng dọc theo hướng
đi**: hai cái que xoay quanh hông, hai cái que xoay quanh vai, một cái nhún suy ra từ chân trụ. Ba
chiều chuyển động mà người thật có — **lắc ngang**, **vai xoay ngược hông**, **đầu gối co** — đều
bằng **0 tuyệt đối**, không phải "nhỏ".

Trong ba cái đó, cái đắt nhất là đầu gối, và lý do thì không phải thẩm mỹ mà là hình học: chân cứng
dài đúng `legLen` thì ở GIỮA pha đưa chân, hông đang cao đúng `legLen` (chân trụ thẳng đứng) còn
chân đưa cũng duỗi thẳng xuống `legLen` ⇒ **bàn chân ở đúng cao độ 0, tức nó quệt mặt đường**. Đó
chính là dáng đi compa của hình nhân đồ chơi.

**(2) `stride` · `walkSpeed` · `armSwing` CHỈ CHỈNH ĐƯỢC ĐỘ LỚN CỦA CÙNG MỘT CHUYỂN ĐỘNG.** Chúng
cho ra người bước dài hơn hoặc gấp hơn; chúng không cho ra một **CÁCH ĐI** khác. Người gánh nước,
người đội thúng, người lê chân trong tuyết và người tất bật trên vỉa hè Tokyo khác nhau ở chỗ hoàn
toàn khác, và không trục nào trong ba trục ấy diễn đạt nổi.

**(3) HÌNH KHỐI CỦA ADR-055 VẪN CÒN QUÁ THẲNG.** Mỗi khuôn khi đó có đúng HAI vành, mà với pháp
tuyến phẳng theo từng mặt thì hai vành cho ra đúng **một dải sáng** theo chiều dọc: tám mặt bên đều
là hình thang phẳng, sáng đều từ chân lên đỉnh. Bỏ hộp rồi mà mắt vẫn đọc ra "ống nhựa".

### Phương án đã cân nhắc

**A. Thêm khớp thật (tách chân làm đùi + cẳng, tay làm bắp + cẳng).** Đúng nhất về giải phẫu.
**Loại**: tốn 4 khối/người, đẩy 4 kỷ từ 11 lên 15 khối, vượt trần 11 mà Đàm chốt. Và trần ấy có căn
cứ đo được (*"ở cỡ 18 px thì khối thứ 12 không đổi được điểm ảnh nào"*).

**B. Một trường "biên độ nhún" trong bảng dáng đi**, để kỷ 6 nảy theo đòn gánh. **Loại sau khi đã
thử**: nó đẩy hông LÊN TRÊN chiều cao đứng yên, phá thẳng bất biến *"cái nhún luôn kéo xuống"* — mà
bất biến ấy đúng vì một lý do vật lý thật: mô hình này **không có cổ chân**, nên "nhón chân" là điều
nó không được phép giả vờ. Cái nảy nay diễn đạt bằng `headTrack` ÂM (thân trên nảy mạnh hơn hông),
cùng một hiện tượng nói bằng một đại lượng mà mô hình này có thật.

**C. Cho cả thân LẪN hông lắc ngang.** Đúng nhất về sinh cơ học. **Loại**: bộ khớp chỉ xoay quanh
MỘT trục (trước-sau), nên chân không dạng ra bù được ⇒ bàn chân trượt ngang 3 tới 4 điểm ảnh với
kiểu `roll`. Chỉ thân trên lắc; phần còn thiếu ghi ở `TECH_DEBT #82`.

**D. Cho đai hông xoay ngược cùng đai vai.** Đúng nhất. **Loại sau khi ĐO**: biên độ
`hipZ · sin(0,14) ≈ 0,0028 ô` = **0,2 điểm ảnh**, dưới ngưỡng mắt kể cả ở khung cận cảnh, trong khi
nó buộc phải thêm một số hạng bù vào chính cái luật chống-trượt cộng hai cái trần trong bài test.
Xoay riêng vai đã cho ra trọn vẹn độ xoay TƯƠNG ĐỐI — thứ mắt thật sự đọc.

### Giải pháp đã chọn

**(a) TRỤC THỨ 12 `gait`, KHUÔN BA LỚP LẦN THỨ MƯỜI.** `city3d/humanGait.js` = BẢNG 9 kiểu đi ×
4 trường thuần (`knee` · `sway` · `twist` · `headTrack`) → `humanPose.js` = CHUYỂN ĐỘNG →
`sceneGraph.js` = chỉ ghép ma trận. Mỗi kỷ khai một kiểu, buộc vào `country` và vào chính những
trường đã có (kỷ 2 `glide` vì `carry: 'pot'`; kỷ 6 `bounce` vì cái đòn gánh cũng là thứ ép
`stride: 1,34`).

**(b) ĐẦU GỐI GIẢ, VÀ GỌI ĐÚNG TÊN NÓ.** Khối cứng không gập được, nên chân **rút ngắn** giữa pha
đưa chân. Thứ mắt đọc ở 18 điểm ảnh không phải cái đầu gối mà là **QUỸ ĐẠO BÀN CHÂN**, và quỹ đạo
ấy thì đúng: bàn chân nay nhấc lên `legLen × (1 − knee)` = 5% (lê) tới 34% (đi đều) chiều dài chân.

⚠️ **Hàm rút chân phải là `sin²`, và đó là một ĐỊNH LÝ chứ không phải một lựa chọn cho mượt.** Góc
hông là `asin(off / (legLen·f))`, nên rút chân là NHÂN góc lên, mà góc hông có trần
`asin(stride/4)`. Với `s = sin(πu)`, cần `√(1−s²) ≤ f`. Dùng `f = 1 − c·s` thì gần hai đầu pha vế
phải tụt TUYẾN TÍNH còn vế trái tụt theo `s²/2` ⇒ bất đẳng thức **vỡ ngay sát mép, ở MỌI giá trị
`knee < 1`**. Dùng `f = 1 − c·s²` thì đặt `g(s) = 1 − c·s² − √(1−s²)`: `g(0) = 0`, `g(1) = 1 − c > 0`,
`g′(s) = s·(1/√(1−s²) − 2c) > 0` với mọi `c ≤ 0,5` ⇒ `g ≥ 0`. Đúng khi và chỉ khi **`knee ≥ 0,5`**,
và `isValidGaitProfile` từ chối thẳng mọi giá trị dưới đó.

**(c) HAI CHIỀU CHUYỂN ĐỘNG MỚI, CẢ HAI TỐN 0 KHỐI.** Lắc ngang chỉ áp cho thân/vai/đầu; vai xoay
ngược quanh trục đứng, diễn đạt bằng một độ lệch x đối xứng nên không cần thêm trục quay nào vào
đường ghép ma trận.

**(d) HỒ SƠ KHUÔN NHIỀU VÀNH, CỘNG KHUÔN THỨ TÁM `chest`.** Mỗi khuôn nay có ít nhất một **điểm đổi
chiều** (đầu gối thắt, eo thắt, sườn nón lõm) — chỗ GÃY giữa hai dải sáng mới là thứ mắt gọi là "có
khối". Thân phải tách ra khuôn riêng vì một cái chân thắt ở đầu gối rồi nhỏ hẳn ở cổ chân, còn một
cái thân thắt ở EO rồi nở lại ở hông: hai đường cong ngược nhau ở nửa dưới, dùng chung một hồ sơ thì
một trong hai phải sai. Lần thứ BẢY của họ *"một trường gánh hai việc"*, lần này thứ gánh hai việc
là một HỒ SƠ HÌNH HỌC.

### Trade-off
- **Tam giác mỗi người 220…324 → 476…628** (nặng nhất kỷ 8). Ca xấu nhất theo tỉ lệ là kỷ 1:
  **9,68%** cảnh. Trần tỉ lệ nâng **6% → 11%** — xem mục dưới, đây là chỗ phải đọc kỹ nhất.
- **Lệnh vẽ +1 mỗi kỷ** (khuôn `chest`): 11…17 → 12…18.
- **Trần 11 khối/người KHÔNG đổi.** Cái tăng là số tam giác mỗi khối, không phải số khối.
- `twist` **dưới ngưỡng mắt ở khung mặc định** (≈0,5 điểm ảnh mỗi vai). Nó dành cho khung cận cảnh
  (ADR-034), và điều đó được khai ngay trong chú thích của bảng theo đúng luật HỆ QUẢ 2b.
- Đai hông không xoay, thân dưới không lắc ⇒ `TECH_DEBT #82`.

### ⚠️ Vì sao được phép nâng trần tam giác 6% → 11%
Con số 6% **chưa bao giờ được buộc vào một phép đo thời gian nào** — nó là một trần tự đặt, và một
trần tự đặt rất dễ bị đọc thành một sự thật vật lý. Bốn căn cứ, xếp từ mạnh xuống yếu:
1. `PERFORMANCE.md` đo trên chính MacBook Air M3 của Đàm: cảnh chậm nhất **5,20 ms** trên trần
   16,67 ms ⇒ **dư 3,2 lần**; mô hình chi phí là *"0,87 ms cố định + 1,14 ms mỗi triệu điểm ảnh
   thật"* ⇒ **80% chi phí theo ĐIỂM ẢNH**. Bằng chứng trực tiếp: tam giác thành phố chênh **43%**
   giữa kỷ 3 và 11 mà thời gian chỉ chênh **2,4%**.
2. Cư dân **không đổ bóng** ⇒ không tốn gì ở lượt dựng bản đồ bóng, lượt đắt nhất mà hình học trả.
3. Đàm gỡ cổng hiệu năng 2026-08-21 và 2026-08-24 lại yêu cầu đúng hướng này.
4. Trần 11 KHỐI không đổi ⇒ không đụng vào luận cứ khả-đọc-ở-18-px.

⚠️ **GIỚI HẠN PHẢI NÓI THẲNG: chưa đo lại mili-giây.** Hộp cát chạy SwiftShader, mà luật dự án là
*"một con số đo trong hộp cát chỉ được dùng để so các trường hợp TRONG hộp cát ấy"*. Bốn căn cứ trên
đều suy từ phép đo CŨ trên máy thật. Xác nhận bằng `bash scripts/bench-macbook.sh` trên máy Đàm.

### Ảnh hưởng
`humanGait.js` (mới) · `humanShape.js` (8 khuôn, hồ sơ nhiều vành) · `humanStyle.js` (trục thứ 12) ·
`humanPose.js` (4 chiều chuyển động mới, `stretchOf`, `legFactorAt`) · `human.js` (thân và áo cắt
may dùng `chest`) · `sceneGraph.js` (áp hệ số rút chân vào ma trận) · bảng `MOC_LENH_VE`,
`MOC_TRUOC_HINH_KHOI`, `CANH_TAM_GIAC` đo lại.

### Điều kiện xem lại
- Nếu trần 11 khối được nới thì đầu gối THẬT (tách đùi/cẳng) là bước tiếp theo, và lúc đó `knee`
  đổi nghĩa từ "chân còn bao nhiêu phần" sang "gối gập bao nhiêu độ".
- Nếu bộ khớp có thêm trục quay thứ hai thì `TECH_DEBT #82` (hông lắc, hông xoay) mở lại được.
- Nếu Đàm đo `bench-macbook.sh` ra trên 8 ms thì phải xem lại trần 11%.

---

## ADR-055 — Cơ thể cư dân dựng bằng MẶT TRÒN XOAY khai bằng dữ liệu thuần, không bằng hình khối của three; và một ngân sách lạc hậu theo hướng SIẾT thì im lặng vĩnh viễn

**Ngày:** 2026-08-23
**Trạng thái:** đã áp dụng

### Bối cảnh
ADR-053 cho cư dân một bộ xương có khớp; ADR-054 chữa màu. Đàm nhìn kết quả rồi ra chỉ thị tiếp:
*"Tiếp tục tối ưu hoá model con người, làm cho chân thật nhất, ít ô vuông hơn và giống 3D hơn, làm
kỹ từng kỷ."*

Chữ **"ít ô vuông hơn"** mô tả chính xác thứ đang có: mọi bộ phận của mọi kỷ đều là
`new BoxGeometry(1, 1, 1)` co giãn bằng ma trận. Một cái đầu là hộp, một cái nón lá là hộp, một cái
vò gốm là hộp.

### Vấn đề — HAI thứ, và cái thứ hai mới là thứ giữ cho cái thứ nhất tồn tại lâu như vậy

**(1) MỘT KHỐI HỘP CHỈ CHO MẮT BA MẢNG SÁNG.** Với một nguồn sáng định hướng, một hộp lộ ra tối đa
ba mặt: đỉnh, một mặt hướng nắng, một mặt khuất. Ba mảng phẳng cạnh nhau đọc ra là **một tấm bìa
gấp**, không đọc ra là một cái khối — và mười một tấm bìa gấp xếp chồng lên nhau vẫn là bìa. Đây
không phải chuyện thiếu chi tiết (thêm hộp không chữa được), mà là chuyện **số mức chuyển sáng**.
Một lăng trụ 8 mặt cho **tám** mảng chuyển dần; tám mức chính là thứ mắt gọi là "tròn".

**(2) NGÂN SÁCH TAM GIÁC GHI TRONG `human.js` ĐÃ LẠC HẬU 5,4 LẦN — THEO HƯỚNG SIẾT.** Chú thích ở
đó tính trần "136 tam giác mỗi người" từ mẫu số *"kỷ 1 = 19.434 tam giác thành phố"*. Đo lại
(`scripts/scene-tri.mjs`): kỷ 1 nay là **104.958**, vì Phase 14 §1(3) làm mỗi ô thành một KHU PHỐ.
Cùng 6%, cùng `MAX_RESIDENTS = 28`, trần thật là **319 tam giác mỗi người**. Cơ thể lúc ấy tiêu 108.

⚠️ **Một trần lạc hậu theo hướng SIẾT thì không ai phát hiện.** Nó không làm gì hỏng — nó chỉ làm
một hướng đi tốt trông như đã bị cấm. Trần lạc hậu theo hướng nới thì sớm muộn có người kêu máy
giật; trần lạc hậu theo hướng siết thì **im lặng vĩnh viễn**. Đây là mặt còn lại của bài học
Performance Gate 2026-08-17, và nó chính là thứ đã giữ cơ thể ở dạng chồng-gạch lâu hơn cần thiết.

### Phương án đã cân nhắc

**A. Giữ hộp, chia nhỏ thêm.** Bắp tay tách khỏi cẳng tay, đùi tách khỏi cẳng chân, thêm bàn tay.
**Loại**, hai lý do độc lập: (i) Đàm đã chốt trần **11 khối/người** (*"ở cỡ 18 px thì hộp thứ 12
không đổi được điểm ảnh nào"*) và bộ hiện tại đã dùng 9–11; (ii) căn bản hơn, thêm hộp **không xoá
được cái phẳng, nó nhân bản cái phẳng** — hai mươi hai mảng sáng phẳng thay vì mười một.

**B. Dùng `SphereGeometry`/`CylinderGeometry`/`CapsuleGeometry` của three.** Rẻ nhất về công viết.
**Loại**, ba lý do: (i) `src/engine/city3d/` là tầng **THUẦN**, không được `import` three — đưa
hình khối của three vào đây là phá đúng ranh giới mà `flora.js` (ADR-020) và `streetStyle.js`
(ADR-025) đã dựng; (ii) các khối ấy sinh **normal nội suy mượt**, trong khi toàn bộ ngôn ngữ hình
ảnh của thành phố là **mặt phẳng cắt gọt** — một cư dân bóng mượt đứng giữa một thành phố lập thể
đọc ra là một dị vật, không phải một cải tiến; (iii) chúng không tham số hoá được theo *"thon về
phía nào"*, mà đó chính là thứ phân biệt một cái chân với một cái vò gốm.

**C. (CHỌN) Một bộ khuôn dựng bằng MẶT TRÒN XOAY, khai bằng dữ liệu thuần, normal PHẲNG theo mặt.**

### Giải pháp
`src/engine/city3d/humanShape.js` (thuần) — bảy khuôn, mỗi khuôn là một hồ sơ dữ liệu
`{sides, rings: [[y, r]]}`:

| khuôn | mặt | tam giác | dùng cho | vì sao |
|---|---|---|---|---|
| `box` | 4 | 12 | bàn chân · cặp/vali | đế phẳng, gót vuông — vuông là ĐÚNG ở đây |
| `prism` | 8 | 28 | búi tóc · da thú · vải quấn · cán giáo · bó củi | vật QUẤN hoặc VÓT tròn |
| `limb` | 8 | 28 | tay · chân · thân · áo khoác · âu phục | thon xuống dưới (đùi > bắp chân) |
| `flare` | 8 | 28 | áo chùng · áo choàng · khăn trùm · vò gốm | gấu BUÔNG thì xoè ra |
| `cone` | 8 | 14 | nón lá | có CHÓP |
| `dome` | 8 | 44 | đầu · mũ trụ · mũ vải mềm | sọ tròn, bẹt đỉnh, thon cằm |
| `hat` | 8 | 60 | mũ vành cứng | vành + chỏm là MỘT vật |

Ba quyết định con, mỗi cái đều có thể tự đứng làm một bài học:

**(a) "MẶT PHẲNG = 1,0", KHÔNG PHẢI "BÁN KÍNH = 0,5".** Bán kính đỉnh dựng bằng
`R = 0,5 / cos(π/sides)` và các đỉnh lệch pha nửa cung, nên **độ trải theo x và z đúng bằng ±0,5** —
y hệt hộp cũ. Nhờ vậy `partCornersAt`, `silhouetteSpanX`, `human-scale.mjs`, `humanPose.js` và mọi
con số hiệu chuẩn quanh chúng **không phải đổi một dòng nào**. Nếu chọn quy ước "bán kính = 0,5"
thì mọi khối co lại 7,6% và toàn bộ bảng tỉ lệ cơ thể phải hiệu chuẩn lại — một phép đổi đơn vị
âm thầm, đúng loại việc đẻ ra nợ. (`sides = 4` qua đúng công thức ấy tái tạo **chính xác** hộp đơn
vị, nên `box` không phải một nhánh đặc biệt mà là một trường hợp của cùng một luật.)

**(b) `shape` LÀ THAM SỐ BẮT BUỘC, không có mặc định.** Cho nó rơi ngầm về `'box'` thì mọi khối
viết sau này sẽ lặng lẽ quay lại làm viên gạch — đúng cái đã xảy ra với `vernacularRoof` khi nó còn
là trường tuỳ chọn (Phase 7C). Khai sai tên khuôn thì **ném ngay ở tầng thuần**.

**(c) MŨ VÀNH LÀ MỘT KHỐI, VÀ CÁI TRẦN CỦA ĐÀM ĐÃ ÉP RA CÂU TRẢ LỜI ĐÚNG.** Bản đầu dựng nó bằng
HAI khối (đĩa + chỏm) vì *"một cái mũ vành thì có hai phần"*. Nó đẩy kỷ 8 lên **12 khối**, vượt
trần 11, và bài test đỏ. Phản xạ sai là nới trần. Hỏi lại *"ngoài đời đây là mấy vật?"* — **một**;
và một cái mũ là một mặt tròn xoay liền khối, thứ `humanShape.js` dựng được. Kết quả **vừa giữ
trần, vừa đúng hình học hơn, vừa rẻ hơn 12 tam giác**.

`src/components/city/render3d/humanGeometry.js` biến hồ sơ thuần thành `BufferGeometry` **không
chỉ mục** với normal phẳng theo mặt. `sceneGraph.js` gom khối theo KHUÔN: mỗi khuôn một
`InstancedMesh` (một `InstancedMesh` chỉ mang được một hình học).

### Trade-off — nói thẳng cái giá
- **Tam giác mỗi người 108 → 220…324** (×2,0…×3,0). Trần thật là 319 với mẫu số của kỷ 1; ca xấu
  nhất đo đủ 15 dòng là **kỷ 1 = 5,40%** trên trần 6% ⇒ biên còn **10,0%**. Kỷ 8 tiêu nhiều tam
  giác nhất (324) nhưng mẫu số của nó lớn hơn nên tỉ lệ thấp hơn.
- **Lệnh vẽ: cư dân nay tiêu đúng `(số khuôn − 1)` lệnh thêm mỗi kỷ, tức +2…+5.** Trước bản này cả
  cơ thể là một khuôn duy nhất nên chi phí ấy bằng 0. Đây là một khoản chi có thật, và nó được
  chấp nhận theo đúng lời Đàm 2026-08-21 (*"không quan trọng hiệu năng, máy tôi là M3"*) — bảng
  lệnh vẽ nay là một CÁI CÂN, không phải một CÁI CỔNG.
- **"Ca xấu nhất là kỷ 1" thôi là một LẬP LUẬN, nay là một KẾT LUẬN.** Lý lẽ cũ (*"cư dân tốn một
  lượng CỐ ĐỊNH nên tỉ lệ cao nhất ở kỷ có mẫu số nhỏ nhất"*) đứng trên tiền đề "tử số cố định",
  mà từ bản này mỗi kỷ một cơ thể khác nhau. Nay phải **tính đủ 15 dòng** mới biết ca xấu nhất ở
  đâu. Kết quả vẫn là kỷ 1 — nhưng ta BIẾT thế chứ không SUY thế.

### Ảnh hưởng
- `humanShape.js` · `humanGeometry.js` MỚI; `human.js` không còn khối `box` nào ngoài bàn chân,
  cái cặp và mô hình `lowDetail`.
- `drawCallBudget.test.js`: hằng số `TAM_CO_DINH_KHO = 4` **sai +1 ở CẢ 15 KỶ** kể từ ADR-053 (nó
  gộp hai lưới cư dân làm một mà không ai sửa hằng số). Không lộ ra vì bài test so **một công thức
  với một bảng suy từ chính công thức ấy** — một cái gương, không phải một cái cân. Nay bảng được
  **neo vào ba phép đo Chromium độc lập** và phần cư dân đọc thẳng `humanShapesUsed(era)`.
- `humanPose.test.js`: cụm chân nay là 4 khối (chân + bàn chân mỗi bên); danh sách ngoại lệ đếm
  được của phép đo hình bóng **tốt lên** từ `[6, 7]` xuống `[6]`.

### Điều kiện xem lại
- Nếu Đàm muốn cư dân đọc rõ ở khung TOÀN CẢNH (không phải cận cảnh): bản này **không** giải bài
  toán đó — ở 14–18 điểm ảnh, tám mảng sáng và ba mảng sáng chênh nhau dưới ngưỡng mắt. Bài toán
  ấy là bài toán KHUNG HÌNH, xem `TECH_DEBT #80`.
- Nếu một kỷ nào đó cần khuôn thứ tám: thêm vào `PROFILES`, và bài test *"mọi khuôn phải có ít nhất
  một kỷ dùng tới"* sẽ đỏ nếu nó thành một trục chết.
- Nếu trần 11 khối được nới: đọc lại (c) trước — cái trần ấy đã ép ra một thiết kế tốt hơn một lần.

---

## ADR-054 — Vật liệu của thứ đội trên đầu là một TRỤC RIÊNG, không phải một sắc độ của quần; và một tham số bị một biến cùng tên che khuất đã giết hai tính năng trong im lặng

**Ngày:** 2026-08-23
**Trạng thái:** đã áp dụng

### Bối cảnh
`humanStyle.js` vừa được thiết kế đủ 15 kỷ (ADR-053). Bộ chấm bản sắc bằng SỐ báo xanh sạch:
105/105 cặp kỷ khác nhau ở ít nhất một thứ mắt đọc được, trung vị 8/9 trục. Theo mọi cổng số thì
việc đã xong.

Rồi 15 cư dân được dán cạnh nhau và phóng to (`scripts/human-strip.mjs`) — **cả 15 đều nâu**.

### Vấn đề — HAI lỗi độc lập, cùng lộ ra trong một lần nhìn

**(1) MỘT THAM SỐ BỊ CHE KHUẤT BỞI MỘT BIẾN CÙNG TÊN.** `buildScenePalette({ …, era: eraNumber, … })`
đổi tên tham số `era` (một SỐ KỶ) thành `eraNumber` ngay dòng khai báo, rồi vài dòng sau gán một
`const era` KHÁC — một MÀU. Từ đó hai dòng ở cuối hàm:

```js
const flora = getFloraStyle(era);   // ← truyền một OBJECT MÀU vào hàm chờ một SỐ KỶ
const human = getHumanStyle(era);
```

Cả hai hàm ấy **cố ý** rơi về kỷ 1 với dữ liệu lạ (không được ném lỗi giữa màn hình Thành Phố), nên
hậu quả là **15 kỷ dùng chung một màu lá và một màu vải** — build xanh · lint sạch · toàn bộ test
xanh · không một cảnh báo nào. Mảng "mỗi kỷ một `leafHue`" của Phase 8D **chưa bao giờ chạy thật
trên production**.

**(2) MỘT VAI MÀU GÁNH HAI VIỆC — lần thứ SÁU của họ lỗi ấy.** Mọi thứ đội trên đầu (trừ búi tóc và
mũ trụ) đều lấy vai `cloth2`, mà `cloth2` được định nghĩa là *"quần/chân, tối nhất bộ"* và suy ra
bằng `cloth × 0,66`. Nghĩa là **cái nón và cái quần bị buộc phải cùng một lò nhuộm**, và cái nón
VĨNH VIỄN tối hơn cái áo. Đo cả 15 kỷ (độ đậm 0..1):

| kỷ | thứ đội | thật ngoài đời | trước | sau |
|---|---|---|---|---|
| 6 Việt Nam | nón lá | lá cọ phơi, không nhuộm | **0,170** (tối nhì bảng) | 0,879 |
| 5 Đức | khăn lanh | lanh mộc | 0,196 | 0,879 |
| 7 Ý | mũ rơm Firenze | rơm | 0,249 | 0,879 |
| 8 Bồ Đào Nha | mũ rơm ngư dân | cói | 0,311 | 0,879 |
| 2 Ai Cập | khăn nemes | lanh tẩy trắng | 0,499 | 0,879 |
| 15 UAE | khăn ghutra | bông trắng | 0,586 | 0,879 |
| 4 · 9 · 10 · 11 | futou · casquette · mũ nồi · mũ phớt | vải/nỉ NHUỘM | sẫm — **ĐÚNG** | không đổi |

### Phương án đã cân nhắc
1. **Chỉnh tay `cloth2` của riêng kỷ 6 cho sáng lên.** Bác: `cloth2` cũng là màu QUẦN, nên nó sẽ
   cho người Việt mặc quần trắng; và nó vá đúng một kỷ trong sáu kỷ cùng bệnh (đúng cái đã xảy ra
   với `eaves` ở Phase 7C — vá cho một kỷ rồi bệnh gốc quay lại khi có 30 công trình mỗi kỷ).
2. **Suy vai màu từ `kind` (`conical`/`brim` ⇒ nhạt).** Bác: **mũ rơm Firenze và mũ phớt New York
   đều là `brim`** nhưng một cái rơm một cái nỉ nhuộm. Suy từ hình là dựng lại đúng cái bẫy đang gỡ.
3. **Bốn giá trị vật liệu (rơm · lanh · len · nỉ).** Bác: ở cỡ cư dân đo được (14–31 điểm ảnh) len
   và nỉ chênh nhau **dưới ngưỡng mắt** ⇒ một trục CHẾT, đúng thứ Phase 11 đã trả giá.

### Giải pháp đã chọn
**(1)** Đổi tên biến màu thành `sacKy` — một cái tên không thể bị nhầm với số kỷ — và truyền
`eraNumber` vào hai hàm. Khoá bằng `palette3d.test.js` mục *15 KỶ RA 15 MÀU LÁ VÀ 15 MÀU VẢI*, kèm
đối chứng nhốt đúng bộ hỏng cũ (không truyền số kỷ ⇒ phải ra ĐÚNG 1 giá trị).

**(2)** Thêm trục bảng `headMaterial ∈ {'natural','dyed'}` (bắt buộc cả 15 dòng, validator TỪ CHỐI
thẳng dòng thiếu) và vai màu thứ sáu `straw` trong `palette3d.js`. `headgearBox` chọn vai theo VẬT
LIỆU, không theo hình. **Giá: 0 lệnh vẽ, 0 tam giác** — cả cộng đồng đi qua một `InstancedMesh` và
màu vào qua `setColorAt`, nên số vai màu không phải một ngân sách.

`straw` cố ý KHÔNG theo kỷ, và lý lẽ ở đây mạnh hơn ở `hair`/`gear`: thứ làm cho mọi vật liệu trong
nhóm này giống nhau chính là **sự vắng mặt của thuốc nhuộm**.

### Đánh đổi — nói thẳng, không giấu
- **Hai kỷ vẫn có đội đầu không tách khỏi áo, và cả hai đều ĐÚNG với sự thật vật lý:** kỷ 12 (mũ sắt
  SSh-40 Stalingrad được SƠN đúng màu áo bông để nguỵ trang) và kỷ 15 (ghutra trắng trên kandura
  trắng — ngoài đời thứ tách chúng là sợi dây agal ĐEN mà bộ từ vựng chưa có). Ép chúng tương phản
  là mua một con số bằng cách nói dối lịch sử, đúng thứ ADR-025 cấm. Ghi thành **ngoại lệ tường
  minh đếm được** `assert.deepEqual(khôngTáchKhỏiÁo, [12, 15])` — kỷ thứ ba rơi vào là đỏ, mà một
  trong hai kỷ này được sửa cũng đỏ.
- **Năm kỷ có `headMaterial` TRƠ** (1 · 3 · 12 · 13 · 14 — không đội gì, hoặc búi tóc lấy vai `hair`,
  hoặc mũ trụ lấy vai `gear`). Khai một trường mà nó không đổi được điểm ảnh nào là chỗ ẩn náu tốt
  cho một lỗi ⇒ danh sách ấy được khoá bằng `assert.deepEqual(trơ, [1, 3, 12, 13, 14])`.
- **Nón lá kỷ 6 nay che gần trọn thân người** khi nhìn từ góc mặc định. Đây là hệ quả hình học đã
  biết (nón lá thật rộng ~2,5 lần đầu) và nó đã được ghi thành ngoại lệ `[6, 7]` của phép đo hình
  bóng ở `humanPose.test.js`. Đổi lại, kỷ 6 nay nhận ra được ngay từ xa.

### Ảnh hưởng
`palette3d.js` (vai `straw`, đổi tên `sacKy`) · `humanStyle.js` (trục `headMaterial`, 15 dòng) ·
`human.js` (`HUMAN_ROLES` 6 vai, `headgearBox` nhận vật liệu) · `sceneGraph.js` (một dòng bảng màu)
· 3 file test. Tam giác và lệnh vẽ **không đổi một đơn vị**.

### Điều kiện xem lại
Khi có kỷ thứ 16, hoặc khi ai đó muốn tách vai `gear` (nay đang gánh gỗ + xương + kim loại — cùng
hình dạng lỗi, xem `TECH_DEBT #79`).

---

## ADR-053 — Cư dân là một BỘ XƯƠNG có khớp, dựng bằng MỘT InstancedMesh hộp đơn vị; dáng đi là hàm của QUÃNG ĐƯỜNG đã đi, không phải của thời gian

- **Ngày**: 2026-08-22
- **Bối cảnh**: Đàm yêu cầu *"dựng lại mô hình người trong thành phố 3D thành một cơ thể có khớp
  hoạt động, và cho kỷ 1 một bản sắc con người riêng"*, kèm ràng buộc rất chặt: tầng engine THUẦN
  (không three/DOM/Date/Math.random), **không thêm thư viện, không GLTF, không skinning, không
  animation clip**, cả cộng đồng nằm trong **1–2 lệnh vẽ**, tam giác cư dân **≤6% tổng cảnh**, và
  bob (cái nhún) phải **chuyển hẳn** khỏi `residents.js`.
- **Vấn đề**: cư dân cũ là **hai hộp** (thân + đầu) cộng một cái nhún hình sin. Hai hộp thì không
  có gì để nhìn, mà cũng không có gì để PHÂN BIỆT: 15 kỷ đi bộ giống hệt nhau, nên phần thưởng của
  việc đi hết 15 kỷ không chạm tới con người trong thành phố. Nhưng trước khi dựng bất cứ thứ gì
  phải trả lời được một câu đo được: **ở khung 3D thật trên máy Đàm, một cư dân cao bao nhiêu điểm
  ảnh?** — vì nếu câu trả lời là 4 px thì mọi khớp xương đều là mã chết.
- **Phương án cân nhắc**:
  1. **Giữ 2 hộp, chỉ đổi màu/kích thước theo kỷ.** Rẻ nhất, và đủ để "15 kỷ khác nhau" trên giấy.
     Loại: thứ mắt đọc được ở cỡ 18 px không phải màu mà là **hình bóng ĐANG ĐỔI** — một khối cứng
     đứng yên thì đọc ra "một cái cột", bất kể sơn màu gì.
  2. **Mỗi bộ phận một `Mesh` riêng, xoay bằng `Object3D` cha-con.** Đúng cách three thường làm và
     rẻ về mặt trí óc. Loại: 28 người × 9 bộ phận = **252 lệnh vẽ**, gấp 25 lần cả thành phố hiện
     tại (10 lệnh). Vi phạm thẳng ràng buộc Đàm đặt.
  3. **Skinning / GLTF / animation clip.** Loại thẳng: Đàm cấm, và nó kéo theo một thư viện, một
     định dạng tệp, một ống dẫn tài sản — cho một nhân vật cao 18 px.
  4. **Thêm trục xoay nghiêng vào `parts.js`** để khối tự nghiêng được. Loại: Đàm cấm thẳng, và nó
     sẽ đẩy một khái niệm của RIÊNG con người vào nhà máy hình học dùng chung cho nhà cửa, cây cối
     — đúng thứ `TECH_DEBT #29` đang phải trả giá theo chiều ngược lại.
  5. ⭐ **MỘT `InstancedMesh` trên một hộp đơn vị 1×1×1; mỗi bộ phận của mỗi người là một instance,
     kích thước đi vào ma trận co giãn, khớp xoay ở tầng ma trận** — chọn.
- **Giải pháp chọn**: ba file thuần mới, tách đúng khuôn `floraStyle.js` ↔ `flora.js` (ADR-020) đã
  chứng minh:
  - `src/engine/city3d/humanStyle.js` — **BẢNG 15 kỷ × 11 trục** (`stature` · `build` · `legShare` ·
    `stance` · `garment` · `headgear` · `carry` · `stride` · `walkSpeed` · `armSwing` · `cloth`),
    mỗi dòng buộc vào đúng `country` mà `eraStyle.js` khai (có test bắt), 14 kỷ chưa làm trỏ một
    preset **CÓ TÊN** (`mocPhoThong`) chứ không rơi ngầm về mặc định.
  - `src/engine/city3d/human.js` — **THƯ VIỆN HÌNH**: khớp `humanDims` (tỉ lệ cơ thể) và
    `buildHumanBody` (danh sách hộp, mỗi hộp gắn vào một khớp + một vai màu).
  - `src/engine/city3d/humanPose.js` — **DÁNG ĐI**: `poseAt(body, travelled)` trả góc từng khớp.
  - `residents.js` giữ nguyên trách nhiệm cũ (bao nhiêu người, đi đâu) và **trả `travelled` thay cho
    `bob`**; `sceneGraph.js` chỉ còn ghép ma trận.
- **Trade-off**: (a) **một trục xoay mỗi khớp** (trục ngang, mặt phẳng đi tới) — đủ cho đi bộ, không
  đủ cho quay người/vung tay ngang; đây là lựa chọn có chủ đích ở cỡ 18 px, không phải thiếu sót.
  (b) Tam giác cư dân **672 → 3.024** (+350%), tức **2,03% tổng cảnh** (trần Đàm đặt: 6%) nhưng
  **2,88% riêng phần thành phố** — hai con số trả lời hai câu khác nhau, phải đọc đúng câu (bài học
  Performance Gate vòng 2). (c) Số lệnh vẽ **GIẢM 11 → 10**: hai `InstancedMesh` (thân + đầu) gộp
  làm một. (d) Trên iPhone cư dân chỉ cao **4,4–9,6 px**, đầu người **1 px** — mọi thứ dựng ở đây
  **không đọc được trên điện thoại**; Đàm đã chọn nhắm riêng MacBook Air M3 và điều đó được ghi
  thẳng vào mã để phiên sau không đọc sự im lặng thành "vậy cũng ổn".
- **Ảnh hưởng (đo được)**: trên khung 3D thật **990×614** của Đàm, cư dân kỷ 1 cao **18,3 px** (trung
  vị; 29,3 px với người gần camera nhất) — đủ để đọc **hình bóng đang đổi**, không đủ để đọc "kia là
  cánh tay". Dáng đi làm hình bóng đổi **1,9 px trên bề rộng 10,8 px (18%)** theo phép chiếu, và
  **0,73× → 1,89× tỉ lệ rộng/cao** theo phép đo trên ẢNH THẬT 1500 px có ghép cặp từng cư dân; cả
  hai đều kèm ĐỐI CHỨNG là mô hình 2 hộp cũ (ra **0,0083 px** và **1,0000 ± 0,00%**). Kỷ 1 khác
  preset ở **10/11 trục**.
- **⚠️ Phát hiện kèm theo, quan trọng cho mọi phiên sau**:
  1. **`stride` PHẢI là bội số của CẲNG CHÂN, không phải số ô.** Bản đầu khai `0,78` ô, trong khi
     cẳng chân kỷ 1 dài `0,118` ô ⇒ bàn chân phải với ra xa hơn cả chiều dài chân, `asin` kẹp hông
     về 90° và cả 15 kỷ duỗi chân ngang. Đây là bài học Phase 7D ("một số tuyệt đối không diễn đạt
     được một quan hệ") áp cho một giá trị có **hai** đầu vào biến động (`stature`, `legShare`).
     Con số hỏng `0,78` nay bị nhốt lại bằng một assert trong `humanStyle.test.js`.
  2. **Đo hình bóng CHÉO NHAU GIỮA HAI KHUNG HÌNH là bất khả thi ở đây, và nó nói dối rất thuyết
     phục.** Trong 0,57 giây cư dân đi được ~10 px — xa hơn cả bề ngang cơ thể — nên mọi phép so
     hai khung đều bị **TỊNH TIẾN** và **CHE KHUẤT** át hẳn. Bằng chứng không cãi được: mô hình 2
     hộp, thứ **không có khớp nào**, đo ra diện tích hình bóng đổi **94,2%**. Cách chữa không phải
     nới ngưỡng mà là **KHỬ** nhiễu: hai bản dựng ở CÙNG thời điểm thì vị trí/hướng/vật che giống
     hệt nhau ⇒ ghép từng người với chính mình rồi lấy TỈ SỐ.
  3. **So pha 0 với pha ½ thì hình bóng KHÔNG đổi** — ở pha ½ hai chân chỉ đổi vai cho nhau, ảnh
     là ảnh gương của đúng bề rộng ấy. Phải so pha 0 với pha ¼.
  4. **Công cụ đo tự chế nói dối lần thứ 23**, và lần này lệch **1,36 lần**: bản đầu của
     `human-scale.mjs` chiếu một ĐOẠN THẲNG từ chân lên đỉnh đầu (8,1 px) trong khi mắt đọc KHỐI
     ĐẶC (11,0 px đo trên ảnh thật) — camera nghiêng 34° nên mặt trên cũng chiếm chỗ theo chiều dọc.
     Sau khi chiếu đủ 8 đỉnh của mọi hộp: **11,1 so với 11,0**.
- ⚠️ **ĐÍNH CHÍNH 2026-08-23 (a) — MỘT TRONG CÁC CON SỐ CỦA ADR NÀY LÀ PHÓNG ĐẠI CÓ CHỦ ĐÍCH, VÀ
  CHÚ THÍCH CŨ ĐÃ GỌI NÓ SAI TÊN.** `stature: 1.18` của kỷ 1 được chú thích là *"sự thật nhân
  chủng học chứ không phải để dễ nhìn"*, kèm một dấu ngoặc coi phần điểm ảnh là *"tiện lợi đi
  kèm"*. Kiểm lại: **HƯỚNG** thì suy được từ nguồn (người săn bắt hái lượm Cận Đông trước Cách
  mạng Đá mới cao hơn người nông nghiệp ngay sau đó, và kỷ 1 là kỷ duy nhất nằm trước bước tụt
  ấy), nhưng **ĐỘ LỚN thì không**: tỉ số thường trích là ~175–177 cm so với ~161–166 cm, tức
  **1,07–1,10**, còn 1,18 lớn gấp ~1,7 lần hiệu ứng thật. Đo thẳng (`human-scale.mjs --eras 1`):
  1,00 → 15,6 px · **1,10 → 17,0 px** · 1,18 → 18,3 px ⇒ bỏ phần điểm ảnh đi thì con số đã là
  ~1,10. ⇒ Đây là **một con số mỹ thuật được một sự thật lịch sử ĐỠ LƯNG về hướng**, không phải một
  con số suy ra từ nguồn. **Giữ nguyên giá trị** (phóng đại một khác biệt có thật, đúng chiều,
  trong một thành phố cách điệu là hợp lệ) nhưng **đổi nhãn**, vì ADR-025 cấm *nói dối* lịch sử chứ
  không cấm cách điệu, và vì lời giải thích mới là thứ phiên sau kế thừa rồi dựa vào (Phase 3Y/4D).
- ⚠️ **ĐÍNH CHÍNH 2026-08-23 (b) — TRÊN iPHONE THÌ 10/11 TRỤC CỦA BẢNG NÀY KHÔNG ĐỌC RA ĐƯỢC.** ADR
  này được quyết dựa trên khung 990×614 của MacBook Air M3, với lý lẽ *"Đàm chỉ dùng MacBook"* —
  một câu chưa được kiểm, và `renderMode.js` KHÔNG loại iPhone khỏi 3D. Đo khung thật bằng
  `shot.mjs --probe`: iPhone 390 ⇒ **324×201**, cư dân **6,0 px** (so với 18,3 px). Từng bộ phận
  đều dưới ngưỡng mắt 4 px (đầu 1,9 · thân 2,5 · giáo 5,6×1,2), dáng đi chỉ đổi hình bóng **0,6 px**
  (MacBook: 1,9 px). ⚠️ Và ngay trên máy đích, **búi tóc 2,7×2,5 px cũng đã dưới ngưỡng** — tức
  trục *"đội đầu"* gần như không trả về gì kể cả ở 990×614. Bảng đầy đủ + ba hướng xử lý đề xuất:
  `TECH_DEBT #78`.
- **Điều kiện xem lại**: khi làm kỷ thứ 2 trở đi (`TECH_DEBT #78` — 14 kỷ còn lại); nếu số cư dân
  vượt 28 hoặc số hộp mỗi người vượt 11 (bài test ngân sách sẽ đỏ); nếu sau này muốn quay người
  hoặc vung tay ngang (lúc đó phải thêm trục thứ hai cho khớp và đo lại ngân sách); hoặc nếu
  màn Thành Phố được đưa lên iPhone như một trải nghiệm thật chứ không phải bản thu nhỏ.

---

## ADR-052 — Một ô nhà dân là một KHU PHỐ, không phải một căn nhà; và «thêm nhà» là điều bất khả, chỉ có «chia nhỏ»

**Ngày**: 2026-08-21 · **Phase 14 §1(3)** · **Trạng thái**: đã áp dụng

### Bối cảnh
Đàm nhìn thành phố rồi nói: *«mọi thứ hiện tại trông vẫn nhỏ, thành phố không mở rộng mà chỉ là
cụm nhỏ»*. Đi đếm thì lời phàn nàn ấy có một con số đứng sau:

- `cityGrid.js` khai `ROAD_LINES = {0, 4, 8, 11}` ⇒ **80 trên 144 ô là ô ĐƯỜNG (55,6%)**.
- 45 ô nữa thuộc vùng kỳ quan, mà chỉ 5 ô trong đó có công trình đứng.
- ⇒ chỉ còn **30 ô** có thể chứa nhà dân, và **cả 15 kỷ đã chạm trần ấy từ lâu**.

Thứ Đàm nhìn thấy vì vậy là **khoảng 30 căn nhà rải rác trên một mạng đường phủ hơn nửa mặt đất** —
đúng nghĩa một cụm nhỏ, và không một phép chỉnh mỹ thuật nào chữa được điều đó.

### Vấn đề
Chỉ thị ban đầu là *"cho mỗi ô nhà dân một CỤM 4–10 căn nhà nhỏ"*, hiểu theo nghĩa **THÊM VÀO**. Đo
thì cách hiểu ấy **bất khả thi**: **12/15 kỷ có ĐÚNG 0,000 ô² đất trống** trong lưới — không còn
một chỗ nào để đặt thêm căn nhà thứ hai. Cơ chế duy nhất còn lại là **CHIA NHỎ** chính mặt bằng
căn nhà đang đứng đó.

Và chia nhỏ mang theo một cái bẫy chết người, phải nói ra trước khi viết một dòng mã nào:
`pitch = max(0,08, roofPitch) × max(w, d)` — chiều cao mái tỉ lệ với cạnh dài nhất của mặt bằng.
Chia một mặt bằng ra sáu phần thì sáu cái mái đều **thấp đi**, trong khi `massHeight` (chiều cao
thân) **không phụ thuộc mặt bằng**. Nghĩa là: **chia nhỏ mà quên nâng cao thì thành phố còn trông
NHỎ HƠN trước** — sáu căn nhà thấp thay cho một căn nhà thấp là sáu cái lều. Cách hỏng ấy im lặng
tuyệt đối: build xanh, lint sạch, số khối tăng gấp năm.

### Phương án cân nhắc
1. **Nới lưới 12×12 rộng ra, hoặc bớt đường.** — BỎ. Lưới là hệ toạ độ của ADR-007 (*"chỉ thêm,
   không bao giờ dời"*): đổi nó thì mọi thành phố đã niêm phong trong bảo tàng mở ra khác lần
   trước. Bớt đường thì phá luôn mạng đường vừa sửa xong ở §1(1).
2. **Lùi camera / thu khung hình cho thành phố «trông to hơn».** — BỎ, và Đàm đã cấm hẳn hướng
   này từ trước (nó không làm thành phố lớn lên, nó chỉ làm mọi thứ nhỏ đi đều nhau).
3. **Giải bài «quy mô» bằng thực vật / vùng phụ cận.** — BỎ. Phase 13 VIỆC B đã đi hướng đó, qua cả
   ba cổng số, và **Đàm bác** — ba trong bốn lời phàn nàn nằm BÊN TRONG lưới. Đàm cũng cấm tường
   minh việc nâng mật độ cây.
4. **Trả về N mô tả cho một ô (mỗi căn nhà một mục trong danh sách).** — BỎ. `sceneGraph.js` bám
   theo CHỈ SỐ của danh sách ấy (`addPickTarget`), và `groundPlacement` gọi một lần cho mỗi mục —
   N mục nghĩa là N cái bệ kè chồng lên nhau dưới cùng một dãy nhà.
5. **CHIA NHỎ mặt bằng, GỘP lại thành đúng MỘT mô tả, và NÂNG CAO để bù phần mái mất đi.** — CHỌN.

### Giải pháp được chọn
Khuôn ba lớp, lần thứ **chín** (sau `vernacularRoof` · `undergrowth` · `streetStyle` · `groundFloor`
· `floraStyle` · `roofStyle` · `settingStyle` · `hinterlandStyle`):

| Lớp | File | Việc duy nhất |
|---|---|---|
| **BẢNG** | `city3d/blockStyle.js` | 15 dòng × 7 trục (`cols`/`rows`/`attach`/`alley`/`storey`/`vary`/`gableToStreet`), mỗi dòng buộc vào `country` mà `eraStyle.js` khai, mỗi dòng kể một khu dân cư CÓ THẬT |
| **HÌNH** | `city3d/block.js` | đo mặt bằng căn nhà đang đứng đó → chia → dựng từng đơn vị bằng CHÍNH `buildBuildingSpec` → gộp |
| **NGƯỜI ĐỌC** | `city3d/cityParts.js` | chỉ gọi, vẫn trả về đúng 30 mục như cũ |

Bốn ràng buộc đã được viết thành mã và thành test:

- **`storey` là một cột BẮT BUỘC của bảng**, không phải tuỳ chọn — nó là thứ bù lại phần mái mất đi
  khi chia nhỏ. Cổng canh nó là bài `CAO LÊN, KHÔNG THẤP ĐI` (`block.test.js`).
- **TRẦN LUÔN THẮNG SÀN**: ô chật thì ra **ÍT** căn, tuyệt đối không ra những căn tí hon. Phép kẹp
  bớt cột/hàng cho tới khi mỗi đơn vị còn đủ rộng (`MIN_UNIT_CELLS`).
- **TƯỜNG CHUNG THÌ KHÔNG CÓ CỬA SỔ** — vừa là sự thật kiến trúc (nhà "back-to-back" chỉ có cửa
  trước và cửa sau), vừa là khoản tiết kiệm lớn nhất của cả phase (đo ở kỷ 10: **−36%** tam giác).
- **KHÔNG THÊM MỘT LỆNH VẼ NÀO** — lệnh vẽ đếm theo họ vật liệu của cả kỷ, mà chia nhỏ một căn nhà
  không đẻ ra họ vật liệu mới. Đã đo: **0 vai lạ ở cả 15 kỷ**.

### Trade-off
- **Hai lượt dựng cho mỗi đơn vị.** Hình bao của một đơn vị **KHÔNG suy được** từ hình bao của bản
  tham chiếu, vì mái đua không co theo hệ số thu nhỏ; bản đầu suy như vậy và làm khối thân teo còn
  ~0,12–0,16 trên một suất đất rộng 0,25–0,35. Phải **dựng thử rồi ĐO** (luật *"đừng DỰ ĐOÁN thứ có
  thể ĐO"*). Cái giá là gấp đôi số lượt dựng, và nó được canh bởi cổng thời gian dựng cảnh
  (`TECH_DEBT #70`).
- **Còn 0,11 ô trôi bề ngang, và nó KHÔNG chữa được bằng một lượt dựng thứ ba.** Hình bao không
  phải hàm liên tục của hệ số thu nhỏ — bên trong `buildBuildingSpec` có những quyết định RỜI RẠC
  (số cột cửa sổ, một phép kẹp bám vào rồi nhả ra), nên nó là hàm BẬC THANG. Đã đo: lượt thứ ba
  kéo sai số tệ nhất từ **0,186 lên 0,234 ô** — nó **PHÂN KỲ** ở kỷ 5 · 8 · 10. Đây là sai số được
  CHẤP NHẬN và được canh bằng con số, không phải một thứ chờ vá.
- **9/15 kỷ mất một phần chi tiết mái** (giữ 313/371 ô = 84%, tệ nhất kỷ 13 = 72,4%). Nguyên nhân
  là `ROOFTOP_MIN_SPAN = 0,24` — một phép "từ chối thẳng" trong `rooftop.js`. Xem `TECH_DEBT #77`.
- **Tam giác nhà dân ×2,98** (335.740 → 1.000.376), cả cảnh **×1,27**. Chấp nhận được vì
  `PERFORMANCE.md` đã đo: hình học RẺ, điểm ảnh và ánh sáng mới đắt — và phase này thêm **0 nguồn
  sáng, 0 lệnh vẽ**.

### Ảnh hưởng
- `buildBuildingSpec` nhận thêm tham số tuỳ chọn `plot` (`fx`/`fz`/`storey`/`faces`). Đây là hàm mà
  **cả thành phố** đang gọi, nên nó được khoá bằng **15 chữ ký GOLDEN** sinh trên HAI cây mã
  (`git worktree` ở `ff8c2a4` và cây làm việc) rồi `diff`: **trùng từng byte**.
- `cityFocus.test.js` đổi danh sách kỷ cần canh cả-đường-bay từ 11 lên **12 kỷ / 15 chuyến** — kỷ
  14 là kỷ mới rơi vào, vì dãy shophouse nay cao và dày hơn căn nhà đơn cũ. Hệ quả ĐÚNG, không phải
  hồi quy.

### Điều kiện xem xét lại
- Nếu `ROOFTOP_MIN_SPAN` được làm cho co theo cỡ khối (`TECH_DEBT #77`), đo lại tỉ lệ giữ chi tiết
  mái và **rút ngắn danh sách 9 kỷ** trong `block.test.js` thay vì để nó thành một lời nói dối.
- Nếu ngày nào lưới thôi là 12×12, hoặc mạng đường bớt chiếm 55,6% mặt đất, thì bài toán gốc đổi
  và cả ADR này phải được đọc lại từ mục **Bối cảnh**.
- Biên của bài `CAO LÊN, KHÔNG THẤP ĐI` hiện chỉ còn **0,7%** ở kỷ 1 và kỷ 2 (`storey` 1,95 và
  1,93 trên trần 2,0). Ai muốn chia nhỏ thêm ở hai kỷ ấy sẽ **hết chỗ nâng** — lúc đó câu trả lời
  là bớt cột/hàng, KHÔNG phải nới trần.

---

## ADR-051 — Kim tự tháp và ziggurat là HAI hình khối, không phải một giá trị mái viết khác đi; và một nhánh `default` biến «thiếu `case`» thành «lặng lẽ đổi kiểu»

**Ngày**: 2026-08-21 · **Phase 14 §1(2)** · **Trạng thái**: đã áp dụng

### Bối cảnh
Đàm nhìn thành phố rồi nói: *«kim tự tháp không có khối hình chóp»*. Đi đọc bảng thì lời phàn nàn
ấy đúng theo hai cách khác nhau ở hai kỷ kề nhau:

- **Kỷ 2 (Ai Cập)** khai `roof: 'cone'`. `cone` là lăng trụ **TÁM cạnh** thóp về một điểm — trên
  màn hình nó ra một cái **lều rạp xiếc tròn**. Nền văn minh mà cả thế giới nhận ra bằng đúng một
  hình khối lại là kỷ duy nhất không có hình khối ấy. Và `pyramid` (bốn cạnh, `taper` gần 0) đã tồn
  tại trong mã từ lâu, chỉ chưa ai nối vào đây.
- **Kỷ 3 (Iraq, ziggurat thành Ur)** dùng CHUNG nhánh `stepped` với **kỷ 11 (cao ốc giật cấp
  Manhattan)** — hai thứ ngược nhau về kiến trúc. `stepped` mở đầu ở `rw` (= thân nhà + 2·`eaves`,
  tức **RỘNG HƠN** thân) nên bậc thứ nhất không tạo ra một cái thềm nào, nó chỉ nối tiếp mặt tường
  đi lên; mắt chỉ đọc được bậc thứ hai trở đi, cao 0,32 trên một thân nhà cao 1,87.

Đo bảng từ vựng: **9 giá trị mái kỳ quan cho 15 kỷ** (`flat` 3 kỷ · `cone`/`stepped`/`tiered`/`gable`
mỗi cặp 2 kỷ). Câu hỏi cố vấn đặt ra — *"`roof` có đủ từ vựng để nói 'kim tự tháp' không?"* — có
câu trả lời bằng số: **chưa**.

### Vấn đề
Vá riêng kỷ 2 thì sửa được triệu chứng và bỏ nguyên nhân. Hai kỷ kề nhau đang được yêu cầu kể hai
câu chuyện kiến trúc ngược nhau — **Giza TRƠN, Ur GIẬT CẤP** — bằng một bộ từ vựng không phân biệt
nổi chúng. Và bất kỳ giá trị mới nào cũng phải trả lời được *"công trình có thật nào trông như
vậy?"*, nếu không thì nó là mã chết mang hình dạng một tính năng.

### Phương án cân nhắc
1. **Chỉ đổi kỷ 2 sang `pyramid`, để kỷ 3 nguyên.** — BỎ. Nó chữa đúng một nửa lời phàn nàn và để
   nguyên cái gốc: hai kỷ vẫn dùng chung một nhánh mã cho hai hình khối ngược nhau.
2. **Thêm cả `mastaba` (ghế đá mộ Ai Cập) cho đủ bộ Ai Cập.** — BỎ. **Không kỷ nào có chủ cho nó**:
   kỷ 2 đã lấy kim tự tháp, và không kỷ nào khác nói về Ai Cập. Đây đúng là từ vựng chết mà mục
   Playbook cấm; nay đã có bài test `TỪ VỰNG MÁI (a)` bắt.
3. **Nâng `roofPitch` của kỷ 3 để khối ziggurat áp đảo thân nhà.** — BỎ. `roofPitch` **gánh hai
   việc**: nó vừa quyết mái kỳ đài, vừa quyết bề dày gờ chắn mái của NHÀ DÂN (kỷ 3 khai
   `vernacularRoof: 'flat'`, mà nhánh `flat` tính `lip`/`cap` theo `pitch`). Nâng lên 1,05 thì mỗi
   căn nhà bùn đội một tấm slab dày 45% chiều cao của chính nó. Đây là lần thứ SÁU của hình dạng
   *"một trường gánh hai việc"* trong dự án — và lần này nó bị bắt TRƯỚC khi ship, không phải sau.
4. **✅ Tách `ziggurat` thành một giá trị riêng, và nối kỷ 2 vào `pyramid`.** — CHỌN.

### Giải pháp chọn
`ROOF_KINDS` đi từ 9 lên 10 giá trị. Kỷ 2 khai `roof: 'pyramid'` (giữ nguyên `roofPitch` 0,72 và
`eaves` 0,2); kỷ 3 khai `roof: 'ziggurat'`, một nhánh MỚI trong `emitRoof` khác `stepped` ở **ba
điểm đo được**, và điểm thứ hai mới là điểm quyết định mắt có đọc ra "giật cấp" hay không:

| | `stepped` (setback New York 1916) | `ziggurat` (Ur) |
|---|---|---|
| mặt tường thềm | **ĐỨNG** (`taper: 1`) | **NGHIÊNG VÀO** (`taper: 0,88`) |
| thềm dưới cùng thu vào từ | mép **MÁI** (`rw`, rộng hơn thân) | mép **THÂN NHÀ** (0,80·w, hẹp hơn thân) |
| trên đỉnh | không có gì | **đền thờ nhỏ** (cella), vai màu riêng |

`landmark` của kỷ 2 đổi từ «làng ven sông Nin» sang «kim tự tháp Giza» — trường ấy là **lời giải
thích cho những con số nằm cùng dòng**, nên nó phải nói đúng công trình mà các con số đang mô tả.
Chú thích `vernacularRoof: 'flat'` giữ nguyên và nay đọc còn rõ hơn: kỳ đài của một nền văn minh và
cái nhà người ta ở hằng ngày gần như không bao giờ cùng một hình mái.

Tỉ lệ dốc của kim tự tháp KHÔNG phải con số chọn cho tiện: Đại Kim Tự Tháp Giza cao 146,6 m trên
đáy 230,3 m = **0,637 lần bề ngang**; ở đây đo được **0,533** (mái phủ `rw = w + 2·eaves` nên đáy
rộng hơn thân). Bài test khoá dải [0,40 ; 0,90], bao lấy cả tỉ lệ thật lẫn số đang dựng.

### Trade-off
- **Cái được**: kỷ 2 có một khối chóp bốn mặt thật, đáy rộng **135%** thân nhà và cao **76%** thân
  nhà — một KHỐI, không phải một cái mũ. Kỷ 3 có ba thềm nghiêng thu dần cộng một đền nhỏ trên
  đỉnh. Bảng từ vựng rộng thêm một giá trị; hai kỷ kề nhau thôi dùng chung một nhánh mã.
- **Cái mất**: **+154 tam giác** ở kỷ 2 và **+308** ở kỷ 3 (0,16% và 0,30%). **Lệnh vẽ KHÔNG đổi**
  (14 ở cả hai kỷ) vì `ziggurat` chỉ dùng hai vai màu `roof`/`trim` mà kỷ 3 đã có sẵn.
- **Cái CHƯA giải quyết, và phải nói thẳng**: khối ziggurat mới chiếm **35% chiều cao** thân nhà nó
  đứng lên. Ở Ur thì cả công trình LÀ cái ziggurat, không có thân nhà nào bên dưới. Đẩy tỉ lệ ấy
  lên bằng cách kéo cao các thềm sẽ làm chúng dày hơn tỉ lệ thật của Ur (thềm 1 cao 11 m trên đáy
  64 m = 0,17 lần bề ngang) — tức **mua một ấn tượng bằng cách nói dối tỉ lệ**, đúng thứ ADR-025 đã
  cấm với mặt đường. Đây là bài toán **KHỐI** (`massScale`, `getMassing`), không phải bài toán MÁI.
  Ghi thành `TECH_DEBT #75`.

### Ảnh hưởng
- `src/engine/city3d/eraStyle.js` — `ROOF_KINDS` +1 giá trị; kỷ 2 và kỷ 3 đổi `roof`; kỷ 2 đổi
  `landmark`.
- `src/engine/city3d/buildingSpec.js` — thêm `case 'ziggurat'`; **`emitRoof` nay được `export`**,
  và đó không phải để tiện dùng lại (không ai ngoài file ấy gọi nó) mà để bài test hỏi THẲNG nhà
  máy mái — xem mục "Điều kiện xem lại".
- `src/engine/city3d/buildingSpec.test.js` — 5 bài mới, cả 5 đã thử-cho-đỏ.
- KHÔNG đụng: bảng màu · mạng đường · địa hình · camera · ADR-007.

### Điều kiện xem lại
- Khi có kỷ thứ 16, hoặc khi một kiểu mái chạm 4 kỷ — bài `TỪ VỰNG MÁI (c)` sẽ đỏ, và câu trả lời
  đúng là *"kỷ ấy thật sự lợp mái gì?"* chứ không phải nới cái chốt.
- Khi `TECH_DEBT #75` được mở: nếu khối kỳ quan kỷ 3 được hạ xuống thì tỉ lệ thềm/thân đổi, và các
  ngưỡng trong bài `KỶ 3 — ZIGGURAT` phải được đo lại (chúng là QUAN HỆ nên phần lớn sẽ tự đúng).
- ⚠️ **Nếu ai đó gỡ `export` của `emitRoof` cho "sạch"**: bài `TỪ VỰNG MÁI (b)` sẽ không dựng được.
  Đừng thay nó bằng phép đo trên công trình đã lắp xong — đã thử và nó **không thể đỏ** (xem dưới).

### Bài học kèm theo — hai lần phép thử ngược bác bỏ chính chú thích tôi vừa viết
1. **Bản đầu của bài `TỪ VỰNG MÁI (b)`** đo *"khối kết cấu cao nhất có vươn lên trên đỉnh thân nhà
   chính không"* trên kỳ quan THẬT. Xoá hẳn `case 'ziggurat'` ⇒ **vẫn xanh**, vì `emitSignature`
   của kỷ 3 (`ziggurStair`) dựng bậc thang ở đúng chỗ ấy, cùng `x`/`z`, cùng cao độ. Một cái gác
   không thể đỏ, và lý do nằm ở một file khác.
2. **Bản thứ hai** hỏi thẳng `emitRoof` và assert `out.length >= 1`, với chú thích khẳng định
   *"`switch` không có nhánh `default` nên thiếu `case` thì không dựng ra gì"*. Phá lại ⇒ **vẫn
   xanh**: `emitRoof` **CÓ** `default`, và nó đẩy ra một tấm phiến trơn. Câu khẳng định của tôi về
   chính đoạn mã mình vừa sửa là SAI, và rủi ro thật thì **ngược lại và tệ hơn**: một giá trị mái
   thiếu `case` không biến mất — nó **lặng lẽ hoá thành một tấm phiến trơn**, tức kỷ ấy mất căn
   cước mái mà vẫn "có mái", và trên ảnh nó trông như một quyết định mỹ thuật.

   ⇒ Bản đúng dựng một kiểu mái KHÔNG TỒN TẠI để lấy đúng hình của nhánh `default`, rồi đòi mọi
   kiểu thật phải khác nó. Đây là *"một câu tự trấn an cũng phải được kiểm như một con số"*
   (Phase 4G) ở biến thể nguy hiểm nhất: câu ấy nói về **chính đoạn mã mình đang sửa**, nên nó
   nghe chắc chắn nhất và ít bị nghi nhất.

