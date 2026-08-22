/**
 * human-strip.mjs — DÁN 15 CƯ DÂN CẠNH NHAU, PHÓNG TO, ĐỂ MẮT CHẤM
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO PHẢI CÓ FILE NÀY
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `humanIdentity.test.js` chấm bản sắc bằng SỐ và nó chấm đúng thứ nó nói. Nhưng dự án này đã học
 * đủ lần rằng **một cổng số xanh không chứng minh được gì với mắt**: bản quét 15 kỷ từng "0/105 cặp
 * dưới ngưỡng" trong khi hai chặng ngày là cùng một bức ảnh (Phase 3Y), và Phase 11 tiêu 110.076
 * tam giác lên mái rồi mới biết bản quét không phân biệt nổi. Lỗi mỹ thuật gần như luôn là lỗi
 * SO SÁNH, nên 15 cư dân phải được đặt CẠNH NHAU chứ không xem từng ảnh rời.
 *
 * ⚠️ VÀ VỊ TRÍ CƯ DÂN ĐƯỢC **ĐO**, KHÔNG ĐƯỢC **DỰNG LẠI**. Cám dỗ ở đây là tự dựng lại camera
 * (`cityOrbitOptions` + `planCityFocus`) rồi chiếu toạ độ cư dân ra điểm ảnh — nhanh hơn, và là
 * đúng cái bẫy "một luật hai công thức" đã làm `sweep-score.mjs` bịa ra nguyên một bộ số (Phase
 * 4G). Ở đây: dựng THÊM một ảnh `--mask residents` với Y HỆT các cờ còn lại, rồi đọc vị trí từ
 * chính mặt nạ mà GPU tô ra. Chậm gấp đôi, nhưng nó không thể lệch khỏi ảnh màu.
 *
 * ⚠️ KHÔNG CÓ CACHE. Cổng `[ -f "$png" ] || dựng` là quả mìn "tên file làm bằng chứng về nội dung
 * file" (Phase 13 VIỆC B: một bảng số hoàn chỉnh và rất hợp lý, dựng từ ảnh của hai hôm trước).
 * Dựng lại tốn vài phút; một kết luận mỹ thuật sai tốn cả một phase.
 *
 * Dùng:
 *   node --import ./scripts/register-esm-loader.mjs scripts/human-strip.mjs
 *   node --import ./scripts/register-esm-loader.mjs scripts/human-strip.mjs --eras 1,6,12,15
 *   node --import ./scripts/register-esm-loader.mjs scripts/human-strip.mjs --selftest
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodePng, encodePng } from './png-probe.mjs';

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const THU_MUC = resolve(GOC, '.city-preview');

const argv = process.argv;
const arg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);

const RONG = 1400;
const CAO = 900;
const GIO = 12;
const PHIEN = 80;
const PHONG = 5;      // phóng to nguyên lần (lấy mẫu gần nhất — KHÔNG nội suy, kẻo bịa chi tiết)
const LE = 6;         // số điểm ảnh chừa quanh cư dân trước khi phóng

/**
 * Gom cụm liên thông trên MẶT NẠ (kênh đỏ) → danh sách hộp bao.
 * ⚠️ Mặt nạ chỉ tô ba màu thuần một kênh, nên "đỏ > 40 và lục/lam gần 0" là phép nhận dạng chắc
 * chắn — không phải một ngưỡng chọn tay trên ảnh màu.
 */
export function gomCum({ width, height, pixels }) {
  const daXet = new Uint8Array(width * height);
  const laDo = (i) => pixels[i * 4] > 40 && pixels[i * 4 + 1] < 40 && pixels[i * 4 + 2] < 40;
  const cum = [];
  for (let s = 0; s < width * height; s += 1) {
    if (daXet[s] || !laDo(s)) continue;
    let x0 = width; let y0 = height; let x1 = -1; let y1 = -1; let n = 0;
    const ngan = [s];
    daXet[s] = 1;
    while (ngan.length) {
      const p = ngan.pop();
      const x = p % width; const y = (p - x) / width;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
      n += 1;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx; const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const q = ny * width + nx;
        if (daXet[q] || !laDo(q)) continue;
        daXet[q] = 1;
        ngan.push(q);
      }
    }
    cum.push({ x0, y0, x1, y1, n, cao: y1 - y0 + 1, rong: x1 - x0 + 1 });
  }
  return cum;
}

/** Cắt một vùng rồi phóng to nguyên lần bằng lấy mẫu gần nhất. */
export function catVaPhong(anh, { x0, y0, w, h }, lan) {
  const W = w * lan; const H = h * lan;
  const ra = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y += 1) {
    const sy = Math.min(anh.height - 1, Math.max(0, y0 + Math.floor(y / lan)));
    for (let x = 0; x < W; x += 1) {
      const sx = Math.min(anh.width - 1, Math.max(0, x0 + Math.floor(x / lan)));
      ra.set(anh.pixels.subarray((sy * anh.width + sx) * 4, (sy * anh.width + sx) * 4 + 4), (y * W + x) * 4);
    }
  }
  return { width: W, height: H, pixels: ra };
}

/** Ghép các tấm cùng CHIỀU CAO theo hàng ngang, chừa `khe` điểm ảnh nền giữa chúng. */
export function ghepNgang(tam, khe, nen = [24, 24, 26, 255]) {
  const H = Math.max(...tam.map((t) => t.height));
  const W = tam.reduce((a, t) => a + t.width, 0) + khe * (tam.length + 1);
  const ra = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i += 1) ra.set(nen, i * 4);
  let x = khe;
  for (const t of tam) {
    const dy = Math.floor((H - t.height) / 2);
    for (let y = 0; y < t.height; y += 1) {
      for (let c = 0; c < t.width; c += 1) {
        ra.set(t.pixels.subarray((y * t.width + c) * 4, (y * t.width + c) * 4 + 4),
          (((y + dy) * W) + x + c) * 4);
      }
    }
    x += t.width + khe;
  }
  return { width: W, height: H, pixels: ra };
}

