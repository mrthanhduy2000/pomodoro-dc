/**
 * sweep-score.mjs — CHẤM ĐIỂM bản quét 15 kỷ × 6 chặng bằng SỐ, thay vì nhìn bằng mắt.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO TỒN TẠI: nhìn một bảng 90 ô rồi bảo "trông ổn" là cách đã BỎ LỌT lỗi nhiều lần
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `city-preview.mjs --sweep` dựng được bảng, nhưng đọc bảng bằng mắt thì:
 *   • 2026-08-13 (Phase 3Y): **bình minh và hoàng hôn là CÙNG MỘT BỨC ẢNH** (5,9/255, dưới ngưỡng
 *     mắt ~12) mà không ai thấy, vì hai ô đó nằm ở HAI ĐẦU bảng, không kề nhau để mà so.
 *   • 2026-08-13 (TECH_DEBT #18): ba kỷ 12/13/14 gần trùng nhau, cũng không ai thấy.
 * ⇒ Lỗi mỹ thuật ở đây gần như luôn là lỗi SO SÁNH, mà mắt chỉ so được các ô KỀ NHAU. Máy thì so
 * được cả 105 cặp kỷ và cả 15 cặp chặng.
 *
 * ⚠️ BỐN CÁI BẪY ĐÃ TRẢ GIÁ, ĐỀU ĐÃ TRÁNH Ở ĐÂY (đọc trước khi sửa file này):
 * 1. **Đừng dò mép ô bằng màu.** Nền tấm bảng TRÙNG màu nền trang, phép dò "chạy tới khi khác nền"
 *    chạy quá đà 60px ngang + 30px dọc, lấy mẫu dính sang ô bên và dính dải nhãn — mà dải nhãn
 *    sáng ở theme sáng, đen ở theme tối ⇒ sai theo hai chiều NGƯỢC nhau tuỳ theme. Toạ độ ở đây
 *    lấy THẲNG từ mã dựng bảng (`city-preview.mjs`: `ctx.drawImage(stage, 60 + col*CELL_W, y)` với
 *    `y = 30 + row*(CELL_H+LABEL_H)`, cộng `#wrap { padding: 8px }`).
 * 2. **Đừng đo trung bình cả dải thành phố để so 15 kỷ.** Mái — thứ mang bản sắc kỷ — chỉ chiếm
 *    ~1/10 diện tích dải đó; phần còn lại (đất, trời lọt giữa các khối) giống hệt nhau ở mọi kỷ
 *    nên tín hiệu bị pha loãng ~10 lần và ra kết luận sai hẳn (70/105 cặp "trùng nhau", trong khi
 *    số thật là 5/105). Ở đây lọc lấy **8% điểm ảnh TƯƠI NHẤT** của dải thành phố.
 * 3. **Đừng chấm cả cảnh bằng MỘT trục.** Góc màu chỉ là một trong ba thành phần của màu, dải trời
 *    chỉ là một trong ba dải của khung hình. Đo một trục thì vừa báo nhầm vừa bỏ sót. Ở đây mỗi ô
 *    thành một **vector 9 chiều** (trời + thành phố + đất, mỗi dải 3 kênh).
 * 4. **Đừng chấm chặng ĐÊM bằng độ tương phản tuyệt đối.** Đêm tối thì tương phản thấp là ĐÚNG.
 *    Phép đo có nghĩa cho đêm là "15 kỷ có còn khác nhau không" — và nó nằm sẵn trong bảng cặp-kỷ.
 *
 * ⚠️ `--selftest` LÀ BẮT BUỘC KHI NGHI NGỜ: nó bỏ bộ lọc "8% tươi nhất" đi. Nếu con số KHÔNG nhảy
 * về mức pha loãng thì bộ lọc chưa hề chạy và mọi kết luận bên dưới là rác.
 *
 * Dùng:
 *   node scripts/city-preview.mjs --sweep --all --theme light --cell 260
 *   node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png
 *   node scripts/sweep-score.mjs <ảnh> --selftest
 */

