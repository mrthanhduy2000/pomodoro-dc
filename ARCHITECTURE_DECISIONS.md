# Architecture Decision Records — Pomodoro DC

> "Bộ nhớ kiến trúc" của dự án — trả lời **VÌ SAO** hệ thống được thiết kế như hiện tại, không chỉ
> **NHƯ THẾ NÀO**. Xem `ARCHITECTURE.md` để biết hệ thống đang vận hành ra sao; xem file này để
> biết vì sao nó lại vận hành đúng như vậy chứ không phải một cách khác tưởng như đơn giản hơn.
>
> **Quy tắc ghi**: mỗi quyết định kiến trúc thật (không phải chi tiết vặt) phải có đủ 9 mục dưới
> đây. Thêm bản ghi mới ở ĐẦU danh sách (mới nhất trước). Không xoá bản ghi cũ dù quyết định sau
> này bị đảo ngược — thêm bản ghi MỚI ghi rõ "đảo ngược quyết định #X, lý do", để lịch sử tư duy
> không bị mất. Đây là một phần bắt buộc của Project Governance Protocol — xem `CLAUDE.md`.

---

## ADR-019 — Mặt đất là MỘT TẤM LƯỚI LIỀN, và điều đó ĐẢO NGƯỢC một nửa lập luận "phải là thềm bậc"

- **Ngày**: 2026-08-15 (Phase 8C)
- **Bối cảnh**: Đàm nhìn ảnh chụp rồi gọi thẳng tên vấn đề lớn nhất còn lại: *"terrain như các bậc
  thang… grid rõ… toàn cảnh giống prototype/editor hơn là một thế giới 3D"*, và cho phép rõ ràng:
  *"nếu architecture hiện tại phụ thuộc vào grid 12x12 khiến terrain luôn giống board game, hãy
  tìm cách giữ data/progression nhưng thay đổi cách render/composition"*.
- **Vấn đề**: mặt đất **là** 144 khối hộp `InstancedMesh` riêng lẻ. Ba hệ quả, cả ba đều không thể
  chỉnh khéo mà thoát: (1) hộp không dốc được ⇒ chênh cao độ CHỈ có thể là bậc; (2) hộp có mặt bên
  ⇒ mỗi ô bốn cạnh đứng; (3) 144 ô mỗi ô một sắc phẳng ⇒ mắt đọc ra hàng lối ngay. `palette3d.js`
  đã ba lần vá triệu chứng (3) bằng cách siết bốn sắc nền xuống ±4° góc màu — vá đúng, nhưng vá
  vào lá chứ không vào gốc.
- **Điều đáng ghi nhất — MỘT LẬP LUẬN CŨ BỊ LẬT, CÓ CHỦ ĐÍCH**: `terrain.js` mở đầu bằng một khối
  chú thích dài giải thích *"vì sao PHẢI là thềm bậc chứ không phải dốc liên tục"*, và lập luận ấy
  **hoàn toàn đúng** — nhưng nó đứng trên đúng một tiền đề: *"nền thành phố là 144 ô hộp"*. Phase
  8C gỡ chính tiền đề đó, nên kết luận đi theo nó mất hiệu lực. ⚠️ Đây KHÔNG phải "quyết định cũ
  sai": nó đúng trong suốt thời gian tiền đề còn đúng. Cùng hình dạng với Phase 4D
  ("một luật mới làm điều kiện cũ hết đúng").
- **Phương án cân nhắc**:
  - (a) **Giữ hộp, phá nhịp bằng màu/cao độ trong từng ô** — rẻ nhất, không đụng kiến trúc. Loại:
    mặt bên của hộp vẫn còn, nên cái bậc vẫn còn; chỉ là bậc được sơn khéo hơn. Đây đúng thứ Đàm
    cấm (*"không được chỉ tăng saturation, đổi palette… để giả vờ cải thiện chất lượng"*).
  - (b) **Bỏ hẳn lưới 12×12, sinh địa hình tự do** — hợp mỹ thuật nhất. Loại: lưới là nơi
    `cityLayout.js` đặt công trình (ADR-007, bất biến "bảo tàng bất động"), phá nó là phá cả
    progression. Đàm cũng đã chỉ đường khác: giữ data, đổi cách render.
  - (c) **Giữ nguyên DỮ LIỆU bậc thềm, lấy mẫu MƯỢT nó lên một lưới đỉnh liền** ← CHỌN.
- **Giải pháp**: `terrain.js` thêm `smoothHeightAt` (nội suy `smoothstep` giữa các tâm ô) và
  `surfaceHeightAt` (thêm vùng đất thoải ra ngoài lưới). `render3d/terrainMesh.js` dựng hai tấm
  lưới liền — đất và đường — với pháp tuyến MƯỢT tính từ sai phân trường cao độ.
  - **Bất biến khoá cả thiết kế**: tại toạ độ NGUYÊN, `smoothHeightAt` trả về **đúng** `heightAt`.
    Nhà, cây, cư dân đều đứng ở `heightAt`; lệch một phần nghìn là cả thành phố lơ lửng hoặc lún,
    im lặng. Có test riêng, đã thử ngược.
  - **Dữ liệu bậc thềm không đổi một con số** — `cells`/`footprint`/`drop`/ADR-007 nguyên vẹn.
- **Vì sao MẶT ĐƯỜNG là tấm RIÊNG, không phải nhóm vật liệu trong tấm đất**: bản đầu làm cách kia
  và nó sai về HÌNH HỌC. Nhét đường vào lưới đất ⇒ bề rộng ngõ bị làm tròn về bội của một ô con
  (1/3); mà muốn ngõ nằm CÂN GIỮA ô thì số ô con phải cùng chẵn-lẻ với `SUB`, tức chỉ còn 1/3
  (mảnh như sợi chỉ) hoặc 3/3 (bằng đại lộ, mất thứ bậc đường). Lấy 2/3 thì đúng bề rộng nhưng
  **lệch tâm 1/6 ô**, và cư dân đi đúng tâm ô sẽ đi sát mép đường. Đó là ràng buộc chẵn-lẻ, không
  phải sai số — không có cách chỉnh khéo nào thoát. Cái giá bị đồn thổi của việc tách ra hoá ra
  bằng **không**: hai nhóm vật liệu trong một khối hình học vốn đã là hai lệnh vẽ.
