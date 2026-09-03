/**
 * daylight.js — THÀNH PHỐ ĐỔI THEO GIỜ TRONG NGÀY.
 *
 * THUẦN: không three, không DOM, và ĐẶC BIỆT là **không `Date`** — hàm nhận GIỜ làm tham số.
 * Cùng kỷ luật đã dùng cho `residents.js` và cho cả tầng engine của AI Coach: lấy giờ là việc của
 * tầng ngoài (`getVietnamHour` ở `engine/time.js`), còn ở đây chỉ có luật thuần, test được bằng
 * `node --test` với bất kỳ giờ nào mà không phải giả lập đồng hồ.
 *
 * ⚠️ VÌ SAO ĐÂY LÀ TÍNH NĂNG LỚN NHẤT CỦA PHASE 3D, DÙ CHỈ LÀ VÀI CON SỐ:
 * Cho tới giờ, thành phố của Đàm trông y hệt nhau ở mọi thời điểm. Mở lúc 6 giờ sáng hay 11 giờ
 * đêm cũng là đúng một bức ảnh. Cho nó đổi theo giờ nghĩa là **mỗi lần mở app là một cảnh khác** —
 * bình minh hồng, trưa gắt, chiều vàng, đêm xanh có đèn cửa sổ. Không thêm một hình khối nào, không
 * thêm một byte state nào, mà thành phố thôi là ảnh chụp và thành một NƠI CHỐN đang trôi qua thời
 * gian cùng Đàm.
 *
 * ⚠️ GIỜ VIỆT NAM, KHÔNG PHẢI GIỜ MÁY. Đàm ở Việt Nam; một cái máy để nhầm múi giờ không được phép
 * biến buổi chiều thành nửa đêm. Toàn dự án đã theo luật này (`engine/time.js`) — 3D không ngoại lệ.
 */

/**
 * Các chặng trong ngày. Ranh giới chọn theo CẢM NHẬN chứ không theo thiên văn: 17 giờ ở Việt Nam
 * chưa tối nhưng nắng đã vàng rõ, còn 19 giờ thì đã tối hẳn quanh năm.
 */
export const DAY_PHASES = ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night'];

/** Giờ nào thuộc chặng nào. Tra bảng chứ không chuỗi if — dễ đọc và dễ sửa hơn. */
const PHASE_BY_HOUR = [
  // 0  1  2  3  4  5
  'night', 'night', 'night', 'night', 'night', 'dawn',
  // 6  7  8  9  10 11
  'dawn', 'morning', 'morning', 'morning', 'noon', 'noon',
  // 12 13 14 15 16 17
  'noon', 'noon', 'afternoon', 'afternoon', 'afternoon', 'dusk',
  // 18 19 20 21 22 23
  'dusk', 'night', 'night', 'night', 'night', 'night',
];

