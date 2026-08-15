#!/usr/bin/env node
/**
 * shadow-score.mjs — CHẤM "BÓNG ĐỔ CÓ PHẢI LÀ MẢNG ĐEN TUYỆT ĐỐI KHÔNG" BẰNG SỐ.
 *
 * ⚠️ VÌ SAO KHÔNG CHẤM BẰNG CÁCH CHẤM VÀI ĐIỂM. Đàm ra yêu cầu *"bóng đổ không được là những mảng
 * đen cứng, phẳng và tuyệt đối"*. Lần đo đầu tôi chấm tay bốn điểm và ra "bóng 0,08 · nắng 0,42",
 * nghe rất dứt khoát — nhưng một trong bốn điểm ấy có độ tươi 0,62 trong khi mặt đất chỉ 0,17, tức
 * tôi đã chấm trúng MẶT ĐƯỜNG (vật liệu đen sẵn) rồi ghi công cho bóng đổ. Đúng bài học đã ghi:
 * *"phép đo phải chạm đúng đại lượng mình định nói"*. Chấm tay vài điểm thì không cách nào biết
 * mình đang so hai mảnh CÙNG một vật liệu hay hai vật liệu khác nhau.
 *
 * ⇒ Cách ở đây: đo PHÂN BỐ trên cả vùng thành phố, và tách ra ba con số nói ba chuyện khác nhau.
 *
 *   1. **SÀN** (bách phân vị thứ 5) — vùng tối nhất tối tới đâu. Đây là con số trả lời thẳng chữ
 *      "tuyệt đối" trong yêu cầu của Đàm.
 *   2. **TỈ LỆ BỊ NGHIỀN** — bao nhiêu phần trăm khung hình nằm dưới ngưỡng "còn nhìn ra chi tiết"
 *      (0,12). Một mảng đen 20% khung hình thì dù mềm mại tới đâu vẫn là một cái hố.
 *   3. **KHOẢNG CÁCH SÁNG-TỐI** (bách phân vị 95 trừ 5) — chiaroscuro. ⚠️ Bắt buộc phải có, vì nó
 *      là thứ mà cách chữa NGÂY THƠ sẽ phá: bật đèn nền lên cho bóng sáng ra thì sàn tăng thật,
 *      mà cả ảnh nhạt như sữa và khoảng cách này TỤT. Dự án đã bác đúng thất bại đó một lần
 *      (Phase 7A). Đo mỗi sàn thì sẽ "chữa" xong mà ảnh xấu đi.
 *
 * ⚠️ VÀ MỘT SỐ THỨ TƯ, ĐỂ BIẾT BÓNG CÓ ĐỌC RA LÀ **BÓNG BAN NGÀY** KHÔNG: **chênh sắc nóng-lạnh**
 * giữa vùng tối và vùng sáng. Ngoài đời bóng ban ngày NGẢ LAM, vì nó mất ánh mặt trời ấm mà vẫn
 * nhận ánh trời xanh. Bóng vừa tối vừa ẤM HƠN vùng nắng là dấu hiệu đèn nền không mang màu trời —
 * và đó là một lỗi mà độ sáng một mình KHÔNG nói được. Số dương = vùng tối lạnh hơn (ĐÚNG).
 *
 * Dùng: node scripts/shadow-score.mjs <ảnh.png> [ảnh-so-sánh.png]
 *       node scripts/shadow-score.mjs --selftest
 */

import { readFileSync } from 'node:fs';

import { decodePng } from './png-probe.mjs';

/** Độ sáng cảm nhận 0..1. */
function lum(r, g, b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }

/**
 * "Độ lạnh" của một điểm ảnh: lam trừ đỏ, chuẩn hoá. Dương = lạnh (ngả lam), âm = ấm (ngả đỏ).
 * Dùng hiệu kênh thô chứ không dùng góc màu HSV, vì góc màu ở vùng gần đen thì nhiễu kinh khủng —
 * đúng cái bẫy đã làm hỏng bộ lọc "8% điểm ảnh tươi nhất" ở Phase 4C.
 */
function coolness(r, g, b) { return (b - r) / 255; }

/**
 * Chỉ đo phần GIỮA khung hình — nơi thành phố đứng.
 *
 * ⚠️ Phải chừa vùng xa ra, và lý do giống hệt `depth-score.mjs` (chỉ ngược chiều): dải trên là núi
 * non chìm trong sương, độ sáng của nó nói về PHỐI CẢNH KHÔNG KHÍ chứ không nói gì về bóng đổ. Gộp
 * vào thì sương sẽ tự kéo "sàn" lên và báo là bóng đã hết đen.
 */
