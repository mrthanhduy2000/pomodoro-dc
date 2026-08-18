/**
 * eraStyle.js — "ngữ pháp" kiến trúc của 15 kỷ. Đây là TRỤC THỨ NHẤT của ngôn ngữ hình khối.
 *
 * THUẦN: chỉ dữ liệu + tra cứu. Không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY (thay vì tô màu khác nhau cho cùng một cái hộp):
 * Phase 3A vẽ mọi công trình bằng một khối hộp trắng, và phản hồi đầu tiên của Đàm khi nhìn thấy
 * đúng là "quá đơn giản và không đẹp". Màu sắc KHÔNG cứu được chuyện đó: thứ làm mắt người phân
 * biệt được một túp lều tranh với một toà nhà kính là ĐƯỜNG NÉT — độ dốc mái, độ thò của diềm,
 * cửa sổ hình gì, có cột hay không. Bảng dưới đây mã hoá đúng những đường nét ấy.
 *
 * Cách đọc một dòng: mỗi kỷ trả lời 8 câu — thân nhà hình gì, **to cỡ nào**, mái kiểu gì và dốc bao
 * nhiêu, diềm thò ra bao xa, cửa sổ kiểu gì, có những chi tiết đặc trưng nào, và nét vẽ gọn hay thô.
 *
 * ⚠️ HAI TRƯỜNG `massScale`/`spread` THÊM NGÀY 2026-08-14, VÀ ĐÂY LÀ LÝ DO:
 * Đàm nhìn thành phố rồi nói *"không thể nào nhà hiện đại lại giống nhà thời đồ đồng được"*. Đo ra
 * thì anh đúng đến mức khó tin: chiều cao trung bình của kỷ 1 (lều da thú) là **1,81**, của kỷ 14
 * (tháp kính) là **2,05** — chênh 13%. Cả bảng 15 kỷ chỉ trải 1,88 lần, và còn SAI CHIỀU: lâu đài
 * kỷ 5 (2,28) cao hơn cả cao ốc kính.
 * Nguyên nhân: `storyHeight` đang gánh HAI việc mâu thuẫn nhau — vừa là "một tầng cao bao nhiêu"
 * (dùng chia ra số hàng cửa sổ), vừa là hệ số chiều cao tổng. Một túp lều và một toà nhà chọc trời
 * có chiều cao TẦNG gần bằng nhau ngoài đời thật (2,5m so với 3,5m), nên trường ấy **không bao giờ**
 * tách nổi hai thứ đó ra. Thứ khác nhau giữa chúng là **SỐ TẦNG**, và trước đây không ai ghi nó.
 * ⇒ Nay tách đôi: `storyHeight` giữ đúng nghĩa hẹp "một tầng cao bao nhiêu", `massScale` mới là
 * "nền văn minh này xây cao tới đâu". Cộng `spread` (bề ngang) thì lều vừa thấp vừa nhỏ, còn tháp
 * kính vừa cao vừa mảnh — hai hình bóng không thể nhầm nhau ở bất kỳ cỡ hiển thị nào.
 *
 * ⚠️ `country`/`landmark`: Đàm yêu cầu *"mỗi kỷ có thể lấy một đất nước làm biểu tượng — ví dụ thời
 * phục hưng có thể lấy nhà của Ý hoặc Pháp"*. Hai trường này KHÔNG phải nhãn dán cho đẹp: chúng là
 * **lời giải thích cho những con số nằm cùng dòng**. Muốn đổi `roof`/`massScale`/`motifs` của một
 * kỷ thì phải trả lời được "công trình có thật nào ở nước ấy trông như vậy?" — nếu không trả lời
 * được thì con số ấy là tuỳ hứng, và tuỳ hứng chính là thứ đã sinh ra 15 kỷ cao bằng nhau ở trên.
 * 15 nước KHÔNG trùng nhau, để thanh chuyển kỷ đọc ra một hành trình vòng quanh thế giới.
 *
 * ⚠️ `wallMaterial`/`roofMaterial` THÊM NGÀY 2026-08-14 (Phase 7A) — và đây LẠI LÀ đúng cái bẫy
 * "một trường gánh hai việc" của Phase 5B, lần này rơi vào `roofColor`. Một mã màu chỉ nói được
 * *"mái này màu gì"*; nó KHÔNG nói được *"mái này bóng hay nhám"*. Mà mắt người phân biệt ngói men
 * lưu ly với mái tranh chủ yếu qua vế thứ hai — hai thứ đó có thể cùng một sắc vàng. Trước đây cả
 * thành phố dùng chung một vật liệu khuếch tán thuần (Lambert), nên **về mặt toán học** kính, kẽm,
 * rơm và bùn là CÙNG MỘT BỀ MẶT. Đó chính là nguyên nhân gốc của cảm giác "khối màu phẳng".
 * Hai trường mới trỏ sang `materials.js`; luật ràng buộc y hệt `country`/`landmark`: khai vật liệu
 * nào thì phải trả lời được *"công trình có thật ở nước ấy lợp bằng gì?"*.
 *
 * ⚠️ `vernacularRoof` THÊM NGÀY 2026-08-15 (Phase 7C) — VÀ ĐÂY LÀ LẦN THỨ BA CỦA CÙNG MỘT CÁI BẪY
 * "một trường gánh hai việc" (sau `storyHeight` ở Phase 5B và `roofColor` ở Phase 7A).
 * Phase 7C dựng 17–30 NHÀ DÂN quanh 5 kỳ quan. Nhà dân đọc `roof` của kỷ, và ảnh chụp kỷ 7 cho
 * thấy ngay hậu quả: **25 căn nhà nhỏ đều đội mái vòm terracotta y hệt Duomo**, nên nhà thờ chính
 * toà — thứ Đàm yêu cầu phải *"nhận ra được từ xa"* — chìm nghỉm giữa một đám bản sao tí hon của
 * chính nó. Không có gì đỏ lên: mã chạy đúng, ngân sách tam giác vẫn còn dư, chỉ có hình bóng sai.
 *
 * Nguyên nhân gốc là một lỗi MÔ HÌNH DỮ LIỆU, không phải lỗi mã: `roof` đang trả lời hai câu hỏi
 * khác nhau cùng lúc — *"công trình BIỂU TƯỢNG của nền văn minh này lợp mái gì?"* và *"nhà thường
 * ở đây lợp mái gì?"*. Ngoài đời hai câu đó gần như không bao giờ cùng đáp án, vì mái kỳ đài là
 * thứ tốn kém và thường bị luật lệ giới hạn (mái chồng nhiều tầng từng bị cấm với dân thường ở
 * Trung Quốc; giật cấp New York là luật quy hoạch cho cao ốc; Firenze có đúng MỘT mái vòm).
 * Cách nhận ra sớm — đúng câu hỏi đã dùng cho `massScale`: *"ngoài đời hai thứ này có luôn đi
 * cùng nhau không?"* Không ⇒ phải tách, mọi lần chỉnh sau đó chỉ là đổi chỗ vấn đề.
 *
 * 9/15 kỷ khai khác `roof`; 6 kỷ còn lại khai TRÙNG một cách có chủ đích (thời đồ đá thì nhà nào
 * cũng là lều) — và chúng vẫn phải khai, không được để trống. Trường bắt buộc thì một kỷ mới thêm
 * vào sẽ buộc người viết trả lời câu hỏi ấy; trường tuỳ chọn thì nó lặng lẽ rơi về `roof` và cái
 * bẫy này quay lại. `eraStyle.test.js` khoá cả hai vế: đủ 15 kỷ, và 9 kỷ kia phải KHÁC.
 *
 * ⚠️ `groundFloor` THÊM NGÀY 2026-08-18 (Phase 10) — TẦNG TRỆT: cái cửa để bước vào, và MỘT đặc
 * trưng mặt phố. Nó nằm trong file NÀY chứ không thành bảng thứ tư riêng, vì mỗi dòng phải trả lời
 * *"công trình có thật nào ở nước ấy trông như vậy?"* — và câu trả lời (`country`/`landmark`) nên
 * nằm trong tầm mắt, không phải ở một file khác phải mở ra đối chiếu. Hình học nằm ở
 * `groundFloor.js`; file này chỉ KHAI.
 *
 * Hai lỗi thật mà nó sửa (đo được, đã chạy trên production nhiều tháng): (a) kỷ 1 và 2 khai
 * `windows: 'none'` nên `emitWindows` thoát sớm và **hai kỷ ấy không hề có cửa** — một công trình
 * không có lối vào là một khối đặc; (b) cửa cũ rộng đúng **0,14** cho cả kỳ quan rộng 1,4 lẫn nhà
 * dân rộng 0,45, tức lần thứ ba của cái bẫy "số tuyệt đối áp lên những khối chênh nhau ba lần".
 *
 * Trường này **bắt buộc cả 15 kỷ** — cùng lý do như `vernacularRoof`. 12 kỷ chưa nghiên cứu khai
 * thẳng `door: 'legacy'` (giữ nguyên cửa cũ, không dựng gì mới); đó là một trạng thái tạm CÓ ĐẾM
 * ĐƯỢC, `groundFloor.test.js` khoá đúng con số 12 và đúng ba kỷ đã làm (6 · 9 · 13). Xem
 * `LEGACY_DOOR` ở `groundFloor.js` để biết vì sao không để trống.
 */

