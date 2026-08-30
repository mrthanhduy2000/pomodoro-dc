> Cập nhật lần cuối: **2026-08-30 (vòng 8)** — **RÀNG BUỘC MỚI CỦA ĐÀM: "không đụng tới những gì
> thuộc Thành Phố"**, và "không đo, phải làm liên tục". Vòng này vì vậy làm ở bốn màn còn lại.
>
> **Phát hiện lớn nhất, đo bằng ảnh chụp 390px THẬT:** ở màn **Tập trung** — màn Đàm mở nhiều nhất —
> đồng hồ `25:00` nằm ở y≈1325 trên trang cao 1690, tức **thứ duy nhất Đàm mở app để làm đang nằm
> dưới nếp gấp**, nút bắt đầu bị thanh tab che hẳn. Phía trên nó, "hôm nay làm 0 phiên" được nói
> **BA lần** (ô "PHIÊN 0" ở thanh đầu · câu "Bạn chưa chốt phiên nào trong hôm nay" · dòng "Phiên
> 0/5 hôm nay" dưới đồng hồ). Bản thứ ba là bản TỐT NHẤT vì nó có mẫu số ⇒ hai bản kia nhường.
>
> **Bốn chỗ "nói lần thứ hai" đã gỡ:** dòng nhãn "NGÀY HÔM NAY · CHỦ NHẬT" (màn Tập trung) · ô
> "Phiên" ở thanh đầu · nhãn "HÔM NAY"/"CHUỖI TUẦN" (màn Nhiệm vụ) · nhãn "TIẾN TRÌNH"/"CÂY KỸ
> NĂNG" (màn Hành trang). Cộng một dòng đổi VAI: "6.000 XP/cấp · 2 SP mỗi cấp" (luật chơi, bất
> biến) → "Còn 3.555 XP nữa lên cấp 6 → +2 SP" (đếm ngược tới phần thưởng, đổi sau mỗi phiên).
>
> **⚠️ MỘT LỖI THẬT, IM LẶNG Ở MỌI CỔNG.** Cả **ba** câu mô tả thẻ "Thưởng trọn ngày" dài 32–34 ký
> tự trong khi ô chứa chúng là một dòng `truncate` ⇒ cả ba hiện ra cụt: «Còn 123 XP từ các mục …».
> Hợp đồng "đúng một dòng" ĐÃ ĐƯỢC GHI trong chú thích `RewardCard`, và nó vẫn hỏng — đúng luật
> *một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn được*. Nay copy nằm ở
> `src/components/dailyBonusCopy.js` với `dailyBonusCopy.test.js` (4 bài, đã thử-cho-đỏ) canh độ
> dài, kể cả ca XP 5 chữ số.
>
> **⚠️ MỘT BẢN VÁ "CHO GỌN" LẠI TỐN THÊM CHỖ — và chỉ ảnh chụp thấy.** Bản đầu gộp hai ô thành
> «0 phiên · 0 phút»; ở 390px chuỗi ấy xuống hai dòng làm cả hàng CAO THÊM. Lint xanh, test xanh,
> build xanh. ⇒ *mọi thay đổi bố cục phải chụp lại ở 390px THẬT trước khi tin.*
>
> **Đã đo và ĐÓNG một hướng (trước khi Đàm ra ràng buộc mới):** trần cảnh vật rải rác của
> `TECH_DEBT #14`. Bản đồ thành phố **đứng yên vĩnh viễn từ phiên 44–88 tuỳ kỷ (trung vị 78)**,
> mà Đàm đang ở phiên ~130. Thứ bão hoà SAU CÙNG là **đường**, không phải cảnh vật (cảnh vật chạm
> trần từ phiên 1–38). Ô đất trống ở phiên 130 còn **8–70 ô** ⇒ kết luận Phase 8D ("lưới kín
> 144/144") KHÔNG còn đúng sau Phase 20. Cảnh vật chỉ tốn ~170 tam giác/vật (cư dân 1.808) nên
> trần hiệu năng còn rộng — **nhưng nới trần nào cũng chỉ dời điểm bão hoà thêm vài chục phiên**,
> y hệt bài học cư dân (nới 28→32 mua được 24 phiên). ⇒ **cả ba trần trong #14 đều là cần gạt SAI**;
> thứ chữa được phải là cơ chế KHÔNG bão hoà theo tổng số phiên. Vẫn là quyết định của Đàm.
>

---

> Cập nhật lần cuối: **2026-08-29 (đêm, vòng 5–6)** — **ĐẾM NGƯỢC CÓ TRẦN** · **GỢI Ý MỤC TIÊU
> GẦN ĐÂY** · **Ô "CÔNG TRÌNH" NÓI RA MỐC.**
>
> **⚠️ MỘT BẢN VÁ CỦA CHÍNH PHIÊN NÀY ĐI NGƯỢC MỤC TIÊU, VÀ ẢNH CHỤP BẮT ĐƯỢC.** Dòng đếm ngược
> vừa làm in ra *"Còn ~64 phiên nữa tới «Thương Mại Toàn Cầu»"*. Nó sinh ra để tạo động lực, nhưng
> một cái đích xa tới mức ấy **làm NẢN chứ không kéo** — và nó chiếm đúng chỗ mà một câu cổ vũ đáng
> lẽ đứng. ⇒ `STAGE_COUNTDOWN_MAX_SESSIONS = 12` (≈ 4–6 ngày ở nhịp thường); xa hơn thì IM LẶNG.
> Hệ quả có chủ đích: dòng chỉ hiện ở **một phần ba cuối mỗi chặng** — đúng lúc thúc một cái là
> tới. ⚠️ Trần chỉ áp cho con số PHIÊN: chưa đủ mẫu để biết nhịp thì vẫn nói bằng EP, vì chặn cả
> ca đó là làm người mới mất cái đích ngay lúc cần nó nhất.
> **Bài học**: *một cơ chế tạo động lực có thể quay ra làm nản khi con số nó in ra vượt ngưỡng với
> tới được — và chỉ ẢNH CHỤP mới cho thấy điều đó, vì test chỉ biết hàm chạy đúng.*
>
> **⚠️ MA SÁT LỚN NHẤT CỦA APP NẰM Ở NÚT QUAN TRỌNG NHẤT — và nó không có một gợi ý nào.** Nút Bắt
> đầu bị khoá cho tới khi gõ đủ `SESSION_GOAL_MIN_CHARS = 10` ký tự. Luật ấy **CÓ CHỦ ĐÍCH** (mục
> tiêu làm phiên có nghĩa · thưởng `GOAL_ACHIEVED_BONUS_RATE` 12% khi đạt · AI Coach đọc nó) nên
> **KHÔNG đụng tới** — đó là quyết định của Đàm, không phải của AI. Nhưng `grep` ra: **không hề có
> cơ chế gợi ý mục tiêu nào**, trong khi `history[].goal` đã lưu sẵn từ lâu. ⇒ `pickRecentGoals`
> (thuần, ở `sessionGoalState.js`) + chip bấm-một-cái-là-điền. **Bỏ việc GÕ LẠI, không bỏ luật.**
> ⚠️ Chỉ gợi ý mục tiêu ĐỦ DÀI (gợi ý một chuỗi bấm vào vẫn không mở được nút là một cái bẫy) ·
> bỏ trùng không phân biệt hoa-thường + khoảng trắng · chỉ hiện khi ô còn TRỐNG.
> ⚠️ **Bài test bắt được một lỗi thật trong chính hàm ấy**: `limit = 0` vẫn trả về MỘT chip, vì
> phép `push` đứng trước phép kiểm.
> ⚠️ **KHÔNG bọc `useMemo`**: React Compiler từ chối tối ưu CẢ COMPONENT khi thấy memo hoá thủ công
> nó không bảo toàn được (`Existing memoization could not be preserved`) — đổi lấy một phép tính
> vốn đã dừng sau 3 kết quả là một cái giá tệ. `npm run lint` bắt được, test thì không.
>
> **Ô "Công trình" nói ra mốc gần nhất**: `4/5 · còn 1 nữa ★`. Chỉ hiện khi còn ĐÚNG MỘT — một gợi
> ý lúc nào cũng bật thì hết là gợi ý. Phần thưởng của nó (sao trên thanh chuyển kỷ) là thứ không
> sửa lại được nữa vì kỷ niêm phong vĩnh viễn (ADR-007).
>
> **Đã soi HẾT bảy màn** ở khung 390px (Tập trung · Nhiệm vụ · Hành trang ×3 tab con · Thành Phố ·
> Thống kê · Cài đặt · menu Thêm). Menu "Thêm" gọn sẵn, không sửa. Desktop đã kiểm lại: tiêu đề
> `["Thành Phố","Kỷ Khám Phá"]` và `["Thống kê","Hành trình tập trung"]` **còn nguyên**.
>
> **Cổng.** `test:fast` **1323 bài · 0 đỏ · `# skipped 1`** · lint sạch · build xanh.

---

> Cập nhật lần cuối: **2026-08-29 (đêm, vòng 2–4)** — **TỐI GIẢN TOÀN APP: SÁU MÀN, MỘT LUẬT** ·
> **THẺ PHIÊN BIẾT NÓI VỀ CỘT MỐC** · **CƯ DÂN ĐÃ CHẠM TRẦN TỪ PHIÊN 80.**
>
> **MỘT LUẬT DUY NHẤT áp cho cả sáu màn**: *hai chỗ nói cùng một chuyện thì chỗ nói ít hơn phải
> nhường*. Soi từng màn ở khung 390px rồi cắt:
> · **Thành tích** — `{đã đạt}/360 dấu đã đạt` cỡ 40px vỡ **hai dòng khổng lồ**, là thứ to nhất và
>   đầu tiên màn hình. Với mẫu số 360 thì câu ấy LUÔN đọc ra *"bạn mới đi được vài phần trăm"*, kể
>   cả khi vừa mở được cái thứ một trăm — **mở màn hình bằng một lời chê**. Nay con số ĐÃ ĐẠT to,
>   mẫu số lùi về cỡ nhỏ. Gỡ 4 dòng mô tả + chip "Tiến độ tổng: N%" (nói lại đúng hai con số trên).
> · **Kho báu** — chữ "Di vật" hiện **BỐN lần**: nút tab đang sáng · eyebrow · `h2` 2rem · chip
>   "kho lưu trữ · 0" (mà số 0 ấy chính là đầu dòng "0/15" bên trái). Giữ đúng dòng mang thông tin.
> · **Thống kê** — ⚠️ **"Workspace" SỐNG SÓT qua đợt cắt trước** vì màn này dựng `<ShellPane>`
>   KHÔNG có `title` rồi **tự dựng tiêu đề riêng**, tức không đi qua chỗ đã sửa. Đúng hình dạng
>   *sửa một chỗ, quên chỗ thứ hai*. Và **"Hành trình tập trung" vỡ BỐN DÒNG, mỗi dòng một từ** ở
>   cỡ 1.9rem vì phải chia chiều ngang với nhóm nút Tuần/Tháng/Năm — một lỗi bố cục thật, ~300px.
>   Trang từ 1738 → **1487px**.
> · **Nhiệm vụ** — khối "Nhịp hiện tại" chỉ còn hiện khi THẬT SỰ có chuỗi; bỏ dòng
>   "Tiến độ hiện tại: 0/1" (con số ấy đã ở ngay bên phải cùng hàng).
> · **Thanh tiêu đề** — "Cấp 5" thôi hiện hai lần trên khổ điện thoại.
>
> **THÊM — thẻ "phiên đã xong" biết nói về cột mốc.** Khoảng im lặng lớn nhất của game là ngay sau
> khi xong phiên mà thành phố không đổi (`TECH_DEBT #14`: 80–85% số phiên); khi ấy phần thưởng duy
> nhất là một thẻ đếm *"+18 tài nguyên · +50 RP"* — những con số không dùng để quyết gì. Nay còn ≤1
> phiên là tới mốc thì thẻ nói *"Một phiên nữa là tới «Khám Phá Tân Thế Giới»"*.
> ⚠️ **THAY chứ không NỐI**: `description` của `RewardCard` chỉ được ĐÚNG MỘT DÒNG, nối thêm thì bị
> cắt "…" và mất đúng phần đáng đọc. ⚠️ Chỉ lấy `imminent`, **không** lấy `celebrate` — lúc vừa
> vượt mốc thì dòng ở màn Tập trung đã lo, mà hai thứ hiện CÙNG LÚC trên CÙNG màn hình.
>
> **⚠️ ĐO ĐƯỢC, KHÔNG SỬA — CƯ DÂN ĐÃ CHẠM TRẦN.** `deriveResidentCount` có `MAX_RESIDENTS = 28`,
> và với 4 công trình thì nó chạm trần **từ phiên thứ 80** rồi đứng yên vĩnh viễn (đo: 10→17,
> 40→24, 80→28, 130→28, 800→28). Đàm đang ở phiên 130 ⇒ ô "Cư dân 28" là một **con số chết**, và
> thành phố thôi đông thêm từ lâu. **KHÔNG nâng trần**: 28→29 người thì mắt không thấy, tức tiêu
> ngân sách cho một thay đổi dưới ngưỡng nhìn. Ghi lại để phiên sau khỏi "phát hiện" lại.
>
> **Cổng.** `test:fast` **1318 bài · 0 đỏ · `# skipped 1`** · lint sạch · build xanh · quét tràn
> sạch trên cả sáu màn ở khung 390px.

---

> Cập nhật lần cuối: **2026-08-29 (đêm)** — **TỐI GIẢN: CẮT 213px CHỮ KHỎI MÀN THÀNH PHỐ · MỘT
> LỖI CẮT CHỮ IM LẶNG Ở CÂY KỸ NĂNG.** (Đàm: *"đơn giản hoá, tối giản hoá, làm thành phố hứng thú
> hơn"*. Nguyên tắc: **gỡ bớt trước, thêm sau**.)
>
> **⚠️ ĐO TRƯỚC KHI CẮT — và con số này là cả lý do của phiên.** Khung 390px, tab Thành Phố: canvas
> 3D **chỉ chiếm 24% chiều cao** và bắt đầu ở **y=537/844**, tức **63% màn hình trôi qua trước khi
> thấy thứ đáng xem nhất**. Trước hình có SÁU lớp: eyebrow "WORKSPACE" · h1 "Thành Phố" · hai dòng
> giải thích luật chơi · đường kẻ · thanh chuyển kỷ · tiêu đề thẻ. Sau khi cắt: **y=324**, thành phố
> lọt trọn nửa trên màn hình.
>
> **Đã gỡ, mỗi thứ một lý do riêng (KHÔNG cắt bừa):**
> · **"Workspace"** — tiếng Anh trong app tiếng Việt, và hiện **y hệt nhau ở cả 5 tab** ⇒ một nhãn
>   giống nhau ở mọi nơi thì không mang thông tin. Gỡ hẳn.
> · **Khối tiêu đề trang** (h1 + subtitle + đường kẻ) — `hidden md:block`. Nhãn tab đang SÁNG ở
>   thanh dưới đã nói tên màn hình. Màn rộng vẫn giữ (thanh bên có thể đang thu gọn).
> · **"Kiến trúc lấy mẫu từ…"** — chuyển XUỐNG DƯỚI hình: nó là chú thích cho bức ảnh, mà chú thích
>   thì đọc SAU khi đã nhìn.
> · **"Nhịp hiện tại"** ở Nhiệm vụ — chỉ hiện khi THẬT SỰ có chuỗi. Bản cũ dùng dòng chữ lớn nhất
>   thẻ (22px font display, 2 dòng) để báo *"Bắt đầu lại một chuỗi mới · 0%"*, tức tiêu ~90px chỗ
>   đắt nhất để nói người chơi đang có SỐ KHÔNG, ngay trên chính những nhiệm vụ sẽ chữa điều đó.
> · **"Tiến độ hiện tại: 0/1"** — chính con số ấy đã ở ngay bên phải cùng hàng.
> · **"Cấp 5" hai lần trên một thanh** — dòng trái và huy hiệu phải, cách nhau ~250px, một cái
>   tiếng Việt một cái tiếng Anh ("Lv"). ⚠️ Chỉ bỏ ở khổ ĐIỆN THOẠI: khổ `md` huy hiệu đã ẩn mà
>   `LevelDot` mãi `xl` mới hiện, bỏ ở đó là làm cấp biến mất hẳn trong một dải khổ.
>
> **Đã thêm — KHÔNG tốn một dòng nào.** Cảnh 3D đổi theo ĐỒNG HỒ THẬT từ lâu (bình minh hồng, trưa
> gắt, đêm xanh có đèn cửa sổ) nhưng **không màn hình nào nói ra**, nên với Đàm nó chỉ là "hôm nay
> trông hơi khác" — không đủ thành lý do mở app vào giờ khác. `DAY_PHASE_LABEL` (`daylight.js`) +
> ghép một chữ vào CUỐI dòng chú thích đã có: *"· buổi chiều"*.
>
> **⚠️ MỘT LỖI THẬT, IM LẶNG Ở MỌI CỔNG.** Cột trái cây kỹ năng phình **567px trên khung 390px** ⇒
> mô tả mỗi kỹ năng (thứ Đàm đọc để quyết mở cái nào) bị cắt cụt giữa câu, và hàng chip nhánh thứ
> hai biến mất. Nguyên nhân: ở khung hẹp `lg:grid-cols-…` chưa áp nên grid chỉ có MỘT cột ngầm cỡ
> `auto`, mà track `auto` tự phình theo nội dung. ⚠️ **`min-w-0` trên item KHÔNG cứu được — đã thử
> và đo: vẫn 567px.** Thứ chữa được là **`grid-cols-1`**, vì Tailwind dựng nó thành
> `repeat(1, minmax(0, 1fr))` và chính vế `minmax(0, …)` mới ép track co lại. Sau vá: **525 → 308px**.
> Lỗi này desktop không thấy (cột rộng sẵn), `--fit` không thấy (nó chỉ soi NÚT, đây là thẻ `<p>`),
> test không thấy. **Chỉ ảnh chụp khung 390px mới thấy.**
>
> **⚠️ VÀ MỘT BÁO ĐỘNG GIẢ ĐÃ ĐƯỢC NHẬN RA ĐÚNG.** Phép quét tràn báo thêm một khối **578px** ở tab
> Thống kê. Truy lên cha: `overflow-x: auto` ⇒ đó là **băng cuộn ngang có chủ đích**, vuốt một cái
> là thấy. Đúng bài học đã ghi sẵn ở `CLAUDE.md` (*"gộp `overflow-x:auto` chung với `hidden` ⇒ báo
> 5 chip của thanh chuyển kỷ BỊ XÉN"*). ⇒ **Chỉ có ĐÚNG MỘT chỗ tràn thật trên cả sáu màn.**
> Không sửa mù 8 chỗ `grid` cùng khuôn — đo trước, sửa theo triệu chứng đo được.
>
> **⚠️ ĐÃ CÂN NHẮC RỒI BỎ hai hướng, ghi lại để phiên sau khỏi đi lại:**
> · **Tăng chiều cao canvas.** Camera chỉ nhận `camera.aspect = width/height` và **không bù gì** ⇒
>   khung cao hơn (aspect nhỏ hơn) với FOV DỌC cố định thì thấy ÍT hơn theo chiều ngang, tức **cắt
>   mất hai bên thành phố**. Không đụng tỉ lệ.
> · **Đo lại `TECH_DEBT #14`** (tỉ lệ phiên im lặng). `simulate-pacing.mjs` chạy được nhưng chỉ in
>   TIẾN ĐỘ, không có tỉ lệ im lặng — đo cho đúng là cả một phép mô phỏng hàng đợi xây qua 4.400
>   phiên, và kết quả là **một bảng số, không phải thứ Đàm nhìn thấy** (PHASE_RULES §1: *một phiên
>   chỉ có bảng số là một phiên chưa giao gì*). Để lại.
>
> **Cổng.** `test:fast` **1315 bài · 0 đỏ** · lint sạch · build xanh · quét tràn sạch trên cả 6 màn.

---

> Cập nhật lần cuối: **2026-08-29 (tối)** — **PHẦN THƯỞNG KHI TỚI ĐÍCH · CHUỖI ĐANG TREO · MỘT
> LỖI TRẮNG MÀN HÌNH MÀ KHÔNG CỔNG NÀO BẮT ĐƯỢC.**
>
> **⚠️ BÀI HỌC LỚN NHẤT PHIÊN NÀY — `no-use-before-define`, VÀ NÓ ĐÃ ĐƯỢC BẬT VĨNH VIỄN.**
> Đặt `const streakRisk = evaluateStreakAtRisk({… sessionsCompletedToday …})` ở dòng 1466 cho "đọc
> xuôi", cạnh `eraStage`. Nhưng `sessionsCompletedToday` khai ở dòng **1612** — dùng một `const`
> trước dòng khai báo ném `ReferenceError` NGAY LÚC RENDER và **cả app ra trang trắng**.
> Điều đáng sợ: **`npm run lint` SẠCH · `npm test` 1311 bài XANH · `npm run build` XANH.** Test đọc
> mã nguồn chứ không dựng React; bundler không quan tâm thứ tự trong một hàm; ESLint khi ấy chưa
> bật rule. Thứ DUY NHẤT bắt được là **ảnh chụp** — và nó chỉ nói "app chưa mọc ra", không nói vì sao.
> ⇒ Đã **bật `no-use-before-define`** (`variables: true, functions: false`) cho cả dự án. Nó tìm ra
> đúng 3 chỗ hợp lệ (closure `loop` trong `CityScene3D.jsx`) — miễn trừ kèm lý do. Đúng luật đã ghi
> nhiều lần: *một bài học được ghi ra KHÔNG chặn được gì; chỉ một cái CỔNG mới chặn được.*
>
> **⚠️ VÀ CÁCH TRUY RA NÓ, vì `shot.mjs` KHÔNG bắt lỗi console.** Công cụ chỉ in *"✗ CHỈ THẤY 2 nút
> sau ~20 giây"*. Ba bước: (a) tắt riêng component mới ⇒ **vẫn hỏng** ⇒ không phải nó; (b) `git stash`
> toàn bộ rồi dựng lại `ddb7be9` (bản Đàm xác nhận đang chạy) ⇒ **chạy tốt** ⇒ lỗi CHẮC CHẮN do hôm
> nay; (c) thay riêng `streakRisk = null` ⇒ **mọc lại** ⇒ khoanh đúng một biểu thức. Bước (b) là
> bước đáng giá nhất — không có nó thì rất dễ đi sửa một thứ không hỏng.
>
> **Đã làm (2 việc, KHÔNG thêm dòng nào lên màn hình — cả hai dùng chỗ đã có):**
> **(1) Vượt mốc thì được ăn mừng.** `pickStageCelebration` + `stageMilestoneKey` (thuần, ở
> `eraStage.js`); dòng đếm ngược đổi giọng thành *"🎉 Vừa mở «…»"*, **bấm được để tắt** (nó chiếm
> chỗ dòng đếm ngược nên phải có đường trả chỗ lại). ⚠️ Mốc phải GỘP CẢ KỶ (`era*10 + index`): lên
> kỷ thì chỉ số chặng quay về 0, so riêng chỉ số sẽ đọc bước tiến LỚN NHẤT game thành một bước LÙI.
> ⚠️ Thăng hoa đưa về kỷ 1 ⇒ mốc TỤT ⇒ không khen (đúng như phải thế). ⚠️ Dấu ở localStorage
> `dc-stage-seen-v1`, và **lần đầu phải GIEO rồi IM LẶNG** — cái bẫy `navAttention.js` đã cắn thật.
> **(2) Ô "Chuỗi" báo treo.** `evaluateStreakAtRisk` (thuần, thêm vào `gameMath.js`) — cùng định
> nghĩa với `evaluateStreakRisk` bên push, phát biểu lại bằng dữ liệu màn hình đã có (KHÔNG import
> chéo `api/` sang `src/`: hai tầng chạy hai nơi, và một `import` như vậy kéo cả nhánh server vào
> bundle). Nhãn `Chuỗi ⚠` + viền màu nhấn — **cả chữ lẫn màu**, đọc được khi không nhìn màu
> (ADR-060). ⚠️ Lá Chắn KHÔNG làm hết treo, nó chỉ đổi hậu quả; nói "an toàn" là nói dối.
>
> **⚠️ ĐÃ BỎ một việc thứ ba đang định làm.** Định "cho thành phố 3D đổi theo chặng" (nửa sau của
> đề xuất trước). Đi đọc thì `deriveProps` và `deriveResidentCount` **đã** nhận `sessionCount` +
> `streakLength` — thành phố vốn đã đông dần theo tiến độ. Thêm "theo chặng" nữa là trùng lặp, mà
> phải đụng vào mặt trận 3D. ⇒ *Đọc mã trước khi làm theo đề xuất của chính mình ở phiên trước.*
> Cũng bỏ "thanh chặng nháy khi EP tăng": thanh đã có hiệu ứng trượt 500ms và sau mỗi phiên đã có
> `CityGrowthMoment` + toast — thêm nữa là chồng phản hồi lên nhau.
>
> **Công cụ: `shot.mjs` có cờ `--ls khoá=giá-trị`.** Không có nó thì mọi trạng thái "lần đầu nhìn
> thấy" (5 khoá marker của dự án: `dc-nav-seen-v1`, `dc-stage-seen-v1`, `dc-coach-nudge-v1`…) là
> **không thể chụp** — mà đó thường là đúng trạng thái đáng soi nhất, vì Đàm gặp một lần rồi thôi.
>
> **Nghiệm thu bằng ẢNH** (khung 390px thật, 3 trạng thái): *"🎉 Vừa mở «Khám Phá Tân Thế Giới»"*
> (thanh vừa reset về 33/1.866, ba vạch 2 cam 1 xám) · *"🔥 Một phiên nữa là tới «…»"* · ô
> **`CHUỖI ⚠ 4`** viền cam nổi hẳn giữa hai ô xám. ⚠️ Dựng ca "chuỗi treo" phải **dời cả lịch sử về
> hôm qua**, không phải sửa `streak.currentStreak` — store DỰNG LẠI chuỗi từ `history`
> (`rebuildStreakFromHistory`), nên sửa trường ấy trong fixture là vô ích (đã mất một vòng vì điều này).
>
> **Cổng.** `test:fast` **1315 bài · 0 đỏ · `# skipped 1`** (thêm 11) · lint sạch · build xanh.

---

> Cập nhật lần cuối: **2026-08-29 (chiều)** — **MỐC GẦN HƠN: THANH TIÊU ĐỀ ĐO *CHẶNG*, VÀ ĐẾM
> NGƯỢC BẰNG SỐ PHIÊN** (Đàm: *"hứng thú và đầy dopamine hơn, nhưng đơn giản"*).
>
> **Chẩn đoán, và nó không phải thứ tôi định làm ban đầu.** Định làm "cho mỗi chặng một thay đổi
> trong thành phố 3D". Đi khảo sát thì thấy một chuyện khác hẳn: **thanh chặng ĐÃ TỒN TẠI** ở
> `ResourceDisplay` — nhưng thẻ đó nằm trong `Motion.aside className="hidden … lg:flex"`, tức
> **iPhone không bao giờ thấy**. Thứ Đàm thấy trên điện thoại là thanh trên thanh tiêu đề, và nó
> đo **cả KỶ**: 5.600–20.800 EP ⇒ **~1% mỗi phiên**, đầy đúng MỘT lần mỗi 1–6 tháng. Cùng hình
> dạng lỗi đã cắn nhiều lần (ADR-061, `FocusCityTease`): *thứ tốt nằm ở nơi iPhone không thấy.*
>
> **Đã làm (4 việc, cùng một chủ đề — kéo cái đích lại gần):**
> **(1)** `src/engine/eraStage.js` mới — NGUỒN DUY NHẤT của phép "EP này thuộc chặng nào".
> `ResourceDisplay` bỏ hàm cục bộ `getCurrentStage`; nay ba nơi hỏi cùng một câu đọc chung một file.
> **(2)** Thanh tiêu đề đo CHẶNG (~3%/phiên, đầy **ba lần mỗi kỷ**), kèm **ba vạch chặng** cho biết
> đang ở mốc thứ mấy — không có ba vạch ấy thì thanh mới trông y hệt thanh cũ, chỉ chạy nhanh hơn,
> và không ai có cách nào biết vì sao.
> **(3)** Dòng đếm ngược ở màn Tập trung (cột GIỮA, cạnh hai dòng đã có): *"còn ~3 phiên nữa tới
> «Khám Phá Tân Thế Giới»"*. Nhịp lấy **TRUNG VỊ** 10 phiên gần nhất từ `history`.
> **(4)** Còn ≤1 phiên ⇒ đổi giọng + màu (`🔥 Một phiên nữa là tới «…»`).
>
> **⚠️ MỘT LỖI LOGIC BẮT ĐƯỢC NGAY TRONG HÀM VỪA VIẾT, VÀ NÓ RẤT DỄ SỐNG SÓT.** Bản đầu của
> `describeStageCountdown` viết *"còn 3 phiên nữa tới «{stage.label}»"* — mà `label` là chặng ĐANG
> ĐỨNG TRONG, còn `epEnd` mới là mốc kết thúc nó. Tức nó hứa hẹn một thứ người chơi đã ở trong rồi.
> Câu ấy đọc lên hoàn toàn xuôi tai và sẽ không ai để ý trong nhiều tuần. Vá bằng `nextLabel`
> (`null` ở chặng cuối ⇒ đích là **KỶ MỚI**, phải gọi đúng tên vì đó là phần thưởng lớn nhất game).
>
> **⚠️ TRUNG VỊ CHỨ KHÔNG PHẢI TRUNG BÌNH, và đây là một quyết định có đo.** Lịch sử có cả phiên 5
> phút lẫn 90 phút; một phiên dài bất thường kéo trung bình lên và biến "còn 3 phiên" thành "còn 1
> phiên" — **một lời hứa hụt, mà một lời hứa hụt làm hỏng mọi lời hứa sau đó**. Cùng luật trung
> thực đã áp cho AI Coach và `cityMoment.js`: chưa đủ mẫu thì trả `null`, nói bằng EP, không bịa.
>
> **⚠️ HAI CỔNG ĐÃ LÀM ĐÚNG VIỆC CỦA CHÚNG.** (a) `no-undef` của ESLint bắt hai biến còn sót
> (`stageStart`/`stageEnd`) sau khi gỡ hàm cục bộ — **test không thể bắt được ca này** vì nhánh ấy
> chỉ chạy khi mở panel Kho; đúng bài học *"đừng bỏ `npm run lint` khi thấy test đã xanh"*.
> (b) `resourceDisplay.test.js` đỏ — nhưng **bài test sai, không phải mã sai**: nó tìm chuỗi
> `stageStart.toLocaleString()`, tức bám vào TÊN BIẾN, trong khi lời hứa nó tuyên bố canh là *"con
> số cũ vẫn xem được trong panel Kho"* — và dòng ấy vẫn nằm nguyên đó. Sửa bài test để nó hỏi CHỮ
> HIỆN RA (`'Khoảng EP của chặng:'`). Nới assert cho hết đỏ là cách sai.
>
> **Nghiệm thu bằng ẢNH** (khung 390px thật): trạng thái thường — *"THƯƠNG MẠI TOÀN CẦU · 1.320 /
> 1.867 EP"* + ba vạch, dòng *"◈ Còn ~19 phiên nữa tới KỶ MỚI"*; trạng thái sắp-tới — *"VƯƠN RA
> BIỂN LỚN · 1.840 / 1.867 EP"*, ba vạch **1 cam 2 xám** (phân biệt rõ đang ở chặng 1/3), dòng
> *"🔥 Một phiên nữa là tới «Khám Phá Tân Thế Giới»"* màu nhấn. Đối chiếu chéo desktop: cột phải in
> ra *"Kỷ 8 · chặng 1/3 … 1.840 / 1.867 EP"* — **khớp từng con số** với thanh tiêu đề, tức một luật
> một công thức đang chạy thật chứ không chỉ đúng trên giấy.
>
> **Cổng.** `test:fast` **1304 bài · 0 đỏ · `# skipped 1`** (thêm 12 bài) · lint sạch · build xanh.
>
> **Việc tiếp theo đề xuất (chưa làm).** Phần "chặng" nay đã là một MỐC ĐO ĐƯỢC, nhưng **thành phố
> 3D vẫn chưa đổi gì theo chặng** — đó vẫn là việc còn lại của đề xuất cũ, và nay nó rẻ hơn vì
> `getEraStage` đã có sẵn để hỏi.

---

> Cập nhật lần cuối: **2026-08-29** — **MỞ VAN SKIN + DÒNG "VIỆC TIẾP THEO"** (trả lời câu hỏi của
> Đàm: *"nên phát triển thế nào để game dễ chơi và hứng thú hơn"*).
>
> **Chẩn đoán trước khi làm.** Đếm ra: **360 thành tích · 51 kỹ năng · 75 công trình · 30 loại tài
> nguyên · 27 nhiệm vụ · 15 kỳ quan · 15 khủng hoảng kỷ**, cộng thảm hoạ / gacha / cược Overclock /
> prestige / di sản kỷ / AI Coach. Nhiều hệ thống hơn phần lớn game thương mại — cho MỘT người chơi.
> ⇒ **Cái khó không phải thiếu tính năng, mà là không có gì nói cho Đàm biết việc nào đáng làm tiếp
> theo.** Nhịp thì ngược lại: ở 100 phút/ngày, kỷ 12–15 mất **107–189 ngày mỗi kỷ**, cả 15 kỷ ≈
> **1.008 ngày**. Phần thưởng lớn quá xa, phần thưởng nhỏ bị chia cho quá nhiều kênh.
>
> **VIỆC 1 — ép chuyển skin một lần (đóng mục 🔴 số 0 ở `START_HERE.md`).** `resolveSkinAfterMigration`
> (thuần, ở `uiSkins.js`) + cờ `skinMigratedV1` + bump `settingsStore` version **8 → 9**. Bản lưu chưa
> có cờ ⇒ về `DEFAULT_UI_SKIN` đúng một lần rồi bật cờ; có cờ ⇒ tôn trọng tuyệt đối.
> ⚠️ **Cờ RIÊNG chứ không so `uiSkin === 'editorial'`** — so giá trị thì mọi lần bump version sau đều
> ép lại, và Đàm chọn `editorial` CÓ Ý sẽ bị đá về `arcade` mà không hiểu vì sao. Cái cờ phân biệt
> được hai thứ mà giá trị skin không phân biệt nổi: *"đang mang mặc định cũ"* vs *"đã chọn, tình cờ
> trùng mặc định cũ"*. ⚠️ **Bump version là thứ DUY NHẤT làm `migrate` chạy lại** — thiếu nó thì hàm
> ép chuyển viết đúng tới đâu cũng không bao giờ được gọi trên máy Đàm.
>
> **VIỆC 2 — 7 ký tự commit ở cuối màn Cài đặt.** `vite.config.js` bơm `__APP_COMMIT__` lúc build (ưu
> tiên `VERCEL_GIT_COMMIT_SHA`; `git rev-parse` khi có `.git`; `catch` về `'dev'` để build KHÔNG BAO
> GIỜ đổ vì một dòng trang trí). Đã xác minh chuỗi thật sự nằm trong `dist/assets/*.js`, không chỉ
> đúng trên lý thuyết. Lý do tồn tại: không có nó thì *"chưa deploy"* và *"deploy rồi mà không thấy"*
> trông giống hệt nhau, mà hai thứ ấy cần hai cách sửa ngược nhau.
>
> **VIỆC 3 — dòng "Việc tiếp theo" ở màn Tập trung.** `pickNextAction` (thuần, thêm vào
> `engine/opportunities.js`) + `hooks/useNextAction.js` + `components/FocusNextAction.jsx`, đặt ở
> **cột giữa** cạnh `FocusCityTease`. Ưu tiên **XÂY > NGHIÊN CỨU > KỸ NĂNG**: xây là việc duy nhất cho
> kết quả NHÌN THẤY ĐƯỢC trong thành phố ở phiên sau (đóng đúng vòng lặp mà `cityMoment.js` giữ);
> kỹ năng đứng cuối vì phần thưởng của nó là mấy phần trăm, không nhìn thấy ở đâu cả. `othersCount`
> là phần không được bỏ — thiếu nó thì một dòng nói về công trình sẽ im lặng nuốt mất 5 kỹ năng đang
> chờ, tức dòng ấy nói dối bằng cách bỏ sót.
>
> **⚠️ HAI PHÉP ĐO HỎNG TRONG CHÍNH PHIÊN NÀY, CẢ HAI ĐỀU ĐỎ TRÊN MÃ HOÀN TOÀN ĐÚNG.**
> **(a)** Bài "máy MỚI đã mang sẵn cờ" xoá localStorage rồi gọi `persist.rehydrate()` — nhưng
> rehydrate KHÔNG có gì để đọc thì nó **không đặt lại gì cả**, nên state vẫn mang `uiSkin: 'swiss'`
> mà bài ngay trên vừa nạp vào. Vá bằng `getInitialState()`. **(b)** Bài canh vị trí dùng
> `APP_CODE.indexOf('<PomodoroEngine')` — mà `App.jsx` dựng đồng hồ ở **HAI** nhánh (toàn màn hình ở
> dòng 1666, cột giữa ở 1726), `indexOf` trả chỗ đầu tiên nên nó đang so với một cái đồng hồ ở màn
> hình KHÁC. Vá bằng `indexOf(..., mốcNeo)`. ⇒ Cả hai đúng bài học *"phép đo hỏng, không phải mã
> hỏng"*, và cách sửa SAI ở cả hai đều là nới assert cho hết đỏ.
>
> **⚠️ FIXTURE KHÔNG THỂ HIỆN NỔI TÍNH NĂNG ĐANG SOI.** Ảnh chụp đầu tiên KHÔNG có dòng "việc tiếp
> theo", và phản xạ sai là đi nghi dây nối. Hỏi thẳng `pickNextAction` trên chính fixture đó:
> `sp = 1`, `RP = undefined`, 0 việc ở cả ba loại ⇒ trả `null` là **ĐÚNG**, và component im lặng là
> đúng. Đây là bài học *"fixture đều tăm tắp là fixture vô dụng"* lặp lại: fixture mặc định dựng ra
> một tài khoản không có việc nào, nên nó không soi được thứ đang soi. Dựng biến thể `sp = 20` (đổi
> ĐÚNG MỘT biến) thì dòng hiện ra: *"✦ Mở kỹ năng «Đà Tập Trung» — đủ 7 điểm  +11"*.
>
> **Nghiệm thu bằng ẢNH** (khung 390px THẬT, `scripts/shot.mjs`, fixture 180 ngày · kỷ 8 · cấp 5):
> dòng mới nằm **trên nếp gấp**, ngay dưới dòng "🚢 Đang xây Cảng Biển Lớn · còn 4 phiên" và **trên**
> thẻ đồng hồ. Màn Cài đặt hiện *"Bản đang chạy: 33411b2"*.
>
> **Cổng.** `test:fast` **1292 bài xanh · 0 đỏ · `# skipped 1`** (thêm 13 bài mới) · `test:cross`
> 3 xanh (24,2 giây) · lint sạch · build xanh. Ba phép phá của bài skin đã chạy thật trong bản sao
> riêng: bỏ phép ép ⇒ 2 đỏ · luôn ép ⇒ 1 đỏ · cờ truthy ⇒ 1 đỏ · không phá ⇒ 9 xanh.
>
> **Việc tiếp theo đề xuất (chưa làm, chờ Đàm).** Cho 3 CHẶNG trong mỗi kỷ một thay đổi nhìn thấy
> được trong thành phố — dữ liệu chặng đã có sẵn (`makeEraStages`) nhưng hiện chỉ là một nhãn CHỮ ở
> `ResourceDisplay`, thành phố không đổi gì. Làm được thì 15 mốc thành **45 mốc**, khoảng cách giữa
> hai lần *"à, thành phố khác rồi"* rút còn 1/3 mà không phải cân lại một con số kinh tế nào.

---

> Cập nhật lần cuối: **2026-08-27 (tối muộn)** — **BÁO CÁO TUẦN: LƯỚI AN TOÀN NAY CĂNG Ở CẢ HAI
> NỀN TẢNG** (bổ sung cho ADR-061).
>
> ⚠️ **HAI PHIÊN LÀM CÙNG MỘT VIỆC CÙNG LÚC — VÀ ĐÂY LÀ CÁCH ĐÃ GỠ.** Phiên này và một phiên khác
> cùng nhận việc đóng `TECH_DEBT #87`, cùng viết một ADR-061, và cùng đẩy lên trong vòng một giờ.
> Bản của họ lên `main` trước và **tốt hơn ở tầng dữ liệu**: tách `lastWeeklyReportDate` (*đã MỜI*)
> khỏi `lastWeeklyReportSeenDate` (*đã XEM*), giữ `checkWeeklyReport` nhưng cho nó chỉ bật một lời
> MỜI (`ui.weeklyReportPending` → thẻ toast), kèm `gameStore.weeklyReport.test.js` (9 bài, 7 phép
> thử ngược). ⇒ **Đã VỨT BỎ bản của mình** (hàm thuần `isWeeklyReportUnread` + cách gỡ hẳn
> `checkWeeklyReport`) và giữ nguyên vẹn bản của họ, kể cả `appNavigation.test.js` trả về đúng
> từng ký tự.
>
> **⚠️ NHƯNG BẢN CỦA HỌ HỞ ĐÚNG MỘT CHỖ, VÀ CHỖ ẤY LÀ THIẾT BỊ ĐÀM DÙNG NHIỀU NHẤT.** Lưới an toàn
> của họ là cái chấm "chưa xem" ở **thanh bên desktop** — mà thanh bên là `hidden md:flex`. Đi đọc
> lại mọi đường vào mới thấy: **trước ADR-061, iPhone KHÔNG có nút nào mở báo cáo tuần**, nút duy
> nhất nằm đúng ở cái thanh bên ấy. Nghĩa là trên iPhone, hộp thoại tự bật không phải cách báo cáo
> *xuất hiện* — nó là cách báo cáo *tồn tại*. Bỏ nó đi mà lưới lại căng ở nền tảng kia thì lỡ một
> cái toast 4 giây vẫn là mất báo cáo cả tuần, đúng thứ ADR-061 sinh ra để tránh.
>
> ⇒ **Phần giữ lại của phiên này chỉ còn một việc, và nó là điều kiện an toàn chứ không phải tiện
> ích**: thêm mục **"Báo cáo tuần" vào menu "Thêm" trên iPhone**, mang cùng cái chấm
> `weeklyReportUnseen` của họ (KHÔNG tự tính lại — một luật một công thức). Số cột của menu ấy đọc
> `MOBILE_SECONDARY_TABS.length + 1` chứ không chốt cứng, đúng chú thích sẵn có ở đó. Khoá bằng
> `rewardToastWiring.test.js`: bài test đòi CẢ lối vào LẪN cái chấm ở CẢ HAI thanh điều hướng, và
> đã thử-cho-đỏ.
>
> **Bài học đáng giữ nhất của phiên**: khi gỡ một cơ chế rồi thay bằng "một lưới an toàn", hãy liệt
> kê **mọi đường vào hiện có** TRƯỚC. Một lưới chỉ căng ở một nền tảng thì nó không phải lưới — nó
> là một lời hứa đúng một nửa, và nửa sai lại rơi đúng vào iPhone. Cùng họ với luật đã ghi sẵn
> trong `appNavigation.test.js`: *nối một chỗ quên một chỗ — mà iPhone mới là chỗ Đàm dùng nhiều nhất.*
>
> **Bài học thứ hai — về việc gộp**: mã của tôi sống sót qua auto-merge nhưng **hết đúng về NGHĨA**.
> `weeklyReportUnread` của tôi đọc `lastWeeklyReportDate`, mà trong mô hình của họ trường ấy nay
> nghĩa là *đã MỜI* ⇒ cái chấm sẽ tắt ngay lúc vừa mời, trước khi Đàm kịp xem gì. Git không thấy
> xung đột vì hai bên sửa hai vùng khác nhau. ⇒ **Sau mỗi lần gộp, đọc lại NGHĨA của những trường
> mà cả hai bên cùng chạm, đừng chỉ đếm số dấu `<<<<<<<`.**
>
> Cổng sau khi gộp: **lint sạch · build xanh · test ở dòng dưới**.
> ⚠️ **VERCEL "READY" VẪN CHƯA TỰ XÁC NHẬN ĐƯỢC** từ hộp cát này (proxy chặn
> `pomodoro-dc.vercel.app`, 403 ở bước CONNECT; repo không có GitHub Actions) — đã kiểm lại.

---

 Cập nhật lần cuối: **2026-08-27 (khuya)** — **BÁO CÁO TUẦN THÔI TỰ BẬT ⇒ LUẬT MỨC ĐỘ LÀM PHIỀN
> HẾT NGOẠI LỆ** (ADR-061, đóng `TECH_DEBT #87` đúng ngày nó được mở). Sáng thứ Hai xưa nay
> `checkWeeklyReport` tự mở một hộp thoại toàn màn hình — thứ DUY NHẤT còn chặn màn hình mà không
> nằm trong bốn việc ADR-060 cho phép. Nay nó chỉ MỜI bằng một thẻ toast góc màn hình.
>
> **⚠️ ĐIỀU KIỆN BẮT BUỘC ĐÃ LÀM TRƯỚC, KHÔNG BỎ QUA.** `TECH_DEBT #87` cấm đụng vào tính năng này
> cho tới khi tách được "đã xem" khỏi "đã bỏ qua" — vì `dismissWeeklyReport` ghi
> `lastWeeklyReportDate` ở MỌI lần đóng, mà chính trường ấy chặn `checkWeeklyReport` chạy lại. Đẩy
> thẳng sang toast 4 giây mà giữ nguyên cách ghi = **lỡ một cái toast là mất báo cáo của cả tuần**.
> Nay hai trường, hai câu hỏi: `lastWeeklyReportDate` (*đã MỜI*) · `lastWeeklyReportSeenDate`
> (*đã XEM*). Đây là lần thứ **BẢY** của khuôn "một trường gánh hai việc", và lần đầu nó gánh hai
> việc ở tầng DỮ LIỆU BỀN chứ không ở tầng hình.
>
> **Ba luật đi kèm — gỡ cái nào là bản vá thoái hoá về đúng cái bẫy nó vừa gỡ:**
> **(1) MỞ = đã xem; ĐÓNG = không ghi gì; TOAST HẾT GIỜ = không ghi gì.**
> **(2) Cú mở ĐẦU TIÊN trong tuần rơi vào `'previous'`** — không có luật này thì đổi sang toast là
> âm thầm đổi luôn NỘI DUNG Đàm nhận: nút thanh bên xưa nay mở `'current'` (tuần đang chạy dở), còn
> hộp thoại tự bật thì mở `'previous'` (tuần đã xong).
> **(3) Chấm ở nút "Báo cáo tuần" là LƯỚI AN TOÀN, không phải trang trí** — nó do
> `lastWeeklyReportSeenDate` điều khiển nên KHÔNG hết hạn. Thiếu nó thì một lời mời 4 giây bị lỡ sẽ
> không để lại dấu vết nào.
>
> **⚠️ HAI CÁI BẪY CÔNG CỤ TRONG CHÍNH PHIÊN NÀY, CẢ HAI ĐỀU DO PHÉP THAY CHUỖI:**
> **(a) `s.count(old)` là phép đếm CHUỖI CON, không phải đếm DÒNG.** Mẫu `        lastWeeklyReportDate:`
> (8 dấu cách) nằm gọn bên trong dòng `          lastWeeklyReportDate:` (10 dấu cách) mà bước trước
> vừa chèn ⇒ cổng "phải khớp đúng 1 chỗ" nổ, dù cả hai chỗ đều có thật và đều khác nhau. Cắn **hai
> lần** (`gameStore.js` rồi `App.jsx`). Vá: neo bằng DÒNG ĐỨNG SAU (`prestige: {`,
> `levelUpQueueLength,`) để mỗi mẫu là duy nhất. May là cổng ấy chặn TRƯỚC khi ghi file, nên không
> lần nào sửa hỏng — *một phép thay chuỗi không tự đếm số chỗ khớp là một quả mìn*.
> **(b) MỘT BÀI TEST XANH OAN, VÀ CHỈ PHÉP THỬ NGƯỢC BẮT ĐƯỢC.** Bài "thẻ tuần phải đứng ĐẦU chồng
> toast" dựng đúng MỘT thẻ rồi hỏi `toasts[0].source === 'weekly'` — nó xanh kể cả khi gỡ `'weekly'`
> khỏi `SOURCE_ORDER`, vì **một danh sách một phần tử thì phần tử nào cũng đứng đầu**. Một phép sắp
> xếp chỉ kiểm được khi có thứ để sắp. Đã thêm một thẻ thứ hai vào chồng; nay nó đỏ đúng lúc cần.
>
> **Đã NHÌN, không chỉ đọc cổng số**: bật tạm cờ trong bản build cục bộ để chụp thẻ toast thật
> (`📊 Tổng kết tuần trước · TỐT · Xem lại bảy ngày vừa qua.`) và chấm cam trên nút *Báo cáo tuần*.
> Lượt chụp đầu **không thấy thẻ đâu** — đúng vì nó đã tự tắt sau 4 giây trước lúc chụp, tức chính
> cơ chế đang cần kiểm đã chạy. Câu mô tả đầu tiên còn bị **xén cụt** trong thẻ nên đã rút gọn; đó là
> thứ chỉ ảnh chụp nói được, không cổng nào nói. Hai phép bật tạm đã hoàn tác và **kiểm bằng `md5sum`**.
>
> Cổng: **1243 bài · 0 đỏ · `# skipped 1`** · lint sạch · build xanh. Bài mới
> `gameStore.weeklyReport.test.js` (9 bài) chạy **store THẬT** với đồng hồ đóng băng ở một thứ Hai
> giờ VN — kèm một bài đối chứng khẳng định mốc ấy đúng là thứ Hai, vì chạy vào thứ Ba thì cả file
> sẽ "xanh vì không đo gì". Bảy phép thử ngược đều đỏ đúng bài dự kiến.

> Cập nhật lần cuối: **2026-08-27 (khuya)** — **BÓNG TIẾP XÚC ĐÃ CHẾT Ở 7/15 KỶ MÀ KHÔNG AI BIẾT.**
> Lấy việc 1+2 trong hàng đợi `START_HERE`. Kết quả: **việc 1 đã xong từ 2026-08-21** (kỷ 2 khai
> `roof: 'pyramid'`, kỷ 3 khai `roof: 'ziggurat'`, ảnh dựng ra chóp bốn mặt rõ ràng) — hàng đợi
> đang bảo phiên sau đi làm lại một việc đã làm. Đã gỡ khỏi `START_HERE`.
>
> **⚠️ KHUYẾT TẬT THẬT TÌM ĐƯỢC TRONG LÚC LÀM VIỆC 2 — TIỀN ĐỀ BỊ GỠ Ở MỘT PHASE KHÁC (Phase 8C).**
> `contactShade` (bóng tiếp xúc nướng sẵn vào màu đỉnh — chính là "AO" mà hàng đợi đòi thêm) hỏi
> `contactShade(p[1])`, tức độ cao **THẾ GIỚI** của đỉnh. Đúng lúc nó được viết: hồi đó mặt đất là
> một mặt phẳng ở y = 0. **Phase 7B cho mặt đất có cao độ**, và từ đó mệnh đề ấy chết trong im lặng.
> Đo trên lưới 12×12: **kỷ 8 có 88/144 ô (61%) nền cao hơn `CONTACT_REACH` = 0,38**, kỷ 5 52%,
> kỷ 4 50%, kỷ 7 34%, kỷ 10 32%, kỷ 15 28%, kỷ 13 27%, kỷ 1 15% — **7/15 kỷ**. Công trình đứng trên
> những ô đó nhận hệ số 1 ở MỌI đỉnh ⇒ mất sạch bóng chân. Hậu quả: trong cùng một thành phố, nhà
> dưới thấp thì NGỒI xuống đất còn nhà trên thềm cao thì DÁN lên — phụ thuộc thềm chứ không phụ
> thuộc gì có ý nghĩa. Vá: `shade` (boolean) → `shadeBase` (cao độ NỀN của chính công trình), đo
> `contactShade(p[1] - shadeBase)`. Khối lơ lửng kỷ 15 vẫn không bị tối, đúng như chú thích cũ hứa.
>
> **Đã làm nốt phần bóng đổ**: `SHADOW_MAP_DESKTOP` 2048 → **4096** (texel bóng 0,0088 → 0,0044 ô).
> Điện thoại giữ 512. Giá là BỘ NHỚ (16 → 64 MB) chứ không phải thời gian mỗi khung —
> `sun.shadow.autoUpdate` đang tắt nên bản đồ chỉ vẽ lại khi thành phố đổi.
>
> **HOÀN TÁC có chủ đích**: thử siết `sun.shadow.camera` từ 0,75·lưới xuống 0,58 — ảnh kỷ 11 lúc
> 16 giờ (bóng dài nhất) **không đọc ra khác biệt nào**, trong khi tấm đất nhận bóng rộng tới ±9,5
> nên siết về ±6,96 là mua rủi ro cắt cụt bóng để đổi lấy một thứ không nhìn thấy. Giữ 0,75, ghi lý
> do vào mã.
>
> **⚠️ HAI LẦN PHÉP ĐO SUÝT LÀM TÔI KẾT LUẬN SAI:**
> **(1)** Nhìn ảnh kỷ 11 lúc 16 giờ tôi tưởng *"tháp cao mà gần như không đổ bóng xuống đất"*. Bật/
> tắt bóng rồi so (§10.2): **21,9% điểm ảnh đổi QUÁ ngưỡng mắt, lệch tối đa 93** — bóng đang hoạt
> động rất mạnh. Ấn tượng sai, số đo đúng.
> **(2)** Ảnh cận cảnh kỷ 8 (`--width 1500`, 3 dải ngang) **BỊ RÁCH** — một mảng góc trên phải thuộc
> khung hình khác, nhìn là thấy. `soiVetRach` trả về LÀNH nên ảnh vẫn được ghi, và phép đo trên nó
> cho ra *"21,38% điểm ảnh vượt ngưỡng, lệch tối đa 222"* — một bộ số hoàn toàn bịa, đủ thuyết phục
> để kết luận sai về bản vá. Dựng lại lần hai thì sạch. **Đã bỏ bộ số đó, ghi `TECH_DEBT #88`**
> (vết rách lần này có mép DỌC, mà `soiVetRach` chỉ quét mép NGANG — cần đo lại trước khi tin lời
> giải thích ấy). Bài học cũ, lần thứ N: *ảnh là sản phẩm VÀ là cái kiểm.*
>
> **⚠️ NÓI THẲNG: PHIÊN NÀY KHÔNG ĐẠT "≥4 THAY ĐỔI NHÌN THẤY ĐƯỢC" (`PHASE_RULES` §1).** Cả hai cần
> gạt mà hàng đợi nêu tên đều **đã có sẵn** — một cái đã bó sát, một cái đã tồn tại nhưng hỏng. Hai
> bản vá đều đúng và đo được, nhưng **đều dưới ngưỡng mắt ở khung toàn cảnh**. Muốn thành phố trông
> 3D hơn thật sự thì cần một quyết định MỸ THUẬT của Đàm, không cần thêm mã — ba lựa chọn kèm số đã
> ghi ở `START_HERE` mục 2.
>
> Cổng: `npm test` **1.234 bài · 1.233 pass · 0 fail · 1 skipped** (không đỏ thêm bài nào, gồm cả
> bất biến ADR-007) · lint sạch · build xanh.

> Cập nhật lần cuối: **2026-08-27 (khuya)** — **BA NHỊP PHỦ KÍN GIAO DIỆN + CỔNG CHẶN HỒI QUY.**
> Vòng hai của việc gom nhịp. **Đo bằng chính phép đếm đã vá, trên cả hai mốc** (`git worktree`
> tại `95fb96b` cho vế TRƯỚC — đừng chép cột "sau" của lượt trước, bài học `TECH_DEBT #43`):
> **410 khai báo rời rạc trên 30 file → 54 trên 11 file (−87%)**, quét 44 file `.jsx`.
> Ba ổ lớn nhất đã dọn (`StatsDashboard` 36→4 · `Settings` 32→0 · `SkillTree` 10→0), cùng 15
> file vừa và nhỏ.
>
> **THÊM MỘT PHÉP DỜI GIỜ, KHÔNG PHẢI MỘT NHỊP THỨ TƯ.** `withDelay(enterMotion, i * 0.03)` —
> danh sách hiện SO LE vẫn dùng ĐÚNG nhịp `enter`, chỉ khác thời điểm bắt đầu. Là hàm THUẦN nên
> gọi được trong `.map()` (chỗ hook bị cấm), và nó tự giữ lời hứa Giảm chuyển động: lúc ấy preset
> là object rỗng, không có `transition` để dời, nên nó trả lại đúng object rỗng ấy. Không có nó
> thì 5 danh sách kia mỗi cái lại phải tự khai một bộ `initial`/`animate` riêng chỉ để cài một
> con số `delay` — tức đẻ ra đúng thứ đang đi xoá.
>
> **CỔNG MỚI `src/lib/motionCoverage.test.js`** — `motionPresets.test.js` canh ba nhịp có ĐÚNG
> không; nó KHÔNG canh được cả app có DÙNG chúng không. Cổng mới đếm khai báo rời rạc từng file
> rồi so với BẢNG NGOẠI LỆ tường minh (đúng khuôn `assert.deepEqual(TRUOT, [4])` của địa hình).
> Có **cả hai vế**: file ngoài bảng phải bằng 0, **và** file trong bảng mà dọn bớt rồi thì phải hạ
> số xuống — không có vế sau thì bảng chỉ có thể to ra và những con số cũ lặng lẽ thành chỗ trống
> cho lần trôi sau.
>
> **⚠️ PHÉP THỬ NGƯỢC BẮT ĐƯỢC MỘT LỖ THẬT TRONG CHÍNH CÁI CỔNG VỪA VIẾT — VÀ NÓ SUÝT LÀM TÔI KẾT
> LUẬN NGƯỢC.** Ba phép phá đầu tiên chạy ra "2 vẫn xanh"; phản xạ đầu là *"bài test không có
> răng"*. Sai — theo đúng luật đã ghi (Phase 8A) thì nghi PHÉP PHÁ trước, và lần này cả hai đều
> hỏng: tôi bơm khai báo vào **chung một dòng với thẻ**, trong khi phép đếm neo `^\s*` vào ĐẦU
> DÒNG. Nhưng đi tiếp một bước nữa mới ra chuyện đáng nói: **cái neo ấy là một lỗ thật**. Lối viết
> gọn một dòng CÓ THẬT trong kho — `FocusRail.jsx` **3 dòng**, `BuildingWorkshop.jsx` **2 dòng** —
> và cả hai file ấy tôi đã **bỏ sót hoàn toàn** ở lượt quét trước vì chính cái neo đó. Vá phép đếm
> xong thì tổng nhảy từ 55 lên 65 và hai file kia lộ ra. ⇒ *Khi phép phá không nổ, nghi phép phá
> trước — rồi hỏi tiếp "vì sao nó không nổ?", vì câu trả lời có thể là một lỗ trong chính phép đo.*
>
> **⚠️ VÀ MỘT PHÉP PHÁ THỨ NĂM CHỈ RA BÀI ĐỐI CHỨNG CHƯA NHỐT ĐÚNG LỖI VỪA TÌM.** Neo lại `^\s*`
> vào phép đếm thì **cả 4 phép phá kia vẫn đỏ mà cổng vẫn xanh** — vì sau khi dọn xong, mọi khai
> báo CÒN LẠI đều tình cờ nằm ở đầu dòng, nên phép quét file không phân biệt được hai bản regex.
> Chỉ một ca tổng hợp viết-gọn-một-dòng trong bài đối chứng mới phân biệt được. ⇒ *Đối chứng phải
> nhốt đúng bộ số hỏng vừa tìm ra, không phải một ca "tương tự".*
>
> **⚠️ SUÝT SHIP MỘT CHÚ THÍCH NÓI NGƯỢC VỚI MÃ.** `AchievementToast` được viết `useCustomMotion`
> (bỏ hẳn) trong khi chú thích ngay trên nó ghi "nhảy tới đích". Thẻ ấy đặt `left-1/2` rồi kéo
> ngược lại bằng `x: '-50%'` để CĂN GIỮA — bỏ hẳn là dải thông báo lệch sang phải đúng nửa bề
> ngang của chính nó. Đã đổi sang `useSnapMotion`. Thứ bắt được là việc **đọc lại chú thích mình
> vừa viết và hỏi nó có khớp mã không**, không phải một cổng nào cả.
>
> **DỌN KÈM:** prop `reducedMotion` truyền tay xuống `SkillNode`/`SynergyPanel`/`BuildingCard`/
> `TodayMissionRow` nay là prop CHẾT (cái gác đã lo) — đã gỡ khỏi cả chữ ký lẫn chỗ gọi; 4 bản vá
> tay kiểu `width: reduceMotion ? … : undefined` cũng đã gỡ vì `useSnapMotion` đã làm đúng việc đó
> ("một luật một công thức"). ⚠️ `reduceMotion` của `CityStage` thì GIỮ — nó còn nuôi `CityScene3D`.
>
> **⚠️ GỘP `main` (16 commit của BỐN phiên khác) — VÀ CỔNG MỚI ĐÃ LÀM ĐÚNG VIỆC NGAY LẦN ĐẦU.**
> Bốn phiên song song đã đẩy lên `main` trong lúc làm việc này, chạm đúng những file vừa sửa.
> Ba điều đáng ghi: **(a)** họ đã LẤY `motionPresets` của lượt trước và xây tiếp trên đó —
> `ResourceDisplay` viết lại hoàn toàn và tự import `EASE`/`useEnterMotion`/`useSnapMotion`,
> nên chỉ việc lấy bản của họ; **(b)** `AchievementToast.jsx` bị **XOÁ** ở `main` (thay bằng
> `RewardToastHost`, và có hẳn một bài test đòi file cũ phải biến mất) — giữ bản sửa của tôi là
> làm hỏng việc của họ, nên chấp nhận xoá; **(c)** `motionCoverage.test.js` chạy trên cây đã gộp
> và báo đúng MỘT chỗ: `ResourceDisplay` nay 0 mà bảng vẫn ghi 2. Đó là **vế NGƯỢC LẠI** của cổng
> — vế mà tôi suýt không viết — và nó vừa chứng minh mình có ích ngay lần chạy đầu tiên trên mã
> của người khác. Số sau khi gộp: **52 trên 10 file**, quét 45 file `.jsx`.
> Tài liệu gộp theo lối GIỮ CẢ HAI BÊN: không nhật ký của phiên nào bị mất.
>
> **CỐ Ý ĐỨNG NGOÀI:** `city/CityGrowthMoment.jsx` (13) là một **đoạn phim 3,2 giây** có ba luật
> cứng riêng, và nó **không hề được dựng** khi bật Giảm chuyển động (`App.jsx` chặn từ đầu) — ép nó
> vào `enter` là làm hỏng một cảnh diễn để đổi lấy một con số đẹp. `render3d/` vẫn nguyên (three.js).
>
> ---
>
> Cập nhật trước đó: **2026-08-27 (tối)** — **MỌI CHUYỂN ĐỘNG VỀ ĐÚNG BA NHỊP.**
> Cập nhật lần cuối: **2026-08-27 (tối)** — **MỌI PHẦN THƯỞNG NÓI CHUNG MỘT THỨ TIẾNG, VÀ CHỈ
> Cập nhật lần cuối: **2026-08-27 (đêm)** — **PHASE 21 §1: ĐÃ GỘP `main` VÀO NHÁNH PHASE 21.**
>
> `main` đi thêm 20 commit trong lúc Phase 21 làm việc. Gộp xong: **0 xung đột ở mã nguồn**, cả 5
> xung đột đều là "hai bên cùng thêm một mốc mới vào đầu file tài liệu" ⇒ giữ CẢ HAI, mốc của
> `main` (27/8) đứng trước, mốc Phase 21 (24/8) đứng sau kèm nhãn *(mốc trước)*.
>
> **HAI VA CHẠM SỐ, cả hai im lặng.** Không có gì đỏ lên khi hai nhánh cùng đặt MỘT cái tên cho
> HAI thứ khác nhau — đây là loại lỗi mà chỉ việc đi gộp mới lộ ra:
> · **ADR-060**: `main` = "MỘT ngôn ngữ hình cho mọi phần thưởng"; Phase 21 = "Bộ xương thành phố
>   SINH THEO KỶ". `main` đã lên production nên nó giữ số; Phase 21 đổi sang **ADR-066** (33 chỗ).
> · **TECH_DEBT #86/#87**: `main` = 137 nút không đọc token skin / báo cáo tuần tự bật; Phase 21 =
>   trục chặng ngày dưới ngưỡng mắt / chia ô thành khu phố làm 4 kỷ thấp đi. Phase 21 đổi sang
>   **#89** và **#90** (40 chỗ).
>
> ⚠️ **BÀI HỌC — ĐỔI SỐ TRONG TÀI LIỆU TRỘN CHỦ ĐỀ THÌ PHẢI ĐỔI THEO TỪNG DÒNG, KHÔNG THAY HÀNG
> LOẠT.** Cùng một chuỗi `#86` trong CÙNG một file có thể thuộc hai chủ nhân khác nhau, cách nhau
> vài trăm dòng — `TECH_DEBT.md` có đúng tình huống đó. Cách làm: phân loại từng chỗ theo NỘI DUNG
> câu văn quanh nó (từ khoá "137 nút"/"token skin" ⇒ của `main`; "chặng ngày"/"11,33"/"khu phố" ⇒
> của Phase 21), rồi thay theo danh sách (file, dòng) đã phân loại, và mỗi lần thay đều đếm số chỗ
> khớp — 0 chỗ khớp là một KẾT QUẢ, không được để nó im lặng thành "đã xong". Với file chỉ-thành-phố
> (`block.test.js`) thì thay hàng loạt vẫn an toàn.
>
> **HAI KHUYẾT TẬT CÓ SẴN LỘ RA TRONG LÚC GỘP** (cả hai đã có ở `65f3422`, không phải do gộp):
> · `TECH_DEBT.md` có `## #78` **hai lần** — một bản mang dấu ✅ ĐÃ ĐÓNG nhưng chỉ có ghi chú đóng,
>   một bản mang tiêu đề MỞ mang cả phần thân; chúng bị một mục khác chen vào giữa nên tách rời từ
>   lúc #78 được đóng. `main` đã có hình đúng (ghi chú + thân liền một khối) nên ghép lại theo hình
>   của `main`, rồi ĐỐI CHIẾU: sau khi ghép, mục #78 giống hệt từng byte bản của `main`.
> · **ADR-066 chứa nguyên một thân ADR thứ hai** — toàn bộ thân ADR-061, chỉ thiếu dòng tiêu đề
>   `## ADR-061`. Vì thiếu đúng dòng tiêu đề nên KHÔNG phép đếm nào thấy được: `grep '^## ADR-'` ra
>   66 mục không trùng số, file vẫn đọc trôi chảy. Thứ để lộ ra là hai dòng `**Ảnh hưởng**` GIỐNG
>   HỆT nhau ở hai chỗ cách nhau 110 dòng — một câu nói về phép lùi khung hình lại nằm trong bản ghi
>   về chia đôi đệ quy. Đã đối chiếu 45 dòng ấy với thân ADR-061 hiện có (giống hệt) rồi mới xoá.
>
> **CỔNG ĐÃ CHẠY LẠI SAU KHI GỘP** — `test:fast` **1.266 bài · 1.265 pass · 0 fail · 1 skipped**
> (tăng từ 1.184, `main` mang sang ~82 bài) · `test:cross` 3/3 · lint sạch · build ✓ 5,27s · PWA 55
> mục / 1.892,57 KiB · `blockStyle.test.js` riêng 16/16.
>
> **BẢN QUÉT ĐO LẠI SAU KHI GỘP — KHÔNG TRÔI MỘT CHỮ SỐ**: chặng gần nhất **12,11** · kỷ gần nhất
> **22,14** · trung vị **36,42** · 0/15 và 0/105. ⚠️ Và theo đúng bài học *"bản quét không đổi một
> chữ số không chứng minh được gì cả"*, con số giống hệt ở đây MỚI là kết quả đúng — vì đã kiểm
> `git diff` trên tầng màu 3D (`palette3d.js` · `cityTokens.js` · `themeBridge.js` ·
> `cityBackdropScrim.js`) và **toàn bộ thay đổi từ `main` chỉ là CHÚ THÍCH** (app thêm skin thứ 5
> nên "8 tổ hợp" → "10 tổ hợp"); không một giá trị màu nào đổi. Nói cách khác sự đứng yên ấy chứng
> minh **skin arcade mới của `main` KHÔNG rò vào cảnh 3D**.
>
> ⚠️ **VẪN CHƯA GỘP NGƯỢC LÊN `main`** — chỉ thị Phase 21 ghi rõ *"Push nhánh phụ, không tự gộp
> `main`"*. Nhánh đang ở `e3235e0`.

---

> *(mốc trước)* **2026-08-27 (tối)** — **MỌI PHẦN THƯỞNG NÓI CHUNG MỘT THỨ TIẾNG, VÀ CHỈ
> BỐN VIỆC CÒN ĐƯỢC CHẶN MÀN HÌNH** (ADR-060).
>
> Bảy đường trao thưởng, bảy cách vẽ — và riêng `LootDropModal` đã có **BA hình cho ba loại thưởng
> trong CÙNG một hộp thoại** (`SupportRewardCard` · thẻ `ResourceCascade` · `BonusPill`). Về màu thì
> có **bốn từ vựng rời nhau** cùng trả lời một câu hỏi *"cái này quý tới đâu?"*. Nay tất cả đi qua
> `src/components/shared/RewardCard.jsx` với **đúng bốn bậc** (thường `--muted` · tốt `--good` ·
> hiếm `--warn` · huyền thoại `--accent`), mỗi bậc có **nhãn chữ + dải chấm** nên đọc được cả khi
> không nhìn màu.
>
> **LUẬT MỚI (Đàm ra):** chặn màn hình CHỈ dành cho **lên kỷ · thăng hoa · khủng hoảng kỷ · thảm
> hoạ** — bốn việc buộc phải QUYẾT ĐỊNH. Phiên thường, di vật, thành tích, nhiệm vụ ngày, lên cấp
> nay trượt vào góc màn hình, tự tắt sau 4 giây, bấm vào mới mở chi tiết; quá 3 thẻ thì phần dư gộp
> thành một dòng *"và N phần thưởng khác"*.
>
> **⚠️ PHÁT HIỆN LỚN NHẤT CỦA PHIÊN: BA KÊNH THÔNG BÁO ĐÃ CHẾT TỪ LÂU MÀ KHÔNG AI BIẾT.**
> `relicNotification` · `rankUpNotification` · `missionCompletedIds` được store GHI đầy đủ, có cả
> hàm dismiss riêng — mà **không một màn hình nào ĐỌC**. Nghĩa là **nhận một di vật (phần thưởng quý
> nhất game, chỉ có khi vượt qua một khủng hoảng kỷ) xưa nay không hiện gì cả**. Không có gì đỏ lên:
> build xanh, lint sạch, test xanh. Đúng hình dạng `TECH_DEBT` Phase 4H (*hàm engine chưa có ai gọi*).
> Chồng toast là chỗ đọc ĐẦU TIÊN của cả ba.
>
> **⚠️ MỘT HỒI QUY ĐÃ TỰ GÂY RA RỒI TỰ BẮT — ghi lại vì nó suýt lọt.** Lễ mừng thành phố
> (`CityGrowthMoment`) nằm TRONG `RewardSequence`, mà `RewardSequence` chỉ dựng khi hộp thoại phần
> thưởng bật. Bản vá đầu siết đúng cái cổng ấy ⇒ **lễ mừng "vừa xây xong một công trình" biến mất ở
> mọi phiên thường**, im lặng tuyệt đối. Nay nó bám `lootModalOpen` (mọi phiên) và nằm trong
> `blocking` để đồng hồ toast không cháy sau lưng nó. Đã khoá bằng test đã-thử-cho-đỏ.
>
> **⚠️ BỐ CỤC THẺ BỊ ẢNH DỰNG BÁC HAI LẦN, KHÔNG PHẢI MỘT.** Bản 1 xếp `[bậc] [mô tả]` chung hàng ⇒
> mô tả cắt còn *"Tài ng…"*, *"Đ.."*. Bản 2 đưa bậc lên cạnh TÊN ⇒ lần này TÊN chịu trận:
> *"Nghiên cứu"* → *"N."*. Bản 3 (đang dùng): tên chiếm trọn hàng trên với `line-clamp-2`, `[bậc]
> [mô tả]` ở hàng dưới có `flex-wrap`. Ở khung **390px** thẻ chỉ rộng **308px**, nên `truncate` cho
> ra *"Thưởng trọn n…"* — chỉ ảnh trên khung điện thoại mới lộ ra, khung 1280 hoàn toàn không thấy.
>
> **Không đổi một luật tính thưởng nào.** Store vẫn bật `lootModalOpen` ĐỒNG BỘ y như cũ (ba bài ở
> `completeFocusSession.test.js` khẳng định điều đó) — thay đổi nằm hoàn toàn ở tầng hiển thị, đúng
> điểm cắm `RewardSequence` đã chọn từ Phase 4′. `dismissAchievementNotification`/
> `dismissMissionNotification` nhận thêm **id tuỳ chọn** (không truyền thì hành vi y hệt bản cũ): ba
> thẻ chồng nhau có ba đồng hồ riêng nên thẻ thứ ba có thể hết trước thẻ thứ nhất, và `slice(1)` lúc
> đó bỏ nhầm một thành tích Đàm chưa kịp đọc.
>
> **Ngoại lệ DUY NHẤT còn lại:** báo cáo tuần vẫn tự bật sáng thứ Hai. Cố ý — nó là bản tổng kết chứ
> không phải phần thưởng, và `dismissWeeklyReport` đánh dấu tuần đã xem, nên lỡ một cái toast 4 giây
> = **mất báo cáo của cả tuần**. Ghi `TECH_DEBT #87` kèm điều kiện bắt buộc phải làm trước.
>
> **⚠️ GỘP `main` GIỮA PHIÊN — ba phiên khác đã đổi đúng những file này.** `main` nhận thêm "ba
> nhịp chuyển động" (`src/lib/motionPresets.js`) + điều hướng 5 mục + thanh tài nguyên mới, đụng
> `App.jsx` (359 dòng), `LootDropModal`, `LevelUpModal` và bốn modal khác. Bốn xung đột, **không
> vứt bỏ gì của ai**: `ResourceCascade` giữ CẢ bản vá `reduceMotion` của họ LẪN việc chuyển sang
> `RewardCard` của mình; ba file tài liệu giữ cả hai nhật ký. Và vì luật mới của họ (*"đừng gõ lại
> `initial`/`animate` bằng tay"*) ra đời SAU khi tôi viết `RewardToastHost`, tôi đã chuyển nó sang
> `useEnterMotion()` — **cố ý KHÔNG dùng `useRewardMotion()`** dù đây đúng là thẻ phần thưởng: nhịp
> `reward` là nhịp đắt nhất, dành cho cột mốc, mà thẻ này nổ sau MỌI phiên (`motionPresets.js` ghi
> rõ *"dùng bừa thì nó hết là phần thưởng"*). `enter` cũng là nhịp DUY NHẤT có `exit`, thứ một chồng
> toast bắt buộc phải có.
>
> Test **1163 → 1187 bài của riêng phần này, 0 đỏ** (+24: 5 thang bậc · 11 hàng đợi toast · 8 nối
> dây); sau khi gộp `main` là **1234 bài, 0 đỏ**. Lint sạch, build xanh. Ảnh nghiệm thu: chồng 3 thẻ + dòng phần dư · thẻ trong hộp thoại phần thưởng · thẻ ở
> Nhiệm vụ (cả 1280 và 390) · hộp thoại lên kỷ vẫn chặn màn hình đầy đủ.

---
> *(mốc trước)* **2026-08-27 (tối)** — **THANH TÀI NGUYÊN RÚT TỪ "BÀY HẾT" XUỐNG "BA CON SỐ
> CỘNG MỘT THANH".** Đàm: bản cũ bày cùng lúc EP · chặng · tài nguyên thô · tinh chế · RP · tinh thể,
> **tất cả cùng một trọng lượng thị giác**, nên không thứ nào nổi lên. Nay LUÔN hiện đúng ba thứ —
> thanh tiến độ kỷ (trọn chiều ngang, nhãn `Kỷ N · chặng i/n`, chạy `var(--accent)` trên nền
> `var(--line)`) · `chuỗi` · `tinh thể` — mọi thứ còn lại nằm sau nút **Kho**. ⚠️ **ĐỔI CHỖ, KHÔNG
> XOÁ**: không một con số nào biến mất, bấm "Kho" là thấy đầy đủ y như trước (kèm cả tên giai đoạn
> và khoảng EP của chặng, hai thứ trước đây nằm ở thân thẻ).
>
> **Ba luật trình bày, mỗi luật MỘT công thức, đặt ở `resourceDisplayFormat.js`** — file `.js` thuần
> **cố ý**, vì `node --test` không biên dịch JSX nên luật nằm trong `.jsx` là luật không bài test nào
> chạm tới được. `NUMBER_STYLE` (mọi con số `tabular-nums`, đông cứng bằng `Object.freeze`) ·
> `labelSizeFor()` (nhãn nhỏ hơn số 40% + màu `var(--muted)` — đây mới là thứ khiến con số được đọc
> trước) · `shouldFlashOnIncrease()` (số TĂNG thì nháy `var(--good)` 400ms).
>
> **⚠️ BỐN CÁI BẪY, CÁI NÀO CŨNG TỰ CẮN TRONG PHIÊN NÀY:**
> **(1) `setState` thẳng trong thân `useEffect` → lint bắt (`react-hooks/set-state-in-effect`).** Nó
> đẻ một lượt dựng THỪA và làm cú nháy trễ đúng một khung hình — tức cơ chế sinh ra để chỉ ra "số vừa
> đổi" lại là thứ chỉ ra muộn. Vá bằng khuôn "điều chỉnh state khi prop đổi" của React: so cũ↔mới
> **trong lúc dựng**, effect chỉ còn giữ đồng hồ 400ms.
> **(2) Cờ `true/false` KHÔNG re-arm được đồng hồ.** Số tăng lần hai lúc đang nháy dở thì
> `setFlashing(true)` là phép gán TRÙNG GIÁ TRỊ ⇒ React bỏ qua ⇒ effect không chạy lại ⇒ 400ms vẫn
> tính từ lần tăng ĐẦU. Nay là một **thẻ đếm** (`token => token + 1`), mỗi lần tăng bump một nấc.
> **(3) Bài test đọc-mã bản đầu ĐỎ trên mã hoàn toàn đúng** — nó cắt vùng "luôn hiện" bằng
> `code.slice(0, cổngKho)`, tức quét luôn phần ĐỊNH NGHĨA `TopStat`/`KhoRow` (bên trong có
> `<FlashNumber>`) và khối `useGameStore` khai `researchRP`. **Định nghĩa ≠ lời gọi; khai báo biến ≠
> dựng ra màn hình** — cùng họ bài học `/tênHàm\(/` đã ghi ở `CLAUDE.md`. Nay chặn CẢ HAI ĐẦU (từ
> `return (` của `ResourceDisplay` tới cổng Kho) kèm gác chống-tập-rỗng.
> **(4) Một assert dạng HOẶC là cái phễu, không phải hàng rào.** Bài canh "thẻ đếm" bản đầu viết
> `(?:token\) => token \+ 1|0)`; phá vế bump thì vế `setFlashToken(0)` vẫn khớp và bài test **vẫn
> xanh**. Nay hỏi TỪNG vế một. Phát hiện được **chỉ nhờ chạy phép thử ngược** — không có nó thì bài
> test đứng đó như một lời bảo chứng rỗng.
>
> **⚠️ VÀ MỘT LỖI CHỈ CON MẮT BẮT ĐƯỢC, KHÔNG CỔNG NÀO BẮT.** Bản đầu cho "Khoảng EP của chặng" vào
> `KhoRow` như một con số bình thường. Test xanh, lint sạch, build xanh — nhưng ảnh chụp cho thấy nó
> chiếm cỡ chữ của một con số đầu bảng, át cả panel, **còn xén mất nhãn của chính nó** (`KHOẢNG EP
> CỦA C…`). Tệ hơn: nó sẽ nháy `var(--good)` mỗi lần Đàm sang kỷ khác — một lời khen cho việc chẳng
> ai làm. **Khoảng EP là một RANH GIỚI CỐ ĐỊNH, không phải một số dư đếm được**, nên nay nó là một
> dòng chú thích nhỏ màu `--muted`, không đi qua `FlashNumber`.
>
> **Nghiệm thu bằng ẢNH THẬT** (`scripts/shot.mjs`, sau `npm run build`): máy bàn 1280 + điện thoại
> 390 THẬT (`scrollWidth=390 · không tràn`) + theme tối, cả hai trạng thái đóng/mở Kho, và một lượt
> có `--fixture` để thấy thanh tiến độ chạy thật (`1.320 / 1.867 EP`, kỷ 8 chặng 3/3).
> Cổng: **1174 bài · 0 đỏ · `# skipped 1`** · lint sạch · build 3,56s.
> **⚠️ GỘP VỚI `main` — THẺ NÀY ĐÃ ĐI THEO LUẬT BA NHỊP MỚI.** Trong lúc làm, một phiên khác đưa
> `src/lib/motionPresets.js` lên `main` (mọi chuyển động về đúng ba nhịp). Thẻ này **KHÔNG** giữ
> `initial`/`animate` gõ tay nữa: thanh tiến độ đi qua `useSnapMotion` (ngoại lệ đúng nghĩa — `animate`
> ở đây MANG BỐ CỤC, bề rộng CHÍNH LÀ tiến độ, trả rỗng là thanh biến mất; chú thích của chính
> `useSnapMotion` gọi tên thẳng "chiều dài thanh tiến độ"), và cú nháy màu — một `transition` của CSS
> nên ba nhịp không trải vào được — lấy tín hiệu Giảm chuyển động từ `useEnterMotion()` trả object
> RỖNG thay vì tự gọi `useReducedMotion`, đồng thời mượn nguyên thời lượng + đường cong của nhịp
> `enter` để không đẻ ra thời lượng thứ sáu. Có thêm một bài test khoá cả ba điều đó (đã thử ngược).
>
> Cổng sau khi gộp: **1181 bài · 0 đỏ · `# skipped 1`** · lint sạch · build 3,27s · chụp lại ảnh
> nghiệm thu: thanh tiến độ vẫn chạy đúng `var(--accent)`, không tràn.
>
> ⚠️ **CHƯA TỰ XÁC NHẬN ĐƯỢC VERCEL "READY" TỪ HỘP CÁT NÀY — VÀ ĐÂY LÀ VIỆC ĐÀM PHẢI LIẾC MẮT.**
> Luật số 2 ở `START_HERE.md` bắt "push xong phải xác nhận Vercel hiện Ready". Phiên này chạy trong
> hộp cát từ xa, nơi chính sách mạng **chặn `pomodoro-dc.vercel.app`** (proxy trả 403 ở bước CONNECT)
> và repo **không có GitHub Actions** (`total_count: 0` — deploy đi qua tích hợp GitHub của Vercel,
> thứ gắn *commit status*, mà bộ công cụ GitHub ở đây không đọc được commit status). ⇒ Xác nhận được
> tới đâu thì ghi tới đó: commit `2d1a096` **đã nằm trên `origin/main`**, và bản trên `main` **có đủ**
> `resourceDisplayFormat.js` + `resourceDisplay.test.js` + đúng ba `<TopStat>`. Việc còn lại — tab
> Deployments hiện "Ready" — **chưa ai kiểm**. Đúng bài học `8ee264d`: *code xanh + commit thành công
> KHÔNG có nghĩa là đã thực sự lên production*. Phiên sau chạy trong hộp cát này đừng mất công thử
> `curl` lại; hoặc nhờ Đàm liếc, hoặc chạy từ máy Đàm.
> *(mốc trước)* **2026-08-27 (tối)** — **ĐỒNG HỒ TRẢ LỜI HAI CÂU HỎI THAY VÌ MỘT.**
> Vòng chính dày 14px (từ 7), bo tròn hai đầu, màu theo token — tập trung `--accent`, nghỉ (ngắn
> LẪN dài) `--good`, nền `--timer-track`. Thêm **vòng thứ hai** mảnh 4px nằm ngoài, cách đúng 8px,
> màu `--warn`: tiến độ MỤC TIÊU NGÀY. Con số ở giữa to thêm 20%, weight 800, `tabular-nums`; ngay
> dưới là dòng 13px `--muted` ghi "Phiên 2/5 hôm nay".
>
> **⚠️ MỘT NGUỒN SỰ THẬT CHO "HÔM NAY", VÌ HAI CON SỐ NÀY NẰM CÁCH NHAU VÀI PHÂN.** Vòng mục tiêu
> quanh đồng hồ và thẻ "Hôm nay" ở cột phải nói về cùng một thứ. Chép công thức sang là chắc chắn
> có ngày chúng lệch — và triệu chứng là màn hình tự mâu thuẫn với chính nó, không có gì đỏ lên.
> Đã tách `countSessionsOnDay` · `sumFocusMinutesOnDay` · `getDailyGoalProgress` sang `gameMath.js`
> (thuần, `todayKey` là tham số BẮT BUỘC nên module không đọc đồng hồ máy), `App.jsx` nối vào đó.
> Trước đây chỉ có MỘT bản ở `App.jsx` — nay vẫn một bản, nhưng hai nơi dùng.
>
> **⚠️ HAI QUẢ MÌN TỰ TAY GÂY RA, ĐO MỚI THẤY:**
> **(1) Nâng cỡ chữ 20% làm số 3 chữ số TRÀN khỏi lòng đĩa ở khung 390px.** Nhánh cỡ chữ không
> immersive là nhánh DUY NHẤT không có ràng buộc bề rộng. Đo thật: "180:00" (bấm giờ chạy quá 100
> phút — `clampFocusMinutes` cho tới 180) ở `tracking-widest` rộng **247px trên lòng đĩa 238px ⇒
> tràn 9px** đè lên vòng. Bản cũ cỡ nhỏ hơn nên vẫn vừa (dư 32px) ⇒ **do chính phép nâng cỡ sinh
> ra**. Vá bằng `tracking-wide` (đo: 215px, dư 23px), giữ nguyên mức tăng 20%. Cả 12 mốc đáp ứng
> đều nhân đúng ×1,196–1,204.
> **(2) `drop-shadow(0 0 12px ${ringColor}55)` — ghép chuỗi để lấy màu mờ — chỉ hợp lệ khi màu là
> mã hex.** Từ lúc màu vòng đọc token nó cho ra `var(--accent)55`, một giá trị CSS vô nghĩa nên
> quầng sáng im lặng biến mất. Thật ra nó **đã hỏng sẵn ở theme sáng từ trước** (ở đó `RING_COLORS`
> vốn đã là token); chỉ nhánh tối còn chạy nhờ hai mã hex cứng `#60a5fa`/`#38bdf8` — mà hai mã ấy
> chính là thứ vừa bị gỡ vì không thuộc bảng màu của skin nào. Vá bằng `color-mix` (giữ `var()`
> sống, dự án đã dùng ở `cityBackdropScrim.js`).
>
> **⚠️ CÔNG CỤ ĐO NÓI DỐI, LẦN NÀY VÌ MỘT LÝ DO MỚI: `transition-all`.** Phép đo bề rộng chữ dựng
> một bản sao của thẻ số rồi đổi `letter-spacing` và đọc ngay — bốn giá trị khác nhau ra **cùng một
> con số**. Bản sao thừa hưởng `transition-all duration-300`, mà `letter-spacing` là thuộc tính
> CHUYỂN ĐỘNG ĐƯỢC, nên nó chưa kịp đổi lúc đọc; `textContent` thì không chuyển động nên chuỗi khác
> nhau vẫn ra số khác nhau — đủ để trông như phép đo đang chạy. ⇒ **Mọi phép đo dựng bản sao để đo
> phải đặt `transition: none` trước.**
>
> **Không đo được trạng thái "đang chạy"/"đang nghỉ" bằng trình duyệt** — luật số 4 cấm start phiên
> trên dev (dùng chung dòng Supabase với bản thật). Nên màu hai trạng thái ấy khoá bằng test đọc-mã
> (`timerRing.test.js`, 7 bài) cộng 5 bài thuần cho helper mới. **Cả 10 phép thử ngược đều đỏ đúng
> chỗ** — sau khi vá một bài **MÙ**: phép so `khoảngTrống === GAP` là một **hằng đẳng thức** vì
> `GOAL_RING_RADIUS` suy ra TỪ `GAP`, nên hạ `GAP` về 0 vẫn xanh (đúng bài học ADR-048 "bất biến
> đúng theo cấu tạo thì không phải một cái gác"). Đã thêm sàn QUAN HỆ `GAP >= GOAL_RING_STROKE`.
>
> **Fixture ảnh chụp đã sửa để soi được chính tính năng này.** `shot.mjs` không có phiên nào của
> hôm nay ⇒ vòng mục tiêu luôn vẽ 0% ⇒ VÔ HÌNH trong mọi ảnh. Phải seed vào `history` chứ không vào
> `dailyTracking` (store dựng lại bộ đếm từ history mỗi lần nạp — seed thẳng bị ghi đè về 0 trong im
> lặng, đã đo); và lùi 10/20 PHÚT chứ không vài giờ, vì chạy gần nửa đêm giờ VN thì mốc lùi 3 giờ
> rơi sang hôm qua và fixture lặng lẽ còn 1 phiên (cũng đã đo). Khoá ngày nhập THẲNG `localDateStr`
> từ mã sản phẩm, không viết lại phép đổi múi giờ.
>
> **Nghiệm thu bằng trình duyệt thật**: track `#e3e0d9` (`--timer-track`) · vòng chính r=128 nét 14
> `round` · vòng mục tiêu r=145 nét 4 `#e0921f` (`--warn`), vẽ `911,1 − 546,6 = 364,5` = **đúng 40%**
> khớp 2/5 · số 72px weight **800** `font-variant-numeric: tabular-nums` · "25:00" và "99:59" **cùng
> 177px** ⇒ đếm lùi không nhảy ngang · dòng phụ 13px `#6b675f` (`--muted`).
>
> **CÒN LẠI, KHÔNG SỬA VÌ NGOÀI PHẠM VI**: con số đồng hồ vẫn dùng `lightTheme ? 'serif' : 'font-mono'`
> và `.serif` chốt cứng `'Source Serif 4'` — tức ở skin Sân Chơi (sans) con số vẫn là serif. Cùng họ
> bệnh với `ActionButton` đã chữa hôm nay; đổi sang `var(--skin-font-display)` là một dòng, nhưng đó
> là một quyết định mỹ thuật nên để Đàm quyết.
>
> Cổng: `npm test` **1.175 bài · 1.174 pass · 0 fail · 1 skipped** (+12 bài mới) · `test:cross` 3/3
> · lint sạch · build xanh.
> *(mốc trước)* **2026-08-27 (khuya)** — **ĐIỀU HƯỚNG CHÍNH: 8 MỤC → 5, BẰNG CÁCH GỘP.**
> Ba màn Kỹ năng · Kho báu · Thành tích nay là ba TAB CON của **"Hành trang"**. Desktop còn đúng 5
> mục (Tập trung · Hành trang · Thành Phố · Thống kê · Cài đặt); iPhone còn 4 nút (Tập trung ·
> Nhiệm vụ · Hành trang · Thành Phố) + nút "Thêm" giữ Thống kê và Cài đặt. **Không màn nào bị xoá**
> — mỗi tab con vẫn dựng đúng component cũ, với đúng state cũ.
>
> **Vì sao Thành Phố quay lại nhóm chính.** Chú thích cũ ghi *"Thành Phố CỐ Ý không nằm trong nhóm
> chính: thanh dưới iPhone giữ đúng 4 nút"*. Lý do ấy vẫn đúng, nhưng TIỀN ĐỀ của nó đã chết: hồi đó
> ba màn kia ăn ba ô nên phải hy sinh một mục. Gộp xong thì ô thứ tư trống ra, và Thành Phố — mặt
> trận đang xây — là thứ đáng nhận nó. Thứ đổi chỗ là "Thống kê" (nay sau nút "Thêm"): nó là chỗ
> ngồi ĐỌC, không phải chỗ bấm vào giữa một phiên. Chú thích cũ đã viết lại kèm cả lý do đổi.
>
> **⚠️ BỐN ĐIỀU PHẢI BIẾT TRƯỚC KHI SỬA TIẾP:**
> **(1) ID CŨ ĐƯỢC GIỮ NGUYÊN, VÀ ĐÓ KHÔNG PHẢI SỰ LƯỜI.** Ba tab con vẫn mang id `skills` ·
> `collection` · `achievements` vì **thông báo đã LƯU trong localStorage của Đàm** mang sẵn
> `action: { tab: 'skills' }` và `{ tab: 'collection', collectionTab: 'workshop' }`. Đổi id ở nguồn
> cho "gọn" thì mọi thông báo cũ bấm vào **không đi đâu cả**, và không có gì đỏ lên. Cửa dịch là
> `resolveTabTarget` trong `App.jsx`; `selectTab` gọi nó nên MỌI lời gọi cũ vẫn đúng. Có một bài
> test quét CẢ `gameStore.js` lẫn `NotificationCenter.jsx` đòi mọi `tab: '…'` phải còn tới được.
> **(2) BA PHÉP ĐẾM "CÓ VIỆC ĐANG CHỜ" ĐÃ RA KHỎI `NotificationCenter.jsx`.** Chúng nay ở
> `src/engine/opportunities.js` vì có HAI người đọc: cái chuông, và cái chấm trên tab Hành trang.
> Chép chúng về lại là "một luật hai công thức" — hai bản sao trôi khỏi nhau ở BIÊN rồi chuông báo
> có việc trong khi chấm im, mà mỗi bên vẫn tự nhất quán với chính nó nên không gì đỏ lên. Đã khoá
> bằng một bài test đọc mã nguồn.
> **(3) DẤU "THÀNH TÍCH ĐÃ XEM": `null` KHÁC `[]`.** `dc-nav-seen-v1` chưa từng ghi (`null`) nghĩa
> là *"máy này chưa bật cơ chế"* ⇒ **không có gì là mới**; ghi rồi mà rỗng (`[]`) nghĩa là *"chưa
> xem gì cả"* ⇒ **mọi thứ đều mới**. Nhập hai thứ đó làm một thì lần đầu mở app cái chấm sáng oan
> cho hàng chục thành tích Đàm đã xem từ lâu — và một cái chấm kêu oan thì lần sau anh sẽ bỏ qua
> nó, kể cả khi nó kêu đúng. Dấu chỉ được ghi khi Đàm mở ĐÚNG tab con "Thành tích", không phải khi
> đi ngang qua "Hành trang".
> **(4) `useInventoryAttention` TRẢ VỀ MỘT BOOLEAN, KHÔNG PHẢI MỘT MẢNG.** Selector zustand so bằng
> `Object.is`, nên gốc app chỉ render lại khi cái chấm THẬT SỰ bật/tắt. Đổi nó thành mảng/đối tượng
> là cho `App` — thứ bọc cả cảnh 3D — render lại theo từng con số tài nguyên nhúc nhích.
>
> **⚠️ MỘT ĐIỀU CHƯA KIỂM ĐƯỢC, NÓI THẲNG RA.** Đường vào từ **thông báo** (bấm một dòng cơ hội
> trong chuông) không lái được bằng `scripts/shot.mjs`: bấm xong thì bảng thông báo KHÔNG đóng, tức
> handler chưa hề chạy — công cụ không tới được chỗ đó. Đã đo **bản TRƯỚC khi sửa** bằng đúng cách
> ấy và nó cho **kết quả y hệt**, nên đây là giới hạn của công cụ chứ không phải hồi quy do lần sửa
> này. Phần logic thì có test (mục 1 ở trên). Ai muốn đóng nốt: cần một cú bấm CDP thật, kiểu cờ
> `--press` mới thêm hôm nay, chứ `element.click()` trong `--probe` không đủ.
>
> Cổng (ĐO SAU KHI GỘP nhánh "ba nhịp chuyển động" vào): `npm test` **1.186 bài · 1.185 pass ·
> 0 fail · 1 skipped** — riêng phần việc này góp **+17 bài** (đo trên nhánh trước lúc gộp: 1.180) ·
> `test:cross` 3/3
> · lint sạch · build xanh. Ảnh chụp thật: desktop đếm được 5 mục, iPhone 4 nút + "Thêm" (2 mục
> trong đó, lưới tự co còn 2 cột), `--fit` ở 390px soi 23 nút không nút nào tràn chữ. Cái chấm đã
> chụp được ở CẢ hai thanh khi bơm một cơ hội thật (fixture `sp: 99`), và tắt đúng khi không có việc.

> *(mốc trước)* **2026-08-27 (tối)** — **MỌI CHUYỂN ĐỘNG VỀ ĐÚNG BA NHỊP.**
> `initial`/`animate`/`transition` đang khai rời rạc ở hơn ba mươi file. Đếm được **5 thời lượng**
> (0,18 · 0,22 · 0,26 · 0,28 · 0,35 giây) và **7 đường cong** khác nhau; riêng bảng điều khiển đồng
> hồ khai **y hệt nhau bốn lần**. Nay: `src/lib/motionPresets.js` xuất ra ĐÚNG ba nhịp —
> **`enter`** (opacity 0→1, y 6→0, 180ms, ease `[0.22,1,0.36,1]`) · **`press`** (scale 1→0,97,
> 90ms) · **`reward`** (scale 0,9→1 bằng lò xo 420/18). Cả ba là hook và **tự trả về object rỗng**
> khi `useReducedMotion()` bật ⇒ chỗ gọi không phải tự kiểm tra.
>
> **11 file đã đổi:** `App.jsx` · `PomodoroEngine.jsx` · `DisasterModal` · `EraCrisisModal` ·
> `LevelUpModal` · `LootDropModal` · `PrestigeModal` · `WeeklyReportModal` · `OnboardingOverlay` ·
> `BlueprintInventory` · `SkillTree`. **KHÔNG đụng `src/components/city/render3d/`** (three.js).
>
> ⚠️ **HAI FILE CUỐI SUÝT BỊ BỎ SÓT, VÌ "MODAL" KHÔNG PHẢI LÚC NÀO CŨNG TÊN `*Modal.jsx`.**
> Quét theo tên file ra đúng 7 modal và tôi đã tưởng thế là hết. Quét lại theo **HÌNH DẠNG**
> (`grep 'fixed inset-0'`) ra thêm ba ứng viên, và hai trong ba là modal thật nằm LỒNG trong một
> file lớn hơn: `BlueprintDetailPanel` (trong `BlueprintInventory.jsx`) và `PurchaseConfirmDialog`
> (trong `SkillTree.jsx`) — mỗi cái đủ bộ lớp phủ + thân, đúng khuôn rời rạc cần dọn. Ứng viên thứ
> ba (`ExportImport`) là một `<div>` trần không có chuyển động nào, nên không phải việc.
> ⇒ **Đi tìm một LOẠI thứ thì quét theo hình dạng của nó, đừng quét theo quy ước đặt tên** — quy
> ước đặt tên chỉ đúng cho những cái ai đó đã nhớ mà đặt tên đúng.
>
> **⚠️ BỐN ĐIỀU ĐÃ TRẢ GIÁ, CÁI NÀO CŨNG IM LẶNG:**
> **(1) CHỈ THỊ GỐC TỰ MÂU THUẪN, VÀ MỘT NỬA CỦA NÓ LÀ QUẢ MÌN.** Chỉ thị ghi `reward` là *"scale
> 0,9 sang 1,04 rồi về 1"* KÈM *"spring stiffness 420 damping 18"*. Hai vế **không thể cùng đúng**:
> framer-motion 12.38 chặn thẳng lò xo có quá hai mốc (`JSAnimation.mjs`: *"Only two keyframes
> currently supported with spring and inertia animations"*) — và `invariant` ấy **NÉM LỖI ở bản dev,
> IM LẶNG ở bản production**, tức viết `[0.9, 1.04, 1]` là gài một quả mìn chỉ nổ ở một trong hai
> môi trường. Đo đỉnh thật của `spring(420, 18)` đi từ 0,9 tới 1 bằng chính `spring()` của
> `motion-dom`: **1,0215 ở mốc 171ms, đứng yên ở 337ms**. ⇒ **Đã giữ đúng 420/18 như chỉ thị ghi**;
> hình dạng "co lại → vọt quá → về 1" vẫn nguyên, chỉ là cú vọt cao **2,2% thay vì 4%**. Muốn đúng
> 4% thì hạ **`damping` 18 → 11,5** (đo được 1,0399) — đổi MỘT con số ở `motionPresets.js`. Bài học:
> *độ vọt lố của lò xo là HỆ QUẢ, không phải thứ mình liệt kê ra.*
> **(2) TRẢ OBJECT RỖNG CÓ THỂ **VỠ BỐ CỤC**, NÊN PHẢI CÓ HAI CÁI GÁC CHỨ KHÔNG PHẢI MỘT.** Chỉ thị
> nói cả ba preset trả về rỗng — đúng cho thứ TRANG TRÍ. Nhưng cột phải khai bề ngang **bằng chính
> `animate={{ width }}`** chứ không bằng CSS: bỏ đi thì cột mất bề ngang và bung ra chiếm cả màn
> hình — một cách "tắt hoạt hoạ" bằng cách phá giao diện. Câu hỏi phân loại: ***"bỏ hẳn `animate`
> đi thì phần tử còn ở đúng chỗ của nó không?"*** CÒN → `useCustomMotion` (bỏ hẳn). KHÔNG →
> `useSnapMotion` (giữ đích, `duration: 0`). Bốn thứ thuộc nhóm hai: bề ngang hai cột · núm gạt chế
> độ nghiêm ngặt · thanh tiến độ · vòng đếm giờ.
> **(3) `transition` CỦA `press` PHẢI NẰM TRONG `whileTap`, KHÔNG PHẢI Ở CẤP NGOÀI.** Nhiều nút vừa
> có `whileTap` vừa có `animate` riêng (thẻ preset nhấc lên khi đang chọn, núm gạt trượt…). Đặt
> `transition` ở cấp ngoài thì việc trải preset **ĐÈ MẤT** `transition` của thẻ — không có gì đỏ
> lên, chỉ có nhịp của thứ khác bị đổi. Đã khoá bằng test.
> **(4) HOOK ĐẶT SAU MỘT LỐI RA SỚM.** `PrestigeModal` có `if (!isOpen) return null;` ở giữa thân
> hàm; đặt bốn hook bên dưới nó là vi phạm quy tắc hook. **`npm run lint` bắt được ngay** (test
> KHÔNG bắt được — đây là loại lỗi chỉ có lint thấy, đúng bài học ADR-054).
>
> **NGOẠI LỆ ĐỀU ĐẾM ĐƯỢC VÀ ĐỀU CÓ CHÚ THÍCH LÝ DO TẠI CHỖ:** `ActionButton` giữ cú lún `y:4` vì
> nó BẰNG ĐÚNG chiều dày vạch bóng đặc (`actionButtonPress.test.js` khoá cứng quan hệ ấy **và cấm
> `scale` ở `whileHover`** — một nhịp `press` dùng `scale` sẽ phá cả hai); các hiệu ứng SO LE
> (`ResourceCascade`, viên tài nguyên của `EraChangeBanner`) giữ độ trễ vì độ trễ CHÍNH LÀ thứ chúng
> tồn tại để làm; pháo hoa (`ParticleField`, `ParticleRain`) `return null` hẳn khi Giảm chuyển động.
>
> **Lưới tự động:** `src/lib/motionPresets.test.js` **MỚI** — 6 bài, **cả 9 phép thử ngược đều đã
> thấy đỏ** (thêm preset thứ tư · bỏ gác · guard hết rỗng · đổi thời lượng · bỏ `exit` · đưa
> `transition` ra ngoài · lò xo 3 mốc · lò xo hết vọt lố · lớp phủ mượn `y`). Bài "lò xo" **không
> đọc mã** — nó chạy thẳng `spring()` thật rồi ĐO đỉnh, thay vì tin con số chép trong chú thích.
>
> **ĐẾM ĐƯỢC:** khai báo rời rạc trong 11 file ấy đi từ **228 xuống 34** (−85%). Và 34 kia phải
> nói cho đúng, đừng gộp thành một câu: **24 là ngoại lệ NẰM TRONG phạm vi, mỗi cái có một dòng
> chú thích nêu lý do** (thanh tiến độ đọc biến vòng lặp · hiệu ứng so le · pháo hoa · `ActionButton`);
> **10 còn lại nằm ở phần KHÔNG-phải-modal của `SkillTree`** (nhịp thở của nút kỹ năng, quầng sáng
> hiệp trợ, thanh tiến độ nhánh) — **ngoài phạm vi việc này, giữ nguyên**. Chúng vẫn tự xử lý
> `reducedMotion` bằng tay theo lối cũ ở 6/10 dòng; 4 dòng còn lại (thanh tiến độ nhánh, huy hiệu)
> thì không. Đó là việc của một lượt sau, không phải một lời hứa đã hoàn thành ở lượt này.
>
> **TIÊU CHÍ NGHIỆM THU ĐÃ ĐƯỢC ĐO, KHÔNG PHẢI KHAI.** `scripts/motion-still.mjs` **MỚI**: bấm
> chuyển tab rồi chụp HAI khung hình cách nhau 90ms và đếm điểm ảnh lệch. Chạy CẢ HAI chế độ, vì
> một con số "0 điểm ảnh lệch" tự nó không chứng minh gì — nó cũng đúng y hệt khi cú bấm trượt
> hoặc app chưa mọc ra. Hai lượt liên tiếp: **THƯỜNG 40.385 rồi 39.370 điểm ảnh đổi** (3,51% /
> 3,42%, lệch lớn nhất 255 ⇒ thước CÓ răng) · **GIẢM CHUYỂN ĐỘNG 0 rồi 0, lệch lớn nhất 0**.
> Cột thường trôi vài phần trăm là đúng (hai khung rơi vào hai thời điểm khác nhau của cùng một
> hoạt hoạ); cột giảm **không trôi**, và chính sự không-trôi ấy mới là bằng chứng.
> ⚠️ Cổng "app đã mọc ra chưa" trong script đó KHÔNG được thay bằng một phép đợi cố định: bảng
> kiểu Google Fonts là tài nguyên CHẶN RENDER, trong hộp cát không có mạng ngoài thì
> `document.readyState` kẹt ở `loading` rất lâu — bản đầu đợi cố định 6 giây ra **0 nút** và suýt
> cho ra kết luận "không có hoạt hoạ nào" hoàn toàn sai, ở CẢ HAI chế độ.
>
> Cổng: `npm test` **1.169 bài · 1.168 pass · 0 fail · 1 skipped** · `test:cross` 3/3 (32,1 giây) ·
> lint sạch · build xanh · `scripts/shot.mjs` chụp lại trang chủ 1280px: không tràn, mọi khối còn đủ.

> *(mốc trước)* **2026-08-27 (chiều)** — **`ActionButton` NGHE THEO SKIN + CÓ CẢM GIÁC BẤM LÚN.**
> Ba bệnh đã chữa: `themeMap` khai màu cứng theo `lightTheme` (chỉ đúng **2 trong 10** tổ hợp skin ×
> chế độ) · bóng MỜ nhiều lớp làm nút trông như thẻ giấy · `whileHover scale 1.03` phóng to cả khối
> nên chữ nhoè đúng lúc đang nhìn. Nay: một bảng màu DUY NHẤT đọc token · bóng ĐẶC `0 4px 0 0` ·
> nhấc `y:-1` + sáng 6% khi rê chuột · `whileTap y:4` + `active:shadow-none` để nút lún đúng bằng
> chiều dày vạch rồi vạch biến mất.
>
> **`sizeMap` GIỮ NGUYÊN TỪNG KÝ TỰ** — không so bằng mắt mà bằng một phép so chuỗi trong chính
> script sửa file (`assert a == b` cho cả ba mục). `actionButtonSizing.test.js` vẫn xanh.
>
> **⚠️ BỐN CÁI BẪY, CÁI NÀO CŨNG IM LẶNG:**
> **(1) FRAMER ANIMATE `boxShadow` SẼ ĐÓNG BĂNG MÀU CỦA SKIN CŨ.** Cách hiển nhiên để "bỏ bóng khi
> bấm" là `whileTap: { y: 4, boxShadow: '…' }`. Nhưng Framer animate bằng cách ghi **style inline đã
> resolve** (`var(--line-2)` → mã màu cụ thể) và để lại đó; style inline thắng mọi lớp CSS ⇒ mọi nút
> từng được bấm sẽ giữ bóng của skin cũ sau khi đổi skin, **mà không có gì đỏ lên**, và nó phá đúng
> tiêu chí nghiệm thu thứ hai. Vá: bóng tắt bằng CSS `active:shadow-none` (giữ `var()` còn sống),
> Framer chỉ lo `y` — thứ không chứa màu. Đã khoá bằng test.
> **(2) `shadow-none` TRẦN THẮNG/THUA TUỲ THỨ TỰ BẢNG KIỂU.** Nhánh disabled bản đầu dùng
> `shadow-none` trần — cùng độ đặc hiệu (0,1,0) với `shadow-[0_4px…]` của biến thể. Đo được:
> `.shadow-none` ở vị trí 44292, `.shadow-[0_4px…]` ở 43329 ⇒ hôm nay `shadow-none` thắng **nhờ tình
> cờ đứng sau**. Một lần nâng Tailwind là nút disabled có bóng lại. Vá: `disabled:shadow-none`
> (`:disabled` nâng lên 0,2,0 ⇒ thắng bất kể thứ tự). Đây đúng canh bạc mà chú thích `sizeMap` cảnh
> báo, chỉ khác thuộc tính.
> **(3) `transition-all` ĐÁNH NHAU VỚI FRAMER.** `all` bao gồm `transform`, thứ Framer đang tự
> animate bằng vòng lặp riêng — trình duyệt phải nội suy lại từng giá trị Framer ghi ra và cú bấm
> thành nhão. Nay liệt kê đúng 5 thuộc tính CSS thật sự sở hữu, `transform` để Framer lo một mình.
> **(4) SKIN THỤY SĨ ÉP `box-shadow: none !important` LÊN NÚT PRIMARY.** Dòng ấy viết khi nút còn
> dùng bóng mờ, và nó đúng lúc đó. Nhưng bóng đặc không còn là trang trí — nó là thứ cú bấm LÚN VÀO;
> giữ dòng ấy thì riêng Thụy Sĩ có nút tụt 4px mà chẳng có gì để tụt vào. **Đã bỏ đúng một dòng đó**,
> giữ nguyên ba dòng màu (quyết định "CTA đỏ thay vì đen" không đổi). Vạch đặc `#100f0b` dưới khối đỏ
> `#df3a1e` chính là ngôn ngữ Thụy Sĩ, không phải bóng mờ mà dòng cũ muốn cấm.
>
> **⚠️ CÔNG CỤ ĐO NÓI DỐI BA LẦN TRONG PHIÊN NÀY, VÀ LẦN NÀO CŨNG THEO HƯỚNG ĐỔ OAN CHO MÃ:**
> **(a)** Đổi `data-skin` trong DOM rồi đọc `getComputedStyle` ra **cùng một bộ số ở cả 5 skin** —
> tưởng "đổi skin không ăn". Nhưng phép gỡ rối cho thấy `--ink` trên **đúng cái nút đó** CÓ đổi
> (`#171614` → `#1f1e1d`). Mâu thuẫn nội tại ⇒ nghi công cụ. Bỏ hẳn lối đổi-thuộc-tính, đo bằng
> **nạp trang thật cho từng skin** (cờ `--skin`) thì 6 tổ hợp ra 6 bộ giá trị khác nhau. **Một phép
> đo đổi trạng thái RỒI đọc ngay trong cùng một lượt script là thứ không nên tin.**
> **(b)** `--press` bản đầu bấm vào toạ độ `y=914` — **dưới khung nhìn 900px**, vì nút bị cuộn khuất.
> Toạ độ của một nút ngoài màn hình vẫn là số hợp lệ, nên nó báo "nút không lún" cho một cơ chế lành.
> Nay có gác `elementFromPoint` BẮT BUỘC trúng đích, và tự `scrollIntoView` trước.
> **(c)** `--probe` khai `awaitPromise: true` nhưng lại bọc `String(...)` ở NGOÀI ⇒ mọi biểu thức bất
> đồng bộ trả về đúng chuỗi `"[object Promise]"` — một dòng kết quả trông hoàn toàn bình thường mà
> không chứa số nào thật. Đã vá thành `Promise.resolve(...).then(String)`.
>
> **⚠️ MỘT GAP PHẢI NÓI THẲNG: nửa Framer của cú bấm KHÔNG quan sát được trong Chromium headless.**
> `--press` đo được nửa CSS (**bóng biến mất khi giữ ✓**) nhưng Framer ghi `style=""` và không dịch
> nút. Đã đo **mốc nền tại commit trước** (bản cũ `whileHover scale 1.03 / whileTap scale 0.97`):
> **hành xử y hệt** ⇒ đây là đặc tính môi trường đo, **không phải hồi quy**. Framer vẫn chạy trong
> cùng trang (nút chọn skin ở Cài đặt đổi `none → matrix(1.02…)`), nên nguyên nhân chưa truy ra. Vì
> vậy bất biến quan trọng nhất — *quãng lún BẰNG chiều dày bóng* — được khoá ở tầng MÃ NGUỒN
> (`actionButtonPress.test.js`, 5 bài, **cả 6 phép thử ngược đều đỏ đúng chỗ**), chỗ nó thật sự có
> thể trôi. Một phép phá tự tố cáo khớp 2 chỗ và đã được làm lại bằng neo duy nhất.
>
> **VIỆC 4 — kết quả là 0 chỗ chuyển được, và đó là câu trả lời thật chứ không phải bỏ dở.** Đếm
> được **137 nút tự vẽ trên 28 file**; soi TỪNG ứng viên có hình dạng nút thật (29 cái). Không cái
> nào chuyển được mà không đổi hình dạng, vì `sizeMap` là bộ **ĐÓNG gồm 3 cỡ, cả ba đều `text-lg
> px-7 rounded-2xl`** — đo riêng cho hàng nút lớn của đồng hồ. Ba nhóm lý do: có **trạng thái được
> chọn** (`ActionButton` không có khái niệm đó) · nhỏ hơn hẳn và `rounded-full` · và `ActionButton`
> **không được export** (nằm trong `PomodoroEngine.jsx` 2.598 dòng). Đã ghi `TECH_DEBT #86` kèm
> **bảng từng file + lý do** và một lộ trình 4 bước theo đúng thứ tự.
>
> Cổng: `npm test` **1.163 bài · 1.162 pass · 0 fail · 1 skipped** (+5 bài mới) · `test:cross` 3/3 ·
> lint sạch · build xanh. Đo trên trình duyệt thật: 6 tổ hợp skin × chế độ ra 6 bộ màu nút khác nhau.

> *(mốc trước)* **2026-08-27** — **SKIN THỨ 5 "SÂN CHƠI" (arcade), ĐẶT LÀM MẶC ĐỊNH.**
> Nền cho hướng game hoá đơn giản, hiện đại: bỏ giấy, bỏ serif, bỏ gradient, bỏ kính mờ ⇒ mặt
> phẳng sạch · chữ sans đậm (Inter 800, không thêm font mới) · **BÓNG ĐẶC** — một vạch màu dày 3px
> dưới đáy thẻ thay cho bóng mờ nhiều lớp, cho thẻ một "cái chân" như phím bấm.
>
> **Đã làm:** `src/index.css` khối `[data-skin="arcade"]` + khối `[data-theme="dark"][data-skin=
> "arcade"]` + quy tắc tiêu đề h1–h4 · `src/store/uiSkins.js` **MỚI** (nguồn sự thật duy nhất về
> danh sách skin + mặc định) · `settingsStore.js` nhập từ đó · `Settings.jsx` thêm mục "Sân Chơi"
> đứng đầu + sửa câu mô tả đã thành sai · `src/store/uiSkins.test.js` **MỚI** (6 bài) ·
> `scripts/shot.mjs` thêm cờ `--skin` · 12 chú thích ghi "4 skin / 8 tổ hợp" đã thành sai sự thật.
>
> **Ba cái bẫy đã đo được và vá, không cái nào có gì đỏ lên:**
> **(1) THỨ TỰ TẦNG CSS.** Khối `[data-theme="dark"]` đứng SAU mọi khối skin và có **độ đặc hiệu
> BẰNG NHAU** (0,1,0), mà nó khai `--app-bg` là một radial-gradient. Nên lời hứa "bỏ gradient" chỉ
> đúng ở chế độ sáng, trừ khi khối tối ghép đôi đặt lại. Cùng cái bẫy đó nuốt `--panel`/`--item-*`
> (theme tối khai rgba trong suốt ⇒ mất "mặt phẳng đục") và `--skin-card-border-color` (theme tối
> **không** khai ⇒ viền xám sáng `#e3e0d9` dính nguyên vào thẻ đen). Đã viết một phép đo liệt kê
> token nào của bản sáng sống sót sang chế độ tối: còn đúng 6, và cả 6 đều **phi màu** (font, bo
> góc, độ dày viền) — thứ dùng chung hai chế độ là ĐÚNG.
> **(2) `!important` Ở `font-weight` LÀ BẮT BUỘC, KHÔNG PHẢI TUỲ CHỌN.** Ba tiêu đề thật
> (`BuildingWorkshop` h2 · `RelicInventory` h2 · `SkillTree` h3) mang `fontWeight: 600` dạng
> **INLINE**, mà style inline thắng mọi quy tắc stylesheet trừ `!important`. Đây chính là lý do
> skin `swiss` phải dùng nó. Bỏ đi thì hỏng **không đều**: ba tiêu đề ấy kẹt ở 600 còn phần còn
> lại lên 800 — và không có gì đỏ lên.
> **(3) `shot.mjs` CHỐT CỨNG `uiSkin: 'editorial'`.** Từ nay app mặc định arcade, nên mọi ảnh chụp
> nghiệm thu sẽ lặng lẽ hiện một skin KHÔNG phải mặc định — đúng loại "công cụ đo nói dối" đã cắn
> dự án 25 lần, và nói dối theo hướng khó thấy nhất: tấm ảnh vẫn hợp lý, chỉ là nó mô tả một app
> khác. Nay đọc `DEFAULT_UI_SKIN` thẳng từ store và có cờ `--skin <tên>`.
>
> **Bài test tự bắt lỗi của chính nó.** Bài "mỗi skin phải có khối CSS riêng" bản đầu hỏi
> `css.includes('[data-skin="arcade"] {')` và **XANH OAN**: chuỗi ấy là **chuỗi con** của
> `[data-theme="dark"][data-skin="arcade"] {`, nên gỡ sạch khối sáng vẫn qua được. Phép thử ngược
> phát hiện; nay neo bằng xuống dòng. Cùng bài học *"assert 'có ít nhất một chỗ' là cái phễu,
> không phải hàng rào"*. Cả 5 phép phá đều đã chạy và đều làm ĐỎ đúng bài dự kiến; một phép phá tự
> tố cáo mình khớp **2 chỗ** thay vì 1 (cùng lý do chuỗi-con) và đã được làm lại bằng neo duy nhất.
>
> **Một ngoại lệ ĐÚNG, ghi ra tường minh:** `inkgold` bị `App.jsx` ghim `data-theme="dark"` nên nó
> **không có chế độ sáng** — khối `[data-skin="inkgold"]` của nó CHÍNH LÀ thiết kế tối. Bài test
> đọc danh sách ghim thẳng từ `App.jsx` (`assert.deepEqual(ghimTheme, ['inkgold'])`) chứ không chốt
> cứng ngoại lệ, nên skin thứ hai bị ghim sẽ bắt buộc có người nhìn lại thay vì lặng lẽ ra khỏi
> tầm canh.
>
> **⚠️ HAI SỐ ĐO PHẢI BÁO, KHÔNG CÁI NÀO CHẶN VIỆC:**
> **(a) `--warn: #e0921f` đạt 2,53:1 trên thẻ trắng** — dưới ngưỡng 3:1 cho màu tín hiệu, và nó
> ĐƯỢC dùng làm màu CHỮ (`text-[var(--warn)]` ở `PomodoroEngine`, `LootDropModal`, `EraCrisisModal`).
> Ba skin sáng còn lại đều đạt 3,49–3,54:1, nên đây là một bước lùi có thể đo được. Giữ nguyên giá
> trị Đàm khai; đổi sang `#a8701a` là đủ 4,5:1 nếu Đàm muốn.
> **(b) Chân bóng ở chế độ tối yếu hơn hẳn bản sáng** — 1,19:1 so với 1,48:1 (so với thân thẻ). Đây
> là **giới hạn vật lý, không phải số chọn ẩu**: thân thẻ tối `#211f1c` vốn đã gần đen nên một cái
> bóng "tối hơn thân thẻ" hết dư địa rất nhanh — **đen tuyệt đối cũng chỉ tới 1,28:1**. Muốn vượt
> phải ĐẢO hướng, dùng một vành SÁNG hơn thân thẻ (`#3a352e` = 1,35 · `#423d36` = 1,53), tức đổi
> bóng thành gờ nổi — một quyết định mỹ thuật của Đàm, không phải phép chỉnh số.
>
> **⚠️ MÁY ĐÃ LƯU LỰA CHỌN CŨ SẼ KHÔNG TỰ ĐỔI.** Dữ liệu đã lưu THẮNG giá trị mặc định (đúng như
> phải thế — đó là lựa chọn của người dùng). Máy của Đàm đang lưu `uiSkin: 'editorial'`, nên mở app
> vẫn thấy giao diện cũ cho tới khi vào **Cài đặt → Bộ giao diện → Sân Chơi**. Mặc định mới chỉ áp
> cho máy chưa từng chọn.
>
> Cổng: `npm test` **1.158 bài · 1.157 pass · 0 fail · 1 skipped** (+6 bài mới) · `test:cross` 3/3
> · lint sạch · build xanh. Nghiệm thu bằng trình duyệt thật trên CSS đã build, cả hai chế độ:
> `background-image: none` · chân bóng `0 3px 0 0` · tiêu đề `Inter weight=800`.

> *(mốc trước)* **2026-08-24 (đêm)** — **CẮT CHI PHÍ MỖI PHIÊN: 6.323 DÒNG BẮT BUỘC ĐỌC → 55**.

> *(mốc trước)* **2026-08-24 (khuya)** — **PHASE 21: HỢP NHẤT HAI NHÁNH, RỒI XOÁ NỐT VẺ QUY
> HOẠCH**. Đàm xem bản quét Phase 20: *«nhà vẫn xếp rất ngăn nếp trông như quy hoạch, dù quy hoạch
> ô bàn cờ chỉ bùng nổ và trở thành chuẩn mực từ thế kỷ 19 (Cách mạng Công nghiệp). Và việc mở rộng
> thành phố không phải là nhà xếp chồng lên nhau, nó rất phản thực tế và lịch sử.»*
>
> **§1 HỢP NHẤT (ADR-064).** Hai nhánh đã giải **cùng một bài toán hai lần** trong hai phiên không
> nhìn thấy nhau: `main` có cung cong (ADR-059), nhánh này có chia thửa đệ quy (ADR-066), và còn
> **trùng số ADR 056/057** cho hai nội dung khác hẳn. Câu hỏi mở khoá được việc gộp là một câu chưa
> ai đặt: *"hai bộ sinh ấy có đang trả lời cùng một câu hỏi không?"* — **KHÔNG**. Chia thửa trả lời
> *"đất chia thế nào"*, cung cong trả lời *"một ranh giới có hình gì"*. ⇒ **BSP quyết cắt Ở ĐÂU,
> cung cong quyết cắt theo HÌNH GÌ.** Kèm theo, một mệnh đề ngầm phải đổi: **một thửa nay là TẬP Ô**
> (mỗi ô không phải đường thuộc về hình chữ nhật gần nhất), không phải hình chữ nhật đã khai — vì
> hình chữ nhật là **Ý ĐỊNH** còn con đường đã dựng mới là **SỰ THẬT**. ADR đánh số lại cho hết
> trùng (060 · 061 · 062 · 063 · 064).
>
> **§2 ADR-007 — ĐÀM DUYỆT PHƯƠNG ÁN (a).** Dời 75/75 công trình **MỘT LẦN**, sau đó bố cục mỗi kỷ
> **đóng băng vĩnh viễn**. Không hai bộ sinh song song. ⚠️ Từ ngày gộp `main`, đổi bộ sinh bố cục
> của một kỷ là **một quyết định DI TRÚ, phải hỏi trước**.
>
> **§3 BÀN CỜ LÀ MỘT MỐC LỊCH SỬ, KHÔNG PHẢI MẶC ĐỊNH (ADR-065).** Phase 20 đổi được bộ xương, mà
> **bên trong một thửa vẫn là lưới `cols × rows`** cho cả 15 kỷ — hai tầng chỉ khác nhau về cỡ, nên
> mắt vẫn đọc ra lưới. Nay `blockStyle.js` có trục `layout`: kỷ **1–9** khai `organic` (chia thửa
> đệ quy lệch tâm, không hàng không cột), kỷ **10–15** khai `grid` (giữ nguyên, không đổi một dòng).
> Chọn BSP chứ không rải-rồi-tránh-nhau vì **các lá của một cây BSP rời nhau THEO CẤU TẠO** — không
> phép kiểm chồng lấn, không số lần thử lại phải hiệu chuẩn. Khoá bằng test **HAI CHIỀU** (kỷ 1–9
> phải TRƯỢT phép kiểm "là lưới đều", kỷ 11–15 phải ĐẠT); một chiều thôi thì cách rẻ nhất để hết đỏ
> là làm mọi kỷ hữu cơ, tức xoá mất nửa kia của mốc.
>
> **§4 KHỐI NẰM TRONG THỬA CỦA NÓ, THÀNH PHỐ LAN RA NGOÀI.** Đo lần đầu: **290 cặp** khối nhà dân
> đè lên nhau, sâu nhất **−0,441 ô**, khối rộng nhất **1,734 ô** — tức tràn qua trọn ô bên cạnh, và
> không cổng nào từng hỏi câu ấy. Ba việc, mỗi việc đo riêng: `BLOCK_MAX_CELLS = 1` (290→84) · giải
> affine lượt ba (84→20) · `EAVE_LAND_FACTOR = 1,05` (20→**15**, sâu nhất **−0,015 ô ≈ 1 điểm ảnh**,
> dưới sàn mắt 4). ⚠️ Lượt ba là một phép **GIẢI**, không phải vòng lặp: `specFootprint` là hàm **BẬC
> THANG** của `fx` nên lặp tới hội tụ thì **PHÂN KỲ** (đo được lượt ba đi XA hơn lượt hai). Vế "lan
> ra" vốn đã đúng theo cấu tạo nhưng **chưa bài nào canh**; nay có: 20 phiên so 120 phiên, đủ 15 kỷ,
> hộp bao nở **1,65 lần** (kỷ 4) tới **12,0 lần** (kỷ 13).
>
> **§5 SÁU KỶ TỪNG CÓ ĐÚNG 0 THỬA NHÀ DÂN — và phép đo "thửa có khác cỡ không" đang đo nhầm.**
> `WONDER_PARCELS = 5` ăn trước, nên kỷ nào khai `parcels: 6` chỉ còn 1 thửa dư mà thửa ấy lại bị
> lấy làm sân ⇒ con số tỉ số xưa nay là tỉ số của các **KHU ĐẤT KỲ QUAN**. Vá bằng module lá
> `parcelRoles.js` (0 lời `import`) giữ **MỘT** công thức chia vai, và **cả `cityPlan` lẫn
> `networkStyle` cùng gọi nó** — trước đó mỗi bên tự tính một nửa và hai nửa trôi khỏi nhau.
> Validator **TỪ CHỐI THẲNG** dòng để lại < 2 thửa nhà. Sau khi sửa: mọi kỷ có ≥2 thửa nhà và ≥1
> sân (23 thửa sân trên 15 kỷ). Tỉ số ô đất lớn nhất/nhỏ nhất theo hình thái — `organic` **trung vị
> 5,50** · `terrace` 4,67 · `grid` 2,25 · `radial` 2,00 · `axial` 1,25 ⇒ phố cổ chênh **gấp 4,4 lần**
> nhóm axial, và nó chênh bằng chính hình thái mạng đường chứ không bằng một cột số chọn tay.
>
> ⚠️ **CÁI GIÁ CỦA §5, NÓI THẲNG.** Thêm ô đường ⇒ đổi ô nào là nhà ⇒ **đổi tỉ lệ loại nhà**
> (`workshop` là nguyên mẫu thấp-rộng, tỉ số xấu nhất). Bảy mốc ghim cũ già đi ở năm file; **tất cả
> được ghim lại SAU khi đo**, không một sàn/trần chất lượng nào bị nới — một cái trần còn được
> **SIẾT** (`TRAN_TROI` 0,13 → 0,10 ô). *Tốt lên*: chiều cao nhà kỷ 1 và 7 hết trượt · kỷ 5 thôi bị
> khung hình thu nhỏ vô cớ (biên 0,2294 → 0,0400) · mảng phủ đất nay đạt ở **cả bảy** mốc phiên
> (trước hụt ở mốc 150) · nước nhìn thấy được tăng ở **13/14 kỷ**, kỷ 5 vượt cổng 5% (3,63 → 7,00).
> *Xấu đi*: ô mất chi tiết mái **7/476 (1,5%) → 10/473 (2,1%)**, kỷ tệ nhất 0,893 → 0,844.
>
> **Bài học lớn nhất của phase**: `TECH_DEBT #90` đã được ghi lại **hai lần** như thể cơ chế đang
> được chữa dần, trong khi cả hai lần nó chỉ **đổi tỉ lệ loại nhà**. Một mục nợ thu hẹp không có
> nghĩa là bệnh của nó đang lành — phải hỏi *"cái gì vừa đổi, và nó có phải cơ chế tôi đang tố
> không?"* trước khi ghi một con số đẹp hơn vào cột trạng thái.
>
> Cổng: `npm test` **1.184 bài · 1.183 pass · 0 fail · 1 skipped** (+ đối chiếu chéo 3/3) · lint
> sạch · build xanh. **Chưa gộp `main`** (chỉ thị Phase 21 ghi rõ: *"Push nhánh phụ, không tự gộp"*).
>
> (Mốc trước, 2026-08-24 đêm) — **CẮT CHI PHÍ MỖI PHIÊN: 6.323 DÒNG BẮT BUỘC ĐỌC → 55**.
> Đàm: *"mỗi lượt sửa quá ít thay đổi và không hiệu quả, không cần đo performance quá nhiều…
> quy ước lại cách ra prompt đi"*.
>
> **Chẩn đoán bằng số, không đoán:** quy tắc số 1 cũ bắt đọc trọn `CLAUDE.md` (502 dòng) +
> `BAN_GIAO.md` (5.821 dòng) = **6.323 dòng** trước khi gõ dòng code đầu tiên; sau đó lại phải
> đồng bộ 8 file và viết báo cáo 11 mục. Ước lượng phân bổ sức mỗi phiên: **đọc ~25% · đo ~35% ·
> XÂY ~20% · viết tài liệu ~20%**. Ba phase liên tiếp (rooftop · hinterland · vùng phụ cận) qua
> sạch mọi cổng số và **đều bị mắt Đàm bác** — bằng chứng trực tiếp rằng cổng số đã thành sản phẩm
> thay vì thành công cụ.
>
> **Đã làm:** **(1)** `START_HERE.md` MỚI (**55 dòng**) — file DUY NHẤT bắt buộc đọc mỗi phiên:
> đang ở đâu · 5 luật thật sự cắn · việc tiếp theo · lệnh hay dùng · tra cứu ở đâu. **(2)**
> `PHASE_RULES.md` MỚI — quy trình có hiệu lực cho phase mỹ thuật: *sản phẩm là ẢNH* · **không đo
> hiệu năng** (đã đo dứt điểm trên M3: dư 3,2 lần) · **không viết công cụ đo mới** (4 cái còn
> sống) · test chỉ giữ bất biến ADR-007 · tài liệu 2 file · báo cáo 5 dòng · làm hết 4–8 việc
> trong một lượt · **khung prompt cố định 4 mục ≤60 dòng**. **(3)** `BAN_GIAO.md` **5.821 → 397
> dòng**, phần cũ nguyên vẹn ở `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md`. **(4)** `CLAUDE.md`
> quy tắc số 1 + số 2 viết lại; thêm khối trỏ sang `PHASE_RULES.md` ở đầu Governance Protocol
> (phần cũ giữ làm kho tra cứu, vẫn đúng cho phase kiến trúc/hạ tầng). **(5)** `scripts/`: 10 công
> cụ dùng-một-lần sang `scripts/archive/`; 6 cái bị import hoặc có test thì giữ lại — trong đó
> `plinth-tri.mjs` bị `sceneTriCross.test.js` đọc bằng đường dẫn cứng nên **bài test đỏ ngay khi
> chuyển đi**, đã khôi phục.
>
> **Bài học:** một bộ quy tắc chống-tự-lừa-mình sinh ra để bảo vệ chất lượng, nhưng nó **tự phình
> theo mỗi sự cố** (mỗi lần một công cụ nói dối thì phản ứng là viết thêm một công cụ nữa — nay có
> 18 cái). Đến một ngưỡng, chính bộ quy tắc trở thành thứ tiêu hết ngân sách mà nó định bảo vệ.
> **Chi phí của quy trình phải được ĐO như mọi thứ khác** — và chưa ai từng đo nó.
>
> Cổng: `npm test` **1.146 bài · 1.145 pass · 0 fail · 1 skipped** · lint sạch · build xanh.
> Không sửa một dòng mã sản phẩm nào (`src/` không đổi).
>
> ⚠️ **VÁ KÈM LÚC GỘP (2026-08-24, phiên ADR-059): 4/10 CÔNG CỤ VỪA CHUYỂN SANG `scripts/archive/`
> KHÔNG CHẠY ĐƯỢC.** Lần chuyển thư mục ở trên đổi độ sâu của file mà không đổi đường dẫn tương đối
> trong đó, nên `road-bend` · `frame-fit` · `plateau-score` · `terrain-score` (19 lời `import`) đều
> ném `ERR_MODULE_NOT_FOUND`. **Không cổng nào bắt được**: build không đụng `scripts/`, lint chỉ
> phân tích cú pháp, và không công cụ nào trong bốn cái ấy có bài test. Đã sửa `../src/` →
> `../../src/` và chạy `--selftest` cả bốn ⇒ xanh. **Bài học: chuyển một file sang thư mục con là
> đổi ĐỘ SÂU của nó — mọi đường dẫn tương đối bên trong đều lệch, và với `scripts/` thì triệu chứng
> chỉ hiện ra lúc CHẠY, tức lúc Đàm đang cần dùng.**
>
> ⚠️ **VÀ MỘT MÂU THUẪN GIỮA HAI TÀI LIỆU ĐÃ ĐƯỢC SỬA:** `START_HERE.md` (mới) ghi luật số 2 là
> *"KHÔNG tự gộp `main` — hỏi Đàm"*, trong khi `CLAUDE.md` mục "Quy trình deploy" ghi ngược lại kèm
> nguyên văn lời Đàm 2026-08-22 (*"sau này tự deploy, tôi không có việc gì phải tự deploy cả"*).
> `CLAUDE.md` là NGUỒN SỰ THẬT DUY NHẤT về quy tắc (mục 6 của chính nó), nên `START_HERE.md` đã
> được sửa cho khớp. **Một bản tóm tắt chép sai một luật vận hành thì tệ hơn không có bản tóm tắt** —
> đúng thứ mà luật "TUYỆT ĐỐI không tạo bản sao tài liệu quy tắc" đã cảnh báo.
>
> (Mốc trước, 2026-08-24 chiều) — **MỖI KỶ MỘT MẠNG ĐƯỜNG RIÊNG: HẾT BÀN CỜ, CÓ GIAO
> LỘ THẬT** (ADR-059). Đàm bác chính bản vá liền trước: *"Không phải là kiểu đường lồi lõm, mà là
> dạng đường cong hay không cong, như thể là có giao lộ, đường uốn quanh ấy, hãy làm lại … hiện tại
> ở thời nguyên thuỷ hay các thời trước làm gì có đường dạng bàn cờ, hiểu không"*.
>
> ⚠️ **VÀ ANH ĐÚNG VỀ MỘT SUY LUẬN SAI CỦA TÔI, KHÔNG CHỈ VỀ THẨM MỸ.** Bản trước tôi đo được rằng
> **không THÊM được ô đường** (80/144 ô đã là đường, 30 ô còn lại đúng bằng toàn bộ nhà dân), rồi
> từ đó suy ra rằng **không ĐỔI được mạng đường** — nên chỉ cho tim đường lượn nhẹ BÊN TRONG ô của
> nó. Hai mệnh đề ấy KHÔNG tương đương: phép đo kia chặn cơ chế **THÊM**, nó không nói một chữ nào
> về cơ chế **SẮP XẾP LẠI**. Hậu quả: nhìn từ trên xuống, cả 15 kỷ vẫn là 4 hàng × 4 cột cắt nhau
> vuông góc. **Bài học về CÁCH HỎI, không phải về mã: khi một phép đo chặn đường, hãy hỏi *"nó chặn
> ĐÚNG cái gì?"* trước khi để nó chặn luôn những hướng nó không nói tới.**
>
> **Bốn việc.** **(1)** `src/engine/roadPlan.js` MỚI — mỗi kỷ tự sinh lấy tập ô đường bằng cách nối
> các ĐIỂM MỐC (5 khu kỳ quan · tâm · cửa ngõ) bằng những **CUNG CONG**; hai cung cắt nhau ở đâu thì
> ở đó có **giao lộ** chữ T/Y/ngã năm. Năm kiểu khung: bàn cờ (Trường An · Manhattan · Singapore ·
> siêu ô phố Xô Viết) · một xương sống (Deir el-Medina · đường rước thành Ur · trục Sheikh Zayed) ·
> mạng rối (Çatalhöyük · phố cổ Hà Nội · Firenze · Edo) · nan quạt + vòng thành (Đức trung cổ ·
> Paris) · thềm theo đường đồng mức (Alfama · đồi Pennine). **(2)** `networkStyle.js` ĐỔI BỘ TRỤC —
> bỏ `coil`/`ragged` (chỉ đổi được MÉP một đoạn; `ragged` chính là thứ Đàm gọi là "lồi lõm"), thêm
> `plan`/`arms`/`loops`/`tangle`/`diagonal`. **(3)** `roadPath.boundaryBend` nay **TRA THẲNG** chỗ
> cung cắt qua ranh giới (`arcTrace` ghi ra lúc rasterise) chứ không sinh nhiễu băm — nên **mọi khúc
> lượn đều đến từ chính hình dạng con đường**, và kỷ khai `bend: 0` ra bảng rỗng ⇒ thẳng băng, không
> cần một nhánh `if` riêng. **(4)** `tiaMangDuong` — bỏ những ô làm mặt đường **phình thành SÂN LÁT**.
>
> ⚠️ **MỘT KHỐI 2×2 TOÀN ĐƯỜNG KHÔNG PHẢI MỘT CON ĐƯỜNG.** Mỗi cung rasterise độc lập, nên hai cung
> chạy gần song song cách nhau một ô sẽ tô kín cả dải giữa chúng: **13/15 kỷ** có mảng như thế, và
> kỷ 13 có **92% số ô đường** nằm trong một mảng — nửa dưới thành phố là một vũng bê tông liền. Đây
> **cùng họ với thứ Đàm đã bác**, chỉ ở một cấp khác: thứ làm mắt đọc ra "phố" không phải bản thân
> mặt đường mà là **ĐẤT HAI BÊN NÓ**. Sau khi tỉa: **0–4 khối mỗi kỷ**. ⚠️ Nhưng **vành đai KHÔNG
> được tỉa** — bản đầu ăn cả `tier: 1` và nó ăn mất chính những cái vòng (kỷ 5, khai `loops: 1`, đi
> từ 5 chu trình xuống **0**: cả thành phố thành một cái CÂY trong khi bảng khai rành rành có tường
> thành — bẫy `MIN_STONE`).
>
> **Số.** 15 kỷ ra **15 mạng khác nhau** (29 … 83 ô) · **3 … 19 giao lộ** mỗi kỷ · mặt tiền kỳ quan
> **TỐT LÊN**: 2/75 → **0/75** kỳ quan không có lối vào · đất trống cho nhà dân 368 → **371 ô** ·
> ADR-007 nguyên vẹn. `npm test` **1151 xanh + 1 bỏ qua**, đối chiếu chéo 3/3 (28,0 giây), lint sạch,
> build xanh.
>
> ⚠️ **CÁI GIÁ ĐÃ TRẢ, NÓI THẲNG:** lời hứa *"thành phố Đàm đang có không tự sắp xếp lại sau
> deploy"* (Phase 6C) **đã mất** — mạng đổi thì thứ tự mở đường đổi, và đổi mạng chính là thứ Đàm
> yêu cầu. Thứ CÒN giữ: ở mỗi kỷ, đường vành đai vẫn mở SAU cùng (thành phố lớn từ trong ra ngoài).
> Bốn kỷ có mạng là một CÂY (1 · 2 · 8 · 15) và hai kỷ không có vành đai (1 · 2) — cả hai danh sách
> đều **đếm tường minh trong test**, kỷ thứ năm rơi vào thì đỏ. Nợ mới: `TECH_DEBT #84` (kỷ 1 và 2
> thấp đi ~4% sau ADR-052 — mọi cần gạt đã cạn). `#85` mở rồi **đóng ngay trong phiên**:
> `scripts/archive/road-bend.mjs` nay in CẢ HAI nửa (trong ô ↔ cả mạng), và trong lúc vá thì lộ ra `--selftest`
> của chính nó **ĐỎ trên một mạng đường lành** vì đối chứng hỏi `uốnTB` (sinuosity) — đúng cái đại
> lượng mà khối chú thích ở đầu file ấy đã tự bác. Chi tiết: **ADR-059**.
>
> (Mốc trước, 2026-08-24 tối muộn) — **ĐƯỜNG PHỐ BIẾT UỐN CONG, VÀ MẠNG ĐƯỜNG CÓ BA
> HẠNG** (ADR-058). Đàm: *"đường đi hiện tại chỉ là những đường thẳng, không giống đường ngoài đời,
> không uốn cong, và nó cũng như quy hoạch quá — các thời trước làm gì có quy hoạch đường thẳng tấp
> thế, và hiện tại ít đường và loại đường quá"*.
>
> **ĐO TRẦN TRƯỚC KHI LÀM, và phép đo bác bỏ cách hiểu đen của "mở rộng đường đi":** 80/144 ô đã là
> đường (55,6%), 45 ô hứa cho kỳ quan, **chỉ còn 30 ô trống** — mà đúng 30 ô ấy là TOÀN BỘ nhà dân.
> Mỗi ô đường thêm vào là một khu nhà bị xoá. Cùng cái trần Phase 14 §1(3) đã đụng. ⇒ **KHÔNG thêm
> ô; đổi thứ NẰM TRONG một ô.**
>
> Bốn việc: **(1)** `networkStyle.js` MỚI — **bảng 15 kỷ × 4 trục hình thái quy hoạch** (`plan` ·
> `bend` · `coil` · `ragged`), mỗi dòng buộc vào một nước có thật: Çatalhöyük **không có đường**
> (đi trên mái), Chang'an nhà Đường lưới vuông tuyệt đối, Manhattan Commissioners' Plan 1811,
> Alfama **trước** động đất 1755, Tokyo dựng lại trên đúng ranh thửa Edo sau 1945. **(2)**
> `roadPath.js` MỚI — tim đường lượn, và **độ lệch là thuộc tính của RANH GIỚI chứ không phải của
> Ô**, nên hai ô kề nhau *không thể* lệch nhau (đo: **0 tuyệt đối trên 1.320 cặp × 15 kỷ**). **(3)**
> **HẠNG ĐƯỜNG THỨ BA**: `streetCrossSection` trước nhận một **boolean**, nên **36/80 ô vành đai
> (45% cả mạng)** được vẽ y hệt ngõ phố — nay vành đai có bề rộng riêng, **không vỉa hè, không vạch
> kẻ**. **(4)** Cư dân đi theo **chính** tim đường ấy, không đi tâm ô nữa.
>
> Số: mặt đường **đổi chỗ ≈47% diện tích của chính nó** (kỷ 6, mặt nạ `road`) · cả khung hình đổi
> 0,67% — *hai con số ấy nói hai chuyện khác nhau, mặt đường chỉ chiếm 1,38% khung* · **lệnh vẽ
> KHÔNG đổi ở cả 15 kỷ** · tam giác mặt đường +52% (kỷ 6) trên một thành phần chiếm ~0,8% cảnh ·
> ADR-007 nguyên vẹn. Công cụ mới `scripts/road-bend.mjs` (`--selftest` 7 mục, có đối chứng bắt
> buộc kỷ 4 phải ra đúng 1,0000). Chi tiết: `PERFORMANCE.md` mục Phase 18 + ADR-058.
>
> ⚠️ **Ngưỡng "0,25 lần bề rộng = mắt đọc ra được" CHƯA hiệu chuẩn bằng ảnh dựng** → `TECH_DEBT #83`.
> Đừng trích con số "3/15 kỷ" như thể nó là một phép đo.
>
> (Mốc trước, 2026-08-24 tối) — **CHÂN CÓ ĐẦU GỐI THẬT, GIẢI BẰNG KHỚP NGƯỢC**
> (ADR-057, **đóng `TECH_DEBT #82`**). Đàm: *"Không đo, tiếp tục làm, không hỏi vặt, làm sao cho
> con người có nhiều góc bo tròn, **cử động khớp thật**, **có thể vẽ thêm tam giác/khối mỗi ngưới
> tới lúc nó bo tròn**, 3D nhiều hơn, tăng thêm kiểu đi, chuyển động thật và ít mặt phẳng hơn"*.
> Hai vế in đậm là **hai lệnh thu hồi tường minh**: cái mẹo co-gối-giả của ADR-056, và trần **11
> khối mỗi người** mà chính Đàm đặt ra trước đó.
> Bốn việc: **(1)** **KHỚP NGƯỢC** — `poseAt` viết lại hoàn toàn, ba dòng đầu đặt hai bàn chân
> trong không gian THẾ GIỚI rồi `solveTwoBone` suy ngược ra góc đùi và góc gối bằng định lý hàm
> cosin. Đảo chiều nhân quả ấy làm đai hông được **lắc ngang · nghiêng · xoay MIỄN PHÍ** (cả ba
> trước đó bị `TECH_DEBT #82` cấm, và cả ba biến mất **cùng lúc** chứ không phải gỡ từng cái), và
> làm trường `knee` cùng toàn bộ định lý `sin²` của ADR-056 **biến mất** — không phải vì sai mà vì
> tiền đề *"mesh cứng không gập được"* đã bị gỡ (bẫy Phase 8C). **(2)** **CƠ THỂ**: 11 → **16…18
> khối**, 3 → **11 khớp**; mỗi chân nay là đùi + cẳng chân + bàn chân, mỗi tay là cánh tay + cẳng
> tay + bàn tay. **(3)** **BO TRÒN**: bộ khuôn 8 → **9** (thêm `calf`), mọi khuôn không phải hộp đi
> từ 8 lên **12 mặt** và 3–6 **VÀNH** — vì **số vành**, chứ không phải số mặt, mới quyết định
> "phẳng hay không". **(4)** **BẢNG DÁNG ĐI 9 → 14 kiểu, 4 → 6 trục** (`lift · flex · sway · twist
> · headTrack · splay`), cộng khớp **hai trục** (`Rx(b) · Rz(a)`, thứ tự cố định ở cả tầng thuần
> lẫn tầng cảnh).
> Số: tam giác mỗi người **220…324 → 1.616…1.928** (×6,4) · tam giác cả 15 kỷ **+4,1%** · **+1 lệnh
> vẽ ở CẢ 15 kỷ** (khuôn `calf`) · trần khối **11 → 18** và trần tỉ lệ **11% → 30%**, cả hai theo
> lệnh tường minh của Đàm kèm bốn căn cứ đo được · trượt chân **4,86 × 10⁻¹⁷ ô** trên **210 tổ
> hợp** · `reach` cao nhất **0,9928**. ⚠️ **`ms` mỗi khung CHƯA đo lại** (hộp cát chỉ có
> SwiftShader) — 30% là trần theo tỉ lệ hình học, không phải lời hứa về tốc độ; muốn xác nhận thì
> `bash scripts/bench-macbook.sh`. Chi tiết: `PERFORMANCE.md` mục Phase 17.

> 📦 **Mốc cũ hơn + toàn bộ nhật ký trước 2026-08-24**: `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md` (5.821 dòng, không mất gì). File này từ nay **chỉ ghi thêm ở đầu, và chỉ đọc `tail`/60 dòng đầu** — xem `PHASE_RULES.md` §1.

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
- 🔴 **CHỜ ĐÀM — NHÌN ẢNH PHASE 21.** Bản quét 15 kỷ + **12 ảnh nhìn thẳng từ trên xuống** (kỷ
  1 · 3 · 7 · 10 · 11 · 14, mỗi kỷ chụp ở **20 phiên và 120 phiên** để thấy thành phố lan ra),
  `--width 1500`. **Nghiệm thu bằng MẮT, không bằng cổng số**: kỷ 1–9 không được thấy hàng lối nào;
  kỷ 11–15 thì phải thấy. Cổng số chỉ nói được rằng mã làm đúng thứ nó được bảo làm.
- ✅ **ADR-007 — ĐÀM ĐÃ DUYỆT PHƯƠNG ÁN (a)** (khép lại mục "CHỜ ĐÀM QUYẾT" của Phase 20): chấp nhận
  dời 75/75 công trình **MỘT LẦN**, sau đó bố cục mỗi kỷ **đóng băng vĩnh viễn**. Không dựng hai bộ
  sinh song song. ⚠️ **Từ ngày gộp `main`, đổi bộ sinh bố cục của một kỷ là một quyết định DI TRÚ —
  phải hỏi Đàm trước**, vì nó dời công trình trong bản lưu thật. Ghi ở ADR-064.
- ⚠️ **`TECH_DEBT #89` VẪN MỞ dù cổng đã qua (11,33 → 12,44).** Đừng đọc con số ấy là "đã giải":
  tách ba dải cho thấy toàn bộ phần tăng nằm ở dải ĐẤT (+2,37), còn dải TRỜI — cần gạt đã nêu đích
  danh hai lần — gần như không nhúc nhích (4,12 → 4,05) và dải THÀNH PHỐ còn tệ đi. Biên chỉ 0,44.
  Ba hướng của Đàm vẫn còn nguyên.
- ⚠️ **`TECH_DEBT #90` — ĐÃ THU HẸP HAI LẦN, VẪN MỞ.** (a) danh sách kỷ ngắn đi sau khi chia khu
  phố: `[1,2,6,7]` → `[1,7]` (hợp nhất) → **`[5]`** (sau §5), biên mỏng nhất 0,9508 → 0,9386 →
  **0,9942**; (b) ô mất chi tiết mái **7/476 (1,5%) → 10/473 (2,1%)**, kỷ tệ nhất 0,893 → 0,844 —
  tức nửa (b) **XẤU ĐI** ở §5. ⚠️ Cả hai lần chuyển đều là hệ quả của một phép **đổi tỉ lệ loại
  nhà** (thêm ô đường ⇒ đổi ô nào là nhà ⇒ đổi tỉ lệ `workshop`, nguyên mẫu thấp-rộng có tỉ số xấu
  nhất), **không phải** cơ chế được sửa. Bản vá thật vẫn đụng bảng `storey` lịch sử của Phase 14 và
  kỷ 1 vẫn không còn chỗ (1,95 trên trần 2,0, cần 2,05). **Cấm** hạ sàn 0,7 hoặc hạ ngưỡng 0,95 để
  lấy lại con số.
- ⚠️ **`TECH_DEBT #88` (mới, Phase 21 §4) — cột `units`/`cols`/`rows` của bảng khu phố tạm là TRỤC
  CHẾT.** `BLOCK_MAX_CELLS = 1` (thứ chặn khối nhà xuyên qua nhau) khoá số suất đất ở **4 ở cả 15
  kỷ**. Đã đếm ra tường minh bằng một bài test đi qua đúng đường dựng thật, kèm ba phương án đã đo.
  **Không nới trần**: đo được trần 2 thì khối lại xuyên qua nhau.
- ⚠️ **CHỜ ĐÀM — SAU PHASE 13 VIỆC B (vùng phụ cận).** (a) **Nhìn 15 kỷ** rồi gật hoặc chỉnh hướng
  mỹ thuật — ba cổng đo đều đạt rộng, nhưng điều kiện DỪNG (c) của chỉ thị là *"dựng xong, (G1) đạt,
  mà ẢNH XẤU ĐI"*, và chỉ mắt Đàm mới trả lời được câu đó. (b) Quyết **có gộp `main`** hay không cho
  các commit trên nhánh `claude/xay-san-pham-huong-nay-nasr3n`. **KHÔNG tự gộp.**
- ⚠️ **`TECH_DEBT #74` — CHỜ ĐÀM QUYẾT (câu hỏi thiết kế game, cùng họ `#14`).** Vùng phụ cận là
  tầng ĐỊA LÝ nên **2241 vật ở mốc 80 phiên bằng đúng số vật ở mốc 0 phiên** — nó làm thành phố
  trông lớn ngay từ phiên đầu, nhưng nó **không lớn lên theo công sức của Đàm**. Ba hướng (giữ
  nguyên là bối cảnh / cho một phần mở dần theo phiên / trộn) đã ghi ở mục nợ; chưa tự chọn, vì
  chọn sai hướng là làm hỏng vòng lặp phần thưởng chứ không phải làm hỏng một con số.
- ⚠️ **`TECH_DEBT #54` — vùng phụ cận KHÔNG chặn camera cận cảnh.** Kế thừa có chủ ý: bộ hoạch định
  đường bay chỉ biết CÔNG TRÌNH chứ không biết ĐỊA HÌNH, nên chặn cây/ruộng mà không chặn quả đồi
  bên dưới là mua một sự an toàn GIẢ. Xem lại khi nào bộ hoạch định biết đọc cao độ.
- ⚠️ **CHỜ ĐÀM — BA VIỆC SAU BƯỚC C.** (a) **Xem 4 ảnh** `estuary` kỷ 8 · `estuary` kỷ 11 · `canal`
  kỷ 10 · `meander` kỷ 5 rồi gật hoặc chỉnh hướng mỹ thuật. (b) Chạy **một lượt**
  `bash scripts/bench-macbook.sh` trên MacBook để làm mới số liệu (KHÔNG phải cổng, không chặn gì) —
  hộp cát AI chạy SwiftShader nên script tự từ chối ở đó. (c) Quyết **có gộp `main`** hay không cho
  các commit đang nằm ở nhánh `claude/xay-san-pham-huong-nay-nasr3n`. **KHÔNG tự gộp.**
- ⚠️ **`TECH_DEBT #60` — NGỮ PHÁP VEN NƯỚC (cầu · bến · thuyền · kè).** Đây là phương án (c) mà Đàm
  đã CHẤM ĐÚNG VỀ MỸ THUẬT nhưng hoãn lại: *"đổi thứ mang bản sắc sang cầu/bến/thuyền/kè là ĐÚNG về
  mỹ thuật nhưng là cả một phase mới… đừng nhét vào khe hở của Bước C."* Điều kiện xem lại: **khi
  nào có phase chi tiết ven nước**. Nó là thứ chữa được ba kỷ nước hẹp (6 · 7 · 10) mà KHÔNG phải
  nói dối địa lý.
- ⚠️ **`TECH_DEBT #61` — theo dõi, KHÔNG hành động.** Cổng 5% là một *thứ đại diện*, chính Đàm chỉ
  ra. Dữ liệu Bước C **chưa** cho ca nào cổng và mắt bất đồng ⇒ giữ nguyên cổng đã hiệu chuẩn.
- *(ĐÃ XONG, giữ lại để đối chiếu)* **`TECH_DEBT #59` — Đàm chốt hướng (b) ngày 2026-08-20.** Ba kỷ nước hẹp không đạt
  cổng 5% ở **BẤT KỲ** góc nào (kỷ 6 có trần toàn cục 4,44%). Đây là bài toán **BỀ RỘNG trong bảng**,
  không phải bài toán góc — nên `worldYaw` không chữa được, và trải Bước C tới chúng mà chưa chốt là
  tiêu ngân sách cho thứ Đàm gần như không nhìn thấy. Ba hướng đã cân sẵn ở `TECH_DEBT #59`
  (nới bề rộng / chấp nhận + đếm tường minh trong test / đổi thứ mang bản sắc sang cầu-bến-thuyền-kè).
  **Mười một kỷ còn lại KHÔNG bị chặn.**
- *(ĐÃ XONG 2026-08-20, ADR-042 — giữ lại nguyên văn để đối chiếu)* **VIỆC 2 Bước C.** `TECH_DEBT #57` đã ĐÓNG (ADR-041, 2026-08-20):
  camera mặc định nay thật sự nhìn ra nước (kỷ 14: 0,09% → **23,75%** · kỷ 12: 2,30% → **9,32%**),
  nên phần thưởng của Bước C sẽ không còn nằm ngoài khung hình. Bước B đã XONG (ADR-040, 2026-08-19).
  Bước B đã dựng hình nước cho đúng 3 kỷ (14 biển · 12 sông · 1 khô), mọi ràng buộc Đàm ra đều đo
  được và đã đạt: +1 lệnh vẽ CHỈ ở 2 kỷ có nước · kỷ 1 trùng từng byte · 0 nguồn sáng mới · 0 texture
  mới · 0 shader động · 0 lỗ thủng ở bờ. **Bước C = trải nốt 12 kỷ còn lại — ĐÃ LÀM XONG**, xem
  khối 🌊 ở đầu file. (Câu cũ ghi "13 kỷ" là đếm nhầm: 15 − 2 kỷ đã dựng − 1 kỷ khô = **12**.)
  *(Nguyên văn chỉ thị Bước B, giữ lại để đối chiếu:)*
  Ba sửa ấy: kỷ 5 phải CÓ NƯỚC (thêm kiểu thứ sáu `meander` — khúc uốn ôm ba mặt) · kỷ 11 đổi
  `sea` → `estuary` cho khớp `note` · luật hướng bờ nước viết lại thành QUAN HỆ
  (`MAX_SIDE_SPREAD = 2` thay cho mức tuyệt đối 6), cộng phép gác Q2 "nước phải nằm gọn trong địa
  hình". Bước B: dựng hình cho **ĐÚNG 3 kỷ** — **biển kỷ 14** (Singapore, đảo quốc) · **sông kỷ 12**
  (Nga, `width 3,4`, dải rộng nhất bảng) · **khô kỷ 1** (Thổ Nhĩ Kỳ — làm chứng cho ràng buộc cứng:
  kỷ không nước giữ nguyên mốc lệnh vẽ, không đổi một đơn vị) — chụp ảnh trước/sau ở khung mặc định,
  đo chỗ giáp bờ, rồi **DỪNG hỏi tiếp**. Bước C mới trải 12 kỷ còn lại. Ràng buộc Đàm ra: nước tốn
  **tối đa +1 lệnh vẽ và CHỈ ở kỷ có nước**, cập nhật `MOC_LENH_VE` theo TỪNG KỶ, **KHÔNG nâng trần
  chung** · **CẤM** nguồn sáng mới, texture mới, shader nước động (sóng/gợn/phản chiếu động) — nước
  PHẲNG, vật liệu TĨNH; hình học thì thoải mái · **cấm đụng** lưới 12×12, `deriveDwellings`,
  `computeCityLayout` · quan hệ `settingStyle → outskirts` MỘT CHIỀU.
  ⚠️ **Cổng không đo được bằng test** (lời Đàm): *"kỷ có biển phải đọc ra là **thành phố cảng**,
  không phải thành phố cạnh một vũng xanh. Ảnh không đạt câu đó thì phase chưa xong, dù mọi con số
  đều xanh."*

> ⚠️ **CHƯƠNG TRÌNH ĐANG CHẠY (cập nhật 2026-08-20) — "QUY MÔ TRƯỚC, HIỆU ỨNG SAU".** Đàm đảo thứ
> tự vì tôi đã đọc sai yêu cầu của anh: mệnh đề ĐẦU là **quy mô**, mệnh đề HAI là **độ cao**, ánh
> sáng chỉ là mệnh đề BA và *"tô bóng đẹp lên một bố cục sai thì được một bố cục sai được tô bóng
> đẹp"*.
> - **§1 (B) ĐỘ CAO — ✅ XONG** (2026-08-20, ADR-045). Đất trong lưới thôi gợn; ngoài lưới gồ ghề
>   CÓ HƯỚNG; thềm bậc còn ở 14/15 kỷ. ADR-007 vẫn nguyên.
> - **§2 (A) QUY MÔ — ⏳ CHỜ ĐÀM, đã đo xong phần chuẩn bị.** Phải tách hai nghĩa: "to hơn **trong
>   khung hình**" (camera) ≠ "to hơn **so với thế giới**" (tỉ lệ đĩa đất / rặng núi) — **Đàm muốn
>   nghĩa thứ hai**. Cần gạt trùng với `TECH_DEBT #53`, nên hai việc phải quyết CÙNG LÚC. Ba phương
>   án + giá + rủi ro ADR-007 đã ghi ở `TECH_DEBT #53`. **KHÔNG tự sửa bán kính đĩa đất, KHÔNG tự
>   đổi `gridSize`.**
> - **§3 HIỆU ỨNG — chỉ làm SAU (A) và (B).** Thứ tự rẻ-trước: tone mapping/tương phản → khử răng
>   cưa → che khuất môi trường (AO) → bóng mềm → phản chiếu mặt nước. Mỗi thứ MỘT commit, trước/sau
>   đo bằng `sweep-diff.mjs --frame`, ms thật. Trần làm việc **8 ms**. ⚠️ **ĐỪNG HẠ DPR.**
> - **§4 Q1 — chưa làm**: thêm một biến thể "khung mặc định" của cảnh nặng nhất vào
>   `scripts/bench-macbook.sh`.
> - Bộ số M3 vẫn CHƯA có cho các phase gần đây — nhắc Đàm chạy `bash scripts/bench-macbook.sh` khi
>   tiện. **Không** chặn §1 và §2.

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

### (Nhật ký cũ hơn → `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md`)

### 2026-08-24 — Phase 20: BỎ LƯỚI CỨNG, bộ xương thành phố SINH THEO KỶ (ADR-066)

**Đàm nói gì**: *"nhà vẫn quy hoạch rất kỳ quặc, rất bài bản và xếp chồng lên nhau"* · *"cho tôi
một sự sắp xếp thành phố ngẫu nhiên và mang tính đặc thù, không phải cứ 3x3 được, nó phải nhiều thứ
và đa dạng hơn"*. Sáu việc, làm hết rồi báo một lượt.

**⚠️ VIỆC 5 — ĐIỀU KIỆN DỪNG ĐÃ KÍCH HOẠT, ĐÂY LÀ THỨ PHẢI ĐỌC TRƯỚC MỌI THỨ KHÁC.** Chỉ thị bảo:
*"kiểm thành phố THẬT của Đàm xem kỷ nào đã có công trình; nếu có thì DỪNG và BÁO kèm danh sách kỷ
bị ảnh hưởng và số công trình sẽ dời, rồi làm tiếp các việc còn lại. Đừng tự quyết."*
- **Không kiểm được bản lưu thật**: Supabase bị proxy của hộp cát chặn (`curl: (56) CONNECT tunnel
  failed, response 403`). Nói thẳng ra thay vì đoán.
- **Nhưng câu trả lời không phụ thuộc vào bản lưu ấy**: bộ xương mới đặt cả 5 khu kỳ quan ở chỗ
  KHÁC, ở **cả 15 kỷ**. Nên **kỷ nào Đàm đã xây thứ gì thì thứ đó dời** — chặn trên là **75/75 công
  trình (5 mỗi kỷ × 15 kỷ)**.
- **Vì sao không có cách nào tránh**: "bộ xương khác cái cũ" và "công trình đứng nguyên chỗ cũ" là
  hai yêu cầu **loại trừ nhau**, không phải một khuyết tật cần vá. ADR-007 vẫn đúng — nó hứa *"cùng
  một bản quy hoạch thì cùng một vị trí"*, và điều kiện của nó (*bố cục là hàm thuần của riêng
  `era`*) được giữ nguyên, có test khoá. Cái giá phải trả là MỘT LẦN, đúng lúc đổi bộ sinh.
- ⇒ **Quyết định của Đàm, không phải của tôi.** Ghi ở phần Trade-off của ADR-066.

**1. `city3d/networkStyle.js` (BẢNG)** — 15 kỷ × 5 trục: `plan` (`organic` · `axial` · `grid`) ·
`parcels` (6…14) · `sizeVary` (0,05…0,86) · `ring` · `minSide`. Mỗi dòng buộc vào `country` mà
`eraStyle.js` khai, **có test bắt** — không có ràng buộc ấy thì 15 dòng là 15 lần chọn bừa. Ví dụ:
kỷ 1 Çatalhöyük *không có phố* (6 thửa rất to, `sizeVary` 0,86, không vành đai) · kỷ 2 Deir el-Medina
*một con phố duy nhất* (`axial`, `sizeVary` 0,28) · kỷ 4 Trường An *108 phường có tường* (`grid`,
`sizeVary` 0,06 — đối xứng ở đây là ĐÚNG) · kỷ 11 Manhattan (`grid`, 14 thửa, `minSide` 1).

**2. `city3d/cityPlan.js` (HÌNH)** — chia đôi đệ quy lệch tâm (BSP). Nhận **DUY NHẤT `era`**.

**3. Đường là RANH GIỚI THỬA — và là HỆ QUẢ, không phải một cột của bảng.** Mỗi nhát cắt chừa lại
một hàng/cột làm lối đi ⇒ số ô đường **tự** đi từ hằng số 80 sang **34…92 tuỳ kỷ (trung bình 59,7)**.
Cố ý KHÔNG thêm cột *"kỷ này bao nhiêu ô đường"*: một bảng thứ hai thì trôi được khỏi thứ sinh ra nó
(`TECH_DEBT #43`), và cách rẻ nhất để một bảng hết đỏ luôn là điền cùng một số vào 15 dòng
(bệnh `MIN_STONE`, Phase 9D).

**Bảng đo được (tự chạy lại sau khi dọn mã, không chép):**

| kỷ | plan | thửa | ô đường | kỳ quan | nhà dân | quảng trường |
|---|---|---|---|---|---|---|
| 1 | organic | 6 | 34 | 5 | 0 | 1 |
| 2 | axial | 7 | 38 | 5 | 1 | 1 |
| 3 | axial | 8 | 78 | 5 | 2 | 1 |
| 4 | grid | 9 | 80 | 5 | 3 | 1 |
| 5 | organic | 6 | 36 | 5 | 0 | 1 |
| 6 | organic | 7 | 37 | 5 | 1 | 1 |
| 7 | organic | 9 | 80 | 5 | 3 | 1 |
| 8 | organic | 12 | 58 | 5 | 5 | 2 |
| 9 | axial | 9 | 80 | 5 | 3 | 1 |
| 10 | organic | 11 | 51 | 5 | 4 | 2 |
| 11 | grid | 14 | 92 | 5 | 7 | 2 |
| 12 | axial | 9 | 44 | 5 | 3 | 1 |
| 13 | organic | 12 | 54 | 5 | 5 | 2 |
| 14 | grid | 12 | 55 | 5 | 5 | 2 |
| 15 | axial | 8 | 78 | 5 | 2 | 1 |

**4. Kỳ quan CHIẾM THỬA**, không còn khu 3×3. `BUILDING_ZONES` · `ROAD_LINES` · `ROAD_MAIN_AXIS` ·
`ROAD_CROSS_AXIS` · `RING_LOW`/`RING_HIGH` **xoá hẳn**; `cityGrid.js` nay còn đúng một câu
(`CITY_GRID_SIZE = 12`). Hạng 4 (kỳ quan `epic`) nhận thửa **TỐT NHẤT**, không phải thửa thứ năm còn
lại — vì hạng 4 là `wonder` ở cả 15/15 kỷ theo `BLUEPRINT_CATALOG`, một hợp đồng có sẵn. *"Thửa tốt
nhất"* nghĩa là gì thì **suy từ `plan`** (grid → giữa nhất · axial → sát trục nhất · organic → gần
nước nhất, kỷ 1 không có nước thì tụ quanh một điểm neo bốc theo hạt giống), cố ý không có cột
riêng — một cột riêng cho phép khai `grid` + "gần nước nhất", một tổ hợp vô nghĩa mà không gì bắt
được. Một vài thửa **cố ý để trống** làm quảng trường/chợ (1 thửa, hoặc 2 nếu dôi ≥5): một thành phố
mà mọi mảnh đất đều có nhà thì đọc ra là một khối đặc — đúng chữ Đàm dùng, *"xếp chồng lên nhau"*.

**5. ADR-007 khoá bằng hai bài** (ngoài các bài cũ): gọi `buildCityPlan` kèm **dữ liệu rác**
(`built` · `sessionCount` · `buildings`) đòi kết quả **trùng từng byte**; và **liệt kê đủ 1…120 phiên
× 15 kỷ** đòi bản quy hoạch đứng yên.

**6. Nghiệm thu — ĐO, không phải nhìn.** Đối xứng bốn chiều của ô kỳ quan, quy về thang *0% = đúng
mức trùng hợp ngẫu nhiên (`p² + (1−p)²`), 100% = đối xứng hoàn hảo*:

| | bộ xương CŨ | bộ xương MỚI |
|---|---|---|
| 4 khu kỳ quan ở góc | **100,0%** | — |
| cả 5 khu kỳ quan | 90,3% | — |
| mạng đường | 55,0% | — |
| ô kỳ quan, cao nhất | — | **20,0%** (kỷ 4, `grid` — được phép) |
| ô kỳ quan, cao nhất **không phải `grid`** | — | **9,6%** (kỷ 8) |

⚠️ Con số 100,0% ở ô đầu **không phải một kết quả, nó là CÁI CÂN**: thứ vốn đối xứng hoàn hảo theo
đúng nghĩa đen (bốn khu 3×3 ở bốn góc của một lưới vuông) phải đo ra đúng 100,0%, và nó đo ra đúng
thế. Không có ô ấy thì con số 20,0% không đọc được là tốt hay xấu.

**Bản quét 15 kỷ** (mốc nền `0abb272` TỰ ĐO trong `git worktree` theo `TECH_DEBT #43`, và nó tái lập
**đúng** bộ số Phase 19 — 11,33 · 19,18 · 36,31 ⇒ không trôi, phép so sạch):
- Trục CHẶNG NGÀY **11,33 → 12,44** · **0/15** dưới ngưỡng mắt 12 ✓
- Trục KỶ gần nhất **19,18 → 21,77** · trung vị **36,31 → 38,48** · **0/105** ✓

⚠️ **NHƯNG `TECH_DEBT #89` VẪN MỞ, VÀ TÔI ĐÃ TỰ BÁC BỎ KẾT LUẬN ĐẦU CỦA MÌNH.** Bản đầu của ADR-066
ghi *"Đóng #89"* kèm một lời giải thích nghe rất xuôi (*"bộ xương mỗi kỷ nay đổ bóng khác nhau nên
các chặng không còn bị 15 bản sao pha loãng"*). Tách ba dải của đúng cặp yếu nhất (6h↔15h) thì nó
ngược hẳn:

| dải | mốc nền | sau Phase 20 | |
|---|---|---|---|
| trời | 4,12 | **4,05** | −0,07 — **gần như không nhúc nhích** |
| thành phố | 6,51 | 5,56 | **tệ đi** |
| đất | 18,05 | **20,42** | +2,37 — **toàn bộ phần tăng** |

Mà dải TRỜI mới là cần gạt đã được nêu đích danh **hai lần** ở `CLAUDE.md`. ⇒ Cổng qua nhờ một dải
**chẳng liên quan tới chẩn đoán**, biên chỉ **0,44**, nên `#89` giữ nguyên trạng thái MỞ và ba hướng
của Đàm vẫn còn đó. Cơ chế khả dĩ cho phần tăng ở dải đất — ghi rõ là **TƯƠNG QUAN, chưa chứng minh
nhân quả** — là số ô đường thôi là hằng số 80.

⚠️ **Và một cái bẫy công cụ suýt làm tôi gán sai công lao**: `vecDist` của `sweep-score.mjs` là
**RMS chứ không phải Euclid** — `sqrt(Σ(a−b)²/(n/3))`, chia cho SỐ DẢI trước khi lấy căn. Script tự
viết để tách dải mà quên vế chia in ra **21,55** trong khi công cụ thật in **12,44**: hai con số cho
cùng một đại lượng. Truy tới cùng rồi mới dám viết bảng trên.

**Ảnh đã giao** (`--width 1500`, nhìn thẳng từ trên xuống, kỷ 1 · 3 · 4 · 7 · 11 · 14) + bản quét
15 kỷ. **Nhìn bằng mắt**: sáu bộ xương khác hẳn nhau; không kỷ nào còn đối xứng bốn chiều trừ ba kỷ
`grid`. ⚠️ **Một điều phải nói thẳng, không giấu sau con số**: nhà dân **bên trong một thửa** vẫn
xếp thành hàng lối đều đặn (đó là `blockStyle` của Phase 14, không phải tầng này) — nếu chữ *"rất
bài bản"* của Đàm còn nhắm vào cái đó thì Phase 20 chưa chạm tới.

**⚠️ CỔNG CHỐNG-RÁCH KÍCH HOẠT 7 LẦN — chép nguyên `.city-preview/vet-rach.log` sang đây theo đúng
`TECH_DEBT #52`** (thư mục ấy nằm trong `.gitignore` và hộp cát bị thu hồi sau phiên):

```
2026-08-24T14:42:46.091Z	city-era01-light-h12-s40.png	1100x700	dai=2	luot=1/3	soVet=1	trungMocDai=1/1	buocMax=0.4155	tiSoMax=50.8	hang=476
2026-08-24T14:46:53.012Z	city-era01-light-h12-s120-w1500-topdown.png	1500x700	dai=3	luot=1/3	soVet=2	trungMocDai=0/2	buocMax=0.3567	tiSoMax=48.6	hang=317,331
2026-08-24T14:46:53.701Z	city-era01-light-h12-s120-w1500-topdown.png	1500x700	dai=3	luot=2/3	soVet=2	trungMocDai=0/2	buocMax=0.3567	tiSoMax=48.6	hang=317,331
2026-08-24T14:46:54.384Z	city-era01-light-h12-s120-w1500-topdown.png	1500x700	dai=3	luot=3/3	soVet=2	trungMocDai=0/2	buocMax=0.3567	tiSoMax=48.6	hang=317,331
2026-08-24T14:48:30.972Z	city-era01-light-h12-s120-w1500-topdown.png	1500x700	dai=3	luot=1/3	soVet=2	trungMocDai=0/2	buocMax=0.3567	tiSoMax=48.6	hang=317,331
2026-08-24T14:49:14.824Z	city-era03-light-h12-s120-w1500-topdown.png	1500x700	dai=3	luot=1/3	soVet=1	trungMocDai=0/1	buocMax=0.2307	tiSoMax=31.5	hang=314
2026-08-24T14:49:59.520Z	city-era14-light-h12-s120-w1500-topdown.png	1500x700	dai=3	luot=1/3	soVet=2	trungMocDai=0/2	buocMax=0.2840	tiSoMax=30.4	hang=202,396
```

**Đọc ra được gì — và tôi đã DỪNG để chẩn đoán chứ không nới ngưỡng** (`#52` đặt Review Trigger ở 5
lần, nó vượt):
- **Dòng 1 là một ca THẬT**: `trungMocDai=1/1` — vết nằm đúng mốc chia dải (hàng 476), tức đúng cơ
  chế mà cổng sinh ra để bắt. Ảnh ấy đã bị loại và dựng lại.
- **6 dòng còn lại đều là `--topdown`, và đều `trungMocDai=0/N`** — vết KHÔNG nằm ở mốc chia dải, mà
  **lặp lại đúng cùng một hàng qua nhiều lượt chụp độc lập** (317,331 ba lượt liền; rồi lại 317,331
  ở một lần chạy khác cách đó gần hai phút). Một vết rách là một **cuộc đua** nên nó **về mặt cấu
  trúc không thể** rơi đúng cùng một hàng với cùng một bước hai lần.
- ⇒ Đây là **một chế độ BÁO OAN CÓ HỆ THỐNG trên khung nhìn-từ-trên-xuống**: nhìn thẳng từ trên
  xuống thì một con đường thẳng chiếu ra thành **một mép ngang sắc lẹm chạy suốt bề rộng khung** —
  đúng chữ ký mà cổng đi tìm. Cùng hình dạng `TECH_DEBT #38` (một ngưỡng hiệu chuẩn trên MỘT quần
  thể rồi đem áp cho CẢ TẬP). Luật *"chữ ký lặp lại thì không phải vết rách"* đã có sẵn và nó bắt
  đúng cả 6 dòng — **và nó không có tham số nào để vặn**, nên không ai nới nó được.

**Nợ mới ghi ra**: `TECH_DEBT #90` (2 phần) — (a) 4 kỷ `[1,2,6,7]` bị ngắn đi sau khi chia khu phố,
biên mỏng nhất **0,9508×**; (b) kỷ 6 mất **40,7%** chi tiết mái (0,593 so với sàn 0,7). Bản vá đã đo
nhưng **không áp**: nó đụng bảng `storey` lịch sử của Phase 14, và kỷ 1 không còn chỗ (1,95 trên
trần 2,0, cần 2,05). **Cấm** hạ sàn 0,7 hoặc hạ ngưỡng 0,95 để lấy lại con số.

**Nghiệm thu**: `npm test` **1096 bài · 1095 xanh · 0 đỏ · 1 bỏ qua** (`# skipped 1` có mặt như bắt
buộc) + `test:cross` 3/3 · `npm run lint` sạch · `npm run build` xanh · bộ test ADR-007 xanh.

**Bốn thứ chỉ thị nhắc mà repo KHÔNG có** — báo ra thay vì tự đoán: `START_HERE.md` · `PHASE_RULES.md`
(cả hai không tồn tại; tôi theo `CLAUDE.md` + `BAN_GIAO.md`) · `networkStyle.plan` (module chưa hề
tồn tại — tôi tạo mới) · `roadPath.js` (không có; thứ gần nhất là `blockStyle.js`/`block.js`).

> ⚠️ **ĐÍNH CHÍNH sau khi hợp nhất (Phase 21)**: `START_HERE.md` và `PHASE_RULES.md` CÓ thật —
> chúng nằm trên `main`, nhánh Phase 20 chưa `git fetch` về nên không nhìn thấy. `PHASE_RULES.md`
> là luật hiện hành và nó **BỎ** nhiều nghi thức mà bản Phase 20 vẫn còn làm (đo hiệu năng · viết
> công cụ đo mới · báo cáo 11 mục). Hai thứ còn lại thì đúng là không có.

---


### 2026-08-24 — Phase 19: khối kiến trúc, bóng đổ, khung hình (ADR-062 `monolith` · ADR-063 AO · ADR-061 khung hình)

**Đàm nói gì**: *"đường có nét đứt trông giả tạo kinh khủng · kim tự tháp không có khối hình chóp"*
(nhìn kỷ 1 · 2 · 14), cộng một yêu cầu cũ chưa ai làm: *"hiệu ứng hơn, ánh sáng đổ bóng… giống 3D
hoá hơn nữa"*. Sáu việc, làm hết rồi báo một lượt.

1. **Đường nét đứt** — bisect TRƯỚC, đoán sau, vì chữ *"tự dưng"* chỉ vào một hồi quy.
2. **Nguyên mẫu thứ 8 `monolith`** (ADR-062). Bệnh KHÔNG nằm ở `roof: 'pyramid'` — kỷ 2 khai đúng
   từ lâu. Bệnh nằm cao hơn một tầng: **cả 7 nguyên mẫu đều là THÂN + MÁI**, nên Đại Kim Tự Tháp
   dựng ra là *một hộp gạch bùn đội cái nón*, có tường, có cửa, có mái đua loe chân thành cây nấm.
   Nay `monolith` dựng thẳng từ mặt đất: **không thân tường, không `groundFloor`, không `eaves`,
   không `rooftop`**. Kỷ 2 = chóp TRƠN (tỉ lệ cao:đáy 0,64 như Giza) · kỷ 3 = GIẬT CẤP (thềm +
   tường nghiêng batter + đền trắng trên đỉnh + cầu thang chính diện). **Đóng `TECH_DEBT #75`** —
   và đóng đúng bằng cách mục ấy đã tự chẩn đoán: *bài toán KHỐI TÍCH, không phải bài toán MÁI*.
3. **Bóng đổ nét hơn**: `SHADOW_MAP_DESKTOP` 2048 → **4096**; điện thoại **GIỮ 512** (4096² × 4 byte
   = 64 MB texture — iOS Safari giết tab vì đúng thứ đó). Đo bằng cặp ảnh khác nhau ĐÚNG một hằng
   số: 0,2–0,3% điểm ảnh đổi, nhưng **16,07–16,33 tại chỗ đã đổi** ⇒ có thật, rất cục bộ, chỉ là
   một vệt mỏng dọc MÉP bóng. ⚠️ **Nửa sau của chỉ thị đã ĐO VÀ BÁC BỎ**: `reach` (9,00) ĐÃ LÀ phạm
   vi thành phố — khối đổ bóng xa nhất trên cả 15 kỷ ở bán kính **8,48**, dư đúng 6%. Siết thêm là
   cắt cụt bóng của nhà ở góc lưới, nên tôi KHÔNG siết và ghi lý do vào mã.
4. **Che khuất môi trường (AO)** (ADR-063): nướng vào **MÀU ĐỈNH** lúc gộp hình học ⇒ **0 lệnh vẽ,
   0 tam giác** thêm (đã đo: kỷ 6 = 13 · kỷ 11 = 12, y hệt cả hai phía). Chính vì thế
   `renderer.info` mù hoàn toàn với nó, nên `--no-ao` là **đối chứng BẮT BUỘC**, không phải tuỳ
   chọn tiện tay. Đo: **2,2–4,1% điểm ảnh đổi · 15,87–16,55 tại chỗ đã đổi**. ⚠️ **Điều kiện dừng
   của Đàm KHÔNG kích hoạt**: sàn độ sáng đi XUỐNG, dải tương phản NỞ RA, độ tươi không tụt — cả ba
   đều ngược hướng "trắng bệch".
5. **Nóc nhà thôi bị mép khung cắt** (ADR-061) — **đóng `TECH_DEBT #24`**, mở từ Phase 7B. Và thủ
   phạm hoá ra là **một BÀI TEST**: bài *"KỶ THẤP GIỮ NGUYÊN KHUNG SÁT"* (Phase 5A) đòi
   `factor ≤ 1,35`, trong khi 13/15 kỷ cần ≥ 1,47 ⇒ cái trần ấy và lời hứa "không cắt" **không thể
   cùng đúng**. Nay mỗi kỷ một khoảng cách riêng, tìm bằng chia đôi: **0/15 kỷ bị cắt**, hệ số
   1,307…1,878, và **14/15 kỷ ra biên đúng 0,0400 = sàn** ⇒ tối thiểu thật, không dư một li.
6. **Quét lại 15 kỷ**: **105/105 cặp kỷ ĐẠT** (gần nhất 19,18 · trung vị 36,31) — điều VIỆC 6 hỏi
   là CÓ.

⚠️ **CÁI GIÁ, VÀ VÌ SAO TÔI KHÔNG TỰ CHỌN HỘ.** Trục CHẶNG NGÀY tụt **14,39 → 11,33**, lần đầu
xuống dưới ngưỡng mắt 12. Tôi **không gán cả −3,06 cho "Phase 19"** mà đi tách một biến — ba lượt
quét đầy đủ trên ba cây mã, mốc nền TỰ ĐO trong `git worktree` chứ không chép của phase trước
(`TECH_DEBT #43`):

| cây mã | trục chặng | trục kỷ |
|---|---:|---:|
| mốc nền `be9d2ea` | **14,39** ✓ | 22,13 |
| đủ VIỆC 1+2+3+4, **hoàn tác riêng `orbit.js`** | **14,23** ✓ | 21,24 |
| Phase 19 đủ | **11,33** ✗ | 19,18 |

⇒ Bốn việc mỹ thuật tốn **0,16**; **2,90 là của riêng phép lùi khung hình**. Cơ chế là **pha loãng**
(`TECH_DEBT #22`): dải đo là phân số CỐ ĐỊNH của ô, thành phố nhỏ lại thì mỗi dải lẫn thêm nền —
**không phải 15 kỷ/6 chặng thật sự giống nhau hơn**. Bằng chứng phụ: **12/15 cặp chặng TỐT LÊN**
(bình minh↔hoàng hôn 23,17 → 32,75), chỉ ba cặp *bình minh/sáng ↔ giữa ngày* đi xuống.

Tách ba dải của cặp yếu nhất: **trời 8,38 → 4,12** · thành phố 10,74 → 6,51 · **đất 20,88 → 18,05**
⇒ đất vẫn khoẻ **gấp bốn lần** trời. **Cần gạt nằm ở BẦU TRỜI lúc 6h so với 15h** — xác nhận lại
kết luận đã ghi sau Phase 14, và **bác bỏ lần thứ hai** chỉ thị cũ *"làm vùng quê đổi theo giờ"*.

Đây là **xung đột giữa hai thứ Đàm đã yêu cầu**, nên ba hướng nằm ở `TECH_DEBT #89` chờ Đàm chọn.
❌ Không nới ngưỡng 12 (phễu Phase 9A) · ❌ không đổi cách cắt dải để lấy lại con số (`#55`).

**Hai món quà phụ, cả hai đều nhờ phép lùi khung** (⚠️ và cả hai sẽ mất nếu Đàm chọn hoàn tác):
kỷ 5 **tự lành** cổng "thấy nước" (3,51% → **7,30%**) vì nước nằm ngoài lưới thành phố ⇒ `#67` nay
chỉ còn kỷ 4; và một chữ trong tiêu đề `#59` bị bác bỏ bằng số — kỷ 6 *"không đạt ở **bất kỳ** góc
nào"* nay có trần toàn cục **7,24%** (trước 4,36%), nên bài test kỷ 6 đã được **đảo vế** kèm giải
thích (góc mặc định vẫn trượt 2,59%, **nhưng** trần toàn cục đã > 5% — phải khẳng định cả hai câu).

**Hai lỗ hổng tài liệu phát hiện trong lúc làm**: `START_HERE.md` và `PHASE_RULES.md` mà chỉ thị bảo
đọc trước **chưa từng tồn tại trong bất kỳ commit nào, trên bất kỳ nhánh nào** — nên "tóm tắt 5
dòng theo §6" không đọc được luật gốc. Và `shadow-score.mjs` nằm ở `scripts/`, không phải
`scripts/archive/` như chỉ thị ghi.

**Nghiệm thu**: `npm test` **1067 bài · 1066 xanh · 0 đỏ · `# skipped 1`** + đối chiếu chéo 3/3 ·
`npm run lint` sạch · `npm run build` xanh. Ảnh giao: kỷ **2 · 3 · 6 · 11 · 14** ở `--width 1500`,
cặp AO (kỷ 2 · 6 · 11), cặp bóng đổ (kỷ 6 · 11 ở 15h), và bản quét 15 kỷ × 6 chặng.

---

### 2026-08-24 (tối muộn) — Đường phố biết uốn cong, và mạng đường có ba hạng (ADR-058)

**Lệnh của Đàm**: *"Hãy cải thiện đường đi, hiện tại nó chỉ là những đường thẳng, không giống đường
ngoài đời, không uốn cong, và nó cũng như quy hoạch quá, các thời trước làm gì có quy hoạch đường
thẳng tấp thế, và hiện tại ít đường và loại đường quá. Hãy tìm hiểu các kỷ có bao nhiêu đường, hình
thái, .. và build nó + mở rộng đường đi."*

#### Đo trần TRƯỚC khi viết dòng mã nào — và nó bác bỏ một nửa cách hiểu của chỉ thị

| thứ | số ô | phần lưới 144 |
|---|---:|---:|
| ô đường hiện có | 80 | 55,6% |
| ô hứa cho kỳ quan | 45 | (11 ô chồng lên đường) |
| **ô còn trống** | **30** | **20,8%** |

Và đúng 30 ô ấy là `DWELLING_PLOTS` — **toàn bộ nhà dân**. "Thêm ô đường" = xoá nhà. Cùng cái trần
Phase 14 §1(3), cùng câu trả lời: **đổi thứ NẰM TRONG một ô**.

#### Chỗ trống thật sự nằm ở đâu

`streetStyle.js` (Phase 9D) có mười trục, nhưng cả mười nói về **MẶT CẮT NGANG**, mà một lát cắt thì
không có hình dạng theo chiều dọc. **TIM ĐƯỜNG chưa bao giờ là một trục** — mọi lòng đường được dựng
chính giữa ô lưới, nên 15 kỷ dùng chung một tấm lưới bàn cờ. Đó là lý do nhìn đâu cũng thấy "quy
hoạch": không phải vì mạng đường được quy hoạch, mà vì **mã không có cách nào diễn đạt một con đường
KHÔNG thẳng**.

#### Đã làm

1. **`city3d/networkStyle.js` (MỚI)** — bảng 15 kỷ × 4 trục: `plan` (grid/axial/organic/terrace/
   radial) · `bend` (biên độ, **TỈ LỆ của chỗ trống** chứ không phải số ô) · `coil` (bước sóng, số
   ô) · `ragged` (biến thiên bề rộng). `country` khoá cứng vào `eraStyle.js` bằng test.
2. **`city3d/roadPath.js` (MỚI)** — lớp HÌNH. Luật sống còn: **độ lệch là thuộc tính của RANH GIỚI**.
3. **Hạng đường thứ BA** — `streetCrossSection` đổi từ boolean sang HẠNG; `rankOfRoad(variant, tier)`
   là chỗ duy nhất quyết định. `cityLayout.js` nay truyền `tier` xuống prop (trước bị bỏ lại, nên
   36/80 ô vành đai vô hình với tầng vẽ).
4. **Cư dân đi theo chính tim đường ấy** (`walkThrough`), không đi tâm ô nữa.
5. **`scripts/road-bend.mjs` (MỚI)** — đo trên tam giác ĐÃ DỰNG, `--selftest` 7 mục.

#### Số

| | TRƯỚC | SAU |
|---|---:|---:|
| mặt đường đổi chỗ (kỷ 6, mặt nạ `road`) | — | **≈47% diện tích của chính nó** (nhiễu dựng ảnh ±1,4%) |
| cả khung hình vượt ngưỡng mắt 12 | — | 0,67% (mặt đường chỉ chiếm 1,38% khung) |
| lệnh vẽ, 15 kỷ | 11–20 | **y hệt** |
| tam giác mặt đường, kỷ 6 | 1.538 | 2.334 (+52%) |
| lệch tim đường ÷ bề rộng, kỷ 1 · 6 · 4 | 0 · 0 · 0 | 0,739 · 0,542 · **0,000** (kỷ 4 thẳng có chủ đích) |
| `npm run test:fast` | 1.133 | **1.146** bài · 1.145 xanh · 0 đỏ · 1 bỏ qua |

#### Ba lỗi thật bắt được dọc đường (chi tiết ở `CLAUDE.md`)

1. **Biên độ lượn tính theo bề rộng KHAI** trong khi bề rộng THẬT đã nhân `widthJitter` tới 1,35 lần
   ⇒ `0,25 + 0,3105 = 0,5605 > 0,5`, mặt đường lấn sang thửa đất bên cạnh. **Không nổ ngay** vì cả
   hai đại lượng đều theo băm — "đúng nhờ may mắn".
2. **Một biên độ cho cả kỷ** ⇒ **7/15 kỷ ra biên độ đúng bằng 0**, gồm cả kỷ lượn nhất bảng — kèm
   một đoạn chú thích tự trấn an rằng đó là "đánh đổi có chủ đích".
3. **Kỷ 13 ghi "Edo jōkamachi"** trong khi `eraStyle` khai landmark là **tháp nang Nakagin (1972)**
   và `streetStyle` khai nhựa đường — ba bảng suýt kể ba câu chuyện khác nhau về cùng một kỷ.

#### Còn lại

- `TECH_DEBT #83` (Low): ngưỡng *"0,25 lần bề rộng = mắt đọc ra được"* **chưa hiệu chuẩn bằng ảnh
  dựng**. Đừng trích con số "3/15 kỷ" như thể nó là một phép đo.
- 10/15 kỷ chỉ lượn nhẹ, và đó là một **trần hình học** đã đo (lòng đường + vỉa hè lấp gần trọn ô ở
  kỷ hiện đại), không phải một việc chưa làm xong. Muốn nới thì cần gạt đúng là bề rộng/vỉa hè trong
  `streetStyle.js`.

---

### 2026-08-24 (tối) — Chân có đầu gối thật: giải bằng khớp ngược (ADR-057, đóng `TECH_DEBT #82`)

**Lệnh của Đàm**: *"Không đo, tiếp tục làm, không hỏi vặt, làm sao cho con người có nhiều góc bo
tròn, cử động khớp thật, có thể vẽ thêm tam giác/khối mỗi ngưới tới lúc nó bo tròn, 3D nhiều hơn,
tăng thêm kiểu đi, chuyển động thật và ít mặt phẳng hơn."*

Ba chữ *"không đo"* = bỏ qua phép đo hiệu năng trên MacBook mà tôi đã đề xuất làm việc kế tiếp.
Hai vế *"cử động khớp thật"* và *"vẽ thêm tam giác/khối"* là hai lệnh **thu hồi tường minh**.

**Đã làm gì**
- **`humanPose.js` VIẾT LẠI HOÀN TOÀN — khớp ngược.** Ba dòng đầu của `poseAt` đặt hai bàn chân
  trong KHÔNG GIAN THẾ GIỚI (`footOffsetAt` dọc đường đi · `footLiftAt` độ nâng lúc đưa · `splay`
  bề ngang), rồi `solveTwoBone` giải ngược ra góc đùi và góc gối bằng định lý hàm cosin. `stretchOf`
  và `legFactorAt` bị **xoá**; `sceneGraph.js` bỏ theo. Thêm `pose.reach` (tỉ số hông→bàn chân trên
  tổng chiều dài xương) làm bất biến cốt lõi.
- **`human.js`**: 11 → **16…18 khối**, 3 → **11 khớp** (thêm `pelvis`, `elbowL/R`, `kneeL/R`).
  `humanDims` thêm `thighLen · shinLen · upperArmLen · forearmLen · handLen`.
- **`humanShape.js`**: bộ 8 → **9 khuôn** (thêm `calf` — cẳng chân, có thắt gối). Mọi khuôn không
  phải hộp đi từ 8 lên **12 mặt** và 3–6 vành; mỗi khuôn cong có ít nhất một **ĐIỂM UỐN**.
- **`humanGait.js`**: 9 → **14 kiểu** (thêm `prowl · shuffle · swagger · plod · scurry`), 4 → **6
  trục** (`lift · flex · sway · twist · headTrack · splay`). `gaitOf()` nay nhận cả một hồ sơ đầy
  đủ chứ không chỉ một tên — đó là lối bơm mà bài "dây nối" cần; đổi lại, test ĐÒI bảng kỷ khai
  `gait` là một **chuỗi** ở cả 15 kỷ để bảng không lợi dụng lối ấy.
- **`humanStyle.js`**: gán lại kiểu đi cho cả 15 kỷ, mỗi dòng kèm lý do buộc vào `country`.
- **`sceneGraph.js`**: khớp **hai trục** (`TRAVEL_AXIS` mới), ghép theo thứ tự cố định
  `jointSpin.premultiply(jointRoll)` = `Rx(b) · Rz(a)`.

**Số đo**
- Trượt chân **4,86 × 10⁻¹⁷ ô** trên **210 tổ hợp** (14 kiểu × 15 kỷ) — sai số dấu phẩy động.
- `reach` cao nhất **0,9928** (kỷ 12, `march`). Nhánh kẹp của `solveTwoBone` **chưa bao giờ chạy**.
- Gối gập **−84,3°…−13,8°**, dấu luôn ÂM ⇒ không bao giờ bẻ ngược.
- Tam giác mỗi người **1.616…1.928**; tam giác 15 kỷ **3.068.606 → 3.194.262 (+4,1%)**.
- Lệnh vẽ **+1 ở cả 15 kỷ**, neo Chromium ở kỷ 1 · 8 · 13 (**13 · 19 · 14** thành phố).
- Cư dân chiếm **16,27%…26,12%** tam giác cảnh; ca xấu nhất kỷ 1.

**Sáu bài test đỏ, không bài nào đỏ vì mã hỏng** — và đây là phần đáng đọc nhất. Bốn bài đo một mô
hình đã chết; hai bài đếm sai số khối. Ca đáng nhớ nhất: *"biên độ khớp có trần"* đòi góc đùi
`≤ asin(stride/4)`, một trần suy từ tam giác vuông của mô hình chân CỨNG. Có đầu gối thật thì đùi
**phải** nghiêng nhiều hơn thế (**57,3°** so với **27,5°** ở kỷ 1) — giữ nguyên con số ấy làm trần
là dùng một bài test để hoàn tác một bản vá đúng. Đã **đổi vai của nó thành SÀN**, rồi thay chỗ
trống bằng những bất biến thật của mô hình mới.

**Một phép phá không nổ, và không có gì hỏng cả**: bơm `splay` lên tận trần dải hợp lệ mà bàn chân
không trượt một chút nào — vì **không một cần gạt nào của bảng dáng đi có thể làm bàn chân trượt**,
nó là ĐẦU VÀO nên đứng yên theo cấu tạo. Phải phá bằng `stride: 5` (bảng CƠ THỂ). Đã ghi thẳng câu
trả lời ấy vào chú thích, kẻo phiên sau đọc thành một lỗ hổng.

**Nghiệm thu**: `npm test` **1133 bài, 0 đỏ, 1 skipped** · `npm run lint` sạch · `npm run build`
xanh · ảnh `.city-preview/human-strip-ky1-15.png` dựng lại sạch.

**Tài liệu đã cập nhật**: ADR-057 · `ARCHITECTURE.md` · `PROJECT_STRUCTURE.md` · `PERFORMANCE.md`
(Phase 17) · `TECH_DEBT.md` (**đóng #82**) · `CHANGELOG.md` · `CLAUDE.md` · `BAN_GIAO.md`.

**Việc phiên sau cần biết**: **`ms` mỗi khung CHƯA đo lại.** Hộp cát chỉ có SwiftShader nên mọi con
số thời gian ở đây vô nghĩa. Trần 30% là một trần theo TỈ LỆ HÌNH HỌC, không phải một lời hứa về
tốc độ. Muốn xác nhận: `bash scripts/bench-macbook.sh` trên MacBook M3 của Đàm.

---

### 2026-08-24 — Dáng đi thành một trục bản sắc, và khuôn cơ thể hết phẳng (ADR-056)

**Lệnh của Đàm**: *"Tiếp tục trau chuốt, ít ảnh phẳng hơn, tạo nhiều đặc trưng hơn, di chuyển mượt
mà hơn (nhiều kiểu di chuyển), mỗi kỷ phải tốt hơn, mỗi người phải ra dáng người hơn và không cử
động như robot, hình ảnh 3D hơn, đẹp hơn."*

**Đã làm gì**
- **`src/engine/city3d/humanGait.js` MỚI** (thuần): bảng **9 kiểu đi** × 4 trường — `knee` (co gối
  giả) · `sway` (nghiêng thân sang bên) · `twist` (vai xoay ngược hông) · `headTrack` (đầu giữ
  thăng bằng). Kèm `isValidGaitProfile` **TỪ CHỐI THẲNG** dòng sai, không tự chữa.
- **`humanStyle.js`**: trục thứ **12** `gait`, đủ 15/15 kỷ, mỗi dòng có lý do buộc vào `country`
  (thợ săn sải dài · thầy tế lướt · lính đều bước · quý tộc bước ngắn · phu than lê chân · gánh
  hàng rong nhún · thuỷ thủ lắc · thư ký hối hả · dạo phố thong dong).
- **`humanPose.js`**: `stretchOf` + `legFactorAt` (co gối giả, hệ số `sin²`), `sway`, `twist` (dịch
  hai khớp vai theo trục đi tới — mesh cứng nên "xoay" diễn đạt bằng phép dịch), `headTrack`.
- **`humanShape.js`**: khuôn **`chest`** mới (60 tam giác) cho thân và áo may đo; `limb` · `flare` ·
  `cone` · `dome` · `hat` được thêm vành để có **điểm uốn** — 76/60/46/76/76 tam giác.
- **`sceneGraph.js`**: nhân hệ số co gối vào `rest.y` và `part.h` (**không** vào x/z).
- **`humanGait.test.js` MỚI** (8 bài, tất cả đã thử-cho-đỏ) + cập nhật `drawCallBudget.test.js`,
  `sceneGraphWiring.test.js`.

**Số**
- Tam giác mỗi người **220…324 → 476…628**; **khối mỗi người vẫn 9…11**.
- Lệnh vẽ thành phố **+1 ở CẢ 15 kỷ** (đúng bằng khuôn `chest` mới, vì lệnh vẽ cư dân = số khuôn).
- Tổng tam giác 15 kỷ **2.537.606 → 2.665.286 (+5,0%)**.
- Trần tỉ lệ **6% → 11%**; ca xấu nhất **kỷ 1 = 5,40% → 9,68%**.
- Nâng bàn chân lúc đưa chân: **5% (trudge) … 34% (march)** chiều dài chân, **đúng thứ tự `knee`**.
- Ba bất biến cũ còn ở mức sai số máy: trượt **1,39e-17** · `|foot.y|` lúc trụ **1,39e-17** · vượt
  trần góc hông **5,55e-17**.
- Bản sắc dáng đi: **36/36 cặp khác nhau ở 4/4 trường**.
- Test **1131 bài, 1130 đạt, 0 hỏng, 1 bỏ qua**; lint sạch.

**Bốn bài học (đã ghi vào `CLAUDE.md`)**
1. **Số VÀNH, không phải số MẶT**, quyết định "phẳng hay không" — khuôn 2 vành cho đúng MỘT dải
   sáng dọc dù `sides` bằng bao nhiêu. Lần thứ **bảy** của "một trường gánh hai việc", lần này thứ
   gánh hai việc là một **hồ sơ hình học**.
2. **`sin²` là một định lý, không phải một lựa chọn cho mượt** — có chứng minh và có đối chứng
   dựng lại bản `sin` hỏng bắt nó phải vượt trần.
3. **Một phép thử ngược ra "16 đạt, 0 hỏng" vì bất biến ấy KHÔNG THỂ đỏ** (assert chỉ lấy mẫu ở pha
   trụ, nơi hệ số bằng 1 theo cấu tạo). Lần thứ hai sau ADR-048.
4. **`TECH_DEBT #43` lần thứ hai trong một tuần**: ba phép đo cãi nhau về lệnh vẽ kỷ 13 (12 · 13 ·
   14) chỉ vì hai fixture khác `sessionCount`, cộng một lỗi **NHÃN** (Chromium in số CẢ KHUNG =
   công thức **+2**, chứ không phải số thành phố). Suýt mở một mục nợ về một lỗi không tồn tại.

**Còn lại (đã ghi nợ)**: `TECH_DEBT #82` — hông chưa lắc ngang, đai hông chưa xoay, vì bộ khớp chỉ
có **một** trục quay. Ở khung mặc định không đọc ra được (`#80`), nên hoãn có chủ ý.

---

### 2026-08-23 (tối) — Cơ thể cư dân dựng bằng MẶT TRÒN XOAY, mỗi kỷ một bộ khuôn (ADR-055)
