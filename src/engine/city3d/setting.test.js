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
import { hasWater, SETTING_STYLES, SIDE_YAW, worldYaw } from './settingStyle.js';
import {
  BED_RAMP, ERAS_WITH_WATER_GEOMETRY, PROP_SHORE_CLEAR, SHORE_BAND,
  WATER_BED_DEPTH, WATER_BED_LIP, WATER_DROP_BELOW_PLAIN,
  buildSetting, distanceOutsideGrid, distanceOutsideGridRounded, hazXuongDay, waterIsBuilt,
  MEANDER_NECK,
} from './setting.js';
import { APRON_DROP, WATER_SURFACE_Y, buildTerrain, terrainSurfaceReach } from './terrain.js';
import { MOUNTAIN_FADE, buildHorizon } from './horizon.js';
import { OUTSKIRT_REACH, deriveOutskirts } from './outskirts.js';

const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);
const GRID = 12;

/**
 * Lấy mẫu dày QUANH TẤM ĐẤT THÀNH PHỐ — tấm địa hình cộng 2 ô đệm, tức tới bán kính
 * `terrainSurfaceReach(12) + 2 = 11,4`.
 *
 * ⚠️ HÀM NÀY TỪNG MANG TÊN `diemToanTheGioi` VÀ CÁI TÊN ẤY NÓI DỐI — chú thích cũ ghi *"cả vùng
 * chân trời"* trong khi tấm chân trời phủ tới bán kính **36**, tức nó bỏ sót **hơn 90% diện tích
 * thế giới**. Cái tên sai không vô hại: nó làm bài "MẶT NƯỚC PHẢI THẬT SỰ ĐƯỢC KHOÉT" kết tội oan
 * kỷ 15 (Dubai khai `reach: 6`, tức mặt nước bắt đầu **2,6 ô BÊN NGOÀI** mép tấm đất thành phố),
 * và nó làm điều đó theo cách thuyết phục nhất: `insetAt` ra **âm ở mọi điểm**, y hệt triệu chứng
 * của một kỷ không hề có nước. Cơ chế vẫn sống — chỉ là nó sống ở tấm BÊN KIA (`horizon.js` khoét
 * lòng nước bằng CÙNG một `setting`, xem `khoetLongNuoc` ở cả hai file).
 *
 * ⇒ Bài học đã trả giá nhiều lần trong dự án này (`TECH_DEBT #22`, sương mù Phase 9B): *trước khi
 * tin một phép đo "không thấy gì", hỏi xem nó có NHÌN TỚI chỗ ấy không.* Nay tên hàm nói đúng
 * phạm vi của nó, và ai cần cả thế giới thì gọi `diemToiChanTroi`.
 */
function* diemQuanhThanhPho(buoc = 0.25) {
  const R = terrainSurfaceReach(GRID) + 2;
  const half = (GRID - 1) / 2;
  for (let u = -R + half; u <= R + half + 1e-9; u += buoc) {
    for (let v = -R + half; v <= R + half + 1e-9; v += buoc) yield [u, v];
  }
}

/**
 * Lấy mẫu THẬT SỰ tới mép thế giới — bán kính lấy từ chính `buildHorizon(era).reach`, không viết
 * cứng. Đây là phạm vi phải dùng cho mọi câu hỏi về MẶT NƯỚC, vì nước của 3 kỷ biển trải gần hết
 * tấm chân trời còn kỷ 15 thì nằm TRỌN ngoài tấm đất thành phố.
 */
