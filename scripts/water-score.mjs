/**
 * water-score.mjs — MẶT NƯỚC CHIẾM BAO NHIÊU PHẦN KHUNG HÌNH, ĐO TRÊN ĐIỂM ẢNH ĐÃ DỰNG.
 *
 * ⚠️ VÌ SAO CÔNG CỤ NÀY TỒN TẠI TRONG KHI ĐÃ CÓ `water-view.mjs` — VÀ ĐÂY LÀ LẦN THỨ 24 MỘT CÔNG
 * CỤ ĐO CỦA DỰ ÁN NÓI DỐI, THEO HƯỚNG TRẤN AN (2026-08-20, nghiệm thu Bước C).
 *
 * `water-view.mjs` bắn tia từ đúng camera của app và hỏi *"tia này chạm nước trước hay chạm đất
 * trước?"*. Nghe là đúng câu. Nhưng hàm dò mặt đất của nó (`caoDoTai`) chỉ đọc **trường cao độ**
 * (`surfaceHeightAt` / `horizon.heightAt`) — nó KHÔNG biết cây cối, nhà cửa, đá, cư dân tồn tại.
 * Một tia xuyên qua tán cây rồi chạm mặt nước phía sau được ghi là "nước", còn màn hình vẽ ra một
 * cái cây. Sai số vì thế **không đều**: lớn nhất đúng ở những kỷ nước HẸP và bờ RẬM — tức đúng
 * những kỷ đang đứng sát cổng.
 *
 *   kỷ  6  tia 4,13% · màn hình 1,37%   → tia cao hơn 3,01 lần
 *   kỷ  5  tia 5,62% · màn hình 3,34%   → 1,68 lần   (tưởng ĐẠT cổng 5%, thật ra TRƯỢT)
 *   kỷ  4  tia 5,02% · màn hình 3,32%   → 1,51 lần   (tưởng ĐẠT, thật ra TRƯỢT)
 *   kỷ 13  tia 24,12% · màn hình 23,18% → 1,04 lần   (biển rộng: lệch ít nhất)
 *
 * Vì tin phép tia, bảng nghiệm thu Bước C từng ghi *"11/14 kỷ đạt cổng 5%"*. Sự thật: **5/14**.
 *
 * ⇒ PHÂN VAI, ĐỪNG GỘP: `water-view.mjs` trả lời *"xoay camera đi thì TRẦN là bao nhiêu"* (cây
 * đứng yên khi xoay nên sai số triệt tiêu phần lớn — nó vẫn là công cụ đúng cho việc đó, và nó
 * chạy được không cần Chromium). Công cụ NÀY trả lời *"hôm nay Đàm thật sự THẤY bao nhiêu"*, và
 * chỉ nó mới được dùng để chấm cổng phần trăm.
 *
 * ── CÁCH ĐO ─────────────────────────────────────────────────────────────────────────────────
 * Không có một bộ lọc màu nào — `TECH_DEBT #22` đã trả giá ba phase cho việc ĐOÁN xem điểm ảnh nào
 * là cái gì. Thay vào đó hỏi thẳng bên dựng: `city-preview.mjs --mask water` tô ĐÚNG những điểm
 * ảnh mà GPU vẽ ra là mặt nước, bằng ĐỎ THUẦN. Công cụ này đọc tấm mặt nạ ấy để biết ĐỊA CHỈ của
 * nước, rồi đọc MÀU THẬT của đúng những địa chỉ đó trong ảnh thường.
 *
 * Cột "cách nhau" = khoảng cách RGB/255 giữa màu nước trung bình và màu ĐẤT SÁT BỜ (vành đai
 * `VANH` điểm ảnh quanh mép nước) — vì mắt so nước với thứ NGAY CẠNH nó, không so với trung bình
 * cả khung hình. Đơn vị giữ nguyên thang của ngưỡng mắt 12 hiệu chuẩn ở Phase 3Y.
 *
 * ⚠️ HAI CÂU HỎI KHÁC NHAU, ĐỪNG ĐỂ MỘT CỘT GÁNH CẢ HAI: "% khung" = có ĐỦ NHIỀU không;
 * "cách nhau" = có ĐỌC RA là nước không. Kỷ 10 là đối chứng sống — nó tương phản mạnh nhất bảng
 * (103,2) mà chỉ chiếm 1,18% khung, tức rất rõ nhưng rất ít.
 *
 * Dùng:
 *   node scripts/city-preview.mjs --era 8 --hour 12 --mask water   # dựng mặt nạ (cần Chromium)
 *   node scripts/city-preview.mjs --era 8 --hour 12                # dựng ảnh thường CÙNG khung
 *   node scripts/water-score.mjs                                   # chấm mọi kỷ có đủ hai ảnh
 *   node scripts/water-score.mjs --eras 4,5,8
 *   node scripts/water-score.mjs --selftest
 */

