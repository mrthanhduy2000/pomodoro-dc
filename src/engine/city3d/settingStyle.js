/**
 * settingStyle.js — BẢNG ĐỊA THẾ 15 KỶ: thành phố này NẰM Ở ĐÂU, và VÌ SAO nằm ở đó.
 *
 * ⚠️ ĐÂY LÀ BƯỚC A CỦA VIỆC 2 — CHỈ BẢNG, CHƯA CÓ HÌNH. Đàm chốt thứ tự: *"chỗ đắt là BẢNG, không
 * phải hình. Bốn lần trước đã chứng minh."* Bốn lần ấy là `vernacularRoof` · `undergrowth` ·
 * `streetStyle` · `groundFloor`: mỗi lần, thứ tốn thời gian và quyết định kết quả là 15 dòng dữ
 * liệu, còn nhà máy hình học thì gần như viết thẳng ra được. Sửa một dòng chữ rẻ hơn sửa một dòng
 * chữ đã có hình dựng theo.
 *
 * ── CÂU HỎI MỖI DÒNG PHẢI TRẢ LỜI ĐƯỢC ──────────────────────────────────────────────────────
 *   *"Thành phố tiêu biểu của nước ấy, THỜI ẤY, nằm ở đâu và vì sao nằm ở đó?"*
 * Trả lời không được thì dòng ấy là tuỳ hứng — mà tuỳ hứng chính là thứ đã sinh ra 15 kỷ cao bằng
 * nhau ở Phase 5B (`storyHeight` gánh hai việc, cả 15 kỷ trải đúng 1,88 lần và còn SAI CHIỀU).
 * Ô `note` của mỗi dòng LÀ câu trả lời ấy, và `settingStyle.test.js` bắt nó phải nhắc tới thứ chỉ
 * nước ấy mới có — cùng cơ chế đang giữ `groundFloorStyle` · `floraStyle` · `streetStyle`.
 *
 * ── BA LUẬT ĐÀM RA CHO BẢNG NÀY ─────────────────────────────────────────────────────────────
 * (1) ⚠️ **"KHÔNG CÓ NƯỚC" LÀ MỘT CÂU TRẢ LỜI ĐÚNG**, và nó phải được KHAI TƯỜNG MINH, có test
 *     đếm được — không rơi về mặc định. **Đúng MỘT kỷ** khai `water: 'none'` (kỷ 1), và lý do
 *     riêng của nó viết ra bên trên dòng ấy. Cùng tinh thần với `feature: 'none'` ở bảng tầng trệt:
 *     *"kỷ nào KHÔNG có thì khai rõ là không có, đừng bịa cho đủ mâm."*
 *     ⚠️ Kỷ 5 TỪNG khai `none` và Đàm bác ngày 2026-08-19: nước chắn ba mặt chính là câu trả lời
 *     cho *"vì sao lâu đài nằm ở đó"*, nên bỏ nó đi là bỏ mất câu trả lời. Xem chú thích dòng kỷ 5.
 * (2) ⚠️ **ĐỪNG GÁN BIỂN CHO MỘT NỀN VĂN MINH SÔNG CHỈ VÌ BIỂN ĐẸP HƠN.** Ai Cập và Lưỡng Hà là
 *     nền văn minh SÔNG — cả hai khai `river`. Đo được: **3/15** kỷ có biển, tức dưới một phần
 *     năm, xa ngưỡng "quá nửa" mà Đàm cấm. Kỷ nào cũng ven biển thì biển thôi mang thông tin, và ta
 *     mất đúng thứ vừa xây được suốt mười phase — bản sắc 15 kỷ.
 * (3) ⚠️ **HƯỚNG BỜ NƯỚC PHẢI KHÁC NHAU**, nếu không 15 kỷ sẽ ra cùng một bố cục lệch về một phía.
 *     14 kỷ có nước chia ra: bắc 3 · nam 4 · đông 4 · tây 3. Mỗi hướng đều là một sự thật địa lý
 *     kiểm được, KHÔNG phải rải cho đều: sông Vị chảy phía BẮC Trường An (kinh đô đặt bờ nam), sông
 *     Arno chảy phía NAM Duomo, đình làng Bắc Bộ quay hướng NAM nên ao làng nằm phía nam, sông
 *     Volga chạy phía ĐÔNG Stalingrad (quân tiếp viện vượt sông từ bờ đông).
 *
 * ── VÌ SAO LÀ MỘT FILE RIÊNG, VÀ QUAN HỆ VỚI `outskirts.js` LÀ MỘT CHIỀU ────────────────────
 * Cùng khuôn ba lớp đã dùng năm lần: **BẢNG** ở đây · **HÌNH** ở `city3d/setting.js` (Bước B) ·
 * tầng cảnh chỉ ĐỌC. ⚠️ Và một luật riêng Đàm ra cho lần này: **`settingStyle` → `outskirts`, MỘT
 * CHIỀU.** Vùng quê đọc bảng này để biết chỗ nào là mặt nước mà không đặt cây (dưới nước thì không
 * có rừng); tuyệt đối KHÔNG được để `outskirts.js` khai hướng rồi bảng này đọc ngược lại. Lý do là
 * câu hỏi chuẩn của dự án — *"ngoài đời hai thứ này có luôn đi cùng nhau không?"*: loài cây và
 * hướng ra biển độc lập với nhau (Lisboa và Porto cùng cây cùng khí hậu nhưng quay ra nước theo hai
 * hướng khác nhau). Hai chiều là cách hai bảng trôi khỏi nhau.
 *
 * ── SÁU KIỂU NƯỚC, VÀ VÌ SAO KHÔNG PHẢI BA ──────────────────────────────────────────────────
 * Đàm nêu ba (*"biển / sông / KHÔNG nước"*) và nhắc thêm *"cửa sông"* khi nói về Lisboa. Bảng này
 * dùng SÁU, vì mỗi kiểu là một HÌNH DẠNG khác hẳn chứ không phải một sắc thái chữ nghĩa:
 *   `none`    — khô. Không có mặt nước nào trong khung.
 *   `river`   — dải hẹp cắt ngang MỘT phía, bờ tự nhiên gấp khúc.
 *   `meander` — khúc uốn ÔM QUANH BA phía, chỉ chừa một dải yên ngựa hẹp làm lối vào.
 *   `canal`   — dải hẹp nhưng THẲNG, bờ kè đá, nhà máy áp sát mép nước. Người đào, không phải trời.
 *   `estuary` — cửa sông chịu triều: rộng, nước mặn, nhưng **VẪN CÒN bờ bên kia nhìn thấy được**.
 *   `sea`     — mặt nước trải tới chân trời, KHÔNG có bờ bên kia.
 * ⚠️ `estuary` và `sea` KHÁC NHAU ở đúng một chuyện — **có bờ bên kia hay không**. Đó là thứ mắt
 * đọc ra ngay và là thứ quyết định hình học ở Bước B, nên chúng không được gộp. (Định nghĩa cũ ghi
 * `estuary` là *"một cái phễu rộng mở dần ra"* — một mô tả HÌNH DÁNG MẶT BẰNG, mà hình dáng ấy thì
 * tầng vẽ không dựng được ở cỡ này và cũng không phải thứ phân biệt hai kiểu. Đã sửa cho đúng thứ
 * nó thật sự gánh.)
 *
 * ⚠️ **VÌ SAO PHẢI THÊM `meander` CHỨ KHÔNG ÉP KỶ 5 VÀO `river`** (Đàm ra lệnh sửa dòng kỷ 5, và
 * ra kèm điều kiện *"đừng ép nó vào `river` nếu hình dạng khác thật"*). Suối Elzbach uốn quanh mỏm
 * đá Burg Eltz ở BA mặt. Về TOPO đó là một hình khác hẳn `river`: `river` chia khung hình làm hai
 * nửa (bên này bờ, bên kia bờ), còn `meander` thì nước BAO LẤY đất, và cái nó tạo ra là **một lối
 * vào duy nhất** — đúng thứ khiến người ta xây lâu đài ở đó. Vẽ nó bằng một dải thẳng một bên là
 * vẽ ra một sự thật khác: một lâu đài cạnh một con suối, thay vì một lâu đài trong một khúc uốn.
 * ⚠️ `side` GIỮ NGUYÊN MỘT NGHĨA cho mọi kiểu — *"hướng có mặt nước"*. Với `meander` thì nước phủ
 * `side` CỘNG hai hướng kề nó, và hướng ĐỐI DIỆN là dải yên ngựa khô. Đó là một luật về HÌNH suy ra
 * từ một hướng, KHÔNG phải trường `side` gánh việc thứ hai — nếu để `side` nghĩa là "hướng lối vào"
 * cho riêng kiểu này thì đó mới đúng cái bẫy "một trường gánh hai việc" đã cắn năm lần.
 *
 * ── TRỤC THỨ HAI: `ground` — THÀNH PHỐ NGỒI THẾ NÀO SO VỚI MẶT NƯỚC ─────────────────────────
 * Chỉ mỗi "có sông" thì 7 kỷ sông sẽ ra 7 bức ảnh giống nhau. Trục này mới là thứ tách chúng:
 *   `ridge`     — trên sống núi / mỏm đá, CAO hơn hẳn mặt nước (kỷ 1 khô hẳn; kỷ 5 là mỏm đá
 *                 nhô lên giữa khúc uốn — cùng một thế đất, hai lý do khác nhau)
 *   `flat`      — ngang mặt nước, trên đồng bồi (kỷ 2, 3, 6, 15)
 *   `bank`      — trên một bờ đê thấp hơn mái nhà (kỷ 4, 7, 9)
 *   `bluff`     — vách dốc đứng xuống nước (kỷ 8, 12)
 *   `reclaimed` — mép nước là do người làm: kè đá, bến, đất lấn (kỷ 10, 11, 13, 14)
 *
 * Xem ADR-039.
 */

