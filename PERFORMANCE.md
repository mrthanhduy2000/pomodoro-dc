# Ngân sách hiệu năng — Thành Phố 3D

> **Đây là bản ghi CHÍNH THỨC của bộ số đo trên máy thật.** File kết quả gốc
> (`.city-preview/bench-macbook.txt`) nằm trên MacBook của Đàm và **không có trong repo** —
> `.city-preview/` bị `.gitignore` bỏ qua. Vì vậy bảng dưới đây *là* bản ghi, không phải bản tóm
> tắt của một file nào khác trong repo.
>
> Mục đích của file này: trả lời câu *"còn được phép làm thành phố đẹp tới đâu"* bằng SỐ, thay vì
> bằng cảm giác. Trước khi thêm bất cứ thứ gì vào cảnh 3D, đọc mục **Ngân sách** và **Nên / Không
> nên** ở dưới.

---

## ⚠️ HAI LUẬT ĐÀM RA NGÀY 2026-08-20 — ĐỌC TRƯỚC MỌI THỨ KHÁC TRONG FILE NÀY

Máy đích là **MacBook Air M3**, thừa sức cho khối hình học hiện tại. Vì vậy **số tam giác KHÔNG
CÒN là một hạng mục cảnh báo**: không ghi *"+55,8% tam giác chưa đo"* như một món nợ đang phình,
không nhắc `bench-macbook.sh` ở mỗi báo cáo. Thay vào đó, đúng hai luật, và **giữ đúng chừng này**:

**(1) KHÔNG TRÍCH MỘT CON SỐ MILI-GIÂY NÀO CHƯA ĐO.** Không viết *"ước lượng ~0,3 ms"*, không suy
ra từ mô hình chi phí rồi trình bày như một kết quả. **Không có phép đo thì không có con số — bỏ
trống, và đừng chú thích vì sao bỏ trống.** (Lý do đã trả giá: mô hình chi phí từng nói dối đúng
theo hướng trấn an — HUD báo 34.622 tam giác trong khi máy vẽ 78.748.)

**(2) GIỮ NGUYÊN CÁC RÀNG BUỘC ĐẾM ĐƯỢC:** số **lệnh vẽ** · số **họ vật liệu** · số **nguồn sáng**
· số **texture** · số **shader động**. Đó là các trục ĐẮT thật và kiểm được **miễn phí bằng test
thuần**, không liên quan gì tới sức máy. Mốc lệnh vẽ riêng từng kỷ nằm ở `drawCallBudget.test.js`.

`bash scripts/bench-macbook.sh` chạy **một lần ở cuối Bước C** như một lượt làm mới số liệu — **không
phải một cổng, không phải một blocker**. Mọi bộ số dưới đây vẫn giữ nguyên giá trị lịch sử của nó.

⚠️ **ĐÃ CHẠY 2026-08-20 (nghiệm thu Bước C) — VÀ NÓ TỰ DỪNG Ở CẢNH ĐẦU, ĐÚNG THIẾT KẾ.** Hộp cát AI
tô hình bằng CPU (`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)`),
nên script in nguyên khối `!!! DỪNG. Trình duyệt KHÔNG dùng card đồ hoạ thật.` rồi thoát thay vì đẻ
ra một bảng ms vô nghĩa. **Bộ số M3 ngày 2026-08-17 dưới đây vẫn là bộ số hiện hành**; muốn làm mới
thì phải chạy trên MacBook của Đàm. Cái gác ấy **còn sống, không phải mã chết** — lần chạy này là
bằng chứng.

✅ **NHƯNG NÓ CHO MỘT ĐỐI CHIẾU CHÉO MIỄN PHÍ, VÀ ĐÓ MỚI LÀ THỨ ĐÁNG GHI.** `renderer.info` đếm cùng
một thứ bất kể bộ tô hình là GPU hay CPU, nên phần `[stats]` của cảnh đầu tiên vẫn dùng được. Kỷ 3 ·
12 giờ · `--sessions 80 --level 3` (đúng đầu vào của bảng Bước C bên dưới) ra:

| | thành phố | nền (trời+núi) | tổng |
|---|---:|---:|---:|
| lệnh vẽ | 11 | 2 | **13** |
| tam giác | 77.918 | 44.126 | **122.044** |

Bảng "Sau VIỆC 2 Bước C" ghi kỷ 3 = **122.044 tam giác · 13 lệnh vẽ**. **Khớp từng đơn vị**, bằng
một đường đo hoàn toàn độc lập (Chromium `renderer.info` ↔ phép duyệt cảnh thuần của
`scene-count.mjs`). Đây đúng là phép đối chiếu mà `TECH_DEBT #43` kê đơn sau khi 6/15 dòng của bảng
Phase 11 trôi trong im lặng — và lần này nó nói: **bảng Bước C KHÔNG trôi.**

---

## Đo bằng gì, lúc nào

| | |
|---|---|
| **Lệnh đã sinh ra bộ số** | `bash scripts/bench-macbook.sh` |
| **Ngày đo** | 2026-08-17 |
| **Máy** | Apple **M3** — ANGLE Metal Renderer |
| **Cửa sổ** | **1100 × 700** · DPR **2** ⇒ khung đệm thật **2200 × 1400** = 3,08 triệu điểm ảnh |
| **Phạm vi** | 24/24 cảnh của ma trận (kỷ 3/7/11/14 × giờ 12/15/22 × góc rộng/gần) **+ 1 cảnh đối chiếu** ở 1600×1000 — tất cả **ĐẠT** |
| **Mỗi cảnh** | 120 khung hình, `--sessions 80 --level 3`, 12 khung khởi động bị vứt |
| **Mã nguồn lúc đo** | nhánh `claude/xay-san-pham-huong-nay-nasr3n`, commit `48d3c83` |

---

## §3 BƯỚC 1 — MA TRẬN ĐO CHO MẶT TRẬN NÂNG CHẤT LƯỢNG HÌNH ẢNH (2026-08-20, CHỜ ĐÀM CHẠY)

> ⚠️ **Bộ số trong mục này CHƯA TỒN TẠI.** Đây là phần chuẩn bị; con số phải do Đàm chạy trên
> MacBook M3 mới có. Hộp cát của AI dùng SwiftShader (tô hình bằng CPU) nên mọi ms đo ở đó vô
> nghĩa — cái gác trong `bench-macbook.sh` tự chối đúng thiết kế. **Không có số thì không viết một
> dòng hiệu ứng nào** (lệnh Đàm).

**Vì sao lần này phải đo lại dù đã có bộ số 2026-08-17.** Bộ cũ trả lời câu *"kỷ nào nặng"* và kết
luận **hình học thì rẻ, điểm ảnh và ánh sáng mới đắt** (≈ 0,87 ms cố định + 1,14 ms mỗi TRIỆU điểm
ảnh thật). Mặt trận mới — khử răng cưa · bóng mềm · che khuất môi trường · phản chiếu mặt nước ·
tone mapping — **toàn bộ là chi phí ĐIỂM ẢNH**. Đây là mặt trận đầu tiên tiêu vào đúng trục đắt,
nên không được suy từ mô hình cũ; phải đo lại trên chính cây mã hiện tại.

**Hai thứ đã sửa trong `bench-macbook.sh` để lượt chạy đó trả lời đúng câu hỏi:**

**(1) Thêm CẢNH NẶNG NHẤT.** Ma trận cũ chạy 24 cảnh ở cửa sổ thường, rồi đúng **một** cảnh ở cửa
sổ lớn — và cảnh ấy là kỷ 7 · 12 giờ, tức góc **NHẸ NHẤT** của cả bộ (12 giờ là chặng chưa bật
đèn). Nghĩa là chỗ đắt nhất chưa bao giờ được đo, trong khi bảng số trông đã đầy đủ. Nay có thêm
một cảnh thứ 26: **kỷ nhiều tam giác nhất × 22 giờ (đèn bật) × cửa sổ 1600×1000** — chỗ duy nhất
cả ba trục đắt cùng ở mức cao nhất, tức chỗ ngân sách cạn TRƯỚC.

⚠️ **Kỷ nặng nhất được HỎI lúc chạy, không viết cứng.** Hôm nay là **kỷ 14 — 179.182 tam giác**
(đo bằng `node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs`, `--sessions 80
--level 3`), nhưng "nhiều tam giác nhất" là một **QUAN HỆ**, không phải một con số: Phase 11 một
mình đã thêm 110.076 tam giác lên mái. Một hằng số viết cứng sẽ lặng lẽ trỏ vào một kỷ đã thôi là
kỷ nặng nhất, và bộ đo vẫn in ra một bảng trông hoàn toàn hợp lý — đúng bẫy Phase 7D. `scene-count.mjs`
là hàm THUẦN (duyệt scene graph, không cần Chromium, ~10 giây) nên hỏi nó là rẻ. Không hỏi được thì
script **KÊU TO** rồi mới dùng số dự phòng, không im lặng. Cả ba điều này có test khoá
(`scripts/benchMacbookSource.test.js`, 3 bài mới, cả 3 đã thử-cho-đỏ).

Bảng tam giác hiện tại (15 kỷ, `--sessions 80 --level 3`; **số tam giác KHÔNG đổi theo giờ** — đã
đo, kỷ 1 ra 123.840 ở cả 12h lẫn 22h, vì đèn là chi phí ÁNH SÁNG chứ không phải hình học):

| kỷ | tam giác | | kỷ | tam giác | | kỷ | tam giác |
|---|---|---|---|---|---|---|---|
| **14** | **179.182** ← nặng nhất | | 9 | 136.836 | | 3 | 122.044 |
| 4 | 169.408 | | 5 | 126.850 | | 10 | 120.070 |
| 6 | 167.546 | | 1 | 123.840 | | 12 | 124.722 |
| 13 | 163.594 | | 15 | 145.286 | | 2 | 112.140 ← nhẹ nhất |
| 7 | 158.690 | | 11 | 147.012 | | 8 | 143.902 |

**(2) Thêm khối "CÁCH ĐỌC BẢNG NÀY" in ở cuối báo cáo.** Không có nó thì hai con số đúng sẽ bị đem
so sai: **trần 8 ms định nghĩa ở KHUNG MẶC ĐỊNH 1100×700**, còn cảnh nặng nhất chạy ở 1600×1000 —
nhiều điểm ảnh hơn — nên ms của nó **không so thẳng với 8 ms được**. Ba câu hỏi, ba dòng khác nhau:

| Muốn biết | Đọc dòng nào |
|---|---|
| **Còn bao nhiêu ms để tiêu** | (a) P50 của cảnh CHẬM NHẤT trong 24 cảnh ở 1100×700, rồi lấy `8 −` số đó |
| **Chi phí theo điểm ảnh** | hiệu số hai dòng kỷ 7 · 12 giờ · zoom 1 ở hai cỡ cửa sổ (khác nhau ĐÚNG một thứ) |
| **Chỗ cạn trước** | dòng CẢNH NẶNG NHẤT — cho biết thứ tự các trục đắt, KHÔNG cho biết dư địa ở khung mặc định |

**Đã có sẵn, không phải sửa:** bộ đo vốn đã in **P50 · P95 · nhanh nhất · chậm nhất** cho từng cảnh
(dòng `[bench] (a)`) cùng **DPR thật** và cỡ bộ đệm vẽ (dòng `[bench] DPR=…`) — tức yêu cầu *"in rõ
ms mỗi khung ở DPR thật, không phải trung bình gộp"* đã được đáp ứng từ vòng 2.

**Ràng buộc Đàm ra cho cả mặt trận này** (khác các phase trước — chép ra đây để không phải đi tìm):
· **ĐƯỢC** tiêu chi phí điểm ảnh, đó là mục đích — nhưng phải đo **TỪNG MÓN**, mỗi món một commit,
đo trước/sau bằng `--frame`, rollback độc lập được; cấm gộp ba hiệu ứng rồi báo "đẹp hơn".
· Trần **8 ms** mỗi khung ở khung mặc định. Vượt là **dừng và báo**, không tự nới.
· **ĐỪNG HẠ DPR** để lấy lại ms — đó là bán đúng thứ đang muốn mua.
· iPhone **CHƯA từng đo** (`TECH_DEBT #23`/`#26`); mọi hiệu ứng thêm vào phải có **đường tắt cho
tier thấp**, kể cả khi chưa dùng tới.

⚠️ **Ray tracing thật KHÔNG khả thi trên nền hiện tại, và đừng hứa nó.** WebGL2 không có API dò tia
phần cứng; WebGPU thì Safari iOS chưa hỗ trợ đủ. Thứ giao được là các kỹ thuật cho ra **cảm giác**
ấy — bóng mềm, che khuất môi trường, phản chiếu mặt nước, khử răng cưa, tương phản/màu tốt hơn.

---

## Cách chạy lại bộ đo — làm đúng theo thứ tự này

> Viết cho người **KHÔNG biết code**. Chép từng dòng một, chạy xong dòng nào mới sang dòng kế.
> Lần đo 2026-08-17 mất **5 vòng qua lại** chỉ để tới được chỗ chạy lệnh — mục này tồn tại để
> lần sau không lặp lại. Mọi bước dưới đây đều đã có người vấp ít nhất một lần.

Mở **Terminal** trên Mac rồi gõ:

```bash
# 1. Vào đúng thư mục dự án. GIỮ NGUYÊN hai dấu nháy kép — đường dẫn có dấu cách.
cd "/Users/damduy/Downloads/Claude Code/Bản sao Pomodoro Game - USING"

# 2. Lấy về các nhánh mới từ GitHub (bỏ bước này thì bước 4 sẽ báo "did not match any file(s)").
git fetch origin

# 3. Xem có gì chưa lưu không.
git status
#    → nếu nó liệt kê file nào đó, gõ tiếp:  git stash

# 4. Chuyển sang nhánh cần đo (hỏi AI tên nhánh nếu không nhớ).
git checkout <tên-nhánh>

# 5. Cài thư viện. BẮT BUỘC có --legacy-peer-deps.
npm install --legacy-peer-deps

# 6. Thử máy trước — khoảng 20 giây. PHẢI thấy dòng "✅ ĐẠT" ở cuối.
bash scripts/bench-macbook.sh --thu

# 7. Chỉ khi bước 6 ✅ mới chạy thật — khoảng 5 phút.
bash scripts/bench-macbook.sh
```

Xong thì gửi lại file **`.city-preview/bench-macbook.txt`**.

### Gặp lỗi này thì gõ cái này

Đúng bốn ca đã xảy ra thật ngày 2026-08-17, theo thứ tự chúng xuất hiện:

| Trên màn hình hiện | Gõ cái này |
|---|---|
| `pathspec '<nhánh>' did not match any file(s)` | `git fetch origin` rồi làm lại bước 4 |
| `Your local changes … would be overwritten by checkout` | `git stash` rồi làm lại bước 4 |
| `❌ Thiếu thư viện 3D` · hoặc một trang lỗi dài có chữ `Rolldown` / `vite` | `npm install --legacy-peer-deps` |
| `❌ Đang KHÔNG đứng trong thư mục dự án` | chép lại nguyên dòng `cd "…"` ở bước 1 |

Từ vòng 4 trở đi, `--thu` **kiểm máy trước khi chạy** và tự in ra đúng lệnh cần gõ cho từng ca,
nên phần lớn bảng trên chỉ còn để tra cứu.

### ⚠️ Một điều CHỈ máy Đàm kiểm được

Thư mục dự án có **dấu tiếng Việt + dấu cách**. macOS lưu tên file ở dạng **NFD** (dấu tách rời
khỏi chữ cái), Linux thì lưu nguyên byte — nên bài test tự động (`scripts/benchMacbookSource.test.js`)
chạy trong hộp cát Linux **KHÔNG** chứng minh được hành vi chuẩn hoá thật của macOS. Nếu bộ đo báo
một lỗi trông vô lý (kiểu "không tìm thấy file" trỏ vào một đường dẫn bị cắt cụt ở giữa, hoặc thoát
im lặng không nói gì), **hãy nghi ngay cái tên thư mục** và gửi lại nguyên dòng lỗi cho AI.

---

## Kết quả — frame time P50 (mili-giây, càng nhỏ càng nhanh)

Toàn bộ nằm trong **3,90 – 5,20 ms**. P95 (đuôi chậm) cao nhất **6,50 ms**.

| Kỷ | 12h rộng | 12h gần | 15h rộng | 15h gần | 22h rộng | 22h gần |
|---:|---:|---:|---:|---:|---:|---:|
| **3** | 4,20 | 4,30 | 4,40 | 4,00 | **5,10** | 4,70 |
| **7** | 4,40 | 4,20 | 4,30 | 4,00 | **5,10** | 4,60 |
| **11** | 4,30 | 4,00 | 4,30 | 4,00 | **5,20** | 4,60 |
| **14** | 4,30 | **3,90** | 4,30 | **3,90** | 5,10 | 4,10 |

### Kết luận: **A — CÒN NHIỀU DƯ ĐỊA**

Ngân sách một khung hình ở 60 hình/giây là **16,67 ms**. Cảnh chậm nhất dùng **5,20 ms**.

> **Dư địa = 16,67 ÷ 5,20 = 3,2 lần** · tương đương **192 – 256 hình/giây**.

Không khung hình nào trượt 60 fps, **kể cả đỉnh nhiễu 9,2 ms** (vẫn còn cách trần 16,67 rất xa).

---

## Mô hình chi phí

Suy ra từ cảnh đối chiếu (cùng kỷ 7 · 12h, chỉ đổi cỡ cửa sổ 1100×700 ↔ 1600×1000):

> **thời gian ≈ 0,87 ms cố định + 1,14 ms mỗi TRIỆU ĐIỂM ẢNH**

⚠️ **"Triệu điểm ảnh" ở đây là ĐIỂM ẢNH THẬT, tức đã nhân DPR 2** (3,08 Mpx cho cửa sổ 1100×700, chứ
không phải 0,77). Thiếu chú thích này thì hệ số 1,14 vô dụng — ai đó sẽ nhân với số điểm ảnh CSS và
ra kết quả nhỏ hơn 4 lần.

⇒ **80% chi phí là theo ĐIỂM ẢNH, 20% là cố định.**

### Ba bằng chứng cho "trần KHÔNG nằm ở hình học"

| # | Quan sát | Con số |
|---|---|---|
| 1 | Tam giác **thành phố** chênh nhau rất nhiều giữa kỷ 3 và kỷ 11… | …**43%** hình học → chỉ **2,4%** thời gian |
| 2 | Tăng số điểm ảnh… | **×2,08** điểm ảnh → **×1,86** thời gian (gần tuyến tính) |
| 3 | 22h bật đèn (shader 4 → 5)… | chậm hơn ban ngày **≈ +0,8 ms (+19%)** ở **CẢ 4 kỷ** |

*(Bằng chứng 3 tính trên góc rộng: trung bình ban ngày 4,31 ms → 22h 5,13 ms.)*

### Phát hiện quan trọng nhất

> **Thứ ăn thời gian là GIỜ TRONG NGÀY (đèn), KHÔNG phải KỶ.**

**Không kỷ nào là điểm nóng.** Ba vòng đi tìm "kỷ nào nặng" và câu trả lời là *không kỷ nào* — trục
đúng là giờ trong ngày.

⚠️ **Rặng núi chân trời chiếm 54–63% hình học mỗi khung nhưng KHÔNG tốn thời gian đo được ⇒ ĐỪNG
ĐỤNG VÀO NÓ.** Cắt nó đi là trả một cái giá thẩm mỹ rất lớn để mua về một khoản tiết kiệm bằng 0.

### Chi phí dựng lại bản đồ bóng: **CHƯA ĐO ĐƯỢC**

Ở **mọi cảnh**, hiệu số giữa "khung có dựng lại bóng" và "khung ổn định" **nằm dưới mức nhiễu** của
chính phép đo. ⚠️ Vì vậy ở đây **không ghi một con số nào** cho nó — chỉ được nói *"nhỏ hơn mức
phép đo này phân giải được"*. Ai cần con số ấy thì phải thiết kế một phép đo khác (nhiều khung hơn,
hoặc dùng timer query của GPU), **không được trích một con số từ hiệu số nằm trong nhiễu**.

---

## Ngân sách an toàn

Giữ mức làm việc ở **8 ms** mỗi khung — tức chừa **gấp đôi** phòng hờ so với trần 16,67 ms
(phòng cho máy nóng, cho phần React/ghép ảnh chưa đo, cho màn hình lớn hơn).

> Cảnh nặng nhất hiện dùng 5,20 ms ⇒ **còn ~3 ms mỗi khung để tiêu.**

| Tiêu vào đâu | Còn được bao nhiêu |
|---|---|
| **Hình học** (số khối, số tam giác, chi tiết khối) | **Gần như không giới hạn** — tăng 3–5× tam giác vẫn chưa đo được |
| **Ánh sáng / shader** | **~1,6× hiện tại**, hoặc thêm khoảng **3–4 nguồn sáng** |
| **Điểm ảnh** (DPR, cỡ khung) | Đây là 80% chi phí — nhưng **KHÔNG hạ**, xem mục dưới |

*(Hệ số 1,6× tính từ ca XẤU NHẤT là cảnh 22h, không phải từ trung bình.)*

---

## TOP 3 NÊN LÀM

1. **Thêm hình học thoải mái** — nhiều khối hơn, bo góc mượt hơn, nhiều cây / nhà dân / cư dân hơn,
   chi tiết mặt tiền dày hơn. Đây là thứ RẺ NHẤT trong cả hệ thống: 43% chênh lệch hình học chỉ đổi
   2,4% thời gian. Mọi phase mỹ thuật dạng "thêm chi tiết" đều nằm trong ngân sách.
2. **Đầu tư vào ÁNH SÁNG, nhưng có kiểm soát** — đây mới là trục đắt, và cũng là trục cho ra khác
   biệt thị giác lớn nhất (bằng chứng 3). Còn ~1,6× hoặc ~3–4 nguồn sáng. Thêm đèn thì **phải đo
   lại**, vì trục này là trục duy nhất có thể chạm trần.
3. **Nâng chất lượng bóng đổ — kèm một phép đo mới.** Chi phí dựng bóng hiện nằm dưới nhiễu, tức có
   thể còn rất nhiều chỗ; nhưng vì *chưa đo được* nên không được coi là miễn phí. Muốn tăng cỡ bản
   đồ bóng thì thiết kế phép đo trước, tăng sau.

## TOP 3 KHÔNG NÊN LÀM

1. ❌ **ĐỪNG HẠ DPR.** Điểm ảnh chiếm 80% chi phí nên hạ DPR là cách "tối ưu" hiệu quả nhất — và
   cũng là cách phá hình ảnh nhanh nhất. **Không cần**: còn dư 3,2 lần. Ưu tiên vĩnh viễn của dự án
   là *chất lượng hình ảnh Desktop > hiệu năng*.
2. ❌ **ĐỪNG ĐỤNG RẶNG NÚI CHÂN TRỜI** (hay bất cứ thứ gì bị chọn chỉ vì "nó nhiều tam giác"). Nó
   chiếm 54–63% hình học và **0 ms đo được**. Chọn mục tiêu tối ưu theo số tam giác là chọn sai
   trục — đúng cái sai mà ba vòng đo này đã phải sửa.
