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
| Mốc | 9 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 10 | **12** | 10 | 10 | 10 | 10 | 10 |

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

## Khi nào phải đo lại

- Sau bất kỳ phase nào **thêm nguồn sáng, đổi shader, đổi bóng đổ, hoặc đổi DPR**.
- Sau bất kỳ phase nào làm **cỡ khung hình mặc định** đổi.
- Trước khi kết luận bất cứ điều gì về **iPhone**.
- **Không** cần đo lại chỉ vì thêm khối / thêm tam giác — trục đó đã chứng minh là rẻ.