import { normalizeEraKey, getEraStyle } from './eraStyle.js';

/** Sáu kiểu mặt nước. Xem khối chú thích đầu file để biết vì sao là sáu chứ không phải ba. */
export const WATER_KINDS = ['none', 'river', 'meander', 'canal', 'estuary', 'sea'];

/** Bốn hướng, cộng `none` cho kỷ khô. Hướng là của MẶT NƯỚC so với tâm thành phố. */
export const WATER_SIDES = ['none', 'bac', 'nam', 'dong', 'tay'];

/** Thành phố ngồi thế nào so với mặt nước. */
export const GROUND_FORMS = ['ridge', 'flat', 'bank', 'bluff', 'reclaimed'];

/**
 * ⚠️ TRẦN CHO SỐ KỶ CÓ BIỂN — LUẬT CỦA ĐÀM VIẾT THÀNH SỐ.
 *
 * *"Đừng cho quá nửa số kỷ có biển. Kỷ nào cũng ven biển thì biển thôi mang thông tin, và ta mất
 * đúng thứ vừa xây được — bản sắc 15 kỷ."* Trần đặt ở 7 (đúng "quá nửa" của 15 là từ 8 trở lên).
 * Bảng hiện dùng 3, tức còn cách trần 4 — khoảng ấy CỐ Ý để dành: nếu một phiên sau đổi một kỷ
 * sang biển vì có lý do lịch sử thật thì vẫn đi lọt, nhưng đổi năm kỷ thì đỏ.
 */
export const MAX_SEA_ERAS = 7;

/**
 * ⚠️ ĐỘ LỆCH TỐI ĐA GIỮA HƯỚNG ĐÔNG NHẤT VÀ HƯỚNG THƯA NHẤT — luật (3) của Đàm, viết thành QUAN HỆ.
 *
 * ⚠️ BẢN ĐẦU VIẾT SAI HÌNH DẠNG: `MAX_ERAS_PER_SIDE = 6`, một MỨC TUYỆT ĐỐI. Đàm bác đúng chỗ
 * đau — *"luật thật không phải 'không hướng nào quá 6' mà là 'không hướng nào ÁP ĐẢO'"* — và chỉ
 * thẳng ra đó là bẫy Phase 7D (mặt đường có lời hứa *"nhạt hơn đất"*, một quan hệ, mà được viết
 * thành một hằng số; nhiều tháng sau mặt đất bị chỉnh vì một lý do khác và con đường thành tàng
 * hình trong im lặng). Một mức tuyệt đối ở đây có ĐÚNG hai cách hỏng:
 *   · **quá rộng** — bảng 6·3·2·2 có tổng 13, không hướng nào chạm 6, mà nó dồn rõ rệt về một phía;
 *   · **trôi theo số kỷ** — thêm một kỷ có nước là con số 6 tự nhiên hết nghĩa, mà nó không tự đỏ.
 * Hiệu giữa nhiều nhất và ít nhất KHÔNG có cả hai bệnh: nó bắt được 6·3·2·2 (hiệu 4), và nó không
 * cần biết có bao nhiêu kỷ.
 *
 * Vì sao 2 chứ không phải 1: bốn hướng chia 14 kỷ thì không thể đều tuyệt đối (14 = 4×3 + 2), nên
 * hiệu 2 là mức chặt nhất mà một bảng CÂN vẫn đi lọt. Hôm nay bảng ra **bắc 3 · nam 4 · đông 4 ·
 * tây 3**, hiệu **1** — đạt thoải mái, và còn đúng một bậc dự phòng.
 */
export const MAX_SIDE_SPREAD = 2;