/**
 * Hồ sơ ánh sáng của từng chặng.
 *
 *  • `sunAltitude`  cao độ mặt trời (0 = sát chân trời, 1 = đỉnh đầu). Quyết định ĐỘ DÀI bóng đổ.
 *  • `sunWarmth`    −1 lạnh … +1 ấm. Bình minh/hoàng hôn ấm rực, trưa gần trắng, đêm lạnh.
 *  • `sunEnergy`    cường độ nắng, nhân vào đèn mặt trời.
 *  • `fillEnergy`   cường độ đèn nền. ⚠️ Ban đêm phải cao hơn ban ngày RẤT NHIỀU — xem ghi chú
 *                   "tối hai lần" ngay dưới bảng.
 *  • `skyHue`/`skyPull`         ĐỈNH trời bị kéo về góc màu nào, mạnh bao nhiêu (0–1).
 *  • `horizonHue`/`horizonPull` CHÂN trời bị kéo về góc màu nào, mạnh bao nhiêu (0–1).
 *  • `skySaturation` hệ số nhân độ tươi bầu trời.
 *  • `windowsLit`   có bật đèn cửa sổ không.
 *  • `lampEnergy`   độ mạnh của những vũng sáng ấm hắt xuống chân công trình (0 = không có đèn).
 *  • `haze`         0 = trời quang … 1 = sương dày. Kéo màn sương lại GẦN, tức là phủ lên phần xa
 *                   của chính thành phố chứ không chỉ giấu mép lưới. Xem `fogRangeFor` bên dưới.
 *
 * ⚠️ VÌ SAO LÀ "KÉO VỀ MỘT ĐÍCH" CHỨ KHÔNG PHẢI "CỘNG THÊM N ĐỘ" — đây là lỗi đã thấy tận mắt ở
 * ảnh chụp. Bản đầu dùng `skyShift` cộng thẳng vào góc màu. Nhưng góc màu XUẤT PHÁT của bầu trời
 * khác nhau tuỳ theme (theme sáng ~40° vàng ấm, theme tối ~231° lam) — cùng một phép "−46°" đẩy
 * trời đêm từ lam sang **lục lam**, và cả mặt đất bị đèn bán cầu nhuộm xanh ngọc như dưới nước.
 * Cộng offset chỉ đúng khi mọi điểm xuất phát giống nhau; ở đây thì không. Nói "kéo về 232°" thì
 * đúng ở mọi điểm xuất phát.
 *
 * ⚠️ `sunAltitude` KHÔNG bao giờ xuống 0 kể cả ban đêm: ở 0 thì mặt trời nằm đúng đường chân trời,
 * bóng đổ dài vô hạn và khung bóng (`shadow.camera`) không chứa nổi — cảnh sẽ đầy vệt bóng cụt.
 *
 * ⚠️ "TỐI HAI LẦN" — VÌ SAO `night.fillEnergy` LỚN HƠN NHIỀU SO VỚI TRỰC GIÁC MÁCH BẢO.
 * (Con số hiện tại là **5,30**; đoạn dưới viết khi nó còn 3,4 — xem mục "ĐÀM KÊU ĐÊM QUÁ TỐI"
 * ở cuối chú thích này để biết vì sao nó lên tới đó. Giữ nguyên phần lập luận vì nó vẫn đúng.)
 * Bản đầu để 1,45 và ảnh chụp thử lúc 22 giờ ra một bức gần như ĐEN THUI: đo pixel mặt đất được
 * `#030401`, tức gần đúng số 0. Truy ra thì đêm bị làm tối ở HAI CHỖ ĐỘC LẬP mà cộng dồn lên nhau:
 *   (1) giờ đêm bật `isDark` ⇒ toàn bộ SƠN (tường, mái, đất) nhảy sang nhánh màu tối — riêng cái
 *       này đã tối đi ~2,9 lần so với ban ngày;
 *   (2) đèn bán cầu lấy MÀU từ chính bầu trời đêm, mà trời đêm thì đậm ⇒ ánh sáng chiếu vào cũng
 *       tối thêm ~2 lần nữa.
 * Nhân hai lại là ~5,8 lần, trong khi `fillEnergy` chỉ bù có 1,45 ⇒ tổng cộng vẫn tối gấp 9 lần
 * ban trưa. Bài học tổng quát: **`fillEnergy` phải bù cho cả độ đậm của MÀU ĐÈN, không chỉ cho ý
 * đồ "đêm thì tối hơn ngày"** — cường độ và màu là hai thừa số nhân nhau, không phải hai lựa chọn
 * thay thế nhau. Cùng họ với bài học chiaroscuro ở `sceneGraph.js`, chỉ là ở tầng khác.
 *
 * ⚠️ `lampEnergy` là thứ làm cảnh đêm ĐẸP chứ không chỉ NHÌN ĐƯỢC. Đèn cửa sổ vẽ bằng vật liệu tự
 * phát sáng nên nó KHÔNG rọi ra ngoài — ô cửa sáng trưng mà chân tường vẫn tối om, đọc ra "hình dán"
 * chứ không ra "trong nhà có người". Vài vũng sáng ấm hắt xuống quanh chân công trình là chi tiết
 * duy nhất biến bức tranh đêm thành một nơi CÓ NGƯỜI Ở.
 *
 * ⚠️ **ĐÀM KÊU ĐÊM QUÁ TỐI (2026-08-14) — VÀ SỐ ĐO ĐỒNG Ý VỚI ANH.** Chụp cảnh kỷ 8 lúc 22 giờ
 * rồi đo điểm ảnh: bầu trời `#1e2840` (độ sáng ~40/255) là ổn, nhưng MẶT ĐẤT và THÂN NHÀ ra
 * `#08141d`–`#0f1917`, tức **độ sáng 19–25 trên 255, chưa tới 8%**. Ở mức đó thì hình khối chỉ
 * còn là những mảng đen phân biệt nhau nhờ vài ô cửa sáng — công sức dựng 15 kỷ kiến trúc khác
 * nhau KHÔNG tới được mắt người xem. Đây không phải "đêm thì phải tối": trời còn sáng gấp đôi
 * mặt đất, tức cảnh đang **ngược sáng**, mà ngược sáng thì mọi vật đều thành bóng đen.
 * Sửa: `fillEnergy` 2,60 → **4,60** · `sunEnergy` 1,15 → **2,05** · `lampEnergy` 1,00 → **1,45**.
 * ⚠️ VÌ SAO NÂNG CẢ BA CHỨ KHÔNG CHỈ `fillEnergy`: nâng một mình đèn nền thì cảnh sáng lên
 * nhưng **PHẲNG** đi (đèn bán cầu không tạo bóng) — đúng bệnh chiaroscuro đã ghi ở
 * `sceneGraph.js`. `sunEnergy` (ánh trăng, CÓ đổ bóng) giữ lại chiều sâu, còn `lampEnergy` tạo
 * những vũng sáng ấm dưới chân nhà — thứ nói "trong nhà có người". Ba thừa số nhân nhau chứ
 * không thay thế nhau, y như bài học ngay bên trên.
 * ⚠️ VÀ BÀI TEST ĐÃ BẮT ĐÚNG CHỖ NÀY: bản sửa đầu để 5,30/1,55 (tỉ lệ 0,29) và bài "ĐÊM PHẢI CÓ
 * HƯỚNG SÁNG" ĐỎ ngay — ngưỡng là 0,35. Tức cái bẫy "cứ tăng đèn nền cho sáng" có thật, và nó
 * suýt bắt được tôi lần thứ hai ở đúng chỗ nó được viết ra để canh. Bản chốt 4,60/2,05 = 0,45:
 * sáng hơn mà phần lớn độ sáng tới từ nguồn CÓ đổ bóng.
 *
 * ⚠️ VÌ SAO ĐỈNH TRỜI VÀ CHÂN TRỜI CÓ ĐÍCH RIÊNG (`skyHue` vs `horizonHue`) — sửa sau bản quét đủ
 * 15 kỷ × 6 chặng, và là lỗi lộ ra ngay ở cột đầu tiên của bảng quét.
 * Trước đây cả vòm trời chung MỘT đích, chân trời kéo đủ sức còn đỉnh trời chỉ 0,45 sức. Hệ quả
 * đo được: 8 giờ sáng chân trời ra `#cad0d0` — độ tươi **0,06**, tức một dải XÁM CHẾT, vì sắc ấm
 * 40° bị kéo nửa đường sang lam 202° thì rơi đúng vào vùng trung tính ở giữa. Còn lúc bình minh/
 * hoàng hôn thì ngược lại: đích ấm kéo cả ĐỈNH trời sang nâu, ra một mái vòm nâu-ô-liu.
 * Sự thật về bầu trời: **đỉnh trời LUÔN lạnh, chân trời LUÔN là chỗ giữ hơi ấm** — kể cả giữa
 * trưa (mù nhiệt vàng nhạt) lẫn giữa đêm (chỉ khi đó chân trời mới lạnh theo). Một đích chung
 * không thể diễn tả nổi hai vai ngược nhau đó, nên tách hẳn thành hai đích. Nhờ vậy `skyPull` nay
 * kéo được MẠNH cho đỉnh trời mà không kéo chân trời xuống xám.
 */
