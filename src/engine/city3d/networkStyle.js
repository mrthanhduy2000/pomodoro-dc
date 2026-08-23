/**
 * networkStyle.js — 15 KỶ, 15 KIỂU QUY HOẠCH. Bảng này trả lời một câu mà chưa file nào trong dự
 * án trả lời: **"con đường ở nước ấy, thời ấy, có THẲNG không?"**
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY — MỘT TRỤC BẢN SẮC CHƯA BAO GIỜ TỒN TẠI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm: *"đường đi hiện tại chỉ là những đường thẳng, không giống đường ngoài đời, không uốn cong,
 * và nó cũng như quy hoạch quá — các thời trước làm gì có quy hoạch đường thẳng tấp thế"*.
 *
 * Lời ấy đúng từng chữ, và nó chỉ vào một chỗ trống trong kiến trúc chứ không phải một con số sai.
 * `streetStyle.js` (Phase 9D) đã mở mười trục cho **MẶT CẮT NGANG** của con đường — rộng bao nhiêu,
 * lát bằng gì, viên to cỡ nào, có bó vỉa không. Nhưng cả mười trục ấy nói về *một lát cắt*, và một
 * lát cắt thì không có hình dạng theo chiều dọc. **TIM ĐƯỜNG** — cái đường tâm chạy dọc con phố —
 * chưa bao giờ là một trục bản sắc: `terrainMesh.js` vẽ mọi lòng đường **chính giữa ô lưới**, nên
 * Göbekli Tepe 9500 năm trước và Dubai hôm nay dùng **cùng một tấm lưới bàn cờ hoàn hảo**.
 *
 * Đó là lý do 15 kỷ nhìn vào đâu cũng thấy "quy hoạch": không phải vì mạng đường được quy hoạch,
 * mà vì **mã dựng hình không có cách nào diễn đạt một con đường KHÔNG thẳng**.
 *
 * ⚠️ VÀ ĐÂY LÀ MỘT LỖI LỊCH SỬ, KHÔNG CHỈ LÀ MỘT LỖI MỸ THUẬT. Quy hoạch lưới vuông góc là một
 * phát minh có ngày tháng và có địa chỉ — Hippodamus xứ Miletus (thế kỷ 5 TCN), rồi trại quân La
 * Mã, rồi Chang'an nhà Đường, rồi Commissioners' Plan 1811 của Manhattan. Áp nó cho một làng đồ đá
 * mới là nói ngược lịch sử đúng kiểu mà `streetStyle.js` đã cấm khi nó cấm vạch kẻ ở kỷ đồ đá.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ CÁI TRẦN ĐÃ ĐO TRƯỚC KHI VIẾT MỘT DÒNG MÃ NÀO — VÌ SAO KHÔNG "THÊM Ô ĐƯỜNG"
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm cũng nói *"hiện tại ít đường quá"* và *"mở rộng đường đi"*. Luật của dự án bắt **đo trần
 * trước khi tiêu ngân sách cho một phase nội dung**, và phép đo ấy bác bỏ thẳng cơ chế THÊM Ô:
 *
 *   | thứ | số ô | phần của lưới 144 |
 *   |---|---:|---:|
 *   | ô đường hiện có          | 80 | 55,6% |
 *   | ô đã hứa cho kỳ quan     | 45 | (11 ô chồng lên đường) |
 *   | **ô còn trống**          | **30** | **20,8%** |
 *
 * Và đúng 30 ô trống ấy là **toàn bộ nhà dân của thành phố** (`DWELLING_PLOTS`). Nghĩa là mỗi ô
 * đường thêm vào là một khu nhà bị xoá — đây chính xác cái trần mà Phase 14 §1(3) đã đụng khi Đàm
 * đòi "thêm nhà", và câu trả lời khi ấy vẫn đúng nguyên cho lần này:
 *
 *   ⇒ **KHÔNG thêm ô. Đổi thứ NẰM TRONG một ô.**
 *
 * Một ô đường hiện dựng ra một dải thẳng nằm chính giữa. Nó có thể dựng ra một con đường LƯỢN, có
 * chỗ thắt chỗ phình — cùng số ô, cùng số lệnh vẽ, mà mắt đọc ra một thứ khác hẳn.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ HÌNH HỌC TỰ NÓ ÉP ĐÚNG LỊCH SỬ — VÀ ĐÂY LÀ PHẦN ĐẸP NHẤT CỦA BẢN THIẾT KẾ NÀY
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Một con đường chỉ lượn được trong phần ô mà chính nó chưa chiếm: `chỗ trống = 0,5 − nửa bề rộng
 * − vỉa hè`. Nên **đường càng rộng thì càng KHÔNG THỂ lượn**, không phải vì ai đó chọn thế mà vì
 * hết chỗ. Đối chiếu với lịch sử thì nó khớp một cách gần như đáng ngờ:
 *
 *   · kỷ 1 (lối mòn Göbekli Tepe, rộng 0,46 ô) → còn 0,27 ô để lượn — lượn thoải mái.
 *   · kỷ 12 & 15 (đại lộ Xô Viết / sa mạc, rộng 0,96 ô) → còn 0,02 ô — thẳng băng, không cãi được.
 *
 * ⇒ Bảng dưới đây **không cần** ép kỷ hiện đại phải thẳng; hình học đã ép sẵn. Cột `bend` chỉ nói
 * *"trong phần chỗ trống mà kỷ này có, nó dùng bao nhiêu"*.
 *
 * ⚠️ VÌ VẬY `bend` LÀ MỘT TỈ LỆ (0..1), KHÔNG PHẢI MỘT SỐ Ô. Đây là bài học Phase 7D áp ngay từ
 * lúc thiết kế thay vì sau khi trả giá: một lời hứa nói về QUAN HỆ ("lượn nhiều hơn đường kia")
 * thì phải viết thành một con số quan hệ. Khai `bend: 0,25 ô` sẽ chết trong im lặng đúng ngày có
 * ai chỉnh `avenue` của kỷ ấy — mà `avenue` đã bị chỉnh ở Phase 9D, 12 và 14.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * BA LỚP, LẦN THỨ MƯỜI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Cùng khuôn đã dùng cho `vernacularRoof` · `floraStyle` · `streetStyle` · `groundFloorStyle` ·
 * `roofStyle` · `settingStyle` · `hinterlandStyle` · `blockStyle` · `humanStyle`:
 *
 *   BẢNG (file này)  →  HÌNH (`roadPath.js`)  →  NGƯỜI ĐỌC (`terrainMesh.js`, `residents.js`)
 *
 * Mỗi dòng phải trả lời được *"đường phố ở nước ấy, thời ấy, do CÁI GÌ quyết định hình dạng?"* —
 * và `country` bị KHOÁ CỨNG vào `eraStyle.js` bằng test. Không có ràng buộc ấy thì 15 dòng là 15
 * lần chọn bừa, mà chọn bừa chính là thứ đã sinh ra 15 kỷ đường giống hệt nhau.
 *
 * ⚠️ `isValidNetworkStyle` **TỪ CHỐI THẲNG** dòng sai, KHÔNG tự chữa — đúng bẫy `MIN_STONE`
 * (Phase 9D) và ADR-026: tự chữa là cách một bảng 15 dòng lặng lẽ thoái hoá về 1 dòng.
 */

