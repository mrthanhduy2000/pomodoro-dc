/**
 * setting.test.js — BỐN BẤT BIẾN CỦA MẶT NƯỚC, VÀ CHỖ GIÁP GIỮA HAI TẤM ĐẤT.
 *
 * ⚠️ VÌ SAO BÀI NÀY QUAN TRỌNG HƠN VẺ NGOÀI CỦA NÓ. Mặt nước là thứ đầu tiên trong dự án **sửa
 * trường cao độ** — mọi phase trước chỉ THÊM khối lên trên mặt đất. Một con sông khoét lệch nửa ô
 * sẽ làm một căn nhà lún xuống, một cái cây mọc dưới nước, hoặc mở lại đúng cái khe chạy vòng
 * quanh thành phố mà Phase 9A đã trả giá để vá — và **không thứ nào trong ba thứ ấy làm bất kỳ
 * bài test cũ nào đỏ**. Chúng chỉ hiện ra trên ảnh, ở một kỷ, ở một giờ.
 *
 * ⚠️ MỖI ASSERT DƯỚI ĐÂY ĐỀU ĐÃ NÊU TRƯỚC CHỖ NÓ PHẢI ĐỎ (luật Phase 8A: *"một phép thử ngược phải
 * nêu TRƯỚC nó mong đợi đỏ ở đâu, và khi không đỏ thì nghi CHÍNH PHÉP THỬ"*), và đều đã thử-cho-đỏ.
 */

import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { ERA_STYLES } from './eraStyle.js';
import { hasWater, SETTING_STYLES } from './settingStyle.js';
import {
  BED_RAMP, ERAS_WITH_WATER_GEOMETRY, PROP_SHORE_CLEAR, SHORE_BAND,
  WATER_BED_DEPTH, WATER_BED_LIP, WATER_DROP_BELOW_PLAIN,
  buildSetting, distanceOutsideGrid, hazXuongDay, waterIsBuilt,
} from './setting.js';
import { APRON_DROP, WATER_SURFACE_Y, buildTerrain, terrainSurfaceReach } from './terrain.js';
import { buildHorizon } from './horizon.js';
import { OUTSKIRT_REACH, deriveOutskirts } from './outskirts.js';

const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);
const GRID = 12;

/** Lấy mẫu dày trên TOÀN THẾ GIỚI (cả vùng chân trời), bước 0,25 ô. */
function* diemToanTheGioi(buoc = 0.25) {
  const R = terrainSurfaceReach(GRID) + 2;
  const half = (GRID - 1) / 2;
  for (let u = -R + half; u <= R + half + 1e-9; u += buoc) {
    for (let v = -R + half; v <= R + half + 1e-9; v += buoc) yield [u, v];
  }
}

