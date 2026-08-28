/**
 * block.test.js — khoá lớp HÌNH của khuôn ba lớp "khu phố" (Phase 14 §1(3), ADR-052).
 *
 * ⚠️ FILE NÀY TỒN TẠI VÌ MỘT CÂU CỦA ĐÀM, KHÔNG VÌ MỘT CON SỐ:
 *     «mọi thứ hiện tại trông vẫn nhỏ, thành phố không mở rộng mà chỉ là cụm nhỏ»
 * Cách hỏng nguy hiểm nhất của phase này KHÔNG phải một lỗi dựng hình — nó là **chia nhỏ mà quên
 * nâng cao**: sáu căn nhà thấp thay cho một căn nhà thấp thì thành phố còn trông NHỎ HƠN trước.
 * Cách hỏng ấy im lặng tuyệt đối (build xanh, lint sạch, số khối tăng gấp năm), nên nó phải có
 * một cái cân đứng canh — đó là bài `CAO LÊN, KHÔNG THẤP ĐI` ở ngay dưới.
 *
 * ⚠️ MỌI NGƯỠNG TRONG FILE NÀY ĐỀU KÈM GIÁ TRỊ THẬT ĐO ĐƯỢC. Bài học Phase 9A: *"khoảng cách giữa
 * giá trị thật và ngưỡng chính là phần dự án đang không được bảo vệ"*. Bảng số hiện hành đo ở
 * `sessionCount: 80, level: 3` — quần thể **473** ô nhà dân của cả 15 kỷ (371 trước Phase 20; Phase
 * 20 đổi bộ xương theo kỷ ⇒ 432; Phase 21 hợp nhất bộ sinh với tầng cung cong của ADR-059 ⇒ 476;
 * rồi Phase 21 §5 nâng số thửa của bảy kỷ ⇒ **473**. Mọi con số biên trong file đã đo lại từ đầu ở
 * mốc CUỐI CÙNG, sau §5 — không con số nào chép từ lượt đo giữa chừng, vì bảng còn đổi sau lượt ấy
 * và một bảng số đo trên hai đời mã là một bảng số bịa: đúng `TECH_DEBT #43`).
 *
 * ⚠️ VÌ SAO QUẦN THỂ ĐỔI KHI §5 CHỈ ĐỤNG BẢNG `networkStyle.js`: số thửa quyết ranh giới thửa, ranh
 * giới thửa quyết tập ô đường, mà ô nào không phải đường thì mới có thể là ô nhà dân. Nó không chỉ
 * đổi SỐ ô mà đổi cả THÀNH PHẦN (bao nhiêu `house`, bao nhiêu `workshop`) — và `workshop` là nguyên
 * mẫu thấp-rộng cho tỉ số chiều cao kém nhất bảng, nên vài con số dưới đây dịch theo.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { BLUEPRINT_CATALOG } from '../constants.js';
import { computeCityLayout } from '../cityLayout.js';
import { buildBuildingSpec } from './buildingSpec.js';
import { buildBlockSpec, BLOCK_FIT, BLOCK_MIN_CELLS } from './block.js';
import { BLOCK_STYLES, MIN_UNITS, blockUnitCount } from './blockStyle.js';
import { BUILDING_SCALE, specFootprint } from './parts.js';
import { CELL_PIXELS, EYE_PIXELS } from './streetStyle.js';
import { collectCitySpecs, dwellingBpId } from './cityParts.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);

/** Quần thể nhà dân THẬT của một kỷ — không phải một danh sách bịa cho tiện. Bài học Phase 10
 *  Bước 2: một bài test dựng quần thể rộng hơn thành phố thật thì cái phễu nằm ngay trong nó. */
function oNhaDan(era, sessionCount = 80) {
  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  const layout = computeCityLayout({ built, levels, era, stats: { sessionCount, streakLength: 9 } });
  return layout.dwellings ?? [];
}

// ⚠️ HỎI CHÍNH `dwellingBpId`, ĐỪNG CHÉP LẠI CÔNG THỨC. Hạt giống quyết mọi biến thể, nên một
// bản chép tay lệch một dấu gạch sẽ làm cả file này đo một thành phố KHÁC với thành phố Đàm thấy
// — đúng quả mìn `BUILDING_SCALE = 0.86` chép tay ở `plinth-tri.mjs` (2026-08-21).
const bpIdCua = (era, home) => dwellingBpId(era, home.x, home.y);
const refCua = (era, home) => buildBuildingSpec({
  bpId: bpIdCua(era, home), era, type: home.type, rarity: home.rarity, level: 1,
});
const khoiCua = (era, home) => buildBlockSpec({
  bpId: bpIdCua(era, home), era, type: home.type, rarity: home.rarity,
});

/** Cạnh dài nhất của hình bao, quy về Ô LƯỚI — hệ đơn vị mà mắt Đàm dùng. */
const beNgangO = (spec) => {
  const f = specFootprint(spec.parts);
  return Math.max(f.w, f.d) * BUILDING_SCALE;
};

