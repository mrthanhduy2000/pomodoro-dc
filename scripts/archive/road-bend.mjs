#!/usr/bin/env node
/**
 * road-bend.mjs — CON ĐƯỜNG CÓ THẬT SỰ UỐN CONG KHÔNG, VÀ CONG CỠ NÀO?
 *
 * Chạy:
 *   node --import ./scripts/register-esm-loader.mjs scripts/road-bend.mjs
 *   node --import ./scripts/register-esm-loader.mjs scripts/road-bend.mjs --selftest
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ĐO **THỨ ĐÃ DỰNG**, KHÔNG ĐO **THỨ ĐÃ KHAI**
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Cách dễ nhất để viết công cụ này là hỏi `buildRoadPaths` xem tim đường lệch bao nhiêu rồi in ra.
 * Nhưng `terrainMesh.js` cũng dựng mặt đường theo đúng hàm ấy ⇒ hai vế cùng đọc một nguồn, và cái
 * bảng in ra sẽ là **một cái GƯƠNG, không phải một cái CÂN** (đúng bài học `drawCallBudget`
 * 2026-08-23: một bài test so một công thức với một bảng suy từ chính công thức ấy).
 *
 * ⇒ Công cụ này dựng mặt đường THẬT (`buildRoadSurface`) rồi đo trên **toạ độ đỉnh tam giác**. Nếu
 * ngày nào bên dựng quên gọi `buildRoadPaths`, con số ở đây tụt về 1,000 và bảng tự nói.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ĐẠI LƯỢNG: **ĐỘ UỐN KHÚC** (sinuosity) — MỘT TỈ SỐ, KHÔNG PHẢI MỘT MỨC
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `độ uốn khúc = chiều dài THẬT của tim đường ÷ khoảng cách THẲNG giữa hai đầu`.
 *
 *   · 1,000 = thẳng tuyệt đối (thước kẻ)
 *   · 1,05  = cong nhẹ, mắt vừa đọc ra
 *   · 1,3+  = ngoằn ngoèo rõ rệt
 *
 * ⚠️ CHỌN MỘT TỈ SỐ LÀ CÓ CHỦ ĐÍCH, đúng bài học Phase 7D đã ghi trong `CLAUDE.md`: *"một con số
 * tuyệt đối không diễn đạt được một luật nói về QUAN HỆ"*. "Tim đường lệch 0,19 ô" không nói lên
 * điều gì nếu không biết con đường dài bao nhiêu và ô rộng bao nhiêu; còn "dài hơn đường chim bay
 * 8%" thì đọc được ngay, và nó là đại lượng mà ngành địa mạo học dùng để phân loại dòng sông.
 *
 * ⚠️ VÀ NÓ LÀ ĐẠI LƯỢNG CỦA CẢ CON ĐƯỜNG, KHÔNG PHẢI CỦA MỘT Ô. Đo "độ lệch lớn nhất" thì một ô
 * lệch mạnh giữa một con đường thẳng băng cũng cho ra con số đẹp — mà thứ mắt đọc là con đường có
 * lượn suốt chiều dài của nó hay không.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ NHƯNG ĐỘ UỐN KHÚC MỘT MÌNH **KHÔNG TRẢ LỜI ĐƯỢC CÂU CỦA ĐÀM** — ĐÃ ĐO VÀ THẤY
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Bảng đo lần đầu ra **1/15 kỷ vượt 1,01**, kỷ cong nhất chỉ 1,0125 — đọc thì tưởng bản vá hỏng.
 * Không phải: độ uốn khúc tăng theo **BÌNH PHƯƠNG của độ dốc**, nên nó gần như mù với một con
 * đường lượn biên độ nhỏ mà dài. Một con đường lệch ngang 0,19 ô trên chiều dài 11 ô thì mắt đọc
 * ra rất rõ *"đường này lượn"*, mà chiều dài của nó chỉ hơn đường chim bay hơn 1%.
 *
 * Đây đúng bài học fBm ở Phase 9A (`CLAUDE.md`): *"hỏi đại lượng này có chứa thứ mình KHÔNG muốn
 * đo không"* — và ở đây là chiều ngược lại: đại lượng ấy **loãng mất** thứ mình muốn đo.
 *
 * ⇒ Cột CHÍNH của bảng là **`lệch ÷ bề rộng`**: độ lệch ngang lớn nhất của tim đường, chia cho
 * chính bề rộng lòng đường. Đó là thứ mắt so — ta nhìn thấy mép đường trên nền cỏ, nên một cái
 * ngoằn bằng nửa bề rộng con đường thì đọc ra ngay, còn một cái ngoằn bằng 1% bề rộng thì không.
 * Vẫn là một TỈ SỐ (Phase 7D), chỉ khác mẫu số. Độ uốn khúc giữ lại làm cột phụ.
 *
 *   · 0,00 = thẳng như thước
 *   · 0,25 = mắt bắt đầu đọc ra đường không thẳng
 *   · 0,60+ = lượn rõ rệt, tim đường lệch quá nửa bề rộng
 */