/**
 * 15 dòng. Mỗi dòng buộc vào `country` mà `eraStyle.js` khai — **CÓ TEST BẮT**, để hai bảng không
 * trôi khỏi nhau (cùng cơ chế đang giữ `groundFloorStyle` · `floraStyle` · `streetStyle` ·
 * `horizon`).
 *
 * `reach` = số Ô LƯỚI từ mép lưới thành phố 12×12 ra tới mép nước. `width` = bề rộng dải nước tính
 * bằng ô; `null` nghĩa là **ra tới chân trời, không có bờ bên kia** — chỉ `sea` được phép, và
 * `isValidSetting` từ chối thẳng mọi kết hợp khác (xem luật ở đó).
 */
export const SETTING_STYLES = {
  // ⚠️ KỶ 1 — "KHÔNG CÓ NƯỚC" Ở ĐÂY KHÔNG PHẢI CHỖ TRỐNG, NÓ LÀ ĐIỀU NỔI TIẾNG NHẤT VỀ NƠI NÀY.
  // Göbekli Tepe nằm trên sống núi đá vôi Germuş nhìn xuống đồng bằng Harran, và câu hỏi khiến giới
  // khảo cổ bối rối suốt hai mươi năm chính là: *vì sao người ta dựng công trình đá lớn nhất thời
  // đại ở một nơi KHÔNG có nguồn nước thường xuyên?* Không suối, không sông, nước mưa hứng vào hốc
  // đá. Nó được chọn vì TẦM NHÌN và vì nghi lễ, không vì sinh kế — đó là thứ làm nó khác mọi khu
  // định cư sau này.
  //
  // ⚠️ ĐÃ CÂN NHẮC VÀ BÁC "THÀNH TROY" — gợi ý của Đàm, nhưng nó lệch thời gần bảy nghìn năm.
  // Troy (Hisarlık, nhìn xuống eo Dardanelles) là ĐỒ ĐỒNG, khoảng 3000–1200 TCN; kỷ 1 khai
  // `landmark: 'cự thạch Göbekli Tepe'` và mái nhà dân là lều da thú, tức đồ đá mới tiền-gốm,
  // khoảng 9600 TCN. Lấy Troy cho kỷ này chính là *"gán biển cho một nơi không có biển vì biển đẹp
  // hơn"* — đúng thứ luật (2) cấm. Đàm cũng đã nói rõ đó là GỢI Ý, không phải mệnh lệnh.
  1: {
    country: 'Thổ Nhĩ Kỳ',
    city: 'Göbekli Tepe — sống núi Germuş, nhìn xuống đồng bằng Harran',
    water: 'none',
    side: 'none',
    ground: 'ridge',
    reach: 0,
    width: null,
    note: 'Cự thạch Göbekli Tepe dựng trên sống núi đá vôi KHÔNG có nguồn nước thường xuyên — '
      + 'chọn vì tầm nhìn bao quát và vì nghi lễ, không vì sinh kế. Đây là điều gây bối rối nhất '
      + 'về nơi này, không phải một chỗ trống trong bảng.',
  },

  // KỶ 2 — SÔNG NIN. Ai Cập là nền văn minh SÔNG theo nghĩa đen nhất: không có trận lụt hằng năm
  // đắp phù sa thì không có gì cả. Deir el-Medina là làng thợ xây lăng mộ, nằm trong một thung lũng
  // sa mạc ở BỜ TÂY, nên sông Nin nằm phía ĐÔNG — và cả đời sống làng phụ thuộc vào những chuyến
  // thuyền chở lúa mạch, nước, bia từ bờ bên kia sang. Người sống ở bờ tây, người chết cũng chôn ở
  // bờ tây (phía mặt trời lặn); bờ đông là nơi của người sống và của đền đài.
  2: {
    country: 'Ai Cập',
    city: 'Deir el-Medina — thung lũng bờ tây, đối diện Thebes',
    water: 'river',
    side: 'dong',
    ground: 'flat',
    reach: 3,
    width: 2.2,
    note: 'Làng thợ Deir el-Medina nằm bờ tây sông Nin nên sông ở phía đông; sống bằng thuyền tiếp '
      + 'tế từ bờ bên kia. Trận lụt hằng năm đắp phù sa là lý do duy nhất chỗ này ở được.',
  },

  // KỶ 3 — EUPHRATES VÀ KÊNH DẪN. Ur nằm bên một nhánh Euphrates chạy phía TÂY thành. Nhưng thứ
  // thật sự định nghĩa thành phố Lưỡng Hà không phải con sông mà là MẠNG KÊNH dẫn từ nó ra ruộng:
  // đào kênh, nạo kênh, chia nước — đó là việc mà nhà nước Sumer sinh ra để làm. Ziggurat đứng
  // giữa, kênh vòng quanh.
  //
  // ⚠️ Ur thời đó CÒN là một cảng vịnh Ba Tư (bờ biển đã lùi ~200 km vì phù sa bồi), nhưng khai
  // `sea` cho nó là đúng luật (2) mà sai tinh thần: cái làm nên Ur là nước NGỌT dẫn ra ruộng, không
  // phải nước mặn. Đàm nói thẳng: *"Ai Cập, Iraq = SÔNG, không phải biển."*
  3: {
    country: 'Iraq',
    city: 'Ur — bên nhánh Euphrates, giữa mạng kênh dẫn',
    water: 'river',
    side: 'tay',
    ground: 'flat',
    reach: 2,
    width: 1.6,
    note: 'Ziggurat thành Ur đứng giữa một mạng kênh dẫn từ nhánh Euphrates phía tây. Nhà nước '
      + 'Sumer sinh ra để đào kênh, nạo kênh và chia nước — thành phố nằm ở chỗ dẫn được nước ra '
      + 'ruộng, không nằm ở chỗ đẹp.',
  },

  // KỶ 4 — SÔNG VỊ, BỒN ĐỊA QUAN TRUNG. Trường An đặt ở BỜ NAM sông Vị nên sông nằm phía BẮC. Chọn
  // chỗ này vì bồn địa Quan Trung có bốn cửa ải bao quanh (dễ giữ), có đất hoàng thổ màu mỡ, và vì
  // kinh đô phải nằm GIỮA thiên hạ — bờ biển là ngoại vi, không phải trung tâm. Đây là lý do một đế
  // chế lớn như vậy lại có kinh đô nằm sâu trong lục địa.
  4: {
    country: 'Trung Quốc',
    city: 'Trường An — bờ nam sông Vị, trong bồn địa Quan Trung',
    water: 'river',
    side: 'bac',
    ground: 'bank',
    reach: 5,
    width: 2.6,
    note: 'Kinh đô Trường An đặt bờ nam sông Vị (sông ở phía bắc), trong bồn địa Quan Trung bốn bề '
      + 'là cửa ải. Kinh đô phải nằm GIỮA thiên hạ nên đặt sâu trong lục địa; đấu củng và điện mái '
      + 'chồng là kiến trúc của một trung tâm, không phải của một bến cảng.',
  },

  // ⚠️ KỶ 5 — ĐÃ SỬA 2026-08-19 THEO LỆNH ĐÀM: TỪ "KHÔNG NƯỚC" SANG KHÚC UỐN ÔM QUANH.
  // Bản đầu khai `none` với lý lẽ *"suối Elzbach hẹp quá, ở cỡ một khung hình thành phố thì không
  // đọc ra được"*. Lý lẽ ấy đúng về BỀ RỘNG và sai về CÂU HỎI. Bảng này hỏi *"nằm ở đâu và VÌ
  // SAO"*, mà câu trả lời của Burg Eltz có nước nằm ngay trong nó: suối uốn quanh mỏm đá 70 mét ở
  // BA mặt, nên chỉ còn một dải yên ngựa hẹp phải giữ. Nước chắn ba phía CHÍNH LÀ lý do lâu đài
  // đứng ở đó — bỏ nó đi là bỏ mất câu trả lời rồi giữ lại mỗi câu hỏi.
  //
  // ⚠️ VÀ ĐÂY LÀ CHỖ DUY NHẤT TRONG BẢNG TÔI KHÔNG KIỂM ĐƯỢC TỚI CHUẨN CHUNG — NÓI THẲNG RA.
  // Việc suối ôm ba mặt và chừa một dải yên ngựa là sự thật kiểm được, ai tới cũng thấy. Nhưng
  // dải yên ngựa ấy quay về hướng ĐỊA BÀN nào thì tôi không kiểm được tới mức mà mọi dòng khác
  // trong bảng này được kiểm (sông Vị phía bắc Trường An, Arno phía nam Duomo…). Nên `side: 'dong'`
  // ở đây là hướng khúc uốn ôm sâu nhất, và lối vào khô rơi về phía tây — một lựa chọn, không phải
  // một trích dẫn. Ghi ra để phiên sau đừng đọc nó như một sự thật đã tra.
  5: {
    country: 'Đức',
    city: 'Burg Eltz — mỏm đá trong khúc uốn suối Elzbach, rừng Eifel',
    water: 'meander',
    side: 'dong',
    ground: 'ridge',
    reach: 1,
    width: 0.5,
    note: 'Lâu đài đá Burg Eltz đứng trên mỏm đá 70 mét mà suối Elzbach uốn quanh ba mặt, chỉ chừa '
      + 'một dải yên ngựa hẹp làm lối vào. Nước chắn ba phía cộng vách dốc chính là thứ giữ nó — '
      + 'giữa rừng Eifel, không phải giữa một thung lũng mở.',
  },

  // KỶ 6 — AO LÀNG, VÀ HƯỚNG NAM LÀ MỘT LUẬT CHỨ KHÔNG PHẢI MỘT LỰA CHỌN. Làng Bắc Bộ nằm trên
  // giồng đất cao giữa đồng bằng sông Hồng, quanh là ruộng nước. "Cây đa, bến nước, sân đình" là bộ
  // ba định nghĩa một ngôi làng — và đình làng theo lệ QUAY HƯỚNG NAM, nên mặt nước (ao đình / bến
  // nước) nằm phía NAM, ngay trước mặt đình. Đây là hướng duy nhất trong bảng này được quyết bởi
  // một quy tắc kiến trúc chứ không bởi địa lý.
  6: {
    country: 'Việt Nam',
    city: 'Làng Bắc Bộ — giồng đất giữa đồng bằng sông Hồng',
    water: 'river',
    side: 'nam',
    ground: 'flat',
    reach: 2,
    width: 1.2,
    note: 'Đình làng Bắc Bộ theo lệ quay hướng nam, nên bến nước và ao đình nằm phía nam ngay trước '
      + 'mặt — "cây đa, bến nước, sân đình". Làng đặt trên giồng đất cao giữa đồng bằng sông Hồng, '
      + 'bốn bề là ruộng nước.',
  },

  // KỶ 7 — SÔNG ARNO, PHÍA NAM DUOMO. Firenze nằm trong một lòng chảo cách biển ~80 km; nó giàu lên
  // bằng LEN và NGÂN HÀNG, không bằng hàng hải. Sông Arno chảy phía nam khu trung tâm (Duomo ở bờ
  // bắc), và nó là thứ quay guồng nước cho xưởng chuội len rồi chở hàng xuôi xuống Pisa ra biển.
  // Một thành phố Phục Hưng lớn mà KHÔNG phải cảng — đó chính là điều đáng nói.
  7: {
    country: 'Ý',
    city: 'Firenze — lòng chảo trên sông Arno, cách biển 80 km',
    water: 'river',
    side: 'nam',
    ground: 'bank',
    reach: 1,
    width: 1.4,
    note: 'Vòm Duomo Firenze đứng bờ bắc, sông Arno chảy phía nam. Thành phố giàu bằng len và ngân '
      + 'hàng chứ không bằng hàng hải: Arno quay guồng nước cho xưởng chuội len rồi chở hàng xuôi '
      + 'xuống Pisa mới ra tới biển.',
  },

  // KỶ 8 — CỬA SÔNG TAGUS, VÀ ĐÂY LÀ KỶ DUY NHẤT KHAI `estuary`. Lisboa nằm bờ BẮC sông Tagus đúng
  // chỗ nó phình ra thành "Mar da Palha" (Biển Rơm) trước khi đổ ra Đại Tây Dương — một vũng nước
  // rộng hàng cây số nhưng vẫn kín gió, tức bến đậu tự nhiên tốt nhất châu Âu cho hạm đội đi biển
  // xa. Đoàn thuyền thời Khám Phá nhổ neo từ Belém ở đúng cửa ấy. Thành phố leo lên bảy quả đồi dốc
  // đứng ngay sát mép nước ⇒ `bluff`.
  8: {
    country: 'Bồ Đào Nha',
    city: 'Lisboa — bờ bắc cửa sông Tagus, nơi phình thành Mar da Palha',
    water: 'estuary',
    side: 'nam',
    ground: 'bluff',
    reach: 1,
    width: 6,
    note: 'Bến cảng Lisboa nằm bờ bắc cửa sông Tagus, chỗ sông phình thành Mar da Palha: rộng hàng '
      + 'cây số mà vẫn kín gió, bến đậu tự nhiên tốt nhất cho hạm đội đi biển xa. Đoàn thuyền thời '
      + 'Khám Phá nhổ neo từ Belém. Phố leo bảy quả đồi dốc đứng ngay sát mép nước.',
  },

  // KỶ 9 — SÔNG SEINE, VÀ MỘT HÒN ĐẢO. Paris sinh ra trên Île de la Cité — một hòn đảo giữa sông
  // Seine, tức một chỗ VƯỢT SÔNG dễ giữ. Cả thành phố lớn lên từ cái bến đò ấy. Điện Panthéon nằm
  // trên đồi Sainte-Geneviève ở bờ TRÁI (nam), nhìn xuống sông ở phía... bắc. Nhưng bảng này mô tả
  // thành phố chứ không mô tả một toà nhà: trục Seine chảy từ đông nam lên tây bắc, và hướng đọc ra
  // rõ nhất từ trung tâm là TÂY (sông chảy đi về phía tây, ra Normandie rồi ra biển).
  9: {
    country: 'Pháp',
    city: 'Paris — quanh Île de la Cité, chỗ vượt sông Seine',
    water: 'river',
    side: 'tay',
    ground: 'bank',
    reach: 2,
    width: 1.8,
    note: 'Paris sinh ra trên Île de la Cité, một hòn đảo giữa sông Seine — tức một chỗ vượt sông '
      + 'dễ giữ, và cả thành phố lớn lên từ cái bến đò ấy. Điện Panthéon đứng trên đồi '
      + 'Sainte-Geneviève; sông chảy về phía tây ra Normandie rồi mới ra biển.',
  },

  // KỶ 10 — KÊNH ĐÀO, KHÔNG PHẢI SÔNG. Đây là kỷ duy nhất khai `canal`, và nó là sự thật quan trọng
  // nhất về Manchester công nghiệp: kênh Bridgewater (1761) là kênh công nghiệp thật sự đầu tiên
  // trên thế giới, và nó hạ giá than xuống một nửa chỉ sau một năm. Nhà máy gạch đỏ xây ÁP SÁT mép
  // nước, hàng cẩu thẳng từ sà lan lên tầng trên. Mép nước ở đây do NGƯỜI làm: bờ kè đá thẳng băng,
  // không phải bờ sông gấp khúc ⇒ `reclaimed`. Manchester nằm sâu trong đất liền; bông vải cập
  // cảng Liverpool rồi mới theo kênh vào.
  10: {
    country: 'Anh',
    city: 'Manchester — quanh kênh Bridgewater, sâu trong đất liền',
    water: 'canal',
    side: 'bac',
    ground: 'reclaimed',
    reach: 1,
    width: 0.9,
    note: 'Nhà máy gạch đỏ Manchester xây áp sát kênh Bridgewater — kênh công nghiệp thật sự đầu '
      + 'tiên trên thế giới (1761), hạ giá than một nửa sau một năm. Bờ kè đá thẳng băng do người '
      + 'đào, hàng cẩu thẳng từ sà lan lên tầng trên. Bông vải cập cảng Liverpool rồi mới theo kênh '
      + 'vào.',
  },

  // ⚠️ KỶ 11 — ĐÃ SỬA 2026-08-19: `sea` → `estuary`, GIỮ NGUYÊN hình ảnh bến tàu bờ tây.
  // Đàm chỉ ra `kind` và `note` chỏi nhau, và anh đúng. Hudson ở đoạn Manhattan là một cửa sông
  // CHỊU TRIỀU (nước mặn, thuỷ triều lên tới tận Troy, New York — dân địa lý gọi là "dòng sông
  // chết đuối"), và **bờ New Jersey nhìn thấy rõ ở bên kia** — mà "có bờ bên kia hay không" chính
  // là thứ duy nhất phân biệt `estuary` với `sea` trong bảng này.
  //
  // ⚠️ ĐÃ CÂN NHẮC PHƯƠNG ÁN KIA (giữ `sea`, đổi `note` sang vịnh cảng phía nam — Upper Bay, tượng
  // Nữ Thần, tàu vượt Đại Tây Dương qua cửa Narrows) VÀ BÁC, vì HAI lý do độc lập: (a) của cải
  // thời Mạ Vàng đi qua DÃY BẾN TÀU bờ tây, không qua mặt vịnh — đổi sang vịnh là đổi mất chính
  // cái hình ảnh mang tính kỷ này; (b) vịnh cảng nằm phía NAM, mà đổi kỷ 11 sang `nam` thì bảng
  // thành bắc 3 · nam 5 · đông 4 · tây 2, hiệu 3 — VƯỢT luật cân hướng của Q3. Một dòng sửa cho
  // khớp mà làm hỏng một ràng buộc khác thì chưa phải bản sửa.
  //
  // Manhattan là một hòn đảo giữa hai dòng nước; mép nước là kè gỗ và đá do người đóng, kéo dài
  // thêm ra sông từng thập kỷ ⇒ `reclaimed`.
  11: {
    country: 'Mỹ',
    city: 'New York — Manhattan, dãy bến tàu bờ tây sông Hudson',
    water: 'estuary',
    side: 'tay',
    ground: 'reclaimed',
    reach: 2,
    width: 4,
    note: 'New York thời Mạ Vàng sống bằng dãy bến tàu bờ tây sông Hudson: tàu vượt Đại Tây Dương '
      + 'cập ở đó rồi hàng nối thẳng vào kênh Erie đi tiếp vào lục địa. Manhattan là một hòn đảo, '
      + 'mép nước là kè gỗ đá do người đóng, lấn thêm ra từng thập kỷ; bờ New Jersey nhìn rõ bên kia.',
  },

  // KỶ 12 — SÔNG VOLGA, VÀ ĐÓ LÀ TOÀN BỘ TRẬN ĐÁNH. Stalingrad là một dải phố dài hơn 20 km bám bờ
  // TÂY sông Volga, lưng quay ra sông. Quân tiếp viện và đạn dược vượt sông từ bờ ĐÔNG sang, dưới
  // hoả lực, từng đêm một — nên "sông ở phía đông" không phải một chi tiết trang trí, nó là lý do
  // thành phố giữ được. Bờ tây cao dốc đứng xuống nước ⇒ `bluff`; Volga ở đoạn này rộng hơn một
  // cây số, tức rộng nhất trong mọi kỷ khai `river`.
  12: {
    country: 'Nga',
    city: 'Stalingrad — dải phố bám bờ tây sông Volga',
    water: 'river',
    side: 'dong',
    ground: 'bluff',
    reach: 1,
    width: 3.4,
    note: 'Lô cốt Stalingrad nằm trong dải phố dài bám bờ tây sông Volga, lưng quay ra sông. Tiếp '
      + 'viện vượt sông từ bờ đông sang từng đêm dưới hoả lực — sông ở phía đông chính là lý do '
      + 'thành phố giữ được. Bờ tây cao dốc đứng xuống nước.',
  },

  // KỶ 13 — VỊNH TOKYO. Nhật là quần đảo, và Tokyo mọc quanh một cái vịnh: Edo xưa là làng chài ở
  // cửa vịnh, rồi lấn biển dần suốt bốn trăm năm. Tháp nang Nakagin (1972) thuộc trào lưu Chuyển
  // Hoá Luận, mà công trình nổi tiếng nhất của trào lưu ấy — bản quy hoạch Tokyo 1960 của Tange —
  // là một THÀNH PHỐ DỰNG TRÊN MẶT VỊNH. Vịnh nằm phía ĐÔNG khu trung tâm. Mép nước là đất lấn ⇒
  // `reclaimed`.
  13: {
    country: 'Nhật Bản',
    city: 'Tokyo — quanh vịnh Tokyo, trên đất lấn biển',
    water: 'sea',
    side: 'dong',
    ground: 'reclaimed',
    reach: 4,
    width: null,
    note: 'Tháp nang Nakagin thuộc Chuyển Hoá Luận, mà bản quy hoạch nổi tiếng nhất của trào lưu ấy '
      + 'là một thành phố dựng thẳng trên mặt vịnh Tokyo. Edo xưa là làng chài cửa vịnh rồi lấn '
      + 'biển suốt bốn trăm năm; vịnh nằm phía đông khu trung tâm.',
  },

  // KỶ 14 — ĐẢO QUỐC, EO BIỂN Ở PHÍA NAM. Singapore tồn tại vì đúng một lý do địa lý: nó nằm ngay
  // cửa eo Malacca, chỗ hẹp nhất trên đường biển nối Ấn Độ Dương với Biển Đông. Marina Bay là đất
  // lấn biển quây quanh một vũng nước, nhìn NAM ra eo biển đầy tàu chờ. Cả nước là một hòn đảo và
  // gần như toàn bộ mép nước đô thị là do người đắp ⇒ `reclaimed`.
  14: {
    country: 'Singapore',
    city: 'Singapore — đảo ngay cửa eo Malacca, Marina Bay nhìn nam',
    water: 'sea',
    side: 'nam',
    ground: 'reclaimed',
    reach: 3,
    width: null,
    note: 'Tháp kính Marina Bay đứng trên đất lấn biển quây quanh một vũng nước, nhìn nam ra eo '
      + 'Malacca — chỗ hẹp nhất trên đường biển nối Ấn Độ Dương với Biển Đông. Đảo quốc này tồn tại '
      + 'vì đúng cái eo ấy.',
  },

  // KỶ 15 — VỊNH BA TƯ, NHƯNG THÀNH PHỐ LÙI VÀO TRONG. Dubai sinh ra bên Khor Dubai, một lạch nước
  // mặn ăn sâu vào đất liền: bến của thuyền dhow và của nghề lặn ngọc trai. Vịnh Ba Tư nằm phía
  // BẮC. Nhưng thành phố tháp kính hôm nay KHÔNG bám mép nước — nó chạy dọc một trục đường bộ lùi
  // hẳn vào trong sa mạc, nên `reach` ở đây lớn nhất bảng (6 ô): nước có đó, nhìn thấy được, nhưng
  // xa. Nền cát bằng phẳng, không kè không vách ⇒ `flat`.
  15: {
    country: 'UAE',
    city: 'Dubai — trục đường bộ lùi vào sa mạc, vịnh Ba Tư phía bắc',
    water: 'sea',
    side: 'bac',
    ground: 'flat',
    reach: 6,
    width: null,
    note: 'Dubai sinh ra bên lạch nước mặn Khor Dubai, bến của thuyền dhow và nghề lặn ngọc trai, '
      + 'với vịnh Ba Tư phía bắc. Nhưng Bảo tàng Tương Lai và dãy tháp kính chạy dọc một trục đường '
      + 'bộ lùi hẳn vào sa mạc — nước nhìn thấy được nhưng ở xa nhất bảng.',
  },
};

