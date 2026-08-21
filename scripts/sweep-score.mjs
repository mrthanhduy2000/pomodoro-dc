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
 * 2. **Đừng đo trung bình CẢ dải thành phố để so 15 kỷ.** Một mảng mái chỉ chiếm ~1/10 diện tích
 *    dải đó, nên trung bình cả dải pha loãng tín hiệu ~10 lần và ra kết luận sai hẳn (70/105 cặp
 *    "trùng nhau"). Bản cũ chữa bằng bộ lọc "8% điểm ảnh tươi nhất ≈ mái" — và chính bộ lọc ấy
 *    chết ở bẫy số 5 bên dưới. Nay chữa bằng cách CHIA Ô CON (`sweepMetric.mjs`): thu vùng lấy
 *    trung bình xuống 1/18 thì mảng mái chiếm trọn vài ô con và hiện nguyên độ lớn, mà phép đo
 *    không cần biết "mái" là gì.
 * 3. **Đừng chấm cả cảnh bằng MỘT trục.** Góc màu chỉ là một trong ba thành phần của màu, dải trời
 *    chỉ là một trong ba dải của khung hình. Đo một trục thì vừa báo nhầm vừa bỏ sót. Ở đây mỗi ô
 *    thành một **vector 9 chiều** (trời + thành phố + đất, mỗi dải 3 kênh).
 * 4. **Đừng chấm chặng ĐÊM bằng độ tương phản tuyệt đối.** Đêm tối thì tương phản thấp là ĐÚNG.
 *    Phép đo có nghĩa cho đêm là "15 kỷ có còn khác nhau không" — và nó nằm sẵn trong bảng cặp-kỷ.
 *
 * ⚠️ `--selftest` LÀ BẮT BUỘC KHI NGHI NGỜ: nó thu lưới ô con về 1×1, tức quay lại đúng phép trung
 * bình cả dải đã gây ra kết luận sai 70/105. Nếu con số KHÔNG tệ đi rõ rệt thì việc chia ô con
 * chưa hề chạy và mọi kết luận bên dưới là rác.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️⚠️ CÁI BẪY THỨ NĂM (2026-08-14, Phase 6B) — VÀ NÓ GIẾT CHÍNH BỘ LỌC Ở BẪY SỐ 2 BÊN TRÊN
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Bộ lọc "8% điểm ảnh TƯƠI NHẤT ≈ mái" đứng trên MỘT giả định không hề được viết ra: **mái là thứ
 * tươi nhất trong khung hình.** Giả định ấy đúng suốt thời kỳ mái được suy ra từ `accentColor` —
 * một màu NHẤN GIAO DIỆN, chọn cho chữ nổi trên nền, nên bao giờ cũng rực hơn mọi thứ khác.
 *
 * Phase 6B đổi mái sang **vật liệu lợp thật** (`roofColor` trong `eraStyle.js`): đá phiến xám lam,
 * bê tông xám gần trung tính, đồng oxy hoá. Giả định lập tức hết đúng, và bộ lọc quay ra chấm
 * **cỏ nắng lọt giữa các khối nhà** — thứ tươi nhất còn lại. Đo thật lúc phát hiện (bản quét 8 kỷ,
 * chặng trưa): cả tám kỷ ra cùng một sắc ô-liu, kể cả đá phiến lam kỷ 5 (`#586a89` → đo `#4b5745`)
 * và đồng xanh lục kỷ 11 (`#3e9883` → đo `#5d6b4c`). Từ bộ số rác đó nó in ra một kết luận rất
 * thuyết phục: *"✗ kỷ 3 ↔ kỷ 10: 6,7 — dưới ngưỡng mắt"* — trong khi kỷ 3 là gạch bùn nâu vàng
 * SÁNG và kỷ 10 là đá phiến gần ĐEN, hai thứ không ai nhầm được.
 *
 * ⇒ **Bài học chung, quan trọng hơn cái bẫy cụ thể**: `--selftest` chỉ chứng minh bộ lọc CÓ tác
 * dụng, không chứng minh nó chọn ĐÚNG THỨ (đã ghi ở `CLAUDE.md`, Phase 4C).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ✅ ĐÃ VÁ GỐC (2026-08-16) — BỎ HẲN PROXY "MÁI", KHÔNG PHẢI VÁ BỘ LỌC
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Bản vá đầu tiên nghĩ tới là "chọn điểm ảnh mái cho khéo hơn" — ví dụ đối chiếu với `roofColor`
 * mà `eraStyle.js` khai. Nhưng cách đó VỪA vòng tròn (chọn điểm ảnh theo màu đã khai rồi đo xem
 * màu có khớp màu đã khai không) VỪA bất khả thi: đo ở tầng dữ liệu thì **4/15 kỷ khai mái TRÙNG
 * vật liệu tường** (kỷ 3, 12, 13, 14), nên mái không tách được ra ngay từ NGUỒN — xem
 * `sweepMetric.mjs` để biết chi tiết.
 *
 * ⇒ Phép đo nay KHÔNG chọn điểm ảnh theo màu nữa. Nó chia dải thành phố thành lưới ô con và so
 * từng ô con. Không còn giả định mỹ thuật nào để mà chết lần thứ ba. Cổng "TỪ CHỐI CHẤM" dựa trên
 * góc màu mái đã được gỡ cùng lúc — nó tồn tại để canh một bộ lọc nay không còn nữa.
 *
 * Dùng:
 *   node scripts/city-preview.mjs --sweep --all --theme light --cell 260
 *   node scripts/sweep-score.mjs .city-preview/sweep-light-ky1-15.png
 *   node scripts/sweep-score.mjs <ảnh> --selftest
 */