test('CAO LÊN, KHÔNG THẤP ĐI — lời hứa trung tâm của cả phase, đo trên cả 15 kỷ', () => {
  // Đây là bài quan trọng nhất file. Nếu nó đỏ thì phase này đang đi NGƯỢC điều Đàm yêu cầu, dù
  // mọi con số khác có đẹp tới đâu.
  //
  // ⚠️ ĐO TRÊN TRUNG BÌNH CỦA CẢ KỶ, KHÔNG ĐO TỪNG CĂN — và đó là chủ đích, không phải nới tay:
  // cột `vary` của bảng CỐ Ý làm các đơn vị cao thấp so le (kỷ 5 Đức so le 0,28 vì mỗi nhà một
  // chủ, một đời xây), nên đòi TỪNG căn phải cao hơn là đòi bảng bỏ đúng cái cột kể chuyện. Cái
  // canh cho từng căn nằm ở vế thứ hai bên dưới: không căn nào được TỤT xuống thành cái lều.
  //
  // ⚠️ BIÊN 0,7% ẤY ĐÃ GÃY Ở PHASE 20, VÀ NÓ GÃY ĐÚNG NHƯ CHÚ THÍCH NÀY TỪNG CẢNH BÁO. Bảng số cũ
  // (đo 2026-08-21, quần thể 371 ô): tỉ số thấp nhất là kỷ 1 = **1,0072** — chỉ 0,7% trên ngưỡng,
  // kỷ 2 = 1,0078. Phase 20 sinh bộ xương theo kỷ nên QUẦN THỂ đổi (371 → 432 ô) và **4 kỷ tụt
  // xuống dưới 1** (kỷ 1 · 2 · 6 · 7).
  //
  // ⚠️ NGUYÊN NHÂN ĐÃ TÁCH RA TỪNG NHÓM, KHÔNG ĐOÁN: nhóm `workshop`/`shop` cho tỉ số 0,80–0,93
  // còn `house|epic` cho 1,10–1,25. Nguyên mẫu xưởng vốn THẤP-RỘNG, nên chia nó thành bốn đơn vị
  // rồi nhân `storey` không lấy lại đủ chiều cao. Tức bộ sinh mới **không gây ra** khuyết tật này —
  // nó chỉ lấy mẫu trúng chỗ khuyết tật vốn có.
  //
  // ⚠️ PHASE 21 CHỮA ĐƯỢC BA TRONG BỐN KỶ, VÀ KHÔNG LẦN NÀO BẰNG CÁCH ĐỤNG VÀO BẢNG HÌNH KHỐI.
  // (1) Bản hợp nhất khôi phục phép chia khu theo THỨ HẠNG (`khuTheoHang` ở `dwellings.js`) mà
  // `main` đã vá — Phase 20 lỡ ghi đè nó bằng phép chia theo khoảng cách TUYỆT ĐỐI, khiến cả một
  // kỷ dồn hết vào `civic` (toàn `shop`, mà `shop` là nhóm cho tỉ số thấp); đo ở mốc hợp nhất,
  // quần thể 476 ô: còn **2 kỷ** trượt — kỷ 1 = 0,9386 · kỷ 7 = 0,9932. (2) Rồi §5 nâng số thửa
  // của bảy kỷ, và điều đó đổi THÀNH PHẦN quần thể (xem đầu file): kỷ 1 lên **1,0245** và kỷ 7 lên
  // **1,0092** — cả hai tự khỏi, còn **kỷ 5 tụt xuống 0,9942**. Tức con số này đo một hỗn hợp
  // nguyên mẫu, không đo một cơ chế; nó sẽ còn dịch mỗi lần bảng mạng đường đổi.
  //
  // ⚠️ PHASE 22 LÀM DANH SÁCH TRƯỢT DÀI RA 1 → 5 KỶ, VÀ ĐÓ LÀ MỘT PHÉP ĐO TRUNG THỰC HƠN CHỨ
  // KHÔNG PHẢI MỘT HỒI QUY. Bộ khớp-đất cũ (`dungVuaDat` ở `block.js`) giải hình bao bằng một
  // phép nội suy tuyến tính, mà hình bao thì KHÔNG tuyến tính: **41% số ca trả-đất dựng ra căn
  // nhà TO HƠN suất đất của nó** (ca tệ nhất thò 0,53 ô). Mà `specHeight` đi theo hệ số mặt bằng,
  // nên một căn nhà lấn đất cũng là một căn nhà CAO HƠN — tức chính con số này xưa nay được đỡ
  // một phần bởi đúng cái khuyết tật Phase 22 đi sửa. **Bài học Phase 9B, lần thứ ba trong dự án.**
  //
  // BẢNG HIỆN HÀNH (đo sau Phase 22, quần thể 473 ô — tỉ số trung bình cả kỷ):
  //   kỷ  1 = 1,0234 · 2 = **0,9970 ✗** · 3 = 1,0110 · 4 = 1,0461 · 5 = **0,9866 ✗** · 6 = 1,0108
  //   kỷ  7 = **0,9906 ✗** · 8 = **0,9827 ✗** · 9 = 1,0453 · 10 = **0,9992 ✗** · 11 = 1,1296
  //   kỷ 12 = 1,1064 · 13 = 1,1159 · 14 = 1,0502 · 15 = 1,0860
  //   theo NHÓM: `house` 1,085 (241 ô) · `shop` 1,031 (71 ô) · `workshop` **0,987** (161 ô)
  //
  // ⚠️ VÀ KHÔNG NỚI NGƯỠNG. Ngưỡng vẫn là 1, kỷ trượt được KỂ TÊN BẰNG (`assert.deepEqual`): kỷ
  // thứ sáu rơi xuống thì đỏ, mà một kỷ được chữa xong cũng đỏ. Nới xuống 0,99 là bỏ răng cho cả
  // 15 kỷ (bài học Phase 9A). Ghi ở `TECH_DEBT #90`.
  //
  // ⚠️ NHƯNG MỘT DANH SÁCH TÊN KHÔNG NÓI ĐƯỢC *THIỆT HẠI BAO NHIÊU*, NÊN CÓ VẾ THỨ BA ĐO BẰNG
  // ĐIỂM ẢNH — thứ Đàm thật sự nhìn thấy. Năm kỷ trượt hụt lần lượt **0,17 · 1,37 · 0,87 · 0,94
  // · 0,07 điểm ảnh** chiều cao trung bình (kỷ 2 · 5 · 7 · 8 · 10), tất cả DƯỚI ngưỡng mắt
  // `EYE_PIXELS` = 4. Tức lời hứa "cao lên, không thấp đi" vẫn nguyên vẹn TRÊN MÀN HÌNH; thứ vừa
  // đổi là con số thôi được thổi phồng. Đây đúng là luật Phase 7D áp cho chính bài test này: một
  // lời hứa về thứ MẮT ĐỌC RA thì phải có ít nhất một vế đo bằng đơn vị của mắt, không chỉ bằng
  // một tỉ số trừu tượng.
  //
  // THỬ-CHO-ĐỎ (đã chạy 2026-08-21): hạ `storey` kỷ 7 từ 1,7 về 1,0 ⇒ bài này ĐỎ.
  let daKiem = 0;
  let biMin = Infinity;
  const truot = [];
  // Chiều cao TRUNG BÌNH mỗi kỷ quy sang điểm ảnh màn hình, để vế thứ ba hỏi được bằng đơn vị của
  // mắt. `BUILDING_SCALE` đổi đơn-vị-mô-tả → ô lưới, `CELL_PIXELS` đổi ô lưới → điểm ảnh; cả hai
  // đều `import` chứ không chép tay (một luật một công thức).
  const caoRefPx = new Map();
  const caoKhoiPx = new Map();
  for (const era of ERAS) {
    const homes = oNhaDan(era);
    assert.ok(homes.length >= 15, `kỷ ${era}: chỉ ${homes.length} ô nhà dân — quần thể sai hình dạng`);
    let caoRef = 0;
    let caoKhoi = 0;
    let thapNhat = Infinity;
    for (const home of homes) {
      const ref = refCua(era, home);
      const khoi = khoiCua(era, home);
      caoRef += ref.height;
      caoKhoi += khoi.height;
      thapNhat = Math.min(thapNhat, khoi.height / ref.height);
      daKiem += 1;
    }
    caoRefPx.set(era, (caoRef / homes.length) * BUILDING_SCALE * CELL_PIXELS);
    caoKhoiPx.set(era, (caoKhoi / homes.length) * BUILDING_SCALE * CELL_PIXELS);
    const ti = caoKhoi / caoRef;
    biMin = Math.min(biMin, ti);
    if (ti < 1) truot.push(era);
    // Vế hai: không một khu phố nào được tụt xuống thành một đám lều. Thấp nhất đo được sau
    // Phase 22 là **0,7606** ở kỷ 5 (ô `workshop/rare@1,2`), kế đó 0,761 — chỉ **1,4%** trên sàn
    // 0,75 (trước Phase 22 là 6,5%). Vế này nay đang ở SÁT MÉP: một phase sau chạm vào `storey`
    // hay vào bộ khớp-đất mà không đo lại con số này thì nó sẽ gãy. Đừng đọc là "còn thoải mái".
    assert.ok(thapNhat >= 0.75, `kỷ ${era}: có khu phố chỉ còn ${thapNhat.toFixed(3)}× chiều cao căn nhà cũ`);
  }
  assert.equal(daKiem, 473, 'quần thể đổi cỡ — mọi con số biên ghi trong file này phải đo lại');
  assert.deepEqual(truot, [2, 5, 7, 8, 10],
    `kỷ bị THẤP ĐI sau khi chia khu phố nay là [${truot.join(',')}] — dài ra là có kỷ mới tụt xuống, `
    + 'ngắn đi là có kỷ vừa được chữa (hãy cập nhật bảng số trong chú thích và `TECH_DEBT #90`)');
  assert.ok(biMin < 1.02, `biên mỏng nhất nay là ${biMin.toFixed(4)}× — nếu nó nới rộng ra thì tốt, `
    + 'nhưng hãy cập nhật con số 0,9827 trong chú thích thay vì để nó thành một lời nói dối');

  // ⚠️ VẾ THỨ BA — ĐO BẰNG ĐƠN VỊ CỦA MẮT, KHÔNG BẰNG TỈ SỐ. Một kỷ nằm dưới 1,0 mới chỉ là một
  // con số; câu hỏi của Đàm là "nhìn có thấp đi không". Nên mọi kỷ trượt phải trượt DƯỚI ngưỡng
  // mắt, và vế này KHÔNG được nới — nó là thứ giữ cho danh sách trên kia không lặng lẽ trở thành
  // một cái phễu (bài học Phase 9A: một ngưỡng rộng tay im lặng đúng lúc cần kêu nhất).
  // THỬ-CHO-ĐỎ (ĐÃ CHẠY THẬT): `storey` kỷ 8 từ 1,58 → 1,45 ⇒ hụt **4,57 điểm ảnh** ⇒ vế này ĐỎ
  // với đúng câu "Đàm NHÌN THẤY nó thấp đi".
  // ⚠️ VÀ PHÉP PHÁ ĐẦU TIÊN CỦA TÔI ĐỎ NHẦM CHỖ — ghi lại vì nó là một sự thật về bài test này.
  // Tôi thử kỷ 5 trước (`storey` 1,9 → 1,71); nó ĐỎ, nhưng đỏ ở **vế hai** (`thapNhat >= 0.75`,
  // rơi xuống 0,713), không đỏ ở vế này. Tức với kỷ 5 thì sàn-từng-ô CHẶN TRƯỚC — biên của nó chỉ
  // còn 1,4% nên nó nổ trước mọi thứ khác. Nếu tôi dừng ở "đã thấy đỏ" thì đã ship một dòng
  // THỬ-CHO-ĐỎ nói dối về chính vế mình vừa viết (bài học Phase 8A: nêu TRƯỚC mình mong đợi đỏ Ở
  // ĐÂU, và khi không đỏ đúng chỗ thì hỏi *"còn cái gì khác đang giữ nó xanh?"*).
  for (const era of truot) {
    const hut = (caoRefPx.get(era) - caoKhoiPx.get(era));
    assert.ok(hut < EYE_PIXELS,
      `kỷ ${era}: khu phố thấp hơn căn nhà cũ ${hut.toFixed(2)} điểm ảnh — vượt ngưỡng mắt `
      + `${EYE_PIXELS}, tức Đàm NHÌN THẤY nó thấp đi. Đây không còn là chuyện bookkeeping nữa.`);
  }
});