const WATER_SET = new Set(WATER_KINDS);
const SIDE_SET = new Set(WATER_SIDES);
const GROUND_SET = new Set(GROUND_FORMS);

/**
 * ⚠️ TỪ CHỐI THẲNG, KHÔNG TỰ CHỮA — cùng luật với `isValidGroundFloor` và `isValidStreetStyle`.
 *
 * Tự chữa (kẹp giá trị về khoảng hợp lệ, hoặc rơi về một mặc định) là cách một bảng 15 dòng lặng lẽ
 * thoái hoá về 1 dòng: `MIN_STONE` ở Phase 9D đã nuốt mất phần chênh của bốn kỷ khai bốn số khác
 * nhau, và không có gì đỏ lên. Ở đây còn thêm một lý do: bảng này nói về ĐỊA LÝ, mà một dòng địa lý
 * sai thì `note` bên cạnh nó vẫn kể một câu chuyện rành mạch cho con số sai ấy.
 *
 * ⚠️ BỐN LUẬT LIÊN-TRƯỜNG, và mỗi luật chặn một cách hỏng CỤ THỂ:
 *  (a) `none` ⇒ `side` phải là `'none'`, `reach` = 0, `width` = null. Không thì có một kỷ khô mà
 *      vẫn khai bờ nước ở hướng nào đó — nửa khai nửa không, thứ khó truy nhất.
 *  (b) `sea` ⇒ `width` PHẢI là `null` (ra tới chân trời, không có bờ bên kia). Khai một bề rộng
 *      hữu hạn cho biển là biến biển thành một cái hồ, và ở Bước B nó sẽ dựng ra đúng một cái hồ.
 *  (c) mọi kiểu nước KHÁC `sea` và `none` ⇒ `width` phải là số dương hữu hạn. `null` ở đây nghĩa là
 *      "quên khai", và nếu để lọt thì hình học sẽ nhận `null` rồi ra `NaN` trong im lặng.
 *  (d) có nước ⇒ `side` phải là một trong bốn hướng thật, `reach` ≥ 0 hữu hạn.
 */