/** Lấy mẫu dày TRONG lưới 12×12 — kể cả điểm nằm giữa hai ô, vì mặt đất là một tấm liền. */
function* diemTrongLuoi(buoc = 0.25) {
  for (let u = -0.5; u <= GRID - 0.5 + 1e-9; u += buoc) {
    for (let v = -0.5; v <= GRID - 0.5 + 1e-9; v += buoc) yield [u, v];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DỞ DANG CÓ CHỦ Ý — VÀ NÓ ĐẾM ĐƯỢC
// ═══════════════════════════════════════════════════════════════════════════════

test('BƯỚC B DỰNG HÌNH CHO ĐÚNG 2 KỶ CÓ NƯỚC — con số này là cái hẹn giờ, không phải một ghi chú', () => {
  // ⚠️ Đàm ra lệnh: *"dựng hình cho ĐÚNG 3 kỷ (14 biển · 12 sông · 1 khô)… Đừng trải 12 kỷ còn
  // lại."* Bài học Phase 10: *"một mục nợ trong tài liệu chỉ được đọc khi có người đi tìm; một con
  // số trong bài test thì tự đòi được đọc."*
  //
  // THỬ-CHO-ĐỎ: thêm một kỷ vào `ERAS_WITH_WATER_GEOMETRY` ⇒ đỏ ở `deepEqual` ngay dòng dưới, và
  // đỏ tiếp ở `drawCallBudget.test.js` (kỷ ấy chưa có mốc lệnh vẽ mới).
  assert.deepEqual(ERAS_WITH_WATER_GEOMETRY, [12, 14],
    'Bước B chốt đúng hai kỷ có nước. Trải thêm kỷ nào thì phải đo lại mốc lệnh vẽ của kỷ ấy và '
    + 'phải có ảnh cho Đàm xem — đây không phải chỗ để thêm cho tiện.');

  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    assert.equal(hasWater(era), true, `kỷ ${era} được dựng hình nước nhưng BẢNG lại khai không nước`);
    assert.equal(waterIsBuilt(era), true, `kỷ ${era}: \`waterIsBuilt\` nói ngược với danh sách`);
  }
  const kho = ERAS.filter((e) => !waterIsBuilt(e));
  assert.equal(kho.length, 13, `phải còn đúng 13 kỷ chưa dựng nước, đang có ${kho.length}`);

  // Và kỷ 1 phải nằm trong nhóm khô — nó là nhân chứng Đàm chọn cho ràng buộc lệnh vẽ.
  assert.ok(kho.includes(1), 'kỷ 1 phải là kỷ khô — cả bộ ba Bước B dựa vào điều đó');
});

test('KỶ CHƯA DỰNG HÌNH PHẢI TRẢ VỀ MỘT LỚP RỖNG THẬT SỰ, không phải một lớp "gần rỗng"', () => {
  // THỬ-CHO-ĐỎ: trong `buildSetting`, đổi nhánh `!built` cho `blendAt` trả `1e-9` ⇒ đỏ ở dòng
  // `blendAt` dưới đây (và cả thành phố sẽ chìm 1 phần tỉ ô — im lặng tuyệt đối nếu không có bài này).
  let soKyKiem = 0;
  for (const era of ERAS.filter((e) => !waterIsBuilt(e))) {
    const s = buildSetting({ era, gridSize: GRID });
    assert.equal(s.built, false, `kỷ ${era}: \`built\` phải là false`);
    assert.equal(s.bounds, null, `kỷ ${era}: kỷ chưa dựng không được có hộp bao mặt nước`);
    for (const [u, v] of diemTrongLuoi(1)) {
      assert.equal(s.blendAt(u, v), 0, `kỷ ${era} chưa dựng nước mà \`blendAt(${u},${v})\` khác 0`);
      assert.equal(s.depthAt(u, v), 0, `kỷ ${era} chưa dựng nước mà \`depthAt(${u},${v})\` khác 0`);
    }
    soKyKiem += 1;
  }
  assert.equal(soKyKiem, 13, 'không duyệt đủ 13 kỷ khô');
});

// ═══════════════════════════════════════════════════════════════════════════════
// BẤT BIẾN (1) — NƯỚC CHỈ HẠ MẶT ĐẤT, KHÔNG BAO GIỜ NÂNG
// ═══════════════════════════════════════════════════════════════════════════════

test('BẤT BIẾN (1) — `hazXuongDay` KHÔNG BAO GIỜ nâng mặt đất, kể cả khi đất đã thấp hơn đáy', () => {
  // ⚠️ Đây là ca mà một `lerp` trần sẽ SAI: đất ở −9, đáy sông ở −1, trộn 100%. `lerp` kéo mặt đất
  // LÊN 8 đơn vị — con sông tự đắp cho mình một cái gờ giữa đồng. `Math.min` thì không thể.
  //
  // THỬ-CHO-ĐỎ: bỏ `Math.min` trong `hazXuongDay`, để trần `dat + (day − dat) * t` ⇒ đỏ ngay ở
  // dòng đầu tiên (`−9` biến thành `−1`).
  assert.equal(hazXuongDay(-9, -1, 1), -9, 'đất vốn đã sâu hơn đáy thì nước không được kéo nó lên');
  assert.equal(hazXuongDay(-9, -1, 0.5), -9, 'trộn một nửa cũng không được nâng');
  assert.equal(hazXuongDay(0, -1, 1), -1, 'trộn hết thì phải xuống đúng đáy');
  assert.equal(hazXuongDay(0, -1, 0), 0, 'trộn 0 thì giữ nguyên');
  assert.equal(hazXuongDay(0, -1, -5), 0, 'trộn âm (dữ liệu rác) cũng phải giữ nguyên');
  assert.equal(hazXuongDay(0, -1, 3), -1, 'trộn > 1 phải bị kẹp, không được khoét sâu hơn đáy');

  // Đơn điệu: trộn nhiều hơn thì không bao giờ CAO hơn.
  let truoc = Infinity;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const nay = hazXuongDay(0.3, -1.2, t);
    assert.ok(nay <= truoc + 1e-12, `trộn ${t.toFixed(2)} lại cao hơn mức trộn nhỏ hơn`);
    truoc = nay;
  }
});