import { buildTerrain } from '../src/engine/city3d/terrain.js';
import { buildScenePalette } from '../src/engine/city3d/palette3d.js';
import { buildRoadSurface } from '../src/components/city/render3d/terrainMesh.js';
import { computeCityLayout } from '../src/engine/cityLayout.js';
import { BLUEPRINT_CATALOG } from '../src/engine/constants.js';
import { ROAD_PART } from '../src/components/city/render3d/terrainMesh.js';
import { getNetworkStyle } from '../src/engine/city3d/networkStyle.js';

const GRID = 12;
const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
/** Toạ độ thế giới → toạ độ ô. Nghịch đảo của `toWorld`. */
const vềÔ = (w) => w + (GRID - 1) / 2;

/** Chiều dài một đường gấp khúc. */
function chiềuDài(điểm) {
  let d = 0;
  for (let i = 1; i < điểm.length; i += 1) {
    d += Math.hypot(điểm[i][0] - điểm[i - 1][0], điểm[i][1] - điểm[i - 1][1]);
  }
  return d;
}

/**
 * Độ uốn khúc của một đường gấp khúc. Dưới 2 điểm, hoặc hai đầu trùng nhau (đường khép kín) thì
 * KHÔNG có định nghĩa — trả `null` chứ không trả 1, vì trả 1 là nói dối "đường này thẳng".
 */
export function độUốnKhúc(điểm) {
  if (!Array.isArray(điểm) || điểm.length < 2) return null;
  const thẳng = Math.hypot(
    điểm[điểm.length - 1][0] - điểm[0][0],
    điểm[điểm.length - 1][1] - điểm[0][1],
  );
  if (thẳng < 1e-9) return null;
  return chiềuDài(điểm) / thẳng;
}

/**
 * Tim đường ĐO ĐƯỢC tại MỘT RANH GIỚI Ô — lấy điểm giữa của khoảng mà lòng đường phủ ở đó.
 *
 * ⚠️ ĐO Ở RANH GIỚI, KHÔNG ĐO TRỌNG TÂM CẢ Ô — và đây là một phép đo đã bị BÁC BỎ rồi mới thay.
 * Bản đầu lấy trọng tâm mọi tam giác lòng đường trong một ô. Nghe hợp lý, và sai: ở một ngã ba,
 * cái cánh tay cụt chìa sang một bên KÉO trọng tâm về phía nó, nên con số đo được phản ánh *hình
 * dạng ngã ba* chứ không phản ánh *tim đường*. Kỷ 4 khai thẳng tuyệt đối mà đo ra khác 1,000 —
 * chính vế đối chứng ấy đã tố cáo phép đo, đúng như nó sinh ra để làm.
 *
 * Tại một ranh giới thì chỉ có ĐÚNG một cánh tay đi qua, nên khoảng lòng đường ở đó là một đoạn
 * liền, và điểm giữa của nó chính là tim đường — không có gì để mà kéo lệch.
 */
function timTạiRanhGiới(pos, kinds, cốĐịnh, biến, giáTrị, lo, hi) {
  let min = Infinity; let max = -Infinity;
  for (let t = 0; t < kinds.length; t += 1) {
    if (kinds[t] !== ROAD_PART.CARRIAGEWAY) continue;
    const i = t * 9;
    for (let k = 0; k < 3; k += 1) {
      const u = vềÔ(pos[i + k * 3]);
      const v = vềÔ(pos[i + k * 3 + 2]);
      const c = cốĐịnh === 'u' ? u : v;
      const d = biến === 'u' ? u : v;
      if (Math.abs(c - giáTrị) > 1e-6) continue;
      if (d < lo - 1e-9 || d > hi + 1e-9) continue;
      if (d < min) min = d;
      if (d > max) max = d;
    }
  }
  if (min === Infinity) return null;
  return (min + max) / 2;
}

/** Bề rộng lòng đường tại một ranh giới — cùng phép quét với `timTạiRanhGiới`, lấy `max − min`. */
function bềRộngTạiRanhGiới(pos, kinds, cốĐịnh, biến, giáTrị, lo, hi) {
  let min = Infinity; let max = -Infinity;
  for (let t = 0; t < kinds.length; t += 1) {
    if (kinds[t] !== ROAD_PART.CARRIAGEWAY) continue;
    const i = t * 9;
    for (let k = 0; k < 3; k += 1) {
      const u = vềÔ(pos[i + k * 3]);
      const v = vềÔ(pos[i + k * 3 + 2]);
      const c = cốĐịnh === 'u' ? u : v;
      const d = biến === 'u' ? u : v;
      if (Math.abs(c - giáTrị) > 1e-6) continue;
      if (d < lo - 1e-9 || d > hi + 1e-9) continue;
      if (d < min) min = d;
      if (d > max) max = d;
    }
  }
  if (min === Infinity) return null;
  return max - min;
}

