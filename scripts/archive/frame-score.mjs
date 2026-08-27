/**
 * frame-score.mjs — CHẤM DẢI SÁNG–TỐI VÀ ĐỘ TƯƠI của một khung hình thành phố.
 *
 * Sinh ra cho Phase 9C, để trả lời đúng một câu hỏi mà không công cụ nào sẵn có trả lời được:
 * **bức ảnh này có ĐIỂM SÁNG không, hay nó chạm trần rồi phẳng lì?**
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG `shadow-score.mjs`: cái đó đo ĐẦU TỐI (sàn bóng đổ, % điểm bị nghiền) trong
 * một dải hẹp giữa ảnh, và nó cố ý bỏ qua phần trên khung hình. Phase 9C hỏi về ĐẦU SÁNG, trên
 * TOÀN khung. Hai câu hỏi khác nhau ⇒ hai phép đo khác nhau; nhồi chung vào một công cụ thì cái
 * ngưỡng của bên này sẽ lặng lẽ bóp méo kết luận của bên kia.
 *
 * ⚠️ ĐỘ TƯƠI ĐO BẰNG CHROMA TUYỆT ĐỐI (max − min), KHÔNG PHẢI `s` CỦA HSV. Bài học Phase 4C: HSV
 * lấy `max` làm mẫu số nên điểm ảnh càng TỐI càng ăn điểm cao — `#010e0a` ra sat 0,93. Dùng nó ở
 * đây thì mọi bản vá làm sáng ảnh lên sẽ bị báo là "mất độ tươi" một cách máy móc, tức công cụ sẽ
 * chống lại đúng thứ nó sinh ra để kiểm.
 *
 * ⚠️ VÙNG ĐO PHẢI BỎ VIỀN TRANG. Ảnh của `city-preview.mjs` là ảnh chụp cả trang: quanh khung vẽ
 * còn nền trang màu kem (sáng ~0,84, tươi ~0,02) và một dòng chữ chú thích. Tính cả phần đó vào
 * thì "% điểm sáng hơn 0,75" sẽ ra 20–30% một cách vô nghĩa — toàn bộ là viền. Khung nội dung dò
 * bằng cách loang từ mép vào cho tới khi khác màu nền trang.
 *
 * Cách dùng:
 *   node scripts/frame-score.mjs .city-preview/city-era07-light-h12-s40.png
 *   node scripts/frame-score.mjs .city-preview/*.png          # nhiều ảnh, in thành bảng
 *   node scripts/frame-score.mjs --json <ảnh…>                # máy đọc, để so trước/sau
 *   node scripts/frame-score.mjs --selftest                   # tự kiểm phép đo
 */

import { readFileSync } from 'node:fs';
import { decodePng } from '../png-probe.mjs';

/** Ngưỡng "đây là một điểm SÁNG": trên thang sRGB 0–1. */
const HIGHLIGHT = 0.75;

/**
 * Sai khác tối đa so với màu góc ảnh mà vẫn coi là "vẫn còn viền trang".
 * ⚠️ Nới rộng hơn nữa thì phép dò sẽ ăn lẹm vào cảnh (nền trời nhạt cũng gần màu kem); hẹp hơn thì
 * nó dừng ngay ở nhiễu nén PNG. 6/255 đo ra là chỗ đứng vững cho cả theme sáng lẫn tối.
 */
const BORDER_TOL = 6;

/** Độ sáng cảm nhận (Rec.709). Ảnh PNG đã ở không gian sRGB nên đây là thang MẮT, không phải thang vật lý. */
export function lum(r, g, b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }

/** Chroma TUYỆT ĐỐI. Xem chú thích đầu file về vì sao không phải `s` của HSV. */
export function chroma(r, g, b) { return (Math.max(r, g, b) - Math.min(r, g, b)) / 255; }

/**
 * Dò khung nội dung: bỏ viền trang màu đồng nhất quanh khung vẽ.
 * Thuần, tách riêng để `--selftest` gọi được với ảnh dựng tay.
 */