/**
 * Kiểu mái. Mỗi giá trị là một cách gấp mái khác hẳn nhau, không phải cùng một mái đổi độ dốc:
 *   `cone`     nón tròn — mái rơm, lều
 *   `gable`    dốc hai phía — nhà gỗ, nhà đá
 *   `flat`     bằng — nhà đất, bê tông, kính
 *   `stepped`  giật cấp — ziggurat, mái bằng có tum
 *   `tiered`   nhiều tầng mái chồng, diềm cong — kiến trúc Á Đông
 *   `dome`     vòm — Phục Hưng, Khai Sáng
 *   `pyramid`  chóp bốn mặt — tháp, đền
 *   `sawtooth` răng cưa — nhà xưởng lấy sáng trời
 *   `blade`    phiến mỏng lơ lửng — kiến trúc tương lai
 */
export const ROOF_KINDS = [
  'cone', 'gable', 'flat', 'stepped', 'tiered', 'dome', 'pyramid', 'sawtooth', 'blade',
];

/**
 * Kiểu cửa sổ — quyết định nhịp điệu mặt tiền, thứ mắt bắt được ngay cả khi nhà rất nhỏ trên màn.
 *   `none` không có · `slit` khe hẹp đứng · `square` ô vuông thưa · `arch` vòm cuốn
 *   `grid` lưới đều · `curtain` dải kính liền · `neon` dải phát sáng
 */
export const WINDOW_KINDS = ['none', 'slit', 'square', 'arch', 'grid', 'curtain', 'neon'];

/**
 * 15 kỷ. `motifs` là các chi tiết đặc trưng mà `buildingSpec.js` biết cách dựng; thứ tự trong mảng
 * là thứ tự ưu tiên khi công trình nhỏ không đủ chỗ cho tất cả.
 *
 * `rough` (0..1) là độ "tay làm" của nét vẽ: kỷ tiền sử để cao cho khối lệch lạc tự nhiên, kỷ hiện
 * đại để 0 cho cạnh thẳng băng. Độ lệch vẫn TẤT ĐỊNH (suy từ băm id), không phải ngẫu nhiên.
 *
 * `massScale` (chiều cao tổng) và `spread` (bề ngang) là hai số quyết định HÌNH BÓNG — thứ mắt bắt
 * được từ xa trước cả màu và chi tiết. Đọc chúng theo cặp:
 *   thấp + nhỏ  = túp lều (kỷ 1)      ·  thấp + bè  = ziggurat, xưởng máy, lô cốt (kỷ 3/10/12)
 *   cao  + bè   = cung điện (kỷ 11)   ·  cao  + mảnh = tháp kính (kỷ 14/15)
 * ⚠️ Tỉ lệ cao/rộng bị khoá trần ở `buildingSpec.test.js` (2,4 — ba kỷ cao được nới 3,2). Nâng
 * `massScale` mà quên nâng `spread` theo là cách nhanh nhất làm đỏ bài test đó.
 */
