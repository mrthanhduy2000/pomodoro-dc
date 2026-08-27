> Cập nhật lần cuối: **2026-08-27 (khuya)** — **ĐIỀU HƯỚNG CHÍNH: 8 MỤC → 5, BẰNG CÁCH GỘP.**
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

> Cập nhật lần cuối: **2026-08-27 (tối)** — **MỌI CHUYỂN ĐỘNG VỀ ĐÚNG BA NHỊP.**
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

> Cập nhật lần cuối: **2026-08-27 (chiều)** — **`ActionButton` NGHE THEO SKIN + CÓ CẢM GIÁC BẤM LÚN.**
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

> Cập nhật lần cuối: **2026-08-27** — **SKIN THỨ 5 "SÂN CHƠI" (arcade), ĐẶT LÀM MẶC ĐỊNH.**
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

> Cập nhật lần cuối: **2026-08-24 (đêm)** — **CẮT CHI PHÍ MỖI PHIÊN: 6.323 DÒNG BẮT BUỘC ĐỌC → 55**.
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