test('KHÔNG CHIẾM THÊM ĐẤT — khu phố không được rộng hơn căn nhà cũ (ngoài cái SÀN cố ý)', () => {
  // Lời hứa nằm trong chú thích của `BLOCK_FIT`: chia đúng khít hình bao thì mái đua của hai đơn
  // vị ngoài cùng sẽ đẩy khu phố RỘNG HƠN căn nhà cũ. Trần là `max(bề ngang cũ, BLOCK_MIN_CELLS)`
  // — `BLOCK_MIN_CELLS` là phần cố ý (ô lưới vốn đã thuộc về khu phố ấy), phần còn lại là trôi.
  //
  // ⚠️ VÌ SAO CÒN 0,11 Ô TRÔI, VÀ VÌ SAO LƯỢT DỰNG THỨ BA **KHÔNG** CHỮA ĐƯỢC. `block.js` dựng
  // thử một lượt ở tỉ lệ 1, đo hình bao thật, rồi dựng lượt thật — nhưng hình bao KHÔNG phải hàm
  // liên tục của `fx`: bên trong `buildBuildingSpec` có những quyết định RỜI RẠC (số cột cửa sổ,
  // một phép kẹp bám vào rồi nhả ra) nên nó là hàm BẬC THANG. Đã ĐO: thêm lượt thứ ba kéo sai số
  // tệ nhất từ 0,186 lên **0,234 ô** — nó PHÂN KỲ ở kỷ 5 · 8 · 10 chứ không hội tụ. Vì vậy đây là
  // một sai số ĐƯỢC CHẤP NHẬN và được canh bằng con số, không phải một thứ chờ vá.
  //
  // BIÊN THẬT (đo lại sau Phase 21 §5, quần thể 473 ô): trôi lớn nhất **0,0919 ô** ≈ 5,9 điểm ảnh
  // ở `CELL_PIXELS = 64`, tại kỷ 1 ô (1,2) `workshop/rare` (trước §5 là 0,1259 trên quần thể 476,
  // 0,1164 trên 432, và 0,1103 trên 371). Trần đã SIẾT theo: 0,13 → **0,10**, còn **8,1% biên** —
  // cố tình để chật, vì đây là phép tính TẤT ĐỊNH (không nhiễu), nên chật nghĩa là ai chỉnh bảng
  // sẽ buộc phải đo lại chứ không lặng lẽ trôi tiếp. ⚠️ Siết một cái TRẦN thì không bao giờ giấu
  // được khuyết tật (chỉ có nới mới giấu), nên phép siết này không cần Đàm quyết.
  //
  // ⚠️ CON SỐ NÀY LÀ SAI SỐ CỦA MỘT PHÉP KHỚP HAI LƯỢT TRÊN MỘT HÀM BẬC THANG, NÊN NÓ ĐỔI MỖI KHI
  // QUẦN THỂ ĐỔI — cực đại lấy trên một tập mẫu khác thì rơi vào một bậc khác. Đổi ngưỡng theo một
  // quần thể mới là ĐO LẠI, không phải nới tay; đổi nó mà quần thể vẫn y nguyên thì mới là nới
  // tay. Kỷ 1 vẫn là ngoại lệ rõ rệt vì `MIN_UNITS = 4` chạm sàn — chia bốn đơn vị trong một ô
  // đã hết chỗ thì phép khớp hai lượt không còn đường lùi.
  // THỬ-CHO-ĐỎ (đã chạy): `BLOCK_FIT` 0,92 → 1,35 ⇒ bài này ĐỎ (kèm bài 1 và bài 9, đúng như
  // phải thế: nới mặt bằng thì mái đua thò ra, thân teo lại, chi tiết mái rơi xuống dưới mốc).
  const TRAN_TROI = 0.10;
  let troiMax = -Infinity;
  let daKiem = 0;
  for (const era of ERAS) {
    for (const home of oNhaDan(era)) {
      const tran = Math.max(beNgangO(refCua(era, home)), BLOCK_MIN_CELLS);
      const troi = beNgangO(khoiCua(era, home)) - tran;
      troiMax = Math.max(troiMax, troi);
      assert.ok(troi <= TRAN_TROI, `kỷ ${era}, ô ${home.x},${home.y}: khu phố rộng hơn trần ${troi.toFixed(4)} ô`);
      daKiem += 1;
    }
  }
  assert.equal(daKiem, 473, 'gác chạy-rỗng: quần thể đổi cỡ');
  assert.ok(troiMax > 0.05, 'trôi lớn nhất tụt xuống rất thấp — hoặc ai đó vừa chữa được nó (hãy '
    + `cập nhật con số 0,0919 trong chú thích), hoặc phép đo này thôi nhìn tới chỗ cần nhìn (nay ${troiMax.toFixed(4)})`);
});

test('MỘT Ô LÀ MỘT KHU PHỐ — mỗi ô phải ra NHIỀU HƠN MỘT khối, và số ấy đổi theo kỷ', () => {
  // Cả phase quy về đúng câu này. Trước Phase 14 mỗi ô ra 1 khối; nay 473 ô → **1358 khối**.
  //
  // ⚠️ CON SỐ ẤY VỪA TỤT TỪ 1892 XUỐNG 1358 (−28%) Ở PHASE 22, VÀ ĐÓ LÀ CÁI GIÁ ĐÃ BIẾT TRƯỚC CỦA
  // ĐÚNG THỨ ĐÀM YÊU CẦU — không phải một hồi quy. Lời anh: *"đừng có làm cho nó giả quá … mà
  // ngày xưa làm gì có vụ nhà sát sát nhau như thế"*. Cột `yard` cắt một phần chiều sâu suất đất
  // ra làm sân/vườn, nên **đất dành cho NHÀ ít đi ⇒ mỗi ô chứa được ít nhà hơn**. Tương quan là
  // một-một, đọc thẳng ra khỏi bảng:
  //
  //     yard = 0      (kỷ 1 · 7 · 10)            → 4,00 khối/ô
  //     yard 0,22–0,24 (kỷ 2 · 8)                → 4,00 khối/ô
  //     yard 0,28–0,30 (kỷ 3 · 9)                → 3,38 và 3,52
  //     yard ≥ 0,32   (kỷ 4·5·6·11·12·13·14·15)  → 2,00 khối/ô
  //
  // ⚠️ ĐÂY LÀ MỘT ĐÁNH ĐỔI PHẢI NÓI THẲNG VỚI ĐÀM, KHÔNG ĐƯỢC GIẤU SAU MỘT CON SỐ TRUNG BÌNH: nó
  // kéo NGƯỢC lại lời phàn nàn trước đó của anh (*"thành phố không mở rộng mà chỉ là cụm nhỏ"*).
  // Hai yêu cầu ấy có thật và chúng đối nhau; bài test này chỉ ghi lại tỉ số đang chọn, nó KHÔNG
  // được dùng để tự quyết thay Đàm. Ghi ở `TECH_DEBT #91`.
  //
  // ⚠️ SÀN CỦA BÀI NÀY LÀ **2**, VÀ NÓ CỐ TÍNH KHÔNG PHẢI `MIN_UNITS`. Bản đầu tôi viết
  // ngưỡng này bằng chính `MIN_UNITS` với lý lẽ “hai bên phải là MỘT luật một công thức” — nghe rất
  // xuôi, và **sai**, vì chúng là HAI luật về HAI đại lượng khác nhau:
  //   · `MIN_UNITS` (= 4, `blockStyle.js`) là trần dưới cho con số BẢNG **KHAI** — một dòng khai 3
  //     suất đất thì không còn là một khu phố trên giấy, và `isValidBlockStyle` TỪ CHỐI nó.
  //     Cả 15 dòng đang khai 4…10 (kỷ 6 đứng ĐÚNG trên sàn), nên cái trần ấy CÓ răng thật.
  //   · Sàn ở đây là trần dưới cho con số **DỰNG RA ĐƯỢC** sau khi cắt sân/vườn và sau khi
  //     `MIN_UNIT_CELLS` ăn vào — một đại lượng nhỏ hơn, và nó được phép nhỏ hơn.
  // Viết sàn DỰNG bằng hằng số KHAI là đúng bẫy `TECH_DEBT #42` (*assert con số đã KHAI thay vì
  // con số đã DỰNG*) ở chiều ngược: nó sẽ kéo một ràng buộc về BẢNG trôi theo một phép đo về HÌNH,
  // tức muốn bài này xanh thì phải hạ `MIN_UNITS` xuống 2 và **làm yếu đi validator của bảng** —
  // một cái phễu đội lốt một lần dọn nhà.
  //
  // Và câu hỏi ĐÚNG cho đại lượng DỰNG là câu đầu đề của cả phase: *một ô còn là một KHU PHỐ hay đã
  // quay về một căn nhà?* — tức sàn là **2**. Để sàn thấp ấy không lặng lẽ thành một cái phễu (Phase 9A),
  // nó đi kèm BA vế siết lại, và chính ba vế này mới là phần có răng:
  //   (a) mỗi kỷ bị KỂ TÊN bằng số khối của chính nó (`MOC_KHOI`), nên một kỷ tụt đi thì đỏ — một
  //       bảng 15 mốc, đúng khuôn `drawCallBudget.test.js` đã dùng cho lệnh vẽ (`TECH_DEBT #38`);
  //   (b) bảng ấy không được DẸT: phải còn ít nhất 3 giá trị khác nhau, nếu không thì trục vừa
  //       hồi sinh đã chết lại và `TECH_DEBT #88` phải mở lại;
  //   (c) số dựng ra không được VƯỢT số bảng khai — đây mới là chỗ hai tầng KHAI ↔ DỰNG được
  //       đặt cạnh nhau một cách hợp lệ: quan hệ “dựng ≤ khai”, không phải “dựng ≥ sàn của khai”.
  // THỬ-CHO-ĐỎ (đã chạy): `deriveBlockUnits` trả `out.slice(0, 1)` ⇒ bài này ĐỎ.
  const SAN_KHOI_MOI_O = 2;
  // Mốc RIÊNG TỪNG KỶ (đo Phase 22, quần thể 473 ô). Một trần chung chỉ bắt được kỷ tệ nhất và
  // cho 14 kỷ kia chỗ trống để trôi trong im lặng — bài học `TECH_DEBT #38`.
  const MOC_KHOI = {
    1: 4.00, 2: 4.00, 3: 3.38, 4: 2.00, 5: 2.00, 6: 2.00, 7: 4.00, 8: 4.00,
    9: 3.52, 10: 4.00, 11: 2.00, 12: 2.00, 13: 2.00, 14: 2.00, 15: 2.00,
  };
  let tongKhoi = 0;
  let tongO = 0;
  for (const era of ERAS) {
    const homes = oNhaDan(era);
    let khoi = 0;
    for (const home of homes) khoi += khoiCua(era, home).units;
    tongO += homes.length;
    tongKhoi += khoi;
    const ti = khoi / homes.length;
    assert.ok(ti >= SAN_KHOI_MOI_O, `kỷ ${era}: trung bình chỉ ${ti.toFixed(2)} khối/ô — dưới `
      + `${SAN_KHOI_MOI_O} thì ô ấy thôi là một KHU PHỐ, nó quay về đúng một căn nhà như trước Phase 14`);
    // Và không kỷ nào được vượt số đơn vị mình KHAI — vượt nghĩa là hàm chia đang tự bịa thêm.
    assert.ok(ti <= blockUnitCount(BLOCK_STYLES[era]) + 1e-9,
      `kỷ ${era}: dựng ra ${ti.toFixed(2)} khối/ô nhưng bảng chỉ khai ${blockUnitCount(BLOCK_STYLES[era])}`);
    assert.ok(Math.abs(ti - MOC_KHOI[era]) < 0.005,
      `kỷ ${era}: nay ra ${ti.toFixed(2)} khối/ô, mốc ghi ${MOC_KHOI[era].toFixed(2)} — mật độ nhà `
      + 'của kỷ này vừa đổi. Đây là thứ Đàm NHÌN THẤY, nên hãy đo lại rồi cập nhật mốc, đừng xoá vế này.');
  }
  assert.equal(tongO, 473, 'gác chạy-rỗng');
  assert.equal(tongKhoi, 1358,
    `cả 15 kỷ nay ra ${tongKhoi} khối nhìn thấy (Phase 22 đo được 1358; trước Phase 22 là 1892)`);
  // ĐỐI CHỨNG: bảng mốc không được DẸT. Điền cả 15 dòng bằng một con số là cách rẻ nhất để bài
  // test hết đỏ, và nó dựng lại đúng trục chết mà `TECH_DEBT #88` vừa đóng.
  assert.ok(new Set(Object.values(MOC_KHOI)).size >= 3,
    'bảng mốc chỉ còn một-hai giá trị — trục `units` đã chết lại, mở lại `TECH_DEBT #88`');
});