export function isValidSetting(st) {
  if (!st || typeof st !== 'object') return false;
  // ⚠️ `length < 1`, KHÔNG phải `< 2`: nước của kỷ 7 tên là **'Ý'** — đúng một ký tự. Bản đầu
  // viết `< 2` như một cách lười để nói "không rỗng", và nó từ chối thẳng một dòng hoàn toàn
  // hợp lệ. Bài test bắt được ngay lần chạy đầu tiên; nếu bảng này không có Ý thì lỗi đã nằm
  // im tới ngày có ai thêm một nước tên một chữ.
  if (typeof st.country !== 'string' || st.country.trim().length < 1) return false;
  if (typeof st.city !== 'string' || st.city.length < 4) return false;
  if (typeof st.note !== 'string' || st.note.length < 40) return false;
  if (!WATER_SET.has(st.water)) return false;
  if (!SIDE_SET.has(st.side)) return false;
  if (!GROUND_SET.has(st.ground)) return false;
  if (!Number.isFinite(st.reach) || st.reach < 0 || st.reach > 12) return false;

  if (st.water === 'none') {
    if (st.side !== 'none') return false;
    if (st.reach !== 0) return false;
    if (st.width !== null) return false;
    return true;
  }

  // Từ đây trở xuống: kỷ CÓ nước.
  if (st.side === 'none') return false;
  if (st.water === 'sea') return st.width === null;
  return Number.isFinite(st.width) && st.width > 0 && st.width <= 12;
}