/**
 * NĂM KIỂU LƯỢN mà `roadPath.js` dựng được. Mỗi giá trị phải được ÍT NHẤT MỘT kỷ dùng — có test
 * đếm, vì một giá trị không kỷ nào dùng là một nhánh mã chưa bao giờ chạy (bài học "trục CHẾT",
 * Phase 11), và nó sẽ hỏng trong im lặng vào ngày đầu tiên có người khai nó.
 *
 * `grid`     — THẲNG. Quy hoạch bàn cờ có chủ ý: Chang'an nhà Đường, Commissioners' Plan 1811 của
 *              Manhattan, Jackson Plan 1822 của Singapore, siêu đô thị Xô Viết. Đây KHÔNG phải
 *              "chưa làm gì" — nó là một tuyên bố quyền lực, và nó đắt: Manhattan phải san phẳng
 *              cả một địa hình đồi để có được nó.
 * `axial`    — MỘT CUNG DÀI DUY NHẤT. Đường nghi lễ: thẳng về ý đồ nhưng cong nhẹ theo địa thế vì
 *              nó có trước máy trắc địa. Đường rước thành Ur, làng thợ Deir el-Medina, trục sa mạc.
 * `organic`  — LƯỢN TỰ DO, nhiều tần số chồng nhau. Đường không ai vẽ cả: nó là vệt chân người và
 *              súc vật đi mòn, rồi nhà xây bám theo. Trung cổ Đức, phố cổ Hà Nội, Edo, Firenze.
 * `terrace`  — GẤP KHÚC NGẮN RỒI GIỮ. Phố bám đường đồng mức trên sườn dốc: đi ngang một đoạn, rẽ,
 *              rồi lại đi ngang. Alfama (Lisbon) và phố công nghiệp Anh trên đồi Pennine.
 * `radial`   — LỆCH TĂNG DẦN THEO KHOẢNG CÁCH TỚI TÂM. Đại lộ toả ra từ quảng trường, đúng thứ
 *              Haussmann chọc xuyên qua Paris trung cổ: càng ra xa tâm càng doãng khỏi trục lưới.
 */
