/**
 * mask-count.mjs — ĐẾM XEM MỖI LỚP CHIẾM BAO NHIÊU PHẦN KHUNG HÌNH.
 *
 * Đọc một tấm ảnh MẶT NẠ do `city-preview.mjs --mask a,b,c` dựng ra (mỗi tên một kênh màu: đỏ ·
 * lục · lam, mọi thứ khác đen tuyền) rồi trả về tỉ lệ điểm ảnh của từng lớp.
 *
 * ⚠️ VÌ SAO KHÔNG DÒ BẰNG MÀU CỦA ẢNH THẬT. `TECH_DEBT #22` đã trả giá ba phase cho bài học ấy:
 * bộ lọc "8% điểm ảnh tươi nhất ≈ mái" thật ra chấm CỎ, và không ai biết suốt ba phase. Ở đây bên
 * DỰNG nói ra khối nào là khối nào (`mesh.name`), nên phép đếm không chứa một giả định mỹ thuật
 * nào — nó chỉ đếm kênh màu.
 *
 * ⚠️ PHÂN LOẠI THEO "KÊNH NÀO LỚN NHẤT", KHÔNG THEO NGƯỠNG TUYỆT ĐỐI. Cùng lý do đã ghi trong
 * `city-preview.mjs`: đường cong tông (`NeutralToneMapping` + sRGB) bóp mạnh vùng sáng nên một
 * ngưỡng tuyệt đối sẽ trôi; nhưng mọi đường cong ấy đều ĐƠN ĐIỆU và áp riêng từng kênh, nên đỏ
 * thuần vẫn cứ đỏ hơn hai kênh kia. Điểm ảnh mà cả ba kênh đều dưới `MIN` là NỀN (trời, hoặc lớp
 * không được đặt tên trong lượt này).
 *
 * ⚠️ VIỀN RĂNG CƯA là một lớp thứ tư có thật. Chỗ giáp ranh giữa hai lớp bị pha, và pha thì kênh
 * lớn nhất vẫn đúng lớp chiếm phần lớn điểm ảnh ấy ⇒ sai số dồn về đúng phía "lớp to hơn", cỡ
 * dưới 1%. Vì vậy đừng đọc con số này tới chữ số thập phân thứ hai.
 *
 * Dùng:  node scripts/mask-count.mjs <ảnh.png> <tên-đỏ> <tên-lục> <tên-lam>
 *        node scripts/mask-count.mjs --selftest
 */

import { existsSync, readFileSync } from 'node:fs';
import { decodePng } from './png-probe.mjs';

/** Dưới mức này ở CẢ BA kênh thì coi là nền đen (không thuộc lớp nào được đặt tên). */
const MIN = 40;

/**
 * MÀU MỐC "KHÔNG PHẢI KHUNG HÌNH" — do chính `city-preview.mjs` tô lên phần trang nằm ngoài canvas.
 *
 * ⚠️ ĐÂY LÀ MẪU SỐ, VÀ NÓ ĐÃ SAI HAI LẦN. Ảnh chụp rộng hơn canvas (đệm 16px + dòng số liệu), nên
 * nền trang lọt vào ảnh. (1) Bản đầu tô nó ĐEN ⇒ lẫn hoàn toàn vào "không có lớp nào" của cảnh, tức
 * mọi tỉ lệ đều thấp hơn sự thật ~13%. (2) Bản vá thứ hai khai toạ độ canvas ra `.geom.json` rồi
 * cắt theo — vẫn sai, vì khung nhìn thật chỉ cao 693 nên canvas bị xén mất 23 dòng: con số KHAI
 * (700) lớn hơn số dòng thật sự vẽ (677), và phần chênh lại rơi vào mẫu số. Đúng bài học
 * `TECH_DEBT #44`: trước khi tin một tỉ lệ, hỏi "mẫu số có lẫn thứ không thuộc câu hỏi không?".
 *
 * ⇒ Nay bên DỰNG tự đánh dấu, bên ĐẾM chỉ việc loại ra — không ai phải khai, đoán, hay cắt theo
 * một con số có thể trôi. Bộ ba (1,2,3) an toàn vì mặt nạ chỉ tô ba màu THUẦN một kênh, nên mọi
 * điểm ảnh (kể cả viền răng cưa) đều có đúng một kênh khác 0.
 */
const NGOAI_KHUNG = [1, 2, 3];

/** Đếm điểm ảnh theo kênh trội. Trả về `{đỏ, lục, lam, nền, tổng}` — số ĐIỂM ẢNH, không phải %. */
export function countChannels(pixels) {
  const out = { do: 0, luc: 0, lam: 0, nen: 0, ngoai: 0, tong: 0 };
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]; const g = pixels[i + 1]; const b = pixels[i + 2];
    if (r === NGOAI_KHUNG[0] && g === NGOAI_KHUNG[1] && b === NGOAI_KHUNG[2]) { out.ngoai += 1; continue; }
    out.tong += 1;
    if (r < MIN && g < MIN && b < MIN) { out.nen += 1; continue; }
    if (r >= g && r >= b) out.do += 1;
    else if (g >= b) out.luc += 1;
    else out.lam += 1;
  }
  return out;
}

