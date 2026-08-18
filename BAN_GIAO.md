# BÀN GIAO — Pomodoro DC

> Dành cho AI/người làm tiếp. File này trả lời: **đang ở đâu, làm gì tiếp, đã đổi những gì.**
> Chi tiết kỹ thuật + quy tắc cấm + **Project Governance Protocol**: xem `CLAUDE.md`. Lịch sử
> thiết kế sâu: thư mục memory của Claude + `AI_HANDOFF_KNOWLEDGE.md`. Vì sao 1 quyết định được
> chọn: `ARCHITECTURE_DECISIONS.md`. Nợ kỹ thuật: `TECH_DEBT.md`. Migration: `MIGRATION.md`. Tóm
> tắt theo mốc: `CHANGELOG.md`.
> **NGUYÊN TẮC ƯU TIÊN SỐ 1:** (1) mọi phiên AI phải đọc file này + `CLAUDE.md` + các file liên quan TRƯỚC khi làm; (2) sau MỌI cập nhật dù nhỏ, phải cập nhật ngay file này + `CLAUDE.md` + các file liên quan khác.
> Cập nhật lần cuối: **2026-08-18** — **VIỆC 1 / PHASE 12: ĐƯỜNG THÔI LỞM CHỞM.**
>
> **VIỆC 1 / PHASE 12 — ĐƯỜNG THÔI LỞM CHỞM (nguyên nhân 1/2) — 2026-08-18.**
> Đàm nói *"đường lòi lõm, mất tự nhiên quá"*. Câu ấy gộp **hai nguyên nhân độc lập**, và một bản
> vá cho cái này không chạm được cái kia: **(1) MÉP NGANG** — hai ô đường kề nhau trình ra hai bề
> rộng khác nhau ngay tại chỗ giáp ⇒ mép đường bẻ một **góc vuông**; **(2) MẶT CẮT DỌC** — hai ô
> đường nằm ở hai bậc thềm khác nhau ⇒ đường phải leo một **dốc dựng đứng** trong đúng một ô.
> Commit này chỉ làm **(1)**. Nguyên nhân (2) là commit riêng ("không trộn nhiều thay đổi").
> **ĐO TRƯỚC (`scripts/road-fit.mjs`, 15 kỷ × 3 mốc tuổi)**: **45%** số mép đường có một bậc, bậc
> lớn nhất **0,380 ô**. **ĐO SAU: 0% · 0,000 ô.**
> ⚠️ **Cái sai gốc là một GIẢ ĐỊNH VỀ HÌNH, không phải một con số sai** — *"lòng đường một ô là MỘT
> hình chữ nhật"*. Hình chữ nhật có **hai** bề rộng, ngã tư cần **bốn**; nên ngã ba buộc phải phình
> ra **trọn ô** theo hướng có nhánh dù nhánh ấy chỉ rộng một phần ba. Chỉnh khéo con số nào cũng
> không thoát. Luật mới (**ADR-031**): **một LÕI + tối đa BỐN CÁNH TAY loe**, bề rộng chỗ nối là
> `min(nửa của tôi, nửa của hàng xóm)` — một phép **ĐỐI XỨNG**, nên hai ô kề nhau *không có cách
> nào* lệch. Kèm `MAX_AVENUE = 0,96` (cánh tay cần chỗ để loe; `avenue: 1,00` của kỷ 12/15 vừa làm
> cánh tay dài bằng 0, vừa nuốt sạch vỉa hè của chính kỷ ấy).
> **799 bài test** (798 + 1 đối chứng mới), lint sạch, build xanh, **0 lệnh vẽ mới / 0 vật liệu mới
> / 0 nguồn sáng mới**. Anti-drift bản quét: **15/15 cặp chặng + 105/105 cặp kỷ trên ngưỡng mắt**
> (gần nhất 20,7 / 21,4 · trung vị 37,6). ⏳ **CHƯA gộp `main`** — mục 5 chương trình làm việc.
>
> ⚠️ **BÀI HỌC LỚN NHẤT PHIÊN NÀY — TÔI SUÝT GỌI CHÍNH BẢN VÁ ĐÚNG CỦA MÌNH LÀ MỘT HỒI QUY.** Nhìn
> ảnh 3D sau khi sửa: đường **thưa hẳn đi, đứt quãng**, mặt nạ đường mất **36% điểm ảnh đỏ** ở kỷ 1.
> Trông y hệt một lỗi nặng. Rasterise thẳng hình học ra bản đồ ký tự (không qua camera, không có
> khối nào che) thì sự thật ngược lại: **TRƯỚC** mỗi ngã tư phình thành `████` rồi thụt về `██` —
> đúng cái lồi lõm Đàm thấy; **SAU** bề rộng chạy thẳng đều, mạng đường vẫn **liền lạc hoàn toàn**,
> tâm của cả 50 ô đường đều còn mặt đường. Diện tích mất **13,6%**, và mất **đúng ở các ngã tư**
> (ô 4|8 và 8|4: −56 điểm phần trăm · ô thẳng: −3). ⇒ **Một ảnh 3D có che khuất KHÔNG phải bằng
> chứng về hình học.** Cái phình ở ngã tư xưa nay đang *bắc cầu* qua những quãng bị nhà cửa che,
> nên gỡ nó đi thì mắt đọc thành "đường đứt" trong khi hình học liền hơn trước. Cùng họ với bài học
> Phase 9B (*"thứ không chịu mờ đi chưa bao giờ là bóng đổ"*): **khi mắt và phép đo cãi nhau, hãy
> đo lại bằng một phép đo KHÔNG đi qua camera**, đừng chọn bên nghe hợp lý hơn.
>
> ⚠️ **VÀ MỘT CÁI BẪY ĐÚNG NHƯ TÀI LIỆU ĐÃ CẢNH BÁO, LẶP LẠI Y NGUYÊN**: cặp ảnh "trước/sau" đầu
> tiên tôi định dùng có **kích thước khác nhau** (1434 vs 1134 điểm ảnh) — tức khung hình khác,
> camera khác, không so được. Chúng là ảnh cũ còn sót trong `.city-preview/`, không truy được nguồn.
> Đã dựng lại vế TRƯỚC từ một `git worktree` ở `e95cdf1` bằng **đúng một dòng lệnh**, `md5sum` cả
> sáu tấm để chứng minh không tấm nào trùng byte tấm nào. Đây đúng bài học 2026-08-18 (Phase 11)
> viết trong `CLAUDE.md`, và nó vẫn cắn được lần nữa chỉ một ngày sau.
>
> ⚠️ **Hai quả mìn nhỏ, cả hai đều do bài test bắt, không do đọc mã.** (a) **Tam giác SUY BIẾN**:
> khi lõi chạm đúng ranh giới ô (`avenue: 1,00`), dải cánh tay dài bằng 0 vẫn được đẩy vào lưới —
> vô hình trên màn hình, nhưng trọng tâm rơi **đúng trên** ranh giới rồi bị làm tròn sang ô **bên
> cạnh**, làm ô ấy "rộng" thêm ra; bài test đỏ với thông báo trỏ vào một ô hoàn toàn lành. (b)
> **Cỡ viên lát phải là đại lượng của THẾ GIỚI, không phải của mảnh** — chia đều `sub` cho năm mảnh
> dài ngắn khác nhau thì viên của cánh tay 0,14 ô nhỏ hơn viên của lõi 0,72 ô tới năm lần.
>
> 🆕 **TECH_DEBT #42** (Medium, chờ Đàm): vỉa hè bị kẹp `walk ≤ 0,5 − half` bóp trong im lặng trên
> ĐẠI LỘ ở **8/15 kỷ**, tệ nhất còn **11%** bề rộng đã khai. Phần chặn lời hứa "hết bậc" đã sửa;
> phần còn lại đụng bản sắc 15 kỷ nên không tự quyết.
>
> **SỐ HIỆU NĂNG (đo đủ 15 kỷ, `--bench 1 --no-shadow`)**: **lệnh vẽ KHÔNG đổi một đơn vị nào** ở
> cả 15 kỷ · tam giác **659.796 → 653.044 (−1,0%)**, 10 kỷ giảm 5 kỷ tăng. Đối chiếu chéo: đếm
> riêng tam giác mặt đường theo từng phần (`ROAD_PART`) thì **15/15 kỷ khớp CHÍNH XÁC** với chênh
> lệch tổng ⇒ không một tam giác nào đến từ nhà/cây/đất/chân trời. Vì sao 5 kỷ *tăng*: luật cũ chia
> lòng đường thành đúng `sub × sub` ô con **bất kể ô rộng bao nhiêu** (kiểm được: tam giác cũ
> `= 2 × 40 ô đường × sub²`, đúng 15/15 kỷ) — tức `sub` xưa nay là *số lát cắt của một mảnh* chứ
> không phải *cỡ một viên lát*; luật mới suy từ chiều dài thật nên kỷ lát mịn giảm mạnh (kỷ 8 còn
> 49%) còn kỷ lát thô + đại lộ rộng thì tăng nhẹ. Chi tiết: `PERFORMANCE.md` mục "Sau Phase 12".
>
> ⚠️ **PHÁT HIỆN NGOÀI DỰ KIẾN — `PERFORMANCE.md` ĐANG MÔ TẢ MỘT COMMIT ĐÃ CHẾT.** Đi lấy mốc nền
> cho Phase 12, tôi định chép cột "sau" của bảng Phase 11 làm cột "trước" của mình. Phép đối chiếu
> chéo ở trên chặn lại: 7 kỷ đầu khớp từng đơn vị, riêng kỷ 8 lệch đúng 3.560. Đo lại thì bảng
> Phase 11 mô tả `d888fae`, còn HEAD là `e95cdf1` — **Phase 11-B sửa `roofStyle.js` (hình học thật)
> mà không đụng `PERFORMANCE.md`**, để **6/15 kỷ sai số tam giác** (tổng lệch +14.360). Chép sang
> thì kỷ 8 sẽ được báo là −5.558 thay vì −1.998 và kỷ 11 là +3.902 thay vì +126 — cả bảng bịa.
> ⇒ Đã (a) giữ nguyên bảng Phase 11 + thêm mục ❗ giải thích cách đọc, (b) thêm luật *"mỗi phase
> PHẢI tự đo lại mốc nền của mình"* vào `PERFORMANCE.md`, (c) mở **TECH_DEBT #43**. Điều đáng nói
> nhất: **cột lệnh vẽ của chính bảng ấy KHÔNG trôi**, vì nó có `drawCallBudget.test.js` canh; cột
> tam giác trôi vì không có gì canh. Chỗ có test thì đúng, chỗ chỉ có một câu Definition of Done
> thì sai — trong cùng một bảng, cùng một phase.
>
>
> ---
>
> **(mốc trước) VIỆC 3 / PHASE 11: MÁI THÔI LÀ MỘT TẤM PHẲNG TRƠN.**
> Camera nhìn **chúc xuống**, nên mái là mặt lớn nhất trong khung hình — mà tới hết Phase 10 nó vẫn
> trơn nhẵn ở cả 15 kỷ. Nay có **ngữ pháp thứ năm** theo đúng khuôn ba lớp đã dùng bốn lần: BẢNG
> `city3d/roofStyle.js` · HÌNH `city3d/rooftop.js` · `buildingSpec.js` chỉ ĐỌC. Hai trục vuông góc
> — `stack` (thứ **nhô lên** phá mặt phẳng) và `crown` (thứ **vẽ đường nét**). ADR-030.
> **798 bài test** (775 + 23 mới), lint sạch, build xanh, **0 lệnh vẽ mới ở cả 15 kỷ**, tam giác
> thành phố +27,9%. **15 phép phá, 14 đỏ đúng chỗ đã nêu trước; cái thứ 15 KHÔNG đỏ và đó là một
> phát hiện thật** (xem ngay dưới). ⏳ **CHƯA gộp `main`** — mục 5 chương trình làm việc.
> **PHASE 11-B (Đàm chốt phương án 1) + PHASE 12 BƯỚC ĐO — 2026-08-18, cùng ngày.**
> Đàm chọn **ưu tiên thứ PHÁ ĐƯỜNG VIỀN** (không phóng to vật trên mái — đó là mua đúng rủi ro
> "cây nấm" của Phase 7C). Sửa 6 dòng bảng `roofStyle.js`: kỷ 8 · 11 · 12 · 13 · 14 · 15 nay có
> `vernacularCrown` thật thay vì `none`. **Kết quả đo (khung app, so với `e089c00`)**: kỷ 8 **1,2%
> → 3,6%** (gấp 3 — kỷ tệ nhất nay khá nhất trong nhóm sửa) · kỷ 11 3,5% → 4,5%. Nhưng kỷ 12 · 13 ·
> 14 · 15 chỉ nhích lên **1,1–2,0%** — parapet mái bằng là một vành mỏng CHẠY THEO đúng đường viền
> sẵn có, nên nó gần như không đổi HÌNH DÁNG bóng đổ lên trời. ⇒ **Luật "đường viền vs bề mặt" phải
> sắc hơn nữa: thứ sống sót là thứ đổi *HÌNH DÁNG* đường viền, không phải thứ *nằm trên* đường viền.**
> ✓ Anti-drift (tiêu chí MỚI Đàm đặt cho bản quét): **15/15 cặp chặng và 105/105 cặp kỷ trên ngưỡng
> mắt**, cặp gần nhất 21,5 · trung vị 38,3. Bảng màu không trôi.
> ⚠️ **HAI BÀI TEST BẮT ĐƯỢC HAI LỖI TRONG CHÍNH BẢN VÁ NÀY, cả hai đều "đúng lịch sử mà vẫn sai".**
> (a) Bản đầu đổi `crown` kỷ 8 sang `balustrade` (lan can đá Jerónimos — Manueline thật) ⇒ bài
> `15 KỶ RA 15 MÁI` ĐỎ: kỷ 7 đã dùng đúng giá trị ấy, Ý và Bồ Đào Nha tụt còn khác nhau 1/6 trục.
> (b) `vernacularCrown` kỷ 13 khai `ridge` (sống mái kawara Nhật — cũng thật) ⇒ bài `MÁI PHẢI ĐỠ
> ĐƯỢC THỨ ĐẶT LÊN NÓ` ĐỎ: `vernacularRoof` kỷ ấy là **`flat`**, tôi đã kể chuyện về một loại nhà
> mà kỷ này KHÔNG dựng. ⇒ **Đúng lịch sử là điều kiện CẦN, không phải điều kiện ĐỦ** — giá trị còn
> phải không giẫm lên hàng xóm, và phải khớp hình mình đang thật sự dựng.
>
> **PHASE 12 — BƯỚC ĐO (chưa sửa gì, đúng lệnh "ĐO TRƯỚC, ĐỪNG SỬA").**
> ⚠️ **LỖI ĐẦU TIÊN TÌM RA NẰM TRONG CHÍNH CÔNG CỤ ĐO**: `frame-fit.mjs` nhân `BUILDING_SCALE` vào
> bề NGANG nhưng **quên chiều CAO**, trong khi cảnh thật nhân `scale` vào cả ba chiều. Mọi công
> trình thật cao hơn 1,3 lần thứ công cụ tưởng ⇒ **`TECH_DEBT #24` nhẹ hơn sự thật**. Đã vá; hệ số
> camera cần để vào trọn khung nay là **1,82** (đang dùng 1,19–1,58).
> **BỘ SỐ MỚI — `node --import ./scripts/register-esm-loader.mjs scripts/frame-fit.mjs --scale`:**
>
> | ở góc mặc định (zoom 1,0 · khung 780px) | số đo |
> |---|--:|
> | thành phố chiếm khung | **103% ngang · 99% dọc** (đã tràn, không còn chỗ trống) |
> | **một căn nhà dân cao** | **68 điểm ảnh** (thấp nhất 33) |
> | một kỳ quan cao | 157 điểm ảnh |
> | **một chi tiết mái cao** | **≈ 5,7 điểm ảnh** ← đây là câu trả lời cho cả Phase 10 và 11 |
>
> ⚠️ **`--zoom 0.4` KHÔNG DÙNG ĐƯỢC: camera lọt vào TRONG thành phố ở 11/15 kỷ.** Bản đầu của bộ đo
> in ra "rộng 12725%" và "kỳ quan 4230,9px" — số nổ tung vì chia cho khoảng cách ≈ 0, mà vẫn xếp
> thành cột thẳng hàng trông như số liệu thật. Nay có gác từ chối thẳng thay vì kẹp giá trị.
> **Lại gần được tới đâu**: zoom an toàn nhỏ nhất là **0,38–0,58** (trung bình 0,48) ⇒ nhà to lên
> **1,78×–2,86×** (trung bình ~2,2×) ⇒ chi tiết mái từ 5,7px lên **~12,5px**, tức vừa CHẠM ngưỡng
> mắt 12. **Camera một mình không đủ, nhưng nó là đòn bẩy lớn nhất còn lại.**
> ⏳ **DỪNG Ở ĐÂY, CHỜ ĐÀM CHỌN PHƯƠNG ÁN** — tuyệt đối không tự sửa camera.
>
> ⛔ **NÓI THẲNG TRƯỚC MỌI THỨ KHÁC: PHASE NÀY KHÔNG ĐẠT CÁI BAR ĐÀM ĐẶT RA.** Đàm yêu cầu ảnh
> nghiệm thu phải có **bản quét 15 kỷ đặt CẠNH bản trước**, và nói rõ: *"nếu hai bản quét vẫn khó
> phân biệt như Bước 2 thì phase này CHƯA đạt mục tiêu của nó — nói thẳng ra, đừng khoe test xanh
> thay cho kết quả nhìn được."* Đo bằng `sweep-diff.mjs` (cùng đơn vị, cùng ngưỡng mắt 12):
> **90/90 ô DƯỚI ngưỡng · trung vị 2,2 · kỷ đổi mạnh nhất là kỷ 7 cũng chỉ 7,4.** Hai bản quét
> **KHÔNG phân biệt được**. Test xanh, 0 lệnh vẽ mới, +110.076 tam giác — nhưng ở thang bản quét
> thì công sức ấy **không tới được mắt**.
> ⚠️ **VÀ CHI TIẾT ẤY CÓ THẬT — NÓ CHỈ KHÔNG SỐNG SÓT TỚI THANG QUÉT.** Ba thang, cùng đơn vị
> RGB/255, cùng ngưỡng 12, đều chụp lại từ `git worktree` ở `e089c00` cho vế TRƯỚC:
>
> | thang | kỷ 7 | kỷ 8 | kỷ 9 | kỷ 11 |
> |---|--:|--:|--:|--:|
> | bản quét (thành phố ≈ 300px) | 7,4 | 1,3 | 6,1 | 4,8 | ← đều DƯỚI ngưỡng 12 |
> | khung app (1134×780) | **8,4%** | 1,2% | **5,3%** | 3,5% | ← % điểm ảnh đổi quá ngưỡng |
> | zoom 0,45 sát mái | — | — | **15,1%** | 4,8% | |
>
> ⇒ Nghịch lý đáng ghi: **kỷ 8 tốn nhiều hình học nhất (+48,5% tam giác) mà đổi ít nhất (1,2%)** —
> ngói bò (`barrel`) là những cục nhỏ lặp lại, tốn khối nhất và tan biến sớm nhất khi lùi xa. Còn
> `dormer` (kỷ 9) và `balustrade` (kỷ 7) thì phá được đường viền mái nên sống lâu hơn. **Bài học
> cho phase sau: thứ sống sót ở xa là thứ đổi ĐƯỜNG VIỀN, không phải thứ thêm bề mặt.**
> ⇒ **Việc kế tiếp là một câu hỏi cho Đàm, không phải một bản vá** — phóng to vật trên mái là quyết
> định MỸ THUẬT mà tôi chưa đủ 80% tự tin (bẫy số 2 của chính chương trình: "cây nấm" — Phase 7C đã
> trả giá một lần vì `eaves` tuyệt đối). Theo mục 5 chương trình làm việc thì phải DỪNG VÀ HỎI.
> ⚠️ **MỘT CON SỐ SAI TRONG `PERFORMANCE.md`, ĐÃ SỬA: KỶ 5.** Hàng "Mốc" tóm tắt ghi **11** trong
> khi bảng số liệu ngay phía trên nó ghi **10 → 10** và `MOC_LENH_VE` trong `drawCallBudget.test.js`
> cũng ghi **10**; lượt đo Phase 11 xác nhận **10**. Tức hàng tóm tắt ấy đang nới cổng của kỷ 5 thêm
> một lệnh vẽ, ngay trong tài liệu vừa viết ra để chống đúng chuyện đó. Một bảng số và một hàng TÓM
> TẮT của chính bảng ấy là **hai bản chép** — thứ cứu được ở đây là bản chép thứ ba (bài test), vì
> nó là bản duy nhất máy đọc.
> ⚠️ **ẢNH NGHIỆM THU TỪNG MANG TÊN NÓI DỐI — SUÝT ĐƯA HAI CON SỐ KHÔNG TRUY ĐƯỢC NGUỒN VÀO BÁO
> CÁO.** `MAI-SAU-ky9.png` (tên nói là "cận mái") trùng **từng byte** với `city-era09-light-h12.png`
> (khung thường); `md5sum` bắt được. Hai con số cũ (4,5% · 16,5%) đã bị **vứt bỏ và đo lại** ra
> 5,3% · 15,1% — gần bằng, nhưng "gần đúng" không phải lý do giữ một con số không truy được nguồn.
> Đã ghi thành bài học ở `CLAUDE.md` + thêm chế độ `--frame` cho `sweep-diff.mjs` (có `--selftest`).
> ⚠️ **BÀI TEST MỚI BẮT ĐƯỢC MỘT LỖI THẬT TRONG MÃ VỪA VIẾT — LẦN THỨ HAI LIÊN TIẾP.** Bài "kỳ quan
> cân tuyệt đối với MỌI tổ hợp" duyệt cả 6 × 11 tổ hợp (thay vì chỉ những tổ hợp bảng ĐANG dùng) và
> đỏ ngay ở `planter`: `emitPlanter` nhét `off` vào **CHUỖI KHOÁ** hạt giống (`` `lobe0|${off}` ``)
> rồi gọi `at(k, 0)`, tức **vô hiệu hoá cái nút bịt đối xứng** đặt ở `emitRooftop` — hai bồn cây soi
> gương nhau nhận hai khoá khác nhau ⇒ hai bụi cây to nhỏ khác nhau ⇒ kỳ quan lệch. Đúng cái chú
> thích ở `emitRooftop` đã tự cảnh báo (*"bịt mười lăm chỗ thì chỗ thứ mười sáu viết sau này sẽ
> quên"*), và chỗ thứ mười sáu ấy nằm ngay dưới chính câu cảnh báo đó. ⚠️ Lỗi này **KHÔNG lộ ra ở
> kỷ 15** — kỷ duy nhất cho kỳ quan đội bồn cây — vì mái nó chỉ nhét vừa MỘT bồn, mà một bồn thì
> `off = 0` nên khoá tự cân. Bài test cũ (đo trên 15 kỷ thật) sẽ chỉ đỏ vào ngày có ai gán bồn cây
> cho một kỳ quan rộng hơn, tức **đỏ MUỘN, sau khi bảng đã đổi**.
> ⚠️ **PHÉP PHÁ THỨ 15 KHÔNG NỔ — VÀ NGHI PHÉP PHÁ TRƯỚC LÀ ĐÚNG.** Để thử bài "không có hai cái
> mái giống hệt nhau", tôi ép `anchors.rw`/`rd` về hằng số. Không đỏ. Lý do: `deck` và `ridges`
> được tính từ biến `rw` **cục bộ**, không từ `anchors.rw` — tôi đã ghim một trường mà phần lớn mã
> không đọc. Phá đúng (ép cả `x`/`z`/`deck`/`ridges`) thì đỏ ngay. Và đo tiếp mới ra chuyện đáng
> nói hơn: bài ấy được giữ xanh bởi **HAI** thứ độc lập — `rooftop.js` bám theo neo, **và** neo tự
> nó khác nhau; ép chung một trong hai thì không đỏ. Nói cho đúng thì nguồn biến thể nằm ở **bộ
> sinh khối nhà**, không ở `rooftop.js`. Đã ghi thẳng vào chú thích bài test (bài học Phase 4D:
> *"một bài test xanh không cho biết có BAO NHIÊU thứ đang giữ nó xanh"*).
> ⚠️ **VÀ MỘT ĐỐI CHỨNG SUÝT ĐỎ OAN VÌ DẤU PHẨY ĐỘNG**: bài đối chứng "bước lượng hoá `crownWeight`
> không được quá thô" dựng `1,0 + bước` rồi đòi phép đo phải thấy — và nó ĐỎ ở `barrel`, vì
> `(0,35 + 0,0890…) − 0,35` ra **nhỏ hơn** chính cái bước. Đứng đúng TRÊN ngưỡng thì kết quả do sai
> số cuối cùng của phép cộng quyết định. Đã đổi sang **ghim hai phía** (99,9% phải KHÔNG thấy ·
> 100,1% phải thấy) — chặt hơn bản cũ chứ không lỏng hơn. Và lúc đo mới lộ ra sự thật thứ hai:
> bước của `barrel` (1,459) **rộng hơn cả dải `crownWeight` hợp lệ** (1,25), tức hai kỷ cùng lợp
> ngói ống **không bao giờ** tách được bằng trọng số. Đã khoá bằng `assert.deepEqual(KHONG_VUA_DAI,
> ['barrel'])` và ghi `TECH_DEBT #39`.
>
> *(Trước đó — 2026-08-18)* — **VIỆC 2: BẢNG TẦNG TRỆT DỌN SANG FILE RIÊNG, TRƯỚC KHI
> PHASE 11 THÊM BẢNG THỨ HAI.** Đây là chuyện **QUY ƯỚC**, không phải chuyện file dài (Đàm nói
> thẳng). Dự án đã tách bảng ra file riêng **ba lần** — `floraStyle.js` · `streetStyle.js` ·
> `horizon.js` — nên `eraStyle.js` ôm bảng tầng trệt là **chỗ lệch khuôn duy nhất**, và Phase 11
> sắp thêm một bảng 15 dòng nữa (mái). Sửa quy ước TRƯỚC thì tốn một lần; sửa sau thì tốn hai, và
> ở giữa có một phase làm theo khuôn sai — mà khuôn sai là thứ phiên sau chép lại. Nay:
> **`city3d/groundFloorStyle.js`** giữ bảng, `groundFloor.js` giữ hình, `buildingSpec.js` chỉ ĐỌC.
> `eraStyle.js` giữ đúng phần ngữ pháp chung (`country` · `landmark` · `massScale` · `spread` ·
> `storyHeight` · `roof`/`vernacularRoof` · `windows` · `motifs` · vật liệu · màu). ADR-029.
> ⚠️ **Lý lẽ cũ của ADR-026 đã bị ĐẢO NGƯỢC, và cách nó sai đáng ghi lại**: chú thích cũ bảo phải
> để bảng trong `eraStyle.js` *"vì câu trả lời `country` phải nằm trong tầm mắt"*. Thứ giữ ràng
> buộc ấy xưa nay **là một BÀI TEST**, không phải khoảng cách trên màn hình — và bằng chứng là bài
> `KHOÁ VÀO country` chạy y nguyên sau khi bảng dọn đi, chỉ đổi một dòng `import`. Một ràng buộc
> được giữ bởi "tiện mắt" là một ràng buộc **không được giữ bởi gì cả**.
> ⚠️ **VÀ MỘT PHÉP THỬ NGƯỢC KHÔNG NỔ ĐÃ ĐẺ RA MỘT BÀI TEST THẬT**: tôi viết trong chú thích của
> `getGroundFloor` rằng nó *"hỏi `normalizeEraKey` thay vì tự viết lại, vì một luật một công
> thức"* — rồi thử phá (đổi thành `Math.round(era)`) và **không bài nào đỏ**. Lời hứa ấy đang được
> giữ bởi đúng một câu chú thích. Hậu quả thật nếu để trôi: `getEraStyle(99)` trả về kỷ mặc định
> trong khi `GROUND_FLOOR_STYLES[99]` là `undefined` ⇒ công trình dựng theo ngữ pháp kỷ 2 nhưng
> **không có cửa**, đúng ca kỷ 14 mất cửa ở Bước 2. Đã vá bằng một bài duyệt 9 đầu vào lạ.
> ⚠️ **BÀI HỌC THỨ BA — VỀ CHÍNH PHÉP ĐO**: lượt đo mốc nền đầu tiên **hỏng hoàn toàn** vì tôi cho
> nó chạy nền rồi sửa file ngay trong lúc nó chạy. Mỗi kỷ ~15 giây nên bảng trả về trộn **ba trạng
> thái mã** (kỷ 1–4 mã cũ · kỷ 5–9 đúng lúc bảng đã cắt mà chưa nối lại, **mất trọn tầng trệt** ·
> kỷ 10+ đã nối xong), và nó trông hoàn toàn chỉnh tề. Đọc vội thì kết luận *"dọn nhà làm mất 15%
> tam giác ở 5 kỷ"* — một hồi quy không hề tồn tại.
> **Bằng chứng "chỉ là dọn nhà"**: đo lại đủ 15 kỷ trên cây sạch — **lệnh vẽ khớp 15/15, tam giác
> khớp 15/15, TỪNG ĐƠN VỊ**. **775 bài test** (773 + 2 mới), lint sạch, build xanh. **15 phép phá,
> 14 đỏ đúng chỗ đã nêu trước — và cái thứ 15 KHÔNG đỏ, đó chính là phát hiện ở trên** (sau khi vá
> thì nó đỏ). ⏳ **CHƯA gộp `main`** — mục 5 chương trình làm việc.
>
> *(Trước đó — 2026-08-18)* — **VIỆC 1: CỔNG LỆNH VẼ THÔI LÀ MỘT CON SỐ, THÀNH MỘT BẢNG 15
> MỐC RIÊNG (`TECH_DEBT #38` ĐÓNG).** Cổng nghiệm thu của cả chương trình Phase 10–12 có mục *"số
> lệnh vẽ không quá 13"*. Con số ấy đo trên đúng **ba kỷ** rồi được viết ra như luật của mười lăm;
> đo đủ 15 kỷ thì **kỷ 10 ra 14**, và ra 14 cả trên `HEAD`. Tôi đề xuất nâng trần lên 14. **Đàm
> bác**, với lý do đúng: *"14 kỷ khác đang ở 11–13, nên trần chung 14 cho chúng ba lệnh vẽ trống để
> trôi vào trong im lặng. Cổng chỉ bắt được kỷ tệ nhất."* Đây đúng **bẫy Phase 7D** — một con số
> tuyệt đối không diễn đạt được một luật nói về QUAN HỆ; lời hứa thật là *"kỷ này không được tốn
> hơn chính nó hôm nay"*. Nay là **`drawCallBudget.test.js`**: bảng 15 mốc (9·11·11·11·11·11·11·11·
> 10·**12**·10·10·10·10·10, cột thành phố; cả cảnh = mốc + 2), mỗi mốc kèm **lệnh đo + ngày đo**
> chép sẵn để tái lập được, cộng **ĐỐI CHỨNG bắt buộc** (kéo thêm một họ vật liệu vào một kỷ ⇒ đúng
> kỷ ấy vượt mốc, vượt đúng 1) và một bài **chống "trần chung đội lốt"** (điền cả 15 dòng cùng một
> số là cách rẻ nhất để bài đầu hết đỏ). Chạy trong `npm test`, **không cần Chromium**, nhờ một
> quan hệ ĐO ĐƯỢC: **`lệnh vẽ thành phố = (số họ vật liệu) + 4`, đúng 15/15 kỷ, không một ngoại
> lệ**. ADR-028.
> ⚠️ **Kèm ba việc phụ, cả ba đều là bài học chứ không phải dọn dẹp**: **(a)** **`cityParts.js`
> (mới)** — câu hỏi *"thành phố kỷ N gồm những khối nào?"* trước nay nằm giữa thân `sceneGraph.js`,
> nên mọi thứ muốn hỏi đều phải CHÉP LẠI, và một bài test đã chép rồi chép sai. Đàm: *"Đừng cố khoá
> hai bản chép cho khớp nhau — hãy làm cho chỉ còn một bản."* Nay `sceneGraph.js` gọi nó để DỰNG,
> bài test gọi nó để ĐO. **(b)** **Ba nhịp tuổi 12/45/120 nay là một PHÉP ĐO, không còn là một giả
> định** — quét `sessionCount` 0→150 bước 5 ở cả 15 kỷ, gom mọi kiểu nhà dân, rồi đòi ba nhịp phủ
> trọn; cộng một bài chứng minh **trục CẤP cũng cạn ở 3** (cấp 4/5/9 cho mô tả byte-identical với
> cấp 3). **(c)** ⚠️ **MỘT CÂU TỰ TRẤN AN TRONG CHÚ THÍCH CỦA CHÍNH TÔI ĐÃ BỊ PHÉP ĐO BÁC BỎ**: bản
> trước viết *"số nhà dân đi từ 6 lên 30 nên bộ họ vật liệu của thành phố TRẺ hẹp hơn hẳn thành phố
> già"* — nghe rất xuôi, và **sai**: `nen` giống hệt nhau ở cả ba nhịp, ở cả 15 kỷ (kỷ 1 4·4·4 · kỷ
> 7 6·6·6). Sáu căn đầu tiên đã kéo đủ mọi họ mà hai mươi bốn căn sau dùng. Chú thích đã sửa, và
> nói thẳng rằng ba nhịp hôm nay là một **lưới rẻ** chứ không phải một phép đo đang làm việc.
> **773 bài test** (766 + 7 mới), lint sạch, build xanh, **12/12 phép phá làm ĐỎ đúng câu assert đã
> nêu TRƯỚC khi chạy**. ⏳ **CHƯA gộp `main`** — theo mục 5 chương trình làm việc, gộp `main` LUÔN
> phải hỏi.
>
> *(Trước đó — 2026-08-18)* — **PHASE 10 BƯỚC 2: CẢ 15 KỶ ĐỀU CÓ CỬA RA VÀO, `legacy` ĐÃ
> BỊ XOÁ HẲN.** Đàm duyệt hướng mỹ thuật Bước 1 và ra lệnh làm nốt 12 kỷ. Nay **cả 15 dòng bảng đều
> khai đủ số đo** — không còn giá trị nào nghĩa là "chưa làm", `isValidGroundFloor` **TỪ CHỐI THẲNG**
> dòng thiếu, và `TECH_DEBT #36` (kỷ 1 và 2 không có cửa) **đã đóng**. Thêm **đúng hai kiểu cửa**
> (`flap` tấm da/chiếu rủ có nếp cho kỷ 1–2 — thời chưa có bản lề; `glazed` mặt kính chia đố cho kỷ
> 11 · 14 · 15) và **đúng một đặc trưng** (`arcade` hàng vòm khoét VÀO thân nhà — loggia Firenze ·
> Praça do Comércio · five-foot way Singapore), mỗi thứ phục vụ ≥2 kỷ và diễn đạt một hình học mà
> vốn từ cũ không có (ADR-027). Bản sắc nay **đo bằng 8 TRỤC CẤU TRÚC** thay vì bằng mắt, dùng lại
> nguyên khuôn `streetStyle`: **105/105 cặp ≥3/8 · trung vị 6/8 · cả 8 trục đều còn sống**.
> ⚠️ **Bốn bài học đã trả giá**: **(a)** *"từ chối thẳng" chỉ an toàn khi có người ĐẾM số lần từ
> chối* — kỷ 14 khai `doorWidth: 0.46` vượt trần 0,42, validator từ chối ĐÚNG, hàm dựng trả `false`
> ĐÚNG, và **cả kỷ ấy mất cửa** mà không gì đỏ lên; **(b)** một mốc lịch sử đặt theo **thứ mình
> NHỚ** (cửa chớp lá sách = thế kỷ 17) chứ không theo **thứ mình đang DỰNG** (hai cánh ván trơn, cổ
> ngang cái cửa sổ) lập tức cấm nhà Fachwerk Đức — luật lịch sử quay ra cấm chính lịch sử;
> **(c)** luật *"chưa từng thấy đỏ thì chưa phải test"* áp cho **từng ASSERT**, và hai assert của
> chính phiên này rớt: một vòng lặp "kỷ liền nhau" **không thể đỏ một mình** (tập con của 105 cặp,
> cùng sàn), và một đối chứng cộng-gộp ba lệch 0,001 nên nới **một** ngưỡng vẫn xanh; **(d)** kỷ 4
> và kỷ 6 chỉ khác **1/8 trục** — sửa **BẢNG** (kỷ 4 lùi cửa 0,50→0,62, mở rộng 0,38→0,41, đúng quy
> chế điện cung đình) chứ không hạ sàn, và sửa **kỷ MỚI** chứ không đụng kỷ Đàm đã duyệt.
> **766 bài test** (764 + 2 mới), lint sạch, build xanh, **21/21 phép phá làm ĐỎ đúng chỗ đã nêu
> trước**. ⏳ **CHƯA gộp `main`** — theo đúng mục 5 chương trình làm việc, gộp `main` LUÔN phải hỏi.
>
> *(Trước đó — 2026-08-18)* — **PHASE 10 BƯỚC 1: THÀNH PHỐ CÓ CỬA RA VÀO.** Cả dự án đã
> tách bản sắc theo kỷ ở mái · thảm thực vật · mặt đường, riêng **chỗ mắt nhìn vào đầu tiên khi
> đứng trước một công trình** thì vẫn là một khối `dark` bề ngang **viết cứng 0,14** giống hệt nhau
> ở cả 15 kỷ — và trên nhà dân hẹp nó chiếm gần nửa bề ngang (đúng bệnh `eaves` Phase 7C). Nay có
> **ngữ pháp thứ tư**, đúng khuôn ba lớp đã dùng ba lần: **BẢNG** `groundFloor` ở `eraStyle.js`
> (đủ 15 kỷ, buộc vào `country`, có test bắt) · **HÌNH** ở `city3d/groundFloor.js` (mới, thuần) ·
> `buildingSpec.js` **chỉ ĐỌC**. Bước 1 làm **đúng 3 kỷ** theo lệnh Đàm: **6 Việt Nam** (cửa bức
> bàn + hàng hiên cột gỗ, đình làng Bắc Bộ) · **9 Pháp** (porte cochère hai cánh + ban công sắt
> uốn, chung cư Haussmann) · **13 Nhật** (genkan lùi sâu + cửa lùa + biển hiệu dọc). 12 kỷ còn lại
> khai thẳng `door: 'legacy'` — **trạng thái tường minh ĐẾM ĐƯỢC**, test khoá đúng 12. **KỲ QUAN ≠
> NHÀ DÂN** (hai trường riêng, bài học Phase 7C) và nhà dân bị **LOD cắn thật**. Đo: **không thêm
> một lệnh vẽ nào** (11→11 · 10→10 · 9→9; cả cảnh 13/12/11 — trần Đàm đặt là 13), tam giác thành
> phố +13…21%, ảnh cận cảnh đổi 2,75%/0,89%/0,88%, **bản quét kỷ 1–5 đổi 0,00%**. ⚠️ Ba bài học đã
> trả giá: **(a)** một bài test canh mỹ thuật ĐỎ ở kỷ 13 và câu trả lời đúng không phải nới nó mà
> là **4 tấm cửa lùa trên 2 rãnh** — đúng cổng đền lớn Nhật Bản làm thật; **(b)** một phép đo ĐÚNG
> nhưng **đo sai CẤP ĐỘ** báo oan "kỷ 9 thêm họ vật liệu `wood`" (thành phố gộp lưới theo TOÀN KỶ,
> mà kỷ 9 đã có xưởng dùng `wood`) — hai lần trước loại lỗi này sai theo hướng **trấn an**, lần này
> **gây hoảng** và suýt làm tôi gỡ bỏ một bản vá đúng; **(c)** ba lời khẳng định yếu trong chính
> test tôi vừa viết, chỉ lộ ra khi thử ngược. **764 bài test** (744 + 20 mới), lint sạch, build
> xanh, **18/18 phép phá làm ĐỎ đúng bài mong đợi**. ⏳ **DỪNG ĐÚNG CỔNG ĐÀM ĐẶT — chưa trải 12 kỷ
> còn lại, CHƯA gộp `main`**, chờ Đàm xem 3 ảnh cận cảnh và gật đầu là đúng hướng mỹ thuật.
>
> *(Trước đó — 2026-08-17)* — **PERFORMANCE GATE VÒNG 4: LÀM CHO BỘ ĐO CHẠY ĐƯỢC TRÊN MÁY
> ĐÀM** (đóng `TECH_DEBT #34`, đóng **một nửa** `#35`). Bộ đo đã "nghiệm thu đủ" ở vòng 2 — test
> xanh, lint sạch, thử ngược đạt — vậy mà đưa cho Đàm chạy thì anh mất **5 vòng qua lại** vì bốn
> thứ **không cái nào liên quan tới hiệu năng**: nhánh chưa `git fetch` · `package.json` bẩn chặn
> `checkout` · `three` chưa cài (đổ ra 20 dòng ngăn xếp Vite) · đường dẫn đầy dấu tiếng Việt chưa
> ai thử. Cả bốn là **khoảng cách giữa môi trường viết ra công cụ và môi trường chạy nó**.
> **(A)** `--thu` nay chạy **preflight 8 mục TRƯỚC khi gói bundle**, xếp rẻ-trước-đắt-sau, dừng ngay
> ở mục đầu tiên hỏng, mỗi ❌ in **ĐÚNG MỘT lệnh cần gõ**. **(B)** Sửa chỗ cắt log **ngược**: bản cũ
> `tail -n 20` giữ 20 dòng CUỐI, mà với lỗi build thì nguyên nhân ở **ĐẦU** — nó đã vứt đúng dòng
> `Rolldown failed to resolve import "three"` và giữ lại toàn `at viteLog…`; nay in **đầu + cuối**
> có nhãn, lọc ngăn xếp khỏi phần trích, luôn ghi đường dẫn log đầy đủ. **(C)** Test chạy preflight
> từ thư mục tên `Bản sao Test - CÓ DẤU` ở **cả NFC lẫn NFD**, cộng một bài **đọc mã nguồn** bắt mọi
> biến đường dẫn để trần (đi từng ký tự, vì `"$(… $tam)"` trông như đã bọc nháy mà thật ra không).
> **(D)** `PERFORMANCE.md` có runbook copy-paste 7 bước + bảng "gặp lỗi này thì gõ cái này" cho đúng
> 4 ca đã xảy ra. **(E)** Thử ngược **từng** mục kiểm — và nó bắt được **hai lỗi trong chính bộ đo
> lẫn trong bài test tôi vừa viết** (xem nhật ký). **744 bài test** (736 + 8 mới), lint sạch, build
> xanh. ⚠️ **KHÔNG đụng `src/`.** ⏳ **CHƯA gộp `main` — chờ Đàm quyết.**
>
> *(Trước đó — cùng ngày, vòng 3)* — **ĐÃ CÓ SỐ TRÊN MÁY THẬT, VÀ CÂU
> TRẢ LỜI LÀ "CÒN NHIỀU DƯ ĐỊA".** Đàm chạy bộ đo trên **Apple M3 · ANGLE Metal · 1100×700 · DPR 2**:
> 24/24 cảnh + 1 cảnh đối chiếu, tất cả ĐẠT. Frame time **3,90–5,20 ms** trên trần 16,67 ms ⇒
> **dư 3,2 lần** (192–256 hình/giây), không khung nào trượt 60 fps kể cả đỉnh nhiễu 9,2 ms.
> **Mô hình chi phí**: `≈ 0,87 ms cố định + 1,14 ms mỗi TRIỆU ĐIỂM ẢNH THẬT (đã nhân DPR 2)` ⇒
> **80% chi phí đi theo ĐIỂM ẢNH, 20% cố định.** **Phát hiện lớn nhất: thứ ăn thời gian là GIỜ
> TRONG NGÀY (đèn), KHÔNG phải KỶ** — 22h chậm hơn ban ngày +0,8 ms (+19%) ở CẢ 4 kỷ, trong khi
> tam giác thành phố chênh **43%** giữa kỷ 3 và 11 chỉ đổi **2,4%** thời gian. Ba vòng đi tìm "kỷ
> nào nặng" và câu trả lời là **không kỷ nào** — chọn sai TRỤC để đo thì đo bao nhiêu vòng cũng
> không ra. ⚠️ **Rặng núi chân trời chiếm 54–63% hình học nhưng 0 ms đo được ⇒ ĐỪNG ĐỤNG VÀO.**
> Chi phí dựng lại bản đồ bóng **nằm dưới nhiễu ở mọi cảnh ⇒ ghi là "CHƯA ĐO ĐƯỢC", KHÔNG ghi
> thành một con số.** Bản ghi chính thức: **`PERFORMANCE.md`** (mới) — đọc TRƯỚC mọi phase mỹ thuật.
> `TECH_DEBT`: **#23 và #26 đóng NỬA DESKTOP** (không cần hạ `metalness`, không cần LOD nhà dân —
> hình học là trục rẻ nhất), nửa iPhone vẫn mở; **mở #34** (`--thu` không kiểm `node_modules/three`
> trước nên lỗi thiếu thư viện hiện ra thành 20 dòng lỗi Vite — đã cắn Đàm thật, mất 4 vòng qua
> lại) và **#35** (bộ đo chưa từng chạy thử ở đường dẫn có dấu tiếng Việt + dấu cách như máy Đàm).
> **736 bài test**, lint sạch, build xanh. ⏳ **CHƯA gộp `main` — chờ Đàm quyết** (nhánh có đụng
> `src/`, xem cuối nhật ký).
>
> *(Trước đó — cùng ngày, vòng 2)* — **Vá xong phép đo vẫn kết luận SAI.**
> Vòng 1 chữa được "HUD nói dối" (thiếu 56%), rồi lấy chính con số ĐÚNG ấy trả lời sai câu hỏi
> *"kỷ nào nặng"*: `countSceneTriangles` duyệt CẢ CẢNH nên **44.126 tam giác vòm trời + rặng núi**
> — một HẰNG SỐ ở cả 15 kỷ — nằm trong số của mọi kỷ, pha loãng khác biệt thật **1,43 lần** xuống
> còn **1,16 lần** (cả 15 kỷ thì là **2,46 lần**: kỷ 13 = 41.102 so kỷ 2 = 16.738). Đúng hình dạng
> `TECH_DEBT #22`. **(A)** Nay báo **BA con số** — thành phố · nền · tổng — cho cả tam giác lẫn lệnh
> vẽ, tách theo **NGUỒN GỐC khối** (`userData.sceneLayer` gắn lúc TẠO), HUD cũng hiện tách. Nền
> chiếm **54–63%** hình học mỗi khung trên 4 kỷ của ma trận (**52–72%** nếu xét cả 15 kỷ) — ĐÂY LÀ
> QUAN SÁT, KHÔNG phải đề xuất cắt; rặng núi giữ nguyên. **(B)** Đi gỡ quả mìn "cắt vật ngoài khung"
> thì **đo ra là mìn chưa có ngòi**: cả cảnh chỉ có **7 khối**, khối nào cũng bao trùm camera hoặc
> có tâm ở gốc toạ độ, nên **không mức zoom nào cắt được gì**. Vẫn đổi nhãn thành *"trong cảnh"* vs
> *"đã vẽ (sau khi cắt)"* và khoá bằng QUAN HỆ (`đã vẽ ≤ trong cảnh`), KHÔNG khoá "luôn bằng nhau".
> **(C)** Gỡ hai chỗ ngoại suy tự mâu thuẫn khỏi báo cáo vòng 1 (bỏ chữ *"giá thật"*, bỏ *"lấy mẫu
> bóng ≈ 0%"*, bỏ hẳn phần ngoại suy ~144 ms). **(D)** `bench-macbook.sh` có chế độ khói `--thu`,
> kiểm mã thoát từng cảnh, đếm N/24, **dừng ngay** nếu card là SwiftShader, thêm 1 cảnh 1600×1000.
> **736 bài test** (731 nền + 5 mới), lint sạch, build xanh. ⏳ Vẫn chờ Đàm chạy trên MacBook.
>
> *(Trước đó — cùng ngày)* — **PERFORMANCE GATE: kiểm chính ĐỒNG HỒ ĐO trước khi tin nó.**
> Đàm yêu cầu đo dư địa để biết *"còn được phép làm thành phố đẹp tới đâu"*, và cấm mọi tối ưu
> trước khi đo. **BƯỚC 0**: máy chạy AI là Linux + SwiftShader (tô hình bằng CPU) ⇒ **KHÔNG xuất
> một con số FPS nào**, chuyển sang dựng bộ đo cho Đàm tự chạy. **BƯỚC 1 BẮT ĐƯỢC MỘT LỖI THẬT VÀ
> ĐÃ SỬA**: `sceneGraph.js` **dự đoán** số tam giác bằng công thức riêng, chưa ai từng đặt nó cạnh
> `renderer.info.render.triangles`. Đặt lần đầu: HUD báo **34.622**, máy vẽ **78.748** — **thiếu
> 56%**, lệch **đúng 44.126 ở CẢ 15 kỷ**, chính là **vòm trời** (960) + **rặng núi chân trời** thêm
> ở Phase 9A (43.166). Sai theo hướng **trấn an** — loại sai tệ nhất cho một đồng hồ đo. Vá gốc:
> thôi dự đoán, **đếm** scene graph (`countSceneTriangles`), và `publishStats()` đè lên bằng
> `renderer.info` của khung vừa vẽ. Sau vá: **78.748 = 78.748, lệch 0,0%**. Khoá bằng
> `sceneStats.test.js` (3 bài, cả 3 đã thử-cho-đỏ, tự duyệt cảnh rồi so với mã sản phẩm — chạy CẢ
> HAI bên). Ghi `TECH_DEBT #32` (đã đóng) vì đây là **lần thứ HAI cùng hình dạng sai** — chú thích
> `countTriangles` (`parts.js`) đã tự cảnh báo đúng cái bẫy này từ Phase 8B mà vẫn tái diễn ⇒ **một
> bài học được ghi ra không chặn được gì, chỉ một bài TEST mới chặn được**. **BƯỚC 2** tách bóng đổ
> thành ba câu hỏi khác nhau — ⚠️ **cả ba con số đều đo trên SwiftShader (CPU rasteriser) ở khung
> 400×250, KHÔNG suy ra được cho MacBook**: lấy mẫu bóng **−4,0 ms, nằm trong nhiễu ±15 ms** (chỉ
> được nói "nhỏ hơn mức phép đo này phân giải được", KHÔNG được nói "≈ 0%") · dựng lại bản đồ bóng
> **+29,4 ms (+14,0%)**, chỉ nổ khi thành phố ĐỔI · và chi phí ấy **không** nằm trong bảng FPS.
> **BƯỚC 3** mở rộng `--bench` sẵn có (không viết công cụ mới — đã **GỠ** `bench-suite.mjs`/
> `benchCore*` của lượt trước vì hai bộ đo song song là đúng bẫy "một luật hai công thức"): thêm
> P50/P95, đối chiếu `renderer.info`, DPR/cỡ bóng/shader/geometry/texture, cờ `--gpu` (dùng card
> thật) và đường dẫn Chrome trên macOS. **Thử ngược ĐẠT**: `--dpr` 1→2→4 làm frame time
> 218,5 → 488,7 → **1337,2 ms** (6,1×) ⇒ cần gạt có nối. **731 bài test** (số THẬT, đếm lại ở vòng 2 — vòng 1 ghi nhầm 739), lint sạch, build xanh.
> ⏳ **Bước 4/7/8 CHƯA làm được ở đây** — chờ Đàm chạy `bash scripts/bench-macbook.sh` trên MacBook.
>
> *(Trước đó — 2026-08-16)* — **Phase 9D: MẶT ĐƯỜNG LÀ MỘT HỆ THỐNG, KHÔNG PHẢI MỘT DẢI MÀU**
> (đóng luôn `TECH_DEBT #30` + `#27`, hai mục đã bị nối cứng với nhau từ Phase 9B). **Nguyên nhân
> gốc**: bản sắc mặt đường xưa nay tựa lên **đúng MỘT trục là MÀU**, nên toàn bộ sức ép "15 kỷ phải
> khác nhau" dồn hết vào ĐỘ ĐẬM — mà độ đậm thì có ĐÁY. Phép đẩy lại chỉ có SÀN, không có TRẦN
> (0,13 **cộng thêm** vào chênh lệch riêng của vật liệu), nên vật liệu nào vốn đã tối thì bị đẩy hai
> lần và rơi khỏi đáy: nhựa đường kỷ 11 render ra **0,113** trên nền đất 0,406 — một cái rãnh đen.
> **Cách sửa (ADR-025)**: bản sắc chuyển sang **9 trục CẤU TRÚC** (`src/engine/city3d/streetStyle.js`,
> thuần) — bề rộng đại lộ · bề rộng ngõ · vật liệu lát · cỡ viên · độ mòn · bó vỉa · vỉa hè · vạch kẻ ·
> kiểu mép; phép đẩy độ đậm nay **bão hoà, có cả sàn lẫn trần mà vẫn đơn điệu ngặt**. Bài test
> `15 KỶ RA 15 MẶT ĐƯỜNG` **thôi chấm bằng RGB**, chấm bằng chính 9 trục ấy: 105 cặp, yếu nhất
> **3/8**, trung vị **6/8**, không cặp nào dưới 3. Màu vẫn được canh nhưng chỉ còn là lưới chống sập
> (trung vị 116,4) — và cặp gần nhau nhất về màu **bắt buộc phải là hai kỷ dùng CHUNG vật liệu**,
> nếu không là bảng đã trôi. **Nghiệm thu trên điểm ảnh đã dựng** (`scripts/road-score.mjs`, 7 bài
> tự-kiểm): 4 kỷ × 3 giờ = **12/12 đạt**, `sắc` mỏng nhất 0,056 (ngưỡng 0,05) · `hố` xấu nhất 0,201
> (ngưỡng 0,26) — **không còn ô nào là rãnh**. Kèm **một lỗi đọc sử đã sửa**: kỷ 7 lát đường bằng
> `pietraforte` — đá **XÂY TƯỜNG** của Firenze — nên đường và đất gần như cùng màu (0,050); đổi sang
> **pietra serena**, thứ đá thật sự dùng lát đường, ra **0,200**. **728 bài test**, lint sạch, build
> xanh. Hiệu năng (4 kỷ, cùng camera/giờ/seed): tam giác **+1,0…+2,1%**, **lệnh vẽ ĐỨNG YÊN** ở cả 4
> kỷ (cả hệ thống đường vẫn là MỘT lệnh vẽ); ms/khung **không kết luận được** — kỷ 14 còn *nhanh
> lên*, tức phép đo đang bị nhiễu át (biên độ trong cùng một lần chạy ±4,5% > mọi chênh lệch đo được).
> Bản quét 15 kỷ chạy lại: **0/105 cặp kỷ** + **0/15 cặp chặng** dưới ngưỡng (gần nhất 22,8 · trung
> vị 40,7 — 9D không đẩy cặp nào xuống dưới ngưỡng).
>
> *(Trước đó — 2026-08-16, **`TECH_DEBT #22` ĐÃ ĐÓNG**: công cụ chấm bản quét thôi đo "thứ tươi nhất
> khung hình" rồi **gọi** đó là mái. Chữ "≈" trong *"8% tươi nhất ≈ mái"* là một giả định mỹ thuật
> không được viết ra; nó đúng khi mái suy từ màu nhấn giao diện, và **chết ở Phase 6B** khi mái thành
> vật liệu lợp thật — từ đó công cụ chấm **CỎ** suốt ba phase. Không vá bộ lọc (**4/15 kỷ khai mái
> TRÙNG vật liệu tường** ⇒ mái không tách được ngay từ NGUỒN) mà **bỏ hẳn proxy**: dải thành phố chia
> lưới **6×3 ô con** (`scripts/sweepMetric.mjs`), giữ nguyên đơn vị RGB/255 nên ngưỡng mắt 12 còn
> dùng được. `TECH_DEBT #19` nhờ đó đo lại được và cũng ĐÓNG. **718 bài test**.)*

---

## ✅ Đã làm (xong, đa số đã deploy)
- **AI Coach = CHỈ GEMINI (đám mây)** (2026-06-24, Đàm: "bỏ Qwen, chỉ còn Gemini"): mọi phản hồi do Gemini sinh; ĐÃ GỠ HẲN Qwen2.5-3B + WebLLM + dep `@mlc-ai/web-llm`. **CHẠY CẢ iPhone**, app nhẹ hơn, không tốn RAM/đĩa. Đánh đổi: mất mạng/hết quota/chưa-có-key → Coach ngừng (báo lỗi + Thử lại), không còn dự phòng on-device. Cổng `api/coach.js` (giữ `GEMINI_API_KEY`, flash→flash-lite, tắt thinking) + `cloudEngine.js`. 2 lối vào (Hỏi Coach + AI phân tích tổng thể) dùng CHUNG "bộ não đã đào tạo" model-agnostic: prompt + lưới chống-bịa + tầng SỐ LIỆU (`gameMath`/`coachIntel`/`buildAnalystContext`) + gợi ý (`coachSuggest`). **`GEMINI_API_KEY` đã ở Vercel env + ĐÃ BẬT BILLING (paid tier, 2026-06-24) → hết 429, chạy ổn định** trên `gemini-2.5-flash`. Đã GỠ trước đó: ⚡Nhanh, Hỏi Claude (Anthropic), MiniLM, giọng cảm xúc.
- **Cộng Hưởng**: nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu, có chặn lạm phát.
- **Focus Intelligence (tầng số liệu)**: hồ sơ + dự đoán "giờ vàng" + khuyến nghị — giờ là NGUỒN SỐ cho Qwen đọc (không tự hiển thị nữa).
- **Web Push iPhone**: đã làm xong & deploy.
- **Giao diện Thụy Sĩ** + bộ icon tự vẽ thay emoji.
- **Đồng bộ Supabase** (game_state + timer_live cho menu bar Mac).

## 🔧 Đang làm
- **THÀNH PHỐ 3D** (kế hoạch Đàm duyệt 2026-08-12, mở rộng từ `SPEC V2 Thành Phố 3D`).
  Phase 1, 2, 3-2D, 3A, **3B-1/3B-2/3B-3 đã xong & push**. ✅ Cổng hiệu năng đã qua (Đàm quyết).
  - Đã đạt sẵn (đo được trên máy build): chunk `vendor-three` = **130,66 KB gzip** ≤ ngưỡng 135;
    chunk chính không to thêm; three KHÔNG bị precache nhưng vẫn chạy offline.
  - **Đàm yêu cầu tiếp** (nguyên văn): *"tối ưu hình ảnh và cộng đồng cư dân, hãy cố gắng làm đẹp
    như các bức tranh phục hưng, nhiều animation lên và nhiều hiệu ứng hơn, đem nó ra trang chủ
    hoặc làm cái gì đó đột phá hơn nữa"*. Chia thành: **3B** hình khối + cư dân (XONG) · **3C**
    ánh sáng/màu Phục Hưng · **3D** hiệu ứng sống động · **3F** đem thành phố ra trang chủ.
  - Lưới an toàn KHÔNG được gỡ dù đã qua cổng: watchdog FPS, ba cửa lùi 2D, trần 30 khung/giây.

## ✅ NÂNG CẤP TRÍ TUỆ AI COACH — chuỗi 6 mảng (2026-06-25, code XONG hết; mảng 6 MỚI THỰC SỰ LÊN PRODUCTION 2026-07-11)
> Đàm ra lệnh "làm toàn bộ, chuyên sâu" sau workflow đề-xuất 10 agent. Cả 6 mảng test xanh, code đã commit đủ.
1. **Siết niềm tin ✅** — nhiệt độ 0.3→0.2/0.8, bộ chấm điểm chống-bịa (`coachEval`), timeout 28s + `vercel.json` maxDuration, CoachOffline viết-lại-có-hướng-dẫn, dọn chữ Qwen cũ.
2. **Tín hiệu "phiên trơn vs ngắt quãng" ✅** — `getInterruptionPattern` đọc `pauseSegments` (chiều chất lượng trước bị bỏ phí) + chip `flow`.
3. **Coach tự nhắc sau mỗi phiên ✅** — `CoachNudge.jsx` (in-app, chủ động, bám số phiên vừa xong, qua guard).
4. **Model mạnh hơn cho bài 4 phần ✅** — `buildModelChain` tier 'deep' = gemini-2.5-pro (rơi về flash).
5. **Bộ nhớ lời khuyên ✅** — `coachAdviceMemory` (cá nhân hoá: nhớ lời khuyên chỉnh mục tiêu + theo dõi theo thời gian).
6. **Cảnh báo chuỗi sắp đứt qua push ✅ (code) — ⚠️ CHỈ THỰC SỰ CHẠY TỪ 2026-07-11.** Commit `8ee264d` (25/6, thêm `api/coach-digest.js`) **bị Vercel FAIL build** lúc đó (rất có thể cùng nguyên nhân "vượt trần 12 Serverless Functions" — xem mục Vercel Hobby ở `CLAUDE.md`, phát hiện lại khi soát log Deployments ngày 11/7). Vercel giữ nguyên bản deploy trước đó (mảng 5/6) khi build fail → **tính năng này coi như CHƯA TỪNG chạy thật trên production suốt 25/6–11/7** (cron `api/coach-digest` không tồn tại trong bản đang chạy, dù code + tài liệu đã ghi "hoàn tất"). Chỉ thực sự lên production từ deploy `caec62a` (11/7, sau khi fix trần function). Bài học: **build FAIL trên Vercel PHẢI được xác nhận đã hết**, đừng chỉ tin log local/test xanh — kiểm tra tab Deployments thấy "Ready" thật sự.
- ⚠️ **CẦN ĐÀM THỬ TAY** (không test được trên dev): (a) câu nhắc-sau-phiên hiện sau khi xong PHIÊN THẬT; (b) bài "AI phân tích tổng thể" giờ chạy pro — xem có chậm/khác chất lượng không; (c) dòng "Ghi nhớ" lời khuyên hiện sau ≥3 ngày; (d) thông báo chuỗi-sắp-đứt: **từ nay** (11/7) chiều nào quên làm sẽ nhận push (cần đã bật push iPhone) — đây là lần đầu tiên thực sự có cơ hội chạy thật.

## 🔜 Sẽ làm tiếp (ưu tiên từ trên xuống)

> ⚠️ **CHƯƠNG TRÌNH ĐANG CHẠY (2026-08-18)** — Đàm đã duyệt hướng mỹ thuật Bước 1 và ra một
> **chương trình làm việc liên tục** cho giai đoạn "tiêu ngân sách" hiệu năng (dư 3,2 lần trên M3),
> gồm ba phase theo THỨ TỰ CỐ ĐỊNH, với **uỷ quyền tự chạy** giữa các phase:
> **Phase 10 Bước 2 ✅ (tầng trệt đủ 15 kỷ)** → **Phase 11 (MÁI — phase có thu hoạch thị giác lớn
> nhất, vì camera mặc định NHÌN XUỐNG nên mái là bề mặt lớn nhất trong khung hình)** → **Phase 12
> (ĐO tỉ lệ khung hình thành phố chiếm, rồi TRÌNH PHƯƠNG ÁN và DỪNG)**.
> ⚠️ **Ranh giới Đàm đặt — chỉ 6 ca phải dừng hỏi**: (1) **gộp `main` — LUÔN LUÔN hỏi**; (2) cổng
> nghiệm thu trượt 2 lần liên tiếp; (3) muốn đụng file ngoài danh sách cho phép (`src/engine/city3d/*`
> + test + `scripts/*` + tài liệu; **CẤM**: bảng màu · ánh sáng · đường · địa hình · thực vật ·
> camera · store · sync · AI Coach · `api/`); (4) phát hiện điều mâu thuẫn `PERFORMANCE.md`;
> (5) hết bước đo của Phase 12; (6) một quyết định mỹ thuật mà độ tự tin **dưới 80%**.
> ⚠️ **Được tiêu: tam giác · khối · đỉnh. CẤM tiêu: lệnh vẽ mới · vật liệu mới · nguồn sáng mới ·
> texture mới.** Và cấm "tối ưu hiệu năng" — máy còn dư 3,2 lần, mọi lo lắng về hiệu năng phải trả
> lời bằng `PERFORMANCE.md` chứ không bằng cảm giác.

0. **NHÁNH THÀNH PHỐ 3D — thứ tự Đàm đã chốt, KHÔNG được nhảy bước.**
   *Visual Foundation (**7A ✅**) → Terrain/City (**7B: địa hình ✅ · mật độ + khu dân cư CHƯA**) →
   Roads → Historical Architecture → Living City → Pomodoro → Polish.*
   **Việc kế tiếp = "mật độ + khu dân cư"**: thêm nhà dân nhỏ/vừa/lớn, cửa hàng, xưởng, kho, công
   trình phụ, và quy hoạch **ngoại vi → khu dân cư → trung tâm → landmark**. Đây là thứ Đàm phàn nàn
   rõ nhất còn lại — đất vẫn trống nhiều, 5 công trình cho cả một lưới 12×12.
   ⚠️ **Hai việc PHẢI làm TRƯỚC khi thêm nhà**: (a) Đàm đo lại cổng hiệu năng iPhone (`TECH_DEBT #23`)
   — phase này thêm hình học THẬT nên nếu không đo trước sẽ không tách được thủ phạm khi máy nóng;
   (b) Đàm chọn hướng cho `TECH_DEBT #24` (khung hình đang cắt công trình) — thành phố càng dày thì
   phần bị xén càng nhiều, và chỉnh bố cục + chỉnh khung một lần rẻ hơn hai lần.
   ⚠️ **CẬP NHẬT 2026-08-17 — việc (a) nay chỉ còn đúng nửa iPhone.** Nửa **Desktop đã đo và ĐẠT**
   trên MacBook M3 (dư 3,2 lần), và bộ số ấy nói rằng **thêm hình học gần như miễn phí** — 43%
   chênh tam giác chỉ đổi 2,4% thời gian. Tức trên Mac, "thêm nhà" **không còn là việc phải xin
   phép hiệu năng**. Trên iPhone thì vẫn chưa ai đo. **Trước mọi phase mỹ thuật, đọc
   `PERFORMANCE.md`** — nó nói bằng SỐ thứ gì rẻ (hình học), thứ gì đắt (điểm ảnh + ánh sáng), và
   ba thứ tuyệt đối không nên đụng.
1. **Giao diện còn dở**: full-screen iPhone (tai thỏ che mép trên), nút đóng ✕ cho hộp phần thưởng, gom cỡ chữ cho đồng nhất, tắt hiệu ứng cho người nhạy chuyển động.
2. **(Giai đoạn A, gần xong)** Lưới an toàn test: đợt 1 (2026-07-13) phủ `completeFocusSession`/
   `cancelFocusSession`/`syncService`; đợt 2 (2026-07-17) phủ nốt `computeLevelUps`, bảo-toàn-tài-sản
   qua `triggerPrestige`, streak, `unlockSkill`, sync-retry. CÒN THIẾU (nhỏ): các nhánh early-return
   phạt (khủng-hoảng/thăng-cấp thất bại — cần dùng action khởi tạo thật làm builder) + ma trận
   waive-bằng-than-lượng + nhánh safeCancelPerk — xem NOTE trong các file test.
3. **(Tuỳ chọn, không gấp)** Tách nhỏ `gameStore.js`/`completeFocusSession` — hoãn có chủ đích ở đợt
   refactor 2026-07-12 vì rủi ro cao hơn lợi ích; NAY đã có characterization golden-master làm lưới
   an toàn nên rủi ro tách giảm, nhưng vẫn chỉ làm khi thật cần (xem `ARCHITECTURE.md` mục 6).

## ⚠️ Nhớ kỹ (kẻo hỏng)
- **PHÂN LOẠI LỆNH** (Đàm dặn 2026-06-21): **"nghiên cứu/tìm hiểu/đề xuất"** = CHỈ trình bày rồi DỪNG, KHÔNG tự sửa/commit/deploy (câu mơ hồ → coi là nghiên cứu, hỏi trước). **"làm/sửa/thêm/đổi/deploy"** = (1) giải thích ngắn gọn dễ hiểu công dụng TRƯỚC khi sửa → (2) làm → (3) giải thích đã sửa gì + ích gì → (4) TỰ ĐỘNG deploy Vercel (khỏi hỏi lại). Chi tiết: memory `ask-before-acting.md`.
- **Không bấm chạy phiên focus trên bản dev/localhost** — nó dùng chung dữ liệu với bản thật, sẽ ghi đè dữ liệu của Đàm.
- **AI Coach = CHỈ Gemini (đám mây)** (Đàm chốt 2026-06-24): đã gỡ ⚡Nhanh/Claude/MiniLM/briefing-luật/giọng-cảm-xúc + Qwen/WebLLM. ĐỪNG khôi phục trừ khi Đàm yêu cầu. Muốn đổi câu Coach → sửa PROMPT (`COACH_OFFLINE_SYSTEM`/`COACH_CHAT_SYSTEM` ở `src/engine/coach/prompt.js`) hoặc SỐ LIỆU nạp vào (`buildAnalystContext` ở `src/engine/coach/coachContext.js`); đổi model → `DEFAULT_MODEL`/`FALLBACK_MODEL` ở `api/_lib/gemini.js` (hoặc env `GEMINI_MODEL`). *(2026-07-12: `coachPrompt.js` tách thành `prompt.js`+`guard.js`, cả thư mục `src/engine/llm/` dời sang `src/engine/coach/` — xem `PROJECT_STRUCTURE.md`.)*
- **NIỀM TIN = TÀI SẢN QUÝ NHẤT:** lưới chống-bịa tất định (`src/engine/coach/guard.js`) phải chạy TRƯỚC mọi nội dung AI hiện ra / gửi push. Có bộ chấm điểm `src/engine/coach/eval.test.js` (đo BẮT %/BÁO NHẦM %) — sửa guard mà tụt điểm = phải xem lại. Quy tắc vàng: thà SÓT một câu bịa còn hơn BÁO NHẦM xoá oan câu thật (FPR phải = 0).
- Luôn `npm test` trước khi commit; luôn chạy `git status` tươi (đừng tin ảnh chụp cũ).
- **Lịch sử git `main` từng bị xáo** (thao tác git song song): bản đang chạy là `eb44638` — chứa ĐỦ mọi việc gần đây (Hỏi Coach offline + fix đêm khuya + Coach offline analyst). Vài commit cũ (`1e27505`, `9fbcd62`) thành dangling, KHÔNG còn trong `git log` nhưng code vẫn nằm trong bản deploy. Đừng hoảng nếu không thấy chúng.

## 🗒️ Nhật ký cập nhật

### 2026-08-18 — Việc 3 / Phase 11: mái thôi là một tấm phẳng trơn (ADR-030)

**Đàm yêu cầu**: *"(1) thứ phá vỡ mặt phẳng — ống khói · bể nước · cục nóng · lồng thang máy · cột
ăng-ten · giàn phơi · chậu cây sân thượng; (2) thứ tạo đường nét trên mái — sống mái nổi, ngói bò,
đầu đao, lan can mái; (3) cửa sổ mái/dormer (kỷ 9 Pháp, kỷ 10 Anh). Mỗi kỷ đúng một-hoặc-hai đặc
trưng, buộc vào `country`, có test khoá."* Và một câu dặn riêng về ảnh nghiệm thu: *"Nếu hai bản
quét vẫn khó phân biệt như Bước 2 thì phase này CHƯA đạt mục tiêu của nó — nói thẳng ra, đừng khoe
test xanh thay cho kết quả nhìn được."*

**Đã làm**

1. **`city3d/roofStyle.js` — bảng 15 kỷ, HAI TRỤC vuông góc.** `stack` (thứ nhô lên phá mặt phẳng,
   11 kiểu) và `crown` (thứ vẽ đường nét, 6 kiểu). Mỗi kỷ có một chú thích dài nêu đích danh công
   trình có thật: lều tranh Anatolia · nhà bùn sông Nin · ziggurat Ur · điện Trung Hoa · Burg Eltz ·
   đình làng Bắc Bộ · dinh thự Phục Hưng · nhà Pombaline Lisboa · Panthéon + mái Haussmann · nhà máy
   Manchester · nhà thuê New York · nhà tập thể Xô Viết · tháp Nakagin · Marina Bay · Dubai.
2. **Tách đôi kỳ quan ↔ nhà dân ở 4 trường** (`crown`/`stack` ↔ `vernacularCrown`/`vernacularStack`),
   bắt buộc cả 15 kỷ. Bốn ca đo được, không ca nào hai vế trùng: Panthéon giấu mái sau lan can ↔
   mái kẽm Haussmann cắm đầy lucarne · nhà máy Manchester mái răng cưa ↔ dãy nhà thợ ba ống khói ·
   tháp Beaux-Arts buồng máy thang ↔ nhà thuê New York bồn nước gỗ · ziggurat Ur tường chắn ↔ nhà
   bùn cửa sập lên mái.
3. **`stackCount` thì CỐ Ý KHÔNG tách** — "một ống khói Đức, ba ống Manchester, bốn cục nóng
   Singapore" là sự thật văn hoá của cả thành phố, không phải một mức chi tiết. Hỏi lại đúng câu
   hỏi cũ (*"ngoài đời hai thứ này có luôn đi cùng nhau không?"*) thì lần này đáp án là **CÓ**.
4. **`city3d/rooftop.js` — hình.** Mọi kích thước là tỉ lệ có trần; mái hẹp hơn `ROOFTOP_MIN_SPAN`
   thì **không có gì trên nó**, chứ không phải một cái ống khói tí hon.
5. **23 bài test mới** (`roofStyle.test.js` 11 · `rooftop.test.js` 12), **15 phép phá** đều nêu
   trước chỗ mong đợi đỏ.

**Số đo**

| | Trước | Sau |
|---|---:|---:|
| Bài test | 775 | **798** |
| Lệnh vẽ (15 kỷ) | 9·11·11·11·10·11·11·11·10·12·10·10·10·10·10 | **y hệt — 0 lệnh vẽ mới** |
| Tam giác thành phố | 394.466 | **504.458** (+27,9%) |
| Phần mái chiếm | — | **21,8%** tổng tam giác |
| 105 cặp kỷ, 6 trục | — | cực tiểu **2** · trung vị **4** · cả 6 trục còn sống |

**Ba phát hiện đáng ghi**

- **Bài test bắt được lỗi thật trong mã vừa viết, lần thứ hai liên tiếp.** Bài "kỳ quan cân tuyệt
  đối với MỌI tổ hợp" duyệt cả 6 × 11 (thay vì chỉ tổ hợp bảng ĐANG dùng) và đỏ ở `planter`:
  `emitPlanter` nhét `off` vào **chuỗi khoá** hạt giống rồi gọi `at(k, 0)`, tức vô hiệu hoá nút bịt
  đối xứng đặt ở `emitRooftop` — chỗ thứ mười sáu mà chính chú thích ở đó đã cảnh báo. Lỗi này
  không lộ ra ở kỷ 15 (kỷ duy nhất dùng tổ hợp ấy) vì mái nó chỉ nhét vừa MỘT bồn ⇒ `off = 0` ⇒
  khoá tự cân.
- **Phép phá thứ 15 không nổ, và nghi phép phá trước là đúng.** Ép `anchors.rw`/`rd` về hằng số
  không làm đỏ bài "không có hai mái giống hệt nhau" — vì `deck`/`ridges` tính từ biến `rw` **cục
  bộ**, tôi ghim một trường mà phần lớn mã không đọc. Phá đúng thì đỏ. Đo tiếp mới thấy bài ấy được
  giữ xanh bởi **HAI** thứ độc lập, và nguồn biến thể thật nằm ở **bộ sinh khối nhà** chứ không ở
  `rooftop.js` — đã ghi thẳng vào chú thích.
- **Một đối chứng suýt đỏ oan vì dấu phẩy động, và nó che một sự thật thứ hai.** Đối chứng "bước
  lượng hoá không được quá thô" đứng đúng TRÊN ngưỡng nên kết quả do sai số phép cộng quyết định.
  Đổi sang ghim hai phía (99,9% không thấy · 100,1% phải thấy) — chặt hơn bản cũ. Lúc đo mới lộ ra:
  bước của `barrel` (1,459) **rộng hơn cả dải hợp lệ** (1,25) ⇒ hai kỷ cùng lợp ngói ống không bao
  giờ tách được bằng trọng số. Khoá bằng `assert.deepEqual(KHONG_VUA_DAI, ['barrel'])` + `TECH_DEBT
  #39`.

**Nợ mở thêm**: `#39` (trục `crownWeight` mỏng) · `#40` (`parts.js` không có `rx`/`rz` nên ngói ống
là phép xấp xỉ). Cả hai Low, đều có điều kiện xem lại.

**Chưa làm**: chưa gộp `main` (mục 5 chương trình làm việc — luôn phải hỏi Đàm).

---

### 2026-08-18 — Phase 10 Bước 2: cả 15 kỷ có cửa, `legacy` bị xoá hẳn (đóng `TECH_DEBT #36`)

**Đàm yêu cầu**: duyệt hướng mỹ thuật Bước 1 (kỷ 6 · 9 · 13) và ra một **chương trình làm việc liên
tục** — Phase 10 Bước 2 → Phase 11 (mái) → Phase 12 (đo khung hình rồi dừng) — kèm uỷ quyền tự chạy
giữa các phase và đúng 6 ca phải dừng hỏi (xem mục "Sẽ làm tiếp"). Riêng kỷ 1–2 anh dặn thẳng:
*"cửa phải THÔ SƠ đúng thời — khung gỗ, tấm da, rèm cỏ. Đừng bịa cho sang. 'Không có gì' cũng là
một câu trả lời hợp lệ, miễn là khai tường minh chứ không rơi về mặc định."*

**Đã làm**

1. **12 dòng bảng còn lại trong `eraStyle.js`.** Mỗi dòng có một chú thích dài nêu đích danh công
   trình có thật của nước ấy: Göbekli Tepe · Deir el-Medina · ziggurat Ur · điện cung đình · Burg
   Eltz · Firenze (loggia Brunelleschi) · Praça do Comércio · Manchester công nghiệp · New York Mạ
   Vàng · khối nhà Xô Viết · five-foot way Raffles + Marina Bay · Bảo tàng Tương Lai Dubai.
   ⚠️ **Bốn kỷ khai `feature: 'none'` (1 · 3 · 5 · 12) và đó là BỐN CÂU TRẢ LỜI KHÁC NHAU, không
   phải bốn chỗ trống**: kỷ 1 chưa có gì để gắn · kỷ 3 (và nhà dân kỷ 15) quay vào sân trong nên
   mặt phố trơn · kỷ 5 và 12 cố ý trống trơn vì lý do phòng thủ.
2. **Ba đường hình học mới trong `groundFloor.js`** (ADR-027) — thêm ĐÚNG chừng này, mỗi thứ phục
   vụ ≥2 kỷ: `flap` (tấm mềm rủ, số nếp + độ vén theo hạt giống — thời chưa có bản lề) · `glazed`
   (mặt kính chia đố, dùng vai `glass` nên **ban đêm tự phát sáng** — một sảnh kính tối om lúc 22h
   là một sảnh chưa xây xong) · `arcade` (hàng vòm khoét VÀO thân nhà, khác `porch` là đua RA).
   `balcony` cũng được dựng lại thành **hai cỡ có lý do lịch sử**: ban công quy chế Haussmann chạy
   liền mặt tiền (công trình chính) vs chiếu sắt hẹp / cầu thang thoát hiểm New York (nhà dân).
3. **Xoá `legacy` khỏi ba nơi**: `DOOR_KINDS`, `isValidGroundFloor` (nay từ chối thẳng), và khối
   cửa đời cũ trong `emitWindows` (thay bằng một cảnh báo *"ĐỪNG THÊM LẠI MỘT CÁI CỬA VÀO ĐÂY"*).
   `LEGACY_DOOR_WIDTH = 0.14` **giữ lại có chủ đích** — nó là đối chứng nhốt bộ số hỏng cũ.
4. **Phép đo bản sắc 8 trục** (`groundFloor.test.js`), dùng lại nguyên khuôn `streetStyle`.
5. **Đo lệnh vẽ + tam giác ĐỦ 15 KỶ, hai lượt** (trên `HEAD` và trên cây làm việc) — lần đầu tiên
   cả 15 kỷ được đo, bảng đầy đủ ở `PERFORMANCE.md`. **Bước 2 thêm ĐÚNG 0 lệnh vẽ ở cả 15 kỷ**;
   tam giác thành phố 474.924 → 535.360 (**+12,7%**, kỷ nặng nhất +24,6%). ⚠️ Phép tự-kiểm của
   chính bảng ấy: kỷ 6 · 9 · 13 (đã làm ở Bước 1) phải **không đổi một tam giác nào** — và chúng
   khớp từng đơn vị, nên 12 con số Δ còn lại đọc được.
6. **Vá bài test "không thêm lệnh vẽ" lần thứ HAI** — nó dựng quần thể bằng 21 công trình **giả
   định** rồi gọi đó là "cả thành phố". Nay hỏi quần thể **THẬT** qua `computeCityLayout`
   (5 bản vẽ catalog + 6–30 nhà dân), ở **ba nhịp tuổi** và hỏi **từng nhịp một**.
   ⚠️ Đo ra thì cái phễu ấy hôm nay rộng đúng **0 họ** ở cả 15 kỷ — bài cũ **không** xanh oan, nó
   chỉ đang đúng nhờ một trùng hợp. Vá vì trùng hợp thì gãy trong im lặng, không vì nó đang hỏng.

**Nghiệm thu**: `npm test` **766 bài** (số THẬT ở dòng cuối) · `npm run lint` sạch · `npm run build`
xanh · **25/25 phép phá làm ĐỎ đúng chỗ đã nêu TRƯỚC** (21 của vòng đầu + 4 cho bài test vừa vá) ·
bản quét 15 kỷ × 6 chặng: **0/15 cặp chặng và 0/105 cặp kỷ** dưới ngưỡng mắt.

⚠️ **MỘT ĐÍNH CHÍNH SO VỚI BẢN GHI ĐẦU CỦA MỤC NÀY**: nó từng ghi *"lệnh vẽ cao nhất 13/13 (đúng
trần Đàm đặt)"*. Câu ấy **sai**, và sai vì nó suy từ ba kỷ đã đo lúc đó. Đo đủ 15 kỷ thì **kỷ 10 =
14 lệnh vẽ** — nhưng nó ra 14 **ở CẢ lượt đo trên `HEAD`**, tức đã vượt trần **từ trước Phase 10**.
Đây là một **con số nền chưa từng được đo**, không phải hồi quy của Bước 2. Đã ghi `TECH_DEBT #38`
và **đã dừng hỏi Đàm** theo đúng ca §5(4) *"phát hiện điều mâu thuẫn `PERFORMANCE.md`"*.

**Sáu thứ bắt được trong lúc làm (chi tiết ở `CLAUDE.md`)**

- ⚠️ **Kỷ 14 mất cửa trong im lặng.** Khai `doorWidth: 0.46` vượt trần 0,42 ⇒ validator từ chối
  ĐÚNG, `emitGroundFloor` trả `false` ĐÚNG, và cả kỷ ấy không có cửa mà **không gì đỏ lên**. Hai
  lời "đúng" cộng lại thành một lỗi. Nay có assert *"kỷ nào khai hợp lệ mà KHÔNG dựng ra khối nào"*.
- ⚠️ **Một mốc lịch sử đặt theo thứ mình NHỚ.** Bài test cấm `shutters` trước kỷ 7 (lá sách = thế
  kỷ 17) — nhưng hình đang dựng là **hai cánh ván trơn**, cổ ngang cái cửa sổ. Nó lập tức cấm nhà
  Fachwerk Đức thời trung cổ. Sửa thành mốc kỷ 3 + một **điều kiện cấu trúc** hỏi chính bảng
  (*kỷ khai `windows: 'none'` thì không được có cửa chớp*).
- ⚠️ **Hai assert của chính phiên này không thể đỏ.** Vòng lặp "kỷ liền nhau" là tập CON của 105
  cặp với cùng sàn ⇒ chép lại điều vừa chứng minh; thay bằng **trung vị** + **mỗi trục còn sống**.
  Và đối chứng "hạt bụi" cộng-gộp ba lệch 0,001 nên nới **một** ngưỡng vẫn xanh ⇒ hỏi từng trục.
- ⚠️ **Kỷ 4 và kỷ 6 chỉ khác 1/8 trục.** Sửa BẢNG (kỷ 4 lùi cửa 0,50→0,62, mở rộng 0,38→0,41) chứ
  không hạ sàn, và sửa **kỷ MỚI** chứ không đụng kỷ Đàm đã duyệt ở Bước 1.
- ⚠️ **Một cái trần suy từ mẫu 3 kỷ được đọc thành luật của 15 kỷ** — xem đính chính ở trên.
- ⚠️ **Một bài test đang đúng NHỜ MỘT TRÙNG HỢP.** "Chưa xanh oan" không bằng "không thể xanh oan":
  quần thể giả định tình cờ phủ đúng bằng quần thể thật, nên bài cũ vẫn đúng — cho tới ngày
  `deriveDwellings` hoặc `BLUEPRINT_CATALOG` đổi, và ngày ấy nó gãy mà không ai biết.

**Chưa làm / cố ý không làm**: chưa gộp `main` (luôn phải hỏi) · `TECH_DEBT #37` (cửa sổ không xoay
theo `ry`) **cố ý để nguyên** — Đàm đã chốt *"vá thứ mắt không thấy là mua rủi ro không đổi lấy gì"*.

---

### 2026-08-18 — Phase 10 Bước 1: thành phố có CỬA RA VÀO, và 3 kỷ có tầng trệt riêng

**Yêu cầu của Đàm**: thêm một lớp chi tiết tầng trệt khác nhau theo kỷ — **cửa ra vào (bắt buộc,
mọi công trình)** · bậc thềm nếu vật liệu và thời kỳ cho phép · **MỘT đặc trưng tầng trệt theo kỷ**
(mái hiên · cột · ban công · cửa chớp · ô văng · hàng hiên · biển hiệu). Kèm một luật cứng:
*"KHÔNG rắc đều mọi thứ cho mọi kỷ. Mỗi kỷ chọn ĐÚNG một hai đặc trưng, và phải trả lời được:
'công trình có thật nào ở nước ấy trông như vậy?'"*, và một **cổng dừng**: *"Bước 1: làm cửa ra vào
cho ĐÚNG 3 kỷ (6 Việt Nam · 9 Pháp · 13 Nhật), chụp cận cảnh, ĐO lại, rồi DỪNG và hỏi Đàm."*

**Hai khuyết tật THẬT mà nó vá** (không phải "thêm cho đẹp"):
1. Cửa cũ là **một khối `dark` bề ngang viết cứng `0,14`**, áp cho mọi khối — mà khối trong thành
   phố chênh nhau vài lần. Cùng đúng bệnh `eaves` ở Phase 7C (mái hiên thò ra 71% mỗi bên trên nhà
   dân, thành cây nấm). Trên nhà dân hẹp, cái cửa 0,14 chiếm gần nửa bề ngang.
2. **15 kỷ chung đúng một cái cửa.** Cả dự án đã tách bản sắc theo kỷ ở mái (`vernacularRoof`),
   thảm thực vật (`floraStyle`), mặt đường (`streetStyle`) — riêng chỗ mắt nhìn vào đầu tiên khi
   đứng trước một công trình thì vẫn là một lỗ đen giống hệt nhau ở cả 15 kỷ.

**Đã làm gì**
- **BẢNG** `groundFloor` ở `eraStyle.js` — **đủ 15 kỷ, bắt buộc**. Ba kỷ đã nghiên cứu:
  | Kỷ | Nước | Cửa | Đặc trưng KỲ QUAN | Đặc trưng NHÀ DÂN | Lấy mẫu từ |
  |---|---|---|---|---|---|
  | 6 | Việt Nam | `panel` (bức bàn), ngưỡng cao, 2 bậc | `porch` — hàng hiên cột gỗ | `awning` — mái đua thấp | đình làng Bắc Bộ · nhà ống phố cổ |
  | 9 | Pháp | `double` (porte cochère), khuôn đá | `balcony` — ban công sắt uốn | `shutters` — cửa chớp | chung cư Haussmann Paris |
  | 13 | Nhật | `sliding` (cửa lùa), genkan lùi sâu | `sign` — biển hiệu dọc | `awning` — mành che | phố thương mại Nhật |
  12 kỷ còn lại khai thẳng `door: 'legacy'` — **trạng thái tường minh ĐẾM ĐƯỢC**, có test khoá đúng
  12, chứ không im lặng rơi về mặc định.
- **HÌNH** ở `src/engine/city3d/groundFloor.js` (mới, thuần): bậc thềm · khuôn cửa hõm/nhô · cánh
  cửa 4 kiểu · 5 đặc trưng. `buildingSpec.js` **chỉ ĐỌC** — đúng khuôn ba lớp đã dùng ba lần.
- **KỲ QUAN ≠ NHÀ DÂN**: hai trường riêng `feature` / `vernacularFeature` (bài học Phase 7C —
  25 căn nhà nhỏ từng đội mái vòm Duomo). Nhà dân còn bị **LOD cắn thật**: cửa co còn 78%, tối đa
  1 bậc thay vì 3, không hõm sâu, không hốc cạnh.
- **Mọi kích thước là TỈ LỆ bề ngang khối, có TRẦN kẹp** — và **trần luôn thắng sàn**: khối quá hẹp
  thì **không có cửa**, chứ không phải có một cái cửa tí hon dính hai mép tường.
- `isValidGroundFloor` **TỪ CHỐI THẲNG** bảng sai, không tự chữa (bẫy `MIN_STONE` Phase 9D: tự chữa
  là cách một bảng 15 dòng lặng lẽ thoái hoá về 1 dòng).

**Đo được**
| | Trước | Sau |
|---|---:|---:|
| Lệnh vẽ thành phố (kỷ 6 · 9 · 13) | 11 · 10 · 9 | **11 · 10 · 9** — không đổi |
| Lệnh vẽ cả cảnh | 13 · 12 · 11 | **13 · 12 · 11** — trần Đàm đặt là 13 |
| Tam giác thành phố | 35.110 · 38.094 · 41.102 | 42.554 · 45.842 · 46.422 (**+13…21%**) |
| Tam giác công trình nặng nhất | — | 4.364 / trần 8.000 |
| Khác biệt ảnh cận cảnh (điểm ảnh đổi) | — | **2,75% · 0,89% · 0,88%**, lệch trung bình 45–50/255 |
| Bản quét kỷ 1–5 | — | **0,00% đổi** — 12 kỷ `legacy` không bị chạm một điểm ảnh |

**Ba bài học đã trả giá** (chi tiết ở `CLAUDE.md`):
1. **Một bài test canh mỹ thuật đã dạy lại tôi một sự thật kiến trúc.** Bài *"kỳ quan của MỌI kỷ vẫn
   đối xứng tuyệt đối"* ĐỎ ở kỷ 13, vì cửa lùa Nhật vốn so le hai tấm. Câu trả lời đúng **không**
   phải nới bài test, mà là **4 tấm trên 2 rãnh** — đúng cách cổng đền lớn Nhật Bản làm thật.
2. **Phép đo đúng nhưng đo SAI CẤP ĐỘ, và lần này nó GÂY HOẢNG.** Bài test của chính tôi báo
   *"kỷ 9 kỳ quan kéo thêm họ vật liệu `wood`"* — nghe như đã vi phạm ràng buộc cứng nhất. Sai: cả
   thành phố gộp lưới theo họ vật liệu trên **TOÀN KỶ**, mà kỷ 9 đã có cửa hàng + xưởng dùng `wood`
   từ trước. Đo lại đúng cấp: **không thêm một lệnh vẽ nào**. Hai lần trước (`TECH_DEBT #22`, ngân
   sách tam giác) sai theo hướng **trấn an**; lần này sai theo hướng **gây hoảng** — và hoảng thì
   nguy hiểm kiểu khác, nó suýt làm tôi gỡ bỏ một bản vá đúng.
3. **Ba lời khẳng định yếu chỉ lộ ra khi thử ngược**, cả ba đều là test tôi vừa viết trong chính
   phiên ấy: một bài dùng bảng thử `frame: 'wood'` nên khung cửa đã thoả điều kiện "có khối gỗ"
   (cùng họ `/envMap,/` xanh oan Phase 7A) · một bài có **hai** thứ giữ nó xanh mà chú thích chỉ kể
   một (bài học Phase 4D) · một bài ký tên gồm cả `p.x` mà chính `p.x` đã theo hạt giống nên viết
   cứng số ô cửa vẫn ra 40 chữ ký khác nhau.

**Nghiệm thu**: **764 bài test** (744 + 20 mới), lint sạch, build xanh, **18/18 phép phá làm ĐỎ đúng
bài mong đợi**. Tài liệu đã đồng bộ: `ARCHITECTURE_DECISIONS.md` (**ADR-026**) · `PROJECT_STRUCTURE.md`
· `PERFORMANCE.md` (mục "Sau Phase 10") · `TECH_DEBT.md` (**#36** + **#37** mới) · `CLAUDE.md`.

⏳ **DỪNG Ở ĐÂY, ĐÚNG THEO LỆNH ĐÀM.** Chưa trải ra 12 kỷ còn lại, **chưa gộp `main`** — chờ Đàm xem
3 ảnh cận cảnh và gật đầu là đúng hướng mỹ thuật. Lý do chính Đàm nêu: *"nếu hướng mỹ thuật sai thì
sai ở kỷ thứ 3 rẻ hơn nhiều so với sai ở kỷ thứ 15."*

### 2026-08-17 (vòng 4) — Bộ đo "đã nghiệm thu đủ" vẫn làm Đàm mất 5 vòng, vì nó chưa từng chạy ở môi trường của anh

**Yêu cầu của Đàm**: *"làm cho nó CHẠY ĐƯỢC TRÊN MÁY ĐÀM"*, kèm một nguyên tắc gốc đặt lên trên mọi
quyết định khác: **khi hỏng, phải in ra MỘT DÒNG nói CẦN GÕ GÌ, chứ không in nguyên nhân kỹ thuật
rồi để người dùng tự suy.** Phạm vi: chỉ `scripts/` + tài liệu + test. **CẤM đụng `src/`** — bộ số
vừa đo gắn với đúng mã hiện tại, sửa mã dựng cảnh là làm bộ số hết giá trị. Đã tuân thủ: `git diff`
không chạm một dòng nào trong `src/`.

**Bốn thứ đã cắn Đàm, không cái nào liên quan tới hiệu năng:** `git checkout` báo *"did not match
any file(s)"* (chưa `git fetch`) → checkout bị chặn vì `package.json` bẩn → `three` chưa cài, đổ ra
20 dòng ngăn xếp Vite → đường dẫn đầy dấu tiếng Việt chưa ai từng thử. Tất cả đều là **khoảng cách
giữa môi trường viết ra công cụ và môi trường chạy nó**: hộp cát AI có đường dẫn ASCII không dấu
cách, `node_modules` luôn đúng, nhánh luôn có sẵn.

**(A) Preflight thật — 8 mục, xếp RẺ TRƯỚC ĐẮT SAU, dừng ngay ở mục đầu tiên hỏng.**
`node` → đúng thư mục dự án → `node_modules/` → `node_modules/three` → phiên bản three khớp không
(cảnh báo) → Chromium → ghi được `.city-preview/` → cây git sạch không (cảnh báo). Mỗi mục in ✅/❌,
mỗi ❌ kèm **ĐÚNG MỘT lệnh** copy-paste được.
- ⚠️ **Mục "đúng thư mục dự án" PHẢI đứng TRƯỚC mục `node_modules`** — hai triệu chứng giống hệt
  nhau (đều "không có `node_modules`") nhưng cách sửa **ngược nhau**: bảo một người đang đứng nhầm
  chỗ chạy `npm install` là làm họ mất vài phút cài vào một thư mục chẳng liên quan rồi hỏng y như cũ.
- ⚠️ **Chromium hỏi `city-preview.mjs`, KHÔNG chép danh sách đường dẫn sang shell** (cờ mới
  `--kiem-chromium`, kiểm rồi thoát, không gói bundle). Chép sang chỗ thứ hai là đúng cái bẫy "một
  luật hai công thức" đã làm `sweep-score.mjs` bịa ra nguyên một bộ số ở Phase 4G.
- ⚠️ **Mục phiên bản three tồn tại vì một ca có thật**: hôm 2026-08-17 `npm install` báo *"up to
  date"* trong khi `three` HOÀN TOÀN chưa có — vì nó chạy lúc `package.json` còn là bản cũ. **"npm
  nói ổn" không có nghĩa là đúng thư viện đang nằm đó**; chỉ có đặt hai con số cạnh nhau mới biết.

**(B) Chỗ cắt log bị NGƯỢC — lỗi thật, đã xác định được dòng.** Bản cũ `tail -n 20` giữ 20 dòng
CUỐI. Với lỗi build thì **nguyên nhân luôn ở ĐẦU và ngăn xếp ở CUỐI**, nên nó đã vứt đúng dòng
`Rolldown failed to resolve import "three"` và giữ lại toàn `at viteLog (...)` — Đàm phải tự chạy
một lệnh khác mới nhìn thấy. Nay in **15 dòng đầu + 8 dòng cuối** có nhãn rõ ràng, lọc bỏ dòng ngăn
xếp thuần khỏi phần trích (**không** lọc khỏi file log), và luôn ghi đường dẫn đầy đủ tới
`.city-preview/bench-loi-toanvan.log`. Đã dựng lại đúng ca của Đàm để kiểm: dòng `Rolldown…` nay
hiện ra ở **dòng thứ 4**.

**(C) Đường dẫn có dấu tiếng Việt + dấu cách** — `scripts/benchMacbookSource.test.js` (8 bài):
preflight chạy trọn vẹn từ thư mục tên `Bản sao Test - CÓ DẤU` ở **cả NFC lẫn NFD**, cộng một bài
**đọc mã nguồn** bắt mọi biến đường dẫn để trần. ⚠️ Bài đó đi **từng ký tự** chứ không dùng regex,
vì `"$(grep -c . $tam)"` trông như đã bọc nháy nhưng `$tam` bên trong `$( )` **không** được lớp
nháy ngoài che — regex sẽ báo an toàn ở đúng chỗ nguy hiểm nhất. Danh sách biến là **cho-phép**
(fail-closed): thêm biến mới mà quên bọc nháy thì test ĐỎ ngay.
⚠️ **GIỚI HẠN, ghi rõ tại chỗ để phiên sau đừng đọc thành "đã xong"**: Linux lưu tên file nguyên
byte, macOS lưu NFD — nên bài test chứng minh được vế **dấu cách + ký tự nhiều byte**, KHÔNG chứng
minh được hành vi chuẩn-hoá thật của macOS (đúng thứ đã giết LaunchAgent ở "BẪY 2": thoát mã 78,
không có stderr). Phần ấy chỉ máy Đàm kiểm được → đã thành một dòng trong runbook.

**(D) Runbook** trong `PERFORMANCE.md`: khối copy-paste 7 bước (kể cả `git fetch` và `git stash` —
những bước AI hay quên vì cho là hiển nhiên) + bảng **"gặp lỗi này thì gõ cái này"** cho đúng 4 ca
đã xảy ra, không lý thuyết.

**(E) Thử ngược TỪNG mục kiểm — và nó bắt được HAI lỗi mà đọc mã không thấy:**
- ⚠️ **Lỗi trong bài test tôi vừa viết**: gỡ hẳn mục kiểm `node_modules/three` khỏi script mà test
  **vẫn xanh**. Nguyên nhân: bài đó dựng dự án **không có `node_modules` nào cả**, nên mục kiểm số
  1 bắt trước và mục số 2 **chưa từng được chạy**. Đúng bài học Phase 4D — *"một bài test xanh
  không cho biết có BAO NHIÊU thứ đang giữ nó xanh"*. Đã thêm bài dựng đúng ca "đủ mọi gói, khuyết
  đúng `three`" (nối mềm từng gói một), và mutation ấy nay ĐỎ.
- ⚠️ **Lỗi trong chính mục kiểm git**: nó tự tố cáo **sản phẩm của chính nó** — script ghi báo cáo
  vào `.city-preview/` trước khi preflight chạy, nên `git status` thấy đó là "thay đổi chưa lưu".
  Trong kho thật bị `.gitignore` che đi, tức lời cảnh báo xưa nay đúng **nhờ một file chẳng liên
  quan**. Chỉ lộ ra vì phép thử ngược chạy trong một kho git tạm không có `.gitignore`. Đã lọc.
- ⚠️ **Và PHÉP PHÁ nói dối hai lần, cả hai đều không phải lỗi của mục kiểm.** (1) Bản đầu dùng
  `git stash` trên **chính kho đang sửa** → stash luôn cái script đang thử, nên mục cuối chạy bằng
  bản CŨ và treo 5 phút. Vá: mọi phép phá làm trong kho git **tạm**. (2) Phép phá viết bằng
  `perl -0pi -e` chứa `$PWD`/`$thu_file` trong chuỗi thay thế — **perl nội suy chúng thành rỗng**,
  nên thứ chèn vào không phải "biến để trần" mà là một dòng vô nghĩa; bài test đúng thì không đỏ và
  tôi suýt kết luận phép kiểm nháy kép bị mù. Làm lại bằng thay-thế-nguyên-văn (python) thì nó ĐỎ
  đúng chỗ. ⇒ **Khi phá mà không nổ, nghi CHÍNH PHÉP PHÁ trước** (Phase 8A).

| Mục kiểm | Cách phá | Nhận được | Khôi phục |
|---|---|---|---|
| node | `PATH` không có node | ❌ + link nodejs.org, không ✅ nào trước | ✓ |
| đúng thư mục | chạy từ thư mục trống | ❌ + lệnh `cd "…"`, **không** khuyên `npm install` | ✓ |
| `node_modules/` | bỏ thư mục | ❌ "Chưa cài thư viện" + `npm install --legacy-peer-deps` | ✓ |
| `node_modules/three` | nối mềm mọi gói TRỪ three | ❌ "Thiếu thư viện 3D", sau khi mục 1 đã ✅ | ✓ |
| phiên bản three | `package.json` → `0.99.9` | ⚠️ lệch, **thoát mã 0** (cảnh báo, không chặn) | ✓ |
| Chromium | thu danh sách còn mỗi env + trỏ sai | ❌ + liệt kê đường đã thử + cách đặt `CHROME_PATH` | ✓ |
| ghi `.city-preview/` | biến nó thành FILE / file thử thành THƯ MỤC | ❌ hai nhánh khác nhau | ✓ |
| cây git | kho tạm: sạch ↔ có file rác | ✅ ↔ ⚠️ (**hai chiều**) | ✓ |
| nháy kép | chèn `rm -f $thu_file` để trần | bài "bọc nháy kép" ĐỎ | ✓ |

**Nghiệm thu**: `npm test` **744 bài** (736 + 8 mới) · lint sạch · build xanh. Chạy `--thu` thật
trong hộp cát: preflight ✅ hết → gói bundle → chạy cảnh → **❌ ở mục card đồ hoạ (SwiftShader)** —
đó là hành vi ĐÚNG, và nó chứng minh chuỗi preflight chạy tới tận cuối.

⏳ **CHƯA GỘP `main` — chờ Đàm quyết.** Vòng này **không đụng `src/`**, nên gộp sẽ deploy một bản
production **giống hệt bản đang chạy về mọi mặt người dùng thấy được** (chỉ khác `scripts/` + tài
liệu, những thứ không vào bundle).

---

### 2026-08-17 (vòng 3) — Bộ số trên MacBook M3 thật: còn dư 3,2 lần, và trục đúng là GIỜ chứ không phải KỶ

**Yêu cầu của Đàm**: *"ghi lại kết quả, KHÔNG phân tích lại"*. Anh đã tự chạy bộ đo trên máy thật,
cố vấn đã phân tích xong; việc của vòng này CHỈ là ghi vào tài liệu và hỏi ý kiến về việc gộp
nhánh. **KHÔNG sửa mã dựng cảnh, KHÔNG tối ưu, KHÔNG mở phase mỹ thuật mới.** Đã tuân thủ đúng —
vòng này **không sửa một dòng nào** trong `src/` hay `scripts/`.

**Bộ số đã chốt** (nguồn: Đàm chạy `bash scripts/bench-macbook.sh`, 2026-08-17, commit `48d3c83`):

| | |
|---|---|
| Máy | **Apple M3** — ANGLE Metal Renderer |
| Cửa sổ | 1100×700 · DPR 2 ⇒ **2200×1400 = 3,08 triệu điểm ảnh** |
| Phạm vi | 24/24 cảnh (kỷ 3/7/11/14 × giờ 12/15/22 × rộng/gần) + 1 cảnh đối chiếu 1600×1000 — **tất cả ĐẠT** |
| Frame time P50 | **3,90 – 5,20 ms** · P95 cao nhất 6,50 ms |
| **Kết luận** | **A — CÒN NHIỀU DƯ ĐỊA**: 16,67 ÷ 5,20 = **3,2 lần** (192–256 hình/giây) |

⚠️ **File kết quả gốc `.city-preview/bench-macbook.txt` nằm trên máy Đàm và KHÔNG có trong repo**
(`.city-preview/` bị `.gitignore` bỏ qua). Vì vậy **`PERFORMANCE.md` LÀ bản ghi chính thức**, không
phải bản tóm tắt của một file nào khác trong repo — ai cần con số phải đọc ở đó.

**Mô hình chi phí** (suy từ cảnh đối chiếu, cùng kỷ 7 · 12h, chỉ đổi cỡ cửa sổ):

> `thời gian ≈ 0,87 ms cố định + 1,14 ms mỗi TRIỆU ĐIỂM ẢNH` ⇒ **80% theo điểm ảnh, 20% cố định**

⚠️ **"Triệu điểm ảnh" là điểm ảnh THẬT, tức đã nhân DPR 2** (3,08 Mpx cho cửa sổ 1100×700, không
phải 0,77). Thiếu chú thích này thì hệ số 1,14 vô dụng — ai đó sẽ nhân với số điểm ảnh CSS và ra
kết quả **nhỏ hơn 4 lần**. Đã ghi rõ ở cả `PERFORMANCE.md` lẫn `CLAUDE.md`.

**PHÁT HIỆN QUAN TRỌNG NHẤT — và nó lật ngược câu hỏi của cả ba vòng:**

> **Thứ ăn thời gian là GIỜ TRONG NGÀY (đèn bật), KHÔNG phải KỶ. Không kỷ nào là điểm nóng.**

Ba bằng chứng cho "trần KHÔNG nằm ở hình học": (1) tam giác **thành phố** chênh **43%** giữa kỷ 3
(26.168) và kỷ 11 (37.494) → thời gian chỉ chênh **2,4%**; (2) tăng điểm ảnh **×2,08** → thời gian
**×1,86** (gần tuyến tính); (3) 22h (đèn bật, shader 4→5) chậm hơn ban ngày **+0,8 ms (+19%)** ở
**CẢ 4 kỷ**. ⚠️ **Rặng núi chân trời chiếm 54–63% hình học mỗi khung nhưng KHÔNG tốn thời gian đo
được ⇒ ĐỪNG ĐỤNG VÀO NÓ** — cắt nó là trả một cái giá thẩm mỹ rất lớn để mua về khoản tiết kiệm
bằng 0.

**Chi phí dựng lại bản đồ bóng: CHƯA ĐO ĐƯỢC.** Ở **mọi cảnh**, hiệu số giữa khung có dựng lại bóng
và khung ổn định nằm **dưới mức nhiễu** của chính phép đo ⇒ **không ghi một con số nào**. Chỉ được
nói *"nhỏ hơn mức phép đo này phân giải được"*. Ai cần con số phải thiết kế một phép đo khác.

**Ngân sách an toàn**: giữ mức làm việc **8 ms** (chừa gấp đôi phòng hờ) ⇒ **còn ~3 ms mỗi khung**.
Hình học *gần như không giới hạn* (tăng 3–5× tam giác vẫn chưa đo được) · ánh sáng/shader còn
**~1,6×** hoặc thêm **3–4 nguồn sáng** (tính từ ca XẤU NHẤT là cảnh 22h) · điểm ảnh là 80% chi phí
nhưng **KHÔNG hạ DPR**.

**Đã đổi những file nào (tài liệu, không phải mã):**

| File | Đổi gì |
|---|---|
| **`PERFORMANCE.md`** | **MỚI** — bản ghi chính thức: xuất xứ bộ số · bảng 4×6 · mô hình chi phí · ba bằng chứng · ngân sách · TOP 3 nên/không nên · **ba giới hạn** · khi nào phải đo lại |
| `README.md` | Thêm con trỏ: *"Sắp thêm gì đó vào Thành Phố 3D? Đọc `PERFORMANCE.md` TRƯỚC"* |
| `PROJECT_STRUCTURE.md` | Thêm `PERFORMANCE.md` vào cây tài liệu + `bench-macbook.sh` vào mục scripts |
| `CLAUDE.md` | Mục mới **"NGÂN SÁCH HIỆU NĂNG THÀNH PHỐ 3D"** (hình học rẻ · điểm ảnh và ánh sáng đắt · ĐỪNG hạ DPR · con số 3 ms) + bài học ba-vòng-chọn-sai-trục |
| `TECH_DEBT.md` | **#23** và **#26** đóng NỬA DESKTOP (chi tiết dưới) · **mở #34 + #35** |
| `BAN_GIAO.md` | File này |

**`TECH_DEBT` — đóng nửa, mở hai:**
- **#23** (cổng hiệu năng chưa đo lại sau khi chuyển PBR): ba lo ngại được trả lời riêng từng cái.
  `MeshStandardMaterial` đắt hơn mỗi điểm ảnh — **đúng**, và đó chính là trục đắt, nhưng ở cỡ cửa
  sổ này chỉ tiêu 5,20 ms lúc xấu nhất. Nướng PMREM — không hiện ra ở khung ổn định, **đúng như mục
  ấy dự đoán**. 5–7 lệnh vẽ mỗi công trình — đo được 12–13 lệnh cả cảnh, không phải nút thắt.
  ⇒ **Trên Mac: KHÔNG cần hạ `metalness`, KHÔNG cần bỏ PMREM.**
- **#26** (nhà dân chưa có LOD): mục này tự đặt luật *"Không cắt trước khi có số"* — nay có số, và
  **câu trả lời là ĐỪNG CẮT**. Thứ nó định cắt nằm trên trục rẻ nhất trong cả hệ thống. ⚠️ Riêng lo
  ngại *"bản đồ bóng vẽ cảnh lần thứ hai nên chi phí gấp đôi"* thì **chưa bác được và cũng chưa xác
  nhận được** — nằm dưới nhiễu, nên đó là câu hỏi còn mở chứ không phải câu đã trả lời.
- **Cả hai thu hẹp phạm vi còn ĐÚNG iPhone.** Bộ số M3 **không** suy ra được cho iPhone.
- **#34 (MỚI, Medium)** — `--thu` không kiểm điều kiện tiên quyết. Máy Đàm chưa cài đủ phụ thuộc;
  bộ đo báo đúng là "HỎNG" nhưng **không nói được vì sao**, đổ ra ~20 dòng lỗi Vite. **Đã cắn Đàm
  thật hôm nay, mất 4 vòng qua lại**, trong khi bản sửa chỉ là ~10 dòng shell in một câu tiếng
  Việt: *"Thiếu thư viện 3D. Chạy: `npm install --legacy-peer-deps`"*. Lỗi này nhắm đúng vào người
  dùng duy nhất của tính năng — `--thu` sinh ra riêng cho Đàm, và chỉ người không đọc được lỗi Vite
  mới bị nó cắn.
- **#35 (MỚI, Medium)** — bộ đo **chưa từng chạy thử ở đường dẫn có dấu tiếng Việt + dấu cách**.
  Thư mục của Đàm là `Bản sao Pomodoro Game - USING`; bộ đo chạy trong hộp cát ở `/home/user/
  pomodoro-dc` (thuần ASCII, không dấu cách). Hôm nay nó chạy được trên máy anh — nhưng đó là
  **may**, không phải **đã kiểm**. ⚠️ `CLAUDE.md` đã có sẵn **"BẪY 2"** về đúng chuyện này
  (launchd thoát mã 78 **không có stderr** ở chính đường dẫn đó, *"cùng họ với cái bẫy NFC/NFD làm
  test nạp hai bản React"*) — tức dự án đã trả giá **hai lần** cho cái bẫy này, bài học đã viết ra,
  **và công cụ mới vẫn không được thử ở điều kiện đó**. Đúng bài học *"một bài học được ghi ra KHÔNG
  chặn được gì; chỉ một bài TEST mới chặn được"*.

**Nghiệm thu**: `npm test` **736 bài** (số THẬT ở dòng cuối) · `npm run lint` sạch · `npm run build`
xanh. Không đổi mã nên số bài test giữ nguyên so với vòng 2.

⏳ **CHƯA GỘP `main` — chờ Đàm quyết.** Nhánh `claude/xay-san-pham-huong-nay-nasr3n` **có đụng
`src/`** (`sceneGraph.js` báo ba con số thay vì một, `CityPerfHud.jsx` hiện tách thành phố/nền) nên
**gộp = deploy lên production**. Hình ảnh thành phố **không đổi một điểm ảnh nào** — chỉ những con
số trong bảng HUD đổi. Đây là câu hỏi cho Đàm, không phải việc AI tự quyết (vòng 1 đã tự gộp hai
lần không hỏi; luật *"lệnh làm đã gồm cho phép deploy"* của `CLAUDE.md` bị **đình chỉ** cho riêng
task này theo chỉ thị của anh ở vòng 2).

---

### 2026-08-17 (vòng 2) — Vá xong phép đo vẫn kết luận SAI: con số đúng trộn hai đại lượng

**Yêu cầu của Đàm**: *"sửa phép đo trước khi Đàm chạy, rồi mới chạy"*. Bốn chỗ trong chính bộ đo.
Vẫn nguyên lệnh cấm: **không tối ưu, không giảm chất lượng hình ảnh, không mở phase mỹ thuật.**
⚠️ Và một luật bị đình chỉ riêng cho task này: *"lệnh làm đã gồm cho phép deploy"* của `CLAUDE.md`
**KHÔNG áp dụng** — đây là task ĐO, một bộ đo chưa từng chạy trên máy đích thì chưa có gì để deploy.
Commit lên nhánh `claude/xay-san-pham-huong-nay-nasr3n` rồi DỪNG, để Đàm quyết việc gộp `main`.

**(A) Tách "thành phố" khỏi "nền" — việc quan trọng nhất.** Vòng 1 chữa được *"HUD nói dối"* rồi
lấy chính con số ĐÚNG ấy trả lời sai câu hỏi khác. `countSceneTriangles` duyệt CẢ CẢNH, nên 44.126
tam giác vòm trời + rặng núi — một **HẰNG SỐ** có mặt ở cả 15 kỷ — nằm trong số của mọi kỷ:

| Câu hỏi | Đọc số nào | Kết luận |
|---|---|---|
| GPU vẽ bao nhiêu mỗi khung? | **tổng** | đúng — giữ nguyên |
| Kỷ nào nặng? (4 kỷ ma trận) | tổng → **1,16 lần** ❌ · thành phố → **1,43 lần** ✅ | kỷ 11 (37.494) so kỷ 3 (26.168) |
| Kỷ nào nặng? (cả 15 kỷ) | tổng → **1,40 lần** ❌ · thành phố → **2,46 lần** ✅ | kỷ 13 (41.102) so kỷ 2 (16.738) |

Một hằng số cộng vào cả tử lẫn mẫu pha loãng 43% khác biệt xuống 16% — **đúng hình dạng
`TECH_DEBT #22`**. Nay `measureSceneGeometry()` trả **ba** con số (thành phố · nền · tổng) cho cả
tam giác lẫn lệnh vẽ; hai con số phẳng `stats.triangles`/`stats.drawCalls` suy ra từ ĐÚNG phép đo
đó nên không có đường nào để chúng trôi khỏi nhau. Phân loại đọc **NHÃN GẮN LÚC TẠO KHỐI**
(`userData.sceneLayer`, hàm `markBackdrop`) — KHÔNG đoán bằng ngưỡng/kích thước/tên màu, đúng bài
học ba-phase của `TECH_DEBT #22`. HUD hiện tách (`↳ thành phố` / `↳ nền (trời + núi)`) vì Đàm dùng
nó để biết *"xây thêm nhà có nặng không"* — mà nhà không nằm ở phần nền.

⚠️ **QUAN SÁT, KHÔNG PHẢI ĐỀ XUẤT CẮT**: nền chiếm **54–63%** tam giác mỗi khung trên 4 kỷ của ma
trận, **52–72%** nếu xét cả 15 kỷ (nhẹ nhất kỷ 13: 51,8% · nặng nhất kỷ 2: 72,5%). Rặng núi
**giữ nguyên**, không đụng vào. Về lệnh vẽ thì nền chỉ tốn **2/12–13** — rẻ ở trục đó.

**(B) Quả mìn "cắt vật ngoài khung" — đo ra là nó CHƯA HỀ CÓ NGÒI.** Dự đoán: `--zoom 0.4` sẽ làm
`renderer.info` (đếm SAU khi cắt) lệch khỏi traversal (đếm MỌI khối), và Đàm sẽ đọc thành "bản vá
hỏng". Đo thật ở zoom 1 · 0,6 · 0,4 · 0,25 và ở 6 kỷ: **không một khối nào bị cắt, bao giờ**. Lý do
là một sự thật về kiến trúc cảnh chưa ai từng phát biểu — cả thành phố chỉ có **7 khối**:

| khối | bán kính hộp bao | vì sao không cắt được |
|---|---:|---|
| `sky` (vòm trời) | 43,2 | camera đứng cách tâm 4,3–17,2 ⇒ **ở BÊN TRONG** |
| `horizon` (rặng núi) | 51,1 | **ở BÊN TRONG** |
| `ground` · `road` · công trình đã GỘP | 13,5 · 8,5 · 7,5 | tâm ở gốc toạ độ, mà camera **luôn ngắm vào gốc** |
| 2 × cư dân (InstancedMesh) | 0,1 | ở giữa thành phố |

⇒ Vẫn đổi nhãn thành **"trong cảnh"** vs **"đã vẽ (sau khi cắt)"** (đúng yêu cầu), vì ngày nào tách
công trình thành nhiều khối riêng thì hai cột sẽ lệch — và lúc ấy lệch là ĐÚNG. Bài test khoá
**QUAN HỆ** `đã vẽ ≤ trong cảnh` + bằng nhau ở camera mặc định, **KHÔNG** khoá "luôn bằng nhau"
(khoá thế mới là gài mìn thật: nó sẽ đỏ đúng lúc mã đang chạy đúng).

**(C) Gỡ hai chỗ ngoại suy tự mâu thuẫn của vòng 1.** Đã từ chối xuất FPS vì SwiftShader rồi lại
viết *"dựng lại bóng = 14% một khung"* và *"đã đo được GIÁ THẬT 29,4 ms"*. Đã sửa: dán nhãn
**"đo trên SwiftShader, KHÔNG suy ra được cho MacBook"**, bỏ chữ *"giá thật"*, ghi rõ **400×250**
cạnh cả ba số, bỏ khẳng định *"lấy mẫu bóng ≈ 0%"* (−4,0 ms nằm trong nhiễu ±15 ms ⇒ chỉ được nói
*"nhỏ hơn mức phép đo này phân giải được"*), và **bỏ hẳn** phần ngoại suy ~144 ms chi phí cố định.

⚠️ Và bản thân công cụ cũng được vá cho khớp: dòng `(b)` nay in kèm **nhiễu của loạt ổn định** rồi
tự nói *"hiệu số NẰM TRONG NHIỄU — đừng trích con số trên"* khi |hiệu| < nhiễu. Bản cũ in thẳng
`riêng bóng=-55.00ms (+-2.4%)` — vừa vô nghĩa về dấu, vừa mời người đọc kết luận ngược. Dòng
"lượt bóng thêm N lệnh vẽ" nay tự khẳng định **cổng bóng ĐANG MỞ**, vì đó mới là bằng chứng độc
lập với thời gian (bài học "hai cổng nối tiếp" của vòng 1).

**(D) `bench-macbook.sh` an toàn cho người không biết code.**
- `--thu`: chạy ĐÚNG 1 cảnh (~20 giây), in **ĐẠT/HỎNG** + tên card. Đàm chạy cái này TRƯỚC.
- Mỗi cảnh kiểm mã thoát của `node` **và** kiểm có lấy được dòng đo không; hỏng thì ghi
  `!!! CẢNH NÀY HỎNG` + 20 dòng cuối để tìm nguyên nhân, **không để trống** (một khoảng trống trông
  y hệt "cảnh này chẳng có gì đáng nói").
- Cuối file in **N/24**, thiếu thì kêu to bằng khối `!!!`.
- Tên card chứa `SwiftShader`/`Software`/`llvmpipe` ⇒ **DỪNG NGAY ở cảnh đầu**, không phí 5 phút.
- Cả 24 cảnh giữ **1100×700** để so được với nhau, **thêm 1 cảnh cuối 1600×1000** (gấp 2,08 lần
  điểm ảnh) để biết chi phí tăng theo điểm ảnh ra sao trên GPU thật. Mọi kết luận headroom nay
  **gắn tường minh với cỡ cửa sổ**, in ngay trong file kết quả.

**Hai lỗi bắt được nhờ chính cơ chế báo lỗi vừa thêm** (và cả hai đều sẽ nổ trên máy Đàm):
1. **Dấu huyền (`) trong chú thích làm chết cả `city-preview.mjs`.** Mã trang xem thử nằm trong MỘT
   template literal >300 dòng, nên ``// `renderer.info` …`` đóng chuỗi giữa chừng ⇒ `SyntaxError`.
   **Cắn HAI lần trong một phiên.** ESLint không bắt, `npm run build` không bắt (file không vào
   bundle) — chỉ lộ ra lúc CHẠY.
2. **Nháy kép ASCII trong `console.log` làm cụt dòng.** `bench-macbook.sh` lọc bằng `[^"]*` (bắt
   buộc: Chromium bọc mỗi dòng console vào nháy kép rồi dán thêm `", source: http://…`). Dòng kết
   luận quan trọng nhất in ra thành đúng `[stats] ✓ ` rồi hết.
   ⇒ Khoá bằng **`scripts/cityPreviewSource.test.js`** (2 bài, đã thử-cho-đỏ; bài 1 bảo chính Node
   `--check` parse file chứ không đoán bằng regex). Cùng lúc phát hiện `grep -oE 'máy đồ hoạ=.*'`
   kéo theo cả đuôi `", source: …` vào tên card ⇒ đổi sang `[^"]*`.

**Sửa một con số nghiệm thu SAI của vòng 1**: báo cáo ghi *"739 bài test"* — thực tế nền là **731**
(đếm lại bằng `git stash` toàn bộ thay đổi rồi chạy `npm test`). Một con số nghiệm thu ghi sai thì
phiên sau sẽ tưởng mình vừa làm mất 8 bài test rồi đi tìm một lỗi không có.

**Nghiệm thu**: **736 bài test** (731 nền + 5 mới) · lint sạch · build xanh · đã chạy lại 4 kỷ của
ma trận trong hộp cát và xác nhận bảng ba-con-số hiện đúng.
**Tài liệu**: `TECH_DEBT #33` (hoãn có chủ đích, nối cứng với `#31`) · `CLAUDE.md` thêm bài học
chính của vòng này + 2 bài kèm theo · `BAN_GIAO.md` (mục này) · `PROJECT_STRUCTURE.md`.
⏳ **Vẫn chờ Đàm**: `bash scripts/bench-macbook.sh --thu` rồi `bash scripts/bench-macbook.sh`.

---

### 2026-08-17 — Performance Gate: kiểm chính đồng hồ đo trước khi tin nó

**Yêu cầu của Đàm**: đo headroom thật của MacBook để biết còn được phép làm thành phố đẹp tới đâu.
*"Đây KHÔNG phải task tối ưu. Ưu tiên vĩnh viễn: chất lượng hình ảnh Desktop > hiệu năng."* Luật
"tự xử lý vấn đề rủi ro thấp" của `CLAUDE.md` bị **tạm đình chỉ** cho task này.

**Bước 0 — chốt môi trường.** `uname`: Linux, không có `sw_vers` ⇒ không phải macOS.
`UNMASKED_RENDERER_WEBGL` = *ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader
driver)* ⇒ **tô hình bằng CPU**. Theo đúng luật đã ghi sẵn ở tham số `bench`: **không xuất một con
số FPS nào**, chuyển sang dựng bộ đo để Đàm tự chạy.

**Bước 1 — ĐÃ BẮT ĐƯỢC LỖI THẬT.** Đối chiếu hai bên lần đầu tiên trong lịch sử dự án:

| Kỷ (sessions 80, level 3) | tự tính | `renderer.info` | lệch |
|---|---:|---:|---:|
| 3 | 26.168 | 70.294 | **+44.126 (62,8%)** |
| 7 | 34.622 | 78.748 | **+44.126 (56,0%)** |
| 11 | 37.494 | 81.620 | **+44.126 (54,1%)** |
| 14 | 29.366 | 73.492 | **+44.126 (60,0%)** |

Lệnh vẽ thì **khớp tuyệt đối** (12/13 ở cả 4 kỷ). Hằng số 44.126 giống hệt ở mọi kỷ là manh mối:
truy ra đúng hai khối — **vòm trời 960** + **rặng núi chân trời 43.166** (thêm ở Phase 9A). Người
thêm chúng không sửa công thức, và không có gì đỏ lên vì công thức chỉ được so với chính nó.

**Vá gốc**: bỏ hẳn công thức dự đoán, thay bằng `countSceneTriangles(scene)` /
`countSceneDrawCalls(scene)` — duyệt scene graph theo đúng luật `WebGLRenderer` cộng vào
`info.render`. Một phép ĐO trên chính thứ sẽ được vẽ thì không thể lạc hậu khi phase sau thêm khối
mới. `CityScene3D.publishStats()` còn đè lên bằng `renderer.info.render` của khung vừa vẽ — HUD là
một cái đồng hồ đo, nên nó phải đọc từ đồng hồ chứ không đọc từ dự báo.
**Sau vá**: `[stats] tam giác | 78748 | 78748 | +0 (0.0%)`.

**Bước 2 — bóng đổ là BA câu hỏi, không phải một.**

⚠️ **MỌI CON SỐ DƯỚI ĐÂY ĐO TRÊN SwiftShader — CPU rasteriser, KHÔNG PHẢI CARD ĐỒ HOẠ.** Không suy
ra được cho MacBook, kể cả dưới dạng tỉ lệ phần trăm: trên GPU thật lượt dựng bóng chỉ ghi ĐỘ SÂU
(không chạy shader màu, không lấy mẫu môi trường), nên tỉ lệ của nó so với một khung thường là một
đại lượng khác hẳn. Đây là số dùng để **so ba trường hợp với nhau trong cùng một hộp cát**, không
phải giá phải trả trên máy Đàm.

| Đo gì (kỷ 7 · 12h · **khung 400×250** · DPR 1) | P50 | So với khung ổn định |
|---|---:|---|
| Khung ổn định, có bóng — **400×250** | 209,6 ms | mốc |
| `--no-shadow` (tắt hẳn) — **400×250** | 205,6 ms | **−4,0 ms, NẰM TRONG NHIỄU** (biên độ ±15 ms) |
| Khung DỰNG LẠI bản đồ bóng — **400×250** | 239,0 ms | **+29,4 ms (+14,0%)** |

⚠️ **KHÔNG được đọc dòng giữa thành "lấy mẫu bóng ≈ 0%".** −4,0 ms nằm gọn trong nhiễu ±15 ms, nên
câu duy nhất được phép nói là: *chi phí lấy mẫu bóng NHỎ HƠN MỨC PHÉP ĐO NÀY PHÂN GIẢI ĐƯỢC.* Và có
một lý do **cấu trúc** khiến nó không thể lớn hơn thế: phép thử ngược `--dpr` (bảng dưới) cho thấy
16× điểm ảnh chỉ làm thời gian tăng 6,1× ⇒ phần lớn thời gian mỗi khung là chi phí **cố định**,
không phụ thuộc số điểm ảnh. Mà lấy mẫu bóng thì tính tiền **theo từng điểm ảnh**. Một phép đo bị
chi phí cố định lấn át **về mặt cấu trúc không thể thấy** thứ tính theo điểm ảnh — đúng bài học
Phase 9B (*"đại lượng tôi vừa vặn có nằm trong thứ công cụ này đo không?"*). Muốn trả lời câu ấy
phải đo trên GPU thật, ở khung lớn.

Phần dùng được bất kể máy nào là phần **cấu trúc**, không phải con số: `--bench` đo **khung ổn
định**, tức nó chứa chi phí **lấy mẫu** bóng nhưng **KHÔNG** chứa chi phí **dựng lại**. Lượt dựng
bóng thêm **7 lệnh vẽ + 25.436 tam giác** vào `renderer.info` của đúng khung đó — nên phải đọc
`renderer.info` **ngay sau loạt ổn định**, đọc sau loạt dựng bóng là so lệch pha.
`sun.shadow.autoUpdate = false` nên chi phí này chỉ nổ khi thành phố ĐỔI (xây xong công trình, đổi
giờ, đổi kỷ) — điều đó đúng trên mọi máy.

**Bước 3 — mở rộng `--bench` sẵn có, KHÔNG viết công cụ mới.** Giữ nguyên cơ chế `readPixels` (đã
giải xong chuyện `gl.finish()` nói dối). Thêm: P50 + P95 (**P95 = ĐUÔI CHẬM**, nói rõ trong output
vì rất dễ đọc ngược), đối chiếu `renderer.info`, DPR thật, cỡ bản đồ bóng, số shader/geometry/
texture, 12 khung khởi động bị vứt, và cờ **`--gpu`** (bỏ ba cờ ép SwiftShader) + đường dẫn Chrome
trên macOS vào `CHROME_CANDIDATES`.
⚠️ **ĐÃ GỠ `scripts/bench-suite.mjs` + `benchCore.mjs` + `benchCore.test.js`** (viết ở lượt trước
cùng ngày): hai bộ đo song song cho cùng một câu hỏi là đúng cái bẫy "một luật hai công thức" mà
`sweep-score.mjs` đã trả giá ở Phase 4G.

**Phép thử ngược (bắt buộc)** — vặn `--dpr` tới mức vô lý, kỷ 7 · 400×250 nền:

| DPR | Điểm ảnh | P50 | so với DPR 1 |
|---:|---:|---:|---:|
| 1 | 100.000 | 218,5 ms | mốc |
| 2 | 400.000 | 488,7 ms | 2,24× |
| 4 | 1.600.000 | 1337,2 ms | **6,12×** |

Số nhảy rất rõ ⇒ **cần gạt CÓ nối**, phép đo đáng tin. Đáng chú ý: chi phí **không** tỉ lệ thuận
với điểm ảnh (16× điểm ảnh chỉ ra 6,1× thời gian) ⇒ trong hộp cát này có một phần chi phí **CỐ
ĐỊNH** lớn, không phụ thuộc độ phân giải. ⚠️ **Con số ấy KHÔNG ngoại suy sang MacBook và đã bị gỡ
khỏi mọi kết luận.** Trên CPU rasteriser phần cố định là xử lý đỉnh + dựng lệnh vẽ, hai việc chạy
**tuần tự** trước phần điểm ảnh; trên GPU thật chúng chạy **song song** với phần điểm ảnh, nên
không có "phần cố định" nào để mà cộng vào. Ở đây nó chỉ dùng đúng một việc: giải thích vì sao phép
đo này không thấy được chi phí lấy mẫu bóng (mục Bước 2).

**Bước 4/7/8 — CHƯA LÀM ĐƯỢC Ở ĐÂY.** Ma trận 24 cảnh × 120 khung cần GPU thật. Đã dựng
`scripts/bench-macbook.sh`: **một lệnh duy nhất**, chạy trọn ma trận (kỷ 3/7/11/14 × 12/15/22h ×
zoom 1/0.4, `--sessions 80 --level 3`, ở đúng DPR app dùng), ghi ra `.city-preview/bench-macbook.txt`.
Mỗi cảnh tự in **tên máy đồ hoạ** ⇒ bảng kết quả tự khai nó được đo bằng gì.

**Nghiệm thu**: **731 bài test** · lint sạch · build xanh.
⚠️ **SỬA LẠI Ở VÒNG 2**: con số này vòng 1 ghi là "739" — SAI. Đếm lại bằng cách `git stash` toàn bộ
thay đổi rồi chạy `npm test` cho ra đúng **731**. Một con số nghiệm thu ghi sai thì phiên sau sẽ
tưởng mình vừa làm mất 8 bài test, rồi đi tìm một lỗi không có.
**Tài liệu**: `TECH_DEBT #32` (đã đóng, ghi lại vì là lần thứ hai cùng hình dạng sai) ·
`CLAUDE.md` thêm 3 bài học · `PROJECT_STRUCTURE.md` cập nhật bộ công cụ.

### 2026-08-16 — Phase 9D: mặt đường là một HỆ THỐNG, không phải một dải màu (`TECH_DEBT #30` + `#27` đóng)

**Đàm yêu cầu gì**: *"Road hiện tại vẫn giống một dải màu phẳng… ở một số kỷ trở thành rãnh đen.
Hãy sửa ROOT CAUSE thay vì chỉ chỉnh `roadColor`."* Kèm một câu Đàm tự đánh dấu là *"thay đổi quan
trọng"*: **KHÔNG DÙNG MÀU ĐỂ ÉP 15 KỶ KHÁC NHAU** — *"Nếu test '15 kỷ → 15 mặt đường' bị fail sau
khi bỏ darkness, không nới threshold và không giả màu. Hãy thay metric RGB bằng các đặc trưng
structural/visual thực sự."*

**Nguyên nhân gốc** (một câu): bản sắc mặt đường tựa lên **đúng MỘT trục là MÀU**, nên toàn bộ sức
ép "15 kỷ phải khác nhau" dồn vào ĐỘ ĐẬM — mà độ đậm có ĐÁY, còn phép đẩy thì chỉ có SÀN. Luật
*"đường và đất phải cách nhau ít nhất 0,13"* được **CỘNG THÊM** vào chênh lệch riêng của vật liệu,
nên vật liệu nào vốn đã tối bị đẩy **hai lần**: nhựa đường kỷ 11 nhận tổng đẩy 0,289 và render ra
**0,113** trong khi mặt đất 0,406. Đó chính là cái rãnh đen Đàm nhìn thấy, và nó là hậu quả tất yếu
của việc bắt một đại lượng có đáy gánh một nhiệm vụ không có đáy.

**Đã làm gì**
- **Trục bản sắc mới, thuần** — `src/engine/city3d/streetStyle.js`: 15 kỷ × **9 trục CẤU TRÚC** (bề
  rộng đại lộ · bề rộng ngõ · vật liệu lát · cỡ viên · độ mòn · bó vỉa · vỉa hè · vạch kẻ · kiểu
  mép). Mỗi dòng buộc vào `country` mà `eraStyle.js` khai, **có test bắt** để hai bảng không trôi
  khỏi nhau — đúng khuôn `floraStyle.js` đã dùng ở Phase 8D.
- **Phép đẩy độ đậm nay BÃO HOÀ** — có cả sàn lẫn trần mà vẫn đơn điệu ngặt (`palette3d.js`). Đóng
  `#30`; và vì `#27` ("15 kỷ ra 15 mặt đường" chỉ đạt nhờ 3% biên) xưa nay **sống nhờ chính phép
  đẩy vô hạn đang được sửa**, hai mục buộc phải đóng cùng lúc — đúng như Phase 9B đã ghi khi nối
  cứng chúng lại.
- **Bài test `15 KỶ RA 15 MẶT ĐƯỜNG` thôi chấm bằng RGB**, chấm bằng chính 9 trục ấy. Lượng tử hoá
  suy ra từ **đúng hai sự thật đã đo**: một ô thành phố ≈ 64 điểm ảnh màn hình, và ngưỡng mắt
  12/255 — không có con số nào chọn cho vừa. Kết quả 105 cặp: yếu nhất **3/8**, trung vị **6/8**,
  không cặp nào dưới 3; cặp kề nhau yếu nhất cũng 3/8.
- **Màu vẫn được canh, nhưng đổi VAI** — từ "thứ mang bản sắc" thành "lưới chống sập" (trung vị
  116,4). Thêm một bài canh mà tôi cho là quan trọng nhất trong nhóm: **cặp gần nhau nhất về màu
  BẮT BUỘC phải là hai kỷ dùng CHUNG vật liệu lát**. Nếu một ngày hai kỷ khác vật liệu lại gần nhau
  nhất về màu thì bảng đã trôi, và bài test nói ra điều đó thay vì chỉ kêu một con số.
- **Bốn dòng bảng sai lịch sử đã sửa**, mỗi dòng kèm lý do có thể kiểm lại: kỷ 3 (đường **rước** của
  Ur mà lại hẹp hơn cả nước Ý và nước Anh công nghiệp — chính chữ "đường rước" trong `note` của nó
  tự tố cáo), kỷ 6 (Hà Nội "36 phố phường" mà rộng hơn đường rước Ur), kỷ 1 (cỏ bị giẫm vốn loang
  lổ — mặt đường không đều nhất trong 15 kỷ), kỷ 2 (phù sa sông Nin liên tục được gió và chân người
  san phẳng — cực đối lập của kỷ 1).
- **Một lỗi ĐỌC SỬ, không phải lỗi chỉnh màu**: kỷ 7 lát đường bằng `pietraforte` và tự giải thích
  là *"chính thứ đá dựng nên Palazzo Vecchio"* — câu ấy **đúng**, và chính nó là chỗ sai:
  pietraforte là đá **XÂY TƯỜNG**. Đá thật sự lát đường Firenze là **pietra serena**. Đổi xong:
  0,050/0,039/0,019 → **0,200/0,191/0,198**.

**Nghiệm thu trên ĐIỂM ẢNH ĐÃ DỰNG** (`scripts/road-score.mjs`, mặt nạ do chính bên dựng cấp nên
khớp từng điểm ảnh; 7 bài tự-kiểm, trong đó có bài **nhốt sẵn bộ số hỏng của `#30`** bắt phép đo
phải còn bắt được nó). 4 kỷ × 3 giờ = **12/12 đạt**:

| kỷ · giờ | sắc (≥0,05) | hố (≤0,26) | kỷ · giờ | sắc | hố |
|---|---|---|---|---|---|
| 3 · 12h | 0,226 | 0,181 | 11 · 12h | 0,183 | 0,201 |
| 3 · 15h | 0,194 | 0,135 | 11 · 15h | 0,173 | 0,184 |
| 3 · 22h | 0,109 | 0,059 | 11 · 22h | **0,056** | 0,072 |
| 7 · 12h | 0,209 | −0,213 | 14 · 12h | 0,167 | −0,106 |
| 7 · 15h | 0,200 | −0,203 | 14 · 15h | 0,153 | −0,099 |
| 7 · 22h | 0,209 | −0,155 | 14 · 22h | 0,210 | −0,147 |

`hố` âm = mặt đường **sáng hơn** nền quanh nó (kỷ 7 đá phiến sáng, kỷ 14 bê tông) — ngược hẳn cái
rãnh cũ. **Biên mỏng nhất: kỷ 11 · 22h ở 0,056, chỉ hơn ngưỡng 12%** — ghi ra đây theo đúng bài học
Phase 9B (*"đo BIÊN của mọi lời hứa, đừng chỉ đọc xanh/đỏ"*). Nhưng đó là biên của **bề mặt**, và
đúng ở chỗ này Phase 9D trả lời được: đo đuôi sáng của chính nhóm đường ban đêm ra kỷ 11 = **0,561**
(vạch giữa) so với kỷ 3 = 0,189 (không có vạch nào) — tức con đường ban đêm còn đọc được nhờ một
tín hiệu **cấu trúc mạnh gấp 10 lần** độ tương phản bề mặt của nó. Đây là điều bản cũ không thể có,
vì bản cũ chỉ có màu.

**Hiệu năng** (đo A/B trong một `git worktree` riêng ở `b89eb5c`, cùng kỷ/giờ/seed/camera):

| kỷ | tam giác | lệnh vẽ | ms/khung |
|---|---|---|---|
| 3 | 26.494 → 26.894 (+1,5%) | 13 → 13 | 2453,20 → 2556,00 |
| 7 | 33.502 → 34.222 (+2,1%) | 13 → 13 | 2285,30 → 2333,90 |
| 11 | 35.230 → 35.594 (+1,0%) | 12 → 12 | 2560,10 → 2586,00 |
| 14 | 27.210 → 27.670 (+1,7%) | 12 → 12 | 2395,70 → **2342,70** |

⚠️ **Cột ms/khung KHÔNG kết luận được gì** và tôi ghi rõ ra thay vì im lặng dùng nó: kỷ 14 *nhanh
lên* sau khi được thêm hình học, còn biên độ dao động trong **cùng một lần chạy** là ±4,5% — lớn
hơn mọi chênh lệch đo được. Đây là SwiftShader (dựng bằng CPU, ~2,4 giây/khung), không phải GPU
MacBook. Hai cột đáng tin là tam giác (+1…+2%) và **lệnh vẽ đứng yên ở cả 4 kỷ** — tức cả hệ thống
đường (mặt đường + bó vỉa + vỉa hè + vạch kẻ) vẫn nằm gọn trong **MỘT lệnh vẽ**, phân lớp bằng
thuộc tính đỉnh `ROAD_PART` chứ không bằng thêm vật liệu.

**Bản quét 15 kỷ vẫn chạy được** (yêu cầu nghiệm thu của Đàm): **0/105 cặp kỷ** và **0/15 cặp
chặng** dưới ngưỡng mắt; gần nhất 22,8 · trung vị 40,7 (trước 9D: 23,3 · 41,1) — 9D **không** đẩy
cặp nào xuống dưới ngưỡng.

**Bài học mới ghi vào `CLAUDE.md`**: (1) công cụ nói dối lần thứ 20–21 — một phép đo chỉ nhìn ĐỘ
SÁNG đã **kết tội oan kỷ 7** (0,001 lúc 22h trong khi mắt thấy rõ con đường), và suýt dẫn tới hai
kết luận SAI NGƯỢC NHAU liên tiếp: tin công cụ ("kỷ 7 hỏng"), rồi tin mắt ("công cụ hỏng, kỷ 7
không sao"). **Cả hai đều đúng một nửa**: công cụ hỏng thật (thiếu một trục) VÀ kỷ 7 hỏng thật (sai
đá), vì hai lý do hoàn toàn không liên quan nhau; (2) một ngưỡng TUYỆT ĐỐI cho "đáy tối" kêu oan
cảnh đêm — đêm tối là ĐÚNG, nên cả hai ngưỡng nay đều là QUAN HỆ với mặt đất; (3) suýt chấm điểm
một **tấm ảnh cũ** (bản quét còn đang dựng) và đã huỷ kết quả đó — bài "đo một hiện vật ôi thiu".

**728 bài test** (+9 của `streetStyle.test.js`, tất cả đã phá thử 11/11 lần đều đỏ), lint sạch,
build xanh.

### 2026-08-16 — `TECH_DEBT #22` đóng: công cụ chấm 15 kỷ thôi đo "thứ tươi nhất" rồi gọi đó là mái

**Đàm yêu cầu gì**: sửa **nguyên nhân gốc** của #22 — *"không được chỉ đổi threshold cho đến khi
test xanh"*, *"không phụ thuộc vào một giả định mỹ thuật dễ chết trong phase sau"*, *"không thay
đổi renderer production chỉ để phục vụ metric"*. Không đụng vào #30/#27/#24.

**Nguyên nhân gốc**: bộ lọc `roofColor` lấy **8% điểm ảnh tươi nhất** của dải thành phố rồi **gọi**
đó là mái. Chữ "≈" ấy là một **giả định mỹ thuật không được viết ra**: *mái là thứ tươi nhất khung
hình*. Đúng suốt thời kỳ mái suy từ `accentColor` (màu nhấn giao diện, luôn rực); **Phase 6B** đổi
mái sang vật liệu lợp thật (đá phiến `#586a89`, bê tông `#717b65`, tranh, gạch bùn — phần lớn XỈN)
và **Phase 8D** cho mỗi kỷ một thảm thực vật riêng ⇒ thứ tươi nhất còn lại là **CỎ**.

**Vì sao KHÔNG "chọn điểm ảnh mái cho khéo hơn"** (đo ở tầng dữ liệu, không phải suy đoán): chạy 15
kỷ qua `getEraStyle` thì **4/15 kỷ khai mái TRÙNG vật liệu tường** — kỷ 3 (mudbrick), 12 và 13
(concrete), 14 (glass). `materialProfile(role==='roof')` xếp tam giác mái vào họ **vật liệu**, nên
ở bốn kỷ ấy "nhóm mái" và "nhóm tường" là MỘT. **Mái không tách được ngay từ NGUỒN** ⇒ cả hướng
"mặt nạ do bên dựng cung cấp" mà chính #22 từng đề xuất cũng chết. Và đúng cặp **12↔13** dùng chung
CẢ HAI vật liệu.

**Đã làm**: bỏ hẳn proxy "mái". Ruột phép đo tách sang `scripts/sweepMetric.mjs` (thuần, `import`
được); dải thành phố chia **lưới 6×3 = 18 ô con**, so **từng chặng rồi lấy trung bình khoảng cách**
(gộp trước khi so thì hai kỷ lệch ngược chiều ở hai đầu ngày sẽ triệt tiêu nhau). Giữ nguyên **đơn
vị RGB/255** để ngưỡng mắt 12 hiệu chuẩn ở Phase 3Y còn dùng được. Gỡ luôn cổng "TỪ CHỐI CHẤM" —
nó sinh ra để canh một bộ lọc nay không còn.

**Số đo** (bản quét 15 kỷ × 6 chặng trên mã Phase 9C `53045b2`): **0/105 cặp kỷ** dưới ngưỡng, gần
nhất **23,3** (kỷ 11↔12), trung vị **41,1**; **0/15 cặp chặng**, gần nhất 20,7. Cặp **12↔13 = 28,2**
(gấp 2,35 lần ngưỡng). `--selftest` thu lưới về 1×1 ra **5,0 · 6/105** ⇒ việc chia ô con nâng cặp
gần nhất **~4,7 lần** trên dữ liệu THẬT, không chỉ trên ảnh dựng tay.

**Phase 9C có làm 15 kỷ khó phân biệt hơn không?** Không đáng kể, và **không cặp nào tụt xuống dưới
ngưỡng**: đo cùng một phép đo trên cùng bộ kỷ, trước 9C gần nhất 24,1 · trung vị 42,8 → sau 9C
23,3 · trung vị 41,1 (−3,3% và −4,0%, cả hai đều 0/105). Cặp 12↔13: 28,7 → 28,2.

**6 bài test mới** (`scripts/sweepMetric.test.js`), **mỗi bài đã phá thử và thấy ĐỎ**. ⚠️ Hai bài
đỏ ngay lần đầu, và lỗi nằm ở **FIXTURE chứ không ở phép đo** (mảng thử là dải ngang, chỉ hưởng lợi
từ chia HÀNG). Sửa fixture cho giống vật thật, **không hạ ngưỡng cho test xanh**.

**KHÔNG đụng gì vào renderer**: 718/718 test, lint sạch, build xanh, chunk 3D
`CityScene3D-BoWYJm9L.js` **trùng băm** với `53045b2`; không file nào dưới `src/` import công cụ đo.

⚠️ **Kèm theo — một khoản nợ tài liệu tự phát hiện**: `package.json` glob test trước nay liệt kê
từng thư mục GỐC (`electron/` · `src/` · `api/`), nên `scripts/sweepMetric.test.js` **im lặng không
chạy** cho tới khi thêm `'scripts/**/*.test.js'`. Đúng hình dạng sai của `TECH_DEBT #10`, chỉ khác
ở cấp gốc thay vì cấp thư mục con. Đã ghi vào `PROJECT_STRUCTURE.md`.

### 2026-08-16 — Phase 9C (bổ sung nhật ký còn thiếu, commit `53045b2` đã lên `main` từ 2026-08-16)

> ⚠️ Ghi bù: phiên làm Phase 9C đã commit + push nhưng **chưa kịp ghi vào nhật ký này**, nên file
> vẫn tự nhận "cập nhật lần cuối = Phase 9B" trong khi 9C đã chạy trên production. Ghi lại đây cho
> đúng — một bản ghi thiếu là thứ phiên sau kế thừa rồi dựa vào.

Ba nguyên nhân gốc, đo được: **(1)** `city-preview.mjs` viết cứng `setPixelRatio(1)` trong khi app
chạy `min(dpr, 2)` ⇒ **mọi kết luận mỹ thuật trước nay đo trên bản THẤP HƠN thứ Đàm nhìn**; nay cả
hai đọc chung `MAX_PIXEL_RATIO` (12,82% điểm ảnh đổi giá trị giữa DPR 1 và 2). **(2)** Không có đỉnh
chói vì `envMapIntensity` là **một trường của three gánh hai việc** (nhân cả khuếch tán lẫn phản
chiếu); vá bằng đĩa mặt trời HDR trong cảnh dò PMREM + nhân bù RIÊNG đường `radiance`, **chỉ cho
công trình** — bóc cho cả mặt đất/đường/đồi làm tươi tụt mà đỉnh không cao thêm. **(3)** Bề mặt
phẳng lì → `surfaceDetail.js`, một abstraction dùng chung cho bốn nhóm vật liệu, nhiễu theo toạ độ
THẾ GIỚI (không thêm UV, không ảnh kết cấu). ⚠️ **Đính chính commit message của `53045b2`**: nó ghi
tươi tụt "9-16%", số đo thật là **6,4–14,6%**; bảng số trong `surfaceDetail.js` mới là bản đúng.

**Đàm yêu cầu gì**: *"Bóng đổ không được là những mảng đen cứng, phẳng và tuyệt đối."*

**Đo trước khi sửa** (công cụ mới `scripts/shadow-score.mjs`, kỷ 7@15h · 11@15h · 13@12h): sàn độ
sáng **0,107 / 0,029 / 0,109**, **13,4% / 16,9% / 8,2% khung hình bị nghiền** dưới ngưỡng 0,12 mà
mắt còn đọc ra chi tiết. Khoảng cách sáng-tối 0,48–0,64 (còn rộng ⇒ có chỗ nâng sàn mà không nhạt).

**Nguyên nhân gốc**: đèn bán cầu (0,34) và nắng (2,15) là **hai hằng số KHÔNG biết nhau**, trong
khi thứ quyết định độ đen của bóng là **khoảng cách giữa chúng**. Đáng nói hơn: chú thích ngay tại
chỗ đã tuyên bố mục tiêu *"vùng tối chuyển từ ĐEN sang LAM"* và tự coi là đạt — nhưng **chưa bao
giờ được đo**; và nó còn tự thú rằng Phase 7A đã hạ đèn bán cầu theo một giả thuyết về sau bị bác,
*"và nó ở lại thêm nhiều phase"*.

**Đã làm**:
1. **Đèn trời phát biểu thành TỈ LỆ của nắng** (`SUN_BASE × SKY_FILL_RATIO`, 0,41 sáng · 0,75 tối)
   — ADR-024. Nắng đổi thì đèn trời tự đi theo, mãi mãi.
2. **Cấu hình bóng đổ dồn vào `applyPaintedLook`**; **cỡ bản đồ bóng do chính cảnh đặt lúc dựng**
   (máy bàn 1024 → **2048**, điện thoại giữ 512). Gỡ phần tự khai lại ở `CityScene3D.jsx` và ở CẢ
   HAI khối dựng của `scripts/city-preview.mjs`.
3. **2 bài test mới** đọc-mã-nguồn, **đã thử ngược 5/5 lần đều đỏ**: một bài khoá cái HÌNH DẠNG
   "đèn trời bám theo nắng" (không khoá giá trị 0,41 — đó là lựa chọn mỹ thuật), một bài cấm hai
   nơi gọi tự khai lại cấu hình bóng.

**Kết quả đo sau khi sửa**: sàn **0,170 / 0,054 / 0,160**; bị nghiền **0,2% / 11,1% / 2,7%**;
**độ tươi đứng yên** (0,131→0,136 · 0,117→0,114 · 0,082→0,082) và khoảng cách sáng-tối còn nhích
lên (0,480→0,503) ⇒ **không dính bẫy "pastel như sữa"** của Phase 7A — vì lần này nắng đi lên CÙNG.

**Ba thứ đã thử và KHÔNG ship** (ghi lại để phiên sau khỏi dò lại từ đầu):
- `LightShadow.intensity` — nâng riêng điểm ảnh trong bóng, nhưng nó cộng lại ánh sáng **ẤM** của
  nắng, tức đẩy chênh sắc nóng-lạnh sai chiều (bóng ban ngày ngoài đời phải ngả LAM).
- `VSMShadowMap` + `shadow.radius` — **đã xác minh là sống** (vặn radius lên 60 thì số có dịch),
  nhưng ở bán kính an toàn thì không đo được và không nhìn ra khác biệt, mà VSM có sẵn rủi ro rò
  sáng. Không ship một thay đổi mà mình không chứng minh được lợi ích.
- **Bản vá mặt đường** (phép đẩy bão hoà) — đã viết, đã đo đủ 15 kỷ, kỷ 11 lên +27%, thứ tự giữ
  nguyên… nhưng nó làm ĐỎ bài `15 KỶ RA 15 MẶT ĐƯỜNG`. **Không nới ngưỡng, không ship nửa vời** →
  `TECH_DEBT #30`, nối cứng với `#27`.

**Hai phát hiện đáng giá hơn cả bản vá**:
- **Bản QUÉT 15 kỷ — công cụ duyệt mỹ thuật chính thức của dự án — đang chạy bóng ở 512 trong khi
  app chạy 1024.** Cỡ bản đồ bóng viết cứng ở ba nơi với ba giá trị. Mọi nhận xét về bóng đổ rút ra
  từ bảng quét suốt các phase trước đều đang nói về một thế giới thô gấp đôi.
- **Lời hứa "15 kỷ ra 15 mặt đường" xưa nay chỉ đạt nhờ 3% biên (10,3 so với ngưỡng 10), và nó đạt
  được chính nhờ khuyết tật mà #30 phải sửa.** Nới trần tới mức gần như không bão hoà nữa cũng chỉ
  lên 9,8. ⇒ phương án "chấp nhận vĩnh viễn" mà #27 đề xuất **đã chết** mà không ai để ý.

**Còn lại, đã đo, chưa xử lý**: kỷ 11 vẫn 11,1% bị nghiền — nhưng phép thử ngược (tắt hẳn
`sun.castShadow`) cho thấy **9,6 trong 11,1 điểm phần trăm ấy là MẶT ĐƯỜNG chứ không phải bóng**
(`TECH_DEBT #30`). Đừng cố chữa bằng cách nâng thêm đèn. Cảnh ĐÊM (kỷ 11, 22h) sàn 0,014 và 32,2%
bị nghiền — đêm tối là đúng, nhưng chưa có mốc "trước" để so, phiên sau muốn đụng thì đo lại trước.

**Nghiệm thu**: 705 bài test xanh (+2), lint sạch, build xanh, đã nhìn bằng mắt vào ảnh kỷ 7/11.

> Mỗi lần xong việc đáng kể, thêm 1 dòng vào ĐẦU danh sách.

- **2026-08-15 (Phase 9A — thế giới không kết thúc ở rìa thành phố)** — **703 bài test** (688 → 703),
  lint sạch, build xanh. File MỚI: `engine/city3d/horizon.js` + `horizon.test.js` +
  `scripts/depth-score.mjs`. Sửa: `daylight.js` (sương tuyến tính → `FogExp2`, mật độ chọn từ ba mốc
  đo được), `terrain.js` (export `terrainSurfaceReach`/`TERRAIN_SUB`/`valueNoise` để hai tấm dùng
  chung một chỗ giáp), `palette3d.js` (`outskirts` hạ pha sương nướng-sẵn 0,42 → 0,15),
  `terrainMesh.js` (`buildHorizonSurface` + tách `applyBareEarth` dùng chung), `sceneGraph.js`,
  `daylight.test.js` + `sceneGraphWiring.test.js`.
  - **Quyết định kiến trúc**: **ADR-022** (chân trời là trường cao độ RIÊNG theo kỷ, độc lập với
    `relief` — lần thứ NĂM của "một trường gánh hai việc") và **ADR-023** (phối cảnh không khí là
    việc của SƯƠNG theo khoảng cách thật, không nướng sẵn vào nước sơn — đảo ngược một nửa quyết
    định cũ về `outskirts`, vì cả hai tiền đề của nó đã bị Phase 9A gỡ bỏ).
  - **Đo được**: số lớp không gian ở dải xa **0 → 55** (`scripts/depth-score.mjs`), biên độ 0 → 0,241.
    fBm thật sự chạy: độ cong ở cỡ lưới kỷ 13 **0,0111 so với 0,0038** khi ép một tầng (gấp 2,9 lần),
    trong khi thảo nguyên/đụn cát đứng yên — đúng như `rough` thấp phải thế.
  - **BỐN lỗi của phase này, và cả bốn đều chỉ lộ ra khi ĐO chứ không khi đọc mã**: (1) chỗ giáp hai
    tấm suy tay ra 9,4 trong khi thật là 9,5 ⇒ **khe hở 0,5 đơn vị** vòng quanh thành phố, hiện lên
    ảnh thành hai cái nêm sáng; (2) ô nhiễu 1,01 trong khi lưới lấy mẫu mỗi 2,0 ⇒ dãy núi ra **mảng
    tam giác sắc lẹm**, đúng vẻ low-poly cả phase sinh ra để xoá; (3) một tầng nhiễu ra **bong bóng
    tròn xoe như sáp chảy** — địa hình thật là phân dạng, phải fBm; (4) tấm núi tự nghĩ ra một luật
    màu riêng ⇒ mặt đất thành phố `#626855` đụng chân núi `#7a8876`, mắt đọc ra **một cái bệ và một
    cái hào** dù hình học khớp tuyệt đối.
  - **Ba bài học đã ghi vào `CLAUDE.md`**: ngưỡng nới rộng "cho chắc" là một cái PHỄU (hai bài test
    sương cho mật độ màn-sữa đi qua thoải mái) · "tiến tới 1 nhưng không bao giờ chạm 1" đúng về
    toán và vô nghĩa về nhìn (93% với 100% thì mắt không phân biệt được) · phép đo phải chạm đúng
    đại lượng mình định nói, nếu không nó **CHÊ OAN** một cơ chế đang chạy tốt (lần thứ 19 công cụ
    tự chế nói dối — và là lần đầu nó nói dối theo hướng chê oan).
  - **Còn nợ**: chưa đo hiệu năng trên iPhone sau khi cộng thêm ~43k tam giác (gộp vào TECH_DEBT
    #23/#26 đang chờ Đàm). Kỷ 15 (sa mạc Dubai) nhìn vẫn hơi ngả lam ở chặng sáng — `outskirts` suy
    từ một gốc màu ngả lục, chưa phải màu cát; chưa sửa vì nó là câu hỏi về bảng màu theo kỷ, không
    phải về chân trời.

- **2026-08-15 (Phase 8D — cây thôi là hình nón trên que)** — **688 bài test** (665 → 688), lint
  sạch, build xanh. File MỚI: `engine/city3d/floraStyle.js` + `flora.js` + hai file test của chúng.
  Sửa: `propSpec.js` (viết lại), `parts.js` (thêm vai `leaf2`), `materials.js` (`leaf2` → cùng họ
  `foliage`, không tốn thêm lệnh vẽ), `palette3d.js` (đọc `leafHue`/`leafSat` từ bảng thực vật),
  `cityLayout.js` (lùm + lệch tâm ô + trần phủ xanh), `hashId.js` (gom `unit`/`signed`/`pickIndex`),
  `sceneGraph.js` (độ lệch vào CẢ toạ độ ngang lẫn truy vấn cao độ), `render2d/CityTile.jsx` (hình
  bụi), `cityLayout.test.js` + `sceneGraphWiring.test.js`.
  - **Quyết định kiến trúc**: **ADR-020** (thảm thực vật có ngữ pháp riêng — sao chép đúng khuôn ba
    lớp của nhà cửa, thay vì thêm biến thể vào mấy nhánh `if`) và **ADR-021** (mật độ cây là một
    TỈ LỆ với đất còn trống, không phải một số cây tuyệt đối).
  - **Số nghiệm thu**: cấu trúc cây khác nhau trên 15 kỷ **3 → 405** (17–33 dáng trên 40 hạt mỗi
    kỷ, trước là 1) · cảnh vật lệch khỏi tâm ô **0% → 100%** · chỉ số tụ Clark–Evans khi bật/tắt cơ
    chế lùm **1,051 → 0,923** (34 phiên) và **0,914 → 0,782** (80 phiên) · đất trần ở thành phố
    trưởng thành **0 ô ở 10/15 kỷ → 7–24 ô ở mọi kỷ** · tam giác trung bình **30.656 → 30.769
    (+0,4%)** · lệnh vẽ **11–13, không đổi**.
  - **BỐN LỖI, và ba trong bốn là do bài test mới bắt chứ không do đọc mã**:
    1. **`bush` nằm chung bảng loài với cây** (lọc bằng cờ `allowBush`). Đo ra: cảnh vật loại "bụi"
       ở kỷ 1 ra **5 khối, 212 tam giác, CAO 0,94** — một cái cây hoàn chỉnh đứng ở chỗ đáng lẽ là
       bụi thấp, vì kỷ 1 khai `broadleaf` nặng hơn nên 6/10 lần "bụi" bốc trúng cây. Cái cờ ấy chỉ
       che một nửa: nó chặn bụi lọt vào rổ cây, **không** chặn cây lọt vào rổ bụi. Bài học cũ lần
       thứ tư — **một bảng gánh hai việc** ("cây gì mọc ở đây" + "tầng cây bụi dày bao nhiêu").
       Nay bảng chỉ trả lời câu đầu; câu sau là trường `undergrowth` riêng. Bụi nay 3 khối, 108 tam
       giác, cao 0,18–0,20.
    2. **`sides`/`taper` viết cứng ở BỐN loài** (`cypress`, `streetTree`, `banyan`, `bush`) ⇒ hạt
       giống chỉ đổi được kích thước, mà kích thước không đổi được HÌNH BÓNG. Mỗi lần đo đều ra
       "40 hạt chỉ 2–4 dáng". Vá xong ba chỗ vẫn sót chỗ thứ tư — đúng bài học *"đổi một luật thì
       grep chính cái luật ấy trên toàn cây"*.
    3. **Núm LOD chỉ cắn ở 5/10 hạt** với `palm` và `cypress`: ngân sách mức thấp đặt bằng đúng
       khoảng mà mức cao có thể ra, nên một nửa số hạt cho hai mức Y HỆT NHAU. Một cái núm không
       nối vào đâu vẫn "chạy" bình thường — đúng hình dạng sai của Phase 7A.
    4. **Cả cơ chế mọc-thành-lùm là MÃ CHẾT**, và chỉ **phép thử ngược** chứng minh được: bật/tắt
       thì chỉ số phân tán **đứng yên tới hai chữ số thập phân** ở cả bốn kỷ đo thử. Hai nguyên
       nhân: (a) mọi cảnh vật vừa đặt lại được ghi thành một tâm lùm mới ⇒ "bám vào một lùm" thoái
       hoá thành "bám vào một cảnh vật bất kỳ" ≈ rải đều; (b) ở 120+ phiên lưới **kín 144/144** nên
       không chiến lược đặt nào đổi được gì. Vá: trần 4 tâm lùm + chỉ hạt gieo ở chỗ MỚI mới được
       làm tâm + trần phủ xanh (ADR-021).
  - **Bài học ghi lại cho phiên sau**: *"một bài test chưa từng thấy đỏ thì chưa phải test"* phải áp
    cho cả **PHÉP ĐO**. Nhìn ảnh chụp thì thấy có lùm cây thật, và nếu dừng ở đó thì tôi đã ship một
    cơ chế chết kèm một chú thích dài giải thích nó hoạt động ra sao. Ngoài ra: chỉ số phân tán theo
    ô vuông (Ic) **quá nhiễu ở cỡ mẫu n≈30** (bốn kỷ cho bốn chiều khác nhau); Clark–Evans chỉ phụ
    thuộc chính các điểm nên đo lại hai cỡ thành phố ra cùng chiều, cùng độ lớn ≈0,13 — **hai lần đo
    khớp nhau mới là thứ phân biệt tín hiệu với nhiễu**, một lần thì không.

- **2026-08-15 (Phase 8C — mặt đất thôi là bàn cờ)** — **665 bài test** (653 → 665), lint sạch,
  build xanh. Đổi `engine/city3d/terrain.js` (thêm `smoothHeightAt`/`surfaceHeightAt`/`tintAt` +
  `APRON_CELLS`/`APRON_DROP`/`APRON_EDGE`), file mới `render3d/terrainMesh.js` +
  `terrainMesh.test.js`, `sceneGraph.js` (bỏ 2 khối `InstancedMesh` + hàm `buildInstances`; tấm ván
  vùng ngoài ngồi theo `APRON_DROP`; `ROAD_LIFT`/`LANE_WIDTH` chuyển nhà sang `terrainMesh.js` để
  không có hai con số song song). `sceneGraphWiring.test.js`: bảng `GROUND_ANCHORS` nay ghi kèm TÊN
  FILE cho từng hàng vì luật "sáu chỗ bám đất" đã trải trên hai file.
  - **Quyết định kiến trúc (ADR-019)**: một nửa lập luận của ADR-014 bị **đảo ngược có chủ đích** —
    "phải là thềm bậc" đứng trên tiền đề "nền là 144 ô hộp", và phase này gỡ chính tiền đề đó. Bản
    ghi cũ giữ nguyên, bản mới nói rõ đảo ngược cái gì và vì sao.
  - **Bất biến mới, khoá bằng test**: tại toạ độ NGUYÊN, `smoothHeightAt` trả về **đúng**
    `heightAt` — lệch một phần nghìn là cả thành phố lơ lửng hoặc lún, im lặng.
  - **Đã sửa kèm**: chú thích bài test "cao độ là bội số của bậc thềm" còn kể lý do CŨ (144 ô hộp);
    luật vẫn đúng nhưng lý do đã chết, và một lời giải thích sai là thứ phiên sau kế thừa rồi dựa vào.
- **2026-08-15 (Phase 8B — cạnh vát)** — **653 bài test** (650 → 653), lint sạch, build xanh,
  không đụng state/schema, **không thêm lệnh vẽ**.
  - **Việc**: nguyên nhân gốc số 1 của audit 8A. `parts.js` thêm `bevelWidth()` thuần;
    `geometryFactory.emitPrism` dựng **ba vành mặt bên** (dải vát dưới · thân · dải vát trên) thay
    vì một. Vì hình học không đánh chỉ mục nên hai dải vát tự có pháp tuyến nghiêng ~45° và bắt
    sáng khác mặt tường — **đó chính là vệt sáng viền**, không thêm đèn/vật liệu/ảnh nào.
  - **Vì sao là TỈ LỆ chứ không phải một số**: bề rộng cố định 0,02 đặt lên gờ tầng dày 0,022 sẽ
    **nuốt gần trọn** cái gờ vừa dựng ở 8A. Đúng bẫy Phase 7D/5B. Nên vát = `cạnh mỏng nhất × 0,15`,
    chặn trên bởi `BEVEL_MAX`, và **bỏ hẳn** nếu hẹp hơn `BEVEL_MIN_VISIBLE`.
  - **Ngưỡng nhìn-thấy-được là thứ giữ ngân sách**: đo ra cạnh mỏng nhất của khối TRUNG VỊ chỉ
    **0,035** (kính + gờ mảnh chiếm đa số) → vát ra 0,005, dưới nửa điểm ảnh. Vát tất = **×2,32**;
    bỏ khối quá mỏng = **×1,24**, chỉ ~18% khối được vát. Kỷ nặng nhất 18.532 → 22.948 tam giác
    công trình (cả cảnh ~29.000 = 48% trần).
  - **`BEVEL_MAX` chọn bằng BẢNG ĐO, không bằng cảm giác** (0,020→3,3% · **0,035→3,8%** ·
    0,050→4,4% · 0,070→4,9% khung hình đổi đủ thấy). Nới nó **không tốn thêm tam giác** — thứ chặn
    tay là mỹ thuật: quá 5% bề mặt thì mép vát thôi là mép và thành một khối thóp khác.
  - ⚠️ **LỖ HỔNG 6 THÁNG**: chú thích `countTriangles` hứa *"có test đối chiếu hai bên"*; bài duy
    nhất tồn tại chỉ so với **hằng số viết tay**, trên khối không có `w`/`d`/`h`, chưa bao giờ nạp
    nhà máy hình học. Không cắn ai chỉ vì mỗi khối khi ấy có số tam giác CỐ ĐỊNH — 8B làm số tam
    giác phụ thuộc kích thước khối, và lỗ hổng lập tức nguy hiểm thật. Đã viết bài đối chiếu thật.
  - ⚠️ **SUÝT ĐI CHỮA MỘT BỆNH KHÔNG CÓ**: ảnh cận cảnh kỷ 7 cho ra màu áp đảo `#131826` (l=0,11,
    xanh lam) trong khi bảng màu ghi tường `#c4b4a1` (l=0,70, nâu ấm) — trông y hệt một lỗi ánh
    sáng nghiêm trọng. Đo lại ở **khoảng cách thường** thì lành mạnh (l=0,65/0,53/0,63 ở 9/12/16
    giờ): cái tối kia là bóng đổ của chính cái tháp lấp đầy khung hình ở mức zoom 0,30, tức một
    hiện vật của cách tôi đóng khung, không phải lỗi. **Đo trước khi kết luận.**
  - **Nhìn ảnh**: kỷ 11 (New York, giật cấp) lúc 16 giờ — mép vát sáng chạy dọc viền mái đồng và
    các khối giật cấp, đọc ra rõ. Kỷ 7 cận cảnh thì tinh tế hơn nhiều (mặt cong của mái vòm).
  - **CÒN LẠI**: mặt đất vẫn là bàn cờ 144 ô vuông — và nó **không** đi qua `geometryFactory` (là
    `InstancedMesh` riêng ở `sceneGraph.js`) nên cạnh vát 8B **không chạm tới nó**. `TECH_DEBT #28`
    nay chỉ còn phần này.

- **2026-08-15 (Phase 8A — tường thôi phẳng)** — **650 bài test** (646 → 650), lint sạch, build
  xanh, **không đụng state/schema**. Đàm ra chỉ thị mới và nó bác thẳng cách làm cũ: *"không coi các
  thay đổi palette, màu đường, terrain hoặc thêm vài nhà hiện tại là đã hoàn thành Visual
  Foundation"*; thành phố vẫn *"quá pixel, hình hộp, low-poly, vật liệu phẳng"* và *"nhà không được
  chỉ gồm: box + roof + vài ô cửa"*.
  - **Audit đo ra Đàm đúng theo nghĩa đen.** Nhà dân nhỏ nhất (kỷ 7): **12 khối**, cấu tạo
    `wall:1 stone:1 glass:8 dark:1 roof:1` — thân nhà đúng MỘT cái hộp. Kỳ quan kỷ 7 Lv3: 134 khối.
    Và con số đáng xấu hổ hơn: cả cảnh chỉ dùng **5% (kỷ 1) – 23% (kỷ 7)** trần 60.000 tam giác.
    Tức nhiều phase liền đã tiết kiệm tam giác ở nơi KHÔNG cần tiết kiệm, rồi đi chỉnh màu để bù
    cho cảm giác phẳng — chữa triệu chứng của một bệnh do chính mình gây ra.
  - **Ba nguyên nhân gốc đặt tên được**: (1) cả hệ thống chỉ có ĐÚNG HAI hình cơ bản (`prism` và
    `gable`), không có vát cạnh, nên mọi cạnh là góc 90° trần trụi; (2) cửa sổ **THÒ RA** khỏi
    tường 0,035 — mắt đọc ra "miếng dán", không đọc ra "cái lỗ"; (3) một mảng tường là một hình chữ
    nhật tô một màu, không có gì cắt ngang.
  - **Đã sửa (2) và (3)**: mỗi mảng nhà nay có **chân tường** · **gờ mái** · **≤3 gờ tầng**, mỗi ô
    cửa có **bệ + lanh tô** thò ra xa hơn chính ô kính. Ba mức thò ra bắt buộc theo thứ tự
    `gờ mái (0,075) > chân tường (0,055) > gờ tầng (0,028)` — viết thành assert vì đảo bất kỳ dấu
    nào cũng hỏng trong im lặng. Cửa **vòm** cố ý KHÔNG có lanh tô (cái vòm chính là lanh tô); băng
    ngăn tầng (spandrel) cho tường kính `curtain`/`neon`.
  - **Giá phải trả, đo chứ không đoán**: nhà dân nhỏ 12 → **17 khối** (172 → 232 tam giác); kỷ nặng
    nhất **13.556 → 24.532 tam giác, 23% → 41%** trần. Vẫn còn hơn nửa ngân sách. Xem **ADR-017**
    để biết vì sao chọn hình khối thật thay vì bản đồ pháp tuyến (không đổ bóng thật, lộ ngay khi
    camera xoay — mà camera ở đây xoay được) hay kẻ đường bằng màu (chữa triệu chứng).
  - ⚠️ **PHÉP THỬ NGƯỢC TỰ NÓ HỎNG — suýt cấp giấy chứng nhận giả cho hai bài test.** Để thử ngược
    bài "nhà phải có chân tường", tôi gỡ khối bằng `parts.push(prism({…})) && 0`. `diff` báo 2 dòng
    đổi (đúng luật Phase 7A), test vẫn XANH, và tôi suýt kết luận *"bài test này vô dụng"*. Sự thật:
    `&& 0` chỉ vứt **giá trị trả về** của `push`, khối thì **vẫn được đẩy vào danh sách** — sửa file
    mà không sửa hành vi. Gỡ thật bằng `[].push(…)` thì cả hai bài đỏ ngay. ⇒ Bài học mới ở
    `CLAUDE.md`: **`diff` chứng minh FILE đổi, không chứng minh HÀNH VI đổi.**
  - ⚠️ **Và phép ĐO cũng nói dối một lần nữa (lần thứ 18)**: bảng đếm gờ tầng đầu tiên tìm mảng nhà
    qua `role === 'wall'`, rồi in ra rất thuyết phục rằng *"thành luỹ không có gờ tầng nào ở cả 15
    kỷ"*. Sai: nguyên mẫu phòng thủ khai `role:'stone'`, xưởng khai `role:'wood'` — chúng **tàng
    hình với phép đo** chứ không thiếu gờ. Đo lại đúng: thành luỹ có **15 dải**.
  - **Nhìn ảnh chụp (theo đúng yêu cầu của Đàm)**: cận cảnh kỷ 7 — bệ cửa sổ nay hắt bóng thật, gờ
    mái và gờ tầng đọc ra rõ, tháp chuông có nhịp ngang thay vì một cột trơn. **Nhưng vẫn thành
    thật**: mặt tường vẫn là mảng lớn và **mọi cạnh vẫn sắc như dao** — đó là nguyên nhân gốc (1),
    nằm ở tầng `geometryFactory.js` (three.js) nên tách sang **Phase 8B** để mỗi commit lùi lại
    được độc lập.

- **2026-08-15 (Phase 7D — mặt đường theo thời đại)** — **646 bài test** (640 → 646), lint sạch,
  build xanh. Yêu cầu của Đàm nêu đích danh bốn chặng: *"đất/đá cổ đại, ngõ đá trung cổ, đường công
  nghiệp, đường quy hoạch hiện đại"*.
  - **Audit**: `palette3d.js` có `road: material(48, 0.10, 0.10, 0.68, 0.42)` — **một mã màu cho cả
    15 kỷ**, không đi qua bảng vật liệu nào. Cùng hình dạng sai với `roofColor` trước Phase 6B.
  - **Ngân sách ô lưới đã đầy**: 80 ô đường · 34 ô khu kỳ quan · 30 ô nhà dân = **144/144**. Nên
    bước này KHÔNG thể thêm ngõ nhỏ/lối đi bộ thành ô mới (sẽ ăn vào nhà dân vừa dựng ở 7C) — nó đi
    vào VẬT LIỆU mặt đường, đúng thứ Đàm nêu kèm ví dụ.
  - **Đã làm**: (1) 15 kỷ khai `roadMaterial` + `roadColor`, mỗi giá trị kèm một công trình/vật liệu
    có thật — nhựa đường tự nhiên mỏ Hit ở Con đường Rước thần Babylon · gạch nghiêng + đất đỏ
    laterite làng Bắc Bộ · thanh thạch 青石 Tử Cấm Thành · pietraforte Firenze · pavé granite ngả lam
    Paris · macadam ám bồ hóng Manchester · asphalt gốc dầu mỏ New York · bó vỉa bê tông sáng
    Singapore. (2) Thêm họ vật liệu `dirt` (nhám 0,99). (3) Mặt đường có vật liệu PBR RIÊNG, không
    dùng chung `tileMaterial` với mặt đất — **0 lệnh vẽ thêm**, vì nó vốn đã là `InstancedMesh` riêng.
  - ⚠️ **LỖI GỐC THỨ HAI, tìm ra khi ĐO chứ không khi nhìn — và nó đã chạy thật trên production.**
    Luật *"đường phải nhạt hơn đất để mắt đọc ra lối đi"* được viết thành hằng số tuyệt đối 0,42.
    Phase 3M nâng độ đậm mặt đất ban đêm 0,286 → 0,400 (có lý do đầy đủ, chẳng liên quan gì tới
    đường); mặt đường không tham chiếu mặt đất nên không thể đi theo. Đo cả 15 kỷ: **ban ngày cách
    0,129–0,145 · ban đêm 0,012–0,020**. Nay mặt đường ĐO mặt đất thật rồi tự đặt mình cách ra, giữ
    đúng chiều của vật liệu (đường đất SÁNG hơn nền cỏ, nhựa đường TỐI hơn). Xem **ADR-016**.
  - ⚠️ **BẢN VÁ ĐẦU CỦA CHÍNH PHASE NÀY CŨNG SAI, và cũng chỉ phép đo bắt được**: nó KẸP
    (`|off| < MIN ? ±MIN : off`) nên dồn mọi vật liệu gần mặt đất về đúng ±0,13 ⇒ pavé Paris (0,50)
    và bê tông Singapore (0,63) ra CÙNG một độ đậm (9↔14 chỉ còn 7,3 ngày / 3,7 đêm). Đổi sang phép
    ĐẨY ĐƠN ĐIỆU `sign(off) × (MIN + |off| × SPAN)` thì giữ được cả thứ tự lẫn khoảng cách tối thiểu.
  - ⚠️ **CHỖ RÒ RỈ THỨ BA**: ngõ phố tô bằng `palette.roles.stone` (màu ĐÁ XÂY TƯỜNG) — tức 2/3 số
    ô đường không hề biết `roadColor` tồn tại, kể cả sau khi đại lộ đã sửa xong. Thêm `roadLane`.
  - **Số đo cuối**: khoảng cách đường↔đất tối thiểu **0,131** (mọi kỷ × 6 chặng ngày). 105 cặp kỷ:
    **ban ngày 0 cặp** dưới ngưỡng (gần nhất 12,4 · trung vị 116,4) · **ban đêm 3 cặp** ở 10,3–10,9,
    đều cách nhau ≥3 kỷ → `TECH_DEBT #27` (đo đủ, có chủ đích chưa xử lý — ba lần thử chỉnh mã màu
    đều chỉ ĐỔI CHỖ vấn đề). **Không cặp kỷ LIỀN NHAU nào** dưới ngưỡng ở bất kỳ chặng nào.
  - **Thử ngược 7/7 assert mới đều ĐỎ** (kiểm bằng `diff` xem file có đổi thật không — bài học
    Phase 7A). Tài liệu: `ADR-016`, `CHANGELOG`, `ARCHITECTURE`, `CLAUDE.md` (1 bài học mới),
    `TECH_DEBT #27` + cập nhật header ngưỡng, file này.

- **2026-08-15 (Phase 7C — nhà dân: thành phố có người ở)** — **640 bài test** (625 → 640), lint
  sạch, build xanh. Không đụng state/schema, không migration.
  - **Module thuần mới `src/engine/city3d/dwellings.js`** (+ 8 bài test riêng). 30 ô đất trống trên
    lưới (những ô không phải đường và không thuộc 5 khu đất đã hứa cho kỳ quan), chia **ba khu**
    theo khoảng cách Chebyshev tới tâm: **12 ngoại vi · 12 khu dân cư · 6 trung tâm** — đúng bố cục
    *"ngoại vi → khu dân cư → trung tâm → landmark"* Đàm yêu cầu. Mỗi khu cho phép công năng + cỡ
    nhà riêng (ngoại vi thiên về xưởng/kho, trung tâm thiên về cửa hàng và nhà lớn).
  - **Nhịp: 2 phiên = 1 căn** (Đàm nói *"~50 phút → thêm một nhà dân"*, phiên mặc định 25 phút).
    Nhà mọc **từ trong ra ngoài** và nhà cũ **không bao giờ đổi chỗ** khi thành phố lớn lên — có bài
    test riêng khoá điều đó. Trần mật độ tăng dần theo kỷ (17 → 30 căn).
  - ⚠️ **CHƯA XÂY CÔNG TRÌNH NÀO THÌ CHƯA CÓ NHÀ DÂN.** Công trình đầu tiên là thứ Đàm đổi 4–11
    phiên để có; nếu nó mọc lên giữa một thị trấn có sẵn thì mất trọn ý nghĩa. Cùng luật với đường sá.
  - **Nhà dân đi qua ĐÚNG `buildBuildingSpec`** như công trình thật (**ADR-015**), không có bộ sinh
    riêng — nên nhà dân kỷ 6 TỰ ĐỘNG có mái ngói Bắc Bộ, nhà dân kỷ 14 TỰ ĐỘNG có mặt kính
    Singapore, không cần một dòng dữ liệu mới nào. Ba nguyên mẫu mới `house`/`shop`/`workshop` khai
    cờ **`plain: true`** → tắt chữ ký kiến trúc + mô-típ, để 5 kỳ quan vẫn "nhận ra được từ xa".
    Trục `rarity` dùng lại với nghĩa **cỡ nhà nhỏ/vừa/lớn** (không phải độ quý).
  - ⚠️ **LỖI GỐC 1 — `vernacularRoof`.** Ảnh chụp kỷ 7 cho thấy **25 nhà dân đều đội mái vòm
    terracotta y hệt Duomo**, nên nhà thờ chính toà chìm nghỉm. `style.roof` đang gánh hai việc:
    *"công trình biểu tượng lợp mái gì"* và *"nhà thường lợp mái gì"* — ngoài đời hai câu ấy gần như
    không bao giờ cùng đáp án. Thêm trường `vernacularRoof` **bắt buộc cả 15 kỷ**, 9 kỷ khai khác
    (2·3·4·6·7·9·10·11·15), 6 kỷ khai trùng có chủ đích. Thay mái **ở NGUỒN** qua
    `getVernacularStyle()`, không thay trong `emitRoof` (vì `roofRise` cũng đọc `style.roof`).
  - ⚠️ **LỖI GỐC 2 — `eaveOverhang`.** `eaves` là số TUYỆT ĐỐI, mà `rw = w + eaves × 2`. Trên kỳ
    quan rộng 1,4 thì `eaves` 0,4 là mái hiên sâu rất đẹp; trên nhà dân rộng 0,56 thì nó thò ra
    **71% mỗi bên** và mái rộng **gấp 2,4 lần** cái nhà — một cái ô, không phải mái hiên. Kẹp theo
    tỉ lệ (`EAVE_MAX_RATIO = 0,28`) → rộng nhất còn **1,41 lần**. ⚠️ Phép kẹp này chạm vào
    **115/215 mảng nhà** của 75 công trình đã có (những mảng phụ nhỏ vốn "đội ô" từ lâu) — tức một
    thay đổi mỹ thuật ảnh hưởng cả công trình cũ. KHÔNG phạm ADR-007 (lời hứa ở đó là "cùng `bpId`
    → cùng hình", cấm ngẫu nhiên; Phase 5B đã đổi chiều cao cả 75 công trình theo đúng tinh thần này).
  - **Hai file lá mới `src/engine/hashId.js` + `src/engine/cityGrid.js`** — cắt TẬN GỐC vòng import
    `cityLayout ↔ city3d/dwellings`. Bản đầu tôi né bằng cách CHÉP hằng số sang `dwellings.js` kèm
    một đoạn tự trấn an "đã khoá bằng test đối chiếu"; lý lẽ đó sai vì test đối chiếu chỉ báo được
    khi hai bên ĐÃ lệch, nó không ngăn được việc lệch. `cityLayout.js` TÁI XUẤT, không chép.
  - **Ngân sách**: cảnh nặng nhất (kỷ 7) đi từ ~13.600 lên **21.244 / 60.000** tam giác. Nhà dân vào
    **chung khối hình gộp** với công trình nên **không tốn thêm lệnh vẽ nào**. Nhà dân **không chạm
    được** (`addPickTarget` chỉ cho công trình thật + giàn giáo) — chạm vào một căn nhà vô danh rồi
    hiện bảng rỗng thì tệ hơn là không chạm được.
  - **Nợ mới**: `TECH_DEBT #25` (nhà dân nhỏ nhất ở kỷ 3/6/8 không có cửa sổ — ngưỡng tuyệt đối
    `height < 0.3`, cùng hình dạng sai với `eaves`) và **`#26`** (nhà dân chưa có LOD + cổng hiệu
    năng iPhone vẫn chưa đo lại — **đóng cùng lúc với #23 bằng MỘT ảnh chụp HUD trên máy Đàm**).
  - **Sửa kèm 2 phép đo đã già đi**: `assert.equal(seen.size, 4)` ("4 loại công trình") đỏ khi thêm
    3 nguyên mẫu → đổi thành `Object.keys(ARCHETYPES).length`; và một assert MỚI tôi vừa viết cũng
    dính đúng lỗi đó (`picks.length === 1` trong khi `addPickTarget` vốn được gọi hai lần hợp lệ).
  - **Đã thử ngược 15/15 assert mới** (mỗi lần đều kiểm bằng `diff` xem file có đổi thật không).

- **2026-08-14 (Phase 7B — mặt đất có cao độ: 15 kỷ, 15 vùng đất)** — **625 bài test**, lint sạch,
  build xanh. Không đụng state/schema, không migration.
  - **Module thuần mới `src/engine/city3d/terrain.js`** (+ 10 bài test riêng). Mỗi kỷ một trường cao
    độ **thềm bậc** = `shape` × `terraces` × `relief`, cộng `note` bắt buộc giải thích bằng một nơi
    có thật ở đúng nước của kỷ. 15/15 kỷ ra 15 trường khác nhau; mọi kỷ dùng đủ số bậc mình khai.
  - **`sceneGraph.js` bám đất ở SÁU chỗ** (ô nền · đường · công trình · bệ kè · cảnh vật · cư dân) —
    quên chỗ nào cũng **im lặng hoàn toàn**, nên đã khoá bằng bảng `GROUND_ANCHORS` trong
    `sceneGraphWiring.test.js`; cả 7 assert mới đều đã thử ngược và thấy đỏ.
  - **`orbit.js` bù camera theo ĐƠN VỊ THẾ GIỚI**, không trộn vào `massScale`. Bản đầu viết
    `massScale + terrainMaxHeight / gridSize` — nghe gọn và **sai 4 lần**: đo thật thì 1 đơn vị
    `massScale` ≈ **5 đơn vị thế giới**, nên chia cho cỡ lưới (12) là quy đổi bằng một con số chẳng
    liên quan; kỷ 8 được lùi thêm 0,8 trong khi nhà bị nâng lên 2,4.
  - **Bài `KHÔNG CẮT NGỌN` cũ có tiền đề đã hết đúng** — nó dựa trên mệnh đề *"thứ cao nhất thành
    phố = nóc công trình"*, mà địa hình làm mệnh đề ấy sai (kỷ 5 nâng nền 2,70 đơn vị). Để nguyên
    thì test **vẫn xanh trong khi ảnh bị cắt ngọn** — đúng hình dạng sai của Phase 4D. Đã cộng thêm
    cao độ đất, và thêm một bài **ĐỐI CHỨNG** đòi camera-không-bù PHẢI cắt ngọn (nếu không thì hai
    hằng số `TERRAIN_TO_*` chỉ là số trang trí). Thử ngược: bài đối chứng bắt được cả cách "sửa" sai
    lầm là zoom cả 15 kỷ ra xa.
  - **Bài `KỶ THẤP GIỮ KHUNG SÁT` cũng phải sửa tiền đề**: nó đòi kỷ 1 đứng gần hơn mức sát, nhưng
    kỷ 1 là **Göbekli Tepe — một GÒ ĐẤT cao 1,50 đơn vị**, nên camera lùi thêm là ĐÚNG. Nay đo phần
    `massScale` riêng (trừ phần địa hình bằng chính hằng số đã cộng, không chép lại số).
  - **Đo được**: 6 chặng ngày tụt nhẹ 37,1 → **32,6** (ngưỡng mắt 12, vẫn 0/15 dưới ngưỡng). Biên
    khung theo chiều cao ở kỷ dốc nhất: 30,6° → **22,1°**, vẫn cách mép trên 6,7°.
  - **Đã kiểm `sweep-score` KHÔNG bị 7B làm tệ đi**: chấm bản quét địa hình phẳng ra **đúng cùng ba
    kỷ lệch** (5 · 11 · 14) và cùng lý do từ chối ⇒ `TECH_DEBT #22` vẫn nguyên trạng, không phải hồi
    quy mới. Đây là đo, không phải đoán.
  - **Nợ mới `TECH_DEBT #24`** (Medium-High, chờ Đàm quyết): 14/15 kỷ có công trình bị mép khung
    hình cắt — **có từ Phase 5A**, đã chứng minh bằng đối chứng `--flat`. Công cụ mới
    `scripts/frame-fit.mjs` (có `--selftest` chạm cả hai trục dọc/ngang).
  - ⚠️ **`TECH_DEBT #23` vẫn CHƯA đo** (cổng hiệu năng iPhone sau PBR). Mục đó khuyến nghị đo TRƯỚC
    7B; thực tế 7B chạy trước. Chấp nhận được vì 7B **không thêm lệnh vẽ nào** và ≤ 60 tam giác, nên
    hai thay đổi vẫn tách được — nhưng điều này **hết đúng ở phase tăng mật độ nhà**, chỗ đó phải đo
    trước.

- **2026-08-13 (Phase 4F — quét đủ 15 kỷ × 6 chặng, và CHẤM nó bằng số)** — **551 bài test**, lint
  sạch, build xanh.
  - **Đã quét đủ 90 ô** (`node scripts/city-preview.mjs --sweep --all`) và — quan trọng hơn — **chấm
    được nó bằng số** nhờ công cụ mới `scripts/sweep-score.mjs`. Trước nay bảng quét chỉ được nhìn
    bằng mắt, mà mắt chỉ so được các ô KỀ NHAU; đúng vì thế mà hai lỗi nặng nhất trong lịch sử dự án
    đều là hai ô nằm ở HAI ĐẦU bảng.
  - **KẾT QUẢ**: **15/15 cặp chặng ngày ĐẠT** (cặp gần nhất 32,8 — công của Phase 3Y vẫn giữ vững),
    nhưng **2/105 cặp kỷ KHÔNG đạt**: kỷ 5 ↔ kỷ 12 = **9,5** và kỷ 4 ↔ kỷ 10 = **10,2** (ngưỡng mắt
    12; cặp gần thứ ba đã là 13,4; trung vị 44,6). Ổn định qua hai cỡ ô 260 và 300 ⇒ không phải nhiễu.
  - **Điều bất ngờ đáng ghi**: bảng màu GỐC của hai cặp đó **không hề gần nhau** (kỷ 5 ↔ 12 cách 140,
    kỷ 4 ↔ 10 cách 100), trong khi cặp gần nhau NHẤT trong bảng gốc (kỷ 6 ↔ 7, cách 43,5) lại render
    ra ĐẠT. ⇒ chính đường ống render nén hai cặp này, và nén không đều — nên **một bài test trên
    bảng màu không thể bắt được lỗi này**, chỉ phép đo trên ảnh thật mới bắt được.
  - **CỐ Ý CHƯA SỬA** → ghi thành **`TECH_DEBT` #19**. Lý do: `palette3d.js` đã qua 5 đợt vá mỹ
    thuật, và chính sổ nợ đặt luật "đợt thứ 6 phải là một đợt RÀ SOÁT toàn bộ phép trộn màu, không
    vá điểm". Sửa nhanh hai kỷ ở đây đúng là cái bị cấm. ⚠️ Cũng **đừng chữa bằng cách đổi
    `accentColor`** — màu đó là bản sắc kỷ dùng khắp app và đang đúng về ý nghĩa.
  - **Đính chính `TECH_DEBT` #18**: dòng "0/105 ✅" của nó chỉ đúng với phép đo lúc đó, không phải
    lời bảo đảm chung — vì nó **không ghi lại công cụ đã đo**. Việc #18 tuyên bố đã làm thì vẫn đứng.
  - **Đóng nốt rủi ro tự khai của Phase 4E**: nút chính trang chủ từng bị hạ xuống `compactMobile`
    (chữ 10px — bộ dành cho hàng 4–5 nút lúc phiên đang chạy). Thêm `size="compactPrimary"` đúng cho
    hàng 2 nút lúc chưa bắt đầu: đo lại **13px, đệm 12px, không tràn**, và kiểm bằng ảnh.
- **2026-08-13 (Phase 4E — UI/UX, đo bằng số)** — **BỐN CHỖ CHỮ HIỆN SAI TRÊN MÀN HÌNH, VÀ BỐN KIỂU
  NÓI DỐI MỚI CỦA CHÍNH CÔNG CỤ ĐO.** **551 bài test** (+3), lint sạch, build xanh.
  - **Vì sao làm**: sau Phase 4D (cơ chế game), phần còn thiếu của lời Đàm dặn là **UX/UI + đánh
    bóng**. Cách làm ở đây là soi bằng SỐ chứ không bằng cảm nhận: quét cả 7 màn hình × 2 bề ngang
    (390px điện thoại thật, 1280px máy bàn), rồi kiểm lại từng phát hiện bằng ảnh chụp cắt sát.
  - **Lỗi 1 — Xưởng in ra "-4/2 phiên" (số âm).** Gốc: `cityLayout.js` và `BuildingWorkshop.jsx`
    mỗi nơi TỰ chia lại tiến độ, lại tra **hai bảng khác nhau** (`BUILDING_EFFECTS` vs
    `BLUEPRINT_META`) và không kẹp biên. ⇒ Tách `src/engine/craftProgress.js` (`describeCraftProgress`,
    6 bài test) làm **công thức duy nhất**, hai nơi cùng gọi. Nay in `0/2 phiên`. Đây đúng luật
    **"một luật chỉ được có một công thức"** đã ghi ở `CLAUDE.md`.
  - **Lỗi 2 — nút chính trang chủ bị xén chữ ở 390px, và bản vá đầu KHÔNG HỀ ăn thua.** Truyền
    `px-2.5 text-[11px]` qua `className` của `ActionButton` rồi đo thấy "sạch" nên tôi tin. Hỏi
    thẳng trình duyệt thì nút vẫn chạy **font 18px + padding 28px** — `px-7 text-lg` trong
    `sizeMap.default` THẮNG, vì Tailwind xếp theo thứ tự BẢNG KIỂU chứ không theo thứ tự viết, mà
    dự án không có `tailwind-merge`. Sửa đúng: dùng `size="compactMobile"` component đã có sẵn
    (cũng cho chữ xuống dòng ở khung hẹp). Cùng lỗi ở nút "Full Screen". Khoá lại bằng
    `src/components/actionButtonSizing.test.js` — 3 bài đọc mã nguồn, **cả 3 đã thử-cho-đỏ**.
  - **Lỗi 3 — bốn thẻ preset cắt mô tả** ("Vào việc …", "Nhịp hằng …"). Đo: thẻ chỉ rộng ~131px ở
    390px và ~130px ở 1280px (nó nằm trong bảng "Thời lượng countdown" hẹp), chừa cho mô tả 60–65px
    trong khi chữ cần 77–79px. ⚠️ Đã thử vá bằng breakpoint `sm:` và **sai**: `sm:` hỏi bề ngang
    MÀN HÌNH, còn thứ quyết định ở đây là bề ngang CỦA THẺ — máy bàn lại cho thẻ HẸP HƠN điện thoại.
    ⇒ xếp dọc ở mọi bề ngang.
  - **Lỗi 4 — tên hợp lực ở tab Kỹ năng bị cắt** ("Bậc Thầy…"): 74px chỗ trống, tên cần 131px. Tên
    riêng thì cho **xuống 2 dòng**, không cắt bằng dấu "…".
  - **Công cụ `scripts/shot.mjs` — 4 kiểu nói dối mới, đều đã vá** (chi tiết ở chú thích đầu file
    và ở `CLAUDE.md`): (5) lớp trang trí `position:absolute` của framer-motion bị tính thành "chữ
    tràn" (nút "Pomo" báo thừa 31px — suýt ghi thành một mục nợ kỹ thuật ma); (6) cổng "app đã mọc
    ra chưa" chỉ vá cho `--fit`, và bản "đợi DOM đứng yên" bị vỏ HTML tĩnh lừa (28 phần tử, 0 nút,
    "ổn định" hoàn hảo lúc React chưa chạy); (7) băng cuộn ngang bị đếm là "bị xén" (7 báo động giả
    ở thanh chuyển kỷ + dải tab Thống kê); (8) cổng yếu ⇒ đo TRƯỚC khi web font về ⇒ số đo chữ sai.
    Thêm 2 cờ: `--el "<chữ>"` (in font-size/padding/overflow THẬT của một phần tử — chính nó vạch
    ra lỗi 2) và `--crop "@<chữ>"`/`--crop "x,y,w,h"` (cắt vùng, khỏi đọc ảnh dài 3000px).
  - **Kết quả quét cuối**: cả 7 màn hình × 2 bề ngang đều sạch (`✓ … không nút nào có chữ tràn hoặc
    bị xén`), và 4 chỗ trên đã kiểm lại bằng ảnh chụp thật.
  - **Không đổi**: state, schema, cân bằng game, luồng đồng bộ ⇒ **không có migration**. TECH_DEBT
    không có mục mới (hai thứ định ghi thì một cái đã sửa, một cái là báo động giả của công cụ).

- **2026-08-13 (Phase 4D — thành phố)** — **"DI SẢN DANG DỞ": CÔNG TRÌNH XÂY DỞ CỦA KỶ CŨ KHÔNG CÒN
  BỐC HƠI KHI LÊN KỶ.** **542 bài test**, lint sạch, build xanh.
  - **Vì sao làm**: đây là cơ chế **Đàm tự chọn** khi được hỏi ("Cho xây tiếp công trình kỷ cũ").
    Sau khi Phase 4B gắn ngôi sao "trọn vẹn kỷ", luật cũ (`pruneEraScopedBlueprintState` cắt sạch
    `craftingQueue` của kỷ cũ) không còn trung lập nữa — nó dạy đúng một bài học: **đừng bao giờ
    khởi công khi sắp lên kỷ**. Tức app tự thưởng cho việc NGỪNG làm việc, ở đúng đoạn Đàm đang chạy
    tốt nhất. Đó là phản-mục-tiêu của cả sản phẩm.
  - **Cách làm** (`src/engine/eraLegacy.js`, MỚI, thuần, 10 bài test): hàng đợi được
    `splitCraftingQueue` tách làm hai — mục của kỷ hiện tại và mục của kỷ ĐÃ QUA. **Cả hai đều được
    giữ, cả hai đều xây tiếp.** Khác biệt nằm ở lúc HOÀN THÀNH: `pickLegacyCompletions` lọc ra thứ
    thuộc kỷ cũ, và chúng được ghi bổ sung vào `cityArchive` (`mergeCityArchive` với
    `sealedAt: null`) **thay vì** vào `buildings`.
  - ⚠️ **KHÔNG ĐỔI MỘT ĐƠN VỊ CÂN BẰNG NÀO** — đây là điều kiện để không phải hỏi Đàm: di sản hoàn
    thành không vào `buildings` ⇒ không perk `BUILDING_EFFECTS`, không tài nguyên, không EP thêm.
    Phần thưởng thuần tuý là LỊCH SỬ: `4/5` nhích lên `5/5`, ngôi sao sáng lên. Và **không khởi công
    mới được** ở kỷ cũ — cửa vẫn đóng, chỉ những gì đã bắt đầu mới được đi hết. Nên cơ chế này bị
    chặn trên và giảm dần một chiều, không thể khai thác.
  - ⚠️ **DI SẢN KHÔNG CHIẾM Ô HÀNG ĐỢI** (`countActiveCrafting` chỉ đếm kỷ hiện tại): một phần
    thưởng thuần lịch sử mà lại khoá mất 1 trong 2 ô xây dựng thì nó thành cái BẪY, và người chơi
    vẫn học đúng bài học sai mà tính năng này sinh ra để xoá.
  - ⚠️ **TÔI ĐÃ VIẾT MỘT CHÚ THÍCH SAI, VÀ CHỈ PHÁT HIỆN VÌ THỬ NGƯỢC BÀI TEST.** Chú thích đầu
    tiên (ở `eraLegacy.js` + `eraLegacy.test.js` + tài liệu) khẳng định: chấm theo kỷ TRƯỚC phiên
    thì công trình vừa xong **mất trắng**. Nghe cực kỳ xuôi tai — và **sai**. Thử ngược thật (sửa
    `finalBook` thành kỷ trước phiên rồi chạy `gameStore.eraLegacy.test.js`) thì bài đó **VẪN
    XANH**: ở ca lên kỷ, `pruneEraScopedBlueprintState` được gọi kèm `sealContext`, nên chính lần
    **NIÊM PHONG** đã ghi công trình vừa xong vào `cityArchive[7]` — nó tới bảo tàng bằng đường
    khác. Gỡ riêng đường di sản: vẫn xanh. Gỡ riêng niêm phong: vẫn xanh. **Gỡ CẢ HAI mới đỏ.**
    ⇒ Đây là **hai lưới ĐỘC LẬP** che cùng một ca. Giá trị thật của `finalBook` không phải "cứu dữ
    liệu" mà là làm tầng di sản **TỰ ĐỦ** — không âm thầm dựa vào việc lần niêm phong có quét trúng
    công trình đó hay không. Ca mà tầng di sản là lưới DUY NHẤT: công trình kỷ cũ xây xong ở một
    phiên **không** lên kỷ (bài test đó đã thử ngược ra ĐỎ).
    ⇒ **Bài học**: *một bài test xanh không cho biết có BAO NHIÊU thứ đang giữ nó xanh.* Chỉ thử
    ngược mới đếm được. Và cùng họ với bài học "cơ chế nghe hợp lý vẫn phải ĐO rồi mới được viết
    ra" ở Phase 3Y — lần đó là sương mù, lần này là kỷ nguyên; cả hai lần **kết quả đúng nhưng lời
    giải thích sai**, và lời giải thích sai mới là thứ phiên sau kế thừa. Đã sửa lại cả 5 chỗ.
  - **Nới bất biến ADR-007** từ *"bảo tàng bất động"* thành **"bảo tàng không xê dịch"** (ADR-011).
    Không phải nới bừa: bất biến gốc mua đúng một thứ — *nhà xây sau không đẩy nhà xây trước đi chỗ
    khác* — mà `computeCityLayout` đặt nhà theo **khu đất cố định suy từ thứ hạng bản vẽ**, nên thêm
    một căn không thể xê dịch căn nào. Vế bị nới và vế được bảo vệ là hai vế khác nhau.
  - ⚠️ **HAI LỖI BẮT ĐƯỢC BẰNG MẮT, CÙNG MỘT HỌ — và không có gì đỏ lên cả.** Cả hai đều là **gác
    thừa bằng `isCurrent`**, một cái luật đúng cho tới Phase 4D thì hết đúng:
    (a) bảng sưu tập ghi **"chưa xây"** cho `Thư Viện Khoa Học` trong khi cảnh 3D đang dựng giàn
    giáo của chính nó **ngay bên trên** — hai chỗ trên cùng một màn hình nói ngược nhau
    (`withEraCompletion` chặn `pending` lại ở kỷ hiện tại);
    (b) thanh chuyển kỷ vẽ **"Kỷ 7 · 4/5"** đứng chết vĩnh viễn **giống hệt** "Kỷ 7 · 4/5 còn cách
    ngôi sao ba phiên" — mà "kỷ nào còn đáng quay lại" đúng là câu hỏi cả thanh đó sinh ra để trả
    lời. Nay thành `Kỷ 7 · 4/5 · đang xây`, phân biệt hẳn với `Kỷ 4 · 4/5` (đã đóng vĩnh viễn).
    ⇒ **Bài học**: khi một luật mới làm cho điều kiện cũ hết đúng, phải đi TÌM MỌI CHỖ phát biểu lại
    điều kiện ấy, không chỉ chỗ đầu tiên nghĩ ra. Cùng họ với "một luật chỉ được có một công thức".
  - **Khoá lại bằng test (+16 bài)**: `eraLegacy.test.js` (10, tầng thuần) ·
    **`gameStore.eraLegacy.test.js` (5, MỚI — chạy THẬT qua `completeFocusSession`)** ·
    `cityCompletion.test.js` (+1: kỷ đã niêm phong vẫn nhận trạng thái "đang xây") ·
    `cityArchive.test.js` (+1: ghi bổ sung KHÔNG được ghi đè `sealedAt`/`epAtSeal`/`sessionCount`) ·
    `cityRenderers.test.js` (+1: đọc mã nguồn, cấm gác nhãn "đang xây" bằng mỗi `isCurrent`).
    **Mọi phép canh mới đều đã thử ngược và thấy ĐỎ trước khi tin** — và chính việc thử ngược là
    thứ lộ ra chú thích sai ở gạch đầu dòng trên.
  - ⚠️ **Một bất biến ngầm được ghi ra thành chữ**: thứ tự `[...activeQueue, ...legacyQueue]` trong
    `pruneEraScopedBlueprintState` là CÓ TẢI TRỌNG — đặc quyền `craft_haste_first` tăng tốc đúng
    `index === 0`, nên xếp di sản lên đầu sẽ chuyển một đặc quyền của kỷ hiện tại sang thúc một công
    trình chỉ có giá trị lịch sử (cân bằng đổi thật). Đã có test hành vi khoá, đã thử ngược ra đỏ.
  - **Công cụ**: `scripts/shot.mjs` thêm `--click "<nhãn>"` (lặp được) để chụp đúng một kỷ trong bảo
    tàng. ⚠️ Nhãn phải lấy y nguyên chuỗi mà chính công cụ in ra khi báo lỗi — `textContent` gộp
    khoảng trắng nên là `"Kỷ 7· 4/5· đang xây"`, không phải chuỗi nhìn thấy trên màn hình.
    ⚠️ `shot.mjs` phục vụ thư mục `dist/` và **KHÔNG tự build** — sửa mã xong phải `npm run build`
    rồi mới chụp, nếu không sẽ soi nhầm bản cũ và kết luận "chưa sửa được".

- **2026-08-13 (Phase 4C — thành phố)** — **QUÉT LẠI 15 KỶ × 6 CHẶNG, VÀ CON SỐ "0/105" TRONG TÀI
  LIỆU HOÁ RA LÀ SỐ CỦA VÙNG TỐI.** **524 bài test.**
  - **Bối cảnh**: quét lại đủ 15 kỷ × 6 chặng để kiểm mọi thay đổi đồ hoạ gần đây. Chặng ngày vẫn
    khoẻ (cặp gần nhất 8h ↔ 12h = 29,5/255, 0/15 cặp dưới ngưỡng). Nhưng bảng "màu mái đo được"
    in ra **`#010e0a`, `#05041a`… gần như ĐEN ở giữa TRƯA** — một con số gây bất ngờ, mà luật của
    dự án là *số đo nào gây bất ngờ thì kiểm CÔNG CỤ trước*.
  - ⚠️ **LẦN THỨ 13 CÔNG CỤ DEV NÓI DỐI — và nó nằm ngay trong bản vá của lần thứ 11.** Bộ lọc
    "8% pixel tươi nhất" dùng `sat = (max−min)/max` — độ tươi TƯƠNG ĐỐI, mẫu số là `max`, nên pixel
    càng TỐI càng dễ thắng (`#010e0a` ra sat 0,93). Bộ lọc "lấy mái" thật ra lấy **mặt mái khuất
    trong bóng**. ⇒ Con số **"0/105 · gần nhất 12,6 · trung vị 28,2"** đã ghi vào `CLAUDE.md` là số
    của VÙNG TỐI, **SAI**. Đã sửa lại tài liệu.
  - ⚠️ **VÌ SAO `--selftest` KHÔNG BẮT ĐƯỢC** (bài học đáng giữ hơn con số): phép tự kiểm chỉ hỏi
    "bỏ bộ lọc thì số có tụt không". Số CÓ tụt nên nó xanh. **Một phép tự kiểm chứng minh bộ lọc CÓ
    tác dụng, không chứng minh nó có tác dụng ĐÚNG.** Bản mới in kèm **độ sáng** của màu đo được —
    15 con số quanh 20–60 giữa trưa là báo động không thể lướt qua.
  - **Sự thật sau khi đo đúng (chroma tuyệt đối `max−min`)**: **3/105 cặp dưới ngưỡng mắt** —
    kỷ 5↔12 = 7,2 · kỷ 3↔12 = 10,1 · kỷ 5↔7 = 11,1. Nguyên nhân: kỷ 5 (`#94a3b8`) và kỷ 12
    (`#64748b`) là hai kỷ xám-lam độ tươi rất thấp (s = 0,20 và 0,16); giữa trưa, nắng ấm + ánh
    phản từ cỏ **rửa trôi hết phần lam** và cả hai ra cùng một mảng olive.
  - **Sửa**: nâng hệ số nền độ tươi mái `0,30 → 0,52` trong `eraRoof` (`palette3d.js`). ⚠️ Đây
    KHÔNG phải nới hằng số cho vừa ý: **13/15 kỷ đã chạm trần 0,62 từ trước**, nên thay đổi này chỉ
    chạm tới đúng 3 kỷ (5, 12, và 14 nhích lên đúng cùng trần với 12 kỷ kia). Thành phố KHÔNG tươi
    hơn — chỉ hai kỷ bị bỏ rơi ở đáy được kéo lên ngang hàng.
  - **Kết quả đo lại trên ảnh chụp thật**: **0/105 cặp dưới ngưỡng** · cặp gần nhất 7,2 → **14,1** ·
    trung vị 28,2 → **39,6**. Cả 90 ô của bản quét phân biệt được.
  - ⚠️ **PHÁT HIỆN SÂU HƠN — hai tầng đo kêu HAI TẬP CẶP RỜI NHAU HOÀN TOÀN.** `palette3d.test.js`
    kêu kỷ 8↔13 · 6↔7 · 1↔14; đo trên ảnh thì cả ba đều **≥19** (mắt thấy khác rõ). Ngược lại ba
    cặp thật sự trùng trên màn hình thì bài test **không hề kêu**. Tức con số ở tầng bảng màu vừa
    BÁO NHẦM vừa BỎ SÓT. Ngưỡng 12 vốn là ngưỡng mắt trên ĐIỂM ẢNH ĐÃ DỰNG — đem áp thẳng vào bảng
    màu chính là lỗi "một luật hai công thức". Đã ghi rõ vào bài test + `CLAUDE.md`.
  - **Đổi lại cho việc nới số đếm 2 → 3 ở bài test tầng thuần**: thêm một phép canh **PHÂN BỐ**
    (trung vị ≥ 34, đang chạy 46,2) — thứ bài đó chưa từng có. Phép đếm đuôi vẫn xanh khi cả 105
    cặp cùng tụt sát ngưỡng; trung vị thì bắt được kiểu sập từ từ ấy. Đã thử ngược và thấy đỏ.

- **2026-08-13 (Phase 4B — thành phố)** — **TRỌN VẸN KỶ: mỗi kỷ có 5 công trình, và giờ Đàm nhìn
  thấy con số 5 đó.** Đây là phần "game hoá" + "UX/UI" của lệnh `/goal`. **524 bài test.**
  - **Vấn đề**: mỗi kỷ có đúng 5 bản vẽ (2 common + 2 rare + 1 epic, đều 15/15 kỷ), nhưng **cả app
    không chỗ nào nói ra con số 5**. Màn Thành Phố hiện "Công trình: 3", thanh chuyển kỷ hiện
    "Kỷ 3 · 2". Ba trên mấy? Không ai biết, kể cả Đàm. **Một con số không có mẫu số thì không phải
    mục tiêu** — nó không bảo được anh còn phải làm gì, nên chẳng có lý do gì để làm thêm phiên nữa
    ngoài thói quen. Và vì kỷ cũ niêm phong VĨNH VIỄN (ADR-007), cái mẫu số ấy còn tạo ra thứ bảo
    tàng đang thiếu: **một điểm số không sửa lại được**.
  - **Đã làm**: `src/engine/cityCompletion.js` (MỚI, thuần, +13 bài test) — `listEraBlueprints` ·
    `summarizeEraCompletion` (3 trạng thái ô: đã xây / đang xây / chưa xây) · `withEraCompletion`
    (ghép state sống vào danh sách kỷ) · `summarizeMuseum`. Giao diện: thanh chuyển kỷ hiện `3/5`
    và gắn **★** cho kỷ trọn vẹn; ô thống kê "Công trình" có mẫu số; **danh sách công trình đổi
    thành bảng sưu tập đủ 5 ô** (ô chưa xây để mờ, vẫn giữ biểu tượng như một cái bóng của thứ sắp
    tới); ô thống kê thứ tư nay hiện **dân số**.
  - ⚠️ **KHÔNG lưu một byte nào**: mọi con số suy ra từ `BLUEPRINT_CATALOG` + danh sách công trình,
    đúng nguyên tắc đã dùng cho cảnh vật và cư dân. Không đụng state, không đụng schema, không đụng
    cân bằng game.
  - ⚠️ **MẪU SỐ TỰ ĐẾM TỪ CATALOG, KHÔNG VIẾT CỨNG SỐ 5** — có bài test khoá riêng. Viết cứng là
    gài mìn: ngày nào một kỷ có bản vẽ thứ 6, màn hình sẽ gắn sao "trọn vẹn" cho một thành phố còn
    thiếu nhà, và **không có gì đỏ lên cả**.
  - ⚠️ **HAI LỖI CHỈ SOI BẰNG MẮT MỚI RA** (build xanh, lint sạch, test xanh ở cả hai):
    1. Ô thống kê "Đang xây: N" TRÙNG khít với thẻ "Đang xây" ngay bên dưới (cùng điều kiện hiện,
       mà thẻ nói đủ tên + còn mấy phiên + mở khoá gì). Tệ hơn: vì công trường gần như LÚC NÀO cũng
       có, cái ô đổi-nghĩa ấy khiến dân số **vĩnh viễn vô hình**. → bỏ ô thừa, luôn hiện dân số.
    2. **Ngôi sao tô bằng màu kỷ gần như tàng hình ở theme sáng.** Đo tương phản
       `ERA_METADATA.accentColor` trên nền thẻ: kỷ 9 `#a3e635` = **1,49:1**, kỷ 3 `#facc15` = 1,51:1
       (ngưỡng ký hiệu là 3:1). `--accent` đo được 2,97–7,43:1 qua cả 8 tổ hợp theme × skin → đổi
       sang `--accent`, khoá bằng bài test ở `cityRenderers.test.js` (đã thử ngược và thấy đỏ).
       ⇒ **Bài học**: cái chấm tròn màu kỷ bên cạnh vẫn giữ màu kỷ, và đó KHÔNG phải thiếu nhất
       quán — nó là trang trí thuần (số kỷ ghi ngay cạnh), còn ngôi sao thì MANG THÔNG TIN. Ngưỡng
       tương phản áp cho thứ mang thông tin, không áp cho thứ trang trí.
  - ⚠️ **LẦN THỨ 12 CÔNG CỤ DEV NÓI DỐI** — `scripts/make-fixture.mjs` có `notBuilt.length > 1` với
    lý do chính đáng ("chừa một bản vẽ để còn `craftingQueue` mà soi giàn giáo"), nhưng nó áp cho
    MỌI kỷ, kể cả kỷ đã niêm phong nơi chẳng còn ai đang xây gì. Hệ quả: **không kỷ nào có thể đạt
    5/5**, cả bảo tàng ra một dãy "4/5" giống hệt nhau, và trạng thái "trọn vẹn" gần như không tồn
    tại để mà nhìn thấy. Đúng bài học "một trade-off chỉ có thật khi cả hai vế đều đã đạt": vế thứ
    hai không hề cần cái giá đó. → nay chỉ chừa chỗ cho giàn giáo ở kỷ ĐANG chơi, một lần ở cuối.
  - **Đã soi bằng mắt** 5 trạng thái: máy bàn sáng · máy bàn tối 22h · iPhone 390px THẬT (không
    tràn ngang) · kỷ trọn vẹn 5/5 · kỷ mới toanh 0/5. Màn "bãi đất trống" thôi là ngõ cụt — nó liệt
    kê sẵn 5 thứ sắp mọc lên ở đó.

- **2026-08-13 (Phase 4A — thành phố)** — **BA KỶ CUỐI CÙNG CŨNG CÓ MÁI MANG MÀU CỦA CHÚNG.**
  `TECH_DEBT` #18 mở và ĐÓNG trong cùng ngày. **510 bài test.**
  - **Vấn đề**: kỷ 12/13/14 đều `roof: 'flat'`, mà nhánh `'flat'` trong `buildingSpec.js` đẩy ĐÚNG
    MỘT khối với vai `trim` — vai TRUNG TÍNH thuộc họ tường (chỉ ngấm 0,18 sắc kỷ). Tức ba kỷ ấy
    **chưa bao giờ hiện lấy một milimét vuông vai `roof` nào**. Trên bản quét, ba hàng ấy là ba
    hàng nhà trắng-xám giống hệt nhau.
  - ⚠️ **VÌ SAO CẢ MỘT TẦNG TEST BẢNG MÀU DÀY THẾ VẪN XANH — bài học đáng giữ nhất của phase này.**
    Bài "15 kỷ phải ra 15 màu mái" đo **MÀU TRONG BẢNG**; nó không hỏi màu ấy có được đem **VẼ RA**
    hay không. Hai câu hỏi khác nhau, và khoảng trống giữa chúng đủ chỗ cho ba kỷ nằm lọt. ⇒ Luật:
    **một bài test về BẢNG MÀU không bao giờ thay thế được một bài test về việc màu đó có xuất hiện
    trong HÌNH HỌC hay không.** Cùng họ với bài học "bảng màu ≠ màu trên màn hình", nhưng ở một
    tầng còn sớm hơn: lần này màu thậm chí không có bề mặt nào để bắt đầu hành trình tới màn hình.
  - **Sửa**: giữ nguyên gờ chắn mái trung tính ở vành ngoài (bê tông/đá ốp — có thật), thêm một
    **tấm phủ hẹp hơn (0,94) mang vai `roof`** nằm trong lòng nó. Đúng cấu tạo mái bằng ngoài đời:
    diềm parapet một vật liệu, sàn mái chống thấm một vật liệu khác. Nhìn từ góc camera chúc xuống
    thì sàn mái là mảng rất to. ⚠️ Tấm phủ PHẢI hẹp hơn gờ — bằng hoặc rộng hơn thì nó nuốt mất gờ
    và khối lại trông như bị cắt cụt, đúng cái bệnh mà gờ chắn mái sinh ra để chữa.
  - **Kết quả đo** (105 cặp kỷ, dải thành phố, trung bình 6 chặng):
    | | đầu phiên | sau `eraRoof` 0,55 | sau tấm phủ |
    |---|---|---|---|
    | cặp DƯỚI ngưỡng mắt | 5/105 | 4/105 | **0/105** |
    | cặp gần nhau nhất | 6,0 | 6,0 | **12,6** |
    ⇒ Cộng với 15/15 cặp chặng ngày (nhỏ nhất 29,5): **cả 90 ô của bản quét không còn ô nào trùng
    ô nào.** Đây là câu trả lời đo được cho "không bị chán" trên CẢ HAI trục — thời gian trong ngày
    và tiến trình 15 kỷ.
  - **Bài test khoá lại**: mọi bản vẽ × mọi kỷ × cả 3 cấp phải có ít nhất một phần mang vai `roof`,
    cộng một bài riêng cho các kỷ mái bằng. Thử ngược (gỡ tấm phủ) ⇒ **đỏ, gọi đích danh kỷ 12**.
  - **Không đụng**: state, cân bằng game, SQL, schema.

- **2026-08-13 (Phase 3Z — thành phố)** — **15 KỶ: BỚT ĐƯỢC BA CẶP TRÔNG GIỐNG HỆT NHAU.**
  - **Vấn đề, tìm ra bằng đúng bài học của Phase 3Y**: vừa sửa xong "6 chặng ngày phải khác nhau"
    bằng cách duyệt đủ mọi cặp, em quay sang hỏi cùng câu đó cho 15 KỶ — và thấy mình đang chấm
    chúng bằng một ĐỘ LỆCH CHUẨN ("tản sắc giữa 15 kỷ"). Số gộp thì giấu được: duyệt đủ **105 cặp**
    ra **5 cặp** mái gần như cùng màu, gần nhất là kỷ 5 ↔ 12 = 8,4.
  - **Nguyên nhân**: `ERA_METADATA` có hai kỷ gần như cùng sắc — kỷ 5 `#94a3b8` và kỷ 12 `#64748b`,
    **cùng góc màu 215°**, chỉ khác độ sáng (0,65 vs 0,47). `eraRoof` nén chênh lệch đó lại còn
    **0,22 lần** ⇒ trên mái chỉ còn 0,04, mắt không thấy. Nâng lên 0,55 ⇒ **5 cặp → 2 cặp**. Không
    phải nới hằng số cho vừa ý: đúng với chính lý do `roof` dùng `eraRoof` thay `material` —
    *"mái phải dùng CẢ màu kỷ"*, mà độ sáng cũng là một phần của màu.
  - **Bắt thêm một lỗi CÙNG HỌ với lỗi đã sửa buổi sáng**: `eraRoof` chặn mái-tím-rực bằng **cửa sổ
    góc màu** (255°–340°), còn bài test định nghĩa dải tím bằng **quan hệ kênh** (đỏ và lam đều cao
    hơn lục). Một luật, hai công thức ⇒ có khe, và khe đó cắn thật: mái kỷ 15 ở **247°** lọt ra
    ngoài cửa sổ nên không bị hạ tươi, ra `#4b40a3` tươi 0,44 (trần 0,42). Nay hai bên dùng chung
    đúng một phép thử. ⇒ **Đây là lần thứ HAI trong một ngày cùng một hình dạng sai** (lần đầu:
    `horizonHue < 60` vs hàm `warm()` quấn vòng). Đáng thành luật: *một luật chỉ được có MỘT công
    thức; thấy hai chỗ cùng phát biểu một luật thì gộp lại ngay, đừng chờ nó cắn.*
  - **Bài test mạnh thêm**: bài "15 kỷ phải ra 15 màu" vốn chỉ canh cặp GẦN NHẤT — lại là một số
    gộp, và nó đứng yên dù có 1 cặp hay 5 cặp sát nhau. Nay canh cả SỐ LƯỢNG cặp dưới ngưỡng (≤2).
    Đã thử ngược với hệ số cũ: **báo đỏ, gọi tên đủ cả 5 cặp**.
  - ⚠️ **VÀ MỘT LẦN NỮA PHẢI NGHI NGỜ CHÍNH CÔNG CỤ ĐO (lần thứ 11).** Phép đo đầu tiên của em lấy
    TRUNG BÌNH cả dải thành phố và kết luận **"70/105 cặp kỷ trùng nhau"** — nghe khủng khiếp, và
    SAI. Mái chỉ chiếm khoảng một phần mười diện tích dải đó; phần còn lại là mặt đất và trời lọt
    giữa các khối, giống hệt nhau ở mọi kỷ ⇒ tín hiệu bị pha loãng ~10 lần. Lọc lấy 8% pixel tươi
    nhất (tức mái) thì con số thật là **5/105**. Đã cắm `--selftest` (bỏ bộ lọc ⇒ phải quay về kết
    quả pha loãng 67/105) để chứng minh công cụ đang thật sự lọc. Bằng chứng độc lập giúp em nghi
    ngờ đúng chỗ: tầng thuần đã có sẵn bài duyệt 105 cặp màu mái, và nó báo cặp gần nhất 8,4 —
    mâu thuẫn hẳn với "70 cặp trùng". **Hai phép đo cãi nhau thì phải truy tới cùng, không được
    chọn cái nào nghe hợp ý.**
  - **Còn lại → `TECH_DEBT` #18 (mở mới)**: kỷ 12–14 là khối hộp hiện đại **mái bằng**, gần như
    không có diện tích mái để sắc kỷ nói ra. Nên dù màu mái ở tầng thuần đã tách bạch, trên ảnh ba
    kỷ này vẫn na ná nhau (12↔13 = 6,4). Đây là vấn đề **HÌNH KHỐI, không phải màu** — sửa bằng
    cách cho kiến trúc hiện đại một bề mặt khác mang sắc kỷ (diềm/mặt kính tầng trên). ⚠️ KHÔNG
    sửa bằng cách đổi `accentColor` trong `ERA_METADATA`: những màu đó còn dùng cho huy hiệu kỷ
    khắp giao diện, đổi là đổi cả app — **đó** mới thật sự là việc cần Đàm quyết.
  - **Không đụng**: state, cân bằng game, SQL, schema. 509 test xanh, lint sạch, build xanh.

- **2026-08-13 (Phase 3Y — thành phố)** — **SÁU CHẶNG NGÀY, SÁU BỨC TRANH: BÌNH MINH THÔI TRÙNG
  KHÍT HOÀNG HÔN.** (`TECH_DEBT` #17 ĐÓNG. 505 → **509 bài test**, lint sạch, build xanh.)
  - **Vấn đề, và nó chỉ lộ ra khi đổi phép đo**: bản quét 15 kỷ × 6 chặng trước đó được chấm bằng
    GÓC MÀU của dải trời. Chấm lại bằng phép đo CẢ CẢNH (vector 9 chiều: dải trời + dải thành phố +
    dải đất, mỗi dải 3 kênh, trung bình 15 kỷ) thì ra con số này: **bình minh ↔ hoàng hôn = 5,9/255**,
    trong khi ngưỡng mắt phân biệt được là ~12 và mọi cặp khác đều ≥33. Tức trong sáu chặng ngày thì
    **có hai chặng là cùng một bức ảnh** — mở app lúc 6 giờ sáng hay 6 giờ chiều cũng vậy.
  - **Vì sao không bài test nào bắt được**: bài *"hai chặng liền nhau không được giống nhau"* duyệt
    `DAY_PHASES` **theo thứ tự**, tức chỉ các cặp KỀ NHAU. `dawn` ở đầu, `dusk` ở cuối ⇒ không bao
    giờ được đem so với nhau. **Lần thứ HAI cùng hình dạng sai này xuất hiện trong chính file test
    đó.** ⇒ Luật nay đã thành mã: *bất biến kiểu "các thứ này phải khác nhau" phải duyệt TỔ HỢP ĐÔI,
    không được duyệt danh sách theo thứ tự — duyệt theo thứ tự là cái phễu, không phải hàng rào.*
  - **Đường đi tới lời giải, gồm cả hai ngõ cụt** (giữ lại vì cả hai đều bị TEST chặn, không phải
    bị tôi tự nghĩ ra):
    1. Hạ `dawn.sunWarmth` 0,85 → 0,22 cho nắng sớm LẠNH → bài *"nắng ẤM lúc bình minh/hoàng hôn"*
       **đỏ**, và nó đúng còn tôi sai: mặt trời thấp thì ánh sáng xuyên quãng khí quyển dài, ở CẢ
       HAI đầu ngày. Cái "mát" của buổi sớm nằm ở BẦU TRỜI và SƯƠNG, không ở đĩa mặt trời.
    2. Đẩy chân trời bình minh sang hồng sen 312° → bài *"bầu trời KHÔNG BAO GIỜ ngả tím sen"*
       (`palette3d.test.js`) **đỏ** với `#d189a5` (28 điểm, lưới cấm ở 10). Quét cả vòng màu: cửa
       an toàn chỉ mở từ **16°** trở đi, và thứ chạm trần TRƯỚC TIÊN là **MẶT NƯỚC** (nó cũng bám
       chân trời qua `skyward`) chứ không phải bầu trời. **Không nới lưới đó** — nó sinh ra từ hai
       màu hỏng có thật, và đổi một lỗi chắc chắn quay lại lấy một sắc màu đẹp hơn chút thì không
       đáng.
  - **Lời giải thật: SƯƠNG THEO GIỜ** (trường mới `haze` + hàm thuần `fogRangeFor`, `sceneGraph.js`
    đọc nó thay vì hằng số). Trước nay sương mù là một hằng số nên buổi nào cũng trong veo như nhau.
    Nay sáng sớm sương dày (0,90), chiều tà trời quang (0,08) — neo vào **một** sự thật khí quyển
    duy nhất: *qua đêm thì bụi lắng xuống và hơi nước đọng lại*. Cùng sự thật đó cũng giải thích
    luôn chân trời (bình minh vàng nhạt vì khí sạch · hoàng hôn cam đỏ đậm vì cả ngày bụi bốc lên)
    và đỉnh trời (lam sạch 202° vs tím chàm 252° — "đai sao Kim").
  - ⚠️ **VÌ SAO SƯƠNG LÀ THỨ DUY NHẤT ĂN THUA — bài học đáng nhớ nhất của phase này.** Đo theo TỪNG
    DẢI cho thấy: đổi màu trời xong thì dải TRỜI tách được (13,0) nhưng dải THÀNH PHỐ vẫn chỉ cách
    **8,7/255** (góc màu 51° vs 44° — bảy độ). Truy ra: thứ nhuộm màu lên thành phố là ĐÈN MẶT TRỜI,
    mà màu đèn mặt trời do đúng `sunWarmth` quyết định — thứ buộc phải ấm ở cả hai đầu ngày. Ngõ cụt
    hoàn toàn. Sương thoát ra được vì **nó lấy MÀU CHÂN TRỜI**, nên nó sơn lại cả mảng NỀN phía sau
    và quanh thành phố — khoảng một phần bảy khung hình.
  - ⚠️ **VÀ ĐÂY LÀ CHỖ TÔI SUÝT GHI SAI VÀO TÀI LIỆU, ĐÁNG NHỚ HƠN CẢ CÁCH SỬA.** Chú thích đầu tôi
    viết là sương "quét sắc của buổi sớm lên chính những công trình ở xa nên cuối cùng chạm được
    vào dải THÀNH PHỐ". Nghe cực kỳ xuôi tai — và sai hẳn dấu. Tắt riêng sương ra rồi bật lại (giữ
    nguyên mọi tham số khác) rồi đo theo từng dải:
    | dải | không sương | có sương |
    |---|---|---|
    | nền / chân trời | 12,9 | **74,6** |
    | THÀNH PHỐ | 8,4 | **3,3** ← GIẢM |
    | mặt đất | 7,2 | 7,2 |
    | cả cảnh | 17,2 | **75,1** |
    Toàn bộ khoảng cách đến từ phần NỀN, không từ các công trình — **đúng như thiết kế**, vì sương
    cố ý bắt đầu SAU rìa thành phố nên nó không chạm vào nhà ở gần (dải thành phố còn hơi giảm vì
    sương kéo mấy căn ở xa nhạt về phía màu chân trời). Và nhà cửa ở gần trông na ná nhau ở hai đầu
    ngày là **đúng vật lý**, không phải thiếu sót: cùng một mặt trời thấp, cùng một thứ ánh sáng ấm.
    Ngoài đời cũng thế — thứ cho ta biết đang là sáng hay chiều là bầu trời, là sương, là đèn đường
    đã bật hay chưa, không phải màu bức tường trước mặt.
    ⇒ **Bài học: "sửa đúng" KHÔNG chứng minh "hiểu đúng vì sao".** Con số tổng 5,9 → 75,1 xác nhận
    việc sửa có tác dụng, nên rất dễ dừng lại ở đó và viết ra một cơ chế nghe hợp lý mà chưa hề đo.
    Phải đo TỪNG DẢI mới biết cơ chế thật.
  - ⇒ Bài học kèm theo: **muốn đổi màu của VẬT thì phải đổi thứ CHIẾU vào vật (hoặc thứ PHỦ lên
    vật), không phải thứ đứng SAU vật.** Và: đo tổng cả cảnh chỉ ra một con số nhỏ mà không nói
    được nhỏ Ở ĐÂU — phải đo theo từng dải mới truy ra được nguyên nhân.
  - **Kết quả đo lại** (cùng bản quét, cùng phép đo): bình minh ↔ hoàng hôn **5,9 → 75,1**. Cặp gần
    nhau nhất trong cả ngày **5,9 → 29,8** (8h ↔ 12h). Cả 15 cặp nay đều trên ngưỡng mắt (~12), cặp
    yếu nhất gấp 2,5 lần ngưỡng. Chặng chiều (lỗi thật của nó là ĐỤC chứ không TRÙNG) cũng đã sửa:
    độ tươi 1,05 → 1,30, sắc 34° → 44°.
  - **Bài test mới (4 bài)**: (1) duyệt ĐỦ 15 cặp trên khoảng cách hồ sơ đa-trục, ngưỡng 0,40 —
    **hiệu chuẩn với phép đo pixel thật**, không nhặt đại: 0,31↔5,9px · 0,52↔29,8px · 1,28↔75,1px,
    xếp hạng 15 cặp hai thang cho Spearman **0,854**; (2) **bài đối chứng nhốt sẵn bộ số hỏng cũ**
    và bắt buộc phép đo phải CÒN bắt được nó — nếu về sau ai nới ngưỡng hoặc bỏ bớt trục cho tiện
    thì đỏ ngay, cái phễu không thể lặng lẽ quay lại lần thứ ba; (3)+(4) sương: bình minh phải nhiều
    sương nhất, và dù `haze` = 1 thì sương vẫn phải bắt đầu SAU rìa thành phố (khoá lại ảnh chụp
    "màn trắng đục" đã từng xảy ra), cộng bài đầu-vào-rác.
  - ⚠️ **ĐÃ SỬA MỘT MỤC NỢ CHẨN ĐOÁN SAI, KHÔNG PHẢI CHỈ ĐÓNG NÓ.** `TECH_DEBT` #17 bản đầu (viết
    sớm hơn vài giờ cùng ngày) đặt tên là *"Chặng CHIỀU là chặng xấu nhất trong ngày"*, kết luận có
    **hai hướng mỹ thuật cần Đàm chọn**, rồi DỪNG chờ. Cả ba đều sai: chiều không phải chặng tệ nhất
    (nó cách hoàng hôn 37,6 — rõ ràng), không có hai hướng nào, và không có gì để chờ. Nguyên nhân:
    **đo một trục rồi kết luận về cả bức tranh** — vừa báo nhầm (chiều bị kết tội oan) vừa bỏ sót
    (cặp hỏng thật thoát), mà cái sau nguy hiểm hơn vì nó im lặng. Và việc "chờ Đàm chọn" vi phạm
    đúng luật dự án đã ghi ở Phase 3X: *một trade-off chỉ có thật khi CẢ HAI vế đều đã đạt và buộc
    phải hy sinh một vế* — ở đây không vế nào đạt, tức là LỖI, mà sửa lỗi thì không cần xin phép.
  - **Không đụng**: state, cân bằng game, SQL, schema, `src/engine/coach/**`, `api/**`.

- **2026-08-13 (trang chủ)** — **APP THÔI MẮNG ĐÀM NGAY LÚC VỪA MỞ LÊN.**
  - **Vấn đề**: ô "Mục tiêu phiên" chỉ có HAI trạng thái (`isSessionGoalValid` đúng/sai). "Sai" gộp
    chung *chưa gõ chữ nào* với *gõ dở rồi dừng*. Nên mỗi lần mở app, thứ đầu tiên đập vào mắt là
    nhãn **"Thiếu mục tiêu"** + một dòng **đậm màu cảnh báo** `#8a3f24` — trên một ô anh còn chưa
    chạm vào. Thông tin đúng, GIỌNG sai, và sai ở đúng màn hình mở nhiều nhất trong ngày.
  - **Sửa**: tách ra `src/components/sessionGoalState.js` (thuần, 10 bài test) với BA trạng thái
    `empty`/`partial`/`ready` + ba tông. `PomodoroEngine.jsx` dùng chung nó cho **cả hai** khối
    (thẻ gọn + mục mở rộng) nên hai khối không thể lệch nhau nữa. Nhãn `Thiếu mục tiêu` →
    `Chưa đặt mục tiêu`; câu dưới ô → *"Phiên này bạn định chốt xong việc gì? Viết một dòng từ 10
    ký tự là bắt đầu được."* ⚠️ **Không giấu thông tin**: câu vẫn nêu ngưỡng, nút Bắt đầu vẫn vô
    hiệu hoá kèm nhãn "Cần điền mục tiêu phiên", và trạng thái *đã gõ dở* GIỮ NGUYÊN màu nhắc.
  - **Kèm một lỗi đơn vị**: bộ đếm `0/10` đếm KÝ TỰ nhưng nhãn ghi "tối thiểu **từ**" → đọc thành
    "tối thiểu 10 TỪ". Đã đổi thành "ký tự tối thiểu".
  - **505 bài test** (495 → 505). Bài chính đã **thử ngược**: ép về logic hai-trạng-thái cũ ⇒ đỏ.
  - ⚠️ **CÔNG CỤ ĐO LẠI NÓI DỐI — LẦN THỨ 10, VÀ LẦN NÀY SUÝT LÀM TÔI BỎ QUA MỘT PHÉP ĐO ĐÚNG.**
    `measure.mjs` (scratchpad) `Page.navigate` tới trang gieo dữ liệu, mà trang đó tự
    `location.replace('/index.html')` — ngữ cảnh JS bị huỷ rồi dựng lại. Đo quá sớm thì
    `document.body` là **null**, mọi `querySelectorAll` trả rỗng, và công cụ báo *"không thấy chỗ
    nào bị bóp"* rất thuyết phục **trong khi nó chưa hề nhìn thấy trang**. Đã vá: đợi tới khi có
    `<main>` + `innerText` > 200 ký tự, và **không có thì THOÁT LỖI chứ không trả rỗng**.
    ⇒ Luật chung: *một công cụ đo không tìm thấy gì phải chứng minh được rằng nó đã NHÌN.*
  - **Và một lần tôi tự sửa mình**: nhìn ảnh chụp tôi tưởng chữ "countdown" bị cắt cụt thành
    "countdow" (lỗi tràn). Đo bằng `canvas.measureText` với đúng font đang dùng: cột rộng 80px, từ
    dài nhất 54px ⇒ **không hề bị bẻ đôi**, tôi đọc nhầm ảnh. Câu đó có bị BÓP thật (7 từ / 4 dòng
    trong cột 80px ở thẻ "Thiết lập phiên", máy bàn 1280) nhưng chỉ là chật, không phải cụt — nên
    KHÔNG sửa vội. ⇒ Bài học: *"trông giống lỗi tràn" và "là lỗi tràn" cách nhau đúng một phép đo.*

- **2026-08-13 (công cụ + sửa nhãn)** — **DỰNG TÀI KHOẢN "ĐÃ CHƠI 6 THÁNG", VÀ NÓ TÌM RA NGAY MỘT
  LỖI SỐNG LÂU NGAY TRÊN THANH TIÊU ĐỀ.**
  - **Vì sao dựng**: mọi đợt soi giao diện từ trước tới nay đều chạy trên tài khoản gần như rỗng
    (0 XP · 0/360 thành tích · 0 kỹ năng). Tức là suốt thời gian qua tôi kết luận "đẹp/chán/tràn"
    dựa trên **màn hình của NGÀY ĐẦU TIÊN**, còn Đàm thì đang sống ở tháng thứ sáu.
  - **Công cụ**: `scripts/make-fixture.mjs` — 534 phiên · 312 giờ · 20.888 EP → **kỷ 8** · cấp 4 ·
    **7 kỷ đã niêm phong trong bảo tàng** · 1 công trình đang xây 3/6 phiên. Nạp vào ảnh chụp bằng
    `node scripts/shot.mjs --fixture <file>`.
  - ⚠️ **BẢN NHÁP ĐẦU CỦA CHÍNH CÔNG CỤ NÀY ĐÃ NÓI DỐI (lần thứ 9)**: nó bịa tỉ giá phần thưởng
    (11 XP/phút) rồi lại ép cứng `activeBook: 7`, làm thanh tiến độ hiện **"41.390 / 18.500"** —
    một tiến độ VƯỢT QUÁ vạch đích của chính nó. Nhìn thoáng qua y hệt một lỗi app. Kèm theo là ba
    tên khoá bịa (`progress.totalXP`, `player.xp`, `player.totalFocusMinutes` — không khoá nào tồn
    tại trong `gameStore`, app đọc ra 0) và `streak.lastSessionDate` (đúng phải là `lastActiveDate`).
    ⇒ **Luật đã ghi vào đầu file đó: mọi con số mà giao diện đem SO với một con số khác đều phải
    được SUY RA, không được bịa.** Nay dùng thẳng `calculateRewards`/`getActiveBook`/
    `mergeCityArchive` của app (chạy dưới `register-esm-loader`, thay `Math.random` bằng dòng số có
    hạt giống nên vẫn tất định — đã kiểm md5 hai lần chạy).
  - **Lỗi THẬT tìm được ngay trong lần soi đầu tiên**: **3 chỗ dán nhãn "XP" cho một đại lượng là
    "EP"** — `App.jsx` (thanh "Tiến trình kỷ" ở tiêu đề, hiện trên **mọi** màn hình, mọi thiết bị)
    và `RankDisplay.jsx` ×2. Cả ba đọc từ `progress.totalEP` + `ERA_THRESHOLDS`, cùng đơn vị mà
    `ResourceDisplay`/`PrestigeModal`/`StakePanel` đều gọi là EP. Bằng chứng là nhầm chứ không phải
    cố ý: ngay trong `RankDisplay.jsx`, nhãn "EP trong kỷ" ngay bên cạnh vẫn luôn ghi đúng.
    Đã sửa 3 chuỗi + đổi tên biến cục bộ (`xpInEra`→`epInEra`, `remainingXP`→`remainingEP`) để lỗi
    không quay lại. **495 bài test xanh** (sửa nhãn, không có logic mới để khoá).
  - **Vì sao nó sống lâu mà không ai thấy**: trên tài khoản mới, dòng đó chỉ là "0 / 1.300" — vô
    hại. Phải có số thật mới lộ ra "cấp 4 mà thanh XP báo 20.888". **Bài học: một lỗi nhãn chỉ hiện
    hình khi dữ liệu đủ lớn; tài khoản rỗng che được nhiều thứ hơn ta tưởng.**

- **2026-08-13 (Phase 3X)** — **VÒNG NGÀY CUỐI CÙNG CŨNG TỚI ĐƯỢC TRANG CHỦ.** Xử lý xong
  `TECH_DEBT` #16, và điều đáng ghi nhất là **nó không phải một đánh đổi như tôi đã ghi hôm trước.**
  - **Tôi đã sai ở đâu**: hôm trước tôi đọc chú thích trong `CityBackdrop.jsx` (*"đẹp và dùng được
    đối đầu nhau, dùng được phải thắng"*), kết luận "đánh đổi có chủ đích, phải chờ Đàm quyết", rồi
    DỪNG. Đọc kỹ lại thì chú thích ấy tuyên bố **HAI** ý định: (1) chữ đọc được — ĐẠT; (2) *"thành
    phố lộ ra rõ nhất ở khoảng trống phía dưới, đúng chỗ chẳng có chữ gì"* — **KHÔNG ĐẠT**. Không
    có xung đột nào để đánh đổi; chỉ có một vế chưa được thực hiện. ⇒ Bài học đã ghi vào `CLAUDE.md`:
    **một chú thích chứng minh Ý ĐỊNH, không chứng minh rằng CON SỐ đi kèm đã được đo.**
  - **Đo chỗ chữ thật đứng** (`textmap3.mjs`, có bài kiểm ngược): mặt đồng hồ `25:00` **không nằm
    trên nền** — nó ở trong một thẻ ĐẶC tại **82%** chiều cao lớp phủ, tức lớp phủ chưa từng bảo vệ
    nó. Chữ thật sự trên nền chỉ là khối lời chào: máy bàn **7%→21%**, điện thoại **31%→48%**.
  - ⚠️ **Bộ đo đầu tiên NÓI DỐI (lần thứ 8 trong dự án)**: bản đầu đi ngược lên tận `<body>` nên
    chạm phải lớp bọc trang có nền đục ⇒ xếp **mọi** chữ vào "trong thẻ", ra kết quả "0 chữ trên
    nền" — nghe rất tiện cho kết luận tôi muốn, và đúng vì thế mà phải nghi. Ranh giới đúng là
    **phần tử cha của lớp phủ**. Đã thêm `--selftest` để bộ phân loại tự chứng minh nó còn phân
    loại được.
  - **Đã làm**: tách hồ sơ mốc thuần ra `src/components/city/cityBackdropScrim.js`, **hai hồ sơ**
    theo khung màn hình (dùng lại `useIsPhone()` mà `CityBackdrop` đã có sẵn cho `still` — không
    thêm hạ tầng gì mới). Giữ nguyên (thực tế đậm hơn chút) tới mốc bảo vệ **28%/55%**, rồi thả
    nhanh về 0 ở vùng không có chữ.
  - **KẾT QUẢ ĐO (điểm ảnh thật, trước ↔ sau, cả 6 chặng)**: vòng ngày **14,0 → 25,0/255** (ngưỡng
    12) · dải CÓ CHỮ lệch tối đa **0,43/255** và **sáng hơn ở 6/6 chặng, không chặng nào tối đi** ⇒
    tương phản chữ không giảm một phần nghìn nào · dải KHÔNG CHỮ lệch **22–33/255**. Đã soi mắt cả
    theme sáng/tối và khung điện thoại: thấy rõ thành phố hoàng hôn, không có vệt cắt ngang nào.
  - **Test 488 → 495 xanh** · lint sạch · build xanh. Bài khoá quét **từng phần trăm một** (vì
    `linear-gradient` nội suy GIỮA các mốc — kiểm mốc là cái phễu, không phải hàng rào) và đã thử
    ngược với hồ sơ cố ý nhạt hơn ⇒ **đỏ ngay tại 1%**.
  - **Còn lại cho Đàm**: chỉ còn `TECH_DEBT` #14 (95% phiên im lặng — cân bằng game) là thật sự cần
    anh quyết, cộng việc xác nhận Vercel "Ready" và chạy thử một phiên 25 phút trên iPhone.

- **2026-08-13 (soát sau 3W, KHÔNG sửa mã sản phẩm)** — **HỎI TIẾP CÂU CỦA REVIEW TRIGGER: thành quả
  Phase 3V có tới được TRANG CHỦ không?** Câu trả lời đo được: **gần như không.**
  - **Số đo** (ảnh chụp app đã build, bề ngang 1280, hai dải thành phố lộ ra hai bên thẻ đồng hồ):
    cả 6 chặng ngày ra gần như cùng một mảng trắng ngà, độ tươi **0,02–0,12**; cặp cách nhau XA
    NHẤT — giữa trưa ↔ ban đêm, hai cực của cả ngày — chỉ **14/255** (ngưỡng "mắt không phân biệt
    được" là 12). Toàn bộ hành trình màu 178° mà 3V dựng lên **không tới được màn hình Đàm nhìn
    nhiều nhất**.
  - **Nguyên nhân KHÔNG phải `BACKDROP_OPACITY`** mà là lớp phủ giữ-chữ-đọc-được: nó pha về
    `var(--canvas)` — một màu **PHẲNG** — ở 55–92%. Pha về màu phẳng thì **độ tươi tụt theo đúng tỉ
    lệ đó**, còn hình khối (tín hiệu ĐỘ SÁNG) thì sống sót ⇒ lớp phủ lọc mất đúng cái vòng ngày dựa
    vào, và giữ lại đúng cái không thiếu cũng được.
  - ⚠️ **KHÔNG TỰ SỬA.** Chú thích tại chỗ ghi rõ đây là đánh đổi có chủ đích (*"đẹp và dùng được
    đối đầu nhau, dùng được phải thắng"*), và người viết đã cân nhắc rồi mới chọn con số. Đã ghi
    thành `TECH_DEBT.md` **#16** kèm ba lựa chọn và một quan sát có thể mở đường (chữ chỉ nằm ở dải
    TRÊN; đồng hồ và cột phải đều nằm trong thẻ ĐẶC ⇒ có thể giữ nguyên phần trên mà cho nhạt nhanh
    hơn ở phần dưới). **Chờ Đàm quyết.**
  - ⚠️ **CÔNG CỤ CHỤP LẠI NÓI DỐI — LẦN THỨ BẢY TRONG PHIÊN NÀY, và lần này suýt báo một lỗi NẶNG
    không hề có.** Chụp khung điện thoại bằng `--window-size=390,844`: ảnh ra đúng 390 điểm ảnh
    ngang và trông như app **tràn ngang thảm hại** (chữ cụt giữa câu, thanh dưới mất nút). Đo bằng
    số thì `window.innerWidth` thật là **500** — Chromium headless có SÀN 500px — nên trang dàn ở
    500 rồi bị cắt còn 390. Sự thật: `scrollWidth === innerWidth` và **không một phần tử nào vượt
    mép phải**, ở cả 390-giả lẫn 1280. **App không hề tràn.** Muốn khung điện thoại thật phải dùng
    CDP `Emulation.setDeviceMetricsOverride`. Đã ghi vào `CLAUDE.md` kèm luật: **luôn in kèm
    `window.innerWidth` THẬT vào mỗi lần chụp**, nếu không thì mọi kết luận về bố cục hẹp đều dựa
    trên một bề ngang bịa.
  - **Không đổi một dòng mã sản phẩm nào** — chỉ tài liệu (`TECH_DEBT.md` #16, `CLAUDE.md`, file này).

- **2026-08-13 (Phase 3W)** — **BẢO VỆ CHÍNH THÀNH QUẢ CỦA 3V: hai đường rò rỉ mà 3V vừa mở ra.**
  Phase này sinh ra từ đúng một câu trong `TECH_DEBT.md` #14: *"Review Trigger: trước bất kỳ đầu tư
  nào thêm vào hiệu ứng thành phố"*. Tôi vừa đầu tư (3V), nên phải hỏi: **thành quả đó có thật sự
  tới được màn hình Đàm không, và nó có bền không?**
  - **RÒ RỈ 1 — bầu trời ĐỨNG IM khi mở lại app.** `CityScene3D` đọc đồng hồ đúng MỘT LẦN lúc dựng
    cảnh; danh sách phụ thuộc của effect **không có gì liên quan tới thời gian**. Phần lớn trường
    hợp được `sessionCount` cứu (xong một phiên là dựng lại ⇒ đọc lại đồng hồ). Trường hợp KHÔNG
    được cứu: **iPhone (PWA) chỉ ĐÓNG BĂNG tab chứ không đóng hẳn** — mở app buổi sáng, cất máy, mở
    lại lúc tối thì React không mount lại, và Đàm thấy bầu trời buổi sáng giữa đêm. Đây đúng họ lỗi
    tầng đồng bộ đã phải vá ("BẢN VÁ C1" ở `syncService.js`: timer debounce KHÔNG BAO GIỜ nổ trên
    iOS vì tab bị đóng băng) ⇒ dùng lại đúng tín hiệu đó: `visibilitychange`, chỉ SO SÁNH tên chặng
    nên `setState` gần như luôn bị React bỏ qua. **CỐ Ý không hẹn giờ định kỳ**: đổi lại là không
    có nguy cơ cảnh dựng lại GIỮA một phiên tập trung (chớp hình lúc đang tập trung tệ hơn bầu trời
    trễ vài phút). Ca còn hở: app mở + đang hiện suốt nhiều giờ mà không xong phiên nào.
  - ⚠️ **BÀI TEST ĐẦU TIÊN CỦA TÔI XANH OAN.** Viết `/addEventListener\(\s*'visibilitychange'/` rồi
    thử gỡ sạch bộ nghe — **vẫn xanh**, vì trong cùng file còn một bộ nghe `visibilitychange` KHÁC
    (lo việc dừng vòng lặp vẽ). Đúng bẫy "ngưỡng một phía là cái phễu chứ không phải hàng rào". Đã
    siết lại cho bám đúng tên hàm xử lý, rồi thử NGƯỢC với **4 biến thể hỏng** — cả 4 đều đỏ đúng
    chỗ. **Quy tắc: một bài test chưa từng thấy đỏ thì chưa phải là một bài test.**
  - **RÒ RỈ 2 — Phase 3V ĐÃ LÀM MẤT MỘT LỜI BẢO ĐẢM, và tôi suýt không nhận ra.** `ARCHITECTURE.md`
    ghi thẳng *"BẦU TRỜI KHÔNG ĐƯỢC PHA BẰNG CÁCH XOAY GÓC MÀU"* — kết luận mua bằng BA lần hỏng
    liên tiếp. Phép trộn RGB cũ khiến màu tím **bất khả thi về cấu tạo**; xoay sắc thì không. Tính
    tay: nền ấm 40° kéo về đích lam 232° ở lực kéo 0,5 ra **316°**, đúng họ màu `#cf63c2` của lần
    hỏng thứ hai. Bộ tham số hiện tại không rơi vào đó — nhưng **"hiện không rơi" ≠ "không thể
    rơi"**, và khi mở rộng bài test chống-tím từ 6 màu kỷ mẫu lên **đủ 15 kỷ thật** thì nó bắt ngay
    `#bd818e` (mặt nước 5 giờ sáng, kỷ 6 sắc tím): **LẦN THỨ TƯ của cùng họ lỗi, do chính 3V gây
    ra.**
  - **Cách trả lại lời bảo đảm** (một dòng, và nó là phát biểu chính xác hơn của cùng ý "đi qua màu
    xám"): **độ dài vector tổng chính là mức độ CÓ NGHĨA của phép trộn** — hai sắc cùng hướng thì
    dài 1, gần đối nhau thì triệt tiêu. Nhân độ tươi với `min(1, |v| / 0,5)` ⇒ ca mơ hồ nhạt về
    xám, ca kéo mạnh giữ nguyên. Mốc 0,5 chọn theo SỐ ĐO: trưa `|v|` = 0,70 và bình minh 0,98 (giữ
    nguyên), ca hỏng chỉ 0,18 (nhạt còn hơn một phần ba). Buổi sáng sát mốc (0,45) nên nhạt ~10% →
    đã bù bằng `morning.skySaturation` 1,18 → 1,32. Đo lại: **sáng 203°/0,15 · trưa 211°/0,17 — y
    như trước khi vá.** Bầu trời xanh không mất gì.
  - **KHÔNG thêm bài test trùng.** Bản đầu tôi viết hẳn một bài chống-tím mới, rồi phát hiện đã có
    sẵn hai bài. Đã XOÁ bài mới và **mở rộng bài cũ** (đủ 15 kỷ + soi thêm mặt nước) — đúng luật
    "Composition over Duplication", và cũng vá đúng lỗ hổng mà chính file test đó tự cảnh báo
    (*"bộ mẫu 5–6 màu cũ đã chạy XANH suốt trong khi 6/15 kỷ đang có mái tím sen"*).
  - `ARCHITECTURE.md` đã sửa: đoạn cũ nay mâu thuẫn với mã, nên ghi rõ "cùng kết luận, đường khác",
    kèm lý do vì sao đơn thuốc cũ (trộn RGB) gây bệnh thứ hai. **Tài liệu mâu thuẫn với mã còn nguy
    hơn không có tài liệu.**
  - Test **488** bài (485 → +3), lint sạch, build xanh, quét lại đủ 90 ô.

- **2026-08-13 (Phase 3V)** — **TRỜI BAN NGÀY CUỐI CÙNG CŨNG XANH. `TECH_DEBT.md` #15 ĐÃ ĐÓNG.**
  Đây là phần sửa cho lỗi mà Phase 3U (ngay dưới) tìm ra nhưng chưa động tới.
  - **Sửa ở ĐÂU**: `skyward()` trong `src/engine/city3d/palette3d.js` (phép trộn màu) +
    `DAYLIGHT_PROFILES` trong `src/engine/city3d/daylight.js` (2 chặng sáng/trưa) + bài 81 ở
    `daylight.test.js`. **KHÔNG** đụng `sceneGraph.js` — xem "nợ còn lại có chủ đích" bên dưới.
  - **BA tầng chồng lên nhau, sửa một tầng thì vẫn hỏng** (đây mới là bài học, không phải con số):
    1. `skyward()` trộn màu trong **không gian RGB** ⇒ sắc ấm 40° pha sắc lạnh 205° đi qua vùng
       TRUNG TÍNH, ra xám. **Đúng họ lỗi đã sửa cho MÁI NHÀ ở Phase 3N.** Nay xoay sắc bằng
       **vector chroma** (cộng hai vector đơn vị theo góc rồi `atan2`), giữ nguyên tươi/sáng gốc.
    2. **`NeutralToneMapping` nén vùng sáng.** Chân trời để độ sáng 0,80 rơi đúng giữa vùng bị nén
       ⇒ độ tươi ra màn hình chỉ còn **1/5** bảng màu. Hạ xuống 0,70/0,72 và nâng tươi lên
       0,60/0,44 mới thoát ra. ⚠️ Lệch **ngược chiều** với mái nhà (mái render ra tươi GẤP ĐÔI
       bảng màu) — nên "bảng màu ≠ màu trên màn hình" không có một hệ số chung, phải đo từng chỗ.
    3. **Góc màu đặt vào ≠ góc màu đo được.** Nắng ấm nhân vào trời kéo sắc lạnh tụt **13–22°** về
       phía lục (đặt 195° đo ra 173°); sắc ấm thì hơi tăng (đặt 18° đo ra 27°). Hai chặng sáng/trưa
       phải khai cao hơn đích thật ~15°: đặt 210°/216° mới đo ra 203°/211°.
  - **Số đo trước → sau** (kỷ 7, theme sáng, đỉnh trời giữa khung): `26°/40°/41°/38°/19°/224°` →
    `27°/203°/211°/37°/18°/223°`. Bốn chặng ban ngày trải **178°** thay vì 22°. Giữa trưa `#7d8fa3`.
  - **Xác minh đủ 90 ô** (15 kỷ × 6 chặng): không ô nào đen/xám/cháy; 6/6 chặng phân biệt được;
    ⚠️ **ĐÍNH CHÍNH ở Phase 3W: chỗ này bản đầu ghi "180 ô × 2 theme" — SAI, xem mục 3W bên trên;** **đêm không tối hoặc phẳng thêm** (dựng lại khung đêm bằng mã TRƯỚC
    Phase 3V để so trực tiếp: chênh +0,005 độ sáng, +0,002 dải động — nằm trong nhiễu).
  - ⚠️ **CÔNG CỤ ĐO CỦA TÔI TỪNG NÓI DỐI, và suýt làm tôi chữa một bệnh không có.** Phép dò mép
    tấm bảng quét "chạy tới khi khác màu nền" chạy quá đà tới (68, 38) thay vì (8, 8), vì nền tấm
    bảng TRÙNG màu nền trang. Mỗi ô bị lấy mẫu lệch 60px sang phải + 30px xuống dưới, dính cả dải
    nhãn giữa hai hàng — dải đó **sáng trưng ở theme sáng và đen kịt ở theme tối**, nên số đo sai
    theo hai chiều NGƯỢC nhau tuỳ theme và bịa ra một "lỗi đêm phẳng chỉ ở theme tối". Toạ độ thật
    lấy thẳng từ CSS của trang (`#wrap { padding: 8px }`), không dò. **Đây là lần thứ SÁU trong
    phiên này một công cụ đo/fixture tự viết ra sai lệch** — quy tắc: nghi ngờ công cụ đo đúng như
    nghi ngờ mã sản phẩm, và số đo nào gây bất ngờ thì kiểm chính công cụ TRƯỚC khi kiểm mã.
  - **Đêm KHÔNG hỏng, đã kiểm riêng**: cờ "phẳng" ở 12/15 ô đêm là do ngưỡng tôi đặt sai cho một
    cảnh đêm (đêm tối thì tương phản tuyệt đối thấp là ĐÚNG). Phép đo có ý nghĩa là **15 kỷ có còn
    khác nhau không** — tản sắc giữa các kỷ lúc đêm 28,2°, tản sáng 0,008, ngang bằng năm chặng
    kia ⇒ Phase 3M đã chữa được thật. Không mở nợ mới.
  - **Nợ còn lại CÓ CHỦ ĐÍCH**: số mũ `t^2.6` ở `sceneGraph.js` không đụng — chú thích tại chỗ ghi
    rõ nó được nâng từ 1,2 lên để cứu lỗi "mảng oải hương xam xám"; sửa nó là mở lại một lỗi cũ để
    đổi lấy cải thiện mà đường khác đã đạt được rồi.
  - **Kèm theo (rủi ro thấp, xử lý luôn)**: `eslint.config.js` bỏ qua `.city-preview`. ESLint KHÔNG
    tự đọc `.gitignore`, nên chạy `npm run lint` đúng lúc đang dựng ảnh xem thử sẽ ra **29 lỗi giả**
    nằm trong ruột three.js được gói tạm — đủ để một phiên sau tưởng mình vừa làm hỏng gì đó.
  - Test **485** bài (giữ nguyên số — bài 81 viết lại chứ không thêm), lint sạch, build xanh.

- **2026-08-13 (Phase 3U)** — **QUÉT LẠI ĐỦ 15 KỶ × 6 CHẶNG TRÊN MÃ HIỆN TẠI: trời ban ngày KHÔNG
  BAO GIỜ xanh.** Tìm ra lỗi, **ĐỊNH VỊ chính xác nguyên nhân, nhưng CHƯA SỬA** — xem `TECH_DEBT.md`
  **#15**. Hai thử nghiệm sửa đã được **HOÀN TÁC**; mã sản phẩm giữ nguyên từng byte.
  - **Vì sao quét lại**: từ lần quét trước (3G) đã đổi bảng màu (3N) và ánh sáng đêm (3M) — bảng cũ
    không còn nói về mã đang chạy.
  - **Mắt chẩn SAI, phép đo sửa lại**: nhìn bảng quét tôi kết luận "3 chặng ban ngày giống hệt
    nhau". Đo thì **6/6 chặng vẫn phân biệt được** (khoảng cách nhỏ nhất 17/255). Nhưng phép đo lộ
    ra lỗi thật và chính xác hơn: **5/6 chặng nằm gọn trong dải sắc 19°–41° (cam-nâu), chỉ ĐÊM
    (224°) thoát ra.** Cả ngày chỉ đổi ĐỘ SÁNG (0,46 → 0,60 → 0,46) chứ không đổi SẮC — mà độ sáng
    là tín hiệu thị giác yếu nhất. Không phải "giống nhau", mà là **cùng một sắc, khác độ sáng**.
  - **Nguyên nhân (hai tầng nhân nhau)**: (1) `sceneGraph.js` pha vòm trời theo `t^2.6`, camera chúc
    xuống nên dải trời lọt khung chỉ ở `t ≈ 0,50–0,67` ⇒ `0,5^2,6 = 0,17`, tức **trời nhìn thấy được
    là 64–84% MÀU CHÂN TRỜI**. ⇒ **`horizonHue` mới là người quyết định màu trời ban ngày, KHÔNG
    phải `skyHue`** — giữa trưa khai `skyHue: 212, skyPull: 0.70` (mạnh nhất ngày) mà hoàn toàn vô
    hiệu. (2) `skyward()` trộn bằng **`mixRgb`** — ấm 40° pha lạnh 205° trong RGB thì đi qua vùng
    trung tính, **đúng họ lỗi đã sửa cho MÁI NHÀ ở Phase 3N**.
  - ⚠️ **HAI CÁCH ĐÃ THỬ VÀ THẤT BẠI, ĐỪNG THỬ LẠI**: `horizonPull 0.42` → `#a6a69a` 61° tươi 0,06
    (xám); `horizonPull 0.78` → `#9ca7a3` **157° lục-lam** tươi 0,05. Càng kéo mạnh càng lạc sang
    lục rồi chết ở xám ⇒ **chỉnh số trong `DAYLIGHT_PROFILES` KHÔNG chữa được**, phải sửa phép toán.
  - **Vì sao DỪNG chứ không sửa tiếp**: `skyward()` dùng chung cho **180 ô** (15 kỷ × 6 chặng × 2
    theme) và còn nhân với 4 skin. Phát hành một phép toán màu mới chỉnh dở còn tệ hơn giữ nguyên.
    Cần một phase riêng, không làm kèm việc khác.
  - ⚠️ **NGƯỠNG MAINTENANCE SPRINT — VẾ THỨ HAI NAY ĐÃ CHẠM**: `palette3d.js` đã qua **5 đợt** vá mỹ
    thuật (3C · 3G · 3M · 3N · nay #15). Chính sổ nợ đã đặt sẵn mốc "đợt thứ 5 thì dừng lại xem xét
    tổng thể tầng màu thay vì vá tiếp" — mốc đó đã tới. **Khuyến nghị: làm #15 như một đợt xem xét
    TỔNG THỂ phép trộn màu (RGB → HSL) cho cả mái, trời và mặt đất một lượt.**

- **2026-08-12 (Phase 3T)** — **MÔ PHỎNG 365 NGÀY: 95% SỐ PHIÊN KHÔNG CÓ LỄ MỪNG NÀO.** Phát hiện
  lớn nhất trong ngày, và lớn hơn hẳn hai thứ vừa sửa ở 3R/3S. **Chỉ NGHIÊN CỨU + ghi sổ, KHÔNG
  sửa** — mọi phương án đều đổi cân bằng kinh tế nên phải để Đàm chọn (`TECH_DEBT.md` **#14**).
  - **Cách tìm ra**: tôi vừa viết trong báo cáo 3S rằng *"một màn hình chỉ nhàm sau nhiều ngày lặp,
    việc đó không mô phỏng được"*. Sai — repo đã có sẵn **`scripts/simulate-pacing.mjs`** mô phỏng
    trọn 365 ngày, mà xưa nay chỉ dùng để cân KINH TẾ, chưa phiên AI nào dùng nó soi TRẢI NGHIỆM.
  - **Số đo**: 370 ngày × 12 phiên = **4 428 phiên**; cả game chỉ có **420 bước xây** (75 bản vẽ),
    mỗi phiên tiêu 2 bước (`CRAFT_QUEUE_SLOTS = 2`, mỗi phiên đẩy MỌI ô) ⇒ **215 phiên có lễ mừng
    (4,9%)**, **4 213 phiên im lặng (95%)**. Xấu dần theo kỷ: **kỷ 1 im lặng 81% → kỷ 15 im lặng
    98%** (thời gian ở mỗi kỷ tăng từ 4 lên 69 ngày, số bản vẽ mỗi kỷ vẫn là 5).
  - **Hệ quả cần nhớ cho MỌI phiên sau**: mọi đầu tư thêm vào lễ mừng/hiệu ứng thành phố hiện chỉ
    chạm tới **5% số phiên** trước khi tới được Đàm. Chưa xử lý #14 thì các phase kiểu 3R/3S sau này
    đều lãi thấp một cách có hệ thống.
  - **Các hướng đã cân nhắc** (chi tiết + đánh đổi ở #14): (a) tăng số ô hàng đợi — **LOẠI**, làm
    mọi thứ xây xong nhanh hơn nên im lặng tới SỚM hơn; (b) bỏ lọc theo kỷ hiện tại; (d) nói thật
    khi xưởng trống; (e) tăng `sessionsToComplete`.
  - ⚠️ **TỰ ĐÍNH CHÍNH NGAY TRONG PHASE — đây là lỗi tôi suýt để lại trong sổ.** Bản đầu của #14
    khuyến nghị **(c) nâng cấp công trình Lv.1→2→3** là "ứng viên mạnh nhất". **SAI.** Kiểm bằng
    mã: `upgradeBuilding` (`gameStore.js:5717`) là hành động **TỨC THÌ**, trả bằng tài nguyên tinh
    luyện, **KHÔNG tốn phiên nào** ⇒ nó là bể chứa TÀI NGUYÊN chứ không phải bể chứa PHIÊN, không
    thêm một bước xây nào. Cơ chế nâng cấp **đã tồn tại đầy đủ và đang chạy** (`buildingLevels` ·
    UI ở `BuildingWorkshop.jsx`/`BlueprintInventory.jsx` · `levelBoost` ở `buildingSpec.js:48`) —
    chỉ là nó không liên quan tới vấn đề này. *Chính đầu file `TECH_DEBT.md` cảnh báo "sổ khẳng
    định đã có sẵn X thì phải kiểm bằng lệnh trước khi tin" — tôi vừa vi phạm đúng cảnh báo đó khi
    viết #14 dựa vào trí nhớ về `CLAUDE.md` §4.3 thay vì đọc mã.*
  - ⚠️ **SỐ HỌC PHŨ PHÀNG (quan trọng hơn mọi phương án trên)**: 4 428 phiên vs 420 bước xây. Muốn
    chỉ MỘT NỬA số phiên có lễ mừng thì cần ~2 200 bước xây — **gấp hơn 5 lần**. Không tinh chỉnh
    nhỏ nào làm nổi. ⇒ Câu hỏi đúng KHÔNG phải "vá thế nào" mà là: **thành phố có nên là phần
    thưởng của TỪNG PHIÊN không, hay nó vốn là phần thưởng của CẢ THÁNG** — còn từng phiên đã có
    hộp vật phẩm + XP + chuỗi ngày lo? Nếu là vế sau thì #14 không phải lỗi mà là kỳ vọng đặt sai
    chỗ, và việc cần làm là **thôi đổ thêm công vào lễ mừng**, chứ không phải chỉnh kinh tế.

- **2026-08-12 (Phase 3S)** — **NHÌN BẰNG MẮT VÀO CHÍNH THẺ VỪA SỬA — hai lỗi không phép đo nào bắt
  được.** Dựng lại thẻ lễ mừng bằng **CSS đã build thật** trong Chromium headless (đủ 8 tổ hợp
  theme × skin) rồi soi.
  - **Lỗi 1 — bố cục nói TO đúng phần LẶP, thì thầm đúng phần THAY ĐỔI.** Câu cột mốc (thứ Phase 3R
    vừa làm cho đa dạng, thứ mang cảm xúc) nằm ở dòng nhãn **10px in hoa**; còn tên công trình +
    số đếm lùi (phần lặp mỗi phiên) thì **15px in đậm**. Kiểu chữ đang bóp nghẹt chính cải tiến vừa
    làm. **Đã đảo**: cột mốc → 17px đậm (là TIN); tên công trình → 11,5px `mono` mờ (là BỐI CẢNH).
  - **Lỗi 2 — "Sắp hoàn thành" đọc lướt lẫn với "Công trình đã hoàn thành"**, mà hai câu này rơi
    vào **hai phiên LIỀN NHAU** ⇒ lẫn là chắc chắn. Đổi thành **"Đã làm đủ số phiên"** (đúng
    nguyên văn `remaining = 0`, không thể nhầm với "đã xong"). Có bài test cấm câu lúc-chưa-xong
    dùng lại chữ "hoàn thành" (484 → **485**).
  - ⚠️ **LẦN THỨ NĂM: NGHI NGỜ ĐỒ NGHỀ CỨU KHỎI MỘT KẾT LUẬN SAI.** Ảnh chụp cho thấy dấu tiếng
    Việt **rời hẳn ra** ở dòng `mono` ("Đền Thờ Phô ̉ Linh Hôǹ") — trông y như một lỗi font thật.
    Kiểm ra: `dist` KHÔNG có `@font-face` nào, JetBrains Mono nạp từ **Google Fonts lúc chạy**;
    máy chụp ảnh không có mạng nên rơi về font mono của Linux vốn dựng dấu kém. **Trên máy Đàm chữ
    hiện đúng.** Suýt nữa báo một lỗi không tồn tại — và tệ hơn, suýt gỡ `mono` khỏi 265 chỗ đang
    dùng đúng.
  - **Đo kèm**: không câu mừng nào tràn hoặc xuống dòng ở cả 8 tổ hợp; câu dài nhất
    (cột mốc + Tăng tốc + tên dài nhất) xuống 2 dòng, không tràn — đóng lại đúng rủi ro tôi tự nêu
    ở báo cáo Phase 3R.

- **2026-08-12 (Phase 3R)** — **MÀN THƯỞNG THÔI LÀ MỘT HẰNG SỐ: 2 câu → 5 câu, câu lặp nhiều nhất
  82% → 33%.** Đây là lần đầu chữ **"chán"** được xử lý bằng SỐ ĐO thay vì cảm tính.
  - **Đo ra lỗi**: `buildGrowthMoment` nhánh giàn giáo trả đúng MỘT câu cứng `'Thành phố vừa lớn
    lên'`. Chạy qua toàn bộ **75 bản vẽ = 420 phiên xây**: cả game chỉ có **2 câu mừng**, **82% số
    phiên** đọc lại đúng 4 chữ đó. Nhịp ~4 phiên/ngày ⇒ Đàm gặp lại nó **hơn 3 lần MỖI NGÀY**. Màn
    thưởng mà là hằng số thì nó thôi làm phần thưởng — đó chính là "chán" ở dạng đo được.
  - **Đã sửa** (`engine/cityMoment.js`, thuần): thêm `growthHeadline()` sinh câu theo **cột mốc
    THẬT** của công trình — *Vừa khởi công · Đã qua nửa chặng · Chỉ còn một phiên nữa · Sắp hoàn
    thành · Thành phố vừa lớn lên*. Kết quả: 5 câu, câu lặp nhiều nhất còn **33%**, và chúng xếp
    thành một **mạch** (khởi công → qua nửa → còn một phiên → hoàn thành) chứ không phải 5 câu rời.
  - ⚠️ **RÀNG BUỘC KHÔNG ĐƯỢC PHÁ — đọc trước khi "cải tiến" chỗ này**: cách chữa nhàm chán rẻ nhất
    là rắc lời khen ngẫu nhiên ("Tuyệt vời!"). **TUYỆT ĐỐI KHÔNG.** Luật trung thực của file này
    đứng TRÊN luật đa dạng. Mọi câu đều là **mệnh đề ĐÚNG suy ra từ số liệu đã có**, không thêm một
    dữ kiện mới nào. Có bài test canh riêng việc này (xem dưới).
  - **Tiện tay trả một sự thật đang bị giấu**: đặc quyền **"Tăng tốc"** xưa nay chỉ lặng lẽ đổi vạch
    xuất phát của thanh tiến độ — Đàm trả giá cho nó mà không lần nào thấy nó làm việc. Nay dòng phụ
    ghi rõ `· Tăng tốc đẩy thêm 1 bước` khi nó vừa có tác dụng.
  - **Lỗ hổng phụ tìm ra khi đo**: trạng thái `còn 0 phiên` (hàng đợi chưa kịp dọn) vẫn rơi vào câu
    chung chung dù dòng phụ đã ghi "sắp xong" từ lâu → nay có câu riêng `'Sắp hoàn thành'`.
  - **4 bài test mới** (480 → **484**), **đã chứng minh ĐỎ cả hai hướng**: (a) trả `growthHeadline`
    về câu cứng như bản đã chạy thật ⇒ đỏ *"cả game chỉ có 2 câu mừng cho 420 phiên xây"*; (b) rắc
    câu cho đủ đa dạng nhưng nói SAI sự thật ⇒ bài "CỘT MỐC PHẢI ĐÚNG" bắt được ngay. Ngưỡng 50%
    đặt **DƯỚI** giá trị hỏng đã từng chạy thật (82%) — đúng bài học "ngưỡng đặt trên giá trị hỏng
    thì chỉ là cái phễu", phiên này đã trả giá 3 lần cho nó.
  - ⚠️ **BÀI HỌC LẶP LẠI LẦN THỨ TƯ — dev-tool phải bị nghi ngờ như mã sản phẩm**: bản đo đầu tiên
    dùng `bpId` tôi tự bịa (`bp_nha_kho`) nên nhánh "công trình hoàn thành" im lặng; bản thứ hai thì
    mô hình phiên cuối là *giàn giáo còn 0 phiên* thay vì *hoàn thành*, báo 51% thay vì 33%. Cả hai
    lần đều **suýt dẫn tới kết luận sai**. Đã sửa: bài test dựng lịch sử bằng `computeCityLayout` +
    `BUILDING_EFFECTS` thật, và phiên cuối đi qua đúng nhánh `newlyBuilt`.

- **2026-08-12 (Phase 3Q)** — **TRẢ NỢ #12: LỄ MỪNG KHÔNG CÒN BỊ TÍNH VÀO GIỜ NGHỈ.**
  `BREAK_START_DELAY_MS` **500 → 3 200 ms** (`engine/timerSession.js`), phủ trọn lễ mừng.
  - **Trước**: phiên xong → 0,5 s sau đồng hồ nghỉ đã chạy, trong khi lễ mừng còn 3,2 s rồi mới tới
    hộp phần thưởng ⇒ **2 700 ms giờ nghỉ bị lễ mừng ăn mất**, cộng thời gian đọc hộp phần thưởng,
    tổng ~8–18 giây trên một phiên nghỉ 5 phút. Sai về nguyên tắc: **phần thưởng bị trừ vào giờ
    nghỉ** — lễ mừng là tiền công, không phải khoản Đàm tự trả.
  - **Bài test đổi vai**: từ *chốt mức nợ* (Phase 3P) sang khẳng định **bất biến thật**
    `BREAK_START_DELAY_MS >= GROWTH_MOMENT_MS`. **Đã chứng minh ĐỎ cả HAI chiều**: hạ độ trễ về 500
    ⇒ đỏ; kéo lễ mừng lên 5 000 mà quên chỉnh độ trễ ⇒ cũng đỏ.
  - ⚠️ **Hai hằng số CỐ Ý không import lẫn nhau**: tầng đồng hồ KHÔNG được phụ thuộc tầng thành phố
    (đồng hồ phải chạy đúng cả khi không có lễ mừng nào — lễ mừng chỉ xuất hiện khi có công trình
    tiến triển). Ràng buộc xuyên tầng sống ở BÀI TEST, không ở câu `import`.
  - ⚠️ **Đánh đổi đã cân nhắc**: phiên KHÔNG có lễ mừng nay cũng chờ 3,2 s mới vào nghỉ. Chấp nhận
    vì cả hai trường hợp người dùng đều đang nhìn hộp phần thưởng chứ không nhìn đồng hồ; và lệch
    về phía "được nghỉ đủ" an toàn hơn lệch về phía "bị ăn bớt". Muốn quay lại: đổi đúng MỘT dòng
    về 500 (bài test sẽ đỏ và nhắc lại toàn bộ lý do).
  - **Đã kiểm an toàn trước khi đổi**: không logic đồng hồ nào phụ thuộc việc cửa sổ `FINISHED`
    phải ngắn; trong 3,2 s đó màn hình hiện "Hoàn thành" (đúng thứ nên hiện lúc đang ăn mừng), và
    `pendingBreakTimeoutRef` vẫn được `reset()`/`cancel()` dọn như cũ. **480 bài test.**

- **2026-08-12 (Phase 3P)** — **DỰNG LƯỚI CHO NHỊP PHIÊN, KHÔNG TỰ Ý ĐỔI HÀNH VI ĐỒNG HỒ.**
  Trả phần đầu tiên của nợ #13 và dựng hàng rào cho #12, mà KHÔNG đổi một hành vi nào.
  - **Hai con số vô danh nay có TÊN và về tầng THUẦN**: `GROWTH_MOMENT_MS` (3 200) chuyển từ
    `components/city/CityGrowthMoment.jsx` → **`engine/cityMoment.js`**; `BREAK_START_DELAY_MS`
    (500) rút khỏi 2 chỗ viết cứng trong `hooks/useTimer.js` → **`engine/timerSession.js`**.
    `CityGrowthMoment.jsx` xuất lại `MOMENT_MS` nên mọi chỗ đang import không phải sửa.
  - **Vì sao phải về tầng thuần**: chừng nào hai số còn nằm ở hai tầng không nói chuyện được với
    nhau (một trong component có `framer-motion`, một trong hook React) thì **không bài test
    `node --test` nào canh nổi quan hệ giữa chúng** — mà chính khoảng lệch đó là nội dung của #12.
  - **Bài test mới "NHỊP MỘT PHIÊN"** (`timerSession.test.js`): **CHỐT khoảng bị trừ ở 2 700 ms**.
    Đây là bài test *chặn nợ phình to*, KHÔNG phải bài test *mọi thứ đã đúng* — nói rõ điều đó ngay
    trong chú thích để phiên sau không hiểu nhầm là đã xong. Kèm 3 chốt phụ để nó không bị "thoả"
    bằng cách phá thứ khác (lễ mừng không được ngắn dưới 2 s, không vượt trần 3,5 s, độ trễ > 0).
  - **Đã chứng minh ĐỎ**: nâng lễ mừng lên 5 000 ms (mô phỏng việc thêm màn mở khoá kỷ mới) ⇒ bài
    test đỏ ngay. **480 bài test.**
  - ⚠️ **KHÔNG đổi giá trị 500 ms** — đó là thay đổi hành vi đồng hồ production, thuộc quyền quyết
    của Đàm (phương án A/B ở `TECH_DEBT.md` #12). Việc của phiên này chỉ là làm cho khoản nợ **nhìn
    thấy được và không tự lớn lên**.

- **2026-08-12 (rà nhịp phiên)** — **PHÁT HIỆN: LỄ MỪNG ĐANG BỊ TÍNH VÀO GIỜ NGHỈ.** Rà mục "nhịp
  một phiên thật" của `/goal` và tìm ra một lỗi ĐO ĐƯỢC, không cần thiết bị: với cấu hình MẶC ĐỊNH
  (`autoStartBreak: true`), phiên nghỉ bắt đầu đếm sau **500 ms**, trong khi lễ mừng chạy
  **3 200 ms** và hộp phần thưởng chỉ hiện SAU đó ⇒ đồng hồ nghỉ chạy **2 700 ms trước khi lễ mừng
  kết thúc**, rồi chạy tiếp suốt lúc Đàm đọc hộp phần thưởng (~8–18 giây trên 5 phút, ~3–6%).
  Ý nghĩa mới là chỗ đáng nói: **phần thưởng đang bị trừ vào thời gian nghỉ.**
  ⚠️ **CHƯA SỬA — CÓ CHỦ Ý.** Đây là thay đổi HÀNH VI ĐỒNG HỒ trên app production, mà `useTimer.js`
  là hot spot và **hiện có ĐÚNG 0 bài test** ⇒ sửa lúc này là sửa mà hoàn toàn không có lưới. Đã ghi
  đầy đủ 14 trường vào **`TECH_DEBT.md` mục #12** kèm 2 phương án và lý do cần Đàm quyết. Không
  "tiện tay" sửa hot spot.
  ⚠️ *(Đính chính cùng ngày, muộn hơn: câu này ban đầu tôi viết là "41 bài characterization test
  hiện chưa nối vào `npm test`" — chép lại từ `BAN_GIAO.md` mà không kiểm. Kiểm ra thì bộ test đó
  **chưa từng tồn tại**; xem đính chính đầu file + `TECH_DEBT.md` #13. Đúng cái bẫy tài liệu-không-
  kiểm-chứng mà chính phiên này đã gặp hai lần trước đó.)*

- **2026-08-12 (Phase 3O)** — **KHOÁ LỜI HỨA GAME HOÁ CỐT LÕI BẰNG SỐ, KHÔNG BẰNG GHI CHÚ.**
  Lượt XÁC MINH (không thêm tính năng): đóng hai lỗ hổng nghiệm thu tự tạo ra ở 3M/3N.
  - **Theme tối, 15 kỷ**: đo lại sau 3N — cặp mái gần nhau nhất **8,4** lúc trưa và **7,1** lúc đêm,
    phủ **9/12 múi màu**. Đạt. (Cảnh ban ngày vốn không phụ thuộc theme — `isDark` khi có `daylight`
    nghĩa là "trời đêm", không phải "theme tối".)
  - **Giàn giáo có thật sự lớn lên không** — mệnh đề game hoá cốt lõi nhất của dự án. Đo hàm thuần:
    **cao gấp 3,48 lần** từ khởi công tới sắp xong (0,426 → 1,480). ✅ Đúng như thiết kế.
  - ⚠️ **SUÝT SỬA MỘT THỨ KHÔNG HỎNG.** Ảnh `--pending 4` cho ra bốn công trường trông cao gần bằng
    nhau, nhìn như lỗi. Truy ra thì **fixture của chính công cụ xem thử** đặt `sessionsRemaining:
    i+1` ⇒ bốn công trường chỉ trải tiến độ **50%–88%**, không phải 0%→100%. Lỗi ở CÁI THƯỚC, không
    ở sản phẩm. **Bài học: fixture của công cụ dev cũng phải bị nghi ngờ như mã sản phẩm** — một
    công cụ soi lỗi mà tự nó sai thì tệ hơn không có (đúng họ với cái bẫy `--hour` một-giá-trị đã
    ghi ở đầu `scripts/city-preview.mjs`).
  - **Đã siết bài test `giàn giáo cao dần theo tiến độ`** (`buildingSpec.test.js`): bài cũ chỉ khoá
    HƯỚNG ("cao hơn bước trước") nên một bản sửa làm giàn giáo lớn lên **1,02 lần** vẫn xanh sạch
    trong khi mắt không thấy gì. Đây ĐÚNG cái bẫy "ngưỡng một phía là cái phễu" của 3M, chỉ khác là
    phễu nằm ở ĐỘ LỚN. Thêm 2 khẳng định: (a) tỉ lệ lớn lên đầu→cuối **≥ 3 lần**; (b) từ 80% tới
    xong, **tường đá trong lòng giàn giáo phải dâng thêm ≥10%** — vì khung gỗ CỐ Ý kẹp ở
    `fullHeight` từ ~78% (giàn giáo luôn vượt lên trên phần đã xây), nên nếu không có (b) thì 1–2
    phiên cuối, đúng lúc hồi hộp nhất, sẽ không có gì nhúc nhích.
  - **Cả hai khẳng định đã chứng minh ĐỎ** bằng cách bơm đúng hai hồi quy tương ứng vào
    `buildingSpec.js` rồi khôi phục. **479 bài test.** Không đổi dòng mã sản phẩm nào.

- **2026-08-12 (Phase 3N)** — **15 KỶ NAY RA 15 MÀU MÁI, KHÔNG CÒN HAI CỤM.**
  Cùng bảng quét của 3M còn phơi ra lỗi thứ hai, và lỗi này đánh thẳng vào phần thưởng tiến trình.
  - **Số đo lúc chưa sửa**: 15 góc màu mái dồn vào **ĐÚNG HAI CỤM** — 9°–55° (9 kỷ) và 329°–342°
    (6 kỷ); cả khoảng **60°–320° của vòng tròn màu bỏ trống**. **kỷ 5 ↔ 11 ↔ 12 cách nhau 0°**
    (trùng khít), kỷ 2 ↔ 9 cách 1°, kỷ 6 ↔ 15 cách 4°. Nặng nhất: **kỷ 8 (sắc kỷ 198° LAM) và kỷ
    10 (sắc kỷ 0° ĐỎ) ra hai mái cách nhau 1°** — hai sắc kỷ cách nhau 198° mà cho ra gần như cùng
    một màu. Xác nhận bằng mắt ở cỡ thật: ảnh kỷ 6 (Phong Kiến) và kỷ 15 (Trí Tuệ Nhân Tạo) có mái
    mận **y hệt nhau**, chỉ khác hình dáng.
  - **Nguyên nhân gốc**: vai màu `roof` dùng `material(16, 0.40, …)` → `blend` dựng màu kỷ bằng
    `hslToRgb({ h: eraHue, s: sat, l })`, tức **chỉ giữ GÓC MÀU của kỷ, vứt bỏ độ tươi và độ đậm**.
    Thêm nữa neo 16° (đất nung, ẤM) chỉ nhận 40% sắc kỷ, mà trộn RGB luôn cắt qua vùng trung tính
    ⇒ mọi kỷ có sắc LẠNH (gần đối lập 16°) đều bạc về nâu xám. Kỷ 5 và 12 thì vô phương: chúng có
    **cùng góc màu 215°** (`#94a3b8` xám lam nhạt vs `#64748b` xám lam đậm), khác nhau ĐÚNG ở độ
    tươi và độ đậm — hai thứ đang bị vứt.
  - ⚠️ **Ghi chú cũ ở `roof` khẳng định phép trộn này cho "15 sắc mái phân biệt được".** Điều đó
    **chưa bao giờ được ĐO**, và số đo nói ngược lại. **Bài học: một khẳng định về mỹ thuật mà
    không kèm số đo thì là dự đoán, và dự đoán thì trôi.**
  - **Đã sửa**: thêm `eraRoof()` trong `palette3d.js` — vai màu DUY NHẤT dùng CẢ màu kỷ: sắc kỷ
    0,40 → **0,80**; **độ tươi theo kỷ** (kỷ nhợt → mái xám thật, kỷ rực → mái đỏ gạch); **độ đậm
    theo kỷ**. ⚠️ **VẪN TRỘN RGB, KHÔNG quay lại xoay góc màu** — cả họ lỗi "tím sen" là do nội suy
    góc màu; ở đây góc màu lấy THẲNG của kỷ, chỉ kéo độ tươi/độ đậm (hai đại lượng thẳng, không có
    vòng để lật).
  - ⚠️ **Trần riêng cho dải tím (255°–340°, hạ độ tươi về ≤0,40)**: bản đầu của `eraRoof` làm **ĐỎ
    bài test "KHÔNG một vai màu nào ra TÍM SEN RỰC"** (kỷ 6/7/11 ra 0,51–0,54 > ngưỡng 0,42). Cách
    trả lời ĐÚNG là giữ nguyên GÓC MÀU (ba kỷ vẫn phân biệt được ở 268°/284°/307°) và chỉ hạ ĐỘ
    TƯƠI — **không được đi nới ngưỡng của bài test kia**, vì đó mới là phá bất biến.
  - **Kết quả**: cặp gần nhau nhất **0,0 → 8,4**; 15 góc màu trải từ **3° tới 307°** thay vì hai
    cụm. Đúng chất từng kỷ: Tăm Tối xám lam ảm đạm · Khám Phá xanh biển · Công Nghiệp đỏ gạch ·
    Thế Chiến xám bê tông · Trí Tuệ Nhân Tạo chàm sâu, **khác hẳn** Phong Kiến tím.
  - **Hàng rào mới** (`palette3d.test.js`, đã chứng minh ĐỎ trước phép dựng cũ): khoảng cách màu
    nhỏ nhất giữa 15 mái ≥ 6 · 15 mái phải phủ ≥ 6 múi màu 30° (bản hỏng chỉ phủ 3) · không mái nào
    tươi quá 0,66. **479 bài test.**

- **2026-08-12 (Phase 3M)** — **ĐÊM KHÔNG CÒN LÀ MỘT Ô ĐEN.** Quét lại đủ **15 kỷ × 6 chặng ngày**
  (90 cảnh, ảnh `.city-preview/sweep-light-ky1-15.png`) rồi **ĐO BẰNG MÁY** thay vì nhìn bằng mắt —
  và phép đo phơi ra một lỗi mà 3 phase mỹ thuật trước đều không thấy:
  - **Số đo lúc chưa sửa**: dải THÀNH PHỐ (55% dưới khung hình) lúc 22 giờ có độ sáng trung vị
    **0,023** (≈ 6/255 — một nửa diện tích đen đặc), trong khi bình minh/hoàng hôn được 0,22 và
    giữa trưa 0,456. **Dải động** (p95−p05) đêm 0,129 so với trưa 0,474 ⇒ đêm vừa TỐI NHẤT vừa
    PHẲNG NHẤT. **Độ lệch giữa 15 kỷ lúc đêm chỉ 0,010** — thấp nhất trong 6 chặng, tức **ban đêm
    cả 15 kỷ trông y hệt nhau**: mất sạch phần thưởng của việc đi hết 15 kỷ, đúng vào khung giờ
    Đàm hay làm phiên khuya.
  - **Nguyên nhân gốc — đêm bị làm tối tới BA tầng nhân nhau**, mỗi tầng nhìn riêng đều hợp lý:
    (1) màu đèn lấy từ bầu trời đêm (trời đậm ⇒ ánh sáng đậm theo); (2) nắng yếu đi vì là ánh
    trăng; (3) **SƠN cũng bị hạ sắc độ ở nhánh `isDark`**. Tầng (1)(2) LÀ ban đêm, đúng. Tầng (3)
    là đếm thêm một lần nữa cho cùng một chuyện — mặt đất ban đêm không đổi màu sơn, nó chỉ được
    chiếu ít sáng hơn. ⚠️ Đây là lý do **hai lần vá trước (bơm `fillEnergy` 1,45 → 3,40) không ăn
    thua**: chúng CỘNG vào tầng (1) trong khi thủ phạm ở tầng (3), mà (3) thì NHÂN.
  - **Lỗi thứ hai, ngược chiều**: nắng đêm 1,72 × 0,42 = 0,72 trong khi đèn nền 0,78 × 3,40 = 2,65
    ⇒ **ánh sáng KHÔNG HƯỚNG gấp 3,7 lần ánh sáng CÓ HƯỚNG**. Đó là định nghĩa của một bức phẳng.
    Sự thật ngược lại: đêm chỉ có MỘT nguồn sáng cứng (mặt trăng) ⇒ **đêm là chặng chiaroscuro
    mạnh nhất trong ngày**, không phải yếu nhất.
  - **Đã sửa** (`daylight.js` + `palette3d.js`, đều là engine THUẦN): ánh trăng `sunEnergy`
    0,42 → **1,15**; đèn nền `fillEnergy` 3,40 → **2,60** (vẫn gấp 3,25 lần giữa trưa, vẫn qua bài
    test khoá tỉ lệ cũ); sắc độ đêm của `groundShades` 0,286 → **0,40** và `outskirts` 0,18 → **0,34**.
  - **Kết quả đo lại**: trung vị **0,023 → 0,058** (+152%), trung bình 0,049 → 0,085, dải động
    0,129 → **0,170**, độ lệch giữa các kỷ 0,010 → 0,012. **Năm chặng còn lại KHÔNG đổi một byte**
    (0,203/0,313/0,414/0,300/0,204 y hệt trước) — thay đổi được chặn gọn trong nhánh `isDark`.
  - **Hai hàng rào MỚI, đã chứng minh ĐỎ trước giá trị cũ rồi mới XANH sau khi sửa** (478 bài):
    (a) `daylight.test.js` — "ĐÊM PHẢI CÓ HƯỚNG SÁNG": `sunEnergy/fillEnergy ≥ 0,35`, chặn đúng
    cái bẫy mà bài test cũ ("đèn nền đêm phải gấp ≥3 lần trưa") vô tình tạo ra; (b) `palette3d.test.js`
    — ngưỡng sáng trưa/đêm đổi từ **một phía** sang **hai phía** `(1,25 … 1,75)`.
  - ⚠️ **BÀI HỌC LỚN NHẤT PHIÊN NÀY — "một ngưỡng chỉ chặn một phía thì không phải hàng rào, nó là
    cái phễu."** Bài test cũ chỉ đòi "trưa sáng hơn đêm ≥1,6 lần", nên mặt đất đêm càng tối thì
    càng thoả — lỗi đen thui đi qua hàng rào mà không bài nào đỏ. Ngưỡng mới phải đặt **dưới giá
    trị hỏng thật** (1,93) mới có nghĩa; chọn 1,75 vì lý do đó, không phải vì số tròn.
  - ⚠️ **Bài học thứ hai**: **"tối quá" và "phẳng quá" là hai bệnh khác nhau, và thuốc chữa bệnh
    này làm nặng thêm bệnh kia.** Chỉ đo tổng độ sáng thì vĩnh viễn không phân biệt được — phải đo
    thêm **dải động**. Công cụ đo nằm ở `scripts/city-preview.mjs --sweep` + `scripts/png-probe.mjs`.

- **2026-08-12 (Phase 4′-d)** — **NỐI HAI ĐẦU: PHIÊN THẬT CỦA STORE → CÂU CHỮ HIỆN RA.**
  ⚠️ **Phát hiện một CHỖ HỞ mà cả hai lớp test cũ đều không bịt được.** Phase 4′ có hai lớp kiểm:
  (a) test engine đưa giàn giáo TỰ TAY DỰNG vào → chứng minh engine tính đúng, KHÔNG chứng minh
  store có đưa cho engine đúng thứ đó; (b) soi bằng trình duyệt thì BƠM THẲNG `pendingReward` qua
  `window.__store` → chứng minh giao diện hiện đúng, nhưng cũng bơm tay luôn cái trường đáng lẽ
  phải kiểm. **Chỗ hở nằm chính giữa**: đổi tên trường, đổi thứ tự dọn hàng đợi, hay lọc nhầm kỷ —
  cả hai lớp kia đều KHÔNG đỏ, còn Đàm thì hoàn thành một công trình mà không có lễ mừng nào.
  - `gameStore.cityMoment.test.js` (MỚI, 6 bài) chạy ĐÚNG đường thật: gọi `completeFocusSession()`
    rồi lấy state SAU ĐÓ nuôi thẳng vào `computeCityLayout` + `buildGrowthMoment`/`buildFocusTease`.
    **Không một fixture tự chế nào.** Đã xác minh: gỡ dòng `newlyBuiltIds` khỏi store ⇒ **2 bài ĐỎ**
    ngay (trước đó không có bài nào đỏ cả).
  - Bịt luôn một bất biến an toàn chưa ai kiểm: bài 6 đọc `localStorage` sau một phiên thật và
    khẳng định **`pendingReward` KHÔNG bị lưu xuống đĩa** — tức `ui` vẫn nằm ngoài `partialize`,
    đúng điều kiện đã ghi ở ADR-010 (không thêm byte nào vào JSONB đang tranh chấp CAS). Ai đó đưa
    `ui` vào phần được lưu thì từ nay sẽ đỏ ngay.
  - **Đã tự kiểm hai nguyên nhân làm Vercel FAIL BUILD trong lịch sử dự án** (thứ tôi kiểm được từ
    xa, khác với việc xác nhận "Ready"): **10/12** Serverless Function, và mọi đường dẫn trong
    `vercel.json` (2 `functions` + 2 `crons`) đều trỏ tới file CÓ THẬT. Cả hai cửa tử của sự cố
    `8ee264d` đang sạch.
  - Test **477 xanh** (+6), lint sạch, build xanh.

- **2026-08-12 (Phase 4′-c)** — **KHÉP NỐT ĐẦU VÒNG LẶP: LÚC BẤM BẮT ĐẦU, MÀN HÌNH NÓI PHIÊN NÀY
  ĐỂ LÀM GÌ.** Phase 4′ khép được ĐUÔI vòng lặp (xong phiên → thấy thành phố lớn lên), nhưng ĐẦU
  vòng lặp vẫn phẳng: lúc bấm "Bắt đầu", không có gì nói 25 phút sắp tới để làm gì cho thành phố.
  Thẻ "Chuỗi" đã làm đúng việc này cho streak từ lâu (*"Còn N ngày → mốc"*), còn thành phố thì
  chưa có gì tương đương. Đó là chỗ phẳng cuối cùng của chữ "chán".
  - Một DÒNG ngay dưới lời chào, trên đồng hồ. Ba giọng:
    · `Đang xây Thư Viện Khoa Học · còn 2 phiên` (bình thường)
    · **`Phiên tới hoàn thành Thư Viện Khoa Học`** (màu nhấn, đậm — đây mới là lúc đáng bấm Bắt đầu)
    · `Xưởng đang trống — phiên xong lúc này không đẩy công trình nào tiến thêm`
  - ⚠️ **IM LẶNG với người MỚI**: chưa từng xây gì thì KHÔNG hiện câu "xưởng trống". Người mới chưa
    có xưởng để mà trống; nhắc lúc đó là trách móc một việc họ còn chưa biết là có.
  - ⚠️ **KHÔNG hứa hẹn gì về nguyên liệu.** Luật "bản vẽ nào khởi công được" là của
    `BuildingWorkshop` (unlock · đúng kỷ · chưa xây · đủ tài nguyên). Chép sang đây là tạo bản sao
    sẽ trôi khỏi bản gốc — và một lời mời "xây đi" mà bấm vào thì không đủ nguyên liệu còn tệ hơn
    im lặng. Có bài test cấm mọi từ hứa hẹn trong câu đó.
  - ⚠️ **HAI BÀI HỌC VỀ CHỖ ĐẶT (đều do ảnh chụp khung 390px chỉ ra, không phải suy luận)**:
    (a) **`FocusRail` là `hidden … lg:flex` — CHỈ hiện trên màn rộng.** Đặt thẻ ở cột phải là đặt
    vào chỗ Đàm KHÔNG BAO GIỜ nhìn thấy, vì anh làm việc chủ yếu trên iPhone. Phải đặt ở cột giữa.
    (b) Đặt SAU `PomodoroEngine` thì nằm **dưới nếp gấp** — thẻ đồng hồ cao gần hết màn iPhone.
    Ảnh chụp lần đầu không thấy dòng nào cả. Đã chuyển lên NGAY DƯỚI lời chào, trước đồng hồ.
  - **Dọn nợ luôn**: `useCityGrowthMoment.js` đổi thành `useCityMoment.js` chứa CẢ HAI hook, dùng
    chung một `useCitySnapshot` — thay vì chép đoạn "khoá theo nội dung + dựng bố cục" lần thứ ba
    trong dự án. Engine cũng gộp: `pickNearestScaffold` dùng chung cho cả hai đầu phiên, nên hai
    màn hình không thể nói về hai công trình khác nhau (có test khoá đúng điều đó).
  - **Chi phí đã biết, chấp nhận có chủ ý**: trang chủ nay dựng bố cục thành phố 2 lần (lớp nền 3D
    + dòng này). Hook không chia sẻ được `useMemo` giữa hai component nếu không dựng context/cache
    — mà cả hai đều memo theo NỘI DUNG nên chỉ tính lại mỗi phiên một lần, không phải mỗi lượt
    render. Không đáng dựng thêm một tầng context cho việc đó.
  - Đã soi bằng trình duyệt thật ở khung iPhone 390px: **cả ba giọng đều ra đúng chữ**. Test
    **471 xanh** (+6), lint sạch, build xanh. Gói riêng 1,01 KB (0,58 KB gzip).

- **2026-08-12 (Phase 4′-b)** — **CHUÔNG THÔNG BÁO NỔI TRÊN MỌI HỘP THOẠI SUỐT BAO LÂU NAY.**
  Chụp một ảnh khung iPhone của lễ mừng Phase 4′ để xem có tràn không, thì thấy **cái chuông sáng
  trưng nổi lên trên lớp mờ**. Đo lại bằng `elementFromPoint` trong trình duyệt thật: chuông ở
  `z-[75]`, mà **TẤT CẢ hộp thoại của app đều thấp hơn** (z-50: phần thưởng/thảm hoạ/khủng hoảng/
  thăng hoa/báo cáo tuần · z-[60]: Coach, thăng cấp, hướng dẫn · z-[70]: lễ mừng). Tức là **lỗi
  này CÓ SẴN TỪ LÂU và ảnh hưởng tới cả màn hình phần thưởng** — không phải do Phase 4′ gây ra;
  Phase 4′ chỉ là cái làm nó lộ ra.
  - Sửa đúng MỘT chỗ: chuông `z-[75]` → **`z-[45]`**. Vẫn cao hơn mọi nội dung trang thường
    (z-1/z-2) và thanh nổi đáy màn (z-40), nhưng thấp hơn sàn của dải hộp thoại (z-50).
  - Khoá bằng `src/components/notificationLayer.test.js` (3 bài, **đã xác minh ĐỎ** trên số cũ):
    bài 2 **quét cả thư mục** `*Modal.jsx` nên một hộp thoại mới ra đời với z quá thấp sẽ bị bắt
    ngay, không cần ai nhớ sửa test.
  - ⚠️ **BÀI HỌC — bài test suýt phát tín hiệu an toàn GIẢ**: regex đọc lớp z ban đầu đặt `\b` sau
    `]`, mà `]` lẫn dấu cách đứng sau đều không phải ký tự từ ⇒ **mọi lớp dạng `z-[70]` lặng lẽ
    biến mất**, bài quét sẽ XANH trong khi chẳng đo gì cả. Bắt được nhờ chạy thử trên số cũ và
    thấy nó KHÔNG đỏ như đáng lẽ phải thế. Quy tắc: bài test mới nào cũng phải xem nó ĐỎ một lần.
  - ⚠️ **BÀI HỌC — `{/* … */}` không đứng cạnh phần tử gốc được**: đặt chú thích JSX ngay trước
    `<div>` trong `return ( … )` là **hai nút gốc** ⇒ build FAIL. Chú thích giải thích cho cả
    component thì để dạng `//` phía trên `return`.
  - Test **465 xanh** (+3), lint sạch, build xanh. Đã soi lại trong trình duyệt: chuông nay nằm
    dưới cả lễ mừng lẫn màn hình phần thưởng, và vẫn bấm được bình thường khi không có hộp thoại.

- **2026-08-12 (Phase 4′)** — **3,2 GIÂY ĐƯỢC NHÌN THẤY THÀNH PHỐ LỚN LÊN.**
  Đàm: *"mọi thứ phải hoàn hảo và không bị chán"*. Ba phase trước đã làm thành phố **đọc được**
  (còn bao xa) và **sờ được** (chạm vào xem) — nhưng đúng khoảnh khắc đáng giá nhất, lúc chuông báo
  hết 25 phút, Đàm vẫn chỉ thấy một hộp thoại vật phẩm. Thành phố có lớn lên thật, chỉ là **anh
  không được nhìn thấy nó lớn lên**. Đây là mắt xích cuối của vòng lặp "làm việc → thấy thành quả".
  - Sau mỗi phiên, nếu thành phố THẬT SỰ có gì đổi: một thẻ hiện lên 3,2 giây — biểu tượng công
    trình, tên nó, và **thanh tiến độ chạy từ vạch của phiên trước tới vạch bây giờ**. Đó mới là
    nội dung cảm xúc: mắt nhìn thấy cái nấc vừa nhích lên, chứ không phải đọc một con số.
  - ⚠️ **TRUNG THỰC HƠN HIỆU ỨNG**: `buildGrowthMoment` trả `null` khi thành phố không đổi gì —
    đi thẳng vào phần thưởng, không khen rỗng. Một lời khen sai MỘT lần thì mọi lời khen sau đều
    mất giá (cùng nguyên tắc chống-bịa của AI Coach). Vạch xuất phát đọc `acceleratedCraftingIds`
    để biết phiên này đẩy 1 hay 2 bước — không đoán.
  - ⚠️ **ĐIỂM CẮM**: KHÔNG đụng store. `lootModalOpen` vẫn bật đồng bộ (ba bài test hiện có khẳng
    định), chỉ phần HIỂN THỊ được chen thêm một chặng qua `RewardSequence` trong `App.jsx`. Lý do
    đầy đủ + hai phương án bị loại: **ADR-010**.
  - ⚠️ **CỔNG HỎNG THEO HƯỚNG MỞ**: phần thưởng hiện ra TRỪ KHI khoảnh khắc đang thật sự chạy.
    Không có gì để khoe · bật giảm chuyển động · dữ liệu lạ — mọi nhánh đều dẫn thẳng tới phần
    thưởng. Cộng: một chạm là bỏ qua, và đồng hồ bảo hiểm 3,2 giây.
  - **ĐÃ SOI TẬN MẮT bằng trình duyệt thật** (Chromium + CDP, Supabase bị chặn ở tầng DNS nên
    không có đường nào ghi vào dữ liệu thật): (A) có công trường ⇒ khoảnh khắc chặn trước phần
    thưởng; (B) tự nhường chỗ, đo được **giữ sóng 3070 ms** (mã đặt 3200); (C) không có gì để khoe
    ⇒ phần thưởng hiện NGAY. **3/3 đạt, chạy lại 2 lần đều đạt**, không lần nào hiện cả hai.
  - ⚠️ **HAI BÀI HỌC ĐO LƯỜNG (nhớ kỹ, đã trả giá cả hai)**:
    (a) **Đọc đồng hồ, đừng đếm nhịp.** Bản đo đầu đếm số lần lấy mẫu rồi nhân 100 ms — nhưng mỗi
    lần lấy mẫu còn tốn một vòng gọi CDP dài ngắn tuỳ máy đang bận, nên CÙNG một đoạn code cho ra
    "3,2 giây" ở lần chạy này và "0,4 giây" ở lần chạy sau. Suýt nữa thì đi sửa một con bug không
    tồn tại.
    (b) **`innerText` trả về chữ ĐÃ áp `text-transform`.** Nhãn `LootDropModal` có class
    `uppercase`, nên tìm đúng chuỗi gốc `'Phiên Hoàn Tất'` KHÔNG khớp — phép thử báo "phần thưởng
    không hiện" trong khi nó đang hiện chình ình. So chữ trên DOM thì phải bỏ phân biệt hoa/thường.
  - **Đã vá luôn một hồi quy do chính phase này gây ra**: đo bằng máy thấy gói mã của màn phần
    thưởng chỉ **bắt đầu tải SAU khi khoảnh khắc kết thúc** — tức là ta vừa đẩy nó lùi 3,2 giây so
    với trước, và trên mạng yếu cái giá đó là một khoảng trắng ngay sau 25 phút làm việc thật.
    `createRecoverableLazy` nay có `preload()`; đo lại: gói phần thưởng bắt đầu tải ở mốc **326 ms**,
    xong từ lâu trước khi khoảnh khắc hết.
  - ⚠️ **KHÔNG dựng cảnh 3D trong khoảnh khắc này** — trang chủ đã giữ một WebGL context cho lớp
    nền; mở context thứ hai đúng lúc máy vừa chạy xong 25 phút là cách nhanh nhất để iOS thu hồi
    cả hai.
  - Test **462 xanh** (+13: 10 bài `cityMoment` + 3 bài `runtimeRecovery`), lint sạch, build xanh.
    Gói `CityGrowthMoment` tách riêng 2,22 KB (1,06 KB gzip) — không làm gói chính to thêm.

- **2026-08-12 (Phase 3L)** — **NÓI CHO ĐÀM BIẾT LÀ CHẠM ĐƯỢC.**
  ⚠️ **Một tính năng không ai biết là một tính năng không tồn tại.** Chạm-vào-công-trình dựng xong
  ở Phase 3K nhưng KHÔNG có gì trên màn hình nói rằng nó tồn tại — cảnh 3D trông y hệt một bức
  tranh, và không ai đi chạm thử vào một bức tranh. Suýt nữa thì cả Phase 3K nằm im.
  - Dòng nhắc dưới cảnh: *"Kéo để xoay · chạm vào công trình để xem chi tiết"*.
  - Trên máy tính thêm **con trỏ đổi hình** khi rê chuột qua một công trình (`pointer` ↔ `grab`) —
    dùng lại đúng phép dò của Phase 3K, là toán thuần trên dăm cái hộp nên rê chuột liên tục cũng
    không tốn gì; chỉ ghi `style.cursor` khi GIÁ TRỊ ĐỔI, không ghi mỗi lần chuột nhích.
  - Cả hai đều tắt ở lớp nền trang chủ. Đã thêm test khoá `chrome={false}` cho `CityBackdrop` —
    đó là công tắc gom mọi thứ chữ nghĩa của `CityStage` (câu báo lùi-2D, HUD, và nay là dòng
    nhắc); mất nó thì một dòng hướng dẫn kỹ thuật nổi lên ngay sau lưng đồng hồ đếm ngược.
  - Test **449 xanh** (thêm assertion vào bài sẵn có, không thêm bài mới), lint sạch, build xanh.

- **2026-08-12 (Phase 3K)** — **CHẠM VÀO CÔNG TRÌNH ĐỂ BIẾT NÓ LÀ AI.**
  Đàm: *"game hoá lên… đột phá hơn"*. Cho tới trước Phase này, thành phố 3D là một BỨC TRANH —
  kéo xoay được, đẹp, nhưng không chạm được vào bất cứ thứ gì. Nay chạm vào một căn nhà thì nó tự
  nói tên · loại · độ hiếm · cấp · **đặc quyền nó đang mang lại**; chạm vào giàn giáo thì nói
  **còn mấy phiên nữa** và **sẽ mở khoá gì**. Chạm ra chỗ trống thì thẻ tự đóng.
  - ⚠️ **KHÔNG dùng `Raycaster.intersectObjects` của three.js, và đây là quyết định đáng nhớ
    nhất.** Cả thành phố được gộp vào ĐÚNG MỘT khối hình học để chỉ tốn một lệnh vẽ — ném tia vào
    khối đó thì chỉ biết trúng "thành phố", không biết trúng CĂN NÀO. Muốn biết thì phải tách 75
    mesh riêng, tức là **vứt bỏ đúng cái tối ưu lớn nhất của cả bộ vẽ** để phục vụ một cú chạm mỗi
    vài phút. Cách đã chọn: `sceneGraph` xuất thêm `pickTargets` — **dữ liệu thuần**, mỗi công
    trình một hộp bao; **0 tam giác, 0 lệnh vẽ, không cần dọn ở `dispose()`**. Phần khó (tia cắt
    hộp kiểu "slab", chọn cái gần camera nhất) nằm ở `engine/city3d/pick.js`, THUẦN, 13 bài test
    chạy bằng `node --test`. `CityScene3D` chỉ làm đúng việc three buộc phải làm hộ: đổi toạ độ
    điểm ảnh thành một tia.
  - ⚠️ **Và KHÔNG chỉ cắt tia với mặt đất rồi quy ra ô lưới** (cách rẻ hơn, từng định làm): cảnh
    nhìn xiên, nên chạm vào NÓC một toà tháp thì tia đi tiếp và cắt mặt đất ở tận ô phía SAU nó.
    Càng nhà cao càng lệch. Hộp bao đúng với cả nhà cao lẫn nhà thấp.
  - ⚠️ **`TAP_SLOP = 8` điểm ảnh — đừng để 0.** Không ai chạm màn hình cảm ứng mà giữ yên tuyệt
    đối được; ngón tay luôn trượt vài điểm ảnh khi nhấc lên. Để 0 thì trên iPhone gần như KHÔNG
    BAO GIỜ chạm trúng, còn trên máy tính (chuột đứng yên thật) lại chạy tốt — **đúng kiểu lỗi chỉ
    Đàm gặp còn người viết code thì không**. Và phải đo khoảng cách XA NHẤT đã rời khỏi điểm đặt
    tay, chứ không đo lúc nhấc tay: kéo xoay một vòng rồi thả về chỗ cũ vẫn là một cú KÉO.
    Đã kiểm thật: kéo 150px → không mở thẻ · nhích 4px → vẫn mở thẻ · chạm 3/3 lần đều đúng.
  - **Lớp nền trang chủ KHÔNG chạm được** (hai lớp chặn + test): một thẻ thông tin bật lên sau
    lưng đồng hồ đếm ngược vì lỡ chạm là đúng thứ phá mất sự yên tĩnh mà màn hình đó tồn tại để
    giữ. Thẻ nổi cũng phải `pointer-events-none` ở lớp bọc + `pointer-events-auto` ở chính thẻ —
    thiếu là cả dải trống hai bên thẻ nuốt mất thao tác kéo xoay (đã có test khoá).
  - **Dòng trong danh sách bên dưới được tô sáng theo lựa chọn** — nếu không, chạm vào một khối
    nhà xong Đàm vẫn không biết nó ứng với dòng nào; nối lại thì hình và chữ thành CÙNG một thứ
    nhìn theo hai cách.
  - **Bài học công cụ**: `--window-size=390,844` của headless Chromium **KHÔNG** cho ra khung
    390px — headless kẹp cửa sổ ở tối thiểu 500px, đo mới biết. Nghĩa là mọi ảnh chụp "iPhone"
    trước đó đều rộng hơn máy thật 110px, đúng quãng làm một bố cục chật trông thoải mái. Phải
    dùng `Emulation.setDeviceMetricsOverride` qua CDP. Đo lại ở 390px thật: **không tràn ngang**
    (`scrollWidth === clientWidth === 390`), thẻ thông tin vừa khung.
  - Test **449 xanh** (thêm 15 bài), lint sạch, build xanh, `vendor-three` vẫn 131 KB gzip.

- **2026-08-12 (Phase 3J)** — **THANH CHUYỂN KỶ TỰ KÉO KỶ ĐANG XEM VÀO TẦM MẮT.**
  Một lỗi *chỉ lộ ra khi chơi lâu*, nên gần như không thể bắt bằng mắt lúc đang làm: các kỷ đã đi
  qua xếp TRƯỚC kỷ hiện tại trong thanh cuộn ngang, nên càng nhiều kỷ thì cái nút DUY NHẤT Đàm
  quan tâm càng bị đẩy ra ngoài màn hình. **Đo trên bản build thật ở kỷ 7**: nội dung 999px trong
  khung 952px ⇒ nút "Kỷ 7 · đang xây" cụt mất 47px ở MỌI lần mở tab; tới kỷ 15 thì khuất hẳn, mở
  tab lên chỉ thấy một dãy "thất truyền" xám.
  - **Hai cái bẫy đã dẫm phải trong lúc sửa, cả hai đều "chạy thử thấy đúng":**
    (a) `scrollIntoView` kéo luôn cả khung cha ⇒ mở tab thì trang tự nhảy xuống giữa chừng — phải
    tự tính `scrollLeft` của riêng thanh này. (b) `offsetLeft` tính từ `offsetParent`, mà thanh này
    `position: static` nên offsetParent là một khung ở tận ngoài: số đo ra **1151 trong khi toàn bộ
    nội dung thanh chỉ rộng 999**. Ở kỷ hiện tại (nút cuối) sai số đó bị kẹp về đúng mép phải nên
    trông vẫn đúng — **thử ở kỷ hiện tại sẽ KHÔNG thấy sai**, chỉ các kỷ giữa mới cuộn quá tay.
    Phải đo bằng `getBoundingClientRect`.
  - ⚠️ **Bài học lớn nhất: căn một lần là không đủ.** Bản vá đầu tiên đã đúng công thức mà vẫn
    KHÔNG chạy — vì lần chạy đầu rơi vào lúc font riêng của skin chưa nạp xong, các nút còn hẹp,
    thanh chưa tràn khỏi khung nên `max = 0` và hàm thoát ra. Font nạp xong thì chữ nở ra, thanh
    mới tràn — lúc đó không còn ai gọi lại. Phải gắn `ResizeObserver`. **Chỉ phát hiện được nhờ đo
    thẳng trên trang thật** (`scrollLeft` vẫn bằng 0 sau khi đã build và deploy code đúng) — nhìn
    code thì bản vá đầu tiên hoàn toàn hợp lý.
  - Test khoá cả 5 điều trên (`cityRenderers.test.js`), **đã kiểm chứng nó ĐỎ thật** khi đổi ngược
    về `offsetLeft`. Thêm helper `codeOnly()` bỏ chú thích trước khi so — dự án này viết chú thích
    dài và hay giải thích ngay tại chỗ *vì sao KHÔNG dùng* thứ bị cấm, nên so trên nguyên văn file
    thì chính lời giải thích làm test đỏ (đã dính đúng một lần), và người sửa sẽ bị dụ đi xoá chú
    thích thay vì xoá lỗi.
  - Test **434 xanh**, lint sạch, build xanh.

- **2026-08-12 (Phase 3I)** — **BẢNG "ĐANG XÂY": CÒN BAO XA, VÀ ĐI TỚI ĐÓ ĐỂ LÀM GÌ.**
  Phase 3H dựng được giàn giáo trong cảnh, nhưng nhìn giàn giáo thì Đàm chỉ biết "chỗ này sắp có
  nhà" — đẹp, mà không hành động được. Nay dưới cảnh có một bảng liệt kê công trình đang xây, mỗi
  dòng nói **còn mấy phiên** + thanh tiến độ + **mở khoá đặc quyền gì**.
  - **Nói bằng SỐ PHIÊN, không phải phần trăm.** "Đã xong 67%" nghe thì chính xác mà chẳng bảo anh
    phải làm gì; "còn 2 phiên" là một mục tiêu cho chiều nay. Kẹp ở engine (`remaining` luôn nằm
    trong `[0, total]`) để dữ liệu lệch một nhịp không rò ra màn hình thành "còn 99 phiên".
  - **Dòng "Mở khoá: …" là nửa còn lại của câu.** Số phiên trả lời CÒN BAO XA; không có nhãn phần
    thưởng thì vẫn thiếu ĐI TỚI ĐÓ ĐỂ LÀM GÌ, và thanh tiến độ chỉ còn là một thanh tiến độ. Lấy
    `perk.label` (ngắn) chứ không lấy `perk.summary` (dài cả câu, nhét vào một dòng sẽ tràn). Có
    test quét đủ **75 công trình của 15 kỷ**, khoá luôn cả độ dài ≤40 ký tự — nếu ai đó đổi
    `perk.label` thành tên khác trong `constants.js` thì `reward` sẽ lặng lẽ thành `null` ở CẢ 75
    công trình mà không bài test nào kêu (lại đúng cái bẫy `?? []` của Phase 3H).
  - **Gần xong nhất nằm trên đầu**, in đậm + số phiên tô màu kỷ. ⚠️ Sắp xếp bằng một BẢN SAO
    (`buildQueueOrder`) — `layout.scaffolds` đã được sắp theo chiều sâu đẳng cự cho bộ vẽ, đảo tại
    chỗ sẽ làm nhà đằng trước che nhà đằng sau. Hoà nhau thì so `bpId` để danh sách không tự nhảy
    chỗ giữa hai lần vẽ.
  - **Hai chỗ khác cùng sửa cho khỏi nói dối**: ô số liệu thứ tư đổi từ "Cảnh vật" (bao nhiêu cái
    cây thì cũng thế) sang "Đang xây" khi có công trường; và trạng thái "Bãi đất trống" nay chỉ
    hiện khi **vừa không có công trình vừa không có công trường** — trước đó lần đầu Đàm khởi công,
    mở tab lên xem thành quả thì nhận đúng chữ "chưa có gì".
  - **Công cụ mới `scratchpad/shoot.mjs`** (lái Chromium qua CDP): bấm được vào tab rồi mới chụp,
    và cuộn tới đúng chữ cần soi (`--tab city --queue --find "Đang xây" --phone/--dark`). Bản cũ
    `shoot-home.mjs` dùng cờ `--screenshot` nên chỉ chụp được trang đầu — mà tab của app là
    `useState` trong React, **không seed qua localStorage được**. ⚠️ Vẫn giữ nguyên chặn Supabase ở
    tầng phân giải tên miền. Đã soi tận mắt: sáng/tối/iPhone 390px đều gọn.
  - Test **433 xanh** (thêm 2 bài), lint sạch, build xanh.

- **2026-08-12 (Phase 3H)** — **THÀNH PHỐ LỚN LÊN SAU MỖI PHIÊN, KHÔNG PHẢI MỖI TUẦN.**
  Đàm: *"game hoá lên… không bị chán"*. Đây là chỗ chữ "chán" có một nguyên nhân đo được, không
  phải cảm giác: trước tính năng này thành phố **chỉ đổi khi một công trình HOÀN THÀNH** — mà công
  trình rẻ nhất ngốn 4 phiên, đắt nhất 11 phiên. Nghĩa là Đàm hoàn toàn có thể làm việc cả tuần
  liền và thành phố **không nhúc nhích một pixel nào**. Vòng lặp "làm việc → thấy thành phố lớn
  lên" đứt đúng ở quãng dài nhất, tức là đúng lúc cần nó nhất.
  Nay công trình đang xây hiện thành **giàn giáo gỗ**, mỗi phiên xong lại mọc cao thêm một nấc và
  thêm một tầng giằng. Đặt ở lớp nền trang chủ (Phase 3F) thì nấc vừa mọc nằm **đúng trong tầm mắt
  lúc Đàm bấm Bắt đầu phiên kế tiếp**.
  - ⚠️ **Hoá ra 90% đã có sẵn từ trước mà không ai nối lại.** `craftingQueue` đã lưu
    `{bpId, sessionsRemaining}` từ lâu; `BUILDING_EFFECTS[].sessionsToComplete` đã có; `sceneGraph`
    đã đọc `layout.scaffolds`; `buildScaffoldSpec` đã viết xong và đã có test. Thiếu **đúng một
    thứ**: `computeCityLayout` chưa bao giờ sinh ra `scaffolds`, nên `layout.scaffolds ?? []` luôn
    rỗng và cả tính năng im lặng không tồn tại. Bài học: `?? []` là chỗ một tính năng chết mà
    không ai nhận ra — nó không hỏng, nó chỉ *không có gì*.
  - **Nhận thẳng shape của `craftingQueue`**, không bắt bên gọi tự tính `progress`: tri thức "còn
    mấy phiên trên tổng bao nhiêu" chỉ nên nằm một chỗ, nếu không tab Thành Phố và lớp nền trang
    chủ sẽ có ngày hiện hai độ cao khác nhau cho cùng một công trình.
  - **Bảo tàng KHÔNG có giàn giáo** — thành phố đã niêm phong thì chẳng còn ai đang xây gì; dựng
    giàn giáo lên đó là nói dối về quá khứ (bất biến "bảo tàng bất động", ADR-007). Ba lớp chặn:
    store đã gạn theo kỷ, `CityView` chỉ truyền `pending` khi đang xem kỷ hiện tại, và
    `computeCityLayout` lọc theo kỷ lần nữa.
  - **Bộ vẽ 2D cũng có giàn giáo.** Hai bộ vẽ được phép khác nhau về ĐỘ ĐẸP, không được khác nhau
    về NỘI DUNG — nếu không thì đúng người dùng máy yếu nhất (phải lùi về 2D) là người mất vòng
    lặp động viên, trong khi họ chẳng làm gì sai.
  - **Sửa hình giàn giáo sau khi nhìn ảnh chụp**: bản đầu chỉ có giằng ở hai mặt đối nhau và ảnh
    chụp ra thứ trông y như **một cái cổng dựng giữa đồng** — mắt không khép được khối. Thêm hai
    thanh xoay 90° (`ry`) thành cái lồng, cho cột luôn cao hơn phần đã xây (giàn giáo thật bao giờ
    cũng vượt lên trên chỗ thợ đang làm, và nó cho thấy công trình SẼ cao tới đâu), thêm đống vật
    liệu dưới chân vơi dần khi sắp xong.
  - **Test**: 430 bài (+5), có bài khoá **"không truyền `pending` ⇒ bố cục giống hệt TỪNG BYTE"** —
    rủi ro #31 của kế hoạch, vì đây là hàm quyết định vị trí MỌI THỨ và ADR-007 hứa bảo tàng bất
    động. Cùng bài khoá ca "vừa xây xong nhưng hàng đợi chưa kịp dọn" (xảy ra thật, một nhịp sau
    phiên hoàn thành) — nếu không, căn nhà mới toanh sẽ mọc lên trong lòng một bộ giàn giáo đúng
    lúc đáng ăn mừng nhất.

- **2026-08-12 (công cụ)** — **`scripts/png-probe.mjs`: ĐO màu điểm ảnh thật trên ảnh đã chụp.**
  Tự giải mã PNG bằng `zlib` có sẵn của Node, KHÔNG thêm dependency. Ra đời vì một nghi ngờ đúng:
  **bảng màu và màu hiện lên màn hình là hai thứ khác nhau**, giữa chúng còn cường độ đèn (nắng
  2,15 — nhân màu gốc lên hơn hai lần), phép kẹp kênh khi tràn 255, rồi tone mapping.
  ⚠️ **Số đo cụ thể, và nó là một giới hạn phải nhớ**: mái kỷ 6 trong bảng màu là `#77425a`
  (độ tươi 0,29) nhưng **trên màn hình đo được `#5a1733` — độ tươi 0,59, tức GẤP ĐÔI**. Mặt phẳng
  (mặt đất) thì khớp gần như hoàn hảo (`#98957b` → `#8e896d`); chênh lệch nằm ở các mặt DỐC như
  mái, vì chúng nhận ít sáng hơn nhiều.
  ⇒ **Các bài test mỹ thuật ở `palette3d.test.js` canh ĐẦU VÀO, không chứng minh được thứ Đàm nhìn
  thấy.** Chúng vẫn đáng giá (bắt được cả 6 lỗi Phase 3G), nhưng đừng đọc chúng như một lời bảo
  đảm về màn hình. Muốn chắc thì chụp rồi `node scripts/png-probe.mjs <ảnh> --top 10`.

- **2026-08-12 (Phase 3G)** — **QUÉT ĐỦ 15 KỶ × 6 CHẶNG NGÀY, VÀ VÁ 6 LỖI MỸ THUẬT NÓ PHƠI RA.**
  Đàm: *"quét đủ 15 kỷ × 6 chặng ngày đi… đánh bóng mọi thứ lên, mọi thứ phải hoàn hảo và không bị
  chán"*. Làm được đúng thế: 90 ô × 2 theme = **180 cảnh**, xem tận mắt từng ô.

  **⚠️ BÀI HỌC LỚN NHẤT — công cụ soi quyết định thứ soi được.** Trước đây mỗi lần chụp một ảnh
  rời, và soi kiểu đó **không hề bắt được lỗi nào trong 6 lỗi dưới đây**, dù chúng đã chạy trên
  production nhiều ngày. Lý do: cả 6 đều là lỗi **so sánh** — một mặt đất màu cỏ trông vẫn "bình
  thường" cho tới khi đặt cạnh mặt đất đất-son của kỷ bên; một chân trời xám chỉ lộ ra khi nằm
  giữa chân trời hồng của bình minh và chân trời hồng của hoàng hôn. Xếp 90 ô vào **một tấm ảnh**
  là thứ biến chúng từ vô hình thành hiển nhiên. `scripts/city-preview.mjs --sweep` (một bundle,
  MỘT WebGL context dùng lại, ~21 giây cho 5 kỷ) là công cụ, không phải sản phẩm phụ.

  **6 lỗi, mà hoá ra 4 trong số đó là CÙNG MỘT LỖI:**
  1. **Mái nhà tím sen rực ở 6/15 kỷ** (kỷ 5, 6, 8, 11, 12, 15 — đo được góc màu 305–342° ở độ tươi
     0,50). 2. **Mặt đất màu cỏ nhân tạo ở 7/15 kỷ** (102–117°) trong khi kỷ 7 và 11, *cùng họ màu
     lam-tím*, lại ra đất nâu. 3. **Ô cửa kính ngả tím** ở kỷ sắc cam. 4. **Ánh trăng màu XANH LỤC**
     (`#93beb4`) — sống sót lâu vì chỉ hiện lúc 19–4 giờ.
     → Cả bốn là **cùng một cái bẫy `mixHue` đã cắn dự án lần thứ tư**: nội suy GÓC MÀU luôn đi
     đường ngắn trên vòng tròn màu, mà (a) từ lam sang đất nung thì đường ngắn **chạy xuyên qua
     vùng tím**, và (b) hai góc cách nhau ~180° thì **hướng đi lật ngẫu nhiên**. Ba lần trước đều
     vá riêng lẻ đúng chỗ vừa phát hiện. Lần này vá **PHÉP PHA**: mọi sắc kỷ nay trộn trong RGB
     (`blend`/`material` trong `palette3d.js`) — đi qua màu XÁM đúng như người vẽ pha bột màu, nên
     **không đầu vào nào còn đẻ ra được màu tím và không còn chỗ nào để lật hướng.** Phần thưởng
     kèm theo chính là thứ làm ra "chất tranh": trộn RGB tự bạc màu ở giữa, nên kỷ có sắc đối lập
     ra mái TRẦM (xám tía, mận chín, rượu vang) còn kỷ sắc gần ra mái TƯƠI (đất nung, vàng đất) —
     15 kỷ 15 sắc mái, không sắc nào rơi ra ngoài dải vật liệu có thật.
  5. **Theme tối thì GIỮA TRƯA cũng tối như nửa đêm** — lỗi nặng nhất. `isDark` cũ trả lời hai câu
     hỏi khác nhau bằng một biến. Nguyên tắc chốt lại: **thành phố là một Ô CỬA SỔ** — cảnh nhìn
     qua cửa sổ không tối đi vì ta sơn tường phòng màu đen. Nay có `daylight` ⇒ **đồng hồ quyết**;
     không có (bảo tàng, chỗ gọi cũ) ⇒ vẫn theo theme y như trước. Đóng luôn `TECH_DEBT #11`.
  6. **Chân trời 8 giờ sáng ra XÁM CHẾT** (đo được độ tươi **0,06**) còn bình minh thì ĐỈNH trời ra
     nâu ô-liu — vì cả vòm trời dùng chung một đích. Tách thành `skyHue` (đỉnh, luôn lạnh) và
     `horizonHue` (chân, luôn giữ hơi ấm — trừ đêm). Thêm: **vùng đất ngoài phố** (chiếm nhiều
     diện tích hơn cả trời lẫn thành phố cộng lại) nay pha về đúng màu chân trời của chặng, tức
     phối cảnh không khí thật; **mặt nước** thôi là miếng dán lam bất biến (`#7f9ebd` y hệt ở 5
     chặng) mà bắt lửa theo chân trời; **đèn cửa sổ** mờ dần theo `lampEnergy` thay vì sáng y hệt
     lúc 6 giờ sáng và 10 giờ đêm; giữa trưa hạ cao độ nắng 0,92→0,84 và đèn nền 0,92→0,80 để khối
     có lại mặt sáng/mặt tối (cột 12 giờ trước đây phẳng nhất, nhạt nhất cả bảng).

  **Nghiệm thu**: 425 test xanh (+7 bài mới), lint sạch, build xanh. ⚠️ **Cả 5 bài test mới đều đã
  được xác minh ĐỎ trên code cũ trước khi nhận** — một bài test mỹ thuật chưa từng đỏ thì không
  chứng minh được gì. Đã chụp lại và soi đủ 180 cảnh sau khi vá.

- **2026-08-12 (deploy)** — **Gộp cả 4 commit Thành Phố vào `main` → lên production.**
  ⚠️ **Bài học vận hành, dễ mất thời gian nếu quên**: cả 4 commit ban đầu chỉ nằm ở nhánh
  `claude/xay-san-pham-huong-nay-nasr3n`. Đàm chờ 5 phút không thấy gì đổi trên
  `pomodoro-dc.vercel.app` và tưởng deploy hỏng. **Vercel CHỈ cập nhật production khi có push vào
  `main`**; push vào nhánh khác chỉ sinh bản Preview (lại còn thường bắt đăng nhập Vercel mới xem
  được trên iPhone — gói Hobby). Trang Overview của Vercel có nói thẳng điều này ở dòng *"To update
  your Production Deployment, push to the `main` branch"*, nhưng rất dễ lướt qua.
  ⇒ **Từ nay: xong việc mà Đàm cần THẤY trên máy thật thì phải hỏi gộp vào `main`, đừng dừng ở
  nhánh rồi báo "đã deploy".** Gộp lần này là **fast-forward, 0 xung đột** (main đang ở `2c24e0f`,
  là tổ tiên trực tiếp) — `2c24e0f..4f371ad`. Đã chạy lại 360 test + lint + build ngay trước khi
  push, và đếm lại Serverless Function: **10/12**, còn dư 2.

- **2026-08-12 (Phase 3F)** — **THÀNH PHỐ RA TRANG CHỦ.**
  Đàm: *"đem nó ra trang chủ hoặc làm cái gì đó đột phá hơn nữa"*. Đây là thay đổi ít code nhất mà
  nặng ký nhất của cả nhánh 3D: **thứ Đàm xây được trước nay gần như vô hình đúng vào lúc anh đang
  xây nó** — thành phố nằm trong một tab riêng, mà lúc đang tập trung thì không ai đi mở tab khác.
  Đưa nó ra sau lưng đồng hồ đếm ngược thì vòng lặp khép kín: làm việc → thấy thành phố lớn lên →
  muốn làm tiếp. Không thêm tính năng nào, chỉ đổi chỗ đứng.
  - `components/city/CityBackdrop.jsx` — **thuê lại `CityStage`, KHÔNG dựng cảnh riêng.** `CityStage`
    và `CityScene3D` nhận thêm 4 công tắc (`chrome`/`still`/`fill`/`interactive`) để cùng một bộ vẽ
    đóng được hai vai: màn hình để NGẮM (tab Thành Phố) và khung cảnh để LÀM VIỆC PHÍA TRƯỚC.
  - ⚠️ **Luật ở trang chủ ngặt hơn tab Thành Phố — vì THỜI LƯỢNG, không phải thẩm mỹ.** Tab Thành
    Phố mở vài chục giây; trang chủ mở 25 phút liền. Nên: **đang chạy phiên ⇒ đứng yên tuyệt đối**
    (0 nhịp rAF; vừa để tiết kiệm pin vừa để không có gì nhúc nhích sau lưng đồng hồ kéo mắt Đàm);
    **điện thoại ⇒ luôn đứng yên** kể cả lúc rảnh (dải thành phố ló ra sau thẻ đồng hồ trên màn hẹp
    quá mỏng để mắt nhận ra chuyển động, mà giá phải trả thì y hệt máy bàn — đây đúng chỗ bỏ hoạt
    hoạ đi không mất gì); **không nhận thao tác** (`interactive={false}` — `wheel` của bộ vẽ đăng ký
    `passive:false` và có `preventDefault`, bật lên là nuốt cú cuộn trang); **hỏng thì biến mất
    không một lời** (`fallback={() => null}`, khác mọi chỗ khác trong app — thứ nó nằm phía sau là
    công cụ chính, không được để một lớp trang trí làm mất cái đồng hồ).
  - **Máy yếu ⇒ KHÔNG lùi về bản 2D ở đây**, chỉ trả về nền trơn. Bản 2D isometric là hình minh hoạ
    sắc nét có viền — đặt sau lưng đồng hồ nó đọc ra "ảnh dán nhầm chỗ" chứ không ra "khung cảnh".
    Tab Thành Phố thì vẫn luôn có đủ bản 2D như cũ.
  - **Nạp LƯỜI** dù nằm ngay màn hình đầu: nạp tĩnh đo được **+4,9 KB gzip** vào chunk chính, tức
    làm chậm đúng thứ phải hiện ra trước nhất (cái đồng hồ). Sau khi cho lười: chunk chính
    **134,54 KB gzip**, tức +0,1 KB so với trước Phase 3F.
  - Cài đặt mới `cityHomeBackdrop` (mặc định BẬT), `settingsStore` **version 7 → 8**.
    ⚠️ Bản lưu cũ chuẩn hoá bằng `!== false` chứ KHÔNG phải `=== true` — viết `=== true` (phản xạ
    tự nhiên, và đúng cho `cityPerfHud` ngay bên cạnh vì cái đó mặc định TẮT) sẽ làm tính năng mới
    tắt sẵn với đúng những người đã dùng app từ trước, nghĩa là với chính Đàm. Đã có test riêng
    (`settingsStore.migrate.test.js`) và **đã xác minh nó ĐỎ khi viết `=== true`**.
  - **Đã soi bằng ảnh chụp thật của app đã build** (Mac 1680, laptop 1280, iPhone 390 · cả 2 theme).
    Dựng một khung chụp riêng có **chặn Supabase ở tầng phân giải tên miền** để phiên chụp tuyệt đối
    không thể ghi gì lên dữ liệu thật. Kết quả: bề ngang Mac cho ra hai dải thành phố sáng đèn ôm
    hai bên thẻ đồng hồ, chữ đọc rõ ở cả hai theme. (Nhân tiện xác nhận: hiện tượng tràn ngang trên
    khung 390px là **có sẵn từ trước**, chụp với lớp nền TẮT ra y hệt — không phải do Phase 3F.)
  - **418 test** (+6) · lint sạch · build xanh.

- **2026-08-12 (Phase 3D)** — **THÀNH PHỐ ĐỔI THEO GIỜ: mở app lúc nào là ra cảnh lúc đó.**
  Đàm: *"nhiều animation lên và nhiều hiệu ứng hơn"*. Đây là hiệu ứng đắt giá nhất trong cả nhánh
  3D tính theo tỉ lệ công/kết quả: **không thêm một hình khối nào, không thêm một byte state nào**,
  mà thành phố thôi là một tấm ảnh và thành một NƠI CHỐN đang trôi qua thời gian cùng Đàm.
  - **6 chặng trong ngày** (`engine/city3d/daylight.js`, THUẦN — nhận GIỜ làm tham số, không đụng
    `Date`): rạng sáng · sáng · trưa · chiều · chạng vạng · đêm. Mỗi chặng đổi hướng + độ ấm +
    cường độ nắng, cường độ đèn nền, sắc trời, và **cửa sổ có sáng đèn hay không**. Lấy **giờ Việt
    Nam**, không phải giờ máy. KHÔNG nội suy giữa hai chặng — cảnh chỉ dựng lại khi bố cục đổi, nội
    suy sẽ tốn công tính cho một thứ không ai ngồi nhìn nó chuyển động.
  - **Ô cửa sáng đèn** ban đêm: tách riêng thành khối vật liệu tự phát sáng (`MeshBasicMaterial`,
    tắt sương mù) — ban ngày không tách nên **không tốn thêm lệnh vẽ nào**.
  - **Vũng sáng ấm hắt xuống chân công trình** (tối đa 3 đèn, điện thoại 2). Đây là chi tiết biến
    cảnh đêm từ "có đèn" thành "có người ở": ô cửa tự phát sáng thì KHÔNG rọi ra ngoài, nên nếu
    thiếu vũng sáng này thì cửa sáng trưng mà chân tường vẫn tối om, đọc ra như hình dán.
  - ⚠️ **BA LỖI CHỈ ẢNH CHỤP MỚI THẤY — cả ba đều lint/test xanh:**
    1. **Đêm gần như ĐEN THUI** (đo được mặt đất `#030401`). Đêm bị làm tối ở hai chỗ độc lập rồi
       nhân dồn lên nhau: sơn chuyển sang bảng màu tối (~2,9×) **và** màu đèn bán cầu lấy từ chính
       bầu trời đêm nên cũng tối (~2×) — tổng ~5,8× trong khi hệ số bù mới có 1,45×.
       ⇒ Bài học: **cường độ đèn phải bù cho cả độ đậm của MÀU đèn** (hai thứ nhân nhau).
    2. **Bầu trời ngả hồng/tím sen** — chân trời trưa `#e0b8c9`, đỉnh trời bình minh `#cf63c2`, đèn
       bán cầu `#45395f`. Cùng MỘT gốc rễ, lộ ra **ba lần ở ba chỗ khác nhau**: nội suy góc màu
       luôn đi đường ngắn trên vòng tròn màu, mà cam bình minh ↔ lam nằm gần như đối diện nhau nên
       đường ngắn chạy xuyên qua vùng TÍM. ⇒ Sửa vào GỐC: đường dựng màu trời nay **không còn phép
       xoay góc màu nào**, cả ba bước đều trộn trong RGB (đi qua màu xám, đúng cách người vẽ làm).
    3. **Cái ao biến thành hộp đèn** — một tấm vàng rực giữa thành phố tối. Mặt nước đang mượn
       chung vai màu `glass` với cửa sổ, mà ban đêm vai `glass` được đối xử là "tự phát sáng".
       ⇒ Bài học: **vai màu không chỉ là "màu gì", còn là "được đối xử thế nào"**; đã tách vai
       `water` riêng (rẻ hơn một danh sách ngoại lệ phải nhớ cập nhật).
  - **Công cụ soi lỗi cũng có lỗi, và nó nguy hiểm hơn cả ba lỗi trên**: `scripts/city-preview.mjs`
    nhận `--hour` nhiều lần nhưng chỉ vẽ giờ CUỐI, hai file kia vẫn nằm nguyên trên đĩa từ lần chạy
    trước. Tôi đã mở đúng hai file cũ đó, tưởng là bản mới, và kết luận sai rằng bản vá không ăn
    thua. **Một công cụ im lặng đưa dữ liệu cũ còn tệ hơn không có công cụ.** Đã sửa để vẽ đủ mọi
    giờ được truyền vào.
  - **Khoá lại bằng test** (412 bài, +18): quét bầu trời 24 giờ × 2 theme × 6 kỷ để bắt sắc tím ·
    tỉ lệ đèn nền đêm/trưa ≥ 3 · đèn sân chỉ bật khi cửa sổ sáng · mặt nước không mang vai `glass`.
    ⚠️ Bài test bầu trời **đã được xác minh là ĐỎ trên code cũ** rồi mới nhận — một bài test chưa
    từng thấy màu đỏ thì chưa chứng minh được nó bắt được gì.
  - Đã chạy: **412 test xanh · lint sạch · build xanh** (`vendor-three` 130,8 KB gzip, vẫn dưới trần
    135 KB của cổng 3A).

- **2026-08-12 (Phase 3C)** — **ÁNH SÁNG PHỤC HƯNG: cùng hình khối đó, nhìn ra tranh.**
  Đàm: *"làm đẹp như các bức tranh phục hưng"*. Phase này KHÔNG thêm một hình khối nào — chỉ đổi
  cách ánh sáng và màu được diễn giải. Đó cũng là điều đáng ghi nhớ nhất: **thứ làm cảnh 3D đẹp lên
  hầu như không nằm ở mô hình.**
  - ⚠️ **LỖI LỚN NHẤT, VÀ KHÔNG AI ĐỌC CODE MÀ THẤY ĐƯỢC: mặt trời đứng sau lưng camera.**
    Hướng nắng cũ `(0,78 · 0,54 · 0,46)` đọc lên rất hợp lý ("nắng xiên từ trên cao"). Nhưng camera
    mặc định ở phương vị 45°, còn hướng đó ở ~60° ⇒ **tích vô hướng với trục nhìn = −0,98**, tức là
    đèn flash máy ảnh chiếu thẳng vào mặt vật. Mọi mặt quay về phía ta sáng đều nhau, bóng đổ trốn
    hết ra sau công trình, hình khối bẹp dí — **toàn bộ công dựng dáng nhà ở Phase 3B bị vô hiệu
    bởi đúng MỘT vector**. Sửa: phương vị 150° (vuông góc trục nhìn) ⇒ mỗi khối có một mặt sáng,
    một mặt khuất, bóng rạch chéo qua khung hình. **Đã khoá bằng test** (`cityRenderers.test.js`) —
    lint/build/test hành vi đều không bắt được loại lỗi này, chỉ một phép tính hình học mới bắt được.
  - **Tone mapping** — mặc định three là `NoToneMapping`, tức là mọi giá trị vượt 1,0 bị CẮT PHẲNG:
    tường hứng nắng và mái hứng nắng cùng thành một mảng bệt. Đã thử cả ba: `ACESFilmic` (ngả lạnh,
    rút hết hơi ấm) · `AgX` (nén đẹp nhưng **bạc màu có chủ đích** → thành phố pastel như sữa, đúng
    cái ngược lại với tranh Phục Hưng) · **`Neutral`** (giữ độ tươi ở vùng giữa) ← chọn cái này.
  - ⚠️ **BÀI HỌC KÈM: đổi tone mapping KHÔNG phải một dòng độc lập.** Nó đổi cách MỌI màu hiện ra.
    Đúng lần đổi AgX → Neutral đã làm lộ ra một bàn cờ xanh–vàng ở mặt đất mà AgX vốn đang che
    giúp (chênh lệch góc màu ±9° quá lớn, đã siết còn ±4°). Đổi tone mapping ⇒ phải soi lại mọi chỗ
    dựa vào chênh lệch màu nhỏ.
  - **Viền tối góc (vignette)** — thứ rẻ nhất mà đổi được nhiều nhất về "chất tranh": người vẽ sơn
    dầu luôn dìm bốn góc để dồn mắt vào vùng sáng giữa. Làm bằng **một lớp gradient CSS**, KHÔNG
    phải post-processing: post-processing đòi thêm thư viện, thêm khung đệm toàn màn hình, và vẽ
    lại toàn bộ điểm ảnh MỖI khung hình — khoản đắt nhất có thể thêm vào iPhone. Lớp CSS đứng yên
    cho hiệu quả gần như y hệt với giá bằng **không**.
  - ⚠️ **CHIAROSCURO LÀ KHOẢNG CÁCH SÁNG–TỐI, KHÔNG PHẢI "TỐI ĐI"** — trả giá bằng một ảnh chụp gần
    như đen kịt. Lần đầu hạ đèn nền cho CẢ HAI theme; theme sáng đẹp hẳn lên, theme tối thành không
    đọc nổi (bảng màu tối vốn đã đặt tường ở 0,36). Ở theme tối, muốn giữ khoảng cách đó thì phải
    kéo vùng sáng LÊN ⇒ cần **NHIỀU** đèn nền hơn theme sáng, không phải ít hơn.
  - **Hai theme nay là hai CẢNH khác nhau, không phải một cảnh vặn nhỏ độ sáng**: theme sáng = nắng
    chiều ấm (chân trời vàng 40°); theme tối = **chạng vạng, trời xanh lam sâu** (224°) + mặt đất
    **giảm độ tươi mạnh** (0,26 → 0,12, đúng hiệu ứng Purkinje: ánh sáng yếu thì mắt mất khả năng
    phân biệt màu). Viền tối cũng nhẹ hơn hẳn ở theme tối — nó là thứ tương đối với nền nó phủ lên.
  - **Cửa sổ nay là LỖ THỦNG, không phải tấm nhựa xanh** — độ đậm 0,52 → 0,26, độ tươi 0,36 → 0,16.
    Nhìn từ ngoài vào ban ngày, cửa sổ gần như đen; đó là thứ cho mặt tiền chiều sâu.
  - **Camera lại gần** (1,85 → 1,5 × lưới): lưới luôn 12×12 nhưng mỗi kỷ chỉ có 5 bản vẽ, nên rìa
    **vĩnh viễn** là đất trống — ở 1,85 thì khung hình bị chiếm bởi đúng phần không có gì để nhìn.
    Tham số camera nay ở `cityOrbitOptions()` (một nguồn sự thật, dùng chung với trang xem thử).
  - **Quầng sáng mặt trời nướng sẵn vào màu đỉnh của vòm trời** — tính MỘT LẦN lúc dựng cảnh, 0 chi
    phí mỗi khung hình. Vòm trời lên 32×16 để quầng không lộ mảng tam giác.
  - **393 → 394 bài test.** Lint + build xanh. Chunk chính KHÔNG to thêm (134,44 KB gzip).

- **2026-08-12 (Phase 3B-3)** — **CƯ DÂN: thành phố có người ở.**
  Đàm xem bản 3A rồi nói *"quá đơn giản và không đẹp"* + *"tối ưu hình ảnh và **cộng đồng cư dân**"*.
  Đây là mảng "cộng đồng cư dân" trong câu đó.
  - **Dân số SUY RA, không lưu vào state** — cùng nguyên tắc với cảnh vật và với toạ độ (ADR-007):
    `deriveResidentCount` = f(số công trình, số phiên, độ dài chuỗi). **0 byte** thêm vào khối JSONB
    đang chịu CAS trên Supabase, và không bao giờ lệch giữa hai máy. Trần 28 người (ngưỡng hiệu
    năng, không phải con số đẹp). Đường cong dốc lúc đầu rồi thoải: 0→4 người phải cảm nhận được ở
    những phiên đầu tiên (lúc dễ bỏ cuộc nhất), 20→24 thì gần như không ai đếm.
  - ⚠️ **CHUYỂN ĐỘNG LÀ HÀM CỦA THỜI GIAN, không phải biến cộng dồn.** `residentAt(route, time)`
    nhận thời điểm làm tham số. Ba cái lợi, cái thứ ba mới là lý do thật: (a) test được — đưa vào
    t = 12,5 giây thì biết chắc người ở đâu; (b) bỏ lỡ khung hình không làm thành phố trôi chậm
    lại; (c) **Đàm rời tab nửa tiếng rồi quay lại, thành phố hiện ra ở đúng trạng thái ĐÁNG LẼ phải
    có** thay vì đứng im từ lúc bị đóng băng.
  - ⚠️ **BUG ĐÃ BỊ TEST BẮT — cư dân bay xuyên qua nhà.** Bản đầu đi theo THỨ TỰ MẢNG `roadCells`,
    nhưng mảng đó đã bị `computeCityLayout` sắp lại theo **chiều sâu isometric** (để bộ vẽ 2D xếp
    lớp đúng) — hai phần tử liền nhau trong mảng hoàn toàn có thể nằm ở hai đầu thành phố. Test đo
    được bước nhảy **3,6 ô**. Đã sửa: dựng `roadSet` + quan hệ kề-nhau 4 hướng thật rồi mới đi, khép
    kín tuyến bằng cách đi ngược lại chính lộ trình (tính kề nhau được bảo đảm miễn phí).
  - ⚠️ **HAI KHỐI MỚI RA HÌNH NGƯỜI, MỘT KHỐI THÌ KHÔNG.** Bản đầu dùng đúng một hộp; ảnh chụp gần
    cho thấy những **viên gạch màu** trôi trên đường. Thứ làm mắt nhận ra dáng người ở cỡ vài điểm
    ảnh không phải tay chân — mà là **một chấm NHỎ HƠN, SÁNG HƠN đặt trên một khối lớn hơn, tối
    hơn** (ngôn ngữ của quân cờ vua và hình nhân Lego). Thêm vai màu `skin` vào bảng màu, **không
    pha sắc kỷ** (người thời nào cũng một màu, và chính vì nó KHÔNG thuộc họ màu công trình nên mắt
    mới bám vào được). Giá: 12 tam giác + 1 lệnh vẽ cho cả cộng đồng.
  - ⚠️ **ĐÁNH ĐỔI CÓ CHỦ Ý VỚI LUẬT PIN.** Cư dân đi lại ⇒ phải vẽ liên tục ⇒ phá luật "đứng yên =
    0 nhịp rAF" của Phase 3A. Chấp nhận, vì tab Thành Phố là màn hình Đàm mở ra để NGẮM và chuyển
    động chính là nội dung của nó. **Ba lớp bảo vệ pin thay thế**: (a) **trần 30 khung/giây**
    (`targetFps` mới ở `renderLoop`) — trên iPhone ProMotion không có trần này là vẽ gấp bốn lần
    công việc cần thiết; (b) dừng hẳn khi rời tab; (c) tắt sạch khi bật "giảm chuyển động" của hệ
    điều hành, và trong bảo tàng (kỷ đã niêm phong đứng yên tuyệt đối).
  - ⚠️ **NGƯỠNG WATCHDOG PHẢI TÍNH THEO TRẦN MÌNH TỰ ĐẶT.** Đặt trần 30 rồi vẫn coi dưới 24 là máy
    yếu thì chỉ cần trượt vài khung là watchdog hạ xuống 2D — máy hoàn toàn khoẻ mà bị đuổi khỏi
    3D. `slowThresholdFor(targetFps)` = min(24, trần × 0,7).
  - **375 → 393 bài test** (+8 cư dân, +10 nhịp khung hình). Lint + build xanh.
  - Hai chỗ dễ sai đã bịt: `useEffect` phải có `reduceMotion`/`sessionCount`/`streakLength` trong
    danh sách phụ thuộc (cả ba đọc lúc DỰNG cảnh, không có đường cập nhật sau) — và ba prop đó phải
    là **SỐ RỜI**, không gói thành object (object mới mỗi lượt render cha ⇒ dựng lại cả cảnh WebGL
    vài lần mỗi giây). Cao độ chân người dùng chung hằng số `ROAD_LIFT` với mặt đường.

- **2026-08-12 (Phase 3A)** — **THÀNH PHỐ 3D THẬT (three.js) + bảng đo hiệu năng. ✅ ĐÃ QUA CỔNG.**
  Phase này CỐ Ý xấu: hình khối còn là hộp thô. Mục tiêu là **đo xem iPhone có kham nổi không**
  trước khi đầu tư vào mỹ thuật (Phase 3B). Nhưng đo trên đúng TẢI THẬT — 144 ô nền, số công trình
  thật, bóng đổ bật — chứ đo 5 cái hộp thì con số chẳng dự đoán được gì.
  - **Thêm đúng 1 thư viện**: `three@0.185.1` — ghim cứng KHÔNG có `^` (đổi phiên bản three là đổi
    cả hành vi WebGL, không được để npm tự nâng). Đã kiểm: thư viện này **0 dependency con**.
  - **Chunk chính KHÔNG to thêm**: 134,4 KB gzip, y hệt trước khi thêm three. three nằm ở chunk
    riêng `vendor-three` (130,16 KB gzip) chỉ tải khi thật sự mở bản 3D. Đã xác minh bằng cách đọc
    `dist/sw.js`: **0/45 mục precache** là three, nhưng có luật `CacheFirst` bù lại nên tab 3D vẫn
    mở được khi mất mạng. Thiếu MỘT trong hai vế là hỏng: thiếu `globIgnores` thì tải 130 KB mỗi
    lần mở app; thiếu `runtimeCaching` thì mất mạng là tab 3D trắng.
  - **Kiến trúc**: 4 file THUẦN ở `src/engine/city3d/` (`renderMode` luật chọn 3D/2D · `renderLoop`
    nhịp khung hình · `orbit` toán camera · `palette3d` màu) — test được bằng `node --test` không
    cần trình duyệt. `components/city/render3d/` là NƠI DUY NHẤT được `import 'three'`.
  - ⚠️ **LUẬT PIN — quan trọng nhất cả phase**: KHÔNG có vòng lặp thường trực. Cách thường thấy là
    chạy `setAnimationLoop` 60 lần/giây rồi bên trong kiểm tra cờ "có gì đổi không" — vòng đó **vẫn
    đánh thức CPU 60 lần mỗi giây** dù thành phố đứng yên tuyệt đối. Ở đây: đứng yên ⇒ **0 nhịp
    rAF**. Hai hệ quả BẮT BUỘC nhớ: (a) **FPS chỉ đo được lúc đang kéo xoay** — đo lúc đứng yên ra
    0 và watchdog sẽ hạ 2D oan; (b) **bóng đổ phải tắt tự-cập-nhật** (`shadow.autoUpdate = false` ở
    CẢ đèn lẫn renderer), vì mặc định của three là vẽ lại shadow map MỖI khung hình — nó âm thầm
    biến mọi khung hình thành đắt như khung đầu tiên. Cả thành phố gộp còn **3 lệnh vẽ**.
  - **Ba cửa lùi về 2D**, cửa nào cũng phải dẫn về hình chứ không dẫn tới màn hình trống: không có
    WebGL2 → 2D ngay · dựng cảnh thất bại → 2D · đang chạy mà mất context / quá chậm → tự chuyển
    về 2D **kèm một dòng nói rõ vì sao** (không nói thì Đàm chỉ thấy hình đột nhiên đổi kiểu).
  - ⚠️ **FAIL-CLOSED, nhưng "thiếu thông tin ≠ máy yếu"**: Safari không có `deviceMemory` lẫn
    `connection`. Nếu coi `undefined` là "yếu" thì **mọi iPhone đều rớt xuống 2D** — tức giết đúng
    mục tiêu mà cả nhánh 3D sinh ra để phục vụ. Chỉ loại khi biết CHẮC là yếu. Có test khoá.
  - **2 lỗi thật do test bắt được, đã sửa**: (1) **kéo dọc bị đảo chiều** so với quy ước
    `OrbitControls` (kéo xuống phải nghiêng về góc nhìn từ trên) — kiểu bug người dùng cảm thấy
    ngay nhưng đọc code không thấy; (2) **rời tab gọi `stop()`** mà `stop()` là VĨNH VIỄN ⇒ quay
    lại tab là thành phố đóng băng, không cách nào cứu. Đã tách `pause`/`resume` riêng.
  - **315 → 360 bài test, 0 fail.** Lint + build xanh. `settingsStore` version 6 → 7 (thêm
    `cityRenderMode` + `cityPerfHud`) — đặt ở đây chứ KHÔNG phải `gameStore` vì đây là sở thích của
    TỪNG MÁY, và store này không lên Supabase nên thêm **0 byte** vào khối JSONB đang chịu CAS.
  - Tài liệu: `ARCHITECTURE.md` (luật pin + 3 cửa lùi) · `PROJECT_STRUCTURE.md` · `MIGRATION.md`
    (settingsStore 6→7) · `CHANGELOG.md`.
  - ✅ **CỔNG ĐÃ QUA** — nhưng qua bằng **quyết định của Đàm**, không bằng số đo: Đàm xem trên máy
    thật rồi ra lệnh *"hãy tiếp tục xây dựng sản phẩm và không dừng lại"*. ⚠️ **Vì cổng không được
    đóng bằng số, mọi lưới an toàn phải giữ NGUYÊN** — watchdog FPS, ba cửa lùi 2D, trần 30
    khung/giây, dừng khi rời tab. Nếu sau này máy Đàm nóng/tụt pin thì đường lùi vẫn còn đủ, và
    bản 2D vẫn nằm đó làm nền (ADR-008). Muốn có số thật thì bật *"Hiện bảng số liệu hiệu năng"*
    trong Cài đặt rồi mở tab Thành Phố — nay có cư dân đi lại nên FPS hiện số thật, không cần kéo
    xoay như trước nữa.

- **2026-08-12 (công cụ)** — **Sửa glob test: từ nay test đặt ở thư mục con cũng chạy.**
  Trước đây `npm test` liệt kê tay từng thư mục và mỗi mục chỉ quét **một cấp**
  (`src/components/*.test.js`). File test đặt trong thư mục con (`src/components/city/…`,
  `src/engine/city3d/…`) sẽ **không bao giờ chạy mà cũng không báo lỗi gì** — nguy hiểm hơn test
  đỏ, vì nó tạo cảm giác an toàn giả. Ghi vào `TECH_DEBT #10` lúc phát hiện, rồi **xử lý dứt điểm
  ngay cùng ngày** khi Phase 3A cần đặt test cạnh `city/render3d/` và đụng đúng cái bẫy đó.
  - Glob nay là `'electron/**/*.test.js' 'src/**/*.test.js' 'api/**/*.test.js'`, **để trong nháy
    đơn** cho chính `node --test` mở rộng. ⚠️ Bỏ nháy là hỏng: POSIX `sh` không có globstar nên
    `**` co lại thành `*`, và `src/**/*.test.js` sẽ **mất** các test ở cấp trên.
  - Đổi có chứng minh, không đổi liều: đối chiếu **tập hợp file** cũ ↔ mới bằng `fs.globSync` →
    **31 file, giống hệt, 0 mất 0 thêm**; `npm test` giữ nguyên 315 bài.
  - Nhờ vậy đã chuyển `cityRenderers.test.js` về đúng chỗ (`src/components/city/`), cạnh thứ nó
    canh gác — đúng quy ước "test nằm cạnh file nguồn" của `PROJECT_STRUCTURE.md`.
  - Từ nay **thêm thư mục mới KHÔNG cần sửa `package.json`** nữa. Tài liệu: `CLAUDE.md` ·
    `PROJECT_STRUCTURE.md` · `TECH_DEBT.md` #10 (Resolved).

- **2026-08-12 (Phase 3-2D)** — **THÀNH PHỐ: tab hiện ra, Đàm nhìn thấy thành phố lần đầu.**
  Thuần hiển thị: **0 dòng đụng `store/`, `engine/`, `hooks/`, `lib/`**, không thêm thư viện nào.
  - Tab mới "Thành Phố" nạp lười (chunk riêng ~14 KB, không nặng lần mở app đầu). Sửa `App.jsx`
    đúng 5 chỗ: import lười · icon `AppIcon.city` · 2 danh sách tab · khối render.
    ⚠️ **CỐ Ý không cho vào nhóm 4 tab chính của iPhone** (`MOBILE_PRIMARY_IDS`) — thanh dưới giữ
    nguyên 4 nút, "Thành Phố" nằm trong nút "Thêm".
  - `src/components/city/` chia làm **KHUNG** (`CityViewShell.jsx`: chuyển kỷ, số liệu, 2 trạng
    thái rỗng) và **BỘ VẼ** (`render2d/CityCanvas2D.jsx` + `CityTile.jsx` + `tokens2d.js`).
    Khung KHÔNG biết bộ vẽ nào đang chạy — bộ vẽ vào qua `children` và tự định kích thước.
  - Hiệu năng: 144 ô nền gộp thành **4 phần tử SVG** (không phải 144), đường sá gộp thành 1. Chỉ
    nhà + cảnh vật nổi mới là phần tử riêng. Không quét lại `history` khi render (`TECH_DEBT #6`).
  - **309 → 315 bài test, 0 fail.** Lint + build xanh. Phase này không thêm logic thuần nào (mọi
    thứ mới đều là JSX, bố cục đã được 36 bài của Phase 1 khoá), nên 6 bài mới
    (`src/components/cityRenderers.test.js`) không test hành vi mà **đọc thẳng mã nguồn để khoá
    ranh giới kiến trúc** — cùng thủ pháp đã dùng cho "3 danh sách trường được lưu" ở Phase 2.
    Khoá 5 luật: chỉ `render3d/` được `import 'three'` · khung không import bộ vẽ · hai bộ vẽ không
    import lẫn nhau · bộ vẽ không đọc store · `tokens2d` không rò ra ngoài `render2d/`.
    ⚠️ **Viết NGAY BÂY GIỜ dù three.js chưa tồn tại** — đúng lúc Phase 3A thêm nó vào mới là lúc dễ
    vi phạm nhất, một lần lỡ `import` tĩnh ở file ngoài là ~130 KB rơi vào chunk chính. Đã thử phá
    hoại 2 lần để xác nhận test fail thật, không phải pass rỗng (có cả 1 bài tự canh cách quét).
  - ⚠️ **Quyết định kiến trúc — ADR-008**: **bộ vẽ 2D là nền VĨNH VIỄN, không phải bản nháp.** Kế
    hoạch 3D (three.js) đã duyệt, nhưng WebGL không phải thứ chắc chắn có: máy có thể không hỗ trợ
    WebGL2, iOS hay **mất context giữa chừng** khi thiếu bộ nhớ, Đàm có thể tự tắt 3D cho đỡ tốn
    pin, và cổng hiệu năng Phase 3A có thể TRƯỢT. Trong mọi tình huống đó màn hình vẫn phải hiện
    được. Vì vậy KHÔNG xoá bản 2D kể cả khi 3D chạy tốt.
  - Tài liệu: `ARCHITECTURE_DECISIONS.md` ADR-008 · `ARCHITECTURE.md` (mục 7: luồng vẽ 3 chặng) ·
    `PROJECT_STRUCTURE.md` (cây `city/` + 2 quy tắc đặt file mới) · `CHANGELOG.md`.
    Sửa luôn 1 lỗi tài liệu: dòng Phase 1 bên dưới ghi "ADR-010" trong khi bản ghi thật là ADR-007.

- **2026-08-12 (Phase 2/6)** — **THÀNH PHỐ PIXEL: niêm phong thành phố kỷ cũ thay vì xoá (schema 3→4).**
  Phase DUY NHẤT đụng vào state đã lưu. **Cân bằng game không đổi một chút nào** — công trình kỷ cũ
  vẫn bị cắt y hệt, chỉ được sao chép sang kho `cityArchive` chỉ-để-ngắm trước khi bị vứt.
  - 6 thay đổi trong `gameStore.js`: state `cityArchive: {}` · `pruneEraScopedBlueprintState` nhận
    thêm tham số `sealContext` (mặc định `null`) · `completeFocusSession` là chỗ DUY NHẤT truyền
    `sealContext` · `normalizePersistedGameState` · `partialize` · `GAME_STORE_SCHEMA_VERSION` 3→4.
  - ⚠️ **PHÁT HIỆN QUAN TRỌNG — spec bỏ sót 2 trong 3 danh sách trường được lưu.** Dự án có **BA**
    danh sách viết tay riêng biệt, không dùng chung nguồn nào: `partialize` (localStorage),
    `handleExport` ở `ExportImport.jsx` (file backup JSON), `getExportableState` ở `syncService.js`
    (đồng bộ Supabase). Spec chỉ nhắc `partialize`, lại còn CẤM đụng `syncService.js` — làm y spec
    thì **bảo tàng chỉ tồn tại trên đúng cái máy đã lên kỷ, iPhone thấy trống, cài lại app là mất
    sạch**. Đã hỏi và **Đàm chốt: phải đồng bộ** → thêm đúng 1 dòng vào mỗi nơi (KHÔNG đụng gì tới
    cơ chế CAS "First Action Wins"). Có test tự động ĐỌC MÃ NGUỒN cả 3 nơi để bắt lỗi bỏ sót về sau.
  - +12 bài test mới (`src/store/gameStore.cityArchive.test.js`), gồm 2 bài chống-hồi-quy-cân-bằng.
    Sửa 1 bài cũ (`gameStore.test.js`) vốn khoá cứng `SCHEMA_VERSION === 3` — nay là tripwire cho 4.
  - **297 → 309 bài test, 0 fail.** Lint + build xanh. KHÔNG cần chạy SQL Supabase.
  - Tài liệu: `MIGRATION.md` (schema 3→4) · `ARCHITECTURE.md` (mục 7: bảo tàng + cảnh báo 3 danh
    sách trường) · `CHANGELOG.md` · `ARCHITECTURE_DECISIONS.md` ADR-007.

- **2026-08-12 (Phase 1/6)** — **THÀNH PHỐ PIXEL: nền móng thuần, chưa ai nhìn thấy gì.** Theo
  `SPEC Thành Phố Pixel` Đàm duyệt cùng ngày (Đàm **miễn trừ cổng Giai đoạn A** cho hạng mục
  gamification này — quyết định 0.2 của spec). Thêm 2 file engine THUẦN + 2 file test, **0 dòng
  thay đổi ở `store/`, `components/`, `hooks/`** — app chạy y hệt trước.
  - `src/engine/cityLayout.js` — suy ra bố cục thành phố từ danh sách công trình bằng băm tất định
    (FNV-1a), **KHÔNG lưu toạ độ vào state** (quyết định 0.3: thành phố kỷ cũ dựng lại y nguyên
    sau nhiều năm, tốn 0 byte, không đụng `TECH_DEBT #8`/`#9`).
  - `src/engine/cityArchive.js` — "bảo tàng": `mergeCityArchive` / `normalizeCityArchive` /
    `listVisitableEras`. Chưa nối vào store (Phase 2).
  - **+36 bài test** (261 → **297 bài, 0 fail**), lint + build xanh.
  - ⚠️ **Chệch spec CÓ CHỦ Ý, đã ghi ADR-007**: spec đề nghị đặt nhà bằng "dò xoắn ốc theo bpId đã
    sắp xếp". Cách đó chỉ giữ được bất biến "bảo tàng bất động" khi KHÔNG va chạm — mà 5 công trình
    trên lưới 144 ô va chạm ~7%, tức bảo tàng có thể tự xê dịch. Đã thay bằng **khu đất riêng theo
    thứ hạng bản vẽ trong kỷ** (mỗi kỷ đúng 5 bản vẽ → 5 zone rời nhau) ⇒ vị trí mỗi nhà chỉ phụ
    thuộc chính id của nó, bất biến đúng TUYỆT ĐỐI. Chữ ký `placeBuilding(bpId, occupiedSet)` giữ
    nguyên như spec, dò xoắn ốc vẫn còn làm lưới an toàn cho id lạ.
  - ⚠️ **Spec ghi sai số bài test nền**: spec nói nền là 302 bài (và chê tài liệu cũ ghi 261 là
    sai). Đo thật ngày 2026-08-12: **261 bài** — tức tài liệu cũ ĐÚNG, spec sai. Mốc nghiệm thu
    "≥323 bài" của spec vì vậy không dùng được; mốc thật tương đương là ≥283.

- **2026-08-10** — **Sửa khoảng trắng thừa trước icon trên thanh menu Mac.** Đàm báo: đang trong
  phiên pomodoro thì có khoảng trắng trước 🍅, đang giải lao thì có vệt trắng cạnh ☕. Nguyên nhân:
  khi có phiên chạy, tray bỏ icon để chỉ hiện chữ, nhưng chỗ "bỏ icon" lại nạp
  `public/tray-empty.png` — file 16x16 **trong suốt hoàn toàn** (đã kiểm alpha: toàn bộ = 0).
  Không nhìn thấy, nhưng macOS vẫn chừa đủ 16 điểm ảnh chỗ cho nó. Vá: `nativeImage.createEmpty()`
  (ảnh 0x0, không chiếm chỗ) ở `electron/main.js`; xoá hẳn `public/tray-empty.png` (không còn ai
  dùng). Sửa đúng 1 dòng code, cả 2 đường hiện tiêu đề (`updateTrayTitle` +
  `applyRendererTrayUpdate`) đều dùng chung biến `iconEmpty` nên khỏi sửa 2 chỗ. Đã khởi động lại
  LaunchAgent và **chụp màn hình xác nhận bằng mắt**: khoảng trắng đã hết. 261 test + lint + build
  xanh. Bài học ghi vào `CLAUDE.md` thành **BẪY 4**: "ảnh trong suốt" KHÔNG bằng "không có ảnh".

- **2026-08-05 (c)** — **Dọn 2 file lạc chưa commit + diệt gốc nạn nhân bản tài liệu quy tắc.**
  `git status` tồn đọng `AGENTS.md` + `.codex/` từ 31/7 (do Codex tạo, không phải Claude).
  `AGENTS.md` khi đó là BẢN SAO nguyên văn 288 dòng của `CLAUDE.md`, tạo bằng cách thay máy móc
  "Claude"→"Codex" → sinh câu vô nghĩa ("dùng Codex + Codex để code", "Hỏi Codex") và **đường dẫn
  không tồn tại** (`.Codex/session-start-bangiao.sh`, `/Users/damduy/.Codex/projects/...`); tệ hơn,
  chỉ sau 5 ngày nó đã **trôi khỏi bản gốc** — thiếu nguyên mục "App menu bar Mac — 3 cái bẫy", tức
  Codex đọc nó sẽ không biết những bẫy đó và dẫm lại. **Xử lý gốc, không vá**: viết lại `AGENTS.md`
  thành **con trỏ ~40 dòng** trỏ về `CLAUDE.md` (kèm 3 điều nguy hiểm nhất để không cần đọc hết mới
  biết) — bỏ 288 dòng trùng lặp, từ nay chỉ còn MỘT nguồn quy tắc. Thêm quy tắc số 6 vào
  "NGUYÊN TẮC ƯU TIÊN SỐ 1": **cấm tạo bản sao tài liệu quy tắc cho từng công cụ AI**. `.codex/`
  cho vào `.gitignore` cạnh `.claude` (cùng loại: cấu hình cục bộ chứa đường dẫn tuyệt đối của máy
  Đàm, vô dụng ở máy khác) → `git status` sạch trở lại. `PROJECT_STRUCTURE.md` bổ sung dòng
  `AGENTS.md`. **KHÔNG đụng code ứng dụng** — 261 bài test + build vẫn xanh.

- **2026-08-05 (b)** — **Dọn sạch mọi dấu vết dự án đời cũ trên máy (Đàm yêu cầu).** Chuyển Thùng
  rác 10 mục: thư mục dự án cũ `Downloads/Claude Code/Pomodoro Game - USING` (đã rỗng ruột, chỉ còn
  18MB log — KHÔNG phải git repo, không có mã nguồn nào, đã kiểm trước khi xoá); applet
  `DC Pomodoro.app` (724K, không nằm trong git); 2 backup dữ liệu game (`dc-pomodoro-backup-2026-06-24.json`,
  `civjourney-backup-2026-04-23.json`); 2 file thiết kế đời CivJourney; 2 thư mục phiên Claude của
  đường dẫn dự án cũ; 2 log của luồng localhost. **Dùng Thùng rác thay vì xoá vĩnh viễn** để còn
  đường lùi (nhất là 2 file backup dữ liệu thật). Đã quét lại toàn máy: chỉ còn MỘT thư mục dự án.
  ⚠️ **KHÔNG đụng tới** `~/Library/Application Scripts/com.macpomodoro` và
  `~/Library/Mobile Documents/iCloud~com~limepresso~pomodorofree` — đó là app Pomodoro của hãng
  khác, không liên quan dự án. Cũng giữ `~/Library/Application Support/pomodoro-game` (dữ liệu
  Electron của app tray đang chạy). Đã xác nhận app menu bar vẫn chạy sau khi dọn.

- **2026-08-05** — **Sửa "app biến mất khỏi thanh menu Mac" + bật tự khởi động.** KHÔNG đụng một
  dòng code ứng dụng nào (chỉ cấu hình máy + tài liệu). Nguyên nhân: app tray Electron không hề
  chạy (đã tắt từ lần khởi động lại máy nào đó). **3 bài học đắt, đã ghi vào `CLAUDE.md` mục
  "App menu bar Mac"**: (1) `DC Pomodoro.app` trong thư mục dự án KHÔNG phải app tray — nó là
  applet AppleScript đời cũ chạy `serve-dist.mjs` ở localhost:31105 và trỏ vào thư mục cũ
  `Pomodoro Game - USING`; mở nó không làm hiện icon (tôi đã nhầm đúng chỗ này lúc chẩn đoán đầu);
  (2) **launchd không chạy được đường dẫn có chữ tiếng Việt** — luôn thoát mã 78 không stderr, dù
  `plutil -lint` OK và `test -x` thấy file; đây CÙNG HỌ với bẫy NFC/NFD làm test nạp hai bản React
  → phải bọc qua script ASCII `~/Library/Application Support/dc-pomodoro-tray.sh`; (3) `main.js`
  không có khoá chống chạy trùng nên chạy 2 lần = 2 icon. Kết quả: LaunchAgent
  `com.dcpomodoro.tray` (RunAtLoad bật, KeepAlive tắt để nút "Thoát" còn tác dụng), đã xác minh
  bằng ảnh chụp màn hình thật (icon hiện, đếm ngược `🍅 22:34` khớp phiên đang chạy trên web, chỉ
  1 icon). Đã gỡ sạch LaunchAgent cũ `com.civjourney.localhost` (plist vào Thùng rác, khôi phục
  được) — nó thuộc luồng localhost đã bị cấm.

- **2026-07-17 (c)** — **ĐÓNG BLOCKER CRITICAL C1 (đồng bộ).** Đây là task THỰC THI đầu tiên đi
  qua đủ quy trình "Observe → Design → phản biện → Advisor duyệt → Implement": bản thiết kế bị
  chính mình bác 2 lỗi (tín hiệu `debounceTimer` luôn bật; bẫy lỗi đặt sai chỗ vì `pullFromCloud`
  không throw) + 1 lỗ (nhánh ghi không-CAS), rồi Advisor loại tiếp 2 đề xuất thừa (snapshot
  trước import; thêm `savedNotes` vào heuristic — chứng minh được `savedNotes` chỉ là phép chiếu
  của `history`). Sửa **duy nhất `src/lib/syncService.js`**: (a) `debounceTimer` về `null` khi nổ/
  huỷ; (b) rời app (`hidden`/`pagehide`) → đẩy ngay nếu còn thay đổi chờ; (c) `hasMeaningfulState()`
  chặn state trắng ghi đè cloud ở CẢ nhánh else của `initSync` LẪN nhánh `known < 0` (đường ghi
  duy nhất không có CAS — nay đọc cloud trước, lỗi thì hoãn ghi); (d) lỗi `42703` → `console.error`
  chỉ đích danh file SQL cần chạy; (e) nạp bản cloud thì huỷ lịch push mồ côi + cảnh báo. Test
  253→**261** (8 bài mới cho sync, 2 bài cũ sửa vì đặc tả hành vi cũ, + stub chặn debounce 5s thật
  để hết flaky). Lint sạch, build OK. **KHÔNG** làm snapshot A4 — đã ghi `TECH_DEBT.md` #8 kèm
  phân tích dung lượng; phát hiện thêm #9 (persist không bắt `QuotaExceededError`). Giới hạn còn
  lại có chủ đích: xung đột offline khác-trường vẫn mất phần của máy thua (ghi rõ ở
  `ARCHITECTURE.md` mục 2, không giả vờ đã xử lý).

- **2026-07-17 (b)** — **Quy tắc mới vĩnh viễn: TECHNICAL ADVISOR REPORT.** Đàm yêu cầu: sau MỖI
  task hoàn thành, ngoài báo cáo thường phải kèm phần "TECHNICAL ADVISOR REPORT" viết cho một AI
  Technical Advisor độc lập (GPT) đánh giá kiến trúc — ngắn, đủ ngữ cảnh, ≤1-2 trang A4, không
  marketing/tự khen/lặp changelog. **Bổ sung cùng ngày:** nâng từ 9 → **11 mục** (thêm mục 0 "Vì
  sao làm task này lúc này?" trước Mục tiêu, và mục 10 "Đề xuất task tiếp theo" — đúng MỘT task
  kèm trade-off), và **viết 100% tiếng Việt** (tiếng Anh chỉ cho tên file/class/hàm/biến/commit
  hash/API/framework/thuật ngữ không dịch tự nhiên được như CAS, debounce, snapshot, whitelist).
  Format chuẩn đã ghi vào `CLAUDE.md` (mục mới trong Governance Protocol, ngay sau "Báo cáo bàn
  giao cuối phiên") + memory `technical-advisor-report.md`.

- **2026-07-17** — **Giai đoạn A, lưới an toàn ĐỢT 2 (+16 bài, tổng 237→253; chỉ-thêm-test, không
  đụng code app).** Làm nốt phần Priority 1/3 còn thiếu so với đợt 1:
  • `gameMath.test.js` +6 bài `computeLevelUps` (ngưỡng đúng 6000, nhiều cấp một lần, giữa cấp,
    XP=0, và ĐẶC TẢ hiện trạng: XP âm cho levelsGained/spGained ÂM — không kẹp, ghi NOTE).
  • `gameStore.prestige.test.js` (MỚI, 5 bài) — bảo toàn tài sản qua Thăng Hoa: khoá TỪNG khoá
    whitelist sống sót (relics/relicEvolutions/achievements+unlockTimes/history/historyStats/
    savedNotes/sessionCategories/lastWeeklyReportDate/timerConfig/tinhThe + phát hiện `buildings`
    sống sót "ngầm" vì không nằm trong reset-state), khoá TỪNG khoá bị reset, sổ prestige
    (count/+5%/history), dưới ngưỡng 111000 EP → false không đổi gì, và **ĐÓNG BĂNG BUG #3**:
    3 skill Thăng Hoa (kien_thuc_nen/ke_thua/sieu_viet) mở rồi vẫn mất sạch + SP về 0 khi prestige
    — test khẳng định hành vi "hứa mà không làm" hiện tại; khi sửa #3 test này PHẢI đổi có ý thức.
  • `gameStore.completeFocusSession.test.js` +2 bài streak (hôm qua 5→hôm nay 6 kèm longestStreak;
    bỏ 3 ngày→về 1). • `gameStore.test.js` +2 bài `unlockSkill` cơ bản (trừ đúng 22 SP; thiếu SP →
    từ chối, không trừ oan). • `syncService.behavior.test.js` +1 bài retry (push lỗi bị nuốt →
    pushNow kế tiếp vẫn CAS đúng version cũ và thắng — lỗi không đầu độc trạng thái module).
  - Không phát hiện bug MỚI; bug đã biết #3 nay bị đóng băng bằng test. Lint sạch, build OK.

- **2026-07-13** — **Giai đoạn A: dựng "lưới an toàn" test cho 3 đường quan trọng nhất (đòn bẩy #1
  của roadmap POS — làm TRƯỚC khi sửa logic quan trọng).** Đàm ra lệnh chỉ thêm characterization/
  behavior test, KHÔNG refactor/không sửa bug/không đổi API. Đã thêm 3 file test (+29 bài, tổng
  208→237, xanh hết, lint sạch, build OK, **không đổi 1 dòng code app nào**):
  • `src/store/gameStore.completeFocusSession.test.js` (15 bài) — khóa đường-tiền: XP (qua đẳng
    thức `base = xp − missionBonus − streakMission − buildingPerk` để độc-lập-ngày), EP, tier/hệ số,
    tài nguyên/RP/refined, level-up (ngưỡng `EXP_PER_LEVEL`), loot, overclock hoàn gốc, combo, RNG
    tất định (stub `Math.random`), edge 0 phút, category tracking.
  • `src/lib/syncService.behavior.test.js` (8 bài) — khóa push/pull/CAS: upsert khởi tạo, update
    thắng (`.eq(version)`), **thua→re-pull nhận lại bản thắng** (đúng đoạn từng mất phiên thật), nuốt
    lỗi Supabase, initSync (cloud mới/rỗng/không-mới-hơn), shouldImportVersion. Mock singleton
    `supabase` + spy `_importGameData`; re-import "tươi" mỗi test để reset state module. **Test #7
    khóa CHỦ ĐÍCH hành vi rủi ro C1** (nhánh else initSync đẩy local vô điều kiện) làm đặc tả hiện
    trạng — bản vá C1 tương lai phải cập nhật test này.
  • `src/store/gameStore.cancelFocusSession.test.js` (6 bài) — khóa phạt/rollback: non-strict không
    trừ tài nguyên, strict trừ theo trần + mở disaster modal, recordSession:false, mất EP giam +
    reset staking, kẹp progressRatio [0,1], tất định.
  - Phương pháp: PROBE trước (quan sát hành vi thật, xác nhận tất định qua 2 lần chạy) → mới chốt
    golden. KHÔNG đoán. Bug phát hiện được → chỉ ghi NOTE trong file test, KHÔNG sửa (ngoài phạm vi).
  - Bài học kỹ thuật (để phiên sau đỡ vấp): (1) test đụng `syncService` sẽ nạp client Supabase THẬT
    → tạo 1 `MessagePort` giữ event loop sống → phải `unref()` handle trong `after()` kẻo `npm test`
    treo; (2) `setKnownVersion` ghi qua `localStorage` trần còn `getKnownVersion` đọc
    `window.localStorage` — mock phải trỏ CHUNG 1 store (trong trình duyệt là cùng object); (3) tổng
    XP một phiên dính bonus nhiệm vụ seed-theo-NGÀY nên KHÔNG hardcode được — phải khóa phần `base`.
  - Deploy: commit + push theo đúng quy tắc "làm" (test-only nên **bundle production KHÔNG đổi** —
    Vite không đóng gói `*.test.js`; đẩy chỉ để lưu lịch sử + giữ CI xanh, app không đổi hành vi).

- **2026-07-12** — **Thêm AI Engineering Playbook (Operating Manual) — protocol vĩnh viễn THỨ HAI
  cùng ngày, sau Project Governance Protocol bên dưới.** Đàm gửi tiếp một quy trình chi tiết cho
  CÁCH một AI thực hiện từng task (khác Governance Protocol — cái đó quản lý "tài liệu nào cần
  đồng bộ", cái này quản lý "làm task theo trình tự nào"). Đã tích hợp vào `CLAUDE.md` mục mới
  "🛠️ AI ENGINEERING PLAYBOOK": quy trình chuẩn 7 giai đoạn (Hiểu yêu cầu→Audit→Thiết kế→Thực
  hiện→Self Review→Validation→Knowledge Update), trình tự riêng theo loại task (Feature/Bug Fix/
  Refactor/Architecture Change), vai trò AI phải đóng (Senior Engineer/Architect/Reviewer/QA/
  Technical Writer/Maintainer), nguyên tắc kiến trúc (SRP/High Cohesion/Low Coupling/Reuse over
  Rewrite/Composition over Duplication/Explicit over Implicit), quy tắc commit, và mục quan trọng
  nhất: **"không giả định, không suy diễn"** — không chắc về codebase thì đọc code trước, code
  chưa đủ thì đọc tài liệu, tài liệu chưa đủ thì NÓI RÕ điều còn thiếu thay vì tự đoán rồi trình
  bày như sự thật (chính xác nguyên tắc chống-bịa đã áp dụng cho AI Coach, giờ áp dụng lại cho
  chính AI đang code). **Tránh trùng lặp có chủ đích**: phần "Review"/"Session Handoff" của
  Playbook trùng khá nhiều với Governance Protocol đã có — thay vì viết 2 checklist gần giống
  nhau, đã HỢP NHẤT template "báo cáo bàn giao cuối phiên" thành 1 bản 11 mục duy nhất (thêm mục
  "Đề xuất bước tiếp theo" từ bản Playbook vào bản Governance Protocol cũ, đổi số 10→11 mục), và
  phần Review chỉ bổ sung 3 câu hỏi Playbook có mà Governance Protocol chưa có (ADR mới/Migration/
  Lesson Learned) thay vì chép lại toàn bộ Self-audit checklist. Cập nhật kèm: `AI_ONBOARDING.md`
  (thêm mục trỏ tới Playbook), memory `project-governance-protocol.md` (gộp cả 2 protocol vào 1
  memory, sửa số đếm mục đã lệch). Không đổi code/hành vi app nào — thuần tài liệu + quy trình.

- **2026-07-12** — **Thiết lập Project Governance Protocol** (Đàm ra lệnh, áp dụng vĩnh viễn cho
  mọi phiên tương lai). Nguyên tắc cốt lõi: dự án gồm 3 thành phần giá trị NGANG NHAU — Source
  Code, Documentation, Project Knowledge — một task chỉ hoàn thành khi cả 3 nhất quán, KỂ CẢ khi
  code/build/test/lint đều xanh. Thêm **Definition of Done** mới (source+build+test+lint+doc+
  knowledge, thiếu 1 mục = chưa xong) và bảng "loại thay đổi → tài liệu cần cập nhật" vào
  `CLAUDE.md`. **5 file tài liệu MỚI** (ánh xạ trực tiếp từ yêu cầu của Đàm, tránh trùng lặp với
  `BAN_GIAO.md`/`AI_HANDOFF_KNOWLEDGE.md` đã có bằng cách phân vai rõ ràng ngay trong header mỗi
  file): `ARCHITECTURE_DECISIONS.md` (ADR — vì sao 6 quyết định kiến trúc lớn được chọn, phương án
  nào bị loại và tại sao), `TECH_DEBT.md` (7 mục nợ kỹ thuật đã biết, format có cấu trúc — đáng chú
  ý nhất: nghi vấn 3 kỹ năng prestige nhánh Thăng Hoa có thể chưa được nối dây thật vào
  `triggerPrestige()`, CẦN XÁC MINH trước khi Đàm đạt prestige lần đầu), `MIGRATION.md` (lịch sử
  migration schema/path thật, vd bump schema version 0→3, đổi cơ chế sync), `CHANGELOG.md` (tóm
  tắt CHÍNH THỨC ngắn gọn theo mốc, trỏ về nhật ký chi tiết ở đây cho ai cần sâu hơn), và
  `AI_ONBOARDING.md` (bản đọc nhanh 10-15 phút, khác `AI_HANDOFF_KNOWLEDGE.md` là bản đầy đủ). Rà
  soát nhẹ `README.md` (thêm 5 câu hỏi bắt buộc: project là gì/chạy/build/deploy/đọc tiếp gì),
  `ARCHITECTURE.md` (thêm mục storage flow + database schema flow + hướng phụ thuộc), và
  `PROJECT_STRUCTURE.md` (thêm quy tắc import — xác nhận KHÔNG có alias/barrel trong repo — và quy
  tắc đặt tên). Không đổi code/hành vi app nào — thuần tài liệu + quy trình.

- **2026-07-12** — **Refactor kiến trúc toàn dự án (Đàm yêu cầu "Senior Software Architect", 10 nguyên tắc rõ ràng — không sửa lỗi lẻ tẻ, ưu tiên kiến trúc).** KHÔNG đổi business logic (điểm/XP/streak/nhiệm vụ/timer/schema DB/API contract) — chỉ dọn trùng lặp + chuẩn hoá cấu trúc + giảm coupling. Tóm tắt (chi tiết đầy đủ: xem báo cáo bàn giao cuối do Claude viết ra trong phiên này, hoặc `git log` các commit cùng ngày):
  - **Xoá dead code**: `electron/preload.js`, `EraHUD.jsx`/`ParticleBackground.jsx`/`DCPomodoroBrand.jsx`, 9 file SVG `public/brand/`, `tray-icon.png`, `icons.svg`, `OverviewTabLegacy` (~772 dòng chết trong `StatsDashboard.jsx`), vài effect/hàm mồ côi.
  - **Gộp 9 mảng logic bị chép tay nhiều nơi** thành abstraction dùng chung: mark-label 1-2 chữ (7 nơi) → `src/utils/labelMark.js`; AudioContext (sound/ambient engine) → `src/engine/audioContext.js`; auth-check CRON_SECRET (3 route) → `isCronAuthorized` (`api/_lib/http.js`) — nhân tiện SỬA 1 bug thật: `isSessionEndEvent` lệch chuẩn giữa `dispatch.js`/`notify-now.js`, nay hợp nhất 1 bản; badge/style (BuildingWorkshop↔BlueprintInventory) → `src/components/shared/BadgeKit.jsx`; parser Rich Text trùng trong `RichText.jsx`; icon Glyph cục bộ (NotificationCenter) → dùng chung `icons/Glyph.jsx`; pipeline Gemini (gọi model→sanitize→chống chữ lạ→chống bịa số) từng chép 3 lần ở CoachChat/CoachOffline/CoachNudge → `src/engine/coach/guardedGenerate.js`; payload push (title/body/tag) từng chép ở client+2 route server → `src/engine/pushPayloads.js`; hàm gọi Gemini thuần tách khỏi `api/coach.js` → `api/_lib/gemini.js`.
  - **Chuẩn hoá cấu trúc lớn nhất**: gom TOÀN BỘ "bộ não" AI Coach (từng rải ở `src/engine/llm/` lẫn `src/engine/` gốc) vào **`src/engine/coach/`** — `coachPrompt.js` (404 dòng) tách thành `prompt.js` (mẫu câu) + `guard.js` (lưới chống-bịa); `coachContext.js`/`coachIntel.js`/`coachSuggest.js`/`coachAdviceMemory.js`/`cloudEngine.js`/`guardedGenerate.js` dời vào cùng thư mục. ⚠️ Verify AN TOÀN quan trọng nhất: sau khi dời, `coachEval.test.js` (đổi tên `eval.test.js`) vẫn in đúng **BẮT 16/16 (100%) · BÁO NHẦM 0/16 (0%)** — chứng minh KHÔNG đổi hành vi lưới chống-bịa.
  - **Tách nhẹ God file** (không tách hẳn, theo đúng yêu cầu): rút 11 hàm định dạng thuần khỏi `StatsDashboard.jsx` → `src/components/statsFormatters.js` (+9 test). `gameStore.js`/`useTimer.js` giữ nguyên cấu trúc (đã đánh giá: tách hẳn cần rất nhiều test hành vi mới an toàn — xem lý do ở `ARCHITECTURE.md` mục 6).
  - **Tài liệu mới**: `ARCHITECTURE.md` (bức tranh kiến trúc + luồng dữ liệu + lý do chia lớp), `PROJECT_STRUCTURE.md` (cây thư mục annotated + quy tắc đặt file mới); sửa mọi đường dẫn cũ trong `CLAUDE.md`/`BAN_GIAO.md` theo cấu trúc mới; thêm pointer ở đầu `README.md`.
  - **Kết quả cuối**: `npm test` **208/208** (từ 195, +13 bài mới cho code vừa tách), lint sạch, build OK, đúng **10 Serverless Functions** (không đổi). 86 file bị đụng tới (thêm/sửa/xoá/dời), 0 thay đổi business logic ngoài 1 bug auth đã nêu trên.
  - ⚠️ **Việc CHƯA làm, để dành lần sau** (không phải bỏ sót — quyết định có chủ đích vì rủi ro/lợi ích chưa đủ hấp dẫn cho app 1 người dùng): tách nhỏ `gameStore.js` (~6000 dòng)/`completeFocusSession` (~760 dòng) thành nhiều store con; `shouldImportVersion` vẫn nằm trong `syncService.js` (chưa đưa ra `lib`/`engine` riêng, giá trị thấp).

- **2026-07-11** — **FIX TRIỆT ĐỂ (theo yêu cầu Đàm): deploy Vercel FAIL vượt trần 12 Serverless Functions.** Bản vá đầu (`.vercelignore` loại `*.test.js`) chỉ là tạm — Đàm yêu cầu xử lý gốc, không phải nhớ cập nhật blacklist mỗi lần thêm test. Đã **chuyển toàn bộ 5 file test của `api/` vào `api/_tests/`** (mirror cấu trúc, vd `api/_tests/push/dispatch.test.js`), dùng đúng quy ước underscore-prefix Vercel đã tự bỏ qua sẵn cho `api/_lib/` — cấu trúc này an toàn VĨNH VIỄN, không phụ thuộc tên file, không cần nhớ thao tác gì trước khi deploy. `.vercelignore` giữ lại làm lớp phòng thủ thứ 2 (mở rộng thêm `*.spec.*`/`*.mock.*`/`*.fixture(s).*`/`*.stories.*`/`*.bench.*`/`*.e2e.*` phòng lỡ tay đặt nhầm chỗ). `package.json` glob test → `api/_tests/*.test.js api/_tests/push/*.test.js`. `npm test` 195/195, lint sạch, build OK. Còn đúng 10 function thật, dư 2 trước khi chạm trần 12. ⚠️ **Quy tắc mới**: mọi test API sau này PHẢI đặt trong `api/_tests/`, không đặt cạnh route handler nữa (xem CLAUDE.md).

- **2026-07-11** — **SỰ CỐ + FIX: "First action wins" — chống 2 máy giành nhau ghi đè khi đồng bộ.** Sau khi resume project (sự cố phía trên), điện thoại vừa hoàn thành 1 phiên "Học Đại Học 25p" nhưng lần đẩy dữ liệu đó bị lỗi mạng (đúng lúc project đang khôi phục) — thất bại ÂM THẦM, không tự thử lại. Sau đó laptop mở app, một thao tác vô hại (chuyển tab Thống kê) vẫn khiến nó đẩy state CŨ (không có phiên đó) lên đè lên đám mây — vì cơ chế cũ dùng "ai ghi cuối cùng thắng" (client tự ghi `updated_at`, không phải server). Khi thử khắc phục trực tiếp (bảo Đàm bấm nút trên điện thoại), 2 máy cùng mở app RỒI GIÀNH NHAU ghi liên tục → màn hình timer nhảy qua nhảy lại, lệnh Huỷ không ăn — phải bảo Đàm ĐÓNG HẲN 1 máy lại mới dừng được vòng lặp. **Kết quả: phiên "Học Đại Học 25p" đó bị mất khỏi bản đồng bộ chung** (có khả năng cao đã bị ghi đè mất luôn cả khỏi local điện thoại trong lúc giành giật, do một lần pull tự động chạy đúng lúc `isRunning` không chặn được).
  - **NGUYÊN NHÂN GỐC** (Đàm chỉ đích danh + đặc tả rõ yêu cầu): sync cũ là "ai ghi cuối thắng" theo đồng hồ CLIENT, không có khái niệm thứ tự thao tác thật (server) → 2 máy mở cùng lúc = ăn may, có thể mất dữ liệu bất cứ lúc nào, không chỉ lúc lỗi mạng.
  - **FIX: "First Action Wins"** qua compare-and-swap phía server. Thêm cột `version` (integer) vào `game_state` + trigger Postgres tự tăng mỗi lần UPDATE (`supabase/game_state_version.sql`, do SERVER cấp — không lệch giờ giữa máy). `src/lib/syncService.js` viết lại: mọi lần ghi kèm điều kiện `.eq('version', expectedVersion)`; ghi bị từ chối (0 dòng khớp, nghĩa là máy khác đã ghi trước) → máy đó THUA, tự `pullFromCloud()` nhận lại bản đã thắng, KHÔNG được phép ép ghi đè nữa (đúng yêu cầu "chỉ tồn tại 1 trạng thái duy nhất"). Guard cũ dựa vào `timerSession.isRunning` (thêm hồi tháng 6 để chống 1 bug khác) đã GỠ vì không còn cần — version là nguồn xác định thứ tự chính xác tuyệt đối, mạnh hơn suy đoán isRunning. Đổi `LAST_CLOUD_SYNC_KEY` (timestamp máy khách) → `LAST_CLOUD_VERSION_KEY` (số version từ server) trong `appIdentity.js`. Test thuần `shouldImportVersion` ở `src/lib/syncService.test.js`. `npm test` 195/195 (+2), lint sạch, build OK.
  - ⚠️ **THỨ TỰ DEPLOY QUAN TRỌNG**: phải chạy `supabase/game_state_version.sql` trong SQL Editor TRƯỚC (hoặc gần như ngay khi) code mới lên Vercel — thiếu cột `version`, mọi lần ghi sẽ lỗi `column "version" does not exist` → sync ngừng hẳn tạm thời cho tới khi chạy SQL.
  - ⚠️ **DỮ LIỆU MẤT THẬT**: phiên "Học Đại Học 25p" (~15:47–16:12 ngày 11/07/2026, +26 XP) coi như mất, không phục hồi qua sync được nữa (không tái tạo tay bằng SQL vì sẽ không đi qua đúng logic XP/streak/mission của game, dễ gây sai lệch số liệu khác). Bài học ghi vào memory `sync-first-action-wins.md`.

- **2026-07-11** — **Thêm cron "giữ nhịp tim" cho Supabase** (tiếp theo sự cố pause bên dưới). Ngoài nguyên nhân "vượt hạn mức dung lượng" (đã xử lý), Supabase Free còn có thể tự pause project nếu ~7 ngày không có request API nào — rủi ro thật với app 1 người dùng. Thêm `api/keepalive.js` (Vercel Cron, `vercel.json` chạy 3h sáng mỗi ngày UTC) gọi 1 câu `select` cực nhẹ vào `game_state` qua `getAdminClient()` (đúng client Supabase, tính là hoạt động thật, không phải cron nội bộ Postgres). Bảo vệ bằng `CRON_SECRET` như các cron khác (`api/coach-digest.js`, `api/push/dispatch.js`). `npm test` 193/193 (+2 `isAuthorized`), lint sạch, build OK. Không cần biến môi trường mới (dùng lại `CRON_SECRET`+`SUPABASE_SERVICE_ROLE_KEY` đã có).

- **2026-07-11** — **SỰ CỐ: đồng bộ 2 máy ngừng hoạt động — project Supabase tự tạm dừng vì phình dung lượng.** Đàm báo máy tính+laptop không còn đồng bộ. Điều tra: project Supabase bị Supabase tự PAUSE (miễn phí tự pause khi hạn mức bị vượt), dữ liệu vẫn an toàn (không phải bị xoá). Nguyên nhân gốc: bảng nội bộ `cron.job_run_details` phình tới **795 MB / 821 MB tổng dung lượng** (dữ liệu game thật `public.game_state` chỉ ~192 KB — không hề có vấn đề). Job `dc-pomodoro-push-dispatch` (đẩy thông báo push, xem `supabase/push_dispatch_scheduler.sql`) chạy mỗi 5 giây suốt ~2 tháng, mỗi lần tự ghi 1 dòng log vào `cron.job_run_details` mà chưa từng dọn → vượt hạn mức 0.5 GB của gói Free → Supabase tự pause project. **ĐÃ XỬ LÝ**: (1) Đàm bấm "Resume project" trên Supabase dashboard — khôi phục xong, dữ liệu nguyên vẹn. (2) Dọn log cũ (`DELETE` + `VACUUM FULL cron.job_run_details`) → Database Size tụt về 0.028 GB. (3) Thêm job tự-dọn log mỗi đêm (giữ 3 ngày gần nhất) — xem `supabase/cleanup_cron_logs.sql` — để không bao giờ phình lại. (4) Giữ nguyên tần suất job push-dispatch ở 5 giây (Đàm quyết định giữ nguyên, không giãn ra — job tự-dọn mỗi đêm là đủ để giữ dung lượng ổn định ở mức thấp). ⚠️ **Lưu ý cho phiên sau**: nếu Database Size lại báo gần 0.5 GB, kiểm tra `cron.job_run_details` trước tiên (không phải `game_state` — bảng đó luôn nhỏ). Nếu job tự-dọn (`cleanup-job-run-details`) từng bị mất do tạo lại project mới thì phải chạy lại `supabase/cleanup_cron_logs.sql`.

- **2026-06-25** — **[Mảng 6/6] Cảnh báo chuỗi sắp đứt qua PUSH** (Coach chủ động lúc người dùng VẮNG). CRON `api/coach-digest.js` + helpers thuần `api/_lib/coachDigest.js` (`evaluateStreakRisk`/`pickActiveBucketLabel`/`buildStreakNudgePayload`, test). Mỗi ngày 17:00 VN (`vercel.json` crons) đọc `game_state` từ Supabase; nếu chuỗi treo (còn chuỗi nhưng hôm nay chưa làm phiên nào) → đẩy thông báo giữ-chuỗi (kèm "buổi hay làm" nếu rõ). Tái dùng hạ tầng push sẵn có (không cần SQL mới). Bảo vệ `CRON_SECRET`. `npm test` **191/191** (+3), lint sạch, build OK, smoke-import endpoint OK. ⚠️ Vercel Hobby cron 1 lần/ngày; cần đã bật push iPhone + env (CRON_SECRET/SERVICE_ROLE/WEB_PUSH) sẵn có. **→ HOÀN TẤT chuỗi 6 mảng nâng cấp AI Coach.**

- **2026-06-25** — **[Mảng 5/6] Bộ nhớ lời khuyên (cá nhân hoá — Đàm ưu tiên)**. `coachAdviceMemory.js` (thuần+test): Coach NHỚ lời khuyên chỉnh-mục-tiêu-ngày đã đưa + số liệu lúc đó (localStorage `dc-coach-advice-v1`), sau ≥3 ngày (cửa sổ 3–21 ngày) thêm dòng "Ghi nhớ: khoảng N ngày trước gợi ý chỉnh mục tiêu về X… (khi đó đạt A% trên B ngày)… đối chiếu hiện tại… tương quan". Biến Coach từ phân-tích-một-lần thành theo-dõi-theo-thời-gian. Nối ở hook `useCoachContext` (đọc bộ nhớ → dòng + ghi lời khuyên hiện tại parse từ context; write thưa/idempotent). THUẦN tương quan, KHÔNG nhân-quả (prompt cấm); mọi số nằm trong dòng → guard không báo nhầm. ⚠️ `parseGoalAdviceFromContext` parse dòng "Mục tiêu ngày…thử chỉnh về Z phiên/ngày" — đổi định dạng dòng đó phải sửa regex. `npm test` **188/188** (+6), lint sạch, build OK, eval vẫn 100%/0%. ⚠️ Dòng "Ghi nhớ" chỉ hiện sau ≥3 ngày kể từ lần đầu có gợi ý chỉnh mục tiêu (cần thời gian trôi để có "câu chuyện từ đó tới nay").

- **2026-06-25** — **[Mảng 4/6] Model MẠNH hơn cho bài phân tích 4 phần**. `buildModelChain(tier,env)` (`api/coach.js`, thuần+test): body thêm `tier`; `'deep'` → thử `gemini-2.5-pro` trước rồi rơi về nguyên chuỗi flash (vừa khôn vừa an toàn). CHỈ "AI phân tích tổng thể" (`CoachOffline`) gọi `tier:'deep'`; chat + nhắc-sau-phiên giữ flash nhanh+rẻ (đã bật billing nên không lo tiền). `cloudEngine` truyền `tier`. Timeout 28s + maxDuration 30 (mảng 1) đỡ cho pro chậm hơn. KHÔNG đổi sang JSON mode (rủi ro) vì `scrubFabricatedLines` đã giữ khung [1][2][3][4] + bỏ riêng dòng bịa → một số bịa không làm rớt cả bài. `npm test` **182/182** (+1 buildModelChain), lint sạch, build OK.

- **2026-06-25** — **[Mảng 3/6] Coach CHỦ ĐỘNG: tự nhắc 1 câu sau mỗi phiên** (đòn bẩy lớn nhất). `CoachNudge.jsx` trong thẻ AI Coach (cả desktop `FocusRail` lẫn iPhone `FocusCoachMobile`): khi vừa xong một phiên (history[0] hợp lệ + trong ~5 phút), Coach tự viết MỘT câu bám số phiên vừa xong → hiện ngay, khỏi bấm hỏi. Phần thuần: `buildNudgeContext` (ghép "Phiên vừa xong: N phút, loại …" vào đầu context để guard CHO PHÉP nhắc số phiên đó) + `NUDGE_INSTRUCTION`, dùng CHUNG `buildLLMChatPrompt`+lưới chống-bịa. An toàn: chạy nền không chặn kết thúc phiên, lỗi/chữ-lạ → im lặng, vẫn qua guard (cứu-câu). Chống lặp + chạy đúng cả mobile (thẻ ẩn lúc chạy phiên rồi mount lại): localStorage `dc-coach-nudge-v1` (mỗi phiên ≤1 lần) + gác recency 5 phút (mở app sau nhiều giờ không nhắc phiên cũ). `npm test` **181/181** (+1 buildNudgeContext), lint sạch, build OK. ⚠️ Chỉ thấy "sống" khi Đàm xong một PHIÊN THẬT (không test được trên dev vì cấm chạy phiên trên dev). Chưa gửi push (người dùng đang ở trong app); push để dành mảng 6.

- **2026-06-25** — **[Mảng 2/6] Tín hiệu "phiên trơn vs ngắt quãng"** cho AI Coach. App đã LƯU SẴN số lần tạm dừng mỗi phiên (`e.pauseSegments`) và hiện ở Thống kê, nhưng Coach KHÔNG hề đọc → thêm `getInterruptionPattern` (`gameMath.js`) đếm phiên liền mạch (0 lần dừng) vs đứt quãng (≥1) → dòng mới trong `buildAnalystContext` ("Phiên liền mạch (chạy hết không tạm dừng): S/T phiên (P%)…"). ⚠️ CHỈ tính phiên CÓ trường pauseSegments (phiên cũ thiếu trường → bỏ, KHÔNG coi là trơn để khỏi thổi phồng); gác ≥8 phiên có dữ liệu. Thêm chip `flow` ("Phiên của mình có hay bị tạm dừng…") trong `coachSuggest.js` (catalog/RELATED/KEYWORD/GATE/detectSignals). Eval mở rộng (+1 sạch/+1 bịa, vẫn BẮT 16/16, BÁO NHẦM 0/16). `npm test` **180/180**, lint sạch, build OK. ⚠️ Dòng chỉ hiện khi đã có ≥8 phiên MỚI (có pauseSegments) — dữ liệu mẫu cũ chưa có nên chưa thấy; phiên thật từ nay sẽ tích dần.

- **2026-06-25** — **[Mảng 1/6] Siết NIỀM TIN cho AI Coach** (Đàm: "làm toàn bộ, chuyên sâu" sau workflow đề-xuất 10 agent). 5 việc: **(1) Sửa nhiệt độ lệch** — tài liệu ghi 0.2/0.8 nhưng code chạy 0.3/0.9; kéo về 0.2/0.8 ở `api/coach.js` (default) + 2 caller `CoachChat`/`CoachOffline` → model ít chế số/trôi. **(2) Bộ chấm điểm chống-bịa** `coachEval.test.js` + `coachEvalFixtures.js` (30 câu mẫu: 15 sạch + 15 bịa + 4 chữ-lạ) → đo BẮT %/BÁO NHẦM %; ngưỡng BÁO NHẦM=0 (siết), BẮT≥90%. Lần đầu: **BẮT 15/15 (100%), BÁO NHẦM 0/15 (0%)** — in ra mỗi lần `npm test`. **(3) Timeout** `cloudEngine.js` tự AbortController 28s (không treo vô tận → code 'timeout') + `vercel.json` `maxDuration:30` cho `/api/coach` (tránh Vercel cắt hàm trước khi model dự phòng kịp cứu; nền cho việc dùng model mạnh hơn ở mảng 4). **(4) CoachOffline viết-lại-CÓ-HƯỚNG-DẪN** (bắt số bịa → chèn lượt chỉ đích danh rồi chạy lần 2, như CoachChat) thay vì viết-lại-mù. **(5) Dọn chữ cũ** còn hứa "mất mạng tự dùng AI dự phòng trên máy" (Qwen đã gỡ) ở CoachChat/CoachOffline + comment header. `npm test` **178/178** (172→178: +4 coachEval, +1 topP, sửa 1 assertion temp), build OK. ⚠️ Verify bằng test (không mở dev — tránh đụng dữ liệu thật Supabase).

- **2026-06-24** — **BẬT BILLING Gemini (paid tier) → CHẠY ỔN ĐỊNH, HẾT 429.** Đàm tự bật billing trên Google AI Studio/Cloud cho key. Đã verify cổng production 2 lượt: cả 2 OK trên `gemini-2.5-flash`, trả lời tiếng Việt tự nhiên, **không còn 429**. Trước đó 429 là do trần FREE thấp + đo/test nhiều trong ngày, KHÔNG phải bug. **Không cần sửa code** (billing nằm phía Google). Cập nhật CLAUDE.md + BAN_GIAO + memory. Chuỗi model giữ nguyên: gemini-2.5-flash → 2.5-flash-lite → 2.0-flash. ⚠️ Nên đặt budget cảnh báo ~$5/tháng cho an tâm; chi phí thực ~16–80k đ/tháng (dùng cá nhân vài câu/ngày).
- **2026-06-24** — **GỠ HẲN Qwen2.5-3B + WebLLM, chỉ còn Gemini** (Đàm: "bỏ Qwen, giữ cấu trúc đã đào tạo để áp lên Gemini"). XOÁ `src/engine/llm/webllmEngine.js` + `guard.test.js`; gỡ `LLM_MODELS`/`detectWebLLMCapable`/`mapInitProgress` khỏi `coachPrompt.js` (+ test); gỡ dep `@mlc-ai/web-llm` (npm install --legacy-peer-deps; lockfile 0 @mlc); gỡ manualChunk `vendor-webllm` + globIgnores webllm/wasm trong `vite.config.js`. SỬA `CoachChat.jsx`/`CoachOffline.jsx`: bỏ nhánh fallback Qwen + `capable`/`progress`/warm-prefetch → chỉ `generateCloud`; làm sạch câu chữ UI. GIỮ NGUYÊN "bộ não": 2 prompt + toàn bộ lưới chống-bịa + tầng số liệu + coachSuggest (model-agnostic, áp lên Gemini). `npm test` 174/174 (−3: bỏ 2 test webllm-cap + guard.test.js), lint sạch, build OK, **không còn webllm trong bundle/precache, key không vào bundle**. Smoke-test preview: thẻ Coach render sạch, không lỗi (mấy lỗi console là trạng-thái HMR giữa chừng, đã hết sau khi build). Đánh đổi: mất mạng/hết quota = Coach ngừng (không còn dự phòng máy).
- **2026-06-24** — **Gemini: chốt model + chống 503 + tắt thinking** (sau khi verify cổng production). `gemini-2.5-flash` CHÍNH → tự nhảy `gemini-2.5-flash-lite` khi 503/500/429 (đo thực tế flash free hay quá tải + chạm giới hạn; lite ổn định hơn). TẮT thinking (`thinkingBudget:0`) vì 2.5 bật mặc định → ăn hết token làm câu CỤT. `callModel` (chính retry 1 lần, dự phòng 1 lần) + `shouldFallback`. Env `GEMINI_MODEL`/`GEMINI_MODEL_FALLBACK` (có default, khỏi đặt). ⚠️ Key `AQ.Ab8…` Đàm dán trong chat **trông không giống key AI Studio (`AIza…`)** — đã dặn Đàm tạo key mới + revoke key lộ. `npm test` 177.
- **2026-06-24** — **ĐỔI HƯỚNG: Coach chạy GEMINI (đám mây) làm chính + Qwen dự phòng + CHẠY CẢ iPHONE** (Đàm chốt: 3B ngu + tốn RAM/đĩa → chuyển sang API free khôn hơn). **MỚI**: `api/coach.js` (Vercel serverless, giữ `GEMINI_API_KEY`, map sang Gemini `generateContent`; pure helpers test `api/coach.test.js`) + `src/engine/llm/cloudEngine.js` (`generateCloud` gọi `/api/coach`). **LUỒNG**: CoachChat/CoachOffline gọi Gemini trước → lỗi (no-key/quota/mất mạng) rơi về Qwen on-device (chỉ desktop; iPhone báo lỗi nhẹ). **iPhone NAY DÙNG ĐƯỢC Coach**: bỏ `if(!capable) return null`, FocusRail bỏ gate `aiCapable`, `FocusCoachMobile` render thẳng CoachChat+CoachOffline (App.jsx truyền goalProps). Bỏ warm-prefetch Qwen (không tải model nặng lên máy nữa). **GIỮ NGUYÊN** toàn bộ prompt + lưới chống-bịa + tầng số liệu (model-agnostic) → chạy tốt hơn vì Gemini khôn hơn 3B. `.env.example` thêm `GEMINI_API_KEY`/`GEMINI_MODEL`; test glob thêm `api/*.test.js`. `npm test` 175/175, lint sạch, build OK precache 0 webllm; smoke-test preview: thẻ Coach hiện cả desktop+mobile, 0 lỗi console. ⚠️ **ĐÀM PHẢI TỰ LÀM**: lấy key free ở aistudio.google.com → thêm `GEMINI_API_KEY` vào Vercel env (chưa có key thì Coach tự rơi về Qwen trên máy).
- **2026-06-24** — **Coach: tín hiệu mới + giọng văn MƯỢT (bớt robot) + chống-bịa thêm** (ultracode, workflow 3 góc + phản biện; synth chốt tay sau lỗi auth tạm thời). Đàm: thêm tín hiệu phân tích, câu chữ trơn tru hơn, không robot, chống bịa hơn. **(1) 2 tín hiệu mới (gác chặt, prefix riêng)**: `getWeekendVsWeekdayContrast` (cuối tuần vs trong tuần) + `getComebackRate` (quay lại sau 1 ngày nghỉ). **streak-at-risk** GỘP vào `predictStreakKeep` (`atRisk` → "Giữ chuỗi" mở bằng "Chuỗi N ngày đang treo", KHÔNG thêm dòng). Bỏ category-momentum + session-length-trend (làm bảng dài/trùng → 3B loạn). **(2) CAP** `COACH_MAX_CONTEXT_LINES=18` + `capContextLines` cắt theo ƯU TIÊN (giữ Tổng quan/Chân dung/Hôm nay + STRONG, "Ghi chú" cắt trước). **(3) GIỌNG MƯỢT**: prompt thêm "CÁCH VIẾT"/"GIỌNG VĂN" (viết câu chảy liền, bớt liệt kê) + làm mềm các câu tất-định — RANH GIỚI nới-câu-nối/siết-con-số, honesty giữ nguyên, **decoding GIỮ 0.2/0.8**. **(4) CHỐNG BỊA**: `findFabricatedFractions` (phân số N/M ghép sai) + chuẩn hoá `phần trăm`↔`%`. Phản biện (CẦN_CHỈNH) bắt: giữ prefix empty-state, cap theo ưu-tiên không slice mù, không entity-guard, không đổi temp vội — đã áp hết. `npm test` 172/172, lint sạch, build OK precache 0; 3 lưới self-consistency rỗng, bảng 16 dòng (≤18), không ký tự `′`. ⚠️ Giọng mượt cần Đàm thử tay trên Mac.
- **2026-06-24** — **Bổ sung TOÀN DIỆN Coach (đợt rà 24 ý → vét → 10 việc an toàn)** (ultracode, workflow 3 phase: 4 ý-tưởng + ~24 vét + 1 chốt). Đàm: "thêm mọi thứ, thông minh + chính xác hơn". Làm 4 đợt: **(1) Sửa 3 BUG chính xác**: dòng khuya dùng `lateGoalTotal` làm cỡ mẫu % (trước dùng `lateAttempts` → phóng đại); Tổng quan <60 phút in "phút" (hết "~0 giờ"); trung vị mục tiêu ngày `medianDisplay` qua `roundGoalValue`. **(2) Chip thông minh hơn**: `detectTopics` (số nhiều) cho câu đa-ý + `LOOSE_KW`; thêm 2 chip `longTrend`+`portrait` (mở khoá tín hiệu sâu). **(3) Lưới GHÉP-SAI %↔cỡ-mẫu** `findMismatchedPairs` (bắt "79% trên 18 phiên" kiểu ghép chéo; BẢO THỦ, verify 9/9 paraphrase thật không báo nhầm) cắm vào cứu-câu. **(4) UX CoachChat (desktop)**: lưu hội thoại localStorage (lượt khôi phục KHÔNG vào prompt), làm ấm engine khi mở modal, nút Thử lại + lỗi phân loại, câu mẫu bám tín hiệu + empty-state. **HOÃN (trình Đàm quyết riêng — làm bảng dài/3B loạn hoặc đảo quyết-định-sản-phẩm)**: tín hiệu mới `category-momentum`/`session-length-trend`/`streak-at-risk`/`comeback-after-rest`, và `mobile-static-summary` (iPhone xem số tĩnh — Đàm từng gỡ rule-answers nên cần xác nhận). `npm test` 158/158, lint sạch, build OK precache 0 webllm; self-consistency 2 lưới rỗng. ⚠️ Phần UI cần Đàm thử tay trên Mac.
- **2026-06-24** — **Nâng trung thực Coach: phòng-thủ-theo-tầng** (ultracode, workflow 6 agent + 1 phản biện). Đàm: nâng độ chính xác, không bịa số, không có số thì BÁO không có. (1) **Viết-lại-CÓ-HƯỚNG-DẪN**: bắt số bịa → `buildCorrectionNote`/`appendCorrectionTurn` chèn lượt chỉ ĐÍCH DANH số sai rồi chạy lần 2 (thay vì blind). (2) **CỨU-CÂU** thay nuke: `stripFabricatedSentences` (chat — bỏ riêng CÂU bịa, giữ câu sạch) + `scrubFabricatedLines` (offline — bỏ riêng DÒNG, giữ 4 phần, phần rỗng→"chưa đủ dữ liệu"). (3) **CoachOffline NAY CŨNG có guard số** (trước chỉ chống chữ-lạ). (4) **Mở rộng lưới**: thêm đơn vị "tiếng"(=giờ). (5) **Siết prompt** 2 system: "KHÔNG CÓ SỐ THÌ NÓI KHÔNG CÓ" + "RANH GIỚI HỌC vs NÓI" + map 1-1 phần [3] cứng. ⚠️ **Phản biện bắt 1 landmine THẬT**: band "vừa (26–44 phút)" — mốc dưới "26" không có "phút" liền sau → guard sẽ báo nhầm "26 phút" khi user vào band vừa → đã vá `BAND_LABEL.vua='vừa (26 phút–44 phút)'` TRƯỚC. ⚠️ BỎ (rủi ro báo nhầm): entity-guard, kiểm cỡ-mẫu trong guard, đơn-vị-kép, dung sai làm-tròn. `npm test` 147/147, lint sạch, build OK precache 0 webllm. Self-consistency rỗng + band-vừa không báo nhầm. ⚠️ Qwen vẫn cần Mac (WebGPU) để test câu chữ.
- **2026-06-22** — **DIỆT fake-số ở "Hỏi Coach"** (ultracode, workflow 4 agent: lưới chặn-bịa + làm rõ bảng + siết prompt). Đàm báo Hỏi Coach VẪN bịa số nhiều. Tạo **tệp lịch sử mẫu ~24 giờ** `scripts/coach-sample.mjs` → in đúng bảng số liệu Qwen nhận (bảng CHUẨN → fake là do 3B). 4 tuyến: (1) **Lưới chặn-bịa-số TẤT ĐỊNH** `findFabricatedNumbers`/`hasFabricatedNumbers` (`coachPrompt.js`): số kèm đơn-vị-dữ-liệu không có trong bảng = bịa → `CoachChat.jsx` viết lại 1 lần, vẫn bịa thì KHÔNG hiện câu bịa (test `coachGuard.test.js`; self-consistency rỗng; bắt đủ 50 phiên/3.7 giờ/95%/40 phiên). (2) **Làm rõ bảng** (`coachContext.js`): dòng "Loại việc" tách mỗi loại 1 dòng + tên trong ngoặc kép + bỏ `|`; dòng khuya đổi nhãn "phiên làm sau 22 giờ đêm"; **bỏ hết ký tự `′`** đổi sang "phút" (cả `coachIntel.js` BAND_LABEL + momentum) — guard nhận đơn vị + 3B khỏi đọc nhầm. (3) **Siết prompt**: SỬA ví dụ "ĐỌC ĐÚNG GIÁ TRỊ" — bỏ số cụ thể "2.3h" (chính nó bị 3B chép ra!), thay bằng PLACEHOLDER X/A/B/C; thêm luật "TÊN MỤC ≠ NỘI DUNG". (4) **Hạ nhiệt** decoding 0.3→0.2, 0.85→0.8. Kèm sửa marker `coachSuggest.js` + fixture + assertion test. `npm test` 136/136, lint sạch, build OK precache 0 webllm. ⚠️ Tôi KHÔNG chạy được Qwen ở máy dev (cần WebGPU) → guard là tuyến tất định; Đàm test tay trên Mac để xác nhận câu chữ.
- **2026-06-21** — **Coach thành "chuyên gia phân tích" + SỬA bug trả-lời-giả** (ultracode; workflow thiết kế + workflow /code-review 17 agent). BUG Đàm báo: Hỏi Coach nhái khuôn few-shot → bịa ("Loại việc 2.3h"). FIX: bỏ HẲN `COACH_CHAT_FEWSHOT` + thêm luật **ĐỌC ĐÚNG GIÁ TRỊ** (chép phần sau dấu hai chấm, đừng lấy nhãn). KHÔN HƠN: chat = khung chuyên gia 3 nhịp (quan sát→xu hướng→1 lời khuyên); "AI phân tích tổng thể" = 4 phần (thêm [2] Xu hướng + [3] Chân dung). HIỂU CHỦ: dòng **"Chân dung của bạn"** (đặc điểm ổn định, kèm cỡ mẫu). HỌC THEO THỜI GIAN: **`getMultiWeekTrend`** + dòng "Xu hướng dài hạn". **/code-review bắt 1 bug THẬT**: xu hướng tính cả tuần-trống = 0′ "ma" → báo hướng SAI ("0′→0′→300′→320′: giữ nhịp") cho người mới/quay lại → ĐÃ SỬA: CHỈ tính tuần CÓ dữ liệu, cần ≥3 tuần (minWeeks=3), len lẻ dùng ceil (không bỏ sót tuần giữa); + sửa ví dụ vàng offline (bỏ "+12%/tuần" sai math/không khớp output). Không retrain, không persist field mới (history dày dần → tín hiệu chín dần). `npm test` 125/125, lint sạch, build OK precache 0 webllm.
- **2026-06-21** — **Hỏi Coach khôn hơn + Đề xuất theo ngữ cảnh + đổi tên Coach offline** (Đàm ra lệnh, ultracode, workflow 4 agent). (1) `COACH_CHAT_SYSTEM` viết lại (bản đồ "chọn-đúng-dòng" theo câu hỏi + siết trung thực) + `COACH_CHAT_FEWSHOT` 2 ví dụ vàng KHÔNG-số (dạy văn phong, tránh rò số) chèn vào `buildLLMChatPrompt`; `STARTER_CHIPS` 10 câu mẫu. (2) Engine MỚI `src/engine/coachSuggest.js` (thuần luật, không LLM) + `coachSuggest.test.js` (8 bài): `pickSuggestions` chọn 2-3 "Đề xuất tiếp theo" theo tín hiệu user CÓ (đọc chuỗi buildAnalystContext) + chủ đề vừa hỏi (`detectTopic` có/không dấu), bỏ câu đã hỏi, tất định. CoachChat render khối "Đề xuất tiếp theo" sau mỗi câu trả lời (chip bấm → gửi). (3) Đổi tên "Coach offline" → **"AI phân tích tổng thể"** ở UI + COACH_OFFLINE_SYSTEM + comment. KHÔNG train lại trọng số (model đúc sẵn) — "khôn hơn" qua prompt+few-shot+context+gợi-ý. `npm test` 116/116, lint sạch, build OK precache vẫn 0 webllm.
- **2026-06-21** — **GỠ MỌI AI TRỪ QWEN + dọn nhẹ app** (Đàm ra lệnh, ultracode, workflow 4 agent map+thiết kế → tự code tuần tự). XOÁ: `src/engine/qa/` (⚡Nhanh) + `useCoachQA`; `api/coach.js` (Claude) + `buildCoachContext`/default `useCoachContext`; `src/engine/semantic/` (MiniLM) + `useNoteThemes`; bộ trả lời theo luật `generateCoachBriefing`/`generateCoachInsight` (gameMath) + `useCoachInsight`/`CoachCard`/`FocusReport`/`useCoachIntel`; giọng cảm xúc `coachVoice.js`/`useCoachVoice`/`ai-coach-sim/`/`coachPersonality`; `coachContext.test.js`. GỠ deps `@huggingface/transformers`+`@anthropic-ai/sdk`; dọn `vite.config.js` + `package.json` test glob. DỜI guard test webllm → `src/engine/llm/guard.test.js`. SỬA: `CoachChat.jsx` (chat Qwen thuần, iPhone `return null`), `FocusRail.jsx` (thẻ AI = 2 nút Qwen, chỉ desktop), `FocusCoachMobile.jsx` ("Mở trên máy tính"), `App.jsx`, `useCoachContext.js`, `coachContext.js`, `gameMath.js`/`.test.js`, `settingsStore.js`. Tầng số liệu GIỮ làm nguồn cho Qwen. `npm test` 108/108, lint sạch, `npm run build` OK + precache 1.6MB (0 webllm/wasm). Lockfile cập nhật.
- **2026-06-21** — **Chốt 1 model GỌN: Qwen2.5-7B → Qwen2.5-3B** (workflow 4 agent: tiếng Việt+trôi / năng lực-vs-kích thước / chạy thực 16GB → hợp nhất). Lý do: LLM ở app chỉ DIỄN ĐẠT số đã-tính-sẵn nên 3B "đủ khôn"; cùng họ 7B nên dùng lại nguyên lưới chống-trôi; ~2.4GB nhẹ trên 16GB. `LLM_MODELS` còn DUY NHẤT `Qwen2.5-3B` (bỏ key `light`); BỎ nút "Thử mô hình nhỏ hơn" + tải model thứ 2 — dự phòng = ⚡Nhanh (luật, 0 byte). Decoding siết lại `temp 0.35→0.3, top_p 0.9→0.85` (3B dễ trôi hơn 7B). Timeout `900s→300s`. UI: bỏ "7B"/"~4.5GB"/"RAM≥16GB", đổi nhãn "AI 7B"→"AI trên máy" (model-agnostic). Tiết kiệm ~2GB so với 7B (tới ~4GB nếu trước đã cache cả 7B+3B). Phương án B nếu 3B trôi nhiều: `gemma-2-2b-it`. `npm test` 142/142, lint sạch. Cache 7B cũ vẫn nằm trong trình duyệt tới khi xoá site data thủ công.
- **2026-06-21** — **"Hỏi Coach" chat được với AI 7B trên máy** (Đàm muốn chat với 7B thay vì cứ bị đẩy sang Claude). Thêm toggle 2 chế độ trong `CoachChat.jsx`: ⚡ Nhanh (engine số liệu cũ) / 🧠 AI 7B (chat tự do, CHỈ desktop có WebGPU). Chat 7B dùng `buildLLMChatPrompt`+`COACH_CHAT_SYSTEM` mới (hội thoại, KHÔNG ép khuôn 3 phần) + `buildAnalystContext` (số liệu giàu) + streaming + lưới `hasForeignScript`/viết-lại + timeout 900s. Tái dùng engine 7B singleton của Coach offline → đã tải thì xài lại NGAY, không tải lại. Câu ngoài tầm Nhanh → nút "Hỏi AI trên máy (7B)" (desktop) đặt cạnh "Hỏi Claude". `webllmEngine` vẫn CHỈ dynamic import (build-safety ok). +1 test `buildLLMChatPrompt` (142/142), lint sạch. iPhone: không có WebGPU → không thấy toggle, vẫn chế độ Nhanh + Claude như cũ.
- **2026-06-21** — **Nâng model Coach offline 3B → Qwen2.5-7B** (Đàm chọn, Mac 16GB). `LLM_MODELS.default` = `Qwen2.5-7B-Instruct-q4f16_1-MLC` (~4.5GB tải, ~5GB VRAM), `light` = 3B (fallback nút "Thử mô hình nhỏ hơn"). Khôn hơn + model lớn nên ÍT trôi tiếng Trung. Giải mã nới: `temp 0.3→0.35, top_p 0.8→0.9` (`webllmEngine.js`). Timeout tải `300s→900s` cho file lớn (`CoachOffline.jsx`) + đổi chữ UI "~1GB"→"~4.5GB, RAM ≥16GB". Model tải runtime từ CDN nên KHÔNG đụng bundle/precache. `npm test` 141/141, lint sạch. CHƯA chạy thử 7B thật trên Mac.
- **2026-06-21** — **Vá lỗi Coach offline (LLM) "trôi" sang tiếng Trung** (Đàm thấy output có 小时/约…). 3 lớp: (1) prompt ép TIẾNG VIỆT 100% + cấm chữ Hán/Pinyin/Anh, đơn vị viết chữ Việt + thêm bước tự-kiểm ngôn ngữ (`COACH_OFFLINE_SYSTEM`); (2) hạ giải mã `temperature 0.4→0.3`, `top_p 0.85→0.8`, `freq 0.3→0.2` (`webllmEngine.js`) để bớt token lạ; (3) `hasForeignScript()` mới (`coachPrompt.js`, bắt CJK/Hangul/Kana) + `CoachOffline.jsx` TỰ VIẾT LẠI 1 lần khi dính, vẫn dính → trạng thái `error-lang` mời thử lại/Hỏi Coach. +1 test `hasForeignScript`. `npm test` 141/141, lint sạch. CHƯA verify model thật trên Mac.
- **2026-06-21** — **Thẻ AI Coach briefing → phong cách ĐỌC SỐ** (theo yêu cầu Đàm: muốn đọc/phân tích số liệu + gợi ý theo số, không cảm xúc). Bỏ HẲN giọng cảm xúc khỏi thẻ: `FocusRail.jsx` + `FocusCoachMobile.jsx` thôi dùng `useCoachVoice`, lấy `coach.text`/`coach.reason` từ `useCoachInsight` (→ `generateCoachBriefing`) làm câu chính + dòng phụ; `tone="đọc số"`. `useCoachVoice.js` + `engine/coachVoice.js` GIỮ lại nhưng dormant (không nơi nào trong `src/` import; sim 4104/4104 vẫn chạy). `settingsStore.coachPersonality` orphan. `npm test` 140/140, lint sạch. *(Cùng ngày trước đó đã thử bước trung gian: gỡ 3 nút + cố định giọng zen — nay thay luôn bằng đọc-số.)*
- **2026-06-21** (deploy `eb44638`) — **Coach offline (LLM trên máy) nâng cấp trí tuệ** (workflow 7 agent: hiểu bài → 3 thiết kế → hợp nhất). Chốt **một phong cách phân tích chuyên sâu đọc-số** (bỏ giọng cảm xúc ở tầng này). Mới: `buildAnalystContext` (`coachContext.js`) nạp cả `buildCoachIntel` (hồ sơ Wilson + dự đoán) + `getTodayPaceInsight` + `getLateNightQualityDrop` — mỗi % kèm cỡ mẫu, bỏ tín hiệu thiếu mẫu, bỏ trùng ghi chú; hook `useAnalystContext`. Prompt 3 phần + ví dụ vàng + tự-kiểm (`COACH_OFFLINE_SYSTEM`); giải mã `0.4/top_p0.85/freq0.3/700` (`webllmEngine.js`); UI `CoachOffline.jsx` đổi sang "Phân tích chuyên sâu". KHÔNG đụng `buildCoachContext` (Claude vẫn dùng). +10 test thuần (`coachContext.analyst.test.js`) + nới cap sanitize→2200. Tiện tay: sửa 1 lỗi lint cũ ở `coachVoice.js` (bỏ tham số `score` thừa trong `breakRules`, không đổi hành vi). `npm test` 140/140, lint sạch, sim coachVoice 4104/4104. CHƯA verify output model 3B thật (cần Mac có WebGPU).
- **2026-06-21** — Sửa lỗi `predictBestWindow` (`coachIntel.js`) bỏ sót buổi đêm khuya (buổi vắt qua nửa đêm) + test. *(Đã gộp vào `eb44638`; commit gốc `9fbcd62` giờ dangling sau khi main bị xáo lịch sử.)*
- **2026-06-20** — "Hỏi Coach" trả lời OFFLINE không cần LLM (`src/engine/qa/` + `CoachChat.jsx`). *(Đã gộp vào `eb44638`; commit gốc `1e27505` giờ dangling.)*
- **2026-06-20** — Nâng quy tắc tài liệu thành **NGUYÊN TẮC ƯU TIÊN SỐ 1**, mở rộng 2 vế: (1) đọc CLAUDE.md+BAN_GIAO.md+file liên quan trước khi làm; (2) sau mọi thay đổi dù nhỏ, cập nhật CLAUDE.md+BAN_GIAO.md+file liên quan khác. Ghi vào CLAUDE.md, hook, và bộ nhớ.
- **2026-06-20** — Ghi cứng quy tắc "luôn cập nhật CLAUDE.md + BAN_GIAO.md sau mọi thay đổi" vào bộ nhớ cá nhân của Claude (loại feedback) để mọi phiên sau không quên.
- **2026-06-20** — Dọn file thừa/lệch: xoá 2 worktree copy mâu thuẫn trong `.claude/`; xoá `NATURALNESS-REPORT.md` (gộp vào `ai-coach-sim/README.md`); gỡ `backups/`, `DC Pomodoro.app`, Logo html khỏi git (giữ trên máy + gitignore); bỏ dòng cảnh báo worktree trong CLAUDE.md.
- **2026-06-20** — Soát lại 2 file đối chiếu code (workflow 3 agent): BAN_GIAO khớp 100%; sửa 2 chỗ lệch nhỏ trong CLAUDE.md (initSync chạy sau khi store nạp xong; coachVoice có test riêng ở ai-coach-sim/) + thêm khối Web Push (env/VAPID/SQL/service worker) + cảnh báo worktree cũ.
- **2026-06-20** — Bắt buộc quy trình bàn giao: thêm hook tự chèn BAN_GIAO.md vào đầu MỖI phiên AI (`.claude/session-start-bangiao.sh` + `.claude/settings.local.json`), và ghi 2 quy tắc bắt buộc (đọc-trước / cập-nhật-sau) lên đầu CLAUDE.md.
- **2026-06-20** — Gọn tài liệu về 2 file (CLAUDE.md + BAN_GIAO.md), đổi tên HANDOVER → BAN_GIAO.
- **2026-06-20** — Gộp engine Coach về 1 nguồn (`ai-coach-sim/ai-coach.mjs` chỉ trỏ về `src/engine/coachVoice.js`). Verify: test sandbox 4104/4104 + `npm test` 131/131.
- **2026-06-20** — Vá CLAUDE.md (thêm mục AI Coach, tick web push đã xong) + lập bàn giao đầu tiên.
- **2026-06-20** (`7a72f48`) — Giọng Coach theo tính cách gắn vào thẻ Coach.
- **2026-06-20** (`b94db18`) — Cộng Hưởng: nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu.
- (cũ hơn) — Xem `git log` + thư mục memory cho lịch sử đầy đủ.