export const PLAN_KINDS = ['grid', 'axial', 'organic', 'terrace', 'radial'];

const PLAN_SET = new Set(PLAN_KINDS);

/**
 * BỐN TRỤC BẢN SẮC. Đọc kỹ trước khi chỉnh — hai trục đầu trông giống nhau nhưng trả lời hai câu
 * khác hẳn, và trộn chúng lại chính là cái bẫy "một trường gánh hai việc" đã cắn dự án này BẢY lần
 * (`storyHeight` · `roof` · bảng loài cây · `avenue` · vai màu `cloth2` · `eaves` · hồ sơ khuôn).
 *
 * `plan`   — KIỂU lượn (danh sách trên). Trả lời *"hình dạng con đường do cái gì quyết định?"*
 * `bend`   — BIÊN ĐỘ lượn, tính theo PHẦN CHỖ TRỐNG còn lại trong ô (0..1). Trả lời *"lượn xa
 *            khỏi tim ô bao nhiêu?"* 0 = thẳng tuyệt đối.
 * `coil`   — BƯỚC SÓNG, tính bằng SỐ Ô cho một chu kỳ lượn đầy đủ. Trả lời *"lượn DÀY hay THƯA?"*
 *            Nhỏ = ngoằn ngoèo gấp khúc (ngõ trung cổ); lớn = một cung dài thoải (đại lộ).
 *            ⚠️ TÁCH KHỎI `bend` VÌ CHÚNG ĐỘC LẬP NGOÀI ĐỜI: một con đèo có biên độ rất lớn mà
 *            bước sóng cũng rất dài (cung thoải), còn một ngõ trung cổ thì biên độ nhỏ mà bước
 *            sóng ngắn (gấp khúc liên tục). Gộp làm một là mất đúng sự phân biệt ấy.
 * `ragged` — BIÊN ĐỘ THAY ĐỔI BỀ RỘNG dọc con đường (0..1). Trả lời *"đường có chỗ thắt chỗ phình
 *            không?"* Đây là trục thứ hai của "tự nhiên", và nó độc lập với ba trục trên: một con
 *            đường có thể thẳng băng mà bề rộng lộn xộn (đường đất bị xe cày), hoặc lượn rất đẹp
 *            mà bề rộng đều tăm tắp (đại lộ Haussmann uốn quanh một quảng trường).
 */
