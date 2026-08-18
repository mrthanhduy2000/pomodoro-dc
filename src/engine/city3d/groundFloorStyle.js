/**
 * groundFloorStyle.js — BẢNG TẦNG TRỆT 15 KỶ: cái cửa để bước vào, và MỘT đặc trưng mặt phố.
 *
 * ⚠️ VÌ SAO BẢNG NÀY CHUYỂN RA KHỎI `eraStyle.js` (2026-08-18) — VÀ NÓ ĐẢO NGƯỢC MỘT LÝ LẼ CŨ.
 *
 * Lúc Phase 10 dựng bảng này, nó nằm trong `eraStyle.js` kèm một lý do nghe rất hợp: *"mỗi dòng
 * phải trả lời «công trình có thật nào ở nước ấy trông như vậy?», nên câu trả lời
 * (`country`/`landmark`) phải nằm trong tầm mắt, không phải ở một file khác phải mở ra đối chiếu."*
 *
 * Lý lẽ ấy **sai theo đúng cách mà dự án đã tự bác bỏ ba lần rồi**: `floraStyle.js` · `streetStyle.js`
 * · `horizon.js` đều là bảng 15 kỷ nằm ở file riêng, và cả ba đều buộc vào `country` — **bằng một
 * BÀI TEST, không bằng khoảng cách vật lý trên màn hình**. Một ràng buộc được giữ bởi "tiện mắt"
 * là một ràng buộc không được giữ bởi gì cả; nó chỉ đúng chừng nào người viết còn nhớ nhìn lên.
 * Bài test `KHOÁ VÀO country` đã tồn tại từ đầu và nó vẫn chạy y nguyên sau khi bảng dọn nhà —
 * đó chính là bằng chứng rằng thứ đang giữ ràng buộc chưa bao giờ là vị trí file.
 *
 * Đàm chốt, và anh gọi đúng tên vấn đề: **đây là chuyện QUY ƯỚC, không phải chuyện file dài**.
 * Dự án đã có khuôn "bảng ↔ hình" ba lần (`floraStyle.js ↔ flora.js` · `streetStyle.js ↔
 * terrainMesh.js` · `horizon.js`), nên `eraStyle.js` ôm bảng tầng trệt là **chỗ lệch khuôn duy
 * nhất** — và Phase 11 sắp thêm một bảng 15 dòng nữa (mái). Sửa quy ước TRƯỚC khi thêm bảng thứ
 * hai thì tốn một lần; sửa sau thì tốn hai, và ở giữa có một phase làm theo khuôn sai.
 *
 * ⇒ `eraStyle.js` từ nay giữ đúng phần NGỮ PHÁP CHUNG của kỷ: `country` · `landmark` · `massScale`
 * · `spread` · `storyHeight` · `roof`/`vernacularRoof` · `windows` · `motifs` · vật liệu · màu.
 * Hình học tầng trệt vẫn ở `groundFloor.js`; `buildingSpec.js` chỉ ĐỌC.
 *
 * ── HAI LỖI THẬT MÀ BẢNG NÀY SỬA (đo được, đã chạy trên production nhiều tháng) ──────────────
 * (a) kỷ 1 và 2 khai `windows: 'none'` nên `emitWindows` thoát sớm và **hai kỷ ấy không hề có
 *     cửa** — một công trình không có lối vào là một khối đặc;
 * (b) cửa cũ rộng đúng **0,14** cho cả kỳ quan rộng 1,4 lẫn nhà dân rộng 0,45, tức lần thứ ba của
 *     cái bẫy "số tuyệt đối áp lên những khối chênh nhau ba lần".
 *
 * ⚠️ BẮT BUỘC CẢ 15 KỶ, và từ Bước 2 (2026-08-18) **cả 15 dòng đều khai đủ số đo** — không còn giá
 * trị nào nghĩa là "chưa làm". `groundFloor.test.js` khoá đúng vế đó, và `isValidGroundFloor`
 * **TỪ CHỐI THẲNG** dòng thiếu trường thay vì tự chữa. Tự chữa là cách một bảng 15 dòng lặng lẽ
 * thoái hoá về 1 dòng (bẫy `MIN_STONE` ở Phase 9D).
 *
 * ⚠️ BỐN KỶ KHAI `feature: 'none'` (1 · 3 · 5 · 12) VÀ ĐÓ LÀ BỐN CÂU TRẢ LỜI KHÁC NHAU, KHÔNG PHẢI
 * BỐN CHỖ TRỐNG. Lều da thú thì chưa có gì để gắn lên mặt tường (kỷ 1); nhà Ur và nhà Dubai quay
 * hết vào SÂN TRONG nên mặt phố cố ý là tường trơn (kỷ 3, và `vernacularFeature` của kỷ 15); lâu
 * đài và lô cốt thì CỐ Ý không gắn, vì mọi thứ nhô ra là chỗ bám cho đối phương (kỷ 5, 12). Đàm
 * nói thẳng: *"Kỷ nào KHÔNG có đặc trưng nào thì khai rõ là 'không có', đừng bịa cho đủ mâm."*
 * Mỗi chữ `'none'` ở đây đều có một câu giải thích ngay bên trên nó; `'none'` mà không kèm lý do
 * mới là chỗ chưa làm.
 *
 * Xem ADR-026 (bảng ra đời) · ADR-027 (trải ra 15 kỷ) · ADR-029 (chuyển ra file riêng).
 */