test('TRỤC SUẤT ĐẤT ĐÃ SỐNG LẠI — nhưng do cột `yard`, KHÔNG do cột `units`', () => {
  // ⚠️ BÀI NÀY VỪA ĐỔI VAI Ở PHASE 22: từ *ghi lại một khuyết tật* thành *canh một trục vừa hồi
  // sinh* — cộng MỘT NỬA khuyết tật vẫn còn nguyên. Đọc hết trước khi "dọn" nó.
  //
  // Bản cũ (Phase 21) đếm ra đúng MỘT giá trị: mọi ô của mọi kỷ đều ra 4 suất đất. Nguyên nhân là
  // một ràng buộc số học — ô rộng 1,0 chia cho sàn `MIN_UNIT_CELLS` chỉ chứa nổi 2 suất mỗi trục —
  // nên 15 dòng khai 4…10 dựng ra đúng một con số. Đó là một trục CHẾT (`TECH_DEBT #88`).
  //
  // Phase 22 thêm cột `yard`: một phần chiều sâu suất đất bị cắt ra làm sân/vườn, nên chiều sâu
  // còn lại cho NHÀ đổi theo kỷ, và số suất chia được đổi theo. Đo trên đủ 473 ô:
  //
  //     2 suất: 253 ô   ·   3 suất: 28 ô   ·   4 suất: 192 ô        ⇒ tập {2, 3, 4}
  //
  //   kỷ  1 = 4×35            kỷ  6 = 2×32            kỷ 11 = 2×40
  //   kỷ  2 = 4×29            kỷ  7 = 4×23            kỷ 12 = 2×30
  //   kỷ  3 = 2×1 3×13 4×10   kỷ  8 = 4×39            kỷ 13 = 2×36
  //   kỷ  4 = 2×20            kỷ  9 = 3×15 4×16       kỷ 14 = 2×34
  //   kỷ  5 = 2×32            kỷ 10 = 4×40            kỷ 15 = 2×28
  //
  // (Chỉ kỷ 3 và 9 pha trộn TRONG một kỷ: `yard` là hằng số của kỷ, nên phần biến thiên còn lại
  // đến từ hình bao căn nhà tham chiếu, thứ đổi theo `type`/`rarity` của từng ô.)
  //
  // ⚠️ NỬA CÒN LẠI CỦA `TECH_DEBT #88` VẪN MỞ, VÀ ĐỪNG ĐỌC BÀI NÀY THÀNH "ĐÃ ĐÓNG". Thứ làm trục
  // sống lại là cột `yard` — MỘT CỘT KHÁC. Cột `units`/`cols`/`rows`, tức cột được đặt tên cho
  // đúng đại lượng này, vẫn gần như không điều khiển được gì. Đo tương quan trên 15 kỷ:
  //
  //     KHAI (`units`/`cols`×`rows`) ↔ DỰNG  =  **−0,235**   ← gần như không liên quan
  //     `yard`                       ↔ DỰNG  =  **−0,827**   ← đây mới là cần gạt thật
  //
  // Bằng chứng rẻ nhất, và cũng là cái răng của bài này: **năm kỷ cùng khai 8 suất đất** (kỷ 2, 3,
  // 10, 11, 14) dựng ra 4,00 · 3,38 · 4,00 · 2,00 · 2,00 — cùng một lời khai, năm kết quả. Vế
  // `assert` bên dưới khoá đúng sự thật ấy, nên NGÀY NÀO cột `units` thật sự điều khiển được kết
  // quả thì nó ĐỎ và bắt người sửa đọc lại cả mục nợ — đúng lý do dự án chọn ghi khuyết tật bằng
  // một con số trong test chứ không bằng một dòng trong `TECH_DEBT.md` (Phase 10 Bước 1).
  //
  // ⚠️ VÀ NÓ PHẢI HỎI QUA `buildBlockSpec`, TỨC ĐƯỜNG MÀ MÀN HÌNH ĐI. Bản đầu tôi viết bài này ở
  // `blockStyle.test.js` và hỏi thẳng `deriveBlockUnits({ blockW: 1, blockD: 1 })` — nó xanh, nó
  // đọc lên hợp lý, và phép thử ngược cho thấy nó **không thể** đỏ: `deriveBlockUnits` nhận bề
  // ngang làm THAM SỐ, nên cái trần nằm ở `block.js` không đi qua nó. Tôi đã suýt ship một dòng
  // THỬ-CHO-ĐỎ nói dối về chính bài test mình vừa viết.
  // THỬ-CHO-ĐỎ (ĐÃ CHẠY THẬT, Phase 22): ép `yard` về 0 ở cả 15 dòng bảng ⇒ tập thu về đúng {4}
  // ⇒ vế `raBaoNhieu` ĐỎ với câu "trục đã CHẾT LẠI".
  const raBaoNhieu = new Set();
  const theoKhai = new Map();
  let daKiem = 0;
  for (const era of ERAS) {
    const khai = blockUnitCount(BLOCK_STYLES[era]);
    for (const home of oNhaDan(era)) {
      const u = khoiCua(era, home).units;
      raBaoNhieu.add(u);
      if (!theoKhai.has(khai)) theoKhai.set(khai, new Set());
      theoKhai.get(khai).add(u);
      daKiem += 1;
    }
  }
  assert.equal(daKiem, 473, 'gác chạy-rỗng');
  // (a) NỬA ĐÃ ĐÓNG: trục còn sống. Ghim ĐÚNG tập chứ không chỉ `size >= 2` — ghim thì trôi kiểu
  // nào cũng đỏ, còn `size >= 2` thì một kỷ tụt từ 4 xuống 2 vẫn lọt.
  assert.deepEqual([...raBaoNhieu].sort((a, b) => a - b), [2, 3, 4],
    `số suất đất dựng ra nay là {${[...raBaoNhieu].sort((a, b) => a - b).join(',')}} — nếu thu về `
    + 'MỘT giá trị thì trục đã CHẾT LẠI, phải mở lại `TECH_DEBT #88` nguyên vẹn; nếu trải rộng ra '
    + 'thì mừng, hãy đo lại rồi cập nhật hai bảng số trong chú thích của chính bài này');
  // (b) NỬA CÒN MỞ: cột `units` vẫn không điều khiển kết quả. Bài này ĐỎ vào ngày điều đó hết đúng.
  const lanLon = [...theoKhai.entries()].filter(([, tap]) => tap.size > 1);
  assert.ok(lanLon.length >= 1,
    'mỗi lời khai `units` nay ứng với đúng một kết quả — cột ấy đã thật sự điều khiển được số suất '
    + 'đất. Đó là TIN TỐT: đi đóng nốt nửa sau của `TECH_DEBT #88` rồi viết lại vế này.');
});