import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { decodePng } from './png-probe.mjs';
import { EYE } from './sweepMetric.mjs';

/** Bề dày vành đất lấy mẫu quanh mép nước, tính bằng điểm ảnh. */
export const VANH = 6;

/** Cổng phần trăm khung hình mà Đàm ra cho Bước B. Xem `TECH_DEBT #61`. */
export const CONG_PHAN_TRAM = 5;

/**
 * Điểm ảnh nào là nước, đọc từ ảnh mặt nạ.
 *
 * ⚠️ NHẬN DIỆN BẰNG "ĐỎ TRỘI HẲN", KHÔNG BẰNG `=== 255`. Viền răng cưa của mặt nạ làm kênh đỏ tụt
 * xuống dưới 255 mà điểm ảnh ấy vẫn là nước; đòi bằng đúng 255 là bỏ sót cả đường viền, và đường
 * viền thì dài nhất đúng ở những hình HẸP — tức lại sai đúng chỗ nguy hiểm.
 */
export function matNaNuoc({ pixels, width, height }) {
  const co = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const r = pixels[i * 4]; const g = pixels[i * 4 + 1]; const b = pixels[i * 4 + 2];
    co[i] = (r > 60 && r > g * 2 && r > b * 2) ? 1 : 0;
  }
  return co;
}

/** Khoảng cách RGB/255 giữa hai màu trung bình. Cùng thang với ngưỡng mắt 12. */
export function cachMau(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Chấm một kỷ từ hai tấm ảnh ĐÃ ĐỌC (thuần, test được, không đụng đĩa).
 * @returns {{soNuoc:number, tiLe:number, mauNuoc:number[], mauDat:number[], cach:number}}
 */
export function chamMotKhung(anhThuong, matNa) {
  if (anhThuong.width !== matNa.width || anhThuong.height !== matNa.height) {
    throw new Error(`ảnh thường ${anhThuong.width}×${anhThuong.height} ≠ mặt nạ `
      + `${matNa.width}×${matNa.height} — hai tấm không cùng một khung hình, mọi số rút ra là rác`);
  }
  const W = anhThuong.width; const H = anhThuong.height;
  const laNuoc = matNaNuoc(matNa);

  let soNuoc = 0; const tongNuoc = [0, 0, 0];
  for (let i = 0; i < W * H; i += 1) {
    if (!laNuoc[i]) continue;
    soNuoc += 1;
    for (let k = 0; k < 3; k += 1) tongNuoc[k] += anhThuong.pixels[i * 4 + k];
  }
  if (soNuoc === 0) return { soNuoc: 0, tiLe: 0, mauNuoc: null, mauDat: null, cach: 0 };

  let soDat = 0; const tongDat = [0, 0, 0];
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = y * W + x;
      if (laNuoc[i]) continue;
      let gan = false;
      for (let dy = -VANH; dy <= VANH && !gan; dy += 1) {
        const yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -VANH; dx <= VANH; dx += 1) {
          const xx = x + dx; if (xx < 0 || xx >= W) continue;
          if (laNuoc[yy * W + xx]) { gan = true; break; }
        }
      }
      if (!gan) continue;
      soDat += 1;
      for (let k = 0; k < 3; k += 1) tongDat[k] += anhThuong.pixels[i * 4 + k];
    }
  }
  const mauNuoc = tongNuoc.map((v) => v / soNuoc);
  const mauDat = soDat > 0 ? tongDat.map((v) => v / soDat) : [0, 0, 0];
  return {
    soNuoc, tiLe: soNuoc / (W * H), mauNuoc, mauDat, cach: soDat > 0 ? cachMau(mauNuoc, mauDat) : 0,
  };
}