/** Địa thế của một kỷ. Kỷ lạ → rơi về kỷ mặc định, đúng khuôn `normalizeEraKey` của cả dự án. */
export function getSetting(era) {
  return SETTING_STYLES[normalizeEraKey(era)];
}

/**
 * `true` nếu kỷ này có mặt nước nhìn thấy được.
 *
 * ⚠️ Đây là cửa MỘT CHIỀU mà `outskirts.js` sẽ gọi ở Bước B để biết chỗ nào không được đặt cây
 * (dưới nước thì không có rừng). Nó nằm ở ĐÂY chứ không ở `outskirts.js` vì luật Đàm ra:
 * `settingStyle` → `outskirts`, không bao giờ ngược lại.
 */
export function hasWater(era) {
  return getSetting(era).water !== 'none';
}

/* ────────────────────────────────────────────────────────────────────────────────────────────
 * `worldYaw` — XOAY TỜ GIẤY, KHÔNG XOAY THẾ GIỚI
 *
 * ⚠️ ĐÂY LÀ "THỨ THỨ BA" (Đàm chốt 2026-08-20). Bài toán `TECH_DEBT #57`: 8/14 kỷ có nước nằm ở
 * phía camera QUAY LƯNG LẠI, đo được (bảng §1: kỷ 13 và 14 ra 0,00% và 0,09% khung hình). Hai chỗ
 * dễ đổ lỗi đều KHÔNG sai:
 *   · `side` là SỰ THẬT LỊCH SỬ — sông Vị chảy phía bắc Trường An, sông Arno phía nam Duomo. Sửa
 *     nó để lấy một con số đẹp là bán lịch sử, đúng thứ ADR-025 đã cấm với mặt đường.
 *   · `DEFAULT_YAW` là một HẰNG SỐ MỸ THUẬT đã hiệu chuẩn qua nhiều phase (khung hình, ảnh mốc,
 *     ADR-034 khoá khoảng cách cận cảnh). Sửa nó là giết mọi ảnh nghiệm thu cũ.
 * Thứ SAI là **quan hệ giữa hai hằng số ấy không ai sở hữu** — đúng hình dạng bẫy Phase 7D (mặt
 * đường hứa "nhạt hơn đất" nhưng được viết thành một con số tuyệt đối, nên khi mặt đất đổi ở một
 * phase khác thì lời hứa chết trong im lặng). `worldYaw` là chỗ DUY NHẤT chịu trách nhiệm cho câu
 * *"xoay bản đồ đi bao nhiêu để hướng lịch sử ấy rơi vào tầm nhìn?"* — một trường, một việc.
 *
 * ── VÌ SAO KẾT QUẢ LUÔN LÀ BỘI SỐ CỦA 90°, VÀ VÌ SAO ĐÓ LÀ ĐIỀU MAY ─────────────────────────
 * Lưới thành phố là một HÌNH VUÔNG. Mọi công thức mặt nước hiện có đo khoảng cách ra ngoài lưới
 * bằng `outwardDistances`, tức lấy mốc ở **nửa cạnh = 6 ô**. Nhưng nửa ĐƯỜNG CHÉO của hình vuông
 * ấy là 6√2 ≈ 8,49. Cho nên xoay mặt nước một góc BẤT KỲ khác bội số 90° thì nửa mặt phẳng nước
 * cắt vào GÓC lưới — nước ngập vào trong thành phố, gãy ADR-007 và bất biến "chỉ thêm, không bao
 * giờ dời", mà không có gì đỏ lên. Bội số của 90° thì hình vuông trùng khít chính nó ⇒ phép xoay
 * là ĐÚNG TUYỆT ĐỐI, không cần một số hiệu chỉnh nào, và mọi bài test hình học cũ vẫn nói về đúng
 * cái hình cũ. `buildSetting` TỪ CHỐI THẲNG một `worldYaw` không phải bội số 90° (xem `setting.js`).
 *
 * ── GÓC LỆCH BỐ CỤC: KHÔNG PHẢI MỘT HẰNG SỐ, NÓ ĐƯỢC HÌNH HỌC PHÁT KHÔNG ───────────────────
 * Đàm cho phép ĐÚNG MỘT hằng số lệch: *"nước nằm chính giữa khung đọc ra là cái hồ; lệch một góc
 * mới đọc ra là bờ."* Hoá ra KHÔNG cần khai hằng số nào cả — camera đứng đúng 45°, còn bờ nước chỉ
 * có bốn hướng chính, nên mọi hướng bờ đều lệch **đúng ±45° hoặc ±135°** so với hướng nhìn. Xoay đi
 * một phần tư vòng thì ±135° thành ∓45°: nước lọt vào khung, và nó lệch sẵn 45° — đúng góc Đàm mô
 * tả. Thêm một hằng số lệch nữa lên trên chỉ có thể đẩy nước về CHÍNH GIỮA (thành cái hồ) hoặc ra
 * SAU LƯNG lần nữa. Đo được, xem `PERFORMANCE.md`.
 *
 * ── VÀ VÌ SAO CHỈ XOAY KHI BỜ NƯỚC NẰM SAU LƯNG (xoay ÍT NHẤT có thể) ──────────────────────
 * Bản đầu của công thức này ép cả 14 kỷ về CÙNG một góc tương đối (−45°). Nó chạy, nó đạt cổng 5%,
 * và nó SAI theo một hướng không có bài test nào bắt được: `side` khai bốn hướng khác nhau là để
 * *"15 kỷ không ra cùng một bố cục lệch về một phía"* (luật 3 của bảng này) — mà ép chung một góc
 * tương đối thì **cả 14 kỷ đều hiện nước ở đúng một chỗ trên màn hình**, tức đúng cái luật 3 sinh
 * ra để ngăn, chỉ khác là lần này nó chết ở tầng HÌNH chứ không ở tầng BẢNG.
 * Xoay-ít-nhất giữ được cả hai: 7 kỷ ra một bên khung, 7 kỷ ra bên kia, và **6 kỷ có nước KHÔNG
 * XOAY MỘT ĐỘ NÀO** (`worldYaw = 0`) nên ảnh của chúng trùng từng byte với trước — nhân chứng rẻ
 * nhất cho "trường mới chỉ đụng đúng thứ nó phải đụng".
 * ──────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * Yaw của MẶT bờ nước, theo ĐÚNG quy ước của `orbitPosition` (`x = sin(yaw)·h`, `z = cos(yaw)·h`).
 * `nam` = z lớn = 0 · `dong` = x lớn = +90° · `bac` = z nhỏ = 180° · `tay` = x nhỏ = −90°.
 */