test('ADR-007 — cùng một ô thì VĨNH VIỄN ra cùng một khu phố', () => {
  // Bảo tàng bất động: một thành phố đã niêm phong phải mở ra y hệt lần trước, mãi mãi.
  // THỬ-CHO-ĐỎ (đã chạy): đổi `unit(...)` trong `deriveBlockUnits` thành `Math.random()` ⇒ ĐỎ.
  let daKiem = 0;
  for (const era of ERAS) {
    for (const home of oNhaDan(era)) {
      const a = JSON.stringify(khoiCua(era, home));
      const b = JSON.stringify(khoiCua(era, home));
      assert.equal(a, b, `kỷ ${era}, ô ${home.x},${home.y}: hai lần dựng ra hai kết quả`);
      daKiem += 1;
    }
  }
  assert.equal(daKiem, 473, 'gác chạy-rỗng');
});

test('ĐỐI CHỨNG: đổi hạt giống PHẢI đổi khu phố — nếu không, bài tất định ở trên là rỗng', () => {
  // Một bài "hai lần gọi ra cùng kết quả" xanh hoàn hảo trên một hàm trả hằng số. Đây là cái răng.
  // THỬ-CHO-ĐỎ (đã chạy): ép `buildBlockSpec` dùng chung một `bpId` cố định ⇒ bài này ĐỎ.
  const chuKy = new Set();
  for (let k = 0; k < 40; k += 1) {
    chuKy.add(createHash('md5')
      .update(JSON.stringify(buildBlockSpec({ bpId: `dw-9-${k}`, era: 9, type: 'house', rarity: 'rare' })))
      .digest('hex'));
  }
  assert.ok(chuKy.size >= 30, `40 hạt giống chỉ ra ${chuKy.size} khu phố khác nhau — biến thể đã chết`);
});

test('TƯỜNG CHUNG THÌ KHÔNG CÓ CỬA SỔ — cơ chế, đo thẳng ở `buildBuildingSpec`', () => {
  // Đây là khoản tiết kiệm lớn nhất của cả phase VÀ là sự thật kiến trúc: nhà phố đấu lưng chỉ có
  // cửa trước và cửa sau. Bịt hai mặt phải làm BỚT khối, không phải "vẫn dựng rồi giấu đi".
  //
  // ⚠️ HAI KỶ KHÔNG BỚT GÌ, VÀ ĐÓ LÀ ĐÚNG: kỷ 1 và kỷ 2 khai `windows: 'none'` trong `eraStyle.js`
  // (Çatalhöyük chui xuống bằng lỗ trên mái; làng thợ Deir el-Medina quay lưng ra sa mạc). Danh
  // sách viết BẰNG chứ không phải "bao gồm" — kỷ thứ ba rơi vào thì đỏ, mà kỷ 1/2 có cửa sổ trở
  // lại cũng đỏ. Một `continue` im lặng ở chỗ này sẽ giấu mất một cơ chế đã chết.
  // THỬ-CHO-ĐỎ (đã chạy): thêm `matNa = undefined;` ở đầu `emitWindows` ⇒ bài này ĐỎ.
  const MO = { xm: true, xp: true, zm: true, zp: true };
  const BIT = { xm: false, xp: true, zm: false, zp: true };
  const khongBot = [];
  for (const era of ERAS) {
    const dung = (faces) => buildBuildingSpec({
      bpId: `dw-${era}-mask`, era, type: 'house', rarity: 'rare', level: 1,
      plot: { fx: 1, fz: 1, storey: 1, faces },
    }).parts.length;
    const bot = dung(MO) - dung(BIT);
    assert.ok(bot >= 0, `kỷ ${era}: bịt tường mà lại dựng THÊM ${-bot} khối`);
    if (bot === 0) khongBot.push(era);
  }
  assert.deepEqual(khongBot, [1, 2],
    `kỷ không bớt khối nào nay là [${khongBot.join(',')}] — chỉ kỷ khai \`windows: 'none'\` mới được nằm đây`);
});

test('TƯỜNG CHUNG — và mặt nạ ấy ĐI TỚI tận khu phố, không dừng ở tầng dưới', () => {
  // Cơ chế chạy đúng ở `buildBuildingSpec` KHÔNG chứng minh `block.js` có truyền mặt nạ xuống —
  // đúng bài học "sửa xong một đường dẫn không có nghĩa là đã sửa xong cái luật" (Phase 7D).
  //
  // THỬ-CHO-ĐỎ (đã chạy): cho `block.js` truyền thẳng một mặt nạ mở-hết xuống ⇒ bài này ĐỎ.
  // Phép phá dưới đây: ép kỷ 10 (terrace Anh, 4×2 chung tường) sang `loose` — kiểu duy nhất mở cả bốn mặt.
  // Đo được: **75.872 → 118.496 tam giác (+56,2%)**. Chọn kỷ 10 vì nó cho khoản chênh lớn nhất
  // bảng. ⚠️ KHÔNG dùng phép phá này cho kỷ `court` (4 · 12 · 15): ép chúng sang `loose` làm số
  // đơn vị nhảy từ 10 lên 12, vượt `MAX_UNITS`, nên `isValidBlockStyle` từ chối và cả kỷ rơi về
  // MỘT căn nhà — tam giác GIẢM 70%, tức phép phá đo một thứ khác hẳn.
  const tri = (era) => oNhaDan(era).reduce((s, h) => s + khoiCua(era, h).triangles, 0);
  const that = tri(10);
  const goc = BLOCK_STYLES[10].attach;
  try {
    BLOCK_STYLES[10].attach = 'loose';
    const moHet = tri(10);
    assert.ok(moHet > that * 1.2, `mở hết bốn mặt chỉ thêm ${moHet - that} tam giác (${that} → ${moHet}) `
      + '— mặt nạ tường chung không đi tới `buildBuildingSpec`, hoặc `block.js` đã ngừng truyền nó');
  } finally {
    BLOCK_STYLES[10].attach = goc;
  }
  assert.equal(BLOCK_STYLES[10].attach, 'party', 'phép phá quên trả bảng về chỗ cũ');
});