import { readFileSync } from 'node:fs';
import { decodePng, describe } from './png-probe.mjs';
import {
  BANDS, cityRect, EYE, GRID_X, GRID_Y, gridVector, vecDist,
} from './sweepMetric.mjs';

const argv = process.argv.slice(2);
const FILE = argv.find((a) => !a.startsWith('--'));
const SELFTEST = argv.includes('--selftest');
const VERBOSE = argv.includes('--eras');

if (!FILE) {
  console.error('Dùng: node scripts/sweep-score.mjs <ảnh quét .png> [--eras] [--selftest]');
  process.exit(1);
}

// ── Hình học ĐỌC TỪ HỒ SƠ ĐI KÈM ẢNH, không tự đoán và không dò bằng màu ──────────────────────
// ⚠️ ĐÂY LÀ BẢN VÁ CHO CÁI BẪY THỨ NĂM, và nó là cái bẫy tệ nhất trong năm cái: file này TỪNG chép
// lại công thức hình học của `city-preview.mjs` kèm mặc định `--cell 260`, trong khi mặc định bên
// đó là **300**. Hai bản sao của một luật ⇒ bản sai im lặng. Hàng 0 vẫn trúng ô (sai số dồn theo
// từng hàng), nên phép tự-kiểm cũ — vốn chỉ so hai Ô CÙNG NẰM Ở HÀNG 0 — vẫn báo ✓ trong khi 14
// hàng dưới lấy mẫu lệch sang hàng khác và cả dải nhãn. Số bịa ra: "5/105 cặp kỷ + 1/15 cặp chặng
// dưới ngưỡng, trung vị 106,4". ⇒ Hai luật rút ra, cả hai đều đã có tiền lệ trong dự án:
//   • Một luật chỉ được có MỘT công thức. Nay `city-preview.mjs` ghi thẳng bộ số nó đã dùng.
//   • Phép tự-kiểm phải chạm tới TỪNG chiều mà nó muốn bảo chứng. So hai ô cùng hàng thì không thể
//     phát hiện sai bước NHẢY HÀNG — đúng họ với "duyệt danh sách theo thứ tự" ở `daylight.test.js`.
const GEOM_PATH = FILE.replace(/\.png$/, '.geom.json');
let geom;
try {
  geom = JSON.parse(readFileSync(GEOM_PATH, 'utf8'));
} catch {
  console.error(`✗ Không đọc được hồ sơ hình học: ${GEOM_PATH}`);
  console.error('  Ảnh quét PHẢI đi kèm file .geom.json do `city-preview.mjs --sweep` ghi ra.');
  console.error('  Ảnh cũ (dựng trước 2026-08-13) không có file này — hãy quét lại:');
  console.error('    node scripts/city-preview.mjs --sweep --all');
  console.error('  ⚠️ ĐỪNG chữa bằng cách đoán lại `--cell`: chính việc đoán đã bịa ra số sai một lần.');
  process.exit(2);
}