function duongDan(era, hau = '') {
  const p2 = String(era).padStart(2, '0');
  return `.city-preview/city-era${p2}-light-h12-s40${hau}.png`;
}

function chamTuDia(era) {
  const fThuong = duongDan(era);
  const fNa = duongDan(era, '-mask-water');
  if (!existsSync(fThuong) || !existsSync(fNa)) return null;
  return chamMotKhung(decodePng(readFileSync(fThuong)), decodePng(readFileSync(fNa)));
}

/* ────────────────────────────────────────────────────────────────────────────────────────────
 * TỰ KIỂM — mỗi ca dựng ảnh giả trong bộ nhớ, không đụng đĩa, không cần Chromium.
 *
 * ⚠️ MỖI CA PHẢI CHẠM ĐÚNG MỘT CHIỀU (bài học `--selftest` ở Phase 4C/4G/7B: một phép tự kiểm
 * chứng minh bộ lọc CÓ tác dụng, KHÔNG chứng minh nó có tác dụng ĐÚNG).
 * ──────────────────────────────────────────────────────────────────────────────────────────── */
function anhGia(W, H, ve) {
  const pixels = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const c = ve(x, y);
      const i = (y * W + x) * 4;
      pixels[i] = c[0]; pixels[i + 1] = c[1]; pixels[i + 2] = c[2]; pixels[i + 3] = 255;
    }
  }
  return { width: W, height: H, pixels };
}

function tuKiem() {
  const ca = [];
  const ok = (ten, dieuKien, doDuoc) => ca.push({ ten, dat: dieuKien, doDuoc });

  // (1) TỈ LỆ: một dải nước chiếm đúng 1/4 khung phải ra đúng 25%.
  {
    const W = 40; const H = 40;
    const na = anhGia(W, H, (x, y) => (y < 10 ? [255, 0, 0] : [0, 0, 255]));
    const th = anhGia(W, H, (x, y) => (y < 10 ? [20, 40, 90] : [110, 130, 90]));
    const r = chamMotKhung(th, na);
    ok('dải nước 1/4 khung ra đúng 25,00%', Math.abs(r.tiLe * 100 - 25) < 1e-9, `${(r.tiLe * 100).toFixed(2)}%`);
  }

  // (2) VIỀN RĂNG CƯA: một hàng đỏ mờ (128,20,20) vẫn PHẢI được tính là nước. Đây là ca mà phép
  //     nhận diện `=== 255` sẽ bỏ sót — nới nó ra là mất luôn cả đường viền.
  {
    const W = 20; const H = 20;
    const na = anhGia(W, H, (x, y) => {
      if (y < 5) return [255, 0, 0];
      if (y === 5) return [128, 20, 20];
      return [0, 0, 255];
    });
    const th = anhGia(W, H, () => [50, 50, 50]);
    const r = chamMotKhung(th, na);
    ok('viền răng cưa (128,20,20) vẫn tính là nước', r.soNuoc === 6 * W, `${r.soNuoc} điểm ảnh`);
  }

  // (3) TƯƠNG PHẢN: nước và đất cách nhau đúng 30 trên một kênh phải ra đúng 30.
  {
    const W = 30; const H = 30;
    const na = anhGia(W, H, (x, y) => (y < 15 ? [255, 0, 0] : [0, 0, 255]));
    const th = anhGia(W, H, (x, y) => (y < 15 ? [100, 100, 100] : [100, 130, 100]));
    const r = chamMotKhung(th, na);
    ok('tương phản nước↔đất sát bờ ra đúng 30,0', Math.abs(r.cach - 30) < 1e-6, r.cach.toFixed(4));
  }

  // (4) VÀNH ĐẤT PHẢI LÀ ĐẤT *SÁT BỜ*, KHÔNG PHẢI TRUNG BÌNH CẢ KHUNG. Ca này ĐỎ nếu ai đó đổi
  //     sang lấy trung bình toàn ảnh: đất xa bờ được tô một màu khác hẳn và PHẢI bị bỏ qua.
  {
    const W = 60; const H = 60;
    const na = anhGia(W, H, (x, y) => (y < 20 ? [255, 0, 0] : [0, 0, 255]));
    const th = anhGia(W, H, (x, y) => {
      if (y < 20) return [0, 0, 0];
      if (y < 20 + VANH) return [40, 40, 40];   // đất SÁT bờ
      return [250, 250, 250];                   // đất XA bờ — không được lọt vào phép tính
    });
    const r = chamMotKhung(th, na);
    ok('chỉ lấy đất SÁT bờ, bỏ đất xa bờ', Math.abs(r.cach - Math.hypot(40, 40, 40)) < 1e-6, r.cach.toFixed(2));
  }

  // (5) TỪ CHỐI THẲNG khi hai tấm khác cỡ. Không có vế này thì một cặp ảnh lệch khung sẽ ra một
  //     bảng số hoàn chỉnh và rất thuyết phục — đúng bẫy `MAI-SAU-ky9.png`.
  {
    let nem = false;
    try { chamMotKhung(anhGia(10, 10, () => [0, 0, 0]), anhGia(10, 11, () => [0, 0, 0])); }
    catch { nem = true; }
    ok('hai tấm khác cỡ ⇒ NÉM LỖI, không trả số', nem, nem ? 'đã ném' : 'KHÔNG ném');
  }

  // (6) ĐỐI CHỨNG NHỐT BỘ SỐ HỎNG CŨ: phép tia từng báo kỷ 4 là 5,02% (ĐẠT cổng 5%), sự thật đo
  //     trên màn hình là 3,32% (TRƯỢT). Cổng phải còn phân biệt được hai con số ấy.
  {
    ok('cổng còn tách được 5,02% (tia) khỏi 3,32% (màn hình)',
      5.02 >= CONG_PHAN_TRAM && 3.32 < CONG_PHAN_TRAM, `cổng = ${CONG_PHAN_TRAM}%`);
  }

  let hong = 0;
  for (const c of ca) {
    console.log(`${c.dat ? '✓' : '✗'} ${c.ten}  (đo được: ${c.doDuoc})`);
    if (!c.dat) hong += 1;
  }
  console.log(hong === 0 ? '\nTẤT CẢ ĐẠT' : `\n${hong} CA HỎNG`);
  return hong === 0;
}

