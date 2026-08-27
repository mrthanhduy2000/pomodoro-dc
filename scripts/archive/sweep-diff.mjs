/**
 * sweep-diff.mjs — SO HAI BẢN QUÉT VỚI NHAU, Ô ĐỐI Ô.
 *
 * ⚠️ VÌ SAO CẦN MỘT CÔNG CỤ RIÊNG, TRONG KHI ĐÃ CÓ `sweep-score.mjs`.
 * `sweep-score.mjs` trả lời *"15 kỷ có khác NHAU không"* — một câu hỏi về BÊN TRONG một bản quét.
 * Nó hoàn toàn có thể báo "105/105 đạt" ở cả bản trước lẫn bản sau trong khi **hai bản giống hệt
 * nhau**, tức phase vừa rồi không đổi được gì mà bảng điểm vẫn xanh. Đàm đã nói thẳng đúng cái bẫy
 * ấy: *"nếu hai bản quét vẫn khó phân biệt thì phase này CHƯA đạt mục tiêu của nó — đừng khoe test
 * xanh thay cho kết quả nhìn được."*
 *
 * ⚠️ **CÙNG ĐƠN VỊ, CÙNG NGƯỠNG, CÙNG PHÉP ĐO** với `sweep-score.mjs`: vẫn `gridVector` trên lưới
 * 6×3 ô con của dải thành phố, vẫn khoảng cách RGB/255, vẫn ngưỡng mắt **12** hiệu chuẩn ở Phase
 * 3Y. Không dựng thang mới — tạo một ngưỡng chưa hiệu chuẩn là đúng cái phễu Phase 9A đã dạy.
 *
 * ⚠️ HAI ẢNH PHẢI CÙNG HÌNH HỌC. Hồ sơ `.geom.json` của cả hai được đối chiếu; lệch một trường thì
 * DỪNG, không tự chỉnh — đo hai tấm ảnh có lưới khác nhau là đang so ô này với ô kia (bẫy `--cell
 * 260 vs 300`, Phase 4G).
 *
 * ⚠️ **BẢN QUÉT LÀ THANG NHỎ NHẤT DỰ ÁN CÓ, VÀ NÓ KHÔNG PHẢI THANG ĐÀM DÙNG APP.** Đo ngày
 * 2026-08-18 (Phase 11) trên cùng một thay đổi, ba thang khác nhau, cùng đơn vị RGB/255:
 *
 *     bản quét (một thành phố ≈ 300 × 186)  → trung vị **2,2** · 90/90 ô DƯỚI ngưỡng mắt 12
 *     khung app (1134 × 780, `--frame`)      → **5,3%** điểm ảnh đổi quá ngưỡng (kỷ 9)
 *     zoom 0,45 sát mái (`--frame`)          → **15,1%** điểm ảnh đổi · lệch TB 15,1 (kỷ 9)
 *
 * ⚠️ **BỘ SỐ TRÊN ĐÃ ĐO LẠI NGÀY 2026-08-18 SAU KHI PHÁT HIỆN BẢN CŨ KHÔNG TRUY ĐƯỢC NGUỒN.** Bản
 * đầu ghi 4,5% / 16,5%, đo trên hai file tên là `MAI-TRUOC-ky9.png` / `MAI-SAU-ky9.png`. Kiểm lại
 * bằng `md5sum` thì `MAI-SAU-ky9.png` **trùng từng byte** với `city-era09-light-h12.png` — tức nó
 * là ảnh khung THƯỜNG mang cái tên "cận mái", còn vế TRƯỚC thì không còn cách nào biết đã chụp
 * bằng cờ gì. Hai con số ấy có thể đúng, có thể là so một tấm zoom với một tấm không zoom; **không
 * kiểm được thì không được dùng**. Bộ số hiện tại chụp lại từ đầu: `git worktree` ở `e089c00` cho
 * vế TRƯỚC, cây làm việc cho vế SAU, **cùng một dòng lệnh**, tên file ghi rõ mức zoom.
 *
 * ⇒ Một kết quả "0/90 phân biệt được" ở đây **KHÔNG** chứng minh phase vừa rồi chẳng đổi gì; nó
 * chứng minh thay đổi ấy không sống sót tới thang 300px. Muốn biết đổi bao nhiêu thì phải đo THÊM
 * ở thang app. ⚠️ Và cũng đừng đảo lại: bản quét vẫn là mục kiểm bắt buộc, vì nó là chỗ DUY NHẤT
 * đặt 15 kỷ cạnh nhau — *"lỗi mỹ thuật gần như luôn là lỗi SO SÁNH"*.
 *
 * ⚠️ **`--zoom` NHÂN VÀO KHOẢNG CÁCH CAMERA, nên `--zoom 2.2` là LÙI RA XA, không phải lại gần.**
 * Đã đo nhầm một lượt vì đọc ngược cờ này: "sát mái" ra 0,9% (thật ra là lùi xa), đo lại đúng
 * (`--zoom 0.45`) ra 16,5%. Muốn soi chi tiết thì dùng số **NHỎ HƠN 1**.
 *
 * Dùng:  node scripts/sweep-diff.mjs <trước.png> <sau.png> [--selftest]
 */