const CELL_W = geom.cellW;
const CELL_H = geom.cellH;
const LABEL_H = geom.labelH;
const X0 = geom.pad + geom.xLabel;
const Y0 = geom.pad + geom.yHeader;
const ROW_STRIDE = CELL_H + LABEL_H;

const PHASE_NAME = { 6: 'bình minh 6h', 8: 'sáng 8h', 12: 'trưa 12h', 15: 'chiều 15h', 18: 'hoàng hôn 18h', 22: 'đêm 22h' };
const PHASES = geom.hours.map((h) => PHASE_NAME[h] ?? `${h}h`);
const ERA_LIST = geom.eras;
const ERAS = ERA_LIST.length;

const png = decodePng(readFileSync(FILE));

function pixelsIn(col, row, band, dy = 0) {
  const x0 = X0 + col * CELL_W;
  const y0 = Y0 + row * ROW_STRIDE + Math.round(CELL_H * band.from) + dy;
  const y1 = Y0 + row * ROW_STRIDE + Math.round(CELL_H * band.to) + dy;
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

/** Độ tươi thô (max−min). Nay CHỈ dùng để mô tả khi in ra, KHÔNG còn dùng để chọn điểm ảnh nào. */
const chroma = (p) => Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]);

/** Vector 9 chiều của một ô: 3 dải × 3 kênh. */
function sceneVector(col, row) {
  return BANDS.flatMap((b) => mean(pixelsIn(col, row, b)));
}

const dist = vecDist;

// ── Cổng tự-kiểm hình học ─────────────────────────────────────────────────────────────────────
// ⚠️ PHẢI CHẠM TỚI HÀNG CUỐI. Bản cũ so hai ô CÙNG NẰM Ở HÀNG 0, nên nó bảo chứng được bước nhảy
// CỘT mà không bảo chứng gì cho bước nhảy HÀNG — đúng chiều đã sai thật. Nay so đêm-vs-bình-minh ở
// **mọi hàng**: bước nhảy hàng lệch thì các hàng cuối rơi vào dải nhãn hoặc ô hàng kế, và tương
// phản ngày/đêm ở đó sụp ngay.
console.log(`ảnh ${png.width}×${png.height} · ô ${CELL_W}×${CELL_H} · gốc (${X0},${Y0}) · `
  + `${ERAS} kỷ × ${PHASES.length} chặng · hồ sơ ${GEOM_PATH.split('/').pop()}`);

const needW = X0 + PHASES.length * CELL_W;
const needH = Y0 + ERAS * ROW_STRIDE;
if (png.width < needW || png.height < needH) {
  console.error(`✗ Ảnh nhỏ hơn hồ sơ mô tả (cần ≥ ${needW}×${needH}) — ảnh và hồ sơ không cùng một lượt quét.`);
  process.exit(2);
}

