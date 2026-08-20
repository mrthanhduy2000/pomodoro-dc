/**
 * waterView.test.js — KHOÁ CON SỐ CỦA `TECH_DEBT #57` VÀO MỘT BÀI TEST, KHÔNG ĐỂ NÓ NẰM YÊN TRONG
 * TÀI LIỆU.
 *
 * VIỆC 2 Bước B trượt cổng không-đo-được-bằng-test của Đàm (*"kỷ có biển phải đọc ra là thành phố
 * cảng"*): ở khung hình mặc định, mặt biển kỷ 14 chiếm **0,09%** khung hình, trong khi trần — xoay
 * camera sang phía đối diện bờ — là **31,43%**.
 *
 * ✅ **ĐÃ SỬA 2026-08-20 bằng trường `worldYaw`** (ADR-041): xoay TỜ GIẤY chứ không xoay thế giới —
 * `side` giữ nguyên sự thật lịch sử, `DEFAULT_YAW` giữ nguyên hằng số mỹ thuật, và chỗ chịu trách
 * nhiệm cho QUAN HỆ giữa hai thứ ấy nay có tên. Kỷ 14 đi từ **0,09% lên 23,75%**, kỷ 12 từ **2,30%
 * lên 9,32%**. Cái chuông ở bài cuối đã reo đúng lúc và đã được thay bằng bài khoá TRẠNG THÁI ĐÃ
 * SỬA — xem chú thích của nó.
 *
 * ⚠️ VÌ SAO PHẢI LÀ MỘT BÀI TEST CHỨ KHÔNG PHẢI MỘT MỤC `TECH_DEBT`. Luật đã trả giá nhiều lần
 * trong dự án này: *"một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn được"*,
 * và cụ thể hơn — *"một con số trong bài test là cái hẹn giờ duy nhất chạy được"* (Phase 10 Bước 1,
 * `door: 'legacy'`). Một mục nợ chỉ được đọc khi có người đi tìm; một con số trong bài test thì TỰ
 * ĐÒI được đọc.
 *
 * ⚠️ BÀI `KHUYẾT TẬT VẪN CÒN NGUYÊN` TỪNG CỐ Ý ĐỎ KHI AI ĐÓ SỬA XONG, và nó **đã reo đúng như thiết
 * kế**: phiên 2026-08-20 chạy `npm test`, thấy đúng một bài đỏ, kèm câu *"nếu đúng thì hãy ĐÓNG
 * TECH_DEBT #57 và sửa bài test này — đừng nới ngưỡng"*. Đó là bằng chứng thực nghiệm cho luật
 * *"một con số trong bài test là cái hẹn giờ duy nhất chạy được"* — mục nợ đã được đóng tử tế thay
 * vì nằm mãi ở trạng thái Open trong khi mã đã hết bệnh.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { gocDoiDien, tiLeNuocTrongKhung } from './water-view.mjs';
import { getSetting } from '../src/engine/city3d/settingStyle.js';
import { ERAS_WITH_WATER_GEOMETRY } from '../src/engine/city3d/setting.js';

/**
 * Lưới tia THƯA cho bài test — 88 cột thay vì 220, tức 1/6 số tia và 1/6 thời gian. Đủ mịn cho mọi
 * ngưỡng dưới đây (ngưỡng gần nhất là 1% ≈ 49 tia, còn giá trị thật là 0,09% ≈ 4 tia), và **giữ
 * nguyên tỉ lệ khung** nên nó vẫn đo cùng một đại lượng, chỉ thô hơn. Bảng số trong `TECH_DEBT #57`
 * đo ở độ mịn ĐẦY ĐỦ — đừng chép con số của bài test này vào tài liệu.
 */
const TIA = 88;

