# PHASE_RULES — cách làm việc, cách ra prompt, cách báo cáo

> Thay thế toàn bộ nghi thức đã dùng ở Phase 9–18. Lý do phải viết file này: đo lại chính
> dự án ngày 2026-08-24 cho thấy mỗi phiên tiêu **~80% sức vào đọc / đo / viết tài liệu** và
> chỉ ~20% vào xây. Ba phase liên tiếp qua sạch mọi cổng số và **đều bị mắt Đàm bác**.
> File này cắt phần lãng phí, giữ đúng phần đang bảo vệ thứ có giá trị.

---

## 1. Sản phẩm là ẢNH

Mắt Đàm là quyền phán xử cuối cùng cho mỹ thuật. Con số dùng để **không tự lừa mình**,
không dùng để **thắng một lời bác**. Một phiên chỉ có bảng số là một phiên **chưa giao gì**.

**Định nghĩa phiên thành công: ≥4 thay đổi Đàm nhìn thấy được trong ảnh chụp.**
Không phải "mọi cổng xanh".

## 2. KHÔNG đo hiệu năng

Đã đo dứt điểm trên máy thật (Apple M3 · ANGLE Metal · 1100×700 · DPR 2, xem
`PERFORMANCE.md`): cảnh chậm nhất **5,20 ms** trên trần 16,67 ms ⇒ **dư 3,2 lần**; chi phí
≈ 0,87 ms cố định + 1,14 ms mỗi triệu điểm ảnh thật ⇒ **80% chi phí theo ĐIỂM ẢNH**, hình
học gần như miễn phí (tam giác chênh 43% giữa kỷ 3 và 11 mà thời gian chênh 2,4%).
**Ngân sách ấy sinh ra để TIÊU.**

- KHÔNG đo ms · KHÔNG đếm lệnh vẽ / tam giác làm cổng · KHÔNG `bench-macbook.sh` ·
  KHÔNG cổng CPU 1,25×.
- Đo lại **CHỈ KHI** Đàm nói khung hình giật trên máy thật.
- Hai điều cấm vĩnh viễn, không cần đo để biết: **không hạ DPR** · **không thêm nguồn sáng
  thứ tư** (mỗi đèn ≈ +0,8 ms, và đã có ba đèn nền — thêm nữa là tái phát bệnh "nhợt như sữa").

## 3. KHÔNG viết công cụ đo mới

`scripts/` từng có 18 file đo, phần lớn viết ra để chứng minh **một con số đúng một lần**,
và công cụ tự chế đã nói dối hơn 20 lần trong lịch sử dự án. Bốn công cụ còn sống:

| Công cụ | Dùng khi |
|---|---|
| `city-preview.mjs` | dựng ảnh một kỷ (`--era N --hour H --width 1500`) hoặc bảng quét (`--sweep`) |
| `sweep-score.mjs` | 15 kỷ có còn phân biệt được không (cổng chống trôi) |
| `png-probe.mjs` | đo màu thật trên ảnh đã dựng |
| `shot.mjs` | chụp giao diện 2D (nhớ `npm run build` trước) |

Cần cái thứ năm → **hỏi trước**, đừng tự viết.

`sweepMetric.mjs` · `mask-count.mjs` · `plan-coverage.mjs` · `water-view.mjs` ·
`water-score.mjs` · `scene-tri.mjs` · `plinth-tri.mjs` ở lại `scripts/` vì có bài test hoặc bị import.
10 công cụ dùng-một-lần đã chuyển sang **`scripts/archive/`** (còn nguyên trong git, chạy
được bằng đường dẫn đầy đủ khi thật sự cần): `depth-score` · `frame-fit` · `frame-score` ·
`plateau-score` · `road-bend` · `road-score` · `scene-count` ·
`shadow-score` · `sweep-diff` · `terrain-score`.

## 4. Test: chỉ giữ thứ bảo vệ dữ liệu thật

Cổng mỗi phiên: `npm test` **không đỏ thêm bài nào** · `npm run lint` sạch · `npm run build` xanh.

Bắt buộc đúng **MỘT** bài: **bất biến ADR-007** — toạ độ 5 kỳ quan và các nhà dân ĐÃ CÓ
phải y hệt trước/sau, ở mọi mốc phiên 1…120 × 15 kỷ.

BỎ: phá-từng-assert-cho-đỏ · đối chứng tiêm · đối chứng nhốt-số-cũ · `--selftest` ·
đo lại mốc nền cho mọi thay đổi. Chỉ áp lại kỷ luật phá-cho-đỏ khi thêm một **bất biến MỚI
bảo vệ dữ liệu người dùng** — không áp cho màu mái, hình cây, bề rộng vỉa hè (hỏng mấy thứ
đó thì nhìn ảnh là thấy ngay).