export function contentBox({ width, height, pixels }) {
  const at = (x, y) => {
    const i = (y * width + x) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2]];
  };
  const [br, bg, bb] = at(0, 0);
  const isBorder = (x, y) => {
    const [r, g, b] = at(x, y);
    return Math.abs(r - br) <= BORDER_TOL
      && Math.abs(g - bg) <= BORDER_TOL
      && Math.abs(b - bb) <= BORDER_TOL;
  };
  const midY = Math.floor(height / 2);
  const midX = Math.floor(width / 2);
  let x0 = 0;
  while (x0 < width - 1 && isBorder(x0, midY)) x0 += 1;
  let x1 = width - 1;
  while (x1 > x0 && isBorder(x1, midY)) x1 -= 1;
  let y0 = 0;
  while (y0 < height - 1 && isBorder(midX, y0)) y0 += 1;
  let y1 = height - 1;
  while (y1 > y0 && isBorder(midX, y1)) y1 -= 1;
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Chấm một ảnh đã giải mã. Thuần. */
export function scoreFrame(img) {
  const box = contentBox(img);
  const { width, pixels } = img;
  const lums = [];
  let chromaSum = 0;
  let lumSum = 0;
  let highlights = 0;
  let max = 0;
  let n = 0;
  for (let y = box.y0; y <= box.y1; y += 1) {
    for (let x = box.x0; x <= box.x1; x += 1) {
      const i = (y * width + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const l = lum(r, g, b);
      lums.push(l);
      lumSum += l;
      chromaSum += chroma(r, g, b);
      if (l > HIGHLIGHT) highlights += 1;
      if (l > max) max = l;
      n += 1;
    }
  }
  lums.sort((a, b) => a - b);
  const q = (p) => lums[Math.floor(p * (lums.length - 1))];
  return {
    box,
    samples: n,
    max,
    p99: q(0.99),
    p95: q(0.95),
    p50: q(0.5),
    p05: q(0.05),
    avgLum: lumSum / n,
    avgChroma: chromaSum / n,
    highlightPct: (100 * highlights) / n,
    // Dải động mắt thật sự đọc được: bỏ 1% hai đầu để một hạt nhiễu đơn lẻ không định nghĩa cả ảnh.
    span: q(0.99) - q(0.01),
  };
}

export function scoreFile(path) {
  return scoreFrame(decodePng(readFileSync(path)));
}

/* ── TỰ KIỂM ─────────────────────────────────────────────────────────────────────────────────
 * ⚠️ Bài học Phase 4C/4G/7B: một phép tự kiểm chứng minh bộ lọc CÓ chạy thì chưa đủ — nó phải
 * chạm tới TỪNG CHIỀU mà công cụ tự nhận là đo được. Bốn ca dưới đây, mỗi ca nhốt đúng một cách
 * mà công cụ này có thể nói dối:
 *   1. viền trang bị tính vào  → "% điểm sáng" phóng đại
 *   2. đỉnh sáng cục bộ        → phải thấy, dù chỉ chiếm 1% diện tích
 *   3. ảnh sáng đều mà nhạt    → KHÔNG được nhầm là có điểm sáng (đây là thất bại Phase 7A)
 *   4. độ tươi                 → phải phân biệt được xám với màu, ở CÙNG một độ sáng
 */
function fakePng(width, height, paint) {
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = paint(x, y);
      const i = (y * width + x) * 4;
      pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255;
    }
  }
  return { width, height, pixels };
}

function selftest() {
  const BORDER = [233, 230, 222];
  const fails = [];
  const ok = (name, cond, detail) => {
    if (cond) console.log(`  ✓ ${name}`);
    else { console.log(`  ✗ ${name} — ${detail}`); fails.push(name); }
  };

  // 1. Viền trang phải bị loại. Cảnh giữa tối thui, viền sáng trưng.
  const framed = fakePng(200, 100, (x, y) => (
    x < 40 || x > 159 || y < 20 || y > 79 ? BORDER : [30, 30, 30]
  ));
  const a = scoreFrame(framed);
  ok('bỏ được viền trang', a.box.w === 120 && a.box.h === 60 && a.highlightPct === 0,
    `khung ${a.box.w}x${a.box.h}, %sáng ${a.highlightPct.toFixed(1)} (phải 120x60 và 0)`);

  // 2. Đỉnh sáng cục bộ 1% diện tích phải hiện ra. Đây là chiều mà `shadow-score` mù hoàn toàn.
  const glint = fakePng(200, 100, (x, y) => {
    if (x < 40 || x > 159 || y < 20 || y > 79) return BORDER;
    const inside = (x - 40) + (y - 20) * 120;
    return inside < 72 ? [252, 250, 245] : [90, 88, 80];
  });
  const b = scoreFrame(glint);
  ok('thấy đỉnh sáng chiếm 1% diện tích', b.highlightPct > 0.5 && b.highlightPct < 2.5,
    `%sáng ${b.highlightPct.toFixed(2)} (phải quanh 1)`);

  // 3. Ảnh SÁNG ĐỀU nhưng dưới ngưỡng: KHÔNG được báo có điểm sáng. Nếu ca này xanh oan thì công
  //    cụ sẽ khen đúng cái bản vá làm cả cảnh nhạt đi — thất bại Phase 7A đội lốt thành công.
  const milky = fakePng(200, 100, (x, y) => (
    x < 40 || x > 159 || y < 20 || y > 79 ? BORDER : [180, 178, 174]
  ));
  const c = scoreFrame(milky);
  ok('ảnh sáng đều mà nhạt KHÔNG bị nhầm là có đỉnh', c.highlightPct === 0 && c.avgLum > 0.65,
    `%sáng ${c.highlightPct.toFixed(2)} · sáng TB ${c.avgLum.toFixed(3)}`);

  // 4. Độ tươi phải tách được xám khỏi màu ở CÙNG độ sáng — nếu không, mọi kết luận "có mất màu
  //    không" đều vô giá trị.
  const grey = fakePng(120, 60, () => [128, 128, 128]);
  const vivid = fakePng(120, 60, () => [190, 128, 66]);
  const g = scoreFrame(grey);
  const v = scoreFrame(vivid);
  ok('đo được độ tươi', g.avgChroma < 0.01 && v.avgChroma > 0.4,
    `xám ${g.avgChroma.toFixed(3)} · màu ${v.avgChroma.toFixed(3)}`);

  console.log(fails.length ? `\n✗ ${fails.length} ca hỏng` : '\n✓ phép đo lành lặn');
  return fails.length === 0;
}