export const DAYLIGHT_PROFILES = {
  //           cao độ nắng    hơi ấm       nắng        đèn nền     ĐỈNH trời          CHÂN trời              tươi   cửa sổ  đèn sân
  // ⚠️ BÌNH MINH VÀ HOÀNG HÔN TỪNG LÀ MỘT BỨC ẢNH — ĐÃ SỬA 2026-08-13, `TECH_DEBT.md` #17.
  // Đo trên bản quét đủ 15 kỷ × 6 chặng, KHÔNG đo dải trời mà đo CẢ CẢNH (trời + thành phố + đất,
  // vector 9 chiều, trung bình 15 kỷ): khoảng cách bình minh ↔ hoàng hôn = **5,9/255**, trong khi
  // ngưỡng mắt phân biệt được là ~12 và mọi cặp chặng khác đều ≥33. Tức trong sáu chặng thì có hai
  // chặng là CÙNG MỘT ẢNH — mở app lúc 6 giờ sáng hay 6 giờ chiều cũng vậy.
  //
  // ⚠️ VÌ SAO KHÔNG BÀI TEST NÀO BẮT ĐƯỢC: bài "hai chặng LIỀN NHAU không được giống nhau" chỉ duyệt
  // các cặp KỀ NHAU trong `DAY_PHASES` (dawn↔morning, …, dusk↔night). `dawn` và `dusk` nằm ở hai đầu
  // danh sách nên KHÔNG BAO GIỜ được đem so với nhau. Lại đúng kiểu "cái phễu, không phải hàng rào"
  // mà chính file test này đã từng dính một lần (xem ghi chú "bỏ đêm ra" ở `daylight.test.js`).
  // Nay đã thêm bài duyệt ĐỦ MỌI CẶP.
  //
  // NGUYÊN NHÂN GỐC: hai hồ sơ này vốn chỉ khác nhau vài phần trăm ở MỌI tham số —
  // cao độ 0,22 vs 0,18 · ấm 0,85 vs 1,00 · chân trời 18° vs 10° · lực kéo 0,70 vs 0,78 ·
  // tươi 1,15 vs 1,25. Không ai CHỌN cho chúng giống nhau; chúng giống nhau vì được chép ra từ nhau.
  //
  // HƯỚNG SỬA lấy từ chính tri thức mà `daylight.test.js` đã ghi (dòng "ánh sáng buổi SÁNG lạnh hơn
  // buổi CHIỀU" — kiến thức hội hoạ cổ điển, không phải sở thích), và neo vào MỘT sự thật khí quyển
  // duy nhất giải thích được cả hai chặng: **qua một đêm thì bụi lắng xuống và hơi nước đọng lại**.
  //   • Bình minh = không khí SẠCH nên chân trời VÀNG NHẠT (không đỏ nổi) · nhiều SƯƠNG sát đất ·
  //     đỉnh trời lam sạch · nắng yếu · đèn đường đang TẮT dần.
  //   • Hoàng hôn = cả ngày bụi bốc lên nên chân trời CAM ĐỎ ĐẬM · trời QUANG dưới thấp (bụi nằm
  //     trên cao, trong bầu trời) · đỉnh trời ngả tím chàm · nắng gắt xiên · đèn đã BẬT hết.
  // Nhờ vậy hai chặng tách nhau ở NĂM trục cùng lúc (sắc · độ tươi · sương · tỉ lệ nắng/đèn nền ·
  // đèn đường), chứ không chỉ ở một con số góc màu — một trục thì rất dễ bị các tầng sau (tone
  // mapping, kẹp kênh) nuốt mất, đúng bài học "BẢNG MÀU ≠ MÀU TRÊN MÀN HÌNH" ở `CLAUDE.md`.
  //
  // ⚠️ ĐÃ THỬ "BÌNH MINH HỒNG" VÀ PHẢI BỎ — ĐỪNG THỬ LẠI MÀ KHÔNG ĐỌC ĐOẠN NÀY.
  // Chính đầu file này viết *"bình minh hồng"*, nên bản sửa đầu đẩy chân trời sang 312° (hồng sen).
  // Đo thì rất đẹp trên giấy — nhưng bài **"bầu trời KHÔNG BAO GIỜ ngả tím sen"** ở
  // `palette3d.test.js` báo đỏ: chân trời ra `#d189a5`, chấm 28 điểm tím trong khi lưới cấm ở 10.
  // Quét cả vòng màu thì cửa an toàn chỉ mở từ **16°** trở đi, và thứ chạm trần trước tiên KHÔNG
  // phải bầu trời mà là **MẶT NƯỚC** (nó cũng bám chân trời qua `skyward`, nên nó ngả tím theo).
  // ⇒ Không nới lưới đó. Nó ra đời từ hai màu hỏng có thật (`#cf63c2`, `#e0b8c9`) và ngưỡng 10 của
  // nó đã được cân đúng để bắt cả màu hồng nhạt. Nới nó ra để lấy một bình minh hồng là đánh đổi
  // một lỗi CHẮC CHẮN sẽ quay lại lấy một sắc màu ĐẸP HƠN MỘT CHÚT — không đáng.
  // Và hoá ra không cần: phần lớn khoảng cách giữa hai chặng đến từ SƯƠNG chứ không từ góc màu
  // (tắt riêng sương rồi bật lại: 17,2 → 75,1). Bình minh vàng nhạt + sương dày
  // vẫn tách bạch hoàn toàn với hoàng hôn cam đỏ + đèn sáng: **75,1/255**.
  //
  // ⚠️ MỘT NƯỚC ĐI ĐÃ THỬ VÀ ĐÃ BỊ TEST BẮT — GIỮ LẠI ĐỂ ĐỪNG AI THỬ LẠI. Bản nháp hạ hẳn
  // `sunWarmth` bình minh xuống 0,22 (nắng sớm LẠNH) cho tách xa hoàng hôn. Bài test "nắng ẤM lúc
  // bình minh/hoàng hôn" báo đỏ ngay, và nó ĐÚNG còn tôi sai: `sunWarmth` là màu của ĐĨA MẶT TRỜI,
  // mà mặt trời thấp thì ánh sáng phải xuyên qua quãng khí quyển dài — ở CẢ HAI đầu ngày. Sáng sớm
  // nhìn "mát" là do BẦU TRỜI và do sương, không phải do đĩa mặt trời đổi màu.
  // ⇒ Giữ nắng bình minh ẤM (0,62), nhưng ấm ÍT HƠN hoàng hôn (1,00) — đúng câu "ánh sáng buổi SÁNG
  // lạnh hơn buổi CHIỀU" mà chính file test đã ghi. Tách hai chặng bằng những trục KHÁC, không bằng
  // cách nói sai một sự thật vật lý.
  //
  // ⚠️ VÀ ĐÂY LÀ CHỖ THẬT SỰ QUYẾT ĐỊNH — TÌM RA BẰNG PHÉP ĐO THEO TỪNG DẢI, KHÔNG PHẢI BẰNG MẮT.
  // Sau khi đã đẩy chân trời bình minh đi thật xa hoàng hôn, đo lại từng dải thì ra:
  // dải TRỜI đã tách được (13,3/255) nhưng dải THÀNH PHỐ chỉ cách 9,2 và dải ĐẤT 9,0 —
  // và quan trọng hơn con số là GÓC MÀU: thành phố lúc bình minh 48°, lúc hoàng hôn 45°. Ba độ.
  // Tức là **cả thành phố lẫn mặt đất vẫn y hệt nhau**, chỉ có tấm phông sau lưng là đổi.
  // Truy ra thì cơ chế rất rõ: đèn bán cầu (thứ nhuộm màu lên mọi mặt ngửa lên trời, tức là lên
  // toàn bộ thành phố) lấy màu từ `skyward(..., 'top', ...)` — tức từ **`skyHue` (ĐỈNH trời)**,
  // KHÔNG phải từ `horizonHue`. Mà đỉnh trời bình minh 232° so với hoàng hôn 238° thì cách nhau
  // đúng 6°. Toàn bộ công sức đẩy chân trời chỉ chạm tới cái phông, không chạm tới thành phố.
  // ⇒ Bài học tổng quát, đáng giá hơn cả lần sửa này: **muốn đổi màu của VẬT thì phải đổi thứ
  // CHIẾU vào vật, không phải thứ đứng SAU vật.** Đo theo từng dải mới thấy; đo tổng cả cảnh chỉ
  // ra một con số nhỏ mà không nói được nhỏ ở đâu.
  // Nên đỉnh trời hai chặng nay tách hẳn, và tách theo đúng sự thật khí quyển: sáng sớm không khí
  // sạch (bụi đã lắng qua đêm) ⇒ đỉnh trời LAM SẠCH, hơi ngả lục lam; chiều tà bụi và hơi nước bốc
  // lên cả ngày ⇒ đỉnh trời ngả TÍM CHÀM (chính là dải bóng Trái Đất mà dân chụp ảnh gọi là "đai
  // sao Kim"). Cả hai vẫn nằm gọn trong vùng "đỉnh trời phải lạnh" mà bài test đang khoá.
  dawn:      { sunAltitude: 0.28, sunWarmth:  0.62, sunEnergy: 0.50, fillEnergy: 1.02, skyHue: 202, skyPull: 0.58, horizonHue: 330, horizonPull: 0.62, skySaturation: 1.20, windowsLit: true,  lampEnergy: 0.16, haze: 0.90 },
  morning:   { sunAltitude: 0.55, sunWarmth:  0.40, sunEnergy: 0.95, fillEnergy: 1.00, skyHue: 218, skyPull: 0.58, horizonHue: 210, horizonPull: 0.72, skySaturation: 1.32, windowsLit: false, lampEnergy: 0, haze: 0.34    },
  // ⚠️ Giữa trưa KHÔNG kéo cao độ nắng lên sát đỉnh đầu nữa (0,92 → 0,84). Nghe thì "trưa là mặt
  // trời trên đỉnh đầu", nhưng ở 0,92 bóng đổ ngắn gần bằng không và mọi khối mất hết mặt tối —
  // cả bảng quét thì cột 12 giờ là cột PHẲNG NHẤT, nhạt nhẽo nhất, đúng thứ Đàm gọi là "bị chán".
  // Hạ một chút thì bóng vẫn ngắn (vẫn đọc ra giữa trưa) mà khối lại có mặt sáng/mặt tối trở lại.
  // Đèn nền cũng hạ theo (0,92 → 0,80): giữa trưa trời quang thì bóng SÂU, không phải bị đèn nền
  // xoá mờ — đây chính là chiaroscuro, đúng nguyên lý đã ghi ở `sceneGraph.js`.
  // ⚠️ TRỜI BAN NGÀY KHÔNG BAO GIỜ XANH — ĐÃ SỬA XONG 2026-08-13 (Phase 3V, `TECH_DEBT.md` #15 đóng).
  // Ghi lại đầy đủ vì đây là loại lỗi CHỈ lộ ra khi đo, và ba con số dưới đây là bằng chứng.
  //
  // TRIỆU CHỨNG (đo trên ảnh chụp thật, kỷ 7, theme sáng): đỉnh trời giữa trưa ra `#b1a790`, **góc
  // màu 41°** — vàng nâu — trong khi bảng này ghi `skyHue: 212` với lực kéo 0,70, MẠNH NHẤT trong
  // ngày. Cả ngày đo được 26°/40°/41°/38°/19°/224°: năm chặng ban ngày đều nâu, chỉ đêm mới xanh.
  // Tức là bốn chặng ban ngày thực chất chỉ là MỘT chặng đổi độ sáng — đúng thứ Đàm gọi là "bị chán".
  //
  // HAI NGUYÊN NHÂN CHỒNG LÊN NHAU (phải sửa cả hai, sửa một cái thì vẫn hỏng):
  //   (1) `sceneGraph.js` trộn vòm trời theo `t^2.6`, mà camera chúc xuống nên dải trời LỌT VÀO
  //       KHUNG chỉ nằm ở t ≈ 0,50–0,67 ⇒ `0,5^2,6 = 0,17`. Tức **bầu trời nhìn thấy được là
  //       64–84% MÀU CHÂN TRỜI**. `skyHue` cai quản đỉnh vòm — chỗ gần như không bao giờ hiện ra.
  //       ⇒ Ai quyết định màu trời ban ngày là `horizonHue`, KHÔNG phải `skyHue`.
  //   (2) `skyward()` (`palette3d.js`) trộn bằng **`mixRgb`**. Sắc ấm 40° pha sắc lạnh 205° trong
  //       không gian RGB thì đi qua vùng TRUNG TÍNH — cùng họ lỗi đã sửa cho MÁI NHÀ ở Phase 3N.
  //       Đã đổi `skyward()` sang XOAY SẮC bằng vector chroma (cộng hai vector đơn vị theo góc rồi
  //       lấy `atan2`), giữ nguyên độ tươi/độ sáng gốc. `t === 0` vẫn ra byte y hệt bản cũ — cố ý,
  //       để mọi chỗ gọi mà không kéo thì không đổi một pixel nào.
  //
  // ⚠️ ĐÃ THỬ VÀ THẤT BẠI — ĐỪNG THỬ LẠI HAI CÁCH NÀY (đều là chỉnh số mà không sửa phép trộn):
  //   • `horizonHue: 205, horizonPull: 0.42` → ra `#a6a69a`, 61°, độ tươi **0,06** (xám, không xanh).
  //   • `horizonHue: 205, horizonPull: 0.85` → ra `#9ca7a3`, **157°** lục-lam, độ tươi **0,05**.
  //   Càng kéo mạnh càng lạc sang lục rồi chết ở xám. Bài học: **chỉnh tham số không chữa nổi một
  //   phép toán sai** — phải sửa đúng chỗ toán, rồi mới chỉnh tham số.
  //
  // ⚠️ CÒN MỘT TẦNG NỮA MỚI RA MÀU TRÊN MÀN HÌNH — đúng bài học "BẢNG MÀU ≠ MÀU TRÊN MÀN HÌNH" ở
  // `CLAUDE.md`, nhưng lần này lệch theo chiều NGƯỢC với mái nhà. Mái nhà render ra tươi GẤP ĐÔI
  // bảng màu; bầu trời thì render ra nhạt đi **5 lần** — vì `NeutralToneMapping` ở phơi sáng 1,2 nén
  // mạnh vùng sáng, mà chân trời để độ sáng 0,80 thì nằm đúng giữa vùng bị nén. Nên `palette3d.js`
  // đã hạ độ sáng chân trời xuống 0,70/0,72 và nâng độ tươi lên 0,60/0,44 để thoát vùng nén.
  //
  // ⚠️ VÀ GÓC MÀU ĐẶT VÀO ≠ GÓC MÀU ĐO ĐƯỢC. Nắng ấm nhân vào bầu trời làm sắc lạnh TỤT xuống phía
  // lục: đặt 195° thì đo ra 173°, đặt 205° đo ra 192° (lệch −13 tới −22°); ngược lại sắc ấm thì hơi
  // tăng (đặt 18° đo ra 27°). Vì vậy hai chặng sáng/trưa phải đặt CAO HƠN đích thật khoảng 15°:
  // đặt 210°/216° thì đo ra **203°/211°** — xanh trời thật. Ai chỉnh bảng này về sau nhớ trừ hao.
  //
  // KẾT QUẢ SAU KHI SỬA (cùng phép đo, cùng kỷ 7): 27° · **203°** · **211°** · 37° · 18° · 223°.
  // Một ngày nay là một HÀNH TRÌNH MÀU thật, và bài test 81 ở `daylight.test.js` khoá lại điều đó
  // bằng luật "các chặng BAN NGÀY phải trải ít nhất 90° góc màu" — luật này đã được thử NGƯỢC với
  // bộ số hỏng cũ và báo đỏ đúng như mong đợi (bộ cũ chỉ trải 38°).
  noon:      { sunAltitude: 0.84, sunWarmth:  0.05, sunEnergy: 1.10, fillEnergy: 0.80, skyHue: 224, skyPull: 0.70, horizonHue: 216, horizonPull: 0.85, skySaturation: 1.16, windowsLit: false, lampEnergy: 0, haze: 0.06    },
  // ⚠️ CHIỀU: giữ nguyên Ý ĐỒ "chiều vàng", nhưng bản cũ KHÔNG đạt được nó — đo ra `#8f7f56`, độ
  // tươi **0,25**, tức kaki đục chứ không phải vàng; chính hoàng hôn còn tươi hơn (0,32). Nâng độ
  // tươi và đẩy sắc từ 34° lên 44° (nắng-vàng thay vì đất-nâu). ⚠️ KHÔNG đổi chiều thành xanh:
  // phép đo cả-cảnh cho thấy chiều vốn ĐÃ tách bạch với mọi chặng khác (gần nhất là 37,6/255) —
  // vấn đề của nó là ĐỤC, không phải TRÙNG. Sửa đúng bệnh, không sửa bệnh tưởng tượng.
  afternoon: { sunAltitude: 0.48, sunWarmth:  0.55, sunEnergy: 1.00, fillEnergy: 1.00, skyHue: 214, skyPull: 0.44, horizonHue:  44, horizonPull: 0.56, skySaturation: 1.30, windowsLit: false, lampEnergy: 0, haze: 0.16    },
  // Hoàng hôn: đẩy về phía ĐỎ và ĐẬM hơn hẳn bình minh. `fillEnergy` HẠ (1,05 → 0,88) là chủ ý —
  // chiều tà thì nắng xiên gắt và bóng sâu, ngược hẳn với sương sớm mờ đều của bình minh; đây chính
  // là trục "tỉ lệ nắng / đèn nền" mà `night` đã dùng để thoát khỏi bệnh "phẳng" (xem ghi chú đêm).
  dusk:      { sunAltitude: 0.16, sunWarmth:  1.00, sunEnergy: 1.06, fillEnergy: 0.90, skyHue: 252, skyPull: 0.50, horizonHue:   8, horizonPull: 0.88, skySaturation: 1.46, windowsLit: true,  lampEnergy: 0.78, haze: 0.08 },
  // Đêm: chặng DUY NHẤT mà chân trời cũng lạnh theo đỉnh trời — kéo cả hai về LAM SÂU (không phải
  // lục lam, không phải tím). Nắng yếu nhưng KHÔNG tắt — đó là ánh trăng, và không có nó thì công
  // trình mất hết hình khối, chỉ còn những ô cửa sáng lơ lửng.
  //
  // ⚠️ "TỐI HAI LẦN" LẦN THỨ BA — VÀ LẦN NÀY NGUYÊN NHÂN NGƯỢC VỚI HAI LẦN TRƯỚC.
  // Bảng quét đủ 15 kỷ × 6 chặng, đo bằng máy chứ không bằng mắt, cho ra con số này: dải THÀNH PHỐ
  // (55% dưới khung hình) lúc 22 giờ có độ sáng trung vị **0,023** — tức khoảng 6/255, một nửa
  // diện tích thành phố đen đặc. Bình minh và hoàng hôn cùng phép đo ấy được 0,22. Đêm tối gấp 9
  // lần hai chặng "cũng tối" kia, chứ không phải tối hơn một chút.
  // Nhưng chi tiết quan trọng hơn nằm ở DẢI ĐỘNG (p95 − p05): đêm 0,129, bình minh 0,202, trưa
  // 0,474. Đêm vừa tối nhất VỪA PHẲNG NHẤT. Và độ lệch giữa 15 kỷ lúc đêm chỉ 0,010 — thấp nhất
  // trong sáu chặng: **ban đêm cả 15 kỷ trông y hệt nhau**, tức là mất sạch phần thưởng của việc
  // đi hết 15 kỷ, đúng vào khung giờ Đàm hay làm phiên khuya nhất.
  //
  // Truy nguyên: hai lần trước sửa bằng cách BƠM ĐÈN NỀN (1,45 → 3,40). Nhưng đèn nền là ánh sáng
  // KHÔNG HƯỚNG — nó rọi đều vào mọi mặt, kể cả mặt lẽ ra phải khuất. Tính ra thì lúc 22 giờ:
  //     nắng (có hướng) = 1,72 × 0,42 = 0,72     đèn nền (không hướng) = 0,78 × 3,40 = 2,65
  // Ánh sáng không hướng đang GẤP 3,7 LẦN ánh sáng có hướng. Đó chính là định nghĩa của một bức
  // phẳng, và nó giải thích trọn vẹn cả hai con số đo được: bơm thêm đèn nền chỉ kéo mọi thứ về
  // giữa thang xám mà không dựng lại được hình khối.
  // Sự thật về đêm thật thì ngược hẳn: **đêm là lúc CHIARoSCURO MẠNH NHẤT trong ngày**, vì chỉ có
  // đúng một nguồn sáng cứng là mặt trăng. Đêm phải là chặng NHIỀU hướng sáng nhất, không phải ít
  // nhất. Nên lần này đổi TỈ LỆ chứ không đổi tổng: ánh trăng 0,42 → 1,15 (thành nguồn tạo khối
  // thật sự), đèn nền 3,40 → 2,60 (vẫn gấp 3,25 lần giữa trưa — vẫn bù đủ cho việc màu đèn bán cầu
  // lấy từ bầu trời đêm vốn đã đậm, xem bài test khoá tỉ lệ ở `daylight.test.js`).
  // Bài học tổng quát, khác với bài học của hai lần trước: **"tối quá" và "phẳng quá" là hai bệnh
  // khác nhau, và thuốc chữa bệnh này làm nặng thêm bệnh kia.** Đo tổng độ sáng thì không bao giờ
  // phân biệt được hai bệnh đó — phải đo thêm dải động mới thấy.
  night:     { sunAltitude: 0.40, sunWarmth: -0.70, sunEnergy: 2.05, fillEnergy: 4.60, skyHue: 232, skyPull: 0.80, horizonHue: 226, horizonPull: 0.74, skySaturation: 0.85, windowsLit: true,  lampEnergy: 1.45, haze: 0.40 },
};