function* diemToiChanTroi(era, buoc = 0.25) {
  const R = buildHorizon({ era, gridSize: GRID }).reach;
  const half = (GRID - 1) / 2;
  for (let x = -R; x <= R + 1e-9; x += buoc) {
    for (let z = -R; z <= R + 1e-9; z += buoc) yield [x + half, z + half, x, z];
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

test('BƯỚC C ĐÃ DỰNG HÌNH CHO ĐỦ 14 KỶ CÓ NƯỚC — và lời hứa nay là một QUAN HỆ, không phải một mảng', () => {
  // ⚠️ BÀI NÀY ĐỔI VIỆC SAU KHI ĐÀM DUYỆT ẢNH BƯỚC B (2026-08-20). Trước đây nó canh một trạng
  // thái DỞ DANG (*"đúng 2 kỷ, đừng trải thêm"*); nay nó canh một LỜI HỨA: *mọi kỷ mà BẢNG khai có
  // nước thì phải dựng ra nước, và chỉ những kỷ ấy*.
  //
  // ⚠️ VÌ SAO KHÔNG VIẾT CỨNG `deepEqual(..., [2,3,4,...,15])`. Một mảng 14 số viết tay chỉ khoá
  // được chính nó: thêm một dòng nước vào `settingStyle.js` mà quên dựng hình thì mảng ấy vẫn khớp
  // với chính nó và không có gì đỏ — kỷ mới sẽ lặng lẽ thành một kỷ khô, đúng loại hỏng im lặng mà
  // Phase 7D đã trả giá. Nên bài này hỏi CẢ 15 KỶ và đối chiếu với `hasWater`, tức khoá một QUAN HỆ.
  //
  // THỬ-CHO-ĐỎ (nêu TRƯỚC): bỏ một kỷ bất kỳ khỏi `ERAS_WITH_WATER_GEOMETRY` ⇒ đỏ ngay ở vòng
  // dưới với câu "BẢNG khai có nước mà HÌNH không dựng"; thêm kỷ 1 vào ⇒ đỏ ở vế ngược lại.
  let soCoNuoc = 0;
  for (const era of ERAS) {
    const bangKhai = hasWater(era);
    const hinhDung = waterIsBuilt(era);
    assert.equal(hinhDung, bangKhai,
      `kỷ ${era}: BẢNG khai ${bangKhai ? 'CÓ' : 'KHÔNG'} nước nhưng HÌNH ${hinhDung ? 'CÓ' : 'KHÔNG'} `
      + 'dựng. Hai vế này phải khớp sau Bước C — lệch một kỷ nghĩa là hoặc bảng vừa được sửa mà '
      + 'quên dựng hình, hoặc một kỷ vừa bị rút khỏi hình mà không ai ghi lý do.');
    if (bangKhai) soCoNuoc += 1;
  }
  // Gác chạy-rỗng ĐẾM CẢ HAI PHÍA. Không có nó thì một `hasWater` hỏng theo hướng "luôn trả false"
  // sẽ làm vòng trên xanh trơn tru trong khi cả 15 kỷ đều khô.
  assert.equal(soCoNuoc, 14, `phải có đúng 14 kỷ có nước, đang đếm được ${soCoNuoc}`);
  assert.equal(ERAS_WITH_WATER_GEOMETRY.length, 14, 'danh sách phải đủ 14 kỷ');

  const kho = ERAS.filter((e) => !waterIsBuilt(e));
  assert.deepEqual(kho, [1],
    'kỷ 1 phải là kỷ khô DUY NHẤT — nó là nhân chứng Đàm chọn cho ràng buộc "nước không được tính '
    + 'tiền lên kỷ không có nước", và sau Bước C nó là nhân chứng duy nhất còn lại.');
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
  // ⚠️ Sau Bước C chỉ còn ĐÚNG một kỷ khô. Con số này là một cái gác chạy-rỗng: không có nó thì
  // vòng lặp trên duyệt 0 kỷ mà bài test vẫn xanh.
  assert.equal(soKyKiem, 1, 'không duyệt đủ 1 kỷ khô (kỷ 1)');
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
    for (const [u, v] of diemQuanhThanhPho(0.5)) {
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
  assert.equal(bien.length, 14, 'phải đo biên ở đúng 14 kỷ đã dựng nước');
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
  //
  // ⚠️ PHÉP DÒ NÀY TỪNG GIÀ ĐI MỘT LẦN (2026-08-20). Bản trước viết cứng *"bờ đông"* cho kỷ 12 —
  // đúng với `side: 'dong'` của bảng, và SAI kể từ khi `worldYaw` xoay địa thế kỷ ấy 90°: nước ra
  // phía BẮC, phép dò vẫn quét phía đông, và nó báo `0/12 lát cắt` trong khi mặt nước hoàn toàn
  // lành lặn. Mã đúng, phép đo hỏng — đúng ca đã cắn ở Phase 5B (bài "kỳ quan đối xứng" lọc tháp
  // góc bằng ngưỡng tuyệt đối `|x| > 0.5`).
  // ⇒ Nay phép dò đi theo hướng bờ THẬT trên màn hình (`side + worldYaw`), suy ra từ cùng một công
  // thức mã sản phẩm dùng, nên nó không thể lệch pha với mã lần nữa.
  const s = buildSetting({ era: 12, gridSize: GRID });
  const tam = (GRID - 1) / 2;
  const mat = SIDE_YAW[s.style.side] + worldYaw(12);
  const nx = Math.sin(mat);
  const nz = Math.cos(mat);          // hướng RA phía bờ nước
  const tx = nz;
  const tz = -nx;                    // hướng DỌC bờ
  let thayUot = 0;
  for (let i = 0; i < GRID; i += 1) {
    const doc = i - tam;             // trượt dọc bờ, đúng GRID lát cắt như trước
    // Đi từ ngoài xa (mép nước + 3) lùi dần vào đất liền.
    for (let d = 0.05; d <= SHORE_BAND * 0.95; d += 0.05) {
      const r = tam + 0.5 + s.style.reach - d + 3;
      const u = tam + nx * r + tx * doc;
      const v = tam + nz * r + tz * doc;
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
    for (const [u, v] of diemQuanhThanhPho(0.25)) {
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

test('MẶT NƯỚC PHẢI THẬT SỰ ĐƯỢC KHOÉT — và ĐỘ SÂU phải ĐI THEO BỀ RỘNG, không phải một hằng số', () => {
  // ⚠️ Phase 8D: một cơ chế chạy đúng, có ảnh trông thuyết phục, và **chưa bao giờ làm gì cả**. Nên
  // trước khi tin "đã có sông", phải hỏi: mặt đất THẬT SỰ VẼ RA có bị khoét xuống tới đáy mà lớp
  // `setting` hứa không.
  //
  // ⚠️ BÀI NÀY TỪNG SAI HAI CHỖ CÙNG LÚC, VÀ CẢ HAI ĐỀU SAI THEO HƯỚNG "PHÉP ĐO KHÔNG CHẠM TỚI
  // ĐẠI LƯỢNG NÓ MUỐN NÓI":
  //
  //   (a) **Phạm vi.** Nó lấy mẫu quanh tấm đất thành phố (bán kính 11,4) rồi tự gọi đó là "toàn
  //       thế giới", trong khi thế giới rộng tới 36. Kỷ 15 (Dubai, `reach: 6`) có mặt nước bắt đầu
  //       BÊN NGOÀI tấm đất ấy ⇒ `insetAt` âm ở mọi điểm lấy mẫu, y hệt một kỷ không có nước. Cơ
  //       chế vẫn sống, nó chỉ sống ở tấm bên kia (`horizon.js` khoét bằng CÙNG một `setting`).
  //
  //   (b) **Đại lượng.** Nó đòi MỌI kỷ phải chạm đáy đầy đủ `WATER_BED_DEPTH`. Điều đó không thể
  //       đúng và cũng không NÊN đúng: `depthAt` đi từ mép xuống đáy qua một đoạn dốc dài
  //       `BED_RAMP = 1,6`, nên chỉ kỷ nào có chỗ lún sâu ≥ 1,6 ô mới chạm đáy. Kênh Amsterdam
  //       rộng 0,9 ô thì **phải** nông hơn vịnh Tokyo — nước hẹp thì nông và nhạt màu hơn, đúng
  //       vật lý (`terrainMesh.js` lấy chính `depthAt` làm sắc nước). Bài cũ xanh chỉ vì hai kỷ
  //       duy nhất nó chạy tới (12 và 14) tình cờ đều thuộc nhóm rộng.
  //
  // ⇒ Lời hứa đúng là một QUAN HỆ (rộng ⇒ sâu), không phải một MỨC. Đúng bẫy Phase 7D.
  //
  // THỬ-CHO-ĐỎ (nêu TRƯỚC chỗ mong đợi đỏ, theo luật Phase 8A):
  //   · cho `depthAt` trả một HẰNG SỐ `WATER_BED_DEPTH` ⇒ đỏ ở nhánh `nông` của kỷ 2 (đại lượng);
  //   · bỏ `khoetLongNuoc` khỏi `terrain.surfaceHeightAt` ⇒ đỏ ở `thapNhat` của kỷ 2 (mặt đất thật);
  //   · bỏ `khoetLongNuoc` khỏi `horizon.heightAt` ⇒ đỏ ở `thapNhat` của kỷ 15 (tấm bên kia);
  //   · cho `insetAt` luôn trả số âm ⇒ đỏ ở `uot > 0` của kỷ 2 (dấu chân chết).
  const PATCH = terrainSurfaceReach(GRID);
  const SAU = [];    // đủ rộng để chạm đáy đầy đủ
  const NONG = [];   // hẹp — đáy chưa xuống hết, và đó là điều ĐÚNG

  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const s = buildSetting({ era, gridSize: GRID });
    const h = buildHorizon({ era, gridSize: GRID });
    const t = buildTerrain({ era, gridSize: GRID });
    let insetMax = -Infinity;
    let sauDay = 0;
    let thapNhat = Infinity;
    let uot = 0;
    let tong = 0;
    for (const [u, v, x, z] of diemToiChanTroi(era, 0.25)) {
      tong += 1;
      const ins = s.insetAt(u, v);
      if (ins > insetMax) insetMax = ins;
      const d = s.depthAt(u, v);
      if (d > sauDay) sauDay = d;
      if (ins > 0) uot += 1;
      // ⚠️ Hỏi ĐÚNG tấm đang được vẽ ở chỗ ấy: trong bán kính `terrainSurfaceReach` là tấm địa
      // hình thành phố, ngoài ra là tấm chân trời. Hỏi `horizon.heightAt` ở điểm nằm trong tấm
      // thành phố là đo một mặt phẳng KHÔNG được vẽ ra — con số đúng về một thứ khác.
      const trongTam = Math.max(Math.abs(x), Math.abs(z)) <= PATCH;
      const cao = trongTam ? t.surfaceHeightAt(u, v) : h.heightAt(x, z);
      if (cao < thapNhat) thapNhat = cao;
    }

    // (1) DẤU CHÂN CÒN SỐNG — gác chạy-rỗng cho từng kỷ, không phải một phép đếm gộp (gộp thì một
    //     kỷ dư che cho một kỷ chết).
    assert.ok(uot > 0,
      `kỷ ${era}: không một điểm nào trong cả thế giới nằm dưới mặt nước — dấu chân nước là mã chết.`);

    // (2) MẶT ĐẤT VẼ RA KHOÉT ĐÚNG TỚI ĐÁY MÀ `setting` HỨA. Đây là chỗ nối giữa lớp mô tả và lớp
    //     hình học; đứt chỗ này thì mặt nước thành một lớp sơn dán trên nền đất phẳng.
    const hua = WATER_SURFACE_Y - sauDay;
    assert.ok(Math.abs(thapNhat - hua) < 1e-6,
      // ⚠️ IN RA HIỆU SỐ, không chỉ in hai con số. Bản đầu chỉ in hai giá trị làm tròn 4 chữ số và
      // ở một ca thử-cho-đỏ chúng in ra **giống hệt nhau** (−1.1486 ≠ −1.1486) — một thông báo lỗi
      // đúng về mặt kỹ thuật mà người đọc không thể hành động, đúng bài học vòng 4 Performance Gate.
      `kỷ ${era}: chỗ thấp nhất của mặt đất vẽ ra là ${thapNhat.toFixed(6)}, trong khi lớp `
      + `\`setting\` hứa đáy ở ${hua.toFixed(6)} — lệch ${(thapNhat - hua).toExponential(2)}. `
      + 'Hai lớp đã rời nhau.');

    // (3) QUAN HỆ RỘNG ⇒ SÂU, khoá CẢ HAI CHIỀU.
    if (insetMax >= BED_RAMP) {
      SAU.push(era);
      assert.ok(Math.abs(sauDay - WATER_BED_DEPTH) < 1e-9,
        `kỷ ${era}: chỗ lún sâu nhất ${insetMax.toFixed(2)} ô đã vượt dốc đáy ${BED_RAMP}, đáy phải `
        + `xuống hết ${WATER_BED_DEPTH} nhưng mới ${sauDay.toFixed(4)}.`);
    } else {
      NONG.push(era);
      assert.ok(sauDay < WATER_BED_DEPTH - 1e-9,
        `kỷ ${era}: chỗ lún sâu nhất mới ${insetMax.toFixed(2)} ô, chưa tới dốc đáy ${BED_RAMP}, vậy `
        + `mà đáy đã xuống hết ${sauDay.toFixed(4)} — độ sâu đang là một hằng số, không đi theo bề rộng.`);
      assert.ok(sauDay >= WATER_BED_LIP - 1e-12,
        `kỷ ${era}: đáy ${sauDay.toFixed(4)} còn nông hơn cả bậc mép ${WATER_BED_LIP}.`);
    }

    // (4) TRẦN CHỐNG CHÌM — đo ở phạm vi CẢ THẾ GIỚI nên nó là một đại lượng KHÁC với con số 0,75
    //     mà bản cũ dùng cho phạm vi quanh thành phố; giá trị thật lớn nhất đo được là **37,4%**
    //     (kỷ 14), nên trần 60% chừa 1,6 lần dư địa. Ghi giá trị thật ra đây đúng luật Phase 9A:
    //     *"khoảng cách giữa giá trị thật và ngưỡng chính là phần dự án đang không được bảo vệ"*.
    assert.ok(uot / tong < 0.60,
      `kỷ ${era}: nước phủ ${(uot / tong * 100).toFixed(1)}% thế giới — thành phố đang chìm, không `
      + 'phải đứng bên bờ.');
  }

  // (5) CẢ HAI NHÓM PHẢI CÓ MẶT, VÀ ĐƯỢC KỂ TÊN. Một bảng tường minh thì tự đỏ CẢ HAI CHIỀU: nới
  //     rộng một con sông thì nó rơi khỏi `NONG`, mà thu hẹp một cửa sông thì nó rơi vào. Nếu chỉ
  //     assert "cả hai nhóm khác rỗng" thì 13/14 kỷ có thể lặng lẽ đổi nhóm mà không ai biết.
  //
  // ⚠️ ĐỌC RA ĐƯỢC MỘT ĐIỀU: cả ba kỷ của `TECH_DEBT #59` (6 · 7 · 10) đều nằm trong `NONG`. Đó
  // không phải trùng hợp — cùng một nguyên nhân gốc (BỀ RỘNG DÒNG NƯỚC) vừa làm chúng trượt cổng
  // 5% khung hình, vừa làm đáy chúng không xuống hết.
  assert.deepEqual(SAU, [8, 11, 12, 13, 14, 15],
    'nhóm nước RỘNG (chạm đáy đầy đủ) đã đổi — cập nhật bảng này rồi hỏi vì sao.');
  assert.deepEqual(NONG, [2, 3, 4, 5, 6, 7, 9, 10],
    'nhóm nước HẸP (đáy chưa xuống hết) đã đổi — cập nhật bảng này rồi hỏi vì sao.');
});

test('ĐỘ SÂU đi từ MÉP xuống ĐÁY, và luôn có bậc `WATER_BED_LIP` để không nhấp nháy', () => {
  // ⚠️ Thiếu bậc này thì ở đúng mép nước cả độ trộn lẫn độ sâu đều có đạo hàm 0 ⇒ mặt đất TIẾP
  // TUYẾN với mặt nước trên một dải rộng ⇒ z-fighting chạy dọc bờ.
  //
  // THỬ-CHO-ĐỎ: đặt `WATER_BED_LIP = 0` ⇒ đỏ ở dòng `>= WATER_BED_LIP`.
  const s = buildSetting({ era: 14, gridSize: GRID });
  assert.ok(WATER_BED_LIP > 0, 'bậc mép nước phải > 0');
  let soDiem = 0;
  for (const [u, v] of diemQuanhThanhPho(0.5)) {
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
  // ⚠️ BÀI NÀY TỪNG HỎI SAI HAI CHỖ, và cả hai chỉ lộ ra khi Bước C trải nước ra đủ 14 kỷ:
  //
  //   (a) **Lấy mẫu trên lưới SỐ NGUYÊN, bước 1 ô.** Con nước hẹp nhất bảng — khúc uốn kỷ 5, rộng
  //       0,5 ô — lọt trọn giữa hai mắt lưới, nên bài test báo *"0 điểm ngập"* cho một kỷ có mặt
  //       nước hoàn toàn lành lặn. Một phép đo thô hơn thứ nó đo thì nó đo được số 0 (cùng họ với
  //       *"lưới 12×12 chỉ có ~9 giá trị độc lập"* ở Phase 7B).
  //
  //   (b) **Hỏi `horizon.heightAt` ở chỗ tấm chân trời KHÔNG được vẽ ra.** Trong bán kính
  //       `terrainSurfaceReach` thì thứ Đàm nhìn thấy là tấm địa hình thành phố; hỏi hàm bên kia ở
  //       đó là đo một mặt phẳng không tồn tại trên màn hình.
  //
  // ⚠️ VÀ SỰ THẬT LỘ RA KHI SỬA (b): **nước kỷ 5 nằm TRỌN trong tấm đất thành phố** — 447 điểm
  // ngập, KHÔNG một điểm nào chạm tới tấm chân trời. Nên luật "núi lùi khỏi mặt nước" ở kỷ ấy
  // không có gì để canh, và điều đó là ĐÚNG chứ không phải một lỗ hổng. Ghi nó thành một bảng
  // tường minh thay vì một `continue` im lặng — im lặng thì ngày nào có kỷ thứ hai rơi vào đây sẽ
  // không ai biết.
  //
  // ⚠️⚠️ VÀ ĐÂY LÀ ĐIỀU ĐÁNG GIÁ NHẤT BÀI NÀY DẠY RA — PHÉP THỬ NGƯỢC ĐÃ BÁC BỎ CHÍNH CHÚ THÍCH
  // CỦA NÓ. Chú thích cũ (và bản đầu của chú thích mới, do tôi chép lại mà không kiểm) khẳng định:
  // *"bỏ hệ số `luiNui` ⇒ đỏ ở kỷ 14"*. Thử thật (`luiNui * 0 + 1`): **KHÔNG MỘT BÀI NÀO ĐỎ.**
  //
  // Lý do: `khoetLongNuoc` chạy SAU và kéo mọi điểm dưới nước xuống đáy bất kể ngọn núi cao bao
  // nhiêu. Nghĩa là lời hứa *"không có núi nhô lên khỏi mặt nước"* xưa nay được giữ bởi **phép
  // khoét**, không phải bởi `luiNui` — HAI cơ chế độc lập che cùng một ca, mà chú thích chỉ kể một,
  // và kể nhầm cái. Đúng bài học Phase 4D: *"một bài test xanh không cho biết có BAO NHIÊU thứ
  // đang giữ nó xanh"* — cộng thêm một vế mới: **nó cũng không cho biết thứ đang giữ nó xanh có
  // đúng là thứ chú thích nói hay không.**
  //
  // ⇒ Việc `luiNui` THẬT SỰ làm nằm ở vùng KHÔ sát bờ (`inset ∈ (−MOUNTAIN_FADE, −SHORE_BAND]`),
  // nơi phép khoét đã tắt hẳn (`blendAt = 0`) nên nó là cơ chế DUY NHẤT. Vế thứ hai dưới đây canh
  // đúng vùng ấy, và nó đỏ khi gỡ `luiNui`.
  //
  // THỬ-CHO-ĐỎ (nêu TRƯỚC chỗ mong đợi đỏ):
  //   · bỏ khoét lòng nước khỏi `horizon.heightAt` ⇒ đỏ ở dòng cao độ của kỷ 2 (núi mọc giữa biển);
  //   · bỏ hệ số `luiNui` ⇒ đỏ ở vế ĐƠN ĐIỆU (vành gần bờ không còn thấp hơn vành xa bờ);
  //   · nới bề rộng khúc uốn kỷ 5 cho nước chạm tấm chân trời ⇒ đỏ ở `KHONG_CHAM_CHAN_TROI`;
  //   · thu hẹp nước một kỷ khác cho nó thôi chạm tấm chân trời ⇒ cũng đỏ ở đúng dòng ấy.
  const PATCH = terrainSurfaceReach(GRID);
  const KHONG_CHAM_CHAN_TROI = [];
  const THIEU_VANH_GAN = [];
  let bienGanNhat = Infinity;

  // Ba vành đồng tâm chia đều đoạn khô-sát-bờ. Ranh giới suy từ chính `MOUNTAIN_FADE`/`SHORE_BAND`,
  // KHÔNG chép tay — một luật một công thức.
  const VANH_TRONG = -MOUNTAIN_FADE;
  const VANH_NGOAI = -SHORE_BAND;
  const VANH_RONG = (VANH_NGOAI - VANH_TRONG) / 3;

  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const h = buildHorizon({ era, gridSize: GRID });
    const s = buildSetting({ era, gridSize: GRID });
    let soDiemNgapXa = 0;
    const caoVanh = [-Infinity, -Infinity, -Infinity];   // 0 = gần bờ nhất, 2 = xa bờ nhất
    const soVanh = [0, 0, 0];

    for (const [u, v, x, z] of diemToiChanTroi(era, 0.25)) {
      // Chỉ hỏi chỗ tấm chân trời ĐANG được vẽ — trong bán kính này là tấm đất thành phố.
      if (Math.max(Math.abs(x), Math.abs(z)) <= PATCH) continue;
      const ins = s.insetAt(u, v);
      const cao = h.heightAt(x, z);

      if (ins > 0) {                                     // (1) đã ở dưới nước
        soDiemNgapXa += 1;
        assert.ok(cao <= WATER_SURFACE_Y + 1e-9,
          `kỷ ${era} tại (${x.toFixed(2)},${z.toFixed(2)}): điểm này nằm trong mặt nước nhưng tấm `
          + `chân trời để nó ở cao độ ${cao.toFixed(3)}, trên mực nước `
          + `${WATER_SURFACE_Y.toFixed(3)} — núi đang mọc giữa biển.`);
        bienGanNhat = Math.min(bienGanNhat, WATER_SURFACE_Y - cao);
      } else if (ins > VANH_TRONG && ins <= VANH_NGOAI) { // (2) khô, nhưng trong tầm `luiNui`
        const k = ins > VANH_NGOAI - VANH_RONG ? 0 : (ins > VANH_TRONG + VANH_RONG ? 1 : 2);
        soVanh[k] += 1;
        caoVanh[k] = Math.max(caoVanh[k], cao);
      }
    }

    if (soDiemNgapXa === 0) {
      KHONG_CHAM_CHAN_TROI.push(era);
    } else {
      assert.ok(soDiemNgapXa > 50,
        `kỷ ${era}: chỉ ${soDiemNgapXa} điểm ngập trên tấm chân trời — quá mỏng để tin, mà cũng `
        + 'không phải 0. Hãy xem lại bề rộng dòng nước hoặc độ mịn lấy mẫu.');
    }

    // (2) NÚI PHẢI THẤP DẦN KHI TIẾN VỀ PHÍA NƯỚC. Viết thành QUAN HỆ giữa ba vành chứ không thành
    //     một trần tuyệt đối: trần tuyệt đối sẽ vừa báo nhầm ở kỷ núi cao vừa bỏ sót ở kỷ núi thấp
    //     (đúng bẫy Phase 7D), còn quan hệ này thì đúng ở cả 15 kỷ mà không cần một hằng số nào.
    if (soVanh[0] === 0) {
      THIEU_VANH_GAN.push(era);
    } else {
      assert.ok(caoVanh[0] < caoVanh[1] && caoVanh[1] < caoVanh[2],
        `kỷ ${era}: đỉnh cao nhất của ba vành khô sát bờ là ${caoVanh[0].toFixed(4)} (gần) · `
        + `${caoVanh[1].toFixed(4)} (giữa) · ${caoVanh[2].toFixed(4)} (xa) — không còn thấp dần về `
        + 'phía nước. `luiNui` có đang bị vô hiệu hoá không?');
    }
  }

  assert.deepEqual(KHONG_CHAM_CHAN_TROI, [5],
    'chỉ kỷ 5 (khúc uốn Rhein rộng 0,5 ô) có mặt nước nằm trọn trong tấm đất thành phố. Danh sách '
    + 'này đổi nghĩa là một dòng nước vừa được nới rộng hoặc thu hẹp — cập nhật rồi hỏi vì sao.');
  assert.deepEqual(THIEU_VANH_GAN, [5],
    'cũng vì lý do ấy, kỷ 5 là kỷ duy nhất không có vành khô sát bờ nằm trên tấm chân trời.');

  // ĐỐI CHỨNG — đo BIÊN, đừng chỉ đọc xanh/đỏ (luật Phase 9B). Chỗ sát nhất mà núi còn chừa cho
  // mặt nước hiện là **0,08** đơn vị. Không có vế này thì bài trên vẫn xanh trong một thế giới mà
  // mọi bờ biển đều chỉ vừa đúng không vi phạm — tức sắp gãy mà không ai biết.
  assert.ok(bienGanNhat >= 0.05,
    `chỗ núi sát mặt nước nhất chỉ còn chừa ${bienGanNhat.toFixed(4)} đơn vị — dưới biên 0,05.`);
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

// ═══════════════════════════════════════════════════════════════════════════════
// KHÚC UỐN KỶ 5 — EO ĐẤT VÀ HÌNH DẠNG CỦA HÀO  (TECH_DEBT #64)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BẮN TIA TỪ TÂM THÀNH PHỐ RA MỌI HƯỚNG, GOM CÁC HƯỚNG KHÔ LIỀN NHAU THÀNH **CUNG**.
 *
 * ⚠️ VÌ SAO PHẢI ĐẾM CUNG CHỨ KHÔNG ĐẾM TIA. Một tia lẻ lọt qua khe hở giữa hai gợn sóng bờ KHÔNG
 * phải một lối vào — không ai đi bộ trên một đường thẳng dày 0 mét. Chỉ một **cung liên tục** mới
 * là một eo đất. Đây đúng phép nghiệm thu Đàm ra cho `TECH_DEBT #64`.
 *
 * ⚠️⚠️ VÀ PHẢI HỎI ĐÚNG **`blendAt`**, KHÔNG PHẢI `insetAt` — BA ĐỊNH NGHĨA "ƯỚT", CHỈ MỘT CÁI ĐÚNG.
 * Cùng một kỷ 5, cùng một bản mã, ba phép hỏi ra ba con số khác hẳn nhau:
 *
 *   · `insetAt > 0`  (dưới mặt phẳng nước)      → 46/720 tia khô  — và **KHÔNG ĐỔI** khi gỡ bản vá;
 *   · cao độ đất < mực nước                     → 37/720 tia khô  — cũng **KHÔNG ĐỔI**;
 *   · `blendAt > 0`  (mặt đất đã bị hạ chút nào)→ 19/720 sau khi vá, **0/720 trước khi vá**.
 *
 * Chỉ cái thứ ba khớp với ẢNH: bản trước khi vá render ra một cái hào KHÉP KÍN nhìn thấy rõ.
 * Lý do nằm ở `terrainMesh.js` — `buildWaterSurface` bỏ ô nước nào có `blendAt <= 0` ở CẢ BỐN GÓC,
 * tức **tấm nước được vẽ ở đâu là do `blendAt` quyết**, không do `insetAt`, và cũng không do cao độ
 * đất (tấm nước vẫn được vẽ đè lên chỗ đất còn cao hơn mặt nước — đó chính là cái hào đã ship).
 *
 * ⇒ Bài học, cùng họ với `water-view.mjs` bắn tia xuyên qua cây (2026-08-20): **một phép đo về
 * "chỗ này Đàm NHÌN THẤY là nước" phải hỏi ĐÚNG hàm mà bộ dựng hình hỏi.** Hai phép đo kia đều
 * đúng về một đại lượng có thật, chỉ là đại lượng ấy không đi tới điểm ảnh. Và cả hai đều **im
 * lặng đứng yên** qua phép thử ngược — loại nói dối nguy hiểm nhất, vì nó trông y hệt "không có gì
 * hỏng cả". Thứ phân xử được là TẤM ẢNH, không phải lý lẽ.
 *
 * ⚠️ CUNG PHẢI QUẤN VÒNG QUA MỐC 0°/360°. Duyệt mảng theo thứ tự từ chỉ số 0 sẽ **cắt đôi** một
 * cung nằm vắt qua mốc ấy và biến một lối vào rộng thành hai lối vào hẹp — cùng hình dạng sai với
 * bài *"hai chặng liền nhau"* ở `daylight.test.js` (duyệt danh sách theo thứ tự nên `dawn` và
 * `dusk` không bao giờ được đem so với nhau). Vì thế vòng lặp bắt đầu từ một hướng ƯỚT.
 */
function cungKhoRaNgoai(uotFn, { tia = 720, banKinh = 14, buoc = 0.1 } = {}) {
  const half = (GRID - 1) / 2;
  const kho = [];
  for (let k = 0; k < tia; k += 1) {
    const g = (k / tia) * Math.PI * 2;
    let uot = false;
    for (let r = 0.5; r <= banKinh && !uot; r += buoc) {
      if (uotFn(half + Math.cos(g) * r, half + Math.sin(g) * r) > 0) uot = true;
    }
    kho.push(!uot);
  }
  if (kho.every(Boolean)) return [tia];
  const goc = kho.findIndex((x) => !x);
  if (goc < 0) return [];
  const cung = []; let run = 0;
  for (let i = 0; i < tia; i += 1) {
    const k = (goc + i) % tia;
    if (kho[k]) run += 1;
    else if (run) { cung.push(run); run = 0; }
  }
  if (run) cung.push(run);
  return cung.sort((a, b) => b - a);
}

/**
 * BỀ RỘNG CHỖ HẸP NHẤT CỦA EO ĐẤT, TÍNH BẰNG **Ô** — không tính bằng độ.
 *
 * Góc phụ thuộc chỗ đứng nhìn; bề rộng ô thì không, và `MEANDER_NECK` cũng tính bằng ô ⇒ đo bằng ô
 * là đo cùng đơn vị với hằng số đang sở hữu quyết định ấy, nên so được trực tiếp.
 *
 * ⚠️ MỘT DÂY CUNG **CHÍNH LÀ** BỀ RỘNG HÀNH LANG, không phải một phép xấp xỉ: với hành lang thẳng
 * nửa rộng `w` nhìn từ tâm ở bán kính `R`, nửa góc là `asin(w/R)` nên dây cung
 * `2·R·sin(asin(w/R)) = 2w` — độc lập với `R`. Số đo xác nhận: 1,40 ô ở mọi bán kính từ 6,5 tới 8,75.
 *
 * ⚠️ VÀ PHẢI LẤY DẢI KHÔ **CHỨA HƯỚNG HÀNH LANG**, KHÔNG LẤY "cung khô rộng nhất" ở mỗi bán kính.
 * Bản đầu lấy cung rộng nhất và đo ra 2,61 ô — nó đang đo **khe chéo của hào** (vành hào xa tâm hơn
 * ở góc chéo nên ở bán kính 8 thì bốn góc chéo còn khô), không đo eo đất.
 */
function beRongEoDat(insetFn, huongRad, { tu = 5, den = 13, buocR = 0.25, N = 7200 } = {}) {
  const half = (GRID - 1) / 2;
  const k0 = Math.round((huongRad / (2 * Math.PI)) * N);
  let hep = Infinity;
  for (let R = tu; R <= den + 1e-9; R += buocR) {
    const uot = (k) => insetFn(half + Math.cos((k / N) * 2 * Math.PI) * R,
      half + Math.sin((k / N) * 2 * Math.PI) * R) > 0;
    if (uot(k0)) return 0;                       // trục hành lang đã ướt ⇒ eo đất ĐỨT
    let a = 0; while (a < N && !uot(((k0 - a) % N + N) % N)) a += 1;
    let b = 0; while (b < N && !uot((k0 + b) % N)) b += 1;
    if (a + b >= N) continue;                    // khô cả vòng ⇒ chưa tới hào, không phải chỗ thắt
    const goc = ((a + b - 1) / N) * 2 * Math.PI;
    hep = Math.min(hep, 2 * R * Math.sin(Math.min(goc, Math.PI) / 2));
  }
  return hep;
}

/**
 * HÀO VUÔNG HAY HÀO TRÒN — hỏi bằng HÌNH DẠNG CỦA CHÍNH ĐƯỜNG BỜ.
 *
 * Với mỗi hướng, tìm **đường bờ ngoài** (bán kính lớn nhất còn ngập) rồi hỏi điểm ấy cách HÌNH CHỮ
 * NHẬT LƯỚI bao xa theo Ơclit. Bo góc ⇒ khoảng cách ấy gần như không đổi quanh vòng (tỉ số chéo/trục
 * ≈ 1). Vuông ⇒ ở góc chéo đường bờ là một góc 90° nên nó xa hơn, tiến tới √2.
 *
 * ⚠️ HAI BẢN ĐO TRƯỚC ĐỀU SAI, VÀ CẢ HAI ĐỀU SAI THEO KIỂU IM LẶNG — ghi lại vì đây là lần thứ ba
 * trong dự án một công cụ đo tự chế nói dối theo hướng *"không có gì thay đổi cả"*:
 *
 *   (a) **Hỏi nhị phân `blendAt > 0` ở một vòng cách lưới cố định.** Phép phá (đổi về L∞) làm
 *       `insetAt` ở góc chéo tụt từ −0,02 xuống −0,45 — một thay đổi rất lớn — nhưng `blendAt` chỉ
 *       về 0 khi `insetAt ≤ −SHORE_BAND (−0,9)`, nên **cả hai bản đều trả lời "ướt"** và phép đo ra
 *       số giống hệt nhau tới từng chữ số. *Một câu hỏi nhị phân đặt lên một đại lượng liên tục thì
 *       mù với mọi thay đổi chưa vượt ngưỡng.*
 *
 *   (b) **Hỏi giá trị `insetAt` ở vòng cách lưới cố định.** Cũng sai, vì `insetAt` của `meander` là
 *       một hàm **hình lều** theo `da` (`min(da − gần, xa − da)`) nên nó KHÔNG đơn điệu: dịch `da`
 *       một chút có thể làm giá trị TĂNG hoặc GIẢM tuỳ đang ở sườn nào. Hỏi qua một hàm không đơn
 *       điệu thì câu trả lời không đọc ra được hình dạng (tách được 0,07 — lẫn trong nhiễu bờ 0,55).
 *
 * ⇒ Bài học: *trước khi tin một phép đo "không đổi", hỏi xem đại lượng vừa vặn có nằm trong thứ
 * công cụ này đo không* (Phase 9B) — và thêm một vế: **hỏi cả xem đường truyền từ cần gạt tới con
 * số có ĐƠN ĐIỆU không.** Không đơn điệu thì tín hiệu tự triệt tiêu.
 *
 * CỬA SỔ ±2°: đo được biên tách 26,9%. Cửa sổ rộng hơn pha loãng rất nhanh (±10° chỉ còn 7,1%) vì
 * chỉ SÁT 45° đường bờ vuông mới thật sự xa ra — lệch vài độ là tia đã cắt vào cạnh chứ không vào
 * góc. Cùng họ `TECH_DEBT #22`: lấy trung bình trên vùng quá rộng thì pha loãng tín hiệu.
 */
function tiSoBoNgoaiCheoTruc(insetFn, { cuaSo = 2, buocDo = 0.1, buocR = 0.02 } = {}) {
  const half = (GRID - 1) / 2;
  const ocl = (u, v) => Math.hypot(
    Math.max(0, -0.5 - u, u - (GRID - 0.5)), Math.max(0, -0.5 - v, v - (GRID - 0.5)),
  );
  const truc = []; const cheo = [];
  for (let deg = 0; deg < 360; deg += buocDo) {
    const g = deg * Math.PI / 180;
    let bo = null;
    for (let r = 20; r >= 4; r -= buocR) {
      const u = half + Math.cos(g) * r; const v = half + Math.sin(g) * r;
      if (insetFn(u, v) > 0) { bo = ocl(u, v); break; }
    }
    if (bo === null) continue;
    const m = ((deg % 90) + 90) % 90;
    if (m <= cuaSo || m >= 90 - cuaSo) truc.push(bo);
    else if (Math.abs(m - 45) <= cuaSo) cheo.push(bo);
  }
  const tb = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  return { tiSo: tb(cheo) / tb(truc), soTruc: truc.length, soCheo: cheo.length };
}

test('KHÔNG KỶ NÀO ĐƯỢC LÀ HÒN ĐẢO — 720 tia, mỗi kỷ phải có ít nhất MỘT CUNG liên tục ra đất khô', () => {
  // ⚠️ ĐÂY LÀ BÀI CANH `TECH_DEBT #64`. Bước C dựng nước cho 14 kỷ mà **chưa ai hỏi câu này**, và
  // kỷ 5 (`meander`) đã ship ra một cái hào KHÉP KÍN: 0/720 tia ra được đất khô. Burg Eltz nổi
  // tiếng vì chỉ có MỘT lối vào — không phải vì KHÔNG có lối nào.
  //
  // Bệnh gốc là một QUAN HỆ VÔ CHỦ giữa hai hằng số mỗi cái đúng khi đứng riêng: `MEANDER_NECK`
  // quyết bề rộng lối vào, `SHORE_BAND` quyết độ mềm của mép nước, và không dòng nào sở hữu câu
  // *"lối vào phải khô hẳn ngay khi rời khỏi lưới"*. Cùng đúng hình dạng sai của `TECH_DEBT #57`.
  //
  // THỬ-CHO-ĐỎ (nêu TRƯỚC chỗ mong đợi đỏ, đã chạy thật):
  //   · gỡ `+ SHORE_BAND` trong `trongKhe` ⇒ đỏ ở kỷ 5 với `cung.length === 0` (đúng bộ số cũ:
  //     0/720 tia, và đúng cái hào khép kín nhìn thấy trên ảnh `K5-TRUOC.png`);
  //   · đối chứng dưới đây đỏ nếu phép gom cung mất răng.
  for (const era of ERAS) {
    const cung = cungKhoRaNgoai(buildSetting({ era, gridSize: GRID }).blendAt);
    assert.ok(cung.length >= 1,
      `kỷ ${era} là một HÒN ĐẢO: bắn 720 tia từ tâm thành phố ra bán kính 14, không một cung liên `
      + 'tục nào ra tới được đất khô. Mặt nước đang khép kín vòng quanh thành phố.');
    assert.ok(cung[0] >= 8,
      `kỷ ${era}: cung khô rộng nhất chỉ ${cung[0]} tia (${(cung[0] * 0.5).toFixed(1)}°) — quá mảnh `
      + 'để là một lối đi, nhiều khả năng chỉ là một khe lọt giữa hai gợn sóng bờ.');
  }

  // ĐỐI CHỨNG — NHỐT ĐÚNG TRẠNG THÁI HÒN ĐẢO CŨ. Một vành nước khép kín, KHÔNG có khe: phép đo
  // phải còn bắt được nó. Không có vế này thì ngày nào phép gom cung hỏng, bài trên vẫn xanh.
  const daoKhepKin = (u, v) => { const da = distanceOutsideGrid(u, v, GRID); return Math.min(da - 1, 1.5 - da); };
  assert.equal(cungKhoRaNgoai(daoKhepKin).length, 0,
    'đối chứng hỏng: một vành nước khép kín hoàn toàn mà phép đo vẫn tìm ra lối ra — phép gom cung '
    + 'đã mất răng, và bài test ở trên không còn canh gì.');
});

test('EO ĐẤT KỶ 5 RỘNG ĐÚNG BẰNG QUAN HỆ `2 × (MEANDER_NECK − SHORE_BAND)`, không phải một con số rời', () => {
  // ⚠️ ĐÂY LÀ CHỖ VIẾT RA CÁI QUAN HỆ TỪNG VÔ CHỦ. Hành lang danh nghĩa rộng `2 × MEANDER_NECK`
  // (3,2 ô), nhưng dải hoà bờ `SHORE_BAND` ăn vào mỗi bên đúng 0,9 ô ⇒ phần KHÔ HẲN còn lại là
  // `2 × (1,6 − 0,9) = 1,4 ô`. Số đo: 1,396–1,405 ô ở mọi bán kính từ 6,5 tới 8,75 (chênh 0,005 là
  // độ mịn lấy mẫu góc). Đó là một đẳng thức, không phải một sự trùng hợp.
  //
  // ⇒ HỆ QUẢ PHẢI GIỮ MÃI: `MEANDER_NECK` **phải lớn hơn** `SHORE_BAND`, nếu không eo đất rộng 0.
  // Đó chính là điều kiện mà `TECH_DEBT #64` đã vi phạm trong im lặng.
  //
  // THỬ-CHO-ĐỎ (nêu TRƯỚC): hạ `MEANDER_NECK` xuống 0,8 ⇒ đỏ ngay ở vế QUAN HỆ đầu tiên (0,8 < 0,9);
  // gỡ `+ SHORE_BAND` ⇒ đỏ ở `beRongEoDat` (trả về 0 vì trục hành lang đã ướt).
  assert.ok(MEANDER_NECK > SHORE_BAND,
    `MEANDER_NECK (${MEANDER_NECK}) phải LỚN HƠN SHORE_BAND (${SHORE_BAND}), nếu không dải hoà bờ `
    + 'ăn hết bề rộng lối vào từ cả hai phía và khúc uốn thành một hòn đảo.');

  const st = buildSetting({ era: 5, gridSize: GRID });
  // Hướng hành lang tự tìm từ chính dữ liệu — KHÔNG dựng lại phép xoay `worldYaw` bằng công thức
  // thứ hai. Tâm của cung khô rộng nhất chính là trục hành lang.
  const TIA = 720; const half = (GRID - 1) / 2;
  const kho = [];
  for (let k = 0; k < TIA; k += 1) {
    const g = (k / TIA) * Math.PI * 2;
    let uot = false;
    for (let r = 0.5; r <= 14 && !uot; r += 0.1) {
      if (st.insetAt(half + Math.cos(g) * r, half + Math.sin(g) * r) > 0) uot = true;
    }
    kho.push(!uot);
  }
  const idx = kho.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
  assert.ok(idx.length > 0, 'kỷ 5 không có một tia khô nào — bài trên đáng lẽ đã đỏ trước bài này');
  const huong = (idx.reduce((a, b) => a + b, 0) / idx.length / TIA) * 2 * Math.PI;

  // ⚠️ EO ĐẤT CÓ **HAI** BỀ RỘNG, VÀ ĐO NHẦM CÁI NÀO CŨNG RA MỘT CON SỐ TRÔNG HỢP LÝ.
  //   · hỏi `insetAt > 0`  = *"chỗ này có nằm dưới mặt nước không"*  ⇒ hành lang DANH NGHĨA;
  //   · hỏi `blendAt > 0`  = *"mặt đất ở đây có bị hạ xuống chút nào không"* ⇒ phần KHÔ HẲN.
  // Bản đầu của bài này chỉ hỏi vế thứ nhất, ra 3,203 ô, và câu ấy ĐÚNG — chỉ là nó không phải câu
  // đang hỏi. Cái vỡ ở `TECH_DEBT #64` là vế thứ HAI: dải hoà bờ bắc cầu ngang qua cửa hành lang.
  // Khoá cả hai, vì mỗi vế canh một hằng số khác nhau.
  const rongDanhNghia = beRongEoDat(st.insetAt, huong);
  const huaDanhNghia = 2 * MEANDER_NECK;
  assert.ok(Math.abs(rongDanhNghia - huaDanhNghia) < 0.05,
    `hành lang danh nghĩa kỷ 5 rộng ${rongDanhNghia.toFixed(3)} ô, trong khi 2 × MEANDER_NECK hứa `
    + `${huaDanhNghia.toFixed(3)} ô — mặt nước đang lấn vào chính cái khe sinh ra để chừa lối vào.`);

  const rongKhoHan = beRongEoDat(st.blendAt, huong);
  const huaKhoHan = 2 * (MEANDER_NECK - SHORE_BAND);
  assert.ok(Math.abs(rongKhoHan - huaKhoHan) < 0.05,
    `phần KHÔ HẲN của eo đất kỷ 5 rộng ${rongKhoHan.toFixed(3)} ô, trong khi quan hệ `
    + `2 × (MEANDER_NECK − SHORE_BAND) hứa ${huaKhoHan.toFixed(3)} ô. Lệch quá 0,05 nghĩa là một `
    + 'trong hai hằng số đã đổi mà quan hệ giữa chúng chưa được viết lại — hoặc dải hoà bờ đang ăn '
    + 'vào lối đi theo một cách khác.');
});

test('HÀO PHẢI BO GÓC — dòng suối uốn quanh mỏm đá, không phải hào vuông đào theo lưới', () => {
  // Đàm chỉ đúng bản chất khi nhìn ảnh nghiệm thu Bước C: *"hào 90° sắc lẹm là dấu hiệu hình dạng
  // sinh từ LƯỚI VUÔNG, không phải từ DÒNG CHẢY. Suối thật uốn."* Một dòng nước không biết lưới
  // thành phố là hình gì; thứ duy nhất nó biết là *"tôi cách cái mỏm đá kia bao xa"* — tức khoảng
  // cách Ơclit, không phải L∞.
  //
  // SỐ ĐO (cửa sổ ±2°, đã chạy cả hai chiều):
  //   · kỷ 5 hiện tại (Ơclit)      : 1,0215   ⟵ dưới cổng 1,10, dư 7,7%
  //   · kỷ 5 nếu gỡ bo góc (L∞)    : 1,3543   ⟵ vượt cổng 23%
  //   · đối chứng hào VUÔNG dựng tay: 1,2960
  //   · đối chứng hào TRÒN dựng tay : 0,9956
  // Cổng 1,10 nằm giữa hai đầu ĐO ĐƯỢC, không phải một con số chọn cho tiện (bài học Phase 9A:
  // *"một ngưỡng nới rộng cho chắc là một cái phễu"* — nên phải kèm đối chứng nhốt bộ số hỏng).
  //
  // THỬ-CHO-ĐỎ (nêu TRƯỚC): đổi `distanceOutsideGridRounded` về `distanceOutsideGrid` trong nhánh
  // `meander` ⇒ đỏ ở vế kỷ 5 với tỉ số 1,3543.
  const CONG = 1.10;
  const d5 = tiSoBoNgoaiCheoTruc(buildSetting({ era: 5, gridSize: GRID }).insetAt);
  assert.ok(d5.soTruc > 40 && d5.soCheo > 40,
    `phép đo chạy rỗng: chỉ ${d5.soTruc} hướng trục / ${d5.soCheo} hướng chéo tìm thấy đường bờ`);
  assert.ok(d5.tiSo < CONG,
    `hào kỷ 5 đang VUÔNG: đường bờ ngoài ở góc chéo cách lưới gấp ${d5.tiSo.toFixed(4)} lần ở sát `
    + `trục (cổng ${CONG}; hào tròn ≈ 1,00 · hào vuông tiến tới √2 = 1,414).`);

  // ĐỐI CHỨNG (a) — hào VUÔNG dựng tay PHẢI bị bắt. Không có vế này thì cổng 1,10 có thể đã bị nới
  // tới mức không còn bắt được gì mà vế trên vẫn xanh.
  const hV = tiSoBoNgoaiCheoTruc((u, v) => {
    const da = distanceOutsideGrid(u, v, GRID); return Math.min(da - 1, 1.5 - da);
  });
  assert.ok(hV.tiSo >= CONG,
    `đối chứng hỏng: một cái hào L∞ vuông vức dựng tay chỉ ra tỉ số ${hV.tiSo.toFixed(4)}, vẫn lọt `
    + `cổng ${CONG} — phép đo đã mất răng.`);

  // ĐỐI CHỨNG (b) — hào TRÒN dựng tay PHẢI lọt. Không có vế này thì một phép đo luôn-luôn-báo-động
  // cũng sẽ trông như đang canh gác.
  const hT = tiSoBoNgoaiCheoTruc((u, v) => {
    const da = distanceOutsideGridRounded(u, v, GRID); return Math.min(da - 1, 1.5 - da);
  });
  assert.ok(hT.tiSo < CONG,
    `đối chứng hỏng: một cái hào Ơclit tròn đều dựng tay lại ra tỉ số ${hT.tiSo.toFixed(4)} và bị `
    + 'cổng chặn — phép đo đang kêu oan, không phải đang canh gác.');
});

test('HAI HÀM KHOẢNG CÁCH PHẢI LÀ HAI HÌNH KHÁC NHAU — và trong lưới thì cả hai đều bằng 0', () => {
  // Bài rẻ và tất định, canh chính định nghĩa: `distanceOutsideGrid` là L∞ (đường đồng mức là hình
  // chữ nhật), `distanceOutsideGridRounded` là Ơclit (đường đồng mức bo góc). Ở góc chéo, tỉ số
  // giữa chúng phải là ĐÚNG √2 — một hằng số toán học, không phải một phép đo.
  //
  // THỬ-CHO-ĐỎ: cho `distanceOutsideGridRounded` gọi lại `Math.max` ⇒ đỏ ở vòng lặp đường chéo.
  for (const t of [0.25, 0.5, 1, 2, 4]) {
    for (const [u, v] of [[-0.5 - t, -0.5 - t], [GRID - 0.5 + t, -0.5 - t],
      [GRID - 0.5 + t, GRID - 0.5 + t], [-0.5 - t, GRID - 0.5 + t]]) {
      assert.ok(Math.abs(distanceOutsideGrid(u, v, GRID) - t) < 1e-9,
        `L∞ tại góc chéo cách ${t}: phải là ${t}`);
      assert.ok(Math.abs(distanceOutsideGridRounded(u, v, GRID) - t * Math.SQRT2) < 1e-9,
        `Ơclit tại góc chéo cách ${t}: phải là ${(t * Math.SQRT2).toFixed(4)}, đang là `
        + `${distanceOutsideGridRounded(u, v, GRID).toFixed(4)} — hàm này đã thoái hoá về L∞.`);
    }
    // Trên trục thì hai hàm PHẢI trùng nhau — nếu không, bo góc đang đổi cả hình dạng chỗ không cần.
    for (const [u, v] of [[-0.5 - t, 5.5], [5.5, -0.5 - t]]) {
      assert.ok(Math.abs(distanceOutsideGrid(u, v, GRID) - distanceOutsideGridRounded(u, v, GRID)) < 1e-9,
        `trên trục, hai hàm phải cho cùng một số (tại ${u},${v})`);
    }
  }
  for (const [u, v] of [[0, 0], [5.5, 5.5], [11, 11], [-0.5, -0.5], [11.5, 11.5]]) {
    assert.equal(distanceOutsideGridRounded(u, v, GRID), 0, `trong lưới tại (${u},${v}) phải bằng 0`);
  }
});