//
// ⚠️ 2026-08-21 — NGƯỠNG NÀY TỪNG LÀ MỘT **MỨC** DIỄN ĐẠT MỘT **QUAN HỆ**, đúng bẫy Phase 7D, và
// nó nằm ngay trong công cụ dùng để chấm mọi phase mỹ thuật. Bản cũ đòi `dL > nL + 0,15` — một
// hiệu số TUYỆT ĐỐI. Đo ra thì hiệu số thật ở mốc nền `dfd2b15` chỉ nằm trong dải **0,16…0,22**,
// tức biên của cổng là **0,010 ở kỷ 1 và kỷ 4** — ĐÚNG MỘT ĐƠN VỊ LÀM TRÒN của `describe().l`
// (hai chữ số thập phân). Một cổng có biên bằng một đơn vị làm tròn thì nó không còn canh cái nó
// định canh; nó canh sự may rủi. Và nó đã nổ thật: bản vá thứ tự tầng màu (cùng ngày) làm vùng đất
// xa tối đi ~0,01–0,02 vì vết loang nay còn sống tới rìa, và ba kỷ 2 · 4 · 6 rơi xuống đúng 0,000
// — trong khi **không một toạ độ ô nào xê dịch** (hình học đọc thẳng từ `.geom.json`).
//
// Điều cổng này THẬT SỰ muốn hỏi là *"ô bình minh có sáng HƠN HẲN ô đêm không?"* — một quan hệ.
// Viết thành tỉ lệ thì nó miễn nhiễm với việc cả cảnh sáng lên hay tối đi, mà vẫn sụp ngay khi ô
// bị lấy nhầm. Tỉ lệ thật ở mốc nền: **1,93…2,45 lần**; ngưỡng 1,6 nằm giữa hai đầu ĐO ĐƯỢC, không
// phải một con số chọn tay.
//
// ⚠️ KHÔNG được nới ngưỡng cho tiện (phễu Phase 9A), nên đi kèm là một **ĐỐI CHỨNG BẮT BUỘC**: lấy
// mẫu lệch xuống nửa hàng — đúng cái hỏng mà cổng này sinh ra để bắt — và ĐÒI nó phải kêu. Không
// có vế ấy thì không ai biết cổng còn răng hay không.
const dawnCol = geom.hours.indexOf(6);
const nightCol = geom.hours.indexOf(22);
const TỈ_LỆ_TỐI_THIỂU = 1.6;
if (dawnCol >= 0 && nightCol >= 0) {
  const sángTối = (row, dy) => {
    const dL = describe(...mean(pixelsIn(dawnCol, row, BANDS[0], dy)).map(Math.round)).l;
    const nL = describe(...mean(pixelsIn(nightCol, row, BANDS[0], dy)).map(Math.round)).l;
    return { dL, nL, đạt: dL > nL * TỈ_LỆ_TỐI_THIỂU };
  };
  const bad = [];
  for (let row = 0; row < ERAS; row += 1) {
    const { dL, nL, đạt } = sángTối(row, 0);
    if (!đạt) {
      bad.push(`kỷ ${ERA_LIST[row]} (bình minh L=${dL} · đêm L=${nL} · tỉ lệ ${(dL / (nL || 1e-6)).toFixed(2)})`);
    }
  }
  console.log(`tự-kiểm hình học: bình minh sáng hơn đêm ≥ ${TỈ_LỆ_TỐI_THIỂU}× ở ${ERAS - bad.length}/${ERAS} hàng`
    + (bad.length ? `  ✗ SAI Ở ${bad.join(', ')} — toạ độ ô lệch, ĐỪNG tin số bên dưới` : '  ✓ hợp lý'));
  if (bad.length) process.exit(2);

  const lệch = Math.round(ROW_STRIDE / 2);
  const sốKêu = Array.from({ length: ERAS }, (_, row) => sángTối(row, lệch)).filter((r) => !r.đạt).length;
  if (sốKêu === 0) {
    console.error(`✗ ĐỐI CHỨNG HỎNG: lấy mẫu lệch ${lệch}px (nửa hàng) mà cổng vẫn im ở cả ${ERAS} hàng`
      + ' — cổng tự-kiểm không còn răng, ĐỪNG tin số bên dưới.');
    process.exit(2);
  }
  console.log(`  đối chứng: lấy mẫu lệch ${lệch}px thì cổng kêu ở ${sốKêu}/${ERAS} hàng ✓`);
}
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
console.log(`\n── 6 CHẶNG NGÀY · ${phasePairs.length} cặp · cả cảnh (9 chiều) ──`);
for (const p of phasePairs.slice(0, 5)) {
  console.log(`  ${p.d < EYE ? '✗' : '✓'} ${p.a} ↔ ${p.b}: ${p.d.toFixed(1)}`);
}
const phaseBad = phasePairs.filter((p) => p.d < EYE);
// ⚠️ HAI CHỮ SỐ, KHÔNG PHẢI MỘT — VÀ ĐÂY LÀ MỘT LỖI THẬT ĐÃ CẮN (2026-08-20, nghiệm thu Bước C).
// Con số "cặp gần nhất" của trục CHẶNG là con số DUY NHẤT trong cả bảng được đem so với những
// ngưỡng Đàm ra bằng miệng (`≥ 20,7` · `< 17` · `< 14`). Ở một chữ số, giá trị thật **13,9616**
// in ra thành **"14.0"** — tức nó đọc y hệt một con số CHƯA chạm ngưỡng "< 14", trong khi nó đã
// chạm. Một phép làm tròn HIỂN THỊ vừa che mất một cái cổng đã kích hoạt, và không có gì đỏ lên.
// ⇒ LUẬT: con số nào được đem so với một ngưỡng thì in đủ chữ số để phép so ấy đọc được từ màn
// hình. Các dòng LIỆT KÊ bên trên vẫn một chữ số — chúng để liếc, không để phán xử.
console.log(`  cặp gần nhất ${phasePairs[0].d.toFixed(2)} · dưới ngưỡng mắt (${EYE}): `
  + `${phaseBad.length}/${phasePairs.length}`);