test('KỶ KHÔ RA ĐÚNG 0 Ở MỌI GÓC — và có ĐỐI CHỨNG chứng minh phép đo không mù', () => {
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    assert.equal(tiLeNuocTrongKhung({ era: 1, yaw, tia: TIA }).nuoc, 0,
      `kỷ 1 khai water:'none' mà phép đo lại thấy nước ở yaw ${yaw}`);
  }
  // ⚠️ Không có vế này thì bài trên vẫn XANH kể cả khi phép đo hỏng hẳn và không bao giờ đếm nổi
  // một tia nước nào — đúng cái phễu "assert có ít nhất một chỗ" đã cắn ở Phase 7A.
  const thay = tiLeNuocTrongKhung({ era: 14, yaw: gocDoiDien(14), tia: TIA }).nuoc;
  assert.ok(thay > 0.05, `đối chứng: đứng đối diện biển kỷ 14 phải THẤY nước, đo được ${thay}`);
});

test('BA LỚP PHẢI CỘNG ĐÚNG 100% — mọi phép chia-một-toàn-thể đều phải in ra TỔNG', () => {
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const r = tiLeNuocTrongKhung({ era, tia: TIA });
    assert.ok(Math.abs(r.nuoc + r.dat + r.khong - 1) < 1e-9,
      `kỷ ${era}: nước ${r.nuoc} + đất ${r.dat} + không ${r.khong} ≠ 1`);
  }
});