test('BẤT BIẾN (1) trên MẶT ĐẤT THẬT — chỗ ngập HẲN phải nằm ĐÚNG ở đáy, không cao hơn một chút nào', () => {
  // ⚠️ BẢN ĐẦU CỦA BÀI NÀY SAI, VÀ NÓ SAI THEO ĐÚNG KIỂU ĐÁNG GHI LẠI. Tôi viết *"mọi điểm có nước
  // đều phải thấp hơn `−APRON_DROP + 0,22`"* — nghe như một phát biểu về "nước hạ mặt đất", nhưng
  // nó **không đúng ở dải chuyển tiếp**: ngay sát bờ, độ trộn chỉ 0,35 nên mặt đất mới bị kéo
  // xuống một phần, và nếu chỗ ấy vốn là sườn cao nguyên thì nó vẫn còn cao. Bài test đỏ ở kỷ 12
  // tại (12,00 · −2,50) với cao độ −0,333, và **mã hoàn toàn đúng** — phép đo hỏng, không phải mã.
  //
  // Phát biểu ĐÚNG, và nó chặt hơn hẳn: ở chỗ ngập HẲN (`blendAt === 1`) thì cao độ phải bằng
  // CHÍNH XÁC đáy nước. Chỗ ngập một phần thì chỉ được đòi "không thủng qua đáy".
  //
  // THỬ-CHO-ĐỎ: đổi `Math.min` trong `hazXuongDay` thành `Math.max` ⇒ đỏ ngay ở `assert.equal` dưới
  // đây (mặt đất khô quanh −0,62 sẽ thắng cái đáy −1,00 và ở nguyên tại chỗ).
  let soNgapHan = 0;
  let soNgapMotPhan = 0;
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const t = buildTerrain({ era, gridSize: GRID });
    for (const [u, v] of diemToanTheGioi(0.5)) {
      const tron = t.setting.blendAt(u, v);
      if (tron <= 0) continue;
      const cao = t.surfaceHeightAt(u, v);
      const day = WATER_SURFACE_Y - t.setting.depthAt(u, v);
      assert.ok(cao >= day - 1e-9,
        `kỷ ${era} tại (${u.toFixed(2)},${v.toFixed(2)}): thủng qua đáy (${cao.toFixed(3)} < `
        + `${day.toFixed(3)})`);
      if (tron >= 1 - 1e-12) {
        soNgapHan += 1;
        assert.ok(Math.abs(cao - day) < 1e-9,
          `kỷ ${era} tại (${u.toFixed(2)},${v.toFixed(2)}): ngập hẳn mà cao độ ${cao.toFixed(4)} ≠ `
          + `đáy ${day.toFixed(4)} — nước đang KHÔNG hạ mặt đất xuống hết.`);
      } else {
        soNgapMotPhan += 1;
      }
    }
  }
  assert.ok(soNgapHan > 300,
    `chỉ ${soNgapHan} điểm ngập hẳn — assert chặt nhất của bài này gần như không chạy`);
  assert.ok(soNgapMotPhan > 50,
    `chỉ ${soNgapMotPhan} điểm ở dải chuyển tiếp — dải bờ đang mỏng bất thường`);
});