const BAND_TOP = 0.30;
const BAND_BOTTOM = 0.92;
const BAND_LEFT = 0.12;
const BAND_RIGHT = 0.88;

/** Dưới ngưỡng này thì mắt hết đọc ra chi tiết — coi là "bị nghiền". */
const CRUSH = 0.12;

/**
 * ⚠️ VÌ SAO PHẢI CÓ CỘT **ĐỘ TƯƠI**, DÙ ĐANG ĐO BÓNG ĐỔ. Cách chữa "bóng quá đen" hiển nhiên nhất
 * là bật đèn nền lên. Dự án đã đi đúng đường đó một lần và thất bại ở Phase 7A: ảnh "nhạt như sữa",
 * và con số bắt được nó KHÔNG phải độ sáng (sáng 33,8 → 52,2, nghe như tiến bộ) mà là **độ tươi
 * (24,4 → 16,1, tụt 34%)**. `khoảng cách sáng-tối` ở trên KHÔNG thay được nó: nó chỉ đo hai đầu của
 * trục ĐEN-TRẮNG, mà sữa thì vẫn có đủ đen và đủ trắng — thứ sữa lấy mất là MÀU.
 *
 * ⇒ Dùng chroma TUYỆT ĐỐI (`max − min`), KHÔNG dùng độ tươi tương đối của HSV. Đúng bài học Phase
 * 4C: HSV lấy `max` làm mẫu số nên điểm càng TỐI càng dễ ăn điểm cao, và ở đây ta đang đo một tấm
 * ảnh cố ý có nhiều vùng tối — chọn nhầm công thức thì chính vùng bóng sẽ tự bơm điểm tươi lên.
 */
function chroma(r, g, b) {
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

export function scoreShadows(png) {
  const { width, height, pixels } = png;
  const x0 = Math.round(width * BAND_LEFT);
  const x1 = Math.round(width * BAND_RIGHT);
  const y0 = Math.round(height * BAND_TOP);
  const y1 = Math.round(height * BAND_BOTTOM);

  const lums = [];
  const cools = [];
  const chromas = [];
  const rgb = [];
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * width + x) * 4;
      const r = pixels[i]; const g = pixels[i + 1]; const b = pixels[i + 2];
      lums.push(lum(r, g, b));
      cools.push(coolness(r, g, b));
      chromas.push(chroma(r, g, b));
      rgb.push([r, g, b]);
    }
  }
  const sorted = [...lums].sort((a, b) => a - b);
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.round((sorted.length - 1) * p))];
  const floor = at(0.05);
  const ceil = at(0.95);
  const crushed = lums.filter((v) => v < CRUSH).length / lums.length;

  // Chênh sắc: trung bình "độ lạnh" của 25% tối nhất trừ của 25% sáng nhất.
  const idx = lums.map((v, i) => i).sort((a, b) => lums[a] - lums[b]);
  const q = Math.max(1, Math.round(idx.length * 0.25));
  const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const coolDark = mean(idx.slice(0, q).map((i) => cools[i]));
  const coolLit = mean(idx.slice(-q).map((i) => cools[i]));

  // ⚠️ IN RA THỨ MÌNH VỪA CHỌN. Bài học Phase 4C: một bộ lọc điểm ảnh phải in kèm một đại lượng đủ
  // để nhận ra nó bốc nhầm họ. Ở đây `chênh sắc` so "25% tối nhất" với "25% sáng nhất", mà 25% tối
  // nhất là ai thì đổi theo từng ảnh: lúc bóng còn bị nghiền thì đó là mảng ĐEN (chroma ~0), lúc
  // đã nâng sàn thì đó lại là VẬT LIỆU tối màu (mái ngói, mặt đường — chroma cao, và có màu riêng).
  // Không in màu ra thì hai chuyện khác hẳn nhau ấy trông y hệt nhau trên một con số.
  const darkRgb = [0, 1, 2].map((ch) => Math.round(mean(idx.slice(0, q).map((i) => rgb[i][ch]))));
  const litRgb = [0, 1, 2].map((ch) => Math.round(mean(idx.slice(-q).map((i) => rgb[i][ch]))));

  return {
    floor,
    ceil,
    span: ceil - floor,
    crushed,
    coolShift: coolDark - coolLit,
    chroma: mean(chromas),
    darkRgb,
    litRgb,
    samples: lums.length,
  };
}

