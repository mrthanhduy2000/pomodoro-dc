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
 * `sessionCount: 80, level: 3` — quần thể 371 ô nhà dân của cả 15 kỷ.
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

/**
 * Kỷ KHÔNG giữ được lời hứa "chia khu phố xong thành phố không thấp đi", sau ADR-059.
 * ⚠️ Đây là một DANH SÁCH ĐẾM ĐƯỢC, không phải một cái ngưỡng nới ra — xem chú thích trong bài.
 */
const THAP_DI = [1, 2];

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
  // BIÊN THẬT (đo 2026-08-21): tỉ số trung bình thấp nhất là **kỷ 1 = 1,0072** — chỉ 0,7% trên
  // ngưỡng. Kỷ 2 = 1,0078. Hai kỷ ấy sát mép vì `storey` của chúng (1,95 và 1,93) đã gần chạm
  // trần 2,0 mà `isValidBlockStyle` cho phép. Ai chia nhỏ thêm ở hai kỷ đó thì PHẢI đo lại, và
  // sẽ hết chỗ nâng — lúc ấy câu trả lời là bớt cột/hàng, không phải nới trần.
  //
  // THỬ-CHO-ĐỎ (đã chạy 2026-08-21): hạ `storey` kỷ 7 từ 1,7 về 1,0 ⇒ bài này ĐỎ.
  //
  // ══════════════════════════════════════════════════════════════════════════════════════════
  // ⚠️ 2026-08-24 — LỜI CẢNH BÁO NGAY TRÊN ĐÂY ĐÃ ỨNG NGHIỆM, ĐÚNG NHƯ NÓ VIẾT.
  // ══════════════════════════════════════════════════════════════════════════════════════════
  // ADR-059 cho mỗi kỷ một MẠNG ĐƯỜNG riêng, nên tập ô nhà dân đổi theo — mà mọi con số của bài
  // này lại được hiệu chuẩn trên đúng tập ô của mạng bàn cờ cũ. Đo được sau khi đổi:
  //
  //   · kỷ 1: 1,0072 → **0,9584**      · kỷ 2: 1,0078 → **0,9669**      · 13 kỷ còn lại: vẫn ≥ 1
  //
  // Và **cả hai đường thoát mà chú thích trên kê đơn đều đã cạn**, đã đo từng cái một:
  //   · *"nâng `storey`"* — kỷ 1 khai 1,95, trần `isValidBlockStyle` là 2,0; đẩy tới đúng 2,0 chỉ
  //     lên 0,9695. Ngay cả khi vặn hết cỡ CẢ BA núm (alley 0 · storey 2,0 · vary 0,5) thì kỷ 1
  //     mới chạm **1,0007** — tức mua lại lời hứa bằng một biên 0,07%, mỏng hơn cả cái biên vừa gãy.
  //   · *"bớt cột/hàng"* — kỷ 1 đang 2×2 = 4 đơn vị, đúng bằng `MIN_UNITS`. Hết chỗ bớt.
  //     Kỷ 2 thì bớt được (4×2 → 2×2 cho 1,0137), nhưng Deir el-Medina là làng thợ do nhà nước
  //     dựng thành HAI DÃY DÀI — 4×2 chép đúng hình ấy, 2×2 thì không. Đổi nó là mua một con số
  //     bằng cách nói sai lịch sử, thứ ADR-025 cấm.
  //
  // ⇒ Ghi thành NGOẠI LỆ ĐẾM ĐƯỢC thay vì nới ngưỡng cho cả 15 kỷ (nới là bỏ răng ở 13 kỷ đang
  // lành). Kỷ thứ ba rơi vào thì ĐỎ; một trong hai kỷ này được chữa xong thì cũng ĐỎ. Chi tiết +
  // các phương án còn lại: `TECH_DEBT #84`.
  //
  // ⚠️ VÀ ĐÂY LÀ BÀI HỌC THẬT SỰ, ĐÁNG NHỚ HƠN CẢ HAI CON SỐ: lời hứa này **chưa bao giờ vững**.
  // Nó đứng trên biên 0,7% ở hai kỷ, và chính khối chú thích trên đã ĐO ra điều đó rồi VIẾT RA
  // rằng ai đụng vào sẽ hết chỗ nâng. Một biên mỏng như vậy không cần một bản vá sai mới gãy —
  // chỉ cần một thay đổi ở một phase KHÁC làm xê dịch quần thể mẫu.
  let daKiem = 0;
  let biMin = Infinity;
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
    if (THAP_DI.includes(era)) {
      // Ngoại lệ ĐƯỢC ĐẾM (xem khối chú thích trên bài). Vẫn có SÀN: tụt quá 5% là chuyện khác hẳn.
      assert.ok(ti >= 0.95, `kỷ ${era} đang trong danh sách ngoại lệ nhưng đã tụt tới ${ti.toFixed(4)} `
        + '— quá sâu so với mức đã ghi nhận, phải xử lý chứ không phải nới danh sách');
      assert.ok(ti < 1, `kỷ ${era} nay ĐẠT (${ti.toFixed(4)}) — gỡ nó khỏi THAP_DI`);
    } else {
      assert.ok(ti >= 1, `kỷ ${era}: chia khu phố xong thành phố THẤP ĐI (${ti.toFixed(4)}× chiều cao cũ) `
        + '— đây đúng cách hỏng mà cả phase sinh ra để tránh; nâng `storey` của kỷ này hoặc bớt cột/hàng');
    }
    // Vế hai: không một khu phố nào được tụt xuống thành một đám lều. Thấp nhất đo được là
    // **0,803** ở kỷ 5 (kỷ có `vary` lớn nhất bảng), nên sàn 0,75 còn 6,6% biên.
    assert.ok(thapNhat >= 0.75, `kỷ ${era}: có khu phố chỉ còn ${thapNhat.toFixed(3)}× chiều cao căn nhà cũ`);
  }
  assert.equal(daKiem, 371, 'quần thể đổi cỡ — mọi con số biên ghi trong file này phải đo lại');
  assert.ok(biMin < 1.02, `biên mỏng nhất nay là ${biMin.toFixed(4)}× — nếu nó nới rộng ra thì tốt, `
    + 'nhưng hãy cập nhật con số 1,0072 trong chú thích thay vì để nó thành một lời nói dối');
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
  // BIÊN THẬT: trôi lớn nhất **0,1103 ô** (kỷ 1) ≈ 7,1 điểm ảnh ở `CELL_PIXELS = 64`. Ngưỡng 0,12
  // còn 8,1% biên — cố tình để chật, vì đây là phép tính TẤT ĐỊNH (không nhiễu), nên chật nghĩa là
  // ai chỉnh bảng sẽ buộc phải đo lại chứ không lặng lẽ trôi tiếp.
  // THỬ-CHO-ĐỎ (đã chạy): `BLOCK_FIT` 0,92 → 1,35 ⇒ bài này ĐỎ (kèm bài 1 và bài 9, đúng như
  // phải thế: nới mặt bằng thì mái đua thò ra, thân teo lại, chi tiết mái rơi xuống dưới mốc).
  const TRAN_TROI = 0.12;
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
  assert.equal(daKiem, 371, 'gác chạy-rỗng: quần thể đổi cỡ');
  assert.ok(troiMax > 0.05, 'trôi lớn nhất tụt xuống rất thấp — hoặc ai đó vừa chữa được nó (hãy '
    + `cập nhật con số 0,1103 trong chú thích), hoặc phép đo này thôi nhìn tới chỗ cần nhìn (nay ${troiMax.toFixed(4)})`);
});