function dung(era, mask) {
  const co = ['--era', String(era), '--hour', String(GIO), '--width', String(RONG),
    '--height', String(CAO), '--sessions', String(PHIEN)];
  if (mask) co.push('--mask', 'residents');
  execFileSync('node', [resolve(GOC, 'scripts/city-preview.mjs'), ...co], { cwd: GOC, stdio: 'pipe' });
  const ten = `city-era${String(era).padStart(2, '0')}-light-h${GIO}-s${PHIEN}-w${RONG}`
    + (mask ? '-mask-residents' : '') + '.png';
  return decodePng(readFileSync(resolve(THU_MUC, ten)));
}

// ─── --selftest: chứng minh phần cốt lõi CHẠY, và chạy ĐÚNG ────────────────────────────────────
if (has('--selftest')) {
  // Hai đốm tách rời, cỡ khác nhau ⇒ phải ra ĐÚNG 2 cụm, và cụm to phải được chọn.
  const W = 40; const H = 20;
  const px = Buffer.alloc(W * H * 4);
  const cham = (x, y) => px.set([200, 0, 0, 255], (y * W + x) * 4);
  cham(3, 3); cham(4, 3); cham(3, 4);                        // cụm nhỏ: 3 điểm
  for (let y = 10; y < 16; y += 1) for (let x = 20; x < 24; x += 1) cham(x, y); // cụm to: 24 điểm
  const cum = gomCum({ width: W, height: H, pixels: px });
  if (cum.length !== 2) throw new Error(`gomCum ra ${cum.length} cụm, mong đợi 2`);
  const to = cum.reduce((a, b) => (a.n > b.n ? a : b));
  if (to.n !== 24 || to.cao !== 6 || to.rong !== 4) {
    throw new Error(`cụm to sai: n=${to.n} cao=${to.cao} rong=${to.rong}`);
  }
  // ⚠️ VÀ ĐỐI CHỨNG NGƯỢC: một tấm KHÔNG có điểm đỏ nào phải ra 0 cụm. Không có vế này thì một
  // `gomCum` luôn trả về [] cũng "qua" được vế trên (nó chỉ kiểm khi CÓ đốm).
  const trang = { width: W, height: H, pixels: Buffer.alloc(W * H * 4) };
  if (gomCum(trang).length !== 0) throw new Error('gomCum thấy cụm trên một tấm rỗng');
  // Phóng to phải giữ NGUYÊN màu (lấy mẫu gần nhất), không được pha trộn.
  const phong = catVaPhong({ width: W, height: H, pixels: px }, { x0: 20, y0: 10, w: 4, h: 6 }, 3);
  if (phong.width !== 12 || phong.height !== 18) throw new Error('catVaPhong sai kích thước');
  if (phong.pixels[0] !== 200 || phong.pixels[1] !== 0) throw new Error('catVaPhong đã nội suy màu');
  console.log('✓ --selftest: gomCum 2 cụm · chọn đúng cụm to · tấm rỗng ra 0 · phóng to không pha màu');
  process.exit(0);
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  const eras = String(arg('--eras', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15'))
    .split(',').map(Number).filter((n) => n >= 1 && n <= 15);
  const tam = [];
  const bang = [];
  for (const era of eras) {
    const mau = dung(era, false);
    const mask = dung(era, true);
    if (mau.width !== mask.width || mau.height !== mask.height) {
      throw new Error(`kỷ ${era}: ảnh màu ${mau.width}×${mau.height} khác mặt nạ`
        + ` ${mask.width}×${mask.height} — hai lượt dựng KHÔNG cùng khung, mọi toạ độ vô nghĩa`);
    }
    const cum = gomCum(mask).filter((c) => c.n >= 12);
    if (cum.length === 0) {
      console.log(`  ⚠️ kỷ ${era}: mặt nạ không thấy cư dân nào đủ lớn — BỎ QUA (và đó là một kết quả)`);
      continue;
    }
    // Chọn cư dân TO NHẤT trên khung: gần camera nhất ⇒ nhiều điểm ảnh nhất để nhìn.
    const c = cum.reduce((a, b) => (a.n > b.n ? a : b));
    const x0 = Math.max(0, c.x0 - LE);
    const y0 = Math.max(0, c.y0 - LE);
    const w = Math.min(mau.width - x0, c.rong + LE * 2);
    const h = Math.min(mau.height - y0, c.cao + LE * 2);
    tam.push(catVaPhong(mau, { x0, y0, w, h }, PHONG));
    bang.push({ era, cao: c.cao, rong: c.rong, so: cum.length });
  }
  if (tam.length === 0) throw new Error('không kỷ nào cho ra cư dân — đừng ghi một tấm rỗng');
  const ra = resolve(THU_MUC, `human-strip-ky${eras[0]}-${eras[eras.length - 1]}.png`);
  writeFileSync(ra, encodePng(ghepNgang(tam, 8)));
  console.log('  kỷ  cao(px)  rộng(px)  số cư dân thấy được trên khung');
  for (const b of bang) {
    console.log(`  ${String(b.era).padStart(2)}${String(b.cao).padStart(8)}`
      + `${String(b.rong).padStart(9)}${String(b.so).padStart(10)}`);
  }
  console.log(`✓ dải ${tam.length} kỷ (phóng ${PHONG} lần) → ${ra}`);
}