/** Dựng một kỷ rồi đo. */
function đoKỷ(era) {
  const terrain = buildTerrain({ era, gridSize: GRID });
  const built = (BLUEPRINT_CATALOG[era] ?? []).map((bp) => bp.id);
  const layout = computeCityLayout({ era, built, stats: { sessionCount: 400, streakLength: 30 } });
  const palette = buildScenePalette({ era });
  const road = buildRoadSurface({
    terrain, gridSize: GRID, layout, palette,
  });
  if (!road) return null;
  const pos = road.geometry.getAttribute('position').array;
  const kinds = road.kinds;
  const ôĐường = new Set((layout.props ?? []).filter((p) => p.kind === 'road').map((p) => `${p.x}|${p.y}`));

  // Mỗi HÀNG và mỗi CỘT có đường là một con đường. Đo độ uốn khúc của từng con: trung bình nói
  // "cả thành phố cong cỡ nào", lớn nhất nói "con cong nhất".
  const uốn = [];
  const tỉSố = [];
  for (let j = 0; j < GRID; j += 1) {
    for (const trục of ['ngang', 'dọc']) {
      const điểm = [];
      const lệchNgang = [];
      const bềRộng = [];
      for (let i = 0; i < GRID - 1; i += 1) {
        const a = trục === 'ngang' ? `${i}|${j}` : `${j}|${i}`;
        const b = trục === 'ngang' ? `${i + 1}|${j}` : `${j}|${i + 1}`;
        if (!ôĐường.has(a) || !ôĐường.has(b)) continue;
        // Ranh giới giữa hai ô ấy, và khoảng lòng đường phủ trên nó.
        const lệch = trục === 'ngang'
          ? timTạiRanhGiới(pos, kinds, 'u', 'v', i + 0.5, j - 0.5, j + 0.5)
          : timTạiRanhGiới(pos, kinds, 'v', 'u', i + 0.5, j - 0.5, j + 0.5);
        if (lệch === null) continue;
        điểm.push(trục === 'ngang' ? [i + 0.5, lệch] : [lệch, i + 0.5]);
        // Độ lệch ngang so với TRỤC của con đường (hàng `j` hoặc cột `j`), tính bằng ô.
        lệchNgang.push(Math.abs(lệch - j));
        // Bề rộng lòng đường ngay tại ranh giới ấy — mẫu số của cột chính.
        const bề = bềRộngTạiRanhGiới(pos, kinds, trục === 'ngang' ? 'u' : 'v',
          trục === 'ngang' ? 'v' : 'u', i + 0.5, j - 0.5, j + 0.5);
        if (bề !== null && bề > 1e-9) bềRộng.push(bề);
      }
      // Một con đường phải đủ dài mới nói lên điều gì; 4 điểm là mức thấp nhất còn đọc ra hình dạng.
      if (điểm.length < 4) continue;
      const s = độUốnKhúc(điểm);
      if (s !== null) uốn.push(s);
      // ⚠️ TỈ SỐ TÍNH TRÊN **TỪNG CON ĐƯỜNG**, RỒI MỚI GỘP — không lấy độ lệch lớn nhất cả mạng
      // chia cho bề rộng trung bình cả mạng. Bản đầu làm thế và nó sai đúng kiểu `TECH_DEBT #22`:
      // tử số đến từ mấy con NGÕ (hẹp, lượn nhiều) còn mẫu số bị mấy con ĐẠI LỘ (rộng, thẳng) kéo
      // lên, nên kỷ 13 đo ra 0,219 trong khi ngõ của nó thật sự lượn hơn thế nhiều. Một tỉ số chỉ
      // có nghĩa khi tử và mẫu nói về CÙNG một vật.
      if (bềRộng.length > 0 && lệchNgang.length > 0) {
        const bề = bềRộng.reduce((a, b) => a + b, 0) / bềRộng.length;
        if (bề > 1e-9) tỉSố.push(Math.max(...lệchNgang) / bề);
      }
    }
  }
  if (uốn.length === 0 || tỉSố.length === 0) return null;
  return {
    số: uốn.length,
    uốnTB: uốn.reduce((a, b) => a + b, 0) / uốn.length,
    tỉSốTB: tỉSố.reduce((a, b) => a + b, 0) / tỉSố.length,
    tỉSốMax: Math.max(...tỉSố),
  };
}

