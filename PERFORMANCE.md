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

## Khi nào phải đo lại

- Sau bất kỳ phase nào **thêm nguồn sáng, đổi shader, đổi bóng đổ, hoặc đổi DPR**.
- Sau bất kỳ phase nào làm **cỡ khung hình mặc định** đổi.
- Trước khi kết luận bất cứ điều gì về **iPhone**.
- **Không** cần đo lại chỉ vì thêm khối / thêm tam giác — trục đó đã chứng minh là rẻ.