test('KHÔNG THÊM MỘT HỌ VẬT LIỆU NÀO — nên KHÔNG thêm một lệnh vẽ nào', () => {
  // Lệnh vẽ đếm theo HỌ VẬT LIỆU của cả kỷ (`drawCallBudget.test.js`: lệnh vẽ = số họ + 4). Chia
  // một căn nhà thành sáu căn không đẻ ra vật liệu mới — nhưng đó là một lời KHẲNG ĐỊNH, và lời
  // khẳng định thì phải được đo. Đây là chỗ đo nó ở tầng rẻ nhất: tập `role`.
  //
  // ⚠️ "CẢ KỶ" NGHĨA LÀ CẢ CẢNH, KHÔNG PHẢI "CẢ 30 Ô NHÀ DÂN" — VÀ TÔI ĐÃ VIẾT SAI ĐÚNG CHỖ ẤY.
  // Bản trước lấy mốc nền là tập vai của riêng những căn nhà dân cũ, rồi kết luận "khu phố kéo
  // thêm vai `leaf` mà nhà dân cũ chưa từng dùng". Câu ấy ĐÚNG mà VÔ NGHĨA: mảnh vườn dùng vai
  // `leaf`, và `leaf` đã có mặt trong **cả 15/15 kỷ** qua cây cối (`prop`/`outskirt`/`hinterland`)
  // từ lâu trước Phase 22. Vật liệu được GỘP trên toàn cảnh, nên một vai đã tồn tại ở đâu đó trong
  // cảnh thì thêm nó vào một khối nữa tốn ĐÚNG 0 lệnh vẽ. Cổng thật (`drawCallBudget.test.js`,
  // đếm qua `collectCitySpecs`) xanh 9/9 suốt cả lúc bài này đỏ — hai bên nói về hai đại lượng.
  // Đây đúng là bài học Phase 10 Bước 2 mà chú thích cũ đã trích… rồi vẫn giẫm phải, chỉ lùi lên
  // một cấp: đếm ở cấp *ô* thì báo động giả, và đếm ở cấp *nhà dân của một kỷ* cũng vẫn báo động
  // giả. Cấp ĐÚNG là cấp mà `WebGLRenderer` gộp vật liệu — tức cả cảnh.
  //
  // Mốc nền phải là **thế giới TRƯỚC Phase 22**: mọi thứ không phải nhà dân (cây, đường, kỳ quan,
  // vùng quê, chân trời) CỘNG những căn nhà dân kiểu cũ (`refCua`). Không được lấy mốc nền là
  // "cả cảnh kể cả khu phố" — thế thì tập con nằm trong chính nó và bài test luôn xanh, tức một
  // cái phễu hoàn hảo.
  // THỬ-CHO-ĐỎ (ĐÃ CHẠY THẬT, Phase 22): đổi vai mảnh vườn thành `'water'` — một vai KHÔNG kỷ nào
  // có sẵn (chỉ 7/15 kỷ có mặt nước, và nó không đi qua `collectCitySpecs`) ⇒ bài này ĐỎ.
  let daKiem = 0;
  let daKiemNgoai = 0;
  for (const era of ERAS) {
    const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
    const levels = Object.fromEntries(built.map((id) => [id, 3]));
    const layout = computeCityLayout({ built, levels, era, stats: { sessionCount: 80, streakLength: 9 } });

    // Mốc nền = cảnh KHÔNG có khu phố: mọi thứ khác + nhà dân kiểu cũ.
    const nen = new Set();
    for (const item of collectCitySpecs({ layout })) {
      if (item.kind === 'dwelling') continue;
      for (const p of item.spec.parts) nen.add(p.role);
      daKiemNgoai += 1;
    }
    const vaiKhoi = new Set();
    for (const home of oNhaDan(era)) {
      for (const p of refCua(era, home).parts) nen.add(p.role);
      for (const p of khoiCua(era, home).parts) vaiKhoi.add(p.role);
      daKiem += 1;
    }

    const la = [...vaiKhoi].filter((v) => !nen.has(v)).sort();
    assert.deepEqual(la, [], `kỷ ${era}: khu phố kéo thêm vai [${la.join(',')}] mà cả cảnh chưa `
      + 'từng dùng — đó mới là một lệnh vẽ thật, đi đo lại `drawCallBudget.test.js`');
    assert.ok(vaiKhoi.size >= 3, `kỷ ${era}: chỉ ${vaiKhoi.size} vai — quần thể sai hình dạng, phép so vô nghĩa`);
  }
  assert.equal(daKiem, 473, 'gác chạy-rỗng: số ô nhà dân');
  // Gác chạy-rỗng thứ hai: mốc nền phải THẬT SỰ có thứ ngoài nhà dân. Thiếu vế này thì ngày nào
  // `collectCitySpecs` đổi tên `kind` là mốc nền teo lại thành "chỉ nhà dân cũ" và bài này lặng lẽ
  // quay về đúng cái báo động giả vừa gỡ.
  assert.ok(daKiemNgoai > 15 * 10,
    `mốc nền chỉ có ${daKiemNgoai} khối ngoài nhà dân trên 15 kỷ — quá ít, nhãn \`kind\` có thể đã đổi`);
});

test('CHI TIẾT MÁI KHÔNG ĐƯỢC CHẾT — và danh sách kỷ mất một phần được ĐẾM RA', () => {
  // ⚠️ ĐÂY LÀ QUẢ MÌN ĐÃ NỔ MỘT LẦN TRONG CHÍNH PHASE NÀY, ghi lại để phiên sau khỏi giẫm lại.
  // `emitRooftop` có một phép từ chối thẳng: `min(rw, rd) < ROOFTOP_MIN_SPAN (0,24)` thì KHÔNG
  // dựng gì trên mái. Bản chia nhỏ đầu tiên làm mọi đơn vị rơi xuống dưới mốc ấy ⇒ **13/15 kỷ mất
  // SẠCH chi tiết mái nhà dân** (kỷ 1: 17 → 0) trong im lặng — chỉ `rooftop.test.js` kêu lên.
  // Đã vá bằng hai việc: nâng `MIN_UNIT_CELLS` để ôm luôn `ROOFTOP_MIN_SPAN × BUILDING_SCALE`, và
  // đo hình bao thật của từng đơn vị thay vì suy nó từ bản tham chiếu.
  //
  // Sau Phase 21 §5 (quần thể 473 ô) giữ được 463/473 (97,9%); **Phase 22 nay giữ 459/473 —
  // 97,0%**, so với 469/476 (98,5%) trước §5, 431/476 giữa chừng, 389/432 (90%) sau Phase 20 và
  // 313/371 (84%) trước đó. Nhưng đừng đọc số tổng thành "ổn" — nó che mất chỗ mỏng, đúng bài học
  // `TECH_DEBT #22`, nên vế `duoiSan` vẫn đứng đó.
  //
  // ⚠️ PHASE 22 LÀM MẤT THÊM 4 Ô, VÀ HAI NGUYÊN NHÂN ẤY PHẢI ĐƯỢC TÁCH RA — GỘP LẠI THÌ SẼ ĐỔ HẾT
  // CHO CỘT `yard` VÀ ĐI SỬA NHẦM CHỖ. Đo bằng cách ép `yard` về 0 ở cả 15 dòng (tức giữ nguyên bộ
  // dựng-vừa-đất mới nhưng bỏ hẳn sân/vườn), so với bản đủ:
  //
  //     yard = 0 ở cả 15 kỷ  →  461/473 (97,5%)   duoi100 = [4, 6, 10, 11, 13]   kỷ 6 = 0,938
  //     bảng thật            →  459/473 (97,0%)   duoi100 = [4, 6, 10, 11, 13]   kỷ 6 = 0,844
  //
  // ⇒ **Cột `yard` chỉ tốn 2 ô, cả hai đều ở kỷ 6.** Bốn ô còn lại — và toàn bộ việc kỷ 4 rơi khỏi
  // 100% — là của **bộ dựng-vừa-đất viết lại** (`dungVuaDat`), thứ đo hình bao THẬT của từng đơn vị
  // thay vì suy nó từ bản tham chiếu. Bộ cũ nói quá kích thước nên nhiều căn được dựng TO HƠN mảnh
  // đất của chúng (41% số ca trả-đất, ca tệ nhất thò ra 0,53 ô); đo đúng thì chúng co lại vừa đất,
  // và vài căn co xuống dưới `ROOFTOP_MIN_SPAN`. Tức con số 463 cũ một phần được giữ bởi CHÍNH
  // khuyết tật mà phase này đi sửa — đúng bài học Phase 9B (*một lời hứa đang xanh có thể đang sống
  // nhờ chính khuyết tật ta sắp sửa*), lần thứ hai trong cùng phase.
  //
  // ⚠️ §5 LÀM CON SỐ NÀY TỆ ĐI MỘT CHÚT, VÀ ĐÂY LÀ CHỖ NÓI THẲNG RA: số ô mất chi tiết mái đi từ
  // **7/476 (1,5%) lên 10/473 (2,1%)** ở §5, rồi lên **14/473 (3,0%)** ở Phase 22. Kỷ 6 — kỷ tệ
  // nhất bảng — đi 0,893 (§4) → 0,844 (§5) → 0,938 (Phase 22 nếu bỏ vườn) → **0,844** (bảng thật).
  // Năm ô kỷ 6 mất mái nay là `workshop/common@1,1` · `workshop/rare@7,1` · `workshop/common@8,1` ·
  // `shop/epic@5,7` · `workshop/common@5,9` — phần lớn là `workshop`, nguyên mẫu thấp-rộng nên bị
  // bóp mỏng nhất. Hai ô kỷ 4 là `house/common@8,1` · `house/common@2,8`.
  //
  // ⚠️ DANH SÁCH KỶ TỤT DƯỚI SÀN NAY RỖNG, VÀ ĐÓ LÀ MỘT SỰ THẬT VỀ QUẦN THỂ + BẢNG SỐ CHỨ KHÔNG
  // PHẢI MỘT LỜI HỨA — đừng đọc nó thành "đã chữa xong một lần cho mãi mãi". Cơ chế không đổi:
  // kỷ nào có ngõ rộng (`alley`) hoặc vườn sâu (`yard`) thì mỗi căn bị bóp mỏng hơn
  // `ROOFTOP_MIN_SPAN` và mất chi tiết mái. Phase 21 §4 phải hạ ngõ kỷ 6 từ 0,26 xuống 0,18 đúng
  // vì lý do ấy, và Phase 22 hạ tiếp xuống 0,10 (xem bảng quét `alley`×`yard` tại dòng kỷ 6 của
  // `blockStyle.js` — chọn một CAO NGUYÊN bảy giá trị chứ không chọn một đỉnh nhọn, vì hình bao
  // KHÔNG đơn điệu). Hệ số `EAVE_LAND_FACTOR` cũng chọn bằng một bảng quét chứ không bằng cảm giác.
  // Một danh sách RỖNG được `assert` BẰNG chứ không bỏ đi: kỷ đầu tiên rơi xuống lại thì đỏ ngay.
  // KHÔNG hạ sàn 0,7 (hạ là bỏ răng cho cả 15 kỷ). Ghi ở `TECH_DEBT #90`. Năm kỷ dưới 100% cũng
  // kể tên BẰNG chứ không "bao gồm".
  // THỬ-CHO-ĐỎ (đã chạy): đổi `Math.max` thành `Math.min` trong `MIN_UNIT_CELLS` ⇒ bài này ĐỎ.
  const duoi100 = [];
  const duoiSan = [];
  let coRef = 0;
  let coKhoi = 0;
  let teNhat = Infinity;
  for (const era of ERAS) {
    let r = 0;
    let b = 0;
    for (const home of oNhaDan(era)) {
      if (refCua(era, home).parts.some((p) => p.rooftop)) r += 1;
      if (khoiCua(era, home).parts.some((p) => p.rooftop)) b += 1;
    }
    assert.ok(r > 0, `kỷ ${era}: bản tham chiếu không có mái nào — quần thể sai hình dạng`);
    coRef += r;
    coKhoi += b;
    const ti = b / r;
    teNhat = Math.min(teNhat, ti);
    if (ti < 1) duoi100.push(era);
    if (ti < 0.7) duoiSan.push(era);
  }
  assert.deepEqual(duoiSan, [],
    `kỷ mất QUÁ MỘT PHẦN BA chi tiết mái nay là [${duoiSan.join(',')}] — danh sách này phải RỖNG; `
    + 'dài ra là có kỷ vừa tụt xuống dưới sàn 0,7 (`TECH_DEBT #90`)');
  assert.deepEqual(duoi100, [4, 6, 10, 11, 13],
    `kỷ mất một phần chi tiết mái nay là [${duoi100.join(',')}] — nếu ngắn đi thì tốt, hãy cập nhật `
    + 'con số 459/473 trong chú thích; nếu dài ra thì có kỷ vừa tụt xuống');
  assert.ok(coKhoi / coRef >= 0.95, `cả 15 kỷ chỉ giữ ${coKhoi}/${coRef} ô có chi tiết mái (đo được 459/473)`);
  // ⚠️ CỬA SỔ HAI PHÍA NÀY LÀ MỘT CÁI GHIM, KHÔNG PHẢI CÁI SÀN. Sàn là `duoiSan` (0,7) ngay trên,
  // và nó KHÔNG bị hạ. Ghim thì phải ghim quanh giá trị THẬT: 0,893 → **0,844** sau §5, nên cửa sổ
  // dịch theo, giữ nguyên bề rộng 0,10. Tụt xuống dưới 0,80 hay vọt lên trên 0,90 đều đỏ.
  assert.ok(teNhat >= 0.80 && teNhat < 0.90, `tệ nhất nay là ${teNhat.toFixed(3)} (đo được 0,844 kỷ 6, Phase 22)`);
});