## 5. Tài liệu: hai file

`BAN_GIAO.md` (ghi thêm ở đầu, ~30 dòng mỗi phase) + `CHANGELOG.md`.
File khác **chỉ sửa khi thay đổi làm nội dung nó SAI SỰ THẬT**:
thêm module → `PROJECT_STRUCTURE.md` · đổi luồng → `ARCHITECTURE.md` ·
quyết định có ≥2 phương án thật cân nhắc → ADR mới · phát hiện nợ → `TECH_DEBT.md` ·
đổi trạng thái/việc tiếp theo → `START_HERE.md`.
**Không sửa cho đủ bộ.**

`BAN_GIAO.md` là nhật ký: **chỉ ghi thêm, chỉ đọc 60 dòng đầu.** Khi vượt ~500 dòng thì
chuyển phần cũ sang `docs/archive/`. Không bao giờ đọc trọn.

## 6. Báo cáo: 5 dòng

```
1. Đã làm    — mỗi việc một dòng
2. Ảnh       — đường dẫn
3. Chưa xong — việc nào + vì sao
4. Rủi ro    — hoặc "không có"
5. Kế tiếp   — đúng MỘT đề xuất
```

TECHNICAL ADVISOR REPORT 11 mục **chỉ giữ cho phase kiến trúc/hạ tầng** (Supabase sync,
database, AI Coach, deploy, bảo mật). Phase mỹ thuật thì bỏ hẳn.

## 7. Làm hết trong một lượt

Prompt liệt kê 4–8 việc thì **làm hết cả 4–8 rồi mới báo cáo**. Không dừng giữa chừng xin
ý kiến. Việc nào bị chặn → bỏ qua, ghi lại một dòng, làm tiếp việc khác.

**Ưu tiên khi phải chọn: xong 6 việc mức 90% > xong 1 việc mức 100%.**

Điều kiện dừng DUY NHẤT: **bài test ADR-007 đỏ** — trình ra ca dời nhà đầu tiên, không nới
bài test.

## 8. Khung prompt cố định (dành cho người ra đề)

Prompt tối đa **~60 dòng**, đúng 4 mục, **không chép lại luật quy trình** (chúng nằm ở file này):

```
BỐI CẢNH   — Đàm nói gì, nguyên văn. ≤3 dòng.
CHẨN ĐOÁN  — nguyên nhân gốc kèm con số. ≤6 dòng.
VIỆC       — 4 đến 8 việc, mỗi việc ≤6 dòng.      ← 80% prompt nằm ở đây
GIAO       — ảnh nào + tổng kết 5 dòng.
```

Ràng buộc lên người ra đề:
- **Mỗi prompt bắt buộc có 4–8 việc.** Ra 1 việc là ra đề sai.
- **Không ra phase "đo trước"** trừ khi kết quả phase trước thật sự mơ hồ. Ba lần gần nhất
  nó không hề mơ hồ — Đàm đã nói thẳng là nhỏ.
- Giả thuyết của người ra đề phải bị **ẢNH** bác, không phải bị một chỉ số bác.
- Mỗi lượt ra **đúng một khối prompt**, không kèm gì khác.

## 9. Không đổi

Không tự gộp `main` · không đụng camera/`gridSize` · không dựng lại công cụ từ trí nhớ
(lấy từ git, hoặc viết mới rồi đối chiếu chéo với mã sản phẩm) · commit + push sau mỗi mốc
có giá trị (hộp cát đã từng bị khôi phục về snapshot cũ giữa phiên, tiêu mất trọn một lượt đo).

## 10. Ba hình dạng thất bại đã trả giá — chặn bằng ảnh, không bằng thiện chí

1. **`TECH_DEBT #41`** — chi tiết mái Phase 11: xây xong, đẹp, và **90/90 ô dưới ngưỡng mắt**.
   ⇒ Trước khi tiêu ngân sách vào chi tiết nhỏ, hỏi: *ở khoảng cách Đàm nhìn, thứ này chiếm
   bao nhiêu điểm ảnh?* Dưới ~12px thì không ai thấy.
2. **Lùm cây Phase 8D** — cơ chế chạy, ảnh thuyết phục, đo ra là **chưa bao giờ làm gì**.
   ⇒ Mắt người rất giỏi tìm ra cụm trong nhiễu. Bật/tắt rồi so ảnh.
3. **Một cổng đạt bằng cách xây thứ không nên tồn tại** — nhà trên sườn núi chân trời,
   ruộng ô vuông ở kỷ đồ đá mới. ⇒ Mọi con số bản sắc 15 kỷ phải buộc vào `country` mà
   `eraStyle.js` khai, và phải trả lời được *"nơi có thật nào trông như vậy?"*