import { normalizeEraKey } from './eraStyle.js';

/**
 * 15 dòng. Mỗi dòng buộc vào `country` mà `eraStyle.js` khai — **CÓ TEST BẮT**, để hai bảng không
 * trôi khỏi nhau (cùng cơ chế đang giữ `floraStyle` · `streetStyle` · `horizon`).
 */
export const GROUND_FLOOR_STYLES = {
  // ⚠️ TẦNG TRỆT — THỜI CHƯA CÓ BẢN LỀ. Đàm dặn: *"kỷ 1–2 (đồ đá): cửa phải THÔ SƠ đúng thời —
  // khung gỗ, tấm da, rèm cỏ. Đừng bịa cho sang."* `flap` là tấm da thú căng treo trên thanh
  // ngang, vén sang bên khi ra vào — bản lề kim loại còn cách đây hơn năm nghìn năm.
  // `frame: 'none'` là câu trả lời ĐÚNG chứ không phải chỗ trống: cái lều không có khuôn cửa,
  // tấm da rủ thẳng từ mép mái xuống. `steps: 0`, `recess: 0` — nền lều là chính mặt đất.
  // ⚠️ `feature`/`vernacularFeature` đều `'none'`, và đây là chỗ Đàm nói thẳng: *"Kỷ nào KHÔNG
  // có đặc trưng nào (thời đồ đá) thì khai rõ là 'không có', đừng bịa cho đủ mâm."* Göbekli Tepe
  // có phiến cửa đá khoét lỗ, nhưng đó là một LỖ trên khối đá — không phải hiên, không phải ô
  // văng, không phải thứ gì trong danh sách. Gán bừa một cái cho có là nói dối để bảng trông đầy.
  1: {
    note: 'lều da thú Göbekli Tepe — tấm da căng treo trên thanh ngang, không khuôn, không bậc; mặt tiền hoàn toàn trống',
    door: 'flap', doorWidth: 0.40, doorTall: 0.52, frame: 'none', recess: 0.0, steps: 0,
    feature: 'none', vernacularFeature: 'none',
  },
  // ⚠️ TẦNG TRỆT — làng thợ Deir el-Medina, ngôi làng Ai Cập được đào kỹ nhất. Cửa nhà thợ là
  // một lanh tô GỖ (gỗ quý ở xứ không có rừng, nên nó là thứ đắt nhất căn nhà) sơn đỏ có khắc
  // tên chủ, và che bằng một tấm CHIẾU SẬY. Vì vậy: `flap` như kỷ 1 nhưng `frame: 'wood'` — đây
  // đúng là chỗ hai kỷ đồ đá tách khỏi nhau, một bên chưa có khuôn cửa, một bên khuôn cửa là
  // món tài sản đáng khắc tên.
  // ⚠️ `vernacularFeature: 'awning'` = mành sậy chắn nắng dựng trước cửa — có trong tranh tường
  // và trong chính nền nhà đào được. `feature: 'none'`: đền Ai Cập có tháp môn (pylon), nhưng
  // tháp môn là KHỐI TƯỜNG nghiêng chứ không phải một chi tiết gắn lên tầng trệt.
  2: {
    note: 'làng thợ Deir el-Medina — lanh tô gỗ sơn đỏ khắc tên chủ, chiếu sậy che cửa; nhà thợ dựng mành sậy chắn nắng',
    door: 'flap', doorWidth: 0.32, doorTall: 0.64, frame: 'wood', recess: 0.15, steps: 0,
    feature: 'none', vernacularFeature: 'awning',
  },
  // ⚠️ TẦNG TRỆT — ziggurat Ur. Thứ ai cũng nhận ra ở công trình này KHÔNG phải cái cửa mà là
  // BA VẾ BẬC LỚN chạy thẳng lên khối đầu tiên, nên `steps: 3` (kịch trần) là con số mang bản
  // sắc của cả kỷ. Cửa Lưỡng Hà là cửa hai cánh XOAY TRÊN TRỤC ĐÁ (chưa có bản lề, nhưng đã có
  // cối trục — một bước tiến thật so với kỷ 1–2), và hai bên khuôn dựng BÓ SẬY — bó sậy dựng
  // cạnh cửa chính là chữ tượng hình của nữ thần Inanna, tức nó là hình ảnh người Sumer tự chọn
  // để nói "đây là lối vào". `frame: 'wood'` là vai gần nhất với bó sậy/gỗ chà là.
  // ⚠️ `vernacularFeature: 'none'` — nhà Ur quay hết vào SÂN TRONG, mặt phố cố ý là tường trơn
  // không cửa sổ để giữ mát và giữ kín. Mặt tiền trống ở đây là một quyết định kiến trúc, không
  // phải chỗ chưa làm.
  3: {
    note: 'ziggurat Ur — ba vế bậc lớn dẫn lên, cửa hai cánh xoay trên cối đá, hai bó sậy dựng bên khuôn; nhà Ur quay vào sân trong nên mặt phố trơn',
    door: 'double', doorWidth: 0.26, doorTall: 0.60, frame: 'wood', recess: 0.30, steps: 3,
    feature: 'none', vernacularFeature: 'none',
  },
  // ⚠️ TẦNG TRỆT — điện cung đình Trung Hoa. Ba thứ, đều là quy chế chứ không phải trang trí:
  // (a) `steps: 3` — 台基, bệ đá nâng cả toà điện lên; số bậc và chiều cao bệ bị luật quy định
  // theo phẩm cấp, nên bệ cao chính là cách công trình tự xưng địa vị. (b) `panel` = 格扇门,
  // cửa cách phiến — bộ cánh gỗ chạm lưới, cùng HỌ với cửa bức bàn kỷ 6 (đúng: nghề mộc Việt
  // thừa hưởng từ đây), khác ở chỗ nó nhiều tấm hơn và nằm trong hàng hiên sâu hơn.
  // (c) `feature: 'porch'` = 廊, hàng hiên cột sơn son chạy hết mặt trước — bộ phận định nghĩa
  // kiến trúc gỗ Trung Hoa, và `recess` chính là độ sâu ấy.
  // ⚠️ Tách hạng: phố buôn không có hiên cột (không đủ đất, và không được phép — hiên cột là
  // quy chế của công trình có phẩm cấp), chỉ có 雨搭, mái vải che hàng ⇒ `awning`.
  //
  // ⚠️⚠️ BA CON SỐ DƯỚI ĐÂY LÀ THỨ TÁCH KỶ 4 KHỎI KỶ 6, VÀ CHÚNG ĐƯỢC ĐO CHỨ KHÔNG ĐOÁN. Bản
  // đầu của Bước 2 khai `doorWidth: 0.38 · recess: 0.50` và phép đo 105 cặp báo **kỷ 4 với kỷ 6
  // chỉ khác nhau 1/8 trục** — cùng `panel`, cùng `wood`, cùng `porch`, cùng `awning`, chỉ chênh
  // một bậc thềm. Điều đó ĐÚNG về mặt họ hàng (nghề mộc Việt thừa hưởng từ đây) nhưng nó bỏ mất
  // đúng thứ phân biệt hai nền: **điện Trung Hoa NÂNG mình lên và LÙI vào; đình Việt HẠ mình
  // xuống và ĐƯA ra.**
  //   · `steps: 3` (kỷ 6 chỉ 2) — 台基 nâng cả toà điện; đình làng ngồi thấp, thứ người ta bước
  //     qua là NGƯỠNG CỬA chứ không phải một vế thang.
  //   · `recess: 0.62` (kỷ 6 chỉ 0.35) — cửa cách phiến nằm ở CUỐI một gian hiên trọn vẹn, tức
  //     lùi vào gần đúng một bước cột. Bức bàn của đình thì nằm ngay mặt ngoài giữa hai cột
  //     hiên, vì nó phải THÁO RỜI ĐƯỢC để ngày hội mở toang cả mặt trước.
  //   · `doorWidth: 0.41` (kỷ 6 chỉ 0.34) — 格扇门 lấp KÍN gian giữa, thường 4–6 tấm liền; đây
  //     là bộ cửa rộng nhất trong toàn bộ 10 kỷ tiền-hiện-đại, và bề rộng ấy chính là quy chế.
  // ⇒ Sau khi sửa: 3/8 trục. KHÔNG chỉnh kỷ 6 để lấy khoảng cách — hướng mỹ thuật của kỷ 6 Đàm
  // đã duyệt ở Bước 1; kỷ nào mới thì kỷ ấy phải tự tìm chỗ đứng của mình.
  4: {
    note: 'điện cung đình — bệ đá ba bậc theo phẩm cấp, cửa cách phiến chạm lưới lấp kín gian giữa, hàng hiên cột sơn son chạy hết mặt trước; phố buôn chỉ có mái vải che hàng',
    door: 'panel', doorWidth: 0.41, doorTall: 0.66, frame: 'wood', recess: 0.62, steps: 3,
    feature: 'porch', vernacularFeature: 'awning',
  },
  // ⚠️ TẦNG TRỆT — lâu đài Burg Eltz. Cổng lâu đài là bài toán NGƯỢC với mọi kỷ khác: mục tiêu
  // không phải mời vào mà là chặn lại. Vì vậy `doorWidth: 0.22` (hẹp nhất trong 15 kỷ — vừa một
  // người, không vừa một đám đông), `recess: 0.55` (lối cuốn xuyên qua bức tường dày, đủ chỗ
  // cho cửa lật và song chắn), và `steps: 0` — bậc thềm trước cổng là chỗ đứng cho kẻ tấn công,
  // nên lâu đài không làm. Ba con số ấy đều là quyết định phòng thủ, không phải mỹ thuật.
  // ⚠️ `feature: 'none'`: cổng lâu đài không gắn thêm gì lên mặt tường; thứ nhô ra là tháp cổng,
  // mà tháp cổng là một KHỐI của công trình chứ không phải chi tiết tầng trệt.
  // `vernacularFeature: 'shutters'` = Fensterläden, cửa chớp gỗ sơn của nhà Fachwerk trong làng
  // dưới chân lâu đài — vẫn thấy nguyên ở Eltz và khắp Rheinland-Pfalz.
  5: {
    note: 'lâu đài Burg Eltz — cổng cuốn hẹp xuyên tường dày, không bậc thềm để không cho kẻ tấn công chỗ đứng; nhà Fachwerk trong làng có cửa chớp gỗ sơn',
    door: 'double', doorWidth: 0.22, doorTall: 0.70, frame: 'stone', recess: 0.55, steps: 0,
    feature: 'none', vernacularFeature: 'shutters',
  },
  // ⚠️ TẦNG TRỆT. Mỗi con số ở đây trả lời đúng câu hỏi mà `country`/`landmark` đặt ra:
  // *"công trình có thật nào ở nước ấy trông như vậy?"*
  // `panel` = **cửa bức bàn** — bộ ván ghép tháo rời được từng tấm, cửa của CẢ đình làng lẫn nhà
  // ống phố cổ (nên nó không tách theo hạng, xem `groundFloor.js`). `steps: 2` vì **ngưỡng cửa
  // cao** là nét Việt ai cũng nhận ra: vào đình là BƯỚC QUA chứ không bước vào, và đình thì đứng
  // trên nền đá kê thật chứ không phải một cái bệ trang trí.
  // ⚠️ Đàm nêu "hiên trước có cột, mái đua thấp" — đó là HAI thứ thuộc HAI loại nhà, không phải
  // một thứ tả hai lần: đình có hàng hiên cột gỗ sâu (`porch`); nhà ống phố cổ mặt tiền chỉ rộng
  // ~3m, không đủ đất dựng hiên cột, nên chỉ có mái đua thấp che mặt hàng (`awning`).
  6: {
    note: 'đình làng Bắc Bộ — cửa bức bàn, ngưỡng cửa cao, hàng hiên cột gỗ; nhà ống phố cổ chỉ có mái đua thấp',
    door: 'panel', doorWidth: 0.34, doorTall: 0.62, frame: 'wood', recess: 0.35, steps: 2,
    feature: 'porch', vernacularFeature: 'awning',
  },
  // ⚠️ TẦNG TRỆT — Firenze. `feature: 'arcade'` = LOGGIA, và đây là lựa chọn có địa chỉ chính
  // xác: Ospedale degli Innocenti, hàng vòm cuốn trên cột mảnh, do CHÍNH Brunelleschi — người
  // dựng cái vòm Duomo mà kỷ này lấy làm landmark — thiết kế. Không phải "kiểu Ý chung chung":
  // cùng một kiến trúc sư, cùng một thành phố, cách nhau vài trăm mét.
  // Cửa: `double` hai cánh gỗ nặng trong khuôn ĐÁ (`frame: 'stone'`, đá pietra serena xám xanh
  // đặc trưng Toscana), `steps: 2` — bậc đá trước cửa palazzo là chỗ ngồi công cộng, người
  // Firenze còn có tên riêng cho nó.
  // ⚠️ Tách hạng: nhà phố Firenze mặt tiền hẹp, không đủ đất làm loggia; cửa hàng che bằng ô văng
  // vải ⇒ `awning`.
  7: {
    note: 'Firenze — loggia vòm cuốn kiểu Ospedale degli Innocenti của chính Brunelleschi, cửa hai cánh gỗ trong khuôn đá pietra serena, bậc đá ngồi được; nhà phố chỉ có ô văng vải',
    door: 'double', doorWidth: 0.28, doorTall: 0.80, frame: 'stone', recess: 0.40, steps: 2,
    feature: 'arcade', vernacularFeature: 'awning',
  },
  // ⚠️ TẦNG TRỆT — Lisboa. `arcade` lần thứ hai liên tiếp, và tôi GIỮ NGUYÊN thay vì đổi cho
  // bảng trông đa dạng: Praça do Comércio là một hình chữ U toàn vòm cuốn hướng ra sông Tejo, và
  // nó là landmark mà chính dòng này khai. Bồ Đào Nha học cổ điển từ Ý — hai kỷ liền nhau giống
  // nhau ở đây là SỰ THẬT lịch sử, không phải lỗi bảng. Đổi nó thành thứ khác cho đỡ trùng chính
  // là "bịa cho đủ mâm" theo chiều ngược lại.
  // Chúng tách nhau ở NĂM trục khác: bậc (1 ↔ 2) · độ hõm (0,20 ↔ 0,40) · bề rộng cửa · chiều
  // cao cửa · và đặc trưng nhà dân (ban công ↔ ô văng).
  // ⚠️ `vernacularFeature: 'balcony'` = varanda sắt nhỏ của nhà Pombalino — kiểu nhà dựng lại
  // sau động đất 1755, có ban công sắt hẹp ở mỗi tầng, thấy khắp Baixa và Alfama.
  8: {
    note: 'Praça do Comércio — dãy vòm cuốn chạy suốt mặt tiền hướng sông Tejo, cửa hai cánh khuôn đá vôi; nhà Pombalino có ban công sắt hẹp từng tầng',
    door: 'double', doorWidth: 0.24, doorTall: 0.72, frame: 'stone', recess: 0.20, steps: 1,
    feature: 'arcade', vernacularFeature: 'balcony',
  },
  // ⚠️ TẦNG TRỆT. `double` = **porte cochère** — cửa hai cánh cao cho xe ngựa chui qua vào sân
  // trong; đây là bộ phận định nghĩa mặt tiền chung cư Haussmann, và `doorTall: 0.86` cao nhất
  // trong ba kỷ đã nghiên cứu chính vì lý do ấy (cửa phải lọt cả cỗ xe, không chỉ lọt người).
  // `frame: 'stone'` vì khuôn cửa là đá vôi cắt — cùng vật liệu tường (`wallMaterial: 'stone'`),
  // đúng cách Paris xây.
  // ⚠️ `feature` vs `vernacularFeature`: **ban công sắt uốn chạy LIỀN hết mặt tiền tầng hai** là
  // một điều khoản trong luật quy hoạch Haussmann, nên nó rộng bằng thân nhà chứ không rộng bằng
  // cái cửa. Nhà nhỏ mặt phố thì thứ nhận ra được lại là **persiennes** — cửa chớp gỗ mở áp vào
  // tường. Hai thứ này ngoài đời không đi cùng nhau ở cùng một hạng nhà ⇒ tách.
  9: {
    note: 'chung cư Haussmann Paris — porte cochère hai cánh cao khuôn đá, ban công sắt uốn liền tầng hai; nhà nhỏ có cửa chớp',
    door: 'double', doorWidth: 0.30, doorTall: 0.86, frame: 'stone', recess: 0.25, steps: 1,
    feature: 'balcony', vernacularFeature: 'shutters',
  },
  // ⚠️ TẦNG TRỆT — Manchester thời công nghiệp. `feature: 'sign'`: nhà máy bông Manchester viết
  // TÊN HÃNG cỡ lớn lên đầu hồi, và cái tên ấy là thứ đọc được từ đầu phố — đúng chức năng mà
  // biển hiệu sinh ra. (Trùng `sign` với kỷ 13 là hai nền văn hoá cùng nghĩ ra một giải pháp cho
  // cùng một bài toán; chúng tách nhau ở cửa, khuôn, độ hõm và đặc trưng nhà dân.)
  // Cửa: `panel` = cửa bốn ô ván của nhà thợ Victoria, kiểu cửa được sản xuất hàng loạt đầu tiên
  // trong lịch sử — rất hợp với một kỷ lấy nhà máy làm landmark. `frame: 'stone'` vì nhà gạch đỏ
  // Manchester đóng khuôn cửa bằng đá sa thạch, tương phản cố ý với tường gạch.
  // `steps: 1` = bậc đá trước cửa, thứ mà phụ nữ khu thợ chà trắng mỗi sáng bằng đá donkey —
  // một tập tục có tên riêng, tức cái bậc ấy thật sự là một bộ phận ai cũng thấy.
  // ⚠️ `vernacularFeature: 'none'` và đây là câu trả lời CÓ NỘI DUNG: nhà dãy lưng-kề-lưng mở
  // cửa THẲNG ra vỉa hè, không sân, không hiên, không gì che. Chính sự trơ trụi ấy là thứ các
  // phóng sự thế kỷ 19 mô tả, và nó tương phản mạnh với kỷ 9 Paris ngay trước đó.
  10: {
    note: 'Manchester công nghiệp — tên hãng cỡ lớn trên đầu hồi nhà máy, cửa bốn ô ván khuôn đá sa thạch, bậc đá chà trắng mỗi sáng; nhà dãy thợ mở thẳng ra vỉa hè, không che gì',
    door: 'panel', doorWidth: 0.26, doorTall: 0.68, frame: 'stone', recess: 0.15, steps: 1,
    feature: 'sign', vernacularFeature: 'none',
  },
  // ⚠️ TẦNG TRỆT — New York thời Mạ Vàng. Đàm nêu thẳng hướng: *"kỷ 11 Mỹ → sảnh kính cao hai
  // tầng, bậc đá rộng."* `glazed` + `steps: 3` + `doorTall: 0.90` (cao nhất 15 kỷ) chính là ba
  // con số ấy. Sảnh cao hai tầng là thứ ngân hàng và khách sạn Mạ Vàng dùng để phô sự bề thế:
  // tiền sảnh phải LỚN HƠN nhu cầu đi lại, đó mới là thông điệp.
  // `feature: 'awning'` = MARQUEE, mái đón bằng kim loại và kính đua từ cửa ra tận mép đường —
  // bộ phận đặc New York tới mức tên nó đi vào tiếng Anh phổ thông.
  // ⚠️ `vernacularFeature: 'balcony'` = CẦU THANG THOÁT HIỂM SẮT. Không phải ban công để ngắm
  // cảnh: luật Tenement House Act bắt mọi nhà cho thuê phải có, nên nó phủ kín mặt tiền các khu
  // lao động và trở thành hình ảnh nhận diện của New York hơn bất cứ thứ gì khác. Hình học của
  // nó — sàn đua ra + lan can + congxon đỡ — đúng bằng ban công, nên dùng lại chứ không thêm
  // đặc trưng mới.
  11: {
    note: 'New York Mạ Vàng — sảnh kính cao hai tầng, bậc đá rộng, mái đón marquee đua ra mép đường; nhà cho thuê phủ kín cầu thang thoát hiểm sắt theo luật Tenement House Act',
    door: 'glazed', doorWidth: 0.42, doorTall: 0.90, frame: 'stone', recess: 0.20, steps: 3,
    feature: 'awning', vernacularFeature: 'balcony',
  },
  // ⚠️ TẦNG TRỆT — lô cốt và khối nhà Xô Viết. `recess: 0.65` là con số SÂU NHẤT của 15 kỷ sau
  // genkan Nhật, và lý do hoàn toàn khác: lỗ châu mai và cửa lô cốt thụt sâu vào khối bê tông để
  // mảnh đạn không xiên thẳng vào trong. `frame: 'none'` cũng vậy — bê tông đổ liền khối thì
  // không có khuôn cửa rời; cái lỗ CHÍNH LÀ hình dạng ván khuôn.
  // `feature: 'none'`: một công sự không gắn gì lên mặt ngoài, mọi thứ nhô ra đều là chỗ bám cho
  // đối phương. Lần thứ tư trong bảng này câu trả lời là "không có", và cả bốn lần đều có lý do
  // riêng chứ không phải cùng một chỗ trống: lều thì chưa có gì để gắn (kỷ 1), nhà Ur quay vào
  // trong (kỷ 3), lâu đài và lô cốt thì CỐ Ý không gắn (kỷ 5, 12).
  // ⚠️ `vernacularFeature: 'awning'` = козырёк, tấm bê tông đua ra trên cửa mọi khối nhà ở Xô
  // Viết — có ở toàn bộ khối panel từ Kaliningrad tới Vladivostok, tức nó là chi tiết được nhân
  // bản nhiều nhất trong lịch sử kiến trúc nhà ở.
  12: {
    note: 'công sự và khối nhà Xô Viết — cửa thép thụt sâu trong bê tông đổ liền khối, không khuôn rời, mặt ngoài không gắn gì; khối nhà ở có tấm bê tông козырёк đua trên cửa',
    door: 'double', doorWidth: 0.28, doorTall: 0.56, frame: 'none', recess: 0.65, steps: 2,
    feature: 'none', vernacularFeature: 'awning',
  },
  // ⚠️ TẦNG TRỆT. `recess: 0.85` là **hốc sâu nhất** trong ba kỷ đã nghiên cứu, và nó có tên
  // riêng: **genkan** — khoảng lùi vào có bậc, chỗ đổi giày, ranh giới trong/ngoài của mọi ngôi
  // nhà Nhật. `steps: 1` chính là cái bậc ấy. `sliding` = **cửa lùa** (hikido): hai tấm TRƯỢT
  // chồng mép, nên chúng nằm ở hai độ sâu khác nhau — đó mới là thứ phân biệt cửa lùa với cửa
  // hai cánh, không phải bề rộng.
  // ⚠️ Tách hạng: **biển hiệu dọc** (kanban) bám mặt tiền là thứ đọc ra "phố Nhật" ngay ở cỡ vài
  // chục điểm ảnh vì nó phá thế nằm ngang của mọi thứ khác; còn quán nhỏ thì treo **mành che**
  // (noren) rủ xuống trước cửa. Cả hai đều là Đàm nêu, và chúng thuộc hai cỡ công trình khác nhau.
  13: {
    note: 'phố Nhật — genkan lùi sâu có bậc đổi giày, cửa lùa hai tấm chồng mép, biển hiệu dọc; quán nhỏ treo mành che',
    door: 'sliding', doorWidth: 0.30, doorTall: 0.58, frame: 'wood', recess: 0.85, steps: 1,
    feature: 'sign', vernacularFeature: 'awning',
  },
  // ⚠️ TẦNG TRỆT — Singapore. `feature: 'arcade'` ở đây là **five-foot way / 五脚基**, và nó là
  // ca mạnh nhất trong ba ca arcade của bảng: quy hoạch Raffles năm 1822 BẮT BUỘC mọi nhà phố
  // chừa một lối đi có mái rộng năm bộ Anh trước cửa, nên nó không phải một lựa chọn thẩm mỹ mà
  // là một điều khoản luật đã định hình toàn bộ mặt phố Singapore suốt hai trăm năm. Ở xứ vừa
  // nắng gắt vừa mưa rào thì lối đi có mái là hạ tầng, không phải trang trí.
  // Cửa: `glazed` — sảnh kính tháp Marina Bay, `frame: 'trim'` (đố nhôm mảnh, không phải đá),
  // `steps: 0` vì cao ốc hiện đại đưa mặt sàn bằng vỉa hè cho xe lăn vào được.
  // ⚠️ `vernacularFeature: 'awning'`: nhà phố cũ ngoài five-foot way còn có mái hắt che cửa hàng.
  14: {
    note: 'Singapore — five-foot way có mái bắt buộc từ quy hoạch Raffles 1822, sảnh kính tháp Marina Bay đố nhôm mảnh, sàn bằng vỉa hè; nhà phố cũ thêm mái hắt che cửa hàng',
    door: 'glazed', doorWidth: 0.41, doorTall: 0.92, frame: 'trim', recess: 0.30, steps: 0,
    feature: 'arcade', vernacularFeature: 'awning',
  },
  // ⚠️ TẦNG TRỆT — Dubai. `feature: 'awning'` = tấm che nắng sâu, và ở sa mạc thì đây là bộ phận
  // quyết định: Bảo tàng Tương Lai cùng cả thế hệ công trình Vịnh đều dựa vào bóng đổ sâu và
  // lớp lưới mashrabiya để hạ nhiệt trước khi tới điều hoà. `recess: 0.45` cùng phục vụ đúng
  // việc ấy — lối vào thụt vào là lối vào có bóng.
  // Cửa: `glazed` như hai kỷ hiện đại trước, nhưng `doorWidth: 0.40` hẹp hơn Singapore (0,41) và
  // `steps: 2` thay vì 0 — công trình biểu tượng Vịnh đặt trên bệ nâng, khác hẳn cao ốc thương
  // mại Singapore chủ ý bằng vỉa hè.
  // ⚠️ `vernacularFeature: 'none'` là câu trả lời có nội dung, và nó khép lại 15 kỷ đúng chỗ nó
  // mở ra: nhà ở Dubai quay vào SÂN TRONG y như nhà Ur kỷ 3, cùng một lý do khí hậu, cách nhau
  // bốn nghìn năm. Mặt phố là tường trơn, và đó là truyền thống chưa từng đứt.
  15: {
    note: 'Dubai — tấm che nắng sâu và lối vào thụt vào lấy bóng kiểu Bảo tàng Tương Lai, sảnh kính trên bệ nâng; nhà ở vẫn quay vào sân trong nên mặt phố trơn, y như nhà sân trong vùng Lưỡng Hà bốn nghìn năm trước',
    door: 'glazed', doorWidth: 0.40, doorTall: 0.88, frame: 'trim', recess: 0.45, steps: 2,
    feature: 'awning', vernacularFeature: 'none',
  },
};

/**
 * Bảng tầng trệt của một kỷ — cửa ra vào + MỘT đặc trưng mặt phố.
 *
 * ⚠️ KHÔNG CÓ ĐƯỜNG RƠI VỀ MẶC ĐỊNH RIÊNG, và đó là chủ đích. Hàm này **hỏi `getEraStyle` để
 * chuẩn hoá số kỷ** thay vì tự viết lại phép `Math.round` + `?? DEFAULT_ERA` — nếu tự viết thì
 * "kỷ lạ thì tra ra cái gì" có hai công thức, và hai công thức tương đương trên giấy gần như luôn
 * lệch nhau ở biên (bài học Phase 3Y). Bảng ở đây khai đủ 15 kỷ nên tra theo số kỷ đã chuẩn hoá
 * là đủ; kỷ nào lỡ thiếu dòng thì người viết gặp `undefined` NGAY ở chỗ dựng, chứ không nhận về
 * một cái cửa mặc định trông "cũng được" — đúng lý do `vernacularRoof` được làm thành trường bắt
 * buộc ở Phase 7C.
 */
export function getGroundFloor(era) {
  return GROUND_FLOOR_STYLES[normalizeEraKey(era)];
}