/**
 * GOLDEN — `buildBuildingSpec` gọi theo lối CŨ (không có `plot`) phải cho ra y hệt trước Phase 14.
 *
 * ⚠️ Tham số `plot` là thứ duy nhất phase này thêm vào một hàm mà **cả thành phố** đang gọi: công
 * trình chính, kỳ quan, di sản trong bảo tàng. Một mặc định lệch một chữ số ở đó sẽ đổi mọi thành
 * phố đã niêm phong — và ADR-007 nói đó là điều không bao giờ được phép xảy ra.
 *
 * Mười lăm chữ ký dưới đây KHÔNG chép từ trí nhớ. Chúng được sinh bằng một phép băm chạy trên HAI
 * cây mã (`git worktree` ở `ff8c2a4` — mốc trước phase — và cây đang làm việc) rồi `diff` hai kết
 * quả: **trùng từng byte ở cả 15 kỷ**. Xem bài học *"không bao giờ dựng lại một công cụ từ trí
 * nhớ"* (2026-08-21).
 *
 * THỬ-CHO-ĐỎ (đã chạy): đổi mặc định của `fx` trong `buildBuildingSpec` từ `: 1` thành `: 1.0001`
 * ⇒ bài này ĐỎ ngay ở kỷ 1.
 */
const GOLDEN = {
  1: 'b927b598dda52aedb81d743486d4ed19',
  2: '8b16f06f2ceea10dc2465b41ae866fd3',
  3: 'a8cc0feb8c3c12cbd55fc6a5b04f2af6',
  4: 'b87f5c32147c3b719c4a424521f3ee77',
  5: '527527d86a1cc08d6c60daea3ebeabaf',
  6: '17e4a8d3e567e569e087c318d519a062',
  7: '5cad57918aac4fd90250a98ea01b6b95',
  8: '7fbfb358a5c1961b4dd698fa5d6dcc56',
  9: '3af69ac231d8d87b1b3bcbc46b3c401b',
  10: '8c3dcf5c6bb73082ac6581fc68092201',
  11: '5755417cd876d1813bc41fcaff361045',
  12: '7bfcc23670533b4b223fb0958115829d',
  13: '8154738dca45645a665d9ddde0b0bb1b',
  14: '342ba772f14fbedfdaa6ee4a9e8a7370',
  15: 'bd754442385b53bafcd66e8fe87c5f62',
};

