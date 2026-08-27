#!/usr/bin/env node
/**
 * depth-score.mjs — CHẤM "KHUNG HÌNH CÓ MẤY LỚP KHÔNG GIAN" BẰNG SỐ.
 *
 * ⚠️ VÌ SAO CẦN MỘT CÔNG CỤ NỮA. Đàm yêu cầu thành phố có *"foreground / midground / background"*.
 * Đó là một yêu cầu về CẤU TRÚC, và cấu trúc thì mắt rất dễ bị đánh lừa — đúng bài học Phase 8D:
 * *"mắt người rất giỏi tìm ra cụm trong nhiễu, nên nhìn ảnh thấy có cụm KHÔNG phải bằng chứng"*.
 * Trước Phase 9A, dải trên của khung hình là một tấm ván phẳng chìm trong sương bão hoà: nhìn qua
 * thì "có vẻ xa xăm", đo ra thì nó là một dốc màu TRƠN TUỘT — không một lớp nào.
 *
 * Phép đo: lấy vài cột dọc trong DẢI TRÊN của ảnh rồi hỏi hai câu khác nhau.
 *   1. **Biên độ** — dải sáng nhất trừ tối nhất. Một mảng phẳng cho ra gần 0.
 *   2. **SỐ LẦN ĐỔI CHIỀU** — đi từ trên xuống, độ sáng tăng rồi giảm bao nhiêu lần.
 *      ⚠️ Đây mới là con số quan trọng, và nó là thứ biên độ KHÔNG nói được: một dốc màu mượt từ
 *      sáng xuống tối có biên độ lớn mà **0 lần đổi chiều** — nó vẫn là một mặt phẳng. Mỗi lần đổi
 *      chiều là một sườn núi che lấy một sườn khác, tức MỘT LỚP KHÔNG GIAN. Đo mỗi biên độ thì bản
 *      cũ (dốc 0,51→0,37) sẽ được chấm "có chiều sâu", và đó là một kết luận sai.
 *
 * Dùng: node scripts/depth-score.mjs <ảnh.png> [ảnh-so-sánh.png]
 *       node scripts/depth-score.mjs --selftest
 */

import { readFileSync } from 'node:fs';

import { decodePng } from '../png-probe.mjs';

/** Độ sáng cảm nhận 0..1. */
function lum(r, g, b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }

/**
 * Bao nhiêu phần TRÊN của ảnh được coi là "vùng xa".
 * Camera chúi xuống 34° nên thành phố luôn nằm ở giữa khung.
 */
const FAR_BAND = 0.26;

/**
 * Chỉ lấy cột nằm trong bấy nhiêu phần NGOÀI CÙNG mỗi bên.
 *
 * ⚠️ THÊM SAU KHI CHÍNH CÔNG CỤ NÀY NÓI DỐI MỘT LẦN (lần thứ 18 trong dự án). Bản đầu rải cột đều
 * khắp bề ngang và chấm bản CŨ của kỷ 13 được **14 lần đổi chiều** — trong khi bản cũ ngoài kia
 * đúng là một tấm ván phẳng. Truy ra: dải trên của kỷ 13 CÓ chạm nóc mấy công trình cao, nên phép
 * đo đang đếm cả mái nhà và bóng đổ của THÀNH PHỐ rồi ghi công cho VÙNG XA. Con số vẫn "tăng" nên
 * rất dễ được nhận là bằng chứng — đúng loại sai mà `CLAUDE.md` gọi là "đo một trục thì vừa BÁO
 * NHẦM vừa BỎ SÓT". Thành phố luôn nằm giữa khung, nên chừa hai rìa là tách được nó ra.
 */
const EDGE_SHARE = 0.28;
/** Bỏ qua dao động nhỏ hơn ngần này khi đếm đổi chiều — nếu không thì nhiễu lượng tử hoá tự đếm. */
const NOISE_FLOOR = 0.008;