import { readFileSync } from 'node:fs';
import { decodePng } from '../png-probe.mjs';
import {
  BANDS, cityRect, coTheoMatNa, EYE, gridVector, soHaiKhung, vecDist,
} from '../sweepMetric.mjs';

const argv = process.argv.slice(2);
const SELFTEST = argv.includes('--selftest');
const FRAME = argv.includes('--frame');
/**
 * `--chi <mặt-nạ.png>:<r|g|b>` — CHỈ so những điểm ảnh mà mặt nạ ấy tô kênh ấy.
 *
 * ⚠️ VÌ SAO NÓ NẰM Ở ĐÂY chứ không phải một script thứ ba: đây vẫn là đúng một câu hỏi *"hai ảnh
 * này khác nhau bao nhiêu"*, chỉ khác **mẫu số**. Viết riêng ra là chép ngưỡng mắt 12 lần thứ ba,
 * đúng bẫy "một luật hai công thức". Và bài học đo mật độ nhà (2026-08-19) nói thẳng: **mẫu số là
 * vế không ai kiểm** — nên vế ấy phải nằm cạnh vế tử, trong cùng một hàm.
 *
 * Luật chọn điểm ảnh dùng CHUNG với `mask-count.mjs`: kênh trội, và phải ≥ NGUONG_MAT_NA. Không
 * dùng ngưỡng tuyệt đối trên một kênh (viền răng cưa sẽ lọt cả ba nhóm).
 */
// ⚠️ `indexOf` trả về -1 khi không có cờ, và `-1 + 1 === 0` ⇒ nhánh dự phòng sẽ nhặt đúng THAM SỐ
// ĐẦU TIÊN rồi coi nó là mặt nạ. Bản đầu dính đúng lỗi đó và mọi lần gọi KHÔNG có `--chi` đều chết
// với thông báo về `--chi`. Phải hỏi "cờ có mặt không" TRƯỚC, đừng hỏi "chỉ số là bao nhiêu".
const viTriChi = argv.findIndex((a) => a === '--chi' || a.startsWith('--chi='));
const CHI = viTriChi < 0 ? ''
  : (argv[viTriChi].startsWith('--chi=') ? argv[viTriChi].slice(6) : (argv[viTriChi + 1] ?? ''));
const NGUONG_MAT_NA = 40;
const [TRUOC, SAU] = argv.filter((a) => !a.startsWith('--') && a !== CHI);

if (!TRUOC || !SAU) {
  console.error('Dùng: node scripts/sweep-diff.mjs <trước.png> <sau.png> [--frame] [--chi <mặt-nạ.png>:<r|g|b>] [--selftest]');
  process.exit(1);
}

