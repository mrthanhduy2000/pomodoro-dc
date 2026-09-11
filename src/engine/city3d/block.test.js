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
import { dwellingBpId } from './cityParts.js';

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
  // BẢNG HIỆN HÀNH (đo sau §5, quần thể 473 ô — tỉ số trung bình cả kỷ):
  //   kỷ  1 = 1,0245 · 2 = 1,0215 · 3 = 1,0122 · 4 = 1,0606 · 5 = **0,9942 ✗** · 6 = 1,0026
  //   kỷ  7 = 1,0092 · 8 = 1,0181 · 9 = 1,0517 · 10 = 1,0105 · 11 = 1,1462 · 12 = 1,1189
  //   kỷ 13 = 1,1562 · 14 = 1,0809 · 15 = 1,0980
  //   theo NHÓM: `house` 1,097 (241 ô) · `shop` 1,049 (71 ô) · `workshop` 1,008 (161 ô)
  //
  // ⚠️ VÀ KHÔNG NỚI NGƯỠNG. Ngưỡng vẫn là 1, kỷ trượt được KỂ TÊN BẰNG (`assert.deepEqual`): kỷ
  // thứ hai rơi xuống thì đỏ, mà kỷ 5 được chữa xong cũng đỏ. Nới xuống 0,99 là bỏ răng cho cả 15
  // kỷ (bài học Phase 9A). Ghi ở `TECH_DEBT #90`.
  //
  // THỬ-CHO-ĐỎ (đã chạy 2026-08-21): hạ `storey` kỷ 7 từ 1,7 về 1,0 ⇒ bài này ĐỎ.
  let daKiem = 0;
  let biMin = Infinity;
  const truot = [];
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
    const ti = caoKhoi / caoRef;
    biMin = Math.min(biMin, ti);
    if (ti < 1) truot.push(era);
    // Vế hai: không một khu phố nào được tụt xuống thành một đám lều. Thấp nhất đo được sau §5 là
    // **0,799** ở kỷ 1 (ô `shop/rare`), kế đó 0,801 ở kỷ 7 — chỉ 6,5% trên sàn 0,75, tức vế này
    // vẫn đang ở mép. Đừng đọc nó thành "còn thoải mái".
    assert.ok(thapNhat >= 0.75, `kỷ ${era}: có khu phố chỉ còn ${thapNhat.toFixed(3)}× chiều cao căn nhà cũ`);
  }
  assert.equal(daKiem, 473, 'quần thể đổi cỡ — mọi con số biên ghi trong file này phải đo lại');
  // ⚠️ ROUND 47 (ADR-087) — THE LIST IS EMPTY, and here is why that is a fix and not a loosening.
  // `TECH_DEBT_3D #90` named the root cause of era 5's slip: a height that scales with the UNIT's
  // width while the reference house keeps the full plot. `emitRoof` now takes the roof rise on the
  // full-plot footprint (`ctx.plotFx/plotFz`), so a split block's roofs are as tall as the single
  // house's — and every one of the 15 eras is now HIGHER after the split (era 5 was 0,9942, era 12
  // had dropped to 0,97 when its dwellings gained a snow gable). The threshold is still 1; the
  // list is still the timer: any era appearing here again is a real regression, not a rounding.
  assert.deepEqual(truot, [],
    `kỷ bị THẤP ĐI sau khi chia khu phố nay là [${truot.join(',')}] — dài ra là có kỷ mới tụt xuống, `
    + 'ngắn đi là có kỷ vừa được chữa (hãy cập nhật bảng số trong chú thích và `TECH_DEBT #90`)');
  assert.ok(biMin < 1.02, `biên mỏng nhất nay là ${biMin.toFixed(4)}× — nếu nó nới rộng ra thì tốt, `
    + 'nhưng hãy cập nhật con số 0,9942 trong chú thích thay vì để nó thành một lời nói dối');
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