/** Giờ (0–23) → tên chặng. Giờ rác → 'noon' (chặng trung tính nhất, không bao giờ trông như lỗi). */
export function phaseForHour(hour) {
  if (!Number.isFinite(hour)) return 'noon';
  const h = Math.floor(hour);
  if (h < 0 || h > 23) return 'noon';
  return PHASE_BY_HOUR[h];
}

/**
 * Hồ sơ ánh sáng cho một giờ cụ thể.
 *
 * ⚠️ KHÔNG NỘI SUY GIỮA HAI CHẶNG, và đây là lựa chọn có chủ ý. Nội suy mượt nghe hay hơn, nhưng
 * cảnh 3D chỉ được DỰNG LẠI khi bố cục đổi — nó không theo dõi đồng hồ từng phút. Nội suy sẽ tạo ra
 * một giá trị "đúng tại lúc mở app" rồi đứng im ở đó, tức là tốn công tính cho một thứ không ai
 * thấy chuyển động. Sáu chặng rời rạc cho ra đúng cùng trải nghiệm ("sáng nay khác chiều qua") mà
 * đơn giản hơn hẳn và test được bằng bảng.
 *
 * @param {number} hour giờ theo múi giờ Việt Nam, 0–23
 */
export function deriveDaylight(hour) {
  const phase = phaseForHour(hour);
  return { phase, ...DAYLIGHT_PROFILES[phase] };
}