test('SÂN HOẶC ĐỦ THẤY, HOẶC BẰNG 0 — và ba cửa chặn nó đều được ĐẾM RA', () => {
  // Cái sân là thứ Đàm yêu cầu (*"ngày xưa làm gì có vụ nhà sát sát nhau như thế"*), nên nó phải
  // được canh bằng số chứ không bằng niềm tin. Nó đi qua BA cửa, và cả ba đều TỪ CHỐI THẲNG —
  // đúng luật ADR-026, nhưng "từ chối thẳng" chỉ an toàn khi có người ĐẾM số lần từ chối:
  //   (1) bảng khai `yard: 0`            → không có sân, CỐ Ý (kỷ 1 · 7 · 10);
  //   (2) cạnh ngắn dưới ngưỡng mắt      → không dựng gì (luật Đàm ADR-033: *nới cho vượt ngưỡng
  //       nhìn thấy được, HOẶC khai thẳng 0 — không có gì ở giữa*);
  //   (3) căn nhà ĐÒI LẠI cả suất đất    → để giữ chi tiết mái, cái sân của suất ấy biến mất.
  //
  // ⚠️ BÀI NÀY RA ĐỜI VÌ MỘT PHÉP ĐO CỦA CHÍNH TÔI ĐÃ NÓI DỐI, VÀ NÓ NÓI DỐI TO. Bản đầu tôi hỏi
  // `parts.filter((p) => p.groundCover)` trên những khối KHÔNG hề mang nhãn ấy, nên nó trả về
  // **0 mảng sân ở cả 473 ô / cả 15 kỷ** — đọc lên y hệt "cả cơ chế sân đã chết". Tôi đã suýt đi
  // sửa một thứ không hỏng. Thứ cứu được là hỏi tiếp *"khối sân THẬT SỰ mang khoá gì?"* thay vì
  // tin con số 0. Nay `sanThanhMang` gắn nhãn `groundCover` nên câu hỏi ấy trả lời được thật.
  // (Lần thứ N của luật: số đo nào gây bất ngờ thì kiểm CÔNG CỤ trước, kiểm mã sau.)
  //
  // Số đo hiện hành — ô CÓ mảng sân / tổng ô:
  //   kỷ  1 =  0/35 ·  2 = 29/29 ·  3 = 23/24 ·  4 = 20/20 ·  5 = 32/32
  //   kỷ  6 = 31/32 ·  7 =  0/23 ·  8 = 39/39 ·  9 = 30/31 · 10 =  0/40
  //   kỷ 11 = 40/40 · 12 = 30/30 · 13 = 36/36 · 14 = 34/34 · 15 = **3/28**
  //
  // ⚠️ KỶ 15 LÀ MỘT ĐÁNH ĐỔI THẬT, CHƯA GIẢI, VÀ PHẢI NÓI RA CHỨ KHÔNG ĐƯỢC LÀM TRÒN ĐI. Dubai
  // khai cái sân RỘNG NHẤT bảng (0,55) vì ngoài đời sân trong tường cao là *cách DUY NHẤT dùng
  // được đất giữa sa mạc* — tức cái sân CHÍNH LÀ kiểu nhà. Vậy mà 25/28 ô mất sân, vì cửa (3):
  // nhà kỷ 15 hẹp tới mức mất chi tiết mái nên đòi lại cả suất đất. Đo cả hai phía:
  //     giữ phép trả-đất  → chi tiết mái 28/28 (100%) · sân 3/28 (11%)
  //     bỏ phép trả-đất   → chi tiết mái  3/28 (11%)  · sân 28/28 (100%)
  // Một cái đúng-hoặc-sai thật sự. KHÔNG chữa bằng cách bỏ phép trả-đất (đo được: 5 kỷ — 2, 3, 6,
  // 9, 15 — tụt xuống dưới sàn 0,7, tổng 473 → 384), cũng KHÔNG chữa bằng một nhánh `if (era ===
  // 15)` (đó là cách một bảng 15 dòng thoái hoá thành 15 ngoại lệ). Ghi ở `TECH_DEBT #92` kèm cả
  // hai cột số, và ĐẾM RA ở đây để phiên sau không đọc "3/28" thành một con số bình thường.
  // THỬ-CHO-ĐỎ (đã chạy): gỡ nhãn `groundCover` khỏi `sanThanhMang` ⇒ mọi kỷ về 0 ⇒ bài này ĐỎ.
  const coSan = new Map();
  let daKiem = 0;
  for (const era of ERAS) {
    let co = 0;
    const homes = oNhaDan(era);
    for (const home of homes) {
      if (khoiCua(era, home).parts.some((p) => p.groundCover)) co += 1;
      daKiem += 1;
    }
    coSan.set(era, { co, tong: homes.length });
  }
  assert.equal(daKiem, 473, 'gác chạy-rỗng');

  // (1) Kỷ KHÔNG có mảnh sân nào phải ĐÚNG BẰNG kỷ khai `yard: 0` — không hơn một kỷ nào. Đây là
  // chỗ khoá lời khẳng định "cái cổng tự kể đúng lịch sử": ba nền mà ngoài đời nhà THẬT SỰ dính
  // vào nhau (Çatalhöyük · insula La Mã · nhà đấu lưng Anh). Trước Phase 22 câu ấy chỉ là một
  // dòng chú thích trong `block.js`, và nó SAI ở chỗ đổ công cho ngưỡng mắt trong khi thứ loại ba
  // kỷ ấy là chính BẢNG. Nay hai vế được đặt cạnh nhau nên không thể lệch mà không ai biết.
  const khongSan = ERAS.filter((era) => coSan.get(era).co === 0);
  const khaiKhong = ERAS.filter((era) => BLOCK_STYLES[era].yard === 0);
  assert.deepEqual(khongSan, [1, 7, 10],
    `kỷ không có mảnh sân nào nay là [${khongSan.join(',')}] — phải đúng bằng ba nền nhà-dính-nhau`);
  assert.deepEqual(khongSan, khaiKhong,
    `kỷ KHÔNG dựng sân [${khongSan.join(',')}] lệch với kỷ KHAI yard = 0 [${khaiKhong.join(',')}] — `
    + 'một kỷ khai có sân mà không dựng ra sân nào là một cơ chế vừa chết trong im lặng');

  // (2) Kỷ khai CÓ sân thì phải dựng được sân ở PHẦN LỚN số ô. Ngoại lệ được KỂ TÊN bằng `deepEqual`
  // chứ không phải "bao gồm": kỷ thứ hai rơi vào thì đỏ, mà kỷ 15 được chữa xong cũng đỏ.
  const hutSan = ERAS.filter((era) => BLOCK_STYLES[era].yard > 0
    && coSan.get(era).co / coSan.get(era).tong < 0.5);
  assert.deepEqual(hutSan, [15],
    `kỷ khai có sân mà quá nửa số ô không dựng được sân nay là [${hutSan.join(',')}] — dài ra là có `
    + 'kỷ vừa rơi vào cùng cái bẫy "nhà đòi lại đất" của kỷ 15; rỗng đi thì mừng, `TECH_DEBT #92` '
    + 'đã giải, hãy cập nhật bảng số ở trên');

  // (3) Và 11 kỷ còn lại phải gần như phủ kín — không có vế này thì một kỷ tụt từ 39/39 xuống
  // 20/39 vẫn lọt qua cả hai vế trên.
  for (const era of ERAS) {
    if (BLOCK_STYLES[era].yard === 0 || era === 15) continue;
    const { co, tong } = coSan.get(era);
    assert.ok(co / tong >= 0.95,
      `kỷ ${era}: chỉ ${co}/${tong} ô có sân (${(co / tong * 100).toFixed(0)}%) — dưới 95%`);
  }
});

test('GOLDEN — thêm tham số `plot` KHÔNG được đổi một chữ số nào của lối gọi cũ', () => {
  const TYPES = ['house', 'shop', 'workshop'];
  const RARITIES = ['common', 'rare', 'epic'];
  for (const era of ERAS) {
    const h = createHash('md5');
    for (const bp of BLUEPRINT_CATALOG[era]) {
      for (const level of [1, 2, 3]) {
        h.update(JSON.stringify(buildBuildingSpec({
          bpId: bp.id, era, type: bp.type, rarity: bp.rarity, level,
        })));
      }
    }
    for (const type of TYPES) {
      for (const rarity of RARITIES) {
        for (let k = 0; k < 4; k += 1) {
          h.update(JSON.stringify(buildBuildingSpec({
            bpId: `dw-${era}-${k}-${type}`, era, type, rarity, level: 1,
          })));
        }
      }
    }
    assert.equal(h.digest('hex'), GOLDEN[era],
      `kỷ ${era}: mô tả công trình đã ĐỔI so với mốc trước Phase 14 — mọi thành phố trong bảo tàng `
      + 'sẽ mở ra khác lần trước (ADR-007). Đây KHÔNG phải chỗ để cập nhật chữ ký cho hết đỏ.');
  }
});

test('ADR-007 QUA THỜI GIAN — quét 1…120 phiên × 15 kỷ, khu phố của một ô không bao giờ đổi', () => {
  // `cityLayout.test.js` đã canh *"ô nào của ai"* trên lưới tích đầy đủ. Thứ chưa ai canh là:
  // cùng một ô, qua mọi mốc phiên, có ra cùng một KHU PHỐ không. Rủi ro còn lại nằm ở `type` và
  // `rarity` — hai trường mà `computeCityLayout` gán cho từng ô nhà dân; chúng đổi thì hình khối
  // đổi theo, trong khi bài test vị trí vẫn xanh vì ô không hề dời đi đâu.
  //
  // ⚠️ Nhớ kết quả theo khoá `bpId|type|rarity` để không dựng lại cùng một khu phố 120 lần: quét
  // đủ 1800 mốc mà chỉ tốn ~450 lượt dựng thật.
  //
  // THỬ-CHO-ĐỎ (đã chạy): cho `deriveDwellings` trả `rarity: sessions % 2 === 0 ? 'epic' : …`
  // ⇒ bài này ĐỎ. ⚠️ `Math.random()` KHÔNG làm nó đỏ, vì phép nhớ theo khoá chỉ dựng mỗi khu phố
  // một lần — bài số 4 mới là bài canh tính tất định. Hai bài canh hai thứ khác nhau.
  const nho = new Map();
  const chuKy = (era, home) => {
    const khoa = `${bpIdCua(era, home)}|${home.type}|${home.rarity}`;
    if (!nho.has(khoa)) {
      nho.set(khoa, createHash('md5').update(JSON.stringify(khoiCua(era, home))).digest('hex'));
    }
    return nho.get(khoa);
  };

  let soSanh = 0;
  for (const era of ERAS) {
    const daThay = new Map(); // index nhà dân → chữ ký khu phố
    for (let s = 1; s <= 120; s += 1) {
      for (const home of oNhaDan(era, s)) {
        const ck = chuKy(era, home);
        const cu = daThay.get(home.index);
        if (cu === undefined) { daThay.set(home.index, ck); continue; }
        assert.equal(ck, cu, `kỷ ${era}, ${s} phiên: khu phố ở ô nhà dân #${home.index} ĐỔI HÌNH `
          + '— một thành phố đã xây xong không được đổi dáng vì Đàm tập trung thêm một phiên');
        soSanh += 1;
      }
    }
    assert.ok(daThay.size >= 15, `kỷ ${era}: chỉ ${daThay.size} ô nhà dân qua 120 mốc — quét chạy rỗng`);
  }
  assert.ok(soSanh >= 30000, `chỉ so được ${soSanh} lượt — phép quét đang bỏ trống phần lớn lưới`);
});