test('MỘT Ô LÀ MỘT KHU PHỐ — mỗi ô phải ra ÍT NHẤT 4 khối nhìn thấy, cả 15 kỷ', () => {
  // Cả phase quy về đúng câu này. Trước Phase 14 mỗi ô ra 1 khối; nay **cả 15 kỷ ra đúng 4,00**.
  // Tổng 473 ô → **1892 khối** (đo lại sau Phase 21 §5; trước §5 là 476 ô → 1904, trước §4 là
  // 2370 khối, trước đó nữa 432 ô → 2172 và 371 ô → 1812).
  //
  // ⚠️ CON SỐ 4,00 ĐỀU TĂM TẮP Ở CẢ 15 KỶ LÀ MỘT SỰ THẬT CẦN ĐỌC, KHÔNG PHẢI MỘT DẤU HIỆU LÀNH.
  // Phase 21 §4 đóng trần khu phố ở ĐÚNG MỘT Ô để hai căn nhà kề nhau thôi xuyên qua nhau, và
  // ràng buộc ấy khoá luôn số suất đất: 1,0 ô chia cho sàn 0,3276 ra 3,05 ⇒ tối đa 2 suất mỗi
  // trục ⇒ 4. Nghĩa là cột `units`/`cols`/`rows` của bảng nay là một trục CHẾT — 15 dòng khai
  // 4…10 mà dựng ra một con số duy nhất. Đó là SỐ HỌC, không phải một tham số chỉnh được, nên nó
  // được ĐẾM RA tường minh ở `blockStyle.test.js` (`KHÔNG KỶ NÀO ĐẠT SỐ SUẤT ĐẤT ĐÃ KHAI`) và ghi
  // ở `TECH_DEBT #88` thay vì bị giấu sau một ngưỡng rộng tay.
  //
  // ⚠️ Ngưỡng viết bằng `MIN_UNITS` chứ không viết cứng số 4: hai bên phải là MỘT luật một công
  // thức. Nhưng vì thế nó có thể trôi theo hằng số ấy, nên có thêm một trần cho chính cái trần ở
  // `blockStyle.test.js` (`MIN_UNITS >= 4`).
  // THỬ-CHO-ĐỎ (đã chạy): `deriveBlockUnits` trả `out.slice(0, 1)` ⇒ bài này ĐỎ.
  let tongKhoi = 0;
  let tongO = 0;
  for (const era of ERAS) {
    const homes = oNhaDan(era);
    let khoi = 0;
    for (const home of homes) khoi += khoiCua(era, home).units;
    tongO += homes.length;
    tongKhoi += khoi;
    const ti = khoi / homes.length;
    assert.ok(ti >= MIN_UNITS, `kỷ ${era}: trung bình chỉ ${ti.toFixed(2)} khối/ô — `
      + `phép kẹp "trần thắng sàn" đang cắt xuống dưới ${MIN_UNITS}, tức ô ấy quá chật cho bảng đã khai`);
    // Và không kỷ nào được vượt số đơn vị mình KHAI — vượt nghĩa là hàm chia đang tự bịa thêm.
    assert.ok(ti <= blockUnitCount(BLOCK_STYLES[era]) + 1e-9,
      `kỷ ${era}: dựng ra ${ti.toFixed(2)} khối/ô nhưng bảng chỉ khai ${blockUnitCount(BLOCK_STYLES[era])}`);
  }
  assert.equal(tongO, 473, 'gác chạy-rỗng');
  assert.ok(tongKhoi >= 1850, `cả 15 kỷ chỉ còn ${tongKhoi} khối nhìn thấy (đo được 1892 sau Phase 21 §5)`);
});