/** Cờ bật/tắt từng điểm ảnh theo mặt nạ. Trả về `null` nếu không dùng `--chi`. */
function docMatNa(width, height) {
  if (!CHI) return null;
  const m = CHI.match(/^(.*):([rgb])$/);
  if (!m) { console.error('✗ `--chi` phải có dạng <đường-dẫn.png>:<r|g|b>'); process.exit(1); }
  const [, duong, kenh] = m;
  const mn = decodePng(readFileSync(duong));
  if (mn.width !== width || mn.height !== height) {
    console.error(`✗ Mặt nạ khác cỡ ảnh: ${mn.width}×${mn.height} ≠ ${width}×${height}.`);
    process.exit(3);
  }
  const { co, dem } = coTheoMatNa(mn, kenh, NGUONG_MAT_NA);
  if (dem === 0) {
    console.error(`✗ Mặt nạ "${duong}" kênh ${kenh} không chọn được điểm ảnh nào — sai kênh?`);
    process.exit(3);
  }
  return { co, dem, duong, kenh };
}

/**
 * CHẾ ĐỘ `--frame`: so hai ảnh chụp MỘT cảnh (không phải bản quét), điểm ảnh đối điểm ảnh.
 *
 * ⚠️ VÌ SAO NÓ NẰM TRONG CHÍNH FILE NÀY chứ không phải một script thứ hai: nó phải dùng **cùng đơn
 * vị và cùng ngưỡng** với chế độ quét, nếu không thì hai con số của cùng một thay đổi sẽ không đặt
 * cạnh nhau được — mà đặt-cạnh-nhau chính là việc duy nhất của công cụ này. Tách ra file riêng là
 * tạo bản chép thứ hai của ngưỡng 12, đúng cái bẫy "một luật hai công thức".
 *
 * ⚠️ Đây là một phép đo KHÁC câu hỏi, không phải một phép đo "tốt hơn": chế độ quét trả lời *"đặt 15
 * kỷ cạnh nhau thì có thấy khác không"*, chế độ này trả lời *"đúng một cảnh ấy đổi bao nhiêu"*. Một
 * cảnh đổi mạnh vẫn có thể biến mất ở thang quét, và ngược lại một bản quét đổi đều có thể chẳng do
 * kỷ nào đổi nhiều. Đọc CẢ HAI, đừng chọn con số dễ nghe.
 */
