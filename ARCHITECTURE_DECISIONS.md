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
     Loại: thứ mắt đọc được ở cỡ 14 px không phải màu mà là **hình bóng ĐANG ĐỔI** — một khối cứng
     đứng yên thì đọc ra "một cái cột", bất kể sơn màu gì.
  2. **Mỗi bộ phận một `Mesh` riêng, xoay bằng `Object3D` cha-con.** Đúng cách three thường làm và
     rẻ về mặt trí óc. Loại: 28 người × 9 bộ phận = **252 lệnh vẽ**, gấp 25 lần cả thành phố hiện
     tại (10 lệnh). Vi phạm thẳng ràng buộc Đàm đặt.
  3. **Skinning / GLTF / animation clip.** Loại thẳng: Đàm cấm, và nó kéo theo một thư viện, một
     định dạng tệp, một ống dẫn tài sản — cho một nhân vật cao 14 px.
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
  đủ cho quay người/vung tay ngang; đây là lựa chọn có chủ đích ở cỡ 14 px, không phải thiếu sót.
  (b) Tam giác cư dân **672 → 3.024** (+350%), tức **4,57% tổng cảnh** (trần Đàm đặt: 6%) nhưng
  **13,8% riêng phần thành phố** — hai con số trả lời hai câu khác nhau, phải đọc đúng câu (bài học
  Performance Gate vòng 2). (c) Số lệnh vẽ **GIẢM 11 → 10**: hai `InstancedMesh` (thân + đầu) gộp
  làm một. (d) Trên iPhone cư dân chỉ cao **3,3–5,1 px**, đầu người **1 px** — mọi thứ dựng ở đây
  **không đọc được trên điện thoại**; Đàm đã chọn nhắm riêng MacBook Air M3 và điều đó được ghi
  thẳng vào mã để phiên sau không đọc sự im lặng thành "vậy cũng ổn".
- **Ảnh hưởng (đo được)**: trên khung 3D thật **990×614** của Đàm, cư dân kỷ 1 cao **14,4 px** (trung
  vị; 16,9 px với người gần camera nhất) — đủ để đọc **hình bóng đang đổi**, không đủ để đọc "kia là
  cánh tay". Dáng đi làm hình bóng đổi **1,8 px trên bề rộng 9,5 px (19%)** theo phép chiếu, và
  **0,83× → 1,80× tỉ lệ rộng/cao** theo phép đo trên ẢNH THẬT 1500 px có ghép cặp từng cư dân; cả
  hai đều kèm ĐỐI CHỨNG là mô hình 2 hộp cũ (ra **0,0064 px** và **1,0000 ± 0,00%**). Kỷ 1 khác
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

## ADR-050 — Chiều quay tam giác là một LUẬT CỦA HỆ, phải bịt ở CÁI CỬA DUY NHẤT; và một bài test đo VỊ TRÍ thì mù hoàn toàn với ĐỘ HIỂN THỊ

**Ngày**: 2026-08-21 · **Phase 14 §1(1)** · **Trạng thái**: đã áp dụng

### Bối cảnh
Đàm nhìn kỷ 1 và kỷ 2 rồi nói: *«Giờ tự dưng cái đường có nét đứt trông giả tạo kinh khủng»*. Chữ
«tự dưng» chỉ thẳng vào một hồi quy, nên việc đầu tiên là **BISECT chứ không phải đoán nguyên
nhân**. Dựng cùng một cảnh ở `main` (`d72c033`) và ở HEAD (`c50e727`): **nét đứt y hệt nhau ở cả
hai**. VIỆC B không gây ra nó — vùng phụ cận chỉ làm nó DỄ THẤY hơn, vì trước đó mắt không có gì
liền mạch bên cạnh để mà so.

Rồi bốn giả thuyết lần lượt bị chính số đo bác bỏ: **(a)** *"lưới ô đường thiếu ô"* — đếm ra
**80/144 ô đúng trên trục đường, 88 cặp kề nhau, 0 khe**; **(b)** *"hình học dựng ra bị hở"* —
rasterise hình học đã phát vào không gian ô ở 6 mẫu/ô cho ra một mạng `#` **liền tuyệt đối**;
**(c)** *"tấm đất chôn mất mặt đường"* — hiệu số cao độ đất − đường là **−0,0140 ở cả p25, trung vị
và p75**, đúng bằng `ROAD_LIFT`; **(d)** *"z-fighting do độ chính xác bộ đệm sâu"* — nhân `ROAD_LIFT`
lên **10 lần** rồi dựng lại, **ảnh không đổi một chút nào**.

Thứ trả lời được là một phép đo về một đại lượng chưa ai từng hỏi: **CHIỀU QUAY**. Đếm ra
**13,9–34,4% tam giác mặt đường được xếp theo chiều quay ÚP**, và `FrontSide` (mặc định của three)
vứt sạch chúng. Phân loại tiếp thì chúng nằm gọn ở **cánh tay TÂY và cánh tay NAM** của lòng đường,
không sót một tam giác nào ở lớp vỉa hè / bó vỉa / vạch kẻ.

### Vấn đề
Luật *"tấm nằm ngang phải ngửa mặt lên trời"* đã được phát biểu ở **SÁU** chỗ gọi — mọi lời
`quad(...)` của vỉa hè và vạch kẻ đều bọc `Math.min`/`Math.max` để ép góc sau lớn hơn góc trước —
và bị **quên ở chỗ thứ bảy**: hàm `dai()` dựng bốn cánh tay của lòng đường, nơi cánh TÂY chạy từ
`-cu` **xuống** `-0,5` và cánh NAM chạy theo trục `v` (trục có dấu ngược trong mặt phẳng `x–z`).

### Phương án cân nhắc
1. **Đảo dấu tại bốn chỗ gọi `dai()`** — nhỏ nhất, hiển ngôn nhất. **LOẠI**: nó là lần thứ BẢY
   phát biểu lại cùng một luật, tức đúng cái đã đẻ ra khuyết tật này. Cánh tay thứ năm viết sau này
   sẽ quên lần thứ tám (bài học Phase 11: *"bịt mười lăm chỗ thì chỗ thứ mười sáu sẽ quên"*).
2. **Bắt `dai()` tự chuẩn hoá `from`/`to`** — chữa được cánh TÂY nhưng **không chữa được cánh NAM**,
   vì cánh NAM đúng thứ tự mà vẫn ngược chiều: nguyên nhân của nó nằm ở phép đổi trục `u,v → x,z`,
   không nằm ở thứ tự tham số. Một bản vá đúng một nửa là loại nguy hiểm nhất — nó làm con số tụt
   đủ nhiều để trông như đã xong.
3. **Đặt `side: DoubleSide` cho vật liệu mặt đường** — làm nét đứt biến mất ngay. **LOẠI**: nó không
   sửa gì cả, nó chỉ TẮT phép kiểm; và nó nhân đôi số mảnh phải tô cho mọi tam giác mặt đường, kể
   cả những tam giác đang đúng. Mua một hình ảnh đúng bằng cách bỏ một lưới an toàn.
4. ✅ **`quad4` tự sửa chiều quay** — cái cửa DUY NHẤT mà mọi tấm nằm ngang của mạng đường đi qua
   (`quad` uỷ quyền cho nó; `dai` gọi thẳng nó). Một luật, một công thức, một chỗ.

### Giải pháp chọn
`quad4` tính **diện tích có dấu (shoelace)** của tứ giác trong mặt phẳng `(u, v)`; hệ toạ độ thế
giới là `x = toWorld(u)`, `z = toWorld(v)` với `y` hướng lên, nên **mặt ngửa ⇔ diện tích ÂM**.
Dương thì đổi chỗ `p1` với `p3` — đường chéo `p0–p2` giữ nguyên nên **vẫn đúng hai tam giác ấy**,
chỉ quay ngược lại. Bằng 0 ⇒ tấm suy biến, để nguyên (đằng nào cũng vô hình).

### Trade-off
Đây là **ẩn** thay vì **hiển ngôn**, tức đi ngược nguyên tắc *Explicit over Implicit*. Chấp nhận,
vì luật này không phải một lựa chọn mỹ thuật mà là một **ràng buộc vật lý của bộ tô hình**: không
tồn tại chỗ gọi nào muốn một mặt đường úp xuống. Khi một luật đúng cho 100% trường hợp thì đặt nó ở
cửa vào rẻ hơn và an toàn hơn là nhắc lại ở từng chỗ gọi. Sáu lời `Math.min`/`Math.max` cũ được
giữ nguyên: chúng nay là thừa nhưng vô hại, và chúng vẫn nói đúng ý định của hình chữ nhật.

### Ảnh hưởng
* **Diện tích mặt đường nhìn thấy được: 80,8% → 100,0%** trên tổng 15 kỷ (đo bằng tổng diện tích
  tam giác NGỬA chiếu xuống mặt phẳng, `/tmp/probe-area.mjs`, thuần Node). Hai kỷ Đàm kêu chính là
  hai kỷ TỆ NHẤT bảng: **kỷ 1 = 65,8%** và **kỷ 2 = 71,5%**.
* **Hình học KHÔNG đổi một chữ số**: cột tổng diện tích trùng tới ba chữ số thập phân ở cả 15 kỷ
  (25,078 · 36,214 · … · 59,487), số tam giác trùng từng đơn vị (kỷ 1: 81.066 · kỷ 2: 94.698), số
  lệnh vẽ trùng (11 · 14). Bản vá chỉ đổi THỨ TỰ ba đỉnh.
* Ảnh `--width 1500` kỷ 1 và kỷ 2: **2,3%** và **2,7%** điểm ảnh đổi quá ngưỡng mắt, lệch trung
  bình chỗ đã đổi **86,90** và **43,50** — tức đổi ít chỗ nhưng đổi rất mạnh ở đúng những chỗ ấy.

### Điều kiện xem lại
Thêm một lớp mới vào mạng đường (làn xe đạp, đảo giao thông, gờ giảm tốc…) thì **không phải làm
gì** — nó đi qua `quad4` là tự đúng. Nhưng nếu có ngày phải dựng một mặt **THẲNG ĐỨNG** khác ngoài
`curbFace`, phải nhớ `quad4` chỉ đúng cho tấm NẰM NGANG: nó chuẩn hoá theo mặt phẳng `(u, v)`, mà
một mặt đứng thì diện tích chiếu xuống mặt phẳng ấy bằng 0.

---

## ADR-049 — Vùng phụ cận của đô thị là một NGỮ PHÁP RIÊNG, không phải một mật độ cảnh vật cao hơn

**Ngày**: 2026-08-21 · **Phase 13 VIỆC B** · **Trạng thái**: đã áp dụng

### Bối cảnh
VIỆC 1 lấp cái vành đất trống quanh thành phố bằng cây/bụi/đá (`outskirts.js`). Nó CHẠY THẬT và đo
được: kỷ 12 đi từ 64,82% đất trống xuống 38,61%. Rồi Đàm nhìn lại và **vẫn nói thành phố nhỏ**.