export const SIDE_YAW = Object.freeze({
  nam: 0,
  dong: Math.PI / 2,
  bac: Math.PI,
  tay: -Math.PI / 2,
});

/**
 * Hướng camera mặc định NHÌN RA XA = `DEFAULT_YAW + π` (camera đứng ở đông-nam, nhìn về tây-bắc).
 *
 * ⚠️ ĐÂY LÀ MỘT BẢN CHÉP CÓ CHỦ ĐÍCH, và nó là chỗ duy nhất trong bảng này vi phạm "một luật một
 * công thức" — nên nó phải có dây buộc. Lý do không `import` thẳng từ `orbit.js`: sẽ tạo VÒNG TRÒN
 * `orbit → terrain → setting → settingStyle → orbit`. Cách vá đúng nhất (tách hằng số camera ra
 * một file lá) đòi sửa `orbit.js`, mà Đàm cấm đụng camera ở chương trình này.
 * ⇒ Dây buộc là `settingStyle.test.js`, nó `import` CẢ HAI rồi đòi hai con số bằng nhau — đúng
 * khuôn `settingCountryMismatches()` đang buộc bảng này vào `eraStyle.js`.
 */
export const DEFAULT_VIEW_FAR_YAW = Math.PI / 4 + Math.PI;

/** Đưa một góc về khoảng (−π, π]. */
export function normalizeYaw(a) {
  let x = a % (Math.PI * 2);
  if (x <= -Math.PI) x += Math.PI * 2;
  if (x > Math.PI) x -= Math.PI * 2;
  return x;
}

