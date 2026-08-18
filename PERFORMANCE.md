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

## Khi nào phải đo lại

- Sau bất kỳ phase nào **thêm nguồn sáng, đổi shader, đổi bóng đổ, hoặc đổi DPR**.
- Sau bất kỳ phase nào làm **cỡ khung hình mặc định** đổi.
- Trước khi kết luận bất cứ điều gì về **iPhone**.
- **Không** cần đo lại chỉ vì thêm khối / thêm tam giác — trục đó đã chứng minh là rẻ.
- ⚠️ **Mỗi phase PHẢI tự đo lại mốc nền của mình**, không được chép cột "sau" của phase trước làm
  cột "trước" của mình. Lý do và cái giá suýt phải trả: mục ❗ ở cuối phần Phase 11.