test('MỘT LUẬT MỘT CÔNG THỨC — phép khoét chỉ được viết ở `setting.js`, không ai chép lại', () => {
  // ⚠️ `terrain.surfaceHeightAt` và `horizon.heightAt` gặp nhau khít ở `innerEdge`. Hai bên tự viết
  // một bản "tương đương" là cách chắc chắn nhất để mở lại đúng cái khe Phase 9A đã vá — và bản
  // đầu của Bước B ĐÃ chép nguyên `Math.min(dat, dat + (day − dat) * tron)` sang cả hai file.
  //
  // THỬ-CHO-ĐỎ: chép công thức ấy ngược trở lại `horizon.js` ⇒ đỏ ở dòng `khong.length === 0`.
  const nguon = [
    ['terrain.js', readFileSync(new URL('./terrain.js', import.meta.url), 'utf8')],
    ['horizon.js', readFileSync(new URL('./horizon.js', import.meta.url), 'utf8')],
  ];
  for (const [ten, ma] of nguon) {
    // ⚠️ Hỏi HAI câu, không gộp làm một: "có nhập không" và "có gọi không". Bản đầu của bài này
    // đếm `hazXuongDay\(` rồi đòi ≥ 2 (nghĩ rằng dòng import cũng khớp) — nó ĐỎ trên mã đang đúng,
    // vì dòng import viết tên trần không có ngoặc. Phép đo hỏng, không phải mã hỏng.
    assert.match(ma, /import \{[^}]*hazXuongDay[^}]*\} from '\.\/setting'/,
      `${ten} không nhập \`hazXuongDay\` từ \`setting.js\``);
    const goi = ma.match(/hazXuongDay\(/g) ?? [];
    assert.equal(goi.length, 1,
      `${ten} gọi \`hazXuongDay\` ${goi.length} lần — mỗi tấm đất chỉ có ĐÚNG một chỗ khoét.`);
    const khong = ma.split('\n').filter((d) => /Math\.min\(\s*dat\b/.test(d));
    assert.equal(khong.length, 0,
      `${ten} có ${khong.length} dòng tự viết lại phép khoét: ${khong.join(' | ')}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// BẤT BIẾN (2) — LƯỚI 12×12 KHÔNG ĐỔI MỘT PHẦN NGHÌN NÀO (ADR-007)
// ═══════════════════════════════════════════════════════════════════════════════

test('BẤT BIẾN (2) — trong lưới 12×12 thì `blendAt` phải bằng ĐÚNG 0 ở cả 15 kỷ', () => {
  // ⚠️ Đây là ADR-007 ("bảo tàng bất động") viết thành số. Nước liếm vào lưới nghĩa là nhà lún,
  // đường trôi, và **không có gì đỏ lên** ngoài bài này.
  //
  // THỬ-CHO-ĐỎ: hạ `reach` của kỷ 12 xuống 0,5 (dưới `SHORE_BAND`) trong `settingStyle.js` ⇒ đỏ ở
  // dòng `blendAt` với các điểm nằm sát mép đông của lưới.
  const bien = [];
  for (const era of ERAS) {
    const s = buildSetting({ era, gridSize: GRID });
    let hepNhat = -Infinity;
    for (const [u, v] of diemTrongLuoi(0.25)) {
      const tron = s.blendAt(u, v);
      assert.equal(tron, 0,
        `kỷ ${era}: nước liếm vào lưới tại ô (${u.toFixed(2)}, ${v.toFixed(2)}), độ trộn ${tron}. `
        + 'ADR-007 hứa thành phố cũ KHÔNG BAO GIỜ dời — một căn nhà vừa lún xuống.');
      if (s.built) hepNhat = Math.max(hepNhat, s.insetAt(u, v));
    }
    if (s.built) bien.push({ era, hepNhat });
  }
  // Biên còn lại: `insetAt` trong lưới phải ≤ −SHORE_BAND. In ra để biết ta đang cách vực bao xa —
  // luật Phase 9B: *"đo BIÊN của mọi lời hứa, đừng chỉ đọc xanh/đỏ"*.
  assert.equal(bien.length, 2, 'phải đo biên ở đúng 2 kỷ đã dựng nước');
  for (const { era, hepNhat } of bien) {
    assert.ok(hepNhat <= -SHORE_BAND + 1e-9,
      `kỷ ${era}: điểm ướt nhất trong lưới có inset ${hepNhat.toFixed(4)}, cần ≤ ${-SHORE_BAND}`);
  }
});

test('BẤT BIẾN (2) — cao độ trong lưới của kỷ có nước phải TRÙNG KHÍT với cao độ thềm bậc', () => {
  // ⚠️ Bài trên hỏi lớp `setting`; bài này hỏi thứ mã THẬT SỰ TÍNH RA. Hai câu khác nhau: `blendAt`
  // có thể đúng 0 mà `surfaceHeightAt` vẫn bị một đường khác kéo xuống.
  //
  // THỬ-CHO-ĐỎ: trong `terrain.surfaceHeightAt`, chuyển lời gọi `khoetLongNuoc` lên TRƯỚC nhánh
  // `if (outside <= 0) return plateau` ⇒ vẫn xanh (vì blend = 0 trong lưới); rồi hạ thêm `reach`
  // kỷ 12 xuống 0,5 ⇒ đỏ. Tức bài này canh đúng chỗ nối, không canh lại chuyện bài trên đã canh.
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const t = buildTerrain({ era, gridSize: GRID });
    for (const [u, v] of diemTrongLuoi(0.25)) {
      assert.equal(t.surfaceHeightAt(u, v), t.smoothHeightAt(u, v),
        `kỷ ${era} tại (${u.toFixed(2)}, ${v.toFixed(2)}): mặt đất trong lưới đã lệch khỏi thềm bậc`);
    }
  }
});

test('QUAN HỆ `reach ≥ SHORE_BAND` — cả 15 kỷ, và dải bờ phải THẬT SỰ rộng chừng ấy', () => {
  // ⚠️ Viết thành QUAN HỆ chứ không thành một con số: `SHORE_BAND` có thể được nới ở một phase sau
  // vì lý do mỹ thuật, và lúc đó chính bảng 15 dòng phải đỏ, không phải im lặng chịu trận.
  //
  // THỬ-CHO-ĐỎ: nâng `SHORE_BAND` lên 1,1 ⇒ đỏ ở 5 kỷ khai `reach: 1`.
  let soKyCoNuoc = 0;
  for (const era of ERAS) {
    const st = SETTING_STYLES[era];
    if (st.water === 'none') continue;
    soKyCoNuoc += 1;
    assert.ok(st.reach >= SHORE_BAND,
      `kỷ ${era} khai reach ${st.reach} < SHORE_BAND ${SHORE_BAND}: dải chuyển tiếp sẽ liếm vào `
      + 'lưới 12×12 và bất biến (2) vỡ.');
  }
  assert.equal(soKyCoNuoc, 14, 'bảng phải có đúng 14 kỷ có nước');

  // ĐỐI CHỨNG — dải bờ phải có RĂNG: đi vào trong đúng `SHORE_BAND × 0,5` kể từ mép nước thì độ
  // trộn phải > 0. Không có vế này thì `reach ≥ SHORE_BAND` là một lời hứa về một dải rộng 0.
  const s = buildSetting({ era: 12, gridSize: GRID });
  const hi = GRID - 0.5;
  let thayUot = 0;
  for (let v = 0; v < GRID; v += 1) {
    // Bờ đông: đi từ mép nước lùi vào đất liền nửa dải bờ.
    for (let d = 0.05; d <= SHORE_BAND * 0.95; d += 0.05) {
      const u = hi + s.style.reach - d + 3;   // xa hẳn ra ngoài rồi lùi lại
      if (s.insetAt(u, v) > -SHORE_BAND && s.blendAt(u, v) > 0) { thayUot += 1; break; }
    }
  }
  assert.ok(thayUot >= GRID,
    `dải bờ chỉ "ướt" ở ${thayUot}/${GRID} lát cắt — nó đang mỏng hơn ${SHORE_BAND} ô, nên quan hệ `
    + 'trên không còn bảo vệ được gì.');
});

// ═══════════════════════════════════════════════════════════════════════════════
// BẤT BIẾN (3) — MỰC NƯỚC NẰM DƯỚI MỌI CAO ĐỘ MẶT ĐẤT KHÔ
// ═══════════════════════════════════════════════════════════════════════════════

test('BẤT BIẾN (3) — không có vũng nước ma: mọi điểm KHÔ đều cao hơn mực nước', () => {
  // ⚠️ Vành đất ngoài lưới KHÔNG phẳng — `surfaceHeightAt` cộng một gợn biên độ ±0,21 quanh
  // −0,62, nên chỗ trũng nhất chạm −0,83. Đặt mực nước cao hơn con số ấy thì tấm nước phẳng ló lên
  // ở những hõm khô cách con sông hàng chục ô, và nó sẽ được đọc thành "lỗi vẽ" chứ không thành
  // "lỗi hằng số". Bài này ĐO khoảng hở ấy chứ không tin vào phép suy tay trong chú thích
  // (*"đừng DỰ ĐOÁN thứ có thể ĐO"*, Performance Gate 2026-08-17).
  //
  // THỬ-CHO-ĐỎ: hạ `WATER_DROP_BELOW_PLAIN` từ 0,30 xuống 0,10 ⇒ đỏ ở kỷ 12 và 14 với khoảng hở âm.
  let hoNhoNhat = Infinity;
  let taiDau = null;
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const t = buildTerrain({ era, gridSize: GRID });
    for (const [u, v] of diemToanTheGioi(0.25)) {
      if (t.setting.blendAt(u, v) > 0) continue;          // chỗ có nước thì thấp hơn là ĐÚNG
      const ho = t.surfaceHeightAt(u, v) - WATER_SURFACE_Y;
      if (ho < hoNhoNhat) { hoNhoNhat = ho; taiDau = { era, u, v }; }
    }
  }
  assert.ok(hoNhoNhat > 0,
    `chỗ đất KHÔ thấp nhất nằm DƯỚI mực nước ${(-hoNhoNhat).toFixed(4)} ô (kỷ ${taiDau?.era} tại `
    + `${taiDau?.u.toFixed(2)},${taiDau?.v.toFixed(2)}) ⇒ sẽ có một vũng nước ma giữa đồng. `
    + `Nâng \`WATER_DROP_BELOW_PLAIN\` (đang ${WATER_DROP_BELOW_PLAIN}).`);
  // Không kèm ngưỡng tối thiểu cứng: con số đúng là "> 0". Nhưng ghi lại để phiên sau biết biên.
  assert.ok(hoNhoNhat < 1,
    `khoảng hở ${hoNhoNhat.toFixed(4)} lớn bất thường — có thể phép lấy mẫu đã trượt khỏi vùng gợn, `
    + 'tức bài test đang đo một thế giới phẳng chứ không phải thế giới thật.');
});

test('MẶT NƯỚC PHẢI THẬT SỰ ĐƯỢC KHOÉT — chống cơ chế chết (bài học lùm cây Phase 8D)', () => {
  // ⚠️ Phase 8D: một cơ chế chạy đúng, có ảnh trông thuyết phục, và **chưa bao giờ làm gì cả**.
  // Nên trước khi tin "đã có sông", phải hỏi: đáy có thật sự xuống tới đáy không, và nước có phủ
  // một phần đáng kể của thế giới không.
  //
  // THỬ-CHO-ĐỎ: cho `depthAt` trả 0 ⇒ đỏ ở `sauNhat`; cho `blendAt` trả 0 ⇒ đỏ ở `phanNgap`.
  const day = WATER_SURFACE_Y - WATER_BED_DEPTH;
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const t = buildTerrain({ era, gridSize: GRID });
    let sauNhat = Infinity;
    let ngap = 0;
    let tong = 0;
    for (const [u, v] of diemToanTheGioi(0.25)) {
      tong += 1;
      if (t.setting.blendAt(u, v) > 0) ngap += 1;
      sauNhat = Math.min(sauNhat, t.surfaceHeightAt(u, v));
    }
    assert.ok(sauNhat <= day + 1e-6,
      `kỷ ${era}: chỗ sâu nhất mới ${sauNhat.toFixed(3)}, chưa chạm đáy ${day.toFixed(3)} — lòng `
      + 'sông chưa được khoét hết, mặt nước sẽ mỏng như một lớp sơn.');
    const phanNgap = ngap / tong;
    assert.ok(phanNgap > 0.02,
      `kỷ ${era}: nước chỉ phủ ${(phanNgap * 100).toFixed(2)}% thế giới — nhỏ tới mức không đọc ra `
      + 'được trên ảnh.');
    assert.ok(phanNgap < 0.75,
      `kỷ ${era}: nước phủ ${(phanNgap * 100).toFixed(1)}% thế giới — thành phố đang chìm, không `
      + 'phải đứng bên bờ.');
  }
});

