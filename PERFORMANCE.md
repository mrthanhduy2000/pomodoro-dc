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

### Hình học: +55,8%, và nó vẫn nằm trong vùng RẺ — nhưng đây là ƯỚC LƯỢNG, không phải số đo

⚠️ **NÓI RÕ: chưa ai chạy `bench-macbook.sh` cho bộ mã này.** Con số ms dưới đây là SUY RA từ mô
hình chi phí đã đo trên M3, không phải một phép đo mới. Đàm là người chạy được bộ đo thật.

Suy luận, và điều kiện để nó sai:
- Mô hình đã đo: **≈ 0,87 ms cố định + 1,14 ms mỗi TRIỆU ĐIỂM ẢNH THẬT** ⇒ **80% chi phí đi theo
  ĐIỂM ẢNH, 20% cố định**; hình học gần như không xuất hiện trong mô hình.
- Ba bằng chứng đã ghi ở trên vẫn áp dụng, đặc biệt: *"tam giác thành phố chênh 43% giữa kỷ 3 và 11
  mà thời gian chỉ chênh 2,4%"* và *"rặng núi chiếm 54–63% hình học mỗi khung nhưng 0 ms đo được"*.
- ⚠️ **Và có một lý do riêng để tin lần này còn rẻ hơn thường**: vùng quê **không thêm điểm ảnh
  nào**. Nó phủ lên đúng chỗ trước đây là mặt đất trơn — cùng số điểm ảnh, chỉ khác thứ được tô lên.
  Trục đắt (điểm ảnh) đứng yên; chỉ trục rẻ (tam giác) tăng.
- ⇒ **Ước lượng: dưới 0,3 ms mỗi khung**, tức cảnh chậm nhất đi từ 5,20 lên khoảng 5,5 ms trên trần
  làm việc 8 ms. **Điều kiện để ước lượng này SAI**: nếu +773.264 tam giác đủ để đẩy khâu xử lý đỉnh
  thành nút thắt mới — chưa từng thấy trong bộ số M3, nhưng cũng chưa từng thử ở mức này. Bộ đo thật
  là thứ duy nhất đóng được câu hỏi.

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

### Hình học vẫn nằm sâu trong vùng RẺ — nhưng đây là ƯỚC LƯỢNG, KHÔNG phải số đo

+0,05% tổng là con số nhỏ nhất của bất kỳ phase nào trong loạt này. Theo mô hình chi phí đã đo trên
M3 (**80% chi phí theo ĐIỂM ẢNH, 20% cố định; 43% chênh tam giác chỉ đổi 2,4% thời gian**), một
thay đổi hình học cỡ này gần như chắc chắn không đo được.

⚠️ **NHƯNG PHẢI NÓI CHO ĐÚNG: đó là một SUY LUẬN từ mô hình chi phí, không phải một phép đo.**
Không có một con số mili-giây nào trong mục này. Và mô hình chi phí ấy **đã từng nói dối theo đúng
hướng trấn an một lần** (ngân sách tam giác 2026-08-17: HUD báo 34.622 trong khi máy vẽ 78.748 —
thiếu 56%, và không có gì đỏ lên vì công thức chỉ được so với chính nó).

⚠️ **MÓN NỢ ĐANG PHÌNH, và nó KHÔNG phải của phase này.** VIỆC 1 «bỏ cái khay» đã thêm **+55,8%
tam giác** (1.386.406 → 2.159.670) và **chưa ai đo lại trên phần cứng thật ở mức đó**. Bước B chỉ
thêm 0,05% lên trên một cái nền chưa được kiểm. Bộ số M3 hiện hành đo ở khoảng **78.748 tam giác
mỗi khung**; nay là **~2,16 triệu**, tức **gấp 27 lần** — xa ngoài dải đã hiệu chuẩn.
⇒ **Đàm cần chạy `bash scripts/bench-macbook.sh` trên MacBook.** Cho tới lúc đó, mọi câu "vẫn còn
dư địa" trong mục này là ngoại suy, không phải kết luận.

### Vế CHƯA đo — frame time trên M3

Chưa đo. Xem đoạn ngay trên. iPhone thì vẫn chưa ai đo bao giờ (`TECH_DEBT #23`/`#26`).

---

## Khi nào phải đo lại

- Sau bất kỳ phase nào **thêm nguồn sáng, đổi shader, đổi bóng đổ, hoặc đổi DPR**.
- Sau bất kỳ phase nào làm **cỡ khung hình mặc định** đổi.
- Trước khi kết luận bất cứ điều gì về **iPhone**.
- **Không** cần đo lại chỉ vì thêm khối / thêm tam giác — trục đó đã chứng minh là rẻ.
- ⚠️ **Mỗi phase PHẢI tự đo lại mốc nền của mình**, không được chép cột "sau" của phase trước làm
  cột "trước" của mình. Lý do và cái giá suýt phải trả: mục ❗ ở cuối phần Phase 11.