function selftest() {
  // Bốn điểm ảnh, mỗi lớp một cái: đỏ · lục · lam · đen.
  const px = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 0, 0, 0, 255]);
  const c = countChannels(px);
  const mong = { do: 1, luc: 1, lam: 1, nen: 1, tong: 4 };
  for (const k of Object.keys(mong)) {
    if (c[k] !== mong[k]) throw new Error(`selftest hỏng: ${k} ra ${c[k]}, mong ${mong[k]}`);
  }
  // ĐỐI CHỨNG — phải phân biệt được hai lớp KỀ NHAU về độ sáng nhưng khác kênh. Một phép đếm dùng
  // MỨC XÁM sẽ gộp hai điểm ảnh dưới đây làm một; phép đếm theo kênh thì không.
  const px2 = new Uint8Array([200, 10, 10, 255, 10, 200, 10, 255]);
  const c2 = countChannels(px2);
  if (c2.do !== 1 || c2.luc !== 1) throw new Error('selftest hỏng: không tách được hai kênh cùng độ sáng');
  // ĐỐI CHỨNG 2 — nền phải THẬT SỰ được loại, không phải rơi vào kênh đỏ vì `r >= g && r >= b`.
  const c3 = countChannels(new Uint8Array([30, 30, 30, 255]));
  if (c3.nen !== 1 || c3.do !== 0) throw new Error('selftest hỏng: điểm ảnh tối bị tính thành một lớp');

  // ĐỐI CHỨNG 3 — MÀU MỐC PHẢI BỊ LOẠI KHỎI MẪU SỐ, KHÔNG PHẢI CHỈ ĐƯỢC XẾP RIÊNG MỘT NHÓM.
  // Dựng 4 điểm ảnh: 1 đỏ + 3 điểm nền trang. Nếu nền trang lọt vào mẫu số thì đỏ ra 25%; loại
  // đúng thì đỏ ra 100%. Đây chính là hình dạng sai đã làm bảng mật độ đầu tiên thấp hơn sự thật ở
  // MỌI ô, nên nó phải có một đối chứng riêng thay vì tin vào chú thích.
  const tam = new Uint8Array([255, 0, 0, 255, 1, 2, 3, 255, 1, 2, 3, 255, 1, 2, 3, 255]);
  const ct = countChannels(tam);
  if (ct.tong !== 1 || ct.do !== 1 || ct.ngoai !== 3) {
    throw new Error(`selftest hỏng: nền trang vẫn nằm trong mẫu số — ${JSON.stringify(ct)}`);
  }
  // Và màu mốc phải là một bộ ba CHÍNH XÁC: lệch một đơn vị thôi cũng phải quay về làm điểm ảnh
  // thường, nếu không nó sẽ nuốt oan cả một dải màu tối của cảnh.
  const cl = countChannels(new Uint8Array([1, 2, 4, 255]));
  if (cl.ngoai !== 0 || cl.nen !== 1) throw new Error('selftest hỏng: màu gần-mốc bị loại oan');
  console.log('✓ selftest: tách đúng 3 kênh + nền, kể cả khi hai kênh cùng độ sáng; nền trang bị loại khỏi mẫu số');
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--selftest')) { selftest(); process.exit(0); }

  const [file, ...names] = argv.filter((a) => !a.startsWith('--'));
  if (!file) {
    console.error('Dùng: node scripts/mask-count.mjs <ảnh.png> [tên-đỏ tên-lục tên-lam]');
    process.exit(1);
  }
  const img = decodePng(readFileSync(file));
  const c = countChannels(img.pixels);
  const pct = (n) => ((n / c.tong) * 100).toFixed(2).padStart(6);
  const nhan = [names[0] ?? 'đỏ', names[1] ?? 'lục', names[2] ?? 'lam'];
  console.log(`── ảnh ${img.width}×${img.height}, trong đó KHUNG HÌNH là ${c.tong.toLocaleString('vi-VN')} điểm ảnh `
    + `(đã loại ${c.ngoai.toLocaleString('vi-VN')} điểm nền trang) ──`);
  console.log(`  ${nhan[0].padEnd(12)} ${pct(c.do)}%`);
  console.log(`  ${nhan[1].padEnd(12)} ${pct(c.luc)}%`);
  console.log(`  ${nhan[2].padEnd(12)} ${pct(c.lam)}%`);
  console.log(`  ${'(nền/khác)'.padEnd(12)} ${pct(c.nen)}%`);
}

// ⚠️ CHẠY CLI CHỈ KHI ĐƯỢC GỌI THẲNG. Cùng khuôn với `png-probe.mjs`: nếu để mã CLI ở cấp module
// thì mọi lượt `import { countChannels }` từ một script khác sẽ chạy luôn phần đọc tham số dòng
// lệnh, thấy thiếu tên file rồi `process.exit(1)` — một hàm thuần bỗng giết tiến trình gọi nó.
if (import.meta.url === `file://${process.argv[1]}`) main();