test('ĐỘ SÂU đi từ MÉP xuống ĐÁY, và luôn có bậc `WATER_BED_LIP` để không nhấp nháy', () => {
  // ⚠️ Thiếu bậc này thì ở đúng mép nước cả độ trộn lẫn độ sâu đều có đạo hàm 0 ⇒ mặt đất TIẾP
  // TUYẾN với mặt nước trên một dải rộng ⇒ z-fighting chạy dọc bờ.
  //
  // THỬ-CHO-ĐỎ: đặt `WATER_BED_LIP = 0` ⇒ đỏ ở dòng `>= WATER_BED_LIP`.
  const s = buildSetting({ era: 14, gridSize: GRID });
  assert.ok(WATER_BED_LIP > 0, 'bậc mép nước phải > 0');
  let soDiem = 0;
  for (const [u, v] of diemToanTheGioi(0.5)) {
    const inset = s.insetAt(u, v);
    if (!(inset > -SHORE_BAND)) continue;
    soDiem += 1;
    const d = s.depthAt(u, v);
    assert.ok(d >= WATER_BED_LIP - 1e-12,
      `tại (${u.toFixed(2)},${v.toFixed(2)}) độ sâu ${d} nhỏ hơn bậc mép ${WATER_BED_LIP}`);
    assert.ok(d <= WATER_BED_DEPTH + 1e-12, `độ sâu ${d} vượt đáy ${WATER_BED_DEPTH}`);
    if (inset >= BED_RAMP) {
      assert.ok(Math.abs(d - WATER_BED_DEPTH) < 1e-9,
        `vào sâu ${inset.toFixed(2)} ô (quá ${BED_RAMP}) mà đáy mới ${d.toFixed(3)}`);
    }
  }
  assert.ok(soDiem > 200, `chỉ ${soDiem} điểm chạm dải nước — bài test đang chạy gần như rỗng`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHỖ GIÁP HAI TẤM ĐẤT — thứ Phase 9A đã trả giá để vá
// ═══════════════════════════════════════════════════════════════════════════════

test('CHỖ GIÁP `innerEdge`: tấm đất và tấm chân trời phải khoét GIỐNG HỆT NHAU, cả 15 kỷ', () => {
  // ⚠️ Hai tấm gặp nhau ở `innerEdge`. Lệch một phần nghìn ở đó là một khe sáng chạy vòng quanh
  // thành phố — đúng thứ Phase 9A đã phải vá. Phép tắt núi (`MOUNTAIN_FADE`) chỉ nhân vào SỐ HẠNG
  // NÚI, mà số hạng ấy bằng 0 ở chỗ giáp, nên nó KHÔNG được phép làm hai tấm lệch nhau — bài này
  // là chỗ chứng minh câu đó thay vì chỉ viết nó ra.
  //
  // THỬ-CHO-ĐỎ: bỏ lời gọi `khoetLongNuoc` trong nhánh gần của `horizon.heightAt` ⇒ đỏ ở kỷ 12 và
  // 14 với chênh lệch tới ~0,85; bỏ `luiNui` thì KHÔNG đỏ (đúng, vì nó bằng 1 ở chỗ giáp).
  let soLatCat = 0;
  for (const era of ERAS) {
    const t = buildTerrain({ era, gridSize: GRID });
    const h = buildHorizon({ era, gridSize: GRID });
    const R = h.innerEdge;
    const half = (GRID - 1) / 2;
    for (let a = -R; a <= R + 1e-9; a += 0.25) {
      for (const [x, z] of [[a, -R], [a, R], [-R, a], [R, a]]) {
        const dat = t.surfaceHeightAt(x + half, z + half);
        const troi = h.heightAt(x, z);
        assert.ok(Math.abs(dat - troi) < 1e-9,
          `kỷ ${era} tại chỗ giáp (${x.toFixed(2)},${z.toFixed(2)}): tấm đất ${dat.toFixed(6)} ≠ `
          + `tấm chân trời ${troi.toFixed(6)} — một khe hở vừa mở ra vòng quanh thành phố`);
        soLatCat += 1;
      }
    }
  }
  assert.ok(soLatCat > 4000, `chỉ đo ${soLatCat} điểm giáp — quá thưa để tin`);
});

test('NÚI PHẢI LÙI KHỎI MẶT NƯỚC, chứ không đổ thẳng xuống thành một bức tường', () => {
  // ⚠️ Không có `MOUNTAIN_FADE` thì ở kỷ biển, một dãy núi cao mấy đơn vị đổ xuống mặt biển trong
  // 0,9 ô — đọc ra là một bức tường, không phải một bờ biển.
  //
  // THỬ-CHO-ĐỎ: bỏ hệ số `luiNui` trong `horizon.heightAt` ⇒ đỏ ở kỷ 14 (biển) vì có điểm ngập
  // nước mà cao độ vẫn dương.
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const h = buildHorizon({ era, gridSize: GRID });
    const s = buildSetting({ era, gridSize: GRID });
    const half = (GRID - 1) / 2;
    let soDiemNgapXa = 0;
    for (let x = -h.reach; x <= h.reach; x += 1) {
      for (let z = -h.reach; z <= h.reach; z += 1) {
        if (s.insetAt(x + half, z + half) <= 0) continue;   // chỉ hỏi chỗ đã ở dưới nước
        soDiemNgapXa += 1;
        assert.ok(h.heightAt(x, z) <= WATER_SURFACE_Y + 1e-9,
          `kỷ ${era} tại (${x},${z}): điểm này nằm trong mặt nước nhưng tấm chân trời để nó ở cao `
          + `độ ${h.heightAt(x, z).toFixed(3)}, trên mực nước ${WATER_SURFACE_Y.toFixed(3)} — núi `
          + 'đang mọc giữa biển.');
      }
    }
    assert.ok(soDiemNgapXa > 50,
      `kỷ ${era}: chỉ ${soDiemNgapXa} điểm ngập ngoài vùng chân trời — bài test chạy gần như rỗng`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MỘT CHIỀU: settingStyle → setting → outskirts
// ═══════════════════════════════════════════════════════════════════════════════

test('KHÔNG CÓ CÂY MỌC DƯỚI NƯỚC — và luật ấy phải THẬT SỰ gỡ đi một số cảnh vật', () => {
  // ⚠️ Vế thứ hai mới là vế khó. Một bộ lọc không lọc được gì vẫn xanh trơn tru (Phase 8D). Nên
  // phải ĐẾM xem nó gỡ đi bao nhiêu — nếu bằng 0 thì luật này là mã chết và phải nói ra.
  //
  // THỬ-CHO-ĐỎ: bỏ dòng `if (setting.insetAt(u, v) > -PROP_SHORE_CLEAR) continue;` trong
  // `outskirts.deriveOutskirts` ⇒ đỏ ở vòng kiểm đầu tiên (có cây đứng trong lòng sông kỷ 12).
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const s = buildSetting({ era, gridSize: GRID });
    const props = deriveOutskirts({ era, gridSize: GRID });
    assert.ok(props.length > 20, `kỷ ${era}: vùng quê chỉ có ${props.length} cảnh vật — quá ít để tin`);
    for (const p of props) {
      const u = p.x + (GRID - 1) / 2;
      const v = p.z + (GRID - 1) / 2;
      assert.ok(s.insetAt(u, v) <= -PROP_SHORE_CLEAR,
        `kỷ ${era}: một ${p.kind} đứng ở (${u.toFixed(2)},${v.toFixed(2)}), inset `
        + `${s.insetAt(u, v).toFixed(3)} — cây mọc dưới nước.`);
    }
  }

  // ĐẾM SỐ CẢNH VẬT BỊ LUẬT NÀY GỠ ĐI. So kỷ 12 (có nước) với chính nó nhưng bỏ qua bộ lọc, bằng
  // cách dựng lại danh sách ứng viên theo đúng lưới của `deriveOutskirts` — chỉ để ĐẾM, không để
  // sinh hình (nên không phải "một luật hai công thức").
  const s12 = buildSetting({ era: 12, gridSize: GRID });
  let trongNuoc = 0;
  const buoc = 0.25;
  for (let u = -0.5 - OUTSKIRT_REACH; u <= GRID - 0.5 + OUTSKIRT_REACH; u += buoc) {
    for (let v = -0.5 - OUTSKIRT_REACH; v <= GRID - 0.5 + OUTSKIRT_REACH; v += buoc) {
      if (distanceOutsideGrid(u, v, GRID) <= 0) continue;
      if (s12.insetAt(u, v) > -PROP_SHORE_CLEAR) trongNuoc += 1;
    }
  }
  assert.ok(trongNuoc > 100,
    `chỉ ${trongNuoc} vị trí trong vùng quê kỷ 12 rơi vào mặt nước — luật "không trồng cây dưới `
    + 'nước" gần như không có việc để làm, tức nó chưa được chứng minh là còn sống.');
});

test('VÙNG QUÊ VẪN LÀ ĐỊA LÝ, KHÔNG PHẢI TIẾN ĐỘ — mặt nước không được làm vỡ điều đó', () => {
  // ⚠️ `deriveOutskirts` nay đọc `buildSetting`. Nếu ngày nào đó `buildSetting` nhận thêm `built`
  // hay `sessionCount` thì vùng quê sẽ đổi theo tiến độ và ADR-007 vỡ ở một chỗ mới.
  //
  // THỬ-CHO-ĐỎ: cho `deriveOutskirts` đọc `arg.built?.length` vào bất kỳ chỗ nào ⇒ đỏ ở `deepEqual`.
  for (const era of [1, 12, 14]) {
    const sach = deriveOutskirts({ era, gridSize: GRID });
    const rac = deriveOutskirts({
      era, gridSize: GRID, built: ['a', 'b'], levels: { a: 3 }, stats: { sessionCount: 400 },
    });
    assert.deepEqual(rac, sach, `kỷ ${era}: vùng quê đổi theo dữ liệu tiến độ`);
  }
});