/**
 * Màn sương bắt đầu và kết thúc ở khoảng cách nào, theo độ dày sương của chặng.
 *
 * ⚠️ VÌ SAO SƯƠNG LÀ THỨ CUỐI CÙNG TÁCH ĐƯỢC BÌNH MINH KHỎI HOÀNG HÔN — và vì sao mọi cách khác
 * đều đã thất bại trước đó. Đo theo từng dải cho thấy dải THÀNH PHỐ hai chặng chỉ cách nhau 8,7/255
 * (góc màu 51° so với 44°). Truy tiếp thì thấy thứ nhuộm màu lên thành phố KHÔNG phải bầu trời mà
 * là ĐÈN MẶT TRỜI, và màu đèn mặt trời do đúng một tham số quyết định: `sunWarmth`. Mà `sunWarmth`
 * thì **buộc phải ấm ở cả hai đầu ngày** — mặt trời thấp thì ánh sáng xuyên qua quãng khí quyển dài,
 * đó là vật lý, không phải lựa chọn mỹ thuật (bài test đã bắt đúng khi tôi thử nói ngược lại).
 * ⇒ Ngõ cụt: không có cách nào làm ánh nắng bình minh khác màu ánh nắng hoàng hôn mà vẫn trung thực.
 *
 * Nhưng đời thật vẫn phân biệt được hai buổi đó từ xa, và thứ phân biệt KHÔNG phải màu nắng — là
 * **SƯƠNG**. Qua một đêm, hơi nước đọng lại sát mặt đất: sáng sớm là buổi duy nhất trong ngày có
 * sương phủ. Chiều tà thì bụi và hơi nước đã bốc lên cao, nằm trong BẦU TRỜI (nên trời chiều đậm
 * màu) chứ không nằm dưới thấp. Đây cũng là lý do mọi bức tranh phong cảnh buổi sớm đều có một
 * lớp mờ ở nền xa.
 *
 * Điều khiến nó hiệu quả về mặt kỹ thuật: màn sương lấy MÀU CHÂN TRỜI (xem `sceneGraph.js`), nên
 * kéo sương lại gần không chỉ làm mờ — nó **sơn lại toàn bộ phần nền phía sau và quanh thành phố**
 * bằng sắc của buổi đó, một mảng chiếm khoảng một phần bảy khung hình.
 *
 * ⚠️ ĐO CHÍNH XÁC SƯƠNG LÀM GÌ — VÀ NÓ **KHÔNG** LÀM GÌ. Tắt riêng sương (giữ nguyên mọi tham số
 * khác) rồi bật lại, đo theo từng dải, trung bình 15 kỷ:
 *
 *     dải             không sương → có sương
 *     NỀN/CHÂN TRỜI      12,9  →  74,6     (#796b47 nâu ô-liu sẫm  →  #c7ad83 vàng nhạt)
 *     THÀNH PHỐ           8,4  →   3,3     ← GIẢM, không tăng
 *     MẶT ĐẤT             7,2  →   7,2     ← không đổi
 *     cả cảnh            17,2  →  75,1
 *
 * Tức **toàn bộ khoảng cách đến từ phần NỀN, không phải từ các công trình.** Điều này ĐÚNG NHƯ
 * THIẾT KẾ chứ không phải thiếu sót: sương cố ý bắt đầu SAU rìa thành phố, nên nó không chạm vào
 * những căn nhà ở gần. (Dải thành phố còn hơi GIẢM vì sương kéo mấy căn ở xa nhạt về phía màu chân
 * trời, làm trung bình khoảng giữa khung hình của bình minh xích lại gần hoàng hôn một chút.)
 * Và việc các công trình ở gần trông na ná nhau ở hai đầu ngày là **đúng vật lý**, không phải lỗi:
 * cùng một mặt trời thấp, cùng một thứ ánh sáng ấm chiếu vào. Ngoài đời cũng vậy — thứ cho ta biết
 * đang là sáng hay chiều là BẦU TRỜI, là SƯƠNG, là đèn đường đã bật hay chưa; không phải màu bức
 * tường trước mặt.
 * ⚠️ Ghi lại vì đã suýt viết ngược: bản chú thích đầu tiên khẳng định sương "quét sắc lên chính
 * những công trình ở xa nên cuối cùng chạm được vào dải THÀNH PHỐ". Nghe rất hợp lý, và SAI —
 * đo ra thì dải đó đi từ 8,4 xuống 3,3. Một cơ chế nghe xuôi tai vẫn phải đo mới được viết ra.
 *
 * ⚠️ ĐỪNG KÉO MẠNH HƠN NỮA. Bản đầu của `sceneGraph.js` để sương bắt đầu ở `gridSize * 1.05`
 * (≈12,6 trong khi camera đứng cách 22) và ảnh chụp ra một màn trắng đục phủ gần hết thành phố.
 * Hệ số dưới đây cố ý chỉ cho sương dày nhất (bình minh, 0,90) tới `1.7 − 0.9×0.42 ≈ 1.32`
 * (≈15,8) — phủ phần XA của thành phố, để phần gần vẫn sắc nét.
 *
 * ⚠️ **VÀ ĐÂY LÀ CHỖ MỘT KẾT LUẬN ĐÚNG ĐÃ HẾT ĐÚNG — Phase 9A ĐO RA.** Mọi lập luận bên trên vẫn
 * chuẩn từng chữ, nhưng nó chỉ nói về ĐẦU GẦN của sương (bắt đầu ở đâu để thành phố còn sắc nét).
 * Không dòng nào từng hỏi về ĐẦU XA — và đầu xa mới là chỗ hỏng. Sương tuyến tính có một mặt phẳng
 * `far`: qua khỏi nó thì mọi thứ bị thay bằng ĐÚNG một màu, không phải nhạt đi mà **biến mất**. Đo
 * bằng cách sơn sương màu hồng cánh sen rồi chụp: đỉnh khung hình ra `#e803e6`, tức **95–100% sương
 * nguyên chất**. Nghĩa là ~25% mỗi tấm ảnh là một mảng phẳng lì MỘT màu — và bất cứ thứ gì dựng ra
 * ở ngoài đó (núi, đồi, rặng cây) đều tàng hình tuyệt đối.
 *
 * ⇒ Đổi sang **sương LUỸ THỪA (`FogExp2`)**, và lý do là lý do KIẾN TRÚC chứ không phải khẩu vị:
 * hệ số `1 − e^(−(dρ)²)` tiến tới 1 nhưng **không bao giờ chạm 1**, nên không tồn tại khoảng cách
 * nào mà cảnh vật bị xoá sạch. Rặng núi gần đậm hơn rặng núi xa, và cả hai vẫn còn đó — đó CHÍNH
 * là "phối cảnh không khí", thứ duy nhất tạo ra cảm giác lớp gần / lớp giữa / lớp xa. Một mặt phẳng
 * `far` thì theo định nghĩa không thể có lớp nào nằm sau nó.
 *
 * ⚠️ HAI CÂU TỰ TRẤN AN TÔI VIẾT Ở TRÊN ĐỀU KHÔNG SỐNG SÓT QUA PHÉP ĐO — sửa lại tại chỗ thay vì
 * xoá, vì cách chúng sai mới là phần đáng học (cùng họ với *"ổn định qua hai cỡ ô 260 và 300"* ở
 * Phase 4G, chỉ khác là lần này tôi tự viết ra trong chính phiên đang sửa).
 *   · *"tiến tới 1 nhưng KHÔNG BAO GIỜ chạm 1, nên không có khoảng cách nào cảnh vật bị xoá sạch"*
 *     — đúng về mặt toán, VÔ NGHĨA về mặt nhìn. Ở mật độ đầu tiên tôi chọn, mép thế giới ra **93%
 *     sương** trong một ngày thường. 93% với 100% thì mắt không phân biệt được: dãy núi vẫn bị xoá,
 *     chỉ là bằng một tiệm cận thay vì một mặt phẳng. Cái sai không nằm ở mô hình sương mà ở MẬT ĐỘ,
 *     và câu nói kia đã che mất điều đó — nó khiến tôi tin việc đổi mô hình là đủ.
 *   · *"`FogExp2` ở mật độ 0,011 chỉ phủ ~6%"* — con số ấy đo ở `haze = 0` (trời quang tuyệt đối),
 *     rồi được viết ra như thể đúng chung. Ngày thường `haze ≈ 0,3` ⇒ mật độ 0,0171 ⇒ **14%** phủ
 *     lên chính thành phố. Một con số đúng trong MỘT điều kiện, viết như thể đúng mọi điều kiện.
 *
 * ⇒ Nay mật độ được chọn từ BA CÁI MỐC ĐO ĐƯỢC chứ không phải một hằng số nghe hợp lý. Ngày thường
 * (`haze` 0,3), theo khoảng cách từ camera:
 *
 *     thành phố (26 đv)   ~7%   ← phải gần như trong veo: đây là thứ Đàm đang nhìn
 *     vành đất gần (40)   ~16%  ← đủ để tách khỏi thành phố, chưa đủ để mất chi tiết
 *     rặng núi xa (70)    ~40%  ← lùi hẳn ra sau mà VẪN ĐỌC ĐƯỢC hình
 *     mép thế giới (95)   ~61%  ← xa nhất vẫn còn là đất, không phải một mảng sơn
 *
 * Ba mốc ấy mới là điều muốn nói; hai hệ số dưới đây chỉ là nghiệm của chúng. Đổi số thì đo lại
 * bảng này, đừng chỉnh cho tới lúc "nhìn thấy đỡ" — bài học "mọi thay đổi ánh sáng phải chụp-rồi-đo"
 * (Phase 7A). Có bài test canh cả ba mốc ở `daylight.test.js`.
 *
 * @param {number} haze 0 = trời quang … 1 = sương dày
 * @param {number} gridSize cạnh lưới thành phố
 * @returns {number} mật độ sương cho `FogExp2` (đơn vị: 1 / khoảng cách thế giới)
 */