test('TRỤC CHẾT ĐƯỢC ĐẾM RA: mọi ô của mọi kỷ đều ra ĐÚNG 4 suất đất', () => {
  // ⚠️ BÀI TEST NÀY GHI LẠI MỘT KHUYẾT TẬT, KHÔNG BẢO CHỨNG MỘT LỜI HỨA — đọc kỹ trước khi "sửa".
  // Phase 21 §4 đóng trần khu phố ở ĐÚNG MỘT Ô (`BLOCK_MAX_CELLS`) để hai căn nhà kề nhau thôi
  // xuyên qua nhau — đúng thứ Đàm đòi («nhà xếp chồng lên nhau… rất phản thực tế»). Cái giá là
  // một ràng buộc SỐ HỌC không chỉnh được: một ô rộng 1,0 chia cho sàn `MIN_UNIT_CELLS` = 0,3276
  // chỉ chứa nổi 2 suất mỗi trục ⇒ **4**. Nên cột `units`/`cols`/`rows` của `blockStyle.js` — 15
  // dòng khai 4…10 — nay dựng ra đúng MỘT con số. Đó là định nghĩa của một trục CHẾT (bài học
  // `MIN_STONE` Phase 9D), và một trục chết phải được ĐẾM RA chứ không được để im lặng.
  //
  // Vì sao là một bài test chứ không chỉ là một dòng trong `TECH_DEBT.md`: một mục nợ chỉ được
  // đọc khi có người đi tìm, còn một con số trong bài test thì TỰ ĐÒI được đọc (Phase 10 Bước 1).
  // Ghi ở `TECH_DEBT #88`.
  //
  // ⚠️ VÀ NÓ PHẢI HỎI QUA `buildBlockSpec`, TỨC ĐƯỜNG MÀ MÀN HÌNH ĐI. Bản đầu tôi viết bài này ở
  // `blockStyle.test.js` và hỏi thẳng `deriveBlockUnits({ blockW: 1, blockD: 1 })` — nó xanh, nó
  // đọc lên hợp lý, và phép thử ngược cho thấy nó **không thể** đỏ: `deriveBlockUnits` nhận bề
  // ngang làm THAM SỐ, nên cái trần nằm ở `block.js` không đi qua nó. Tôi đã suýt ship một dòng
  // THỬ-CHO-ĐỎ nói dối về chính bài test mình vừa viết.
  // THỬ-CHO-ĐỎ (ĐÃ CHẠY THẬT): `BLOCK_MAX_CELLS = 2` ⇒ khối/ô đi từ 4,00 lên dải 4,00–5,94
  // (tổng 1904 → 2254) ⇒ bài này ĐỎ ở vế `raBaoNhieu`.
  const raBaoNhieu = new Set();
  let daKiem = 0;
  for (const era of ERAS) {
    for (const home of oNhaDan(era)) {
      raBaoNhieu.add(khoiCua(era, home).units);
      daKiem += 1;
    }
  }
  assert.equal(daKiem, 473, 'gác chạy-rỗng');
  assert.deepEqual([...raBaoNhieu].sort((a, b) => a - b), [4],
    `số suất đất dựng ra nay là {${[...raBaoNhieu].join(',')}} — nhiều hơn một giá trị nghĩa là `
    + 'trục đã SỐNG LẠI (mừng!), hãy cập nhật `TECH_DEBT #88` và hai bảng số trong file này; ít '
    + 'hơn 4 nghĩa là một ô đã chật tới mức không chia nổi, đó mới là lỗi');
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
  // ⚠️ Hỏi ở cấp CẢ KỶ, không hỏi từng công trình — bài học Phase 10 Bước 2: đếm ở cấp một công
  // trình thì báo động giả, vì họ vật liệu gộp trên toàn kỷ.
  // THỬ-CHO-ĐỎ (đã chạy): đổi vai của khối đầu tiên mỗi khu phố sang `'water'` ⇒ bài này ĐỎ.
  let daKiem = 0;
  for (const era of ERAS) {
    const vaiRef = new Set();
    const vaiKhoi = new Set();
    for (const home of oNhaDan(era)) {
      for (const p of refCua(era, home).parts) vaiRef.add(p.role);
      for (const p of khoiCua(era, home).parts) vaiKhoi.add(p.role);
      daKiem += 1;
    }
    const la = [...vaiKhoi].filter((v) => !vaiRef.has(v));
    assert.deepEqual(la, [], `kỷ ${era}: khu phố kéo thêm vai [${la.join(',')}] mà nhà dân cũ chưa từng dùng`);
    assert.ok(vaiKhoi.size >= 3, `kỷ ${era}: chỉ ${vaiKhoi.size} vai — quần thể sai hình dạng, phép so vô nghĩa`);
  }
  assert.equal(daKiem, 473, 'gác chạy-rỗng');
});