function chay() {
  const argv = process.argv.slice(2);
  if (argv.includes('--selftest')) { process.exit(tuKiem() ? 0 : 1); }

  const i = argv.indexOf('--eras');
  const eras = i >= 0 && argv[i + 1]
    ? argv[i + 1].split(',').map(Number)
    : Array.from({ length: 15 }, (_, k) => k + 1);

  console.log(`cổng = ${CONG_PHAN_TRAM}% khung hình · ngưỡng mắt = ${EYE}/255 · vành đất ${VANH} điểm ảnh`);
  console.log('(đo trên ẢNH ĐÃ DỰNG qua --mask water, KHÔNG phải phép tia của water-view.mjs)\n');
  console.log('kỷ | % khung | cổng 5% | nước (R,G,B) | đất sát bờ  | cách nhau | đọc ra?');
  let dat = 0; let co = 0;
  for (const era of eras) {
    const r = chamTuDia(era);
    if (!r) { console.log(`${String(era).padStart(2)} | (thiếu ảnh — dựng bằng --mask water trước)`); continue; }
    if (r.soNuoc === 0) { console.log(`${String(era).padStart(2)} |   0,00% |    —    | (không có nước trong khung)`); continue; }
    co += 1;
    const quaCong = r.tiLe * 100 >= CONG_PHAN_TRAM;
    if (quaCong) dat += 1;
    console.log(
      `${String(era).padStart(2)} | ${(r.tiLe * 100).toFixed(2).padStart(6)}% | `
      + `${(quaCong ? '  ĐẠT  ' : ' TRƯỢT ')} | `
      + `${r.mauNuoc.map((v) => v.toFixed(0).padStart(3)).join(',')}  | `
      + `${r.mauDat.map((v) => v.toFixed(0).padStart(3)).join(',')} | `
      + `${r.cach.toFixed(1).padStart(9)} | ${r.cach >= EYE ? '✓ CÓ' : '✗ KHÔNG'}`,
    );
  }
  console.log(`\n⇒ ${dat}/${co} kỷ có nước đạt cổng ${CONG_PHAN_TRAM}% khung hình.`);
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) chay();