export function fogDensityFor(haze, gridSize) {
  const size = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : 12;
  const h = Math.min(1, Math.max(0, Number.isFinite(haze) ? haze : 0));
  // Tỉ lệ NGHỊCH với cỡ lưới: mật độ là "sương trên mỗi đơn vị khoảng cách", nên một thế giới lớn
  // gấp đôi phải có mật độ bằng một nửa mới cho ra cùng một bức ảnh. Viết thẳng một hằng số ở đây
  // là đúng bài học Phase 7D: một con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ.
  return (0.080 + h * 0.140) / size;
}

/**
 * Hướng mặt trời cho một cao độ, giữ nguyên PHƯƠNG VỊ đã chọn ở `sceneGraph.js`.
 *
 * ⚠️ CHỈ ĐỔI CAO ĐỘ, KHÔNG ĐỔI PHƯƠNG VỊ. Nghe thì "mặt trời thật phải chạy từ đông sang tây",
 * nhưng phương vị là thứ quyết định nắng rọi từ BÊN hay từ SAU LƯNG người xem — và cả Phase 3C đã
 * dành để sửa đúng chuyện đó (xem `SUN_DIRECTION`). Cho phương vị chạy tự do thì vài giờ trong
 * ngày sẽ rơi lại đúng cái bẫy "đèn flash" làm hình khối bẹp dí. Đổi cao độ là đủ để bóng dài ra
 * lúc sáng sớm/chiều muộn và ngắn lại lúc trưa — tức là đủ để mắt đọc ra thời điểm trong ngày.
 *
 * @param {{x:number,y:number,z:number}} base hướng gốc (đã chuẩn hoá)
 * @param {number} altitude 0 = sát chân trời … 1 = đỉnh đầu
 * @returns {{x:number, y:number, z:number}} hướng mới, đã chuẩn hoá
 */
export function sunDirectionAt(base, altitude) {
  const alt = Math.min(1, Math.max(0.12, Number.isFinite(altitude) ? altitude : 0.5));
  // Phương vị = hình chiếu của hướng gốc lên mặt phẳng ngang.
  const flat = Math.hypot(base.x, base.z) || 1;
  const ax = base.x / flat;
  const az = base.z / flat;

  // `altitude` là sin của góc nâng; phần còn lại chia cho hai trục ngang theo đúng phương vị cũ.
  const horizontal = Math.sqrt(Math.max(0, 1 - alt * alt));
  return { x: ax * horizontal, y: alt, z: az * horizontal };
}