function soKhungHinh() {
  const a = decodePng(readFileSync(TRUOC));
  const b = decodePng(readFileSync(SAU));
  if (a.width !== b.width || a.height !== b.height) {
    console.error(`✗ Hai ảnh khác cỡ: ${a.width}×${a.height} ≠ ${b.width}×${b.height}.`);
    console.error('  Chụp lại cả hai bằng CÙNG bộ cờ (kể cả --zoom, --width, --no-shadow).');
    process.exit(3);
  }
  // Phép tự-kiểm phải chạm đúng chiều nó bảo chứng: "cùng toạ độ ⇒ cùng điểm ảnh".
  if (SELFTEST) {
    const tu = soHaiKhung(a, a);
    console.log(`tự-kiểm "ảnh so với chính nó": ${tu.tiLe.toFixed(6)}% điểm ảnh đổi · lệch TB ${tu.lechTB.toFixed(6)}`);
    if (tu.tiLe > 1e-9 || tu.lechTB > 1e-9) {
      console.error('✗ Phép lấy mẫu KHÔNG tất định — mọi số dưới đây là rác.');
      process.exit(4);
    }
    console.log('✓ phép lấy mẫu tất định\n');
  }
  const mn = docMatNa(a.width, a.height);
  // Đối chứng của chính `--chi`: một mặt nạ bật MỌI điểm ảnh phải cho ra ĐÚNG bộ số không-mặt-nạ.
  // Không có vế này thì một lỗi trong vòng lặp mặt nạ sẽ đi thẳng vào báo cáo.
  if (SELFTEST && mn) {
    const het = soHaiKhung(a, b, new Uint8Array(a.width * a.height).fill(1));
    const khong = soHaiKhung(a, b);
    if (Math.abs(het.lechTB - khong.lechTB) > 1e-9 || het.xet !== khong.xet) {
      console.error('✗ Nhánh mặt nạ KHÔNG trùng nhánh không-mặt-nạ khi bật hết — vòng lặp sai.');
      process.exit(4);
    }
    console.log(`✓ mặt nạ bật-hết trùng khớp nhánh thường (${het.xet} điểm ảnh)\n`);
  }
  const r = soHaiKhung(a, b, mn?.co ?? null);
  console.log(`${TRUOC}\n  ↕ so ĐIỂM ẢNH ĐỐI ĐIỂM ẢNH với\n${SAU}\n`);
  console.log(`── ${a.width}×${a.height} · khoảng cách RGB/255 · ngưỡng mắt ${EYE} ──`);
  if (mn) {
    console.log(`  CHỈ trong mặt nạ ${mn.duong} kênh ${mn.kenh}: ${mn.dem} điểm ảnh `
      + `(${((mn.dem / (a.width * a.height)) * 100).toFixed(2)}% khung hình)`);
  }
  console.log(`  điểm ảnh đổi QUÁ ngưỡng mắt : ${r.tiLe.toFixed(1)}%`);
  console.log(`  lệch trung bình (mọi điểm ảnh): ${r.lechTB.toFixed(2)}`);
  console.log(`  lệch trung bình (chỉ chỗ đã đổi): ${r.lechTBDoi.toFixed(2)}`);
}

if (FRAME) { soKhungHinh(); process.exit(0); }

function docGeom(file) {
  const path = file.replace(/\.png$/, '.geom.json');
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    console.error(`✗ Không đọc được hồ sơ hình học: ${path}`);
    console.error('  Ảnh quét PHẢI đi kèm .geom.json do `city-preview.mjs --sweep` ghi ra.');
    console.error('  ⚠️ ĐỪNG chữa bằng cách đoán lại `--cell` — chính việc đoán đã bịa ra số sai một lần.');
    process.exit(2);
  }
}

const gA = docGeom(TRUOC);
const gB = docGeom(SAU);
for (const k of ['cellW', 'cellH', 'labelH', 'pad', 'xLabel', 'yHeader']) {
  if (gA[k] !== gB[k]) {
    console.error(`✗ Hai bản quét có hình học KHÁC NHAU ở "${k}": ${gA[k]} ≠ ${gB[k]}.`);
    console.error('  So hai lưới khác nhau là so ô này với ô kia — quét lại cả hai bằng cùng tham số.');
    process.exit(3);
  }
}
if (String(gA.eras) !== String(gB.eras) || String(gA.hours) !== String(gB.hours)) {
  console.error('✗ Hai bản quét không cùng danh sách kỷ/giờ.');
  process.exit(3);
}

const pngA = decodePng(readFileSync(TRUOC));
const pngB = decodePng(readFileSync(SAU));
const X0 = gA.pad + gA.xLabel;
const Y0 = gA.pad + gA.yHeader;
const STRIDE = gA.cellH + gA.labelH;

/** Vector lưới 6×3 của dải THÀNH PHỐ ở ô (hàng kỷ r, cột chặng c). */
function oCity(png, r, c) {
  const rect = cityRect(
    { x0: X0 + c * gA.cellW, y0: Y0 + r * STRIDE, cellW: gA.cellW, cellH: gA.cellH },
    BANDS[1],
  );
  return gridVector(png, rect);
}