/* ── CLI ─────────────────────────────────────────────────────────────────────────────────────*/

/**
 * ⚠️ CỔNG "CÓ PHẢI ĐANG CHẠY THẲNG KHÔNG". Thiếu nó thì mỗi lần một script khác `import` file này
 * để dùng lại `lum`/`contentBox`/`scoreFile`, phần CLI bên dưới cũng chạy theo — không có tham số
 * nên nó in bảng hướng dẫn rồi `process.exit(1)`, tức script đi mượn CHẾT NGAY trước khi chạy dòng
 * đầu tiên của mình. Đúng bẫy đó đã cắn một lần: một công cụ khai là "thuần, tách riêng để gọi lại"
 * mà trên thực tế không ai gọi lại được. Đã xuất ra thì phải nhập vào được.
 */
const RUN_AS_CLI = process.argv[1] && process.argv[1].endsWith('frame-score.mjs');

const argv = RUN_AS_CLI ? process.argv.slice(2) : [];
if (argv.includes('--selftest')) {
  console.log('frame-score --selftest');
  process.exit(selftest() ? 0 : 1);
}

const asJson = argv.includes('--json');
const files = argv.filter((a) => !a.startsWith('--'));
if (RUN_AS_CLI && files.length === 0) {
  console.log('Dùng: node scripts/frame-score.mjs <ảnh.png…> [--json] [--selftest]');
  process.exit(1);
}

const rows = files.map((f) => ({ file: f.split('/').pop().replace(/\.png$/, ''), ...scoreFile(f) }));

if (!RUN_AS_CLI) {
  // Được `import` chứ không chạy thẳng ⇒ dừng ở đây, đừng in gì cả. In một dòng tiêu đề bảng vào
  // giữa đầu ra của script đi mượn là cách làm bẩn dữ liệu của người khác trong im lặng.
} else if (asJson) {
  console.log(JSON.stringify(rows.map((r) => ({
    file: r.file,
    max: +r.max.toFixed(4),
    p99: +r.p99.toFixed(4),
    avgLum: +r.avgLum.toFixed(4),
    avgChroma: +r.avgChroma.toFixed(4),
    highlightPct: +r.highlightPct.toFixed(3),
    span: +r.span.toFixed(4),
    w: r.box.w,
    h: r.box.h,
  })), null, 2));
} else {
  const pad = Math.max(...rows.map((r) => r.file.length));
  console.log(`${'ảnh'.padEnd(pad)}   sáng nhất    p99   >0,75%   sáng TB   tươi TB    dải`);
  for (const r of rows) {
    console.log(
      `${r.file.padEnd(pad)}   ${r.max.toFixed(3).padStart(9)}`
      + `  ${r.p99.toFixed(3)}   ${r.highlightPct.toFixed(2).padStart(6)}`
      + `    ${r.avgLum.toFixed(3)}     ${r.avgChroma.toFixed(3)}  ${r.span.toFixed(3)}`,
    );
  }
}