// ── 2. Mười lăm kỷ có phân biệt được không? (105 cặp, lưới ô con của dải thành phố) ────────────
// ⚠️ KHÔNG gộp 6 chặng thành một vector rồi mới so. Gộp trước thì hai kỷ khác nhau ở bình minh
// nhưng ngược chiều nhau ở hoàng hôn sẽ TRIỆT TIÊU nhau và ra "giống hệt". So TỪNG chặng rồi lấy
// trung bình các khoảng cách — trả lời đúng câu hỏi "vào một giờ bất kỳ, hai kỷ này cách nhau bao
// nhiêu", và không có phép cộng nào có thể giấu một khác biệt đi.
const eraPhaseVec = Array.from({ length: ERAS }, (_, row) => PHASES.map((_, col) => {
  const rect = cityRect({
    x0: X0 + col * CELL_W, y0: Y0 + row * ROW_STRIDE, cellW: CELL_W, cellH: CELL_H,
  });
  // `--selftest` thu lưới về 1×1 = đúng phép trung bình cả dải đã gây ra kết luận sai 70/105 ở
  // Phase 4C. Số phải TỆ ĐI rõ rệt; không tệ đi nghĩa là việc chia ô con chưa hề chạy.
  return gridVector(png, rect, SELFTEST ? { gx: 1, gy: 1 } : {});
}));
const eraVec = eraPhaseVec.map((perPhase) => perPhase[0]
  .map((_, k) => perPhase.reduce((s, v) => s + v[k], 0) / PHASES.length));
// ⚠️ IN KÈM ĐỘ SÁNG CỦA MÀU ĐO ĐƯỢC — đây là bài học đắt nhất của chính bộ lọc này (2026-08-13):
// bản trước lọc bằng độ tươi TƯƠNG ĐỐI `(max−min)/max`, mà mẫu số là `max` nên **pixel càng TỐI
// càng dễ đạt điểm cao** ⇒ nó lấy mặt mái KHUẤT TRONG BÓNG và in ra 15 màu gần đen ở giữa TRƯA.
// `--selftest` không bắt được, vì nó chỉ chứng minh bộ lọc CÓ tác dụng chứ không chứng minh nó
// chọn ĐÚNG THỨ. Cách duy nhất nhận ra: in ra thứ nó chọn rồi nhìn. 15 con số quanh 20–60 giữa
// trưa là báo động; mái đang nắng phải ở khoảng 80–130.
if (VERBOSE) {
  // ⚠️ IN RA THỨ PHÉP ĐO THẬT SỰ NHÌN THẤY — bài học đắt nhất của chính file này (2026-08-13 và
  // 2026-08-14): cả hai lần bộ lọc hỏng đều chỉ lộ ra khi có người IN màu đo được rồi nhìn. Nay
  // in màu trung bình của dải thành phố + ĐỘ TRẢI giữa 18 ô con. Độ trải gần 0 nghĩa là dải này
  // phẳng lì — hoặc thành phố thật sự đơn sắc, hoặc lưới ô con đang lấy mẫu nhầm chỗ.
  console.log('\n── DẢI THÀNH PHỐ ĐO ĐƯỢC TỪNG KỶ (trung bình 6 chặng) ──');
  eraVec.forEach((v, i) => {
    const cells = Array.from({ length: v.length / 3 }, (_, k) => v.slice(k * 3, k * 3 + 3));
    const avg = [0, 1, 2].map((k) => cells.reduce((s, c) => s + c[k], 0) / cells.length);
    const spread = Math.sqrt(cells.reduce((s, c) => s + vecDist(c, avg) ** 2, 0) / cells.length);
    const [r, g, b] = avg.map(Math.round);
    console.log(`  kỷ ${String(ERA_LIST[i]).padStart(2)}  rgb(${String(r).padStart(3)},`
      + `${String(g).padStart(3)},${String(b).padStart(3)})  ${describe(r, g, b).hex}  `
      + `sáng ${String(Math.round((r + g + b) / 3)).padStart(3)}`
      + `  tươi ${chroma(avg).toFixed(0).padStart(3)}`
      + `  trải giữa 18 ô con ${spread.toFixed(1).padStart(5)}`);
  });
}