import { readFileSync } from 'node:fs';
import { decodePng, describe } from './png-probe.mjs';

const argv = process.argv.slice(2);
const FILE = argv.find((a) => !a.startsWith('--'));
const SELFTEST = argv.includes('--selftest');
const CELL_W = Number(argv[argv.indexOf('--cell') + 1]) || 260;

if (!FILE) {
  console.error('Dùng: node scripts/sweep-score.mjs <ảnh quét .png> [--cell 260] [--selftest]');
  process.exit(1);
}

// ── Hình học lấy THẲNG từ `city-preview.mjs`, không dò bằng màu ───────────────────────────────
const PAD = 8;                                  // #wrap { padding: 8px }
const X0 = PAD + 60;                            // ctx.drawImage(..., 60 + col*CELL_W, y)
const Y0 = PAD + 30;                            // y = 30 + row*(CELL_H + LABEL_H)
const CELL_H = Math.round(CELL_W * 0.62);
const LABEL_H = 22;
const ROW_STRIDE = CELL_H + LABEL_H;

const PHASES = ['bình minh 6h', 'sáng 8h', 'trưa 12h', 'chiều 15h', 'hoàng hôn 18h', 'đêm 22h'];
const ERAS = 15;

// Ba dải theo chiều cao ô. Camera chúc xuống nên: trên là trời, giữa là thành phố, dưới là đất.
const BANDS = [
  { name: 'trời', from: 0.02, to: 0.30 },
  { name: 'thành phố', from: 0.34, to: 0.68 },
  { name: 'đất', from: 0.72, to: 0.98 },
];

const png = decodePng(readFileSync(FILE));

function pixelsIn(col, row, band) {
  const x0 = X0 + col * CELL_W;
  const y0 = Y0 + row * ROW_STRIDE + Math.round(CELL_H * band.from);
  const y1 = Y0 + row * ROW_STRIDE + Math.round(CELL_H * band.to);
  const out = [];
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x0 + CELL_W; x += 1) {
      const i = (y * png.width + x) * 4;
      out.push([png.pixels[i], png.pixels[i + 1], png.pixels[i + 2]]);
    }
  }
  return out;
}

const mean = (list) => {
  if (!list.length) return [0, 0, 0];
  const s = list.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]);
  return s.map((v) => v / list.length);
};

/** Độ tươi thô (max−min) — đủ để tách mái sơn màu ra khỏi đất/bê tông/trời. */
const chroma = (p) => Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]);

/** 8% điểm ảnh tươi nhất của dải thành phố ≈ MÁI. `--selftest` bỏ lọc để lộ mức pha loãng. */
function roofColor(col, row) {
  const px = pixelsIn(col, row, BANDS[1]);
  if (SELFTEST) return mean(px);
  const sorted = px.slice().sort((a, b) => chroma(b) - chroma(a));
  return mean(sorted.slice(0, Math.max(1, Math.round(sorted.length * 0.08))));
}

/** Vector 9 chiều của một ô: 3 dải × 3 kênh. */
function sceneVector(col, row) {
  return BANDS.flatMap((b) => mean(pixelsIn(col, row, b)));
}

const dist = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / (a.length / 3));

// ── Cổng tự-kiểm hình học: sai toạ độ thì mọi số bên dưới vô nghĩa ─────────────────────────────
const dawnSky = mean(pixelsIn(0, 0, BANDS[0]));
const nightSky = mean(pixelsIn(5, 0, BANDS[0]));
const dawnL = describe(...dawnSky.map(Math.round)).l;
const nightL = describe(...nightSky.map(Math.round)).l;
console.log(`ảnh ${png.width}×${png.height} · ô ${CELL_W}×${CELL_H} · gốc (${X0},${Y0})`);
console.log(`tự-kiểm hình học: trời bình minh L=${dawnL} · trời đêm L=${nightL}`
  + (dawnL > nightL + 0.15 ? '  ✓ hợp lý' : '  ✗ SAI — toạ độ ô có thể lệch, đừng tin số bên dưới'));