test('TECH_DEBT #57 ĐÃ ĐÓNG — 11 kỷ vượt cổng 5% THEO PHÉP TIA, và ĐÚNG BA kỷ trượt vì BỀ RỘNG, không vì góc nhìn', () => {
  // ⚠️⚠️ ĐỌC DÒNG NÀY TRƯỚC KHI TRÍCH CON SỐ 11 ĐI ĐÂU KHÁC (đính chính 2026-08-20).
  //
  // Bài này đo bằng `tiLeNuocTrongKhung` — PHÉP TIA — và phép tia **mù với cây cối, nhà cửa, đá,
  // cư dân**: nó chỉ dò trường cao độ mặt đất. Một tia xuyên qua tán cây rồi chạm mặt nước phía
  // sau được ghi là "nước", còn màn hình vẽ ra một cái cây. Đối chiếu với số điểm ảnh đếm thẳng
  // trên ảnh `--mask water` (`scripts/water-score.mjs`), phép tia cao hơn sự thật 1,04–3,01 lần,
  // và cao nhất đúng ở những kỷ nước HẸP bờ RẬM — tức đúng những kỷ đang đứng sát cổng:
  //
  //     kỷ 4  tia 5,02% · màn hình 3,32%      kỷ 5  tia 5,62% · màn hình 3,34%
  //     kỷ 6  tia 4,13% · màn hình 1,37%      kỷ 13 tia 24,12% · màn hình 23,18%
  //
  // ⇒ Trên MÀN HÌNH chỉ **5/14** kỷ đạt 5% (8 · 11 · 13 · 14 · 15), không phải 11. Xem
  // `TECH_DEBT #63`.
  //
  // ⚠️ VẬY VÌ SAO KHÔNG XOÁ BÀI NÀY ĐI. Vì nó vẫn canh đúng thứ nó sinh ra để canh: rằng
  // `worldYaw` (ADR-041) còn quay mặt nước về phía camera, và rằng đúng ba kỷ hẹp 6·7·10 là ba kỷ
  // yếu nhất. Cả hai mệnh đề ấy là mệnh đề SO SÁNH giữa các kỷ, và một phép đo lệch ĐỀU THEO MỘT
  // CHIỀU vẫn giữ được thứ tự. Cái sai nằm ở việc đọc con số tuyệt đối của nó thành một cái cổng.
  // ⇒ Cổng phần trăm phải chấm bằng `scripts/water-score.mjs`; bài này chỉ khoá phép tia khỏi trôi.
  // ⚠️ BÀI NÀY THAY CHO BÀI "KHUYẾT TẬT VẪN CÒN NGUYÊN". Cái chuông đã reo (2026-08-20) và nay nó
  // đổi việc: từ *canh cho khuyết tật đừng bị quên* sang *canh cho bản vá đừng bị mất*.
  //
  // ⚠️ CỔNG 5% KHÔNG ĐƯỢC NỚI XUỐNG CHO VỪA BA KỶ HẸP. Đàm chốt điều này bằng đúng một câu:
  // *"Nới một ngưỡng cho vừa kết quả là cái phễu Phase 9A."* Con số 5% đã hiệu chuẩn ở CẢ HAI ĐẦU
  // bằng phép đo thật — 0,09% là *"không nhìn thấy gì"* (kỷ 14 trước `worldYaw`) và 23,75% là
  // *"đọc ra ngay là thành phố cảng"* (kỷ 14 sau) — nên hạ nó xuống là vứt bỏ một thứ đã hiệu
  // chuẩn để lấy một con số chưa hiệu chuẩn.
  //
  // ⚠️ VÀ ĐÂY LÀ GIỚI HẠN CỦA **BỀ RỘNG DÒNG NƯỚC**, KHÔNG PHẢI CỦA GÓC NHÌN — phân biệt được
  // bằng số, không bằng cảm giác:
  //
  //   · **Kỷ 6** (kênh Bridgewater, rộng 1,2 ô): trần TOÀN CỤC — thử cả 24 góc — chỉ **4,36%**.
  //     Tức KHÔNG TỒN TẠI một góc nào đưa nó lên 5%. Xoay thêm không cứu được.
  //   · **Kỷ 7** (sông Arno, 1,4 ô) và **kỷ 10** (kênh Amsterdam, 0,9 ô) có trần toàn cục 9,11% và
  //     7,22%, nhưng chỉ ở những góc phá hỏng bố cục chung của 14 kỷ còn lại; ở góc dùng được
  //     chúng chỉ được 2,41% và 1,60%.
  //
  // ⇒ Cách chữa THẬT nằm ở hướng khác — đổi thứ mang bản sắc ven nước sang **cầu · bến · thuyền ·
  // kè** thay vì diện tích mặt nước — và đó là cả một phase mới, đã ghi thành `TECH_DEBT #60` với
  // điều kiện xem lại *"khi nào có phase chi tiết ven nước"*. Nới kênh cho rộng ra thì bị bác
  // thẳng: kênh Bridgewater hẹp thật, và mua một con số bằng cách nói dối địa lý chính là thứ
  // ADR-025 đã cấm với mặt đường.
  //
  // THỬ-CHO-ĐỎ (nêu TRƯỚC chỗ mong đợi đỏ):
  //   · cho `worldYaw` trả 0 ⇒ kỷ 14 tụt về 0,09% ⇒ đỏ ở `assert.ok(macDinh >= CONG)`;
  //   · nới bề rộng kỷ 6 lên cho nó vượt 5% ⇒ đỏ ở `deepEqual(TRUOT, …)` (chiều "đã sửa xong");
  //   · thu hẹp một kỷ đang đạt cho nó tụt dưới 5% ⇒ cũng đỏ ở đúng dòng ấy (chiều "kỷ thứ tư").
  const CONG = 0.05;
  assert.equal(getSetting(14).side, 'nam', 'sự thật lịch sử KHÔNG được đổi để lấy con số');
  assert.equal(getSetting(12).side, 'dong', 'sự thật lịch sử KHÔNG được đổi để lấy con số');

  // Đo MỘT lần rồi dùng lại — mỗi lời gọi là 88×88 tia, gọi lại là nhân đôi thời gian bài test mà
  // không thêm một chút thông tin nào.
  const doDuoc = new Map(
    ERAS_WITH_WATER_GEOMETRY.map((era) => [era, tiLeNuocTrongKhung({ era, tia: TIA }).nuoc]));
  const TRUOT = ERAS_WITH_WATER_GEOMETRY.filter((era) => doDuoc.get(era) < CONG);
  const DAT = ERAS_WITH_WATER_GEOMETRY.filter((era) => doDuoc.get(era) >= CONG);

  // ⚠️ MỘT BẢNG TƯỜNG MINH, KHÔNG PHẢI MỘT `continue` IM LẶNG. Đàm: *"tự đỏ CẢ HAI CHIỀU: kỷ thứ
  // tư trượt thì đỏ, một trong ba kỷ được sửa xong cũng đỏ."* Một mục nợ trong tài liệu chỉ được
  // đọc khi có người đi tìm; một con số trong bài test thì TỰ ĐÒI được đọc.
  // ⚠️ DANH SÁCH ĐÃ ĐỔI TỪ [6,7,10] SANG [4,5,6,7,10] NGÀY 2026-08-20, VÀ ĐÂY LÀ LÝ DO — KHÔNG
  // PHẢI MỘT CON SỐ ĐƯỢC SỬA CHO VỪA.
  //
  // §1(B) phát hiện `ERA_TERRAIN.drain` (đất thấp về đâu) **lệch hoặc NGƯỢC HẲN** với
  // `settingStyle.side` (nước ở đâu) ở 9/14 kỷ — kỷ 5 khai đất thấp về tây trong khi suối Elzbach
  // ở đông, tức nước chảy lên dốc. Sửa cho đúng vật lý (`terrain.test.js`, bài *"NƯỚC NẰM Ở CHỖ
  // THẤP"*) làm phép tia đo ra ÍT nước hơn ở vài kỷ, vì khi đất thoải xuống phía nước thì BỜ XA
  // tụt xuống và khuất sau sống đất gần. Đo được, cả ba mốc:
  //
  //     kỷ   nền 9c7032c   §1(B) drain SAI   §1(B) drain ĐÚNG
  //     4      5,11%          4,95%             4,95%
  //     5      5,54%          4,40%             3,51%
  //     7      2,41%          4,38%             3,55%
  //
  // ⇒ Cái giá là THẬT và đã ghi ở `TECH_DEBT #59`. Hai cách "chữa" đều bị bác thẳng: hạ cổng 5%
  // là cái phễu Phase 9A (Đàm đã chốt), còn quay `drain` về giá trị sai là **mua một con số bằng
  // cách nói dối địa lý** — đúng thứ ADR-025 đã cấm với mặt đường. Cách chữa THẬT vẫn là hướng đã
  // ghi ở `TECH_DEBT #60`: đổi thứ mang bản sắc ven nước sang cầu · bến · thuyền · kè.
  assert.deepEqual(TRUOT, [4, 5, 6, 7, 10],
    'đúng NĂM kỷ được miễn cổng 5% theo phép tia (`TECH_DEBT #59`). Danh sách này đổi nghĩa là '
    + 'hoặc có kỷ thứ sáu vừa tụt xuống, hoặc một trong năm kỷ ấy vừa được chữa — cả hai trường '
    + 'hợp đều phải xem lại `TECH_DEBT #59` chứ không phải sửa con số ở đây.');
  assert.equal(DAT.length, 9,
    'phải có đúng 9 kỷ vượt 5% THEO PHÉP TIA. ⚠️ KHÔNG phải "9 kỷ đạt cổng 5%" — trên màn hình '
    + 'còn ít hơn (xem khối chú thích đầu bài và `TECH_DEBT #63`).');

  // Vế thật sự canh bản vá `worldYaw`: 11 kỷ kia phải THẬT SỰ đạt.
  for (const era of DAT) {
    const macDinh = doDuoc.get(era);
    assert.ok(macDinh >= CONG,
      `kỷ ${era}: mặt nước chỉ chiếm ${(macDinh * 100).toFixed(2)}% khung mặc định, dưới cổng 5% `
      + 'của §3. `worldYaw` có đang bị vô hiệu hoá không?');
  }

  // ⚠️ ĐO BIÊN, ĐỪNG CHỈ ĐỌC XANH/ĐỎ (luật Phase 9B). Kỷ mỏng nhất trong nhóm ĐẠT hiện chỉ hơn
  // cổng **0,11 điểm phần trăm** (kỷ 4: 5,11% ở độ mịn của bài test này, 5,02% ở độ mịn đầy đủ).
  // Đó là một lời hứa đang đạt nhờ 2% biên — ghi ra để phiên sau biết nó mỏng tới đâu, và để một
  // thay đổi nhỏ ở kỷ 4 không lặng lẽ đẩy nó sang bảng `TRUOT`.
  const mongNhat = Math.min(...DAT.map((era) => doDuoc.get(era)));
  assert.ok(mongNhat >= CONG,
    `kỷ mỏng nhất trong nhóm ĐẠT chỉ được ${(mongNhat * 100).toFixed(2)}%`);
  assert.ok(mongNhat < 0.06,
    `kỷ mỏng nhất trong nhóm ĐẠT đã lên ${(mongNhat * 100).toFixed(2)}% — nếu biên đã dày lên thật `
    + 'thì cập nhật chú thích trên, đừng để nó nói dối về một biên 0,11 điểm phần trăm không còn nữa.');

  // ⚠️ ĐỐI CHỨNG — TRẦN PHẢI CÒN CAO HƠN MẶC ĐỊNH Ở KỶ BIỂN. Không có vế này thì bài trên vẫn xanh
  // trong một thế giới mà mặt biển đã phình to bất thường (vd `reach` tụt về 0 và nước liếm vào sát
  // thành phố) — lúc ấy 23% là triệu chứng của một lỗi khác, không phải bằng chứng đã sửa đúng.
  const tran14 = tiLeNuocTrongKhung({ era: 14, yaw: gocDoiDien(14), tia: TIA }).nuoc;
  const macDinh14 = doDuoc.get(14);
  assert.ok(tran14 > macDinh14,
    `kỷ 14: trần ${(tran14 * 100).toFixed(2)}% không cao hơn mặc định ${(macDinh14 * 100).toFixed(2)}%`);
  assert.ok(macDinh14 / tran14 > 0.5,
    `kỷ 14: khung mặc định mới chỉ lấy được ${(macDinh14 / tran14 * 100).toFixed(0)}% của trần — `
    + 'bản vá chưa đưa được biển vào tầm nhìn như đã hứa.');
});