export const NETWORK_STYLES = {
  1: {
    country: 'Thổ Nhĩ Kỳ',
    // ⚠️ KỶ DUY NHẤT KHÔNG HỀ CÓ KHÁI NIỆM "ĐƯỜNG", VÀ ĐÓ LÀ SỰ THẬT KHẢO CỔ NỔI TIẾNG NHẤT VỀ NÓ.
    // Çatalhöyük (7100 TCN) không có một con phố nào: nhà xây dính liền nhau thành một khối, cửa
    // trổ trên MÁI, người ta đi lại TRÊN NÓC NHÀ và tụt xuống bằng thang. Göbekli Tepe thì chỉ có
    // vệt mòn giữa các vòng cột. Vậy nên đây phải là kỷ lượn nhiều nhất bảng — một vệt chân người
    // đi mòn thì không có lý do gì để thẳng, và nó cũng chẳng có ai để mà thẳng cho.
    note: 'Çatalhöyük/Göbekli Tepe — chưa có "đường": vệt chân người mòn giữa các lều, đi cả trên mái',
    plan: 'organic', bend: 1.00, coil: 3.2, ragged: 0.85,
  },
  2: {
    country: 'Ai Cập',
    // ⚠️ NGƯỢC HẲN KỶ 1, VÀ ĐÂY LÀ CHỖ DỄ ĐOÁN SAI NHẤT CẢ BẢNG: "cổ hơn ⇒ lộn xộn hơn" là SAI.
    // Deir el-Medina (làng thợ xây lăng mộ, ~1500 TCN) là một trong những khu định cư CÓ QUY HOẠCH
    // sớm nhất từng đào được: một con phố thẳng duy nhất chạy giữa, nhà xếp thành hai dãy đều nhau
    // hai bên, cả làng bọc trong một bức tường. Nó do NHÀ NƯỚC dựng cho công nhân, nên nó thẳng.
    // Vẫn `axial` chứ không `grid` vì nó chỉ có MỘT trục, không phải một tấm lưới.
    note: 'Deir el-Medina — làng thợ do nhà nước dựng: một phố thẳng duy nhất, hai dãy nhà đều nhau',
    plan: 'axial', bend: 0.30, coil: 11.0, ragged: 0.20,
  },
  3: {
    country: 'Iraq',
    // Ur có HAI hình thái sống cạnh nhau, và đó chính là điều đáng kể: đường rước (Processional
    // Way) rộng và thẳng phục vụ nghi lễ, còn khu ở (khu AH mà Woolley đào) là một mê cung ngõ hẹp
    // ngoằn ngoèo không theo trục nào. `ragged` cao là cách bảng này kể lại sự tương phản ấy —
    // cùng một con đường mà chỗ mở ra thành sân, chỗ thắt lại chỉ lọt một con lừa.
    note: 'thành Ur — đường rước thẳng cho kiệu thần, nhưng khu ở là mê cung ngõ hẹp ngoằn ngoèo',
    plan: 'axial', bend: 0.55, coil: 8.0, ragged: 0.62,
  },
  4: {
    country: 'Trung Quốc',
    // ⚠️ THẲNG TUYỆT ĐỐI — 0,00, VÀ ĐÂY LÀ MỘT TRONG HAI KỶ DUY NHẤT ĐƯỢC PHÉP KHAI SỐ 0.
    // Chang'an đời Đường là thành phố quy hoạch nghiêm ngặt nhất từng tồn tại trước thời hiện đại:
    // 108 phường có tường bao riêng, 9 đại lộ bắc-nam và 12 đại lộ đông-tây, tất cả vuông góc tuyệt
    // đối, đại lộ Chu Tước rộng 150m chạy thẳng từ cổng nam tới hoàng thành. Nó là một tuyên ngôn
    // vũ trụ quan (thành phố là hình ảnh của trật tự trời đất), không phải một tiện ích giao thông.
    // Cho nó lượn dù chỉ một chút là nói dối về chính điều làm nó nổi tiếng.
    note: 'Chang\'an nhà Đường — 108 phường có tường bao, lưới vuông góc tuyệt đối, đại lộ Chu Tước rộng 150m',
    plan: 'grid', bend: 0.00, coil: 12.0, ragged: 0.08,
  },
  5: {
    country: 'Đức',
    // ⚠️ LƯỢN GẤP NHẤT BẢNG (`coil` 2,6 — bước sóng ngắn nhất). Phố trung cổ Đức không do ai vẽ:
    // nó mọc từ đường mòn dẫn tới chợ, rồi nhà bám theo ranh giới thửa đất, rồi thửa đất bám theo
    // địa hình. Kết quả là những con ngõ đổi hướng vài mét một lần — thứ mà khách du lịch gọi là
    // "quyến rũ" và người đánh xe ngựa gọi là địa ngục. Biên độ KHÔNG phải cao nhất bảng (kỷ 1 mới
    // cao nhất) nhưng TẦN SỐ thì có: đó đúng là sự khác nhau giữa "vệt mòn giữa đồng" và "ngõ phố".
    note: 'phố cổ trung cổ — ngõ mọc theo ranh thửa đất và đường ra chợ, đổi hướng vài mét một lần',
    plan: 'organic', bend: 0.86, coil: 2.6, ragged: 0.70,
  },
  6: {
    country: 'Việt Nam',
    // "36 phố phường" mọc trên nền các làng nghề ven sông Tô Lịch và bám theo đê — tức hình dạng
    // của nó do MẶT NƯỚC quyết định, không do người vẽ. Hàng Bạc, Hàng Đào, Hàng Buồm đều cong
    // theo dòng chảy cũ. Bước sóng dài hơn kỷ 5 vì một khúc sông thì lượn thoải hơn một ranh thửa.
    note: 'phố cổ Hà Nội — phố bám theo đê và dòng sông Tô Lịch cũ, cong theo dòng nước chứ không theo trục',
    plan: 'organic', bend: 0.82, coil: 4.4, ragged: 0.55,
  },
  7: {
    country: 'Ý',
    // ⚠️ KỶ CHỒNG BA LỚP, NÊN NÓ PHẢI Ở GIỮA BẢNG CHỨ KHÔNG Ở ĐẦU NÀO. Firenze là trại quân La Mã
    // (lưới vuông) → bị lấp đầy bằng ngõ trung cổ (lượn) → rồi Phục Hưng chọc vài trục thẳng qua.
    // Ba lớp ấy còn nguyên trên bản đồ hôm nay. Biên độ vừa phải là cách duy nhất trung thực để kể
    // một thành phố vừa có lưới vừa không.
    note: 'Firenze — lưới trại quân La Mã bị ngõ trung cổ lấp đầy, rồi Phục Hưng chọc trục thẳng qua',
    plan: 'organic', bend: 0.72, coil: 5.5, ragged: 0.44,
  },
  8: {
    country: 'Bồ Đào Nha',
    // ⚠️ KỶ NÀY LÀ **TRƯỚC** ĐỘNG ĐẤT 1755, NÊN NÓ KHÔNG ĐƯỢC LÀ LƯỚI. Đây là chỗ rất dễ sai: cái
    // lưới Pombaline nổi tiếng của Lisbon chỉ ra đời SAU khi động đất san phẳng thành phố. Kỷ 8 là
    // thời Manueline (Đại Hàng Hải, ~1500), tức Lisbon của Alfama: phố leo sườn đồi dốc đứng, bám
    // đường đồng mức, đi ngang một đoạn rồi bẻ góc rồi lại đi ngang. Đó đúng định nghĩa `terrace`.
    note: 'Alfama trước động đất 1755 — phố leo sườn đồi theo đường đồng mức, đi ngang rồi bẻ góc',
    plan: 'terrace', bend: 0.85, coil: 3.6, ragged: 0.50,
  },
  9: {
    country: 'Pháp',
    // ⚠️ KỶ DUY NHẤT DÙNG `radial`, VÀ NÓ LÀ LÝ DO KIỂU LƯỢN ẤY TỒN TẠI. Haussmann (1853–70) không
    // nắn phố cũ cho thẳng — ông CHỌC những đại lộ mới xuyên qua thành phố trung cổ, toả ra từ các
    // quảng trường tròn (Étoile có 12 đại lộ toả ra). Nên đặc trưng của nó không phải "cong" mà là
    // "doãng khỏi trục lưới, càng ra xa tâm càng doãng". Bước sóng dài nhất bảng: một đại lộ
    // Haussmann chạy hàng cây số mà không đổi hướng một lần nào.
    note: 'Paris Haussmann — đại lộ chọc xuyên phố trung cổ, toả ra từ quảng trường tròn (Étoile: 12 nhánh)',
    plan: 'radial', bend: 0.52, coil: 12.0, ragged: 0.16,
  },
  10: {
    country: 'Anh',
    // Phố công nghiệp Manchester/Leeds: nhà liền dãy back-to-back dựng hàng loạt bởi tư nhân, mỗi
    // chủ đất một mảnh, nên các dãy khớp nhau rất tệ ở chỗ giáp ranh — thẳng trong từng đoạn ngắn
    // rồi lệch hẳn ở ranh thửa. Đó là `terrace` theo đúng cả hai nghĩa của từ (thềm dốc, và nhà
    // liền dãy). Biên độ thấp hơn Lisbon vì đồi Pennine thoải hơn sườn Alfama nhiều.
    note: 'phố công nghiệp — dãy nhà back-to-back do nhiều chủ đất dựng, khớp lệch nhau ở ranh thửa',
    plan: 'terrace', bend: 0.48, coil: 4.8, ragged: 0.40,
  },
  11: {
    country: 'Mỹ',
    // ⚠️ KỶ THỨ HAI VÀ CUỐI CÙNG ĐƯỢC KHAI `bend: 0`. Commissioners' Plan 1811 chia Manhattan
    // thành 12 đại lộ × 155 phố cắt vuông góc, và để làm được điều đó người ta đã BẠT PHẲNG cả một
    // địa hình đồi đá — tức cái lưới này thắng địa hình chứ không nhượng bộ nó. `ragged` thấp nhất
    // bảng cùng kỷ 12: bê tông đổ khuôn thì không có chỗ thắt chỗ phình.
    note: 'Manhattan — Commissioners\' Plan 1811: 12 đại lộ × 155 phố vuông góc, bạt phẳng cả đồi đá để có lưới',
    plan: 'grid', bend: 0.00, coil: 12.0, ragged: 0.06,
  },
  12: {
    country: 'Nga',
    // Quy hoạch Xô Viết: siêu ô phố (mikrorayon) với vài đại lộ rất rộng thay vì nhiều phố nhỏ —
    // đại lộ để duyệt binh, không để đi lại. Thẳng vì nó là công cụ của nhà nước, y hệt Chang'an,
    // chỉ khác động cơ. ⚠️ Nhưng KHÔNG khai 0: khai `grid` với một chút biên độ để nó vẫn phân biệt
    // được với kỷ 4 và 11 nếu ngày nào `avenue` của nó hẹp lại. Hình học hiện đã ép nó gần như
    // thẳng rồi (đại lộ rộng 0,96 ô ⇒ chỉ còn 0,02 ô chỗ trống), nên con số này gần như chỉ là
    // một lời khai về Ý ĐỊNH, và đó là chủ đích.
    note: 'siêu ô phố Xô Viết — vài đại lộ rất rộng để duyệt binh thay cho nhiều phố nhỏ',
    plan: 'grid', bend: 0.12, coil: 10.0, ragged: 0.06,
  },
  13: {
    country: 'Nhật Bản',
    // ⚠️ DÒNG NÀY TỪNG VIẾT SAI THỜI, VÀ CÁCH BẮT ĐƯỢC ĐÁNG GHI LẠI. Bản đầu tôi ghi "Edo
    // jōkamachi — phố quanh lâu đài cố ý ngoằn ngoèo để chặn quân địch". Câu ấy đúng về lịch sử
    // Nhật Bản và SAI về kỷ này: `eraStyle.js` khai landmark của kỷ 13 là **tháp nang Nakagin**
    // (Tokyo 1972), còn `streetStyle.js` khai `paving: 'asphalt'` với vạch sang đường — tức đây là
    // Nhật Bản HIỆN ĐẠI, cách Edo hơn một thế kỷ. Ba bảng cùng nói về một kỷ mà tôi suýt để chúng
    // kể ba câu chuyện khác nhau (đúng bài học ADR-045: *hai bảng nói về cùng một sự thật vật lý
    // mà chưa bao giờ được đặt cạnh nhau*).
    //
    // Sửa cho đúng thời thì kết luận KHÔNG đổi, chỉ có lý do đổi — và lý do mới còn hay hơn: Tokyo
    // hiện đại vẫn là một trong những mạng đường ít quy hoạch nhất trong các đô thị lớn, vì bản đồ
    // án tái thiết Ishikawa sau 1945 gần như bị bỏ, nên thành phố mọc lại TRÊN ĐÚNG ranh thửa cũ
    // của Edo. Phố hẹp, cong, phần lớn không có tên (địa chỉ đánh theo ô phố chứ không theo phố).
    note: 'Tokyo hiện đại — dựng lại trên đúng ranh thửa Edo sau 1945, phố hẹp và cong, phần lớn không tên',
    plan: 'organic', bend: 0.92, coil: 3.0, ragged: 0.58,
  },
  14: {
    country: 'Singapore',
    // Jackson Plan 1822 (Raffles) chia thành phố thành các khu sắc tộc trên một lưới vuông rất
    // nghiêm. Hiện đại thì thêm đường cao tốc chạy cong theo địa hình đảo. Biên độ nhỏ nhưng KHÁC 0
    // vì đảo Singapore có đồi và bờ biển, còn Manhattan thì đã bị bạt phẳng — hai kiểu "lưới" khác
    // nhau ở đúng chỗ ấy.
    note: 'Jackson Plan 1822 — lưới khu sắc tộc rất nghiêm, nay thêm cao tốc uốn theo bờ đảo',
    plan: 'grid', bend: 0.18, coil: 9.0, ragged: 0.12,
  },
  15: {
    country: 'UAE',
    // Trục sa mạc: Sheikh Zayed Road chạy thẳng hàng chục cây số song song bờ biển, siêu ô phố hai
    // bên. `axial` chứ không `grid` vì Dubai không có lưới — nó có MỘT trục xương sống và mọi thứ
    // treo vào đó. Biên độ nhỏ, bước sóng rất dài: một đại lộ sa mạc có uốn thì cũng uốn cả cây số.
    note: 'trục Sheikh Zayed — một xương sống thẳng chạy song song bờ biển, siêu ô phố treo hai bên',
    plan: 'axial', bend: 0.22, coil: 12.0, ragged: 0.10,
  },
};