if (SELFTEST) console.log('⚠️ --selftest: ĐÃ BỎ bộ lọc "8% tươi nhất" — số cặp-kỷ phải TỆ ĐI rõ rệt.');

// ── 1. Sáu chặng ngày có phân biệt được không? (15 cặp, trung bình trên 15 kỷ) ─────────────────
const phaseVec = PHASES.map((_, col) => {
  const perEra = Array.from({ length: ERAS }, (_, row) => sceneVector(col, row));
  return perEra[0].map((_, k) => perEra.reduce((s, v) => s + v[k], 0) / ERAS);
});
const phasePairs = [];
for (let i = 0; i < PHASES.length; i += 1) {
  for (let j = i + 1; j < PHASES.length; j += 1) {
    phasePairs.push({ a: PHASES[i], b: PHASES[j], d: dist(phaseVec[i], phaseVec[j]) });
  }
}
phasePairs.sort((x, y) => x.d - y.d);
const EYE = 12;   // ngưỡng mắt phân biệt, /255 — hiệu chuẩn ở Phase 3Y
console.log(`\n── 6 CHẶNG NGÀY · ${phasePairs.length} cặp · cả cảnh (9 chiều) ──`);
for (const p of phasePairs.slice(0, 5)) {
  console.log(`  ${p.d < EYE ? '✗' : '✓'} ${p.a} ↔ ${p.b}: ${p.d.toFixed(1)}`);
}
const phaseBad = phasePairs.filter((p) => p.d < EYE);
console.log(`  cặp gần nhất ${phasePairs[0].d.toFixed(1)} · dưới ngưỡng mắt (${EYE}): `
  + `${phaseBad.length}/${phasePairs.length}`);

// ── 2. Mười lăm kỷ có phân biệt được không? (105 cặp, đo MÁI, trung bình trên 6 chặng) ─────────
const eraVec = Array.from({ length: ERAS }, (_, row) => {
  const perPhase = PHASES.map((_, col) => roofColor(col, row));
  return perPhase[0].map((_, k) => perPhase.reduce((s, v) => s + v[k], 0) / PHASES.length);
});
const eraPairs = [];
for (let i = 0; i < ERAS; i += 1) {
  for (let j = i + 1; j < ERAS; j += 1) {
    eraPairs.push({ a: i + 1, b: j + 1, d: dist(eraVec[i], eraVec[j]) });
  }
}
eraPairs.sort((x, y) => x.d - y.d);
const eraBad = eraPairs.filter((p) => p.d < EYE);
console.log(`\n── 15 KỶ · ${eraPairs.length} cặp · màu MÁI (8% điểm ảnh tươi nhất của dải thành phố) ──`);
for (const p of eraPairs.slice(0, 5)) {
  console.log(`  ${p.d < EYE ? '✗' : '✓'} kỷ ${p.a} ↔ kỷ ${p.b}: ${p.d.toFixed(1)}`);
}
const med = eraPairs[Math.floor(eraPairs.length / 2)].d;
console.log(`  cặp gần nhất ${eraPairs[0].d.toFixed(1)} · trung vị ${med.toFixed(1)} · `
  + `dưới ngưỡng mắt (${EYE}): ${eraBad.length}/${eraPairs.length}`);

// ── 3. Kết luận ───────────────────────────────────────────────────────────────────────────────
console.log('');
if (!phaseBad.length && !eraBad.length) {
  console.log('✓ TOÀN BỘ 90 Ô PHÂN BIỆT ĐƯỢC: 15/15 cặp chặng và 105/105 cặp kỷ đều trên ngưỡng mắt.');
} else {
  console.log(`✗ CÒN ${phaseBad.length} cặp chặng và ${eraBad.length} cặp kỷ dưới ngưỡng mắt —`
    + ' hai thứ đó đang là CÙNG MỘT BỨC ẢNH với người chơi.');
}
process.exit(phaseBad.length || eraBad.length ? 1 : 0);