test('KỶ 6 TRƯỢT VÌ BỀ RỘNG — không góc nào trong 24 góc cứu được nó', () => {
  // ⚠️ ĐÂY LÀ VẾ CHỨNG MINH CÂU *"giới hạn của BỀ RỘNG, không phải của GÓC NHÌN"* Ở BÀI TRÊN. Không
  // có bài này thì câu ấy chỉ là một lời khẳng định trong chú thích — và dự án đã trả giá nhiều lần
  // cho việc tin một câu tự trấn an chưa được kiểm (Phase 4G: *"ổn định qua hai cỡ ô 260 và 300"*).
  //
  // Kỷ 7 và 10 thì KHÔNG có bài tương tự, và đó là sự thật chứ không phải chỗ bỏ sót: trần toàn
  // cục của chúng (9,11% · 7,22%) CÓ vượt 5%, chỉ là ở những góc phá hỏng 14 kỷ còn lại. Nói chúng
  // "không góc nào cứu được" sẽ là một câu sai.
  //
  // THỬ-CHO-ĐỎ: nới `width` kỷ 6 từ 1,2 lên 3 ⇒ trần toàn cục vượt 5% ⇒ đỏ.
  let tranToanCuc = 0;
  for (let k = 0; k < 24; k += 1) {
    const yaw = (k / 24) * Math.PI * 2;
    tranToanCuc = Math.max(tranToanCuc, tiLeNuocTrongKhung({ era: 6, yaw, tia: TIA }).nuoc);
  }
  assert.ok(tranToanCuc < 0.05,
    `kỷ 6: có một góc đưa mặt nước lên ${(tranToanCuc * 100).toFixed(2)}% — vượt cổng 5%. Nếu đúng `
    + 'thì `TECH_DEBT #59` đã hết đúng ở kỷ này: xem lại nó thay vì sửa ngưỡng ở đây.');
  assert.ok(tranToanCuc > 0.03,
    `kỷ 6: trần toàn cục tụt còn ${(tranToanCuc * 100).toFixed(2)}% — thấp bất thường so với 4,36% `
    + 'đo được ngày 2026-08-20. Mặt nước có còn được dựng không?');
});