const hex = (c) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

function report(label, s) {
  console.log(`${label.padEnd(8)} sàn ${s.floor.toFixed(3)} · trần ${s.ceil.toFixed(3)} `
    + `· khoảng cách ${s.span.toFixed(3)} · bị nghiền ${(s.crushed * 100).toFixed(1)}% `
    + `· tươi ${s.chroma.toFixed(3)} `
    + `· chênh sắc ${s.coolShift >= 0 ? '+' : ''}${s.coolShift.toFixed(3)}`
    + `${s.coolShift < 0 ? '  ⚠️ vùng tối ẤM HƠN vùng nắng' : ''}`
    + `\n         └ 25% tối nhất ${hex(s.darkRgb)} · 25% sáng nhất ${hex(s.litRgb)}`);
}

/**
 * ⚠️ TỰ KIỂM PHẢI CHẠM TỪNG CHIỀU NÓ MUỐN BẢO CHỨNG (bài học Phase 4G/7B). Ba số ở đây nói ba
 * chuyện ĐỘC LẬP, nên phải có ca tách được từng cặp: một ca "nâng sàn mà KHÔNG đổi trần" (kiểu chữa
 * đúng) và một ca "nâng cả hai" (kiểu chữa ngây thơ làm nhạt ảnh) phải cho ra hai kết quả KHÁC nhau
 * ở cột `khoảng cách` — nếu không thì cột ấy vô dụng. Và một ca màu để chắc chắn `chênh sắc` thật
 * sự đọc được chiều nóng-lạnh chứ không phải luôn ra 0.
 */
function selftest() {
  const make = (fn) => {
    const width = 200; const height = 400;
    const pixels = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const [r, g, b] = fn(x, y);
        const i = (y * width + x) * 4;
        pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255;
      }
    }
    return { width, height, pixels };
  };
  const half = (x, y, dark, lit) => (x < 100 ? dark : lit);
  const cases = [
    ['bóng đen kịt', (x, y) => half(x, y, [10, 10, 10], [200, 200, 200]),
      (s) => s.floor < 0.06 && s.crushed > 0.4 && s.span > 0.6],
    ['bóng đã nâng, trần GIỮ NGUYÊN', (x, y) => half(x, y, [90, 90, 90], [200, 200, 200]),
      (s) => s.floor > 0.3 && s.crushed === 0 && s.span > 0.4],
    // ⚠️ Ca tách "chữa đúng" khỏi "chữa ngây thơ": nâng CẢ HAI đầu thì sàn cũng lên, nhưng khoảng
    // cách phải TỤT rõ. Thiếu ca này thì cột `khoảng cách` không chứng minh được gì.
    ['nhạt như sữa (nâng cả hai)', (x, y) => half(x, y, [150, 150, 150], [205, 205, 205]),
      (s) => s.floor > 0.3 && s.span < 0.3],
    // Vùng tối ngả LAM, vùng sáng ngả ẤM ⇒ chênh sắc phải DƯƠNG rõ.
    ['bóng ngả lam (đúng ngoài đời)', (x, y) => half(x, y, [40, 55, 90], [210, 195, 170]),
      (s) => s.coolShift > 0.1],
    // …và ca NGƯỢC LẠI, để chắc chắn nó không phải lúc nào cũng dương.
    ['bóng ngả nâu (sai)', (x, y) => half(x, y, [90, 55, 30], [180, 190, 210]),
      (s) => s.coolShift < -0.1],
  ];
  let bad = 0;
  for (const [name, fn, ok] of cases) {
    const s = scoreShadows(make(fn));
    const pass = ok(s);
    if (!pass) bad += 1;
    console.log(`${pass ? '✓' : '✗'} ${name.padEnd(30)} sàn ${s.floor.toFixed(3)} `
      + `· khoảng cách ${s.span.toFixed(3)} · nghiền ${(s.crushed * 100).toFixed(0)}% `
      + `· chênh sắc ${s.coolShift.toFixed(3)}`);
  }
  process.exit(bad ? 1 : 0);
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--selftest') return selftest();
  if (!args[0]) {
    console.error('Dùng: node scripts/shadow-score.mjs <ảnh.png> [ảnh-so-sánh.png]');
    process.exit(1);
  }
  const a = scoreShadows(decodePng(readFileSync(args[0])));
  if (!args[1]) return report('ảnh', a);
  report('TRƯỚC', a);
  report('SAU', scoreShadows(decodePng(readFileSync(args[1]))));
  return undefined;
}

main();