/**
 * ⚠️ PHÉP TỰ KIỂM PHẢI CHỨNG MINH PHÉP ĐO **PHÂN BIỆT ĐƯỢC** THẲNG VỚI CONG, không chỉ chứng minh
 * nó chạy. Bài học `--selftest` ở Phase 4C/4G: *"một phép tự kiểm chứng minh bộ lọc CÓ tác dụng,
 * KHÔNG chứng minh nó có tác dụng ĐÚNG"*.
 */
function selftest() {
  let hỏng = 0;
  const kiểm = (tên, điều) => {
    if (!điều) { hỏng += 1; console.log(`  ✗ ${tên}`); } else console.log(`  ✓ ${tên}`);
  };
  // 1. Đường thẳng phải ra ĐÚNG 1.
  const thẳng = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]];
  kiểm('đường thẳng ⇒ độ uốn khúc = 1,000', Math.abs(độUốnKhúc(thẳng) - 1) < 1e-12);
  // 2. Đường zigzag phải ra RÕ HƠN 1 — và phải đúng con số hình học biết trước.
  const zig = [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]];
  const mong = (4 * Math.SQRT2) / 4;
  kiểm(`zigzag 45° ⇒ đúng √2 (${mong.toFixed(4)})`, Math.abs(độUốnKhúc(zig) - mong) < 1e-12);
  // 3. Càng lệch nhiều thì con số càng lớn — phép đo phải ĐƠN ĐIỆU, nếu không nó không xếp hạng được.
  const nhẹ = [[0, 0], [1, 0.1], [2, 0], [3, 0.1], [4, 0]];
  kiểm('lệch nhiều hơn ⇒ số lớn hơn', độUốnKhúc(zig) > độUốnKhúc(nhẹ) && độUốnKhúc(nhẹ) > 1);
  // 4. Ca không có định nghĩa phải trả `null`, KHÔNG trả 1 — trả 1 là nói dối "đường này thẳng".
  kiểm('hai đầu trùng nhau ⇒ null', độUốnKhúc([[0, 0], [1, 1], [0, 0]]) === null);
  kiểm('dưới 2 điểm ⇒ null', độUốnKhúc([[0, 0]]) === null && độUốnKhúc(null) === null);
  // 5. ĐỐI CHỨNG TRÊN DỮ LIỆU THẬT: kỷ khai `bend: 0` PHẢI đo ra 1,000. Đây là vế chứng minh phép
  //    đo thật sự chạm tới hình học đã dựng — nếu nó đọc nhầm chỗ, con số của kỷ 4/11 sẽ khác 1.
  const kỷThẳng = đoKỷ(4);
  kiểm('kỷ 4 (Chang\'an, khai thẳng tuyệt đối) đo ra 1,000',
    kỷThẳng && Math.abs(kỷThẳng.uốnTB - 1) < 1e-6);
  const kỷCong = đoKỷ(1);
  kiểm('kỷ 1 (Çatalhöyük, lượn nhất bảng) đo ra RÕ hơn 1',
    kỷCong && kỷCong.uốnTB > 1.01);
  console.log(hỏng === 0 ? '\n✅ phép đo phân biệt được thẳng với cong' : `\n❌ ${hỏng} mục hỏng`);
  return hỏng === 0 ? 0 : 1;
}

function main() {
  if (process.argv.includes('--selftest')) return selftest();
  console.log('ĐỘ UỐN KHÚC CỦA MẠNG ĐƯỜNG — đo trên tam giác ĐÃ DỰNG, không đọc lại bảng');
  console.log('1,000 = thẳng như thước · 1,05 = mắt vừa đọc ra · 1,3+ = ngoằn ngoèo rõ\n');
  console.log('kỷ | nước           | kiểu     | bend | LỆCH÷BỀ RỘNG | con lượn nhất | uốn khúc');
  console.log('---|----------------|----------|------|--------------|---------------|---------');
  const tất = [];
  for (const era of ERAS) {
    const s = getNetworkStyle(era);
    const đo = đoKỷ(era);
    if (!đo) { console.log(`${String(era).padStart(2)} | (không dựng được)`); continue; }
    tất.push(đo.tỉSốTB);
    console.log(
      `${String(era).padStart(2)} | ${s.country.padEnd(14)} | ${s.plan.padEnd(8)} | `
      + `${s.bend.toFixed(2)} | ${đo.tỉSốTB.toFixed(3).padStart(12)} | `
      + `${đo.tỉSốMax.toFixed(3).padStart(13)} | ${đo.uốnTB.toFixed(4)}`,
    );
  }
  const cong = tất.filter((v) => v >= 0.25).length;
  console.log(`\n${cong}/${tất.length} kỷ có đường lượn ĐỌC RA ĐƯỢC (lệch ≥ 0,25 lần bề rộng).`);
  console.log('Kỷ 4 và 11 khai thẳng tuyệt đối nên 1,0000 ở đó là ĐÚNG, không phải hỏng.');
  return 0;
}

process.exitCode = main();
