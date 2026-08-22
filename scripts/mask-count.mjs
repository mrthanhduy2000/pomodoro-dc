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
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

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

/**
 * ĐẾM THEO DẢI NGANG — dùng cho phép đo (M2) "dấu vết con người trải tới mấy tầng chiều sâu".
 *
 * ⚠️ DẢI TRÊN MÀN HÌNH KHÔNG PHẢI CHIỀU SÂU THẾ GIỚI, và đây là chỗ dễ nói dối nhất của phép đo
 * này. Camera ngẩng 34,4° và mặt đất có cao độ, nên quan hệ hàng-ảnh ↔ chiều sâu là ĐƠN ĐIỆU
 * nhưng KHÔNG tuyến tính: một dải ở gần đỉnh khung phủ nhiều ô thế giới hơn một dải ở đáy. Vì
 * vậy con số này chỉ được đọc là *"dấu vết con người có mặt ở mấy tầng khác nhau của khung hình"*,
 * KHÔNG được đọc là *"trải xa bao nhiêu ô"*. Tính đơn điệu ấy phải được ĐO trên ảnh thật (xem
 * `--selftest-sau` ở `scripts/band-depth.mjs`), không được suy từ lý lẽ.
 *
 * Trả về mảng N phần tử, mỗi phần tử là kết quả `countChannels` của riêng dải ấy.
 */