/**
 * ⚠️ HAI CÁI TRẦN, VÀ CẢ HAI LÀ SỰ THẬT VỀ MẮT CHỨ KHÔNG PHẢI SỞ THÍCH.
 *
 * `MAX_COIL` — bước sóng dài hơn cả bề ngang lưới (12 ô) thì con đường chỉ còn thấy được một phần
 * của một chu kỳ, tức nó đọc ra là một đường THẲNG HƠI XIÊN, không phải một đường cong. Khai 40 và
 * khai 12 cho ra cùng một thứ trên màn hình ⇒ mọi giá trị trên 12 là một trục CHẾT. Chặn thẳng,
 * đúng bài học `MIN_STONE`: thà bắt bảng khai một giá trị dựng ra được còn hơn để cái kẹp âm thầm
 * nuốt cả một trục.
 *
 * `MIN_COIL` — bước sóng ngắn hơn 2 ô thì con đường đổi hướng nhanh hơn mật độ ô lưới lấy mẫu
 * được (Nyquist). Kết quả không phải "lượn gấp hơn" mà là RĂNG CƯA ngẫu nhiên — mua nhiễu bằng
 * tiền tam giác, đúng cái bẫy "không noisy" mà `MIN_STONE` đã nhốt một lần.
 */
export const MIN_COIL = 2.0;
export const MAX_COIL = 12.0;