export const ERA_STYLES = {
  1: {
    name: 'đá thô & lều da thú',
    country: 'Thổ Nhĩ Kỳ', landmark: 'cự thạch Göbekli Tepe',
    signature: 'tstone',
    roofColor: '#745339',   // da thú & gỗ hun khói — nâu sẫm, KHÔNG phải xanh lá
    wallMaterial: 'stone', roofMaterial: 'thatch',   // đá xếp khô + da thú căng trên khung gỗ
    // ⚠️ `eaves` 0,04 và `roofPitch` 0,95 — KHÔNG phải 0,16 / 0,62. Ảnh quét ngày 2026-08-14 cho
    // thấy lều kỷ 1 đọc ra thành CÂY NẤM (hay cái ô che nắng): mái nón thò ra khỏi tường 0,16 tạo
    // đúng cái vành mũ nấm, còn thân thóp 0,74 thì thành cái cuống. Lều da thú thật là một khối
    // NÓN CAO liền mạch phủ gần sát đất, không có vành. Đây là lỗi HÌNH KHỐI, không phải lỗi màu:
    // đổi màu mái không cứu được một hình bóng đã sai.
    bodySides: 6, bodyTaper: 0.74, storyHeight: 0.62,
    massScale: 0.24, spread: 0.72,
    roof: 'cone', roofPitch: 0.95, eaves: 0.04,
    // Thời đồ đá thì nhà nào cũng là lều — công trình lớn khác ở KÍCH THƯỚC, không ở kiểu mái.
    vernacularRoof: 'cone',
    // đường mòn ĐẤT NỆN — thời đồ đá chưa có khái niệm lát đường
    roadMaterial: 'dirt', roadColor: '#8d7550',
    windows: 'none',
    motifs: ['boulder', 'firepit'],
    rough: 0.9,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  2: {
    name: 'vách đất & mái tranh',
    country: 'Ai Cập', landmark: 'làng ven sông Nin',
    signature: 'batter',
    roofColor: '#c5a159',   // mái tranh sông Nin — rơm khô rám nắng
    wallMaterial: 'mudbrick', roofMaterial: 'thatch',   // gạch bùn phơi nắng + mái lá cọ
    bodySides: 4, bodyTaper: 0.94, storyHeight: 0.66,
    massScale: 0.46, spread: 0.98,
    roof: 'cone', roofPitch: 0.72, eaves: 0.2,
    // Nhà làng ven sông Nin là gạch bùn MÁI BẰNG — người ta phơi đồ và ngủ trên nóc. Mái tranh
    // hình nón dành cho nhà kho/nhà chung, không phải nhà ở thường ngày.
    vernacularRoof: 'flat',
    // lối cát ven sông Nin, đất pha cát phơi nắng
    roadMaterial: 'dirt', roadColor: '#b9a173',
    windows: 'none',
    motifs: ['fence', 'granary'],
    rough: 0.62,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  3: {
    name: 'gạch bùn & giật cấp',
    country: 'Iraq', landmark: 'ziggurat thành Ur',
    signature: 'ziggurStair',
    roofColor: '#c59e79',   // gạch bùn phơi nắng thành Ur — nâu vàng, ẤM hẳn so với bê tông kỷ 13
    wallMaterial: 'mudbrick', roofMaterial: 'mudbrick',   // ziggurat không lợp — chính nó là gạch
    bodySides: 4, bodyTaper: 0.86, storyHeight: 0.6,
    massScale: 0.78, spread: 1.18,
    roof: 'stepped', roofPitch: 0.3, eaves: 0.06,
    // Giật cấp là hình dáng của ZIGGURAT — đền thờ. Nhà dân Lưỡng Hà là gạch bùn mái BẰNG quây
    // quanh sân trong. Cho cả phố giật cấp thì thành 30 cái ziggurat tí hon vây quanh ziggurat thật.
    vernacularRoof: 'flat',
    // đường rước lễ lát GẠCH nung GẮN BẰNG NHỰA ĐƯỜNG TỰ NHIÊN — con đường lát đầu tiên của loài
    // người, và Lưỡng Hà là nơi duy nhất thời đó có bitum lộ thiên (mỏ Hit). Vì thế nó ĐẬM hẳn so
    // với đường cát Ai Cập ngay kỷ trước, chứ không phải cùng một sắc đất nhạt hơn một chút.
    roadMaterial: 'mudbrick', roadColor: '#6b5745',
    windows: 'slit',
    motifs: ['pillar', 'ramp'],
    rough: 0.36,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  4: {
    name: 'mái chồng diềm cong',
    country: 'Trung Quốc', landmark: 'điện mái chồng, đấu củng',
    signature: 'dougong',
    roofColor: '#cf9e17',   // ngói lưu ly men VÀNG hoàng gia — màu chỉ hoàng cung mới được dùng
    wallMaterial: 'wood', roofMaterial: 'glazed',   // khung gỗ sơn son + ngói men BÓNG như sứ
    bodySides: 4, bodyTaper: 1, storyHeight: 0.68,
    massScale: 0.72, spread: 1.1,
    roof: 'tiered', roofPitch: 0.34, eaves: 0.34,
    // Mái CHỒNG nhiều tầng là đặc quyền của cung điện và chùa; luật nhà Thanh còn cấm dân thường
    // lợp kiểu đó. Nhà tứ hợp viện của dân là mái dốc hai phía, một tầng, lợp ngói.
    vernacularRoof: 'gable',
    // đường lát THANH THẠCH (青石) kinh thành, kẻ ô vuông vắn theo quy hoạch Chu Lễ. Tên gọi
    // "đá xanh" là mô tả đúng: loại granite này ngả LỤC-xám, khác hẳn granite ngả LAM của Paris.
    roadMaterial: 'stone', roadColor: '#82877e',
    windows: 'square',
    motifs: ['columns', 'banner'],
    rough: 0.22,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  5: {
    name: 'đá tảng & mái dốc đứng',
    country: 'Đức', landmark: 'lâu đài đá Burg Eltz',
    signature: 'turret',
    roofColor: '#586a89',   // đá phiến (slate) lâu đài sông Rhine — xám lam TRUNG
    wallMaterial: 'stone', roofMaterial: 'slate',   // đá tảng + đá phiến chẻ
    bodySides: 4, bodyTaper: 0.97, storyHeight: 0.72,
    massScale: 0.7, spread: 0.96,
    roof: 'gable', roofPitch: 0.92, eaves: 0.12,
    // Nhà phố Đức trung cổ cũng mái dốc đứng như lâu đài — khác ở bề thế, không ở kiểu mái.
    vernacularRoof: 'gable',
    // ngõ ĐÁ CUỘI trung cổ Đức — mặt lồi lõm, kẽ đá đầy bùn và rêu nên tổng thể ngả NÂU ẤM, không
    // phải xám sạch: ngõ trung cổ không có cống, mọi thứ đọng lại trên mặt đường.
    roadMaterial: 'stone', roadColor: '#7d7264',
    windows: 'slit',
    motifs: ['buttress', 'crenel'],
    rough: 0.44,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  6: {
    // ⚠️ Kỷ 6 (phong kiến Việt) và kỷ 4 (Tam Quốc) cùng họ kiến trúc mái chồng Á Đông — đúng về
    // lịch sử, nhưng test "15 kỷ phải phân biệt được" đã bắt đúng lúc hai kỷ này ra hình y hệt.
    // Hai nét tách chúng ra, đều có thật trong kiến trúc: nhà Việt có TƯỜNG THÓP nhẹ vào trong
    // (bodyTaper < 1) và lấy SÂN TRONG làm trung tâm bố cục, còn kiến trúc Hán lấy HÀNG CỘT và
    // cờ xí làm mặt tiền. Đổi thứ tự `motifs` là đổi cả chi tiết được dựng ở hạng `rare`.
    // Nay có thêm nét thứ ba tách hẳn: đình làng Việt BÈ NGANG hơn và THẤP hơn điện Hán.
    name: 'ngói âm dương & sân trong',
    country: 'Việt Nam', landmark: 'đình làng Bắc Bộ',
    signature: 'daoDinh',
    roofColor: '#844433',   // ngói âm dương Bắc Bộ — nâu đỏ ám rêu
    wallMaterial: 'wood', roofMaterial: 'tile',   // cột lim + ngói nung KHÔNG men (khác hẳn kỷ 4)
    bodySides: 4, bodyTaper: 0.92, storyHeight: 0.66,
    massScale: 0.68, spread: 1.16,
    roof: 'tiered', roofPitch: 0.4, eaves: 0.4,
    // Mái chồng diềm cong là của ĐÌNH/CHÙA. Nhà ba gian Bắc Bộ là mái dốc hai phía lợp ngói âm
    // dương, hiên thấp — cùng vật liệu, khác hẳn dáng. Giữ `eaves` lớn nên hiên vẫn thò ra kiểu Việt.
    vernacularRoof: 'gable',
    // đường GẠCH NGHIÊNG + đất ĐỎ laterite làng Bắc Bộ — đất miền Bắc ngả đỏ vì oxit sắt, và gạch
    // nghiêng lát sân đình cũng đỏ. Đây là mặt đường ĐỎ NHẤT cả 15 kỷ, và đó là sự thật về đất
    // Việt Nam chứ không phải một lựa chọn cho khác kỷ 5.
    roadMaterial: 'mudbrick', roadColor: '#a05c3c',
    windows: 'square',
    motifs: ['courtyard', 'banner', 'columns'],
    rough: 0.2,
    // ⚠️ TẦNG TRỆT. Mỗi con số ở đây trả lời đúng câu hỏi mà `country`/`landmark` đặt ra:
    // *"công trình có thật nào ở nước ấy trông như vậy?"*
    // `panel` = **cửa bức bàn** — bộ ván ghép tháo rời được từng tấm, cửa của CẢ đình làng lẫn nhà
    // ống phố cổ (nên nó không tách theo hạng, xem `groundFloor.js`). `steps: 2` vì **ngưỡng cửa
    // cao** là nét Việt ai cũng nhận ra: vào đình là BƯỚC QUA chứ không bước vào, và đình thì đứng
    // trên nền đá kê thật chứ không phải một cái bệ trang trí.
    // ⚠️ Đàm nêu "hiên trước có cột, mái đua thấp" — đó là HAI thứ thuộc HAI loại nhà, không phải
    // một thứ tả hai lần: đình có hàng hiên cột gỗ sâu (`porch`); nhà ống phố cổ mặt tiền chỉ rộng
    // ~3m, không đủ đất dựng hiên cột, nên chỉ có mái đua thấp che mặt hàng (`awning`).
    groundFloor: {
      note: 'đình làng Bắc Bộ — cửa bức bàn, ngưỡng cửa cao, hàng hiên cột gỗ; nhà ống phố cổ chỉ có mái đua thấp',
      door: 'panel', doorWidth: 0.34, doorTall: 0.62, frame: 'wood', recess: 0.35, steps: 2,
      feature: 'porch', vernacularFeature: 'awning',
    },
  },
  7: {
    // Kỷ Phục Hưng — đúng cái hình mẫu thẩm mỹ Đàm nhắc tới, và cũng đúng nước anh nêu làm ví dụ.
    name: 'vòm & cột & đối xứng',
    country: 'Ý', landmark: 'vòm Duomo Firenze',
    signature: 'campanile',
    roofColor: '#c5572b',   // ngói terracotta vòm Duomo — chi tiết NỔI TIẾNG NHẤT của nó
    wallMaterial: 'plaster', roofMaterial: 'tile',   // tường trát vôi Toscana + ngói terracotta
    bodySides: 4, bodyTaper: 1, storyHeight: 0.74,
    massScale: 0.74, spread: 1.02,
    roof: 'dome', roofPitch: 0.56, eaves: 0.22,
    // ⚠️ CA NẶNG NHẤT CỦA CẢ BẢNG, và là lý do trường này ra đời. Firenze có ĐÚNG MỘT mái vòm;
    // toàn bộ phần còn lại của thành phố là nhà phố mái ngói dốc thoải. Cho nhà dân đội vòm thì
    // Duomo — thứ đáng lẽ nhận ra được từ xa — chìm nghỉm giữa 25 bản sao tí hon của chính nó.
    vernacularRoof: 'gable',
    // ⚠️ ĐÁ **PIETRA SERENA** — SỬA MỘT LỖI ĐỌC SỬ, KHÔNG PHẢI CHỈNH MÀU CHO DỄ NHÌN. Bản trước
    // dùng `#9c8760` (pietraforte) và tự giải thích là "chính thứ đá dựng nên Palazzo Vecchio" —
    // câu ấy đúng, và chính nó là chỗ sai: pietraforte là đá XÂY TƯỜNG. Thứ người Firenze LÁT
    // ĐƯỜNG và lát quảng trường là *pietra serena*, sa thạch XÁM-XANH nguội (cũng là đá của mọi
    // đường gờ, cột, khung cửa Brunelleschi). Lấy đá xây tường làm màu mặt đường là đang mô tả
    // sai vật liệu, và nó gây hậu quả đo được: đá ấy CÙNG HỌ MÀU với nền đất ấm của kỷ 7, nên con
    // đường chỉ còn mỗi độ sáng để tách khỏi đất — mà độ sáng thì đang nằm đúng ở sàn 0,13. Đo
    // trên ảnh dựng (tắt bóng): khoảng cách đường↔đất chỉ 0,050 lúc 12h và **0,019 lúc 22h**,
    // dưới hẳn ngưỡng mắt 0,047. Kỷ 4 và kỷ 9 có sàn y hệt (0,135 · 0,131) mà ra 0,106–0,163 —
    // vì đá của chúng XÁM, khác họ màu với đất. Nói cách khác kỷ 7 dính đúng bệnh của cả Phase
    // 9D, thu nhỏ lại: một trục (độ sáng) phải gánh việc của hai (sáng + sắc).
    roadMaterial: 'stone', roadColor: '#8a8f8c',
    windows: 'arch',
    motifs: ['columns', 'arcade', 'statue'],
    rough: 0.06,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  8: {
    name: 'kho cảng & cột buồm',
    country: 'Bồ Đào Nha', landmark: 'bến cảng Lisboa',
    signature: 'belem',
    roofColor: '#ce8e64',   // ngói đỏ cam Lisboa — sáng và bạc màu hơn terracotta Ý
    wallMaterial: 'plaster', roofMaterial: 'tile',   // tường quét vôi ven cảng + ngói đỏ
    bodySides: 4, bodyTaper: 0.98, storyHeight: 0.7,
    massScale: 0.64, spread: 1.12,
    roof: 'gable', roofPitch: 0.52, eaves: 0.24,
    // Nhà phố Lisboa cũng mái ngói dốc như kho cảng — khác ở quy mô.
    vernacularRoof: 'gable',
    // calçada portuguesa — đá vôi TRẮNG khảm hoa văn, sáng nhất bảng
    roadMaterial: 'stone', roadColor: '#c9c3b4',
    windows: 'square',
    motifs: ['mast', 'crate'],
    rough: 0.3,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  9: {
    // Nước thứ hai Đàm nêu làm ví dụ. Tân cổ điển Pháp: fronton tam giác trên hàng cột.
    name: 'tân cổ điển & fronton',
    country: 'Pháp', landmark: 'điện Panthéon Paris',
    signature: 'portico',
    roofColor: '#9ea8b3',   // mái kẽm Paris — xám lam SÁNG, đặc sản mái nhà Paris
    wallMaterial: 'stone', roofMaterial: 'metal',   // đá vôi Lutèce + mái KẼM — kim loại thật
    bodySides: 4, bodyTaper: 1, storyHeight: 0.76,
    massScale: 0.92, spread: 1,
    roof: 'pyramid', roofPitch: 0.28, eaves: 0.26,
    // Chóp bốn mặt là mái của điện Panthéon. Nhà phố Haussmann là mái MANSARD — dốc đứng, lợp
    // kẽm, ngắt thành hai độ dốc. `gable` là cách gần nhất dựng được bằng bộ khối hiện có.
    vernacularRoof: 'gable',
    // pavé Paris — đá granite xám ngả LAM rõ, mặt đã mòn bóng vì xe ngựa
    roadMaterial: 'stone', roadColor: '#767f8a',
    windows: 'arch',
    motifs: ['columns', 'pediment', 'statue'],
    rough: 0.04,
    // ⚠️ TẦNG TRỆT. `double` = **porte cochère** — cửa hai cánh cao cho xe ngựa chui qua vào sân
    // trong; đây là bộ phận định nghĩa mặt tiền chung cư Haussmann, và `doorTall: 0.86` cao nhất
    // trong ba kỷ đã nghiên cứu chính vì lý do ấy (cửa phải lọt cả cỗ xe, không chỉ lọt người).
    // `frame: 'stone'` vì khuôn cửa là đá vôi cắt — cùng vật liệu tường (`wallMaterial: 'stone'`),
    // đúng cách Paris xây.
    // ⚠️ `feature` vs `vernacularFeature`: **ban công sắt uốn chạy LIỀN hết mặt tiền tầng hai** là
    // một điều khoản trong luật quy hoạch Haussmann, nên nó rộng bằng thân nhà chứ không rộng bằng
    // cái cửa. Nhà nhỏ mặt phố thì thứ nhận ra được lại là **persiennes** — cửa chớp gỗ mở áp vào
    // tường. Hai thứ này ngoài đời không đi cùng nhau ở cùng một hạng nhà ⇒ tách.
    groundFloor: {
      note: 'chung cư Haussmann Paris — porte cochère hai cánh cao khuôn đá, ban công sắt uốn liền tầng hai; nhà nhỏ có cửa chớp',
      door: 'double', doorWidth: 0.30, doorTall: 0.86, frame: 'stone', recess: 0.25, steps: 1,
      feature: 'balcony', vernacularFeature: 'shutters',
    },
  },
  10: {
    name: 'gạch nung & ống khói',
    country: 'Anh', landmark: 'nhà máy gạch đỏ Manchester',
    signature: 'stack',
    roofColor: '#40494f',   // đá phiến Wales lợp nhà máy — xám gần đen, TỐI nhất bảng
    wallMaterial: 'brick', roofMaterial: 'slate',   // gạch nung đỏ Manchester + đá phiến Wales
    bodySides: 4, bodyTaper: 1, storyHeight: 0.7,
    massScale: 0.9, spread: 1.16,
    roof: 'sawtooth', roofPitch: 0.3, eaves: 0.1,
    // Mái răng cưa là mái NHÀ MÁY (lấy sáng trời cho xưởng dệt). Nhà công nhân Manchester là dãy
    // nhà liền kề mái dốc lợp đá phiến — chính hình ảnh "terraced house" của cách mạng công nghiệp.
    vernacularRoof: 'gable',
    // đường gạch nung Manchester ÁM BỒ HÓNG — tối vì khói nhà máy
    roadMaterial: 'brick', roadColor: '#584f48',
    windows: 'grid',
    motifs: ['chimney', 'truss'],
    rough: 0.18,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  11: {
    name: 'mặt tiền đồ sộ mạ vàng',
    country: 'Mỹ', landmark: 'New York thời Mạ Vàng',
    signature: 'watertower',
    roofColor: '#3e9883',   // đồng oxy hoá (verdigris) — mái đồng New York thời Mạ Vàng
    wallMaterial: 'stone', roofMaterial: 'metal',   // đá granite mặt tiền + mái ĐỒNG đã hoá gỉ
    bodySides: 4, bodyTaper: 1, storyHeight: 0.8,
    massScale: 0.86, spread: 0.94,
    roof: 'stepped', roofPitch: 0.24, eaves: 0.2,
    // Giật cấp (setback) là luật quy hoạch dành cho CAO ỐC New York 1916. Nhà ở thường — chung cư
    // tenement, nhà brownstone — là mái BẰNG có gờ chắn, không giật cấp.
    vernacularRoof: 'flat',
    // NHỰA ĐƯỜNG (asphalt gốc dầu mỏ) New York + vỉa hè granite. Lạnh và gần đen — khác hẳn
    // macadam đá vôi ám bồ hóng ẤM của Manchester ngay kỷ trước, dù nhìn thoáng cả hai đều "tối".
    roadMaterial: 'concrete', roadColor: '#3a3b3e',
    windows: 'grid',
    motifs: ['columns', 'spire', 'statue'],
    rough: 0.03,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  12: {
    name: 'bê tông & lô cốt',
    country: 'Nga', landmark: 'lô cốt Stalingrad',
    signature: 'pillbox',
    roofColor: '#717b65',   // bê tông quân sự — xám ngả ô-liu
    wallMaterial: 'concrete', roofMaterial: 'concrete',   // bê tông đổ liền khối, không lợp gì
    bodySides: 4, bodyTaper: 0.96, storyHeight: 0.6,
    massScale: 1.02, spread: 1.1,
    roof: 'flat', roofPitch: 0.12, eaves: 0.14,
    // Khối nhà ở tập thể Xô-viết cũng mái bằng như lô cốt — khác ở bề dày tường, không ở mái.
    vernacularRoof: 'flat',
    // tấm BÊ TÔNG đúc sẵn kiểu quân sự Xô-viết, ngả ô-liu
    roadMaterial: 'concrete', roadColor: '#5e665c',
    windows: 'slit',
    motifs: ['bunker', 'crenel'],
    rough: 0.26,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  13: {
    // Nhật Bản thời Metabolism (thập niên 1960-70) là câu trả lời chính xác cho "khối bê tông lắp
    // ghép + ăng-ten": tháp nang Nakagin đúng là những viên hộp bê tông cắm quanh một lõi.
    name: 'khối bê tông & ăng-ten',
    country: 'Nhật Bản', landmark: 'tháp nang Nakagin',
    signature: 'capsule',
    roofColor: '#ccc9c7',   // bê tông đúc sẵn Nakagin — xám gần TRUNG TÍNH (tách khỏi gạch bùn kỷ 3)
    wallMaterial: 'concrete', roofMaterial: 'concrete',   // nang bê tông ĐÚC SẴN, mịn hơn kỷ 12
    bodySides: 4, bodyTaper: 1, storyHeight: 0.66,
    massScale: 1.24, spread: 0.92,
    roof: 'flat', roofPitch: 0.1, eaves: 0.08,
    // Chung cư Nhật thời Metabolism: mái bằng, giống tháp nang. Không đổi.
    vernacularRoof: 'flat',
    // asphalt Tokyo hậu chiến phẳng lì, kẻ vạch trắng — xám ngả lam, sẫm
    roadMaterial: 'concrete', roadColor: '#42474f',
    windows: 'grid',
    motifs: ['antenna', 'dish'],
    rough: 0.08,
    // ⚠️ TẦNG TRỆT. `recess: 0.85` là **hốc sâu nhất** trong ba kỷ đã nghiên cứu, và nó có tên
    // riêng: **genkan** — khoảng lùi vào có bậc, chỗ đổi giày, ranh giới trong/ngoài của mọi ngôi
    // nhà Nhật. `steps: 1` chính là cái bậc ấy. `sliding` = **cửa lùa** (hikido): hai tấm TRƯỢT
    // chồng mép, nên chúng nằm ở hai độ sâu khác nhau — đó mới là thứ phân biệt cửa lùa với cửa
    // hai cánh, không phải bề rộng.
    // ⚠️ Tách hạng: **biển hiệu dọc** (kanban) bám mặt tiền là thứ đọc ra "phố Nhật" ngay ở cỡ vài
    // chục điểm ảnh vì nó phá thế nằm ngang của mọi thứ khác; còn quán nhỏ thì treo **mành che**
    // (noren) rủ xuống trước cửa. Cả hai đều là Đàm nêu, và chúng thuộc hai cỡ công trình khác nhau.
    groundFloor: {
      note: 'phố Nhật — genkan lùi sâu có bậc đổi giày, cửa lùa hai tấm chồng mép, biển hiệu dọc; quán nhỏ treo mành che',
      door: 'sliding', doorWidth: 0.30, doorTall: 0.58, frame: 'wood', recess: 0.85, steps: 1,
      feature: 'sign', vernacularFeature: 'awning',
    },
  },
  14: {
    name: 'kính & cao tầng',
    country: 'Singapore', landmark: 'tháp kính Marina Bay',
    signature: 'skydeck',
    roofColor: '#4aa1b5',   // kính phản quang lam ngọc Marina Bay
    wallMaterial: 'glass', roofMaterial: 'glass',   // vách kính liền từ chân lên nóc
    bodySides: 4, bodyTaper: 1, storyHeight: 0.84,
    massScale: 1.36, spread: 0.8,
    roof: 'flat', roofPitch: 0.08, eaves: 0.05,
    // Cao ốc Singapore: mái bằng. Không đổi.
    vernacularRoof: 'flat',
    // đại lộ Singapore quy hoạch: bó vỉa và rãnh BÊ TÔNG SÁNG, mặt đường bạc đi dưới nắng xích đạo,
    // lại được rửa thường xuyên. Sáng hơn hẳn asphalt Tokyo kỷ trước — đây là chỗ Đàm đi qua và
    // thấy đường ĐỔI, nên hai kỷ liền nhau không được phép cùng một sắc.
    roadMaterial: 'concrete', roadColor: '#9aa0a6',
    windows: 'curtain',
    motifs: ['sign', 'solar'],
    rough: 0,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
  15: {
    name: 'khối lơ lửng & vòng sáng',
    country: 'UAE', landmark: 'Bảo tàng Tương Lai Dubai',
    signature: 'torus',
    roofColor: '#d0c295',   // thép mạ champagne + thư pháp vàng — Bảo tàng Tương Lai
    wallMaterial: 'glass', roofMaterial: 'metal',   // vỏ kính + vành THÉP MẠ champagne
    bodySides: 8, bodyTaper: 0.9, storyHeight: 0.8,
    massScale: 1.72, spread: 0.76,
    roof: 'blade', roofPitch: 0.16, eaves: 0.3,
    // Phiến lơ lửng là thủ pháp của một CÔNG TRÌNH BIỂU TƯỢNG. Nhà ở Dubai vẫn là mái bằng —
    // và giữ được sự tương phản đó mới thấy Bảo tàng Tương Lai lạ tới mức nào.
    vernacularRoof: 'flat',
    // asphalt mới + đá sáng chống nóng sa mạc Dubai
    roadMaterial: 'concrete', roadColor: '#b0a68e',
    windows: 'neon',
    motifs: ['halo', 'float'],
    rough: 0,
    // ⚠️ Bước 2 — chưa nghiên cứu tầng trệt của nước này. `legacy` = GIỮ NGUYÊN cửa cũ (xem
    // `LEGACY_DOOR` ở `groundFloor.js`), thay vì bịa vài con số cho đủ mâm rồi để người sau đọc
    // chúng như thể đã được cân nhắc.
    groundFloor: { note: 'chưa nghiên cứu tầng trệt — Bước 2', door: 'legacy', feature: 'none', vernacularFeature: 'none' },
  },
};

/**
 * Chiều cao phần mái nhô lên trên đỉnh tường, tính từ độ dốc của kỷ và mặt bằng khối.
 *
 * ⚠️ Ở ĐÂY VÌ NÓ PHẢI CÓ ĐÚNG MỘT CÔNG THỨC. `emitRoof` (`buildingSpec.js`) dùng con số này để dựng
 * mái; `signature.js` cũng cần nó để đặt những thứ NẰM TRÊN MÁI (bồn nước kỷ 11, sàn trời kỷ 14).
 * Hai bên tự tính lấy thì sớm muộn sẽ lệch nhau, và triệu chứng là một cái bồn nước lửng lơ giữa
 * không trung hoặc chôn nửa trong mái — đúng loại lỗi "một luật hai công thức" mà dự án này đã trả
 * giá nhiều lần (xem `CLAUDE.md`).
 */
export function roofRise(style, w, d) {
  const pitch = Number.isFinite(style?.roofPitch) ? style.roofPitch : 0.3;
  return Math.max(0.08, pitch) * Math.max(Number.isFinite(w) ? w : 1, Number.isFinite(d) ? d : 1);
}

/**
 * Diềm mái thò ra bao xa, ĐÃ KẸP THEO CỠ CÔNG TRÌNH.
 *
 * ⚠️ VÌ SAO PHẢI KẸP (2026-08-15, Phase 7C — và đây là LẦN THỨ HAI dự án gặp đúng lỗi này).
 * `eaves` trong bảng trên là một số TUYỆT ĐỐI, còn `rw = w + eaves * 2`. Với kỳ quan rộng ~1,4 thì
 * `eaves` 0,4 là một mái hiên sâu rất đẹp, thò ra 29% mỗi bên — đúng nét Á Đông. Với một căn nhà
 * dân rộng 0,56 thì vẫn con số 0,4 ấy thò ra **71% mỗi bên**, và mái rộng gấp 2,4 lần cái nhà nó
 * đậy. Trên màn hình đó không còn là mái hiên: đó là một cái ô, hoặc một cây nấm.
 *
 * Dự án đã trả giá cho đúng cơ chế này một lần rồi: kỷ 1 từng đọc ra thành CÂY NẤM và được vá bằng
 * cách hạ tay `eaves` xuống 0,04 (xem chú thích kỷ 1 ở trên). Đó là vá TRIỆU CHỨNG cho một kỷ; bệnh
 * gốc là "một số tuyệt đối áp lên những khối có kích thước chênh nhau nhiều lần", nên nó quay lại
 * ngay khi Phase 7C dựng 17–30 công trình nhỏ mỗi kỷ.
 *
 * Kẹp theo TỈ LỆ chữa tận gốc mà không phải chỉnh lại 15 con số đã cân trong bảng.
 *
 * ⚠️ VÀ NÓ CHẠM VÀO CẢ CÔNG TRÌNH CŨ — **115 trên 215 mảng nhà** của 75 bản vẽ chính, tức quá nửa.
 * Câu đầu tiên tôi viết ở chỗ này là *"kỳ quan đủ to nên cái kẹp không bao giờ chạm tới chúng"*;
 * nghe rất xuôi tai và **sai hẳn**, chỉ lộ ra khi đem đếm. (Nó còn tự mâu thuẫn với chính câu sau
 * đó trong cùng đoạn — dấu hiệu kinh điển của một câu viết ra để tự trấn an.)
 * Vì sao chạm nhiều đến thế: một kỳ quan KHÔNG phải một khối to duy nhất, nó là 3–7 mảng, và các
 * mảng phụ — tháp góc, chái, gian thờ — nhỏ ngang nhà dân (kỷ 2 có mảng 0,29×0,29 đội `eaves` 0,2,
 * tức thò ra 69% mỗi bên). Nghĩa là những cái "ô che nắng" ấy đã đứng sẵn trong thành phố của Đàm
 * từ lâu; Phase 7C không tạo ra chúng, chỉ làm chúng nhiều lên tới mức không thể không thấy.
 * ⇒ Đây là một thay đổi MỸ THUẬT có ảnh hưởng tới công trình đã xây. Nó KHÔNG phạm ADR-007: lời
 * hứa ở đó là "cùng một `bpId` luôn cho ra cùng một hình" (cấm ngẫu nhiên), không phải "hình dáng
 * không bao giờ được sửa" — Phase 5B đã đổi chiều cao toàn bộ 75 công trình theo đúng tinh thần này.
 *
 * 0,28 chọn bằng đo, không bằng cảm giác: mái rộng nhất còn gấp 1,41 lần thân nhà (kỷ 6, trước khi
 * kẹp là 2,38 lần), tức vẫn còn hiên sâu để nhận ra kiến trúc Á Đông mà không nuốt mất bức tường.
 */
export const EAVE_MAX_RATIO = 0.28;

export function eaveOverhang(style, w, d) {
  const raw = Number.isFinite(style?.eaves) ? style.eaves : 0.2;
  const sw = Number.isFinite(w) ? w : 1;
  const sd = Number.isFinite(d) ? d : 1;
  return Math.min(raw, Math.min(sw, sd) * EAVE_MAX_RATIO);
}

/** Kỷ mặc định khi gặp số kỷ lạ (dữ liệu hỏng từ cloud) — thà ra một căn nhà thường còn hơn nổ. */
const DEFAULT_ERA = 2;

/**
 * Tra ngữ pháp của một kỷ. Luôn trả về một bộ tham số dùng được, không bao giờ `undefined`:
 * màn hình Thành Phố phải dựng được kể cả khi state bị hỏng.
 */
export function getEraStyle(era) {
  const key = Number.isFinite(era) ? Math.round(era) : DEFAULT_ERA;
  return ERA_STYLES[key] ?? ERA_STYLES[DEFAULT_ERA];
}

/**
 * Ngữ pháp của kỷ, ở phiên bản dành cho NHÀ THƯỜNG: y hệt bản gốc, chỉ thay mái kỳ đài bằng mái
 * nhà dân (xem chú thích `vernacularRoof` ở đầu file).
 *
 * ⚠️ TRẢ VỀ MỘT BỘ THAM SỐ ĐẦY ĐỦ chứ không phải một mình chuỗi tên mái, và đó là điểm quan trọng
 * nhất của hàm này. `buildingSpec.js` đọc `style.roof` ở nhiều chỗ khác nhau — dựng mái, tính
 * `roofRise` để biết đặt chi tiết trên nóc ở đâu, quyết định mái có xoay không. Nếu chỉ thay mái ở
 * MỘT trong số đó thì một nửa công trình sẽ dựng theo mái vòm còn nửa kia theo mái dốc, tức đúng
 * cái bẫy "một luật hai công thức" mà dự án đã trả giá nhiều lần. Thay ở NGUỒN thì mọi chỗ đọc
 * sau đó tự khớp, không cần ai nhớ gì.
 *
 * Kỷ khai `vernacularRoof` trùng `roof` thì trả về CHÍNH đối tượng cũ — vừa đỡ rác, vừa để phép so
 * sánh tham chiếu trong test nói được "kỷ này cố ý không đổi".
 */
export function getVernacularStyle(era) {
  const style = getEraStyle(era);
  if (!style.vernacularRoof || style.vernacularRoof === style.roof) return style;
  return { ...style, roof: style.vernacularRoof };
}

/**
 * Bảng tầng trệt của một kỷ — cửa ra vào + MỘT đặc trưng mặt phố.
 *
 * ⚠️ KHÔNG CÓ ĐƯỜNG RƠI VỀ MẶC ĐỊNH, và đó là chủ đích. `getEraStyle` đã lo phần "kỷ lạ thì tra ra
 * cái gì" (nó trả về kỷ mặc định), nên hàm này chỉ việc đọc trường bắt buộc. Nếu một ngày có kỷ
 * nào thiếu trường `groundFloor`, người viết sẽ gặp `undefined` ngay ở chỗ dựng chứ không nhận về
 * một cái cửa mặc định trông "cũng được" — đúng lý do `vernacularRoof` được làm thành trường bắt
 * buộc ở Phase 7C. `eraStyle.test.js` khoá đủ 15 kỷ.
 */
export function getGroundFloor(era) {
  return getEraStyle(era).groundFloor;
}