test('CHI TIẾT MÁI KHÔNG ĐƯỢC CHẾT — và danh sách kỷ mất một phần được ĐẾM RA', () => {
  // ⚠️ ĐÂY LÀ QUẢ MÌN ĐÃ NỔ MỘT LẦN TRONG CHÍNH PHASE NÀY, ghi lại để phiên sau khỏi giẫm lại.
  // `emitRooftop` có một phép từ chối thẳng: `min(rw, rd) < ROOFTOP_MIN_SPAN (0,24)` thì KHÔNG
  // dựng gì trên mái. Bản chia nhỏ đầu tiên làm mọi đơn vị rơi xuống dưới mốc ấy ⇒ **13/15 kỷ mất
  // SẠCH chi tiết mái nhà dân** (kỷ 1: 17 → 0) trong im lặng — chỉ `rooftop.test.js` kêu lên.
  // Đã vá bằng hai việc: nâng `MIN_UNIT_CELLS` để ôm luôn `ROOFTOP_MIN_SPAN × BUILDING_SCALE`, và
  // đo hình bao thật của từng đơn vị thay vì suy nó từ bản tham chiếu.
  //
  // Sau Phase 21 §5 (quần thể 473 ô) giữ được **463/473 ô — 97,9%**, so với 469/476 (98,5%) trước
  // §5, 431/476 giữa chừng, 389/432 (90%) sau Phase 20 và 313/371 (84%) trước đó. Nhưng đừng đọc
  // số tổng thành "ổn" — nó che mất chỗ mỏng, đúng bài học `TECH_DEBT #22`, nên vế `duoiSan` vẫn
  // đứng đó.
  //
  // ⚠️ §5 LÀM CON SỐ NÀY TỆ ĐI MỘT CHÚT, VÀ ĐÂY LÀ CHỖ NÓI THẲNG RA: số ô mất chi tiết mái đi từ
  // **7/476 (1,5%) lên 10/473 (2,1%)**, và kỷ 6 — kỷ tệ nhất bảng — từ 0,893 xuống **0,844**. Cơ
  // chế KHÔNG đổi (không ai đụng `ROOFTOP_MIN_SPAN` hay `blockStyle.js`); thứ đổi là THÀNH PHẦN
  // quần thể: kỷ 6 nay có 32 ô thay vì 28, và bốn ô mới phần lớn là `workshop` — nguyên mẫu
  // thấp-rộng bị bóp mỏng nhất. Năm ô kỷ 6 mất mái là `workshop/common@1,1` · `shop/epic@4,3` ·
  // `workshop/rare@7,1` · `workshop/common@5,9` · `workshop/rare@8,9`.
  //
  // ⚠️ DANH SÁCH KỶ TỤT DƯỚI SÀN NAY RỖNG, VÀ ĐÓ LÀ MỘT SỰ THẬT VỀ QUẦN THỂ + BẢNG SỐ CHỨ KHÔNG
  // PHẢI MỘT LỜI HỨA — đừng đọc nó thành "đã chữa xong một lần cho mãi mãi". Cơ chế không đổi:
  // kỷ nào có ngõ rộng (`alley`) thì mỗi căn bị bóp mỏng hơn `ROOFTOP_MIN_SPAN` và mất chi tiết
  // mái. Phase 21 §4 phải hạ ngõ kỷ 6 từ 0,26 xuống 0,18 đúng vì lý do ấy (đo được: 0,429 → 0,893
  // — xem chú thích tại dòng kỷ 6 của `blockStyle.js`), và hệ số `EAVE_LAND_FACTOR` được chọn
  // bằng một bảng quét ba cột chứ không bằng cảm giác. Một danh sách RỖNG được `assert` BẰNG chứ
  // không bỏ đi: kỷ đầu tiên rơi xuống lại thì đỏ ngay. KHÔNG hạ sàn 0,7 (hạ là bỏ răng cho cả 15
  // kỷ). Ghi ở `TECH_DEBT #90`. Bốn kỷ dưới 100%, cũng kể tên BẰNG chứ không "bao gồm".
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
  // ⚠️ ROUND 50 (ADR-090) — THE LIST IS EMPTY, AND THAT CLOSES `#90(b)` AND `#77`. The ceiling that
  // killed this detail was an absolute span (0,24) applied to blocks of every size; it is now a
  // RELATION (`ROOFTOP_MIN_SPAN` = eye pixels ÷ what a rooftop object covers at the close-up frame),
  // which lands at 0,083 — so era 6 (the widest alleys in the table, the thinnest units) keeps all
  // its rooftop detail, and so do 10 · 11 · 13. Measured the same way as before: 473/473 units.
  // The land floor did NOT move (`ROOFTOP_LAND_SPAN`), so no dwelling changed size (ADR-007).
  assert.deepEqual(duoi100, [],
    `kỷ mất một phần chi tiết mái nay là [${duoi100.join(',')}] — danh sách này phải RỖNG từ vòng 50; `
    + 'dài ra là có kỷ vừa tụt xuống dưới trần quan hệ mới');
  assert.ok(coKhoi / coRef >= 0.95, `cả 15 kỷ chỉ giữ ${coKhoi}/${coRef} ô có chi tiết mái (đo được 463/473)`);
  // ⚠️ CỬA SỔ HAI PHÍA NÀY LÀ MỘT CÁI GHIM, KHÔNG PHẢI CÁI SÀN. Sàn là `duoiSan` (0,7) ngay trên,
  // và nó KHÔNG bị hạ. Ghim thì phải ghim quanh giá trị THẬT: 0,893 → **0,844** sau §5, nên cửa sổ
  // dịch theo, giữ nguyên bề rộng 0,10. Tụt xuống dưới 0,80 hay vọt lên trên 0,90 đều đỏ.
  // round 50 (ADR-090): 1,000 — every unit of every era keeps its rooftop detail now that the ceiling
  // is a relation (`#77`/`#90(b)` closed). The floor 0,80 stays as the alarm: a future change that
  // takes detail away again is what this line exists to catch.
  assert.ok(teNhat >= 0.80 && teNhat <= 1, `tệ nhất nay là ${teNhat.toFixed(3)} (vòng 50: 1,000 — trước đó 0,844 kỷ 6)`);
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
/*
  ⚠️ ROUND 47 (ADR-087) RE-BASED THIS TABLE, AND THIS IS THE ONE LEGITIMATE REASON TO. The hashes
  are the SHAPE of every building spec; ADR-007 locks the PLACE of a building, never its shape
  (Đàm, 2026-09-08: "ADR-007 khoá CHỖ ĐỨNG, không khoá HÌNH DÁNG"). Round 47 changed shapes on
  purpose — rounded corners and wider bevels (parts.js), hip/mansard vernacular roofs, a relative
  window floor, 12-gon domes — so every digest moved. Position is guarded by the test right below
  ("ADR-007 QUA THỜI GIAN") and by `cityPlan.test.js`; both stayed green through the re-base. The
  table still does its job: a shape change that nobody meant to make goes red here.
*/
// ⚠️ ROUND 48 (ADR-088): re-based ONCE MORE, for one key only — chimney stacks now carry `tag: 'stack'`
// (the smoke source). Eras without chimneys did not move; positions never did (ADR-007 tests separate).
// Round 50 (ADR-090): ALL FIFTEEN re-based THREE times on purpose — interiors, the rooftop relation,
// and then per-era facade detail (`facadeDetail.js`: string courses, shutters, brackets, balconies,
// signs, downpipes). Previously in this round: re-based TWICE on purpose — interiors behind open doors, and then
// the rooftop ceiling became a relation so small units carry their chimneys and vanes again (#77,
// #90(b)). Details on the first pass: every era's buildings gained an interior
// behind their open doors (`interiors.js`); the landmark of each era is untouched (it stays shut,
// because a room is asymmetric and the wonder must mirror). Previously:
// Round 49 (ADR-089): six eras re-based on purpose — a flag on every `mast` motif (8, 12), a hanging
// cloth on every `banner` (4), a flame in every `firepit` (1, 6, 13). The other nine are untouched.
// ⚠️ ROUND 51 (ADR-091): TWELVE of fifteen re-based on purpose — the facade vocabulary gained the
// BOTTOM TWO METRES (`facadeDetail.js`: a number plate beside the door, a window box under the sill,
// a shop board across the opening). Round 50 wrote that table looking at a building from across the
// square, so every item on it lived at storey height or above; round 50 also put the eye on the
// street, where none of them is in the frame.
// ⚠️ AND ERAS 1–3 DID NOT MOVE, WHICH IS THE EVIDENCE THIS WAS SCOPED. Göbekli Tepe, Egypt and Ur
// have no street numbering, no window boxes and no shopfronts, so their vocabulary gained nothing —
// and their digests are byte-identical to round 50's. A re-base that moved all fifteen would have
// meant the change leaked somewhere it was not meant to go.
// ⚠️ ROUND 53 (ADR-093): THÁI LẠI 13/15, VÀ HAI KỶ ĐỨNG YÊN CHÍNH LÀ BẰNG CHỨNG.
// Mọi ô cửa sổ của thành phố thành MỘT CÁI HỐC có hai má cửa đứng, lanh tô, bệ có giọt nước, nan
// chia ô, và (tùy kỷ) song sắt, cánh chớp, mái hắt — xem `windowOpening.js`. Kỷ 1 (Göbekli Tepe) và
// kỷ 2 (Ai Cập) khai `windows: 'none'`, nên chữ ký của chúng PHẢI byte-y-hệt — và chúng đúng như vậy.
// ⚠️ CẬP NHẬT CUỐI VÒNG: 14/15 đổi, và CHỈ KỶ 1 đứng yên. Ngoài bộ hốc cửa sổ, vòng 53 còn thêm
// **TRỤ ÁP TƯỞNG** (Việc 3) — một trục ĐỨNG trên mặt tường, đối xứng với ba đường NGANG đã có
// từ Phase 8A. Trụ không phụ thuộc cửa sổ, nên kỷ 2 (Ai Cập, `windows: 'none'`) cũng đổi — đúng như
// mong đợi. Kỷ 1 đứng yên vì mọi khối của nó hoặc là `mass.low` hoặc thấp hơn ngưỡng một tầng.
// ⚠️ VÀ MỘT CHỮ KÝ KHÔNG ĐỔI CŨNG LÀ DỮ LIỆU. Lần chạy đầu, kỷ 14 và 15 cũng đứng yên — nhưng hai
// kỷ ấy CÓ cửa sổ, chỉ là chúng đi nhánh "dải kính liền" nên không chạy qua `emitOpening`. Đó là
// một LỖ HỔNG, không phải một phạm vi được kiềm chế, và `emitGlassBand` sinh ra để vá nó. Đọc bảng
// này theo CẢ HAI chiều: kỷ nào đổi, và kỷ nào ĐÁNG Lẽ phải đổi mà không.
const GOLDEN = {
  1: '231d3db716d9c91bf8af8b10eca02471',
  2: '1dd12ee2d0a1be81c67fbb67cb9437d8',
  3: '8e2ab6e4cae586d3f6f150d7aa3b2029',
  4: '4b86731192d19516a9360b7dc71890ae',
  5: '56b00f5cac76b87d268c47b78c28ba9b',
  6: 'a97061cf5842e397ce5243944eacd7ef',
  7: 'e695a3000a966d735d8d70377312089d',
  8: '141987ae5f5763e20a56c3f0a00298f6',
  9: '07c7478f57a3050bd9cefde565df92c5',
  10: '8de77726555fd9a04716af097940a403',
  11: 'db37b03b1b798190f5420852f315fca0',
  12: '46367dc98da3a4d9b6cd3e60928b8347',
  13: 'c582a58f3f1fa83104b5a8ea1b9a6460',
  14: '8d095a81ba06f4dfefcc7d8767d61624',
  15: 'ff7c4324f3b7a6a932306c5e9fac738a',
};

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