const eraPairs = [];
for (let i = 0; i < ERAS; i += 1) {
  for (let j = i + 1; j < ERAS; j += 1) {
    const per = PHASES.map((_, col) => dist(eraPhaseVec[i][col], eraPhaseVec[j][col]));
    eraPairs.push({
      a: ERA_LIST[i],
      b: ERA_LIST[j],
      d: per.reduce((s, v) => s + v, 0) / per.length,
      worst: Math.min(...per),
    });
  }
}
eraPairs.sort((x, y) => x.d - y.d);
const eraBad = eraPairs.filter((p) => p.d < EYE);
// ⚠️ IN ĐÚNG LƯỚI ĐANG CHẠY. `--selftest` thu về 1×1, mà nhãn vẫn ghi 6×3 thì công cụ đang nói
// dối về chính việc nó vừa làm — đúng loại lỗi NHÃN (không phải lỗi SỐ) đã cắn ở `frame-fit.mjs`.
const gridLabel = SELFTEST ? '1×1 (--selftest: ĐÃ THU LƯỚI, số phải TỆ ĐI)' : `${GRID_X}×${GRID_Y}`;
console.log(`\n── 15 KỶ · ${eraPairs.length} cặp · lưới ${gridLabel} ô con của dải thành phố ──`);
for (const p of eraPairs.slice(0, 5)) {
  console.log(`  ${p.d < EYE ? '✗' : '✓'} kỷ ${p.a} ↔ kỷ ${p.b}: ${p.d.toFixed(1)}`
    + `  (chặng sát nhau nhất ${p.worst.toFixed(1)})`);
}
const med = eraPairs[Math.floor(eraPairs.length / 2)].d;
console.log(`  cặp gần nhất ${eraPairs[0].d.toFixed(2)} · trung vị ${med.toFixed(2)} · `
  + `dưới ngưỡng mắt (${EYE}): ${eraBad.length}/${eraPairs.length}`);

// ── 3. Kết luận ───────────────────────────────────────────────────────────────────────────────
console.log('');
if (!phaseBad.length && !eraBad.length) {
  // ⚠️ ĐẾM THẬT, ĐỪNG VIẾT CỨNG. Dòng này từng ghi thẳng “90 ô · 15/15 · 105/105” bất kể quét mấy
  // kỷ, nên chạy `--eras 1,2` (12 ô, 1 cặp kỷ) vẫn in ra một lời tuyên bố về 15 kỷ. Một dòng kết
  // luận nói nhiều hơn thứ nó vừa đo chính là hình dạng nói dối rẻ tiền nhất của một công cụ đo.
  console.log(`✓ TOÀN BỘ ${ERA_LIST.length * PHASES.length} Ô PHÂN BIỆT ĐƯỢC: `
    + `${phasePairs.length}/${phasePairs.length} cặp chặng và ${eraPairs.length}/${eraPairs.length} `
    + 'cặp kỷ đều trên ngưỡng mắt.');
} else {
  console.log(`✗ CÒN ${phaseBad.length} cặp chặng và ${eraBad.length} cặp kỷ dưới ngưỡng mắt —`
    + ' hai thứ đó đang là CÙNG MỘT BỨC ẢNH với người chơi.');
}
process.exit(phaseBad.length || eraBad.length ? 1 : 0);