Đó là dữ liệu, không phải ý kiến. Và nó bác bỏ chính giả thuyết đã dẫn tới VIỆC 1 (*"chỗ trống làm
thành phố trông nhỏ"*). Phép đo (G1) chỉ ra vì sao: **0/446 dấu vết con người nằm ngoài lưới
12×12**, trong khi tấm đất rộng gấp ~2,5 lần lưới ⇒ **60,1% mặt đất không có một dấu vết người
nào**. Cây cối lấp được CHỖ TRỐNG nhưng không mang **tín hiệu quy mô**: một cánh rừng vô tận quanh
một cụm nhà làm cụm nhà ấy trông CÔ LẬP hơn, không lớn hơn.

### Vấn đề
Làm đô thị đọc ra "rộng hơn, quy mô hơn" mà không được (a) đổi `CITY_GRID_SIZE`, (b) đổi
`massScale`, (c) thu tấm đất hay siết khung hình, (d) tăng mật độ thực vật.

### Phương án cân nhắc
1. **Nâng `EDGE_DENSITY`/`FAR_DENSITY`** — rẻ nhất. **LOẠI**: đã làm một lần và thất bại; và (G1)
   phân loại theo BẢN CHẤT nên con số sẽ đứng yên đúng như nó phải thế.
2. **Lưới 12 → 16** — **LOẠI bằng số**: camera buộc cứng `distance = gridSize × factor` nên chỉ số
   đi LÙI 4,21 đpt. Tự triệt tiêu.
3. **Nhân `massScale`** — **LOẠI bằng số**: lùi 1,03 đpt và làm `TECH_DEBT #24` xấu đi (1,88 → 1,92).
4. **Mở 40 ô chết trong khu 3×3 kỳ quan** — **HOÃN**: đo ra 225/225 công trình tràn khỏi ô neo
   (kỷ 6 tệ nhất 1,271 ô) ⇒ khu ấy giữ chỗ cho HÌNH CHIẾU chứ không giữ một ô; số ô thật sự giải
   phóng được chỉ 12,2/kỷ, không phải 40.
5. **Dựng vùng phụ cận** — **CHỌN**.

### Giải pháp
Khuôn ba lớp, lần thứ **TÁM** (`vernacularRoof` · `undergrowth` · `streetStyle` · `groundFloor` ·
`floraStyle` · `settingStyle` · `hinterlandStyle`):

    eraStyle.country ─┐
                      ├─→ hinterlandStyle (BẢNG 15 dòng) ─→ hinterland.js (HÌNH) ─→ sceneGraph (ĐỌC)
    settingStyle.water ┘

Chín trục, mỗi trục MỘT việc: hình thái ruộng · công trình nước · tường bao · đường rời khung ·
xóm vệ tinh (số cụm × cỡ cụm) · bến cảng · hạ tầng riêng kỷ.

### Trade-off đã chấp nhận
- **+1 lệnh vẽ ở 4/15 kỷ** (5 · 7 · 8 · 9), toàn bộ từ họ vật liệu `water` (bến/cầu). Luật cũ
  *"không thêm một lệnh vẽ nào"* đã bị Đàm **thu hồi** ở §0 (M3 dư 3,2 lần); `MOC_LENH_VE` nay là
  một **CÁI CÂN**, không phải một **CÁI CỔNG**.
- Trần hộp bao cảnh 20,12 → 20,92. **Tầm với KHÔNG đổi** (`HINTERLAND_REACH` = `OUTSKIRT_REACH` = 8);
  thứ lớn lên là BỀ RỘNG khối.

### Ảnh hưởng
- Hai file mới ở `src/engine/city3d/` (bảng 534 dòng · hình 978 dòng) + 4 file test mới/đã mở rộng.
- `sceneGraph.js` thêm MỘT vòng lặp đọc, không thêm nhánh nào khác. `outskirts.js` không đổi.
- Vùng phụ cận **KHÔNG vào `blockers`** của camera cận cảnh — cùng một cớ với vùng quê: nó đứng
  ngoài lưới, trên thứ địa hình mà bộ hoạch định đường bay không biết tới (`TECH_DEBT #54`).
- Mở `TECH_DEBT #74`: vùng phụ cận là tầng ĐỊA LÝ nên nó không lớn lên theo số phiên.

### Điều kiện xem lại
Nếu một phase sau đổi `CITY_GRID_SIZE`, hoặc nếu Đàm nói vùng phụ cận làm khung hình rối, hoặc khi
`TECH_DEBT #14`/`#74` được chốt (lúc ấy câu hỏi *"quy mô là quà tặng hay phần thưởng"* mới có đáp
án, và nó có thể đảo phần "tầng địa lý" của quyết định này).

---

## ADR-048 — Nhớ lại giá trị nút lưới nhiễu: vá một hồi quy hiệu năng do ADR-046, **không đổi một con số nào**

**Ngày**: 2026-08-21

**Bối cảnh.** ADR-046 cho `horizon.heightAt` đọc thẳng `terrain.nenKho(...)` để hai tấm khớp nhau
**theo cấu tạo** thay vì khớp nhờ một hằng số chép hai nơi. Quyết định ấy đúng và giữ nguyên. Nhưng
ngay sau khi ship `19305ab`, mấy việc đo chạy nền trả về một con số không ai chờ: `sceneStats.test.js`
đi từ **564 lên 827 giây**, và một lượt dựng cảnh đủ 15 kỷ đi từ **40,9 lên 69,3 giây**. Không có
cổng nào đỏ — không có cổng nào canh thời gian dựng cảnh cả (mở `TECH_DEBT #70`).

**Vấn đề.** `horizon.heightAt` chạy ở **mỗi đỉnh** của lưới chân trời — lưới lớn nhất cảnh. Mỗi lần
gọi `nenKho` kéo theo `dongBangKho` (2 lần `valueNoise`) + `beRongHoa` (1 lần) + `smoothHeightAt`,
mà **một** `valueNoise` gọi `latticeValue` **4 lần**, mỗi lần dựng chuỗi `t|seed|ix|iy` (~20 ký tự)
rồi băm FNV-1a chạy hết chuỗi ấy. Cái giá ấy vốn đã có sẵn từ lâu; ADR-046 chỉ làm nó lộ ra.

**Phương án đã cân nhắc.**

*(a) Chặn sớm trong `nenKho` khi hệ số hoà đúng bằng 1* — **ĐÃ THỬ, ĐÃ ĐO, ĐÃ BỎ.** Lý lẽ nghe rất
xuôi (ra ngoài vùng hoà thì `smoothHeightAt` không còn ảnh hưởng gì, tính làm gì). Đo thật:
**67,51 → 66,80 giây, đúng 1%**. Và tôi đã kịp viết cho nó một chú thích khẳng định nó tiết kiệm
"34,1 giây" — một câu bị chính số đo của nó bác bỏ. Ship một chú thích như vậy là đúng cái bẫy
*"một câu tự trấn an cũng phải được kiểm như một con số"*, nên bản vá bị hoàn tác nguyên vẹn.

*(b) Đổi `hashId` sang một phép băm số nguyên thuần (nhanh hơn nhiều lần)* — **BÁC.** Nó đổi mọi
giá trị nhiễu ⇒ cả 15 vùng đất đổi hình vĩnh viễn. Đó không phải một quyết định hiệu năng, đó là
một quyết định mỹ thuật, và nó phải được ra như một quyết định mỹ thuật.

*(c) Lùi ADR-046, cho `horizon` tự tính lấy nền* — **BÁC.** Quay lại đúng cái "hai bảng chép nhau"
mà ADR-046 sinh ra để gỡ, và mua tốc độ bằng cách trả lại một đường viền ở chỗ giáp.

*(d)* **ĐÃ CHỌN — nhớ lại giá trị của từng nút lưới nhiễu.** Nó không đụng tới công thức, nên nó
không thể đổi kết quả; nó chỉ thôi tính lại cùng một thứ.

**Giải pháp.** `latticeValue` (`src/engine/city3d/noise.js`) tra một `Map` hai tầng (hạt giống → nút)
trước khi băm. Đo lại, ba cây mã chạy **TUẦN TỰ** trên cùng một máy:

| phần (dựng lưới đủ 15 kỷ) | TRƯỚC ADR-046 (`dfd2b15`) | SAU ADR-046 (`19305ab`) | có bộ nhớ đệm |
|---|---:|---:|---:|
| lưới chân trời | 33,52 giây | 66,41 giây | **20,18 giây** |
| lưới mặt đất | 2,26 giây | 3,02 giây | **1,30 giây** |

Tức không chỉ trả lại chỗ ADR-046 đã tiêu mà còn **nhanh hơn cả trước ADR-046 1,66 lần**.

**Chứng minh KHÔNG đổi một con số nào.** Băm MD5 ở một `git worktree` sạch tại `19305ab` và ở cây
làm việc, rồi so hai bên: **trùng từng byte, 15/15 kỷ**. ⚠️ Và phép so ấy phải phủ **MỌI** người
dùng `valueNoise`, không chỉ chỗ dễ nghĩ tới nhất — lượt đầu tôi mới băm hai lưới địa hình rồi suýt
gọi đó là xong, trong khi `outskirts.js` (rải cảnh vật vùng quê) và `setting.js` (`insetAt` /
`blendAt` / `depthAt` — dấu chân mặt nước) cũng gọi thẳng vào đó. Nên có hai lượt băm:

| băm cái gì | phủ tới | kết quả |
|---|---|---|
| mọi thuộc tính Float32 + mảng chỉ số của **lưới mặt đất** và **lưới chân trời** | `terrain.js`, `horizon.js`, `terrainMesh.js` | 15/15 kỷ trùng |
| đầu ra `deriveOutskirts()` + 12.201 mẫu dày `insetAt`/`blendAt`/`depthAt` | `outskirts.js`, `setting.js` | 15/15 kỷ trùng |

Cả hai lượt đều kèm **đối chứng**: bơm một sai lệch vào đúng công thức nhiễu (`ix===3 && iy===3 →
0,5`) rồi đòi `diff` phải kêu — nó kêu (14/15 dòng đổi ở lượt thứ hai). Không có vế ấy thì "hai file
giống hệt nhau" cũng là thứ một phép so ĐANG HỎNG in ra.

**Trade-off.** Bộ nhớ. Một lượt quét đủ 15 kỷ ghi **21.343 nút / 112 hạt giống**. Hai cái gác, và
chúng trả lời **hai câu khác nhau** — đây là phần dễ gộp nhầm nhất của bản vá:

- `BIEN_NHO = 4096` trả lời *"có gói được (ix, iy) vào MỘT số nguyên mà không đụng nhau không?"*.
  Khoá là `(ix + BO) × HANG + (iy + BO)` với **`HANG = BO × 2`** — viết theo `BO` chứ không viết cứng
  8192, vì đó là một QUAN HỆ. Biên THẬT đo được là **ix, iy ∈ [−21, 27]** với **0 lần rơi ra ngoài**,
  tức cái gác đang rộng gấp ~150 lần. Rộng như thế là cố ý: **ra ngoài biên KHÔNG SAI, chỉ CHẬM** —
  nhánh ngoài tính đúng cùng công thức, chỉ là không nhớ lại. Một cổng NHANH-CHẬM được phép rộng
  tay theo một luật khác hẳn một cổng ĐÚNG-SAI (đối chiếu: bài học "ngưỡng nới rộng cho chắc là một
  cái phễu" ở Phase 9A — luật ấy áp cho cổng đúng-sai, không áp cho cổng này).
- `TRAN_NUT = 200.000` (≈ 9,4 lần số đo thật) mới là cái gác BỘ NHỚ thật — `BIEN_NHO` thì không, vì
  trong biên ±4096 vẫn còn 67 triệu ô. Chạm trần thì **thôi ghi, vẫn trả đúng giá trị**, và kêu MỘT
  lần qua `console.warn`.

**Ảnh hưởng.** `src/engine/city3d/noise.js` (bộ nhớ đệm + `thongKeNho()` + xuất `BIEN_NHO`,
`TRAN_NUT`) · **mới** `src/engine/city3d/noise.test.js` (8 bài, **cả 8 đã thử-cho-đỏ**) ·
`PERFORMANCE.md` · `TECH_DEBT.md` (#70). Không đụng một dòng nào của `terrain.js` / `horizon.js`.

**Hai bài học rút ra trong lúc làm, đáng giữ hơn cả bản vá.**

1. ⚠️ **Một bất biến ĐÚNG THEO CẤU TẠO thì không phải một cái gác — nó chỉ TRÔNG GIỐNG một cái gác.**
   Bản đầu của `thongKeNho()` trả thêm `daGhi` (biến đếm số lần ghi) cạnh `nut` (đếm lại từ chính
   các `Map`), kèm `assert.equal(nut, daGhi)` với lý lẽ rất chặt: *"hai đường đo độc lập, lệch nhau
   nghĩa là đụng khoá"*. Phép thử ngược cho thấy câu ấy **không bao giờ có thể đỏ**: `if (co !==
   undefined) return co;` làm một khoá BỊ ĐỤNG trông y hệt một lần TRÚNG bộ nhớ, nên lần ghi thứ hai
   không bao giờ xảy ra và biến đếm không bao giờ đếm thừa. Đã gỡ cả `daGhi` lẫn câu assert ấy —
   việc bắt đụng khoá nay do hai bài test làm THẬT (phép đếm số nút bắt được ca "khoá cộng thay vì
   nhân"; bài "song ánh khoá" hỏi thẳng ở hai góc đối của biên, bắt được ca `HANG` bị hạ còn `BO`).
   Cùng họ với "một bài test chưa từng thấy đỏ thì chưa phải test", nhưng ở một biến thể khó thấy
   hơn: ở đây không phải *chưa* đỏ, mà là **không thể** đỏ, và lý do nằm ở một dòng cách đó vài dòng.
2. ⚠️ **Một phép đo và một lần sửa mã không được chồng lấn nhau về thời gian — và một phép đo THỜI
   GIAN thì cũng không được chồng lấn với một phép đo thời gian khác.** Ba lượt đo đầu tiên của phiên
   này chạy song song trên một máy 4 nhân, tức ba bên giành CPU của nhau và không con số nào so được
   với con số nào. Đã dừng, chạy lại tuần tự. (Vế thứ nhất của luật này đã có từ 2026-08-18; đây là
   vế thứ hai của nó.)

**Điều kiện xem lại.** (a) Nếu một phase sau lấy mẫu nhiễu ở ô rất mịn hoặc trên một vùng rất rộng,
`console.warn` chạm trần sẽ kêu — lúc ấy hỏi *"vùng lấy mẫu có cần rộng đến thế không"* TRƯỚC khi
nâng `TRAN_NUT`. (b) Nếu có ngày cần đổi chính công thức nhiễu, mọi con số của bảng trên vô giá trị
và phải đo lại — nhưng quan trọng hơn: **phải dựng lại phép so byte-identity trước**, vì lúc ấy nó
sẽ đỏ, và nó đỏ ĐÚNG.

---

## ADR-046 — Cái bệ KHÔNG phải một cái BẬC, nó là một **KIỂU PHÂN BỐ ĐỘ DỐC**; và ba nguồn sinh ra nó đều là những **hằng số được chọn ĐỂ LÀM RA nó**

**Ngày**: 2026-08-21

**Bối cảnh.** Từ Phase 8C, mặt đất là một mặt liên tục và mọi phép đo "có gián đoạn không" đều
xanh. Đàm vẫn bác, ba vòng liên tiếp, và vòng cuối bác cả 15 kỷ: *"VẪN CÒN CÁI BỆ, Ở TẤT CẢ 15
KỶ."* Anh cũng chỉ ra rằng chỉ thị trước đó của chính cố vấn — *"trong lưới thành phố thì thoải,
ngoài lưới mới gồ ghề"* — **chính là định nghĩa của một cái bệ**: *"Không phải thực thi sai; chỉ
thị sai."* Phát biểu lại cho đúng: **địa hình là MỘT mặt liên tục; thành phố NẰM TRÊN một phần đất
vốn đã bằng hơn, và ranh giới của vùng bằng ấy TUYỆT ĐỐI KHÔNG được trùng ranh giới lưới 12×12.**

**Vấn đề.** Phép đo đang hỏi sai câu. *"Một cái bệ KHÔNG cần một bậc để đọc ra là bệ"* — bậc là
**gián đoạn**, bệ là một **kiểu phân bố độ dốc**: phẳng ở giữa, dốc gấp ở một vành, phẳng lại ở
ngoài. Mọi phép đo cũ đi tìm gián đoạn nên chúng **về mặt cấu trúc không thể thấy** thứ Đàm thấy
(cùng họ bài học Phase 9B). Đo lại bằng đại lượng đúng (`scripts/plateau-score.mjs`: vành đồng tâm
bước 0,5 ô; **chỉ số bệ = dốc lớn nhất vành 6–9 ÷ dốc trung bình vành 0–5** — một QUAN HỆ, không
phải một mức): **10/15 kỷ ≥ 5**, tệ nhất kỷ 14 = **26,98**, và **cả 15 kỷ nhảy trong đúng dải
bán kính 7,25–8,75** — tức bước nhảy do LƯỚI quyết định chứ không do địa hình.

**Phương án đã cân nhắc.**
- *(a) Nới ngưỡng / chấp nhận.* Bác — ba vòng con số đã xanh trong khi mắt vẫn thấy sai; nới là
  đúng cái phễu Phase 9A.
- *(b) Làm gợn sóng mạnh hơn ở vùng ngoài.* Bác — nó bồi thêm cho dải đang khoẻ mà không chạm vào
  ba nguồn thật; và bài học 2026-08-20 đã dạy đúng chuyện ấy (tách con số gộp ra từng dải trước
  khi sửa theo một chẩn đoán).
- *(c) Bỏ hẳn cao độ, làm đất phẳng.* Bác — Đàm ra ràng buộc rõ: *"mục tiêu là xoá cái BỆ, không
  phải xoá quả ĐỒI"*.
- *(d) ĐÃ CHỌN — sửa cả ba hằng số sinh ra cái bệ, và biến bề rộng vùng bằng thành một đại lượng
  THẤT THƯỜNG theo hướng.*

**Giải pháp.** Ba nguồn, ba bản vá, và cả ba đều là *"một hằng số được chọn ĐỂ LÀM RA cái bệ"*:
1. **Vùng bằng quá hẹp** — `APRON_CELLS` 2,6 → **7,5**, và nhân thêm `APRON_SPREAD = 0,62` bằng
   một tầng nhiễu **RẤT thô** (cỡ ô 9, gần bằng cả cạnh lưới) ⇒ bề rộng thật **2,85 … 12,15 ô**
   tuỳ hướng. Nới rộng thôi thì chưa đủ: mép vẫn là một đường cách đều mép lưới, tức vẫn là hình
   vuông bo góc, chỉ to hơn. Nhiễu MỊN cũng vô dụng — nó chỉ làm răng cưa một đường tròn mà mắt
   vẫn đọc ra đường tròn ấy.
2. **`APRON_DROP` là một cái bậc được KHAI BÁO** — 0,62 → **0,18**. Con số cũ được chọn để *"đủ để
   đọc ra thành phố nằm trên cao"*. Đặt cạnh sự thật: `terrainMaxHeight` của **11/15 kỷ nhỏ hơn
   0,62** (kỷ 11 chỉ 0,14) ⇒ cái vành quanh thành phố cao gấp **4,4 lần** toàn bộ địa hình bên
   trong. Không có ngọn đồi nào — chỉ có một mặt bàn. Không về 0 được vì mặt nước
   (`WATER_SURFACE_Y = −APRON_DROP − WATER_DROP_BELOW_PLAIN`) phải nằm dưới mọi đất khô kể cả ô
   thấp nhất của lưới.
3. **`settle`-về-phẳng tại `APRON_EDGE`** — **XOÁ HẲN**. Nó ép mọi kỷ về **cùng một mặt phẳng ở
   cùng một bán kính**, tạo ra một vành **phẳng tuyệt đối rộng 5,7 ô** (từ 8,9 ra tới chân núi).
   *Một mặt bàn đứng giữa một sàn nhà* — và không phép đo gián đoạn nào thấy được, vì **cả hai bên
   đều phẳng**. Hằng số đổi tên `APRON_EDGE` → **`PLATE_PAD_CELLS`** vì cái tên cũ đã thành một
   lời nói dối (nó hứa một sự phẳng không còn tồn tại); giá trị giữ 3,4 để `terrainSurfaceReach`
   không đổi (9,5) — đổi nó là đổi ngân sách tam giác, một khoản tiền khác phải đo riêng.

Cộng thêm hai thứ đi kèm, đều là hệ quả bắt buộc chứ không phải trang trí:
- **`nenRoll` thành BÃO HOÀ KHÔNG ĐỐI XỨNG** (`bienDoRollLen = bienDoRollNgoai + APRON_DROP`).
  Cái trần 0,21 tồn tại vì đúng MỘT lý do: đất khô không được chui xuống dưới mặt nước — lý do ấy
  **chỉ nói về chiều XUỐNG**. Áp nó cho cả chiều LÊN là bẫy Phase 7D ở dạng ngược, và chính cái
  kẹp thừa ấy giữ cho đồng bằng vĩnh viễn nằm dưới nền phố. Nay phân bố của đồng bằng đối xứng
  quanh **nền phố** ⇒ có những chỗ đồng bằng **CAO HƠN** thành phố. Đó là phát biểu bằng số của
  câu *"thành phố NẰM TRONG đồng bằng, không NGỒI TRÊN nó"*.
- **`horizon.heightAt` đọc thẳng `terrain.nenKho(...)`** làm nền rồi mới cộng núi. Lời hứa thật
  của Phase 9A (hai cái nêm sáng ở chỗ giáp) đòi **hai tấm KHỚP NHAU**, chứ không đòi cả hai phải
  bằng một hằng số — nay chúng khớp **theo cấu tạo**, ở mọi hướng, mà không bên nào phải phẳng.

**Trade-off.**
- Vùng bằng rộng gấp gần ba lần ⇒ mắt phải đi xa hơn mới gặp đồi. Chấp nhận: đó đúng là *"đồng
  bằng rộng gấp nhiều lần cái làng nằm trên nó"* mà Đàm mô tả.
- Đồng bằng nay có chỗ cao hơn nền phố ⇒ ở vài hướng, sống đất gần che bớt bờ nước xa. Cái giá này
  đã có tên và đã được đo từ trước: `TECH_DEBT #59` (bề rộng nước) — **KHÔNG** hạ cổng 5% để mua
  lại một con số đẹp (ADR-025 cấm đúng điều đó).
- `nenKho` được hỏi cho **TỪNG ĐỈNH của cả hai tấm lưới** (hàng chục nghìn lần mỗi lần dựng cảnh),
  nên hai biến của triền thoát nước phải hoisted ra ngoài vòng lấy mẫu. Ngân sách hình học **không
  đổi một đơn vị** — cùng số đỉnh, cùng số lệnh vẽ, cùng số vật liệu, cùng số nguồn sáng.

**Ảnh hưởng.** `src/engine/city3d/terrain.js` (4 hằng số + `nenKho`/`dongBangKho`/`beRongHoa`
thay `surfaceHeightAt` cũ) · `src/engine/city3d/horizon.js` (nền đọc từ `terrain`) ·
`src/components/city/render3d/terrainMesh.js` (thứ tự tầng màu, xem ADR-047) ·
`src/components/city/render3d/sceneGraph.js` (tên hằng số). ADR-007 **nguyên vẹn**: trong lưới,
`nenKho` trả về **y hệt** `smoothHeightAt` — không đổi một chữ số, nên nhà cũ không nhích một phân.

**Điều kiện xem lại.** Nếu một phase sau thêm thứ gì phủ lên vùng ngoài lưới (ruộng, làng vệ tinh,
đường liên tỉnh) thì phải chạy lại `plateau-score.mjs` TRƯỚC — thứ mới ấy có thể dựng lại một vành
đồng tâm mới ở một bán kính mới, và triệu chứng sẽ y hệt cái bệ này.

---

## ADR-047 — Một phép hoà màu đặt SAI THỨ TỰ trong một chồng tầng: nó không sai về công thức, nó chỉ **xoá hai tầng nằm sau nó**

**Ngày**: 2026-08-21

**Bối cảnh.** Sau khi ADR-046 xoá cái bệ về mặt HÌNH HỌC, mắt vẫn đọc ra một **đường viền vuông
sắc lẹm** chạy quanh thành phố ở cả 15 kỷ — trên màn hình nó hiện thành một hình thoi, vì camera
nhìn chéo. Ba giả thuyết đầu đều bị chính số đo bác bỏ, và ghi lại đây vì *một bản vá đúng-về-lý-lẽ
mà không đổi được gì thì nó vừa loại trừ giúp ta một nghi phạm*: (1) số hạng đỉnh chói của `lift`
— đo ra ≤ **8,8**/255, dưới ngưỡng mắt 12; (2) bóng đổ — chạy `--no-shadow` thì hình thoi **vẫn
nguyên**; (3) pháp tuyến hai tấm lệch nhau — kỷ 15 chênh Lambert tối đa **3,9**/255.

**Vấn đề.** `groundColorAt` có ba tầng (nền theo cao độ → vết loang → sườn dốc lộ đất) và **một
phép hoà** ra màu của vùng đất bao quanh. Phép hoà ấy đứng **CUỐI**. Tại rìa tấm đất thành phố hệ
số hoà đúng bằng **1**, nên nó **xoá sạch** tầng 2 và tầng 3 — trong khi tấm chân trời ngay bên
cạnh vẫn còn đủ cả hai. Đo trên chính tầng màu thuần: bước màu ngang qua chỗ giáp có **trung vị
20,0–36,4 và p99 59,9–74,3** trên thang RGB/255 ở **cả 15 kỷ** — gấp 2–6 lần ngưỡng mắt 12. Độ tản
màu tại rìa: **đúng 0** (một dải màu chết) so với **47,6–55,6** sau bản vá.

**Phương án đã cân nhắc.** *(a)* Giảm cường độ phép hoà — bác, nó chỉ làm đường viền nhạt đi chứ
không xoá, và làm hỏng luôn việc hoà màu vốn đúng. *(b)* Cho tấm chân trời bỏ vân ở vành trong để
"khớp" — bác, đó là mua sự khớp nhau bằng cách làm hỏng cả hai. *(c)* **ĐÃ CHỌN — chuyển phép hoà
lên nằm giữa tầng 1 và tầng 2**, để vết loang và sườn lộ đất được áp SAU khi màu nền đã hoà xong.

**Giải pháp.** Đổi thứ tự: tầng 1 → **hoà ra `outerRgb`** → tầng 2 → tầng 3. Trong lưới
(`outside` = 0) kết quả **không đổi một chữ số**. Kết quả đo lại: bước màu qua chỗ giáp trên ảnh
dựng thật (kỷ 15) **26,8 → ~6** (tối đa 4,4); tại các đỉnh mà hai tấm dùng chung, chênh màu còn
**0,1–2,4**/255.

**Trade-off.** Vết loang nay nhân vào một màu đã nhạt hơn ⇒ vùng đất xa tối đi khoảng **0,01–0,02**
(vì `Math.min(1, c × m)` chỉ kẹp phía sáng). Đủ nhỏ để dưới ngưỡng mắt, nhưng **đủ lớn để làm rơi
phép tự-kiểm hình học của `sweep-score.mjs`**, thứ khi ấy đang được viết thành một MỨC tuyệt đối
với biên vỏn vẹn **0,010** = đúng một đơn vị làm tròn. Xem mục "Ảnh hưởng".

**Ảnh hưởng.** `src/components/city/render3d/terrainMesh.js` (thứ tự tầng) · bài test mới
*"RÌA TẤM ĐẤT PHẢI KHỚP TẤM CHÂN TRỜI VỀ MÀU — và phải còn VÂN khi ra tới rìa"* (hỏi tại các đỉnh
hai tấm **dùng chung**, cộng một vế đối chứng đòi độ tản màu ở rìa phải còn ít nhất một nửa so với
trong lòng — không có vế ấy thì "khớp màu" đạt được bằng cách làm cả hai tấm chết như nhau) ·
`scripts/sweep-score.mjs`: phép tự-kiểm đổi từ **MỨC** (`dL > nL + 0,15`) sang **QUAN HỆ**
(`dL > nL × 1,6`), ngưỡng lấy từ hai đầu ĐO ĐƯỢC (tỉ số nền thật **1,93 … 2,45**), kèm một **đối
chứng bắt buộc**: lấy mẫu lệch nửa hàng thì cổng PHẢI kêu, không kêu thì tự thoát lỗi.

**Điều kiện xem lại.** Mọi lần thêm một tầng màu mới vào `groundColorAt`, hỏi trước: *"tầng này
nằm trước hay sau phép hoà ra vùng ngoài, và ở rìa thì hệ số hoà bằng bao nhiêu?"* — hệ số bằng 1
nghĩa là mọi thứ nằm sau nó **không tồn tại** ở rìa.

---

## ADR-045 — Địa hình: nhiễu phải **BẺ CONG** level set chứ không **CỘNG** vào cao độ; và mỗi kỷ phải khai một **HƯỚNG THẤP** để nền thành phố có lý do phẳng

- **Ngày**: 2026-08-20 (§1(B) của chương trình "QUY MÔ TRƯỚC, HIỆU ỨNG SAU")
- **Bối cảnh**: Đàm nhìn ảnh thu nhỏ và nói mặt đất *"lòi lõm"*, *"như tấm chăn nhàu"* — và nói rõ
  đây là một trong **hai** khiếu nại tách bạch, không phải một: (B) độ cao gợn ngẫu nhiên, (A) thành
  phố quá nhỏ so với thế giới. Anh cũng chốt thứ tự: *"Tô bóng đẹp lên một bố cục sai thì được một
  bố cục sai được tô bóng đẹp"* ⇒ hiệu ứng (§3) phải đợi (A) và (B). Yêu cầu cụ thể cho (B):
  *"Nền thành phố phải BẰNG hoặc gần bằng… Độ chênh trong lưới nên nhỏ và **có hướng** (dốc đều về
  phía nước), không phải gợn ngẫu nhiên. Địa hình **ngoài lưới** mới được gồ ghề, và phải gồ ghề
  **CÓ HƯỚNG**. Giữ ADR-007. Đừng xoá thềm bậc ở chỗ nó đúng (thị trấn trên đồi); xoá chỗ nó vô nghĩa."*
- **Vấn đề đo được TRƯỚC khi sửa** (mốc nền `9c7032c`, công cụ `scripts/terrain-score.mjs` chép
  sang cả hai kho và `md5sum` khớp trước khi đo):
  - chênh cao **trong lưới 12×12** tệ nhất **2,70 đơn vị** (kỷ 5) — cao hơn cả một căn nhà;
  - bậc giữa **hai ô KỀ NHAU** lớn nhất **1,15** (kỷ 7) ⇒ dốc **172%**, gấp 5 lần Baldwin Street;
  - **đổi chiều cao dọc một đường cắt: 36,7 lần** trung bình trên 24 đường cắt. Chính con số này là
    định nghĩa của chữ *"nhàu"* mà Đàm dùng — một quả đồi thật đổi chiều 1–2 lần, không phải 36;
  - **R² hướng 0,174** — chỉ 17% biên độ cao độ giải thích được bằng một mặt phẳng nghiêng, tức
    đất cao thấp gần như **không có lý do**. (Cột "khớp KHUÔN" thì bản nền **không trả lời được**:
    nó chưa export `geometricTemplate`, nên không có cách nào tách hình khỏi nhiễu ở đó. Công cụ in
    ra `—` chứ **không** dựng lại công thức của bản nền — làm thế là tự tạo công thức thứ hai cho
    một luật, đúng bẫy đã cắn nhiều lần. Sau bản vá: **0,776** và **11/14 kỷ** đọc ra được hình
    mình khai.)
  - Nguyên nhân gốc: nhiễu được **CỘNG THẲNG vào cao độ** (`h = hình + nhiễu`). Phép cộng ấy **cắt
    vụn level set** — mỗi bướu nhiễu đẻ ra một cực trị cục bộ mới, nên một sườn dốc đều biến thành
    một dãy gợn. Và **không kỷ nào khai hướng dốc**, nên chẳng có lý do hình học nào để chỗ này cao
    hơn chỗ kia; cái "hướng" duy nhất là hướng của hạt nhiễu.
- **Phương án đã cân nhắc**:
  1. **Hạ biên độ nhiễu xuống thật thấp** (giữ nguyên phép cộng). Rẻ nhất, một dòng. **Loại**: nó
     làm mất cả gợn LẪN đồi — mà Đàm nói rõ *"đừng xoá thềm bậc ở chỗ nó đúng"*. Hạ nhiễu là mua
     phẳng bằng cách bỏ luôn 15 vùng đất khác nhau, tức trả bằng đúng thứ Phase 7B sinh ra để có.
  2. **Làm mượt trường cao độ sau khi sinh** (lọc trung bình / gaussian). **Loại vì hai lý do độc
     lập**: (a) phép làm mượt **không có điểm bất động duy nhất** nếu quét theo thứ tự ô, tức kết
     quả phụ thuộc thứ tự duyệt ⇒ **phá ADR-007** (cao độ phải tất định); (b) nó vẫn để lại cực trị
     — làm mượt một cái chăn nhàu thì được một cái chăn nhàu mờ, số lần đổi chiều gần như không đổi.
  3. **Ép cả 12×12 ô thành phố về một mặt phẳng tuyệt đối** (nền phẳng lì, đồi bắt đầu ngay ngoài
     mép lưới). Đơn giản, chắc chắn hết nhàu. **Loại**: nó xoá thềm bậc ở **cả 15 kỷ**, kể cả nơi
     thềm bậc là đúng lịch sử (thị trấn trên đồi, Burg Eltz, Lisbon) — lại đúng điều Đàm cấm. Và nó
     tạo một mép đứng nhân tạo đúng ranh giới lưới, làm cái bệ vuông (khiếu nại A) **nặng thêm**.
  4. **Bẻ cong toạ độ LẤY MẪU thay vì cộng vào cao độ** (domain warping) + **mỗi kỷ khai một hướng
     thấp**. Chọn.
- **Giải pháp chọn** — ba thay đổi ăn khớp nhau, tất cả nằm trong `src/engine/city3d/terrain.js`:
  - **(1) Nhiễu BẺ CONG, không CỘNG.** `WARP_CELLS = 1,8`: nhiễu dịch **vị trí lấy mẫu** của trường
    hình học, không dịch giá trị trả về. Level set bị **uốn lượn** chứ không bị **cắt vụn**, nên
    một sườn dốc đều vẫn là một sườn dốc đều — chỉ là mép của nó không còn thẳng như kẻ thước.
    Đây là điểm cốt lõi của ADR này: *cùng một hạt nhiễu, cùng một biên độ, mà một cách dùng đẻ ra
    36,7 lần đổi chiều còn cách kia đẻ ra 15,8.*
  - **(2) Mỗi kỷ khai một `drain` — HƯỚNG THẤP** (`bac`/`nam`/`dong`/`tay`), cộng một trọng số
    `tilt` (0…1) trộn giữa "hình của kỷ" và "triền dốc đều theo hướng ấy". `HUONG_THAP` là bảng bốn
    hàm thuần. Vì sao đây là bảng chứ không phải một con số: một hướng thấp là **một sự thật địa lý
    của thành phố có thật** mà kỷ ấy lấy mẫu (Firenze tụt về thung lũng Arno phía tây; Amsterdam
    đổ ra biển bắc), nên nó phải viết được thành `note` và phải **buộc vào `country`** như mọi bảng
    khác — đây là khuôn ba lớp lần thứ **BẢY** (sau `streetStyle` · `floraStyle` · `groundFloorStyle`
    · `roofStyle` · `vernacularRoof` · `groundCoverStyle`).
  - **(3) Trong lưới thì THOẢI, ngoài lưới mới GỒ GHỀ — và gồ ghề CÓ HƯỚNG.** `relief` hạ mạnh ở
    mọi kỷ; `surfaceHeightAt` đổi từ khoảng cách Chebyshev sang `Math.hypot` (vành ngoài thôi vuông
    góc) và cuộn xuống theo đúng `HUONG_THAP` của kỷ với `OUTER_TILT = 0,55`.
- **Trade-off đã trả**:
  - **Thềm bậc còn sống ở 14/15 kỷ** (kỷ 14 Singapore khai `terraces: 1` — cố ý phẳng), nhưng bậc
    lớn nhất giữa hai ô kề nhau nay **0,45** thay vì 1,15. Tức thềm vẫn đọc ra được mà không còn
    vách đứng.
  - **`rolling` là dạng khó nhất và nó lộ ra một sự thật cấu trúc**: cộng hai trường rồi chuẩn hoá
    min/max + chia bậc đều bề rộng thì phân bố **luôn dồn về giữa** (định lý giới hạn trung tâm thu
    nhỏ). Kỷ 7 vì thế có một bậc nuốt 63% số ô đất. **Không chữa bằng cách nới cổng 60%**, mà chữa
    bằng cách chọn `tilt` theo ĐỊA LÝ (0,26 → 0,44 — Firenze nằm TRONG lòng thung lũng Arno) và hạ
    `relief` 0,80 → 0,55 vì *đồi Toscana vốn thoải*; sau đó cổng 60% **tự hết đỏ** và danh sách
    ngoại lệ `TRUOT` về **rỗng** (trước có kỷ 4). Ngoại lệ `[4]` của ADR-032(b) nay **hết là ngoại
    lệ** — lời khai "đồng bằng" của kỷ 4 vẫn đúng, chỉ là nó không còn cần một chỗ miễn trừ.
  - **Hình học: −176 tam giác (−0,012%) trên 15 kỷ, 0 lệnh vẽ đổi.** Toàn bộ nằm ở **bệ kè** (31 →
    23 bệ) — đất thoải đi thì ít chỗ hụt hơn. Đo bằng hai đường độc lập khớp từng đơn vị ở cả 15 kỷ
    (`scene-tri.mjs` ↔ `plinth-tri.mjs`); xem `PERFORMANCE.md`.
  - **Cái hình chữ nhật (khiếu nại A) KHÔNG được chữa ở đây — và nó KHÔNG phải mép của tấm đất.**
    Đo rồi: tỉ số bệ CHÉO/TRỤC **1,306** (vuông hoàn hảo = 1,414; tròn = 1,000) và cao độ hai bên
    mép khớp **0,0000**, tức không có vách nào cả. Thứ mắt đọc ra là chỗ **mặt lát và nhà cửa dừng
    đột ngột** — đúng chẩn đoán ADR-038, và Đàm đã chọn hướng **LẤP** (không thu nhỏ), `outskirts.js`
    đã làm nửa đầu. Còn nếu sau này thật sự muốn bo tròn cao nguyên (siêu ellipse p = 2,5) mà vẫn
    giữ đủ 144 ô thành phố trên đất phẳng thì cần nửa bề rộng **7,257**, trong khi
    `7,257 + APRON_EDGE 3,4 = 10,66 > terrainSurfaceReach 9,5` — **thiếu 1,16 ô = 12,2% bán kính
    tấm đất**, tức đúng cần gạt đang chờ Đàm ở `TECH_DEBT #53`.
- **⚠️ HAI THỨ CHỈ LỘ RA SAU KHI MỌI CON SỐ ĐÃ XANH — và cả hai đều là bẫy đã có tên trong dự án**:
  - **(a) `country` KHÔNG phải ràng buộc chặt nhất: nước đang chảy LÊN DỐC ở 9/14 kỷ.** `drain` được
    buộc vào `country` — đúng khuôn ba lớp, và vẫn chưa đủ, vì **một đất nước có bốn phía còn một
    dòng sông chỉ có MỘT**. Bảng `settingStyle.side` (nước ở phía nào) đã tồn tại từ trước, nhưng hai
    bảng **chưa bao giờ được đặt cạnh nhau**; đặt cạnh lần đầu thì **9/14 kỷ lệch hoặc NGƯỢC HẲN**
    (kỷ 5 khai đất thấp về tây trong khi suối Elzbach chảy ở đông). Không một bài test nào đỏ. Vá:
    sửa 9 dòng cho khớp + **test khoá hai chiều** (`drain === side` ở 14 kỷ có nước, `kyKho === [1]`)
    — cùng khuôn với hai lần khoá `country` trước (`floraStyle`↔`eraStyle`, `streetStyle`↔`eraStyle`).
    ⚠️ **Cái giá đã trả, và nó phải nói thẳng**: sửa cho ĐÚNG VẬT LÝ làm cổng "thấy nước" TỆ ĐI ở hai
    kỷ (kỷ 4 5,11% → 4,95%; kỷ 5 5,54% → 3,51%), vì đất thoải xuống phía nước ⇒ **bờ XA tụt xuống,
    khuất sau sống đất gần**. Hai cách "chữa" đều bị bác: **hạ cổng 5%** là cái phễu Phase 9A;
    **quay `drain` về giá trị sai** là mua một con số bằng cách nói dối địa lý (ADR-025 đã cấm với
    mặt đường). Danh sách miễn trừ `[6,7,10]` → `[4,5,6,7,10]`, ghi ở `TECH_DEBT #59`.
  - **(b) Biên độ lượn của vành đất ngoài lưới là một QUAN HỆ, và nó được viết thành một HẰNG SỐ**
    — đúng bẫy Phase 7D (`roadColor`), lần thứ hai trong cùng phiên. Số `0,42` (±0,21) đúng **nhờ**
    `WATER_DROP_BELOW_PLAIN = 0,30` nằm ở `setting.js`, một file mà `terrain.js` **không hề tham
    chiếu tới**. §1(B) cộng thêm thành phần nghiêng vào cùng chỗ ấy ⇒ đất KHÔ của kỷ 8 tụt **0,0288
    ô dưới mặt nước** — một vũng nước ma giữa đồng. Vá bằng cách **nói ra quan hệ**:
    `ROLL_HEADROOM_SHARE = 0,70 × WATER_DROP_BELOW_PLAIN` (đúng 0,21 — không đổi thế giới hôm nay,
    nhưng từ nay nó tự đi theo). ⚠️ Và phép nén phải **BÃO HOÀ (`tanh`), KHÔNG KẸP**: kẹp thì mọi kỷ
    có triền dốc mạnh bị dồn về đúng ±0,21 và **thứ tự giữa các kỷ bị phá** (bài học Phase 7D/9B).
- **Ảnh hưởng**:
  - `terrain.js` (bảng `ERA_TERRAIN` + 6 hàm hình dạng + `HUONG_THAP` + `surfaceHeightAt` +
    `ROLL_HEADROOM_SHARE`/`nenRoll`); `terrain.test.js`, `horizon.test.js`, `cityFocus.test.js`,
    `waterView.test.js` phải đổi theo — **9 bài đỏ** sau bản vá, trong đó 4 bài chỉ đỏ vì
    `terrainMaxHeight` tụt (camera cận cảnh tính khoảng lùi theo nó).
  - ⚠️ **Ba bài test cũ dùng MỨC TUYỆT ĐỐI để canh một QUAN HỆ** nên chúng kêu oan ngay khi bảng
    được co giãn — đúng bẫy Phase 7D. Đã đổi sang quan hệ suy được: cổng làm phẳng đường nay đòi
    tập kỷ được làm phẳng **BẰNG** tập kỷ có `TERRACE_STEP × relief > maxRoadRise()` (không còn
    `soODuongLe > 200`); `horizon.test.js` đổi từ mức cao độ tuyệt đối sang **số cặp kỷ ngược chiều**
    và **lệch thứ hạng**.
  - Ngân sách hiệu năng **không đổi** — không thêm khối, không thêm vật liệu, không thêm lệnh vẽ;
    chỉ đổi giá trị trả về của một hàm thuần.
- **Điều kiện xem lại**: (a) khi Đàm chốt `TECH_DEBT #53` — nếu tấm đất được nới thì bo tròn cao
  nguyên trở nên khả thi và mục "trade-off" cuối ở trên phải viết lại; (b) nếu có kỷ thứ 16 khai
  một `shape` mới — bài `MỌI KIỂU ĐỊA HÌNH ĐỀU PHẢI CÓ MỘT LÝ DO HÌNH HỌC` sẽ đòi nó chứng minh
  mình không phải nhiễu trắng, **và** bài khoá `drain === side` sẽ đòi nó khai hướng thấp trùng phía
  có nước; (c) nếu `SMOOTHSTEP_PEAK` hoặc `STREET_MAX_GRADE` đổi thì `maxRoadRise()` đổi theo, và
  tập kỷ được làm phẳng đường sẽ đổi — bài test sẽ đỏ, **và đó là ý đồ**; (d) nếu có ai muốn nới
  `ROLL_HEADROOM_SHARE` lên gần 1 thì phải đo lại `setting.test.js` "không có vũng nước ma" trước —
  quan hệ ấy là thứ duy nhất giữ vành đất không chạm mặt nước.
## ADR-044 — Lối vào của `meander` là một **QUAN HỆ giữa `MEANDER_NECK` và `SHORE_BAND`**, không phải hai hằng số cạnh nhau; và cái hào phải đo bằng khoảng cách **Ơclit**, không phải khoảng cách lưới

- **Ngày**: 2026-08-20 (§2 của Đàm — đóng `TECH_DEBT #64`)

- **Bối cảnh**: Bước C trải mặt nước ra 14/15 kỷ. Kỷ 5 (Burg Eltz) dùng kiểu `meander` — khúc uốn
  ôm ba mặt, chừa **một** dải yên ngựa khô làm lối vào. Cả bảng (`settingStyle.js`) lẫn hình
  (`setting.js`) đều viết ra lời hứa ấy bằng chữ. Phép nghiệm thu bắn **720 tia** từ tâm thành phố
  ra ngoài rồi hỏi *"tia này có ra được đất khô không"* trả lời: **0/720**. Tức thứ đã ship là một
  **hào vuông khép kín** — một hòn đảo — chứ không phải một khúc uốn. Đàm gọi đúng bản chất:
  *"Burg Eltz nổi tiếng vì chỉ có MỘT lối vào, không phải vì không có lối nào"*, và
  *"hào 90° sắc lẹm là dấu hiệu hình dạng sinh từ LƯỚI VUÔNG, không phải từ DÒNG CHẢY. Suối thật uốn."*

- **Vấn đề**: hai khuyết tật độc lập, cùng một chỗ.
  **(1) Lối vào bị bịt.** `insetGoc` khoét hành lang bằng `trongKhe = min(d[doi], MEANDER_NECK − |lệch trục|)`
  rồi trả `min(vành, −trongKhe)`. Ở đoạn hành lang SÁT mép lưới thì `d[doi]` còn nhỏ, nên độ khô
  chưa đủ âm: ra 0,4 ô mới được −0,40 · ra 0,8 ô mới được −0,80, **cả hai đều lớn hơn**
  `−SHORE_BAND = −0,9`. Mà `blendAt` chỉ về 0 khi `insetAt ≤ −SHORE_BAND`. Dải hoà bờ vì thế
  **bắc cầu ngang qua CỬA hành lang** và khép kín vành nước.
  **(2) Hào vuông.** `insetGoc` đo bằng `distanceOutsideGrid` = `max` của bốn khoảng cách mép, tức
  khoảng cách **L∞ (Chebyshev)**, mà đường đồng mức của L∞ là những hình chữ nhật góc 90°.

- **Phương án cân nhắc**:
  · **(A) Nới `MEANDER_NECK` cho tới khi có lối ra.** Bác — đó là nới một ngưỡng cho tới khi phép
    đo hết kêu, đúng cái phễu Phase 9A; và nó không sở hữu quan hệ nào, nên lần sau ai chỉnh
    `SHORE_BAND` thì lối vào lại bịt trong im lặng.
  · **(B) Hạ `SHORE_BAND` cho riêng `meander`.** Bác — `SHORE_BAND` là quyết định về ĐỘ MỀM của mép
    nước, dùng chung cho cả 14 kỷ; bẻ nó vì một kỷ là đổi 14 kỷ vì 1 kỷ.
  · **(C) Sửa thẳng `distanceOutsideGrid` thành Ơclit.** Bác — `outskirts.js` cũng gọi nó, và ở đó
    câu hỏi thật sự là *"ra khỏi lưới bao xa theo TRỤC nào"* (L∞ đúng). Hai nơi hỏi **hai câu khác
    nhau**, nên đây KHÔNG phải ca "một luật một công thức" mà là ca hai luật trùng tên.
  · **(D) [ĐÃ CHỌN] Viết quan hệ ra thành mã, và thêm một hàm khoảng cách thứ hai.**

- **Lý do loại bỏ**: (A) và (B) đều đi chỉnh một con số mà **không dòng nào sở hữu quan hệ giữa hai
  con số ấy** — đúng hình dạng sai của `TECH_DEBT #57` (`side` đúng, `DEFAULT_YAW` đúng, quan hệ vô
  chủ) mà ADR-041 đã phải sửa bằng một "thứ thứ ba". (C) mua một kỷ bằng giá 14 kỷ.

- **Giải pháp chọn**: hai sửa đổi, mỗi cái một dòng.
  **(1)** `trongKhe = min(d[doi] **+ SHORE_BAND**, MEANDER_NECK − |lệch trục|)`. Quan hệ được phát
  biểu: ***một lối vào phải khô hẳn NGAY KHI nó rời khỏi lưới***, tức độ khô của nó phải vượt trọn
  dải hoà bờ tại `d[doi] = 0`. Cộng đúng `SHORE_BAND` là cách ngắn nhất nói điều đó, và nó **không
  có tham số tự do nào để trôi**. Hệ quả bắt buộc phải giữ mãi: **`MEANDER_NECK` > `SHORE_BAND`**
  (nếu không, hành lang khô có bề rộng âm ⇒ không tồn tại lối vào).
  **(2)** Thêm `distanceOutsideGridRounded` (Ơclit: `hypot(max(0,dx), max(0,dy))`) và cho riêng
  `meander` dùng nó. Một dòng nước không biết lưới thành phố hình gì; thứ duy nhất nó biết là
  *"tôi cách mỏm đá kia bao xa"* — đó đúng là khoảng cách Ơclit. Bo góc ở đây không phải hiệu ứng
  làm đẹp, nó là **phép đo đúng cho câu hỏi đang hỏi**.

- **Trade-off**: hai hàm khoảng cách cùng tồn tại trong một file, và một phiên sau có thể gọi nhầm.
  Chấp nhận, đổi lại `outskirts.js` không bị đụng. Đã trả bằng: chú thích dài tại chỗ giải thích
  **vì sao có hai hàm**, cộng một bài test THUẦN khoá rằng hai hàm phải là **hai hình khác nhau**
  (ở đường chéo thì một bên = `t`, bên kia = `t·√2`; trên trục thì bằng nhau) — nên gộp chúng lại
  hay chép nhầm đều đỏ ngay.

- **Ảnh hưởng**: chỉ kỷ 5. 14 kỷ còn lại byte-identical (đã đo: lệnh vẽ 13 → 13, và bản quét 15 kỷ
  qua cổng không-trôi). Số đo trước/sau:
  | Đại lượng | TRƯỚC (`b87df3c`) | SAU |
  |---|---|---|
  | cung liên tục ra đất khô (720 tia, `blendAt`) | **0** | **1 cung, 9,5°** |
  | bề rộng eo đất, phần KHÔ HẲN | **0,000 ô** | **1,400 ô** = `2×(MEANDER_NECK − SHORE_BAND)` |
  | bề rộng hành lang danh nghĩa | 3,203 ô | 3,203 ô = `2×MEANDER_NECK` (không đổi) |
  | bo góc: bờ ngoài chéo / trục | **1,3543** (vuông) | **1,0215** (tròn) · cổng 1,10 |
  | nước chiếm khung hình kỷ 5 | 3,34% | 3,49% |
  | tam giác thành phố kỷ 5 | 85.016 | 85.214 (+198) |
  | lệnh vẽ kỷ 5 | 13 | **13** |

- **Điều kiện xem lại**: khi `#65` cho `canal`/`estuary`/`meander` hình học riêng. Lúc ấy `meander`
  sẽ thôi là *"một vành đều quanh một hình chữ nhật"* và cả hai sửa đổi trên đều có thể tan vào
  hình mới. **Cho tới lúc đó thì đừng gỡ.**

- ⚠️ **BÀI HỌC LỚN NHẤT KHÔNG NẰM Ở BẢN VÁ MÀ Ở PHÉP ĐO: CÓ BA ĐỊNH NGHĨA "ƯỚT", VÀ HAI TRONG BA
  IM LẶNG KHI BỊ PHÁ.** Đo cùng một kỷ 5 bằng ba câu hỏi khác nhau ra ba con số khác nhau:
  `insetAt > 0` → 46/720 tia khô · cao độ địa hình dưới `WATER_SURFACE_Y` → 37/720 ·
  `blendAt > 0` → **19/720** (và **0/720** trước bản vá). Chỉ con số thứ ba khớp với ảnh render,
  vì `terrainMesh.js` (`buildWaterSurface`) chỉ **bỏ** một ô mặt nước khi `blendAt <= 0` ở **cả bốn
  góc** — tức **`blendAt` mới là thứ quyết định tấm nước được tô ở đâu**, không phải `insetAt`, và
  cũng không phải cao độ (tấm nước được tô đè lên phần đất vẫn còn CAO HƠN mặt phẳng nước — đó
  đúng là cái hào đã ship). Hai định nghĩa kia **không nhúc nhích một tia nào** khi tôi bơm phép
  phá MS1 vào, tức nếu bài test hỏi bằng chúng thì nó xanh vĩnh viễn về một thế giới khác. ⇒ Cùng
  họ `TECH_DEBT #42` (*"assert con số đã KHAI thay vì con số đã DỰNG"*), nhưng ở một biến thể khó
  thấy hơn: cả ba đại lượng đều **có thật**, đều **đúng**, và đều nằm trong cùng một module. Câu
  hỏi phát hiện: ***"con số tôi đang hỏi có phải chính con số mà tầng VẼ đọc không?"*** — và cách
  trả lời rẻ nhất là `grep` xem tầng vẽ gọi hàm nào, rồi **dựng cả hai bản rồi NHÌN ẢNH**.

---

## ADR-043 — TỔNG KẾT VIỆC 2 (mặt nước, 15 kỷ): khuôn **BẢNG → HÌNH → `worldYaw`** đã chạy đủ ba lớp; và bài học lớn nhất KHÔNG nằm ở nước mà ở **cái thước dùng để nghiệm thu nó**

- **Ngày**: 2026-08-20 (viết ở phiên nghiệm thu Bước C, theo lệnh §4 của Đàm)

- **Bối cảnh**: VIỆC 2 đi qua ba bước, mỗi bước một commit riêng, rollback độc lập được:
  · **Bước A** (`7146cb0`, `178efeb`) — BẢNG `settingStyle.js`: 15 dòng × `water`/`side`/`ground`/
    `reach`/`width`/`note`, mỗi dòng buộc vào `country` mà `eraStyle.js` khai, có test bắt.
  · **Bước B** (`e2ee7b1`, `054e868`) — HÌNH `city3d/setting.js` cho 3 kỷ, rồi `worldYaw` (ADR-041).
  · **Bước C** (`a67970e`) — trải ra **14/15 kỷ** (ADR-042).
  Đây là lần thứ **SÁU** dùng đúng khuôn ba lớp: `vernacularRoof` · `undergrowth` · `streetStyle` ·
  `groundFloor` · `floraStyle` · và nay `settingStyle`. Khuôn ấy nay coi như đã chứng minh xong.

- **Vấn đề**: ba câu hỏi phải trả lời được bằng SỐ, không bằng cảm giác — *"nước có ĐỦ NHIỀU không"*
  · *"lệnh vẽ có phình không"* · *"15 kỷ có còn phân biệt được không"*.

- **BA CON SỐ QUAN TRỌNG NHẤT** (Đàm chỉ định trong §4):

  **(1) NƯỚC CHIẾM BAO NHIÊU KHUNG HÌNH — trước / sau.** Trước VIỆC 2: **0,00%** ở cả 15 kỷ (không
  có mặt nước nào tồn tại). Sau: 14 kỷ có nước, đo trên ảnh đã dựng
  (`scripts/water-score.mjs`, khung mặc định 1100×700, `--hour 12`, 40 phiên):

  | nhóm | kỷ | % khung |
  |---|---|---|
  | `sea`     | 13 · 14 · 15 | 23,18% · 20,09% · 19,05% |
  | `estuary` | 8 · 11 | 7,40% · 5,42% |
  | `river`   | 2 · 3 · 4 · 9 · 12 | 3,77% · 3,87% · 3,32% · 2,82% · 4,84% |
  | sông hẹp  | 6 · 7 | 1,37% · 1,49% |
  | `meander` / `canal` | 5 · 10 | 3,34% · 1,18% |
  | khô (đúng bảng) | 1 | 0,00% |

  ⚠️ **5/14 kỷ đạt cổng 5%**, KHÔNG phải 11 như bảng nghiệm thu đầu tiên ghi — xem `TECH_DEBT #63`.
  ⚠️ **Nhưng tương phản nước↔đất-sát-bờ là 30,8 tới 115,5 trên ngưỡng mắt 12 ở CẢ 14 kỷ**: chỗ nào
  có nước thì chỗ ấy ĐỌC RA là nước. Bài toán còn lại thuần tuý là DIỆN TÍCH, không phải màu.

  **(2) LỆNH VẼ TỪNG KỶ.** Luật ADR-028 giữ nguyên hình dạng, chỉ mở rộng hằng số:
  `lệnh vẽ = (số họ vật liệu) + tamCoDinh(era)`, với `tamCoDinh = 4 + (waterIsBuilt ? 1 : 0)`.
  ⇒ **đúng +1 lệnh vẽ cho mỗi kỷ có nước, không hơn**, và kỷ 1 (khô) không đổi một đơn vị. Đây là
  thứ khiến nước không phải một khoản chi mở, và nó được khoá bằng bảng 15 mốc riêng ở
  `drawCallBudget.test.js` (ADR-028) chứ không bằng một trần chung.

  **(3) CỔNG KHÔNG-TRÔI.** Bản quét 15 kỷ × 6 chặng (md5 `c210cbe93adaa8fc5ea2bd7eafd1dead`):
  **105/105 cặp kỷ ĐẠT** (gần nhất 21,8 · trung vị 40,7 — đứng yên so với trước Bước C) và
  **15/15 cặp chặng ĐẠT** nhưng cặp yếu nhất tụt về **13,9616**, tức chạm ngưỡng hành động 14 mà
  Đàm đặt ra (`TECH_DEBT #55`).
  ⚠️ **Và đây là điều đáng đọc nhất trong cả ADR này: NƯỚC LÀM HAI TRỤC ĐI HAI HƯỚNG NGƯỢC NHAU, VÌ
  MỘT LÝ DO CẤU TRÚC.** Mỗi kỷ có một hình nước riêng ⇒ trên trục KỶ, nước là chi tiết **phân
  biệt**. Nhưng hình nước ấy giống hệt nhau ở cả 6 chặng ngày ⇒ trên trục CHẶNG, nó là chi tiết
  **chung**, và một phép đo lấy trung bình cả cảnh sẽ bị nó pha loãng. Cùng một thứ, hai trục, hai
  dấu. ⇒ **Mọi phase sau thêm bất cứ gì KHÔNG phản ứng với giờ trong ngày đều phải đo lại trục
  chặng TRƯỚC.**

- **Phương án đã cân nhắc và LOẠI**:
  · **Vẽ một tấm xanh đặt lên mặt đất** — loại ở ADR-040: nó cần một đường bờ, mà đường bờ thì hoặc
    răng cưa theo lưới hoặc phải sinh thêm hình học; khoét MẶT ĐẤT xuống dưới một mặt phẳng thì bờ
    tự có, miễn phí, và luôn khớp địa hình.
  · **Xoay CAMERA để nhìn thấy nước** — Đàm bác thẳng ở ADR-041 (*"KHÔNG SỬA CAMERA, KHÔNG SỬA
    `side`"*); camera là hằng số mỹ thuật đã hiệu chuẩn nhiều phase, `side` là sự thật lịch sử.
  · **Nới bề rộng kênh cho đủ 5%** — bác ở `TECH_DEBT #59`: kênh Bridgewater hẹp thật, và mua một
    con số bằng cách nói dối địa lý chính là thứ ADR-025 đã cấm với mặt đường.
  · **Đổi cổng sang "chiều dài đường bờ cắt khung"** — Đàm nêu làm phương án dự phòng; đã ĐO và
    LOẠI (`TECH_DEBT #61`): ba kỷ `sea` — nhóm không thể nhầm được — có đường bờ **ngắn nhất** bảng,
    tức đại lượng ấy nghịch biến với thứ nó định đo.

- **Quyết định**: giữ nguyên cả ba lớp và cả ba con số như trên. Bổ sung **`scripts/water-score.mjs`**
  làm công cụ chấm cổng phần trăm (đọc `--mask water`), và **hạ vai** `water-view.mjs` xuống thành
  công cụ đo TRẦN theo góc xoay.

- **Trade-off**: có thêm một công cụ đo thứ hai cho cùng một đại lượng, tức thêm một chỗ có thể trôi.
  Chấp nhận vì hai công cụ trả lời **hai câu hỏi khác nhau** (*"hôm nay thấy bao nhiêu"* ↔ *"nhiều
  nhất có thể là bao nhiêu"*) và vì cái rẻ hơn (`water-view.mjs`, không cần Chromium) là cái duy
  nhất chạy được trong `npm test`. Ràng buộc kèm theo: chú thích của cả hai file phải nói rõ mình
  KHÔNG trả lời câu nào — và đó là điều đã làm.

- **Ảnh hưởng**: `settingStyle.js` nay là nguồn sự thật cho **bốn** tầng (`terrain` · `outskirts` ·
  `horizon` · `terrainMesh`), tất cả đi qua `insetAt`/`blendAt`/`depthAt`. `worldYaw` được áp ở
  **đúng một chỗ** (`insetAt`), nên địa hình + vùng quê + rặng núi xoay cùng một góc mà không file
  nào phải biết trường ấy tồn tại.

- **Điều kiện xem lại**: khi Đàm chốt `TECH_DEBT #61` (9 kỷ dưới cổng thì làm gì) · khi mở phase
  ngữ pháp ven nước (`#60`) · khi `#64` (kỷ 5 là đảo) hoặc `#65` (`canal`/`estuary` không có hình
  học riêng) được chọn hướng.

- **BÀI HỌC LỚN NHẤT CỦA VIỆC 2, VÀ NÓ KHÔNG NÓI VỀ NƯỚC**: cả ba bước đều đi qua build xanh, lint
  sạch, test xanh, và một bảng nghiệm thu đầy số — mà con số quan trọng nhất trong bảng ấy
  (*"11 kỷ đạt cổng"*) sai gần **gấp đôi**, vì cái thước đo nó mù với cây cối. Thứ phát hiện ra
  không phải một bài test mà là **lệnh của Đàm bắt đi NHÌN hai kỷ cụ thể**. ⇒ *Một cổng nghiệm thu
  phải được hỏi thêm một câu mà không bài test nào hỏi hộ được: **"cái thước này có nhìn thấy đúng
  thứ mắt nhìn thấy không?"*** Cách rẻ nhất để trả lời là **hỏi thẳng bên dựng** (`--mask`) thay vì
  dựng lại một mô hình song song — đúng luật "một luật một công thức", áp cho cặp *công cụ dựng ↔
  công cụ đo*.

---

## ADR-042 — Trải một lời hứa từ 2 trường hợp ra 14 thì bốn phép đo cùng gãy một kiểu: chúng được viết thành MỨC, mà thứ chúng nói là QUAN HỆ. Cách xử lý là sửa MẪU SỐ hoặc GHI RA ĐẾM ĐƯỢC — không phải hạ ngưỡng

- **Ngày**: 2026-08-20
- **Bối cảnh**: Bước C dựng mặt nước cho 12 kỷ còn lại (2 → 14 kỷ có nước, chỉ kỷ 1 khô). Mã sản
  phẩm gần như không phải sửa — ADR-040 và ADR-041 đã dựng sẵn ngữ pháp. Nhưng **sáu bài test đỏ**,
  và không bài nào đỏ vì hình học sai. Cả sáu đỏ vì cùng một lý do: chúng được hiệu chuẩn khi chỉ
  có HAI kỷ nước, mà hai kỷ ấy (12 và 14) tình cờ là hai kỷ nước RỘNG NHẤT bảng.
- **Vấn đề**: mỗi bài phát biểu một lời hứa mỹ thuật thật, nhưng viết nó thành một **con số tuyệt
  đối** — và con số ấy chỉ đúng cho quần thể đã sinh ra nó:

  | Lời hứa | Viết thành | Thứ nó thật sự nói | Gãy ở đâu |
  |---|---|---|---|
  | "mặt nước cạn dần vào bờ" | `trải sắc > 0,02` | quan hệ với **BỀ RỘNG** nước (rộng ⇒ sâu ⇒ đậm) | kỷ 5 = 0,0042 |
  | "sát phố thì rậm, ngoài xa thì thưa" | mật độ ÷ **diện tích hình học** | mật độ ÷ **đất KHẢ DỤNG** (cây không mọc dưới nước) | kỷ 5 = 1,85× |
  | "rìa phẳng đúng `-APRON_DROP`" | `tổng điểm khô > 1400` | mỗi kỷ phải còn phần lớn rìa khô | tổng = 1259 |
  | "hai tấm phải khớp ở chỗ giáp" | so ở **ba** khoảng cách | chỉ so được ở chỗ **CẢ HAI tấm đều được vẽ** | lệch 2,16e-1 |

  Bài thứ tư là bài đáng sợ nhất: nó **so hai tấm ở chỗ chỉ có một tấm tồn tại** (`innerEdge − 2`
  nằm TRONG tấm đất, nơi tấm chân trời không được vẽ), và nó xanh nhiều tháng chỉ vì hai kỷ nước cũ
  tình cờ có `blend = 1` tại đúng các điểm lấy mẫu — khi blend bằng 1 thì hai tấm cùng sập về một
  đáy nên nền của chúng bị nuốt, không thể lệch. Đây là bài học `diemToanTheGioi` lặp lại: **phép đo
  không áp dụng được ở chỗ nó tự nhận là đang đo.**
- **Phương án đã cân nhắc**:
  1. **Hạ ngưỡng cho vừa số đo mới** (0,02 → 0,004 · 1400 → 1200 · sàn 2 → sàn 1,8).
  2. **Bỏ qua trắng các trường hợp mới** (kỷ nước hẹp `continue`, chỗ ướt `continue`).
  3. **Sửa lại hình cho vừa phép đo** — nới sông hẹp cho sâu hơn, đẩy nước ra khỏi vòng rìa.
  4. ✅ **Hỏi lại từng phép đo xem nó nói MỨC hay QUAN HỆ**, rồi sửa đúng vế bị sai: mẫu số, phạm
     vi lấy mẫu, hoặc — khi lời hứa thật sự không đạt được — **ghi danh sách trượt ra tường minh
     đếm được**, đúng khuôn `TRUOT = [6, 7, 10]` mà Đàm đã chốt cho `TECH_DEBT #59`.
- **Lý do loại bỏ**: (1) là cái phễu Phase 9A — nới một ngưỡng cho vừa kết quả thì nó không còn
  canh ai, và lần sau sẽ được nới tiếp vì "lần trước cũng nới". (2) làm bài test **rỗng dần trong
  im lặng**: mỗi kỷ nước mới thêm vào là một nhánh không bao giờ chạy, mà không có gì đỏ. (3) là
  nói dối địa lý — kênh Bridgewater hẹp thật, khúc uốn Elzbach hẹp thật; đúng thứ ADR-025 đã cấm.
- **Giải pháp chọn**: bốn bản vá, mỗi bản sửa đúng vế sai của phép đo ấy, KHÔNG bản nào đụng hình:
  - **Sắc nước**: tách làm ba câu hỏi. (a) mỗi kỷ có **dải sâu** thật không (`> 0,10`; đo thật mỏng
    nhất 0,111). (b) ánh xạ sâu→sắc có dùng CHUNG một đường cong không — hỏi bằng **quan hệ đơn
    điệu** giữa 76 cặp kỷ, và **chuẩn hoá theo biên độ bảng sắc của từng kiểu nước** trước khi so
    (không chuẩn hoá thì biên mỏng nhất chỉ 0,00070; chuẩn hoá xong là 0,01776 — rộng gấp **25
    lần** — và nó đúng về cấu trúc vì trải-chuẩn-hoá chính là bề rộng `smoothstep` trên dải sâu).
    (c) `MO_NHAT = [5, 6, 7, 10]` — bốn kỷ mờ hơn cổng cũ, ghi ra, đỏ cả hai chiều. **Cổng 0,02 giữ
    NGUYÊN.**
  - **Mật độ vùng quê**: chia cho **đất khả dụng** thay vì diện tích hình vuông viền. Cổng `>= 2`
    giữ nguyên; chỉ mẫu số được dọn. Khoảng trải 15 kỷ thu từ 1,85–3,86 (2,09 lần) xuống
    **2,51–3,41 (1,36 lần)** — dấu hiệu kinh điển của một mẫu số vừa hết lẫn thứ không thuộc câu hỏi.
  - **Vòng rìa**: hỏi **tỉ lệ khô của TỪNG kỷ** (`>= 70%`; đo thật thấp nhất 75,0%) thay vì một
    tổng — một tổng thì chín kỷ khô bù cho một kỷ ngập. Cộng bảng `KY_RIA_CHAM_NUOC` đếm được.
  - **Chỗ giáp hai tấm**: nhánh "so hai tấm" **chỉ chạy ở nơi cả hai tấm đều được vẽ**; điểm ướt
    nằm trong tấm đất được bỏ qua nhưng **đếm ra bảng `BO_QUA_KY` chín kỷ**. Ở đúng chỗ giáp, hai
    tấm khớp tới **1,11e-16**.
- **Trade-off**: bốn phép đo nay **đắt hơn và dài hơn**. Phép mật độ vùng quê phải lấy mẫu
  `insetAt` trên lưới 0,1 ô cho từng kỷ (đo: cả bài chạy 1,05 giây — chấp nhận được). Ba bảng đếm
  được (`MO_NHAT` · `KY_RIA_CHAM_NUOC` · `BO_QUA_KY`) sẽ **đỏ mỗi lần ai đó chỉnh một dòng địa
  thế** — đó là chủ đích, nhưng nó có giá: người sửa phải đi nhìn ảnh rồi mới được sửa bảng, chứ
  không được sửa cho hết đỏ. Ba dòng chú thích nói rõ điều đó tại chỗ.
- **Ảnh hưởng**: 14/15 kỷ có mặt nước dựng hình. Lệnh vẽ **+1 CHỈ ở kỷ có nước**, mốc riêng từng
  kỷ đã cập nhật (`MOC_LENH_VE`); kỷ 1 không đổi một đơn vị. Bốn phép đo trên nay nói đúng đại
  lượng chúng tuyên bố, và mỗi assert mới đều đã thử-cho-đỏ với chỗ mong đợi đỏ nêu TRƯỚC.
- **Điều kiện xem xét lại**: (a) nếu một phase sau nới bề rộng nước của kỷ 5/6/7/10 (xem
  `TECH_DEBT #60` — cầu/bến/thuyền/kè) thì `MO_NHAT` sẽ đỏ và **đó là tin mừng**, sửa bảng rồi ghi
  lại số; (b) nếu `APRON_EDGE` hoặc một `reach` nào đổi thì `KY_RIA_CHAM_NUOC` đỏ — phải nhìn ảnh
  trước khi sửa bảng; (c) nếu `TECH_DEBT #61` thành sự thật (có kỷ đạt cổng 5% mà nhìn vẫn không ra
  bờ, hoặc ngược lại) thì cổng khung hình phải đổi sang **đo CHIỀU DÀI ĐƯỜNG BỜ CẮT KHUNG** — và
  lúc ấy phép "chuẩn hoá theo biên độ bảng sắc" ở đây là khuôn mẫu để làm việc đó.

---

## ADR-041 — `worldYaw`: xoay TỜ GIẤY, không xoay thế giới. Khi hai hằng số đều đúng mà kết quả sai, thứ phải đặt tên là QUAN HỆ giữa chúng

- **Ngày**: 2026-08-20
- **Bối cảnh**: VIỆC 2 Bước B dựng xong mặt nước cho kỷ 12 và 14, mọi cổng đếm được đều đạt (lệnh
  vẽ +1 đúng chỗ, 13 kỷ khô không đổi một đơn vị, bờ 0 lỗ, bản quét không trôi) — nhưng cổng
  KHÔNG-đo-được-bằng-test của Đàm thì trượt thẳng: *"kỷ có biển phải đọc ra là **thành phố cảng**,
  không phải thành phố cạnh một vũng xanh."* Đo bằng `scripts/water-view.mjs`: mặt biển kỷ 14 chiếm
  **0,09%** khung hình mặc định, sông kỷ 12 chiếm **2,30%**.
- **Vấn đề**: hai hằng số bị nghi ngờ đều **KHÔNG sai**.
  · `side` là **sự thật lịch sử** — sông Vị chảy phía bắc Trường An, sông Arno phía nam Duomo, sông
  Volga phía đông Stalingrad. Đổi nó để lấy một con số đẹp là bán lịch sử, đúng thứ ADR-025 đã cấm.
  · `DEFAULT_YAW = π/4` là một **hằng số mỹ thuật đã hiệu chuẩn qua nhiều phase** — khung hình, mọi
  ảnh mốc, và ADR-034 khoá khoảng cách cận cảnh đều đứng trên nó.
  Thứ sai là **quan hệ giữa hai hằng số ấy không thuộc về ai**. Đó đúng hình dạng bẫy Phase 7D: mặt
  đường hứa *"nhạt hơn đất"* nhưng được viết thành một con số tuyệt đối, nên khi mặt đất bị chỉnh ở
  một phase khác thì lời hứa chết trong im lặng.
- **Phương án đã cân nhắc**:
  1. **Xoay camera** (`DEFAULT_YAW` theo kỷ). Rẻ về mã. Giết mọi ảnh mốc, phá hiệu chuẩn cận cảnh
     của ADR-034, và đụng thẳng danh sách file bị cấm của chương trình này.
  2. **Đổi `side`** cho những kỷ bị khuất. Rẻ nhất, và là phương án tệ nhất: mua một con số bằng
     cách nói dối địa lý. `note` của mỗi dòng sẽ kể một câu chuyện rành mạch cho một dữ kiện sai.
  3. **Nới cổng 5%** xuống mức hiện có. Bỏ răng của chính phép đo vừa dựng ra.
  4. ✅ **Thêm trường `worldYaw`** — góc xoay CẢ ĐỊA THẾ quanh trục đứng, suy ra từ `side` +
     `DEFAULT_YAW` bằng MỘT công thức.
- **Lý do loại bỏ**: (1) và (2) đều bắt một hằng số ĐANG ĐÚNG gánh trách nhiệm cho một QUAN HỆ —
  tức tái tạo đúng cái bệnh, chỉ đổi chỗ. (3) là bán phép đo.
- **Giải pháp chọn**: `worldYaw(era)` ở `settingStyle.js`, áp bằng cách **xoay ĐIỂM TRUY VẤN** ở một
  chỗ duy nhất trong `buildSetting`. Bốn người dùng lớp địa thế (`terrain.js` · `outskirts.js` ·
  `horizon.js` · `terrainMesh.js`) đều đi qua `insetAt`/`blendAt`/`depthAt`, nên **địa hình + vùng
  quê + rặng núi chân trời xoay theo cùng một góc** mà không một dòng nào của ba file kia phải biết
  trường này tồn tại. Lưới 12×12 và vị trí công trình **không đọc lớp này** nên chúng đứng yên.
  Ba quyết định con, mỗi cái có lý do đo được:
  - **Chỉ xoay khi bờ nước nằm SAU LƯNG, và xoay đúng một phần tư vòng.** Công thức bản đầu ép cả
    14 kỷ về CÙNG một góc tương đối; nó đạt cổng 5% và **phá luật (3) của bảng địa thế** (*"15 kỷ
    không được ra cùng một bố cục lệch về một phía"*) — cả 14 kỷ hiện nước ở đúng một chỗ trên màn
    hình. Phát hiện bằng cách ĐO (14 kỷ × 24 góc), không bằng cách đọc mã. Bản xoay-ít-nhất giữ
    được **7 kỷ ra bên này khung / 7 kỷ ra bên kia**, và **6 kỷ có nước không xoay một độ nào**.
  - **`worldYaw` LUÔN là bội số của 90°, và `buildSetting` TỪ CHỐI THẲNG góc khác.** Lưới là hình
    VUÔNG: mọi công thức nước lấy mốc ở nửa CẠNH (6 ô) trong khi nửa ĐƯỜNG CHÉO là 6√2 ≈ 8,49. Xoay
    45° mà vẫn dùng mốc 6 thì nước cắt vào GÓC lưới — đo được **4/144 ô bị ướt**, tức ADR-007 vỡ,
    trong khi build/lint/test đều xanh. Bội số 90° thì hình vuông trùng khít chính nó ⇒ phép xoay là
    một ĐỐI XỨNG CHÍNH XÁC, không cần số hiệu chỉnh nào.
  - **KHÔNG có hằng số lệch nào được khai.** Đàm cho phép một, nhưng hình học phát không: camera
    đứng đúng 45° và bờ chỉ có bốn hướng, nên mọi kỷ đều lệch ±45° sau khi xoay — đúng góc "đọc ra
    là BỜ chứ không phải cái hồ" mà Đàm mô tả. Thêm một hằng số nữa chỉ có thể đẩy nước về chính
    giữa hoặc ra sau lưng lần nữa.
- **Trade-off**: `settingStyle.js` phải **CHÉP** giá trị `DEFAULT_YAW + π` thay vì `import` — import
  thẳng tạo vòng `orbit → terrain → setting → settingStyle → orbit`. Đây là một vi phạm có ý thức
  của luật *"một luật một công thức"*, và nó được trả bằng một **dây buộc trong test** (`settingWorldYaw.test.js`
  nạp cả hai module rồi đòi hai con số bằng nhau) — đúng khuôn `settingCountryMismatches()` đang
  buộc bảng địa thế vào `eraStyle.js`. Cách vá triệt để (tách hằng số camera ra một file lá) đòi
  sửa `orbit.js`, mà chương trình này cấm đụng camera.
- **Ảnh hưởng**: kỷ 14 đi từ **0,09% → 23,75%** khung hình (trần 31,43%, tức khung mặc định nay lấy
  được 76% của trần); kỷ 12 từ **2,30% → 9,32%**. **Lệnh vẽ không đổi ở cả 15 kỷ.** Tam giác chỉ đổi
  ở đúng hai kỷ có nước (12: −2.478 · 14: +8), 13 kỷ còn lại khớp TỪNG ĐƠN VỊ.
- **Điều kiện xem xét lại**: (a) nếu `DEFAULT_YAW` đổi khỏi π/4 thì `lech` không còn là ±45°/±135°
  và bất biến "luôn bội số 90°" có thể vỡ — dây buộc trong test sẽ đỏ trước, đó là chủ đích;
  (b) nếu một kỷ tương lai cần góc KHÔNG phải bội số 90°, phải đổi mốc `6` thành hàm tựa của hình
  vuông `support(θ) = 6·(|sin θ| + |cos θ|)` ở CẢ nhánh `meander` — đó là một phase riêng, không
  phải một dòng sửa; (c) ba kỷ nước hẹp (6 · 7 · 10) vẫn dưới cổng 5% ở MỌI góc — xem `TECH_DEBT #59`,
  đó là bài toán về BỀ RỘNG nước, không phải về góc xoay.

---

## ADR-040 — Mặt nước là chỗ MẶT ĐẤT THẤP HƠN MỘT MẶT PHẲNG, không phải một tấm xanh đặt lên trên; và bờ nước KHÔNG được vẽ

- **Ngày**: 2026-08-19 (VIỆC 2 Bước B — Đàm: *"BƯỚC A DUYỆT — SỬA MỘT DÒNG, RỒI VÀO BƯỚC B"*)
- **Bối cảnh**: ADR-039 đã chốt BẢNG 15 dòng địa thế và Đàm đã duyệt kèm ba lệnh sửa. Bước B là
  lớp HÌNH, và Đàm giới hạn nó rất chặt: dựng cho **đúng ba kỷ** (14 biển Singapore · 12 sông Nga ·
  1 khô Thổ Nhĩ Kỳ làm nhân chứng), **tối đa +1 lệnh vẽ và chỉ ở kỷ có nước**, **cấm** nguồn sáng
  mới · texture mới · shader nước động. *"Mặt nước phẳng, vật liệu tĩnh. Nước động là phase riêng
  có đo lại — `PERFORMANCE.md`: +0,8 ms mỗi nguồn sáng, trục ĐẮT."*
- **Vấn đề**: mặt đất của dự án là **MỘT tấm lưới liền** trải từ rìa bên này qua thành phố sang rìa
  bên kia (Phase 8C, ADR-019). Đặt một tấm xanh phẳng LÊN TRÊN nó thì hoặc hai mặt chọi nhau
  (z-fighting), hoặc tấm nước nổi lều bều như một miếng giấy màu. Và nếu phải VẼ đường bờ thì đường
  ấy sẽ là một đa giác do ta tự dựng — tức nó sẽ thẳng, hoặc răng cưa, hoặc phải sinh ra thêm một
  cơ chế làm-cho-nó-lượn (đúng loại cơ chế mà Phase 8D đã chứng minh là hay chết trong im lặng).
- **Các phương án cân nhắc**:
  - **A — tấm nước đặt LÊN mặt đất, cắt viền theo một đa giác bờ.** Bác vì hai lẽ: (a) phải tự dựng
    và tự làm lượn đường bờ — thêm một cơ chế, thêm một chỗ hỏng im lặng; (b) chỗ giáp giữa tấm
    nước và mặt đất là một cạnh CHUNG mà hai bên tính riêng ⇒ đúng hình dạng lỗi "một luật hai công
    thức" đã cắn nhiều lần.
  - **B — khoét mặt đất xuống dưới một mặt phẳng, rồi đặt một hình chữ nhật phẳng ở mực nước.**
    ✅ **Chọn.** Bờ nước **không cần được vẽ**: nó LÀ chỗ mặt đất cắt mực nước, nên nó tự lượn theo
    mọi gợn của địa hình, không bao giờ có bậc răng cưa, và tấm nước chỉ cần là một hình chữ nhật
    — đúng **+1 lệnh vẽ**, đúng ràng buộc Đàm ra.
  - **C — shader nước (sóng, phản chiếu động).** Đàm CẤM thẳng ở chỉ thị. Ghi lại ở đây vì nó là
    phương án mà mọi phiên sau sẽ nghĩ tới đầu tiên: nó **không** bị bác vì xấu, mà vì chưa được
    ĐO, và vì bảng chi phí hiện có nói ánh sáng/shader là trục đắt (`PERFORMANCE.md`).
- **Giải pháp**: ba lớp, đúng khuôn đã dùng bảy lần (`vernacularRoof` · `undergrowth` ·
  `streetStyle` · `groundFloor` · `floraStyle` · `settingStyle` · và nay là đây):
  - `city3d/settingStyle.js` = **BẢNG** (ADR-039, đã duyệt) — không đụng tới ở Bước B.
  - `city3d/setting.js` = **HÌNH** — thuần, trả về `insetAt` / `blendAt` / `depthAt` / `bounds`.
  - `terrain.js` · `horizon.js` · `outskirts.js` · `terrainMesh.js` · `sceneGraph.js` chỉ **ĐỌC**.
  Cộng một file mới `city3d/noise.js`: `valueNoise` xưa nay sống nhờ trong `terrain.js` dù nó chưa
  bao giờ là một hàm của địa hình. Bước B biến chỗ ở nhờ ấy thành một **vòng import thật**
  (`setting` cần nhiễu → `terrain` cần `setting`), nên nó phải dọn ra một file không phụ thuộc ai.
- **Trade-off / cái giá phải trả**:
  - **Mọi hằng số của `setting.js` là ĐỘ LỆCH, không phải cao độ tuyệt đối.** `terrain.js` (nơi giữ
    `APRON_DROP`) là chỗ DUY NHẤT tính ra `WATER_SURFACE_Y`. Hơi vòng, nhưng đó là cái giá của việc
    không có vòng import — và nó giữ "một luật một công thức".
  - **Phép khoét nằm ở `setting.hazXuongDay`, cả hai tấm đất cùng gọi.** Bản đầu chép công thức
    sang cả `terrain.js` lẫn `horizon.js`; hai tấm gặp nhau khít ở `innerEdge` nên chép là cách
    chắc chắn nhất để mở lại đúng cái khe Phase 9A đã trả giá để vá. Nay có test đọc mã nguồn cấm
    chuyện đó, và có test đo chỗ giáp ở cả 15 kỷ.
  - **`WATER_DROP_BELOW_PLAIN = 0,30` là một PHÉP ĐO, không phải một sở thích.** Vành đất ngoài lưới
    gợn ±0,21 quanh −0,62 nên chỗ trũng nhất chạm **−0,83**; mực nước −0,92 nằm dưới nó 0,09. Đặt
    cao hơn thì tấm nước phẳng ló lên ở những hõm khô cách con sông hàng chục ô — một vũng nước ma,
    và nó sẽ được đọc thành "lỗi vẽ" chứ không thành "lỗi hằng số". Có test đo lại khoảng hở ấy
    trên toàn thế giới thay vì tin vào phép suy tay.
  - **Mép bờ chỉ được lượn RA XA thành phố.** Nhiễu trả 0..1 (không phải −1..1) và luôn được CỘNG.
    Đây là thứ giữ ADR-007 theo CẤU TRÚC: một mép bờ lượn được cả hai chiều thì ngày nào đó nó sẽ
    liếm vào lưới 12×12 ở đúng một kỷ, một hạt giống, và hậu quả là một căn nhà lún xuống mà không
    có bài test nào đỏ.
  - **Đang dở dang có chủ ý, và nó ĐẾM ĐƯỢC**: `ERAS_WITH_WATER_GEOMETRY = [12, 14]` có
    `assert.deepEqual` khoá, và `hasWater` (BẢNG khai) được giữ TÁCH khỏi `waterIsBuilt` (HÌNH đã
    dựng) — gộp hai câu hỏi ấy là đúng cái bẫy "một trường gánh hai việc" đã cắn năm lần.
    Ghi ở `TECH_DEBT #56`.
- **Ảnh hưởng**:
  - **Lệnh vẽ**: `TAM_CO_DINH` thôi là một hằng số, nay là `tamCoDinh(era) = 4 + (có nước ? 1 : 0)`.
    `MOC_LENH_VE` lên đúng 1 ở kỷ 12 (10→11) và kỷ 14 (10→11); **13 kỷ còn lại không đổi một đơn
    vị**, có bài test so với bảng mốc trước-nước để chứng minh.
  - **Ba bài test cũ phải đổi phạm vi, và cả ba đều đổi theo cùng một luật**: chỗ có nước thì lời
    hứa "phẳng đúng `−APRON_DROP`" hết đúng, nhưng lời hứa GỐC (hai tấm phải KHỚP NHAU) vẫn nguyên
    giá trị — nên chỗ ướt **chuyển sang so hai tấm với nhau**, không bỏ qua trắng, và cả hai nhóm
    đều được ĐẾM để bài test không rỗng dần theo mỗi kỷ được dựng nước.
  - **Một phép đo cũ bị nhiễm và đã được vá**: bài `rough PHẢI ĐỔI ĐƯỢC BỀ MẶT` đo ĐỘ CONG của tấm
    chân trời, và bờ sông thì có độ cong rất lớn ⇒ kỷ 12 nhảy từ 0,00088 lên **0,01618** và đỏ với
    thông báo *"thảo nguyên Nga gồ ghề"*. Thảo nguyên không hề gồ ghề; thứ gồ ghề là BỜ SÔNG, một
    đại lượng chẳng liên quan tới `rough`. Vá bằng cách bỏ mẫu chạm nước ra khỏi mẫu số (đo lại:
    **0,00132**, về đúng gia đình với kỷ 3 = 0,00114 và kỷ 15 = 0,00117), kèm gác chạy-rỗng.
  - ⚠️ **VÀ ĐÂY LÀ ẢNH HƯỞNG LỚN NHẤT, DÙ NÓ KHÔNG NẰM TRONG QUYẾT ĐỊNH NÀY: quyết định trên ĐÚNG
    và vẫn KHÔNG ĐỦ.** Cổng không-đo-được-bằng-test của Đàm (*"kỷ có biển phải đọc ra là **thành
    phố cảng**"*) **TRƯỢT**: mặt biển kỷ 14 chiếm **0,09%** khung hình mặc định. Hình nước không
    sai — xoay camera sang phía đối diện thì đúng cảnh ấy cho **31,43%**, gấp **345,7 lần**. Thủ
    phạm là `DEFAULT_YAW = π/4` (camera đứng góc đông-nam nhìn tây-bắc) chỏi với `side: 'nam'` của
    kỷ 14, và **cả hai đều đúng một mình**: Marina Bay thật sự nhìn nam ra eo Malacca, còn góc 45°
    thì kế thừa từ bộ vẽ 2D. Hai hằng số ở hai file không tham chiếu nhau, chưa bao giờ được đặt
    cạnh nhau — đúng hình dạng ADR-028/Phase 7D (*một lời hứa nói về QUAN HỆ được cài đặt bằng hai
    HẰNG SỐ*). ⇒ `TECH_DEBT #57`, **chờ Đàm quyết**, vì chữa nó phải đụng `camera` (danh sách CẤM)
    hoặc cột `side` mà Đàm đã DUYỆT ở Bước A. **Bài học cho mọi ADR sau: một quyết định về HÌNH
    không tự bảo đảm rằng hình ấy TỚI ĐƯỢC MẮT.** Hai câu hỏi đó tách rời nhau, và ADR này chỉ trả
    lời câu đầu.
- **Điều kiện xem xét lại**: (a) khi Đàm gật hướng mỹ thuật và cho trải nốt 12 kỷ còn lại — lúc đó
  phải đo lại mốc lệnh vẽ của TỪNG kỷ, không được cộng đều; (b) khi có ai muốn shader nước động —
  phải chạy `bash scripts/bench-macbook.sh` TRƯỚC, vì bảng chi phí hiện tại chưa đo mảng này;
  (c) nếu `MEANDER_NECK` (kiểu `meander` của kỷ 5) được dựng hình — **chưa ai nhìn kiểu ấy bằng
  mắt**, con số 1,6 hôm nay là suy luận chứ không phải một quyết định mỹ thuật đã nghiệm thu.

---

## ADR-039 — Địa thế là một BẢNG DỮ LIỆU viết TRƯỚC khi có hình, và "không có nước" là một câu trả lời phải khai TƯỜNG MINH

- **Ngày**: 2026-08-19 (VIỆC 2 Bước A trong chỉ thị "chốt bốn câu hỏi, rồi vào việc 2" của Đàm;
  **sửa lại cùng ngày** sau chỉ thị "BƯỚC A DUYỆT — SỬA MỘT DÒNG, RỒI VÀO BƯỚC B" — xem mục
  *"Đàm sửa gì sau khi đọc bảng"* ở cuối)
- **Bối cảnh**: ADR-038 vừa đưa vùng quê ra ngoài lưới 12×12, nhưng vùng quê ấy hôm nay chỉ có cây,
  đá và bụi — **giống hệt nhau ở mọi hướng**. Một thành phố thật gần như luôn nằm cạnh một thứ gì đó
  quyết định vì sao nó ở đúng chỗ ấy: một con sông, một cửa biển, một con kênh đào, một khúc uốn ôm
  quanh — hoặc, với đúng **một** trường hợp trong bảng này, một sống núi khô không có nước nào cả.
  Đàm chốt thứ tự làm việc: *"chỗ đắt là BẢNG, không phải hình. Bốn lần trước đã chứng minh."*
- **Vấn đề**: nếu đi thẳng vào hình học thì mọi quyết định địa lý sẽ được ra **trong lúc đang viết
  mã dựng hình**, tức ra vội và ra một mình. Bốn lần trước (`vernacularRoof` · `undergrowth` ·
  `streetStyle` · `groundFloor`) đều cho cùng một kết quả đo được: thứ tốn thời gian và quyết định
  chất lượng là **15 dòng dữ liệu**, còn nhà máy hình học thì gần như viết thẳng ra được. Sửa một
  dòng chữ rẻ hơn sửa một dòng chữ đã có hình dựng theo.
- **Các phương án cân nhắc**:
  - **A — ba kiểu nước (`sea` / `river` / `none`), như Đàm nêu ban đầu.** Bác: gộp mất những HÌNH
    DẠNG khác hẳn nhau. Kênh Bridgewater THẲNG, bờ kè đá, nhà máy áp sát mép nước — người đào, không
    phải trời; cửa sông Tagus rộng hàng cây số nhưng **vẫn còn bờ bên kia**; suối Elzbach thì BAO
    LẤY mỏm đá Burg Eltz ở ba mặt. Gộp `canal` vào `river`, `estuary` vào `sea`, `meander` vào
    `river` — cả ba đều là bảo nhà máy hình học dựng ra một sự thật khác.
  - **B — nhiều kiểu nước, một trục duy nhất.** Bác: 7 kỷ khai `river` sẽ ra 7 bức ảnh giống nhau.
    Thứ tách chúng là **thành phố NGỒI THẾ NÀO so với mặt nước** — nên có trục thứ hai `ground`
    (sống núi · ngang mặt nước · bờ đê · vách dốc · đất lấn).
  - **C — để `outskirts.js` khai hướng nước, `settingStyle` đọc lại.** Bác thẳng theo lệnh Đàm:
    *"quan hệ MỘT CHIỀU, `settingStyle` → `outskirts`. Hai chiều là cách hai bảng trôi khỏi nhau."*
    Lý do là câu hỏi chuẩn của dự án — *"ngoài đời hai thứ này có luôn đi cùng nhau không?"*: loài
    cây và hướng ra nước độc lập với nhau (Lisboa và Porto cùng cây cùng khí hậu, quay ra nước theo
    hai hướng khác nhau).
- **Giải pháp chọn**: **B**, cộng luật một chiều của **C**. `src/engine/city3d/settingStyle.js` là
  BẢNG 15 dòng (`country` · `city` · `water` · `side` · `ground` · `reach` · `width` · `note`), buộc
  vào `country` của `eraStyle.js` bằng test; `city3d/setting.js` (Bước B) sẽ là HÌNH; tầng cảnh chỉ
  ĐỌC. **Sáu kiểu nước**: `none` · `river` · `meander` · `canal` · `estuary` · `sea`. Ba luật của
  Đàm được viết thành assert **đếm được**, mỗi luật kèm một **đối chứng bơm bảng hỏng vào**:
  - *"Không có nước" là câu trả lời đúng, khai tường minh* ⇒ `assert.deepEqual(KHO, [1])`. Kỷ khô
    thứ hai xuất hiện thì đỏ; kỷ 1 được cấp nước cũng đỏ.
  - *Đừng cho quá nửa số kỷ có biển* ⇒ `MAX_SEA_ERAS = 7` (đúng "dưới một nửa" của 15), hiện dùng 3.
  - *Hướng bờ nước phải khác nhau* ⇒ cả bốn hướng phải CÒN SỐNG, và **hiệu giữa hướng đông nhất với
    hướng thưa nhất ≤ `MAX_SIDE_SPREAD` (= 2)**. Hiện: bắc 3 · nam 4 · đông 4 · tây 3, hiệu **1**.
- ⚠️ **ĐÀM SỬA GÌ SAU KHI ĐỌC BẢNG — ba thay đổi, và mỗi cái sửa một loại sai khác nhau.**
  1. **Kỷ 5 phải CÓ NƯỚC (sai SỰ THẬT).** Bản đầu khai `water: 'none'` và tự khen đó là một dòng
     trung thực. Đàm bác: *"Burg Eltz đứng trên mỏm đá ~70 m, suối Elzbach **uốn quanh ba mặt** —
     đó chính là lý do lâu đài nằm ở đó: nước chắn ba phía, chỉ còn một lối vào phải giữ."* Bỏ nước
     đi là bỏ mất **câu trả lời cho chính câu hỏi mà mỗi dòng phải trả lời**. Anh ra kèm điều kiện
     *"đừng ép nó vào `river` nếu hình dạng khác thật"* ⇒ thêm kiểu thứ sáu **`meander`**: về TOPO
     `river` chia khung hình làm hai nửa (bên này bờ, bên kia bờ) còn `meander` thì nước BAO LẤY
     đất và đẻ ra **một lối vào duy nhất**. `side` vẫn giữ **một** nghĩa (*"hướng có mặt nước"*);
     với `meander` thì nước phủ `side` cộng hai hướng kề, hướng đối diện là dải yên ngựa khô — một
     luật về HÌNH suy ra từ một hướng, KHÔNG phải trường `side` gánh việc thứ hai.
     ⇒ Kéo theo: **kỷ 8 (Lisboa) phải đổi `reach 2 → 1` và `width 7 → 6`** để lọt luật Q2 mới bên
     dưới; reach 1 cũng ĐÚNG HƠN cho Lisboa, nơi khu Baixa chạy thẳng ra mép nước.
  2. **Kỷ 11 phải là `estuary`, không phải `sea` (sai KHỚP giữa `kind` và `note`).** Đàm: *"Hudson
     ở Manhattan là cửa sông chịu triều, không phải biển khơi."* Hai lựa chọn anh đưa ra là giữ
     ảnh bến tàu bờ tây ⇒ `estuary`, hoặc giữ `sea` ⇒ viết lại `note` thành vịnh cảng. Chọn vế đầu
     vì **hai lý do độc lập**: (a) của cải thời Gilded Age đi qua **bến tàu** bờ Hudson chứ không
     qua vịnh; (b) vịnh nằm phía NAM, đổi sang đó cho ra bắc 3 · nam 5 · đông 4 · tây 2 = hiệu
     **3**, tức vi phạm chính luật (3) vừa siết ở mục 3 dưới đây.
  3. **Luật (3) phải là một QUAN HỆ, không phải một mức tuyệt đối (sai HÌNH DẠNG).** Bản đầu viết
     `MAX_ERAS_PER_SIDE = 6`. Đàm chỉ thẳng ra đó là **bẫy Phase 7D** — cùng hình dạng với lời hứa
     *"mặt đường nhạt hơn đất"* bị viết thành một hằng số rồi chết trong im lặng khi mặt đất bị
     chỉnh vì một lý do khác. Một mức tuyệt đối ở đây có ĐÚNG hai cách hỏng: **quá rộng** (bảng
     6·3·2·2 dồn rõ rệt về một phía mà không hướng nào chạm 6) và **trôi theo số kỷ** (thêm một kỷ
     có nước là con số 6 tự hết nghĩa, mà nó không tự đỏ). Thay bằng `MAX_SIDE_SPREAD = 2`, kèm
     một đối chứng nhốt đúng bảng 6·3·2·2 và đòi phép kiểm phải TỪ CHỐI nó.
- ⚠️ **LUẬT Q2 — NƯỚC PHẢI NẰM GỌN TRONG ĐỊA HÌNH, KHOÁ BẰNG QUAN HỆ CHỨ KHÔNG BẰNG SỐ 8.** Đàm:
  *"Kỷ 15 đang `reach 6` trên vùng quê rộng 8. Nếu ai đó thu `OUTSKIRT_REACH` xuống 5 thì mặt nước
  kỷ 15 rơi ra ngoài địa hình và **không có gì đỏ lên**."* Bài test `import` thẳng `OUTSKIRT_REACH`
  từ `outskirts.js` và đòi `mépXa ≤ OUTSKIRT_REACH` ở cả 15 kỷ.
  - ⚠️ **Công thức lệch nửa bề rộng so với công thức Đàm viết (`reach + width/2`), và nói thẳng vì
    sao**: `reach` là khoảng cách ra tới **mép GẦN** của dải nước, nên mép XA nằm ở `reach + width`
    chứ không phải `reach + width/2`. Ý ĐỊNH được giữ nguyên; chỉ con số là **chặt hơn**.
  - ⚠️ **Phép kiểm sống ở BÀI TEST chứ không ở `isValidSetting`**: mã sản phẩm mà `import`
    `OUTSKIRT_REACH` là dựng đúng chiều NGƯỢC của luật một chiều Đàm ra (`settingStyle` →
    `outskirts`), lại còn đẻ ra một vòng import khi `outskirts.js` gọi `hasWater` ở Bước B.
  - Kỷ chật nhất hiện là **kỷ 4 ở 7,6/8** (dư 0,4 ô), và con số 4 ấy được assert luôn — kỷ chật
    nhất đổi thì đỏ, để phiên sau biết mà đo lại.
- **Trade-off**:
  - ⚠️ **Bản đầu có một cặp trùng khít — kỷ 1 và kỷ 5 giống nhau trên MỌI trường hình học** — và nó
    đã được xử theo khuôn `assert.deepEqual(KHONG_VUA_DAI, ['barrel'])` của Phase 11: đếm ca ấy ra
    tường minh. Sửa dòng kỷ 5 **xoá luôn cặp trùng**, đúng như Đàm nói trước: hai kỷ tách nhau ra
    *"bằng một sự thật lịch sử chứ không bằng một trục bịa thêm"* — kỷ 1 là sống đá vôi KHÔ chọn vì
    TẦM NHÌN, kỷ 5 là mỏm đá trong khúc uốn chọn vì THẾ THỦ. Assert nay là
    `assert.deepEqual(trung, [])`, và vì `deepEqual(…, [])` là kiểu assert dễ xanh-rỗng nhất nên nó
    đi kèm một **đối chứng bắt buộc** chứng minh phép lấy vân tay còn phân biệt được (bơm hai dòng
    giống hệt vào ⇒ phải bắt được).
  - ⚠️ **KHÔNG thêm `GROUND_FORM` thứ sáu** — Đàm cấm thẳng. Năm dạng hiện có tả đủ, và một trục
    mới thêm vào chỉ để tách hai dòng là đúng thứ luật (2) cấm.
  - Bảng chưa dựng ra một tam giác nào. Đó là chủ ý: Bước B chỉ làm hình cho **3 kỷ** — **biển kỷ 14
    (Singapore)** · **sông kỷ 12 (Nga, `width 3,4`, rộng nhất bảng)** · **khô kỷ 1 (Thổ Nhĩ Kỳ)** —
    rồi dừng để Đàm xem; Bước C mới trải 12 kỷ còn lại. ⚠️ Kỷ khô đổi từ 5 sang **1** đúng vì mục 1
    ở trên, và Đàm nêu rõ vai của nó: *"kỷ 1 làm chứng cho ràng buộc cứng — kỷ không nước giữ
    nguyên mốc lệnh vẽ, không đổi một đơn vị."*
- **Ảnh hưởng**: `settingStyle.js` + `settingStyle.test.js` (**13 bài**, cả 13 đã thử-cho-đỏ đúng
  chỗ đã nêu trước). Đếm hiện hành: **khô 1** · river 7 · meander 1 · canal 1 · estuary 2 · **sea
  3**; **14 kỷ có nước**; hướng **bắc 3 · nam 4 · đông 4 · tây 3** (hiệu 1). Chưa file nào khác đọc
  bảng này — nó sẽ được `outskirts.js` gọi ở Bước B qua đúng một cửa `hasWater(era)`.
- **Điều kiện xem lại**: khi có kỷ thứ 16; khi số kỷ có biển chạm 7; khi hiệu giữa hai hướng chạm 2;
  hoặc khi `OUTSKIRT_REACH` bị đổi (luật Q2 sẽ đỏ trước). ⚠️ Một dòng địa lý sai thì `note` bên cạnh
  nó vẫn kể một câu chuyện rành mạch cho con số sai ấy — nên bảng này phải được đọc bằng MẮT NGƯỜI,
  không chỉ bằng test. Kỷ 5 là bằng chứng: nó qua sạch 12 bài test rồi vẫn sai sự thật, và thứ bắt
  được là Đàm đọc.

---

## ADR-038 — "Cái khay" KHÔNG phải một cái MÉP: thành phố phải có VÙNG QUÊ, và vùng quê là một tầng ĐỊA LÝ nằm ngoài lưới — tách hẳn khỏi tầng TIẾN ĐỘ

- **Ngày**: 2026-08-19 (VIỆC 1 trong chỉ thị "bỏ cái khay" của Đàm; trả lời `TECH_DEBT #53`)
- **Bối cảnh**: Đàm nhìn thành phố rồi nói: *"Tại sao một thành phố lại được xây trên một ô đất nhô
  ra, đâu có thành phố nào như vậy, xem lại lịch sử đi. Nếu có ô đất nhô ra thì là cảnh thiên nhiên
  xung quanh."* Trước đó `TECH_DEBT #53` đã đo được vành đất ngoài lưới chiếm ~21% khung hình và
  63,0% toàn bộ chỗ trơ ở mốc 80 phiên — nhưng chẩn đoán đi kèm là *"tấm đất quá rộng"*.
- **Vấn đề**: ⚠️ **BA GIẢ THUYẾT ĐẦU ĐỀU SAI, VÀ CẢ BA ĐỀU BỊ CHÍNH SỐ ĐO BÁC BỎ.** (1) *"có một
  bức tường đứng ở `APRON_EDGE`"* — cao độ hai bên mép khớp tới **0,0000** ở kỷ 1, 7, 14. (2) *"chỗ
  nối màu giữa tấm đất và rặng núi bị gãy"* — cắt ngang qua 353 vị trí: bước màu một-điểm-ảnh lớn
  nhất **1,1/255**, tổng cộng **1,9** trải trên 60 điểm ảnh, trong khi ngưỡng mắt là 12. (3) *"vùng
  gần quá phẳng"* — bản vá gợn sóng đổi 25,6% điểm ảnh nhưng lệch trung bình chỉ 1,91 và **0 điểm
  ảnh** vượt ngưỡng mắt (đã hoàn tác). Thứ chỉ ra sự thật là **phủ ranh giới các vùng lên chính tấm
  ảnh render**: không có mép nào ở cả hai ranh giới. **Cái khay là hình chữ nhật đường-và-nhà dừng
  đột ngột giữa một mặt phẳng trống trơn** — mắt tự vạch ra đường viền ấy từ chỗ NỘI DUNG hết, chứ
  không từ chỗ HÌNH HỌC đổi.
- **Các phương án cân nhắc**:
  - **A — thu tấm đất lại cho vừa thành phố.** Rẻ nhất (hai hằng số). Bác: nó làm thế giới NHỎ đi để
    giấu một chỗ trống, và đi ngược hẳn câu Đàm nói (anh muốn *thêm cảnh thiên nhiên*, không phải bớt
    đất). Ngoài ra `APRON_EDGE` mang một lời hứa thật với `horizon.js` (Phase 9A đã trả giá bằng hai
    cái nêm sáng ở hai góc khung) — chạm vào nó là chạm vào một quan hệ đang đúng.
  - **B — siết khung hình cho vành đất ra ngoài mép ảnh.** Bác: cùng bản chất với A (giấu, không
    chữa), lại còn đá thẳng vào `TECH_DEBT #24` (khung đang cắt công trình ở 14/15 kỷ).
  - **C — LẤP: rải cảnh thiên nhiên ra ngoài lưới.** ✅ **CHỌN.** Đây là thứ duy nhất trả lời đúng
    câu hỏi *"vì sao thành phố này không có vùng ngoại ô?"* thay vì câu *"vì sao tấm đất rộng thế?"*.
- **Giải pháp chọn**: một tầng **VÙNG QUÊ** thuần — `src/engine/city3d/outskirts.js`,
  `deriveOutskirts({era, gridSize})` → danh sách cây/bụi/đá **CHỈ nằm ngoài lưới 12×12**, mật độ tắt
  dần ra xa theo `smoothstep` cộng một trường nhiễu tạo lùm, giống loài + cỡ + tỉ lệ bụi lấy thẳng từ
  bảng `floraStyle.js` đã có. Vùng quê **nhập vào khối gộp `city`** ⇒ **0 lệnh vẽ mới**.
- ⚠️ **VÌ SAO LÀ MỘT FILE RIÊNG, KHÔNG NHÉT VÀO `cityLayout.js`**: vùng quê là **ĐỊA LÝ**, còn
  `computeCityLayout` là **TIẾN ĐỘ**. Trộn hai thứ ấy là mời đúng cái bẫy *"một trường gánh hai
  việc"* đã cắn năm lần trong dự án này (`storyHeight` · `roof` · bảng loài cây · `avenue` ·
  `groundFloor`). Cây ngoại ô **không được** mọc thêm khi Đàm xây xong một căn nhà — nó là đất đai,
  có từ trước khi có thành phố. Khoá bằng một bài test gọi kèm **dữ liệu rác** (`built`, `levels`,
  `sessionCount`, `buildings`, `stats`) và đòi kết quả y hệt lần gọi sạch — đúng khuôn `terrain.js`
  đã dùng từ Phase 7B.
- ⚠️ **VÀ VÌ SAO NÓ KHÔNG CÓ BẢNG 15 KỶ RIÊNG**: cám dỗ hiển nhiên là viết một bảng mật độ cây riêng
  cho vùng quê. Bác — hai bảng sẽ trôi khỏi nhau, và triệu chứng ("cây trong phố rậm mà cây ngoài
  phố thưa, ở đúng vài kỷ") thì rất khó truy. Vùng quê **ĐỌC** `floraStyle.js`, và có một bài test
  khoá tương quan hạng giữa hai bên. Bảng 15 kỷ thật sự thuộc về VIỆC 2 (`settingStyle.js` — biển,
  sông, không nước), là một câu hỏi KHÁC: *"thành phố tiêu biểu của nước ấy nằm ở đâu và vì sao?"*
- **Trade-off**: (a) vùng quê đi chung khối gộp với thành phố ⇒ hộp bao của khối `city` phình
  **2,32 lần**: bán kính hình cầu bao đi từ **8,4836** (nhà + cảnh vật, đo bằng cách bảo bên dựng
  tách ba nhóm) lên **19,7239** (15 kỷ × 2 mốc tuổi). Hôm nay **không có gì bị cắt bởi camera** (đã
  đo ở `sceneStats.test.js`), nên giá bằng 0; ngày nào có người tách thành phố ra nhiều mesh thì
  phép cắt mới có nghĩa, và lúc ấy hộp bao rộng gấp 2,32 lần sẽ âm thầm vô hiệu hoá nó. ⇒ Đàm chốt
  **đặt hẳn một trần thành bài test** (`sceneStats.test.js`, ngưỡng **20,12** = số đo thật + 2%,
  kèm hai đối chứng: chống-phễu và "nội thành phải vẫn nhỏ ≤ 9"). Đổi lại: **0 lệnh vẽ mới ở cả 15
  kỷ**, giữ nguyên mốc `MOC_LENH_VE` từng kỷ.
  - ⚠️ **ĐÍNH CHÍNH — bản đầu của chính mục này ghi "phình từ 7,5 lên ~14", và con số ~14 là SAI.**
    Nó suy từ NỬA CẠNH (lưới nửa-rộng 6 + với tay 8 ô = 14) trong khi `computeBoundingSphere()` trả
    về bán kính hình cầu bao, mà cầu bao một hình VUÔNG thì lớn hơn nửa cạnh đúng √2 lần (14 × 1,414
    = 19,80 — khớp số đo 19,72). Đây là **lần thứ hai cùng một cái bẫy cắn trong cùng một ngày**:
    sáng cùng ngày đã phải đính chính "69% → 60,1%" vì đọc 13,5/8,5/7,5 như bán kính ĐĨA trong khi
    chúng là bán kính cầu bao của tấm VUÔNG. Bài học đã được ghi ra và vẫn tái diễn ⇒ đúng luật
    *"một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn được"* — nay đã có test. (b) tam giác tăng (hình học rẻ — `PERFORMANCE.md`: 80%
  chi phí theo ĐIỂM ẢNH, và vùng quê không thêm điểm ảnh nào vì nó thay thế mặt đất trơn đang có).
- **Ảnh hưởng**: đất trơ giảm **65,63→60,64%** (kỷ 3) · **64,82→38,61%** (kỷ 12) · **64,15→52,44%**
  (kỷ 14). Phần `trong lưới` gần như đứng yên (18,38→18,34 · 11,66→11,16 · 8,63→8,56) — bằng chứng
  trực tiếp rằng ADR-007 ("bảo tàng bất động") và luật "chỉ thêm, không bao giờ dời" còn nguyên.
- ⚠️ **Một nợ mới lộ ra khi làm, và nó CÓ TỪ TRƯỚC**: `planCityFocus` chỉ biết công trình, không biết
  địa hình. Kỷ 8 có mặt đất vùng quê dâng tới **+2,18** nên camera đã có thể chui qua sườn đồi ấy từ
  trước phase này. **Cách sửa SAI** là nhét cây vùng quê vào `blockers` — chặn cây mà không chặn đồi
  là chữa triệu chứng, và nó làm bài test kêu oan về một nguyên nhân sai. Ghi ở `TECH_DEBT #54`.
- **Điều kiện xem lại**: khi VIỆC 2 dựng nước/vách đá (địa hình sẽ cao và dốc hơn hẳn) · khi phép cắt
  theo hộp bao thật sự bắt đầu loại được khối · nếu có phase nào cần vùng quê đổi theo tiến độ (lúc
  ấy phải viết ADR mới ĐẢO NGƯỢC mục này, đừng lặng lẽ thêm tham số).

---

## ADR-037 — Mảng phủ đất: đất trống là một câu hỏi về **CÔNG NĂNG**, không phải một chỗ thiếu cây; và một mảng phủ phải là **MẢNG RIÊNG** chứ không phải một `kind` mới của cảnh vật

- **Ngày**: 2026-08-19 (§2-C của chương trình mật độ; mở đường cho §2-B)
- **Bối cảnh**: đo trên khung hình đã sửa (`TECH_DEBT #49` — trước đó 12,9% tấm ảnh không phải cảnh
  3D và 23 dòng cuối chưa từng được vẽ): **"đất trống" chiếm 46,17% khung hình ở 20 phiên, 38,52%
  ở 50 và 35,88% ở 80**. Tức gần một nửa thứ Đàm nhìn thấy ở thành phố trẻ là mặt đất trơn. Cố vấn
  đề nghị hai hướng — **B**: cho nhà dân hiện sớm hơn; **C**: lấp đất bằng thứ không phải nhà. Đàm
  chốt **làm C trước**, với ba lý do đo được: C gần như không đụng ADR-007 (nhà không dời), C là
  phép thử rẻ cho chính câu hỏi của B, và thành phố GIÀ vốn đã kín nên B chỉ giúp được đầu trẻ
  trong khi C giúp cả hai đầu.
- **Vấn đề**: ba phase gần nhất (8D cây · 10 tầng trệt · 11 mái) đều đã thêm chi tiết, và đất trống
  vẫn 46%. Phase 8D còn đo ra một điều dứt khoát: ở thành phố trưởng thành lưới cảnh vật lấp **kín
  144/144 ô** mà đất vẫn trống. Nghĩa là **thêm cây không phải câu trả lời**, vì *"có một cái cây
  trong ô"* và *"ô ấy được dùng vào việc gì"* là hai câu khác nhau — một cái cây là vật NHỎ đứng
  giữa một ô RỘNG, che vài phần trăm ô rồi thôi. Thứ lấp được đất là thứ con người **LÀM VỚI ĐẤT**:
  sân, vườn rào, sân phơi, bãi quây, đống rơm, giếng, quảng trường lát đá — chúng RỘNG (gần trọn ô)
  và THẤP, đúng ngược với cây.
- ⚠️ **TRẢ LỜI TRƯỚC KHI VIẾT MÃ — C phục vụ khung TOÀN CẢNH**, đúng luật Đàm ra sau Phase 11
  (`CLAUDE.md`, HỆ QUẢ 2b). Lý do đo được: ở khung mặc định **một ô lưới rộng 60–90 điểm ảnh, gấp
  5–7 lần ngưỡng mắt 12**, trong khi một cái ống khói Phase 11 chỉ còn 3–5 điểm ảnh. Một mảng phủ
  cỡ gần trọn ô là thứ DUY NHẤT trong bốn phase gần đây chắc chắn sống sót ở thang toàn cảnh. Chi
  tiết bên trong mỗi mảng (cọc rào, thành giếng) là phần thưởng khi bay tới gần và **không được
  dùng để biện minh cho cả phase**.
- **Phương án đã cân nhắc**:
  1. **Thêm `kind` mới vào `deriveProps`** (`yard`, `garden`… đứng cạnh `tree`/`rock`/`lamp`). Rẻ
     nhất, tái dùng trọn bộ máy có sẵn. **Loại vì hai lý do độc lập.** (a) Một ô phải trả lời được
     HAI câu độc lập — *"vật gì đứng đây"* và *"mảnh đất này dùng làm gì"* — mà một danh sách
     `props` mỗi ô một mục thì chỉ trả lời được một; cùng hình dạng *"một trường gánh hai việc"* đã
     cắn năm lần (`storyHeight` · `roof` · bảng loài cây · `avenue`). (b) Nó buộc phải sửa
     `deriveProps`, tức **đụng thẳng vào bất biến "chỉ thêm, không bao giờ dời"** mà §2-B sắp phải
     dựa vào — một cái cây dời chỗ là ADR-007 vỡ.
  2. **Phóng to cây / thêm cây cho dày**. Không tốn kiến trúc nào. **Loại**: Phase 8D đã đo — lưới
     kín 144/144 ô mà đất vẫn trống. Đây là phương án đi lại đúng con đường vừa chứng minh là cụt.
  3. **Vẽ hoa văn lên chính mặt đất** (đổi vân bề mặt theo ô). Rẻ nhất về hình học. **Loại**: nó
     đổi BỀ MẶT chứ không đổi ĐƯỜNG VIỀN, mà Phase 11 đã đo ra rằng thứ sống sót ở xa là thứ phá
     đường viền (lan can đổi 8,4% điểm ảnh; ngói bò tốn nhiều hình học nhất bảng mà chỉ đổi 1,2%).
     Nó cũng cần một vật liệu/hoạ tiết mới, tức chạm vào đúng bốn thứ Đàm CẤM tiêu.
- **Giải pháp chọn** — khuôn ba lớp lần thứ **SÁU** (sau `streetStyle` · `floraStyle` ·
  `groundFloorStyle` · `roofStyle` · `vernacularRoof`), cộng **ba quyết định riêng của lần này**:
  - **BẢNG** `city3d/groundCoverStyle.js` — 15 dòng, mỗi dòng buộc vào `country` mà `eraStyle.js`
    khai (**có test bắt**), trả lời *"ở nước ấy mảnh đất cạnh nhà dùng làm gì?"*. `isValidGround
    CoverStyle` **TỪ CHỐI THẲNG** dòng sai, không tự chữa — tự chữa là cách một bảng 15 dòng lặng
    lẽ thoái hoá về 1 dòng (bẫy `MIN_STONE`, Phase 9D). File riêng **ngay từ đầu**, không phải dọn
    ra sau như ADR-029.
  - **HÌNH** `city3d/groundCover.js` — 7 kiểu, mỗi kiểu ≥2 biến thể hình học theo hạt giống.
  - **NƠI DÙNG** `cityLayout.js` → mảng **`covers` RIÊNG**; `propSpec.js`/`cityParts.js` chỉ ĐỌC.
    ⇒ `deriveProps` **không bị sửa một dòng nào**, nên *"chỉ thêm, không bao giờ dời"* đúng **theo
    cấu trúc**. Đây là điểm quan trọng nhất của ADR này. ⚠️ Nhưng *"đúng theo cấu trúc"* là đúng
    loại lời hứa chết trong im lặng khi phiên sau đổi cấu trúc, nên nó **cũng đã được viết thành
    hai bài test** (`cityLayout.test.js`, nhóm `CHỈ THÊM`). Điều phép phá dạy thêm: dời một CÔNG
    TRÌNH làm đỏ sáu bài (`BẤT BIẾN #2` đã canh từ lâu), còn dời một NHÀ DÂN theo số phiên chỉ làm
    đỏ **một** — tức trục NHÀ DÂN × THỜI GIAN, đúng trục §2-B sắp vặn, trước nay chưa ai canh.
  - **Ô nào được CHIA CHUNG với cảnh vật là một phép ĐO, không phải một sở thích.** Đo 15 kỷ × 8
    hạt: cây vươn tới 0,415 và đèn 0,225 — lọt vào trong hàng rào ở ±0,43; bụi 0,545 và đá 0,50 —
    không lọt. `COVER_CAN_SHARE = {tree, lamp}`. Hai loại bị loại đều **NẰM TRÊN** mặt đất, hai
    loại được nhận đều **MỌC LÊN** từ một điểm — cái đó mới là luật, con số chỉ là bằng chứng.
  - **0 lệnh vẽ mới, ĐÃ ĐẾM chứ không suy.** Bốn vai được phép: `stone`/`wood`/`leaf` ánh xạ thẳng
    (`ROLE_FAMILY`) sang ba họ có mặt ở **15/15 kỷ**, còn `wall` KHÔNG có trong `ROLE_FAMILY` nên
    rơi về `style.wallMaterial` — vật liệu tường của chính kỷ đó, **miễn phí theo định nghĩa**.
    Đếm thật ở cả 15 kỷ (14–42 mảng mỗi kỷ ở mốc gate 40 phiên): **0 họ mới**, `MOC_LENH_VE` không
    đổi một đơn vị. ⚠️ `water` bị **CẤM** — nó chỉ có ở 7/15 kỷ, nên một cái ao (nghe rất hợp với
    kỷ 6) là một lệnh vẽ phải trả bằng một mục nợ, không phải thứ lén thêm.
- ⚠️ **MỘT KHUYẾT TẬT DO CHÍNH ADR NÀY SINH RA, TÌM ĐƯỢC BẰNG PHÉP ĐO CHỨ KHÔNG BẰNG ĐỌC MÃ.**
  Ngân sách mảng phủ bản đầu viết `min(MAX, floor(ungVien × share), 4 × nhà + phiên)` — đặt một
  **PHẦN** (`share`) cạnh một **LƯỢNG** (`4 × nhà + phiên`) trong cùng một `Math.min`, kèm một chú
  thích tự tin *"hai trần, hai việc khác nhau"*. Cả ba bộ test đều XANH, vì
  `groundCoverStyle.test.js` chỉ hỏi cái BẢNG và `groundCover.test.js` chỉ hỏi cái HÌNH — **không
  bài nào hỏi *"con số trong bảng có tới được thành phố không"***. Đo ra: ở mốc **20 phiên** (mốc
  đất trống tệ nhất) vế lượng ăn trọn vế phần ở **8/15 kỷ** — tám kỷ khai tám `share` khác nhau,
  cùng dựng ra ĐÚNG 40 mảng; ở mốc 4 phiên thì **cả 15 kỷ ra đúng 24**. Đây chính là bẫy
  `MIN_STONE` (Phase 9D) và bẫy trường nhiễu (Phase 7B), lần này do chính tay tôi cài vào ngay
  trong phase đang viết ra luật cấm nó.
  **Vá đúng** (cùng khuôn ADR-021 đã dùng cho cây): giữ nguyên Ý ĐỊNH, đổi ĐƠN VỊ — công sức thành
  một **hệ số nhân** lên chính `share` (`nhipCongSuc = min(1, (4 × nhà + phiên) / số ứng viên)`),
  nên nó làm cả 15 kỷ CÙNG chậm lại mà không kỷ nào mất thứ hạng. Khoá bằng **ba** bài ở
  `cityLayout.test.js`, trong đó đối chứng N1 **dựng lại nguyên văn công thức cũ** và đòi phải đỏ.
  ⇒ **Luật rút ra: một bảng bản sắc phải được canh ở CẢ HAI ĐẦU** — đầu KHAI (validator từ chối
  dòng sai) và đầu DỰNG (con số ấy có thật sự tới được màn hình không). Bốn phase gần đây chỉ canh
  đầu khai, và đó là lý do khuyết tật này sống sót qua 16 bài test mới toanh.
- ⚠️ **TRẦN CỦA CHÍNH PHƯƠNG ÁN C — đo được, và nó nhỏ hơn tôi tưởng.** Ép `share = 1,00` (phủ MỌI
  ô đất trống) ở mốc 20 phiên: kỷ 1 đi từ 60,29% xuống **53,16%** (−7,13 đpt), kỷ 14 từ 45,15%
  xuống 38,81% (−6,33). Nghĩa là **ô đất trống trong lưới chỉ chiếm ~12–16% số điểm ảnh "đất" mà
  Đàm nhìn thấy**; phần lớn còn lại là **vạt đất ngoài lưới thành phố** (mặt đất bán kính 13,5
  trong khi cả thành phố chỉ rộng ~7,5 ⇒ theo hình học thì ~69% diện tích mặt đất nằm ngoài phố).
  ⇒ **§2-B cũng sẽ đụng đúng cái trần này**, vì nhà dân cũng chỉ mọc trong lưới. Muốn ăn vào phần
  còn lại thì phải là một việc KHÁC (ruộng ngoại ô, mở rộng lưới, hoặc kéo camera vào gần hơn) —
  và đó là một quyết định của Đàm, không phải thứ tự quyết trong phase này.
- **Kết quả đo (120 ảnh mặt nạ, hai cây mã, cùng một dòng lệnh)**: đất trống **46,17 → 44,84**
  (20 phiên) · **38,52 → 36,23** (50) · **35,88 → 34,77** (80); **45/45 ô đều giảm**. Mặt nạ thứ
  hai xác nhận đất chảy đúng sang mảng phủ (cảnh vật+mảng phủ 1,58 → 4,40; tổng hai Δ = +0,49).
  Bản quét 15 kỷ vẫn 15/15 cặp chặng · 105/105 cặp kỷ. ⚠️ Mức giảm ở mốc 20 phiên **tụt từ −2,56
  xuống −1,05 đpt sau khi vá khuyết tật ngân sách ở trên** — cố ý KHÔNG chỉnh `share` lại cho đẹp
  số, vì đó đúng là "nới cổng cho vừa kết quả".
- **Trade-off**:
  - ⊖ Thêm một bảng 15 dòng nữa phải bảo trì, và một trục bản sắc nữa phải giữ cho không trôi.
  - ⊖ Mảng phủ đi vào nhóm `props` khi đo bằng mặt nạ, nên bảng mật độ cũ (`buildings,ground,road`)
    thấy đất giảm mà không thấy nó chảy đi đâu — phải đo thêm một mặt nạ `buildings,ground,props`
    để **gọi tên cái sọt**, đúng luật đã học ngày 2026-08-19.
  - ⊕ Đổi lại: nó phục vụ **cả hai đầu** (trẻ lẫn già), không đụng ADR-007, và không tiêu một lệnh
    vẽ nào.
- **Ảnh hưởng**: `cityLayout.js` (+`deriveGroundCover`, +`MAX_GROUND_COVER`), `cityParts.js`,
  `propSpec.js`, `sceneGraph.js` (mảng phủ xoay theo bội số 90° — `gridAligned`, vì một cái sân
  xoay 37° trông như rác), `render2d/CityTile.jsx` + `CityCanvas2D.jsx` (bắt buộc: `CityTile` trả
  `null` **trong im lặng** cho kiểu lạ, nên quên là bản 2D lặng lẽ thưa đi).
- **Điều kiện xem lại**: (a) khi §2-B chạy xong — mật độ nhà tăng thì đất trống giảm tiếp, có thể
  phải hạ `share` ở vài kỷ; (b) khi có kỷ thứ 16; (c) nếu cổng hiệu năng iPhone (`TECH_DEBT #23`/
  `#26`) trượt — mảng phủ là hình học thuần nên nó thuộc nhóm RẺ theo `PERFORMANCE.md`, nhưng câu
  đó chưa được đo trên iPhone lần nào.

---

## ADR-036 — Ảnh nghiệm thu: **HỎI trình duyệt canvas nằm đâu** (CDP `clip`), và chụp thành **DẢI NGANG** vì ổ cắm CDP có trần cứng 4 MiB

- **Ngày**: 2026-08-19 (đóng `TECH_DEBT #49`, mở `#50`)
- **Bối cảnh**: `city-preview.mjs` là công cụ sinh ra MỌI ảnh nghiệm thu của thành phố 3D — bản
  quét 15 kỷ, ảnh cận cảnh, ảnh mặt nạ để đo mật độ. Nó chụp bằng `--screenshot` + `--window-size`,
  trong đó cỡ cửa sổ được ĐOÁN là `(width + 34, height + 80)`. Trong hộp cát này `+80` thiếu 23
  điểm ảnh, nên **23 dòng cuối của mọi khung hình chưa bao giờ được vẽ ra**, còn ảnh PNG vẫn cao
  đúng 780 vì Chromium phủ nốt bằng nền trang. Không có gì đỏ lên suốt nhiều tháng.
- **Vấn đề**: một công cụ đo **KHẲNG ĐỊNH** thay vì **HỎI**. Ba cờ đều là lời khẳng định về một thứ
  chỉ trình duyệt mới biết: cỡ khung nhìn (`--window-size`, còn có SÀN 500px trong headless), thời
  điểm cảnh vẽ xong (`--virtual-time-budget` tua nhanh ĐỒNG HỒ chứ không tua nhanh CPU), và vùng
  cần chụp (`--screenshot` chụp cả cửa sổ).
- **Phương án đã cân nhắc**:
  1. **Nới `+80` thành `+103`** (số đo được). Rẻ nhất, một dòng. **Loại**: thay một con số đoán
     bằng một con số đoán khác — nó trôi lại ngay khi ai đó đổi bố cục trang, thêm thanh cuộn, hay
     chạy ở DPR khác. Đàm bác thẳng: *"đừng áp nửa vời ở chỗ này rồi chặt chẽ ở chỗ kia."*
  2. **Khai toạ độ canvas ra `.geom.json` rồi cắt theo.** Đã thử — **VẪN SAI**, vì con số KHAI
     (canvas cao 700) lớn hơn số dòng THẬT SỰ được vẽ (677). Một toạ độ khai không phải một toạ độ
     đo.
  3. ✅ **Hỏi `getBoundingClientRect()` rồi chụp CDP `Page.captureScreenshot` với `clip` đúng hộp
     bao đó**, kèm một cổng TỪ CHỐI CHẠY nếu hộp bao thò ra ngoài khung nhìn.
- **Quyết định**: phương án 3. Khung nhìn đặt bằng `Emulation.setDeviceMetricsOverride` (bố cục
  thật, không dính khung cửa sổ, không dính sàn 500px); đợi bằng tín hiệu thật của trang
  (`document.body.dataset.ready`); chụp đúng hộp bao đo được. Cổng `kiemKhungNhin` là hàm THUẦN,
  xuất ra, có `--selftest` **nhốt đúng bộ số hỏng cũ** (1134×693 phải báo thiếu đúng 23 dòng).
- **Trần 4 MiB và phép chia dải**: vá xong cái xén thì lượt dựng lại mốc nền đầu tiên **chết giữa
  chừng** với đúng một dòng *"ổ cắm CDP lỗi"*. Đo ra: **một tin nhắn CDP không được quá 4 MiB**
  (`4.194.264` byte base64 thì chạy, nhích thêm là đứt ổ cắm), mà bản quét 15 kỷ cần ~9 MB.
  Bốn cách ra:
  1. **Chấp nhận trần, báo lỗi cho rõ ràng.** Loại — công cụ từ chối làm việc chính của nó.
  2. **Cho trang tự mã hoá canvas rồi POST qua HTTP.** Chạy được cho BẢNG QUÉT (đó là canvas 2D do
     trang tự dựng), nhưng KHÔNG chạy cho ảnh đơn: ảnh đơn phải giữ **lớp viền tối góc** — một lớp
     CSS phủ lên canvas, tức chỉ ảnh chụp trang mới có. Dựng lại lớp ấy trong canvas là "một luật
     hai công thức".
  3. **Tắt permessage-deflate của ổ cắm.** Node không cho tuỳ chọn ⇒ phải tự viết một client
     WebSocket. Nhiều bề mặt mới trong một công cụ đo.
  4. ✅ **Chụp thành DẢI NGANG, ghép ở phía Node.** Một luật cho MỌI đường chụp, không giới hạn cỡ
     ảnh, giữ nguyên lớp viền tối góc, và **kiểm được bằng test thuần**.
- **Trade-off**: phải tự viết phép GHI PNG (`encodePng` + `ghepDoc`, đặt cạnh phép ĐỌC trong
  `png-probe.mjs` vì cùng một định dạng thì phải cùng một file). Đổi lại có một bài test rất mạnh:
  **cùng một ảnh, ghép từ ba dải phải ra BYTE GIỐNG HỆT ảnh ghi một lần** — chạy cả hai bên rồi so
  với nhau, không so bên nào với một hằng số thứ ba. Cái giá thứ hai: ảnh nay do ta mã hoá chứ
  không phải Chromium, nên `md5sum` cũ không tái lập được — nhưng mốc nền dù sao cũng phải dựng lại
  vì bản vá xén.
- **Ảnh hưởng**: mọi con số đo trên ảnh trước 2026-08-19 **không so trực tiếp được** với số mới
  (đã ghi thành một mục riêng trong `PERFORMANCE.md`, đúng cách `TECH_DEBT #22` xử lý bộ lọc "8%
  mái"). Tam giác / lệnh vẽ / ms mỗi khung KHÔNG bị ảnh hưởng — chúng đọc từ `renderer.info`, và
  bộ đệm vẽ luôn là 1100×700; thứ bị xén là phần HIỂN THỊ, không phải phần RENDER.
- **Điều kiện xem lại**: nếu Node cho phép chỉnh trần tin nhắn WebSocket, hoặc nếu một phiên bản
  Chromium sau này cho `Page.captureScreenshot` ghi thẳng ra file, thì phép chia dải thành thừa —
  nhưng **đừng gỡ nó chỉ vì thế**: nó cũng là thứ giữ cho ảnh không phụ thuộc vào một trần ẩn.
- **Hệ quả kèm theo (`TECH_DEBT #50`)**: trong lúc chứng minh phép ghép đúng, đo ra rằng
  **`md5sum` của ảnh dựng đổi theo TẢI MÁY** (±1 trên ~2% điểm ảnh). Nên md5 chỉ đọc được một
  chiều: *trùng ⇒ y hệt* (các lời hứa cũ, kể cả ADR-034, vẫn đứng vững), còn *khác ⇏ đã đổi*.

---

## ADR-035 — Chữa va chạm cận cảnh: **LÙI RA TRƯỚC, NGẨNG SAU** (đảo nửa sau của ADR-034); và một phép lấy mẫu rời rạc phải trả về BIÊN CHỨNG MINH ĐƯỢC, không phải khoảng cách đo được

- **Ngày**: 2026-08-18 (đóng `TECH_DEBT #46`, sửa một lỗ hổng trong chính ADR-034)
- **Bối cảnh**: ADR-034 dựng chế độ cận cảnh và xếp thứ tự chữa va chạm là **ngẩng lên → lùi ra →
  đứng yên**, với lý lẽ *"mất ít nhất trước"*: ngẩng thì vật vẫn to bằng ấy, lùi thì vật nhỏ đi.
  Cùng ADR ấy đã tự ghi nhận cái giá: kỷ 15 phải ngẩng **65,3°**, và ở góc đó tầng trệt gần như
  biến mất. Nó không tự chốt mà ghi thành `TECH_DEBT #46` để Đàm quyết, vì đây là lựa chọn MỸ
  THUẬT.
- **Vấn đề**: lý lẽ *"mất ít nhất"* đo bằng ĐỘ PHÓNG TO — một chiều duy nhất. Nó bỏ sót chiều thứ
  hai: ngẩng quá cao thì vật vẫn to nhưng **MẶT ĐỨNG của nó biến mất**. Mà chế độ cận cảnh sinh ra
  để cho xem đúng hai thứ: tầng trệt (Phase 10) và mái (Phase 11). Một cách chữa xoá sạch một
  trong hai thì không phải chữa, nó chỉ dời chỗ hỏng.
- **Phương án cân nhắc**: (a) **đảo thứ tự** — lùi ra trước, ngẩng sau. (b) **đặt trần góc ngẩng
  riêng cho cận cảnh** (ví dụ 50°), vượt trần thì mới chuyển sang lùi.
- **Lý do loại bỏ**: (b) đặt một **ngưỡng chưa hiệu chuẩn** (50° từ đâu ra?) đứng chắn trước đúng
  cái cơ chế lùi mà (a) dùng — tức nó vừa làm y hệt (a) ở những ca đã vượt trần, vừa thêm một con
  số không ai kiểm được. Đó là cái phễu Phase 9A đã dạy (*"một ngưỡng nới rộng cho chắc là một cái
  phễu"*). Đàm chốt (a) với hai câu: ***"(a) giữ được LỜI HỨA, (b) giữ được CON SỐ."***
- **Giải pháp chọn**: (a). `planCityFocus` nay chữa theo thứ tự **lùi ra (giữ nguyên góc) → ngẩng
  lên → đứng yên**. Kèm một bản vá thứ hai, độc lập nhưng cùng phiên:
  - ⚠️ **BIÊN CHỨNG MINH ĐƯỢC, không phải khoảng cách đo được.** `pathClearance` lấy 48 mẫu rời
    rạc dọc đường bay, nên nó chỉ biết 48 điểm chứ không biết cả đoạn. Khoảng-cách-tới-một-tập là
    hàm **1-Lipschitz**, nên giữa hai mẫu cách nhau `s` thì độ thoáng không thể tụt quá `s/2` ⇒
    biên bảo đảm là `gap − step/2`. `pathGuarantee` trả về cả ba (`gap`, `step`, `guaranteed`);
    bộ lập kế hoạch **nhận theo `guaranteed`** và **báo ra `gap`** (số so được với ảnh chụp).
    Đo trước khi vá: chuyến chật nhất có `gap` 1,002 với bước mẫu 0,3682 ⇒ biên thật chỉ **0,0016**
    trong khi cần **0,184** — tức lời hứa "cách một ô lưới" xưa nay chỉ chứng minh được tới ~0,82.
- **Trade-off**: vật nhỏ đi ở những ca phải lùi. **Đã đo, và cái giá gần bằng không**: so cùng kỷ ở
  khoảng cách lý tưởng 7,5 với ở ca xấu nhất, lệch trung bình cả khung thay đổi trong khoảng
  **−0,72 … +2,14** (có kỷ còn TĂNG, vì lùi ra thì lọt vào khung nhiều nhà hơn). **Không một kỷ
  nào tụt qua ngưỡng mắt vì việc lùi ra.** Đổi lại: **0/75 chuyến phải ngẩng**, góc nhìn giữ
  nguyên 34,4° ở cả 15 kỷ, kỷ 15 đi từ 65,3° về 34,4°.
- **Ảnh hưởng**: 0 lệnh vẽ · 0 tam giác · 0 điểm ảnh mới. Khung mặc định trùng **TỪNG BYTE** với
  trước khi sửa (kỷ 9, kỷ 15, và cả bản quét 90 ô). Chỗ phải lùi xa nhất là **11,00** (kỷ 15), tỉ
  lệ thu phóng tệ nhất **0,664** (kỷ 11) — tức **3 kỷ nay nằm ngoài dải 0,38–0,58** Đàm chốt ở
  ADR-034, ở ca xấu nhất của chúng. Đó là cái giá của (a), nói thẳng ra chứ không giấu.
- **Điều kiện xem lại**: khi có một công trình **RỘNG BẤT THƯỜNG** (xem `TECH_DEBT #47`) — lúc ấy
  khoá khoảng cách sẽ cắt mất hai đầu công trình và câu trả lời có thể phải là "khoá theo bề
  ngang", không phải theo khoảng cách. Hoặc khi Đàm thấy một kỷ nào đó lùi xa tới mức nhìn như
  toàn cảnh.

---

## ADR-034 — Chế độ cận cảnh khoá KHOẢNG CÁCH THẬT, để mức thu phóng tự khác nhau theo kỷ; và lưới an toàn canh CẢ ĐƯỜNG BAY chứ không chỉ điểm đến

- **Ngày**: 2026-08-18 (VIỆC 2 — camera cận cảnh)
- **Bối cảnh**: Phase 10 (tầng trệt) và Phase 11 (chi tiết mái) đổ công vào những thứ mà ở khung
  hình mặc định gần như KHÔNG NHÌN THẤY — đã đo và ghi thành `TECH_DEBT #41`: 90/90 ô bản quét nằm
  dưới ngưỡng mắt 12. Nguyên nhân gốc không phải đặt chi tiết sai chỗ mà là **cả thành phố quá nhỏ
  trong khung hình**: mỗi căn nhà chỉ cao chừng 40–60 điểm ảnh. Đàm yêu cầu một chế độ cận cảnh,
  kèm một ràng buộc CỨNG: **khung mặc định KHÔNG được đổi**.
- **Vấn đề**: yêu cầu ghi *"dừng ở mức thu phóng an toàn RIÊNG của kỷ đó (0,38–0,58)"*. Nhưng mức
  thu phóng là một TỈ LỆ nhân vào khoảng cách toàn cảnh, mà khoảng cách ấy trải **13,46 (kỷ 2) →
  19,01 (kỷ 15)** vì `cityOrbitOptions` đã lùi camera ra theo `massScale`. Đo trước khi viết: lấy
  MỘT tỉ lệ chung 0,45 thì công trình cao nhất phủ **44% khung ở kỷ 1 nhưng 122% ở kỷ 15** — chênh
  **2,8 lần**, và kỷ cuối bị cắt mất nóc đúng thứ đáng xem nhất.
- **Phương án đã cân nhắc**:
  1. **Một mức thu phóng chung** cho cả 15 kỷ.
  2. **Một bảng 15 mức thu phóng chọn tay**, chỉnh theo mắt từng kỷ.
  3. **Khoá KHOẢNG CÁCH THẬT, suy ngược ra mức thu phóng.**
- **Lý do loại bỏ**: (1) chính là cái 2,8 lần ở trên — nó không giữ được lời hứa nào. (2) là mười
  lăm lần chọn bừa: không có luật nào canh, nên nó sẽ trôi ngay lần đầu có người chỉnh `massScale`
  của một kỷ, đúng hình dạng *"một con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ"*
  (Phase 7D) và *"một bảng nhiều dòng vẫn có thể thoái hoá về một trần chung"* (ADR-028).
- **Giải pháp chọn**: (3). `FOCUS_VIEW_DISTANCE = 7,5` đơn vị thế giới, và mức thu phóng của mỗi kỷ
  = `7,5 / khoảng cách toàn cảnh của kỷ ấy` ⇒ **0,395 (kỷ 15) … 0,557 (kỷ 2)**, mười lăm giá trị
  khác nhau, tất cả nằm trọn trong dải Đàm chốt. Lời hứa mà cách này giữ được và cách (2) không:
  **số điểm ảnh trên mỗi đơn vị thế giới chỉ phụ thuộc khoảng cách**, nên một cái ống khói ở kỷ 1
  và một cái ở kỷ 15 chiếm ĐÚNG BẰNG NHAU số điểm ảnh. Con số 7,5 gần như bị ÉP chứ không phải
  chọn: ghép dải 0,38–0,58 với dải 13,46–19,01 thì cửa sổ hợp lệ chỉ còn **[7,22; 7,81]**.
  Kèm hai lưới an toàn:
  - **Canh CẢ ĐƯỜNG BAY, không chỉ điểm đến.** Lấy 48 mẫu dọc đường nội suy, đòi khoảng cách tới
    hộp bao gần nhất ≥ **1 ô lưới** (bằng bề rộng một căn nhà — kiểm bằng mắt được). Thứ tự chữa
    xếp theo "mất ít nhất trước": **ngẩng lên** → **lùi ra** → **đứng yên**. Phép tìm luôn dừng
    được vì trạng thái xuất phát hiển nhiên thoáng.
  - **Đếm được, không nuốt im lặng**: `raisedPitch` / `raisedDistance` / `blocked` được trả về —
    bài học Phase 10 Bước 2 (*"từ chối thẳng chỉ an toàn khi có người ĐẾM số lần từ chối"*).
- **Trade-off**: kỷ càng cao thì camera càng phải ngẩng. Kỷ 15 ra **65,3°** — gần như nhìn từ trên
  xuống, nên mái đọc rất rõ còn **tầng trệt gần như không thấy**. Thứ tự "ngẩng trước, lùi sau" là
  một lựa chọn MỸ THUẬT (đổi thành "lùi trước" sẽ giữ được góc nhìn ngang nhưng vật nhỏ đi);
  **chưa hỏi Đàm** ⇒ ghi thành `TECH_DEBT #46` thay vì tự chốt. ⚠️ Đàm đã trả lời 2026-08-18: **đổi thứ tự** — xem ADR-035, mục này giữ nguyên làm bản ghi lịch sử.
- **Ảnh hưởng**: **0 lệnh vẽ mới · 0 tam giác mới · 0 điểm ảnh mới** (cùng khung, cùng DPR) — chế
  độ này chỉ đổi chỗ đứng của camera. Khung mặc định BẤT BIẾN, chứng minh bằng `md5sum`: ảnh kỷ 9
  và kỷ 15 trùng **TỪNG BYTE** với bản dựng ở `ae2b4a0`. Chi tiết Phase 10–11 (so `b98a47d` với
  `e95cdf1`, cùng một dòng lệnh): ở khung toàn cảnh lệch trung bình **5,54 — DƯỚI ngưỡng mắt 12**;
  ở khoảng cách cận cảnh 7,5 lệch **15,45 — TRÊN ngưỡng**, và tỉ lệ điểm ảnh vượt ngưỡng đi từ
  **7,0% lên 17,0%**. Đây là lần đầu công sức của hai phase ấy được chứng minh bằng số là nhìn thấy
  được.
- **Điều kiện xem lại**: khi thêm một kỷ cao hơn kỷ 15 (dải [7,22; 7,81] có thể đóng lại — lúc ấy
  phải nới dải thu phóng chứ không được nhích 7,5 trong im lặng), hoặc khi Đàm muốn nhìn tầng trệt
  ở những kỷ cao (lúc ấy đổi thứ tự chữa thành "lùi trước, ngẩng sau").

---

## ADR-033 — `avenue` là PHẦN MẶT CẮT DÀNH CHO XE, không phải "đại lộ này oai tới đâu"; và một trục bản sắc phải được canh bằng thứ DỰNG RA, không phải thứ KHAI RA

- **Ngày**: 2026-08-18 (đóng `TECH_DEBT #42`)
- **Bối cảnh**: `STREET_STYLES` (ADR-025) có 10 trường, trong đó `avenue` (bề rộng đại lộ) và `walk`
  (bề rộng vỉa hè) phải cùng nằm gọn trong MỘT ô lưới: `avenue/2 + walk ≤ 0,5`. `streetCrossSection`
  xưa nay xử lý xung đột bằng một phép kẹp im lặng `walk = min(s.walk, room)`.
- **Vấn đề**: 8/15 kỷ bị kẹp, kỷ tệ nhất còn **11%** bề rộng đã khai. Kỷ 12 (Nga) khai `walk: 0,19`
  và `note` viết nguyên chữ *"vỉa hè mênh mông"*, trong khi màn hình dựng ra **0,02 ô ≈ 1,3 điểm
  ảnh** — lệch **9,5 lần**, và không có gì đỏ lên. Nguyên nhân bài test không bắt được: nó đọc
  `s.walk` (**đã KHAI**) chứ không đọc `streetCrossSection().walk` (**đã DỰNG**).
- **Phương án đã cân nhắc**:
  1. **Cho vỉa hè lấn sang ô đất bên cạnh.** Đúng nhất với đời thật (vỉa hè thuộc lộ giới, không
     thuộc lòng đường) nhưng đắt: phải hỏi ô hàng xóm là gì, tức thêm một phép hỏi kiểu
     `carriagewayShape`, và phải quyết ai sở hữu phần đất giáp ranh.
  2. **Giữ nguyên phép kẹp, ghi thành lời hứa tường minh** ("vỉa hè là đặc điểm của NGÕ").
  3. **Từ chối thẳng ở validator, sửa BẢNG cho khai được thứ dựng được.**
- **Lý do loại bỏ**: (1) đắt và mở một mặt trận mới về quyền sở hữu ô, trong khi bệnh gốc nằm ở
  *bảng khai sai*, không ở *hình học chật*. (2) là hợp thức hoá một lời nói dối: nó biến "8 kỷ đang
  bị bóp" thành "thiết kế là vậy", trong khi Champs-Élysées có **21m vỉa hè MỖI BÊN trên 70m mặt
  cắt** — vỉa hè rộng chính là đặc điểm của ĐẠI LỘ, không phải của ngõ.
- **Giải pháp chọn**: (3), và nó kéo theo một phát hiện lớn hơn cả cái kẹp — **`avenue` đang bị viết
  như thể nó trả lời câu *"đại lộ này oai tới đâu"*, trong khi mã đọc nó là *"bao nhiêu phần mặt cắt
  dành cho XE"*.** Hai câu ấy ngoài đời gần như NGƯỢC nhau: đại lộ càng sang thì phần dành cho người
  đi bộ càng nhiều. Vì vậy Paris `0,94 → 0,54`, Moskva `0,96 → 0,70`, Manhattan `0,92 → 0,62`,
  Singapore `0,90 → 0,54`, Dubai `0,96 → 0,84`. Không kỷ nào "bị hạ cấp" — chúng được sửa cho đúng.
  Kèm hai lưới:
  - `isValidStreetStyle` **TỪ CHỐI THẲNG** cả hai chiều: `walk > 0` mà dưới `MIN_WALK` (4 điểm ảnh)
    là sai, và `avenue/2 + walk > 0,5` cũng là sai. Không tự kẹp — đúng luật `MIN_STONE` (Phase 9D).
  - `walk: 0` vẫn **hợp lệ**: "nước này thời này đi bộ ngay trên lòng đường" là một sự thật lịch sử.
    Thứ bị cấm là khoảng GIỮA — một con số li ti dựng ra một vệt 1,3 điểm ảnh, thứ không phải vỉa hè
    mà cũng không phải "không có vỉa hè", và nó khiến `note` của kỷ ấy nói dối.
- **Trade-off**: `avenue` mất khả năng diễn đạt "mặt cắt phố tổng thể rộng bao nhiêu" — hôm nay
  không có trường nào mang nghĩa ấy, vì cả mặt cắt vẫn khoá cứng bằng một ô. Chấp nhận: 15 kỷ vẫn
  phân biệt được bằng 8 trục, và phương án (1) còn nguyên đó nếu sau này cần mặt cắt rộng thật.
- **Ảnh hưởng**: 0 lệnh vẽ mới; **−2.266 tam giác** (4 kỷ nhẹ đi, 11 kỷ không đổi, 0 kỷ nặng thêm) —
  lòng đường hẹp lại thì lưới lát cũng ít viên đi. Vỉa hè dựng ra nay **bằng đúng** con số khai ở
  **15/15 kỷ**; hẹp nhất 4,5 điểm ảnh (kỷ 15), rộng nhất 14,1 (kỷ 9). Bản quét 15 kỷ không trôi:
  105/105 cặp kỷ và 15/15 cặp chặng vẫn trên ngưỡng mắt.
- **Điều kiện xem lại**: khi có ai muốn một kỷ vừa đại lộ rất rộng vừa vỉa hè rất rộng (hai vế cộng
  lại quá một ô) — lúc ấy phương án (1) là lối duy nhất, và nó là một phase riêng.

---

## ADR-032 — ĐẤT giữ bậc thềm, ĐƯỜNG được san thành dốc thoải: hai loại ô, hai luật cao độ khác nhau

- **Ngày**: 2026-08-18 (Phase 12, Việc 1 — nguyên nhân 2/2)
- **Bối cảnh**: nửa còn lại của câu *"đường lòi lõm, mất tự nhiên quá"*. Nguyên nhân 1 (mép ngang,
  ADR-031) đã xong: 45% → 0%. Nửa này là **mặt cắt dọc**. Đo trên 80 ô đường ứng viên × 15 kỷ trước
  khi sửa: **235 chỗ ranh giới thềm cắt ngang qua đường**, **205 chỗ dốc quá mức một con phố thật
  có thể dốc**, chỗ tệ nhất **173%** (kỷ 7 — nghiêng 60°, tức nhảy 85% chiều cao một căn nhà trong
  đúng một ô). Con phố dân cư dốc nhất thế giới — Baldwin Street, Dunedin, New Zealand — dốc
  **34,8%**; hai con dốc nổi tiếng nhất San Francisco đều 31,5%. Tức thành phố đang có những đoạn
  phố dốc gấp năm lần thứ dốc nhất loài người từng lát nhựa.
- **Vấn đề**: `terrain.js` chia cao độ thành **thềm bậc** (`terraces` × `TERRACE_STEP × relief`).
  Với 10/15 kỷ, **một bậc thềm đã dốc hơn Baldwin Street** (kỷ 5: 0,675 đơn vị trên một ô = 101%).
  Nên chừng nào mặt đường còn bám lưới bậc thềm, mọi ranh thềm chạm vào đường đều là một cái vách.
- **Phương án đã cân nhắc**:
  1. **Làm mượt cả trường cao độ** (bỏ lượng tử hoá). Gỡ luôn thứ đang đỡ các toà nhà: công trình
     là khối đáy phẳng rộng tới 3 ô, thềm bậc là thứ cho chúng mặt đất bằng để đặt xuống. Bài
     `cao độ luôn là BỘI SỐ NGUYÊN của một bậc thềm` tồn tại vì lý do ấy, và lý do ấy còn đúng.
  2. **Ép mọi ô đường về CÙNG một cao độ** ("không ranh thềm nào cắt ngang đường"). Chết vì hình
     học chứ không vì thẩm mỹ: mạng đường là 4 cột + 4 hàng CẮT NHAU, tức một đồ thị **liên thông**
     ⇒ điều kiện ấy buộc cả 80 ô bằng nhau ⇒ 56% mặt lưới phẳng tuyệt đối; và vì mọi ô đất đều kề
     một ô đường nên độ dốc chỉ bị dồn sang phương ngang. Đổi một khuyết tật lấy một khuyết tật to
     hơn, đồng thời xoá sạch Phase 7B.
  3. **San riêng mặt đường, tách khỏi mặt đất** (Đàm đã tự loại): đường treo lơ lửng hoặc cắm vào
     đất hai bên, phải dựng tường chắn khắp nơi, mỗi tường lại là một khuyết tật hình học mới.
  4. ⇒ **CHỌN: đất giữ bậc thềm, đường được san thành dốc thoải trong CÙNG một trường cao độ.**
- **Vì sao loại các phương án kia**: (1) và (2) đều phá một bất biến đang thật sự gánh việc; (3)
  tạo ra một mặt phân cách mới ở mọi chỗ đường gặp đất. Phương án 4 không tạo mặt phân cách nào —
  nó chỉ đổi GIÁ TRỊ của 80 ô trong cùng một trường, nên `smoothHeightAt` vẫn liền lạc.
- **Giải pháp**: trong `buildTerrain`, sau bước chia bậc, thêm **LƯỢT 3 — SAN ĐƯỜNG**:
  - Lấy 80 ô từ `roadCellCandidates()` (`cityLayout.js`) — **danh sách ứng viên, hằng số cấp
    module**, KHÔNG phải mạng đường đang hiện.
  - Dựng ba hàm C-Lipschitz trên **đồ thị đường** (C = `maxRoadRise()` = 34,8% / 1,5) rồi lấy
    **trung vị** của chúng: hai bao hình của chính trường gốc (bám sát địa hình) và hai bao hình
    của trần/sàn do **bờ đất** áp đặt (`maxBankRise()`). Trung vị của ba hàm C-Lipschitz vẫn
    C-Lipschitz, nên kết quả vừa đủ thoải vừa không trôi khỏi bờ đất hai bên.
  - Điểm bất động của bao hình là DUY NHẤT ⇒ kết quả không phụ thuộc thứ tự duyệt ⇒ tất định.
- **Trade-off (nói thẳng, cả ba)**:
  - **Cao độ ô ĐƯỜNG không còn là bội số nguyên của một bậc thềm.** Có chủ đích: lý do của bất biến
    cũ (mặt đất bằng cho khối đáy phẳng) không áp cho mặt phố, vì không ai đặt nhà lên đó. Bài test
    đã tách làm hai vế và **đếm** số ô lẻ, để trạng thái này tường minh.
  - **Bờ đất bên lề dốc hơn một bậc thềm ở 5/2160 chỗ** (4 ở kỷ 5, 1 ở kỷ 7). Đó là chỗ đất hai bên
    phố chênh nhau hơn hai bậc, nên **không tồn tại** cao độ nào vừa giữ phố dưới 34,8% vừa nằm
    trong một bậc của cả hai bên. Khi buộc phải chọn, **phố thắng** — cái giá trả trên bờ đất.
  - **Số cặp ô đường có chênh cao độ TĂNG** (kỷ 5: 26/84 → 81/84). Đây là dấu hiệu ĐÚNG, không phải
    hồi quy: thay vì vài cái vách, nay là nhiều nhịp nhỏ — con đường **đi theo** địa hình thay vì
    bước qua nó.
- **Ảnh hưởng**: `terrain.js` nay import `roadCellCandidates` từ `cityLayout.js` (chiều import đã
  có sẵn: nó vốn import `hashId`). ADR-007 **không bị phá** vì danh sách ứng viên là hằng số cấp
  module, không phải tham số đầu vào — có test khoá cả hai vế ở `cityLayout.test.js`. Hình học:
  **0 lệnh vẽ mới, 0 vật liệu mới, 0 nguồn sáng mới**; tam giác mặt đất và mặt đường **giống hệt
  từng đơn vị** ở cả 15 kỷ, chỉ 4 kỷ thêm đúng một bệ kè (+12 tam giác mỗi kỷ).
- **Điều kiện xem lại**: nếu mạng đường thôi liên thông (bỏ một trục), phương án 2 sẽ khả thi trở
  lại và cho kết quả sạch hơn. Nếu `TERRACE_STEP` được hạ xuống dưới 0,232 cho MỌI kỷ thì lượt 3
  thành vô tác dụng và nên gỡ — nhưng đừng gỡ trước khi đo, vì `relief` nhân vào nó.

### Bổ sung 2026-08-18 (a) — TRẦN 34,8% ĐÃ ĐƯỢC HIỆU CHUẨN BẰNG MẮT, không chỉ bằng một con số mượn

Trần lấy từ Baldwin Street (Dunedin, NZ — con phố dốc nhất thế giới). Một con số mượn từ ngoài đời
là một khởi điểm tốt, nhưng nó **chưa trả lời** câu duy nhất quan trọng: *ở trong app này, cái dốc
ấy đọc ra là một con dốc hay một bức tường?* Đã đi kiểm:

| Kỷ | Dốc đỉnh | Quãng dốc nhất | Đọc ra là gì |
|---:|---:|---|---|
| 5 Đức | **35%** (chạm trần) | ô (3,4)→(4,4) | dốc |
| 7 Ý | **35%** (chạm trần) | ô (1,4)→(2,4) | dốc |
| 11 Mỹ | 30% | ô (1,4)→(2,4) | dốc |
| 12 Nga | 22% | ô (1,8)→(2,8) | dốc |

**Kết luận: trần đã hiệu chuẩn, KHÔNG hạ.** 34,8% = **19,2°**. Một bức tường là 90°; ngưỡng mà mắt
bắt đầu đọc một mặt nghiêng thành một mặt đứng nằm đâu đó trên 45°. Ở 19,2° con đường còn cách rất
xa chỗ đó, và ảnh chụp xác nhận: trong lòng đường **không có một mặt đứng nào** ở cả hai mốc 35% và
22%.

⚠️ **NHƯNG PHẢI NÓI RÕ THỨ GÌ TRONG ẢNH VẪN TRÔNG NHƯ MỘT BỨC TƯỜNG — và vì sao đó không phải lỗi.**
Mặt đứng nhìn thấy rõ nhất ở kỷ 5 và kỷ 7 là **mép bậc thềm của ĐẤT** (tới 0,675 đơn vị một bậc ở
kỷ 5), không phải mặt đường. Đó chính là nửa còn lại của ADR này: đất GIỮ bậc thềm, chỉ đường mới
được san. Ai đọc ảnh rồi kết luận "đường vẫn còn vách" là đang nhìn nhầm sang ô đất bên cạnh.

⚠️ **Và một cái bẫy đo lường đã suýt cắn**: chênh cao độ trung bình qua một ô ở chỗ dốc nhất là
**23%**, còn độ dốc mà trần nói tới là độ dốc **ĐỈNH** ở giữa ô — lớn hơn `SMOOTHSTEP_PEAK` lần,
tức 35%. Hai con số cùng mô tả một con đường; lẫn chúng là tự cho mình dốc thêm 50% hoặc tự khai
thấp đi một phần ba. Phép đo đầu tiên của tôi ra 23% và cãi nhau với `road-fit.mjs` (35%) đúng vì
lý do đó.

### Bổ sung 2026-08-18 (b) — Kỷ 4 phẳng là một LỰA CHỌN, không phải một khoản NỢ (đóng `TECH_DEBT #44`)

`TECH_DEBT #44` ghi nhận kỷ 4 có **64%** ô đất nằm cùng một bậc, quá ngưỡng 60%. Câu hỏi đúng không
phải *"sửa thế nào"* mà là *"đây là thứ ta MẮC hay thứ ta CHỌN?"*. Ba bằng chứng nói rằng đó là
CHỌN:

1. **Bảng khai đúng như vậy.** `ERA_TERRAIN[4]` ghi `shape: 'valley'` kèm `note` nguyên văn *"kinh
   thành Trung Hoa trên ĐỒNG BẰNG, đồi thấp vây bốn phía"*. Trường An / Lạc Dương nằm trên bình
   nguyên Quan Trung và bồn địa Lạc Dương — đồng bằng sông ngòi có đồi thấp vây quanh. Một dải
   phẳng chiếm phần lớn mặt đất **chính là** câu ấy dịch sang hình học.
2. **Không có bậc nào bị mất.** Kỷ 4 khai 3 bậc và **dùng đủ 3**: 20% ở đáy lòng chảo · **64%** ở
   dải đồng bằng · 16% ở vành đồi. Địa hình "sập" (bẫy Phase 7B) thì mất bậc hoặc dồn về một ĐẦU;
   ở đây dải đông nhất nằm ở GIỮA, có đất thấp hơn ở dưới và vành cao hơn ở trên.
3. **Kỷ 9 khai cùng một thứ và chỉ cách 6 điểm.** Kỷ 9 (`valley`, 3 bậc, *"lòng chảo sông Seine,
   gần phẳng"*) đo ra **58%** — cùng hình dạng phân bố, chỉ tình cờ nằm dưới vạch. Ngưỡng 60% đang
   cắt ngang giữa hai kỷ mô tả cùng một loại địa hình.

⇒ **Đóng `TECH_DEBT #44`.** Bài test giữ NGUYÊN dạng `assert.deepEqual(TRUOT, [4])` — nó vẫn là
hàng rào, chỉ đổi vai: từ *"một khuyết tật chờ sửa"* thành *"một ngoại lệ đã khai, đếm được"*. Kỷ
thứ hai rơi xuống ⇒ đỏ (địa hình vừa sập ở đâu đó). Kỷ 4 hoá gồ ghề ⇒ cũng đỏ, và người sửa phải
quyết định có ý thức.

⚠️ **Phải nói thật về chính ngưỡng 60%**: nó là một con số CHỌN TAY (bản đầu là 70% cho cả 15 kỷ,
hạ xuống sau khi nó đòi bịa ra đồi ở Lưỡng Hà và thảo nguyên Nga), **không phải một con số đo
được**. Kỷ 9 đứng cách vạch đúng 2 điểm. Vì vậy đừng đọc nó như một chân lý — thứ thật sự canh
"địa hình có sập không" là bài *"MỌI KỶ PHẢI DÙNG ĐỦ SỐ BẬC MÌNH KHAI"*, hỏi thẳng vào đúng khuyết
tật thay vì hỏi qua một tỉ lệ. Theo đúng chỉ đạo của Đàm (2026-08-18), **KHÔNG thêm một ngưỡng thứ
hai** bên cạnh nó: một ngưỡng chưa hiệu chuẩn đặt cạnh một ngưỡng có gốc là đúng cái phễu Phase 9A.

- **Điều kiện xem lại (cho cả hai bổ sung)**: (a) nếu `SMOOTHSTEP_PEAK` hoặc hàm nội suy đổi thì
  trần 19,2° đổi theo — nay đã có test đạo hàm số bắt việc đó; (b) nếu có ai muốn kỷ 4 gồ ghề hơn
  vì một lý do mỹ thuật mới, hoặc một kỷ thứ hai tụt xuống dưới vạch.

---

## ADR-031 — Lòng đường của một ô là MỘT LÕI + TỐI ĐA BỐN CÁNH TAY, không phải một hình chữ nhật; và bề rộng chỗ nối do CẢ HAI ô cùng suy ra bằng một phép ĐỐI XỨNG

- **Ngày**: 2026-08-18 (Phase 12, Việc 1 — nguyên nhân 1/2)
- **Bối cảnh**: Đàm nhìn thành phố rồi nói *"đường lòi lõm, mất tự nhiên quá"*. Câu ấy gộp **hai
  nguyên nhân độc lập**, và một bản vá cho cái này không chạm được cái kia: (1) hai ô đường kề nhau
  trình ra hai bề rộng khác nhau ngay tại chỗ giáp ⇒ mép đường bẻ một **góc vuông**; (2) hai ô
  đường nằm ở hai bậc thềm khác nhau ⇒ con đường phải **leo một cái dốc dựng đứng** trong đúng một
  ô. Bản ghi này chỉ nói về **(1)**. Nguyên nhân (2) là một commit riêng.
- **Vấn đề**: ADR-025 (Phase 9D) đã sửa mặt đường một lần, và sửa đúng: bản đầu thu ô đại lộ ở CẢ
  HAI chiều theo bề rộng kỷ khai, làm hai ô kề nhau chừa một khe cỏ và con đường vỡ thành mấy cái
  sân đỗ xe rời rạc. Bản vá khi ấy — *mép nào giáp ô đường khác thì vươn tới ranh giới ô (0,5), mép
  nào giáp đất thì dừng ở nửa bề rộng của chính nó* — chữa đứt điểm cái khe cỏ. Nhưng nó giữ
  nguyên một giả định chưa ai viết ra: **lòng đường của một ô là MỘT hình chữ nhật**. Một hình chữ
  nhật chỉ có **hai** bề rộng, còn một ngã tư cần tới **bốn** — nên ngã ba/ngã tư buộc phải phình
  ra trọn ô theo hướng có nhánh, dù cái nhánh ấy chỉ rộng bằng một phần ba đại lộ.

### Đo trước, không sửa mò

Công cụ `scripts/road-fit.mjs` (thuần, không dựng ảnh, 11 ca `--selftest`) hỏi **chính**
`carriagewayShape` chứ không diễn đạt lại luật ấy. Đo trên 15 kỷ × 3 mốc tuổi thành phố:

| | trước | sau |
|---|--:|--:|
| tỉ lệ mép đường có bậc (trung vị 45 lượt đo) | **45%** | **0%** |
| bậc lớn nhất cả bảng | **0,380 ô** | **0,000 ô** |

Tức con đường lởm chởm ở **gần một nửa** số chỗ nối — đúng như Đàm nói, và lớn hơn nhiều mức "một
chút răng cưa" mà mắt có thể bỏ qua.

### Quyết định 1 — bề rộng chỗ nối là `min(nửa của tôi, nửa của hàng xóm)`

Đây là thứ **xoá** bậc, và nó xoá bằng một tính chất chứ không bằng một con số: hai ô kề nhau cùng
suy ra bề rộng chỗ giáp từ **cùng một biểu thức đối xứng**, nên chúng không có cách nào lệch nhau.
Một cái bậc chỉ sinh ra khi mỗi bên tự tính bề rộng của mình một cách **độc lập** — đó chính xác là
điều luật cũ làm.

⚠️ Hệ quả về giao diện của hàm: `carriagewayShape(myHalf, nbHalf)` nhận **bề rộng** của hàng xóm,
không phải một cờ `có/không` như `carriagewayExtents` cũ. Biết "có đường bên cạnh" là **không đủ**
để tính một phép `min`.

### Quyết định 2 — LÕI + CÁNH TAY, và lõi rộng bằng cánh tay rộng nhất

- **Lõi** = chỗ hai con đường chồng lên nhau. Bề ngang của nó theo trục `u` chính là bề rộng của
  con đường chạy **dọc**, và ngược lại — đó là *định nghĩa* của một ngã tư, không phải một hằng số
  chọn tay. Vì vậy lõi phải là **hai** con số (`coreU`, `coreV`); gộp làm một là dựng lại đúng cái
  giả định hình chữ nhật vừa gỡ bỏ.
- **Cánh tay** loe: rộng bằng lõi ở mép lõi, thu về `min` ở ranh giới ô. Ngõ nhỏ nhập vào đại lộ
  giống một cái phễu nhập làn, thay vì gãy một góc vuông.
- ⇒ **Một ô không bao giờ rộng hơn chính con đường của nó** (`coreU`/`coreV ≤ myHalf` luôn đúng,
  vì mọi cánh tay đều đã bị `min` với `myHalf`). Chính điều này giết cái phình 0,5 ô.

### Quyết định 3 — `MAX_AVENUE = 0,96`, và `isValidStreetStyle` TỪ CHỐI THẲNG

Cánh tay cần chỗ để loe, nên một con đường **không được rộng trọn ô**. Kỷ 12 và 15 khai
`avenue: 1.00`, và con số ấy đang gây **hai** khuyết tật cùng lúc:

1. lõi rộng đúng 0,5 ⇒ cánh tay dài **bằng không** ⇒ lời hứa "không còn bậc" *không thể* đúng ở hai
   kỷ đó, bất kể luật `min` tốt tới đâu;
2. `streetCrossSection` kẹp `walk ≤ 0,5 − half` ⇒ **vỉa hè bằng 0** — trong khi `note` của kỷ 12
   viết nguyên chữ *"vỉa hè mênh mông"*. Con số và lời giải thích cùng bị vứt đi **trong im lặng**.

Chọn **0,96** chứ không phải một số tròn hơn vì nó vẫn để kỷ 12 và 15 là hai kỷ đường **rộng nhất**
trong 15 (kế tiếp là 0,94) — trục bản sắc "đại lộ Xô Viết / đại lộ sa mạc rộng nhất" giữ nguyên, mà
vẫn chừa 0,02 ô cho cánh tay. Đây là mức **thấp nhất** sửa được lỗi; cố ý không hạ sâu hơn, vì hạ
sâu là mua một con số đẹp bằng cách bóp một trục bản sắc đã được đo (8 trục ở `streetStyle.test.js`).

⚠️ Và validator **từ chối**, không tự kẹp — đúng bài học `MIN_STONE` (Phase 9D): tự kẹp là cách một
bảng 15 dòng lặng lẽ thoái hoá về 1 dòng, vì bốn kỷ khai bốn số vẫn dựng ra một kết quả.

### Phương án đã cân nhắc và loại bỏ

| Phương án | Vì sao loại |
|---|---|
| **Giữ hình chữ nhật, chỉnh lại các bề rộng khai** cho gần nhau hơn | Cái sai là một giả định về **HÌNH**, không phải một con số. Một hình chữ nhật có hai bề rộng, ngã tư cần bốn — không giá trị nào thoát được, và làm 15 kỷ giống nhau hơn thì mất chính thứ ADR-025 vừa dựng lên. |
| **Bo tròn góc chỗ nối** (fillet) cho đỡ gắt | Che triệu chứng. Bậc vẫn còn, chỉ là mép nó cong. Và nó tốn hình học ở mọi chỗ nối thay vì chỉ ở chỗ thật sự đổi bề rộng. |
| **Mọi ô đường đều rộng trọn ô** (bỏ hẳn bề rộng theo kỷ) | Xoá bậc thật, nhưng giết luôn trục bản sắc "bề rộng đại lộ / bề rộng ngõ" — 2 trong 8 trục của `15 KỶ RA 15 MẶT ĐƯỜNG`. Mua sự phẳng phiu bằng cách xoá sự khác biệt. |
| **Tự kẹp `avenue` về 0,96 trong `getStreetStyle`** | Bảng vẫn khai 1,00, mã vẫn chạy, và không ai biết hai kỷ đang bị sửa sau lưng. Bẫy `MIN_STONE`. |

### Trade-off

- **Được**: mép đường liền lạc ở 100% chỗ nối (đo được); ngã ba/ngã tư đọc ra được thứ bậc đường
  (đại lộ đi thẳng, ngõ nhập vào); vỉa hè của kỷ 12/15 sống lại; **0 lệnh vẽ mới, 0 vật liệu mới,
  0 nguồn sáng mới** — chỉ tốn tam giác, thứ ngân sách M3 nói là gần như miễn phí.
- **Mất**: hàm dựng phức tạp hơn (một lõi + bốn dải hình thang thay vì một lưới chữ nhật), và nó
  cần biết bề rộng của **hàng xóm** nên phải dựng sẵn một `Map` bề rộng trước vòng lặp chính.
- **Mất**: kỷ 12/15 hẹp đi 0,04 ô (2% bề rộng) — dưới ngưỡng mắt, và đã kiểm rằng 8 trục bản sắc
  không đổi thứ hạng.

### Ảnh hưởng

- `src/engine/city3d/streetStyle.js` — `carriagewayExtents` → `carriagewayShape` (đổi cả chữ ký);
  thêm `SIDES`, `SIDE_STEPS`, `MAX_AVENUE`; siết `isValidStreetStyle`; kỷ 12/15 `avenue` 1,00→0,96.
- `src/components/city/render3d/terrainMesh.js` — dựng lõi + bốn dải loe; thêm `quad4` (bốn góc tự
  do, vì ô lát ở mép cánh tay là hình **thang** chứ không phải chữ nhật); `Map` bề rộng thay cho
  `Set` ô đường; vỉa hè/bó vỉa/vạch kẻ đọc `shape.arms` thay cho cờ `nối`.
- `scripts/road-fit.mjs` — công cụ đo mới.

### Điều kiện xem lại

- Nếu có kỷ nào cần đại lộ rộng hơn 0,96 ô: phải đổi **mô hình**, không đổi hằng số — ví dụ cho
  cánh tay loe *ra ngoài* ranh giới ô, việc này đòi hai ô cùng thoả thuận nên phải suy nghĩ lại từ
  đầu.
- Nếu mạng đường thôi bám lưới vuông (đường chéo, đường cong): "bốn phía" hết đúng và cả bản ghi
  này phải viết lại.

### ⚠️ Ba cái bẫy đã trả giá trong chính phase này

1. **Tam giác suy biến làm hỏng phép đo, không làm hỏng hình.** Khi lõi chạm đúng ranh giới ô
   (`avenue = 1,00`), dải cánh tay dài bằng 0 vẫn được đẩy vào lưới. Trên màn hình chúng vô hình;
   nhưng trọng tâm của chúng rơi **đúng trên** ranh giới rồi bị làm tròn sang ô **bên cạnh**, và ô
   ấy bỗng "rộng" thêm ra — bài test hình học đỏ với một thông báo trỏ vào một ô hoàn toàn lành.
   Vá hai lớp: bỏ qua dải dài 0, **và** cấm khai 1,00 ngay từ bảng.
2. **Cỡ viên lát phải là đại lượng của THẾ GIỚI, không phải của mảnh.** Trước đây cả ô là một hình
   chữ nhật nên chia `sub × sub` là xong. Nay mỗi ô có tới năm mảnh dài ngắn khác nhau; chia đều
   `sub` cho mọi mảnh thì viên lát của cánh tay dài 0,14 ô nhỏ hơn viên của lõi dài 0,72 ô tới năm
   lần — tức cỡ viên thôi là một trục bản sắc và bắt đầu kể chuyện về hình dạng ngã tư.
3. **Phép phá đầu tiên không cô lập được thứ tôi định cô lập.** Dựng lại luật cũ (`arms = 0,5`) làm
   đỏ assert *bề rộng lõi* **trước** assert *bậc ở mép*, nên nó không chứng minh được assert thứ
   hai có răng. Phải phá đúng **một** chiều — chỉ phá tính đối xứng (`nb × 0,9`, vẫn `≤ myHalf`) —
   thì mới ra đúng dòng đỏ đã nêu trước: *"ô (0,0) và (1,0) giáp nhau mà bên này phủ [−0,1170;
   0,1170] còn bên kia phủ [−0,1300; 0,1300] — đó là một BẬC ở mép đường"*.

---

## ADR-030 — Mái là NGỮ PHÁP THỨ NĂM, và nó tách đôi kỳ-quan ↔ nhà-dân lần thứ sáu; nhưng `stackCount` thì CỐ Ý không tách

- **Ngày**: 2026-08-18 (Phase 11)
- **Bối cảnh**: Camera nhìn CHÚC XUỐNG, nên **mái là mặt lớn nhất trong khung hình** — và cho tới
  Phase 10 nó là một tấm phẳng trơn ở cả 15 kỷ. Ngân sách đo trên M3 (`PERFORMANCE.md`) nói hình
  học gần như miễn phí (dư 3,2 lần, 80% chi phí theo ĐIỂM ẢNH), tức đây đúng là chỗ tiêu ngân sách
  có lãi nhất: thêm khối thì rẻ, mà thứ thêm vào lại chiếm phần lớn khung hình.
- **Vấn đề**: *"Cho mái có chi tiết"* nghe như một việc mỹ thuật. Nó không phải — nó là một bài
  toán **cấu trúc dữ liệu**, vì cùng một chữ "mái" đang trả lời ít nhất ba câu hỏi khác nhau.

### Quyết định 1 — hai TRỤC, không phải một danh sách chi tiết

Bảng có hai trục vuông góc, vì mắt đọc chúng bằng hai cách khác nhau:

| Trục | Câu hỏi | Phá vỡ điều gì |
|---|---|---|
| `stack` | *cái gì NHÔ LÊN khỏi mặt phẳng mái?* | phá **mặt phẳng** — ống khói, bồn nước, buồng thang, cột ăng-ten, giàn phơi, chậu cây, cửa sổ mái |
| `crown` | *cái gì VẼ ĐƯỜNG NÉT trên mái?* | phá **sự trơn nhẵn** — đầu dầm, ngói ống, thanh nóc, đầu đao, lan can |

Gộp chúng vào một danh sách "đặc trưng mái" thì một kỷ có hai đặc trưng cùng loại (hai kiểu đường
nét) sẽ trông rối, còn một kỷ không có đường nét nào lại không phát biểu được. Tách ra thì luật
*"mỗi vế đúng một-hoặc-hai đặc trưng"* viết được thành test, và **cả 15 kỷ đều bị buộc phải có ít
nhất một** — không kỷ nào lặng lẽ về lại tấm phẳng trơn.

### Quyết định 2 — tách kỳ quan ↔ nhà dân (lần thứ SÁU của cùng một câu hỏi)

Đây là lần thứ sáu dự án hỏi *"ngoài đời hai thứ này có LUÔN đi cùng nhau không?"* (sau
`storyHeight`/`massScale` · `vernacularRoof` · bảng cây/`undergrowth` · `roadColor`/`streetStyle` ·
`groundFloor`). Bốn ca đo được, và không ca nào hai vế trùng nhau:

| Nước | Công trình biểu tượng | Nhà thường cùng thành phố |
|---|---|---|
| Pháp | Panthéon **giấu mái sau lan can đá** | mái kẽm Haussmann trơn, **cắm đầy lucarne** |
| Anh | nhà máy Manchester **mái răng cưa lấy sáng bắc** | dãy nhà thợ, **ba ống khói mỗi đầu hồi** |
| Mỹ | tháp Beaux-Arts, **buồng máy thang** trên khối giật cấp | nhà thuê New York, **bồn nước gỗ** |
| Iraq | ziggurat Ur, **tường chắn mỗi thềm** | nhà bùn mái bằng, **cửa sập lên mái ngủ đêm** |

Lý do vật lý thì giống hệt bốn lần trước: mái kỳ đài tốn kém và thường bị quy chế giới hạn, còn
mái nhà dân giải quyết một nhu cầu sinh hoạt (phơi, ngủ, sưởi, chứa nước). ⇒ **bốn trường**:
`crown`/`stack` cho công trình chính, `vernacularCrown`/`vernacularStack` cho nhà dân, **bắt buộc
cả 15 kỷ**, không tuỳ chọn — trường tuỳ chọn sẽ lặng lẽ rơi về vế kia và cái bẫy quay lại ở kỷ
thêm sau này (đúng lý do `vernacularRoof` phải bắt buộc ở Phase 7C).

### Quyết định 3 — `stackCount` thì CỐ Ý **KHÔNG** tách, và đây là chỗ dễ làm sai

Cùng lúc tách bốn trường trên, `stackCount` (mấy cái) **dùng chung** cho cả hai vế. Nghe như thiếu
nhất quán, nhưng hỏi lại đúng câu hỏi cũ thì ra đáp án ngược: *"một ống khói Đức, ba ống khói
Manchester, bốn cục nóng Singapore"* là một **sự thật văn hoá của cả thành phố**, không phải một
mức chi tiết. Nhà thợ Manchester có ba ống khói vì nhà xây liền kề chia tường chung — cùng đúng
cho nhà máy. Tách nó ra là tạo một trục giả, tức làm bảng trông rộng hơn mà không thêm thông tin.

⇒ **Luật rút ra, ghi để lần thứ bảy khỏi làm máy móc**: *"một trường gánh hai việc"* là câu hỏi
phải HỎI, không phải kết luận phải ÁP. Cùng một bảng có thể có trường phải tách và trường phải
giữ, và cách phân biệt vẫn là câu hỏi cũ — chỉ khác là lần này câu trả lời là "CÓ, chúng luôn đi
cùng nhau".

### Quyết định 4 — hai họ ràng buộc là **ĐIỀU KIỆN CẤU TRÚC**, không phải trí nhớ

`CROWN_NEEDS_ROOF`/`STACK_NEEDS_ROOF` hỏi thẳng `style.roof`: bồn nước cần mặt bằng đứng được, ngói
ống cần mái dốc, đầu đao chỉ có ở mái chồng tầng. `EARLIEST_ERA` là mốc lịch sử hai chiều (kỷ cổ
không được có, kỷ hiện đại không được thiếu). Cả hai đều **hỏi chính cái bảng** chứ không hỏi trí
nhớ — đúng bài học Phase 10 Bước 2, nơi một mốc "cửa chớp lá sách là thế kỷ 17" đúng về lịch sử mà
sai về **thứ đang được dựng** (hai cánh ván trơn, cổ ngang chính cái cửa sổ).

### Trade-off đã chấp nhận

- **+27,9% tam giác** (394.466 → 504.458 trên cả 15 kỷ; mái chiếm 21,8%). Nằm trong mô hình chi phí
  đã đo: hình học rẻ, điểm ảnh và ánh sáng mới đắt. **0 lệnh vẽ mới** ở cả 15 kỷ — mọi vai màu dùng
  lại họ vật liệu kỷ đó đã có.
- **`crownWeight` là một trục MỎNG** — nó chỉ tách được 6/105 cặp kỷ, và với kiểu `barrel` thì bước
  lượng hoá (1,459) còn **rộng hơn cả dải hợp lệ** (1,25), tức hai kỷ cùng lợp ngói ống thì trọng
  số **không bao giờ** tách được chúng. Giữ lại vì nó có việc thật (số con tiện, độ vươn đầu đao),
  nhưng đã ghi rõ giới hạn trong test để phiên sau đừng trông cậy vào nó.
- **`parts.js` chỉ xoay được quanh trục đứng (`ry`)**, không có `rx`/`rz`. Nên ngói ống dựng bằng
  **đầu ngói ở diềm + cuộn nóc**, không xấp xỉ cuộn ngói nằm nghiêng. Chấp nhận: thêm hai trục xoay
  là đụng vào nhà máy hình học dùng chung cho cả thành phố, rủi ro lớn hơn nhiều lần cái lợi.

### Điều kiện xem lại

Nếu một phase sau thêm `rx`/`rz` vào `parts.js` thì dựng lại `barrel` cho đúng cuộn ngói. Nếu
`crownWeight` tụt xuống 0 cặp thì phải hoặc bỏ trường ấy đi, hoặc trải nó ra cho đáng.

---

## ADR-029 — Bảng tầng trệt dọn sang file riêng: quy ước "bảng ↔ hình" áp cho MỌI bảng 15 kỷ, kể cả bảng ra đời sau; và đảo ngược lý lẽ "để trong tầm mắt" của ADR-026

- **Ngày**: 2026-08-18 (Việc 2, ngay trước Phase 11)
- **Bối cảnh**: `groundFloor` ra đời ở Phase 10 và được đặt **trong `eraStyle.js`**, kèm một lý do
  viết hẳn vào chú thích: *"mỗi dòng phải trả lời «công trình có thật nào ở nước ấy trông như
  vậy?» — nên câu trả lời (`country`/`landmark`) phải nằm trong tầm mắt, không phải ở một file
  khác phải mở ra đối chiếu."* Phase 11 sắp thêm một bảng 15 dòng nữa (mái).
- **Vấn đề**: Dự án đã tách bảng ra file riêng **ba lần** — `floraStyle.js` (163 dòng) ·
  `streetStyle.js` (330 dòng) · `horizon.js` — và cả ba đều buộc vào `country`. Nên `eraStyle.js`
  (606 dòng) ôm bảng tầng trệt là **chỗ lệch khuôn duy nhất**. Đàm gọi đúng tên: *"đây là chuyện
  QUY ƯỚC, không phải chuyện file dài."*

### Vì sao lý lẽ cũ sai — và nó sai theo một cách đáng ghi lại

Lý lẽ *"để trong tầm mắt"* giả định rằng thứ đang giữ ràng buộc "mỗi dòng buộc vào `country`" là
**khoảng cách vật lý trên màn hình**. Không phải. Thứ giữ nó là **bài test** `KHOÁ VÀO country` —
và bằng chứng là bài ấy chạy **y nguyên** sau khi bảng dọn đi, chỉ đổi một dòng `import`.

Một ràng buộc được giữ bởi "tiện mắt" là một ràng buộc **không được giữ bởi gì cả**: nó chỉ đúng
chừng nào người viết còn nhớ nhìn lên. Đây là cùng họ với bài học Phase 8B (*"một chú thích nói
'đã có test đối chiếu' không phải là một bài test"*) và Phase 4G (*"một câu tự trấn an phải được
kiểm như một con số"*).

### Phương án đã cân nhắc

**(a) Giữ nguyên trong `eraStyle.js`, Phase 11 cũng nhét bảng mái vào đó** — bác. `eraStyle.js` sẽ
thành nơi chứa mọi thứ, và khuôn "bảng ↔ hình" mất nghĩa hẳn. Quan trọng hơn: **sửa quy ước TRƯỚC
khi thêm bảng thứ hai thì tốn một lần; sửa sau thì tốn hai, và ở giữa có một phase làm theo khuôn
sai** — mà một phase làm theo khuôn sai là thứ phiên sau sẽ chép lại.

**(b) Dọn cả `groundFloor` lẫn `vernacularRoof` ra ngoài cùng lúc** — bác, ít nhất là bây giờ.
`vernacularRoof` là **một trường** của ngữ pháp mái, không phải một bảng; và `getVernacularStyle`
trả về nguyên bộ tham số nên nó thuộc về `eraStyle.js`. Phase 11 sẽ trả lời câu hỏi ấy tử tế khi
dựng `roofStyle.js` — gộp vào đây là quyết định vội trong lúc đang dọn nhà.

**(c) Dọn `groundFloor` sang `groundFloorStyle.js`, ĐÚNG khuôn ba bảng kia — ĐÃ CHỌN.**

### Quyết định

1. **`src/engine/city3d/groundFloorStyle.js`** (mới): `GROUND_FLOOR_STYLES` 15 dòng +
   `getGroundFloor(era)`. Đủ cặp với `groundFloor.js` (hình), y như `floraStyle.js ↔ flora.js`.
2. **`eraStyle.js` giữ đúng phần NGỮ PHÁP CHUNG**: `country` · `landmark` · `massScale` · `spread`
   · `storyHeight` · `roof`/`vernacularRoof` · `windows` · `motifs` · vật liệu · màu.
3. ⚠️ **`normalizeEraKey(era)` xuất ra từ `eraStyle.js`** — cả `getEraStyle` lẫn `getGroundFloor`
   (và mọi bảng 15 kỷ sau này, kể cả bảng mái Phase 11) đều hỏi nó. Chép lại `Math.round` +
   `?? DEFAULT_ERA` là "một luật hai công thức", và hai công thức tương đương trên giấy gần như
   luôn lệch nhau ở biên (Phase 3Y).
4. **Hai bài test mới**, cả hai đều sinh ra từ những thứ chỉ tồn tại SAU khi tách file:
   - *khoá của hai bảng phải khớp nhau* — chừng nào bảng còn nằm trong `ERA_STYLES` thì "đủ 15
     dòng" là hệ quả hiển nhiên; tách ra thì thêm kỷ 16 mà quên bảng này ⇒ kỷ ấy **mất cửa trong
     im lặng**, đúng ca kỷ 14 ở Bước 2;
   - *kỷ lạ phải rơi về cùng một kỷ ở cả hai bảng* — xem mục dưới, bài này ra đời từ một phép thử
     ngược KHÔNG NỔ.

### ⚠️ Một lời hứa được phát hiện là chưa có gì giữ

Sau khi viết `getGroundFloor` kèm chú thích *"hỏi `normalizeEraKey` vì một luật một công thức"*,
phép thử ngược (đổi thành `Math.round(era)`) **không làm đỏ bài nào**. Tức lời hứa ấy đang được
giữ bởi đúng một câu chú thích. Hậu quả thật nếu để trôi: `getEraStyle(99)` trả về kỷ mặc định
trong khi `GROUND_FLOOR_STYLES[99]` là `undefined` ⇒ công trình dựng theo ngữ pháp kỷ 2 nhưng
**không có cửa**. Đã vá bằng một bài test duyệt 9 đầu vào lạ (`undefined` · `NaN` · `0` · `-3` ·
`2.4` · `99` · `16` · `'7'` · `null`) và đòi hai bảng tra ra CÙNG một kỷ; nay cả hai phép phá
(sửa `getGroundFloor` và sửa `normalizeEraKey`) đều đỏ đúng ở đó.

### Trade-off đã chấp nhận

- **Đọc một kỷ nay phải mở hai file.** Đó là cái giá của mọi bảng đã tách, và ba bảng trước đã trả
  nó rồi. Bù lại: `note` của mỗi dòng vẫn nhắc đúng nước, và một BÀI TEST bắt buộc điều đó — mạnh
  hơn "để cạnh nhau cho dễ nhìn".
- **Thêm một cạnh phụ thuộc** `groundFloorStyle.js → eraStyle.js` (để dùng chung `normalizeEraKey`).
  Chấp nhận: nó là một chiều, và thay thế cho việc chép công thức.
- **Không đổi một hành vi nào** — đã chứng minh bằng phép đo, xem dưới.

### Bằng chứng "chỉ là dọn nhà"

Đo lại đủ 15 kỷ bằng `node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow`, so
với bảng của Việc 1 (cùng lệnh, cùng ngày): **lệnh vẽ khớp 15/15 kỷ, tam giác khớp 15/15 kỷ, từng
đơn vị**. Xem `PERFORMANCE.md`.

⚠️ **Và một bài học về CHÍNH phép đo ấy** — xem mục "đo trong lúc cây đang thay đổi" ở `CLAUDE.md`.

### Ảnh hưởng

Phase 11 dựng `roofStyle.js` theo đúng khuôn này: bảng ở file riêng · buộc vào `country` bằng test
· khoá hai bảng phải khớp · tra kỷ qua `normalizeEraKey` · hình học ở file riêng · `buildingSpec.js`
chỉ ĐỌC.

### Điều kiện xem lại

- Một bảng 15 kỷ mới cần đọc nhiều trường của `eraStyle` tới mức tách ra làm mã khó đọc hơn.
- `eraStyle.js` co lại đủ nhỏ để việc gộp lại thật sự đơn giản hơn (khó xảy ra — nó đang là bảng
  ngữ pháp trung tâm).

---

## ADR-028 — Ngân sách lệnh vẽ là MỘT BẢNG 15 MỐC RIÊNG, không phải một trần chung; và câu hỏi "thành phố gồm những khối nào" chỉ được trả lời ở MỘT nơi

- **Ngày**: 2026-08-18 (Việc 1 — chốt `TECH_DEBT #38`, trước Phase 11)
- **Bối cảnh**: Cổng nghiệm thu của cả chương trình Phase 10–12 có một mục là *"số lệnh vẽ không
  quá 13"*. Đo đủ 15 kỷ lần đầu tiên thì **kỷ 10 ra 14** — và ra 14 cả trên `HEAD`, tức con số 13
  chưa bao giờ đúng với cả 15 kỷ; nó đo trên đúng **ba kỷ** (6 · 9 · 13) rồi được viết ra như luật
  của mười lăm. Tôi đề xuất nâng trần lên 14. Đàm bác.
- **Vấn đề**: Một cổng nghiệm thu mà con số của nó SAI thì có hai kết cục, cả hai đều tệ: hoặc nó
  báo đỏ oan ở mọi phase sau rồi bị nới dần cho tiện (đúng cái phễu Phase 9A), hoặc nó bị ngó lơ và
  mất sạch tác dụng.

### Phương án đã cân nhắc

**(a) Nâng trần chung lên 14** — *đề xuất ban đầu của tôi, ĐÃ BỊ BÁC.* Lý do Đàm nêu: *"14 kỷ khác
đang ở 11–13, nên trần chung 14 cho chúng ba lệnh vẽ trống để trôi vào trong im lặng. Cổng chỉ bắt
được kỷ tệ nhất."* Anh đúng, và cái sai của (a) có tên sẵn trong dự án: **bẫy Phase 7D — một con số
tuyệt đối không diễn đạt được một luật nói về QUAN HỆ.** Lời hứa thật chưa bao giờ là "≤ 13"; nó là
*"kỷ này không được tốn hơn chính nó hôm nay"*, và một hằng số thì không nhìn thấy "chính nó".

**(b) Gộp `brick` với `slate` để kỷ 10 quay về 13** — bác thẳng. Đó là mua một con số đẹp bằng cách
nói dối vật liệu; nước Anh thời công nghiệp dùng cả hai vật liệu ấy thật. `ADR-025` đã cấm đúng
kiểu này với mặt đường.

**(c) Bỏ hẳn cổng lệnh vẽ, chỉ canh frame time** — bác. Frame time chỉ đo được trên máy thật, mà
máy thật thì mỗi lần đo phải nhờ Đàm chạy tay. Một cổng chỉ chạy được vài tháng một lần không chặn
được gì trong lúc làm việc hằng ngày.

**(d) MỘT BẢNG 15 MỐC RIÊNG — ĐÃ CHỌN.** Mỗi kỷ một mốc, mỗi mốc là số đo của chính kỷ ấy, kèm
lệnh đo và ngày đo chép sẵn trong chú thích để phiên sau tái lập được.

### Quyết định

1. **Bảng `MOC_LENH_VE` 15 dòng** ở `src/engine/city3d/drawCallBudget.test.js` (9 · 11 · 11 · 11 ·
   11 · 11 · 11 · 11 · 10 · **12** · 10 · 10 · 10 · 10 · 10 — cột "thành phố"; cả cảnh = mốc + 2).
2. **Bốn bài khoá**, trong đó ba bài canh chính cái bảng ấy khỏi thoái hoá:
   - mỗi kỷ ≤ mốc của chính nó (+ gác chạy-rỗng: > 100 khối thật/kỷ);
   - **ĐỐI CHỨNG bắt buộc** — kéo thêm một họ vật liệu vào một kỷ thì **đúng kỷ ấy** vượt mốc, và
     vượt **đúng 1**. Hỏi TỪNG KỶ, không hỏi tổng: hỏi tổng thì một kỷ dư chỗ bù cho một kỷ vượt,
     tức dựng lại đúng cái phễu mà bảng-15-dòng sinh ra để gỡ. Đàm: *"Không có đối chứng thì không
     biết bài test có còn răng hay không."*;
   - **chống "trần chung đội lốt"** — điền cả 15 dòng cùng một số là cách rẻ nhất để bài đầu hết đỏ;
   - **quan hệ nền** `lệnh vẽ thành phố = (số họ vật liệu) + 4`.
3. **`src/engine/city3d/cityParts.js`** — câu hỏi *"thành phố kỷ N gồm những khối nào?"* nay được
   trả lời ở đúng một nơi. `sceneGraph.js` gọi nó để DỰNG, bài test gọi nó để ĐO.

### Vì sao cổng này chạy được bằng `node --test`, không cần Chromium

Cả thành phố gộp thành **một khối hình học có nhóm vật liệu**, mỗi họ một nhóm, và three vẽ mỗi
nhóm bằng một lệnh vẽ (`mergeSinks`, `geometryFactory.js`). Ngoài khối gộp còn đúng bốn tấm cố
định (nền ô lưới · mặt đường · thân cư dân · đầu cư dân). Đem đối chiếu với phép đo thật:
`lệnh vẽ = số họ + 4`, **đúng 15/15 kỷ, không một ngoại lệ**. Hằng số 4 là một **hiệu số đo được**,
không phải kết quả đếm bằng mắt trong `sceneGraph.js` — và nếu một phase sau tách thêm một tấm cố
định thì bài thứ tư đỏ **đồng loạt cả 15 kỷ**, một hình dạng đỏ rất dễ đọc.

⚠️ Đây **không phải một thứ đại diện** cho số lệnh vẽ (`TECH_DEBT #22` là bài học về việc nhầm hai
chuyện đó) — nó là một phép tính CHÍNH XÁC, đã đặt cạnh phép đo thật ở cả mười lăm kỷ.

### Trade-off đã chấp nhận

- **Bảng 15 dòng đắt hơn một hằng số khi bảo trì**: thêm một họ vật liệu cho một kỷ nghĩa là phải
  chạy lại `--bench` cho kỷ ấy rồi sửa một dòng kèm ngày. Đó chính là cái giá muốn trả — nó biến
  "nới cổng" từ một thao tác một-ký-tự thành một việc phải có phép đo đi kèm.
- **Cổng đứng ở tầng HỌ VẬT LIỆU, không ở tầng lệnh vẽ thật.** Nếu ngày nào `geometryFactory` đổi
  cách gộp nhóm thì quan hệ "+4" hết đúng. Bài thứ tư tồn tại đúng để chuyện đó không trôi qua im
  lặng, nhưng nó **không** thay được một lượt `--bench` khi có thay đổi lớn ở tầng dựng cảnh.
- **`cityParts.js` thêm một tầng gián tiếp** giữa `cityLayout` và `sceneGraph`. Đổi lại: hết cảnh
  "hai bản chép của cùng một danh sách", và bài test đo đúng thứ app dựng.

### Ảnh hưởng

Mọi phase sau (11 mái · 12 …) nghiệm thu bằng bảng này, không bằng một con số. Thêm chi tiết mà tái
dùng vai màu đã có ⇒ mốc không nhúc nhích; kéo một họ mới vào ⇒ đỏ ngay tại kỷ đó trong `npm test`,
không phải đợi tới lượt dựng ảnh.

### Điều kiện xem lại

- `geometryFactory.mergeSinks` đổi cách gộp nhóm, hoặc `sceneGraph` tách/gộp một tấm cố định
  (⇒ hằng số 4 đổi, phải đo lại cả bảng).
- Một kỷ thật sự cần một họ vật liệu mới vì lý do lịch sử ⇒ đo lại **đúng kỷ ấy**, ghi ngày mới,
  và nói rõ trong `PERFORMANCE.md` vì sao.
- Số kỷ khác 15.

---

## ADR-027 — Trải tầng trệt ra 15 kỷ: thêm ĐÚNG hai kiểu cửa + một đặc trưng, và đo bản sắc bằng 8 TRỤC CẤU TRÚC thay vì bằng mắt

- **Ngày**: 2026-08-18 (Phase 10, Bước 2)
- **Bối cảnh**: Đàm đã duyệt hướng mỹ thuật của Bước 1 (kỷ 6 · 9 · 13) và ra lệnh *"làm nốt 12
  kỷ"*, kèm một ràng buộc gắt trong chương trình làm việc: **"KHÔNG viết thêm mã hình học mới trừ
  khi một kỷ thật sự cần hình chưa có"**, và **"mỗi kỷ đúng một-hoặc-hai đặc điểm, không rắc đều"**.
  Riêng kỷ 1–2 anh nói thẳng: *"cửa phải THÔ SƠ đúng thời — khung gỗ, tấm da, rèm cỏ. Đừng bịa cho
  sang."*

- **Vấn đề**: bốn kiểu cửa của Bước 1 (`panel` · `double` · `sliding` + trạng thái `legacy`) và sáu
  đặc trưng (`porch` · `awning` · `balcony` · `shutters` · `sign` · `none`) đủ cho ba kỷ đã nghiên
  cứu, nhưng KHÔNG đủ cho 12 kỷ còn lại theo đúng nghĩa lịch sử. Hai chỗ thiếu thật:
  1. **Kỷ 1–2 chưa có bản lề.** Bản lề/cối xoay xuất hiện ở kỷ 3 (cối đá của Ur). Dựng cửa bức bàn
     cho một túp lều da thú là nói dối lịch sử tới tám nghìn năm — mà đó lại đúng thứ Đàm cấm.
  2. **Kỷ 11 · 14 · 15 không có "cánh cửa".** Sảnh kính là một MẶT TIỀN TRONG SUỐT, và thứ mắt đọc
     ra không phải cánh mà là nhịp đố khung chia ô. Ép nó vào `double` thì được một cái cửa gỗ hai
     cánh trên một toà tháp kính.
  3. **Kỷ 7 · 8 · 14 có một device chung mà bảng chưa gọi tên**: hàng vòm cuốn / five-foot way —
     lối đi công cộng luồn DƯỚI thân nhà. `porch` không diễn đạt được vì porch ĐUA RA còn arcade
     KHOÉT VÀO.

- **Phương án đã cân nhắc**:
  - **(A) Không thêm gì, ép 12 kỷ vào vốn từ sẵn có.** Rẻ nhất, giữ đúng chữ của ràng buộc. Loại:
    nó giữ được chữ mà phá mất tinh thần — cả điểm của bảng 15 dòng là mỗi dòng phải trả lời được
    *"công trình có thật nào ở nước ấy trông như vậy?"*, và với kỷ 1 thì câu trả lời sẽ là "không
    có công trình nào".
  - **(B) Thêm một kiểu cửa cho mỗi kỷ chưa vừa.** Loại thẳng: đó chính là cách một bảng biến thành
    một danh sách ngoại lệ, và nó phá ràng buộc "không rắc đều".
  - **(C) ĐÃ CHỌN — thêm ĐÚNG hai kiểu cửa (`flap`, `glazed`) và ĐÚNG một đặc trưng (`arcade`),
    mỗi cái phục vụ ÍT NHẤT hai kỷ, và mỗi cái phải diễn đạt một hình học mà vốn từ cũ KHÔNG diễn
    đạt được** (tấm mềm rủ có nếp · mặt kính chia đố · hàng vòm khoét vào). Ba thứ khác từng nghĩ
    tới nhưng KHÔNG thêm — cửa cuốn vòm, cổng tam quan, cửa xoay — vì mỗi thứ chỉ phục vụ một kỷ
    và kỷ ấy đã đứng vững bằng các trục khác.

- **Quyết định thứ hai (và nó lớn hơn)**: **bản sắc tầng trệt được đo bằng 8 TRỤC CẤU TRÚC, không
  đo bằng mắt.** Dùng lại nguyên khuôn `streetStyle.test.js` (ADR-025): 4 trục danh mục (`door` ·
  `frame` · `feature` · `vernacularFeature`) + 4 trục số đã lượng hoá (`steps` ≥1 bậc · `recess`
  ≥0,25 · `doorWidth` ≥0,06 · `doorTall` ≥0,08), sàn **≥3/8 cho cả 105 cặp**, cộng một phép canh
  **trung vị ≥5/8** (cực tiểu là con số gộp — nó đứng yên dù có một cặp yếu hay bốn mươi) và một
  phép canh **mỗi trục phải còn sống** (tách được ≥10/105 cặp). Ba bước lượng hoá đều suy từ đại
  lượng có thật (`DOOR_RECESS_DEPTH` → độ sâu thế giới; `doorWidth`/`doorTall` vốn đã là tỉ lệ),
  không có hằng số nào chọn tay.
  - **Vì sao dùng lại khuôn cũ thay vì nghĩ thước mới**: hai thước khác nhau đẻ ra hai ngưỡng không
    so được với nhau, và lúc ấy câu "kỷ này khác kỷ kia bao nhiêu" không còn một câu trả lời.

- **Trade-off**:
  - **Được**: 15 kỷ có 15 tầng trệt đo được (105/105 cặp ≥3/8 · trung vị **6/8** · yếu nhất **3/8**
    · cả 8 trục đều sống, yếu nhất `recess` tách 51/105 cặp). Kỷ 1 và 2 lần đầu tiên có lối vào.
    `legacy` bị xoá hẳn ⇒ không còn đường rơi về trạng thái dở dang.
  - **Mất**: `groundFloor.js` dài thêm ~150 dòng cho ba đường hình học mới; `DOOR_KINDS` từ 3 kiểu
    thật lên 5. Đây là chi phí có thật và nó được trả bằng một điều kiện xem lại rõ ràng ở dưới.
  - **Không mất**: **lệnh vẽ KHÔNG tăng một đơn vị nào** — mọi vai mới (`glass`) đều đã có mặt
    trong thành phố của chính những kỷ dùng nó, và có bài test khoá quan hệ ấy chứ không khoá một
    con số.

- **Giả định**: (a) mỗi kỷ vẫn có đúng một `country` trong `eraStyle.js` và hai bảng ở cùng file
  nên không thể trôi khỏi nhau; (b) 30/35 công trình mỗi thành phố là nhà dân — con số này chỉ dùng
  để CHẤM ngân sách, không dùng để dựng hình.

- **Điều kiện xem lại**: nếu một phase sau muốn thêm kiểu cửa thứ sáu, phải trả lời được *"nó phục
  vụ ít nhất hai kỷ, và nó diễn đạt một hình học mà năm kiểu kia không diễn đạt được"* — nếu không
  thì thứ cần sửa là bốn con số của kỷ ấy, không phải danh sách. Và nếu `eraStyle.js` vượt ~800
  dòng thì tách bảng `groundFloor` ra file riêng (Đàm đã chốt ngưỡng này).

- **Quyết định thứ ba (bổ sung cùng ngày, sau khi đo đủ 15 kỷ) — bài test "không thêm lệnh vẽ" phải
  hỏi QUẦN THỂ THẬT, không phải một quần thể dựng cho tiện.** Bài ấy hỏi *"tập họ vật liệu của tầng
  trệt có nằm gọn trong tập họ của phần còn lại không?"*, và nó đã được sửa một lần rồi (Bước 1 —
  hỏi ở cấp CẢ KỶ thay vì từng công trình). Nhưng nó vẫn dựng quần thể bằng **7 loại × 3 hạng = 21
  công trình giả định**. Thành phố thật là **5 bản vẽ `BLUEPRINT_CATALOG`** (loại và hạng đã ấn
  định, không phải tổ hợp tự do) cộng **6–30 nhà dân** `deriveDwellings`, và cả hai đi qua
  `buildBuildingSpec` ở `sceneGraph.js`.
  - **Phương án A (giữ nguyên)**: quần thể giả định RỘNG HƠN thật, nên nó "bao trùm" mọi ca. Loại —
    rộng hơn ở vế `nen` chính là cái phễu: `nen` phình ra thì `them ⊆ nen` xanh dễ hơn.
  - **Phương án B (dùng quần thể thật)**: gọi `computeCityLayout` — một hàm THUẦN đã có sẵn. **Chọn
    B.** Cùng lý lẽ đã dùng cho `countSceneTriangles`: *đừng DỰ ĐOÁN thứ có thể ĐO*. Kèm hệ quả tốt:
    `deriveDwellings` hay catalog đổi thì bài test tự đi theo, không phải nhớ cập nhật.
  - **Trade-off đã chấp nhận**: bài mới **chặt hơn thực tế** — cảnh thật còn có cây cối, mặt đất,
    đường sá, cư dân cũng góp họ vật liệu, mà quần thể này bỏ chúng ra. Chấp nhận, vì với một ràng
    buộc dạng *"không được thêm"* thì chặt hơn là chiều an toàn: một báo đỏ oan thì ồn ào và truy
    được, một báo xanh oan thì im lặng. ⚠️ Nếu Phase 11 thật sự cần một họ mà chỉ tầng thực vật mới
    có (ví dụ `foliage` cho vườn trên mái), cách xử lý ĐÚNG là **mở rộng quần thể một cách tường
    minh RỒI đo lại bằng `--bench`**, KHÔNG phải nới câu assert.
  - ⚠️ **Đo trước khi sửa: cái phễu ấy hôm nay rộng đúng 0 họ ở cả 15 kỷ.** Bài cũ KHÔNG xanh oan —
    nó đúng nhờ một trùng hợp (`deriveDwellings` tình cờ phủ đủ house/shop/workshop, catalog tình cờ
    phủ đủ 4 loại kia). Sửa vì **trùng hợp thì gãy trong im lặng** khi thứ nó dựa vào đổi (Phase 7D),
    không vì nó đang hỏng. Ghi rõ con số 0 ở đây để phiên sau không đọc mục này thành "đã từng có bug".

---

## ADR-026 — Tầng trệt là một BẢNG BẮT BUỘC 15 kỷ trong `eraStyle.js` + một tầng hình học riêng; và trạng thái "mới làm 3 kỷ" được khai TƯỜNG MINH bằng `door: 'legacy'`

> ⚠️ **NỬA ĐẦU CỦA BẢN GHI NÀY ĐÃ BỊ ĐẢO NGƯỢC — xem ADR-029 (2026-08-18).** Bảng tầng trệt
> nay nằm ở `city3d/groundFloorStyle.js`, không còn trong `eraStyle.js`. Lý lẽ cũ (*"câu trả
> lời `country` phải nằm trong tầm mắt"*) sai vì thứ giữ ràng buộc ấy xưa nay là một BÀI TEST,
> không phải khoảng cách trên màn hình. Mọi phần còn lại của bản ghi này (bảng bắt buộc 15 kỷ ·
> tầng hình học riêng · `buildingSpec.js` chỉ ĐỌC · `door: 'legacy'` tường minh) **vẫn đúng**.

- **Ngày**: 2026-08-18 (Phase 10, Bước 1)
- **Bối cảnh**: Đàm yêu cầu thành phố có *"tầng trệt"* — cửa ra vào cho mọi công trình, bậc thềm
  nếu vật liệu và thời kỳ cho phép, và **MỘT** đặc trưng mặt phố theo kỷ; kèm hai ràng buộc gắt:
  **"KHÔNG rắc đều mọi thứ cho mọi kỷ"** và **"làm từng bước — Bước 1 đúng 3 kỷ (6 · 9 · 13), chụp
  cận cảnh, ĐO lại, rồi DỪNG và hỏi"**.
- **Vấn đề**: audit tìm ra lối vào của cả 75 công trình là **một dòng lệnh duy nhất** ở cuối
  `emitWindows` — một tấm phẳng `dark` rộng cứng **0,14**. Hai lỗi thật, đã chạy production nhiều
  tháng, không bài test nào đỏ: **(a)** kỷ 1 và 2 khai `windows: 'none'` nên hàm ấy thoát trước khi
  tới dòng cửa ⇒ **hai kỷ không hề có cửa** (đo được: 0 khối vai `dark`); **(b)** một con số tuyệt
  đối áp cho cả kỳ quan rộng 1,4 lẫn nhà dân rộng 0,45 — trên nhà dân nó chiếm 31% mặt tiền (đọc ra
  là cái cổng), trên kỳ quan 10% (đọc ra là vết nứt).
- **Phương án cân nhắc**:
  1. **Chỉnh con số 0,14 cho vừa mắt hơn.** Loại thẳng: đây đúng cái bẫy "số tuyệt đối áp lên những
     khối chênh nhau ba lần" đã cắn ở Phase 5B (`storyHeight`), 7C (`eaves`) và 7D (`roadColor`) —
     mọi lần chỉnh sau đó chỉ là đổi chỗ vấn đề sang một cỡ nhà khác.
  2. **Thêm một bảng thứ tư song song `floraStyle.js`/`streetStyle.js` (ví dụ `groundFloorStyle.js`)
     có `country` riêng + test khoá chéo.** Nhất quán với hai lần trước, nhưng nó tạo **bảng thứ tư
     phải giữ đồng bộ** với `eraStyle.country`, tức mặt tiếp xúc để trôi tăng lên; và khác hai bảng
     kia, tầng trệt là thuộc tính của **chính công trình** chứ không phải của mặt đất quanh nó.
  3. **Trường `groundFloor` tuỳ chọn, kỷ nào chưa làm thì bỏ trống.** Loại: đúng cái bẫy mà
     `vernacularRoof` (Phase 7C) đã phải làm thành trường BẮT BUỘC để tránh — trường tuỳ chọn thì
     kỷ thêm sau này lặng lẽ rơi về mặc định và cả bảng mất nghĩa.
  4. ⭐ **Trường `groundFloor` BẮT BUỘC đủ 15 kỷ, khai ngay trong `eraStyle.js`; hình học tách sang
     `city3d/groundFloor.js`; 12 kỷ chưa nghiên cứu khai TƯỜNG MINH `door: 'legacy'`** — chọn.
- **Giải pháp chọn**:
  - **Bảng nằm trong `eraStyle.js`** (không phải file thứ tư): mỗi dòng phải trả lời *"công trình
    có thật nào ở nước ấy trông như vậy?"*, và câu trả lời — `country`/`landmark` — nằm ngay cùng
    dòng, trong tầm mắt. Không có bảng thứ hai thì không có gì để trôi khỏi nhau.
  - **Hình học ở file thuần mới `src/engine/city3d/groundFloor.js`**, `buildingSpec.js` chỉ ĐỌC.
    Lý do là God File: `buildingSpec.js` đã 821 dòng và đang gánh chiều cao · mái · cửa sổ · mô-típ
    · chữ ký · giàn giáo; nhét thêm tầng trệt là đẩy nó qua 1.100 dòng.
  - **Tách kỳ quan khỏi nhà dân ở đúng chỗ nó thật sự khác**: `feature` vs `vernacularFeature` là
    hai trường khai riêng (đình làng có hàng hiên cột gỗ; nhà ống phố cổ chỉ có mái đua thấp — hai
    loại nhà khác nhau ở cùng một Hà Nội). Nhưng **kiểu cửa/khung/số bậc KHÔNG tách**, vì chúng là
    hằng số văn hoá chứ không phải dấu hiệu địa vị; thứ khác nhau giữa hai hạng là CỠ và ĐỘ RƯỜM
    RÀ, và hai thứ ấy suy được từ cờ `plain` đã có sẵn ở `archetypes.js`.
  - **Mọi kích thước là TỈ LỆ của bề ngang khối, có TRẦN**; trần đứng ngoài cùng trong phép kẹp nên
    không tồn tại cái cửa rộng hơn bức tường. Mảng nhà hẹp dưới ngưỡng thì **không có cửa**, chứ
    không phải có cửa tí hon (bài học Phase 7D: "KẸP thì phá thứ tự, ĐẨY thì không").
  - **`door: 'legacy'` là trạng thái tạm CÓ ĐẾM ĐƯỢC**: `groundFloor.test.js` khoá đúng con số 12
    và đúng ba kỷ đã làm. Bước 2 đưa con số ấy về 0 và lúc đó bài test BẮT BUỘC phải bị đụng tới.
- **Trade-off**:
  - **Được**: hai lỗi thật được sửa tận gốc; 0 lệnh vẽ mới (đo được, xem dưới); 12 kỷ chưa làm ra
    mô tả byte-identical nên hướng mỹ thuật nghiệm thu được ở 3 kỷ với rủi ro bằng 0.
  - **Mất**: `DOOR_KINDS` mang một giá trị `'legacy'` không phải kiểu cửa thật, và mã cửa đời cũ
    trong `emitWindows` phải sống thêm một phase. Đây là cái giá của việc làm từng bước, và nó được
    trả bằng một con số trong bài test chứ không phải một dòng "TODO".
  - **Vẫn còn**: kỷ 1 và 2 **vẫn chưa có cửa** — kiến trúc để sửa đã sẵn (`emitGroundFloor` được
    gọi từ `buildBuildingSpec` chứ không từ `emitWindows`), nhưng hai kỷ ấy còn `legacy` nên chưa
    hưởng. Ghi ở `TECH_DEBT #36`.
- **Ảnh hưởng đo được** (kỷ 6 · 9 · 13, cùng khung 500×320, `--bench`):
  - **lệnh vẽ: 11 → 11 · 10 → 10 · 9 → 9** — KHÔNG đổi, đúng ràng buộc Đàm đặt (lúc đó phát biểu
    là "trần 13"; ⚠️ con số ấy **đã chết** — nó suy từ mẫu 3 kỷ và kỷ 10 nằm ngoài nó. Nay là bảng
    15 mốc riêng, xem **ADR-028** và `TECH_DEBT #38`).
  - tam giác thành phố: 35.110 → 42.554 (+21%) · 38.094 → 45.842 (+20%) · 41.102 → 46.422 (+13%).
    Trần `MAX_TRIANGLES_PER_CITY` = 24.000 cho phần công trình vẫn còn dư gần một nửa (nặng nhất
    11.920). Theo mô hình chi phí đo trên M3 (`PERFORMANCE.md`), hình học gần như miễn phí —
    80% chi phí đi theo ĐIỂM ẢNH.
  - điểm ảnh đổi ở cận cảnh 1500×950: kỷ 6 **2,75%** · kỷ 9 **0,89%** · kỷ 13 **0,88%** (lệch
    trung bình 45–50/255, cao hơn nhiều ngưỡng mắt 12). Bản quét 5 kỷ 1–5 đổi **0,00%** — bằng
    chứng 12 kỷ `legacy` thật sự không suy suyển.
- **Điều kiện xem lại**: khi Bước 2 trải ra 12 kỷ còn lại thì phải xoá `'legacy'` khỏi `DOOR_KINDS`,
  xoá khối cửa cũ trong `emitWindows`, và đổi bài test "đúng 12 kỷ legacy" thành "không kỷ nào".
  Nếu Đàm thấy hướng mỹ thuật sai thì chỉ cần trả 3 dòng bảng về `legacy` — không đụng tới mã.
- ✅ **ĐÃ THỰC HIỆN NỐT (2026-08-18, Bước 2)** — cả ba việc trên đã làm, `TECH_DEBT #36` đã đóng.
  Xem **ADR-027** để biết Bước 2 quyết định thêm những gì (hai kiểu cửa mới, một đặc trưng mới, và
  phép đo bản sắc 8 trục).

## ADR-025 — Bản sắc mặt đường là CẤU TRÚC (9 trục hình học), không phải MÀU; và phép đẩy độ đậm phải có TRẦN

- **Ngày**: 2026-08-16 (Phase 9D)
- **Bối cảnh**: Đàm nhìn thành phố và nói mặt đường *"vẫn giống một dải màu phẳng: không curb,
  không sidewalk, không edge detail, không marking, kết thúc bằng mép chữ nhật và ở một số kỷ trở
  thành rãnh đen"*, kèm một yêu cầu rất cụ thể: **"sửa ROOT CAUSE thay vì chỉ chỉnh `roadColor`"**
  và **"không dùng màu để ép 15 kỷ khác nhau"**.
- **Vấn đề**: hai mục nợ đang mở, `TECH_DEBT #30` (mặt đường kỷ 11 render ra **0,113** trên nền đất
  **0,406** — dưới ngưỡng 0,12 mà mắt còn đọc ra chi tiết, đo với bóng đổ TẮT HẲN) và `#27` (ba cặp
  kỷ trùng màu đường vào ban đêm), thật ra là **MỘT** bài toán: toàn bộ bản sắc mặt đường của một kỷ
  nằm gọn trong **một mã màu**. Khi màu là trục DUY NHẤT, mọi sức ép "15 kỷ phải phân biệt được"
  dồn hết vào ĐỘ ĐẬM — mà độ đậm thì có đáy. Phase 9B đã chứng minh không có lối ra trên trục ấy:
  nới trần tới mức gần như không bão hoà thì cặp 3↔10 cũng chỉ lên **9,8/10**.
- **Phương án cân nhắc**:
  1. **Chỉnh lại 15 giá trị `roadColor` cho khéo hơn.** Rẻ nhất, và đã bị chính số liệu bác: một
     trục không đủ chỗ cho 15 giá trị vừa cách nhau vừa nằm trong vùng đọc được. Đây cũng đúng thứ
     Đàm cấm thẳng.
  2. **Nới ngưỡng của bài test "15 kỷ ra 15 mặt đường".** Loại: bài test ấy xưa nay xanh **nhờ chính
     khuyết tật đang phải sửa** (phép đẩy vô hạn thổi phồng khác biệt ở đầu tối). Nới nó là hợp
     thức hoá cái rãnh đen.
  3. **Giữ metric RGB nhưng bẻ màu cho hai kỷ đụng nhau.** Loại: cặp đụng nhau là **11↔13**, mà
     Manhattan và Tokyo **đều lát nhựa đường** — chúng gần nhau về màu là sự thật vật lý.
  4. ⭐ **Mở thêm chín trục CẤU TRÚC và chuyển phép đo bản sắc sang đó** — chọn.
- **Giải pháp chọn**: file thuần mới `src/engine/city3d/streetStyle.js` — bảng 15 kỷ × 10 trường
  (`avenue` · `lane` · `paving` · `stone` · `wear` · `curb` · `walk` · `markings` · `edge` +
  `country`), mỗi dòng buộc vào đúng đất nước mà `eraStyle.js` đã chọn và phải trả lời được *"đi bộ
  ở nước ấy thì giẫm lên cái gì?"* (cùng khuôn `floraStyle.js` đã theo cho cây cối). Ba hàm thuần
  đi kèm: `pavingSubdivision` (cỡ viên → số ô con), `streetCrossSection` (mặt cắt ngang), và
  `carriagewayExtents` (bốn mép lòng đường theo ô bên cạnh CÓ NỐI hay không). Song song, phép đẩy
  độ đậm trong `palette3d.js` đổi sang **bão hoà** (`roadContrastGap`: sàn 0,13 · trần 0,26 · vẫn
  đơn điệu ngặt), tức có cả sàn lẫn trần thay vì chỉ có sàn.
- **Trade-off**: (a) cả hệ đường vẫn là **một hình học, một vật liệu, một lệnh vẽ** — nên vỉa hè
  không có độ nhám riêng, nó chỉ sáng hơn lòng đường; đổi lại số lệnh vẽ đứng yên **13 → 13**.
  (b) `stone` bị chặn dưới bởi `MIN_STONE = 1/7` (viên 8 điểm ảnh, đo được), nên sỏi và đá cuội
  THẬT — vốn mịn hơn nhiều — không lấy đặc trưng từ hình học mà từ `wear` và `paving`. Khai mịn hơn
  không cho thêm chi tiết, chỉ cho thêm NHIỄU. (c) Số tam giác terrain+road tăng
  **27 626 → 31 546** ở kỷ nặng nhất (+14%), ms/khung +3,5% trên SwiftShader (trần trên, không phải
  số của máy thật).
- **Ảnh hưởng (đo được)**: **12/12** tổ hợp (kỷ 3·7·11·14 × 12h·15h·22h) đạt cả hai lời hứa —
  khoảng cách đường↔đất xấu nhất **0,061** (ngưỡng mắt 0,05) và "hố" sâu nhất **0,202** (trần 0,26),
  cùng còn ~22% biên. Bản sắc trên **105 cặp kỷ**: cặp yếu nhất khác **3/8 trục**, trung vị **6/8**,
  không cặp nào dưới 3. Phép chấm 15 kỷ toàn cảnh (`sweep-score.mjs`) giữ nguyên **15/15 chặng** và
  **105/105 kỷ**.
- **⚠️ Phát hiện kèm theo, quan trọng cho mọi phiên sau**: (1) kỷ 7 lấy `roadColor` từ
  **pietraforte** — đá XÂY TƯỜNG của Palazzo Vecchio — trong khi Firenze LÁT đường bằng **pietra
  serena** (xám-xanh); đá ấy cùng họ màu với nền đất ấm của kỷ 7 nên con đường chỉ còn độ sáng để
  tách khỏi đất, đo được **0,050 lúc 12h và 0,019 lúc 22h**. Sửa sang đúng vật liệu ⇒ **0,200 /
  0,191 / 0,198**. (2) Bản đầu của Phase 9D thu hẹp ô đường ở **cả hai chiều** theo bề rộng kỷ khai,
  làm con đường vỡ thành những mảng nhựa rời rạc — bề rộng là đại lượng của MẶT CẮT NGANG, áp nó lên
  chiều DỌC là hiểu sai chính đại lượng ấy; `carriagewayExtents` sinh ra từ đó và nó xoá luôn việc
  phải phân biệt `variant`.
- **Điều kiện xem lại**: nếu thêm kỷ thứ 16 (bảng phải khai đủ 10 trường, `isValidStreetStyle` chặn
  thẳng); nếu HUD hiệu năng trên iPhone cho thấy tấm đường là chỗ nghẽn (lúc đó hạ `pavingSubdivision`
  theo LOD là cần gạt sẵn có); hoặc nếu muốn vỉa hè có độ nhám riêng — lúc đó phải chấp nhận thêm
  một lệnh vẽ và đo lại.

---

## ADR-024 — Đèn trời là một TỈ LỆ CỦA NẮNG, không phải một hằng số rời; và bóng đổ chỉ được cấu hình ở MỘT chỗ

- **Ngày**: 2026-08-15 (Phase 9B)
- **Bối cảnh**: Đàm yêu cầu *"bóng đổ không được là những mảng đen cứng, phẳng và tuyệt đối"*. Đo
  bằng `scripts/shadow-score.mjs` trên kỷ 7/11/13: sàn độ sáng **0,029–0,109**, **8,2–20,8% khung
  hình bị nghiền** dưới ngưỡng 0,12 mà mắt còn đọc ra chi tiết. Vùng tối là ĐEN, không phải LAM.
- **Vấn đề**: chính chú thích trong `sceneGraph.js` đã tuyên bố mục tiêu *"vùng tối chuyển từ ĐEN
  sang LAM"* và tự kết luận là đạt — nhưng nó **chưa bao giờ được đo**. Đèn bán cầu (0,34) và nắng
  (2,15) là hai hằng số KHÔNG biết nhau, trong khi thứ quyết định độ đen của bóng đổ là **khoảng
  cách giữa chúng**. Chú thích ngay tại chỗ còn tự thú rằng Phase 7A đã hạ đèn bán cầu theo một
  giả thuyết về sau bị bác, *"và nó ở lại thêm nhiều phase"*.
- **Phương án cân nhắc**:
  1. **Nâng thẳng hằng số đèn bán cầu.** Rẻ nhất. Loại: đây đúng là thứ đã hỏng một lần — một con
     số rời không diễn đạt được một luật nói về QUAN HỆ, nên lần chỉnh nắng kế tiếp lại phá nó
     trong im lặng (đúng hình dạng lỗi mặt đường Phase 7D).
  2. **`LightShadow.intensity`** (three ≥0.165) — nâng riêng điểm ảnh trong bóng, không đụng vùng
     nắng. Loại làm phương án CHÍNH: nó cộng lại ánh sáng **ẤM của nắng** vào bóng, tức đẩy chênh
     sắc nóng-lạnh sai chiều, trong khi bóng ban ngày ngoài đời phải NGẢ LAM.
  3. **`VSMShadowMap` + `shadow.radius`** để làm mềm mép bóng. **Đã thử thật, đã xác minh là sống**
     (vặn `radius` lên 60 thì các con số có dịch), nhưng ở bán kính an toàn thì **không đo được và
     không nhìn ra khác biệt nào**, mà VSM lại mang sẵn rủi ro rò sáng. Loại: không ship một thay
     đổi mà mình không chứng minh được lợi ích.
  4. ⭐ **Phát biểu đèn trời thành TỈ LỆ của nắng** — chọn.
- **Giải pháp chọn**: `SUN_BASE` là đại lượng có tên; đèn bán cầu = `SUN_BASE × SKY_FILL_RATIO`
  (0,41 theme sáng · 0,75 theme tối, giữ đúng tỉ lệ 1,84 lần giữa hai theme để không dựng lại cảnh
  đêm đã chỉnh riêng ở Phase 3M/5A). Nắng đổi thì đèn trời tự đi theo, mãi mãi.
  Kèm theo: **cấu hình bóng đổ dồn hết vào `applyPaintedLook`** và **cỡ bản đồ bóng do chính cảnh
  đặt lúc dựng** (`SHADOW_MAP_DESKTOP = 2048`, điện thoại 512).
- **Trade-off**: bản đồ bóng 2048 tốn 16 MB texture trên máy bàn (điện thoại giữ 512). Mép bóng
  của PCF hẹp lại theo texel, tức bóng NÉT hơn — đổi lại chân tường và gờ mái (Phase 8A) mới đủ
  điểm ảnh để đổ ra một cái bóng thật thay vì một vệt răng cưa.
- **Ảnh hưởng (đo được)**: sàn **0,107→0,170 · 0,029→0,054 · 0,109→0,160**; bị nghiền
  **13,4→0,2% · 16,9→11,1% · 8,2→2,7%**; **độ tươi đứng yên** (0,131→0,136 · 0,117→0,114 ·
  0,082→0,082) và khoảng cách sáng-tối còn nhích lên (0,480→0,503) ⇒ KHÔNG rơi vào bẫy "pastel như
  sữa" của Phase 7A, vì lần này nắng đi lên cùng.
- **⚠️ Phát hiện kèm theo, quan trọng cho mọi phiên sau**: cỡ bản đồ bóng từng viết cứng ở **ba nơi
  với ba giá trị** — app 1024, trang xem thử một-kỷ 1024, **bản QUÉT 15 kỷ chỉ 512**. Mà bản quét
  chính là công cụ `CLAUDE.md` bắt buộc dùng để duyệt mỹ thuật ⇒ mọi nhận xét về bóng đổ rút ra từ
  nó đều đang nói về một thế giới thô gấp đôi thứ Đàm nhìn thấy.
- **Điều kiện xem lại**: nếu HUD hiệu năng trên iPhone của Đàm cho thấy bóng đổ là chỗ nghẽn; hoặc
  nếu sau này muốn mép bóng MỀM hơn thì VSM là hướng đã dò sẵn (xem phương án 3).

---

## ADR-023 — Phối cảnh không khí là việc của SƯƠNG (theo khoảng cách thật), không nướng sẵn vào nước sơn — đảo ngược một nửa quyết định cũ về `outskirts`

- **Ngày**: 2026-08-15 (Phase 9A)
- **Bối cảnh**: Phase 9A thay tấm ván phẳng vùng ngoài bằng địa hình thật (ADR-022). Ngay ảnh chụp
  đầu tiên lộ ra một chuyện không liên quan gì tới hình học: cả dãy núi được sơn bằng màu TRỜI chứ
  không phải màu ĐẤT, nên nó đọc ra là sương/nước. Đo: `outskirts` = `#90a2a8` (góc màu ~193°, xanh
  lơ) trong khi mặt đất thành phố = `#a09871` (~46°, khaki ấm) — **lệch 147°**.
- **Vấn đề**: `outskirts` pha sẵn **42%** về màu chân trời. Quyết định ấy ĐÚNG khi nó ra đời, và
  đúng vì hai lý do rõ ràng: tấm ván phẳng 12 tam giác (a) không có sương thật nên không tự lùi ra
  sau được, và (b) không có sườn dốc nào để hứng nắng nên nếu không pha màu chân trời thì nó là thứ
  DUY NHẤT trong cảnh đứng im suốt 6 chặng ngày. **Cả hai tiền đề đều bị Phase 9A gỡ bỏ** — đúng
  hình dạng bài học Phase 8C: một kết luận hết đúng mà không ai động vào nó. Giữ nguyên 42% sau khi
  đã có `FogExp2` thật là **tính phối cảnh không khí hai lần**, và lần thứ hai thì tính sai, vì một
  hằng số áp đều cho cả vành đất sát thành phố lẫn rặng núi ngoài cùng.
- **Phương án đã cân nhắc**:
  1. *Giữ 42%, chỉnh riêng màu tấm núi cho ấm lên.* Bác: hai tấm gặp nhau ở chỗ giáp, nên chúng phải
     khởi hành từ CÙNG một màu; tách ra là tự tạo một đường viền chạy vòng quanh thành phố.
  2. *Thêm một vai màu mới `outland` (màu đất, không pha sương) và để `outskirts` nguyên.* Bác: đúng
     câu hỏi mà `CLAUDE.md` bắt tự hỏi trước khi tạo mới — *"có tạo thêm một pattern mới trong khi
     pattern tương tự đã tồn tại không?"*. Hai vai màu gần như trùng nghĩa sẽ trôi khỏi nhau.
  3. **(CHỌN)** *Hạ pha về chân trời 0,42 → 0,15 và để sương lo phần còn lại.*
- **Giải pháp**: `outskirts` trở lại là một màu ĐẤT. Chừa 0,15 vì vẫn còn một việc thật — vành đất
  sát thành phố nằm ở chỗ sương gần bằng không, mà nó đã đủ xa để mắt mong thấy chút hơi lam.
- **Đánh đổi**: màu lam của ĐÊM nay phải đến từ ánh sáng (ánh trăng lạnh + sương nhuộm theo màu chân
  trời đêm) chứ không từ nước sơn. Đó là đường đúng hơn nhưng nó **dời một sự phụ thuộc**, nên chú
  thích cũ khẳng định *"ban đêm nó vốn đã tự ngả lam sâu rồi"* đã được sửa tại chỗ thay vì xoá.
- **Ảnh hưởng đo được**: chỗ giáp hai tấm hết chỏi — trước: `#626855` (sáng 0,37) đụng `#7a8876`
  (sáng 0,50); sau: hai bên cùng họ màu đất, mắt đọc ra một phong cảnh liền thay vì một cái bệ và
  một cái hào.
- **Điều kiện xem lại**: nếu sau này có ai bỏ `FogExp2` hoặc hạ mật độ về gần 0, thì tiền đề của
  chính ADR này biến mất và phải xem lại con số 0,15 — không phải chỉnh nó, mà hỏi lại vì sao.

---

## ADR-022 — Chân trời là một TRƯỜNG CAO ĐỘ RIÊNG theo kỷ, độc lập với `relief` của mặt đất thành phố

- **Ngày**: 2026-08-15 (Phase 9A)
- **Bối cảnh**: `terrain.js` khai thẳng cho kỷ 13 *"đô thị Nhật kẹp giữa núi"*, kỷ 7 *"đồi Toscana
  nối nhau"*, kỷ 8 *"Lisbon thành phố bảy quả đồi"*. Chụp ảnh ra thì **không có lấy một quả đồi
  nào**: ra khỏi lưới 3,4 ô, thế giới là một tấm ván phẳng 72×72 tô một màu, 12 tam giác. Dữ liệu
  địa lý đã nằm sẵn trong dự án từ Phase 7B; tầng vẽ vứt nó đi.
- **Vấn đề**: hệ quả không chỉ là "thiếu núi". Camera chúi 34,4° trừ nửa FOV dọc 19° ⇒ **mép trên
  khung hình nằm 15,4° DƯỚI tầm mắt**, nên 0% khung hình là trời (đã chứng minh bằng cách sơn vòm
  trời đỏ chói rồi chụp). Cả bức ảnh vì thế chỉ có HAI lớp: thành phố, và một mảng phẳng chiếm ~25%
  mỗi tấm ảnh. Đó chính là cảm giác "mô hình đặt trên bàn" mà Đàm yêu cầu xoá.
- **Phương án đã cân nhắc**:
  1. *Nhân `ERA_TERRAIN[era].relief` lên để mặt đất tự nhô thành núi ở xa.* Bác, và đây là lần thứ
     NĂM của cùng một bài học "một trường gánh hai việc". Hỏi đúng câu hỏi cũ — *"ngoài đời hai thứ
     này có luôn đi cùng nhau không?"*: Kyoto lòng thung gần phẳng mà núi quanh cao ngất (thấp↔cao)
     · Manhattan nền phẳng và cũng chẳng có núi (thấp↔thấp) · Burg Eltz mỏm đá dốc nhất 15 kỷ, đồi
     rừng quanh cũng cao (cao↔cao) · Dubai thành phố san phẳng, đụn cát xa thì có sóng (thấp↔vừa).
     Bốn tổ hợp đủ cả bốn góc ⇒ hai đại lượng ĐỘC LẬP, và không cách chỉnh khéo nào thoát ra được.
  2. *Dựng vòm ảnh nền (skybox) vẽ sẵn dãy núi.* Bác: 15 kỷ × 6 chặng ngày = 90 tấm ảnh phải nuôi,
     và chúng sẽ không bao giờ khớp với ánh sáng/sương đang tính động.
  3. **(CHỌN)** *Một mô-đun thuần riêng `city3d/horizon.js`*, bảng 15 kỷ, trường cao độ fBm.
- **Giải pháp**: `HORIZON_STYLES` 5 trường (`rise`/`grain`/`rough`/`ridged`/`near`) + `buildHorizon`
  trả về `heightAt`. Hai điểm phải nói rõ vì cả hai đều đã trả giá trong chính phase này:
  (a) **fBm chứ không phải một tầng nhiễu** — một tầng chỉ có đúng một cỡ hình nên ra "bong bóng
  tròn xoe như sáp chảy"; (b) **`grain` và `rough` là hai trường** (cỡ khối núi ≠ độ gồ ghề bề mặt)
  — lần thứ SÁU của "một trường gánh hai việc", vì một đụn cát Sahara rất LỚN mà mặt cực TRƠN.
- **Đánh đổi**: (a) +43k tam giác (cảnh ~74k) — chấp nhận theo đúng chỉ đạo *"không được hy sinh
  chất lượng hình ảnh trước một vấn đề hiệu năng chưa được đo"*, và còn nợ một lần đo trên iPhone;
  (b) tấm núi KHÔNG nhận bóng và KHÔNG đổ bóng — vì đúng chứ không phải vì nhanh: khung bóng đổ chỉ
  bó quanh lưới 12×12, điểm ngoài khung sẽ tra nhầm mép bản đồ bóng và cả dãy núi đen kịt (đã thấy
  tận mắt với tấm ván cũ).
- **Ảnh hưởng đo được**: số lớp không gian ở dải xa (`scripts/depth-score.mjs`) **0 → 55**; biên độ
  0 → 0,241. Kỷ 13 dựng núi cao > 2,5 đơn vị, kỷ 12 giữ < 1,0 — có test khoá cả hai đầu.
- **Điều kiện xem lại**: nếu `DEFAULT_PITCH` hoặc `CITY_CAMERA_FOV` đổi tới mức bầu trời lọt vào
  khung hình, thì tiền đề "100% khung là mặt đất" biến mất và phải cân lại tỉ trọng núi/trời.

---

## ADR-020 — Thảm thực vật có NGỮ PHÁP RIÊNG (bảng loài theo kỷ + thư viện hình khối), không phải mấy nhánh `if` trong bộ vẽ cảnh vật

- **Ngày**: 2026-08-15 (Phase 8D)
- **Bối cảnh**: Đàm yêu cầu *"thay thế toàn bộ visual language của cây và environment props, vì cây
  cone + cylinder hiện là một trong những yếu tố khiến cảnh vẫn giống prototype"*, với đích rõ ràng:
  *"nhìn vào phải nhận ra CÂY, không phải 'hình nón màu xanh trên một cái que'"*.
- **Vấn đề**: hình dáng cây nằm trong ba nhánh `if` viết cứng giữa hàm `tree()` của `propSpec.js`
  (`era >= 10` → một mẫu · `style.rough > 0.5` → mẫu hai · còn lại → mẫu ba). Đo được: **40 hạt
  giống ra ĐÚNG MỘT cấu trúc khối** (hạt chỉ đổi được chiều cao, trong dải 1,32 lần), và **cả 15 kỷ
  chỉ có 3 mẫu cây**. Đây KHÔNG phải lỗi mã — mã chạy đúng như viết. Đây là lỗi THIẾU KIẾN TRÚC:
  nhà cửa từ Phase 3B đã có hẳn một ngữ pháp ba trục (kỷ × loại × độ hiếm) để thoát khỏi đúng cái
  bẫy này; thảm thực vật chưa bao giờ được cho một ngữ pháp nào cả, nên hạt giống chỉ có chỗ để đổi
  CON SỐ, không có chỗ để đổi HÌNH DẠNG.
- **Phương án đã cân nhắc**:
  1. *Thêm biến thể vào ba nhánh `if` sẵn có.* Rẻ nhất, nhưng đó chính là cách bốn phase trước đã
     làm cho `eaves`, cho `storyHeight`, cho `roof` — và cả bốn lần bệnh gốc quay lại ngay khi số
     đối tượng tăng lên. Chỉnh khéo một tham số bị trộn hai nghĩa thì chỉ đổi chỗ vấn đề.
  2. *Nhập mô hình cây dựng sẵn (glTF).* Đẹp nhất, nhưng phá vỡ kỷ luật nền tảng: `src/engine/` là
     tầng THUẦN, test được bằng `node --test` không cần DOM/WebGL; nhét tài nguyên nhị phân vào đó
     là mở một loại phụ thuộc mới, cộng thêm dung lượng tải và một trần cache PWA phải trông coi.
  3. *Tăng `sides` cho tán mượt hơn.* Đã bác ngay từ đầu bằng lý lẽ, và lý lẽ đó nay nằm ở đầu
     `flora.js`: một khối lồi mượt hơn thì càng giống HÌNH HỌC hơn, không giống cây hơn.
  4. **(CHỌN)** *Sao chép đúng kiến trúc nhà cửa cho cây*: một bảng tham số theo kỷ + một thư viện
     hình khối + một bộ ghép mỏng.
- **Giải pháp**: ba lớp, mỗi lớp một việc — `floraStyle.js` (bảng 15 kỷ: loài + trọng số + cỡ + mật
  độ + tầng cây bụi + màu lá) · `flora.js` (7 hàm dựng hình, mỗi loài một bóng dáng) · `propSpec.js`
  (chỉ còn ghép). Nguyên tắc chống-primitive nằm gọn trong một câu: **tán là NHIỀU THUỲ chồng lấn
  lệch tâm, không phải MỘT khối lồi** — ba thuỳ tự sinh ra cả bốn thứ mà một khối lồi không thể có
  (viền lồi lõm, mặt này đổ bóng lên mặt kia, xoay ra hình bóng khác, chỗ nối thân–tán bị che).
- **Đánh đổi**: (a) tốn thêm ~132 tam giác/cây thay vì 44 — nhưng phần này đã được **trả đủ** bằng
  trần phủ xanh (xem ADR-021), tổng cảnh chỉ +0,4%; (b) cây vẫn không NGHIÊNG được, vì `parts.js`
  chỉ xoay quanh trục đứng — thêm một trục xoay sẽ chạm vào nhà máy hình học, phép đếm tam giác và
  phép tính cạnh vát của cả 75 công trình, để đổi lấy một thứ gần như không đọc ra ở cỡ 40 điểm ảnh;
  (c) 15 dòng bảng phải được ai đó nuôi — chống trôi bằng một bài test bắt mỗi dòng nhắc đúng
  `country` mà `eraStyle.js` đã khai.
- **Ảnh hưởng đo được**: **405 cấu trúc cây khác nhau** trên 15 kỷ (trước: 3) · 17–33 dáng trên mỗi
  40 hạt của từng kỷ (trước: 1) · 100% cảnh vật di động được đã lệch khỏi tâm ô lưới (trước: 0%).
- **Điều kiện xem lại**: nếu sau này `parts.js` có trục nghiêng (vì một lý do khác), quay lại cho
  cành và tàu lá chĩa xiên — đó là thứ duy nhất còn thiếu để hình bóng cây thật sự tự nhiên.

---

## ADR-021 — Mật độ cây là một TỈ LỆ với đất còn trống, không phải một số cây tuyệt đối

- **Ngày**: 2026-08-15 (Phase 8D)
- **Bối cảnh**: Đàm yêu cầu *"không rải cây đều nhau trên grid; tạo cluster tự nhiên với khoảng
  trống hợp lý"*. Phase 8D thêm cơ chế mọc thành lùm để làm vế đầu.
- **Vấn đề**: cơ chế lùm chỉ có nghĩa khi CÒN CHỖ TRỐNG để mà tụ. Đếm thử một thành phố trưởng thành
  (80 phiên): **10/15 kỷ có ĐÚNG 0 ô đất trống** — lưới 12×12 kín đặc. Ở trạng thái ấy mọi cơ chế
  phân bố đều vô nghĩa, và cảnh quay về đúng cái "rải đều trên lưới" mà cả phase sinh ra để xoá.
  Một nửa lỗi ấy do chính Phase 8D: trần cảnh vật vốn 34, tôi nâng lên 48 để mật độ theo kỷ có chỗ
  khác nhau — nhưng nâng một trần TUYỆT ĐỐI trong một cái lưới hữu hạn thì thứ tăng thêm không phải
  "mật độ", mà là "tỉ lệ lấp đầy", và nó tăng cho tới khi chạm trần cứng 144 ô.
- **Phương án đã cân nhắc**:
  1. *Hạ trần tuyệt đối về 34 như cũ.* Xoá được triệu chứng, nhưng cũng xoá luôn khả năng phân biệt
     Singapore rậm với UAE thưa — tức trả lại một bài toán để lấy một bài toán khác.
  2. *Trần phủ CỐ ĐỊNH (72% đất trống).* Đã làm, đã đo, và **đã bị số liệu bác**: kỷ 14 (mật độ
     1,42 — rậm nhất) và kỷ 15 (0,66 — thưa nhất) ra **cùng 21 cảnh vật**, vì ở thành phố trưởng
     thành nhà dân ăn hết đất nên cả hai chỉ còn 30 ô trống và cái trần chung đè bẹp cả hai đầu.
  3. **(CHỌN)** *Trần phủ theo tỉ lệ, và chính TỈ LỆ ấy mang mật độ của kỷ.*
- **Giải pháp**: `coverShare = clamp(0,55 × density, 0,28…0,80)`, rồi `budget ≤ freeGround ×
  coverShare`. Giữ song song cả trần tuyệt đối cũ vì **chỗ thắt cổ chai đổi theo tuổi thành phố**:
  lúc trẻ đất mênh mông nên trần tuyệt đối trói (nói "kỷ này bao nhiêu cây"), lúc đông đất hiếm nên
  trần tỉ lệ trói (nói "chừa lại bao nhiêu đất"). Bỏ vế nào cũng có một quãng đời thành phố mất hẳn
  mật độ theo kỷ.
- **Đánh đổi**: hai cái trần cùng đọc một trường `density` — phải giải thích rõ tại chỗ, nếu không
  phiên sau sẽ tưởng là trùng lặp rồi gộp lại và làm hỏng một trong hai quãng.
- **Ảnh hưởng đo được**: mọi kỷ nay chừa **7–24 ô đất trần** (trước: 0 ở 10/15 kỷ) · kỷ 14 ra 23
  cảnh vật còn kỷ 15 ra 10 (trước: 21 và 21) · và vì cảnh vật ít đi, **toàn bộ chi phí tam giác của
  cây nhiều thuỳ được trả đủ**: trung bình 30.656 → 30.769 (+0,4%).
- **Bài học chung**: đây là bài học *"một con số tuyệt đối không diễn đạt được một luật nói về QUAN
  HỆ"* (Phase 7D, mặt đường) dưới một hình dạng mới. "Rậm hơn kỷ khác" là quan hệ giữa các kỷ; "còn
  chừa đất trống" là quan hệ với chỗ đất còn lại. Một cái trần đếm-số-cây không nhìn thấy cái nào
  trong hai thứ đó.
- **Điều kiện xem lại**: nếu số nhà dân theo phiên đổi (Phase 7C), đo lại — chính nhà dân là thứ
  ăn mất đất trống ở thành phố trưởng thành.

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
