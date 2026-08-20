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
  buildSetting, distanceOutsideGrid, hazXuongDay, waterIsBuilt,
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