3. ❌ **ĐỪNG SUY RA CHO iPhone.** Bộ số này là của M3 + Metal. iPhone **chưa đo** (xem
   `TECH_DEBT.md` #23 và #26). Một kết luận "chạy tốt" ở đây **không** nói gì về máy của Đàm trong
   túi.

---

## ⚠️ BA GIỚI HẠN CỦA BỘ SỐ NÀY

Đọc kỹ trước khi trích dẫn bất kỳ con số nào ở trên.

1. **Chỉ đo phần VẼ 3D.** Phép đo bấm giờ quanh `renderer.render()` + một lần đọc ngược điểm ảnh để
   ép GPU làm xong thật. Nó **chưa gồm** React render, ghép ảnh của trình duyệt (compositing), hay
   chi phí của phần còn lại trong app. Ngân sách 8 ms đã chừa phòng hờ một phần cho việc này, nhưng
   đó là phòng hờ chứ không phải phép đo.
2. **Gắn với cửa sổ 1100 × 700.** Vì 80% chi phí đi theo điểm ảnh, mọi con số ms ở trên **đổi theo
   cỡ cửa sổ**. Màn hình lớn hơn thì dùng mô hình chi phí ở trên để quy đổi, đừng chép thẳng số ms.
3. **Chưa kiểm chạy LÂU.** MacBook Air không có quạt, nên máy nóng dần có thể làm chậm lại
   (thermal throttling). Bộ đo này chạy khoảng 5 phút; chưa ai đo một phiên 25 phút mở tab Thành Phố
   liên tục.

*(Và một điều nữa, quan trọng ngang ba điều trên: **iPhone CHƯA ĐO.** Xem `TECH_DEBT.md` #23 + #26.)*

---

## Sau Phase 10 — tầng trệt, cả hai bước (2026-08-18)

Phase 10 thêm cửa ra vào · bậc thềm · một đặc trưng tầng trệt. **Bước 1** làm 3 kỷ (6 · 9 · 13),
**Bước 2** trải nốt ra 12 kỷ còn lại và xoá `legacy`. Điều kiện nghiệm thu Đàm đặt ra là một
**QUAN HỆ**, không phải một mức tuyệt đối: *P50 mọi cảnh ≤ 8,0 ms ở 1100×700 trên M3* **VÀ**
*số lệnh vẽ không tăng*.

⚠️ **VẾ THỨ HAI TỪNG ĐƯỢC GHI LÀ "không quá 13" — CON SỐ ẤY ĐÃ CHẾT, ĐỪNG TRÍCH LẠI.** Nó đo trên
đúng ba kỷ rồi được viết ra như luật của mười lăm kỷ; đo đủ 15 kỷ thì kỷ 10 ra 14. Cách thay thế
Đàm chốt ngày 2026-08-18 **không phải nâng trần chung lên 14** — vì như thế là tặng cho 14 kỷ còn
lại (đang ở 11–13) hai đến ba lệnh vẽ trống để trôi vào trong im lặng, và cổng sẽ chỉ còn bắt được
kỷ tệ nhất. Thay vào đó: **MỘT BẢNG 15 MỐC RIÊNG**, mỗi mốc là số đo của chính kỷ ấy, khoá bằng
`src/engine/city3d/drawCallBudget.test.js` (chạy trong `npm test`, không cần Chromium). Xem mục
"❗ KỶ 10" bên dưới.

### Vế đã đo xong — số lệnh vẽ và hình học, ĐỦ CẢ 15 KỶ

Lệnh: `node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow`, chạy hai lượt —
một lượt trên `HEAD` (= sau Bước 1) và một lượt trên cây làm việc (= sau Bước 2). Cột "cả cảnh"
gồm cả vòm trời + rặng núi (hằng số **44.126** tam giác ở mọi kỷ — phải trừ ra khi so các kỷ với
nhau, xem bài học vòng 2 ở `CLAUDE.md`).

| Kỷ | Nước | Lệnh vẽ TP T→S | Lệnh vẽ **cả cảnh** T→S | Tam giác TP T→S | Δ |
|---:|---|---:|---:|---:|---:|
| 1 | Thổ Nhĩ Kỳ | 9 → 9 | 11 → 11 | 19.622 → 21.058 | +7,3% |
| 2 | Ai Cập | 11 → 11 | 13 → 13 | 17.690 → 21.522 | +21,7% |
| 3 | Iraq | 11 → 11 | 13 → 13 | 26.894 → 31.686 | +17,8% |
| 4 | Trung Quốc | 11 → 11 | 13 → 13 | 34.682 → 41.482 | +19,6% |
| 5 | Đức | 10 → 10 | 12 → 12 | 27.016 → 32.424 | +20,0% |
| 6 | Việt Nam | 11 → 11 | 13 → 13 | 39.738 → 39.738 | **0,0%** ¹ |
| 7 | Ý | 11 → 11 | 13 → 13 | 34.222 → 41.178 | +20,3% |
| 8 | Bồ Đào Nha | 11 → 11 | 13 → 13 | 31.546 → 39.314 | +24,6% |
| 9 | Pháp | 10 → 10 | 12 → 12 | 41.282 → 41.282 | **0,0%** ¹ |
| 10 | Anh | 12 → 12 | **14 → 14** ² | 34.530 → 39.350 | +14,0% |
| 11 | Mỹ | 10 → 10 | 12 → 12 | 35.594 → 41.702 | +17,2% |
| 12 | Nga | 10 → 10 | 12 → 12 | 28.186 → 32.050 | +13,7% |
| 13 | Nhật Bản | 10 → 10 | 12 → 12 | 42.546 → 42.546 | **0,0%** ¹ |
| 14 | Singapore | 10 → 10 | 12 → 12 | 27.670 → 32.678 | +18,1% |
| 15 | UAE | 10 → 10 | 12 → 12 | 33.706 → 37.350 | +10,8% |
| **Tổng** | | | | **474.924 → 535.360** | **+12,7%** |

¹ **Ba kỷ này KHÔNG đổi một tam giác nào — và đó là phép tự-kiểm của chính bảng số này.** Kỷ 6 · 9 ·
13 đã có tầng trệt từ Bước 1, tức chúng nằm trong cả hai lượt đo ở trạng thái y hệt nhau. Nếu ba
dòng ấy mà lệch dù chỉ một tam giác thì thứ hỏng là **phép đo**, không phải mã. Chúng khớp từng
đơn vị ⇒ 12 con số Δ còn lại đọc được.

² ⚠️ **KỶ 10 CHẠM 14 LỆNH VẼ — VÀ NÓ ĐÃ NHƯ VẬY TỪ TRƯỚC PHASE 10.** Xem mục riêng ngay dưới.

**Bước 2 thêm ĐÚNG 0 lệnh vẽ, ở cả 15 kỷ** (cột "T→S" bằng nhau từng dòng). Lý do nằm ở kiến trúc
chứ không ở may mắn: cả thành phố gộp thành **một bộ lưới cho mỗi HỌ VẬT LIỆU**, nên một lệnh vẽ
chỉ sinh ra khi một họ vật liệu **mới toàn kỷ** xuất hiện — mà tầng trệt cố ý chỉ dùng lại các vai
màu đã có (`wood` · `stone` · `trim` · `dark` · `glass`). Có **bài test khoá** điều này ở
`groundFloor.test.js` (xem mục dưới về việc bài ấy vừa được vá lần thứ hai).

### ❗ KỶ 10 = 14 LỆNH VẼ — và cách chữa là BỎ cái trần chung đi (đã xong, `TECH_DEBT #38` đóng)

Bảng "Sau Phase 10" bản trước ghi trần là **13**. Con số ấy đúng với **ba kỷ đã đo lúc đó** (6 · 9 ·
13 → 13 · 12 · 11) và rồi được viết ra như một luật của cả 15 kỷ. Đo đủ 15 kỷ lần đầu tiên (hôm nay)
cho thấy **kỷ 10 ra 14** — và nó ra 14 **ở CẢ hai lượt đo**, tức khuyết tật này **có trước Phase 10**,
không do tầng trệt gây ra.

- Kỷ 10 (Anh, thời công nghiệp) là kỷ duy nhất dùng **cả `brick` lẫn `slate`** cùng lúc, cộng
  `glass` · `stone` · `wood` ⇒ 5 họ vật liệu cho riêng phần thành phố, nhiều hơn mọi kỷ khác một họ.
- ⇒ **Đây là một CON SỐ NỀN chưa từng được đo, không phải một hồi quy.** Cùng hình dạng với bài học
  "một ngân sách tự tính mà chưa bao giờ được đặt cạnh sự thật thì không phải ngân sách": trần 13
  chưa bao giờ được kiểm với cả 15 kỷ, nó chỉ được kiểm với chính mẫu đã sinh ra nó.
- ⚠️ **KHÔNG gộp `brick` với `slate` để lấy lại con số 13.** Đó là mua một con số đẹp bằng cách nói
  dối vật liệu — đúng kiểu ADR-025 đã cấm với mặt đường. Kỷ 10 dùng hai vật liệu ấy vì nước Anh
  thời công nghiệp dùng hai vật liệu ấy.

⚠️ **Đừng đọc "14 > 13" thành "hiệu năng đã hỏng".** Mô hình chi phí đã đo trên M3 nói **80% chi phí
đi theo ĐIỂM ẢNH**, và một lệnh vẽ thêm trong một cảnh 12–14 lệnh vẽ là nhiễu so với mức đó. Con số
13 là một **hàng rào kỷ luật** ("đừng để số lệnh vẽ trôi lên"), không phải một mức đã đo ra là ngưỡng
đau.

#### Cách chữa đã làm: 15 mốc riêng, không phải một trần chung (Đàm chốt 2026-08-18)

> *"14 kỷ khác đang ở 11–13, nên trần chung 14 cho chúng ba lệnh vẽ trống để trôi vào trong im
> lặng. Cổng chỉ bắt được kỷ tệ nhất."* — và *"cổng KHÔNG mất tác dụng răn đe khi đặt lại cho
> đúng; nó mất tác dụng khi giữ một con số sai rồi ai cũng học cách ngó lơ."*

Đây đúng bẫy Phase 7D: **một con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ.** Lời
hứa thật chưa bao giờ là "≤ 13"; nó là *"kỷ này không được tốn hơn chính nó hôm nay"*.

**Mốc lệnh vẽ THÀNH PHỐ của từng kỷ** (cột "Lệnh vẽ TP" trong bảng trên; cả cảnh = mốc + 2):

| Kỷ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Mốc | 9 | 11 | 11 | 11 | **10** | 11 | 11 | 11 | 10 | **12** | 10 | 10 | 10 | 10 | 10 |

Khoá bằng `src/engine/city3d/drawCallBudget.test.js` — **4 bài, chạy trong `npm test`**:

1. **Mỗi kỷ ≤ mốc của chính kỷ đó** (+ gác chạy-rỗng: mỗi kỷ phải sinh ra > 100 khối thật).
2. **ĐỐI CHỨNG**: kéo thêm một họ vật liệu vào một kỷ thì **đúng kỷ ấy** phải vượt mốc, và vượt
   đúng 1. Hỏi từng kỷ một, không hỏi tổng — hỏi tổng thì một kỷ dư chỗ sẽ bù cho một kỷ vượt,
   tức dựng lại đúng cái phễu mà bảng-15-dòng sinh ra để gỡ.
3. **Bảng phải là 15 mốc riêng, không phải một trần chung đội lốt**: điền cả 15 dòng bằng cùng một
   số là cách rẻ nhất để bài 1 hết đỏ, và bài này chặn đúng chuyện đó.
4. **Quan hệ nền**: `lệnh vẽ thành phố = (số họ vật liệu) + 4`, đúng **15/15 kỷ, không một ngoại
   lệ** — đây là thứ cho phép ba bài trên chạy bằng `node --test` thay vì phải bật Chromium. Nếu
   một phase sau tách thêm một tấm cố định ra khỏi khối gộp thì hằng số 4 đổi, và bài này đỏ
   **đồng loạt cả 15 kỷ** — một hình dạng đỏ rất dễ đọc, khác hẳn "một kỷ đỏ".

⚠️ **Muốn sửa một dòng trong bảng mốc thì phải CHẠY LẠI phép đo và ghi ngày mới**, không phải nới
cho vừa kết quả. Lệnh đo nằm ngay trong chú thích đầu file test.

### Sau Việc 2 (dọn bảng tầng trệt sang file riêng, ADR-029) — ĐO LẠI ĐỦ 15 KỶ: KHÔNG ĐỔI GÌ

Cùng lệnh, cùng ngày: `node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow`.
**Lệnh vẽ khớp 15/15 kỷ, tam giác khớp 15/15 kỷ, TỪNG ĐƠN VỊ** với cột "sau Bước 2" ở bảng trên
(9·11·11·11·10·11·11·11·10·**12**·10·10·10·10·10 lệnh vẽ · tổng 535.360 tam giác). Đây là bằng
chứng rằng việc chuyển bảng ra `groundFloorStyle.js` là dọn nhà thuần tuý.

⚠️ **BÀI HỌC VỀ CHÍNH PHÉP ĐO NÀY — ĐỌC TRƯỚC KHI ĐO KIỂU TƯƠNG TỰ.** Lượt đo mốc nền đầu tiên bị
**hỏng hoàn toàn** vì tôi cho nó chạy nền rồi sửa file ngay trong lúc nó chạy. Mỗi kỷ mất ~15 giây,
nên bảng trả về trộn **ba trạng thái mã**: kỷ 1–4 mã cũ · kỷ 5–9 đúng lúc bảng đã bị cắt mà
`buildingSpec.js` chưa nối lại (**mất trọn tầng trệt**, tụt 6.000–8.000 tam giác mỗi kỷ) · kỷ 10+
mã đã nối xong. Bảng ấy trông hoàn toàn chỉnh tề và không có dấu hiệu nào cho biết nó không mô tả
một phiên bản nào của phần mềm cả. ⇒ **Phép đo và lần sửa mã không được chồng lấn thời gian**; cần
mốc nền trong lúc vẫn làm việc thì dựng `git worktree` rồi đo ở đó. Xem `CLAUDE.md`.

### Vế CHƯA đo — frame time trên M3

⚠️ **Con số ms trong tài liệu này vẫn là bộ số ngày 2026-08-17, đo TRƯỚC Phase 10.** Hộp cát AI
chạy SwiftShader (rasteriser CPU) nên **không suy ra được** cho GPU thật, kể cả dưới dạng phần trăm
— đúng luật đã ghi ở mục "BA GIỚI HẠN". Muốn đóng vế này thì Đàm chạy `bash scripts/bench-macbook.sh`
trên MacBook.

**Dự đoán (chưa phải phép đo):** không đổi đáng kể. Mô hình chi phí đã đo nói **80% chi phí theo
ĐIỂM ẢNH**, mà Phase 10 không đổi cỡ khung, không đổi DPR, không thêm nguồn sáng, không thêm shader,
không thêm vật liệu. Bằng chứng thứ nhất trong mục "Ba bằng chứng" còn mạnh hơn thế: **43% chênh
lệch hình học chỉ đổi 2,4% thời gian** — mà cả hai bước của Phase 10 cộng lại chỉ thêm **12,7%** trên
tổng 15 kỷ (kỷ nặng nhất +24,6%). Nếu Đàm chạy ra một con số lệch hẳn dự đoán này thì **chính dự đoán
sai**, không phải máy hỏng, và phải quay lại đọc lý do.

---

## Sau Phase 11 — chi tiết trên mái (2026-08-18)

Phase 11 thêm hai trục lên mái: **đường nét** (`crown` — sống mái nổi · ngói bò · đầu đao · lan can)
và **vật đứng trên mái** (`stack` — ống khói · bể nước · cục nóng · lồng thang máy · cột ăng-ten ·
giàn phơi · chậu cây · cửa sổ mái). Cùng điều kiện nghiệm thu của Phase 10, và cùng một lệnh đo:
`node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow`, chạy hai lượt (một trên
`e089c00` = sau Việc 2, một trên cây làm việc).

### Vế đã đo xong — lệnh vẽ và hình học, ĐỦ CẢ 15 KỶ

| Kỷ | Nước | Lệnh vẽ TP T→S | Lệnh vẽ **cả cảnh** T→S | Tam giác TP T→S | Δ |
|---:|---|---:|---:|---:|---:|
| 1 | Thổ Nhĩ Kỳ | 9 → 9 | 11 → 11 | 21.058 → 22.966 | +9,1% |
| 2 | Ai Cập | 11 → 11 | 13 → 13 | 21.522 → 28.674 | +33,2% |
| 3 | Iraq | 11 → 11 | 13 → 13 | 31.686 → 40.594 | +28,1% |
| 4 | Trung Quốc | 11 → 11 | 13 → 13 | 41.482 → 49.274 | +18,8% |
| 5 | Đức | 10 → 10 | 12 → 12 | 32.424 → 35.184 | +8,5% |
| 6 | Việt Nam | 11 → 11 | 13 → 13 | 39.738 → 49.658 | +25,0% |
| 7 | Ý | 11 → 11 | 13 → 13 | 41.178 → 56.170 | +36,4% |
| 8 | Bồ Đào Nha | 11 → 11 | 13 → 13 | 39.314 → 58.370 | +48,5% |
| 9 | Pháp | 10 → 10 | 12 → 12 | 41.282 → 49.506 | +19,9% |
| 10 | Anh | 12 → 12 | 14 → 14 | 39.350 → 43.298 | +10,0% |
| 11 | Mỹ | 10 → 10 | 12 → 12 | 41.702 → 50.114 | +20,2% |
| 12 | Nga | 10 → 10 | 12 → 12 | 32.050 → 34.346 | +7,2% |
| 13 | Nhật Bản | 10 → 10 | 12 → 12 | 42.546 → 46.366 | +9,0% |
| 14 | Singapore | 10 → 10 | 12 → 12 | 32.678 → 39.094 | +19,6% |
| 15 | UAE | 10 → 10 | 12 → 12 | 37.350 → 41.822 | +12,0% |
| **Tổng** | | | | **535.360 → 645.436** | **+20,6%** |

⚠️ Cột "cả cảnh" gồm cả vòm trời + rặng núi (hằng số **44.126** tam giác ở mọi kỷ) — phải trừ ra khi
so các kỷ với nhau.

**Phase 11 thêm ĐÚNG 0 lệnh vẽ, ở cả 15 kỷ** — và đây không phải may mắn mà là một ràng buộc được
khoá bằng test. `rooftop.test.js` bài 12 khoá rằng cả tầng mái chỉ được dùng lại **đúng 7 vai màu đã
có** (`dark` · `glass` · `leaf` · `roof` · `stone` · `trim` · `wood`), cộng một gác riêng: kỷ nào khai
`dormer` (cửa sổ mái, cần kính) thì kỷ ấy **phải đã dùng `glass` ở chỗ khác rồi**. Không có gác thứ
hai đó thì một dòng bảng vô hại sẽ lặng lẽ kéo thêm một họ vật liệu vào một kỷ chưa có kính.

⚠️ **Bảng 15 mốc lệnh vẽ ở mục Phase 10 KHÔNG đổi một dòng nào** — cả 15 kỷ vẫn đúng mốc cũ, đo lại
bằng chính lệnh trên. Đây cũng là **phép tự-kiểm của bảng số này**: nếu một dòng mốc lệch thì thứ
hỏng là phép đo, vì Phase 11 về mặt kiến trúc không thể sinh lệnh vẽ mới.

### ❗ MỘT CON SỐ SAI TRONG CHÍNH TÀI LIỆU NÀY, ĐÃ SỬA: KỶ 5

Hàng "Mốc" tóm tắt ở mục Phase 10 ghi **kỷ 5 = 11**, trong khi bảng số liệu nằm ngay phía trên nó
(cột "Lệnh vẽ TP") ghi **10 → 10**, và `MOC_LENH_VE` trong `drawCallBudget.test.js` cũng ghi **10**.
Lượt đo Phase 11 xác nhận con số thật là **10**. Tức hàng tóm tắt ấy nới cổng của kỷ 5 thêm một lệnh
vẽ, âm thầm, ngay trong tài liệu vừa được viết ra để chống đúng chuyện đó. Đã sửa về **10**.

⇒ **Bài học, cùng họ với "một luật một công thức":** một bảng số và một hàng TÓM TẮT của chính bảng
ấy là **hai bản chép**, nên chúng trôi khỏi nhau được. Ở đây cái cứu là bản chép thứ ba — bài test —
vì nó là bản duy nhất máy đọc. Hàng tóm tắt chỉ nên tồn tại khi có ai đó đối chiếu nó; không thì
tốt hơn hết là trỏ thẳng sang bảng gốc.

### Hình học vẫn nằm sâu trong vùng rẻ

Tổng 15 kỷ **535.360 → 645.436 tam giác (+20,6%)**; phần mái chiếm **110.076 tam giác = 17,1%** hình
học thành phố sau phase. Kỷ nặng nhất là **kỷ 8 (+48,5%)** — Bồ Đào Nha khai `barrel` (ngói bò) cho
cả kỳ quan lẫn nhà dân, mà ngói bò là kiểu tốn khối nhất trong bảng.

⚠️ **Đừng đọc "+20,6%" thành "đắt lên 20,6%".** Mô hình chi phí đã đo trên M3 nói **80% chi phí đi
theo ĐIỂM ẢNH**, và bằng chứng số 1 ở mục "Ba bằng chứng" nói **43% chênh lệch hình học chỉ đổi 2,4%
thời gian**. Phase 11 không đổi cỡ khung, không đổi DPR, không thêm nguồn sáng, không thêm shader,
không thêm vật liệu, không thêm lệnh vẽ. **Dự đoán (chưa phải phép đo): không đổi đáng kể.**

### ❗ BẢNG NÀY MÔ TẢ `d888fae`, KHÔNG MÔ TẢ HEAD — PHASE 11-B ĐỔI 6/15 KỶ MÀ KHÔNG SỬA TÀI LIỆU

Phát hiện ngày 2026-08-18, lúc đi lấy mốc nền cho Phase 12. Cột "S" của bảng trên đo trên `d888fae`
(Phase 11). Ngay sau đó `e95cdf1` (**Phase 11-B — ưu tiên đường viền**) sửa `src/engine/city3d/roofStyle.js`,
tức sửa hình học thật, và **không đụng một dòng nào của file này**. Đo lại đủ 15 kỷ trên `e95cdf1`:

| Kỷ | bảng trên ghi | thật ở `e95cdf1` | lệch |
|---:|---:|---:|---:|
| 8 (Bồ Đào Nha) | 58.370 | **54.810** | −3.560 |
| 11 (Mỹ) | 50.114 | **53.890** | +3.776 |
| 12 (Nga) | 34.346 | **38.506** | +4.160 |
| 13 (Nhật Bản) | 46.366 | **50.142** | +3.776 |
| 14 (Singapore) | 39.094 | **41.718** | +2.624 |
| 15 (UAE) | 41.822 | **45.406** | +3.584 |
| **Tổng** | 645.436 | **659.796** | +14.360 |

Chín kỷ còn lại khớp từng đơn vị, và **lệnh vẽ không đổi ở kỷ nào** — Phase 11-B chỉ đổi kích cỡ
đường nét mái, không kéo thêm vai màu nào.

⚠️ **Bảng gốc GIỮ NGUYÊN, không sửa đè.** Nó mô tả đúng cái nó nói là mô tả: `e089c00` → `d888fae`.
Sửa cột "S" thành số của `e95cdf1` sẽ làm mọi cột Δ% trong bảng hoá sai, và xoá luôn bằng chứng về
việc trôi. Cái phải sửa là **cách đọc**: cột "S" của một bảng phase là *"sau phase ấy"*, **không**
phải *"hiện nay"*.

⇒ **Bài học, cùng họ với "một luật một công thức" và với lỗi kỷ 5 ở ngay trên**: một bảng số ghi
"trước → sau" chỉ đúng cho **hai commit** đã sinh ra nó. Mọi phase sau đó phải **tự đo lại mốc nền
của mình**, không được chép cột "sau" của phase trước làm cột "trước" của mình — dù hai phase liền
kề nhau và dù trông chẳng có gì liên quan (Phase 11-B đụng mái, Phase 12 đụng đường; không ai nghĩ
chúng dính nhau, và đúng là chúng không dính — cái dính là **cột số**). Ở đây suýt nữa cả bảng
Phase 12 ra sai: kỷ 8 sẽ được báo là −5.558 thay vì −1.998, và kỷ 11 là +3.902 thay vì +126. Thứ
lộ ra chuyện này là một phép **đối chiếu chéo** — đếm riêng tam giác của mặt đường rồi so với chênh
lệch tổng; 7 kỷ đầu khớp từng đơn vị còn kỷ 8 lệch đúng 3.560, và chỗ lệch ấy là chỗ hỏng.

⚠️ Và Phase 11-B đã vi phạm Definition of Done (`CLAUDE.md`): đổi hình học ⇒ `PERFORMANCE.md` là
tài liệu **phải** đồng bộ. Không có gì đỏ lên, vì không có gì máy đọc được canh chỗ này.

### Vế CHƯA đo — frame time trên M3

Vẫn nợ, y như sau Phase 10: bộ số ms trong tài liệu này là của ngày 2026-08-17. Hộp cát AI chạy
SwiftShader nên **không suy ra được** cho GPU thật. Muốn đóng thì Đàm chạy `bash scripts/bench-macbook.sh`.

---

## Sau Phase 12 — mép đường thôi lởm chởm (2026-08-18)

Phase 12 đổi **HÌNH** của lòng đường trong một ô: từ MỘT hình chữ nhật (buộc phải phình trọn ô ở
mọi chỗ có nhánh) sang **MỘT LÕI + TỐI ĐA BỐN CÁNH TAY** (ADR-031). Cùng lệnh đo của Phase 10/11:
`node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow`.

⚠️ **Cột T đo LẠI trên `e95cdf1`, KHÔNG chép từ bảng Phase 11** — xem mục ❗ ngay trên. Chép sang
thì kỷ 8 sẽ ra −5.558 và kỷ 11 ra +3.902, cả hai đều bịa.

### Vế đã đo xong — lệnh vẽ và hình học, ĐỦ CẢ 15 KỶ

| Kỷ | Nước | Lệnh vẽ TP T→S | Lệnh vẽ **cả cảnh** T→S | Tam giác TP T→S | Δ |
|---:|---|---:|---:|---:|---:|
| 1 | Thổ Nhĩ Kỳ | 9 → 9 | 11 → 11 | 22.966 → 22.882 | −84 |
| 2 | Ai Cập | 11 → 11 | 13 → 13 | 28.674 → 28.594 | −80 |
| 3 | Iraq | 11 → 11 | 13 → 13 | 40.594 → 40.316 | −278 |
| 4 | Trung Quốc | 11 → 11 | 13 → 13 | 49.274 → 48.578 | −696 |
| 5 | Đức | 10 → 10 | 12 → 12 | 35.184 → 33.752 | −1.432 |
| 6 | Việt Nam | 11 → 11 | 13 → 13 | 49.658 → 47.952 | −1.706 |
| 7 | Ý | 11 → 11 | 13 → 13 | 56.170 → 55.896 | −274 |
| 8 | Bồ Đào Nha | 11 → 11 | 13 → 13 | 54.810 → 52.812 | −1.998 |
| 9 | Pháp | 10 → 10 | 12 → 12 | 49.506 → 49.090 | −416 |
| 10 | Anh | 12 → 12 | 14 → 14 | 43.298 → 42.666 | −632 |
| 11 | Mỹ | 10 → 10 | 12 → 12 | 53.890 → 54.016 | **+126** |
| 12 | Nga | 10 → 10 | 12 → 12 | 38.506 → 38.808 | **+302** |
| 13 | Nhật Bản | 10 → 10 | 12 → 12 | 50.142 → 50.054 | −88 |
| 14 | Singapore | 10 → 10 | 12 → 12 | 41.718 → 41.840 | **+122** |
| 15 | UAE | 10 → 10 | 12 → 12 | 45.406 → 45.788 | **+382** |
| **Tổng** | | | | **659.796 → 653.044** | **−6.752 (−1,0%)** |

⚠️ Cột "cả cảnh" gồm cả vòm trời + rặng núi (hằng số **44.126** tam giác ở mọi kỷ) — phải trừ ra khi
so các kỷ với nhau.

**Lệnh vẽ: KHÔNG ĐỔI MỘT ĐƠN VỊ NÀO ở cả 15 kỷ**, khớp đúng bảng 15 mốc `MOC_LENH_VE` trong
`drawCallBudget.test.js`. Điều này đúng theo cấu trúc chứ không do may: Phase 12 không thêm vai màu
nào, không thêm vật liệu nào — nó chỉ đổi cách chia nhỏ **một tấm lưới đã có sẵn**.

### Toàn bộ 6.752 tam giác chênh lệch nằm ở MẶT ĐƯỜNG — đối chiếu chéo, 15/15 kỷ khớp từng đơn vị

Đây là phép kiểm quan trọng nhất của bảng trên, và cũng là thứ đã bắt được cái mốc nền hỏng. Đếm
riêng tam giác mặt đường theo **từng phần** (`ROAD_PART`) bằng cách gọi thẳng `buildRoadSurface` —
thuần, không cần Chromium — rồi so Δ ấy với Δ tổng của cả thành phố:

| Kỷ | lòng đường T→S | vỉa hè T→S | bó vỉa T→S | vạch kẻ | Δ đường | Δ tổng (đo bằng Chromium) |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 320 → 236 | 0 → 0 | 0 → 0 | 0 | −84 | −84 |
| 2 | 320 → 240 | 0 → 0 | 0 → 0 | 0 | −80 | −80 |
| 3 | 720 → 442 | 0 → 0 | 0 → 0 | 0 | −278 | −278 |
| 4 | 2.000 → 1.304 | 160 | 0 | 0 | −696 | −696 |
| 5 | 2.880 → 1.448 | 0 | 0 | 0 | −1.432 | −1.432 |
| 6 | 2.880 → 1.174 | 0 | 0 | 0 | −1.706 | −1.706 |
| 7 | 720 → 446 | 160 | 160 | 0 | −274 | −274 |
| 8 | 3.920 → 1.922 | 160 | 160 | 0 | −1.998 | −1.998 |
| 9 | 2.880 → 2.464 | 160 | 160 | 0 | −416 | −416 |
| 10 | 2.880 → 2.248 | 164 | 164 | 0 | −632 | −632 |
| 11 | 320 → 446 | 160 | 160 | 44 | +126 | +126 |
| 12 | 320 → 446 | **72 → 160** | **72 → 160** | 0 | +302 | +302 |
| 13 | 320 → 232 | 168 | 168 | 220 | −88 | −88 |
| 14 | 320 → 442 | 164 | 164 | 132 | +122 | +122 |
| 15 | 720 → 922 | **74 → 164** | **74 → 164** | 132 | +382 | +382 |

**15/15 kỷ khớp CHÍNH XÁC.** Không một tam giác nào của chênh lệch đến từ nhà, cây, mặt đất hay
chân trời — đúng như phạm vi của phase.

### Vì sao 10 kỷ GIẢM mà 5 kỷ TĂNG — và đây không phải nhiễu

Luật CŨ chia lòng đường thành đúng `sub × sub` ô con **bất kể ô ấy rộng bao nhiêu**. Kiểm được:
tam giác lòng đường cũ **= 2 × (số ô đường) × sub²**, đúng **15/15 kỷ, không một ngoại lệ** (mọi kỷ
đều có đúng **40 ô đường** ở mốc 40 phiên):

| sub | kỷ | 2 × 40 × sub² | đo được |
|---:|---|---:|---:|
| 2 | 1 · 2 · 11 · 12 · 13 · 14 | 320 | 320 |
| 3 | 3 · 7 · 15 | 720 | 720 |
| 5 | 4 | 2.000 | 2.000 |
| 6 | 5 · 6 · 9 · 10 | 2.880 | 2.880 |
| 7 | 8 | 3.920 | 3.920 |

Tức `sub` xưa nay là **số lát cắt của MỘT MẢNH**, không phải **cỡ một viên lát**. Hệ quả: cùng một
kỷ, cùng một vật liệu, viên lát trên ngõ nhỏ hơn viên trên đại lộ đúng bằng tỉ lệ hai bề rộng — một
điều không ai muốn và không ai từng khai. Luật MỚI suy số ô con từ **chiều dài thật** (`oCon`), nên
cỡ viên là một đại lượng của THẾ GIỚI (`1/sub` ô).

⇒ Dấu của Δ do hai lực ngược chiều quyết định:
- **Kỷ lát mịn (`sub` lớn)**: bỏ được lưới `sub × sub` dày đặc trên những mảnh nhỏ ⇒ **giảm mạnh**
  (kỷ 8, `sub = 7`: lòng đường 3.920 → 1.922, còn **49%**).
- **Kỷ lát thô (`sub = 2`) + đại lộ RỘNG**: lõi vẫn tròn về 2×2 như cũ, nhưng nay có thêm bốn cánh
  tay ngắn, mà một cánh tay dài 0,02 ô vẫn phải có tối thiểu một hàng ô con ⇒ **tăng nhẹ** (kỷ 11 ·
  12 · 14, đại lộ 0,90–0,96). Kỷ 13 cũng `sub = 2` nhưng đại lộ chỉ 0,72 nên vẫn **giảm** — đúng
  chiều mà lời giải thích này dự đoán.
- **Kỷ 12 và 15 có thêm một khoản riêng**: `MAX_AVENUE = 0,96` kéo `avenue` xuống khỏi 1,00, nên
  `room = 0,5 − half` thôi bằng 0 và **vỉa hè trên đại lộ lần đầu tiên được dựng ra** (72 → 160 và
  74 → 164 tam giác). Đó là +176 và +180 trong tổng +302 / +382 của hai kỷ ấy. Bề rộng vỉa hè vẫn
  chỉ còn 11% con số đã khai — xem `TECH_DEBT #42`.

### Hình học vẫn nằm sâu trong vùng rẻ

−1,0% tổng, và biên độ lớn nhất một kỷ là −4,6% (kỷ 6). Mô hình chi phí trên M3 nói **80% chi phí đi
theo ĐIỂM ẢNH**, còn 43% chênh lệch hình học chỉ đổi 2,4% thời gian ⇒ **dự đoán (chưa phải phép đo):
không đổi đáng kể**. Phase 12 không đổi cỡ khung, không đổi DPR, không thêm nguồn sáng, không thêm
shader, không thêm vật liệu, không thêm lệnh vẽ.

### Vế CHƯA đo — frame time trên M3

Vẫn nợ, y như sau Phase 10 và 11. Muốn đóng thì Đàm chạy `bash scripts/bench-macbook.sh`.

---

## Sau vỉa hè (ADR-033) — 4 kỷ NHẸ ĐI, 11 kỷ không đổi, 0 kỷ nặng thêm (2026-08-18)

Đóng `TECH_DEBT #42`: `avenue` được sửa lại cho đúng nghĩa "phần mặt cắt dành cho XE", nên lòng
đường ở 5 kỷ hẹp lại và vỉa hè rộng ra. Lòng đường hẹp hơn ⇒ lưới lát ít viên hơn ⇒ **ít tam giác
hơn**. Cùng lệnh đo của Phase 10/11/12: `node scripts/city-preview.mjs --era N --hour 12 --bench 1
--no-shadow`.

⚠️ **Cột T đo LẠI trên `e295f79`** trong một `git worktree` riêng, KHÔNG chép từ bảng Phase 12-B —
dù ở đây hai bộ số trùng nhau ở cả 5 kỷ được kiểm chéo, vì `e295f79` ĐÚNG là commit sinh ra cột "S"
của bảng ấy. Kiểm chứ không tin (bài học Phase 11-B).

| Kỷ | Nước | Lệnh vẽ TP T→S | Tam giác TP T→S | Δ |
|---:|---|---:|---:|---:|
| 1 | Thổ Nhĩ Kỳ | 9 → 9 | 22.882 → 22.882 | 0 |
| 2 | Ai Cập | 11 → 11 | 28.594 → 28.594 | 0 |
| 3 | Iraq | 11 → 11 | 40.316 → 40.316 | 0 |
| 4 | Trung Quốc | 11 → 11 | 48.578 → 48.578 | 0 |
| 5 | Đức | 10 → 10 | 33.752 → 33.752 | 0 |
| 6 | Việt Nam | 11 → 11 | 47.964 → 47.964 | 0 |
| 7 | Ý | 11 → 11 | 55.896 → 55.896 | 0 |
| 8 | Bồ Đào Nha | 11 → 11 | 52.840 → 52.840 | 0 |
| 9 | Pháp | 10 → 10 | 49.102 → 47.454 | **−1.648** |
| 10 | Anh | 12 → 12 | 42.666 → 42.666 | 0 |
| 11 | Mỹ | 10 → 10 | 54.016 → 53.810 | **−206** |
| 12 | Nga | 10 → 10 | 38.808 → 38.602 | **−206** |
| 13 | Nhật Bản | 10 → 10 | 50.054 → 50.054 | 0 |
| 14 | Singapore | 10 → 10 | 41.840 → 41.634 | **−206** |
| 15 | UAE | 10 → 10 | 45.800 → 45.800 | 0 |
| **Tổng** | | | **653.108 → 650.842** | **−2.266 (−0,35%)** |

**Lệnh vẽ: KHÔNG ĐỔI MỘT ĐƠN VỊ NÀO ở cả 15 kỷ**, khớp bảng 15 mốc `MOC_LENH_VE`
(`drawCallBudget.test.js`). Đúng theo cấu trúc: không thêm vai màu, không thêm vật liệu — vỉa hè và
bó vỉa đã dùng chung họ vật liệu với lòng đường từ Phase 9D.

### Đối chiếu chéo: hai phép đo độc lập, khớp TỪNG ĐƠN VỊ

Con số trên đo bằng Chromium (`renderer.info`). Đo lại bằng một đường **hoàn toàn khác** — gọi thẳng
`buildRoadSurface` trong Node, không Chromium, chỉ đếm tam giác MẶT ĐƯỜNG:

| Kỷ | Δ tam giác cả cảnh (Chromium) | Δ tam giác mặt đường (đếm thuần) |
|---:|---:|---:|
| 9 | −1.648 | −1.648 ✓ |
| 11 | −206 | −206 ✓ |
| 12 | −206 | −206 ✓ |
| 14 | −206 | −206 ✓ |
| 8 (đối chứng, không sửa) | 0 | 0 ✓ |

Khớp tuyệt đối ⇒ **toàn bộ chênh lệch nằm ở mặt đường**, không có gì khác trong cảnh bị đụng tới.

⚠️ **VÀ HAI PHÉP ĐO ẤY LÚC ĐẦU CÃI NHAU — vì ĐẦU VÀO lệch, không vì phép đo sai.** Vòng một ra
Chromium `−1.648` còn đếm thuần `−2.136` ở kỷ 9. Nguyên nhân: phép đếm thuần dựng thành phố ở
`sessionCount: 400` (chép từ fixture của `terrainMesh.test.js`) trong khi `city-preview.mjs` dùng
mặc định **40**, mà mạng đường thì MỞ DẦN theo số phiên ⇒ hai bên đang đếm hai thành phố khác nhau.
Cho bằng đầu vào thì khớp từng đơn vị. Đây đúng là bài học *"một công cụ đúng chạy trên đầu vào sai
vẫn ra số sai mà không kêu"* (Phase 11) — và nó lặp lại chỉ vài ngày sau khi được ghi ra.

### Bản quét 15 kỷ — không trôi

`sweep-score.mjs` trên bản quét mới (md5 `34f0fcfd`): **15/15 cặp chặng** và **105/105 cặp kỷ** trên
ngưỡng mắt. Cặp kỷ gần nhất 21,3 (trước 21,4) · trung vị 37,6 (trước 37,5) — đứng yên trong sai số.
Nới vỉa hè làm mỗi ô đường sáng lên một chút nhưng KHÔNG kéo hai kỷ nào lại gần nhau.

---

## Sau Phase 12-B — đường leo dốc thôi nhảy bậc (2026-08-18)

Phase 12-B (VIỆC 1, nguyên nhân 2) **san cao độ 80 ô đường** thành dốc thoải có trần lấy từ ngoài
đời, giữ nguyên bậc thềm của 64 ô đất (ADR-032). Cùng lệnh đo của Phase 10/11/12:
`node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow`.

⚠️ **Cột T đo LẠI trên `be261ef`** (một `git worktree` riêng), KHÔNG chép từ bảng Phase 12 — dù ở
đây hai bộ số trùng nhau, vì `be261ef` ĐÚNG là commit sinh ra cột "S" của bảng ấy. Kiểm chứ không
tin: xem mục ❗ cuối phần Phase 11 để biết cái giá của việc chép.

### Vế đã đo xong — lệnh vẽ và hình học, ĐỦ CẢ 15 KỶ

| Kỷ | Nước | Lệnh vẽ TP T→S | Lệnh vẽ **cả cảnh** T→S | Tam giác TP T→S | Δ |
|---:|---|---:|---:|---:|---:|
| 1 | Thổ Nhĩ Kỳ | 9 → 9 | 11 → 11 | 22.882 → 22.882 | 0 |
| 2 | Ai Cập | 11 → 11 | 13 → 13 | 28.594 → 28.594 | 0 |
| 3 | Iraq | 11 → 11 | 13 → 13 | 40.316 → 40.316 | 0 |
| 4 | Trung Quốc | 11 → 11 | 13 → 13 | 48.578 → 48.578 | 0 |
| 5 | Đức | 10 → 10 | 12 → 12 | 33.752 → 33.752 | 0 |
| 6 | Việt Nam | 11 → 11 | 13 → 13 | 47.952 → 47.964 | **+12** |
| 7 | Ý | 11 → 11 | 13 → 13 | 55.896 → 55.896 | 0 |
| 8 | Bồ Đào Nha | 11 → 11 | 13 → 13 | 52.812 → 52.840 | **+28** |
| 9 | Pháp | 10 → 10 | 12 → 12 | 49.090 → 49.102 | **+12** |
| 10 | Anh | 12 → 12 | 14 → 14 | 42.666 → 42.666 | 0 |
| 11 | Mỹ | 10 → 10 | 12 → 12 | 54.016 → 54.016 | 0 |
| 12 | Nga | 10 → 10 | 12 → 12 | 38.808 → 38.808 | 0 |
| 13 | Nhật Bản | 10 → 10 | 12 → 12 | 50.054 → 50.054 | 0 |
| 14 | Singapore | 10 → 10 | 12 → 12 | 41.840 → 41.840 | 0 |
| 15 | UAE | 10 → 10 | 12 → 12 | 45.788 → 45.800 | **+12** |
| **Tổng** | | | | **653.044 → 653.108** | **+64 (+0,010%)** |

**Lệnh vẽ: KHÔNG ĐỔI MỘT ĐƠN VỊ NÀO ở cả 15 kỷ**, khớp bảng 15 mốc `MOC_LENH_VE`
(`drawCallBudget.test.js`). Đúng theo cấu trúc: Phase 12-B không thêm vai màu, không thêm vật liệu.

### 64 tam giác ấy đến từ đâu — và vì sao nó KHÔNG phải mặt đường

Câu trả lời trực giác ("đường đổi cao độ ⇒ lưới đường đổi") **SAI**, và đã kiểm bằng phép đếm thuần
(gọi thẳng `buildRoadSurface`, không cần Chromium): **tam giác mặt đất + mặt đường giống hệt tới
từng đơn vị ở cả 15 kỷ.** Hợp lý — hai tấm lưới ấy có số đỉnh cố định theo cỡ lưới, đổi CAO ĐỘ của
một đỉnh không đổi số đỉnh.

Toàn bộ +64 nằm ở **BỆ KÈ** (`groundPlacement`, `sceneGraph.js`): khi cao độ dưới bóng một công
trình đổi, `footprint().drop` có thể vượt 0 ở chỗ trước đó bằng 0 ⇒ mọc thêm một khối đá kè.

**Đối chiếu chéo** — đếm bệ kè bằng một đường HOÀN TOÀN ĐỘC LẬP (JS thuần: `computeCityLayout` +
`collectCitySpecs` + `terrain.footprint` + `countTriangles`, chép đúng công thức của
`groundPlacement`, không mở Chromium) rồi so với Δ tổng đo bằng Chromium:

| Kỷ | Bệ kè T→S | Tam giác bệ kè T→S | Δ |
|---:|---:|---:|---:|
| 3 | 2 → 2 | 56 → 56 | 0 |
| 4 | 4 → 4 | 112 → 112 | 0 |
| **6** | **4 → 5** | **112 → 124** | **+12** |
| 7 | 5 → 5 | 140 → 140 | 0 |
| **8** | **2 → 3** | **56 → 84** | **+28** |
| **9** | **4 → 5** | **112 → 124** | **+12** |
| 10 | 3 → 3 | 84 → 84 | 0 |
| 13 | 1 → 1 | 28 → 28 | 0 |
| **15** | **0 → 1** | **0 → 12** | **+12** |
| **Tổng** | **+4 bệ kè** | | **+64** |

(Kỷ 1, 2, 5, 11, 12, 14 không có bệ kè nào, trước lẫn sau.) **+64 khớp ĐÚNG TỪNG ĐƠN VỊ với Δ tổng
đo bằng Chromium** — hai phép đo độc lập, cùng một con số, nên câu "toàn bộ chênh lệch nằm ở bệ kè"
là một phép đo chứ không phải một lời giải thích nghe hợp lý.

⚠️ Kỷ 8 mọc **đúng một** bệ kè như ba kỷ kia nhưng tốn **28** thay vì 12: số tam giác của bệ kè
**co giãn theo kích thước** từ Phase 8B, nên "thêm một bệ" KHÔNG phải một con số cố định. Đừng suy
"+12 mỗi bệ" thành một hằng số cho phase sau.

⇒ Đây là hành vi ĐÚNG, không phải hồi quy: bệ kè sinh ra chính để che phần hụt dưới một công trình
vắt qua mép thềm. Đường thoải hơn ⇒ vài công trình cạnh đường nay có mép hụt thật ⇒ chúng được kè.

### Vế CHƯA đo — frame time trên M3

Vẫn nợ, y như sau Phase 10, 11 và 12. +0,010% hình học nằm **xa dưới** mọi ngưỡng nhiễu của phép đo
ms, và Phase 12-B không đổi cỡ khung / DPR / nguồn sáng / shader / vật liệu / lệnh vẽ ⇒ **dự đoán
(chưa phải phép đo): không đổi đo được**. Muốn đóng thì Đàm chạy `bash scripts/bench-macbook.sh`.

---

## Sau VIỆC 2 — chế độ cận cảnh (2026-08-18, ADR-034)

**Không đo lại, và đây là một trong số ít trường hợp câu ấy có căn cứ CẤU TRÚC chứ không phải phỏng
đoán.** Chế độ cận cảnh chỉ đổi **chỗ đứng của camera**. Nó không thêm khối, không thêm vật liệu,
không thêm nguồn sáng, không đổi shader, không đổi cỡ khung, không đổi DPR — tức nó không chạm vào
BẤT KỲ trục nào của mô hình chi phí đã đo trên M3 (*≈ 0,87 ms cố định + 1,14 ms mỗi triệu điểm ảnh
thật*). Số điểm ảnh phải tô là **y hệt** vì khung hình và DPR không đổi.

Ba con số kiểm chứng, đo trong hộp cát (kỷ 9, 12 giờ, `--bench 12`, cùng một dòng lệnh chỉ khác cờ
`--focus 1`). Chúng là số ĐẾM (lệnh vẽ · tam giác · điểm ảnh) nên mang ra ngoài hộp cát được — khác
với số ms của SwiftShader, thứ chỉ dùng để so trong hộp cát với nhau:

| | toàn cảnh | cận cảnh |
|---|---|---|
| lệnh vẽ (thành phố / nền / tổng / đã vẽ) | 10 / 2 / 12 / 12 | **10 / 2 / 12 / 12** |
| tam giác (thành phố / nền / tổng) | 47.454 / 44.126 / 91.580 | **47.454 / 44.126 / 91.580** |
| điểm ảnh | 1134×780 | **1134×780** |

Không một đơn vị nào lệch — kể cả cột “đã vẽ (sau khi cắt)”, đúng như chú thích ở `city-preview.mjs`
đã đo và giải thích: cả cảnh chỉ có 7 khối và không khối nào rơi ra ngoài hộp bao dù camera lại gần.

⚠️ **Một chỗ CÓ THỂ đắt hơn mà bộ số hiện tại không nói được**: lúc camera đang BAY (700 ms), vòng
lặp chuyển sang chế độ `sustained` nên nó vẽ liên tục thay vì đứng yên — giống hệt lúc Đàm kéo xoay
camera bằng tay, thứ đã nằm trong bảng đo. Cái chưa nằm trong bảng là **lượt dựng lại bản đồ bóng**
có nổ trong lúc bay hay không; hôm nay nó KHÔNG nổ (thành phố không đổi trong lúc bay, và
`sun.shadow.autoUpdate = false`), nhưng nếu sau này có ai gọi `invalidateShadows()` mỗi khung của
chuyến bay thì chi phí ấy mới xuất hiện — và Phase 9C đã đo rằng nó thêm 7 lệnh vẽ + 25.436 tam
giác vào đúng khung hình đó.

---

## ⚠️ MỌI CON SỐ ĐO TRÊN ẢNH TRƯỚC 2026-08-19 ĐO TRÊN MỘT KHUNG HÌNH BỊ XÉN — KHÔNG SO TRỰC TIẾP ĐƯỢC

Đọc mục này TRƯỚC khi đem bất kỳ con số điểm-ảnh nào trong tài liệu này (hoặc trong `CLAUDE.md`,
`TECH_DEBT.md`, `BAN_GIAO.md`) đặt cạnh một con số đo sau ngày 2026-08-19.

**Chuyện gì đã xảy ra.** `city-preview.mjs` mở cửa sổ bằng `--window-size=(width + 34),(height + 80)`
— hai con số ƯỚC LƯỢNG cho phần khung cửa sổ. Trong hộp cát này khung nhìn thật ra **1134×693**,
trong khi canvas 1100×700 đặt ở `y = 16` cần tới 716 dòng. Kết quả: **23 dòng cuối của khung hình
chưa bao giờ được vẽ ra**, và ảnh PNG vẫn cao 780 vì Chromium phủ nốt phần thiếu bằng nền trang.

Nói cho đủ: mọi ảnh đơn từ trước tới nay là

| | khai | thật |
|---|---|---|
| cỡ khung hình | 1100×700 | **1100×677** |
| tỉ lệ khung | 1,5714 | **1,625** |
| tỉ lệ camera dựng theo | 1,5714 | 1,5714 |
| phần ảnh KHÔNG phải khung hình | 0% | **12,9%** (đệm + dòng số liệu + dải nền trang) |

Hai hệ quả, và cái thứ hai mới là cái nguy hiểm:
1. Ảnh bị **kéo dãn dọc nhẹ** ở mọi kỷ, mọi chặng (camera dựng 1,571 rồi hiển thị ở 1,625).
2. Mọi TỈ LỆ chia cho số điểm ảnh của tấm ảnh đều lấy một mẫu số lẫn 12,9% thứ không thuộc câu hỏi
   — đúng hình dạng `TECH_DEBT #44`.

**Bản vá (2026-08-19).** Bỏ hẳn ba cờ ĐOÁN (`--window-size`, `--screenshot`,
`--virtual-time-budget`). Nay chụp qua CDP `Page.captureScreenshot` với `clip` lấy thẳng từ
`getBoundingClientRect()` của canvas, cộng một cổng **từ chối chạy** nếu hộp bao ấy thò ra ngoài
khung nhìn (`kiemKhungNhin`, có `--selftest` nhốt đúng bộ số hỏng cũ). Ảnh ra **đúng bằng khung
hình**: 1100×700, `pad = 0`, không đệm, không dòng chữ, không dải nền trang. Xem `TECH_DEBT #49`.

**Vì sao phải viết mục này ra thay vì lặng lẽ đo lại.** Đây đúng cách `TECH_DEBT #22` đã xử lý bộ
lọc "8% điểm ảnh tươi nhất ≈ mái": bộ số cũ và bộ số mới **đo hai đại lượng khác nhau**, nên đặt
cạnh nhau là bịa ra một "thay đổi" không hề tồn tại. Một dòng "đã đo lại" thì phiên sau sẽ đọc bảng
cũ mà không biết.

### Cái gì ĐỔI và cái gì KHÔNG

| Loại số | Có bị ảnh hưởng không? | Vì sao |
|---|---|---|
| tam giác · lệnh vẽ · shader · geometry | **KHÔNG** | đọc từ `renderer.info`, không đọc từ điểm ảnh. Bộ đệm vẽ của canvas luôn là 1100×700 — phần bị xén là phần HIỂN THỊ, không phải phần RENDER. |
| ms mỗi khung (`--bench`) | **KHÔNG** | đo `renderer.domElement.width/height`, cùng lý do trên. Mô hình chi phí M3 (≈ 0,87 ms + 1,14 ms mỗi triệu điểm ảnh thật) vẫn đứng. |
| điểm số bản quét (`sweep-score.mjs`) | **CÓ** | đường đi khác (`sweepPageHtml`) nên không bị xén, NHƯNG `pad` đổi 8 → 0 và ảnh mất phần đệm ⇒ md5 đổi. Số điểm thì gần như không nhúc nhích (xem dưới). |
| bảng mật độ, `sweep-diff`, `road-score`, `shadow-score`, `frame-fit`, `png-probe` | **CÓ** | mọi thứ đọc từ điểm ảnh. |
| mọi `md5sum` byte-identical đã ghi | **CÓ** | ảnh đổi kích thước ⇒ không tái lập được. |

### Vá xong cái xén thì đụng ngay cái trần: ổ cắm CDP chỉ cho 4 MiB một tin nhắn

Lượt dựng lại mốc nền ĐẦU TIÊN sau bản vá đã **chết giữa chừng**: chạy 5 phút, rồi đúng một dòng

```
Error: Page.captureScreenshot: ổ cắm CDP lỗi
```

Không có chữ nào nói tới cỡ ảnh. Đo ra thì đó chính là cỡ ảnh: **một tin nhắn CDP không được quá
4 MiB**, và bản quét 15 kỷ (1864×3120) cần ~9 MB base64.

Con số 4 MiB là ĐO, không phải đọc tài liệu — chụp một canvas nhiễu (không nén được) mỗi lúc một
cao, rồi xem chỗ nào gãy:

| ảnh chụp | base64 trả về | kết quả |
|---|---|---|
| 1864×540 | 3.970.440 B (3,787 MiB) | chạy |
| 1864×564 | 4.149.532 B (3,957 MiB) | chạy |
| **1864×570** | **4.194.264 B (4,000 MiB)** | **chạy — sát trần, thiếu đúng 40 byte** |
| 1864×580 | — | **đứt ổ cắm** |

⇒ Trần đúng bằng `4 × 1024 × 1024`. Từ đó suy ra giá xấu nhất của một điểm ảnh khi đi qua ổ cắm:
4.194.264 ÷ (1864 × 570) = **3,948 ≈ 4 byte/điểm** (ảnh chụp đục hoàn toàn nên Chromium ghi PNG
3 byte/điểm, base64 nhân thêm 4/3).

**Bản vá: chụp thành DẢI NGANG rồi ghép ở phía Node.** Ngân sách mỗi dải = `4 MiB ÷ 2 ÷ 4 byte` =
**524.288 điểm ảnh**, tức đúng MỘT NỬA trần — và là nửa dành cho ảnh *không nén được chút nào*
(ảnh thật nén 3–6 lần, nên biên thực tế còn rộng hơn nhiều). Chọn một nửa chứ không chọn 90% vì
cái trần đó là một cái vực: vượt qua thì không có thông báo, chỉ có ổ cắm chết.

Phép ghi + ghép PNG nằm trong `scripts/png-probe.mjs` (cạnh phép đọc — cùng một định dạng thì phải
cùng một file), khoá bằng `scripts/pngProbe.test.js`. Bài có răng nhất là bài **so hai đường**:
cùng một ảnh, ghép từ ba dải phải ra **byte giống hệt** ảnh ghi một lần — chạy cả hai bên rồi so
với nhau, không so bên nào với một hằng số thứ ba.

| ảnh | số dải |
|---|---|
| khung mặc định 1100×700 | 2 |
| cận cảnh `--width 1500` (1500×954) | 3 |
| bản quét 15 kỷ 1864×3120 | 12 |

### ⚠️ `md5sum` KHÔNG phải phép đo "ảnh có đổi không" — máy bận là ảnh đổi

Đo được cùng ngày, và nó chạm tới mọi lời hứa "trùng từng byte" của dự án. Chụp **cùng một lệnh**,
cùng một cây mã, chỉ khác tải máy:

| hoàn cảnh | md5 |
|---|---|
| máy rảnh, 5 lượt liên tiếp | `2ad06f97…` (cả 5 lượt) |
| máy bận (4 vòng lặp bận trên máy 4 nhân) | `28992bba…` |
| rảnh trở lại | `2ad06f97…` |

Chênh lệch: **±1 trên một kênh màu, rải khắp ~2% điểm ảnh** — SwiftShader chia ô rasterise theo số
luồng dùng được, nên tải máy đổi thì đường làm tròn đổi. Cùng cỡ với chênh lệch giữa **chụp 1 dải
và chụp 2 dải** (±1 trên 2,28% điểm ảnh), tức **phép ghép dải không làm ảnh "kém chính xác" hơn
việc chạy trên một cái máy đang bận.**

Nghĩa là đọc `md5sum` phải đọc theo ĐÚNG MỘT CHIỀU:

- ✅ **Trùng md5 ⇒ ảnh y hệt.** Vẫn là bằng chứng mạnh nhất dự án có, và các lời hứa cũ dựa vào nó
  (ADR-034 "khung mặc định bất biến", `CHANGELOG` mục VIỆC 2) **vẫn đứng vững**.
- ❌ **Khác md5 KHÔNG ⇒ ảnh đã đổi.** Máy bận là đủ để md5 khác. Ai đó chạy lại phép chứng minh của
  ADR-034 trên một máy đang bận sẽ thấy nó "trượt" và tưởng có hồi quy.
- ⇒ Muốn chứng minh **KHÔNG đổi** thì hai lượt chụp phải **liền nhau, trên máy rảnh**; md5 khác thì
  đừng kết luận vội mà **đo chênh lệch điểm ảnh rồi so với ngưỡng mắt 12/255** — ±1 nằm thấp hơn
  ngưỡng ấy 12 lần, tức nó không đổi được bất kỳ kết luận mỹ thuật nào.
- ⇒ Và vai trò md5 ghi ở luật nghiệm thu (*"md5sum mọi cặp ảnh trước/sau, từ chối nếu TRÙNG byte"*)
  vẫn nguyên giá trị: nó bắt lỗi **chép nhầm / đặt sai tên / quên dựng lại** (bài học
  `MAI-SAU-ky9.png`), là chuyện khác hẳn với việc đo mỹ thuật.

### Mốc nền đã dựng lại ở HEAD (2026-08-19)

Dựng lại toàn bộ ở `208c5f3` + bản vá công cụ, **trên máy rảnh** (xem cảnh báo về tải máy ở trên).
Mọi con số dưới đây tái lập được bằng đúng dòng lệnh ghi kèm.

#### 1. Bản quét 15 kỷ × 6 chặng — cổng KHÔNG-TRÔI

```
node scripts/city-preview.mjs --sweep --all --theme light
node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png
```

| | trước (khung bị xén) | **sau (2026-08-19)** |
|---|---|---|
| cỡ ảnh | 1880×3170 (`pad: 8`) | **1864×3154** (`pad: 0`) |
| md5 | `34f0fcfd…` | **`4ec25554fb4c01f0c8762d709315ac86`** |
| số dải chụp | 1 (và nó KHÔNG đi lọt được nữa) | **12** |

Điểm số — **không nhúc nhích một chữ số nào** so với bộ đo sau Phase 12:

| | giá trị | ngưỡng |
|---|--:|---|
| cặp chặng gần nhất | **20,7** (sáng 8h ↔ chiều 15h) | > 12 |
| cặp chặng dưới ngưỡng | **0/15** | 0 |
| cặp kỷ gần nhất | **21,3** (kỷ 11 ↔ 12) | > 12 |
| cặp kỷ dưới ngưỡng | **0/105** | 0 |
| trung vị 105 cặp kỷ | **37,6** | (theo dõi — đang tụt dần qua các phase) |

Tự-kiểm hình học của công cụ: *"trời bình minh sáng hơn trời đêm ở 15/15 hàng ✓"*.

#### 2. Khung đơn mặc định

```
node scripts/city-preview.mjs --era 7 --hour 12
```

| | trước | **sau** |
|---|---|---|
| cỡ ảnh | 1134×780 (trong đó 23 dòng canvas **chưa từng được vẽ**) | **1100×700** |
| phần ảnh không phải khung hình | 12,9% | **0%** |
| md5 | — (không tái lập được) | **`2ad06f9742ec777271d9884de1726313`** |
| số dải chụp | 1 | **2** |
| hồ sơ `.geom.json` | `pad: 8`, toạ độ KHAI | `pad: 0`, toạ độ ĐO: `doX:16 doY:16 doW:1100 doH:700`, khung nhìn `1196×940` |

#### 3. Bảng mật độ — 60 ảnh mặt nạ (nền của §2-C)

```
bash <scratchpad>/do-matdo2.sh        # 45 ảnh {nhà·đất·đường} + 15 ảnh {cảnh vật·trời·núi}
node <scratchpad>/bang-matdo.mjs
```
md5 gộp cả 60 ảnh: **`9720aa7d914e5ad7f71e14d83501f59b`** · mỗi ảnh **1100×700** · `mask-count.mjs`
báo **0 điểm nền trang** ở cả 60 (đây là đối chứng của bản vá `clip`, không phải một con số trang trí).

Trung bình 15 kỷ, khung TOÀN CẢNH:

| | 20 phiên | 50 phiên | 80 phiên |
|---|--:|--:|--:|
| **nhà** | **20,38%** | **24,51%** | **25,01%** |
| **đất trống** | **46,17%** | **38,52%** | **35,88%** |
| đường | 1,19% | 4,26% | 7,02% |
| phần còn lại (núi + cảnh vật + cư dân) | 32,27% | 32,72% | 32,09% |

Trải ra 15 kỷ ở mốc 50 phiên: nhà thấp nhất **kỷ 1 = 7,73%** (lều da thú), cao nhất
**kỷ 6 = 35,02%**. Phần còn lại tách ra (mốc 50 phiên): **rặng núi 31,16% · trời ĐÚNG 0,00% ·
cảnh vật 1,67% · cư dân ≈ 0,14%**. Cổng kiểm hai mặt nạ khớp nhau, chênh lớn nhất **0,23%**.

⚠️ **So với bộ số cũ (đo trên khung bị xén)**: nhà 20,7 → 20,38 · 25,0 → 24,51 · 25,5 → 25,01, tức
**thấp hơn đều ~0,4–0,5 điểm phần trăm**. Đúng chiều dự đoán: 23 dòng được trả lại nằm ở **MÉP DƯỚI**
khung hình, chỗ gần như toàn mặt đất và mặt đường, nên chúng pha loãng phần nhà. Bộ số cũ đã được
vá đường vòng (màu mốc `rgb(1,2,3)` loại nền trang khỏi mẫu số) nên phần 12,9% không còn nằm trong
đó — chênh lệch còn lại **chỉ** là 23 dòng bị xén.

⇒ **Mốc cho §2-C**: "đất trống" phải tụt rõ so với **46,17% (20 phiên) / 38,52% (50) / 35,88% (80)**.

#### 4. Sau §2-C (mảng phủ đất) — 120 ảnh mặt nạ, hai cây mã

```
bash <scratchpad>/do-matdo-C.sh      # TRƯỚC dựng tại fffa893 trong `git worktree` riêng
node <scratchpad>/bang-C.mjs         # 3 cổng nằm trong công cụ, không phải chú thích
```

⚠️ Vế TRƯỚC **đo lại từ đầu**, không chép bảng trên (bài học `TECH_DEBT #43`). Phép đối chiếu:
cột TRƯỚC ra **46,17 / 38,52 / 35,88** — khớp bảng §3 tới hai chữ số thập phân ở cả ba mốc. Đó là
bằng chứng độc lập rằng bộ ảnh sạch, và nó **chỉ đúng sau khi thay một tấm hỏng** (xem ❗ bên dưới).

| trung bình 15 kỷ | 20 phiên | 50 phiên | 80 phiên |
|---|--:|--:|--:|
| **đất trống** | 46,17 → **44,84** (−1,33) | 38,52 → **36,23** (−2,29) | 35,88 → **34,77** (−1,11) |
| nhà | 20,38 → 20,04 | 24,51 → 24,05 | 25,01 → 24,85 |
| đường | 1,19 → 1,19 | 4,26 → 4,25 | 7,02 → 7,01 |

**45/45 ô đều GIẢM** (15 kỷ × 3 mốc, không một kỷ nào đi ngược). Giảm mạnh nhất kỷ 14 ở cả ba mốc
(−3,36 / −5,51 / −2,29); yếu nhất kỷ 7 ở mốc 20 (−0,25) và kỷ 13 ở hai mốc kia (−0,61 / −0,23).

Mặt nạ thứ hai gọi tên chỗ đất đi đâu (mốc 50 phiên): đất **38,61 → 36,27** (−2,34) · cảnh vật +
mảng phủ **1,58 → 4,40** (+2,83). Tổng hai Δ = **+0,49** — gần 0, tức phần đất mất đi đúng là đã
chảy sang mảng phủ chứ không phải đi đâu khác. Phần dư 0,49 nằm ở nhà (−0,48): mảng phủ nằm sát
chân công trình nên che mất một dải mỏng ở đó.

⚠️ **TRẦN CỦA CÁCH LÀM NÀY — ĐO ĐƯỢC, KHÔNG ĐOÁN.** Ép `share = 1,00` (phủ MỌI ô đất trống còn
lại) chỉ đưa kỷ 1 từ 60,29 xuống **53,16** (−7,13) và kỷ 14 xuống **38,81** (−6,33). Nghĩa là **ô
lưới trống chỉ chiếm ~12–16% số điểm ảnh "đất" nhìn thấy được**; phần còn lại là **vạt đất ngoài
lưới thành phố**. ⚠️ **ĐÍNH CHÍNH 2026-08-19**: bản đầu ghi *"đĩa đất bán kính 13,5 so với thành phố ~7,5 ⇒ ~69%"* — SAI. 13,5 · 8,5 · 7,5 là bán kính **hình cầu bao**, không phải bán kính đĩa; mặt đất là tấm **VUÔNG** 19×19 và lưới thành phố 12×12, nên phần nằm ngoài lưới là **361 − 144 = 217 ⇒ 60,1%** diện tích. Con số 84–88% ở trên KHÔNG đổi (nó được ĐO trên ảnh, không suy ra từ hình học).
⇒ **§2-B sẽ đụng đúng cái trần này**, vì nhà dân cũng chỉ mọc trong ô lưới. Muốn "đất trống" xuống
dưới ~30% thì phải đụng tới vạt đất ngoài lưới — một việc KHÁC, chưa ai bàn.

### Ba vùng của khung hình — ĐÃ ĐO (2026-08-19, 15 kỷ × 3 mốc × 2 lượt mặt nạ = 90 ảnh)

Câu hỏi Đàm đặt sau khi trần trên lộ ra: *"vạt đất ngoài lưới thành phố đang làm gì trong khung
hình?"*. Đo bằng cờ `splitGroundMesh` (mặc định TẮT, có test khoá) — mặt đất được cắt làm hai khối
mang tên `ground-grid` / `ground-apron` **ở tầng DỰNG**, không dò bằng màu (`TECH_DEBT #22`: hai
vùng dùng chung dải sắc độ, dò màu chắc chắn sai).

Lệnh tái lập, cho từng mốc `S ∈ {20, 50, 80}`:
```
node scripts/city-preview.mjs --all --hour 12 --sessions S --mask ground-grid,ground-apron,horizon
node scripts/city-preview.mjs --all --hour 12 --sessions S --mask city,road,residents
node scripts/mask-count.mjs .city-preview/<ảnh>.png <tên-đỏ> <tên-lục> <tên-lam>
```

| trung bình 15 kỷ (% khung hình) | 20 phiên | 50 phiên | 80 phiên |
|---|--:|--:|--:|
| đất TRONG lưới 12×12 | 23,4 | 15,3 | **13,7** |
| **VÀNH đất NGOÀI lưới** | **21,6** | **21,2** | **21,4** |
| rặng núi chân trời | 31,2 | 31,1 | 31,1 |
| nhà (đã gộp) | 23,1 | 28,7 | 27,2 |
| đường | 1,2 | 4,4 | 7,3 |
| cư dân | 0,1 | 0,2 | 0,2 |
| **đất trơ (trong lưới + vành)** | **45,0** | **36,5** | **35,1** |
| **… trong đó bao nhiêu phần là VÀNH** | **48,9%** | **59,7%** | **63,0%** |

⚠️ **KẾT LUẬN QUAN TRỌNG NHẤT — VÀNH NGOÀI LÀ MỘT CÁI SÀN, KHÔNG PHẢI MỘT PHẦN CỦA TIẾN ĐỘ.** Ba
cột trên cho thấy vành ngoài **đứng yên 21,2–21,6%** qua cả ba mốc, trong khi đất trong lưới tụt
23,4 → 13,7. Nghĩa là **càng chơi lâu, phần trống Đàm nhìn thấy càng là phần không cơ chế nội dung
nào chạm được**: 48,9% ở 20 phiên, 63,0% ở 80 phiên. Một phase kiểu §2-B/§2-C chỉ chia nhau 37% còn
lại. Xem `TECH_DEBT #53`.

**Đối chiếu chéo bằng một đường hoàn toàn khác** (bắn tia qua từng điểm ảnh, cắt mặt phẳng `y = 0`,
bỏ qua mọi vật che — tức CẬN TRÊN của mỗi vùng): trong lưới **45,6%** · vành **26,3%** · không chạm
đất **28,1%**. So với bảng đo trên ảnh ở mốc 80 phiên: trong lưới 13,7 + nhà 27,2 + đường 7,3 +
cư dân 0,2 = **48,4%** (cận trên 45,6, chênh vì công trình cao vượt lên che cả phần trời) · vành
**21,4** (cận trên 26,3, chênh vì nhà và đồi che bớt) · chân trời **31,1** (cận trên 28,1). Ba cặp
đều khớp về độ lớn và đúng chiều ⇒ hai phép đo độc lập đồng ý.

⚠️ **BẦU TRỜI CHIẾM 0% KHUNG HÌNH, và điều đó được chứng minh bằng chính CỔNG TỔNG.** Sáu lớp trên
cộng lại ra **100,1–101,4%** ở cả 45 ô. Nếu còn một lớp chưa ai đặt tên thì tổng phải THIẾU, không
thể THỪA; thừa chỉ có thể do viền răng cưa bị hai lượt mặt nạ độc lập cùng nhận (mỗi lượt gán điểm
ảnh biên cho lớp trội của lượt đó). Lệch lớn nhất **1,36 điểm phần trăm** — trên mức "dưới 1 đpt"
mà `mask-count.mjs` ghi, và nó lớn nhất đúng ở kỷ 11 (nhiều mép đường nhất), khớp với cách giải
thích viền răng cưa. **Đừng đọc bảng này tới chữ số thập phân thứ nhất.**

❗ **MỘT TẤM TRONG 120 ẢNH ĐÃ BỊ RÁCH NGANG.** `TRUOC-A-s20-ky09.png` báo đất **37,37%**; hai lượt
dựng lại độc lập đều ra **41,61%** với cùng md5. Nó lọt qua cả ba cổng của `bang-C.mjs`. Thứ lộ ra
sự thật chỉ là tình cờ: hai mặt nạ khác nhau cãi nhau về cùng một đại lượng. Với con số hỏng, mốc
20 phiên ra 45,88 (lệch mốc tài liệu 46,17); thay tấm đúng vào thì khớp chính xác. ⇒ Nay `shoot`
quét mọi mép hàng (`soiVetRach`), chụp lại tối đa 3 lượt, và **từ chối ghi ảnh** nếu vẫn rách. Xem
`TECH_DEBT #52` — nguyên nhân gốc vẫn CHƯA biết, và lời giải thích đầu tiên ("một dải đến từ khung
hình cũ") đã bị chính số đo bác bỏ.

---

## Sau §1(B) — đất thôi "nhàu" (2026-08-20, ADR-045)

Đổi cách sinh trường cao độ (`terrain.js`). **Không** thêm khối, **không** thêm vật liệu, **không**
thêm nguồn sáng, **không** đổi cỡ khung, **không** đổi DPR. Theo mục *"Khi nào phải đo lại"* ở cuối
file này thì phase như thế **không cần** đo lại frame time — nhưng hình học thì vẫn phải đếm, vì
trong cảnh có đúng một thứ mà **số lượng và kích thước phụ thuộc CAO ĐỘ**: **bệ kè** (`groundPlacement`).

`grep 'terrain\.' sceneGraph.js` ra đúng ba chỗ: `footprint` (bệ kè — sinh hình học), `surfaceHeightAt`
(đặt cảnh vật — chỉ đổi Y), `heightAt` (cư dân — chỉ đổi Y). ⇒ mọi chênh lệch tam giác phải nằm ở bệ kè.

⚠️ **MỐC NỀN LÀ `9c7032c`.** Bảng dưới đây đo lại toàn bộ sau khi `rebase`. Bản làm việc trước đó
của phiên này dựng trên nhánh CŨ `702fa31` (đo ở commit `9d02e9e`, nay đã bị viết lại bởi `rebase`
nên **không còn trong `git log`**), thiếu 8 commit: mặt nước, vùng quê, bảng địa thế, ADR-038…044.
Mọi con số của phase này **không so trực tiếp được** với bảng cũ ấy — đừng chép qua lại.

### Công cụ MỚI: `scripts/scene-tri.mjs` — đếm hình học KHÔNG cần Chromium

Nó dựng **đúng cảnh mã sản phẩm dựng** (`createCityScene` chạy thẳng trong Node — nhà máy hình học
không cần GPU) rồi duyệt scene graph theo đúng luật `WebGLRenderer`. Vì scene graph là **thứ thật**,
nó **không chép lại một công thức nào** — khác hẳn mọi bản đếm-bằng-tay trước đây, vốn phải chép luật
đặt khối của `sceneGraph.js` và dính đúng bẫy *"một luật hai công thức"*.
Chạy 15 kỷ mất **~20 giây** thay vì ~4 phút, và nó tách được số theo TỪNG KHỐI CÓ TÊN — thứ bảng gộp
của Chromium không cho.

```
node --import ./scripts/register-esm-loader.mjs scripts/scene-tri.mjs            # bảng 15 kỷ
node --import ./scripts/register-esm-loader.mjs scripts/scene-tri.mjs --era 8    # tách theo khối
```

⚠️ **Nghiệm thu của chính công cụ này là một phép ĐỐI CHIẾU CHÉO với Chromium**, không phải một
`--selftest`: kỷ 8 và kỷ 9, `node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow`
⇒ khớp **TỪNG ĐƠN VỊ** cả tam giác lẫn lệnh vẽ. Ngày nào hai bên lệch nhau thì **chỗ lệch chính là
chỗ hỏng**; đừng chọn bên nghe hợp ý.
⚠️ Mặc định của nó (giờ 12 · **40 phiên** · cấp 3 · chuỗi 9) **cố ý trùng `city-preview.mjs`** — đổi
mặc định là đổi cả bảng số, vì mạng đường mở dần theo số phiên (bài học "hai con số cùng tên
`sessionCount`", `TECH_DEBT #43`).

### Kết quả — tam giác THÀNH PHỐ, đủ 15 kỷ

Cột T đo lại trên `9c7032c` trong một `git worktree` riêng, **không chép** từ bảng phase trước; công
cụ chép sang cả hai kho và `md5sum` khớp trước khi đo.

| Kỷ | Nước | Tam giác TP T→S | Δ | Lệnh vẽ T→S |
|---:|---|---:|---:|:--:|
| 1 | Thổ Nhĩ Kỳ | 82.562 → 82.562 | 0 | 9 → 9 |
| 2 | Ai Cập | 70.734 → 70.734 | 0 | 12 → 12 |
| 3 | Iraq | 80.584 → 80.556 | **−28** | 12 → 12 |
| 4 | Trung Quốc | 128.814 → 128.814 | 0 | 12 → 12 |
| 5 | Đức | 85.214 → 85.214 | 0 | 11 → 11 |
| 6 | Việt Nam | 129.360 → 129.348 | **−12** | 12 → 12 |
| 7 | Ý | 114.948 → 114.864 | **−84** | 12 → 12 |
| 8 | Bồ Đào Nha | 100.452 → 100.396 | **−56** | 12 → 12 |
| 9 | Pháp | 94.930 → 94.862 | **−68** | 11 → 11 |
| 10 | Anh | 74.030 → 74.030 | 0 | 13 → 13 |
| 11 | Mỹ | 98.982 → 98.982 | 0 | 11 → 11 |
| 12 | Nga | 79.266 → 79.322 | **+56** | 11 → 11 |
| 13 | Nhật Bản | 118.724 → 118.724 | 0 | 11 → 11 |
| 14 | Singapore | 135.694 → 135.694 | 0 | 11 → 11 |
| 15 | UAE | 96.392 → 96.408 | **+16** | 11 → 11 |
| **Tổng** | | **1.490.686 → 1.490.510** | **−176 (−0,012%)** | |

Tam giác NỀN (vòm trời + rặng núi) **44.126 ở cả 15 kỷ, cả hai vế** — một hằng số, đúng như nó phải thế.

**Lệnh vẽ: KHÔNG ĐỔI MỘT ĐƠN VỊ NÀO ở cả 15 kỷ**, khớp bảng 15 mốc `MOC_LENH_VE`
(`drawCallBudget.test.js`) — đúng theo cấu trúc, vì bệ kè dùng vai `stone` đã có sẵn ở mọi kỷ.

### Đối chiếu chéo: đếm RIÊNG bệ kè, khớp từng đơn vị ở 15/15 kỷ

`node --import ./scripts/register-esm-loader.mjs scripts/plinth-tri.mjs` — một đường đo **hoàn toàn
độc lập**, không chạm three: hỏi thẳng `terrain.footprint(...)` cho từng ô có công trình rồi hỏi
`countSpecTriangles` (**không** nhân với một hằng số tam giác/bệ — từ Phase 8B số tam giác phụ thuộc
KÍCH THƯỚC của khối).

| | TRƯỚC | SAU | Δ |
|---|---:|---:|---:|
| số bệ kè (15 kỷ) | **31** | **23** | −8 |
| tam giác bệ kè | **820** | **644** | **−176** |

**−176 bằng ĐÚNG chênh lệch tổng của bảng trên, và khớp ở CẢ 15 KỶ một cách riêng lẻ** (kỷ 3 −28 ·
6 −12 · 7 −84 · 8 −56 · 9 −68 · 12 +56 · 15 +16, chín kỷ còn lại 0). ⇒ Toàn bộ khác biệt hình học
của §1(B) nằm ở bệ kè, không sót chỗ nào.

⚠️ **VÀ PHÉP ĐỐI CHIẾU ẤY ĐÃ BẮT ĐƯỢC MỘT LỖI TRONG CHÍNH NÓ — vì một hằng số CHÉP TAY.** Bản đầu
của `plinth-tri.mjs` viết `const BUILDING_SCALE = 0.86` (số cũ, chép từ trí nhớ). Giá trị thật trong
`sceneGraph.js` là **1.3**; `span` sai thì `footprint` hỏi một ô khác ⇒ nó đếm được **3 bệ thay vì
31** và in ra một bảng 15 dòng **trông hoàn toàn bình thường**. Không có gì đỏ lên. Thứ lộ ra sự
thật là đúng cái phép đối chiếu này: bảng bệ nói **+16** trong khi `scene-tri` nói **−176** — hai
phép đo cãi nhau, và bên hỏng là bên MỚI. Nay hằng số được **đọc thẳng từ mã nguồn**
(`sceneGraph.js` không export nó), nên chỉ còn một chỗ giữ con số ấy. ⇒ Bài học cũ, hình dạng mới:
*"một luật một công thức"* áp cho cả **hằng số của phép đo**, không chỉ cho công thức của nó — và
**nếu chỉ có một phép đo thì không có gì để cãi nhau, tức không có gì để phát hiện**.

### Vì sao 5 kỷ GIẢM mà 2 kỷ TĂNG

Bệ kè sinh ra khi mặt bằng một công trình vắt qua chỗ đất hụt. Địa hình thoải đi ⇒ **ít chỗ hụt
hơn** (kỷ 3 · 6 · 7 · 8 · 9 mất bớt bệ; riêng kỷ 7 mất 3/5). Nhưng nó cũng **dịch chỗ** các ranh
thềm, nên có công trình trước đây đứng trọn trên một bậc nay vắt qua ranh (kỷ 12: 0 → 2 bệ). Kỷ 15
giữ nguyên 1 bệ nhưng bệ ấy **cao lên** (12 → 28 tam giác) — đúng luật "tam giác theo kích thước"
của Phase 8B.

### Kết luận hiệu năng

**−0,012% tam giác, 0 lệnh vẽ, 0 vật liệu, 0 nguồn sáng.** Mô hình chi phí trên M3 nói 80% chi phí
đi theo ĐIỂM ẢNH và 43% chênh lệch hình học chỉ đổi 2,4% thời gian ⇒ **dưới mọi ngưỡng đo được**.
Không cần đo lại frame time. Vế M3 vẫn nợ y như sau Phase 10/11/12.

## Sau VIỆC 1 «bỏ cái khay» — vùng quê ngoài lưới (2026-08-19)

**Mốc nền ĐO LẠI Ở HEAD (`702fa31`) trong một `git worktree` riêng, không chép cột "sau" của phase
trước** — đúng luật đã ghi ở cuối mục này (Phase 11 suýt phải trả giá vì chép). Cả hai vế dùng CÙNG
một script (`KHO=<đường-dẫn> node --import ./scripts/register-esm-loader.mjs …`), cùng `sessionCount
= 80`, cùng `hour = 12`, mọi công trình cấp 3. Phép đếm là một bản duyệt scene graph ĐỘC LẬP viết
theo đúng luật `WebGLRenderer.info.render` — cố ý không gọi hàm của mã sản phẩm.

### Vế đã đo xong — lệnh vẽ và hình học, ĐỦ CẢ 15 KỶ

| kỷ | nước | tam giác TRƯỚC | tam giác SAU | chênh | % | lệnh vẽ TRƯỚC → SAU |
|---|---|---:|---:|---:|---:|:---:|
| 1 | Thổ Nhĩ Kỳ | 68.848 | 123.840 | +54.992 | +79.9% | 11 → 11 ✓ |
| 2 | Ai Cập | 73.252 | 114.268 | +41.016 | +56.0% | 13 → 13 ✓ |
| 3 | Iraq | 86.192 | 123.792 | +37.600 | +43.6% | 12 → 12 ✓ |
| 4 | Trung Quốc | 95.316 | 170.972 | +75.656 | +79.4% | 13 → 13 ✓ |
| 5 | Đức | 82.356 | 137.278 | +54.922 | +66.7% | 12 → 12 ✓ |
| 6 | Việt Nam | 98.490 | 172.766 | +74.276 | +75.4% | 13 → 13 ✓ |
| 7 | Ý | 104.618 | 164.982 | +60.364 | +57.7% | 13 → 13 ✓ |
| 8 | Bồ Đào Nha | 100.990 | 149.210 | +48.220 | +47.7% | 13 → 13 ✓ |
| 9 | Pháp | 97.284 | 140.452 | +43.168 | +44.4% | 12 → 12 ✓ |
| 10 | Anh | 94.370 | 121.478 | +27.108 | +28.7% | 13 → 13 ✓ |
| 11 | Mỹ | 104.932 | 151.128 | +46.196 | +44.0% | 12 → 12 ✓ |
| 12 | Nga | 87.370 | 131.738 | +44.368 | +50.8% | 12 → 12 ✓ |
| 13 | Nhật Bản | 100.660 | 152.658 | +51.998 | +51.7% | 11 → 11 ✓ |
| 14 | Singapore | 94.190 | 173.474 | +79.284 | +84.2% | 12 → 12 ✓ |
| 15 | UAE | 97.538 | 131.634 | +34.096 | +35.0% | 12 → 12 ✓ |
| **tổng** | | **1.386.406** | **2.159.670** | **+773.264** | **+55.8%** | **0 kỷ đổi** |

**LỆNH VẼ: KHÔNG MỘT KỶ NÀO ĐỔI MỘT ĐƠN VỊ.** Đây là ràng buộc cứng nhất của Đàm cho phase này
(*"kỷ trong lục địa phải giữ nguyên mốc cũ, không đổi một đơn vị"*), và nó đạt được vì vùng quê
**nhập vào khối gộp `city`** thay vì dựng khối riêng: cây dùng vai màu `wood` + `leaf`/`leaf2` →
họ vật liệu `wood` và `foliage`, mà **cả hai họ đã có mặt ở cả 15 kỷ từ trước**. Cổng
`drawCallBudget.test.js` (4 bài, gồm một đối chứng kéo thêm một họ vào một kỷ và ĐÒI mốc kỷ ấy phải
đỏ) xanh nguyên.

### Hình học: +55,8% tam giác (1.386.406 → 2.159.670)

Không có con số mili-giây nào ở đây, vì chưa ai đo bộ mã này trên máy thật. Xem **luật ĐO / KHÔNG
ĐO** ở đầu file: không đo thì để trống.

### KHÔNG chạm vào ba thứ Đàm cấm
**0 nguồn sáng mới · 0 texture mới · 0 shader động.** Vùng quê chỉ dùng lại vai màu và nhà máy hình
học sẵn có (`flora.js` qua `propSpec.js`); không một `Material` mới nào được tạo.

---

## Sau VIỆC 2 Bước B «mặt nước» — 2 kỷ có nước, 13 kỷ KHÔNG ĐỔI MỘT ĐƠN VỊ (2026-08-19)

**Mốc nền ĐO LẠI Ở HEAD (`178efeb`) trong một `git worktree` riêng.** Lần này phép đo có TÊN và đã
được commit: **`scripts/scene-count.mjs`**, chạy hai vế bằng **cùng một dòng lệnh**, chỉ khác `KHO`:

```
git worktree add /tmp/truoc 178efeb && ln -s "$PWD/node_modules" /tmp/truoc/node_modules
KHO=/tmp/truoc node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
KHO=$PWD      node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
```

`SESSIONS=80 · HOUR=12 · LEVEL=3` (đúng tham số VIỆC 1 dùng). Trước nay phép đo này được viết TẠM
rồi vứt đi ở mọi phase, nên chính con số nghiệm thu lại không tái lập được — vi phạm luật *"một con
số nghiệm thu phải đi kèm CÔNG CỤ **và ĐẦU VÀO** đã sinh ra nó"*. Nay không còn.

✅ **Vế "trước" đo lại ra ĐÚNG cột "sau" của VIỆC 1 ở CẢ 15 KỶ, tổng khớp từng đơn vị
(2.159.670).** Tức tài liệu KHÔNG trôi lần này — khác hẳn `TECH_DEBT #43`, nơi 6/15 kỷ đã lệch mà
không ai biết. Đây là lý do phải đo lại chứ không chép: nếu có trôi thì đây là chỗ nó lộ ra.

### Vế đã đo xong — lệnh vẽ và hình học, ĐỦ CẢ 15 KỶ

| kỷ | nước | tam giác TRƯỚC | tam giác SAU | chênh | lệnh vẽ TRƯỚC → SAU |
|---|---|---:|---:|---:|:---:|
| 1 | Thổ Nhĩ Kỳ — KHÔ | 123.840 | 123.840 | **0** | 11 → 11 ✓ |
| 2 | Ai Cập | 114.268 | 114.268 | 0 | 13 → 13 ✓ |
| 3 | Iraq | 123.792 | 123.792 | 0 | 12 → 12 ✓ |
| 4 | Trung Quốc | 170.972 | 170.972 | 0 | 13 → 13 ✓ |
| 5 | Đức | 137.278 | 137.278 | 0 | 12 → 12 ✓ |
| 6 | Việt Nam | 172.766 | 172.766 | 0 | 13 → 13 ✓ |
| 7 | Ý | 164.982 | 164.982 | 0 | 13 → 13 ✓ |
| 8 | Bồ Đào Nha | 149.210 | 149.210 | 0 | 13 → 13 ✓ |
| 9 | Pháp | 140.452 | 140.452 | 0 | 12 → 12 ✓ |
| 10 | Anh | 121.478 | 121.478 | 0 | 13 → 13 ✓ |
| 11 | Mỹ | 151.128 | 151.128 | 0 | 12 → 12 ✓ |
| **12** | **Nga — SÔNG** | 131.738 | **127.200** | **−4.538 (−3,4%)** | **12 → 13 (+1)** |
| 13 | Nhật Bản | 152.658 | 152.658 | 0 | 11 → 11 ✓ |
| **14** | **Singapore — BIỂN** | 173.474 | **179.174** | **+5.700 (+3,3%)** | **12 → 13 (+1)** |
| 15 | UAE | 131.634 | 131.634 | 0 | 12 → 12 ✓ |
| **tổng** | | **2.159.670** | **2.160.832** | **+1.162 (+0,05%)** | **đúng 2 kỷ đổi** |

**LỆNH VẼ: +1 Ở ĐÚNG HAI KỶ CÓ NƯỚC, 13 KỶ KHÔ KHÔNG ĐỔI MỘT ĐƠN VỊ.** Đây là ràng buộc cứng nhất
Đàm ra cho phase này. Nó đạt được vì mặt nước là **một tấm hình chữ nhật PHẲNG** — đường bờ không
bao giờ được vẽ ra, nó là chỗ mặt đất đã khoét cắt qua mực nước. `TAM_CO_DINH` trong
`drawCallBudget.test.js` nay là **HÀM CỦA KỶ** (`4 + (waterIsBuilt(era) ? 1 : 0)`), kèm bảng đối
chứng `MOC_TRUOC_NUOC` giữ nguyên văn mốc cũ ⇒ lời hứa là một **phép trừ có thể đỏ**.

### ✅ ĐỐI CHIẾU CHÉO: hai phép đo độc lập, hai fixture khác nhau, CÙNG một hiệu số

Phép đếm thuần ở trên chạy `SESSIONS=80, LEVEL=3`. Chromium (`node scripts/city-preview.mjs --era N
--hour 12`) chạy `SESSIONS=40, LEVEL=3`. Hai bộ số TUYỆT ĐỐI khác nhau (kỷ 14: 179.174 so với
135.686 + 44.126 nền), nhưng **hiệu số trước/sau khớp TỪNG ĐƠN VỊ**:

| kỷ | hiệu số (thuần, 80 phiên) | hiệu số (Chromium, 40 phiên) |
|---|---:|---:|
| 12 | −4.538 | −4.538 |
| 14 | +5.700 | +5.700 |
| 1 | 0 | 0 (ảnh trùng TỪNG BYTE) |

Điều này không chỉ là "hai phép đo đồng ý". Nó nói một điều về **kiến trúc**: chi phí của mặt nước
**không phụ thuộc tiến độ chơi** — đúng như tầng `setting` được thiết kế (ĐỊA LÝ, không phải TIẾN
ĐỘ; có test gọi kèm dữ liệu rác khoá điều đó). Nếu hiệu số lệch nhau giữa hai mốc phiên thì nghĩa
là nước đang lén phụ thuộc `sessionCount`, và không có phép đối chiếu này thì không ai biết.

### Vì sao kỷ 12 NHẸ ĐI mà kỷ 14 NẶNG THÊM

Tấm nước tự nó tốn: **16.128 tam giác (kỷ 14)** và **3.442 (kỷ 12)** — đọc thẳng từ hình học đã
dựng, không suy ra. Nhưng nước cũng **dọn đi cảnh vật vùng quê** (`PROP_SHORE_CLEAR = 0,35`: không
có cây mọc dưới nước). Cộng lại:

- kỷ 12 (sông rộng 3,4 ô, vắt dọc cả cảnh): dọn đi ~7.980 tam giác cây/đá, tấm nước chỉ 3.442 ⇒ **nhẹ đi**.
- kỷ 14 (biển, nửa mặt phẳng phía nam ra tới mép thế giới): tấm nước 16.128, dọn đi ~10.428 ⇒ **nặng thêm 5.700**.

### Hình học: +0,05% tổng — con số nhỏ nhất của bất kỳ phase nào trong loạt này

Không có con số mili-giây nào ở đây. Xem **luật ĐO / KHÔNG ĐO** ở đầu file.

### Vế CHƯA đo — frame time trên M3

Chưa đo.

---

## Sau `worldYaw` — đưa mặt nước vào khung mặc định (2026-08-20, ADR-041)

Đóng `TECH_DEBT #57`. `worldYaw` xoay ĐỊA THẾ (nước + địa hình + vùng quê + rặng núi) chứ không
xoay camera và không xoay lưới 12×12. Giá trị luôn là bội của 90° và chỉ khác 0 khi bờ nước nằm
sau lưng camera mặc định.

### Vế đã đo — nước trong khung mặc định

Lệnh: `node --import ./scripts/register-esm-loader.mjs scripts/water-view.mjs --eras 12,14,1`

| kỷ | bờ (`side`, GIỮ NGUYÊN) | `worldYaw` | mặc định TRƯỚC | mặc định SAU | trần | lệnh vẽ |
|---|---|---:|---:|---:|---:|---:|
| 14 (biển) | `nam` | +90° | 0,09% | **23,75%** | 31,43% | 11 → 11 |
| 12 (sông) | `dong` | +90° | 2,30% | **9,32%** | 8,97% | 11 → 11 |
| 1 (khô) | `none` | 0° | 0,00% | 0,00% | 0,00% | 9 → 9 |

**Lệnh vẽ KHÔNG đổi ở cả 15 kỷ** — `worldYaw` xoay toạ độ, không thêm khối. (+1 lệnh vẽ ở kỷ 12/14
là của Bước B trước đó, đã khoá trong `drawCallBudget.test.js` bằng bảng `MOC_TRUOC_NUOC`.)

⚠️ **Kỷ 12 SAU (9,32%) cao hơn "trần" (8,97%) — không phải lỗi làm tròn.** Cột trần đo bằng cách
đứng ĐỐI DIỆN bờ, và với một dải sông thì góc chính diện **không** phải góc tối ưu: nhìn xiên thì
khúc sông trải dài hơn trong khung. Đo cả 14 kỷ × 24 góc mới thấy điều đó (kỷ 7: 2,69% khi nhìn
thẳng so với 9,05% khi nhìn xiên). *Một cái tên cột — "trần" — đã hứa nhiều hơn thứ nó đo.*

### ⚠️ BA KỶ NƯỚC HẸP KHÔNG ĐẠT CỔNG 5% Ở **MỌI** GÓC — đo trước khi tiêu ngân sách

| kỷ | nước | bề rộng (ô) | trần TOÀN CỤC (24 góc) |
|---|---|---:|---:|
| 6 | sông | 1,2 | **4,44% — dưới 5% ở MỌI góc** |
| 7 | sông | 1,4 | 9,05% (chỉ ở góc xiên, phá khung kỷ khác) |
| 10 | kênh | 0,9 | 7,37% (chỉ ở một góc phá hỏng mọi kỷ khác) |

Đây là sự thật về **BỀ RỘNG trong bảng**, không về phép xoay ⇒ chỉnh `worldYaw` cho ba kỷ ấy là
chỉnh sai chỗ. Ghi thành `TECH_DEBT #59`, chốt trước khi Bước C trải tới chúng.

### Phép đo dải thành phố GẦN NHƯ MÙ với mặt nước — đo được, không phải suy đoán

`sweep-score.mjs` chỉ đọc `BANDS[1]` (0,34–0,68 chiều cao ô), mà nước sống ở **vành ngoài**. So hai
bản quét TRƯỚC/SAU bằng cùng một công cụ, hai chế độ:

| chế độ | kỷ 12 | kỷ 14 | 13 kỷ còn lại |
|---|---:|---:|---:|
| dải thành phố (`sweep-diff`) | **9,7 — DƯỚI ngưỡng mắt 12** | 12,0 (sát ngưỡng) | 0,0 |
| cả khung hình (`sweep-diff --frame`) | 13,9% điểm ảnh · lệch TB 11,13 | 20,9% · lệch TB 25,89 | 0,0% · 0,02 |

⇒ Nếu chỉ đọc phép đo dải, kỷ 12 sẽ bị báo là *"không phân biệt được bằng mắt"* trong khi mặt nước
vừa tăng **4 lần**. Đây là §4-Q2 của Đàm, trả lời bằng số: **cổng không-trôi vẫn là `sweep-score`
(dải), nhưng cổng "thay đổi có lên tới màn hình không" phải là `--frame`** — cùng công cụ, cùng đơn
vị, cùng ngưỡng 12, không dựng thang mới. Cả bản quét đổi **2,1%** điểm ảnh, lệch TB **68,07** ở
chỗ đã đổi.

### Cổng không-trôi vẫn đạt

`node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png` → **15/15 cặp chặng · 105/105
cặp kỷ**, cặp kỷ gần nhất 21,5 · **trung vị 40,7** (trước đó 37,6 — đi LÊN, vì kỷ 12 và 14 nay có
thêm một dữ kiện riêng mà kỷ khác không có).

### ⚠️ 7/13 kỷ KHÔNG ĐỔI lại lệch `md5` — nhưng ảnh y hệt, đúng `TECH_DEBT #50`

Trong 13 kỷ đáng lẽ không đổi: **6 kỷ trùng từng byte** (2, 6, 7, 9, 10, 15) và **7 kỷ lệch md5**
(1, 3, 4, 5, 8, 11, 13). Đo bằng `sweep-diff --frame`:
**0,0% điểm ảnh vượt ngưỡng · lệch trung bình 0,02** — thấp hơn ngưỡng mắt 600 lần, và thấp hơn
mức của kỷ 12/14 (11,13 / 25,89) khoảng **550 lần**. Đây là nhiễu SwiftShader ±1 theo tải máy, đã
ghi ở `TECH_DEBT #50`: *trùng md5 ⇒ ảnh y hệt, nhưng khác md5 ⇏ ảnh đã đổi*. Phép đo có đối chứng
chứng minh nó KHÔNG mù: cùng công cụ, cùng lệnh, nó thấy kỷ 12 và 14 đổi rất rõ.

### Vế CHƯA đo — frame time trên M3

Chưa chạy `bench-macbook.sh` sau thay đổi này. **Không có phép đo thì không có con số** (luật ở đầu
file) — không ước lượng, để trống.

---

## Sau VIỆC 2 Bước C «mặt nước trải ra 14/15 kỷ» — 3 kỷ KHÔNG ĐỔI MỘT ĐƠN VỊ (2026-08-20, ADR-042)

**Công cụ + đầu vào, chép sẵn để tái lập** (luật *"một con số nghiệm thu phải đi kèm CÔNG CỤ **và
ĐẦU VÀO** đã sinh ra nó"*):

```
git worktree add /tmp/truocC 054e868
ln -s "$PWD/node_modules" /tmp/truocC/node_modules
KHO=/tmp/truocC node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
KHO=$PWD       node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
```

Cả hai vế: `SESSIONS=80 HOUR=12 LEVEL=3`. Cột "lệnh vẽ" ở bảng này là **TỔNG cả cảnh** (thành phố +
vòm trời + rặng núi), nên nó lớn hơn `MOC_LENH_VE` của `drawCallBudget.test.js` đúng **2** — bảng
kia đếm riêng phần THÀNH PHỐ và đo ở `sessionCount: 40`. Hai bảng trả lời hai câu hỏi khác nhau;
đừng so thẳng chúng với nhau.

### Vế đã đo xong — lệnh vẽ và hình học, ĐỦ CẢ 15 KỶ

| kỷ | kiểu nước | tam giác trước | tam giác sau | Δ | lệnh vẽ trước → sau |
|---:|---|---:|---:|---:|:---:|
| 1 | — ⟵ khô | 123.840 | 123.840 | +0 | 11 → 11 (+0) |
| 2 | river | 114.268 | 112.140 | −2.128 | 13 → 14 (+1) |
| 3 | river | 123.792 | 122.044 | −1.748 | 12 → 13 (+1) |
| 4 | river | 170.972 | 169.408 | −1.564 | 13 → 14 (+1) |
| 5 | meander | 137.278 | 126.652 | −10.626 | 12 → 13 (+1) |
| 6 | river | 172.766 | 167.546 | −5.220 | 13 → 14 (+1) |
| 7 | river | 164.982 | 158.690 | −6.292 | 13 → 14 (+1) |
| 8 | estuary | 149.210 | 143.902 | −5.308 | 13 → 14 (+1) |
| 9 | river | 140.452 | 136.836 | −3.616 | 12 → 13 (+1) |
| 10 | canal | 121.478 | 120.070 | −1.408 | 13 → 14 (+1) |
| 11 | estuary | 151.128 | 147.012 | −4.116 | 12 → 13 (+1) |
| 12 | river ⟵ đã dựng từ Bước B | 124.722 | 124.722 | **+0** | 13 → 13 (**+0**) |
| 13 | sea | 152.658 | 163.594 | +10.936 | 11 → 12 (+1) |
| 14 | sea ⟵ đã dựng từ Bước B | 179.182 | 179.182 | **+0** | 13 → 13 (**+0**) |
| 15 | sea | 131.634 | 145.286 | +13.652 | 12 → 13 (+1) |
| **tổng** | | **2.158.362** | **2.140.924** | **−17.438 (−0,8%)** | |

### Ba con số ĐÚNG BẰNG 0 là phần đáng đọc nhất của bảng

Kỷ **1** (khô), kỷ **12** và kỷ **14** (đã dựng nước từ Bước B) không đổi **một đơn vị nào**, ở
**cả hai** cột. Đó không phải may mắn mà là đúng ba kỷ duy nhất lẽ ra phải đứng yên — nên bảng này
tự nó là một đối chứng: nếu phép đo bị lệch phiên bản, bị lẫn tải máy, hay bị chép nhầm cột, ba
số 0 ấy gần như chắc chắn sẽ không còn là 0. (Đúng bài học `TECH_DEBT #43`: hai phase không liên
quan nhau về nội dung vẫn dính nhau qua **cột số**.)

### +1 lệnh vẽ, và CHỈ ở kỷ vừa được dựng nước

12 kỷ mới dựng nước: **+1 mỗi kỷ, không kỷ nào +2**. Ba kỷ còn lại: **+0**. Đây chính là ràng buộc
cứng của ADR-040 (mặt nước là **một hình chữ nhật phẳng**, đường bờ không bao giờ được vẽ ra), và
nó được canh bằng một **PHÉP TRỪ có thể đỏ** chứ không phải một lời hứa: `drawCallBudget.test.js`
giữ song song `MOC_TRUOC_NUOC` (đo 2026-08-18, trước khi có bất kỳ giọt nước nào) và `MOC_LENH_VE`
(nay), rồi đòi hiệu số phải bằng đúng `waterIsBuilt(era) ? 1 : 0` ở cả 15 kỷ.

### Tam giác GIẢM ở 10 kỷ, TĂNG ở 2 kỷ — và đó là hành vi đúng

Tổng **nhẹ đi 17.438 tam giác (−0,8%)**. Nghe ngược đời, nhưng đúng theo cấu trúc: chỗ nào thành
mặt nước thì **cây, đá, mảng phủ ở đó biến mất** (chúng không mọc dưới nước — `PROP_SHORE_CLEAR`),
và một tấm nước phẳng rẻ hơn hẳn đám cảnh vật nó thay thế. Kỷ 5 nhẹ nhất bảng (−10.626) vì khúc
uốn `meander` ôm ba mặt nên dọn đi nhiều cảnh vật nhất.

Hai kỷ nặng thêm đều là **`sea`** (13: +10.936 · 15: +13.652): biển là một **nửa mặt phẳng** trải
tới chân trời, nên tấm nước của nó lớn hơn hẳn một dải sông — và `reach` của chúng cũng lớn nhất
bảng (kỷ 15 = 6, kỷ 13 = 4). Kỷ 14 (`sea`, `reach` 3) đã trả khoản ấy từ Bước B: **+5.700**.

Cả hai chiều đều nằm sâu trong vùng rẻ: trục tính tiền là **ĐIỂM ẢNH và ÁNH SÁNG**, không phải hình
học (mục "Mô hình chi phí" ở đầu file). Phase này thêm **0 nguồn sáng · 0 texture · 0 shader động**.

### Vế CHƯA đo — frame time trên M3

`bash scripts/bench-macbook.sh` **chưa chạy được ở đây, và đó là thiết kế**: hộp cát AI chạy WebGL
bằng SwiftShader, nên chính script tự **dừng ở cảnh đầu** khi thấy tên card đồ hoạ là "SwiftShader"
thay vì đẻ ra 25 dòng số vô giá trị. **Không có phép đo thì không có con số** (luật ở đầu file) —
để trống. Đây là lượt làm mới số liệu Đàm đã nói rõ *"không phải một cổng, không phải một blocker"*.

---

## Sau «XOÁ CÁI BỆ» — hình học KHÔNG NHÚC NHÍCH MỘT ĐƠN VỊ ở cả 15 kỷ (2026-08-21, ADR-046/047)

**Mốc nền `dfd2b15`**, đo lại tại chỗ trong một `git worktree` ở đúng HEAD (luật `TECH_DEBT #43`),
bằng **cùng một dòng lệnh** chỉ khác biến `KHO`:

```
KHO=<đường dẫn kho> SESSIONS=40 node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
```

| kỷ | tam giác TRƯỚC | tam giác SAU | lệnh vẽ TRƯỚC | lệnh vẽ SAU |
|---:|---:|---:|---:|---:|
| 1 | 126.688 | **126.688** | 11 | **11** |
| 2 | 114.860 | **114.860** | 14 | **14** |
| 3 | 124.682 | **124.682** | 14 | **14** |
| 4 | 172.940 | **172.940** | 14 | **14** |
| 5 | 129.340 | **129.340** | 13 | **13** |
| 6 | 173.474 | **173.474** | 14 | **14** |
| 7 | 158.990 | **158.990** | 14 | **14** |
| 8 | 144.522 | **144.522** | 14 | **14** |
| 9 | 138.988 | **138.988** | 13 | **13** |
| 10 | 118.156 | **118.156** | 15 | **15** |
| 11 | 143.108 | **143.108** | 13 | **13** |
| 12 | 123.448 | **123.448** | 13 | **13** |
| 13 | 162.850 | **162.850** | 13 | **13** |
| 14 | 179.820 | **179.820** | 13 | **13** |
| 15 | 140.534 | **140.534** | 13 | **13** |
| **tổng** | **2.152.400** | **2.152.400** | — | — |

**0 tam giác · 0 lệnh vẽ · 0 vật liệu · 0 nguồn sáng.** Hai con số cuối kiểm bằng cách đếm thẳng
trên mã nguồn: `sceneGraph.js` có **4** `new *Light(` và **10** `new Mesh*Material(` ở CẢ HAI cây,
và `git diff -- src/` **không thêm một dòng nào** khớp `new *Light(` hay `new Mesh*Material(`.

### ⚠️ HAI CỘT Y HỆT NHAU KHÔNG PHẢI "KHÔNG CÓ GÌ ĐỔI" — PHẢI HỎI PHÉP ĐO CÓ NHÌN TỚI CHỖ ĐÃ SỬA KHÔNG

Đây đúng cái bẫy đã ghi trong `CLAUDE.md` (*"khi một phép đo ra kết quả y hệt lần trước, câu hỏi
đầu tiên KHÔNG phải 'vậy là không đổi à?' mà là 'phép đo này có NHÌN TỚI chỗ tôi vừa sửa
không?'"*). Trả lời cho lần này: **KHÔNG, và đó là điều đúng đắn.** Tam giác và lệnh vẽ là đại
lượng của **TÔ-PÔ** (bao nhiêu đỉnh, bao nhiêu họ vật liệu); bản vá này chỉ dời **VỊ TRÍ** của các
đỉnh sẵn có — `terrainSurfaceReach(12)` giữ nguyên **9,5** nên tấm lưới giữ nguyên số đỉnh, và số
bệ kè cũng không đổi vì cao độ **trong lưới** không đổi một chữ số. Hai cột bằng nhau vì vậy là
**kết quả mong muốn**, không phải bằng chứng "chưa đổi gì".

Thứ chứng minh bản vá tới được màn hình là một phép đo **KHÁC HẲN** — so ảnh render (`sweep-diff
--frame`, 15 cặp, cùng một dòng lệnh, hai cây mã): **18,9 %–39,3 %** điểm ảnh đổi quá ngưỡng mắt
12/255, lệch trung bình cả khung **12,79–30,70**. Kỷ nào cũng vượt ngưỡng, không kỷ nào im lặng.

**Đối chứng cho chính phép đo này** (bắt buộc, nếu không thì "hai cột bằng nhau" cũng có thể là
`KHO` không ăn): chạy lại đúng lệnh ấy với `KHO` trỏ vào `base11` (`e95cdf1`, Phase 12) ra tổng
**1.321.686** — khác hẳn, tức biến `KHO` thật sự đổi cây mã.

### Vế CHƯA đo — frame time trên M3

Không chạy được ở đây (SwiftShader, script tự dừng ở cảnh đầu — đúng thiết kế). Nhưng phase này
**không đụng một trong ba trục tính tiền nào**: 0 nguồn sáng mới · 0 shader mới · khung hình không
đổi, và hình học thì y hệt tới từng đơn vị. Theo mô hình chi phí ở đầu file (80 % theo điểm ảnh,
20 % cố định), **không có đường nào để phase này làm chậm máy** — đây là suy luận CẤU TRÚC, không
phải một con số, và nó được ghi ra đúng dạng ấy.

---

## ⚠️ MỘT TRỤC CHI PHÍ MÀ CẢ FILE NÀY CHƯA TỪNG ĐO: **THỜI GIAN DỰNG CẢNH** (2026-08-21, ADR-048)

Toàn bộ phần trên đo *"GPU phải VẼ bao nhiêu mỗi khung hình"* — tam giác, lệnh vẽ, mili-giây. Không
một dòng nào đo *"CPU phải TÍNH bao nhiêu để dựng ra cái cảnh ấy lần đầu"*. Hai đại lượng ấy đi cùng
chiều suốt nhiều phase nên không ai để ý là chỉ có một nửa được canh — cho tới khi ADR-046 tách
chúng ra:

**ADR-046 thêm 0 tam giác, 0 lệnh vẽ, 0 nguồn sáng — mà +28 giây CPU.** Bảng "Sau «XOÁ CÁI BỆ»" ở
ngay trên nói đúng sự thật của nó (hình học không nhúc nhích một đơn vị), và nó vẫn bỏ lọt hoàn toàn
chuyện này.

### Con số

Đo bằng `tach.mjs` (bóc từng phần của việc dựng cảnh, 15 kỷ), ba cây mã chạy **TUẦN TỰ** trên cùng
một máy 4 nhân. ⚠️ Đo song song thì ba bên giành CPU của nhau và không con số nào so được với con số
nào — ba lượt đầu của phiên ấy đã phải bỏ đi vì đúng lý do này.

| phần (dựng lưới đủ 15 kỷ) | TRƯỚC ADR-046 (`dfd2b15`) | SAU ADR-046 (`19305ab`) | có bộ nhớ đệm (ADR-048) |
|---|---:|---:|---:|
| lưới chân trời | 33,52 giây | 66,41 giây | **20,18 giây** |
| lưới mặt đất | 2,26 giây | 3,02 giây | **1,30 giây** |
| `buildTerrain()` · `buildHorizon()` · vùng quê · 300 × `footprint` | ~0,05 giây | ~0,06 giây | ~0,04 giây |
| **`sceneStats.test.js` (triệu chứng nhìn thấy được)** | **564 giây** | **827 giây** | xem dòng cuối `npm test` |

Nguyên nhân gốc: ADR-046 cho `horizon.heightAt` gọi `terrain.nenKho(...)` ở **mỗi đỉnh** của lưới
chân trời — lưới lớn nhất cảnh — và mỗi lần lấy mẫu nhiễu tốn **4 lần băm FNV-1a trên một chuỗi ~20
ký tự**. Cái giá ấy vốn đã có sẵn từ lâu; ADR-046 chỉ làm nó lộ ra. Bản vá **nhớ lại giá trị nút
lưới** (ADR-048) không đổi một con số nào (đã chứng minh trùng từng byte ở cả 15 kỷ) và kéo xuống
dưới cả mốc trước ADR-046 — **nhanh hơn 1,66 lần**, vì phần dôi ra ấy chưa bao giờ được ai đặt lên cân.

### Vì sao chưa có cổng cho trục này, và vì sao nó KHÓ

Ghi thành `TECH_DEBT #70`. Chỗ khó không phải viết bài test mà là **chọn đại lượng**: thời gian phụ
thuộc máy, nên một mốc TUYỆT ĐỐI viết vào test sẽ hoặc kêu oan trên máy chậm, hoặc mù trên máy nhanh
— đúng bẫy Phase 7D ở dạng tệ nhất. Hai hướng đáng cân nhắc, cả hai đều là QUAN HỆ chứ không phải
mức: *(a)* tỉ số "lưới chân trời ÷ lưới mặt đất" đo trong CÙNG một lượt chạy (hôm nay là **15,5×**);
*(b)* đếm thẳng **số lần gọi `valueNoise`** — một phép đếm thì tất định, chạy được ở CI, và nó chính
là đại lượng sinh ra chi phí.

### Ba điều KHÔNG được suy ra từ bảng này

- ❌ **Không** suy ra được gì về frame time trên máy Đàm. Đây là chi phí DỰNG, chạy một lần lúc mở
  tab / đổi kỷ; nó không nằm trong bảng FPS và bảng FPS cũng không nằm trong nó.
- ❌ **Không** suy ra được số giây trên MacBook M3. Bộ số này đo trong hộp cát; phần mang ra ngoài
  được là phần **CẤU TRÚC** ("chi phí này nổ mỗi lần dựng lại cảnh"), không phải phần SỐ.
- ❌ **Không** đọc `sceneStats.test.js` 564 → 827 → ? như một thước đo tinh: nó chạy chung máy với
  mọi bài test khác, nên nó là một **triệu chứng** hữu ích chứ không phải một phép đo sạch.

---

## Khi nào phải đo lại

- Sau bất kỳ phase nào **thêm nguồn sáng, đổi shader, đổi bóng đổ, hoặc đổi DPR**.
- Sau bất kỳ phase nào làm **cỡ khung hình mặc định** đổi.
- Trước khi kết luận bất cứ điều gì về **iPhone**.
- **Không** cần đo lại chỉ vì thêm khối / thêm tam giác — trục đó đã chứng minh là rẻ, và từ
  2026-08-20 nó không còn là hạng mục cảnh báo (xem hai luật ở đầu file).
- ⚠️ **Mỗi phase PHẢI tự đo lại mốc nền của mình**, không được chép cột "sau" của phase trước làm
  cột "trước" của mình. Lý do và cái giá suýt phải trả: mục ❗ ở cuối phần Phase 11.
- ⚠️ **Sau bất kỳ phase nào đụng vào `terrain.js` / `horizon.js` / `noise.js` / `terrainMesh.js`,
  phải đo lại THỜI GIAN DỰNG CẢNH** — không chỉ tam giác và lệnh vẽ. ADR-046 chứng minh hai trục ấy
  có thể đi ngược nhau: 0 tam giác mới mà +28 giây CPU. Lệnh: `node --import
  ./scripts/register-esm-loader.mjs <scratchpad>/tach.mjs`, chạy TUẦN TỰ cho từng cây mã.

---

## Phase 13 §2 — MỐC NỀN CỦA HAI PHÉP ĐO «QUY MÔ» (M1) và (M2) (2026-08-21)

> Đo trên cây mã **`d72c033`**. Lệnh dựng: `node scripts/city-preview.mjs --era <N> --hour 12
> --sessions 80 --theme light --mask <a,b,c>` (3 lượt mặt nạ cho mỗi kỷ). Lệnh đếm:
> `node scripts/mask-count.mjs <ảnh> <tên-đỏ> <tên-lục> <tên-lam> [--bands 6]`.
>
> ⚠️ **VÌ SAO PHẢI ĐO LẠI TỪ ĐẦU.** Bộ số §2 đo trước đó **mất nguồn gốc**: giữa phiên, kho mã và
> toàn bộ thư mục nháp bị khôi phục về một ảnh chụp cũ hơn, nên không con số nào còn truy được về
> đúng cặp (công cụ, đầu vào) đã sinh ra nó. Đúng bài học `MAI-SAU-ky9.png`: *một con số không truy
> được về CÔNG CỤ và ĐẦU VÀO của nó thì bằng không*. Đo lại thì **plan-coverage khớp từng chữ số**
> (21,4 / 39,3 / 58,3% ở 20/50/80 phiên) và **frame-fit khớp từng dòng** (13/15 kỷ bị cắt, hệ số cần
> 1,88) ⇒ hai bộ ấy vẫn dùng được. Xem mục "một con số đã sửa" bên dưới.

### (M1) — % KHUNG HÌNH LÀ DẤU VẾT CON NGƯỜI

Dấu vết con người = `buildings` + `props` + `residents` + `road`. Trung bình 15 kỷ: **36,84%**
(thấp nhất kỷ 15 = 28,20 · cao nhất kỷ 8 = 44,63). Cột phụ *"khung hình là thành phố"*
(`buildings` + `props` + `residents`, không kể đường): **29,39%**. Đường riêng: **7,45%**.

| kỷ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (M1) % | 20,95 | 35,14 | 35,61 | 42,86 | 31,36 | 43,55 | 43,34 | **44,63** | 39,79 | 37,85 | 43,91 | 37,24 | 30,58 | 37,55 | **28,20** |

⚠️ **BẢNG NÀY IN RA TỔNG, VÀ TỔNG PHẢI RA ~100%.** Cộng đủ 9 lớp (`buildings` · `props` ·
`residents` · `road` · `ground-grid` · `ground-apron` · `landscape` · `water` · `horizon`) ra
**100,98 – 101,65%** ở cả 15 kỷ. Phần dôi ~1% là **viền răng cưa bị đếm ở CẢ HAI lượt** (chỗ giáp
ranh giữa hai lớp là màu pha; ở lượt A nó đỏ-nhạt của lớp A, ở lượt B nó đỏ-nhạt của lớp B). Đó là
một sai số đo được và có trần ⇒ **lệch quá 3% mới là bảng hỏng**. Bản gộp đầu tiên của phiên này ra
89–98% và nguyên nhân hoá ra tầm thường: **tôi quên mất lớp `road`** — nếu không có luật "phải in
tổng và đòi 100%" thì bảng ấy đã đi thẳng vào báo cáo.

### (M2) — SỐ TẦNG CHIỀU SÂU CÓ DẤU VẾT CON NGƯỜI: **PHÉP ĐO NÀY KHÔNG CÓ RĂNG**

`scripts/mask-count.mjs --bands 6` chia khung hình thành 6 dải ngang (dải 1 = trên cùng = XA nhất),
mỗi ô là % **của riêng dải ấy**. Trung bình 15 kỷ:

| dải | 1 (xa) | 2 | 3 | 4 | 5 | 6 (gần) |
|---|---|---|---|---|---|---|
| % dấu vết con người | **0,41** | 21,37 | 60,96 | 60,31 | 47,49 | 30,36 |

| mức sàn thử | 0,5% | 1% | 2% | 3% | 5% | 8% | 10% | 15% | 20% |
|---|---|---|---|---|---|---|---|---|---|
| số dải đạt (TB 15 kỷ) | 5,3 | 5,2 | 5,0 | 5,0 | 5,0 | 4,9 | 4,9 | 4,7 | 4,3 |
| số kỷ đạt ≥3 dải | 15/15 | 15/15 | **15/15** | 15/15 | 15/15 | 15/15 | 15/15 | 15/15 | 15/15 |

⚠️ **MỤC TIÊU «≥3 DẢI Ở ≥12/15 KỶ» ĐÃ ĐẠT SẴN Ở MỌI MỨC SÀN TỪ 0,5% TỚI 20%, TRƯỚC KHI LÀM GÌ CẢ.**
Không tồn tại mức sàn nào cho ra "đúng 1 dải" như giả định ban đầu. Nguyên nhân: mẫu số là diện tích
của chính dải ấy, mà tấm đất thành phố phủ gần hết 5/6 dải ⇒ (M2) đang đo *"thành phố có lấp đầy
giữa khung hình không"* (đã đúng sẵn), không đo *"dấu vết con người có vươn ra XA không"*. Chi tiết
và phương án thay thế: `TECH_DEBT #72`.

⚠️ **NHƯNG HỒ SƠ 6 DẢI VẪN ĐÁNG GIỮ — ĐỂ BÁO CÁO HÌNH DẠNG, KHÔNG ĐỂ LÀM CỔNG.** Nó là một cái
BƯỚU: 0,41 → 21,37 → **60,96** → 60,31 → 47,49 → 30,36. Dấu vết con người mất hẳn ở **cả hai** đầu
chiều sâu. Đó chính là "một hòn đảo giữa một tấm đất trống", và nó đọc được từ số.

### DẢI TRÊN MÀN HÌNH CÓ THẬT SỰ LÀ CHIỀU SÂU THẾ GIỚI KHÔNG — ĐÃ ĐO, KHÔNG SUY

> ⚠️ **BỘ SỐ TRONG BẢNG NGAY DƯỚI ĐÂY ĐÃ BỊ THAY THẾ (2026-08-21).** Nó do một script nháp sinh ra
> trước khi `countBands` vào `mask-count.mjs`, và không tái lập được ở bất kỳ mốc phiên nào. Bộ số
> hiện hành nằm ở mục "Phase 13 VIỆC B §1" cuối file. **Kết luận định tính thì không đổi.**

⚠️ Đây là cái bẫy lớn nhất của (M2), và nó **không** được kiểm bằng cách vặn một cái núm khác (bẫy
đã cắn ở Phase 4C/4G/7B). Phép kiểm dùng hai vật thể mà **chiều sâu thế giới đã biết từ mã**:
`horizon` (`buildHorizon(era).reach = 36,00` — xa nhất cảnh) và `ground-grid` (nửa rộng 6 — ở giữa).

| kỷ | lớp | dải 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| 8 | `horizon` (xa 36) | **69,98** | 17,55 | 0,01 | **0,00** | **0,00** | **0,00** |
| 8 | `ground-grid` (giữa) | **0,00** | 6,70 | 9,75 | 18,89 | **22,47** | 15,08 |
| 15 | `horizon` | 32,93 | **46,52** | 27,86 | 2,35 | 0,00 | 2,53 |
| 15 | `ground-grid` | **0,00** | 0,00 | 0,52 | 12,42 | 13,26 | **19,08** |

⇒ Vật xa nhất chiếm 70% dải 1 rồi **về đúng 0** ở nửa gần; lưới phố **đúng 0** ở dải 1 rồi lên đỉnh
ở dải 5–6. Quan hệ dải ↔ chiều sâu là **đơn điệu**, đã đo trên ảnh render thật. ⚠️ Kỷ 15 còn 2,53%
`horizon` ở dải 6 (so với đỉnh 46,52) — một ngoại lệ nhỏ đã ghi ra, không được lặng lẽ bỏ qua.
⚠️ Và quan hệ ấy **đơn điệu chứ KHÔNG tuyến tính** (camera ngẩng 34,4°, mặt đất có cao độ), nên con
số (M2) chỉ được đọc là *"có mặt ở mấy tầng"*, tuyệt đối **không** được đọc là *"trải xa bao nhiêu ô"*.

### MỘT CON SỐ ĐÃ SỬA: DẤU VẾT CON NGƯỜI NGOÀI LƯỚI = **0/446**

Đếm thuần trên engine, gộp 15 kỷ ở `sessionCount: 400`: công trình + nhà dân + giàn giáo + ô đường
= **446 vật, KHÔNG một vật nào nằm ngoài lưới 12×12**. Vật xa tâm nhất cách 5,5 ô, trong khi mép
tấm đất ở **9,5 ô**. Đây là mốc nền của phép đo thay thế đề xuất ở `TECH_DEBT #72`.

### VÀ MỘT CON SỐ CŨ ĐÃ TỪNG BỊ TÔI BÁO SAI RỒI TỰ SỬA LẠI

Trong lúc dựng lại các công cụ nháp đã mất, `the-gioi.mjs` cho ra *"tấm đất cạnh 20,00 ô, 64,0% nằm
ngoài lưới"* và tôi suýt ghi con số ấy vào báo cáo như một **đính chính** cho con số cũ (19,00 ô /
60,1%). Sự thật ngược lại: **19,00 / 361 / 60,1% mới đúng**, và công cụ vừa dựng lại mới là thứ sai
— nó chép lại công thức `u0 = -0,5 - padSteps × du`, tức **một lỗi mà mã sản phẩm đã sửa xong từ
lâu**, với lời giải thích nằm ngay trong 8 dòng chú thích phía trên (`terrainMesh.js:312-318`).
⇒ **Dựng lại một công cụ từ trí nhớ là dựng lại cả những phiên bản SAI của nó.** Cách chặn rẻ nhất
và nay đã cắm vào chính công cụ đó: **một phép đối chiếu chéo bắt buộc** — cùng một đại lượng phải
suy được bằng hai đường (`terrainSurfaceReach()` đo từ tâm ↔ lưới đỉnh dựng từ `u0`/`steps`), và
`throw` nếu hai đường lệch nhau. Nếu chỉ có một đường thì không có gì để cãi nhau, tức không có gì
để phát hiện.

---

## Phase 13 VIỆC B §1 — DẢI NÀO ĐƯỢC LÀM CỔNG (G2): SÁU CON SỐ, VÀ HAI DẢI BỊ LOẠI (2026-08-21)

Chỉ thị bắt buộc đo **trước** khi chọn ngưỡng (G2): *"đo tỉ lệ `ground-apron` + `ground-grid` trong
từng dải, in đủ 6 con số, xác định dải xa nhất mà tấm đất còn chiếm tỉ lệ đáng kể, và đặt cổng ở
dải ĐÓ."* Lý do có chỉ thị ấy: dải 1 trông như chỗ trống lớn nhất, nhưng nếu nó không có ĐẤT thì
đặt cổng ở đó là tạo một cổng chỉ đạt được bằng cách **dựng nhà trên sườn núi chân trời**.

Lệnh đo (cùng một công cụ cho mọi cột, `--sessions 80 --hour 12 --theme light`):

```
node scripts/mask-count.mjs .city-preview/city-eraNN-light-h12-s80-mask-ground_grid_ground_apron_horizon.png \
     ground-grid ground-apron horizon --bands 6
node scripts/mask-count.mjs .city-preview/city-eraNN-light-h12-s80-mask-city_road_residents.png \
     city road residents --bands 6
```

### SÁU CON SỐ — trung bình 15 kỷ, % của RIÊNG dải ấy (dải 1 = XA nhất / trên cùng khung)

| dải | tấm đất = grid+apron | `ground-grid` | `ground-apron` | chân trời | dấu vết con người |
|---|---|---|---|---|---|
| **1 (xa nhất)** | **0,62** | **0,00** | 0,62 | **98,95** | 0,31 |
| **2** | **15,03** | 2,95 | 12,08 | 68,06 | 17,70 |
| 3 | 24,47 | 10,56 | 13,92 | 18,93 | 58,05 |
| 4 | 41,70 | 27,83 | 13,87 | 1,00 | 59,10 |
| 5 | 56,77 | 23,38 | 33,39 | 0,00 | 44,53 |
| 6 (gần nhất) | 71,91 | 17,64 | 54,28 | 0,22 | 28,65 |

Trải từng kỷ của cột "tấm đất" ở bốn dải xa nhất:

| kỷ | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| 1 | 0,04 | 23,35 | 52,89 | 79,14 |
| 2 | 4,18 | 41,41 | 36,92 | 43,82 |
| 3 | 2,29 | 31,75 | 34,61 | 43,19 |
| 4 | 0,50 | 15,60 | 24,07 | 32,36 |
| 5 | 0,00 | **1,17** | 22,14 | 66,66 |
| 6 | 1,88 | 26,67 | 27,26 | 26,94 |
| 7 | 0,00 | 5,61 | **10,97** | 34,43 |
| 8 | 0,00 | 7,98 | 25,03 | 41,38 |
| 9 | 0,11 | 14,45 | 20,77 | 22,41 |
| 10 | 0,00 | 6,91 | 16,53 | 43,60 |
| 11 | 0,22 | 16,15 | 23,29 | 40,42 |
| 12 | 0,13 | 20,51 | 29,02 | 37,31 |
| 13 | 0,00 | 4,32 | 14,28 | 43,11 |
| 14 | 0,00 | 6,78 | 17,38 | 34,74 |
| 15 | 0,00 | **2,83** | 11,93 | 35,93 |

### KẾT LUẬN: CỔNG (G2) ĐẶT Ở **DẢI 2**

- **Dải 1 — LOẠI.** 13/15 kỷ có `ground-grid` đúng **0,00** và tấm đất trung bình **0,62%**, trong
  khi chân trời chiếm **98,95%**. Đây không phải "chỗ trống": đây là **núi và trời**. Cái bẫy mà chỉ
  thị cảnh báo là có thật và đã được xác nhận bằng số.
- **Dải 3 — LOẠI, nhưng vì lý do NGƯỢC LẠI.** Nó có thừa đất (24,47%) nhưng dấu vết con người đã
  **58,05%** — tức đã ở gần đỉnh bướu (59,10 ở dải 4). Một cổng đặt ở chỗ đã bão hoà thì không đo
  được gì; nó xanh sẵn trước khi làm gì cả, đúng cái phễu đã hạ bệ (M2) (`TECH_DEBT #72`).
- **Dải 2 — CHỌN.** Đây là dải **xa nhất còn chứa tấm đất**: 15,03% trung bình, và **15/15 kỷ đều
  khác 0**. Dấu vết con người ở đó mới **17,70%**, tức còn nguyên chỗ để tăng. Nó cũng đúng là **vai
  xa của cái bướu** — chỗ hồ sơ chiều sâu tụt từ 58,05 xuống 17,70 rồi chết hẳn.

### ⚠️ DẢI 2 CÓ BA KỶ MỎNG, VÀ ĐÓ LÀ LÝ DO CỔNG PHẢI LÀ MỘT **QUAN HỆ**

Kỷ 5 (1,17%), kỷ 15 (2,83%), kỷ 13 (4,32%) gần như không có đất ở dải 2 — chúng là kỷ có chân trời
cao nhất bảng (75,94 · 84,38 · 90,33). Một **sàn tuyệt đối** đặt ở dải 2 sẽ **không thể đạt** ở ba
kỷ ấy dù có xây kín từng điểm ảnh đất còn lại. Đây đúng bẫy Phase 7D (*"một con số tuyệt đối không
diễn đạt được một luật nói về QUAN HỆ"*), và cách vá là **chuẩn hoá theo phần đất thật sự có**, chứ
không phải nới sàn cho vừa kỷ tệ nhất (nới là bỏ răng cho 12 kỷ còn lại).

### ⚠️ VÀ MỘT CON SỐ ĐÃ HỎNG: DẢI TRÊN MÀN HÌNH KHÔNG TÁCH ĐƯỢC "XA" KHỎI "CAO"

Phép chuẩn hoá đầu tiên tôi thử — *"phần đất xa nhìn thấy được đã có dấu vết người chưa"*, mẫu số =
`đất + người` trong dải 2 — cho ra **58,39%** trung bình, kỷ 5 tới **95,25%**. Đọc vội thì nó nói
*"dải 2 đã gần kín dấu vết người rồi, chẳng còn gì để làm"*. Sai, và sai vì một lý do cấu tạo:
**dải màn hình là hàng điểm ảnh, không phải chiều sâu thế giới.** Với MẶT ĐẤT thì hai thứ ấy đi
cùng nhau (đã đo, xem mục "DẢI TRÊN MÀN HÌNH CÓ THẬT SỰ LÀ CHIỀU SÂU THẾ GIỚI KHÔNG"), nhưng với
vật thể **CAO** thì không: nóc nhà của chính đô thị ở tiền cảnh vẫn chiếm hàng điểm ảnh trên cao.
Nên phần lớn 17,70% "dấu vết người ở dải 2" hôm nay là **đường bờ mái của chính đô thị in lên nền
núi**, không phải thứ gì ở xa.

⇒ Hệ quả bắt buộc cho phần dựng: vùng phụ cận phải có **lớp mặt nạ RIÊNG** (`hinterland`) để đếm
tách khỏi `city`. Không tách thì một con số tăng lên không phân biệt được *"đã vươn ra xa"* với
*"đô thị vừa cao thêm"* — đúng hình dạng `TECH_DEBT #22` (một phép đo gộp hai thứ rồi bị đọc thành
một thứ).

### ⚠️ ĐÍNH CHÍNH — BẢNG "DẢI TRÊN MÀN HÌNH…" Ở MỤC TRƯỚC KHÔNG TÁI LẬP ĐƯỢC

Bảng ấy ghi kỷ 8 `horizon` dải 1 = **69,98** và `ground-grid` dải 2 = **6,70**. Đo lại bằng công cụ
đã commit (`mask-count.mjs --bands`, có `scripts/maskCount.test.js` khoá số học chia dải) trên
**cả ba** mốc phiên s20/s50/s80 đều ra `horizon` dải 1 = **100,00** và `ground-grid` dải 2 =
**1,50 / 1,15 / 0,69**. Không mốc nào tái lập được bộ số cũ.

Nguyên nhân truy được tới đâu thì ghi tới đó: bộ số cũ do một **script nháp** trong thư mục tạm sinh
ra **trước khi** `countBands` được đưa vào `mask-count.mjs`; script ấy đã mất cùng lượt khôi phục
snapshot và **không được dựng lại từ trí nhớ** (đúng luật §6). Đây chính là *"hai công cụ đếm cùng
một thứ = một luật hai công thức"* — cặp công-cụ-dựng ↔ công-cụ-đo đã nói dối vì đúng chuyện này ở
Phase 4G. **Bộ số hiện hành là bộ đo bằng công cụ đã commit và đã có test; bảng cũ bị thay thế.**
Kết luận ĐỊNH TÍNH của bảng cũ (chân trời dồn về dải xa, `ground-grid` dồn về dải gần, và trục dải
↔ chiều sâu là đơn điệu với mặt đất) **vẫn đứng vững** — nó còn mạnh hơn ở bộ số mới.

## Phase 13 VIỆC B — VÙNG PHỤ CẬN: BA CỔNG (G1)(G2)(G3), TRƯỚC ↔ SAU (2026-08-21, ADR-049)

Cặp mốc: **TRƯỚC = `e455114`** (bảng + tầng hình học đã có, **chưa nối vào cảnh**) ↔ **SAU = `8bc80ab`**
(đã nối). Chọn `e455114` chứ không phải `d72c033` có chủ đích: hai cây mã chỉ khác nhau ĐÚNG một
vòng lặp đọc trong `sceneGraph.js`, nên mọi chênh lệch dưới đây quy được về đúng một nguyên nhân.

Mọi ảnh dựng bằng **cùng một dòng lệnh** ở cả hai cây:

```
node scripts/city-preview.mjs --era N --hour 12 --sessions 80 --theme light --mask "<bộ lớp>"
node scripts/mask-count.mjs   <ảnh mặt nạ> <tên lớp…> --bands 6
```

⚠️ **Bộ ảnh của cả hai cây đã kiểm mốc thời gian trước khi trích số** (TRƯỚC 16:22–16:44 · SAU
16:24–16:39, cùng ngày) — xem mục "MỘT CÁI CỔNG CACHE…" bên dưới, vì đúng phiên này đã bị một bộ
ảnh cũ nói dối một lần.

### (G3) / (M1) — DẤU VẾT CON NGƯỜI TRÊN CẢ KHUNG HÌNH

Định nghĩa (M1) giữ nguyên như mốc nền §2: `buildings + props + residents + road`, cộng thêm
`hinterland` ở bản SAU. **Cây cối KHÔNG tính** — `humanTrace.js` xếp chúng vào thiên nhiên, và cả
phase này sinh ra vì lý do đó.

| kỷ | (M1) TRƯỚC | (M1) SAU | Δ | dải 2 TRƯỚC | dải 2 SAU | Δ | vùng phụ cận (% khung) |
|---|---|---|---|---|---|---|---|
| 1 | 21,77 | 22,02 | **+0,25** | 14,62 | 15,66 | **+1,04** | 0,25 |
| 2 | 35,46 | 44,00 | **+8,54** | 19,58 | 42,46 | **+22,88** | 8,54 |
| 3 | 35,90 | 42,93 | **+7,03** | 15,29 | 33,92 | **+18,63** | 7,03 |
| 4 | 43,17 | 45,95 | **+2,78** | 34,18 | 39,53 | **+5,35** | 2,78 |
| 5 | 31,55 | 33,65 | **+2,10** | 38,43 | 44,01 | **+5,58** | 2,10 |
| 6 | 43,69 | 52,02 | **+8,33** | 27,49 | 45,81 | **+18,32** | 8,33 |
| 7 | 43,69 | 50,16 | **+6,47** | 31,03 | 48,25 | **+17,22** | 6,47 |
| 8 | 44,99 | 49,75 | **+4,76** | 25,00 | 39,56 | **+14,56** | 4,76 |
| 9 | 40,16 | 48,29 | **+8,13** | 18,78 | 40,99 | **+22,21** | 8,13 |
| 10 | 38,22 | 43,36 | **+5,14** | 18,64 | 37,68 | **+19,04** | 5,14 |
| 11 | 44,27 | 46,65 | **+2,38** | 31,90 | 40,95 | **+9,05** | 2,38 |
| 12 | 37,57 | 39,58 | **+2,01** | 12,21 | 17,41 | **+5,20** | 2,01 |
| 13 | 30,99 | 32,87 | **+1,88** | 6,32 | 10,41 | **+4,09** | 1,88 |
| 14 | 37,83 | 39,86 | **+2,03** | 17,45 | 21,75 | **+4,30** | 2,03 |
| 15 | 28,48 | 30,31 | **+1,83** | 12,52 | 13,69 | **+1,17** | 1,83 |
| **TB** | **37,18** | **41,43** | **+4,24** | **21,56** | **32,81** | **+11,24** | **4,24** |

**(G3) ĐẠT**: tăng ở **15/15 kỷ**, trung bình 37,18 → **41,43** (+4,24 điểm phần trăm).

⚠️ **VÀ CỘT CUỐI CHÍNH LÀ ĐỐI CHỨNG MẠNH NHẤT CỦA CẢ BẢNG.** Δ của (M1) **bằng ĐÚNG** tỉ lệ điểm
ảnh của riêng lớp `hinterland`, tới hai chữ số thập phân, ở **cả 15 kỷ**. Nghĩa là toàn bộ phần
tăng đến từ chính vùng phụ cận và **không một điểm ảnh nào khác trong khung hình dịch chuyển** —
ADR-007 ("bảo tàng bất động") được xác nhận ở tầng điểm ảnh chứ không phải chỉ ở tầng lý lẽ. Nếu
vùng phụ cận có lỡ đụng vào toạ độ trong lưới thì hai cột này **không thể** bằng nhau.

Kiểm TỔNG mọi lớp trên cả khung (luật bắt buộc): TRƯỚC **101,84–102,62%** · SAU **101,91–102,97%**
— phần dôi 1–3% là viền răng cưa bị đếm ở hai lượt, đúng dung sai đã ghi.

### (G2) — HỒ SƠ CHIỀU SÂU: SÁU CON SỐ MẶT ĐẤT BẮT BUỘC, VÀ DẢI 2 LÀ CỔNG

Chỉ thị đòi in **đủ sáu** con số `ground-apron + ground-grid` từng dải trước khi chọn cổng. Đây là
bảng đầy đủ (trung bình 15 kỷ, **% của RIÊNG dải ấy**, dải 1 = XA nhất / trên cùng khung):

| lớp | dải 1 | dải 2 | dải 3 | dải 4 | dải 5 | dải 6 |
|---|---|---|---|---|---|---|
| `ground-grid` TRƯỚC/SAU | 0,00 / 0,00 | 3,66 / 3,66 | 11,72 / 11,72 | 30,06 / 30,06 | 25,05 / 25,05 | 21,02 / 21,02 |
| `ground-apron` TRƯỚC/SAU | 2,01 / 1,28 | 16,00 / 12,51 | 14,52 / 13,39 | 7,33 / 7,31 | 19,19 / 18,61 | 33,24 / 29,84 |
| **TẤM ĐẤT TRƯỚC** | **2,02** | **19,67** | **26,24** | **37,39** | **44,24** | **54,26** |
| **TẤM ĐẤT SAU** | **1,29** | **16,18** | **25,11** | **37,37** | **43,66** | **50,86** |
| `horizon` TRƯỚC/SAU | 67,27 / 61,72 | 28,13 / 22,12 | 3,48 / 3,17 | 0,16 / 0,16 | 0,00 / 0,00 | 0,17 / 0,15 |
| `water` TRƯỚC/SAU | 19,93 / 19,37 | 12,64 / 12,23 | 4,17 / 4,01 | 0,06 / 0,06 | 0,12 / 0,09 | 0,60 / 0,53 |
| `landscape` TRƯỚC/SAU | 11,63 / 11,15 | 21,14 / 20,23 | 7,38 / 7,23 | 3,75 / 3,75 | 9,67 / 9,62 | 16,02 / 15,78 |
| `hinterland` SAU | **7,94** | **11,24** | 1,83 | 0,02 | 0,69 | 3,74 |
| **DẤU VẾT NGƯỜI TRƯỚC** | **0,41** | **21,56** | **61,32** | **61,04** | **47,93** | **30,72** |
| **DẤU VẾT NGƯỜI SAU** | **8,35** | **32,81** | **63,15** | **61,06** | **48,62** | **34,46** |
| TỔNG mọi lớp TRƯỚC | 101,26 | 103,15 | 102,59 | 102,39 | 101,96 | 101,77 |
| TỔNG mọi lớp SAU | 101,88 | 103,56 | 102,68 | 102,39 | 101,99 | 101,78 |

**Cổng (G2) đặt ở DẢI 2 — ĐẠT.** Dải 2 đi **21,56 → 32,81** (+11,24), tăng ở **15/15 kỷ**
(+1,04 kỷ 1 … +22,88 kỷ 2).

Bướu đã bẹt đi, đo bằng hai tỉ số:

| | TRƯỚC | SAU |
|---|---|---|
| đỉnh bướu ÷ dải 2 | 61,32 / 21,56 = **2,84** | 63,15 / 32,81 = **1,92** |
| đỉnh bướu ÷ dải 1 | 61,32 / 0,41 = **149,6** | 63,15 / 8,35 = **7,6** |

Vì sao dải 2 là dải đúng, đọc thẳng từ bảng: **dải 1 chỉ có 2,02% mặt đất** (phần còn lại là chân
trời 67,27 + mặt nước 19,93 + cây 11,63) ⇒ một cổng đặt ở đó chỉ đạt được bằng cách **dựng nhà trên
sườn núi chân trời**, đúng cái bẫy chỉ thị đã cảnh báo. **Dải 3 thì ngược lại**: thừa đất (26,24)
nhưng dấu vết người đã **61,32%** — sát đỉnh bướu, tức xanh sẵn trước khi làm gì cả, đúng cái phễu
đã hạ bệ (M2) (`TECH_DEBT #72`). Dải 2 là **dải xa nhất còn có tấm đất thật** (19,67%) mà dấu vết
người mới 21,56% — còn nguyên chỗ để tăng.

⚠️ Ba dòng cuối bảng là **phép cộng bắt buộc**. Năm trong sáu dải nằm trong dung sai 3%; **dải 2 dôi
3,15% (TRƯỚC) và 3,56% (SAU)** — hơi quá dung sai, và cơ chế thì rõ: dải 2 là dải có **nhiều đường
bao nhất** (đường bờ mái của đô thị cắt lên nền núi, cộng tán cây), mà mỗi đường bao là một hàng
điểm ảnh pha bị đếm ở hai lượt. SAU dôi hơn TRƯỚC đúng 0,41 điểm — bằng việc vùng phụ cận thêm
đường bao vào chính dải ấy. Ghi ra thay vì làm tròn cho đẹp: dung sai 3% hiệu chuẩn cho **cả khung**
(nơi phép kiểm này ĐẠT: 101,84–102,97%), chưa từng hiệu chuẩn cho **từng dải**.

⚠️ **VÀ ĐỌC HÀNG `ground-grid`: NÓ ĐỨNG YÊN TỚI TỪNG PHẦN TRĂM Ở CẢ SÁU DẢI.** Cùng với
`buildings` · `props` · `residents` · `road` cũng đứng yên y hệt ở cả sáu dải, đây là bằng chứng thứ
hai (độc lập với cột Δ ở trên) rằng vùng phụ cận **không chạm vào bất cứ thứ gì trong lưới**. Thứ
duy nhất giảm là những lớp mà nó **che khuất**: chân trời, vành đất ngoài lưới, cây, mặt nước — và
tổng phần giảm ở dải 1 (−7,32) khớp với phần vùng phụ cận chiếm được (+7,94) trong sai số răng cưa.

### (G1) — DẤU VẾT CON NGƯỜI **NGOÀI LƯỚI**: MỐC NỀN LÀ 0,00 TUYỆT ĐỐI

Chỉ thị đòi đếm bằng **CẢ HAI đơn vị**. Mốc nền của cả hai: **0** (đã đo ở §2 — 0/446 vật, 0,00%).

**Đơn vị 1 — SỐ VẬT THỂ** (`node --import ./scripts/register-esm-loader.mjs scripts/plan-coverage.mjs --dau-chan`,
thuần engine, không cần trình duyệt):

| kỷ | vật ngoài lưới / tổng vật người | diện tích (ô²) | xa nhất (ô) | loại nhiều nhất |
|---|---|---|---|---|
| 1 | **27** / 57 | 6,9 | 7,70 | roadway×16 hamlet×6 quarry×2 huntingCamp×2 |
| 2 | 251 / 291 | 187,2 | 8,00 | rampart×104 parcel×88 waterwork×26 roadway×16 |
| 3 | 210 / 252 | 149,3 | 8,00 | rampart×79 parcel×76 waterwork×28 roadway×16 |
| 4 | 229 / 274 | 152,8 | 7,90 | rampart×104 parcel×72 waterwork×24 roadway×16 |
| 5 | 94 / 135 | 47,6 | 8,00 | waterwork×28 rampart×20 parcel×17 roadway×14 |
| 6 | 239 / 280 | 377,1 | 8,00 | parcel×96 rampart×78 waterwork×32 roadway×14 |
| 7 | 216 / 258 | 160,6 | 8,00 | parcel×84 rampart×74 waterwork×28 roadway×16 |
| 8 | 171 / 215 | 97,1 | 8,00 | rampart×74 parcel×43 waterwork×32 roadway×9 |
| 9 | 221 / 263 | 165,0 | 8,00 | rampart×79 parcel×78 waterwork×26 roadway×16 |
| 10 | 135 / 180 | 118,7 | 8,00 | parcel×64 waterwork×32 roadway×15 hamlet×12 |
| 11 | 104 / 146 | 69,6 | 8,00 | waterwork×32 parcel×30 hamlet×13 roadway×11 |
| 12 | 177 / 218 | 97,1 | 8,00 | rampart×74 parcel×44 waterwork×32 roadway×12 |
| 13 | 62 / 101 | 24,6 | 7,90 | waterwork×22 roadway×16 hamlet×12 railway×8 |
| 14 | 65 / 115 | 26,7 | 7,90 | waterwork×20 roadway×16 hamlet×10 elevatedRoad×8 |
| 15 | **40** / 82 | 17,3 | 7,70 | roadway×16 hamlet×11 elevatedRoad×8 crane×2 |
| **TỔNG** | **2241** | **1697,6 ô²** | | trung bình **149,4 vật/kỷ** |

**Kỷ 1 (27 vật) và kỷ 15 (40 vật) là hai kỷ THƯA NHẤT bảng** — đúng như chỉ thị đòi: đó là hai ca
nghiệm thu, và nếu bảng làm chúng trông như mười ba kỷ kia thì bảng sai chứ không phải cổng sai.
Săn bắt hái lượm không có ruộng có đê; Dubai không có thành luỹ.

**Đơn vị 2 — TỈ LỆ ĐIỂM ẢNH + TƯƠNG PHẢN.** Lớp mặt nạ riêng `hinterland` cho tỉ lệ diện tích; tương
phản đo bằng `sweep-diff.mjs --frame --chi <mặt nạ>:<kênh>` giữa hai bản dựng, **chỉ trong vùng phụ
cận** (đo trên cả khung sẽ pha loãng ~25 lần — đúng hình dạng `TECH_DEBT #22`):

| kỷ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | TB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| % khung | 0,25 | 8,49 | 7,00 | 2,76 | 2,09 | 8,28 | 6,44 | 4,74 | 8,10 | 5,13 | 2,37 | 2,00 | 1,87 | 2,02 | 1,82 | **4,22** |
| tương phản /255 | 61,7 | 93,0 | 86,0 | 74,4 | 62,2 | 79,0 | 84,0 | 67,3 | 87,6 | 74,5 | 77,6 | 69,4 | **44,7** | 61,7 | 46,9 | **71,3** |

**(G1) ĐẠT, và đạt rộng**: yêu cầu là ≥ 8/15 kỷ có cụm đọc ra được (tương phản ≥ ngưỡng mắt 12);
đo được **15/15**, kỷ yếu nhất (13) vẫn **3,7 lần** ngưỡng.

**SÀN TOÀN CỤC — chốt SAU khi đo, ghi ra để phase sau còn đối chiếu:**
- diện tích trung bình 15 kỷ **≥ 3,0%** khung hình — đo được **4,22%**;
- **≥ 12/15 kỷ** có tương phản ≥ 12 — đo được **15/15**;
- **≥ 8/15 kỷ** có diện tích ≥ 2,0% — đo được **12/15**.

⚠️ **HAI MẶT NẠ ĐỘC LẬP ĐÃ ĐƯỢC ĐẶT CẠNH NHAU, VÀ CHÚNG KHỚP.** Cùng một vùng có thể hỏi bằng hai
ảnh mặt nạ khác nhau — `hinterland,buildings,props` (kênh đỏ) và `road,hinterland,landscape` (kênh
lục). Chênh lệch tương phản giữa hai đường đo: **lớn nhất 1,96 · trung bình 1,07**, tức **16% của
ngưỡng mắt** — không đủ để đổi một kết luận nào. Và chênh lệch ấy **có dấu hệ thống**: mặt nạ B
luôn đọc CAO hơn và chọn ÍT điểm ảnh hơn ở cả 15 kỷ, đúng như phải thế — hàng xóm của nó (`road`,
`landscape`) ăn mất viền răng cưa, mà viền răng cưa là chỗ đổi ÍT nhất (nửa nền, nửa vật). Một cơ
chế giải thích được, không phải nhiễu. Nếu chỉ có MỘT phép đo thì không có gì để cãi nhau, tức
không có gì để phát hiện.

### CỔNG CPU DỰNG CẢNH — 1,067× (TRẦN 1,25×) ✓

`npm run test:cross`, ba lượt mỗi bên, **chạy nối tiếp, không chồng lấn** (luật `ADR-048(c)`):

| | lượt 1 | lượt 2 | lượt 3 | trung vị |
|---|---|---|---|---|
| `main` (`d72c033`) | 21,0 s | 22,3 s | 21,0 s | **21,0 s** |
| HEAD (vùng phụ cận) | 22,5 s | 22,4 s | 22,1 s | **22,4 s** |

**Tỉ số 22,4 / 21,0 = 1,067×** — dưới xa trần 1,25×.

⚠️ **CỔNG NÀY CANH MỘT TRỤC KHÁC VỚI FPS, VÀ ĐÓ LÀ LÝ DO NÓ KHÔNG ĐƯỢC NỚI.** Chỉ thị §0 nói *"không
quan trọng hiệu năng"*, và câu đó đúng **cho FPS trên M3** (còn dư 3,2 lần, hình học gần như miễn
phí). Nó **KHÔNG** áp cho trục này: thời gian **DỰNG CẢNH** là chi phí CPU một lần mỗi lần đổi kỷ —
nó không xuất hiện trong bảng FPS, nó xuất hiện ở **độ trễ lúc Đàm bấm sang kỷ khác**, và
`ADR-048` đã bắt được một hồi quy +28 giây mà build/lint/960 bài test đều xanh. Hai trục, hai ngân
sách; giữ nguyên 1,25×.

### CÁC CỔNG CÒN LẠI

- **Chống trôi bản quét**: **15/15** cặp chặng (gần nhất **15,45**) · **105/105** cặp kỷ (gần nhất
  **22,08** · trung vị **39,34**) · «✓ TOÀN BỘ 90 Ô PHÂN BIỆT ĐƯỢC». Đối chứng tự-kiểm của chính
  công cụ kêu ở 4/15 hàng khi lấy mẫu lệch 104px — cổng còn răng.
- **Không thêm nguồn sáng · không hạ DPR · không thêm lượt vẽ toàn màn hình**: giữ nguyên.
- `npm run test:fast`: **1016 bài · 1015 pass · 0 fail · 1 skipped** · `npm run test:cross`: 3 pass,
  0 fail · `npm run lint` sạch · `npm run build` xanh (54 mục precache, 1837,58 KiB).

### §5(b) — DẢI 6 (ĐẦU GẦN) KHÔNG ĐÁNG SỬA, GHI LẠI ĐỂ KHỎI ĐI LẠI

Dải 6 là dải **gần nhất**, và dấu vết người ở đó chỉ **30,72 → 34,46%** — thấp hơn cả dải 2 sau khi
vá. Đây **không** phải khuyết tật của nội dung: nó là hệ quả trực tiếp của **góc ngẩng camera**
(mép dưới khung hình rơi vào vành đất trống ngay trước chân đô thị). Mọi cách chữa đều phải đụng
khung hình — tức đụng `ADR-034`/`ADR-035` và cả bộ số đã hiệu chuẩn theo chúng.
**Review Trigger: *"nếu có phase lật quyết định góc ngẩng camera"*.** Trước đó thì đừng đụng.

### ⚠️ MỘT CÁI CỔNG CACHE «CÓ FILE RỒI THÌ BỎ QUA» ĐÃ LÀM BẢNG SỐ ĐẦU TIÊN CỦA PHIÊN NÀY THÀNH RÁC

Script dựng ảnh có một dòng trông vô hại: `[ -f "$png" ] || node scripts/city-preview.mjs …`. Nó
tiết kiệm thật — và nó biến **tên file thành bằng chứng về nội dung file**, đúng quả mìn
`MAI-SAU-ky9.png` (Phase 11). Lượt so ảnh đầu tiên báo **kỷ 1 đổi 74,2% khung hình, lệch trung bình
61,82** — bất khả thi khi vùng phụ cận của kỷ ấy chỉ chiếm **0,25%** khung. Soi mốc thời gian thì
ảnh "SAU" của kỷ 1 đề ngày **08-19**, tức hai ngày trước; kỷ 6 và kỷ 7 cũng cũ. Xoá sạch rồi dựng
lại **cả 15 kỷ** (không chỉ ba kỷ hỏng — một bộ ảnh nhiều mốc thời gian chính là cái bẫy *"một phép
đo trải trên nhiều trạng thái mã"*, 2026-08-18) thì kỷ 1 ra **0,30% / 0,18**.

⇒ **Ba luật**: **(a)** thứ lộ ra sự thật KHÔNG phải một cổng nào cả — không cổng nào có thể thấy —
mà là **một mâu thuẫn nội tại**: con số báo cáo không thể sống chung với một con số khác đã biết
(74,2% đổi trong khi vật chỉ chiếm 0,25%). Luôn giữ trong đầu ít nhất một đại lượng thứ hai để đối
chiếu, nếu không thì một bảng số hoàn toàn hợp lý sẽ đi thẳng vào báo cáo; **(b)** cổng cache phải
so **DẤU VÂN TAY CỦA ĐẦU VÀO** (commit + tham số), không so **sự tồn tại của tên file** — hoặc đơn
giản là bỏ cache đi, vì 25 giây dựng lại rẻ hơn một kết luận mỹ thuật sai; **(c)** khi phát hiện
vài phần tử cũ thì **dựng lại TOÀN BỘ tập**, đừng chỉ vá những phần tử đã bắt được — phần chưa bắt
được mới là phần nguy hiểm.

### ⚠️ ĐÍNH CHÍNH — BẢNG SÁU DẢI Ở MỤC §1 KHÔNG TÁI LẬP ĐƯỢC TRÊN BỘ ẢNH s80

Mục "Phase 13 VIỆC B §1" ở trên in một bảng sáu dải và ghi lệnh đo là `--sessions 80`. Đo lại bằng
đúng công cụ đã commit trên bộ ảnh **s80** thì **không khớp**, và chỗ lệch không nhỏ:

| | dải 1 | dải 2 | dải 3 | dải 4 | dải 5 | dải 6 |
|---|---|---|---|---|---|---|
| §1 ghi «chân trời» | 98,95 | 68,06 | 18,93 | 1,00 | 0,00 | 0,22 |
| đo lại trên **s80** | **67,27** | **28,13** | **3,48** | 0,16 | 0,00 | 0,17 |
| đo trên **s20** (08-19) | 98,92 | 68,17 | 18,92 | 1,00 | 0,00 | 0,22 |
| đo trên **s50** (08-19) | 98,92 | 68,02 | 18,87 | 1,00 | 0,00 | 0,22 |

Hàng của §1 khớp bộ **s20/s50** tới **hai chữ số ở cả sáu dải**, và lệch hẳn khỏi bộ s80. ⇒ bảng §1
được tính từ **một bộ ảnh khác với dòng lệnh nó tự in ra** — cùng hình dạng `TECH_DEBT #43` (chép
cột "sau" của phase trước làm cột "trước" của phase mình), và cùng cơ chế với cái cổng cache ở mục
ngay trên.

**Kết luận của §1 KHÔNG đổi**: đo lại bằng bộ số đúng thì dải 1 vẫn gần như không có đất (**2,02%**,
so với 0,62% ở bảng cũ) và dải 3 vẫn đã bão hoà dấu vết người (**61,32%**, so với 58,05%). Cả hai
lý do loại vẫn đứng, và **dải 2 vẫn là dải xa nhất còn tấm đất thật**. Bảng số bị thay bằng bảng ở
mục này; **lý lẽ chọn dải 2 giữ nguyên.**

---

## Phase 14 §1(2) «kim tự tháp + ziggurat» — 13/15 KỶ KHÔNG ĐỔI MỘT ĐƠN VỊ (2026-08-21, ADR-051)

**Lệnh đã sinh ra bảng này** (chạy y hệt cho cả hai vế, chỉ khác `KHO`):

```
git worktree add /tmp/truoc 0fbd47f && ln -s "$PWD/node_modules" /tmp/truoc/node_modules
KHO=/tmp/truoc node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
KHO=$PWD      node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
```
Tham số in ra ngay trong đầu ra: `SESSIONS=80 HOUR=12 LEVEL=3`. Vế TRƯỚC = `0fbd47f` (§1(1) đã vá
mạng đường), vế SAU = cây làm việc của §1(2). **Không có ảnh nào tham gia bảng này** — `scene-count`
không cần Chromium, nên không có "đời ảnh" để ghi.

| kỷ | tam giác TRƯỚC | tam giác SAU | Δ | lệnh vẽ |
|---|---|---|---|---|
| **2** (Ai Cập, `cone` → `pyramid`) | 138.824 | **138.978** | **+154** (+0,11%) | 14 → **14** |
| **3** (Iraq, `stepped` → `ziggurat`) | 144.528 | **144.836** | **+308** (+0,21%) | 14 → **14** |
| 1 · 4 · 5 · 6 · 7 · 8 · 9 · 10 · 11 · 12 · 13 · 14 · 15 | — | — | **0** | **không đổi** |
| **tổng 15 kỷ** | 2.425.450 | **2.425.912** | **+462** (= 154 + 308, khớp từng đơn vị) | — |

⚠️ **Mười ba con số 0 kia không phải "kết quả" — chúng là CÁI CÂN.** Bản vá này chỉ chạm hai dòng
của một bảng 15 dòng, nên nếu phép đo bị lệch phiên bản, lẫn tải máy, hay chép nhầm cột thì gần như
chắc chắn chúng sẽ không còn là 0. Đây đúng là thứ đã cứu bảng Bước C và là thứ `TECH_DEBT #43` kê
đơn sau khi 6/15 dòng của bảng Phase 11 trôi trong im lặng.

**Vì sao lệnh vẽ không nhúc nhích**: đền thờ trên đỉnh ziggurat mang vai `trim`, mà `trim` **đã có
mặt ở kỷ 3 từ trước**. Lệnh vẽ thành phố = (số họ vật liệu) + 4, nên chỉ một họ **mới toàn kỷ** mới
đẻ ra lệnh vẽ — xem `drawCallBudget.test.js`.

### Cổng chống-trôi bản quét — VÀ MỘT ĐÍNH CHÍNH VỀ VIỆC AI ĐÃ TIÊU BIÊN

```
node scripts/city-preview.mjs --sweep --all --theme light
node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png
```
Đời ảnh: `.city-preview/sweep-light-ky1-15.png`, dựng lại **sạch** cho cả hai vế trong cùng phiên
2026-08-21 (vế TRƯỚC dựng trong `git worktree` tại `0fbd47f`). Ảnh 1864×3154 · ô 300×186.

| | mốc ghi ở `CLAUDE.md` (sau ADR-046/047) | **TRƯỚC** (`0fbd47f`, tự đo) | **SAU** (§1(2)) |
|---|---|---|---|
| Cặp chặng gần nhất | 16,27 | **15,40** | **15,36** |
| Cặp chặng dưới ngưỡng mắt | 0/15 | **0/15** | **0/15** |
| Cặp kỷ gần nhất | 22,13 | **22,32** | **22,32** |
| Cặp kỷ — trung vị | 39,35 | **39,83** | **39,83** |
| Cặp kỷ dưới ngưỡng mắt | 0/105 | **0/105** | **0/105** |

⚠️ **ĐỌC BẢNG NÀY THEO ĐÚNG THỨ TỰ CỘT, ĐỪNG SO CỘT 1 VỚI CỘT 3.** Nếu chép cột "sau" của phase
trước làm mốc nền (đúng cái bẫy `TECH_DEBT #43`) thì kết luận sẽ là *"§1(2) làm trục chặng tụt 0,91"*
— **sai**. Tự đo mốc nền tại `0fbd47f` cho thấy **§1(2) chỉ dịch 0,04** trên trục chặng và **0,00**
trên trục kỷ. Toàn bộ 0,87 còn lại đã bị tiêu bởi **§1(1)** — bản vá chiều quay tam giác, thứ làm
diện tích mặt đường **nhìn thấy được** đi từ 80,8% lên 100,0%.

Và đó là một hệ quả **đoán trước được**: mặt đường là một bề mặt gần như nằm ngang, phản ứng với
giờ trong ngày **yếu hơn** trung bình cả cảnh, nên thêm 19,2% mặt đường vào khung hình là thêm **chi
tiết CHUNG** chứ không phải chi tiết PHÂN BIỆT — đúng khuôn đã ghi ở `CLAUDE.md` (*"một phép đo lấy
trung bình trên vùng rộng sẽ tụt điểm mỗi lần ta thêm thứ gì đó KHÔNG phụ thuộc trục nó đang đo"*).
Trục KỶ ngược lại **tốt lên** (22,13 → 22,32 · trung vị 39,35 → 39,83), vì mỗi kỷ một mặt đường
riêng ⇒ trên trục ấy mặt đường là chi tiết PHÂN BIỆT. Cùng một thay đổi, hai trục, hai dấu ngược
nhau — lần thứ hai dự án gặp đúng hình dạng này (lần đầu: mặt nước ở Bước C).

⚠️ **BIÊN CÒN LẠI CỦA TRỤC CHẶNG: 15,36 trên ngưỡng mắt 12, tức 28%.** Ba mốc Đàm ra là **≥20,7 tự
phục hồi · <17 khuyết tật thật · <14 phải làm vùng quê đổi theo giờ**. Mốc thứ hai **đã chạm từ
trước phase này**; mốc thứ ba còn cách **1,36**. Lịch sử đầy đủ: 20,7 → 16,5 → 15,7 → 15,16 →
16,27 (ADR-046/047 kéo lên) → **15,40** (§1(1)) → **15,36** (§1(2)). ⇒ **Phase sau thêm bất cứ thứ
gì KHÔNG phản ứng với giờ trong ngày thì phải đo lại con số này TRƯỚC.** §1(3) sắp thêm 120–300 khối
nhà — tường nhà thì CÓ phản ứng với hướng nắng, nên hướng đi có lợi, nhưng vẫn phải đo.

### Ảnh nghiệm thu §1(2) — ĐỜI ẢNH VÀ DẤU VÂN TAY

```
# vế TRƯỚC — chạy TRONG worktree 0fbd47f, bằng một lệnh cd RIÊNG (cd ghép sang lệnh sau là cái bẫy
# đã sinh ra một bảng số so bản cũ với chính nó)
node scripts/city-preview.mjs --era 2 --hour 12 --sessions 80 --width 1500 --theme light
node scripts/city-preview.mjs --era 3 --hour 12 --sessions 80 --width 1500 --theme light
# vế SAU — cùng dòng lệnh, trong cây làm việc
node scripts/sweep-diff.mjs --frame <TRUOC> <SAU>
```

| ảnh | md5 |
|---|---|
| `MAI-TRUOC-ky02.png` | `131daf0f20c3aba6889e3e55071403df` |
| `MAI-SAU-ky02.png` | `d0def2bf2bf34e1830245865cf654e40` |
| `MAI-TRUOC-ky03.png` | `a81cd2991a258c07a95e355d60f2705b` |
| `MAI-SAU-ky03.png` | `f2fbeb18bba814ca5fa2402f34dda0b4` |

Bốn `md5` khác nhau ⇒ cặp trước/sau **không phải hai bản sao của cùng một tấm** (luật nghiệm thu từ
bài học `MAI-SAU-ky9.png` ở Phase 11). Kết quả: kỷ 2 **4,6%** điểm ảnh vượt ngưỡng mắt (lệch trung
bình chỗ đã đổi **54,62**) · kỷ 3 **4,3%** (**97,27**). Ảnh ghép trái-phải để nhìn:
`<scratchpad>/P14-MAI-ky02.png` và `P14-MAI-ky03.png` — cửa sổ cắt chọn bằng **mật độ điểm ảnh đã
đổi** chứ không bằng hộp bao (hộp bao bị BÓNG ĐỔ kéo rộng ra 923×599, mà bóng không phải thứ cần nhìn).

## Phase 14 §1(3) «một ô là một KHU PHỐ» — 371 ô ra 1.812 khối, LỆNH VẼ KHÔNG NHÚC NHÍCH (2026-08-21, ADR-052)

**Công cụ · đầu vào · đời ảnh** (ba vế, thiếu vế nào thì con số phải ĐO LẠI — luật Q2 ở `CLAUDE.md`):

```
# hình học — hai vế CÙNG một dòng lệnh, chỉ khác KHO
KHO=/tmp/wt-nen SESSIONS=80 HOUR=12 LEVEL=3 node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
KHO=$PWD        SESSIONS=80 HOUR=12 LEVEL=3 node --import ./scripts/register-esm-loader.mjs scripts/scene-count.mjs
# ảnh — vế TRƯỚC chạy TRONG worktree, bằng một lệnh `cd` RIÊNG
node scripts/city-preview.mjs --era <N> --hour 12 --width 1500          # s40 (mặc định)
node scripts/city-preview.mjs --era <N> --hour 12 --sessions 80 --width 1500
node scripts/city-preview.mjs --sweep --all --theme light
node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png
node scripts/sweep-diff.mjs --frame <TRUOC> <SAU>
```

Vế TRƯỚC = `git worktree` tại **`ff8c2a4`** ở `/tmp/wt-nen`, ảnh dựng **2026-08-21 21:37–21:39**.
Vế SAU = cây làm việc (`ff8c2a4` + thay đổi §1(3) chưa commit), ảnh dựng **21:39–21:40**.
Cả 14 ảnh nghiệm thu có **14 `md5` khác nhau** ⇒ không cặp nào là hai bản sao của cùng một tấm
(luật từ bài học `MAI-SAU-ky9.png`). `md5` chỉ dùng cho việc ấy, **không** dùng làm phán quyết
"ảnh có đổi không" (`TECH_DEBT #50`).

### Hình học — ĐỦ 15 KỶ

| kỷ | tam giác TRƯỚC | tam giác SAU | × | lệnh vẽ TRƯỚC → SAU |
|---:|---:|---:|---:|:---:|
| 1 | 125.192 | 143.884 | 1,149 | 11 → **11** |
| 2 | 138.978 | 168.710 | 1,214 | 14 → **14** |
| 3 | 144.836 | 180.500 | 1,246 | 14 → **14** |
| 4 | 192.440 | 230.952 | 1,200 | 14 → **14** |
| 5 | 136.058 | 162.930 | 1,198 | 14 → **14** |
| 6 | 224.606 | 265.894 | 1,184 | 14 → **14** |
| 7 | 191.506 | 244.102 | 1,275 | 15 → **15** |
| 8 | 167.374 | 217.982 | 1,302 | 15 → **15** |
| 9 | 170.268 | 206.392 | 1,212 | 14 → **14** |
| 10 | 138.706 | 189.578 | 1,367 | 15 → **15** |
| 11 | 157.556 | 220.336 | 1,398 | 13 → **13** |
| 12 | 140.106 | 190.390 | 1,359 | 13 → **13** |
| 13 | 167.414 | 224.410 | 1,340 | 12 → **12** |
| 14 | 183.206 | 233.478 | 1,274 | 13 → **13** |
| 15 | 147.666 | 210.926 | 1,428 | 13 → **13** |
| **tổng** | **2.425.912** | **3.090.464** | **1,274** | **15/15 KHÔNG ĐỔI** |

⚠️ **Mười lăm con số lệnh-vẽ không đổi là CÁI CÂN, không phải kết quả.** Lệnh vẽ thành phố =
(số họ vật liệu) + 4, nên chỉ một họ **mới toàn kỷ** mới đẻ ra lệnh vẽ. Cụm khu phố dựng bằng
**đúng `buildBuildingSpec`** của chính kỷ ấy nên nó không thể mang họ lạ vào — và có một bài test
canh đúng điều đó (`KHÔNG THÊM MỘT HỌ VẬT LIỆU NÀO`, so tập vai màu của cụm với tập vai màu của
bản tham chiếu, từng kỷ một). Nếu phép đo bị lệch phiên bản hay chép nhầm cột thì gần như chắc chắn
15 con số ấy sẽ không còn khớp.

+664.552 tam giác (+27,4%) vẫn nằm **sâu trong vùng rẻ**: bộ số M3 đã đo *"hình học thì RẺ — tam
giác chênh 43% giữa kỷ 3 và 11 mà thời gian chỉ chênh 2,4%"*, và trần còn dư 3,2 lần. Kỷ nặng nhất
sau bản vá (kỷ 6 = 265.894) vẫn nhẹ hơn mức mà bộ đo M3 từng chạy qua.

### Cổng CPU dựng cảnh (`TECH_DEBT #70`, trần ≤ 1,25×)

Ba lượt mỗi vế, **chạy nối tiếp, không chồng lấn** (luật *"một phép đo thời gian không được chồng
lấn với một phép đo thời gian khác"*), lệnh `npm run test:cross`:

| | lượt 1 | lượt 2 | lượt 3 | trung vị |
|---|---:|---:|---:|---:|
| NỀN (`ff8c2a4`) | 22.065 ms | 22.709 ms | 22.094 ms | **22.094 ms** |
| SAU (§1(3)) | 23.271 ms | 24.403 ms | 23.999 ms | **23.999 ms** |

⇒ **×1,086** — dưới trần 1,25× và cũng **dưới mốc 1,15×** mà cố vấn đặt làm Review Trigger cho việc
xây một phép đo thời-gian-dựng-cảnh chuyên biệt. Chưa cần công cụ mới. ⚠️ Giới hạn đã biết của con
số này (ghi ở chú thích của chính cổng): `test:cross` trộn thời gian nạp module + chạy assert +
dựng cảnh, nên nó **không** là thời gian dựng cảnh thuần — đừng trích nó như thể là.

Vì sao chỉ +8,6% trong khi số lượt gọi `buildBuildingSpec` đi từ 371 lên **3.624** (hai lượt đo
hình chiếu đáy cho mỗi đơn vị): thời gian dựng cảnh bị **địa hình** chi phối, không phải bộ sinh
khối nhà — đúng như ADR-048 đã đo khi nó tìm ra `horizon.heightAt` gọi `terrain.nenKho` ở mỗi đỉnh
lưới.

### Cổng chống-trôi bản quét — ĐẠT, NHƯNG TRỤC CHẶNG TIÊU MẤT 0,97

Đời ảnh: `sweep-light-ky1-15.png`, cả hai vế dựng lại **sạch** trong cùng phiên 2026-08-21
(TRƯỚC 21:37 trong worktree `ff8c2a4` · SAU 21:31 trong cây làm việc). Ảnh 1864×3154 · ô 300×186.

| | **TRƯỚC** (`ff8c2a4`, tự đo) | **SAU** (§1(3)) |
|---|---|---|
| Cặp chặng gần nhất | **15,36** | **14,39** |
| Cặp chặng dưới ngưỡng mắt | 0/15 | **0/15** |
| Cặp kỷ gần nhất | **22,32** | **22,09** |
| Cặp kỷ — trung vị | **39,83** | **38,34** |
| Cặp kỷ dưới ngưỡng mắt | 0/105 | **0/105** |

⚠️ **Mốc nền được TỰ ĐO tại `ff8c2a4`, không chép cột "sau" của §1(2)** (`TECH_DEBT #43`). Nó ra
**đúng** bộ số mà bảng §1(2) đã ghi (15,36 · 22,32 · 39,83) — tức bảng ấy **không trôi**, và đây là
một phép đối chiếu chéo miễn phí.

⚠️ **TRỤC CHẶNG NAY LÀ 14,39. Mốc thứ ba của Đàm là «< 14 ⇒ phải làm vùng quê đổi theo giờ». Còn
cách 0,39.** Lịch sử đầy đủ: 20,7 → 16,5 → 15,7 → 15,16 → 16,27 (ADR-046/047 kéo lên) → 15,40
(§1(1)) → 15,36 (§1(2)) → **14,39** (§1(3)). Đây là **cú tụt một-phase lớn nhất từ trước tới nay**.

### Tách con số gộp ra ba dải — dải nào tiêu 0,97 ấy

Đừng dừng ở *"trục chặng tụt"*: `CLAUDE.md` đã ghi *"tách con số gộp ra từng thành phần và hỏi
thành phần nào thật sự kéo nó xuống"*. Đo lại bằng **chính `BANDS` và `vecDist` của
`sweepMetric.mjs`** (một luật một công thức); phép cộng ba dải tái lập **đúng** con số của
`sweep-score.mjs` tới hai chữ số, nên phép tách này đã tự chứng minh nó đo cùng thứ:

| cặp 6h ↔ 15h | TRƯỚC | SAU | đổi |
|---|---:|---:|---:|
| dải **trời** | 8,46 | 8,38 | **−0,08** |
| dải **thành phố** | 11,95 | 10,73 | −1,22 |
| dải **đất** | 22,21 | 20,88 | −1,34 |
| **cả cảnh (9 chiều)** | **15,36** | **14,39** | **−0,97** |

Hai điều đọc ra, và điều thứ hai quan trọng hơn:

1. Dải **trời gần như không nhúc nhích** (−0,08) — đúng như phải thế, cụm khu phố không chạm bầu
   trời. Toàn bộ 0,97 nằm ở hai dải mà thành phố chiếm.
2. ⚠️ **Dải trời (8,38) là dải YẾU NHẤT của cặp yếu nhất, và nó đã yếu như vậy TỪ TRƯỚC phase này**
   (8,46). Nghĩa là trục chặng đang bị kéo xuống chủ yếu bởi **một dải mà §1(3) không thể chạm
   tới**. ⇒ Nếu ngày nào phải kéo trục chặng lên, **cần gạt là BẦU TRỜI lúc 6h so với 15h**, không
   phải thành phố. Ghi ra đây để phiên sau khỏi đi chữa nhầm chỗ.

### Ảnh nghiệm thu — `md5` và kết quả `sweep-diff --frame`

| kỷ · số phiên | md5 TRƯỚC | md5 SAU | điểm ảnh vượt ngưỡng mắt | lệch TB chỗ đã đổi |
|---|---|---|---:|---:|
| 1 · s40 | `46259cc8…` | `789f922e…` | **6,6%** | 92,28 |
| 2 · s40 | `09d552be…` | `2d9240eb…` | **8,4%** | 84,45 |
| 6 · s40 | `f2692ab3…` | `2cf07d5d…` | **6,6%** | 80,97 |
| 11 · s40 | `08a4c572…` | `f44383af…` | **7,4%** | 89,51 |
| 14 · s40 | `1338d7a9…` | `c0a77741…` | **6,0%** | 99,20 |
| 11 · s80 | `e04208a7…` | `f32a321a…` | **10,9%** | 93,35 |
| 14 · s80 | `f8141752…` | `75698295…` | **9,2%** | 104,45 |

Để so: §1(2) (kim tự tháp + ziggurat) đổi **4,3–4,6%**. §1(3) đổi **6,0–10,9%**, và hai ô mạnh nhất
là hai ô ở **80 phiên** — đúng như phải thế, vì số ô nhà dân đi từ 17–20 (40 phiên) lên 17–30
(80 phiên), nên thành phố càng trưởng thành thì bản vá càng lộ ra.

### Mặt trái, đo ra chứ không giấu: mỗi CĂN nhỏ đi, cả KHU cao lên

| | TRƯỚC | SAU | × |
|---|---:|---:|---:|
| Cạnh ngắn một căn nhà (trung bình 15 kỷ) | 0,907 ô | **0,406 ô** | **×0,448** |
| Chiều cao trung bình một ô nhà dân | 1,20 ô | **1,29 ô** | ×1,070 |
| Số khối nhìn thấy (15 kỷ, 80 phiên) | 371 | **1.812** | ×4,88 |
| Đơn vị HẸP NHẤT trong cả 15 kỷ | — | **0,314 ô** | (sàn `MIN_UNIT_CELLS` = 0,312) |

Chia một ô thành 4–10 suất thì **mỗi căn chỉ còn 45% bề ngang cũ**. Cột `storey` trong bảng
`blockStyle.js` sinh ra để bù lại theo CHIỀU CAO (`pitch = f(max(w,d))` nên chia nhỏ làm mái thấp
xuống, mà `massHeight` thì không phụ thuộc hình chiếu đáy) — bù đủ: chiều cao trung bình mỗi ô
**tăng 7,0%**, không kỷ nào tụt. Con số 0,314 sát sàn 0,312 chứng minh phép kẹp **TRẦN THẮNG SÀN**
đang thật sự cắn: ô chật thì bớt cột/hàng, chứ không đẻ ra nhà tí hon.

---

## Phase 25 — BA CẦN GẠT ĐƯỢC ĐO, HAI ĐI NGƯỢC HƯỚNG (2026-09-05, ADR-070)

- **Công cụ**: `scripts/city-preview.mjs --sweep` → `scripts/sweep-score.mjs` · phép tách dải viết
  tạm trong thư mục nháp (`§3` cấm để công cụ dùng-một-lần vào `scripts/`), dùng **đúng** phép gộp
  của `sweep-score.mjs` (gộp-trước 15 kỷ rồi mới so — `TECH_DEBT #55`) và có hai cổng tự-kiểm: tổng
  9 chiều phải BẰNG `RMS` của ba khoảng cách dải, và hai cột phải khác nhau.
- **Dòng lệnh** (hai vế **y hệt nhau**, chỉ khác KHO):

```bash
node scripts/city-preview.mjs --sweep --all --theme light
node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png
```

- **ĐỜI ẢNH**: vế "trước" dựng trong `git worktree …/p25/wt-mattroi` tách rời ở **`d5cf623`**
  (TỰ ĐO, **không chép** cột "sau" của Phase 24 — `TECH_DEBT #43`); vế "sau" dựng trong cây làm việc
  ở `d5cf623` + bản vá một dòng, lúc **2026-09-05T07:59Z**, md5 `07397429974936919c18feb1b2995104`.
  ⚠️ Ảnh "sau" bị `sweep-score.mjs` **TỪ CHỐI CHẤM một lần** vì nó cũ hơn `daylight.js` (phép thử
  ngược vừa ghi lại file ấy) — cổng chống-ảnh-cũ đã làm đúng việc của nó và **không có cờ bỏ qua**,
  nên bản quét được dựng lại sạch. Đó là lý do mốc thời gian trên là mốc thứ hai, không phải mốc đầu.

### (a) Ba cần gạt — bảng ĐÓNG CỬA, không phải bảng mở cửa

5 kỷ (1·5·8·11·14) × 2 giờ (6·15), mỗi cần gạt phá ở **MÃ NGUỒN** trong một `git worktree` riêng
(bản quét không có cờ cho chúng — xem mục (c)):

| | rặng núi xa | thành phố | đất | **TỔNG** | so mốc nền |
|---|---:|---:|---:|---:|---:|
| **MỐC NỀN** (đủ mọi cần gạt) | 6,63 | 7,12 | 17,56 | **11,59** | — |
| TẮT BÓNG ĐỔ (`sun.castShadow = false`) | 7,14 | 13,79 | 28,74 | **18,86** | **+7,27** ⇐ **ngược** |
| TẮT ĐÈN CỬA SỔ lúc bình minh (`dawn.windowsLit = false`) | 7,48 | 8,46 | 18,76 | **12,64** | **+1,05** ⇐ **ngược** |
| MẶT TRỜI BÌNH MINH LÊN 0,48 | 6,85 | 6,88 | 7,86 | **7,21** | −4,38 (thuận) |

⚠️ **Đọc đúng dấu**: cột cuối là *"tắt thứ này đi thì hai giờ CÁCH XA nhau thêm bao nhiêu"*. Dấu
dương nghĩa là thứ ấy đang **KÉO HAI GIỜ LẠI GẦN NHAU**. Cơ chế đọc ra từ bảng độ sáng theo dải:
bóng đổ tính tiền theo `sunEnergy` (chiều 1,00 · bình minh 0,50) nên nó làm buổi chiều **tối đi gấp
đôi** buổi bình minh; đèn cửa sổ bình minh nâng dải thành phố lên **+2,4**, đúng chiều tiến về mức
của buổi chiều.

⚠️ **Nhưng không cần gạt nào trong hai cái ấy DÙNG ĐƯỢC** — bỏ bóng đổ là mất hình khối (§1: sản
phẩm là ẢNH), bỏ đèn cửa sổ lúc 6h là xoá tín hiệu mạnh nhất nói với con người rằng đây là bình minh
(ADR-025 cấm mua một con số bằng cách nói dối đời thật). ⇒ **Giá trị của bảng này là nó ĐÓNG LẠI hai
hướng cho phiên sau.** Không đo thì một phiên nào đó sẽ tốn trọn một phase đi tắt bóng đổ rồi thấy
con số tệ đi.

### (b) Bản vá — cổng không-trôi, 15 kỷ × 6 chặng

| | mốc nền `d5cf623` (chiều 0,48) | Phase 25 (chiều 0,55) |
|---|---:|---:|
| **bình minh 6h ↔ chiều 15h** | 13,3 | **18,8** |
| trưa 12h ↔ chiều 15h | 31,1 | **26,6** ⇐ hàng xóm trả tiền |
| sáng 8h ↔ chiều 15h | 23,8 | 23,9 |
| sáng 8h ↔ trưa 12h | 21,4 | 21,4 |
| bình minh 6h ↔ sáng 8h | 28,6 | 28,6 |
| **cặp chặng gần nhất** | **13,34** ✓ (0/15) | **18,80** ✓ (0/15) |
| cặp kỷ gần nhất | 21,52 ✓ | 21,64 ✓ |
| trung vị cặp kỷ | 36,21 (0/105) | 36,64 (0/105) |

Mốc nền tái lập **đúng** bộ số Phase 24 (13,34 · 21,52 · 36,21) ⇒ không trôi, phép so sạch.
**Biên trên ngưỡng mắt 12: 1,34 → 6,80 (×5)** — mức cao nhất kể từ Phase 14 §1(3).

Ba dải của cặp yếu nhất:

| dải | mốc nền | Phase 25 | tỉ số |
|---|---:|---:|---:|
| **rặng núi xa** | 6,12 | **10,34** | **×1,69** |
| thành phố | 7,75 | 12,92 | ×1,67 |
| đất | 20,88 | 28,03 | ×1,34 |

⚠️ **Đối chứng nằm sẵn trong phép đo**: bảng độ sáng theo giờ cho thấy **chỉ cột 15h đổi**, năm cột
còn lại trùng từng chữ số — đúng như một bản vá chạm đúng một chặng phải thế. Không có vế ấy thì
không phân biệt được *"bản vá có tác dụng"* với *"tôi đang đo hai cây mã khác nhau"*.

⚠️ **`TECH_DEBT #89` VẪN MỞ**: riêng dải `rặng núi xa` là **10,34 < 12**. Cổng tổng qua nhờ cả ba
dải cộng lại, không nhờ chỗ được chẩn đoán đã lành. **Cổng qua ≠ chẩn đoán xong** (ADR-066).

### (c) Một cái bẫy đã vá trong chính phiên này — bản quét NUỐT `--no-shadow` trong im lặng

`buildBundle` chọn `options.sweep ? sweepSource(options) : entrySource(options)`, mà `sweepSource`
chỉ nhận **sáu** trường (`level · theme · cell · combos · sessions · t`). Cờ `--no-shadow` (và
`--no-ao`, `--lowdetail`, `--mask`, `--zoom`, `--focus`, `--topdown`, `--pending`, `--dpr`) chỉ sống
trong `entrySource` ⇒ ở nhánh `--sweep` chúng **bị bỏ qua mà không một dòng cảnh báo nào**. Phát
hiện vì hai PNG có **cùng cỡ byte và cùng số đo**, xác nhận bằng `cmp`. Vá ở `d5cf623`: nhánh
`--sweep` nay **TỪ CHỐI THẲNG** (mã thoát 2, in ra cách làm đúng là phá mã nguồn trong `worktree`)
thay vì tự chữa hay gắn nhãn — gắn nhãn `-noshadow` vào tên file sẽ **hứa một khác biệt mà bản dựng
không tạo ra**, tức đúng cái bệnh đang chữa. Tên file bản quét nay mang mọi tham số **thật sự đổi
nội dung** (`-h…`, `-s…`, `-lv…`, `-c…`, `-t…`), và **rỗng ở giá trị mặc định** nên
`sweep-light-ky1-15.png` giữ nguyên tên lịch sử ⇒ mọi bảng cũ trong file này vẫn truy được nguồn.
Khoá bằng 4 bài ở `scripts/cityPreviewSource.test.js`, trong đó bài canh "dừng hẳn" là bài **CHẠY
THẬT rồi đọc mã thoát** — bản đầu đọc mã nguồn tìm `process.exit(2)` và một dòng
`// process.exit(2);` bị chú thích vẫn khớp (đúng cái bẫy `&& 0` của Phase 8A).

---

## Phase 24 — BÌNH MINH THÔI GIỐNG BUỔI CHIỀU (2026-09-03, ADR-069)

- **Công cụ**: `scripts/city-preview.mjs --sweep` → `scripts/sweep-score.mjs`
- **Dòng lệnh** (hai vế **y hệt nhau**, chỉ khác KHO):

```bash
node scripts/city-preview.mjs --sweep --all --theme light
node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png
```

- **ĐỜI ẢNH**: vế "trước" dựng trong `git worktree /home/user/pd-base` tách rời ở **`636c695`**
  (TỰ ĐO, **không chép** cột "sau" của Phase 23 — `TECH_DEBT #43`); vế "sau" dựng trong cây làm
  việc sau khi vá `daylight.js`. Ảnh của vế nào nằm trong `.city-preview/` của kho ấy.
- **Thay đổi được đo**: đúng một trường — `dawn.skySaturation: 1,00 → 0,45`.

| cây mã | cặp chặng gần nhất | cặp kỷ gần nhất | trung vị kỷ |
|---|---|---|---|
| mốc nền `636c695` (tự đo) | 12,23 ✓ (0/15) | 21,86 ✓ | 36,33 (0/105) |
| **Phase 24** | **13,34** ✓ (0/15) | 21,52 ✓ | 36,21 (0/105) |

**Biên trên ngưỡng mắt 12: 0,23 → 1,34 — gấp 5,8 lần.** Trục kỷ gần như đứng yên, đúng như phải
thế: bản vá áp CÙNG một luật cho cả 15 kỷ nên nó không thể làm hai kỷ khác nhau thêm.

### Tách ba dải của cặp yếu nhất (`bình minh 6h ↔ chiều 15h`)

⚠️ Làm phép tách này vì bài học Phase 20: **một cái cổng qua KHÔNG chứng minh chẩn đoán đúng** —
ở đó cổng qua nhờ một dải chẳng liên quan tới nguyên nhân đã nêu.

| dải | mốc nền | Phase 24 | tỉ số |
|---|---|---|---|
| **rặng núi xa** ← dải được chẩn đoán | 4,14 | **6,12** | **×1,48** |
| thành phố | 6,71 | 7,75 | ×1,16 |
| đất | 19,65 | 20,88 | ×1,06 |
| TỔNG (khớp gác tự-kiểm của công cụ tách) | 12,23 | 13,34 | ✓ |

**Lần này dải được nêu đích danh chính là dải nhúc nhích nhiều nhất.** ⚠️ Nhưng phần chưa xong phải
ghi ra: **6,12 vẫn chỉ bằng một nửa ngưỡng mắt**, tức riêng dải ấy hai chặng vẫn đọc ra là một —
con số tổng qua được là nhờ dải ĐẤT gánh. `TECH_DEBT #89` vì vậy **vẫn MỞ**.

### Bảng đánh đổi của cần gạt (để Đàm chỉnh, nếu muốn)

Mọi giá trị dưới đây đều qua cổng chống-tím với nguyên biên. Khoảng cách màu chân trời bình
minh↔chiều, trung bình 15 kỷ:

| `dawn.skySaturation` | 0,55 | **0,45 (đã chọn)** | 0,30 |
|---|---|---|---|
| xa buổi chiều | 40,7 | **46,2** | 54,2 |

Chọn 0,45 để **không tối đa hoá con số** — giữ lại chút hơi ấm buổi sáng, vì §1 nói mắt Đàm là
trọng tài. Từ 0,45 xuống 0,30 chỉ mua thêm **~17%**, tức cần gạt này đã gần hết.

### ⚠️ Một hướng có con số ĐẸP HƠN đã bị BÁC BỎ — ghi lại để đừng ai thử lại

Kéo bình minh sang hồng sen (`horizonHue` 34 → 330, `skySaturation` → 1,20) cho **trục chặng
21,26** — con số đẹp nhất từ Phase 19 tới nay. Nó **BỊ LOẠI**: `palette3d.test.js` đỏ 2 bài ở
**giờ 5** (mặt nước `#9585b2`, nền `#ea7b88`, điểm tím **28** trên trần **10**). Bản quét lấy mẫu
**6 giờ** (6·8·12·15·18·22) nên nó **về mặt cấu tạo không thể** thấy lỗi ở giờ 5.
⇒ **Một bản quét 6 khung giờ không thay được bộ test.** Đúng hình dạng `TECH_DEBT #38`.

---

## Phase 22 — SÂN/VƯỜN THUỘC SUẤT ĐẤT: NHÀ THÔI SÁT NHAU (2026-08-28, ADR-067)

- **Công cụ**: `scripts/city-preview.mjs --sweep` → `scripts/sweep-score.mjs`
- **Dòng lệnh** (hai vế **y hệt nhau**, chỉ khác KHO):

```bash
# vế TRƯỚC — chạy TRONG worktree ở đúng HEAD 3d37745, bằng một lệnh `cd` RIÊNG
# (ghép `cd` sang lệnh sau là cái bẫy đã sinh ra một bảng số so bản cũ với chính nó)
cd /tmp/mocnen && node scripts/city-preview.mjs --sweep --all --theme light
cd /tmp/mocnen && node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png

# vế SAU — cùng dòng lệnh, trong cây làm việc
node scripts/city-preview.mjs --sweep --all --theme light
node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png
```

- **Đầu vào**: mặc định của `--sweep` (15 kỷ × 6 chặng · `--cell 300` · 80 phiên · theme sáng).
- **Đời ảnh**: cả hai dựng ngày **2026-08-28** — vế SAU lúc **14:54** trong `.city-preview/` của cây
  làm việc (8.510.076 byte), vế TRƯỚC lúc **15:05** trong `/tmp/mocnen/.city-preview/` ở worktree
  `3d37745` (8.510.523 byte). **Hai thư mục RIÊNG**, không ghi đè nhau.
  ⚠️ Cố ý **KHÔNG** dùng `md5` để so hai vế (`TECH_DEBT #50`: `md5` đổi theo TẢI MÁY).

### Hai trục, trước ↔ sau

| cây mã | trục CHẶNG | trục KỶ | trung vị kỷ |
|---|---:|---:|---:|
| **mốc nền `3d37745`** (TỰ ĐO trong worktree) | 12,11 ✓ | **22,14** ✓ | **36,42** |
| **Phase 22 đủ** | **12,23** ✓ | 21,86 ✓ | 36,33 |
| đổi | **+0,12** | −0,28 | −0,09 |

⚠️⚠️ **VÀ ĐÂY MỚI LÀ PHẦN PHẢI ĐỌC — MỐC NỀN TỰ ĐO **KHÔNG** TÁI LẬP CON SỐ PHASE 20 ĐÃ GHI.**
Bảng Phase 20 ghi trục chặng **12,44**; đo lại tại `3d37745` ra **12,11**, tức lệch **−0,33**.
⚠️ **ĐỪNG ĐỔ CHO PHASE 21** — đi đọc thì `BAN_GIAO.md` của Phase 21 (commit `6ebda87`) **đã ghi
đúng 12,11 · 22,14 · 36,42**, cả trước lẫn sau phép gộp `main`, và gọi đó là *"không trôi một chữ
số"*. Nghĩa là mốc nền của Phase 21 **vốn đã là 12,11**, nên chỗ trôi nằm ở đâu đó **giữa lúc Phase
20 ghi số và lúc Phase 21 đo lần đầu** — và **tôi CHƯA truy ra nó nằm ở commit nào**. Nói "Phase 21
làm trôi" là một câu nghe rất xuôi mà không có số nào đỡ. Thứ đo được chỉ có hai điều: (a) hai tài
liệu trong cùng kho ghi **hai con số khác nhau** cho cùng một đại lượng và **không ai để ý**;
(b) phép đo hôm nay **tái lập ĐÚNG con số của Phase 21 tới hai chữ số** ⇒ số của Phase 21 đúng, và
phép đo này không trôi.

⚠️ **Nếu chép cột "sau" của Phase 20 làm mốc nền thì kết luận sẽ ĐẢO NGƯỢC**: Phase 22 bị đọc thành
*"tiêu mất 0,21"* trong khi thật ra nó **đi LÊN 0,12**. Một phép so sai mốc nền không chỉ sai về độ
lớn — nó sai về **DẤU**, và dấu mới là thứ quyết định phase sau đi tiếp hay quay lại. Đúng hình dạng
`TECH_DEBT #43`, lần này bắt được **chỉ vì** mốc nền được TỰ ĐO chứ không chép.

### Tách ba dải của cặp yếu nhất (`bình minh 6h ↔ chiều 15h`)

| dải | mốc nền `3d37745` | Phase 22 | đổi |
|---|---:|---:|---:|
| trời | 4,14 | **4,14** | **0,00** |
| thành phố | 6,54 | **6,71** | **+0,17** |
| đất | 19,50 | **19,65** | +0,15 |
| ⇒ gộp (RMS ba dải) | 12,11 | **12,23** | +0,12 |

⚠️ **Dải TRỜI đứng yên TUYỆT ĐỐI (4,14 → 4,14) — và đó là một CÁI CÂN, không phải một kết quả.**
Phase 22 không chạm một dòng nào vào bầu trời, nên nó **BẮT BUỘC** phải không đổi; việc nó không đổi
tới hai chữ số thập phân là bằng chứng phép đo này không trôi giữa hai lượt (cùng họ với ba con số 0
của Bước C). Không có cái cân ấy thì hai con số kia chỉ là hai con số.

⚠️ **Khác Phase 20 ở chỗ dải THÀNH PHỐ lần này ĐI LÊN (+0,17) chứ không tệ đi** — hợp lý, vì sân
vườn đổi đúng thứ nằm TRONG ô thành phố. Nhưng phần tăng chia gần đều cho hai dải, nên **đừng đọc
thành "đã chữa được `TECH_DEBT #89`"**: dải trời vẫn là **4,14**, thấp hơn ngưỡng mắt gần **ba lần**,
và nó là cần gạt đã được nêu đích danh ba lần. **`#79`/`#89` VẪN MỞ.**

⚠️ **PHÉP ĐO BA DẢI PHẢI CHIA CHO SỐ DẢI TRƯỚC KHI LẤY CĂN** (`vecDist` là RMS: `sqrt(Σ/(n/3))`).
Cả hai vế của bảng trên đều tái lập **ĐÚNG** con số mà `sweep-score.mjs` in ra (12,11 và 12,23) —
đó chính là phép đối chiếu chéo mà Phase 20 phải trả giá mới có (script quên vế chia in ra 21,55
trong khi công cụ thật in 12,44).

### Cái giá: số khối nhà NHÌN THẤY ĐƯỢC tụt 28,2%

Đo bằng một đường **độc lập với ảnh** (thuần Node, không Chromium): đếm `buildBlockSpec(...).units`
trên đúng quần thể nhà dân thật của cả 15 kỷ (80 phiên · cấp 3).

| | mốc nền `3d37745` | Phase 22 |
|---|---:|---:|
| ô nhà dân | 473 | 473 |
| khối nhà dựng ra | **1.892** | **1.358** (−28,2%) |
| trung bình mỗi ô | **4,00** | **2,87** |
| phân bố | `4 khối: 473 ô` (một giá trị duy nhất) | `2 khối: 253 ô · 3 khối: 28 ô · 4 khối: 192 ô` |

⇒ **Đây là hai tin trong một bảng.** Tin tốt: cột `units` **đã sống lại** — trước Phase 22 cả 473 ô
ra đúng **một** giá trị (`TECH_DEBT #88`: trục chết về mặt số học), nay ra **ba** giá trị. Tin phải
nói thẳng: mỗi ô mất trung bình hơn một căn nhà, và điều đó **đi NGƯỢC** lời Đàm từng nói là thành
phố trông nhỏ. ⚠️ **Phản xạ SAI ở đây là hạ cột `yard` xuống cho lấy lại 1.892** — làm thế là mua
một con số bằng cách xoá đúng thứ Đàm vừa yêu cầu (nhà rời nhau). Ghi thành `TECH_DEBT #91`, **chờ
Đàm duyệt bằng MẮT**, không tự quyết.

---

## Phase 20 — BỎ LƯỚI CỨNG: BỘ XƯƠNG SINH THEO KỶ (2026-08-24, ADR-066)

- **Công cụ**: `scripts/city-preview.mjs --sweep` → `scripts/sweep-score.mjs`
- **Dòng lệnh** (hai vế **y hệt nhau**, chỉ khác KHO):

```bash
# vế TRƯỚC — chạy TRONG worktree ở đúng HEAD 0abb272, bằng một lệnh `cd` RIÊNG
# (cd ghép sang lệnh sau là cái bẫy đã sinh ra một bảng số so bản cũ với chính nó)
cd <worktree-0abb272> && node scripts/city-preview.mjs --sweep --all --theme light
cd <worktree-0abb272> && node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png

# vế SAU — cùng dòng lệnh, trong cây làm việc
node scripts/city-preview.mjs --sweep --all --theme light
node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png
```

- **Đầu vào**: mặc định của `--sweep` (15 kỷ × 6 chặng · `--cell 300` · 80 phiên · theme sáng).
- **Đời ảnh**: cả hai dựng ngày **2026-08-24**, vế TRƯỚC lúc 15:05 trong worktree `0abb272`, vế SAU
  lúc 14:56 trong cây làm việc — **hai thư mục `.city-preview/` RIÊNG**, không ghi đè nhau.
  ⚠️ Cố ý **KHÔNG** dùng `md5` để so hai vế: `TECH_DEBT #50` đã đo được rằng `md5` đổi theo TẢI MÁY.

### Hai trục, trước ↔ sau

| cây mã | trục CHẶNG | trục KỶ | trung vị kỷ |
|---|---:|---:|---:|
| **mốc nền `0abb272`** (TỰ ĐO trong worktree, không chép của Phase 19) | **11,33** ✗ | 19,18 ✓ | 36,31 |
| **Phase 20 đủ** | **12,44** ✓ | **21,77** ✓ | **38,48** |

⚠️ **Mốc nền tự đo tái lập Y HỆT ba con số Phase 19 đã ghi** (11,33 · 19,18 · 36,31) ⇒ bảng Phase 19
**KHÔNG trôi**, và phép so này sạch. Đây đúng là thứ `TECH_DEBT #43` kê đơn sau khi 6/15 dòng của
bảng Phase 11 trôi trong im lặng — lần này nó nói "không trôi", và điều đó cũng đáng ghi ngang việc
nó bắt được một chỗ trôi.

### Tách ba dải của cặp yếu nhất (`bình minh 6h ↔ chiều 15h`) — VÀ ĐÂY MỚI LÀ PHẦN PHẢI ĐỌC

| dải | mốc nền `0abb272` | Phase 20 | đổi |
|---|---:|---:|---:|
| trời | 4,12 | **4,05** | **−0,07** |
| thành phố | 6,51 | **5,56** | **−0,95** |
| đất | 18,05 | **20,42** | **+2,37** |
| ⇒ gộp (RMS ba dải) | 11,33 | **12,44** | +1,11 |

⇒ **Toàn bộ phần đi lên nằm ở dải ĐẤT. Dải THÀNH PHỐ còn TỆ ĐI. Dải TRỜI đứng yên** — đúng như phải
thế, vì Phase 20 không chạm một dòng nào vào bầu trời. Nghĩa là `TECH_DEBT #89` qua được cổng nhờ
một dải **KHÔNG liên quan tới nguyên nhân**, chứ không phải vì chỗ hỏng được sửa; trời vẫn là dải
yếu nhất bảng (4,05, thấp hơn ngưỡng mắt ba lần) và cần gạt thật vẫn chưa được kéo.
⚠️ **Cơ chế vì sao dải ĐẤT mạnh lên thì CHƯA ĐƯỢC CHỨNG MINH.** Thứ duy nhất đo được là một tương
quan: số ô đường đi từ **80 cố định ở cả 15 kỷ** xuống **34…92, trung bình 59,7**. Đó là một ỨNG
VIÊN, không phải một kết luận — đừng chép nó thành nhân quả khi chưa bật/tắt để đo.

⚠️ **PHÉP ĐO BA DẢI PHẢI CHIA CHO SỐ DẢI TRƯỚC KHI LẤY CĂN.** `vecDist` là **RMS**, không phải tổng
Euclid (`sqrt(Σ/(n/3))`). Bản đầu của script tách dải quên vế chia và in ra **21,55** trong khi công
cụ thật in **12,44** — hai con số cho cùng một đại lượng. Nếu không truy tới cùng thì tôi đã gán sai
công lao cho từng dải, mà chính bảng phân dải này là thứ quyết định `#89` được đọc thế nào.

### Đối xứng bốn chiều — đo trên DỮ LIỆU QUY HOẠCH, không đo trên điểm ảnh

Lý do không đo trên ảnh: điểm ảnh là một **thứ đại diện** cho bố cục (`TECH_DEBT #22`), còn
`planIsRoad`/`planIsWonderZone` **chính là** thứ tầng dựng đọc để đặt đường và đặt kỳ quan.

Thang: **0% = đúng mức ngẫu nhiên** (một bộ xương ngẫu nhiên cùng mật độ đã tự khớp `p²+(1−p)²`),
**100% = đối xứng bốn chiều hoàn hảo**. Không quy về thang này thì con số thô không đọc được.

| bộ xương | đối xứng bốn chiều |
|---|---:|
| **CŨ — 4 khu kỳ quan ở góc** | **100,0%** (hoàn hảo — đây là mốc hiệu chuẩn của thang) |
| CŨ — cả 5 khu kỳ quan | 90,3% (khu tâm lệch một ô vì 12 là số chẵn) |
| CŨ — mạng đường `ROAD_LINES` | 55,0% |
| **MỚI — khu kỳ quan, cao nhất trong 15 kỷ** | **20,0%** (kỷ 4, `grid` — được phép) |
| **MỚI — khu kỳ quan, cao nhất trong các kỷ KHÔNG phải `grid`** | **9,6%** (kỷ 8) |

⇒ Thang tự chứng minh nó đo đúng thứ cần đo: thứ **thật sự** đối xứng hoàn hảo ra đúng 100,0%.

---


## Phase 19 — MỖI KỶ MỘT MẠNG ĐƯỜNG RIÊNG (2026-08-24 chiều, ADR-059)

> ⚠️ **ĐÍNH CHÍNH sau khi hợp nhất (Phase 21)**: lệnh tái lập dưới đây **KHÔNG chạy được nữa** —
> `buildRoadPlan` cùng năm bộ dựng khung đã bị xoá khi hợp nhất hai nhánh (ADR-064), vì bố cục nay
> do `buildCityPlan` (chia thửa đệ quy, ADR-066) quyết còn `arcTrace` chỉ lo HÌNH DẠNG của nét cắt.
> Bảng số bên dưới vẫn là bản ghi ĐÚNG của thời điểm nó được đo; đừng chép nó làm mốc nền cho một
> phase sau (bài học `TECH_DEBT #43`) — hãy tự đo lại.

> **Công cụ · Đầu vào · Đời ảnh** (luật §3-Q2, phải đủ cả ba thì một con số mới truy được nguồn):
> bảng dưới KHÔNG đo bằng ảnh — nó đo thuần trên `buildRoadPlan(era, getNetworkStyle(era)).cells`,
> chạy bằng Node, không cần Chromium. Vì vậy nó miễn nhiễm với nhiễu SwiftShader (`TECH_DEBT #50`)
> và với trần 4 MiB của ổ cắm CDP. Lệnh tái lập nằm ngay dưới bảng.

**Cột đọc thế nào.** *ô đường* = tổng ô mạng của kỷ ấy (trước ADR-059: **80 ô cho MỌI kỷ**).
*giao lộ* = ô có ≥3 nhánh (một mạng "dấu cộng" có đúng 1). *vòng* = `E − V + 1` trên đồ thị ô kề
cạnh — số chu trình độc lập, 0 nghĩa là mạng là một cái CÂY. *ô ngoài trục cũ* = ô KHÔNG nằm trên
bốn trục `x, y ∈ {0, 4, 8, 11}` của mạng bàn cờ cũ; **đây là cột trả lời thẳng câu của Đàm** *"làm
gì có đường dạng bàn cờ"*. *mảng 2×2* = số khối 2×2 toàn đường (một cái sân lát, không phải một
con đường) — **trước phép tỉa `tiaMangDuong` là 0…56 mỗi kỷ, tổng 250**.

| kỷ | plan | ô đường | đại lộ | ngõ | vành đai | giao lộ | vòng | ô ngoài trục cũ | mảng 2×2 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | organic | 45 | 18 | 27 | 0 | 5 | 0 | 25 | 0 |
| 2 | axial | 29 | 13 | 16 | 0 | 3 | 0 | 19 | 0 |
| 3 | axial | 43 | 13 | 13 | 17 | 10 | 3 | 24 | 3 |
| 4 | grid | 80 | 24 | 20 | 36 | 12 | 9 | 0 | 0 |
| 5 | radial | 55 | 21 | 13 | 21 | 14 | 5 | 24 | 4 |
| 6 | organic | 63 | 19 | 38 | 6 | 15 | 5 | 35 | 4 |
| 7 | organic | 63 | 15 | 34 | 14 | 12 | 4 | 33 | 4 |
| 8 | terrace | 60 | 16 | 14 | 30 | 8 | 0 | 30 | 0 |
| 9 | radial | 58 | 22 | 16 | 20 | 12 | 4 | 33 | 3 |
| 10 | terrace | 56 | 15 | 17 | 24 | 10 | 1 | 33 | 1 |
| 11 | grid | 83 | 34 | 15 | 34 | 16 | 7 | 8 | 0 |
| 12 | grid | 67 | 12 | 17 | 38 | 7 | 4 | 19 | 0 |
| 13 | organic | 61 | 16 | 38 | 7 | 14 | 4 | 29 | 4 |
| 14 | grid | 83 | 23 | 15 | 45 | 19 | 5 | 29 | 3 |
| 15 | axial | 41 | 12 | 21 | 8 | 6 | 0 | 26 | 0 |
| **tổng** | | **887** | **273** | **314** | **300** | **163** | **51** | **367** | **26** |

```
node --import ./scripts/register-esm-loader.mjs -e "
  import('./src/engine/roadPlan.js').then(async (R) => {
    const N = await import('./src/engine/city3d/networkStyle.js');
    for (let e = 1; e <= 15; e++) console.log(e, R.buildRoadPlan(e, N.getNetworkStyle(e)).cells.length);
  })"
```

**Ba con số đáng đọc nhất.**
- **15 kỷ ra 15 mạng KHÁC NHAU** (so bằng tập ô, có test `deepEqual` bắt) — trước là 1 mạng cho 15 kỷ.
- **Mặt tiền kỳ quan TỐT LÊN**: mạng bàn cờ cũ để **2/75** kỳ quan không có ô đường nào kề bên; mạng
  mới là **0/75**. Đây là điểm mạnh DUY NHẤT mà mạng cũ có (`cityLayout.js` ghi rõ lý do bốn trục
  `{0,4,8,11}` được chọn), nên nó là cột phải không được đi lùi.
- **Đất trống cho nhà dân 368 → 371 ô** — mạng mới thưa hơn ở phần lớn kỷ (29…83 ô so với 80 cố
  định), nhưng chênh lệch bị các kỷ dày (11 · 14) bù lại gần hết.

⚠️ **KHÔNG có bảng tam giác / lệnh vẽ ở đây, và đó là cố ý.** Mạng đường đổi thì số tam giác mặt
đường đổi theo số ô, tức nó là một hệ quả HIỂN NHIÊN của bảng trên chứ không phải một phép đo thêm
thông tin. Cổng thật cho lệnh vẽ là `drawCallBudget.test.js` (bảng 15 mốc riêng từng kỷ, ADR-028) và
nó vẫn xanh.

---

## Phase 18 — ĐƯỜNG PHỐ BIẾT UỐN CONG, VÀ MẠNG ĐƯỜNG CÓ BA HẠNG (2026-08-24, ADR-058)

⚠️ **Ba vế truy nguồn (luật §3-Q2)** — CÔNG CỤ · ĐẦU VÀO · ĐỜI ẢNH:
- **Công cụ**: `node scripts/city-preview.mjs --era 6 --hour 12 --width 1500 [--mask road]` ·
  `node --import ./scripts/register-esm-loader.mjs scripts/archive/road-bend.mjs`
- **Đầu vào**: kỷ 6 · 12 giờ · `--width 1500` · mặc định 40 phiên (ảnh) / 400 phiên (`road-bend`)
- **Đời ảnh**: vế TRƯỚC dựng trong `git worktree` tại `2f8e6f6`; vế SAU dựng ở cây làm việc sau khi
  đủ cả bẻ-cong lẫn hạng thứ ba. Hai lượt dựng bằng **cùng một dòng lệnh**, `cd` vào từng kho ở
  **lệnh riêng** (bài học "cd sống sót sang lệnh kế tiếp").

### Mặt đường đổi bao nhiêu — đo trong VÙNG MẶT ĐƯỜNG, không đo trên cả khung

| đại lượng | TRƯỚC | SAU |
|---|---:|---:|
| diện tích mặt đường nhìn thấy được (kỷ 6) | 14.493 px | 13.338 px (**−8,0%**) |
| chỉ có ở bản TRƯỚC | — | 4.011 px |
| chỉ có ở bản SAU | — | 2.856 px |
| **mặt đường ĐỔI CHỖ** | — | **6.867 px ≈ 47% diện tích của chính nó** |
| cả khung hình, vượt ngưỡng mắt 12 | — | 0,67% điểm ảnh |

⚠️ **ĐỘ CHÍNH XÁC CỦA CON SỐ ẤY LÀ HAI CHỮ SỐ, KHÔNG PHẢI BA — đã đo nhiễu chứ không đoán.** Dựng
lại mặt nạ kỷ 6 **hai lần trên CÙNG một cây mã** ra 13.520 và 13.338 điểm ảnh, tức **chênh 1,4%**
(SwiftShader chia ô rasterise theo số luồng dùng được — `TECH_DEBT #50`). Nhiễu 1,4% thì không thể
dựng ra một con số dịch chuyển 47%, nên KẾT LUẬN vững; nhưng viết "47,4%" là hứa một độ chính xác
phép đo không có. Ghi **≈47%**.

⚠️ **HAI CON SỐ CUỐI NÓI HAI CHUYỆN KHÁC NHAU, ĐỪNG TRỘN.** "0,67% cả khung" nghe như không có gì
xảy ra — nhưng mặt đường chỉ chiếm **1,38% khung hình** ở góc nhìn mặc định, nên mẫu số ấy pha loãng
tín hiệu gần 70 lần. Đây đúng hình dạng `TECH_DEBT #22`. Con số trả lời câu *"con đường có đổi
không"* là **≈47%**, với mẫu số là chính mặt đường (lấy qua mặt nạ `--mask road`, tức do bên DỰNG
khai chứ không đoán bằng màu).

### Độ lượn theo kỷ — `lệch tim đường ÷ bề rộng lòng đường`

Đo bằng `scripts/archive/road-bend.mjs`, **trên tam giác ĐÃ DỰNG** (không đọc lại bảng — một công cụ hỏi
lại chính nguồn mà mã sản phẩm dùng thì là một cái GƯƠNG, không phải một cái CÂN).

| kỷ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| trung bình | 0,739 | 0,148 | 0,137 | **0,000** | 0,488 | 0,542 | 0,163 | 0,169 | 0,100 | 0,065 | **0,000** | 0,004 | 0,182 | 0,008 | 0,032 |
| con lượn nhất | 1,263 | 0,225 | 0,318 | 0,000 | 0,952 | 1,225 | 0,378 | 0,356 | 0,247 | 0,109 | 0,000 | 0,010 | 0,343 | 0,011 | 0,060 |

**Kỷ 4 và 11 ra đúng 0,000 là ĐÚNG, không phải hỏng** — chúng khai `bend: 0` (Chang'an nhà Đường và
Commissioners' Plan 1811 của Manhattan), và `--selftest` của công cụ có một **đối chứng bắt buộc**
đòi kỷ 4 phải đo ra đúng 1,0000 độ uốn khúc: nếu phép đo lệch chỗ, chính ca ấy sẽ đỏ.

⚠️ **VÌ SAO 10 KỶ CÒN LẠI CHỈ LƯỢN NHẸ — ĐÂY LÀ MỘT CÁI TRẦN HÌNH HỌC, ĐÃ ĐO, KHÔNG PHẢI MỘT LỰA
CHỌN.** Chỗ trống để lượn là `0,5 − nửa bề rộng − vỉa hè`. Trần `lệch ÷ bề rộng` nếu đặt `bend: 1,00`
cho mọi kỷ:

| kỷ | 1 | 2 | 5 | 6 | 9 | 13 | 11 | 14 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| TRẦN (ngõ) | 1,197 | 0,728 | 0,978 | 1,404 | 0,772 | 0,346 | **0,110** | **0,138** |

Kỷ 11 và 14 **không thể** lượn quá ~0,12 lần bề rộng dù khai gì, vì lòng đường cộng vỉa hè của chúng
đã lấp gần trọn hành lang ô. Muốn nới thì cần gạt ĐÚNG là bề rộng/vỉa hè trong `streetStyle.js`,
**không phải** `EDGE_KEEP` hay phép kẹp.

### Giá phải trả

| | TRƯỚC | SAU |
|---|---:|---:|
| lệnh vẽ (kỷ 6, `--width 1500`) | 20 | **20 — KHÔNG ĐỔI** |
| tam giác mặt đường, kỷ 1 | 492 | 492 |
| tam giác mặt đường, kỷ 6 | 1.538 | 2.334 (**+52%**) |
| tam giác mặt đường, kỷ 9 | 1.816 | 2.964 (**+63%**) |
| tam giác mặt đường, kỷ 11 | 1.140 | 1.108 (−3%) |

⚠️ **MẶT ĐƯỜNG KHÔNG NẰM TRONG CON SỐ "tam giác thành phố" MÀ `city-preview` IN RA** — nó là một
khối riêng (`road`), không thuộc `city` (274.574) cũng không thuộc nền (44.126 = vòm trời 960 +
rặng núi 43.166). Suýt đọc nhầm điều này thành *"hạng thứ ba không có tác dụng"* vì con số tổng
đứng yên; phải đếm riêng bằng `buildRoadSurface(...).kinds` mới thấy. Mặt đường chiếm ~0,8% cảnh
nên +52% ở đó không đo được ở tổng.

### Thời gian dựng cảnh — đo CẢ HAI VẾ, vì ADR-048 đã dạy rằng cổng nào cũng có thể mù với nó

| | `npm run test:cross`, lượt sạch (không chạy gì song song) |
|---|---:|
| tại HEAD `2f8e6f6` (trong `git worktree` riêng) | **37.354 ms** |
| sau bản vá | **38.115 ms** (**+2,0%**) |

⚠️ **+2% NẰM TRONG NHIỄU — VÀ CON SỐ ~25 GIÂY GHI Ở `CLAUDE.md` LÀ CỦA MỘT MÁY KHÁC, KHÔNG PHẢI MỘT
HỒI QUY.** Lượt đo đầu tiên ra 38,1 giây làm tôi tưởng có hồi quy 50% so với mốc ~25 giây trong tài
liệu. Cách kiểm đúng không phải đi soi mã mà là **đo lại chính HEAD bằng cùng một lệnh trên cùng
cái máy này** — ra 37,4 giây. ⇒ *Một mốc thời gian chỉ so được với một mốc thời gian đo trên CÙNG
máy; đem so với một con số trong tài liệu là so hai máy khác nhau.* (Và lượt đo đầu của tôi còn
chạy chồng lên `npm run build` — đúng thứ mà luật "phép đo thời gian không được chồng lấn" cấm; kết
quả may mà không lệch, nhưng nó đã có thể lệch.)

**Lệnh vẽ không đổi vì mặt đường vẫn là MỘT khối** — ba hạng khác nhau ở bề rộng và ở màu ĐỈNH, mà
màu đỉnh thì không tính tiền lệnh vẽ. `drawCallBudget.test.js` xanh nguyên.

---

## Phase 15 — CƠ THỂ CƯ DÂN DỰNG BẰNG MẶT TRÒN XOAY (2026-08-23, ADR-055)

**CÔNG CỤ · ĐẦU VÀO · ĐỜI ẢNH** (ba vế bắt buộc, xem `CLAUDE.md`):

- Hình học: `node --import ./scripts/register-esm-loader.mjs scripts/scene-tri.mjs` (mặc định
  **40 phiên · cấp 3 · giờ 12 · chuỗi 9**) — chạy trên **cả hai** cây mã, cây "trước" là một
  `git worktree` ở commit **`f5a4e11`** đặt tại `/private/tmp/dc-base`.
- Neo Chromium: `node scripts/city-preview.mjs --era 1 --hour 12 --bench 1` → khối `[stats]` in
  **`| lệnh vẽ | 11 | 2 | 13 | 13 |`** và **`| tam giác | 110.110 | 44.126 | 154.236 |`**, khớp
  **từng đơn vị** với dòng kỷ 1 của bảng dưới. Không có vế neo này thì bảng chỉ là một công thức
  tự soi gương — đúng lỗi mà chính phase này đi sửa (xem mục "hằng số sai +1" bên dưới).
- Ảnh so trước/sau: `.city-preview/city-era01-light-h12-s80.png` ở cả hai cây, dựng **nối tiếp
  nhau trên máy rảnh** (nhiễu SwiftShader ±1 phụ thuộc tải máy — `TECH_DEBT #50`), ngày 2026-08-23.

### Hình học — 15/15 kỷ, trước ↔ sau

| kỷ | tam giác TP trước | sau | Δ | lệnh vẽ TP trước | sau | Δ | khuôn cơ thể |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 104.958 | 110.110 | +5.152 | 8 | 11 | +3 | 4 |
| 2 | 129.656 | 134.808 | +5.152 | 11 | 15 | +4 | 5 |
| 3 | 141.056 | 145.760 | +4.704 | 11 | 15 | +4 | 5 |
| 4 | 189.694 | 194.846 | +5.152 | 11 | 14 | +3 | 4 |
| 5 | 120.614 | 125.766 | +5.152 | 11 | 15 | +4 | 5 |
| 6 | 226.788 | 231.378 | +4.590 | 11 | 16 | +5 | 6 |
| 7 | 196.316 | 201.916 | +5.600 | 12 | 16 | +4 | 5 |
| 8 | 167.444 | 173.492 | +6.048 | 12 | 17 | +5 | 6 |
| 9 | 159.562 | 164.714 | +5.152 | 11 | 13 | +2 | 3 |
| 10 | 135.434 | 141.034 | +5.600 | 12 | 16 | +4 | 5 |
| 11 | 158.786 | 164.386 | +5.600 | 10 | 13 | +3 | 4 |
| 12 | 136.390 | 141.990 | +5.600 | 10 | 13 | +3 | 4 |
| 13 | 166.676 | 170.780 | +4.104 | 10 | 12 | +2 | 3 |
| 14 | 176.326 | 179.998 | +3.672 | 10 | 12 | +2 | 3 |
| 15 | 146.508 | 151.212 | +4.704 | 10 | 13 | +3 | 4 |

⚠️ **CỘT LỆNH VẼ KHỚP `số khuôn − 1` Ở CẢ MƯỜI LĂM DÒNG, KHÔNG MỘT NGOẠI LỆ.** Một
`InstancedMesh` chỉ mang được một hình học, nên gom khối theo khuôn ⇒ cư dân tiêu đúng
`humanShapesUsed(era).length` lệnh vẽ thay vì 1. Đây là một **khoản chi có thật**, chấp nhận theo
lời Đàm 2026-08-21 (*"không quan trọng hiệu năng, máy tôi là M3"*).

⚠️ **CỘT TAM GIÁC CÓ MỘT PHÉP ĐỐI CHIẾU CHÉO ĐẸP HƠN CẢ CON SỐ.** Chia `Δ` cho
`humanBodyTriangles(era) − 12 × (số khối − 2)` thì **cả 15 kỷ ra một SỐ NGUYÊN**: **28,000** ở 12
kỷ và **27,000** ở kỷ 6 · 13 · 14. Số nguyên ấy chính là **số cư dân** của kỷ đó (tuyến đi bám
mạng đường, mà mạng đường thì đổi theo kỷ). Nếu `humanBodyTriangles` (tầng thuần) lệch dù chỉ một
tam giác so với thứ cảnh thật dựng ra, phép chia này sẽ ra một số lẻ ở đâu đó. Không có chỗ nào lẻ.

### Ngân sách cư dân — chấm TỪNG KỶ, không chấm ở kỷ 1 rồi suy

| | trước | sau |
|---|---|---|
| tam giác mỗi người | 84…108 (= 12 × số khối) | **220…324** |
| ca xấu nhất (tam giác cư dân ÷ cả cảnh) | ~2,0% | **5,40% — kỷ 1** (trần 6%, biên còn 10,0%) |
| trần khối/người | 11 (Đàm chốt) | **11, GIỮ NGUYÊN** |

⚠️ **"KỶ 1 LÀ CA XẤU NHẤT" THÔI LÀ MỘT LẬP LUẬN, NAY LÀ MỘT KẾT LUẬN.** Lý lẽ cũ (*"cư dân tốn một
lượng CỐ ĐỊNH nên tỉ lệ cao nhất ở kỷ có mẫu số nhỏ nhất"*) đứng trên tiền đề **"tử số cố định"**,
mà từ bản này mỗi kỷ dựng một cơ thể khác nhau (220…324, chênh 1,47 lần). Ca xấu nhất nay là `max`
của một tỉ số hai đại lượng **cùng biến thiên** ⇒ phải tính đủ 15 dòng mới biết nó ở đâu. Kết quả
vẫn là kỷ 1, nhưng nay ta BIẾT thế chứ không SUY thế. (Bài học Phase 8C: *một kết luận đúng có thể
hết đúng mà không ai động vào nó, vì TIỀN ĐỀ của nó bị gỡ ở một phase khác*.)

### Hai con số ngân sách đã lạc hậu, và cả hai đều im lặng

**(1) Trần tam giác trong `human.js` lạc hậu 5,4 lần — THEO HƯỚNG SIẾT.** Nó tính "136 tam giác
mỗi người" từ mẫu số *"kỷ 1 = 19.434 tam giác thành phố"*; kỷ 1 nay là **104.958** (Phase 14 §1(3)
làm mỗi ô thành một khu phố). Trần thật: **319**. ⚠️ Một trần lạc hậu theo hướng **nới** thì sớm
muộn có người kêu máy giật; lạc hậu theo hướng **siết** thì **im lặng vĩnh viễn** — nó không làm
gì hỏng, nó chỉ làm một hướng đi tốt trông như đã bị cấm.

**(2) `TAM_CO_DINH_KHO = 4` sai +1 ở CẢ 15 KỶ kể từ ADR-053 (2026-08-22).** Hằng số ấy đếm cư dân
là HAI mesh (thân + đầu) đúng như mô hình hai hộp thời trước; ADR-053 gộp chúng làm một và tiết
kiệm thật một lệnh vẽ, hằng số thì đứng yên. ⚠️ **Vì sao không có gì đỏ lên:** bài test so
`hoVatLieu(era).length + tamCoDinh(era)` với bảng `MOC_LENH_VE` — mà bảng ấy **được suy ra từ
chính công thức đó**. Hai vế cùng chứa một hằng số sai nên chúng khớp nhau hoàn hảo trong khi cùng
lệch khỏi thực tế. Đó là *"một ngân sách tự tính mà chưa bao giờ được đặt cạnh sự thật"* tái diễn
**trong chính file sinh ra để chống trôi âm thầm**. Cách vá không phải đổi 4 thành 3 (lại một hằng
số chờ trôi) mà là **hỏi thẳng thứ đang đếm**: `humanShapesUsed(era).length`, cộng ba cái neo
Chromium (kỷ 1 · 8 · 13 → 11 · 17 · 12).

### Đàm có THẤY không — hai con số, và chúng nói hai chuyện khác nhau

Cùng một cặp ảnh (`--era 1 --hour 12 --sessions 80`, khung app 1100×700, ngưỡng mắt 12/255):

| phạm vi đo | điểm ảnh đổi quá ngưỡng mắt | lệch trung bình |
|---|---:|---:|
| **cả khung hình** | **0,2%** | 0,09 |
| **chỉ điểm ảnh cư dân** (mặt nạ `--mask residents`, 2.198 điểm = 0,29% khung) | **57,5%** | **22,26** |

⚠️ **ĐỌC ĐÚNG HAI DÒNG NÀY.** Dòng trên KHÔNG nói "bản vá vô dụng" — nó nói cư dân chiếm 0,29%
khung hình, nên bất cứ thứ gì xảy ra với họ cũng không thể dịch được con số toàn khung. Dòng dưới
mới là câu trả lời: **ở đúng chỗ cư dân đứng, hơn một nửa số điểm ảnh đổi quá ngưỡng mắt, và lệch
trung bình gần gấp đôi ngưỡng**. Đây là bài học Phase 11 áp dụng đúng chiều: *bản quét 15 kỷ chỉ
dùng để canh KHÔNG-TRÔI, không dùng để chứng minh một phase chi tiết có tác dụng*.

⚠️ Và theo luật Đàm ra 2026-08-18 (HỆ QUẢ 2b), câu trả lời phải nói TRƯỚC chứ không bào chữa sau:
**đây là công việc cho khung CẬN CẢNH** (`ADR-034` cho camera bay tới khi chạm công trình) và cho
dải `human-strip.mjs` phóng 5 lần. Ở khung toàn cảnh, một cư dân cao 12–30 điểm ảnh thì 8 mảng
sáng và 3 mảng sáng chênh nhau dưới ngưỡng mắt — điều đó đã biết trước khi viết dòng mã đầu tiên.

---

## Phase 17 — CHÂN CÓ ĐẦU GỐI THẬT, GIẢI BẰNG KHỚP NGƯỢC (2026-08-24 tối, ADR-057)

**CÔNG CỤ · ĐẦU VÀO · ĐỜI ẢNH** (ba vế bắt buộc, xem `CLAUDE.md`):

- Hình học: `node --import ./scripts/register-esm-loader.mjs scripts/scene-tri.mjs --sessions 80`
  (giờ 12 · cấp 3 · chuỗi 9). Cột "trước" là bảng **Phase 16** ngay bên dưới, đo bằng ĐÚNG lệnh
  này ở cùng fixture — nên lần này việc dùng lại nó **không** phạm `TECH_DEBT #43`; điều kiện là
  hai vế cùng lệnh, cùng `sessionCount`, cùng cấp. Đã kiểm bằng một phép đối chiếu độc lập: khuôn
  `calf` có mặt ở cả 15 kỷ và lệnh vẽ nhích đúng +1 ở cả 15 kỷ.
- Neo Chromium (lệnh vẽ): `node scripts/city-preview.mjs --era N --hour 12 --sessions 40 --level 1
  --bench 1 --no-shadow` ⇒ kỷ **1 = 15** · kỷ **8 = 21** · kỷ **13 = 16** lệnh vẽ CẢ KHUNG, tức
  **13 · 19 · 14** cho riêng thành phố (trừ vòm trời + rặng núi). Khớp từng đơn vị với `scene-tri`
  ở cùng fixture, bằng một đường đo hoàn toàn độc lập.
- Neo Chromium (tam giác): `--era 1 … --sessions 40 --level 1` ⇒ **152.558** tam giác thành phố,
  và `scene-tri.mjs` ở cùng fixture cũng ra **152.558**.
- Ảnh: `.city-preview/human-strip-ky1-15.png`, dựng lại sạch lúc **21:42 ngày 2026-08-24**.

### Tam giác thành phố — 15 kỷ, 80 phiên

| kỷ | trước (Phase 16) | sau (ADR-057) | chênh | % |
|---:|---:|---:|---:|---:|
| 1 | 107.262 | 149.710 | **+42.448** | +39.6% |
| 2 | 132.088 | 177.224 | **+45.136** | +34.2% |
| 3 | 143.094 | 185.766 | **+42.672** | +29.8% |
| 4 | 193.994 | 238.234 | **+44.240** | +22.8% |
| 5 | 126.308 | 171.444 | **+45.136** | +35.7% |
| 6 | 228.880 | 273.792 | **+44.912** | +19.6% |
| 7 | 207.592 | 251.384 | **+43.792** | +21.1% |
| 8 | 182.256 | 227.168 | **+44.912** | +24.6% |
| 9 | 169.770 | 214.010 | **+44.240** | +26.1% |
| 10 | 153.404 | 198.764 | **+45.360** | +29.6% |
| 11 | 183.826 | 227.618 | **+43.792** | +23.8% |
| 12 | 154.216 | 199.576 | **+45.360** | +29.4% |
| 13 | 186.556 | 228.108 | **+41.552** | +22.3% |
| 14 | 194.840 | 233.928 | **+39.088** | +20.1% |
| 15 | 173.520 | 217.536 | **+44.016** | +25.4% |
| **tổng** | **2,537,606** | **3,194,262** | **+656,656** | **+25.9%** |

### Cơ thể mỗi kỷ

| kỷ | khối/người | tam giác/người | × 28 cư dân | % tam giác cảnh |
|---:|---:|---:|---:|---:|
| 1 | 18 | 1.808 | 50.624 | 26.12% |
| 2 | 18 | 1.904 | 53.312 | 24.08% |
| 3 | 17 | 1.788 | 50.064 | 21.78% |
| 4 | 17 | 1.860 | 52.080 | 18.44% |
| 5 | 18 | 1.904 | 53.312 | 24.73% |
| 6 | 18 | 1.882 | 52.696 | 16.58% |
| 7 | 17 | 1.860 | 52.080 | 17.62% |
| 8 | 18 | 1.928 | 53.984 | 19.90% |
| 9 | 18 | 1.872 | 52.416 | 20.31% |
| 10 | 18 | 1.928 | 53.984 | 22.23% |
| 11 | 17 | 1.860 | 52.080 | 19.17% |
| 12 | 18 | 1.928 | 53.984 | 22.15% |
| 13 | 17 | 1.732 | 48.496 | 17.81% |
| 14 | 16 | 1.616 | 45.248 | 16.27% |
| 15 | 17 | 1.836 | 51.408 | 19.65% |

**Lệnh vẽ: +1 ở CẢ 15 KỶ, không ngoại lệ.** Con số 1 ấy có tên — khuôn `calf` (cẳng chân) là một
`InstancedMesh` nữa. Không kỷ nào +2 (nghĩa là còn thứ khác đi ké), không kỷ nào +0 (nghĩa là kỷ ấy
chưa nhận bản vá). `drawCallBudget.test.js` canh vế này bằng một phép trừ riêng
(`MOC_TRUOC_KHOP_NGUOC`), không cộng dồn vào phép trừ của mặt nước hay của vùng phụ cận.

### Hai trần đã nâng, và vì sao đó không phải một cái phễu

| trần | trước | sau | căn cứ |
|---|---:|---:|---|
| khối / người | 11 | **18** | Đàm thu hồi tường minh: *"có thể vẽ thêm tam giác/khối mỗi ngưới tới lúc nó bo tròn"*. Trần cũ có lý lẽ đúng (*"ở cỡ 18 px thì khối thứ 12 không đọc ra"*) nhưng lý lẽ ấy nói về khung TOÀN CẢNH, mà ADR-034 đã thêm lối đưa mắt tới gần từ lâu. Tiền đề đổi trước, lệnh thu hồi tới sau. |
| % tam giác cảnh | 11% | **30%** | Ca xấu nhất ĐO ĐƯỢC là **kỷ 1 = 26,12%**; 30% chừa **12,9% biên** — đủ cho một chi tiết nhỏ về sau, không đủ để cơ thể lặng lẽ to gấp rưỡi. |
| tam giác / người (tuyệt đối) | 640 | **2.100** | Số đo hôm nay (1.928) cộng đúng một khuôn `limb` dự phòng (116). Trần tuyệt đối này tồn tại để một phase sau làm thành phố nặng thêm **không tự động cấp thêm quota** cho cư dân. |

Bốn căn cứ để tin là an toàn, xếp từ mạnh xuống yếu: **(1)** đo trên chính MacBook Air M3 của Đàm,
cảnh chậm nhất **5,20 ms** trên trần 16,67 ms ⇒ dư **3,2 lần**, và mô hình chi phí là *"≈ 0,87 ms
cố định + 1,14 ms mỗi TRIỆU ĐIỂM ẢNH THẬT"* ⇒ **80% chi phí đi theo ĐIỂM ẢNH, không theo tam
giác** (bằng chứng trực tiếp: tam giác chênh 43% giữa kỷ 3 và kỷ 11 mà thời gian chỉ chênh 2,4%);
**(2)** cư dân **không đổ bóng**, nên họ không tốn gì ở lượt dựng bản đồ bóng — lượt đắt nhất mà
hình học phải trả; **(3)** Đàm gỡ cổng hiệu năng ngày 2026-08-21; **(4)** lệnh vẽ chỉ +1, và lệnh
vẽ mới là thứ đắt trên GPU tích hợp.

⚠️ **GIỚI HẠN PHẢI NÓI THẲNG: ms mỗi khung CHƯA ĐO LẠI.** Hộp cát dựng bằng SwiftShader (bộ tô hình
chạy trên CPU), mà luật của dự án là *"một con số đo trong hộp cát chỉ được dùng để so các trường
hợp TRONG hộp cát ấy"*. Bốn căn cứ trên đều là suy từ phép đo **CŨ** trên máy thật, không phải phép
đo **MỚI**. Muốn xác nhận: `bash scripts/bench-macbook.sh` trên máy Đàm.

### Dáng đi — số đo

- **Trượt chân**: **4,86 × 10⁻¹⁷ ô** trên 210 tổ hợp (14 kiểu × 15 kỷ). Đây là sai số dấu phẩy
  động, không phải một dung sai — bàn chân đứng yên **theo cấu tạo**, vì nó là ĐẦU VÀO của phép
  giải khớp ngược.
- **`reach`** (tỉ số hông→bàn chân trên tổng chiều dài xương): cao nhất **0,9928** ở kỷ 12
  (`march`, sải chân dài nhất bảng). Nhánh kẹp của `solveTwoBone` vì vậy **chưa bao giờ chạy** —
  và đúng vì thế phải có một bài test bơm `stride: 5` chứng minh nó vẫn còn hoạt động.
- **Nâng bàn chân lúc đưa**, theo % chiều dài chân: 12 · 6 · 7 · 4 · 16 · 10 · 10 · 9 · 11 · 3 ·
  13 · 22 · 8 · 2 · 6. Thấp nhất là kỷ 14 (`shuffle` — lê chân, đúng như khai `lift: 0.02`), cao
  nhất là kỷ 12 (`march` — bước duyệt binh).
- **Gối gập**: −84,3° tới −13,8° qua 15 kỷ. Dấu luôn ÂM ⇒ gối không bao giờ bẻ ngược.
- **Bảng dáng đi**: 14 kiểu · 91 cặp · cặp gần nhau nhất vẫn khác **3/6 trường**.

---

## Phase 16 — DÁNG ĐI THÀNH MỘT TRỤC BẢN SẮC, VÀ KHUÔN CƠ THỂ HẾT PHẲNG (2026-08-24, ADR-056)

**CÔNG CỤ · ĐẦU VÀO · ĐỜI ẢNH** (ba vế bắt buộc, xem `CLAUDE.md`):

- Hình học: `node --import ./scripts/register-esm-loader.mjs scripts/scene-tri.mjs --sessions 80`
  (giờ 12 · cấp 3 · chuỗi 9) — chạy trên **cả hai** cây mã trong cùng một phiên, trên máy rảnh,
  **nối tiếp nhau**. Cây "trước" là một `git worktree --detach` ở commit **`4ce0fee`** đặt tại
  `/private/tmp/dc-base16`. ⚠️ Bảng này **KHÔNG** chép cột "sau" của Phase 15: cột ấy đo ở
  **40 phiên**, còn bảng này ở **80 phiên**, mà mạng đường và số nhà dân mở dần theo `sessionCount`
  ⇒ chép sang là dựng lại đúng `TECH_DEBT #43`.
- Neo Chromium: `node scripts/city-preview.mjs --era 1 --hour 12 --sessions 80 --level 3 --bench 1`
  → khối `[stats]` in **14 lệnh vẽ cả khung** = **12 lệnh vẽ thành phố + 2** (vòm trời + rặng núi
  chân trời). ⚠️ Con số Chromium in ra là số của **CẢ KHUNG**, không phải của riêng thành phố —
  nhãn cũ trong `drawCallBudget.test.js` từng ghi *"Chromium đo 11 lệnh vẽ thành phố"* và đó là một
  lỗi NHÃN (cùng họ `frame-fit.mjs`, Phase 7B), đã sửa.
- Cơ thể: `buildHumanBody(era)` + `shapeTriangles` (thuần, không Chromium).
- Ảnh: `.city-preview/human-strip-ky1-15.png` (dải 15 kỷ, phóng 5 lần), dựng 2026-08-24 bằng
  `node --import ./scripts/register-esm-loader.mjs scripts/human-strip.mjs`.

### Hình học cả cảnh — 15/15 kỷ, trước ↔ sau (80 phiên)

| kỷ | tam giác TP trước | sau | Δ | lệnh vẽ TP trước | sau | Δ |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 107.262 | 114.430 | +7.168 | 11 | 12 | +1 |
| 2 | 132.088 | 141.048 | +8.960 | 15 | 16 | +1 |
| 3 | 143.094 | 151.158 | +8.064 | 15 | 16 | +1 |
| 4 | 193.994 | 202.954 | +8.960 | 14 | 15 | +1 |
| 5 | 126.308 | 135.268 | +8.960 | 15 | 16 | +1 |
| 6 | 228.880 | 237.840 | +8.960 | 16 | 17 | +1 |
| 7 | 207.592 | 216.104 | +8.512 | 16 | 17 | +1 |
| 8 | 182.256 | 190.768 | +8.512 | 17 | 18 | +1 |
| 9 | 169.770 | 178.730 | +8.960 | 13 | 14 | +1 |
| 10 | 153.404 | 162.364 | +8.960 | 16 | 17 | +1 |
| 11 | 183.826 | 192.338 | +8.512 | 13 | 14 | +1 |
| 12 | 154.216 | 163.176 | +8.960 | 13 | 14 | +1 |
| 13 | 186.556 | 194.620 | +8.064 | 11 | 12 | +1 |
| 14 | 194.840 | 202.008 | +7.168 | 12 | 13 | +1 |
| 15 | 173.520 | 182.480 | +8.960 | 13 | 14 | +1 |
| **tổng** | **2.537.606** | **2.665.286** | **+127.680** | | | |

⚠️ **Cột lệnh vẽ đúng +1 ở CẢ 15 KỶ, và đó là một phép kiểm chứ không phải một sự trùng hợp.** Số
lệnh vẽ cư dân = **số khuôn cơ thể kỷ ấy dùng** (một `InstancedMesh` mỗi khuôn, ADR-055). Phase 16
thêm đúng MỘT khuôn (`chest`, cho thân và cho áo may đo), và `chest` có mặt ở mọi kỷ ⇒ +1 ở mọi
kỷ. Nếu một kỷ nào ra +0 hoặc +2 thì hoặc bảng sai, hoặc `chest` chưa tới được kỷ đó.

### Cơ thể — mỗi người, 15/15 kỷ

| kỷ | khối | tam giác/người trước | sau | kỷ | khối | trước | sau |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 11 | 292 | **548** | 9 | 11 | 292 | **612** |
| 2 | 11 | 292 | **612** | 10 | 11 | 292 | **628** |
| 3 | 10 | 264 | **552** | 11 | 10 | 264 | **600** |
| 4 | 10 | 264 | **600** | 12 | 11 | 292 | **628** |
| 5 | 11 | 292 | **612** | 13 | 10 | 264 | **536** |
| 6 | 11 | 292 | **598** | 14 | 9 | 220 | **476** |
| 7 | 10 | 264 | **600** | 15 | 10 | 264 | **584** |
| 8 | 11 | 292 | **628** | | | | |

- **Số khối mỗi người: 9…11 — KHÔNG đổi một đơn vị.** Trần Đàm đặt (*"ở cỡ 18 px thì hộp thứ 12
  không đổi được điểm ảnh nào"*) còn nguyên. Toàn bộ phần thêm là **vành khuôn**, không phải khối.
- Tam giác mỗi người **220…324 → 476…628** (≈ ×1,9).

### Trần tỉ lệ: 6% → 11%, và vì sao được phép nâng

Ca xấu nhất (tỉ lệ tam giác cư dân trên tổng tam giác cảnh, tính đủ 15 dòng vì mỗi kỷ một cơ thể
khác nhau): **kỷ 1 = 5,40% → 9,68%** (28 cư dân × 548 tam giác ÷ 158.556 tam giác cả cảnh).

Bốn bằng chứng, ghi ra để phiên sau kiểm lại được chứ không phải để trấn an:

1. Đàm đã **thu hồi cổng hiệu năng** ngày 2026-08-21: *"không quan trọng hiệu năng"* ·
   *"Máy tôi là M3 MacBook Air chứ có yếu đâu"*.
2. `PERFORMANCE.md` (đo trên máy thật, Apple M3): **hình học thì RẺ** — tam giác thành phố chênh
   43% giữa kỷ 3 và kỷ 11 mà thời gian chỉ chênh 2,4%; **80% chi phí đi theo ĐIỂM ẢNH**, mà Phase
   16 không thêm một điểm ảnh nào (cư dân vẫn chiếm 0,29% khung).
3. Phase 16 thêm **0 nguồn sáng**, và ánh sáng mới là thứ đo được (bật đèn 22h = +19%).
4. Tổng tam giác cả 15 kỷ tăng **5,0%** (2,54 triệu → 2,67 triệu), trong khi ngân sách đo được còn
   dư **3,2 lần**.

⚠️ **GIỚI HẠN PHẢI NÓI THẲNG: `ms` mỗi khung CHƯA được đo lại.** Hộp cát chỉ có SwiftShader (bộ tô
hình bằng CPU), và luật của dự án là *một con số đo trong hộp cát chỉ được dùng để so các trường
hợp TRONG hộp cát ấy với nhau*. Vì vậy 11% là một trần theo **TỈ LỆ HÌNH HỌC**, không phải một lời
hứa về tốc độ. Ai chạy được `bash scripts/bench-macbook.sh` trên MacBook của Đàm thì nên đo lại và
ghi số thật vào đây.

### Dáng đi — bàn chân rời đất bao nhiêu

Đo bằng `humanGait.test.js` (thuần, 135 tổ hợp kỷ × kiểu đi). Độ nâng bàn chân lúc đưa chân, tính
theo phần trăm chiều dài chân:

| kiểu đi | trudge | mince | glide | saunter | roll | bounce | stride | bustle | march |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| nâng bàn chân | 5% | 8% | 12% | 16% | 18% | 20% | 26% | 30% | 34% |

Thứ tự này **khớp đúng thứ tự của `knee`** (có test đòi), nên nó không phải chín con số rời rạc mà
là một trục có hướng. Ba bất biến vẫn ở mức sai số máy: bàn chân trượt **1,39e-17 ô** · `|foot.y|`
lúc trụ **1,39e-17** · vượt trần góc hông **5,55e-17**.

⚠️ **Đối chứng: chân CỨNG ĐƠ nâng đúng 0%** — không phải "gần 0", mà bằng 0 theo cấu tạo (hông ở
`legLen·cos 0`, chân đưa thẳng đứng dài `legLen` ⇒ bàn chân ở y = 0). Đó là lý do một mesh cứng
không co gối **buộc phải** trông như robot, và là lý do con số 0% ở trên là một cái cân chứ không
phải một dòng thừa.

### Bản sắc dáng đi

36 cặp trong 9 kiểu đi, mỗi cặp so 4 trường: **cả 36 cặp khác nhau ở 4/4 trường**. Không kỷ liền
nhau nào dùng chung một kiểu, và cả 9 kiểu đều được ít nhất một kỷ dùng (có test khoá cả ba).


## Phase 19 — BẢN QUÉT 15 KỶ: TÁCH MỘT BIẾN ĐỂ BIẾT VIỆC NÀO TIÊU TIỀN (2026-08-24, ADR-062/063/061)

> ⚠️ **KHÔNG PHẢI ĐO HIỆU NĂNG.** Chỉ thị Phase 19 ghi rõ *"Không đo hiệu năng"*, và mục này tuân
> thủ: mọi con số dưới đây là **khoảng cách MÀU trên ảnh dựng** (thang RGB/255, ngưỡng mắt 12), đo
> bằng SwiftShader trong hộp cát. Không có một mili-giây nào ở đây, và **đừng suy ra** một cái nào.

**Ba vế của một con số nghiệm thu — CÔNG CỤ · ĐẦU VÀO · ĐỜI ẢNH** (luật §3-Q2):

- **Công cụ**: `node scripts/city-preview.mjs --sweep --all --theme light`
  rồi `node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png`
- **Đầu vào**: mặc định của `--sweep` (15 kỷ × 6 chặng · `--cell 300` · 80 phiên · theme sáng).
  Ảnh ra 1864×3154, ô 300×186, gốc (60,30) — cả ba lượt **cùng một hồ sơ hình học**.
- **Đời ảnh**: dựng ngày 2026-08-24, mỗi vế trong một cây mã RIÊNG, `md5` ghi kèm để không lẫn.

### Ba lượt quét, ba cây mã — và đó là toàn bộ giá trị của bảng này

| cây mã | `md5` ảnh quét | trục CHẶNG | trục KỶ | trung vị kỷ |
|---|---|---:|---:|---:|
| **mốc nền** `be9d2ea` (tự đo, KHÔNG chép của phase trước) | `1e08cedb…` | **14,39** ✓ | 22,13 ✓ | 38,59 |
| Phase 19 **trừ** `orbit.js` — đủ VIỆC 1+2+3+4 | `41346d18…` | **14,23** ✓ | 21,24 ✓ | 38,67 |
| Phase 19 **đủ** (thêm VIỆC 5) | `b58408b0…` | **11,33** ✗ | 19,18 ✓ | 36,31 |

⇒ **Bốn việc mỹ thuật cộng lại tiêu 0,16. Phép lùi khung hình một mình tiêu 2,90.** Không có phép
tách một biến này thì cả −3,06 sẽ bị gán cho "Phase 19" nói chung, và phiên sau sẽ đi sửa nhầm chỗ.

⚠️ **Mốc nền được TỰ ĐO trong một `git worktree` ở đúng `be9d2ea`**, không chép cột "sau" của Phase
14 — đúng `TECH_DEBT #43`. Nó khớp con số `CLAUDE.md` đang ghi (14,39) tới hai chữ số, còn trục kỷ
lệch nhẹ (22,13 so với 22,09 · 38,59 so với 38,34) trong khoảng nhiễu SwiftShader (`TECH_DEBT #50`).

### Tách ba dải của đúng cặp yếu nhất (`bình minh 6h ↔ chiều 15h`)

| dải | mốc nền | Phase 19 đủ | đổi |
|---|---:|---:|---:|
| trời | 8,38 | **4,12** | −4,26 |
| thành phố | 10,74 | **6,51** | −4,23 |
| đất | 20,88 | **18,05** | −2,83 |

⇒ Đất vẫn khoẻ **gấp bốn lần** trời. **Cần gạt để nâng trục chặng nằm ở BẦU TRỜI lúc 6h so với 15h**
— xác nhận lại kết luận `CLAUDE.md` đã ghi sau Phase 14 §1(3), bằng một bộ số mới. Và nó **bác bỏ
lần thứ hai** chỉ thị cũ *"làm vùng quê đổi theo giờ"*: vùng quê nằm ở dải ĐẤT, dải đang mạnh nhất.

⚠️ **12/15 cặp chặng THẬT SỰ TỐT LÊN** (ví dụ `bình minh ↔ hoàng hôn` 23,17 → 32,75). Chỉ ba cặp
dạng *bình minh/sáng ↔ giữa ngày* đi xuống. Đọc mỗi con số gộp "11,33" sẽ tưởng cả bảng xấu đi.

### VIỆC 4 (AO) — cặp ảnh cùng một cây mã, `--no-ao` là đối chứng

`node scripts/city-preview.mjs --era N --hour 12 --sessions 80 --width 1500 [--no-ao]`

| kỷ | điểm ảnh đổi quá ngưỡng mắt | lệch (mọi điểm ảnh) | lệch (chỉ chỗ đã đổi) |
|---|---:|---:|---:|
| 2 | 2,8% | 1,95 | **15,87** |
| 6 | 4,1% | 2,61 | **16,55** |
| 11 | 2,2% | 1,09 | **15,90** |

⚠️ **Phải đọc cột CUỐI.** AO là hiệu ứng CỤC BỘ (chỉ ở góc lõm), nên cột "mọi điểm ảnh" tất yếu
thấp — đọc mỗi cột ấy rồi kết luận "vô hình" chính là cái sai của Phase 11. Lệnh vẽ và tam giác
**không đổi một đơn vị** ở cả hai phía (kỷ 6 = 13 · kỷ 11 = 12), vì AO nướng vào MÀU ĐỈNH.

### VIỆC 3 (bản đồ bóng 2048 → 4096) — cặp ảnh khác nhau ĐÚNG một hằng số

Cây đối chứng chép nguyên cây làm việc rồi hạ `SHADOW_MAP_DESKTOP` về 2048; `diff` xác nhận **đúng
một dòng khác nhau**. `--hour 15` (nắng xiên, bóng dài — chỗ độ phân giải bản đồ bóng tính tiền).

| kỷ | điểm ảnh đổi quá ngưỡng mắt | lệch (mọi điểm ảnh) | lệch (chỉ chỗ đã đổi) |
|---|---:|---:|---:|
| 6 | 0,3% | 0,23 | **16,33** |
| 11 | 0,2% | 0,15 | **16,07** |

⇒ Có thật, và **rất cục bộ**: nó chỉ đổi một vệt mỏng dọc theo MÉP bóng. Ở khung toàn cảnh gần như
không thấy; đây là phần thưởng khi nhìn GẦN — đúng luật Đàm ra ở Phase 11 HỆ QUẢ 2b.

⚠️ **Nửa sau của chỉ thị VIỆC 3 — "siết `sun.shadow.camera` từ `reach` xuống phạm vi thành phố" —
ĐÃ ĐO VÀ BÁC BỎ**: `reach` (9,00) ĐÃ LÀ phạm vi thành phố. Khối đổ bóng xa nhất trên cả 15 kỷ nằm ở
bán kính **8,48** (kỷ 9) ⇒ chỗ dư đúng **6%**. Siết thêm là bắt đầu cắt cụt bóng của nhà ở góc lưới.

> ⚠️ **CẬP NHẬT 2026-08-24 (Phase 20) — CHỖ DƯ 6% ẤY ĐÃ BỊ TIÊU HẾT, VÀ ĐÓ LÀ MỘT LỖI HÌNH ẢNH
> THẬT.** Thửa đất nay chạm được tới vành ngoài lưới, nên khối đổ bóng xa tâm nhất đi từ **8,4836
> lên 9,2275** — tức **vượt qua** `reach = 9,00`, và nhà ở góc lưới bắt đầu **mất bóng**. Không có
> gì đỏ lên trên màn hình; thứ bắt được là bài đo hộp bao ở `sceneStats.test.js`.
> ⇒ Đã **NỚI** `reach` từ `gridSize × 0,75` lên `gridSize × 0,80` (9,00 → **9,60**), chỗ dư trở lại
> **4%**. Nới chứ không siết, vì lời hứa ở đây là *"bóng phải phủ hết thành phố"* — một QUAN HỆ với
> kích thước thành phố, không phải một mức. Cái giá: bản đồ bóng cùng số điểm ảnh nay trải trên
> vùng rộng hơn 6,7% ⇒ mật độ đi từ 1024→57 · 2048→114 · **4096→228** xuống **53 · 107 · 213**
> điểm/đơn vị. Gờ mái rộng 0,08 đơn vị vẫn còn **17 điểm ảnh** ở 4096 ⇒ vẫn thừa.
> ⚠️ Và đây là lần thứ hai cùng một hình dạng: một hằng số đúng lúc đặt, rồi một phase khác đổi
> kích thước thành phố mà hằng số ấy **không có cách nào biết** (bẫy Phase 7D).

### Khung hình sau VIỆC 5 — hệ số từng kỷ (`node scripts/frame-fit.mjs`)

**0/15 kỷ có công trình bị cắt** (trước: 14/15). Hệ số **1,307 … 1,878**, trung bình **1,626**.
Bằng chứng nó tối thiểu: **14/15 kỷ ra biên đúng 0,0400 = sàn**; chỉ kỷ 15 dư (0,0736).
Mép quyết định: **DƯỚI 7 kỷ · TRÁI 6 · PHẢI 2 · TRÊN 0** ⇒ chĩa camera lên/xuống KHÔNG cứu được,
vì ràng buộc nằm ở hai bên hông. Hạ biên an toàn từ 4% xuống 0% chỉ lấy lại **3,3%** khoảng cách.