// ── PHÉP TỰ-KIỂM: so một ảnh với CHÍNH NÓ phải ra 0 ở mọi ô ──────────────────────────────────
// ⚠️ Đây là mục kiểm rẻ nhất mà bắt được nhiều thứ nhất: nếu nó KHÔNG ra 0 thì phép lấy mẫu đang
// đọc lệch ô (bẫy Phase 4G), và mọi con số bên dưới là rác. Một phép tự-kiểm phải chạm tới đúng
// chiều nó muốn bảo chứng — ở đây là "cùng toạ độ ⇒ cùng điểm ảnh", đúng thứ dễ sai nhất.
if (SELFTEST) {
  let max = 0;
  for (let r = 0; r < gA.eras.length; r += 1) {
    for (let c = 0; c < gA.hours.length; c += 1) {
      max = Math.max(max, vecDist(oCity(pngA, r, c), oCity(pngA, r, c)));
    }
  }
  console.log(`tự-kiểm "ảnh so với chính nó" trên ${gA.eras.length * gA.hours.length} ô: lệch tối đa ${max.toFixed(6)}`);
  if (max > 1e-9) { console.error('✗ Phép lấy mẫu KHÔNG tất định — mọi số dưới đây là rác.'); process.exit(4); }
  console.log('✓ phép lấy mẫu tất định\n');
}

// ── ĐO ─────────────────────────────────────────────────────────────────────────────────────────
const o = [];
for (let r = 0; r < gA.eras.length; r += 1) {
  for (let c = 0; c < gA.hours.length; c += 1) {
    o.push({ era: gA.eras[r], gio: gA.hours[c], d: vecDist(oCity(pngA, r, c), oCity(pngB, r, c)) });
  }
}
o.sort((a, b) => a.d - b.d);
const ds = o.map((x) => x.d);
const trungVi = ds[Math.floor(ds.length / 2)];
const duoiNguong = o.filter((x) => x.d < EYE);

console.log(`${TRUOC}\n  ↕ so ô-đối-ô với\n${SAU}\n`);
console.log(`── ${o.length} Ô (${gA.eras.length} kỷ × ${gA.hours.length} chặng) · dải thành phố · lưới 6×3 ô con ──`);
console.log(`  đổi ÍT nhất : ${o.slice(0, 3).map((x) => `kỷ ${x.era}@${x.gio}h = ${x.d.toFixed(1)}`).join(' · ')}`);
console.log(`  đổi NHIỀU nhất: ${o.slice(-3).reverse().map((x) => `kỷ ${x.era}@${x.gio}h = ${x.d.toFixed(1)}`).join(' · ')}`);
console.log(`  trung vị ${trungVi.toFixed(1)} · ngưỡng mắt ${EYE}`);
console.log(`  ô KHÔNG phân biệt được bằng mắt (< ${EYE}): ${duoiNguong.length}/${o.length}`);

// Đổi theo TỪNG KỶ — vì một kỷ đổi mạnh có thể kéo trung vị lên và che 14 kỷ đứng yên.
console.log('\n── theo TỪNG KỶ (trung bình 6 chặng) ──');
const theoKy = gA.eras.map((era) => {
  const ds2 = o.filter((x) => x.era === era).map((x) => x.d);
  return { era, tb: ds2.reduce((s, v) => s + v, 0) / ds2.length };
});
console.log(theoKy.map((k) => `k${k.era}:${k.tb.toFixed(0)}`).join(' '));
const kyDung = theoKy.filter((k) => k.tb < EYE);
if (kyDung.length) {
  console.log(`\n⚠️ ${kyDung.length}/${gA.eras.length} KỶ GẦN NHƯ KHÔNG ĐỔI: ${kyDung.map((k) => `kỷ ${k.era} (${k.tb.toFixed(1)})`).join(' · ')}`);
} else {
  console.log(`\n✓ CẢ ${gA.eras.length} KỶ ĐỀU ĐỔI TRÊN NGƯỠNG MẮT — hai bản quét phân biệt được ở mọi kỷ.`);
}