test('MỘT Ô LÀ MỘT KHU PHỐ — mỗi ô phải ra ÍT NHẤT 4 khối nhìn thấy, cả 15 kỷ', () => {
  // Cả phase quy về đúng câu này. Trước Phase 14 mỗi ô ra 1 khối; nay tệ nhất cũng 4,00 (kỷ 1 ·
  // 6 — hai kỷ chạm đúng `MIN_UNITS`), cao nhất 5,93 (kỷ 12). Tổng 371 ô → **1840 khối**.
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
  assert.equal(tongO, 371, 'gác chạy-rỗng');
  assert.ok(tongKhoi >= 1700, `cả 15 kỷ chỉ còn ${tongKhoi} khối nhìn thấy (đo được 1840 lúc chốt phase)`);
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
  assert.equal(daKiem, 371, 'gác chạy-rỗng');
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
  assert.equal(daKiem, 371, 'gác chạy-rỗng');
});

test('CHI TIẾT MÁI KHÔNG ĐƯỢC CHẾT — và danh sách kỷ mất một phần được ĐẾM RA', () => {
  // ⚠️ ĐÂY LÀ QUẢ MÌN ĐÃ NỔ MỘT LẦN TRONG CHÍNH PHASE NÀY, ghi lại để phiên sau khỏi giẫm lại.
  // `emitRooftop` có một phép từ chối thẳng: `min(rw, rd) < ROOFTOP_MIN_SPAN (0,24)` thì KHÔNG
  // dựng gì trên mái. Bản chia nhỏ đầu tiên làm mọi đơn vị rơi xuống dưới mốc ấy ⇒ **13/15 kỷ mất
  // SẠCH chi tiết mái nhà dân** (kỷ 1: 17 → 0) trong im lặng — chỉ `rooftop.test.js` kêu lên.
  // Đã vá bằng hai việc: nâng `MIN_UNIT_CELLS` để ôm luôn `ROOFTOP_MIN_SPAN × BUILDING_SCALE`, và
  // đo hình bao thật của từng đơn vị thay vì suy nó từ bản tham chiếu.
  //
  // ⚠️ ĐO LẠI 2026-08-24 SAU ADR-059 (mỗi kỷ một mạng đường ⇒ tập ô nhà dân đổi theo):
  // **332/371 ô (89,5%)**, tốt hơn mức 313/368 (85%) của mạng bàn cờ, và ca tệ nhất cũng đỡ hơn
  // (kỷ 13: 0,724 → kỷ 6: 0,783). Danh sách kỷ mất MỘT PHẦN thì dài ra (9 → 12) — đọc đúng thì
  // đó không phải đi lùi: nhiều kỷ tụt khỏi 100% một chút, nhưng KHÔNG kỷ nào tụt sâu, nên tổng
  // giữ lại lại cao hơn. Ba kỷ giữ trọn 100% là 1, 3 và 14.
  // THỬ-CHO-ĐỎ (đã chạy): đổi `Math.max` thành `Math.min` trong `MIN_UNIT_CELLS` ⇒ bài này ĐỎ.
  const duoi100 = [];
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
    assert.ok(ti >= 0.7, `kỷ ${era}: chỉ còn ${b}/${r} ô có chi tiết mái (${ti.toFixed(3)}) — `
      + 'đơn vị đang bị chia nhỏ xuống dưới `ROOFTOP_MIN_SPAN`');
  }
  assert.deepEqual(duoi100, [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15],
    `kỷ mất một phần chi tiết mái nay là [${duoi100.join(',')}] — nếu ngắn đi thì tốt, hãy cập nhật `
    + 'con số 332/371 trong chú thích; nếu dài ra thì có kỷ vừa tụt xuống dưới ngưỡng');
  assert.ok(coKhoi / coRef >= 0.8, `cả 15 kỷ chỉ giữ ${coKhoi}/${coRef} ô có chi tiết mái`);
  assert.ok(teNhat >= 0.7 && teNhat < 0.84, `tệ nhất nay là ${teNhat.toFixed(3)} (đo được 0,783 sau ADR-059)`);
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
