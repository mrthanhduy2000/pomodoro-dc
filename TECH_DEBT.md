# Technical Debt Log — Pomodoro DC

> Mọi nợ kỹ thuật đã biết PHẢI nằm ở đây — không được để chỉ tồn tại trong trí nhớ của một phiên
> AI cụ thể. Đây là một phần bắt buộc của Project Governance Protocol (xem `CLAUDE.md`).
>
> **Quy tắc xử lý khi phát hiện nợ kỹ thuật mới**: nếu rủi ro thấp và có thể xử lý ngay trong phạm
> vi công việc đang làm → xử lý luôn, không cần mở mục riêng. Nếu rủi ro trung bình/cao hoặc ngoài
> phạm vi công việc hiện tại → PHẢI thêm một mục vào file này trước khi kết thúc phiên, không được
> bỏ qua.
>
> **Ngưỡng "Maintenance Sprint"**: khi số mục có Priority = High hoặc Critical vượt quá **8–10
> mục**, HOẶC khi một module cụ thể đã trải qua ≥3 lần vá lỗi/refactor nhỏ trong lịch sử gần đây
> mà không được refactor triệt để, phải CHỦ ĐỘNG đề xuất mở một "Maintenance Sprint" (nêu rõ mục
> tiêu/phạm vi/lợi ích/rủi ro/tiêu chí hoàn thành) thay vì tiếp tục cộng thêm tính năng mới.
>
> **Trạng thái ngưỡng hiện tại (2026-08-16, cập nhật sau Phase 9D)**: **#30 và #27 đã ĐÓNG CẢ HAI**
> — đúng như hai mục ấy đã tự nối cứng, chúng là một bài toán duy nhất (*màu là trục DUY NHẤT mang
> bản sắc mặt đường*) và được giải cùng lúc bằng cách mở thêm chín trục cấu trúc, chứ không phải
> bằng cách chỉnh lại con số nào. Nay còn **1 mục High** (#14) + **2 mục Medium-High** (#3, #13) +
> **1 mục Medium-High chờ Đàm quyết** (#24) = 4 → xa ngưỡng 8–10 mục, KHÔNG cần Maintenance Sprint.
>
> **Cập nhật 2026-08-18 (Việc 1 — chốt #38)**: **ĐÓNG #38** ngay trong ngày mở. Đàm bác đề xuất
> "nâng trần chung lên 14" và chọn **15 mốc riêng từng kỷ** + đối chứng bắt buộc; hoá ra cách ấy
> **không cần đụng `materials.js`** (cổng chỉ ĐỌC bảng vật liệu), nên cái tưởng là blocker thật ra
> là hệ quả của việc đề xuất sai giải pháp. Nay còn **1 mục High** (#14) + **2 mục Medium-High**
> (#3, #13) + **1 mục Medium-High chờ Đàm quyết** (#24) = 4 → xa ngưỡng 8–10, KHÔNG cần Maintenance
> Sprint.
>
> **Cập nhật 2026-08-18 (Phase 12 / Việc 1 — đường sá, nguyên nhân 1)**: **MỞ #42, Priority
> Medium** — vỉa hè bị cái kẹp `walk ≤ 0,5 − half` bóp trong im lặng trên ĐẠI LỘ ở **8/15 kỷ**, tệ
> nhất còn **11%** bề rộng đã khai (kỷ 12 khai "vỉa hè mênh mông" mà dựng ra 0,02 ô). Phát hiện
> trong lúc sửa mép đường; phần chặn lời hứa "hết bậc" đã sửa ở ADR-031, phần còn lại là quyết định
> mỹ thuật ⇒ chờ Đàm. Nay còn **1 High** (#14) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết**
> (#24, #41, #42) = 6 → vẫn dưới ngưỡng 8–10, chưa cần Maintenance Sprint, nhưng **đã có ba mục
> liên tiếp bị chặn bởi cùng một lý do (quyết định mỹ thuật)** — nếu con số này lên 4 thì nên gộp
> thành một lượt hỏi Đàm duy nhất thay vì hỏi lẻ.
>
> **Cập nhật 2026-08-19 (§3a — sai số hộp bao)**: **ĐÓNG luôn câu hỏi hộp bao, nhưng KHÔNG theo
> cách cố vấn đoán.** Cố vấn bảo *"giữ hộp bao, đo sai số một lần, dưới ~5 điểm phần trăm thì đóng
> vĩnh viễn"*. Đo ra **11,10 đpt trung bình, tới 24,47 đpt** — không đóng được, phải sửa. Tách ba
> nguồn: **6,11 đpt** do LUẬT TÔ *"ô mẫu bị chạm vào là tô trọn"* (không liên quan gì tới hộp bao —
> đó là sai số của chính cái bút vẽ) · **4,86 đpt** do tô hộp bao CẢ công trình (sân giữa bốn tháp
> góc bị tính là nhà) · **0,13 đpt** do hình từng khối. ⇒ Phần cố vấn dự đoán là nguồn sai số hoá ra
> là phần **duy nhất không đáng lo**. `planCoverage` nay tô **đa giác đáy thật, luật tâm ô, lưới 16
> mẫu/ô**; bản cũ giữ lại tên `planCoverageCu` chỉ để đối chứng. ⚠️ **Bảng mật độ mặt bằng cũ
> (26,6 / 48,8 / 72,4%) KHÔNG so trực tiếp được** với bảng mới (**20,1 / 37,6 / 55,8%**).
> Khoá bằng `scripts/planCoverage.test.js` (5 bài, 6/7 phép phá đỏ đúng chỗ đã nêu trước; phép phá
> thứ 7 không đỏ và đã đo chứng minh nó là TỊNH TIẾN lưới lấy mẫu chứ không phải sai số).
>
> **Cập nhật 2026-08-19 (§1 — vá #49)**: **ĐÓNG #49** (ảnh nay cắt đúng hộp bao canvas qua CDP
> `clip`, không còn cờ đoán nào) và **MỞ #50, Priority Medium** — `md5sum` ảnh dựng đổi theo TẢI
> MÁY (±1 trên ~2% điểm ảnh), nên nó chỉ chứng minh được một chiều. Số mục High/Critical KHÔNG đổi:
> **1 High** (#14) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết** (#24, #41, #42) = 6, vẫn
> dưới ngưỡng 8–10.
>
> **Cập nhật 2026-08-18 (Phase 12 — đo mốc nền)**: **MỞ #43, Priority Medium** — `PERFORMANCE.md`
> KHÔNG có gì máy đọc được canh, và nó đã trôi thật: Phase 11-B sửa hình học mái rồi không cập nhật
> tài liệu, để **6/15 kỷ sai số tam giác** suốt từ đó. Cột lệnh vẽ thì có `drawCallBudget.test.js`
> canh nên vẫn đúng — tức chỗ có test thì không trôi, chỗ không có test thì trôi, ngay trong cùng
> một bảng. Nay còn **1 High** (#14) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết** (#24, #41,
> #42) + **1 Medium** (#43) = 7 → vẫn dưới ngưỡng 8–10, nhưng chỉ còn cách một mục.
>
> **Cập nhật 2026-08-18 (Phase 11 — mái, ĐO ẢNH XONG)**: **MỞ #41, Priority Medium** — phase thêm
> 110.076 tam giác lên mái mà **bản quét 15 kỷ vẫn không phân biệt được với bản trước** (90/90 ô
> dưới ngưỡng mắt 12, trung vị 2,2), tức **KHÔNG đạt** điều kiện nghiệm thu Đàm đặt ra. Chi tiết có
> thật ở thang gần (1,2–8,4% điểm ảnh ở khung app; 15,1% khi zoom sát mái kỷ 9) nhưng không sống
> sót tới thang quét. Đo được thêm một quy luật dùng được cho Phase 12: **thứ phá ĐƯỜNG VIỀN sống
> sót, thứ chỉ thêm BỀ MẶT thì không** — kỷ 8 tốn nhiều hình học nhất (+48,5%) mà đổi ít nhất
> (1,2%). ⛔ Cách chữa là quyết định MỸ THUẬT ⇒ **chờ Đàm**, không tự phóng to. Nay còn **1 High**
> (#14) + **2 Medium-High** (#3, #13) + **2 chờ Đàm quyết** (#24, #41) = 5 → vẫn xa ngưỡng 8–10.
>
> **Cập nhật 2026-08-18 (Phase 11 — mái)**: **MỞ #39 và #40**, cả hai Priority **Low**. #39 =
> `crownWeight` là trục mỏng (6/105 cặp) và với `barrel` thì bước lượng hoá còn rộng hơn cả dải hợp
> lệ — đã khoá sự thật ấy bằng một `assert` tự đỏ nếu có kiểu thứ hai rơi vào. #40 = `parts.js`
> không có `rx`/`rz` nên ngói ống là phép xấp xỉ. Cả hai đều là **giới hạn đã biết có điều kiện xem
> lại**, không phải lỗi. Nay còn **1 mục High** (#14) + **2 Medium-High** (#3, #13) + **1
> Medium-High chờ Đàm quyết** (#24) = 4 → xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **Cập nhật 2026-08-18 (Phase 10, Bước 2)**: **ĐÓNG #36** — cả 15 kỷ nay đều có cửa ra vào thật,
> kể cả kỷ 1 và 2. **MỞ #38** (Priority Low-Medium): đo đủ 15 kỷ lần đầu tiên thì lộ ra **kỷ 10 =
> 14 lệnh vẽ**, tức vượt cái trần "13" mà cổng nghiệm thu đang dùng — nhưng nó **đã như vậy từ
> trước Phase 10** (đo trên `HEAD` cũng ra 14), nên đây là một **con số nền chưa từng được đo**,
> không phải hồi quy. Sửa nó phải đụng `materials.js`, nằm ngoài phạm vi file được phép của chương
> trình hiện hành ⇒ ghi nợ, không tự sửa. Ngoài ra Bước 2 phát hiện hai chuyện đáng ghi nhưng cả
> hai đều đã xử lý ngay trong phiên nên không thành nợ: (a) kỷ 14 khai `doorWidth` vượt trần khiến cả
> kỷ ấy **mất cửa trong im lặng** — validator từ chối đúng, `emitGroundFloor` trả `false` đúng, và
> không gì đỏ lên; nay có một assert bắt "khai hợp lệ nhưng không dựng ra khối nào"; (b) kỷ 4 và
> kỷ 6 chỉ khác nhau **1/8 trục** tầng trệt — sửa BẢNG (kỷ 4 lùi cửa sâu hơn, mở rộng hơn, đúng
> quy chế điện cung đình) chứ không hạ sàn. Số mục High vẫn là **1** (#14) — #38 là Low-Medium nên
> không đổi ngưỡng; tổng vẫn **5 mục**, vẫn xa ngưỡng 8–10.
>
> **(Ảnh chụp trước đó, Phase 10 Bước 1)**: mở **#36** (Priority **Medium** — kỷ 1 và 2 vẫn chưa
> có cửa; nguyên nhân gốc đã sửa, tự đóng khi Bước 2 chạy) và **#37** (Priority **Low** — cửa sổ
> không xoay theo độ nghiêng thân nhà, sai số hiện dưới một điểm ảnh). Không mục nào là High/
> Critical ⇒ số mục High vẫn là **1** (#14), vẫn xa ngưỡng.
>
> ⚠️ **Phase 9D KHÔNG mở mục nợ mới**, nhưng có ghi hai bài học vào `CLAUDE.md` (công cụ đo tự chế
> nói dối lần thứ 20 và 21 — cả hai đều nằm trong công cụ vừa viết ra trong chính phiên ấy).
>
> **Cập nhật 2026-08-17 (Performance Gate)**: mở **#31** (Priority **Low** — bản đồ bóng sống sót
> qua `city.dispose()`; app hiện KHÔNG dính vì mỗi cảnh một renderer riêng, nhưng là mìn hẹn giờ
> nếu sau này có ai dùng lại renderer giữa các kỷ) và **#32** (đồng hồ đo HUD báo thiếu 56% số tam
> giác — **ĐÃ SỬA ngay trong phiên**, ghi lại vì nguyên nhân gốc là một hình dạng sai đã tái diễn
> lần thứ hai). Số mục High/Critical **KHÔNG đổi**: vẫn 1 mục High (#14) + 3 mục Medium-High
> (#3, #13, #24) → xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Ảnh chụp trước đó, sau Phase 9B)**: thêm **#30** (Medium-High —
> mặt đường render DƯỚI ngưỡng mắt đọc được xét riêng vật liệu; đã có bản vá đo xong nhưng CỐ Ý
> chưa ship vì nó làm đỏ một lời hứa đang có). ⚠️ **#30 và #27 nay là MỘT cặp phải làm cùng nhau** —
> #30 phơi ra rằng lời hứa "15 kỷ ra 15 mặt đường" xưa nay chỉ đạt nhờ **3% biên**, và đạt được
> chính nhờ khuyết tật mà #30 phải sửa. Nay là **1 mục High** (#14) + **4 mục Medium-High**
> (#3, #13, #24, #30) = 5 → vẫn CHƯA đạt ngưỡng 8–10 mục để đề xuất Maintenance Sprint, nhưng đã
> đi được nửa đường tới đó; nếu phase sau lại thêm một mục Medium-High nữa thì phải cân nhắc.
>
> **(Ảnh chụp trước đó, sau Phase 8D)**: thêm **#29** (Low — cọ nhìn
> từ đúng trên xuống dẹt thành dấu "✳", do `parts.js` không nghiêng được khối; đã giảm nhẹ ở 8D,
> ĐỪNG vá nếu chỉ vì cây cọ). Vẫn **1 mục Priority High**
> (#14) → vẫn CHƯA đạt ngưỡng 8–10 mục để đề xuất Maintenance Sprint. Còn **3 mục Medium-High**
> (#3, #13, và **#24**: 14/15 kỷ có công trình bị mép khung hình cắt, đã đo đủ, chờ Đàm chọn
> hướng). **#28 đã ĐÓNG CẢ HAI PHẦN** — cạnh sắc ở Phase 8B, bàn cờ ô vuông ở Phase 8C.
> Còn **4 mục Medium** và **2 mục Low** (#25 — nhà dân nhỏ nhất ở 3 kỷ không có cửa sổ; **#27**
> — 3 cặp kỷ có mặt đường gần trùng nhau vào BAN ĐÊM, đều cách nhau ≥3 kỷ, đã đo đủ và có
> chủ đích chưa xử lý).
> ⚠️ **#26 và #23 đóng được bằng CÙNG MỘT lần đo, và mảng 8 đã làm nó GẤP HƠN BỐN LẦN**: sau 7C
> cảnh nặng nhất là 21.244 tam giác; **8A → 24.532 (41%)**, **8B → ~29.000 (48%)**, **8C → ~36.100
> (60%)** trần 60.000. Cổng hiệu năng iPhone **chưa được cân lại kể từ trước Phase 7A** — tức đã
> BỐN phase liền cộng tải lên một con số chưa ai kiểm, và phase mới nhất là phase đắt nhất
> (+4.800 tam giác cho địa hình). Một ảnh chụp HUD trên máy Đàm đóng cả hai. ⚠️ Đàm đã chỉ thị rõ
> **không được lấy blocker này làm lý do dừng cải thiện hình ảnh** — nên vẫn làm tiếp, nhưng đây
> nay là mục cần đo GẤP NHẤT: nếu iPhone không gánh nổi thì `SUB = 3` ở `terrainMesh.js` là cái núm
> hạ tải rẻ nhất (SUB 3 → 2 cắt 6.498 xuống 2.888, tức trả lại gần hết khoản chi của 8C).
> ⚠️ **CẬP NHẬT 2026-08-16 — #22 VÀ #19 ĐỀU ĐÃ ĐÓNG.** #22 vá gốc bằng cách **bỏ hẳn** proxy "mái"
> (lưới 6×3 ô con ở `scripts/sweepMetric.mjs`, không còn giả định mỹ thuật nào để mà hỏng lần nữa);
> #19 nhờ đó đo lại được và **cả 105 cặp kỷ đều trên ngưỡng mắt** (gần nhất 23,3 · trung vị 41,1).
> ⚠️ Hai bộ số của #19 **KHÔNG so trực tiếp được** (cũ đo màu mái, mới đo cả dải thành phố) — chi
> tiết ở đầu mục #19. Nay còn **hai mục Medium**: **#26** và **#23** (cổng hiệu năng iPhone chưa đo
> lại sau khi đổi sang PBR). **#15, #16, #17 và #20 đều đã đóng** — không còn mục nào chờ Đàm chọn
> hướng mỹ thuật.
> ⚠️ **#22 là ví dụ sạch nhất trong cả file này của một luật đáng nhớ**: *sửa đúng mã sản phẩm vẫn
> có thể làm HỎNG công cụ đo*, vì công cụ đo bao giờ cũng đứng trên vài giả định không được viết ra
> về thứ nó đang đo. Ở đây giả định ngầm là *"mái là thứ tươi nhất khung hình"* — đúng suốt thời kỳ
> mái suy từ màu nhấn giao diện, và chết ngay khi mái thành vật liệu lợp thật. **Bài học rút ra khi
> đóng nó còn quan trọng hơn**: đừng vá một proxy hỏng bằng một proxy khôn hơn — hỏi lại xem nó
> sinh ra để giải bài toán gì, rồi giải thẳng bài toán đó, để không còn proxy nào mà hỏng.
> ⚠️ **#17 LÀ VÍ DỤ THỨ HAI CỦA ĐÚNG CÁI BẪY MÀ BÀI HỌC #16 DƯỚI ĐÂY CẢNH BÁO** — và lần này nặng
> hơn: mục đó không chỉ ghi nhầm một lỗi thành "đánh đổi cần Đàm quyết", nó còn **chẩn đoán nhầm
> hẳn chặng ngày** (đổ cho chặng chiều, trong khi cặp hỏng thật là bình minh ↔ hoàng hôn). Nguyên
> nhân: đo đúng MỘT trục (góc màu của dải trời) rồi kết luận về cả bức tranh. Đọc phần đóng khung
> ở đầu #17 trước khi viết bất kỳ mục nợ mỹ thuật nào.
> ⚠️ **CÒN MỘT mục đang CHỜ ĐÀM QUYẾT, không phải chờ AI làm**: #14 (phiên im lặng — cân bằng
> game). **Đã nhẹ đi thật, đo lại 2026-08-14: 95% → 80–85%** (Phase 4I + Phase 5D). Nhưng phần còn
> lại **không sửa được bằng mã**: sau phiên thứ 44 của mỗi kỷ, thành phố hết chỗ để lớn thật, nên
> nói thêm câu nào cũng là bịa. Câu hỏi cho Đàm nay đã thành câu hỏi CÓ/KHÔNG, không còn là "vá thế
> nào" — xem cuối mục #14. Review Trigger của nó vẫn chặn các khoản đầu tư kế tiếp vào lễ mừng.
> ⚠️ **BÀI HỌC TỪ #16 — ĐỌC TRƯỚC KHI GHI MỘT MỤC NỢ MỚI LÀ "ĐÁNH ĐỔI CẦN NGƯỜI QUYẾT"**: #16 từng
> được ghi vào đây là *"đánh đổi thẩm mỹ, chờ Đàm quyết"*, vì chú thích tại chỗ tuyên bố nó có chủ
> đích. Nhưng chú thích ấy tuyên bố **HAI** ý định, không phải một — và ý định thứ hai (*"thành phố
> lộ ra rõ nhất ở khoảng trống phía dưới, đúng chỗ chẳng có chữ gì"*) **đang không đạt**. Đo chỗ chữ
> thật đứng thì hoá ra không có gì phải đánh đổi cả. ⇒ Trước khi kết luận "cần người quyết", hãy
> kiểm xem mã có đang làm ĐÚNG điều nó tự nhận không; một trade-off chỉ có thật khi cả hai vế đều
> đã đạt và phải hy sinh một vế.
> ⚠️ **Vế THỨ HAI của ngưỡng ĐÃ CHẠM và đã được XỬ LÝ MỘT PHẦN**: `palette3d.js` đã qua **5 đợt** vá
> mỹ thuật (3C · 3G · 3M · 3N · 3V). Phase 3V không vá riêng bầu trời mà **sửa đúng phép toán dùng
> chung** (`skyward()` chuyển từ trộn RGB sang xoay sắc, cùng khuôn đã dùng cho mái nhà ở 3N) — tức
> đã đi theo khuyến nghị "xem xét tổng thể" thay vì vá điểm.
> **Phần CHƯA làm của khuyến nghị đó**: mặt đất và nước vẫn còn vài chỗ trộn RGB. Chưa thấy triệu
> chứng nào ở 180 ô vừa quét, nên KHÔNG mở mục nợ mới — nhưng nếu xuất hiện **đợt vá thứ 6** cho
> `palette3d.js` thì lần đó phải là một đợt rà soát toàn bộ phép trộn màu còn lại, không vá tiếp.
> ⚠️ **#14 là nợ THIẾT KẾ, không phải nợ mã** — không có gì hỏng, nhưng nó chặn giá trị của mọi đầu
> tư về sau vào lớp thành phố (95% số phiên không thấy lễ mừng). Nó **cần Đàm chọn hướng** trước
> khi bất kỳ phiên AI nào động vào, vì mọi phương án đều đổi cân bằng kinh tế.
> ⚠️ **Cảnh báo quy trình từ mục #13**: một khoản nợ đã bị TÀI LIỆU CHE MẤT nhiều tháng — sổ ghi
> "lưới test đã có, chỉ chưa cắm vào" trong khi thực tế chưa từng có file nào. Khi đọc bất kỳ mục
> nào trong sổ này mà nó khẳng định "đã có sẵn X", hãy **kiểm bằng lệnh trước khi tin** (`git log
> --all --diff-filter=A -- '<đường dẫn>'` / `find`). Sổ nợ mà ghi sai thì còn nguy hơn không có sổ.
> *(Lịch sử của mốc trên, giữ lại để thấy nó tới từ đâu: `palette3d.js` qua 3C ánh sáng · 3G bảng
> quét · 3M sắc độ đêm · 3N màu mái — bốn đợt, đều tìm ra lỗi THẬT bằng phép đo, nên khi đó CHƯA
> phải "vá đi vá lại một chỗ"; `daylight.js` qua 3 đợt 3D · 3G · 3M. Mốc đặt ra khi đó là "đợt thứ
> 5 cùng loại thì dừng xem xét tổng thể" — #15 chính là đợt thứ 5 đó.)*

---

## #1 — God Function: `completeFocusSession`

- **Module**: `src/store/gameStore.js`
- **Priority**: Medium
- **Severity**: Medium
- **Impact**: Khó đọc, khó test từng phần riêng, dễ sinh bug "dùng giá trị state cũ/mới lẫn lộn"
  trong cùng một lệnh `set()`. Ảnh hưởng tới TOÀN BỘ hệ thống thưởng (XP/EP/tài nguyên/streak/
  nhiệm vụ/thành tích/thách đấu) vì đây là điểm nối trung tâm của tất cả.
- **Root Cause**: các hệ thống gameplay được thêm dần qua nhiều tháng phát triển; mỗi tính năng
  mới ra đời lại "gắn thêm" vào đúng điểm nối duy nhất này vì đây là nơi duy nhất biết "một phiên
  vừa hoàn thành".
- **Current Risk**: trung bình — hàm đã có test bao phủ các nhánh chính, đã chạy ổn định qua nhiều
  tháng. Rủi ro thật là với các nhánh ÍT được test (ví dụ tương tác giữa nhiều buff hiếm gặp cùng
  lúc).
- **Future Risk**: cao nếu tiếp tục thêm nhiều hệ thống gameplay mới cắm vào đúng điểm này —
  hàm sẽ tiếp tục phình to, độ khó đọc/sửa tăng phi tuyến.
- **Recommended Solution**: tách theo ranh giới rõ ràng thành các bước tuần tự composable (ví dụ:
  "tính thưởng" → "cập nhật tiến triển" → "kiểm tra thành tích"), MỖI bước có test hành vi riêng
  bao phủ đầy đủ TRƯỚC khi tách.
- **Estimated Complexity**: Cao — cần thiết kế lại ranh giới + viết bộ test hồi quy đầy đủ trước
  khi động vào bất kỳ dòng nào.
- **Blocking Conditions**: ĐÃ GIẢM (2026-07-13) — nay có bộ characterization golden-master
  `gameStore.completeFocusSession.test.js` (15 bài) khóa XP/EP/level/loot/RNG/nhiều loại phiên +
  `gameStore.cancelFocusSession.test.js` (6 bài) làm lưới an toàn cho việc tách. CÒN THIẾU để phủ
  đầy đủ trước khi tách sâu: các nhánh early-return phạt (khủng-hoảng/thăng-cấp thất bại) + ma trận
  waive-bằng-than-lượng (xem NOTE trong file test). Quy mô 1 người dùng vẫn khiến lợi ích "dễ đọc
  hơn" chưa vượt rủi ro, nên vẫn hoãn tách.
- **Review Trigger**: hàm vượt ~900-1000 dòng, HOẶC cần thêm một hệ thống gameplay lớn mới phải
  cắm vào đúng điểm nối này.
- **Owner**: (chưa gán — dự án 1 người dùng, không có ownership phân vai)
- **Status**: Open — hoãn có chủ đích (xem `ARCHITECTURE_DECISIONS.md` ADR-006). 2026-07-13: đã có
  lưới characterization (một phần) → an toàn hơn nếu sau này quyết định tách.

---

## #2 — God File: `gameStore.js` (~6.000 dòng) và `StatsDashboard.jsx` (~4.885 dòng)

- **Module**: `src/store/gameStore.js`, `src/components/StatsDashboard.jsx`
- **Priority**: Low
- **Severity**: Medium
- **Impact**: Khó onboard AI/người mới; thời gian tìm đúng vị trí sửa trong file dài hơn.
- **Root Cause**: tăng trưởng hữu cơ qua nhiều tháng, không có ranh giới module được thiết kế
  trước cho từng hệ thống con (streak/mission/achievement/crafting/prestige đều sống chung 1 file).
- **Current Risk**: thấp — cả 2 file đã có test bao phủ tốt các luồng chính; kích thước lớn nhưng
  không gây lỗi trực tiếp.
- **Future Risk**: trung bình — nếu tiếp tục phình to không kiểm soát, một lúc nào đó sẽ vượt khả
  năng một phiên AI đọc/hiểu trọn vẹn trong một lượt.
- **Recommended Solution**: với `StatsDashboard.jsx`, tiếp tục rút thêm các hàm tính toán/định
  dạng thuần ra file riêng (đã làm một phần: `statsFormatters.js`). Với `gameStore.js`, xem #1.
- **Estimated Complexity**: Cao cho `gameStore.js`; Trung bình cho `StatsDashboard.jsx` (đã có
  tiền lệ tách an toàn).
- **Blocking Conditions**: giống #1.
- **Review Trigger**: giống #1, cộng thêm: `StatsDashboard.jsx` thêm 1 tab con mới lớn.
- **Owner**: (chưa gán)
- **Status**: Open — hoãn có chủ đích.

---

## #3 — Khả năng mismatch: mô tả kỹ năng prestige (Thăng Hoa) không khớp code thật

- **Module**: `src/engine/constants.js` (mô tả 3 kỹ năng `kien_thuc_nen`/`ke_thua`/`sieu_viet`) +
  `src/store/gameStore.js` (`triggerPrestige`)
- **Priority**: Medium-High
- **Severity**: Medium (ảnh hưởng trực tiếp trải nghiệm + niềm tin, không phải crash/mất dữ liệu)
- **Impact**: Ba kỹ năng nhánh Thăng Hoa có văn bản mô tả hứa hẹn đặc quyền giữ lại khi prestige
  (giữ 1 kỹ năng nâng cao, giữ 50% SP chưa dùng, +100% XP kỷ nguyên 1 sau prestige) — nhưng qua
  rà soát trực tiếp code (đợt viết `AI_HANDOFF_KNOWLEDGE.md`, 2026-07-12), KHÔNG tìm thấy đoạn code
  nào trong `triggerPrestige()` thực sự áp dụng các cờ này; việc reset khi prestige có vẻ diễn ra
  KHÔNG ĐIỀU KIỆN bất kể các kỹ năng này có được mở khoá hay không.
- **Root Cause**: nghi vấn — tính năng được thiết kế trên giấy (mô tả trong `constants.js`) nhưng
  chưa từng được nối dây thật vào logic reset, hoặc bị bỏ sót khi logic prestige được viết/sửa sau
  đó. CHƯA XÁC MINH TRỰC TIẾP bằng cách chơi thử/viết test — đây là một PHÁT HIỆN từ đọc code, cần
  xác nhận thêm trước khi coi là bug chắc chắn.
- **Current Risk**: thấp (chưa có ai đạt prestige lần đầu trong đời thật để tự trải nghiệm hậu quả).
- **Future Risk**: cao khi Đàm đạt mốc prestige đầu tiên (ước tính ~1 năm sử dụng theo hiệu chỉnh
  cân bằng trong `constants.js`) — nếu đúng là thiếu, người chơi sẽ không nhận được đúng như mô tả,
  ảnh hưởng trực tiếp tới tính minh bạch của game.
- **Recommended Solution**: (1) viết một test hành vi mô phỏng prestige với/không có 3 kỹ năng này
  đã mở khoá, xác nhận `triggerPrestige()` có/không áp dụng đúng 3 đặc quyền; (2) nếu xác nhận
  thiếu, hoặc nối dây logic thật vào `triggerPrestige()`, hoặc sửa lại mô tả kỹ năng cho khớp hành
  vi thật (KHÔNG được để mô tả hứa hẹn điều code không làm).
- **Estimated Complexity**: Thấp-trung bình nếu xác nhận thiếu và cần thêm 3 nhánh điều kiện vào
  hàm reset.
- **Blocking Conditions**: không có — có thể xử lý bất cứ lúc nào, không phụ thuộc điều kiện nào
  khác.
- **Review Trigger**: nên làm SỚM, lý tưởng là trước khi Đàm tự nhiên đạt prestige lần đầu trong
  quá trình chơi thật.
- **Owner**: (chưa gán)
- **Status**: Open — **ĐÃ XÁC MINH LÀ THẬT** (audit 2026-07-13: grep toàn repo + đọc
  `triggerPrestige` — cả 3 perk chưa-wire hoàn toàn, 4 hằng hậu thuẫn chỉ nằm trong chuỗi mô tả).
  2026-07-17: hành vi hiện tại đã bị **ĐÓNG BĂNG bằng characterization test**
  (`gameStore.prestige.test.js`, bài "[ĐẶC TẢ BUG #3]") — khi sửa mục này (nối dây HOẶC sửa mô
  tả), test đó PHẢI được cập nhật kèm. Ưu tiên cao hơn 2 mục God File ở trên vì ảnh hưởng trực
  tiếp trải nghiệm người dùng thật.

---

## #4 — Thiếu E2E test và giám sát production

- **Module**: toàn dự án (không phải 1 file cụ thể)
- **Priority**: Medium
- **Severity**: Medium
- **Impact**: Các loại lỗi "tính sai âm thầm, không crash" (như nghi vấn #3) có thể tồn tại lâu
  mà không ai biết cho tới khi Đàm tự trải nghiệm gặp phải. Không có Sentry/analytics/dashboard
  lỗi nào giám sát production.
- **Root Cause**: quy mô 1 người dùng khiến đầu tư hạ tầng giám sát chuyên nghiệp có vẻ "thừa" so
  với lợi ích trước mắt; dev và production dùng CHUNG 1 dòng Supabase nên không thể chạy phiên
  focus thật trên dev để test E2E (sẽ ghi đè dữ liệu thật).
- **Current Risk**: trung bình.
- **Future Risk**: trung bình-cao nếu dự án tiếp tục thêm tính năng phức tạp mà không tăng tương
  ứng độ phủ test hành vi.
- **Recommended Solution**: (1) thiết lập một Supabase project THỨ HAI dành riêng cho dev/test,
  tách khỏi production — mở khoá khả năng viết E2E an toàn; (2) cân nhắc một cơ chế giám sát lỗi
  nhẹ (ví dụ chỉ ghi log lỗi runtime vào một bảng Supabase đơn giản, không cần dịch vụ trả phí).
- **Estimated Complexity**: Trung bình cho (1); Thấp cho (2).
- **Blocking Conditions**: cần quyết định của Đàm về việc có đáng đầu tư thêm 1 project Supabase
  hay không (có thể phát sinh chi phí/công sức quản lý thêm).
- **Review Trigger**: khi có đủ ngân sách thời gian, hoặc khi một sự cố "tính sai âm thầm" thực sự
  xảy ra và bị phát hiện muộn (khi đó là bằng chứng cụ thể cần đầu tư ngay).
- **Owner**: (chưa gán)
- **Status**: Open.

---

## #5 — Rủi ro lệch giữa mô tả tĩnh (`constants.js`) và hành vi code thật

- **Module**: `src/engine/constants.js` nói chung (không chỉ 3 kỹ năng ở mục #3)
- **Priority**: Low-Medium
- **Severity**: Low
- **Impact**: mang tính phòng ngừa — mục #3 là MỘT ví dụ cụ thể đã phát hiện; có khả năng còn các
  mô tả khác (achievement/skill/building) cũng lệch so với code thật mà chưa được rà soát.
- **Root Cause**: không có cơ chế kiểm tra tự động nào đối chiếu văn bản `description` với hành vi
  `check()`/logic thật tương ứng.
- **Current Risk**: thấp (chỉ 1 trường hợp cụ thể đã xác nhận khả nghi).
- **Future Risk**: thấp-trung bình, tăng dần theo thời gian nếu không rà soát định kỳ.
- **Recommended Solution**: rà soát định kỳ (không cần gấp) khi có thời gian rảnh giữa các tính
  năng lớn — đọc lại một lượt các mô tả skill/achievement và đối chiếu nhanh với code.
- **Estimated Complexity**: Thấp mỗi lần rà soát, nhưng tốn thời gian vì khối lượng lớn (360
  achievement + 36 skill + 75 blueprint).
- **Blocking Conditions**: không có.
- **Review Trigger**: định kỳ, hoặc khi phát hiện thêm 1 trường hợp lệch cụ thể khác (như #3).
- **Owner**: (chưa gán)
- **Status**: Open — mang tính phòng ngừa, không cấp bách.

---

## #6 — Hiệu năng: các tab nặng của `StatsDashboard.jsx` tính lại toàn bộ lịch sử mỗi lần render

- **Module**: `src/components/StatsDashboard.jsx` (`FocusTab`, `CategoryTab`)
- **Priority**: Low
- **Severity**: Low
- **Impact**: mỗi lần đổi filter (kỳ/danh mục) quét lại toàn bộ mảng `history`. Chưa phải vấn đề
  thật ở quy mô hiện tại (đã có `useMemo`/`useTransition`/`useDeferredValue` giảm giật).
- **Root Cause**: thiết kế đơn giản ban đầu (quét toàn bộ, không cache/index) phù hợp quy mô nhỏ.
- **Current Risk**: rất thấp.
- **Future Risk**: trung bình nếu lịch sử phình lên rất lớn (nhiều năm sử dụng liên tục, hàng chục
  nghìn phiên).
- **Recommended Solution**: nếu thực sự cảm nhận được độ trễ, cân nhắc index hoá theo thời gian
  (ví dụ nhóm sẵn theo tuần/tháng) thay vì quét tuyến tính mỗi lần.
- **Estimated Complexity**: Trung bình.
- **Blocking Conditions**: chỉ đáng làm khi CẢM NHẬN ĐƯỢC độ trễ thật, không tối ưu phòng ngừa.
- **Review Trigger**: người dùng báo cáo tab Thống kê bị giật/chậm.
- **Owner**: (chưa gán)
- **Status**: Open — không cấp bách.

---

## #7 — Dependency: `npm install` cần flag `--legacy-peer-deps`

- **Module**: `package.json` (toàn dự án)
- **Priority**: Low
- **Severity**: Low
- **Impact**: một số peer dependency xung đột phiên bản chưa giải quyết dứt điểm — không ảnh
  hưởng runtime, chỉ ảnh hưởng bước cài đặt.
- **Root Cause**: chưa rà soát/nâng cấp để giải quyết xung đột peer dependency triệt để.
- **Current Risk**: rất thấp — đã biết và có quy trình cài đặt rõ ràng (luôn dùng flag này).
- **Future Risk**: thấp, trừ khi một bản nâng cấp dependency lớn trong tương lai làm xung đột này
  trầm trọng hơn.
- **Recommended Solution**: khi có thời gian rảnh, rà soát `package.json` để xác định chính xác
  cặp dependency nào xung đột và cân nhắc nâng cấp/hạ cấp để bỏ được flag này.
- **Estimated Complexity**: Thấp-trung bình (cần thử nghiệm kỹ sau khi đổi để không phá build).
- **Blocking Conditions**: không có, nhưng không cấp bách.
- **Review Trigger**: khi cần thêm một dependency mới mà xung đột trở nên khó quản lý hơn.
- **Owner**: (chưa gán)
- **Status**: Open — chấp nhận sống chung, không cấp bách.

---

## #8 — Sync: mất dữ liệu khi hai máy sửa các trường KHÁC NHAU lúc offline

- **Module**: `src/lib/syncService.js` (+ giao thức lưu nguyên khối JSONB của `game_state`)
- **Priority**: Medium
- **Severity**: High (khi xảy ra là mất dữ liệu thật, không tự khôi phục được)
- **Impact**: cơ chế "First Action Wins" so version trên CẢ KHỐI state, không merge theo trường.
  Hai máy cùng sửa (dù ở trường khác nhau) giữa hai lần đồng bộ → máy đẩy sau bị từ chối và phải
  nhận lại bản của máy thắng, mất trọn phần sửa của mình.
- **Root Cause**: quyết định kiến trúc có chủ đích (ADR "First Action Wins") — chọn nhất quán +
  đơn giản thay vì merge, vì merge cần thiết kế xung đột riêng cho từng slice.
- **Current Risk**: đã GIẢM đáng kể sau bản vá C1 (2026-07-17): flush khi rời app thu hẹp cửa sổ
  "thay đổi chưa đẩy" từ vô hạn xuống mili-giây. Rủi ro còn lại tập trung ở kịch bản OFFLINE
  (push thất bại vì mất mạng, không có retry) — đúng lớp sự cố đã xảy ra thật 2026-07-11.
- **Future Risk**: tăng nếu sau này có thêm thiết bị thứ 3 hoặc nhiều người dùng.
- **Recommended Solution**: merge theo trường / 3-way merge, HOẶC lớp backup-recovery riêng. Đã
  cân nhắc và LOẠI phương án "snapshot trước mỗi lần import" (đề xuất A4) bằng phân tích định
  lượng: `history` và `savedNotes` đều bị chặn ở 2000 mục, mỗi mục history ~35 trường (~500-800
  byte JSON) ⇒ state ở mức trần ~2-2,5 MB; một bản sao đầy đủ đẩy tổng lên ~4-5 MB, chạm hạn mức
  localStorage ~5 MB của Safari, trong khi đường ghi persist KHÔNG bắt `QuotaExceededError`
  (xem #9) ⇒ cơ chế an toàn có thể trở thành nguồn mất dữ liệu diện rộng hơn.
- **Estimated Complexity**: Cao (đổi giao thức + cần môi trường E2E 2 thiết bị, xem #4).
- **Blocking Conditions**: chưa có E2E 2 thiết bị để kiểm chứng merge; Giai đoạn A cấm mở rộng.
- **Review Trigger**: khi làm tính năng backup/recovery sau Giai đoạn A, hoặc khi xuất hiện sự cố
  mất dữ liệu thật lần nữa, hoặc khi có thiết bị/người dùng thứ 3.
- **Owner**: (chưa gán)
- **Status**: Open — đã giảm rủi ro bằng bản vá C1, giới hạn được ghi nhận công khai trong
  `ARCHITECTURE.md` mục 2 (không giả vờ đã xử lý xong).

---

## #9 — Persist localStorage không bắt `QuotaExceededError`

- **Module**: `src/lib/appIdentity.js` (`createLegacyCompatibleJSONStorage`, `storage.setItem`)
- **Priority**: Medium
- **Severity**: High (nếu xảy ra thì app ngừng lưu được state cục bộ)
- **Impact**: `storage.setItem(name, value)` gọi trần, không có `try/catch`. Khi localStorage đầy
  (state ở mức trần ~2-2,5 MB, cộng các khoá khác), lỗi ném thẳng vào trong zustand persist.
- **Root Cause**: đường ghi được viết cho trường hợp bình thường; hạn mức chưa từng bị chạm nên
  chưa lộ ra.
- **Current Risk**: thấp hiện tại (state thật còn xa mức trần 2000 mục).
- **Future Risk**: tăng dần theo số phiên tích luỹ; sẽ tăng vọt nếu có thêm bất kỳ cơ chế nào ghi
  bản sao state vào localStorage (chính là lý do #8 loại phương án snapshot).
- **Recommended Solution**: bọc `try/catch` quanh `setItem`, ghi log rõ ràng và có đường xử lý
  (cảnh báo người dùng / dọn bớt dữ liệu cũ) thay vì để ném lỗi.
- **Estimated Complexity**: Thấp.
- **Blocking Conditions**: không có — chỉ nằm ngoài phạm vi bản vá C1 nên không "tiện tay sửa luôn".
- **Review Trigger**: khi làm backup/recovery, hoặc khi thấy lỗi lưu state trong log production.
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện trong lúc phân tích bản vá C1 (2026-07-17), chưa xử lý.

---

## #20 — ✅ **ĐÃ XỬ LÝ (2026-08-14, Phase 6B)** — Mái kỷ 1 (lều da thú) ra màu XANH LÁ, sai họ vật liệu — không phải lỗi phân biệt, mà lỗi NGHĨA

> ✅ **ĐÃ ĐÓNG — và giải pháp đi XA HƠN đề xuất ghi ở dưới, một cách có chủ đích.**
> Mục này đề xuất thêm một trường `roofHue` **tuỳ chọn** cho riêng kỷ 1. Khi bắt tay vào làm thì
> thấy chẩn đoán ở phần *Root Cause* dưới đây đúng nhưng CHƯA đủ rộng: `accentColor` không chỉ làm
> hỏng kỷ 1 — nó làm hỏng **cả bảng**. Đo được cùng lúc: mái đình làng Bắc Bộ (kỷ 6) ra **TÍM**,
> mái vòm Duomo Firenze (kỷ 7) cũng **TÍM**, bê tông Nakagin (kỷ 13) ra **XANH LƠ**, mái kẽm Paris
> (kỷ 9) ra **XANH NÕN CHUỐI**. Vá riêng kỷ 1 thì 14 kỷ kia vẫn sai, và món nợ sẽ quay lại lần nữa.
> ⇒ Đã làm đúng thứ mục này gọi tên: **tách hẳn hai vai**. Thêm `roofColor` **bắt buộc cho cả 15
> kỷ** trong `eraStyle.js` — mỗi kỷ khai đúng vật liệu lợp của công trình có thật ở nước biểu tượng
> của nó (kỷ 1 `#745339` da thú & gỗ hun khói · kỷ 7 `#c5572b` ngói terracotta · kỷ 11 `#3e9883`
> đồng oxy hoá · kỷ 13 `#ccc9c7` bê tông đúc sẵn…). `accentColor` giữ NGUYÊN, nên màu nhận diện kỷ
> trên toàn app không đổi một pixel.
> **Đo lại sau khi sửa** (bảng màu, giữa trưa, theme sáng): trung vị 105 cặp **46,2 → 62,7** ·
> trải độ sáng **0,18 → 0,40** · cặp gần nhất 6,9 → 10,9. Bốn hàng rào ở `palette3d.test.js` đều
> qua, cộng một **bài đối chứng** mới nhốt sẵn bảng mái hỏng cũ và bắt bộ hàng rào phải còn bắt
> được nó.
> ⚠️ **Ba bài học rút ra, đều đã ghi vào chỗ tương ứng:**
> 1. Phép đếm "15 mái phủ được mấy múi màu 30°" **thưởng cho đúng cái lỗi này** — đường hỏng ăn 9
>    múi, đường vật liệu thật chỉ 6. Vật liệu lợp có thật không trải khắp vòng tròn màu; chúng phân
>    biệt nhau bằng ĐỘ SÁNG. Hàng rào đã đổi theo (`palette3d.test.js`).
> 2. Trần độ tươi từng được phát biểu ở **hai** chỗ với **hai** số (mã kẹp 0,70, test canh 0,66) —
>    nay là một hằng số `ROOF_MAX_SATURATION` mà bài test `import` thẳng.
> 3. Việc sửa này **làm hỏng công cụ đo** `sweep-score.mjs` → mục **#22** (nay đã ĐÓNG, 2026-08-16:
>    proxy "mái" bị bỏ hẳn, thay bằng lưới ô con không giả định gì về màu).

<details>
<summary>Nội dung gốc của mục (giữ nguyên để đối chiếu)</summary>


- **Module**: `src/engine/city3d/palette3d.js` (hàm `eraRoof`) đọc `ERA_METADATA[1].accentColor`
  = `#4ade80`. KHÔNG phải `eraStyle.js` — hình khối đã sửa xong ở Phase 5B.
- **Priority / Severity**: Low-Medium / Low (thuần mỹ thuật, không có gì hỏng, không ai mất dữ liệu).
- **Impact**: Kỷ 1 là kỷ **mọi người dùng đều đi qua đầu tiên** và là ấn tượng đầu về cả màn Thành
  Phố. Mái nón xanh lá trên nền cỏ xanh làm cụm lều đọc ra là **bụi cây / cây thông**, chứ không
  phải chỗ có người ở. Phase 5B đã sửa được phần lớn bằng hình khối (bỏ vành mái thò ra, dựng lều
  nón cao sát đất — trước đó nó đọc ra là *cây nấm*), nhưng sắc xanh vẫn còn.
- **Root Cause**: `accentColor` của mỗi kỷ mang HAI vai không liên quan nhau — vừa là màu nhận diện
  của kỷ trên toàn app (thanh chuyển kỷ, chấm tròn, biểu đồ), vừa là nguồn góc màu cho MÁI trong
  cảnh 3D. Hai vai đó chỉ tình cờ hợp nhau ở 14 kỷ. Đây đúng cùng một hình dạng sai với bài học
  Phase 5B ngay bên trên (`storyHeight` gánh hai việc) — chỉ khác là lần này hai vai nằm ở hai
  **module** khác nhau nên khó thấy hơn.
- **Current Risk**: Không có. Cảnh vẫn dựng đúng, test vẫn xanh, 15 kỷ vẫn phân biệt được với nhau.
- **Future Risk**: Ai đó "sửa cho hợp lý" bằng cách đổi thẳng `ERA_METADATA[1].accentColor` sẽ đổi
  màu nhận diện của kỷ 1 trên **toàn bộ app**, và gần như chắc chắn làm đỏ bài duyệt 105 cặp mái ở
  `palette3d.test.js` — vì bảng màu đó đã được tinh chỉnh qua năm đợt đo.
- **Recommended Solution**: Thêm một trường TUỲ CHỌN `roofHue` trong `eraStyle.js` (nơi đã giữ mọi
  quyết định vật liệu của kỷ), để `eraRoof` ưu tiên nó và lùi về `accentColor` khi không có. Kỷ 1
  đặt ~28° (da thú / rơm rạ). Cách này KHÔNG đụng `accentColor`, nên màu nhận diện của kỷ trên toàn
  app giữ nguyên, và nó tách đúng hai vai đang bị trộn.
- **Estimated Complexity**: Thấp (một trường + một nhánh `??`), nhưng PHẢI chạy lại phép duyệt 105
  cặp mái + quét ảnh 15 kỷ để chắc chắn không đẩy kỷ 1 vào sát một kỷ khác.
- **Blocking Conditions**: Nên gộp vào **cùng một đợt rà soát `palette3d.js`** với #19 thay vì vá
  riêng — đúng luật "đợt vá thứ 6 thì phải rà soát tử tế, không vá điểm" đã ghi ở đầu file này.
- **Review Trigger**: Khi mở đợt rà soát `palette3d.js` cho #19, HOẶC khi Đàm nhắc lại rằng kỷ đầu
  trông không giống chỗ có người ở.
- **Owner**: chưa ai nhận.
- **Status**: MỞ — phát hiện 2026-08-14 (Phase 5B), cố ý CHƯA sửa trong phase đó vì phạm vi của
  phase là HÌNH KHỐI, và đụng vào bảng màu là mở một mặt trận khác hẳn.

</details>

---

## #19 — Hai cặp kỷ vẫn gần như CÙNG MỘT MÀU trên màn hình, dù bảng màu gốc cách nhau rất xa

> ⚠️ **HAI CON SỐ NGHIỆM THU CỦA MỤC NÀY NAY ĐÃ CŨ — ĐỪNG TRÍCH LẠI (2026-08-14, Phase 6B).**
> "kỷ 5↔12 = 9,5" và "kỷ 4↔10 = 10,2" được đo khi mái còn **suy ra từ `accentColor`**. Phase 6B
> thay hẳn NGUỒN của màu mái sang `roofColor` (vật liệu lợp thật) — kỷ 5 nay là đá phiến `#586a89`,
> kỷ 12 là bê tông quân sự `#717b65`, hai thứ chẳng liên quan gì tới hai màu đã đo. Tức mục này
> đang mô tả một bảng màu **không còn tồn tại**.
> ⚠️ Và **chưa đo lại được**: đúng lần sửa ấy làm hỏng bộ lọc mái của `sweep-score.mjs` (mục #22),
> nên công cụ nay TỪ CHỐI chấm phần cặp-kỷ. Mục này vì vậy **treo, chờ #22 xong** — không phải
> "vẫn còn 2 cặp trùng", mà là **chưa biết**. Ghi rõ ra đây thay vì để hai con số cũ nằm im trông
> như số còn đúng: đó chính là cái bẫy mà phần ĐÍNH CHÍNH ngay bên dưới đã dạy một lần rồi.
>
> ## ✅ ĐÃ ĐO LẠI, VÀ ĐÓNG (2026-08-16, sau khi #22 xong)
>
> ⚠️ **HAI BỘ SỐ KHÔNG SO TRỰC TIẾP ĐƯỢC — ĐỪNG VIẾT "9,5 → 35,0" NHƯ MỘT PHÉP CẢI THIỆN.** Số cũ
> đo **màu MÁI** (8% điểm ảnh tươi nhất); số mới đo **cả dải thành phố** chia lưới 6×3. Đó là hai
> đại lượng khác nhau, chỉ trùng đơn vị. Điều số mới nói được là điều mục này thật sự hỏi từ đầu —
> *"hai kỷ này nhìn trên màn hình có phân biệt được không"* — chứ không phải "mái đã tách chưa".
>
> | cặp | phép đo mới (trung bình 6 chặng) | chặng sát nhau nhất | kết luận |
> |---|---|---|---|
> | kỷ 5 ↔ kỷ 12 | **35,0** | 28,1 | ✅ đạt, gấp 2,9 lần ngưỡng mắt |
> | kỷ 4 ↔ kỷ 10 | **44,3** | 35,9 | ✅ đạt, gấp 3,7 lần |
> | kỷ 3 ↔ kỷ 10 | 38,9 | 29,2 | ✅ |
> | cặp gần nhất TRONG CẢ 105 CẶP | **23,3** (kỷ 11 ↔ 12) | 16,4 | ✅ **0/105 dưới ngưỡng** |
>
> ⇒ Hai cặp mà mục này nêu tên **không còn nằm trong nhóm sát nhau nhất**, và cả 105 cặp đều trên
> ngưỡng. Nguyên nhân hợp lý nhất: từ lúc mục này được ghi (Phase 4G) tới nay, bản sắc kỷ đã thôi
> nằm gần hết ở màu mái — Phase 5B (dáng nhà + `massScale`), 6A (chữ ký kiến trúc), 7B (địa hình),
> 7C (nhà dân), 7D (mặt đường), 8B/8C/8D (tường, mặt đất, thảm thực vật) đều thêm trục phân biệt
> mới. Tức mục này được **giải quyết gián tiếp bởi 8 phase mỹ thuật**, không bởi một lần vá màu.
> ⚠️ Vì vậy **KHÔNG được đọc thành "phép trộn màu ở `palette3d.js` đã hết vấn đề"** — luật "đợt vá
> thứ 6 cho `palette3d.js` phải là một đợt rà soát toàn bộ" vẫn còn nguyên hiệu lực.
> Ở tầng bảng màu (không phải điểm ảnh) thì đã đo lại được và số có tốt lên: trung vị 105 cặp
> 46,2 → 62,7, cặp gần nhất 6,9 → 10,9. Nhưng đó là tầng khác, **không thay lời cho phép đo trên
> ảnh** — đúng bài học "bài test bảng màu và phép đo trên ảnh kêu hai tập cặp rời nhau hoàn toàn".

- **Module**: `src/engine/city3d/palette3d.js` (phép pha sắc kỷ vào mái) — KHÔNG phải
  `ERA_METADATA[*].accentColor`.
- **Priority / Severity**: Medium / Low-Medium (thuần mỹ thuật, không có gì hỏng).
- ⚠️ **ĐÍNH CHÍNH (2026-08-13, Phase 4G) — một câu trong chính mục này từng là LỜI BẢO ĐẢM SAI.**
  Bản đầu viết: *"ổn định qua hai cỡ ô 260 và 300 nên không phải nhiễu"*. Câu đó nghe như một phép
  kiểm chứng chéo, nhưng nó **không thể đúng**: cỡ ô KHÔNG phải tham số của phép đo, nó là **sự
  thật về tấm ảnh**. Ảnh dựng ở cỡ 300 mà chấm bằng cỡ 260 thì bước nhảy hàng lệch 30px/hàng, tới
  hàng cuối lệch 420px — tức lấy mẫu ở một kỷ KHÁC. Chạy lại đúng như vậy cho ra một bộ số bịa
  hoàn chỉnh và **trông rất thuyết phục**: "5/105 cặp kỷ + 1/15 cặp chặng dưới ngưỡng, trung vị
  106,4", kèm cả một cặp chặng bình-minh↔hoàng-hôn "hỏng" mà Phase 3Y đã sửa xong từ lâu. Phép
  tự-kiểm khi ấy vẫn báo ✓ vì nó chỉ đọc HÀNG 0 — nơi sai số còn bằng 0. ⇒ Đã vá tận gốc: nay
  `city-preview.mjs` ghi kèm mỗi ảnh một hồ sơ `.geom.json`, `sweep-score.mjs` ĐỌC hồ sơ đó và
  **từ chối chạy nếu thiếu**, và phép tự-kiểm chạy đủ **15/15 hàng**. Số dưới đây là số đo lại
  bằng công cụ đã vá.
- **SỐ ĐO** (2026-08-13, bằng `scripts/sweep-score.mjs` — quét đủ 15 kỷ × 6 chặng, đo màu MÁI
  bằng 8% điểm ảnh tươi nhất của dải thành phố, trung bình trên 6 chặng):

  | | khoảng cách | ghi chú |
  |---|---|---|
  | kỷ 5 ↔ kỷ 12 | **9,5** | hai cặp gần nhau nhất, cách hẳn phần còn lại |
  | kỷ 4 ↔ kỷ 10 | **10,2** | |
  | cặp gần thứ ba (kỷ 3 ↔ kỷ 10) | 13,4 | |
  | trung vị 105 cặp | 44,6 | |
  | 15 cặp CHẶNG NGÀY | gần nhất 32,8 | ✅ toàn bộ đạt, Phase 3Y vẫn giữ |

- **Root Cause — và đây là chỗ đáng học**: bảng màu gốc của hai cặp này **KHÔNG hề gần nhau**. Đo
  bằng redmean trên chính `accentColor`: kỷ 5 (`#94a3b8`) ↔ kỷ 12 (`#64748b`) cách **140**, kỷ 4
  (`#fb923c`) ↔ kỷ 10 (`#f87171`) cách **100** — trong khi cặp gần nhau NHẤT trong bảng gốc là kỷ 6
  ↔ kỷ 7 (43,5), mà cặp đó lại render ra ĐẠT. ⇒ **Chính đường ống render nén hai cặp này lại**, và
  nén không đều: cặp gần nhất trong bảng thì render ra tách được, cặp xa trong bảng lại render ra
  trùng nhau. Đúng bài học đã ghi ở `CLAUDE.md`: *"BẢNG MÀU ≠ MÀU TRÊN MÀN HÌNH"*, và **không có
  một hệ số chung** — phải đo từng chỗ.
- **VÌ SAO CHƯA SỬA TRONG PHIÊN NÀY (cố ý, không phải bỏ quên)**: `palette3d.js` đã qua **5 đợt** vá
  mỹ thuật (3C · 3G · 3M · 3N · 3V), và chính file `TECH_DEBT.md` này đã đặt ra luật: *"nếu xuất
  hiện đợt vá thứ 6 cho `palette3d.js` thì lần đó phải là một đợt rà soát toàn bộ phép trộn màu còn
  lại, không vá tiếp"*. Sửa nhanh hai kỷ ở đây đúng là **đợt thứ 6 kiểu vá điểm** mà luật cấm. Vậy
  nên: ghi lại đầy đủ số đo, để dành cho một đợt rà soát tử tế.
  ⚠️ Và **đừng chữa bằng cách đổi `accentColor`**: màu đó là bản sắc kỷ dùng khắp app (thẻ kỷ, thẻ
  công trình, thẻ lễ mừng, bộ vẽ 2D), lại đang đúng về ý nghĩa (kỷ 5 "Tăm Tối" xám, kỷ 12 "Thế
  Chiến" xám thép). Vấn đề nằm ở chỗ pha, không nằm ở chỗ chọn màu.
- ⚠️ **CƠ CHẾ ĐÃ ĐO ĐƯỢC (2026-08-13, Phase 4G) — hai cặp này hỏng vì CÙNG MỘT nguyên nhân, không
  phải hai chuyện riêng lẻ.** `sweep-score.mjs --eras` nay in màu mái đo được của từng kỷ, và đối
  chiếu với màu mà `eraRoof` phát ra thì thấy đường ống render **nén hai trục và khuếch đại một
  trục**:

  | trục | nguồn (bảng màu) | trên màn hình | hệ số |
  |---|---|---|---|
  | ĐỘ ĐẬM | kỷ 5 vs 12 lệch 0,10 HSL-L (≈25/255) | lệch **5/255** | **nén ~5×** |
  | GÓC MÀU (dải ẤM) | kỷ 4 vs 10 lệch **21,6°** sau khi pha neo | lệch **2,6°** | **nén ~8×** |
  | ĐỘ TƯƠI | — | — | khuếch đại ~2× (đã ghi ở `CLAUDE.md`) |

  Số đo tại chỗ: kỷ 5 `rgb(77,77,54)` tươi 24 ↔ kỷ 12 `rgb(72,70,49)` tươi 23 · kỷ 4 `rgb(104,70,21)`
  tươi 82 ↔ kỷ 10 `rgb(106,72,31)` tươi 75.
  ⇒ **Cả hai cặp đều có chênh lệch THẬT và ĐỦ LỚN ở bảng màu; chính đường ống xoá nó đi.** Và cả hai
  cặp đều rơi đúng vào hai trục BỊ NÉN, trong khi 103 cặp còn lại tách nhau chủ yếu nhờ trục ĐỘ TƯƠI
  — trục được khuếch đại. Đó là lý do "cặp xa trong bảng lại trùng trên màn hình".
  ⚠️ Hệ quả cho người sửa sau: **`eraRoof` đang được thiết kế trong không gian BẢNG MÀU nhưng được
  nghiệm thu trong không gian ĐIỂM ẢNH.** Đó chính là lỗi *"một luật hai công thức"* ở quy mô lớn
  nhất trong dự án này. Mọi lần chỉnh hệ số của `eraRoof` (đã 2 lần: nền độ tươi 0,30→0,52 và hệ số
  độ đậm 0,22→0,55) đều là chỉnh ở đầu VÀO trong khi tiêu chí nằm ở đầu RA — nên chúng cải thiện
  được nhưng không bao giờ đóng được vấn đề.
- **Recommended Solution** (cho đợt rà soát — nay đã có hướng cụ thể, không còn mò):
  1. **Thiết kế trong không gian mắt nhìn, không trong bảng màu.** Viết một hàm THUẦN mô hình hoá
     đường ống (nhân ánh nắng ấm → kẹp kênh → tone mapping), hiệu chuẩn bằng đúng 15 màu mái đã đo
     ở trên, rồi cho `palette3d.test.js` duyệt 105 cặp **trong không gian đã render** với ngưỡng 12.
     Khi đó bài test thuần và `sweep-score.mjs` mới nói CÙNG MỘT luật — hiện chúng nói hai luật khác
     nhau và **hai tập cặp bị kêu không giao nhau một phần tử nào** (xem `CLAUDE.md`).
  2. Chỉ khi đó mới chỉnh `eraRoof`, và chỉnh theo hướng **bù trước cho phần bị nén** (đúng tiền lệ
     đã có ở bầu trời Phase 3V: *"muốn ra đúng sắc phải khai cao hơn đích thật ~15°"*).
  3. Nhân thể rà nốt các phép trộn RGB tuyến tính còn lại (`outskirts`, `edge`, `sun`, mặt đất).
  - Nghiệm thu: `node scripts/city-preview.mjs --sweep --all` rồi `node scripts/sweep-score.mjs
    .city-preview/sweep-light-ky1-15.png --eras` → **0/105 cặp kỷ dưới ngưỡng**.
- **Current Risk**: thấp — chỉ là hai cặp trong mười lăm kỷ nhìn na ná nhau. **Future Risk**: trung
  bình — phần thưởng của việc đi hết 15 kỷ là *thấy thành phố đổi khác*; mỗi cặp trùng làm mất một
  nấc trong hành trình đó.
- **Blocking Conditions**: không có blocker kỹ thuật; chỉ là phải làm thành MỘT đợt rà soát, không
  vá điểm.
- **Review Trigger**: lần tới ai định sửa `palette3d.js` vì bất kỳ lý do gì → gộp mục này vào.
- **Owner**: (chưa gán) · **Status**: **Open** (phát hiện 2026-08-13, Phase 4F).

---

## #18 — ĐÃ ĐÓNG (2026-08-13) · Kỷ 12–14 không hề có bề mặt nào mang màu kỷ

> ⚠️ **ĐÍNH CHÍNH (2026-08-13, cùng ngày, muộn hơn)**: dòng "0/105 ✅" trong bảng bên dưới **chỉ
> đúng với phép đo lúc đó**, không phải một lời bảo đảm chung. Đo lại bằng `scripts/sweep-score.mjs`
> (công cụ mới, có `--selftest` chứng minh bộ lọc mái thật sự chạy: bỏ lọc thì tụt về 51/105) ra
> **2/105 cặp dưới ngưỡng**. Hai phép đo khác nhau ở cách chuẩn hoá khoảng cách và ở ranh giới dải,
> nên **không cái nào "sai"** — nhưng con số 0/105 không được đọc như "đã xong vĩnh viễn". Việc mà
> #18 tuyên bố là đã làm (kỷ mái bằng nay có bề mặt mang màu kỷ) thì vẫn đúng và vẫn đứng. Phần còn
> lại chuyển sang **#19**. 👉 Bài học: **một con số nghiệm thu phải đi kèm CÔNG CỤ đã đo ra nó** —
> ghi mỗi kết quả mà không ghi cách đo thì phiên sau không thể tái lập, và sẽ tưởng là đã đóng.

- **Module**: `src/engine/city3d/buildingSpec.js` — nhánh `case 'flat'` của `roofParts`.
- **Priority / Severity**: Medium / Low-Medium (thuần mỹ thuật) — **đã xử lý xong trong ngày**.
- **Triệu chứng**: duyệt đủ 105 cặp kỷ trên ảnh thật, kỷ 12 ↔ 13 chỉ cách **6,4/255** (ngưỡng mắt
  ~12), và ba trong bốn cặp yếu nhất đều dính kỷ 12 hoặc 13.
- **Root Cause — KHÔNG phải màu, và đây là chỗ đáng học.** Nhánh `'flat'` đẩy ĐÚNG MỘT khối với
  `role: 'trim'` — vai TRUNG TÍNH thuộc họ tường, chỉ ngấm 0,18 sắc kỷ. Ba kỷ 12/13/14 đều dùng
  `roof: 'flat'`, nghĩa là **cả ba chưa bao giờ hiện lấy một milimét vuông vai `roof` nào**. Bảng
  màu hoàn toàn đúng, ánh sáng hoàn toàn đúng, bài test "15 kỷ ra 15 màu mái" xanh suốt — vì nó đo
  MÀU TRONG BẢNG chứ không hỏi màu ấy có được đem VẼ RA hay không.
  ⇒ **Một bài test về BẢNG MÀU không bao giờ thay thế được một bài test về việc màu đó có xuất hiện
  trong HÌNH HỌC hay không. Hai câu hỏi khác nhau, và khoảng trống giữa chúng đủ chỗ cho ba kỷ.**
- **Giải pháp đã làm**: giữ nguyên gờ chắn mái trung tính ở vành ngoài (đó là bê tông/đá ốp thật),
  thêm một **tấm phủ hẹp hơn (0,94) mang vai `roof`** nằm trong lòng nó — đúng cấu tạo mái bằng
  ngoài đời: diềm parapet một vật liệu, sàn mái chống thấm một vật liệu khác. Nhìn từ góc camera
  chúc xuống của thành phố này thì sàn mái là một mảng RẤT to.
- **KẾT QUẢ ĐO LẠI** (105 cặp kỷ, dải thành phố, trung bình 6 chặng):

  | | trước phiên này | sau `eraRoof` 0,55 | sau tấm phủ mái bằng |
  |---|---|---|---|
  | số cặp DƯỚI ngưỡng mắt | 5/105 | 4/105 | **0/105** ✅ |
  | cặp gần nhau nhất | 6,0 | 6,0 | **12,6** |
  | trung vị 105 cặp | 27,9 | 27,6 | **28,2** |

  ⇒ **Cả 105 cặp kỷ nay đều phân biệt được**, cùng với cả 15 cặp chặng ngày (nhỏ nhất 29,5).
- **Bài test khoá lại** (`buildingSpec.test.js`): mọi bản vẽ × mọi kỷ × cả 3 cấp đều phải có ít
  nhất một phần mang vai `roof`, cộng một bài riêng cho các kỷ mái bằng. Đã thử ngược (gỡ tấm phủ)
  và thấy **báo đỏ, gọi đích danh kỷ 12**.
- **Status**: **CLOSED 2026-08-13.** 510/510 test xanh · lint sạch · build xanh.

---

## #17 — ĐÃ ĐÓNG (2026-08-13) · Bình minh và hoàng hôn là CÙNG MỘT BỨC ẢNH

> ⚠️ **MỤC NÀY TỪNG CHẨN ĐOÁN SAI, VÀ CÁI SAI ĐÓ ĐÁNG GHI LẠI HƠN CẢ LỖI.** Bản đầu (viết cùng
> ngày, sớm hơn vài giờ) đặt tên mục là *"Chặng CHIỀU là chặng xấu nhất trong ngày"*, kết luận
> rằng có **hai hướng mỹ thuật khác hẳn nhau cần Đàm chọn**, rồi DỪNG LẠI chờ. Cả ba phần đều sai:
> chặng chiều không phải chặng tệ nhất, không có hai hướng nào cả, và không có gì để chờ.
>
> **Vì sao sai: đo một trục rồi kết luận về cả bức tranh.** Bản đầu đo GÓC MÀU của dải trời, thấy
> ba chặng ấm (bình minh 33° · chiều 43° · hoàng hôn 25°) nằm gọn trong 20°, và suy ra "một nửa số
> chặng trong ngày là cùng một cảnh". Nhưng góc màu chỉ là MỘT trong ba thành phần của màu, và dải
> trời chỉ là MỘT trong ba dải của khung hình. Đo lại bằng vector 9 chiều (trời + thành phố + đất,
> mỗi dải 3 kênh, trung bình 15 kỷ) thì bức tranh lật ngược hẳn:
>
> | cặp chặng | khoảng cách cả cảnh (0–255) | kết luận |
> |---|---|---|
> | **bình minh ↔ hoàng hôn** | **5,9** | dưới ngưỡng mắt (~12) ⇒ **ĐÚNG LÀ MỘT BỨC ẢNH** |
> | chiều ↔ hoàng hôn | 37,6 | cách nhau rõ |
> | chiều ↔ bình minh | 42,1 | cách nhau rõ |
>
> Tức chặng chiều chưa bao giờ là vấn đề "trùng lặp" — nó chỉ ĐỤC (độ tươi 0,25, ra kaki chứ không
> ra vàng), là một lỗi nhỏ và có một cách sửa đúng duy nhất. Còn cặp thật sự trùng nhau thì bản đầu
> **không hề nhắc tới**, vì hai chặng đó góc màu 33° và 25° — trông đã "khác nhau 8°" trên bảng.
>
> ⇒ **Bài học, và nó tổng quát hơn mỹ thuật:** khi kết luận là *"hai thứ này giống nhau"*, phép đo
> phải phủ HẾT những gì mắt nhìn thấy. Đo một trục thì sẽ vừa **báo nhầm** (chiều bị kết tội oan)
> vừa **bỏ sót** (bình minh ↔ hoàng hôn thoát). Và cái sau nguy hiểm hơn nhiều, vì nó im lặng.
>
> **Và vì sao việc "chờ Đàm chọn" là sai:** dự án đã có sẵn luật cho đúng tình huống này
> (`CLAUDE.md`, bài học Phase 3X) — *"một trade-off chỉ có thật khi CẢ HAI vế đều đã đạt và buộc
> phải hy sinh một vế"*. Ở đây không vế nào đạt: chú thích hứa "chiều vàng" mà ra kaki, tức là một
> **lỗi**, và sửa lỗi thì không cần xin phép. Đưa cho Đàm một lựa chọn giả rồi dừng lại chỉ làm mất
> thời gian của anh và để nguyên bức tranh hỏng trên máy anh thêm một vòng nữa.

- **Module**: `src/engine/city3d/daylight.js` (`DAYLIGHT_PROFILES`), `daylight.test.js`,
  `src/components/city/render3d/sceneGraph.js` (sương mù).
- **Priority / Severity**: Medium / Medium (thuần mỹ thuật) — **đã xử lý xong**.
- **Root Cause**: hồ sơ `dawn` và `dusk` không được THIẾT KẾ riêng, chúng được chép ra từ nhau rồi
  chỉnh vài phần trăm ở mỗi tham số (cao độ 0,22 vs 0,18 · ấm 0,85 vs 1,00 · chân trời 18° vs 10° ·
  lực kéo 0,70 vs 0,78 · tươi 1,15 vs 1,25). Không ai chọn cho chúng giống nhau.
- **Vì sao không bài test nào bắt được**: bài *"hai chặng liền nhau không được giống nhau"* duyệt
  danh sách `DAY_PHASES` **theo thứ tự**, tức chỉ các cặp KỀ NHAU. `dawn` ở đầu và `dusk` ở cuối
  nên không bao giờ được đem so với nhau. **Đây là lần thứ HAI cùng một hình dạng sai xuất hiện
  trong chính file test đó** (lần trước: bài "hành trình màu" tính cả `night` nên bộ số hỏng vẫn
  qua). Luật rút ra, nay đã thành mã: **bất biến kiểu "các thứ này phải khác nhau" phải duyệt TỔ
  HỢP ĐÔI, không được duyệt danh sách theo thứ tự** — duyệt theo thứ tự là cái phễu, không phải
  hàng rào.
- **Giải pháp đã làm** — tách hai chặng ở NĂM trục cùng lúc, neo vào một sự thật khí quyển duy
  nhất (*qua đêm thì bụi lắng xuống, hơi nước đọng lại*):
  - **Sương theo giờ** (`haze`, trường mới + hàm thuần `fogRangeFor`). Trước đây sương là hằng số.
    Đây là thứ đóng góp gần như toàn bộ kết quả — tắt riêng nó ra rồi bật lại (giữ nguyên mọi tham
    số khác): **17,2 → 75,1**. Lý do nó hiệu quả: sương lấy MÀU CHÂN TRỜI, nên nó sơn lại cả mảng
    nền phía sau và quanh thành phố bằng sắc của buổi đó.
    ⚠️ **ĐO CHÍNH XÁC NÓ LÀM GÌ, VÀ KHÔNG LÀM GÌ** — nền/chân trời **12,9 → 74,6**; dải THÀNH PHỐ
    **8,4 → 3,3** (GIẢM, không tăng); mặt đất 7,2 → 7,2 (không đổi). Toàn bộ khoảng cách đến từ
    phần NỀN, không từ các công trình — đúng như thiết kế, vì sương cố ý bắt đầu SAU rìa thành phố.
    Và việc nhà cửa ở gần trông na ná nhau ở hai đầu ngày là **đúng vật lý** (cùng một mặt trời
    thấp, cùng một thứ ánh sáng ấm), không phải thiếu sót: ngoài đời cũng vậy, thứ cho ta biết đang
    là sáng hay chiều là bầu trời và sương, không phải màu bức tường trước mặt.
    ⚠️ Bản chú thích đầu tiên viết ngược điều này ("sương quét sắc lên chính những công trình ở xa
    nên cuối cùng chạm được vào dải THÀNH PHỐ") — nghe rất xuôi tai, và SAI. Đã đo lại và sửa.
  - Đỉnh trời tách 202° (lam sạch) vs 252° (tím chàm — "đai sao Kim").
  - Chân trời: bình minh vàng nhạt 34°/0,62/1,00 · hoàng hôn cam đỏ đậm 8°/0,88/1,46.
  - Nắng: 0,50 vs 1,06 · đèn sân: 0,16 vs 0,78.
  - **Chặng chiều** (lỗi thật của nó — đục chứ không trùng): độ tươi 1,05 → 1,30, sắc 34° → 44°.
- **Hai nước đi đã thử và ĐÃ BỊ TEST BẮT** (giữ lại để đừng ai thử lại):
  1. Hạ `dawn.sunWarmth` xuống 0,22 cho nắng sớm LẠNH → bài *"nắng ẤM lúc bình minh/hoàng hôn"* đỏ,
     và nó đúng: mặt trời thấp thì ánh sáng xuyên quãng khí quyển dài — ở CẢ HAI đầu ngày. Cái
     "mát" của buổi sớm nằm ở BẦU TRỜI và SƯƠNG, không ở đĩa mặt trời.
  2. Đẩy chân trời bình minh sang hồng sen 312° → bài *"bầu trời KHÔNG BAO GIỜ ngả tím sen"*
     (`palette3d.test.js`) đỏ với `#d189a5` (28 điểm, lưới cấm ở 10). Quét cả vòng màu: cửa an
     toàn chỉ mở từ **16°**, và thứ chạm trần trước tiên là **MẶT NƯỚC** chứ không phải bầu trời.
     Không nới lưới đó — nó sinh ra từ hai màu hỏng có thật. Và hoá ra không cần: sương mới là
     nguồn khoảng cách chính.
- **KẾT QUẢ ĐO LẠI** (cùng phép đo, cùng bản quét 15 kỷ × 6 chặng):

  | cặp | trước | sau |
  |---|---|---|
  | **bình minh ↔ hoàng hôn** | **5,9** ❌ | **75,1** ✅ |
  | cặp GẦN NHAU NHẤT trong cả ngày | 5,9 ❌ | **29,8** (8h ↔ 12h) ✅ |
  | chiều ↔ hoàng hôn | 37,6 | 44,0 |
  | chiều ↔ bình minh | 42,1 | 46,6 |

  Ngưỡng mắt phân biệt được là ~12 ⇒ **cả 15 cặp nay đều trên ngưỡng, cặp yếu nhất gấp 2,5 lần.**
- **Còn lại một quan sát, KHÔNG phải nợ**: ba chặng ấm vẫn chung họ màu (bình minh 38° · chiều 46° ·
  hoàng hôn 20°, trải 26°). Bản đầu coi đó là bằng chứng "ba chặng là một cảnh" — sai, vì chúng
  khác nhau ở ĐỘ SÁNG và SƯƠNG chứ không ở góc màu: độ sáng trời 0,65 · 0,48 · 0,38, và bình minh
  có sương dày còn hoàng hôn thì trong. Đo cả cảnh thì cặp gần nhất trong bộ ba là 44,0 — gấp 3,7
  lần ngưỡng mắt. **Cùng họ màu ≠ cùng một cảnh.**
- **Bài test mới khoá lại** (`daylight.test.js`): duyệt ĐỦ 15 cặp trên khoảng cách hồ sơ đa-trục
  (ngưỡng 0,40, hiệu chuẩn với phép đo pixel — Spearman 0,854), **cộng một bài đối chứng nhốt sẵn
  bộ số hỏng cũ** và bắt buộc phép đo phải còn bắt được nó. Nhờ vậy nếu về sau ai nới ngưỡng hoặc
  bỏ bớt trục cho tiện thì đỏ ngay — cái phễu không thể lặng lẽ quay lại lần thứ ba.
- **Status**: **CLOSED 2026-08-13.** 509/509 test xanh · lint sạch · build xanh.

---

## #16 — ✅ **ĐÃ XỬ LÝ (2026-08-13, Phase 3X)** — Vòng ngày của thành phố gần như VÔ HÌNH ở trang chủ, nơi Đàm nhìn nhiều nhất

- **Module**: `src/components/city/CityBackdrop.jsx` — cụ thể là **lớp phủ giữ-chữ-đọc-được**, KHÔNG
  phải `BACKDROP_OPACITY` và KHÔNG phải lỗi của `daylight.js`/`palette3d.js`.
- **Priority**: Medium · **Severity**: Low (không có gì hỏng) · **Estimated Complexity**: Low về mã
- **SỐ ĐO** (ảnh chụp app đã build, bề ngang 1280, đo hai dải thành phố lộ ra hai bên thẻ đồng hồ,
  y = 300–800):

  | chặng | màu trung bình | sắc | tươi | sáng |
  |---|---|---|---|---|
  | bình minh | `#d6d3cc` | 39° | 0,11 | 0,82 |
  | sáng | `#d9d8d3` | 49° | 0,07 | 0,84 |
  | giữa trưa | `#dddcd7` | 48° | 0,09 | 0,86 |
  | chiều | `#dad7d0` | 42° | 0,12 | 0,84 |
  | hoàng hôn | `#d7d3cc` | 37° | 0,11 | 0,82 |
  | đêm | `#cececc` | 49° | 0,02 | 0,80 |

  Cặp cách nhau **XA NHẤT** — giữa trưa ↔ ban đêm, tức hai cực của cả ngày — chỉ **14/255**. Đó là
  mức CAO NHẤT, không phải thấp nhất. Ngưỡng "mắt gần như không phân biệt được" là 12.
- **Root Cause**: lớp phủ pha về `var(--canvas)` — một màu **PHẲNG** — ở 55–92% tuỳ độ cao. Pha bất
  kỳ màu nào về phía một màu phẳng thì **độ tươi tụt theo đúng tỉ lệ đó**, trong khi hình khối (tín
  hiệu ĐỘ SÁNG) vẫn sống sót. Mà vòng ngày là tín hiệu **SẮC** gần như thuần tuý ⇒ lớp phủ lọc đúng
  cái cần giữ và giữ đúng cái không thiếu cũng được.
- **Impact**: `CityBackdrop` sinh ra để "đem thành phố ra trang chủ" (Phase 3F), và Phase 3V vừa bỏ
  công dựng cả một hành trình màu 178° cho sáu chặng ngày. Ở tab Thành Phố thì thấy rõ; ở TRANG CHỦ
  — màn hình Đàm nhìn nhiều nhất, và là nơi cái đồng hồ chạy suốt 25 phút — nó gần như không tới.
- **⚠️ (Đánh giá BAN ĐẦU, giữ lại vì bài học nằm ở chỗ nó SAI ở đâu.)** Lúc mới phát hiện, mục này
  kết luận "đây là thiết kế có chủ đích, không được tự ý chỉnh", dựa vào chú thích tại chỗ: *"đây là
  chỗ mà 'đẹp' và 'dùng được' đối đầu nhau trực diện, và dùng được phải thắng"*.
  **Phần đúng**: dải đậm ở TRÊN đúng là có chủ đích và tuyệt đối không được đụng — điều đó giữ
  nguyên tới hôm nay. **Phần sai**: từ đó suy ra rằng *cả hồ sơ* là một đánh đổi đã cân nhắc, nên
  bất kỳ thay đổi nào cũng phải do Đàm quyết. Thực tế mốc "dải đậm kết thúc ở đâu" chưa từng được
  đo — nó dựa trên niềm tin rằng mặt đồng hồ nằm trên nền, mà đồng hồ thì nằm trong thẻ đặc.
  ⇒ **Bài học**: một chú thích chứng minh ý định, KHÔNG chứng minh rằng con số đi kèm đã được đo.
- **✅ GIẢI PHÁP ĐÃ LÀM (2026-08-13, Phase 3X) — và hoá ra KHÔNG HỀ có đánh đổi nào để mà quyết.**
  Mục này ban đầu ghi "chờ Đàm chọn 1 trong 3 hướng", vì chú thích tại chỗ tuyên bố đánh đổi có chủ
  đích. Đọc kỹ lại thì chú thích ấy tuyên bố **HAI** ý định: (1) chữ phải đọc được — ĐẠT; và
  (2) *"thành phố lộ ra rõ nhất ở khoảng trống phía dưới — đúng chỗ chẳng có chữ gì"* — **KHÔNG
  ĐẠT**. Không có xung đột giữa hai vế; chỉ có vế thứ hai chưa được thực hiện.
- **NGUYÊN NHÂN GỐC THẬT SỰ — một niềm tin sai về chỗ chữ đứng, không phải một con số chọn ẩu.**
  Chú thích cũ ghi dải đậm ở trên là *"nơi có tiêu đề và mặt đồng hồ"*. Đo bằng `textmap3.mjs`
  (có bài kiểm ngược để chứng minh bộ phân loại còn phân loại được) thì:
  - mặt đồng hồ `25:00` **KHÔNG nằm trên nền** — nó ở trong một thẻ ĐẶC (`rgb(255,253,250)`), tại
    **82%** chiều cao lớp phủ. Lớp phủ chưa từng bảo vệ nó, và cũng không cần;
  - chữ THẬT SỰ trên nền chỉ là khối lời chào: máy bàn **7%→21%**, điện thoại **31%→48%**.
  ⇒ Từ mốc đó trở xuống, lớp phủ không làm gì cho khả năng đọc — nó chỉ xoá thành phố. Mà ở 38% nó
  vẫn còn 80%, ở 72% vẫn còn 55%.
- **Cách sửa**: tách hồ sơ mốc thuần ra `src/components/city/cityBackdropScrim.js` (chuỗi CSS nằm
  trong JSX thì không bài test nào chạm tới được), **hai hồ sơ theo khung** — dùng lại đúng
  `useIsPhone()` mà `CityBackdrop` đã có sẵn cho `still`, không thêm hạ tầng. Giữ nguyên (thực tế là
  đậm hơn một chút) tới mốc bảo vệ 28%/55%, rồi thả nhanh về 0 ở vùng không có chữ.
- **BẰNG CHỨNG (đo trên điểm ảnh thật, trước ↔ sau, cả 6 chặng ngày)**:
  - vòng ngày: cặp xa nhau nhất **14,0 → 25,0 / 255** (ngưỡng nhìn ra được là 12) — từ dưới ngưỡng
    lên gần gấp đôi ngưỡng;
  - dải CÓ CHỮ: lệch tối đa **0,43/255**, và **sáng hơn ở cả 6/6 chặng, không chặng nào tối đi** ⇒
    tương phản chữ không giảm một phần nghìn nào (pha thêm về nền sáng thì chữ tối càng nổi);
  - dải KHÔNG CHỮ: lệch **22–33/255** ⇒ thành phố mở ra thật, không phải thay đổi lấy lệ.
- **Khoá bằng test**: `cityBackdropScrim.test.js` (7 bài) giữ nguyên hồ sơ CŨ làm mốc và quét **từng
  phần trăm một** — vì `linear-gradient` nội suy giữa các mốc, hai hồ sơ có thể bằng nhau ở mọi mốc
  mà vẫn cắt nhau ở GIỮA (kiểm mốc là cái phễu, không phải hàng rào). Đã thử ngược với hồ sơ cố ý
  nhạt hơn ⇒ đỏ ngay tại **1%**.
- **Review Trigger**: **đổi bố cục trang chủ** (thêm chữ đặt thẳng lên nền, hoặc dời khối lời chào)
  ⇒ phải đo lại bằng `textmap3.mjs` và cập nhật `TEXT_ENDS_PCT`. Sai chỗ này **không có gì đỏ cả**,
  chỉ là chữ khó đọc dần.
- **Owner**: đã xử lý · **Status**: ✅ **RESOLVED (2026-08-13, Phase 3X)** — phát hiện khi tự hỏi
  "thành quả Phase 3V có thật sự tới màn hình Đàm không", câu hỏi đến từ chính Review Trigger của #14.

---

## #15 — ✅ **ĐÃ XỬ LÝ (2026-08-13, Phase 3V)** — Trời ban ngày KHÔNG BAO GIỜ xanh: cả ngày chỉ là dốc sáng–tối, không phải hành trình màu

> **KẾT QUẢ**: đo lại cùng phép đo, cùng kỷ 7, cùng điểm lấy mẫu — đỉnh trời cả ngày nay là
> `27° · 203° · 211° · 37° · 18° · 223°`, thay cho `26° · 40° · 41° · 38° · 19° · 224°`. Bốn chặng
> ban ngày không còn nằm gọn trong một dải cam-nâu 22°; chúng trải **178°**. Giữa trưa ra
> `#7d8fa3` — xanh trời thật. Đã kiểm đủ **90 ô** (15 kỷ × 6 chặng): không ô nào đen, xám hay
> cháy; 6/6 chặng vẫn phân biệt được.
> ⚠️ **ĐÍNH CHÍNH 2026-08-13 (Phase 3W)**: bản đầu của mục này (và commit `83fa6cb`) ghi "180 ô ×
> 2 theme". **SAI.** So từng điểm ảnh giữa hai bản quét: **0/421.200 điểm bên trong các ô khác
> nhau**, chỉ khung ngoài đổi màu. Lý do ở `palette3d.js:183` — hễ có `daylight` thì ĐỒNG HỒ quyết
> `isDark`, theme bị bỏ qua. Số ô thật là 90, dựng hai lần. Phạm vi kiểm vẫn ĐỦ (15 kỷ × 6 chặng
> là toàn bộ không gian có ý nghĩa), nhưng con số thì đã bị thổi gấp đôi. Chi tiết cách sửa: xem chú thích dài
> ngay trên dòng `noon` trong `src/engine/city3d/daylight.js`. Bài test khoá: bài 81
> `daylight.test.js` (đã thử NGƯỢC với bộ số hỏng cũ → báo đỏ đúng như mong đợi, 38° < 90°).
>
> **Giữ nguyên toàn bộ phần chẩn đoán bên dưới** — nó là bằng chứng cho bài học "chỉnh tham số
> không chữa nổi một phép toán sai", và hai thí nghiệm thất bại ở đó vẫn còn giá trị cảnh báo.

- **Module**: `src/components/city/render3d/sceneGraph.js` (số mũ pha vòm trời) + `skyward()` trong
  `src/engine/city3d/palette3d.js` (phép trộn màu). **KHÔNG phải lỗi của `daylight.js`** — bảng ở
  đó ghi đúng ý đồ, chỉ là ý đồ không tới được màn hình.
- **Priority**: **Medium-High**
- **Severity**: Medium
- **Impact**: đây là phần đo được của "chán" ở lớp HÌNH ẢNH, song sinh với #14 ở lớp phần thưởng.
  Đàm mở app nhiều lần mỗi ngày; nếu 5/6 chặng ngày cho ra cùng một sắc trời thì thành phố không
  còn là "nơi chốn đang trôi qua thời gian" như `daylight.js` tự nhận, mà chỉ là một ảnh chụp được
  chỉnh sáng-tối.
- **SỐ ĐO** (kỷ 7, theme sáng, đo đỉnh trời ở giữa khung, y = 12%):

  | chặng | màu ra | sắc | tươi |
  |---|---|---|---|
  | bình minh | `#8e7969` | 26° | 0,15 |
  | sáng | `#a29781` | 40° | 0,15 |
  | **giữa trưa** | `#b1a790` | **41°** | 0,18 |
  | chiều | `#a1957f` | 38° | 0,15 |
  | hoàng hôn | `#8e7468` | 19° | 0,15 |
  | đêm | `#1b2238` | 224° | 0,35 |

  **5/6 chặng nằm gọn trong dải 19°–41° (cam-nâu); chỉ ĐÊM thoát ra.** Cả ngày chỉ đổi độ sáng
  (0,46 → 0,60 → 0,46) — mà độ sáng là tín hiệu thị giác yếu nhất.
- **Root Cause (hai tầng nhân nhau)**:
  (1) **Dải trời nhìn thấy được là 64–84% MÀU CHÂN TRỜI.** `sceneGraph.js` pha vòm trời theo
  `t^2.6`; camera chúc xuống nên phần trời lọt khung chỉ ở `t ≈ 0,50–0,67`, mà `0,5^2,6 = 0,17`.
  ⇒ `skyHue` (đỉnh vòm) gần như KHÔNG BAO GIỜ hiện ra. Giữa trưa khai `skyHue: 212, skyPull: 0.70`
  — lực kéo mạnh nhất cả ngày — nhưng vô hiệu, vì người quyết định màu trời ban ngày là
  `horizonHue`, và giữa trưa nó là `48°` (vàng ấm) với lực kéo chỉ `0,22`.
  ⚠️ Số mũ 2,6 KHÔNG phải lỗi ẩu — chú thích tại chỗ ghi rõ nó được nâng từ 1,2 lên để cứu một lỗi
  khác ("mảng oải hương xam xám"). Sửa mù số mũ sẽ làm sống lại lỗi cũ.
  (2) **`skyward()` trộn bằng `mixRgb`.** Sắc ấm 40° pha sắc lạnh 205° trong RGB thì đi qua vùng
  TRUNG TÍNH — **đúng họ lỗi đã sửa cho MÁI NHÀ ở Phase 3N** (15 kỷ ra 2 cụm màu).
- **⚠️ ĐÃ THỬ VÀ THẤT BẠI — đừng lặp lại** (đo thật, 2026-08-13):
  - `noon.horizonHue: 205, horizonPull: 0.42` → `#a6a69a`, 61°, tươi **0,06** → xám, không xanh.
  - `noon.horizonHue: 205, horizonPull: 0.78` → `#9ca7a3`, **157° lục-lam**, tươi **0,05**.
  - Càng kéo mạnh càng lạc sang lục rồi chết ở xám. ⇒ **Chỉnh số trong `DAYLIGHT_PROFILES` KHÔNG
    chữa được.** Cả hai thử nghiệm đã được HOÀN TÁC; mã hiện tại giữ nguyên giá trị cũ.
- **Current Risk**: thấp về kỹ thuật (không có gì hỏng), trung bình về trải nghiệm.
- **Future Risk**: trung bình. Mỗi phase mỹ thuật về sau đều đâm vào cùng phép trộn sai này.
- **Recommended Solution**: sửa `skyward()` cho xoay sắc trong **không gian HSL** thay vì trộn RGB —
  đúng khuôn đã dùng thành công cho mái nhà ở Phase 3N (`eraRoof` trong `palette3d.js`). ⚠️ Cẩn
  trọng: sắc nền và đích ở nhiều chặng gần như ĐỐI NHAU (40° vs 205°/226°), nên phép nội suy sắc
  ngây thơ sẽ đi qua LỤC hoặc TÍA ở quãng giữa — cần chọn mô hình cho `pull` (ví dụ: lấy thẳng sắc
  đích, để `pull` điều khiển ĐỘ TƯƠI) rồi **tinh chỉnh lại cả 6 chặng**.
- **Estimated Complexity**: **Medium-High** — phép toán thì nhỏ, nhưng phải tinh chỉnh lại 6 chặng
  và kiểm đủ **90 ô** (15 kỷ × 6 chặng) bằng `--sweep --all` trước khi phát hành. ⚠️ `--theme`
  KHÔNG nhân đôi phạm vi khi đã truyền giờ — xem đính chính ở đầu mục.
- **Blocking Conditions**: không có blocker kỹ thuật. Cần một phase riêng, KHÔNG làm kèm việc khác —
  đây là loại thay đổi mà "sửa một chỗ, hỏng ba chỗ" đã xảy ra nhiều lần trong lịch sử tầng màu.
- **Review Trigger**: trước bất kỳ thay đổi nào ở `skyward()`, số mũ vòm trời, hoặc
  `DAYLIGHT_PROFILES`.
- **Owner**: (chưa gán)
- **Status**: ✅ **RESOLVED 2026-08-13 (Phase 3V)** — phát hiện cùng ngày ở Phase 3U khi quét lại đủ
  15 kỷ × 6 chặng trên mã hiện tại. ⚠️ Mắt tôi ban đầu chẩn "3 chặng ban ngày giống hệt nhau" —
  **phép đo BÁC BỎ điều đó** (6/6 chặng vẫn phân biệt được, khoảng cách nhỏ nhất 17/255) nhưng lại
  lộ ra lỗi thật và chính xác hơn: không phải "giống nhau", mà là **cùng một SẮC, chỉ khác ĐỘ SÁNG**.
- **CÁCH SỬA THẬT SỰ ĐÃ DÙNG** (khác một chút so với mục "Recommended Solution" ở trên — ghi lại vì
  chỗ khác nhau chính là phần học được):
  1. `skyward()` xoay sắc bằng **vector chroma** (cộng hai vector đơn vị theo góc rồi `atan2`), giữ
     nguyên độ tươi/độ sáng gốc. Cách này tự tránh được đúng cái bẫy mà mục trên cảnh báo — sắc
     gần đối nhau thì vector tổng ngắn lại chứ không quét qua lục/tía. Trường hợp suy biến (hai
     vector triệt tiêu) đã có nhánh riêng. `t === 0` ra byte y hệt bản cũ ⇒ chỗ nào không kéo thì
     không đổi một pixel.
  2. **Không chỉ là phép trộn.** Còn hai tầng nữa mới ra màu trên màn hình, và nếu bỏ qua thì sửa
     đúng toán vẫn ra trời xám: (a) `NeutralToneMapping` phơi sáng 1,2 nén mạnh vùng sáng, mà chân
     trời để độ sáng 0,80 thì nằm đúng giữa vùng bị nén ⇒ độ tươi ra màn hình chỉ còn **1/5** —
     phải hạ độ sáng xuống 0,70/0,72 và nâng độ tươi lên 0,60/0,44; (b) nắng ấm nhân vào trời làm
     sắc lạnh tụt **13–22°** về phía lục ⇒ hai chặng sáng/trưa phải khai cao hơn đích thật ~15°.
- **Nợ CÒN LẠI, có chủ đích**: số mũ `t^2.6` ở `sceneGraph.js` **không đụng tới**. Chú thích tại chỗ
  ghi rõ nó được nâng từ 1,2 lên để cứu lỗi "mảng oải hương xam xám"; sửa nó là mở lại một lỗi cũ
  để đổi lấy một cải thiện mà đường khác đã đạt được rồi. Vẫn đúng là **màu trời ban ngày do
  `horizonHue` quyết định, không phải `skyHue`** — ai chỉnh bảng `DAYLIGHT_PROFILES` phải nhớ điều đó.

---

## #24 — MỌI KỶ ĐỀU CÓ CÔNG TRÌNH BỊ MÉP KHUNG HÌNH CẮT — và không ai đo cho tới hôm nay

> ⚠️ **CẬP NHẬT 2026-08-18 (Phase 12) — BỘ SỐ GỐC CỦA MỤC NÀY ĐO THIẾU 30% CHIỀU CAO.**
> `frame-fit.mjs` nhân `BUILDING_SCALE` (1,3) vào bề NGANG nhưng quên nhân vào chiều CAO, trong khi
> `geometryFactory` nhân `scale` vào **cả ba chiều** (`h: part.h * scale`). Nên mọi công trình thật
> **cao hơn 1,3 lần** thứ công cụ tưởng, biên mép TRÊN thật hẹp hơn số đã ghi, và mức độ bị cắt
> **nặng hơn** những gì mục này mô tả — sai theo hướng TRẤN AN. Đã vá; đo lại ở khung 1,30 vẫn ra
> **14/15 kỷ bị cắt**, nhưng hệ số camera cần để vào trọn khung nay là **1,82** (đang dùng
> 1,19–1,58), tức phải lùi xa thêm ~15–50% chứ không phải một chút.
> ⇒ Bài học: **một công cụ đo chép lại hằng số của công cụ dựng thì hai bên trôi khỏi nhau** —
> đúng cái bẫy mà chính chú thích đầu `frame-fit.mjs` đã cảnh báo, ở ngay dòng dưới nó.
> ⚠️ Mục này nay **dính chặt với #41 và với Phase 12**: cả ba đều là một bài toán duy nhất —
> *"thành phố quá nhỏ / quá lớn so với khung hình"*. Đừng chữa riêng một mục.


- **Module**: `src/engine/city3d/orbit.js` (`cityOrbitOptions`) — đo bằng `scripts/frame-fit.mjs`
- **Priority**: Medium-High
- **Severity**: Medium
- **Impact**: đo được ở tỉ lệ khung 1,30 (dáng thẻ cảnh trên máy bàn): **14/15 kỷ có ít nhất một
  công trình lọt ra ngoài mép khung hình**, chủ yếu mép DƯỚI và mép TRÁI. Nặng nhất là kỷ 2
  (`bp_kho_lua`, biên **−0,513** — tức nhô ra ngoài hơn nửa nửa-khung) và kỷ 3 (−0,474). Ở tỉ lệ
  khung VUÔNG (1,0 — gần với thẻ cảnh trên iPhone) thì là **15/15**. Hậu quả với Đàm: ở gần như mọi
  kỷ, một trong năm công trình anh vừa đánh đổi hàng chục phiên tập trung để xây bị xén mất một
  phần ngay trong khung mặc định.
- **Root Cause**: **KHÔNG phải do Phase 7B.** Đã đo đối chứng bằng `--flat` (địa hình phẳng như
  trước 7B): vẫn **14/15** kỷ bị cắt, và hệ số khoảng cách cần thiết còn CAO HƠN (2,01 so với 1,78
  sau khi có địa hình) — tức địa hình + phần bù camera của nó làm khung hình **đỡ** đi, không tệ
  hơn. Nguyên nhân gốc có từ Phase 5A: `CAMERA_DISTANCE_FACTOR` hạ 1,5 → **1,18** để chữa đúng lời
  Đàm *"thu phóng cho vừa đủ thôi, không thu quá xa rồi bị mờ"*. Lần đó chỉ kiểm "nóc công trình
  cao nhất có lọt khung không" (bài `KHÔNG CẮT NGỌN` trong `orbit.test.js`) — **một trục, mép TRÊN,
  một công trình**. Bốn mép còn lại và bốn công trình còn lại chưa bao giờ được đo. Đúng bài học đã
  ghi ở Phase 3Y: *đo một trục thì vừa BÁO NHẦM vừa BỎ SÓT, và cái bỏ sót nguy hiểm hơn vì im lặng.*
- **Current Risk**: thẩm mỹ, không phải chức năng — app chạy đúng, chạm-để-xem-công-trình vẫn đúng,
  và Đàm **kéo/thu phóng được** để nhìn trọn. Nhưng khung MẶC ĐỊNH là thứ anh thấy mỗi lần mở tab,
  và một toà nhà bị xén nửa dưới là đúng cái cảm giác "prototype" mà cả nhánh Phase 7 đang đi chữa.
- **Future Risk**: yêu cầu của Đàm cho các phase sau là **thêm nhà dân, cửa hàng, xưởng, khu dân cư
  lấp đầy lưới**. Thành phố càng phủ kín 12×12 thì phần bị xén càng nhiều, và lúc đó việc mở khung
  sẽ không còn là một lựa chọn mà là bắt buộc — nên quyết sớm thì rẻ hơn.
- **Recommended Solution**: ⚠️ **CẦN ĐÀM QUYẾT — đây là đánh đổi thật, không phải lỗi để tự sửa.**
  Hai vế đều đã đạt và loại trừ nhau: khung sát ⇒ nhìn rõ chi tiết kiến trúc; khung rộng ⇒ không
  xén. Ba hướng:
  - **(a) Mở khung cho vừa hết** — `CAMERA_DISTANCE_FACTOR` 1,18 → **1,78** (khung 1,3) hoặc
    **2,23** (khung vuông). Hết xén hoàn toàn, nhưng công trình nhỏ đi ~1,5 lần, tức quay lại đúng
    cái "mờ" Đàm đã bảo bỏ.
  - **(b) Khung theo TỈ LỆ MÀN HÌNH** — máy bàn (khung bè ngang) giữ sát, điện thoại (khung vuông)
    mở rộng. Đúng hơn về nguyên tắc vì nguyên nhân một phần nằm ở FOV ngang, nhưng `cityOrbitOptions`
    hiện chưa biết tỉ lệ khung; phải truyền thêm tham số.
  - **(c) Co thành phố lại thay vì lùi camera** — kéo 5 khu đất về gần tâm hơn trong `cityLayout.js`.
    Giữ nguyên độ lớn công trình trên màn hình, nhưng **đụng bố cục** nên phải cân với ADR-007 và
    với kế hoạch tăng mật độ sắp tới. Có lẽ là hướng đúng nhất về lâu dài.
- **Estimated Complexity**: (a) Low (~15 phút, một hằng số) · (b) Medium (~1–2 giờ) · (c) Medium-High
  (đụng bố cục, cần đo lại nhiều thứ).
- **Blocking Conditions**: không chặn gì. NÊN quyết trước khi làm phase tăng mật độ nhà, vì lúc đó
  vừa phải chỉnh bố cục vừa phải chỉnh khung — làm một lần rẻ hơn hai lần.
- **Review Trigger**: khi bắt đầu phase "mật độ / khu dân cư"; hoặc ngay khi Đàm thấy khó chịu.
- **Owner**: cần Đàm chọn hướng (a)/(b)/(c)
- **Status**: Open — đã đo đầy đủ, đã có công cụ tái lập, chờ Đàm quyết.
- ⚠️ **CÔNG CỤ ĐÃ ĐO RA CÁC CON SỐ TRÊN** (bắt buộc ghi kèm — bài học `TECH_DEBT #18`):
  `node --import ./scripts/register-esm-loader.mjs scripts/frame-fit.mjs 1.3`
  (thêm `--flat` để lấy đối chứng địa hình phẳng, `--selftest` để chứng minh công cụ còn phản ứng
  đúng trên CẢ HAI trục dọc/ngang). ⚠️ Công cụ này đã nói dối ngay lần chạy đầu — vector `right` viết
  ngược dấu nên **nhãn mép đảo hoàn toàn** (báo "mép TRÊN" trong khi ảnh chụp rõ ràng cắt ở mép
  DƯỚI); độ lớn thì vẫn đúng. Chi tiết ở đầu `frame-fit.mjs`. Lần thứ 17 công cụ tự chế nói dối
  trong dự án này, và lần này con mắt bắt được nó.

---

## #23 — Cổng hiệu năng iPhone của Phase 3A chưa được đo lại sau khi cả cảnh chuyển sang PBR

- **Module**: `src/components/city/render3d/sceneGraph.js` + `CityPerfHud.jsx`
- **Priority**: Medium
- **Severity**: Medium
- **Impact**: chưa biết. Cổng 3A (≥30 FPS khi xoay · <1,5 s tới khung hình đầu · không nóng máy sau
  5 phút · pin tụt <4% sau 10 phút) đã đo ĐẠT trên iPhone thật của Đàm — nhưng **đo trên bản
  Lambert**. Phase 7A đổi ba thứ đều tốn thêm GPU: (a) `MeshStandardMaterial` đắt hơn Lambert cho
  MỖI ĐIỂM ẢNH (thêm phép tính BRDF + tra bản đồ môi trường); (b) mỗi lần dựng cảnh nay nướng thêm
  một lượt PMREM; (c) công trình đi từ 1 lệnh vẽ lên 5–7.
- **Root Cause**: không phải lỗi — là hệ quả có chủ đích của ADR-013. Vấn đề là **con số nghiệm thu
  cũ nay đã hết hiệu lực mà không có gì báo**, đúng họ với bài học `TECH_DEBT #18` ("một con số
  nghiệm thu phải đi kèm công cụ đã đo ra nó" — ở đây thêm một vế: *và đi kèm PHIÊN BẢN nó đo*).
- **Current Risk**: thấp trên máy Mac (ảnh dựng 15 kỷ vẫn ~21 s như trước, không chậm đi rõ rệt).
  Rủi ro thật nằm ở iPhone, nơi chưa ai đo. Đáng chú ý: chi phí (b) và (c) là **một lần mỗi lần
  dựng cảnh**, còn (a) là **mỗi khung hình** — nên nếu có vấn đề thì nó sẽ hiện ra ở FPS lúc xoay
  camera, không phải ở thời gian tới khung hình đầu.
- **Future Risk**: nếu Phase 7B/7C tăng mật độ nhà như Đàm yêu cầu mà chưa đo lại nền này, thì lúc
  máy nóng lên sẽ không biết thủ phạm là vật liệu hay mật độ — hai thay đổi chồng lên nhau, không
  tách được. **Nên đo TRƯỚC khi làm 7B.**
- **Recommended Solution**: Đàm bật HUD hiệu năng trong Cài đặt, mở tab Thành Phố trên iPhone, xoay
  camera ~10 giây rồi chụp màn hình. Nếu FPS < 30: hạ `metalness` về 0 ở chế độ `lowDetail` để bỏ
  hẳn nướng PMREM cho máy yếu (đường lui đã có sẵn — `createSkyEnvironment` trả `null` là hợp lệ,
  cảnh vẫn chạy, chỉ mất phản chiếu kim loại).
- **Estimated Complexity**: Low (đo: ~5 phút của Đàm; vá nếu cần: ~1 giờ).
- **Blocking Conditions**: không chặn gì đang chạy. **Nên** chặn Phase 7B để hai thay đổi không
  chồng lên nhau.
- **Review Trigger**: trước khi bắt đầu Phase 7B (mật độ/địa hình); hoặc ngay khi Đàm thấy máy nóng.
- **Owner**: cần Đàm đo (AI không chạm được vào iPhone thật)
- **Status**: Open — **nửa DESKTOP đã đóng, nửa iPhone vẫn chưa đo.**
- ✅ **CẬP NHẬT 2026-08-17 — NỬA DESKTOP CỦA MỤC NÀY ĐÃ CÓ SỐ, VÀ ĐẠT** (xem `PERFORMANCE.md`).
  Đo trên **Apple M3 · ANGLE Metal · 1100×700 · DPR 2**, 24/24 cảnh: frame time **3,90–5,20 ms**
  trên trần 16,67 ms ⇒ **dư 3,2 lần**. Ba lo ngại của mục này được trả lời riêng từng cái:
  **(a) `MeshStandardMaterial` đắt hơn cho mỗi điểm ảnh** — ĐÚNG, và đó chính là trục đắt: 80% chi
  phí đi theo điểm ảnh. Nhưng ở cỡ cửa sổ này nó chỉ tiêu 5,20 ms lúc xấu nhất.
  **(b) nướng PMREM mỗi lần dựng cảnh** — không hiện ra trong frame time khung ổn định (đúng như
  mục này dự đoán: chi phí một-lần-mỗi-lần-dựng, không phải mỗi khung).
  **(c) công trình đi từ 1 lên 5–7 lệnh vẽ** — đo được 12–13 lệnh vẽ cả cảnh, không phải nút thắt.
  ⇒ **Trên Mac: KHÔNG cần hạ `metalness`, KHÔNG cần bỏ PMREM.** Đường lui ấy vẫn giữ nguyên cho
  iPhone. ⚠️ **Bộ số M3 KHÔNG suy ra được cho iPhone** — GPU khác, băng thông khác, không quạt, và
  `PERFORMANCE.md` ghi rõ điều này. Mục này vì vậy **thu hẹp phạm vi còn ĐÚNG iPhone**.
- ⚠️ **CẬP NHẬT 2026-08-14 — PHASE 7B ĐÃ LÀM MÀ CHƯA CÓ SỐ ĐO NÀY, ghi ra để không ai tưởng là đã
  đo.** Mục này khuyến nghị "nên đo TRƯỚC khi làm 7B" để hai thay đổi khỏi chồng lên nhau; thực tế
  7B chạy trước khi Đàm kịp đo. Lý do chấp nhận được, và đây là lập luận để phản biện chứ không phải
  để trấn an: **7B gần như không tốn thêm gì cho GPU**. Nền vẫn đúng 144 ô hộp trong MỘT
  `InstancedMesh` — địa hình chỉ đổi `y` và hệ số cao của từng thể hiện, không thêm ô, không thêm
  lệnh vẽ. Bệ kè đi vào CÙNG khối hình học gộp của công trình (không thêm lệnh vẽ) và chỉ tốn 12
  tam giác mỗi cái, tối đa 5 cái một kỷ ⇒ **≤ 60 tam giác** trên tổng ~5.000. Nếu iPhone có nóng
  thì thủ phạm gần như chắc chắn vẫn là PBR của 7A, không phải địa hình — nên hai thay đổi trên
  thực tế VẪN tách được. Điều này KHÔNG còn đúng ở phase tăng mật độ nhà sắp tới: chỗ đó thêm hình
  học thật, nên **phải đo trước.**

---

## #22 — `sweep-score.mjs` KHÔNG còn chấm được 15 kỷ: bộ lọc "8% tươi nhất" chấm nhầm CỎ, không phải mái

> ## ✅ ĐÃ ĐÓNG (2026-08-16) — VÁ GỐC BẰNG CÁCH **BỎ HẲN** PROXY "MÁI", KHÔNG PHẢI VÁ BỘ LỌC
>
> **Đã làm gì**: gỡ `roofColor` (bộ lọc 8% tươi nhất) và cổng "TỪ CHỐI CHẤM" đi kèm; ruột phép đo
> chuyển sang `scripts/sweepMetric.mjs` (thuần, `import` được, có `sweepMetric.test.js` canh).
> Dải thành phố nay được chia **lưới 6×3 = 18 ô con**, mỗi ô con một màu trung bình → vector 54
> chiều; hai kỷ so nhau **theo TỪNG chặng rồi lấy trung bình các khoảng cách** (gộp 6 chặng trước
> khi so thì hai kỷ lệch ngược chiều nhau ở hai đầu ngày sẽ triệt tiêu nhau).
>
> **Vì sao cách này không chết lần thứ ba**: nó **không chứa giả định mỹ thuật nào** — phép đo
> không biết "mái"/"cỏ"/"tường" là gì. Bệnh gốc mà bộ lọc sinh ra để chữa là *"trung bình trên vùng
> quá rộng pha loãng tín hiệu ~10 lần"*; thu vùng lấy trung bình xuống **1/18** chữa đúng bệnh đó
> mà không cần biết mái nằm ở đâu.
>
> **Hai hướng đã LOẠI, ghi lại để phiên sau khỏi thử lại** (bổ sung cho ba hướng ở phần
> Recommended Solution cũ bên dưới):
> - *Đối chiếu điểm ảnh với `roofColor` mà `eraStyle.js` khai* → **vòng tròn**: chọn điểm ảnh theo
>   màu đã khai rồi đo xem màu có khớp màu đã khai không.
> - *Lượt ảnh mặt-nạ do `city-preview.mjs` dựng* (hướng "có vẻ đúng nhất" mà chính mục này đề xuất)
>   → **bất khả thi ở tầng dữ liệu**: chạy 15 kỷ qua `getEraStyle` thì **4/15 kỷ khai mái TRÙNG vật
>   liệu tường** — kỷ 3 (mudbrick/mudbrick), kỷ 12 và 13 (concrete/concrete), kỷ 14 (glass/glass).
>   `materialProfile(role==='roof')` xếp tam giác mái vào họ **vật liệu** `style.roofMaterial`, nên
>   ở bốn kỷ ấy "nhóm mái" và "nhóm tường" là MỘT. Mái **không tách được ngay từ NGUỒN** ⇒ không bộ
>   lọc điểm ảnh nào, kể cả mặt nạ do bên dựng cung cấp, cứu được. ⚠️ Và đúng cặp **12↔13** — cặp
>   hay bị kêu trùng nhau nhất — là cặp dùng chung **cả hai** vật liệu; bản sắc của chúng nằm ở
>   màu, khối và cây cối, không nằm ở mái.
>
> **ĐƠN VỊ GIỮ NGUYÊN CÓ CHỦ Ý**: vẫn là khoảng cách RGB trung bình mỗi bộ ba (/255), nên ngưỡng
> mắt **12** hiệu chuẩn ở Phase 3Y (Spearman 0,854) còn dùng được. Đổi sang biểu đồ tần suất/EMD
> sẽ tạo ra một ngưỡng **chưa hiệu chuẩn** — đúng cái phễu Phase 9A đã dạy.
>
> **SỐ ĐO SAU KHI VÁ** (2026-08-16, bản quét `sweep-light-ky1-15.png`, 15 kỷ × 6 chặng, theme
> sáng, cấp 3, 40 phiên — trên mã Phase 9C `53045b2`):
>
> | | kết quả |
> |---|---|
> | 105 cặp kỷ dưới ngưỡng mắt (12) | **0/105** |
> | cặp kỷ gần nhất | **23,3** (kỷ 11 ↔ 12; chặng sát nhau nhất 16,4) |
> | trung vị 105 cặp kỷ | **41,1** |
> | 15 cặp chặng ngày | **0/15** dưới ngưỡng, gần nhất 20,7 |
> | trải giữa 18 ô con, từng kỷ | 14,6 – 31,6 (lưới thật sự nhìn thấy cấu trúc, không phẳng lì) |
>
> **BẰNG CHỨNG LƯỚI Ô CON CÓ TÁC DỤNG TRÊN DỮ LIỆU THẬT** (không chỉ trên ảnh dựng tay):
> `--selftest` thu lưới về 1×1 — tức quay lại đúng phép trung bình cả dải đã gây ra kết luận sai
> 70/105 ở Phase 4C — cho ra **cặp gần nhất 5,0 và 6/105 dưới ngưỡng**. Tức việc chia ô con nâng
> cặp gần nhất lên **~4,7 lần**. Nhãn in ra cũng đổi theo (`lưới 1×1 (--selftest: ĐÃ THU LƯỚI, số
> phải TỆ ĐI)`) — bản đầu vẫn in "6×3" khi đang chạy 1×1, đúng loại lỗi NHÃN đã cắn ở `frame-fit.mjs`.
>
> **PHÉP ĐO MỚI CÓ TEST RIÊNG** — `scripts/sweepMetric.test.js`, 6 bài, **mỗi bài đã được phá thử
> ít nhất một lần và thấy ĐỎ**: mảng nhỏ không bị pha loãng (phá: thu lưới về 1×1 ⇒ 2 đỏ) · không
> thiên vị màu, đá phiến xỉn đọc được (phá: nhân đôi kênh lục ⇒ 2 đỏ) · chỉ đọc dải thành phố (phá:
> bỏ độ lệch dải ⇒ 1 đỏ) · tất định + số chiều khớp lưới (phá: cộng dồn phụ thuộc thứ tự ⇒ 1 đỏ) ·
> không tràn sang ô bên/dải nhãn (phá: nới bề ngang ô con +20px ⇒ 2 đỏ) · đơn vị vẫn là RGB (phá:
> bỏ căn bậc hai ⇒ 2 đỏ). ⚠️ Hai bài đầu ĐỎ ngay lần chạy đầu tiên và **lỗi nằm ở FIXTURE, không ở
> phép đo**: mảng thử là một dải ngang suốt bề rộng, mà dải ngang chỉ hưởng lợi từ chia HÀNG (trần
> nhạy √3 = 1,73). Đã sửa fixture thành mảng vuông vức (giống vật thật), **KHÔNG hạ ngưỡng cho test
> xanh**.
>
> **KHÔNG ĐỤNG GÌ VÀO RENDERER**: `npm test` 718/718 · lint sạch · build xanh · chunk 3D
> `CityScene3D-BoWYJm9L.js` **trùng băm** với commit `53045b2` · không file nào dưới `src/` import
> `sweepMetric`/`sweep-score`/`frame-score`.
>
> **Bài học đã ghi vào `CLAUDE.md`**: *một "thứ đại diện" (proxy) là một giả định mỹ thuật đội lốt
> một phép đo* — chữ "≈" trong "8% tươi nhất **≈ mái**" chính là giả định, và nó chết trong im lặng
> ở một phase khác do tay một người khác. Đừng vá một proxy hỏng bằng một proxy khôn hơn; hỏi lại
> xem nó sinh ra để giải bài toán gì rồi giải thẳng bài toán đó.

- **Module**: `scripts/sweep-score.mjs` (hàm `roofColor`)
- **Priority**: Medium
- **Severity**: Medium
- **Impact**: mất một nửa năng lực của công cụ chấm bản quét — phần **6 chặng ngày** vẫn chạy tốt
  (nó đo cả cảnh 9 chiều, không dùng bộ lọc này), nhưng phần **so 105 cặp kỷ** thì không đo được
  nữa. Không ảnh hưởng gì tới app chạy trên máy Đàm; đây thuần là nợ ở tầng công cụ dev.
- **Root Cause**: bộ lọc đứng trên một giả định **chưa bao giờ được viết ra**: *"mái là thứ tươi
  nhất trong khung hình"*. Giả định ấy đúng suốt thời kỳ mái được suy từ `accentColor` — một màu
  NHẤN GIAO DIỆN, chọn cho chữ nổi trên nền, nên luôn rực hơn mọi thứ khác. **Phase 6B đổi mái sang
  vật liệu lợp thật** (đá phiến xám lam, bê tông gần trung tính, đồng oxy hoá) và giả định lập tức
  hết đúng: thứ tươi nhất còn lại trong khung hình là **cỏ nắng lọt giữa các khối nhà**.
- **SỐ ĐO** (2026-08-14, bản quét 8 kỷ × 6 chặng, chặng trưa):

  | kỷ | vật liệu khai trong `eraStyle.js` | bộ lọc đo ra | lệch góc màu |
  |---|---|---|---|
  | 5 | `#586a89` đá phiến xám lam (218°) | `#4b5745` ô-liu (60°) | **158°** |
  | 11 | `#3e9883` đồng oxy hoá (166°) | `#5d6b4c` ô-liu (62°) | **104°** |
  | 6 | `#844433` ngói âm dương (15°) | `#572409` (17°) | 2° — "khớp" |
  | 3 | `#c59e79` gạch bùn (30°) | `#6a5625` (43°) | 13° — "khớp" |

  ⚠️ **Bất đối xứng ở hai dòng cuối mới là phần đáng nhớ**: các vật liệu ẤM nằm sẵn gần sắc ô-liu
  của cỏ, nên khi bộ lọc chấm nhầm cỏ thì chúng vẫn "khớp". Tức **đa số kỷ về mặt cấu tạo không có
  khả năng phát hiện lỗi này**; chỉ vật liệu LẠNH mới phơi ra được. Vì vậy cổng kiểm dùng luật
  "MỘT kỷ lệch > 60° là đủ kết luận", KHÔNG phải "quá nửa số kỷ" (đã thử luật quá-nửa: nó **không
  nổ**, vì chỉ 2/6 kỷ có đủ tư cách tố cáo).
- **Current Risk**: đã chặn. Công cụ nay **TỪ CHỐI CHẤM** phần cặp-kỷ và in ra đúng lý do, thay vì
  in một con số. Trước khi vá, nó in ra `✗ kỷ 3 ↔ kỷ 10: 6,7 — dưới ngưỡng mắt` — trong khi kỷ 3 là
  gạch bùn nâu vàng SÁNG và kỷ 10 là đá phiến gần ĐEN, hai thứ không ai nhầm được. Một phiên sau
  rất có thể đã mất cả ngày đi chữa cái không hỏng.
- **Future Risk**: nếu ai đó gỡ cổng kiểm cho "đỡ vướng", công cụ quay lại nói dối tự tin.
- **Recommended Solution**: thay bộ chọn mái bằng thứ **không giả định gì về màu**. Đã thử và loại
  ba hướng trong cùng phiên, ghi lại để phiên sau khỏi thử lại:
  1. *8% điểm ảnh SÁNG nhất* → cả 8 kỷ ra `#908a78` gần y hệt nhau (đang chấm nền/đường sáng).
  2. *Điểm đầu tiên khác nền trời khi quét dọc từ trên xuống* → bắt đúng **đường chân trời** ở mọi
     cột (n=1168 đều tăm tắp ở cả 8 kỷ), không phải nóc nhà.
  3. *Như (2) nhưng chỉ lấy cột nhô lên trên chân trời* → sập về n=0 ở 6/8 kỷ (mốc chân trời lấy
     theo phân vị bị chính các khối nhà kéo lệch).
  Hướng còn chưa thử và có vẻ đúng nhất: cho `city-preview.mjs` dựng thêm **một lượt ảnh mặt-nạ**
  (mái tô màu cờ, mọi thứ khác đen) rồi ghi kèm như `.geom.json` — lúc đó việc "đâu là mái" là dữ
  kiện do bên DỰNG cung cấp, không phải bên ĐO đoán. Đúng tinh thần bài học Phase 4G: *"cỡ ô không
  phải tuỳ chọn của phép đo, nó là sự thật về tấm ảnh"*.
- **Estimated Complexity**: Medium (~nửa ngày) — phải sửa cả `city-preview.mjs` lẫn `sweep-score.mjs`.
- **Blocking Conditions**: không chặn gì. Bảng màu vật liệu vẫn được canh ở tầng thuần bằng 5 hàng
  rào ở `palette3d.test.js` (cặp gần nhất · số cặp dưới 12 · trung vị ≥ 52 · trải độ sáng ≥ 0,30 ·
  trần độ tươi) **cộng một bài đối chứng** bắt bộ hàng rào phải còn bắt được bảng mái hỏng cũ, và
  ở tầng dữ liệu bằng bài `MỖI KỶ PHẢI KHAI MỘT MÀU VẬT LIỆU LỢP ĐỌC ĐƯỢC` (`buildingSpec.test.js`).
- **Review Trigger**: lần tới cần đo màu mái trên ảnh chụp thật; hoặc khi thêm/sửa `roofColor`.
- **Owner**: chưa ai
- **Status**: ✅ **ĐÓNG 2026-08-16** — xem khối đóng khung ở đầu mục. Năng lực chấm 105 cặp kỷ đã
  khôi phục, bằng một phép đo KHÔNG còn proxy nào để mà hỏng lần nữa. Phần thân mục dưới đây giữ
  NGUYÊN làm bản ghi lịch sử (đúng luật của file này: không xoá bản ghi cũ khi lật một kết luận).

---

## #21 — Công trình rộng nhất **3,687 ô** trên một khu đất rộng **3 ô** — chưa ai NHÌN xem nó có cắm vào nhà bên không

- **Module**: `src/engine/city3d/archetypes.js` (`masses`) + `buildingSpec.js` (chi tiết `courtyard`)
- **Priority**: Low
- **Severity**: Low
- **Impact**: nếu thật sự tràn thì hai công trình cạnh nhau có thể lồng vào nhau ở kỷ 6 và kỷ 9 —
  xấu, nhưng không mất dữ liệu và không ảnh hưởng hiệu năng.
- **SỐ ĐO** (2026-08-14, Phase 6A — đo cả 75 bản vẽ ở cấp 3, tái lập được bằng
  `buildingSpec.test.js` bài "BỀ NGANG"): rộng nhất `bp_thanh_quan_viet` (kỷ 6, kỳ quan epic)
  **3,687 ô**; thứ nhì `bp_quoc_hoi` (kỷ 9) 3,019. Phân bố: **5/75 vượt 2,6 · 2/75 vượt 3,0**.
- **Root Cause**: chi tiết `courtyard` đặt một khối rộng `w * 1.1` lệch hẳn `d * 0.82` khỏi tâm, nên
  hình bao nở ra gần gấp đôi. `archetypes.js` ghi mốc thiết kế là *"kỳ quan được phép trải tới
  ~1.7 ô"* — tức con số thật đang gấp hơn hai lần mốc mà chính file đó tự đặt ra.
- **⚠️ CÓ TỪ TRƯỚC PHASE 6A**: đo lại trên đúng commit `f324683` (trước khi thêm chữ ký) ra **cùng
  con số 3,687**. Chữ ký kiến trúc KHÔNG làm nó tệ thêm.
- **Current Risk**: thấp — không có gì hỏng, không ai từng kêu.
- **Future Risk**: trung bình. Mọi lần thêm chi tiết mới vào `emitMotif`/`emitSignature` đều có thể
  đẩy con số này lên mà **không có gì đỏ lên**, vì trước hôm nay không hề có phép đo nào cho bề
  ngang (chỉ có phép đo TỈ LỆ cao/rộng, mà tỉ lệ thì tràn ngang vẫn giữ nguyên).
- **Recommended Solution**: ⚠️ **ĐỪNG SỬA TRƯỚC KHI NHÌN.** Luật của dự án này là *nhìn rồi mới kết
  luận về mỹ thuật*, và chưa ai chụp một thành phố kỷ 6 đủ 5 công trình để xem hai khu đất có thật
  sự chạm nhau không. Có thể hoá ra sân đình tràn sang ô bên lại **đẹp** (thành phố thật thì nhà
  cũng không dừng đúng ranh giới lô đất). Trình tự đúng: dựng fixture kỷ 6 đủ 5 công trình → chụp →
  nếu chồng lấn xấu thì kẹp `courtyard` lại, nếu không thì đóng mục này và sửa lại mốc "~1.7 ô" ở
  `archetypes.js` cho khớp sự thật.
- **Estimated Complexity**: Trivial (kẹp một hằng số) — phần khó là quyết định có nên kẹp không.
- **Blocking Conditions**: cần một lần soi bằng mắt, không cần Đàm quyết.
- **Review Trigger**: bất kỳ ai chạm vào `emitMotif`/`emitSignature`/`archetypes.masses` — bánh cóc
  3,7 ở `buildingSpec.test.js` sẽ đỏ nếu con số phình thêm.
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện 2026-08-14 khi thêm chữ ký kiến trúc, đúng lúc đi tìm xem chữ ký có
  làm công trình phình ra không. Nó không, nhưng phép đo dựng để kiểm điều đó lại tìm ra một thứ
  khác đã nằm sẵn ở đó.

---

## #14 — **95% số phiên tập trung KHÔNG có lễ mừng nào** — và càng chơi lâu càng im lặng

- **Module**: cân bằng game — `src/engine/constants.js` (`CRAFT_QUEUE_SLOTS`, `sessionsToComplete`)
  + `advanceCraftingQueueWithPerks` (`gameStore.js:1494`). KHÔNG phải lỗi của `cityMoment.js`.
- **Priority**: **High**
- **Severity**: High
- **Impact**: đây là **nguyên nhân lớn nhất còn lại của chữ "chán"**, lớn hơn hẳn hai thứ vừa sửa ở
  Phase 3R/3S. Toàn bộ công sức làm lễ mừng đẹp, đa dạng, đúng cột mốc chỉ chạm tới **~5% số phiên**.
  95% còn lại Đàm làm xong 25 phút thật và thành phố **không nói gì cả**.
- **SỐ ĐO** (dựng từ chính `scripts/simulate-pacing.mjs` của repo — 12 phiên/ngày, 370 ngày tới
  Prestige = 4 428 phiên; ghép với `sessionsToComplete` thật của 75 bản vẽ = 420 bước xây):

  | | phiên | tỉ lệ |
  |---|---|---|
  | Có lễ mừng | 215 | **4,9 %** |
  | Im lặng | 4 213 | **95 %** |

  Và nó **xấu dần theo kỷ**: kỷ 1 im lặng 81% → kỷ 5: 93% → kỷ 10: 95% → **kỷ 15: 98%**. Thứ đáng
  lẽ thưởng cho việc chơi lâu thì càng chơi lâu càng tắt.
  ⚠️ Đây đã là **trường hợp TỐT NHẤT**: giả định Đàm LUÔN giữ đủ cả 2 ô hàng đợi. Giữ 1 ô thì số
  phiên có lễ mừng tăng gấp đôi nhưng vẫn dưới 10%.
- **Root Cause**: ba hằng số nhân nhau, không cái nào sai một mình.
  (1) `CRAFT_QUEUE_SLOTS = 2` và **mỗi phiên đẩy MỌI ô tiến 1 bước** ⇒ một phiên tiêu 2 bước xây.
  (2) Tổng bước xây cả game chỉ có **420** (75 bản vẽ × trung bình 5,6 phiên).
  (3) Hàng đợi bị **lọc theo KỶ HIỆN TẠI** (`gameStore.js:1258`) ⇒ chỉ được xây 5 bản vẽ của kỷ
  đang ở; xây hết là im lặng cho tới khi lên kỷ mới, mà **thời gian ở mỗi kỷ tăng dần** (kỷ 1: 4
  ngày → kỷ 15: 69 ngày) trong khi số bản vẽ mỗi kỷ giữ nguyên 5.
- **Current Risk**: cao về TRẢI NGHIỆM, bằng 0 về kỹ thuật — không có gì hỏng, không mất dữ liệu,
  không lỗi. Đây là nợ THIẾT KẾ, không phải nợ mã.
- **Future Risk**: cao. Mọi đầu tư thêm vào lễ mừng/thành phố đều bị chia cho 5% trước khi tới được
  người dùng. Nếu không xử lý, mọi phase kiểu 3R/3S sau này đều lãi thấp một cách có hệ thống.
- **Recommended Solution**: ⚠️ **KHÔNG được AI tự quyết** — mọi phương án đều đổi cân bằng kinh tế
  mà Đàm đã tinh chỉnh, nên theo Playbook (*Architecture Change: đánh giá + trade-off + ADR TRƯỚC,
  rồi mới đổi*) và quy tắc "HỎI TRƯỚC KHI LÀM". Bốn hướng đã cân nhắc, kèm đánh đổi thật:
  - **(a) Tăng `CRAFT_QUEUE_SLOTS` 2 → 3–4.** Rẻ nhất, một hằng số. NHƯNG làm mọi thứ xây xong
    NHANH HƠN ⇒ im lặng tới sớm hơn. **Làm nặng thêm vấn đề, không nhẹ đi.** Loại.
  - **(b) Bỏ lọc theo kỷ hiện tại** — cho xây bản vẽ của kỷ CŨ chưa xây. Mở thêm rất nhiều bước
    xây cho các kỷ dài về sau. **✅ ĐÀM ĐÃ CHỌN HƯỚNG NÀY (2026-08-13).**
    ⚠️ **NHƯNG GIÁ THẬT CAO HƠN "Medium" đã ghi ở đây — đọc hết trước khi bắt tay.** Lúc viết mục
    này tôi mới cảnh báo chung chung là "phá ý niệm mỗi kỷ một thành phố". Kiểm bằng mã thì va chạm
    là **CƠ HỌC, không phải ý niệm**:
    `placeBuilding` (`cityLayout.js:167`) lấy khu đất bằng `BUILDING_ZONES[meta.rank]`, mà `rank`
    chỉ là 0..4 (thứ hạng TRONG kỷ) — **`era` KHÔNG hề tham gia vào việc chọn khu đất.** Nghĩa là
    bản vẽ hạng 0 của CẢ 15 KỶ đều nhắm vào cùng MỘT khu đất. Trộn nhiều kỷ vào một thành phố ⇒ tới
    75 công trình tranh nhau 5 khu đất nhỏ ⇒ rơi vào nhánh dò xoắn ốc, mà nhánh đó ADR-007 nói rõ
    chỉ là "lưới an toàn cho id lạ" và khi nó chạy thì **bất biến "bảo tàng bất động" (nhà xây sau
    không đẩy nhà xây trước đi chỗ khác) bị phá** — chính ADR-007 gọi đây là "bất biến quan trọng
    nhất". ADR-007 cũng đã ghi sẵn điều kiện xem lại: *"nếu một kỷ nào đó có số bản vẽ khác 5 thì
    bảng khu đất phải mở rộng tương ứng"*.
    Ngoài ra `pruneEraScopedBlueprintState` hiện **XOÁ** cả `blueprints` lẫn `research.researched`
    của kỷ cũ, nên muốn xây tiếp thì phải thôi xoá chúng ⇒ state phình thêm và đi vào đúng payload
    đồng bộ nguyên-khối (`TECH_DEBT #8`).
    👉 **Hai cách hiện thực, khác nhau rất xa — phải chọn trước khi viết dòng nào:**
    - **(b1) Công trình kỷ cũ mọc trong thành phố ĐANG chơi.** Thưởng mạnh nhất (nó hiện ngay trên
      nền trang chủ, đúng chỗ Đàm nhìn). NHƯNG bắt buộc **thiết kế lại bảng khu đất** theo cặp
      `(era, rank)` thay vì `rank`. Giữ được tương thích hình ảnh nếu khu đất của kỷ ĐANG chơi giữ
      nguyên như cũ và các kỷ cũ lấy vùng khác — nhưng 75 công trình trên lưới 12×12 (144 ô, còn
      phải chừa chỗ cảnh vật) là bài toán bố cục thật, không phải sửa một hằng số. **Cần ADR mới.**
    - **(b2) Công trình kỷ cũ mọc thẳng vào BẢO TÀNG của kỷ đó.** Bất biến ADR-007 còn nguyên TUYỆT
      ĐỐI (mỗi kỷ vẫn đúng ≤5 công trình trên đúng 5 khu đất rời nhau) và ý niệm "mỗi kỷ một thành
      phố" **được củng cố** chứ không bị phá — thêm nữa nó biến bảo tàng từ thứ đông cứng thành thứ
      LỚN DẦN, chữa luôn lời than "tab Thành Phố ngắm vài lần là chán". NHƯNG phần thưởng YẾU hơn
      hẳn: nền trang chủ chỉ vẽ kỷ hiện tại, nên Đàm phải chủ động vào tab Thành Phố rồi chuyển về
      kỷ cũ mới thấy — tức đúng cái vòng lặp mà Phase 3F sinh ra để phá bỏ.
    ⇒ Đây là **Architecture Change** theo Playbook: phải viết ADR (cân nhắc b1 vs b2 + trade-off)
    TRƯỚC khi sửa. Ước lượng lại: **High**, không phải Medium.
    ✅ **ĐÃ LÀM (2026-08-13, Phase 4I — Đàm chọn `b2`, xem ADR-012).** Bản vẽ kỷ cũ khởi công lại
    được; xong thì vào bảo tàng của kỷ đó. Ba lớp chặn: ô riêng `LEGACY_QUEUE_SLOTS = 1` · nguyên
    liệu kỷ cũ không bao giờ kiếm lại được · không sinh đặc quyền. **Bài toán bố cục khu đất của
    (b1) KHÔNG phát sinh** — mỗi kỷ vẫn đúng 5 công trình trên đúng 5 khu đất, bất biến ADR-007 còn
    nguyên. **State KHÔNG phình**: không thêm trường nào, nên `TECH_DEBT #8` không bị chạm tới.
    ⚠️ **MỤC #14 CHƯA ĐÓNG.** Đây mới là mở đường; **chưa ai đo lại tỉ lệ phiên im lặng** sau thay
    đổi. Trần lý thuyết tăng thêm là ~390 bước xây (70 bản vẽ kỷ cũ × ~5,6 phiên), tức gần GẤP ĐÔI
    con số 420 — nhưng trần đó chỉ đạt được nếu Đàm còn đủ nguyên liệu của các kỷ cũ, mà điều đó
    phụ thuộc lối chơi và **chưa được đo**. Việc tiếp theo cho mục này: chạy lại
    `scripts/simulate-pacing.mjs` có tính đường trùng tu rồi cập nhật bảng số ở trên.
  - **(c) ~~Nâng cấp công trình đã xây Lv.1→2→3~~ — ❌ ĐÃ KIỂM: KHÔNG DÙNG ĐƯỢC.**
    ⚠️ **ĐÍNH CHÍNH NGAY TRONG NGÀY (2026-08-12).** Bản đầu của mục này ghi (c) là "ứng viên mạnh
    nhất, nhân số bước xây lên gấp ~3". **SAI.** Kiểm bằng mã: `upgradeBuilding`
    (`gameStore.js:5717`) là hành động **TỨC THÌ** — bấm nút trong xưởng, trả bằng tài nguyên tinh
    luyện (`getUpgradeRefinedCost`), **KHÔNG tốn một phiên tập trung nào**. Nâng cấp là bể chứa TÀI
    NGUYÊN, không phải bể chứa PHIÊN ⇒ nó không thêm một bước xây nào và không chữa được gì.
    Cơ chế này **đã tồn tại đầy đủ và đang chạy** (`buildingLevels` trong store · UI ở
    `BuildingWorkshop.jsx`/`BlueprintInventory.jsx` · `levelBoost` làm nhà cao thêm thật trong
    `buildingSpec.js:48`) — chỉ là nó không giải quyết vấn đề này.
    👉 *Bài học lặp lại: sổ nợ khẳng định "hạ tầng đã có sẵn" thì phải kiểm bằng lệnh trước khi
    tin — đúng cảnh báo ở đầu file này, mà chính tôi vừa vi phạm khi viết mục này.*
  - **(d) Chấp nhận, nhưng nói thật ở màn thưởng** khi xưởng trống (kiểu `tone:'idle'` mà
    `buildFocusTease` đã có). RẺ nhưng RỦI RO: `CityGrowthMoment` là lớp phủ chặn 3,2 s — nhắc
    "xưởng trống" sau MỌI phiên còn tệ hơn im lặng. Chỉ nên làm nếu gắn kèm (b) hoặc (e).
  - **(e) Tăng `sessionsToComplete`** — cách DUY NHẤT tác động thẳng vào con số. Đánh đổi: mỗi công
    trình lâu xong hơn, đổi hẳn nhịp kinh tế Đàm đã tinh chỉnh.
- ⚠️ **ĐÃ THỬ BÁC BỎ MỤC NÀY MỘT LẦN (2026-08-13) VÀ THẤT BẠI — ghi lại để phiên sau khỏi đi lại.**
  Sau khi #16 hoá ra KHÔNG phải đánh đổi như đã ghi, tôi thử áp cùng nghi ngờ lên #14: *"câu 'thành
  phố không nói gì cả' có bị nói quá không? Giàn giáo (Phase 3H) VỐN đã lên một nấc sau mỗi phiên,
  và nó hiện ngay trên nền trang chủ — vậy thành phố đâu có im lặng."* Kiểm bằng mã thì hai vế đầu
  **đúng**: `advanceCraftingQueueWithPerks` (`gameStore.js:1501`) trừ `sessionsRemaining` mỗi phiên,
  `computeCityLayout` trả mảng `scaffolds`, và `CityBackdrop` có truyền `pending: craftingQueue`.
  **NHƯNG số học bác bỏ toàn bộ lập luận**: cả game chỉ có **420 bước xây**, mỗi phiên tiêu **tối đa
  2 bước** ⇒ nhiều nhất ~420/4 428 phiên (**dưới 10%**) là có giàn giáo để mà lên nấc. 90–95% còn
  lại hàng đợi **RỖNG** — không có gì nhúc nhích, và câu "Xưởng đang trống" (`cityMoment.js:233`)
  chính là app đang nói thẳng ra điều đó. ⇒ **Mục #14 đứng nguyên như đã viết.**
  👉 Bài học: nghi ngờ một mục nợ là đúng, nhưng phải nghi ngờ **cả câu chuyện dễ nghe theo hướng
  ngược lại**. Lần trước phép đo cứu tôi khỏi bỏ sót một lỗi thật; lần này phép đo cứu tôi khỏi
  đóng oan một lỗi thật. Cùng một kỷ luật, hai hướng.
- ✅ **ĐÃ ĐO LẠI SAU PHASE 5D (2026-08-14) — và đây là con số đầu tiên của mục này được đo bằng
  lệnh tái lập được, không phải ước lượng.** Phase 5D thêm nhánh thứ ba vào `buildGrowthMoment`:
  khi xưởng trống, nó **ĐO** xem bản đồ có thật sự đổi gì không (gọi lại chính `deriveProps` /
  `deriveResidentCount` đang dựng thành phố, với `sessionCount` và `sessionCount − 1`) rồi mới nói.
  Đây là hướng **(d)** ở trên — nhưng KHÔNG rơi vào rủi ro đã ghi của (d) ("nhắc xưởng trống sau
  MỌI phiên còn tệ hơn im lặng"), vì nó chỉ mở miệng khi có một thay đổi CÓ THẬT để chỉ vào.

  | | phiên | tỉ lệ |
  |---|---|---|
  | Có lễ mừng xây/nâng cấp (như cũ) | 215 | 4,9 % |
  | **Có tin thật nhờ nhánh mới (mở đường)** | **660** | **14,9 %** |
  | Im lặng (chồng lấn chưa mô phỏng chung ⇒ khoảng) | ~3 565–3 780 | **80–85 %** |

  Cách đo, chạy lại được: `node --import ./scripts/register-esm-loader.mjs scripts/simulate-pacing.mjs`
  cho `eraEntryDays` thật (370 ngày × 12 phiên = **4 440** phiên); ghép với `buildGrowthMoment` chạy
  qua 200 phiên × 4 kỷ × 3 mức công trình.
  ⚠️ **HÌNH DẠNG CỦA VẤN ĐỀ KHÔNG ĐỔI — nó vẫn xấu dần theo kỷ, y hệt bảng gốc ở trên**: kỷ 1 nói
  được **92%** số phiên → kỷ 5: 37% → kỷ 10: 14% → **kỷ 15: 5%**. Lý do là cùng một cơ chế: mạng
  đường cố định **44 ô** (`ROAD_CELL_COUNT`) trong khi số phiên mỗi kỷ tăng từ 48 lên 840. Sau phiên
  thứ 44 của một kỷ thì **thành phố thật sự không còn gì để lớn**: đường hết ô, cư dân chạm trần
  `MAX_RESIDENTS = 28`, cảnh vật chạm trần `MAX_SCATTER_PROPS = 34` — cả ba đều là trần HIỆU NĂNG có
  lý do, không phải chỗ để nới bừa.

- **ĐO LẠI LẦN NỮA (2026-08-14, sau Phase 6C — đường vành đai)**. Phép đo ở trên chỉ ra rất rõ thủ
  phạm nên lần này đo thẳng vào nó: nhánh "xưởng trống" qua 200 phiên × 5 kỷ × 3 mức công trình.

  | mốc phiên trong kỷ | TRƯỚC 6C (44 ô đường) | SAU 6C (80 ô đường) |
  |---|---|---|
  | 1–44   | **100 %** | **100 %** |
  | 45–60  | 38 % | **100 %** |
  | 61–88  | 6 %  | **73 %** |
  | 89–120 | 3 %  | 3 % |
  | 121+   | **0 %** | **0 %** |
  | **tổng qua 200 phiên** | **26,3 %** | **40,7 %** |

  Cách đo, chạy lại được: gọi thẳng `buildGrowthMoment` với `newlyBuilt: []`, `scaffolds: []` (ca
  chiếm ~85% số phiên thật), cho `sessionCount` chạy 1→200.
  ⚠️ **ĐỌC CHO ĐÚNG ĐIỀU NÀY CHỨNG MINH**: vành đai **kéo dài** quãng "phiên nào cũng có gì đó mọc
  lên" từ phiên 44 lên phiên 80 — nó KHÔNG chữa được cái đuôi. Từ phiên 121 vẫn im lặng tuyệt đối,
  y như trước. Với kỷ 15 (840 phiên) thì 80 ô đường vẫn chỉ phủ 10% chặng đường. Nói cách khác:
  **6C mua thêm thời gian, không đổi hình dạng vấn đề** — câu hỏi CÓ/KHÔNG cho Đàm ở dưới vẫn
  nguyên vẹn, và đây vẫn là lý do mục này chưa đóng.
  ⚠️ **ĐÍNH CHÍNH**: con số nghiệm thu đầu tiên tôi ghi cho Phase 5D (*"55–69% tuỳ số công trình"*)
  là **ước lượng, sai**. Đo thật ra **55% phẳng lì ở cả 12 cấu hình**, và số công trình không hề
  tham gia. Đã sửa ở `BAN_GIAO.md`. Bài học đúng bằng bài học Phase 4C: *một con số nghiệm thu phải
  đi kèm CÔNG CỤ đã đo ra nó.*
- ⚠️ **SỐ HỌC PHŨ PHÀNG — đọc trước khi chọn bất kỳ hướng nào**: 4 428 phiên so với 420 bước xây.
  Muốn chỉ **một nửa** số phiên có lễ mừng thì cần khoảng **2 200 bước xây — gấp hơn 5 lần hiện
  tại**. **KHÔNG một tinh chỉnh nhỏ nào làm nổi điều đó.** Vì vậy câu hỏi đúng để hỏi Đàm KHÔNG
  phải "vá thế nào", mà là: **thành phố có nên là phần thưởng của TỪNG PHIÊN không, hay nó vốn là
  phần thưởng của CẢ THÁNG — còn phần thưởng từng phiên đã có hộp vật phẩm + XP + chuỗi ngày lo?**
  Nếu là vế sau thì #14 không phải lỗi, mà chỉ là một kỳ vọng đặt sai chỗ — và việc cần làm là
  chỉnh KỲ VỌNG (đừng đổ thêm công vào lễ mừng), chứ không phải chỉnh KINH TẾ.
- **Estimated Complexity**: (a) Trivial (đã loại) · (b) Medium · (c) — (đã loại, không dùng được)
  · (d) Low · (e) Low về mã / **Cao về rủi ro cân bằng**
- **Blocking Conditions**: ~~cần Đàm chọn hướng~~ → **ĐÃ CHỌN (b) ngày 2026-08-13.** Blocker còn
  lại nay là KỸ THUẬT chứ không phải quyết định: phải chọn giữa **(b1)** và **(b2)** ở trên rồi
  viết ADR mới, vì cả hai đều đụng vào bất biến bố cục của ADR-007.
- **Review Trigger**: trước bất kỳ đầu tư nào thêm vào lễ mừng / hiệu ứng thành phố — nếu chưa xử
  lý mục này thì khoản đầu tư đó chỉ chạm tới ~20% số phiên (trước Phase 5D là 5%).
- **Owner**: (chưa gán)
- **Status**: **Open — đã nhẹ đi nhưng CHƯA đóng.** Im lặng 95% → **80–85%** (Phase 4I mở đường
  trùng tu + Phase 5D nói thật khi bản đồ có đổi) → nhẹ thêm một nấc nữa sau **Phase 6C** (vành đai
  đưa mạng đường 44 → 80 ô: quãng "phiên nào cũng có gì đó mọc lên" kéo từ phiên 44 lên phiên 80,
  tỉ lệ nói-được qua 200 phiên đi từ 26,3% lên 40,7% — bảng đo đầy đủ ở trên). Phần còn lại **không
  sửa được bằng mã** theo hướng hiện tại: sau khi mạng đường mở hết, thành phố hết chỗ để lớn thật,
  nên mọi câu nói thêm sẽ là bịa. Vành đai chỉ dời cái mốc ấy ra xa, không xoá nó — với kỷ 15 (840
  phiên) thì 80 ô đường vẫn chỉ phủ 10% chặng đường. 👉 **Việc tiếp theo cần ĐÀM QUYẾT, không phải AI làm**: chấp nhận rằng thành phố là
  phần thưởng của CẢ THÁNG (⇒ đóng mục này, thôi đổ công vào lễ mừng), hay muốn nó là phần thưởng
  của TỪNG PHIÊN (⇒ phải nới trần lưới/cảnh vật hoặc đổi `sessionsToComplete` — đều là đổi cân bằng
  kinh tế, cần ADR). Phát hiện 2026-08-12 (Phase 3T) khi tự vấn "một màn hình nhàm đi sau bao nhiêu
  ngày lặp thì có mô phỏng được không". Câu trả lời hoá ra là CÓ: repo đã có sẵn
  `scripts/simulate-pacing.mjs` mô phỏng trọn 365 ngày mà chưa phiên AI nào dùng nó để soi trải
  nghiệm — nó xưa nay chỉ dùng để cân kinh tế.

---

## #13 — `useTimer.js` (1 100+ dòng, hot spot) có ĐÚNG 0 bài test — và tài liệu từng ghi ngược lại

- **Module**: `src/hooks/useTimer.js`
- **Priority**: **Medium-High**
- **Severity**: High
- **Impact**: `useTimer` là trái tim của app — đếm giờ, hoàn tất phiên, nghỉ tự động, khôi phục sau
  khi đóng tab, đồng bộ trạng thái tray. Nó gọi `commitCompletedSession` → `completeFocusSession`
  (God function, mục #1). **Không một dòng nào của nó được test bao phủ**: `find src/hooks -name
  '*.test.js'` = 0 file. Mọi thay đổi liên quan nhịp phiên (gồm cả mục #12) hiện đều là sửa mù.
- **Root Cause (hai tầng, tầng thứ hai mới là tầng nguy hiểm)**:
  (1) Hook React có nhiều tác dụng phụ theo thời gian ⇒ khó test bằng `node --test` thuần, nên bị
  hoãn nhiều lần.
  (2) ⚠️ **Tài liệu đã che mất khoản nợ này suốt nhiều tháng.** `BAN_GIAO.md` ghi ở mục "Đang dở"
  rằng đã có `src/hooks/useTimer.test.js` với "41 bài characterization test, **tất cả đều xanh**",
  chỉ vướng chuyện chưa nối vào `npm test`. Kiểm cạn kiệt ngày 2026-08-12:
  `git log --all --diff-filter=A -- '*useTimer.test.js'` **rỗng** ⇒ file chưa từng được commit ở
  bất kỳ đâu. Nó được viết trong một phiên chạy trên container tạm rồi mất khi container bị thu
  hồi. Hệ quả: mọi phiên AI đọc `BAN_GIAO.md` đều tin rằng "lưới đã có, chỉ cần cắm vào" — trong
  khi thực tế là **chưa có gì cả**. Chính phiên 2026-08-12 đã đề xuất "nối 41 bài test vào
  `npm test`" làm task ưu tiên số một trước khi phát hiện ra sự thật.
- **Current Risk**: trung bình-cao — mã đã chạy ổn định nhiều tháng nên rủi ro *tĩnh* thấp, nhưng
  rủi ro *khi sửa* thì cao và hiện đang chặn mục #12.
- **Future Risk**: cao — mọi điều chỉnh nhịp phiên về sau (gần như chắc chắn sẽ có, sau khi Đàm
  chạy phiên thật và phản hồi) đều đâm vào đúng chỗ không có lưới này.
- **Recommended Solution**: KHÔNG cố test cả hook một lượt. Làm theo đúng khuôn đã dùng thành công
  ở `syncService` (hàm thuần `shouldImportVersion` + `hasMeaningfulState` tách ra test riêng): rút
  các quyết định THUẦN ra khỏi hook rồi test chúng — đường nghỉ tự động là ứng viên số một
  (`shouldStartBreakAfterCompletion` đã thuần sẵn; độ trễ 500 ms nên thành hằng số có tên, đặt cạnh
  `MOMENT_MS`, kèm test khoá quan hệ giữa hai số đó). Bao phủ đủ để gỡ chặn #12 TRƯỚC, không cần
  characterization đầy đủ ngay.
- **Estimated Complexity**: Medium (phần thuần) · High (characterization đầy đủ cả hook)
- **Blocking Conditions**: không có blocker kỹ thuật — chỉ cần quyết định làm. Việc test hook React
  đầy đủ thì cần thêm công cụ render, nhưng phần THUẦN thì không cần gì thêm.
- **Review Trigger**: trước bất kỳ thay đổi hành vi nào của `useTimer`, gồm cả mục #12.
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện 2026-08-12 khi định thực hiện chính task "nối bộ test đã có" và
  phát hiện bộ test đó không tồn tại.

---

## #12 — ✅ [ĐÃ XỬ LÝ 2026-08-12] Lễ mừng bị TÍNH VÀO giờ nghỉ: nghỉ tự động chạy trước khi lễ mừng xong

> **Đã xử lý cùng ngày phát hiện (Phase 3Q)** bằng phương án (a): `BREAK_START_DELAY_MS` **500 →
> 3 200 ms**, phủ trọn lễ mừng. Bài test "NHỊP MỘT PHIÊN" (`timerSession.test.js`) đổi từ *chốt mức
> nợ* sang khẳng định **bất biến thật**: `BREAK_START_DELAY_MS >= GROWTH_MOMENT_MS`. Đã chứng minh
> ĐỎ theo CẢ HAI chiều hồi quy: hạ độ trễ về 500 ⇒ đỏ; kéo lễ mừng lên 5 000 mà quên chỉnh độ trễ
> ⇒ cũng đỏ.
> **Đánh đổi đã chấp nhận**: phiên KHÔNG có lễ mừng nay cũng chờ 3,2 s mới vào nghỉ — chấp nhận
> được vì cả hai trường hợp người dùng đều đang nhìn hộp phần thưởng chứ không nhìn đồng hồ, và vì
> lệch về phía "được nghỉ đủ" an toàn hơn lệch về phía "bị ăn bớt".
> Phương án (b) (tầng hiển thị phát tín hiệu "lễ mừng xong") KHÔNG làm — nó đúng hơn về ngữ nghĩa
> nhưng tạo coupling đồng hồ ↔ thành phố, đắt hơn nhiều, để đổi lấy vài trăm mili-giây.
> Giữ nguyên mục này (không xoá) để phiên sau hiểu vì sao độ trễ là 3 200 chứ không phải 500.

**Nội dung gốc lúc phát hiện:**


- **Module**: `src/hooks/useTimer.js` (2 chỗ: dòng ~610 và ~1089) ↔ `src/components/city/CityGrowthMoment.jsx` (`MOMENT_MS`) ↔ `src/App.jsx` (`RewardSequence`)
- **Priority**: Medium
- **Severity**: Low-Medium
- **Impact**: Với cấu hình MẶC ĐỊNH (`autoStartBreak: true`, `settingsStore.js:92`), phiên nghỉ bắt
  đầu đếm sau **500 ms**, trong khi lễ mừng "thành phố lớn lên" chạy **3 200 ms** và hộp thoại phần
  thưởng chỉ hiện ra SAU đó. Nghĩa là đồng hồ nghỉ đã chạy **2 700 ms trước khi lễ mừng kết thúc**,
  rồi tiếp tục chạy suốt lúc Đàm đọc hộp phần thưởng. Tổng thiệt hại thực tế ~8–18 giây trên một
  phiên nghỉ 5 phút (~3–6%).
  Vấn đề KHÔNG nằm ở con số đó mà ở ý nghĩa: **phần thưởng của việc đã làm xong đang bị trừ vào
  thời gian nghỉ.** Lễ mừng lẽ ra là tiền công, không phải khoản Đàm tự trả.
- **Root Cause**: Phase 4′ cắm lễ mừng vào TẦNG HIỂN THỊ (`App.jsx`) — đúng theo thiết kế, để không
  phải sửa store và không phá 3 bài test đang khẳng định `lootModalOpen` bật đồng bộ. Nhưng
  `useTimer` thì không hề biết tầng hiển thị đang chạy một lễ mừng, nên nó vẫn hẹn giờ 500 ms như
  thời chưa có lễ mừng. Độ trễ 500 ms đó có từ TRƯỚC Phase 4′ và chưa ai chỉnh lại cho khớp.
- **Current Risk**: thấp — không mất dữ liệu, không sai số liệu thống kê (phiên nghỉ vẫn được ghi
  đúng độ dài của nó), chỉ là Đàm được nghỉ ít hơn vài giây so với ý định.
- **Future Risk**: trung bình — nếu lễ mừng dài thêm (hoặc thêm màn khác chen vào giữa: mở khoá kỷ
  mới, thành tích…), phần bị trừ sẽ lớn dần mà không có gì cảnh báo. Không có bài test nào canh
  quan hệ giữa `MOMENT_MS` và độ trễ 500 ms, nên nó sẽ trôi âm thầm.
- **Recommended Solution**: KHÔNG nên nối thẳng `useTimer` vào tầng thành phố (sẽ tạo coupling đúng
  thứ mà kiến trúc Phase 4′ cố tránh). Hai hướng sạch hơn:
  (a) đưa độ trễ ra thành hằng số dùng chung, đặt `≥ MOMENT_MS`, kèm bài test khoá
  `delay >= MOMENT_MS` — rẻ nhất, nhưng làm chậm cả trường hợp KHÔNG có lễ mừng (lễ mừng chỉ chạy
  khi thật sự có công trình tiến triển);
  (b) để tầng hiển thị phát một tín hiệu "lễ mừng xong" mà `useTimer` chờ, có timeout dự phòng —
  đúng hơn về ngữ nghĩa, nhưng đắt hơn và đụng vào hot spot.
  Cần Đàm quyết vì đây là thay đổi HÀNH VI đồng hồ trên app production, không phải sửa lỗi hiển thị.
- **Estimated Complexity**: (a) thấp · (b) trung bình
- **Blocking Conditions**: `useTimer.js` là hot spot (`CLAUDE.md`) và **hiện có ĐÚNG 0 bài test**
  (xem mục #13 — bản ghi cũ nói có "41 bài đã xanh, chỉ chưa nối vào `npm test`" là SAI, file chưa
  từng tồn tại). Sửa hành vi đồng hồ lúc này là sửa mà **hoàn toàn không có lưới**, chứ không phải
  "có lưới nhưng chưa cắm". ⇒ Điều kiện gỡ chặn nay là **viết** test bao phủ đường nghỉ tự động
  (mục #13), không phải "nối" gì cả.
- **Review Trigger**: khi Đàm phản hồi về nhịp một phiên thật; hoặc khi lễ mừng/`MOMENT_MS` đổi;
  hoặc khi thêm bất kỳ màn nào chen giữa "phiên xong" và "bắt đầu nghỉ".
  ✅ **Đã có hàng rào tự động (2026-08-12)**: hai con số nay có TÊN và nằm ở tầng thuần
  (`GROWTH_MOMENT_MS` ở `engine/cityMoment.js`, `BREAK_START_DELAY_MS` ở `engine/timerSession.js`),
  kèm bài test "NHỊP MỘT PHIÊN" ở `timerSession.test.js` **CHỐT khoảng lệch ở mức 2 700 ms**. Nợ
  chưa trả, nhưng nay **không thể âm thầm phình to**: kéo dài lễ mừng hay rút ngắn độ trễ đều làm
  bài test ĐỎ và buộc người sửa đọc mục này trước. (Đã chứng minh: nâng lễ mừng lên 5 000 ms ⇒ đỏ.)
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện 2026-08-12 khi rà lại mục "nhịp phiên" của `/goal`. Chưa xử lý vì là
  thay đổi hành vi đồng hồ production + đang thiếu lưới test (xem Blocking Conditions).

---

## #11 — ✅ [ĐÃ XỬ LÝ] Theme TỐI: bầu trời gần như đen ở MỌI giờ, kể cả giữa trưa

- **Module**: `src/engine/city3d/palette3d.js` (độ đậm nhánh `isDark` của `horizon` và `sky2.top`)
- **Priority**: Medium
- **Severity**: Medium (thẩm mỹ, không phải lỗi chức năng — thành phố vẫn đọc được)
- **Impact**: ở theme tối, chân trời có độ đậm 0,27 và đỉnh trời 0,17 **bất kể giờ nào**. Ảnh chụp
  lúc 12 giờ trưa ở theme tối cho ra một bầu trời gần như đen, nhìn không khác gì lúc nửa đêm — tức
  là với người dùng theme tối, cả tính năng "thành phố đổi theo giờ" của Phase 3D mất phần lớn tác
  dụng ở BẦU TRỜI (mặt đất và ánh nắng vẫn đổi đúng).
- **Root Cause**: hai con số này có từ Phase 3C, thời điểm chưa có khái niệm "giờ trong ngày" —
  lúc đó "theme tối" ngầm hiểu là "cảnh chạng vạng", nên để trời tối là hợp lý. Phase 3D tách hai
  khái niệm ra (`nightByClock` ≠ `isDark`) nhưng CHỈ tách ở phần bảng màu vật liệu; độ đậm bầu trời
  vẫn còn dính vào theme.
- **Current Risk**: thấp — chỉ ảnh hưởng thẩm mỹ, và chưa rõ Đàm có dùng theme tối cho tab Thành
  Phố hay không.
- **Future Risk**: thấp, không tăng theo thời gian.
- **Recommended Solution**: cho độ đậm bầu trời phụ thuộc vào CHẶNG TRONG NGÀY thay vì vào theme
  (ví dụ thêm một trường `skyLightness` vào `DAYLIGHT_PROFILES`), giữ theme chỉ còn quyết định độ
  tươi và sắc nền. ⚠️ Đổi sẽ làm mọi ảnh chụp theme tối đã duyệt ở Phase 3C khác đi ⇒ phải chụp
  lại và soi đủ 6 chặng trước khi nhận.
- **Estimated Complexity**: Thấp về code, Trung bình về hiệu chỉnh mỹ thuật (phải soi ảnh lại).
- **Blocking Conditions**: không có. Cố ý KHÔNG sửa trong Phase 3D để commit này chỉ chứa đúng một
  chủ đề và rollback được độc lập — đúng quy tắc commit ở `CLAUDE.md`.
- **Review Trigger**: khi Đàm phản hồi về theme tối, hoặc lần sau có ai chỉnh bảng màu bầu trời.
- **Owner**: (chưa gán)
- **Status**: ✅ **ĐÃ XỬ LÝ 2026-08-12 (Phase 3G)** — và hoá ra vấn đề RỘNG HƠN mục này mô tả.
  Bản quét đủ 15 kỷ × 6 chặng cho thấy không chỉ bầu trời tối, mà **cả cảnh** ở theme tối đều tối
  như nửa đêm vào giữa trưa (mặt đất, tường, mái — tất cả đều đi theo nhánh `isDark`).
  - **Cách sửa KHÁC với "Recommended Solution" ở trên, và cố ý.** Đề xuất cũ là thêm một trường
    `skyLightness` vào hồ sơ chặng — tức chữa đúng cái triệu chứng đã ghi (bầu trời), và bỏ sót
    mặt đất/tường/mái vốn cùng gốc. Bản vá thật đánh vào gốc: đổi ý nghĩa của chính `isDark`.
    Có `daylight` ⇒ **đồng hồ quyết định**, không phải theme; không có `daylight` (bảo tàng, các
    chỗ gọi cũ) ⇒ vẫn theo theme y như trước, nên không chỗ nào đang chạy bị đổi kết quả.
  - **Nguyên tắc rút ra**: *thành phố là một Ô CỬA SỔ.* Cảnh nhìn qua cửa sổ không tối đi vì ta sơn
    tường phòng màu đen. Theme quyết định KHUNG cửa (nền thẻ, viền, lớp tối góc — vẫn giữ nguyên),
    đồng hồ quyết định độ sáng BÊN TRONG khung.
  - **Khoá bằng test**: `palette3d.test.js` → "THÀNH PHỐ LÀ Ô CỬA SỔ: để theme tối thì giữa trưa
    vẫn phải sáng như giữa trưa" (đã xác minh bài này ĐỎ trên code cũ).
  - Đã chụp lại đủ 15 kỷ × 6 chặng × 2 theme và soi bằng mắt trước khi nhận, đúng cảnh báo ở trên.

---

## #10 — ✅ [ĐÃ XỬ LÝ] Glob test chỉ quét MỘT cấp: test đặt trong thư mục con sẽ im lặng không bao giờ chạy

- **Module**: `package.json` (script `test`)
- **Priority**: Low-Medium
- **Severity**: Medium
- **Impact**: câu lệnh test liệt kê tay từng thư mục và mỗi mục chỉ có `*.test.js` — **một cấp**
  (vd `src/components/*.test.js`). Một file test đặt trong thư mục con (`src/components/city/`,
  `src/components/city/render2d/`, `src/components/icons/`, `src/components/shared/`) sẽ **không
  bao giờ được chạy, mà cũng không báo lỗi gì**. Đây là loại hỏng nguy hiểm hơn test đỏ: nó tạo
  cảm giác an toàn giả — người viết tin là có lưới, thực tế không có. Hiện chưa có file test nào
  rơi vào bẫy này (đã kiểm), nhưng số thư mục con trong `src/components/` đang tăng.
- **Root Cause**: glob viết tay, thêm dần theo từng lần có thư mục mới; POSIX `sh` không có
  `globstar` nên `**` không mở rộng đệ quy như trực giác — `src/components/**/*.test.js` thực chất
  chỉ ra đúng MỘT cấp con và sẽ **làm mất** các test đang chạy ở cấp trên.
- **Current Risk**: thấp — chưa file nào bị bỏ sót. Đã né tạm bằng cách đặt
  `src/components/cityRenderers.test.js` ở cấp trên (kèm chú thích giải thích vì sao nó không nằm
  cạnh thứ nó kiểm tra).
- **Future Risk**: trung bình và tăng dần. Kế hoạch Thành Phố 3D sẽ thêm `city/render3d/` cùng
  nhiều module con; đặt test cạnh file nguồn là **quy ước chính thức của dự án**
  (`PROJECT_STRUCTURE.md`), nên khả năng ai đó làm đúng quy ước rồi mất test là có thật.
- **Recommended Solution**: hai hướng, ưu tiên hướng (b) vì không đụng vào bộ chạy test.
  (a) Đổi sang `node --test --test-... 'src/**/*.test.js'` với glob do CHÍNH node mở rộng (đặt
  trong dấu nháy để `sh` không đụng vào) — gọn nhưng phải kiểm lại kỹ danh sách file thực tế được
  chọn, vì đây là đường sống của mọi lưới an toàn.
  (b) Thêm một bài test tự canh: quét mọi `*.test.js` trong `src/` + `api/` rồi khẳng định mỗi file
  đều khớp ít nhất một mẫu trong glob của `package.json` — sai là đỏ ngay, không cần đổi bộ chạy.
- **Estimated Complexity**: Thấp.
- **Blocking Conditions**: không có.
- **Review Trigger**: (đã kích hoạt ngay trong ngày — xem Status).
- **Owner**: (chưa gán)
- **Status**: ✅ **RESOLVED 2026-08-12**, cùng ngày phát hiện. "Review Trigger" ghi ở trên nổ ngay
  ở Phase 3A: cần đặt test cạnh `src/engine/city3d/` và `city/render3d/`, tức phải né glob một lần
  nữa hoặc sửa dứt điểm. Đã chọn sửa dứt điểm bằng **hướng (a)**, sau khi chứng minh nó an toàn:
  glob nay là `'electron/**/*.test.js' 'src/**/*.test.js' 'api/**/*.test.js'` — **đặt trong dấu
  nháy đơn để `sh` KHÔNG đụng vào**, để chính `node --test` mở rộng (node hiểu `**` đệ quy thật,
  POSIX `sh` thì không). Trước khi đổi đã đối chiếu **tập hợp file** của glob cũ và glob mới bằng
  `fs.globSync`: **31 file, giống hệt nhau, 0 mất 0 thêm**, và `npm test` giữ nguyên 315 bài — nên
  đây là thay thế tương đương chứng minh được, không phải đổi liều. Từ nay đặt test cạnh file
  nguồn ở BẤT KỲ độ sâu nào cũng chạy, đúng quy ước chính thức ở `PROJECT_STRUCTURE.md`.
  ⚠️ Ràng buộc còn lại: cú pháp nháy đơn này cần shell kiểu POSIX (Mac/Linux — đúng môi trường dự
  án); chạy `npm test` từ `cmd.exe` của Windows sẽ không mở rộng đúng.

---

## #30 — ✅ [ĐÃ XỬ LÝ 2026-08-16, Phase 9D] Mặt đường render ra DƯỚI ngưỡng mắt đọc được, xét riêng vật liệu (kỷ 11 · 13 · 10 · 3)

> **ĐÃ ĐÓNG CÙNG #27 — hai mục là một bài toán, đúng như hai mục này đã tự nối cứng với nhau.**
> Nguyên nhân gốc KHÔNG phải con số `roadColor` của một kỷ nào, mà là: **màu là trục DUY NHẤT mang
> bản sắc mặt đường**, nên toàn bộ sức ép "15 kỷ phải khác nhau" dồn vào ĐỘ ĐẬM — và độ đậm có đáy.
> Phase 9D mở thêm chín trục (`src/engine/city3d/streetStyle.js`: bề rộng đại lộ · bề rộng ngõ ·
> vật liệu lát · cỡ viên · độ mòn · bó vỉa · vỉa hè · vạch kẻ · kiểu mép) và cho phép đẩy độ đậm
> **bão hoà** (`roadContrastGap`: sàn 0,13 · trần 0,26 · vẫn đơn điệu ngặt).
>
> **Nghiệm thu, đo trên ảnh dựng thật, `--no-shadow`, 4 kỷ × 3 giờ = 12 tổ hợp** (công cụ
> `scripts/road-score.mjs`, mặt nạ do chính bên dựng cấp qua `city-preview.mjs --mask road,ground`):
> **12/12 ĐẠT**. Khoảng cách đường↔đất xấu nhất **0,061** (kỷ 11, 22h — ngưỡng mắt 0,05, biên 23%);
> "hố" sâu nhất **0,202** (kỷ 3, 12h — trần 0,26, biên 22%). So với con số mở mục này: kỷ 11 từ
> **0,113 trên nền đất 0,406** nay là **0,302 trên nền 0,495**.
>
> ⚠️ **Kèm một phát hiện ngoài dự kiến, đã sửa**: kỷ 7 lấy `roadColor` từ **pietraforte** — đá XÂY
> TƯỜNG của Palazzo Vecchio — trong khi Firenze LÁT đường bằng **pietra serena** (xám-xanh). Đá ấy
> cùng họ màu với nền đất ấm của kỷ 7, nên con đường chỉ còn độ sáng để tách khỏi đất, mà độ sáng
> thì đang ở đúng sàn: đo được **0,050 lúc 12h và 0,019 lúc 22h**, dưới ngưỡng mắt. Sửa sang đúng
> vật liệu lịch sử ⇒ **0,200 / 0,191 / 0,198**. Đây là chính bệnh của cả Phase 9D, thu nhỏ vào một
> kỷ: một trục (sáng) phải gánh việc của hai (sáng + sắc).

- **Module**: `src/engine/city3d/palette3d.js` (luật `roadL`), đo ở Phase 9B
- **Priority**: Medium-High
- **Severity**: Medium
- **Impact**: đo trên ảnh dựng thật kỷ 11 lúc 15 giờ, **đã TẮT HẲN `sun.castShadow`** để tách vật
  liệu khỏi ánh sáng: mặt đất sáng **0,406**, còn ngõ phố **0,113** — tức nằm DƯỚI ngưỡng 0,12 mà
  mắt còn đọc ra chi tiết, trước khi bóng đổ chạm vào. Trên ảnh, mạng đường đọc ra thành những
  RÃNH ĐEN cắt qua thành phố chứ không phải phố xá. Phép thử ngược: trong 11,1% khung hình bị
  nghiền của kỷ 11, **9,6 điểm phần trăm vẫn còn nguyên khi tắt sạch bóng đổ** ⇒ phần lớn mảng đen
  của kỷ này là MẶT ĐƯỜNG, không phải bóng. Đây chính là chữ *"mảng đen … tuyệt đối"* trong yêu
  cầu của Đàm, ở dạng literal nhất của nó.
- **Root Cause**: `ROAD_MIN_CONTRAST` (0,13) mang nghĩa *"đường và đất phải cách nhau ÍT NHẤT
  chừng này"*, nhưng nó được **CỘNG THÊM** vào phần chênh lệch riêng của vật liệu chứ không làm
  SÀN cho tổng: `roadL = groundL ± (MIN + |off| × SPAN)`. Vật liệu nào vốn đã xa mức trung tính
  thì bị đẩy HAI LẦN. Nhựa đường kỷ 11 (`#3a3b3e`, cách trung tính 0,265) nhận tổng đẩy **0,289**
  — lớn hơn cả chênh lệch của chính nó — và **không có gì chặn lại**. Luật có SÀN mà không có TRẦN;
  chưa ai từng hỏi *"đẩy xa bao nhiêu thì là quá xa?"*.
- **Current Risk**: trung bình. Ảnh hưởng rõ nhất ở 4 kỷ hiện đại/tối (11, 13, 10, 3) — đúng nửa
  sau hành trình, tức phần Đàm sẽ ở lại lâu nhất.
- **Future Risk**: mỗi lần ai đó làm mặt đất SÁNG lên, mặt đường tự động chìm sâu thêm đúng bằng
  chừng ấy, vĩnh viễn, và không có gì đỏ lên (bài test hiện chỉ canh khoảng cách TỐI THIỂU giữa
  đường và đất — nó canh "đủ khác nhau", không canh "đủ sáng để nhìn ra").
- **Recommended Solution**: ĐÃ VIẾT VÀ ĐÃ ĐO XONG, chỉ chưa ship — thay phép đẩy vô hạn bằng phép
  **đẩy BÃO HOÀ**, có cả sàn lẫn trần mà vẫn đơn điệu ngặt:
  `gap = MIN + (MAX − MIN) × (1 − exp(−|off| × SPAN / (MAX − MIN)))`, với `MAX = 0.26`.
  Kết quả đo đủ 15 kỷ: kỷ 11 đại lộ 0,243 → **0,309** (+27%), ngõ 0,208 → **0,266** (+28%); các kỷ
  sáng gần như không nhúc nhích; **thứ tự 15 kỷ giữ nguyên tuyệt đối**. ⚠️ KHÔNG được sửa bằng
  `Math.max(MIN, …)` (phá thứ tự — đúng phép KẸP mà Phase 7D đã phải gỡ) và cũng không nên chỉ hạ
  `ROAD_SPAN` (bóp đều cả 15 kỷ, kể cả những kỷ đang đúng). Luật cũ là **trường hợp giới hạn** của
  công thức trên khi `MAX → ∞`, nên có thể dò dần rất an toàn.
- **⚠️ BỊ CHẶN BỞI #27, VÀ ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CỦA MỤC NÀY**: bản vá trên **làm ĐỎ** bài
  `15 KỶ RA 15 MẶT ĐƯỜNG` (`palette3d.test.js`) — cặp 3↔10 ban đêm tụt từ 10,3 xuống **7,9**, dưới
  ngưỡng 10. Đo tiếp thì thấy điều đáng nói hơn nhiều: **kể cả khi nới trần tới 0,46 (gần như không
  bão hoà nữa) cặp ấy cũng chỉ lên được 9,8** — tức lời hứa "15 kỷ ra 15 mặt đường" xưa nay **chỉ
  đạt nhờ 3% biên** (10,3 so với ngưỡng 10), và nó đạt được **chính nhờ cái khuyết tật này**: phép
  đẩy vô hạn đang thổi phồng khác biệt ở đầu tối. Gỡ khuyết tật thì lời hứa mất theo.
  ⇒ **#27 và #30 nay là MỘT cặp, phải làm cùng nhau.** Và phương án "chấp nhận vĩnh viễn" mà #27
  đề xuất KHÔNG còn dùng được nữa: chấp nhận #27 nghĩa là giữ #30. Muốn cả hai thì phải tách 15 kỷ
  bằng thứ KHÔNG phải độ đậm — vạch kẻ, bề rộng làn, vỉa hè (tức hình học, đúng như #27 đã gợi ý).
- **Estimated Complexity**: thấp cho riêng công thức (một hàm thuần, đã viết + đã đo); trung bình
  nếu làm trọn gói cùng #27.
- **Blocking Conditions**: #27 (xem trên)
- **Review Trigger**: khi bắt tay vào #27, hoặc khi Đàm nói đường trông như rãnh đen
- **Owner**: phiên AI kế tiếp · **Status**: Open (đã đo đủ, có bản vá, CỐ Ý chưa ship vì sẽ phải
  nới một lời hứa đang có — xem `CLAUDE.md` mục cấm nới ngưỡng cho tiện)

---

## #28 — ✅ [ĐÃ XỬ LÝ 2026-08-15] Mặt đất vẫn là bàn cờ ô vuông phẳng

- **Module**: `src/components/city/render3d/geometryFactory.js` (cạnh) + `sceneGraph.js` (ô nền),
  phát hiện bằng ảnh chụp ở Phase 8A
- **Priority**: Medium-High
- **Severity**: Medium
- **Impact**: ~~(a) **Cạnh sắc**~~ → **ĐÃ ĐÓNG ở Phase 8B** (`bevelWidth` + ba vành mặt bên; ×1,24
  tam giác, 3,8% khung hình đổi đủ để mắt thấy — xem ADR-018). Còn lại:
  (b) **Bàn cờ**: nhìn ảnh kỷ 7 ở khoảng cách thường thấy rõ mặt đất là 144 ô vuông phẳng, mỗi ô
  một sắc độ hơi khác — đúng thứ Đàm gọi là *"grid 12×12 với object đặt trong từng ô"*. ⚠️ Mặt đất
  **không** đi qua `geometryFactory` (nó là `InstancedMesh` riêng ở `sceneGraph.js`), nên cạnh vát
  của Phase 8B **không chạm tới nó** — đừng tưởng vát cạnh đã sửa luôn phần này.
- **Root Cause**: ô nền là `InstancedMesh` của một khối hộp — rẻ và đúng lúc mặt đất còn phẳng,
  nhưng Phase 7B đã cho mặt đất cao độ mà ô nền vẫn giữ nguyên cách dựng cũ.
- **Current Risk**: thấp về kỹ thuật (không có gì hỏng), cao về mục tiêu — đây chính là điều Đàm
  đang phàn nàn, và Definition of Done của anh nói rõ *"nếu câu trả lời vẫn là pixel / blocky /
  low-poly / flat, hãy tiếp tục sửa nền tảng thay vì đánh dấu phase hoàn thành"*.
- **Future Risk**: gộp 144 ô thành một lưới liền có cao độ sẽ làm ô nền hết là `InstancedMesh` —
  phải cân lại lệnh vẽ. Ngược lại, để nguyên thì mọi công sức làm mặt đất và ánh sáng vẫn bị một
  lưới ô vuông đè lên trên.
- **Recommended Solution**: gộp mặt đất thành một lưới liền (mỗi ô 2 tam giác nhưng dùng chung
  đỉnh ở mép) hoặc phá nhịp ô vuông bằng biến thiên cao độ/màu trong từng ô. Đo lệnh vẽ trước–sau.
- **Estimated Complexity**: trung bình
- **Blocking Conditions**: không có blocker cứng. Nhưng cần đo cổng hiệu năng (#23/#26) để biết còn
  bao nhiêu chỗ trống thật.
- **Review Trigger**: khi quay lại mảng "thành phố phải có quy mô" trong chỉ thị của Đàm
- **Owner**: chưa gán
- **Status**: ✅ **ĐÃ ĐÓNG CẢ HAI PHẦN.** (a) cạnh sắc → Phase 8B (ADR-018). (b) bàn cờ → **Phase
  8C** (ADR-019): mặt đất và mặt đường mỗi thứ là MỘT tấm lưới liền lấy mẫu từ `surfaceHeightAt`
  (`render3d/terrainMesh.js`), thay cho 144 + ~52 khối hộp. Dữ liệu thềm bậc **không đổi một con
  số** — chỉ cách vẽ đổi, đúng như Đàm cho phép (*"giữ data/progression nhưng thay đổi cách render"*).
  - **Đã trả lời câu hỏi "Future Risk" ở trên bằng số đo**: lệnh vẽ **KHÔNG đổi** (2 trước, 2 sau —
    tấm liền cũng chỉ là 1 lệnh vẽ như `InstancedMesh`). Tam giác thì có: địa hình **2.330 → 7.130**
    (6.498 đất + ~630 đường), tức +4.800 = **+8% ngân sách**; cả cảnh ~29.000 → **~36.100 = 60%**
    của trần 60.000. Đây là khoản chi lớn nhất từ đầu mảng 8 và nó **chưa được đo trên iPhone thật**
    — xem #23/#26, nay gấp hơn một bậc.
  - **Đi kèm**: `terrain.js` thêm `smoothHeightAt`/`surfaceHeightAt`/`tintAt` + vùng đất thoải
    (`APRON_*`) để mép lưới thôi là một hình vuông sắc lẹm; mặt đất thêm hai tầng biến thiên (vết
    loang tần số ~2,9 ô + sườn dốc lộ đất). 11 bài test mới, tất cả đã thử ngược.

---

## #27 — ✅ [ĐÃ XỬ LÝ 2026-08-16, Phase 9D] Ba cặp kỷ có mặt đường gần trùng nhau VÀO BAN ĐÊM (ban ngày thì không)

> **ĐÃ ĐÓNG CÙNG #30 — và đóng bằng cách BỎ HẲN câu hỏi cũ, không phải bằng cách kéo con số lên.**
>
> Mục này đo bản sắc mặt đường bằng **khoảng cách RGB**. Sau khi #30 được vá (phép đẩy độ đậm có
> trần), bài test `15 KỶ RA 15 MẶT ĐƯỜNG` ĐỎ ở cặp **11↔13 (7,9)** — và nó đỏ **một cách đúng đắn**:
> kỷ 11 là lưới Manhattan, kỷ 13 là phố Nhật, **cả hai đều lát NHỰA ĐƯỜNG**. Nhựa đường ở New York
> và ở Tokyo là cùng một vật liệu, nên chúng gần nhau về màu là sự thật vật lý; ép hai con đường
> nhựa ra hai màu khác nhau để một con số đẹp lên mới là nói dối. Đàm nói thẳng ở Phase 9D:
> *"không nới threshold và không giả màu — hãy thay metric RGB bằng đặc trưng structural thực sự."*
>
> ⇒ Phép đo bản sắc chuyển sang **8 trục CẤU TRÚC** (`src/engine/city3d/streetStyle.test.js`), mỗi
> trục lượng hoá về thứ mắt thật sự đọc được, suy từ hai phép đo đã có (một ô ≈ 64 điểm ảnh; ngưỡng
> mắt 12/255) chứ không từ ba hằng số chọn tay. Kết quả trên **cả 105 cặp**: cặp yếu nhất khác nhau
> **3/8 trục**, trung vị **6/8**, không cặp nào dưới 3; **kỷ liền nhau** yếu nhất cũng 3/8.
> Kèm **hai bài đối chứng**: một thế giới 15 kỷ giống hệt nhau (phải ra 0 trục) và một thế giới 15 kỷ
> chỉ chênh nhau 0,001 ô ≈ 0,06 điểm ảnh (sàn 3 trục phải TỪ CHỐI) — để ngưỡng không bị nới dần.
>
> Tầng bảng màu giữ lại đúng hai lời hứa mà **màu** thật sự chịu trách nhiệm được: bảng không dẹt
> (trung vị 105 cặp ≥ 90; đo được 116,4 lúc 12h và 115,9 lúc 22h) và không hai kỷ nào ra ĐÚNG cùng
> một mã màu. Cộng thêm một bài canh chiều ngược: **cặp gần nhau nhất về màu PHẢI là hai kỷ dùng
> chung vật liệu** — nếu một ngày gạch nung và nhựa đường ra cùng màu thì lúc đó bảng màu mới có lỗi.

- **Module**: `src/engine/city3d/eraStyle.js` (`roadColor` 15 kỷ), phát hiện + đo ở Phase 7D
- **Priority**: Low
- **Severity**: Low
- **Impact**: đo 105 cặp kỷ trên bảng màu mặt đường. **Ban ngày: 0 cặp** dưới ngưỡng nhìn-thấy-
  khác-nhau (cặp gần nhất 12,4 · trung vị 116,4). **Ban đêm: 3 cặp** — kỷ 3↔10 = 10,3 · 10↔13 =
  10,3 · 1↔5 = 10,9 (trung vị 116,6). Không cặp nào là hai kỷ LIỀN NHAU (cách nhau lần lượt 7, 3
  và 4 kỷ), nên Đàm gần như không bao giờ nhìn hai cái cạnh nhau.
- **Root Cause**: hai tầng cộng lại. (a) Vật liệu thật sự CÓ trùng họ — nhựa đường Babylon và
  macadam ám bồ hóng Manchester đều là mặt tối gốc hắc ín; ép chúng khác nhau là bịa ra một khác
  biệt không có ngoài đời, đúng thứ luật `country`/`landmark` ở `eraStyle.js` cấm. (b) Ban đêm bảng
  màu hạ độ tươi 20% (hiệu ứng Purkinje), mà độ tươi chính là chỗ ba cặp này khác nhau — nên chúng
  chỉ chụm lại khi trời tối.
- **Current Risk**: rất thấp. Ba cặp trên tổng 105, đều cách nhau ≥3 kỷ, và chỉ vào ban đêm.
- **Future Risk**: nếu sau này có ai hạ độ tươi ban đêm sâu hơn nữa (về 0,6 như mặt đất), số cặp
  trùng ban đêm nhảy từ 3 lên 7 — đã đo. Bài test `palette3d.test.js` canh cực tiểu ≥ 10 và trung
  vị ≥ 90 nên nó sẽ ĐỎ, không trôi ngầm.
- **Recommended Solution**: đừng chỉnh mã màu để chạy theo con số — ba lần thử ở Phase 7D đều
  chỉ ĐỔI CHỖ vấn đề (kéo kỷ 12 ra khỏi 13 thì nó dính vào kỷ 5). Nếu muốn tách thật thì tách
  bằng thứ KHÔNG phải màu: bề rộng làn, vạch kẻ đường, hoặc vỉa hè — tức hình học, thuộc một
  phase sau. Cũng có thể chấp nhận vĩnh viễn: đường Manchester và đường Babylon giống nhau là
  một sự thật, không phải một lỗi.
- **Estimated Complexity**: trung bình (nếu chọn tách bằng hình học); bằng 0 nếu chấp nhận
- **Blocking Conditions**: lưới 12×12 đã đầy (80 ô đường · 34 ô kỳ quan · 30 ô nhà dân = 144),
  nên thêm chi tiết đường phải làm trong CÙNG ô, không được cấp ô mới
- **Review Trigger**: khi làm bước "Historical Architecture", hoặc nếu Đàm nói hai kỷ nào đó có
  đường giống nhau
- **⚠️ CẬP NHẬT 2026-08-15 (Phase 9B) — MỤC NÀY NAY BỊ NỐI CỨNG VỚI #30**: phương án "chấp nhận
  vĩnh viễn" ở trên **không còn dùng được**. Ba cặp này chỉ đạt ngưỡng 10 nhờ đúng cái khuyết tật
  mà #30 phải sửa (phép đẩy độ đậm KHÔNG CÓ TRẦN đang thổi phồng khác biệt ở đầu tối). Bản vá của
  #30 kéo cặp 3↔10 xuống 7,9; nới trần tới mức gần như không bão hoà cũng chỉ lên 9,8. ⇒ chấp
  nhận #27 = giữ #30 (mặt đường đen dưới ngưỡng nhìn). Hai mục phải làm CÙNG NHAU, và lối ra
  nằm ở gợi ý sẵn có ngay trên: tách bằng HÌNH HỌC chứ không bằng độ đậm.
- **Owner**: phiên AI kế tiếp · **Status**: Open (đã đo đủ, có chủ đích chưa xử lý)

---

## #25 — Nhà dân NHỎ NHẤT ở 3 kỷ không có lấy một ô cửa sổ nào (là hộp trơn đội mái)

- **Module**: `src/engine/city3d/buildingSpec.js` (`emitWindows`), phát hiện ở Phase 7C
- **Priority**: Low
- **Severity**: Low
- **Impact**: `emitWindows` bỏ qua mọi mảng nhà cao dưới `0.3` đơn vị. Với 5 công trình kỳ quan thì
  ngưỡng ấy chưa bao giờ chạm tới; với nhà dân cỡ **nhỏ** thì nó chạm ở **kỷ 3, 6 và 8** — những căn
  ấy dựng ra là hộp trơn đội mái, không một ô cửa. Đo bằng `buildBuildingSpec({type:'house',
  rarity:'common'})`: 3 kỷ này có 0 khối vai `glass`. (Kỷ 1 và 2 cũng không có cửa sổ nhưng đó là
  **đúng** — `windows: 'none'`, lều da thú và nhà vách đất thật sự không có cửa sổ.)
- **Root Cause**: ngưỡng `height < 0.3` là một số TUYỆT ĐỐI áp lên những khối chênh nhau nhiều lần —
  đúng cùng một hình dạng sai với `eaves` mà Phase 7C vừa vá bằng `eaveOverhang`. Lần này chưa vá
  vì chưa đo được là ở cỡ hiển thị thật (một cửa sổ nhà dân rộng ~4 điểm ảnh) thì thêm cửa sổ có
  làm mặt tiền đẹp hơn hay chỉ thành một vệt bẩn.
- **Current Risk**: thấp — chỉ ảnh hưởng căn nhỏ nhất ở 3/15 kỷ, và chúng nằm ở ngoại vi.
- **Future Risk**: nếu sau này nhà dân được phép to lên hoặc camera được kéo gần hơn, số kỷ dính sẽ
  đổi mà không có gì báo.
- **Recommended Solution**: đổi ngưỡng tuyệt đối thành ngưỡng theo tỉ lệ (giống `EAVE_MAX_RATIO`),
  HOẶC cho `plain` một cách vẽ cửa sổ tối giản riêng. **Phải chụp ảnh so sánh trước/sau rồi mới
  chọn** — đây là câu hỏi mỹ thuật, không phải câu hỏi mã.
- **Estimated Complexity**: thấp (một dòng + một bài test + một lần quét ảnh)
- **Blocking Conditions**: không có
- **Review Trigger**: khi làm bước "Historical Architecture" hoặc khi Đàm nói nhà dân trông trống
- **Owner**: phiên AI kế tiếp · **Status**: Open

---

## #26 — Nhà dân chưa có LOD, và cổng hiệu năng iPhone vẫn chưa đo lại (nối với #23)

- **Module**: `src/engine/city3d/dwellings.js` + `buildingSpec.js`, sinh ra từ Phase 7C
- **Priority**: Medium
- **Severity**: Medium
- **Impact**: Phase 7C cộng thêm 17–30 công trình mỗi kỷ. Cảnh nặng nhất (kỷ 7) đi từ ~13.600 lên
  **21.244 / 60.000** tam giác — vẫn trong ngân sách, và nhà dân vào **chung khối hình gộp** nên
  KHÔNG tốn thêm lệnh vẽ. Nhưng số tam giác gần **gấp rưỡi**, mà bản đồ bóng đổ vẽ cảnh lần thứ
  hai, nên chi phí thực tế trên máy yếu là gấp đôi con số đó.
- **Root Cause**: nhà dân dùng đúng `buildBuildingSpec` như công trình thật (ADR-015) nên chúng
  mang đủ chi tiết ở mọi khoảng cách. Riêng kỷ 7 và 9 (`windows: 'arch'`) đắt hơn hẳn: mỗi ô cửa
  dựng thêm một nửa vòm phía trên, mà ở cỡ hiển thị thật một ô cửa nhà dân chỉ rộng ~4 điểm ảnh.
  Đây là chỗ cắt rẻ nhất nếu cần cắt.
- **Current Risk**: **chưa biết** — và đó chính là vấn đề. `TECH_DEBT #23` (đo lại cổng hiệu năng
  iPhone sau khi đổi sang PBR ở Phase 7A) vẫn đang mở, nên hiện KHÔNG có số đo nào trên máy thật kể
  từ trước Phase 7A. Phase 7C vừa cộng thêm tải lên một hệ thống chưa được cân lại.
- **Future Risk**: các bước còn lại của Roadmap (Living City — người đi bộ, xe, khói, cờ) sẽ cộng
  tiếp. Nếu không cân trước thì tới lúc đó sẽ không biết phần nào làm nóng máy.
- **Recommended Solution**: (1) Đàm mở màn Thành Phố trên iPhone, bật HUD hiệu năng, chụp màn hình
  gửi lại — đóng luôn #23. (2) Chỉ khi số đo xấu mới cắt: bỏ nửa vòm cửa sổ cho `plain`, rồi tới
  hạ trần mật độ. **Không cắt trước khi có số** — 35% ngân sách là còn rộng, và cắt mù thì mất chi
  tiết mà không biết có đổi được gì.
- **Estimated Complexity**: đo = thấp (một ảnh chụp) · cắt nếu cần = thấp
- **Blocking Conditions**: **chờ Đàm đo trên iPhone thật** (giống #23 — cùng một lần đo là đóng cả hai)
- **Review Trigger**: trước khi bắt đầu bước "Living City"
- **Owner**: Đàm (đo) → phiên AI kế tiếp (cắt nếu cần)
- **Status**: Open — **nửa DESKTOP đã đóng với câu trả lời "ĐỪNG CẮT", nửa iPhone vẫn chưa đo.**
- ✅ **CẬP NHẬT 2026-08-17 — NỬA DESKTOP ĐÃ CÓ SỐ, VÀ NÓ TRẢ LỜI NGƯỢC VỚI THỨ MỤC NÀY LO** (xem
  `PERFORMANCE.md`). Mục này tự đặt luật đúng — *"**Không cắt trước khi có số**"* — và nay đã có số:
  Apple M3 · 1100×700 · DPR 2, 24/24 cảnh trong **3,90–5,20 ms** trên trần 16,67 ms.
  **Câu trả lời cho câu hỏi LOD là: ĐỪNG CẮT.** Bằng chứng trực tiếp: tam giác **thành phố** chênh
  nhau **43%** giữa kỷ 3 (26.168) và kỷ 11 (37.494), mà thời gian chỉ chênh **2,4%**. Tức thứ mục
  này định cắt — nửa vòm cửa sổ, mật độ nhà dân — nằm trên **trục rẻ nhất trong cả hệ thống**. Cắt
  nó là trả một cái giá thẩm mỹ thật để mua về một khoản tiết kiệm không đo được, đúng cái bẫy
  "chọn mục tiêu tối ưu theo số tam giác" mà `PERFORMANCE.md` ghi vào TOP 3 KHÔNG NÊN.
  ⚠️ Còn lo ngại *"bản đồ bóng vẽ cảnh lần thứ hai nên chi phí thực tế gấp đôi"*: **chưa bác được
  và cũng chưa xác nhận được** — chi phí dựng lại bóng nằm DƯỚI mức nhiễu của phép đo ở mọi cảnh,
  nên không có con số nào để trích. Đó là một câu hỏi còn mở, không phải một câu đã trả lời.
  ⇒ Mục này **thu hẹp phạm vi còn ĐÚNG iPhone**, y như #23. Bộ số M3 không suy ra được cho iPhone.

---

## #29 — Cọ nhìn từ ĐÚNG TRÊN XUỐNG vẫn dẹt thành dấu "✳", vì `parts.js` không nghiêng được khối

- **Module**: `src/engine/city3d/flora.js` (`palm`) + `src/engine/city3d/parts.js` (`prism`), phát
  hiện ở Phase 8D bằng ảnh chụp kỷ 14
- **Priority**: Low
- **Severity**: Low
- **Impact**: `prism` chỉ xoay quanh TRỤC ĐỨNG (`ry`), không nghiêng được, nên tàu lá cọ là những
  tấm NẰM NGANG toả tròn. Nhìn chéo từ bên (phần lớn các cây trên màn hình) thì đọc ra đúng là cây
  cọ; nhưng những cây nằm gần đúng dưới camera thì cả vòng lá dẹt lại thành một dấu hoa thị phẳng.
  Ảnh hưởng kỷ **2, 3, 6, 8, 14, 15** (những kỷ có `palm` trong bảng loài).
- **Root Cause**: giới hạn có chủ đích của tầng hình học, ghi rõ ở đầu `flora.js` — thêm một trục
  xoay vào `parts.js` sẽ kéo theo nhà máy hình học, phép đếm tam giác (`countTriangles`) và phép
  tính cạnh vát, tức chạm vào nền móng của cả 75 công trình.
- **Current Risk**: thấp — đã giảm bớt ở Phase 8D bằng cách buộc **độ rủ vào chiều dài tàu lá** (tàu
  càng dài càng oằn thấp, đúng như cọ thật), tốn 0 tam giác. Cái phễu lá dựng lại được phần lớn,
  chỉ những cây nằm đúng tâm khung hình mới còn dẹt.
- **Future Risk**: nếu sau này camera được phép hạ thấp hoặc kéo gần, tật này sẽ **đỡ đi** chứ không
  nặng thêm — nên nó không phải một quả mìn hẹn giờ.
- **Recommended Solution**: hai hướng, cả hai đều KHÔNG nên làm chỉ vì cây cọ. (a) Thêm trục nghiêng
  cho `prism` — chỉ đáng làm nếu có một lý do KHÁC cũng cần nó (mái dốc thật, cầu thang, dốc cầu);
  lúc đó cây cọ đi ké. (b) Tách mỗi tàu lá thành 2 khối bậc thang xuống — đo rồi: đẩy `palm` từ
  ≤212 lên ~336 tam giác, sát trần 340 của một cái cây. Không đáng cho một tật chỉ thấy ở một góc.
- **Estimated Complexity**: (a) cao và rủi ro · (b) thấp nhưng đắt tam giác
- **Blocking Conditions**: không có — nhưng ĐỪNG làm nếu chỉ vì cọ
- **Review Trigger**: khi có một tính năng KHÁC cần trục nghiêng, hoặc khi Đàm nói cọ trông sai
- **Owner**: phiên AI kế tiếp · **Status**: Open

---

## #31 — `city.dispose()` KHÔNG giải phóng bản đồ bóng (app hiện KHÔNG dính, công cụ thì dính)

- **Tên**: Bản đồ bóng của mặt trời sống sót qua `city.dispose()`
- **Module**: `src/components/city/render3d/sceneGraph.js` (hàm `dispose()`, ~dòng 1167)
- **Priority**: Low · **Severity**: Low hôm nay, Medium nếu kiến trúc đổi
- **Impact**: Mỗi lần dựng-rồi-dọn một cảnh để lại **+2 texture sống sót**. Bản đồ bóng desktop là
  2048×2048; chạy 24 cảnh liên tiếp trên MỘT renderer để lại gần **800 MB bộ nhớ đồ hoạ**.
- **Root Cause**: `dispose()` duyệt `meshes` + `disposables` — hai danh sách chứa những thứ nó TỰ
  tạo ra. Bản đồ bóng thì không nằm trong danh sách nào: nó do chính three tạo ra **muộn hơn**, ở
  lần render đầu tiên, và treo vào `sun.shadow.map`. Đây là hình dạng sai quen thuộc — *dọn theo
  danh sách mình ghi, trong khi có thứ được sinh ra ngoài danh sách ấy*.
- **Current Risk**: **App KHÔNG dính.** `CityScene3D.jsx` (`runtime.dispose()`, ~dòng 422) gọi
  `city.dispose()` RỒI `renderer.dispose()` + `renderer.forceContextLoss()` — mất context thì cả
  bối cảnh đồ hoạ bị thu hồi, kể cả những texture không ai gọi tên. Chỉ CÔNG CỤ dính, vì công cụ
  cố ý dùng lại một renderer cho nhiều cảnh (`bench-suite.mjs`, `--sweep`).
- **Future Risk**: ⚠️ Đây là **mìn hẹn giờ**, không phải lỗi đang chảy máu. Ngày nào có ai làm app
  dùng lại renderer khi chuyển kỷ — một tối ưu hoàn toàn hợp lý và rất dễ được đề xuất, vì dựng lại
  context tốn cả trăm mili-giây — thì rò rỉ này thức dậy trên máy Đàm, và triệu chứng sẽ là *"đi qua
  vài kỷ trong bảo tàng thì máy nóng dần rồi tab sập"*, một triệu chứng KHÔNG trỏ về đây chút nào.
- **Recommended Solution**: một dòng trong `dispose()` — `sun?.shadow?.map?.dispose?.()`. Kèm một
  bài test đòi số texture sau dispose KHÔNG tăng qua nhiều vòng dựng-dọn (đã đo được bằng
  `.city-preview/.leak-work/`, hiệu số rất rõ: bật cập nhật bóng thì 1→3→5→7…, tắt thì đứng yên).
- **Estimated Complexity**: Thấp (1 dòng + 1 bài test)
- **Blocking Conditions**: Không có. CỐ Ý chưa sửa trong phiên Performance Gate vì Đàm đã yêu cầu
  *"không benchmark code đang thay đổi"* — sửa renderer giữa lúc đo thì bảng số không còn nói về
  bản `9b9cb66` nữa. Bản vá đã áp **phía công cụ** để bộ đo không tự làm hỏng con số nó đang đo.
- **Review Trigger**: NGAY khi có ai đề xuất dùng lại renderer giữa các cảnh/kỷ; hoặc phiên nào
  đụng vào `dispose()` vì lý do khác thì sửa luôn.
- **Owner**: phiên AI kế tiếp · **Status**: Open


---

## #32 — ✅ [ĐÃ XỬ LÝ 2026-08-17, Performance Gate] Đồng hồ đo HUD báo THIẾU 56% số tam giác

- **Tên**: `stats.triangles` tự tính bằng công thức riêng, lệch +44.126 so với thực tế
- **Module**: `src/components/city/render3d/sceneGraph.js` · `CityScene3D.jsx` · `CityPerfHud.jsx`
- **Priority**: (đã đóng) — lúc phát hiện là **High**, vì đây là con số Đàm dùng để quyết định
- **Impact**: HUD và trang xem thử báo **34.622** tam giác cho kỷ 7 trong khi máy thật sự vẽ
  **78.748** — thiếu **56%**. Sai theo hướng **trấn an**, tức loại sai nguy hiểm nhất cho một đồng
  hồ đo: nó khiến mọi quyết định "còn dư sức, thêm chi tiết đi" dựa trên một ngân sách bịa.
- **Root Cause**: `stats.triangles` được **DỰ ĐOÁN** bằng công thức
  `buildingTriangles + surfaceTriangles + residents × 24`, trong khi three biết chính xác qua
  `renderer.info.render.triangles`. **Chưa ai từng đặt hai bên cạnh nhau.** Hằng số lệch 44.126
  giống hệt ở cả 15 kỷ chính là hai thứ công thức không biết tới: **vòm trời** (960) và **rặng núi
  chân trời** thêm ở **Phase 9A** (43.166). Người thêm chúng không sửa công thức, và **không có gì
  đỏ lên** vì công thức chỉ được so với chính nó.
- **⚠️ Đây là lần thứ HAI cùng một hình dạng sai**: chú thích của `countTriangles` (`parts.js`) đã
  tự nhận *"có test đối chiếu hai bên"* trong khi bài test ấy chỉ so với **hằng số viết tay**
  (Phase 8B, đã ghi trong `CLAUDE.md`). Bài học đã được viết ra mà vẫn tái diễn ở một file khác ⇒
  bài học chưa đủ, phải có **test thật** mới chặn được.
- **Giải pháp đã áp dụng**: thôi DỰ ĐOÁN, chuyển sang **ĐẾM** — `countSceneTriangles(scene)` /
  `countSceneDrawCalls(scene)` duyệt scene graph theo đúng luật `WebGLRenderer` cộng vào
  `info.render`. Một phép đo trên chính thứ sẽ được vẽ thì không thể lạc hậu khi ai đó thêm khối
  mới. `CityScene3D.publishStats()` còn **đè lên** bằng `renderer.info.render` — HUD phải nói máy
  vừa làm gì, nên nó đọc từ đồng hồ chứ không đọc từ dự báo.
- **Nghiệm thu**: `[stats] tam giác | 78748 | 78748 | +0 (0.0%)` — đo bằng
  `node scripts/city-preview.mjs --era 7 --sessions 80 --level 3 --hour 12 --bench 24`.
  Lệnh vẽ vốn đã đúng (13 = 13) nên phần đó không đổi.
- **Test khoá**: `src/components/city/render3d/sceneStats.test.js` — 3 bài, **cả 3 đã thử-cho-đỏ**
  bằng cách khôi phục đúng công thức cũ. Bài test tự duyệt scene graph bằng mã CỦA NÓ rồi so với
  thứ mã sản phẩm báo (chạy CẢ HAI bên, không bên nào so với hằng số thứ ba), kèm một **đối chứng**
  đòi phần "công thức cũ mù" phải còn > 40.000 tam giác và phải nằm trong con số HUD.
- **Owner**: đã đóng · **Status**: Resolved

---

## #33 — Ma trận 24 cảnh mở lại trình duyệt 25 lần thay vì gộp vào MỘT trang

- **Tên**: `bench-macbook.sh` khởi động Chromium mỗi cảnh một lần
- **Module**: `scripts/bench-macbook.sh` · `scripts/city-preview.mjs` (chế độ `--sweep` đã có sẵn
  đúng kỹ thuật cần dùng, chỉ chưa áp cho `--bench`)
- **Priority**: Low · **Severity**: Low
- **Impact**: Mỗi cảnh phải gói lại bundle + mở lại trình duyệt (~8 giây), tức khoảng **3,5 phút**
  trong tổng ~5 phút chạy là chi phí khởi động chứ không phải chi phí đo. Không sai số nào, chỉ tốn
  thời gian chờ của Đàm.
- **Root Cause**: `--bench` sinh ra để đo MỘT cảnh, còn cơ chế "một trang, một WebGL context, vẽ
  tuần tự nhiều cảnh" chỉ được viết cho `--sweep` (dựng ảnh). Hai chế độ chưa dùng chung đường.
- **Current Risk**: Gần như không. Chỉ là chờ lâu hơn cần thiết.
- **Future Risk**: Nếu sau này ma trận nở ra (15 kỷ × 6 chặng × 2 góc = 180 cảnh) thì 8 giây/cảnh
  thành **24 phút** chỉ để khởi động — đủ lâu để không ai chạy nữa, mà một công cụ không ai chạy
  thì bằng không có (đúng lý lẽ đã viết cho `--sweep`).
- **Recommended Solution**: cho `--bench` đi qua đúng đường của `--sweep`: một trang, một context,
  vòng lặp qua danh sách cảnh. ⚠️ Nhưng phải xử lý `TECH_DEBT #31` TRƯỚC hoặc CÙNG LÚC — dùng lại
  một renderer cho 25 cảnh là chính xác cái điều kiện làm rò rỉ bản đồ bóng thức dậy (2 texture
  2048² mỗi cảnh ⇒ gần 800 MB), và một bộ đo tự làm nóng máy giữa chừng thì mọi con số sau đó đều
  trôi. Hai mục này **nối cứng với nhau**, như #30 ↔ #27 đã từng.
- **Estimated Complexity**: Trung bình (gộp hai đường chạy + #31)
- **Blocking Conditions**: **Đàm đã CHỦ ĐỘNG HOÃN** (2026-08-17, vòng 2 Performance Gate): *"ĐỪNG
  làm bây giờ. Ưu tiên là Đàm có bộ số ĐÚNG một lần, không phải có nó nhanh."* Ghi lại ở đây theo
  đúng yêu cầu của anh, KHÔNG tự làm.
- **Review Trigger**: khi ma trận cần nở ra quá ~30 cảnh, hoặc khi #31 được sửa vì lý do khác.
- **Owner**: phiên AI kế tiếp · **Status**: Open (hoãn có chủ đích)

---

## #34 — ✅ [ĐÃ XỬ LÝ 2026-08-17, vòng 4] `--thu` không kiểm điều kiện tiên quyết, nên lỗi "thiếu thư viện" hiện ra thành 20 dòng lỗi Vite

> ✅ **ĐÃ ĐÓNG.** `--thu` nay chạy **preflight 8 mục trước khi gói bundle**, xếp theo giá (kiểm thư
> mục tức thì → gọi node đọc phiên bản → hỏi Chromium → ghi thử file → hỏi git), **dừng ngay ở mục
> đầu tiên hỏng** và in ✅/❌ kèm **ĐÚNG MỘT lệnh cần gõ**. Ca đã cắn Đàm (`node_modules` có nhưng
> thiếu `three`) nay bị bắt trước khi Vite kịp nói một chữ.
>
> Kèm hai thứ phát sinh, cả hai đều do **thử ngược** lộ ra chứ không do đọc mã:
> **(a)** Mục "đúng thư mục dự án" phải đứng **TRƯỚC** mục `node_modules` — hai triệu chứng giống
> hệt nhau (không có `node_modules`) nhưng cách sửa **ngược nhau**: bảo một người đang đứng nhầm
> chỗ chạy `npm install` là làm họ mất vài phút cài vào thư mục chẳng liên quan rồi hỏng y như cũ.
> **(b)** Mục kiểm git tự tố cáo **sản phẩm của chính nó** — script ghi báo cáo vào `.city-preview/`
> trước khi preflight chạy, nên `git status` thấy nó là "thay đổi chưa lưu". Trong kho thật điều đó
> bị `.gitignore` che đi, tức lời cảnh báo đang đúng **nhờ một file chẳng liên quan** — đúng hình
> dạng quả mìn. Đã lọc. Một cảnh báo kêu oan còn tệ hơn không có: nó dạy người dùng bỏ qua MỌI
> cảnh báo.
>
> **Khoá bằng test** (`scripts/benchMacbookSource.test.js`, 8 bài, tất cả đã thử-cho-đỏ). ⚠️ Chính
> phép thử ngược đã bắt được một lỗ hổng trong bài test đầu tiên tôi viết: nó dựng dự án **không
> có `node_modules` nào cả**, nên mục kiểm số 1 bắt trước và **mục kiểm số 2 chưa từng được chạy** —
> gỡ hẳn mục 2 khỏi script mà test vẫn xanh. Đúng bài học Phase 4D: *"một bài test xanh không cho
> biết có BAO NHIÊU thứ đang giữ nó xanh"*. Nay có bài riêng dựng đúng ca "đủ mọi gói, khuyết đúng
> `three`".
>
> **Chỗ cắt log cũng đã sửa (phần B của vòng 4)**: bản cũ `tail -n 20` giữ 20 dòng CUỐI, mà với lỗi
> build thì **nguyên nhân luôn ở ĐẦU còn ngăn xếp ở cuối** — nên nó đã vứt đúng dòng
> `Rolldown failed to resolve import "three"` và giữ lại toàn `at viteLog (...)`. Nay in **15 dòng
> đầu + 8 dòng cuối** có nhãn rõ ràng, lọc bỏ dòng ngăn xếp thuần khỏi phần trích (KHÔNG lọc khỏi
> file log), và luôn ghi đường dẫn đầy đủ tới `.city-preview/bench-loi-toanvan.log`.

**(Bản ghi gốc, giữ nguyên để đối chiếu:)**

- **Tên**: Chế độ thử nhanh của bộ đo báo SAI NGUYÊN NHÂN khi thiếu `node_modules/three`
- **Module**: `scripts/bench-macbook.sh` (chế độ `--thu`) · `scripts/city-preview.mjs`
- **Priority**: **Medium** · **Severity**: Medium
- **Impact**: **Đã cắn Đàm thật ngày 2026-08-17, mất 4 vòng qua lại.** Máy anh chưa cài đủ phụ
  thuộc; `--thu` chạy tới bước gói bundle rồi Vite đổ ra ~20 dòng lỗi phân giải module. Bộ đo báo
  đúng là "HỎNG", nhưng **không nói được vì sao**, nên cả hai bên phải đoán qua lại vài lượt mới ra
  nguyên nhân thật — trong khi bản sửa chỉ là một câu tiếng Việt.
- **Root Cause**: `--thu` sinh ra ở vòng 2 để **chứng minh bộ đo chạy được trước khi chạy thật**, và
  nó làm đúng phần *phát hiện*: nó dừng, in `!!! CẢNH NÀY HỎNG` kèm 20 dòng cuối. Cái thiếu là phần
  *chẩn đoán*: nó không kiểm **điều kiện tiên quyết** (có `node_modules/three` không) TRƯỚC khi
  khởi động, nên nguyên nhân gốc bị chôn dưới hậu quả. Cùng họ với luật "kiểm CÔNG CỤ trước, kiểm
  mã sau" — chỉ là ở đây phải kiểm **môi trường** trước cả hai.
- **Current Risk**: **Trung bình, và nó chỉ nổ với đúng người không biết code.** Một AI đọc lỗi Vite
  là hiểu ngay; Đàm thì không, mà `--thu` được thiết kế riêng cho Đàm. Tức lỗi này nhắm đúng vào
  người dùng duy nhất của tính năng.
- **Future Risk**: mỗi lần Đàm đổi máy / xoá `node_modules` / clone lại repo là lặp lại y hệt. Và
  mọi phụ thuộc tiên quyết khác (Chromium của Playwright, `zlib`, quyền ghi `.city-preview/`) đều
  có cùng hình dạng — chưa cái nào được kiểm trước.
- **Recommended Solution**: thêm một hàm `kiem_moi_truong()` chạy **trước mọi thứ khác** trong cả
  `--thu` lẫn chạy thật, kiểm theo thứ tự và **dừng ngay ở cái đầu tiên thiếu**, mỗi lỗi in **đúng
  một câu tiếng Việt + đúng một câu lệnh cần gõ**:
  (1) `node_modules/three` → *"Thiếu thư viện 3D. Chạy: `npm install --legacy-peer-deps`"*;
  (2) `node_modules` rỗng/không có → cùng câu lệnh trên;
  (3) không tìm thấy Chromium → câu lệnh tương ứng.
  ⚠️ Kiểm bằng **sự tồn tại của thư mục**, đừng kiểm bằng cách chạy thử rồi bắt lỗi — chạy thử
  chính là thứ sinh ra 20 dòng nhiễu.
- **Estimated Complexity**: **Thấp** (~10 dòng shell). Đây là mục rẻ nhất trong cả file này.
- **Blocking Conditions**: không có.
- **Review Trigger**: lần kế tiếp bất kỳ ai chạm vào `bench-macbook.sh`.
- **Owner**: phiên AI kế tiếp · **Status**: ✅ **ĐÃ XỬ LÝ 2026-08-17 (vòng 4)**

---

## #36 — ✅ ĐÃ ĐÓNG (2026-08-18, Phase 10 Bước 2) — Kỷ 1 và kỷ 2 vẫn KHÔNG có cửa ra vào

- **Module**: `src/engine/city3d/eraStyle.js` (bảng `groundFloor` của kỷ 1, 2) · `buildingSpec.js`
- **Priority**: Medium · **Severity**: Low (mỹ thuật, không ảnh hưởng dữ liệu hay hiệu năng)
- **Impact**: hai kỷ đầu của hành trình — tức thứ Đàm nhìn thấy TRƯỚC TIÊN khi mở bảo tàng — có
  công trình không có lối vào. Nhìn kỹ thì mỗi khối là một hình đặc.
- **Root Cause**: cửa đời cũ nằm ở cuối `emitWindows`, mà hàm ấy thoát ngay ở dòng đầu khi
  `style.windows === 'none'`. Kỷ 1 (lều da thú) và kỷ 2 (nhà bùn) khai `'none'` — hoàn toàn đúng về
  lịch sử — nên chưa bao giờ chạy tới dòng cửa. Hai luật chẳng liên quan gì nhau (có cửa sổ không /
  có cửa ra vào không) dùng chung một câu `return`.
- **Current Risk**: thấp. **Nguyên nhân gốc ĐÃ được sửa ở Phase 10**: `emitGroundFloor` nay được
  gọi từ `buildBuildingSpec` chứ không từ `emitWindows`, nên cửa đã thôi phụ thuộc vào cửa sổ. Hai
  kỷ này chưa hưởng chỉ vì Bước 1 cố ý chỉ làm 3 kỷ (6 · 9 · 13) để nghiệm thu hướng mỹ thuật.
- **Future Risk**: thấp — mục này tự đóng khi Bước 2 chạy.
- **Recommended Solution**: ở Bước 2, khai `groundFloor` thật cho kỷ 1 và 2. Gợi ý đã có sẵn dữ
  liệu: kỷ 1 (Göbekli Tepe) là tấm da thú vén lên trên một khung gỗ — `frame: 'wood'`, `steps: 0`,
  `feature: 'none'` (thời đồ đá thì mặt tiền KHÔNG có gì, và khai `'none'` là một câu trả lời hợp
  lệ chứ không phải chỗ trống). Kỷ 2 (làng ven sông Nin) là lỗ cửa trổ trong tường bùn dày, có
  ngưỡng đất nện.
- **Estimated Complexity**: Thấp — chỉ là hai dòng bảng, mã dựng đã có.
- **Blocking Conditions**: chờ Đàm gật cho Bước 1 (xem `BAN_GIAO.md`).
- **Review Trigger**: khi bắt đầu Bước 2 của Phase 10.
- **Owner**: chưa phân công · **Status**: ✅ **ĐÓNG 2026-08-18 (Phase 10 Bước 2)**

**Đã đóng thế nào** — kỷ 1 khai `door: 'flap'` (tấm da căng treo trên thanh ngang, `frame: 'none'`,
`steps: 0`, `feature: 'none'`), kỷ 2 khai `door: 'flap'` + `frame: 'wood'` (lanh tô gỗ sơn đỏ của
làng thợ Deir el-Medina) + `vernacularFeature: 'awning'` (mành sậy chắn nắng). Phải THÊM một kiểu
cửa mới (`flap`) chứ không tái dùng `panel`: dựng cửa bức bàn cho một túp lều da thú là nói dối
lịch sử tới tám nghìn năm. Gợi ý cũ ở mục này ghi kỷ 1 dùng `frame: 'wood'` — **đã đổi thành
`'none'` sau khi đọc lại**: một tấm da vắt qua thanh ngang thì không có khuôn cửa.

⚠️ **BÀI HỌC RÚT RA — và nó lớn hơn chính mục nợ này.** Mục #36 được đóng ĐÚNG HẠN không phải nhờ
ai nhớ ra, mà nhờ **một con số nằm trong một bài test**: Bước 1 viết `assert.equal(soKyLegacy, 12)`.
Con số ấy là thứ buộc Bước 2 phải mở lại bài test mới chạy xanh được. Một mục nợ ghi trong tài liệu
thì chỉ được đọc khi có người đi tìm; một con số trong bài test thì **tự đòi được đọc**. ⇒ Khi phải
ship một trạng thái dở dang, hãy làm nó **ĐẾM ĐƯỢC trong một bài test**, đừng chỉ ghi vào đây.

---

## #37 — Cửa sổ KHÔNG xoay theo độ nghiêng "tay làm" của thân nhà (sai số dưới một điểm ảnh, nhưng là một luật chỉ đúng một nửa)

- **Module**: `src/engine/city3d/buildingSpec.js` (`emitWindows`)
- **Priority**: Low · **Severity**: Low
- **Impact**: ở những kỷ có `rough` cao (kỷ 1 = 0,90 · kỷ 2 = 0,62 · kỷ 5 = 0,44), thân nhà được
  xoay `ry = jitterR` cho xiêu vẹo tự nhiên, nhưng cửa sổ/bệ/lanh tô thì đặt ở toạ độ mặt tường
  CHƯA xoay và bản thân chúng không mang `ry`. Về nguyên tắc chúng lệch khỏi mặt tường.
- **Root Cause**: `emitWindows` không nhận `jitterR`. Phát hiện khi Phase 10 phải truyền `ry` cho
  các khối tầng trệt (cửa mới CÓ xoay theo, xem `emitGroundFloor`).
- **Current Risk**: rất thấp — đo ra: `jitterR` lớn nhất là `rough × 0,14` = **0,126 rad** ở kỷ 1,
  và trên một bức tường rộng 0,7 thì lệch mép ≈ 0,7/2 × sin(0,126) ≈ **0,044 đơn vị**. Ở cỡ hiển
  thị thật, con số đó dưới một điểm ảnh. Chưa ai nhìn thấy, kể cả trong ảnh cận cảnh 1500px.
- **Future Risk**: trung bình. Nếu một phase sau nâng `rough` lên, hoặc cho camera xuống thấp ngang
  tầm mắt, sai số này lớn dần mà **không có gì đỏ lên** — cùng hình dạng với mọi lỗi mỹ thuật im
  lặng đã ghi trong `CLAUDE.md`.
- **Recommended Solution**: truyền `jitterR` vào `emitWindows` y như đã làm cho `emitGroundFloor`,
  rồi gắn `ry` cho mọi khối cửa sổ/bệ/lanh tô/vòm. ⚠️ Xoay quanh TÂM KHỐI chứ không quanh tâm nhà,
  nên khối lệch tâm vẫn còn sai số vị trí nhỏ — muốn đúng tuyệt đối thì phải quay cả toạ độ
  `(x, z)` quanh tâm mảng nhà. Cân nhắc làm cả hai cùng lúc.
- **Estimated Complexity**: Thấp–Trung bình (một tham số, nhưng chạm ~10 chỗ `out.push` và sẽ làm
  đổi mô tả của MỌI kỷ có `rough` > 0 ⇒ phải quét lại ảnh).
- **Blocking Conditions**: không nên làm chung với Phase 10 — nó đổi cả 15 kỷ, tức phá đúng cái
  tính chất "12 kỷ không suy suyển" mà Bước 1 dựa vào để nghiệm thu.
- **Review Trigger**: khi Phase 10 Bước 2 xong, hoặc khi có phase hạ camera xuống thấp.
- **Owner**: chưa phân công · **Status**: Open

---

## #35 — Toàn bộ bộ đo chưa từng chạy thử ở đường dẫn có DẤU TIẾNG VIỆT + DẤU CÁCH, dù `CLAUDE.md` đã có sẵn "BẪY 2" về đúng chuyện đó

- **Tên**: Công cụ mới chưa được thử ở điều kiện đã từng làm chết một tính năng khác
- **Module**: `scripts/bench-macbook.sh` · `scripts/city-preview.mjs` · `scripts/sweep-score.mjs` ·
  `scripts/shot.mjs` — mọi công cụ ghi/đọc `.city-preview/`
- **Priority**: **Medium** · **Severity**: Medium
- **Impact**: Thư mục dự án trên máy Đàm là **`Bản sao Pomodoro Game - USING`** — có **dấu tiếng
  Việt** VÀ **dấu cách** VÀ **dấu gạch nối**. Bộ đo chạy hoàn toàn trong hộp cát Linux ở đường dẫn
  thuần ASCII không dấu cách (`/home/user/pomodoro-dc`), nên **chưa một dòng nào của nó từng gặp
  điều kiện thật của máy Đàm**. Ngày 2026-08-17 nó chạy được trên máy anh — nhưng đó là **may**,
  không phải **đã kiểm**: không có bài test nào khoá, và lần sau đổi một dòng là mất.
- **Root Cause**: hai thứ độc lập, cả hai đều đã có tiền lệ trong chính dự án này.
  (a) **Dấu cách**: shell không trích dẫn biến đường dẫn (`$X` thay vì `"$X"`) thì `Bản sao Pomodoro
  Game - USING` bị tách thành nhiều tham số. Đây là lỗi shell kinh điển, và `bench-macbook.sh` là
  script shell **mới nhất và dài nhất** trong repo.
  (b) **Dấu tiếng Việt (NFC/NFD)**: macOS lưu tên file ở dạng NFD (`a` + dấu rời), phần lớn công cụ
  khác giả định NFC. `CLAUDE.md` đã ghi hẳn **"BẪY 2"** — launchd thoát mã 78 **không có stderr** ở
  đúng đường dẫn này — và ghi thêm rằng nó *"cùng họ với cái bẫy NFC/NFD làm test nạp hai bản
  React"*. Tức dự án đã trả giá **hai lần** cho đúng cái bẫy này, bài học đã được viết ra, **và
  công cụ mới vẫn không được thử ở điều kiện đó.** Đúng bài học *"một bài học được ghi ra KHÔNG chặn
  được gì; chỉ một bài TEST mới chặn được"*.
- **Current Risk**: **Chưa biết — và "chưa biết" là toàn bộ vấn đề.** Bộ đo đã chạy đạt một lần
  trên máy Đàm, nên (a) có vẻ ổn ở đường đi hiện tại; nhưng không có gì chứng minh nó ổn ở mọi
  nhánh (nhánh lỗi, nhánh `tail -n 20`, nhánh ghi log), và (b) chưa hề được chạm tới.
- **Future Risk**: triệu chứng của cả hai đều **im lặng hoặc gây hiểu nhầm** — (a) cho ra "không
  tìm thấy file" trỏ vào một đường dẫn bị cắt cụt, (b) từng cho ra **thoát mã 78 không có stderr**.
  Cả hai đều trông y hệt "bộ đo hỏng" chứ không giống "đường dẫn có dấu", nên sẽ lại tốn nhiều vòng
  qua lại như #34 vừa tốn.
- **Recommended Solution**: một bài test đọc-mã-nguồn + một lần chạy thật, cả hai đều rẻ:
  (1) test quét `scripts/*.sh` bắt mọi biến đường dẫn dùng không có nháy kép (`$THUMUC` thay vì
  `"$THUMUC"`) — khoá được (a) **vĩnh viễn**, và đây là thứ duy nhất chặn được hồi quy;
  (2) chạy `bash scripts/bench-macbook.sh --thu` một lần từ một bản sao repo đặt ở đường dẫn
  `/tmp/Bản sao Pomodoro Game - USING/` — khoá được (b) một lần, ở chính điều kiện của máy Đàm.
  ⚠️ Làm (2) **trong hộp cát Linux vẫn có giá trị** cho vế dấu cách, nhưng **KHÔNG** thay thế được
  vế NFC/NFD: Linux không chuẩn hoá tên file như macOS, nên vế đó chỉ Đàm mới kiểm thật được.
- **Estimated Complexity**: (1) Thấp · (2) Thấp
- **Review Trigger**: lần kế tiếp có ai thêm/sửa một script trong `scripts/`; hoặc ngay khi bộ đo
  báo một lỗi mà Đàm không hiểu.
- **Owner**: Đàm (chỉ còn vế NFD trên macOS)
- **Status**: **Open — vế DẤU CÁCH đã đóng và đã khoá bằng test; vế NFC/NFD của macOS thì KHÔNG
  kiểm được từ Linux, còn nguyên.**
- ✅ **ĐÃ LÀM ĐƯỢC (2026-08-17, vòng 4)** — `scripts/benchMacbookSource.test.js`:
  **(a)** Preflight chạy trọn vẹn từ một thư mục tên `Bản sao Test - CÓ DẤU`, ở **CẢ HAI** dạng
  chuẩn hoá NFC và NFD — chứng minh đường dẫn đi qua được `cd`, `$PWD`, **hai lần gọi `node`**
  (đọc phiên bản three + hỏi Chromium), `mkdir`, ghi file thử và `df` mà không đứt.
  **(b)** Một bài **đọc mã nguồn** bắt mọi biến đường dẫn để trần trong `scripts/bench-macbook.sh`.
  Nó đi **từng ký tự** chứ không dùng regex, vì `"$(grep -c . $tam)"` trông như đã bọc nháy nhưng
  `$tam` bên trong `$( )` **không** được lớp nháy ngoài che — một phép kiểm bằng regex sẽ báo an
  toàn ở đúng chỗ nguy hiểm nhất. Danh sách biến là **cho-phép** chứ không phải cấm (fail-closed):
  thêm biến mới mà quên bọc nháy thì test ĐỎ ngay. Có **đối chứng** nhốt cả hai hình dạng sai.
  ⚠️ Đã thử ngược: chèn `rm -f $thu_file` để trần vào script ⇒ bài (b) ĐỎ đúng như mong đợi.
- ⚠️ **CÒN LẠI — VÀ ĐỪNG ĐỌC MỤC TRÊN THÀNH "ĐÃ XONG"**: Linux lưu tên file **nguyên byte**, không
  chuẩn hoá gì cả; macOS lưu ở dạng **NFD** và một số tầng lại trả về NFC. Nên bài test trên chứng
  minh được vế **dấu cách + ký tự nhiều byte**, KHÔNG chứng minh được hành vi chuẩn-hoá thật của
  macOS — tức đúng cái đã giết LaunchAgent ở "BẪY 2" (`CLAUDE.md`: thoát mã 78, **không có
  stderr**). Phần ấy chỉ máy Đàm kiểm được, và nó đã thành một dòng trong runbook ở
  `PERFORMANCE.md` ("Một điều CHỈ máy Đàm kiểm được").

---

## #39 — `crownWeight` là một trục MỎNG, và với `barrel` nó KHÔNG THỂ tách được hai kỷ dù khai số nào

- **Module**: `src/engine/city3d/roofStyle.js` + `rooftop.js`
- **Priority**: Low · **Severity**: Low
- **Impact**: trong 6 trục dùng để chứng minh "15 kỷ ra 15 mái", `crownWeight` chỉ tách được **6
  trên 105 cặp** (năm trục kia: 74–99). Tệ hơn, với kiểu `barrel` (ngói ống) thì bước lượng hoá đo
  được là **1,459** trong khi cả dải hợp lệ chỉ rộng **1,25** (`CROWN_WEIGHT_MIN` 0,35 →
  `CROWN_WEIGHT_MAX` 1,6) ⇒ hai kỷ cùng lợp ngói ống (kỷ 4 và kỷ 8) **không bao giờ** phân biệt
  được bằng trọng số, dù khai giá trị nào.
- **Root Cause**: `crownWeight` là MỘT số dùng chung cho năm kiểu đường nét có **độ nhạy hình học
  chênh nhau 16 lần** (đầu đao 0,175 đơn-vị-hình-bao mỗi đơn-vị-trọng-số · ngói ống 0,011). Một
  thang chung áp lên năm thứ nhạy khác nhau thì với thứ nhạy nhất nó quá thô, với thứ ít nhạy nhất
  nó gần như không làm gì — đúng họ với bẫy `eaves` ở Phase 7C, chỉ khác là ở đây thứ chênh nhau
  không phải kích thước khối mà là **độ nhạy của phép biến đổi**.
- **Current Risk**: rất thấp. Bảng vẫn đạt 105/105 cặp ≥ 2 trục nhờ năm trục kia, và trục này vẫn
  có việc thật (nó quyết định số con tiện của lan can, độ vươn của đầu đao — hai thứ nhìn thấy
  được). Nó chỉ **yếu**, không sai.
- **Future Risk**: trung bình. Nguy hiểm nằm ở chỗ một phiên sau đọc bảng, thấy có trường
  `crownWeight`, rồi **trông cậy vào nó** để phân biệt hai kỷ mới thêm — và nó im lặng không làm
  được. Đã chặn bằng cách ghi thẳng sự thật vào `roofStyle.test.js` (danh sách `KHONG_VUA_DAI` bị
  khoá bằng `assert.deepEqual(..., ['barrel'])`, tức nó tự đỏ nếu có kiểu thứ hai rơi vào).
- **Recommended Solution**: nếu cần trục này khoẻ hơn thì **chuẩn hoá theo độ nhạy** — cho mỗi kiểu
  một dải riêng, hoặc đổi `crownWeight` từ "hệ số nhân" sang "đơn vị hình bao" (khai thẳng cái đầu
  đao vươn ra bao nhiêu) để một con số nghĩa như nhau ở mọi kiểu. ⚠️ Đừng nới `CROWN_WEIGHT_MAX`
  cho `barrel` vừa — đó là mua điểm bằng cách cho ngói ống dày gấp ba lần thực tế.
- **Estimated Complexity**: Thấp (một hàm chuẩn hoá + đo lại bước) — nhưng nó đổi hình của mọi kỷ
  có đường nét ⇒ phải quét lại 15 kỷ.
- **Blocking Conditions**: không có.
- **Review Trigger**: khi `crownWeight` tụt xuống 0 cặp tách được (bài `MỖI TRỤC PHẢI CÒN SỐNG` sẽ
  đỏ), hoặc khi có phase thêm kiểu đường nét thứ sáu.
- **Owner**: chưa phân công · **Status**: Open

---

## #52 — Một ảnh nghiệm thu đã bị RÁCH NGANG và ta KHÔNG biết vì sao; nay có cổng chặn nhưng chưa có chẩn đoán

- **Module**: `scripts/city-preview.mjs` (`shoot`, `soiVetRach`, `chiaBang`).
- **Priority**: Medium · **Severity**: High (một tấm rách cho ra số liệu lệch vài điểm phần trăm mà
  không cổng nào kêu) · **Status**: Open (mở 2026-08-19 trong §2-C).
- **Impact**: `TRUOC-A-s20-ky09.png` báo đất trống **37,37%** trong khi sự thật là **41,61%** — sai
  4,24 điểm phần trăm trên đúng đại lượng đang dùng để nghiệm thu. Nếu tấm ấy không tình cờ bị hai
  mặt nạ khác nhau cãi nhau về cùng một đại lượng thì con số sai đã đi thẳng vào báo cáo, và cả một
  kết luận mỹ thuật đã dựa lên nó.
- **Root Cause**: **CHƯA BIẾT.** Lời giải thích đầu tiên — *"`shoot` chụp thành nhiều dải, một dải
  đến từ khung hình cũ"* — nghe rất xuôi và **đã bị chính số đo bác bỏ**: chỗ rách nằm ở **hàng
  441**, còn mốc chia dải của khung 1100×700 là **hàng 476**. Ảnh gốc đã bị ghi đè bằng bản dựng
  lại (md5 `5263956e…`) nên không truy được nữa. Các giả thuyết còn sống: Chromium trả về một khung
  hình đang vẽ dở; một lượt `Page.captureScreenshot` bắt gặp cảnh giữa hai lần rAF; hoặc một khối
  cảnh vật/mặt nạ được gắn muộn hơn một khung.
- **Current Risk**: THẤP-đã-chặn. `shoot` nay quét MỌI mép hàng bằng `soiVetRach` sau khi ghép,
  chụp lại tối đa 3 lượt, và **dừng hẳn chứ không ghi ảnh** nếu vẫn rách. Ngưỡng hiệu chuẩn bằng số
  đo thật (120 ảnh lành: mép lớn nhất 0,0582 · tỉ số lớn nhất 14,5× — đối chứng rách: 0,180/66× và
  0,361/132×), khoá bằng 4 bài ở `scripts/cityPreviewSource.test.js`, cả 7 phép phá đều đã thử-cho-đỏ.
- **Future Risk**: cổng chặn **triệu chứng**, không chữa **nguyên nhân**. Nếu tỉ lệ rách tăng (hôm
  nay ~1/120) thì mỗi ảnh phải chụp 2–3 lượt và bản quét 15 kỷ chậm gấp đôi; nếu một ngày nào đó
  nó rách theo chiều DỌC thì phép quét theo hàng mù hoàn toàn.
- **Recommended Solution**: (a) giữ một bản sao ảnh bị từ chối vào `.city-preview/rach/` để lần sau
  còn có vật chứng mà chẩn đoán — hôm nay không có, và đó chính là lý do mục này phải để ngỏ;
  (b) đo tỉ lệ rách thật bằng cách đếm số lượt chụp lại qua một lần quét đầy đủ; (c) nếu tỉ lệ đáng
  kể thì ép trang đứng yên (dừng vòng lặp hoạt hoạ) trước khi chụp thay vì chụp rồi kiểm.
- **Estimated Complexity**: (a) rất nhỏ · (b) nhỏ · (c) vừa.
- **Blocking Conditions**: không có — (a) làm được ngay, nhưng cố ý KHÔNG làm trong §2-C để không
  mở rộng phạm vi một task đang đo mật độ.
- ⚠️ **BÀI HỌC KÈM THEO, ĐÃ TRẢ GIÁ NGAY TRONG PHIÊN MỞ MỤC NÀY**: ngưỡng hiệu chuẩn trên **120 ảnh
  một-cảnh** rồi đem áp cho **bảng quét 15 kỷ** ⇒ kêu oan đúng **30 chỗ**, cách nhau đều 208 hàng =
  `CELL_H(186) + LABEL_H(22)` — đó là các **dải nhãn** mà chính trang xem thử vẽ ra. Một tấm bảng
  dán ảnh thì CÓ mép sắc lẹm, và có rất nhiều. Đúng hình dạng `TECH_DEBT #38`: một con số đo trên
  MỘT quần thể được đọc thành luật của CẢ TẬP. Cách chữa **không** phải nới ngưỡng (nới thì ảnh
  một-cảnh mất hết hàng rào) mà là **kể tên những hàng mà mép sắc lẹm là ĐÚNG THIẾT KẾ**
  (`hangCauTrucBangQuet`, suy từ CÙNG công thức bố cục của `sweepPageHtml`, tái lập đúng cả 30 hàng
  — có test đòi BẰNG NHAU chứ không "bao gồm", vì "bao gồm" là cách một bản vá thành cái chăn trùm).
- **Review Trigger**: lần đầu thấy dòng `⚠️ ảnh rách ngang … chụp lại` trong log, hoặc lần đầu một
  lượt dựng ảnh chết với `ảnh vẫn RÁCH NGANG sau 3 lượt`.
- **Owner**: chưa phân công · **Status**: Open

---

## #51 — Bộ vẽ 2D CHƯA BAO GIỜ vẽ nhà dân, nên hai bộ vẽ khác nhau về NỘI DUNG chứ không chỉ độ đẹp

- **Module**: `src/components/city/render2d/CityCanvas2D.jsx` (mảng `risen`), đối chiếu
  `src/engine/city3d/cityParts.js` (bộ 3D).
- **Priority**: Medium · **Severity**: Medium · **Status**: Open (phát hiện 2026-08-19 trong §2-C,
  **có TRƯỚC phase này** — không phải nợ do §2-C sinh ra).
- **Impact**: đo 2026-08-19, trung bình 15 kỷ mỗi thành phố: **10,0 nhà dân ở 20 phiên · 23,3 ở 50
  phiên · 24,7 ở 80 phiên** — bộ 2D không vẽ một căn nào. Ở mốc 80 phiên, **24,7 trong tổng 29,7
  công trình (83%)** biến mất khi Đàm rơi về bản 2D, và thành phố tụt về đúng 5 công trình như
  trước Phase 7C.
- **Root Cause**: Phase 7C thêm `layout.dwellings` như một MẢNG RIÊNG (không nhập vào
  `layout.buildings`), và chỉ nối vào bộ 3D. `CityCanvas2D.jsx` dựng `risen` bằng cách liệt kê tay
  ba nguồn (`buildings` · `props` lọc bỏ đường · `scaffolds`) — thêm nguồn thứ tư thì phải sửa
  chỗ này, mà không có gì nhắc. Đúng hình dạng *"một luật được phát biểu lại ở nhiều nơi"* đã cắn
  ở Phase 4D và Phase 7B, chỉ khác là ở đây chỗ quên nằm trong một bộ vẽ ít ai mở.
- **Current Risk**: THẤP hôm nay — bộ 2D là đường lui, và cổng hiệu năng 3D đang ĐẠT nên hầu như
  không ai thấy nó. Nhưng chính điều đó làm nó im lặng: nó chỉ hiện ra đúng lúc 3D hỏng, tức đúng
  lúc không ai muốn gặp thêm bất ngờ.
- **Future Risk**: TRUNG BÌNH. `CityCanvas2D.jsx` tự tuyên bố luật *"Hai bộ vẽ được phép khác nhau
  về ĐỘ ĐẸP, không được khác nhau về NỘI DUNG"* — một chú thích đang nói dối, và đó chính là loại
  câu mà phiên sau kế thừa rồi dựa vào (bài học Phase 4D).
- **Recommended Solution**: nối `layout.dwellings` vào `risen` (một dòng, cùng khuôn `scaffolds`),
  rồi khoá bằng một bài test **đọc mã nguồn** đòi mọi mảng mà `computeCityLayout` trả về đều có
  mặt ở CẢ HAI bộ vẽ — canh QUAN HỆ chứ không canh danh sách viết tay, nếu không mảng thứ sáu
  thêm sau này lại lọt y hệt.
- **Estimated Complexity**: Nhỏ (~10 dòng mã + ~25 dòng test) — nhưng đụng `render2d/`, **nằm
  ngoài phạm vi file của chương trình hiện tại (§3)**, nên ghi lại chứ không sửa.
- **Blocking Conditions**: không có.
- **Review Trigger**: lần kế tiếp có ai đụng vào `render2d/`, hoặc lần kế tiếp cổng 3D trượt và bộ
  2D được bật thật.
- **Owner**: chưa phân công.

---

## #50 — `md5sum` của ảnh dựng KHÔNG ổn định khi máy bận, nên nó chỉ chứng minh được MỘT chiều

- **Module**: mọi phép nghiệm thu bằng ảnh (`scripts/city-preview.mjs` → `md5sum`), và luật nghiệm
  thu trong `CLAUDE.md` / các lời hứa "trùng từng byte" ở `ARCHITECTURE_DECISIONS.md` (ADR-034),
  `CHANGELOG.md`, `BAN_GIAO.md`.
- **Priority**: Medium · **Severity**: Low (không có gì SAI hôm nay; rủi ro là kết luận nhầm sau này)
- **Impact**: đo 2026-08-19 — **cùng một lệnh, cùng một cây mã**, chỉ khác tải máy:
  máy rảnh 5 lượt liên tiếp ra `2ad06f97…`; bật 4 vòng lặp bận trên máy 4 nhân thì ra
  `28992bba…`; hết tải quay lại `2ad06f97…`. Chênh lệch **±1 trên một kênh, ~2% điểm ảnh** —
  SwiftShader chia ô rasterise theo số luồng dùng được nên tải máy đổi thì đường làm tròn đổi.
- **Root Cause**: `md5sum` là phép so BYTE, mà thứ ta muốn hỏi là "ảnh có đổi không" — hai câu khác
  nhau. Chúng trùng nhau chừng nào bộ dựng còn tất định TUYỆT ĐỐI; nó không tất định tuyệt đối.
- **Current Risk**: THẤP. Chiều đang được dùng vẫn đúng: **trùng md5 ⇒ ảnh y hệt** (ADR-034 và
  `CHANGELOG` VIỆC 2 dựa vào đúng chiều này, nên chúng vẫn đứng vững), và luật nghiệm thu *"từ chối
  nếu cặp trước/sau TRÙNG byte"* cũng vẫn đúng — nó bắt lỗi chép nhầm/đặt sai tên.
- **Future Risk**: TRUNG BÌNH và im lặng. Ai đó chạy lại phép chứng minh của ADR-034 trên một máy
  đang bận sẽ thấy md5 lệch và kết luận **có hồi quy trong khi không có** — đúng loại báo động giả
  đã cắn ở Phase 9D (`road-score.mjs`). Ngược lại, một người muốn chứng minh "không đổi" có thể bị
  cám dỗ chạy đi chạy lại tới khi md5 khớp.
- **Recommended Solution**: đừng dùng md5 làm phép đo mỹ thuật. Muốn chứng minh **KHÔNG đổi** thì
  (a) chụp hai lượt LIỀN NHAU trên máy rảnh, và (b) nếu md5 lệch thì **đo chênh lệch điểm ảnh rồi
  so với ngưỡng mắt 12/255** (±1 thấp hơn ngưỡng ấy 12 lần ⇒ không đổi được kết luận nào).
  Cách đóng triệt để: một công cụ `anh-bang-nhau.mjs` trả lời "lệch tối đa bao nhiêu" thay vì
  "giống/khác", để không ai phải tự nhớ luật này.
- **Estimated Complexity**: Nhỏ (~40 dòng, tái dùng `decodePng`) — nhưng chưa cấp bách.
- **Blocking Conditions**: không có.
- **Review Trigger**: lần kế tiếp có một lời hứa "trùng từng byte" cần chứng minh, hoặc lần kế tiếp
  một phép so ảnh trước/sau cho kết quả khó hiểu.
- **Owner**: chưa phân công · **Status**: Open (đã ghi đầy đủ số đo vào `PERFORMANCE.md`).

---

## #49 — `city-preview.mjs` xén mất 23 dòng cuối của MỌI ảnh đơn, và không có gì nói ra

- **Module**: `scripts/city-preview.mjs` (hàm `shoot`, cờ `--window-size`)
- **Priority**: Medium · **Severity**: Low-Medium
- **Impact**: `--width 1100 --height 700` dựng canvas đúng 1100×700, nhưng **khung nhìn thật chỉ
  cao 693** (đo 2026-08-19 bằng chính trang xem thử: `khung nhìn: 1134x693`). Canvas đặt ở
  `y = 16`, nên **23 dòng cuối của khung hình chưa bao giờ được vẽ ra**; ảnh PNG vẫn cao 780 vì
  Chromium chụp vượt khung nhìn rồi phủ nốt bằng nền trang. Nói cách khác: mọi ảnh đơn từ trước
  tới nay là một khung hình **1100×677** mang tên 1100×700, cộng một dải nền trang cao 87 dòng.
- **Root Cause**: `--window-size=${width + 34},${height + 80}` — con số `+80` là một ước lượng cho
  phần khung cửa sổ, và nó THIẾU 23 điểm ảnh trong hộp cát này. Không ai từng đặt nó cạnh sự thật,
  vì trang xem thử không in ra `window.innerHeight` (đúng bài học đã ghi cho `shot.mjs`: *"luôn in
  kèm `window.innerWidth` thật, nếu không mọi kết luận về bố cục đều dựa trên một bề ngang bịa"* —
  bài học ấy có sẵn, chỉ là chưa được áp cho công cụ này).
- **Current Risk**: THẤP cho việc so ảnh trước/sau (cả hai vế cùng bị xén y hệt) và cho bản quét 15
  kỷ (đường đi khác, dùng `sweepPageHtml`). CAO cho bất kỳ phép đo nào tin vào con số KHAI: bản đầu
  của phép đo mật độ đã khai canvas cao 700 rồi cắt theo, và 23 dòng chênh ấy lọt thẳng vào mẫu số.
- **Future Risk**: một kết luận mỹ thuật về **mép dưới khung hình** (mặt đường gần nhất, bóng đổ
  chân tường, bệ kè) sẽ nói về một vùng ảnh KHÔNG tồn tại. Và bất cứ ai đọc `--height 700` rồi suy
  ra tỉ lệ khung 1100:700 = 1,571 đều sai — tỉ lệ THẬT trên màn hình là 1100:677 = 1,625, trong khi
  camera vẫn dựng theo 1,571 (`tỉ lệ camera: 1.5714`), tức ảnh đang bị **kéo dãn dọc nhẹ**.
- **Recommended Solution**: nới `+80` thành một số đủ (đo được: cần ≥ +103), HOẶC bỏ hẳn cách đoán
  bằng cách chụp qua CDP `Page.captureScreenshot` với `clip` đúng hộp bao canvas. Kèm một cổng tự
  kiểm: trang PHẢI in `window.innerHeight` và script PHẢI đỏ nếu `innerHeight < pad + height`.
- **Estimated Complexity**: Nhỏ (một dòng + một cổng kiểm) — nhưng xem Blocking Conditions.
- **Blocking Conditions**: sửa xong thì **MỌI ảnh tham chiếu đổi kích thước**, nên mọi con số
  nghiệm thu đã đo bằng ảnh 1134×780 (kể cả các phép `md5sum` byte-identical dùng trong phiên này)
  sẽ không tái lập được. Phải làm thành một bước riêng, đo lại mốc nền, chứ không kèm vào một phase
  mỹ thuật — đúng bài học `TECH_DEBT #43` (*mỗi phase phải tự đo lại mốc nền của mình*).
- **Review Trigger**: trước phase kế tiếp có kết luận về mép dưới khung hình, hoặc trước lần đo
  nghiệm thu nào phải khai toạ độ canvas.
- **Owner**: — · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-19.**
  - **Đã làm gì**: bỏ hẳn BA cờ ĐOÁN (`--window-size`, `--screenshot`, `--virtual-time-budget`).
    Nay đặt khung nhìn bằng CDP `Emulation.setDeviceMetricsOverride`, **hỏi** trình duyệt canvas
    nằm đâu (`getBoundingClientRect`), rồi chụp `Page.captureScreenshot` với `clip` đúng hộp bao
    đó. **Không nới `+80` thành `+103`** — đó là thay một con số đoán bằng một con số đoán khác, và
    nó sẽ trôi lại ngay khi ai đó đổi bố cục trang, thanh cuộn, hay chạy ở DPR khác.
  - **Cổng chặn**: `kiemKhungNhin` (thuần, xuất ra, có `--selftest`) TỪ CHỐI chạy nếu hộp bao thò
    ra ngoài khung nhìn, và đối chứng của nó **nhốt đúng ca 23 dòng bị xén** (1134×693) — bắt cả
    chiều ngang lẫn chiều dọc, và không tha một mẩu thò 0,4 điểm ảnh.
  - **Đối chứng thứ hai, nằm ở đầu bên kia**: ảnh nay đúng bằng khung hình nên `mask-count.mjs`
    phải đếm được **0 điểm màu mốc `rgb(1,2,3)`**. Khác 0 là `clip` trượt, và công cụ in số đó ra.
  - **Kết quả đo**: ảnh ra **1100×700** (trước: 1134×780 với 23 dòng canvas không tồn tại), hồ sơ
    hình học ghi hộp ĐO ĐƯỢC `doX:16 doY:16 doW:1100 doH:700` trong khung nhìn `1196×940`,
    `pad: 0`.
  - ⚠️ **Vá xong thì đụng ngay một cái trần khác** — ổ cắm CDP chỉ cho **4 MiB một tin nhắn**, nên
    bản quét 15 kỷ (~9 MB base64) chết với đúng một dòng "ổ cắm CDP lỗi". Đã đo chính xác cái trần
    rồi chụp thành **dải ngang** và ghép ở phía Node. Xem `PERFORMANCE.md` mục *"Vá xong cái xén
    thì đụng ngay cái trần"*, và **`#50`** cho hệ quả về `md5sum`.
  - **Mốc nền cũ**: KHÔNG so trực tiếp được với số mới — đã ghi thành một mục riêng trong
    `PERFORMANCE.md`, đúng cách `#22` xử lý bộ lọc "8% mái".

---

## #48 — Chi tiết Phase 10–11 nằm DƯỚI ngưỡng mắt ở 11/15 kỷ, **kể cả ở khoảng cách cận cảnh lý tưởng**

- **Module**: `src/engine/city3d/groundFloorStyle.js` + `roofStyle.js` (bảng) · `rooftop.js` +
  `groundFloor.js` (hình) — KHÔNG phải `cityFocus.js`
- **Priority**: Medium · **Severity**: Medium
- **Impact**: chế độ cận cảnh (ADR-034) được ship kèm một con số chứng minh: *"lệch trung bình
  15,45 — TRÊN ngưỡng mắt 12"*. Con số ấy đo ở **đúng một kỷ (kỷ 9)**. Đo lần đầu đủ 15 kỷ
  (2026-08-18, cùng một dòng lệnh, `b98a47d` → `e95cdf1`, khung 1134×780):

  | kỷ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
  | lệch TB | **0,71** | 4,56 | 5,03 | 8,17 | 3,72 | 3,19 | **15,52** | 11,19 | **15,45** | 8,85 | **12,61** | 5,81 | **12,20** | 4,48 | 3,02 |

  Chỉ **4/15 kỷ** trên ngưỡng. Kỷ 1 gần như KHÔNG đổi gì (0,71 — chỉ 0,9% điểm ảnh).
- **Root Cause**: KHÔNG phải camera, và đây là điểm dễ kết luận nhầm nhất. Đối chứng: đo lại 8 kỷ
  có lùi ra, ở **khoảng cách lý tưởng 7,5** (tức không lùi chút nào) — chênh lệch so với ca xấu
  nhất chỉ **−0,72 … +2,14**, và **không kỷ nào đổi phía so với ngưỡng**. Tức camera đã làm hết
  phần việc của nó; thứ thiếu là **thứ để mà nhìn**. Hai nguyên nhân thật, cả hai đã có tên sẵn
  trong `#41`: (a) Phase 10–11 thêm rất ÍT vào một số kỷ (kỷ 1 là lều da thú: +9,1% tam giác, và
  tầng trệt của nó chỉ là một cửa lều); (b) thứ được thêm ở nhiều kỷ là **BỀ MẶT** chứ không phải
  **ĐƯỜNG VIỀN** — kỷ 8 tốn nhiều hình học nhất bảng (+48,5%, ngói bò) mà chỉ ra 11,19.
  Đối chiếu: 4 kỷ đạt đều là kỷ có chi tiết phá đường viền (lan can kỷ 7, cửa sổ mái kỷ 9).
- **Current Risk**: thấp về kỹ thuật (không hỏng gì, không lệnh vẽ mới). Trung bình về giá trị:
  Đàm bay tới ngắm gần một khu phố ở 11/15 kỷ và thấy gần như y hệt trước Phase 10.
- **Future Risk**: trung bình. Đây đúng là cái bẫy `#41` cảnh báo — nếu Phase 13 lại thêm chi tiết
  bề mặt lên cùng những kỷ ấy thì kết quả sẽ lặp lại với một ngân sách nữa.
- **Recommended Solution**: theo đúng LUẬT MỚI ở `#41` — chọn kỷ theo con số trong bảng trên, và
  chỉ thêm thứ **đổi đường viền**: `crown`/`dormer` cho những kỷ đang chỉ có `stack`, hoặc một đặc
  trưng tầng trệt nhô ra khỏi mặt tường (mái hiên, cột hiên, bậc thềm rộng). ⚠️ **KHÔNG** phóng to
  đều mọi thứ — bẫy "cây nấm" (Phase 7C) và bẫy `MIN_STONE` (Phase 9D). ⚠️ Và với kỷ 1–2 phải hỏi
  trước: một túp lều da thú **có nên** có nhiều chi tiết không, hay sự đơn sơ mới đúng?
- **Estimated Complexity**: Trung bình — sửa bảng thì rẻ, nhưng phải chụp + đo lại 15 kỷ mỗi vòng
  (~12 phút/vòng) và mỗi giá trị mới phải trả lời được *"công trình có thật nào ở nước ấy trông
  như vậy?"*.
- **Blocking Conditions**: ⛔ **CHỜ ĐÀM QUYẾT** — mục 5 ca 6 (quyết định mỹ thuật). Cụ thể: có
  đáng tiêu một phase nữa để kéo 11 kỷ kia lên trên ngưỡng không, hay chấp nhận rằng **những kỷ
  đơn sơ thì vốn dĩ đơn sơ** và chuyển ngân sách sang chỗ khác (mật độ nhà — xem báo cáo cùng
  ngày)?
- **Review Trigger**: trước khi bắt đầu bất kỳ phase nào thêm chi tiết lên nhà.
- **Owner**: chờ Đàm · **Status**: 🟡 MỞ — đã đo đủ 15 kỷ, đã có đối chứng loại trừ camera

---

## #47 — Chế độ cận cảnh khoá KHOẢNG CÁCH, nên một công trình RỘNG BẤT THƯỜNG sẽ bị cắt hai đầu

- **Module**: `src/engine/city3d/cityFocus.js` (`FOCUS_VIEW_DISTANCE`)
- **Priority**: Low · **Severity**: Low
- **Impact**: chưa có. Hôm nay **không có kỷ nào** dính — công trình rộng nhất trong 15 kỷ vẫn nằm
  gọn trong khung ở khoảng cách 7,5.
- **Root Cause**: ADR-034 khoá **khoảng cách thật** (7,5) thay vì khoá "công trình chiếm bao nhiêu
  phần khung", và đó là lựa chọn ĐÚNG vì nó giữ được lời hứa *"một cái ống khói ở kỷ 1 và ở kỷ 15
  chiếm bằng nhau số điểm ảnh"*. Nhưng khoá khoảng cách là một luật về **CHIỀU SÂU**, mà thứ quyết
  định "có lọt khung không" là **BỀ NGANG**. Hai đại lượng ấy hôm nay đi cùng nhau chỉ vì mọi công
  trình đều cao-hơn-rộng; ngày nào có một công trình bè ngang (một cây cầu, một bức tường thành
  dài, một sân vận động) thì chúng tách ra, và cận cảnh sẽ cắt mất hai đầu.
- **Current Risk**: bằng không — **cố ý ghi ra một mục nợ cho một thứ CHƯA hỏng**, vì cố vấn kỹ
  thuật chỉ đúng một điều: cách hỏng duy nhất còn lại của việc khoá khoảng cách là ca này, và nó
  sẽ đến im lặng (không có gì đỏ lên, chỉ là một tấm ảnh bị cắt).
- **Future Risk**: thấp hôm nay, trung bình khi có công trình bè ngang.
- **Recommended Solution**: ⚠️ **ĐỪNG SỬA BÂY GIỜ** (Đàm chốt 2026-08-18). Sửa trước khi có ca
  hỏng là tự đặt một ngưỡng chưa hiệu chuẩn — đúng cái phễu Phase 9A. Khi ca ấy tới thì cách đúng
  là **giữ khoá khoảng cách làm mặc định và thêm một phép nới CHỈ khi bề ngang vượt khung**, chứ
  không đổi sang khoá theo bề ngang cho mọi công trình (làm vậy là mất lời hứa gốc ở 15/15 kỷ để
  chữa cho 1 kỷ).
- **Estimated Complexity**: Thấp.
- **Blocking Conditions**: không — chờ điều kiện xem lại.
- **Review Trigger**: ⚠️ **ĐIỀU KIỆN TƯỜNG MINH** — khi một công trình có bề ngang (`w` sau
  `BUILDING_SCALE`) vượt **quá chiều cao của chính nó**, hoặc khi thêm một loại công trình mới
  thuộc nhóm cầu/tường thành/sân vận động. Hai điều kiện ấy đếm được, không phải "khi nào thấy
  kỳ kỳ".
- **Owner**: chưa ai · **Status**: 🟡 MỞ — cố ý, làm cái hẹn cho một ca chưa xảy ra

---

## #46 — ✅ ĐÃ ĐÓNG (2026-08-18, ADR-035) — Chế độ cận cảnh ở những kỷ CAO ngả thành nhìn-từ-trên-xuống: kỷ 15 ngẩng 65,3°, tầng trệt gần như biến mất

- **Module**: `src/engine/city3d/cityFocus.js` (thứ tự chữa trong `planCityFocus`)
- **Priority**: Medium · **Severity**: Low
- **Impact**: chế độ cận cảnh sinh ra để Đàm NHÌN THẤY công sức của Phase 10 (tầng trệt: cửa ra
  vào, cửa lùa, bức bàn) và Phase 11 (mái). Ở những kỷ thấp nó làm được cả hai. Ở kỷ 15 (Dubai —
  thành phố cao nhất) lưới an toàn phải ngẩng camera lên **65,3°**, và ở góc ấy màn hình gần như
  chỉ còn MÁI: tường bị chính mái che, nên đúng nửa số chi tiết mới không tới được mắt. Ảnh nghiệm
  thu `.city-preview/city-era15-light-h12-focus1.png` cho thấy rõ.
- **Root Cause**: `planCityFocus` chữa va chạm theo thứ tự **ngẩng trước → lùi sau**, chọn vì
  "ngẩng giữ nguyên độ lớn của vật, lùi thì làm vật nhỏ đi". Lý lẽ ấy đúng về mặt số điểm ảnh và
  **bỏ sót một chiều khác**: ngẩng quá cao thì vật vẫn to nhưng ta không còn nhìn thấy MẶT ĐỨNG
  của nó nữa. Đo 1200 chuyến bay: 0 chuyến phải lùi, tức thứ tự này khiến cách chữa thứ hai **chưa
  bao giờ được dùng** — cái giá dồn hết vào góc nhìn.
- **Current Risk**: thấp — không sai chức năng, camera vẫn thoáng (1,06 ô ở kỷ 15, trên mức tối
  thiểu 1 ô), và 14/15 kỷ có góc dễ nhìn (34,4°–45°).
- **Future Risk**: trung bình. Kỷ mới cao hơn nữa sẽ đẩy góc lên sát trần `MAX_PITCH` (85,4°) —
  lúc đó cận cảnh thành ảnh chụp từ trực thăng, và **không có gì đỏ lên** vì mọi bài test hiện có
  chỉ đòi "thoáng", không đòi "còn nhìn thấy mặt đứng".
- **Recommended Solution**: một trong hai, **Đàm chọn** (đây là quyết định MỸ THUẬT, không phải kỹ
  thuật): (a) **đổi thứ tự** — lùi ra trước, ngẩng sau; vật nhỏ đi nhưng giữ được góc nhìn ngang,
  và ngân sách lùi có sẵn vì chưa dùng bao giờ. (b) **đặt trần góc ngẩng riêng cho chế độ cận
  cảnh** (ví dụ 50°), vượt trần thì chuyển sang lùi. Cách nào cũng phải đo lại đủ 1200 chuyến +
  chụp lại ảnh kỷ 15.
- **Estimated Complexity**: Thấp (một khối trong `planCityFocus` + đo lại).
- **Blocking Conditions**: cần Đàm chọn hướng — xem ảnh kỷ 15 rồi quyết "thà nhỏ hơn mà thấy mặt
  tiền" hay "thà to mà nhìn từ trên xuống".
- **Review Trigger**: khi thêm kỷ mới cao hơn kỷ 15, hoặc khi Đàm nói cận cảnh ở kỷ cao khó nhìn.
- **Owner**: đã xong · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-18** — Đàm chọn **(a) đổi thứ tự**, xem
  ADR-035.

### Đã đóng thế nào, và cái giá thật là bao nhiêu

`planCityFocus` nay chữa theo thứ tự **lùi ra (giữ nguyên góc) → ngẩng lên → đứng yên**.

| Đo lại sau khi đổi | Trước (ngẩng trước) | Sau (lùi trước) |
|---|--:|--:|
| góc ngẩng kỷ 15, ca thật của app | 65,3° | **34,4°** |
| số chuyến phải NGẨNG (75 chuyến ca thật) | 8 | **0** |
| số chuyến phải NGẨNG (1200 chuyến, 4 góc xuất phát) | 109 | **0** |
| số chuyến bị kẹt cứng | 0 | **0** |
| chỗ phải lùi xa nhất | — | 11,00 (kỷ 15) |
| tỉ lệ thu phóng tệ nhất | — | 0,664 (kỷ 11) |

⚠️ **Giá phải trả, nói thẳng**: 3 kỷ (11 · 14 · 15) nay có ca xấu nhất nằm **ngoài dải thu phóng
0,38–0,58** mà Đàm chốt ở ADR-034 — lần lượt 0,664 · 0,623 · 0,579. Dải ấy là một lời hứa về
*"công trình chiếm bao nhiêu khung hình"*, và ở ca phải lùi thì nó không giữ được. Đổi lại, lời hứa
*"còn nhìn thấy mặt đứng"* thì giữ được ở **15/15 kỷ**.

⚠️ **Và điều quan trọng nhất, đo bằng đối chứng chứ không suy luận**: việc lùi ra **KHÔNG làm mất
chi tiết**. Đo cùng một kỷ ở khoảng cách lý tưởng 7,5 rồi ở ca xấu nhất của nó, lệch trung bình cả
khung thay đổi trong khoảng **−0,72 … +2,14** — có kỷ còn TĂNG, vì lùi ra thì lọt vào khung nhiều
nhà hơn. **Không một kỷ nào tụt qua ngưỡng mắt vì lùi ra.** Đây chính là điều kiện Đàm đặt ra
(*"nếu một kỷ nào tụt xuống dưới 12 thì DỪNG và báo"*): số kỷ TỤT vì bản vá này là **0**.
⚠️ Nhưng phép đo ấy lôi ra một sự thật KHÁC và lớn hơn, không liên quan gì tới thứ tự chữa — xem
**#48**.

---

## #45 — 5/2160 chỗ bờ đất bên lề đường dốc hơn MỘT bậc thềm (giá phải trả của việc san đường)

- **Module**: `src/engine/city3d/terrain.js` (lượt 3 — SAN ĐƯỜNG) ↔ `src/engine/city3d/terrain.test.js`
- **Priority**: Low · **Severity**: Low
- **Impact**: sau khi đường được san thành dốc thoải (ADR-032), cao độ ô đường **không còn** là bội
  số nguyên của một bậc thềm. Ở hầu hết chỗ, phép trung-vị-ba giữ được cả hai lời hứa cùng lúc
  (phố không dốc quá Baldwin Street **và** bờ đất bên lề không dốc quá 1:1). Nhưng có **5 chỗ trên
  2160** (4 ở kỷ 5, 1 ở kỷ 7) mà hai lời hứa ấy **về mặt hình học không thể cùng đạt**: đường buộc
  phải đi qua giữa hai thềm cách nhau nhiều bậc trong một ô. Ở 5 chỗ đó **phố thắng, bờ đất chịu
  giá** — bờ dốc hơn một bậc thềm.
- **Root Cause**: bài toán bị ràng buộc quá chặt ở một số ô: mạng đường là hằng số (cột/hàng thứ 4),
  còn thềm bậc thì sinh từ trường nhiễu của từng kỷ. Có kỷ mà một ô đường rơi đúng vào chỗ trường
  nhiễu nhảy hai bậc liền. Không có phép làm mượt nào tránh được điều đó mà không phá một trong hai
  trần (phố hoặc bờ) — đây là ràng buộc, không phải sai số cần tinh chỉnh.
- **Current Risk**: rất thấp. Bờ đất dốc là thứ **có thật ngoài đời** (kè, ta-luy) và đã có `bệ kè`
  (`groundPlacement` trong `sceneGraph.js`) dựng khối đá che phần hụt, nên nó đọc ra như một bờ kè
  chứ không như một lỗi. 5/2160 = 0,2%.
- **Future Risk**: thấp, nhưng **sẽ tăng nếu có ai nâng `relief` hoặc `terraces` của một kỷ** — càng
  nhiều bậc trên cùng một quãng thì càng nhiều ô rơi vào ca không thể. Đã chặn bằng
  `assert.ok(soCho <= 5)` trong `terrain.test.js` (bài *SAN ĐƯỜNG KHÔNG ĐƯỢC ĐẨY ĐỘ DỐC SANG NGANG*)
  — con số 5 là **số đo hôm nay**, không phải một ngưỡng chọn tay, nên nó tự đỏ ngay khi có chỗ thứ
  sáu.
- **Recommended Solution**: nếu muốn về 0 thì phải cho ranh thềm **né** ô đường ở tầng sinh trường
  nhiễu (dịch mắt lưới sao cho ranh rơi vào giữa khối đất), tức đổi cách sinh địa hình chứ không
  phải thêm một lượt làm mượt nữa. ⚠️ **Đừng nới `assert.ok(soCho <= 5)`** — nới là mua một con số
  đẹp bằng cách bỏ phép đo, đúng thứ §4 cấm.
- **Estimated Complexity**: Trung bình (đổi tầng sinh trường nhiễu ⇒ đổi hình 15 kỷ ⇒ phải quét lại).
- **Blocking Conditions**: không có.
- **Review Trigger**: khi bài *SAN ĐƯỜNG KHÔNG ĐƯỢC ĐẨY ĐỘ DỐC SANG NGANG* đỏ, hoặc khi có phase
  chỉnh `relief`/`terraces` của bất kỳ kỷ nào.
- **Owner**: chưa phân công · **Status**: Open

---

## #44 — ✅ ĐÃ ĐÓNG (2026-08-18) — KHÔNG PHẢI NỢ, LÀ LỰA CHỌN: kỷ 4 là kinh thành trên đồng bằng

- **Module**: `src/engine/city3d/terrain.js` (bảng `ERA_TERRAIN`) ↔ `src/engine/city3d/terrain.test.js`
- **Priority**: Low · **Severity**: Low
- **Impact**: bài `kỷ khai TỪ 3 BẬC TRỞ LÊN thì không bậc nào được chiếm quá 60% số ô` là thứ canh
  bài học Phase 7B (*phân bố một trường nhiễu trên lưới nhỏ không tuân luật số lớn*). Kỷ 4 hiện ở
  **64%** — tức trường nhiễu của kỷ ấy vẫn dồn cục, và người chơi thấy một mảng phẳng chiếm gần hai
  phần ba thành phố thay vì ba thềm rõ rệt.
- **Root Cause**: ⚠️ **đây KHÔNG phải hồi quy do việc san đường.** Đo lại trên cây git ở `be261ef`
  (trước khi san) thì kỷ 4 **đã là 64%**. Bài test cũ xanh chỉ vì nó đếm **cả ô đường**: 80 ô đường
  trên 144 ô (56% lưới) nằm rải đều mọi bậc, nên chúng pha loãng phép đếm xuống dưới 60%. Sau khi
  tách ô đất ra đo riêng — việc bắt buộc, vì ô đường nay không còn là bội số của bậc thềm — con số
  thật lộ ra. Đúng hình dạng `TECH_DEBT #22`: **trung bình trên vùng quá rộng làm loãng tín hiệu.**
- **Current Risk**: thấp. Một kỷ hơi phẳng là chuyện mỹ thuật, không phải lỗi chạy; và 14/15 kỷ còn
  lại vẫn đạt.
- **Future Risk**: trung bình nếu bị bỏ quên — cách rẻ nhất để "sửa" là nới ngưỡng 60% lên 65%, và
  lúc ấy phép đo mất răng cho **cả 15 kỷ**. Đã chặn bằng cách ghi ngoại lệ ra **tường minh đếm
  được**: `assert.deepEqual(TRUOT, [4])` — kỷ thứ hai trượt thì đỏ ngay, mà kỷ 4 được sửa xong cũng
  đỏ (buộc phải xoá tên khỏi danh sách).
- **Recommended Solution**: chỉnh `noiseScale`/`shape` của riêng kỷ 4 rồi đo lại bằng chính bài test
  ấy; hoặc hạ `terraces` của kỷ 4 từ 3 xuống 2 nếu bảng chấp nhận (lúc đó bài test không áp cho nó
  nữa — nhưng phải hỏi *"kỷ này ĐÁNG có mấy thềm?"* trước, đừng hạ chỉ để hết đỏ).
- **Estimated Complexity**: Thấp (một dòng bảng + đo lại 15 kỷ).
- **Blocking Conditions**: không có.
- **Review Trigger**: khi `TRUOT` khác `[4]`, hoặc khi có phase chỉnh bảng `ERA_TERRAIN`.
- **Owner**: Đàm quyết 2026-08-18 · **Status**: ✅ **ĐÃ ĐÓNG — phân loại lại, không phải sửa**

### Vì sao đóng mà không sửa gì (ADR-032 bổ sung (b))

Đàm đặt đúng câu hỏi mà mục này chưa từng hỏi: ***"đây là thứ mình MẮC hay thứ mình CHỌN?"*** —
*"Nợ là thứ mình MẮC; cái này có thể là thứ mình CHỌN. Phân biệt hai cái đó, đừng để sổ nợ phình
bằng những lựa chọn có chủ ý."* Đi kiểm ý định trước khi đi sửa, và ba bằng chứng đều nói CHỌN:

1. **Bảng khai đúng như vậy.** `ERA_TERRAIN[4]` = `{ shape: 'valley', terraces: 3, relief: 0.60 }`
   kèm `note` nguyên văn *"kinh thành Trung Hoa trên ĐỒNG BẰNG, đồi thấp vây bốn phía"*. Trường An
   và Lạc Dương nằm trên bình nguyên Quan Trung / bồn địa Lạc Dương — đồng bằng có đồi thấp vây
   quanh. Một dải phẳng chiếm phần lớn mặt đất **chính là** câu ấy dịch sang hình học.
2. **Không mất bậc nào** — đây là dấu hiệu phân biệt quyết định. Kỷ 4 khai 3 bậc và **dùng đủ 3**:
   20% ở đáy lòng chảo · 64% ở dải đồng bằng · 16% ở vành đồi. Một trường nhiễu *sập* (bẫy Phase
   7B) thì mất bậc, hoặc dồn về một ĐẦU; ở đây dải đông nhất nằm ở **GIỮA**, có đất thấp hơn bên
   dưới và vành cao hơn bên trên. Đó là mặt cắt của một lòng chảo, không phải của một mặt phẳng.
3. **Kỷ 9 khai cùng một thứ và chỉ cách 6 điểm.** Kỷ 9 (`valley`, 3 bậc, *"lòng chảo sông Seine,
   gần phẳng"*) đo ra **58%** — cùng hình dạng phân bố, chỉ tình cờ nằm dưới vạch. Vạch 60% đang
   cắt ngang giữa hai kỷ mô tả **cùng một loại địa hình**, nên nó không phân biệt được "đồng bằng
   có chủ ý" với "địa hình sập".

**Không sửa một dòng mã nào.** Bài test giữ nguyên `assert.deepEqual(TRUOT, [4])` — vẫn là hàng
rào, chỉ đổi vai: từ *"một khuyết tật chờ sửa"* thành *"một ngoại lệ đã khai, đếm được"*, đỏ theo
cả hai chiều (kỷ thứ hai tụt xuống ⇒ đỏ; kỷ 4 hoá gồ ghề ⇒ cũng đỏ). Chú thích của bài test đã
viết lại cho khớp — **một lời giải thích sai là thứ phiên sau kế thừa rồi dựa vào**.

⚠️ **Ghi kèm cho trung thực**: ngưỡng 60% là một con số **CHỌN TAY** (bản đầu 70% cho cả 15 kỷ, hạ
xuống sau khi nó đòi bịa ra đồi ở Lưỡng Hà và thảo nguyên Nga), không phải con số đo được, và kỷ 9
chỉ đứng cách vạch 2 điểm. Thứ thật sự canh *"địa hình có sập không"* là bài **"MỌI KỶ PHẢI DÙNG ĐỦ
SỐ BẬC MÌNH KHAI"** — nó hỏi thẳng vào khuyết tật thay vì hỏi qua một tỉ lệ. Theo chỉ đạo của Đàm,
**KHÔNG thêm một ngưỡng thứ hai** bên cạnh nó (một ngưỡng chưa hiệu chuẩn đặt cạnh một ngưỡng có
gốc là đúng cái phễu Phase 9A).

---

## #43 — Số tam giác trong `PERFORMANCE.md` không có gì canh, và nó ĐÃ trôi ở 6/15 kỷ

- **Module**: `PERFORMANCE.md` (bảng số) ↔ `src/engine/city3d/*` + `src/components/city/render3d/*`
  (nguồn sinh ra số)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: `PERFORMANCE.md` là nơi DUY NHẤT trả lời *"thêm thứ này vào cảnh có nặng không?"*, và
  mọi quyết định "còn dư sức, thêm chi tiết đi" đều dựa vào nó. Đo lại đủ 15 kỷ ngày 2026-08-18 thì
  **6/15 kỷ sai**: kỷ 8 lệch −3.560 tam giác, kỷ 11 +3.776, kỷ 12 +4.160, kỷ 13 +3.776, kỷ 14
  +2.624, kỷ 15 +3.584; tổng lệch **+14.360**. Nguyên nhân: `e95cdf1` (Phase 11-B) sửa
  `roofStyle.js` — hình học thật — và không đụng `PERFORMANCE.md`.
- **Root Cause**: **cột lệnh vẽ có một bài test canh (`drawCallBudget.test.js`, bảng 15 mốc), cột
  tam giác thì không có gì cả.** Chỗ có test không trôi, chỗ không có test trôi — ngay trong cùng
  một bảng, cùng một phase. Đây đúng bài học đã ghi ở `CLAUDE.md`: *"một bài học được ghi ra KHÔNG
  chặn được gì; chỉ một bài TEST mới chặn được"*. Definition of Done có ghi "tài liệu đã đồng bộ",
  nhưng nó là một câu chữ, và một câu chữ thì không đỏ lên được.
- **Current Risk**: trung bình. Không hỏng gì lúc chạy, nhưng một con số ngân sách sai theo hướng
  **trấn an** (bảng ghi kỷ 11 = 50.114 trong khi thật là 53.890) là loại sai tệ nhất cho một đồng
  hồ đo — cùng hình dạng với vụ HUD thiếu 56% tam giác ngày 2026-08-17.
- **Future Risk**: trung bình-cao và TĂNG DẦN. Mỗi phase mới lại thêm một bảng "trước → sau"; càng
  nhiều bảng thì xác suất một bảng nào đó mô tả một commit đã chết càng cao, và không có cách nào
  phát hiện ngoài việc đo lại tay đủ 15 kỷ (≈15 phút Chromium mỗi lượt).
- **Recommended Solution**: ba hướng, chưa chọn.
  (1) **Một bài test THUẦN cho tam giác**, giống hệt cách `drawCallBudget.test.js` đã làm cho lệnh
  vẽ: hiện `countSceneTriangles` cần `three`, nhưng `collectCitySpecs` + `countTriangles` (`parts.js`)
  thì THUẦN. Cần thêm phần mặt đất/đường/vòm trời/rặng núi mới ra được số tổng — tức phải tìm một
  công thức thuần cho chúng, đúng kiểu `lệnh vẽ = họ vật liệu + 4` đã tìm được ở ADR-028.
  (2) **Bảng 15 mốc tam giác riêng từng kỷ** (không phải một trần chung — bẫy `TECH_DEBT #38`), đặt
  cạnh `MOC_LENH_VE`, có dung sai; rẻ hơn (1) nhưng vẫn cần (1) để tính được số.
  (3) **Chấp nhận + đổi cách viết tài liệu**: mọi bảng ghi rõ HAI commit nó so, và mỗi phase bắt
  buộc tự đo mốc nền (đã làm ở Phase 12 + đã thêm luật vào mục "Khi nào phải đo lại"). Rẻ nhất,
  nhưng vẫn là một câu chữ, tức vẫn không đỏ lên được.
- **Estimated Complexity**: (3) đã xong · (2) thấp một khi có (1) · (1) trung bình — chỗ khó là
  mặt đất/đường/chân trời, vì số ô con của chúng phụ thuộc `pavingSubdivision` và lưới địa hình.
- **Blocking Conditions**: không có blocker kỹ thuật. Nằm ngoài phạm vi Việc 1 (chỉ nhận hai nguyên
  nhân "đường lởm chởm") ⇒ ghi lại thay vì mở rộng phạm vi.
- **Review Trigger**: ngay trước phase kế tiếp có đụng hình học; hoặc khi có ai định trích một con
  số tam giác từ `PERFORMANCE.md` mà không tự đo lại.
- **Owner**: chưa ai · **Status**: MỞ, đã đo đủ số, hướng (3) đã áp dụng, (1)+(2) chưa làm

---

## #42 — ✅ ĐÃ ĐÓNG (2026-08-18, ADR-033) — Vỉa hè bị bóp trong im lặng trên ĐẠI LỘ ở 8/15 kỷ, kỷ tệ nhất chỉ còn 11% bề rộng đã khai

- **Module**: `src/engine/city3d/streetStyle.js` (`streetCrossSection`)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: `walk` là **một trong 8 trục bản sắc** của bảng mặt đường (ADR-025), nhưng trên đại lộ
  nó bị cái kẹp `walk ≤ 0,5 − half` nuốt gần hết ở hơn nửa số kỷ. Đo ngày 2026-08-18 (sau khi đã
  đặt `MAX_AVENUE = 0,96`):

  | kỷ | khai | dựng ra trên đại lộ | còn lại | trên ngõ |
  |---|--:|--:|--:|--:|
  | 12 (Nga) | 0,190 | 0,020 | **11%** | 100% |
  | 15 (UAE) | 0,180 | 0,020 | **11%** | 100% |
  | 9 (Pháp) | 0,170 | 0,030 | **18%** | 100% |
  | 14 (Singapore) | 0,200 | 0,050 | **25%** | 100% |
  | 11 (Mỹ) | 0,140 | 0,040 | **29%** | 100% |
  | 10 (Anh) | 0,150 | 0,110 | 73% | 100% |
  | 13 (Nhật) | 0,160 | 0,140 | 88% | 100% |
  | 4 (Trung Quốc) | 0,100 | 0,090 | 90% | 100% |

  Kỷ 12 khai `walk: 0,19` và `note` của nó viết nguyên chữ *"vỉa hè mênh mông"* — con số và lời
  giải thích cùng bị bóp còn một phần chín, **không có gì đỏ lên**. Đúng hình dạng bẫy `MIN_STONE`
  (Phase 9D) và bẫy Phase 7D: một giá trị khai ra rồi bị một cái kẹp ở nơi khác nuốt mất.
- **Root Cause**: vỉa hè bị buộc phải nằm **trong đúng một ô lưới** cùng với lòng đường, nên tổng
  `half + walk ≤ 0,5` là một ràng buộc cứng. Đại lộ càng rộng thì chỗ còn lại càng ít, và ở những
  kỷ hiện đại (đại lộ rộng **và** vỉa hè rộng — đúng đặc điểm lịch sử của chúng) hai vế chọi nhau
  trực diện. Ngoài đời, đại lộ Haussmann rộng *và* có vỉa hè rộng vì cả mặt cắt phố rộng ra; ở đây
  mặt cắt bị khoá cứng bằng một ô.
- **Current Risk**: thấp về kỹ thuật (không hỏng gì, không lệnh vẽ mới), trung bình về giá trị: một
  trục bản sắc đang chỉ sống ở các **ngõ**, còn ở đại lộ — chỗ mắt nhìn nhiều nhất — thì gần như
  không phát biểu được. Bài `15 KỶ RA 15 MẶT ĐƯỜNG` vẫn xanh vì nó đọc **bảng khai**, không đọc
  thứ dựng ra ⇒ hiện KHÔNG có gì canh chỗ này.
- **Future Risk**: trung bình. Thêm một kỷ mới khai đại lộ rộng + vỉa hè rộng sẽ lặng lẽ rơi vào
  cùng cái kẹp, và người thêm sẽ tưởng mình vừa khai một đặc điểm mới.
- **Recommended Solution**: ba hướng, chưa chọn.
  (1) **Cho vỉa hè lấn sang ô ĐẤT bên cạnh** khi ô ấy không phải công trình — đúng như ngoài đời
  (vỉa hè thuộc lộ giới, không thuộc lòng đường). Đắt nhất: phải biết ô bên cạnh là gì, tức lại là
  một phép hỏi hàng xóm như `carriagewayShape`.
  (2) **Từ chối thẳng ở `isValidStreetStyle`**: `avenue/2 + walk ≤ 0,5`, buộc bảng khai ra thứ dựng
  được. Rẻ nhất, trung thực nhất, nhưng ép 8 kỷ phải hạ một trong hai con số — tức đổi bản sắc.
  (3) **Chấp nhận + ghi thành lời hứa tường minh** ("vỉa hè là đặc điểm của NGÕ, không phải của đại
  lộ") và thêm test khoá điều đó, để nó thôi là một khuyết tật vô danh.
  ⚠️ Cả ba đều đụng bản sắc 15 kỷ ⇒ là **quyết định mỹ thuật**, không tự chọn.
- **Estimated Complexity**: (2) và (3) thấp (một buổi); (1) trung bình — cần dữ liệu ô hàng xóm và
  phải nghĩ lại ai sở hữu phần đất giáp ranh.
- **Blocking Conditions**: ⛔ **CHỜ ĐÀM QUYẾT** (mục 5 ca 6 — quyết định mỹ thuật). Nằm ngoài phạm
  vi Việc 1, vốn chỉ nhận hai nguyên nhân "đường lởm chởm".
- **Review Trigger**: khi Đàm trả lời; hoặc ngay khi có ai định thêm/sửa một dòng `walk` trong
  `STREET_STYLES`.
- **Owner**: Đàm quyết 2026-08-18 · **Status**: ✅ **ĐÃ ĐÓNG** — chọn phương án (2) "từ chối thẳng",
  kèm một luật mà cả ba phương án cũ đều thiếu: **nới cho vượt ngưỡng nhìn thấy được, HOẶC khai
  thẳng `walk: 0` — không có gì ở giữa.**

### Đã đóng thế nào (2026-08-18, ADR-033)

Sửa được nhờ nhìn ra một chuyện lớn hơn cái kẹp: **`avenue` đang được VIẾT như thể nó trả lời câu
"đại lộ này oai tới đâu", trong khi mã ĐỌC nó là "bao nhiêu phần mặt cắt dành cho XE".** Ngoài đời
hai câu ấy gần như ngược nhau — Champs-Élysées rộng 70m thì **21m mỗi bên là vỉa hè**, tức hơn 60%
mặt cắt dành cho người đi bộ. Nên khai Paris `0,94` không phải "chật quá không đủ chỗ", mà là **sai
lịch sử**. Sửa bảng, mỗi dòng kèm một mặt cắt có thật:

| kỷ | avenue T→S | walk khai T→S | **dựng ra** T→S | điểm ảnh T→S |
|---|--:|--:|--:|--:|
| 4 Trung Quốc | 0,82 → 0,80 | 0,10 → 0,08 | 0,09 → **0,08** | 5,8 → 5,1 |
| 9 Pháp | 0,94 → **0,54** | 0,17 → 0,22 | 0,03 → **0,22** | 1,9 → **14,1** |
| 10 Anh | 0,78 → 0,78 | 0,15 → 0,10 | 0,11 → **0,10** | 7,0 → 6,4 |
| 11 Mỹ | 0,92 → **0,62** | 0,14 → 0,17 | 0,04 → **0,17** | 2,6 → **10,9** |
| 12 Nga | 0,96 → **0,70** | 0,19 → 0,14 | 0,02 → **0,14** | 1,3 → **9,0** |
| 13 Nhật | 0,72 → 0,72 | 0,16 → 0,12 | 0,14 → **0,12** | 9,0 → 7,7 |
| 14 Singapore | 0,90 → **0,54** | 0,20 → 0,19 | 0,05 → **0,19** | 3,2 → **12,2** |
| 15 UAE | 0,96 → **0,84** | 0,18 → 0,07 | 0,02 → **0,07** | 1,3 → **4,5** |

**Kết quả: 0/15 kỷ bị kẹp** (trước 8/15) · **0/15 kỷ dưới ngưỡng mắt** (trước 5/15). Vỉa hè dựng ra
nay bằng ĐÚNG con số khai ở cả 15 kỷ. Kỷ 15 (UAE) là kỷ hiện đại nhất mà vỉa hè HẸP nhất bảng —
đó là sự thật về Dubai: Sheikh Zayed Road là trục 12+ làn bắc qua bằng cầu bộ hành, còn chỗ đi bộ
tử tế thì nằm ở các promenade riêng (Mohammed Bin Rashid Boulevard, The Walk at JBR) và đều CÓ MÁI
CHE — một thiết bị chống 45°C, khác hẳn cái trottoir Paris làm ra để kê bàn cà phê.

⚠️ **Bài học lớn hơn cái lỗi** — bài test canh trục này đọc **thứ đã KHAI** (`s.walk`) chứ không đọc
**thứ đã DỰNG** (`streetCrossSection().walk`), nên nó xanh suốt nhiều tháng về một con số chưa bao
giờ tới được mắt Đàm. Hai con số hiệu chuẩn (`CELL_PIXELS`, `EYE_PIXELS`) khi ấy chỉ là bản chép tay
nằm trong file test, còn mã sản phẩm không biết chúng tồn tại ⇒ `isValidStreetStyle` **không thể**
canh ngưỡng mắt dù có muốn. Nay cả hai `export` từ `streetStyle.js` và bài test `import` về — một
luật một công thức. Xem `CLAUDE.md`.

⚠️ **Vì sao mục này ra đời trong lúc sửa một việc khác**: đi tìm nguyên nhân "đường lởm chởm" thì
phát hiện `avenue: 1.00` của kỷ 12/15 làm vỉa hè **bằng 0 tuyệt đối**. Phần ấy đã sửa trong ADR-031
(vì nó chặn chính lời hứa "hết bậc"), nhưng nó chỉ kéo hai kỷ ấy từ 0% lên 11% — bệnh gốc thì rộng
hơn và nằm ngoài phạm vi. Ghi lại thay vì mở rộng phạm vi, đúng luật `CLAUDE.md`.

---

## #41 — ✅ ĐÃ ĐÓNG (2026-08-18) — Chi tiết mái KHÔNG sống sót tới thang bản quét: 90/90 ô dưới ngưỡng mắt

- **Module**: `src/engine/city3d/rooftop.js` + `roofStyle.js` (kích cỡ), `scripts/sweep-diff.mjs` (đo)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: Phase 11 thêm **110.076 tam giác (+20,6%)** lên mái, và ở **thang bản quét 15 kỷ ×
  6 chặng thì gần như không thấy gì**: 90/90 ô dưới ngưỡng mắt 12, trung vị **2,2**, ô đổi mạnh
  nhất (kỷ 7 @ 12h) mới 10,6. Đây chính là điều kiện nghiệm thu Đàm đặt ra cho phase — *"nếu hai
  bản quét vẫn khó phân biệt thì phase này CHƯA đạt mục tiêu của nó"* — nên phải ghi là **CHƯA
  ĐẠT**, không phải "đạt có bảo lưu".
- **Root Cause**: hai nguyên nhân độc lập, và cái thứ hai mới là cái sâu. **(a) Kích cỡ**: vật trên
  mái bị kẹp bởi `STACK_W_MAX_RATIO = 0,3` và `STACK_W_MIN = 0,055`, cỡ ấy chọn để không thành "cây
  nấm" khi nhìn gần, nhưng ở thang quét (một thành phố ≈ 300 × 186 điểm ảnh) thì một cái ống khói
  rộng 0,3 lần bề ngang mái chỉ còn **vài điểm ảnh**. **(b) Loại chi tiết**: đo theo từng kỷ thì
  thứ sống sót là thứ phá **ĐƯỜNG VIỀN** mái (`dormer` kỷ 9 = 5,3% ở khung app · `balustrade` kỷ 7
  = 8,4%), còn thứ chỉ thêm **BỀ MẶT** thì tan biến — kỷ 8 tốn nhiều hình học nhất (**+48,5%** tam
  giác, ngói bò `barrel`) mà đổi **ít nhất (1,2%)**. Ngói bò là những cục nhỏ lặp lại: đắt nhất về
  khối, rẻ nhất về thứ mắt đọc được ở xa.
- **Current Risk**: thấp về mặt kỹ thuật (không có gì hỏng, không có lệnh vẽ mới, hiệu năng vẫn nằm
  sâu trong vùng rẻ), **cao về mặt giá trị**: một phase đã tiêu hết ngân sách hình học của nó mà
  Đàm mở app ra vẫn thấy gần như y cũ. Ở khung app thì có thấy (1,2–8,4% điểm ảnh), nhưng bản quét
  — chỗ DUY NHẤT đặt 15 kỷ cạnh nhau — thì không.
- **Future Risk**: trung bình-cao **nếu không quyết**. Phase 12 sẽ lại thêm chi tiết lên cùng những
  bề mặt ấy; nếu không biết "thứ gì sống sót ở xa" thì nó sẽ lặp lại đúng kết quả này với một ngân
  sách nữa. Ngược lại, phóng đại vật trên mái mà không có gác tỉ lệ sẽ dựng lại bẫy **"cây nấm"** —
  Phase 7C đã trả giá một lần vì `eaves` là số tuyệt đối áp lên những khối chênh nhau vài lần.
- **Recommended Solution**: KHÔNG phải "nhân mọi thứ lên cho to". Ba hướng, theo thứ tự ROI đo được:
  (1) **ưu tiên thứ phá đường viền** — nâng `crown` (lan can, đầu đao, sống mái nổi) và `dormer` ở
  những kỷ đang chỉ có `stack`, vì đó là loại chi tiết đã ĐO ra là sống sót; (2) **nâng trần tỉ lệ
  của riêng vật cao** (bể nước, lồng thang máy, cột ăng-ten — thứ nhô lên khỏi đường viền mái) chứ
  không nâng đều mọi `stack`; (3) chấp nhận rằng chi tiết mái là phần thưởng khi nhìn GẦN và ghi
  điều đó thành lời hứa tường minh, thay vì để nó là một thất bại không tên. **Cả ba đều là quyết
  định MỸ THUẬT ⇒ phải Đàm chọn.**
- **Estimated Complexity**: thấp cho (1) và (2) — bảng đã có sẵn cả hai trục, sửa là sửa giá trị
  trong `roofStyle.js` cộng nới `STACK_W_MAX_RATIO`; phần tốn là chụp + đo lại 15 kỷ (~12 phút).
- **Blocking Conditions**: ⛔ **CHỜ ĐÀM QUYẾT** — mục 5 ca 6 của chương trình làm việc (quyết định
  mỹ thuật với độ tự tin dưới 80%). Tuyệt đối không tự phóng to rồi báo "đã đạt".
- **Review Trigger**: ngay khi Đàm trả lời; hoặc trước khi Phase 12 bắt đầu thêm bất cứ chi tiết
  nào lên mái/tường, vì cùng câu hỏi sẽ lặp lại.
- **Owner**: đã xong · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-18** (xem mục "ĐÓNG NGÀY 2026-08-18" bên
  dưới; phần chưa giải chuyển sang `#48`) — VIỆC 2
  (2026-08-18, ADR-034) chọn một hướng thứ TƯ mà mục này chưa liệt kê: **không phóng to chi tiết,
  mà đưa MẮT lại gần** (chạm vào công trình → camera bay tới, khoảng cách 7,5). Đo được: cùng thay
  đổi mã ấy, lệch trung bình cả khung đi từ **5,54 (dưới ngưỡng mắt 12)** ở khung toàn cảnh lên
  **15,45 (trên ngưỡng)** ở khung cận cảnh. ⚠️ **Câu chữ của mục này vẫn ĐÚNG và vì vậy chưa đóng**:
  chi tiết mái vẫn KHÔNG sống sót tới thang **bản quét** (mỗi thành phố ~300 điểm ảnh), và sẽ không
  bao giờ sống sót tới thang đó. Cái đã đổi là **nó không còn cần phải sống sót tới đó nữa**. Ba
  phương án (1)(2)(3) ở trên còn nguyên giá trị nếu Đàm muốn chi tiết đọc được ngay ở khung mặc
  định — nhưng nay chúng là *thêm*, không phải *cứu*.

### ĐÓNG NGÀY 2026-08-18 — ghi CẢ HAI NỬA, vì mỗi nửa là một kết luận khác nhau

**NỬA ĐÃ GIẢI:** chi tiết Phase 10–11 **có** vượt ngưỡng mắt khi camera lại gần — nhưng **chỉ ở
4/15 kỷ**, không phải cả 15 như bản ghi trước của mục này (VIỆC 2) để người đọc tưởng. Đo lần đầu
đủ 15 kỷ, cùng một dòng lệnh, `b98a47d` → `e95cdf1`, lệch trung bình cả khung ở khoảng cách cận
cảnh: kỷ 7 = **15,52** · kỷ 9 = **15,45** · kỷ 11 = **12,61** · kỷ 13 = **12,20** (bốn kỷ trên
ngưỡng 12); 11 kỷ còn lại từ **0,71** (kỷ 1) tới 11,19 (kỷ 8). Con số 15,45 mà VIỆC 2 khoe là kỷ 9
— **một mẫu, đọc thành luật của cả tập**, đúng hình dạng đã sinh ra `#38`.

**NỬA VĨNH VIỄN KHÔNG GIẢI (kết luận cuối, KHÔNG phải việc còn tồn):** ở **thang bản quét** thì chi
tiết mái sẽ **không bao giờ** đọc được, và đó không phải một thất bại cần chữa. Mỗi thành phố trong
bản quét rộng ~300 điểm ảnh, mỗi căn nhà cao 40–60 điểm ảnh, nên mọi chi tiết cỡ ống khói còn 3–5
điểm ảnh — **bất kể nó nằm trên mái hay dưới đất**. Từ nay bản quét chỉ dùng để canh
**KHÔNG-TRÔI** (15 kỷ còn phân biệt được với nhau không), không dùng để chứng minh một phase chi
tiết có tác dụng.

### ⚠️ LUẬT MỚI CHO MỌI PHASE SAU (Đàm chốt 2026-08-18)

> **Trước khi thêm bất kỳ chi tiết nào, trả lời trước: nó dành cho khung TOÀN CẢNH hay khung CẬN
> CẢNH? Chi tiết cỡ dưới ~12 điểm ảnh ở toàn cảnh thì chỉ đáng làm nếu nó phục vụ cận cảnh.**

Hệ quả thực hành, đã đo trên chính Phase 11: thứ sống sót ở xa là thứ đổi **ĐƯỜNG VIỀN** (lan can
kỷ 7 → 8,4% · cửa sổ mái kỷ 9 → 5,3%), không phải thứ thêm **BỀ MẶT** (ngói bò kỷ 8 tốn nhiều hình
học nhất bảng, **+48,5%** tam giác, mà chỉ đổi **1,2%**). Nên câu hỏi thứ hai luôn là: *"cái này
đổi đường viền hay đổi bề mặt?"*

**Phần chưa giải được chuyển sang `#48`** — nó là một câu hỏi KHÁC (*"vì sao 11 kỷ có quá ít thứ để
mà nhìn"*), không phải phần còn lại của câu hỏi này.

⚠️ **Bài học đi kèm, đáng giá hơn cả mục nợ này**: bản quét là thang NHỎ NHẤT dự án có, và nó
**không phải** thang Đàm dùng app. Một thay đổi có thể thật ở khung app mà chết ở bản quét (đúng ca
này), hoặc ngược lại. `sweep-diff.mjs` nay có **hai chế độ** (`--sweep` mặc định và `--frame`) dùng
CHUNG đơn vị + ngưỡng, để hai con số đặt cạnh nhau được. **Đọc cả hai, đừng chọn con số dễ nghe.**

---

## #40 — `parts.js` chỉ xoay được quanh trục ĐỨNG, nên ngói ống là một phép XẤP XỈ chứ không phải hình thật

- **Module**: `src/engine/city3d/parts.js` (nhà máy hình học) · biểu hiện ở `rooftop.js` (`emitBarrel`)
- **Priority**: Low · **Severity**: Low
- **Impact**: `prism()` nhận `ry` (xoay quanh trục đứng) nhưng KHÔNG có `rx`/`rz`. Ngói ống thật
  là những ống bán trụ **nằm nghiêng theo chiều dốc mái**; không nghiêng được khối thì Phase 11
  dựng bằng **đầu ngói ở diềm + cuộn nóc**, tức mắt đọc ra "mái này lợp ngói ống" từ hai đầu chứ
  không thấy các cuộn chạy dọc mặt dốc.
- **Root Cause**: quyết định kiến trúc cũ của nhà máy hình học — một trục xoay đủ cho mọi thứ đứng
  trên mặt đất, và thêm trục làm ma trận biến đổi phức tạp hơn cho MỌI khối của cả thành phố.
- **Current Risk**: thấp. Ở cỡ bản quét (một thành phố ≈ 300px) sự khác biệt không đọc được; ảnh
  cận cảnh 1500px thì thấy được, nhưng hình hiện tại vẫn kể đúng câu chuyện vật liệu.
- **Future Risk**: thấp–trung bình. Nếu một phase sau hạ camera xuống gần mái, hoặc thêm kiểu mái
  cần khối nghiêng (mái vòm có gân, cầu thang ngoài trời, mái hắt), thì thiếu `rx`/`rz` sẽ chặn
  nhiều thứ cùng lúc chứ không riêng ngói ống.
- **Recommended Solution**: thêm `rx`/`rz` vào `prism()` và nhân ma trận theo thứ tự cố định
  (`rz → rx → ry`), có test khoá thứ tự ấy. ⚠️ Đây là thay đổi chạm vào MỌI khối của thành phố ⇒
  phải quét lại 15 kỷ × 6 chặng và đo lại tam giác; **không được làm kèm một phase mỹ thuật**, vì
  lúc ấy không tách được "đổi vì nhà máy hình học" khỏi "đổi vì mỹ thuật".
- **Estimated Complexity**: Trung bình.
- **Blocking Conditions**: nên có một phase riêng, không gộp.
- **Review Trigger**: khi có phase cần khối nghiêng, hoặc khi camera xuống gần mái.
- **Owner**: chưa phân công · **Status**: Open

---

## #38 — ✅ ĐÃ ĐÓNG (2026-08-18) — Trần "13 lệnh vẽ" là con số suy từ MẪU 3 KỶ, và kỷ 10 nằm ngoài nó

- **Module**: `src/engine/city3d/materials.js` (bảng `MATERIAL_ORDER`) · `eraStyle.js` (vai vật liệu
  của kỷ 10) · `PERFORMANCE.md` (chỗ phát biểu cái trần)
- **Priority**: **Low-Medium**
- **Severity**: **Low** — không phải lỗi hiệu năng, là lỗi **của một con số nghiệm thu**.
- **Impact**: Ràng buộc "không quá 13 lệnh vẽ" là một trong sáu mục cổng nghiệm thu Đàm đặt ra cho
  cả chương trình Phase 10–12. Một cổng mà **thực tế đã vượt sẵn từ trước khi chương trình bắt đầu**
  thì hoặc sẽ báo đỏ oan ở mọi phase sau (và bị nới dần cho tiện — đúng cái phễu Phase 9A), hoặc bị
  ngó lơ và mất luôn tác dụng.
- **Root Cause**: Bảng "Sau Phase 10" bản đầu đo **ba kỷ** (6 · 9 · 13 → 13 · 12 · 11 lệnh vẽ cả
  cảnh) rồi con số cao nhất trong ba ấy được viết ra như **luật của cả 15 kỷ**. Đo đủ 15 kỷ lần đầu
  tiên (2026-08-18) ra kỷ 10 = **14**. Kỷ 10 (Anh, thời công nghiệp) là kỷ **duy nhất** dùng cùng
  lúc cả `brick` lẫn `slate`, cộng `glass` · `stone` · `wood` ⇒ 5 họ vật liệu riêng phần thành phố,
  nhiều hơn mọi kỷ khác đúng một họ.
  ⚠️ Đây **KHÔNG phải hồi quy của Phase 10**: đo trên `HEAD` (trước Bước 2) cũng ra **14**. Cùng
  hình dạng với bài học *"một ngân sách tự tính mà chưa bao giờ được đặt cạnh sự thật thì không phải
  ngân sách"* — cái trần chưa bao giờ được kiểm với cả 15 kỷ, nó chỉ được kiểm với **chính cái mẫu
  đã sinh ra nó**.
- **Current Risk**: **Thấp.** Mô hình chi phí đo trên M3 nói 80% chi phí đi theo ĐIỂM ẢNH; một lệnh
  vẽ thêm trong một cảnh 12–14 lệnh vẽ nằm dưới mức phép đo phân giải được. Không có triệu chứng
  nào Đàm nhìn thấy.
- **Future Risk**: **Trung bình.** Phase 11 (mái) sẽ đụng đúng tầng vật liệu này. Nếu để nguyên,
  phase ấy sẽ hoặc phải làm việc với một cổng đã đỏ sẵn, hoặc vô tình được miễn cổng.
- **Recommended Solution**: ⚠️ **Đề xuất ban đầu của tôi — "ghi trần là 14" — ĐÃ BỊ ĐÀM BÁC, và
  anh đúng.** Lý do anh nêu: *"14 kỷ khác đang ở 11–13, nên trần chung 14 cho chúng ba lệnh vẽ
  trống để trôi vào trong im lặng. Cổng chỉ bắt được kỷ tệ nhất."* Đó chính là bẫy Phase 7D — **một
  con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ**; lời hứa thật không phải "≤ 13" mà
  là *"kỷ này không được tốn hơn chính nó hôm nay"*.
  ⇒ **Giải pháp đã làm: MỘT BẢNG 15 MỐC RIÊNG**, mỗi mốc là số đo của chính kỷ ấy.
  ❌ **KHÔNG** gộp `brick` với `slate` để lấy lại con số 13: hai vật liệu ấy khác nhau thật, và mua
  một con số đẹp bằng cách nói dối vật liệu chính là thứ `ADR-025` đã cấm với mặt đường.
- **Estimated Complexity**: Thấp (một mục tài liệu + một bài test thuần).
- **Blocking Conditions**: (đã gỡ) — hoá ra **không cần đụng `materials.js` một dòng nào**: cổng
  mới chỉ ĐỌC bảng vật liệu, không sửa nó, nên nó nằm gọn trong `src/engine/city3d/*` mà §3 cho
  phép. Cái tưởng là blocker thật ra là hệ quả của việc đề xuất sai giải pháp.
- **Review Trigger**: (đã tới) Trước Phase 11 (mái) — và đã xử lý xong trước khi Phase 11 bắt đầu.
- **Owner**: Việc 1 của chương trình "CHỐT #38 + DỌN QUY ƯỚC + VÀO PHASE 11".
- **Status**: ✅ **ĐÓNG 2026-08-18.**

### Đã làm gì để đóng

1. **`src/engine/city3d/drawCallBudget.test.js`** (mới, 4 bài) — bảng `MOC_LENH_VE` 15 dòng, mỗi
   dòng là số đo ngày 2026-08-18 kèm **lệnh đo chép sẵn trong chú thích** để phiên sau tái lập được:
   `node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow`.
   | Kỷ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
   |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
   | Mốc (thành phố) | 9 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 10 | **12** | 10 | 10 | 10 | 10 | 10 |
2. **ĐỐI CHỨNG bắt buộc** (Đàm: *"Không có đối chứng thì không biết bài test có còn răng hay
   không"*): kéo thêm một họ vật liệu vào một kỷ ⇒ **đúng kỷ ấy** phải vượt mốc, và vượt **đúng 1**.
   Hỏi từng kỷ một, không hỏi tổng.
3. **Bài chống "trần chung đội lốt"**: cách rẻ nhất để bài 1 hết đỏ là điền cả 15 dòng cùng một số;
   bài này đòi khoảng trải ≥ 2 và ≥ 10/15 kỷ nằm dưới mốc cao nhất.
4. **Bài khoá quan hệ nền** `lệnh vẽ thành phố = (số họ vật liệu) + 4` — đúng **15/15 kỷ, không một
   ngoại lệ**. Đây là thứ cho phép cả bộ chạy trong `npm test` bằng `node --test`, không cần
   Chromium. Hằng số 4 = nền ô lưới · mặt đường · thân cư dân · đầu cư dân, và nó là **hiệu số đo
   được**, không phải kết quả đếm bằng mắt trong `sceneGraph.js`.
5. **`src/engine/city3d/cityParts.js`** (mới) — trả lời câu *"thành phố kỷ N gồm những khối nào?"*
   ở đúng MỘT nơi. Trước đó câu ấy nằm giữa thân `sceneGraph.js` nên mọi thứ muốn hỏi đều phải chép
   lại, và một bài test đã chép rồi chép sai. Nay `sceneGraph.js` gọi nó để DỰNG, bài test gọi nó
   để ĐO. Đàm: *"Đừng cố khoá hai bản chép cho khớp nhau — hãy làm cho chỉ còn một bản."*
6. **Tài liệu đã sửa**: `PERFORMANCE.md` (mục "Sau Phase 10" — bỏ hẳn phát biểu "không quá 13", thay
   bằng bảng 15 mốc + cách khoá), `ARCHITECTURE_DECISIONS.md` (ADR-028), `PROJECT_STRUCTURE.md`,
   `BAN_GIAO.md`, `CLAUDE.md`.

### 12 phép thử ngược (mỗi bài test mới đều đã thấy ĐỎ ở đúng chỗ dự đoán trước)

Phá `role:'stone'` → `'water'` · điền cả 15 mốc = 12 · `TAM_CO_DINH` 4→5 · `collectCitySpecs` trả
rỗng · đối chứng chọn họ ĐÃ CÓ · bảng 14 dòng bằng nhau + 1 dòng lệch · `NHIP_SESSIONS` còn một
dòng · `SWEEP_MAX` 150→0 · `kieuNhaDan` trả rỗng · đối chứng dùng nhịp già thay nhịp trẻ · nới kẹp
cấp `Math.min(3,…)` → `Math.min(9,…)` · cắt bớt danh sách cấp thử. **Cả 12 đều đỏ đúng câu assert
đã nêu trước khi chạy.**