/**
 * ⚠️ SỐ KỶ ĐƯỢC PHÉP KHAI `bend: 0` — MỘT CON SỐ TRONG BÀI TEST LÀ CÁI HẸN GIỜ DUY NHẤT CHẠY ĐƯỢC.
 * Thẳng tuyệt đối là một lời khai MẠNH (nó nói "nước này thời này quy hoạch bàn cờ có chủ ý"), và
 * nó cũng là cách rẻ nhất để một kỷ né toàn bộ việc phải có bản sắc. Nên nó được đếm: kỷ thứ ba
 * khai 0 thì test đỏ, mà một trong hai kỷ này bỏ số 0 thì test cũng đỏ.
 */
export const RULER_STRAIGHT_ERAS = [4, 11];

/**
 * Bảng có hợp lệ không. **TỪ CHỐI THẲNG, KHÔNG TỰ CHỮA** — xem chú thích đầu file.
 */
export function isValidNetworkStyle(style) {
  if (!style || typeof style !== 'object') return false;
  if (typeof style.country !== 'string' || style.country.length === 0) return false;
  if (typeof style.note !== 'string' || style.note.length === 0) return false;
  if (!PLAN_SET.has(style.plan)) return false;
  if (!Number.isFinite(style.bend) || style.bend < 0 || style.bend > 1) return false;
  if (!Number.isFinite(style.ragged) || style.ragged < 0 || style.ragged > 1) return false;
  // ⚠️ Bước sóng phải nằm trong dải màn hình dựng ra được — xem `MIN_COIL`/`MAX_COIL`.
  if (!Number.isFinite(style.coil) || style.coil < MIN_COIL || style.coil > MAX_COIL) return false;
  // ⚠️ Kỷ khai `grid` mà lại lượn mạnh là bảng đang tự mâu thuẫn: `plan` nói "bàn cờ có chủ ý" còn
  // `bend` nói "ngoằn ngoèo". Một trong hai đang nói dối, và không có cách nào biết cái nào —
  // nên chặn ngay tại bảng thay vì để nó dựng ra một thứ không ai giải thích được.
  if (style.plan === 'grid' && style.bend > 0.25) return false;
  return true;
}

const FALLBACK = NETWORK_STYLES[1];

export function getNetworkStyle(era) {
  return NETWORK_STYLES[era] ?? FALLBACK;
}