export function scoreDepth(png) {
  const { width, height, pixels } = png;
  const y0 = Math.round(height * 0.02);
  const y1 = Math.round(height * FAR_BAND);
  const at = (x, y) => {
    const i = (y * width + x) * 4;
    return lum(pixels[i], pixels[i + 1], pixels[i + 2]);
  };

  let turns = 0;
  let span = 0;
  // Cột chỉ nằm ở hai RÌA — xem `EDGE_SHARE`. Nửa số cột bên trái, nửa bên phải.
  const perSide = 4;
  const columns = perSide * 2;
  const xs = [];
  for (let c = 1; c <= perSide; c += 1) {
    const t = (c / (perSide + 1)) * EDGE_SHARE;
    xs.push(Math.round(width * t), Math.round(width * (1 - t)));
  }
  for (const x of xs) {
    const series = [];
    for (let y = y0; y < y1; y += 3) series.push(at(x, y));
    span = Math.max(span, Math.max(...series) - Math.min(...series));

    // Đếm đổi chiều trên chuỗi đã lọc nhiễu: chỉ ghi nhận một bước khi nó vượt `NOISE_FLOOR`.
    let dir = 0;
    let anchor = series[0];
    for (const v of series) {
      const d = v - anchor;
      if (Math.abs(d) < NOISE_FLOOR) continue;
      const nd = Math.sign(d);
      if (dir !== 0 && nd !== dir) turns += 1;
      dir = nd;
      anchor = v;
    }
  }
  return { turns, span, columns };
}

function load(path) {
  return scoreDepth(decodePng(readFileSync(path)));
}

function report(label, s) {
  console.log(`${label.padEnd(10)} đổi chiều ${String(s.turns).padStart(3)} lần trên ${s.columns} cột `
    + `· biên độ ${s.span.toFixed(3)}`);
}

/**
 * ⚠️ TỰ KIỂM PHẢI CHẠM TỚI ĐÚNG CHIỀU NÓ MUỐN BẢO CHỨNG — bài học Phase 4G/7B. Ở đây chiều ấy là
 * "phân biệt được DỐC MƯỢT với NHIỀU LỚP", nên phải có một ca dốc mượt biên độ LỚN mà số lớp phải
 * ra 0. Chỉ thử "ảnh phẳng ra 0" thì mù đúng chỗ dễ sai nhất.
 */
function selftest() {
  const make = (fn) => {
    const width = 200; const height = 400;
    const pixels = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const v = Math.max(0, Math.min(255, Math.round(fn(x, y) * 255)));
        const i = (y * width + x) * 4;
        pixels[i] = v; pixels[i + 1] = v; pixels[i + 2] = v; pixels[i + 3] = 255;
      }
    }
    return { width, height, pixels };
  };
  const cases = [
    ['phẳng lì', () => 0.5, (s) => s.turns === 0 && s.span < 0.02],
    ['dốc MƯỢT biên độ lớn', (x, y) => 0.8 - y / 500,
      (s) => s.turns === 0 && s.span > 0.15],   // ⚠️ ca quan trọng nhất: biên độ to mà 0 lớp
    ['nhiều lớp', (x, y) => 0.5 + 0.2 * Math.sin(y / 9), (s) => s.turns > 20],
  ];
  let bad = 0;
  for (const [name, fn, ok] of cases) {
    const s = scoreDepth(make(fn));
    const pass = ok(s);
    if (!pass) bad += 1;
    console.log(`${pass ? '✓' : '✗'} ${name.padEnd(22)} đổi chiều ${s.turns} · biên độ ${s.span.toFixed(3)}`);
  }
  process.exit(bad ? 1 : 0);
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--selftest') return selftest();
  if (!args[0]) {
    console.error('Dùng: node scripts/depth-score.mjs <ảnh.png> [ảnh-so-sánh.png]');
    process.exit(1);
  }
  const a = load(args[0]);
  if (!args[1]) return report('ảnh', a);
  const b = load(args[1]);
  report('TRƯỚC', a);
  report('SAU', b);
  console.log(`⇒ số lớp không gian ${a.turns} → ${b.turns}`
    + `${a.turns === 0 && b.turns > 0 ? '  (từ MỘT mặt phẳng thành một phong cảnh)' : ''}`);
  return undefined;
}

main();