/**
 * Xoay CẢ ĐỊA THẾ của một kỷ đi bao nhiêu quanh trục đứng, để hướng bờ nước lịch sử rơi vào tầm
 * nhìn của camera mặc định.
 *
 * Lưới 12×12 và vị trí công trình KHÔNG xoay (chúng không đọc trường này) — xoay chúng là gãy
 * ADR-007. Thứ xoay theo là địa hình · vùng quê · rặng núi chân trời, vì cả ba đều suy ra hình
 * dạng của mình từ `insetAt`/`blendAt`/`depthAt` của lớp địa thế.
 *
 * @param {number} era
 * @param {number} [viewFar] hướng nhìn ra xa (đưa vào được để bài test bơm góc khác)
 * @returns {number} góc xoay, radian, trong (−π, π]. Kỷ khô → 0.
 */
export function worldYaw(era, viewFar = DEFAULT_VIEW_FAR_YAW) {
  const st = getSetting(era);
  const mat = SIDE_YAW[st.side];
  // Kỷ khô (`side: 'none'`) không có bờ nào để quay ra ⇒ 0, và ảnh của nó phải TRÙNG TỪNG BYTE với
  // trước khi có trường này. Đó là nhân chứng rẻ nhất cho "trường mới không đụng gì ngoài mặt nước".
  if (mat === undefined) return 0;

  // Bờ nước lệch bao nhiêu so với hướng camera đang nhìn. Dương/âm = lệch về hai bên khác nhau, và
  // DẤU ẤY PHẢI GIỮ NGUYÊN qua phép xoay — nó chính là thứ làm 14 kỷ không ra cùng một bố cục.
  const lech = normalizeYaw(mat - viewFar);

  // Đã nằm trong tầm nhìn ⇒ KHÔNG ĐỘNG VÀO. Đây là nửa quan trọng nhất của hàm: 6 kỷ đi qua đây và
  // giữ nguyên ảnh cũ từng byte. Một công thức "chuẩn hoá tất cả về một góc" sẽ xoay cả sáu kỷ ấy
  // một cách vô ích, và mỗi lần xoay vô ích là một lần vứt bỏ một tấm ảnh mốc.
  if (Math.abs(lech) <= Math.PI / 2 + 1e-9) return 0;

  // Nằm sau lưng ⇒ xoay ĐÚNG MỘT phần tư vòng, về phía gần nhất. Với bốn hướng bờ và camera 45°,
  // `lech` chỉ có thể là ±135°, nên kết quả luôn là ∓45° — trong khung, và lệch sẵn một góc.
  // ⚠️ Một phần tư vòng chứ không phải nửa vòng: hình vuông trùng khít chính nó ở CẢ HAI, nhưng
  // nửa vòng là xoay nhiều gấp đôi mức cần, mà xoay càng nhiều thì càng nhiều thứ đổi chỗ.
  return lech > 0 ? -Math.PI / 2 : Math.PI / 2;
}

/**
 * Đếm bảng theo BA TRỤC, một công thức duy nhất cho cả bảng thật lẫn bảng giả của đối chứng.
 *
 * ⚠️ Vì sao nhận `styles` làm tham số thay vì đọc thẳng `SETTING_STYLES`: đối chứng của
 * `settingStyle.test.js` phải bơm được một bảng HỎNG vào (13 kỷ cùng một hướng · 8 kỷ có biển) rồi
 * đòi phép đếm bắt được. Nếu bài test tự viết lại vòng lặp đếm thì luật đếm có hai công thức, và
 * hai công thức tương đương trên giấy gần như luôn lệch nhau ở biên — đúng bài học `daylight.test.js`
 * (một chỗ viết `h < 60`, chỗ kia có hàm biết quấn vòng màu, và chỗ viết cẩu thả hơn lại thắng).
 *
 * Trả về ba bảng đếm; hướng `'none'` của kỷ khô KHÔNG lọt vào `side` (nó không phải một hướng, và
 * để nó vào thì hai kỷ khô sẽ trông như một hướng đang dẫn đầu).
 */
export function summarizeSettings(styles = SETTING_STYLES) {
  const water = {};
  const side = {};
  const ground = {};
  for (const st of Object.values(styles)) {
    water[st.water] = (water[st.water] ?? 0) + 1;
    ground[st.ground] = (ground[st.ground] ?? 0) + 1;
    if (st.water !== 'none') side[st.side] = (side[st.side] ?? 0) + 1;
  }
  return { water, side, ground };
}

/**
 * Đối chiếu `country` của bảng này với `eraStyle.js`. Xuất ra để BÀI TEST gọi — mã sản phẩm không
 * cần, nhưng một sợi dây buộc mà chỉ tồn tại trong bài test thì bài test phải gọi được nó bằng
 * đúng một công thức, không phải viết lại vòng lặp so sánh ở mỗi chỗ cần.
 */
export function settingCountryMismatches() {
  const lệch = [];
  for (const era of Object.keys(SETTING_STYLES).map(Number)) {
    const cua_bang = SETTING_STYLES[era].country;
    const cua_eraStyle = getEraStyle(era)?.country;
    if (cua_bang !== cua_eraStyle) lệch.push({ era, cua_bang, cua_eraStyle });
  }
  return lệch;
}