- **Trade-off (đo, không đoán)**: lệnh vẽ **KHÔNG đổi** (2 → 2). Tam giác địa hình **2.330 →
  7.130** (+4.800), cả cảnh **~29.000 → ~36.100 = 60%** của trần 60.000. Đây là khoản chi lớn nhất
  của cả mảng 8, và nó chưa được đo trên iPhone thật (TECH_DEBT #23/#26 — nay gấp hơn một bậc).
  Núm hạ tải rẻ nhất nếu cần: `SUB` 3 → 2 trả lại 3.610 tam giác.
- **Ảnh hưởng**: `palette3d.js` không còn bị buộc phải siết sắc nền — biến thiên màu nay chạy theo
  trường liên tục tần số ~2,9 ô, vắt ngang các ô, nên không có hàng lối nào để mắt nối. Đây là lý
  do `MOTTLE_AMPLITUDE = 0,30` được phép lớn gấp nhiều lần trần ±0,018 cũ.
- **Điều kiện xem lại**: nếu đo iPhone cho thấy không gánh nổi (hạ `SUB`), hoặc nếu sau này lưới
  thành phố thôi là 12×12 cố định.

---

## ADR-018 — Cạnh vát theo TỈ LỆ khối + một ngưỡng nhìn-thấy-được, không vát đều tay

- **Ngày**: 2026-08-15 (Phase 8B)
- **Bối cảnh**: nguyên nhân gốc số 1 mà audit Phase 8A đặt tên — cả hệ thống chỉ có hai hình cơ
  bản, không một cạnh vát nào, nên mọi cạnh là góc 90° trần trụi. Ngoài đời gần như không có cạnh
  nhọn tuyệt đối; dải hẹp ở mép chính là thứ **bắt vệt sáng viền**, và vệt ấy mới nói cho mắt biết
  "vật này có khối lượng".
- **Vấn đề**: vát thì tốn tam giác, mà Phase 8A vừa đẩy kỷ nặng nhất lên 41% trần.
- **Phương án cân nhắc**:
  1. **Vát đều mọi khối** một bề rộng cố định.
  2. **Vát theo ngưỡng KÍCH THƯỚC tuyệt đối** (chỉ khối lớn hơn X).
  3. **Vát rộng theo TỈ LỆ cạnh mỏng nhất, bỏ qua khối quá mỏng để thấy** ← chọn.
- **Lý do loại bỏ**:
  - (1) đo ra **×2,32 tam giác** — quá đắt. Và tệ hơn: một bề rộng cố định 0,02 đặt lên gờ tầng
    DÀY 0,022 sẽ **nuốt gần trọn cái gờ** vừa dựng ở Phase 8A. Đúng cái bẫy "một hằng số tuyệt đối
    áp lên những khối chênh nhau hàng chục lần" đã trả giá ở Phase 7D và 5B.
  - (2) đỡ hơn nhưng vẫn là một con số tuỳ hứng, và nó trả lời sai câu hỏi: thứ quyết định "vát có
    nhìn thấy không" không phải khối TO hay NHỎ mà là **dải vát rộng bao nhiêu ĐIỂM ẢNH**.
- **Giải pháp chọn**: `bevelWidth = min(BEVEL_MAX, cạnh_mỏng_nhất × BEVEL_RATIO)`, và **bỏ vát hẳn**
  nếu kết quả `< BEVEL_MIN_VISIBLE`. Ngưỡng đó không phải một phép "tối ưu" — nó là phát biểu rằng
  *một dải hẹp hơn một điểm ảnh thì không phải một dải*. Đo ra: cạnh mỏng nhất của khối TRUNG VỊ chỉ
  là 0,035 (kính và gờ mảnh chiếm đa số), nên ngưỡng này loại đúng phần đông đảo mà vô hình.
- **Trade-off**: chi phí còn **×1,24** (kỷ nặng nhất 18.532 → 22.948 tam giác công trình), chỉ ~18%
  số khối được vát — đúng những khối to tạo nên hình bóng. Hiệu quả đo được: **3,8% khung hình đổi
  đủ để mắt thấy**, chênh lớn nhất 408/765. Khiêm tốn nhưng thật, và tập trung đúng ở các cạnh.
- **Ảnh hưởng**: `bevelWidth` phải là **nguồn duy nhất** cho cả `countTriangles` (tầng thuần) lẫn
  `emitPrism` (nhà máy), và cả hai phải hỏi trên khối **CHƯA nhân `BUILDING_SCALE`** — hỏi trên số
  đã nhân 1,3 thì khối nằm sát ngưỡng sẽ được vát mà không được đếm, và bảng ngân sách nói dối
  trong im lặng. Đã khoá bằng bài "NGÂN SÁCH KHÔNG NÓI DỐI".
- **Điều kiện xem lại**: `BEVEL_MAX` chọn từ bảng đo (0,020→3,3% · **0,035→3,8%** · 0,050→4,4% ·
  0,070→4,9%); **nới nó KHÔNG tốn thêm tam giác**, thứ chặn tay là mỹ thuật — quá 5% bề mặt thì mép
  vát thôi là mép và bắt đầu là một khối thóp khác. Muốn rẻ hơn thì hạ `BEVEL_MIN_VISIBLE`… ngược
  lại: NÂNG nó lên để loại thêm khối.

---

## ADR-017 — Chiều sâu mặt tường dựng bằng HÌNH KHỐI THẬT, không bằng bản đồ pháp tuyến

- **Ngày**: 2026-08-15 (Phase 8A)
- **Bối cảnh**: Đàm nhìn ảnh cận cảnh rồi nói thành phố *"quá pixel, hình hộp, low-poly, vật liệu
  phẳng"*. Đo ra thì anh đúng theo nghĩa đen: nhà dân nhỏ nhất gồm **12 khối, trong đó thân nhà
  đúng MỘT cái hộp** (`wall:1`) + 1 mái + 8 mảnh kính. Cả cảnh chỉ dùng **5% (kỷ 1) đến 23% (kỷ 7)**
  ngân sách tam giác.
- **Vấn đề**: mặt tường không có gì cắt ngang thì mắt đọc ra một hình chữ nhật tô màu, không đọc ra
  một khối đặc. Thêm vào đó, cửa sổ đang **THÒ RA** khỏi tường 0,035 — một ô kính nhô lên trên mặt
  tường thì mắt đọc ra "miếng dán", không đọc ra "cái lỗ".
- **Phương án cân nhắc**:
  1. **Bản đồ pháp tuyến / bản đồ nổi (normal/bump map)** — rẻ về tam giác, là cách ngành game hay
     dùng để "giả" chiều sâu trên mặt phẳng.
  2. **Kẻ đường bằng MÀU** (vẽ dải sẫm lên đỉnh tường qua màu đỉnh) — rẻ nhất, không thêm khối nào.
  3. **Dựng khối thật**: chân tường, gờ mái, gờ tầng, bệ và lanh tô cửa sổ.
- **Lý do loại bỏ**:
  - (1) thêm ảnh chụp (texture) vào một dự án hiện **không có một tấm ảnh nào** — mọi màu đang sinh
    ra từ đỉnh hình học. Nó kéo theo cả một hệ thống mới: tải ảnh, bộ nhớ đệm ảnh, tiền tải, tỉ lệ
    UV cho từng khối cỡ khác nhau. Và bản đồ pháp tuyến **không đổ bóng thật** — nó chỉ lừa được
    ánh sáng khuếch tán, nên đúng ở góc nhìn thẳng và lộ ngay khi camera xoay, mà camera ở đây thì
    xoay được. Đây cũng đúng thứ Đàm gọi tên là *"texture/chi tiết giả tạo"*.
  - (2) vi phạm thẳng bài học đã trả giá nhiều lần trong dự án: **đổi màu để bù cho cảm giác phẳng
    là chữa triệu chứng**. Một dải sẫm không có bóng, không đổi theo hướng mặt trời, và biến mất
    hoàn toàn lúc đêm.
  - Cả hai đều tiết kiệm một thứ **đang thừa 4–5 lần**. Tiết kiệm tam giác ở nơi không cần tiết
    kiệm rồi đi chỉnh màu để bù — đó chính là cái bệnh, không phải cách chữa.
- **Giải pháp chọn**: phương án (3). Năm khối mới cho mỗi mảng nhà (chân tường · gờ mái · ≤3 gờ
  tầng · bệ cửa sổ · lanh tô), tất cả sinh ra ở tầng **engine thuần** `buildingSpec.js` dưới dạng
  `PartSpec` như mọi khối khác — không có đường đi mới, không có loại vật liệu mới, không có ảnh.
- **Trade-off**: nhà dân nhỏ 12 → 17 khối (172 → 232 tam giác); kỷ nặng nhất 13.556 → 24.532 tam
  giác, tức **23% → 41%** trần 60.000. Đắt hơn hẳn, nhưng vẫn còn hơn một nửa ngân sách; và đây là
  khoản chi ĐÚNG CHỖ — nó mua bóng đổ thật, đổi theo giờ trong ngày, đúng ở mọi góc camera.
- **Ảnh hưởng**: mọi công trình ở mọi kỷ, cả bảo tàng. Hình khối đổi ⇒ thành phố cũ trong bảo tàng
  cũng hiện theo bộ khối mới. **Điều này KHÔNG vi phạm ADR-007** (bảo tàng bất động): ADR-007 khoá
  *vị trí và danh tính* công trình, không khoá cách vẽ chúng — y như đổi bảng màu ở Phase 3N/6B.
- **Điều kiện xem lại**: nếu cổng hiệu năng iPhone (TECH_DEBT #23/#26) đo ra không đạt, chỗ cắt đầu
  tiên là **gờ tầng** (nhiều nhất, nhỏ nhất, dễ bỏ nhất) chứ không phải chân tường/gờ mái.

---

## ADR-016 — Mặt đường phát biểu bằng KHOẢNG CÁCH TỚI MẶT ĐẤT, không bằng một độ sáng tuyệt đối

- **Ngày**: 2026-08-15 (Phase 7D)
- **Bối cảnh**: Đàm yêu cầu *"hệ thống đường phải thay đổi theo thời đại: đất/đá cổ đại, ngõ đá
  trung cổ, đường công nghiệp, đường quy hoạch hiện đại"*. Audit tìm ra mặt đường của cả 15 kỷ là
  đúng MỘT dòng: `road: material(48, 0.10, 0.10, 0.68, 0.42)`.
- **Vấn đề**: dòng ấy mang HAI lỗi có chung một gốc.
  1. Một mã màu cho 15 kỷ — đường mòn thời đồ đá và đại lộ Dubai là *cùng một mặt phẳng cùng một
     màu*. Đây là hình dạng sai đã gặp ở `roofColor` trước Phase 6B.
  2. **Ban đêm mặt đường tàng hình**, và nó đã chạy như vậy trên production nhiều ngày. Đo cả 15
     kỷ: ban ngày đường cách mặt đất 0,129–0,145 độ đậm (đọc được); ban đêm chỉ **0,012–0,020**.
     Nguyên nhân không phải ai đó chỉnh sai số của đường: Phase 3M nâng độ đậm mặt đất ban đêm
     0,286 → 0,400 vì một lý do hoàn toàn khác, còn số 0,42 của mặt đường thì **không có lý do gì
     để đi theo**, vì nó không biết mặt đất tồn tại.

**Phương án đã cân nhắc**

1. **Giữ hằng số, chỉnh lại 0,42 thành một số cao hơn.** *Loại bỏ*: đây đúng là bản vá theo triệu
   chứng. Nó chữa được hôm nay và sẽ gãy lại y hệt vào lần kế tiếp có ai chỉnh mặt đất — mà mặt
   đất đã bị chỉnh ba lần trong lịch sử dự án (Phase 3C, 3M, 7B). Không có gì đỏ lên khi nó gãy.
2. **Cho mặt đường lấy thẳng `roadColor` của kỷ, không kẹp gì cả.** *Loại bỏ*: đo ra thì bê tông
   kỷ 11 (`#4a4744`, độ đậm 0,278) và mặt đất ban đêm (0,40) chỉ cách nhau 0,12 ở một số kỷ, và
   vài kỷ khác thì đường gần như trùng đất. Bản sắc vật liệu thắng, nhưng *"mắt cần đọc ra lối
   đi"* — lời hứa ghi ngay trong chú thích cũ — thì thua.
3. **✅ Đo mặt đất THẬT ở đúng thời điểm đang dựng, rồi đặt mặt đường cách ra một khoảng nhìn
   thấy được, GIỮ NGUYÊN chiều của vật liệu.** Đường đất mòn sáng hơn nền cỏ (bụi khô, bị giẫm
   bạc màu); nhựa đường và bê tông thì tối hơn. Công thức là một phép **ĐẨY ĐƠN ĐIỆU**:
   `roadL = groundL + sign(offset) × (MIN + |offset| × SPAN)`.

**Vì sao chọn (3)**: nó phát biểu cái luật đúng như lời của nó — *"đường phải đọc ra là lối đi"*
là một QUAN HỆ với mặt đất, không phải một con số. Mặt đất dời đi đâu thì mặt đường theo tới đó,
vĩnh viễn, không cần ai nhớ để chỉnh tay. Và vì chiều được giữ nguyên, 15 kỷ vẫn nói được vật
liệu của mình.

**⚠️ ĐẨY chứ không KẸP — bản đầu của chính phase này làm sai, và phép đo bắt được chứ mắt thì
không.** Bản đầu viết `|offset| < MIN ? ±MIN : offset`. Phép kẹp bảo đảm được khoảng cách tối
thiểu nhưng **phá THỨ TỰ**: mọi vật liệu nằm gần mặt đất đều bị dồn về đúng ±0,13, nên pavé Paris
(độ đậm 0,50) và bê tông Singapore (0,63) ra CÙNG MỘT độ đậm dù hai con số đầu vào cách nhau xa.
Đo được: 9↔14 chỉ còn 7,3 ban ngày và 3,7 ban đêm. Phép đẩy giữ được cả hai vế.

**Trade-off**: mặt đường không còn hiện đúng mã màu khai trong `eraStyle.js` — nó hiện một màu đã
được dịch theo mặt đất. Chấp nhận, vì `roadColor` là **lời khai về vật liệu**, không phải một lời
hứa về điểm ảnh; cùng đúng tinh thần "BẢNG MÀU ≠ MÀU TRÊN MÀN HÌNH" đã ghi ở `CLAUDE.md`.

**Ảnh hưởng**: `palette3d.js` (thêm `road`/`roadLane` suy từ mặt đất), `eraStyle.js` (15 kỷ khai
`roadMaterial` + `roadColor`), `sceneGraph.js` (mặt đường có vật liệu PBR riêng, ngõ phố thôi mượn
`roles.stone`), `materials.js` (thêm họ `dirt`).

**Điều kiện xem lại**: nếu sau này mặt đất đổi từ một màu phẳng sang có vân/texture thì "độ đậm
của mặt đất" không còn là một con số duy nhất, và phép đo neo ở đây phải đổi theo.

---

## ADR-015 — Nhà dân đi qua ĐÚNG bộ máy sinh công trình (không có bộ sinh riêng), và kỷ khai thêm một MÁI NHÀ THƯỜNG tách khỏi mái công trình biểu tượng

- **Ngày**: 2026-08-15 (Phase 7C)
- **Bối cảnh**: Đàm yêu cầu thành phố phải có *"nhà dân nhỏ/vừa/lớn, cửa hàng, xưởng… khu dân cư,
  trung tâm, ngoại vi"*, mỗi ~2 phiên mọc thêm một căn, và *"nhà dân phải đúng thời đại + quốc gia,
  không dùng nhà generic rồi đổi texture"*. Đồng thời: *"5 landmark phải có silhouette đặc trưng,
  detail cao hơn nhà dân, nhận ra được từ xa."* Trước bản này mỗi kỷ chỉ có 5 công trình trên lưới
  144 ô — phần còn lại là đất trống.
- **Vấn đề**: hai yêu cầu trên kéo ngược nhau. Muốn nhà dân "đúng thời đại + quốc gia" thì nó phải
  mang toàn bộ ngữ pháp kỷ (mái, vật liệu, tỉ lệ, cửa sổ); nhưng mang đủ ngữ pháp ấy thì nó trông
  y hệt kỳ quan thu nhỏ, và kỳ quan hết "nhận ra được từ xa".

**Phương án đã cân nhắc**

1. **Bộ sinh nhà dân RIÊNG** (một `dwellingSpec.js` độc lập). *Loại bỏ*: phải chép lại lần thứ hai
   toàn bộ thứ đã dạy cho thành phố suốt 6 phase — kiểu mái theo kỷ, vật liệu tường/mái, `massScale`,
   `spread`, kiểu cửa sổ. Mọi bản chép trong lịch sử dự án này đều đã trôi khỏi bản gốc (xem mục
   "Composition over Duplication" ở `CLAUDE.md`, và sự cố bản sao tài liệu 2026-07-31). Thêm nữa,
   một kỷ mới sẽ phải khai dữ liệu ở HAI nơi.
2. **Dùng chung `buildBuildingSpec`, phân biệt bằng ĐỘ HIẾM** (nhà dân = `common`). *Loại bỏ*: trục
   `rarity` đã mang nghĩa "công trình bề thế tới đâu", và `common` vẫn dựng chữ ký kiến trúc — tức
   30 căn nhà dân kỷ 1 đều đội cột chữ T Göbekli Tepe. Không giải quyết được vế thứ hai.
3. **✅ Dùng chung `buildBuildingSpec` + một cờ `plain` ở tầng NGUYÊN MẪU.** Nhà dân là 3 nguyên
   mẫu mới (`house`/`shop`/`workshop`) khai `plain: true`; cờ này tắt `emitSignature` và đưa ngân
   sách mô-típ về 0. Trục `rarity` được dùng lại với nghĩa **cỡ nhà nhỏ/vừa/lớn** — đúng ba nấc Đàm
   nêu, và đã có sẵn toàn bộ hệ số nhân đi kèm.

**Vì sao chọn (3)**: nhà dân kỷ 6 TỰ ĐỘNG có mái ngói Bắc Bộ và nhà dân kỷ 14 TỰ ĐỘNG có mặt kính
Singapore mà không cần một dòng dữ liệu mới nào; thêm một kỷ vẫn chỉ khai ở một chỗ. Ranh giới
"kết cấu vs căn cước" đã tồn tại sẵn trong `buildingSpec.js` từ Phase 6A, nên `plain` chỉ là đặt tên
cho một đường cắt đã có, không phải tạo khái niệm mới.

**Quyết định thứ hai, phát hiện bằng ẢNH CHỤP chứ không bằng suy luận**: `plain` là CHƯA ĐỦ. Ảnh kỷ 7
cho thấy 25 căn nhà nhỏ đều đội mái vòm terracotta y hệt Duomo — vì `style.roof` đang gánh hai việc
(*"công trình biểu tượng của nền văn minh này lợp mái gì"* và *"nhà thường ở đây lợp mái gì"*), hai
câu hỏi gần như không bao giờ cùng đáp án ngoài đời. ⇒ Thêm trường **`vernacularRoof`** (bắt buộc,
15/15 kỷ; 9 kỷ khai khác `roof`) và **`getVernacularStyle()`** thay mái **ở nguồn** — không thay
trong `emitRoof`, vì `roofRise` cùng nhiều chỗ khác cũng đọc `style.roof`.

**Đánh đổi**
- Nhà dân KHÔNG chạm được (`addPickTarget` chỉ dành cho công trình thật + giàn giáo). Chạm vào một
  căn nhà vô danh rồi hiện bảng rỗng thì tệ hơn là không chạm được.
- Cờ `plain` cắt chữ ký kiến trúc, nên nhà dân giữ **nét vẽ** của kỷ mà không mang **căn cước** của
  kỷ. Đây là chủ đích, không phải thiếu sót.
- Kèm theo phải kẹp diềm mái theo tỉ lệ (`eaveOverhang`), và phép kẹp đó **chạm vào 115/215 mảng
  nhà của 75 công trình đã có** — tức một thay đổi mỹ thuật ảnh hưởng cả công trình cũ. Không phạm
  ADR-007 (lời hứa ở đó là "cùng `bpId` → cùng hình", cấm ngẫu nhiên; không phải "cấm sửa mỹ thuật"
  — Phase 5B đã đổi chiều cao cả 75 công trình theo đúng tinh thần này).

**Ảnh hưởng**: `src/engine/city3d/dwellings.js` (mới), `archetypes.js`, `buildingSpec.js`,
`eraStyle.js`, `signature.js`, `cityLayout.js`, `sceneGraph.js`. Cộng hai file lá mới
`src/engine/hashId.js` và `src/engine/cityGrid.js` — cắt vòng import `cityLayout ↔ dwellings` tận
gốc thay vì chép hằng số sang.

**Số liệu**: 17 căn (kỷ 1) → 30 căn (kỷ 15). Cảnh nặng nhất kỷ 7 = **21.244 / 60.000** tam giác.

**Điều kiện xem lại**: nếu sau này nhà dân cần chạm được (ví dụ để hiện tên khu), hoặc nếu một kỷ
mới cần mái nhà thường khác cả `roof` lẫn `vernacularRoof` tuỳ công năng (nhà ở vs xưởng), thì trục
`vernacularRoof` phải mở rộng theo `type` chứ không nhân bản thành trường thứ ba.

---

## ADR-014 — Địa hình Thành Phố 3D dùng THỀM BẬC do kỷ quyết định (không phải dốc liên tục, không phải ngẫu nhiên), và nhà vắt qua mép thềm thì kê MÓNG chứ không san phẳng đất

- **Ngày**: 2026-08-14
- **Bối cảnh**: yêu cầu của Đàm cho Thành Phố 3D nêu đích danh *"terrain must have elevation, cây
  cối và địa hình tự nhiên"* và *"clear foreground/midground/background"*. Trước Phase 7B mặt đất
  là 144 ô hộp **phẳng tuyệt đối ở cao độ 0** cho cả 15 kỷ — tức trục "địa hình" hoàn toàn không
  tồn tại, và mọi kỷ dùng chung đúng một mặt bàn.
- **Vấn đề**: có ba câu hỏi độc lập phải trả lời cùng lúc, và trả lời sai bất kỳ câu nào cũng làm
  hỏng hai câu còn lại.
  1. **Dốc liên tục hay bậc thềm?** Nền là 144 khối HỘP và công trình là khối ĐÁY PHẲNG.
  2. **Cao độ phụ thuộc vào gì?** Nếu phụ thuộc dữ liệu người chơi thì đất sẽ xê dịch.
  3. **Nhà vắt qua mép thềm thì xử lý sao?** Một góc nhà treo lơ lửng là lỗi nhìn thấy ngay.
- **Phương án đã cân nhắc**:
  1. **Dốc liên tục** (mặt lưới nội suy trơn) + san phẳng ô đất dưới mỗi công trình.
  2. **Thềm bậc** + san phẳng ô đất dưới mỗi công trình.
  3. **Thềm bậc** + công trình đứng ở cao độ CAO NHẤT dưới bóng mình, phần hụt lấp bằng **bệ kè**.
  4. Địa hình sinh theo dữ liệu người chơi (số phiên, chuỗi ngày) cho "có cảm giác lớn lên".
- **Lý do loại bỏ**:
  - **(1)** dốc liên tục buộc phải đổi nền từ hộp sang mặt lưới, và mọi công trình đáy phẳng sẽ hở
    khe ở mép dốc hoặc cắm chìm một góc. Đây là ràng buộc HÌNH HỌC, không phải lựa chọn mỹ thuật.
  - **(1) và (2)** — san phẳng ô đất: phản xạ đầu tiên, và nó sai vì **mạng đường**. Con đường chạy
    ngay cạnh ô vừa bị san sẽ hụt đúng một bậc, tức mạng đường (Phase 5C/6C) gãy làm đôi ở đúng chỗ
    đông đúc nhất — đổi một lỗi nhìn thấy lấy một lỗi khác nhìn thấy rõ hơn.
  - **(4)** vi phạm bất biến "bảo tàng bất động" của ADR-007: mỗi lần Đàm xây xong một căn nhà thì
    cả quả đồi sẽ nhích, nhà cũ lún hoặc nhô mà **không có gì báo**. Cùng lý do đã khiến VỊ TRÍ ô
    đất và THỨ TỰ mở đường đều chỉ phụ thuộc `hashId`, không phụ thuộc tiến độ.
- **Giải pháp được chọn**: phương án **(3)**.
  - `src/engine/city3d/terrain.js` — THUẦN, không import three, không `Math.random`, không `Date`.
    Cao độ là hàm của **DUY NHẤT `era` và `gridSize`**; `buildTerrain` cố tình KHÔNG nhận danh sách
    công trình (có test gọi kèm dữ liệu rác để chứng minh kết quả không đổi).
  - Mỗi kỷ khai 3 tham số trong `ERA_TERRAIN`: `shape` (plain/rolling/valley/ridge/coast/dune),
    `terraces` (số bậc), `relief` (độ cao mỗi bậc), **cộng một trường `note` bắt buộc** giải thích
    địa hình bằng một nơi CÓ THẬT ở đúng nước của kỷ đó — cùng luật với `country`/`landmark` ở
    `eraStyle.js`: con số không có lời giải thích là con số tuỳ hứng, và tuỳ hứng chính là thứ đã
    sinh ra "15 kỷ cao bằng nhau" ở Phase 5B.
  - **Bước CĂNG TRƯỜNG (chuẩn hoá min→0, max→1) rồi mới chia bậc bằng `floor`** là chỗ chịu lực
    thật sự của cả file. Không có nó thì trên lưới 12×12 chỉ có ~9 giá trị mắt lưới độc lập, luật
    số lớn không áp dụng được, và 5/15 kỷ sập về 1–2 bậc dù khai 4–5 bậc.
  - Công trình vắt mép thềm nhận thêm một khối **bệ kè** đi vào CÙNG khối hình học gộp ⇒ **không
    tốn thêm lệnh vẽ nào**, chỉ 12 tam giác, và chỉ sinh ra khi thật sự có phần hụt.
  - Camera bù theo địa hình bằng **ĐƠN VỊ THẾ GIỚI** (`TERRAIN_TO_DISTANCE`/`TERRAIN_TO_TARGET_Y`),
    KHÔNG trộn vào `massScale`: đo được 1 đơn vị `massScale` ≈ 5 đơn vị thế giới, nên quy đổi qua
    cỡ lưới là quy đổi bằng một con số chẳng liên quan (bản đầu bù thiếu ~4 lần).
- **Trade-off**:
  - Thềm bậc **nhìn ra là bậc** — kỷ dốc (5, 7, 8) đọc gần với ruộng bậc thang hơn là đồi tự nhiên.
    Chấp nhận: nó nhất quán với ngôn ngữ khối vuông của cả cảnh, và là thứ DUY NHẤT hợp lệ về hình
    học với nền hộp + nhà đáy phẳng.
  - Địa hình cố định theo kỷ ⇒ **không** dùng được làm phần thưởng tiến độ. Đó là cái giá của bất
    biến "đất không xê dịch", và là cái giá đúng.
  - Đo được: độ phân biệt 6 chặng ngày tụt nhẹ **37,1 → 32,6** (ngưỡng mắt 12, vẫn 0/15 cặp dưới
    ngưỡng) — mặt bên thềm là mặt khuất nắng nên nó làm dịu bớt biên độ màu của cả cảnh.
- **Ảnh hưởng**: **sáu** chỗ trong `sceneGraph.js` phải hỏi `terrain` (ô nền · đường · công trình +
  móng · cảnh vật · cư dân), và quên một chỗ là **im lặng hoàn toàn** — build xanh, lint sạch, mọi
  test khác xanh, chỉ có một cái cây trôi giữa không trung. Đã khoá bằng `sceneGraphWiring.test.js`
  (bảng `GROUND_ANCHORS`, cả 7 assert đều đã thử ngược và thấy đỏ).
- **Điều kiện xem xét lại**: nếu sau này nền được đổi từ 144 hộp sang một mặt lưới thật (ví dụ khi
  làm sông/hồ/bờ biển có mặt nước), thì ràng buộc hình học sinh ra quyết định này biến mất và
  phương án (1) đáng cân nhắc lại — nhưng lúc đó phải giải quyết lại bài toán "nhà đáy phẳng trên
  mặt dốc", nhiều khả năng vẫn bằng chính bệ kè này.

---

## ADR-013 — Thành Phố 3D dùng vật liệu PBR có bản đồ môi trường, thay cho một `MeshLambertMaterial` dùng chung; và giữ kiến trúc gộp-hình-học bằng NHÓM vật liệu chứ không bằng nhiều khối

- **Ngày**: 2026-08-14
- **Bối cảnh**: Đàm yêu cầu nâng cấp toàn diện Thành Phố 3D vì nó *"còn giống low-poly/prototype"*,
  và nói rõ đích đến là **premium stylized 3D realism**, với yêu cầu cụ thể *"vật liệu phải đọc ra
  rõ là đá, gạch, gỗ, đất nung, ngói, bê tông, kim loại"*. Trước đó cả thành phố dùng **đúng một**
  `MeshLambertMaterial({vertexColors: true})`.
- **Vấn đề**: Lambert là mô hình **thuần khuếch tán** — nó không có số hạng phản xạ gương nào. Nghĩa
  là dù có tô bao nhiêu màu đi nữa thì **về mặt toán học mọi bề mặt trong thành phố vẫn là CÙNG MỘT
  bề mặt**, chỉ khác sắc. Không có cách nào để kính đọc ra khác đá, hay kẽm đọc ra khác ngói, vì
  thứ phân biệt chúng ngoài đời (độ bóng, độ nhám, phản chiếu) đơn giản là không tồn tại trong công
  thức. Đây là **nguyên nhân gốc** của cảm giác "khối màu phẳng" — không phải số tam giác, không
  phải bảng màu, cả hai thứ đã được đầu tư nhiều Phase trước đó mà cảm giác vẫn còn.
- **Phương án đã cân nhắc**:
  1. Giữ Lambert, bù bằng texture ảnh (gạch, gỗ, đá).
  2. Giữ Lambert, bù bằng nhiều hình khối nhỏ hơn (khắc rãnh gạch bằng hình học).
  3. `MeshStandardMaterial` (PBR) — **một** vật liệu cho cả thành phố, chỉnh `roughness` trung bình.
  4. `MeshStandardMaterial` theo **HỌ vật liệu**, một khối hình học nhiều **nhóm** (`addGroup`). ← **CHỌN**
  5. `MeshStandardMaterial` theo họ, **mỗi họ một khối hình học riêng**.
- **Lý do loại bỏ (1)**: texture phải tải về, phải sinh UV cho hình học đang dựng theo thủ tục, và
  chunk PWA đã precache 1,7 MB. Nó cũng đi ngược hướng mỹ thuật đã chốt (khối cắt gọt, pháp tuyến
  phẳng theo mặt) — dán ảnh gạch lên khối stylized cho ra thứ trông rẻ tiền hơn, không đắt hơn.
- **Lý do loại bỏ (2)**: đắt tuyến tính theo số công trình mà vẫn không giải quyết được vấn đề thật
  — hai bề mặt vẫn phản ứng với ánh sáng y hệt nhau, chỉ là một cái nhiều rãnh hơn.
- **Lý do loại bỏ (3)**: giải quyết được "trông có chất liệu hơn" nhưng KHÔNG giải quyết được yêu
  cầu thật của Đàm là *phân biệt được* các chất liệu. Một `roughness` trung bình cho cả thành phố
  chỉ là Lambert bóng hơn.
- **Lý do loại bỏ (5)**: mỗi khối là một lệnh vẽ và một lần dựng `BufferGeometry` — nó phá kiến
  trúc gộp-hình-học đã dựng từ Phase 3B mà **không đổi lấy được gì** so với (4): `addGroup` cho ra
  đúng cùng số lệnh vẽ, trên một khối duy nhất, tức ít việc dọn dẹp hơn khi tab bị unmount.
- **Giải pháp được chọn**: bảng **15 HỌ vật liệu** ở `engine/city3d/materials.js` (thuần, có test),
  mỗi kỷ tự khai `wallMaterial`/`roofMaterial`. `geometryFactory` gom tam giác theo họ rồi phát ra
  các nhóm; `sceneGraph` dựng mảng vật liệu **từ chính `families` mà nhà máy trả về**. Kèm hai thứ
  đi cùng bắt buộc:
  - **Bản đồ môi trường nướng từ chính bầu trời đang nhìn thấy** (`PMREMGenerator.fromScene` trên
    một quả cầu 16×8 tô bằng **cùng hàm** `paintSkyGradient` vẽ vòm trời). ⚠️ Đây **không phải điểm
    tô thêm**: kim loại gần như không có thành phần khuếch tán, nên `metalness: 0.9` mà không có gì
    để phản chiếu sẽ render ra **ĐEN**. Bản đồ môi trường là ĐIỀU KIỆN CẦN của quyết định này.
  - **Bóng tiếp xúc nướng sẵn vào màu đỉnh** (`contactShade`, tối dần về phía mặt đất). Chọn cách
    này thay vì một lượt SSAO vì SSAO là một lượt hậu kỳ chạy **mỗi khung hình** — nó phá vỡ
    render-on-demand (đứng yên = 0 nhịp rAF), thứ đắt nhất phải giữ trên iPhone. Nướng sẵn tốn 0
    đồng lúc chạy.
- **Trade-off**: (a) số lệnh vẽ cho công trình đi từ 1 lên **5–7** (một lệnh mỗi họ; đã khoá trần
  ≤8 bằng test cho cả 15 kỷ) — vẫn nằm sâu trong ngân sách, và rẻ hơn nhiều so với 750 lệnh của
  cách vẽ rời từng khối; (b) dựng cảnh tốn thêm một lần nướng PMREM; (c) `MeshStandardMaterial`
  đắt hơn Lambert cho mỗi điểm ảnh — cổng hiệu năng iPhone ở Phase 3A cần đo lại nếu Đàm thấy máy
  nóng lên.
- **Ảnh hưởng**: `eraStyle.js` (thêm 2 trường × 15 kỷ), `geometryFactory.js`, `sceneGraph.js`,
  `CityScene3D.jsx` + `scripts/city-preview.mjs` (cả hai phải truyền `renderer` vào — thiếu thì
  kim loại đen). Không đụng state, không đụng dữ liệu đã lưu, không thêm dependency.
- **Điều kiện xem lại**: nếu iPhone của Đàm nóng lên hoặc tụt pin rõ so với trước → đo lại bằng HUD
  hiệu năng, và nếu cần thì hạ `metalness` để bỏ hẳn nướng PMREM ở chế độ máy yếu (`lowDetail`).
- ⚠️ **BÀI HỌC ĐI KÈM, ghi ở đây vì nó là bài học KIẾN TRÚC chứ không phải mẹo vặt**: bản đầu gắn
  bản đồ môi trường bằng `scene.environment` rồi trông cậy `material.envMapIntensity` để chỉnh mạnh
  yếu. **three BỎ QUA `envMapIntensity` hoàn toàn trên đường đó.** Vặn từ 0 lên 1,0 rồi 3,0 mà ảnh
  không đổi một điểm ảnh nào. Suốt nửa buổi tôi tin là mình đang chỉnh một cái núm, trong khi cái
  núm không nối vào đâu cả — và mọi kết luận rút ra trong quãng đó đều vô giá trị. Cách phát hiện:
  **vặn núm tới một giá trị VÔ LÝ rồi đòi một hậu quả VÔ LÝ** (tô quả cầu dò màu đỏ chói: nếu cả
  thành phố đỏ lên kể cả khi cường độ khai bằng 0 thì núm chắc chắn không nối). Một thay đổi làm
  ảnh đổi "một chút" **không chứng minh được gì** — nó là hình dạng của cả nhiễu lẫn tín hiệu.

---

## ADR-012 — "Trùng tu di sản": mở cho xây bù bản vẽ kỷ cũ — thay thế phần bị TỪ CHỐI ở ADR-011, và cái giá không phải là ô hàng đợi mà là NGUYÊN LIỆU KHÔNG KIẾM LẠI ĐƯỢC

- **Ngày**: 2026-08-13
- **Bối cảnh**: `TECH_DEBT #14` đo được **95% số phiên tập trung không có lễ mừng nào**, và càng
  chơi lâu càng im lặng (kỷ 1: 81% → kỷ 15: 98%). Nguyên nhân gốc là số BƯỚC XÂY của cả game chỉ
  có 420, trong khi tới Prestige là ~4 428 phiên. Đàm đã chọn hướng (b) — "bỏ lọc theo kỷ hiện
  tại" — và trong phiên này chọn tiếp cách hiện thực **(b2)**: công trình kỷ cũ mọc thẳng vào BẢO
  TÀNG của kỷ đó, không mọc trong thành phố đang chơi.
- **Vấn đề**: ADR-011 đã **cân nhắc và LOẠI BỎ** đúng phương án này (phương án (4) trong mục đó),
  với lý do: *"'trọn vẹn kỷ' mất sạch ý nghĩa — cái sao ★ chỉ đáng giá vì nó chấm điểm cho quyết
  định anh đã đưa ra LÚC ĐÓ"*. Lý do ấy KHÔNG sai, nên ADR này phải trả lời nó, không được lờ đi.
  ADR-011 cũng đã ghi sẵn điều kiện xem lại: *"nếu Đàm muốn xây bù các kỷ cũ từ đầu → phải viết
  ADR mới"*. Điều kiện đó nay đã xảy ra.
- **Phương án đã cân nhắc**:
  1. Giữ nguyên ADR-011 (không cho xây bù) → `TECH_DEBT #14` không có đường xử lý nào còn lại.
  2. Cho xây bù, **tính vào 2 ô hàng đợi** của kỷ hiện tại.
  3. Cho xây bù, **ô riêng `LEGACY_QUEUE_SLOTS = 1`**, giữ cổng nguyên liệu. ← **CHỌN**
  4. Cho xây bù không giới hạn (không ô riêng).
- **Lý do loại bỏ (2)**: đúng cái bẫy Phase 4D vừa gỡ. Trùng tu KHÔNG sinh đặc quyền, nên bắt hy
  sinh một ô xây dựng thật để đổi lấy một dòng lịch sử là ép Đàm chọn giữa sức mạnh và sưu tập —
  và người chơi lý trí sẽ luôn chọn sức mạnh, tức tính năng chết ngay khi ra đời.
- **Lý do loại bỏ (4)**: mỗi phiên đẩy MỌI ô trong hàng đợi tiến 1 nấc. Không có trần thì Đàm xếp
  cả ~70 bản vẽ kỷ cũ vào một lượt và cả bảo tàng mọc lên đồng thời — phần thưởng loãng thành vô
  nghĩa, và nó biến 420 bước xây thành một con số vô hạn.
- **Giải pháp được chọn** — và **cách nó trả lời mối lo của ADR-011**: cái giữ cho ngôi sao ★ còn
  sức nặng KHÔNG phải là cấm xây bù, mà là **nguyên liệu**. `mergeResources` chỉ cộng thưởng vào
  `book${activeBook}`, nên túi `book5` **đóng băng vĩnh viễn** đúng lúc Đàm rời kỷ 5 — không một
  đường nào trong game nạp lại được nó. Trùng tu chỉ tiêu được phần dư mà **người-Đàm-ngày-xưa để
  lại**. Nghĩa là những quyết định lúc đó *vẫn* còn nguyên sức nặng, chỉ đổi hình thức: trước là
  "xây kịp hay không", nay là "để dành đủ hay không". Một kỷ bị vắt kiệt nguyên liệu thì vẫn không
  bao giờ chạm được ★, đúng như ADR-011 muốn.
- **Ba lớp chống lạm dụng** (mỗi lớp chặn một đường, không lớp nào thừa):
  1. `LEGACY_QUEUE_SLOTS = 1` — mỗi lúc một công trường trong bảo tàng.
  2. Nguyên liệu kỷ cũ hữu hạn, không tái tạo (đoạn trên).
  3. Không sinh `BUILDING_EFFECTS` — sức mạnh không đổi một điểm nào. Đường đi này đã có sẵn từ
     Phase 4D (`pickLegacyCompletions`), ADR này không phải viết mới.
- **Bỏ cổng NGHIÊN CỨU cho kỷ cũ** (quyết định con, cố ý): `pruneEraScopedBlueprintState` xoá
  `research.researched` của kỷ cũ, mà RP kỷ cũ thì không kiếm lại được. Đòi nghiên-cứu-trước ⇒ bản
  vẽ nào chưa kịp nghiên cứu sẽ **vĩnh viễn** không xây được ⇒ ★ của kỷ đó vĩnh viễn ngoài tầm —
  đúng cái bất công mà Phase 4D sinh ra để xoá, chỉ đổi chỗ. Bỏ cổng này KHÔNG cho thêm sức mạnh
  (không có perk) và KHÔNG bỏ cái giá (vẫn trả đủ nguyên liệu). ⚠️ Cổng nghiên cứu của **kỷ hiện
  tại** giữ NGUYÊN — có bài test riêng canh việc nó không bị nới lây.
- **Trade-off**: (a) một kỷ đã niêm phong nay có thể có công trường mới mọc lên — bảo tàng bớt
  "tĩnh" hơn nữa so với ADR-007 gốc (ADR-011 đã nới lần một, đây là lần hai, và đây là **giới hạn**:
  công trình đã đứng thì vẫn không bao giờ xê dịch); (b) ★ nay có nghĩa "trọn vẹn", không còn hàm ý
  "trọn vẹn NGAY LÚC ĐÓ" — chấp nhận, đổi lại nó thành mục tiêu **với tới được**, mà một mục tiêu
  với tới được thì tạo động lực còn một mục tiêu đã khoá thì chỉ tạo tiếc nuối; (c) tính năng có
  thể **không dùng được** với một kỷ đã bị vắt kiệt nguyên liệu — đó là tính năng, không phải lỗi.
- **Ảnh hưởng**: `engine/constants.js` (`LEGACY_QUEUE_SLOTS`) · `engine/eraLegacy.js`
  (`countLegacyCrafting`, `listRestorableBlueprints`, `canRestoreBlueprint`; sửa lại đoạn ghi chú
  "không thể lạm dụng" đã hết đúng) · `store/gameStore.js` (`startCrafting` tách hai diện) ·
  `components/BuildingWorkshop.jsx` (mục "Trùng tu di sản"; `ReadyCard` nhận cờ `restoration` để
  **không khoe đặc quyền** — bắt được bằng cách soi ảnh chụp, không phải bằng test).
  Test: `engine/eraLegacyRestore.test.js` (9) + `store/gameStore.restore.test.js` (8).
  **KHÔNG có migration**: không thêm trường state nào, không đổi schema.
- **Điều kiện xem xét lại**: nếu đo lại `TECH_DEBT #14` mà tỉ lệ phiên im lặng vẫn trên ~80%, thì
  ô riêng =1 là quá chặt và phải xét nâng; nếu Đàm thấy bảo tàng mọc quá nhanh thì hạ cổng nguyên
  liệu thay vì siết ô.

## ADR-011 — "Di sản dang dở": công trình kỷ cũ được xây tiếp, nhưng phần thưởng chỉ là LỊCH SỬ — nới bất biến của ADR-007 từ "bảo tàng bất động" thành "bảo tàng không xê dịch"

- **Ngày**: 2026-08-13
- **Bối cảnh**: Phase 4B gắn mẫu số vào mọi kỷ (`3/5`) và gắn sao ★ cho kỷ xây trọn vẹn — biến bảo
  tàng từ album ảnh thành bảng thành tích. Ngay sau đó lộ ra một hệ quả không ai thiết kế: cho tới
  lúc ấy, khởi công một công trình sát ngày lên kỷ là **tự phạt mình**. `pruneEraScopedBlueprintState`
  cắt sạch hàng đợi của kỷ cũ, nên bao nhiêu phiên đã đổ vào đó bốc hơi, và ngôi sao của kỷ ấy đóng
  lại vĩnh viễn. Đàm được hỏi và chọn thẳng: *"Cho xây tiếp công trình kỷ cũ"*.
- **Vấn đề**: bảo tàng là quá khứ đã niêm phong (ADR-007). Cho một công trình mọc lên trong đó là
  chạm vào bất biến quan trọng nhất của cả lớp Thành Phố. Vậy nới tới đâu thì vẫn còn là bảo tàng?
- **Phương án đã cân nhắc**:
  1. **Không làm gì** — giữ luật cũ, coi việc mất tiến độ là "chi phí của việc lên kỷ".
  2. **Xây tiếp và cho công trình vào `buildings` như bình thường** — tức nó có hiệu lực thật.
  3. **Xây tiếp, nhưng thành quả chỉ ghi vào `cityArchive`** — vào bảo tàng, không vào state chơi.
  4. Cho **khởi công lại** bản vẽ kỷ cũ bất cứ lúc nào (mở hẳn cửa quay về xây bù các kỷ trước).
- **Lý do loại bỏ (1)**: nó không trung lập. Sau Phase 4B, luật cũ dạy đúng một bài học — *"đừng bao
  giờ bắt đầu thứ gì khi sắp lên kỷ"* — tức app tự thưởng cho việc NGỪNG làm việc ở đúng đoạn Đàm
  đang chạy tốt nhất. Đó là phản-mục-tiêu của cả sản phẩm.
- **Lý do loại bỏ (2)**: `BUILDING_EFFECTS` là perk có hiệu lực vĩnh viễn. Cho công trình kỷ 5 sống
  tiếp ở kỷ 9 là phá thẳng luật cân bằng "mỗi kỷ chỉ hưởng công trình của kỷ mình" —
  `pruneEraScopedBlueprintState` tồn tại chính vì luật đó. Sửa cân bằng game là việc phải hỏi Đàm,
  và anh không hề yêu cầu điều đó.
- **Lý do loại bỏ (4)**: mở cửa quay lại xây bù mọi kỷ cũ thì "trọn vẹn kỷ" mất sạch ý nghĩa — cái
  làm ngôi sao đáng giá là **nó KHÔNG lấy lại được**. Còn nữa: 15 kỷ × 5 bản vẽ thành một danh sách
  việc vặt dài dằng dặc, đúng thứ Đàm bảo là *"chán"*.
- **Giải pháp được chọn**: phương án (3), có biên rõ ràng. Một công trình **đã khởi công trước khi
  lên kỷ** thì sống sót qua ranh giới kỷ và xây tiếp bằng chính những phiên tập trung sau đó; lúc
  hoàn thành, nó **không** vào `buildings` (⇒ không perk, không tài nguyên, **không một đơn vị cân
  bằng nào đổi**) mà được ghi bổ sung vào `cityArchive` của kỷ sinh ra nó. Phần thưởng thuần tuý là
  lịch sử: con số `4/5` nhích lên `5/5`, ngôi sao sáng lên. Không khởi công mới được — cửa vẫn đóng,
  chỉ những gì đã bắt đầu mới được đi hết.
  - Tầng thuần `src/engine/eraLegacy.js` (`blueprintEraOf` · `splitCraftingQueue` ·
    `countActiveCrafting` · `pickLegacyCompletions`), test riêng 10 bài.
  - Ghi bổ sung dùng lại `mergeCityArchive` với `sealedAt: null` — hàm đã sẵn có, và có test khoá
    rằng nó **không** ghi đè `sealedAt`/`epAtSeal`/`sessionCount` của lần niêm phong thật.
  - **Di sản KHÔNG chiếm ô hàng đợi** (`CRAFT_QUEUE_SLOTS = 2`): một phần thưởng thuần lịch sử mà
    lại chặn mất một ô xây dựng thì nó là cái BẪY, và người chơi vẫn học đúng bài học sai ở (1).
- **Nới bất biến ADR-007**: từ *"thành phố cũ không bao giờ đổi sau khi niêm phong"* thành **"công
  trình đã có không bao giờ xê dịch; có thể ghi THÊM một công trình đã khởi công từ trước"**. Đây
  KHÔNG phải nới lỏng bừa: bất biến gốc bảo vệ đúng một thứ — *nhà xây sau không được đẩy nhà xây
  trước đi chỗ khác* — mà `computeCityLayout` đặt nhà theo **khu đất cố định suy từ thứ hạng bản
  vẽ**, nên thêm nhà không thể xê dịch nhà nào. Vế bị nới là vế "bất động", vế được bảo vệ là vế
  "không xê dịch", và chỉ vế thứ hai mới là thứ ADR-007 thật sự mua bằng phương án (3) của nó.
- **Trade-off**: (a) một kỷ đã niêm phong nay có thể có giàn giáo đứng trong đó — trông "kém tĩnh
  lặng" hơn một bảo tàng thuần tuý, nhưng giấu nó đi mới là nói dối (Đàm đang đổ phiên vào đúng
  công trình ấy). (b) Hàng đợi có thể phình quá 2 mục nếu Đàm khởi công 2 cái rồi lên kỷ — chấp
  nhận, vì nó **bị chặn trên**: không khởi công mới được ở kỷ cũ, nên số di sản không bao giờ vượt
  quá số đã bắt đầu, và nó giảm dần một chiều. (c) Thêm một khái niệm mới cho người chơi phải hiểu
  — bù bằng nhãn "DI SẢN KỶ N" ngay trong hàng đợi và chữ "· đang xây" trên thanh chuyển kỷ.
- **Ảnh hưởng**: `gameStore.js` (`pruneEraScopedBlueprintState` giữ lại nhánh legacy ·
  `completeFocusSession` ghi bổ sung + sinh thông báo riêng · `startCrafting` đếm ô theo kỷ hiện
  tại) · `BuildingWorkshop.jsx` · `NotificationCenter.jsx` · `CityView.jsx` ·
  `cityCompletion.js` (`pending` áp cho MỌI kỷ) · `EraSwitcher.jsx`. **Không đổi schema, không đổi
  cân bằng, không thêm trường state nào** — nên không có migration.
- **Điều kiện xem xét lại**: nếu Đàm muốn xây bù các kỷ cũ từ đầu (→ đó là phương án (4), phải viết
  ADR mới đảo ngược bản này và tính lại ý nghĩa của ngôi sao), hoặc nếu số di sản tồn đọng có lúc
  nào đó lớn tới mức hàng đợi khó đọc (→ gom nhóm hiển thị, không sửa luật).

---

## ADR-010 — Khoảnh khắc "thành phố lớn lên" chen ở TẦNG HIỂN THỊ, không hoãn `lootModalOpen` trong store; và cổng phải hỏng theo hướng MỞ

- **Ngày**: 2026-08-12
- **Bối cảnh**: Đàm ra lệnh *"mọi thứ phải hoàn hảo và không bị chán"*. Sau Phase 3H–3L thành phố đã
  ĐỌC được (biết còn bao xa) và SỜ được (chạm vào xem), nhưng đúng khoảnh khắc đáng giá nhất — lúc
  chuông báo hết 25 phút — Đàm vẫn chỉ thấy một hộp thoại vật phẩm. Thành phố có lớn lên thật, chỉ
  là **anh không được nhìn thấy nó lớn lên**. Vòng lặp "làm việc → thấy thành quả" đứt đúng ở mắt
  xích cuối.
- **Vấn đề**: chèn một màn 3,2 giây vào GIỮA "phiên vừa xong" và "hộp thoại phần thưởng" — mà cái
  đứng sau là **màn hình phần thưởng của một phiên làm việc THẬT**. Chèn hỏng thì không mất một hiệu
  ứng đẹp, mà mất 25 phút công sức của Đàm.
- **Phương án đã cân nhắc**:
  1. Hoãn ngay trong store: `completeFocusSession` đặt `lootModalOpen: true` **chậm lại** 3,2 giây.
  2. Thêm một cờ mới vào store (`growthMomentOpen`) rồi cho `LootDropModal` đợi cờ đó tắt.
  3. Chặn ở TẦNG HIỂN THỊ: store không đổi một dòng nào; một component `RewardSequence` quyết định
     đang hiện cái nào.
- **Lý do loại bỏ (1)**: `lootModalOpen` bật ĐỒNG BỘ là một hành vi đang được **ba bài test khẳng
  định** (`completeFocusSession.test.js`). Làm nó thành bất đồng bộ nghĩa là sửa đúng hàm dài nhất
  dự án (~760 dòng, đã ghi là điểm nóng ở `ARCHITECTURE.md` mục 6) để đổi lấy một hiệu ứng hình
  ảnh. Đây chính là kiểu đánh đổi mà Playbook cấm: hy sinh phần lõi ổn định cho phần trang trí.
- **Lý do loại bỏ (2)**: thêm trạng thái vào store nghĩa là thêm một thứ **có thể kẹt ở trạng thái
  bật**. Một cờ "đang chạy lễ mừng" mà quên tắt (thoát app giữa chừng, lỗi render, hết pin) sẽ chặn
  hộp thoại phần thưởng **vĩnh viễn**, kể cả sau khi khởi động lại app.
- **Giải pháp chọn — (3), và nguyên tắc đứng sau nó**: *trạng thái của một hoạt hoạ 3 giây không
  phải là dữ liệu; nó là vòng đời của một component.* `RewardSequence` được React dựng MỚI mỗi lần
  `lootModalOpen` đi từ tắt sang bật, nên biến "đã xem chưa" tự khởi động lại — không có `useEffect`
  nào đi dọn, tức là **không có chỗ nào để quên dọn**. Không thêm một byte nào vào store, nên cũng
  không thêm gì vào JSONB đang tranh chấp CAS.
- **Nguyên tắc thứ hai — HỎNG THEO HƯỚNG MỞ**: cổng được viết sao cho phần thưởng hiện ra **TRỪ KHI**
  khoảnh khắc đang thật sự chạy, chứ không phải "hiện ra KHI khoảnh khắc đã xong". Không có gì thật
  để khoe · Đàm bật giảm chuyển động · dữ liệu lạ · engine trả `null` — mọi nhánh đều dẫn thẳng tới
  phần thưởng. Cộng thêm hai lưới: một chạm là bỏ qua, và một đồng hồ bảo hiểm 3,2 giây.
- **Nguyên tắc thứ ba — TRUNG THỰC HƠN HIỆU ỨNG**: `buildGrowthMoment` trả `null` khi thành phố
  **không** đổi gì. Thà không có khoảnh khắc nào còn hơn một câu chúc mừng rỗng — đúng nguyên tắc
  chống-bịa mà AI Coach đang sống bằng nó (`engine/coach/guard.js`). Vì cùng lẽ đó, vạch xuất phát
  của thanh tiến độ đọc `acceleratedCraftingIds` để biết phiên này đẩy 1 hay 2 bước, thay vì đoán.
- **Trade-off**:
  - Đàm phải chờ thêm ~3 giây trước khi thấy phần thưởng. Đây là cái giá CÓ CHỦ Ý; nút vặn là hằng
    số `MOMENT_MS` và một cú chạm bỏ qua bất cứ lúc nào.
  - Khi một công trình VỪA XONG, thanh chạy từ 0 % chứ không từ vạch thật của phiên trước — vì hàng
    đợi đã dọn mục đó đi rồi, con số cũ không còn tồn tại ở đâu cả. Thà chạy từ 0 (một sự kiện
    "xong rồi") còn hơn bịa ra một vạch xuất phát.
  - Khoảnh khắc **không dựng cảnh 3D**. Trang chủ đã giữ một WebGL context cho lớp nền; mở context
    thứ hai đúng lúc máy vừa chạy xong 25 phút là cách nhanh nhất để iOS thu hồi cả hai.
- **Ảnh hưởng**: `createRecoverableLazy` được bổ sung `preload()` — đo bằng máy cho thấy nếu không
  có nó, gói mã của màn phần thưởng chỉ **bắt đầu tải SAU khi khoảnh khắc kết thúc**, tức là ta vừa
  đẩy nó lùi 3,2 giây so với trước. Nay hai việc chạy song song (đo được: gói phần thưởng bắt đầu
  tải ở mốc 326 ms, xong trước khi khoảnh khắc hết). Store, engine game, cân bằng: không đổi.
- **Điều kiện xem lại**: nếu Đàm thấy 3,2 giây là dài (vặn `MOMENT_MS`); nếu sau này có nhu cầu cho
  khoảnh khắc dựng cảnh 3D thật (phải đo lại việc thu hồi context trên iPhone TRƯỚC); hoặc nếu xuất
  hiện một màn hình thứ ba cũng muốn chen vào chuỗi này — lúc đó `RewardSequence` nên thành một
  danh sách các chặng có thứ tự, chứ không phải thêm một `if` nữa.

---

## ADR-009 — Thành Phố là một Ô CỬA SỔ: đồng hồ quyết độ sáng cảnh, theme chỉ quyết cái khung — và sắc kỷ trộn trong RGB, không xoay góc màu

- **Ngày**: 2026-08-12
- **Bối cảnh**: Đàm yêu cầu quét đủ 15 kỷ × 6 chặng ngày rồi "đánh bóng mọi thứ lên". Bản quét 180
  cảnh (90 ô × 2 theme) phơi ra 6 lỗi mỹ thuật mà **soi từng ảnh rời chưa bao giờ bắt được**, dù
  chúng đã chạy trên production nhiều ngày.
- **Vấn đề**: hai câu hỏi kiến trúc, không phải hai con số cần chỉnh.
  1. `isDark` đang trả lời HAI câu hỏi khác nhau bằng một biến: *"giao diện đang dùng bảng màu
     nào?"* và *"ngoài trời có tối không?"*. Hệ quả: để theme tối thì giữa trưa cảnh cũng tối như
     nửa đêm — cả 15 kỷ ở cột 12 giờ đều là một mảng đen kịt.
  2. Sắc riêng của kỷ (góc màu chạy khắp vòng tròn màu) đang được pha vào các sắc NEO của vật liệu
     bằng cách **nội suy góc màu**. Đây là lần thứ TƯ cái bẫy này cắn dự án, ở vai màu thứ tư.
- **Phương án đã cân nhắc — câu hỏi (1)**:
  1. Thêm trường `skyLightness` vào từng chặng trong `DAYLIGHT_PROFILES` (chính là "Recommended
     Solution" đã ghi sẵn ở `TECH_DEBT #11`).
  2. Bỏ hẳn ảnh hưởng của theme lên cảnh 3D, luôn dùng bảng màu sáng.
  3. Đổi Ý NGHĨA của `isDark`: có `daylight` ⇒ **đồng hồ quyết**; không có ⇒ vẫn theo theme.
- **Lý do loại bỏ (1)**: nó chữa đúng cái triệu chứng đã ghi trong sổ nợ (bầu trời) và bỏ sót mặt
  đất, tường, mái — vốn cùng một gốc. Vá xong sẽ vẫn còn một thành phố tối om dưới một bầu trời
  sáng, tức là tệ hơn cả trước khi vá.
- **Lý do loại bỏ (2)**: mất luôn cảnh đêm ở theme sáng — tức là mất phần lớn giá trị của Phase 3D
  với người để theme sáng, đúng cái lỗi đối xứng mà ta đang đi sửa.
- **Giải pháp chọn — (3), và nguyên tắc đứng sau nó**: *thành phố là một Ô CỬA SỔ.* Cảnh nhìn qua
  cửa sổ không tối đi vì ta sơn tường phòng màu đen. **Theme quyết định cái KHUNG** (nền thẻ, viền,
  lớp tối góc, lớp phủ giữ chữ đọc được ở trang chủ — tất cả giữ nguyên); **đồng hồ quyết định độ
  sáng BÊN TRONG khung**. Nhánh "không có `daylight`" giữ nguyên hành vi cũ, nên bảo tàng và mọi
  màn hình cũ không đổi một byte nào.
- **Phương án đã cân nhắc — câu hỏi (2)**:
  1. Sửa số cho từng kỷ bị hỏng (6 kỷ mái tím, 7 kỷ đất cỏ).
  2. Kẹp góc lệch của sắc kỷ vào một dải hẹp quanh sắc neo (`clamp`).
  3. Trộn trong RGB thay vì nội suy góc màu.
- **Lý do loại bỏ (1)**: đã làm ba lần rồi, và lỗi mọc lại ở vai màu thứ tư. Nó cũng sẽ mọc lại ở
  kỷ thứ 16 hoặc ở vai màu tiếp theo ai đó thêm vào.
- **Lý do loại bỏ (2)**: đo thử thì 4 kỷ (5, 8, 11, 15) đều đụng trần kẹp và ra **cùng một màu mái**
  — tức là chữa được màu xấu bằng cách xoá mất bản sắc của 4 kỷ.
- **Giải pháp chọn — (3)**: một phép pha duy nhất (`blend`) cho cả bảng màu. Đường thẳng nối hai màu
  trong RGB luôn cắt qua vùng trung tính — đúng cách người vẽ pha bột màu, và cũng đúng cách các
  hoạ sĩ Phục Hưng pha màu bổ túc. Không có khái niệm "hướng đi" nên không có gì để lật; không đầu
  vào nào đẻ ra được màu tím.
- **Trade-off**:
  - Người để theme tối nay thấy một thành phố SÁNG trong thẻ vào ban ngày. Đây là cái giá có chủ ý,
    và nó đúng với ẩn dụ ô cửa sổ; nếu Đàm thấy chói thì nút vặn nằm ở lớp phủ/độ mờ của KHUNG, chứ
    không phải quay lại làm tối cả cảnh.
  - Trộn RGB **tự bạc màu** ở giữa: kỷ có sắc đối lập với sắc neo sẽ ra màu TRẦM hơn hẳn kỷ có sắc
    gần. Nghe như mất mát, nhưng đo lại đủ 15 kỷ thì đó chính là thứ cho ra 15 sắc mái phân biệt
    được (đất nung, ngói đỏ, vàng đất, đồng xanh, xám tía, mận chín, rượu vang) mà không sắc nào
    rơi ra ngoài dải vật liệu có thật. `mixHue` vẫn giữ lại và vẫn đúng cho hai góc màu GẦN nhau.
- **Ảnh hưởng**: đóng `TECH_DEBT #11`. `DAYLIGHT_PROFILES` thêm `horizonHue`/`horizonPull` (đỉnh
  trời và chân trời có đích riêng — đỉnh luôn lạnh, chân luôn giữ hơi ấm trừ ban đêm). 5 bài test
  mới, **tất cả đã xác minh ĐỎ trên code cũ** trước khi nhận.
- **Điều kiện xem lại**: nếu Đàm phản hồi rằng thành phố sáng quá trong theme tối ban ngày; hoặc
  nếu thêm chặng ngày mới / kỷ thứ 16 mà bảng quét lộ ra sắc lạ.

---

## ADR-008 — Thành Phố: tách KHUNG màn hình khỏi BỘ VẼ, và giữ bộ vẽ 2D làm nền vĩnh viễn (không phải bản nháp)

- **Ngày**: 2026-08-12
- **Bối cảnh**: sau khi bộ vẽ 2D isometric (SVG) chạy được, Đàm duyệt kế hoạch thay nó bằng 3D thật
  (three.js) cộng lớp thời gian/cảm giác. Câu hỏi đặt ra ngay trước khi commit bản 2D: **có nên
  commit nó không, hay bỏ đi và làm thẳng 3D?**
- **Vấn đề**: WebGL không phải thứ chắc chắn có. Máy có thể không hỗ trợ WebGL2, trình duyệt có thể
  **mất context giữa chừng** (`webglcontextlost` — hay xảy ra trên iOS khi máy thiếu bộ nhớ), người
  dùng có thể tự chọn tắt 3D để tiết kiệm pin, và bản thân cổng hiệu năng của Phase 3A có thể
  TRƯỢT. Trong mọi tình huống đó màn hình Thành Phố vẫn phải hiện ra được một cái gì đó.
- **Phương án đã cân nhắc**:
  1. **Vứt bản 2D**, làm thẳng 3D; nếu 3D hỏng thì hiện thông báo lỗi.
  2. **Giữ bản 2D nhưng coi là code tạm**, sau này 3D chạy tốt thì xoá.
  3. **Giữ bản 2D làm chế độ ngang hàng vĩnh viễn**, và tách kiến trúc thành KHUNG (`CityViewShell`)
     + BỘ VẼ (`render2d/`, sau này `render3d/`) để hai bộ vẽ thay nhau mà khung không đổi.
- **Lý do loại bỏ phương án (1)**: biến một sự cố tạm thời của trình duyệt thành một màn hình chết.
  Tệ hơn, nó đặt toàn bộ giá trị của 4 Phase trước vào tay một cổng hiệu năng chưa đo — trượt cổng
  là mất trắng.
- **Lý do loại bỏ phương án (2)**: "code tạm rồi xoá" chỉ đúng khi có ngày xoá thật. Ở đây đường lui
  là **yêu cầu vận hành thường trực**, không phải giai đoạn chuyển tiếp — gọi nó là tạm sẽ khiến
  phiên sau bỏ bê nó, đúng lúc cần nhất thì nó đã mục.
- **Giải pháp được chọn**: phương án (3). `CityViewShell.jsx` giữ thanh chuyển kỷ, tiêu đề, bảng số
  liệu, danh sách công trình và **hai trạng thái rỗng** (thất truyền / bãi đất trống); bộ vẽ được
  truyền vào qua `children`. Khung **không biết** bộ vẽ nào đang chạy, và **bộ vẽ tự quyết định kích
  thước của mình** (SVG cần chiều rộng tối thiểu + cuộn ngang; canvas 3D sẽ cần tỉ lệ cố định) —
  nên khung không phải chứa `if` cho từng chế độ.
- **Trade-off**: (a) thêm một tầng component và một lần truyền props cho thứ hiện chỉ có MỘT bộ vẽ —
  chấp nhận vì bộ vẽ thứ hai đã nằm trong kế hoạch đã duyệt, không phải suy đoán. (b) Hai bộ vẽ
  nghĩa là hai chỗ phải sửa khi ngôn ngữ hình ảnh đổi — giảm nhẹ bằng cách để **bố cục trừu tượng
  dùng chung** (`computeCityLayout` trả ô lưới `(x,y)`, không trả pixel), hai bộ vẽ chỉ khác nhau ở
  bước cuối. (c) Token thiết kế phải tách làm hai: `cityTokens.js` (dùng chung) và
  `render2d/tokens2d.js` (bảng màu `rgba()` + phép chiếu isometric — mẹo compositing chỉ đúng trong
  SVG/CSS, WebGL không dùng lại được).
- **Ảnh hưởng**: `src/components/city/render3d/` sẽ là **nơi DUY NHẤT** được phép `import 'three'` —
  luật này kiểm tra được bằng grep và là thứ giữ cho `src/engine/` tiếp tục test được bằng
  `node --test` (không DOM, không WebGL). Mọi thay đổi ở khung phải giữ nguyên giao kèo "khung cấp
  một ô trống, không áp kích thước".
- **Điều kiện xem xét lại**: nếu cổng hiệu năng Phase 3A trượt và nhánh 3D bị bỏ hẳn, tầng tách này
  trở thành thừa — khi đó có thể gộp `CityViewShell` ngược vào `CityView` (một thao tác nhỏ, không
  mất dữ liệu). Ngược lại, nếu sau nhiều tháng 3D chạy ổn trên MỌI thiết bị Đàm dùng, vẫn **không**
  xoá bộ vẽ 2D — nó là đường lui cho `webglcontextlost`, không phải bản nháp.

---

## ADR-007 — Thành Phố Pixel: toạ độ SUY RA từ id, không lưu vào state; và đặt nhà theo "khu đất cố định" thay vì dò xoắn ốc

- **Ngày**: 2026-08-12
- **Bối cảnh**: xây lớp hình ảnh "Thành Phố Pixel" — mỗi công trình đã xây hiện thành một căn nhà
  trên lưới isometric 12×12. Đàm chọn **mô hình BẢO TÀNG**: qua kỷ mới thì xây thành phố MỚI, thành
  phố cũ được niêm phong để ghé thăm bất cứ lúc nào (có thể là nhiều năm sau).
- **Vấn đề**: cần một cách xác định "căn nhà A đứng ở ô nào". Hai câu hỏi tách biệt: (a) lưu toạ độ
  hay suy ra? (b) khi hai căn nhà rơi vào cùng một ô thì giải quyết thế nào?
- **Phương án đã cân nhắc**:
  1. **Lưu toạ độ** vào state cho từng công trình của từng kỷ.
  2. **Suy ra toạ độ** bằng băm tất định từ chính `bpId`, va chạm thì **dò xoắn ốc** theo danh sách
     `bpId` đã sắp xếp (đề xuất ban đầu của spec).
  3. **Suy ra toạ độ**, nhưng mỗi bản vẽ có **khu đất riêng** suy từ thứ hạng cố định của nó trong
     `BLUEPRINT_CATALOG` của kỷ đó (mỗi kỷ đúng 5 bản vẽ → 5 khu đất rời nhau).
- **Lý do loại bỏ phương án (1)**: thêm ~15–20 KB vào state cho 15 kỷ, đẩy sát trần localStorage
  (`TECH_DEBT #9`, đường ghi persist chưa bắt `QuotaExceededError`), thêm 15 nhánh dữ liệu cho cơ
  chế đồng bộ nguyên-khối (`TECH_DEBT #8`), và quan trọng nhất: mất/hỏng dữ liệu = mất luôn bố cục
  thành phố cũ. Lợi ích duy nhất — kéo thả tự sắp xếp — gần như vô dụng với một thành phố ĐÃ BỊ
  NIÊM PHONG, không ai xây thêm nữa.
- **Lý do loại bỏ phương án (2)**: dò xoắn ốc chỉ giữ được bất biến "bảo tàng bất động" (xây thêm
  nhà mới KHÔNG làm xê dịch nhà cũ) khi KHÔNG có va chạm. Xác suất ít nhất một va chạm với 5 công
  trình trên 144 ô là **~7%** — không hiếm. Khi va chạm xảy ra, một căn nhà xây SAU có thể chiếm ô
  của căn nhà xây TRƯỚC và đẩy nó đi chỗ khác, tức thành phố tự động đậy sau lưng người dùng. Đây
  đúng là rủi ro #5 trong bảng rủi ro của spec, và bất biến này được chính spec gọi là "bất biến
  quan trọng nhất".
- **Giải pháp được chọn**: phương án (3) — suy ra toạ độ, đặt nhà vào khu đất riêng theo thứ hạng
  bản vẽ. Vì các khu đất không giao nhau, hai công trình cùng một kỷ KHÔNG BAO GIỜ tranh nhau một
  ô ⇒ vị trí mỗi căn nhà chỉ phụ thuộc **chính id của nó**, không phụ thuộc việc có bao nhiêu căn
  khác đang đứng cạnh. Bất biến trở thành đúng TUYỆT ĐỐI thay vì đúng ~93%. Chữ ký
  `placeBuilding(bpId, occupiedSet)` giữ nguyên như spec và dò xoắn ốc vẫn còn — nhưng chỉ làm lưới
  an toàn cho id lạ đến từ dữ liệu cloud hỏng, với dữ liệu hợp lệ nó không bao giờ phải chạy.
- **Trade-off**: (a) mất khả năng kéo thả sắp xếp nhà — chấp nhận vì thành phố cũ đã niêm phong;
  nếu sau này Đàm thật sự muốn kéo thả, chỉ cần lưu **phần lệch** so với vị trí mặc định, không
  phải làm lại từ đầu. (b) Bố cục bị ràng buộc vào 5 khu đất cố định nên ít "ngẫu nhiên tự nhiên"
  hơn — bù lại thành phố luôn trải đều, không bao giờ dồn cục một góc. (c) Thêm một phụ thuộc ngầm:
  **thứ tự các phần tử trong `BLUEPRINT_CATALOG[era]` trở thành dữ liệu có ý nghĩa hình ảnh** —
  đảo thứ tự 5 bản vẽ trong một kỷ sẽ làm thành phố kỷ đó đổi bố cục.
- **Ảnh hưởng**: `src/engine/cityLayout.js` không bao giờ được dùng `Math.random`/`Date`; mọi thay
  đổi thuật toán băm/khu đất sẽ **đổi bố cục của MỌI thành phố cũ** — coi như thay đổi phá vỡ tương
  thích về mặt hình ảnh, phải cân nhắc như đổi schema. Test `cityLayout.test.js` khoá cả 3 bất biến
  (tất định · bảo tàng bất động · không phụ thuộc thứ tự đầu vào).
- **Điều kiện xem xét lại**: nếu Đàm yêu cầu kéo thả sắp xếp nhà (→ thêm lớp "phần lệch" lưu riêng,
  giữ nguyên hàm suy ra làm vị trí mặc định), hoặc nếu một kỷ nào đó có số bản vẽ khác 5 (khi ấy
  bảng khu đất phải mở rộng tương ứng).

---

## ADR-006 — Không tách nhỏ `gameStore.js` trong đợt refactor kiến trúc toàn diện

- **Ngày**: 2026-07-12
- **Bối cảnh**: Đàm yêu cầu refactor kiến trúc toàn dự án theo 10 nguyên tắc rõ ràng, trong đó có
  điều khoản riêng cho "God File": nếu buộc phải sửa `gameStore.js`/`StatsDashboard.jsx` thì phải
  tách các phần logic độc lập ra ngoài (helper thuần, hàm định dạng...) ở mức rủi ro thấp, nhưng
  KHÔNG bắt buộc tách hẳn store/component thành nhiều phần ngay trong đợt này.
- **Vấn đề**: `gameStore.js` dài ~6.000 dòng, có ~78 action, một action (`completeFocusSession`)
  dài ~760 dòng đọc/ghi hàng chục slice state trong một lệnh `set()`. Đây là "God File" kinh điển.
- **Phương án đã cân nhắc**:
  1. Tách toàn bộ thành nhiều slice Zustand riêng (streak/mission/achievement/crafting/prestige...).
  2. Chỉ rút các hàm/logic thuần độc lập ra `src/engine/`/file riêng, giữ nguyên cấu trúc store.
  3. Không đụng gì tới `gameStore.js` trong đợt này.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì tách một store có ~78 action liên kết chặt chẽ
  (một action đọc/ghi hàng chục slice) mà KHÔNG có bộ test hành vi đầy đủ bao phủ trước sẽ tạo rủi
  ro "tính sai điểm/XP/streak âm thầm, không crash" — loại lỗi nguy hiểm nhất vì không tự lộ ra;
  đợt refactor này ưu tiên "không đổi hành vi" tuyệt đối, không phù hợp để đánh cược rủi ro lớn.
  (3) bị loại vì bỏ qua yêu cầu rõ ràng của Đàm về xử lý God File khi động vào khu vực liên quan
  (đã phải sửa `StatsDashboard.jsx` trong đợt này để xoá dead code, nên "không đụng gì" không khả thi).
- **Giải pháp được chọn**: phương án (2) — rút `statsFormatters.js` (11 hàm định dạng thuần + test)
  khỏi `StatsDashboard.jsx`; giữ nguyên cấu trúc `gameStore.js`.
- **Trade-off**: file vẫn khó đọc/khó onboard cho một AI/người mới; đổi lại rủi ro giới thiệu bug
  âm thầm gần như bằng 0 vì không đổi luồng logic nào.
- **Ảnh hưởng**: `gameStore.js` vẫn là "God File" — bất kỳ ai sửa nó phải đọc kỹ trước, đặc biệt
  action `completeFocusSession`. Xem `TECH_DEBT.md` mục tương ứng.
- **Điều kiện xem xét lại**: khi `completeFocusSession` tiếp tục phình to (dấu hiệu cụ thể: vượt
  ~900-1000 dòng, hoặc thêm 1 hệ thống gameplay lớn mới cần cắm vào đúng điểm này) — và CHỈ khi có
  kế hoạch viết thêm test hành vi bao phủ đầy đủ TRƯỚC khi tách, không tách "cho gọn" suông.

---

## ADR-005 — Cấu trúc `api/_lib/` + `api/_tests/` với tiền tố gạch dưới

- **Ngày**: 2026-07-11
- **Bối cảnh**: Vercel gói Hobby giới hạn 12 Serverless Functions/deploy. Thêm `api/keepalive.js`
  (cron giữ Supabase không tự pause) khiến deploy FAIL: "No more than 12 Serverless Functions...".
- **Vấn đề gốc**: Vercel (chế độ build "Other"/không framework cho `api/`) coi MỌI file `.js` nằm
  TRỰC TIẾP trong `api/` (đệ quy) là 1 Serverless Function riêng — kể cả file test — TRỪ file/thư
  mục có tên bắt đầu bằng `_`. Lúc đó có 5 file `*.test.js` nằm lẫn trong `api/`/`api/push/` bị
  tính oan vào trần 12.
- **Phương án đã cân nhắc**:
  1. `.vercelignore` loại trừ `*.test.js` theo tên/pattern (vá nhanh).
  2. Chuyển toàn bộ test của `api/` vào `api/_tests/` (mirror cấu trúc `api/`), dùng đúng quy ước
     underscore-prefix Vercel đã tôn trọng sẵn cho `api/_lib/`.
  3. Xoá bớt function (gộp nhiều route thành 1 file dùng router nội bộ) để có dư chỗ.
- **Lý do loại bỏ từng phương án**: (1) bị Đàm BÁC BỎ có chủ đích — đây là vá THEO TÊN FILE, nghĩa
  là phải nhớ cập nhật blacklist mỗi khi thêm loại file test mới (`.spec.js`, `.mock.js`...), một
  gánh nặng bảo trì vĩnh viễn thay vì fix gốc; (3) bị loại vì làm giảm khả năng đọc/tách bạch từng
  route, và không giải quyết được vấn đề gốc (Vercel vẫn đếm sai file test nếu lỡ đặt nhầm chỗ).
- **Giải pháp được chọn**: phương án (2) — cấu trúc này AN TOÀN VĨNH VIỄN vì không phụ thuộc tên
  file cụ thể: dù sau này thêm hàng trăm file test bất kỳ tên gì đặt ĐÚNG trong `api/_tests/` cũng
  không bao giờ bị tính vào trần 12. `.vercelignore` vẫn giữ làm lớp phòng thủ THỨ HAI (mở rộng
  thêm các đuôi file phụ trợ khác) phòng khi lỡ tay đặt nhầm file vào thẳng `api/`.
- **Trade-off**: không có — đây là giải pháp thuần lợi so với phương án vá tạm.
- **Ảnh hưởng**: mọi test API mới BẮT BUỘC đặt trong `api/_tests/` (mirror đường dẫn file đang
  test), không đặt cạnh route handler nữa. `package.json` test glob phải trỏ đúng thư mục này.
- **Bài học đi kèm** (xem thêm `TECH_DEBT.md`/lịch sử sự cố): một lần build fail do vượt trần này
  (`api/coach-digest.js`, commit `8ee264d` ngày 2026-06-25) từng khiến Vercel ÂM THẦM giữ nguyên
  bản deploy CŨ suốt ~2 tuần rưỡi mà không ai để ý — một tính năng "hoàn tất" trên giấy tờ chưa hề
  chạy thật trên production. Từ đó có quy tắc: LUÔN xác nhận tab Deployments trên Vercel dashboard
  hiện "Ready" sau mỗi lần push.
- **Điều kiện xem xét lại**: nếu Vercel đổi chính sách đếm function (không còn áp dụng quy ước
  underscore-prefix), hoặc nếu dự án nâng cấp lên gói trả phí có trần function cao hơn nhiều (khi
  đó áp lực tổ chức theo trần 12 không còn, nhưng cấu trúc `_lib`/`_tests` vẫn nên giữ vì bản thân
  nó là một quy ước tổ chức tốt, độc lập với lý do Vercel).

---

## ADR-004 — "First Action Wins": đồng bộ đa thiết bị dựa trên version phía server, không phải timestamp máy khách

- **Ngày**: 2026-07-11
- **Bối cảnh**: App chạy trên nhiều thiết bị (Mac laptop + iPhone) có thể mở CÙNG LÚC, cùng ghi
  dữ liệu vào 1 dòng Supabase (`game_state`).
- **Vấn đề**: cơ chế cũ ghi `updated_at` bằng đồng hồ CỦA CHÍNH THIẾT BỊ khi đẩy dữ liệu lên —
  máy nào đẩy TỚI ĐÍCH sau cùng thắng, bất kể ai thao tác trước. Đây là lỗ hổng THIẾT KẾ (không
  phải bug cụ thể): bất cứ lúc nào 2 thiết bị mở gần đồng thời đều CÓ THỂ mất dữ liệu do "ăn may
  ai ghi cuối". Đã thực sự gây mất 1 phiên tập trung thật (25 phút, +26 XP) không thể phục hồi.
- **Phương án đã cân nhắc**:
  1. Giữ nguyên so sánh timestamp client, chỉ thêm cảnh báo UI khi phát hiện xung đột.
  2. Khoá optimistic-lock qua cột `version` tăng bởi TRIGGER PHÍA SERVER (compare-and-swap).
  3. Khoá bi quan (pessimistic lock) — một thiết bị phải "xin khoá" trước khi ghi.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì timestamp client KHÔNG đáng tin — lệch đồng hồ
  giữa thiết bị, và quan trọng hơn, không có khái niệm "thứ tự thao tác THẬT" được cả 2 bên đồng
  thuận — chỉ thêm cảnh báo không giải quyết được gốc rễ mất dữ liệu; (3) bị loại vì phức tạp hoá
  quá mức cho một app 1-người-dùng (cần xử lý khoá hết hạn, deadlock, UX xin/nhả khoá) trong khi
  lợi ích không hơn nhiều so với (2).
- **Giải pháp được chọn**: phương án (2) — cột `version` (integer) trên `game_state`, tăng bởi
  trigger Postgres (`supabase/game_state_version.sql`), KHÔNG phụ thuộc đồng hồ máy khách nào.
  Mọi lần ghi từ `syncService.js` kèm điều kiện `.eq('version', expectedVersion)`; ghi bị từ chối
  (0 dòng khớp) → thiết bị đó THUA, buộc `pullFromCloud()` nhận lại bản đã thắng, TUYỆT ĐỐI không
  được ép ghi đè. Gỡ guard cũ dựa trên `timerSession.isRunning` (không còn cần — version mạnh hơn
  suy đoán qua trạng thái).
- **Trade-off**: bên thua LUÔN mất mọi thay đổi cục bộ chưa kịp đồng bộ (không có hợp nhất từng
  phần/CRDT) — chấp nhận được vì đơn giản và đáng tin hơn nhiều so với một cơ chế hợp nhất phức
  tạp dễ có lỗi tinh vi hơn chính vấn đề nó giải quyết.
- **Ảnh hưởng**: MỌI ghi vào `game_state` phải qua `syncService.js`, không được viết tắt trực tiếp
  ở bất kỳ đâu khác trong code.
- **Điều kiện xem xét lại**: về nguyên tắc có thể thay bằng CRDT/hợp nhất từng trường nếu tương lai
  dự án cần nhiều người dùng thao tác đồng thời phức tạp hơn — nhưng với app 1-người-dùng hiện tại,
  KHÔNG có lý do chính đáng để thay đổi. **Bất kỳ đề xuất "đơn giản hoá" nào quay lại so sánh
  timestamp client đều phải bị từ chối ngay** — đó chính xác là lỗ hổng đã gây sự cố thật.

---

## ADR-003 — AI Coach: chỉ dùng Gemini đám mây, gỡ hẳn Qwen on-device (WebLLM)

- **Ngày**: 2026-06-24 (quyết định cuối, sau một giai đoạn trung gian "Gemini chính + Qwen dự phòng")
- **Bối cảnh**: AI Coach ban đầu (2026-06-20) chạy 100% miễn phí bằng Qwen2.5 (chốt bản 3B tham
  số) tải và chạy ngay trên máy qua WebGPU (thư viện WebLLM) — không tốn phí API.
- **Vấn đề**: model 3B chất lượng phân tích kém, hay "trôi" sang tiếng Trung, và quan trọng nhất —
  **hoàn toàn không chạy được trên iPhone** (không có WebGPU), trong khi người dùng chính lại chủ
  yếu dùng điện thoại.
- **Phương án đã cân nhắc**:
  1. Nâng cấp lên Qwen2.5-7B (thử qua một đợt, rồi rút lui).
  2. Gemini làm CHÍNH + Qwen làm dự phòng khi mất mạng/hết quota (thử qua giai đoạn trung gian).
  3. Gemini là DUY NHẤT, gỡ hẳn Qwen/WebLLM.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì 7B nặng máy hơn nhiều (~4.5GB tải, ~5GB VRAM)
  mà vẫn không giải quyết được vấn đề cốt lõi là không chạy được trên iPhone; (2) bị loại sau khi
  thử vì duy trì 2 pipeline AI song song (đám mây + on-device) làm tăng độ phức tạp bảo trì đáng kể
  (2 bộ decode config, 2 luồng lỗi, 2 UI trạng thái) trong khi Gemini đã đủ ổn định để không cần
  dự phòng on-device nữa.
- **Giải pháp được chọn**: phương án (3) — xoá hẳn `webllmEngine.js`, dependency `@mlc-ai/web-llm`,
  toàn bộ code nhánh fallback on-device. Giữ nguyên "bộ não" model-agnostic (prompt + lưới chống-
  bịa + tầng số liệu) — chỉ thay cổng gọi model.
- **Trade-off chấp nhận**: mất khả năng hoạt động khi mất mạng/hết quota Gemini/chưa cấu hình key
  (Coach NGỪNG hẳn, không còn lưới dự phòng chạy tại chỗ); dữ liệu số liệu (không phải dữ liệu cá
  nhân nhạy cảm dạng văn bản tự do) rời khỏi máy lên server Google.
- **Ảnh hưởng**: giảm kích thước app đáng kể (không còn tải model ~2.4GB); AI Coach giờ CHẠY ĐƯỢC
  TRÊN CẢ IPHONE — đây là lợi ích chính biện minh cho trade-off.
- **Điều kiện xem xét lại**: nếu Gemini đổi chính sách giá/ngừng free tier đột ngột theo hướng bất
  lợi, hoặc nếu tương lai có một model on-device đủ nhỏ+đủ tốt+chạy được cả trên iPhone (hiện chưa
  có công nghệ này ở thời điểm quyết định). Kiến trúc model-agnostic (prompt/guard tách khỏi cổng
  gọi model) được thiết kế có chủ đích để đổi nhà cung cấp AI trong tương lai chỉ cần thay 1 file
  (`cloudEngine.js`), không cần viết lại "bộ não".

---

## ADR-002 — Lưới chống-bịa AI Coach: "cứu câu/cứu dòng" thay vì huỷ toàn bộ câu trả lời

- **Ngày**: 2026-06-24 (qua nhiều vòng tinh chỉnh, 2026-06-22 → 2026-06-24)
- **Bối cảnh**: Lưới chống-bịa số (`findFabricatedNumbers` và tương tự) phát hiện AI viết ra một
  con số không có trong bảng dữ liệu thật.
- **Vấn đề**: phiên bản đầu tiên của lưới, khi phát hiện MỘT con số bịa, sẽ huỷ TOÀN BỘ câu trả
  lời (hoặc rơi về một câu fallback chung chung) — lãng phí phần lớn nội dung ĐÚNG chỉ vì một chi
  tiết sai.
- **Phương án đã cân nhắc**:
  1. Giữ nguyên "nuke toàn bộ" khi phát hiện bịa (đơn giản nhất).
  2. Viết lại MÙ (yêu cầu model thử lại từ đầu, không nói rõ cái gì sai).
  3. Viết-lại-CÓ-HƯỚNG-DẪN (chỉ đích danh số bịa) + nếu vẫn còn bịa, cắt riêng câu/dòng chứa nó
     ("cứu câu/cứu dòng"), giữ nguyên phần còn lại sạch.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì trải nghiệm tệ — người dùng mất toàn bộ phân
  tích chỉ vì 1 con số sai trong 10 câu đúng; (2) thử qua nhưng kém hiệu quả hơn vì model không
  biết chính xác cần sửa gì, dễ tiếp tục bịa ở lượt thử lại.
- **Giải pháp được chọn**: phương án (3) — hai lớp: (a) lượt thử lại đầu tiên LUÔN chỉ đích danh
  số bị coi là bịa (`buildCorrectionNote`), không phải yêu cầu chung chung; (b) nếu vẫn còn bịa sau
  thử lại, cắt bỏ RIÊNG câu (`stripFabricatedSentences`, chế độ hội thoại) hoặc dòng
  (`scrubFabricatedLines`, chế độ báo cáo 4 phần — giữ khung cấu trúc, phần rỗng → "chưa đủ dữ
  liệu"), giữ lại phần còn lại vẫn sạch.
- **Trade-off**: phức tạp hơn về code (nhiều bước xử lý hơn "nuke" đơn giản); đổi lại giữ được
  nhiều giá trị thật hơn cho người dùng mỗi lần guard phải can thiệp.
- **Ảnh hưởng**: mọi lối vào Coach (Chat/Offline/Nudge) dùng chung pipeline này qua
  `guardedGenerate.js`.
- **Điều kiện xem xét lại**: không có kế hoạch đảo ngược — đây là kết quả của nhiều lần tinh chỉnh
  thực nghiệm, đã ổn định. Chỉ nên xem lại nếu bộ chấm điểm `eval.test.js` (BẮT %/BÁO NHẦM %) cho
  thấy chiến lược "cứu câu/cứu dòng" đang tạo ra câu văn cụt/khó hiểu quá mức trong thực tế sử dụng.

---

## ADR-001 — Không gộp `buildAchievementSnapshot` (real-time) và `buildAchievementSnapshotForReplay` (lịch sử)

- **Ngày**: không rõ ngày chính xác thiết lập ban đầu (trước 2026-07-12) — được TÁI XÁC NHẬN và
  ghi chép rõ trong đợt refactor 2026-07-12 khi rà soát toàn bộ trùng lặp code.
- **Bối cảnh**: hai hàm tính "ảnh chụp số liệu" (snapshot) trông giống nhau đến mức dễ bị đề xuất
  gộp lại trong bất kỳ đợt dọn dẹp trùng lặp nào.
- **Vấn đề**: `buildAchievementSnapshot` (gameStore.js) tính lại TỪ ĐẦU mỗi lần gọi — chấp nhận
  được vì chỉ chạy 1 lần/phiên hoàn thành (tần suất thấp). `buildAchievementSnapshotForReplay`
  (achievementTimeline.js) dùng thuật toán TÍCH LUỸ-GIA-TĂNG để phát lại TOÀN BỘ lịch sử một lần
  (suy luận ngày mở khoá cũ) — cần O(n), không thể chấp nhận O(n²) nếu phải tính lại từ đầu ở mỗi
  bước phát lại.
- **Phương án đã cân nhắc**:
  1. Gộp thành một hàm duy nhất, tham số hoá chế độ "tính từ đầu" vs "tích luỹ".
  2. Giữ 2 hàm riêng biệt, đồng bộ bằng kỷ luật comment cảnh báo tréo nhau.
- **Lý do loại bỏ phương án (1)**: buộc phải chọn MỘT đặc tính hiệu năng, gây hại cho trường hợp
  còn lại — nếu ép real-time dùng thuật toán tích luỹ, phải luồn một accumulator xuyên suốt toàn bộ
  `completeFocusSession` (thay đổi kiến trúc lớn cho lợi ích nhỏ); nếu ép replay dùng "tính từ đầu
  mỗi bước", một người dùng có hàng nghìn phiên sẽ có replay chậm rõ rệt (O(n²)).
- **Giải pháp được chọn**: phương án (2) — giữ 2 hàm tách biệt, mỗi file có một comment tiếng Việt
  cảnh báo TRỎ CHÉO sang file kia, yêu cầu tường minh: "Đổi field ở đây thì kiểm tra luôn bên kia
  kẻo lệch."
- **Trade-off**: rủi ro 2 hàm lệch nhau theo thời gian nếu ai đó thêm trường snapshot mới ở một
  nơi mà quên nơi kia — rủi ro này được giảm nhẹ (không loại bỏ hoàn toàn) bằng kỷ luật comment,
  KHÔNG có test/type tự động enforce việc này.
- **Ảnh hưởng**: bất kỳ achievement mới nào đọc một trường snapshot mới phải được thêm vào CẢ HAI
  hàm, nếu không thành tích đó sẽ mở khoá đúng real-time nhưng KHÔNG BAO GIỜ suy luận được ngày mở
  khoá hồi tố cho các save cũ.
- **Điều kiện xem xét lại**: nếu trong tương lai có bằng chứng cụ thể 2 hàm đã lệch nhau NHIỀU lần
  do lỗi con người quên đồng bộ, cân nhắc đầu tư một test tự động đối chiếu field-parity giữa 2
  hàm (không phải gộp hàm — chỉ enforce tự động rằng chúng luôn cùng field), hoặc một schema chung
  mô tả field bắt buộc để cả 2 hàm cùng implement.

---

## Ghi chú vận hành cho ADR log này

- Không backfill NGÀY một cách suy đoán — nếu không chắc chắn ngày chính xác, ghi rõ "không rõ
  ngày chính xác" thay vì bịa một ngày cụ thể. Nguyên tắc này nhất quán với triết lý chống-bịa số
  của chính AI Coach (xem `ARCHITECTURE.md` mục 3) — áp dụng cho cả tài liệu, không chỉ cho AI.
- Không phải mọi thay đổi đều xứng đáng một ADR — chỉ ghi quyết định có: (a) nhiều phương án thật
  sự được cân nhắc, (b) trade-off thật (không phải "chỉ có 1 cách làm đúng"), (c) ảnh hưởng lâu
  dài tới cách code được viết sau này. Một lần sửa bug thông thường không cần ADR — ghi vào
  `CHANGELOG.md`/`BAN_GIAO.md` là đủ.