export function countBands(pixels, width, height, bands) {
  if (!Number.isInteger(bands) || bands < 1) throw new Error('số dải phải là số nguyên ≥ 1');
  const out = [];
  for (let b = 0; b < bands; b += 1) {
    // ⚠️ Mốc chia phải suy từ CÙNG một công thức cho cả hai đầu, nếu không dải cuối sẽ hụt hoặc
    // thừa vài hàng và tổng các dải không bằng cả khung — một sai lệch im lặng.
    const y0 = Math.floor((b * height) / bands);
    const y1 = Math.floor(((b + 1) * height) / bands);
    out.push(countChannels(pixels.subarray(y0 * width * 4, y1 * width * 4)));
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

  // ── ĐỐI CHỨNG DẢI NGANG ────────────────────────────────────────────────────────────────────
  // Ảnh 2×6: đặt MỘT điểm ảnh đỏ ở hàng 4. Chia 6 dải ⇒ nó PHẢI rơi vào dải thứ 5 (chỉ số 4).
  // ⚠️ Đây là phép kiểm SỐ HỌC của việc chia dải. Nó KHÔNG chứng minh dải trên màn hình tương
  // ứng chiều sâu thế giới — đại lượng ấy phải đo trên ảnh render thật (`scripts/band-depth.mjs`).
  // Ghi rõ ranh giới ấy ra đây, vì "tự kiểm xanh" rất dễ bị đọc thành "cả phép đo đã được bảo chứng".
  {
    const W = 2, H = 6;
    const px = new Uint8Array(W * H * 4);
    for (let i = 0; i < W * H; i += 1) px[i * 4 + 3] = 255;   // đen tuyền, alpha đủ
    px[(4 * W + 0) * 4] = 255;                                 // hàng 4, cột 0 → đỏ
    const bs = countBands(px, W, H, 6);
    if (bs.length !== 6) throw new Error('selftest hỏng: sai số dải');
    const coDo = bs.map((b) => b.do);
    if (JSON.stringify(coDo) !== JSON.stringify([0, 0, 0, 0, 1, 0])) {
      throw new Error(`selftest hỏng: điểm ảnh hàng 4 rơi nhầm dải — ${JSON.stringify(coDo)}`);
    }
    // Tổng các dải phải bằng đúng cả khung: không hàng nào bị bỏ, không hàng nào bị đếm hai lần.
    const tongDai = bs.reduce((s2, b) => s2 + b.tong, 0);
    if (tongDai !== countChannels(px).tong) throw new Error('selftest hỏng: các dải không phủ kín khung');
    // Và số dải KHÔNG chia hết chiều cao cũng phải phủ kín (6 hàng / 4 dải).
    const bs4 = countBands(px, W, H, 4);
    if (bs4.reduce((s2, b) => s2 + b.tong, 0) !== W * H) throw new Error('selftest hỏng: 4 dải trên 6 hàng bị hụt');
  }
  console.log('✓ selftest: tách đúng 3 kênh + nền, kể cả khi hai kênh cùng độ sáng; nền trang bị loại khỏi mẫu số; chia dải ngang phủ kín khung');
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--selftest')) { selftest(); process.exit(0); }

  // ⚠️ `--bands 6` có một GIÁ TRỊ đi kèm, và giá trị ấy không bắt đầu bằng `--`. Lọc thô theo
  // tiền tố sẽ nhét số 6 vào danh sách TÊN LỚP, làm nhãn lệch một nấc mà không có gì đỏ lên.
  const CO_GIA_TRI = new Set(['--bands']);
  const tuDo = argv.filter((a, i) => !a.startsWith('--') && !CO_GIA_TRI.has(argv[i - 1]));
  const [file, ...names] = tuDo;
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
  // ⚠️ TỪ 2026-08-19 CON SỐ NÀY PHẢI LÀ 0 — VÀ ĐÓ LÀ MỘT PHÉP ĐỐI CHIẾU CHÉO, KHÔNG PHẢI TRANG TRÍ.
  // `city-preview.mjs` nay chụp bằng CDP `clip` đúng hộp bao canvas (`TECH_DEBT #49`), nên trong
  // ảnh KHÔNG còn một điểm nền trang nào. Khác 0 nghĩa là cái `clip` đã trượt — tức tấm ảnh này
  // không phải khung hình mà nó tự nhận, và mọi tỉ lệ dưới đây đang chia cho một mẫu số sai.
  // Màu mốc `rgb(1,2,3)` vì thế đổi vai: từ BẢN VÁ thành LƯỚI AN TOÀN nói ra khi bản vá kia hỏng.
  if (c.ngoai > 0) {
    console.log(`  ⚠️  CÓ ${c.ngoai.toLocaleString('vi-VN')} ĐIỂM NỀN TRANG TRONG ẢNH — đáng lẽ phải là 0.`);
    console.log('     Ảnh này chụp bằng bản CŨ (trước bản vá TECH_DEBT #49), hoặc `clip` đang trượt.');
    console.log('     Chụp lại: node scripts/city-preview.mjs --era <N> --hour <H> --mask <a,b,c>');
  }
  console.log(`  ${nhan[0].padEnd(12)} ${pct(c.do)}%`);
  console.log(`  ${nhan[1].padEnd(12)} ${pct(c.luc)}%`);
  console.log(`  ${nhan[2].padEnd(12)} ${pct(c.lam)}%`);
  console.log(`  ${'(nền/khác)'.padEnd(12)} ${pct(c.nen)}%`);

  // ── (M2) CHIA DẢI NGANG ────────────────────────────────────────────────────────────────────
  // `--bands N` in thêm bảng N dải, mỗi ô là % CỦA RIÊNG DẢI ẤY (không phải % cả khung) — vì
  // ngưỡng của (M2) phát biểu là "dải này có bao nhiêu phần trăm là dấu vết con người", nên mẫu
  // số phải là diện tích dải. Chia cho cả khung thì dải nào cũng nhỏ và ngưỡng thành vô nghĩa.
  const iB = argv.indexOf('--bands');
  if (iB >= 0) {
    const n = Number(argv[iB + 1]);
    const bs = countBands(img.pixels, img.width, img.height, n);
    console.log(`  ── ${n} dải ngang (dải 1 = XA nhất / trên cùng khung) · % CỦA RIÊNG DẢI ──`);
    console.log(`     ${'dải'.padEnd(5)}${nhan[0].padStart(12)}${nhan[1].padStart(12)}${nhan[2].padStart(12)}`);
    bs.forEach((b, i) => {
      const p2 = (v) => (b.tong ? ((v / b.tong) * 100).toFixed(2) : '0.00').padStart(12);
      console.log(`     ${String(i + 1).padEnd(5)}${p2(b.do)}${p2(b.luc)}${p2(b.lam)}`);
    });
  }
}

// ⚠️ CHẠY CLI CHỈ KHI ĐƯỢC GỌI THẲNG. Cùng khuôn với `png-probe.mjs`: nếu để mã CLI ở cấp module
// thì mọi lượt `import { countChannels }` từ một script khác sẽ chạy luôn phần đọc tham số dòng
// lệnh, thấy thiếu tên file rồi `process.exit(1)` — một hàm thuần bỗng giết tiến trình gọi nó.
if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) main();
